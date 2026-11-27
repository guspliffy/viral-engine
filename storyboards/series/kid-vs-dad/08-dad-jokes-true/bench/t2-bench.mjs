// T2 bench for Kid vs Dad 08 (DESIGN.md sections 5, 6, 7, 8, 13; engine/page/props-jokes-real.js: hotcorner, beardflood, tatosandwich, kidsocks, kidsneakers). Not a clip.
// World = frame K (the kitchenroom at the origin; no fridge but the b4 test's). One still a second (0.5 ... 15.5), each its own camera and its own bodies:
//   0.5 camera 04 heat 0 | 1.5 heat 0.3 + wisps | 2.5 heat 1 + wisps | 3.5 wide view of the corner, heat 1 (floor sheet, both walls)
//   4.5 beardflood grow 0.2 | 5.5 grow 0.5 | 6.5 grow 0.8 | 7.5 grow 1 (both bodies, master-style wide) | 8.5 grow 1, low on Tato in the mound
//   9.5 tatosandwich front | 10.5 turned 20 | 11.5 side (90) | 12.5 at b4 (Tato on his row mark, a hand on the photo at b4)
//   13.5 kidsocks + kidsneakers in the box hold, front | 14.5 3/4 | 15.5 feet from the side, low
//   node storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t2-bench.mjs
//   node engine/render.mjs storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t2-bench.json --stills 0.5,1.5,...,15.5 --draft --safe
//   node qa/contact.mjs out/t2-bench-*.png --out storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t2-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const cam = (pos, look, fov = 40) => ({ pos, look, fov });
const K0 = [-5.5, -2.3];                                   // the corner point in K
const P = (t, id, set) => c.prop(r3(Math.max(0, t)), id, set, 0);
const expr = (t, who, set) => c.A(r3(t), who, "expr", { set, dur: 0.01 });
const arm = (t, who, side, pose) => c.A(r3(t), who, "arm", { side, pose, dur: 0.01 });

// ---------------------------------------------------------------- cast
const cast = [
  { id: "tC", character: "potatobrawl/spud-kid", at: [-5.0, -1.82], face: 20, expr: "kind", follow: 0, seed: 2.9 },
  { id: "dad", character: "potatobrawl/dad", at: [0.0, -0.85], face: 55, expr: "kind", follow: 0, seed: 1.1 },
  { id: "tB", character: "potatobrawl/spud-kid", at: [1.80, 0.41], face: -60, expr: "kind", follow: 0, seed: 2.8 },
  { id: "tS", character: "potatobrawl/spud-kid", at: [3.4, 0.2], face: 0, expr: "kind", follow: 0, seed: 2.7 },
  { id: "tF", character: "potatobrawl/spud-kid", at: [0.665, -1.08], face: 35, expr: "kind", follow: 0, seed: 2.6 },
  { id: "tK", character: "potatobrawl/spud-kid", at: [-3.0, 0.2], face: 0, expr: "kind", follow: 0, seed: 2.5 },
];
// bodies standing in each still (the others hide, so a stand-in never blocks a camera)
const WHO = [["tC"], ["tC"], ["tC"], ["tC"], ["dad", "tB"], ["dad", "tB"], ["dad", "tB"], ["dad", "tB"], ["dad", "tB"], ["tS"], ["tS"], ["tS"], ["tF"], ["tK"], ["tK"], ["tK"]];
WHO.forEach((who, i) => cast.forEach((a) => c.A(i, a.id, who.includes(a.id) ? "show" : "hide")));

