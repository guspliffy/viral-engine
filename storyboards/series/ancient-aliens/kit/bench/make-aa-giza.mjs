// Bench for the Giza far scenery (engine/page/props-aa-giza.js, task T1 of ../briefs/T1.md): one group per camera, 1000 m apart on a
// plain set with no dome (the camera sees 300 m), so each camera sees only its own sky and ground. Not a clip. Each shot is one beat;
// the still is 0.55 s in. Spud (0.88 m) stands near each camera for scale. Group A sits at the stage origin on purpose: it checks the
// plateau against the plain "shadow" floor's depth mask (z-fighting) and the sky against the set's own light rig.
//   A  today wide at s 0.2 from SW of Menkaure (panel 06)   A2 Khufu and the Cairo haze   A4 Cairo haze close
//   B  2560 BC wide at s 0.2: building, workers, aliens (panel 03)   B2 the valley from above   B3 the working top and casing   B4 the village
//   C  finished pyramid from high above at s 0.2 (panel 11)
//   D  sunset (panel 23)   D2 the same sky, night 0.35
//   E  night: starfield, moon, orion over gizatoday (panels 26-27)   E2 Orion close, Belt readable   E3 the moon
//   F  a today pyramid at s 1 from 60 m (panel 10)   F2 a cap pyramid (Khafre's cap) at s 0.5   F3 the cap pyramid from the SW diagonal (lit / shaded faces)
//   H  the building pyramid at s 0.5 (casing, stepped core, working top)
//   G  the three crowds beside Spud (tourists, workers, aliens)   G2 aliens close   G3 the plateau at s 1: rubble, gravel, tracks, ripples
//   node storyboards/series/ancient-aliens/kit/bench/make-aa-giza.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/kit/bench/aa-giza.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/aa-giza-*.png --out storyboards/series/ancient-aliens/kit/bench/aa-giza-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { A: 0, B: 1000, C: 2000, D: 3000, E: 4000, F: 5000, G: 6000, H: 7000 };
const S = 0.2;

