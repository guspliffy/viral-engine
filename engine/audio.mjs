// Sound for a storyboard, synthesised in code: gibberish voices for every `talk` action and sound effects placed
// automatically from the storyboard's events (hops, poofs, flashes, charges, ...), plus any explicit `sfx` entries.
// Deterministic like the picture: the same storyboard always gives the same audio.
//
// Claude cannot listen to the result. Everything here is checked by measurement (levels, timing, spectrum), so
// whether it *sounds* right is for a human to judge.
import fs from "node:fs";
import { planSyllables, VOWELS, voiceKey, hash } from "./shared/syllables.js";
import { rng } from "./page/util.js";
import { seedOf } from "../puppet/beat.mjs";

const SR = 44100;
const TAU = Math.PI * 2;

// ---------- small DSP helpers ----------
class Bus {
  constructor(seconds) { this.n = Math.ceil(seconds * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  // add a mono signal at time t0 with equal-power pan (-1 left .. 1 right)
  add(t0, mono, gain = 1, pan = 0) {
    const a = Math.round(t0 * SR), p = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
    const gl = Math.cos(p) * gain, gr = Math.sin(p) * gain;
    for (let i = 0; i < mono.length; i++) { const k = a + i; if (k < 0 || k >= this.n) continue; this.L[k] += mono[i] * gl; this.R[k] += mono[i] * gr; }
  }
}
function biquad(type, f, q) {
  const w = TAU * f / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
  let b0, b1, b2, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = al; b1 = 0; b2 = -al; } // band-pass, constant peak gain
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
function run(fl, x) { const y = fl.b0 * x + fl.b1 * fl.x1 + fl.b2 * fl.x2 - fl.a1 * fl.y1 - fl.a2 * fl.y2; fl.x2 = fl.x1; fl.x1 = x; fl.y2 = fl.y1; fl.y1 = y; return y; }
const env = (t, a, d, total) => (t < 0 || t > total ? 0 : t < a ? t / a : Math.exp(-(t - a) / d));
const buf = (sec) => new Float32Array(Math.max(1, Math.ceil(sec * SR)));
function normalise(x, peak) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; }

// ---------- voice ----------
const CONS = { // duration (s), noise band (Hz), Q, voiced?
  b: [0.025, 700, 1.2, true], d: [0.025, 3000, 1.5, true], g: [0.03, 1800, 1.5, true],
  p: [0.03, 900, 1.0, false], t: [0.035, 4200, 1.6, false], k: [0.035, 2500, 1.4, false],
  s: [0.075, 6500, 2.0, false], h: [0.05, 1600, 0.7, false],
  m: [0.055, 0, 0, true], n: [0.05, 0, 0, true], l: [0.04, 0, 0, true], w: [0.045, 0, 0, true],
};

function syllable(s, v, r) {
  const C = CONS[s.cons], cd = C ? C[0] : 0;
  const total = s.dur + 0.06, x = buf(total);
  const shift = v.formant ?? 1, F = VOWELS[s.vowel].F.map((f) => f * shift), B = [80, 110, 160].map((b) => b * shift), G = [1, 0.55, 0.28];
  // consonant noise
  if (C && C[1] > 0) {
    const bp = biquad("bp", C[1], C[2]);
    for (let i = 0; i < cd * SR; i++) { const t = i / SR; x[i] += run(bp, r() * 2 - 1) * env(t, 0.003, cd * 0.35, cd) * (C[3] ? 0.35 : 0.6); }
  }
  // vowel (and the voiced part of m, n, l, w): additive harmonics shaped by the vowel's formants
  const v0 = C ? cd * (C[1] > 0 ? 0.7 : 0.2) : 0, vd = s.dur - v0;
  const nH = Math.floor(5200 / (s.f0 * 1.3)), ph = new Float64Array(nH + 1), amps = new Float64Array(nH + 1);
  const nasal = s.cons === "m" || s.cons === "n", glide = s.cons === "l" || s.cons === "w";
  const jit = rng(Math.floor(s.f0 * 1000 + (s.jt ?? s.t0) * 1e4)); // jt: time within the line for keyed lines
  const breath = biquad("bp", F[1], 1.2);
  let f0 = s.f0;
  for (let i = 0; i < vd * SR + 0.05 * SR; i++) {
    const t = i / SR, k = Math.min(1, t / vd);
    if (i % 64 === 0) {
      f0 = s.f0 * Math.pow(2, (s.fall * k) / 12) * (1 + (v.vibrato ?? 0.015) * Math.sin(TAU * 5.5 * t)) * (1 + (jit() - 0.5) * 0.008);
      // formants: nasals start closed and dull, glides start with a low second formant
      const lead = Math.min(1, t / 0.05);
      const Fn = F.map((f, j) => (nasal && t < 0.05 ? [260, 1100, 2400][j] * (1 - lead) + f * lead : glide && j === 1 ? f * (0.6 + 0.4 * lead) : f));
      for (let n = 1; n <= nH; n++) {
        const fh = n * f0; let a = 0;
        for (let j = 0; j < 3; j++) { const d = (fh - Fn[j]) / (B[j] / 2); a += G[j] / (1 + d * d); }
        amps[n] = (a + 0.015) / Math.pow(n, 0.7);
      }
    }
    let y = 0;
    for (let n = 1; n <= nH; n++) { ph[n] += TAU * n * f0 / SR; y += amps[n] * Math.sin(ph[n]); }
    const e = t < 0.018 ? t / 0.018 : t > vd ? Math.max(0, 1 - (t - vd) / 0.05) : 1 - 0.25 * k;
    y += run(breath, r() * 2 - 1) * (v.breath ?? 0.08) * 2;
    const at = Math.round(v0 * SR) + i;
    if (at < x.length) x[at] += y * e * 0.12;
  }
  return normalise(x, s.amp);
}

function voice(bus, a, v, pan, gain) {
  const r = rng(a.line != null || a.seed != null ? hash(voiceKey(a)) + (v.seed ?? 1) : Math.floor(a.at * 1e4) + (v.seed ?? 1));
  for (const s of planSyllables(a, v)) bus.add(s.t0, syllable(s, v, r), gain, pan);
}

// ---------- sound effects ----------
const SFX = {
  hop(r) { const d = 0.13, x = buf(d); let p = 0; for (let i = 0; i < x.length; i++) { const t = i / SR, f = 280 * Math.pow(620 / 280, t / d); p += TAU * f / SR; x[i] = (Math.sin(p) + 0.25 * Math.sin(2 * p)) * env(t, 0.004, 0.05, d); } return x; },
  land(r) { const d = 0.12, x = buf(d), lp = biquad("lp", 900, 0.7); let p = 0; for (let i = 0; i < x.length; i++) { const t = i / SR, f = 140 * Math.pow(55 / 140, t / d); p += TAU * f / SR; x[i] = Math.sin(p) * env(t, 0.002, 0.04, d) + run(lp, r() * 2 - 1) * env(t, 0.001, 0.008, d) * 0.6; } return x; },
  whoosh(r, d = 0.32) { const x = buf(d); const bp = biquad("bp", 600, 1.4); for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, f = 400 + 2200 * Math.sin(k * Math.PI); if (i % 32 === 0) Object.assign(bp, { ...biquad("bp", f, 1.4), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 }); x[i] = run(bp, r() * 2 - 1) * Math.sin(k * Math.PI) ** 2; } return x; },
  charge(r, d = 1.3) {
    const x = buf(d + 0.2); const ph = [0, 0, 0];
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = Math.min(1, t / d), f = 300 * Math.pow(5, k * k), amp = 0.15 + 0.85 * k * k, tail = t > d ? Math.exp(-(t - d) / 0.04) : 1;
      let y = 0; [1, 1.006, 0.497].forEach((m, j) => { ph[j] += TAU * f * m / SR; y += Math.sin(ph[j]) * (j === 2 ? 0.6 : 0.4); });
      y += Math.sin(TAU * (2400 + 2400 * k) * t) * 0.25 * (0.5 + 0.5 * Math.sin(TAU * 18 * t));
      x[i] = y * amp * tail;
    }
    // sparkles get denser as the charge builds
    const n = Math.floor(10 + d * 18);
    for (let s = 0; s < n; s++) {
      const t0 = Math.sqrt(r()) * d, f = 3000 + r() * 3500, a = Math.round(t0 * SR);
      for (let i = 0; i < 0.06 * SR && a + i < x.length; i++) x[a + i] += Math.sin(TAU * f * i / SR) * Math.exp(-i / SR / 0.015) * 0.35;
    }
    return x;
  },
  impact(r) {
    const d = 1.0, x = buf(d), lp = biquad("lp", 2000, 0.7); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 75 * Math.pow(38 / 75, Math.min(1, t / 0.5)); p += TAU * f / SR;
      let y = Math.sin(p) * env(t, 0.003, 0.25, d) * 1.2 + run(lp, r() * 2 - 1) * env(t, 0.001, 0.08, d) * 0.8;
      for (const [hf, ha] of [[3100, 0.12], [4700, 0.1], [6200, 0.08], [8100, 0.06]]) y += Math.sin(TAU * hf * t) * ha * env(t, 0.002, 0.16, d);
      x[i] = y;
    }
    return x;
  },
  poof(r) {
    const d = 0.9, x = buf(d); let lp = biquad("lp", 3000, 0.8), p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      if (i % 64 === 0) { const c = 3000 * Math.pow(350 / 3000, Math.min(1, t / 0.6)); lp = { ...biquad("lp", c, 0.8), x1: lp.x1, x2: lp.x2, y1: lp.y1, y2: lp.y2 }; }
      const f = 800 * Math.pow(180 / 800, Math.min(1, t / 0.08)); p += TAU * f / SR;
      x[i] = run(lp, r() * 2 - 1) * env(t, 0.008, 0.22, d) + Math.sin(p) * env(t, 0.002, 0.03, d) * 0.5;
    }
    return x;
  },
  pop(r) {
    const d = 0.9, x = buf(d); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 500 * Math.pow(1400 / 500, Math.min(1, t / 0.05)); p += TAU * f / SR;
      let y = Math.sin(p) * env(t, 0.002, 0.025, 0.12);
      for (const [hf, ha, dd] of [[1320, 0.35, 0.35], [3300, 0.12, 0.18], [4100, 0.08, 0.12]]) y += Math.sin(TAU * hf * (t - 0.04)) * ha * env(t - 0.04, 0.002, dd, d);
      x[i] = y;
    }
    return x;
  },
  // a camera shutter or a light switch: two short clicks
  click(r) {
    const d = 0.12, x = buf(d), hp = biquad("hp", 1800, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(hp, r() * 2 - 1) * (env(t, 0.0005, 0.004, d) + 0.7 * env(t - 0.055, 0.0005, 0.006, d)) + Math.sin(TAU * 1400 * t) * 0.3 * env(t, 0.0005, 0.01, d); }
    return x;
  },
  // a lid straining on its thread: a slow, rough squeak that wobbles in pitch
  creak(r, d = 0.5) {
    const x = buf(d), bp = biquad("bp", 900, 6); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 520 + 140 * Math.sin(TAU * 3.2 * t) + 60 * Math.sin(TAU * 7.7 * t); p += TAU * f / SR;
      const grit = 0.5 + 0.5 * Math.sin(TAU * 38 * t) ** 2, y = ((p / TAU) % 1) * 2 - 1;
      x[i] = run(bp, y * grit + (r() * 2 - 1) * 0.15) * Math.min(1, t / 0.04, (d - t) / 0.08) * 1.6;
    }
    return x;
  },
  // a blade drawn along a whetstone or swept through the air: a bright metallic ring rising in pitch
  shing(r) {
    const d = 0.6, x = buf(d), hp = biquad("hp", 2500, 0.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = Math.min(1, t / 0.12);
      let y = run(hp, r() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / 0.14)) * 0.5 * (t < 0.14 ? 1 : 0);
      for (const [f, a] of [[3200, 0.35], [4870, 0.22], [7150, 0.12]]) y += Math.sin(TAU * f * (1 + 0.08 * k) * t) * a * env(t - 0.08, 0.004, 0.16, d);
      x[i] = y;
    }
    return x;
  },
  tink(r) { const d = 0.35, x = buf(d); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 2100 * t) * 0.6 + Math.sin(TAU * 5300 * t) * 0.25) * env(t, 0.001, 0.07, d); } return x; },
  sting(r) {
    const d = 0.7, x = buf(d), lp = biquad("lp", 1600, 0.8);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let y = 0;
      for (const f of [110, 130.8, 164.8, 220]) y += ((t * f) % 1) * 2 - 1; // minor chord of saw waves: "dun!"
      x[i] = run(lp, y * 0.25) * env(t, 0.005, 0.22, d) + (r() * 2 - 1) * env(t, 0.001, 0.02, d) * 0.3;
    }
    return x;
  },
  horn(r, d = 0.45) { // a bus horn: two detuned square tones, a little muffled ("baap")
    const x = buf(d), lp = biquad("lp", 1400, 0.9);
    for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; for (const f of [311, 392]) y += (t * f) % 1 < 0.5 ? 1 : -1; x[i] = run(lp, y * 0.35) * env(t, 0.01, 0.4, d) * Math.min(1, (d - t) / 0.04); }
    return x;
  },
  screech(r, d = 0.5) { // brakes: a narrow band of noise sliding down
    const x = buf(d); let bp = biquad("bp", 3200, 9);
    for (let i = 0; i < x.length; i++) { const t = i / SR; if (i % 64 === 0) bp = { ...biquad("bp", 3200 - 900 * (t / d), 9), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 }; x[i] = run(bp, r() * 2 - 1) * 3 * env(t, 0.02, 0.3, d) * Math.min(1, (d - t) / 0.05); }
    return x;
  },
  ring(r, d = 0.8) { // an alarm clock's bells: a hammer trilling between two bells
    const x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR, hit = (t * 24) % 1, f = Math.floor(t * 24) % 2 ? 2350 : 2650; x[i] = (Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 2.76 * t) * 0.18) * Math.exp(-hit * 4) * Math.min(1, (d - t) / 0.03); }
    return x;
  },
  scribble(r, d = 0.6) { // a pencil writing fast: short scratchy strokes of band-passed noise
    const x = buf(d), bp = biquad("bp", 3200, 1.2);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = (t * 9) % 1; x[i] = run(bp, r() * 2 - 1) * 0.7 * Math.sin(k * Math.PI) ** 2 * Math.min(1, (d - t) / 0.03); }
    return x;
  },
  bell(r, d = 1.0) { // a school bell: a fast hammer on one big bell
    const x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR, hit = (t * 18) % 1; x[i] = (Math.sin(TAU * 1250 * t) * 0.5 + Math.sin(TAU * 1250 * 2.4 * t) * 0.2 + Math.sin(TAU * 1250 * 3.9 * t) * 0.08) * Math.exp(-hit * 2.5) * Math.min(1, (d - t) / 0.05); }
    return x;
  },
  hiss(r, d = 0.3) { // bus doors: air brakes' hiss
    const x = buf(d), hp = biquad("hp", 2500, 0.7);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(hp, r() * 2 - 1) * 0.5 * env(t, 0.01, 0.1, d); }
    return x;
  },
  sadslide(r) { // descending "wah wah wah-wahhh"
    const notes = [[196, 0.34], [185, 0.34], [174.6, 0.34], [164.8, 0.9]];
    const d = notes.reduce((s, n) => s + n[1], 0) + 0.1, x = buf(d); let p = 0, i0 = 0;
    for (const [f, nd] of notes) {
      let lp = biquad("lp", 400, 2);
      for (let i = 0; i < nd * SR; i++) {
        const t = i / SR, wah = 400 + 1400 * Math.sin(Math.min(1, t / (nd * 0.6)) * Math.PI / 2);
        if (i % 64 === 0) lp = { ...biquad("lp", wah, 3), x1: lp.x1, x2: lp.x2, y1: lp.y1, y2: lp.y2 };
        const fv = f * (1 + (nd > 0.5 ? 0.012 * Math.sin(TAU * 5 * t) * Math.min(1, t / 0.3) : 0)) * (nd > 0.5 ? Math.pow(0.97, t) : 1);
        p += fv / SR; const saw = (p % 1) * 2 - 1;
        const e = t < 0.02 ? t / 0.02 : t > nd - 0.05 ? Math.max(0, (nd - t) / 0.05) : 1;
        x[i0 + i] = run(lp, saw) * e * 0.6;
      }
      i0 += Math.round(nd * SR);
    }
    return x;
  },
};

