// Bench for the rescue props (engine/page/props-rescue.js, task T3 of storyboards/series/what-if/07-time-travel/BRIEF-T3.md):
// the TV camera crane, ambulance, stretcher, medics and starter. Four zones on one plain night set (x 0, 30, 60, 90, 110);
// twelve stills 1 s apart, each taken 0.6 s into its beat. Not a clip.
//   1 crane wide, boom 18, yank 1, tally 1, Wedge holding the cable    6 ambulance 3/4 from behind, siren on the right
//   2 crane close on Wedge's glove and the cable                       7 stretcher close, blanket 0.6
//   3 crane fall 0.5 (side)                                            8 starter fire 0.3 beside crouched Spud
//   4 crane fall 1 (side)                                              9 starter fire 0.05 (muzzle flash), close
//   5 ambulance from behind, doors 1, siren 1, two medics lugging      10 medic walking, lug 0, close
//   node storyboards/series/what-if/07-time-travel/bench/make-rescue-props.mjs
//   node engine/render.mjs storyboards/series/what-if/07-time-travel/bench/rescue-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,10.6,11.6 --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/rescue-props-*.png --out storyboards/series/what-if/07-time-travel/bench/rescue-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const END = 12.0;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };

const PULL = [-1.5, 0.55, 0.9];
const CRANE = { id: "crane", kind: "tvcrane", x: 0, y: 0, z: 0, rot: 0, len: 5.5, pull: PULL };
const AMB = { id: "amb", kind: "ambulance", x: 30, y: 0, z: 0, rot: 0 };
const STR = { id: "str", kind: "stretcher", x: 30, y: 0, z: 4.3, rot: 0 };
const STR2 = { id: "str2", kind: "stretcher", x: 90, y: 0, z: 0, rot: 0 };
const MEDL = { id: "medl", kind: "medic", x: 29.05, y: 0, z: 4.3, rot: 90 };
const MEDR = { id: "medr", kind: "medic", x: 30.95, y: 0, z: 4.3, rot: -90 };
const STARTER = { id: "starter", kind: "starter", x: 60, y: 0, z: 0, rot: 0 };
const MED3 = { id: "med3", kind: "medic", x: 110, y: 0, z: 0, rot: 0 };

const CAMS = [
  { pos: [1.9, 2.6, 23], look: [1.9, 2.4, 0], fov: 34 },                 // 1 crane wide
  { pos: [-0.9, 1.3, 7.6], look: [-0.7, 1.15, 0], fov: 40 },             // 2 crane close
  { pos: [1.9, 2.6, 23], look: [1.9, 2.4, 0], fov: 34 },                 // 3
  { pos: [1.9, 2.6, 23], look: [1.9, 2.4, 0], fov: 34 },                 // 4
  { pos: [30, 2.2, 15.5], look: [30, 1.2, 1.2], fov: 38 },               // 5 ambulance behind
  { pos: [37, 2.8, 9], look: [30.3, 1.2, 0.8], fov: 40 },                // 6 3/4
  { pos: [91.6, 1.5, 3.6], look: [90, 0.55, 0], fov: 30 },                // 7 stretcher close
  { pos: [59.7, 1.2, 5.6], look: [59.7, 1.2, 0], fov: 40 },              // 8 starter + Spud
  { pos: [59.6, 1.2, 4.2], look: [59.6, 1.05, 0], fov: 32 },              // 9 flash
  { pos: [110, 0.7, 4.8], look: [110, 0.5, 0], fov: 30 },                // 10 medic
  { pos: [-0.4, 1.2, 8.2], look: [-0.5, 0.95, 0], fov: 36 },              // 11 crane base and the cable
  { pos: [-1.9, 0.7, 2.5], look: [-1.5, 0.55, 0.9], fov: 22 },             // 12 the glove on the cable
];
// [fall, yank, tally, ambulance doors, siren, clock, blanket, fire, walk, lug]
const LABELS = [
  "crane boom 18, yank 1, tally 1, Wedge holds the cable", "crane close: the glove on the cable", "crane fall 0.5", "crane fall 1",
  "ambulance from behind: doors 1, siren 1, medics lug (carry 1)", "ambulance 3/4, the other light, wet 1", "stretcher close, blanket 0.6",
  "starter fire 0.3, Spud crouched", "starter fire 0.05, the flash", "medic walking, lug 0", "crane base, column and the cable (yank 1)", "the glove closed round the cable (grip cable)",
];
// seed every key propState has no default for
c.prop(0, "crane", { swing: 0, boom: 18, yank: 1, tally: 1, fall: 0 }, 0, "linear");
c.prop(0, "amb", { doors: 1, siren: 1, wet: 1, clock: 0.1 }, 0, "linear");
c.prop(0, "str", { blanket: 0 }, 0, "linear");
c.prop(0, "str2", { blanket: 0.6 }, 0, "linear");
for (const m of ["medl", "medr"]) c.prop(0, m, { walk: 0, sway: 0, lug: 1 }, 0, "linear");
c.prop(0, "med3", { walk: 0, sway: 0.5, lug: 0 }, 0, "linear");
c.prop(0, "starter", { fire: 0, sway: 0.4 }, 0, "linear");
// per still
c.prop(2.01, "crane", { fall: 0.5, yank: 0, tally: 0 }, 0, "linear");
c.prop(3.01, "crane", { fall: 1 }, 0, "linear");
c.prop(5.01, "amb", { clock: 0.3 }, 0, "linear");
c.prop(7.01, "starter", { fire: 0.3 }, 0, "linear");
c.prop(8.01, "starter", { fire: 0.05 }, 0, "linear");
c.prop(9.01, "med3", { walk: 0.28 }, 0, "linear");
c.prop(10.01, "crane", { fall: 0, yank: 1, tally: 1 }, 0, "linear");
c.prop(11.01, "crane", { fall: 0, yank: 1, tally: 1 }, 0, "linear");
c.arm(10.02, "wedge", "R", { prop: "crane", grip: PULL }, 0.01, "inOut");

const cast = [
  { id: "wedge", character: "potatobrawl/wedge", at: [-1.25, 0.35], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
  { id: "spud", character: "potatobrawl/spud", at: [58.85, 0.35], face: 0, expr: "kind", follow: 0.2, seed: 1.4 },
];
c.arm(0, "wedge", "R", { prop: "crane", grip: PULL }, 0, "inOut"); A(0, "wedge", "grip", { side: "R", shape: "fist", dur: 0 });
c.arm(2.02, "wedge", "R", "hips", 0.01);
A(0, "spud", "crouch", { to: 1, dur: 0 });
for (const w of ["wedge", "spud"]) A(0, w, "look", { to: [0, 0.1], dur: 0.01, blink: false });

const beats = c.beats(CAMS.map((cam, i) => [`s${i + 1}`, i, cam, LABELS[i]]), END);
console.log("stills:", CAMS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "rescue-props", title: "Rescue props bench", idea: "Props bench for There's a catch EP07 (tvcrane, ambulance, stretcher, medic, starter), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#1a2238", floor: "#2b344c" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["wedge", "crane"], hint: 0, what: "engine test" },
  cast, props: [CRANE, AMB, STR, STR2, MEDL, MEDR, STARTER, MED3], captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/07-time-travel/bench/make-rescue-props.mjs (props bench, no reviews).",
});
