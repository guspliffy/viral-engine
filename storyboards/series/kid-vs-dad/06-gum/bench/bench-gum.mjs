// Bench for the eight new props of Kid vs Dad 06 (engine/page/props-gum.js; DESIGN.md sections 2, 6, 7). Not a clip.
// Set plain (color #f3d9a4, floor #d9b27a), look anime-pro, castLook sheet, "frame": "wide", no music, no captions.
// Cast: spud (Tato) at (-1.55, 0), rep (reporter) at (-0.70, 0), dad at (0.75, 0) in full gear: oven mitts, colander, basket and the
// pot lid in his right mitt, GUARD on his left arm. On the floor at z 0.7: eggtimer (togo 0.6) at x -1.15, gumstick at x -0.95, xrayfilm at
// x -0.20 (rot 180: the picture to the lens), a second colanderhat on its rim at x 1.75. The bubble is worn by Tato (blow 1).
// Stills (one a second, 0.5 ... 10.5): 0.5 all eight kinds at real size; 1.5 Dad front, shocked; 2.5 and 3.5 Dad turned 90 and 180 (the lid
// is put aside and both arms stand in GUARD: the lid is a still prop, it does not follow a turn); 4.5 the mitts: left arm up, hand flat, right
// fist on the lid; 5.5 four more timers (togo 1, 0.5, 0.05, 0); 6.5 the film close; 7.5 .. 10.5 Tato close: blow 1; pop 0.1; pop 0.6; pop 1,
// stuck 0. Motion tail: 11 to 14 Dad walks 1 m to +x and back, then one hop with a squash; 14 to 17.2 the timer's togo 1 to 0 in 2 s, then
// ring 0 to 1 in 1.2 s; 17.5 to 18.2 the bubble: blow 0.4 to 1 in 0.4 s, pop 0 to 1 in 0.3 s.
//   node storyboards/series/kid-vs-dad/06-gum/bench/bench-gum.mjs
//   node qa/preflight.mjs storyboards/series/kid-vs-dad/06-gum/bench/bench-gum.json --quick
//   node engine/render.mjs <sb> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5 --draft --safe
//   node qa/contact.mjs out/bench-gum-*.png --out storyboards/series/kid-vs-dad/06-gum/bench/bench-gum-sheet.png
// "togo" is the timer's time-left key (DESIGN.md calls it `left`, which is propState's let-go record: see props-gum.js).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { GUM_GRIPS, GUM_GUARD } from "../../../../../engine/page/props-gum.js";

const c = clip();
const ONE = { pos: [0, 0.85, 5.6], look: [0, 0.62, 0], fov: 30 };
const DAD = { pos: [0.75, 0.90, 2.6], look: [0.75, 0.75, 0], fov: 30 };
const TIMERS = { pos: [3.85, 0.30, 1.6], look: [3.85, 0.09, 0], fov: 30 };
const FILM = { pos: [-0.20, 0.25, 1.9], look: [-0.20, 0.23, 0.7], fov: 30 };
const TATO = { pos: [-1.55, 0.50, 1.6], look: [-1.55, 0.40, 0], fov: 30 };
const WALK = { pos: [1.25, 0.85, 4.6], look: [1.25, 0.70, 0], fov: 30 };
const TIMER = { pos: [-1.15, 0.30, 1.5], look: [-1.15, 0.09, 0.7], fov: 30 };

const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: [-1.55, 0], face: 0, expr: "kind", follow: 0, seed: 2.9 },
  { id: "rep", character: "potatobrawl/reporter", at: [-0.70, 0], face: 0, expr: "kind", follow: 0, seed: 3.3 },
  { id: "dad", character: "potatobrawl/dad", at: [0.75, 0], face: 0, expr: "kind", follow: 0, seed: 1.1 },
];
const LID = [0.22, 0.62, 0.30];   // Dad's right flank (his right is -x), as the design's lid at (-1.42, 0.62, 0.50) beside Dad O (-0.89, 0.20)
const props = [
  { id: "bubble", kind: "gumbubble", wear: "spud", x: 0, y: 0, z: 0, blow: 1, pop: 0, stuck: 1 },
  { id: "mitts", kind: "ovenmitts", wear: "dad", x: 0, y: 0, z: 0 },
  { id: "colander", kind: "colanderhat", wear: "dad", x: 0, y: 1.07, z: 0, tip: -5, rot: 6 },
  { id: "basket", kind: "basketarmour", wear: "dad", x: 0, y: 0.20, z: 0 },
  { id: "lid", kind: "potlid", x: LID[0], y: LID[1], z: LID[2], rot: 20 },
  { id: "timer", kind: "eggtimer", x: -1.15, y: 0, z: 0.7, togo: 0.6 },
  { id: "gum", kind: "gumstick", x: -0.95, y: 0, z: 0.7 },
  { id: "film", kind: "xrayfilm", x: -0.20, y: 0, z: 0.7, rot: 180 },
  { id: "colander2", kind: "colanderhat", x: 1.75, y: 0, z: 0.7 },
  ...[[3.4, 1], [3.7, 0.5], [4.0, 0.05], [4.3, 0]].map(([x, togo], i) => ({ id: `t${i}`, kind: "eggtimer", x, y: 0, z: 0, togo })),
];

// prime the keys that are not propState keys (props-gum.js header), and switch the mitts on
c.prop(0, "bubble", { blow: 1, stuck: 1 }, 0);
c.prop(0, "timer", { togo: 0.6 }, 0);
[1, 0.5, 0.05, 0].forEach((v, i) => c.prop(0, `t${i}`, { togo: v }, 0));
c.prop(0, "mitts", { on: 1 }, 0);

