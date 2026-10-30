// "I'M 5 MINUTES AWAY" (Test 2: quiet relatable gags, 30 Oct 2026), built from the clip template.
// node storyboards/quiet/make-five-minutes-away.mjs -> storyboards/quiet/five-minutes-away.json
//
// THE BRIEF (two-week-test-plan.md, Test 2: one lead, one shot with at most a slow push, a plain strong-colour
// backdrop, one line on screen, a gibberish voice or sound as the joke, no hand contact with small props, 8-12 s;
// the plan's own example premise: the friend who says "I'm five minutes away" from bed)
//   Joke:        Phoenix is on the phone, telling you he's nearly there, while sitting up in bed under the covers;
//                he fakes the whole trip with his mouth: a car horn, running breaths, an engine, wind from his wings.
//   Wants:       he wants you to believe he's on his way.
//   Consequence: the second the call ends he flops back and is asleep.
//   Ending:      the phone rings again: one eye opens and he's straight back into the act (the end runs into the start).
//
//   0.00 sitting up in bed, slouched, eyes half shut, talking fast at the phone on the blanket (gibberish)
//   1.05 a yawn he can't hide                                                                  (haaa)
//   1.60 "bee-beep!" with his mouth                                                            (mouth horn)
//   2.15 fake running: fists pumping, puffing in rhythm                                        (huff huff)
//   3.35 "vrrooOOM", fists on an invisible wheel, steering with his whole body                 (mouth engine)
//   4.40 two big wing flaps for the wind, "almost there!"                                      (wing flaps)
//   5.55 the call ends (the screen goes dark); 5.85 payoff: he flops sideways, asleep          (end-call bong, cushion poof)
//   6.50 one snore; 7.40 it rings again: eyes open, and he's straight back into the act        (ringtone, gibberish)
//
// Every voice sound is his own gibberish voice (mouth noises written syllable by syllable: talk "pattern"). The
// phone lies on the blanket and nobody touches it. One shot, a slow push; plain cobalt backdrop.
import { clip, write, frame } from "../lib/clip.mjs";

const c = clip(), { A, sfx, cap } = c;
const END = 8.8;

const BED = [0, -0.1], AT_PHONE = [0.05, -0.55], AT_YOU = [0, 0.02];
const cast = [
  { id: "phx", character: "duo/phoenix", at: BED, face: "camera", expr: "kind", follow: 0.2, seed: 1.7, signature: false },
];
const props = [
  { id: "bed", kind: "bed", x: BED[0], z: BED[1], cover: 1, blanket: "#e8574a", dots: "#fff1d6" },   // a warm blanket against the cobalt
  { id: "phone", kind: "phone", x: 0.02, y: 0.5, z: BED[1] + 0.8, tip: -70, rot: -12, scale: 1.8, case: "#ff5d73", glow: 1 },
];

const talk = (t, line, dur, tone = "excited", gain = 1) => A(t, "phx", "talk", { line, dur, tone, gain });
const noise = (t, pattern, dur, gain = 1) => A(t, "phx", "talk", { pattern, dur, gain });
const rep = (n, s) => Array.from({ length: n }, () => s);
// half-asleep eyes (Phoenix has no lids: a smaller eye reads as a squint) and the talking mouth
const EYE = 0.62;
const face = (t, set, dur = 0.12, expr = "eager") => A(t, "phx", "expr", { expr, set: { eye: EYE, ...set }, dur });
// his forearms rest on top of the blanket, hands in front of him
const ARMS = { R: { world: [-0.34, 0.64, BED[1] + 0.4] }, L: { world: [0.34, 0.64, BED[1] + 0.4] } };

