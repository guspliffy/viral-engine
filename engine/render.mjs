#!/usr/bin/env node
// Renders a storyboard to a vertical MP4 with sound.
//
//   node engine/render.mjs storyboards/test-01-golden.json            -> out/test-01-golden.mp4 + cover PNG + WAV
//   node engine/render.mjs <storyboard> --stills 0.5,3.2,7              -> PNG stills only (quick checks)
//   node engine/render.mjs <storyboard> --safe                          -> draws the TikTok safe zone on top
//   node engine/render.mjs <storyboard> --from 2 --to 4                 -> renders only part of the timeline
//   node engine/render.mjs <storyboard> --draft                         -> fast preview: half-res 3D, no anti-aliasing
//   node engine/render.mjs <storyboard> --style anime                   -> render in another style (default: the storyboard's)
//   node engine/render.mjs <storyboard> --audio-only                    -> redo only the sound on an existing render
//   node engine/render.mjs <storyboard> --silent                        -> no sound (a silent track)
//   node engine/render.mjs <storyboard> --png                           -> lossless frames into the encoder (slower)
//   node engine/render.mjs <storyboard> --layout                        -> only <id>.layout.json for qa/check.mjs (seconds)
//
// Each frame is drawn by a headless Chromium at a fixed time t = frame / fps, so renders are deterministic
// and independent of machine speed. Set CHROME_PATH to use a specific Chromium build.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { renderAudio, writeWav } from "./audio.mjs";
import { renderBeat } from "../puppet/beat.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".otf": "font/otf", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg" };
const LOUDNESS = { I: -14, TP: -2, LRA: 11 }; // integrated LUFS target typical for short-form platforms

