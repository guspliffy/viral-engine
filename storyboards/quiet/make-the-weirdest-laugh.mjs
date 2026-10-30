// THE FRIEND WITH THE WEIRDEST LAUGH (Test 2: quiet relatable gags, 30 Oct 2026), built from the clip template.
// node storyboards/quiet/make-the-weirdest-laugh.mjs -> storyboards/quiet/the-weirdest-laugh.json
//
// THE BRIEF (two-week-test-plan.md, Test 2: one lead, one shot with at most a slow push, a plain strong-colour
// backdrop, one line on screen, a gibberish voice or sound as the joke, no hand contact with small props, 8-12 s)
//   Joke:        deadpan Reaper, the low flat voice of the cast, has the most ridiculous laugh: a squeak, a snort, a
//                giggle, a silent wheeze, a kettle squeal and a goose honk.
//   Wants:       he wants to keep it in and stay cool.
//   Consequence: it leaks out a bit louder each time until it blows out of him in a squeal.
//   Ending:      he pulls himself together ("Ahem."), stares into the lens, and one tiny squeak gets out: he is
//                back where he started (the last frame runs into the first).
//
//   0.00 holding it in: eyes locked on the lens, lips pressed, shuddering; a squeak gets out  (squeak)
//   1.10 a snort jolts him                                                                    (snort)
//   1.70 a high giggle bounces his shoulders                                                  (hee-hee-hee)
//   2.75 doubled over in a silent wheeze (the quiet dip before the payoff)                    (wheeze)
//   3.75 payoff: eyes snap wide, head back, arms up, a kettle squeal                          (squeal)
//   5.05 then he honks like a goose, bobbing                                                  (HAA HAA)
//   6.15 a breath out, straightens up, "Ahem.", one blink                                     (Reaper A voice)
//   8.00 a tiny squeak gets out; lips pressed, shuddering again
//
// All his laugh sounds are his own gibberish voice written syllable by syllable (talk "pattern", engine/shared/
// syllables.js), so the mouth moves with each one. One shot, a slow push; plain teal backdrop.
import { clip, write, frame } from "../lib/clip.mjs";

const c = clip(), { A, cap } = c;
const END = 9.05;

const REA = [0, 0], AT_YOU = [0, 0.02];
const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: REA, face: "camera", expr: "deadpan", follow: 0, seed: 4.1, signature: false },
];
const props = [];

// a laugh sound: a pattern of syllables (c consonant, v vowel, d seconds, st semitones, glide, gap, whisper)
const laugh = (t, pattern, dur, gain = 1) => A(t, "rea", "talk", { pattern, dur, gain, tone: "calm" });
const rep = (n, s) => Array.from({ length: n }, () => s);

// the held-in face: lips pressed tight, eyes squeezed, cheeks up
const holdIn = (t, dur = 0.12) => {
  A(t, "rea", "expr", { expr: "deadpan", set: { curve: 0, eye: 1.15 }, dur });
  A(t, "rea", "face", { lid: 0.1, press: 1, brow: 0.35, dur });
};
// trembling: a small fast rock side to side (under 6 Hz, so it doesn't alias)
const tremble = (t0, t1, amp = 3.5) => { let k = 0; for (let t = t0; t < t1 - 0.05; t += 0.09, k++) { A(t, "rea", "lean", { to: k % 2 ? -amp : amp, dur: 0.09, ease: "inOut" }); A(t, "rea", "squash", { amount: 0.02, dur: 0.09 }); } A(t1 - 0.05, "rea", "lean", { to: 0, dur: 0.08 }); };
// a bounce per syllable: the shoulders jump (a squash pulse)
const bounces = (t0, n, step, amount = 0.05) => { for (let i = 0; i < n; i++) A(t0 + i * step, "rea", "squash", { amount, dur: step * 0.9 }); };

