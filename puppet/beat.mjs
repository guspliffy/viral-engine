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
//         | "hush" (silence the music comes back from) | "musicbox" (the lead motif alone, slowly, on a soft music box:
//         the tender bit before the music snaps back; $20 Potato, 4 Nov 2026) | "hold" (one organ note held through the
//         part, the chord's root, nothing else: the world holding its breath before the music snaps back; Never Looks
//         Up 07, 8 Nov 2026)
//   named styles (only by name, never picked by a seed, so adding one changes no other clip): surf (fast surf rock
//         with a fairground organ, 156-164 bpm), polka, chase (danger: fast minor, a pounding low bass with a
//         semitone growl, heavy kick, no lead melody, 148-156 bpm), orchestra (a dramatic film orchestra: string
//         ostinato, low brass swells, timpani; minor, 150-156 bpm; its parts are described at the style)
//   sleigh: true adds jingle bells (a sleigh-bell shake on the off-beats) in the full parts: a holiday flavour
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
  // one organ note held for d seconds: a soft attack, a slow vibrato, a 60 ms release at its end
  // ---- the orchestra (style "orchestra"): bowed strings, low brass, timpani, all synthesised
  // one short bow stroke (spiccato): three detuned saws, a bite of bow noise, a body that closes as the note dies
  spic(r, note, vel = 1) {
    const d = 0.24, x = new Float32Array(d * SR), f = midi(note), lp = onePole(Math.min(5200, 700 + f * 7)), lp2 = onePole(900), ph = [0, 0, 0];
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let y = 0; [0.994, 1, 1.006].forEach((det, j) => { ph[j] += f * det / SR; y += (ph[j] % 1) * 2 - 1; });
      const bow = (r() * 2 - 1) * Math.exp(-t / 0.012) * 0.5, e = Math.min(1, t / 0.006) * Math.exp(-t / 0.075);
      x[i] = (lp(y / 3 + bow) * 0.75 + lp2(y / 3) * 0.6) * e * vel;
    }
    return x;
  },
  // sustained strings: a section of detuned saws, slow bow attack; trem > 0 shakes the bow (tremolo: tension)
  strings(r, notes, d, trem = 0) {
    const x = new Float32Array(Math.ceil(d * SR)), lp = onePole(2600), ph = notes.flatMap(() => [0, 0, 0]);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let y = 0;
      notes.forEach((n, j) => [0.993, 1, 1.007].forEach((det, k) => { const q = j * 3 + k; ph[q] += midi(n) * det * (1 + 0.003 * Math.sin(TAU * 5.3 * t + q)) / SR; y += (ph[q] % 1) * 2 - 1; }));
      const e = Math.min(1, t / 0.14) * Math.min(1, (d - t) / 0.18), tr = trem ? 1 - trem * (0.5 + 0.5 * Math.sin(TAU * 13 * t)) ** 2 : 1;
      x[i] = lp(y / (notes.length * 3)) * e * tr * 1.5;
    }
    return x;
  },
  // low brass (horns and trombones): saws whose brightness opens with the loudness, a swell toward the end of the note
  brass(r, notes, d, swell = 0.35) {
    const x = new Float32Array(Math.ceil(d * SR)), dark = onePole(520), bright = onePole(2400), ph = notes.flatMap(() => [0, 0]);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; let y = 0;
      notes.forEach((n, j) => [0.996, 1.004].forEach((det, k) => { const q = j * 2 + k; ph[q] += midi(n) * det / SR; y += (ph[q] % 1) * 2 - 1; }));
      y /= notes.length * 2;
      const e = Math.min(1, t / 0.09) * Math.min(1, (d - t) / 0.12) * (1 - swell + swell * (t / d)), b = e * e;
      x[i] = (dark(y) * (1 - b) + bright(y) * b) * e * 1.7;
    }
    return x;
  },
  // timpani: a tuned drum head that drops a touch in pitch, a soft mallet thud, a long ring
  timp(r, note, vel = 1) {
    const d = 1.1, x = new Float32Array(d * SR), f = midi(note), lp = onePole(700); let p = 0, p2 = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, ff = f * (1 + 0.25 * Math.exp(-t / 0.018)); p += ff / SR; p2 += ff * 1.5 / SR;
      x[i] = (Math.sin(TAU * p) * Math.exp(-t / 0.42) + Math.sin(TAU * p2) * Math.exp(-t / 0.16) * 0.35 + lp(r() * 2 - 1) * Math.exp(-t / 0.03) * 0.9) * vel;
    }
    return x;
  },
  held(note, d) {
    const x = new Float32Array(Math.ceil(d * SR)); let p = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR; p += midi(note) * (1 + 0.004 * Math.sin(TAU * 5 * t)) / SR;
      x[i] = (Math.sin(TAU * p) + 0.5 * Math.sin(TAU * 2 * p) + 0.25 * Math.sin(TAU * 4 * p)) * 0.3 * Math.min(1, t / 0.03) * Math.min(1, (d - t) / 0.06);
    }
    return x;
  },
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
  // a music box: a plucked steel tine, a pure tone with a faint bright overtone and a long soft ring
  musicbox(r, note) {
    const d = 0.9, x = new Float32Array(d * SR), f = midi(note); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR; p += f / SR; x[i] = (Math.sin(TAU * p) + 0.22 * Math.sin(TAU * p * 3.01) * Math.exp(-t / 0.08) + 0.1 * Math.sin(TAU * p * 5.2) * Math.exp(-t / 0.04)) * Math.min(1, t / 0.0015) * Math.exp(-t / 0.35) * 0.5; }
    return x;
  },
  // sleigh bells: a cluster of small detuned bells shaken once (a quick burst of bright partials and a little noise)
  sleigh(r) {
    const d = 0.18, x = new Float32Array(d * SR), parts = Array.from({ length: 7 }, () => [2600 + r() * 4200, r() * 0.012, 0.5 + r() * 0.5]), lp = onePole(9000);
    for (let i = 0; i < x.length; i++) { const t = i / SR; let y = 0; for (const [f, o, a] of parts) { const u = t - o; if (u > 0) y += Math.sin(TAU * f * u) * a * Math.exp(-u / 0.045); } const n = r() * 2 - 1; x[i] = (y * 0.25 + (n - lp(n)) * 0.3 * Math.exp(-t / 0.02)) * Math.min(1, t / 0.001); }
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
// styles a clip asks for by name: kept out of STYLES, the pool a seed picks from (a new entry there would change the
// music of every clip that doesn't pin its style)
const NAMED = {
  // surf rock with a fairground organ (Never Looks Up 07, the roller coaster): driving straight eighths, snare on 2 and
  // 4, a galloping kick, the bass in octaves on every eighth, organ chords on the off-beats like a fairground band organ
  surf: { bpm: [156, 164], kick: [0, 6, 8, 14], snare: [4, 12], hatOpen: [], hat: "even", bass: [0, 2, 4, 6, 8, 10, 12, 14], bassLen: 0.2, octaves: "alt", chord: [2, 6, 10, 14], chordInst: "organ" },
  // a cosy oom-pah polka (Survive it EP1, snowed in): the bass on every beat swapping root and fifth (oom), a reedy
  // organ chord on every off-beat like an accordion (pah), a light kick on 1 and 3; pair it with "sleigh": true
  // a chase that sounds dangerous (There's a catch 05, a museum of starving animals after three potatoes; Jonny 12 Nov
  // 2026: "the music doesn't fit the dangerous scene when chasing"): always minor, a kick on every beat and a pounding
  // bass on every eighth that keeps growling up a semitone (the shark-in-the-water move), low stabs in a 3+3+2
  // pattern, sixteenth hats, and no cheerful lead melody at all
  chase: { bpm: [148, 156], kick: [0, 4, 8, 12, 14], snare: [4, 12], hatOpen: [], hat: "all", bass: [0, 2, 4, 6, 8, 10, 12, 14], bassLen: 0.24, ost: [0, 0, 1, 0, 0, 1, 0, -2], chord: [0, 6, 12], chordInst: "stab", minor: true, noLead: true },
  // a dramatic film orchestra (There's a catch 05; Jonny 12 Nov 2026 on the "chase" style: "there is still no dramatic
  // music, it should be somewhat of a dramatic orchestra music"). Always minor. No drum kit: celli and basses bow a
  // driving ostinato on every eighth, violins answer in sixteenths with the accents in 3+3+2, low brass holds the chord
  // and swells through each bar, timpani on the accents. "intro" = tremolo strings and a slow heartbeat of basses and
  // timpani (dread), "build" = a timpani roll under the riser, "musicbox" = one soft held string chord (the calm before
  // it turns), "hold" = shaking strings and a brass note that swells (something is coming). The steps are in renderBeat.
  orchestra: { bpm: [150, 156], orch: true, minor: true, noLead: true, kick: [], hatOpen: [], hat: "none", bass: [], chord: [], chordInst: "stab" },
  polka: { bpm: [124, 132], kick: [0, 8], snare: [], hatOpen: [], hat: "none", bass: [0, 4, 8, 12], bassLen: 0.14, fifths: true, chord: [2, 6, 10, 14], chordInst: "organ" },
};
const styleOf = (name) => STYLE[name] || NAMED[name];
const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// what a clip's variations are seeded from: "seed" when the storyboard pins one, else its experiment episode (so the
// variants of one episode share their music while different episodes still differ), else the clip's id. Renaming a
// clip or a variant then changes nothing.
export const seedOf = (sb) => sb.seed ?? (sb.experiment ? `${sb.experiment.id}/${sb.experiment.episode ?? ""}` : sb.id);

// everything that varies from clip to clip, picked from the seed; any of it can be pinned in the music block
export function musicFlavour(music = {}, id = "") {
  const seed = music.seed ?? hashStr(String(id)), r = mulberry(seed);
  const pool = music.styles || STYLES;            // e.g. ["sneaky", "march", "warm"] to stay within a vibe
  const style = music.style || pool[Math.floor(r() * pool.length)], S = styleOf(style);
  if (!S) throw new Error(`music.style "${style}" unknown (known: ${[...STYLES, ...Object.keys(NAMED)].join(", ")})`);
  const key = music.key ?? Math.floor(r() * 12) - 5;    // semitones from C, -5..+6
  if (!Number.isFinite(key)) throw new Error(`music.key must be semitones from C (a number, e.g. 0 for C, -3 for A), not ${JSON.stringify(music.key)}: a note name made every note NaN and the bed silent (pitch a tent, 5 Nov 2026)`);
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
  const K = INST.kick(r), C = INST.clap(r), H = INST.hat(r, false), HO = INST.hat(r, true), S = INST.snare(r), SL = music.sleigh ? INST.sleigh(mulberry(F.seed ^ 0x51e16)) : null;
  const chord = (notes) => INST[F.S.chordInst](r, notes);
  // "hold": one organ note, the chord's root two octaves up, from the part's start to the next part
  parts.forEach((P, i) => {
    if (P.part !== "hold") return;
    const len = (parts[i + 1]?.at ?? duration) - P.at, bar = Math.floor((P.at - off) / spb / 4);
    if (F.S.orch) { const c = chordAt(bar), g = P.gain ?? 1;   // a part's own "gain" (default 1) makes this hold softer or louder
      add(P.at, INST.strings(r, [c.root + 24, c.root + 31], len, 0.7), 0.45 * g, 0.1); add(P.at, INST.brass(r, [c.root, c.root + 12], len, 0.8), 0.75 * g, -0.1); add(P.at, INST.timp(r, c.root, 0.8), 0.6 * g); return; }
    add(P.at, INST.held(chordAt(bar).root + 24, len), 0.3, -0.05);
  });
  for (let b = Math.floor(-off / spb); off + b * spb < duration; b++) {
    for (let e = 0; e < 4; e++) {   // sixteenth notes; odd ones are pushed late by the swing
      const t = off + (b + e / 4 + (e % 2 ? F.swing / 4 : 0)) * spb;
      if (t < 0 || t >= duration) continue;
      const P = partAt(t); if (!P) continue;
      const part = P.part, bar = Math.floor(b / 4), beatInBar = ((b % 4) + 4) % 4, ch = chordAt(bar);
      if (part === "stop" || part === "hush" || part === "hold") continue;   // hush: a silent stretch the music comes back from (engine/music.mjs
      // treats only "stop" as the end of the music)
      if (part === "build") {
        // a snare roll that doubles up towards the drop, and a riser across the whole build
        const len = (parts[parts.indexOf(P) + 1]?.at ?? duration) - P.at, k = (t - P.at) / Math.max(0.01, len);
        const every = k < 0.5 ? 2 : 1;
        if (F.S.orch) { if (e % every === 0) add(t, INST.timp(r, ch.root, 0.35 + 0.65 * k), 0.2 + 0.28 * k); if (e % 2 === 0) add(t, INST.spic(r, ch.root + 12, 0.5 + 0.5 * k), 0.3, -0.2); }
        else if (e % every === 0) add(t, S, 0.25 + 0.35 * k);
        if (Math.abs(t - P.at) < 1e-6) add(t, INST.riser(r, len), 0.35);
        continue;
      }
      if (part === "musicbox" && F.S.orch) {   // one soft held chord of the strings, a bar at a time (the calm before it turns)
        if (e === 0 && (beatInBar === 0 || Math.abs(t - P.at) < spb / 8)) add(t, INST.strings(r, ch.notes.map((x) => x + 12), spb * (4 - beatInBar) + 0.2), 0.3, 0.05);
        continue;
      }
      if (part === "musicbox") {
        // the motif at half speed on the music box, an octave up, every bar, and a soft low note on each bar's start
        if (e === 0) { const m = F.motif[(bar * 4 + beatInBar) % 8] ?? F.motif[(bar * 4 + beatInBar + 1) % 8]; if (m) add(t, INST.musicbox(r, m + 12 + F.key), 0.3, 0.1); }
        if (e === 0 && beatInBar === 0) add(t, INST.musicbox(r, ch.root + 24), 0.16, -0.1);
        continue;
      }
      const full = part === "main" || part === "drop", step = beatInBar * 4 + e, Y = F.S, soft = Y.soft ? 0.6 : 1;
      if (part === "drop" && e === 0 && Math.abs(t - P.at) < 0.02) add(t, INST.crash(r), 0.35, -0.1);
      if (Y.orch) {
        const acc = [0, 3, 6, 8, 11, 14].includes(step), tri = ch.notes;
        if (full) {
          if (step % 2 === 0) add(t, INST.spic(r, ch.root + ([0, 0, 12, 0, 0, 12, 0, 7][step / 2]), 1), 0.5, -0.15);        // celli and basses
          add(t, INST.spic(r, tri[[0, 2, 1, 2][step % 4]] + (acc ? 12 : 0), acc ? 1 : 0.55), acc ? 0.3 : 0.2, 0.25);       // violins
          if (step === 0) add(t, INST.brass(r, [ch.root + 12, ch.root + 19, ch.root + 24], spb * 4 + 0.1), 0.42, -0.05);  // horns and trombones
          if ([0, 6, 8].includes(step) || (step === 14 && bar % 2 === 1)) add(t, INST.timp(r, ch.root + (step === 6 ? 7 : 0), step === 0 ? 1 : 0.7), 0.6);
          if (part === "drop" && step === 0 && Math.abs(t - P.at) < 0.02) add(t, INST.brass(r, [ch.root, ch.root + 7, ch.root + 12], spb * 2, 0), 0.5);
        } else {   // intro: dread
          if (step === 0) add(t, INST.strings(r, [tri[0] + 12, tri[2] + 12], spb * 4 + 0.15, 0.75), 0.5, 0.2);
          if (step === 0 || step === 3) add(t, INST.spic(r, ch.root, 0.8), 0.8, -0.15);
          if (step === 0) add(t, INST.timp(r, ch.root, 0.45), 0.6);
          if (step === 8) add(t, INST.spic(r, ch.root + 7, 0.5), 0.5, -0.15);
        }
        continue;
      }
      if (F.drums) {
        if (Y.kick.includes(step) && (full || step === 0)) add(t, K, (part === "intro" ? 0.5 : 0.95) * soft);
        if (full && (Y.clap || []).includes(step)) add(t, C, 0.55 * soft, 0.05);
        if (full && (Y.snare || []).includes(step)) add(t, S, (Y.hat === "none" && step === 14 ? 0.3 : 0.5) * soft, 0.05);
        if (Y.hatOpen.includes(step)) add(t, HO, 0.2 * soft, 0.25);
        const hat = Y.hat === "all" || (Y.hat === "odd" && e % 2 === 1) || (Y.hat === "even" && e % 2 === 0);
        if (hat && !Y.hatOpen.includes(step)) add(t, H, (full ? 0.14 : 0.09) * soft, 0.3);
      }
      if (music.sleigh && full && e % 2 === 1) add(t, SL, (e === 3 ? 0.16 : 0.11) * soft, -0.3);
      if (Y.bass.includes(step)) {
        const i = Y.bass.indexOf(step);
        const up = Y.ost ? Y.ost[i % Y.ost.length] : Y.octaves === "alt" ? (i % 2 ? 12 : 0) : Y.octaves === "funk" ? (i % 3 === 1 ? 12 : 0) : Y.fifths ? (i % 2 ? 7 : 0) : Y.walk ? [0, 3, 5, 7][i % 4] : beatInBar === 3 ? 12 : 0;
        add(t, INST.bass(r, ch.root + up, spb * (Y.bassLen ?? 0.45)), (full ? 0.5 : 0.25) * soft);
      }
      if (Y.chord.includes(step)) add(t, chord(ch.notes), (full ? 0.28 : 0.18) * soft, -0.15);
      // lead motif: on every second bar, only in the full parts
      if (full && !Y.noLead && bar % 2 === 1 && e % 2 === 0) { const m = F.motif[(beatInBar * 2 + e / 2) % 8]; if (m) add(t, INST.lead(r, m + F.key, F.leadInst), 0.16 * soft, 0.12); }
    }
  }
  // same loudness whatever the style, so "gain" means the same in every clip
  let ss = 0, pk = 0; for (let i = 0; i < n; i++) { ss += L[i] * L[i] + R[i] * R[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
  const rms = Math.sqrt(ss / (2 * n || 1)), g = rms > 0 ? Math.min(0.15 / rms, 0.95 / pk) : 1;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, flavour: F };
}
