// Country vs Country 01 set bench (T1): both halls, both lanes and their dressing (engine/page/props-checkout-set.js: shophall, discountlane, baglane,
// stockrack, candyrack, miniflag) with DESIGN section 1-3 positions, plus Spud, Wedge (on the platform) and Mash for size. Not a clip: one still per beat,
// 1 s apart, each taken 0.6 s into its beat; the beat sets the lane's len / speed / glow (dur 0) and the lane's grade.
//   node storyboards/series/country-vs-country/01-checkout/bench/make-bench-set.mjs   (prints the still times and what each shows)
//   node engine/render.mjs storyboards/series/country-vs-country/01-checkout/bench/set-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/set-bench-*.png --out storyboards/series/country-vs-country/01-checkout/bench/set-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GRADE = { de: { s: 0.98, w: -0.45, c: 1.06 }, us: { s: 1.16, w: 0.50, c: 1.00 } };
const CAMS = {
  c01: { pos: [-2.85, 1.15, 7.2], look: [-2.45, 1.05, 0], fov: 34 },
  c08: { pos: [1.85, 1.35, 7.6], look: [1.70, 1.35, 0], fov: 34 },
  c03: { pos: [1.60, 1.05, 5.4], look: [2.00, 0.98, 0.4], fov: 32 },
  c09: { pos: [-2.45, 0.95, 5.0], look: [-1.80, 1.05, 0], fov: 22 },
  belt: { pos: [-2.75, 1.75, 2.2], look: [-2.05, 0.46, -1.4], fov: 38 },
  scan: { pos: [-2.55, 1.0, 1.7], look: [-1.95, 0.47, 0.1], fov: 30 },
  flagde: { pos: [-2.50, 0.95, 2.6], look: [-1.80, 0.78, -0.62], fov: 22 },
  flagus: { pos: [1.60, 0.95, 2.8], look: [2.45, 0.78, 0.98], fov: 22 },
  c11: { pos: [0, 2.15, 8.2], look: [0, 0.95, 2.4], fov: 24 },
  wde: { pos: [-2.2, 1.5, 6.0], look: [-2.2, 1.4, -4], fov: 58 },
  wus: { pos: [2.2, 1.5, 6.0], look: [2.2, 1.4, -4], fov: 58 },
  rack: { pos: [-1.7, 1.3, -1.2], look: [-3.7, 1.3, -3.95], fov: 50 },
  candy: { pos: [2.0, 1.2, 0.2], look: [0.22, 1.0, -1.0], fov: 46 },
};
// [label, camera, lane (grade), lane params set at the beat start]
const SHOTS = [
  ["DE cam 01, belt 0.5 m/s, glow 0", "c01", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["DE cam 01, belt 2.4 m/s, glow 1.6", "c01", "de", { speed: 2.4, len: 7.3, glow: 1.6 }],
  ["DE belt from above, 0.5 m/s", "belt", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["DE belt from above, 2.4 m/s (streaks)", "belt", "de", { speed: 2.4, len: 7.3, glow: 0 }],
  ["DE scanner glow 0", "scan", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["DE scanner glow 1.6", "scan", "de", { speed: 2.4, len: 7.3, glow: 1.6 }],
  ["US cam 08", "c08", "us", {}],
  ["US cam 03", "c03", "us", {}],
  ["DE cam 09 (flag 80-190 px)", "c09", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["DE flag close", "flagde", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["US flag close", "flagus", "us", {}],
  ["seam, cam 11", "c11", "us", {}],
  ["DE hall down the aisle (racks, strips)", "wde", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["US hall down the aisle (candy, pendants)", "wus", "us", {}],
  ["DE back racks close", "rack", "de", { speed: 0.5, len: 0.7, glow: 0 }],
  ["US candy racks close", "candy", "us", {}],
];
const END = SHOTS.length;

const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const props = [
  { id: "hallde", kind: "shophall", ...at3(-2.2, 0, 0), look: "de", x0: -4.4, x1: 0 },
  { id: "hallus", kind: "shophall", ...at3(2.2, 0, 0), look: "us", x0: 0, x1: 4.4 },
  { id: "lanede", kind: "discountlane", ...at3(-2.0, 0, 0), speed: 0.5, len: 0, glow: 0 },
  { id: "laneus", kind: "baglane", ...at3(2.0, 0, 0) },
  { id: "flagde", staged: "on the till box", kind: "miniflag", flag: "de", ...at3(-1.70, 0.66, -0.62) },
  { id: "flagus", staged: "on the till box", kind: "miniflag", flag: "us", ...at3(2.70, 0.66, 0.98) },
  // German dressing: 3 on the back wall (front z -3.70), 4 on the left wall (front x -3.80), 3 on the seam wall (front x -0.54)
  ...[0, 1, 2].map((i) => ({ id: `rackb${i}`, kind: "stockrack", ...at3(-3.675 + 1.35 * i, 0, -3.95), seed: 11 + i })),
  ...[0, 1, 2, 3].map((i) => ({ id: `rackl${i}`, kind: "stockrack", ...at3(-4.05, 0, -3.325 + 1.35 * i), rot: 90, seed: 21 + i })),
  ...[0, 1, 2].map((i) => ({ id: `racks${i}`, kind: "stockrack", ...at3(-0.29, 0, -3.425 + 1.35 * i), rot: -90, seed: 51 + i })),
  // American dressing: 4 on the seam wall (front x 0.40), 3 tall on the back wall (front z -3.84), a gum rack on the counter's customer side
  ...[0, 1, 2, 3].map((i) => ({ id: `candy${i}`, kind: "candyrack", ...at3(0.22, 0, -3.4 + 1.2 * i), rot: 90, seed: 31 + i })),
  ...[0, 1, 2].map((i) => ({ id: `candyb${i}`, kind: "candyrack", ...at3(1.05 + 1.2 * i, 0, -4.02), tiers: 8, h: 2.4, seed: 41 + i })),
  { id: "gum", kind: "candyrack", ...at3(1.61, 0, -2.25), rot: -90, scale: 0.6, seed: 5 },
  // the American lamps are the clip's: 6 pendants and their pools
  ...[1.1, 2.7].flatMap((x, i) => [-2.8, -1.2, 0.4].flatMap((z, j) => [
    { id: `pend${i}${j}`, staged: "hangs on its cord from the ceiling", kind: "pendant", ...at3(x, 2.6, z), len: 0.8, r: 0.16 },
    { id: `pool${i}${j}`, kind: "lightpool", ...at3(x, 0.01, z), color: "#ffd9a0", w: 1.2, d: 0.8 },
  ])),
];
for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) c.prop(0, `pool${i}${j}`, { on: 0.45 }, 0, "linear");

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-2.72, 1.0], face: 55, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: [-1.30, -0.05], y: 0.20, face: -65, expr: "deadpan", follow: 0.2, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: [2.62, 0.30], face: -60, expr: "happy", follow: 0.3, seed: 5.2 },
];
for (const w of cast.map((a) => a.id)) c.A(0, w, "noblink");

const grade = [];
SHOTS.forEach(([, , lane, p], i) => { if (Object.keys(p).length) c.prop(i, "lanede", p, 0, "linear"); grade.push([i, GRADE[lane]]); });
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));
const seamAt = SHOTS.findIndex((s) => s[1] === "c11");

write(import.meta.url, {
  id: "set-bench", title: "Checkout set bench", idea: "Props bench for Country vs Country 01 (the halls, lanes, racks and flags), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#dfe5e8", floor: "none", light: "soft", para: 0, aperture: 0, shadow: { size: 5 }, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, split: { from: seamAt, to: seamAt + 1, x: 540, soft: 6, s: 0.98, w: -0.45 },
  music: false, sound: { auto: false },
  hook: { show: ["spud", "wedge", "lanede"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, CAMS[cam], label]), END),
  allowClip: [{ who: "wedge", with: "lanede", from: 0, to: END, reason: "the cashier stands on the lane's own platform" }],
  notes: "Generated by storyboards/series/country-vs-country/01-checkout/bench/make-bench-set.mjs (props bench, no reviews).",
});
