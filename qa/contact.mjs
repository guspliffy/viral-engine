#!/usr/bin/env node
// Contact sheet of a clip for a quick human or model review: one still per beat, labelled with its time,
// in a grid of small frames (a few hundred KB, so a review costs a handful of image tokens, not a video).
//
//   node qa/contact.mjs out/test-01-golden.mp4 --sb storyboards/test-01-golden.json   -> out/test-01-golden.contact.png
//   node qa/contact.mjs clip.mp4 --times 0.5,2,3.1 [--cols 4] [--width 270] [--out sheet.png]
//   node qa/contact.mjs out/x-safe-draft-t0.50.png out/x-safe-draft-t2.00.png ...           -> sheet of draft stills (pre-render review)
//   node qa/contact.mjs out/x.mp4 --sb storyboards/x.json --cuts    -> out/x.cuts.png: one row per shot cut (and the loop
//                                                                     seam), 0.2 s either side, the first new frame marked red
//   node qa/contact.mjs out/x.mp4 --phone                          -> out/x.phone.png: one frame a second at 360 px wide,
//                                                                     the size people watch at: read every caption there
//
// Without --times the beats come from the storyboard: just after each shot starts, plus a frame mid-way through
// each shot longer than 1.5 s. Without a storyboard: 8 evenly spaced frames.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";
import { renderTime } from "../engine/shared/holds.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");

export function beatTimes(sb, max = 12) {
  // just after each shot starts, mid-way through long shots, plus the fixed review frames
  const dur = sb.duration, shots = [...(sb.shots || [])].sort((a, b) => a.at - b.at), t = [];
  for (const b of sb.beatSpans || []) t.push(b.from + Math.min(0.5, (b.to - b.from) * 0.6)); // one still inside each beat
  shots.forEach((s, i) => {
    const end = i + 1 < shots.length ? shots[i + 1].at : dur, len = end - s.at;
    t.push(s.at + Math.min(0.35, len / 3));
    if (len > 1.5) t.push(s.at + len * 0.7);
  });
  if (!t.length) for (let i = 0; i < 8; i++) t.push(((i + 0.5) / 8) * dur);
  // fixed review frames (algorithm research #13): the opening, 1.5 s and 3 s (hook + premise), the last frame
  t.push(0, 1.5, 3.0, dur - 0.04);
  const out = [...new Set(t.map((x) => Math.min(dur - 0.05, Math.round(x * 100) / 100)))].sort((a, b) => a - b);
  const fixed = new Set([0, 1.5, 3, Math.round((dur - 0.04) * 100) / 100]);
  for (let i = out.length - 1; i > 0; i--) if (!fixed.has(out[i]) && (out[i] - out[i - 1] < 0.3 || (out[i + 1] ?? 1e9) - out[i] < 0.3)) out.splice(i, 1); // drop near-duplicates of the fixed frames
  while (out.length > max) { const i = out.findIndex((x, k) => k > 0 && k < out.length - 1 && !fixed.has(x)); if (i < 0) break; out.splice(i, 1); }
  return out;
}

// clip: an MP4 (frames taken at `times`), or a list of PNG stills from `render.mjs --stills` (times read from their names)
export function contactSheet(clip, times, { cols = 4, width = 270, out } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "contact-")), files = [];
  const stills = Array.isArray(clip) ? clip : null;
  if (stills) stills.sort((a, b) => Number((a.match(/-t([\d.]+)\.png$/) || [])[1]) - Number((b.match(/-t([\d.]+)\.png$/) || [])[1]));
  if (stills) times = stills.map((f) => Number((f.match(/-t([\d.]+)\.png$/) || [])[1] ?? NaN));
  times.forEach((t, i) => {
    const f = path.join(tmp, `${String(i).padStart(2, "0")}.png`);
    const label = `drawtext=fontfile=${FONT}:text='${Number.isFinite(t) ? t.toFixed(2) + "s" : String(i + 1)}':x=8:y=8:fontsize=${Math.round(width / 11)}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4`;
    const src = stills ? ["-i", stills[i]] : ["-ss", String(t), "-i", clip];
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...src, "-frames:v", "1", "-vf", `scale=${width}:-2,${label}`, f]);
    if (r.status !== 0) throw new Error(`ffmpeg failed at ${t}s: ${r.stderr}`);
    files.push(f);
  });
  const rows = Math.ceil(files.length / cols);
  while (files.length < rows * cols) files.push(files[files.length - 1]); // pad the last row (drawn black below)
  const inputs = files.flatMap((f) => ["-i", f]);
  const pad = times.length < files.length ? files.slice(times.length).map((_, k) => `[${times.length + k}:v]drawbox=c=black:t=fill[p${k}];`).join("") : "";
  const labels = files.map((_, i) => (i < times.length ? `[${i}:v]` : `[p${i - times.length}]`)).join("");
  const layout = files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, (_, k) => `w${k}`).join("+") : 0}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, (_, k) => `h${k * cols}`).join("+") : 0}`).join("|");
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${pad}${labels}xstack=inputs=${files.length}:layout=${layout}`, out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`ffmpeg xstack failed: ${r.stderr}`);
  return out;
}

