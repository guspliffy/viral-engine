// Background music, synthesised in code: drums, bass, chords and a short lead motif. Every clip gets its own
// variation, picked from a seed (the storyboard id by default): key, chord progression, tempo, groove style,
// chord and lead instruments, and swing. The vibe stays the same: upbeat, bouncy, cartoon. On TikTok a clip can
// also be posted with a trend sound instead (puppet: --no-music; 3D: "music": false).
// Deterministic: the same `music` block and seed give the same audio.
//
// music: { bpm?, offset (s, where beat 0 falls), gain, seed?, style?, key?, parts: [{ at (s), part }] }
//   bpm: fixed when moves sync to it (dance clips); otherwise picked from the seed (108-132)
//   style: house | disco | bounce | funk | chip | sneaky | lofi | march | warm (default: from the seed)
//   styles: a pool for the seed to pick from (e.g. ["sneaky", "march", "warm"]); key: semitones from C;
//   progression: an index into PROGRESSIONS or scale degrees ([0, 4, 5, 3]); lead: bell | blip | whistle;
//   drums: false for no drums
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
  // chord voicings in other colours: square (chiptune), soft pluck (funk/bounce), organ-ish (disco)
  square(r, notes) { const d = 0.22, x = new Float32Array(d * SR), ph = notes.map(() => 0), lp = onePole(3200); for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; notes.forEach((n, j) => { ph[j] += midi(n) / SR; y += (ph[j] % 1 < 0.5 ? 1 : -1) * 0.33; }); x[i] = lp(y) * Math.min(1, t / 0.002) * Math.exp(-t / 0.07) * 0.5; } return x; },
  pluck(r, notes) { const d = 0.35, x = new Float32Array(d * SR), ph = notes.map(() => 0); for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; notes.forEach((n, j) => { ph[j] += midi(n) / SR; y += Math.sin(TAU * ph[j]) + 0.3 * Math.sin(TAU * 2 * ph[j]) * Math.exp(-t / 0.05); }); x[i] = y / notes.length * Math.min(1, t / 0.002) * Math.exp(-t / 0.12) * 0.9; } return x; },
  organ(r, notes) { const d = 0.3, x = new Float32Array(d * SR), ph = notes.map(() => 0); for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; notes.forEach((n, j) => { ph[j] += midi(n) / SR; y += Math.sin(TAU * ph[j]) + 0.5 * Math.sin(TAU * 2 * ph[j]) + 0.25 * Math.sin(TAU * 4 * ph[j]); }); x[i] = y / notes.length * 0.45 * Math.min(1, t / 0.006) * (t > d - 0.04 ? (d - t) / 0.04 : 1); } return x; },
  // lead notes: a bell, a square blip or a whistle-like sine
  lead(r, note, kind) {
    const d = kind === "bell" ? 0.4 : 0.16, x = new Float32Array(d * SR), f = midi(note); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; p += f / SR;
      const y = kind === "bell" ? Math.sin(TAU * p + 1.8 * Math.sin(TAU * p * 3.5) * Math.exp(-t / 0.15)) * Math.exp(-t / 0.18)
        : kind === "blip" ? (p % 1 < 0.25 ? 1 : -1) * 0.5 * Math.exp(-t / 0.06)
        : Math.sin(TAU * p * (1 + 0.006 * Math.sin(TAU * 6 * t))) * Math.min(1, t / 0.02) * Math.exp(-t / 0.12);
      x[i] = y * Math.min(1, t / 0.002) * 0.5;
    }
    return x;
  },
  crash(r) { const d = 1.6, x = new Float32Array(d * SR), lp = onePole(3500); for (let i = 0; i < x.length; i++) { const t = i / SR, n = r() * 2 - 1; x[i] = (n - lp(n)) * Math.exp(-t / 0.5) * (t < 0.002 ? t / 0.002 : 1); } return x; },
  riser(r, len) {
    const d = len, x = new Float32Array(Math.ceil(d * SR)); let lo = 0, hi = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, k = t / d, cut = 300 + 7000 * k * k, a = Math.exp(-TAU * cut / SR), b = Math.exp(-TAU * cut * 0.5 / SR), n = r() * 2 - 1; lo = (1 - a) * n + a * lo; hi = (1 - b) * n + b * hi; x[i] = (lo - hi) * (0.2 + 0.8 * k * k) * 1.4; }
    return x;
  },
};

