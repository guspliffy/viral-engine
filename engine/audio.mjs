// Sound for a storyboard: real speech for lines that have it (engine/voice/), gibberish voices for every other `talk`
// action, sound effects synthesised in code and placed automatically from the storyboard's events (hops, poofs,
// flashes, charges, ...), recorded foley from the sound library (engine/sfx/: footsteps on every footfall, grabs,
// sitting down), the leads' signature sounds on their entrance, and on the payoff only when it is their own trick
// (engine/sfx/signature.mjs), plus any explicit `sfx` entries, which name a whitelisted sound: a code effect or a
// library sound (engine/sfx/whitelist.mjs). The sad trombone on a droop and the "dun!" sting on a shocked face are
// opt-in ("sound": { "autoTrombone": true, "autoSting": true }). Everything but the room bed then goes through the
// set's own room (engine/sfx/rooms.mjs).
// Deterministic like the picture: the same storyboard always gives the same audio.
//
// Claude cannot listen to the result. Everything here is checked by measurement (levels, timing, spectrum), so
// whether it *sounds* right is for a human to judge.
import fs from "node:fs";
import { planSyllables, VOWELS, voiceKey, hash } from "./shared/syllables.js";
import { rng, hopCrouch } from "./page/util.js";
import { seedOf } from "../puppet/beat.mjs";
import { speechSamples } from "./voice/speech.mjs";
import { isLibrarySound, librarySound, surfaceOf, isHit, hitTime } from "./sfx/library.mjs";
import { SR, TAU, biquad, run, env, buf, normalise } from "./sfx/dsp.mjs";
import { roomOf, roomSound } from "./sfx/rooms.mjs";
import { entry } from "./sfx/whitelist.mjs";
import { signatureEvents, isSignature, signatureSound, signatureGain } from "./sfx/signature.mjs";
import { actorState, cameraState } from "./page/timeline.js";
import { loadCharacters } from "./load.mjs";

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
  // a whisper: no voiced tone, just breath noise shaped by the first two formants (tone "whisper")
  const hush = s.whisper ? biquad("bp", F[0], 2.2) : null, voiced = s.whisper ? 0 : 1;
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
    y *= voiced;
    y += run(breath, r() * 2 - 1) * (s.whisper ? 0.9 : (v.breath ?? 0.08) * 2);
    if (hush) y += run(hush, r() * 2 - 1) * 1.1;
    const at = Math.round(v0 * SR) + i;
    if (at < x.length) x[at] += y * e * 0.12;
  }
  return normalise(x, s.amp * (s.whisper ? 0.6 : 1));
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
  // a knuckle on a wooden door: a short hollow thud with a click on top ("knock" is the library's AI knock, Jonny's pick)
  "knock-tap"(r) {
    const d = 0.16, x = buf(d), bp = biquad("bp", 260, 2.2), hp = biquad("hp", 1500, 0.7); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 210 * Math.pow(150 / 210, t / d); p += TAU * f / SR; x[i] = (Math.sin(p) * 0.8 + run(bp, r() * 2 - 1) * 2.2) * env(t, 0.001, 0.035, d) + run(hp, r() * 2 - 1) * env(t, 0.0005, 0.004, d) * 0.6; }
    return x;
  },
  // a front door slammed shut: a deep thump, the frame rattling and a latch click
  slam(r) {
    const d = 0.7, x = buf(d), lp = biquad("lp", 700, 0.7), rat = biquad("bp", 1400, 3); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 95 * Math.pow(48 / 95, Math.min(1, t / 0.25)); p += TAU * f / SR;
      x[i] = Math.sin(p) * env(t, 0.002, 0.18, d) * 1.3 + run(lp, r() * 2 - 1) * env(t, 0.001, 0.06, d) * 1.2
        + run(rat, r() * 2 - 1) * env(t - 0.03, 0.002, 0.12, d) * (0.6 + 0.4 * Math.sin(TAU * 31 * t)) * 0.9 + Math.sin(TAU * 2300 * t) * env(t - 0.02, 0.0005, 0.01, d) * 0.25;
    }
    return x;
  },
  tink(r) { const d = 0.35, x = buf(d); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 2100 * t) * 0.6 + Math.sin(TAU * 5300 * t) * 0.25) * env(t, 0.001, 0.07, d); } return x; },
  // a small bright ring off a blade tip: a high bell partial that rings out
  ting(r) { const d = 0.7, x = buf(d); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 3950 * t) * 0.5 + Math.sin(TAU * 6120 * t) * 0.22 + Math.sin(TAU * 9480 * t) * 0.08) * env(t, 0.0008, 0.22, d); } return x; },
  // a sweet's wrapper: a few quick, crisp crackles
  crinkle(r, d = 0.3) {
    const x = buf(d), hp = biquad("hp", 3000, 0.8), hits = Array.from({ length: 9 }, () => r() * (d - 0.03));
    for (let i = 0; i < x.length; i++) { const t = i / SR; let e = 0; for (const h of hits) e += env(t - h, 0.0003, 0.006, d); x[i] = run(hp, r() * 2 - 1) * e * 0.9; }
    return x;
  },
  // an iron door latch dropping into its catch: a metal clack with a short ring
  latch(r) {
    const d = 0.25, x = buf(d), bp = biquad("bp", 2400, 3);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(bp, r() * 2 - 1) * env(t, 0.0005, 0.012, d) * 2 + (Math.sin(TAU * 1850 * t) * 0.3 + Math.sin(TAU * 3020 * t) * 0.15) * env(t - 0.004, 0.0005, 0.05, d) + run(bp, r() * 2 - 1) * env(t - 0.06, 0.0005, 0.008, d); }
    return x;
  },
  // a blade through paper and card: a dry tearing hiss with a soft thock of the core
  papercut(r) {
    const d = 0.22, x = buf(d), bp = biquad("bp", 3800, 1.2), lp = biquad("lp", 500, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR, grain = 0.6 + 0.4 * Math.sin(TAU * 140 * t + r() * 0.5) ** 2; x[i] = run(bp, r() * 2 - 1) * env(t, 0.002, 0.06, d) * grain * 1.4 + run(lp, r() * 2 - 1) * env(t, 0.001, 0.02, d) * 1.5; }
    return x;
  },
  // a breath blown through pursed lips at a candle: an airy "fff" (noise around 1.4 kHz with a little flutter) that
  // starts fast, holds and dies away; d is how long the breath is (Dragon vs. the Candle)
  blow(r, d = 0.7) {
    const x = buf(d), bp = biquad("bp", 1400, 0.7), hp = biquad("hp", 350, 0.7);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, a = Math.min(1, t / 0.05) * (k < 0.55 ? 1 : Math.cos((k - 0.55) / 0.45 * Math.PI / 2) ** 2); x[i] = run(hp, run(bp, r() * 2 - 1)) * a * (0.85 + 0.15 * Math.sin(TAU * 11 * t)) * 1.6; }
    return x;
  },
  // one dry muted pluck, a low "dum" (A2, the strings stopped at once): a deadpan button, no tail
  plunk(r) {
    const d = 0.42, x = buf(d), f = 110 * (1 + (r() - 0.5) * 0.002);
    for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; for (let h = 1; h <= 6; h++) y += Math.sin(TAU * f * h * t) * Math.exp(-t * (9 + h * 7)) / h; x[i] = y * Math.min(1, t / 0.003) * (t > d - 0.03 ? (d - t) / 0.03 : 1) * 0.8; }
    return x;
  },
  // a small surprised gasp: a quick breathy inhale that rises
  gasp(r) {
    const d = 0.3, x = buf(d); let bp = biquad("bp", 900, 2);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d; if (i % 64 === 0) bp = { ...biquad("bp", 800 + 1400 * k, 2.2), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 }; x[i] = run(bp, r() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / 0.22)) * (t < 0.22 ? 1 : 0) * 1.6; }
    return x;
  },
  // one weighted footstep on stone: a dull low thud and a little grit
  step(r) {
    const d = 0.2, x = buf(d), lp = biquad("lp", 300, 0.7), hp = biquad("hp", 2500, 0.7); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 90 * Math.pow(50 / 90, t / d); p += TAU * f / SR; x[i] = Math.sin(p) * env(t, 0.002, 0.05, d) * 1.2 + run(lp, r() * 2 - 1) * env(t, 0.001, 0.03, d) * 1.5 + run(hp, r() * 2 - 1) * env(t - 0.01, 0.001, 0.02, d) * 0.25; }
    return x;
  },
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
  splash(r) { // a wheel through a puddle: a band-passed noise burst and two falling bloops
    const d = 0.5, x = buf(d), bp = biquad("bp", 1400, 0.9);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f1 = 900 - 900 * t, f2 = 650 - 500 * t;
      x[i] = run(bp, r() * 2 - 1) * 0.55 * env(t, 0.004, 0.09, d) + (Math.sin(TAU * f1 * t) * env(t - 0.03, 0.005, 0.04, d) + Math.sin(TAU * f2 * t) * env(t - 0.11, 0.005, 0.04, d)) * 0.3;
    }
    return x;
  },
  ding(r, d = 1.6) { // a lift arriving: one soft bell tone (a struck bar: a fundamental, its slightly sharp octave and a high partial)
    const x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 1175 * t) * 0.6 + Math.sin(TAU * 2362 * t) * 0.22 * Math.exp(-t / 0.25) + Math.sin(TAU * 3290 * t) * 0.08 * Math.exp(-t / 0.08)) * env(t, 0.002, d * 0.5, d); }
    return x;
  },
  doorslide(r, d = 0.8) { // lift doors gliding: a soft low rumble of rollers and a whisper of air, easing in and out
    const x = buf(d), lp = biquad("lp", 220, 0.8), bp = biquad("bp", 1400, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = Math.sin(Math.PI * Math.min(1, t / d)) ** 1.5; x[i] = (run(lp, r() * 2 - 1) * 1.4 + run(bp, r() * 2 - 1) * 0.12 + Math.sin(TAU * 62 * t) * 0.08) * k; }
    return x;
  },
  hiss(r, d = 0.3) { // bus doors: air brakes' hiss
    const x = buf(d), hp = biquad("hp", 2500, 0.7);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(hp, r() * 2 - 1) * 0.5 * env(t, 0.01, 0.1, d); }
    return x;
  },
  partyhorn(r, d = 0.55) { // a paper party horn: a buzzy reed tone that bends up as it unrolls
    const x = buf(d), lp = biquad("lp", 2600, 0.9); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 330 * (1 + 0.12 * Math.min(1, t / 0.12)) * (1 + 0.01 * Math.sin(TAU * 7 * t)); p += f / SR; const saw = (p % 1) * 2 - 1, sq = (p % 1) < 0.3 ? 1 : -1; x[i] = run(lp, saw * 0.4 + sq * 0.25) * env(t, 0.015, 0.45, d) * Math.min(1, (d - t) / 0.05); }
    return x;
  },
  ringtone(r, d = 0.9) { // a phone ringing: a fast trill of two tones in short bursts
    const x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR, burst = (t % 0.45) < 0.3 ? 1 : 0, f = Math.floor(t * 16) % 2 ? 1320 : 1760; x[i] = (Math.sin(TAU * f * t) * 0.45 + Math.sin(TAU * f * 2 * t) * 0.1) * burst * Math.min(1, (d - t) / 0.03); }
    return x;
  },
  flutter(r, d = 0.8) { // a flurry of paper: many soft flaps of band-passed noise, thinning out
    const x = buf(d), bp = biquad("bp", 1800, 0.9);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, flap = 0.5 + 0.5 * Math.sin(TAU * (26 - 14 * k) * t + 3 * Math.sin(TAU * 3 * t)); x[i] = run(bp, r() * 2 - 1) * 0.8 * flap * (1 - k) * Math.min(1, t / 0.02); }
    return x;
  },
  scrape(r, d = 0.6) { // wooden stool feet dragged over a wooden floor: a woody, chattering rub that fades in and out
    const x = buf(d), bp = biquad("bp", 520, 1.6), bp2 = biquad("bp", 1500, 2.2);
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, shape = Math.sin(Math.PI * Math.min(1, k * 1.15)) ** 0.7, chat = 0.55 + 0.45 * Math.sin(TAU * (34 + 6 * Math.sin(TAU * 1.3 * t)) * t) ** 2, n = r() * 2 - 1; x[i] = (run(bp, n) * 0.9 + run(bp2, n) * 0.35) * chat * shape; }
    return x;
  },
  wings(r, d = 2.0) { // soft feathery wing beats about three times a second, for a hover: each beat a low airy push
    const x = buf(d), lp = biquad("lp", 700, 0.7), bp = biquad("bp", 1700, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR, beat = Math.max(0, Math.sin(TAU * 3.1 * t)) ** 3, n = r() * 2 - 1, fade = Math.min(1, t / 0.15, (d - t) / 0.25); x[i] = (run(lp, n) * 0.9 + run(bp, n) * 0.18) * beat * fade; }
    return x;
  },
  notify(r) { // a soft phone notification: two quick rounded tones, up a fourth
    const d = 0.55, x = buf(d);
    for (const [t0, f] of [[0, 1175], [0.11, 1568]]) for (let i = Math.round(t0 * SR); i < x.length; i++) { const t = i / SR - t0; x[i] += (Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 2 * t) * 0.08) * env(t, 0.004, 0.12, d - t0); }
    return x;
  },
  gunshot(r) { // a cartoon pistol: a sharp crack and a short boom
    const d = 0.45, x = buf(d), lp = biquad("lp", 1800, 0.7); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 120 * Math.pow(50 / 120, Math.min(1, t / 0.2)); p += TAU * f / SR; x[i] = (r() * 2 - 1) * env(t, 0.0005, 0.012, d) * 1.1 + run(lp, r() * 2 - 1) * env(t, 0.001, 0.07, d) * 0.7 + Math.sin(p) * env(t, 0.002, 0.12, d) * 0.8; }
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

