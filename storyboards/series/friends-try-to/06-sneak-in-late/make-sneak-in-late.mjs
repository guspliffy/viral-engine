// MY FRIEND GROUP TRYING TO SNEAK IN LATE WITHOUT WAKING MOM (friends-try-to episode 6, 4 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-04-friends-try-to/06-sneak-in-late-ENGINE-PROMPT.md (v2), series format
// 00-SERIES-FORMAT.md, Jonny's eight panels storyboards/06-sneak-in-late/storyboard-eight-panels.png (they win; PANELS.md here).
//   node storyboards/series/friends-try-to/06-sneak-in-late/make-sneak-in-late.mjs -> sneak-in-late.json
//
// THE BRIEF
//   Joke:        3 a.m., four friends tiptoe in; every board creaks. The Wizard's silence spell blows the slippers up
//                into squeaky balloons, Viking lifts the Wizard and his hat tugs the coat stand over, Phoenix just
//                catches it; quiet Reaper rolls the runner rug out over the creaky boards and they all cross silently.
//   Wants:       to get in without waking Mom.
//   Consequence: a silent cheer; Viking, being helpful, gently closes the front door: its rusty hinge screams.
//   Ending:      the light under Mom's door snaps on and her big shadow falls along the hall; three glares at Viking.
//   Callback:    0 s a creak freezes them; 10 s a squeal from the one thing nobody thought of, and this time she's up.
//
// Places (set-nighthall.js NIGHTHALL: x right, z toward the camera; the hall runs away from us, -z). The front door is
// an opening in the left wall (z -1.9..-0.7) with the night outside; its leaf is hinged on the near jamb and stands
// wide open into the hall against the left wall (rot -75), its rusty hinges toward us. Mom's door is on the right wall
// at the far end (z -5.6).
import { clip, write as writeSb } from "../../../lib/clip.mjs";
import { nowRules } from "../../../lib/now-rules.mjs";
// v3 re-cuts also take today's template motion and picture flags (Jonny 7 Nov: "the new motion rules")
const write = (u, sb) => writeSb(u, V3 ? nowRules(sb) : sb);
import * as act from "../../../lib/acting.mjs";
import { NIGHTHALL } from "../../../../engine/page/set-nighthall.js";

const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
// --v3: the reach rules v3 opening (7 Nov 2026, research/hook-curiosity-2026-11-07 "Reach rules v3"; writes
// sneak-in-late-v3rules.json). Only 0-1.6 s changes: a medium two-shot of the Wizard (front) and Viking, Viking's
// whispered order "Shh… Mom's asleep." at 0.02 s, the Wizard's foot on the creaky board at 0.5 s (the freeze), a cut
// at 0.95 s to Viking's frozen close-up (the 0.65 s reaction hold), then the push in on the spell as posted.
const V3 = process.argv.includes("--v3");
const D0 = V3 ? 0 : 0.01;   // v3: frame-0 poses with dur 0, so frame 0 already shows them
const K = V3 ? 0.37 : 0;    // v3: the creak and the freeze come 0.37 s later, after the whisper
const END = 9.8;   // + two 3-frame hit-stops = 10.0 s of video (series format: a hard cut at 10.0)
const r3 = (x) => Math.round(x * 1000) / 1000;
const HW = NIGHTHALL.w / 2, DOOR = NIGHTHALL.door, MOMZ = NIGHTHALL.mom.z;
const HINGE = [-HW - 0.05, DOOR.z1];   // the front door's hinge: the near jamb

