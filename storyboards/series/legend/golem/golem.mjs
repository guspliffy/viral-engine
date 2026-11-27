// Legend: The Golem of Prague, rough draft 1. Built from SHOTS.md (the director's shot list, 27 Nov 2026).
//   TITLE=stone|relief|clay  (default stone = version B; relief = version D)
//   node storyboards/series/legend/golem/render-golem.mjs --out <mp4>
// Timeline = real line lengths (silences inside a take squeezed only where the samples are below -42 dB for the whole cut).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as G from "../../../../tools/svg2d/lib/legend-golem.mjs";
import { align, phrases } from "../../../../tools/svg2d/lib/captions.mjs";
import { hosts } from "../../../../tools/svg2d/scenes/legend-golem-proof.mjs";
const { lerp, clamp, tr, ease, hash, n } = L;

export const TITLE = process.env.TITLE || "stone";
export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-golem/vo", VEDIT = "out/legend-golem/vo-edit", OUT = "out/legend-golem";
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/golem/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

// ---------------------------------------------------------------- voices: squeeze silences (verified on the samples), envelopes
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
function writeWav(p, s, sr) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(s.length * 2, 40);
  Buffer.from(s.buffer, s.byteOffset, s.byteLength).copy(b, 44); writeFileSync(p, b);
}
const THR = 10 ** (-42 / 20) * 32768;   // -42 dBFS in int16 units (RMS of a 10 ms window)
const KEEP_GAP = 0.4, MIN_BEFORE = 0.08, MIN_AFTER = 0.15, WIN = 0.01;
export const CUTLOG = [];
mkdirSync(VEDIT, { recursive: true });
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  const words = JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8"));
  const wn = Math.round(WIN * sr), rms = (i0) => { let a = 0; const e = Math.min(s.length, i0 + wn); for (let j = i0; j < e; j++) a += s[j] * s[j]; return Math.sqrt(a / Math.max(1, e - i0)); };
  // a cut span is allowed only when every 10 ms window of it (and 20 ms around) is below -42 dB
  const quiet = (x, y) => { for (let i = Math.round((x - 0.02) * sr); i < Math.round((y + 0.02) * sr); i += wn) if (rms(Math.max(0, i)) > THR) return false; return true; };
  // sample-based: runs of 10 ms windows below -42 dB (RMS) at least 0.55 s long; the cut leaves 0.2 s after the last voiced sample
  // and 0.2 s before the next one (>= 0.15 / 0.08 required), and the whole removed span is quiet by construction
  const cuts = [], nw = Math.floor(s.length / wn), qv = []; for (let i = 0; i < nw; i++) qv.push(rms(i * wn) < THR);
  for (let i = 0; i < nw;) {
    if (!qv[i]) { i++; continue; }
    let j = i; while (j < nw && qv[j]) j++;
    const rs = i * WIN, re = j * WIN;
    if (i > 0 && j < nw && re - rs >= 0.5) { const len = re - rs - 0.35, c0 = rs + 0.18; cuts.push([c0, c0 + len]); CUTLOG.push(`${ln.id}: cut ${len.toFixed(2)} s at ${c0.toFixed(2)} (quiet run ${(re - rs).toFixed(2)} s, ${(rs).toFixed(2)}-${re.toFixed(2)})`); }
    i = j;
  }
  const segs = []; let a = 0;
  for (const [c0, c1] of cuts) { segs.push([a, c0]); a = c1; }
  segs.push([a, s.length / sr]);
  const out = []; let off = 0; const map = [];
  for (const [x, y] of segs) {
    const i0 = Math.round(x * sr), i1 = Math.min(s.length, Math.round(y * sr)), seg = Int16Array.from(s.subarray(i0, i1)), fd = Math.round(0.012 * sr);
    if (x > 0) for (let i = 0; i < Math.min(fd, seg.length); i++) seg[i] = Math.round(seg[i] * (i / fd));
    if (y < s.length / sr) for (let i = 0; i < Math.min(fd, seg.length); i++) seg[seg.length - 1 - i] = Math.round(seg[seg.length - 1 - i] * (i / fd));
    map.push([x, y, off / sr]); for (const v of seg) out.push(v); off += seg.length;
  }
  const mp = (t) => { for (const [x, y, o] of map) if (t <= y + 1e-6) return o + Math.max(0, t - x); return off / sr; };
  const src = Int16Array.from(out), file = `${VEDIT}/${ln.id}.wav`; writeWav(file, src, sr);
  ln.file = file; ln.words = words.map((w) => [w[0], mp(w[1]), mp(w[2])]); ln.dur = src.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < src.length; i += hop) { let q = 0; for (let j = i; j < Math.min(src.length, i + hop); j++) q += (src[j] / 32768) ** 2; env.push(Math.sqrt(q / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  // captions: the written words on the spoken times; phrases cut at punctuation or after 4 words
  const wr = ln.text.split(/\s+/).filter(Boolean), cw = align(wr, ln.words), parts = []; let cur = 0;
  cw.forEach((w, i) => { cur++; if (/[.,?!…]$/.test(w[0]) || cur >= 4 || i === cw.length - 1) { parts.push(cw.slice(i + 1 - cur, i + 1).map((x) => x[0]).join(" ")); cur = 0; } });
  ln.cw = cw; ln.phr = phrases(cw, ln.text, parts.join("|"));
}
const wordAt = (ln, w, dflt = 0) => { const x = ln.words.find((q) => norm(q[0]).startsWith(w)); return x ? x[1] : dflt; };
const wordEnd = (ln, w, dflt = 0) => { const x = ln.words.find((q) => norm(q[0]).startsWith(w)); return x ? x[2] : dflt; };

// ---------------------------------------------------------------- picture helpers
const S = G.SYN, RV = G.RIVER, LN = G.LANE, HL = G.HALL, AT = G.GATTIC;
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) }; };
const push = (u, a, dz = 0.5, dx = 0, dy = 0) => cam(u, a, { x: a.x + dx, y: a.y + dy, z: a.z + dz }, "lin");
const byZ = (list) => list.filter((a) => a && a[1]).sort((a, b) => b[0] - a[0]).map((a) => a[1]).join("");
const seg = (u, cuts) => { let i = 0; while (i < cuts.length && u >= cuts[i]) i++; const a = i ? cuts[i - 1] : 0, b = i < cuts.length ? cuts[i] : a + 1; return { i, f: clamp((u - a) / Math.max(0.01, b - a)), a, b }; };
const todayMood = (k = 0) => G.moodMix("friday", "lane", k);
const talk = (who, T) => tk(who, T);
const hosts_ = (c, t, m, ks = {}, gs = {}) => hosts2(c, t, m, { talk: talk("K", t), ...ks }, { talk: talk("G", t), ...gs });
const T_ = (c, t, m, ks, gs, extra = "") => G.todaySynagogue(c, t, m) + extra + hosts_(c, t, m, ks, gs);
// the set's own pointed window (X 2.95, Y 1.9-4.3) already glows; on "twice" a warm pool is added around it (B34: one opening only)
function wallWindow(c, t, k = 0) {
  if (k < 0.03) return "";
  const p = L.P(c, 2.95, 3.1, S.wall - 0.02), fl = 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.1);
  return G.pool(p.x, p.y, p.s * 1.6, p.s * 1.9, "#ffb04a", 0.26 * k * fl, 5, 3, t);
}
const dustPuff = (c, since, big = 1) => {   // dust coming out of the attic door
  if (since < 0) return "";
  const d = S.door, p = L.P(c, d.X, S.Y(d.y0), S.wall - 0.05); let s = "";
  for (let i = 0; i < 34; i++) {
    const a = since - hash(i + 1) * 0.15; if (a < 0 || a > 2.2) continue;
    const x = p.x + (hash(i + 7) - 0.5) * p.s * 0.7 * (1 + a), y = p.y + p.s * 0.05 + a * (60 + 200 * hash(i + 3)) * (p.s / 220), r = (3 + 6 * hash(i + 9)) * big * (p.s / 300 + 0.5);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${i % 3 ? "#d8c4a0" : "#fff1c8"}" opacity="${n(0.9 * clamp(1 - a / 2.2))}"/>`;
  }
  return s;
};
function hosts2(c, t, m, kidSt = {}, keepSt = {}) {
  const ks = { X: S.kid.X, Z: S.kid.Z, fx: -0.5, blink: L.blinkAmt(t % 3.9, [1.4]), ...kidSt };
  const kd = ks.up > 0.01 ? G.kidUp(c, ks, t) : L.kid(c, ks, t);
  const gs = { X: S.keeper.X, Z: S.keeper.Z, fx: 0.7, look: 0.7, stern: 1, open: 1, flame: 1, blink: L.blinkAmt(t % 3.3, [2.1]), ...keepSt };
  const kp = L.keeper(c, gs, t, kd.back || kd.sleeve);
  let fing = "";
  if ((keepSt.grab || 0) > 0.3 && kd.back && kd.p) {   // fingers closed on the fabric (B2)
    const q = kd.back, k = kd.p.s / 100;
    fing = `<g transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(3)})"><ellipse cx="0" cy="0" rx="7" ry="6" fill="#e6bf9e" stroke="#1a1328" stroke-width="1.2"/>` + [-4.5, -1.5, 1.5, 4.5].map((x) => `<path d="M${x},-4 L${x + 1},4" stroke="#8a6a50" stroke-width="0.9"/>`).join("") + `<path d="M-9,-9 L-5,-4" stroke="#2b2f6b" stroke-width="5" stroke-linecap="round"/></g>`;
  }
  return byZ([[ks.Z, kd.svg], [gs.Z, kp.svg + kp.arm]]) + fing + G.grade(m, 0.5);
}
const laneBase = (c, t, m, o = {}) => G.lane(c, t, m, o);
const stepTimes = (t0, t1, rate, off = 0.25) => { const out = []; for (let k = Math.ceil((t0 * rate - off) * 2); k / 2 + off <= t1 * rate; k++) out.push((k / 2 + off) / rate); return out; };
// a wooden ladder: vertical against the wall (x, from y0 to y1) or carried flat between two men (x0 -> x1 at height y)
function ladderV(c, X, y0, y1, Z, m) {
  const f = (x, y) => L.P(c, x, y, Z), W_ = 0.24, col = G.tone(m, "#9a6a38"), cd = G.tone(m, "#5a3a1c"); let s = "";
  s += `<path d="M${n(f(X - W_, y0).x)},${n(f(X - W_, y0).y)} L${n(f(X - W_, y1).x)},${n(f(X - W_, y1).y)} M${n(f(X + W_, y0).x)},${n(f(X + W_, y0).y)} L${n(f(X + W_, y1).x)},${n(f(X + W_, y1).y)}" stroke="${col}" stroke-width="${n(f(X, 0).s * 0.05)}" stroke-linecap="round"/>`;
  for (let y = y0 + 0.2; y < y1; y += 0.3) s += `<path d="M${n(f(X - W_, y).x)},${n(f(X - W_, y).y)} L${n(f(X + W_, y).x)},${n(f(X + W_, y).y)}" stroke="${cd}" stroke-width="${n(f(X, 0).s * 0.035)}" stroke-linecap="round"/>`;
  return s;
}
function ladderH(c, xa, xb, y, Z, m) {
  const a = L.P(c, xa, y, Z), b = L.P(c, xb, y, Z), k = a.s, col = "#6a3a14", cd = "#3a200c", W_ = 0.13 * k; let s = "";
  s += `<path d="M${n(a.x)},${n(a.y - W_)} L${n(b.x)},${n(b.y - W_)} M${n(a.x)},${n(a.y + W_)} L${n(b.x)},${n(b.y + W_)}" stroke="${col}" stroke-width="${n(k * 0.09)}" stroke-linecap="round"/>`;
  const N = 12; for (let i = 0; i <= N; i++) { const x = lerp(a.x, b.x, i / N), yy = lerp(a.y, b.y, i / N); s += `<path d="M${n(x)},${n(yy - W_)} L${n(x)},${n(yy + W_)}" stroke="${cd}" stroke-width="${n(k * 0.06)}"/>`; }
  return s;
}
// screen-space push-in about a point (the extreme close-ups)
const zoomAbout = (svg, cx, cy, z, ty = 1190) => `<g transform="translate(${n(540 - cx * z)},${n(ty - cy * z)}) scale(${z.toFixed(3)})">${svg}</g>`;

