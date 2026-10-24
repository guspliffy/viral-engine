#!/usr/bin/env node
// Cheap automatic checks for a rendered clip. Run them on a --draft render before spending minutes on the full one,
// and again on the final MP4. Exit code 0 = pass (warnings and notes allowed), 1 = fail, 2 = usage error.
//
//   node qa/check.mjs out/test-01-golden-v2.mp4                       -> finds out/test-01-golden-v2.layout.json if present
//   node qa/check.mjs clip.mp4 --sb storyboards/x.json --layout x.layout.json --json
//   node qa/check.mjs clip.mp4 --sb x.json --profile rewards           -> publishing profile (default: the storyboard's, else "short")
//
// Results come in three groups, kept apart so a report never passes off a creative guess as a platform fact:
//   technical   defects in the file, picture or sound: blank or odd frames, loudness, clipping, hidden captions (fail/warn)
//   publishing  the target platform's published requirements, per profile (PROFILES), with the date they were checked
//   creative    house-style defaults (opening motion, event gaps, target length, loop seam, still holds, reading
//               speed): hypotheses to test, measured as diagnostics. They add notes and never fail a clip. A storyboard
//               changes them in a "creative" block, e.g. { "length": [8, 15], "maxEventGap": 3 }.
//
// Works for any renderer: the MP4 checks need nothing else, and the caption checks read a layout file
// { fps, samples: [{ t, captions: [[x,y,w,h]] or [{ box, covered? }], actors: [{ id, box }] }] } in output pixels.
// `covered` (0..1) is the share of the caption box hidden behind characters; renderers that can't measure it
// leave it out and the check falls back to the coarser character boxes.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { compile } from "../engine/compile.mjs";
import { motionJumps } from "./motion.mjs";
import { musicFlavour, seedOf } from "../puppet/beat.mjs";

export const RULES = {
  size: [1080, 1920],
  safe: { x0: 60, y0: 210, x1: 920, y1: 1360 }, // outside this, TikTok's buttons, caption and bars cover the picture
  whiteY: 235, // a frame whose darkest pixel is this bright (0..255) is a blank white frame
  blackY: 20, // a frame whose brightest pixel is this dark is an empty black frame
  lufs: [-15.5, -12.5], truePeakMax: -1.0, silentLUFS: -40,
  coverWarn: 0.08, coverFail: 0.25, coverFailHold: 0.5, // share of a caption hidden by characters; fail if held 0.5 s
  stillDiff: 0.35, // mean |dY| per frame below which the picture counts as still
  gore: /blood|gore|splat|guts|\bmash|sever|dismember|decapit/i,
  // clean-render guards
  clipWarn: 0.1, clipFail: 0.25, clipHold: 0.2, // how deep a character goes into a prop or another character (0..1)
  oddFrame: 8, oddFrameFail: 30, // a frame that differs from both neighbours while they agree (a one-frame pop), 0..255
  spinStep: 90, // degrees a character may turn between two frames before the turn strobes (front, back, front)
  strobeJump: 20, strobeMax: 3, // brightness jumps per second before it reads as strobing
};

// Creative defaults: the house style from the algorithm research (docs/PLAN.md, Studio roadmap). None of these is a
// published platform rule; they are the starting point for experiments (experiments/README.md), so they only add notes.
export const CREATIVE = {
  length: [12, 20], // target band in seconds; over the top needs an "escalation" beat
  openingMotion: 0.3, // the picture changes within this many seconds
  maxEventGap: 2.0, // longest stretch without an event start (shots, actions, effects, sounds and captions all count)
  stillHold: 2.0, // longest stretch where the picture barely changes
  loopSSIM: 0.55, // similarity of last and first frame, when the storyboard says loop: true
  wordsPerSec: 3.5, // caption reading speed
};

// Publishing profiles: what the target platforms publish as requirements, and when that was last checked. Length is
// the only one with hard numbers so far; the caption safe zone (RULES.safe) and cartoon-only violence apply to all.
export const PROFILES = {
  short: {
    name: "TikTok + YouTube Shorts discovery clip", checked: "2026-10-24",
    length: { max: 180, why: "YouTube treats a vertical video over 3 minutes as a regular video, not a Short" },
  },
  rewards: {
    name: "TikTok Creator Rewards (over one minute)", checked: "2026-10-24",
    length: { min: 60, warnUnder: 65, why: "Creator Rewards counts original videos over one minute; length alone doesn't make a clip eligible" },
    source: "support.tiktok.com/en/business-and-creator/creator-rewards-program",
    creative: { length: [65, 90] },
  },
};