// chord progressions as scale degrees in a major key (minor ones start on vi); one chord a bar
const TRIAD = (deg) => { const sc = [0, 2, 4, 5, 7, 9, 11], st = (k) => sc[((k % 7) + 7) % 7] + 12 * Math.floor(k / 7); return { root: 36 + st(deg), notes: [60 + st(deg), 60 + st(deg + 2), 60 + st(deg + 4)].map((n) => (n > 69 ? n - 12 : n)) }; };
const PROGRESSIONS = [[0, 4, 5, 3], [5, 3, 0, 4], [0, 5, 3, 4], [0, 3, 0, 4], [1, 4, 0, 5], [3, 4, 2, 5], [0, 2, 3, 4], [5, 4, 3, 4]];
// groove styles: which sixteenth steps (0-15 in a bar) each part plays on, the tempo range and the instruments
const STYLE = {
  house:  { bpm: [118, 128], kick: [0, 4, 8, 12], clap: [4, 12], hatOpen: [2, 6, 10, 14], hat: "odd", bass: [0, 12], chord: [2, 6, 10, 14], chordInst: "stab" },
  disco:  { bpm: [112, 124], kick: [0, 4, 8, 12], clap: [4, 12], hatOpen: [2, 6, 10, 14], hat: "odd", bass: [0, 2, 4, 6, 8, 10, 12, 14], bassLen: 0.22, octaves: "alt", chord: [2, 6, 10, 14], chordInst: "organ" },
  bounce: { bpm: [92, 104], kick: [0, 7, 10], clap: [8], hatOpen: [], hat: "all", bass: [0, 7, 10], chord: [0, 6], chordInst: "pluck", swing: true },
  funk:   { bpm: [100, 112], kick: [0, 3, 6, 10, 14], snare: [4, 12], hatOpen: [6, 14], hat: "odd", bass: [0, 3, 6, 8, 11, 14], bassLen: 0.22, octaves: "funk", chord: [2, 5, 10, 13], chordInst: "pluck", swing: true },
  chip:   { bpm: [120, 140], kick: [0, 6, 8, 11], snare: [4, 12], hatOpen: [], hat: "odd", bass: [0, 4, 8, 12], chord: [0, 3, 6, 10, 12], chordInst: "square" },
  // comedy flavours
  sneaky: { bpm: [96, 110], kick: [0, 8], snare: [], hatOpen: [], hat: "odd", bass: [0, 4, 8, 12], bassLen: 0.12, walk: true, chord: [2, 10], chordInst: "pluck", minor: true },
  lofi:   { bpm: [78, 90], kick: [0, 7, 10], snare: [8], hatOpen: [], hat: "even", bass: [0, 10], chord: [0], chordInst: "organ", swing: true, soft: true },
  march:  { bpm: [104, 116], kick: [0, 8], snare: [4, 12, 14], hatOpen: [], hat: "none", bass: [0, 8], fifths: true, chord: [4, 12], chordInst: "stab" },
  warm:   { bpm: [96, 108], kick: [0, 8], snare: [], hatOpen: [], hat: "even", bass: [0, 8], chord: [0, 6, 8], chordInst: "organ", soft: true },
};
export const STYLES = Object.keys(STYLE);
const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// what a clip's variations are seeded from: "seed" when the storyboard pins one, else its experiment episode (so the
// variants of one episode share their music while different episodes still differ), else the clip's id. Renaming a
// clip or a variant then changes nothing.
export const seedOf = (sb) => sb.seed ?? (sb.experiment ? `${sb.experiment.id}/${sb.experiment.episode ?? ""}` : sb.id);

// everything that varies from clip to clip, picked from the seed; any of it can be pinned in the music block
export function musicFlavour(music = {}, id = "") {
  const seed = music.seed ?? hashStr(String(id)), r = mulberry(seed);
  const pool = music.styles || STYLES;            // e.g. ["sneaky", "march", "warm"] to stay within a vibe
  const style = music.style || pool[Math.floor(r() * pool.length)], S = STYLE[style];
  if (!S) throw new Error(`music.style "${style}" unknown (known: ${STYLES.join(", ")})`);
  const key = music.key ?? Math.floor(r() * 12) - 5;    // semitones from C, -5..+6
  let prog = PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)];
  if (S.minor && prog[0] !== 5) prog = [5, 3, 4, 5];
  if (Array.isArray(music.progression)) prog = music.progression;   // scale degrees 0-6, one chord a bar
  else if (Number.isInteger(music.progression)) prog = PROGRESSIONS[music.progression % PROGRESSIONS.length];
  const bpm = music.bpm || Math.round(S.bpm[0] + r() * (S.bpm[1] - S.bpm[0]));
  const leadInst = music.lead ?? ["bell", "blip", "whistle"][Math.floor(r() * 3)];
  const swing = S.swing ? 0.06 + r() * 0.08 : r() * 0.03;
  const penta = [0, 2, 4, 7, 9, 12, 14], motif = Array.from({ length: 8 }, () => (r() < 0.3 ? null : 72 + penta[Math.floor(r() * penta.length)]));
  return { seed, style, key, prog, bpm, leadInst, swing, motif, drums: music.drums !== false, S };
}

