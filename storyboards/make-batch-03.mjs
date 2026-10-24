// Writes test batch 3 (2026-10-24): the new original cast (Onion the literal stage magician, Egg, Tomato) in the new
// party, office and rooftop sets. Three jokes from batch 2 recast, three new ones.
// node storyboards/make-batch-03.mjs  ->  storyboards/test-05..test-10 *.json
import fs from "node:fs";

// "hero" is whoever asks; the magician always stands on the right
const cast = (hero, heroOpts = {}, mag = {}) => [
  { id: "hero", character: `originals/${hero}`, at: [-0.48, 0], face: "3q-right", expr: "eager", arms: { R: "rest", L: "rest" }, seed: 2.2, ...heroOpts },
  { id: "mag", character: "originals/onion", at: [0.48, 0], face: "3q-left", expr: "kind", arms: { R: "rest", L: "hold" }, seed: 5.7, ...mag },
];
const WIDE = (at, extra = {}) => ({ at, pos: [0, 1.15, 6.1], look: [0, 0.86, 0], fov: 32, to: { pos: [0, 1.12, 5.7] }, dur: 1.1, ease: "out", ...extra });
const OPEN = (dur = 1.6) => ({ at: 0, pos: [0, 1.12, 5.6], look: [0, 0.86, 0], fov: 32, to: { pos: [-0.08, 1.08, 5.1] }, dur, ease: "out" });
const MAG = (at, dur = 1.4) => ({ at, pos: [0.5, 1.4, 3.6], look: [0.48, 1.1, 0], fov: 32, to: { pos: [0.55, 1.38, 3.2] }, dur, ease: "inOut" });
const HERO = (at, dur = 2.2, z = 3.9) => ({ at, pos: [-0.44, 1.1, z], look: [-0.48, 0.8, 0], fov: 32, to: { pos: [-0.48, 1.06, z - 0.3] }, dur, ease: "out" });
// the magician's trick: cocky nod, focus, wand up, chant, charge; released at `end`
const spell = (at, end, target = [-0.3, 0.1]) => [
  { who: "mag", at, do: "expr", expr: "cocky", dur: 0.15 },
  { who: "mag", at, do: "squash", amount: 0.09, dur: 0.28 },
  { who: "mag", at: at + 0.3, do: "expr", expr: "focused", dur: 0.2 },
  { who: "mag", at: at + 0.3, do: "look", to: target, dur: 0.2 },
  { who: "mag", at: at + 0.35, do: "arm", side: "L", pose: "cast", dur: 0.4, ease: "out" },
  { who: "mag", at: at + 0.4, do: "arm", side: "R", pose: "fist", dur: 0.35 },
  { who: "mag", at: at + 0.4, do: "talk", dur: Math.min(0.75, end - at - 0.5), tone: "chant" },
  { who: "mag", at: at + 0.45, do: "charge", to: 1, dur: end - at - 0.45, ease: "in" },
];
const release = (at) => [
  { who: "mag", at, do: "charge", to: 0, dur: 0.2, ease: "out" },
  { who: "mag", at, do: "arm", side: "L", pose: "hold", dur: 0.4 },
  { who: "mag", at, do: "arm", side: "R", pose: "rest", dur: 0.4 },
];
const zap = (at, who, peak = 0.7) => [
  { do: "flash", at, dur: 0.25, peak },
  { do: "shake", at, dur: 0.3, amp: 0.05 },
  { do: "poof", at, who, dur: 0.7, spark: "#ffe27a", puffs: 14 },
];
// panicked opening: looks off left, shocked, then turns to the magician and asks
const panic = (askAt, askDur = 0.75) => [
  { who: "hero", at: 0.05, do: "look", to: [-0.9, 0.05], dur: 0.1 },
  { who: "hero", at: 0.05, do: "expr", expr: "shocked", dur: 0.1 },
  { who: "hero", at: 0.1, do: "squash", amount: 0.12, dur: 0.25 },
  { who: "hero", at: askAt, do: "turn", to: "3q-right", dur: 0.2 },
  { who: "hero", at: askAt, do: "look", to: [0.8, 0.05], dur: 0.12 },
  { who: "hero", at: askAt + 0.05, do: "talk", dur: askDur, tone: "excited", rate: 5 },
  { who: "mag", at: 0.2, do: "look", to: [-0.7, 0.05], dur: 0.15 },
];
const set = (type) => ({ type, seed: 3 });

