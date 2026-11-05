// MY FRIEND GROUP TRYING TO PITCH ONE TENT ("friends try to" episode 2, 5 Nov 2026), from the clip template.
//   node storyboards/series/friends-try-to/02-pitch-a-tent/make-pitch-a-tent.mjs -> pitch-a-tent.json (same folder)
// Brief: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/02-pitch-a-tent-ENGINE-PROMPT.md
// Jonny's eight panels: storyboards/02-pitch-a-tent/ there (PANELS.md here).
//
// THE BRIEF (exactly 10 s, Wizard, Viking, Phoenix, Reaper)
//   Joke:        the wind turns the tent into a sail, the Wizard's spell into a balloon that lifts Viking off his feet
//                on the guy rope, Phoenix's directions are useless; Reaper plants his scythe through the peak and the
//                tent snaps up perfect.
//   Wants:       everyone wants the tent up.
//   Consequence: they cheer; Viking kindly pulls the scythe out to hand it back ("You forgot this.") and the tent
//                folds down onto the Wizard.
//   Ending:      the glare at Viking, the Wizard a lump under the cloth with his hat tip poking out.
//   Callback:    frame 0 is the cloth flapping loose; the last frame is the cloth in a heap again.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { ending } from "../ending.mjs";
import { TENT, TENT_SIZE, ROPE_HAND } from "../../../../engine/page/props-tent.js";

const OPENER = { who: "wiz", line: "whoa!", words: false };
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const T0 = 7.0, END = 9.8;   // + two 3-frame hit-stops (the yank, the scythe) = exactly 10.0 s

// ---------------------------------------------------------------- places (x right, z toward the camera)
// The tent's root (the middle of its footprint) and how it moves: half pitched at R0, it floats off up and left in
// the wind (from +x, as in the panels: the leaves blow right to left), lands flat, and Reaper's pull slides the cloth's
// middle to P, where his scythe goes in and the dome stands.
// The painting lets the camera back only 0.7 m from its own spot (qa/env.mjs --range), and a 9:16 frame is only about
// half as wide as it is deep away, so the whole stage stands DZ further from the lens: four potatoes and a tent fit.
const DZ = -2.2, DX = 0.15, Z = (p) => [r3(p[0] + DX), r3(p[1] + DZ)];   // DX: the painting lets the camera sit only a little left
const R0 = Z([-0.05, -1.3]), RDRIFT = Z([-0.35, -1.3]), P = Z([-0.25, -1.45]);
const tentAt = (t, set, dur, ease = "inOut") => c.prop(r3(t), "tent", set, dur, ease);
// the guy rope's end in Viking's hand (props-tent ROPE_HAND, in the tent's frame)
const ROPE_W = (root) => [r3(root[0] + ROPE_HAND[0]), ROPE_HAND[1], r3(root[1] + ROPE_HAND[2])];
// P1 places (the panels: the Wizard left on the pole, Viking front kneeling at a peg, Phoenix front left on his
// phone, Reaper standing right with his scythe). A body-width (1 m) apart and more
// Phoenix stands close to the lens, front left, as in panels 2-5: low in the frame, so the Wizard behind shows over him
const WIZ0 = Z([-1.25, -1.2]), VIK0 = Z([0.95, -0.25]), PHX0 = Z([-0.6, 2.5]), REA0 = Z([1.15, -1.75]);
const WIZ_SLID = Z([-1.37, -1.15]);            // where the gust drags him (his feet slide)
const VIK_ROPE = Z([0.38, -1.2]);           // where he grabs the rope: its end up at his left glove (he faces us)
const VIK_OFF = [r3(VIK_ROPE[0] - R0[0]), 0, r3(VIK_ROPE[1] - R0[1])];   // his place in the tent's frame while he hangs
const WIZ_UNDER = Z([-1.25, -1.2]);            // under the cloth's left end when it drops
const VIK_UNDER = [r3(RDRIFT[0] + VIK_OFF[0]), r3(RDRIFT[1] + VIK_OFF[2])];   // under its right end (where the rope left him)
const WIZ_OUT = Z([-1.1, -0.8]), VIK_OUT = Z([0.85, -0.75]);   // crawled out at the two ends

