// Gibberish speech, planned as syllables. The same plan drives the voice synth (engine/audio.mjs, in Node)
// and the mouth (engine/page/timeline.js, in the browser), so the lips always match the sound.
// Pure and deterministic: the same talk action always gives the same syllables. A talk action that carries its
// "line" (the say macro adds it) is seeded by speaker + line, so moving or retiming it keeps the same performance
// and a repeated line sounds the same; one without a line is seeded by speaker + start time (older clips).
import { rng } from "../page/util.js";

export const VOWELS = {
  //    formants (Hz) of a neutral adult voice, mouth opening 0..1, lip rounding 0..1
  a: { F: [730, 1090, 2440], open: 0.95, round: 0.1 },
  e: { F: [530, 1840, 2480], open: 0.6, round: 0.0 },
  i: { F: [300, 2250, 3000], open: 0.35, round: 0.0 },
  o: { F: [570, 840, 2410], open: 0.7, round: 0.8 },
  u: { F: [320, 870, 2240], open: 0.4, round: 1.0 },
};
export const CONSONANTS = ["b", "d", "g", "k", "p", "t", "m", "n", "l", "s", "h", "w", "", "", ""];

export const DEFAULT_VOICE = { pitch: 160, rate: 3.4, formant: 1.1, range: 4, breath: 0.08, vibrato: 0.015 };

export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// what seeds a talk action's voice: its line when it has one, else its start time
export const voiceKey = (a) => (a.seed != null ? `${a.who}#${a.seed}` : a.line != null ? `${a.who}:${a.line}` : `${a.who}@${a.at}`);

// action: { who, at, dur, rate?, tone?, line?, seed? }   tone: "calm" | "excited" | "sad" | "question" | "chant"
// Planned in time relative to the action's start, so the plan only shifts when the action moves.
export function planSyllables(action, voice = {}) {
  const v = { ...DEFAULT_VOICE, ...voice };
  const r = rng(hash(voiceKey(action)) ^ ((v.seed ?? 0) * 7919)), keyed = action.line != null || action.seed != null;
  const tone = action.tone || "calm", end = action.dur ?? 1;
  const rate = (action.rate ?? v.rate) * (tone === "excited" ? 1.3 : tone === "sad" ? 0.8 : 1);
  const out = [];
  let t = 0, word = 0;
  const vowels = Object.keys(VOWELS);
  while (t < end - 0.06) {
    const n = 1 + Math.floor(r() * 3); // syllables in this word
    for (let k = 0; k < n && t < end - 0.06; k++) {
      const dur = Math.min((1 / rate) * (0.7 + r() * 0.6), end - t);
      const progress = t / Math.max(0.001, end);
      let semis = (r() * 2 - 1) * v.range * 0.6 + (k === 0 ? 1 : 0);
      if (tone === "excited") semis += 2 + r() * 3;
      if (tone === "sad") semis -= progress * 5;
      if (tone === "question" && progress > 0.75) semis += 5;
      if (tone === "chant") semis = (k % 2 ? 0 : 2) + Math.sin(word * 1.3) * 1.5; // incantation: narrow, rhythmic
      out.push({
        t0: action.at + t, jt: keyed ? t : action.at + t, dur, vowel: vowels[Math.floor(r() * vowels.length)], cons: CONSONANTS[Math.floor(r() * CONSONANTS.length)],
        f0: v.pitch * Math.pow(2, semis / 12), amp: 0.75 + r() * 0.25, fall: tone === "sad" ? -2 : (r() * 2 - 1) * 1.5,
      });
      t += dur;
    }
    t += 0.05 + r() * 0.1; // gap between words
    word++;
  }
  return out;
}

// Mouth shape at time t from a syllable plan: { open 0..1, round 0..1 }
export function mouthAt(plan, t) {
  for (const s of plan) {
    if (t < s.t0 || t > s.t0 + s.dur) continue;
    const k = (t - s.t0) / s.dur, V = VOWELS[s.vowel];
    const lead = s.cons && "bpm".includes(s.cons) ? 0.18 : 0.08; // lips close briefly on b, p, m
    const env = k < lead ? k / lead * 0.4 : k < 0.75 ? 0.4 + 0.6 * Math.min(1, (k - lead) / 0.12) : 1 - (k - 0.75) / 0.25;
    // rounding fades with the syllable, so the mouth's width doesn't jump between syllables
    return { open: Math.max(0.05, V.open * env * s.amp), round: V.round * env };
  }
  return { open: 0, round: 0 };
}
