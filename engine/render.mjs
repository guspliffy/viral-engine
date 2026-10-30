#!/usr/bin/env node
// Renders a storyboard to a vertical MP4 with sound.
//
//   node engine/render.mjs storyboards/test-01-golden.json            -> out/test-01-golden.mp4 + cover PNG + WAV
//   node engine/render.mjs <storyboard> --stills 0.5,3.2,7              -> PNG stills only (quick checks)
//   node engine/render.mjs <storyboard> --stills beats --draft          -> one draft still per beat (for the pre-render review)
//   node engine/render.mjs <storyboard> --stills beats --ids            -> plus a map of which character covers each pixel (qa/readability.mjs)
//   node engine/render.mjs <storyboard> --safe                          -> draws the TikTok safe zone on top
//   node engine/render.mjs <storyboard> --from 2 --to 4                 -> renders only part of the timeline
//   node engine/render.mjs <storyboard> --draft                         -> fast preview: half-res 3D, no anti-aliasing
//   node engine/render.mjs <storyboard> --style anime                   -> render in another style (default: the storyboard's)
//   node engine/render.mjs <storyboard> --audio-only                    -> redo only the sound on an existing render
//   node engine/render.mjs <storyboard> --silent                        -> no sound (a silent track)
//   node engine/render.mjs <storyboard> --png                           -> lossless frames into the encoder (slower)
//   node engine/render.mjs <storyboard> --blur                          -> with motion blur (off by default)
//   node engine/render.mjs <storyboard> --layout                        -> only <id>.layout.json for qa/check.mjs, plus the contact results (seconds; exits 1 when the gate would stop a render)
//   node engine/render.mjs <storyboard> --gl gpu                        -> draw on the graphics card instead of the CPU
//   node engine/render.mjs <storyboard> --force                         -> render even when the contact gate fails
//   node engine/render.mjs <storyboard> --shard 3/12                    -> video only, the 3rd of 12 equal frame ranges
//   node engine/render.mjs <storyboard> --stitch 12                     -> joins the 12 shards, adds the sound
//
// Sharding: every frame is drawn at its own time t (no state carries from one frame to the next), so a clip can be
// cut into ranges, drawn on several machines at once (.github/workflows/render.yml: free GitHub runners) and joined
// without a seam. Give the shards and the stitch the same flags (--draft, --look, --from/--to, --out) so they agree on
// the file names. Shard 1 also draws the cover.
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
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { renderAudio, writeWav } from "./audio.mjs";
import { beatTimes } from "../qa/contact.mjs";
import { loadStoryboard, loadCharacters } from "./load.mjs";
import { lockMusic, addMusic } from "./music.mjs";
import { clipResults, contactResults } from "../qa/check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".otf": "font/otf", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg" };
const LOUDNESS = { I: -14, TP: -2, LRA: 11 }; // integrated LUFS target typical for short-form platforms
// Motion blur: a frame where something moves fast is the average of several samples spread over a film shutter (half
// the frame time, centred on the frame), so a swing or a snap reads as one smooth smear instead of a jump. The number
// of samples follows how far the fastest on-screen corner of any character or prop part moved over the last two frames
// (window.ENGINE.motion): one sample per `gap` px of smear, at most `max`, and a frame with less than `min` px of smear
// stays one sample, so calm stretches cost nothing. A very fast part (a blade in a close-up) gets a shorter shutter, so
// its smear is at most (max - 1) x gap px: wider than that, the samples would show as separate stripes. The estimate only sets the cost: the samples are real frames at
// their own times, so a part that has stopped just draws the same picture again. Samples never cross a cut, an impact
// frame or the start of a flash. It is off by default (Jonny, 30 Oct 2026: "motion blur is not needed, the difference
// is really small"; it was 62-73 % of a clip's render time). --blur or "motionBlur": true / { ... } in a storyboard
// turns it on.
const BLUR = { shutter: 0.5, gap: 5, min: 12, max: 13 };
// The picture is stored as BT.709 (the HD standard phones and the apps assume) and tagged so: left alone, ffmpeg
// stores a browser frame as BT.601, which a player reading it as HD shows more saturated (orange 242,107,29 -> 254,114,21).
const COLOR = ["-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];

function args() {
  const a = process.argv.slice(2), o = { file: null, out: path.join(ROOT, "out"), stills: null, safe: false, from: null, to: null, style: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--stills") { const v = a[++i]; o.stills = v === "beats" ? "beats" : v.split(",").map(Number); }
    else if (a[i] === "--safe") o.safe = true;
    else if (a[i] === "--png") o.png = true;
    else if (a[i] === "--no-blur") o.blur = false;
    else if (a[i] === "--blur") o.blur = true;
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
    else if (a[i] === "--skip-gate") o.skipGate = true;
    else if (a[i] === "--ids") o.ids = true;
    else if (a[i] === "--cost") o.cost = true;                       // with --layout: also <id>.cost.json (blur samples per frame)
    else if (a[i] === "--thin-trace") o.thinTrace = true;            // cost trace without glove skins (faster, approximate)
    else if (a[i] === "--balance") o.balance = true;                 // with --shard: ranges of equal expected cost from <id>.cost.json
    else if (a[i] === "--blur-set") o.blurSet = Object.fromEntries(a[++i].split(",").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)]));
    else if (a[i] === "--frames-dir") o.framesDir = path.resolve(a[++i]);   // every finished frame as a PNG too (agreement tests)
    else if (a[i] === "--timing-json") o.timingJson = path.resolve(a[++i]);
    else if (a[i] === "--cover") o.cover = path.resolve(a[++i]);    // dead-code study: run every code path a clip uses, write V8 coverage
    else if (a[i] === "--hashes") o.hashes = path.resolve(a[++i]);
    else if (a[i] === "--shard") { const m = /^(\d+)\/(\d+)$/.exec(a[++i] || ""); o.shard = m && { i: Number(m[1]), n: Number(m[2]) }; if (!o.shard || o.shard.i < 1 || o.shard.i > o.shard.n) { console.error("--shard i/n, e.g. --shard 3/12 (1 to n)"); process.exit(2); } }
    else if (a[i] === "--stitch") { o.stitch = Number(a[++i]); if (!(o.stitch >= 1)) { console.error("--stitch n: the number of shards to join"); process.exit(2); } }
    else o.file = a[i];
  }
  if (!o.file) { console.error("usage: node engine/render.mjs <storyboard.json> [--stills t,t] [--draft] [--style s] [--audio-only] [--silent] [--safe] [--from s --to s] [--gl llvmpipe|soft|gpu] [--blur] [--out dir]"); process.exit(2); }
  o.gl = o.gl || "llvmpipe";
  if (!["soft", "gpu", "llvmpipe"].includes(o.gl)) { console.error(`--gl ${o.gl}: use llvmpipe (CPU, the default), soft (SwiftShader) or gpu`); process.exit(2); }
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

