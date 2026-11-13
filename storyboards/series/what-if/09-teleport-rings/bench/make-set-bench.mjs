// Bench for engine/page/props-wedding-set.js (EP09 T1, DESIGN.md section 8): the garden and the hall at real size in the clip's
// own light (warm late sun), the real cast at the cast sizes. Not a clip: stills only, no reviews.
//   node storyboards/series/what-if/09-teleport-rings/bench/make-set-bench.mjs
//   node engine/render.mjs storyboards/series/what-if/09-teleport-rings/bench/set-bench.json --stills <the times printed> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/set-bench-*.png --out <sheet.png>
// One beat a second. Altar views: Chip left, Spud right, Mash on the aisle at the steps 20, 12, 6, 3, 1, 0. Hall views: Spud at SPUD_SHELF.
import { clip, write } from "../../../../lib/clip.mjs";
import { CHIP_SPOT, SPUD_SPOT, BRIDE, SEAT, GUESTS, PHOTO, HALL, hallAt } from "../../../../../engine/page/props-wedding-set.js";

const c = clip(), OFFS = { chip: [-4, 40], spud: [-1.3, 40], mash: [1.3, 40], spudH: [4, 40] };   // off stage, a body apart
const p2 = (a) => [a[0], a[2]];

const guestProps = GUESTS.map((g) => ({ id: g.id, ...g.spec, x: g.at[0], z: g.at[2] }));
const props = [
  { id: "garden", kind: "gardenaltar", x: 0, z: 0 },
  { id: "gateArch", kind: "flowerarch", x: 0, z: -10.95, on: 1 },
  { id: "altArch", kind: "flowerarch", x: 0, z: 1.55, on: 0 },
  ...guestProps,
  { id: "stand1", kind: "weddingguest", stand: true, dress: "jacket", color: "#6b4a36", hat: 1, x: -1.5, z: 0.35, scale: 0.001 },
  { id: "stand2", kind: "weddingguest", stand: true, dress: "dress", color: "#a892c0", hat: 3, x: 1.6, z: 0.45, scale: 0.001 },
  { id: "hall", kind: "ringhall", x: 0, y: 0, z: 60 },
];
// the guest params have no default in propState: seed them with a dur-0 set
for (const g of props.filter((p) => p.kind === "weddingguest")) c.prop(0, g.id, { turn: 0, gasp: 0, cheer: 0, sway: 0 }, 0);
c.prop(0, "altArch", { on: 0 }, 0);

