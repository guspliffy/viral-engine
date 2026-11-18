// Gate props bench (task T1, 18 Nov 2026): the gate set and the bag-in-sizer kit of engine/page/props-gate.js at their DESIGN sizes
// (storyboards/series/potato-desk/08-suitcase/DESIGN.md sections 1 and 2). Not a clip, no cast. One shot per beat (1.1 s each, the still is 0.4 s in):
//   wide0               the series wide (0, 1.94, 7.0) fov 34: carpet, left wall, gatehall (window, door, ceiling), desk, monitor, board 3:00
//   hall, jet           the right wall with window and door; the far apron, jet and nose gear through the window (the camera stands in the room)
//   board0 .. board4    the gate board close, flip 0..4 (3:00, 2:00, 1:30, 1:00, FINAL CALL); refresh: flip 3.5, the rows mid refresh
//   ins0, ins05, ins1   the bag-in-sizer at insert 0, 0.5 and 1 (pillows at 1); plate: the printed plate close; pillows: the jam from above left
//   han0, roll          handle 0 (insert 1); the unit rolled 180 deg, handle 0.2 (soles up, P5)
//   desk                monitor (back to camera), tape measure pull 0 and 0.8, the loose sunglasses, on the woodcounter
// insert / handle / flip / pull are all tweened by c.prop (seeded at t 0: insert and handle are not in propState).
//   node storyboards/series/potato-desk/bench/make-gate-bench.mjs
//   node qa/preflight.mjs storyboards/series/potato-desk/bench/gate-props.json --quick
//   node engine/render.mjs storyboards/series/potato-desk/bench/gate-props.json --stills beats --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/gate-props-*.png --out storyboards/series/potato-desk/bench/gate-props-sheet.png
import { clip, write } from "../../../lib/clip.mjs";

const c = clip();
const DESK = 0.60;
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: -0.2, w: 5.6, d: 6.0, tile: 0.5, a: "#46629E", b: "#415C96" },
  { id: "wall", kind: "officewall", x: -1.375, y: 0, z: -3.0, w: 2.85, h: 3.30, dado: "#CFCBC2", rail: "#C2BEB5", wall: "#CFCBC2", top: "#CFCBC2" },
  { id: "hall", kind: "gatehall", x: 0, y: 0, z: 0 },
  { id: "sky", kind: "biminisky", x: 0, y: 0, z: 0 },
  { id: "jet", kind: "airliner", x: 22.5, y: 3.56, z: -150, rot: -90, lit: 0 },
  { id: "gear", kind: "jetgear", x: 9, y: 0, z: -150 },
  { id: "desk", kind: "woodcounter", x: -1.30, y: 0, z: -0.825, w: 1.30, h: DESK, d: 0.45 },
  { id: "mon", kind: "flatmonitor", x: -0.80, y: DESK, z: -0.85, rot: 180 },
  { id: "board", kind: "gateboard", x: -0.75, y: 1.925, z: -2.955 },
  { id: "tapeA", kind: "tapemeasure", x: -1.75, y: DESK + 0.0325, z: -0.80 },
  { id: "tapeB", kind: "tapemeasure", x: -1.50, y: DESK + 0.0325, z: -0.80 },
  { id: "shades", kind: "sunglasses", x: -1.20, y: DESK + 0.031, z: -0.80 },
  // the showroom to the right of the room: five units on their own carpet
  { id: "floor2", kind: "courtfloor", x: 7.0, y: 0, z: 0.5, w: 7.0, d: 5.0, tile: 0.5, a: "#46629E", b: "#415C96" },
  ...[4.6, 5.6, 6.6, 7.6].map((x, i) => ({ id: `u${i}`, kind: "bagsizer", x, y: 0.99, z: 0 })),
  { id: "u4", kind: "bagsizer", x: 8.6, y: 1.02, z: 0, roll: 180 },
];
for (const [id, insert, handle] of [["u0", 0, 1], ["u1", 0.5, 1], ["u2", 1, 1], ["u3", 1, 0], ["u4", 1, 0.2]]) c.prop(0, id, { insert, handle }, 0);
c.prop(0, "tapeA", { pull: 0 }, 0); c.prop(0, "tapeB", { pull: 0.8 }, 0);

const WIDE = { pos: [0, 1.94, 7.0], look: [0, 1.43, 0], fov: 34 };
const HALL = { pos: [0.7, 1.8, 4.5], look: [0.7, 1.6, -3], fov: 32 };
const JET = { pos: [0.66, 1.94, -1.5], look: [11.5, 2.2, -150], fov: 14 };
const BOARD = { pos: [-0.75, 1.925, 0.6], look: [-0.75, 1.925, -3], fov: 46 };
const unit = (x, fov = 34, y = 0.95) => ({ pos: [x - 0.5, 1.1, 2.6], look: [x, y, 0.1], fov });
const PLATE = { pos: [6.6, 0.85, 1.55], look: [6.6, 0.8, 0.4], fov: 60 };
const PILLOWS = { pos: [6.0, 1.25, 1.6], look: [6.6, 0.55, 0.3], fov: 40 };
const DESKCAM = { pos: [-1.5, 0.95, 0.95], look: [-1.5, 0.78, -0.8], fov: 34 };
const names = [["wide0", WIDE], ["hall", HALL], ["jet", JET], ["board0", BOARD], ["board1", BOARD], ["board2", BOARD], ["board3", BOARD], ["board4", BOARD], ["refresh", BOARD],
  ["ins0", unit(4.6)], ["ins05", unit(5.6)], ["ins1", unit(6.6)], ["plate", PLATE], ["pillows", PILLOWS], ["han0", unit(7.6)], ["roll", unit(8.6, 46, 1.0)], ["desk", DESKCAM]];
const flips = { board0: 0, board1: 1, board2: 2, board3: 3, board4: 4, refresh: 3.5 };
const T = 1.1;
c.prop(0, "board", { flip: 0 }, 0);
names.forEach(([n], i) => { if (n in flips) c.prop(i * T, "board", { flip: flips[n] }, 0); });
const end = names.length * T;
const sb = {
  id: "gate-props", title: "Gate props bench", idea: "Engine look bench for the gate set and the bag-in-sizer kit (task T1), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural", far: 800,
  set: { type: "plain", color: "#9cc7ee", floor: "none", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats(names.map(([n, shot], i) => [n, i * T, shot]), end),
  notes: "Generated by storyboards/series/potato-desk/bench/make-gate-bench.mjs (engine bench, no reviews).",
};
write(import.meta.url, sb);
