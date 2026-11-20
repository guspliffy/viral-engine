// Potato Desk 10 "lunch trial" props bench (task T1, 20 Nov 2026): every kind of engine/page/props-lunch.js at its DESIGN size
// (storyboards/series/potato-desk/10-lunch-trial/DESIGN.md sections 2, 3, 5, 6). Not a clip. The room is built from the design's
// numbers (wall, counter, sink, microwave, coffee machine, cork board, windows, carpet, ceiling) with the four cast on their opening
// marks wearing the lanyards, the stain and the pocket glow; the hand props and the mould are a gallery off to the right.
//   node storyboards/lookdev/make-lunch-bench.mjs
//   node engine/render.mjs storyboards/lookdev/lunch-bench.json --stills <the times the generator prints> --draft --safe --out storyboards/lookdev/out   (more than 12 beats: --stills beats thins them)
//   node qa/contact.mjs storyboards/lookdev/out/lunch-bench-*.png --out storyboards/lookdev/out/lunch-bench-sheet.png
import { clip, write } from "../lib/clip.mjs";

const c = clip();
const G = 6.5;   // the gallery: x offset of the hand props and the mould, off every wide shot
const worn = (id, kind, who, extra = {}) => ({ id, kind, wear: who, x: 0, y: 0, z: 0, ...extra });
const props = [
  // the room (DESIGN section 2)
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.4, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 1.25, w: 4.4, d: 5.1 },
  { id: "ceil", kind: "ceilingtiles", x: 0, y: 2.6, z: 1.5, w: 4.4, d: 5.6 },
  { id: "counter", kind: "kitchencounter", x: 0.51, y: 0, z: -1.025, w: 2.58, d: 0.55, h: 0.86, colors: { top: "#A4A9AB", carcass: "#6C747B", door: "#78818A", pull: "#C9CED2", plinth: "#4A5056" }, dressing: false },
  { id: "sink", kind: "kitchensink", x: -0.41, y: 0.86, z: -1.02 },
  { id: "micro", kind: "microwave", x: 0.24, y: 0.86, z: -1.07 },
  { id: "bean", kind: "beanmachine", x: 0.79, y: 0.86, z: -1.05 },
  { id: "cork", kind: "corkboard", x: -0.4, y: 1.62, z: -1.285 },
  { id: "w1", kind: "blindwindow", x: 1.55, y: 1.625, z: -1.3, w: 0.5, h: 1.05 },
  { id: "w2", kind: "blindwindow", x: -1.5, y: 1.625, z: -1.3, w: 1.4, h: 1.05 },
  // the boxes on the floor in the wide (Chip's would be in his hands)
  { id: "mineWide", kind: "lunchbox", x: -0.05, y: 0, z: 1.1, label: "mine", lid: 1 },
  { id: "bossWide", kind: "lunchbox", x: 1.0, y: 0.86, z: -0.8, rot: 160, label: "boss", fill: "pasta", lid: 1 },
  // worn
  worn("lanSpud", "lanyard", "spud"), worn("lanChip", "lanyard", "chip"), worn("lanMash", "lanyard", "mash"), worn("lanWedge", "lanyard", "wedge"),
  worn("stain", "collarstain", "wedge"), worn("glow", "pocketglow", "wedge", { glow: 1 }),
  // the gallery
  { id: "gMine", kind: "lunchbox", x: G - 0.5, y: 0, z: 0, label: "mine", lid: 1 },
  { id: "gMineOpen", kind: "lunchbox", x: G + 0.45, y: 0, z: 0, label: "mine", lid: 0 },
  { id: "gBoss", kind: "lunchbox", x: G - 0.5, y: 0, z: 1.2, label: "boss", fill: "pasta", lid: 0 },
  { id: "gBossLid", kind: "lunchbox", x: G + 0.1, y: 0, z: 1.2, label: "boss", part: "lid" },
  { id: "gYog", kind: "yogurtcup", x: G + 0.9, y: 0, z: 0 },
  { id: "gYogOld", kind: "yogurtcup", x: G + 1.1, y: 0, z: 0, old: 1 },
  { id: "m1", kind: "mouldbox", type: "m1", x: G + 3.0, y: 0, z: 0 },
  { id: "m2", kind: "mouldbox", type: "m2", x: G + 3.35, y: 0, z: 0 },
  { id: "m3", kind: "mouldbox", type: "m3", x: G + 3.65, y: 0, z: 0 },
  { id: "m4", kind: "mouldbox", type: "m4", x: G + 3.9, y: 0, z: 0 },
  { id: "m5", kind: "yogurtcup", old: 1, x: G + 4.1, y: 0, z: 0 },
  { id: "m6", kind: "mouldbox", type: "m6", x: G + 4.35, y: 0, z: 0 },
];
const cast = [
  { id: "chip", character: "potatobrawl/chip", at: [0.15, 2.4], face: "camera", expr: "kind", follow: 0.2, seed: 1.7 },
  { id: "spud", character: "potatobrawl/spud", at: [-0.42, 0.25], face: "camera", expr: "kind", follow: 0.2, seed: 1.9 },
  { id: "mash", character: "potatobrawl/mash", at: [0.14, -0.42], face: "camera", expr: "kind", follow: 0.2, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: [0.88, 0.0], face: "camera", expr: "kind", follow: 0.2, seed: 3.1 },
];
for (const w of ["chip", "spud", "mash", "wedge"]) c.A(0, w, "noblink");