function args() {
  const a = process.argv.slice(2), o = { file: null, out: path.join(ROOT, "out"), stills: null, safe: false, from: null, to: null, style: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--stills") o.stills = a[++i].split(",").map(Number);
    else if (a[i] === "--safe") o.safe = true;
    else if (a[i] === "--png") o.png = true;
    else if (a[i] === "--layout") o.layoutOnly = true;
    else if (a[i] === "--draft") o.draft = true;
    else if (a[i] === "--silent") o.silent = true;
    else if (a[i] === "--audio-only") o.audioOnly = true;
    else if (a[i] === "--style") o.style = a[++i];
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--from") o.from = Number(a[++i]);
    else if (a[i] === "--to") o.to = Number(a[++i]);
    else o.file = a[i];
  }
  if (!o.file) { console.error("usage: node engine/render.mjs <storyboard.json> [--stills t,t] [--draft] [--style s] [--audio-only] [--silent] [--safe] [--from s --to s] [--out dir]"); process.exit(2); }
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
  for (const c of sb.cast) chars[c.character] = JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${c.character}.json`), "utf8"));
  return chars;
}

function ffmpeg(argv) {
  return new Promise((ok, bad) => {
    const p = spawn("ffmpeg", argv, { stdio: ["ignore", "ignore", "pipe"] }); let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? ok(err) : bad(new Error(`ffmpeg exited ${c}\n${err.slice(-2000)}`))));
  });
}

// two-pass loudness normalisation: measure, then apply linearly (no pumping)
async function mux(video, wav, outFile, from, len) {
  const cut = from != null ? ["-ss", String(from), "-t", String(len)] : [];
  const m = await ffmpeg(["-hide_banner", ...cut, "-i", wav, "-af", `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
  const ln = `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  await ffmpeg(["-y", "-loglevel", "error", "-i", video, ...cut, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", ln, "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", outFile]);
  return { measuredLUFS: Number(j.input_i), measuredPeak: Number(j.input_tp) };
}

// entries marked { "only": "anime" } (or a list of styles) are used only when rendering in that style
function applyStyle(sb, style) {
  const keep = (x) => !x.only || x.only === style || (Array.isArray(x.only) && x.only.includes(style));
  const out = { ...sb };
  for (const k of ["actions", "fx", "captions", "sfx", "shots"]) out[k] = (sb[k] || []).filter(keep);
  return out;
}

async function main() {
  const o = args();
  const raw = JSON.parse(fs.readFileSync(o.file, "utf8"));
  const style = o.style || raw.style || "standard", sb = applyStyle(raw, style);
  const fps = sb.fps ?? 30, dur = sb.duration;
  const chars = loadCharacters(sb);
  fs.mkdirSync(o.out, { recursive: true });
  const range = o.from != null || o.to != null ? `-${o.from ?? 0}-${o.to ?? dur}` : "";
  const base = `${sb.id}${style !== "standard" ? "-" + style : ""}${range}${o.safe ? "-safe" : ""}${o.draft ? "-draft" : ""}`;
  const videoFile = path.join(o.out, `${base}.video.mp4`), outFile = path.join(o.out, `${base}.mp4`), wavFile = path.join(o.out, `${sb.id}${style !== "standard" ? "-" + style : ""}.wav`);

  // sound first: it is quick, and a broken storyboard fails before minutes of rendering
  let audio = null;
  if (!o.stills && !o.silent && !o.layoutOnly) {
    const ta = Date.now();
    audio = renderAudio(sb, chars);
    if (sb.music) {   // the placeholder beat (puppet/beat.mjs), mixed under the voices and effects
      const M = renderBeat(sb.music, dur), g = sb.music.gain ?? 0.5; let pk = 0;
      for (let i = 0; i < audio.L.length; i++) { audio.L[i] += M.L[i] * g; audio.R[i] += M.R[i] * g; pk = Math.max(pk, Math.abs(audio.L[i]), Math.abs(audio.R[i])); }
      if (pk > 0.89) for (let i = 0; i < audio.L.length; i++) { audio.L[i] *= 0.89 / pk; audio.R[i] *= 0.89 / pk; }
    }
    writeWav(wavFile, audio.L, audio.R, audio.sr);
    const counts = audio.events.reduce((m, e) => ((m[e.kind] = (m[e.kind] || 0) + 1), m), {});
    console.log(`sound: ${audio.events.length} events ${JSON.stringify(counts)} in ${((Date.now() - ta) / 1000).toFixed(1)}s -> ${wavFile}`);
  }
  if (o.audioOnly) {
    if (!fs.existsSync(videoFile)) throw new Error(`--audio-only needs an earlier render: ${videoFile} not found`);
    const l = await mux(videoFile, wavFile, outFile, o.from, (o.to ?? dur) - (o.from ?? 0));
    console.log(`wrote ${outFile} (sound only; mix measured ${l.measuredLUFS} LUFS, normalised to ${LOUDNESS.I})`);
    return;
  }

  const srv = await serve();
  const browser = await chromium.launch({ executablePath: findChrome(), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/engine/page/index.html`);
    await page.waitForFunction(() => window.ENGINE_READY === true, null, { timeout: 30000 }).catch(() => {});
    if (errors.length) throw new Error("page failed to load:\n" + errors.join("\n"));
    const t0 = Date.now();
    const info = await page.evaluate((d) => window.ENGINE.init(d), { sb, chars, opts: { safe: o.safe, draft: !!o.draft, aa: !o.draft, style } });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`stage ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(info));
    const timing = { draw: 0, grab: 0, n: 0 };
    const shot = async (t, fmt = "png") => {
      const a = Date.now();
      await page.evaluate((tt) => window.ENGINE.frame(tt), t);
      if (errors.length) throw new Error(errors.join("\n"));
      const b = Date.now();
      const url = await page.evaluate((f) => window.ENGINE.capture(f), fmt);
      timing.draw += b - a; timing.grab += Date.now() - b; timing.n++;
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    };

    // caption and character boxes every 0.1 s, for qa/check.mjs; no pixels drawn, so it takes seconds
    const writeLayout = async () => {
      const samples = [];
      for (let t = 0; t < dur - 1e-6; t += 0.1) samples.push(await page.evaluate((tt) => window.ENGINE.layout(tt), Math.round(t * 1000) / 1000));
      const f = path.join(o.out, `${sb.id}${style !== "standard" ? "-" + style : ""}.layout.json`);
      fs.writeFileSync(f, JSON.stringify({ fps, duration: dur, width: 1080, height: 1920, samples }));
      console.log("wrote", f);
    };
    if (o.layoutOnly) { await writeLayout(); return; }
    if (o.stills) {
      for (const t of o.stills) { const f = path.join(o.out, `${base}-t${t.toFixed(2)}.png`); fs.writeFileSync(f, await shot(t)); console.log("wrote", f); }
      return;
    }
    const a = Math.round((o.from ?? 0) * fps), b = Math.round((o.to ?? dur) * fps);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", o.png ? "png" : "mjpeg", "-framerate", String(fps), "-i", "-",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps), "-an", videoFile], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((ok, bad) => ff.on("close", (c) => (c === 0 ? ok() : bad(new Error("ffmpeg exited " + c)))));
    const tr = Date.now();
    for (let i = a; i < b; i++) {
      const img = await shot(i / fps, o.png ? "png" : "jpeg");
      if (!ff.stdin.write(img)) await new Promise((ok) => ff.stdin.once("drain", ok));
      if ((i - a) % 30 === 0) process.stdout.write(`frame ${i - a}/${b - a} (${((Date.now() - tr) / Math.max(1, i - a)).toFixed(0)} ms/frame)\n`);
    }
    ff.stdin.end(); await done;
    console.log(`video: ${b - a} frames in ${((Date.now() - tr) / 1000).toFixed(1)}s`);
    if (!range) await writeLayout();
    if (sb.cover != null && !range) { const f = path.join(o.out, `${base}-cover.png`); fs.writeFileSync(f, await shot(sb.cover)); console.log("wrote", f); }
  } finally {
    await browser.close(); srv.close();
  }
  if (audio) {
    const l = await mux(videoFile, wavFile, outFile, o.from, (o.to ?? dur) - (o.from ?? 0));
    console.log(`wrote ${outFile} (mix measured ${l.measuredLUFS} LUFS, normalised to ${LOUDNESS.I})`);
  } else {
    await ffmpeg(["-y", "-loglevel", "error", "-i", videoFile, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outFile]);
    console.log(`wrote ${outFile} (silent)`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
