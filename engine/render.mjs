#!/usr/bin/env node
// Renders a storyboard to a vertical MP4 with sound.
//
//   node engine/render.mjs storyboards/test-01-golden.json            -> out/test-01-golden.mp4 + cover PNG + WAV
//   node engine/render.mjs <storyboard> --stills 0.5,3.2,7              -> PNG stills only (quick checks)
//   node engine/render.mjs <storyboard> --stills beats --draft          -> one draft still per beat (for the pre-render review)
//   node engine/render.mjs <storyboard> --safe                          -> draws the TikTok safe zone on top
//   node engine/render.mjs <storyboard> --from 2 --to 4                 -> renders only part of the timeline
//   node engine/render.mjs <storyboard> --draft                         -> fast preview: half-res 3D, no anti-aliasing
//   node engine/render.mjs <storyboard> --style anime                   -> render in another style (default: the storyboard's)
//   node engine/render.mjs <storyboard> --audio-only                    -> redo only the sound on an existing render
//   node engine/render.mjs <storyboard> --silent                        -> no sound (a silent track)
//   node engine/render.mjs <storyboard> --png                           -> lossless frames into the encoder (slower)
//   node engine/render.mjs <storyboard> --layout                        -> only <id>.layout.json for qa/check.mjs, plus the contact results (seconds)
//   node engine/render.mjs <storyboard> --gl gpu                        -> draw on the graphics card instead of the CPU
//   node engine/render.mjs <storyboard> --force                         -> render even when the contact gate fails
//
// Contact gate: before drawing any frame, the layout pass (seconds) checks for characters overlapping, an arm through
// a held staff or a hat brim, and a staff in the body (qa/check.mjs clipResults, contactResults). A failure stops the
// render with the times to fix, so a 10-minute render never starts on a glitch the storyboard already contains.
//
// Each frame is drawn by a headless Chromium at a fixed time t = frame / fps, so renders are deterministic
// and independent of machine speed. Set CHROME_PATH to use a specific Chromium build.
// --gl soft (default) draws with SwiftShader on the CPU: slow, but the same pixels on every machine. --gl gpu uses
// the graphics card (often far faster; pixels can differ slightly between GPUs and drivers). The log line "stage
// ready" names the renderer actually used; extra Chrome flags for the GPU path can go in GL_ARGS.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { renderAudio, writeWav } from "./audio.mjs";
import { beatTimes } from "../qa/contact.mjs";
import { compile } from "./compile.mjs";
import { renderBeat, musicFlavour, seedOf } from "../puppet/beat.mjs";
import { clipResults, contactResults } from "../qa/check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".otf": "font/otf", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg" };
const LOUDNESS = { I: -14, TP: -2, LRA: 11 }; // integrated LUFS target typical for short-form platforms

function args() {
  const a = process.argv.slice(2), o = { file: null, out: path.join(ROOT, "out"), stills: null, safe: false, from: null, to: null, style: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--stills") { const v = a[++i]; o.stills = v === "beats" ? "beats" : v.split(",").map(Number); }
    else if (a[i] === "--safe") o.safe = true;
    else if (a[i] === "--png") o.png = true;
    else if (a[i] === "--layout") o.layoutOnly = true;
    else if (a[i] === "--draft") o.draft = true;
    else if (a[i] === "--silent") o.silent = true;
    else if (a[i] === "--audio-only") o.audioOnly = true;
    else if (a[i] === "--style") o.style = a[++i];
    else if (a[i] === "--look") o.look = a[++i];
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--from") o.from = Number(a[++i]);
    else if (a[i] === "--to") o.to = Number(a[++i]);
    else if (a[i] === "--gl") o.gl = a[++i];
    else if (a[i] === "--force") o.force = true;
    else o.file = a[i];
  }
  if (!o.file) { console.error("usage: node engine/render.mjs <storyboard.json> [--stills t,t] [--draft] [--style s] [--audio-only] [--silent] [--safe] [--from s --to s] [--gl soft|gpu] [--out dir]"); process.exit(2); }
  if (o.gl && !["soft", "gpu"].includes(o.gl)) { console.error(`--gl ${o.gl}: use soft (CPU, the default) or gpu`); process.exit(2); }
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

// a Playwright-installed Chromium on Linux, Windows or macOS (npx playwright install chromium), else Playwright's default
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const bases = ["/opt/pw-browsers", path.join(home, ".cache/ms-playwright"), path.join(home, "Library/Caches/ms-playwright"), path.join(process.env.LOCALAPPDATA || "", "ms-playwright")];
  const exes = [["chrome-linux64", "chrome"], ["chrome-linux", "chrome"], ["chrome-win64", "chrome.exe"], ["chrome-win", "chrome.exe"], ["chrome-mac", "Chromium.app/Contents/MacOS/Chromium"], ["chrome-mac-arm64", "Chromium.app/Contents/MacOS/Chromium"]];
  for (const base of bases) {
    if (!base || !fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter((x) => x.startsWith("chromium-")).sort().reverse())
      for (const [dir, exe] of exes) { const f = path.join(base, d, dir, exe); if (fs.existsSync(f)) return f; }
  }
  return undefined; // let playwright decide
}

