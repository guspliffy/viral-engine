// Bench for the real-scale site pieces (engine/page/props-aa-site.js, task T2 of ../briefs/T2.md): one group per camera on a
// plain daylight set (sky-blue backdrop, sand floor #d9c49a, a 60 m disc: every group sits inside it), groups 30 m or more apart
// and each camera turned so it sees only its own group. Not a clip. Each shot is one beat; the still is 0.55 s in. Spud
// (0.88 m) stands beside each piece for scale, 1.2 m clear of it.
//   A   Spud beside pyramidbase "today", a weathered limeblock in the gap (panel 07)     A2 the same straight on (panel 08)
//   B   pyramidbase "past", a core limeblock at y 1.2 beside Spud (panel 09)             B2 the block at y 0, dust 0.6
//   C   worktop, a core limeblock hanging 2 m over the gap (panel 02)
//   D   casingpair "today", camera 1.2 m away on the joint (panel 20)                    D2 the pair, Spud and a casing limeblock
//   E   pavement "today" with pyramidbase "past" behind, low (panel 19)                   E2 the step edges (+z, +x) and Spud
//   F   northline draw 1 across a pavement ("past") and the sand, from above (21/22)    F2 straight down
//   G   blockrows 3 x 10, one missing
//   node storyboards/series/ancient-aliens/kit/bench/make-aa-site.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/kit/bench/aa-site.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/aa-site-*.png --out storyboards/series/ancient-aliens/kit/bench/aa-site-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
// group origins [x, z]
const G = { A: [-38, 12], B: [0, 12], E: [38, 12], C: [-30, -32], D: [5, -35], F: [38, -22], R: [0, 44] };
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const WT = 3.15;   // the worktop stands on the ground at this y (its two lower courses)

const SPUD = (id, g, x, z, face) => ({ id, character: "potatobrawl/spud", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [
  SPUD("spudA", "A", 2.3, 1.7, -20), SPUD("spudB", "B", 2.3, 2.4, -35), SPUD("spudC", "C", 3.0, 13.3, -10),
  SPUD("spudD", "D", 2.2, 2.1, -25), SPUD("spudE", "E", 8.6, 5.0, -40), SPUD("spudF", "F", 8.7, 0, -30), SPUD("spudG", "R", 2.5, -4.6, 160),
];
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const props = [
  P("baseA", "pyramidbase", "A", 0, 0, { state: "today", gap: [0], seed: 1 }),
  P("blockA", "limeblock", "A", 0, -0.72, { look: "weathered", seed: 3 }),
  P("baseB", "pyramidbase", "B", 0, 0, { state: "past", seed: 2 }),
  P("blockB", "limeblock", "B", 0, 2.0, { y: 1.2, look: "core", seed: 4 }),
  P("topC", "worktop", "C", 0, 0, { y: WT, gap: [0.7, 7.0], seed: 1 }),
  P("blockC", "limeblock", "C", 0.7, 7.0, { y: WT + 2.0, look: "core", seed: 5 }),
  P("pairD", "casingpair", "D", 0, 0, { state: "today", seed: 1 }),
  P("caseD", "limeblock", "D", -2.5, 2.6, { look: "casing", seed: 6 }),
  P("baseE", "pyramidbase", "E", 0, 0, { state: "past", seed: 3 }),
  P("paveE", "gizapavement", "E", 0, 4.7, { size: [14, 10], state: "today", seed: 1 }),
  P("paveF", "gizapavement", "F", 0, 0, { size: [14, 10], state: "past", seed: 2 }),
  P("lineF", "northline", "F", 0, 7.5, { y: 0.125, len: 120 }),
  P("rowsG", "blockrows", "R", 0, 0, { rows: 3, cols: 10, missing: [[1, 3]], seed: 1 }),
];
// params propState has no default for are seeded at 0 (a dur-0 set), then set per shot
for (const id of ["blockA", "blockB", "blockC", "caseD"]) c.prop(0, id, { dust: 0 }, 0);
c.prop(0, "lineF", { draw: 0 }, 0);

// ---- the shots: [name, set at its start, camera, label]
const cam = (g, p, l, f = 45, y0 = 0) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1] + y0), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1] + y0), r3(G[g][1] + l[2])], fov: f });
let T = 0;
const SHOTS = [
  ["A", () => {}, cam("A", [-1.2, 1.2, 9.5], [1.1, 1.7, 0], 50), "A pyramidbase today, weathered limeblock in the gap, Spud (panel 07)"],
  ["A2", () => {}, cam("A", [1.3, 1.1, 8.0], [1.2, 1.6, 0], 50), "A2 the same straight on (panel 08)"],
  ["B", () => {}, cam("B", [1.1, 1.2, 10], [1.1, 2.2, 0.8], 50), "B pyramidbase past, core limeblock at y 1.2 (panel 09)"],
  ["B2", () => c.prop(T, "blockB", { y: 0, dust: 0.6 }, 0), cam("B", [1.1, 1.2, 10], [1.1, 2.2, 0.8], 50), "B2 the block landed, y 0, dust 0.6"],
  ["C", () => {}, cam("C", [2.4, 1.6, 13.5], [0.7, 0.9, 7.0], 50, WT), "C worktop, a block hanging 2 m over the gap (panel 02)"],
  ["D", () => {}, cam("D", [0.12, 0.93, 1.65], [0, 0.93, 0.45], 40), "D casingpair today, 1.2 m: the 1 px joint and its chip (panel 20)"],
  ["D2", () => {}, cam("D", [0, 1.5, 10.5], [0, 1.1, 0.8], 60), "D2 casingpair, a casing limeblock, Spud"],
  ["E", () => {}, cam("E", [2.5, 0.75, 6.5], [-0.5, 0.9, 0.5], 50), "E pavement today, pyramidbase past behind, low (panel 19)"],
  ["E2", () => {}, cam("E", [13, 1.8, 15], [7.6, 0.5, 5], 45), "E2 the gizapavement's +z and +x step edges, Spud"],
  ["F", () => c.prop(T, "lineF", { draw: 1 }, 0), cam("F", [5, 26, 18], [0, 0, -8], 40), "F northline draw 1 over pavement and sand, from above (21/22)"],
  ["F2", () => {}, cam("F", [0, 34, 1], [0, 0, 0.4], 40), "F2 straight down: one line, dead straight"],
  ["G", () => {}, cam("R", [7, 2.4, -11], [1.5, 0.6, 0], 45), "G blockrows 3 x 10, [1, 3] missing"],
];
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * 1.0); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 1760, false, { kinetic: false, size: 36 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "aa-site", title: "Ancient Aliens site pieces bench", idea: "Props bench for the real-scale site pieces (limeblock, pyramidbase, worktop, casingpair, blockrows, gizapavement, northline), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#8cc4f0", floor: "#d9c49a" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "baseA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/kit/bench/make-aa-site.mjs (props bench, no reviews).",
});