// ---------- T05 hide me (party) ----------
const hide = {
  id: "test-05-hide-me-party", title: "Asked the magician to hide me",
  format: "panic -> request -> trick -> the magician hides himself -> voice from nowhere -> slow look at the viewer",
  shares: "the friend who would leave you at the party",
  fps: 30, duration: 8.5, cover: 4.0, set: set("party"),
  cast: cast("tomato", { face: "3q-left", expr: "shocked" }),
  shots: [OPEN(), MAG(1.9), WIDE(3.35, { to: { pos: [0, 1.12, 5.9] }, dur: 1.2 }),
    { at: 5.0, pos: [-0.44, 1.05, 3.9], look: [-0.48, 0.74, 0], fov: 32, to: { pos: [-0.48, 1.02, 3.75], look: [-0.48, 0.78, 0] }, dur: 3.5, ease: "out" }],
  actions: [
    ...panic(0.95, 0.7),
    { who: "hero", at: 0.05, do: "arm", side: "both", pose: "cheeks", dur: 0.2 },
    { who: "hero", at: 1.0, do: "arm", side: "both", pose: "up", dur: 0.2 },
    { who: "hero", at: 1.0, do: "hop", count: 2, height: 0.08, dur: 0.6 },
    { who: "hero", at: 1.8, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "hero", at: 1.8, do: "expr", expr: "eager", dur: 0.2 },
    ...spell(1.95, 3.35), ...release(3.35),
    { who: "mag", at: 3.4, do: "hide" },
    { who: "hero", at: 3.4, do: "squash", amount: 0.1, dur: 0.25 },
    { who: "hero", at: 3.9, do: "look", to: [0.9, 0], dur: 0.15 },
    { who: "hero", at: 3.9, do: "expr", expr: "shocked", dur: 0.15 },
    { who: "mag", at: 5.0, do: "talk", dur: 0.7, tone: "calm" },
    { who: "hero", at: 5.0, do: "look", to: [0.6, 0.4], dur: 0.25 },
    { who: "hero", at: 5.9, do: "expr", expr: "deadpan", dur: 0.3 },
    { who: "hero", at: 6.5, do: "turn", to: "camera", dur: 0.6 },
    { who: "hero", at: 6.5, do: "look", to: [0, 0], dur: 0.6 },
    { who: "hero", at: 7.6, do: "blink", dur: 0.4 },
  ],
  fx: zap(3.35, "mag"),
  captions: [
    { from: 0.1, to: 0.95, text: "my ex is here.", pos: "top" },
    { from: 0.95, to: 1.9, text: "HIDE ME.", pos: "top" },
    { from: 5.0, to: 8.5, text: "\"you're welcome.\"", pos: "top" },
  ],
};