// ---------- variation: every clip and every event sounds a little different, same family of sounds ----------
// The clip's seed comes from seedOf(sb) (or sound.seed), so a re-render is still identical. Each effect gets a small
// random pitch shift, and some get a second layer picked from a few variants.
const hashStr = (str) => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const SEMIS = { splash: 3, hop: 3, land: 2, whoosh: 4, charge: 2, impact: 2, poof: 3, pop: 3, tink: 5, sting: 0, sadslide: 2 };
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

// any sound a storyboard can name (a code effect, a library sound or a signature) as mono samples, for the
// whitelist's listen sheet and measurements (engine/sfx/measure.mjs, engine/sfx/sheet.mjs); seed picks the take
export const CODE_SOUNDS = Object.keys(SFX);
export function soundSamples(id, seed = 1, dur) {
  if (isSignature(id)) return signatureSound(id);
  const r = rng(seed);
  return SFX[id] ? effect(id, r, dur) : librarySound(id, r, { dur, code: effect });
}

// a quiet bed of room sound for the set, so the clips don't all sit in the same silence
function ambience(type, seconds, r, fade = 0.3) {
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
  } else if (type === "rooftop" || type === "storefront") { // wind and a distant city (a rooftop, the DUO store's street)
    let lp = biquad("lp", 400, 0.7); const low = biquad("lp", 160, 0.7);
    for (let i = 0; i < n; i++) { const t = i / SR; if (i % 256 === 0) lp = { ...biquad("lp", 300 + 250 * (0.5 + 0.5 * Math.sin(TAU * 0.13 * t + 1.3) * Math.sin(TAU * 0.07 * t)), 0.7), x1: lp.x1, x2: lp.x2, y1: lp.y1, y2: lp.y2 }; const w = r() * 2 - 1; x[i] = run(lp, w) * 0.35 + run(low, r() * 2 - 1) * 0.5; }
    const honk = 0.8 + r() * Math.max(0.5, seconds - 2); const a = Math.round(honk * SR), f = 330 + r() * 80; for (let i = 0; i < 0.35 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += (((t * f) % 1) * 2 - 1 + ((t * f * 1.26) % 1) * 2 - 1) * env(t, 0.02, 0.2, 0.35) * 0.05; }
  } else if (type === "porch") { // a quiet autumn night: a soft breeze, crickets and the odd far-off owl
    const lp = biquad("lp", 380, 0.7);
    for (let i = 0; i < n; i++) x[i] = run(lp, r() * 2 - 1) * 0.12;
    for (const [f, rate, ph, g] of [[4300, 2.1, 0, 0.05], [4700, 2.6, 1.7, 0.035], [3900, 1.8, 0.6, 0.03]]) for (let i = 0; i < n; i++) { const t = i / SR, chirp = Math.max(0, Math.sin(TAU * rate * t + ph)) ** 8 * (0.5 + 0.5 * Math.sin(TAU * 38 * t)); x[i] += Math.sin(TAU * f * t) * chirp * g; }
    const owl = 1.5 + r() * Math.max(0.5, seconds - 4); for (const k of [0, 0.35]) { const a = Math.round((owl + k) * SR); for (let i = 0; i < 0.3 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += Math.sin(TAU * (390 - 30 * t) * t) * env(t, 0.03, 0.15, 0.3) * 0.05; } }
  } else if (type === "elevator") { // a lift on the move: a low motor hum with a slow beat and the whir of the cables
    const lp = biquad("lp", 300, 0.7), lp2 = biquad("lp", 1200, 0.6);
    for (let i = 0; i < n; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 58 * t) * 0.07 + Math.sin(TAU * 116.4 * t) * 0.035) * (0.85 + 0.15 * Math.sin(TAU * 0.7 * t)) + run(lp, r() * 2 - 1) * 0.16 + run(lp2, r() * 2 - 1) * 0.015; }
  } else if (type === "road") { // an open car on a country road: a small engine's purr (whole cycles, so a loop meets itself) and the wind
    const lp = biquad("lp", 700, 0.6), wind = biquad("lp", 260, 0.7);
    for (let i = 0; i < n; i++) { const t = i / SR, p = TAU * 41 * t; x[i] = (Math.sin(p) * 0.06 + Math.sin(2 * p) * 0.05 + Math.sin(3 * p) * 0.025) * (0.8 + 0.2 * Math.sin(TAU * 7 * t)) + run(lp, r() * 2 - 1) * 0.05 + run(wind, r() * 2 - 1) * 0.2; }
  } else if (type === "apartment") { // a quiet flat in the afternoon: soft room tone, a faint far-off street now and then
    const lp = biquad("lp", 260, 0.6), lp2 = biquad("lp", 900, 0.7);
    for (let i = 0; i < n; i++) { const t = i / SR; x[i] = run(lp, r() * 2 - 1) * 0.14 + run(lp2, r() * 2 - 1) * 0.025 * (0.6 + 0.4 * Math.sin(TAU * 0.11 * t)); }
  } else { // meadow and anything else: a breeze and a few birds
    const lp = biquad("lp", 500, 0.7);
    for (let i = 0; i < n; i++) x[i] = run(lp, r() * 2 - 1) * 0.15;
    for (let k = 0; k < Math.floor(seconds / 2.5) + 1; k++) { const a = Math.round((0.4 + r() * (seconds - 0.8)) * SR), f0 = 2800 + r() * 1500; for (let j = 0; j < 3; j++) { const b = a + Math.round(j * 0.09 * SR); for (let i = 0; i < 0.06 * SR && b + i < n; i++) { const t = i / SR; x[b + i] += Math.sin(TAU * (f0 + 1500 * t / 0.06) * t) * env(t, 0.004, 0.02, 0.06) * 0.15; } } }
  }
  for (let i = 0; i < Math.min(n, fade * SR); i++) { x[i] *= i / (fade * SR); x[n - 1 - i] *= i / (fade * SR); } // fade in and out (sound.bedFade: a loop that meets itself only needs a click guard, 0.005)
  // balance the beds against each other: roughly 18-22 dB under the voices and effects
  const level = { party: 1.0, office: 2.5, rooftop: 2, porch: 2.5, road: 2.2 }[type] ?? 3;
  for (let i = 0; i < n; i++) x[i] *= level;
  return x;
}

