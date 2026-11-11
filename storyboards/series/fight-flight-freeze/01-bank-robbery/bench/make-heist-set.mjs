// Bench for engine/page/props-heistset.js (BRIEF-T2): every set piece of Fight, Flight or Freeze 01 seen in the clip's
// own light (the painted dusk back alley), one still per view. Not a clip: no reviews, stills only.
//   node storyboards/series/fight-flight-freeze/01-bank-robbery/bench/make-heist-set.mjs
//   node engine/render.mjs storyboards/series/fight-flight-freeze/01-bank-robbery/bench/heist-set.json --stills <the times printed> --draft --out <dir>
// One beat a second; every prop starts hidden (scale 0.001) and a beat shows the ones it needs with the params it tests.
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const OFF = [40, 44];

const PROPS = [
  { id: "bin", kind: "spudbin", x: 0, z: 0 },
  { id: "van", kind: "policevan", x: 0, z: 0 },
  { id: "car", kind: "policecar", x: 0, z: 0, rot: 55 },
  { id: "siren", kind: "sirenwash", x: 0, y: 1.5, z: -1.8, w: 4, h: 3 },
  { id: "pool", kind: "lightpool", x: 0, z: 0 },
  { id: "poolz", kind: "lightpool", x: 0, y: 0.17, z: 0.52, face: "z" },
  { id: "shadow", kind: "copshadow", x: 0, z: 1.2 },
  { id: "roofA", kind: "roofblock", x: -2.3, z: 0, seed: 3, extras: ["chimney", "tank"] },
  { id: "roofB", kind: "roofblock", x: 2.3, z: 0, seed: 8, extras: ["antenna", "vent"] },
  { id: "cr0", kind: "producecrate", x: 0, z: 0 },
  { id: "cr1", kind: "producecrate", x: 0, z: 0, fill: "carrots" },
  { id: "cr2", kind: "producecrate", x: 0, z: 0, fill: "cabbages" },
  { id: "cr3", kind: "producecrate", x: 0, z: 0, fill: "apples" },
  { id: "cr4", kind: "producecrate", x: 0, z: 0, fill: "carrots" },
  { id: "cr5", kind: "producecrate", x: 0, z: 0, fill: "apples" },
];

const L = (x, y, z, lx, ly, lz, fov = 46) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
const BIN_LEVEL = L(0.25, 0.9, 5.6, 0.25, 0.9, -5), BIN = L(0.25, 1.55, 5.4, 0.25, 0.5, 0), EYES = L(0.45, 0.62, 1.8, 0.45, 0.3, 0.4, 34), SHH = L(0.62, 0.52, 1.35, 0.62, 0.28, 0.42, 30);
const BEATS = [
  ["bin_level", BIN_LEVEL, [1.05, 0.25], { bin: { crook: -18 } }],
  ["bin_crooked", BIN, [1.05, 0.25], { bin: { crook: -18 } }],
  ["bin_straight", BIN, [1.05, 0.25], { bin: { crook: 0 } }],
  ["eyes_open", EYES, null, { bin: { blink: 0, look: -0.8 } }],
  ["eyes_blink", EYES, null, { bin: { blink: 1, look: 0 } }],
  ["eyes_shh", SHH, null, { bin: { shh: 1, look: 1 } }],
  ["tag_close", L(-0.35, 0.45, 1.75, -0.35, 0.42, 0.5, 30), null, { bin: { crook: 0 } }],
  ["van_blue", L(0, 0.9, 7.2, 0, 1.05, -1), [1.55, 1.2], { van: { lights: 1, clock: 0.1 } }],
  ["van_red", L(0, 0.9, 7.2, 0, 1.05, -1), [1.55, 1.2], { van: { lights: 1, clock: 0.3, rock: 3 } }],
  ["van_open", L(0, 0.9, 7.2, 0, 1.05, -1), [1.9, 1.4], { van: { open: 1, lights: 1, clock: 0.1 } }],
  ["van_doors", L(0.45, 1.15, 3.6, 0.45, 1.1, 0, 30), null, { van: { open: 0 } }],
  ["van_side", L(4.6, 1.5, 4.8, 0, 1.1, -1.4), null, { van: { open: 0.6, rock: -2 } }],
  ["policecar", L(3.4, 1.3, 6.6, 0, 0.9, 0), null, { car: { lights: 1, clock: 0.1 } }],
  ["siren_blue", L(0, 0.9, 5.2, 0, 1.2, -5), [0.5, 1.0], { siren: { on: 1, clock: 0.1 } }],
  ["siren_red", L(0, 0.9, 5.2, 0, 1.2, -5), [0.5, 1.0], { siren: { on: 1, clock: 0.3 } }],
  ["pool_ground", L(0, 1.25, 5.2, 0, 0.3, 0, 40), [0.1, 0.1], { pool: { on: 1, w: 1.8, d: 1.2 } }],
  ["pool_binfront", BIN_LEVEL, null, { bin: { crook: 0 }, poolz: { on: 1 } }],
  ["copshadow", L(0, 2.0, 5.0, 0, 0, -0.9, 46), null, { shadow: { on: 1 } }],
  ["roofs", L(0, 1.8, 14, 0, 0.9, 0), null, { roofA: {}, roofB: {} }],
  ["crate_whole", L(0, 0.9, 4.0, 0, 0.9, -5), null, { cr0: {} }],
  ["crate_carrots", L(0, 0.9, 4.0, 0, 0.9, -5), null, { cr1: {} }],
  ["crate_cabbages", L(0, 0.9, 4.0, 0, 0.9, -5), null, { cr2: {} }],
  ["crate_apples", L(0, 0.9, 4.0, 0, 0.9, -5), null, { cr3: {} }],
  ["crate_smash05", L(0, 1.1, 4.0, 0, 0.5, 0, 46), null, { cr4: { smash: 0.5 } }],
  ["crate_smash1", L(0, 1.1, 4.0, 0, 0.5, 0, 46), null, { cr5: { smash: 1 } }],
];

const shots = [], times = [];
BEATS.forEach(([name, cam, vik, shows], i) => {
  const t = i;
  for (const p of PROPS) {
    const on = p.id in shows;
    c.prop(t, p.id, on ? { scale: 1, ...shows[p.id] } : { scale: 0.001 }, 0.01, "linear");
  }
  c.A(t, "vik", "move", { to: vik ?? OFF, dur: 0.01, steps: 0, ease: "linear" });
  shots.push([name, t, cam]);
  times.push(t + 0.6);
});
const END = BEATS.length;
write(import.meta.url, {
  id: "heist-set", title: "Heist set pieces bench", idea: "Bench for engine/page/props-heistset.js (BRIEF-T2), stills only", fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false,
  set: { type: "env", env: "dusk-back-alley", envCheck: false, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["vik"], hint: 0, what: "engine test" },
  cast: [{ id: "vik", character: "duo/viking", at: OFF, face: 0, expr: "delighted", follow: 0.3, seed: 3.3 }],
  props: PROPS.map((p) => ({ ...p, scale: 0.001 })),
  captions: [], beats: c.beats(shots, END),
  notes: "Generated by bench/make-heist-set.mjs (engine test, stills only, no reviews).",
});
console.log("stills at", times.join(","));
console.log(BEATS.map(([n], i) => `${i + 1}:${n}`).join("  "));
