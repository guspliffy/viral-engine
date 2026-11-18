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
  c.macro(t, who, "say", { line, tone, style, dur, caption: false, ...(line === "Pull!" && { take: 2 }) });   // take 1 heard as "fall"
  cap(t, r3(t + dur + 0.4), line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- places (DESIGN.md section 3: x right, z toward us)
const rad = (d) => (d * Math.PI) / 180;
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const A0 = [-0.90, -1.45], A12 = [-0.85, -1.27];
const W0 = [0.02, -0.66], W2 = [0.52, -0.30], W4 = [-0.05, -0.75], W7 = [0.42, -0.10];
const C0 = [-1.05, 0.40], C5 = [-1.05, 0.40], C7 = [-0.95, 0.35], C11 = [-0.85, -0.20], C12 = [-0.35, -0.42];
const Q1 = [0.75, -1.95], Q2 = [0.15, -2.40], Q3 = [0.95, -2.60];   // a body-width (0.6) apart, clear of the posts
const HOME = [-0.45, -0.20], T1 = [-0.30, 0.05], HOME_ROT = 20;
const X1 = [1.70, 0.0], X2 = [1.85, -1.60], DOOR = [1.78, -3.0], GONE = [1.78, -3.9];   // door x 1.38..2.18, corridor 1.6 deep
const STAND = 0.99;                        // the unit's origin (its handle grip) over the floor, standing, handle up
const AXZ = 0.11;                          // the frame's middle, in front of the grip (prop z)

const cast = [
  { id: "mash", character: "potatobrawl/mash", at: A0, face: 25, expr: "deadpan", follow: 0.2, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: W0, face: -15, expr: "focused", follow: 0.3, seed: 3.1 },
  { id: "chip", character: "potatobrawl/chip", at: C0, face: 30, expr: "kind", follow: 0.4, seed: 2.3 },
  { id: "q1", character: "potatobrawl/rosti", at: Q1, face: -20, expr: "kind", follow: 0.2, seed: 5.1 },
  { id: "q2", character: "potatobrawl/rosti", at: Q2, face: -15, expr: "kind", follow: 0.2, seed: 6.7 },
  { id: "q3", character: "potatobrawl/rosti", at: Q3, face: -25, expr: "kind", follow: 0.2, seed: 7.9 },
];

const UNIT = { id: "unit", kind: "bagsizer", x: HOME[0], y: STAND, z: r3(HOME[1] - AXZ), rot: HOME_ROT, roll: 0, tilt: 0, insert: 0.55, handle: 0.3, pivot: "base" };
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
  { id: "posts", kind: "stanchions", x: 0, y: 0, z: 0, posts: [[1.30, -1.30], [1.30, -2.80]] },
  { id: "marks", kind: "floormarks", x: 0, y: 0.006, z: 0, strip: 0, bar: [-0.763, -0.292, 0.16, 0.16], barColor: "#F2F4FA", queue: [[-0.626, 0.084, 0.16, 0.16], [-0.199, -0.497, 0.16, 0.16], [-0.062, -0.121, 0.16, 0.16]], queueColor: "#F2F4FA" },
  { id: "cap", kind: "policecap", wear: "mash", x: 0, y: 1.40, z: 0.02, r: 0.2, badge: false },
  { id: "pack", kind: "backpack", wear: "chip", x: 0, y: 0.45, z: -0.38, scale: 0.53, color: "#4E79A7" },
  { id: "tape", kind: "tapemeasure", x: -0.95, y: 0.64, z: -0.72, rot: 0, pull: 0 },
  UNIT,
];

