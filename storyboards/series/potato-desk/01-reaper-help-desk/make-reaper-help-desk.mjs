// POTATO DESK 01 "Reaper's Help Desk" (format test, Jonny's go 17 Nov 2026: "lets try this, we could even create
// characters for the new scenes"). Brief and script: ../BRIEF.md episode 1. Design: ../DESIGN.md sections 0-2, 6.
//   node storyboards/series/potato-desk/01-reaper-help-desk/make-reaper-help-desk.mjs -> reaper-help-desk.json
//
// THE BRIEF
//   Joke:        Chip died three times on the same fry and wants a manager; the afterlife's help desk is Reaper.
//   Wants:       Chip wants his complaint heard (a manager, then a free fix).
//   Consequence: the free version is a 400-year wait: Chip waits it out in the waiting chair.
//   Ending:      same wide shot, centuries later: old Chip with a beard to the floor and cobwebs, ticket still in hand;
//                Reaper rings the bell, "NEXT.", and never looks up.
// Chain: Chip demands a manager, so Reaper is the manager, so Chip asks for HIS manager, so Reaper points up; Chip
// explains the fry, so Reaper types it and asks why he didn't pick it up, so "I was dead", so the third death is the
// fry again, so Reaper sells Premium, so Chip asks for free, so 400 years, please hold, so he waits, so old Chip, so NEXT.
// Feelings: outrage (0-12 s), curiosity (12-27), shame/laugh (27-29), dread (34-44), deadpan payoff (44-end).
// Opener A (the complaint is running at frame 0; the first line states the conflict with a number by 3.4 s).
// Departures from the brief (named in the delivery): captions in the upper third (Jonny 12 Nov rule) not low centre;
// no title box baked in (Jonny adds the title in the app; the band y 200-440 stays free for it); the brief's
// skeleton is old Chip with a beard and cobwebs (DESIGN.md section 2; no bones); Chip never picks the ticket up on
// screen: the jump cut covers it (one fewer hand prop, clip-lessons "count the props that pass through hands").
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { existsSync } from "node:fs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;

// measured spoken lengths (node qa/lines.mjs desk01-voice-probe.json, 17 Nov 2026), in LINES order
const DUR = [3.36, 1.11, 1.88, 2.15, 2.08, 2.23, 1.91, 1.45, 1.40, 1.21, 1.74, 6.16, 1.36, 0.70, 3.87, 0.75];
// the pause before each line (Reaper: ~0.4 s of silence before every answer, DESIGN.md section 6)
const GAP = [0.05, 0.45, 0.3, 0.95, 0.4, 0.55, 0.3, 0.5, 0.25, 0.5, 0.55, 1.7, 0.4, 0.55, 1.15, 0];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const HOLD = r3(END_OF(14) + 0.35);          // hold music starts after "Please hold."
const JUMP = r3(Math.round((HOLD + 2.2) * 30) / 30);   // on a frame                 // the jump cut: centuries later, same wide shot
T[15] = r3(JUMP + 1.6);                      // "NEXT." (+ the bell)
const END = r3(END_OF(15) + 2.0);

// ---------------------------------------------------------------- places (DESIGN.md section 0-1; x right, z toward us)
const REA = [-1.02, 0.1], CHIP = [0.45, 0.1], CHAIR = [0.75, -0.8];
const REA_YAW = 60, CHIP_YAW = -60;          // facing each other across the counter, 30 degrees toward the camera
// (facing +x, Reaper's RIGHT hand is the camera side; Chip, facing -x, has his LEFT hand toward us)
const TOP = 0.5;                             // the counter top
const OLD = existsSync(new URL("../../../../characters/potatobrawl/chip-old.json", import.meta.url)) ? "potatobrawl/chip-old" : "potatobrawl/chip";
// eye targets (+ right on screen, + up)
const AT_CHIP = [1, 0.05], AT_REA = [-1, 0.25], AT_SCREEN = [0.35, -0.35], AT_KEYS = [0.45, -0.85], UP = [0.15, 1], AT_TICKET = [-0.5, -0.8];

const cast = [
  { id: "rea", character: "notyet/reaper-noscythe", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.2, seed: 3.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP, face: CHIP_YAW, expr: "angry", follow: 0.4, seed: 1.9 },
  { id: "old", character: OLD, at: CHAIR, face: -25, expr: "deadpan", follow: 0.2, seed: 2.2 },
];

