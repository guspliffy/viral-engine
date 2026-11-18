// POTATO DESK 08 "His suitcase fit too well" (Jonny 18 Nov 2026: airport version "thats way better", 30-60 s with a
// turnaround). Story: ./BEATS.md. Drawn target: ./suitcase-panels-v3.png (Codex, 12 panels). Design: ./DESIGN.md (Fable).
//   node storyboards/series/potato-desk/08-suitcase/make-suitcase.mjs -> suitcase.json
//
// THE BRIEF
//   Joke:        he is so proud his bag fits the BAG CHECK box that it never comes out again: he lifts the whole box.
//   Wants:       to board with his bag, free.  Consequence: the agent sends it to the hold for ten coins.
//   Turn:        the box's own sign, IF IT FITS / IT FLIES: the agent's rule works for him; he boards with the box.
//   Ending:      the next passenger finds four marks on the carpet; the agent measures a tiny backpack with a tape.
// Chain: told to box the bag, so he rams it in, so it fits, so "take it out", so he pulls, so it won't, so he lifts,
// so the box comes too, so he shakes it, so nothing, so a tug of war, so they slide together, so the hold and ten
// coins, so he reads the sign, so the agent must let it fly, so the box is gone, so the agent uses a tape measure.
// The point is clear in frame 1 (Jonny 18 Nov: the scene first, then the hook, the story, the end): a gate, a plane in
// the window, a passenger forcing a bag into the box. Hook (in-app title): "His suitcase fit too well".
// No names spoken or captioned (Jonny 18 Nov). Opener A (the push is running at 0.0).
//
// ENGINE SHEET STAGE (Jonny 18 Nov: Codex sheet -> my engine sheet -> Codex refinements): the unit is staged by prop
// tweens with the hands on its points (no grabs yet); proper holds come with the draft if the checks ask for them.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, cap, see } = c;

