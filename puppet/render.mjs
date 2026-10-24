#!/usr/bin/env node
// Renders a puppet storyboard: PotatoBrawl's own fighters and maps, drawn by the game's own code, moved by our moves.
//
//   node puppet/render.mjs storyboards/puppet/dance-01.json              -> out/dance-01.mp4 + cover + layout + WAV
//   node puppet/render.mjs <sb> --stills 0.5,3.2                         -> PNG stills only (seconds)
//   node puppet/render.mjs <sb> --layout                                 -> only <id>.layout.json for qa/check.mjs
//   node puppet/render.mjs <sb> --safe                                   -> draws the TikTok safe zone on top
//   node puppet/render.mjs <sb> --audio-only                             -> redo only the sound on an earlier render
//   node puppet/render.mjs <sb> --no-music                               -> voices and effects without the placeholder beat
//   node puppet/render.mjs <sb> --silent | --from s --to s | --png | --out dir
//
// Needs the game next to this repo (../potatobrawl, or POTATOBRAWL=/path) with its test page built
// (python3 game/build.py; this script runs it when build/test.html is missing). The game's code is not changed:
// the renderer loads a copy of the built page with one hook added, which lets puppet/page/*.js run in the game's scope.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { renderAudio, writeWav } from "../engine/audio.mjs";
import { planSyllables, mouthAt } from "../engine/shared/syllables.js";
import { renderBeat } from "./beat.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "..");
const GAME = path.resolve(process.env.POTATOBRAWL || path.join(ROOT, "..", "potatobrawl"));
const LOUDNESS = { I: -14, TP: -2, LRA: 11 };
const HOOK = "window.__blastline = {";   // in the game's ui/loop.js, inside the game's script scope