// ---------------------------------------------------------------- 1 the call: in bed, putting on a show
A(0, "phx", "sit", { seat: "bed", dur: 0, hands: "keep" });
A(0, "phx", "noblink");
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
face(0, { open: 0.3, curve: 0.45 }, 0);
c.arm(0, "phx", "R", ARMS.R, 0); c.arm(0, "phx", "L", ARMS.L, 0);
A(0, "phx", "pitch", { to: 6, dur: 0 });
talk(0, "yeah yeah I'm on my way, totally", 1.0);
// 1.05 a yawn he can't hide
face(1.05, { open: 0.6, curve: -0.1, eye: 0.35 }, 0.15);
A(1.05, "phx", "pitch", { to: -8, dur: 0.3, ease: "inOut" });
noise(1.05, [{ c: "h", v: "a", d: 0.45, st: 3, glide: -7 }], 0.5, 0.8);
A(1.45, "phx", "pitch", { to: 6, dur: 0.2, ease: "inOut" });
// 1.60 the mouth horn
A(1.6, "phx", "pitch", { to: 0, dur: 0.1, ease: "out" });
noise(1.6, [{ c: "b", v: "i", d: 0.12, st: 7, gap: 0.05 }, { c: "b", v: "i", d: 0.2, st: 7, gap: 0.3 }], 0.42, 1.2);
A(1.6, "phx", "squash", { amount: 0.06, dur: 0.18 });
A(1.77, "phx", "squash", { amount: 0.06, dur: 0.2 });
face(1.6, { open: 0.15, curve: 0.2 }, 0.1);
// 2.15 fake running: puffing and bobbing in rhythm
face(2.1, { open: 0.35, curve: 0.1 });
noise(2.15, rep(6, { c: "h", v: "u", d: 0.1, st: 2, whisper: true, gap: 0.09 }), 1.1, 1.4);
const PUMP = { up: (x) => ({ x: [x, 0.52, 0.36] }), down: (x) => ({ x: [x * 1.05, 0.38, 0.3] }) };   // fists pumping, clear of the phone
A(2.1, "phx", "grip", { side: "both", shape: "fist", dur: 0.1 });
for (let i = 0; i < 6; i++) {
  const t = 2.15 + i * 0.19;
  A(t, "phx", "squash", { amount: 0.1, dur: 0.17 }); A(t, "phx", "lean", { to: i % 2 ? -8 : 8, dur: 0.17, ease: "inOut" });
  c.arm(t, "phx", "R", i % 2 ? PUMP.down(-0.42) : PUMP.up(-0.38), 0.17, "inOut");
  c.arm(t, "phx", "L", i % 2 ? PUMP.up(0.38) : PUMP.down(0.42), 0.17, "inOut");
}
// 3.35 the mouth engine: steering with his whole body
face(3.3, { open: 0.25, curve: 0.2 }, 0.1);
noise(3.35, [{ c: "w", v: "u", d: 0.95, st: -2, glide: 9 }], 1.0, 1.3);
c.arm(3.3, "phx", "R", { x: [-0.24, 0.48, 0.42] }, 0.15, "out");   // fists on an invisible steering wheel
c.arm(3.3, "phx", "L", { x: [0.24, 0.48, 0.42] }, 0.15, "out");
A(3.35, "phx", "lean", { to: -12, dur: 0.4, ease: "inOut" });
A(3.8, "phx", "lean", { to: 10, dur: 0.45, ease: "inOut" });
A(4.3, "phx", "lean", { to: 0, dur: 0.2, ease: "inOut" });
c.arm(4.3, "phx", "R", ARMS.R, 0.25, "inOut"); c.arm(4.3, "phx", "L", ARMS.L, 0.25, "inOut");
A(4.3, "phx", "grip", { side: "both", shape: "open", dur: 0.2 });
// 4.40 two big wing flaps for the wind, "almost there!"
A(4.4, "phx", "wings", { to: 1, dur: 0.18, ease: "out" });
A(4.62, "phx", "wings", { to: 0.15, dur: 0.18, ease: "inOut" });
A(4.84, "phx", "wings", { to: 1, dur: 0.18, ease: "out" });
A(5.06, "phx", "wings", { to: 0, dur: 0.25, ease: "inOut" });
sfx(4.42, "whoosh", { gain: 0.5 });
sfx(4.86, "whoosh", { gain: 0.5 });
talk(4.55, "almost there!", 0.75);