// Dad's arms: GUARD on the left, the right mitt on the lid by GUM_GRIPS.potlid.back
const guard = { o: GUM_GUARD.o, elbow: GUM_GUARD.elbow };
const onLid = { prop: "lid", grip: GUM_GRIPS.potlid.back, palm: [0, 0, 0.3] };   // the palm faces the lid's underside
c.arm(0, "dad", "L", guard, 0); c.arm(0, "dad", "R", onLid, 0);
c.A(0, "dad", "grip", { side: "both", shape: "fist", dur: 0 });
c.arm(0, "rep", "R", "hips", 0);   // keeps the reporter's right hand off Tato (they stand 0.85 m apart)
c.A(0.2, "dad", "look", { to: [0, 0], dur: 0.1, blink: false });
// 1.5 shocked front
c.A(1.0, "dad", "expr", { expr: "shocked", dur: 0.2 });
// 2.5 turned 90, 3.5 turned 180: the lid is put aside (y -3) and both arms stand in GUARD
c.prop(1.8, "lid", { y: -3 }, 0.01, "linear");
c.arm(1.8, "dad", "R", guard, 0.3, "out");
c.A(1.85, "dad", "turn", { to: 90, dur: 0.5 });
c.A(2.85, "dad", "turn", { to: 180, dur: 0.5 });
// 4.5 back to the front: left arm up with the hand flat, right fist on the lid
c.A(3.6, "dad", "turn", { to: 360, dur: 0.5 });
c.prop(3.8, "lid", { y: LID[1] }, 0.01, "linear");
c.arm(3.85, "dad", "R", onLid, 0.3, "inOut");
c.arm(3.85, "dad", "L", "up", 0.35, "out"); c.A(3.85, "dad", "grip", { side: "L", shape: "flat", dur: 0.3 });
// 5.5 .. 6.5 the timers and the film: Dad rests (GUARD again) out of those cameras
c.arm(4.9, "dad", "L", guard, 0.3, "inOut"); c.A(4.9, "dad", "grip", { side: "L", shape: "fist", dur: 0.2 });
// 7.5 .. 10.5 the bubble: blow 1 (7.5), pop 0.1 (8.5), pop 0.6 (9.5), pop 1 and stuck 0 (10.5)
c.prop(8.0, "bubble", { pop: 0.1 }, 0);
c.prop(9.0, "bubble", { pop: 0.6 }, 0);
c.prop(10.0, "bubble", { pop: 1, stuck: 0 }, 0);
c.prop(10.0, "bubble", { stuck: 0 }, 0);
// motion tail 11 to 14: Dad (lid put aside, both arms GUARD) walks 1 m to +x and back, then one hop with a squash
c.prop(10.8, "lid", { y: -3 }, 0.01, "linear");
c.arm(10.8, "dad", "R", guard, 0.3, "out");
c.A(11.0, "dad", "turn", { to: 450, dur: 0.3 });
c.A(11.35, "dad", "move", { to: [1.75, 0], dur: 1.2 });
c.A(12.65, "dad", "turn", { to: 630, dur: 0.4 });
c.A(13.1, "dad", "move", { to: [0.75, 0], dur: 1.2 });
c.A(13.5, "dad", "turn", { to: 720, dur: 0.4 });
c.A(13.9, "dad", "hop", { count: 1, height: 0.12, dur: 0.5 });
c.A(13.95, "dad", "squash", { amount: 0.08, dur: 0.3 });
// 14 to 17.2 the timer: togo 1 to 0 in 2 s, then ring 0 to 1 in 1.2 s
c.prop(14.0, "timer", { togo: 1 }, 0);
c.prop(14.0, "timer", { togo: 0 }, 2, "linear");
c.prop(16.0, "timer", { ring: 1 }, 1.2, "linear");
// 17.5 to 18.2 the bubble: blow 0.4 to 1 in 0.4 s, pop 0 to 1 in 0.3 s (reset first)
c.prop(17.3, "bubble", { blow: 0.4, pop: 0, stuck: 1 }, 0);
c.prop(17.5, "bubble", { blow: 1 }, 0.4, "linear");
c.prop(17.9, "bubble", { pop: 1 }, 0.3, "linear");

const shots = [
  ["all", 0, ONE, "0.5 all eight kinds, real size"], ["dad", 1, DAD, "1.5 Dad front, shocked"], ["dad90", 2, DAD, "2.5 Dad turned 90"], ["dad180", 3, DAD, "3.5 Dad turned 180"],
  ["mitts", 4, DAD, "4.5 mitts: left up flat, right fist on the lid"], ["timers", 5, TIMERS, "5.5 timers togo 1, 0.5, 0.05, 0"], ["film", 6, FILM, "6.5 the film"],
  ["blow", 7, TATO, "7.5 blow 1"], ["pop1", 8, TATO, "8.5 pop 0.1"], ["pop6", 9, TATO, "9.5 pop 0.6"], ["pop10", 10, TATO, "10.5 pop 1, stuck 0"],
  ["walk", 11, WALK, "motion: Dad walks, hops"], ["timer", 14, TIMER, "motion: timer runs down, rings"], ["bubble", 17, TATO, "motion: bubble blown, popped"],
];
const beats = c.beats(shots, 18.5);

write(import.meta.url, {
  id: "bench-gum", title: "Gum props bench", idea: "Bench for the eight new props of Kid vs Dad 06 (props-gum.js), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, frame: "wide", castLook: "sheet", physics: false,
  set: { type: "plain", color: "#f3d9a4", floor: "#d9b27a", light: "golden", para: 0, aperture: 0, shade: "soft" },
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/kid-vs-dad/06-gum/bench/bench-gum.mjs (prop bench, no reviews).",
});
