// One silent picture export WITH subtitles (draft 2: one export only):
//   node storyboards/series/legend/pandora/pandora-render.mjs <out-subs.mp4> [--from s --to s]
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
const require = createRequire(resolve("tools/svg2d/render.mjs"));
const { chromium } = require("playwright");
const S = await import("./pandora.mjs");
const [outA, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? +rest[i + 1] : d; };
const f0 = Math.round(opt("--from", 0) * S.FPS), f1 = Math.min(Math.round(S.DUR * S.FPS), Math.round(opt("--to", 1e9) * S.FPS));
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: S.W, height: S.H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const shot = async (svg) => { await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, svg); return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: S.W, height: S.H } }); };
const enc = (o) => spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(S.FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", o], { stdio: ["pipe", "inherit", "inherit"] });
const A = enc(outA), put = async (p, b) => { if (!p.stdin.write(b)) await new Promise((r) => p.stdin.once("drain", r)); };
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  const p = S.parts(f / S.FPS);
  await put(A, await shot(p.pic + p.cap + "</svg>"));
  if (f % 300 === 0) console.log("frame", f, "/", f1, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
A.stdin.end();
await Promise.all([A].map((p) => new Promise((r) => p.on("close", r))));
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
await browser.close();
