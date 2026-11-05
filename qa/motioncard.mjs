#!/usr/bin/env node
// A motion card per clip (quality plan item 15 (c), 5 Nov 2026): numbers for "does it move like something alive", from
// the layout's final world positions every frame (stage.js contact(): hands hR/hL, feet fR/fL, body b, in mm), so the
// natural-motion and secondary-motion work (items 8, 12) can be measured before and after instead of judged by eye.
//
//   jerk        the third derivative of position (m/s^3), median over the frames a part moves: a smooth arc keeps it
//               low, a snapped pose or a linear blend that stops dead spikes it. Per part, and its 95th percentile
//   SPARC       spectral arc length of each move's speed curve (Balasubramanian et al. 2012/2015): -1.4 for one
//               minimum-jerk move, -2.2 for two bumps or a linear blend that starts and stops dead; more negative is
//               less smooth. Median of the
//               moves of hands, feet and body
//   synchrony   the share of moves where a hand starts or stops within one frame of the body (the plan's number: lower
//               means overlap, the shoulder first and the hand later, item 12's successive breaking)
//   frozen      from qa/pace.py on the video when one is given (frames that change less than an idle breath)
//
// Moves are stretches where a part's speed (relative to the body for hands and feet, so a walk's swing counts and the
// carry doesn't) stays over 60 mm/s for 4 frames or more; frames next to a cut or a hit-stop are left out. Prints a
// card per actor and a clip line; --json prints the numbers.
//
//   node qa/motioncard.mjs <layout.json> [--sb <storyboard>] [--clip <clip.mp4>] [--json]
//
// A diagnostic, never a fail: the numbers mean something next to another version of the same clip (a flag on and off,
// a bench old | new) or the clips that held best.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cutBetween } from "../engine/page/timeline.js";
import { storyTime } from "../engine/shared/holds.js";

const MOVE = 60, MIN = 4, HERE = path.dirname(fileURLToPath(import.meta.url));
const PARTS = { hR: "right hand", hL: "left hand", fR: "right foot", fL: "left foot", b: "body" };

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (v) => Math.hypot(v[0], v[1], v[2]);

// spectral arc length of one speed profile (fps samples): zero-pad to 4x the next power of two, normalise the magnitude
// spectrum, keep it up to the last frequency over 5 % of its peak (at most 10 Hz), and measure the curve's length
export function sparc(speed, fps, { fc = 10, amp = 0.05, pad = 4 } = {}) {
  const n = 2 ** Math.ceil(Math.log2(speed.length * pad)), re = new Float64Array(n), im = new Float64Array(n);
  speed.forEach((v, i) => (re[i] = v));
  fft(re, im);
  const df = fps / n, kmax = Math.floor(fc / df), mag = [];
  for (let k = 0; k <= kmax; k++) mag.push(Math.hypot(re[k], im[k]));
  const peak = Math.max(...mag) || 1, m = mag.map((x) => x / peak);
  let last = 0; m.forEach((x, k) => { if (x >= amp) last = k; });
  const fn = (last * df) || df;
  let s = 0;
  for (let k = 1; k <= last; k++) s += Math.hypot(df / fn, m[k] - m[k - 1]);
  return -s;
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const a = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) for (let k = 0; k < size / 2; k++) {
      const c = Math.cos(a * k), s = Math.sin(a * k), p = i + k, q = p + size / 2;
      const tr = re[q] * c - im[q] * s, ti = re[q] * s + im[q] * c;
      re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
    }
  }
}

// stretches where speed[i] > MOVE for MIN frames or more, never across a skipped frame: [[a, b)]
function moves(speed, skip) {
  const out = []; let a = -1;
  for (let i = 0; i <= speed.length; i++) {
    const on = i < speed.length && !skip[i] && speed[i] > MOVE;
    if (on && a < 0) a = i;
    if (!on && a >= 0) { if (i - a >= MIN) out.push([a, i]); a = -1; }
  }
  return out;
}