// the unit: one call per pose (position of its middle on the floor plan, height of the grip, roll, turn)
const unitTo = (t, dur, { at, y = STAND, roll, rot, insert, handle, tilt } = {}, ease = "inOut") => {
  const set = {};
  if (at) { set.x = r3(at[0]); set.z = r3(at[1] - AXZ); }
  if (y != null) set.y = r3(y);
  if (roll != null) set.roll = roll;
  if (rot != null) set.rot = rot;
  if (insert != null) set.insert = insert;
  if (handle != null) set.handle = handle;
  if (tilt != null) set.tilt = tilt;
  c.prop(t, "unit", set, dur, ease);
};
// a hand on a point of the unit (prop frame: x across, y up from the grip, z toward the plate side)
const handOn = (t, who, side, grip, dur = 0.3, ease = "inOut") => c.arm(t, who, side, { prop: "unit", grip, palm: true }, dur, ease);
const GRIP_R = [0.07, 0, 0], GRIP_L = [-0.07, 0, 0];
const POST = (s, y = -0.5, z = AXZ) => [r3(s * 0.33), y, z];   // the frame's side (x +-0.30 + the tube), y under the grip

// ---------------------------------------------------------------- P1 0.0: he rams the bag in; "Bags in the box, please."
// (v2 after Codex's review of engine sheet v1: the box turned 20 deg so its open side and a rail show; the handle half
// down so his hands reach it; the queue back by the windows; the four marks dark where the feet stand)
c.prop(0, "board", { flip: 0 }, 0.01);
c.prop(0, "unit", { insert: 0.55, handle: 0.3 }, 0);
for (const who of ["mash", "wedge", "chip", "q1", "q2", "q3"]) A(0, who, "turn", { to: cast.find((k) => k.id === who).face, dur: 0.01 });
A(0, "wedge", "look", { to: HOME, dur: 0.01, blink: false });
A(0, "chip", "look", { to: HOME, dur: 0.01, blink: false });
A(0, "mash", "look", { to: HOME, dur: 0.01, blink: false });
const gripAt = (ins, hd) => r3(0.48 * (1 - ins) - 0.24 * (1 - hd));
handOn(0, "wedge", "R", [0.07, gripAt(0.55, 0.3), 0], 0.01);
handOn(0, "wedge", "L", [-0.07, gripAt(0.55, 0.3), 0], 0.01);
A(0, "wedge", "grip", { side: "R", shape: "press", dur: 0.01 }); A(0, "wedge", "grip", { side: "L", shape: "press", dur: 0.01 });
A(0, "wedge", "lean", { to: 16, dur: 0.01 });
unitTo(0.25, 2.3, { insert: 1 }, "in");
handOn(0.25, "wedge", "R", [0.07, gripAt(1, 0.3), 0], 2.3, "in"); handOn(0.25, "wedge", "L", [-0.07, gripAt(1, 0.3), 0], 2.3, "in");
c.arm(0.15, "mash", "R", "point", 0.3);
say(0);
c.arm(2.3, "mash", "R", "rest", 0.4);
act.blinksAt(c, "mash", [2.6, 9.4, 17.2, 26.1, 36.4]);
act.blinksAt(c, "wedge", [3.9, 12.6, 24.8, 33.1]);
act.blinksAt(c, "chip", [5.1, 13.3, 22.4, 37.2]);
see(0, 3, ["wedge.face", "unit", "board"], "a passenger forcing his bag into the BAG CHECK box at a gate");

// ---------------------------------------------------------------- P2 2.8: "It fits!" (fist up) / "Great. Now take it out."
for (const s of ["R", "L"]) c.arm(2.65, "wedge", s, "rest", 0.3);
A(2.65, "wedge", "lean", { to: 0, dur: 0.3 });
A(2.65, "wedge", "move", { to: W2, dur: 0.3 });
A(2.7, "wedge", "turn", { to: 0, dur: 0.3 });
c.arm(2.9, "wedge", "R", { o: [0.14, 0.78, 0.14] }, 0.25); A(2.9, "wedge", "grip", { side: "R", shape: "fist", dur: 0.12 });
A(2.8, "wedge", "expr", { expr: "delighted", dur: 0.2 });
A(2.8, "wedge", "look", { to: [0, 0.3], dur: 0.2 });
say(1);
c.arm(3.9, "wedge", "R", "rest", 0.4);
A(3.9, "mash", "look", { to: W2, dur: 0.25 });
say(2);
see(2.8, 6.0, ["wedge.face", "unit", "mash.face"], "it fits: proud passenger, calm agent");

