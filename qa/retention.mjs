#!/usr/bin/env node
// Retention overlay: a posted clip with its audience curve underneath, so we see what was on screen at the second
// people left (qa/HOOK.md, "Retention loop"). The curve is copied by hand (or read off a screenshot) from the
// platform's analytics into a small CSV: one row per second, the share of viewers still watching.
//
//   node qa/retention.mjs <clip.mp4> <curve.csv> [--title "Still Scrolling · TikTok · 3 d"] [--out dir]
//     -> <dir>/<name>-retention.mp4   the clip (top) + the curve with a moving playhead (bottom), 1080x1920
//        <dir>/<name>-drops.png       the frames at the three steepest drops, labelled with time and loss
//        a printed summary: share left at 1, 2 and 3 s, the steepest drops, and where the curve flattens
//
// curve.csv:   t,pct          (t in seconds, pct = % of viewers still watching; TikTok's graph starts at 100)
//              0,100
//              1,71 ...
// Empty or missing seconds are interpolated; nothing is extrapolated past the last point.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { readCSV } from "./results.mjs";
import { contactSheet } from "./contact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");

export function readCurve(file) {
  const pts = readCSV(file).map((r) => [Number(r.t), Number(r.pct)]).filter(([t, p]) => Number.isFinite(t) && Number.isFinite(p)).sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) throw new Error(`${file}: need at least two rows of t,pct`);
  return pts;
}

export const at = (pts, t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, p0] = pts[i - 1], [t1, p1] = pts[i]; return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0); }
  return null;
};

// share left at 1-3 s, the steepest drops (per second, in percentage points), and where it flattens
export function readOut(pts) {
  const end = pts[pts.length - 1][0], drops = [];
  for (let t = 0; t + 1 <= end + 1e-9; t += 0.5) drops.push({ t, loss: at(pts, t) - at(pts, t + 1) });
  drops.sort((a, b) => b.loss - a.loss);
  const top = [];
  for (const d of drops) if (top.length < 3 && top.every((x) => Math.abs(x.t - d.t) >= 1)) top.push(d);
  let flat = null;
  for (let t = 1; t + 1 <= end + 1e-9; t += 0.5) if (at(pts, t) - at(pts, t + 1) < 2) { flat = t; break; }
  return { left: [1, 2, 3].map((t) => ({ t, pct: at(pts, t) })), drops: top, flat, end };
}

