// Country vs Country 02 kid bench (T4): the kid (characters/potatobrawl/tot-kid.json, costume `raincoat`, engine/page/costumes-raincoat.js) beside Spud
// (1.2 m apart, Spud 1.02 tall, the kid 0.60 with the hood top at 0.64), front / 3-4 / behind cameras and two close-ups of her face (the hood rim never
// crosses her eyes), then Wedge with the new opt-in wrist watch (`watch: "L"` on the wedge costume; bench/wedge-watch.json is wedge.json plus that key).
// Not a clip: one still per beat, 1 s apart, taken 0.6 s into its beat.
//   node storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-kid.mjs   (writes kid-bench.json + wedge-watch.json, prints the still times)
//   node engine/render.mjs storyboards/series/country-vs-country/02-traffic-light/bench/kid-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/kid-bench-*.png --out storyboards/series/country-vs-country/02-traffic-light/bench/kid-sheet.png
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../../..");
const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GRADE = { s: 1.0, w: -0.15, c: 1.04 };
const PV = 0.10;
const SX = 0.6, KX = -0.6;   // Spud and the kid 1.2 m apart (the kid on image left from the +z cameras; DESIGN panel 4 has her beside him)
const CAMS = {
  front: { pos: [0, 0.65, 8.5], look: [0, 0.55, 0], fov: 32 },
  q34: { pos: [5.0, 1.2, 6.5], look: [0, 0.5, 0], fov: 32 },
  face: { pos: [KX, 0.56, 1.7], look: [KX, 0.46, 0], fov: 24 },
  face34: { pos: [KX - 0.9, 0.58, 1.3], look: [KX, 0.46, 0], fov: 24 },
  low: { pos: [KX + 0.3, 0.28, 1.7], look: [KX, 0.5, 0], fov: 26 },
  back: { pos: [KX - 1.0, 0.62, -1.6], look: [KX, 0.40, 0], fov: 28 },
  side: { pos: [KX - 1.9, 0.5, 0.2], look: [KX, 0.4, 0], fov: 28 },
  wedge: { pos: [0.1, 0.95, 3.2], look: [0.05, 0.80, 0], fov: 30 },
};
// [label, camera, who stands on the floor]
const SHOTS = [
  ["front: Spud 1.02 and the kid 0.60, 1.2 m apart", "front", "sk"],
  ["3/4 from Spud's side", "q34", "sk"],
  ["kid face close-up", "face", "sk"],
  ["kid 3/4 close-up (rim, cheek, hood point)", "face34", "sk"],
  ["kid from a low camera", "low", "sk"],
  ["kid from behind (hood point, hem)", "back", "sk"],
  ["kid from her side (sleeve, cuff, glove)", "side", "sk"],
  ["Wedge with the watch on (left wrist at chest)", "wedge", "w"],
];
const END = SHOTS.length;

// Wedge with the watch key on: wedge.json + costume.watch "L" (a bench variant; the clip decides how it turns the key on)
const wedge = JSON.parse(fs.readFileSync(path.join(ROOT, "characters/potatobrawl/wedge.json"), "utf8"));
wedge.id = "wedge-watch"; wedge.costume = { ...wedge.costume, watch: "L" };
fs.writeFileSync(path.join(HERE, "wedge-watch.json"), JSON.stringify(wedge, null, 2) + "\n");

const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const props = [
  { id: "sky", kind: "shsky", time: "a", ...at3(0, 0, 0) },
  { id: "floor", kind: "flagway", w: 8, d: 8, h: 0.10, ...at3(0, 0, 0) },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [SX, 0], y: PV, face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "kid", character: "potatobrawl/tot-kid", at: [KX, 0], y: PV, face: 0, expr: "annoyed", follow: 0.3, seed: 2.1 },
  { id: "wedge", character: "../storyboards/series/country-vs-country/02-traffic-light/bench/wedge-watch", at: [0, 0], y: PV, face: 0, expr: "deadpan", follow: 0.2, seed: 3.1 },
];
for (const w of ["spud", "kid", "wedge"]) c.A(0, w, "noblink");
const grade = [];
SHOTS.forEach(([, , who], i) => {
  c.A(i, "spud", who === "sk" ? "show" : "hide"); c.A(i, "kid", who === "sk" ? "show" : "hide"); c.A(i, "wedge", who === "w" ? "show" : "hide");
  if (who === "w") c.A(i - 0.5, "wedge", "arm", { side: "L", pose: { o: [-0.05, 0.60, 0.46] }, dur: 0.45, ease: "inOut" });   // raised while he is still hidden
  grade.push([i, GRADE]);
});
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "kid-bench", title: "Kid bench (raincoat)", idea: "Character bench for Country vs Country 02: the kid in the red raincoat beside Spud, and Wedge's watch; not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#a9d4f2", floor: "none", light: "sun", para: 0, aperture: 0, shadow: { size: 8 }, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, music: false, sound: { auto: false },
  hook: { show: ["spud", "kid"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, CAMS[cam], label]), END),
  notes: "Generated by storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-kid.mjs (character bench, no reviews).",
});