// ---------- T06 lighten up (rooftop) ----------
const F = 2.95;
const light = {
  id: "test-06-lighten-up-rooftop", title: "Told the magician I need to lighten up",
  format: "sad confession -> trick -> relief -> he keeps rising over the city -> magician checks in -> deadpan wave",
  shares: "the friend who keeps saying they need to relax",
  fps: 30, duration: 9.5, cover: 6.8, set: set("rooftop"),
  cast: cast("egg", { expr: "sad" }),
  shots: [
    { at: 0, pos: [-0.3, 1.0, 4.6], look: [-0.4, 0.8, 0], fov: 32, to: { pos: [-0.1, 1.08, 5.4], look: [0, 0.86, 0] }, dur: 1.7, ease: "inOut" },
    MAG(1.75, 1.2),
    { at: F, pos: [0, 1.12, 5.7], look: [0, 0.9, 0], fov: 32, to: { pos: [0, 1.6, 6.0], look: [-0.3, 1.9, 0] }, dur: 1.9, ease: "inOut" },
    { at: 4.85, pos: [0.5, 1.3, 3.4], look: [0.48, 1.25, 0], fov: 34 },
    { at: 6.6, pos: [-0.2, 0.9, 4.2], look: [-0.48, 2.9, 0], fov: 36, to: { pos: [-0.25, 0.9, 4.0], look: [-0.48, 3.3, 0] }, dur: 2.9, ease: "out" },
  ],
  actions: [
    { who: "hero", at: 0.1, do: "lean", to: 6, dur: 0.5 },
    { who: "hero", at: 0.1, do: "look", to: [0.2, -0.6], dur: 0.3 },
    { who: "hero", at: 0.1, do: "squash", amount: -0.06, dur: 0.5 },
    { who: "hero", at: 0.25, do: "talk", dur: 1.1, tone: "sad" },
    { who: "mag", at: 0.3, do: "look", to: [-0.7, 0], dur: 0.15 },
    { who: "mag", at: 1.2, do: "expr", expr: "eager", dur: 0.2 },
    ...spell(1.8, F), ...release(F),
    { who: "hero", at: F, do: "hop", count: 1, height: 3.0, dur: 14 },
    { who: "hero", at: F, do: "lean", to: 0, dur: 0.4 },
    { who: "hero", at: F + 0.05, do: "expr", expr: "delighted", dur: 0.2 },
    { who: "hero", at: F + 0.05, do: "look", to: [0, 0.3], dur: 0.2 },
    { who: "hero", at: F + 0.1, do: "arm", side: "both", pose: "up", dur: 0.3 },
    { who: "hero", at: 3.9, do: "look", to: [0.1, -0.9], dur: 0.2 },
    { who: "hero", at: 3.95, do: "expr", expr: "shocked", dur: 0.15 },
    { who: "hero", at: 3.95, do: "arm", side: "both", pose: "cheeks", dur: 0.2 },
    { who: "mag", at: 3.3, do: "look", to: [-0.5, 0.8], dur: 0.6 },
    { who: "mag", at: 3.3, do: "expr", expr: "kind", dur: 0.2 },
    { who: "mag", at: 4.85, do: "look", to: [-0.4, 0.9], dur: 0.05 },
    { who: "mag", at: 4.85, do: "expr", expr: "delighted", dur: 0.05 },
    { who: "mag", at: 4.95, do: "arm", side: "R", pose: "wave", dur: 0.3 },
    { who: "mag", at: 5.0, do: "talk", dur: 0.8, tone: "question" },
    { who: "hero", at: 6.0, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "hero", at: 6.0, do: "expr", expr: "deadpan", dur: 0.2 },
    { who: "hero", at: 6.0, do: "look", to: [0.1, -0.7], dur: 0.2 },
    { who: "hero", at: 6.0, do: "turn", to: "camera", dur: 0.3 },
    { who: "hero", at: 6.9, do: "talk", dur: 0.3, tone: "calm" },
    { who: "hero", at: 7.9, do: "arm", side: "L", pose: "wave", dur: 0.35 },
    { who: "hero", at: 8.9, do: "blink", dur: 0.35 },
  ],
  fx: zap(F, "hero", 0.65),
  sfx: [{ sound: "whoosh", at: F + 0.1, gain: 0.35, dur: 0.6 }],
  captions: [
    { from: 0.15, to: 1.75, text: "i need to lighten up.", pos: "top" },
    { from: 1.75, to: 2.65, text: "say less.", pos: "top" },
    { from: 4.85, to: 6.6, text: "feeling lighter?", pos: "top" },
    { from: 6.85, to: 9.5, text: "...yes.", pos: "top", style: "sub" },
  ],
};