// Chrome flags for drawing: Mesa llvmpipe or SwiftShader on the CPU, or the machine's graphics card
function glArgs(mode) {
  // llvmpipe (the default since 30 Oct 2026): Mesa's CPU rasteriser through ANGLE's desktop-GL backend, which needs an X
  // display (startXvfb) and LIBGL_ALWAYS_SOFTWARE=1 (https://microlink.io/blog/webgl-without-a-gpu). It draws about 3x
  // faster than SwiftShader (--gl soft) on the same CPU (render-measure-01), and Jonny saw no difference side by side
  if (mode === "llvmpipe") return ["--use-angle=gl", "--enable-gpu", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"];
  if (mode !== "gpu") return ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"];
  const angle = process.platform === "win32" ? ["--use-angle=d3d11"] : process.platform === "darwin" ? ["--use-angle=metal"] : [];
  const extra = (process.env.GL_ARGS || "").split(/\s+/).filter(Boolean);
  return ["--enable-gpu", "--ignore-gpu-blocklist", ...angle, ...extra, "--enable-unsafe-swiftshader"]; // last: software fallback, reported below
}

// a virtual X display for --gl llvmpipe; Xvfb prints the display number it picked on fd 3
function startXvfb() {
  return new Promise((ok, bad) => {
    const p = spawn("Xvfb", ["-displayfd", "3", "-screen", "0", "1280x2000x24", "-nolisten", "tcp"], { stdio: ["ignore", "ignore", "ignore", "pipe"] });
    p.on("error", (e) => bad(new Error(`--gl llvmpipe needs Xvfb (apt install xvfb): ${e.message}`)));
    p.stdio[3].once("data", (d) => ok({ proc: p, display: ":" + String(d).trim() }));
  });
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
  let gain = LOUDNESS.I - Number(j.input_i);
  // the limiter runs at 4x the sample rate so it also catches the peaks between samples (a sharp knock or slam
  // otherwise comes out of the AAC encoder above the true-peak limit). It starts 0.6 dB below the target, since AAC
  // rings over a bright transient (a blade "ting"); a very sharp click (a door latch) can still ring well over it
  // after encoding, so the encoded file is measured and, while it is over, encoded again with the limit lowered.
  // On a sparse mix (no music, a few loud effects over room tone) the limiter also takes loudness away: when the file
  // lands more than 0.5 LU under the target, the gain goes up by the shortfall (at most 6 dB in all) and it is redone
  let ceiling = LOUDNESS.TP - 0.6, tp = null, lufs = null;
  const gain0 = gain;
  for (let round = 0; round < 6; round++) {
    const af = `aresample=176400,volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, ceiling / 20).toFixed(4)}:attack=2:release=60:level=0,aresample=44100`;
    await ffmpeg(["-y", "-loglevel", "error", "-i", video, ...cut, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", af, "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", outFile]);
    const e = await ffmpeg(["-hide_banner", "-nostats", "-i", outFile, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]);
    const sum = e.slice(e.lastIndexOf("Summary:"));
    tp = Number((sum.match(/Peak:\s+(-?[\d.]+)/) || [])[1]);
    lufs = Number((sum.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1]);
    if (tp > LOUDNESS.TP + 0.5) { ceiling -= (tp - LOUDNESS.TP) / 2 + 0.2; continue; }   // half the excess at a time: the ringing does not shrink dB for dB
    if (lufs < LOUDNESS.I - 0.5 && gain < gain0 + 6) { gain = Math.min(gain0 + 6, gain + LOUDNESS.I - lufs); continue; }
    break;
  }
  return { measuredLUFS: Number(j.input_i), measuredPeak: Number(j.input_tp), truePeak: tp, lufs };
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
  const raw = loadStoryboard(o.file); // real speech (engine/voice/), then beat storyboards -> flat (engine/compile.mjs)
  if (o.stills === "beats") o.stills = beatTimes(raw); // one still per beat, the same times qa/contact.mjs uses
  // a look (engine/page/looks.js) sits on top of a style; anime-pro keeps the anime style's devices (impact frames)
  const look = o.look || raw.look || null;
  const style = o.style || raw.style || (look === "anime-pro" ? "anime" : "standard"), sb = applyStyle(raw, style);
  // the music's tempo and grid, locked to the story (engine/music.mjs) and pinned, so dance moves on the page follow
  // the same beat as the music
  sb.music = lockMusic(sb);
  const fps = sb.fps ?? 30, dur = sb.duration;
  const chars = loadCharacters(sb);
  fs.mkdirSync(o.out, { recursive: true });
  const range = o.from != null || o.to != null ? `-${o.from ?? 0}-${o.to ?? dur}` : "";
  const tag = look ? `-${look}` : style !== "standard" ? "-" + style : "";
  const base = `${sb.id}${tag}${range}${o.safe ? "-safe" : ""}${o.draft ? "-draft" : ""}`;
  const partFile = (i, n) => path.join(o.out, `${base}.part-${String(i).padStart(2, "0")}-of-${n}.video.mp4`);
  const videoFile = o.shard ? partFile(o.shard.i, o.shard.n) : path.join(o.out, `${base}.video.mp4`), outFile = path.join(o.out, `${base}.mp4`), wavFile = path.join(o.out, `${sb.id}${style !== "standard" ? "-" + style : ""}.wav`);

  // sound first: it is quick, and a broken storyboard fails before minutes of rendering
  let audio = null;
  if (!o.stills && !o.silent && !o.layoutOnly && !o.shard) {
    const ta = Date.now();
    audio = renderAudio(sb, chars);
    // background music (puppet/beat.mjs, or a recorded bed): on by default, a different variation per clip
    for (const line of addMusic(sb, audio)) console.log(line);
    writeWav(wavFile, audio.L, audio.R, audio.sr);
    const counts = audio.events.reduce((m, e) => ((m[e.kind] = (m[e.kind] || 0) + 1), m), {});
    console.log(`sound: ${audio.events.length} events ${JSON.stringify(counts)} in ${((Date.now() - ta) / 1000).toFixed(1)}s -> ${wavFile}`);
  }
  const frameA = Math.round((o.from ?? 0) * fps), frameB = Math.round((o.to ?? dur) * fps);
  // the stitch: the shards joined as they are (no re-encode; each starts on a keyframe), then the sound as usual
  if (o.stitch) {
    const parts = Array.from({ length: o.stitch }, (_, k) => partFile(k + 1, o.stitch)), missing = parts.filter((f) => !fs.existsSync(f));
    if (missing.length) throw new Error(`--stitch ${o.stitch}: missing shard${missing.length > 1 ? "s" : ""}:\n${missing.join("\n")}`);
    const list = path.join(o.out, `${base}.parts.txt`);
    fs.writeFileSync(list, parts.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    await ffmpeg(["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", videoFile]);
    const probe = spawnSync("ffprobe", ["-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", videoFile], { encoding: "utf8" });
    const got = Number(probe.stdout.trim());
    if (got !== frameB - frameA) throw new Error(`stitched ${got} frames, expected ${frameB - frameA}: a shard is short or rendered with other flags`);
    fs.rmSync(list);
    console.log(`stitched ${o.stitch} shards (${got} frames) -> ${videoFile}`);
  }
  if (o.audioOnly || o.stitch) {
    if (!fs.existsSync(videoFile)) throw new Error(`--audio-only needs an earlier render: ${videoFile} not found`);
    await finish(audio, videoFile, wavFile, outFile, o, dur, o.audioOnly ? "sound only; " : "");
    return;
  }

  const srv = await serve();
  const xvfb = o.gl === "llvmpipe" ? await startXvfb() : null;
  const browser = await chromium.launch({ executablePath: findChrome(), args: glArgs(o.gl), ...(xvfb ? { env: { ...process.env, DISPLAY: xvfb.display, LIBGL_ALWAYS_SOFTWARE: "1" } } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text()); });
    page.on("console", (m) => { if (m.type() === "log" && m.text().startsWith("diag:")) console.log(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    if (o.cover) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(`http://127.0.0.1:${srv.address().port}/engine/page/index.html${process.env.NOCACHE ? "?nocache" : ""}`);
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
    const shot = async (t, fmt = "png", after = null) => {
      const a = Date.now();
      await page.evaluate((tt) => window.ENGINE.frame(tt), t);
      if (errors.length) throw new Error(errors.join("\n"));
      const b = Date.now();
      await page.evaluate(() => window.ENGINE.sync());
      if (after) await after(t);
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
      const res = [...clipResults(sb, lay), ...contactResults(lay, sb)].filter((r) => r.level !== "pass" && ["character-overlap", "clipping", "grip", "limb-through-costume", "hand-pop", "hand-in-prop", "arm-in-prop", "costume-in-prop", "thin-prop-hidden", "face-covered", "face-hidden", "staging"].includes(r.check));
      for (const r of res) console.log(`  ${r.level} ${r.check}: ${r.msg}`);
      if (!res.length) console.log("contacts: clean (no overlap, grips hold, arms clear of staffs and brims, hands off other characters, faces and props)");
      return res.filter((r) => r.level === "fail" && ["character-overlap", "grip", "limb-through-costume", "hand-in-prop", "arm-in-prop", "costume-in-prop", "thin-prop-hidden", "face-covered", "face-hidden"].includes(r.check));
    };
    // the cost trace: each frame posed as the render would pose it and its motion measured, so the blur samples (the
    // bulk of a render's time) are known per frame before any shard starts
    const writeCost = async () => {
      const bl = blurPlan(sb, o, fps), tc = Date.now(), n = Math.round(dur * fps), frames = [];
      await page.evaluate((ts) => window.ENGINE.prime(ts), []);
      for (let i = 0; i < n; i++) {
        const v = await page.evaluate(([tt, thin]) => window.ENGINE.trace(tt, thin), [i / fps, !!o.thinTrace]);
        const s = bl && blurSamples(bl, i / fps, fps, v), box = await page.evaluate(() => window.ENGINE.movingBox?.());
        frames.push({ v, samples: s ? s.times.length : 0, box });
      }
      const f = path.join(o.out, `${sb.id}${tag}.cost.json`);
      fs.writeFileSync(f, JSON.stringify({ fps, frames, blur: bl && { ...bl, walls: undefined }, traceS: (Date.now() - tc) / 1000, thin: !!o.thinTrace }));
      console.log(`wrote ${f}: ${frames.filter((x) => x.samples).length} of ${n} frames blurred, ${frames.reduce((m, x) => m + x.samples, 0)} extra samples, traced in ${((Date.now() - tc) / 1000).toFixed(1)}s`);
    };
    if (o.cover) {
      // every frame posed (layout, as the checks pose), every 3rd frame posed with skins and its motion measured,
      // contacts every 0.2 s, a drawn frame per beat plus one blurred and one id map, then the coverage
      const n = Math.round(dur * fps), tc = Date.now();
      await page.evaluate(() => window.ENGINE.prime([]));
      const step = Number(process.env.COVER_STEP || 2), beats = beatTimes(raw).filter((_, k, all) => k % Math.max(1, Math.ceil(all.length / Number(process.env.COVER_DRAWN || 99))) === 0);
      for (let i = 0; i < n; i += step) { await page.evaluate((tt) => window.ENGINE.layout(tt), i / fps); if (i % (2 * step) === 0) await page.evaluate((tt) => window.ENGINE.trace(tt, false), i / fps); if (i % (3 * step) === 0) await page.evaluate((tt) => window.ENGINE.contact(tt), i / fps); }
      for (const t of beats) await shot(t);
      const tb = beatTimes(raw)[1] ?? 0.5; await shot(tb); await page.evaluate(([ts]) => window.ENGINE.blur(ts, true), [[tb + 0.004, tb + 0.008]]);
      await page.evaluate((tt) => window.ENGINE.ids(tt), tb);
      const cov = await page.coverage.stopJSCoverage();
      fs.writeFileSync(o.cover, JSON.stringify(cov.filter((e) => /\/engine\/page\//.test(e.url)).map((e) => ({ url: e.url.replace(/^.*?\/engine\//, "engine/"), functions: e.functions }))));
      console.log(`coverage: ${n} frames posed, ${beatTimes(raw).length} drawn, in ${((Date.now() - tc) / 1000).toFixed(0)}s -> ${o.cover}`);
      return;
    }
    if (o.hashes) {
      // frame cache sketch: a key per frame = engine version + what init builds + the frame's own state (and its blur
      // samples' states). Two keys equal -> the frame can be reused.
      const crypto = await import("node:crypto"), H = (x) => crypto.createHash("sha256").update(x).digest("hex").slice(0, 16);
      const eng = spawnSync("git", ["-C", ROOT, "ls-files", "-s", "engine/page", "engine/render.mjs", "characters", "assets", "package-lock.json"], { encoding: "utf8" }).stdout;
      const dirty = spawnSync("git", ["-C", ROOT, "diff", "HEAD", "--", "engine/page", "engine/render.mjs"], { encoding: "utf8" }).stdout;
      const engine = H(eng + dirty), statics = H(JSON.stringify({ cast: sb.cast, props: sb.props, set: sb.set, look, style, chars, fps, draft: !!o.draft }));
      const bl = blurPlan(sb, o, fps), n = Math.round(dur * fps), keys = [], th = Date.now();
      await page.evaluate((ts) => window.ENGINE.prime(ts), []);
      for (let i = 0; i < n; i++) {
        const t = i / fps, v = await page.evaluate((tt) => window.ENGINE.trace(tt, false), t), s = bl && blurSamples(bl, t, fps, v);
        const st = await page.evaluate(([tt, ss]) => window.ENGINE.stateHash(tt, ss), [t, s ? s.times : []]);
        keys.push({ i, key: H(engine + statics + JSON.stringify(st) + JSON.stringify(s || null)), ...st, samples: s ? s.times.length : 0 });
      }
      fs.writeFileSync(o.hashes, JSON.stringify({ engine, statics, ms: Date.now() - th, keys }));
      console.log(`frame keys: ${n} in ${((Date.now() - th) / 1000).toFixed(1)}s -> ${o.hashes}`);
      return;
    }
    if (o.layoutOnly) { const lay = await writeLayout(); if (o.cost) await writeCost(); if (contactGate(lay).length) process.exitCode = 1; return; }
    if (o.stills) {
      for (const t of o.stills) {
        const f = path.join(o.out, `${base}-t${t.toFixed(2)}.png`); fs.writeFileSync(f, await shot(t)); console.log("wrote", f);
        // --ids: which character covers each pixel, beside the still (qa/readability.mjs)
        if (o.ids) { const r = await page.evaluate((tt) => window.ENGINE.ids(tt), t); fs.writeFileSync(f.replace(/\.png$/, ".ids.png"), Buffer.from(r.png.slice(r.png.indexOf(",") + 1), "base64")); fs.writeFileSync(f.replace(/\.png$/, ".ids.json"), JSON.stringify({ t, cast: r.cast })); }
      }
      return;
    }
    // --skip-gate: only after a --layout run of the same storyboard passed (the render workflow checks once, not per shard)
    const gate = o.skipGate ? [] : contactGate(await writeLayout());
    if (gate.length) {
      console.log(`contact gate: ${gate.length} problem${gate.length > 1 ? "s" : ""} in the storyboard, fix before rendering${o.force ? " (--force: rendering anyway)" : " (or --force)"}`);
      if (!o.force) { process.exitCode = 1; return; }
    }
    let a = frameA, b = frameB;
    if (o.shard && o.balance) {
      // contiguous ranges of equal expected cost: a frame costs PER_FRAME s plus PER_SAMPLE s per extra blur sample
      // (fitted on 96 farm shards, 30 Oct 2026)
      const cf = path.join(o.out, `${sb.id}${tag}.cost.json`), PER_FRAME = 1.65, PER_SAMPLE = 2.57;
      if (!fs.existsSync(cf)) throw new Error(`--balance needs ${cf} (render.mjs --layout --cost)`);
      const fr = JSON.parse(fs.readFileSync(cf, "utf8")).frames.slice(frameA, frameB), cost = fr.map((x) => PER_FRAME + PER_SAMPLE * x.samples);
      const total = cost.reduce((m, x) => m + x, 0), cut = (k) => { if (k <= 0) return 0; if (k >= o.shard.n) return cost.length; let acc = 0; for (let j = 0; j < cost.length; j++) { if (acc + cost[j] / 2 >= (total * k) / o.shard.n) return j; acc += cost[j]; } return cost.length; };
      a = frameA + cut(o.shard.i - 1); b = frameA + cut(o.shard.i);
      console.log(`shard ${o.shard.i}/${o.shard.n} (balanced): frames ${a}-${b - 1}, expected ${cost.slice(a - frameA, b - frameA).reduce((m, x) => m + x, 0).toFixed(0)}s of ${total.toFixed(0)}s`);
    } else if (o.shard) { const n = frameB - frameA; a = frameA + Math.floor((n * (o.shard.i - 1)) / o.shard.n); b = frameA + Math.floor((n * o.shard.i) / o.shard.n); console.log(`shard ${o.shard.i}/${o.shard.n}: frames ${a}-${b - 1}`); }
    if (o.framesDir) { fs.mkdirSync(o.framesDir, { recursive: true }); o.png = true; }
    const perFrame = [];
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", o.png ? "png" : "mjpeg", "-framerate", String(fps), "-i", "-",
      ...COLOR, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps), "-an", videoFile], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((ok, bad) => ff.on("close", (c) => (c === 0 ? ok() : bad(new Error("ffmpeg exited " + c)))));
    const tr = Date.now();
    const bl = blurPlan(sb, o, fps), blurred = { frames: 0, samples: 0, ms: 0 };
    if (bl) {
      console.log(`motion blur: shutter ${bl.shutter}, a sample per ${bl.gap} px of smear from ${bl.min} px, up to ${bl.max} (on by --blur or the storyboard)`);
      await page.evaluate((ts) => window.ENGINE.prime(ts), [a - 2, a - 1].filter((k) => k >= 0).map((k) => k / fps));
    }
    // after a frame is drawn: how fast it moves, and if fast, more samples averaged in
    const blurAfter = bl && (async (t) => {
      const v = await page.evaluate(() => window.ENGINE.motion()), s = blurSamples(bl, t, fps, v);
      perFrame.at(-1).v = v; perFrame.at(-1).samples = s ? s.times.length : 0;
      if (!s) return;
      const tb = Date.now();
      await page.evaluate(([ts, keep]) => window.ENGINE.blur(ts, keep), [s.times, s.keep]);
      if (errors.length) throw new Error(errors.join("\n"));
      blurred.frames++; blurred.samples += s.times.length + (s.keep ? 1 : 0); blurred.ms += Date.now() - tb;
    });
    for (let i = a; i < b; i++) {
      const tf = Date.now(); perFrame.push({ i });
      const img = await shot(i / fps, o.png ? "png" : "jpeg", blurAfter);
      perFrame.at(-1).ms = Date.now() - tf;
      if (o.framesDir) fs.writeFileSync(path.join(o.framesDir, `f${String(i).padStart(4, "0")}.png`), img);
      if (!ff.stdin.write(img)) await new Promise((ok) => ff.stdin.once("drain", ok));
      if ((i - a) % 30 === 0) process.stdout.write(`frame ${i - a}/${b - a} (${((Date.now() - tr) / Math.max(1, i - a)).toFixed(0)} ms/frame)\n`);
    }
    ff.stdin.end(); await done;
    if (bl) console.log(`motion blur: ${blurred.frames} of ${b - a} frames blurred (${blurred.frames ? (blurred.samples / blurred.frames).toFixed(1) : 0} samples each on average, ${(blurred.ms / 1000).toFixed(1)}s)`);
    if (o.timingJson) fs.writeFileSync(o.timingJson, JSON.stringify({ a, b, totalS: (Date.now() - tr) / 1000, pose: timing.pose, draw: timing.draw, grab: timing.grab, blurred, frames: perFrame }));
    console.log(`video: ${b - a} frames in ${((Date.now() - tr) / 1000).toFixed(1)}s (per frame: ${(timing.pose / timing.n).toFixed(0)} ms posing, ${(timing.draw / timing.n).toFixed(0)} ms drawing, ${(timing.grab / timing.n).toFixed(0)} ms encoding)`);
    if (sb.cover != null && !range && (!o.shard || o.shard.i === 1)) { const f = path.join(o.out, `${base}-cover.png`); fs.writeFileSync(f, await shot(sb.cover)); console.log("wrote", f); }
  } finally {
    await browser.close(); srv.close(); if (xvfb) xvfb.proc.kill();
  }
  if (o.shard) { console.log(`wrote ${videoFile} (shard ${o.shard.i}/${o.shard.n}, video only; join with --stitch ${o.shard.n})`); return; }
  await finish(audio, videoFile, wavFile, outFile, o, dur, "");
}

// motion blur settings for this render, or null when it is off
function blurPlan(sb, o, fps) {
  if (o.blur === false || !(o.blur || sb.motionBlur)) return null;
  const bl = { ...BLUR, ...(typeof sb.motionBlur === "object" ? sb.motionBlur : {}), ...(o.blurSet || {}) };
  // the times a sample may not cross: cuts (a shot change; a continuous camera has none), impact frames, flash starts
  const cuts = Array.isArray(sb.camera) && sb.camera.length ? [] : (sb.shots || []).map((s) => s.at).filter((x) => x > 0);
  bl.walls = [...cuts, ...(sb.fx || []).flatMap((f) => (f.do === "impact" ? [f.at, f.at + (f.dur ?? 0.1)] : f.do === "flash" ? [f.at] : []))];
  bl.end = sb.duration;
  return bl;
}
// the samples for the frame at t moving v px per frame, or null when one is enough: an odd number spread evenly over
// the shutter, ends included, so the middle one is the frame already drawn (keep). A wall at w belongs to the time
// after it (a shot that starts at w is on screen at w), so the shutter is cut short on the frame's own side of it.
function blurSamples(bl, t, fps, v) {
  if (v * bl.shutter < bl.min) return null;
  const sh = Math.min(bl.shutter, ((bl.max - 1) * bl.gap) / v);
  let a = Math.max(0, t - sh / 2 / fps), b = Math.min(bl.end, t + sh / 2 / fps);
  for (const w of bl.walls) { if (w > a && w <= t + 1e-6) a = w; else if (w > t + 1e-6 && w < b) b = w - 1e-4; }
  if (b - a < 1e-3) return null;
  let n = Math.min(bl.max, Math.ceil((v * sh) / bl.gap) + 1);
  if (n % 2 === 0) n++;
  const all = Array.from({ length: n }, (_, k) => a + (k * (b - a)) / (n - 1)), mid = all[(n - 1) / 2];
  const keep = Math.abs(mid - t) < 1e-6;
  return { times: keep ? all.filter((_, k) => k !== (n - 1) / 2) : all, keep };
}

// the drawn video plus its sound (normalised), or a silent track
async function finish(audio, videoFile, wavFile, outFile, o, dur, note) {
  if (audio) {
    const l = await mux(videoFile, wavFile, outFile, o.from, (o.to ?? dur) - (o.from ?? 0));
    console.log(`wrote ${outFile} (${note}mix measured ${l.measuredLUFS} LUFS, normalised to ${LOUDNESS.I})`);
  } else {
    await ffmpeg(["-y", "-loglevel", "error", "-i", videoFile, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outFile]);
    console.log(`wrote ${outFile} (silent)`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
