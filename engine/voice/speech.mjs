// Real speech for say and narrate lines: runs before compile() so a line lasts exactly as long as its spoken
// audio, and everything timed after it ("+0.2", "voice+0.2", the next beat) follows the real voice.
//
// A character speaks for real when its file names a voice ("tts": "reaper", recipes in engine/voice/voices.json);
// a line can pick another voice with "voice". Lines from characters without one, or every line when the voice model
// isn't set up (node engine/voice/setup.mjs), keep the gibberish voice. "sound": { "speech": false } turns it off.
// Audio and phoneme timings are cached in out/speech/ by a hash of the text and the recipe, so a re-render, a qa
// check and the renderer all see the same lengths, and only new or changed lines are synthesised.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mouthKeys } from "../shared/visemes.js";
import { wordTimes } from "../shared/captions.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../..");
export const CACHE = path.join(ROOT, "out", "speech");
const VERSION = 2, REC_VERSION = 3; // bump when tts.py changes how a line sounds or is timed (2: non-words like "hnnngh" are sounds, not spelled)
const VOICES = JSON.parse(fs.readFileSync(path.join(HERE, "voices.json"), "utf8"));

// tone -> how the line is read: speed factor and the punctuation the model takes its intonation from
const TONES = { calm: [1, "."], excited: [1.08, "!"], sad: [0.9, "."], question: [1, "?"], chant: [0.9, "."], whisper: [1, "."] };