const probe = (clip, what) => spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", what, "-of", "csv=p=0", clip], { encoding: "utf8" }).stdout.trim();

// the cuts of a clip: the storyboard's shot starts (timeline.js cutBetween), else the frames that change far more than
// the frames around them (a 36x64 grey copy: |dY| over max(8, 4x the median of +-12 frames), as in qa/pace.py)
export function cutTimes(clip, sb, fps = 30) {
  if (sb) return Array.isArray(sb.camera) && sb.camera.length ? [] : (sb.shots || []).map((s) => s.at).filter((t) => t > 0 && t < sb.duration).sort((a, b) => a - b);
  const W = 36, H = 64, N = W * H, r = spawnSync("ffmpeg", ["-v", "error", "-i", clip, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 256 << 20 });
  const b = r.stdout, n = Math.floor(b.length / N), d = [0];
  for (let i = 1; i < n; i++) { let s = 0; for (let k = 0; k < N; k++) s += Math.abs(b[i * N + k] - b[(i - 1) * N + k]); d.push(s / N); }
  const med = (i) => { const w = d.slice(Math.max(1, i - 12), i + 13).sort((x, y) => x - y); return w[Math.floor(w.length / 2)]; };
  return d.map((x, i) => (i > 0 && x > Math.max(8, 4 * med(i)) && x >= d[i - 1] && x >= (d[i + 1] ?? 0) ? i / fps : null)).filter((x) => x != null);
}