// ---------------------------------------------------------------- lines (estimated lengths until the voice probe)
const LINES = [
  //  t,    who,     line,                                                    dur,  tone,      style
  [0.15, "mash", "Bags in the box, please.", 1.3, "calm", "flat, bored, polite, an airline gate agent"],
  [3.0, "wedge", "It fits!", 0.7, "happy", "proud, loud, very pleased with himself"],
  [4.2, "mash", "Great. Now take it out.", 1.5, "calm", "flat, deadpan, slow"],
  [7.0, "wedge", "One sec.", 0.7, "calm", "straining, trying to sound casual"],
  [15.0, "chip", "Hurry up!", 0.8, "angry", "tiny, impatient, loud"],
  [19.4, "wedge", "Pull!", 0.5, "angry", "straining, loud"],
  [23.4, "mash", "Bags that don't come out go in the hold. Ten coins.", 3.0, "calm", "flat, deadpan, firm"],
  [29.2, "wedge", "...It fits.", 1.0, "calm", "slow, sly, a smile in the voice"],
  [32.2, "mash", "...Rules are rules.", 1.3, "sad", "tired sigh, defeated, flat"],
  [35.0, "wedge", "Thank you!", 0.8, "happy", "cheerful, loud, walking away"],
  [40.8, "mash", "We'll use this now.", 1.2, "calm", "flat, deadpan, slow"],
];
const SUB = 470;
const say = (i) => {
  const [t, who, line, dur, tone, style] = LINES[i];
  c.macro(t, who, "say", { line, tone, style, dur, caption: false });
  cap(t, r3(t + dur + 0.4), line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- places (DESIGN.md section 3: x right, z toward us)
const rad = (d) => (d * Math.PI) / 180;
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const A0 = [-0.90, -1.45], A12 = [-0.85, -1.28];
const W0 = [0.30, -0.78], WP = [0.12, -0.66], W5 = [0.15, -0.70], W7 = [0.48, -0.10];
const C0 = [0.94, -0.30], C5 = [-0.80, 0.30], C7 = [-0.68, 0.30], C11 = [-0.30, -0.85];
const Q1 = [1.05, -1.90], Q2 = [0.80, -2.45], Q3 = [1.25, -2.75];
const HOME = [-0.25, -0.25], T1 = [-0.12, 0.05];
const X1 = [1.35, 0.0], X2 = [1.85, -1.60], DOOR = [1.85, -3.0], GONE = [1.85, -4.6];
const STAND = 0.99;                        // the unit's origin (its handle grip) over the floor, standing, handle up
const AXZ = 0.11;                          // the frame's middle, in front of the grip (prop z)

const cast = [
  { id: "mash", character: "potatobrawl/mash", at: A0, face: 25, expr: "deadpan", follow: 0.2, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: W0, face: -25, expr: "focused", follow: 0.3, seed: 3.1 },
  { id: "chip", character: "potatobrawl/chip", at: C0, face: -30, expr: "kind", follow: 0.4, seed: 2.3 },
  { id: "q1", character: "potatobrawl/rosti", at: Q1, face: -20, expr: "kind", follow: 0.2, seed: 5.1 },
  { id: "q2", character: "potatobrawl/rosti", at: Q2, face: -15, expr: "kind", follow: 0.2, seed: 6.7 },
  { id: "q3", character: "potatobrawl/rosti", at: Q3, face: -25, expr: "kind", follow: 0.2, seed: 7.9 },
];

const UNIT = { id: "unit", kind: "bagsizer", x: HOME[0], y: STAND, z: r3(HOME[1] - AXZ), rot: 0, roll: 0, insert: 0.35, handle: 1, pivot: "base" };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: -0.2, w: 5.6, d: 6.0, tile: 0.5, a: "#46629E", b: "#415C96" },
  { id: "wall", kind: "officewall", x: -1.375, y: 0, z: -3.0, w: 2.85, h: 3.3 },
  { id: "hall", kind: "gatehall", x: 0, y: 0, z: 0 },
  { id: "sky", kind: "biminisky", x: 0, y: 0, z: 0 },
  { id: "jet", kind: "airliner", x: 22.5, y: 3.56, z: -150, rot: -90, lit: 0 },
  { id: "gear", kind: "jetgear", x: 9, y: 0, z: -150 },
  { id: "desk", kind: "woodcounter", x: -1.30, y: 0, z: -0.825, w: 1.30, d: 0.45, h: 0.60 },
  { id: "monitor", staged: "on the desk", kind: "flatmonitor", x: -1.50, y: 0.60, z: -0.85, rot: 180 },
  { id: "board", staged: "on the back wall", kind: "gateboard", x: -0.75, y: 1.925, z: -2.955 },
  { id: "posts", kind: "stanchions", x: 0, y: 0, z: 0, posts: [[1.42, -1.30], [1.42, -2.80]] },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, strip: 0, bar: [-0.52, -0.42, 0.14, 0.14], barColor: "#8FA5D6", queue: [[0.02, -0.42, 0.14, 0.14], [-0.52, -0.08, 0.14, 0.14], [0.02, -0.08, 0.14, 0.14]], queueColor: "#8FA5D6" },
  { id: "cap", kind: "policecap", wear: "mash", x: 0, y: 1.33, z: 0.02, r: 0.2, badge: false },
  { id: "pack", kind: "backpack", wear: "chip", x: 0, y: 0.34, z: -0.24, scale: 0.53, color: "#4E79A7" },
  { id: "tape", kind: "tapemeasure", x: -0.95, y: 0.64, z: -0.72, rot: 0, pull: 0 },
  UNIT,
];

// the unit: one call per pose (position of its middle on the floor plan, height of the grip, roll, turn)
const unitTo = (t, dur, { at, y = STAND, roll, rot, insert, handle } = {}, ease = "inOut") => {
  const set = {};
  if (at) { set.x = r3(at[0]); set.z = r3(at[1] - AXZ); }
  if (y != null) set.y = r3(y);
  if (roll != null) set.roll = roll;
  if (rot != null) set.rot = rot;
  if (insert != null) set.insert = insert;
  if (handle != null) set.handle = handle;
  c.prop(t, "unit", set, dur, ease);
};
// a hand on a point of the unit (prop frame: x across, y up from the grip, z toward the plate side)
const handOn = (t, who, side, grip, dur = 0.3, ease = "inOut") => c.arm(t, who, side, { prop: "unit", grip, palm: true }, dur, ease);
const GRIP_R = [0.07, 0, 0], GRIP_L = [-0.07, 0, 0];
const RING = (s, y = -0.34) => [r3(s * 0.32), y, AXZ];   // the frame's side, at the top ring (y -0.34 under the grip)

