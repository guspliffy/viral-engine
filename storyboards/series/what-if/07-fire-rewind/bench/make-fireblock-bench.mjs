// Bench for the fire-rewind SET (engine/page/props-fireblock.js: fireblock, firelobby, lobbyclock), task T1 of
// storyboards/series/what-if/07-fire-rewind/DESIGN.md section 6. One scene, fourteen stills 1 s apart (each 0.6 s into its beat),
// grey stand-in boxes for Spud (0.76 x 0.88 x 0.66) and Chip (0.57 x 0.53 x 0.52) (the pale `stoneblock`). Not a clip.
// The street is frame A at the origin (fireblock, two `cobbles`, `streetlamp` as DESIGN 1.1 says); the inside (firelobby) stands at
// [0, 0, -40] with its clock, as the director will place it.
//   still 1  a  low wide from the pavement (1.4, 0.45, 3.0) at (0.2, 2.6, 0): fire window, Chip on the perch, lamp left; lights 0.75
//   still 2  b  the same, lights 0.17, chip 0.25 (the payoff block)
//   still 3  c  door + alarm box + bell from 2.2 m: pull 0, door 0, ring 0
//   still 4  c  the same: pull 1, door 1 (the stub hall shows), ring 1
//   still 5  d  Chip at CHIP_LEAN, sash 0
//   still 6  d  the same, sash 1
//   still 7  e  the lobby from the door: stair, banister, clock at 10:10 (minutes 610)
//   still 8  e  the same, clock 9:10 (minutes 550, 60 minutes earlier)
//   still 9  f  the hallway from the stair top, ndoor 0, a Spud stand-in in the neighbour's room stub
//   still 10 f  the same, ndoor 0.30 (the crack of panel 09)
//   still 14 h  the block from the right (10, 1.8, 9): the neighbours
//   still 12 k  close on the alarm box (0.5 m across), pull 0; still 13 the same, pull 1, ring 1 (checks the lever)
//   still 11 g  the whole block from the street (-0.3, 1.6, 10.5): sky, lamp pool, planters, kerb, neighbours (lights 0.75)
//   node storyboards/series/what-if/07-fire-rewind/bench/make-fireblock-bench.mjs
//   node engine/render.mjs storyboards/series/what-if/07-fire-rewind/bench/fireblock-bench.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,10.6,11.6,12.6,13.6 --draft --safe
//   node qa/contact.mjs out/fireblock-bench-*.png --out storyboards/series/what-if/07-fire-rewind/bench/fireblock-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const LB = [0, 0, -40];   // firelobby's place
const lob = (p) => [r3(p[0] + LB[0]), r3(p[1] + LB[1]), r3(p[2] + LB[2])];
const CAM = {
  a: { pos: [1.4, 0.45, 3.0], look: [0.2, 2.6, 0], fov: 45 },
  c: { pos: [3.0, 1.25, 2.2], look: [3.0, 1.2, 0], fov: 66 },
  k: { pos: [3.45, 0.85, 0.9], look: [3.45, 0.85, 0], fov: 40 },
  h: { pos: [10, 1.8, 9], look: [3, 5, 0], fov: 60 },
  g: { pos: [-0.3, 1.6, 10.5], look: [0, 4.8, 0], fov: 70 },
  d: { pos: [0.5, 1.6, 3.6], look: [0, 3.3, 0], fov: 40 },
  e: { pos: lob([0.3, 1.5, -0.3]), look: lob([0.2, 2.3, -7]), fov: 58 },
  f: { pos: lob([1.2, 3.6, -7.6]), look: lob([2.4, 3.2, -10.2]), fov: 58 },
};
const SHOTS = [["a", "a: lights 0.75, Chip on the perch"], ["a", "b: lights 0.17, chip 0.25"], ["c", "c: pull 0, door 0"], ["c", "c: pull 1, door 1, ring 1"],
  ["d", "d: sash 0, Chip at the lean"], ["d", "d: sash 1"], ["e", "e: clock 10:10"], ["e", "e: clock 9:10"], ["f", "f: ndoor 0"], ["f", "f: ndoor 0.30"], ["g", "g: the whole block from the street"], ["k", "k: alarm box + bell close, pull 0"], ["k", "k: pull 1, ring 1"], ["h", "h: block from the right, the neighbours"]];

