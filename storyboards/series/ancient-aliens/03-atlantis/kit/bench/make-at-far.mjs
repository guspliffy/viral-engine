// Bench for the Atlantis far layer (engine/page/props-at-far.js, brief T2): one group per camera, WIDE frame (1920 x 1080), far 9000. Not a clip.
// The city is 20 km from its neighbours (a far dome and a city draw only near their own origin), one storyboard per group set so a still never
// draws a city it does not show:  node make-at-far.mjs [A,B,...]   (default: all; writes at-far-<set>.json per light)
//   A  plate 03 PROJECTED onto the city, from the plate's camera (the R2 target)   A8 the same 8 deg round (parallax)   A3 the drawn city, no plate
//   Q  plate 04 projected (atlantisplate harbour), Spud on the quay side   Q2 pushed in   W  plate 11 projected (atlantisplate walls)   W2 pushed in
//   Q3 the drawn far city from quay height (climb 1)   B  panel 07 straight down
//   D  panel 20's background, noon, quake 0.6   E  panel 42: midnight storm, sea 1, lightning 1 (Spud in the swell)
//   F  panel 43: rise 0.6 + hull + falls + beam + whirlpool        G  panel 44 low under the hull     H  panel 45 hatchdeck, 2 crew + foreman, Spud in the beam
//   I  panel 46 farring over the night sea
//   node engine/render.mjs <json> --stills <times> --draft --out out/at-far     node qa/contact.mjs out/at-far/*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-far-sheet.png
//   python3 make-at-far-vs.py   -> at-far-vs.png (plate left, bench still right: plate 03 | A, plate 04 | Q, plate 11 | W)
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const NAMES = ["A", "Q", "W", "A8", "Q2", "W2", "A3", "Q3", "B", "D", "E", "F", "G", "H", "I", "A2", "D2", "E2", "F2"];
const want = (process.argv[2] || NAMES.join(",")).split(","), on = (g) => want.includes(g);
const GX = { dawn: 0, noon: 20000, night: 40000, hatch: 60000, ring: 80000, quay: 100000, walls: 120000, dawn3: 140000, quay3: 160000 };
const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const cast = [], props = [], SHOTS = [];
const cam = (p, l, f = 32, near) => ({ pos: p.map(r3), look: l.map(r3), fov: f, ...(near && { near }) });
const spud = (id, x, z, face = 0) => cast.push({ id, character: "potatobrawl/spud", at: [x, z], face, expr: "kind", follow: 0.2, seed: 2.1 });
let T = 0;
const shot = (name, label, camera, set) => { T = r3(0.1 + SHOTS.length * 1.0); SHOTS.push([name, T, camera, label]); if (set) set(T); };
const city = (id, gx, light, extra = {}) => props.push({ id, kind: "atlantis", x: gx, z: 0, light, ...extra });
const sky = (id, gx, light, extra = {}) => props.push({ id: `sky-${id}`, kind: "citysky", x: gx, z: 0, light, ...extra });

