// Bench for the Ancient Aliens machines (engine/page/props-aa-ship.js, task T3 of ../briefs/T3.md): not a clip, one beat per still on a
// plain blue set; each group on its own spot, far apart. The still is 0.55 s into its beat.
//   A  ringship at y 40, beam 1, a 1.3 box (the crate stands in for the limeblock) in the beam at y 8, from the ground 45 m away (panel 01)
//   B  the same from below, near (panel 02)
//   C  ringship at s 0.2 in the sky, about 100 px wide on a 1080 frame (the thumbnail test)
//   D  cargoship (beam 1, wobble 0.6) with a granitespan hanging 3 m under it, from the water's edge (panel 17)
//   E  granitecutter over a roughgranite on the quarry sand, cut 0 | 0.5 | 1, Spud 2 m away, the pedestal on the left (panel 16)
//   F  aswanquarry wide | closer, Spud and the loose blocks
//   G  the ring's beam from the side (soft edge, motes) | H the cargoship's two beams from below | I the ring, lit 1, from near the rim
//   node storyboards/series/ancient-aliens/kit/bench/make-aa-ship.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/kit/bench/aa-ship.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/aa-ship-*.png --out storyboards/series/ancient-aliens/kit/bench/aa-ship-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { ring: 0, small: 0, cargo: 110, quarry: 330 };
const CZ = 24;   // the cutter stands on the quarry's sand, 24 m in front of its foot

const cast = [{ id: "spudE", character: "potatobrawl/spud", at: [GX.quarry + 2.3, CZ + 2.2], face: 20, expr: "kind", follow: 0.2, seed: 2.1 },
  { id: "spudF", character: "potatobrawl/spud", at: [GX.quarry - 3, 6], face: 0, expr: "kind", follow: 0.2, seed: 3.1 }];
const props = [
  { id: "ring", kind: "ringship", x: GX.ring, y: 40, z: 0 },
  { id: "block", kind: "crate", x: GX.ring, y: 8, z: 0, scale: 4.06 },
  { id: "tiny", kind: "ringship", x: GX.small + 60, y: 60, z: 0, s: 0.2 },
  { id: "cargo", kind: "cargoship", x: GX.cargo, y: 9, z: 0 },
  { id: "gbeam", kind: "granitespan", x: GX.cargo, y: 3.05, z: 0 },
  { id: "cut", kind: "granitecutter", x: GX.quarry, y: 0, z: CZ },
  { id: "stone", kind: "roughgranite", x: GX.quarry + 0.6, y: 0, z: CZ },
  { id: "quarry", kind: "aswanquarry", x: GX.quarry, y: 0, z: 0 },
  { id: "ring2", kind: "ringship", x: GX.small + 140, y: 40, z: 0 },
];
const SEED = () => {
  c.prop(0, "ring", { beam: 0, lit: 0.4, wobble: 0 }, 0); c.prop(0, "tiny", { beam: 1 }, 0); c.prop(0, "ring2", { beam: 1, lit: 1 }, 0);
  c.prop(0, "cargo", { beam: 0, wobble: 0 }, 0); c.prop(0, "cut", { slide: 1, cut: 0 }, 0); c.prop(0, "stone", { cut: 0 }, 0);
};
SEED();
let T = 0;
const SHOTS = [
  ["A", () => c.prop(T, "ring", { beam: 1 }, 0), { pos: [GX.ring, 1.6, 45], look: [GX.ring, 23, 0], fov: 64 }, "A ringship y 40, beam 1, the 1.3 box at y 8, from the ground 45 m away (panel 01)"],
  ["B", () => {}, { pos: [GX.ring + 3, 1.4, 13], look: [GX.ring, 27, 0], fov: 78 }, "B the same from below, near (panel 02)"],
  ["C", () => {}, { pos: [GX.small + 60, 1.6, 175], look: [GX.small + 60, 60, 0], fov: 40 }, "C ringship s 0.2 in the sky, 100 px wide on 1080"],
  ["D", () => c.prop(T, "cargo", { beam: 1, wobble: 0.6 }, 0), { pos: [GX.cargo, 2.8, 24], look: [GX.cargo, 6.3, 0], fov: 60 }, "D cargoship, wobble 0.6, granitespan 3 m under it (panel 17)"],
  ["E0", () => {}, { pos: [GX.quarry + 0.8, 1.9, CZ + 10], look: [GX.quarry + 0.3, 1.9, CZ], fov: 60 }, "E granitecutter over roughgranite, cut 0, Spud 2 m away"],
  ["E5", () => { c.prop(T, "cut", { cut: 0.5 }, 0); c.prop(T, "stone", { cut: 0.5 }, 0); }, { pos: [GX.quarry + 0.8, 1.9, CZ + 10], look: [GX.quarry + 0.3, 1.9, CZ], fov: 60 }, "E cut 0.5"],
  ["E1", () => { c.prop(T, "cut", { cut: 1 }, 0); c.prop(T, "stone", { cut: 1 }, 0); }, { pos: [GX.quarry + 0.8, 1.9, CZ + 10], look: [GX.quarry + 0.3, 1.9, CZ], fov: 60 }, "E cut 1: the cut face stands bare"],
  ["E1c", () => {}, { pos: [GX.quarry + 4.4, 1.3, CZ + 3.6], look: [GX.quarry + 1.4, 1.2, CZ], fov: 40 }, "E cut 1 close: flat smooth face beside the rough"],
  ["E1t", () => {}, { pos: [GX.quarry + 2.2, 3.4, CZ + 3.6], look: [GX.quarry + 1.4, 1.7, CZ], fov: 36 }, "E from above: the line, the hot spot and the dust at the stone top"],
  ["F", () => {}, { pos: [GX.quarry, 8, 70], look: [GX.quarry, 10, 0], fov: 70 }, "F aswanquarry wide"],
  ["F2", () => {}, { pos: [GX.quarry + 9, 2.4, 15], look: [GX.quarry + 2, 6.5, -6], fov: 54 }, "F aswanquarry closer: terraces, loose blocks, Spud"],
  ["G", () => {}, { pos: [GX.ring + 22, 14, 22], look: [GX.ring, 18, 0], fov: 42 }, "G the beam from the side: soft edge, sparse motes"],
  ["H", () => {}, { pos: [GX.cargo - 0.5, 1.0, 13], look: [GX.cargo, 5.2, 0], fov: 80 }, "H cargoship from below: two thin beams and the granite beam"],
  ["I", () => {}, { pos: [GX.small + 140 + 26, 3, 30], look: [GX.small + 140, 36, 0], fov: 66 }, "I ringship lit 1, beam 1, from near"],
];
const BEAT = 1.0;
const shots = [];
SHOTS.forEach(([name, set, cam, label], i) => { T = r3(i * BEAT); set(); shots.push([name, T, cam]); void label; });
const END = r3(SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));

write(import.meta.url, {
  id: "aa-ship", title: "Ancient aliens ship bench", idea: "Props bench for the aliens' machines (ringship, cargoship, granitespan, roughgranite, granitecutter, aswanquarry), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#8cc4f0", floor: "#d9c49a" }, music: false, sound: { auto: false },
  hook: { show: ["spudE", "ring"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/kit/bench/make-aa-ship.mjs (props bench, no reviews).",
});
