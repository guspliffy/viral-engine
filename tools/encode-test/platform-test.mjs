#!/usr/bin/env node
// Which encode survives the platform best? (quality plan item 14, 5 Nov 2026)
//
// TikTok and Instagram re-encode every upload; fine hatching and line boil are what a low-bitrate re-encode smears
// first. This takes the lossless frames of a stretch of a clip (render.mjs --frames-dir), encodes them each way we
// might deliver, puts every delivery through a rough copy of a platform's re-encode, and scores what comes out
// against the lossless frames with SSIM (ffmpeg's ssim filter, luma) on face crops and on the whole frame.
//
//   node engine/render.mjs <sb> --from 7.5 --to 10 --silent --frames-dir out/enc/ref/frames --out out/enc/ref
//   node engine/render.mjs <sb> --from 7.5 --to 10 --silent --out out/enc/std          (the delivery as it is today)
//   node tools/encode-test/platform-test.mjs --frames out/enc/ref/frames --start 225 --std out/enc/std/x.video.mp4 \
//        --crop face=500:500:250:640 --out out/enc/report
//
// Deliveries: "std" (the file render.mjs makes today: JPEG q 0.95 frames, x264 veryfast CRF 18, given with --std),
// "hq-crf14/15/16" (lossless frames, x264 slow, CRF 14-16, tune animation: render.mjs --encode hq uses 15).
// Platforms (rough, not their real encoders, which aren't public and change): "tiktok" x264 medium CRF 23 capped at
// 2.5 Mb/s, "reels" x264 medium CRF 23 capped at 3.5 Mb/s, both 1080x1920 yuv420p. What counts is the ranking of the
// deliveries after the same re-encode, not the absolute numbers. Writes report.json, report.md and a 200 % crop sheet
// per crop (lossless | std after TikTok | hq after TikTok).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const frames = path.resolve(arg("--frames")), start = Number(arg("--start", 0)), std = arg("--std") && path.resolve(arg("--std")), out = path.resolve(arg("--out", "out/enc/report"));
const crops = a.flatMap((x, i) => (x === "--crop" ? [a[i + 1]] : [])).map((c) => { const [name, box] = c.split("="); const [w, h, x, y] = box.split(":").map(Number); return { name, w, h, x, y }; });
const fps = 30, sheetAt = Number(arg("--sheet-frame", 30));
if (!fs.existsSync(frames)) { console.error("usage: platform-test.mjs --frames <dir of fNNNN.png> --start <first frame number> [--std file.mp4] --crop name=w:h:x:y ... [--out dir]"); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const COLOR = "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p";   // as render.mjs COLOR
const ff = (args) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-y", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(r.stderr); return r.stderr; };
const input = ["-framerate", String(fps), "-start_number", String(start), "-i", path.join(frames, "f%04d.png")];
const size = (f) => fs.statSync(f).size;
const kbps = (f, n) => Math.round((size(f) * 8) / (n / fps) / 1000);
const n = fs.readdirSync(frames).filter((f) => /^f\d+\.png$/.test(f)).length;

// 1. the deliveries
const deliveries = {};
if (std) deliveries.std = std;
for (const crf of [14, 15, 16]) {
  const f = path.join(out, `hq-crf${crf}.mp4`), t = Date.now();
  ff([...input, "-vf", COLOR, "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-tune", "animation", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps), f]);
  deliveries[`hq-crf${crf}`] = f; console.log(`hq-crf${crf}: ${kbps(f, n)} kb/s, encoded in ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
// 2. the platforms' re-encode
const PLATFORMS = { tiktok: ["-preset", "medium", "-crf", "23", "-maxrate", "2500k", "-bufsize", "5000k"], reels: ["-preset", "medium", "-crf", "23", "-maxrate", "3500k", "-bufsize", "7000k"] };
const sims = {};
for (const [d, f] of Object.entries(deliveries)) for (const [p, opt] of Object.entries(PLATFORMS)) {
  const g = path.join(out, `${d}.${p}.mp4`);
  ff(["-i", f, "-c:v", "libx264", ...opt, "-pix_fmt", "yuv420p", "-an", g]);
  sims[`${d}|${p}`] = g;
}
// 3. SSIM against the lossless frames (taken through the same colour conversion), whole frame and each crop
const ssim = (file, crop) => {
  const c = crop ? `,crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}` : "";
  const e = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, ...input, "-lavfi", `[0:v]format=yuv420p${c}[a];[1:v]${COLOR}${c}[b];[a][b]ssim`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 }).stderr;
  const m = e.match(/SSIM Y:([\d.]+).*All:([\d.]+)/); return m ? { y: Number(m[1]), all: Number(m[2]) } : null;
};
const rows = [];
for (const [k, f] of Object.entries({ ...Object.fromEntries(Object.entries(deliveries).map(([d, f]) => [`${d}|delivered`, f])), ...sims })) {
  const [d, p] = k.split("|"), r = { delivery: d, after: p, kbps: kbps(f, n), frame: ssim(f) };
  for (const c of crops) r[c.name] = ssim(f, c);
  rows.push(r); console.log(`${d} ${p}: ${r.kbps} kb/s, SSIM frame ${r.frame.y.toFixed(4)}${crops.map((c) => `, ${c.name} ${r[c.name].y.toFixed(4)}`).join("")}`);
}
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ frames, start, n, crops, rows }, null, 1));
const md = [`| delivery | after | kb/s | SSIM frame (Y) | ${crops.map((c) => `SSIM ${c.name} (Y)`).join(" | ")} |`, `|---|---|---|---|${crops.map(() => "---").join("|")}|`,
  ...rows.map((r) => `| ${r.delivery} | ${r.after} | ${r.kbps} | ${r.frame.y.toFixed(4)} | ${crops.map((c) => r[c.name].y.toFixed(4)).join(" | ")} |`)];
fs.writeFileSync(path.join(out, "report.md"), md.join("\n") + "\n");
// 4. a 200 % crop sheet per crop: lossless | std after TikTok | hq-crf15 after TikTok, one frame
const font = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../assets/fonts/Inter-ExtraBold.otf");
for (const c of crops) {
  const pick = [["lossless", null], ...(std ? [["std after tiktok", sims["std|tiktok"]]] : []), ["hq after tiktok", sims["hq-crf15|tiktok"]]];
  const ins = [], fl = [];
  pick.forEach(([label, f], i) => {
    if (f) ins.push("-i", f); else ins.push("-framerate", String(fps), "-start_number", String(start), "-i", path.join(frames, "f%04d.png"));
    const s = f ? rows.find((r) => r.after === "tiktok" && sims[`${r.delivery}|tiktok`] === f)?.[c.name]?.y : null;
    fl.push(`[${i}:v]${f ? "" : COLOR + ","}select=eq(n\\,${sheetAt}),crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${c.w * 2}:${c.h * 2}:flags=neighbor,drawbox=x=0:y=0:w=iw:h=64:color=black@0.7:t=fill,drawtext=fontfile=${font}:text='${label}${s ? `  SSIM ${s.toFixed(4)}` : ""}':x=16:y=14:fontsize=34:fontcolor=white[v${i}]`);
  });
  ff([...ins, "-filter_complex", `${fl.join(";")};${pick.map((_, i) => `[v${i}]`).join("")}hstack=inputs=${pick.length}`, "-frames:v", "1", path.join(out, `crop-${c.name}.png`)]);
}
console.log(`wrote ${out}/report.md and the crop sheets`);