const L = (x, y, z, lx, ly, lz, fov = 34) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
const ALTAR = (look = [1.2, 0.9, -8]) => L(-0.8, 0.8, 5.5, ...look, 34);   // aimed so Chip is left and Spud right of centre, the aisle between
const mashAt = (n) => ({ mash: p2(BRIDE(n)) });
const SP = [0.4, 0.9, 61.6];
const H = (a) => hallAt(a);
// [name, camera, who goes where (cast, absent = off stage), prop params]
const AT = { chip: CHIP_SPOT, spud: SPUD_SPOT };
const BEATS = [
  ["altar_step20", ALTAR(), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(20) }, {}],
  ["altar_step12", ALTAR(), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(12) }, {}],
  ["altar_step6", ALTAR(), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(6) }, {}],
  ["altar_step3", ALTAR([1.2, 0.9, -5]), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(3) }, {}],
  ["altar_step1", ALTAR([1.2, 0.9, -5]), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(1) }, {}],
  ["altar_step0", ALTAR([1.2, 0.8, -4]), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(0) }, {}],
  ["altar_wide", L(0.6, 1.6, 7.5, 0, 0.9, -6, 40), { chip: p2(AT.chip), spud: p2(AT.spud), ...mashAt(12) }, {}],
  ["photo_spots", L(-0.4, 1.0, 9.0, 0, 1.2, 1.5, 40), { chip: p2(PHOTO.chip), spud: p2(PHOTO.spud), mash: p2(PHOTO.mash) }, { altArch: { on: 1 }, stand1: { scale: 1 }, stand2: { scale: 1 }, ...Object.fromEntries(GUESTS.map((g) => [g.id, { cheer: 1 }])) }],
  ["guests_turn0", L(-0.2, 0.95, 1.4, 1.3, 0.6, -2.9, 40), {}, { altArch: { on: 0 }, stand1: { scale: 0.001 }, stand2: { scale: 0.001 }, ...Object.fromEntries(GUESTS.map((g) => [g.id, { cheer: 0 }])) }],
  ["guests_turn150", L(-0.2, 0.95, 1.4, 1.3, 0.6, -2.9, 40), {}, { R1a: { turn: 150 }, R2a: { turn: -150 }, R1b: { turn: 150 } }],
  ["guests_gasp", L(-0.2, 0.95, 1.4, 1.3, 0.6, -2.9, 40), {}, { R1a: { turn: 0, gasp: 1 }, R2a: { turn: 0, gasp: 1 }, R1b: { turn: 0, gasp: 1 }, R2b: { gasp: 0.5 } }],
  ["guests_gasp_close", L(1.0, 0.85, 0.2, 1.25, 0.62, -2.15, 30), {}, {}],
  ["guests_cheer", L(-0.2, 0.95, 1.4, 1.3, 0.6, -2.9, 40), {}, { R1a: { gasp: 0, cheer: 1 }, R2a: { gasp: 0, cheer: 1 }, R1b: { gasp: 0, cheer: 1 }, R2b: { gasp: 0, cheer: 1 } }],
  ["hall_spud", L(-0.1, 1.0, 66.4, 0.45, 0.95, 61.0, 40), { spudH: [H(HALL.SPUD_SHELF)[0], H(HALL.SPUD_SHELF)[2]] }, {}],
  ["hall_down", L(0.3, 1.0, 65.3, 0.2, 1.0, 60.0, 44), { spudH: [H(HALL.SPUD_SHELF)[0], H(HALL.SPUD_SHELF)[2]] }, {}],
  ["hall_above", L(0.3, 2.3, 64.0, 0.35, 0.0, 62.0, 40), {}, {}],
  ["hall_shelf", L(0.25, 0.85, 63.6, 1.06, 0.62, 61.75, 30), {}, {}],
  ["hall_photo", L(0.2, 0.8, 63.7, 1.11, 0.68, 62.3, 26), {}, {}],
  ["hall_cactus", L(0.5, 0.72, 62.2, 1.06, 0.64, 61.68, 20), {}, {}],
  ["hall_door", L(-0.2, 1.1, 63.4, 0.1, 1.2, 60.0, 40), {}, {}],
  ["hall_hooks", L(-0.2, 1.1, 62.4, -1.2, 0.95, 60.75, 34), {}, {}],
];

const shots = [], times = [];
const WHO = ["chip", "spud", "mash", "spudH"];
BEATS.forEach(([name, cam, who, params], i) => {
  const t = i;
  for (const w of WHO) { c.A(t, w, "move", { to: who[w] ?? OFFS[w], dur: 0.01, steps: 0, ease: "linear" }); c.A(t + 0.01, w, "turn", { to: 0, dur: 0.01 }); }
  for (const [id, set] of Object.entries(params)) c.prop(t, id, set, 0.01, "linear");
  shots.push([name, t, cam]); times.push(t + 0.6);
});
const END = BEATS.length;
write(import.meta.url, {
  id: "set-bench", title: "EP09 set bench (garden and hall)", idea: "Bench for engine/page/props-wedding-set.js (EP09 T1), stills only", fps: 30, look: "anime-pro", profile: "short", loop: false,
  set: { type: "plain", color: "#f6e7c4", floor: "none", light: "golden", key: [-5, 7, 5], shadowSize: 12, windows: false, aperture: 0, focus: false },
  music: false, sound: { auto: false },
  hook: { show: ["chip", "spud"], hint: 0, what: "engine test" },
  cast: [
    { id: "chip", character: "potatobrawl/chip", at: p2(AT.chip), face: 0, expr: "kind", follow: 0.2, seed: 3.1 },
    { id: "spud", character: "potatobrawl/spud", at: p2(AT.spud), face: 0, expr: "kind", follow: 0.2, seed: 2.1 },
    { id: "mash", character: "potatobrawl/mash", at: p2(BRIDE(20)), face: 0, expr: "kind", follow: 0.2, seed: 4.2 },
    { id: "spudH", character: "potatobrawl/spud", at: OFFS.spudH, face: 0, expr: "kind", follow: 0.2, seed: 2.1 },
  ],
  props, captions: [], beats: c.beats(shots, END),
  notes: "Generated by bench/make-set-bench.mjs (engine test, stills only, no reviews).",
});
console.log("stills at", times.join(","));
console.log(BEATS.map(([n], i) => `${i + 1}:${n}`).join("  "));
