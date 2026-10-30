// Background music placed against the story: the tempo and the start of the beat grid are chosen so the clip's
// moments land on the music. The payoff lands on a bar line (beat 1), part changes ("stop", "drop") and the clip's
// last frame on bar lines too, and impacts, knocks and the other beat starts on beats. Without its own `parts`, a
// clip with a payoff gets one beat of silence just before it and a drop (crash) on it.
//
//   lockMusic(sb)       -> the music block to render with: { ...sb.music, bpm, offset, parts, lock: { ... } }
//   addMusic(sb, audio) -> mixes it into audio.L / audio.R (engine/audio.mjs renderAudio), returns log lines
//
// The tempo stays inside the style's range (puppet/beat.mjs STYLE), so a sneaky clip stays sneaky; a pinned `bpm`
// keeps its tempo and only the grid moves. A recorded bed (music.file) keeps its own tempo (assets/music manifest)
// and starts `skip` seconds into the file instead. Opt out with "lock": false, or pin "offset". Dance clips are
// left alone unless they ask ("lock": true): their moves were made on the grid they have.
//
// The payoff is the beat marked "kind": "payoff", else one named payoff / reveal / punchline, else the last
// "escalation" beat; "music": { "payoff": 7.2 } names a time instead. Deterministic: no randomness here at all.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { musicFlavour, seedOf, renderBeat } from "../puppet/beat.mjs";
import { isHit, hitTime } from "./sfx/library.mjs";
import { isDance } from "./page/dance.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "assets/music/ai/manifest.json");

export function payoffOf(sb) {
  if (sb.music?.payoff != null) return sb.music.payoff;
  const b = sb.beatSpans || [];
  const p = b.find((x) => x.kind === "payoff") ?? b.find((x) => /payoff|reveal|punch/i.test(x.name || "")) ?? [...b].reverse().find((x) => x.kind === "escalation");
  return p ? p.from : null;
}

// the moments the music should meet: { t, w (weight), bar (true: on beat 1 of a bar, else on any beat), what }. The
// payoff (or, for a bed that stops, the stop) outweighs the rest together: it is the one that must land on beat 1.
// Only moments while the music plays count.
export function storyAnchors(sb, music = sb.music || {}) {
  const out = [], dur = sb.duration, pay = payoffOf(sb), from = music.from ?? 0, until = music.until ?? dur;
  const stops = (music.parts || []).filter((p) => p.part === "stop").map((p) => p.at), end = Math.min(until, ...stops, dur);
  const add = (t, w, bar, what) => { if (t > from + 0.05 && t < dur - 0.05 && t <= end + 0.05) out.push({ t, w, bar, what }); };
  if (music.until != null) add(music.until, 50, true, "music stops");
  if (pay != null) add(pay, music.until != null ? 4 : 50, music.until == null, "payoff");
  for (const p of music.parts || []) add(p.at, 4, false, `part ${p.part}`);
  for (const b of sb.beatSpans || []) if (b.from !== pay) add(b.from, b.kind === "escalation" ? 2 : 0.5, false, `beat "${b.name}"`);
  for (const f of sb.fx || []) if (f.do === "impact" || f.do === "flash") add(f.at, 1, false, f.do);
  for (const s of sb.sfx || []) if (isHit(s.sound) && !/^step/.test(s.sound)) add(s.at, 1, false, s.sound);
  if (end >= dur - 0.05) out.push({ t: dur, w: 1, bar: false, what: "last frame" });   // ends on a beat, so the loop restarts on one
  return out;
}

