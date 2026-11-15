// Bench for the Atlantis far layer (engine/page/props-at-far.js, brief T2): one group per camera, WIDE frame (1920 x 1080), far 9000. Not a clip.
// The city is 20 km from its neighbours (a far dome and a city draw only near their own origin), one storyboard per group set so a still never
// draws a city it does not show:  node make-at-far.mjs [A,B,...]   (default: all; writes at-far-<set>.json per light)
//   A  panel 03 aerial at dawn (near 20)        B  panel 07 straight down (near 20)       C  panel 01's background: the harbour quay, 2.5 km out on +z, 1.2 up, looking -z
//   D  panel 20's background, noon, quake 0.6   E  panel 42: midnight storm, sea 1, lightning 1 (Spud in the swell)
//   F  panel 43: rise 0.6 + hull + falls + beam + whirlpool        G  panel 44 low under the hull     H  panel 45 hatchdeck, 2 crew + foreman, Spud in the beam
//   I  panel 46 farring over the night sea
//   node engine/render.mjs <json> --stills <times> --draft --out out/at-far     node qa/contact.mjs out/at-far/*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-far-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "A2", "C2", "D2", "E2", "F2"];
const want = (process.argv[2] || NAMES.join(",")).split(","), on = (g) => want.includes(g);
const GX = { dawn: 0, noon: 20000, night: 40000, hatch: 60000, ring: 80000 };
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

if (on("A") || on("B") || on("C") || on("A2") || on("C2")) {   // dawn
  city("cityA", GX.dawn, "dawn"); sky("A", GX.dawn, "dawn");
  if (on("A")) shot("A", "A panel 03: aerial at dawn", cam([GX.dawn + 250, 2600, 5200], [GX.dawn, 60, -200], 38, 20));
  if (on("B")) shot("B", "B panel 07: straight down", cam([GX.dawn + 1, 5600, 1], [GX.dawn, 0, 0], 38, 20));
  if (on("C")) { spud("spudC", GX.dawn - 146, 2780, 180); shot("C", "C panel 01 background: the harbour quay (top 8 m), 2.5 km out, 1.2 up", cam([GX.dawn - 154, 9.2, 2790], [GX.dawn, 110, 0], 40)); }
  if (on("A2")) shot("A2", "A2 dawn from the sea side, low, whole city", cam([GX.dawn - 300, 220, 7600], [GX.dawn, 80, 0], 34, 5));
  if (on("C2")) shot("C2", "C2 the outer wall from the plain, 3.4 km", cam([GX.dawn + 900, 30, 4900], [GX.dawn, 110, 2300], 40, 2));
}
if (on("D") || on("D2")) {   // noon, quake 0.6
  city("cityD", GX.noon, "noon", { quake: 0.6 }); sky("D", GX.noon, "noon");
  if (on("D")) shot("D", "D panel 20 background: noon, quake 0.6, temple and the red-gold wall", cam([GX.noon + 180, 14, 1375], [GX.noon, 150, 0], 40, 1), (t) => c.prop(t, "cityD", { quake: 0.6 }, 0));
  if (on("D2")) shot("D2", "D2 noon from the outer land ring", cam([GX.noon + 300, 60, 1900], [GX.noon, 100, 500], 40, 1));
}
if (on("E") || on("F") || on("G") || on("E2") || on("F2")) {   // night storm, the lift
  city("cityN", GX.night, "night", { sea: 1 }); sky("N", GX.night, "night");
  props.push({ id: "hullN", kind: "cityhull", x: GX.night, z: 0, light: "night" }, { id: "poolN", kind: "whirlpool", x: GX.night, z: 0, light: "night", amp: 0.7 });
  spud("spudN", GX.night + 400, 5200, 180);
  if (on("E")) shot("E", "E panel 42: midnight storm, sea 1, lightning 1", cam([GX.night + 500, 12, 4300], [GX.night, 70, 2497], 40, 0.5), (t) => { c.prop(t, "cityN", { sea: 1, lightning: 1 }, 0); c.prop(t, "poolN", { calm: 0 }, 0); });
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