const STAMP = { id: "stamp", kind: "rubberstamp", ...grips.placeFor("rubberstamp", [-0.29, TOP, 0.5], REA_YAW), color: "#b43a23" };
const BELL = { id: "bell", kind: "callbell", x: -0.31, y: TOP, z: -0.02 };
const TICKET_AT = [-0.12, TOP + 0.002, 0.5];   // beside the stamp at the counter's near end: a short stamp path in front of the keys
const OFF = 9;                               // off stage (x): props that only exist after the jump
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.0, h: 4.0 },
  { id: "sign", staged: "screwed to the back wall", kind: "officesign", x: 0, y: 1.81, z: -1.29, w: 1.5, h: 0.42, lines: [["AFTERLIFE", 0.13], ["CUSTOMER SERVICE", 0.085]] },
  { id: "snail", staged: "on its wall bracket", kind: "ticketsnail", x: 0.35, y: 1.1, z: -1.27 },
  { id: "scythe", staged: "leaned against the back wall", kind: "parkedscythe", x: -1.18, y: 0.75, z: -1.12, rot: 0, tilt: -12 },
  { id: "counter", kind: "woodcounter", x: -0.15, y: 0, z: -0.375, rot: 90, w: 1.85, h: TOP, d: 0.5 },
  { id: "monitor", kind: "crtmonitor", x: -0.12, y: TOP, z: -0.55, rot: -45 },
  { id: "keys", kind: "keyboard", x: -0.31, y: TOP, z: 0.27, rot: -120 },
  STAMP, BELL,
  { id: "ticket", staged: "lies on the counter, off stage after the jump", kind: "ticket", x: TICKET_AT[0], y: TICKET_AT[1], z: TICKET_AT[2], tip: -90, rot: -90, num: "417" },
  { id: "marks", staged: "ink on the ticket, off stage after the jump", kind: "stampmarks", x: TICKET_AT[0], y: TOP + 0.006, z: TICKET_AT[2], at: [[0, 0, 8]], size: [0.045, 0.022], color: "#b43a23", count: 0 },
  { id: "chair", kind: "chair", x: CHAIR[0], y: 0, z: CHAIR[1], rot: -25 },
  { id: "fog", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-2.2, 0, -1.3], [2.2, 0.1, 1.2]], n: 22, size: 0.9, color: "#eef3f6", a: 0.6, drift: [-0.05, 0] },
  // after the jump: the aged ticket in old Chip's hand and the cobwebs (DESIGN.md section 2, A, B, D)
  { id: "oldticket", staged: "off stage until the jump, then in old Chip's hand", kind: "ticket", x: OFF, y: 0.5, z: 0, num: "417", age: 1 },
  { id: "webA", staged: "a cobweb strung between head, chair and wall", kind: "cobweb", x: OFF, y: 0, z: 0, pts: [[0.95, 1.2, -1.29], [0.6, 1.2, -1.29], [0.95, 0.85, -1.05]] },
  { id: "webB", staged: "a cobweb strung on the chair", kind: "cobweb", x: OFF, y: 0, z: 0, pts: [[0.55, 0.42, -0.62], [0.52, 0.12, -0.6], [0.78, 0.0, -0.5]] },
  { id: "webD", staged: "a cobweb in the sign's corner", kind: "cobweb", x: OFF, y: 0, z: 0, pts: [[-0.75, 1.6, -1.27], [-0.5, 1.6, -1.27], [-0.75, 1.36, -1.27]] },
];

// captions: upper third, under the band Jonny's in-app title takes (Jonny 12 Nov: never over faces)
const SUB = 470;
// the caption text: numbers as digits (most viewers read German: a number reads in any language)
const CAPTEXT = (l) => l.replace(/YOUR/, "your").replace(/DEAD/, "dead").replace("three times", "3 times").replace("four hundred years", "400 years");
const CAPS = {
  0: [[0.42, "Hi. I died 3 times today,"], [1, "and I'd like to speak to a manager."]],
  11: [[0.5, "Okay. I can offer you Premium Afterlife."], [1, "$9.99 a month. No fries."]],
};
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.45, T[i + 1] ?? END)), parts = CAPS[i] ?? [[1, CAPTEXT(line)]];
  let from = T[i];
  for (const [share, text] of parts) { const end = share === 1 ? to : r3(T[i] + DUR[i] * share); cap(from, end, text, SUB, false, { size: 64 }); from = end; }
};