// ---------------------------------------------------------------- P3 6.3: handle up, both hands, he leans back; nothing moves
A(6.1, "wedge", "turn", { to: heading(W2, HOME), dur: 0.3 });
A(6.1, "wedge", "look", { to: HOME, dur: 0.2 });
c.prop(6.3, "unit", { handle: 1 }, 0.4);
handOn(6.2, "wedge", "R", GRIP_R, 0.5); handOn(6.2, "wedge", "L", GRIP_L, 0.5);
A(6.6, "wedge", "grip", { side: "R", shape: "hold", dur: 0.12 }); A(6.6, "wedge", "grip", { side: "L", shape: "hold", dur: 0.12 });
say(3);
A(7.6, "wedge", "expr", { expr: "angry", dur: 0.2 });
A(7.8, "wedge", "lean", { to: -16, dur: 0.4 });
for (const [k, t] of [8.4, 8.9, 9.4].entries()) unitTo(t, 0.25, { roll: k % 2 ? 2 : -2 });
unitTo(9.75, 0.2, { roll: 0 });
act.tapFoot(c, 7.5, "chip", { count: 4 });
see(6.3, 10, ["wedge.face", "unit"], "he pulls; the bag won't come out");

// ---------------------------------------------------------------- P4 10.0: board 2:00; he hugs the box up off the carpet
c.prop(10.0, "board", { flip: 1 }, 0.133);
const LIFT = [W4[0], r3(W4[1] + 0.42)];
for (const s of ["R", "L"]) c.arm(10.2, "wedge", s, "rest", 0.25);
A(10.2, "wedge", "lean", { to: 0, dur: 0.25 });
A(10.2, "wedge", "move", { to: W4, dur: 0.4 });
A(10.2, "wedge", "turn", { to: 0, dur: 0.4 });
unitTo(10.2, 0.4, { at: [LIFT[0], r3(LIFT[1] + 0.0)], rot: 0 });
handOn(10.5, "wedge", "R", POST(-1, -0.55), 0.3); handOn(10.5, "wedge", "L", POST(1, -0.55), 0.3);
A(10.8, "wedge", "grip", { side: "R", shape: "hold", dur: 0.12 }); A(10.8, "wedge", "grip", { side: "L", shape: "hold", dur: 0.12 });
unitTo(11.0, 0.45, { y: r3(STAND + 0.26), tilt: -8 }, "out");
handOn(11.0, "wedge", "R", POST(-1, -0.55), 0.45, "out"); handOn(11.0, "wedge", "L", POST(1, -0.55), 0.45, "out");
A(11.0, "wedge", "lean", { to: -10, dur: 0.4 });
A(11.0, "wedge", "expr", { expr: "angry", dur: 0.2 });
for (const who of ["chip", "q1", "q2", "q3"]) { A(11.3, who, "look", { to: LIFT, dur: 0.2 }); act.shock(c, 11.3, who, { hold: 0.9 }); }
c.arm(11.4, "chip", "R", "up", 0.3); c.arm(11.4, "chip", "L", "up", 0.3);
c.arm(12.8, "chip", "R", "rest", 0.3); c.arm(12.8, "chip", "L", "rest", 0.3);
A(13.85, "chip", "turn", { to: 30, dur: 0.3 });   // Chip stands left of the box from the start (on the right he hid the passenger's face)
see(11.0, 14, ["wedge.face", "unit"], "the whole red box comes up with the bag");

// ---------------------------------------------------------------- P5 14.0: upside down over his head, shaken; "Hurry up!"
c.prop(14.4, "board", { flip: 2 }, 0.133);
const OVER = 0.82;                         // the grip's height upside down: the side rails in his hands at ~1.3
unitTo(14.0, 0.7, { at: [W4[0], r3(W4[1] + 0.30)], y: OVER, roll: 180, tilt: 0, handle: 0 });
handOn(14.0, "wedge", "R", POST(1, -0.48), 0.7); handOn(14.0, "wedge", "L", POST(-1, -0.48), 0.7);
A(14.0, "wedge", "lean", { to: -6, dur: 0.4 });
A(14.3, "wedge", "look", { to: [W4[0], 0.6], dur: 0.25 });
for (const [k, t] of [14.9, 15.25, 15.6, 15.95].entries()) unitTo(t, 0.17, { y: r3(OVER + (k % 2 ? 0 : 0.06)) });
unitTo(16.3, 0.2, { y: OVER });
A(14.8, "chip", "expr", { expr: "angry", dur: 0.2 });
c.arm(14.9, "chip", "R", "fist", 0.25); c.arm(14.9, "chip", "L", "fist", 0.25);
say(4);
see(14.6, 18.4, ["wedge.face", "unit", "chip.face"], "upside down, shaken: still stuck");