// ---------------------------------------------------------------- 2 the call ends: asleep at once
const HANG = 5.55, PAY = 5.85;
sfx(HANG, "kenney/bong", { gain: 0.7 });
c.prop(HANG, "phone", { glow: 0 }, 0.15);
A(HANG, "phx", "still", { dur: 0.25, idle: 0 });
A(PAY, "phx", "expr", { expr: "serene", set: { open: 0, curve: 0.25 }, dur: 0.15 });
A(PAY, "phx", "pitch", { to: -22, dur: 0.18, ease: "out" });
A(PAY, "phx", "lean", { to: 16, dur: 0.18, ease: "out" });
A(PAY + 0.02, "phx", "squash", { amount: 0.15, dur: 0.3 });
sfx(PAY + 0.1, "ai/cushion-poof", { gain: 0.7 });
// snoring: a slow breath in, then out through the lips
for (const t of [6.5]) {
  noise(t, [{ c: "h", v: "o", d: 0.55, st: -6, whisper: true }], 0.6, 1.0);
  A(t, "phx", "squash", { amount: -0.035, dur: 0.6 });
  sfx(t + 0.65, "blow", { gain: 0.45 });
}

// ---------------------------------------------------------------- 3 it rings again: one eye open, back into the act
const RING = 7.4;
sfx(RING, "ringtone", { gain: 0.7 });
c.prop(RING, "phone", { glow: 1 }, 0.08);
A(RING + 0.25, "phx", "expr", { expr: "kind", set: { eye: 0.9, curve: 0.1 }, dur: 0.1 });
A(RING + 0.3, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(RING + 0.6, "phx", "pitch", { to: 6, dur: 0.25, ease: "out" });
A(RING + 0.6, "phx", "lean", { to: 0, dur: 0.25, ease: "out" });
face(RING + 0.7, { open: 0.3, curve: 0.45 }, 0.15);
talk(RING + 0.8, "yes yes I'm here", END - RING - 0.85);

// the one line on screen
cap(0, PAY + 0.3, 'my friend: "I\'m 5 minutes away"', 250, false, { kinetic: false });

// ---------------------------------------------------------------- one shot, a slow push the whole clip
const S = frame([0, 0.85, 0.15], { el: 6, h: 2.3, fov: 30, dur: END });   // no push: the clip loops, and a push would snap back at the seam
const beats = c.beats([
  ["on my way", 0, S, "hook"],
  ["yawn", 1.05, "keep"],
  ["mouth horn", 1.6, "keep"],
  ["fake running", 2.1, "keep", "escalation"],
  ["mouth engine", 3.3, "keep"],
  ["wind", 4.4, "keep"],
  ["call ends", HANG, "keep"],
  ["asleep", PAY, "keep", "payoff"],
  ["it rings again", RING, "keep"],
], END);

write(import.meta.url, {
  id: "five-minutes-away",
  title: "I'm 5 Minutes Away",
  cover: 3.6,
  idea: "Test 2 quiet gag: Phoenix fakes being on his way, mouth-made horn, running and engine, all from bed; asleep the second the call ends",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  creative: { length: [8, 12] },
  set: { type: "plain", color: "#3a6fe0", floor: "#2c58bd", light: "golden", aperture: 0, para: 0, bloom: "emissive" },
  music: { style: "funk", seed: 41, gain: 0.26, payoff: PAY },
  sound: { sfx: 0.7, ambience: 0, signature: false, auto: false, scenes: ["ui"] },
  experiment: { id: "test-2-quiet", episode: "five-minutes-away", variant: "quiet" },
  hook: { show: ["phx", "bed", "phone"], hint: 0, what: "Phoenix in bed, half asleep, talking fast at his phone" },
  cast, props, captions: c.captions, beats,
  allowClip: [{ who: "phx", with: "bed", from: 0, to: END, reason: "Phoenix sits up in bed under the blanket" }],
  notes: "Generated by storyboards/quiet/make-five-minutes-away.mjs (Test 2, quiet relatable gags).",
});