const SPUD = (id, gx, x, z, face) => ({ id, character: "potatobrawl/spud", at: [gx + x, z], face, expr: "kind", follow: 0.2, seed: 2.1 });
const cast = [
  SPUD("spudA", GX.A, -146, 205, 160), SPUD("spudB", GX.B, -26, 190, 180), SPUD("spudD", GX.D, 90, 36, 90), SPUD("spudE", GX.E, -146, 205, 160),
  SPUD("spudF", GX.F, 2, 168, 180), SPUD("spudG", GX.G, 0.3, 4.4, 0),
];
// the sky domes and the plateau are centred on the camera's spot (they follow nothing: a camera 270 m from a dome's middle would see it shifted)
const CAMXZ = { [GX.A]: [-150, 232], [GX.B]: [-30, 215], [GX.C]: [0, 0], [GX.D]: [100, 35], [GX.E]: [-150, 232], [GX.F]: [0, 0], [GX.G]: [0, 0], [GX.H]: [0, 0], [GX.F + 700]: [0, 0] };
const sky = (gx, time, extra = {}) => ({ id: `sky${gx}`, kind: "aasky", x: gx + CAMXZ[gx][0], z: CAMXZ[gx][1], time, ...extra });
const ground = (gx, extra = {}) => ({ id: `ground${gx}`, kind: "gizaplateau", x: gx + CAMXZ[gx][0], z: CAMXZ[gx][1], ...extra });
const props = [
  // A: today
  sky(GX.A, "day"), ground(GX.A, { tracks: true, seed: 1 }),
  { id: "todayA", kind: "gizatoday", x: GX.A, z: 0, s: S, sunAz: 130 },
  { id: "cairoA", kind: "cairohaze", x: GX.A + 420 * S, z: 0, s: S },
  { id: "crowdA", kind: "potatocrowd", x: GX.A - 140, z: 196, who: "tourists", n: 40, box: [14, 10], seed: 3, lookAt: [-50, 6, 20] },
  // B: 2560 BC
  sky(GX.B, "day"), ground(GX.B, { seed: 2 }),
  { id: "buildB", kind: "pyramid", x: GX.B, z: 0, s: S, state: "building", sunAz: 130 },
  { id: "nileB", kind: "nilevalley", x: GX.B + 160 * S, z: 0, s: S },
  { id: "workersB", kind: "potatocrowd", x: GX.B - 16, z: 172, who: "workers", n: 40, box: [20, 12], seed: 5, lookAt: [0, 14, 0] },
  { id: "aliensB", kind: "potatocrowd", x: GX.B - 38, z: 186, who: "aliens", n: 18, box: [10, 6], seed: 8, lookAt: [0, 14, 0] },
  // C: finished
  sky(GX.C, "day"), ground(GX.C, { seed: 3 }),
  { id: "finC", kind: "pyramid", x: GX.C, z: 0, s: S, state: "finished", sunAz: 130 },
  { id: "nileC", kind: "nilevalley", x: GX.C + 160 * S, z: 0, s: S },
  // D: sunset
  sky(GX.D, "sunset", { sun: [264, 4] }), ground(GX.D, { seed: 4 }),
  { id: "todayD", kind: "gizatoday", x: GX.D, z: 0, s: S, sunAz: 270 },
  // E: night
  sky(GX.E, "night"), ground(GX.E, { seed: 5, tracks: true, night: 1 }),
  { id: "todayE", kind: "gizatoday", x: GX.E, z: 0, s: S, sunAz: 130, night: 1 },
  { id: "starsE", kind: "starfield", x: GX.E - 150, z: 232, n: 5000, hole: [33, 22, 5], seed: 2 },
  { id: "moonE", kind: "moon", x: GX.E - 150, z: 232, at: [24, 21] },
  { id: "orionE", kind: "orion", x: GX.E - 32, y: 80, z: 51 },
  // F: a today pyramid at s 1
  sky(GX.F, "day"), ground(GX.F, { seed: 6, tracks: true }),
  { id: "todayF", kind: "pyramid", x: GX.F, z: 0, state: "today", sunAz: 130 },
  // F2: Khafre's cap
  sky(GX.F + 700, "day"), ground(GX.F + 700, { seed: 9 }),
  { id: "capF", kind: "pyramid", x: GX.F + 700, z: 0, s: 0.5, state: "today", base: 215.3, h: 136.4, cap: 0.22, courses: 69, seed: 2, sunAz: 130 },
  // H: the building pyramid at s 0.5
  sky(GX.H, "day"), ground(GX.H, { seed: 8 }),
  { id: "buildH", kind: "pyramid", x: GX.H, z: 0, s: 0.5, state: "building", sunAz: 130 },
  // G: crowds close, in a row on one ground
  sky(GX.G, "day"), ground(GX.G, { seed: 7, tracks: true }),
  { id: "touristsG", kind: "potatocrowd", x: GX.G - 5, z: -3, who: "tourists", n: 14, box: [6, 4], seed: 11, lookAt: [-12, 6, -20] },
  { id: "workersG", kind: "potatocrowd", x: GX.G + 0, z: -9, who: "workers", n: 14, box: [6, 4], seed: 12, lookAt: [0, 6, -30] },
  { id: "aliensG", kind: "potatocrowd", x: GX.G + 6, z: -3, who: "aliens", n: 10, box: [5, 4], seed: 13, lookAt: [10, 6, -20] },
];
// params propState has no default for are seeded at 0 (a dur-0 set), then tweened
c.prop(0, "starsE", { show: 1 }, 0); c.prop(0, "orionE", { show: 1 }, 0);
c.prop(0, `sky${GX.E}`, { night: 0 }, 0);

