// FRIENDS TRY TO 10 "Take the lift" (Jonny 18 Nov 2026: pitch OK'd, "build the draft").
//   node storyboards/series/friends-try-to/10-take-the-lift/make-take-the-lift.mjs -> take-the-lift.json
//
// THE BRIEF (hook first, Jonny 18 Nov, on trial)
//   Hook:        on screen + narrator in the first 1.5 s "One of them is too heavy."; caption line 1 (post pack)
//                "Which one is too heavy?". Both open the same gap: who?
//   Counter:     no written number (Jonny 18 Nov): the friends in the lift ARE the counter, 4 -> 3 -> 2 -> 1.
//   Rule, flip:  an overloaded lift beeps until the heavy one leaves; everyone guesses big Wedge. He leaves, it beeps.
//                Mash leaves, it beeps. Spud leaves, it beeps. Tiny Chip alone still sets it off.
//   Ending:      the whole hotel breakfast buffet pours out of Chip's hoodie, the beep stops dead, "It was free!",
//                the doors close on the three friends' faces outside. Cut.
//   Early hint:  Chip's hoodie is lumpy from frame 0, a croissant tip peeks out at the hem.
// Opener A: the alarm is beeping at frame 0 (the four already packed in, mid-argument with the lift).
// Chain: the lift beeps, so someone is too heavy; everyone looks at Wedge, so he leaves; still beeps, so Mash leaves;
// still beeps, so Chip sends Spud; still beeps with only Chip, so the friends stare; so the food comes out; so it stops.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);   // on a frame

// ---------------------------------------------------------------- places (set-elevator.js: x right, z toward us;
// the car is x -2.05..2.05, back wall z -1.6, open front z 1.25; the camera stands in the hallway)
// front row: big Wedge (left) and tiny Chip (right, his lumpy hoodie to us); back row: Spud between them, tall Mash right
const WEDGE0 = [-0.5, 0.15], CHIP0 = [0.38, 0.32], SPUD0 = [0.15, -0.65], MASH0 = [0.9, -0.55];
// out of the frame of the wide (horizontal half-width ~0.23 x distance), still inside the walls that run on past the front
const WEDGE_OUT = [-1.6, 4.5];
const MASH_VIA = [1.45, 0.15], MASH_OUT = [1.6, 3.6];
const SPUD_VIA = [-0.75, 0.15], SPUD_OUT = [-1.3, 2.4];
// the hallway after the cut to the reverse (inside looking out through the doors): Mash walks there off screen
const WEDGE_H = [-0.78, 4.05], SPUD_H = [0.15, 3.55], MASH_H = [0.72, 4.15];
const AT_US = [0, 0.05];

const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;
const offAt = (at, yaw, side, fwd, y) => [r3(at[0] + side * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), y, r3(at[1] - side * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];

const cast = [
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: 8, expr: "annoyed", follow: 0.3, seed: 3.3 },
  { id: "mash", character: "potatobrawl/mash", at: MASH0, face: -10, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 6, expr: "worried", follow: 0.3, seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: -6, expr: "kind", follow: 0.3, seed: 2.3 },
];

// Mash's phone: in his right hand at his chest, screen to him
const PHONE_OFF = [-0.14, 0.4, 0.62];   // side - = his right (the hand that holds it)
const PHONE = { id: "phone", kind: "phone", ...(([x, y, z]) => ({ x, y, z }))(offAt(MASH0, -10, ...PHONE_OFF)), rot: 170, tip: -20 };

const BEEP_ON = 0.22, BEEP_PER = 0.38;
const props = [
  { id: "sign", kind: "floorsign", x: -1.05, y: 1.95, z: -1.585, count: 3, over: 1, overAt: 0 },
  { id: "sign-in", kind: "floorsign", x: 0, y: 2.38, z: 1.2, rot: 180, count: 3, gate: "inside" },
  { id: "doors", kind: "elevdoors", x: 0, z: 1.27, open: 1 },
  PHONE,
];