// ---------------------------------------------------------------- places
const BOARD = [0.6, 0.4];                       // the loose board (along z)
const STAND = [1.15, -0.45];                     // the coat stand (it leans toward the group, front left)
const RACK = [-HW + 0.17, 1.45];                // the shoe rack against the left wall, its front to +x
const SLIP = [[-0.9, 0.85, "#7da0d8", null], [-0.9, 1.32, "#e58fb0", null], [-0.9, 1.79, "#efe0c4", null], [-0.9, 2.26, "#7aa36a", "#2f4a2a"]];
const RUG0 = [-0.2, 0.95], RUG_L = 2.7;       // the runner's start (the roll), it unrolls toward us
// frame 0: bunched in from the door, tiptoeing toward us (Reaper back, Phoenix left, Viking middle, Wizard front-right)
const P0 = { rea: [-0.95, -1.65], phx: [-0.7, 0.2], vik: [-0.05, -0.85], wiz: [0.68, 0.45] };
// the lift: Viking steps in behind the Wizard and carries him toward the coat stand; the hat catches the beige coat
// Viking stands behind the Wizard, 0.78 m back along (0.6, 0.8), arms round his sides (brief: no intersection)
const WIZ_UP = [0.5, -0.75], VIK_LIFT = [0.5 - 0.468, -0.75 - 0.624], VIK_SET = [-0.2, -1.5];
const PHX_CATCH = [1.05, 0.35];
const REA_ROLL = [-0.2, 0.35];         // in front of the group, behind the roll (panel 5: Reaper at the front)
const REA_RUN0 = [-0.98, -1.3], REA_RUN = [-0.98, -0.1];   // round the left of Viking
// across the rug to the near end, where they cheer (panel 6: Wizard left, Viking middle back, Phoenix right, Reaper front)
const CHEER = { wiz: [-0.85, 4.0], rea: [-0.15, 3.25], phx: [0.6, 2.4], vik: [1.0, 1.2] };   // a diagonal past the slipper rack, seen from the right (four faces clear)
const WIZ_WAY0 = [0.5, 1.3];   // the Wizard goes round Reaper (still by the rug's start)   // past the slipper rack, a zigzag: back, front, back, front
const WIZ_WAY = [-0.2, 2.45];   // the Wizard keeps clear of the slippers until he is past them
// 8.0 on (the hall view): Viking back at the front door, the handle in his hand; the three in the near foreground
const VIK_DOOR = [-0.45, -1.8], VIK_SHUT = [-0.92, -1.92];
const END3 = { phx: [-0.5, 3.15], rea: [0.25, 2.3], wiz: [0.95, 1.25] };   // clear of the slipper rack   // low in the frame, Viking's face above their heads   // low in the frame, Viking's face above their heads

const WIZ = "sofa/wizard-staff";
const cast = [
  { id: "wiz", character: WIZ, at: P0.wiz, face: 15, expr: "worried", follow: 0.3, seed: 2.6 },
  { id: "phx", character: "duo/phoenix", at: P0.phx, face: 20, expr: "worried", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "vik", character: "elevator/viking", at: P0.vik, face: 10, expr: "worried", follow: 0.35, seed: 3.3 },
  { id: "rea", character: "notyet/reaper-noscythe", at: P0.rea, face: 25, expr: "deadpan", follow: 0.3, seed: 4.1 },
];
const props = [
  { id: "door", kind: "nightdoor", x: HINGE[0], z: HINGE[1], rot: -89, ticks: 5, tickSize: 0.42 },
  { id: "board", kind: "looseboard", x: BOARD[0], z: BOARD[1], l: 1.1 },
  { id: "stand", kind: "coatstand", x: STAND[0], z: STAND[1], rot: 107 },   // it tips toward us, away from the Wizard
  { id: "rack", kind: "shoerack", x: RACK[0], z: RACK[1], rot: 90 },
  ...SLIP.map(([x, z, color, check], i) => ({ id: `slip${i}`, kind: "slippers", x, z, rot: 90, color, ...(check && { check }) })),
  { id: "rug", kind: "runner", x: RUG0[0], z: RUG0[1], l: RUG_L, w: 0.9 },
  { id: "mom", kind: "momdoor", x: NIGHTHALL.mom.x, z: NIGHTHALL.far + 0.01, rot: 0, w: 0.85, reach: 7, boost: 1.9 },   // face-on at the far end (review A: edge-on it never read)
  { id: "torch", kind: "torchphone", x: P0.phx[0] + 0.2, y: 0.62, z: P0.phx[1] + 0.3, rot: 180, tilt: 38, scale: 1.5, r: 0.5 },
  { id: "dust", kind: "dustmotes", x: -0.4, y: 1.3, z: -0.6, n: 50, box: [2.4, 1.6, 3.0], color: "#b9c8ff" },
  { id: "moonbeam", kind: "lightbeam", x: -HW - 0.4, y: 2.0, z: (DOOR.z0 + DOOR.z1) / 2, rot: -90, tip: -28, len: 2.6, w: 1.3, color: "#8fa8ff", glow: 0.5 },
];