// ---------- the storyboard -> sound events ----------
// chars: the character files (loaded from the storyboard when not given); the signature sounds need them to know
// where each lead is
export function soundEvents(sb, chars) {
  const cfg = { auto: true, ...(sb.sound || {}) }, ev = [];
  const panOf = (who) => { const c = sb.cast.find((x) => x.id === who); return c ? Math.max(-0.3, Math.min(0.3, c.at[0] * 0.4)) : 0; }; // gentle pan: most people watch on one phone speaker
  if (cfg.auto !== false) {
    const hats = {};
    for (const a of [...(sb.actions || [])].sort((p, q) => p.at - q.at)) {
      const pan = panOf(a.who), d = a.dur ?? 0.3;
      if (a.do === "talk") ev.push({ kind: "voice", at: a.at, action: a, who: a.who, pan });
      if (a.do === "hop") { const n = a.count ?? 1, qa = hopCrouch(d, n); for (let k = 0; k < n; k++) { ev.push({ kind: "hop", at: a.at + ((k + qa) * d) / n, pan, gain: 0.32 }); ev.push({ kind: "land", at: a.at + ((k + 1) * d) / n, pan, gain: 0.4 }); } }
      if (a.do === "swap") ev.push({ kind: "pop", at: a.at + 0.03, pan, gain: 0.45 });
      if (a.do === "charge" && (a.to ?? 1) > 0.3 && !a.quiet) ev.push({ kind: "charge", at: a.at, dur: d, pan, gain: 0.28 });
      if (a.do === "hat") {
        const up = (a.off || [0, 0, 0])[1] > 0.1;
        if (up) { ev.push({ kind: "whoosh", at: a.at, dur: 0.3, pan, gain: 0.35 }); hats[a.who] = true; }
        else if (hats[a.who]) { ev.push({ kind: "tink", at: a.at + d * 0.55, pan, gain: 0.2 }); hats[a.who] = false; }
      }
      // meme sounds only when asked for: a sad trombone on a big droop, a "dun!" on a shocked face
      if (cfg.autoTrombone && a.do === "droop" && (a.to ?? 1) > 0.5) ev.push({ kind: "sadslide", at: a.at, pan, gain: 0.3 });
      if (cfg.autoSting && a.do === "expr" && a.expr === "shocked") ev.push({ kind: "sting", at: a.at, pan: 0, gain: 0.35 });
    }
    const impacts = (sb.fx || []).filter((f) => f.do === "impact").map((f) => f.at);
    for (const f of sb.fx || []) {
      // one impact sound per hit: a flash right after an impact frame stays silent
      if (f.do === "impact") ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55 });
      if (f.do === "flash" && !impacts.some((a) => Math.abs(a - f.at) < 0.25)) ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55 });
      if (f.do === "poof") ev.push({ kind: "poof", at: f.at, pan: f.who ? panOf(f.who) : 0, gain: 0.5 });
    }
  }
  if (cfg.auto !== false && cfg.foley !== false) ev.push(...foley(sb, panOf));
  // the leads' signature sounds on their entrance and on the payoff (engine/sfx/signature.mjs)
  if (cfg.auto !== false) {
    let defs = chars; if (!defs) try { defs = loadCharacters(sb); } catch { defs = {}; }
    const known = { ...sb, cast: (sb.cast || []).filter((c) => defs[c.character]?.body) }; // 3D characters only (not the puppet's)
    for (const e of signatureEvents(known, defs, { actorState, cameraState })) ev.push({ ...e, pan: panOf(e.who), gain: signatureGain(e.kind) });
    if (cfg.foley !== false && cfg.flaps !== false) ev.push(...wingFlaps(known, defs, panOf));
  }
  // a library sound already has its loudness from the catalog, so its gain is a multiplier (1 = as catalogued)
  // the code "wings" bed (beats not tied to the picture) gives way to the auto flaps where they play
  const flaps = ev.filter((e) => e.kind === "wing-flap").map((e) => e.at);
  for (const s of sb.sfx || []) if (!(s.sound === "wings" && flaps.some((t) => t >= s.at && t <= s.at + (s.dur ?? 2)))) ev.push({ kind: s.sound, at: s.at, dur: s.dur, pan: s.pan ?? 0, gain: s.gain ?? (isSignature(s.sound) ? signatureGain(s.sound) : isLibrarySound(s.sound) && !SFX[s.sound] ? 1 : 0.4), ...(s.speech ? { speech: s.speech } : {}) });
  return ev.sort((p, q) => p.at - q.at);
}

