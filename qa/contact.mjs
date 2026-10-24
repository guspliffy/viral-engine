#!/usr/bin/env node
// Contact sheet of a clip for a quick human or model review: one still per beat, labelled with its time,
// in a grid of small frames (a few hundred KB, so a review costs a handful of image tokens, not a video).
//
//   node qa/contact.mjs out/test-01-golden-v2.mp4 --sb storyboards/test-01-golden-v2.json   -> out/test-01-golden-v2.contact.png
//   node qa/contact.mjs clip.mp4 --times 0.5,2,3.1 [--cols 4] [--width 270] [--out sheet.png]
//   node qa/contact.mjs out/x-safe-draft-t0.50.png out/x-safe-draft-t2.00.png ...           -> sheet of draft stills (pre-render review)
//
// Without --times the beats come from the storyboard: just after each shot starts, plus a frame mid-way through
// each shot longer than 1.5 s. Without a storyboard: 8 evenly spaced frames.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");

export function beatTimes(sb, max = 12) {
  const dur = sb.duration, shots = [...(sb.shots || [])].sort((a, b) => a.at - b.at), t = [];
  shots.forEach((s, i) => {
    const end = i + 1 < shots.length ? shots[i + 1].at : dur, len = end - s.at;
    t.push(s.at + Math.min(0.35, len / 3));
    if (len > 1.5) t.push(s.at + len * 0.7);
  });
  if (!t.length) for (let i = 0; i < 8; i++) t.push(((i + 0.5) / 8) * dur);
  const out = [...new Set(t.map((x) => Math.min(dur - 0.05, Math.round(x * 100) / 100)))].sort((a, b) => a - b);
  while (out.length > max) out.splice(1 + Math.floor((out.length - 2) / 2), 1); // thin from the middle, keep first and last
  return out;
}

// clip: an MP4 (frames taken at `times`), or a list of PNG stills from `render.mjs --stills` (times read from their names)
export function contactSheet(clip, times, { cols = 4, width = 270, out } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "contact-")), files = [];
  const stills = Array.isArray(clip) ? clip : null;
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), o = { cols: 4, width: 270 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--times") o.times = a[++i].split(",").map(Number);
    else if (a[i] === "--cols") o.cols = Number(a[++i]);
    else if (a[i] === "--width") o.width = Number(a[++i]);
    else if (a[i] === "--out") o.out = a[++i];
    else (o.inputs ||= []).push(a[i]);
  }
  o.clip = o.inputs && (o.inputs.every((f) => f.endsWith(".png")) ? o.inputs : o.inputs[0]);
  if (!o.clip) { console.error("usage: node qa/contact.mjs <clip.mp4> [--sb storyboard.json | --times t,t] [--cols 4] [--width 270] [--out sheet.png]"); process.exit(2); }
  let times = o.times;
  if (Array.isArray(o.clip)) times = [];
  else if (!times) {
    if (o.sb) times = beatTimes(JSON.parse(fs.readFileSync(o.sb, "utf8")));
    else {
      const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o.clip], { encoding: "utf8" }).stdout);
      times = Array.from({ length: 8 }, (_, i) => Math.round(((i + 0.5) / 8) * d * 100) / 100);
    }
  }
  const out = o.out || (Array.isArray(o.clip) ? o.clip[0].replace(/-t[\d.]+\.png$/, "") + ".stills.contact.png" : o.clip.replace(/\.mp4$/, "") + ".contact.png");
  contactSheet(o.clip, times, { cols: o.cols, width: o.width, out });
  console.log(`wrote ${out} (${Array.isArray(o.clip) ? o.clip.length + " stills" : times.length + " frames at " + times.join(", ") + " s"})`);
}