if (on("A") || on("A8")) {   // dawn aerial, R2: plate 03 projected onto the city from its own camera (A), the same from 8 deg round (A8: parallax)
  city("cityA", GX.dawn, "dawn", { proj: "plate03" }); sky("A", GX.dawn, "dawn");
  if (on("A")) shot("A", "A plate 03 projected: the plate's camera", cam([GX.dawn, 1200, 3640], [GX.dawn, -537, 37], 51.5, 20));
  if (on("A8")) shot("A8", "A8 the same, 8 deg round and pushed in", cam([GX.dawn + 480, 1150, 3420], [GX.dawn + 5, -537, 36], 51.5, 20));
}
if (on("A3") || on("B") || on("A2")) {   // dawn, the drawn 3D city without a plate (any camera): plate 03's camera, straight down (panel 07), low from the sea
  city("cityA3", GX.dawn3, "dawn"); sky("A3", GX.dawn3, "dawn");
  if (on("A3")) shot("A3", "A3 the drawn city, no plate", cam([GX.dawn3, 1200, 3640], [GX.dawn3, -465, 3], 51.5, 20));
  if (on("B")) shot("B", "B panel 07: straight down", cam([GX.dawn3 + 1, 5600, 1], [GX.dawn3, 0, 0], 38, 20));
  if (on("A2")) shot("A2", "A2 dawn from the sea side, low, whole city", cam([GX.dawn3 - 300, 420, 7600], [GX.dawn3, 200, 0], 34, 5));
}
if (on("Q") || on("Q2")) {   // plate 04 from the quay: atlantisplate view harbour (water, brass wall and towers, town, hill and temple, sky at their depths)
  props.push({ id: "plateQ", kind: "atlantisplate", x: GX.quay, z: 0, view: "harbour" }); sky("Q", GX.quay, "dawn");
  spud("spudQ", GX.quay - 6.3, 2587, 200);
  if (on("Q")) shot("Q", "Q plate 04 projected: quay height toward the city", cam([GX.quay, 5, 2603], [GX.quay, 5, 0], 40, 0.3));
  if (on("Q2")) shot("Q2", "Q2 the same, 3 m right and 8 m in (parallax)", cam([GX.quay + 3, 4.8, 2595], [GX.quay + 3, 4.8, 0], 40, 0.3));
}
if (on("W") || on("W2")) {   // plate 11: atlantisplate view walls (the water ring, the brass wall, the tin tier, the red tier and temple, sky)
  props.push({ id: "plateW", kind: "atlantisplate", x: GX.walls, z: 0, view: "walls" }); sky("W", GX.walls, "dawn");
  if (on("W")) shot("W", "W plate 11 projected: the three walls over the water", cam([GX.walls, 5.15, 2565], [GX.walls, 197.15, 1565], 40, 0.3));
  if (on("W2")) shot("W2", "W2 the same, 4 m left and 8 m in (parallax)", cam([GX.walls - 4, 5.15, 2557], [GX.walls - 4, 197.15, 1557], 40, 0.3));
}
if (on("Q3")) {   // the drawn far city from quay height (no plate): climb 1, no far brass wall or ships
  city("cityQ3", GX.quay3, "dawn", { climb: 1, brass: false, ships: false, skip: [[0, 2770, 330]] }); sky("Q3", GX.quay3, "dawn");
  spud("spudQ3", GX.quay3 - 2.2, 2794, 200);
  shot("Q3", "Q3 the drawn far city from quay height (climb 1, brass false, ships false)", cam([GX.quay3 + 1.2, 1.1, 2801], [GX.quay3 - 40, 520, 0], 44, 0.3));
}
if (on("D") || on("D2")) {   // noon, quake 0.6
  city("cityD", GX.noon, "noon", { quake: 0.6 }); sky("D", GX.noon, "noon");
  if (on("D")) shot("D", "D panel 20 background: noon, quake 0.6, temple and the red-gold wall", cam([GX.noon + 260, 190, 1420], [GX.noon, 330, 0], 44, 1), (t) => c.prop(t, "cityD", { quake: 0.6 }, 0));
  if (on("D2")) shot("D2", "D2 noon from the outer land ring", cam([GX.noon + 300, 60, 1900], [GX.noon, 100, 500], 40, 1));
}
if (on("E") || on("F") || on("G") || on("E2") || on("F2")) {   // night storm, the lift
  city("cityN", GX.night, "night", { sea: 1 }); sky("N", GX.night, "night");
  props.push({ id: "hullN", kind: "cityhull", x: GX.night, z: 0, light: "night" }, { id: "poolN", kind: "whirlpool", x: GX.night, z: 0, light: "night", amp: 0.7 });
  spud("spudN", GX.night + 400, 5200, 180);
  if (on("E")) shot("E", "E panel 42: midnight storm, sea 1, lightning 1", cam([GX.night + 500, 12, 4300], [GX.night, 150, 2497], 40, 0.5), (t) => { c.prop(t, "cityN", { sea: 1, lightning: 1 }, 0); c.prop(t, "poolN", { calm: 0 }, 0); });
  if (on("E2")) shot("E2", "E2 the same, lightning 0 (the storm dark)", cam([GX.night + 500, 12, 4300], [GX.night, 70, 2497], 40, 0.5), (t) => c.prop(t, "cityN", { sea: 1, lightning: 0 }, 0));
  if (on("F")) shot("F", "F panel 43: rise 0.6, hull, falls, beam, whirlpool", cam([GX.night + 200, 380, 7800], [GX.night, 560, 0], 36, 5), (t) => { for (const id of ["cityN", "hullN"]) c.prop(t, id, { rise: 0.6 }, 0); c.prop(t, "hullN", { falls: 1, beam: 1, lit: 0.9 }, 0); c.prop(t, "cityN", { sea: 1, lightning: 0.3 }, 0); c.prop(t, "poolN", { spin: 0.5, calm: 0 }, 0); });
  if (on("F2")) shot("F2", "F2 rise 1: the full lift from above", cam([GX.night + 1500, 2200, 7200], [GX.night, 700, 0], 38, 20), (t) => { for (const id of ["cityN", "hullN"]) c.prop(t, id, { rise: 1 }, 0); c.prop(t, "hullN", { falls: 0.6, beam: 1, lit: 0.9 }, 0); c.prop(t, "cityN", { sea: 1 }, 0); });
  if (on("G")) shot("G", "G panel 44: low under the hull", cam([GX.night + 300, 12, 3500], [GX.night, 420, 1700], 48, 1), (t) => { for (const id of ["cityN", "hullN"]) c.prop(t, id, { rise: 0.6 }, 0); c.prop(t, "hullN", { falls: 0.7, beam: 1, lit: 1 }, 0); c.prop(t, "cityN", { sea: 1 }, 0); c.prop(t, "poolN", { spin: 0.5, calm: 0 }, 0); });
}
if (on("H")) {   // hatchdeck
  props.push({ id: "hatch", kind: "hatchdeck", x: GX.hatch, z: 0 });
  cast.push({ id: "crew1", character: "ancient-aliens/alien-crew", at: [GX.hatch + 4.3, -2.9], face: 292, expr: "kind", follow: 0.2, seed: 3 }, { id: "crew2", character: "ancient-aliens/alien-crew", at: [GX.hatch + 5.05, -1.3], face: 280, expr: "kind", follow: 0.2, seed: 4 }, { id: "foreman", character: "ancient-aliens/alien-foreman", at: [GX.hatch + 5.15, 0.75], face: 266, expr: "kind", follow: 0.2, seed: 5 });
  spud("spudH", GX.hatch + 6.2, 3.4, 250);
  shot("H", "H panel 45: hatchdeck from the beam, 2 crew + foreman, Spud in the beam", cam([GX.hatch - 4.2, -6.6, 3.0], [GX.hatch + 4.6, 1.2, -0.8], 66, 0.3));
}
if (on("I")) {   // farring over the night sea
  city("cityI", GX.ring, "night", { sea: 1, mountains: false }); sky("I", GX.ring, "night", { clouds: 0.2 }); props.push({ id: "ringI", kind: "farring", x: GX.ring, z: -9000, y: 1400, shrink: 0 });
  spud("spudI", GX.ring + 21, -4042, 180);
  shot("I", "I panel 46: farring over the night sea", cam([GX.ring + 25, 4, -4020], [GX.ring, 600, -9000], 32, 0.3), (t) => c.prop(t, "ringI", { shrink: 0 }, 0));
}
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
SHOTS.forEach(([n, t, , label]) => c.cap(t, t + 0.9, label, 1030, false, { kinetic: false, size: 28 }));
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
const tag = want.join("-");
write(import.meta.url, {
  id: `at-far-${tag}`, title: "Atlantis far layer bench", idea: "Props bench for the Atlantis kit T2 (atlantis, cityhull, whirlpool, hatchdeck, farring, citysky), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 9000,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id ?? "x"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm, l]) => [n, t, cm, l]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-far.mjs (props bench, no reviews).",
});
