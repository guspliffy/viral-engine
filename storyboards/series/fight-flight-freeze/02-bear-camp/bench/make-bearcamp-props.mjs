// Bench for the bear-camp props (engine/page/props-bearcamp.js, task T1 of ../BRIEF-T1.md): one group per camera on a dark
// plain set, 30 m apart so each camera sees only its own group. Not a clip. Each shot is one beat; the still is 0.55 s in.
//   tent     domecamp closed | door open (the three friends beside it) | rip 1 | push 1 (side) | from inside through the
//            mesh window, the smashed car and its torn door outside | from inside through the door's mesh window
//   car      campcar parked | smash 1 + door 1 + lights 1 | torn 1 and the cardoor on the grass | beams from the side |
//            flash off-phase
//   camp     cooler (Spud beside it for scale) | dent 1 | cookpot dent 0 and dent 1 | burnbranch fire 1
//   fire     gaslantern lit at tip 0, 0.35, 1 | grassfire spread 0.5 | spread 1
//   pine     climbpine whole | clawmarks close | sway 1 + snap 3 | shake
//   node storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs
//   node engine/render.mjs storyboards/series/fight-flight-freeze/02-bear-camp/bench/bearcamp-props.json --stills <times> --draft --out <dir>
//   node qa/contact.mjs <dir>/bearcamp-props-*.png --out storyboards/series/fight-flight-freeze/02-bear-camp/bench/bearcamp-props-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { tent: 0, car: 30, camp: 60, pot: 64, branch: 68, lan: 80, fire: 90, pine: 110, cut: 130 };

// the three friends (scale: Spud 0.88, Chip 0.53, Wedge 0.98)
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-2.4, 2.4], face: 25, expr: "kind", follow: 0.2, seed: 2.1 },
  { id: "chip", character: "potatobrawl/chip", at: [-3.3, 2.6], face: 25, expr: "kind", follow: 0.2, seed: 3.1 },
  { id: "wedge", character: "potatobrawl/wedge", at: [-4.2, 2.4], face: 25, expr: "kind", follow: 0.2, seed: 4.2 },
  { id: "spudI", character: "potatobrawl/spud", at: [GX.cut - 0.6, -0.2], face: 0, expr: "scared", follow: 0.2, seed: 2.1 },
  { id: "chipI", character: "potatobrawl/chip", at: [GX.cut, 0.45], face: 0, expr: "scared", follow: 0.2, seed: 3.1 },
  { id: "wedgeI", character: "potatobrawl/wedge", at: [GX.cut + 0.75, -0.25], face: 0, expr: "scared", follow: 0.2, seed: 4.2 },
  { id: "spudC", character: "potatobrawl/spud", at: [GX.camp + 1.1, 0.3], face: -30, expr: "kind", follow: 0.2, seed: 2.1 },
];
const R2 = 0.312;   // the pine's radius at 2 m (0.36 -> 0.12 over 9 m), where the claw marks go
const props = [
  { id: "tent", kind: "domecamp", x: GX.tent, z: 0 },
  { id: "carW", kind: "campcar", x: GX.tent - 10, z: 0.0, rot: -35 },
  { id: "tentB", kind: "domecamp", x: GX.cut, z: 0 },
  { id: "carD", kind: "campcar", x: GX.tent + 0.4, z: 6.6, rot: 180 },
  { id: "doorW", kind: "cardoor", x: GX.tent - 7.8, y: 0.045, z: 0.9, rot: 10, tilt: -90 },
  { id: "car", kind: "campcar", x: GX.car, z: 0 },
  { id: "doorC", kind: "cardoor", x: GX.car + 3.4, y: 0.045, z: 1.3, rot: -20, tilt: -90 },
  { id: "cooler", kind: "cooler", x: GX.camp, z: 0 },
  { id: "pot0", kind: "cookpot", x: GX.pot - 0.34, z: 0 },
  { id: "pot1", kind: "cookpot", x: GX.pot + 0.34, z: 0 },
  { id: "branch", kind: "burnbranch", x: GX.branch, z: 0 },
  { id: "lan0", kind: "gaslantern", x: GX.lan - 0.55, z: 0 },
  { id: "lan1", kind: "gaslantern", x: GX.lan, z: 0 },
  { id: "lan2", kind: "gaslantern", x: GX.lan + 0.55, z: 0 },
  { id: "grass", kind: "grassfire", x: GX.fire, z: 0, w: 2.5, d: 0.8, seed: 3 },
  { id: "pine", kind: "climbpine", x: GX.pine, z: 0 },
  { id: "claws", kind: "clawmarks", x: GX.pine, y: 2.0, z: R2 * 0.96, r: R2 },
];
// params that propState has no default for are seeded at 0 (a dur-0 set), then tweened
const SEED = (t) => {
  c.prop(t, "tent", { open: 0, rip: 0, push: 0, flutter: 0, cut: 0 }, 0);
  for (const id of ["carW", "carD", "car"]) c.prop(t, id, { smash: 0, door: 0, torn: 0, lights: 0, flash: 0 }, 0);
  c.prop(t, "tentB", { open: 0, cut: 0 }, 0);
  c.prop(t, "cooler", { dent: 0 }, 0); c.prop(t, "pot0", { dent: 0 }, 0); c.prop(t, "pot1", { dent: 0 }, 0); c.prop(t, "branch", { fire: 0 }, 0);
  for (const id of ["lan0", "lan1", "lan2"]) c.prop(t, id, { lit: 0, tip: 0 }, 0);
  c.prop(t, "grass", { fire: 0, spread: 0 }, 0); c.prop(t, "pine", { sway: 0, shake: 0, snap: 0 }, 0);
};
SEED(0);

