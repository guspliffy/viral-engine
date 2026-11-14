// Bench for the Stonehenge far and flat pieces (engine/page/props-sh-far.js, brief S3): one group per camera, far apart on a plain set, WIDE frame
// (1920 x 1080) and the 700 m far plane the episode uses. Not a clip. The still is 0.55 s into each beat.
//   A  preselicrag from 16 m, Spud beside it, out 0   A2 the same, out 1 (pillar 1 tipped flat)   A3 the tor close from the side
//   B  welshhills wide   B2 the valley from the air (river, the four layers)
//   C  britainmap whole, wales 1   D scotland 1 too (both lines)   D2 woods 1, 5 m from the board on the Stonehenge dot (a 3 m wide piece)
//   E, F, G  manuscript drawing 1, 2, 3 from straight above   E2 the desk at an angle   E3 the page upright
//   H  haulteam at along 0.5 from 40 m, side on   H2 the team close, Spud beside   H3 the lead pullers
//   I  visitorcrowd from 30 m   J  stonefolk: shepherd + sheep from 10 m behind, on the Welsh hills   J2 watchers
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-far.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-far.json --stills <times> --draft --out out/sh-far
//   node qa/contact.mjs out/sh-far/sh-far-*.png --out storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-far-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { crag: 0, map: 150, page: 300, haul: 600, vis: 1000, hills: 5000 };
const SPUD = (id, x, z, face) => ({ id, character: "potatobrawl/spud", at: [x, z], face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [SPUD("spudA", GX.crag + 4.4, 9.0, 180), SPUD("spudH", GX.haul + 33, 6, 180)];
const LOOK = [8, 30, -50];
const props = [
  { id: "cragA", kind: "preselicrag", x: GX.crag, z: 0, loose: 3 },
  { id: "hillsB", kind: "welshhills", x: GX.hills, z: 0, gap: [-15, 17] },
  { id: "map", kind: "britainmap", x: GX.map, y: 8, z: 0 },
  { id: "page1", kind: "manuscript", x: GX.page, z: 0, drawing: 1 },
  { id: "page2", kind: "manuscript", x: GX.page + 10, z: 0, drawing: 2 },
  { id: "page3", kind: "manuscript", x: GX.page + 20, z: 0, drawing: 3 },
  { id: "page4", kind: "manuscript", x: GX.page + 30, y: 0.4, z: 0, drawing: 1, upright: true },
  { id: "haul", kind: "haulteam", x: GX.haul, z: 0, track: 40 },
  { id: "crowd", kind: "visitorcrowd", x: GX.vis, z: 0, n: 24, arc: [39, -40, 40], seed: 1 },
  { id: "shepherd", kind: "stonefolk", x: GX.hills - 1.2, z: -1, who: "shepherd", lookAt: LOOK },
  { id: "sheep", kind: "stonefolk", x: GX.hills + 1.4, z: -0.4, who: "sheep", n: 3, box: [2.6, 2.2], lookAt: LOOK, seed: 2 },
  { id: "watchers", kind: "stonefolk", x: GX.hills + 40, z: -30, who: "watchers", n: 8, box: [4, 3], lookAt: [0, 30, -20], seed: 3 },
];
const cam = (p, l, f = 32) => ({ pos: p.map(r3), look: l.map(r3), fov: f });
const DOT = { stonehenge: [1.02, -4.83] };   // the Stonehenge dot, board metres (props-sh-far.js SH_FAR_PARTS)
let T = 0;
const SHOTS = [
  ["A", () => {}, cam([GX.crag, 1.7, 16.5], [GX.crag + 0.5, 2.6, 0], 40), "A crag from 16 m, Spud beside, out 0"],
  ["A2", () => c.prop(T, "cragA", { out: 1 }, 0), cam([GX.crag, 1.7, 16.5], [GX.crag + 0.5, 2.6, 0], 40), "A2 out 1: pillar 1 tipped away, flat on the turf"],
  ["A3", () => {}, cam([GX.crag - 9, 1.5, 6], [GX.crag, 2.8, 0], 40), "A3 the tor close from the side"],
  ["B", () => {}, cam([GX.hills, 2.2, 14], [GX.hills, 30, -300], 38), "B welshhills wide"],
  ["B2", () => {}, cam([GX.hills + 20, 110, 90], [GX.hills + 60, 25, -300], 42), "B2 the valley from the air"],
  ["C", () => c.prop(T, "map", { wales: 1 }, 0), cam([GX.map, 8, 29], [GX.map, 8, 0], 32), "C map, wales 1"],
  ["D", () => c.prop(T, "map", { scotland: 1 }, 0), cam([GX.map, 8, 29], [GX.map, 8, 0], 32), "D map, scotland 1 (both lines)"],
  ["D2", () => c.prop(T, "map", { woods: 1 }, 0), cam([GX.map + DOT.stonehenge[0], 8 + DOT.stonehenge[1], 5], [GX.map + DOT.stonehenge[0], 8 + DOT.stonehenge[1], 0], 19.2), "D2 woods 1: 5 m from the board on the Stonehenge dot"],
  ["E", () => {}, cam([GX.page, 2.4, 0.03], [GX.page, 0, 0], 20), "E manuscript drawing 1"],
  ["F", () => {}, cam([GX.page + 10, 2.4, 0.03], [GX.page + 10, 0, 0], 20), "F manuscript drawing 2"],
  ["G", () => {}, cam([GX.page + 20, 2.4, 0.03], [GX.page + 20, 0, 0], 20), "G manuscript drawing 3"],
  ["E2", () => {}, cam([GX.page + 10, 1.1, 1.5], [GX.page + 10, 0, 0], 32), "E2 the page on its desk"],
  ["E3", () => {}, cam([GX.page + 30, 0.4, 2.6], [GX.page + 30, 0.4, 0], 22), "E3 the page upright"],
  ["H", () => c.prop(T, "haul", { along: 0.5 }, 0), cam([GX.haul + 26, 2.0, 40], [GX.haul + 26, 0.8, 0], 32), "H haulteam along 0.5 from 40 m, side on"],
  ["H2", () => {}, cam([GX.haul + 30, 1.3, 15], [GX.haul + 30, 0.6, 0], 30), "H2 the team close, Spud beside"],
  ["H3", () => {}, cam([GX.haul + 31, 1.0, 7], [GX.haul + 32, 0.6, 0], 30), "H3 the lead pullers"],
  ["I", () => {}, cam([GX.vis, 1.7, 10], [GX.vis, 1.2, 40], 52), "I visitorcrowd from 30 m"],
  ["J", () => {}, cam([GX.hills, 1.3, 10], [GX.hills, 3.0, -10], 38), "J shepherd + sheep from 10 m behind, on the hills"],
  ["J2", () => {}, cam([GX.hills + 40, 1.4, -17], [GX.hills + 40, 0.9, -30], 36), "J2 watchers from 13 m"],
];
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * 1.0); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 1030, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "sh-far", title: "Stonehenge kit far and flat pieces bench", idea: "Props bench for the Stonehenge kit S3 (preselicrag, welshhills, britainmap, manuscript, haulteam, stonefolk, visitorcrowd), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 700,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "cragA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-far.mjs (props bench, no reviews).",
});
