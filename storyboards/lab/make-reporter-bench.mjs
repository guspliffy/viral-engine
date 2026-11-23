// REPORTER BENCH (22 Nov 2026, Kid vs Dad 01, task T4): the reporter (characters/potatobrawl/reporter.json: costume `teller` with padded / quilt /
// zip / patch / helm), his news mic (`newsmic`, mug hold, right hand, all film) and the standing helmet (`rephelmet`). Pure engine bench, no creative review.
//   node storyboards/lab/make-reporter-bench.mjs        (prints the still times)
//   node engine/render.mjs storyboards/lab/reporter-bench.json --stills <the printed times> --draft --safe
//   node qa/contact.mjs out/reporter-bench-anime-pro-safe-draft-t*.png --out out/reporter-bench-sheet.png
// beats, one still each, at the end of its beat:
//   views: front, three-quarter, side (his mic side), back | chest (vest, zip, seams, patch) | faces: reporting (his neutral), duck (left glove on
//   the dome), haunted look, defeated with the helmet tilted 12 degrees, strap undone (front and from his left) | the five mic uses of DESIGN
//   section 2 (in cover, to camera, down to the kid, to the dad standing, up to the dad on the bench) | size line-up: Chip, the reporter, Wedge,
//   1.2 m apart on one ground line | the rephelmet standing dome up on the grass
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as grips from "../lib/grips.mjs";

const c = clip(), { A } = c;
const REP = [0, 0];   // the reporter faces the lens (face 0); his right hand is on -x, his left on +x
const FACES = {   // expression sets (DESIGN section 1); the reporting face is his neutral on the deadpan base
  reporting: { tilt: -0.08, browY: -0.02, curve: -0.05, smirk: 0, eye: 0.95, pupil: 1, open: 0, raise: 0 },
  duck: { eye: 0.06, tilt: 0.3, browY: -0.03, curve: -0.3 },
  haunted: { eye: 1.15, pupil: 0.7, tilt: 0.1, curve: -0.1, open: 0 },
  defeated: { eye: 0.55, pupil: 1, tilt: 0.22, browY: -0.03, curve: -0.35, open: 0 },   // an assumption: the design says only "defeated"
};
const cast = [
  { id: "rep", character: "potatobrawl/reporter", at: REP, face: 0, follow: 0.3, seed: 131.3 },   // no expr: the file's neutral stays
  { id: "chip", character: "potatobrawl/chip", at: [-1.2, 0], face: 0, expr: "kind", follow: 0.3, seed: 2.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: [1.2, 0], face: 0, expr: "kind", follow: 0.3, seed: 5.1 },
];
// the fist of DESIGN section 2 (the handle's axis; the butt is 0.056 below it); x toward the shed = -x
const USES = {
  cover: { fist: [-0.45, 0.72, 0.1], lean: 30 },
  camera: { fist: [-0.48, 0.38, 0.26], lean: 0 },
  kid: { fist: [-0.5, 0.21, 0.28], lean: 40 },
  standing: { fist: [-0.5, 0.37, 0.28], lean: 40 },
  bench: { fist: [-0.52, 0.55, 0.3], lean: 40 },
};
const butt = (f) => [f[0], r3(f[1] - 0.056), f[2]];
const MIC = { id: "mic", kind: "newsmic", lean: 0, ...grips.placeFor("newsmic", butt(USES.camera.fist), 0) };
const HELM = { id: "helm", kind: "rephelmet", x: 2.8, y: 0, z: 0, rot: 0 };
const DOME = { x: [0.19, 1.0, 0.02] };   // the stock "hat" pose lands 0.17 above this dome (body 0.84 wide): a hand pose { x: [x, share of Hh over the underside, z] } on the crown
const props = [MIC, HELM];

