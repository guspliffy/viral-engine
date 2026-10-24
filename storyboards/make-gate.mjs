// GATE: "how each fighter gets past the gate". One garden set, one gate, the 10 PotatoBrawl fighters cross it one
// after another in about 2 s each with hard cuts, ending on the Viking smashing it. Format from a reference TikTok
// Jonny shared (2026-10-24), rebuilt with our cast and our own stunts.
// Writes storyboards/gate-01-the-gate.json. Each BEATS entry is one fighter: who, stunt, length, and its own
// actions / props / fx / sfx with times relative to the beat's start.
//   node storyboards/make-gate.mjs
import { writeFileSync } from "node:fs";

const BACK = [0, -1.3], FRONT = [0, 0.55];   // behind the gate (heads peek over it) and in front of it
const GATE_RESET = { open: 0, latch: 0, slice: 0, smash: 0, scorch: 0 };

const BEATS = [
  { id: "ast", character: "astronaut", stunt: "floats over in zero gravity", len: 2.3, expr: "eager", b: (A) => [
    A("ast", 0.15, "fly", { to: { y: 0.6, z: -0.2 }, dur: 0.85, ease: "out" }),
    A("ast", 0.3, "arm", { side: "both", pose: "up", dur: 0.4 }),
    A("ast", 1.0, "fly", { to: { y: 0.55, z: 0.55 }, dur: 0.6, ease: "inOut" }),
    A("ast", 1.0, "expr", { expr: "delighted" }),
    A("ast", 1.6, "drop", { to: 0, dur: 0.3 }),
    A("ast", 1.7, "arm", { side: "R", pose: "wave", dur: 0.25 }),
  ], sfx: [{ sound: "whoosh", at: 0.15, dur: 0.8, gain: 0.25 }] },

  { id: "gun", character: "gunslinger", stunt: "shoots the latch off and struts through", len: 2.2, expr: "cocky", b: (A, P) => [
    A("gun", 0.1, "arm", { side: "R", pose: "point", dur: 0.15 }),
    P(0.35, { latch: 1 }, 0.55, "out"),
    P(0.7, { open: 1 }, 0.35, "out"),
    A("gun", 0.95, "move", { to: FRONT, dur: 0.9 }),
    A("gun", 1.0, "arm", { side: "R", pose: "rest", dur: 0.3 }),
    A("gun", 1.85, "arm", { side: "L", pose: "hips", dur: 0.2 }),
  ], fx: [{ do: "flash", at: 0.35, dur: 0.12, peak: 0.35 }, { do: "poof", pos: [0.05, 0.62, 0.15], at: 0.35, dur: 0.5, puffs: 6, sparks: 14, spark: "#ffd36b" }],
  sfx: [{ sound: "impact", at: 0.35, gain: 0.4 }, { sound: "tink", at: 0.6, gain: 0.3 }] },

  { id: "sam", character: "samurai", stunt: "slices the gate and hops the stump", len: 2.2, expr: "focused", b: (A, P) => [
    A("sam", 0.0, "charge", { to: 1, dur: 0.3 }),
    A("sam", 0.25, "arm", { side: "R", pose: "up", dur: 0.12 }),
    A("sam", 0.45, "arm", { side: "R", pose: "point", dur: 0.08 }),
    P(0.5, { slice: 1 }, 0.8, "linear"),
    A("sam", 1.1, "hop", { height: 0.6, dur: 0.55 }),
    A("sam", 1.1, "move", { to: FRONT, dur: 0.55 }),
    A("sam", 1.7, "charge", { to: 0, dur: 0.3 }),
    A("sam", 1.7, "expr", { expr: "serene" }),
  ], fx: [{ do: "speedlines", at: 0.45, dur: 0.3, alpha: 0.55 }, { do: "flash", at: 0.5, dur: 0.15, peak: 0.4 }],
  sfx: [{ sound: "whoosh", at: 0.42, dur: 0.2, gain: 0.35 }, { sound: "tink", at: 0.52, gain: 0.3 }] },

  { id: "wiz", character: "wizard", stunt: "spell fizzles, so he scrambles over", len: 2.3, expr: "eager", b: (A) => [
    A("wiz", 0.05, "arm", { side: "R", pose: "cast", dur: 0.2 }),
    A("wiz", 0.05, "charge", { to: 1, dur: 0.35 }),
    A("wiz", 0.55, "charge", { to: 0, dur: 0.15 }),
    A("wiz", 0.6, "expr", { expr: "sad" }),
    A("wiz", 0.6, "droop", { to: 1, dur: 0.3 }),
    A("wiz", 1.0, "hop", { height: 0.6, dur: 0.75 }),
    A("wiz", 1.0, "move", { to: FRONT, dur: 0.75 }),
    A("wiz", 0.7, "arm", { side: "both", pose: "shrug", dur: 0.25 }),
    A("wiz", 1.75, "hat", { off: [0.15, -0.1, 0.05], spin: [0, 0, -35], dur: 0.2 }),
    A("wiz", 1.75, "expr", { expr: "dizzy" }),
  ], fx: [{ do: "poof", pos: [0, 1.2, -1.0], at: 0.5, dur: 0.4, puffs: 4, sparks: 6, spark: "#c8b6ff" }],
  sfx: [{ sound: "sadslide", at: 0.55, gain: 0.25 }] },

  { id: "sor", character: "sorcerer", stunt: "portals through", len: 2.1, expr: "evil", b: (A, P) => [
    A("sor", 0.0, "charge", { to: 1, dur: 0.3 }),
    A("sor", 0.05, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    P(0.15, { open: 1 }, 0.35, "back", "portal-b"),
    P(0.15, { open: 1 }, 0.35, "back", "portal-f"),
    A("sor", 0.55, "move", { to: [0, -0.75], dur: 0.25 }),
    A("sor", 0.8, "hide"),
    A("sor", 0.8, "move", { to: [0, 0.3], dur: 0.01 }),
    A("sor", 0.95, "show"),
    A("sor", 0.95, "move", { to: FRONT, dur: 0.3 }),
    P(1.3, { open: 0 }, 0.3, "in", "portal-b"),
    P(1.3, { open: 0 }, 0.3, "in", "portal-f"),
    A("sor", 1.4, "expr", { expr: "smug" }),
  ], sfx: [{ sound: "charge", at: 0.1, dur: 0.5, gain: 0.25 }, { sound: "pop", at: 0.8, gain: 0.35 }, { sound: "pop", at: 0.95, gain: 0.35 }] },

  { id: "rea", character: "reaper", stunt: "phases straight through the wood", len: 2.0, expr: "deadpan", b: (A) => [
    A("rea", 0.1, "move", { to: FRONT, dur: 1.5, steps: 1.6 }),
  ], fx: [{ do: "poof", pos: [0, 0.6, 0.0], at: 0.75, dur: 0.6, puffs: 8, sparks: 0 }],
  sfx: [{ sound: "whoosh", at: 0.7, dur: 0.4, gain: 0.2 }] },

  { id: "dra", character: "dragon", stunt: "flies over and sets the hedge on fire", len: 2.4, expr: "eager", b: (A, P) => [
    A("dra", 0.1, "fly", { to: { y: 0.6, z: -0.2 }, dur: 0.6 }),
    P(0.55, { fire: 1 }, 0.4, "out", "fire"),
    A("dra", 0.75, "fly", { to: { y: 0.5, z: 0.55 }, dur: 0.5 }),
    A("dra", 1.25, "drop", { to: 0, dur: 0.25 }),
    A("dra", 1.55, "turn", { to: "3q-left", dur: 0.2 }),
    A("dra", 1.6, "expr", { expr: "shocked" }),
    A("dra", 1.6, "arm", { side: "both", pose: "cheeks", dur: 0.2 }),
  ], sfx: [{ sound: "whoosh", at: 0.5, dur: 0.6, gain: 0.3 }] },

  { id: "phx", character: "phoenix", stunt: "flashy flip, lands flat on his side", len: 2.3, expr: "cocky", b: (A) => [
    A("phx", 0.0, "wings", { to: 1, dur: 0.25 }),
    A("phx", 0.3, "hop", { height: 1.05, dur: 0.85 }),
    A("phx", 0.3, "move", { to: [0.45, 0.4], dur: 0.85 }),
    A("phx", 0.3, "pitch", { to: 360, dur: 0.75 }),
    A("phx", 1.08, "lean", { to: 88, dur: 0.14, ease: "in" }),
    A("phx", 1.08, "expr", { expr: "dizzy" }),
    A("phx", 1.15, "wings", { to: 0.2, dur: 0.3 }),
  ], fx: [{ do: "shake", at: 1.18, dur: 0.2, amp: 0.03 }], sfx: [{ sound: "land", at: 1.18, gain: 0.5 }] },

  { id: "all", character: "allfather", stunt: "lightning, then walks through the ash", len: 2.3, expr: "stern", b: (A, P) => [
    A("all", 0.05, "arm", { side: "R", pose: "up", dur: 0.25 }),
    P(0.4, { on: 1 }, 0.01, "linear", "bolt"),
    P(0.7, { on: 0 }, 0.01, "linear", "bolt"),
    P(0.42, { scorch: 1 }, 0.1),
    P(0.9, { open: 1 }, 0.5, "out"),
    A("all", 1.2, "move", { to: FRONT, dur: 0.9, steps: 1.8 }),
    A("all", 1.2, "arm", { side: "R", pose: "rest", dur: 0.3 }),
  ], fx: [{ do: "impact", at: 0.4, dur: 0.1 }, { do: "flash", at: 0.5, dur: 0.2, peak: 0.5 }, { do: "shake", at: 0.4, dur: 0.3, amp: 0.05 },
    { do: "poof", pos: [0, 0.4, 0.1], at: 0.55, dur: 0.9, puffs: 14, sparks: 10, spark: "#bfe4ff" }] },

  { id: "vik", character: "viking", stunt: "charges and smashes it to splinters", len: 3.0, expr: "delighted", start: [0, -2.4], b: (A, P) => [
    A("vik", 0.0, "arm", { side: "L", pose: "up", dur: 0.2 }),
    A("vik", 0.15, "move", { to: [0, -0.25], dur: 0.45, ease: "in", steps: 4 }),
    P(0.6, { smash: 1 }, 1.0, "linear"),
    A("vik", 0.6, "move", { to: FRONT, dur: 0.5, ease: "out", steps: 3 }),
    A("vik", 1.3, "arm", { side: "both", pose: "up", dur: 0.25 }),
    A("vik", 1.3, "hop", { height: 0.3, count: 2, dur: 0.7 }),
  ], fx: [{ do: "speedlines", at: 0.15, dur: 0.45, alpha: 0.6 }, { do: "impact", at: 0.6, dur: 0.1 }, { do: "flash", at: 0.7, dur: 0.2, peak: 0.5 },
    { do: "shake", at: 0.6, dur: 0.45, amp: 0.08 }, { do: "poof", pos: [0, 0.3, 0.1], at: 0.62, dur: 0.9, puffs: 18, sparks: 12, spark: "#ffcf6b" }] },
];

// ---- assemble ----
const sb = {
  id: "gate-01-the-gate",
  title: "GATE: how each fighter gets past it",
  format: "each-character-vs-X: one set, one obstacle, each fighter crosses it in their own way in ~2 s, hard cuts, biggest last",
  fps: 30, set: { type: "garden", gap: 1.5 },
  music: { bpm: 120, offset: 0, gain: 0.45, parts: [{ at: 0, part: "main" }] },
  cast: [], shots: [], actions: [], props: [
    { id: "gate", kind: "gate", x: 0, z: 0 },
    { id: "portal-b", kind: "portal", x: 0, z: -0.6, scale: 0.8 }, { id: "portal-f", kind: "portal", x: 0, z: 0.3, scale: 0.8 },
    { id: "bolt", kind: "bolt", x: 0, z: 0.05 }, { id: "fire", kind: "flames", x: -1.5, y: 1.05, z: 0.1 },
  ],
  fx: [], sfx: [], captions: [], beats: [],
};
const CAM = { pos: [0.6, 1.7, 4.7], look: [0, 0.85, -0.2], fov: 40 };
let T = 0;
for (const [i, b] of BEATS.entries()) {
  const at = (x) => Math.round((T + x) * 1000) / 1000;
  const A = (who, t, d, o = {}) => ({ who, at: at(t), do: d, ...o });
  const P = (t, set, dur = 0.3, ease = "inOut", id = "gate") => ({ do: "prop", id, at: at(t), dur, ease, set });
  sb.cast.push({ id: b.id, character: `potatobrawl/${b.character}`, at: b.start || BACK, face: "camera", expr: b.expr, seed: 1.3 + i * 0.7 });
  // hidden until its beat, gone after it; the gate (and the effects props) reset at every cut
  sb.actions.push(A(b.id, -T, "hide"), A(b.id, 0, "show"), ...b.b(A, P));
  if (i < BEATS.length - 1) sb.actions.push(A(b.id, b.len, "hide"));
  sb.actions.push(P(0, GATE_RESET, 0), P(0, { open: 0 }, 0, "linear", "portal-b"), P(0, { open: 0 }, 0, "linear", "portal-f"), P(0, { fire: 0 }, 0, "linear", "fire"));
  for (const f of b.fx || []) sb.fx.push({ ...f, at: at(f.at) });
  for (const s of b.sfx || []) sb.sfx.push({ ...s, at: at(s.at) });
  // a tiny push-in on every beat so the cut reads
  sb.shots.push({ at: at(0), ...CAM, to: { pos: [CAM.pos[0] * 0.92, CAM.pos[1] - 0.08, CAM.pos[2] - 0.2] }, dur: b.len, ease: "linear" });
  sb.beats.push({ who: b.id, character: b.character, stunt: b.stunt, from: at(0), to: at(b.len) });
  T += b.len;
}
sb.duration = Math.round(T * 1000) / 1000;
sb.cover = sb.beats.at(-1).from + 0.75;
sb.captions.push({ from: 0, to: sb.duration, text: "GATE", style: "label", pos: 230, pop: false });
writeFileSync(new URL("./gate-01-the-gate.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`gate-01-the-gate: ${sb.duration} s, ${BEATS.length} beats`);
