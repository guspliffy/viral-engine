// Bench for the Sphinx enclosure and temples (engine/page/props-eg-sphinxpit.js, task T2 of ../briefs/T2.md): not a clip, one beat per still.
// All three kinds are built in the DESIGN world frame (the Sphinx's centreline z 0, floor y 0), so each group sits at its own x offset.
//   group A  x 0     sphinxpit (match false) + a box the size of the Sphinx (29.2 x 8 x 7.6) as a stand-in, sphinxtemple ruin, khafrevalley, Spud
//   group B  x 300   match true on pit and temple (panel 17): the witness block beside the wall's east return
//   group C  x 600   quarry 1 on the pit (no stand-in), the temple in era quarry at build 0.47
//   a pit from the NE rim | b grooves close, Spud | c wet 1 flow 0.5 | d panel 17 | e half-cut blocks | f temple ruin from the east
//   g1 quarry 1 | g2 temple quarry 0.47 | h valley temple + causeway from high | i quarry ramp + haul spot | j temple quarry build 1
//   node storyboards/series/ancient-aliens/05-sphinx/bench/make-eg-sphinxpit.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/05-sphinx/bench/eg-sphinxpit.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/eg-sphinxpit-*.png --out storyboards/series/ancient-aliens/05-sphinx/bench/eg-sphinxpit-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GB = 300, GC = 600;
const spud = (id, x, z, face) => ({ id, character: "potatobrawl/spud", at: [x, z], face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [spud("spudA", 0, -7.2, 180), spud("spudT", 33.5, 4.5, 90), spud("spudB", GB + 6.1, -6.7, 180)];
const props = [
  { id: "pitA", kind: "sphinxpit", x: 0, y: 0, z: 0 },
  { id: "boxA", kind: "limeblock", x: 0, y: 0, z: 0, size: [29.2, 8, 7.6], look: "weathered" },
  { id: "temA", kind: "sphinxtemple", x: 0, y: 0, z: 0, era: "ruin" },
  { id: "valA", kind: "khafrevalley", x: 0, y: 0, z: 0 },
  { id: "pitB", kind: "sphinxpit", x: GB, y: 0, z: 0, match: true },
  { id: "temB", kind: "sphinxtemple", x: GB, y: 0, z: 0, era: "ruin", match: true },
  { id: "pitC", kind: "sphinxpit", x: GC, y: 0, z: 0, ramp: true },
  { id: "temC", kind: "sphinxtemple", x: GC, y: 0, z: 0, era: "quarry" },
];
const SEED = () => { for (const id of ["pitA", "pitB", "pitC"]) c.prop(0, id, { wet: 0, flow: 0, quarry: 0 }, 0); c.prop(0, "temC", { build: 0 }, 0); };
SEED();
let T = 0;
const cam = (gx, p, l, f) => ({ pos: [gx + p[0], p[1], p[2]], look: [gx + l[0], l[1], l[2]], fov: f });
const SHOTS = [
  ["a", () => {}, cam(0, [22, 9, -14], [0, 2, 0], 50), "a: the pit from the north-east rim (Sphinx = a box)"],
  ["a3", () => {}, cam(0, [34, 16, -28], [0, 1, 2], 62), "a3: the whole enclosure from the north-east, high (not in the brief)"],
  ["a2", () => {}, cam(0, [-6, 3.0, -4.3], [-5, 2.6, -8.6], 62), "a2: the north wall from inside, whole grooves"],
  ["b", () => {}, cam(0, [2, 1.2, -6.2], [-3, 1.6, -8.6], 45), "b: the north wall grooves, Spud at (0, -7.2)"],
  ["c", () => c.prop(T, "pitA", { wet: 1, flow: 0.5 }, 0), cam(0, [2, 1.2, -6.2], [-3, 1.6, -8.6], 45), "c: wet 1, flow 0.5"],
  ["c2", () => {}, cam(0, [-6, 3.0, -4.3], [-5, 2.6, -8.6], 62), "c2: wet 1, flow 0.5, the north wall from inside"],
  ["c3", () => c.prop(T, "pitA", { flow: 0.8 }, 0), cam(0, [-13, 2.2, -4.6], [-9, 0.8, -8.6], 70), "c3: wet 1, flow 0.8, foot of the wall: ribbons, pools and mud"],
  ["d", () => c.prop(T, "pitA", { wet: 0, flow: 0 }, 0), cam(GB, [6.6, 1.6, -6.2], [6.4, 1.6, -8.2], 35), "d: panel 17, match true on both: the witness block and the wall's return"],
  ["d2", () => c.prop(T, "pitA", { wet: 0, flow: 0 }, 0), cam(GB, [7.4, 1.7, -4.9], [6.9, 1.7, -8.0], 55), "d2: panel 17 wider: witness block (left) and the wall's return (right)"],
  ["e", () => {}, cam(0, [11.5, 2.2, -4.8], [11.5, 0.8, -8], 45), "e: the half-cut north blocks"],
  ["f", () => {}, cam(0, [40, 4, 0], [25.6, 1, 0], 50), "f: the temple ruin from the east"],
  ["g1", () => c.prop(T, "pitC", { quarry: 1 }, 0), cam(GC, [14, 8, -13], [-6, 1, -5], 55), "g1: quarry 1 (12 cells)"],
  ["g2", () => c.prop(T, "temC", { build: 0.47 }, 0), cam(GC, [40, 6, 6], [25.6, 1, 0], 55), "g2: temple era quarry, build 0.47"],
  ["h", () => {}, cam(0, [40, 25, 40], [0, 0, 0], 55), "h: valley temple + causeway from high"],
  ["i", () => { c.prop(T, "pitC", { quarry: 0.34 }, 0); }, cam(GC, [20, 4, 11], [11, 0.3, 5.2], 50), "i: quarry 0.34 (5 cells) + the east ramp"],
  ["j", () => c.prop(T, "temC", { build: 1 }, 0), cam(GC, [40, 7, -8], [25.6, 1, 0], 55), "j: temple era quarry, build 1"],
  ["v1", () => {}, cam(0, [52, 4, 19.6], [25.6, 1.4, 19.6], 56), "v1: the valley temple from the east: portals, casing, roof (not in the brief)"],
  ["v2", () => {}, cam(0, [31.6, 1.2, 19.6], [24.6, 1.3, 19.6], 66), "v2: inside the T hall from the stem (not in the brief)"],
  ["h2", () => {}, cam(0, [20, 22, 60], [-55, 4, 0], 62), "h2: the causeway running up the plateau (not in the brief)"],
  ["k", () => {}, cam(0, [-30, 12, 22], [-10, 4, 8], 55), "k: the causeway climbing past the south-west corner"],
];
const BEAT = 1.0;
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * BEAT); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 240, false, { kinetic: false }); });
const END = r3(0.1 + SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "eg-sphinxpit", title: "Egypt EP05 Sphinx pit bench", idea: "Props bench for the Sphinx enclosure, temples and causeway, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#9cc4e6", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: ["spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/05-sphinx/bench/make-eg-sphinxpit.mjs (props bench, no reviews).",
});