// ---- the shots: [name, set at its start, camera, label]
const cam = (gx, p, l, f = 32) => ({ pos: [gx + p[0], p[1], p[2]], look: [gx + l[0], l[1], l[2]], fov: f });
let T = 0;
const SHOTS = [
  ["A", () => {}, cam(GX.A, [-150, 1.7, 232], [-56, 24, 56]), "A today wide s 0.2, SW of Menkaure (panel 06)"],
  ["A2", () => {}, cam(GX.A, [-60, 1.7, 232], [1, 22, 95]), "A2 today: Khufu and Cairo haze right"],
    ["B", () => {}, cam(GX.B, [-30, 1.7, 215], [0, 12, 0]), "B 2560 BC s 0.2: building, workers, aliens (panel 03)"],
  ["B2", () => {}, cam(GX.B, [10, 34, 140], [90, 0, 30], 34), "B2 valley: village, fields, palms, river"],
  ["B3", () => {}, cam(GX.B, [-45, 18, 60], [0, 15, 0]), "B3 the working top and the casing, close (s 0.2)"],
  ["B4", () => {}, cam(GX.B, [40, 3, 50], [46, 2, 0], 34), "B4 the workers' village close (s 0.2)"],
  ["A4", () => {}, cam(GX.A, [30, 2, 110], [90, 10, 30], 32), "A4 Cairo haze close (s 0.2)"],
  ["C", () => {}, cam(GX.C, [-70, 130, 150], [30, 0, -30], 34), "C finished from high above s 0.2 (panel 11)"],
  ["D", () => {}, cam(GX.D, [100, 1.7, 35], [0, 12, 38]), "D sunset silhouettes (panel 23)"],
  ["D2", () => c.prop(T, `sky${GX.D}`, { night: 0.35 }, 0), cam(GX.D, [100, 1.7, 35], [0, 12, 38]), "D2 sunset sky, night 0.35"],
  ["E", () => {}, cam(GX.E, [-150, 1.7, 232], [-56, 48, 56]), "E night: stars, moon, orion over gizatoday (panels 26-27)"],
  ["E2", () => {}, cam(GX.E, [-32, 80, 151], [-32, 80, 51], 14), "E2 Orion close: Belt readable, Mintaka off the line"],
  ["E3", () => {}, cam(GX.E, [-150, 1.7, 232], [-112, 38, 147], 20), "E3 the moon"],
  ["F", () => {}, cam(GX.F, [-4, 1.7, 176], [0, 36, 0], 32), "F today pyramid s 1 from 60 m (panel 10)"],
  ["F3", () => {}, cam(GX.F + 700, [-125, 6, 125], [0, 38, 0], 34), "F3 Khafre-like pyramid (cap, s 0.5) from the SW diagonal: lit south face, shaded west face"],
  ["F2", () => {}, cam(GX.F + 700, [-26, 4, 66], [0, 30, 0], 32), "F2 cap pyramid at s 0.5"],
  ["H", () => {}, cam(GX.H, [-60, 12, 90], [0, 22, 0], 34), "H building pyramid at s 0.5: casing, stepped core, loose blocks"],
  ["G", () => {}, cam(GX.G, [0, 1.0, 8], [0, 0.45, -3], 30), "G crowds: tourists | workers | aliens (60 px read)"],
  ["G3", () => {}, cam(GX.G, [-3, 1.3, 15], [2, 0.1, 7], 36), "G3 the plateau at s 1: rubble, gravel, tracks, ripples"],
  ["G2", () => {}, cam(GX.G, [6, 0.8, 4], [6, 0.4, -3], 22), "G2 aliens, close"],
];
const shots = [];
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * 1.0); set(); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 1760, false, { kinetic: false, size: 36 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "aa-giza", title: "Ancient Aliens Giza far scenery bench", idea: "Props bench for the Giza far scenery (aasky, gizaplateau, pyramid, gizatoday, nilevalley, cairohaze, potatocrowd, orion, starfield, moon), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#8fc3ee", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "todayA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/kit/bench/make-aa-giza.mjs (props bench, no reviews).",
});
