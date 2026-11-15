// Bench for block C1, Bimini under water (engine/page/props-at-c-bimini.js, brief block-c/briefs/C1.md): one group per camera, each its own copy of the place
// (6000 m apart on x from 40000) so no cast of one shot stands in another. Wide frame, far 1500. Not a clip; each shot is one beat, the still is 0.55 s in.
//   A  panel 25 (part hook): Spud floating (y -3.6) above the road, camera (0.4, -1.2, 2.6) look (0, -4.9, -2) fov 50
//   B  panel 28: Spud on block 0, camera (-2.2, -4.1, 5.0) look (0.8, -4.3, -8) fov 40
//   C  panel 30: same Spud, close, a striped fish 0.25 in front of his face, camera (-0.9, -4.15, 2.3) look (-0.5, -4.25, 0.8) fov 30
//   D  no Spud: low along the road, camera (2.5, -4.3, 4) look (-1, -4.6, -30) fov 40
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-c-bimini.mjs [A,B,C,D]
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-c/bench/at-c-bimini.json --stills <times> --draft --out out/at-c-bimini
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_DAY } from "../../kit/at-kit.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const NAMES = ["A", "B", "C", "D", "E", "F"], want = (process.argv[2] || "A,B,C,D").split(",");
const GX = Object.fromEntries(NAMES.map((n, i) => [n, 40000 + i * 6000]));
const on = (g) => want.includes(g);
const cast = [], props = [];
const spud = (g, x, z, face = 0, y) => cast.push({ id: `spud${g}`, character: "potatobrawl/spud", at: [GX[g] + x, z], ...(y != null && { y }), face, expr: "kind", follow: 0.2, seed: 2.1 });
// striped fish are 0.15 m; the brief wants 0.2: prop scale 1.333 with the path divided by it (the clip passes no prop scale: it sets the fish length itself)
const P = (g, id, kind, extra = {}) => props.push({ id: id + g, kind, x: GX[g], z: 0, ...extra });
const cam = (g, p, l, f = 28) => ({ pos: [r3(GX[g] + p[0]), r3(p[1]), r3(p[2])], look: [r3(GX[g] + l[0]), r3(l[1]), r3(l[2])], fov: f });
const SHOTS = [];
const place = (g, road = {}) => { P(g, "road", "biminiroad", road); P(g, "bed", "biminibed"); };

if (on("A")) { place("A"); P("A", "fish0", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [1.050, -2.926, -0.375], r: 1.050 } }); P("A", "fish1", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [-1.350, -3.001, -2.401], r: 1.050 } }); P("A", "fish2", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [0.450, -2.701, -4.876], r: 1.350 } }); spud("A", 0.2, 0.6, 0, -3.6); SHOTS.push(["A", cam("A", [0.4, -1.2, 2.6], [0, -4.9, -2.0], 50), "A panel 25: Spud floating above the road"]); }
if (on("B")) { place("B", { contacts: [[-0.5, 0.8, 0.3]] }); P("B", "fish0", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [0.675, -2.851, 0.900], r: 0.975 } }); P("B", "fish1", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [-1.200, -2.926, -2.251], r: 1.200 } }); P("B", "fish2", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [1.200, -2.926, -4.876], r: 1.350 } }); spud("B", -0.5, 0.8, 20, -4.9); SHOTS.push(["B", cam("B", [-2.2, -4.1, 5.0], [0.8, -4.3, -8], 40), "B panel 28: Spud on block 0"]); }
if (on("C")) { place("C", { contacts: [[-0.5, 0.8, 0.3]] }); P("C", "fish", "fish", { type: "striped", n: 1, scale: 1.333, path: { c: [-0.375, -3.226, 1.163], r: 0.030 }, range: 0.02 }); spud("C", -0.5, 0.8, 20, -4.9); SHOTS.push(["C", cam("C", [-0.9, -4.15, 2.3], [-0.5, -4.25, 0.8], 30), "C panel 30: the fish passes his face"]); }
if (on("D")) { place("D"); P("D", "fish0", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [0.150, -3.001, -3.001], r: 0.975 } }); P("D", "fish1", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [-0.450, -3.151, -8.252], r: 1.500 } }); P("D", "fish2", "fish", { type: "striped", n: 4, scale: 1.333, path: { c: [0.750, -3.001, -14.254], r: 1.875 } }); SHOTS.push(["D", cam("D", [2.5, -4.3, 4], [-1, -4.6, -30], 40), "D low along the road, into the blue"]); }
if (on("E")) { place("E"); SHOTS.push(["E", cam("E", [6, 32, 40], [0, -5, -400], 50), "E check: from 45 m up, along the road"]); }
if (on("F")) { place("F"); SHOTS.push(["F", cam("F", [0, 700, 380], [0, -5, -450], 40), "F check: from 700 m up (C2 looks here)"]); }
SHOTS.forEach(([name, cm, label], i) => { const T = r3(0.1 + i * 1.0); SHOTS[i] = [name, T, cm, label]; c.cap(T, T + 0.9, label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "at-c-bimini", title: "Block C1 Bimini underwater bench", idea: "Props bench for biminiroad + biminibed, not a clip",
  frame: "wide", far: 1500, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: AT_DAY, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm]) => [n, t, cm]), END),
  notes: "Generated by make-at-c-bimini.mjs (props bench, no reviews).",
});