// which group each check belongs to (anything not listed is technical)
const GROUP = { "length-limit": "publishing", "caption-safe-zone": "publishing", "cartoon-only": "publishing",
  opening: "creative", "still-hold": "creative", loop: "creative", length: "creative", "event-gaps": "creative", "reading-speed": "creative" };
export const groupOf = (check) => GROUP[check] ?? "technical";

function args() {
  const a = process.argv.slice(2), o = { clip: null, sb: null, layout: null, json: false, profile: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--profile") o.profile = a[++i];
    else if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--json") o.json = true;
    else o.clip = a[i];
  }
  if (!o.clip) { console.error("usage: node qa/check.mjs <clip.mp4> [--sb storyboard.json] [--layout layout.json] [--profile short|rewards] [--json]"); process.exit(2); }
  return o;
}

const run = (cmd, argv) => { const r = spawnSync(cmd, argv, { encoding: argv.includes("rawvideo") ? "buffer" : "utf8", maxBuffer: 256 << 20 }); if (r.error) throw r.error; return r; };

// One-frame glitches: a frame that differs from both its neighbours while they agree with each other, and the
// picture around it is steady (a hat that drops for a frame, a pose that flashes, a spin that strobes, see-through
// parts that swap). Measured on a 36x64 grey copy, in overlapping 12x12 blocks (a third of the width):
// score = min(|F[i]-F[i-1]|, |F[i]-F[i+1]|) - max(|F[i+1]-F[i-1]|, |F[i-1]-F[i-2]|, |F[i+2]-F[i+1]|), mean per pixel.
// Steady motion, cuts and fades score near 0; a quick symmetric bounce scores low because its neighbours move too.
export function oddFrames(clip, fps = 30) {
  const W = 36, H = 64, B = 12, N = W * H;
  const raw = run("ffmpeg", ["-v", "error", "-i", clip, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
  const buf = Buffer.isBuffer(raw.stdout) ? raw.stdout : Buffer.from(raw.stdout || "", "latin1"), n = Math.floor(buf.length / N), F = (i) => buf.subarray(i * N, (i + 1) * N);
  const out = [];
  for (let i = 2; i < n - 2; i++) {
    const pp = F(i - 2), p = F(i - 1), c = F(i), q = F(i + 1), qq = F(i + 2); let best = 0, at = [0, 0];
    for (let by = 0; by + B <= H; by += B / 2) for (let bx = 0; bx + B <= W; bx += B / 2) {
      let a = 0, b = 0, m = 0, d = 0, e = 0;
      for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) { const k = y * W + x; a += Math.abs(c[k] - p[k]); b += Math.abs(c[k] - q[k]); m += Math.abs(q[k] - p[k]); d += Math.abs(p[k] - pp[k]); e += Math.abs(qq[k] - q[k]); }
      const s = (Math.min(a, b) - Math.max(m, d, e)) / (B * B);
      if (s > best) { best = s; at = [bx, by]; }
    }
    if (best > 0) out.push({ t: i / fps, score: best, where: `${["left", "middle", "middle", "right", "right"][at[0] / 6]} ${at[1] < 22 ? "top" : at[1] < 42 ? "centre" : "bottom"}` });
  }
  return out.sort((x, y) => y.score - x.score);
}

export function checkClip(clip, { sb = null, layout = null, profile = null } = {}) {
  const pname = profile || sb?.profile || "short", P = PROFILES[pname];
  if (!P) throw new Error(`unknown profile "${pname}" (known: ${Object.keys(PROFILES).join(", ")})`);
  const C = { ...CREATIVE, ...(P.creative || {}), ...(sb?.creative || {}) };
  // creative results are notes, never failures
  const res = [], add = (level, check, msg) => { const group = groupOf(check); res.push({ group, level: group === "creative" && level !== "pass" ? "note" : level, check, msg }); };
  if (!fs.existsSync(clip)) { add("fail", "file", `${clip} not found`); return res; }

  // --- container: size, duration, streams
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", clip]).stdout || "{}");
  const v = (probe.streams || []).find((s) => s.codec_type === "video"), a = (probe.streams || []).find((s) => s.codec_type === "audio");
  if (!v) { add("fail", "video", "no video stream"); return res; }
  const [fw, fh] = [v.width, v.height], [rn, rd] = (v.r_frame_rate || "30/1").split("/").map(Number), fps = rn / (rd || 1);
  if (fw !== RULES.size[0] || fh !== RULES.size[1]) add("fail", "size", `${fw}x${fh}, expected ${RULES.size.join("x")}`);
  else add("pass", "size", `${fw}x${fh} @ ${fps.toFixed(2)} fps`);
  const dur = Number(probe.format?.duration ?? v.duration);
  if (sb?.duration != null) {
    const off = Math.abs(dur - sb.duration);
    add(off <= 1.5 / fps ? "pass" : "fail", "duration", `${dur.toFixed(3)} s, storyboard says ${sb.duration} s`);
  } else add("pass", "duration", `${dur.toFixed(3)} s (no storyboard to compare)`);

  // --- every frame, at low resolution: blank white or empty black frames
  const st = run("ffmpeg", ["-v", "error", "-i", clip, "-vf", "scale=108:192,signalstats,metadata=print:file=-", "-an", "-f", "null", "-"]).stdout;
  const frames = []; let cur = null;
  for (const ln of st.split("\n")) {
    const m = ln.match(/pts_time:([\d.]+)/); if (m) { cur = { t: Number(m[1]) }; frames.push(cur); continue; }
    const k = ln.match(/lavfi\.signalstats\.(YMIN|YMAX|YAVG|YDIF)=([\d.]+)/); if (k && cur) cur[k[1]] = Number(k[2]);
  }
  const white = frames.filter((f) => f.YMIN >= RULES.whiteY), black = frames.filter((f) => f.YMAX <= RULES.blackY);
  const ts = (l) => l.slice(0, 6).map((f) => f.t.toFixed(2) + "s").join(", ") + (l.length > 6 ? ", ..." : "");
  if (white.length) add("fail", "white-frames", `${white.length} blank white frame(s) at ${ts(white)}`);
  if (black.length) add("fail", "black-frames", `${black.length} empty black frame(s) at ${ts(black)}`);
  if (!white.length && !black.length) add("pass", "frames", `${frames.length} frames, none blank`);

  // --- opening: frame 0 is a real picture and the picture changes at once (measures pixels, not whether the
  // premise is clear; that is for the review)
  if (frames.length) {
    const f0 = frames[0];
    if (f0.YMAX - f0.YMIN < 30 || f0.YMAX <= 40) add("note", "opening", `frame 0 is flat (Y ${f0.YMIN}-${f0.YMAX}), like a title card or fade-in`);
    else {
      const early = frames.filter((f) => f.t > 0 && f.t <= C.openingMotion + 1e-6).reduce((m, f) => Math.max(m, f.YDIF || 0), 0);
      add(early >= RULES.stillDiff ? "pass" : "note", "opening", early >= RULES.stillDiff ? `the picture changes from the first frame (dY ${early.toFixed(2)})` : `the picture barely changes in the first ${C.openingMotion} s`);
    }
    // long holds where the picture barely changes (fine when deliberate, such as a reaction hold)
    let run = 0, worst = 0, at = 0;
    for (const f of frames.slice(1)) { if ((f.YDIF || 0) < RULES.stillDiff) { run += 1 / fps; if (run > worst) { worst = run; at = f.t - run; } } else run = 0; }
    add(worst > C.stillHold ? "note" : "pass", "still-hold", `longest near-still stretch ${worst.toFixed(1)} s${worst > 1 ? " from " + at.toFixed(1) + " s" : ""}${worst > C.stillHold ? ` (house style: under ${C.stillHold} s)` : ""}`);
  }

  // --- clean picture: one-frame pops away from cuts and effects, strobing
  if (frames.length > 2) {
    const cuts = (sb?.shots || []).map((x) => x.at);
    // no exceptions for cuts, flashes or shakes: none of them makes a single odd frame when it works as it should
    const pops = oddFrames(clip, fps).filter((o) => o.score > RULES.oddFrame);
    add(pops.some((o) => o.score > RULES.oddFrameFail) ? "fail" : pops.length ? "warn" : "pass", "pops", pops.length ? `odd single frames at ${pops.slice(0, 6).map((o) => `${o.t.toFixed(2)}s (${o.score.toFixed(0)}, ${o.where})`).join(", ")}: something pops, flickers or strobes for one frame` : "no odd single frames");
    const jumps = []; for (let i = 1; i < frames.length; i++) if (Math.abs((frames[i].YAVG || 0) - (frames[i - 1].YAVG || 0)) > RULES.strobeJump) jumps.push(frames[i].t);
    let worstJ = 0, atJ = 0; for (const t of jumps) { const n = jumps.filter((u) => u >= t && u < t + 1).length; if (n > worstJ) { worstJ = n; atJ = t; } }
    add(worstJ > RULES.strobeMax ? "fail" : "pass", "strobe", worstJ > RULES.strobeMax ? `${worstJ} big brightness jumps within 1 s from ${atJ.toFixed(2)} s: strobing reads as a glitch` : `at most ${worstJ} big brightness jumps per second`);
    if (sb?.shots && sb?.fx) for (const f of sb.fx.filter((x) => x.do === "flash"))
      for (const c of cuts) if (f.at - c > 0.001 && f.at - c <= 0.1) add("warn", "cut-flash", `flash at ${f.at}s starts just after the cut at ${c}s: the new shot shows a frame before the flash`);
  }

  // --- sound: present, not silent, loudness and true peak
  if (!a) add("fail", "audio", "no audio stream");
  else {
    const e = run("ffmpeg", ["-v", "info", "-nostats", "-i", clip, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
    const sum = e.slice(e.lastIndexOf("Summary:"));
    const I = Number((sum.match(/I:\s+(-?[\d.]+|-inf)/) || [])[1]), TP = Number((sum.match(/Peak:\s+(-?[\d.]+|-inf)/) || [])[1]);
    if (!Number.isFinite(I) || I < RULES.silentLUFS) add("fail", "audio", `audio is silent (${sum.match(/I:\s+\S+/)?.[0] ?? "no reading"})`);
    else {
      const ok = I >= RULES.lufs[0] && I <= RULES.lufs[1];
      add(ok ? "pass" : "fail", "loudness", `${I.toFixed(1)} LUFS (target ${RULES.lufs.join("..")})`);
      add(TP <= RULES.truePeakMax ? "pass" : "fail", "true-peak", `${TP.toFixed(1)} dBTP (max ${RULES.truePeakMax})`);
    }
  }

  // --- loop seam: how alike the last and first frames are (similarity, not whether the replay makes sense)
  if (sb?.loop) {
    const r = run("ffmpeg", ["-v", "info", "-i", clip, "-sseof", "-0.04", "-i", clip, "-filter_complex", "[0:v]trim=end_frame=1,scale=270:480[a];[1:v]trim=end_frame=1,scale=270:480[b];[a][b]ssim", "-f", "null", "-"]).stderr;
    const ssim = Number((r.match(/All:([\d.]+)/) || [])[1]);
    if (Number.isFinite(ssim)) add(ssim >= C.loopSSIM ? "pass" : "note", "loop", `last frame vs first: similarity (SSIM) ${ssim.toFixed(2)} (house style: ${C.loopSSIM} or more)`);
  }

  // --- storyboard: length (platform limits, then the house target), event gaps, reading speed, cartoon-only violence
  if (sb?.actions || sb?.shots) {
    const PL = P.length || {}, d = sb.duration, esc = (sb.beats || []).some((b) => b.kind === "escalation") || sb.escalation;
    if ((PL.min != null && d <= PL.min) || (PL.max != null && d > PL.max)) add("fail", "length-limit", `${d} s: the ${pname} profile needs ${PL.min != null ? "over " + PL.min + " s" : ""}${PL.min != null && PL.max != null ? " and " : ""}${PL.max != null ? "at most " + PL.max + " s" : ""} (${PL.why})`);
    else if (PL.warnUnder != null && d < PL.warnUnder) add("warn", "length-limit", `${d} s: close to the ${PL.min} s line of the ${pname} profile; aim for ${PL.warnUnder} s or more`);
    else add("pass", "length-limit", `${d} s fits the ${pname} profile`);
    const L = C.length;
    if (d > L[1] && !esc) add("note", "length", `${d} s: over the ${L.join("-")} s house target without an "escalation" beat`);
    else if (d < L[0] || d > L[1]) add("note", "length", `${d} s: outside the ${L.join("-")} s house target`);
    else add("pass", "length", `${d} s, inside the ${L.join("-")} s house target`);
    const ev = [0, d];
    for (const x of sb.shots || []) ev.push(x.at);
    for (const x of sb.actions || []) if (!["look", "blink", "noblink"].includes(x.do)) ev.push(x.at);
    for (const x of sb.fx || []) ev.push(x.at);
    for (const x of sb.captions || []) ev.push(x.from);
    for (const x of sb.sfx || []) ev.push(x.at);
    ev.sort((a, b) => a - b);
    let gap = 0, from = 0; for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > gap) { gap = ev[i] - ev[i - 1]; from = ev[i - 1]; }
    // counts event starts (sounds and captions included), not story information: a deliberate pause is fine
    add(gap > C.maxEventGap ? "note" : "pass", "event-gaps", `longest gap between event starts ${gap.toFixed(1)} s${gap > 1 ? " from " + from.toFixed(1) + " s" : ""} (house style: ${C.maxEventGap} s or less)`);
    for (const c of sb.captions || []) {
      const words = c.text.trim().split(/\s+/).length, wps = words / Math.max(0.1, c.to - c.from);
      if (wps > C.wordsPerSec) add("note", "reading-speed", `"${c.text.slice(0, 40)}": ${wps.toFixed(1)} words/s on screen (house style: ${C.wordsPerSec} or less)`);
    }
    // turns too fast for 30 fps strobe (the eye sees front, back, front); spins use a sine ease (top speed 1.6x average)
    for (const x of (sb.actions || []).filter((y) => y.do === "spin")) {
      const step = (360 * (x.turns ?? 1) * 1.6) / ((x.dur ?? 1) * fps);
      if (step > RULES.spinStep) add("warn", "spin-speed", `${x.who}'s spin at ${x.at}s turns up to ${step.toFixed(0)}° a frame (max ${RULES.spinStep}): give it more time or fewer turns`);
    }
    const bad = [...(sb.fx || []), ...(sb.actions || [])].filter((x) => RULES.gore.test(JSON.stringify(x)));
    if (bad.length) add("fail", "cartoon-only", `graphic-looking effects (${bad.map((x) => x.do).join(", ")}): use stars, dust or squash instead (graphic violence isn't eligible for For You)`);
    else add("pass", "cartoon-only", "no graphic-looking effects");
  }

  // --- captions: inside the safe zone, not hidden behind characters
  if (layout) {
    const { x0, y0, x1, y1 } = RULES.safe, outside = new Map(), held = new Map(), worst = new Map();
    const step = layout.samples.length > 1 ? layout.samples[1].t - layout.samples[0].t : 0.1;
    for (const s of layout.samples) {
      (s.captions || []).forEach((c, i) => {
        const box = Array.isArray(c) ? c : c.box, key = (c.text || `caption ${i + 1}`).slice(0, 40);
        const [x, y, w, h] = box;
        if (x < x0 || y < y0 || x + w > x1 || y + h > y1) if (!outside.has(key)) outside.set(key, s.t);
        let cov = c.covered;
        if (cov == null) { // fallback: share of the caption box inside any character box
          cov = 0;
          for (const ac of s.actors || []) {
            if (!ac.box) continue;
            const [ax, ay, aw, ah] = ac.box, ix = Math.max(0, Math.min(x + w, ax + aw) - Math.max(x, ax)), iy = Math.max(0, Math.min(y + h, ay + ah) - Math.max(y, ay));
            cov = Math.max(cov, (ix * iy) / (w * h));
          }
        }
        const wv = worst.get(key); if (!wv || cov > wv.cov) worst.set(key, { cov, t: s.t, fallback: c.covered == null });
        const hd = held.get(key) || { run: 0, max: 0, at: null };
        if (cov > RULES.coverFail) { hd.run += step; if (hd.run > hd.max) { hd.max = hd.run; hd.at = s.t; } } else hd.run = 0;
        held.set(key, hd);
      });
    }
    // characters passing through props or each other (layout "clips", from the 3D engine)
    if (layout.samples.some((x) => x.clips)) {
      const allowed = (who, t) => (sb?.allowClip || []).some((a) => (a.who === who || a.with === who) && t >= a.from && t <= a.to);
      const runs = new Map();
      for (const x of layout.samples) for (const c of x.clips || []) {
        if (allowed(c.who, x.t)) continue;
        const k = `${c.who} / ${c.with}`, r = runs.get(k) || { max: 0, at: 0, run: 0, held: 0, last: -1 };
        if (c.depth > r.max) { r.max = c.depth; r.at = x.t; }
        if (c.depth > RULES.clipFail) { r.run = Math.abs(x.t - r.last - step) < 1e-3 ? r.run + step : step; r.last = x.t; r.held = Math.max(r.held, r.run); }
        runs.set(k, r);
      }
      for (const [k, r] of runs) {
        const lvl = r.held + 1e-6 >= RULES.clipHold ? "fail" : r.max > RULES.clipWarn ? "warn" : "pass";
        add(lvl, "clipping", `${k}: up to ${Math.round(r.max * 100)}% into each other at ${r.at.toFixed(1)}s${lvl === "fail" ? ", held " + r.held.toFixed(1) + "s" : ""}`);
      }
      if (!runs.size) add("pass", "clipping", "nobody passes through props or each other");
    }
    for (const [k, t] of outside) add("fail", "caption-safe-zone", `"${k}" leaves the safe zone at ${t.toFixed(2)}s: the app's buttons and text cover it there`);
    if (!outside.size && worst.size) add("pass", "caption-safe-zone", "every caption stays clear of the app's buttons and text");
    for (const [k, w] of worst) {
      const hd = held.get(k), msg = `"${k}": up to ${(w.cov * 100).toFixed(0)}% hidden behind characters at ${w.t.toFixed(2)}s${w.fallback ? " (box estimate)" : ""}`;
      if (hd.max + 1e-6 >= RULES.coverFailHold) add(w.fallback ? "warn" : "fail", "caption-overlap", `${msg}, held ${hd.max.toFixed(1)}s`);
      else if (w.cov > RULES.coverWarn) add("warn", "caption-overlap", msg);
      else add("pass", "caption-overlap", msg);
    }
    if (!worst.size) add("pass", "captions", "no captions");
  } else add("warn", "captions", "no layout file, caption placement not checked");
  return res;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args();
  const guess = o.clip.replace(/(-safe)?(-draft)?\.mp4$/, ".layout.json");
  const layoutFile = o.layout || (fs.existsSync(guess) ? guess : null);
  const layout = layoutFile ? JSON.parse(fs.readFileSync(layoutFile, "utf8")) : null;
  let sb = o.sb ? compile(JSON.parse(fs.readFileSync(o.sb, "utf8"))) : null;
  if (!sb && layout?.duration != null) sb = { duration: layout.duration };
  const res = checkClip(o.clip, { sb, layout, profile: o.profile });
  const profile = o.profile || sb?.profile || "short";
  // the storyboard's own motion, frame by frame (qa/motion.mjs): values that jump in one frame
  if (sb?.cast && sb?.actions) {
    if (sb.music !== false && !sb.music?.bpm) sb.music = { ...(sb.music || {}), bpm: musicFlavour(sb.music || {}, seedOf(sb)).bpm };
    const j = (await motionJumps(sb, sb.fps ?? 30)).filter((x) => !x.note);
    res.push({ group: "technical", level: j.length ? "warn" : "pass", check: "motion", msg: j.length ? `jumps in one frame: ${j.slice(0, 6).map((x) => `${x.who} ${x.what} at ${x.t.toFixed(2)}s`).join(", ")}${j.length > 6 ? ", ..." : ""}` : "no part of any character jumps between two frames" });
  }
  const failed = res.some((r) => r.level === "fail"), notes = res.filter((r) => r.level === "note").length;
  if (o.json) console.log(JSON.stringify({ clip: o.clip, layout: layoutFile, profile, experiment: sb?.experiment ?? null, pass: !failed, results: res }, null, 2));
  else {
    console.log(`${path.basename(o.clip)}${layoutFile ? "  (layout: " + path.basename(layoutFile) + ")" : ""}`);
    if (sb?.experiment) console.log(`  experiment ${sb.experiment.id ?? "?"}, variant ${sb.experiment.variant ?? "?"}, seed ${seedOf(sb)}`);
    const head = { technical: "technical", publishing: `publishing (profile ${profile}: ${PROFILES[profile].name}, checked ${PROFILES[profile].checked})`, creative: "creative notes (house-style hypotheses, never a failure)" };
    for (const g of ["technical", "publishing", "creative"]) {
      const rs = res.filter((r) => (r.group ?? groupOf(r.check)) === g); if (!rs.length) continue;
      console.log(` ${head[g]}`);
      for (const r of rs) console.log(`  ${{ pass: "ok  ", warn: "WARN", fail: "FAIL", note: "note" }[r.level]}  ${r.check}: ${r.msg}`);
    }
    console.log(`${failed ? "FAIL" : "PASS"}${notes ? ` (${notes} creative note${notes > 1 ? "s" : ""})` : ""}`);
  }
  process.exit(failed ? 1 : 0);
}
