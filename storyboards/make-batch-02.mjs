// Writes the second test batch (2026-10-24): three "the wizard takes it literally" clips with distinct stories.
// node storyboards/make-batch-02.mjs  ->  storyboards/test-02-hide-me.json, test-03-lighten-up.json, test-04-look-busy.json
import fs from "node:fs";

const set = { type: "meadow", sky: ["#7fc8ff", "#ffe6b8"], ground: ["#94d46e", "#4f9a45"], seed: 3 };
const cast = (gun = {}, wiz = {}) => [
  { id: "gun", character: "potatobrawl/gunslinger", at: [-0.48, 0], face: "3q-right", expr: "eager", arms: { R: "hips", L: "rest" }, seed: 2.2, ...gun },
  { id: "wiz", character: "potatobrawl/wizard", at: [0.48, 0], face: "3q-left", expr: "kind", arms: { R: "rest", L: "hold" }, seed: 5.7, ...wiz },
];
// the framings that worked in test-01-golden-v2
const WIDE = (at, extra = {}) => ({ at, pos: [0, 1.15, 6.1], look: [0, 0.86, 0], fov: 32, to: { pos: [0, 1.12, 5.7] }, dur: 1.1, ease: "out", ...extra });
const WIZ = (at, dur = 1.4) => ({ at, pos: [0.5, 1.45, 3.6], look: [0.48, 1.15, 0], fov: 32, to: { pos: [0.55, 1.42, 3.2] }, dur, ease: "inOut" });
const GUN = (at, dur = 2.2) => ({ at, pos: [-0.44, 1.1, 3.9], look: [-0.48, 0.74, 0], fov: 32, to: { pos: [-0.48, 1.05, 3.6] }, dur, ease: "out" });
// the wizard's spell: nod, cocky, focus, cast with the staff, chant, charge; released at `end`
const spell = (at, end, target = [-0.3, 0.1]) => [
  { who: "wiz", at, do: "expr", expr: "cocky", dur: 0.15 },
  { who: "wiz", at, do: "squash", amount: 0.09, dur: 0.28 },
  { who: "wiz", at: at + 0.3, do: "expr", expr: "focused", dur: 0.2 },
  { who: "wiz", at: at + 0.3, do: "look", to: target, dur: 0.2 },
  { who: "wiz", at: at + 0.35, do: "arm", side: "L", pose: "cast", dur: 0.4, ease: "out" },
  { who: "wiz", at: at + 0.4, do: "arm", side: "R", pose: "fist", dur: 0.35 },
  { who: "wiz", at: at + 0.4, do: "talk", dur: Math.min(0.75, end - at - 0.5), tone: "chant" },
  { who: "wiz", at: at + 0.45, do: "charge", to: 1, dur: end - at - 0.45, ease: "in" },
];
const release = (at) => [
  { who: "wiz", at, do: "charge", to: 0, dur: 0.2, ease: "out" },
  { who: "wiz", at, do: "arm", side: "L", pose: "hold", dur: 0.4 },
  { who: "wiz", at, do: "arm", side: "R", pose: "rest", dur: 0.4 },
];
const zap = (at, who, peak = 0.7) => [
  { do: "speedlines", at: at - 0.9, dur: 0.9, center: [540, 700], inner: 560, only: "anime" },
  { do: "flash", at, dur: 0.25, peak },
  { do: "shake", at, dur: 0.3, amp: 0.05 },
  { do: "poof", at, who, dur: 0.7, spark: "#ffe27a", puffs: 14 },
];

