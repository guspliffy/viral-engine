#!/usr/bin/env node
// Renders a storyboard to a vertical MP4.
//
//   node engine/render.mjs storyboards/test-01-golden.json            -> out/test-01-golden.mp4 + cover PNG
//   node engine/render.mjs <storyboard> --stills 0.5,3.2,7              -> PNG stills only (quick checks)
//   node engine/render.mjs <storyboard> --safe                          -> draws the TikTok safe zone on top
//   node engine/render.mjs <storyboard> --from 2 --to 4                 -> renders only part of the timeline
//   node engine/render.mjs <storyboard> --png                           -> lossless frames into the encoder (slower)
//
// Each frame is drawn by a headless Chromium at a fixed time t = frame / fps, so renders are deterministic
// and independent of machine speed. Set CHROME_PATH to use a specific Chromium build.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".otf": "font/otf", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg" };

function args() {
  const a = process.argv.slice(2), o = { file: null, out: path.join(ROOT, "out"), stills: null, safe: false, from: null, to: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--stills") o.stills = a[++i].split(",").map(Number);
    else if (a[i] === "--safe") o.safe = true;
    else if (a[i] === "--png") o.png = true;
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--from") o.from = Number(a[++i]);
    else if (a[i] === "--to") o.to = Number(a[++i]);
    else o.file = a[i];
  }
  if (!o.file) { console.error("usage: node engine/render.mjs <storyboard.json> [--stills t,t] [--safe] [--from s --to s] [--out dir]"); process.exit(2); }
  return o;
}

function serve() {
  const srv = http.createServer((req, res) => {
    const p = path.normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^([/\\])+/, "");
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const base of ["/opt/pw-browsers", path.join(process.env.HOME || "", ".cache/ms-playwright")]) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter((x) => x.startsWith("chromium-")).sort().reverse()) {
      const exe = path.join(base, d, "chrome-linux64", "chrome");
      if (fs.existsSync(exe)) return exe;
    }
  }
  return undefined; // let playwright decide
}

function loadCharacters(sb) {
  const chars = {};
  for (const c of sb.cast) {
    const f = path.join(ROOT, "characters", `${c.character}.json`);
    chars[c.character] = JSON.parse(fs.readFileSync(f, "utf8"));
  }
  return chars;
}

async function main() {
  const o = args();
  const sb = JSON.parse(fs.readFileSync(o.file, "utf8"));
  const fps = sb.fps ?? 30, dur = sb.duration;
  const chars = loadCharacters(sb);
  fs.mkdirSync(o.out, { recursive: true });
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: findChrome(), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${port}/engine/page/index.html`);
  await page.waitForFunction(() => window.ENGINE_READY === true, null, { timeout: 30000 }).catch(() => {});
  if (errors.length) throw new Error("page failed to load:\n" + errors.join("\n"));
  const t0 = Date.now();
  const info = await page.evaluate((d) => window.ENGINE.init(d), { sb, chars, opts: { safe: o.safe } });
  console.log(`stage ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(info));
  const timing = { draw: 0, grab: 0, n: 0 };
  const shot = async (t, fmt = "png") => {
    const a = Date.now();
    await page.evaluate((tt) => window.ENGINE.frame(tt), t);
    if (errors.length) throw new Error(errors.join("\n"));
    const b = Date.now();
    const png = await page.screenshot(fmt === "png" ? { type: "png" } : { type: "jpeg", quality: 95 });
    timing.draw += b - a; timing.grab += Date.now() - b; timing.n++;
    return png;
  };

  if (o.stills) {
    for (const t of o.stills) { const f = path.join(o.out, `${sb.id}-t${t.toFixed(2)}${o.safe ? "-safe" : ""}.png`); fs.writeFileSync(f, await shot(t)); console.log("wrote", f); }
  } else {
    const a = Math.round((o.from ?? 0) * fps), b = Math.round((o.to ?? dur) * fps);
    const outFile = path.join(o.out, `${sb.id}${o.from != null || o.to != null ? `-${o.from ?? 0}-${o.to ?? dur}` : ""}${o.safe ? "-safe" : ""}.mp4`);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", o.png ? "png" : "mjpeg", "-framerate", String(fps), "-i", "-",
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-map", "0:v", "-map", "1:a", "-shortest",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps),
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((ok, bad) => ff.on("close", (c) => (c === 0 ? ok() : bad(new Error("ffmpeg exited " + c)))));
    const tr = Date.now();
    for (let i = a; i < b; i++) {
      const png = await shot(i / fps, o.png ? "png" : "jpeg");
      if (!ff.stdin.write(png)) await new Promise((ok) => ff.stdin.once("drain", ok));
      if ((i - a) % 30 === 0) process.stdout.write(`frame ${i - a}/${b - a} (${((Date.now() - tr) / Math.max(1, i - a)).toFixed(0)} ms/frame: draw ${(timing.draw / timing.n).toFixed(0)}, grab ${(timing.grab / timing.n).toFixed(0)})\n`);
    }
    ff.stdin.end(); await done;
    console.log(`wrote ${outFile} — ${b - a} frames in ${((Date.now() - tr) / 1000).toFixed(1)}s`);
    if (sb.cover != null && o.from == null && o.to == null) {
      const f = path.join(o.out, `${sb.id}-cover.png`); fs.writeFileSync(f, await shot(sb.cover)); console.log("wrote", f);
    }
  }
  await browser.close(); srv.close();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