// ---------------------------------------------------------------- P1 0.0: he rams the bag in; "Bags in the box, please."
c.prop(0, "board", { flip: 0 }, 0.01);
c.prop(0, "unit", { insert: 0.35, handle: 1 }, 0);
for (const who of ["mash", "wedge", "chip", "q1", "q2", "q3"]) A(0, who, "turn", { to: cast.find((k) => k.id === who).face, dur: 0.01 });
A(0, "wedge", "look", { to: HOME, dur: 0.01, blink: false });
A(0, "chip", "look", { to: HOME, dur: 0.01, blink: false });
A(0, "mash", "look", { to: HOME, dur: 0.01, blink: false });
handOn(0, "wedge", "R", [0.07, r3(0.48 * 0.65), 0], 0.01);
handOn(0, "wedge", "L", [-0.07, r3(0.48 * 0.65), 0], 0.01);
A(0, "wedge", "grip", { side: "R", shape: "press", dur: 0.01 }); A(0, "wedge", "grip", { side: "L", shape: "press", dur: 0.01 });
unitTo(0.3, 2.3, { insert: 1 }, "in");
handOn(0.3, "wedge", "R", GRIP_R, 2.3, "in"); handOn(0.3, "wedge", "L", GRIP_L, 2.3, "in");
A(0.3, "wedge", "lean", { to: 14, dur: 0.5 });
c.arm(0.2, "mash", "R", "point", 0.35);
say(0);
c.arm(2.2, "mash", "R", "rest", 0.4);
act.blinksAt(c, "mash", [2.6, 9.4, 17.2, 26.1, 36.4]);
act.blinksAt(c, "wedge", [3.9, 12.6, 24.8, 33.1]);
act.blinksAt(c, "chip", [5.1, 13.3, 22.4, 37.2]);
see(0, 3, ["wedge.face", "unit", "board"], "a passenger forcing his bag into the BAG CHECK box at a gate");

// ---------------------------------------------------------------- P2 2.8: "It fits!" / "Great. Now take it out."
A(2.7, "wedge", "lean", { to: 0, dur: 0.3 });
A(2.75, "wedge", "turn", { to: 0, dur: 0.35 });
c.arm(2.75, "wedge", "R", { o: [0.26, 0.62, 0.1] }, 0.35); c.arm(2.75, "wedge", "L", { o: [0.26, 0.62, 0.1] }, 0.35);
A(2.8, "wedge", "expr", { expr: "delighted", dur: 0.2 });
A(2.8, "wedge", "look", { to: [0, 0.3], dur: 0.2 });
say(1);
A(3.9, "mash", "look", { to: [0.3, -0.7], dur: 0.25 });
say(2);
see(2.8, 6.0, ["wedge.face", "unit", "mash.face"], "it fits: proud passenger, calm agent");

// ---------------------------------------------------------------- P3 6.3: he pulls the handle; nothing moves
A(6.2, "wedge", "turn", { to: heading(WP, HOME), dur: 0.35 });
A(6.3, "wedge", "move", { to: WP, dur: 0.5, ease: "inOut" });
A(6.3, "wedge", "look", { to: HOME, dur: 0.2 });
handOn(6.6, "wedge", "R", GRIP_R, 0.35);
A(6.8, "wedge", "grip", { side: "R", shape: "hold", dur: 0.12 });
say(3);
A(7.6, "wedge", "expr", { expr: "angry", dur: 0.2 });
handOn(8.0, "wedge", "L", GRIP_L, 0.3);
A(8.2, "wedge", "grip", { side: "L", shape: "hold", dur: 0.12 });
A(8.0, "wedge", "lean", { to: -14, dur: 0.4 });
for (const [k, t] of [8.4, 8.9, 9.4].entries()) unitTo(t, 0.25, { roll: k % 2 ? 2 : -2 });
unitTo(9.75, 0.2, { roll: 0 });
act.tapFoot(c, 7.5, "chip", { count: 4 });
see(6.3, 10, ["wedge.face", "unit"], "he pulls; the bag won't come out");