// ---------------------------------------------------------------- 01 ALREADY GOING WRONG 0-1.5
// tiptoe poses: crouched, arms up and out like a cartoon sneak, everyone mid-step
const TIP = { R: { o: [0.08, 0.55, 0.24] }, L: { o: [0.08, 0.55, 0.24] } };
for (const id of ["vik", "rea"]) { c.arm(0, id, "R", TIP.R, D0); c.arm(0, id, "L", TIP.L, D0); A(0, id, "crouch", { to: 0.5, dur: D0 }); }
A(0, "wiz", "crouch", { to: 0.5, dur: D0 }); c.arm(0, "wiz", "R", { o: [0.1, 0.45, 0.3] }, D0);   // low, clear of Viking's face behind him
A(0, "phx", "crouch", { to: 0.4, dur: D0 });
A(0, "phx", "grab", { prop: "torch", hand: "R", grip: [0.032, 0.03, 0], pose: null });
c.prop(0, "torch", { on: 1 }, D0);
c.prop(0, "door", { open: 0 }, D0);
for (const id of ["wiz", "phx", "vik", "rea"]) A(0, id, "look", { to: [0.1, -0.35], dur: D0, blink: false });
for (const id of ["wiz", "phx", "vik"]) { A(0, id, "expr", { expr: "worried", set: { curve: -0.1, open: 0 }, dur: D0 }); A(0, id, "face", { lid: 0.35, dur: D0 }); }   // sneaky, not a greeting (review B)
// the situation, spelled out (Jonny 5 Nov: "one doesn't understand the situation"): Mom asleep behind her door, z's
// floating from it at the start and just before her light snaps on (the hall shots that show her door clear); her "BOYS?!" when it does
if (V3) A(0.02, "vik", "talk", { line: "shh... moms asleep", tone: "calm", dur: 0.45, voice: false, soft: true });
if (V3) cap(0.02, 0.95, "Shh… Mom's asleep.", 470, false, { x: 300, size: 54, kinetic: false });   // one line, left of the Wizard's hat
else cap(0, 1.45, "Shh… Mom's asleep.", 470);
for (const t of [0, 0.6, 7.6, 8.1]) c.at(t, { fx: "zzz", pos: [NIGHTHALL.mom.x - 0.8, 0.9, NIGHTHALL.far + 0.15], dur: 1.2, count: 4, scale: 2.5 });
// the Wizard's foot lands on the loose board: it flexes, CREAK (hit-stop), everyone freezes
act.opener(c, "wiz", "eep!", { at: 0.05 + K, dur: 0.35, tone: "excited" });
c.prop(0.08 + K, "board", { flex: 1, tick: 1 }, 0.08, "out");
sfx(0.15 + K, "door-creak", { gain: 0.8, reason: "the loose floorboard's long creak under the Wizard's foot" });
c.hitStop(0.15 + K, 3);
c.prop(0.9 + K, "board", { tick: 0 }, 0.2);
for (const [i, id] of ["wiz", "vik", "phx", "rea"].entries()) {
  A(0.2 + K + i * 0.04, id, "expr", { expr: "shocked", set: { eye: 1.3, open: 0.35, curve: -0.45 }, dur: 0.1 });
  A(0.25 + K + i * 0.04, id, "look", { to: [0.75, 0.1], dur: 0.15, blink: false });   // all eyes down the hall to Mom's door
  A(0.3 + K, id, "still", { dur: 1.05 - K, idle: 0.1 });
}
if (V3) {   // before the creak Viking whispers at the Wizard; frozen, his eyes slide from Mom's door to the Wizard
  A(0, "vik", "look", { to: [0.45, -0.2], dur: 0, blink: false });
  A(1.15, "vik", "look", { to: [0.55, -0.15], dur: 0.12, blink: false });
}
A(1.42, "wiz", "expr", { expr: "eager", set: { curve: 0.3 }, dur: 0.25 }); A(1.45, "wiz", "look", { to: [0, 0.05], dur: 0.15 });
A(1.38, "rea", "expr", { expr: "annoyed", dur: 0.3 }); A(1.4, "rea", "look", { to: [0.6, -0.05], dur: 0.15 });
A(1.4, "vik", "expr", { expr: "worried", dur: 0.3 });
see(0, 0.3, ["wiz.face", "vik.face", "phx.face", "rea.face", "board"], "frame 0: the four tiptoe in, the Wizard on the creaky board");