export function python() {
  if (process.env.VOICE_PYTHON) return process.env.VOICE_PYTHON;
  const venv = path.join(HERE, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  return fs.existsSync(venv) ? venv : null;
}
export const ready = () => !!python() && fs.existsSync(path.join(HERE, "models", "voices-v1.0.bin"));

function recipe(voice) {
  if (voice == null || voice === false) return null;
  if (typeof voice === "object") return voice;
  if (!VOICES[voice]) throw new Error(`unknown voice "${voice}" (known: ${Object.keys(VOICES).filter((k) => k[0] !== "_").join(", ")})`);
  return VOICES[voice];
}

function job(text, rec, { tone = "calm", soft = false }) {
  const [speed, mark] = TONES[tone] ?? TONES.calm;
  const t = text.trim(), spoken = /[.!?…]$/.test(t) ? t : t + mark;
  const j = { text: spoken, voice: rec.voice, speed: Math.round((rec.speed ?? 1) * speed * 1000) / 1000, lang: rec.lang ?? "en-us",
    pitch: rec.pitch ?? 0, formant: rec.formant, soft: !!(soft || tone === "whisper"), pause: rec.pause, post: rec.post, accent: rec.accent, convert: rec.convert };   // pause/post/accent/convert: only when a recipe sets them (else left out of the hash)
  j.id = crypto.createHash("sha1").update(JSON.stringify([VERSION, j])).digest("hex").slice(0, 16);
  return j;
}

let warned = false;
function synthesise(jobs) {
  const todo = jobs.filter((j, i) => jobs.findIndex((k) => k.id === j.id) === i && !fs.existsSync(path.join(CACHE, `${j.id}.json`)));
  if (!todo.length) return true;
  if (!ready()) {
    if (!warned) console.warn(`speech: voice model not set up (node engine/voice/setup.mjs), ${todo.length} line(s) use the gibberish voice`);
    warned = true;
    return false;
  }
  const t = Date.now();
  const r = spawnSync(python(), [path.join(HERE, "tts.py")], { input: JSON.stringify({ cache: CACHE, jobs: todo }), encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`speech: tts.py failed\n${(r.stderr || r.error || "").toString().slice(-3000)}`);
  console.log(`speech: ${todo.length} new line(s) in ${((Date.now() - t) / 1000).toFixed(1)}s -> ${path.relative(ROOT, CACHE)}`);
  return true;
}

// sb: the storyboard as written (beats or flat). Returns a copy whose say/narrate items (or flat talk actions with a
// line) carry dur = spoken length and speech = { id, mouth, words } (words: when each word is said, for kinetic
// captions; left out when the voice read the line as a different number of words). Characters: { "potatobrawl/reaper": {...} }.
// SPEECH=off in the environment does the same as "speech": false for every storyboard (qa/golden.mjs: the golden
// stills keep their timing whether or not the voice model is set up on the machine)
export function withSpeech(sb, chars) {
  if (sb.sound?.speech === false || process.env.SPEECH === "off") return sb;
  const out = structuredClone(sb), lines = [];
  const castVoice = (who) => { const c = (sb.cast || []).find((x) => x.id === who); return c && chars[c.character]?.tts; };
  const add = (item, voice, opts) => { const rec = recipe(voice); if (rec) lines.push({ item, job: job(item.line, rec, opts) }); };
  const recs = [];
  for (const b of out.beats || []) for (const it of b.do || []) {
    if (it.macro === "say" && it.line && it.rec) { recs.push(it); continue; }
    if (it.macro === "say" && it.line && it.voice !== false) add(it, it.voice ?? castVoice(it.who), it);
    if (it.macro === "narrate" && it.line) add(it, it.voice ?? "storyteller-warm", it);
  }
  if (!out.beats) for (const a of out.actions || []) if (a.do === "talk" && a.line && a.voice !== false) add(a, a.voice ?? castVoice(a.who), a);
  // recorded lines (an actor's own voice): the mouth and word timings come from the character's synthetic voice
  // reading the same text, warped onto the recording, so that voice is synthesised too
  const recJobs = recs.map((it) => {
    const r = recipe(it.age ?? "age-none"), base = recipe(r.phones ?? castVoice(it.who) ?? "pebble");
    lines.push({ item: null, job: job(it.line, base, it) });
    return { it, r, ref: lines[lines.length - 1].job };
  });
  if (!lines.length || !synthesise(lines.map((l) => l.job))) return out;
  for (const { it, r, ref } of recJobs) {
    const info = recorded(it.rec, r, ref);
    it.dur = info.dur;
    const words = wordTimes(info.phones, it.line);
    it.speech = { id: info.id, mouth: mouthKeys(info.phones), ...(words ? { words } : {}) };
  }
  for (const { item, job: j } of lines) {
    if (!item) continue;
    const info = JSON.parse(fs.readFileSync(path.join(CACHE, `${j.id}.json`), "utf8"));
    if (item.dur != null && Math.abs(item.dur - info.dur) > 0.25) console.warn(`speech: "${item.line}" lasts ${info.dur}s spoken, not the ${item.dur}s written; using the spoken length`);
    item.dur = info.dur;
    const words = wordTimes(info.phones, item.line);
    if (!words) console.warn(`speech: "${item.line}" was read as a different number of words, its caption uses the syllable guess`);
    item.speech = { id: j.id, mouth: mouthKeys(info.phones), ...(words ? { words } : {}) };
  }
  return out;
}

// mono samples of a cached line at the engine's rate (tts.py writes 44.1 kHz 16-bit PCM)
export function speechSamples(id) {
  const b = fs.readFileSync(path.join(CACHE, `${id}.wav`));
  let p = 12, fmt = null;
  while (p < b.length - 8) {
    const tag = b.toString("ascii", p, p + 4), n = b.readUInt32LE(p + 4);
    if (tag === "fmt ") fmt = { ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (tag === "data") {
      if (!fmt || fmt.bits !== 16 || fmt.sr !== 44100) throw new Error(`speech: ${id}.wav is not 44.1 kHz 16-bit`);
      const x = new Float32Array(Math.floor(n / 2 / fmt.ch));
      for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(p + 8 + i * 2 * fmt.ch) / 32768;
      return x;
    }
    p += 8 + n + (n & 1);
  }
  throw new Error(`speech: ${id}.wav has no audio`);
}

// ---------------------------------------------------------------- recorded lines
// A say line can play a recording instead of the synthetic voice: { macro: "say", line, rec: "<audio file>", age: "<recipe>" }.
// The recipe (voices.json, "age": {...}) turns the take into the character: noise cleaned, silence trimmed, then
// pitch (semitones, formants kept or "formant": "shift"), tempo, warmth (low shelf dB), a tremor (vibrato [Hz, depth],
// tremolo [Hz, depth]) and a top cut (Hz). Cached in out/speech/ by a hash of the file's bytes and the recipe.
const RATE = 44100;
function ageChain(a = {}) {
  const f = ["afftdn=nf=-45", "highpass=f=70",
    "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03:stop_periods=-1:stop_threshold=-42dB:stop_silence=0.35:stop_duration=0.6",
    "areverse", "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.12", "areverse"];
  if (a.pitch || (a.tempo && a.tempo !== 1)) {
    const fm = a.formant === "shift" ? "shifted" : "preserved";
    f.push(`rubberband=pitch=${(2 ** ((a.pitch ?? 0) / 12)).toFixed(5)}:tempo=${(a.tempo ?? 1).toFixed(4)}:formant=${fm}:pitchq=quality:window=long:transients=smooth:phase=independent`);
  }
  if (a.warm) f.push(`lowshelf=f=220:g=${a.warm}`);
  if (a.presence) f.push(`equalizer=f=2600:t=q:w=1:g=${a.presence}`);
  if (a.vibrato) f.push(`vibrato=f=${a.vibrato[0]}:d=${a.vibrato[1]}`);
  if (a.tremolo) f.push(`tremolo=f=${a.tremolo[0]}:d=${a.tremolo[1]}`);
  if (a.lowpass) f.push(`lowpass=f=${a.lowpass}`);
  f.push("acompressor=threshold=-24dB:ratio=3:attack=8:release=120", "loudnorm=I=-16:TP=-2:LRA=7", `aresample=${RATE}`);
  return f.join(",");
}

function readWav(file) {
  const b = fs.readFileSync(file); let p = 12, fmt = null;
  while (p < b.length - 8) {
    const tag = b.toString("ascii", p, p + 4), n = b.readUInt32LE(p + 4);
    if (tag === "fmt ") fmt = { ch: b.readUInt16LE(p + 10) };
    if (tag === "data") { const x = new Float32Array(Math.floor(n / 2 / fmt.ch)); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(p + 8 + i * 2 * fmt.ch) / 32768; return x; }
    p += 8 + n + (n & 1);
  }
  throw new Error(`speech: ${file} has no audio`);
}

// spoken stretches [start, end] in seconds: 20 ms windows over a threshold, gaps under `gap` s joined, blips dropped
export function spans(x, { gap = 0.16, db = -36, min = 0.08 } = {}) {
  const w = Math.round(RATE * 0.02), on = [];
  let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
  const thr = peak * 10 ** (db / 20);
  for (let i = 0; i + w <= x.length; i += w) { let m = 0; for (let j = i; j < i + w; j++) m = Math.max(m, Math.abs(x[j])); on.push(m > thr); }
  const out = [];
  on.forEach((v, k) => { if (!v) return; const t = k * 0.02; const l = out[out.length - 1]; if (l && t - l[1] <= gap) l[1] = t + 0.02; else out.push([t, t + 0.02]); });
  return out.filter((s) => s[1] - s[0] >= min);
}

// a piecewise-linear map from the reference voice's time to the recording's: stretch by stretch when both have
// the same number of spoken stretches, else the whole spoken span at once
export function warpMap(a, b) {
  const pairs = a.length === b.length ? a.map((s, i) => [s, b[i]]) : [[[a[0][0], a[a.length - 1][1]], [b[0][0], b[b.length - 1][1]]]];
  const knots = [[0, 0]];
  for (const [s, r] of pairs) knots.push([s[0], r[0]], [s[1], r[1]]);
  return (t) => {
    for (let i = 1; i < knots.length; i++) if (t <= knots[i][0] || i === knots.length - 1) {
      const [x0, y0] = knots[i - 1], [x1, y1] = knots[i];
      return x1 > x0 ? y0 + ((t - x0) * (y1 - y0)) / (x1 - x0) : y1 + (t - x1);
    }
    return t;
  };
}

// the reference voice's words in n groups, split where the recording pauses most likely: after punctuation first,
// then at the reference's own longest gaps between words. [[start, end] per group] or null
function refGroups(info, text, n) {
  const w = wordTimes(info.phones, text), toks = text.trim().split(/\s+/);
  if (!w || w.length !== toks.length || n < 1 || n > w.length) return null;
  const cuts = w.slice(0, -1).map((x, i) => ({ i, score: w[i + 1][0] - x[1] + (/[.,!?;:…]$/.test(toks[i]) ? 10 : 0) }))
    .sort((a, b) => b.score - a.score).slice(0, n - 1).map((c) => c.i).sort((a, b) => a - b);
  const out = []; let from = 0;
  for (const c of [...cuts, w.length - 1]) { out.push([w[from][0], w[c][1]]); from = c + 1; }
  return out;
}

function recorded(file, rec, ref) {
  const src = path.resolve(ROOT, file);
  if (!fs.existsSync(src)) {   // a take kept out of the repo (an actor's own voice) on a machine that doesn't have it
    console.warn(`speech: recording ${file} not found, "${ref.text}" uses the synthetic voice`);
    return JSON.parse(fs.readFileSync(path.join(CACHE, `${ref.id}.json`), "utf8"));
  }
  const chain = ageChain(rec.age);
  const id = "rec-" + crypto.createHash("sha1").update(fs.readFileSync(src)).update(JSON.stringify([REC_VERSION, chain, ref.id])).digest("hex").slice(0, 16);
  const wav = path.join(CACHE, `${id}.wav`), meta = path.join(CACHE, `${id}.json`);
  if (fs.existsSync(meta)) return JSON.parse(fs.readFileSync(meta, "utf8"));
  fs.mkdirSync(CACHE, { recursive: true });
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-ac", "1", "-af", chain, "-ar", String(RATE), "-c:a", "pcm_s16le", wav], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`speech: ffmpeg could not process ${file}\n${r.stderr}`);
  const x = readWav(wav), pad = 0.03, dur = Math.round((x.length / RATE + pad) * 1000) / 1000;
  const refInfo = JSON.parse(fs.readFileSync(path.join(CACHE, `${ref.id}.json`), "utf8"));
  const map = warpMap(refGroups(refInfo, ref.text, spans(x).length) || spans(readWav(path.join(CACHE, `${ref.id}.wav`))), spans(x));
  const phones = refInfo.phones.map(([p, t, d]) => { const a = map(t), b = map(t + d); return [p, Math.round(a * 1000) / 1000, Math.max(0.01, Math.round((b - a) * 1000) / 1000)]; });
  let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
  const info = { id, text: ref.text, file, dur, phones, peak: Math.round(peak * 100) / 100, recorded: true };
  fs.writeFileSync(meta, JSON.stringify(info));
  return info;
}
