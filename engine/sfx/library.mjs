// The sound library: recorded sounds from assets/sfx/catalog.json (built by assets/sfx/make-catalog.mjs), for a
// storyboard's `sfx` entries ({ "sound": "katana-slice", "at": 3.2 }) and the automatic foley in audio.mjs (footsteps,
// grabs, sitting down). A catalog sound is one of:
//   { files, gain }            several takes of one sound; a seeded take is picked each time it plays
//   { layers: [[id, at, g]] }  sounds stacked at offsets (whoosh + cut + ring); ids may name the code effects too
//   { pattern: { pool, rate, jitter } }  a burst as long as the event's dur, e.g. typing from single key presses
// Every take is decoded once (ffmpeg, 44.1 kHz mono), its leading silence trimmed and peak-normalised, so a sound's
// loudness is set by its catalog gain alone. Each take also knows its hit: the moment it is loudest (hitTime). A hit
// sound (HIT: footsteps, knocks, slams, put-downs...) is placed so that moment lands on the event's frame, not its
// first sample: a door-close file swings for half a second before it shuts, a pot rattles before the bonk. Layers
// line up the same way, by their hits. Deterministic: takes, timings and variations all come from the clip's
// seeded random numbers.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SR = 44100;
export const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/sfx");
let CAT = null;
const catalog = () => (CAT ??= JSON.parse(fs.readFileSync(path.join(DIR, "catalog.json"), "utf8")));
export const isLibrarySound = (id) => !!catalog().sounds[id];

// sounds whose loudest moment is the contact (a foot, a hand, a door, a blade meeting something), library ids and
// code effects alike; a catalog entry's "anchor": "onset" or "hit" overrides. Everything else (whooshes, risers,
// jingles, UI tones, a katana-slice that starts on the swing) still starts on its frame.
const HIT = /^(step|kenney\/(footstep|impact)|put-down|grab|sit|blade-cut|chop|punch|thud|hit-|bell$|pan-bonk|knock|door-close|door-slam|slam|latch|coins|book-close|key$|mouse-click|land|impact|gunshot|tink|ting|papercut|puncture|splash)/;
export const isHit = (id) => { const a = catalog().sounds[id]?.anchor; return a ? a === "hit" : HIT.test(id); };

// the hit of a sound: on a 5 ms loudness envelope, the first point within 3 dB of the loudest, then the top of that
// bump. The first of several near-equal knocks counts, not the loudest of them.
export function hitTime(x) {
  const w = 220, hop = 44, e = [];
  for (let i = 0; i + w <= x.length; i += hop) { let s = 0; for (let k = i; k < i + w; k++) s += x[k] * x[k]; e.push(s); }
  if (!e.length) return 0;
  let m = 0; for (const v of e) m = Math.max(m, v);
  let j = e.findIndex((v) => v >= m * 0.5);   // energy, so 0.5 = -3 dB
  while (j + 1 < e.length && e[j + 1] >= e[j]) j++;
  return (j * hop + w / 2) / SR;
}
const withHit = (x, hit) => Object.assign(x, { hit });

const decoded = new Map();
function decode(file) {
  if (decoded.has(file)) return decoded.get(file);
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", path.join(DIR, file), "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`sfx: can't decode ${file}: ${r.stderr}`);
  let x = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) {
    // start 3 ms before the sound gets above -34 dB of its peak: files often begin with a little silence, and a
    // footstep or a cut that lands 30 ms late reads as out of sync
    let i = 0;
    while (i < x.length && Math.abs(x[i]) < peak * 0.02) i++;
    x = x.slice(Math.max(0, i - Math.round(0.003 * SR)));
    for (let k = 0; k < x.length; k++) x[k] /= peak;
  }
  withHit(x, hitTime(x));
  decoded.set(file, x);
  return x;
}

function mixInto(out, x, at, g) {
  const a = Math.round(at * SR);
  for (let i = 0; i < x.length && a + i < out.length; i++) if (a + i >= 0) out[a + i] += x[i] * g;
}

// id -> mono samples at their catalog loudness, with .hit (seconds from the first sample to the hit). code(kind, r,
// dur) renders the engine's own effects (whoosh, tink...) for layers that use them; their gain in a layer is
// absolute, like an event's gain.
export function librarySound(id, r, { dur, code } = {}) {
  const s = catalog().sounds[id];
  if (!s) {
    if (code) { const x = code(id, r, dur); return withHit(x, x.hit ?? (isHit(id) ? hitTime(x) : 0)); }
    throw new Error(`sfx: unknown sound "${id}"`);
  }
  if (s.files) {
    const x = decode(s.files[Math.floor(r() * s.files.length)]), g = s.gain ?? 0.35, out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
    return withHit(out, x.hit);
  }
  if (s.layers) {
    // a hit layer's offset places its hit (door-slam: the door shutting on the thud, not half a second after it);
    // the sound's own hit is that of its first layer at offset 0
    const parts = s.layers.map(([lid, at = 0, g = 1]) => { const x = librarySound(lid, r, { dur, code }); return { x, at, g, start: at - (isHit(lid) ? x.hit : 0) }; });
    const lead = Math.min(0, ...parts.map((p) => p.start)), first = parts.find((p) => p.at === 0) ?? parts[0];
    const out = new Float32Array(Math.max(...parts.map((p) => Math.round((p.start - lead) * SR) + p.x.length)));
    for (const p of parts) mixInto(out, p.x, p.start - lead, p.g);
    return withHit(out, first.start - lead + first.x.hit);
  }
  if (s.pattern) {
    // presses at `rate` per second, each gap stretched or squeezed by up to `jitter`, each a little softer or louder
    const { pool, rate = 10, jitter = 0.4 } = s.pattern, len = dur ?? 1, hits = [];
    for (let t = 0; t < len; t += (1 / rate) * (1 + (r() * 2 - 1) * jitter)) hits.push([librarySound(pool, r, { code }), t, 0.7 + 0.3 * r()]);
    const out = new Float32Array(Math.max(...hits.map(([x, at]) => Math.round(at * SR) + x.length)));
    for (const [x, at, g] of hits) mixInto(out, x, at, g);
    return withHit(out, hits[0][0].hit);
  }
  throw new Error(`sfx: sound "${id}" has no files, layers or pattern`);
}

// what the floor sounds like for a set: sound.surface overrides it
// the floor of each set (from its set-*.js); a set not listed here is outdoors (grass, or concrete for a street)
export const SURFACES = { kitchen: "wood", party: "wood", porch: "wood", cottage: "wood", office: "carpet", rooftop: "concrete", meadow: "grass",
  apartment: "wood", bedroom: "wood", livingroom: "wood", restaurant: "wood", haunted: "wood",
  bathroom: "indoor", classroom: "indoor", elevator: "indoor", gym: "indoor", storefront: "concrete" };
// { sound, how }: how is "storyboard" (sound.surface), "set" (SURFACES) or "guess" (the outdoor fallback)
export function floorOf(sb) {
  const type = sb.set?.type || "", how = sb.sound?.surface ? "storyboard" : SURFACES[type] ? "set" : "guess";
  const s = sb.sound?.surface ?? SURFACES[type] ?? (/street|road|city|stop|roof|station/.test(type) ? "concrete" : "grass");
  return { sound: isLibrarySound(`step-${s}`) ? `step-${s}` : "step-indoor", how, surface: s };
}
export const surfaceOf = (sb) => floorOf(sb).sound;