const REA_PLANT = [r3(P[0] + 0.49), r3(P[1] - 0.18)];   // beside P, facing 20: his scythe fist half a metre out on his right, right over it
const REA_OUT = Z([0.8, -1.85]);               // a step back off the cloth before it snaps up
// the shared ending's places: in front of and beside the dome; the Wizard close on its left (the heap lands on him)
const AT = { wiz: Z([-1.4, -1.35]), vik: Z([-0.05, -0.62]), phx: PHX0, rea: Z([1.1, -1.2]) };
const VIK_END = Z([0.25, -0.3]);   // Viking steps back off the falling cloth with the scythe
// the scythe: Reaper's own (props-notyet parkedscythe: its origin is where his fist holds it, the shaft 0.55 below
// and 0.9 above it, the blade sweeping to +x at the top). He holds it upright beside him (fist 0.55 up: its foot on
// the grass)
const SCY0 = [r3(REA0[0] - 0.52), 0.55, r3(REA0[1] - 0.3)];   // half a metre out on his right (he faces -30)

const cast = [
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ0, face: 90, expr: "shocked", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "duo/viking", at: VIK0, face: -30, expr: "focused", follow: 0.3, seed: 4.1 },
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 20, expr: "kind", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, face: -30, expr: "deadpan", follow: 0.25, seed: 3.3 },
];
const PHONE = { id: "phone", kind: "phone", ...grips.placeFor("phone", [PHX0[0] + 0.37, 0.24, PHX0[1] + 0.13], 20), tip: -10, scale: 1.6, case: "#3d3d46" };
const W = TENT_SIZE;
const props = [
  // the tent: half pitched and flapping at frame 0. lumps (its own frame): A the Wizard and B Viking under the
  // dropped cloth (root RDRIFT), C the Wizard and D his staff under the heap at the end (root P)
  { id: "tent", kind: "camptent", x: R0[0], z: R0[1], [TENT.sail]: 1, [TENT.flutter]: 1,
    lumps: [
      [r3(WIZ_UNDER[0] - RDRIFT[0]), r3(WIZ_UNDER[1] - RDRIFT[1]), 0.55, 0.95],
      [r3(VIK_UNDER[0] - RDRIFT[0]), r3(VIK_UNDER[1] - RDRIFT[1]), 0.5, 0.9],
      [r3(AT.wiz[0] - P[0]), r3(AT.wiz[1] - P[1]), 0.6, 1.0],
      [r3(AT.wiz[0] + 0.37 - P[0]), r3(AT.wiz[1] + 0.44 - P[1]), 0.22, 1.15],
    ] },
  { id: "aura", kind: "spellaura", x: R0[0], y: 0.9, z: r3(-1.3 + DZ), w: 1.4, d: 1.0, scale: 0.001 },
  { id: "scythe", kind: "parkedscythe", x: SCY0[0], y: SCY0[1], z: SCY0[2], rot: 0 },
  { id: "peg", kind: "tentpeg", x: r3(0.7 + DX), z: r3(0.05 + DZ), sink: 0.25, rot: 20 },
  { id: "peg2", kind: "tentpeg", x: r3(-0.75 + DX), z: r3(-0.75 + DZ), sink: 0.7, rot: -30 },
  { id: "pack", kind: "backpack", x: r3(-1.25 + DX), z: r3(0.9 + DZ), rot: 25, color: "#45557a" },
  { id: "fire", kind: "firering", x: r3(1.05 + DX), z: r3(0.55 + DZ), r: 0.3 },
  { id: "leaves", kind: "windleaves", x: 0, y: 0, z: r3(-0.5 + DZ), w: 7, h: 2.0, d: 4, n: 40 },
  PHONE,
];

const SUB = 470, SUBS = { size: 62, kinetic: false };

