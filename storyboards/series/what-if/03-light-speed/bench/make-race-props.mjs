// Bench for the race props (engine/page/props-race.js, task T1 of storyboards/series/what-if/03-light-speed/BRIEF-T1.md):
// one group per camera on a plain road-grey floor, 7 m apart so each camera sees only its own group. Not a clip.
//   trophy        held at the stem by Samurai (right glove) at chest height, then raised overhead, with its glint
//   finishline    snap 0, 0.5, 1 and age 1 side by side (2 x 2, spec.w 1.4)
//   startflag     held up by the Wizard, waving
//   chalkline     age 0 and age 1
//   lightstreak   head 0.3 + sparks, head 1.0 + sparks, tail 0.6 (a streak that has left); then len 80 to the horizon
//   wheatrow      front 0 and front 10, flat 1
//   walkingstick  a knob and a crook, the crook under Viking's right glove
//   node storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs
//   node engine/render.mjs storyboards/series/what-if/03-light-speed/bench/race-props.json --layout
//   node engine/render.mjs storyboards/series/what-if/03-light-speed/bench/race-props.json --stills <times> --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const GX = { trophy: -21, finish: -14, flag: -7, chalk: 0, streak: 7, wheat: 28, sticks: 21, long: -35 };   // each group's x
// when each camera starts (s); the stills are taken STILL after the start (the trophy also at 2.6 s, overhead)
const T = { trophy: 0, finish: 3.4, close: 4.4, flag: 5.4, chalk: 7.0, streak: 8.0, streakclose: 9.2, streak80: 10.4, wheat: 11.4, sticks: 12.4 }, END = 13.8;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };

// ---- trophy: Samurai (faces us, his right glove on our left) holds it at the stem, chest height, then overhead
const T0 = [GX.trophy - 0.2, 0.4, 0.22], TM = [GX.trophy - 0.38, 0.72, 0.2], T1 = [GX.trophy - 0.36, 1.0, 0.14];   // out to the side, then up beside the head
const TROPHY = { id: "trophy", kind: "trophy", x: T0[0], y: T0[1], z: T0[2], rot: 0, glint: 0 };
c.arm(0, "sam", "R", { prop: "trophy", grip: "stem" }, 0); A(0, "sam", "grip", { side: "R", shape: "fist", dur: 0 });
A(0, "sam", "grab", { prop: "trophy", hand: "R", grip: "stem", dur: 0, pose: null });
c.arm(1.0, "sam", "R", { prop: "trophy", grip: "stem", at: TM }, 0.35, "inOut");
c.arm(1.4, "sam", "R", { prop: "trophy", grip: "stem", at: T1 }, 0.4, "out");
c.prop(1.8, "trophy", { glint: 0 }, 0, "linear"); c.prop(1.85, "trophy", { glint: 1 }, 0.25, "out");   // the first glint tween seeds the key

// ---- startflag: the Wizard raises it (stick held 0.12 up), the flag waving with the clip time
const F0 = [GX.flag - 0.32, 0.62, 0.2], F1 = [GX.flag - 0.3, 0.88, 0.1];
const FLAG = { id: "flag", kind: "startflag", x: F0[0], y: F0[1], z: F0[2], rot: 0 };
c.arm(0, "wiz", "R", { prop: "flag", grip: "stick" }, 0); A(0, "wiz", "grip", { side: "R", shape: "fist", dur: 0 });
A(0, "wiz", "grab", { prop: "flag", hand: "R", grip: "stick", dur: 0, pose: null });
c.arm(T.flag + 0.1, "wiz", "R", { prop: "flag", grip: "stick", at: F1 }, 0.5, "out");
c.prop(0, "flag", { wave: 0 }, 0, "linear"); c.prop(0, "flag", { wave: END }, END, "linear");

// ---- walking sticks: the crook stands in front of Viking, his right glove resting on its top; the knob beside it
const CROOK = { id: "crook", kind: "walkingstick", style: "crook", x: GX.sticks - 0.22, z: 0.32, rot: 0 };
const KNOB = { id: "knob", kind: "walkingstick", style: "knob", x: GX.sticks + 0.62, z: 0.15, rot: 0 };

