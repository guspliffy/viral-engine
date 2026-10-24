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

export const RULES = {
  size: [1080, 1920],
  safe: { x0: 60, y0: 210, x1: 920, y1: 1360 }, // outside this, TikTok's buttons, caption and bars cover the picture
  whiteY: 235, // a frame whose darkest pixel is this bright (0..255) is a blank white frame
  blackY: 20, // a frame whose brightest pixel is this dark is an empty black frame
  lufs: [-15.5, -12.5], truePeakMax: -1.0, silentLUFS: -40,
  coverWarn: 0.08, coverFail: 0.25, coverFailHold: 0.5, // share of a caption hidden by characters; fail if held 0.5 s
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
    const k = ln.match(/lavfi\.signalstats\.(YMIN|YMAX|YAVG)=([\d.]+)/); if (k && cur) cur[k[1]] = Number(k[2]);
  }
  const white = frames.filter((f) => f.YMIN >= RULES.whiteY), black = frames.filter((f) => f.YMAX <= RULES.blackY);
  const ts = (l) => l.slice(0, 6).map((f) => f.t.toFixed(2) + "s").join(", ") + (l.length > 6 ? ", ..." : "");
  if (white.length) add("fail", "white-frames", `${white.length} blank white frame(s) at ${ts(white)}`);
  if (black.length) add("fail", "black-frames", `${black.length} empty black frame(s) at ${ts(black)}`);
  if (!white.length && !black.length) add("pass", "frames", `${frames.length} frames, none blank`);

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
  let sb = o.sb ? JSON.parse(fs.readFileSync(o.sb, "utf8")) : null;
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