// ---------------------------------------------------------------- 02 WIZARD'S SPELL 1.5-3.3
A(1.5, "wiz", "crouch", { to: 0, dur: 0.25 });
A(1.55, "wiz", "turn", { to: -55, dur: 0.3, ease: "inOut" });   // to the slippers
A(1.6, "wiz", "expr", { expr: "eager", set: { curve: 0.6, eye: 0.9 }, dur: 0.2 }); A(1.6, "wiz", "face", { lid: 0.35, dur: 0.2 });
A(1.75, "wiz", "talk", { line: "ive gott dis.", tone: "calm", dur: 0.55, voice: false, soft: true });
cap(1.9, 2.75, "I've got this.", 1200);
c.arm(2.05, "wiz", "R", { o: [0.3, 0.42, 0.42] }, 0.2, "out");   // the staff hand points down at the floor by the slippers
sfx(2.2, "charge", { gain: 0.4, reason: "the silence spell charging in the staff" });
// the spell leaves his pointing hand and streaks down to the rack (review A: cause and effect)
c.at(2.2, { fx: "poof", pos: [-0.1, 0.55, 0.25], dur: 0.3, color: "#c58bff", puffs: 1, sparks: 10, size: 0.2, lift: 0.05 });
c.at(2.26, { fx: "poof", pos: [-0.33, 0.42, 0.7], dur: 0.25, color: "#d9b0ff", puffs: 0, sparks: 8, size: 0.15, lift: 0 });
c.at(2.31, { fx: "poof", pos: [-0.55, 0.28, 1.15], dur: 0.25, color: "#d9b0ff", puffs: 0, sparks: 8, size: 0.15, lift: 0 });
c.at(2.35, { fx: "poof", pos: [-0.75, 0.15, 1.55], dur: 0.5, color: "#c58bff", puffs: 4, sparks: 16, size: 0.6, lift: 0.3 });
for (let i = 0; i < 4; i++) {
  const t = 2.45 + i * 0.12;
  c.prop(t, `slip${i}`, { puff: 1 }, 0.18, "out");
  sfx(t + 0.1, "pop", { gain: 0.35, reason: "a slipper blowing up into a balloon" });
}
c.prop(2.95, "slip1", { bob: 1 }, 0.05); c.prop(3.25, "slip1", { bob: 0 }, 0.05);
sfx(3.0, "creak", { gain: 0.3, dur: 0.25, reason: "the balloon slippers squeaking against each other" });
A(2.5, "wiz", "expr", { expr: "shocked", set: { eye: 1.25, open: 0.3 }, dur: 0.12 });
A(2.45, "phx", "look", { to: [-0.4, -0.5], dur: 0.12 }); A(2.5, "phx", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.5 }, dur: 0.12 });
act.mood(c, 2.75, "rea", "annoyed", { hold: 0.6 }); A(2.75, "rea", "look", { to: [0.6, 0.0], dur: 0.15 });   // Reaper glares at the Wizard
A(2.6, "vik", "expr", { expr: "shocked", set: { eye: 1.2 }, dur: 0.12 });
see(2.5, 3.2, ["wiz.face", "slip0", "slip1", "slip2", "slip3"], "the spell hits the slippers: four balloon slippers");

// ---------------------------------------------------------------- 03 VIKING LIFTS 3.3-4.5
A(3.25, "vik", "look", { to: [0.5, 0.0], dur: 0.12 });
A(3.3, "vik", "crouch", { to: 0, dur: 0.15 });
A(3.32, "vik", "move", { to: VIK_LIFT, dur: 0.35, steps: 2, ease: "inOut" });
A(3.32, "vik", "turn", { to: 37, dur: 0.3, ease: "inOut" });
A(3.35, "wiz", "turn", { to: 37, dur: 0.3, ease: "inOut" });   // his back to Viking (the gloves on his flanks), the staff back-right, clear of the stand
// both gloves on the Wizard's flanks (0.44 m either side of the line to him, 0.72 m ahead, at his middle)
// v3 (today's motion): the gloves a little wider, they pressed 10 cm into his flanks as he lifted off
const HUG = { o: [V3 ? 0.12 : 0.05, 0.85, 0.76] };
c.arm(3.45, "vik", "R", HUG, 0.15, "out"); c.arm(3.45, "vik", "L", HUG, 0.15, "out");
c.arm(3.5, "wiz", "R", { o: [0.3, 0.9, 0.15] }, 0.15, "out");   // out wider than the brim
A(3.27, "wiz", "look", { to: [0, -0.3], dur: 0.12 });
A(3.35, "wiz", "move", { to: WIZ_UP, dur: 0.3, steps: 2, ease: "inOut" });   // a step back toward Viking
A(3.6, "wiz", "fly", { to: { x: WIZ_UP[0], y: 0.38, z: WIZ_UP[1] }, dur: 0.35, ease: "out" });
A(3.6, "wiz", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.45 }, dur: 0.1 });
A(3.62, "vik", "expr", { expr: "angry", dur: 0.12 });
sfx(3.6, "cloth", { gain: 0.3, reason: "Viking scooping the Wizard up by the robe" });
// the hat brushes the beige coat: it tugs, the stand leans and wobbles toward us
c.prop(3.95, "stand", { tug: 1 }, 0.15, "out"); c.prop(4.05, "stand", { tilt: -17, wobble: 1 }, 0.4, "in");
sfx(4.05, "plank-rattle", { gain: 0.3, dur: 0.45, reason: "the wooden coat stand wobbling as it tips" });
A(4.1, "wiz", "look", { to: [0.6, 0.6], dur: 0.12 });
see(3.6, 4.4, ["wiz.face", "vik.face", "stand"], "Viking lifts the Wizard; the hat catches the coat; the stand tips");