// Chrome flags for drawing: SwiftShader on the CPU (the same pixels everywhere), or the machine's graphics card
function glArgs(mode) {
  if (mode !== "gpu") return ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"];
  const angle = process.platform === "win32" ? ["--use-angle=d3d11"] : process.platform === "darwin" ? ["--use-angle=metal"] : [];
  const extra = (process.env.GL_ARGS || "").split(/\s+/).filter(Boolean);
  return ["--enable-gpu", "--ignore-gpu-blocklist", ...angle, ...extra, "--enable-unsafe-swiftshader"]; // last: software fallback, reported below
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

// two-pass loudness normalisation: measure, then one fixed gain for the whole clip (no pumping) and a limiter for
// the rare peak the gain pushes too high. (loudnorm's own second pass falls back to its dynamic mode when the
// loudness range is wide, as with sparse sound effects and no music, and then lands up to 2 LU off target.)
async function mux(video, wav, outFile, from, len) {
  const cut = from != null ? ["-ss", String(from), "-t", String(len)] : [];
  const m = await ffmpeg(["-hide_banner", ...cut, "-i", wav, "-af", `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
  const gain = LOUDNESS.I - Number(j.input_i), limit = Math.pow(10, LOUDNESS.TP / 20);
  const af = `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(4)}:attack=2:release=60:level=0`;
  await ffmpeg(["-y", "-loglevel", "error", "-i", video, ...cut, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", af, "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", outFile]);
  return { measuredLUFS: Number(j.input_i), measuredPeak: Number(j.input_tp) };
}

// entries marked { "only": "anime" } (or a list of styles) are used only when rendering in that style
function applyStyle(sb, style) {
  const keep = (x) => !x.only || x.only === style || (Array.isArray(x.only) && x.only.includes(style));
  const out = { ...sb };
  for (const k of ["actions", "fx", "captions", "sfx", "shots"]) out[k] = (sb[k] || []).filter(keep);
  // manga devices (black-silhouette impact frames, speed lines) read as render errors outside the anime style:
  // there they become a short shake, unless a storyboard asks for them in this style by name
  const named = (f) => f.only === style || (Array.isArray(f.only) && f.only.includes(style));
  if (style !== "anime") {
    const flashes = out.fx.filter((f) => f.do === "flash").map((f) => f.at);
    out.fx = out.fx.flatMap((f) => {
      if (!(f.do === "impact" || f.do === "speedlines") || named(f)) return [f];
      if (f.do === "speedlines") return [];
      // the hit keeps its sound (audio.mjs voices impacts and flashes; a flash next to it already has one)
      if (!flashes.some((a) => Math.abs(a - f.at) < 0.25)) out.sfx.push({ sound: "impact", at: f.at, gain: 0.55 });
      return [{ do: "shake", at: f.at, dur: 0.25, amp: 0.04 }];
    });
    out.sfx.sort((a, b) => a.at - b.at);
  }
  return out;
}

async function main() {
  const o = args();
  const raw = compile(JSON.parse(fs.readFileSync(o.file, "utf8"))); // beat storyboards -> flat (engine/compile.mjs)
  if (o.stills === "beats") o.stills = beatTimes(raw); // one still per beat, the same times qa/contact.mjs uses
  // a look (engine/page/looks.js) sits on top of a style; anime-pro keeps the anime style's devices (impact frames)
  const look = o.look || raw.look || null;
  const style = o.style || raw.style || (look === "anime-pro" ? "anime" : "standard"), sb = applyStyle(raw, style);
  // pin the seeded tempo so dance moves on the page follow the same beat as the music
  if (sb.music !== false) sb.music = { ...(sb.music || {}), bpm: musicFlavour(sb.music || {}, seedOf(sb)).bpm };
  const fps = sb.fps ?? 30, dur = sb.duration;
  const chars = loadCharacters(sb);
  fs.mkdirSync(o.out, { recursive: true });
  const range = o.from != null || o.to != null ? `-${o.from ?? 0}-${o.to ?? dur}` : "";
  const tag = look ? `-${look}` : style !== "standard" ? "-" + style : "";
  const base = `${sb.id}${tag}${range}${o.safe ? "-safe" : ""}${o.draft ? "-draft" : ""}`;
  const videoFile = path.join(o.out, `${base}.video.mp4`), outFile = path.join(o.out, `${base}.mp4`), wavFile = path.join(o.out, `${sb.id}${style !== "standard" ? "-" + style : ""}.wav`);

  // sound first: it is quick, and a broken storyboard fails before minutes of rendering
  let audio = null;
  if (!o.stills && !o.silent && !o.layoutOnly) {
    const ta = Date.now();
    audio = renderAudio(sb, chars);
    // background music (puppet/beat.mjs): on by default, a different variation per clip (seeded by the id);
    // "music": false turns it off, a music block pins tempo, style, key and parts
    const music = sb.music === false ? null : { gain: 0.45, ...(sb.music || {}) };
    if (music) {
      const M = renderBeat(music, dur, seedOf(sb)), g = music.gain ?? 0.5; let pk = 0;
      console.log(`music: ${M.flavour.style}, ${M.flavour.bpm} bpm, key ${M.flavour.key >= 0 ? "+" : ""}${M.flavour.key}`);
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
  const browser = await chromium.launch({ executablePath: findChrome(), args: glArgs(o.gl) });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text()); });
    page.on("console", (m) => { if (m.type() === "log" && m.text().startsWith("diag:")) console.log(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/engine/page/index.html`);
    await page.waitForFunction(() => window.ENGINE_READY === true, null, { timeout: 30000 }).catch(() => {});
    if (errors.length) throw new Error("page failed to load:\n" + errors.join("\n"));
    const t0 = Date.now();
    const info = await page.evaluate((d) => window.ENGINE.init(d), { sb, chars, opts: { safe: o.safe, draft: !!o.draft, aa: !o.draft, style, look } });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`stage ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(info));
    const soft = /swiftshader|llvmpipe|software/i.test(info.renderer || "");
    if (o.gl === "gpu" && soft) console.log(`warning: --gl gpu asked for the graphics card, but Chrome is drawing in software (${info.renderer}); try GL_ARGS, e.g. "--use-angle=vulkan" or "--use-angle=gl"`);
    // per frame: posing (JS), drawing (the software GPU), encoding (JPEG in the page plus the copy to Node)
    const timing = { pose: 0, draw: 0, grab: 0, n: 0 };
    const shot = async (t, fmt = "png") => {
      const a = Date.now();
      await page.evaluate((tt) => window.ENGINE.frame(tt), t);
      if (errors.length) throw new Error(errors.join("\n"));
      const b = Date.now();
      await page.evaluate(() => window.ENGINE.sync());
      const c = Date.now();
      const url = await page.evaluate((f) => window.ENGINE.capture(f), fmt);
      timing.pose += b - a; timing.draw += c - b; timing.grab += Date.now() - c; timing.n++;
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    };

    // caption and character boxes every 0.1 s, for qa/check.mjs; no pixels drawn, so it takes seconds
    const writeLayout = async () => {
      const samples = [];
      for (let t = 0; t < dur - 1e-6; t += 0.1) samples.push(await page.evaluate((tt) => window.ENGINE.layout(tt), Math.round(t * 1000) / 1000));
      const f = path.join(o.out, `${sb.id}${tag}.layout.json`);
      // contact measures (grips, arms, hat brims) at every frame, so a one-frame pop shows
      const contacts = [];
      for (let i = 0; i < Math.round(dur * fps); i++) contacts.push(await page.evaluate((tt) => window.ENGINE.contact(tt), Math.round((i / fps) * 10000) / 10000));
      // extra samples at the storyboard's "aimAt" times (a generator script aims throws and cuts from them)
      const aims = [];
      for (const t of sb.aimAt || []) aims.push(await page.evaluate((tt) => window.ENGINE.layout(tt), t));
      const lay = { fps, duration: dur, width: 1080, height: 1920, samples, contacts, ...(aims.length ? { aims } : {}) };
      fs.writeFileSync(f, JSON.stringify(lay));
      console.log("wrote", f);
      return lay;
    };
    // the contact results (overlap, grips, brims) from the layout alone: printed by --layout, and a gate before a render
    const contactGate = (lay) => {
      const res = [...clipResults(sb, lay), ...contactResults(lay, sb)].filter((r) => r.level !== "pass" && ["character-overlap", "clipping", "grip", "limb-through-costume", "hand-pop", "face-covered", "staging"].includes(r.check));
      for (const r of res) console.log(`  ${r.level} ${r.check}: ${r.msg}`);
      if (!res.length) console.log("contacts: clean (no overlap, grips hold, arms clear of staffs and brims, hands off other characters and faces)");
      return res.filter((r) => r.level === "fail" && ["character-overlap", "grip", "limb-through-costume", "face-covered"].includes(r.check));
    };
    if (o.layoutOnly) { contactGate(await writeLayout()); return; }
    if (o.stills) {
      for (const t of o.stills) { const f = path.join(o.out, `${base}-t${t.toFixed(2)}.png`); fs.writeFileSync(f, await shot(t)); console.log("wrote", f); }
      return;
    }
    const lay = await writeLayout();
    const gate = contactGate(lay);
    if (gate.length) {
      console.log(`contact gate: ${gate.length} problem${gate.length > 1 ? "s" : ""} in the storyboard, fix before rendering${o.force ? " (--force: rendering anyway)" : " (or --force)"}`);
      if (!o.force) { process.exitCode = 1; return; }
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
    console.log(`video: ${b - a} frames in ${((Date.now() - tr) / 1000).toFixed(1)}s (per frame: ${(timing.pose / timing.n).toFixed(0)} ms posing, ${(timing.draw / timing.n).toFixed(0)} ms drawing, ${(timing.grab / timing.n).toFixed(0)} ms encoding)`);
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
