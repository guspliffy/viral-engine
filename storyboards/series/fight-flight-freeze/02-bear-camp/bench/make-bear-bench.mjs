// Bench for the black bear (engine/page/props-bear.js kind `bear`, task T2 of storyboards/series/fight-flight-freeze/02-bear-camp/BRIEF-T2.md).
// The bear at scale 1.05 (the clip's size) at the origin facing +z, Wedge (0.98 m) 1.5 m clear of the bear at [-1.3, 2.6] for size, the plain golden
// set. Not a clip. One still per beat, 1 s apart, each taken 0.6 s into its beat; every beat sets every param (dur 0).
//   node storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bear-bench.mjs   (prints the still times and their labels)
//   node engine/render.mjs storyboards/series/fight-flight-freeze/02-bear-camp/bench/bear-bench.json --stills <times> --draft --safe
//   node qa/contact.mjs out/bear-bench-*.png --out storyboards/series/fight-flight-freeze/02-bear-camp/bench/bear-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { bearMouth } from "../../../../../engine/page/props-bear.js";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const FAR = 60, SC = 1.05;
const CAMS = {
  side: { pos: [6.5, 0.6, 0.05], look: [0, 0.6, 0.05], fov: 40 }, tq: { pos: [3.8, 1.0, 4.8], look: [0, 0.65, 0.1], fov: 40 },
  size: { pos: [3.2, 0.9, 9.0], look: [-0.5, 0.6, 1.5], fov: 40 },
  rside: { pos: [8.2, 1.3, -0.2], look: [0, 1.3, -0.2], fov: 40 }, rfront: { pos: [0.5, 1.4, 7.5], look: [0, 1.3, -0.3], fov: 40 }, rtq: { pos: [4.6, 1.5, 6.2], look: [0, 1.3, -0.2], fov: 40 },
  sw: { pos: [3.4, 1.0, 4.4], look: [0, 0.7, 0.5], fov: 40 }, swr: { pos: [3.8, 1.5, 5.0], look: [0, 1.3, 0.2], fov: 40 }, bound: { pos: [7.5, 0.7, 0.1], look: [0, 0.7, 0.1], fov: 40 },
  climb: { pos: [-2.8, 1.9, -6.0], look: [0.1, 1.7, 0.4], fov: 40 }, face: { pos: [1.4, 1.0, 3.3], look: [0, 0.85, 1.0], fov: 22 }, faceF: { pos: [0.3, 0.95, 3.6], look: [0, 0.82, 1.0], fov: 20 },
  hold: { pos: [2.7, 0.9, 1.9], look: [0, 0.72, 1.0], fov: 28 },
};
const REST = { gait: 0, bound: 0, rear: 0, pawL: 0, pawR: 0, swipe: 0, swipeSide: 1, climb: 0, climbStep: 0, jaw: 0, snarl: 0, ears: 0, sniff: 0, claws: 0, brow: 0, squint: 0, blink: 0, lookX: 0, lookY: 0, headY: 0, headP: 0, breath: 0 };
const BOX = { w: 0.12, d: 0.10, h: 0.10 };   // the small box in the mouth: 0.10 thick, so jaw 0.67 closes on it
const SHOTS = [
  ["standing, side", "side", {}], ["standing, 3/4 front", "tq", {}], ["size: bear and Wedge", "size", {}],
  ["rear 0.5, side (the reach)", "rside", { rear: 0.5 }], ["rear 1, side", "rside", { rear: 1 }], ["rear 1, front", "rfront", { rear: 1 }], ["rear 1, 3/4", "rtq", { rear: 1 }],
  ["rear 1, pawL -1, jaw 1, snarl 1", "rtq", { rear: 1, pawL: -1, jaw: 1, snarl: 1 }],
  ["swipe 0.25", "sw", { swipe: 0.25 }], ["swipe 0.5", "sw", { swipe: 0.5 }], ["swipe 0.75", "sw", { swipe: 0.75 }], ["swipe 1", "sw", { swipe: 1 }], ["rear 0.5 swipe 0.5 (windscreen)", "swr", { rear: 0.5, swipe: 0.5, swipeSide: -1 }],
  ["bound 1, gait 0", "bound", { bound: 1, gait: 0 }], ["bound 1, gait 0.5", "bound", { bound: 1, gait: 0.5 }], ["walk gait 0.25", "side", { gait: 0.25 }], ["walk gait 0.75", "tq", { gait: 0.75 }],
  ["climb 1", "climb", { climb: 1, rear: 1 }], ["climb 1, climbStep 0.3", "climb", { climb: 1, rear: 1, climbStep: 0.3 }],
  ["jaw 1, snarl 1 face", "face", { jaw: 1, snarl: 1 }], ["snarl 1, jaw 0.35, brow -1, squint 0.4, ears -1", "faceF", { snarl: 1, jaw: 0.35, brow: -1, squint: 0.4, ears: -1 }], ["calm face, front", "faceF", {}],
  ["mouth hold: box in the mouth, jaw 0.67", "hold", { jaw: 0.67, headP: 0 }],
];
const END = SHOTS.length;
const HOLD_I = SHOTS.length - 1;

const props = [
  { id: "bear", kind: "bear", x: 0, y: 0, z: 0, rot: 0, scale: SC, ...REST },
  { id: "pine", kind: "climbpine", x: FAR, y: 0, z: 0.5 * SC, rot: 180, scale: 1 },
  { id: "held", kind: "cardbox", x: FAR, y: 0, z: 0, rot: 0, scale: 1, ...BOX, empty: true },
];
c.prop(0, "bear", { ...REST }, 0, "linear");
SHOTS.forEach(([, , p], i) => {
  const t = i + 0.01, onClimb = p.climb > 0, hold = i === HOLD_I;
  c.prop(t, "bear", { ...REST, ...p }, 0, "linear");
  c.prop(t, "pine", { x: onClimb ? 0 : FAR, z: 0.5 * SC }, 0, "linear");
  if (hold) { const m = bearMouth({ ...REST, ...p }, { x: 0, y: 0, z: 0, rot: 0, scale: SC }); c.prop(t, "held", { x: m[0], y: m[1] - BOX.h / 2, z: m[2] + 0.03 }, 0, "linear"); }
  else c.prop(t, "held", { x: FAR }, 0, "linear");
});

const cast = [{ id: "wedge", character: "potatobrawl/wedge", at: [-1.3, 2.6], face: 0, expr: "kind", follow: 0.2, seed: 1.3 }];
c.A(0, "wedge", "look", { to: [0, 1.5], dur: 0.01, blink: false });

const beats = c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, CAMS[cam], label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "bear-bench", title: "Black bear bench", idea: "Props bench for FFF 02 Bear in the camp (the `bear` prop), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["wedge", "bear"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bear-bench.mjs (props bench, no reviews).",
});