// ---------------------------------------------------------------- the beats (shot(u = s into the line, d = line length, T = absolute time, ln))
const L1 = LINE.L01, TITLE_OUT = 2.6;
const KID = { x: 0.95, y: 1.1, z: 6.15 }, KEEP = { x: -0.02, y: 1.22, z: 5.7 };
const Tw = (c, t, m, ks, gs, extra = "") => G.todaySynagogue(c, t, m) + wallWindow(c, t, 0) + extra + hosts_(c, t, m, ks, gs);
const BEATS = [
  // 1. A2/B1/B2/B3: one continuous jump and catch across the cut on "DOWN": tight on the hand under the rung, then a medium two-shot (fingers on the jacket)
  { line: "L01", pre: 0.3, holdTo: TITLE_OUT, shot(u, d, T) {
    const m = G.mood("friday"), dnS = wordAt(L1, "down", 0.21), dnE = wordEnd(L1, "down", 0.55), cutA = dnS - 0.02, kz = 7.62;
    const hop = 78 * Math.sin(Math.PI * (0.35 + 0.65 * clamp((u + 0.3) / (dnE + 0.3)))), land = clamp((u - dnE + 0.1) / 0.35);
    if (u < cutA) {
      const c = push(clamp(u / cutA), { x: 1.0, y: 1.7, z: 6.0 }, 0.2, 0, 0.1);
      return G.todaySynagogue(c, T, m) + hosts2(c, T, m, { up: 1, hop, fx: -0.2, Z: kz, X: 1.0, stretch: hop * 0.3 }, { X: S.keeper.X - 0.3, talk: 0, fx: 0.7 });
    }
    const f = (u - cutA) / (d + 0.4 - cutA), c = push(f, { x: 0.3, y: 1.5, z: 4.9 }, 0.3);
    const grab = tr([[dnS, 0], [dnS + 0.2, 1]], u), back = tr([[dnE - 0.1, 0], [dnE + 0.35, 1]], u);
    return G.todaySynagogue(c, T, m) + hosts2(c, T, m, { up: tr([[0, 1], [dnS + 0.05, 1], [dnE, 0.1]], u), hop: hop * (1 - land), fx: lerp(-0.2, -0.7, back), Z: kz, X: 1.0 - back * 0.2, talk: 0, shock: back * 0.3, stretch: hop * 0.3 * (1 - land) },
      { grab, X: S.keeper.X + 0.05, talk: talk("G", T), fx: 0.7, look: 0.5, stern: 1 });
  } },
  // 2. B3: his whole question in his close-up; the tilt up the rungs happens in the gap before her answer
  { line: "L02", hold: 0.45, shot(u, d, T) {
    const m = G.mood("friday"), tl = clamp((u - d - 0.02) / 0.42);
    if (tl <= 0) return Tw(push(u / d, KID, 0.12), T, m, { fx: -0.6, look: -0.95 }, { fx: 0.7, look: 0.7 });
    return Tw(cam(tl, push(1, KID, 0.12), S.CAM.rungs), T, m, { fx: -0.6, look: -0.95 }, { fx: 0.7 });
  } },
  // 3. grandmother close (lantern kept off the caption); the flame shrinks; on "way down" the attic door from below
  { line: "L03", shot(u, d, T, ln) {
    const m = G.mood("friday"), sw = wordAt(ln, "way", d - 0.6) - 0.05;
    if (u < sw) return Tw(push(u / sw, KEEP, 0.2), T, m, { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.6, open: 1, flame: lerp(1, 0.3, u / sw) });
    return Tw(push((u - sw) / (d - sw), { x: 1.0, y: 3.2, z: 3.4 }, 0.7, 0, 0.35), T, m, { fx: -0.7 }, { fx: 0.7, flame: 0.3 });
  } },
  // 4. A11/B5: Prague in the wide, push down the lane, a resident secures a door on "had enemies", the camera carries past the doorway on "nobody to protect it"
  { line: "L04", shot(u, d, T, ln) {
    const m = G.mood("lane"), had = wordAt(ln, "had", d * 0.6) - 0.15, no = wordAt(ln, "nobody", d * 0.8) - 0.05, en = wordAt(ln, "enemies", d * 0.7), s = seg(u, [wordEnd(ln, "around", 1.0) + 0.1, had, no]);
    const props = (c) => [[LN.well.Z, G.well(c, { m }, T)], [LN.cart.Z, G.cart(c, { m }, T)]];
    if (s.i === 0) { const c = push(s.f, LN.CAM.wide, 0.2); return laneBase(c, T, m, { lamps: 1 }) + byZ(props(c)); }
    if (s.i === 1) { const c = cam(s.f, push(1, LN.CAM.wide, 0.2), { x: -0.2, y: 1.7, z: 1.6 }, "lin"); return laneBase(c, T, m, { lamps: 1 }) + byZ(props(c)); }
    if (s.i === 2) {   // the close view of a doorway: a resident hurries to it and goes in
      const c = push(s.f, { x: -1.55, y: 1.35, z: 2.8 }, 0.4), a = clamp((u - s.a) / Math.max(0.6, en - s.a + 0.3));
      const tw = G.townswoman(c, { X: lerp(-0.1, -1.95, ease(a)), Z: lerp(6.8, 5.7, ease(a)), fx: -0.8, run: u * 2.6, wide: 0.7, brow: -0.6, m }, T);
      return laneBase(c, T, m, { lamps: 1 }) + byZ([...props(c), a < 0.97 ? [lerp(6.8, 5.7, a), tw.svg] : null]);
    }
    const c = push(s.f, { x: -0.9, y: 1.4, z: 3.8 }, 1.2, 0.8);   // carried past the doorway: the lane is empty
    return laneBase(c, T, m, { lamps: 1 }) + byZ(props(c));
  } },
  // 5. B6/B7: Loew in frame from the first frame of the shot, thumb in the wet clay on "shaped", the golem opaque on "giant" (cuts as in draft 2)
  { line: "L05", shot(u, d, T, ln) {
    const m = G.mood("river"), sh = wordAt(ln, "shaped", 3.2) - 0.05, gi = wordAt(ln, "giant", 3.7) - 0.05, s = seg(u, [0.7, sh, gi]);
    const rb = (c, st) => G.rabbi(c, { ...RV.rabbi, fx: 0.7, m, ...st }, T);
    if (s.i === 0) { const c = push(s.f, RV.CAM.wide, 0.35), a = ease(s.f); return G.river(c, T, m) + rb(c, { X: lerp(-2.3, RV.rabbi.X, a), walk: T * 1.3 }).svg + G.riverMist(c, T, m); }
    if (s.i === 1) { const c = push(s.f, { x: -1.5, y: 1.25, z: 2.6 }, 0.5), kn = ease(clamp(s.f * 1.4)); return G.river(c, T, m) + rb(c, { kneel: kn, look: 0.4 }).svg + G.riverMist(c, T, m); }
    if (s.i === 2) { const c = push(s.f, { x: -1.35, y: 1.0, z: 3.7 }, 0.3), r = rb(c, { kneel: 1, shape: 1, shapeTo: [58 + 8 * Math.sin(T * 5), -22 + 5 * Math.sin(T * 4)] }); return G.river(c, T, m) + r.svg + G.riverMist(c, T, m, 0.5); }
    const c = push(s.f, { x: -0.7, y: 1.55, z: 1.9 }, 0.5);
    const g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, m }, T), r = rb(c, { kneel: 1, shape: 1, shapeTo: [58, -22 + 4 * Math.sin(T * 4)] });
    return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, r.svg]]) + G.riverMist(c, T, m);
  } },
  // 6. A10/B8/B9/B10: the writing hand; the slip meets the lips (the hand follows it in); the face, lids closed a beat before the first blink
  { line: "L06", shot(u, d, T, ln) {
    const m = G.mood("river"), pu = wordAt(ln, "put", 2.6) - 0.35, op = wordAt(ln, "opened", 4.8) - 0.12, s = seg(u, [pu, op]);
    if (s.i === 0) {
      const c = push(s.f, { x: -1.25, y: 1.05, z: 3.9 }, 0.4);
      const rb = G.rabbi(c, { X: RV.rabbi.X, Z: RV.rabbi.Z, fx: 0.4, kneel: 1, hold: "slip", holdUp: 1, holdSize: 1.3, brow: 0.2, m }, T);
      return G.river(c, T, m) + byZ([[RV.golem.Z, G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, m }, T).svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.6);
    }
    if (s.i === 1) {   // the whole head and hand in frame
      const c = push(s.f, { x: -1.0, y: 1.2, z: 3.0 }, 0.2), g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, look: -0.3, slip: s.f > 0.62 ? 1 : 0, m }, T);
      const rb = G.rabbi(c, { X: RV.rabbi.X + 0.35, Z: RV.rabbi.Z - 0.1, fx: 0.7, kneel: 1, reachAt: s.f < 0.8 ? g.mouth : { x: g.mouth.x - 150 * ease(clamp((s.f - 0.8) / 0.2)), y: g.mouth.y + 120 * ease(clamp((s.f - 0.8) / 0.2)) }, hold: s.f > 0.62 ? null : "slip", holdSize: 1.2, m }, T);
      return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z - 0.1, rb.svg]]) + G.riverMist(c, T, m, 0.6);
    }
    const c = { x: -0.75, y: 1.3, z: 2.2 }, aw = tr([[0.25, 0], [0.75, 1]], u - op), g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: aw, look: -0.3, slip: 1, m }, T);
    return zoomAbout(G.river(c, T, m) + g.svg + G.riverMist(c, T, m, 0.5), g.head ? g.head.x : 540, g.head ? g.head.y : 900, lerp(1.7, 2.1, s.f), 1250);
  } },
  // 7. A6/B11/B12/B13: the rise in a readable two-shot (finger to the mouth), a brief sinking sun, the golem standing, "even you rest" with its head below the caption
  { line: "L07", shot(u, d, T, ln) {
    const m = G.mood("river"), sn = wordAt(ln, "sunset", 1.4), tk_ = wordAt(ln, "take", 2.6), ev = wordAt(ln, "even", 4.8) - 0.05, s = seg(u, [sn - 0.3, sn + 0.45, ev]);
    const stand = (c, st, rbst) => { const g = G.golem(c, { X: 0.8, Z: 6.7, fx: -0.6, awake: 1, slip: 1, look: -0.8, m, ...st }, T), rb = G.rabbi(c, { X: -0.95, Z: 6.2, fx: 0.7, brow: 0.55, talk: talk("R", T), m, ...rbst(g) }, T); return [g, rb]; };
    if (s.i === 0) {
      const sit = tr([[0, 0.4], [sn - 0.3, 1]], u), c = push(s.f, { x: -0.35, y: 1.35, z: 2.0 }, 0.4);
      const g = G.golem(c, { ...RV.golem, Y: 0.1, pose: "lie", sit, fx: 0.4, awake: 1, look: -0.6, slip: 1, m }, T);
      const rb = G.rabbi(c, { X: RV.rabbi.X + 0.5, Z: RV.rabbi.Z, fx: 0.7, kneel: tr([[0, 1], [0.8, 0]], u), finger: 1, reachAt: u > tk_ - 0.3 ? g.mouth : null, brow: 0.5, talk: talk("R", T), m }, T);
      return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.5);
    }
    if (s.i === 1) { const mm = G.moodMix("river", "sabbath", 0.5), c = push(s.f, { x: 0, y: 1.9, z: 1.4 }, 0.5); return G.river(c, T, mm, { mist: 0.3 }) + G.riverMist(c, T, mm, 0.4); }
    if (s.i === 2) { const c = push((u - s.a) / (ev - s.a), { x: 0.1, y: 1.55, z: 1.9 }, 0.4); const [g, rb] = stand(c, {}, (g_) => ({ finger: 1, reachAt: u > tk_ - 0.3 && u < tk_ + 1.2 ? g_.mouth : null })); return G.river(c, T, m, { mist: 0.6 }) + byZ([[6.7, g.svg], [6.2, rb.svg]]) + G.riverMist(c, T, m, 0.3); }
    const c = push((u - s.a) / (d - s.a), { x: 0.5, y: 2.0, z: 2.5 }, 0.3), nod = 7 * Math.sin(clamp((u - ev) / 1.2) * Math.PI * 1.6) * clamp((u - ev) / 0.2);
    const g = G.golem(c, { X: 0.8, Z: 6.7, fx: -0.6, awake: 1, slip: 1, look: -0.3, tilt: -nod, bendHead: 0, m }, T);
    return G.river(c, T, m, { mist: 0.5 }) + g.svg;
  } },
  // 8. A14/B15: track alongside the golem on patrol; its grip on the ring; it carries it home (the ring clear of its face)
  { line: "L08", shot(u, d, T, ln) {
    const m = G.mood("lane"), fw = wordAt(ln, "fetched", 2.7) - 0.05, s = seg(u, [fw]), ph = T * 0.45;
    if (s.i === 0) {   // tracking sideways with it
      const gx = lerp(-1.3, 0.9, s.f), c = { x: gx + 0.15, y: 1.6, z: 3.4 }, z = 7.2;
      const g = G.golem(c, { X: gx, Z: z, fx: 0.95, walk: ph, awake: 1, slip: 1, m }, T);
      return laneBase(c, T, m) + byZ([[LN.well.Z, G.well(c, { m }, T)], [z, g.svg]]);
    }
    const f = s.f, c = push(f, { x: -0.1, y: 1.85, z: 2.2 }, 0.35), z = lerp(8.4, 7.6, f);
    const g = G.golem(c, { X: lerp(0.8, 0.1, f), Z: z, fx: -0.2, walk: ph, carry: 0.85, awake: 1, slip: 1, m }, T);
    const bk = G.baker(c, { X: -0.95, Z: 5.6, fx: 0.7, wide: 0.8, brow: -0.5, hold: "loaf", m }, T), by = G.boy(c, { X: -0.45, Z: 5.2, fx: 0.6, wide: 0.6, smile: 0.8, point: 1, m }, T);
    return laneBase(c, T, m) + byZ([[LN.well.Z, G.well(c, { m, gone: 1 }, T)], [z, g.svg], [LN.cart.Z, G.cart(c, { m, X: 1.2, Z: 5.9 }, T)], [5.4, bk.svg], [5.1, by.svg]]);
  } },
  { line: "L09", shot(u, d, T) { return Tw(push(u / d, KID, 0.2), T, G.mood("friday"), { fx: -0.7, grin: 1, look: 0.2 }, { fx: 0.7 }); } },
  { line: "L10", shot(u, d, T) { return Tw(push(u / d, KEEP, 0.15), T, G.mood("friday"), { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.7, open: 1, flame: 0.9 }); } },
  // 11. A13/B16: three Fridays, the same camera and the same hand-to-mouth action each time (the light moves on); each ends with closed eyes. Then the boy in the gap.
  { line: "L11", hold: 0.3, shot(u, d, T) {
    if (u >= d) return Tw(push(clamp((u - d) / 0.3), KID, 0.1), T, G.mood("friday"), { fx: -0.7, look: 0.3 }, { fx: 0.7 });
    const s = seg(u, [d / 3, 2 * d / 3]), m = G.moodMix("river", "sabbath", [0.15, 0.55, 1][s.i]), f = s.f;
    const c = push(f, { x: -0.55, y: 1.35, z: 1.8 }, 0.25), out = ease(clamp((f - 0.2) / 0.45));
    const g = G.golem(c, { ...RV.golem, Y: 0.1, pose: "lie", sit: 1, fx: 0.4, awake: 1 - ease(clamp((f - 0.68) / 0.2)), slip: out < 0.3 ? 1 : 0, m, look: -0.4 }, T);
    const hand = out < 0.3 ? g.mouth : { x: g.mouth.x - 110 * ease(clamp((out - 0.3) / 0.7)), y: g.mouth.y + 30 };
    const rb = G.rabbi(c, { X: RV.rabbi.X + 0.55, Z: RV.rabbi.Z, fx: 0.7, reachAt: hand, hold: out >= 0.3 ? "slip" : null, holdSize: 1.2, brow: 0.1, m }, T);
    return G.river(c, T, m, { mist: 0.4 }) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.3);
  } },
  { line: "L12", shot(u, d, T) { return Tw(push(u / d, KID, 0.18), T, G.mood("friday"), { fx: -0.7, look: 0.3 }, { fx: 0.7 }); } },
  // 13. grandmother, very still, candle tiny; the hold carries the music kill
  { line: "L13", hold: 0.5, shot(u, d, T) { return Tw(push(u / (d + 0.5), KEEP, 0.12), T, G.mood("friday"), { fx: -0.7 }, { fx: 0.7, look: 0.8, stern: 0.9, open: 1, flame: 0.18 }); } },
  // 14. A5/B18: the darkening lane; the gold hall on the first sung phrase; tight on the paper in its mouth
  { line: "L14", shot(u, d, T, ln) {
    const sg = wordAt(ln, "sabbath", 2.8) - 0.1, wd = wordAt(ln, "word", 5.6) - 0.15, s = seg(u, [sg, wd]);
    if (s.i === 0) {
      const mm = G.moodMix("sabbath", "lane", ease(clamp(u / (sg * 0.85)))), c = push(s.f, LN.CAM.wide, 0.5);
      return laneBase(c, T, mm, { lamps: lerp(0.2, 1, s.f) }) + G.well(c, { m: mm, gone: 1 }, T);
    }
    if (s.i === 1) {
      const m = G.mood("sabbath"), c = cam(s.f, HL.CAM.wide, { x: 0.1, y: 1.8, z: 1.3 }), alarm = clamp((s.f - 0.75) / 0.25);
      const rb = G.rabbi(c, { ...HL.rabbi, fx: lerp(0.1, 0.5, alarm), book: 1, talk: 0.3, wide: alarm * 0.6, m }, T);
      return G.synagogueInside(c, T, m, { door: 0 }) + rb.svg + G.bimahFront(c, m) + G.worshippers(c, T, { m });
    }
    const m = G.mood("lane"), c = { x: 0.1, y: 1.9, z: 2.6 }, a = ease(s.f);
    const g = G.golem(c, { X: 0.1, Z: 7.8, fx: -0.3, awake: lerp(0.35, 1, a), anger: a * 0.5, slip: 1, look: -0.3, m }, T);
    return zoomAbout(laneBase(c, T, m, { lamps: 0.7 }) + g.svg, g.mouth.x, g.mouth.y, lerp(2.0, 2.5, s.f), 1180);
  } },
  // 15. A7/B19/B20: the woman crosses the threshold, then Loew's reaction as "the giant!" ends
  { line: "L15", shot(u, d, T, ln) {
    const gi = wordAt(ln, "giant", 1.4) - 0.1, s = seg(u, [gi]), m = G.mood("sabbath");
    if (s.i === 0) {
      const c = push(s.f, { x: 1.9, y: 1.45, z: 10.3 }, 0.25, -0.1), k = ease(clamp(u / 0.5));
      const wm = G.townswoman(c, { X: lerp(2.2, 1.7, k), Z: lerp(13.3, 11.6, k), fx: -0.5, run: T * 2.2, point: k > 0.8 ? 1 : 0, wide: 1, brow: -0.7, talk: talk("W", T), m }, T);
      return G.synagogueInside(c, T, m, { door: ease(clamp(u / 0.25)) }) + wm.svg + G.worshippers(c, T, { m, turn: s.f, rows: [] });
    }
    const c = push(s.f, { x: -0.2, y: 1.75, z: 6.3 }, 0.3), rb = G.rabbi(c, { ...HL.rabbi, fx: 0.5, book: 0.7, wide: 1, brow: -0.6, m }, T);
    return G.synagogueInside(c, T, m, { door: 1 }) + rb.svg + G.bimahFront(c, m);
  } },
  // 16. A8/B17-B20: late windup, the split wood held; the cart leaves the golem's hand; growth steps beside the same doorways
  { line: "L16", shot(u, d, T, ln) {
    const m = G.mood("rampage"), s = seg(u, [wordAt(ln, "doors", 1.4) - 0.05, wordAt(ln, "carts", 2.6) - 0.08, wordAt(ln, "and", 3.7) - 0.05]);
    const run = (c, X0, X1, Z0, Z1, a, fn, f0, fx) => fn(c, { X: lerp(X0, X1, a), Z: lerp(Z0, Z1, a), fx, run: T * 2.7 + f0, wide: 1, brow: -0.8, talk: 1, m }, T);
    if (s.i === 0) {
      const c = push(s.f, LN.CAM.wide, 0.7, 0, 0.1), g = G.golem(c, { X: 0.25, Z: lerp(10.4, 8.4, s.f), fx: -0.6, walk: T * 0.7, grow: 0.15, anger: 1, awake: 1, slip: 1, look: -0.6, m }, T);
      const bk = run(c, 0.0, -2.0, 6.2, 4.8, s.f, G.baker, 0, -0.8), by = run(c, 0.7, 2.0, 5.8, 4.6, s.f, G.boy, 0.3, 0.8);
      return laneBase(c, T, m, { wreck: 0.2, lamps: 0.7 }) + byZ([[8.4, g.svg], [lerp(6.2, 4.8, s.f), bk.svg], [lerp(5.8, 4.6, s.f), by.svg]]);
    }
    if (s.i === 1) {   // wind up late, the hit at f = 0.62, the split wood held to the end of the shot
      const c = push(s.f, { x: -1.0, y: 1.75, z: 2.0 }, 0.2), sm = 0.78 * ease(clamp((s.f - 0.1) / 0.55)), g = G.golem(c, { X: -1.4, Z: 6.0, fx: -0.8, smash: sm, grow: 0.3, anger: 1, awake: 1, slip: 1, m }, T);
      return laneBase(c, T, m, { doors: [s.f > 0.62 ? ease(clamp((s.f - 0.62) / 0.12)) : 0, 0, 0, 0], wreck: s.f > 0.62 ? 0.8 : 0.2, lamps: 0.7 }) + g.svg;
    }
    if (s.i === 2) {   // low: it holds the cart, lets go, the cart leaves along the lane and out of frame
      const c = push(s.f, { x: -0.3, y: 0.95, z: 2.6 }, 0.25), a = clamp((s.f - 0.3) / 0.7), rel = s.f > 0.3;
      const g = G.golem(c, { X: 0.4, Z: 8.4, fx: -0.6, grow: 0.5, smash: 0.3 + 0.4 * ease(clamp((s.f - 0.1) / 0.3)), anger: 1, awake: 1, slip: 1, m }, T);
      const X = rel ? lerp(0.2, -2.6, a) : 0.2, Y = rel ? 0.5 + 2.0 * Math.sin(a * Math.PI * 0.85) : 0.5, Z = rel ? lerp(7.6, 4.6, a) : 7.6;
      const cp = L.P(c, 0.2, 0.5, 7.6), hand = g.chest || { x: cp.x, y: cp.y }, glue = 1 - ease(clamp((s.f - 0.3) / 0.15)), dx = (hand.x - cp.x) * glue, dy = (hand.y - cp.y - 40) * glue;
      const ct = G.cart(c, { m, X, Y, Z, rot: rel ? -15 - a * 260 : -8, spin: T * 300, broken: rel ? a : 0, load: 0 }, T);
      return laneBase(c, T, m, { doors: [1, 1, 0, 0], wreck: 1, lamps: 0.7 }) + byZ([[8.4, g.svg], [Z, `<g transform="translate(${n(dx)},${n(dy)})">${ct}</g>`]]);
    }
    const c = push(s.f, { x: 0.0, y: 1.15, z: 1.6 }, 0.3), z = lerp(10.6, 7.4, s.f), g = G.golem(c, { X: lerp(0.3, 0.0, s.f), Z: z, fx: -0.1, walk: T * 0.9, grow: lerp(0.0, 1, s.f), anger: 1, awake: 1, slip: 1, m }, T);
    return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + g.svg;
  } },
  // 17. A3/B22-B24: Loew runs in whole, the golem bends continuously; a profile close on lips, fingertips and paper; the slip clears at the end of "word" and the eyes close on clearance
  { line: "L17", hold: 0.4, shot(u, d, T, ln) {
    const m = G.mood("rampage"), rc = wordAt(ln, "reached", 2.3) - 0.05, ex = wordAt(ln, "pulled", 3.8) - 0.55, we_ = wordEnd(ln, "word", d - 0.2), s = seg(u, [rc, ex]);
    const bend = tr([[0, 0], [rc, 0.55], [ex, 1]], u), out = tr([[we_ - 0.4, 0], [we_ - 0.02, 1]], u), aw = 1 - ease(clamp((u - we_ + 0.02) / 0.14));
    const gst = (c) => G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, bend, anger: 1 - out * 0.7, awake: aw, slip: out > 0.02 ? 0 : 1, look: -0.7, m }, T);
    if (s.i === 0) {
      const c = push(s.f, { x: 0.3, y: 1.5, z: 2.4 }, 0.5), a = ease(clamp(u / (rc * 0.8))), z = lerp(5.3, 7.0, a);
      const rb = G.rabbi(c, { X: lerp(-0.9, -0.7, a), Z: z, fx: 0.7, run: a < 1 ? T * 2.4 : null, wide: 0.5, brow: 0.6, m }, T);
      return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + byZ([[7.4, gst(c).svg], [z, rb.svg]]);
    }
    const c = s.i === 1 ? push(s.f, { x: 0.1, y: 1.6, z: 3.2 }, 0.3) : { x: 0.1, y: 1.9, z: 3.5 }, g = gst(c);
    const at = { x: g.mouth.x - 140 * out, y: g.mouth.y + 170 * out };
    const rb = G.rabbi(c, { X: -0.95, Z: 7.1, fx: 0.7, reachAt: at, tiptoe: 1 - out, hold: out > 0.02 ? "slip" : null, holdSize: 1.4, brow: 0.6, wide: 0.3, m }, T);
    const scene = laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + byZ([[7.4, g.svg], [7.1, rb.svg]]);
    return s.i === 1 ? scene : zoomAbout(scene, g.mouth.x - 50, g.mouth.y + 25, lerp(2.7, 3.0, s.f), 1340);
  } },
  // 18. A9/B25/B26: the pile is shown as the last chunk lands, then a low angle with Loew in frame
  { line: "L18", shot(u, d, T, ln) {
    const into = wordAt(ln, "into", 1.4), k = tr([[0.4, 0], [d, 1]], u), m = G.moodMix("rampage", "lane", k), cr = tr([[0.05, 0], [into - 0.1, 1]], u);
    const rb = (c) => G.rabbi(c, { X: -0.95, Z: 7.1, fx: 0.7, hold: "slip", holdUp: 0.3, holdSize: 1.4, brow: 0.2, smile: -0.4, m }, T);
    if (u < into + 0.55) { const c = push(u / d, { x: 0.1, y: 1.45, z: 1.8 }, 0.4), g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, bend: lerp(1, 0.2, cr), crumble: cr, awake: 0.2, slip: 0, m }, T);
      return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: lerp(0.6, 1, k) }) + byZ([[7.4, g.svg], [7.1, rb(c).svg]]); }
    const c = push((u - into - 0.55) / (d - into - 0.55), { x: 0.05, y: 0.8, z: 3.0 }, 0.5), g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, crumble: 1, awake: 0, slip: 0, m }, T);
    return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 1 }) + byZ([[7.4, g.svg], [7.1, rb(c).svg]]);
  } },
  // 19. A10/B27/B28: the clay carried, the small heap in the attic, the lower ladder carried off the wall at hand height
  { line: "L19", shot(u, d, T, ln) {
    const at_ = wordAt(ln, "attic", 1.6) - 0.1, st = wordAt(ln, "took", 2.5) - 0.05, s = seg(u, [at_, st]);
    if (s.i === 0) {
      const m = G.moodMix("lane", "friday", 0.5), c = push(s.f, LN.CAM.golem, 0.5), a = s.f;
      const mk = (fn, X0, X1, Z, f0, ex) => fn(c, { X: lerp(X0, X1, a), Z, fx: 0.8, walk: T * 1.4 + f0, hold: "loaf", holdUp: 0.4, m, ...ex }, T);
      const bk = mk(G.baker, -1.8, 1.9, 6.0, 0), by = mk(G.boy, -2.6, 1.2, 6.4, 0.3), tw = mk(G.townswoman, -3.4, 0.5, 6.7, 0.6);
      return laneBase(c, T, m, { doors: 1, wreck: 0.6, lamps: 1 }) + byZ([[6.0, bk.svg], [6.4, by.svg], [6.7, tw.svg]]);
    }
    if (s.i === 1) { const m = G.mood("attic"), c = push(s.f, AT.CAM.wide, 0.7); return G.golemAttic(c, T, m) + G.clayPile(c, { m, dry: 0.3, k: 0.6 }); }
    const m = G.moodMix("lane", "friday", 0.5), c = push(s.f, { x: 1.0, y: 1.9, z: 3.4 }, 0.4), a = ease(s.f);
    const hn = { handL: [-26, -88], handR: [-24, -92] };
    const bk = G.baker(c, { X: lerp(0.5, -2.6, a), Z: 7.1, fx: -0.8, walk: T * 1.4, m, ...hn }, T), rbi = G.rabbi(c, { X: lerp(2.3, -0.9, a), Z: 7.1, fx: -0.8, walk: T * 1.4 + 0.3, m, ...hn }, T);
    return G.todaySynagogue(c, T, m) + wallWindow(c, T, 0) + bk.svg + ladderH(c, lerp(0.7, -2.4, a), lerp(2.2, -0.9, a), 0.9, 7.1, m) + rbi.svg;
  } },
  // 20. B28-B33: a ladder against the wall up to the small door (jamb masks the crossing), boots on boards inside, the heap already loose dust
  { line: "L20", shot(u, d, T, ln) {
    const th = wordAt(ln, "there", 2.4), od = wordAt(ln, "only", 3.3) - 0.2, s = seg(u, [th - 0.5, od]);
    if (s.i === 0) {
      const m = G.moodMix("lane", "friday", 0.7), a = ease(clamp(u / (th - 0.5))), yb = lerp(0, 4.5, a), c = { x: 1.0, y: lerp(2.4, 4.3, a), z: 3.7 }, dr = S.door, sill = L.P(c, 1.0, S.Y(dr.y0), 7.6).y, hw = dr.w * 0.5, A_ = L.P(c, 1.0 - hw, 0, 7.6), B_ = L.P(c, 1.0 + hw, 0, 7.6), top = L.P(c, 1.0, S.Y(dr.y1), 7.6).y;
      const rp = G.reporter(c, { X: 1.0, Y: yb, Z: 7.4, fx: 0.1, climb: T * 1.6, hold2: "notebook", wide: 0.3, m }, T);
      const open = a > 0.7 ? `<rect x="${n(A_.x)}" y="${n(top)}" width="${n(B_.x - A_.x)}" height="${n(sill - top)}" fill="#120a18"/>` : "";
      const clip = `<clipPath id="jamb"><path d="M0,${n(sill)} L${W},${n(sill)} L${W},${H} L0,${H} Z M${n(A_.x)},0 L${n(B_.x)},0 L${n(B_.x)},${n(sill)} L${n(A_.x)},${n(sill)} Z"/></clipPath>`;
      return G.todaySynagogue(c, T, m) + wallWindow(c, T, 0) + open + ladderV(c, 1.0, 0, 4.75, 7.5, m) + clip + `<g clip-path="${a > 0.7 ? "url(#jamb)" : "none"}">${rp.svg}</g>`;
    }
    if (s.i === 1) {
      const m = G.mood("attic"), c = push(s.f, { x: 0.9, y: 1.3, z: 2.4 }, 0.5), a = ease(s.f);
      const rp = G.reporter(c, { X: lerp(2.0, 1.5, a), Z: 6.2, fx: -0.6, walk: T * 1.5, hold: "lantern", holdUp: 0.9, hold2: "notebook", brow: -0.3, m }, T);
      return G.golemAttic(c, T, m) + G.clayPile(c, { m, dry: 0.9, k: 0.45 }) + rp.svg + G.lanternPool(rp.held, m, 1, T);
    }
    const m = G.moodMix("attic", "dust", 0.7), c = push(s.f, AT.CAM.pile, 0.5, 0, 0.05), col = clamp(s.f * 1.6);
    return G.golemAttic(c, T, m) + G.clayPile(c, { m, dry: 1, k: lerp(0.35, 0.12, ease(col)) }) + G.lanternPool({ x: 380, y: 1000 }, m, 1, T, 600) + G.dust(T, m, { x: 540, y: 1050 }, { n: 40 + Math.round(80 * col), r: 520 });
  } },
  { line: "L21", shot(u, d, T) { return Tw(push(u / d, KID, 0.15), T, todayMood(0.4), { fx: -0.6, look: -0.9 }, { fx: 0.7, look: 0.7 }); } },
  // 22. A1/B35: grandmother close for the line; on "twice?" the song under the lit window; through "Every Friday" the camera climbs from the hosts to the dark attic door
  { line: "L22", hold: 0, shot(u, d, T, ln) {
    const m = todayMood(0.4), tw = wordAt(ln, "twice", 2.7) - 0.05, ef = wordAt(ln, "every", 3.9) - 0.08, s = seg(u, [tw, ef]);
    if (s.i === 0) return Tw(push(s.f, KEEP, 0.15), T, m, { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.2, open: 1, flame: 0.6 });
    if (s.i === 1) { const c = push(s.f, { x: 2.8, y: 2.9, z: 3.9 }, 0.4, 0.1); return G.todaySynagogue(c, T, m) + wallWindow(c, T, clamp(s.f * 5)); }
    const c = cam(s.f, { x: 0.45, y: 1.45, z: 5.0 }, { x: 0.5, y: 2.5, z: 4.2 }, "inOut");
    return G.todaySynagogue(c, T, m) + wallWindow(c, T, 1) + hosts2(c, T, m, { fx: -0.3, look: -1, talk: 0 }, { fx: 0.3, look: -1, talk: 0, flame: 0.6 });
  } },
  // 23. the step: 0.62 s after the line, ONE heavy step; the door shudders, dust puffs, the flame gutters; hard cut 2 frames later
  { id: "TAIL", dur: 0.62 + 2 / 30, shot(u, d, T) {
    const m = todayMood(0.4), imp = 0.62, since = u - imp, c = { x: 0.5, y: 2.5, z: 4.2 }, sh = since >= 0 ? 7 * Math.exp(-since * 20) * Math.sin(since * 120) : 0;
    const fl = since >= 0 ? 1 : 0;
    return `<g transform="translate(${n(sh * 0.6)},${n(sh)})">` + G.todaySynagogue(c, T, m) + wallWindow(c, T, 1) + dustPuff(c, since, 1.4) + `</g>` + hosts(c, T, m, { fx: -0.3, look: -1, shock: fl * 0.9, talk: 0 }, { fx: 0.3, look: -1, talk: 0, flame: 0.6 - fl * 0.5 });
  } },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur, st = t + (b.pre || 0);
  let hold = b.hold ?? (ln ? 0.1 : 0); if (b.holdTo) hold = Math.max(0, b.holdTo - st - d);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + hold });
  t = st + d + hold;
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
const at = (id) => TL.find((b) => b.line === id || b.id === id);
function tk(who, time) {
  for (const b of TL) if (b.ln && b.ln.who === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
}

// ---------------------------------------------------------------- captions (y 560, Inter 900, whole phrase fixed, each word shown from its own start)
const KEY = /^(DOWN|golem|friday|twice|giant)$/i, KEYCASE = /^DOWN$/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < x.lineAt + x.d + 0.06);
  if (!b) return "";
  const u = time - b.lineAt, phr = b.ln.phr; let pi = -1;
  for (let i = 0; i < phr.length; i++) if (u >= phr[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  const ch = phr[pi].ws, len = (ws) => ws.reduce((a, w) => a + w[0].length + 1, -1);
  let k = ch.length;
  if (len(ch) > 19 && ch.length > 1) { let best = 1e9; for (let i = 1; i < ch.length; i++) { const dd = Math.abs(len(ch.slice(0, i)) - len(ch.slice(i))); if (dd < best) { best = dd; k = i; } } }
  const rows = k < ch.length ? [ch.slice(0, k), ch.slice(k)] : [ch];
  const fs = Math.min(74, Math.round(940 / Math.max(1, Math.max(...rows.map(len)) * 0.6)));
  return rows.map((r, i) => `<text x="540" y="${n(560 + (i - (rows.length - 1) / 2) * fs * 1.08)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fs}" stroke="#120c24" stroke-width="${Math.round(fs * 0.19)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${r.map((w) => {
    const show = u >= w[1] - 0.04, key = KEY.test(w[0].replace(/[^a-z]/gi, "")) && (!KEYCASE.test(w[0].replace(/[^a-z]/gi, "")) || /DOWN/.test(w[0]));
    return `<tspan fill="${key ? "#ffc04a" : "#ffffff"}"${show ? "" : ` fill-opacity="0" stroke-opacity="0"`}>${w[0].replace(/&/g, "&amp;")}</tspan>`;
  }).join(" ")}</text>`).join("");
}

// ---------------------------------------------------------------- one frame
// Jonny 27 Nov 09:55 Berlin: "the title of the video should be above the speech lettering" -> every title sits ABOVE the
// subtitle (2 rows at y=560 span ~465-615): bottom edge at y <= ~445; stone scaled 0.8 so its top stays below TikTok's top bar (~y 190).
const TITLE_TF = { stone: "translate(540,445) scale(0.8) translate(-540,-952)", clay: "translate(540,445) scale(0.8) translate(-540,-900)", relief: "translate(0,-270)" };
export function draw(time) {
  L.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = time - b.lineAt, body = b.shot(Math.max(u, -0.5), b.d, time, b.ln);
  const title = time < 2.7 ? `<g transform="${TITLE_TF[TITLE] ?? TITLE_TF.stone}">${G.titleCard(time, { style: TITLE })}</g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${body}${L.vignette()}${title}${captions(time)}</svg>`;
}
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export const SHEET = TL.map((b) => +(b.lineAt + (b.d || 0) * 0.5).toFixed(2));   // one frame per shot, for the contact sheet

// ---------------------------------------------------------------- the sound mix
const MUSIC_DIR = "assets/music/ai", SFX_DIR = "assets/sfx/ai", MISSING = [];   // the picked takes (were out/legend-golem/music + sfx)
export function best(dir, id) {   // top-ranked take of an id (CLAP rank in sg-raw/report.json), else the first file found
  const files = [];
  if (existsSync(`${dir}/${id}`)) files.push(...readdirSync(`${dir}/${id}`).filter((f) => /\.(wav|ogg|mp3|flac)$/i.test(f)).map((f) => `${dir}/${id}/${f}`));
  if (existsSync(dir)) files.push(...readdirSync(dir).filter((f) => f.startsWith(id) && /\.(wav|ogg|mp3|flac)$/i.test(f)).map((f) => `${dir}/${f}`));
  if (!files.length) return null;
  let rank = {}; try { rank = JSON.parse(readFileSync(`${OUT}/sg-raw/report.json`, "utf8")); } catch (e) {}
  const score = (f) => { const e = (rank[id] && (rank[id].ranked || rank[id].rank || rank[id])) || null; if (Array.isArray(e)) { const i = e.findIndex((x) => f.includes((x.file || x.take || x.name || x).toString().replace(/\.wav$/, "").split("/").pop())); return i < 0 ? -1 : 1000 - i; } return 0; };
  files.sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1));
  return files[0];
}
export function prepare() {
  mkdirSync(OUT, { recursive: true }); MISSING.length = 0;
  const Sx = { ins: [], f: [], tags: [] };
  const add = (file, at0, gain = 1, pre = "") => { if (!file) return; Sx.ins.push("-i", file); const k = Sx.ins.length / 2 - 1; Sx.f.push(`[${k}:a]aresample=44100,${pre}volume=${gain},adelay=${Math.round(Math.max(0, at0) * 1000)}:all=1[a${k}]`); Sx.tags.push(`[a${k}]`); };
  const mus = (id, s, e, g, fi = 0.5, fo = 0.5, ss = 0, pre = "") => {
    const dur = e - s; if (dur < 0.3) return; const f = best(MUSIC_DIR, id); if (!f) { MISSING.push("music " + id); return; }
    add(f, s, g, `aloop=loop=-1:size=2e9,atrim=${ss}:${(ss + dur).toFixed(2)},asetpts=PTS-STARTPTS,${pre}afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, dur - fo).toFixed(2)}:d=${fo},`);
  };
  const sfx = (id, at0, g = 1, pre = "") => { const f = best(SFX_DIR, id); if (!f) { MISSING.push("sfx " + id); return; } add(f, at0, g, pre); };
  const lib = (p, at0, g = 1, pre = "") => add(`assets/sfx/${p}`, at0, g, pre);
  for (const b of TL) if (b.ln) add(b.ln.file, b.lineAt, b.ln.who === "K" ? 1.35 : 1);
  const A = (id) => at(id), line = (id) => A(id).lineAt, lend = (id) => A(id).lineAt + A(id).d, w = (id, wd, df = 0) => line(id) + wordAt(LINE[id], wd, df), we = (id, wd, df = 0) => line(id) + wordEnd(LINE[id], wd, df);
  const MG = 0.45;   // music vs voice
  mus("golem-a-dusk", 0, we("L03", "way", lend("L03") - 0.3) + 0.4, MG, 0.1, 0.5);
  mus("golem-b-clay", line("L04"), w("L07", "even", lend("L07")) - 0.1, MG, 0.8, 0.6);
  mus("golem-c-guard", line("L08"), lend("L09") + 0.1, MG * 0.95, 0.5, 0.35);
  mus("golem-b-clay", line("L11"), lend("L11") + 0.2, MG * 0.6, 0.6, 0.6, 8);
  mus("golem-a-dusk", line("L12"), line("L13") + 0.12, MG * 0.5, 0.3, 0.12, 6);
  mus("golem-f-psalm", w("L14", "sabbath", 2.8) - 0.05, line("L15") + 0.04, MG * 1.05, 0.3, 0.04, 0, "lowpass=f=3500,aecho=0.7:0.5:90:0.25,");
  mus("golem-d-rampage", line("L16"), lend("L17") - 0.04, MG, 0.15, 0.05);
  mus("golem-e-attic", line("L19"), line("L21") + 0.12, MG * 0.8, 0.8, 0.12);
  const tail = A("TAIL").at, thud = tail + 0.62;
  mus("golem-f-psalm", w("L22", "twice", 2.7) - 0.1, A("TAIL").end, MG * 1.1, 0.15, 0.02, 0, "lowpass=f=1800,aecho=0.8:0.6:110|230:0.35|0.2,");
  const dn = we("L01", "down", 0.55);
  lib("kenney/impact/footstep_concrete_001.ogg", 0.12, 0.5, "lowpass=f=4000,");
  lib("kenney/rpg/cloth1.ogg", dn - 0.12, 0.7); lib("kenney/impact/footstep_concrete_002.ogg", dn + 0.45, 0.55);
  lib("kenney/rpg/doorClose_2.ogg", w("L04", "enemies", 4.8) - 0.1, 0.55, "lowpass=f=5000,");
  lib("kenney/rpg/doorClose_4.ogg", w("L04", "enemies", 4.8) + 0.25, 0.4, "lowpass=f=5000,");
  for (const ts of [0.1, 0.45, 0.8, 1.2]) sfx("golem-clay-squelch", w("L05", "shaped", 3.2) + ts, 0.8);
  for (const tt of stepTimes(line("L08") + 0.3, lend("L08"), 0.45)) sfx("golem-step", tt, 0.45);
  lib("kenney/rpg/doorClose_1.ogg", line("L15") + 0.02, 0.9);
  lib("kenney/impact/impactSoft_medium_003.ogg", line("L15") + 0.02, 0.5);
  sfx("golem-door-split", w("L16", "doors", 1.5) + 0.1, 1.0);
  sfx("golem-door-split", line("L15") - 0.3, 0.3, "lowpass=f=1200,");   // the distant crack that leads into "Rabbi!"
  sfx("golem-cart-crash", w("L16", "carts", 2.6) + 0.35, 1.0);
  for (const tt of [0.4, 0.85, 4.1, 4.6, 5.0]) sfx("golem-step", line("L16") + tt, 0.9);
  sfx("golem-crumble", lend("L17") + 0.4, 1.0);
  sfx("golem-attic-thud", thud, 1.0);
  { const f = `assets/sfx/ai/storm-wind/storm-wind-01.wav`, s0 = line("L13") + A("L13").d * 0.5, e0 = line("L14") + 1.5;   // street tone for the L13 hold
    if (existsSync(f)) add(f, s0, 0.2, `aloop=loop=-1:size=2e9,atrim=0:${(e0 - s0).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=1500,afade=t=in:d=0.3,afade=t=out:st=${(e0 - s0 - 0.8).toFixed(2)}:d=0.8,`); }
  // the beds end at the line end, so nothing but silence plays for the 0.4 s after "the word" (music + ambience killed)
  const mixPath = `${OUT}/golem-mix.wav`, end = `apad=whole_dur=${DUR.toFixed(3)},atrim=0:${DUR.toFixed(3)}`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...Sx.ins, "-filter_complex", Sx.f.join(";") + ";" + Sx.tags.join("") + `amix=inputs=${Sx.tags.length}:normalize=0,${end},loudnorm=I=-16:TP=-3:LRA=11,alimiter=limit=0.89:level=disabled:attack=1:release=30,${end}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { maxBuffer: 1 << 26 });
  writeFileSync(`${OUT}/golem-timeline.json`, JSON.stringify({ title: TITLE, missing: MISSING, cuts: CUTLOG, beats: TL.map((b) => ({ line: b.line || b.id, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })) }, null, 1));
  return mixPath;
}
export const GAIN = 1;
export const NOFADE = true;