A(0, "rea", "noblink");
A(0, "rea", "look", { to: AT_YOU, dur: 0, blink: false });
holdIn(0, 0);
tremble(0, 1.05);
laugh(0.45, [{ v: "i", d: 0.11, st: 26, glide: 4 }], 0.14, 0.55);
A(0.45, "rea", "face", { lid: 0.1, press: 0.3, dur: 0.05 });
A(0.6, "rea", "face", { lid: 0.1, press: 1, dur: 0.12 });

// 1.10 the snort
A(1.1, "rea", "squash", { amount: 0.12, dur: 0.22 });
A(1.1, "rea", "pitch", { to: 8, dur: 0.1, ease: "out" });
A(1.25, "rea", "pitch", { to: 2, dur: 0.25, ease: "inOut" });
laugh(1.1, [{ c: "n", v: "u", d: 0.2, st: -3, whisper: true }], 0.22, 1.3);
A(1.1, "rea", "face", { lid: 0.8, dur: 0.06 });

// 1.70 the giggle: lips part, shoulders bounce
A(1.7, "rea", "expr", { expr: "happy", set: { curve: 0.5, open: 0.3, eye: 0.7 }, dur: 0.12 });
A(1.7, "rea", "face", { lid: 0.7, press: 0, brow: 0.3, dur: 0.12 });
laugh(1.7, rep(6, { c: "h", v: "i", d: 0.08, st: 14, glide: -2, gap: 0.06 }), 0.86, 0.9);
bounces(1.7, 6, 0.14, 0.05);

// 2.75 the silent wheeze (two breaths): doubled over, arms hanging, only breath
A(2.65, "rea", "pitch", { to: 18, dur: 0.3, ease: "inOut" });
c.arm(2.65, "rea", "R", { x: [-0.36, 0.25, 0.32] }, 0.3, "inOut");
c.arm(2.65, "rea", "L", { x: [0.36, 0.25, 0.32] }, 0.3, "inOut");
A(2.75, "rea", "expr", { expr: "happy", set: { curve: 0.6, open: 0.55, eye: 0.6 }, dur: 0.15 });
A(2.75, "rea", "face", { lid: 0.92, dur: 0.15 });
laugh(2.8, rep(2, { c: "h", v: "i", d: 0.32, st: 18, whisper: true, gap: 0.12 }), 0.82, 0.55);
bounces(2.8, 2, 0.44, 0.04);
A(3.55, "rea", "still", { dur: 0.2, idle: 0 });

// 3.75 payoff: head back, arms up, the kettle squeal
const PAY = 3.75;
A(PAY - 0.08, "rea", "pitch", { to: -20, dur: 0.18, ease: "out" });
c.arm(PAY - 0.08, "rea", "R", { x: [-0.72, 1.05, 0.1] }, 0.2, "out");
c.arm(PAY - 0.08, "rea", "L", { x: [0.72, 1.05, 0.1] }, 0.2, "out");
A(PAY, "rea", "expr", { expr: "delighted", set: { open: 0.85, curve: 0.7, eye: 0.5 }, dur: 0.1 });
A(PAY - 0.08, "rea", "face", { lid: 0, brow: 0.45, dur: 0.06 });
A(PAY + 0.12, "rea", "face", { lid: 0.95, dur: 0.1 });
laugh(PAY, [{ v: "i", d: 1.05, st: 25, glide: 6 }], 1.1, 1.5);
A(PAY + 0.05, "rea", "squash", { amount: -0.08, dur: 0.5 });

// 5.05 the goose honk: bobbing forward on each one
A(4.85, "rea", "pitch", { to: 6, dur: 0.15, ease: "inOut" });
c.arm(4.9, "rea", "R", { o: [0.06, 0.22, 0.05] }, 0.3, "inOut");   // arms back down (palms to the lens read as stuck, What Raven)
c.arm(4.9, "rea", "L", { o: [0.06, 0.22, 0.05] }, 0.3, "inOut");
A(5.05, "rea", "expr", { expr: "happy", set: { open: 0.75, curve: 0.6, eye: 0.6 }, dur: 0.1 });
laugh(5.05, rep(4, { c: "h", v: "a", d: 0.17, st: -3, glide: -3, gap: 0.1 }), 1.1, 1.2);
for (let i = 0; i < 4; i++) { A(5.05 + i * 0.27, "rea", "pitch", { to: 13, dur: 0.1, ease: "out" }); A(5.17 + i * 0.27, "rea", "pitch", { to: 5, dur: 0.14, ease: "inOut" }); }
bounces(5.05, 4, 0.27, 0.06);

