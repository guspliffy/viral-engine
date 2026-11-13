// Bench for the Ancient Aliens inside-the-pyramid kit (engine/page/props-aa-inside.js, task T4 of ../briefs/T4.md): not a clip,
// one beat per still, each group far apart. The still is 0.55 s into its beat. Set: "plain" with floor "none" (a night-blue
// background, no ground, no scenery of its own): the rooms bring their own floors and the look's key light is the only
// outside light, so the lamps' own lights show on the stone.
//   A  kingschamber wide from the south-east corner, Spud in the middle (panel 14): nine beams, five courses, the sarcophagus
//   A2 the same from the west end looking east, lamps lit | A3 the ceiling from below | A4 the sarcophagus close (broken corner)
//   A6 from outside the north wall (single-sided walls) | B  Spud at the south shaft opening (panel 28)
//   C  grandgallery from its foot looking up, Spud on the ramp at z -4 with y = 4 tan 26.3 (panel 13, a ramp not stairs) | C2 close
//   D  pyramidentrance from inside looking out (panel 12)
//   E  starshaft from the lower end looking up to the open end (panel 29)
//   F  relievingchamber, gangmarks at paint 0.3 | 0.7 | 1, oillamp, paintbowl, Spud (panel 33) | F5 the humped floor from the north-east corner
//   H  worklamp, oillamp, paintbowl and reedbrush on the King's Chamber floor, Spud for scale | H2 the three small ones close | H3 the oillamp close
//   G  the reedbrush in a hand: node storyboards/lookdev/make-grip-tests.mjs --prop reedbrush --hold thin  (not in this file)
//   node storyboards/series/ancient-aliens/kit/bench/make-aa-inside.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/kit/bench/aa-inside.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/aa-inside-*.png --out storyboards/series/ancient-aliens/kit/bench/aa-inside-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { kc: 0, gal: 40, ent: 80, shaft: 120, rel: 160 };
const SLOPE = 26.3, TAN = Math.tan((SLOPE * Math.PI) / 180);
const R45 = Math.SQRT1_2;
const shaftPt = (s, y, z = 0) => [GX.shaft, y * R45 + (z + s) * R45 - 0, -y * R45 + (z + s) * R45];   // a point of the tube (axis s, local y up, across 0) in the world

