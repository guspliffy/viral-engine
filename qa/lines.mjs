#!/usr/bin/env node
// Can a phone hear the line, and does the loop click? (look-2d-layer-01, 7 Nov 2026). Two sound checks that
// qa/sound.mjs didn't make: it weighs every hit against the bed on a phone speaker, never a voice, and nothing
// listened to the seam where TikTok and Reels restart a clip.
//
//   node qa/lines.mjs <sb>                      each spoken line: the voice against everything under it (music, effects,
//                                               room), in the band a phone speaker plays (200 Hz-6 kHz). Seconds, no render.
//   node qa/lines.mjs <sb> --clip <mp4>         also the loop seam of the file: its first sample, its last, the step
//                                               between them and the level either side of the seam
//   node qa/lines.mjs <sb> --clip <mp4> --hear  also Whisper (engine/voice/.venv-vox, when it is set up) on the
//                                               file through a phone filter, for each real-speech line: the words it
//                                               heard against the line (gibberish lines are captioned, never transcribed)
//
// Lines: in 20 ms steps over each line, the voiced steps (within 25 dB of the line's loudest) count; the line's level
// over the rest is the energy of the voice over the energy of everything else in those steps. On a phone, speech in
// noise reads from about +6 dB over it; under +3 dB the words go (it warns), +3 to +6 is a note. Measured on the mix
// the render makes now (engine/sfx/guard.mjs mixClip with the voices kept apart), as sound-spike is.
// Seam: a step of more than 0.03 (-30 dBFS) between the last sample and the first clicks on every loop (warn); the
// level 50 ms either side more than 15 dB apart is a note (a loud end into a quiet start, or the other way: a choice).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mixClip } from "../engine/sfx/guard.mjs";
import { lockMusic } from "../engine/music.mjs";
import { soundClock } from "../engine/shared/holds.js";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { phoneFilter, db } from "./sound.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LINE = { good: 6, low: 3, voiced: 25, step: 0.02 };
export const SEAM = { click: 0.03, level: 15 };
const SR = 44100;
const mono = (L, R) => { const m = new Float32Array(L.length); for (let i = 0; i < m.length; i++) m[i] = (L[i] + R[i]) / 2; return m; };

// each spoken line (a talk, a say, a narrated line) with its start and end in video time
export function spokenLines(sb, events) {
  const out = [];
  for (const e of events.filter((x) => x.kind === "voice" || x.kind === "speech")) {
    const a = e.action || {}, dur = a.dur ?? e.dur ?? 1.2;
    out.push({ at: e.at, end: Math.min(sb.duration, e.at + dur), who: e.who ?? a.who ?? "narrator", text: a.line ?? a.text ?? e.speech?.text ?? "", speech: !!(a.speech || e.speech), id: a.speech?.id ?? e.speech?.id });
  }
  return out.sort((x, y) => x.at - y.at);
}

// the level of each line's voice over the rest of the mix on a phone speaker
// (a: a mixClip result made with { voice: true }, to reuse one already made)
export function lineLevels(sb, chars, a = null) {
  sb = soundClock(sb);
  a = a?.voice ? a : mixClip({ ...sb, music: sb.music?.lock ? sb.music : lockMusic(sb) }, chars, [], { voice: true });
  const all = mono(a.L, a.R), vo = mono(a.voice.L, a.voice.R), rest = all.map((x, i) => x - vo[i]);
  const pv = phoneFilter(vo), pr = phoneFilter(rest), H = Math.round(LINE.step * SR);
  const blk = (x, i) => { let s = 0; for (let k = i; k < i + H && k < x.length; k++) s += x[k] * x[k]; return s / H; };
  return spokenLines(sb, a.events).map((l) => {
    const st = [];
    for (let i = Math.round(l.at * SR); i + H <= Math.round(l.end * SR); i += H) st.push([blk(pv, i), blk(pr, i)]);
    if (!st.length) return { ...l, over: null };
    const top = Math.max(...st.map((x) => x[0])), on = st.filter((x) => db(x[0]) > db(top) - LINE.voiced);
    const v = on.reduce((s, x) => s + x[0], 0), r = on.reduce((s, x) => s + x[1], 0);
    return { ...l, over: Math.round((db(v) - db(r)) * 10) / 10, voiced: on.length * LINE.step };
  });
}