// recorded foley from the sound library: a footstep on every footfall of a walk (the same phase the legs use in
// page/potato.js, softer while the walk eases in and out), a grab when the hand closes (not for props already in hand
// at the start), a creak when someone sits. Not while flying or hovering, and no footsteps if the storyboard places
// its own. A release stays silent: it may be a throw, a drop or a hand-over, so the storyboard names that sound.
function foley(sb, panOf) {
  const ev = [], step = surfaceOf(sb), ownSteps = (sb.sfx || []).some((s) => /^step/.test(s.sound));
  const acts = [...(sb.actions || [])].sort((p, q) => p.at - q.at), air = {};
  for (const a of acts) {
    const pan = panOf(a.who), d = a.dur ?? 0.3;
    if (a.do === "fly" || a.do === "hover") air[a.who] = true;
    if (a.do === "drop") air[a.who] = false;
    if (a.do === "move" && !ownSteps && !air[a.who] && (a.steps ?? 2.2) > 0) {
      // the walk phase advances `steps` cycles a second and a foot lands every half cycle; quick little steps (a run)
      // are lighter, or a dash off screen turns into a drum roll
      const rate = a.steps ?? 2.2, per = 0.5 / rate, light = Math.min(1, Math.sqrt(2.5 / rate));
      for (let t = per; t < d - 0.02; t += per) ev.push({ kind: step, at: a.at + t, pan, gain: light * (0.55 + 0.45 * Math.min(1, Math.min(t / d, 1 - t / d) * 8)) });
    }
    if (a.do === "grab" && a.at > 0.05) ev.push({ kind: "grab", at: a.at + (a.dur ?? 0.25) * 0.7, pan, gain: 1 });
    if (a.do === "sit" && a.at > 0.05) ev.push({ kind: "sit", at: a.at + (a.dur ?? 0.35) * 0.75, pan, gain: 1 });
  }
  return ev;
}