// ---------- test-02: "hide me" -> the wizard hides himself ----------
const hide = {
  id: "test-02-hide-me",
  title: "Asked the wizard to hide me",
  format: "panic -> request -> spell -> wrong person vanishes -> voice from nowhere -> slow look at the viewer",
  shares: "the friend who would leave you at the party",
  fps: 30, duration: 8.5, cover: 4.0, set,
  cast: cast({ face: "3q-left", expr: "shocked" }),
  shots: [
    { at: 0, pos: [0, 1.12, 5.6], look: [0, 0.86, 0], fov: 32, to: { pos: [-0.08, 1.08, 5.1] }, dur: 1.6, ease: "out" },
    WIZ(1.9, 1.4),
    WIDE(3.35, { to: { pos: [0, 1.12, 5.9] }, dur: 1.2 }),
    { at: 5.0, pos: [-0.44, 1.1, 3.9], look: [-0.48, 0.8, 0], fov: 32, to: { pos: [-0.48, 1.08, 3.75], look: [-0.48, 0.84, 0] }, dur: 3.5, ease: "out" },
  ],
  actions: [
    { who: "gun", at: 0.05, do: "look", to: [-0.9, 0.05], dur: 0.1 },
    { who: "gun", at: 0.05, do: "expr", expr: "shocked", dur: 0.1 },
    { who: "gun", at: 0.05, do: "arm", side: "both", pose: "cheeks", dur: 0.2 },
    { who: "gun", at: 0.1, do: "squash", amount: 0.12, dur: 0.25 },
    { who: "gun", at: 0.95, do: "turn", to: "3q-right", dur: 0.2 },
    { who: "gun", at: 0.95, do: "look", to: [0.8, 0.05], dur: 0.12 },
    { who: "gun", at: 1.0, do: "arm", side: "both", pose: "up", dur: 0.2 },
    { who: "gun", at: 1.0, do: "hop", count: 2, height: 0.08, dur: 0.6 },
    { who: "gun", at: 1.05, do: "talk", dur: 0.7, tone: "excited", rate: 5 },
    { who: "wiz", at: 0.2, do: "look", to: [-0.7, 0.05], dur: 0.15 },
    ...spell(1.95, 3.35),
    ...release(3.35),
    { who: "wiz", at: 3.4, do: "hide" },
    { who: "gun", at: 1.8, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "gun", at: 1.8, do: "expr", expr: "eager", dur: 0.2 },
    { who: "gun", at: 3.4, do: "squash", amount: 0.1, dur: 0.25 },
    { who: "gun", at: 3.9, do: "look", to: [0.9, 0], dur: 0.15 },
    { who: "gun", at: 3.9, do: "expr", expr: "shocked", dur: 0.15 },
    // the wizard answers from nowhere; the gunslinger takes it in, then looks at us
    { who: "wiz", at: 5.0, do: "talk", dur: 0.7, tone: "calm" },
    { who: "gun", at: 5.0, do: "look", to: [0.6, 0.4], dur: 0.25 },
    { who: "gun", at: 5.9, do: "expr", expr: "deadpan", dur: 0.3 },
    { who: "gun", at: 6.5, do: "turn", to: "camera", dur: 0.6 },
    { who: "gun", at: 6.5, do: "look", to: [0, 0], dur: 0.6 },
    { who: "gun", at: 7.6, do: "blink", dur: 0.4 },
  ],
  fx: zap(3.35, "wiz", 0.7),
  captions: [
    { from: 0.1, to: 0.95, text: "my ex is here.", pos: "top" },
    { from: 0.95, to: 1.9, text: "HIDE ME.", pos: "top" },
    { from: 5.0, to: 8.5, text: "\"you're welcome.\"", pos: "top" },
  ],
};