// ---------------------------------------------------------------- props
const skinZ = 0.196;                    // Tato's skin at his cheek (0.115, 0.40): t2-numbers.mjs
const snk = { id: "snk", kind: "kidsneakers", ...grips.placeFor("kidsneakers", [-3.0, 0.30, 0.2 + 0.42], 0) };
const props = [
  { id: "kitchen", kind: "kitchenroom", x: 0, y: 0, z: 0, fridge: false, lamp: 1, time: 2.75 },
  { id: "hot", kind: "hotcorner", x: K0[0], y: 0, z: K0[1], rot: 0 },
  // joke 1: three wisps and a flush on Tato (section 0)
  ...[[-0.19, 0.47, 0.04], [0.19, 0.47, 0.04], [0.05, 0.40, -0.16]].map(([x, y, z], i) => ({ id: `wisp${i}`, kind: "smokewisp", wear: "tC", x, y, z, rgb: "255,250,240", alpha: 0.5, h: 0.42, size: 0.045, n: 7 })),
  ...[-1, 1].map((s, i) => ({ id: `flush${i}`, kind: "blotch", wear: "tC", x: s * 0.115, y: 0.40, z: skinZ + 0.004, color: "#ff5a3c", size: 0.07, alpha: 0.5, scale: 0.001 })),
  // joke 3: the beard on Dad's mark (0, -0.85) rot 55
  { id: "beard", kind: "beardflood", x: 0.0, y: 0, z: -0.85, rot: 55, reach: 2.2, waist: 0.36, grow: 0 },
  // joke 4: the sandwich, on two Tatos
  { id: "sw1", kind: "tatosandwich", wear: "tS", x: 0, y: 0, z: 0 },
  { id: "sw2", kind: "tatosandwich", wear: "tF", x: 0, y: 0, z: 0 },
  // the fridge and the photo at b4 for the "at b4" still (T1's kinds)
  { id: "fridge", kind: "openfridge", x: 1.35, y: 0, z: -1.78, rot: 0, scale: 0.75, open: 0, lit: 0, note: false, handleY: [1.0, 1.5] },
  { id: "b4", kind: "jokephoto", pic: "sandwich", x: 1.115, y: 0.62, z: -1.4965, rot: 0, roll: -5 },
  // joke 2: Tato in socks with his small sneakers held out
  { id: "socks", kind: "kidsocks", wear: "tK", x: 0, y: 0, z: 0 },
  snk,
];
// worn and held pieces show only in their own stills (a worn prop does not follow a hidden wearer: it would stand at the origin)
const ONLY = { sw1: [9, 11], sw2: [12, 12], socks: [13, 15], snk: [13, 15] };
for (const [id, [a, b]] of Object.entries(ONLY)) { P(0, id, { scale: 0.001 }); P(a - 0.01, id, { scale: 1 }); P(b + 0.99, id, { scale: 0.001 }); }
// heat, wisps, flush: states set a hair before each cut
const HEAT = [0, 0.3, 1, 1];
HEAT.forEach((h, i) => { P(i - 0.01, "hot", { heat: h }); for (let w = 0; w < 3; w++) P(i - 0.01, `wisp${w}`, { on: h > 0 ? 1 : 0 }); for (let f = 0; f < 2; f++) P(i - 0.01, `flush${f}`, { scale: h > 0 ? 1 : 0.001 }); });
for (let w = 0; w < 3; w++) { P(0, `wisp${w}`, { on: 0 }); P(3.99, `wisp${w}`, { on: 0 }); }
for (let f = 0; f < 2; f++) P(3.99, `flush${f}`, { scale: 0.001 });
P(0, "hot", { heat: 0 });
// Tato in the corner: the face of section 5, squash 0.05 held, arms hanging, one slow blink
expr(0, "tC", { eye: 0.7, tilt: 0.35, curve: -0.5, open: 0.15 }); c.A(0, "tC", "squash", { amount: 0.05, dur: 0.01 });
[[1.9, 0.3]].forEach(([t, d]) => c.A(t, "tC", "blink", { dur: d }));
// the beard: grow 0.2, 0.5, 0.8, 1, 1 (primed at 0)
[0.2, 0.5, 0.8, 1, 1].forEach((g, i) => P(4 + i - 0.01, "beard", { grow: g }));
P(8.99, "beard", { grow: 0 });   // gone for the sandwich stills
expr(0, "dad", { eye: 0.2, curve: 0.6 });
expr(0, "tB", { eye: 1.2, pupil: 0.7, tilt: 0.3 });
for (const s of ["L", "R"]) arm(0, "tB", s, { o: [0.30, 0.55, 0.10] });
// the sandwich: turned 0, 20, 90 degrees; face of section 8
expr(0, "tS", { eye: 0.6, tilt: -0.15, curve: -0.2 }); expr(0, "tF", { eye: 0.6, tilt: -0.15, curve: -0.2 });
c.A(10 - 0.01, "tS", "turn", { to: 20, dur: 0.01 }); c.A(11 - 0.01, "tS", "turn", { to: 90, dur: 0.01 });
arm(12 - 0.01, "tF", "L", { prop: "b4", grip: [0, 0, 0.055], palm: [0, 0, -1] });   // the hand toward the door (his left at rot 35; the design says RIGHT)
// the socks: the flat stare, pupils on the sneakers; both palms on the pair (box hold)
expr(0, "tK", { eye: 0.6, tilt: -0.05, pupil: 0.8 }); c.A(0, "tK", "still", { dur: 20, idle: 0.1 });
grips.box(c, "tK", snk).take(0, { reach: 0.01, settle: 0.01 });
c.A(14 - 0.01, "tK", "turn", { to: 35, dur: 0.01 }); c.A(15 - 0.01, "tK", "turn", { to: 90, dur: 0.01 });

