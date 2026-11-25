// Furniture bench for Kid vs Dad 04 (DESIGN.md sections 1, 2, 7; task T1, engine/page/props-eatery.js). Not a clip.
// Set plain, look anime-pro, castLook sheet, no music, no captions. One still a second (0.5 ... 18.5); the groups stand far apart
// in x so each camera sees only its own group:
//   x -8   `roundtable` bare, from y 1.0, 0.44 and 0.20            x -14  `roundtable` dressed ([0.28, 0.12]), wide and close
//   x 0    the main ensemble on its section 9 marks: dressed table, dad (0.80, -0.26) and Tato (-0.12, -0.74) seated on `hoopchair`s
//   x 20   the cheat table of panel 13 ({ r 0.80, h 1.30, drape 0.68, legs false }) from camera 13, dad standing under it, Tato on the floor
//   x -20  a `hoopchair` alone (3/4 front, side, back)             x 30 dad and x 34 Tato seated on the hoop, side + oblique
//   x 40   `dinecarpet` from above and close, at `dim` 0 then 1
//   node storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-eatery.mjs
//   node engine/render.mjs storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-eatery.json --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,17.5,18.5 --draft --safe
//   node qa/contact.mjs out/bench-eatery-*.png --out out/bench-eatery-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const cam = (pos, look, fov = 40) => ({ pos, look, fov });
const cast = [
  { id: "dad", character: "potatobrawl/dad", at: [0.80, -0.26], face: -40, expr: "kind", follow: 0, seed: 1.1 },
  { id: "tato", character: "potatobrawl/spud-kid", at: [-0.12, -0.74], face: 9, expr: "kind", follow: 0, seed: 2.9 },
  { id: "dadc", character: "potatobrawl/dad", at: [20.77, -0.05], face: -20, expr: "kind", follow: 0, seed: 1.2 },   // panel 13: standing under the cheat top
  { id: "tatoc", character: "potatobrawl/spud-kid", at: [19.90, 0.05], face: 0, expr: "kind", follow: 0, seed: 2.8 },   // panel 13: on the floor
  { id: "dads", character: "potatobrawl/dad", at: [30, 0.18], face: 0, expr: "kind", follow: 0, seed: 1.3 },
  { id: "tatos", character: "potatobrawl/spud-kid", at: [34, 0.02], face: 0, expr: "kind", follow: 0, seed: 2.7 },
];
const table = (id, x, z, o = {}) => ({ id, kind: "roundtable", x, y: 0, z, rot: 0, ...o });
const chair = (id, x, z, rot = 0) => ({ id, kind: "hoopchair", x, y: 0, z, rot });
const props = [
  table("t0", -8, 0),
  table("t1", -14, 0, { dress: [0.28, 0.12] }),
  table("main", 0, 0, { dress: [0.28, 0.12] }),
  chair("cd", 0.92, -0.40, -40), chair("ct", -0.12, -0.76, 9),
  table("cheat", 20, 0, { r: 0.80, h: 1.30, drape: 0.68, legs: false }),
  chair("ca", -20, 0),
  chair("cs", 30, 0), chair("ctt", 34, 0),
  { id: "carpet", kind: "dinecarpet", x: 40, y: 0, z: 0, dim: 0 },
];
// seated: no seat id (the body stays on its mark, DESIGN section 9), the seat top 0.24; feet from the Dad bench (still 12.5)
const FEET = [0.34, 0.06];
c.A(0, "dad", "sit", { rot: -40, height: 0.24, dur: 0, feet: FEET, hands: "lap" });
c.A(0, "tato", "sit", { rot: 9, height: 0.24, dur: 0, hands: "lap" });
c.A(0, "tatoc", "sit", { rot: 0, height: 0.01, dur: 0, hands: "keep" });
c.A(0, "dads", "sit", { rot: 0, height: 0.24, dur: 0, feet: FEET, hands: "lap" });
c.A(0, "tatos", "sit", { rot: 0, height: 0.24, dur: 0, hands: "lap" });
c.prop(14.9, "carpet", { dim: 1 }, 0);

const SH = [
  ["table from y 1.0", cam([-8, 1.0, 2.4], [-8, 0.25, 0])],
  ["table from y 0.44", cam([-8, 0.44, 2.4], [-8, 0.3, 0])],
  ["table from y 0.20", cam([-8, 0.20, 2.4], [-8, 0.28, 0])],
  ["dressed table, y 1.0", cam([-14, 1.0, 2.0], [-14, 0.3, 0])],
  ["dress close: vase, flowers, shakers", cam([-13.55, 0.62, 0.95], [-13.72, 0.47, 0.12], 28)],
  ["cheat table, camera 13", cam([20.15, 0.30, 2.5], [20.15, 0.25, 0], 44)],
  ["cheat table from y 1.2", cam([20.15, 1.2, 3.0], [20.1, 0.6, 0], 44)],
  ["chair alone, 3/4 front", cam([-19.3, 0.55, 1.3], [-20, 0.28, 0], 40)],
  ["chair alone, side", cam([-18.6, 0.35, 0], [-20, 0.3, 0], 40)],
  ["chair alone, back", cam([-20.3, 0.5, -1.4], [-20, 0.3, 0], 40)],
  ["dad seated, side", cam([32.4, 0.55, 0.18], [30, 0.5, 0.0], 36)],
  ["Tato seated, side", cam([35.9, 0.4, 0.0], [34, 0.4, 0.0], 36)],
  ["dad seated, back oblique", cam([31.2, 0.7, -1.6], [30, 0.5, 0.0], 36)],
  ["ensemble, camera 01", cam([-0.1, 1.15, 4.7], [-0.1, 0.72, -0.4], 45)],
  ["ensemble, camera 03", cam([1.0, 0.95, 1.6], [-0.12, 0.56, -0.74], 30)],
  ["carpet overview, dim 0", cam([40, 5.0, 5.5], [40, 0, 0.3], 45)],
  ["carpet close, dim 0", cam([40, 0.55, 3.0], [40, 0, 0.6], 35)],
  ["carpet overview, dim 1", cam([40, 5.0, 5.5], [40, 0, 0.3], 45)],
  ["carpet close, dim 1", cam([40, 0.55, 3.0], [40, 0, 0.6], 35)],
];
const beats = c.beats(SH.map(([label, k], i) => [`s${i}`, i, k, `${i}.5 ${label}`]), SH.length);

write(import.meta.url, {
  id: "bench-eatery", title: "Furniture bench", idea: "Furniture bench for Kid vs Dad 04 (DESIGN.md T1), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#efe2c8", floor: "#c9b08c", light: "golden", para: 0, aperture: 0, lighting: 2, shade: "soft" },
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-eatery.mjs (T1 furniture bench, no reviews).",
});
