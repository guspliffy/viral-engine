// Bench for the Atlantis near city (engine/page/props-at-city.js; tasks T1 and R1 of ../briefs/): one group per camera, wide frame
// (1920 x 1080), far 9000. Not a clip. Each shot is one beat; the still is 0.55 s in.
// ROUND R, the painted 3D scenes (spec.plate), each from its painter's camera (read from PLATE_SCENES in the props file), Spud where
// the panel put him; the default set of groups:
//   P01 harbourquay plate "01" (harbour at dawn)      P04 harbourquay plate "04" (harbour wall)   P02 citywall plate "02" (red-gold wall)
//   P11 citywall plate "11" (the three walls)         P08 canalcut plate "08" (cut-away)          P09 canalcut plate "09" (+ modern canal)
//   M01, M02, M04: the same scenes from a moved camera (1 to 2 m off the painter's spot), the parallax proof
//   F04 the near quay alone (plate "04", far false) in front of atlantisplate "harbour" (props-at-far.js); N04 the same, camera moved
// On request by name, the spec keys and params of the painted scenes: X01 (night, no ships), X02 (evening, flash 1), X11 (flash 0.5),
// X04 (noon, wet 1, grade off); O01: Spud behind the right bollard of plate 01 (occlusion by the real 3D pieces).
// The first build (no spec.plate), on request by name: A A2 B B2 B3 C C2 D E E2 F F2 G H (see each block).
//   node storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-city.mjs [P01,P02,...]      (no list: the round R groups)
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-city.json --stills <times> --draft --out out/at-city
//   python3 storyboards/series/ancient-aliens/03-atlantis/kit/tools/city-plates.py --vs out/at-city     (painting | still -> bench/at-city-vs.png)
import { readFileSync, writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_DAWN } from "../at-kit.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RKEYS = ["P01", "P04", "F04", "P02", "P11", "P08", "P09", "M01", "M04", "M02", "N04"];
const KEYS = [...RKEYS, "O01", "X01", "X02", "X11", "X04", "A", "A2", "A3", "B", "B2", "B3", "C", "C2", "D", "D2", "E", "E2", "F", "F2", "G", "H", "K0", "K1", "K2"];
const want = (process.argv[2] || RKEYS.join(",")).split(","), on = (...g) => g.some((k) => want.includes(k));
const G = Object.fromEntries(KEYS.map((k, i) => [k, [3000 + i * 12000, 3000 + i * 12000]]));
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const cast = [], props = [];
const SPUD = (id, g, x, z, face, y = 0, extra = {}) => ({ id, character: "potatobrawl/spud", at: at(g, x, z), y, face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const CREW = (id, g, x, z, face, y = 0) => ({ id, character: "ancient-aliens/alien-crew", at: at(g, x, z), y, face, expr: "kind", follow: 0.2, seed: 3.3 });
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const cam = (g, p, l, f = 34) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
// the ring point at along-position s of a ring of radius R whose s = 0 point is (x0, z0): position and the prop's turn
const ring = (x0, z0, R, s) => { const th = s / R; return { x: x0 + R * Math.sin(th), z: z0 - R + R * Math.cos(th), rot: th * 180 / Math.PI }; };
const SHOTS = [];
const shot = (name, cm, label, grp, set) => SHOTS.push({ name, cm, label, grp, set });
const sea = (g, light = "dawn") => props.push(P("sea" + g, "citybenchsea", g, 0, 0, { color: light === "eve" ? "#3d4f5e" : "#2f6fae" }));
const sky = (g, time = "b") => props.push(P("sky" + g, "shsky", g, 0, 0, { time }));
let T = 0;

// ---------------------------------------------------------------- ROUND R: the painted scenes from the painters' cameras
const SCENES = JSON.parse(/\/\*PLATES-JSON-BEGIN\*\/\s*const PLATE_SCENES = ([\s\S]*?);\s*\/\*PLATES-JSON-END\*\//.exec(readFileSync(new URL("../../../../../../engine/page/props-at-city.js", import.meta.url), "utf8"))[1]);
// the painter's camera of a scene as an engine camera: the prop at (0, y0, 0) of group g, scaled sc; row = the plate row in the middle
// of the 16:9 frame, k = the share of the plate's width in frame (1 = all of it), move = an offset of the camera in metres
function plateCam(g, key, { y0 = 0, sc = 1, row = 512, k = 1, col = 768, move = [0, 0, 0] } = {}) {
  const C = SCENES[key].cam, yaw = (C.yaw ?? 0) * Math.PI / 180, dx = (col - 768) / C.f, dy = (C.hy - row) / C.f;
  const d = [dx * Math.cos(yaw) - Math.sin(yaw), dy, -dx * Math.sin(yaw) - Math.cos(yaw)], p = [C.pos[0] * sc + move[0], y0 + C.pos[1] * sc + move[1], C.pos[2] * sc + move[2]];
  return cam(g, p, [p[0] + d[0] * 50, p[1] + d[1] * 50, p[2] + d[2] * 50], r3(2 * Math.atan(432 * k / C.f) * 180 / Math.PI));
}
const VS = [];   // [shot, plate key, middle row, share of the width, middle column]: what city-plates.py --vs puts beside each still
const pshot = (name, key, label, o) => { shot(name, plateCam(name, key, o), label); if (!o.move) VS.push([name, key, o.row ?? 512, o.k ?? 1, o.col ?? 768]); };
if (on("P01", "M01")) for (const g of ["P01", "M01"].filter((k) => on(k))) {
  // the harbour at dawn: the quay top (1.4 over the water) is the floor y 0, so the engine's contact shadows land on it
  props.push(P("quay" + g, "harbourquay", g, 0, 0, { plate: "01", y: -1.4 }));
  cast.push(SPUD("spud" + g, g, 0.15, 1.05, 8, 0));
  if (g === "P01") pshot(g, "01", "P01 plate 01: the harbour at dawn from the painter's camera, Spud on the quay", { y0: -1.4, row: 516 });
  else pshot(g, "01", "M01 plate 01: the camera 1.2 m to the right, 0.4 up, 1.5 m back, looking a little left", { y0: -1.4, row: 500, col: 700, move: [1.2, 0.4, 1.5] });
}
if (on("P04", "M04")) for (const g of ["P04", "M04"].filter((k) => on(k))) {
  props.push(P("quay" + g, "harbourquay", g, 0, 0, { plate: "04", y: -1.2 }));
  cast.push(SPUD("spud" + g, g, 0.35, 0.2, 10, 0));
  if (g === "P04") pshot(g, "04", "P04 plate 04: the harbour wall from the painter's camera, Spud on the quay", { y0: -1.2, row: 540 });
  else pshot(g, "04", "M04 plate 04: the camera 0.8 m to the left, 0.5 up, 1.2 m back", { y0: -1.2, row: 540, move: [-0.8, 0.5, 1.2] });
}
if (on("P02", "M02")) for (const g of ["P02", "M02"].filter((k) => on(k))) {
  props.push(P("wall" + g, "citywall", g, 0, 0, { plate: "02", flash: g === "M02" ? 0.45 : 0 }));
  cast.push(SPUD("spud" + g, g, 8.2, 0.9, 25, 0));
  if (g === "P02") pshot(g, "02", "P02 plate 02: the red-gold wall from the painter's camera, Spud at its foot", { row: 512 });
  else pshot(g, "02", "M02 plate 02: the camera 4 m nearer and lower (panel 02), the flash half way", { row: 560, col: 860, k: 0.9, move: [-2.6, -0.35, -3.4] });
}
if (on("P11")) {
  props.push(P("wallP11", "citywall", "P11", 0, 0, { plate: "11" }));
  pshot("P11", "11", "P11 plate 11: the three walls across the water ring", { row: 512 });
}
if (on("P08")) {
  // the cut-away as a model 1:20 (canal 4.6 m wide), the left quay top the floor y 0: Spud stands on it as in panel 08
  props.push(P("cutP08", "canalcut", "P08", 0, 0, { plate: true, scale: 0.05, y: r3(-8.38 * 0.05) }));
  cast.push(SPUD("spudP08", "P08", r3(-56 * 0.05), r3(-4 * 0.05), 20, 0));
  pshot("P08", "08", "P08 plate 08: the canal cut-away 1:20, Spud on the left quay", { y0: r3(-8.38 * 0.05), sc: 0.05, row: 462, k: 1.185 });
}
if (on("P09")) {
  props.push(P("cutP09", "canalcut", "P09", 0, 0, { plate: true, modern: true, scale: 0.05, y: r3(-3.46 * 0.05) }));
  cast.push(SPUD("spudP09", "P09", r3(40 * 0.05), r3(-4 * 0.05), 0, 0));
  pshot("P09", "09", "P09 plate 09: the ancient and the modern canal 1:20, Spud on the bank between", { y0: r3(-3.46 * 0.05), sc: 0.05, row: 480, k: 1.185 });
}

// the near quay alone (far: false) in front of the far city's own plate projection (props-at-far.js atlantisplate "harbour", camera
// (0, 5, 2603) in city coordinates): the quay top is the floor y 0, so the city sits 3.32 lower and 2598.5 further away
if (on("F04", "N04")) for (const g of ["F04", "N04"].filter((k) => on(k))) {
  props.push(P("far" + g, "atlantisplate", g, 0, -2598.5, { view: "harbour", y: -3.32 }));
  props.push(P("quay" + g, "harbourquay", g, 0, 0, { plate: "04", far: false, y: -1.2 }));
  cast.push(SPUD("spud" + g, g, 0.35, 0.65, 10, 0));
  if (g === "F04") pshot(g, "04f", "F04 plate 04: the near quay (far: false) in front of atlantisplate harbour, its camera tilted down", { y0: -1.2, row: 540 });
  else shot(g, plateCam(g, "04f", { y0: -1.2, row: 540, move: [-0.5, 0.3, 0.6] }), "N04 the same, the camera 0.5 m to the left, 0.3 up, 0.6 m back");
}
if (on("O01")) { props.push(P("quayO01", "harbourquay", "O01", 0, 0, { plate: "01", y: -1.4 })); cast.push(SPUD("spudO01", "O01", 2.45, 0.42, 340, 0)); shot("O01", plateCam("O01", "01", { y0: -1.4, row: 620, col: 1180, k: 0.55 }), "O01 plate 01: Spud behind the bollard block"); }
if (on("X01")) { props.push(P("quayX01", "harbourquay", "X01", 0, 0, { plate: "01", y: -1.4, light: "night", ships: false })); cast.push(SPUD("spudX01", "X01", 0.15, 1.05, 8, 0)); shot("X01", plateCam("X01", "01", { y0: -1.4, row: 516 }), "X01 plate 01: light night, ships false"); }
if (on("X02")) { props.push(P("wallX02", "citywall", "X02", 0, 0, { plate: "02", light: "eve", flash: 1 })); shot("X02", plateCam("X02", "02", { row: 512 }), "X02 plate 02: light eve, flash 1 (every 4th plate hot)"); }
if (on("X11")) { props.push(P("wallX11", "citywall", "X11", 0, 0, { plate: "11", flash: 0.5 })); shot("X11", plateCam("X11", "11", { row: 512 }), "X11 plate 11: flash 0.5 on the red-gold wall"); }
if (on("X04")) { props.push(P("quayX04", "harbourquay", "X04", 0, 0, { plate: "04", y: -1.2, light: "noon", wet: 1, grade: false })); shot("X04", plateCam("X04", "04", { y0: -1.2, row: 540 }), "X04 plate 04: light noon, wet 1, grade false"); }

// =====BLOCK B=====
if (on("B", "B2", "B3")) {
// ---------------------------------------------------------------- B: panel 02, the red-gold wall close (flash 0, 0.5, 1)
for (const [g, fl] of [["B", 0], ["B2", 0.5], ["B3", 1]]) {
  sea(g); sky(g);
  props.push(P("rg" + g, "citywall", g, 0, 0, { ring: "redgold", len: 48, r: 462, flash: fl, light: "dawn", seed: 3 }));
  cast.push(SPUD("spud" + g, g, -3.2, 10.2, 200, 0));
  shot(g, cam(g, [-6, 3.2, 11.5], [5, 10, 0], 55), `${g} panel 02: red-gold wall close, flash ${fl}`);
}


}
// =====END B=====
// =====BLOCK A=====
if (on("A")) {
// ---------------------------------------------------------------- A: panel 01, the harbour at dawn
{
  const g = "A", GX = 80, GZ = -150, R = 2497;
  sea(g); sky(g);
  props.push(P("quay", "harbourquay", g, 0, 0, { gate: true, gateAt: [GX, GZ], people: 10, light: "dawn" }));
  // the brass wall left and right of the gate towers (outer faces at s = +-32), curved on its ring (centre (GX, GZ - R))
  const run = (id, s0, len, towers) => props.push(P(id, "citywall", g, GX, GZ, { ring: "brass", r: R, s0, len, towers, banners: true, light: "dawn", seed: 5 }));
  run("wallL", -232, 200, [-70, -150]); run("wallR", 32, 200, [70, 150]);
  props.push(P("tri1", "trireme", g, 30, -60, { rot: 20, row: 0.6, wake: 1, light: "dawn" }), P("tri2", "trireme", g, 85, -105, { rot: 200, row: 0.6, wake: 1, light: "dawn" }));
  cast.push(SPUD("spudA", g, -1.6, 3.4, 200, 1.2));
  shot("A", cam(g, [0.8, 2.3, 9.0], [50, 9.5, -150], 42), "A panel 01: quay, gate, brass wall, two triremes, Spud on the quay");
}
}
// =====END A=====
// =====BLOCK C=====
if (on("C", "C2")) {
// ---------------------------------------------------------------- C: panel 10, the fitting on the red-gold wall
{
  const g = "C"; sea(g); sky(g);
  props.push(P("rgC", "citywall", g, 0, 0, { ring: "redgold", len: 60, r: 462, flash: 0, light: "dawn", seed: 3 }));
  props.push(P("scafC", "scaffold", g, -1.5, 2.5, { w: 8, decks: 3 }));
  props.push(P("plateC", "platebench", g, 0, 0, {}));
  cast.push(CREW("crewC1", g, -2.4, 4.0, 180, 4.0), CREW("crewC2", g, 1.2, 4.0, 180, 4.0), SPUD("spudC", g, 4.4, 4.3, 160, 0));
  shot("C", cam(g, [4.5, 6.0, 13], [-1.2, 5.0, 2.5], 50), "C panel 10: scaffold on the red-gold wall, two crew, Spud beside the three-colour stone");
  shot("C2", cam(g, [9, 3.4, 9.6], [-2.5, 4.2, 2.8], 46), "C2 panel 10 wide: the scaffold, the plates, the stone");
}
}
// =====END C=====
// =====BLOCK D=====
if (on("D")) {
// ---------------------------------------------------------------- D: panel 11, the three walls from outside in
{
  const g = "D"; sea(g); sky(g);
  props.push(P("brD", "citywall", g, 0, 0, { ring: "brass", len: 420, r: 2497, towers: [-210, -60, 90, 240], banners: true, light: "dawn", seed: 2 }));
  props.push(P("tinD", "citywall", g, 0, -555, { ring: "tin", len: 520, r: 1942, towers: [-240, -90, 60, 210], banners: true, light: "dawn", seed: 4 }));
  props.push(P("rgD", "citywall", g, 0, -2035, { ring: "redgold", len: 700, r: 462, flash: 1, light: "dawn", seed: 6 }));
  cast.push(SPUD("spudD", g, 0, 40, 0, 0));
  shot("D", cam(g, [30, 30, 120], [0, 5, -600], 24), "D panel 11: the brass, tin and red-gold walls, outside in");
}
}
// =====END D=====
// =====BLOCK E=====
if (on("E", "E2")) {
// ---------------------------------------------------------------- E: panels 08 and 09, the canal cut-away
{
  sky("E");
  props.push(P("canE", "canalcut", "E", 0, 0, { light: "dawn" }));
  shot("E", cam("E", [-6, 14, 92], [6, -14, 0], 46), "E panel 08: the canal cut-away, trireme, quay, gate tower, metre staff");
  sky("E2");
  props.push(P("canE2", "canalcut", "E2", 0, 0, { light: "dawn", modern: true }));
  shot("E2", cam("E2", [120, 20, 190], [150, -14, 0], 58), "E2 panel 09: the ancient and the modern canal, the container ship");
}
}
// =====END E=====
// =====BLOCK F=====
if (on("F", "F2")) {
// ---------------------------------------------------------------- F: panels 19-20, the bridge, the falling column
{
  for (const [g, fall, spl] of [["F", 0, 0], ["F2", 0.6, 0.6]]) {
    sea(g, "noon"); sky(g, "a");
    props.push(P("deck" + g, "bridgedeck", g, 0, 0, { len: 90, light: "noon" }));
    props.push(P("col" + g, "column", g, -9, -6, { y: 4, dir: 270, fall, splash: spl, light: "noon" }));
    cast.push(SPUD("spud" + g, g, 4.5, 24, 160, 4), CREW("crew" + g, g, 8.5, 22, 150, 4));
    shot(g, cam(g, [6, 5.8, 38], [-16, 8.5, -22], 50), `${g} panels 19-20: the bridge deck, column fall ${fall}${spl ? " with the splash" : ""}`);
  }
}
}
// ---------------------------------------------------------------- K0, K1, K2: the column alone through block B's long lens (fov 16, the column
// 60 % of the frame's height, falling dir 308 into the canal at noon): standing, mid-fall, down with the splash. Sheet: city-plates.py --column
for (const [g, fall, spl] of [["K0", 0, 0], ["K1", 0.72, 0], ["K2", 1, 0.8]]) if (on(g)) {
  sea(g, "noon"); sky(g, "a");
  props.push(P("quay" + g, "harbourquay", g, 0, 0, { rot: 180, light: "noon", gate: false }));
  props.push(P("col" + g, "column", g, 0.65, 60, { y: 1.2, dir: 308, fall, splash: spl, light: "noon", water: -1.2, ground: 0.1 }));   // ground: this quay's kerb is 0.1 over its top
  shot(g, cam(g, [-85, 6.5, 60], [0.65, 7.6, 60], 16), `${g} the column, long lens: fall ${fall}${spl ? ", splash " + spl : ""}`);
}
// =====END F=====
// =====BLOCK G=====
if (on("G")) {
// ---------------------------------------------------------------- G: panel 29, the edge road in the evening
{
  const g = "G"; sea(g, "eve"); sky(g, "c");
  props.push(P("roadG", "edgeroad", g, 0, 0, { y: 1, len: 36, water: 0.6, light: "eve", wet: 0.6 }));
  props.push(P("wallG", "citywall", g, 0, -60, { ring: "brass", len: 160, r: 2497, towers: [-60, 50], banners: true, light: "eve", wet: 0.6, seed: 8 }));
  cast.push(SPUD("spudG", g, -0.8, -3.5, 40, 1), CREW("crewG1", g, 0.2, -8.5, 20, 1), CREW("crewG2", g, -0.3, -11, 20, 1), CREW("crewG3", g, 0.2, -13.5, 20, 1));
  shot("G", cam(g, [-4.6, 2.6, 5.5], [3, 2.8, -18], 42), "G panel 29: the edge road, water 0.6, evening light, the brass wall behind");
}
}
// =====END G=====
// =====BLOCK H=====
if (on("H")) {
// ---------------------------------------------------------------- H: panel 17, the plates on the wall-walk (a red-gold walk, y 16)
{
  const g = "H"; sky(g, "a");
  props.push(P("wallH", "citywall", g, 0, 0, { ring: "redgold", len: 60, r: 462, light: "noon", seed: 7, apron: false }));
  props.push(P("benchH", "platebench", g, 0, 0, { y: 16, polish: 0.55, n: 3 }));
  props.push(P("clothH", "polishcloth", g, 3.2, 0.4, { y: 16.1 }));
  cast.push(SPUD("spudH", g, -1.2, 1.2, 120, 16), CREW("crewH", g, 4.6, 0.2, 250, 16));
  shot("H", cam(g, [-9.5, 17.6, 1.2], [1.0, 16.2, -0.2], 38), "H panel 17: red-gold plates on battens on the wall-walk, polish 0.55, the cloth");
}
}
// =====END H=====
SHOTS.sort((a, b) => KEYS.indexOf(a.name) - KEYS.indexOf(b.name));
SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); if (s.set) s.set(s.T); if (!RKEYS.includes(s.name)) c.cap(s.T, s.T + 0.9, s.label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s.name).join(","));
const all = RKEYS.every((k) => want.includes(k)) && want.length === RKEYS.length, ID = all ? "at-city" : "at-city-" + want.join("-");
// what city-plates.py --vs lays out: each painter's-camera still beside its painting, then the moved-camera stills
writeFileSync(new URL(`./${ID}-vs.json`, import.meta.url), JSON.stringify({ id: ID, vs: VS.map((v) => [...v, r3(SHOTS.find((s) => s.name === v[0]).T + 0.55)]), moved: SHOTS.filter((s) => "MN".includes(s.name[0])).map((s) => [s.name, r3(s.T + 0.55), s.label]) }) + "\n");
write(import.meta.url, {
  id: ID, title: "Atlantis near-city bench", idea: "Props bench for the Atlantis near city kit (T1, R1), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 9000,
  set: { ...AT_DAWN }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map((s) => [s.name, s.T, s.cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-city.mjs (props bench, no reviews).",
});