// ---------------------------------------------------------------- 04 THE CATCH 4.5-5.5
A(3.7, "phx", "look", { to: [0.7, 0.2], dur: 0.12 });
A(3.85, "phx", "crouch", { to: 0, dur: 0.15 });
A(3.85, "phx", "move", { to: PHX_CATCH, dur: 0.55, steps: 3, ease: "inOut" }); A(3.85, "phx", "turn", { to: 40, dur: 0.25 });   // behind the roll, in front of the Wizard
c.arm(4.25, "phx", "L", { prop: "stand", grip: "pole" }, 0.2, "out");
A(4.45, "phx", "grab", { prop: "stand", hand: "L", grip: "pole", pose: null, keep: true });
c.prop(4.45, "stand", { wobble: 0.3 }, 0.1); c.prop(4.9, "stand", { wobble: 0 }, 0.3);
sfx(4.45, "hit-wood", { gain: 0.35, reason: "Phoenix's mitten closing on the coat stand's pole" });
A(4.5, "phx", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.4, curve: -0.2 }, dur: 0.1 });
A(4.55, "vik", "look", { to: [0.4, 0.25], dur: 0.12 }); act.mood(c, 4.6, "vik", "annoyed", { hold: 0.4 });   // Viking glares at the Wizard
A(4.8, "wiz", "look", { to: [0.5, -0.4], dur: 0.12 }); A(4.85, "wiz", "expr", { expr: "annoyed", set: { eye: 1.05 }, dur: 0.2 });   // Wizard glares at the torch
A(4.6, "rea", "look", { to: [0.4, 0.1], dur: 0.15 });
see(4.55, 5.45, ["phx.face", "stand", "vik.face", "wiz.face"], "Phoenix catches the coat stand; the pile freezes; Mom's door stays dark");
// the Wizard is set down, the stand stood back up
A(5.15, "wiz", "fly", { to: { x: WIZ_UP[0], y: 0, z: WIZ_UP[1] }, dur: 0.3, ease: "inOut" });
A(5.45, "vik", "move", { to: VIK_SET, dur: 0.3, steps: 2, ease: "inOut" });
// v3 (today's motion): the gloves come off his sides outward first, the straight drop to rest went through him
if (V3) { for (const s of ["R", "L"]) { c.arm(5.15, "vik", s, { o: [0.32, 0.85, 0.6] }, 0.12, "out"); c.arm(5.27, "vik", s, "rest", 0.3, "inOut"); } }
else { c.arm(5.15, "vik", "R", "rest", 0.3, "inOut"); c.arm(5.15, "vik", "L", "rest", 0.3, "inOut"); } c.arm(5.2, "wiz", "L", "rest", 0.3); c.arm(5.2, "wiz", "R", "rest", 0.3);
c.prop(5.2, "stand", { tilt: 0, tug: 0 }, 0.3, "inOut");
c.arm(5.5, "phx", "L", "rest", 0.25); A(5.5, "phx", "release", { prop: "stand", hand: "L", ...(V3 && { to: [STAND[0], 0, STAND[1]], dur: 0.05 }) });   // v3: physics is on; the stand stays standing on its own spot