// ---------- test-03: "I need to lighten up" -> he floats away ----------
const FLOAT_AT = 2.95;
const light = {
  id: "test-03-lighten-up",
  title: "Told the wizard I need to lighten up",
  format: "sad confession -> spell -> relief -> he keeps rising -> wizard checks in -> deadpan wave from the sky",
  shares: "the friend who keeps saying they need to relax",
  fps: 30, duration: 9.5, cover: 6.8, set,
  cast: cast({ face: "3q-right", expr: "sad", arms: { R: "rest", L: "rest" } }),
  shots: [
    { at: 0, pos: [-0.3, 1.0, 4.6], look: [-0.4, 0.8, 0], fov: 32, to: { pos: [-0.1, 1.08, 5.4], look: [0, 0.86, 0] }, dur: 1.7, ease: "inOut" },
    WIZ(1.75, 1.2),
    // wide, then the camera follows him up
    { at: FLOAT_AT, pos: [0, 1.12, 5.7], look: [0, 0.9, 0], fov: 32, to: { pos: [0, 1.6, 6.0], look: [-0.3, 1.9, 0] }, dur: 1.9, ease: "inOut" },
    { at: 4.85, pos: [0.5, 1.3, 3.4], look: [0.48, 1.25, 0], fov: 34 },
    // low angle into the sky: he's way up there
    { at: 6.6, pos: [-0.2, 0.9, 4.2], look: [-0.48, 2.9, 0], fov: 36, to: { pos: [-0.25, 0.9, 4.0], look: [-0.48, 3.3, 0] }, dur: 2.9, ease: "out" },
  ],
  actions: [
    { who: "gun", at: 0.1, do: "droop", to: 1, dur: 0.6 },
    { who: "gun", at: 0.1, do: "lean", to: 6, dur: 0.5 },
    { who: "gun", at: 0.1, do: "look", to: [0.2, -0.6], dur: 0.3 },
    { who: "gun", at: 0.25, do: "talk", dur: 1.1, tone: "sad" },
    { who: "wiz", at: 0.3, do: "look", to: [-0.7, 0], dur: 0.15 },
    { who: "wiz", at: 1.2, do: "expr", expr: "eager", dur: 0.2 },
    ...spell(1.8, FLOAT_AT, [-0.3, 0.1]),
    ...release(FLOAT_AT),
    // lift-off: one very long, very high hop, cut long before its peak (y ≈ 0.8 m after 1 s, 2.3 m at the end)
    { who: "gun", at: FLOAT_AT, do: "hop", count: 1, height: 3.0, dur: 14 },
    { who: "gun", at: FLOAT_AT, do: "droop", to: 0, dur: 0.4 },
    { who: "gun", at: FLOAT_AT, do: "lean", to: 0, dur: 0.4 },
    { who: "gun", at: FLOAT_AT + 0.05, do: "expr", expr: "delighted", dur: 0.2 },
    { who: "gun", at: FLOAT_AT + 0.05, do: "look", to: [0, 0.3], dur: 0.2 },
    { who: "gun", at: FLOAT_AT + 0.1, do: "arm", side: "both", pose: "up", dur: 0.3 },
    { who: "gun", at: 3.9, do: "look", to: [0.1, -0.9], dur: 0.2 },
    { who: "gun", at: 3.95, do: "expr", expr: "shocked", dur: 0.15 },
    { who: "gun", at: 3.95, do: "arm", side: "both", pose: "cheeks", dur: 0.2 },
    { who: "wiz", at: 3.3, do: "look", to: [-0.5, 0.8], dur: 0.6 },
    { who: "wiz", at: 3.3, do: "expr", expr: "kind", dur: 0.2 },
    // the wizard, very pleased, asks up
    { who: "wiz", at: 4.85, do: "look", to: [-0.4, 0.9], dur: 0.05 },
    { who: "wiz", at: 4.85, do: "expr", expr: "delighted", dur: 0.05 },
    { who: "wiz", at: 4.95, do: "arm", side: "R", pose: "wave", dur: 0.3 },
    { who: "wiz", at: 5.0, do: "talk", dur: 0.8, tone: "question" },
    // up there: deadpan, then a small wave goodbye
    { who: "gun", at: 6.0, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "gun", at: 6.0, do: "expr", expr: "deadpan", dur: 0.2 },
    { who: "gun", at: 6.0, do: "look", to: [0.1, -0.7], dur: 0.2 },
    { who: "gun", at: 6.0, do: "turn", to: "camera", dur: 0.3 },
    { who: "gun", at: 6.9, do: "talk", dur: 0.3, tone: "calm" },
    { who: "gun", at: 7.9, do: "arm", side: "L", pose: "wave", dur: 0.35 },
    { who: "gun", at: 8.9, do: "blink", dur: 0.35 },
  ],
  fx: zap(FLOAT_AT, "gun", 0.65),
  sfx: [{ sound: "whoosh", at: FLOAT_AT + 0.1, gain: 0.35, dur: 0.6 }],
  captions: [
    { from: 0.15, to: 1.75, text: "i need to lighten up.", pos: "top" },
    { from: 1.75, to: 2.65, text: "say less.", pos: "top" },
    { from: 4.85, to: 6.6, text: "feeling lighter?", pos: "top" },
    { from: 6.85, to: 9.5, text: "...yes.", pos: "top", style: "sub" },
  ],
};