// a car's engine that follows the story (sound.engine: { keys: [[t, rpm, load, road], ...], gain, cyl }): the firing
// note (rpm / 60 * cyl / 2) with its harmonics, brighter and louder under load, a little intake hiss, and the tyres'
// rumble on the road (road 0..1: 0 in the air). The note is tuned to whole cycles over the clip, so a loop meets itself.
function engineSound(E, seconds, r) {
  const n = Math.ceil(seconds * SR), x = new Float32Array(n), K = E.keys, cyl = E.cyl ?? 4;
  const at = (t, j) => { if (t <= K[0][0]) return K[0][j]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const u = (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]), e = u * u * (3 - 2 * u); return K[i - 1][j] + (K[i][j] - K[i - 1][j]) * e; } return K[K.length - 1][j]; };
  const f = new Float32Array(n), ld = new Float32Array(n), rd = new Float32Array(n);
  let cycles = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; f[i] = (at(t, 1) / 60) * cyl / 2; ld[i] = at(t, 2) ?? 0.5; rd[i] = at(t, 3) ?? 1; cycles += f[i] / SR; }
  const tune = cycles > 1 ? Math.round(cycles) / cycles : 1;
  const lp = biquad("lp", 900, 0.8), hiss = biquad("bp", 2400, 0.9), rum = biquad("lp", 180, 0.7), rum2 = biquad("bp", 420, 1.1);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    ph += (2 * Math.PI * f[i] * tune) / SR;
    const L = ld[i], bright = 0.35 + 0.65 * L, wob = 1 + 0.06 * Math.sin(ph / cyl);   // each cylinder a touch different
    let tone = 0;
    for (let h = 1; h <= 8; h++) tone += Math.sin(h * ph + h * h * 0.7) * Math.pow(bright, h - 1) / h;
    const pulse = 0.75 + 0.25 * Math.max(0, Math.sin(ph)) ** 3;   // the exhaust's beat on each firing
    x[i] = run(lp, tone * pulse * wob) * (0.45 + 0.55 * L) + run(hiss, r() * 2 - 1) * 0.05 * L
      + (run(rum, r() * 2 - 1) * 0.5 + run(rum2, r() * 2 - 1) * 0.12) * rd[i];
  }
  return x;
}