// ---------- T07 look busy (office) ----------
const Z = 3.0;
const flail = (from, to, step0, step1) => {
  const poses = ["up", "point", "wave", "cast", "fist", "shrug", "hat", "up", "hips", "point", "cast", "wave"];
  const out = []; let t = from, i = 0;
  while (t < to) {
    const step = step0 + (step1 - step0) * ((t - from) / (to - from));
    out.push({ who: "hero", at: +t.toFixed(3), do: "arm", side: i % 2 ? "L" : "R", pose: poses[i % poses.length], dur: step * 0.9 });
    if (i % 2 === 0) out.push({ who: "hero", at: +t.toFixed(3), do: "squash", amount: 0.07, dur: step * 1.6 });
    if (i % 4 === 0) out.push({ who: "hero", at: +t.toFixed(3), do: "lean", to: i % 8 ? -7 : 7, dur: step * 1.8 });
    if (i % 6 === 3) out.push({ who: "hero", at: +t.toFixed(3), do: "turn", to: i % 12 === 3 ? 25 : -25, dur: step * 2 });
    t += step; i++;
  }
  return out;
};
const busy = {
  id: "test-07-look-busy-office", title: "Asked the magician to make me look busy",
  format: "boss alert -> request -> trick -> involuntary flailing with a calm face -> magician approves -> 4 hours later",
  shares: "the work group chat",
  fps: 30, duration: 9.0, cover: 4.5, set: set("office"),
  cast: cast("egg", { face: "3q-left", expr: "shocked" }),
  shots: [OPEN(1.5), MAG(1.85, 1.15),
    WIDE(Z, { to: { pos: [-0.25, 1.05, 4.6], look: [-0.3, 0.84, 0] }, dur: 2.8 }),
    { at: 5.8, pos: [0.5, 1.3, 3.5], look: [0.48, 1.15, 0], fov: 32 },
    { at: 7.0, pos: [-0.44, 1.1, 4.2], look: [-0.48, 0.84, 0], fov: 32, to: { pos: [-0.48, 1.06, 3.9] }, dur: 2.0, ease: "out" }],
  actions: [
    ...panic(0.9, 0.8),
    { who: "hero", at: 0.95, do: "arm", side: "both", pose: "point", dur: 0.2 },
    { who: "hero", at: 1.8, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "hero", at: 1.8, do: "expr", expr: "eager", dur: 0.2 },
    ...spell(1.9, Z), ...release(Z),
    { who: "hero", at: Z + 0.05, do: "turn", to: "camera", dur: 0.1 },
    { who: "hero", at: Z + 0.05, do: "look", to: [0, 0], dur: 0.1 },
    { who: "hero", at: Z + 0.05, do: "expr", expr: "shocked", dur: 0.1 },
    ...flail(Z + 0.15, 9.0, 0.2, 0.11),
    { who: "hero", at: 4.3, do: "expr", expr: "deadpan", dur: 0.35 },
    { who: "hero", at: 8.4, do: "blink", dur: 0.4 },
    { who: "mag", at: 3.3, do: "look", to: [-0.6, 0], dur: 0.15 },
    { who: "mag", at: 5.8, do: "turn", to: "camera", dur: 0.25 },
    { who: "mag", at: 5.8, do: "look", to: [0, 0], dur: 0.2 },
    { who: "mag", at: 5.85, do: "expr", expr: "smug", dur: 0.2 },
    { who: "mag", at: 5.9, do: "arm", side: "R", pose: "point", dur: 0.3 },
    { who: "mag", at: 5.95, do: "talk", dur: 0.6, tone: "calm" },
  ],
  fx: zap(Z, "hero", 0.6),
  sfx: [3.6, 4.6, 7.3, 8.1].map((at) => ({ sound: "whoosh", at, gain: 0.25, dur: 0.3 })),
  captions: [
    { from: 0.1, to: 0.9, text: "boss is coming.", pos: "top" },
    { from: 0.9, to: 1.85, text: "make me look busy.", pos: "top" },
    { from: 5.8, to: 7.0, text: "very busy.", pos: "top" },
    { from: 7.0, to: 9.0, text: "4 hours later", pos: "top", style: "sub" },
  ],
};