export function lineResults(levels) {
  const out = [], add = (level, msg) => out.push({ group: "technical", level, check: "phone-line", msg });
  const say = (l) => `${l.who} "${(l.text || "(gibberish)").slice(0, 28)}" @${l.at.toFixed(2)} ${l.over >= 0 ? "+" : ""}${l.over} dB`;
  const ls = levels.filter((l) => l.over != null);
  if (!ls.length) return out;
  const low = ls.filter((l) => l.over < LINE.low), mid = ls.filter((l) => l.over >= LINE.low && l.over < LINE.good);
  if (low.length) add("warn", `${low.length} of ${ls.length} lines stand under ${LINE.low} dB over the music and effects on a phone speaker (${low.slice(0, 4).map(say).join(", ")}): duck the bed more under them, or move the hit off the line`);
  if (mid.length) add("note", `${mid.length} line${mid.length > 1 ? "s" : ""} only ${LINE.low}-${LINE.good} dB over the rest on a phone (${mid.slice(0, 4).map(say).join(", ")})`);
  if (!low.length && !mid.length) { const o = ls.map((l) => l.over).sort((p, q) => p - q); add("pass", `all ${ls.length} lines stand ${o[0]} to ${o[o.length - 1]} dB over the music and effects on a phone speaker (${LINE.good} dB and up reads)`); }
  return out;
}

function decodeStereo(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  if (r.status !== 0) throw new Error(`lines: can't decode ${file}`);
  const x = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length)), n = x.length / 2;
  const L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { L[i] = x[2 * i]; R[i] = x[2 * i + 1]; }
  return { L, R };
}

// the loop seam of a file: what a viewer hears when the clip restarts
export function loopSeam(clip) {
  const out = [], add = (level, msg) => out.push({ group: "technical", level, check: "loop-seam-sound", msg });
  const { L, R } = decodeStereo(clip), n = L.length;
  if (n < SR * 0.2) return out;
  // AAC adds a few ms of near-silence (priming) at the start; the first sample that plays is the first above -90 dBFS
  // within 30 ms, else the first
  let f = 0; for (let i = 0; i < 0.03 * SR; i++) if (Math.max(Math.abs(L[i]), Math.abs(R[i])) > 3e-5) { f = i; break; }
  const step = Math.max(Math.abs(L[n - 1] - L[f]), Math.abs(R[n - 1] - R[f])), first = Math.max(Math.abs(L[f]), Math.abs(R[f])), last = Math.max(Math.abs(L[n - 1]), Math.abs(R[n - 1]));
  const rms = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2; return db(s / Math.max(1, b - a)); };
  // either side of the seam, past the fades: 70-20 ms before the end, 3-53 ms after the start
  const end = rms(n - Math.round(0.07 * SR), n - Math.round(0.02 * SR)), start = rms(f + Math.round(0.003 * SR), f + Math.round(0.053 * SR));
  const dbs = (x) => `${(20 * Math.log10(x + 1e-9)).toFixed(0)} dBFS`;
  if (step > SEAM.click) add("warn", `the sound clicks at every loop: the last sample (${dbs(last)}) jumps to the first (${dbs(first)}), a step of ${dbs(step)} (render.mjs fades the seam since 7 Nov: render the sound again with --audio-only)`);
  else add("pass", `the loop seam is clean (last sample ${dbs(last)}, first ${dbs(first)})`);
  if (Number.isFinite(end) && Number.isFinite(start) && Math.abs(end - start) > SEAM.level) add("note", `across the loop the sound goes from ${end.toFixed(0)} dB (the end) to ${start.toFixed(0)} dB (the start): a ${Math.abs(end - start).toFixed(0)} dB ${end > start ? "drop" : "leap"} each time it restarts`);
  return out;
}

