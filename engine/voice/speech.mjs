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

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../..");
export const CACHE = path.join(ROOT, "out", "speech");
const VERSION = 2; // bump when tts.py changes how a line sounds or is timed (2: non-words like "hnnngh" are sounds, not spelled)
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
    pitch: rec.pitch ?? 0, formant: rec.formant, soft: !!(soft || tone === "whisper") };
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
// line) carry dur = spoken length and speech = { id, mouth }. Characters: { "potatobrawl/reaper": {...} }.
// SPEECH=off in the environment does the same as "speech": false for every storyboard (qa/golden.mjs: the golden
// stills keep their timing whether or not the voice model is set up on the machine)
export function withSpeech(sb, chars) {
  if (sb.sound?.speech === false || process.env.SPEECH === "off") return sb;
  const out = structuredClone(sb), lines = [];
  const castVoice = (who) => { const c = (sb.cast || []).find((x) => x.id === who); return c && chars[c.character]?.tts; };
  const add = (item, voice, opts) => { const rec = recipe(voice); if (rec) lines.push({ item, job: job(item.line, rec, opts) }); };
  for (const b of out.beats || []) for (const it of b.do || []) {
    if (it.macro === "say" && it.line && it.voice !== false) add(it, it.voice ?? castVoice(it.who), it);
    if (it.macro === "narrate" && it.line) add(it, it.voice ?? "storyteller-warm", it);
  }
  if (!out.beats) for (const a of out.actions || []) if (a.do === "talk" && a.line && a.voice !== false) add(a, a.voice ?? castVoice(a.who), a);
  if (!lines.length || !synthesise(lines.map((l) => l.job))) return out;
  for (const { item, job: j } of lines) {
    const info = JSON.parse(fs.readFileSync(path.join(CACHE, `${j.id}.json`), "utf8"));
    if (item.dur != null && Math.abs(item.dur - info.dur) > 0.25) console.warn(`speech: "${item.line}" lasts ${info.dur}s spoken, not the ${item.dur}s written; using the spoken length`);
    item.dur = info.dur;
    item.speech = { id: j.id, mouth: mouthKeys(info.phones) };
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
