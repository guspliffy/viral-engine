// Potato Desk 11 "thermostat war" climate bench (task T2, 20 Nov 2026): deskfan (desk + twin), spaceheater, paperflurry, the extended blindwindow (lift, open, view "snow")
// at the DESIGN's numbers (storyboards/series/potato-desk/11-thermostat/DESIGN.md section 4 and the table of section 2), with the wall, the carpet, three desks, Spud's paper stack,
// the snow props that exist (snowspray, noterain look "snow", snowdrift, iciclerow) and the four lightpools. Not a clip.
//   node storyboards/lookdev/make-climate-bench.mjs
//   node engine/render.mjs storyboards/lookdev/climate-bench.json --stills 1,3,5,7,9,11,13,15,17,19,21 --draft --safe --out storyboards/lookdev/out
//   node qa/contact.mjs storyboards/lookdev/out/climate-bench-*.png --out storyboards/lookdev/out/climate-bench-sheet.png
// Beats (2 s each; the state changes are 0.3 s tweens at the start of the beat, the still is 1 s in):
//   1 allOff     wide (0.17, 1.75, 8.60) -> (0.17, 0.95, 0), fov 34: everything off, window shut with the blind down
//   2 allOn      the same wide: fans, heater, lift 1, open 1, spray 1, flurry 1, drifts 0.35, icicles
//   3 windowMid  close (2.20, 1.40, 3.10) -> (0.78, 1.18, -1.20), fov 42: lift 1, open 0.5
//   4 lunchWin   the lunch bench's window as it was (lift 0, open 0, no view), on its own bit of wall at x 8
//   5-8 winBlind, winLifted, winHalf, winOpen   the window alone, frontal (1.65, 1.40, 2.40), fov 28, spray and flakes off: blind down, lift 1, open 0.5, open 1
//   9-11 flurry (side-on at the stack's left), fans (desk fan + twin), heater: close looks, all on
import { clip, write } from "../lib/clip.mjs";

const c = clip();
const G = 8;   // the lunch window's wall: off every DESIGN shot
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.6, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 4.6, w: 5.0, d: 12.0 },
  { id: "deskL", kind: "workdesk", x: -1.0, y: 0, z: 0.255 }, { id: "deskM", kind: "workdesk", x: 0, y: 0, z: 0.255 }, { id: "deskR", kind: "workdesk", x: 1.0, y: 0, z: 0.255 },
  { id: "stack", kind: "paperstack", x: -0.31, y: 0.5, z: 0.25, amount: 1 },
  // the window and what comes through it
  { id: "win", kind: "blindwindow", x: 1.65, y: 1.4, z: -1.3, w: 0.6, h: 0.9, view: "snow", seed: 4 },
  { id: "spray", kind: "snowspray", x: 1.65, y: 0.95, z: -1.28, w: 0.6, h: 0.9, gaps: [0.2, 0.45, 0.7], amount: 0 },
  { id: "flakes", kind: "noterain", look: "snow", x: 1.35, y: 0, z: -0.3, n: 200, r: 0.9, top: 2.0, amount: 0, clock: 1.3 },
  { id: "driftWall", kind: "snowdrift", x: 1.65, y: 0, z: -1.3, w: 1.0, d: 0.5, depth: 0 },
  // d 1.125 not the DESIGN's 1.1: snowdrift reads its float32 z back as 1.1000000238 > d, (1 - zn) ** 1.5 is NaN and the render throws; d must be exact in float32 (0.5, 1.0, 1.125)
  { id: "driftFloor", kind: "snowdrift", x: 2.05, y: 0, z: 0.7, rot: -90, w: 1.6, d: 1.125, depth: 0 },
  { id: "iceSill", kind: "iciclerow", x: 1.65, y: 0.885, z: -1.26, len: 0.6, count: 6, grow: 0 },
  { id: "iceDesk", kind: "iciclerow", x: 0.3, y: 0.47, z: 0.53, len: 0.3, count: 4, grow: 0 },
  // the fans and the heater
  { id: "fan", kind: "deskfan", style: "desk", x: 0.66, y: 0.5, z: 0.38, rot: -75 },
  { id: "twin", kind: "deskfan", style: "twin", x: 1.0, y: 0, z: 0.8, rot: -30, cableTo: [0.66, 0.5, 0.38] },
  { id: "heater", kind: "spaceheater", x: -0.8, y: 0, z: 0.74, rot: 40 },
  { id: "flurry", kind: "paperflurry", x: -0.31, y: 0.5, z: 0.25, amount: 0 },
  // the four pools (cap 0.35 on the wall ones)
  { id: "warmFloor", kind: "lightpool", x: -0.7, y: 0, z: 0.95, w: 1.8, d: 1.2, color: "#FF8A2A" },
  { id: "warmWall", kind: "lightpool", face: "z", x: -1.15, y: 0.95, z: -1.285, w: 1.5, d: 1.3, color: "#FFB36B" },
  { id: "coldFloor", kind: "lightpool", x: 1.2, y: 0, z: 0.85, w: 1.8, d: 1.3, color: "#BFE0FF" },
  { id: "coldWall", kind: "lightpool", face: "z", x: 1.5, y: 1.1, z: -1.285, w: 1.3, d: 1.4, color: "#BFE0FF" },
  // the lunch window as it was: spec w 0.5, h 1.05, no view, no lift, no open
  { id: "lunchWall", kind: "officewall", x: G, y: 0, z: -1.3, w: 2.4, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "lunchWin", kind: "blindwindow", x: G, y: 1.625, z: -1.3, w: 0.5, h: 1.05 },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [0, -0.36], face: "camera", expr: "kind", follow: 0.2, seed: 1.9 },
  { id: "mash", character: "potatobrawl/mash", at: [1.0, -0.36], face: "camera", expr: "kind", follow: 0.2, seed: 2.3 },
];
for (const w of ["spud", "mash"]) c.A(0, w, "noblink");

