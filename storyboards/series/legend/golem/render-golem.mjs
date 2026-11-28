// Renderer for golem.mjs (a copy of tools/svg2d/render.mjs with: no end fade, crf, a frame window, a forced keyframe).
//   TITLE=stone node storyboards/series/legend/golem/render-golem.mjs --out a.mp4 [--crf 26]
//   --stills t1,t2 --dir d     PNG stills
//   --vonly v.mp4 [--frames 0:96]   video only (no audio), optionally only that frame window; keyframe forced at frame --key (default 96)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const args = process.argv.slice(2), opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const S = await import(pathToFileURL(resolve("storyboards/series/legend/golem/golem.mjs")).href);
const { W, H, FPS, DUR } = S;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const frame = async (t) => { await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, S.draw(t)); return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } }); };
if (opt("--stills")) {
  const dir = opt("--dir", "."); mkdirSync(dir, { recursive: true });
  for (const t of opt("--stills").split(",").map(Number)) { const p = `${dir}/f-${t.toFixed(2)}.png`; writeFileSync(p, await frame(t)); console.log("wrote", p); }
} else {
  const crf = opt("--crf", "26"), vonly = opt("--vonly"), out = vonly || opt("--out"), key = +opt("--key", "96");
  const [f0, f1] = (opt("--frames") || `0:${Math.round(DUR * FPS)}`).split(":").map(Number);
  let mix = null; if (!vonly) mix = S.prepare();
  const a = ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (mix) a.push("-i", mix, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k", "-t", String(DUR));
  a.push("-c:v", "libx264", "-preset", "medium", "-crf", crf, "-pix_fmt", "yuv420p", "-g", "9999", "-keyint_min", "9999", "-sc_threshold", "0", "-force_key_frames", `${(key / FPS).toFixed(4)}`, out);
  const ff = spawn("ffmpeg", a, { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) { const buf = await frame(f / FPS); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
  console.log(`wrote ${out} (${f1 - f0} frames, ${((Date.now() - t0) / 1000).toFixed(1)} s, DUR ${DUR})`);
}
await browser.close();
