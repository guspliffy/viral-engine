// Heaven's terms bench, task B (25 Nov 2026): SET B "heaven home" of engine/page/props-heavenhome.js (usage header there) at the DESIGN's sizes
// (storyboards/series/potato-desk/heaven-terms/DESIGN.md section 3). Not a clip: Spud sits up in the cloud bed, the cameras are DESIGN section 0's shots 5, 6, 7, 9, 13, 14, 15
// (station H = world (10.50, 26.00, 15.00), camera numbers are H-local and shifted here). Shot 15 stands in the real stairway (heavenstairs, stairsky, zoneclouds, hellfloor,
// hellhatch, deckchair, as heaven-steps' sky bench); the stair pieces are hidden (scale 0) in the other shots, as the clip hides them on the cuts.
// One shot per beat (1.2 s each; the still is 0.5 s in):
//   s5 H-WAKE (bed, duvet fold up 0.6)   s6 H-HARP (string 4 plucked, puff 1)   s7a H-SOCKS, both wells at on 0   s7b the same, both wells on 1
//   s9 H-DOCK settled (the design's start axis panned 6 deg right), the neighbour docked (bump 1: the squash)   s9far the same camera, the neighbour still arriving   s13 H-HUG framing   s14 H-PHONE framing (the bed's flat top)
//   s15 H-EDGE, the real stairway 26 m below   harp1 H-HARP with all strings vibrating (on 1)   over a side view of the whole island   s15wide shot 15's place, fov 50
//   node storyboards/series/potato-desk/heaven-terms/bench/make-home-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/home-bench.json --draft --safe --out <dir> --stills <the times it prints>
//   node qa/contact.mjs <dir>/home-bench-*.png --cols 4 --out <this dir>/home-sheet.png
import { readFileSync } from "node:fs";
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c, H = [10.5, 26.0, 15.0], W = ([x, y, z]) => [H[0] + x, H[1] + y, H[2] + z];
const cam = (pos, look, fov = 30) => ({ pos: W(pos), look: W(look), fov });
const SH = {
  s5: cam([1.10, 0.95, 4.60], [-0.55, 0.80, -0.60]), s6: cam([0.30, 0.90, 5.20], [0.05, 0.75, -1.00], 28), s7: cam([0.85, 0.14, 3.70], [0.50, 0.52, 0.55], 34),
  s9: cam([-0.40, 1.05, 6.20], [1.30, 0.75, -0.90], 34), s13: cam([1.20, 0.90, 5.60], [1.50, 0.72, 0.10]), s14: cam([0.60, 0.70, 4.80], [-0.80, 1.25, -0.12]),
  s15: cam([0.60, 4.30, 0.95], [-10.20, -19.20, -14.30]), s15w: cam([0.60, 4.30, 0.95], [-10.20, -19.20, -14.30], 50), s15b: cam([-0.30, 4.30, -0.40], [-11.10, -19.20, -15.65]), bedc: cam([1.2, 1.5, 2.6], [-1.0, 0.45, -0.3], 36), well: cam([0.5, 0.45, 1.6], [0.5, 0.0, 0.55], 30), rim: cam([-5.5, 1.2, -6.0], [-1.7, -0.2, -2.0], 30), hse: cam([1.6, 1.2, 2.6], [3.4, 0.5, -0.5], 30), over: cam([5.5, 2.4, 12.5], [2.0, -0.4, -0.8], 44), s9b: cam([-0.40, 1.05, 6.20], [2.03, 0.75, -0.68], 34),
};
const haveStairs = /heavenstairs:\s*buildStairs/.test(readFileSync(new URL("../../../../../engine/page/props-heavenstairs.js", import.meta.url), "utf8"));
const OFF = [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0], zr = (n) => -0.5 * (n - 2) - 0.7 * Math.floor((n - 1) / 10);
const stairs = haveStairs ? [{ id: "stairs", kind: "heavenstairs", x: 0, y: 0, z: 0 }]
  : Array.from({ length: 100 }, (_, i) => { const n = i + 1, land = n % 10 === 0 && n < 100, dep = land ? 1.2 : 0.5; return { id: `s${n}`, kind: "stoneblock", x: OFF[Math.floor((n - 1) / 10)], y: 0.22 * (n - 1), z: zr(n) - dep / 2, w: land ? 3.7 : 2.4, h: 0.22, d: dep }; });