// ---------- small room reverb (Schroeder: 4 combs, 2 all-passes) ----------
function reverb(x, wet, stereoOffset) {
  const combs = [1116, 1188, 1277, 1356].map((n) => ({ b: new Float32Array(n + stereoOffset), i: 0, s: 0 }));
  const aps = [556, 441].map((n) => ({ b: new Float32Array(n + stereoOffset), i: 0 }));
  const out = new Float32Array(x.length);
  for (let k = 0; k < x.length; k++) {
    let y = 0;
    for (const c of combs) { const o = c.b[c.i]; c.s = o * 0.8 + c.s * 0.2; c.b[c.i] = x[k] * 0.015 + c.s * 0.78; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of aps) { const o = a.b[a.i]; const v = y + o * 0.5; a.b[a.i] = v; y = o - v * 0.5; a.i = (a.i + 1) % a.b.length; }
    out[k] = x[k] + y * wet * 6;
  }
  return out;
}

// ---------- variation: every clip and every event sounds a little different, same family of sounds ----------
// The clip's seed comes from seedOf(sb) (or sound.seed), so a re-render is still identical. Each effect gets a small
// random pitch shift, and some get a second layer picked from a few variants.
const hashStr = (str) => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const SEMIS = { hop: 3, land: 2, whoosh: 4, charge: 2, impact: 2, poof: 3, pop: 3, tink: 5, sting: 0, sadslide: 2 };
function repitch(x, k) { // resample by factor k (k > 1 = higher and shorter)
  if (Math.abs(k - 1) < 1e-3) return x;
  const y = new Float32Array(Math.max(1, Math.floor(x.length / k)));
  for (let i = 0; i < y.length; i++) { const p = i * k, j = Math.floor(p), f = p - j; y[i] = (x[j] ?? 0) * (1 - f) + (x[j + 1] ?? 0) * f; }
  return y;
}
const PENTA = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5];
function chime(r, n, step) { // a short magic arpeggio, up or down
  const up = r() < 0.6, start = Math.floor(r() * 3), d = n * step + 0.5, x = buf(d);
  for (let k = 0; k < n; k++) {
    const f = PENTA[Math.min(PENTA.length - 1, up ? start + k * 2 : start + (n - k) * 2 - 1)], a = Math.round(k * step * SR);
    for (let i = 0; i < 0.45 * SR && a + i < x.length; i++) { const t = i / SR; x[a + i] += (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.01 * t)) * env(t, 0.002, 0.12, 0.45) * 0.35; }
  }
  return x;
}
const STINGS = [[110, 130.8, 164.8, 220], [103.8, 123.5, 146.8, 207.7], [116.5, 138.6, 164.8, 233.1], [98, 116.5, 138.6, 196]];
function effect(kind, r, dur) {
  let x;
  if (kind === "sting") { const ch = STINGS[Math.floor(r() * STINGS.length)], d = 0.7, lp = biquad("lp", 1400 + r() * 600, 0.8); x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; for (const f of ch) y += ((t * f) % 1) * 2 - 1; x[i] = run(lp, y * 0.25) * env(t, 0.005, 0.22, d) + (r() * 2 - 1) * env(t, 0.001, 0.02, d) * 0.3; }
    return x; }
  x = SFX[kind](r, dur);
  if (kind === "poof" && r() < 0.55) { const c = chime(r, 3 + Math.floor(r() * 3), 0.05 + r() * 0.03); for (let i = 0; i < c.length && i + 0.05 * SR < x.length; i++) x[i + Math.round(0.05 * SR)] += c[i] * 0.5; }
  if (kind === "charge" && r() < 0.5) { const c = chime(r, 4, (dur ?? 1.3) / 5); for (let i = 0; i < c.length && i < x.length; i++) x[i] += c[i] * 0.3; }
  const semis = (r() * 2 - 1) * (SEMIS[kind] ?? 0);
  return repitch(x, Math.pow(2, semis / 12));
}