// ---------- T08 make me disappear (office) ----------
const D = 3.1;
const vanish = {
  id: "test-08-disappear-office", title: "Asked the magician to make me disappear from a meeting",
  format: "meeting dread -> request -> trick -> he's gone -> magician explains to camera -> hold",
  shares: "coworkers stuck in the same meetings",
  fps: 30, duration: 8.0, cover: 5.5, set: set("office"),
  cast: cast("egg", { expr: "sad" }),
  shots: [
    { at: 0, pos: [-0.35, 1.05, 4.2], look: [-0.45, 0.82, 0], fov: 32, to: { pos: [-0.3, 1.05, 3.9] }, dur: 1.6, ease: "out" },
    WIDE(1.6, { to: { pos: [0, 1.12, 5.6] }, dur: 0.9 }),
    MAG(2.2, 0.9),
    WIDE(D, { pos: [0, 1.12, 5.8], to: { pos: [0, 1.12, 5.6] }, dur: 1.4 }),
    { at: 4.9, pos: [0.5, 1.3, 3.6], look: [0.48, 1.15, 0], fov: 32, to: { pos: [0.5, 1.28, 3.3] }, dur: 3.1, ease: "out" },
  ],
  actions: [
    { who: "hero", at: 0.05, do: "look", to: [0, -0.2], dur: 0.2 },
    { who: "hero", at: 0.05, do: "turn", to: "camera", dur: 0.01 },
    { who: "hero", at: 0.2, do: "expr", expr: "deadpan", dur: 0.3 },
    { who: "hero", at: 0.3, do: "talk", dur: 1.0, tone: "sad" },
    { who: "hero", at: 1.6, do: "turn", to: "3q-right", dur: 0.25 },
    { who: "hero", at: 1.6, do: "look", to: [0.8, 0.05], dur: 0.15 },
    { who: "hero", at: 1.65, do: "expr", expr: "eager", dur: 0.2 },
    { who: "hero", at: 1.65, do: "arm", side: "both", pose: "cheeks", dur: 0.25 },
    { who: "hero", at: 1.7, do: "talk", dur: 0.6, tone: "question" },
    { who: "mag", at: 0.3, do: "look", to: [-0.7, 0], dur: 0.15 },
    ...spell(2.2, D), ...release(D),
    { who: "hero", at: D + 0.05, do: "hide" },
    // he turns to us and explains
    { who: "mag", at: 3.6, do: "look", to: [-0.8, 0], dur: 0.15 },
    { who: "mag", at: 4.9, do: "turn", to: "camera", dur: 0.3 },
    { who: "mag", at: 4.9, do: "look", to: [0, 0], dur: 0.2 },
    { who: "mag", at: 4.95, do: "expr", expr: "smug", dur: 0.2 },
    { who: "mag", at: 5.0, do: "arm", side: "R", pose: "shrug", dur: 0.3, ease: "out" },
    { who: "mag", at: 5.0, do: "lean", to: -4, dur: 0.3 },
    { who: "mag", at: 5.05, do: "talk", dur: 0.9, tone: "calm" },
    { who: "mag", at: 7.2, do: "blink", dur: 0.35 },
  ],
  fx: zap(D, "hero", 0.65),
  sfx: [{ sound: "tink", at: 7.3, gain: 0.15 }],
  captions: [
    { from: 0.15, to: 1.6, text: "this meeting could've been an email.", pos: 250 },
    { from: 1.6, to: 2.6, text: "make me disappear.", pos: "top" },
    { from: 4.95, to: 8.0, text: "he works from home now.", pos: "top" },
  ],
};

