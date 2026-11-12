// Bench for the stadium props (engine/page/props-stadium.js, task T1 of storyboards/series/what-if/07-time-travel/BRIEF-T1.md):
// the night stadium in the rain, its crowd, floodlights, big screen, barrier, finish tape, start blocks and Chip's sign, and the
// same place empty at dawn (x 1000). Five stills (plus f, g, h, i, j), 1 s apart, each 0.6 s into its beat. Not a clip.
//   a  [6, 1.3, 4] -> [0, 1.2, -3] fov 50: Spud and Wedge at the tape, Chip behind the barrier with the sign, crowd cheer 1
//   b  wide [0, 4, 16] -> [0, 6, -15] fov 60: track, packed stands, bigscreen (test photo), floodlights lit
//   c  the wide with boo 1, target [0, 0]
//   d  the dawn copy at x 1000, the same wide: empty, lamps dead
//   e  low up the aisle stair [4, 1, -3] -> [4, 5, -15] fov 55
//   node storyboards/series/what-if/07-time-travel/bench/make-stadium-props.mjs
//   node engine/render.mjs storyboards/series/what-if/07-time-travel/bench/stadium-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6 --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/stadium-props-*.png --out storyboards/series/what-if/07-time-travel/bench/stadium-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const END = 10.0, DAWN = 1000;
const RIG = { hand: 2, eyes: 2, hold: 2 }, MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const PHOTO = "storyboards/series/what-if/07-time-travel/board.png";   // any test picture

const WIDE = { pos: [0, 4, 16], look: [0, 6, -15], fov: 60 };
const SHOTS = [
  [{ pos: [6, 1.3, 4], look: [0, 1.2, -3], fov: 50 }, "a: tape, Spud, Wedge, Chip with the sign, crowd cheers"],
  [WIDE, "b: wide, packed stands, big screen, floodlights"],
  [WIDE, "c: wide, the crowd boos"],
  [{ pos: [DAWN, 4, 16], look: [DAWN, 6, -15], fov: 60 }, "d: dawn, empty, lamps dead"],
  [{ pos: [4, 1, -3], look: [4, 5, -15], fov: 55 }, "e: up the aisle stair"],
  [{ pos: [-3.0, 0.8, -2.2], look: [-0.7, 0.5, -4.4], fov: 40 }, "f: Chip and the sign (extra)"],
  [{ pos: [-22, 6, 22], look: [-45, 22, -30], fov: 45 }, "g: a floodlight tower (extra)"],
  [{ pos: [2, 2.2, -5.5], look: [3, 4.5, -13], fov: 40 }, "h: crowd cheer 1, close (extra)"],
  [{ pos: [2, 2.2, -5.5], look: [3, 4.5, -13], fov: 40 }, "i: crowd boo 1, close (extra)"],
  [{ pos: [2000.35, 0.45, 2.4], look: [2000.35, 0.35, 0], fov: 34 }, "j: cardsign, crush 0 and 1, startblock, tape snap 1 (extra)"],
];
const lights = [[-45, -30, 0], [45, -30, 0], [-45, 45, 180], [45, 45, 180]];
const props = [
  { id: "sta", kind: "stadium", x: 0, y: 0, z: 0, mood: "night", start: -20 },
  { id: "crowd", kind: "stadiumcrowd", x: 0, y: 0, z: 0, front: true, hole: -0.8, target: [0, 0] },
  ...lights.map(([x, z, rot], i) => ({ id: `fl${i}`, kind: "floodlight", x, y: 0, z, rot, lit: 1 })),
  { id: "scr", kind: "bigscreen", x: 0, y: 0, z: -30, photo: PHOTO, photo2: PHOTO, bottom: 13, show: 1, glow: 1 },
  { id: "bar", kind: "crowdbarrier", x: 0, y: 0, z: -4.0, len: 20 },
  { id: "blk", kind: "startblock", x: -20.2, y: 0, z: -1.83 },
  { id: "tape", kind: "finishtape", x: 0, y: 0, z: -2.4, rot: 90, w: 2.6 },
  { id: "sign", kind: "cardsign", x: -0.62, y: 0.5, z: -4.3, rot: 0 },
  // the sign, crushed and not, a start block and a snapped tape, off in the void for a close look
  { id: "sign1", kind: "cardsign", x: 1999.9, y: 0, z: 0, rot: 0 },
  { id: "sign2", kind: "cardsign", x: 2000.6, y: 0, z: 0, rot: 0, crush: 1 },
  { id: "blk2", kind: "startblock", x: 2000.95, y: 0, z: 0.3, rot: 0 },
  { id: "tape2", kind: "finishtape", x: 2000.35, y: 0, z: -0.5, w: 2.6, snap: 1 },
  // the dawn copy
  { id: "dsta", kind: "stadium", x: DAWN, y: 0, z: 0, mood: "dawn", start: -20, wet: 1 },
  ...lights.map(([x, z, rot], i) => ({ id: `dfl${i}`, kind: "floodlight", x: DAWN + x, y: 0, z, rot, lit: 0 })),
  { id: "dscr", kind: "bigscreen", x: DAWN, y: 0, z: -30, show: 0, glow: 0 },
];
// the crowd: a cheer in beat a, calm in b, boo in c
c.prop(0, "crowd", { cheer: 0, boo: 0, empty: 0, flash: 0, sway: 0 }, 0, "linear");
c.prop(0.01, "crowd", { cheer: 1, flash: 1 }, 0, "linear");
c.prop(1.01, "crowd", { cheer: 0, flash: 0 }, 0, "linear");
c.prop(2.01, "crowd", { boo: 1 }, 0, "linear");
c.prop(3.01, "crowd", { boo: 0 }, 0, "linear");
c.prop(7.01, "crowd", { cheer: 1 }, 0, "linear");
c.prop(8.01, "crowd", { cheer: 0, boo: 1 }, 0, "linear");
c.prop(0, "sta", { wet: 1 }, 0, "linear");
c.prop(0, "tape", { snap: 0, wave: 0 }, 0, "linear");

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [0, -1.83], face: 0, expr: "joy", follow: 0.2, seed: 1.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: [0.4, -3.05], face: 0, expr: "focused", follow: 0.2, seed: 2.1 },
  { id: "chip", character: "potatobrawl/chip", at: [-0.8, -4.4], face: 0, expr: "joy", follow: 0.2, seed: 3.7 },
];
const beats = c.beats(SHOTS.map(([cam, label], i) => [`s${i + 1}`, i, cam, label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "stadium-props", title: "Stadium props bench", idea: "Props bench for There's a catch EP07 (stadium, crowd, floodlight, bigscreen, barrier, blocks, tape, sign), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#05070f", floor: "#10151f" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["spud", "wedge", "chip"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/07-time-travel/bench/make-stadium-props.mjs (props bench, no reviews).",
});