// 6.15 composure: a breath out, upright, "Ahem."
A(6.20, "rea", "pitch", { to: 0, dur: 0.4, ease: "inOut" });
c.arm(6.15, "rea", "R", { o: [0.03, 0.2, 0.03] }, 0.45, "inOut");
c.arm(6.15, "rea", "L", { o: [0.03, 0.2, 0.03] }, 0.45, "inOut");
c.sfx(6.20, "blow", { gain: 0.15 });
A(6.25, "rea", "squash", { amount: -0.05, dur: 0.45 });
A(6.30, "rea", "expr", { expr: "deadpan", set: { curve: -0.05, open: 0, eye: 1 }, dur: 0.3 });
A(6.30, "rea", "face", { lid: 0.42, brow: 0, press: 0, dur: 0.3 });
c.macro(6.80, "rea", "say", { line: "Ahem.", voice: "reaper", caption: false });
A(7.35, "rea", "blink", { dur: 0.22 });
A(7.6, "rea", "still", { dur: 0.4, idle: 0.05 });

// 8.00 one tiny squeak gets out: eyes wide, lips pressed, trembling again
laugh(8.00, [{ v: "i", d: 0.1, st: 27, glide: 3 }], 0.13, 0.5);
A(8.00, "rea", "expr", { expr: "deadpan", set: { eye: 1.2, curve: 0, open: 0.1 }, dur: 0.06 });
A(8.00, "rea", "face", { lid: 0.1, brow: 0.35, dur: 0.06 });
holdIn(8.30, 0.2);
tremble(8.50, END - 0.02);

// the one line on screen
cap(0, PAY + 0.2, "that friend with the weirdest laugh", 250, false, { kinetic: false });

// ---------------------------------------------------------------- one shot, a slow push the whole clip
const S = frame([0, 0.72, 0], { el: 4, h: 2.25, fov: 30, dur: END });   // no push: the clip loops, and a push would snap back at the seam
const beats = c.beats([
  ["holding it in", 0, S, "hook"],
  ["snort", 1.1, "keep"],
  ["giggle", 1.7, "keep", "escalation"],
  ["wheeze", 2.65, "keep"],
  ["the squeal", PAY, "keep", "payoff"],
  ["honk", 4.85, "keep"],
  ["ahem", 6.15, "keep"],
  ["the last squeak", 8.0, "keep"],
], END);

write(import.meta.url, {
  id: "the-weirdest-laugh",
  title: "The Friend With the Weirdest Laugh",
  cover: 4.6,
  idea: "Test 2 quiet gag: deadpan Reaper tries to hold in a laugh that comes out as a squeak, snort, wheeze, kettle squeal and honk",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  creative: { length: [8, 12] },
  set: { type: "plain", color: "#2cc7b5", floor: "#1fa797", light: "golden", aperture: 0, para: 0, bloom: "emissive" },
  music: { style: "lofi", seed: 31, gain: 0.26, payoff: PAY },
  sound: { sfx: 0.7, ambience: 0, signature: false, auto: false },
  fx: [{ do: "shake", at: PAY, dur: 0.4, amp: 0.025 }],
  experiment: { id: "test-2-quiet", episode: "the-weirdest-laugh", variant: "quiet" },
  hook: { show: ["rea"], hint: 0.45, what: "Reaper, trembling with his lips pressed, lets a squeak out" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/quiet/make-the-weirdest-laugh.mjs (Test 2, quiet relatable gags).",
});