// a wing flap on every downstroke of a winged character in the air (Phoenix's flame wings, the Dragon's), from the same
// phase the wings use on screen: page/timeline.js integrates 7 + 17 * flap for the Phoenix, the Dragon's wings run at
// t * (6 + 16 * flap). The downstroke is where the flap angle falls fastest (phase = pi, mod 2 pi). Louder as the
// flapping gets bigger, silent on the ground and for small idle flutters. Off with sound.flaps false, or when the
// storyboard places its own wing-flap sounds. A placed code "wings" bed that they overlap is dropped (soundEvents).
const WINGED = { phoenix: "integrated", dragon: "direct" };
function wingFlaps(sb, defs, panOf) {
  const ev = [], STEP = 1 / 120;
  if ((sb.sfx || []).some((s) => /wing-flap/.test(s.sound))) return ev;
  for (const c of sb.cast || []) {
    const def = defs[c.character] || {}, kind = WINGED[def.costume?.type];
    if (!kind || !(sb.actions || []).some((a) => a.who === c.id && (a.do === "fly" || a.do === "hover"))) continue;
    let phase = 0, prev = null;
    for (let t = 0; t <= sb.duration; t += STEP) {
      const st = actorState(sb, c, def, t, true), fl = st.flap || 0;
      phase = kind === "direct" ? t * (6 + 16 * fl) : phase + (7 + 17 * fl) * STEP;
      const k = Math.floor((phase - Math.PI) / (2 * Math.PI));
      if (prev != null && k > prev && fl >= 0.25 && (st.wings || 0) > 0.5 && st.visible !== false && t > 0.05)
        ev.push({ kind: "wing-flap", at: t, pan: panOf(c.id), gain: 0.5 + 0.5 * Math.min(1, fl) });
      prev = k;
    }
  }
  return ev;
}