export function renderBeat(music, duration, id = "") {
  const n = Math.ceil(duration * SR), L = new Float32Array(n), R = new Float32Array(n);
  const F = musicFlavour(music, id), r = mulberry(F.seed ^ 0x5bd1e995);
  const add = (t, x, g, pan = 0) => { const a = Math.round(t * SR), p = (pan + 1) * Math.PI / 4, gl = Math.cos(p) * g, gr = Math.sin(p) * g; for (let i = 0; i < x.length; i++) { const k = a + i; if (k < 0 || k >= n) continue; L[k] += x[i] * gl; R[k] += x[i] * gr; } };
  const bpm = F.bpm, spb = 60 / bpm, off = music.offset || 0;
  const parts = (music.parts || [{ at: 0, part: "main" }]).slice().sort((a, b) => a.at - b.at);
  const partAt = (t) => { let p = null; for (const q of parts) if (q.at <= t + 1e-6) p = q; return p; };
  const chordAt = (bar) => { const c = TRIAD(F.prog[((bar % 4) + 4) % 4]); return { root: c.root + F.key, notes: c.notes.map((x) => x + F.key) }; };
  // the building blocks are cached: each hit of the same drum is the same sound
  const K = INST.kick(r), C = INST.clap(r), H = INST.hat(r, false), HO = INST.hat(r, true), S = INST.snare(r);
  const chord = (notes) => INST[F.S.chordInst](r, notes);
  for (let b = Math.floor(-off / spb); off + b * spb < duration; b++) {
    for (let e = 0; e < 4; e++) {   // sixteenth notes; odd ones are pushed late by the swing
      const t = off + (b + e / 4 + (e % 2 ? F.swing / 4 : 0)) * spb;
      if (t < 0 || t >= duration) continue;
      const P = partAt(t); if (!P) continue;
      const part = P.part, bar = Math.floor(b / 4), beatInBar = ((b % 4) + 4) % 4, ch = chordAt(bar);
      if (part === "stop" || part === "hush") continue;   // hush: a silent stretch the music comes back from (engine/music.mjs
      // treats only "stop" as the end of the music)
      if (part === "build") {
        // a snare roll that doubles up towards the drop, and a riser across the whole build
        const len = (parts[parts.indexOf(P) + 1]?.at ?? duration) - P.at, k = (t - P.at) / Math.max(0.01, len);
        const every = k < 0.5 ? 2 : 1;
        if (e % every === 0) add(t, S, 0.25 + 0.35 * k);
        if (Math.abs(t - P.at) < 1e-6) add(t, INST.riser(r, len), 0.35);
        continue;
      }
      const full = part === "main" || part === "drop", step = beatInBar * 4 + e, Y = F.S, soft = Y.soft ? 0.6 : 1;
      if (part === "drop" && e === 0 && Math.abs(t - P.at) < 0.02) add(t, INST.crash(r), 0.35, -0.1);
      if (F.drums) {
        if (Y.kick.includes(step) && (full || step === 0)) add(t, K, (part === "intro" ? 0.5 : 0.95) * soft);
        if (full && (Y.clap || []).includes(step)) add(t, C, 0.55 * soft, 0.05);
        if (full && (Y.snare || []).includes(step)) add(t, S, (Y.hat === "none" && step === 14 ? 0.3 : 0.5) * soft, 0.05);
        if (Y.hatOpen.includes(step)) add(t, HO, 0.2 * soft, 0.25);
        const hat = Y.hat === "all" || (Y.hat === "odd" && e % 2 === 1) || (Y.hat === "even" && e % 2 === 0);
        if (hat && !Y.hatOpen.includes(step)) add(t, H, (full ? 0.14 : 0.09) * soft, 0.3);
      }
      if (Y.bass.includes(step)) {
        const i = Y.bass.indexOf(step);
        const up = Y.octaves === "alt" ? (i % 2 ? 12 : 0) : Y.octaves === "funk" ? (i % 3 === 1 ? 12 : 0) : Y.fifths ? (i % 2 ? 7 : 0) : Y.walk ? [0, 3, 5, 7][i % 4] : beatInBar === 3 ? 12 : 0;
        add(t, INST.bass(r, ch.root + up, spb * (Y.bassLen ?? 0.45)), (full ? 0.5 : 0.25) * soft);
      }
      if (Y.chord.includes(step)) add(t, chord(ch.notes), (full ? 0.28 : 0.18) * soft, -0.15);
      // lead motif: on every second bar, only in the full parts
      if (full && bar % 2 === 1 && e % 2 === 0) { const m = F.motif[(beatInBar * 2 + e / 2) % 8]; if (m) add(t, INST.lead(r, m + F.key, F.leadInst), 0.16 * soft, 0.12); }
    }
  }
  // same loudness whatever the style, so "gain" means the same in every clip
  let ss = 0, pk = 0; for (let i = 0; i < n; i++) { ss += L[i] * L[i] + R[i] * R[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
  const rms = Math.sqrt(ss / (2 * n || 1)), g = rms > 0 ? Math.min(0.15 / rms, 0.95 / pk) : 1;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, flavour: F };
}
