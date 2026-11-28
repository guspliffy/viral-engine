// Country vs Country 02 signals bench (T3): pedlight, uspedpole, spanwire + 3 hanging trafficlight, crossbars (both streets), usroad, busstopsign,
// usbackdrop (w, n, e), the F1 flag with poleH, binoculars (engine/page/props-cvc-signals.js), at the DESIGN positions, with Spud for size. Not a clip:
// one still per beat, 1 s apart, taken 0.6 s into its beat; a beat sets the keys (dur 0) and the grade of its lane.
//   node storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-signals.mjs   (prints the still times and what each shows)
//   node engine/render.mjs storyboards/series/country-vs-country/02-traffic-light/bench/signals-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/signals-bench-*.png --out storyboards/series/country-vs-country/02-traffic-light/bench/signals-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GRADE = { de: { s: 1.0, w: -0.15, c: 1.04 }, us: { s: 1.16, w: 0.35, c: 1.0 } };
const CAMS = {
  c01: { pos: [-2.2, 0.6, 0.1], look: [-9.25, 1.33, 0.1], fov: 34 },
  c11: { pos: [-3.2, 0.6, 0.28], look: [-9.25, 1.31, 0.28], fov: 34 },
  lampclose: { pos: [-6.4, 1.2, 1.5], look: [-9.15, 1.5, 1.1], fov: 24 },
  c03: { pos: [19.8, 0.95, -2.8], look: [12.5, 1.51, 1.4], fov: 32 },
  c08: { pos: [17.5, 0.72, -3.6], look: [16.5, 0.89, -0.1], fov: 30 },
  c10: { pos: [10.6, 1.05, -10.5], look: [10.6, 0.92, 0], fov: 44 },
  c18: { pos: [5.9, 1.0, -5.4], look: [7.1, 1.0, -1.2], fov: 32 },
  poleclose: { pos: [17.6, 1.35, -1.9], look: [16.3, 1.0, -0.2], fov: 30 },
  c06: { pos: [19.8, 0.95, -2.8], look: [12.3, 1.45, 1.2], fov: 32 },
  cardw: { pos: [14.0, 1.4, 3.0], look: [1.2, 3.4, 0.0], fov: 60 },
  carde: { pos: [12.0, 1.4, 3.0], look: [23.0, 3.2, 1.0], fov: 60 },
  bino: { pos: [30, 1.25, 0.9], look: [30, 1.2, 0], fov: 40 },
  sign360: { pos: [-6.4, 1.2, 1.5], look: [-9.15, 1.5, 1.1], fov: 24 },
};
// [label, camera, lane (grade), keys set at the beat start: [propId, set]...]
const SHOTS = [
  ["DE cam 01, red man", "c01", "de", [["ped", { go: 0 }]]],
  ["DE cam 01, green man", "c01", "de", [["ped", { go: 1 }]]],
  ["DE cam 11, green lamp", "c11", "de", [["ped", { go: 1 }]]],
  ["DE lamp close, red (hat)", "lampclose", "de", [["ped", { go: 0 }]]],
  ["US cam 03, hand + button", "c03", "us", [["up", { hand: 1, press: 0, talk: 0 }]]],
  ["US cam 08, button pressed + talk", "c08", "us", [["up", { hand: 1.2, press: 1, talk: 1 }]]],
  ["US pole close, button up", "poleclose", "us", [["up", { hand: 1, press: 0, talk: 0 }]]],
  ["US pole close, hand off", "poleclose", "us", [["up", { hand: 0, press: 0, talk: 0 }]]],
  ["US cam 10 wide (wire, heads, flag, bars)", "c10", "us", []],
  ["US cam 18 (bus stop sign)", "c18", "us", []],
  ["US cam 06 (bars, diner card)", "c06", "us", []],
  ["card W", "cardw", "us", []],
  ["card E", "carde", "us", []],
  ["binoculars glint 0", "bino", "us", [["bino", { glint: 0 }]]],
  ["binoculars glint 1", "bino", "us", [["bino", { glint: 1 }]]],
];
const END = SHOTS.length;