// ---------------------------------------------------------------- 05 THE CALM FIX 5.5-7.2
A(4.95, "rea", "look", { to: [0.2, -0.5], dur: 0.15 });
A(4.5, "rea", "move", { to: REA_RUN0, dur: 0.25, steps: 1, ease: "in" });
A(4.75, "rea", "move", { to: REA_RUN, dur: 0.3, steps: 2 });
A(5.05, "rea", "move", { to: REA_ROLL, dur: 0.35, steps: 2, ease: "out" });
A(5.05, "rea", "turn", { to: 0, dur: 0.3 });
A(5.5, "rea", "crouch", { to: 1, dur: 0.2 }); A(5.5, "rea", "pitch", { to: 22, dur: 0.2 });
c.arm(5.55, "rea", "R", { o: [0.02, 0.15, 0.45] }, 0.15, "out"); c.arm(5.55, "rea", "L", { o: [0.02, 0.15, 0.45] }, 0.15, "out");
c.prop(5.75, "rug", { unroll: 1 }, 0.55, "in");
sfx(5.75, "cloth", { gain: 0.3, reason: "the thick rug unrolling along the boards" });
sfx(6.3, "land", { gain: 0.45, reason: "the rug landing flat with a soft thump" });
c.hitStop(6.3, 3);
c.at(6.3, { fx: "poof", pos: [RUG0[0], 0.04, RUG0[1] + RUG_L], dur: 0.5, color: "#c9b8a8", puffs: 7, sparks: 0, size: 0.4, lift: 0.05 });
A(5.8, "rea", "move", { to: [REA_ROLL[0], REA_ROLL[1] + 0.35], dur: 0.45, steps: 2 });
A(6.35, "rea", "crouch", { to: 0, dur: 0.2 }); A(6.35, "rea", "pitch", { to: 0, dur: 0.2 });
c.arm(6.4, "rea", "R", { o: [0.42, 0.42, 0.3] }, 0.2, "out");   // a calm hand along the rug: after you
A(6.4, "rea", "turn", { to: -30, dur: 0.2 });
A(6.4, "rea", "expr", { expr: "deadpan", set: { curve: 0.15 }, dur: 0.2 });
see(5.6, 6.3, ["rea.face", "rug"], "Reaper kneels and unrolls the rug over the creaky boards");
// one by one across the rug, silently, to the near end
// they start onto the rug in their own lanes (no crossing), then the cut at 7.2 finds them at its far end
A(6.45, "wiz", "move", { to: [0.45, -0.45], dur: 0.6, steps: 3, ease: "inOut" });
A(6.5, "phx", "move", { to: [0.95, 0.65], dur: 0.6, steps: 3, ease: "inOut" });
A(6.55, "vik", "move", { to: [-0.15, -1.2], dur: 0.6, steps: 3, ease: "inOut" });
c.arm(6.9, "rea", "R", "rest", 0.2, "inOut");
for (const [id, p] of Object.entries(CHEER)) A(7.18, id, "move", { to: p, dur: 0.01 });
for (const id of ["vik", "rea"]) A(7.18, id, "turn", { to: 15, dur: 0.01 });
A(7.18, "phx", "turn", { to: 5, dur: 0.01 });   // his face clear of the Wizard's hat (review B)   // to the camera at the right
A(7.18, "wiz", "turn", { to: -15, dur: 0.01 });   // the staff in front of him, clear of Reaper's face