// ---------------------------------------------------------------- P6 18.5: tug of war; all three slide together; "Pull!"
c.prop(18.9, "board", { flip: 3 }, 0.133);
const U0 = -0.55, U1 = -0.05, UZ = 0.0;
unitTo(17.9, 0.6, { at: [U0, UZ], y: STAND, roll: -10, rot: 0, handle: 1 });
for (const s of ["R", "L"]) c.arm(17.9, "wedge", s, "rest", 0.3);
A(17.9, "wedge", "move", { to: [U0 + 0.62, UZ - 0.12], dur: 0.5 });
A(18.3, "wedge", "turn", { to: -90, dur: 0.3 });
handOn(18.4, "wedge", "R", GRIP_R, 0.4); handOn(18.4, "wedge", "L", GRIP_L, 0.4);
A(18.8, "wedge", "lean", { to: -24, dur: 0.3 });
A(17.8, "chip", "move", { to: [U0 - 0.60, UZ + 0.05], dur: 0.6 });
A(18.4, "chip", "turn", { to: 90, dur: 0.3 });
for (const s of ["R", "L"]) c.arm(18.5, "chip", s, "rest", 0.01);
handOn(18.7, "chip", "R", POST(-1, -0.72, -0.02), 0.3); handOn(18.7, "chip", "L", POST(-1, -0.80, 0.26), 0.3);
A(18.9, "chip", "lean", { to: -20, dur: 0.3 });
for (const who of ["wedge", "chip"]) A(18.8, who, "expr", { expr: "angry", dur: 0.2 });
say(5);
unitTo(19.5, 2.5, { at: [U1, UZ] }, "inOut");
A(19.5, "wedge", "move", { to: [U1 + 0.62, UZ - 0.12], dur: 2.5, ease: "inOut" });
A(19.5, "chip", "move", { to: [U1 - 0.60, UZ + 0.05], dur: 2.5, ease: "inOut" });
see(18.6, 22.6, ["wedge.face", "chip.face", "unit"], "tug of war: bag and box stay one piece");

// ---------------------------------------------------------------- P7 23.0: "Bags that don't come out go in the hold. Ten coins."
unitTo(22.7, 0.35, { at: T1, roll: 0, rot: 0 });
for (const who of ["wedge", "chip"]) { A(22.6, who, "lean", { to: 0, dur: 0.3 }); A(22.6, who, "expr", { expr: "sad", dur: 0.3 }); }
for (const s of ["R", "L"]) { c.arm(22.6, "wedge", s, "rest", 0.4); c.arm(22.6, "chip", s, "rest", 0.4); }
A(22.8, "wedge", "move", { to: W7, dur: 0.5 }); A(23.3, "wedge", "turn", { to: -30, dur: 0.3 });
A(22.8, "chip", "move", { to: C7, dur: 0.5 }); A(23.3, "chip", "turn", { to: 20, dur: 0.3 });
A(23.1, "mash", "lean", { to: 16, dur: 0.4 });
A(23.1, "mash", "look", { to: W7, dur: 0.25 });
A(23.1, "mash", "expr", { expr: "stern", dur: 0.25 });
c.arm(24.6, "mash", "L", "point", 0.35);           // the thumb toward the window and the plane's hold
c.arm(25.6, "mash", "L", { o: [-0.2, 0.62, 0.3], palm: [-0.2, 0.2, 0.3] }, 0.3);   // palm up: "Ten coins."
A(24.2, "wedge", "look", { to: A0, dur: 0.2 });
A(25.6, "wedge", "expr", { expr: "sad", dur: 0.25 });
say(6);
c.arm(26.8, "mash", "L", "rest", 0.4);
see(23.4, 27.0, ["mash.face", "wedge.face"], "into the hold, ten coins: his face drops");