// a quiet bed of room sound for the set, so the clips don't all sit in the same silence
function ambience(type, seconds, r) {
  const x = buf(seconds), n = x.length;
  if (type === "party") { // crowd murmur and the odd glass clink (the clip's own music plays on top, so no second song here)
    const mur = biquad("bp", 500, 0.6), mur2 = biquad("bp", 900, 0.8);
    for (let i = 0; i < n; i++) { const t = i / SR; x[i] = run(mur, r() * 2 - 1) * (0.3 + 0.1 * Math.sin(TAU * 0.3 * t)) + run(mur2, r() * 2 - 1) * (0.12 + 0.06 * Math.sin(TAU * 0.47 * t + 2)); }
    let t0 = 0.5 + r() * 1.5;
    while (t0 < seconds - 0.3) { const a = Math.round(t0 * SR), f = 2600 + r() * 1800; for (let i = 0; i < 0.25 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.7 * t)) * env(t, 0.001, 0.05, 0.25) * 0.12; } t0 += 2 + r() * 3; }
  } else if (type === "office") { // air conditioning hum and the odd keyboard clatter
    const hp = biquad("lp", 900, 0.5);
    for (let i = 0; i < n; i++) { const t = i / SR; x[i] = run(hp, r() * 2 - 1) * 0.12 + Math.sin(TAU * 60 * t) * 0.03; }
    let t0 = 0.3 + r() * 0.8;
    while (t0 < seconds - 0.1) { const burst = 4 + Math.floor(r() * 8); for (let k = 0; k < burst; k++) { const a = Math.round((t0 + k * (0.07 + r() * 0.08)) * SR), f = 1800 + r() * 1500; for (let i = 0; i < 0.02 * SR && a + i < n; i++) x[a + i] += (r() * 2 - 1) * Math.exp(-i / SR / 0.004) * 0.25 + Math.sin(TAU * f * i / SR) * Math.exp(-i / SR / 0.006) * 0.1; } t0 += 1.5 + r() * 2.5; }
  } else if (type === "rooftop") { // wind and a distant city
    let lp = biquad("lp", 400, 0.7); const low = biquad("lp", 160, 0.7);
    for (let i = 0; i < n; i++) { const t = i / SR; if (i % 256 === 0) lp = { ...biquad("lp", 300 + 250 * (0.5 + 0.5 * Math.sin(TAU * 0.13 * t + 1.3) * Math.sin(TAU * 0.07 * t)), 0.7), x1: lp.x1, x2: lp.x2, y1: lp.y1, y2: lp.y2 }; const w = r() * 2 - 1; x[i] = run(lp, w) * 0.35 + run(low, r() * 2 - 1) * 0.5; }
    const honk = 0.8 + r() * Math.max(0.5, seconds - 2); const a = Math.round(honk * SR), f = 330 + r() * 80; for (let i = 0; i < 0.35 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += (((t * f) % 1) * 2 - 1 + ((t * f * 1.26) % 1) * 2 - 1) * env(t, 0.02, 0.2, 0.35) * 0.05; }
  } else { // meadow and anything else: a breeze and a few birds
    const lp = biquad("lp", 500, 0.7);
    for (let i = 0; i < n; i++) x[i] = run(lp, r() * 2 - 1) * 0.15;
    for (let k = 0; k < Math.floor(seconds / 2.5) + 1; k++) { const a = Math.round((0.4 + r() * (seconds - 0.8)) * SR), f0 = 2800 + r() * 1500; for (let j = 0; j < 3; j++) { const b = a + Math.round(j * 0.09 * SR); for (let i = 0; i < 0.06 * SR && b + i < n; i++) { const t = i / SR; x[b + i] += Math.sin(TAU * (f0 + 1500 * t / 0.06) * t) * env(t, 0.004, 0.02, 0.06) * 0.15; } } }
  }
  for (let i = 0; i < Math.min(n, 0.3 * SR); i++) { x[i] *= i / (0.3 * SR); x[n - 1 - i] *= i / (0.3 * SR); } // fade in and out
  // balance the beds against each other: roughly 18-22 dB under the voices and effects
  const level = { party: 1.0, office: 2.5, rooftop: 2 }[type] ?? 3;
  for (let i = 0; i < n; i++) x[i] *= level;
  return x;
}

