// A placeholder dance beat, synthesised in code: kick, clap, hats, bass and chord stabs on a four-chord loop.
// It is there so a dance clip has something to move to; on TikTok the clip is posted with the trend's own sound
// (render with --no-music for a version without it). Deterministic: the same `music` block gives the same audio.
//
// music: { bpm, offset (s, where beat 0 falls), gain, parts: [{ at (s), part }] }
//   part: "intro" (hats, soft kick, chords) | "main" (everything) | "build" (snare roll and riser, no kick)
//         | "drop" (main with a crash on its first beat) | "stop" (silence: the record-scratch beat)
const SR = 44100, TAU = Math.PI * 2;

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
function onePole(cut) { const a = Math.exp(-TAU * cut / SR); let y = 0; return (x) => (y = (1 - a) * x + a * y); }

const INST = {
  kick(r) { const d = 0.32, x = new Float32Array(d * SR); let p = 0; for (let i = 0; i < x.length; i++) { const t = i / SR, f = 48 + 110 * Math.exp(-t / 0.035); p += TAU * f / SR; x[i] = Math.sin(p) * Math.exp(-t / 0.16) + (i < 90 ? (r() * 2 - 1) * 0.25 * (1 - i / 90) : 0); } return x; },
  clap(r) {
    const d = 0.25, x = new Float32Array(d * SR), lp = onePole(4500), hp = onePole(900);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, n = r() * 2 - 1, band = lp(n) - hp(n);
      const e = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) / (o === 0.022 ? 0.09 : 0.006)) : 0), 0);
      x[i] = band * e * 1.6 + Math.sin(TAU * 196 * t) * Math.exp(-t / 0.03) * 0.25;
    }
    return x;
  },
  hat(r, open) { const d = open ? 0.2 : 0.06, x = new Float32Array(d * SR), lp = onePole(6500); for (let i = 0; i < x.length; i++) { const t = i / SR, n = r() * 2 - 1; x[i] = (n - lp(n)) * Math.exp(-t / (open ? 0.07 : 0.018)); } return x; },
  snare(r) { const d = 0.16, x = new Float32Array(d * SR), lp = onePole(6000); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = lp(r() * 2 - 1) * Math.exp(-t / 0.05) + Math.sin(TAU * 220 * t) * Math.exp(-t / 0.04) * 0.4; } return x; },
  bass(r, note, len) { const d = len, x = new Float32Array(Math.ceil(d * SR)), f = midi(note), lp = onePole(420); let p = 0; for (let i = 0; i < x.length; i++) { const t = i / SR; p += f / SR; const saw = (p % 1) * 2 - 1; x[i] = (Math.sin(TAU * p) * 0.8 + lp(saw) * 0.6) * Math.min(1, t / 0.004) * Math.exp(-t / (d * 0.7)); } return x; },
  stab(r, notes) {
    const d = 0.26, x = new Float32Array(d * SR), lp = onePole(1900), ph = notes.map(() => 0);
    for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; notes.forEach((n, j) => { for (const det of [0.997, 1.003]) { ph[j] += midi(n) * det / SR / 2; y += ((ph[j] % 1) * 2 - 1) * 0.5; } }); x[i] = lp(y) * Math.min(1, t / 0.003) * Math.exp(-t / 0.08) * 0.5; }
    return x;
  },
  crash(r) { const d = 1.6, x = new Float32Array(d * SR), lp = onePole(3500); for (let i = 0; i < x.length; i++) { const t = i / SR, n = r() * 2 - 1; x[i] = (n - lp(n)) * Math.exp(-t / 0.5) * (t < 0.002 ? t / 0.002 : 1); } return x; },
  riser(r, len) {
    const d = len, x = new Float32Array(Math.ceil(d * SR)); let lo = 0, hi = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, cut = 300 + 7000 * k * k, a = Math.exp(-TAU * cut / SR), b = Math.exp(-TAU * cut * 0.5 / SR), n = r() * 2 - 1; lo = (1 - a) * n + a * lo; hi = (1 - b) * n + b * hi; x[i] = (lo - hi) * (0.2 + 0.8 * k * k) * 1.4; }
    return x;
  },
};

// C - G - Am - F, one chord a bar
const CHORDS = [{ root: 36, notes: [60, 64, 67] }, { root: 43, notes: [59, 62, 67] }, { root: 45, notes: [57, 60, 64] }, { root: 41, notes: [57, 60, 65] }];

export function renderBeat(music, duration) {
  const n = Math.ceil(duration * SR), L = new Float32Array(n), R = new Float32Array(n), r = mulberry(777);
  const add = (t, x, g, pan = 0) => { const a = Math.round(t * SR), p = (pan + 1) * Math.PI / 4, gl = Math.cos(p) * g, gr = Math.sin(p) * g; for (let i = 0; i < x.length; i++) { const k = a + i; if (k < 0 || k >= n) continue; L[k] += x[i] * gl; R[k] += x[i] * gr; } };
  const bpm = music.bpm || 120, spb = 60 / bpm, off = music.offset || 0;
  const parts = (music.parts || [{ at: 0, part: "main" }]).slice().sort((a, b) => a.at - b.at);
  const partAt = (t) => { let p = null; for (const q of parts) if (q.at <= t + 1e-6) p = q; return p; };
  // the building blocks are cached: each hit of the same drum is the same sound
  const K = INST.kick(r), C = INST.clap(r), H = INST.hat(r, false), HO = INST.hat(r, true), S = INST.snare(r);
  for (let b = Math.floor(-off / spb); off + b * spb < duration; b++) {
    for (let e = 0; e < 4; e++) {   // sixteenth notes
      const t = off + (b + e / 4) * spb;
      if (t < 0 || t >= duration) continue;
      const P = partAt(t); if (!P) continue;
      const part = P.part, bar = Math.floor(b / 4), beatInBar = ((b % 4) + 4) % 4, ch = CHORDS[((bar % 4) + 4) % 4];
      if (part === "stop") continue;
      if (part === "build") {
        // a snare roll that doubles up towards the drop, and a riser across the whole build
        const len = (parts[parts.indexOf(P) + 1]?.at ?? duration) - P.at, k = (t - P.at) / Math.max(0.01, len);
        const every = k < 0.5 ? 2 : 1;
        if (e % every === 0) add(t, S, 0.25 + 0.35 * k);
        if (Math.abs(t - P.at) < 1e-6) add(t, INST.riser(r, len), 0.35);
        continue;
      }
      const full = part === "main" || part === "drop";
      if (e === 0) {
        if (full || beatInBar === 0) add(t, K, part === "intro" ? 0.5 : 0.95);
        if (full && (beatInBar === 1 || beatInBar === 3)) add(t, C, 0.55, 0.05);
        if (part === "drop" && Math.abs(t - P.at) < 0.02) add(t, INST.crash(r), 0.35, -0.1);
        add(t, INST.bass(r, ch.root + (beatInBar === 3 ? 12 : 0), spb * 0.45), full ? 0.5 : 0.25);
      }
      if (e === 2) {
        add(t, (b % 2 ? HO : H), 0.2, 0.25);
        add(t, INST.stab(r, ch.notes), full ? 0.28 : 0.18, -0.15);
        if (full && beatInBar === 1) add(t, K, 0.6);   // the "and" of two: a pushed kick
      }
      if (e % 2 === 1) add(t, H, full ? 0.14 : 0.09, 0.3);
    }
  }
  return { L, R };
}
