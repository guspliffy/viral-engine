#!/usr/bin/env node
// Cheap automatic checks for a rendered clip. Run them on a --draft render before spending minutes on the full one,
// and again on the final MP4. Exit code 0 = pass (warnings allowed), 1 = fail, 2 = usage error.
//
//   node qa/check.mjs out/test-01-golden-v2.mp4                       -> finds out/test-01-golden-v2.layout.json if present
//   node qa/check.mjs clip.mp4 --sb storyboards/x.json --layout x.layout.json --json
//
// Works for any renderer: the MP4 checks need nothing else, and the caption checks read a layout file
// { fps, samples: [{ t, captions: [[x,y,w,h]] or [{ box, covered? }], actors: [{ id, box }] }] } in output pixels.
// `covered` (0..1) is the share of the caption box hidden behind characters; renderers that can't measure it
// leave it out and the check falls back to the coarser character boxes.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { compile } from "../engine/compile.mjs";

export const RULES = {
  size: [1080, 1920],
  safe: { x0: 60, y0: 210, x1: 920, y1: 1360 }, // outside this, TikTok's buttons, caption and bars cover the picture
  whiteY: 235, // a frame whose darkest pixel is this bright (0..255) is a blank white frame
  blackY: 20, // a frame whose brightest pixel is this dark is an empty black frame
  lufs: [-15.5, -12.5], truePeakMax: -1.0, silentLUFS: -40,
  coverWarn: 0.08, coverFail: 0.25, coverFailHold: 0.5, // share of a caption hidden by characters; fail if held 0.5 s
  // from the algorithm research (docs/PLAN.md, Studio roadmap)
  length: { min: 8, ideal: [12, 20], max: 25 }, // 20-25 s only with an "escalation" beat in the storyboard
  hookMotion: 0.3, // something must move within the first 0.3 s
  maxEventGap: 2.0, // storyboard: something new at least every 2 s
  stillHold: 2.0, stillDiff: 0.35, // render: no stretch this long where the picture barely changes (mean |dY| per frame)
  loopSSIM: 0.55, // last frame vs first frame, when the storyboard says loop: true
  wordsPerSec: 3.5, // reading speed of a caption over its time on screen
  gore: /blood|gore|splat|guts|mash|sever|dismember|decapit/i,
  // clean-render guards
  clipWarn: 0.1, clipFail: 0.25, clipHold: 0.2, // how deep a character goes into a prop or another character (0..1)
  popDiff: 6, popRatio: 3, // a one-frame jump in the picture this much bigger than its neighbours, away from cuts/fx
  strobeJump: 20, strobeMax: 3, // brightness jumps per second before it reads as strobing
};

function args() {
  const a = process.argv.slice(2), o = { clip: null, sb: null, layout: null, json: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--json") o.json = true;
    else o.clip = a[i];
  }
  if (!o.clip) { console.error("usage: node qa/check.mjs <clip.mp4> [--sb storyboard.json] [--layout layout.json] [--json]"); process.exit(2); }
  return o;
}

const run = (cmd, argv) => { const r = spawnSync(cmd, argv, { encoding: "utf8", maxBuffer: 64 << 20 }); if (r.error) throw r.error; return r; };