// ---------- the storyboard -> sound events ----------
export function soundEvents(sb) {
  const cfg = { auto: true, ...(sb.sound || {}) }, ev = [];
  const panOf = (who) => { const c = sb.cast.find((x) => x.id === who); return c ? Math.max(-0.3, Math.min(0.3, c.at[0] * 0.4)) : 0; }; // gentle pan: most people watch on one phone speaker
  if (cfg.auto !== false) {
    const hats = {};
    for (const a of [...(sb.actions || [])].sort((p, q) => p.at - q.at)) {
      const pan = panOf(a.who), d = a.dur ?? 0.3;
      if (a.do === "talk") ev.push({ kind: "voice", at: a.at, action: a, who: a.who, pan });
      if (a.do === "hop") { const n = a.count ?? 1; for (let k = 0; k < n; k++) { ev.push({ kind: "hop", at: a.at + (k * d) / n, pan, gain: 0.32 }); ev.push({ kind: "land", at: a.at + ((k + 1) * d) / n, pan, gain: 0.4 }); } }
      if (a.do === "swap") ev.push({ kind: "pop", at: a.at + 0.03, pan, gain: 0.45 });
      if (a.do === "charge" && (a.to ?? 1) > 0.3) ev.push({ kind: "charge", at: a.at, dur: d, pan, gain: 0.28 });
      if (a.do === "hat") {
        const up = (a.off || [0, 0, 0])[1] > 0.1;
        if (up) { ev.push({ kind: "whoosh", at: a.at, dur: 0.3, pan, gain: 0.35 }); hats[a.who] = true; }
        else if (hats[a.who]) { ev.push({ kind: "tink", at: a.at + d * 0.55, pan, gain: 0.2 }); hats[a.who] = false; }
      }
      if (a.do === "droop" && (a.to ?? 1) > 0.5) ev.push({ kind: "sadslide", at: a.at, pan, gain: 0.3 });
      if (a.do === "expr" && a.expr === "shocked") ev.push({ kind: "sting", at: a.at, pan: 0, gain: 0.35 });
    }
    const impacts = (sb.fx || []).filter((f) => f.do === "impact").map((f) => f.at);
    for (const f of sb.fx || []) {
      // one impact sound per hit: a flash right after an impact frame stays silent
      if (f.do === "impact") ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55 });
      if (f.do === "flash" && !impacts.some((a) => Math.abs(a - f.at) < 0.25)) ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55 });
      if (f.do === "poof") ev.push({ kind: "poof", at: f.at, pan: f.who ? panOf(f.who) : 0, gain: 0.5 });
    }
  }
  for (const s of sb.sfx || []) ev.push({ kind: s.sound, at: s.at, dur: s.dur, pan: s.pan ?? 0, gain: s.gain ?? 0.4 });
  return ev.sort((p, q) => p.at - q.at);
}