function args() {
  const a = process.argv.slice(2), o = { file: null, out: path.join(ROOT, "out") };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--stills") o.stills = a[++i].split(",").map(Number);
    else if (a[i] === "--safe") o.safe = true;
    else if (a[i] === "--png") o.png = true;
    else if (a[i] === "--layout") o.layoutOnly = true;
    else if (a[i] === "--silent") o.silent = true;
    else if (a[i] === "--no-music") o.noMusic = true;
    else if (a[i] === "--audio-only") o.audioOnly = true;
    else if (a[i] === "--draft") o.draft = true;   // accepted for symmetry with engine/render.mjs; the 2D game drawing is fast either way
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--from") o.from = Number(a[++i]);
    else if (a[i] === "--to") o.to = Number(a[++i]);
    else o.file = a[i];
  }
  if (!o.file) { console.error("usage: node puppet/render.mjs <storyboard.json> [--stills t,t] [--layout] [--safe] [--audio-only] [--no-music] [--silent] [--from s --to s] [--out dir]"); process.exit(2); }
  return o;
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
  return undefined;
}
function ffmpeg(argv) {
  return new Promise((ok, bad) => {
    const p = spawn("ffmpeg", argv, { stdio: ["ignore", "ignore", "pipe"] }); let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? ok(err) : bad(new Error(`ffmpeg exited ${c}\n${err.slice(-2000)}`))));
  });
}
// two-pass loudness normalisation, linear (same as engine/render.mjs)
async function mux(video, wav, outFile, from, len) {
  const cut = from != null ? ["-ss", String(from), "-t", String(len)] : [];
  const m = await ffmpeg(["-hide_banner", ...cut, "-i", wav, "-af", `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
  const ln = `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  await ffmpeg(["-y", "-loglevel", "error", "-i", video, ...cut, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", ln, "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", outFile]);
  return { measuredLUFS: Number(j.input_i) };
}

// the game's built test page, with the hook that hands puppet/page/*.js the game's scope
function gamePage(outDir) {
  const built = path.join(GAME, "build", "test.html");
  if (!fs.existsSync(built)) {
    if (!fs.existsSync(path.join(GAME, "game", "build.py"))) throw new Error(`PotatoBrawl not found at ${GAME} (set POTATOBRAWL=/path/to/potatobrawl)`);
    console.log("building the game's test page (python3 game/build.py)");
    const r = spawnSync("python3", [path.join(GAME, "game", "build.py")], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("game build failed:\n" + r.stderr);
  }
  const html = fs.readFileSync(built, "utf8");
  if (html.split(HOOK).length !== 2) throw new Error(`the game's page changed: "${HOOK}" should appear exactly once in ${built}`);
  const f = path.join(outDir, ".puppet-page.html");
  fs.writeFileSync(f, html.replace(HOOK, "window.__PUP = { ev: (s) => eval(s) }; " + HOOK));
  const rev = spawnSync("git", ["-C", GAME, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim();
  return { file: f, rev };
}

// per-frame mouth opening for every actor, from the same syllable plan the voice is synthesised from
function mouths(sb, voices) {
  const fps = sb.fps ?? 30, n = Math.ceil(sb.duration * fps) + 1, out = {};
  for (const c of sb.cast) {
    const talks = (sb.actions || []).filter((a) => a.who === c.id && a.do === "talk");
    if (!talks.length) continue;
    const m = new Array(n).fill(0);
    for (const a of talks) {
      const plan = planSyllables(a, voices[c.id]);
      for (let i = Math.floor(a.at * fps); i <= Math.ceil((a.at + (a.dur ?? 1)) * fps) && i < n; i++) m[i] = Math.max(m[i], mouthAt(plan, i / fps).open);
    }
    out[c.id] = m;
  }
  return out;
}

function voicesOf(sb) {
  const table = JSON.parse(fs.readFileSync(path.join(HERE, "cast.json"), "utf8")), v = {};
  for (const c of sb.cast) v[c.id] = { ...(table[c.fighter]?.voice || {}), ...(c.voice || {}) };
  return v;
}

// the sound: the 3D engine's voice and effects synth, fed a translated storyboard, plus the placeholder beat
function sound(sb, voices, noMusic) {
  const acts = sb.actions || [], sfx = [...(sb.sfx || [])];
  const a3 = [];
  for (const a of acts) {
    if (a.do === "talk") a3.push(a);
    else if (a.do === "hop" && a.sound !== false) a3.push({ ...a, do: "hop" });
    else if (a.do === "spin" && a.sound !== false) sfx.push({ sound: "whoosh", at: a.at, dur: Math.max(0.25, a.dur * 0.9), gain: 0.3 });
    else if (a.do === "face" && a.expr === "terror" && a.sting) a3.push({ ...a, do: "expr", expr: "shocked" });
  }
  const sb3 = {
    duration: sb.duration, sound: sb.sound,
    cast: sb.cast.map((c) => ({ id: c.id, character: "pup:" + c.id, at: [(c.x || 0) / 150, 0] })),
    actions: a3, fx: (sb.fx || []).filter((f) => f.do === "flash" && f.sound), sfx,
  };
  const chars = Object.fromEntries(sb.cast.map((c) => ["pup:" + c.id, { voice: voices[c.id] }]));
  const A = renderAudio(sb3, chars);
  if (sb.music && !noMusic) {
    const M = renderBeat(sb.music, sb.duration, sb.id), g = sb.music.gain ?? 0.5;
    for (let i = 0; i < A.L.length; i++) { A.L[i] += M.L[i] * g; A.R[i] += M.R[i] * g; }
  }
  let peak = 0;
  for (let i = 0; i < A.L.length; i++) peak = Math.max(peak, Math.abs(A.L[i]), Math.abs(A.R[i]));
  if (peak > 0.89) { const k = 0.89 / peak; for (let i = 0; i < A.L.length; i++) { A.L[i] *= k; A.R[i] *= k; } }
  return A;
}

async function main() {
  const o = args();
  const sb = JSON.parse(fs.readFileSync(o.file, "utf8"));
  const fps = sb.fps ?? 30, dur = sb.duration;
  fs.mkdirSync(o.out, { recursive: true });
  const range = o.from != null || o.to != null ? `-${o.from ?? 0}-${o.to ?? dur}` : "";
  const base = `${sb.id}${o.noMusic ? "-nomusic" : ""}${range}${o.safe ? "-safe" : ""}${o.draft ? "-draft" : ""}`;
  const videoFile = path.join(o.out, `${sb.id}${range}${o.safe ? "-safe" : ""}${o.draft ? "-draft" : ""}.video.mp4`), outFile = path.join(o.out, `${base}.mp4`);
  const wavFile = path.join(o.out, `${sb.id}${o.noMusic ? "-nomusic" : ""}.wav`);
  const voices = voicesOf(sb);

  let audio = null;
  if (!o.stills && !o.silent && !o.layoutOnly) {
    audio = sound(sb, voices, o.noMusic);
    writeWav(wavFile, audio.L, audio.R, audio.sr);
    const counts = audio.events.reduce((m, e) => ((m[e.kind] = (m[e.kind] || 0) + 1), m), {});
    console.log(`sound: ${JSON.stringify(counts)}${sb.music && !o.noMusic ? ` + beat ${sb.music.bpm} bpm` : ""} -> ${wavFile}`);
  }
  if (o.audioOnly) {
    if (!fs.existsSync(videoFile)) throw new Error(`--audio-only needs an earlier render: ${videoFile} not found`);
    const l = await mux(videoFile, wavFile, outFile, o.from, (o.to ?? dur) - (o.from ?? 0));
    console.log(`wrote ${outFile} (sound only; mix measured ${l.measuredLUFS} LUFS, normalised to ${LOUDNESS.I})`);
    return;
  }

  const page0 = gamePage(o.out);
  const src = `(() => {\n${["moves.js", "props.js", "runtime.js"].map((f) => fs.readFileSync(path.join(HERE, "page", f), "utf8")).join("\n")}\n})()`;
  const fonts = { PupBlack: fs.readFileSync(path.join(ROOT, "assets/fonts/Inter-Black.otf")).toString("base64"), PupBold: fs.readFileSync(path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf")).toString("base64") };
  const browser = await chromium.launch({ executablePath: findChrome() });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    // the game's own loop never runs: no frames are requested, so nothing but our calls draws or changes anything
    await ctx.addInitScript(`try { localStorage.setItem('potatobrawl.profile.v1', JSON.stringify({ tut: true, gfx: '2d', sound: false, fs: false })); } catch (e) {}
      window.requestAnimationFrame = () => 0;`);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("file://" + page0.file);
    await page.waitForFunction(() => !!window.__PUP, null, { timeout: 30000 });
    await page.evaluate((s) => { window.PUP = window.__PUP.ev(s); }, src);
    const info = await page.evaluate((d) => window.PUP.init(d), { sb, fonts, opts: { safe: !!o.safe, mouth: mouths(sb, voices) } });
    if (errors.length) throw new Error("page errors:\n" + errors.join("\n"));
    console.log(`game ${page0.rev}: ${JSON.stringify(info)}`);
    const shot = async (t, fmt = "jpeg") => {
      await page.evaluate((tt) => window.PUP.frame(tt), t);
      if (errors.length) throw new Error(errors.join("\n"));
      const url = await page.evaluate((f) => window.PUP.capture(f), fmt);
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    };
    const writeLayout = async (name) => {
      const samples = [];
      for (let t = 0; t < dur - 1e-6; t += 0.1) samples.push(await page.evaluate((tt) => window.PUP.layout(tt), Math.round(t * 1000) / 1000));
      const f = path.join(o.out, `${name}.layout.json`);
      fs.writeFileSync(f, JSON.stringify({ fps, duration: dur, width: 1080, height: 1920, samples }));
      console.log("wrote", f);
    };
    if (o.layoutOnly) { await writeLayout(sb.id); return; }
    if (o.stills) {
      for (const t of o.stills) { const f = path.join(o.out, `${sb.id}${o.safe ? "-safe" : ""}-t${t.toFixed(2)}.png`); fs.writeFileSync(f, await shot(t, "png")); console.log("wrote", f); }
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
      if ((i - a) % 60 === 0) console.log(`frame ${i - a}/${b - a} (${((Date.now() - tr) / Math.max(1, i - a)).toFixed(0)} ms/frame)`);
    }
    ff.stdin.end(); await done;
    console.log(`video: ${b - a} frames in ${((Date.now() - tr) / 1000).toFixed(1)}s`);
    if (!range) await writeLayout(base);
    if (sb.cover != null && !range) { const f = path.join(o.out, `${sb.id}-cover.png`); fs.writeFileSync(f, await shot(sb.cover, "png")); console.log("wrote", f); }
  } finally { await browser.close(); }
  if (audio) {
    const l = await mux(videoFile, wavFile, outFile, o.from, (o.to ?? dur) - (o.from ?? 0));
    console.log(`wrote ${outFile} (mix measured ${l.measuredLUFS} LUFS, normalised to ${LOUDNESS.I})`);
  } else {
    await ffmpeg(["-y", "-loglevel", "error", "-i", videoFile, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outFile]);
    console.log(`wrote ${outFile} (silent)`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