// ---------- test-04: "make me look busy" -> he can't stop ----------
const ZAP4 = 3.0;
const flail = (from, to, step0, step1) => {
  const poses = ["up", "point", "wave", "cast", "fist", "shrug", "hat", "up", "hips", "point", "cast", "wave"];
  const out = []; let t = from, i = 0;
  while (t < to) {
    const k = (t - from) / (to - from), step = step0 + (step1 - step0) * k;
    out.push({ who: "gun", at: +t.toFixed(3), do: "arm", side: i % 2 ? "L" : "R", pose: poses[i % poses.length], dur: step * 0.9 });
    if (i % 2 === 0) out.push({ who: "gun", at: +t.toFixed(3), do: "squash", amount: 0.07, dur: step * 1.6 });
    if (i % 4 === 0) out.push({ who: "gun", at: +t.toFixed(3), do: "lean", to: i % 8 ? -7 : 7, dur: step * 1.8 });
    if (i % 6 === 3) out.push({ who: "gun", at: +t.toFixed(3), do: "turn", to: i % 12 === 3 ? 25 : -25, dur: step * 2 });
    t += step; i++;
  }
  return out;
};
const busy = {
  id: "test-04-look-busy",
  title: "Asked the wizard to make me look busy",
  format: "boss alert -> request -> spell -> involuntary flailing with a calm face -> wizard approves -> 4 hours later",
  shares: "the work group chat",
  fps: 30, duration: 9.0, cover: 4.5, set,
  cast: cast({ face: "3q-left", expr: "shocked", arms: { R: "rest", L: "rest" } }),
  shots: [
    { at: 0, pos: [0, 1.12, 5.6], look: [0, 0.86, 0], fov: 32, to: { pos: [-0.08, 1.08, 5.1] }, dur: 1.5, ease: "out" },
    WIZ(1.85, 1.15),
    WIDE(ZAP4, { to: { pos: [-0.25, 1.05, 4.6], look: [-0.3, 0.84, 0] }, dur: 2.8 }),
    { at: 5.8, pos: [0.5, 1.35, 3.5], look: [0.48, 1.2, 0], fov: 32 },
    { at: 7.0, pos: [-0.44, 1.1, 4.2], look: [-0.48, 0.82, 0], fov: 32, to: { pos: [-0.48, 1.05, 3.9] }, dur: 2.0, ease: "out" },
  ],
  actions: [
    { who: "gun", at: 0.05, do: "look", to: [-0.9, 0.05], dur: 0.1 },
    { who: "gun", at: 0.05, do: "expr", expr: "shocked", dur: 0.1 },
    { who: "gun", at: 0.1, do: "squash", amount: 0.12, dur: 0.25 },
    { who: "gun", at: 0.9, do: "turn", to: "3q-right", dur: 0.2 },
    { who: "gun", at: 0.9, do: "look", to: [0.8, 0.05], dur: 0.12 },
    { who: "gun", at: 0.95, do: "arm", side: "both", pose: "point", dur: 0.2 },
    { who: "gun", at: 1.0, do: "talk", dur: 0.8, tone: "excited", rate: 5 },
    { who: "gun", at: 1.8, do: "arm", side: "both", pose: "rest", dur: 0.3 },
    { who: "gun", at: 1.8, do: "expr", expr: "eager", dur: 0.2 },
    { who: "wiz", at: 0.2, do: "look", to: [-0.7, 0.05], dur: 0.15 },
    ...spell(1.9, ZAP4),
    ...release(ZAP4),
    { who: "gun", at: ZAP4 + 0.05, do: "turn", to: "camera", dur: 0.1 },
    { who: "gun", at: ZAP4 + 0.05, do: "look", to: [0, 0], dur: 0.1 },
    { who: "gun", at: ZAP4 + 0.05, do: "expr", expr: "shocked", dur: 0.1 },
    // the flailing speeds up; his face gives up first
    ...flail(ZAP4 + 0.15, 9.0, 0.2, 0.11),
    { who: "gun", at: 4.3, do: "expr", expr: "deadpan", dur: 0.35 },
    { who: "gun", at: 7.0, do: "droop", to: 1, dur: 0.5 },
    { who: "gun", at: 8.4, do: "blink", dur: 0.4 },
    // the wizard approves
    { who: "wiz", at: 3.3, do: "look", to: [-0.6, 0], dur: 0.15 },
    { who: "wiz", at: 5.8, do: "turn", to: "camera", dur: 0.25 },
    { who: "wiz", at: 5.8, do: "look", to: [0, 0], dur: 0.2 },
    { who: "wiz", at: 5.85, do: "expr", expr: "smug", dur: 0.2 },
    { who: "wiz", at: 5.9, do: "arm", side: "R", pose: "point", dur: 0.3 },
    { who: "wiz", at: 5.95, do: "talk", dur: 0.6, tone: "calm" },
  ],
  fx: zap(ZAP4, "gun", 0.6),
  sfx: [
    { sound: "whoosh", at: 3.6, gain: 0.25, dur: 0.3 },
    { sound: "whoosh", at: 4.6, gain: 0.25, dur: 0.3 },
    { sound: "whoosh", at: 7.3, gain: 0.25, dur: 0.3 },
    { sound: "whoosh", at: 8.1, gain: 0.25, dur: 0.3 },
  ],
  captions: [
    { from: 0.1, to: 0.9, text: "boss is coming.", pos: "top" },
    { from: 0.9, to: 1.85, text: "make me look busy.", pos: "top" },
    { from: 5.8, to: 7.0, text: "very busy.", pos: "top" },
    { from: 7.0, to: 9.0, text: "4 hours later", pos: "top", style: "sub" },
  ],
};

for (const sb of [hide, light, busy]) fs.writeFileSync(new URL(`./${sb.id}.json`, import.meta.url), JSON.stringify(sb, null, 2) + "\n");
console.log("wrote 3 storyboards");
