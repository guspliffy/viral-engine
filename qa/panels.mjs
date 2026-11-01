#!/usr/bin/env node
// Jonny's storyboard panels next to our frames at the same moments, one row per panel: the check that his panels'
// staging, camera side, light and detail made it into the clip (Not Yet, 1 Nov 2026: the panels were read for the
// beats only, and the ending looked the wrong way). Look at this sheet before every full render of a clip that came
// with panels, and give it to the creative review with "the panels are the target".
//
//   node qa/panels.mjs out/not-yet-draft.mp4 --panels board.png --grid 2x4 --at 0.5,1.5,2.4,3.3,4.7,6,7,8.3
//   node qa/panels.mjs out/x-draft-t0.50.png out/x-draft-t1.50.png ... --panels board.png --grid 2x4
//        -> out/<clip>.panels.png (or --out sheet.png)
//
// --grid CxR: the board's columns x rows, read left to right, row by row (panel 1 top left). --pick 1,2,4: only these
// panels (with --at giving one time per picked panel). --height: each picture's height in the sheet (default 360).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const inputs = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const board = opt("panels");
if (!inputs.length || !board) { console.error("usage: node qa/panels.mjs <clip.mp4 | stills...> --panels <board.png> --grid 2x4 [--at t,t,...] [--pick 1,2] [--out x.png]"); process.exit(2); }
const [cols, rows] = (opt("grid", "2x4")).split("x").map(Number);
const all = Array.from({ length: cols * rows }, (_, i) => i + 1);
const pick = opt("pick") ? opt("pick").split(",").map(Number) : all;
const H = Number(opt("height", 360));
const run = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: "utf8" }); if (r.status) { console.error(r.stderr.slice(-1500)); process.exit(1); } return r.stdout; };

// the board's size, so each panel's cell can be cut out
const [bw, bh] = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", board]).trim().split(",").map(Number);
const cw = Math.floor(bw / cols), ch = Math.floor(bh / rows);

// our frames: from a video at --at times, or the stills given in panel order
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "panels-"));
let frames, times;
if (inputs.length === 1 && /\.(mp4|mov|mkv|webm)$/i.test(inputs[0])) {
  times = (opt("at") || "").split(",").filter(Boolean).map(Number);
  if (times.length !== pick.length) { console.error(`--at needs one time per panel (${pick.length})`); process.exit(2); }
  frames = times.map((t, i) => { const f = path.join(tmp, `f${i}.png`); run("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", inputs[0], "-frames:v", "1", f]); return f; });
} else {
  frames = inputs; times = inputs.map((f) => { const m = /t(\d+(?:\.\d+)?)\.png$/.exec(f); return m ? Number(m[1]) : null; });
  if (frames.length !== pick.length) { console.error(`give one still per panel (${pick.length})`); process.exit(2); }
}

// one row per panel: | panel N | our frame at t |
const ins = ["-i", board, ...frames.flatMap((f) => ["-i", f])];
const label = (s) => `drawtext=fontfile=${FONT}:text='${s}':x=10:y=10:fontsize=${Math.round(H / 16)}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6`;
const parts = [], rowsOut = [];
pick.forEach((n, i) => {
  const c = (n - 1) % cols, r = Math.floor((n - 1) / cols);
  parts.push(`[0:v]crop=${cw}:${ch}:${c * cw}:${r * ch},scale=-2:${H}[p${i}]`);
  parts.push(`[${i + 1}:v]scale=-2:${H},${label(times[i] == null ? "ours" : `ours ${times[i].toFixed(2)} s`)}[o${i}]`);
  parts.push(`[p${i}][o${i}]hstack=inputs=2[r${i}]`); rowsOut.push(`[r${i}]`);
});
// rows can differ in width when a frame isn't 9:16: pad every row to the widest
const widest = Math.ceil(cw * H / ch) + Math.ceil(H * 9 / 16) + 2;
const padded = rowsOut.map((r, i) => { parts.push(`${r}pad=${widest}:${H}:0:0:color=black[q${i}]`); return `[q${i}]`; });
parts.push(`${padded.join("")}vstack=inputs=${padded.length}[out]`);
const out = opt("out") || path.join(ROOT, "out", `${path.basename(inputs[0]).replace(/(-draft)?(-t[\d.]+)?\.(png|mp4|mov|mkv|webm)$/i, "")}.panels.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });
run("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", parts.join(";"), "-map", "[out]", "-frames:v", "1", out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${out} (${pick.length} panels next to our frames)`);