const props = [
  { id: "block", kind: "fireblock", x: 0, y: 0, z: 0, rot: 0, lights: 0.75, sash: 0, door: 0, chip: 1, lobby: 1, fireroom: 0.15, lamp: 1, pull: 0 },
  { id: "pave", kind: "cobbles", x: 0, y: 0, z: 1.6, w: 28, d: 3.2, seed: 4, leaves: 0 },
  { id: "road", kind: "cobbles", x: 0, y: -0.12, z: 7.18, w: 28, d: 7.6, seed: 9, leaves: 0 },
  { id: "lamp", kind: "streetlamp", x: -2.4, y: 0, z: 2.75, h: 3.2, lit: 1 },
  { id: "inside", kind: "firelobby", x: LB[0], y: LB[1], z: LB[2], rot: 0, ndoor: 0, lit: 1 },
  { id: "clock", kind: "lobbyclock", x: -0.9 + LB[0], y: 3.6, z: -7.17 + LB[2], r: 0.45, minutes: 610 },
  { id: "spudbox", kind: "stoneblock", x: 2.6, y: 0, z: 1.7, w: 0.76, h: 0.88, d: 0.66 },
  { id: "chipbox", kind: "stoneblock", x: 0, y: 2.9, z: -0.42, w: 0.57, h: 0.53, d: 0.52 },
];
// state per still (a dur-0 set at the start of each beat); the Spud stand-in goes where each still needs it
const SPUD = { 0: [2.6, 0, 1.7], 1: [2.6, 0, 1.7], 2: [30, 0, 1.7], 3: [30, 0, 1.7], 4: [2.6, 0, 1.7], 5: [2.6, 0, 1.7], 6: [1.7, 0, -4], 7: [1.7, 0, -4], 8: [...lob([2.95, 2.24, -9.75])], 9: [...lob([2.95, 2.24, -9.75])], 10: [2.6, 0, 1.7], 11: [30, 0, 1.7], 12: [30, 0, 1.7], 13: [2.6, 0, 1.7] };
const STATE = [
  { block: { lights: 0.75, chip: 1, pull: 0, door: 0, ring: 0, sash: 0 }, chip: [0, 2.9, -0.42] },
  { block: { lights: 0.17, chip: 0.25 } },
  { block: { lights: 0.75, chip: 1, pull: 0, door: 0, ring: 0 } },
  { block: { pull: 1, door: 1, ring: 1 } },
  { block: { pull: 0, door: 0, ring: 0, sash: 0 }, chip: [0, 2.9, -0.16] },
  { block: { sash: 1 } },
  { block: { sash: 0 }, chip: [0, 2.9, -0.42] },
  { clock: 550 },
  { inside: 0 },
  { inside: 0.3 },
  { block: { lights: 0.75, chip: 1, sash: 0 }, chip: [0, 2.9, -0.42] },
  { block: { pull: 0, ring: 0, door: 0 } },
  { block: { pull: 1, ring: 1 } },
  { block: { pull: 0, ring: 0 } },
];
STATE.forEach((st, i) => {
  const t = i;
  c.prop(t, "spudbox", { x: SPUD[i][0], y: SPUD[i][1], z: SPUD[i][2] }, 0);
  if (st.block) c.prop(t, "block", st.block, 0);
  if (st.chip) c.prop(t, "chipbox", { x: st.chip[0], y: st.chip[1], z: st.chip[2] }, 0);
  if (st.clock != null) c.prop(t, "clock", { minutes: st.clock }, 0);
  if (st.inside != null) c.prop(t, "inside", { ndoor: st.inside }, 0);
});
c.prop(6, "clock", { minutes: 610 }, 0);
const beats = c.beats(SHOTS.map(([cam, label], i) => [`${cam}${i + 1}`, i, CAM[cam], label]), 14);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "fireblock-bench", title: "Fire rewind set bench", idea: "Props bench for There's a catch EP07 (fireblock, firelobby, lobbyclock), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#05081e", floor: "none", night: true }, hud: { sky: false }, music: false, sound: { auto: false },
  hook: { show: ["block"], hint: 0, what: "engine test" },
  cast: [], props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/07-fire-rewind/bench/make-fireblock-bench.mjs (props bench, no reviews).",
});