// ---- the schedule: [name, length, camera] -------------------------------------------------------------------------
const FACE = frame([0, 0.6, 0.2], { az: 0, el: 2, h: 0.75, fov: 24 });
const USEC = (y) => frame([-0.2, y, 0.1], { az: -15, el: 4, h: 1.6, fov: 28 });
const T = [0, 0.55, 0.05];
const PLAN = [
  ["front", 1.5, frame(T, { az: 0, el: 4, h: 1.6, fov: 28 })],
  ["three-quarter", 1.5, frame(T, { az: -35, el: 6, h: 1.6, fov: 28 })],
  ["side, mic side", 1.5, frame(T, { az: -90, el: 4, h: 1.6, fov: 28 })],
  ["back", 1.5, frame(T, { az: 180, el: 6, h: 1.6, fov: 28 })],
  ["chest: vest, patch, zip, seams", 1.2, frame([0.05, 0.38, 0.1], { az: 0, el: 3, h: 0.7, fov: 24 })],
  ["face: reporting", 1.3, FACE],
  ["face: duck", 1.3, frame([0, 0.7, 0.2], { az: 0, el: 2, h: 1.0, fov: 24 })],
  ["face: haunted", 1.3, FACE],
  ["face: defeated, helmet tilted", 1.1, FACE],
  ["defeated, from his left", 1.1, frame([0.1, 0.62, 0.2], { az: 40, el: 6, h: 0.85, fov: 24 })],
  ["use: in cover", 1.4, USEC(0.55)],
  ["use: to camera", 1.4, USEC(0.55)],
  ["use: down to the kid", 1.4, USEC(0.45)],
  ["use: to the dad standing", 1.4, USEC(0.45)],
  ["use: up to the dad on the bench", 1.4, USEC(0.5)],
  ["line-up: Chip, reporter, Wedge", 1.5, frame([0, 0.6, 0], { az: 0, el: 3, h: 1.9, fov: 30 })],
  ["rephelmet on the grass", 1.5, frame([2.8, 0.12, 0], { az: -12, el: 12, h: 0.7, fov: 28 })],
];
const at = {}, shots = []; let t0 = 0;
for (const [name, len, cam] of PLAN) { at[name] = t0; shots.push([name, r3(t0), cam]); t0 += len; }
const END = r3(t0);
const when = (name) => at[name];

// ---- the mic: taken in his right hand at the start (the fist at the "to camera" place), never put down ----------------
{
  const h = grips.mug(c, "rep", MIC, { side: "R" });
  h.take(0.0);
  A(0, "rep", "noblink");
  for (const id of ["chip", "wedge"]) { A(0, id, "hide"); A(when("line-up: Chip, reporter, Wedge") - 0.1, id, "show"); }   // they only stand in the line-up
  A(when("face: reporting"), "rep", "expr", { set: FACES.reporting, dur: 0.01 });
  const duck = when("face: duck"); A(duck, "rep", "expr", { set: FACES.duck, dur: 0.12 }); c.arm(duck, "rep", "L", DOME, 0.3, "out");
  const hau = when("face: haunted"); A(hau, "rep", "expr", { set: FACES.haunted, dur: 0.12 }); c.arm(hau, "rep", "L", "rest", 0.3, "inOut");
  const def = when("face: defeated, helmet tilted"); A(def, "rep", "expr", { set: FACES.defeated, dur: 0.2 });
  A(def, "rep", "hat", { off: [0.015, 0, 0], spin: [0, 8, -12], dur: 0.3 });   // roll 12 toward his left, yaw 8, slid 0.015 the same way: the strap is undone
  const cov = when("use: in cover") - 0.1; A(cov, "rep", "hat", { off: [0, 0, 0], spin: [0, 0, 0], dur: 0.01 }); A(cov, "rep", "expr", { set: FACES.reporting, dur: 0.01 });
  for (const [name, u] of [["use: in cover", USES.cover], ["use: to camera", USES.camera], ["use: down to the kid", USES.kid], ["use: to the dad standing", USES.standing], ["use: up to the dad on the bench", USES.bench]]) {
    h.carry(when(name), butt(u.fist), 0.5); c.prop(when(name), "mic", { lean: u.lean }, 0.5, "inOut");
  }
  const lu = when("line-up: Chip, reporter, Wedge"); h.carry(lu, butt(USES.camera.fist), 0.4); c.prop(lu, "mic", { lean: 0 }, 0.4, "inOut");
}
const beats = c.beats(shots, END);
console.log(`stills: ${PLAN.map(([name, len]) => r3(at[name] + len - 0.12)).join(",")}`);

write(import.meta.url, {
  id: "reporter-bench", title: "Reporter bench", idea: "Character + props bench (Kid vs Dad 01, T4), not a clip: the reporter, his news mic and the standing helmet",
  fps: 30, frame: "wide", look: "anime-pro", profile: "short", loop: false,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
  set: { type: "plain", color: "#8fc4ee", floor: "#7aa05a", para: 0, aperture: 0, lighting: 2 },
  music: false, sound: { auto: false }, castLook: "sheet", cleanStart: true,
  hook: { show: ["rep", "chip", "wedge"], hint: 0, what: "character bench" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/lab/make-reporter-bench.mjs (engine bench, no creative review).",
});