export function renderAudio(sb, chars) {
  const cfg = { voice: 1, sfx: 1, reverb: 0.12, ...(sb.sound || {}) };
  const seed = cfg.seed ?? hashStr(seedOf(sb) || "clip");
  const voices = new Bus(sb.duration), fx = new Bus(sb.duration), r = rng(seed);
  const events = soundEvents(sb);
  for (const e of events) {
    if (e.kind === "voice") {
      const c = sb.cast.find((x) => x.id === e.who), def = chars[c.character] || {};
      voice(voices, e.action, typeof def.voice === "object" ? def.voice : {}, e.pan, 0.5 * cfg.voice);
    } else if (SFX[e.kind]) fx.add(e.at, effect(e.kind, r, e.dur), e.gain * cfg.sfx, e.pan);
    else console.warn(`unknown sound "${e.kind}" at ${e.at}s, skipped`);
  }
  // room sound for the set: sound.ambience is its gain (0 turns it off)
  const amb = cfg.ambience ?? 0.1;
  if (amb > 0) fx.add(0, ambience(sb.set?.type, sb.duration, rng(seed ^ 0x5bd1e995)), amb, 0);
  const L = new Float32Array(voices.n), R = new Float32Array(voices.n);
  const vl = reverb(voices.L, cfg.reverb, 0), vr = reverb(voices.R, cfg.reverb, 23);
  const fl = reverb(fx.L, cfg.reverb * 0.6, 0), fr = reverb(fx.R, cfg.reverb * 0.6, 23);
  let peak = 0;
  for (let i = 0; i < L.length; i++) { L[i] = vl[i] + fl[i]; R[i] = vr[i] + fr[i]; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
  if (peak > 0.89) { const g = 0.89 / peak; for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; } }
  return { L, R, sr: SR, events, peak };
}

export function writeWav(file, L, R, sr = SR) {
  const n = L.length, data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28);
  h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}
