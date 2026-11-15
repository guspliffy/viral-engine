// Bench for the Atlantis sea kit (engine/page/props-at-sea.js, tasks T3 and R3 of ../briefs/): one group per camera, 4000 m apart on x (a sea draws only within
// its spec.reach of its own x,z; the horizon cards stand 1300 m out). Wide frame, far 1500 as BOARD section 1. Not a clip; each shot is one beat of 2.6 s (one surf
// period), the still is 0.55 s in.
//   A  plate 05: Spud on the seastack from the painting's camera, grade gibraltar, AT_DAWN sun (35, 8), the painted horizon (sun 13 %, the Rock 66 % of the width), gulls
//   B  panel 06: the scroll open on the dry flat patch (seastack wet 0), Spud beside it
//   C  panel 12: the rock from higher up, the dark green water with weed beside it (sea spec.patches)
//   D  panels 31 + 33: marblestep + ruler, grade step, the island coast      D2 panel 33 (Spud sits against the back block, close on the ruler)
//   E  panel 41: night sea, starfield, only Spud's head (camera 0.3 above the water)
//   F  the harbour grade (plate 01's water), a hole r 30 and a 60 m wall mirrored (proves hole + mirrors)      F2 the hole from above
//   python3 storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-sea-crops.py      (only when plate 05 changes: rebuilds assets/props/atlantis/sea-*.webp)
//   node storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-sea.mjs [A,B,...]
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-sea.json --stills <times the generator prints> --draft --out out/at-sea
//   node qa/contact.mjs out/at-sea/at-sea-*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-sea-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const NAMES = ["A", "B", "C", "D", "D2", "E", "F", "F2"], want = (process.argv[2] || NAMES.join(",")).split(",");
const GX = Object.fromEntries(NAMES.map((n, i) => [n, (i + 1) * 4000]));
const on = (g) => want.includes(g);
const cast = [], props = [];
const spud = (g, x, z, face = 0, y) => cast.push({ id: `spud${g}`, character: "potatobrawl/spud", at: [GX[g] + x, z], ...(y != null && { y }), face, expr: "kind", follow: 0.2, seed: 2.1 });
const P = (g, id, kind, extra = {}) => props.push({ id: id + g, kind, x: GX[g], z: 0, ...extra });
const cam = (g, p, l, f = 28) => ({ pos: [r3(GX[g] + p[0]), r3(p[1]), r3(p[2])], look: [r3(GX[g] + l[0]), r3(l[1]), r3(l[2])], fov: f });
const SHOTS = [];   // [name, camera, label]
const sky = (g, time, sun) => P(g, "sky", "shsky", { time, sunAz: sun[0], sunEl: sun[1], reach: 1600 });

