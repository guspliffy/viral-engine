// Bench for the museum props (engine/page/props-museum.js, task T1 of storyboards/series/what-if/05-back-to-life/BRIEF-T1.md):
// the hall seen from inside with the rope, the T. rex on its plinth, the case, the wilting plant, Spud, and the live fish.
// Thirteen stills, 1 s apart, each taken 0.6 s into its beat (not a clip):
//   1 A bloom 0   2 A bloom 1   3 B (low wide, rope rattling)   4 C (the other way)
//   5 D fossil 1   6 D glow 1   7 D burst 0.4   8 D fossil 0
//   9 E flop -1 (wet)   10 E flop 0   11 E flop 1 (mouth open)   12 F rope rattle 1   13 G plant at bloom 0.55
//   node storyboards/series/what-if/05-back-to-life/bench/make-museum-props.mjs
//   node engine/render.mjs storyboards/series/what-if/05-back-to-life/bench/btl-museum-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,10.6,11.6,12.6 --draft --safe
//   node qa/contact.mjs out/btl-museum-props-*.png --out storyboards/series/what-if/05-back-to-life/bench/museum-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const END = 13.6;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };

const CAM_A = { pos: [-0.2, 1.1, 7.6], look: [0.75, 1.5, 0], fov: 44 };
const CAM_B = { pos: [-0.3, 0.3, 2.6], look: [0.8, 2.9, -10.6], fov: 54 };
const CAM_C = { pos: [-1.2, 0.9, -3.6], look: [1.4, 1.4, 2.6], fov: 44 };
const CAM_D = { pos: [-1.15, 1.15, 7.0], look: [-1.15, 1.35, 1.5], fov: 36 };
const CAM_E = { pos: [0, 1.2, 5.0], look: [0, 1.2, 4], fov: 56 };
const CAM_F = { pos: [0.1, 1.0, 4.6], look: [1.6, 0.6, -1.5], fov: 40 };   // extra: the rope rattling
const CAM_G = { pos: [0.3, 1.15, 5.3], look: [1.25, 1.0, 2.55], fov: 30 };   // extra: the plant half way

// [camera, label, hall bloom, case {fossil, glow, burst}, fish {flop, gasp, wet}, rope rattle]
const SHOTS = [
  [CAM_A, "A bloom 0", { bloom: 0 }],
  [CAM_A, "A bloom 1", { bloom: 1 }],
  [CAM_B, "B low wide, rattle 0.8", { rattle: 0.8 }],
  [CAM_C, "C the other way", { rattle: 0 }],
  [CAM_D, "D fossil 1", { fossil: 1, glow: 0, burst: 0 }],
  [CAM_D, "D glow 1", { glow: 1 }],
  [CAM_D, "D burst 0.4", { glow: 0, burst: 0.4 }],
  [CAM_D, "D fossil 0", { burst: 0, fossil: 0 }],
  [CAM_E, "E flop -1, wet 0.45", { flop: -1, gasp: 0, wet: 0.45 }],
  [CAM_E, "E flop 0", { flop: 0, wet: 0 }],
  [CAM_E, "E flop 1, gasp 1", { flop: 1, gasp: 1 }],
  [CAM_F, "F rope rattle 1", { rattle: 1, flop: 0, gasp: 0, scale: 0 }],
  [CAM_G, "G plant bloom 0.55", { rattle: 0, bloom: 0.55 }],
];
const TARGET = { bloom: "plant", rattle: "rope", fossil: "case", glow: "case", burst: "case", flop: "fish", gasp: "fish", wet: "fish", scale: "fish" };

const props = [
  { id: "hall", kind: "museumhall", x: 1, y: 0, z: -2, rot: 0, w: 12, d: 28, h: 9 },
  { id: "plinth", kind: "plinth", x: 1.0, y: 0, z: -11, rot: 0, w: 3.4, h: 0.3, d: 3.0 },
  { id: "rex", kind: "trex", x: 1.0, y: 0.3, z: -11, rot: 0, scale: 1.5 },
  { id: "rope", kind: "exhibitrope", x: 0, y: 0, z: 0, rot: 0, posts: [[1.6, 3], [1.6, 1], [1.6, -1], [1.6, -3], [1.6, -5], [1.6, -7]] },
  { id: "case", kind: "glasscase", x: -1.2, y: 0, z: 0.3, rot: 0 },
  { id: "plant", kind: "wiltplant", x: 1.25, y: 0, z: 2.55, rot: 0 },
  { id: "fish", kind: "livefish", x: 0, y: 1.2, z: 4, rot: 0 },
];
// seed the keys propState has no default for (a first tween of such a key jumps), then one jump per beat
c.prop(0, "plant", { bloom: 0 }, 0, "linear");
c.prop(0, "rope", { rattle: 0 }, 0, "linear");
c.prop(0, "case", { fossil: 1 }, 0, "linear");
c.prop(0, "fish", { flop: 0, gasp: 0, wet: 0, scale: 0 }, 0, "linear");   // the fish only shows in the E stills
c.prop(8.01, "fish", { scale: 1 }, 0, "linear");   // (F sets it to 0 again)
SHOTS.forEach(([, , set], i) => {
  const by = {};
  for (const [k, v] of Object.entries(set)) (by[TARGET[k]] ||= {})[k] = v;
  for (const [id, s] of Object.entries(by)) c.prop(i + 0.01, id, s, 0, "linear");
});

// Spud stands at [-0.6, 2.3] (camera B is only 0.3 m behind that spot and would see nothing but his sweater): for B he stands in the walkway
const place = (t, at) => { c.A(r3(t - 0.02), "spud", "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); };
place(2, [0.1, -1.2]); place(3, [-0.6, 2.3]);
place(11, [-1.6, 3.2]);   // F and G: Spud steps out of their frames
const cast = [{ id: "spud", character: "potatobrawl/spud", at: [-0.6, 2.3], face: 0, expr: "kind", follow: 0.2, seed: 2.6 }];
c.A(0, "spud", "look", { to: [0, 0.1], dur: 0.01, blink: false });

const beats = c.beats(SHOTS.map(([cam, label], i) => [`s${i + 1}`, i, cam, label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "btl-museum-props", title: "Museum props bench", idea: "Props bench for There's a catch EP05 (museumhall, plinth, exhibitrope, glasscase, livefish, wiltplant), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden", para: 0, bloom: "emissive", aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["spud", "rex"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/05-back-to-life/bench/make-museum-props.mjs (props bench, no reviews).",
});
