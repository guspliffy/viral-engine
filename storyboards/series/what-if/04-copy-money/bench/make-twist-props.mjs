// Bench for the twist props (engine/page/props-twist.js, task T3 of storyboards/series/what-if/04-copy-money/BRIEF-T3.md):
// one group per camera on a plain floor, 7 m apart so each camera sees only its own group. Not a clip.
//   flipboard    stage 0, 1, 2, 3, 4, 5; in between (0.45, 2.5, 3.55: flaps mid-fall); blow 0.3, 0.7, 1 (at stage 5)
//   wheelbarrow  at rest, load 1, Gunslinger's gloves on both handles; dump 0.5 and 1 beside a 0.38 m box; load 0
//   dinersign    flip 0, 0.5, 1 (lit); lit 0 with snow
//   node storyboards/series/what-if/04-copy-money/bench/make-twist-props.mjs
//   node engine/render.mjs storyboards/series/what-if/04-copy-money/bench/twist-props.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { TWIST_GRIPS } from "../../../../../engine/page/props-twist.js";

const c = clip(), { A } = c;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const HL = TWIST_GRIPS.wheelbarrow.handleL, HR = TWIST_GRIPS.wheelbarrow.handleR;

const BOARDS = [["stage 0 (4.50)", { stage: 0 }], ["stage 1 (450.00)", { stage: 1 }], ["stage 2 (45,000.00)", { stage: 2 }], ["stage 3 (4,500,000.00)", { stage: 3 }], ["stage 4 (4,500,000,000)", { stage: 4 }], ["stage 5 (flipping, rattling)", { stage: 5, clock: 0.31 }],
  ["stage 0.45 (flaps mid-fall)", { stage: 0.45 }], ["stage 2.5 (flaps mid-fall)", { stage: 2.5 }], ["stage 3.55 (flaps mid-fall)", { stage: 3.55 }],
  ["blow 0.3", { stage: 5, blow: 0.3, clock: 0.31 }], ["blow 0.7", { stage: 5, blow: 0.7, clock: 0.31 }], ["blow 1", { stage: 5, blow: 1 }]];
const GX0 = -49;   // the first group's x; 7 m apart
const props = [], SHOTS = [];
let n = 0;
const slot = () => GX0 + 7 * n++;

BOARDS.forEach(([label, p], i) => {
  const x = slot(), blow = p.blow != null;
  props.push({ id: `b${i}`, kind: "flipboard", x, y: 1.7, z: 0, ...p });
  SHOTS.push([`board${i}`, blow ? { pos: [x, 1.3, 5.8], look: [x, 1.0, 0.7], fov: 46 } : { pos: [x, 1.65, 3.9], look: [x, 1.65, 0], fov: 40 }, `flipboard: ${label}`]);
});

// ---- wheelbarrow at rest, Gunslinger behind it with his gloves on the handles
{
  const x = slot();
  props.push({ id: "wb0", kind: "wheelbarrow", x, y: 0, z: 0, rot: 0, load: 1 });
  A(0, "gun", "grip", { side: "R", shape: "fist", dur: 0 }); A(0, "gun", "grip", { side: "L", shape: "fist", dur: 0 });
  c.arm(0, "gun", "R", { prop: "wb0", grip: HR }, 0); c.arm(0, "gun", "L", { prop: "wb0", grip: HL }, 0);
  A(0, "gun", "grab", { prop: "wb0", hand: "R", grip: HR, dur: 0, pose: null }); A(0, "gun", "grab", { prop: "wb0", hand: "L", grip: HL, dur: 0, pose: null });
  SHOTS.push(["barrow-hands", { pos: [x - 0.35, 0.85, 5.0], look: [x - 0.35, 0.6, 0], fov: 40 }, "wheelbarrow: load 1, Gunslinger's gloves on both handles"]);
  SHOTS.push(["barrow-hands-top", { pos: [x - 2.5, 1.4, 1.9], look: [x - 0.7, 0.5, 0], fov: 32 }, "wheelbarrow: the gloves from behind and above"]);
}
for (const [label, p] of [["dump 0.5", { dump: 0.5 }], ["dump 1", { dump: 1 }], ["load 0", { load: 0 }]]) {
  const x = slot();
  props.push({ id: `wb${n}`, kind: "wheelbarrow", x, y: 0, z: 0, rot: 0, load: 1, ...p });
  if (p.dump != null) props.push({ id: `box${n}`, kind: "coffeetable", x: x + 1.5, z: 0.1, h: 0.38, w: 0.5, d: 0.5 });
  SHOTS.push([`barrow${n}`, { pos: [x + 0.5, 0.95, 4.6], look: [x + 0.5, 0.5, 0], fov: 40 }, `wheelbarrow: ${label}${p.dump != null ? " beside a 0.38 m box" : ""}`]);
}

// ---- the diner's sign
for (const [label, p, flip] of [["flip 0 (milkshake)", { lit: 1 }, 0], ["flip 0.5", { lit: 1 }, 0.5], ["flip 1 (the hat)", { lit: 1 }, 1], ["lit 0, snow", { lit: 0, snow: true }, 0]]) {
  const x = slot();
  props.push({ id: `sg${n}`, kind: "dinersign", x, y: 2.55, z: 0, ...p });
  c.prop(0, `sg${n}`, { flip }, 0, "linear");
  SHOTS.push([`sign${n}`, { pos: [x, 2.45, 3.5], look: [x, 2.45, 0], fov: 36 }, `dinersign: ${label}`]);
}

const GUN_X = GX0 + 7 * BOARDS.length;
const cast = [{ id: "gun", character: "never-has-money/gunslinger", at: [GUN_X - 1.15, 0], face: 90, expr: "eager", follow: 0.2, seed: 1.3 }];
// every shot is 1 s; stills are taken 0.5 s into each
const T = (i) => r3(i * 1), END = r3(SHOTS.length);
// "barrow-hands-top" fills the frame with him (no free caption band, qa/camfit.mjs): its label is the beat's name only
SHOTS.forEach(([n, , label], i) => { if (n !== "barrow-hands-top") c.cap(T(i), T(i + 1), label, 240, false, { kinetic: false }); });
console.log("stills:", SHOTS.map((_, i) => r3(T(i) + 0.5)).join(","));
write(import.meta.url, {
  id: "twist-props", title: "Twist props bench", idea: "Props bench for There's a catch EP04 (flip-digit price board, wheelbarrow, diner sign), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#cfdde8", floor: "#8a8274" }, music: false, sound: { auto: false },
  hook: { show: ["gun", "wb0"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([name, cam], i) => [name, T(i), cam]), END),
  notes: "Generated by storyboards/series/what-if/04-copy-money/bench/make-twist-props.mjs (props bench, no reviews).",
});