const WIDE = { pos: [0, 2.05, 7.6], look: [0, 0.9, 0], fov: 34 };
const sh = (pos, look, fov = 30) => ({ pos, look, fov });
const shots = [
  ["wideA", WIDE],
  ["counter", sh([0.45, 1.25, 3.0], [0.45, 1.1, -1.1], 30)],
  ["sink", sh([-0.41, 1.25, 1.5], [-0.41, 0.95, -1.0], 28)],
  ["cork", sh([-0.4, 1.62, 2.2], [-0.4, 1.62, -1.3], 30)],
  ["window2", sh([-1.5, 1.5, 3.3], [-1.5, 1.45, -1.3], 34)],
  ["wedge", sh([0.88, 0.62, 3.6], [0.88, 0.62, 0], 30)],
  ["stain", sh([0.88, 0.55, 1.9], [0.88, 0.55, 0], 30)],
  ["chip", sh([0.15, 0.45, 5.2], [0.15, 0.45, 2.4], 30)],
  ["spud", sh([-0.42, 0.5, 3.4], [-0.42, 0.5, 0.25], 30)],
  ["mine", sh([G - 0.5, 0.45, 2.3], [G - 0.5, 0.08, 0], 30)],
  ["mineTop", sh([G - 0.5, 1.3, 1.1], [G - 0.5, 0.1, 0], 30)],
  ["inside", sh([G + 0.45, 1.3, 1.0], [G + 0.45, 0.07, 0], 30)],
  ["boss", sh([G - 0.2, 1.1, 4.3], [G - 0.2, 0.05, 1.2], 34)],
  ["yogurt", sh([G + 1.0, 0.3, 2.0], [G + 1.0, 0.05, 0], 20)],
  ["mould1", sh([G + 3.33, 0.5, 2.6], [G + 3.33, 0.08, 0], 34)],
  ["mould2", sh([G + 4.12, 0.4, 2.3], [G + 4.12, 0.07, 0], 34)],
  ["mouldNear", sh([G + 3.0, 0.35, 1.0], [G + 3.0, 0.08, 0], 30)],
];
const SETSHOTS = new Set(["counter", "sink", "cork", "window2"]);
const mk = (list) => list.map(([n, s2], k) => [n, k * 1.1, s2]);
const mainShots = mk(shots.filter(([n]) => !SETSHOTS.has(n))), setShots = mk(shots.filter(([n]) => SETSHOTS.has(n)));
for (const [id, l] of [["lunch-bench", mainShots], ["lunch-bench-set", setShots]]) console.log(id, "stills at", l.map(([n, t]) => `${n} ${(t + 0.5).toFixed(1)}`).join(", "));
const mkSb = (id, list, cst) => ({
  id, title: "Lunch trial props bench", idea: "Props bench for Potato Desk 10 (T1), not a clip", fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet", physics: false,
  set: { type: "plain", color: "#aab6bc", floor: "#6E7680", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false }, hook: { show: cst.length ? ["chip"] : [], hint: 0, what: "engine bench" },
  cast: cst, props, captions: c.captions, beats: c.beats(list, 1.1 * list.length),
  notes: "Generated by storyboards/lookdev/make-lunch-bench.mjs (engine bench, no reviews).",
});
write(import.meta.url, mkSb("lunch-bench", mainShots, cast));
write(import.meta.url, mkSb("lunch-bench-set", setShots, []));