// ---------------------------------------------------------------- 06 WE DID IT 7.2-8.0 (silent cheer)
for (const id of ["wiz", "phx", "vik", "rea"]) A(7.2, id, "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 0.15 }, dur: 0.12 });
// in a tight diagonal each fist stays off the neighbours: the Wizard (the end of the line) punches up on his free side,
// the others pump a fist in front of the chest
// (the bodies with their hands at rest are about 1 m across: in the cheer and the ending the hands stay in front)
const FIST_UP = { o: [0.3, 0.85, 0.15] }, FIST = { o: [-0.25, 0.38, 0.45] }, TUCK = { o: [-0.3, 0.28, 0.42] }, TORCH_LOW = { o: [0.0, 0.25, 0.3] };   // o[0] is out from the body edge: -0.3 brings the hand in front of the chest
c.arm(7.2, "wiz", "R", FIST_UP, 0.15, "out"); A(7.2, "wiz", "grip", { side: "R", shape: "fist", dur: 0.1 });
for (const id of ["vik", "rea"]) for (const sd of ["R", "L"]) { c.arm(7.2, id, sd, FIST, 0.15, "out"); A(7.2, id, "grip", { side: sd, shape: "fist", dur: 0.1 }); }
c.arm(7.2, "phx", "L", FIST, 0.15, "out"); A(7.2, "phx", "grip", { side: "L", shape: "fist", dur: 0.1 }); c.arm(7.18, "phx", "R", TUCK, 0.01);   // the torch low in front, under his face
for (const id of ["wiz", "phx", "vik", "rea"]) A(7.22, id, "hop", { height: 0.06, dur: 0.25 });
sfx(7.2, "ai/warm-resolve", { gain: 0.18, reason: "the hushed major chord as they cheer without a sound" });
see(7.25, 7.95, ["wiz.face", "phx.face", "rea.face", "vik.face"], "four beaming faces, safely past the boards");

// ---------------------------------------------------------------- 07 THE TINY UNDO 8.0-9.0 (the hall view)
// a cut: Viking is back at the front door with its handle in his hand, the three in the near foreground
c.arm(7.95, "wiz", "R", TUCK, 0.05); c.arm(7.95, "wiz", "L", "rest", 0.05);
c.arm(7.95, "phx", "R", TORCH_LOW, 0.05); c.arm(7.95, "phx", "L", TUCK, 0.05); c.arm(7.95, "rea", "R", TUCK, 0.05); c.arm(7.95, "rea", "L", TUCK, 0.05);   // arms folded in front: a glare pose
c.arm(7.95, "vik", "L", "rest", 0.05);
for (const [id, p] of Object.entries(END3)) A(7.97, id, "move", { to: p, dur: 0.02 });
A(7.97, "vik", "move", { to: VIK_DOOR, dur: 0.02 }); A(7.97, "vik", "turn", { to: -20, dur: 0.02 });
A(8.1, "vik", "move", { to: VIK_SHUT, dur: 0.55, steps: 2, ease: "inOut" });   // he steps along with the handle
c.prop(7.97, "door", { rot: 60 }, 0.02);
A(7.98, "vik", "grab", { prop: "door", hand: "R", grip: "handle", pose: null, keep: true });
A(7.98, "vik", "expr", { expr: "kind", set: { curve: 0.6, eye: 0.6 }, dur: 0.02 });
A(8.0, "vik", "talk", { line: "kwai-it-li...", tone: "calm", dur: 0.6, voice: false, soft: true });
cap(8.05, 8.75, "Quietly…", 600);
c.prop(8.1, "door", { rot: 90 }, 0.55, "inOut");
c.prop(8.15, "door", { squeal: 1 }, 0.05); c.prop(8.7, "door", { squeal: 0 }, 0.1);
c.textPop(8.15, "vik", "SQUEEEAK", { dur: 0.55 });   // the drawn squeal (review B: the door is edge-on at phone size)
sfx(8.15, "creak", { gain: 0.85, dur: 0.6, reason: "the rusty hinge's long SQUEAL as Viking eases the door shut" });
sfx(8.15, "ai/dundun", { gain: 0.6, reason: "the dö-döm of the tiny undo (series ending)" });
sfx(8.68, "latch-click", { gain: 0.3, reason: "the latch clicking home" });
for (const [i, id] of ["wiz", "phx", "rea"].entries()) { A(8.15, id, "squash", { amount: 0.06, dur: 0.07 }); act.shock(c, 8.2 + i * 0.05, id, { hold: 0.6, curve: -0.3, brow: 0.6 }); }
A(8.25, "vik", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.2 }, dur: 0.1 });
// Mom's light snaps on, her shadow falls along the hall
sfx(8.75, "click", { gain: 0.45, reason: "Mom's light switching on behind her door" });
c.prop(8.75, "mom", { on: 1, shadow: 0 }, 0.04);
cap(8.85, 9.8, "BOYS?!", 600);   // Mom, behind her door c.prop(8.9, "mom", { shadow: 1 }, 0.3, "out");
for (const id of ["wiz", "phx", "rea"]) A(8.15, id, "look", { to: [-0.5, 0.3], dur: 0.1, blink: false });   // eyes snap to Viking on the squeal
for (const id of ["wiz", "phx", "rea", "vik"]) A(8.8, id, "look", { to: [0.4, 0.05], dur: 0.12, blink: false });
see(8.1, 8.7, ["vik.face", "door"], "Viking eases the front door shut by its handle: the hinge squeals");
see(8.8, 9.0, ["mom"], "the light under Mom's door snaps on, her shadow falls along the hall");

// ---------------------------------------------------------------- 08 THE GLARE 9.0-10.0
A(8.9, "vik", "look", { to: [0.5, -0.1], dur: 0.15 });
act.sheepish(c, 9.0, "vik");
c.arm(9.0, "vik", "L", { o: [0.12, 1.02, -0.12] }, 0.25, "inOut");   // the free hand to the back of his head
for (const [i, id] of ["wiz", "rea", "phx"].entries()) {
  const t = r3(8.95 + i * 0.1);   // all three glaring by 9.6 s of video (the cover)
  // Viking is behind them, up and to the left on screen: the eyes slide over, the face stays to us
  A(t, id, "look", { to: [-0.7, 0.3], dur: 0.25, ease: "inOut", blink: false });
  A(t, id, "turn", { to: id === "wiz" ? -5 : id === "rea" ? 0 : -18, dur: 0.3, ease: "inOut" });   // Reaper only a little: his right hand would swing into Phoenix
  act.mood(c, t + 0.05, id, "angry", { hold: 0.7 });
}
see(9.3, 9.75, ["wiz.face", "phx.face", "rea.face", "vik.face", "mom"], "three glares at Viking under Mom's light and shadow");