// ---------------------------------------------------------------- 1 ALREADY GOING WRONG 0-1.5 (P1)
// no burned-in title: Jonny types it in-app (top 20 % clear for the first 2 s)
act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// the gust has the tent: the Wizard clings to the sail's pole, leaning back, his feet sliding
c.arm(0, "wiz", "R", { prop: "tent", part: "pole", grip: [-0.05, 0, 0.02], palm: true }, 0);
A(0, "wiz", "grip", { side: "R", shape: "fist", dur: 0 });
A(0, "wiz", "lean", { to: -22, dur: 0 });   // leaning back hard against the pull
A(0.1, "wiz", "move", { to: WIZ_SLID, dur: 1.1, ease: "inOut", steps: 0 });
A(0, "wiz", "look", { to: [0.6, 0.2], dur: 0, blink: false });
tentAt(0.1, { x: r3(R0[0] - 0.12) }, 1.1);   // the sail drags him along
sfx(0, "ridewind", { gain: 0.25, dur: 1.4, reason: "the gust that has the tent (it flaps, the leaves fly)" });
for (const t of [0.15, 0.6, 1.05]) sfx(t, "whoosh", { gain: 0.3, reason: "the cloth cracking like a sail in the gust" });
// Viking kneels at a peg and hammers it with his fist (no rock: a new hold needs Jonny's approval first)
A(0, "vik", "crouch", { to: 1, dur: 0 }); A(0, "vik", "lean", { to: 12, dur: 0 });
A(0, "vik", "look", { to: [-0.3, -0.5], dur: 0, blink: false });
A(0, "vik", "grip", { side: "R", shape: "fist", dur: 0 });
const PEG_UP = { o: [-0.02, 0.42, 0.3] }, PEG_DOWN = { o: [-0.04, 0.12, 0.42] };
c.arm(0, "vik", "R", PEG_UP, 0);
for (const t of [0.2, 0.55, 0.9, 1.25]) {
  c.arm(t, "vik", "R", PEG_DOWN, 0.1, "in"); c.arm(r3(t + 0.12), "vik", "R", PEG_UP, 0.18, "out");
  sfx(r3(t + 0.1), "put-down-metal", { gain: 0.5, reason: "Viking's fist on the metal peg: a tink" });
  c.prop(r3(t + 0.08), "peg", { drop: r3(0.12 * ([0.2, 0.55, 0.9, 1.25].indexOf(t) + 1)) }, 0.04, "out");
}
A(0.1, "vik", "expr", { expr: "focused", dur: 0.2 });
// Phoenix reads the instructions off his phone
const ph = grips.phone(c, "phx", PHONE, { side: "L" });   // low at his side (toward the middle of the frame), clear of his face
ph.secure(0, 0.01);
A(0, "phx", "look", { to: [0.1, -0.45], dur: 0, blink: false });
A(0, "phx", "crouch", { to: 1, dur: 0 });   // hunkered down over his phone: his crest stays under the back row's faces
// Reaper stands to the side with his scythe upright in his right fist, cloak flapping; he doesn't move
c.arm(0, "rea", "R", { prop: "scythe", grip: [0, 0, 0], palm: "wrap" }, 0);
A(0, "rea", "grip", { side: "R", shape: "fist", dur: 0 });
A(0, "rea", "look", { to: [-0.6, -0.1], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.48, dur: 0 });
see(0, 1.5, ["wiz.face", "vik.face", "phx.face", "rea.face", "tent"], "P1: the tent flaps like a sail, the Wizard hangs on, Viking hammers, Phoenix reads, Reaper watches");
act.blinksAt(c, "rea", [2.0, 5.05]); act.blinksAt(c, "phx", [1.2, 3.1]); act.blinksAt(c, "wiz", [1.35, 6.2]); act.blinksAt(c, "vik", [1.45, 6.25]);