// ---------- T09 be the bigger person (party) ----------
const G = 3.0;
const bigger = {
  id: "test-09-bigger-person-party", title: "Asked the magician to make me the bigger person",
  format: "annoyed request -> trick -> he becomes enormous -> magician squeezed aside -> smug win",
  shares: "the friend who always has to win the argument",
  fps: 30, duration: 8.5, cover: 5.2, set: set("party"),
  cast: cast("tomato", { at: [-0.55, 0], expr: "stern", arms: { R: "hips", L: "hips" } }, { at: [0.55, 0] }),
  shots: [
    { at: 0, pos: [-0.4, 1.05, 4.0], look: [-0.5, 0.78, 0], fov: 32, to: { pos: [-0.4, 1.05, 3.7] }, dur: 1.8, ease: "out" },
    MAG(1.9, 1.1),
    { at: G, pos: [0.1, 1.3, 6.4], look: [0.1, 1.0, 0], fov: 34, to: { pos: [0.2, 1.6, 8.8], look: [0.2, 1.35, 0] }, dur: 1.6, ease: "out" },
    { at: 5.3, pos: [0.25, 1.4, 7.6], look: [0.15, 1.45, 0], fov: 34, to: { pos: [0.25, 1.45, 7.2] }, dur: 3.2, ease: "out" },
  ],
  actions: [
    { who: "hero", at: 0.05, do: "look", to: [-0.8, 0.1], dur: 0.15 },
    { who: "hero", at: 0.1, do: "talk", dur: 0.8, tone: "excited" },
    { who: "hero", at: 0.9, do: "turn", to: "3q-right", dur: 0.25 },
    { who: "hero", at: 0.9, do: "look", to: [0.8, 0], dur: 0.15 },
    { who: "hero", at: 0.95, do: "talk", dur: 0.8, tone: "question" },
    { who: "hero", at: 1.0, do: "expr", expr: "deadpan", dur: 0.2 },
    { who: "mag", at: 0.3, do: "look", to: [-0.7, 0], dur: 0.15 },
    ...spell(1.9, G), ...release(G),
    { who: "hero", at: G, do: "grow", to: 2.3, dur: 0.6, ease: "back" },
    { who: "hero", at: G, do: "expr", expr: "shocked", dur: 0.1 },
    { who: "hero", at: G, do: "look", to: [0, -0.5], dur: 0.2 },
    { who: "hero", at: G, do: "arm", side: "both", pose: "up", dur: 0.3 },
    { who: "mag", at: G + 0.1, do: "move", to: [1.15, 0.7], dur: 0.35, ease: "out" },
    { who: "mag", at: G + 0.1, do: "expr", expr: "shocked", dur: 0.1 },
    { who: "mag", at: G + 0.1, do: "squash", amount: 0.15, dur: 0.3 },
    { who: "mag", at: 4.0, do: "look", to: [-0.6, 0.9], dur: 0.3 },
    { who: "mag", at: 4.0, do: "expr", expr: "kind", dur: 0.3 },
    // looking down at the room, then at us: argument over
    { who: "hero", at: 4.2, do: "arm", side: "both", pose: "hips", dur: 0.35 },
    { who: "hero", at: 4.2, do: "expr", expr: "smug", dur: 0.3 },
    { who: "hero", at: 4.2, do: "look", to: [-0.7, -0.6], dur: 0.3 },
    { who: "hero", at: 5.4, do: "turn", to: "camera", dur: 0.5 },
    { who: "hero", at: 5.4, do: "look", to: [0, -0.15], dur: 0.4 },
    { who: "hero", at: 6.0, do: "expr", expr: "cocky", dur: 0.25 },
    { who: "hero", at: 7.6, do: "blink", dur: 0.35 },
  ],
  fx: zap(G, "hero", 0.6),
  sfx: [{ sound: "whoosh", at: G + 0.05, gain: 0.35, dur: 0.5 }],
  captions: [
    { from: 0.1, to: 0.9, text: "she said i should be...", pos: 250 },
    { from: 0.9, to: 1.9, text: "...the bigger person.", pos: 250 },
    { from: 5.4, to: 8.5, text: "argument: won.", pos: "top" },
  ],
};