export function motionCard(layout, sb = null, clip = null) {
  const fps = layout.fps || 30, C = layout.contacts || [], n = C.length, dt = 1 / fps;
  // frames to leave out: a cut between this frame and the last, or a hit-stop hold
  const skip = new Array(n).fill(false);
  for (let i = 1; i < n; i++) {
    const s0 = storyTime(sb?.holds, (i - 1) / fps), s1 = storyTime(sb?.holds, i / fps);
    if (s1 === s0 || (sb && cutBetween(sb, s0, s1))) for (let k = Math.max(0, i - 1); k <= Math.min(n - 1, i + 2); k++) skip[k] = true;
  }
  const ids = [...new Set(C.flatMap((c) => (c.actors || []).filter((a) => a.w).map((a) => a.id)))];
  const actors = {}, all = { jerk: [], sparc: [], sync: [0, 0] };
  for (const id of ids) {
    const W = C.map((c) => (c.actors || []).find((a) => a.id === id)?.w || null);
    const card = {};
    const onsets = {};
    for (const k of Object.keys(PARTS)) {
      // positions in m: hands and feet relative to the body, the body in the world
      const P = W.map((w) => (w && w[k] && w.b ? (k === "b" ? w.b : sub(w[k], w.b)).map((x) => x / 1000) : null));
      const v = P.map((p, i) => (i && p && P[i - 1] ? len(sub(p, P[i - 1])) / dt * 1000 : 0)); // mm/s
      const gone = P.map((p, i) => !p || !P[i - 1] || skip[i]);
      const mv = moves(v, gone);
      const jerk = [];
      for (const [a, b] of mv) for (let i = Math.max(a, 3); i < b; i++) {
        if (gone[i - 1] || gone[i - 2] || gone[i - 3]) continue;
        const j = [0, 1, 2].map((x) => (P[i][x] - 3 * P[i - 1][x] + 3 * P[i - 2][x] - P[i - 3][x]) / dt ** 3);
        jerk.push(len(j));
      }
      const sp = mv.map(([a, b]) => sparc(v.slice(Math.max(0, a - 2), Math.min(v.length, b + 2)), fps));
      card[k] = { moves: mv.length, jerk: median(jerk), jerk95: pct(jerk, 0.95), sparc: median(sp) };
      all.jerk.push(...jerk); all.sparc.push(...sp);
      onsets[k] = mv.flatMap(([a, b]) => [a, b]);
    }
    // synchrony: hand starts and stops within one frame of a body start or stop
    let same = 0, tot = 0;
    for (const h of ["hR", "hL"]) for (const t of onsets[h]) { tot++; if (onsets.b.some((u) => Math.abs(u - t) <= 1)) same++; }
    card.sync = tot ? same / tot : null;
    all.sync[0] += same; all.sync[1] += tot;
    actors[id] = card;
  }
  const clipCard = { jerk: median(all.jerk), jerk95: pct(all.jerk, 0.95), sparc: median(all.sparc), sync: all.sync[1] ? all.sync[0] / all.sync[1] : null, moves: all.sparc.length };
  if (clip) {
    const r = spawnSync("python3", [path.join(HERE, "pace.py"), clip, "--json"], { encoding: "utf8", maxBuffer: 64 << 20 });
    try { const p = JSON.parse(r.stdout), c = Array.isArray(p) ? p[0] : p; clipCard.frozen = c.frozen ?? null; clipCard.longestStill = Array.isArray(c.longest_still) ? c.longest_still[0] : c.longest_still ?? null; } catch { clipCard.frozen = null; }
  }
  return { fps, frames: n, clip: clipCard, actors };
}

const f1 = (x, d = 1) => (x == null ? "-" : x.toFixed(d));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), o = { layout: null, sb: null, clip: null, json: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--clip") o.clip = a[++i];
    else if (a[i] === "--json") o.json = true;
    else o.layout = a[i];
  }
  if (!o.layout) { console.error("usage: node qa/motioncard.mjs <layout.json> [--sb <storyboard>] [--clip <clip.mp4>] [--json]"); process.exit(2); }
  const sb = o.sb ? await (await import("../engine/load.mjs")).loadStoryboard(o.sb) : null;
  const card = motionCard(JSON.parse(fs.readFileSync(o.layout, "utf8")), sb, o.clip);
  if (o.json) { console.log(JSON.stringify(card, null, 1)); process.exit(0); }
  const c = card.clip;
  console.log(`motion card: jerk ${f1(c.jerk)} m/s³ (95 % ${f1(c.jerk95)}), SPARC ${f1(c.sparc, 2)}, synchrony ${c.sync == null ? "-" : Math.round(c.sync * 100) + " %"}, ${c.moves} moves${c.frozen != null ? `, frozen ${f1(c.frozen)} %, longest still ${f1(c.longestStill, 2)} s` : ""}`);
  for (const [id, x] of Object.entries(card.actors)) {
    console.log(`  ${id.padEnd(6)} sync ${x.sync == null ? "  -" : String(Math.round(x.sync * 100)).padStart(3) + " %"}  ` + Object.keys(PARTS).map((k) => `${k} ${x[k].moves}× j ${f1(x[k].jerk, 0)} s ${f1(x[k].sparc, 2)}`).join(" | "));
  }
}
