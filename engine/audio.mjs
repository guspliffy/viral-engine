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
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { planSyllables, VOWELS, voiceKey, hash } from "./shared/syllables.js";
import { rng, hopCrouch, naturalOf } from "./page/util.js";
import { seedOf } from "../puppet/beat.mjs";
import { speechSamples } from "./voice/speech.mjs";
import { isLibrarySound, librarySound, surfaceOf, isHit, hitTime } from "./sfx/library.mjs";
import { SR, TAU, biquad, run, env, buf, normalise, retune } from "./sfx/dsp.mjs";
import { lifeSpec, LOOK } from "./shared/life.js";
import { roomOf, roomSound } from "./sfx/rooms.mjs";
import { entry } from "./sfx/whitelist.mjs";
import { signatureEvents, isSignature, signatureSound, signatureGain } from "./sfx/signature.mjs";
import { actorState, cameraState, TAP_AT, feetOn, footfalls } from "./page/timeline.js";
import { loadCharacters } from "./load.mjs";
import { soundClock } from "./shared/holds.js";
import { pausesOf } from "./shared/pause.js";

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
  // pause time (the what-if format, 8 Nov 2026), the power's sound, the same every time: a heavy clock "TOCK" (a dry
  // knock on wood with a short metal ring on it) and under it the world winding down, a low buzzy tone that slides from
  // about 380 Hz to 60 Hz over 0.8 s like a tape stopping, with a falling band of air, then a faint clock-bell tail
  timestop(r) {
    const d = 1.3, x = buf(d), lp = biquad("lp", 2600, 0.7), bp = biquad("bp", 1800, 2.5), air = biquad("bp", 1400, 1.2);
    let p = 0, pk = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = Math.min(1, t / 0.8);
      if (i % 64 === 0) retune(air, "bp", 1400 * Math.pow(0.18, u), 1.2);
      const f = 380 * Math.pow(60 / 380, Math.pow(u, 0.75)); p += TAU * f / SR;
      // the slide: odd harmonics (a soft square), fading as it slows
      let y = (Math.sin(p) + Math.sin(3 * p) / 3 + Math.sin(5 * p) / 5) * 0.5 * env(t, 0.01, 0.6, d) * (1 - 0.85 * u);
      y = run(lp, y) + run(air, r() * 2 - 1) * 0.35 * env(t, 0.02, 0.5, d);
      // the tock: a click of bright noise, a wooden knock at 520 Hz and a low thump, all in the first 0.15 s
      pk += TAU * 520 * Math.pow(0.85, Math.min(1, t / 0.1)) / SR;
      y += run(bp, r() * 2 - 1) * 1.8 * env(t, 0.0005, 0.012, d) + (Math.sin(pk) * 1.2 + Math.sin(2 * pk) * 0.45) * env(t, 0.001, 0.07, d) + Math.sin(TAU * 95 * t) * 0.3 * env(t, 0.002, 0.08, d);
      // the bell tail: a quiet clock chime ringing out
      y += (Math.sin(TAU * 1568 * t) * 0.16 + Math.sin(TAU * 2349 * t) * 0.07) * env(t, 0.004, 0.55, d);
      x[i] = y;
    }
    return x;
  },
  // the world starting again: a quick rising "vwip" (60 -> 700 Hz in 0.22 s) into one bright clock tick
  timego(r) {
    const d = 0.5, x = buf(d), hp = biquad("hp", 1500, 0.8);
    let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = Math.min(1, t / 0.22), f = 60 * Math.pow(700 / 60, u * u); p += TAU * f / SR;
      let y = (Math.sin(p) + Math.sin(2 * p) * 0.3) * 0.7 * (t < 0.22 ? 0.2 + 0.8 * u : Math.exp(-(t - 0.22) / 0.03));
      const tk = t - 0.22;
      if (tk >= 0) y += run(hp, r() * 2 - 1) * 1.2 * Math.exp(-tk / 0.006) + Math.sin(TAU * 2400 * tk) * 0.5 * Math.exp(-tk / 0.05);
      x[i] = y;
    }
    return x;
  },
  // a camera's self-timer: one short pure beep near 3 kHz with soft edges (Ghost Photo)
  "timer-beep"(r) {
    const d = 0.1, x = buf(d);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 3050 * t) * 0.55 + Math.sin(TAU * 6100 * t) * 0.08) * Math.min(1, t / 0.004, Math.max(0, 0.075 - t) / 0.01); }
    return x;
  },
  // cloth starting to smoulder: a quiet airy hiss with a few tiny crackles in it (Ghost Photo's glowing sheet)
  sizzle(r, d = 0.8) {
    const x = buf(d), bp = biquad("bp", 5200, 0.9), hp = biquad("hp", 3500, 0.8), hits = Array.from({ length: 11 }, () => 0.04 + r() * (d - 0.1));
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let e = 0; for (const h of hits) e += env(t - h, 0.0003, 0.004, d);
      x[i] = run(bp, r() * 2 - 1) * 0.35 * Math.min(1, t / 0.12, (d - t) / 0.2) + run(hp, r() * 2 - 1) * e * 0.9;
    }
    return x;
  },
  // hot oil boiling in a giant fryer: a low bubbling bed with many small wet pops on top, fading in and out (Real
  // Footage of Hell)
  bubbling(r, d = 2) {
    const x = buf(d), lp = biquad("lp", 420, 0.8), pops = Array.from({ length: Math.round(d * 34) }, () => [0.03 + r() * (d - 0.1), 180 + r() * 420, 0.4 + r() * 0.6]);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, fade = Math.min(1, t / 0.25, (d - t) / 0.3);
      let v = run(lp, r() * 2 - 1) * 0.5 * (0.7 + 0.3 * Math.sin(TAU * 3.1 * t));
      for (const [h, f, a] of pops) { const u = t - h; if (u > 0 && u < 0.06) v += Math.sin(TAU * f * (1 + 2.5 * u) * u) * a * Math.exp(-u * 70); }
      x[i] = v * fade * 0.8;
    }
    return x;
  },
  // a low dark rumble under everything, swelling slowly (a furnace far off; the bed under the hell tunnel)
  rumble(r, d = 3) {
    const x = buf(d), lp = biquad("lp", 140, 0.9), lp2 = biquad("lp", 60, 0.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, swell = Math.min(1, t / (d * 0.8)) * Math.min(1, (d - t) / 0.3);
      x[i] = (run(lp, r() * 2 - 1) * 1.6 + run(lp2, r() * 2 - 1) * 2.2 + Math.sin(TAU * 41 * t) * 0.12) * (0.45 + 0.55 * swell);
    }
    return x;
  },
  // a fierce jet of steam from a pipe: a hard bright hiss that bursts in and roars, then tails off
  steam(r, d = 0.7) {
    const x = buf(d), hp = biquad("hp", 2600, 0.7), bp = biquad("bp", 6500, 0.9);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, e = Math.min(1, t / 0.015) * Math.min(1, (d - t) / (d * 0.55));
      x[i] = (run(hp, r() * 2 - 1) * 0.8 + run(bp, r() * 2 - 1) * 0.6) * e * (0.9 + 0.1 * Math.sin(TAU * 23 * t));
    }
    return x;
  },
  // Never Looks Up ep 1 (the T-rex). A giant's footfall: a deep thump that drops in pitch (60->38 Hz), a dull mid
  // knock on top so a phone speaker hears it, and a little grit trickling after
  dinostomp(r, d = 0.9) {
    const x = buf(d), lp = biquad("lp", 900, 0.8), hp = biquad("hp", 2500, 0.8), grit = Array.from({ length: 14 }, () => 0.06 + r() * (d - 0.2));
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 38 + 22 * Math.exp(-t * 9); ph += TAU * f / SR;
      let g = 0; for (const h of grit) g += env(t - h, 0.0003, 0.005, d);
      x[i] = Math.sin(ph) * 0.55 * Math.exp(-t * 4.5) * Math.min(1, t / 0.004)
        + run(lp, r() * 2 - 1) * 4.5 * Math.exp(-t * 14) + Math.sin(TAU * 190 * t) * 0.6 * Math.exp(-t * 20) + Math.sin(TAU * 420 * t) * 0.35 * Math.exp(-t * 28)
        + run(hp, r() * 2 - 1) * g * 0.25 * Math.min(1, (d - t) / 0.2);
    }
    return x;
  },
  // a big animal sniffing: a sharp nasal intake, noise through a nose-like band that rises 600->1400 Hz, 0.35 s
  snort(r, d = 0.35) {
    const x = buf(d), bp = biquad("bp", 900, 2.2), bp2 = biquad("bp", 2200, 1.5);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = t / d, e = Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 1.5 * Math.min(1, (d - t) / 0.04);
      if (i % 64 === 0) retune(bp, "bp", 600 + 800 * u, 2.2);
      x[i] = (run(bp, r() * 2 - 1) * (0.9 - 0.4 * u) + run(bp2, r() * 2 - 1) * (0.25 + 0.5 * u)) * e * 1.4 * (0.85 + 0.15 * Math.sin(TAU * 31 * t));
    }
    return x;
  },
  // a cartoon dinosaur roar, more trumpet than horror: a brassy buzzing bray (a sawtooth round 215 Hz with its
  // harmonics up to about 3 kHz, nothing under 300 Hz so a phone hears all of it) that swells, wobbles and sags in pitch, with breathy noise under it; 1.2 s
  dinoroar(r, d = 1.2) {
    const x = buf(d), lp = biquad("lp", 3200, 0.7), bp = biquad("bp", 900, 0.9), lp2 = biquad("lp", 3400, 0.7), hp = biquad("hp", 300, 0.7);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = t / d, f = 215 * (1 + 0.12 * Math.sin(Math.PI * u)) * (1 - 0.18 * u * u) * (1 + 0.025 * Math.sin(TAU * 7 * t));
      ph += f / SR; const saw = 2 * (ph % 1) - 1;
      const e = Math.min(1, t / 0.06) * Math.min(1, (d - t) / 0.35) * (0.8 + 0.2 * Math.sin(TAU * 3 * t));
      x[i] = run(hp, (run(lp, saw) * 1.1 + run(bp, r() * 2 - 1) * 0.7 + run(lp2, Math.sign(Math.sin(TAU * f * 2 * t)) * 0.3)) * e);
    }
    return x;
  },
  // small waves lapping on a shallow beach: soft surges of washy noise (a swell every ~2.6 s) with a fizz as each one
  // breaks, kept above 200 Hz so a phone hears it; a bed, any length
  waves(r, d = 10) {
    const x = buf(d), bp = biquad("bp", 700, 0.6), hp = biquad("hp", 2800, 0.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, sw = 0.5 + 0.5 * Math.sin(TAU * t / 2.6 - 1.2), br = Math.max(0, Math.sin(TAU * t / 2.6 - 0.2)) ** 6;
      x[i] = (run(bp, r() * 2 - 1) * (0.35 + 0.65 * sw) + run(hp, r() * 2 - 1) * 0.6 * br) * Math.min(1, t / 0.5, (d - t) / 0.5);
    }
    return x;
  },
  // a lifeguard's pea whistle: a bright tone round 2.9 kHz with the pea's fast trill (about 38 Hz) and breath noise,
  // two short blasts then a long one
  whistle(r, d = 0.9) {
    const x = buf(d), hp = biquad("hp", 2200, 0.8), blasts = [[0, 0.16], [0.22, 0.38], [0.45, d - 0.02]];
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, on = blasts.reduce((a, [s0, s1]) => a + (t >= s0 && t < s1 ? Math.min(1, (t - s0) / 0.012, (s1 - t) / 0.03) : 0), 0);
      const f = 2900 * (1 + 0.035 * Math.sin(TAU * 38 * t)); ph += TAU * f / SR;
      x[i] = (Math.sin(ph) * 0.8 + run(hp, r() * 2 - 1) * 0.25) * on * (0.75 + 0.25 * Math.abs(Math.sin(TAU * 38 * t)));
    }
    return x;
  },
  // a megaphone's feedback: a piercing squeal that swells and slides up from about 1.9 to 3.1 kHz, with a buzzy edge
  feedback(r, d = 0.7) {
    const x = buf(d);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = t / d, f = 1900 + 1200 * u * u; ph += TAU * f / SR;
      const e = Math.min(1, (t / d) * 3) * Math.min(1, (d - t) / 0.08);
      x[i] = (Math.sin(ph) * 0.7 + 0.25 * Math.sign(Math.sin(ph)) + (r() * 2 - 1) * 0.04) * e * 0.8;
    }
    return x;
  },
  // an inflatable ring bursting: a sharp bang of bright noise (a balloon pop, loudest in the first 10 ms) and a thin
  // rubber slap, 0.3 s
  ringpop(r, d = 0.3) {
    const x = buf(d), bp = biquad("bp", 1800, 0.7), hp = biquad("hp", 400, 0.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      x[i] = run(hp, run(bp, r() * 2 - 1) * 3 * Math.exp(-t * 45) + Math.sin(TAU * 520 * t) * 0.5 * Math.exp(-t * 30));
    }
    return x;
  },
  // the air rushing out of a popped ring: a long flapping "pfffrrt" of hissy noise that sags in pitch and flutters as
  // the valve flaps, 1.4 s
  deflate(r, d = 1.4) {
    const x = buf(d), bp = biquad("bp", 1600, 1.4);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = t / d;
      if (i % 64 === 0) retune(bp, "bp", 1600 - 900 * u, 1.4);
      const fl = 0.6 + 0.4 * Math.sin(TAU * (34 - 18 * u) * t);
      x[i] = run(bp, r() * 2 - 1) * fl * Math.min(1, t / 0.02) * (1 - u) ** 0.7 * 1.6;
    }
    return x;
  },
  // a plush shark's hopeful little hum, closed mouth: two soft "mm-mm?" notes, the second gliding up like a question
  // (about 300 -> 450 Hz, warm with a few harmonics and a nasal buzz), 0.7 s
  sharkhum(r, d = 0.7) {
    const x = buf(d), bp = biquad("bp", 900, 0.9);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, two = t > d * 0.42, u = two ? (t - d * 0.42) / (d * 0.58) : t / (d * 0.38);
      const f = two ? 310 + 140 * u * u : 330 - 20 * u; ph += TAU * f / SR;
      const e = two ? Math.min(1, u / 0.12) * Math.min(1, (1 - u) / 0.2) : (t < d * 0.38 ? Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.25) : 0);
      const v = Math.sin(ph) + 0.45 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph) + 0.12 * Math.sin(4 * ph);
      x[i] = (v * 0.55 + run(bp, v) * 0.5) * Math.max(0, e) * (1 + 0.04 * Math.sin(TAU * 5.5 * t));
    }
    return x;
  },
  // a tired cartoon zombie's groan: a low, nasal "uhhhh" (a buzzy voice round 150 Hz with strong harmonics, a vowel
  // band near 700 Hz) that sags in pitch and wobbles; several overlap for a horde when d is long, never scary
  groan(r, d = 1.2) {
    const x = buf(d), n = d > 1.5 ? 3 : 1;
    for (let v = 0; v < n; v++) {
      const f0 = 150 * (1 + 0.18 * v) * (0.94 + 0.12 * r()), off = v * 0.37 * d / n, len = n > 1 ? Math.min(d - off, 1.3 + 0.4 * r()) : d;
      const bp = biquad("bp", 700 + 120 * v, 1.2);
      let ph = 0;
      for (let i = Math.floor(off * SR); i < Math.min(x.length, Math.floor((off + len) * SR)); i++) {
        const t = i / SR - off, u = t / len;
        ph += TAU * f0 * (1 - 0.1 * u) * (1 + 0.02 * Math.sin(TAU * 4.5 * t + v)) / SR;
        const saw = 2 * ((ph / TAU) % 1) - 1, e = Math.min(1, t / 0.12) * Math.min(1, (len - t) / 0.25);
        x[i] += (run(bp, saw) * 1.4 + saw * 0.15) * e * (0.55 / Math.sqrt(n));
      }
    }
    return x;
  },
  // leaves rustling as someone dives into a hedge: a dense crackle of small dry clicks in airy noise (2-6 kHz) that
  // swells and settles, 0.6 s
  leafrustle(r, d = 0.6) {
    const x = buf(d), hp = biquad("hp", 1800, 0.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, e = Math.min(1, t / 0.04) * Math.exp(-t * 4.5), click = r() < 0.004 ? (r() * 2 - 1) * 3 : 0;
      x[i] = run(hp, (r() * 2 - 1) * 0.5 + click) * e;
    }
    return x;
  },
  // a soft friendly pat on a shoulder: a muffled cloth slap (a short thump round 300 Hz with a little noise up to
  // 2 kHz), 0.12 s
  pat(r, d = 0.12) {
    const x = buf(d), bp = biquad("bp", 900, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(TAU * 300 * t) * Math.exp(-t * 60) * 0.7 + run(bp, r() * 2 - 1) * Math.exp(-t * 90)) * 1.1; }
    return x;
  },
  // an old street lamp buzzing: a mains hum (120 Hz with bright odd harmonics up to about 1.5 kHz, so a phone hears it)
  // that stutters as the lamp flickers; a bed, any length
  lampbuzz(r, d = 4) {
    const x = buf(d);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let v = 0;
      for (const [h, a] of [[1, 0.5], [3, 0.5], [5, 0.4], [7, 0.3], [9, 0.25], [11, 0.15]]) v += a * Math.sin(TAU * 120 * h * t);
      const fl = Math.sin(t * 37.8) > 0.93 ? 0.3 : 1;
      x[i] = v * 0.35 * fl * Math.min(1, t / 0.2, (d - t) / 0.2);
    }
    return x;
  },
  // a jet of fire from a pipe: a deep roaring fwoosh that bursts in, a ragged flutter of flame and crackles, tailing
  // off (Real Footage of Hell: the tunnel's pipes)
  flamejet(r, d = 0.8) {
    const x = buf(d), lp = biquad("lp", 520, 0.8), bp = biquad("bp", 1400, 0.7), hp = biquad("hp", 3000, 0.8), cr = Array.from({ length: Math.round(d * 22) }, () => 0.05 + r() * (d - 0.12));
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, e = Math.min(1, t / 0.03) * Math.min(1, (d - t) / (d * 0.6)), flut = 0.75 + 0.25 * Math.sin(TAU * 17 * t + 2 * Math.sin(TAU * 5 * t));
      let c = 0; for (const h of cr) c += env(t - h, 0.0004, 0.006, d);
      x[i] = (run(lp, r() * 2 - 1) * 2.2 * flut + run(bp, r() * 2 - 1) * 0.5 * e) * e + run(hp, r() * 2 - 1) * c * 0.5;
    }
    return x;
  },
  // The Easy Trail's ride (friend comedies 24): riding wind, tyres on a dirt trail, a bicycle's freewheel and a plank
  // rattling under the wheels. Each lasts its dur.
  // riding fast: air rushing past the ears, a dark gusty roar (gain on `swell` for the wind rising at a cliff)
  ridewind(r, d = 2) {
    const x = buf(d), lp = biquad("lp", 520, 0.7), bp = biquad("bp", 1100, 0.9);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, gust = 0.7 + 0.3 * Math.sin(TAU * 0.9 * t + 1.1) * Math.sin(TAU * 2.3 * t);
      x[i] = (run(lp, r() * 2 - 1) * 1.6 + run(bp, r() * 2 - 1) * 0.35) * gust * Math.min(1, t / 0.15, (d - t) / 0.25);
    }
    return x;
  },
  // the wind rising as the ground drops away: the same dark roar, swelling from quiet to loud over its length
  windswell(r, d = 1.2) {
    const x = buf(d), lp = biquad("lp", 700, 0.7), bp = biquad("bp", 1500, 1.2);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = Math.min(1, t / (d * 0.7)), sw = k * k * Math.min(1, (d - t) / 0.3);
      x[i] = (run(lp, r() * 2 - 1) * 1.5 + run(bp, r() * 2 - 1) * 0.5 * k) * (0.15 + 0.85 * sw);
    }
    return x;
  },
  // knobbly tyres on a dirt trail: a low buzzing rumble with grit and small pebble ticks
  tyres(r, d = 2) {
    const x = buf(d), bp = biquad("bp", 240, 1.1), hp = biquad("hp", 2400, 0.8), ticks = Array.from({ length: Math.round(d * 14) }, () => 0.03 + r() * (d - 0.06));
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let c = 0; for (const h of ticks) c += env(t - h, 0.0003, 0.003, d);
      x[i] = (run(bp, r() * 2 - 1) * 1.4 * (0.8 + 0.2 * Math.sin(TAU * 31 * t)) + run(hp, r() * 2 - 1) * c * 0.6) * Math.min(1, t / 0.08, (d - t) / 0.12);
    }
    return x;
  },
  // a bicycle's freewheel and chain while pedalling gently: soft, even metallic ticks, about 11 a second
  freewheel(r, d = 1.5) {
    const x = buf(d), bp = biquad("bp", 3600, 3), n = Math.floor(d * 11);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = (t * 11) % 1, k = Math.floor(t * 11);
      x[i] = k < n ? (run(bp, r() * 2 - 1) * 0.8 + Math.sin(TAU * 2900 * u / 11) * 0.3) * env(u / 11, 0.0004, 0.006, 0.09) * Math.min(1, t / 0.1, (d - t) / 0.1) : 0;
    }
    return x;
  },
  // bicycle wheels rolling over a wooden plank: a hollow wooden rumble with quick uneven knocks, about 9 a second
  "plank-rattle"(r, d = 0.7) {
    const x = buf(d), lp = biquad("lp", 380, 0.9), knocks = []; for (let t = 0.02; t < d - 0.05; t += 0.08 + r() * 0.06) knocks.push([t, 180 + r() * 90]);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let v = run(lp, r() * 2 - 1) * 0.5;
      for (const [h, f] of knocks) { const u = t - h; if (u > 0 && u < 0.08) v += Math.sin(TAU * f * u) * Math.exp(-u * 55) * 0.8; }
      x[i] = v * Math.min(1, t / 0.02, (d - t) / 0.1);
    }
    return x;
  },
  // a camera flash firing: the shutter's two clicks and a soft bright 'pff' of the flash between them
  flash(r) {
    const d = 0.35, x = buf(d), hp = biquad("hp", 1800, 0.8), bp = biquad("bp", 4200, 0.8);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      x[i] = run(hp, r() * 2 - 1) * (env(t, 0.0005, 0.004, d) + 0.7 * env(t - 0.07, 0.0005, 0.006, d)) + run(bp, r() * 2 - 1) * env(t - 0.012, 0.002, 0.05, d) * 0.7 + Math.sin(TAU * 1400 * t) * 0.25 * env(t, 0.0005, 0.01, d);
    }
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
  // a flat hand slapping a banknote down on a wooden counter ($20 Potato): a sharp bright crack of skin on paper, a
  // short woody knock under it and a papery flap after; no boom (the hit stays in the phone band)
  slap(r) {
    const d = 0.32, x = buf(d), hp = biquad("bp", 2200, 0.6), bp = biquad("bp", 600, 1.0), pap = biquad("bp", 2600, 1.5); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, f = 230 * Math.pow(150 / 230, Math.min(1, t / 0.08)); p += TAU * f / SR;
      x[i] = run(hp, r() * 2 - 1) * env(t, 0.0004, 0.022, d) * 2.4 + run(bp, r() * 2 - 1) * env(t, 0.001, 0.03, d) * 1.4
        + Math.sin(p) * env(t, 0.002, 0.045, d) * 0.35 + run(pap, r() * 2 - 1) * env(t - 0.03, 0.004, 0.06, d) * 0.9;
    }
    return x;
  },
  // a DJ's record scratch stopping the music dead ($20 Potato): a vinyl rub of band-passed noise and a buzzy tone
  // sliding down fast then up and down again (a hand dragging the record back and forth), 0.45 s
  recordscratch(r) {
    const d = 0.45, x = buf(d), bp = biquad("bp", 1200, 2.5); let p = 0;
    const speed = (t) => (t < 0.14 ? 1 - t / 0.14 * 1.6 : t < 0.26 ? -0.6 + (t - 0.14) / 0.12 * 1.5 : 0.9 - (t - 0.26) / 0.19 * 1.7);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, s = speed(t), f = 180 + 520 * Math.abs(s);
      if (i % 32 === 0) Object.assign(bp, { ...biquad("bp", 500 + 2200 * Math.abs(s), 2.5), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 });
      p += TAU * f / SR;
      const saw = 2 * ((p / TAU) % 1) - 1;
      x[i] = (run(bp, r() * 2 - 1) * 0.9 + saw * 0.35 * Math.abs(s)) * Math.min(1, t / 0.006, (d - t) / 0.03) * (0.5 + 0.5 * Math.abs(s));
    }
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
  // a fang through a juice carton: a tiny dry card pop, a soft thock with a crackle on top
  puncture(r) {
    const d = 0.08, x = buf(d), hp = biquad("hp", 2600, 0.9), lp = biquad("lp", 700, 0.8);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(hp, r() * 2 - 1) * env(t, 0.0004, 0.006, d) * 0.9 + run(lp, r() * 2 - 1) * env(t, 0.0008, 0.012, d) * 1.6; }
    return x;
  },
  // a short squirt of juice out of a squeezed carton: a wet, hissy jet whose pitch drops as the pressure goes, with bubbly flutter
  squirt(r, d = 0.35) {
    const x = buf(d); let bp = biquad("bp", 2400, 1.6);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = t / d;
      if (i % 64 === 0) bp = { ...biquad("bp", 2600 * Math.pow(0.45, k), 1.6), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 };
      const flutter = 0.65 + 0.35 * Math.sin(TAU * (34 + 20 * k) * t) ** 2;
      x[i] = run(bp, r() * 2 - 1) * flutter * Math.min(1, t / 0.01) * Math.pow(1 - k, 1.4) * 1.8;
    }
    return x;
  },
  // juice landing on a face: a soft wet slap, a squelch that sinks in pitch, and a few drips after it (a "splort")
  splort(r) {
    const d = 0.45, x = buf(d), lp = biquad("lp", 380, 0.7), drips = [0.11 + r() * 0.03, 0.19 + r() * 0.04, 0.29 + r() * 0.05];
    let bp = biquad("bp", 1500, 2.2);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = Math.min(1, t / 0.16);
      if (i % 64 === 0) bp = { ...biquad("bp", 1500 * Math.pow(0.32, k), 2.2), x1: bp.x1, x2: bp.x2, y1: bp.y1, y2: bp.y2 };
      const gurgle = 0.55 + 0.45 * Math.sin(TAU * (48 - 20 * k) * t) ** 2;
      let v = run(lp, r() * 2 - 1) * env(t, 0.001, 0.035, d) * 2.2 + run(bp, r() * 2 - 1) * gurgle * env(t - 0.004, 0.003, 0.07, d) * 2.4;
      for (const [j, h] of drips.entries()) { const u = t - h; if (u > 0 && u < 0.05) v += Math.sin(TAU * (500 + j * 120 + 2400 * u) * u) * Math.exp(-u / 0.012) * (0.32 - j * 0.07); }
      x[i] = v;
    }
    return x;
  },
  // one cartoon swallow, "glk": a short throat click, then a low round gulp that bloops up and back down (a mouthful
  // of hot sauce going down, Friends Who Copy Everything)
  gulp(r) {
    const d = 0.24, x = buf(d), bp = biquad("bp", 1800, 2.5); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = t - 0.03;
      let v = run(bp, r() * 2 - 1) * env(t, 0.0005, 0.008, d) * 0.9;   // the click
      if (u > 0) { const k = Math.min(1, u / 0.16), f = 150 + 210 * Math.sin(k * Math.PI) ** 1.5; p += TAU * f / SR; v += (Math.sin(p) + 0.3 * Math.sin(2 * p)) * Math.sin(k * Math.PI) * Math.exp(-u / 0.12) * 0.95; }
      x[i] = v;
    }
    return x;
  },
  // a chunk of plaster wall breaking: a sharp dry crack, a crunchy low burst and pieces clattering down after it
  crumble(r) {
    const d = 1.1, x = buf(d), lp = biquad("lp", 600, 0.7), hp = biquad("hp", 1800, 0.7), bp = biquad("bp", 1100, 1.2), bits = Array.from({ length: 14 }, (_, j) => 0.12 + j * 0.06 + r() * 0.05);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, n = r() * 2 - 1;
      let v = run(hp, n) * env(t, 0.0005, 0.02, d) * 0.8 + run(lp, n) * env(t, 0.002, 0.22, d) * 2.2;
      for (const [j, h] of bits.entries()) { const u = t - h; if (u > 0 && u < 0.05) v += run(bp, r() * 2 - 1) * Math.exp(-u / 0.01) * (1.6 - j * 0.08) + Math.sin(TAU * (220 + (j % 5) * 70) * u) * Math.exp(-u / 0.01) * 0.1; }
      x[i] = v;
    }
    return x;
  },
  // an iron door latch dropping into its catch: a metal clack with a short ring
  latch(r) {
    const d = 0.25, x = buf(d), bp = biquad("bp", 2400, 3);
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = run(bp, r() * 2 - 1) * env(t, 0.0005, 0.012, d) * 2 + (Math.sin(TAU * 1850 * t) * 0.3 + Math.sin(TAU * 3020 * t) * 0.15) * env(t - 0.004, 0.0005, 0.05, d) + run(bp, r() * 2 - 1) * env(t - 0.06, 0.0005, 0.008, d); }
    return x;
  },
  // Too Much Energy 02, the cinema (6 Nov 2026):
  // popcorn raining down onto seats and heads: dozens of tiny light dry ticks (band-passed clicks round 2.5-4 kHz, a
  // few ms each), thick at first and thinning out over d, with a few soft papery taps under them; no bass
  patter(r, d = 1.2) {
    const x = buf(d), bp = biquad("bp", 3200, 1.6), lo = biquad("bp", 900, 1.0), ticks = [];
    for (let k = 0; k < Math.round(d * 70); k++) { const u = Math.pow(r(), 1.8) * (d - 0.06); ticks.push([u, 0.35 + r() * 0.65, r() < 0.15]); }
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let eh = 0, es = 0;
      for (const [u, a, soft] of ticks) { const q = t - u; if (q > 0 && q < 0.03) { if (soft) es += Math.exp(-q / 0.008) * a; else eh += Math.exp(-q / 0.0028) * a; } }
      x[i] = run(bp, r() * 2 - 1) * eh * 1.8 + run(lo, r() * 2 - 1) * es * 1.2;
    }
    return x;
  },
  // a cinema seat's cushion springing up (or slammed down) against its frame: a padded woody clack (a hollow knock
  // round 650 Hz with a short low thump of the padding and a tiny metal tick of the hinge)
  seatclack(r) {
    const d = 0.3, x = buf(d), bp = biquad("bp", 650, 2.2), lp = biquad("lp", 260, 0.7), hp = biquad("hp", 3500, 0.8); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, n = r() * 2 - 1; p += TAU * (190 - 60 * Math.min(1, t / 0.08)) / SR;
      x[i] = run(bp, n) * env(t, 0.0006, 0.035, d) * 6 + Math.sin(p) * env(t, 0.002, 0.04, d) * 0.22 + run(lp, n) * env(t, 0.001, 0.02, d) * 0.4 + run(hp, n) * env(t - 0.012, 0.0005, 0.004, d) * 0.6;
    }
    return x;
  },
  // a horror film's jump-scare hit: a dissonant orchestra stab (a cluster of buzzy saw tones on top of a low boom),
  // full at once and dying over a second
  scarestab(r) {
    const d = 1.1, x = buf(d), lp = biquad("lp", 2600, 0.8), lb = biquad("lp", 140, 0.7); let pb = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let y = 0;
      for (const f of [155.6, 164.8, 233.1, 311.1, 329.6, 466.2]) y += ((t * f * (1 + 0.003 * Math.sin(TAU * 5.5 * t))) % 1) * 2 - 1;
      pb += TAU * (62 - 22 * Math.min(1, t / 0.4)) / SR;
      x[i] = run(lp, y * 0.3) * env(t, 0.004, 0.32, d) + Math.sin(pb) * env(t, 0.003, 0.2, d) * 0.3 + run(lb, r() * 2 - 1) * env(t, 0.001, 0.05, d) * 0.3;
    }
    return x;
  },
  // the hero wins: a brass swell, an E major chord of warm saw tones that grows over its first half (the filter opens
  // as it does) and holds bright to the end of d
  brassswell(r, d = 1.0) {
    const x = buf(d), f0 = [164.8, 207.7, 246.9, 329.6, 415.3];
    let lp = biquad("lp", 500, 0.8);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = Math.min(1, t / (d * 0.55));
      if (i % 64 === 0) lp = { ...biquad("lp", 500 + 2600 * k, 0.8), x1: lp.x1, x2: lp.x2, y1: lp.y1, y2: lp.y2 };
      let y = 0; for (const [j, f] of f0.entries()) y += ((t * f * (1 + 0.002 * Math.sin(TAU * (4.5 + j * 0.3) * t))) % 1) * 2 - 1;
      x[i] = run(lp, y * 0.2) * (0.25 + 0.75 * k) * Math.min(1, (d - t) / 0.08);
    }
    return x;
  },
  // Too Much Energy 03, camping at 6 am (7 Nov 2026):
  // a tent door's zip pulled fast: a rasp of zip teeth clicking over the slider (short bright clicks at a rate that
  // climbs from about 190 to 330 a second as the pull speeds up), a little nylon hiss under them and a tiny tick at
  // the end of the pull; d is the pull's length
  zip(r, d = 0.18) {
    const x = buf(d + 0.03), bp = biquad("bp", 2600, 1.6), body = biquad("bp", 1250, 1.1), hs = biquad("hp", 5000, 0.7);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, u = Math.min(1, t / d), rate = 190 + 140 * u, on = t < d ? Math.min(1, t / 0.012) * Math.min(1, (d - t) / 0.02) : 0;
      ph += rate / SR; const q = ph % 1, click = Math.exp(-q / 0.12) * (0.75 + 0.25 * r());
      const n = r() * 2 - 1;
      x[i] = (run(bp, n) * click * 2.2 + run(body, n) * click * 1.8 + run(hs, n) * 0.03) * on + run(body, n) * env(t - d, 0.0005, 0.006, d + 0.03) * 0.5;
    }
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
  // Bonfire Night (4 Nov 2026): a firework rocket going up, its burst, and a small weak one far off.
  // a rocket climbing: a whistle gliding up from about 900 Hz to 2.6 kHz with a fizzing spray of sparks under it,
  // swelling as it climbs; it stops dead at the top (the burst covers the cut); d is the climb's length
  rocket(r, d = 1.0) {
    const x = buf(d), hp = biquad("hp", 2800, 0.7), bp = biquad("bp", 1600, 0.6), sp = Array.from({ length: Math.round(d * 40) }, () => r() * d);
    let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, k = t / d, f = 900 + 1700 * k * k + 25 * Math.sin(TAU * 7 * t);
      p += (TAU * f) / SR;
      let c = 0; for (const h of sp) c += env(t - h, 0.0003, 0.003, d);
      const a = Math.min(1, t / 0.06) * (0.35 + 0.65 * k) * Math.min(1, (d - t) / 0.03);
      x[i] = (Math.sin(p) * 0.38 + run(bp, r() * 2 - 1) * 0.45 + run(hp, r() * 2 - 1) * (0.25 + c * 0.9)) * a;
    }
    return x;
  },
  // a firework shell bursting: a sharp crack, a deep boom with a punchy mid-range thump (so a phone speaker plays it),
  // then a long crackling shimmer of falling stars thinning out over a second and a half
  firework(r, d = 1.9) {
    const x = buf(d), hp = biquad("hp", 2200, 0.7), lp = biquad("lp", 180, 0.8), mid = biquad("bp", 420, 0.8), tk = biquad("hp", 3500, 0.8);
    const ticks = Array.from({ length: 70 }, (_, j) => 0.18 + Math.pow(j / 70, 1.6) * (d - 0.3) + r() * 0.03);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, n = r() * 2 - 1;
      let v = run(hp, n) * env(t, 0.0004, 0.014, d) * 3.2                       // the crack
        + Math.sin(TAU * (68 - 22 * Math.min(1, t / 0.4)) * t) * env(t, 0.002, 0.4, d) * 0.6   // the boom, sinking
        + run(lp, n) * env(t, 0.002, 0.28, d) * 1.0
        + run(mid, n) * env(t, 0.001, 0.12, d) * 3.0;                          // the thump in the phone band
      let c = 0; for (const [j, h] of ticks.entries()) c += env(t - h, 0.0003, 0.004, d) * (1 - j / 90);
      x[i] = v + run(tk, r() * 2 - 1) * c * 0.55 + run(tk, r() * 2 - 1) * 0.06 * Math.max(0, 1 - t / d) * Math.min(1, t / 0.2);
    }
    return x;
  },
  // a small weak firework far away: a dull little "pff" and a thin sputter that dies at once
  fizzle(r, d = 0.6) {
    const x = buf(d), bp = biquad("bp", 900, 0.9), hp = biquad("hp", 4000, 0.8), ticks = Array.from({ length: 7 }, () => 0.06 + r() * 0.35);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let c = 0; for (const h of ticks) c += env(t - h, 0.0003, 0.003, d);
      x[i] = run(bp, r() * 2 - 1) * env(t, 0.002, 0.06, d) * 2.6 + run(hp, r() * 2 - 1) * (0.15 * Math.max(0, 1 - t / 0.45) + c * 0.3);
    }
    return x;
  },
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
  // a person whistling an innocent little tune through the lips (never has money 01, 6 Nov 2026: Gunslinger whistling
  // while he nudges the bill away): a pure, breathy tone round 1.1-1.8 kHz, two jaunty bars of short notes with small
  // slides between them and a light vibrato on the long ones, soft breath noise under it
  whistletune(r, d = 1.8) {
    const x = buf(d), hp = biquad("bp", 1500, 1.2);
    // [start, length, Hz]: a sing-song "da-di-da, di-da-dee" in D major, a held note at the end of each bar
    const N = [[0, 0.16, 1175], [0.18, 0.12, 1319], [0.32, 0.12, 1480], [0.46, 0.34, 1175], [0.88, 0.12, 1319], [1.02, 0.12, 1175], [1.16, 0.14, 988], [1.32, d - 1.4, 1109]];
    let ph = 0, f0 = N[0][2];
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, n = N.find(([s, l]) => t >= s && t < s + l + 0.02), on = n ? Math.min(1, (t - n[0]) / 0.018, (n[0] + n[1] + 0.02 - t) / 0.035) : 0;
      if (n) f0 += (n[2] - f0) * 0.004;   // a little slide into each note
      const f = f0 * (1 + (n && n[1] > 0.3 ? 0.012 * Math.sin(TAU * 5.5 * (t - n[0])) * Math.min(1, (t - n[0]) / 0.15) : 0)); ph += TAU * f / SR;
      x[i] = (Math.sin(ph) * 0.62 + Math.sin(2 * ph) * 0.03 + run(hp, r() * 2 - 1) * 0.08) * Math.max(0, on);
    }
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