// the states: beat 2 at t 2.0 (all on), beat 3 at 4.0 (window half open), beat 4 at 6.0
const T2 = 2.05, T3 = 4.05;
for (const id of ["fan", "twin"]) c.prop(T2, id, { on: 1 }, 0.3);
for (const [id, k] of [["heater", 1], ["warmFloor", 1], ["warmWall", 0.35], ["coldFloor", 1], ["coldWall", 0.35]]) c.prop(T2, id, { on: k }, 0.3);
c.prop(T2, "win", { lift: 1 }, 0.25); c.prop(T2 + 0.25, "win", { open: 1 }, 0.3);
c.prop(T2 + 0.55, "spray", { on: 1 }, 0.3); c.prop(T2, "flakes", { amount: 1 }, 0.3);
c.prop(T2, "flurry", { amount: 1 }, 0.3); c.prop(T2, "stack", { amount: 0.3 }, 0.3);
for (const id of ["driftWall", "driftFloor"]) c.prop(T2, id, { depth: 0.35 }, 0.5);
for (const id of ["iceSill", "iceDesk"]) c.prop(T2, id, { grow: 1 }, 0.5);
c.prop(T3, "win", { open: 0.5 }, 0.01);
// beats 5-8: the window on its own (spray and flakes off, blind down, then lifted, then half open, then open) 8.0-16.0
c.prop(8.02, "win", { lift: 0, open: 0 }, 0.01); c.prop(8.02, "spray", { on: 0 }, 0.01); c.prop(8.02, "flakes", { amount: 0 }, 0.01);
c.prop(10.02, "win", { lift: 1 }, 0.01); c.prop(12.02, "win", { open: 0.5 }, 0.01); c.prop(14.02, "win", { open: 1 }, 0.01);

const WIN = { pos: [1.65, 1.4, 2.4], look: [1.65, 1.38, -1.3], fov: 28 };
const WIDE = { pos: [0.17, 1.75, 8.6], look: [0.17, 0.95, 0], fov: 34 };
const list = [
  ["allOff", 0, WIDE],
  ["allOn", 2, WIDE],
  ["windowMid", 4, { pos: [2.2, 1.4, 3.1], look: [0.78, 1.18, -1.2], fov: 42 }],
  ["lunchWin", 6, { pos: [G, 1.5, 3.3], look: [G, 1.45, -1.3], fov: 34 }],
  ["winBlind", 8, WIN], ["winLifted", 10, WIN], ["winHalf", 12, WIN], ["winOpen", 14, WIN],
  ["flurry", 16, { pos: [-0.5, 1.4, 4.2], look: [-0.7, 1.3, 0], fov: 40 }],
  ["fans", 18, { pos: [1.1, 0.95, 2.4], look: [0.85, 0.45, 0.5], fov: 36 }],
  ["heater", 20, { pos: [-0.5, 0.7, 2.3], look: [-0.8, 0.2, 0.74], fov: 36 }],
];
console.log("climate-bench stills at 1,3,5,7,9,11,13,15,17,19,21");
const sb = {
  id: "climate-bench", title: "Climate props bench", idea: "Props bench for Potato Desk 11 (T2), not a clip", fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet", physics: false,
  set: { type: "plain", color: "#aab6bc", floor: "#6E7680", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false }, hook: { show: ["spud"], hint: 0, what: "engine bench" },
  cast, props, captions: c.captions, beats: c.beats(list, 22),
  notes: "Generated by storyboards/lookdev/make-climate-bench.mjs (engine bench, no reviews).",
};
write(import.meta.url, sb);