// one row per cut: frames -6, -4, -2, -1 | 0, +2, +4, +6 around it (0.2 s either side at 30 fps), the first frame of the
// new shot with a red edge. A cut has to read in those frames: the eye lands on the same spot, the action carries on.
// With loop: true the seam (last frame -> first) gets a row too.
export function cutStrips(clip, cuts, { fps = 30, width = 180, out, loop = false, dur } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cuts-")), rows = [], K = [-6, -4, -2, -1, 0, 2, 4, 6];
  const n = Math.round((dur ?? Number(probe(clip, "format=duration"))) * fps);
  const grab = (f, file, mark, label) => {
    const vf = [`scale=${width}:-2`, mark ? "drawbox=x=0:y=0:w=6:h=ih:c=red:t=fill" : null, `drawtext=fontfile=${FONT}:text='${label}':x=6:y=6:fontsize=${Math.round(width / 9)}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=3`].filter(Boolean).join(",");
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.max(0, (f - 0.5) / fps)), "-i", clip, "-frames:v", "1", "-vf", vf, file]);
    if (r.status !== 0) throw new Error(`ffmpeg failed at frame ${f}: ${r.stderr}`);
  };
  const strips = cuts.map((t) => ({ f: Math.round(t * fps), frames: K.map((k) => Math.round(t * fps) + k) }));
  if (loop) strips.push({ f: 0, seam: true, frames: K.map((k) => (k < 0 ? n + k : k)) });
  strips.forEach((s, r) => {
    const files = s.frames.filter((f) => f >= 0 && f < n).map((f, i) => {
      const file = path.join(tmp, `${r}-${i}.png`), k = K[s.frames.indexOf(f)];
      grab(f, file, k === 0, `${(f / fps).toFixed(2)}s${s.seam && k === 0 ? " loop" : ""}`);
      return file;
    });
    const row = path.join(tmp, `row-${r}.png`), x = spawnSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${files.length},pad=${width * K.length}:ih:0:0:black`, row]);
    if (x.status !== 0) throw new Error(`ffmpeg hstack failed: ${x.stderr}`);
    rows.push(row);
  });
  if (!rows.length) { fs.rmSync(tmp, { recursive: true, force: true }); return null; }
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...rows.flatMap((f) => ["-i", f]), "-filter_complex", rows.length > 1 ? `${rows.map((_, i) => `[${i}:v]`).join("")}vstack=inputs=${rows.length}` : "null", out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`ffmpeg vstack failed: ${r.stderr}`);
  return out;
}

// one frame a second at 360 px wide, 6 to a row, labelled with its second
export function phoneSheet(clip, { out, cols = 6, width = 360 } = {}) {
  const secs = Math.ceil(Number(probe(clip, "format=duration"))), rows = Math.ceil(secs / cols);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `fps=1,scale=${width}:-2,drawtext=fontfile=${FONT}:text='%{eif\\:t\\:d}s':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,tile=${cols}x${rows}:padding=4`, "-frames:v", "1", out]);
  if (r.status !== 0) throw new Error(`ffmpeg phone sheet failed: ${r.stderr}`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = { cols: 4, width: 270 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--times") o.times = a[++i].split(",").map(Number);
    else if (a[i] === "--cols") o.cols = Number(a[++i]);
    else if (a[i] === "--width") o.width = Number(a[++i]);
    else if (a[i] === "--out") o.out = a[++i];
    else if (a[i] === "--cuts") o.cuts = true;
    else if (a[i] === "--phone") o.phone = true;
    else (o.inputs ||= []).push(a[i]);
  }
  o.clip = o.inputs && (o.inputs.every((f) => f.endsWith(".png")) ? o.inputs : o.inputs[0]);
  if (!o.clip) { console.error("usage: node qa/contact.mjs <clip.mp4> [--sb storyboard.json | --times t,t] [--cols 4] [--width 270] [--out sheet.png]"); process.exit(2); }
  if (o.cuts || o.phone) {
    const sb = o.sb ? loadStoryboard(o.sb) : null, base = o.clip.replace(/\.mp4$/, "");
    if (o.cuts) {
      const cuts = cutTimes(o.clip, sb, sb?.fps ?? 30), f = cutStrips(o.clip, cuts, { out: o.out && !o.phone ? o.out : `${base}.cuts.png`, loop: !!sb?.loop, fps: sb?.fps ?? 30, dur: sb?.duration });
      console.log(f ? `wrote ${f} (${cuts.length} cut${cuts.length === 1 ? "" : "s"}${sb?.loop ? " + the loop seam" : ""}${cuts.length ? " at " + cuts.map((t) => t.toFixed(2)).join(", ") + " s" : ""}${sb ? "" : ", found in the pixels"})` : "no cuts");
    }
    if (o.phone) console.log(`wrote ${phoneSheet(o.clip, { out: o.out && !o.cuts ? o.out : `${base}.phone.png` })} (one frame a second at 360 px)`);
    process.exit(0);
  }
  let times = o.times;
  if (Array.isArray(o.clip)) times = [];
  else if (!times) {
    if (o.sb) { const sb = loadStoryboard(o.sb); times = beatTimes(sb).map((t) => renderTime(sb.holds, t)); }   // on the video's clock (hit-stops)
    else {
      const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o.clip], { encoding: "utf8" }).stdout);
      times = Array.from({ length: 8 }, (_, i) => Math.round(((i + 0.5) / 8) * d * 100) / 100);
    }
  }
  const out = o.out || (Array.isArray(o.clip) ? o.clip[0].replace(/-t[\d.]+\.png$/, "") + ".stills.contact.png" : o.clip.replace(/\.mp4$/, "") + ".contact.png");
  contactSheet(o.clip, times, { cols: o.cols, width: o.width, out });
  console.log(`wrote ${out} (${Array.isArray(o.clip) ? o.clip.length + " stills" : times.length + " frames at " + times.join(", ") + " s"})`);
}