// the sea round Spud's rock: laid down a little at the rock, the wash round it, the surf's foam on its right in step with the rock's surfEvery 2.5
const ROCKSEA = { grade: "gibraltar", sunAz: 35, sunEl: 8, horizon: true, reach: 1700, calm: [0, 0, 3.0, 0.7], foam: [[0, 0, 2.2, 0.8], [1.9, 0.2, 1.7, 1, 2.5, 0.92], [-1.5, 0.7, 1.2, 0.7, 2.5, 0.3]] };
if (on("A")) {   // plate 05: the camera 3.6 m off the patch, 0.95 above it, turned 9 deg left so the painted sun stands at 13 % and the Rock at 66 % of the width
  sky("A", "a", [35, 8]);
  P("A", "sea", "sea", ROCKSEA);
  P("A", "land", "horizonland", { coast: "gibraltar" });
  P("A", "rock", "seastack", { shade: [0.1, 0.15, 0.4] });
  P("A", "gulls", "seagulls", { n: 3, centre: [9, 7.2, -22], r: 8 });
  spud("A", 0.1, 0.15, 0, 1.2);
  SHOTS.push(["A", cam("A", [1.05, 2.2, 2.75], [-5.14, -3.57, -36.34], 40), "A plate 05: sea gibraltar, sun (35, 8), the painted horizon"]);
}
if (on("B")) {   // panel 06: the scroll open on the dry flat patch, Spud beside it on the left, the sea behind
  sky("B", "a", [35, 8]);
  P("B", "sea", "sea", ROCKSEA);
  P("B", "land", "horizonland", { coast: "gibraltar" });
  P("B", "rock", "seastack", { wet: 0, shade: [-0.42, -0.05, 0.4] });
  props.push({ id: "scrollB", kind: "scroll", x: GX.B + 0.3, y: 1.2, z: 0.2, rot: -14, open: 1 });
  spud("B", -0.42, -0.05, 20, 1.2);
  SHOTS.push(["B", cam("B", [0.74, 1.88, 1.6], [0.02, 1.4, 0.1], 40), "B panel 06: the scroll on the flat patch (seastack wet 0), Spud beside it"]);
}
if (on("D") || on("D2")) {
  for (const g of ["D", "D2"].filter(on)) {
    sky(g, "a", [20, 55]);
    P(g, "sea", "sea", { grade: "step", sunAz: 20, sunEl: 55, horizon: true, reach: 1700, calm: [0, 0.6, 2.5], shallow: [[0, 0.8, 4.2, 1.5], [0, -0.4, 3.2, 1.0]], shallowA: 0.42 });
    P(g, "land", "horizonland", { coast: "island", az: -34 });
    P(g, "step", "marblestep", { block: g === "D2" ? "front" : "back" });
  }
  if (on("D")) { spud("D", -0.8, -0.1, 0, 0.05); SHOTS.push(["D", cam("D", [0.3, 1.55, 7.2], [0.1, 0.9, -40], 30), "D panel 31: marblestep + ruler, grade step, the island coast"]); }
  if (on("D2")) { spud("D2", -0.1, 1.2, 0, -0.55); SHOTS.push(["D2", cam("D2", [0.8, 0.7, 4.2], [1.0, 0.45, 0.4], 36), "D2 panel 33: Spud against the wall, the ruler, the waterline"]); }
}
if (on("C")) {   // panel 12: from higher and farther left, Spud at the rock's right edge looks down into the dark green water with weed in it
  sky("C", "a", [35, 8]);
  P("C", "sea", "sea", { ...ROCKSEA, patches: [[3.2, 0.5, 3.0, "#123f40", 0.8, 1]] });
  P("C", "land", "horizonland", { coast: "gibraltar", az: -24 });
  P("C", "rock", "seastack", { wet: 0, shade: [0.3, 0.2, 0.4] });
  P("C", "gulls", "seagulls", { n: 2, centre: [12, 8, -26], r: 7 });
  spud("C", 0.3, 0.2, 55, 1.2);
  SHOTS.push(["C", cam("C", [1.9, 2.75, 4.6], [1.45, 1.3, 0], 42), "C panel 12: Spud on the rock looks down into dark green water (patch + weed)"]);
}
if (on("E")) {
  props.push({ id: "skyE", kind: "aasky", x: GX.E, z: 0, time: "night" });
  props.push({ id: "starsE", kind: "starfield", x: GX.E, z: 0, n: 4000 });
  P("E", "sea", "sea", { grade: "night", horizon: true, reach: 1700, mist: [3, -6, 7], mistA: 0.5, swell: 0.4 });
  spud("E", 0, 0, 0, -0.46);
  SHOTS.push(["E", cam("E", [0, 0.32, 3.4], [0.5, 0.9, -40], 36), "E panel 41: night swell, stars, Spud's head"]);
}
if (on("F") || on("F2")) {   // plate 01's water: the sun 20 deg left so its glitter path is in frame; the wall and its tower are stand-ins, each mirrored in its own colour
  for (const g of ["F", "F2"].filter(on)) {
    sky(g, "a", [20, 8]);
    P(g, "sea", "sea", { grade: "harbour", sunAz: 20, sunEl: 8, horizon: true, reach: 1700, hole: [0, -62, 30], mirrors: [[0, -32, 60, 24, "#c79a45"], [0, -31.9, 9, 36, "#cdc6b6"], [16.5, -31.8, 3, 20, "#8a2a2a"]], foam: [[0, -32, 3, 0.6]] });
    props.push({ id: "wall" + g, kind: "citywall", x: GX[g], z: -32, ring: "brass", len: 60 });
  }
  if (on("F")) SHOTS.push(["F", cam("F", [0, 2.2, 14], [-2, 3.2, -32], 45), "F harbour grade (plate 01's water): glitter path, mirrored streaks, deeper blue near"]);
  if (on("F2")) SHOTS.push(["F2", cam("F2", [0, 55, 48], [0, 0, -44], 50), "F2 the hole seen from above"]);
}

const LEN = 2.6;   // one surf period (2.5 s) per shot, so a strip of any shot shows the whole wash
let T = 0;
SHOTS.forEach(([name, cm, label], i) => { T = r3(0.1 + i * LEN); SHOTS[i] = [name, T, cm, label]; c.cap(T, T + LEN - 0.1, label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * LEN + 0.1);
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "at-sea", title: "Atlantis sea kit bench", idea: "Props bench for the Atlantis sea kit (sea, horizonland, seastack, scroll, marblestep, gulls), not a clip",
  frame: "wide", far: 1500, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm]) => [n, t, cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-sea.mjs (props bench, no reviews).",
});