// ---------------------------------------------------------------- shots
const A_HALL = { pos: [0.25, 1.75, 5.6], look: [-0.15, 0.6, -0.6], fov: 50 };   // 01-06: down the entry, the door at the left
const SPELL = { ...A_HALL, to: { pos: [0.15, 1.65, 5.0], look: [-0.4, 0.5, 0.8], fov: 50 }, dur: 1.4, ease: "inOut" };   // a push in on the Wizard and the slippers
const LIFT = { pos: [-0.2, 1.5, 5.0], look: [0.4, 0.95, -0.9], fov: 50 };
const FIX = { pos: [0.4, 2.0, 4.1], look: [-0.1, 0.25, 0.7], fov: 54 };   // high, so the rug rolls down the frame
const CHEER_S = { pos: [1.05, 1.9, 7.4], look: [-0.35, 0.55, 2.7], fov: 62 };
const B_HALL = { pos: [0.1, 2.45, 6.4], look: [-0.2, 0.45, -1.5], fov: 50 };   // under the ceiling (2.6 m): above it the camera sees only the ceiling's top   // high, so Viking shows over the three heads  // 07-08: turned down the hall to Mom's door
// v3: narrower lenses from the hall camera: the Wizard and Viking, then Viking frozen; the spell's push starts 0.1 s
// later and ends where it did
const TWO = { pos: A_HALL.pos, look: [0.3, 0.62, -0.2], fov: 31, to: { pos: A_HALL.pos, look: [0.3, 0.62, -0.2], fov: 28.5 }, dur: 0.95, ease: "linear" };
const VIKCU = { pos: A_HALL.pos, look: [-0.13, 0.58, -0.85], fov: 13 };
const OPENING = V3
  ? [["v3 two-shot: the order", 0, TWO, "hook"], ["v3 Viking frozen", 0.95, VIKCU, "reaction"], ["02 wizard's spell", 1.6, { ...SPELL, dur: 1.3 }]]
  : [["01 already going wrong", 0, A_HALL, "hook"], ["02 wizard's spell", 1.5, SPELL]];
// v3: the automatic blinks moved off the lines (Reaper's fell on the opening whisper, Viking's on "I've got this.")
if (V3) { act.blinksAt(c, "rea", [0.75, 5.0, 5.6]); act.blinksAt(c, "vik", [2.9, 6.0, 9.77]); }
const beats = c.beats([
  ...OPENING,
  ["03 viking lifts", 3.3, LIFT, "escalation"],
  ["04 the catch", 4.5, null],
  ["05 the calm fix", 5.5, FIX, "payoff"],
  ["06 we did it", 7.2, CHEER_S],
  ["07 the tiny undo", 8.0, B_HALL, "reveal"],
  ["08 the glare", 8.9, null],
], END);


write(import.meta.url, {
  id: V3 ? "sneak-in-late-v3rules" : "sneak-in-late",
  title: "My friend group trying to sneak in late without waking Mom",
  idea: "Friends try to, episode 6 (4 Nov 2026): every board creaks, a spell makes balloon slippers, the coat stand tips; Reaper rolls out the rug; Viking's gentle door close squeals and wakes Mom",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: "natural",
  set: { type: "nighthall", night: true, aperture: 0, focus: false },
  music: { style: "sneaky", bpm: 84, key: -3, gain: 0.2, lowCut: 150, payoff: 7.2, parts: [{ at: 0, part: "main" }, { at: 0.15, part: "stop" }, { at: 1.1, part: "main" }, { at: 8.3, part: "stop" }] },
  sound: { sfx: 0.7, ambience: 0.15, surface: "wood" },
  hook: { show: ["wiz", "vik", "phx", "rea", "board"], hint: 0.15, what: "four friends tiptoe in at night and the Wizard's foot lands on a creaking board" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "wiz", from: 3.45, to: 5.5, reason: "Viking lifts the Wizard with both arms round his sides and sets him down" },
    { who: "wiz", with: "stand", from: 3.85, to: 4.4, reason: "the Wizard's hat catches the hanging coat" },
    { who: "phx", with: "stand", from: 4.25, to: 5.6, reason: "Phoenix catches and holds the coat stand's pole" },
    { who: "vik", with: "door", from: 7.97, to: 10, reason: "Viking holds the front door's handle to the end" },
    { who: "rea", with: "rug", from: 5.5, to: 6.7, reason: "Reaper's hands on the roll as he unrolls it" },
    ...["vik", "wiz", "phx", "rea"].map((who) => ({ who, with: "moonbeam", from: 0, to: 10, reason: "the moonbeam is light through the door, nothing to bump into" })),
  ],
  notes: "Generated by storyboards/series/friends-try-to/06-sneak-in-late/make-sneak-in-late.mjs.",
});