// ---------- T10 I need some space (rooftop, no magic) ----------
const space = {
  id: "test-10-space-rooftop", title: "Told the magician I need some space",
  format: "sigh -> polite nod -> he backs away, and away -> 'is this enough?' -> one more step",
  shares: "the friend who said they need space",
  fps: 30, duration: 9.0, cover: 6.2, set: set("rooftop"),
  cast: cast("tomato", { expr: "sad", arms: { R: "rest", L: "rest" } }),
  shots: [
    { at: 0, pos: [-0.35, 1.0, 4.0], look: [-0.45, 0.78, 0], fov: 32, to: { pos: [-0.35, 1.0, 3.7] }, dur: 1.8, ease: "out" },
    MAG(1.9, 1.0),
    { at: 2.9, pos: [-0.6, 1.15, 4.4], look: [0.6, 0.8, -0.4], fov: 38, to: { pos: [-1.0, 1.2, 4.6], look: [1.3, 0.8, -0.8] }, dur: 3.0, ease: "inOut" },
    { at: 5.9, pos: [-0.44, 1.05, 3.9], look: [-0.48, 0.78, 0], fov: 32, to: { pos: [-0.48, 1.02, 3.7] }, dur: 1.4, ease: "out" },
    { at: 7.3, pos: [-1.0, 1.2, 4.6], look: [1.45, 0.8, -0.9], fov: 38 },
  ],
  actions: [
    { who: "hero", at: 0.1, do: "look", to: [0.3, -0.5], dur: 0.3 },
    { who: "hero", at: 0.1, do: "lean", to: 5, dur: 0.5 },
    { who: "hero", at: 0.2, do: "talk", dur: 1.0, tone: "sad" },
    { who: "mag", at: 0.3, do: "look", to: [-0.7, 0], dur: 0.15 },
    { who: "mag", at: 1.95, do: "expr", expr: "kind", dur: 0.2 },
    { who: "mag", at: 2.0, do: "squash", amount: 0.12, dur: 0.3 },
    { who: "mag", at: 2.4, do: "squash", amount: 0.12, dur: 0.3 },
    // he backs away, still facing his friend, all the way to the corner
    { who: "mag", at: 3.0, do: "move", to: [2.6, -1.3], dur: 2.6, ease: "inOut", steps: 2.6 },
    { who: "mag", at: 5.7, do: "turn", to: -50, dur: 0.3 },
    { who: "hero", at: 3.4, do: "look", to: [0.8, 0.0], dur: 0.6 },
    { who: "hero", at: 5.9, do: "lean", to: 0, dur: 0.3 },
    { who: "hero", at: 5.9, do: "expr", expr: "deadpan", dur: 0.3 },
    { who: "hero", at: 5.9, do: "look", to: [0.9, 0.05], dur: 0.1 },
    { who: "mag", at: 6.0, do: "arm", side: "R", pose: "wave", dur: 0.3 },
    { who: "mag", at: 6.0, do: "talk", dur: 0.7, tone: "question" },
    { who: "hero", at: 6.6, do: "turn", to: "camera", dur: 0.5 },
    { who: "hero", at: 6.6, do: "look", to: [0, 0], dur: 0.4 },
    { who: "mag", at: 7.0, do: "arm", side: "R", pose: "rest", dur: 0.3 },
    { who: "mag", at: 7.6, do: "move", to: [2.85, -1.45], dur: 0.4, ease: "inOut" },
    { who: "mag", at: 7.6, do: "hop", count: 1, height: 0.08, dur: 0.4 },
    { who: "mag", at: 8.2, do: "expr", expr: "delighted", dur: 0.2 },
  ],
  fx: [],
  captions: [
    { from: 0.15, to: 1.9, text: "i need some space.", pos: "top" },
    { from: 6.0, to: 7.3, text: "\"is this enough?\"", pos: "top" },
    { from: 7.6, to: 9.0, text: "*one more step*", pos: "top", style: "sub" },
  ],
};

for (const sb of [hide, light, busy, vanish, bigger, space]) fs.writeFileSync(new URL(`./${sb.id}.json`, import.meta.url), JSON.stringify(sb, null, 2) + "\n");
console.log("wrote 6 storyboards");