function graphSVG(pts, dur, { W = 1080, H = 640, title = "" } = {}) {
  const L = 110, R = 40, T = 90, B = 80, gw = W - L - R, gh = H - T - B;
  const x = (t) => L + (t / dur) * gw, y = (p) => T + (1 - p / 100) * gh;
  const line = pts.filter(([t]) => t <= dur).map(([t, p], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const lastT = Math.min(dur, pts[pts.length - 1][0]);
  const grid = [0, 25, 50, 75, 100].map((p) => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#ffffff22"/><text x="${L - 14}" y="${y(p) + 9}" text-anchor="end">${p}%</text>`).join("");
  const ticks = Array.from({ length: Math.floor(dur) + 1 }, (_, t) => `<text x="${x(t)}" y="${H - B + 44}" text-anchor="middle">${t}s</text>`).join("");
  const two = `<line x1="${x(2)}" x2="${x(2)}" y1="${T}" y2="${T + gh}" stroke="#f07a3e" stroke-dasharray="8 8" stroke-width="3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#11151c"/>
<style>text{font-family:Inter,Arial,sans-serif;font-size:28px;fill:#9aa4b4;font-weight:700}</style>
<text x="${L}" y="54" style="fill:#e8ebf0;font-size:34px">${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
${grid}${ticks}${two}
<path d="${line} L${x(lastT)},${y(0)} L${x(pts[0][0])},${y(0)} Z" fill="#f07a3e33"/>
<path d="${line}" fill="none" stroke="#f07a3e" stroke-width="6" stroke-linejoin="round"/></svg>`;
}

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || "").slice(-1500)}`);
  return r.stdout;
}
// the graph is drawn by the same headless Chromium the renderer uses (no image library to install)
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const bases = ["/opt/pw-browsers", path.join(home, ".cache/ms-playwright"), path.join(home, "Library/Caches/ms-playwright"), path.join(process.env.LOCALAPPDATA || "", "ms-playwright")];
  const exes = [["chrome-linux64", "chrome"], ["chrome-linux", "chrome"], ["chrome-win64", "chrome.exe"], ["chrome-win", "chrome.exe"], ["chrome-mac", "Chromium.app/Contents/MacOS/Chromium"], ["chrome-mac-arm64", "Chromium.app/Contents/MacOS/Chromium"]];
  for (const base of bases.filter((b) => b && fs.existsSync(b)))
    for (const d of fs.readdirSync(base).filter((x) => x.startsWith("chromium-")).sort().reverse())
      for (const [dir, exe] of exes) { const f = path.join(base, d, dir, exe); if (fs.existsSync(f)) return f; }
  return undefined;
}
async function svgToPng(svg, w, h, file) {
  const browser = await chromium.launch({ executablePath: findChrome() });
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<body style="margin:0">${svg}</body>`);
    await page.screenshot({ path: file });
  } finally { await browser.close(); }
}
const duration = (clip) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip]).trim());

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = { files: [] };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--title") o.title = a[++i];
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else o.files.push(a[i]);
  }
  const [clip, csv] = o.files;
  if (!clip || !csv) { console.error('usage: node qa/retention.mjs <clip.mp4> <curve.csv> [--title "..."] [--out dir]'); process.exit(2); }
  const pts = readCurve(csv), dur = duration(clip), name = path.basename(csv, ".csv");
  const out = o.out || path.dirname(path.resolve(csv));
  fs.mkdirSync(out, { recursive: true });
  const r = readOut(pts);

  console.log(`${name}: ${dur.toFixed(1)} s clip, curve to ${r.end} s`);
  console.log(`  still watching: ${r.left.map((x) => `${x.t} s ${x.pct == null ? "?" : x.pct.toFixed(0) + "%"}`).join(" · ")}`);
  console.log(`  steepest drops: ${r.drops.map((d) => `${d.t.toFixed(1)}-${(d.t + 1).toFixed(1)} s −${d.loss.toFixed(0)} pts`).join(" · ")}`);
  console.log(`  flattens (under 2 pts a second) from: ${r.flat == null ? "never" : r.flat + " s"}`);

  // graph panel (SVG -> PNG), then: clip on top, graph below, an orange playhead sweeping the graph in step with the clip
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "retention-")), png = path.join(tmp, "g.png");
  const GH = 640, L = 110, R = 40, T = 90, B = 80, gw = 1080 - L - R;
  await svgToPng(graphSVG(pts, dur, { H: GH, title: o.title || name }), 1080, GH, png);
  const video = path.join(out, `${name}-retention.mp4`);
  const fc = [
    `[0:v]scale=-2:1280,pad=1080:1280:(ow-iw)/2:0:color=0x11151c[top]`,
    `[1:v]scale=1080:${GH}[g]`,
    `color=c=0xffffff:s=4x${GH - T - B}:r=30[ph]`,
    `[g][ph]overlay=x='${L}+${gw}*min(t/${dur.toFixed(3)},1)-2':y=${T}:shortest=0[gp]`,
    `[top][gp]vstack=inputs=2[v]`,
  ].join(";");
  run("ffmpeg", ["-v", "error", "-y", "-i", clip, "-loop", "1", "-framerate", "30", "-i", png, "-filter_complex", fc, "-map", "[v]", "-map", "0:a?", "-t", dur.toFixed(3), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-shortest", video]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${path.relative(process.cwd(), video)}`);

  // the frames people left on: the start of each steep drop, plus 0.0 s for reference
  const times = [0, ...r.drops.map((d) => d.t + 0.5)].filter((t) => t < dur - 0.05).sort((x, y) => x - y);
  const sheet = contactSheet(clip, times, { cols: times.length, width: 270, out: path.join(out, `${name}-drops.png`) });
  console.log(`wrote ${path.relative(process.cwd(), sheet)}`);
}
