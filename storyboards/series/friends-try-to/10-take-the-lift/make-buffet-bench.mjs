// FRIENDS TRY TO 10: BUFFET BENCH (not a clip). Every prop of engine/page/props-buffet.js on the lift's own set: Chip at
// [0.38, 0.32] wearing `hoodiestuff` (fill 1, flattening to 0 at the end), the `buffetheap` filling 0 -> 1 beside him at
// [-0.4, 0.2], and the nine loose items parked (`in: 0`) and dropped with c.drop from 0.5 m onto the stone floor.
//   node storyboards/series/friends-try-to/10-take-the-lift/make-buffet-bench.mjs -> buffet-bench.json
//   node engine/render.mjs <json> --stills 0.5,2.5,3.8 --draft --safe
import "../../../../engine/page/costumes.js";   // (node only: the page modules import each other in a circle unless costumes.js comes first)
import { BUFFET } from "../../../../engine/page/props-buffet.js";
import { clip, write, r3 } from "../../../lib/clip.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A } = c;
const END = 4.0, DROP0 = 1.0, STEP = 0.14;
const CHIP0 = [0.38, 0.32], HEAP0 = [-0.4, 0.2];
const cast = [{ id: "chip", character: "potatobrawl/chip", at: CHIP0, face: 0, expr: "kind", follow: 0.3, seed: 2.3 }];
A(0, "chip", "turn", { to: 0, dur: 0.01 });
A(0, "chip", "look", { to: [0, 0.1], dur: 0.01, blink: false });

// the nine loose items: where each drops from (y 0.5; the sausage starts at Chip's hem and is thrown), in the order they fall
const LOOSE = [
  ["croissant", -1.55, 0.9], ["sausage", 0.5, 0.62], ["pancakestack", -0.85, 1.0], ["melon", -0.3, 1.0], ["breadroll", 0.15, 1.0],
  ["banana", 0.7, 0.95], ["juicejug", 1.05, 0.7], ["waffle", 1.4, 0.95], ["muffin", 1.7, 0.7],
];
const props = [
  { id: "stuff", kind: "hoodiestuff", wear: "chip", x: 0, y: 0, z: 0, fill: 1 },
  { id: "heap", kind: "buffetheap", x: HEAP0[0], y: 0, z: HEAP0[1], seed: 7, fill: 0 },
  ...LOOSE.map(([kind, x, z], i) => ({ id: `l${i}`, kind, x, y: kind === "sausage" ? 0.14 : kind === "melon" ? 0.6 : 0.5, z, rot: i * 37 % 90, in: 0, body: BUFFET[kind].body })),
];
c.prop(0.2, "heap", { fill: 1 }, 2.0, "linear");
c.prop(2.5, "stuff", { fill: 0 }, 1.4, "inOut");
// the recipe for an item that leaves Chip's hoodie: parked at his hem (y 0.14, 0.3 m in front of his middle, under the lump's overhang),
// `in: 1` a frame before, then c.throw with v.y <= 0.5 m/s and 0.6-1.4 m/s forward or sideways (never up past his face); the sausage does it here
LOOSE.forEach(([kind], i) => {
  const t = r3(DROP0 + i * STEP), id = `l${i}`;
  c.prop(r3(t - 0.05), id, { in: 1 }, 0.01);
  if (kind === "sausage") c.throw(t, id, { v: [0.5, 0.35, 0.9], spin: [0, 3, 0] }); else c.drop(t, id);
});

// cameras: the default is the wide one (buffet-bench.json); `--cam chip|chip3q|belly|heap|left|right|at:x,z` writes buffet-bench-<name>.json, a close one for judging details
const CAMS = {
  wide: { pos: [0.1, 0.8, 3.6], look: [0.0, 0.3, 0.5], fov: 40 }, chip: { pos: [0.45, 0.5, 1.9], look: [0.38, 0.38, 0.32], fov: 36 },
  belly: { pos: [0.45, 0.3, 1.25], look: [0.38, 0.27, 0.32], fov: 30 },
  chip3q: { pos: [1.35, 0.52, 1.5], look: [0.38, 0.33, 0.32], fov: 32 },
  heap: { pos: [-0.4, 0.55, 2.1], look: [-0.4, 0.22, 0.2], fov: 38 }, left: { pos: [-0.9, 0.4, 2.3], look: [-0.9, 0.05, 0.95], fov: 30 }, right: { pos: [1.2, 0.4, 2.3], look: [1.2, 0.05, 0.85], fov: 30 },
};
const CAM = process.argv.includes("--cam") ? process.argv[process.argv.indexOf("--cam") + 1] : "wide";
if (CAM.startsWith("at:")) { const [x, z] = CAM.slice(3).split(",").map(Number); CAMS[CAM] = { pos: [x, 0.3, z + 0.9], look: [x, 0.05, z], fov: 24 }; }   // --cam at:x,z : a close look at one spot on the floor
if (!CAMS[CAM]) { console.error(`--cam ${CAM}: use ${Object.keys(CAMS).join(", ")}`); process.exit(2); }
const beats = c.beats([["bench", 0, CAMS[CAM]]], END);
write(import.meta.url, {
  id: CAM === "wide" ? "buffet-bench" : `buffet-bench-${CAM.replace(/[:,]/g, "_")}`, title: "Friends try to 10 buffet bench", idea: "props-buffet.js on the lift set: hoodiestuff, buffetheap, nine loose items", fps: 30, frame: "wide",
  look: "anime-pro", profile: "short", loop: false, castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  set: { type: "elevator", seed: 3 }, sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props, captions: c.captions, beats, visible: c.visible,
  notes: "Bench for engine/page/props-buffet.js (friends try to 10). Not a clip.",
});
