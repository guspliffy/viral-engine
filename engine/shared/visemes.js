// Mouth shapes for real speech (engine/voice/). The voice model reports every phoneme with its start and length;
// mouthKeys() turns them into mouth keyframes once, in Node, and the page only interpolates them (speechMouthAt), so
// the lips follow the actual sound. Same output shape as mouthAt() in syllables.js: { open 0..1, round 0..1 }.
// Pure and deterministic.

// IPA symbol (as espeak writes it) -> [open, round]. Lips close fully on m, b, p; f and v nearly close.
const SHAPES = {
  m: [0, 0], b: [0, 0], p: [0, 0], f: [0.1, 0], v: [0.1, 0],
  a: [0.95, 0.1], "ɑ": [0.95, 0.15], "æ": [0.85, 0], "ʌ": [0.75, 0.05], "ɐ": [0.7, 0.05], "ɒ": [0.85, 0.5],
  e: [0.55, 0], "ɛ": [0.6, 0], "ə": [0.45, 0], "ɜ": [0.5, 0.1], "ᵻ": [0.35, 0], "ɚ": [0.45, 0.3],
  i: [0.3, 0], "ɪ": [0.35, 0], y: [0.3, 0.7],
  o: [0.65, 0.8], "ɔ": [0.7, 0.7], u: [0.35, 1], "ʊ": [0.4, 0.85], w: [0.2, 1],
  "ʃ": [0.25, 0.6], "ʒ": [0.25, 0.6], "ɹ": [0.3, 0.4], r: [0.3, 0.3], j: [0.25, 0],
  t: [0.2, 0], d: [0.2, 0], n: [0.2, 0], l: [0.3, 0], s: [0.15, 0], z: [0.15, 0], "θ": [0.2, 0], "ð": [0.2, 0],
  k: [0.3, 0], g: [0.3, 0], "ɡ": [0.3, 0], "ŋ": [0.3, 0], h: [0.4, 0], "ɾ": [0.2, 0], "ʔ": [0.1, 0], x: [0.3, 0],
};
const OPEN_GAIN = 1.3;
const PAUSE = /[.,!?;:—…"()]/;   // punctuation: the mouth closes for the pause
const STRESS = /[ˈˌ]/;           // stress marks: the model gives them time, which belongs to the stressed sound after them
const GAP = /\s/;                // word gaps: no shape of their own, the neighbours blend across

// phones: [[symbol, start, length], ...] in seconds from the line's start -> [[t, open, round], ...]
export function mouthKeys(phones) {
  const segs = [];
  let held = null;
  for (let [ph, t0, d] of phones) {
    if (ph === "ː" && segs.length) { segs[segs.length - 1].d += d; continue; } // long vowel: the shape lasts longer
    if (STRESS.test(ph)) { held = held ?? t0; continue; }
    if (held != null) { d += t0 - held; t0 = held; held = null; }
    // OPEN_GAIN: speech phonemes are short, so after smoothing the shapes need a little more opening than syllables
    if (!GAP.test(ph)) { const sh = PAUSE.test(ph) ? [0, 0] : SHAPES[ph] ?? [0.3, 0]; segs.push({ t0, d, s: [Math.min(1, sh[0] * OPEN_GAIN), sh[1]] }); }
  }
  const keys = [[0, 0, 0]];
  for (const { t0, d, s } of segs) {
    // a shape is reached a third of the way in and held to two thirds; closures (m, b, p, pauses) are held fully
    if (s[0] === 0) keys.push([t0 + Math.min(0.02, d * 0.2), 0, 0], [t0 + d - Math.min(0.02, d * 0.2), 0, 0]);
    else keys.push([t0 + d * 0.33, s[0], s[1]], [t0 + d * 0.66, s[0], s[1]]);
  }
  const end = phones.length ? phones[phones.length - 1][1] + phones[phones.length - 1][2] : 0;
  keys.push([end + 0.06, 0, 0]);
  // round to ms and drop keys that go back in time (zero-length phonemes)
  const out = [];
  for (const [t, o, r] of keys) {
    const k = [Math.round(t * 1000) / 1000, Math.round(o * 100) / 100, Math.round(r * 100) / 100];
    if (out.length && k[0] <= out[out.length - 1][0]) out[out.length - 1] = [out[out.length - 1][0], k[1], k[2]];
    else out.push(k);
  }
  return out;
}

// mouth at time t (seconds from the line's start), eased between keyframes and lightly smoothed over ±25 ms, so
// fast phonemes don't make the lips flicker from one 30 fps frame to the next
export function speechMouthAt(keys, t) {
  const a = rawAt(keys, t - 0.025), b = rawAt(keys, t), c = rawAt(keys, t + 0.025);
  return { open: (a.open + 2 * b.open + c.open) / 4, round: (a.round + 2 * b.round + c.round) / 4 };
}
function rawAt(keys, t) {
  if (!keys?.length || t <= keys[0][0] || t >= keys[keys.length - 1][0]) return { open: 0, round: 0 };
  let i = 1;
  while (keys[i][0] < t) i++;
  const [ta, oa, ra] = keys[i - 1], [tb, ob, rb] = keys[i];
  const k = (t - ta) / Math.max(1e-6, tb - ta), e = k * k * (3 - 2 * k);
  return { open: oa + (ob - oa) * e, round: ra + (rb - ra) * e };
}
