// Country vs Country 02 street bench (T1): the block of flats `altbau` (engine/page/props-cvc-street.js) in the German street, both instances, at DESIGN
// section 2 / 4 positions, with Spud for size, the real W1 flowerbox (`flower`) and stand-in potatoes in the windows. Not a clip: one still per beat,
// 1 s apart, taken 0.6 s into its beat; a beat sets the block's keys (dur 0): all closed / lace parted with eyes / every window open.
// The crowd is `streetpotato` with the window-crowd keys (dress "cardigan", hat 3, hair, glasses, brow, feet false, clapHz, raise, lean;
// engine/page/props-neonstreet.js); the clap meets on every whole second of the clock (2.05 s is just after a meet).
//   node storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-street.mjs   (prints the still times and what each shows)
//   node engine/render.mjs storyboards/series/country-vs-country/02-traffic-light/bench/street-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/street-bench-*.png --out storyboards/series/country-vs-country/02-traffic-light/bench/street-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GRADE = { s: 1.0, w: -0.15, c: 1.04 };
const PV = 0.10;
const CAMS = {
  c12: { pos: [-1.0, 0.25, -0.10], look: [-7.36, 2.13, -0.10], fov: 38 },
  c09: { pos: [-1.0, 0.25, -0.10], look: [-9.25, 2.66, -0.10], fov: 38 },
  c01: { pos: [-2.2, 0.60, 0.10], look: [-9.25, 1.33, 0.10], fov: 34 },
  c02: { pos: [-11.0, 0.70, -0.5], look: [-13.9, 2.05, 0.675], fov: 34 },
  c07: { pos: [-6.6, 0.95, 2.6], look: [-0.6, 2.08, 2.025], fov: 28 },
  bal: { pos: [-10.5, 1.3, 2.8], look: [-14.0, 1.8, -0.2], fov: 38 },
  door: { pos: [-11.5, 1.2, -4.0], look: [-14.0, 1.0, -5.3], fov: 40 },
  roof: { pos: [-6.0, 0.8, 5.0], look: [-14.0, 4.6, 3.0], fov: 40 },
};
// [label, camera, keys of flatsL set at the beat start, who stands where]
const SHOTS = [
  ["cam 12, all closed", "c12", { part: 0, peek: 0, open: 0 }, "s12"],
  ["cam 12, lace parted, eyes peeking", "c12", { part: 1, peek: 1, open: 0 }, "s12"],
  ["cam 12, every window open, 12 clapping neighbours", "c12", { part: 0, peek: 0, open: 1 }, "s12", true],
  ["cam 09, all closed", "c09", { part: 0, peek: 0, open: 0 }, "k"],
  ["cam 09, lace parted, eyes peeking", "c09", { part: 1, peek: 1, open: 0 }, "k"],
  ["cam 09, wave half way (open 0.45)", "c09", { part: 0, peek: 0, open: 0.45 }, "k", true],
  ["cam 01, W1 swinging open, lace blowing", "c01", { part: 0, peek: 0, open: 0 }, "k"],
  ["cam 02 low on W1 (real flowerbox)", "c02", { part: 0, peek: 0, open: 0 }, "k"],
  ["cam 07, BW lace parted, the watcher", "c07", { part: 0, peek: 0, open: 0 }, "k", false, true],
  ["balcony and door from the forecourt", "bal", { part: 0, peek: 0, open: 0 }, "k"],
  ["ground floor, door, steps (forecourt)", "door", { part: 0, peek: 0, open: 0 }, "k"],
  ["roof, cornice (low, near)", "roof", { part: 0.5, peek: 0, open: 0 }, "k"],
];
const END = SHOTS.length;

const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const COLZ = (col) => r3(7.425 - 1.35 * col), FLOORY = (f) => r3(1.45 + 1.15 * (f - 1));
// the crowd (DESIGN section 5: floor, column, look); the 12th is the retiree's window (floor 1, column 5), here a potato too
const CROWD = [[1, 4, { hair: "bun", glasses: 1, color: "#b98aa0", h: 0.88 }], [1, 5, { hat: 3, capColor: "#4f5a52", glasses: 1, color: "#a9856a", h: 0.83 }],
  [1, 6, { hat: 3, capColor: "#5f6b78", glasses: 1, color: "#7f8f6a", h: 0.92 }], [1, 7, { hat: 3, capColor: "#75695a", color: "#9aa7b5", h: 0.90 }],
  [2, 4, { hat: 3, capColor: "#4f5a52", color: "#c9a66b", h: 0.92 }], [2, 5, { hair: "bun", glasses: 1, color: "#8c6f8a", h: 0.86 }],
  [2, 6, { hat: 3, capColor: "#6b6257", glasses: 1, color: "#d6c39c", h: 0.90 }], [2, 7, { hair: "tufts", glasses: 1, color: "#7a8fa0", h: 0.88 }],
  [3, 4, { hair: "bun", color: "#a8504a", h: 0.86 }], [3, 5, { hat: 3, capColor: "#5a4030", glasses: 1, color: "#8fa08a", h: 0.92 }],
  [3, 6, { hat: 3, capColor: "#75695a", color: "#b9b4aa", h: 0.90 }], [3, 7, { hair: "bun", glasses: 1, color: "#c8a0a8", h: 0.88 }]];
