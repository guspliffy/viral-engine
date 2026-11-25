// Props bench for Kid vs Dad 03 "Square eyes": the wall clock, the eye chart and the small ruler (engine/page/props-sqeyes.js). Not a clip.
// Set gravroom (the set block of make-openings.mjs). One beat a second, a still 0.6 s into each (--stills beats):
//   Q1 wide room, the clock at 8 pm on the back wall (0.20, 1.55, -2.62)     Q2 clock close, time 20
//   Q3 clock close, a CUT to time 23 (11:00)    Q4 time tweened 23 -> 27, caught mid-spin (0.8 s tween from 3.0)    Q5 clock close, time 27 (3:00)
//   Q6 eye chart in the reporter's hand (potatobrawl/reporter), front   Q7 the chart again, a side camera
//   Q8 small ruler in the reporter's hand, front   Q9 the ruler, side
//   node storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-sqeyes.mjs      -> bench-sqeyes.json (beside this file)
//   node engine/render.mjs storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-sqeyes.json --stills beats --draft --safe
//   node qa/contact.mjs out/bench-sqeyes-*.png --out <sheet.png>
// Seeding: propState's `time` starts at 2.75 (not 20), so the clock's spec carries time 20.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const REP = [0.2, -0.6];
const CAM = {
  WIDE: { pos: [0.05, 1.52, 3.18], look: [0.03, 1.52, -2.65], fov: 51 },
  CLOCK: { pos: [0.2, 1.55, -1.2], look: [0.2, 1.55, -2.62], fov: 34 },
  HOLD: { pos: [0.1, 0.62, 2.4], look: [0.1, 0.5, -0.4], fov: 36 },
  SIDE: { pos: [-1.5, 0.45, -0.25], look: [-0.2, 0.3, -0.3], fov: 30 },
  RCU: { pos: [-0.35, 0.34, 0.6], look: [-0.35, 0.3, -0.3], fov: 30 },
};
const SHOTS = [
  ["WIDE", "Q1 wide, 8 pm"], ["CLOCK", "Q2 clock 20"], ["CLOCK", "Q3 cut to 23"], ["CLOCK", "Q4 23 -> 27 mid spin"], ["CLOCK", "Q5 clock 27"],
  ["HOLD", "Q6 eye chart"], ["SIDE", "Q7 eye chart, side"], ["RCU", "Q8 ruler"], ["SIDE", "Q9 ruler, side"],
];
const END = SHOTS.length;
// where each prop is held (its origin: the chart's bottom edge middle, the ruler's end), in front of the reporter's chest
const CHART_AT = [-0.2, 0.18, -0.25], RULER_AT = [-0.2, 0.3, -0.3];
const CHART = { id: "chart", kind: "eyechart", ...grips.placeFor("eyechart", [CHART_AT[0], -5, CHART_AT[2]], 0, { turn: 180 }) };
const RULER = { id: "ruler", kind: "smallruler", ...grips.placeFor("smallruler", [RULER_AT[0], -5, RULER_AT[2]], 0) };
const props = [
  { id: "rug", kind: "grug", x: 0.18, y: 0, z: 0.11 },
  { id: "sofa", kind: "gsofa", x: 0.20, y: 0, z: -1.61, rot: 0 },
  { id: "tv", kind: "gtv", x: -1.52, y: 0, z: -0.99, rot: 34, picture: "cartoon", scene: 0, light: 0.55, castLight: 4, on: 1 },
  { id: "lamp", kind: "glamp", x: -1.75, y: 0, z: -2.35, rot: 180 },
  { id: "plant", kind: "gplant", x: -0.95, y: 0, z: -2.30 },
  { id: "clock", kind: "wallclock", x: 0.20, y: 1.55, z: -2.62, rot: 0, time: 20 },
  CHART, RULER,
];
const cast = [{ id: "rep", character: "potatobrawl/reporter", at: REP, face: 0, expr: "kind", follow: 0, seed: 131.3 }];
A(0, "rep", "look", { to: [0, 0], dur: 0, blink: false });
c.arm(0, "rep", "R", "rest", 0); c.arm(0, "rep", "L", "rest", 0);
c.prop(0, "tv", { on: 1, card: 0 }, 0);
c.prop(0, "clock", { time: 20 }, 0);
// the clock: a cut to 23 at 2.01, a spin 23 -> 27 from 3.0 over 0.8 s (still at 3.6 is mid-spin)
c.prop(2.01, "clock", { time: 23 }, 0);
c.prop(3.0, "clock", { time: 27 }, 0.8, "inOut");
// the eye chart: Q6 (5-6) and Q7 (6-7) show it in the hand, put away at 6.8; the ruler: Q8 (7-8) and Q9 (8-9). Each is taken in 0.02 s (a bench: the hold is what is judged)
{
  const h = grips.phone(c, "rep", CHART, { side: "R", height: 0.2 });
  c.prop(4.58, "chart", { y: CHART_AT[1] }, 0);
  let t = h.take(4.6, { reach: 0.01, settle: 0.01 });
  t = h.carry(t + 0.02, [CHART_AT[0], CHART_AT[1] + 0.02, CHART_AT[2]], 0.3);
  h.release(6.8, { rest: "rest", to: [CHART_AT[0], -5, CHART_AT[2]] });
}
{
  const h = grips.thin(c, "rep", RULER, { side: "R", from: 0 });
  c.prop(6.98, "ruler", { y: RULER_AT[1] }, 0);
  let t = h.take(7.0, { reach: 0.01, settle: 0.01 });
  t = h.carry(t + 0.02, [RULER_AT[0], RULER_AT[1] + 0.02, RULER_AT[2]], 0.3);
  void t;
}
const beats = c.beats(SHOTS.map(([cam, label], i) => [`q${i + 1}`, i, CAM[cam], label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "bench-sqeyes", title: "Kid vs Dad 03 props bench (clock, eye chart, ruler)", idea: "Props bench for props-sqeyes.js (gravroom set), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false, far: 6000,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, animeTiming: true,
  set: { type: "gravroom", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-sqeyes.mjs (props bench, no reviews).",
});