const props = [
  TROPHY,
  ...[["fin0", -2.25, 0, 0], ["fin05", -0.75, 0.5, 0], ["fin1", 0.75, 1, 0], ["finold", 2.25, 0, 1]].map(([id, x, snap, age]) =>
    ({ id, kind: "finishline", x: GX.finish + x, z: 0, w: 1.0, cut: 0.1, snap, age, wave: 0.6 })),
  FLAG,
  { id: "chalk0", kind: "chalkline", x: GX.chalk, z: 0.25, w: 2.0, age: 0 },
  { id: "chalk1", kind: "chalkline", x: GX.chalk, z: -0.35, w: 2.0, age: 1 },
  { id: "stA", kind: "lightstreak", x: GX.streak - 1.5, z: 0, len: 20, head: 0.3, tail: 0, glow: 1, sparks: 1 },
  { id: "stB", kind: "lightstreak", x: GX.streak, z: 0, len: 20, head: 1, tail: 0, glow: 1, sparks: 1 },
  { id: "stC", kind: "lightstreak", x: GX.streak + 1.5, z: 0, len: 20, head: 1, tail: 0.6, glow: 1 },
  { id: "st80", kind: "lightstreak", x: GX.long, z: 0, len: 80, head: 1, tail: 0, glow: 1 },
  { id: "wA", kind: "wheatrow", x: GX.wheat - 0.45, z: 0, len: 20, dir: -1, seed: 3, front: 0, flat: 1 },
  { id: "wB", kind: "wheatrow", x: GX.wheat + 0.45, z: 0, len: 20, dir: 1, seed: 5, front: 10, flat: 1 },
  CROOK, KNOB,
];
grips.rest(c, "vik", "R", CROOK, [0, 0.02], 0, { dur: 0.01, top: 0.55 });   // RACE_GRIPS.walkingstick.top
A(0, "vik", "grip", { side: "R", shape: "hold", dur: 0.01 });

const cast = [
  { id: "sam", character: "duo/samurai", at: [GX.trophy, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
  { id: "wiz", character: "never-has-money/wizard", at: [GX.flag, 0], face: 0, expr: "kind", follow: 0.2, seed: 1.4 },
  { id: "vik", character: "always-orders-potatoes/viking", at: [GX.sticks - 0.05, 0], face: 0, expr: "kind", follow: 0.2, seed: 3.1 },
];

const SHOTS = [
  ["trophy", T.trophy, { pos: [GX.trophy + 0.4, 1.05, 4.4], look: [GX.trophy - 0.1, 0.8, 0.1], fov: 36 }, "trophy at the stem, chest height, then overhead with a glint"],
  ["finishline", T.finish, { pos: [GX.finish, 1.3, 11.0], look: [GX.finish, 0.5, 0], fov: 52 }, "finish line: snap 0 | snap 0.5 | snap 1 | age 1"],
  ["finishclose", T.close, { pos: [GX.finish + 1.5, 1.1, 6.4], look: [GX.finish + 1.5, 0.5, 0], fov: 46 }, "finish line close: snap 1 (broken, swung back) | age 1 (leaning, torn)"],
  ["startflag", T.flag, { pos: [GX.flag + 0.1, 1.0, 4.2], look: [GX.flag - 0.2, 0.85, 0.1], fov: 36 }, "start flag held up, waving"],
  ["chalk", T.chalk, { pos: [GX.chalk + 0.1, 1.1, 3.3], look: [GX.chalk, 0, -0.05], fov: 40 }, "chalk line: age 0 | age 1"],
  ["streak", T.streak, { pos: [GX.streak, 1.1, 7.5], look: [GX.streak, 0.1, -5], fov: 44 }, "light streak: head 0.3 + sparks | head 1 + sparks | tail 0.6"],
  ["streakclose", T.streakclose, { pos: [GX.streak - 2.9, 0.55, 1.6], look: [GX.streak - 1.5, 0.05, -0.6], fov: 40 }, "light streak close: head, filaments and sparks at the origin"],
  ["streak80", T.streak80, { pos: [GX.long, 0.8, 5.0], look: [GX.long, 0.2, -30], fov: 42 }, "light streak len 80: no gaps to the horizon"],
  ["wheat", T.wheat, { pos: [GX.wheat, 0.55, 3.0], look: [GX.wheat, 0.4, -8], fov: 44 }, "wheat rows: front 0 | front 10 (flat 1)"],
  ["sticks", T.sticks, { pos: [GX.sticks - 0.1, 0.8, 4.4], look: [GX.sticks, 0.45, 0.2], fov: 36 }, "walking sticks: the crook under Viking's glove | the knob"],
];
for (const [, t, , label] of SHOTS) c.cap(t, t + 1, label, 1500, false, { kinetic: false });
console.log("stills:", [0.6, 2.6, ...SHOTS.slice(1).map(([, t]) => r3(t + 0.5))].join(","));
// captions must not overlap in time: each runs to the next shot
SHOTS.forEach(([, t], i) => { const cap = c.captions[i]; cap.to = r3(SHOTS[i + 1] ? SHOTS[i + 1][1] : END); });

write(import.meta.url, {
  id: "race-props", title: "Race props bench", idea: "Props bench for What if EP03 (trophy, finish line, start flag, chalk, light streak, wheat, walking sticks), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#cfdde8", floor: "#8a8274" }, music: false, sound: { auto: false },
  hook: { show: ["sam", "trophy"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, s]) => [n, t, s]), END),
  notes: "Generated by storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs (props bench, no reviews).",
});