export function renderAudio(sb, chars) {
  const cfg = { voice: 1, sfx: 1, reverb: 0.12, ...(sb.sound || {}) };
  const seed = cfg.seed ?? hashStr(seedOf(sb) || "clip");
  const voices = new Bus(sb.duration), fx = new Bus(sb.duration), r = rng(seed);
  const rl = rng(seed ^ 0x2545f491); // library takes draw their own numbers, so adding foley leaves the code effects as they were
  const events = soundEvents(sb, chars);
  for (const e of events) {
    if (e.kind === "voice" && e.action.speech) voices.add(e.at, speechSamples(e.action.speech.id), 0.5 * cfg.voice, e.pan); // real speech (engine/voice/)
    else if (e.kind === "voice") {
      const c = sb.cast.find((x) => x.id === e.who), def = chars[c.character] || {};
      voice(voices, e.action, typeof def.voice === "object" ? def.voice : {}, e.pan, 0.5 * cfg.voice);
    } else if (e.kind === "speech") { if (e.speech) voices.add(e.at, speechSamples(e.speech.id), e.gain * cfg.voice, e.pan); } // narrator
    else if (isSignature(e.kind)) { // a lead's signature: always the same take, its hit (Phoenix's burst, the bell's strike) on the event
      const x = signatureSound(e.kind);
      e.start = Math.max(0, e.at - x.hit); e.hit = e.start + x.hit; Object.defineProperty(e, "samples", { value: x, enumerable: false });
      fx.add(e.start, x, e.gain * cfg.sfx, e.pan);
    } else if (SFX[e.kind] || isLibrarySound(e.kind)) {
      // a hit sound goes in so its loudest moment lands on the event (engine/sfx/library.mjs isHit); e.start and e.hit
      // say where it went, for qa/sound.mjs
      const x = SFX[e.kind] ? effect(e.kind, r, e.dur) : librarySound(e.kind, rl, { dur: e.dur, code: effect }); // engine/sfx/
      const hit = isHit(e.kind) ? x.hit ?? hitTime(x) : 0;
      e.start = Math.max(0, e.at - hit); e.hit = e.start + hit; Object.defineProperty(e, "samples", { value: x, enumerable: false });
      fx.add(e.start, x, e.gain * cfg.sfx, e.pan);
    } else throw new Error(`sound "${e.kind}" at ${e.at} s isn't in this checkout${entry(e.kind)?.pending ? ` (it comes with ${entry(e.kind).pending})` : ""}`);
  }
  // the set's room (engine/sfx/rooms.mjs): voices go in fully, effects a little less; sound.reverb scales it (0.12 is
  // the room as set, 0 dry). The room bed (ambience) is a recording of the room already, so it stays out of it.
  const room = roomOf(sb), send = cfg.reverb / 0.12;
  const wv = roomSound(voices.L, voices.R, room, send), wf = roomSound(fx.L, fx.R, room, send * 0.6);
  // room sound for the set: sound.ambience is its gain (0 turns it off)
  const amb = cfg.ambience ?? 0.1, bed = new Bus(sb.duration);
  if (amb > 0) bed.add(0, ambience(sb.set?.type, sb.duration, rng(seed ^ 0x5bd1e995), cfg.bedFade ?? 0.3), amb, 0);
  if (cfg.engine) bed.add(0, engineSound(cfg.engine, sb.duration, rng(seed ^ 0x27d4eb2d)), cfg.engine.gain ?? 0.3, cfg.engine.pan ?? 0);
  const L = new Float32Array(voices.n), R = new Float32Array(voices.n);
  let peak = 0;
  for (let i = 0; i < L.length; i++) {
    L[i] = voices.L[i] + fx.L[i] + bed.L[i] + wv.L[i] + wf.L[i]; R[i] = voices.R[i] + fx.R[i] + bed.R[i] + wv.R[i] + wf.R[i];
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  if (peak > 0.89) { const g = 0.89 / peak; for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; } }
  return { L, R, sr: SR, events, peak, room: room.name };
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