// ---------------------------------------------------------------- P4 10.0: board 2:00; the heave: the whole box comes up
c.prop(10.0, "board", { flip: 1 }, 0.133);
A(10.6, "wedge", "lean", { to: -22, dur: 0.3 });
unitTo(11.0, 0.45, { at: [-0.15, -0.40], y: r3(STAND + 0.30), roll: -15 }, "out");
handOn(11.0, "wedge", "R", GRIP_R, 0.45, "out"); handOn(11.0, "wedge", "L", GRIP_L, 0.45, "out");
for (const who of ["chip", "q1", "q2", "q3"]) { A(11.3, who, "look", { to: [-0.15, -0.40], dur: 0.2 }); act.shock(c, 11.3, who, { hold: 0.9 }); }
c.arm(11.4, "chip", "R", "up", 0.3); c.arm(11.4, "chip", "L", "up", 0.3);
A(12.8, "chip", "turn", { to: heading(C0, C5), dur: 0.3 });
A(12.9, "chip", "move", { to: C5, dur: 0.9, ease: "inOut" });
c.arm(12.8, "chip", "R", "rest", 0.3); c.arm(12.8, "chip", "L", "rest", 0.3);
A(13.85, "chip", "turn", { to: 40, dur: 0.3 });
see(11.0, 14, ["wedge.face", "unit"], "the whole red box comes up with the bag");

// ---------------------------------------------------------------- P5 14.0: upside down, he shakes it; "Hurry up!"
A(14.0, "wedge", "move", { to: W5, dur: 0.4 });
A(14.0, "wedge", "turn", { to: 0, dur: 0.4 });
A(14.0, "wedge", "lean", { to: 0, dur: 0.3 });
unitTo(14.0, 0.7, { at: [W5[0], r3(W5[1] + 0.11)], y: 1.16, roll: 180, handle: 0.2 });
c.arm(14.0, "wedge", "R", "up", 0.7); c.arm(14.0, "wedge", "L", "up", 0.7);
A(14.3, "wedge", "look", { to: [0.3, 0.6], dur: 0.25 });
for (const [k, t] of [14.9, 15.25, 15.6, 15.95].entries()) unitTo(t, 0.17, { y: k % 2 ? 1.16 : 1.22 });
unitTo(16.3, 0.2, { y: 1.16 });
c.prop(14.4, "board", { flip: 2 }, 0.133);
A(14.8, "chip", "expr", { expr: "angry", dur: 0.2 });
c.arm(14.9, "chip", "R", "fist", 0.25); c.arm(14.9, "chip", "L", "fist", 0.25);
say(4);
see(14.6, 18.4, ["wedge.face", "unit", "chip.face"], "upside down, shaken: still stuck");

// ---------------------------------------------------------------- P6 18.5: tug of war; all three slide together; "Pull!"
const U0 = -0.30, U1 = 0.02;
unitTo(18.0, 0.5, { at: [U0, 0.05], y: STAND, roll: -12, handle: 1 });
A(17.9, "wedge", "turn", { to: heading([U0 + 0.6, -0.1], [U0, 0.05]), dur: 0.35 });
A(17.9, "wedge", "move", { to: [U0 + 0.6, -0.10], dur: 0.5 });
handOn(18.0, "wedge", "R", GRIP_R, 0.5); handOn(18.0, "wedge", "L", GRIP_L, 0.5);
A(18.5, "wedge", "lean", { to: -25, dur: 0.3 });
A(17.5, "q1", "turn", { to: heading(Q1, [U0 - 0.62, -0.25]), dur: 0.3 });
A(17.6, "q1", "move", { to: [U0 - 0.62, -0.25], dur: 1.0 });
A(18.6, "q1", "turn", { to: 90, dur: 0.3 });
A(17.8, "chip", "move", { to: [U0 - 0.5, 0.25], dur: 0.6 });
A(18.4, "chip", "turn", { to: 90, dur: 0.3 });
c.arm(18.5, "chip", "R", "rest", 0.01); c.arm(18.5, "chip", "L", "rest", 0.01);
handOn(18.7, "chip", "R", RING(-1, -0.55), 0.3); handOn(18.7, "chip", "L", RING(-1, -0.55), 0.3);
handOn(18.9, "q1", "R", RING(-1, -0.4), 0.3); handOn(18.9, "q1", "L", RING(-1, -0.4), 0.3);
A(18.9, "chip", "lean", { to: -20, dur: 0.3 }); A(19.0, "q1", "lean", { to: -20, dur: 0.3 });
for (const who of ["wedge", "chip", "q1"]) A(18.8, who, "expr", { expr: "angry", dur: 0.2 });
say(5);
// the slide: everyone and the box move +0.32 m together
unitTo(19.5, 2.5, { at: [U1, 0.05] }, "inOut");
A(19.5, "wedge", "move", { to: [U1 + 0.6, -0.10], dur: 2.5, ease: "inOut" });
A(19.5, "chip", "move", { to: [U1 - 0.5, 0.25], dur: 2.5, ease: "inOut" });
A(19.5, "q1", "move", { to: [U1 - 0.62, -0.25], dur: 2.5, ease: "inOut" });
c.prop(18.9, "board", { flip: 3 }, 0.133);
see(18.6, 22.6, ["wedge.face", "chip.face", "unit"], "tug of war: bag and box stay one piece");