// ---------------------------------------------------------------- Reaper's typing (two hands resting on the keys)
const KEYS = { id: "keys", kind: "keyboard", x: -0.31, y: TOP, z: 0.27, rot: -120, h: 0.03 };   // square in front of Reaper
const type = (t0, t1) => {   // alternate taps, a key sound on each
  let t = t0, s = 0;
  while (t < t1 - 0.2) {
    const side = "R", z = [-0.02, -0.06, 0.0, -0.04][s % 4];   // one finger, the camera-side hand (DESIGN.md: a bored clerk's habit)
    grips.rest(c, "rea", side, KEYS, [z, 0], t, { dur: 0.14, lift: 0.06 });
    grips.rest(c, "rea", side, KEYS, [z, 0], r3(t + 0.14), { dur: 0.12, lift: 0.095, ease: "out" });
    sfx(r3(t + 0.13), "ai/key-press", { gain: 0.35 });
    t = r3(t + 0.26 + (s % 3) * 0.04); s++;
  }
};
const handsDown = (t, dur = 0.3, ease = "settle") => { grips.rest(c, "rea", "R", KEYS, [-0.03, 0], t, { dur, lift: 0.095, ease }); };

// ---------------------------------------------------------------- frame 0: the complaint is already running
A(0, "old", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
A(0, "old", "hide");
handsDown(0);
A(0, "rea", "look", { to: AT_SCREEN, dur: 0.01, blink: false });
A(0, "rea", "face", { lid: 0.45, dur: 0.01 });
A(0, "chip", "look", { to: AT_REA, dur: 0.01, blink: false });
A(0, "chip", "lean", { to: 8, dur: 0.01 });
act.blinksAt(c, "rea", [2.1, 9.6, 21.4, 31.9, 40.2]);
act.blinksAt(c, "chip", [4.2, 14.6, 23.9, 30.9, 43.6]);
see(0, 3.4, ["chip.face", "rea.face"], "the customer complains to the clerk at frame 0");

// 1 CHIP: died three times, a manager. Reaper types on, eyes on the screen
say(0); type(0.4, END_OF(0) - 0.1);
// 2 REAPER: I am the manager (eyes stay on the screen; on "manager" they come to Chip)
say(1); A(r3(T[1] + 0.55), "rea", "look", { to: AT_CHIP, dur: 0.25 });
// 3 CHIP: your manager (smug)
A(r3(T[2] - 0.15), "chip", "expr", { expr: "smug", dur: 0.25 }); A(T[2], "chip", "lean", { to: 4, dur: 0.4, ease: "inOut" });
say(2);
// 4 REAPER points up, both look up: "He's... busy."
const P4 = r3(T[3] - 0.75);
c.arm(P4, "rea", "R", "up", 0.45, "inOut"); A(r3(P4 + 0.1), "rea", "look", { to: UP, dur: 0.3 });
A(r3(P4 + 0.35), "chip", "look", { to: [0.2, 1], dur: 0.3 });
say(3);
A(r3(END_OF(3) - 0.2), "rea", "look", { to: AT_SCREEN, dur: 0.25 }); handsDown(r3(END_OF(3) - 0.35), 0.6);
A(r3(END_OF(3) + 0.05), "chip", "look", { to: AT_REA, dur: 0.25 }); A(r3(END_OF(3)), "chip", "expr", { expr: "annoyed", dur: 0.3 });
see(P4, END_OF(3), ["rea", "rea.face", "chip.face"], "Reaper points up to his own manager");
// 5 CHIP: slipped on a fry / 6 REAPER types it: "Slipped... on... fry."
say(4);
say(5); type(r3(T[5] - 0.2), END_OF(5));
sfx(r3(T[5] + 0.1), "ai/key-press", { gain: 0.3 });
// 7 CHIP: the same fry / 8 REAPER (eyes to Chip): you didn't pick it up?
say(6);
A(r3(T[7] - 0.35), "rea", "look", { to: AT_CHIP, dur: 0.25 });
say(7);
// 9 CHIP: I WAS DEAD! (both arms up, a hop)
A(r3(T[8] - 0.1), "chip", "expr", { expr: "angry", dur: 0.12 });
c.arm(r3(T[8] - 0.05), "chip", "both", "up", 0.25, "out");
A(r3(T[8] + 0.05), "chip", "hop", { height: 0.06, dur: 0.3, quiet: true });
say(8);
c.arm(r3(END_OF(8) + 0.1), "chip", "both", "rest", 0.4, "inOut");
see(T[8], END_OF(8), ["chip.face"], "I WAS DEAD");
// 10 REAPER: and the third? / 11 CHIP (quiet, eyes down): I went back for the fry.
say(9);
A(r3(T[10] - 0.3), "chip", "expr", { expr: "sad", dur: 0.3 }); A(r3(T[10] - 0.25), "chip", "look", { to: [-0.2, -0.9], dur: 0.3 });
A(r3(T[10] - 0.2), "chip", "lean", { to: 0, dur: 0.4 });
say(10);
// the long stare (the pause before the payoff)
act.ma(c, r3(T[11]), ["rea", "chip"], { len: 1.2 });
A(r3(END_OF(10) + 0.2), "chip", "look", { to: AT_REA, dur: 0.3 });
see(END_OF(10), T[11], ["rea.face", "chip.face"], "Reaper's long stare");
// 12 REAPER: Premium Afterlife, 9.99 a month, no fries (a salesman's flat pitch, eyes on Chip)
say(11);
// 13 CHIP (hopeful): is there a free version?
A(r3(T[12] - 0.3), "chip", "expr", { expr: "eager", dur: 0.3 }); A(r3(T[12] - 0.3), "chip", "lean", { to: 6, dur: 0.4 });
say(12);
// 14 REAPER: "Yes." then the stamp on the ticket / 15 "Your waiting time is four hundred years. Please hold."
say(13);
const S0 = r3(END_OF(13) + 0.05);
A(r3(S0 - 0.1), "rea", "look", { to: AT_KEYS, dur: 0.2 });   // eyes to the stamp first
const h = grips.mug(c, "rea", STAMP, { side: "R" });
let ts = h.take(r3(S0 + 0.1), { reach: 0.55 });   // a slow reach from the keys: the palm turns over the whole reach
ts = h.carry(r3(ts + 0.02), [TICKET_AT[0], TOP + 0.12, TICKET_AT[2]], 0.3);
ts = h.carry(r3(ts + 0.05), [TICKET_AT[0], TOP + 0.004, TICKET_AT[2]], 0.12, "in");
sfx(r3(ts - 0.01), "knock", { gain: 0.7 }); c.prop(r3(ts - 0.01), "marks", { count: 1 }, 0.01);
ts = h.carry(r3(ts + 0.1), [TICKET_AT[0], TOP + 0.1, TICKET_AT[2]], 0.2);
// he sets the stamp down and keeps his hand on it (a let-go turned the palm in two frames)
ts = h.place(r3(ts + 0.05), [STAMP.x, TOP, STAMP.z], 0.35);
T[14] = Math.max(T[14], r3(ts - 0.4));
say(14);
A(r3(T[14] + 0.2), "rea", "look", { to: AT_SCREEN, dur: 0.3 });
A(r3(T[14] + 0.6), "chip", "look", { to: AT_TICKET, dur: 0.35 });
A(r3(T[14] + 0.6), "chip", "expr", { expr: "shocked", dur: 0.2 });
see(S0, END_OF(14), ["rea.face", "chip.face", "stamp"], "the stamp, the ticket, 400 years");
// the hold music; Chip deflates and looks at us (a sigh and a look into the lens, no hand moves next to the counter)
c.macro(r3(HOLD + 0.2), "chip", "sigh");
A(r3(HOLD + 0.55), "chip", "look", { to: [0.55, 0.05], dur: 0.4 });

// ---------------------------------------------------------------- the jump: centuries later, the same wide shot
const J = r3(JUMP - 0.02);   // placements on the cut: 0.02 s before it (clip-lessons)
A(J, "chip", "hide"); A(J, "old", "show");
c.prop(J, "ticket", { x: OFF }, 0.01); c.prop(J, "marks", { x: OFF }, 0.01);
for (const w of ["webA", "webB", "webD"]) c.prop(J, w, { x: 0 }, 0.01);
// old Chip holds his ticket on his knee (the thin pinch), from the jump on
const OT = { id: "oldticket", kind: "ticket", x: OFF, y: 0.5, z: 0, num: "417", age: 1 };
A(r3(J - 0.01), "old", "look", { to: [0.1, -0.2], dur: 0.01, blink: false });
A(r3(J - 0.01), "old", "face", { lid: 0.5, dur: 0.01 });
const OTAT = { x: 1.0, y: 0.44, z: -0.62, rot: -25 };   // beside the beard on his left (screen right), knee height
c.prop(J, "oldticket", OTAT, 0.01);
const ho = grips.thin(c, "old", { ...OT, ...OTAT }, { side: "L", from: 0.15 });
ho.secure(J, 0.01);
// Reaper keeps his hand on the stamp to the end (every let-go so far turned the palm in two frames)
A(r3(J - 0.01), "rea", "look", { to: AT_SCREEN, dur: 0.01 });
act.blinksAt(c, "old", [r3(JUMP + 0.8)]);
see(JUMP, END, ["old.face", "rea.face", "oldticket"], "old Chip, still waiting, ticket in hand");
// NEXT: Reaper's palm on the bell, eyes never leave the screen; old Chip's eyes come up, hopeful
grips.rest(c, "rea", "L", { ...BELL, h: 0.069 }, [0, 0], r3(T[15] - 0.35), { dur: 0.25, lift: 0.03 });
c.prop(r3(T[15] - 0.1), "bell", { press: 1 }, 0.05); sfx(r3(T[15] - 0.1), "ding", { gain: 0.55 });
c.prop(r3(T[15] + 0.05), "bell", { press: 0 }, 0.1);
grips.rest(c, "rea", "L", { ...BELL, h: 0.069 }, [0, 0], r3(T[15] + 0.1), { dur: 0.3, lift: 0.1 });
say(15);
A(r3(T[15] + 0.25), "old", "look", { to: [-0.9, 0.35], dur: 0.45 });
A(r3(T[15] + 0.3), "old", "face", { lid: 0.25, dur: 0.4 });

// ---------------------------------------------------------------- the one shot (DESIGN.md section 0)
const SHOT = { pos: [-0.2, 1.25, 10.4], look: [-0.2, 1.25, 0], fov: 25 };   // DESIGN.md section 0, 0.2 m lower and a touch tighter: the cast sits higher, less bare floor
const beats = c.beats([
  ["complaint", 0, SHOT, "hook"],
  ["the fry", T[4], "keep"],
  ["the stare", END_OF(10), "keep"],
  ["please hold", T[13], "keep", "payoff"],
  ["centuries later", JUMP, { pos: [-0.12, 1.25, 10.4], look: [-0.12, 1.25, 0], fov: 23.5 }],   // the jump cut: the same wide shot a touch closer (so it reads as a cut), centuries later
], END);

write(import.meta.url, {
  id: "reaper-help-desk",
  title: "When customer service is the afterlife",
  idea: "Potato Desk 01: Chip died three times on the same fry and complains at the afterlife's help desk; Reaper serves.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360],
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "#97a3a8", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // a light pizzicato bed under the talk, then the hold music (an elevator bossa, thin like a phone line) from "Please hold"
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.16, until: HOLD,
    then: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", from: HOLD, gain: 0.32, lowCut: 450 } },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false },
  creative: { length: [45, 70] },
  hook: { show: ["chip", "rea"], hint: 0, what: "a customer complains to Reaper at a help desk" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "old", with: "chair", from: 0, to: END, reason: "old Chip sits in the waiting chair" },
    { who: "rea", with: "counter", from: 0, to: END, checks: ["costume-in-prop"], reason: "Reaper's robe brushes the counter edge (2 cm of cloth) as he leans to the stamp and the bell" },
    { who: "old", with: "webA", from: JUMP, to: END, reason: "the cobweb hangs from old Chip's head to the wall" },
    { who: "old", with: "webB", from: JUMP, to: END, reason: "the cobweb spans old Chip's seat edge" },
  ],
  notes: "Generated by storyboards/series/potato-desk/01-reaper-help-desk/make-reaper-help-desk.mjs.",
});