const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const props = [
  { id: "sky", kind: "shsky", time: "a", ...at3(0, 0, 0) },
  // German street
  { id: "deroad", kind: "street", w: 2.6, d: 22, slope: 0, ...at3(-7.7, 0, 0) },
  { id: "deforecourt", kind: "flagway", w: 22, d: 5, h: 0.1, rot: 90, ...at3(-9.0, 0, 0) },
  { id: "dekerb", kind: "kerb", x0: -11, x1: 11, h: 0.1, seed: 3, rot: 90, ...at3(-9.0, 0, 0) },
  { id: "deisland", kind: "flagway", w: 22, d: 1.2, h: 0.1, rot: 90, ...at3(-5.2, 0, 0) },
  { id: "defar", kind: "flagway", w: 22, d: 2.4, h: 0.1, rot: 90, ...at3(-0.6, 0, 0) },
  { id: "debars", kind: "crossbars", n: 4, w: 0.34, len: 2.0, pitch: 0.65, ...at3(-8.83, 0, -0.1) },
  { id: "ped", kind: "pedlight", face: 90, go: 0, ...at3(-9.15, 0.1, 1.1) },
  // American street
  { id: "usroad", kind: "usroad", ...at3(0, 0, 0) },
  { id: "usbars", kind: "crossbars", n: 10, w: 0.42, len: 2.0, pitch: 0.84, ...at3(7.81, 0, -0.1) },
  { id: "up", kind: "uspedpole", face: 135, hand: 1, press: 0, talk: 0, ...at3(16.14, 0.1, -0.1) },
  { id: "wire", staged: "the poles stand on the pavement at y 0.10; the prop itself sits at y 0", kind: "spanwire", a: [16.5, 0], b: [7.2, 0], foot: 0.1, h: 5, wireY: 4.7, sag: 0.22, hang: [[12.6, 4.48], [11.0, 4.44], [9.4, 4.48]], ...at3(0, 0, 2.1) },
  ...[[12.6, 4.48], [11.0, 4.44], [9.4, 4.48]].map(([x, y], i) => ({ id: `hl${i}`, staged: "hangs from the span wire", kind: "trafficlight", hang: true, housing: "#e8b923", scale: 0.75, go: 1, rot: 135, ...at3(x, y, 2.1) })),
  { id: "busstop", kind: "busstopsign", rot: 90, ...at3(7.3, 0.1, 3.4) },
  { id: "flagf1", kind: "miniflag", flag: "us", scale: 4, poleH: 5.0, rot: 90, ...at3(7.25, 0.1, 5.2) },
  { id: "cone", kind: "trafficcone", ...at3(18.9, 0.1, 2.2) },
  { id: "bkw", kind: "usbackdrop", view: "w", ...at3(0, 0, 0) },
  { id: "bkn", kind: "usbackdrop", view: "n", ...at3(0, 0, 0) },
  { id: "bke", kind: "usbackdrop", view: "e", ...at3(0, 0, 0) },
  { id: "bino", staged: "held by the watcher at its eye line", kind: "binoculars", glint: 0, ...at3(30, 1.2, 0) },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-9.25, -0.1], y: 0.1, face: 90, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "spudus", character: "potatobrawl/spud", at: [16.78, -0.1], y: 0.1, face: -90, expr: "kind", follow: 0.3, seed: 2.3 },
];
for (const w of cast.map((a) => a.id)) c.A(0, w, "noblink");
const grade = [];
SHOTS.forEach(([, , lane, keys], i) => { for (const [id, set] of keys) c.prop(i, id, set, 0, "linear"); grade.push([i, GRADE[lane]]); });
// prime the tweening keys at t 0
c.prop(0, "up", { hand: 1, press: 0, talk: 0 }, 0, "linear"); c.prop(0, "bino", { glint: 0 }, 0, "linear");
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "signals-bench", title: "Signals bench", idea: "Props bench for Country vs Country 02 (pedlight, uspedpole, spanwire, crossbars, usroad, busstopsign, usbackdrop, binoculars), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#dfe5e8", floor: "none", light: "soft", para: 0, aperture: 0, shadow: { size: 20 }, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, music: false, sound: { auto: false },
  hook: { show: ["spud", "ped"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, CAMS[cam], label]), END),
  notes: "Generated by storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-signals.mjs (props bench, no reviews).",
});