// captions: upper third (Jonny 12 Nov), never over faces
const SUB = 470;
const DUR = [1.45, 0.92, 0.9, 0.67, 1.28];
const SPOKEN = [];   // [from, to, who]: the beep dips under every line (qa/lines.mjs: the hook stood only +2 dB over it)
const say = (i, t, { text, who } = {}) => {
  const [w, line, tone, style, o = {}] = LINES[i];
  SPOKEN.push([t, r3(t + DUR[i]), w]);
  if (w === "narrator") c.at(t, { macro: "narrate", line, voice: "narrator", style, ...o, caption: false });
  else c.macro(t, who ?? w, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  cap(t, r3(t + DUR[i] + 0.35), text ?? line, SUB, false, { size: 64 });
  return r3(t + DUR[i]);
};

// a walk: turn to the heading, walk, (optionally) turn to yawEnd
const walk = (who, from, to, t, dur, { yawEnd, turn = 0.3, steps } = {}) => {
  const hd = heading(from, to);
  A(t, who, "turn", { to: hd, dur: turn, ease: "inOut" });
  A(r3(t + turn * 0.6), who, "move", { to, dur, ease: "inOut", ...(steps && { steps }) });
  const e = r3(t + turn * 0.6 + dur);
  if (yawEnd != null) A(r3(e - 0.05), who, "turn", { to: yawEnd, dur: 0.4, ease: "inOut" });
  return e;
};

// a held prop's place swung round with the body: carry it through n in-between headings, so the hand stays on its own
// side of the body while the body turns (a straight tween cuts through the chest: layout 18 Nov, limb-through-costume)
// the phone turns with him (its rot is 180 + his heading: screen to his face), or the wrist twists to keep it still
const PROT = (yaw) => r3(180 + yaw);
const swingHold = (h, at, from, to, t, dur, off, n = 3) => { for (let k = 1; k <= n; k++) { const y = from + ((to - from) * k) / n; h.carry(r3(t + (dur * (k - 1)) / n), offAt(at, y, ...off), r3(dur / n), "linear", { rot: PROT(y) }); } };

// ---------------------------------------------------------------- 0 PACKED (0.0): the alarm is going, nobody moves
const ph = grips.phone(c, "mash", PHONE, { side: "R" });
ph.take(0, { reach: 0.01, settle: 0.01 });
for (const w of ["wedge", "spud", "chip", "mash"]) A(0, w, "turn", { to: cast.find((x) => x.id === w).face, dur: 0.01 });
A(0, "mash", "look", { to: [0.05, -0.75], dur: 0.01, blink: false });          // at his phone, all video long
A(0, "spud", "look", { to: [-0.35, 0.7], dur: 0.01, blink: false });           // up: where is that beep?
A(0, "wedge", "look", { to: [0.45, -0.15], dur: 0.01, blink: false });         // squeezed, side-eye at Chip
A(0, "chip", "look", { to: [0.25, 0.35], dur: 0.01, blink: false });           // innocent, up and away
A(0, "chip", "expr", { set: { curve: 0.35, smirk: 0.1 }, dur: 0.01 });
act.scrollPhone(c, "mash", [0.6, 3.1, 5.4]);
act.blinksAt(c, "spud", [2.6, 7.6]);
act.blinksAt(c, "wedge", [1.4]);
act.blinksAt(c, "chip", [3.4, 7.1]);
let BEEP_END = 0;   // set once the flood is timed (section 7): the end of the last beep that starts before the food is out
c.prop(0, "sign", { over: 1 }, 0.01);
see(0, 1.5, ["wedge.face", "mash.face", "spud.face", "chip.face", "sign"], "four friends packed in a lift; the overload sign flashes");

// 1 NARRATOR: One of them is too heavy. (the hook, on screen)
say(0, 0.1, { text: "One of them is *too heavy.*" });

// ---------------------------------------------------------------- 2 EVERYONE LOOKS AT WEDGE (1.6)
const LOOK = 1.6;
A(LOOK, "spud", "look", { to: [-0.45, -0.3], dur: 0.2, blink: false });
A(r3(LOOK + 0.05), "chip", "look", { to: [-0.6, 0.45], dur: 0.2, blink: false });
A(r3(LOOK + 0.15), "chip", "turn", { to: -15, dur: 0.3 });
A(r3(LOOK + 0.25), "mash", "look", { to: [-0.6, -0.2], dur: 0.15, blink: false });   // even Mash looks up, once
A(r3(LOOK + 0.75), "mash", "look", { to: [0.05, -0.75], dur: 0.15, blink: false });
A(r3(LOOK + 0.15), "wedge", "look", { to: [0.35, 0.1], dur: 0.15, blink: false });
A(r3(LOOK + 0.35), "wedge", "look", { to: [-0.15, 0.25], dur: 0.15, blink: false });
A(r3(LOOK + 0.5), "wedge", "expr", { set: { curve: -0.45, smirk: 0.3, eye: 0.85 }, dur: 0.15 });
A(r3(LOOK + 0.5), "wedge", "face", { browL: -0.5, browR: 0.2, dur: 0.15 });

// 3 WEDGE: Fine! (he huffs and walks out to the left)
const FINE = 2.0;
say(1, FINE);
A(FINE, "wedge", "squash", { amount: 0.06, dur: 0.25 });
let t = walk("wedge", WEDGE0, WEDGE_OUT, r3(FINE + 0.6), 1.15, { turn: 0.3 });
const WEDGE_GONE = r3(t - 0.25);
A(r3(FINE + 0.9), "spud", "look", { to: [-0.6, -0.1], dur: 0.2, blink: false });   // watches him go
A(r3(FINE + 1.0), "chip", "look", { to: [-0.6, 0.1], dur: 0.2, blink: false });
// ... and it still beeps: Spud and Chip look back up at the sign
A(r3(WEDGE_GONE - 0.15), "spud", "look", { to: [-0.35, 0.7], dur: 0.2, blink: false });
A(r3(WEDGE_GONE - 0.15), "chip", "turn", { to: 0, dur: 0.35 });
A(r3(WEDGE_GONE - 0.1), "chip", "look", { to: [-0.3, 0.7], dur: 0.2, blink: false });
see(r3(FINE + 0.9), r3(FINE + 1.6), ["wedge.face"], "Wedge walks out; three left, it still beeps");

// ---------------------------------------------------------------- 4 MASH (eyes on the phone) strolls out right
const MLOOK = r3(WEDGE_GONE + 0.25);
A(MLOOK, "spud", "look", { to: [0.55, -0.1], dur: 0.2, blink: false });
A(r3(MLOOK + 0.05), "spud", "turn", { to: 25, dur: 0.3 });
A(r3(MLOOK + 0.1), "chip", "look", { to: [0.45, 0.6], dur: 0.2, blink: false });
A(r3(MLOOK + 0.1), "chip", "turn", { to: 30, dur: 0.3 });
// he never looks up: a shrug, then out (the phone rides in his hand)
A(r3(MLOOK + 0.35), "mash", "squash", { amount: 0.04, dur: 0.3 });
const M1 = r3(MLOOK + 0.55);
{
  const y0 = -10, hd1 = heading(MASH0, MASH_VIA), hd2 = heading(MASH_VIA, MASH_OUT);
  A(M1, "mash", "turn", { to: hd1, dur: 0.3, ease: "linear" }); swingHold(ph, MASH0, y0, hd1, M1, 0.3, PHONE_OFF, 6);
  A(r3(M1 + 0.3), "mash", "move", { to: MASH_VIA, dur: 0.6, ease: "inOut" }); ph.carry(r3(M1 + 0.3), offAt(MASH_VIA, hd1, ...PHONE_OFF), 0.6, "inOut");
  A(r3(M1 + 0.9), "mash", "turn", { to: hd2, dur: 0.25, ease: "linear" }); swingHold(ph, MASH_VIA, hd1, hd2, r3(M1 + 0.9), 0.25, PHONE_OFF, 2);
  A(r3(M1 + 1.15), "mash", "move", { to: MASH_OUT, dur: 1.1, ease: "inOut" }); ph.carry(r3(M1 + 1.15), offAt(MASH_OUT, hd2, ...PHONE_OFF), 1.1, "inOut");
}
const MASH_GONE = r3(M1 + 1.85);
A(r3(MASH_GONE - 0.3), "spud", "turn", { to: 0, dur: 0.35 });
A(r3(MASH_GONE - 0.25), "spud", "look", { to: [-0.35, 0.7], dur: 0.2, blink: false });
A(r3(MASH_GONE - 0.2), "chip", "turn", { to: 0, dur: 0.35 });
A(r3(MASH_GONE - 0.15), "chip", "look", { to: [-0.3, 0.7], dur: 0.2, blink: false });
A(r3(MASH_GONE - 0.1), "spud", "expr", { set: { curve: -0.35, eye: 0.9 }, dur: 0.2 });

// ---------------------------------------------------------------- 5 CHIP: Your turn. (sweet as anything) -> Spud out
const TURN = r3(MASH_GONE + 0.15);
A(TURN, "chip", "turn", { to: -35, dur: 0.4 });                                   // half round, up over his shoulder at Spud
A(r3(TURN + 0.1), "chip", "look", { to: [0.5, 0.6], dur: 0.2, blink: false });
A(r3(TURN + 0.15), "spud", "look", { to: [0.35, -0.55], dur: 0.2, blink: false });  // down at tiny Chip
A(r3(TURN + 0.1), "chip", "expr", { set: { curve: 0.55, smirk: 0.0, eye: 1.1 }, dur: 0.2 });
say(2, r3(TURN + 0.3));
A(r3(TURN + 1.2), "spud", "expr", { set: { curve: -0.45, eye: 0.85 }, dur: 0.2 });
A(r3(TURN + 1.2), "spud", "squash", { amount: 0.04, dur: 0.3 });                  // a sigh
const S1 = r3(TURN + 1.4);
t = walk("spud", SPUD0, SPUD_VIA, S1, 0.55, { turn: 0.3 });
t = walk("spud", SPUD_VIA, SPUD_OUT, t, 0.8, { turn: 0.2 });
const SPUD_GONE = r3(t - 0.2);
A(r3(S1 + 0.3), "chip", "turn", { to: 0, dur: 0.45 });
A(r3(S1 + 0.35), "chip", "look", { to: [-0.4, 0.2], dur: 0.2, blink: false });

// ---------------------------------------------------------------- 6 ONLY CHIP, STILL BEEPING (the stare)
const ALONE = r3(SPUD_GONE - 0.1);
A(ALONE, "chip", "look", { to: AT_US, dur: 0.2, blink: false });
A(r3(ALONE + 0.1), "chip", "expr", { set: { curve: 0.5, eye: 1.05 }, dur: 0.2 });   // the innocent smile
// WEDGE (off screen, from the hallway): Chip?
const CHIPQ = r3(ALONE + 0.55);
say(3, CHIPQ);
A(r3(CHIPQ + 0.35), "chip", "look", { to: [-0.5, -0.05], dur: 0.15, blink: false });   // eyes slide away
A(r3(CHIPQ + 0.4), "chip", "expr", { set: { curve: 0.35, eye: 0.95, smirk: 0.25 }, dur: 0.2 });
{ // Mash, off screen behind the camera, strolls over to the doors (he is there when we cut to the reverse)
  const m = r3(ALONE + 0.2), hd = heading(MASH_OUT, MASH_H);
  A(m, "mash", "turn", { to: hd, dur: 0.3, ease: "linear" }); swingHold(ph, MASH_OUT, heading(MASH_VIA, MASH_OUT), hd, m, 0.3, PHONE_OFF, 3);
  A(r3(m + 0.3), "mash", "move", { to: MASH_H, dur: 0.9, ease: "inOut" }); ph.carry(r3(m + 0.3), offAt(MASH_H, hd, ...PHONE_OFF), 0.9, "inOut");
  A(r3(m + 1.25), "mash", "turn", { to: -175, dur: 0.6, ease: "linear" }); swingHold(ph, MASH_H, hd, -175, r3(m + 1.25), 0.6, PHONE_OFF, 4);
}
see(ALONE, r3(CHIPQ + 1.0), ["chip.face"], "only tiny Chip is left, and it still beeps");

// ---------------------------------------------------------------- 7 THE BUFFET (food spill: filled in once props-buffet.js is built)
const DROP1 = r3(CHIPQ + 0.85);        // one croissant slips out of the hem
const FLOOD = r3(DROP1 + 0.55);        // then everything
BEEP_END = r3(Math.floor((FLOOD + 1.45) / BEEP_PER) * BEEP_PER + BEEP_ON + 0.02);   // the end of the last beep that starts before the melon lands
// one sfx per beep, each 0.24 s (the synth's own 0.22 s on), so each beep has its own level: under the narrator low,
// under a friend's line lower, and full in the gaps (the alarm still carries the tension between the lines)
for (let k = 0; k * BEEP_PER < BEEP_END - 0.05; k++) {
  const b = r3(k * BEEP_PER), on = SPOKEN.filter(([a, e]) => b < e + 0.1 && b + BEEP_ON > a - 0.1);
  const gain = on.some((x) => x[2] === "narrator") ? 0.1 : on.length ? 0.15 : 0.3;
  sfx(b, "overload", { dur: 0.24, gain });
}
c.prop(r3(BEEP_END - 0.01), "sign", { over: 0, count: 3 }, 0.01);
const QUIET = BEEP_END;
// DESIGN-buffet.md (Fable): the food leaves at the hem (y 0.12-0.16, under the lumps' overhang) and flies out low,
// sideways and forward, never up at his face; the heap pours beside him (0.7 m to his right on screen... his own right,
// our left), a little further from the lens; the hoodie's lumps flatten in the design's order, the melon last.
const HEM = [CHIP0[0], 0.14, r3(CHIP0[1] + 0.27)];
const HEAP = [r3(CHIP0[0] - 0.7), r3(CHIP0[1] - 0.2)];
// [kind, extra spec, release time after FLOOD (s), v [x, y, z] m/s, spin, hem offset x]
const SPILL = [
  ["croissant", {}, -0.55, [-0.25, 0.1, 0.7], [0, 2, 3], 0.05],     // DROP1: the first one, alone (it was the tip at the hem)
  ["breadroll", {}, 0.0, [-0.8, 0.3, 0.6], [2, 0, 4], 0.0],
  ["sausage", {}, 0.08, [-0.6, 0.2, 1.0], [0, 6, 2], 0.06],
  ["croissant", {}, 0.15, [-1.1, 0.35, 0.5], [3, 1, 2], -0.04],
  ["waffle", {}, 0.24, [-0.7, 0.3, 0.9], [4, 0, 1], 0.02],
  ["apple", {}, 0.3, [-0.5, 0.15, 1.2], [5, 0, 0], 0.08],
  ["sausage", {}, 0.36, [-1.3, 0.25, 0.35], [0, 5, 1], -0.06],
  ["muffin", {}, 0.43, [-0.9, 0.3, 0.75], [1, 2, 3], 0.0],
  ["breadroll", {}, 0.5, [-0.4, 0.2, 1.1], [3, 1, 0], 0.05],
  ["banana", { n: 3 }, 0.57, [-1.0, 0.35, 0.6], [1, 3, 2], -0.02],
  ["egg", {}, 0.63, [-0.55, 0.1, 0.95], [2, 0, 3], 0.07],
  ["croissant", {}, 0.7, [-1.2, 0.3, 0.7], [2, 2, 1], -0.05],
  ["pancakestack", {}, 0.78, [-0.75, 0.25, 0.85], [0, 1, 0], 0.0],
  ["sausage", {}, 0.84, [-0.35, 0.15, 1.25], [0, 7, 1], 0.06],
  ["waffle", {}, 0.9, [-1.05, 0.3, 0.55], [3, 1, 2], -0.03],
  ["juicejug", {}, 0.97, [-0.65, 0.3, 0.8], [1, 0, 2], 0.03],
  ["apple", {}, 1.03, [-1.25, 0.2, 0.9], [4, 1, 0], -0.06],
  ["plate", { scale: 0.6 }, 1.08, [-0.9, 0.3, 0.6], [6, 0, 1], 0.0],
  ["melon", {}, 1.18, [-0.95, 0.45, 0.35], [0, 0, 3], 0.0],          // last and biggest: it lands on the heap
];
const BODY = { croissant: 0.08, sausage: 0.1, pancakestack: 0.05, melon: 0.12, breadroll: 0.1, banana: 0.08, juicejug: 0.05, waffle: 0.08, muffin: 0.08, apple: 0.15, egg: 0.1, plate: 0.1 };
const PARK = [CHIP0[0], -3, CHIP0[1]];   // under the lift floor until each one leaves the hoodie
props.push({ id: "stuff", kind: "hoodiestuff", wear: "chip", x: 0, y: 0, z: 0, fill: 1 });
props.push({ id: "heap", kind: "buffetheap", x: HEAP[0], y: -3, z: HEAP[1], r: 0.45, h: 0.45, seed: 7, fill: 0 });
c.prop(0, "heap", { fill: 0 }, 0.01);
c.prop(r3(FLOOD - 0.1), "heap", { y: 0 }, 0.01);   // parked under the floor until the pour (the friends walk through its spot)
c.prop(0, "stuff", { fill: 1 }, 0.01);
SPILL.forEach(([kind, extra, dt, v, spin, dx], i) => {
  const id = `food${i}`, at = r3(FLOOD + dt);
  props.push({ id, kind, x: PARK[0], y: PARK[1], z: PARK[2], in: 0, body: { bounce: BODY[kind] ?? 0.1, ...(kind === "pancakestack" && { friction: 0.9 }), ...(kind === "melon" && { friction: 0.7 }), ...(kind === "juicejug" && { density: 500, friction: 0.8 }) }, ...extra });
  const y = kind === "melon" ? HEM[1] + 0.02 : HEM[1] - 0.03;
  c.prop(r3(at - 0.034), id, { x: r3(HEM[0] + dx), y: r3(y), z: HEM[2], in: 1 }, 0.033, "linear");
  c.throw(at, id, { v, spin });
});
see(DROP1, r3(DROP1 + 0.5), ["chip.face", "food0"], "one croissant slips out of Chip's hoodie");
// the hoodie empties in the design's order: croissant tip + first roll at DROP1, the rest through the flood, the melon last
c.prop(r3(DROP1 - 0.1), "stuff", { fill: 0.84 }, 0.35, "out");
c.prop(FLOOD, "stuff", { fill: 0.12 }, 1.0, "linear");
c.prop(r3(FLOOD + 1.05), "stuff", { fill: 0 }, 0.18, "in");
c.prop(r3(FLOOD + 0.05), "heap", { fill: 1 }, 1.05, "linear");
see(FLOOD, r3(FLOOD + 1.3), ["chip.face", "heap"], "the whole breakfast buffet pours out of Chip's hoodie into a heap");
// Chip: the innocent smile cracks into an embarrassed grin as it comes out; he does not move his feet
A(r3(DROP1 + 0.05), "chip", "look", { to: [0.0, -0.7], dur: 0.15, blink: false });     // down at the croissant
A(r3(DROP1 + 0.35), "chip", "look", { to: AT_US, dur: 0.15, blink: false });            // back up at us, caught
A(r3(DROP1 + 0.35), "chip", "expr", { set: { curve: 0.25, eye: 1.2, open: 0.1 }, dur: 0.15 });
A(r3(FLOOD + 0.1), "chip", "face", { brow: 0.4, dur: 0.15 });
// foley: soft thuds that thicken, the plate's clatter, the jug's glass knock, the melon's deep thud on the heap
for (const [k, dt, g] of [[0, 0.3 - 0.55, 0.5], [1, 0.32, 0.5], [2, 0.42, 0.45], [3, 0.5, 0.55], [4, 0.6, 0.5], [5, 0.65, 0.5], [6, 0.73, 0.45], [7, 0.8, 0.55], [8, 0.88, 0.5], [9, 0.93, 0.5], [10, 1.02, 0.5], [11, 1.1, 0.55], [12, 1.17, 0.5]]) sfx(r3(FLOOD + dt), "kenney/impact-soft-medium", { gain: g });
sfx(r3(FLOOD + 1.3), "kenney/impact-glass-light", { gain: 0.5 });
sfx(r3(FLOOD + 1.38), "kenney/impact-plate-heavy", { gain: 0.5 });
sfx(r3(FLOOD + 1.45), "kenney/impact-soft-heavy", { gain: 0.8 });
const sorry = r3(QUIET + 0.3);
A(sorry, "chip", "look", { to: AT_US, dur: 0.15, blink: false });
act.sheepish(c, r3(sorry + 0.05), "chip");
// 8 CHIP: It was free!
const FREE = r3(sorry + 0.2);
const FREE_END = say(4, FREE);

// ---------------------------------------------------------------- 9 THE DOORS CLOSE ON THE FRIENDS (reverse, inside)
const REV = r3(FREE_END + 0.25);
for (const [w, at, yaw] of [["wedge", WEDGE_H, 180], ["spud", SPUD_H, 180]]) {
  A(r3(REV - 0.4), w, "move", { to: at, dur: 0.01, steps: 0 });   // off screen (behind the close-up's camera), so they stand there on the cut
  A(r3(REV - 0.4), w, "turn", { to: yaw, dur: 0.01 });
  A(REV, w, "look", { to: [0, -0.15], dur: 0.01, blink: false });
  A(REV, w, "expr", { expr: "deadpan", dur: 0.01 });
}
A(REV, "mash", "expr", { expr: "deadpan", dur: 0.01 });
A(r3(REV + 0.01), "mash", "look", { to: [0, -0.15], dur: 0.01, blink: false });   // Mash finally looks up from the phone
const CLOSE = r3(REV + 0.5);
c.prop(CLOSE, "doors", { open: 0 }, 0.9, "inOut");
sfx(CLOSE, "doorslide", { gain: 0.35, dur: 0.85 });
sfx(r3(CLOSE + 0.88), "latch", { gain: 0.5 });
const END = F(CLOSE + 1.15);
see(REV, CLOSE, ["wedge.face", "spud.face", "mash.face"], "the three friends stare in as the doors close");

// ---------------------------------------------------------------- shots
const WIDE = { pos: [0.15, 1.05, 6.6], look: [0.1, 0.85, -0.3], fov: 40 };
const WIDE2 = { pos: [0.12, 0.95, 5.6], look: [0.1, 0.75, -0.3], fov: 40 };
const WEDGE_MED = { pos: [-0.45, 0.95, 2.9], look: [-0.5, 0.65, 0.15], fov: 36 };
const TWO = { pos: [-0.85, 1.05, 2.7], look: [0.28, 0.5, -0.2], fov: 38 };
const CHIP_MED = { pos: [0.25, 0.55, 2.7], look: [0.28, 0.35, 0.2], fov: 38 };
const CHIP_CU = { pos: [0.28, 0.48, 2.0], look: [0.29, 0.38, 0.2], fov: 36 };
const REV_SHOT = { pos: [-0.45, 0.75, -0.95], look: [0.05, 0.8, 2.6], fov: 50 };
const beats = c.beats([
  ["packed", 0, { ...WIDE, to: WIDE2, dur: 2.2, ease: "out" }, "hook"],
  ["fine", FINE, WEDGE_MED],
  ["wedge out", r3(FINE + 0.95), WIDE2],
  ["your turn", TURN, TWO],
  ["spud out", S1, { ...WIDE2, to: { pos: [0.1, 0.8, 4.2], look: [0.2, 0.55, -0.1], fov: 40 }, dur: 1.3, ease: "inOut" }, "escalation"],
  ["only chip", ALONE, { ...CHIP_MED, to: CHIP_CU, dur: 1.6, ease: "inOut" }],
  ["the buffet", DROP1, { pos: [0.02, 0.85, 3.4], look: [0.0, 0.32, 0.2], fov: 40 }, "payoff"],
  ["it was free", FREE, CHIP_CU],
  ["doors", REV, REV_SHOT],
], END);

write(import.meta.url, {
  id: "take-the-lift",
  title: "One of them is too heavy",
  idea: "Friends try to 10: four friends in an overloaded lift step out one by one; tiny Chip alone still sets it off, because the whole hotel breakfast buffet is under his hoodie.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "elevator", seed: 3 },
  // real lift music (bossa muzak) under the alarm, from 0.0 to the end
  music: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", lowCut: 150, gain: 0.22 },
  sound: { sfx: 0.7, ambience: 0.06, guard: true, signature: false, surface: "indoor" },
  creative: { length: [12, 18] },
  hook: { show: ["wedge", "mash", "spud", "chip", "sign"], hint: 0, what: "four friends packed in a beeping lift; the narrator says one of them is too heavy" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "stuff", from: 0, to: END, checks: ["clipping", "costume-in-prop", "arm-in-prop"], reason: "his arms rest on the lumps; the lumps are worn: a patch of his own hoodie cloth over his belly (props-buffet.js hoodiestuff), built round his body" },
    { who: "mash", from: r3(M1 + 1.2), to: r3(M1 + 1.75), checks: ["reach", "limb-through-costume"], maxReach: 0.25, reason: "Mash walking out at the frame's right edge, out of frame: his phone hand brushes his hoodie for two frames mid-step" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/10-take-the-lift/make-take-the-lift.mjs.",
});
