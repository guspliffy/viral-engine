// Bench for the Stonehenge stones (engine/page/props-sh-stones.js, task S1 of ../briefs/S1.md): one group per camera on the plain
// base set (blue-grey backdrop, no ground: the stones' own shadow decals lie in the air at y 0). Wide frame (1920 x 1080). Not a clip.
// Each shot is one beat; the still is 0.55 s in. Spud (0.88 m) stands beside the stones for scale, 1.2 m clear of them.
//   A  era new, the whole monument from [0, 1.6, 70] down the axis: complete ring, the tallest pair's slit on the axis, long shadows
//   B  era today from the same camera: six top stones, three complete pairs, Stone 56 alone just right of the axis
//   C  era new from high above [30, 60, 60]: the clean unbroken ring, the horseshoe open to +z
//   C2 era today from the same high camera
//   D1-D3  built 0.3, 0.6, 0.85 from the high camera
//   E  a sarsen with two knobs and a top stone 0.5 above it (a second sarsen holds its other end), holes over knobs, camera 3 m away
//   E2 the top stone lifted 1.4 m so the holes can be seen over the knobs
//   F  two top stones end to end 0.3 apart, ridge facing groove
//   G  slope 1.2 from [0, 1.5, 45] with a long lens: the ground falls, the ring top is level
//   H  today close: Stone 56 from its foot looking up, the knob on top against the sky
//   I  today: the Altar Stone under the fallen 55
//   J  the single kinds in a row: giantpair, bluestones (rough, dressed, today), altarstone, heelstone, fallensarsen
//   J2 giantpair from the front, J3 heelstone + fallensarsen
//   L  one today and one new upright side by side from 6 m
//   K  dusk 0.85 on the new monument from the A camera
//   M1-M3  the new monument from the A camera under the suns (26, 12), (14, 6.5), (0, 0.3, red-orange)
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-stones.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-stones.json --stills <times> --draft --out out/sh-stones
//   node qa/contact.mjs out/sh-stones/sh-stones-*.png --out storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-stones-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
// group origins [x, z]: every group is more than 300 m (the camera's far plane) from every other camera's view of the monument
const G = { A: [0, 0], B: [-1000, 0], G: [1000, 0], E: [0, 600], F: [100, 600], E2: [-100, 600], J: [0, -600], L: [0, 1200], M1: [0, 1800], M2: [0, 2400], M3: [0, 3000] };
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const SPUD = (id, g, x, z, face) => ({ id, character: "potatobrawl/spud", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [
  SPUD("spudL", "L", 0.2, 1.8, 0),
  SPUD("spudA", "A", 6, 21, 175), SPUD("spudB", "B", 6, 21, 175), SPUD("spudE", "E", -2.6, 1.8, -30), SPUD("spudH", "B", 3.0, -4.4, -150), SPUD("spudI", "B", -3.3, -2.6, 160), SPUD("spudJ", "J", -3.0, 3.2, 20),
];
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const SUN = { sunAz: 21, sunEl: 7 };
const props = [
  P("monA", "stonehenge", "A", 0, 0, { era: "new", built: 1, dusk: 0, ...SUN }),
  P("monB", "stonehenge", "B", 0, 0, { era: "today", ...SUN }),
  // M1-M3: the new monument under three suns from the A camera: (26, 12), (14, 6.5), (0, 0.3, the climax: red-orange)
  P("monM1", "stonehenge", "M1", 0, 0, { era: "new", sunAz: 26, sunEl: 12 }),
  P("monM2", "stonehenge", "M2", 0, 0, { era: "new", sunAz: 14, sunEl: 6.5 }),
  P("monM3", "stonehenge", "M3", 0, 0, { era: "new", sunAz: 0, sunEl: 0.3, sunColor: "#ff6a2a" }),
  P("monG", "stonehenge", "G", 0, 0, { era: "new", slope: 1.2 }),
  // E: two sarsens 3.25 apart (the middle of each is under one end of a top stone), the top stone 0.5 above them
  P("sarE1", "sarsen", "E", 0, 0, { look: "new", knobs: 2, seed: 3 }),
  P("sarE2", "sarsen", "E", 3.25, 0, { look: "new", knobs: 2, seed: 4 }),
  P("topE", "toplintel", "E", 1.625, 0, { y: 4.6, look: "new", curve: false, seed: 5 }),
  // F: two top stones end to end, 0.3 apart (centres 3.33 + 0.3 - 0.08 apart: the ridge is outside the 3.25)
  // E2: the same, the top stone lifted 1.4 m so the holes can be seen over the knobs
  P("sarE3", "sarsen", "E2", 0, 0, { look: "new", knobs: 2, seed: 3 }),
  P("sarE4", "sarsen", "E2", 3.25, 0, { look: "new", knobs: 2, seed: 4 }),
  P("topE2", "toplintel", "E2", 1.625, 0, { y: 5.5, look: "new", curve: false, seed: 5 }),
  // J: the single kinds in a row (giantpair, bluestones rough / dressed / today, altarstone, heelstone, fallensarsen in three pieces)
  P("pairJ", "giantpair", "J", -9, 0, { h: 6.7, slit: 0.5, seed: 2 }),
  P("blueJ1", "bluestone", "J", -3.2, 1.0, { look: "rough", seed: 3 }),
  P("blueJ2", "bluestone", "J", -1.9, 1.0, { look: "dressed", seed: 4 }),
  P("blueJ3", "bluestone", "J", -0.5, 1.0, { look: "rough", era: "today", seed: 5 }),
  P("altJ", "altarstone", "J", 5, 0, { buried: 0.6, seed: 6 }),
  P("heelJ", "heelstone", "J", 13, 0, { era: "new", seed: 7 }),
  P("fallJ", "fallensarsen", "J", 22, 0, { pieces: 3, size: [5.6, 2.4, 1.2], seed: 8 }),
  // L: one new and one today upright side by side, seen from 6 m
  P("sarL1", "sarsen", "L", -1.9, 0, { look: "new", knobs: 2, seed: 11, ...SUN }),
  P("sarL2", "sarsen", "L", 1.9, 0, { look: "today", knobs: 2, seed: 12, ...SUN }),
  P("topF1", "toplintel", "F", -1.775, 0, { y: 0.0, look: "new", curve: false, seed: 6 }),
  P("topF2", "toplintel", "F", 1.775, 0, { y: 0.0, look: "new", curve: false, seed: 7 }),
];
c.prop(0, "monA", { built: 1, dusk: 0 }, 0);

const cam = (g, p, l, f = 40) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
let T = 0;
const HIGH = (g) => cam(g, [30, 60, 60], [0, 0, 0], 40);
const SHOTS = [
  ["A", () => {}, cam("A", [0, 1.6, 70], [0, 3.4, 0], 26), "A new: the whole monument down the axis"],
  ["B", () => {}, cam("B", [0, 1.6, 70], [0, 3.4, 0], 26), "B today: the ruin from the same camera"],
  ["C", () => {}, HIGH("A"), "C new from high above: a clean ring, the horseshoe open to +z"],
  ["C2", () => {}, HIGH("B"), "C2 today from high above: the ruin's layout"],
  ["D1", () => c.prop(T, "monA", { built: 0.3 }, 0), HIGH("A"), "D1 built 0.3"],
  ["D2", () => c.prop(T, "monA", { built: 0.6 }, 0), HIGH("A"), "D2 built 0.6"],
  ["D3", () => c.prop(T, "monA", { built: 0.85 }, 0), HIGH("A"), "D3 built 0.85"],
  ["E", () => {}, cam("E", [1.625, 4.35, 3.4], [1.625, 4.4, 0], 40), "E sarsen knobs under a top stone 0.5 above, holes over knobs"],
  ["E2", () => {}, cam("E2", [1.625, 4.2, 5.2], [1.625, 4.55, 0], 40), "E2 the top stone lifted 1.4 m: holes over the knobs"],
  ["F", () => {}, cam("F", [0.7, 1.7, 1.5], [0, 0.35, 0], 46), "F two top stones end to end, ridge facing groove"],
  ["G", () => {}, cam("G", [0, 1.5, 45], [0, 3.2, 0], 15), "G slope 1.2, long lens: ground falls, ring top level"],
  ["H", () => {}, cam("B", [1.7, 3.5, 3.4], [1.7, 6.7, -6.3], 30), "H today: Stone 56 from its foot, knob against the sky"],
  ["I", () => {}, cam("B", [2.4, 1.5, 0.6], [-1.0, 0.3, -4.3], 55), "I today: the Altar Stone under the fallen 55"],
  ["J", () => {}, cam("J", [6, 5.5, 30], [6, 2.3, 0], 52), "J the single kinds: giantpair, bluestones, altarstone, heelstone, fallensarsen"],
  ["J2", () => {}, cam("J", [-9, 3.2, 17], [-9, 3.4, 0], 44), "J2 giantpair from the front: the slit"],
  ["J3", () => {}, cam("J", [18, 3.4, 15], [17.5, 1.6, 0], 50), "J3 heelstone (leaning 20 deg toward -z) and the fallensarsen in three pieces"],
  ["L", () => {}, cam("L", [0, 2.0, 6.5], [0, 2.1, 0], 40), "L today upright (right) beside a new one (left), from 6 m"],
  ["K", () => c.prop(T, "monA", { built: 1, dusk: 0.85 }, 0), cam("A", [0, 1.6, 70], [0, 3.4, 0], 26), "K dusk 0.85 (a param)"],
  ["M1", () => {}, cam("M1", [0, 1.6, 70], [0, 3.4, 0], 26), "M1 new, sun (26, 12)"],
  ["M2", () => {}, cam("M2", [0, 1.6, 70], [0, 3.4, 0], 26), "M2 new, sun (14, 6.5)"],
  ["M3", () => {}, cam("M3", [0, 1.6, 70], [0, 3.4, 0], 26), "M3 new, sun (0, 0.3): the climax light"],
];
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * 1.0); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "sh-stones", title: "Stonehenge stones bench", idea: "Props bench for the Stonehenge stones (stonehenge, sarsen, toplintel, giantpair, bluestone, altarstone, heelstone, fallensarsen), not a clip",
  frame: "wide", fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "monA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-stones.mjs (props bench, no reviews).",
});
