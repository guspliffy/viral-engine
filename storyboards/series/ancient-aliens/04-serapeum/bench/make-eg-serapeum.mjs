// Bench for the Serapeum set (engine/page/props-eg-serapeum.js, task T2 of ../briefs/T2.md): not a clip, one beat per still, the cameras
// of DESIGN.md section 8 shots 01, 02, 05, 14, 17, 20, 21, 24 (wide FOV numbers) with Spud for scale, oillamps in the niches, plus the
// box study (lidSlide 0 / 0.324 / 1, the unfinished red box, the polished-wall reflection) and the shaft. The still is 0.55 s into its beat.
//   group A  x 0     gallery (lids 0, foot R0/R4): shots 01, 02, 14, 17 (crackshaft), 24 (foyer, unfinished box, exit), a wall close-up
//   group B  x 120   gallery with right bays 0 and 4 left empty + a loose granitebox: 05 (lidSlide 1, reflect), 20 (lidSlide 0.324)
//   group C  x 240   gallery lids "q", every box open: shot 21
//   group D  x 360   studio: granitebox lidSlide 0 | 0.324 | 1 side by side, a red box, the mattress lid
//   group E  x 400   crackshaft close (a box top under it), the 07 spill
//   node storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-serapeum.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/04-serapeum/bench/eg-serapeum.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/eg-serapeum-*.png --out storyboards/series/ancient-aliens/04-serapeum/bench/eg-serapeum-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GB = 120, GC = 240, GD = 360, GE = 400;
const spud = (id, x, z, face, y) => ({ id, character: "potatobrawl/spud", at: [x, z], ...(y ? { y } : {}), face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [spud("spudA", 0.2, 0.37, 127), spud("spudB", GB + 0.55, 0.25, 90, 0.34), spud("spudC", GC, 0.82, 180), spud("spudD", GD + 1.7, 1.3, 200)];
const LAMP_BAYS = 8;
const props = [
  { id: "galA", kind: "gallery", x: 0, y: 0, z: 0, pairs: 12, motes: true },
  { id: "galB", kind: "gallery", x: GB, y: 0, z: 0, omit: ["R0", "R4"], foot: ["R0", "R4"], foyer: false },
  { id: "galC", kind: "gallery", x: GC, y: 0, z: 0, lids: "q", foot: [], foyer: true },
  { id: "unfin", kind: "granitebox", x: 0.55, y: 0, z: 5.64, rot: 18, unfinished: true, material: "red" },
  { id: "shaft", kind: "crackshaft", x: 0, y: 0, z: 0 },
  { id: "boxR0", kind: "granitebox", x: GB + 1.55, y: -0.18, z: 0, rot: -90, material: "black", variant: 1, reflect: true, lidSlide: 1 },
  { id: "boxR4", kind: "granitebox", x: GB + 1.55, y: -0.18, z: -17.6, rot: -90, material: "black", variant: 2, lidSlide: 0 },
  { id: "bx0", kind: "granitebox", x: GD, y: 0, z: 0, rot: 0, lidSlide: 0 },
  { id: "bx1", kind: "granitebox", x: GD + 3.0, y: 0, z: 0, rot: 0, lidSlide: 0.324111, variant: 1 },
  { id: "bx2", kind: "granitebox", x: GD + 6.0, y: 0, z: 0, rot: 0, lidSlide: 1, variant: 2 },
  { id: "rb", kind: "granitebox", x: GD + 9.5, y: 0, z: 0, rot: 0, material: "red", lidSlide: 0 },
  { id: "bxS", kind: "granitebox", x: GE, y: 0, z: -2, rot: 0, lidSlide: 0 },
  { id: "spill", kind: "crackshaft", x: GE + 5, y: 0, z: 0, spill: true, at: [1.8, 1.0, 0] },
  { id: "shaftE", kind: "crackshaft", x: GE, y: 0, z: -2, from: [0, 3.0, 0], to: [0.08, 1.815, 0] },
];
// the lamps: an oillamp in every niche of the first bays (x +-0.91, y 1.40; the left wall faces +x (rot 0), the right wall faces -x (rot 180))
const lampZ = (bi, sd) => -4.4 * bi + (bi === 0 && sd > 0 ? 2.04 : 1.6);
for (const [gx, n] of [[0, LAMP_BAYS], [GB, LAMP_BAYS], [GC, LAMP_BAYS]]) for (let bi = 0; bi < n; bi++) for (const sd of [1, -1]) props.push({ id: `oil${gx}_${bi}_${sd}`, kind: "oillamp", x: gx + sd * 0.91, y: 1.4, z: lampZ(bi, sd), rot: sd > 0 ? 180 : 0, light: false });
props.push({ id: "lampA", kind: "headlamp", wear: "spudA", fit: "potatobrawl/spud", x: 0, y: 0, z: 0, lit: 1, light: false });
props.push({ id: "lampB", kind: "headlamp", wear: "spudB", fit: "potatobrawl/spud", x: 0, y: 0, z: 0, lit: 1, light: false });
props.push({ id: "lampC", kind: "headlamp", wear: "spudC", fit: "potatobrawl/spud", x: 0, y: 0, z: 0, lit: 1, light: false });
c.prop(0, "shaft", { beam: 1 }, 0); c.prop(0, "shaftE", { beam: 1 }, 0); c.prop(0, "spill", { beam: 1 }, 0);

let T = 0;
const eye = (gx, x, y, z) => [gx + x, y, z];
const mv = (who, gx, x, z, face, y = 0) => { c.A(T, who, "move", { to: [gx + x, z], ...(y ? { y } : {}), dur: 0 }); c.A(T, who, "turn", { to: face, dur: 0 }); };
const SHOTS = [
  ["s01", () => mv("spudA", 0, 0.2, 0.37, 127), { pos: eye(0, -0.61, 1.1, 0.99), look: eye(0, 0.69, 0.92, 0), fov: 52 }, "01: bay 0 right, the box, Spud with the lit headlamp"],
  ["s02", () => mv("spudA", 0, 0, 0.93, 180), { pos: eye(0, 0, 1.31, 2.62), look: eye(0, 0, 1.1, -3.2), fov: 44 }, "02: the gallery, 8 bays a side, the crown crack"],
  ["s14", () => mv("spudA", 0, 0, -2.6, 180), { pos: eye(0, 0, 1.78, 0.39), look: eye(0, 0, 1.12, -6.2), fov: 45 }, "14: seven bays a side from the foyer end"],
  ["s17", () => mv("spudA", 0, -0.28, -14.83, 146), { pos: eye(0, -0.76, 1.23, -13.55), look: eye(0, 0.48, 1.42, -17.2), fov: 43 }, "17: bay 4 right, the turquoise shaft on the lid"],
  ["s24", () => mv("spudA", 0, -1.24, 5.7, 0), { pos: eye(0, -0.06, 1.29, 1.08), look: eye(0, -0.13, 1.18, 5.75), fov: 42 }, "24: the foyer, the unfinished red box, the exit stairs and day"],
  ["s24b", () => mv("spudA", 0, -1.24, 7.9, 0, 0.58), { pos: eye(0, 0.4, 1.1, 3.4), look: eye(0, -1.2, 1.1, 8.5), fov: 60 }, "24b: the exit arch, steps and the palms, Spud on the third step"],
  ["wall", () => mv("spudA", 0, 0.6, -8.4, 270), { pos: eye(0, 0.2, 1.4, -6.7), look: eye(0, -0.5, 1.8, -9.2), fov: 62 }, "wall close-up: chisel marks, joints, niche soot, the crown crack"],
  ["s05", () => {}, { pos: eye(GB, 1.2, 1.67, -0.73), look: eye(GB, 1.19, 1.4, 0.43), fov: 49 }, "05: right bay 0, lidSlide 1, the painted reflection on the inner wall"],
  ["s20", () => c.prop(T, "boxR4", { lidSlide: 0.324111 }, 0), { pos: eye(GB, 0.99, 2.07, -16.89), look: eye(GB, 1.105, 1.29, -17.6), fov: 47 }, "20: right bay 4, lidSlide 0.324 (ajar)"],
  ["s21", () => {}, { pos: eye(GC, 0, 1.35, 2.68), look: eye(GC, 0, 1.21, -4.4), fov: 46 }, "21: eight empty bays a side, every lid pushed aside"],
  ["box0", () => {}, { pos: eye(GD, 2.4, 1.4, 5.0), look: eye(GD, 0.6, 0.85, 0), fov: 40 }, "granitebox lidSlide 0 (closed), Spud for scale (2.06 Spud heights)"],
  ["box1", () => {}, { pos: eye(GD, 5.4, 1.4, 5.0), look: eye(GD, 3.6, 0.85, 0), fov: 40 }, "granitebox lidSlide 0.324 (ajar)"],
  ["box2", () => {}, { pos: eye(GD, 8.4, 1.4, 5.0), look: eye(GD, 6.6, 0.85, 0), fov: 40 }, "granitebox lidSlide 1 (half aside): the cavity"],
  ["redbox", () => {}, { pos: eye(GD, 11.9, 1.4, 5.0), look: eye(GD, 10.1, 0.85, 0), fov: 40 }, "granitebox material red (finished)"],
  ["lid", () => {}, { pos: eye(GD, 5.0, 2.0, 2.4), look: eye(GD, 3.2, 1.55, 0.6), fov: 30 }, "the lid, a mattress thick (ajar), the bevels, the grain"],
  ["unfin", () => {}, { pos: eye(0, 3.3, 1.7, 8.0), look: eye(0, 0.55, 0.8, 5.64), fov: 44 }, "the unfinished red box: ridges, chisel marks, shims, rubble"],
  ["shaftC", () => {}, { pos: eye(GE, 1.2, 1.9, 1.6), look: eye(GE, 0.05, 2.0, -2.0), fov: 40 }, "crackshaft: soft light and dust, not a tube (a box top under it)"],
  ["spill", () => {}, { pos: eye(GE, 5.0, 1.2, 1.8), look: eye(GE, 6.8, 1.0, 0), fov: 40 }, "crackshaft spill: the faint turquoise glow of 07"],
];
const BEAT = 1.0;
const shots = [];
SHOTS.forEach(([name, set, cam], i) => { T = r3(0.1 + i * BEAT); set(); shots.push([name, T, cam]); });
const END = r3(0.1 + SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "eg-serapeum", title: "Egypt EP04 Serapeum bench", idea: "Props bench for the Serapeum set (gallery, granitebox, crackshaft), not a clip", frame: "wide",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#0b0e16", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: ["spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-serapeum.mjs (props bench, no reviews).",
});