// ---------------------------------------------------------------- P7 23.0: "Bags that don't come out go in the hold. Ten coins."
unitTo(22.7, 0.35, { at: T1, roll: 0 });
for (const who of ["wedge", "chip", "q1"]) { A(22.6, who, "lean", { to: 0, dur: 0.3 }); A(22.6, who, "expr", { expr: "sad", dur: 0.3 }); }
for (const s of ["R", "L"]) { c.arm(22.6, "wedge", s, "rest", 0.4); c.arm(22.6, "chip", s, "rest", 0.4); c.arm(22.6, "q1", s, "rest", 0.4); }
A(22.8, "wedge", "move", { to: W7, dur: 0.5 }); A(23.3, "wedge", "turn", { to: -35, dur: 0.3 });
A(22.8, "chip", "move", { to: C7, dur: 0.4 }); A(23.2, "chip", "turn", { to: -20, dur: 0.3 });
A(22.9, "q1", "turn", { to: heading([U1 - 0.62, -0.25], Q1), dur: 0.3 });
A(23.1, "q1", "move", { to: Q1, dur: 1.2 }); A(24.3, "q1", "turn", { to: -20, dur: 0.3 });
A(23.1, "mash", "lean", { to: 15, dur: 0.4 });
A(23.1, "mash", "look", { to: [0.6, -0.1], dur: 0.25 });
A(23.1, "mash", "expr", { expr: "stern", dur: 0.25 });
c.arm(24.6, "mash", "R", "point", 0.35);           // the thumb toward the window and the plane's hold
A(24.2, "wedge", "look", { to: A0, dur: 0.2 });
A(25.6, "wedge", "expr", { expr: "sad", dur: 0.25 });
say(6);
c.arm(26.6, "mash", "R", "rest", 0.4);
see(23.4, 27.0, ["mash.face", "wedge.face"], "into the hold, ten coins: his face drops");

// ---------------------------------------------------------------- P8 27.5: THE TURN. FINAL CALL; he points at the sign: "...It fits."
A(27.6, "wedge", "look", { to: T1, dur: 0.4 });
A(28.2, "wedge", "expr", { expr: "smug", dur: 0.4 });
c.prop(28.5, "board", { flip: 4 }, 0.133);
c.arm(28.6, "wedge", "R", "point", 0.45);
A(28.6, "wedge", "turn", { to: heading(W7, T1), dur: 0.4 });
say(7);
see(27.6, 31.0, ["wedge.face", "unit", "board"], "he points at the sign: IF IT FITS / IT FLIES");

// ---------------------------------------------------------------- P9 31.0: the agent reads it; "...Rules are rules."
A(31.0, "mash", "lean", { to: 18, dur: 0.5 });
A(31.0, "mash", "look", { to: T1, dur: 0.3 });
A(31.4, "mash", "expr", { expr: "sad", dur: 0.4 });
say(8);
A(33.0, "mash", "lean", { to: 0, dur: 0.4 });
c.arm(33.6, "mash", "R", "point", 0.35);
A(33.6, "mash", "look", { to: [1.6, -1.5], dur: 0.25 });
c.arm(29.8, "wedge", "R", "rest", 0.4);
see(31.0, 34.4, ["mash.face", "unit"], "the agent reads his own sign and gives in");