// a nature bed (assets/sfx/nature/<id>-<take>.ogg: real CC0 recordings or noise synthesis, -20 LUFS mono; README there) looped to the
// clip's length with a 1 s equal-power crossfade at each wrap, starting at a seeded point so two clips with the same bed
// don't start on the same bird; "take" pins one, else the seed picks
const NATURE = fileURLToPath(new URL("../assets/sfx/nature", import.meta.url));
export const NATURE_BEDS = ["birds", "stream", "lake", "waterfall", "wind", "leaves"];
function natureBed(o, seconds, seed) {
  if (!NATURE_BEDS.includes(o.id)) throw new Error(`sound.nature: unknown bed "${o.id}" (${NATURE_BEDS.join(", ")})`);
  const takes = fs.readdirSync(NATURE).filter((f) => f.startsWith(o.id + "-")).sort(), h = hash(`${o.id}/${seed}`);
  const file = o.take ? `${o.id}-${o.take}.ogg` : takes[h % takes.length];
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", path.join(NATURE, file), "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`sound.nature: can't decode ${file}`);
  const x = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
  const n = Math.ceil(seconds * SR), out = new Float32Array(n), xf = SR, m = x.length - xf, s0 = (h >>> 8) % Math.max(1, m - SR * 4);
  for (let i = 0; i < n; i++) {
    const k = (s0 + i) % m, wrap = k < xf && s0 + i >= m;   // after a wrap the take's tail (k + m) fades out as its head fades in
    out[i] = wrap ? x[k] * Math.sin((k / xf) * Math.PI / 2) + x[k + m] * Math.cos((k / xf) * Math.PI / 2) : x[k];
  }
  for (let i = 0; i < Math.min(n, 0.3 * SR); i++) out[i] *= i / (0.3 * SR);
  return out;
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
  } else if (type === "trail") { // a sunny forest (Phase 2, living world): leaves rustling in gusts, songbirds, a far woodpecker
    const hiss = biquad("bp", 3200, 0.5), body = biquad("bp", 900, 0.6), low = biquad("lp", 260, 0.7);
    for (let i = 0; i < n; i++) { const t = i / SR, gust = 0.55 + 0.45 * Math.sin(0.9 * t + 1.2); x[i] = run(hiss, r() * 2 - 1) * 0.1 * gust * gust + run(body, r() * 2 - 1) * 0.05 * gust + run(low, r() * 2 - 1) * 0.1; }
    // songbird phrases: three to six quick notes stepping round a pitch, with a trill on the last
    for (let k = 0; k < Math.floor(seconds / 1.8) + 1; k++) {
      let a = Math.round((0.3 + r() * (seconds - 1)) * SR); const f0 = 2600 + r() * 1600, notes = 3 + Math.floor(r() * 4), g = 0.06 + r() * 0.05;
      for (let j = 0; j < notes; j++) { const f = f0 * (1 + 0.18 * Math.sin(j * 2.1 + k)), d = 0.05 + r() * 0.05, tr = j === notes - 1 ? 38 : 0;
        for (let i = 0; i < d * SR && a + i < n; i++) { const t = i / SR; x[a + i] += Math.sin(TAU * (f + 400 * Math.sin(TAU * tr * t) + 600 * t / d) * t) * env(t, 0.004, d * 0.4, d) * g; }
        a += Math.round((d + 0.03 + r() * 0.04) * SR); }
    }
    const wp = 1 + r() * Math.max(0.5, seconds - 3); for (let j = 0; j < 9; j++) { const a = Math.round((wp + j * 0.055) * SR); for (let i = 0; i < 0.03 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += (Math.sin(TAU * 900 * t) * 0.5 + (r() * 2 - 1) * 0.5) * Math.exp(-t / 0.006) * 0.08 * (1 - j / 12); } }
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

// the living world's bed (set "life"): a soft breeze; every gust swells through the grass and leaves as it crosses
// the middle of the frame (x 0, the same gusts engine/page/set-life.js draws); songbird phrases until the first
// startle, then a held silence, then only a far-off bird; at each startle, a wing-burst per nearby bird (a sparrow's
// take-off: a fast flutter of soft feathered beats, bright and short) and one alarm chirp
function lifeBed(L, sb, r, fade = 0.3) {
  const seconds = sb.duration, x = buf(seconds), n = x.length;
  const low = biquad("lp", 320, 0.7), body = biquad("bp", 700, 0.5), hiss = biquad("bp", 3400, 0.6);
  const gusts = L.wind.gusts.map((G) => ({ t: G.tc, s: G.s, w: Math.max(0.5, G.w / L.wind.speed) }));
  for (let i = 0; i < n; i++) {
    const t = i / SR; let g = L.wind.calm;
    for (const G of gusts) { const d = (t - G.t) / G.w; g += G.s * Math.exp(-d * d); }
    x[i] = run(low, r() * 2 - 1) * 0.1 + run(body, r() * 2 - 1) * 0.06 * g * g + run(hiss, r() * 2 - 1) * 0.07 * g * g;
  }
  if (L.storm) {
    // a storm: the wind's roar rides the gusts (a deeper body and a howl that rises with each one), and the rain's
    // even hiss with soft drops on the leaves
    const roar = biquad("lp", 260, 0.8), howl = biquad("bp", 520, 3), rain = biquad("hp", 2500, 0.7), lo = biquad("lp", 7000, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR; let g = L.wind.calm;
      for (const G of gusts) { const d = (t - G.t) / G.w; g += G.s * Math.exp(-d * d); }
      x[i] += run(roar, r() * 2 - 1) * 0.12 * g + run(howl, r() * 2 - 1) * 0.05 * g * g * 0.5;
      if (L.rain) x[i] += run(lo, run(rain, r() * 2 - 1)) * 0.07;
    }
  }
  // rain (a storm's, or a rainy place's light rain): an even hiss with soft drops on the leaves
  if (L.rain) {
    if (!L.storm) { const rain = biquad("hp", 2500, 0.7), lo = biquad("lp", 7000, 0.7); for (let i = 0; i < n; i++) x[i] += run(lo, run(rain, r() * 2 - 1)) * 0.05; }
    for (let k = 0; k < seconds * (L.storm ? 40 : 20); k++) { const a = Math.round(r() * (n - 0.02 * SR)), f = 2500 + r() * 3000, gg = 0.02 + r() * 0.04;
      for (let i = 0; i < 0.012 * SR; i++) { const t = i / SR; x[a + i] += Math.sin(TAU * f * t) * Math.exp(-t / 0.002) * gg; } }
  }
  const quiet = L.startle.length ? Math.min(...L.startle.map((s) => s.t)) : Infinity;
  const phrase = (t0, f0, g) => {
    let a = Math.round(t0 * SR); const notes = 3 + Math.floor(r() * 4);
    for (let j = 0; j < notes; j++) { const f = f0 * (1 + 0.18 * Math.sin(j * 2.1 + t0)), d = 0.05 + r() * 0.05, tr = j === notes - 1 ? 38 : 0;
      for (let i = 0; i < d * SR && a + i < n; i++) { const t = i / SR; x[a + i] += Math.sin(TAU * (f + 400 * Math.sin(TAU * tr * t) + 600 * t / d) * t) * env(t, 0.004, d * 0.4, d) * g; }
      a += Math.round((d + 0.03 + r() * 0.04) * SR); }
  };
  if (L.song) {
    for (let t = 0.2 + r() * 0.5; t < Math.min(seconds - 0.5, quiet - 0.3); t += 0.9 + r() * 1.1) phrase(t, 2600 + r() * 1600, (0.05 + r() * 0.05) * L.song);
    // after the scare: 3 s of nothing, then one far bird (quiet, duller)
    for (let t = quiet + 3 + r(); t < seconds - 0.6; t += 2 + r() * 2) phrase(t, 2300 + r() * 800, 0.02 * L.song);
  }
  const nb = L.birds.reduce((k, b) => k + (b.flock ? b.flock.n ?? 5 : 1), 0);
  for (const S of L.startle) {
    for (let b = 0; b < nb; b++) {
      const t0 = S.t + LOOK + 0.02 + r() * 0.15, beats = 7 + Math.floor(r() * 5), rate = 14 + r() * 4, g = (0.22 + r() * 0.12) * S.loud * S.wings, bp = biquad("bp", 1800 + r() * 1400, 0.9);
      for (let k = 0; k < beats; k++) {
        const a = Math.round((t0 + k / rate) * SR), fall = 1 - k / (beats + 2);
        for (let i = 0; i < 0.05 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += run(bp, r() * 2 - 1) * env(t, 0.004, 0.012, 0.05) * g * fall; }
      }
    }
    const a = Math.round((S.t + LOOK - 0.04) * SR);   // one alarm chirp, as the first one goes: a hard little "chrrt"
    for (let i = 0; i < 0.12 * SR && a + i < n; i++) { const t = i / SR; x[a + i] += Math.sin(TAU * (3600 - 900 * t / 0.12) * t) * (0.5 + 0.5 * Math.sign(Math.sin(TAU * 55 * t))) * env(t, 0.003, 0.03, 0.12) * 0.12; }
  }
  for (let i = 0; i < Math.min(n, fade * SR); i++) { x[i] *= i / (fade * SR); x[n - 1 - i] *= i / (fade * SR); }
  for (let i = 0; i < n; i++) x[i] *= 3;
  return x;
}

// ---------- the storyboard -> sound events ----------
// chars: the character files (loaded from the storyboard when not given); the signature sounds need them to know
// where each lead is
export function soundEvents(sb, chars) {
  sb = soundClock(sb);   // hit-stops: sounds on the video's clock (engine/shared/holds.js)
  const cfg = { auto: true, ...(sb.sound || {}) }, ev = [];
  const panOf = (who) => { const c = sb.cast.find((x) => x.id === who); return c ? Math.max(-0.3, Math.min(0.3, c.at[0] * 0.4)) : 0; }; // gentle pan: most people watch on one phone speaker
  if (cfg.auto !== false) {
    const hats = {};
    for (const a of [...(sb.actions || [])].sort((p, q) => p.at - q.at)) {
      const pan = panOf(a.who), d = a.dur ?? 0.3;
      if (a.do === "talk") ev.push({ kind: "voice", at: a.at, action: a, who: a.who, pan });
      // a hop with `quiet` (a startle) gets no hop and land sounds
      if (a.do === "hop" && !a.quiet) { const n = a.count ?? 1, qa = hopCrouch(d, n); for (let k = 0; k < n; k++) { ev.push({ kind: "hop", at: a.at + ((k + qa) * d) / n, pan, gain: 0.32 }); ev.push({ kind: "land", at: a.at + ((k + 1) * d) / n, pan, gain: 0.4 }); } }
      if (a.do === "swap") ev.push({ kind: "pop", at: a.at + 0.03, pan, gain: 0.45 });
      if (a.do === "charge" && (a.to ?? 1) > 0.3 && !a.quiet) ev.push({ kind: "charge", at: a.at, dur: d, pan, gain: 0.28 });
      // quiet: no sound (a hat torn off by the wind, keyed frame by frame from its physics: Never Looks Up 07)
      if (a.do === "hat" && !a.quiet) {
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
      if (f.do === "impact") ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55, ...(f.loud ? { loud: true } : {}) });
      // sound: false keeps a flash silent too (a camera flash with its own "flash" click, Ok I Lied)
      if (f.do === "flash" && f.sound !== false && !impacts.some((a) => Math.abs(a - f.at) < 0.25)) ev.push({ kind: "impact", at: f.at, pan: 0, gain: 0.55 });
      // sound: false keeps a poof silent (dust on a landing that has its own named sound; the poof has a chime)
      if (f.do === "poof" && f.sound !== false) ev.push({ kind: "poof", at: f.at, pan: f.who ? panOf(f.who) : 0, gain: 0.5 });
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
  for (const s of sb.sfx || []) if (!(s.sound === "wings" && flaps.some((t) => t >= s.at && t <= s.at + (s.dur ?? 2)))) ev.push({ kind: s.sound, at: s.at, dur: s.dur, pan: s.pan ?? 0, gain: s.gain ?? (isSignature(s.sound) ? signatureGain(s.sound) : isLibrarySound(s.sound) && !SFX[s.sound] ? 1 : 0.4), ...(s.speech ? { speech: s.speech } : {}), ...(s.loud ? { loud: true } : {}) });
  return ev.sort((p, q) => p.at - q.at);
}

// recorded foley from the sound library: a footstep on every footfall of a walk (the same phase the legs use in
// page/potato.js, softer while the walk eases in and out), a grab when the hand closes (not for props already in hand
// at the start), a creak when someone sits. Not while flying or hovering, and no footsteps if the storyboard places
// its own. A release stays silent: it may be a throw, a drop or a hand-over, so the storyboard names that sound.
// footfalls of a natural-gait walk: the times its phase passes a whole or half cycle (a foot touching down), and how far
// into the walk it is (amt, softer while it speeds up and slows down)
function natSteps(sb, a) {
  const actor = (sb.cast || []).find((c) => c.id === a.who);
  if (!actor) return [];
  const out = [], d = a.dur ?? 0.3, dt = 1 / 240;
  let prev = null;
  for (let u = dt; u < d - 0.02; u += dt) {
    const g = actorState(sb, actor, {}, a.at + u, true).gait;
    if (!g) continue;
    if (prev != null && Math.floor(g.ph * 2) > Math.floor(prev * 2)) out.push({ at: a.at + u, amt: g.amt });
    prev = g.ph;
  }
  return out;
}

function foley(sb, panOf) {
  const ev = [], step = surfaceOf(sb), ownSteps = (sb.sfx || []).some((s) => /^step/.test(s.sound));
  const acts = [...(sb.actions || [])].sort((p, q) => p.at - q.at), air = {};
  // the planted gait (timeline.js, "motion": { "feet": 2 }): a footstep on each real touch down, softer for a short
  // shuffle step and lighter in a run (its own steps replace the per-move ones below)
  const planted = feetOn(sb) && !ownSteps;
  if (planted) for (const c of sb.cast || []) for (const f of footfalls(sb, c)) {
    if (f.at > (sb.storyDuration ?? sb.duration ?? Infinity)) continue;
    ev.push({ kind: step, at: f.at, pan: panOf(c.id), gain: (f.run ? 0.75 : 1) * (0.5 + 0.5 * Math.min(1, f.len / 0.15)) });
  }
  for (const a of acts) {
    const pan = panOf(a.who), d = a.dur ?? 0.3;
    if (a.do === "fly" || a.do === "hover") air[a.who] = true;
    if (a.do === "drop") air[a.who] = false;
    if (a.do === "move" && !ownSteps && !planted && !air[a.who] && (a.steps ?? 2.2) > 0) {
      // the walk phase advances `steps` cycles a second and a foot lands every half cycle; quick little steps (a run)
      // are lighter, or a dash off screen turns into a drum roll
      const rate = a.steps ?? 2.2, per = 0.5 / rate, light = Math.min(1, Math.sqrt(2.5 / rate));
      // natural gait (timeline.js natMove): the feet land where the walk's own phase crosses each half cycle
      if (naturalOf(sb)?.gait && (!a.ease || a.ease === "inOut")) { for (const f of natSteps(sb, a)) ev.push({ kind: step, at: f.at, pan, gain: light * (0.55 + 0.45 * f.amt) }); continue; }
      for (let t = per; t < d - 0.02; t += per) ev.push({ kind: step, at: a.at + t, pan, gain: light * (0.55 + 0.45 * Math.min(1, Math.min(t / d, 1 - t / d) * 8)) });
    }
    // a toe tap: a soft footstep on each slap (timeline.js TAP_AT), on the set's floor
    if (a.do === "tap" && !ownSteps) for (let i = 0; i < (a.count ?? 3); i++) ev.push({ kind: step, at: a.at + (i + TAP_AT) * (a.every ?? 0.3), pan, gain: 0.35 * (a.gain ?? 1) });
    if (a.do === "grab" && a.at > 0.05 && !a.quiet) ev.push({ kind: "grab", at: a.at + (a.dur ?? 0.25) * 0.7, pan, gain: 1 });
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

// opts (engine/sfx/guard.mjs, the spike guard; leave them out for the mix as it always was):
//   fxGain: [k per event]  each effect's gain times k (its index in `events`; the guard's cap)
//   norm: false            no peak scaling at the end (the guard levels and limits the whole mix itself)
//   stems: true            also return { stems: { voice, fx, bed } } (each { L, R }, the room's reverb included)
export function renderAudio(sb, chars, opts = {}) {
  sb = soundClock(sb);
  const cfg = { voice: 1, sfx: 1, reverb: 0.12, ...(sb.sound || {}) };
  const seed = cfg.seed ?? hashStr(seedOf(sb) || "clip");
  const voices = new Bus(sb.duration), fx = new Bus(sb.duration), r = rng(seed);
  const rl = rng(seed ^ 0x2545f491); // library takes draw their own numbers, so adding foley leaves the code effects as they were
  const events = soundEvents(sb, chars);
  for (const [ei, e] of events.entries()) {
    if (opts.fxGain && opts.fxGain[ei] != null && opts.fxGain[ei] !== 1) e.gain *= opts.fxGain[ei];
    // a talk action's gain scales its line (a shout, a mumble across the room); 1 = as the voice is set
    if (e.kind === "voice" && e.action.speech) voices.add(e.at, speechSamples(e.action.speech.id), 0.5 * cfg.voice * (e.action.gain ?? 1), e.pan); // real speech (engine/voice/)
    else if (e.kind === "voice") {
      const c = sb.cast.find((x) => x.id === e.who), def = chars[c.character] || {};
      voice(voices, e.action, typeof def.voice === "object" ? def.voice : {}, e.pan, 0.5 * cfg.voice * (e.action.gain ?? 1));
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
  // set "life" (engine/shared/life.js): the bed follows the living world: each gust heard as it crosses, birdsong
  // that stops at a startle, the flock's wing-burst when it leaves
  const life = lifeSpec(sb.set, sb.duration);
  if (amb > 0) bed.add(0, life ? lifeBed(life, sb, rng(seed ^ 0x5bd1e995), cfg.bedFade ?? 0.3) : ambience(sb.set?.type, sb.duration, rng(seed ^ 0x5bd1e995), cfg.bedFade ?? 0.3), amb, 0);
  // nature beds (Pebble's calm videos, Jonny 6 Nov 2026: birds, water, wind, leaves to match the scenery):
  // "sound": { "nature": ["birds", { "id": "stream", "gain": 0.12, "take": 2, "pan": -0.3 }] }
  for (const [k, n] of (cfg.nature || []).entries()) { const o = typeof n === "string" ? { id: n } : n; bed.add(0, natureBed(o, sb.duration, seed + k), o.gain ?? 0.14, o.pan ?? 0); }
  if (cfg.engine) bed.add(0, engineSound(cfg.engine, sb.duration, rng(seed ^ 0x27d4eb2d)), cfg.engine.gain ?? 0.3, cfg.engine.pan ?? 0);
  // pause time (engine/shared/pause.js): the world's own sound stops with it (the wind, the birdsong, the room) and
  // comes back when it carries on: out over 60 ms at the pause's start, back over 150 ms at its end (the music has
  // its own "hush" parts, the effects and voices play on)
  for (const w of pausesOf(sb) || []) {
    const a = Math.max(0, Math.floor(w.from * SR)), b = Math.min(bed.n, Math.ceil((w.to + 0.15) * SR));
    for (let i = a; i < b; i++) {
      const t = i / SR, g = t < w.to ? Math.max(0, 1 - (t - w.from) / 0.06) : Math.min(1, (t - w.to) / 0.15);
      bed.L[i] *= g; bed.R[i] *= g;
    }
  }
  const L = new Float32Array(voices.n), R = new Float32Array(voices.n);
  let peak = 0;
  for (let i = 0; i < L.length; i++) {
    L[i] = voices.L[i] + fx.L[i] + bed.L[i] + wv.L[i] + wf.L[i]; R[i] = voices.R[i] + fx.R[i] + bed.R[i] + wv.R[i] + wf.R[i];
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  if (peak > 0.89 && opts.norm !== false) { const g = 0.89 / peak; for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; } }
  const out = { L, R, sr: SR, events, peak, room: room.name };
  if (opts.stems) {
    const sum = (a, b) => { const o = new Float32Array(a.length); for (let i = 0; i < o.length; i++) o[i] = a[i] + b[i]; return o; };
    out.stems = { voice: { L: sum(voices.L, wv.L), R: sum(voices.R, wv.R) }, fx: { L: sum(fx.L, wf.L), R: sum(fx.R, wf.R) }, bed: { L: bed.L, R: bed.R } };
  }
  return out;
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
