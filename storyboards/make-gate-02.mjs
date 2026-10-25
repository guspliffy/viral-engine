// GATE v2, one continuous take (Jonny, 2026-10-24: "keep it one scene and every character goes differently through it",
// and it must look clean, nothing glitchy). The 10 fighters queue up behind the hedge, walk in one after another,
// get past the gate their own way and walk off the other side. No cuts, no camera jumps, no impact frames, no
// flicker, nobody passes through solid wood. What happens to the gate stays: the order runs from gentle to
// destructive (opened, shot, sliced, burnt, smashed), so the damage builds up to the Viking's finale.
// Writes storyboards/gate-02-one-take.json. Each FIGHTERS entry: who, stunt, stunt length, and its actions / gate
// changes / fx / sfx with times relative to the start of the stunt (the walk in and out is added around it).
//   node storyboards/make-gate-02.mjs
import { writeFileSync } from "node:fs";

const ENTER = [-2.1, -0.9], MARK = [0, -0.9], FRONT = [0, 1.1], EXIT = [2.1, 1.1];   // FRONT is clear of the gate leaves when they swing open
const WALK_IN = 0.55, WALK_OUT = 0.45, OVERLAP = 0.35;   // the next fighter walks in while the last one walks off

const FIGHTERS = [
  { id: "ast", character: "astronaut", stunt: "floats over in zero gravity", len: 1.3, expr: "eager", b: (A) => [
    A(0.0, "arm", { side: "both", pose: "up", dur: 0.25 }),
    A(0.0, "fly", { to: { y: 0.8, z: -0.3 }, dur: 0.5, ease: "out" }),
    A(0.5, "fly", { to: { y: 0.25, z: 1.1 }, dur: 0.5, ease: "inOut" }),
    A(0.5, "expr", { expr: "delighted" }),
    A(1.0, "drop", { to: 0, dur: 0.2 }),
    A(1.05, "arm", { side: "both", pose: "rest", dur: 0.25 }),
  ], sfx: [{ sound: "whoosh", at: 0.0, dur: 0.9, gain: 0.25 }] },

  { id: "rea", character: "reaper", stunt: "opens it, walks through, closes it neatly", len: 1.4, expr: "deadpan", b: (A, G) => [
    G(0.05, { open: 1 }, 0.35, "out"),
    A(0.2, "move", { to: FRONT, dur: 0.65, steps: 1.6 }),
    G(0.9, { open: 0 }, 0.3, "in"),
    A(0.95, "turn", { to: "3q-left", dur: 0.15 }),
    A(1.15, "turn", { to: "camera", dur: 0.15 }),
    A(1.15, "look", { to: [0, 0], dur: 0.1 }),
  ], sfx: [{ sound: "tink", at: 1.2, gain: 0.2 }] },

  { id: "sor", character: "sorcerer", stunt: "portals through", len: 1.3, expr: "evil", b: (A, G) => [
    A(0.0, "charge", { to: 1, dur: 0.25 }),
    A(0.0, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    G(0.1, { open: 1 }, 0.3, "back", "portal-b"), G(0.1, { open: 1 }, 0.3, "back", "portal-f"),
    A(0.45, "move", { to: [0, -0.62], dur: 0.2 }),
    A(0.5, "grow", { to: 0.01, dur: 0.15, ease: "in" }),      // shrinks into the back portal...
    A(0.66, "move", { to: [0, 0.3], dur: 0.01 }),
    A(0.7, "grow", { to: 1, dur: 0.2, ease: "back" }),         // ...and grows out of the front one
    A(0.8, "move", { to: FRONT, dur: 0.3 }),
    A(0.75, "charge", { to: 0, dur: 0.3 }),
    A(0.75, "arm", { side: "L", pose: "rest", dur: 0.2 }),
    G(0.95, { open: 0 }, 0.25, "in", "portal-b"), G(0.95, { open: 0 }, 0.25, "in", "portal-f"),
    A(1.0, "expr", { expr: "smug" }),
  ], sfx: [{ sound: "charge", at: 0.05, dur: 0.45, gain: 0.22 }, { sound: "pop", at: 0.65, gain: 0.3 }, { sound: "pop", at: 0.75, gain: 0.3 }] },

  { id: "wiz", character: "wizard", stunt: "spell fizzles, so he jumps it", len: 1.6, expr: "eager", b: (A) => [
    A(0.0, "arm", { side: "R", pose: "cast", dur: 0.2 }),
    A(0.0, "charge", { to: 1, dur: 0.3 }),
    A(0.4, "charge", { to: 0, dur: 0.15 }),
    A(0.45, "expr", { expr: "sad" }),
    A(0.45, "droop", { to: 1, dur: 0.25 }),
    A(0.7, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(0.8, "hop", { height: 0.8, dur: 0.6 }),
    A(0.8, "move", { to: FRONT, dur: 0.6 }),
    A(1.4, "hat", { off: [0.12, -0.08, 0.04], spin: [0, 0, -30], dur: 0.15 }),
    A(1.4, "expr", { expr: "dizzy" }),
  ], fx: [{ do: "poof", pos: [0, 1.25, -0.8], at: 0.4, dur: 0.4, puffs: 4, sparks: 6, spark: "#c8b6ff" }],
  sfx: [{ sound: "sadslide", at: 0.42, gain: 0.22 }] },

  { id: "dra", character: "dragon", stunt: "flies over and sets the hedge on fire", len: 1.5, expr: "eager", b: (A, G) => [
    A(0.0, "fly", { to: { y: 0.8, z: -0.3 }, dur: 0.45 }),
    G(0.35, { fire: 1 }, 0.3, "out", "fire"),
    A(0.45, "fly", { to: { y: 0.45, z: 1.1 }, dur: 0.4 }),
    A(0.85, "drop", { to: 0, dur: 0.2 }),
    A(1.0, "turn", { to: "3q-left", dur: 0.15 }),
    A(1.05, "expr", { expr: "shocked" }),
    A(1.05, "arm", { side: "both", pose: "cheeks", dur: 0.15 }),
    G(1.3, { fire: 0 }, 0.5, "in", "fire"),
  ], fx: [{ do: "poof", pos: [-1.0, 1.1, 0.3], at: 0.35, dur: 0.5, puffs: 4, sparks: 14, spark: "#ff9a2e" },
    { do: "poof", pos: [-1.0, 1.15, 0.3], at: 1.35, dur: 0.8, puffs: 10, sparks: 0 }],
  sfx: [{ sound: "whoosh", at: 0.0, dur: 0.8, gain: 0.28 }, { sound: "poof", at: 1.35, gain: 0.25 }] },

  { id: "phx", character: "phoenix", stunt: "flashy flip, lands flat, gets up", len: 1.9, expr: "cocky", b: (A) => [
    A(0.0, "wings", { to: 1, dur: 0.2 }),
    A(0.1, "hop", { height: 1.05, dur: 0.8 }),
    A(0.1, "move", { to: [0.25, 1.0], dur: 0.8 }),
    A(0.1, "pitch", { to: 360, dur: 0.7 }),
    A(0.88, "lean", { to: 85, dur: 0.12, ease: "in" }),
    A(0.88, "expr", { expr: "dizzy" }),
    A(0.95, "wings", { to: 0, dur: 0.25 }),
    A(1.45, "lean", { to: 0, dur: 0.3, ease: "out" }),
    A(1.6, "expr", { expr: "cocky" }),
  ], fx: [{ do: "shake", at: 1.0, dur: 0.18, amp: 0.025 }], sfx: [{ sound: "land", at: 1.0, gain: 0.5 }] },

  { id: "gun", character: "gunslinger", stunt: "shoots the latch off, kicks it open", len: 1.4, expr: "cocky", b: (A, G) => [
    A(0.0, "arm", { side: "R", pose: "point", dur: 0.15 }),
    G(0.2, { latch: 1 }, 0.5, "out"),
    A(0.45, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    G(0.45, { open: 1 }, 0.3, "out"),
    A(0.5, "move", { to: FRONT, dur: 0.55 }),
    G(1.05, { open: 0.25 }, 0.35, "inOut"),
    A(1.1, "arm", { side: "L", pose: "hips", dur: 0.2 }),
  ], fx: [{ do: "flash", at: 0.2, dur: 0.1, peak: 0.25 }, { do: "poof", pos: [0.05, 0.4, 0.15], at: 0.2, dur: 0.4, puffs: 4, sparks: 12, spark: "#ffd36b" }],
  sfx: [{ sound: "impact", at: 0.2, gain: 0.35 }, { sound: "tink", at: 0.5, gain: 0.25 }] },

  { id: "sam", character: "samurai", stunt: "slices the top off and steps over", len: 1.5, expr: "focused", b: (A, G) => [
    G(0.0, { open: 0 }, 0.2, "in"),
    A(0.0, "charge", { to: 1, dur: 0.25 }),
    A(0.15, "arm", { side: "R", pose: "up", dur: 0.12 }),
    A(0.35, "arm", { side: "R", pose: "point", dur: 0.08 }),
    G(0.4, { slice: 1 }, 0.7, "linear"),
    A(0.9, "hop", { height: 0.55, dur: 0.45 }),
    A(0.9, "move", { to: FRONT, dur: 0.45 }),
    A(1.3, "charge", { to: 0, dur: 0.25 }),
    A(1.3, "expr", { expr: "serene" }),
  ], fx: [{ do: "flash", at: 0.4, dur: 0.12, peak: 0.25 }],
  sfx: [{ sound: "whoosh", at: 0.35, dur: 0.2, gain: 0.32 }, { sound: "tink", at: 0.42, gain: 0.28 }] },

  { id: "all", character: "allfather", stunt: "lightning, then steps over the ashes", len: 1.6, expr: "stern", b: (A, G) => [
    A(0.0, "arm", { side: "R", pose: "up", dur: 0.25 }),
    G(0.3, { on: 1 }, 0.01, "linear", "bolt"), G(0.55, { on: 0 }, 0.01, "linear", "bolt"),
    G(0.32, { scorch: 1 }, 0.15),
    A(0.7, "arm", { side: "R", pose: "rest", dur: 0.25 }),
    A(0.85, "hop", { height: 0.4, dur: 0.4 }),
    A(0.85, "move", { to: FRONT, dur: 0.55, steps: 1.8 }),
  ], fx: [{ do: "flash", at: 0.3, dur: 0.2, peak: 0.35 }, { do: "shake", at: 0.3, dur: 0.25, amp: 0.035 },
    { do: "poof", pos: [0, 0.3, 0.1], at: 0.4, dur: 0.9, puffs: 12, sparks: 8, spark: "#bfe4ff" }],
  sfx: [{ sound: "impact", at: 0.3, gain: 0.4 }] },

  { id: "vik", character: "viking", stunt: "charges and smashes what's left", len: 2.75, expr: "delighted", last: true, b: (A, G) => [
    A(0.0, "arm", { side: "L", pose: "up", dur: 0.2 }),
    A(0.05, "move", { to: [0, -0.25], dur: 0.4, ease: "in", steps: 4 }),
    G(0.45, { smash: 1 }, 1.1, "linear"),
    A(0.45, "move", { to: FRONT, dur: 0.45, ease: "out", steps: 3 }),
    A(1.0, "arm", { side: "both", pose: "up", dur: 0.25 }),
    A(1.0, "hop", { height: 0.3, count: 2, dur: 0.7 }),
    A(1.75, "arm", { side: "both", pose: "hips", dur: 0.25 }),
    A(1.8, "look", { to: [0, 0], dur: 0.15 }),
  ], fx: [{ do: "flash", at: 0.5, dur: 0.18, peak: 0.35 }, { do: "shake", at: 0.45, dur: 0.4, amp: 0.06 },
    { do: "poof", pos: [0, 0.3, 0.1], at: 0.47, dur: 0.9, puffs: 16, sparks: 12, spark: "#ffcf6b" }],
  sfx: [{ sound: "impact", at: 0.45, gain: 0.5 }] },
];

// ---- assemble ----
const sb = {
  id: "gate-02-one-take",
  title: "GATE (one take): how each fighter gets past it",
  format: "each-character-vs-X, one continuous take: fighters queue in, each crosses the obstacle their own way, damage carries over, biggest last",
  fps: 30, set: { type: "garden", gap: 1.5 }, sound: { sfx: 0.5 },
  music: { bpm: 120, offset: 0, gain: 0.55, parts: [{ at: 0, part: "main" }] },
  cast: [], shots: [], actions: [], fx: [], sfx: [], captions: [], beats: [],
  props: [
    { id: "gate", kind: "gate", x: 0, z: 0 },
    { id: "portal-b", kind: "portal", x: 0, z: -0.6, scale: 0.8 }, { id: "portal-f", kind: "portal", x: 0, z: 0.3, scale: 0.8 },
    { id: "bolt", kind: "bolt", x: 0, z: 0.05 }, { id: "fire", kind: "flames", x: -1.0, y: 1.05, z: 0.3, scale: 1.4 },
  ],
};
const r3 = (x) => Math.round(x * 1000) / 1000;
let t0 = 0;   // when the current fighter starts walking in
for (const [i, f] of FIGHTERS.entries()) {
  const s0 = t0 + WALK_IN, at = (x) => r3(s0 + x);
  const A = (t, d, o = {}) => ({ who: f.id, at: at(t), do: d, ...o });
  const G = (t, set, dur = 0.3, ease = "inOut", id = "gate") => ({ do: "prop", id, at: at(t), dur, ease, set });
  sb.cast.push({ id: f.id, character: `potatobrawl/${f.character}`, at: ENTER, face: "right", expr: f.expr, seed: 1.3 + i * 0.7 });
  // off-screen behind the hedge until it's their turn, walk to the mark, face the camera, stunt, walk off to the right
  sb.actions.push({ who: f.id, at: 0, do: "hide" }, { who: f.id, at: r3(t0), do: "show" },
    { who: f.id, at: r3(t0), do: "move", to: MARK, dur: WALK_IN, ease: "out", steps: 3 },
    { who: f.id, at: r3(s0 - 0.15), do: "turn", to: "camera", dur: 0.15 }, ...f.b(A, G));
  const end = s0 + f.len;
  if (!f.last) sb.actions.push({ who: f.id, at: r3(end), do: "turn", to: "right", dur: 0.12 },
    { who: f.id, at: r3(end), do: "move", to: EXIT, dur: WALK_OUT, ease: "in", steps: 3 }, { who: f.id, at: r3(end + WALK_OUT), do: "hide" });
  for (const x of f.fx || []) sb.fx.push({ ...x, at: at(x.at) });
  for (const x of f.sfx || []) sb.sfx.push({ ...x, at: at(x.at) });
  sb.beats.push({ who: f.id, character: f.character, stunt: f.stunt, from: r3(t0), to: r3(end) });
  t0 = end - OVERLAP + 0.15;   // the next one starts walking in just before this one walks off
}
sb.duration = r3(sb.beats.at(-1).to);
sb.cover = r3(sb.beats.at(-1).to - 0.6);
// one camera, no cuts: a slow push over the whole clip
sb.shots.push({ at: 0, pos: [0.35, 1.95, 5.6], look: [0, 0.72, -0.2], fov: 40, to: { pos: [0.2, 1.8, 4.9], look: [0, 0.7, -0.1] }, dur: sb.duration, ease: "linear" });
sb.captions.push({ from: 0, to: sb.duration, text: "GATE", style: "label", pos: 230, pop: false });
sb.captions.push({ from: 0, to: 1.2, text: "10 fighters. 1 gate.", style: "sub", pos: 370 });
sb.captions.push({ from: r3(sb.beats.at(-1).from + WALK_IN + 1.55), to: sb.duration, text: "which one are you?", pos: 370 });
// contact that is the stunt itself: into and out of the portals, the axe through the gate
const sor = sb.beats.find((b) => b.who === "sor"), vik = sb.beats.at(-1);
sb.allowClip = [{ who: "sor", from: sor.from, to: sor.to }, { who: "vik", from: vik.from, to: vik.to }];
writeFileSync(new URL("./gate-02-one-take.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`gate-02-one-take: ${sb.duration} s, ${FIGHTERS.length} fighters`);