// ---------------------------------------------------------------- P8 27.5: THE TURN. FINAL CALL; he points at the sign: "...It fits."
A(27.6, "wedge", "look", { to: T1, dur: 0.4 });
A(28.2, "wedge", "expr", { expr: "smug", dur: 0.4 });
c.prop(28.5, "board", { flip: 4 }, 0.133);
A(28.5, "wedge", "turn", { to: -55, dur: 0.4 });
c.arm(28.7, "wedge", "R", "point", 0.4);
say(7);
see(27.6, 31.0, ["wedge.face", "unit", "board"], "he points at the sign: IF IT FITS / IT FLIES");

// ---------------------------------------------------------------- P9 31.0: the agent reads it; "...Rules are rules."
A(31.0, "mash", "lean", { to: 22, dur: 0.5 });
A(31.0, "mash", "look", { to: T1, dur: 0.3 });
A(31.4, "mash", "expr", { expr: "sad", dur: 0.4 });
c.arm(30.6, "wedge", "R", "rest", 0.4);
A(30.8, "wedge", "turn", { to: -25, dur: 0.4 });
A(31.2, "wedge", "look", { to: A0, dur: 0.3 });
A(32.4, "wedge", "expr", { expr: "happy", dur: 0.3 });
say(8);
A(33.6, "mash", "lean", { to: 0, dur: 0.4 });
c.arm(33.7, "mash", "L", "point", 0.35);
A(33.7, "mash", "look", { to: [1.6, -1.5], dur: 0.25 });
see(31.0, 34.4, ["mash.face", "unit"], "the agent reads his own sign and gives in");

// ---------------------------------------------------------------- P10 34.5: he carries the whole box to the plane; "Thank you!"
A(34.3, "wedge", "expr", { expr: "delighted", dur: 0.2 });
A(34.3, "wedge", "move", { to: [r3(T1[0] + 0.05), r3(T1[1] - 0.42)], dur: 0.35 });   // step in behind the box
A(34.3, "wedge", "turn", { to: 60, dur: 0.35 });
const CARRY = (w, hd) => [r3(w[0] + 0.40 * Math.sin(rad(hd))), r3(w[1] + 0.40 * Math.cos(rad(hd)))];
handOn(34.5, "wedge", "R", POST(-1, -0.62), 0.3); handOn(34.5, "wedge", "L", POST(1, -0.62), 0.3);
const S1 = [r3(T1[0] + 0.05), r3(T1[1] - 0.42)];
unitTo(34.8, 0.3, { at: CARRY(S1, 60), y: r3(STAND + 0.10), rot: 60 }, "out");
const carryOff = (t, from, to, dur) => {
  const hd = heading(from, to);
  A(t, "wedge", "turn", { to: hd, dur: 0.3 });
  A(r3(t + 0.1), "wedge", "move", { to, dur, ease: "linear" });
  unitTo(r3(t + 0.1), dur, { at: CARRY(to, hd), y: r3(STAND + 0.10), rot: hd }, "linear");
  return r3(t + 0.1 + dur);
};
say(9);
let e = carryOff(35.1, S1, X1, 1.3);
e = carryOff(e, X1, X2, 1.0);
e = carryOff(e, X2, DOOR, 1.2);
carryOff(e, DOOR, GONE, 1.2);
A(35.2, "mash", "look", { to: X1, dur: 0.3 });
c.arm(35.4, "mash", "L", "rest", 0.4);
see(34.5, 37.5, ["wedge", "unit"], "he walks to the plane carrying the whole box");