const fileTempo = (file) => {
  try { const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8")); for (const s of m.sounds) for (const k of s.takes || []) if (`ai/${k.file}` === file) return k.bpm ?? s.bpm; } catch {}
  return null;
};

// the grid (bpm, offset) with the smallest weighted squared miss over the anchors
function solve(anchors, bpms, offsets) {
  let best = null;
  for (const bpm of bpms) {
    const spb = 60 / bpm, bar = 4 * spb;
    for (const off of offsets(bar)) {
      let cost = 0;
      for (const a of anchors) { const g = a.bar ? bar : spb, u = (((a.t - off) % g) + g) % g, d = Math.min(u, g - u); cost += a.w * d * d; }
      if (!best || cost < best.cost - 1e-12) best = { bpm, off, cost };
    }
  }
  return best;
}

export function lockMusic(sb) {
  if (sb.music === false) return false;
  const music = { ...(sb.music || {}) };
  // dance moves that follow the beat (spin and shake keep their own time)
  const dance = (sb.actions || []).some((a) => isDance(a.do) && !["spin", "shake", "show"].includes(a.do));
  if (music.file) {
    const bpm = music.bpm ?? fileTempo(music.file);
    if (music.lock === false || music.skip != null || !bpm) return music;
    const from = music.from ?? 0, anchors = storyAnchors(sb, music).filter((a) => a.t >= from);
    const step = 0.002, best = solve(anchors, [bpm], (bar) => Array.from({ length: Math.ceil(bar / step) }, (_, i) => from - i * step));
    return { ...music, skip: Math.round((from - best.off) * 1000) / 1000, lock: report(anchors, bpm, best.off) };
  }
  const F = musicFlavour(music, seedOf(sb));
  if (music.lock === false || music.offset != null || (dance && music.lock !== true)) return { ...music, bpm: F.bpm };
  const anchors = storyAnchors(sb, music);
  const [lo, hi] = music.bpm ? [music.bpm, music.bpm] : F.S.bpm, bpms = [];
  for (let b = lo; b <= hi + 1e-9; b += 0.25) bpms.push(Math.round(b * 100) / 100);
  // nearest the seeded tempo first, so a tie keeps the clip's own tempo
  bpms.sort((a, b) => Math.abs(a - F.bpm) - Math.abs(b - F.bpm));
  const step = 0.002, best = solve(anchors, bpms, (bar) => Array.from({ length: Math.ceil(bar / step) }, (_, i) => i * step));
  const spb = 60 / best.bpm, out = { ...music, bpm: best.bpm, offset: Math.round(best.off * 1000) / 1000 };
  const pay = payoffOf(sb);
  if (!music.parts && pay != null && pay >= 2) {
    // one beat of silence, then the drop, on the bar line nearest the payoff
    const bar = 4 * spb, on = out.offset + Math.round((pay - out.offset) / bar) * bar, r3 = (x) => Math.round(x * 1000) / 1000;
    out.parts = [{ at: 0, part: "main" }, { at: r3(on - spb), part: "stop" }, { at: r3(on), part: "drop" }];
  }
  out.lock = report(anchors, best.bpm, out.offset);
  return out;
}

// how close each anchor came: ms off its grid line (for the render log and qa/sound.mjs)
function report(anchors, bpm, off) {
  const spb = 60 / bpm;
  const miss = anchors.map((a) => { const g = a.bar ? 4 * spb : spb, u = (((a.t - off) % g) + g) % g; return { what: a.what, t: a.t, bar: a.bar, ms: Math.round(Math.min(u, g - u) * 1000) }; });
  return { bpm, offset: off, miss };
}

// a recorded music bed (assets/music/..., e.g. the AI beds in assets/music/ai): looped to fill the clip from `from`
// (default 0), starting `skip` seconds into the file, and cut at `until` (default the end) with a 40 ms fade, so
// "the music stops" lands on its frame
export function fileMusic(music, dur, sr) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", path.join(ROOT, "assets/music", music.file), "-ac", "2", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  if (r.status !== 0) throw new Error(`music: can't decode ${music.file}: ${r.stderr}`);
  const x = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length)), m = x.length / 2;
  const n = Math.round(dur * sr), L = new Float32Array(n), R = new Float32Array(n);
  const a = Math.round((music.from ?? 0) * sr), b = Math.min(n, Math.round((music.until ?? dur) * sr)), fade = Math.round(0.04 * sr), sk = Math.round((music.skip ?? 0) * sr);
  for (let i = a; i < b; i++) { const k = (i - a + sk) % m, f = Math.min(1, (b - i) / fade, (i - a + 1) / 220); L[i] = x[2 * k] * f; R[i] = x[2 * k + 1] * f; }
  return { L, R };
}