const wisps = [[-3.4, 0.8, 1.8], [-2.8, 3.5, 1.4], [-1.9, 5.2, 1.2], [2.3, 4.6, 1.5], [3.0, 2.4, 1.8], [3.6, -0.6, 1.3]];
const REAL = ["sky", "clouds", "floor", "hatch", "chair", "parasol", "embers", ...wisps.map((_, i) => `wisp${i}`), ...stairs.map((s) => s.id)];
const BED = [H[0] - 1.25, H[2] - 0.60];
const props = [
  { id: "dawn", kind: "dawnsky", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, H[i]])) },
  { id: "isle", kind: "homeisland", x: H[0], y: H[1], z: H[2] },
  { id: "bed", kind: "cloudbed", x: BED[0], y: H[1], z: BED[1], rot: 40, cover: 0.6 },
  { id: "harp", kind: "goldharp", x: H[0] - 0.10, y: H[1], z: H[2] - 0.75 },
  { id: "sw1", kind: "sockwell", x: H[0] + 0.36, y: H[1], z: H[2] + 0.55 },
  { id: "sw2", kind: "sockwell", x: H[0] + 0.64, y: H[1], z: H[2] + 0.55 },
  { id: "house", kind: "cloudhouse", x: H[0] + 9.0, y: H[1] - 0.30, z: H[2] - 4.0 },
  { id: "sky", kind: "stairsky", x: 0, y: 0, z: 0 },
  { id: "clouds", kind: "zoneclouds", x: 0, y: 0, z: 0 },
  { id: "floor", kind: "hellfloor", x: 0, y: 0, z: 0 },
  { id: "hatch", kind: "hellhatch", x: -0.65, y: 0, z: 1.30 },
  { id: "chair", kind: "deckchair", x: 0.50, y: 0, z: 0.95, rot: -25 },
  { id: "parasol", kind: "parasol", x: 1.60, y: 0, z: 0.60 },
  ...wisps.map(([x, z, h], i) => ({ id: `wisp${i}`, kind: "smokewisp", x, y: 0, z, h, n: 8, size: 0.14, alpha: 0.5, rgb: "90,42,36" })),
  { id: "embers", kind: "embers", x: 0, y: 0, z: 0, box: [[-3.5, 0.3, -2], [3.5, 3.2, 4]], n: 40, size: 0.04 },
  ...stairs,
];
const cast = [{ id: "spud", character: "potatobrawl/spud", at: BED, y: H[1], face: 40, expr: "annoyed", follow: 0.2, seed: 1.7 }];
const T = { s5: 0, s6: 1.2, s7a: 2.4, s7b: 3.6, s9: 4.8, s9far: 6.0, s13: 7.2, s14: 8.4, s15: 9.6, harp1: 10.8, over: 12.0, s15w: 13.2, s15b: 14.4, bedc: 15.6, bedl: 16.8, well: 18.0, rim: 19.2, hse: 20.4 }, end = 21.6;
// the real stairway shows in shot 15 (and its wide) only
for (const id of REAL) { c.prop(0, id, { scale: 0 }, 0); c.prop(T.s15, id, { scale: 1 }, 0); c.prop(T.harp1, id, { scale: 0 }, 0); c.prop(T.s15w, id, { scale: 1 }, 0); c.prop(T.bedc, id, { scale: 0 }, 0); }
c.prop(T.bedl, "bed", { over: 1 }, 0);
A(0, "spud", "sit", { seat: "bed", dur: 0, hands: "lap" });
c.prop(0, "bed", { cover: 0.6, over: 0 }, 0); c.prop(0, "harp", { on: 0, puff: 0 }, 0); c.prop(0, "sw1", { on: 0 }, 0); c.prop(0, "sw2", { on: 0 }, 0);
c.prop(T.s6, "harp", { puff: 1 }, 0); c.prop(T.s7a, "harp", { puff: 0 }, 0);
c.prop(T.s7b, "sw1", { on: 1 }, 0); c.prop(T.s7b, "sw2", { on: 1 }, 0);
c.prop(T.s9, "house", { x: H[0] + 3.75, y: H[1] - 0.05, z: H[2] - 1.10, bump: 1 }, 0); c.prop(T.s9, "isle", { bump: 1 }, 0);
c.prop(T.s9far, "house", { x: H[0] + 7.0, y: H[1] - 0.2, z: H[2] - 2.8, bump: 0 }, 0); c.prop(T.s9far, "isle", { bump: 0 }, 0);
c.prop(T.s13, "house", { x: H[0] + 3.75, y: H[1] - 0.05, z: H[2] - 1.10 }, 0);
c.prop(T.harp1, "harp", { on: 1 }, 0);
const sb = {
  id: "home-bench", title: "Heaven terms: set B heaven home bench", idea: "Engine look bench for homeisland, cloudbed, goldharp, cloudhouse, dawnsky, sockwell (task B), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural", far: 160,
  set: { type: "plain", color: "#ffd9a8", floor: "none", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast, props, captions: c.captions,
  beats: c.beats([["s5", T.s5, SH.s5], ["s6", T.s6, SH.s6], ["s7a", T.s7a, SH.s7], ["s7b", T.s7b, SH.s7], ["s9", T.s9, SH.s9b], ["s9far", T.s9far, SH.s9b], ["s13", T.s13, SH.s13], ["s14", T.s14, SH.s14],
    ["s15", T.s15, SH.s15], ["harp1", T.harp1, SH.s6], ["over", T.over, SH.over], ["s15w", T.s15w, SH.s15w], ["s15b", T.s15b, SH.s15b], ["bedc", T.bedc, SH.bedc], ["bedl", T.bedl, SH.bedc], ["well", T.well, SH.well], ["rim", T.rim, SH.rim], ["hse", T.hse, SH.hse]], end),
  notes: "Generated by storyboards/series/potato-desk/heaven-terms/bench/make-home-bench.mjs (engine bench, one cast member).",
};
write(import.meta.url, sb);
console.log(`stairs: ${haveStairs ? "heavenstairs" : "stoneblock stand-ins"}`);
console.log("stills at: " + Object.values(T).map((t) => (t + 0.5).toFixed(1)).join(","));