// ---------------------------------------------------------------- P11 38.0: the next one finds four marks on the carpet
A(37.9, "chip", "turn", { to: heading(C7, C11), dur: 0.3 });
A(38.0, "chip", "move", { to: C11, dur: 0.7, ease: "inOut" });
A(38.7, "chip", "turn", { to: 15, dur: 0.3 });
A(38.8, "chip", "look", { to: HOME, dur: 0.25 });
A(38.8, "chip", "expr", { expr: "shocked", dur: 0.25 });
A(38.2, "mash", "look", { to: C11, dur: 0.3 });
A(39.9, "chip", "look", { to: A0, dur: 0.25 });
see(38.4, 40.4, ["chip.face", "marks"], "the box is gone: four marks on the carpet");

// ---------------------------------------------------------------- P12 40.5 (close-up): the tape on the tiny backpack; "We'll use this now."
const CUT = 40.5;
A(r3(CUT - 0.02), "mash", "move", { to: A12, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "chip", "move", { to: C12, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "chip", "turn", { to: 88, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "mash", "lean", { to: 24, dur: 0.01 });
const TAPE = [-0.72, 0.71, -0.44];          // the case over the pack's top, the blade hanging down its side
c.prop(r3(CUT - 0.02), "tape", { x: TAPE[0], y: TAPE[1], z: TAPE[2], rot: 90, tip: 180, pull: 0.2 }, 0.01);
c.arm(r3(CUT - 0.02), "mash", "R", { prop: "tape", grip: [0, 0, 0.03], palm: true }, 0.01);
A(r3(CUT - 0.02), "mash", "grip", { side: "R", shape: "hold", dur: 0.01 });
A(CUT, "mash", "look", { to: [TAPE[0], TAPE[2]], dur: 0.2 });
A(CUT, "chip", "look", { to: [0.9, 0.6], dur: 0.2 });
c.prop(40.9, "tape", { pull: 1 }, 1.4, "inOut");
A(40.6, "chip", "expr", { expr: "shocked", dur: 0.2 });
say(10);
const END = 44.0;
const DOOR_T = 38.0;                       // about when he reaches the jet-bridge door (carryOff legs above)
const allowClip = [
  ...["mash", "wedge", "chip", "q1", "q2", "q3"].map((who) => ({ who, with: "sky", from: 0, to: END, checks: ["shell"], reason: "shell: the sky dome rides with the camera and is drawn behind everything (pinned to the far plane)" })),
  ...[[], ["shell"]].flatMap((checks) => [
    { who: "wedge", with: "hall", from: DOOR_T, to: END, reason: "carrying the box out through the open jet-bridge door into its dark corridor" },
    { who: "wedge", with: "unit", from: 0, to: 2.7, reason: "ramming the bag into the box with both gloves on its handle, leaning in" },
    { who: "wedge", with: "unit", from: 14.0, to: 18.2, reason: "holding the box upside down over his head by its rails" },
    { who: "wedge", with: "unit", from: 18.2, to: 22.7, reason: "tug of war: his gloves on the box's handle, leaning back from it" },
    { who: "wedge", with: "unit", from: 34.3, to: END, reason: "carrying the box in both gloves, held against his belly" },
    { who: "chip", with: "unit", from: 18.3, to: 22.9, reason: "tug of war: his gloves on the box's side rail" },
    { who: "mash", with: "desk", from: CUT, to: END, reason: "leaning over his own counter to measure the backpack (close-up)" },
  ].map((w) => (checks.length ? { ...w, checks, reason: `shell: ${w.reason}` } : w))),
];
see(CUT, END, ["mash.face", "tape", "pack", "chip.face"], "the agent measures the tiny backpack");

// ---------------------------------------------------------------- cameras (DESIGN.md section 3)
const WIDE = { pos: [-0.2, 1.8, 5.8], look: [-0.2, 1.45, -0.8], fov: 36 };
const CLOSE = { pos: [1.1, 1.3, 2.5], look: [-0.6, 0.85, -0.7], fov: 32 };   // passenger side: both faces, the tape on the pack
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
  cast, props, allowClip, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  notes: "Generated by storyboards/series/potato-desk/08-suitcase/make-suitcase.mjs. Engine-sheet stage: the unit is tweened, hands sit on its points (no grabs yet).",
});