// ---------------------------------------------------------------- P10 34.5: he carries the whole box to the plane; "Thank you!"
A(34.4, "wedge", "expr", { expr: "delighted", dur: 0.2 });
A(34.4, "wedge", "turn", { to: heading(W7, X1), dur: 0.35 });
const carryOff = (t, from, to, dur) => {
  const hd = heading(from, to);
  A(t, "wedge", "turn", { to: hd, dur: 0.3 });
  A(r3(t + 0.1), "wedge", "move", { to, dur, ease: "linear" });
  unitTo(r3(t + 0.1), dur, { at: [r3(to[0] + 0.3 * Math.sin(rad(hd))), r3(to[1] + 0.3 * Math.cos(rad(hd)))], y: r3(STAND + 0.30), roll: -8, rot: hd }, "linear");
  return r3(t + 0.1 + dur);
};
unitTo(34.4, 0.35, { at: [r3(W7[0] + 0.3 * Math.sin(rad(heading(W7, X1)))), r3(W7[1] + 0.3 * Math.cos(rad(heading(W7, X1))))], y: r3(STAND + 0.30), roll: -8, rot: heading(W7, X1) }, "out");
handOn(34.4, "wedge", "R", RING(1, -0.5), 0.35); handOn(34.4, "wedge", "L", RING(-1, -0.5), 0.35);
say(9);
let e = carryOff(34.9, W7, X1, 1.6);
e = carryOff(e, X1, X2, 1.0);
e = carryOff(e, X2, DOOR, 1.3);
carryOff(e, DOOR, GONE, 1.2);
A(35.2, "mash", "look", { to: X1, dur: 0.3 });
c.arm(35.4, "mash", "R", "rest", 0.4);
see(34.5, 37.5, ["wedge", "unit"], "he walks to the plane carrying the whole box");

// ---------------------------------------------------------------- P11 38.0: the next one finds four marks on the carpet
A(37.9, "chip", "turn", { to: heading(C7, C11), dur: 0.3 });
A(38.0, "chip", "move", { to: C11, dur: 0.9, ease: "inOut" });
A(38.9, "chip", "turn", { to: 0, dur: 0.3 });
A(39.0, "chip", "look", { to: [-0.25, -0.25], dur: 0.25 });
A(39.0, "chip", "expr", { expr: "shocked", dur: 0.25 });
A(38.2, "mash", "look", { to: C11, dur: 0.3 });
A(39.8, "chip", "look", { to: A12, dur: 0.25 });
see(38.4, 40.4, ["chip.face", "marks"], "the box is gone: four marks on the carpet");

// ---------------------------------------------------------------- P12 40.5 (close-up): the tape measure; "We'll use this now."
const CUT = 40.5;
A(r3(CUT - 0.02), "mash", "move", { to: A12, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "chip", "turn", { to: 100, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "mash", "lean", { to: 25, dur: 0.01 });
c.prop(r3(CUT - 0.02), "tape", { x: -0.60, y: 0.36, z: -0.86, rot: 90 }, 0.01);
c.arm(r3(CUT - 0.02), "mash", "R", { prop: "tape", grip: [0, 0.03, 0], palm: true }, 0.01);
c.arm(r3(CUT - 0.02), "mash", "L", { prop: "tape", grip: [0, 0.03 + 0.24, 0], palm: true }, 0.01);
A(CUT, "mash", "look", { to: C11, dur: 0.2 });
c.prop(40.9, "tape", { pull: 0.8 }, 1.6, "inOut");
c.arm(40.9, "mash", "L", { prop: "tape", grip: [0, 0.27, 0], palm: true }, 1.6);
A(40.6, "chip", "expr", { expr: "shocked", dur: 0.2 });
say(10);
const END = 44.0;
see(CUT, END, ["mash.face", "tape", "pack"], "the agent measures the tiny backpack");

// ---------------------------------------------------------------- cameras (DESIGN.md section 3)
const WIDE = { pos: [-0.3, 1.8, 5.8], look: [-0.3, 1.45, -0.8], fov: 34 };
const CLOSE = { pos: [-0.15, 1.2, 1.6], look: [-0.75, 0.85, -1.2], fov: 30 };
const beats = c.beats([
  ["bag in the box", 0, WIDE, "hook"],
  ["take it out", 6.3, "keep"],
  ["the lift", 10.0, "keep", "escalation"],
  ["tug of war", 18.5, "keep"],
  ["the hold", 23.0, "keep"],
  ["the sign", 27.5, "keep", "payoff"],
  ["boarding", 34.5, "keep"],
  ["tape measure", CUT, CLOSE],
], END);

write(import.meta.url, {
  id: "suitcase",
  title: "His suitcase fit too well",
  idea: "Potato Desk 08: at the gate a passenger rams his bag into the BAG CHECK box; it never comes out, so he takes the box too.",
  fps: 30, look: "anime-pro", profile: "short", loop: false, far: 800,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#cfd6dc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [40, 50] },
  hook: { show: ["wedge", "unit", "board"], hint: 0, what: "a passenger forcing his suitcase into the red BAG CHECK box at an airport gate" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  notes: "Generated by storyboards/series/potato-desk/08-suitcase/make-suitcase.mjs. Engine-sheet stage: the unit is tweened, hands sit on its points (no grabs yet).",
});