// the bed's gain over time (1 = as set): it gives way under the big hits and the voices, and drops before the payoff,
// so every hit is heard over the music and the payoff lands after a real dip (qa/sound.mjs measures both). Overlapping
// dips take the deepest, never a sum; every ramp is 10 ms or longer, so nothing clicks.
//   "music": { "duck": false }   no ducking          "duck": { "db": -6, "voice": -4, "hold": 0.12, "release": 0.25 }
//   "music": { "dip": false }    no dip              "dip": { "db": -12, "len": 0.6 }
// small handling sounds the bed needn't move for; every other effect ducks it at its loudest moment
const SMALL = /^(?:[\w-]+\/)?(step|grab|sit|hop|land|tink|pop|key|wing|swap|cloth|crinkle|rustle|whoosh|gasp|breath|ai-package\/flat-exhale)/;
// RMS of x (mono samples, or a { L, R } bed) over [t, t + len) seconds
function rms(x, t, len, sr = 44100) {
  const a = Math.max(0, Math.round(t * sr)), b = Math.round((t + len) * sr), st = x.L ? null : x; let s = 0, n = 0;
  for (let i = a; i < b && i < (st ? st.length : x.L.length); i++) { const v = st ? st[i] : (x.L[i] + x.R[i]) / 2; s += v * v; n++; }
  return n ? Math.sqrt(s / n) : 0;
}
const DUCK = { db: -6, voice: -4, attack: 0.015, hold: 0.12, release: 0.25 }, DIP = { db: -12, len: 0.6, down: 0.06, up: 0.02 };
export function duckEnvelope(sb, music, audio, log = [], bed = null) {
  const sr = audio.sr, n = audio.L.length, env = new Float32Array(n).fill(1);
  const lin = (d) => Math.pow(10, d / 20), at = (t) => Math.max(0, Math.min(n, Math.round(t * sr)));
  // one dip: down over [t0, t1], held to t2, back up by t3 (cosine ramps); keeps the lowest gain where dips meet
  const dip = (t0, t1, t2, t3, k) => {
    for (let i = at(t0); i < at(t3); i++) {
      const t = i / sr, u = t < t1 ? (t - t0) / Math.max(1e-6, t1 - t0) : t <= t2 ? 1 : 1 - (t - t2) / Math.max(1e-6, t3 - t2);
      const v = 1 - (1 - k) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u))));
      if (v < env[i]) env[i] = v;
    }
  };
  const D = music.duck === false ? null : { ...DUCK, ...(typeof music.duck === "object" ? music.duck : {}) };
  let hits = 0, lines = 0;
  if (D) for (const e of audio.events || []) {
    if ((e.kind === "voice" || e.kind === "speech") && D.voice) {
      const len = e.action?.dur ?? e.dur ?? 0.6;
      dip(e.at - 0.05, e.at, e.at + len, e.at + len + D.release, lin(D.voice)); lines++;
    } else if (e.start != null && !SMALL.test(e.kind)) {
      // a hit was placed by its loudest moment (e.hit); anything else starts at e.start, so find its loudest moment
      const top = e.hit > e.start + 1e-4 || isHit(e.kind) ? e.hit : e.start + (e.samples?.length ? hitTime(e.samples) : 0);
      // only a hit at least as loud as the bed under it: a quiet one would sink with the bed (the dip takes the jump
      // it is heard by), so it is left as it is (qa/sound.mjs flags it if it is buried)
      if (bed && e.samples?.length && rms(e.samples, top - e.start, D.hold) * (e.gain ?? 1) < rms(bed, top, D.hold, sr)) continue;
      dip(top - D.attack, top, top + D.hold, top + D.hold + D.release, lin(D.db)); hits++;
    }
  }
  const P = music.dip === false ? null : { ...DIP, ...(typeof music.dip === "object" ? music.dip : {}) }, pay = payoffOf(sb);
  // a generated bed with the lock's one-beat stop before the payoff is silent there already, and a bed that stops
  // before the payoff has nothing to dip
  const stopped = (music.parts || []).some((p) => p.part === "stop" && p.at <= pay && p.at >= pay - P?.len - 0.2) || (music.until != null && music.until <= pay);
  if (P && pay != null && pay >= P.len + 0.5 && !stopped) {
    dip(pay - P.len - P.down, pay - P.len, pay - P.up, pay, lin(P.db));
    log.push(`music dips ${P.db} dB for ${P.len} s before the payoff at ${pay}s`);
  }
  if (hits || lines) log.push(`music ducks under ${hits} hit${hits === 1 ? "" : "s"} (${D.db} dB) and ${lines} voice line${lines === 1 ? "" : "s"} (${D.voice} dB)`);
  return env;
}

// background music into the mix: on by default, a different variation per clip (seeded by puppet/beat.mjs seedOf);
// "music": false turns it off, a music block pins tempo, style, key and parts. sb.music is the locked block.
export function addMusic(sb, audio) {
  if (sb.music === false) return [];
  const music = { gain: 0.45, ...(sb.music || {}) }, dur = sb.duration, log = [];
  const M = music.file ? fileMusic(music, dur, audio.sr) : renderBeat(music, dur, seedOf(sb)), g = music.gain; let pk = 0;
  log.push(music.file ? `music: ${music.file}${music.until != null ? `, stops at ${music.until}s` : ""}` : `music: ${M.flavour.style}, ${M.flavour.bpm} bpm, key ${M.flavour.key >= 0 ? "+" : ""}${M.flavour.key}`);
  if (music.lock?.miss) {
    const m = music.lock.miss, key = m.find((x) => x.what === "payoff" || x.what === "music stops");
    log.push(`music locked to the story: grid from ${music.lock.offset.toFixed(3)}s${music.skip != null ? ` (${music.skip}s into the file)` : ""}${music.parts ? `, parts ${music.parts.map((p) => `${p.part}@${p.at}`).join(" ")}` : ""}; ${key ? `${key.what} at ${key.t}s ${key.ms} ms off beat 1, ` : ""}${m.filter((x) => x.ms <= 33).length}/${m.length} story moments within a frame of a beat`);
  }
  const env = duckEnvelope(sb, music, audio, log, { L: M.L.map((v) => v * g), R: M.R.map((v) => v * g) });
  for (let i = 0; i < audio.L.length; i++) { const k = g * env[i]; audio.L[i] += M.L[i] * k; audio.R[i] += M.R[i] * k; pk = Math.max(pk, Math.abs(audio.L[i]), Math.abs(audio.R[i])); }
  if (pk > 0.89) for (let i = 0; i < audio.L.length; i++) { audio.L[i] *= 0.89 / pk; audio.R[i] *= 0.89 / pk; }
  return log;
}