const AWAY = -60;
const props = [
  { id: "sky", kind: "shsky", time: "a", ...at3(0, 0, 0) },
  { id: "flatsL", staged: "the retiree's block across the road", kind: "altbau", ...at3(-14.0, 0, 0), rot: 90, look: "rose", d: 1.2, watch: [-9.25, 0.77, -0.10],
    solo: "1-5", soloOpen: 0, soloBlow: 0, part: 0, peek: 0, open: 0, from: 5, skip: ["1-5", "1-6"] },
  { id: "flatsR", staged: "the far block behind you", kind: "altbau", ...at3(-0.6, 0, 0), rot: -90, look: "butter", d: 0.6, back: "none", solo: "1-4", soloPart: 0, part: 0, peek: 0, open: 0, watch: [-9.25, 0.77, -0.10] },
  { id: "forecourt", kind: "flagway", w: 22, d: 5.0, h: 0.10, rot: 90, ...at3(-11.5, 0, 0) },
  { id: "kerb", kind: "kerb", x0: -11, x1: 11, h: 0.10, seed: 3, rot: 90, ...at3(-9.0, 0, 0) },
  { id: "road", kind: "street", w: 2.6, d: 22, slope: 0, rot: 90, ...at3(-7.7, 0, 0) },
  { id: "island", kind: "flagway", w: 22, d: 1.2, h: 0.10, rot: 90, ...at3(-5.8, 0, 0) },
  { id: "buslane", kind: "street", w: 2.2, d: 22, slope: 0, rot: 90, ...at3(-4.1, 0, 0) },
  { id: "farpave", kind: "flagway", w: 22, d: 2.4, h: 0.10, rot: 90, ...at3(-1.8, 0, 0) },
  { id: "w1box", staged: "the retiree's real flower box on W1's sill", kind: "flowerbox", ...at3(-13.92, 1.73, 0.675), w: 0.90, rot: 90, flower: "#d8352b" },
  { id: "flag", staged: "on the balcony rail", kind: "miniflag", flag: "de", ...at3(-13.45, 2.05, -0.675), scale: 2.7, tip: 35, rot: 90 },
  ...CROWD.map(([f, col, look], i) => ({ id: `old${i}`, staged: "an old neighbour in a window (hidden until the payoff)", kind: "streetpotato",
    ...at3(f === 1 && col === 6 ? -13.75 : -14.22, AWAY, COLZ(col)), rot: 90, dress: "cardigan", skin: "#f9b75c", brow: "#b9b4aa", angry: 0, feet: false, clapHz: 1, clapFrom: 0, raise: 0, lean: 0, ...look })),
  { id: "watcher", staged: "behind the lace of BW", kind: "streetpotato", ...at3(-0.22, AWAY, 2.025), rot: -90, h: 0.90, hat: 3, capColor: "#4f5a52", dress: "cardigan", color: "#6f6457", raise: 1, skin: "#f9b75c", brow: "#b9b4aa", feet: false },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-9.25, -0.10], y: PV, face: 90, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "spud12", character: "potatobrawl/spud", at: [-7.36, -0.10], y: 0, face: 90, expr: "shocked", follow: 0.3, seed: 1.3 },
];
c.A(0, "spud", "noblink"); c.A(0, "spud12", "noblink");

const grade = [], keys = ["part", "peek", "open"];
c.prop(0, "flatsL", { soloOpen: 0, soloBlow: 0, part: 0, peek: 0, open: 0 }, 0);
c.prop(0, "flatsR", { soloPart: 0, part: 0, peek: 0, open: 0 }, 0);
SHOTS.forEach(([, cam, k, who, crowd, bw], i) => {
  const t = i;
  c.prop(t, "flatsL", { ...k, soloOpen: i === 6 || i === 7 ? 1 : 0, soloBlow: i === 6 ? 0.6 : 0 }, 0);
  c.prop(t, "flatsR", { ...k, soloPart: bw ? 1 : 0 }, 0);
  c.prop(t, "watcher", { y: bw ? 1.45 : AWAY }, 0);
  CROWD.forEach(([f], j) => { c.prop(t, `old${j}`, { y: crowd ? FLOORY(f) : AWAY, lean: crowd ? 1 : 0 }, 0); });
  c.A(t, "spud", who === "k" ? "show" : "hide"); c.A(t, "spud12", who === "s12" ? "show" : "hide");
  grade.push([i, GRADE]);
});
console.log("stills:", [2.05, ...SHOTS.map((_, i) => r3(i + 0.6))].join(","), "(2.05 = the clap meets, 2.6 = hands apart)");
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "street-bench", title: "Street bench (altbau)", idea: "Props bench for Country vs Country 02: the block of flats with its lace, eyes, windows and balcony; not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#a9d4f2", floor: "none", light: "sun", para: 0, aperture: 0, shadow: { size: 20 }, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, music: false, sound: { auto: false },
  hook: { show: ["spud", "flatsL"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, CAMS[cam], label]), END),
  notes: "Generated by storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-street.mjs (props bench, no reviews).",
});
