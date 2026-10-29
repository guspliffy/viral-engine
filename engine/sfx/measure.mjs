// What a sound is, measured: Claude can't hear, so a sound's description in assets/sfx/whitelist.json is written from
// these numbers (and the file it came from), never from its name alone. The library's "kenney/slime" is a sci-fi
// blip, not goo: its name said slime, the numbers say a tone gliding down.
//   node engine/sfx/measure.mjs                 every sound a storyboard can name
//   node engine/sfx/measure.mjs kenney/slime splort --takes 3
//   node engine/sfx/measure.mjs --json out/sfx-measure.json
// Per take: length (to -40 dB), when it peaks, how many separate hits, how much of it is a tone (the share of loud
// frames whose strongest peak holds a fifth of their energy; noise bands, rubs and hisses don't), brightness (spectral centroid), the share of energy under 200 Hz (a thud), and for tonal
// sounds the main pitch at the start, middle and end (so: gliding up, down, a run of notes, or one steady note).
import fs from "node:fs";
import { SR } from "./dsp.mjs";
import { soundSamples, CODE_SOUNDS } from "../audio.mjs";
import { SIGNATURES } from "./signature.mjs";
import { DIR } from "./library.mjs";

const N = 2048, HOP = 512;

function fft(re, im) { // in place, radix 2
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

const median = (a) => { if (!a.length) return null; const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

export function measure(x) {
  let peak = 0, at = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > peak) { peak = Math.abs(x[i]); at = i; }
  if (!peak) return { len: 0 };
  // 10 ms loudness envelope: length, and separate hits (a rise of 6 dB+ from a dip, 40 ms or more after the last)
  const w = 441, e = [];
  for (let i = 0; i + w <= x.length; i += w) { let s = 0; for (let k = i; k < i + w; k++) s += x[k] * x[k]; e.push(10 * Math.log10(s / w + 1e-12)); }
  const top = Math.max(...e);
  let last = 0; e.forEach((v, i) => { if (v > top - 40) last = i; });
  let hits = 0, low = Infinity, prev = -40;
  e.forEach((v, i) => { low = Math.min(low, v); if (v > top - 20 && v - low >= 6 && i - prev >= 4) { hits++; prev = i; low = v; } if (v < low) low = v; });
  // spectra of frames that are within 30 dB of the loudest
  const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const cent = [], pitch = [];
  let lowE = 0, allE = 0;
  for (let a = 0; a + N <= Math.max(x.length, N); a += HOP) {
    const re = new Float64Array(N), im = new Float64Array(N);
    let s = 0; for (let i = 0; i < N; i++) { const v = x[a + i] ?? 0; re[i] = v * win[i]; s += v * v; }
    if (10 * Math.log10(s / N + 1e-12) < top - 30) continue;
    fft(re, im);
    const p = new Float64Array(N / 2);
    let sum = 0, c = 0, best = 0, bi = 0;
    for (let k = 1; k < N / 2; k++) {
      p[k] = re[k] * re[k] + im[k] * im[k];
      const f = (k * SR) / N; sum += p[k]; c += f * p[k];
      if (f < 200) lowE += p[k];
      if (f > 60 && f < 8000 && p[k] > best) { best = p[k]; bi = k; }
    }
    allE += sum;
    cent.push(c / sum);
    // the strongest peak, interpolated; kept only where it holds a fifth of the frame's energy within 2 bins (a tone,
    // not a band of noise)
    let near = 0; for (let k = Math.max(1, bi - 2); k <= Math.min(N / 2 - 1, bi + 2); k++) near += p[k];
    if (bi > 1 && near / sum > 0.2) { const l = Math.log(p[bi - 1] + 1e-20), m = Math.log(p[bi]), r = Math.log(p[bi + 1] + 1e-20), d = (l - r) / (2 * (l - 2 * m + r)); pitch.push((((bi + d) * SR) / N)); } else pitch.push(null);
  }
  const tones = pitch.filter((v) => v != null), part = (u, v) => median(pitch.slice(Math.floor(pitch.length * u), Math.max(Math.floor(pitch.length * u) + 1, Math.ceil(pitch.length * v))).filter((q) => q != null));
  return {
    len: r2(((last + 1) * w) / SR), peakAt: r2(at / SR), hits,
    centroid: Math.round(median(cent) ?? 0), lowShare: r2(lowE / (allE || 1)),
    tonal: r2(tones.length / (pitch.length || 1)),
    pitch: tones.length >= 2 ? [part(0, 0.2), part(0.4, 0.6), part(0.8, 1)].map((v) => (v == null ? null : Math.round(v))) : null,
  };
}

// a few words from the numbers, as a starting point (the description is still written by hand)
export function gist(m) {
  if (!m.len) return "silent";
  const out = [];
  out.push(m.len < 0.15 ? "a tick" : m.len < 0.4 ? "short" : m.len < 1.2 ? "medium" : `long (${m.len} s)`);
  out.push(m.tonal > 0.6 ? "tonal" : m.tonal > 0.25 ? "part tone, part noise" : "noisy");
  if (m.lowShare > 0.4) out.push("low thud");
  out.push(m.centroid < 900 ? "dark" : m.centroid < 3000 ? "mid" : "bright");
  if (m.hits > 1) out.push(`${m.hits} hits`);
  if (m.pitch && m.tonal > 0.25) {
    const [a, b, c] = m.pitch;
    if (a && c) out.push(c > a * 1.12 ? `glides up ${a}->${c} Hz` : c < a / 1.12 ? `glides down ${a}->${c} Hz` : b && Math.abs(b - a) > a * 0.12 ? `wobbles around ${a} Hz` : `steady ~${a} Hz`);
  }
  return out.join(", ");
}

export function allSounds() {
  const cat = JSON.parse(fs.readFileSync(`${DIR}/catalog.json`, "utf8")).sounds;
  return [...CODE_SOUNDS, ...SIGNATURES, ...Object.keys(cat)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
  const json = opt("--json"), takes = Number(opt("--takes", 1));
  const ids = args.length ? args : allSounds(), out = {};
  for (const id of ids) {
    const ms = [];
    for (let s = 1; s <= takes; s++) ms.push(measure(soundSamples(id, s * 7919)));
    out[id] = ms;
    for (const m of ms) console.log(`${id.padEnd(28)} ${gist(m).padEnd(70)} ${JSON.stringify(m)}`);
  }
  if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
}