// ---- the shots: [name, set at its start, camera, label]
const camFor = (gx, o) => ({ pos: [gx + o.p[0], o.p[1], o.p[2]], look: [gx + o.l[0], o.l[1], o.l[2]], fov: o.f });
const SHOTS = [
  ["tentClosed", () => {}, camFor(GX.tent, { p: [3.6, 1.35, 5.8], l: [0, 0.7, 0], f: 38 }), "domecamp: closed (open 0)"],
  ["tentOpen", () => c.prop(T, "tent", { open: 1 }, 0), camFor(GX.tent, { p: [-1.6, 1.1, 7.0], l: [-1.6, 0.55, 0.5], f: 64 }), "domecamp: open 1, the three friends beside it"],
  ["tentRip", () => c.prop(T, "tent", { open: 0, rip: 1, flutter: 0.5 }, 0), camFor(GX.tent, { p: [1.3, 1.2, 3.3], l: [0, 0.85, 0.4], f: 32 }), "domecamp: rip 1, flutter 0.5"],
  ["tentPush", () => c.prop(T, "tent", { rip: 0, flutter: 0, push: 1 }, 0), camFor(GX.tent, { p: [4.2, 1.5, 4.6], l: [0, 0.65, 0.5], f: 40 }), "domecamp: push 1 (the front fly bulges in)"],
  ["tentWin", () => { c.prop(T, "tent", { push: 0, open: 0 }, 0); c.prop(T, "carW", { smash: 1, torn: 1, lights: 1 }, 0); }, { pos: [GX.tent + 0.6, 0.75, 0.0], look: [GX.tent - 1.5, 0.65, 0], fov: 55 }, "from inside through the window: smashed car, torn door, lights"],
  ["tentDoor", () => { c.prop(T, "carD", { smash: 1, torn: 1, lights: 1 }, 0); }, { pos: [GX.tent, 0.72, -0.5], look: [GX.tent + 0.2, 0.7, 6.6], fov: 50 }, "from inside through the door mesh: the smashed car outside"],
  ["tentCut", () => c.prop(T, "tentB", { cut: 1 }, 0), { pos: [GX.cut + 0.3, 1.5, -3.6], look: [GX.cut, 0.5, 0.2], fov: 68 }, "domecamp: cut 1, the wild wall, from 2 m behind: door closed with its mesh window, three potatoes inside"],
  ["tentCutOpen", () => c.prop(T, "tentB", { open: 1 }, 0), { pos: [GX.cut + 0.3, 1.5, -3.6], look: [GX.cut, 0.5, 0.2], fov: 68 }, "domecamp: cut 1, the door open"],
  ["tentWinOut", () => {}, camFor(GX.tent, { p: [-4.4, 1.0, -3.0], l: [-1.2, 0.65, 0], f: 36 }), "domecamp: the window (-x wall) from outside"],
  ["car0", () => {}, camFor(GX.car, { p: [4.2, 1.5, 6.0], l: [0, 0.9, 0.3], f: 36 }), "campcar: parked"],
  ["car1", () => c.prop(T, "car", { smash: 1, door: 1, lights: 1 }, 0), camFor(GX.car, { p: [5.0, 1.3, 5.6], l: [0, 0.9, 0.3], f: 38 }), "campcar: smash 1, door 1, lights 1"],
  ["car2", () => c.prop(T, "car", { door: 0, torn: 1, lights: 0 }, 0), camFor(GX.car, { p: [7.2, 1.5, 3.6], l: [1.2, 0.5, 0.6], f: 40 }), "campcar: torn 1, the cardoor on the grass"],
  ["carBeam", () => c.prop(T, "car", { torn: 0, lights: 1 }, 0), camFor(GX.car, { p: [-5.0, 1.3, 3.0], l: [1.5, 0.5, 3.4], f: 44 }), "campcar: lights 1, beams 6 m (from the side)"],
  ["carFlash", () => c.prop(T, "car", { flash: 0.75 }, 0), camFor(GX.car, { p: [4.2, 1.3, 6.0], l: [0, 0.8, 0.5], f: 36 }), "campcar: flash 0.75 (the off half of a blink)"],
  ["door", () => {}, camFor(GX.car, { p: [3.4, 1.6, 4.4], l: [3.4, 0.05, 1.3], f: 36 }), "cardoor on the grass (tilt -90): shattered glass, torn hinge edge"],
  ["cooler", () => {}, camFor(GX.camp, { p: [2.6, 1.2, 3.4], l: [0.3, 0.4, 0], f: 36 }), "cooler (Spud beside for scale; lid top 0.48)"],
  ["coolerDent", () => c.prop(T, "cooler", { dent: 1 }, 0), camFor(GX.camp, { p: [1.4, 0.95, 1.6], l: [0.2, 0.35, 0.1], f: 36 }), "cooler: dent 1"],
  ["pots", () => c.prop(T, "pot1", { dent: 1 }, 0), camFor(GX.pot, { p: [0.1, 0.55, 1.9], l: [0, 0.08, 0], f: 64 }), "cookpot: dent 0 | dent 1"],
  ["potsSide", () => {}, camFor(GX.pot, { p: [-0.55, 0.4, 0.75], l: [0.34, 0.1, 0], f: 30 }), "cookpot: the dented rim from the -x side"],
  ["branch", () => c.prop(T, "branch", { fire: 1 }, 0), camFor(GX.branch, { p: [0, 0.62, 2.8], l: [0, 0.5, 0], f: 32 }), "burnbranch: fire 1"],
  ["lantern", () => { for (const id of ["lan0", "lan1", "lan2"]) c.prop(T, id, { lit: 1 }, 0); c.prop(T, "lan1", { tip: 0.3 }, 0); c.prop(T, "lan2", { tip: 1 }, 0); }, camFor(GX.lan, { p: [0.3, 0.45, 3.0], l: [0.3, 0.13, 0], f: 64 }), "gaslantern: lit 1 at tip 0 | 0.3 | 1"],
  ["grass5", () => c.prop(T, "grass", { fire: 1, spread: 0.5 }, 0), camFor(GX.fire, { p: [0.4, 0.9, 4.0], l: [0, 0.2, 0], f: 58 }), "grassfire: fire 1, spread 0.5"],
  ["grass10", () => c.prop(T, "grass", { spread: 1 }, 0), camFor(GX.fire, { p: [2.0, 0.8, 4.0], l: [0, 0.2, 0], f: 58 }), "grassfire: spread 1"],
  ["pine", () => {}, camFor(GX.pine, { p: [0, 5.2, 20], l: [0, 5.0, 0], f: 38 }), "climbpine, whole (climb side +z)"],
  ["claws", () => {}, camFor(GX.pine, { p: [0.8, 2.0, 2.9], l: [0, 2.0, 0.3], f: 28 }), "clawmarks on the trunk (r 0.31)"],
  ["pineSway", () => { c.prop(T, "pine", { sway: 1, snap: 3 }, 0); }, camFor(GX.pine, { p: [-1, 5.2, 20], l: [0, 5.0, 0], f: 38 }), "climbpine: sway 1, snap 3"],
  ["pineTop", () => { c.prop(T, "pine", { shake: 1, sway: -1 }, 0); }, camFor(GX.pine, { p: [1, 8.6, 11], l: [0, 8.4, 0], f: 36 }), "climbpine: sway -1, shake 1 (the top)"],
];
const BEAT = 1.0;
let T = 0;
const shots = [];
SHOTS.forEach(([name, set, cam, label], i) => { T = r3(0.1 + i * BEAT); set(); shots.push([name, T, cam]); c.cap(T, T + 0.9, label, 240, false, { kinetic: false }); });
const END = r3(0.1 + SHOTS.length * BEAT + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));

write(import.meta.url, {
  id: "bearcamp-props", title: "Bear camp props bench", idea: "Props bench for Fight, Flight or Freeze 02 (domecamp, campcar, cardoor, cooler, cookpot, burnbranch, gaslantern, grassfire, clawmarks, climbpine), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#0b101c", floor: "#1b2119" }, music: false, sound: { auto: false },
  hook: { show: ["spud", "tent"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  allowClip: ["spudI", "chipI", "wedgeI"].map((who) => ({ who, with: "tentB", from: 0, to: END, reason: "the three sit inside the tent (an enclosing prop): its cloth is all round them" })),
  notes: "Generated by storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs (props bench, no reviews).",
});