const cast = [
  { id: "spudA", character: "potatobrawl/spud", at: [GX.kc + 0.9, 0.5], face: 150, expr: "kind", follow: 0.2, seed: 2.1 },
  { id: "spudC", character: "potatobrawl/spud", at: [GX.gal, -4], y: r3(4 * TAN), face: 15, expr: "kind", follow: 0.2, seed: 2.3 },
  { id: "spudD", character: "potatobrawl/spud", at: [GX.ent + 0.3, -1.2], face: 200, expr: "kind", follow: 0.2, seed: 2.4 },
  { id: "spudF", character: "potatobrawl/spud", at: [GX.rel - 1.3, -1.7], face: 0, expr: "kind", follow: 0.2, seed: 2.5 },
  { id: "spudH", character: "potatobrawl/spud", at: [GX.kc + 30, -0.55], face: 25, expr: "kind", follow: 0.2, seed: 2.6 },
];
const props = [
  { id: "kc", kind: "kingschamber", x: GX.kc, y: 0, z: 0 },
  { id: "gal", kind: "grandgallery", x: GX.gal, y: 0, z: 0 },
  { id: "ent", kind: "pyramidentrance", x: GX.ent, y: 0, z: 0 },
  { id: "shaft", kind: "starshaft", x: GX.shaft, y: 0, z: 0 },
  { id: "rel", kind: "relievingchamber", x: GX.rel, y: 0, z: 0 },
  { id: "gm", kind: "gangmarks", x: GX.rel, y: 0.75, z: -2.611 },
  { id: "oil", kind: "oillamp", x: GX.rel - 0.55, y: 0, z: -2.2, wall: 0.41 },
  { id: "bowl", kind: "paintbowl", x: GX.rel + 0.95, y: 0, z: -2.25 },
  { id: "lamp", kind: "worklamp", x: GX.kc + 60, y: 0, z: -1.5, rot: 200 },   // the four small things wait out of sight until shot H
  { id: "oil2", kind: "oillamp", x: GX.kc + 60, y: 0, z: -0.45 },
  { id: "bowl2", kind: "paintbowl", x: GX.kc + 60, y: 0, z: -0.45 },
  { id: "brush", kind: "reedbrush", x: GX.kc + 60, y: 0.009, z: -0.75, tip: 90, rot: 25 },
];
c.prop(0, "gm", { paint: 1 }, 0);
let T = 0;
const eye = (x, y, z) => [x, y, z];
c.prop(0, "kc", { lit: 1 }, 0);
const SHOTS = [
  ["A", () => {}, { pos: eye(GX.kc + 5.0, 1.3, 2.5), look: eye(GX.kc - 3.0, 3.1, -0.7), fov: 100 }, "A kingschamber wide from the south-east corner, Spud in the middle (panel 14)"],
  ["A2", () => {}, { pos: eye(GX.kc - 4.7, 1.7, 2.3), look: eye(GX.kc + 2.4, 2.4, -1.2), fov: 80 }, "A2 from the west end looking east: lamps, shaft holes, doorway"],
  ["A3", () => {}, { pos: eye(GX.kc, 0.3, 1.0), look: eye(GX.kc, 5.8, -0.1), fov: 122 }, "A3 the ceiling from below: nine beams across the room, cracks at the south ends (top of the picture is north)"],
  ["A4", () => {}, { pos: eye(GX.kc - 1.6, 1.9, 2.1), look: eye(GX.kc - 3.7, 0.8, 0.5), fov: 48 }, "A4 the sarcophagus: broken south-east corner"],
  ["A5", () => c.prop(T, "kc", { lit: 0 }, 0), { pos: eye(GX.kc - 4.7, 1.7, 2.3), look: eye(GX.kc + 2.4, 2.4, -1.2), fov: 80 }, "A5 the same as A2 with the lamps off (lit 0): the baked fill only"],
  ["A6", () => c.prop(T, "kc", { lit: 1 }, 0), { pos: eye(GX.kc - 1.5, 1.5, -9.5), look: eye(GX.kc - 1.5, 2.0, 0), fov: 70 }, "A6 from OUTSIDE the north wall: single-sided walls, the room shows through"],
  ["B", () => { c.prop(T, "kc", { lit: 1 }, 0); c.A(T, "spudA", "move", { to: [GX.kc + 2.7, 2.3], dur: 0 }); }, { pos: eye(GX.kc + 1.0, 1.0, 0.7), look: eye(GX.kc + 2.7, 0.85, 2.4), fov: 52 }, "B Spud at the south shaft opening (panel 28)"],
  ["C", () => {}, { pos: eye(GX.gal, 0.9, 3.4), look: eye(GX.gal, 5.4, -17), fov: 82 }, "C grandgallery from its foot looking up the ramp, Spud on it at z -4, y 1.978 (panel 13)"],
  ["C2", () => {}, { pos: eye(GX.gal - 0.35, 2.55, -1.6), look: eye(GX.gal + 0.3, 4.2, -13), fov: 66 }, "C2 closer: the notches, the benches, the corbels"],
  ["D", () => {}, { pos: eye(GX.ent - 0.1, 0.95, -5.6), look: eye(GX.ent, 1.0, 4), fov: 74 }, "D pyramidentrance from inside looking out (panel 12)"],
  ["E", () => {}, { pos: eye(...shaftPt(0.4, 0.5)), look: eye(...shaftPt(20, 0.5)), fov: 58 }, "E starshaft from the lower end looking up to the open end (panel 29)"],
  ["F0", () => c.prop(T, "gm", { paint: 1 }, 0), { pos: eye(GX.rel + 1.2, 0.8, 1.2), look: eye(GX.rel - 0.2, 0.7, -2.6), fov: 74 }, "F relievingchamber wide: Spud, oillamp, paintbowl, the marks at paint 1 (panel 33)"],
  ["F5", () => {}, { pos: eye(GX.rel + 4.8, 1.05, -2.2), look: eye(GX.rel - 1.0, 0.45, 1.6), fov: 82 }, "F5 relievingchamber from the north-east corner: the humped floor beyond the flat strip, the nine ceiling beams"],
  ["F3", () => c.prop(T, "gm", { paint: 0.3 }, 0), { pos: eye(GX.rel, 0.78, -0.9), look: eye(GX.rel, 0.75, -2.6), fov: 44 }, "F gangmarks paint 0.3"],
  ["F7", () => c.prop(T, "gm", { paint: 0.7 }, 0), { pos: eye(GX.rel, 0.78, -0.9), look: eye(GX.rel, 0.75, -2.6), fov: 44 }, "F gangmarks paint 0.7"],
  ["F10", () => c.prop(T, "gm", { paint: 1 }, 0), { pos: eye(GX.rel, 0.78, -0.9), look: eye(GX.rel, 0.75, -2.6), fov: 44 }, "F gangmarks paint 1"],
  ["H", () => { c.A(T, "spudH", "move", { to: [GX.kc - 1.15, -0.55], dur: 0 }); c.prop(T, "lamp", { x: GX.kc - 0.6 }, 0); c.prop(T, "oil2", { x: GX.kc - 0.05 }, 0); c.prop(T, "bowl2", { x: GX.kc + 0.17 }, 0); c.prop(T, "brush", { x: GX.kc + 0.3 }, 0); }, { pos: eye(GX.kc - 0.75, 0.75, 1.7), look: eye(GX.kc - 0.55, 0.2, -0.8), fov: 62 }, "H worklamp, oillamp, paintbowl, reedbrush; Spud for scale"],
  ["H2", () => {}, { pos: eye(GX.kc + 0.13, 0.3, 0.4), look: eye(GX.kc + 0.13, 0.03, -0.6), fov: 56 }, "H2 oillamp, paintbowl, reedbrush close"],
  ["H3", () => {}, { pos: eye(GX.kc + 0.16, 0.13, -0.2), look: eye(GX.kc + 0.0, 0.07, -0.45), fov: 34 }, "H3 the oillamp close: clay saucer, wick at the lip, the small cel flame"],
];
const BEAT = 1.0;
const shots = [];
SHOTS.forEach(([name, set, cam], i) => { T = r3(0.1 + i * BEAT); set(); shots.push([name, T, cam]); });
const END = r3(0.1 + SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));

write(import.meta.url, {
  id: "aa-inside", title: "Ancient aliens inside bench", idea: "Props bench for the pyramid interior (kingschamber, worklamp, grandgallery, pyramidentrance, starshaft, relievingchamber, gangmarks, oillamp, paintbowl, reedbrush), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#243865", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "kc"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/kit/bench/make-aa-inside.mjs (props bench, no reviews).",
});
