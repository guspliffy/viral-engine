// The sound library: recorded sounds from assets/sfx/catalog.json (built by assets/sfx/make-catalog.mjs), for a
// storyboard's `sfx` entries ({ "sound": "katana-slice", "at": 3.2 }) and the automatic foley in audio.mjs (footsteps,
// grabs, sitting down). A catalog sound is one of:
//   { files, gain }            several takes of one sound; a seeded take is picked each time it plays
//   { layers: [[id, at, g]] }  sounds stacked at offsets (whoosh + cut + ring); ids may name the code effects too
//   { pattern: { pool, rate, jitter } }  a burst as long as the event's dur, e.g. typing from single key presses
// Every take is decoded once (ffmpeg, 44.1 kHz mono), its leading silence trimmed so the sound starts on its frame,
// and peak-normalised, so a sound's loudness is set by its catalog gain alone. Deterministic: takes, timings and
// variations all come from the clip's seeded random numbers.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SR = 44100;
export const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/sfx");
let CAT = null;
const catalog = () => (CAT ??= JSON.parse(fs.readFileSync(path.join(DIR, "catalog.json"), "utf8")));
export const isLibrarySound = (id) => !!catalog().sounds[id];
export const librarySounds = () => Object.keys(catalog().sounds);

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
  decoded.set(file, x);
  return x;
}

function mixInto(out, x, at, g) {
  const a = Math.round(at * SR);
  for (let i = 0; i < x.length && a + i < out.length; i++) if (a + i >= 0) out[a + i] += x[i] * g;
}

// id -> mono samples at their catalog loudness. code(kind, r, dur) renders the engine's own effects (whoosh, tink...)
// for layers that use them; their gain in a layer is absolute, like an event's gain.
export function librarySound(id, r, { dur, code } = {}) {
  const s = catalog().sounds[id];
  if (!s) {
    if (code) return code(id, r, dur);
    throw new Error(`sfx: unknown sound "${id}"`);
  }
  if (s.files) {
    const x = decode(s.files[Math.floor(r() * s.files.length)]), g = s.gain ?? 0.35, out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
    return out;
  }
  if (s.layers) {
    const parts = s.layers.map(([lid, at = 0, g = 1]) => [librarySound(lid, r, { dur, code }), at, g]);
    const out = new Float32Array(Math.max(...parts.map(([x, at]) => Math.round(at * SR) + x.length)));
    for (const [x, at, g] of parts) mixInto(out, x, at, g);
    return out;
  }
  if (s.pattern) {
    // presses at `rate` per second, each gap stretched or squeezed by up to `jitter`, each a little softer or louder
    const { pool, rate = 10, jitter = 0.4 } = s.pattern, len = dur ?? 1, hits = [];
    for (let t = 0; t < len; t += (1 / rate) * (1 + (r() * 2 - 1) * jitter)) hits.push([librarySound(pool, r, { code }), t, 0.7 + 0.3 * r()]);
    const out = new Float32Array(Math.max(...hits.map(([x, at]) => Math.round(at * SR) + x.length)));
    for (const [x, at, g] of hits) mixInto(out, x, at, g);
    return out;
  }
  throw new Error(`sfx: sound "${id}" has no files, layers or pattern`);
}

// what the floor sounds like for a set: sound.surface overrides it
const SURFACES = { kitchen: "wood", party: "wood", porch: "wood", cottage: "wood", office: "carpet", rooftop: "concrete", meadow: "grass" };
export function surfaceOf(sb) {
  const s = sb.sound?.surface ?? SURFACES[sb.set?.type] ?? (/street|road|city|stop|roof|station/.test(sb.set?.type || "") ? "concrete" : "grass");
  return isLibrarySound(`step-${s}`) ? `step-${s}` : "step-indoor";
}
