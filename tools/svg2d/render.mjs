// Code-only 2D renderer (legend channel test, 26 Nov 2026): a scene module draws each frame as an SVG string,
// headless Chromium rasterises it, ffmpeg encodes. Deterministic: the scene is a pure function of t.
//   node tools/svg2d/render.mjs <scene.mjs> <out.mp4> [--stills 0.5,2.5,4.8 --dir <dir>] [--from s --to s]
// A scene may export HEAD (html for the page head, e.g. an embedded font) and prepare(outPath) -> the sound mix path.
// Gate (27 Nov): a full render first runs framecheck on the scene's probe(t). A scene with no probe(t), or a FAIL,
// stops here before any frame is drawn; --force "<reason>" renders anyway and prints the reason. Stills skip the gate.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { checkScene, report } from "./framecheck.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [scenePath, outPath, ...rest] = process.argv.slice(2);
const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const S = await import(pathToFileURL(resolve(scenePath)).href);
const { W = 1080, H = 1920, FPS = 30, DUR, GAIN = 0.5 } = S;
let MUSIC = S.MUSIC; const FADE = S.FADE ?? 0.4;   // a scene may export FADE = 0 for a hard audio end

if (!opt("--stills")) {
  const force = rest.includes("--force") ? (opt("--force") || "").trim() : null;
  if (force === "" || force?.startsWith("--")) { console.log("render: --force needs a written reason, e.g. --force \"crowd walkers enter at the edge on purpose\""); process.exit(2); }
  let why = null;
  if (typeof S.probe !== "function") why = `${scenePath} exports no probe(t): framecheck cannot see faces or captions (export probe(t), see tools/svg2d/framecheck.mjs)`;
  else { const r = report(checkScene(S), scenePath); console.log(r.text); if (r.fail) why = "framecheck FAIL (list above)"; }
  if (why && force == null) { console.log(`render: STOP, ${why}. Fix it, or add --force "<reason>".`); process.exit(1); }
  if (why) console.log(`render: --force "${force}" over: ${why}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<html><head>${S.HEAD || ""}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const frame = async (t) => {
  await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, S.draw(t));
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
};

if (opt("--stills")) {
  const dir = opt("--dir") || "."; mkdirSync(dir, { recursive: true });
  for (const t of opt("--stills").split(",").map(Number)) {
    const p = `${dir}/${basename(outPath, ".mp4")}-${t.toFixed(2)}.png`;
    writeFileSync(p, await frame(t)); console.log("wrote", p);
  }
} else {
  if (S.prepare) MUSIC = await S.prepare(outPath);   // the scene builds its own sound mix
  const N = Math.round(DUR * FPS);
  const args = ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (MUSIC) args.push("-i", MUSIC, "-map", "0:v", "-map", "1:a", "-af", FADE > 0 ? `volume=${GAIN},afade=t=out:st=${DUR - FADE}:d=${FADE}` : `volume=${GAIN}`, "-c:a", "aac", "-b:a", "160k");
  args.push("-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-t", String(DUR), outPath);
  const ff = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    const buf = await frame(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`wrote ${outPath} (${N} frames, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
await browser.close();
