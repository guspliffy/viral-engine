// Bench for Spud's imagined pasts and the evidence pieces (engine/page/props-eg-sphinx-fx.js, task T3 of ../briefs/T3.md): not a clip,
// one beat per still (the still is 0.55 s into its beat), tall 1080x1920, a group per piece 3000 m apart so each camera sees only its own.
//   a  x 0      savanna storm wide (camera (30,6,30) look (0,3,0) fov 55, aasky afternoon, a rainbox per DESIGN 6, a 29.2 x 8 x 7.6 stand-in
//               for the Sphinx), the first acacia close, the tufts and puddles close
//   b  x 3000   hiddenhall cutaway (camera (11.3,-2.6,14) look (11.3,-3.6,0) fov 50) with Spud on the floor; the shelves close; the stair
//   c  x 6000   saltslice damp 0.5 grow 0 | damp 1 grow 1 pop 0 | pop 1 (camera 2.2 m in front, fov 40), the pores and the seat close
//   d  x 9000   surveykit with Spud beside the cart, roll 0 and roll 1 + drill 1 (camera 4 m off, fov 45), the rig, the table and core
//   e  x 12000  leo at night (aasky night, starfield with the hole): camera (0,2,0) looking east (40,6,0) fov 50, show 1 lines 1, rise 0 | 1
//   node storyboards/series/ancient-aliens/05-sphinx/bench/make-eg-sphinx-fx.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/05-sphinx/bench/eg-sphinx-fx.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/eg-sphinx-fx-*.png --out storyboards/series/ancient-aliens/05-sphinx/bench/eg-sphinx-fx-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GA = 0, GB = 3000, GC = 6000, GD = 9000, GE = 12000;
const spud = (id, x, z, face, y) => ({ id, character: "potatobrawl/spud", at: [x, z], ...(y ? { y } : {}), face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [spud("spudA", GA + 17.5, 5.2, 90), spud("spudB", GB + 11.3 - 0.8, 2.17 - 1.1, 0, -5.36), spud("spudC", GC - 1.3, 0.9, 0), spud("spudD", GD + 0.75, 0.1, 90)];
const props = [
  { id: "skyA", kind: "aasky", x: GA, z: 0, time: "afternoon" },
  { id: "sav", kind: "savanna", x: GA, y: 0, z: 0, cover: true, storm: true },
  { id: "standin", kind: "limeblock", x: GA, y: 0, z: 0, size: [29.2, 8, 7.6], look: "core" },
  { id: "rain", kind: "rainbox", x: GA, y: 0, z: 0, box: [68, 18, 48], n: 1280, slant: [0, 0.194], alpha: 0.46 },
  { id: "hall", kind: "hiddenhall", x: GB, y: 0, z: 0 },
  { id: "saltA", kind: "saltslice", x: GC, y: 0, z: 0 },
  { id: "saltB", kind: "saltslice", x: GC + 3.2, y: 0, z: 0 },
  { id: "saltC", kind: "saltslice", x: GC + 6.4, y: 0, z: 0 },
  { id: "svA", kind: "surveykit", x: GD, y: 0, z: 0 },
  { id: "svB", kind: "surveykit", x: GD + 40, y: 0, z: 0 },
  { id: "skyE", kind: "aasky", x: GE, z: 0, time: "night" },
  { id: "starE", kind: "starfield", x: GE, z: 0, n: 5000, hole: [90, 8, 19], seed: 2 },
  { id: "groundE", kind: "gizaplateau", x: GE, z: 0, night: 1, seed: 5 },
  { id: "leo", kind: "leo", x: GE, y: 0, z: 0 },
];
// params propState has no default for are seeded at 0 (a dur-0 set)
c.prop(0.1, "sav", { gust: 0 }, 0); c.prop(0.1, "hall", { lamp: 0 }, 0);
c.prop(0.1, "saltA", { damp: 0.5, grow: 0, pop: 0 }, 0); c.prop(0.1, "saltB", { damp: 1, grow: 1, pop: 0 }, 0); c.prop(0.1, "saltC", { damp: 1, grow: 1, pop: 1 }, 0);
c.prop(0.1, "svA", { roll: 0, drill: 0 }, 0); c.prop(0.1, "svB", { roll: 1, drill: 1 }, 0);
c.prop(0.1, "skyE", { night: 1 }, 0); c.prop(0.1, "starE", { show: 1 }, 0); c.prop(0.1, "groundE", { night: 1 }, 0); c.prop(0.1, "leo", { show: 1, lines: 1, rise: 0 }, 0);
let T = 0;
const cam = (gx, p, l, f) => ({ pos: [gx + p[0], p[1], p[2]], look: [gx + l[0], l[1], l[2]], fov: f });
const SHOTS = [
  ["savWide", () => {}, cam(GA, [30, 6, 30], [0, 3, 0], 55), "a savanna storm wide, aasky afternoon + rainbox (panel 05)"],
  ["savAcacia", () => {}, cam(GA, [-1.5, 1.6, -4.5], [-8, 3.2, -11], 48), "a the first acacia close: trunk, forks, 19 lobes, leaf strokes"],
  ["savGrass", () => c.prop(T, "sav", { gust: 0.25 }, 0), cam(GA, [9, 0.9, 17], [3, 0.15, 8], 52), "a tufts and puddles close, 19 m from the origin (gust 0.25)"],
  ["hallWide", () => {}, cam(GB, [11.3, -2.6, 14], [11.3, -3.6, 0], 50), "b hiddenhall cutaway: shelves, scrolls, tablets, stair, lamps (panel 11)"],
  ["hallShelf", () => {}, cam(GB, [9.2, -3.9, 2.5], [13.4, -4.0, -0.9], 62), "b the shelves, scrolls, tablets and a lamp close"],
  ["hallStair", () => c.prop(T, "hall", { lamp: 0.25 }, 0), cam(GB, [11.3, -1.6, 6.5], [11.3, -4.4, 0.8], 62), "b the stair treads from above, the table, lamp 0.25"],
  ["saltA", () => {}, cam(GC, [0.6, 0.9, 2.55], [0.6, 0.88, 0.33], 40), "c saltslice damp 0.5 grow 0 (2.2 m in front)"],
  ["saltB", () => {}, cam(GC + 3.2, [0.6, 0.9, 2.55], [0.6, 0.88, 0.33], 40), "c saltslice damp 1 grow 1 pop 0: the salt stems"],
  ["saltC", () => {}, cam(GC + 6.4, [0.6, 0.9, 2.55], [0.6, 0.88, 0.33], 40), "c saltslice pop 1: the flake away, the seat and chips"],
  ["saltPores", () => {}, cam(GC + 3.2, [0.95, 1.1, 1.1], [0.95, 1.1, 0.33], 34), "c the pores, throats, grains, the salt close"],
  ["svCart0", () => {}, cam(GD, [0.1, 1.2, 4.0], [0.3, 0.5, 0], 45), "d surveykit with Spud, roll 0"],
  ["svCart1", () => {}, cam(GD + 40, [0.1, 1.2, 4.0 + 0.85], [0.1, 0.5, 0.85], 45), "d surveykit roll 1 (cart 0.85 on) and drill 1"],
  ["svRig", () => {}, cam(GD, [-1.2, 1.7, 5.6], [-2.6, 1.3, 1.0], 58), "d the drill rig, mast, hoses, carriage, case"],
  ["svTable", () => {}, cam(GD, [2.5, 1.4, 3.3], [2.52, 0.7, -0.58], 40), "d the table and the solid core in its cradles"],
  ["leo0", () => {}, cam(GE, [0, 2, 0], [40, 6, 0], 50), "e leo at night, rise 0"],
  ["leo1", () => c.prop(T, "leo", { rise: 1 }, 0), cam(GE, [0, 2, 0], [40, 6, 0], 50), "e leo at night, rise 1"],
];
const BEAT = 1.0;
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * BEAT); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 240, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "eg-sphinx-fx", title: "Egypt EP05 Sphinx FX bench", idea: "Props bench for savanna, hiddenhall, saltslice, surveykit and leo, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#788A91", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: ["spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  allowClip: [["spudA", "sav", "scenery: the turf and tufts lie round his feet"], ["spudB", "hall", "he stands inside the hall's enclosing shell"]].map(([who, w, reason]) => ({ who, with: w, from: 0, to: END, reason })),
  notes: "Generated by storyboards/series/ancient-aliens/05-sphinx/bench/make-eg-sphinx-fx.mjs (props bench, no reviews).",
});
