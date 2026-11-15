// Bench for the city-ship kinds (engine/page/props-at-d-ship.js, brief D3): one still per camera, WIDE frame (1920 x 1080), far 9000, AT_NIGHT light. Not a clip.
// The city is at x 40000 (its own place), panel 46's night sea at x 80000, so a still never draws what it does not show.
//   A   panel 42: Spud's head in the storm swell 450 m off the brass wall on +z, rise 0, lightning 0.3     A2  the same at lightning 1
//   B   panel 43: the whole disc rising (rise 0.6), falls, beam, whirlpool, lightning 0.3                   B2  the same at lightning 1
//   C   panel 44: low on the water near the beam, looking up at the hull (rise 0.6)                          C2  the same at lightning 1
//   D   panel 46: Spud in the sea, the far ring upper middle, stars, Milky Way (shrink 0)                    D2  shrink 0.8, the sea calming
//   node storyboards/series/ancient-aliens/03-atlantis/block-d/bench/make-at-ship.mjs [A,B,...]
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-d/bench/at-ship-<names>.json --stills <times> --draft --out out/at-ship
//   node qa/contact.mjs out/at-ship/*.png --out storyboards/series/ancient-aliens/03-atlantis/block-d/bench/at-ship-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_NIGHT } from "../../kit/at-kit.mjs";

const NAMES = ["A", "A2", "B", "B2", "B3", "C", "C2", "C3", "D", "D2"];
const want = (process.argv[2] || NAMES.join(",")).split(","), on = (g) => want.includes(g);
const GX = 40000, GR = 80000;
const pol = (r, deg, y = 0) => [r3(GX + r * Math.sin(deg * Math.PI / 180)), y, r3(r * Math.cos(deg * Math.PI / 180))];   // x, y, z at radius r, deg from +z toward +x   // the city place, the night-sea place of panel 46
const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const cast = [], props = [], SHOTS = [];
const cam = (p, l, f = 40, near) => ({ pos: p.map(r3), look: l.map(r3), fov: f, ...(near && { near }) });
const spud = (id, x, y, z, face = 0) => cast.push({ id, character: "potatobrawl/spud", at: [r3(x), r3(z)], y, face, expr: "kind", follow: 0.2, seed: 2.1 });
let T = 0;
const shot = (name, label, camera, set) => { T = r3(0.1 + SHOTS.length * 1.0); SHOTS.push([name, T, camera, label]); if (set) set(T); };
const seed = (t, ids, o) => ids.forEach((id) => c.prop(t, id, o, 0));

const needCity = ["A", "A2", "B", "B2", "B3", "C", "C2", "C3"].some(on), needRing = on("D") || on("D2");
if (needCity) {
  props.push({ id: "city", kind: "atlantis", x: GX, z: 0, light: "night", sea: 1, flood: false, mountains: false });
  props.push({ id: "hull", kind: "shiphull", x: GX, z: 0 }, { id: "sea", kind: "shipsea", x: GX, z: 0, calmAt: [pol(2950, 38)[0] - GX, pol(2950, 38)[2], 16] }, { id: "storm", kind: "shipstorm", x: GX, z: 0 });
  props.push({ id: "whirl", kind: "shipwhirl", x: GX, z: 0 });
  { const [sx, , sz] = pol(2950, 38); spud("spudA", sx, -0.5, sz, 218); }
  const lg = (t, v, rise, extra = {}) => { seed(t, ["sea", "storm", "hull", "whirl"], { lightning: v }); seed(t, ["city", "hull"], { rise }); c.prop(t, "hull", extra, 0); };
  if (on("A")) shot("A", "A panel 42: Spud in the swell, the city across the frame, lightning 0.3", cam(pol(2962, 38.2, 2.1), pol(2497, 33, 52), 50, 0.3), (t) => lg(t, 0.3, 0, { falls: 0.3 }));
  if (on("A2")) shot("A2", "A2 the same at lightning 1", cam(pol(2962, 38.2, 2.1), pol(2497, 33, 52), 50, 0.3), (t) => lg(t, 1, 0, { falls: 0.3 }));
  if (on("B")) shot("B", "B panel 43: rise 0.6, falls, beam, whirlpool, lightning 0.3", cam([GX + 200, 900, 6500], [GX, 520, 0], 38, 5), (t) => lg(t, 0.3, 0.6, { falls: 1, beam: 1, lit: 0.9 }));
  if (on("B2")) shot("B2", "B2 the same at lightning 1", cam([GX + 200, 900, 6500], [GX, 520, 0], 38, 5), (t) => lg(t, 1, 0.6, { falls: 1, beam: 1, lit: 0.9 }));
  if (on("B3")) shot("B3", "B3 close on the rim: hull panels, stripe, weed, falls (rise 0.6)", cam([GX + 700, 300, 4300], [GX + 300, 640, 2500], 45, 3), (t) => lg(t, 0.3, 0.6, { falls: 1, beam: 1, lit: 0.9 }));
  if (on("C")) shot("C", "C panel 44: low on the water, looking up at the hull, lightning 0.3", cam([GX - 150, 8, 700], [GX + 400, 235, -900], 60, 1), (t) => lg(t, 0.3, 0.6, { falls: 0.8, beam: 1, lit: 1 }));
  if (on("C3")) shot("C3", "C3 close under a lens", cam([GX + 150, 12, -800], [GX + 195, 231, -1107], 60, 1), (t) => lg(t, 0.3, 0.6, { falls: 0.8, beam: 1, lit: 1 }));
  if (on("C2")) shot("C2", "C2 the same at lightning 1", cam([GX - 150, 8, 700], [GX + 400, 235, -900], 60, 1), (t) => lg(t, 1, 0.6, { falls: 0.8, beam: 1, lit: 1 }));
}
if (needRing) {
  props.push({ id: "skyD", kind: "shipstars", x: GR, z: 0 }, { id: "seaD", kind: "shipsea", x: GR, z: 0, grade: "night", whirl: false, stars: 1, calmAt: [22, -4042, 24] });
  props.push({ id: "ringD", kind: "shipring", x: GR, z: -9000, y: 1500 });
  spud("spudD", GR + 22, -0.5, -4042, 0);
  if (on("D")) shot("D", "D panel 46: Spud in the sea, the far ring upper middle (shrink 0)", cam([GR + 24, 1.1, -4030], [GR, 640, -9000], 32, 0.3), (t) => { seed(t, ["ringD"], { shrink: 0 }); seed(t, ["seaD"], { calm: 0.4 }); });
  if (on("D2")) shot("D2", "D2 shrink 0.8, the sea calming", cam([GR + 24, 1.1, -4030], [GR, 640, -9000], 32, 0.3), (t) => { seed(t, ["ringD"], { shrink: 0.8 }); seed(t, ["seaD"], { calm: 1 }); });
}
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
SHOTS.forEach(([n, t, , label]) => c.cap(t, t + 0.9, label, 1030, false, { kinetic: false, size: 28 }));
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
write(import.meta.url, {
  id: `at-ship-${want.join("-")}`, title: "Atlantis city-ship bench", idea: "Props bench for block D task D3 (shiphull, shipsea, shipwhirl, shipstorm, shipstars, shipring), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 9000,
  set: AT_NIGHT, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id ?? "x"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm, l]) => [n, t, cm, l]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-d/bench/make-at-ship.mjs (props bench, no reviews).",
});
