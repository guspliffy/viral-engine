// Rival duel 01 armrest war, builder A bench: engine/page/props-armrest.js (sharedarm, butterknife, fakearm, crowbar). Not a clip.
// One beat per still, each prop on its own spot (x apart) on a plain set; the still is 0.4 s into its beat.
//   node storyboards/series/rival-duel/01-armrest-war/bench/make-bench-armrest.mjs        -> armrest-bench.json (+ prints the stills line)
//   node engine/render.mjs storyboards/series/rival-duel/01-armrest-war/bench/armrest-bench.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/armrest-bench-*.png --out storyboards/series/rival-duel/01-armrest-war/bench/armrest-sheet.png
import { clip, write, r3, frame } from "../../../../lib/clip.mjs";

const c = clip();
const SA = 0, SA2 = 3.0, FA = 1.2, BK = 4.2, CB = 5.6;   // x of each prop
const props = [
  { id: "sa", kind: "sharedarm", x: SA, y: 0, z: 0 },
  { id: "sa2", kind: "sharedarm", x: SA2, y: 0, z: 0 },
  { id: "fa", kind: "fakearm", x: FA, y: 0, z: 0 },
  { id: "fa2", kind: "fakearm", x: SA2, y: 0.785, z: -0.22, tip: 90 },
  { id: "bk", kind: "butterknife", x: BK, y: 0, z: 0 },
  { id: "cb", kind: "crowbar", x: CB, y: 0, z: 0 },
];
const C1 = (x) => ({ pos: [x, 1.36, 1.32], look: [x, 0.76, 0.17], fov: 34 });                 // DESIGN section 10: C1 (2421 px a metre)
const C2 = (x) => ({ pos: [x, 1.10, 3.30], look: [x, 0.92, 0.0], fov: 46 });                  // the two-shot camera (750 px a metre)
const sa = (g, p, b) => ({ guard: g, press: p, butter: b });
const SHOTS = [   // name, [id, state], camera
  ["sa-default", ["sa", sa(0, 0, 0)], C1(SA)],
  ["sa-guard1", ["sa", sa(1, 0, 0)], C1(SA)],
  ["sa-press1", ["sa", sa(0, 1, 0)], C1(SA)],
  ["sa-press1-guard1", ["sa", sa(1, 1, 0)], C1(SA)],
  ["sa-press05-guard1", ["sa", sa(1, 0.5, 0)], C1(SA)],
  ["sa-butter05", ["sa", sa(0, 0, 0.5)], C1(SA)],
  ["sa-butter1", ["sa", sa(0, 0, 1)], C1(SA)],
  ["sa-butter1-guard1", ["sa", sa(1, 0, 1)], C1(SA)],
  ["sa-C2", ["sa", sa(0, 0, 0)], C2(SA)],
  ["sa-side", ["sa", sa(1, 0, 1)], { pos: [2.4 + SA, 0.95, 0.15], look: [SA, 0.62, 0.1], fov: 30 }],
  ["fakearm-front", null, frame([FA, 0.2, 0], { az: 0, h: 0.55, fov: 26 })],
  ["fakearm-q", null, frame([FA, 0.2, 0], { az: 40, h: 0.55, fov: 26 })],
  ["fakearm-lying-C1", ["sa2", sa(0, 0, 0)], C1(SA2)],
  ["fakearm-lying-top", null, { pos: [SA2 + 0.1, 1.6, 0.35], look: [SA2, 0.74, -0.05], fov: 30 }],
  ["fakearm-lying-rear", null, { pos: [SA2 + 0.5, 1.0, -1.1], look: [SA2, 0.8, -0.22], fov: 30 }],
  ["butterknife-front", null, frame([BK, 0.1, 0], { az: 0, h: 0.26, fov: 24 })],
  ["butterknife-q", null, frame([BK, 0.1, 0], { az: 50, h: 0.26, fov: 24 })],
  ["crowbar-front", null, frame([CB, 0.45, 0], { az: 0, h: 1.1, fov: 24 })],
  ["crowbar-side", null, frame([CB, 0.45, 0], { az: 90, h: 1.1, fov: 24 })],
  ["crowbar-q", null, frame([CB, 0.45, 0], { az: 50, h: 1.1, fov: 24 })],
  ["crowbar-hook", null, frame([CB, 0.8, -0.07], { az: 75, h: 0.34, fov: 24 })],
  ["crowbar-chisel", null, frame([CB, 0.06, 0.01], { az: 60, h: 0.2, fov: 24 })],
];
for (const p of props) if (p.kind === "sharedarm") c.prop(0, p.id, sa(0, 0, 0), 0.01);
const shots = [], T = (i) => r3(i * 1.0);
SHOTS.forEach(([name, st, cam], i) => { if (st) c.prop(T(i), st[0], st[1], 0.01); shots.push([name, T(i), cam]); });
const END = r3(SHOTS.length + 0.2);
console.log("stills:", SHOTS.map((_, i) => r3(T(i) + 0.4)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "armrest-bench", title: "Armrest war prop bench", idea: "Prop bench for props-armrest.js, not a clip", fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  set: { type: "plain", color: "#8e98a4", floor: "#6f7680", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true }, music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "prop bench" }, cast: [], props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Prop bench for engine/page/props-armrest.js (no reviews).",
});