// ---------------------------------------------------------------- 2 THE SPELL 1.5-3.3 (P2)
// Phoenix reads out the step, pointing the wrong way; the Wizard ignores him and points his staff
A(1.5, "phx", "look", { to: [-0.35, 0.3], dur: 0.12, blink: false });
A(1.95, "phx", "talk", { line: "pole A into sleeve B!", tone: "excited", dur: 0.8, voice: false });
c.cap(2.0, 2.85, "Pole A into sleeve B!", SUB, false, SUBS);
c.arm(1.6, "phx", "R", { o: [0.42, 0.5, 0.2] }, 0.2, "out"); A(1.62, "phx", "grip", { side: "R", shape: "point", dur: 0.1 });   // pointing off left: nowhere near the tent
c.arm(2.5, "phx", "R", "rest", 0.3, "inOut"); A(2.55, "phx", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
// the Wizard lets go, turns to us (his staff side then points away from the tent) and casts
c.arm(1.45, "wiz", "R", "rest", 0.3, "inOut"); A(1.45, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(1.45, "wiz", "lean", { to: 0, dur: 0.25 });
A(1.5, "wiz", "look", { to: [0.3, 0.3], dur: 0.12, blink: false });
A(1.55, "wiz", "turn", { to: -45, dur: 0.3 });   // his staff arm comes up on our side of the sail
A(1.6, "wiz", "expr", { expr: "cocky", dur: 0.25 }); A(1.6, "wiz", "face", { lid: 0.3, dur: 0.25 });
A(1.7, "wiz", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(1.8, "wiz", "L", { o: [0.2, 0.95, 0.15] }, 0.3, "out"); A(1.8, "wiz", "tilt", { to: [14, 6], dur: 0.3 });
const SPELL = 2.1;
A(SPELL, "wiz", "charge", { to: 1, dur: 0.3 });
sfx(SPELL, "charge", { gain: 0.35, dur: 0.9, reason: "the Wizard's spell on the tent" });
c.prop(SPELL, "aura", { scale: 1 }, 0.2, "out");
tentAt(SPELL, { [TENT.glow]: 1 }, 0.25);
tentAt(r3(SPELL + 0.05), { [TENT.sail]: 0, [TENT.ball]: 1 }, 0.45, "out");
tentAt(r3(SPELL + 0.05), { [TENT.rise]: 0.85, x: R0[0] }, 0.7, "out");   // its hem lifts over their heads as it puffs up
sfx(r3(SPELL + 0.1), "creak", { gain: 0.4, reason: "the cloth stretching tight as it puffs up into a balloon" });
c.prop(r3(SPELL + 0.25), "aura", { y: 1.6, x: R0[0] }, 0.8);
// Viking jumps up and grabs the guy rope as it lifts off the grass
A(2.15, "vik", "look", { to: [0.5, 0.4], dur: 0.12, blink: false });
A(2.2, "vik", "crouch", { to: 0, dur: 0.2 }); A(2.2, "vik", "lean", { to: 0, dur: 0.2 });
c.arm(2.2, "vik", "R", "rest", 0.25, "inOut"); A(2.2, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(2.25, "vik", "turn", { to: 0, dur: 0.2 });
A(2.25, "vik", "move", { to: VIK_ROPE, dur: 0.4, ease: "inOut", steps: 3 });
tentAt(2.45, { [TENT.rope]: 1 }, 0.35, "inOut");
c.arm(2.5, "vik", "L", { prop: "tent", part: "rope", grip: [0, 0, 0], palm: "wrap" }, 0.15, "out");
A(2.58, "vik", "grip", { side: "L", shape: "fist", dur: 0.08 });
sfx(2.62, "grab", { gain: 0.45, reason: "Viking's glove closing on the rope" });
A(2.6, "vik", "expr", { expr: "cocky", dur: 0.2 });
// Reaper looks at the Wizard; the Wizard's nervous grin
A(2.25, "rea", "look", { to: [-0.95, 0.1], dur: 0.15, blink: false });
act.mood(c, 2.3, "rea", "annoyed", { strength: 0.6, hold: 1.2 });   // the quiet one is not impressed
A(2.9, "wiz", "look", { to: [0.5, 0.45], dur: 0.12, blink: false });
act.grin(c, 2.95, "wiz");
see(2.3, 3.2, ["wiz.face", "tent", "vik.face"], "P2: the spell puffs the tent into a balloon; Viking grabs its rope");

// ---------------------------------------------------------------- 3 IT FLOATS 3.3-4.5 (P3)
const YANK = 3.45;
tentAt(3.38, { y: 0.95 }, 0.45, "out");
A(3.38, "vik", "ride", { prop: "tent", off: VIK_OFF, dur: 0.1 });
act.impact(c, YANK, "vik", { sound: "whoosh", gain: 0.5, stars: false, take: false });
act.shock(c, r3(YANK + 0.02), "vik", { open: 0.6, eye: 1.35, hold: 0.5 });
sfx(YANK, "door-creak", { gain: 0.45, reason: "the guy rope creaks tight as it yanks Viking off his feet" });
A(r3(YANK + 0.05), "vik", "talk", { line: "waaah", tone: "excited", dur: 0.5, voice: false });
// it drifts left with the wind, Viking dangling (legs kicking); the Wizard follows it underneath, looking up
tentAt(3.55, { x: RDRIFT[0] }, 0.8, "inOut");
for (const [t, k] of [[3.7, 1], [3.85, -1], [4.0, 1], [4.15, -1]]) A(t, "vik", "lean", { to: 6 * k, dur: 0.14 });
A(3.4, "wiz", "look", { to: [0.7, 0.6], dur: 0.12, blink: false });
A(3.45, "wiz", "turn", { to: -40, dur: 0.25 });   // staff side away from Viking overhead
A(3.55, "wiz", "move", { to: WIZ_UNDER, dur: 0.6, ease: "inOut", steps: 3 });
A(3.6, "wiz", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.12 });
A(3.5, "phx", "look", { to: [0.4, 0.6], dur: 0.12, blink: false });
A(3.55, "phx", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.12 });
A(3.5, "rea", "look", { to: [-0.6, 0.6], dur: 0.15, blink: false });
sfx(3.6, "windswell", { gain: 0.35, dur: 0.8, reason: "the wind carrying the balloon tent off" });
see(3.5, 4.2, ["vik.face", "tent", "wiz.face"], "P3: the balloon tent lifts Viking a metre off the grass and drifts off");
// the spell fades: it drops flat over both of them
const DROP = 4.25;
c.prop(4.1, "aura", { scale: 0.001 }, 0.2);
tentAt(4.05, { [TENT.glow]: 0 }, 0.2);
A(4.05, "wiz", "charge", { to: 0, dur: 0.2 });
c.arm(4.05, "wiz", "L", "rest", 0.35, "inOut"); A(4.05, "wiz", "tilt", { to: null, dur: 0.35 });
tentAt(DROP, { y: 0 }, 0.3, "in");
tentAt(r3(DROP + 0.05), { [TENT.ball]: 0, [TENT.rise]: 0, [TENT.flat]: 1, [TENT.shift]: 0.05, [TENT.rope]: 0 }, 0.3, "in");
tentAt(r3(DROP + 0.15), { [TENT.lumpA]: 1, [TENT.lumpB]: 1 }, 0.2, "out");
A(r3(DROP + 0.32), "vik", "ride", {});
A(r3(DROP + 0.32), "vik", "squash", { amount: 0.15, dur: 0.2 });
c.arm(r3(DROP + 0.02), "vik", "L", { o: [0.4, 0.25, 0.1] }, 0.15, "out"); c.arm(r3(DROP + 0.38), "vik", "L", "rest", 0.25, "inOut"); A(r3(DROP + 0.2), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
A(r3(DROP + 0.05), "wiz", "crouch", { to: 1, dur: 0.2 }); A(r3(DROP + 0.05), "wiz", "squash", { amount: 0.1, dur: 0.2 });
sfx(r3(DROP + 0.3), "cloth", { gain: 0.6, reason: "the cloth flops down over them" });
sfx(r3(DROP + 0.32), "thud", { gain: 0.35, reason: "Viking lands on the grass under it" });

// ---------------------------------------------------------------- 4 THE BLAME 4.5-5.5 (P4)
// they crawl out of the two ends and point at each other; Phoenix shows them his phone, both swat it away
const OUT = 4.65;
A(OUT, "wiz", "move", { to: WIZ_OUT, dur: 0.35, ease: "out", steps: 2 }); A(OUT, "wiz", "turn", { to: 35, dur: 0.3 });
A(OUT, "vik", "move", { to: VIK_OUT, dur: 0.35, ease: "out", steps: 2 }); A(OUT, "vik", "turn", { to: -40, dur: 0.3 });
tentAt(OUT, { [TENT.lumpA]: 0, [TENT.lumpB]: 0 }, 0.35, "inOut");
A(r3(OUT + 0.2), "wiz", "crouch", { to: 0, dur: 0.25 });
sfx(OUT, "cloth", { gain: 0.4, reason: "crawling out from under the cloth" });
A(4.95, "wiz", "look", { to: [0.75, 0.1], dur: 0.1, blink: false });
act.mood(c, 4.97, "wiz", "angry", { hold: 0.4 });
c.arm(5.0, "wiz", "R", { o: [0.25, 0.5, 0.4] }, 0.12, "out"); A(5.02, "wiz", "grip", { side: "R", shape: "point", dur: 0.08 });
A(4.98, "wiz", "talk", { line: "you let go!", tone: "excited", dur: 0.4, voice: false });
c.cap(4.95, 5.25, "You let go!", SUB, false, SUBS);
A(5.05, "vik", "look", { to: [-0.75, 0.1], dur: 0.1, blink: false });
act.mood(c, 5.07, "vik", "angry", { hold: 0.4 });
c.arm(5.1, "vik", "L", { o: [0.25, 0.5, 0.4] }, 0.12, "out"); A(5.12, "vik", "grip", { side: "L", shape: "point", dur: 0.08 });
A(5.1, "vik", "talk", { line: "YOU floated it!", tone: "excited", dur: 0.45, voice: false });
c.cap(5.25, 5.7, "YOU floated it!", SUB, false, SUBS);
// Phoenix holds his phone up where he stands (the instructions!): they wave it off from behind him
ph.carry(5.1, [r3(PHX0[0] + 0.42), 0.36, r3(PHX0[1] + 0.25)], 0.15, "out", { rot: 200, tip: -10 });
A(5.15, "phx", "expr", { expr: "eager", dur: 0.15 });
// both swat it away at once
c.arm(5.35, "wiz", "R", { o: [0.05, 0.45, 0.42] }, 0.1, "out"); c.arm(5.47, "wiz", "R", "rest", 0.3, "inOut");
c.arm(5.35, "vik", "L", { o: [0.05, 0.45, 0.42] }, 0.1, "out"); c.arm(5.47, "vik", "L", "rest", 0.3, "inOut");
A(5.47, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(5.47, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
sfx(5.4, "whoosh", { gain: 0.3, reason: "two gloves swatting the phone away" });
A(5.42, "phx", "lean", { to: -5, dur: 0.12 }); A(5.6, "phx", "lean", { to: 0, dur: 0.25 });
A(5.42, "phx", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.1 });
ph.carry(5.5, [r3(PHX0[0] + 0.37), 0.24, r3(PHX0[1] + 0.13)], 0.25, "inOut", { rot: 200, tip: -10 });
see(4.9, 5.5, ["wiz.face", "vik.face", "tent"], "P4: the two crawl out of the flat tent's ends and blame each other");

// ---------------------------------------------------------------- 5 THE CALM FIX 5.5-7.0 (P5)
// Reaper walks to the middle, pulls the cloth's middle to him and plants his scythe through it (THUNK, hit-stop):
// the cloth snaps up into a perfect dome round the shaft
A(5.0, "rea", "lean", { to: 3, dur: 0.15 }); A(5.15, "rea", "lean", { to: 0, dur: 0.3 });   // a sigh before he walks
A(5.2, "rea", "look", { to: [-0.5, -0.3], dur: 0.15, blink: false });
const WALK = 5.3, ARRIVE = 5.95;
A(WALK, "rea", "move", { to: REA_PLANT, dur: r3(ARRIVE - WALK), ease: "inOut", steps: 4 });
c.prop(WALK, "scythe", { x: r3(REA_PLANT[0] - 0.6), z: r3(REA_PLANT[1] + 0.12) }, r3(ARRIVE - WALK), "inOut");
A(5.8, "rea", "turn", { to: 20, dur: 0.25 });
sfx(5.35, "step-grass", { gain: 0.25, reason: "Reaper's steps across the grass" });
// the cloth's middle slides to him (he hooks it with his left hand as he arrives)
tentAt(5.75, { x: P[0], z: P[1], [TENT.shift]: 0 }, 0.3, "inOut");
c.arm(5.75, "rea", "L", { o: [-0.15, 0.25, 0.4] }, 0.2, "out"); c.arm(6.0, "rea", "L", "rest", 0.3, "inOut");
sfx(5.8, "cloth", { gain: 0.35, reason: "the cloth dragged across the grass" });
// lift and plant
c.prop(6.02, "scythe", { x: P[0], z: P[1], y: 0.75 }, 0.16, "out");
const THUNK = 6.26;
c.prop(6.18, "scythe", { y: 0.5 }, r3(THUNK - 6.18), "in");
act.impact(c, THUNK, "rea", { sound: "hit-wood", gain: 0.8, recoil: 0, squash: 0.08, look: [-0.2, 0.2], stars: false, take: false });
sfx(THUNK, "thud", { gain: 0.6, reason: "the scythe's shaft driven into the ground: the low half of the THUNK" });
act.landDust(c, r3(THUNK + 0.02), [P[0], P[1]], { color: "#cdbb8a", puffs: 6 });
c.arm(6.4, "rea", "R", "rest", 0.3, "inOut"); A(6.4, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(6.42, "rea", "move", { to: REA_OUT, dur: 0.3, ease: "inOut", steps: 2 });
const SNAP = 6.6;
tentAt(SNAP, { [TENT.flat]: 0, [TENT.dome]: 1, [TENT.peak]: 1, [TENT.flutter]: 0.25 }, 0.22, "out");
sfx(SNAP, "whoosh", { gain: 0.45, reason: "the cloth snapping up taut round the shaft" });
sfx(r3(SNAP + 0.2), "cloth", { gain: 0.5, reason: "the dome pulling tight" });
A(6.7, "rea", "turn", { to: -10, dur: 0.25 });
A(6.65, "rea", "look", { to: [-0.3, 0.1], dur: 0.15, blink: false });
A(6.7, "rea", "expr", { expr: "deadpan", dur: 0.2 }); A(6.7, "rea", "face", { lid: 0.5, dur: 0.2 });
for (const who of ["wiz", "vik", "phx"]) A(5.95, who, "look", { to: [0.3, 0.2], dur: 0.15, blink: false });
for (const [who, d] of [["wiz", 0], ["vik", 0.04], ["phx", 0.08]]) act.shock(c, r3(SNAP + 0.1 + d), who, { open: 0.55, eye: 1.3, hold: 0.25 });
// they step into the ending's places
// after the jaw drop, so the snap plays with the dome in clear view (review A)
A(6.75, "wiz", "move", { to: AT.wiz, dur: 0.3, ease: "inOut", steps: 2 });
A(6.75, "vik", "move", { to: AT.vik, dur: 0.3, ease: "inOut", steps: 2 });
A(6.75, "vik", "turn", { to: 0, dur: 0.25 }); A(6.75, "wiz", "turn", { to: -50, dur: 0.25 });

A(6.75, "rea", "move", { to: AT.rea, dur: 0.25, ease: "inOut", steps: 2 });
see(6.0, 6.5, ["rea.face", "scythe", "tent"], "P5: Reaper plants his scythe through the cloth's middle");
see(6.65, 6.98, ["tent", "scythe", "wiz.face", "vik.face", "phx.face"], "P5: the tent snaps up perfect round the scythe; jaws drop");

// ---------------------------------------------------------------- 6-8 THE SHARED ENDING (P6-P8)
const E = ending(c, {
  T0, at: AT,
  arms: { wiz: ["R"], vik: ["R", "L"], phx: ["R"], rea: ["L"] },
  cheerHop: ["vik"],   // not Phoenix: his phone hand stays put
  undo(U) {
    // Viking spots the scythe sticking out of the top, pulls it out with one easy tug and turns to hand it back
    A(r3(U - 0.12), "vik", "look", { to: [-0.2, 0.6], dur: 0.12, blink: false });
    A(U, "vik", "turn", { to: 160, dur: 0.25 });
    A(U, "vik", "expr", { expr: "kind", dur: 0.2 });
    c.arm(U, "vik", "R", "rest", 0.3, "inOut"); A(U, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
    c.arm(r3(U + 0.25), "vik", "L", { prop: "scythe", grip: [0, 0.5, 0], palm: "wrap" }, 0.15, "out");   // once he faces it
    A(r3(U + 0.34), "vik", "grip", { side: "L", shape: "fist", dur: 0.08 });
    const PULL = r3(U + 0.42);
    c.prop(PULL, "scythe", { y: 0.95 }, 0.15, "out");
    sfx(PULL, "grab", { gain: 0.5, reason: "the shaft sliding out of the ground" });
    tentAt(r3(PULL + 0.12), { [TENT.dome]: 0, [TENT.peak]: 0, [TENT.flat]: 1, [TENT.shift]: -0.75, [TENT.lumpC]: 1, [TENT.lumpD]: 1, [TENT.flutter]: 0.4 }, 0.35, "in");
    sfx(r3(PULL + 0.4), "cloth", { gain: 0.6, reason: "the tent folding down over the Wizard" });
    sfx(r3(PULL + 0.45), "thud", { gain: 0.25, reason: "the soft collapse" });
    A(r3(PULL + 0.3), "wiz", "crouch", { to: 0.6, dur: 0.15 });
    A(r3(PULL + 0.55), "wiz", "talk", { line: "mmf", tone: "calm", dur: 0.3, voice: false });
    // he turns back round with it to face us and Reaper
    A(r3(PULL + 0.15), "vik", "turn", { to: 35, dur: 0.3 });
    A(r3(PULL + 0.15), "vik", "move", { to: VIK_END, dur: 0.35, ease: "inOut", steps: 2 });
    // he carries it round to his left side and holds it upright by the shaft, as Reaper did (the blade up), held out to him
    c.prop(r3(PULL + 0.18), "scythe", { x: r3(0.73 + DX), y: 0.55, z: r3(-0.39 + DZ) }, 0.5, "inOut");
    c.cap(r3(PULL + 0.3), r3(PULL + 1.1), "You forgot this.", SUB, false, SUBS);
    A(r3(PULL + 0.35), "vik", "talk", { line: "you forgot this", tone: "calm", dur: 0.5, voice: false });
    act.grin(c, r3(PULL + 0.4), "vik");
  },
  sting: 0.54,
  glareGap: 0.22,
  glareShare: { wiz: 0.5, phx: 0, rea: 0.2 },   // Phoenix glares with his eyes only (the phone in his hand)
  rub: "R",
});
see(r3(E.glare + 0.3), 9.7, ["tent", "scythe", "wiz.hat"], "P8: the heap with the Wizard's hat tip, Viking holding the scythe out");

// ---------------------------------------------------------------- shots: Jonny's panels (one front view)
const WIDE = { pos: [0.3, 1.9, 3.9], look: [0.15, 0.85, r3(-1.2 + DZ)], fov: 52 };   // in close as in the panels, Phoenix big in the front; inside the painting's safe range (qa/env.mjs)
const beats = c.beats([
  ["P1-P2 going wrong, the spell", 0, WIDE, "hook"],
  ["P3-P4 it floats, it drops, the blame", 3.3, "keep"],
  ["P5 the calm fix", 5.5, "keep", "reaction"],
  ["P6-P8 cheer, undo, glare", T0, "keep"],
  ["P7 the undo", E.payoff, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "pitch-a-tent",
  title: "My friend group trying to pitch one tent",
  idea: "Friends try to, episode 2: the wind makes the tent a sail, the spell a balloon that lifts Viking off on its rope; Reaper plants his scythe through the middle and it snaps up perfect. Then Viking hands the scythe back.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 9.6,
  set: { type: "env", env: "lakeside-campsite", shade: "soft", aperture: 0, focus: false },
  music: { style: "warm", key: "C", lowCut: 150, gain: 0.3, until: E.musicStop },
  sound: { sfx: 0.7, ambience: 0.35, surface: "grass", room: "open", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["wiz", "vik", "phx", "rea", "tent"], hint: 0.1, what: "the tent flapping loose like a sail, the Wizard hanging on" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wiz", with: "tent", from: 0, to: 1.6, reason: "his glove on the sail's pole (the cloth round it)" },
    { who: "vik", with: "tent", from: 2.15, to: 5.1, reason: "his glove on the guy rope; then the dropped cloth lies over him and he crawls out" },
    { who: "wiz", with: "tent", from: 4.2, to: 5.1, reason: "the dropped cloth lies over him and he crawls out" },
    { who: "rea", with: "tent", from: 5.7, to: 6.75, reason: "he stands on the flat cloth to plant the scythe through its middle, and steps off before it snaps up" },
    { who: "rea", with: "scythe", from: 0, to: 6.45, reason: "his fist round his own scythe's shaft" },
    { who: "vik", with: "scythe", from: 7.9, to: 10, reason: "his fist round the scythe's shaft as he pulls it out and holds it out" },
    { who: "wiz", with: "tent", from: 8.3, to: 10, reason: "the tent folds down on top of him: he is the lump under the cloth, his hat tip poking out" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/02-pitch-a-tent/make-pitch-a-tent.mjs. Panels: PANELS.md.",
});