export function checkClip(clip, { sb = null, layout = null } = {}) {
  const res = [], add = (level, check, msg) => res.push({ level, check, msg });
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

  // --- hook: frame 0 is a real picture and something moves at once
  if (frames.length) {
    const f0 = frames[0];
    if (f0.YMAX - f0.YMIN < 30 || f0.YMAX <= 40) add("fail", "hook", `frame 0 is blank or flat (Y ${f0.YMIN}-${f0.YMAX}): open on a character mid-action`);
    else {
      const early = frames.filter((f) => f.t > 0 && f.t <= RULES.hookMotion + 1e-6).reduce((m, f) => Math.max(m, f.YDIF || 0), 0);
      add(early >= RULES.stillDiff ? "pass" : "fail", "hook", early >= RULES.stillDiff ? `moving from the first frame (dY ${early.toFixed(2)})` : `nothing moves in the first ${RULES.hookMotion} s: open mid-action`);
    }
    // long holds where the picture barely changes
    let run = 0, worst = 0, at = 0;
    for (const f of frames.slice(1)) { if ((f.YDIF || 0) < RULES.stillDiff) { run += 1 / fps; if (run > worst) { worst = run; at = f.t - run; } } else run = 0; }
    add(worst > RULES.stillHold ? "fail" : worst > 1.0 ? "warn" : "pass", "still-hold", `longest near-still stretch ${worst.toFixed(1)} s${worst > 1 ? " from " + at.toFixed(1) + " s" : ""}`);
  }

  // --- clean picture: one-frame pops away from cuts and effects, strobing
  if (frames.length > 2) {
    const cuts = (sb?.shots || []).map((x) => x.at), fxs = (sb?.fx || []).filter((f) => ["flash", "impact", "poof", "shake"].includes(f.do)).map((f) => [f.at - 0.05, f.at + (f.dur ?? 0.3) + 0.1]);
    const explained = (t) => cuts.some((c) => Math.abs(t - c) < 1.5 / fps) || fxs.some(([a, b]) => t >= a && t <= b) || t < 1.5 / fps;
    const pops = [];
    for (let i = 1; i < frames.length - 1; i++) {
      const d = frames[i].YDIF || 0, nb = Math.max(frames[i - 1].YDIF || 0, frames[i + 1].YDIF || 0);
      if (d > RULES.popDiff && d > RULES.popRatio * nb && !explained(frames[i].t)) pops.push(frames[i].t);
    }
    add(pops.length ? "warn" : "pass", "pops", pops.length ? `sudden one-frame jumps at ${pops.slice(0, 6).map((t) => t.toFixed(2) + "s").join(", ")}: check for popping objects` : "no unexplained one-frame jumps");
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

  // --- loop seam: does the last frame lead back into the first?
  if (sb?.loop) {
    const r = run("ffmpeg", ["-v", "info", "-i", clip, "-sseof", "-0.04", "-i", clip, "-filter_complex", "[0:v]trim=end_frame=1,scale=270:480[a];[1:v]trim=end_frame=1,scale=270:480[b];[a][b]ssim", "-f", "null", "-"]).stderr;
    const ssim = Number((r.match(/All:([\d.]+)/) || [])[1]);
    if (Number.isFinite(ssim)) add(ssim >= RULES.loopSSIM ? "pass" : "fail", "loop", `last frame vs first: SSIM ${ssim.toFixed(2)} (min ${RULES.loopSSIM})`);
  }

  // --- storyboard rules: length, cadence, reading speed, cartoon-only violence
  if (sb?.actions || sb?.shots) {
    const L = RULES.length, d = sb.duration, esc = (sb.beats || []).some((b) => b.kind === "escalation") || sb.escalation;
    if (d < L.min || d > L.max) add("fail", "length", `${d} s: must be ${L.min}-${L.max} s (very short clips aren't eligible for For You)`);
    else if (d > L.ideal[1] && !esc) add("fail", "length", `${d} s: over ${L.ideal[1]} s needs a second "escalation" beat`);
    else if (d < L.ideal[0]) add("warn", "length", `${d} s: shorter than the ${L.ideal.join("-")} s sweet spot`);
    else add("pass", "length", `${d} s`);
    const ev = [0, d];
    for (const x of sb.shots || []) ev.push(x.at);
    for (const x of sb.actions || []) if (!["look", "blink", "noblink"].includes(x.do)) ev.push(x.at);
    for (const x of sb.fx || []) ev.push(x.at);
    for (const x of sb.captions || []) ev.push(x.from);
    for (const x of sb.sfx || []) ev.push(x.at);
    ev.sort((a, b) => a - b);
    let gap = 0, from = 0; for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > gap) { gap = ev[i] - ev[i - 1]; from = ev[i - 1]; }
    add(gap > RULES.maxEventGap ? "fail" : "pass", "cadence", `longest gap between events ${gap.toFixed(1)} s${gap > 1 ? " from " + from.toFixed(1) + " s" : ""} (max ${RULES.maxEventGap})`);
    for (const c of sb.captions || []) {
      const words = c.text.trim().split(/\s+/).length, wps = words / Math.max(0.1, c.to - c.from);
      if (wps > RULES.wordsPerSec) add("warn", "reading-speed", `"${c.text.slice(0, 40)}": ${wps.toFixed(1)} words/s, hard to read (max ${RULES.wordsPerSec})`);
    }
    const bad = [...(sb.fx || []), ...(sb.actions || [])].filter((x) => RULES.gore.test(JSON.stringify(x)));
    if (bad.length) add("fail", "cartoon-only", `graphic-looking effects (${bad.map((x) => x.do).join(", ")}): use stars, dust or squash instead`);
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
    for (const [k, t] of outside) add("fail", "caption-safe-zone", `"${k}" leaves the safe zone at ${t.toFixed(2)}s`);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args();
  const guess = o.clip.replace(/(-safe)?(-draft)?\.mp4$/, ".layout.json");
  const layoutFile = o.layout || (fs.existsSync(guess) ? guess : null);
  const layout = layoutFile ? JSON.parse(fs.readFileSync(layoutFile, "utf8")) : null;
  let sb = o.sb ? compile(JSON.parse(fs.readFileSync(o.sb, "utf8"))) : null;
  if (!sb && layout?.duration != null) sb = { duration: layout.duration };
  const res = checkClip(o.clip, { sb, layout });
  const failed = res.some((r) => r.level === "fail");
  if (o.json) console.log(JSON.stringify({ clip: o.clip, layout: layoutFile, pass: !failed, results: res }, null, 2));
  else {
    console.log(`${path.basename(o.clip)}${layoutFile ? "  (layout: " + path.basename(layoutFile) + ")" : ""}`);
    for (const r of res) console.log(`  ${{ pass: "ok  ", warn: "WARN", fail: "FAIL" }[r.level]}  ${r.check}: ${r.msg}`);
    console.log(failed ? "FAIL" : "PASS");
  }
  process.exit(failed ? 1 : 0);
}