// ---------------------------------------------------------------- the stills
const CORNER = cam([-4.30, 0.62, -0.03], [-5.08, 0.42, -1.98], 40);                     // camera 04
const BEARD = cam([0.95, 1.35, 6.3], [0.95, 0.35, -0.1], 52);
const SW = cam([3.4, 0.62, 3.7], [3.4, 0.45, 0.2], 34);
const SH = [
  ["camera 04, heat 0", CORNER], ["camera 04, heat 0.3, wisps", CORNER], ["camera 04, heat 1, wisps", CORNER],
  ["the corner wide, heat 1", cam([-3.2, 1.5, 1.6], [-5.2, 0.55, -1.8], 62)],
  ["beard grow 0.2", BEARD], ["beard grow 0.5", BEARD], ["beard grow 0.8", BEARD], ["beard grow 1", BEARD],
  ["beard grow 1, Tato in the mound", cam([1.1, 0.55, 3.3], [1.8, 0.35, 0.41], 40)],
  ["sandwich front", SW], ["sandwich 20 degrees", SW], ["sandwich side", SW],
  ["sandwich at b4", cam([0.9, 0.85, 2.3], [0.9, 0.55, -1.2], 42)],
  ["kidsocks + kidsneakers front", cam([-3.0, 0.45, 2.5], [-3.0, 0.3, 0.3], 38)],
  ["kidsocks 3/4", cam([-2.2, 0.4, 1.9], [-3.0, 0.25, 0.4], 36)],
  ["kidsocks feet, side, low", cam([-1.5, 0.16, 0.9], [-3.0, 0.1, 0.2], 40)],
];
const beats = c.beats(SH.map(([label, k], i) => [`s${i}`, i, k, `${i}.5 ${label}`]), SH.length);

write(import.meta.url, {
  tool: "a builder bench for hotcorner, beardflood, tatosandwich, kidsocks, kidsneakers (Kid vs Dad 08 T2), never a video",
  id: "t2-bench", title: "T2 bench: corner, beard, sandwich, socks", idea: "Prop bench for props-jokes-real.js, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false, cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  set: { type: "plain", night: true, floor: "none", light: "dusk", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade: [[0, { s: 1.12, w: 0.5, c: 1, lift: 0.03, tint: "#ffffff" }]],
  fx: [{ do: "lights", at: 0, to: 1, lamp: 1, dur: 0.01 }],
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "prop test" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "tS", with: "sw1", from: 0, to: 30, reason: "bench: worn" }, { who: "tF", with: "sw2", from: 0, to: 30, reason: "bench: worn" },
    { who: "tK", with: "socks", from: 0, to: 30, reason: "bench: worn" }, { who: "tK", with: "snk", from: 0, to: 30, reason: "bench: held" },
    { who: "tB", with: "beard", from: 0, to: 30, reason: "bench: standing in the mound" }, { who: "dad", with: "beard", from: 0, to: 30, reason: "bench: his beard" },
    { who: "tF", with: "b4", from: 0, to: 30, reason: "bench: palm on the photo" }, { who: "tC", with: "hot", from: 0, to: 30, reason: "bench: in the corner" },
  ],
  notes: "Test bench, not a clip. Generated by storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t2-bench.mjs (T2).",
});