// Whisper on the file as a phone plays it, for each real-speech line: the share of the line's words it heard
export function hearLines(clip, lines) {
  const vpy = path.join(ROOT, "engine", "voice", ".venv-vox", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  const real = lines.filter((l) => l.speech && l.text);
  if (!real.length) return [{ group: "technical", level: "pass", check: "phone-words", msg: "no real-speech lines (gibberish lines are captioned)" }];
  if (!fs.existsSync(vpy)) return [{ group: "technical", level: "note", check: "phone-words", msg: "Whisper is not set up here (node engine/voice/setup.mjs --vox): the words were not checked" }];
  const tmp = path.join(ROOT, "out", "lines"); fs.mkdirSync(tmp, { recursive: true });
  const wav = path.join(tmp, path.basename(clip).replace(/\.\w+$/, "-phone.wav"));
  spawnSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vn", "-ac", "1", "-ar", "16000", "-af", "highpass=f=200,highpass=f=200,lowpass=f=6000,lowpass=f=6000", wav]);
  const py = `import json,sys
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
segs,_=m.transcribe(sys.argv[1],language='en',word_timestamps=True)
print(json.dumps([[w.start,w.end,w.word] for s in segs for w in s.words]))`;
  const r = spawnSync(vpy, ["-c", py, wav], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) return [{ group: "technical", level: "note", check: "phone-words", msg: `Whisper failed: ${(r.stderr || "").slice(-200)}` }];
  const words = JSON.parse(r.stdout.trim().split("\n").pop()), norm = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
  const res = real.map((l) => {
    const heard = norm(words.filter((w) => w[1] > l.at - 0.2 && w[0] < l.end + 0.3).map((w) => w[2]).join(" ")), want = norm(l.text);
    const got = want.filter((w) => heard.includes(w)).length;
    return { l, share: want.length ? got / want.length : 1, heard: heard.join(" ") };
  });
  const bad = res.filter((x) => x.share < 0.7);
  return [bad.length
    ? { group: "technical", level: "warn", check: "phone-words", msg: `on a phone speaker Whisper misses words of ${bad.length} of ${res.length} lines (${bad.slice(0, 3).map((x) => `"${x.l.text}" heard as "${x.heard}"`).join("; ")})` }
    : { group: "technical", level: "pass", check: "phone-words", msg: `Whisper hears ${res.length} line${res.length > 1 ? "s" : ""} through a phone filter (${Math.round(100 * Math.min(...res.map((x) => x.share)))} % of the words at least)` }];
}

function main() {
  const a = process.argv.slice(2), o = { sb: null, clip: null, hear: false, json: false };
  for (let i = 0; i < a.length; i++) { if (a[i] === "--clip") o.clip = a[++i]; else if (a[i] === "--hear") o.hear = true; else if (a[i] === "--json") o.json = true; else if (!o.sb) o.sb = a[i]; }
  if (!o.sb) { console.error("usage: node qa/lines.mjs <storyboard.json> [--clip <mp4> [--hear]] [--json]"); process.exit(2); }
  const sb = loadStoryboard(path.resolve(o.sb)), chars = loadCharacters(sb);
  const lv = lineLevels(sb, chars), results = [...lineResults(lv), ...(o.clip ? loopSeam(o.clip) : []), ...(o.clip && o.hear ? hearLines(o.clip, lv) : [])];
  if (o.json) { console.log(JSON.stringify({ lines: lv, results }, null, 1)); return; }
  for (const l of lv) console.log(`  ${l.at.toFixed(2)}-${l.end.toFixed(2)} ${l.who.padEnd(4)} ${l.over == null ? "  -" : (l.over >= 0 ? "+" : "") + l.over.toFixed(1)} dB  ${l.text || "(gibberish)"}`);
  for (const r of results) console.log(`${r.level.toUpperCase().padEnd(5)} ${r.check}: ${r.msg}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
