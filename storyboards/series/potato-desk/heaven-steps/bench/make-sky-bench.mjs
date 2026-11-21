// Heaven steps bench, task T3 (20 Nov 2026): the stairway's WORLD of engine/page/props-heavensky.js at its DESIGN sizes
// (storyboards/series/potato-desk/heaven-steps/DESIGN.md section 2 "Hell's floor", "Sky and cloud", section 4). Not a clip, no cast. World frame (station B = the origin).
// The stairs: `heavenstairs` (props-heavenstairs.js) when that file has the kind, else 100 stoneblock stand-ins in the same places.
// Far plane 160 as the DESIGN says (the drum is 128 m from the farthest bench camera). One shot per beat (1.1 s each; the still is 0.4 s in):
//   bWide    B-WIDE (0.10, 1.60, 8.20) -> (0.05, 0.62, 0) fov 26, hatch glowing, deckchair + parasol at the right edge   bOpen   the same, hatch open 1
//   bPark    B-ARRIVE (0.50, 3.00, 7.80) -> (-0.10, 0.50, 0.60) fov 30, hatch open 0.5 (the lid half up, from above)
//   upFromB  a far look UP the stair from B (0.5, 1.4, 6) -> (0, 12, -28) fov 40, the zones in order, the gate far above
//   downFromT a far look DOWN from T (1.5, 24.5, -56) -> (0, -2, 8) fov 50: white, grey, orange, red, the hell glow at the foot
//   stationN N-LAND (1.8, 20.55, -44) -> (-1.0, 20.18, -50.35) fov 26: the grey cloud behind landing 90's open edge
//   stationM M-LAND (-0.4, 14.32, -28.5) -> (1.1, 13.82, -34) fov 26: the orange cloud behind tread 61
//   tLoop    T-LOOP (0.45, 22.89, -45.7) -> (0.45, 22.89, -55.3) fov 26: the white clouds beside the terrace, rows 200-610 sky
//   hatchShut / hatchOpen   (-0.65, 1.7, 3.9) -> (-0.65, 0, 1.3) fov 30: the hatch alone, lid down (glow 1), lid up (open 1)
//   overview from the side (34, 14, 14) -> (0, 11, -28) fov 54: the whole 22 x 56 m set inside the drum
//   node storyboards/series/potato-desk/heaven-steps/bench/make-sky-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/sky-bench.json --draft --safe --out <dir> --stills <the times it prints>
//   node qa/contact.mjs <dir>/sky-bench-*.png --cols 4 --out <this dir>/sky-sheet.png
import { readFileSync } from "node:fs";
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const cam = (pos, look, fov = 26) => ({ pos, look, fov });
const B_WIDE = cam([0.10, 1.60, 8.20], [0.05, 0.62, 0]), B_ARR = cam([0.50, 3.00, 7.80], [-0.10, 0.50, 0.60], 30);
const UP = cam([0.5, 1.4, 6], [0, 12, -28], 40), DOWN = cam([1.5, 24.5, -56], [0, -2, 8], 50);
const N_LAND = cam([1.8, 20.55, -44.0], [-1.0, 20.18, -50.35]), M_LAND = cam([-0.4, 14.32, -28.5], [1.1, 13.82, -34.0]), T_LOOP = cam([0.45, 22.89, -45.7], [0.45, 22.89, -55.3]);
const OVER = cam([34, 14, 14], [0, 11, -28], 54), HATCH = cam([-0.65, 1.7, 3.9], [-0.65, 0, 1.3], 30);

const haveStairs = /^\s+heavenstairs\(P\)/m.test(readFileSync(new URL("../../../../../engine/page/props-heavenstairs.js", import.meta.url), "utf8"));
const OFF = [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0], zr = (n) => -0.5 * (n - 2) - 0.7 * Math.floor((n - 1) / 10);
const stairs = haveStairs ? [{ id: "stairs", kind: "heavenstairs", x: 0, y: 0, z: 0 }]
  : Array.from({ length: 100 }, (_, i) => { const n = i + 1, land = n % 10 === 0 && n < 100, dep = land ? 1.2 : 0.5; return { id: `s${n}`, kind: "stoneblock", x: OFF[Math.floor((n - 1) / 10)], y: 0.22 * (n - 1), z: zr(n) - dep / 2, w: land ? 3.7 : 2.4, h: 0.22, d: dep }; });
const wisps = [[-3.4, 0.8, 1.8], [-2.8, 3.5, 1.4], [-1.9, 5.2, 1.2], [2.3, 4.6, 1.5], [3.0, 2.4, 1.8], [3.6, -0.6, 1.3]];
const props = [
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
c.prop(2.2, "hatch", { open: 1 }, 0); c.prop(3.3, "hatch", { open: 0.5 }, 0); c.prop(9.9, "hatch", { open: 0 }, 0); c.prop(11.0, "hatch", { open: 1 }, 0);
const end = 12.1;
const sb = {
  id: "sky-bench", title: "Heaven steps: sky, zone clouds, hell floor, hatch, parasol bench", idea: "Engine look bench for stairsky, zoneclouds, hellfloor, hellhatch, parasol (task T3), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural", far: 160,
  set: { type: "plain", color: "#9fd0f0", floor: "none", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats([
    ["bWide", 0, B_WIDE], ["bOpen", 1.1, B_WIDE], ["bPark", 2.2, B_ARR], ["upFromB", 3.3, UP], ["downFromT", 4.4, DOWN],
    ["stationN", 5.5, N_LAND], ["stationM", 6.6, M_LAND], ["tLoop", 7.7, T_LOOP], ["overview", 8.8, OVER], ["hatchShut", 9.9, HATCH], ["hatchOpen", 11.0, HATCH],
  ], end),
  notes: "Generated by storyboards/series/potato-desk/heaven-steps/bench/make-sky-bench.mjs (engine bench, no cast).",
};
write(import.meta.url, sb);
console.log(`stairs: ${haveStairs ? "heavenstairs" : "stoneblock stand-ins"}`);
console.log("stills at: " + Array.from({ length: 11 }, (_, i) => (i * 1.1 + 0.4).toFixed(1)).join(","));
