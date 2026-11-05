#!/usr/bin/env node
// Which drawn detail survives TikTok's re-encode? (quality plan item 18, wave 3 K, 5 Nov 2026)
//
// Thread D measured that a sharper upload changes nothing after TikTok's re-encode (face crops 0.902 against 0.903
// SSIM), so this tunes what we draw instead: the pencil hatching's spacing, boil and strength ("set": { "hatch" }),
// the drawn lines' width and the paper grain ("drawn"). For every variant of one storyboard it renders a stretch as
// lossless frames, encodes them the way render.mjs delivers today (x264 veryfast CRF 18, as tools/encode-test), puts
// that through the same rough TikTok re-encode as tools/encode-test/platform-test.mjs (x264 medium CRF 23 capped at
// 2.5 Mb/s), and scores it against its own lossless frames: SSIM on face crops and the whole frame (how much of what
// was drawn arrives), the bitrate the re-encode spent, and how much hatch-scale detail is left (the energy of a
// 3-12 px band-pass, after / before). Writes report.json, report.md and a 200 % crop sheet (lossless | after TikTok)
// per variant.
//
//   node tools/light/detail-test.mjs <sb.json> --from 5 --to 7 --crop face=420:420:330:1150 --out out/light/detail \
//        --variant base '{}' --variant grain0 '{"drawn":{"paper":{"grain":0}}}' --variant hatch14 '{"set":{"hatch":{"scale":1.4}}}'
// A variant is a JSON patch merged into the storyboard (objects deep-merged). Renders skip the gate (--skip-gate):
// an engine test, not a delivery.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const sbFile = path.resolve(a[0]), from = Number(arg("--from", 0)), to = Number(arg("--to", 2)), out = path.resolve(arg("--out", "out/light/detail"));
const crops = a.flatMap((x, i) => (x === "--crop" ? [a[i + 1]] : [])).map((c) => { const [name, box] = c.split("="); const [w, h, x, y] = box.split(":").map(Number); return { name, w, h, x, y }; });
const variants = a.flatMap((x, i) => (x === "--variant" ? [[a[i + 1], JSON.parse(a[i + 2])]] : []));
if (!fs.existsSync(sbFile) || !variants.length) { console.error("usage: detail-test.mjs <sb.json> --from s --to s --crop name=w:h:x:y --variant name '<json patch>' ..."); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const fps = 30, COLOR = "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p";
const ff = (args) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-y", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(r.stderr); return r.stderr; };
const merge = (x, p) => { if (p === null || typeof p !== "object" || Array.isArray(p)) return p; const o = { ...(x && typeof x === "object" ? x : {}) }; for (const [k, v] of Object.entries(p)) o[k] = merge(o[k], v); return o; };
const kbps = (f, n) => Math.round((fs.statSync(f).size * 8) / (n / fps) / 1000);

const rows = [];
for (const [name, patch] of variants) {
  const dir = path.join(out, name), frames = path.join(dir, "frames");
  fs.mkdirSync(dir, { recursive: true });
  const sb = merge(JSON.parse(fs.readFileSync(sbFile, "utf8")), patch);
  sb.id = `${sb.id || "detail"}-${name}`;
  // next to the original, so paths relative to it still resolve
  const tmp = path.join(path.dirname(sbFile), `.detail-${name}.json`);
  fs.writeFileSync(tmp, JSON.stringify(sb));
  let render = 0;
  if (!fs.existsSync(frames) || !fs.readdirSync(frames).length) {
    const t = Date.now();
    const r = spawnSync("node", [path.join(ROOT, "engine/render.mjs"), tmp, "--from", String(from), "--to", String(to), "--silent", "--skip-gate", "--no-cache", "--frames-dir", frames, "--out", dir], { encoding: "utf8", maxBuffer: 1 << 28 });
    if (r.status !== 0) { fs.rmSync(tmp); throw new Error(`${name}: render failed\n${r.stderr.slice(-2000)}`); }
    render = (Date.now() - t) / 1000;
    const m = r.stdout.match(/per drawn frame: (\d+) ms posing, (\d+) ms drawing/);
    if (m) fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify({ posing: +m[1], drawing: +m[2] }));
  }
  fs.rmSync(tmp, { force: true });
  const files = fs.readdirSync(frames).filter((f) => /^f\d+\.png$/.test(f)).sort();
  const start = Number(files[0].slice(1, -4)), n = files.length;
  const input = ["-framerate", String(fps), "-start_number", String(start), "-i", path.join(frames, "f%04d.png")];
  const std = path.join(dir, "std.mp4"), tt = path.join(dir, "std.tiktok.mp4");
  ff([...input, "-vf", COLOR, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", std]);
  ff(["-i", std, "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-maxrate", "2500k", "-bufsize", "5000k", "-pix_fmt", "yuv420p", "-an", tt]);
  const ssim = (file, c) => {
    const k = c ? `,crop=${c.w}:${c.h}:${c.x}:${c.y}` : "";
    const e = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, ...input, "-lavfi", `[0:v]format=yuv420p${k}[a];[1:v]${COLOR}${k}[b];[a][b]ssim`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 }).stderr;
    const m = e.match(/SSIM Y:([\d.]+)/); return m ? Number(m[1]) : null;
  };
  // hatch-scale detail: a 3-12 px band-pass (difference of two blurs) on a face crop, energy after / before
  const band = (file, c, isFrames) => {
    const k = `crop=${c.w}:${c.h}:${c.x}:${c.y},format=gray`;
    const src = isFrames ? input : ["-i", file];
    const e = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...src, "-lavfi", `[0:v]${k},split[a][b];[a]gblur=sigma=1[a1];[b]gblur=sigma=4[b1];[a1][b1]blend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 }).stderr;
    const v = [...e.matchAll(/YAVG=([\d.]+)/g)].map((x) => Number(x[1])); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
  };
  const row = { name, patch, frames: n, render_s: render || null, timing: fs.existsSync(path.join(dir, "timing.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "timing.json"))) : null,
    std_kbps: kbps(std, n), tiktok_kbps: kbps(tt, n), ssim_frame: ssim(tt), crops: {} };
  for (const c of crops) {
    const b0 = band(null, c, true), b1 = band(tt, c, false);
    row.crops[c.name] = { ssim: ssim(tt, c), detail_before: b0 && +b0.toFixed(3), detail_after: b1 && +b1.toFixed(3), kept: b0 ? +(b1 / b0).toFixed(3) : null };
    // 200 % crop sheet at the middle frame: lossless | after TikTok
    const mid = start + Math.floor(n / 2), png = path.join(dir, `${c.name}-sheet.png`), sel = `select=eq(n\\,${mid - start})`;
    ff([...input, "-i", tt, "-filter_complex", `[0:v]${sel},crop=${c.w}:${c.h}:${c.x}:${c.y},scale=iw*2:ih*2:flags=neighbor[a];[1:v]${sel},crop=${c.w}:${c.h}:${c.x}:${c.y},scale=iw*2:ih*2:flags=neighbor[b];[a][b]hstack`, "-frames:v", "1", png]);
  }
  rows.push(row);
  console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(rows, null, 1));
const md = ["| variant | TikTok kb/s | SSIM frame | " + crops.map((c) => `${c.name} SSIM | ${c.name} detail kept`).join(" | ") + " | draw ms/frame |", "|---|---|---|" + crops.map(() => "---|---|").join("") + "---|"];
for (const r of rows) md.push(`| ${r.name} | ${r.tiktok_kbps} | ${r.ssim_frame?.toFixed(4)} | ${crops.map((c) => `${r.crops[c.name].ssim?.toFixed(4)} | ${r.crops[c.name].kept}`).join(" | ")} | ${r.timing?.drawing ?? ""} |`);
fs.writeFileSync(path.join(out, "report.md"), md.join("\n") + "\n");
console.log(md.join("\n"));
