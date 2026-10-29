// VAMPIRE VS JUICE BOX (Jonny's story library #02, 28 Oct 2026), built from the clip template.
// node storyboards/juice/make-vampire-vs-juice-box.mjs -> storyboards/juice/vampire-vs-juice-box.json (+ -b)
//
// THE BRIEF (story library 02, ENGINE-PROMPT.md: 11.00 s, 330 frames, nine shots)
//   Joke:        Reaper's new vampire fangs make drinking a juice box harder; the Wizard silently supplies the straw.
//   Wants:       Reaper wants a drink, the vampire way.
//   Consequence: his bite and squeeze spray purple juice over the Wizard's cheek and forearm.
//   Ending:      Reaper proudly shows the useless fangs; the Wizard looks at his stained forearm, then a flat sideways
//                glance. Held. No loop, no tail.
//
//   01 0.00-0.50  wrong tool: the fangs already pressing into the carton's upper front      (a tiny cardboard creak)
//   02 0.50-1.00  pressure: both hands squeeze, two punctures, mouth lifts clear            (two puncture pops, a squirt)
//   03 1.00-1.80  splash: two short jets hit the Wizard's cheek and raised forearm           (a wet splat; music stops)
//   04 1.80-3.00  the silent solution: two-shot, his left hand opens, Reaper passes it in   (a dry blink, a rustle)
//   05 3.00-5.10  use the straw: carton steady in his left, the straw in his right, into the TOP port  (port pop)
//   06 5.10-6.50  give it back: Reaper receives with his right, supports with his left, then the Wizard lets go
//   07 6.50-8.00  it works: one sip through the straw                                         (a sip; music recovers)
//   08 8.00-9.40  still proud: mouth off the straw, the fangs shown off                       (a satisfied breath)
//   09 9.40-11.0  the cost of helping: the Wizard looks at his stained forearm, then a flat sideways glance. Hold.
//
// Hands: Reaper holds the carton in both hands to start; the Wizard's LEFT palm takes it from below and keeps it
// there for the straw (his RIGHT picks up the straw); Reaper takes it back in his right with his left supporting.
// Continuity: one carton (props-juice.js juicebox), one straw (bendystraw, swapped for the carton's own when it is
// in), the stains stay (face juiceL, stainL on the Wizard: his left cheek and forearm, the side toward Reaper).
import { clip, write, r3 } from "../lib/clip.mjs";
import { JUICE, CUP, strawEnd } from "../../engine/page/props-juice.js";

const c = clip(), { A, sfx } = c;
const END = 11.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const WIZ = [-0.47, 0.05], REA = [0.47, 0.02], WIZ_FACE = 24, REA_FACE = -24;
const TABLE_H = 0.24, TABLE_Z = 0.92, TABLE_D = 0.82;   // low, its back edge clear of the bodies (z 0.51)
const CS = 1.4, RC = -20;                       // the carton's scale and turn (its front toward the Wizard and camera)
const SS = 1.35;                                 // the straw's scale (the carton's own straw: SS / CS of the carton)
const W = JUICE.w * CS, H = JUICE.h * CS, D = JUICE.d * CS;
const STRAW_ROT = 90;                            // the inserted straw's bend: toward the carton's back (to Reaper's mouth)
// mouths on the faces (render --layout "mouth"), standing as cast
const MOUTH_REA = [0.32, 0.59, 0.35], MOUTH_REA_BITE = [0.321, 0.569, 0.355], MOUTH_WIZ = [-0.33, 0.603, 0.377];

const add = (a, b) => a.map((v, i) => r3(v + b[i]));
const rotY = (v, deg) => { const a = (deg * Math.PI) / 180; return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)]; };
// a point given in the carton's own frame (unscaled), in the world, for the carton's bottom centre at C
const onCarton = (C, p) => add(C, rotY(p.map((v) => v * CS), RC));
const GAP = 0.042;                               // a gloved hand's centre off the carton's side it holds
const sideR = (C, y = 0.42) => onCarton(C, [-(JUICE.w / 2 + GAP / CS), JUICE.h * y, 0]);   // the carton's -x side
const sideL = (C, y = 0.42) => onCarton(C, [JUICE.w / 2 + GAP / CS, JUICE.h * y, 0]);
const UP = 0.85;                                 // Reaper takes it back nearer its top: in the sip his fists stay clear of the table
const PALM = 0.03;                               // a cupped palm's centre under what it carries
const under = (C) => add(C, [0, -PALM, 0]);
const mid = (C, y = 0.42) => onCarton(C, [0, JUICE.h * y, 0]);

// where the carton's own straw stands (its foot), and the loose straw's grip, for the carton at C
const STRAW_FOOT = (C) => add(onCarton(C, [JUICE.port[0], JUICE.h, JUICE.port[1]]), [0, -JUICE.strawIn * SS, 0]);
const STRAW_TOP = (C) => add(STRAW_FOOT(C), rotY(rotY(strawEnd(), STRAW_ROT).map((v) => v * SS), RC));
// the Wizard's straw grip (Jonny's reference, 29 Oct): the straight shaft pinched between the thumb and index pads
// (grip "tip", the prop held at the pinch point), below the bend, so the lower shaft shows all the way into the foil.
// The arm poses aim the pinch itself (point "pinch"), so the hand stays aimed along the forearm and the wrist on the arm
// (the grip library's thin hold, storyboards/lib/grips.mjs, tested on the pencil): roll 20 shows the index over the
// camera side, the open hand comes in at -20 (no hand pop), and thin is the straw's radius in hand units
const S_GRIP = [0, 0.12, 0], G_S = S_GRIP[1] * SS;      // on the straw's own frame; its height above the foot in metres
const PINCH = { roll: 20, lean: 30, thin: r3((JUICE.strawR * SS) / 1.7) };
const READY = { ...PINCH, roll: -20, close: 0, curl: 0.7, index: 0.5 };   // open, the other fingers loose
const pinchAt = (p) => ({ world: p, point: "pinch" });

// the carton's keys (its bottom centre)
const C_BITE = add(MOUTH_REA_BITE, [0, -0.03 - H, 0]).map((v, i) => r3(v + rotY([0, 0, D / 2 - 0.022], RC)[i]));
const C_LOW = add(C_BITE, [-0.03, -0.06, 0.05]);           // lowered, sheepish, after the spray
const C_WIZ = [0.03, TABLE_H, 0.64];                     // set down in front of the Wizard for the straw
const C_DOWN = [0.1, TABLE_H + 0.035, 0.6];                // lowered in front of him, after the sip
// the paper cup of straws beside it (the Wizard came prepared), the one he takes standing in its middle, its bend
// already turned the way it will sit in the carton (rot = the carton's rot + STRAW_ROT), so it never turns in the hand
const CUP_AT = [-0.24, TABLE_H, 0.78], S_ROT = RC + STRAW_ROT, S_CUP = add(CUP_AT, [0, 0.036, 0]);
// the pinch point at each key: in the cup, lifted clear of it, its tip 4 cm over the port, on the foil, pushed in
const PORT = onCarton(C_WIZ, [JUICE.port[0], JUICE.h, JUICE.port[1]]), S_IN = STRAW_FOOT(C_WIZ);
const P_CUP = add(S_CUP, [0, G_S, 0]), P_UP = add(P_CUP, [0, CUP.h + 0.03, 0]);   // straight up until its tip clears the rim, then across
const P_ABOVE = add(PORT, [0, 0.04 + G_S, 0]), P_TOUCH = add(PORT, [0, G_S, 0]), P_IN = add(S_IN, [0, G_S, 0]);

// eye targets (face look space: + right on screen, + up)
const REA_AT_CARTON = [-0.2, -0.75], REA_AT_WIZ = [-0.75, -0.05], REA_AHEAD = [-0.1, 0.05], REA_DOWN = [-0.3, -0.6];
const WIZ_AT_REA = [0.75, -0.05], WIZ_AT_CARTON = [0.45, -0.55], WIZ_AT_STRAW = [-0.05, -0.75], WIZ_AT_PORT = [0.2, -0.6], WIZ_AT_ARM = [0.5, -0.85];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: WIZ_FACE, expr: "kind", follow: 0.25, seed: 2.6 },
  { id: "rea", character: "lookdev/reaper-crisp", at: REA, face: REA_FACE, expr: "focused", follow: 0.25, seed: 3.1 },
];
const props = [
  { id: "table", kind: "coffeetable", x: 0, z: TABLE_Z, h: TABLE_H, w: 2.8, d: TABLE_D, color: "#e9d3a8", leg: "#c9a273" },
  { id: "carton", kind: "juicebox", x: C_BITE[0], y: C_BITE[1], z: C_BITE[2], rot: RC, scale: CS, strawRot: STRAW_ROT, strawScale: r3(SS / CS),
    jets: [] },   // filled below, once the targets are known
  { id: "cup", kind: "papercup", x: CUP_AT[0], y: CUP_AT[1], z: CUP_AT[2], rot: 200, straws: 2, strawScale: SS },
  { id: "straw", kind: "bendystraw", x: S_CUP[0], y: S_CUP[1], z: S_CUP[2], rot: S_ROT, tip: 0, scale: SS },
];

// ---------------------------------------------------------------- frame 0: everything already in place
A(0, "wiz", "noblink"); A(0, "rea", "noblink");
A(0, "rea", "grab", { prop: "carton", hand: "both", grip: [0, JUICE.h * 0.42, 0], dur: 0, pose: null });
A(0, "rea", "arm", { side: "R", pose: { world: sideR(C_BITE), palm: mid(C_BITE) }, dur: 0 });
A(0, "rea", "arm", { side: "L", pose: { world: sideL(C_BITE), palm: mid(C_BITE) }, dur: 0 });
A(0, "rea", "grip", { side: "both", shape: "hold", dur: 0 });
A(0, "rea", "face", { fangs: 1, dur: 0 });
A(0, "wiz", "arm", { side: "R", pose: { world: [-0.66, TABLE_H + 0.035, 0.6] }, dur: 0 });
A(0, "wiz", "arm", { side: "L", pose: { world: [-0.26, TABLE_H + 0.035, 0.64] }, dur: 0 });
A(0, "wiz", "grip", { side: "both", shape: "paw", dur: 0 });

// ---------------------------------------------------------------- 01 WRONG TOOL 0.00-0.50
A(0, "rea", "look", { to: REA_AT_CARTON, dur: 0, blink: false });
A(0, "rea", "expr", { expr: "focused", set: { open: 0.42, curve: 0.1, eye: 0.85 }, dur: 0 });
A(0, "rea", "face", { brow: -0.2, dur: 0 });
A(0, "rea", "pitch", { to: 8, dur: 0 });
// bearing down on it: the paws start pressing in, the head stays on the bite
c.prop(0.08, "carton", { squeeze: 0.2 }, 0.4);
A(0.08, "rea", "arm", { side: "R", pose: { world: add(sideR(C_BITE), rotY([JUICE.press * CS * 0.2, 0, 0], RC)), palm: mid(C_BITE) }, dur: 0.4, ease: "inOut" });
A(0.08, "rea", "arm", { side: "L", pose: { world: add(sideL(C_BITE), rotY([-JUICE.press * CS * 0.2, 0, 0], RC)), palm: mid(C_BITE) }, dur: 0.4, ease: "inOut" });
A(0.1, "rea", "face", { brow: -0.35, dur: 0.3 });
A(0, "wiz", "look", { to: WIZ_AT_CARTON, dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "kind", set: { curve: 0.05, eye: 1.0, tilt: 0.3 }, dur: 0 });   // doubtful
A(0, "wiz", "face", { brow: 0.25, dur: 0 });
sfx(0.04, "creak", { gain: 0.16, dur: 0.35 });

// ---------------------------------------------------------------- 02 PRESSURE 0.50-1.00
const SQ = 0.75, press = JUICE.press * CS * SQ;
A(0.5, "rea", "arm", { side: "R", pose: { world: add(sideR(C_BITE), rotY([press, 0, 0], RC)), palm: mid(C_BITE) }, dur: 0.32, ease: "inOut" });
A(0.5, "rea", "arm", { side: "L", pose: { world: add(sideL(C_BITE), rotY([-press, 0, 0], RC)), palm: mid(C_BITE) }, dur: 0.32, ease: "inOut" });
c.prop(0.5, "carton", { squeeze: SQ }, 0.32);
A(0.5, "rea", "grip", { side: "both", shape: "fist", dur: 0.3 });   // squeezing
A(0.5, "rea", "squash", { amount: 0.03, dur: 0.35 });
c.prop(0.62, "carton", { holes: 1 }, 0.06, "out");
sfx(0.62, "puncture", { gain: 0.5 });
sfx(0.69, "puncture", { gain: 0.42 });
A(0.66, "rea", "pitch", { to: -4, dur: 0.2 });                      // mouth up and clear of the holes
A(0.66, "rea", "expr", { set: { open: 0.18, eye: 1.05 }, dur: 0.12 });
A(0.7, "rea", "look", { to: [-0.15, -0.55], dur: 0.12, blink: false });
c.prop(0.88, "carton", { jet: 1 }, 0.72, "linear");
sfx(0.88, "squirt", { gain: 0.55, dur: 0.38 });

// ---------------------------------------------------------------- 03 IMMEDIATE SPLASH 1.00-1.80
const HIT = 0.88 + 0.72 * 0.5;                                      // the jets land
const WIZ_GUARD = add(MOUTH_WIZ, rotY([0.2, -0.09, 0.13], WIZ_FACE));   // his raised left forearm, out beside the chin
A(0.92, "wiz", "arm", { side: "L", pose: { world: WIZ_GUARD }, dur: 0.22, ease: "out" });
A(0.92, "wiz", "grip", { side: "L", shape: "open", dur: 0.2 });   // a shielding palm, not a fist
A(0.95, "wiz", "turn", { to: 8, dur: 0.25 });                       // turning away from it
A(0.95, "wiz", "pitch", { to: -4, dur: 0.2 });
A(HIT - 0.04, "wiz", "face", { lid: 1, press: 0.8, brow: -0.15, dur: 0.08 });   // the eyes slam shut on the hit
A(HIT - 0.04, "wiz", "expr", { expr: "focused", set: { curve: -0.25, eye: 0.6 }, dur: 0.08 });
A(HIT, "wiz", "face", { juiceL: 1, dur: 0.05 });
A(HIT + 0.02, "wiz", "face", { stainL: 1, dur: 0.05 });
A(HIT, "wiz", "squash", { amount: 0.05, dur: 0.25 });
sfx(HIT, "splort", { gain: 0.6 });
c.textPop(HIT, "wiz", "SPLORT!", { dur: 0.5 });
A(1.0, "wiz", "still", { dur: 0.75, idle: 0.05 });
c.prop(1.3, "carton", { squeeze: 0 }, 0.25);                        // the pressure goes, the jets stop
A(1.3, "rea", "arm", { side: "R", pose: { world: sideR(C_BITE), palm: mid(C_BITE) }, dur: 0.25 });
A(1.3, "rea", "arm", { side: "L", pose: { world: sideL(C_BITE), palm: mid(C_BITE) }, dur: 0.25 });
A(1.3, "rea", "grip", { side: "both", shape: "hold", dur: 0.2 });
A(1.05, "rea", "look", { to: REA_AT_WIZ, dur: 0.15, blink: false });
A(1.05, "rea", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.2 }, dur: 0.15 });
A(1.05, "rea", "pitch", { to: 0, dur: 0.3 });

// ---------------------------------------------------------------- 04 THE SILENT SOLUTION 1.80-3.00
A(1.8, "wiz", "face", { lid: 0.3, press: 0.3, brow: 0, dur: 0.15 });   // eyes open: flat, dripping
A(1.8, "wiz", "expr", { expr: "deadpan", set: { curve: -0.1 }, dur: 0.2 });
A(1.8, "wiz", "pitch", { to: 0, dur: 0.3 });
A(1.85, "wiz", "turn", { to: WIZ_FACE, dur: 0.3 });
A(1.82, "wiz", "look", { to: WIZ_AT_REA, dur: 0.15, blink: false });
A(1.92, "wiz", "blink", { dur: 0.2 });
// the left hand opens, palm up: give it here. Reaper sets the carton down in front of him instead
A(2.1, "wiz", "arm", { side: "L", pose: { world: [0.0, TABLE_H + 0.09, 0.5] }, dur: 0.3, ease: "inOut" });
A(2.1, "wiz", "grip", { side: "L", shape: "cup", dur: 0.3 });
A(2.0, "rea", "expr", { expr: "sad", set: { curve: 0.15, eye: 0.95, open: 0 }, dur: 0.3 });   // sheepish
A(2.0, "rea", "face", { brow: 0.15, dur: 0.3 });
A(2.05, "rea", "look", { to: REA_DOWN, dur: 0.2, blink: false });
A(2.0, "rea", "arm", { side: "R", pose: { world: sideR(C_LOW), palm: mid(C_LOW) }, dur: 0.2 });
A(2.0, "rea", "arm", { side: "L", pose: { world: sideL(C_LOW), palm: mid(C_LOW) }, dur: 0.2 });
const C_SET = add(C_WIZ, [0.02, 0.03, -0.02]);
A(2.25, "rea", "arm", { side: "R", pose: { world: sideR(C_SET), palm: mid(C_SET) }, dur: 0.35, ease: "inOut" });
A(2.25, "rea", "arm", { side: "L", pose: { world: sideL(C_SET), palm: mid(C_SET) }, dur: 0.35, ease: "inOut" });
A(2.2, "wiz", "arm", { side: "L", pose: { world: [-0.02, TABLE_H + 0.26, 0.4] }, dur: 0.25, ease: "inOut" });   // up out of its way
A(2.6, "rea", "arm", { side: "R", pose: { world: sideR(C_WIZ), palm: mid(C_WIZ) }, dur: 0.1, ease: "out" });
A(2.6, "rea", "arm", { side: "L", pose: { world: sideL(C_WIZ), palm: mid(C_WIZ) }, dur: 0.1, ease: "out" });
A(2.7, "rea", "release", { prop: "carton", to: C_WIZ, dur: 0 });
sfx(2.7, "put-down", { gain: 0.35 });
sfx(2.3, "cloth", { gain: 0.45, reason: "the carton's light rustle as it is passed" });
A(2.74, "rea", "grip", { side: "both", shape: "open", dur: 0.12 });
// the hands open, come back over the table and settle as paws again
A(2.8, "rea", "arm", { side: "R", pose: { world: [0.14, TABLE_H + 0.09, 0.5] }, dur: 0.3, ease: "inOut" });
A(2.8, "rea", "arm", { side: "L", pose: { world: [0.62, TABLE_H + 0.09, 0.5] }, dur: 0.3, ease: "inOut" });
A(3.1, "rea", "arm", { side: "R", pose: { world: [0.3, TABLE_H + 0.035, 0.55] }, dur: 0.3, ease: "inOut" });
A(3.1, "rea", "arm", { side: "L", pose: { world: [0.68, TABLE_H + 0.035, 0.55] }, dur: 0.3, ease: "inOut" });
A(2.82, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
A(3.1, "rea", "grip", { side: "both", shape: "paw", dur: 0.3 });
// the Wizard's left hand steadies it from its far side (the palm flat on it), and keeps it there: over the top once
// Reaper's hands have left it, down beside it, then onto it
A(2.84, "wiz", "arm", { side: "L", pose: { world: add(C_WIZ, [0.1, H + 0.09, -0.05]) }, dur: 0.2, ease: "inOut" });
A(3.04, "wiz", "arm", { side: "L", pose: { world: add(sideL(C_WIZ), [0.04, 0.02, -0.03]), palm: mid(C_WIZ) }, dur: 0.18, ease: "inOut" });
A(3.22, "wiz", "arm", { side: "L", pose: { world: sideL(C_WIZ), palm: mid(C_WIZ) }, dur: 0.12, ease: "out" });
A(2.92, "wiz", "grip", { side: "L", shape: "flat", dur: 0.3 });
A(2.75, "wiz", "look", { to: WIZ_AT_CARTON, dur: 0.15, blink: false });

// ---------------------------------------------------------------- 05 USE THE STRAW 3.00-5.10
// thumb and index pinch the straight shaft below the bend (grip "tip"), lift it out of the cup, tip over the port,
// touch down, press it in along its length, open the fingers, then take the hand away
A(3.0, "wiz", "look", { to: WIZ_AT_STRAW, dur: 0.15, blink: false });
A(3.0, "wiz", "grip", { side: "R", shape: "tip", set: READY, dur: 0.3 });
A(3.05, "wiz", "arm", { side: "R", pose: pinchAt(add(P_CUP, [0, 0.035, 0])), dur: 0.3, ease: "inOut" });
A(3.35, "wiz", "arm", { side: "R", pose: pinchAt(P_CUP), dur: 0.12, ease: "out" });
A(3.45, "wiz", "grip", { side: "R", shape: "tip", set: PINCH, dur: 0.08 });
A(3.53, "wiz", "grab", { prop: "straw", hand: "R", point: "pinch", grip: S_GRIP, dur: 0, pose: null });
// out of the cup, straight up, then across to hang over the port
A(3.6, "wiz", "arm", { side: "R", pose: pinchAt(P_UP), dur: 0.28, ease: "inOut" });
A(3.88, "wiz", "arm", { side: "R", pose: pinchAt(P_ABOVE), dur: 0.36, ease: "inOut" });
A(3.75, "wiz", "look", { to: WIZ_AT_PORT, dur: 0.2, blink: false });
A(3.6, "wiz", "still", { dur: 1.4, idle: 0.08 });
// aim, touch the foil, then press straight down along the straw
A(4.3, "wiz", "arm", { side: "R", pose: pinchAt(P_TOUCH), dur: 0.14, ease: "inOut" });
A(4.52, "wiz", "arm", { side: "R", pose: pinchAt(P_IN), dur: 0.2, ease: "in" });
const POP = 4.52 + 0.2 * 0.35;
c.prop(POP, "carton", { port: 1 }, 0.05, "out");
sfx(POP, "puncture", { gain: 0.4 });   // the straw through the foil
A(4.52, "wiz", "squash", { amount: 0.015, dur: 0.25 });
// the carton's own straw takes over where the held one is, the fingers open, then the hand leaves (up, then away)
c.prop(4.74, "straw", { scale: 0 }, 0);
c.prop(4.74, "carton", { straw: 1 }, 0);
A(4.74, "wiz", "release", { prop: "straw" });
A(4.74, "wiz", "grip", { side: "R", shape: "tip", set: { ...PINCH, close: 0 }, dur: 0.12 });   // only the thumb opens
A(4.88, "wiz", "arm", { side: "R", pose: pinchAt(add(P_IN, [-0.01, 0.08, -0.01])), dur: 0.16, ease: "out" });
A(5.04, "wiz", "arm", { side: "R", pose: { world: [-0.66, TABLE_H + 0.035, 0.6] }, dur: 0.46, ease: "inOut" });
A(5.04, "wiz", "grip", { side: "R", shape: "paw", dur: 0.3 });

// ---------------------------------------------------------------- 06 GIVE IT BACK 5.10-6.50
// the Wizard lets go and sits back; Reaper takes it in both hands, right then left, and lifts it
A(5.12, "wiz", "grip", { side: "L", shape: "open", dur: 0.12 });
A(5.14, "wiz", "arm", { side: "L", pose: { world: add(sideL(C_WIZ), [0.03, 0.01, -0.12]) }, dur: 0.16, ease: "out" });   // back off its side, low behind it (never up by Reaper's face), then home
A(5.3, "wiz", "arm", { side: "L", pose: { world: [-0.1, TABLE_H + 0.12, 0.47] }, dur: 0.22, ease: "inOut" });
A(5.52, "wiz", "arm", { side: "L", pose: { world: [-0.26, TABLE_H + 0.035, 0.64] }, dur: 0.3, ease: "inOut" });
A(5.45, "wiz", "grip", { side: "L", shape: "paw", dur: 0.3 });
A(5.2, "rea", "look", { to: [-0.45, -0.5], dur: 0.15, blink: false });
A(5.2, "rea", "expr", { expr: "eager", set: { open: 0, eye: 1.05 }, dur: 0.25 });
A(5.62, "rea", "arm", { side: "R", pose: { world: add(sideR(C_WIZ, UP), [0.02, -0.03, -0.06]) }, dur: 0.24, ease: "inOut" });   // beside it, then in onto its side (the palm turns on in the last move)
A(5.86, "rea", "arm", { side: "R", pose: { world: sideR(C_WIZ, UP), palm: mid(C_WIZ, UP) }, dur: 0.12, ease: "out" });
A(5.62, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(5.9, "rea", "grip", { side: "R", shape: "hold", dur: 0.1 });   // the fingers close as it arrives
A(5.6, "rea", "arm", { side: "L", pose: { world: sideL(C_WIZ, UP), palm: mid(C_WIZ, UP) }, dur: 0.35, ease: "inOut" });
A(5.65, "rea", "grip", { side: "L", shape: "hold", dur: 0.3 });
A(6.0, "rea", "grab", { prop: "carton", hand: "both", grip: [0, JUICE.h * UP, 0], pose: null });
sfx(6.0, "cloth", { gain: 0.25, reason: "quiet handling as Reaper takes the carton" });

// ---------------------------------------------------------------- 07 IT WORKS 6.50-8.00
// the carton comes up until the straw's end is at his lips
const SIP = MOUTH_REA, C_SIP = add(C_WIZ, SIP.map((v, i) => v - STRAW_TOP(C_WIZ)[i]));
const REA_HANDS = (C) => [{ world: sideR(C, UP), palm: mid(C, UP) }, { world: sideL(C, UP), palm: mid(C, UP) }];
A(6.5, "rea", "look", { to: [-0.1, -0.6], dur: 0.15, blink: false });
A(6.5, "rea", "arm", { side: "R", pose: REA_HANDS(C_SIP)[0], dur: 0.45, ease: "inOut" });
A(6.5, "rea", "arm", { side: "L", pose: REA_HANDS(C_SIP)[1], dur: 0.45, ease: "inOut" });
A(6.8, "rea", "expr", { expr: "kind", set: { open: 0.08, curve: 0.1, eye: 0.9 }, dur: 0.15 });
A(6.95, "rea", "face", { lid: 0.7, dur: 0.2 });
sfx(7.0, "ai/sip", { gain: 0.4 });
A(7.0, "rea", "squash", { amount: 0.03, dur: 0.5 });
A(7.5, "rea", "face", { lid: 0.2, brow: 0.3, dur: 0.2 });               // it works: eyes open, delighted
A(7.5, "rea", "expr", { expr: "delighted", set: { open: 0.1 }, dur: 0.25 });

// ---------------------------------------------------------------- 08 STILL PROUD 8.00-9.40
A(8.0, "rea", "arm", { side: "R", pose: REA_HANDS(C_DOWN)[0], dur: 0.45, ease: "inOut" });
A(8.0, "rea", "arm", { side: "L", pose: REA_HANDS(C_DOWN)[1], dur: 0.45, ease: "inOut" });
A(8.25, "rea", "look", { to: REA_AHEAD, dur: 0.2, blink: false });
A(8.35, "rea", "pitch", { to: -6, dur: 0.35 });                      // chin up
A(8.35, "rea", "expr", { expr: "delighted", set: { open: 0.6, curve: 1, eye: 0.7, tilt: 0.1 }, dur: 0.3 });
A(8.35, "rea", "face", { lid: 0.5, fangs: 1, dur: 0.3 });
// the right hand keeps the carton, the left points at the fangs (the storyboard's last panel)
A(8.5, "rea", "grab", { prop: "carton", hand: "R", grip: [-(JUICE.w / 2 + GAP / CS), JUICE.h * UP, 0], pose: null });
A(8.55, "rea", "arm", { side: "L", pose: { world: add(MOUTH_REA, rotY([0.27, -0.05, 0.0], REA_FACE)) }, dur: 0.35, ease: "inOut" });
A(8.6, "rea", "grip", { side: "L", shape: "point", dur: 0.25 });
A(8.7, "rea", "face", { lid: 0.6, dur: 0.2 });                      // eyes squeezed in a proud grin
sfx(8.4, "kenney/cloth", { gain: 0.08, reason: "a tiny satisfied breath as the chin goes up" });
A(8.35, "rea", "still", { dur: 1.9, idle: 0.1 });

// ---------------------------------------------------------------- 09 THE COST OF HELPING 9.40-11.0
A(9.4, "wiz", "look", { to: WIZ_AT_ARM, dur: 0.25, blink: false });
A(9.4, "wiz", "turn", { to: 6, dur: 0.3 });                         // front on: the two silhouettes part
A(9.4, "wiz", "arm", { side: "L", pose: { world: [-0.3, 0.55, 0.6] }, dur: 0.4, ease: "inOut" });   // the stained forearm up beside the stained cheek
A(9.4, "wiz", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
A(9.45, "wiz", "pitch", { to: 5, dur: 0.3 });
A(9.5, "wiz", "expr", { expr: "deadpan", set: { curve: -0.2 }, dur: 0.3 });
A(10.15, "wiz", "look", { to: WIZ_AT_REA, dur: 0.18, blink: false });   // the flat sideways glance
A(10.15, "wiz", "pitch", { to: 0, dur: 0.3 });
A(10.15, "wiz", "turn", { to: 16, dur: 0.25 });                     // the head carries the glance
A(10.15, "wiz", "face", { lid: 0.42, dur: 0.2 });
A(10.2, "wiz", "still", { dur: 0.8, idle: 0.06 });
A(10.3, "rea", "look", { to: REA_AT_WIZ, dur: 0.25, blink: false });   // his waiting-for-praise grin meets the glance
A(10.3, "rea", "pitch", { to: -9, dur: 0.3 });

// the jets' targets: his left cheek, and his forearm at the guard
const CHEEK_WIZ = add(MOUTH_WIZ, rotY([0.12, 0.07, -0.02], WIZ_FACE));
const ARM_WIZ = add(WIZ_GUARD, rotY([-0.02, -0.06, 0.02], WIZ_FACE));
props[1].jets = [CHEEK_WIZ, ARM_WIZ];

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const S1 = frame(add(MOUTH_REA, [-0.03, -0.02, 0]), { az: -18, el: 6, h: 0.95, fov: 18 });
const S2 = frame(add(mid(C_BITE, 0.7), [0, 0.05, 0]), { az: -22, el: 8, h: 0.72, fov: 16 });   // the eyes in frame
const S3 = frame([-0.12, 0.62, 0.38], { az: 24, el: 3, h: 1.35, fov: 20 });   // wide enough for the jets coming in
const S4 = frame([0.0, 0.58, 0.3], { az: -4, el: 5, h: 2.0, fov: 22 });
const S5 = frame(add(C_WIZ, [-0.12, 0.17, -0.04]), { az: 0, el: 28, h: 1.1, fov: 18, push: 0.18, dur: 2.1 });
const S6 = frame([-0.03, 0.55, 0.35], { az: -4, el: 5, h: 1.75, fov: 22 });
const S7 = frame(add(MOUTH_REA, [-0.02, -0.03, 0]), { az: -18, el: 4, h: 0.95, fov: 18 });
const S8 = frame(add(MOUTH_REA, [-0.02, -0.02, 0]), { az: 4, el: 2, h: 1.5, fov: 20 });   // wider and from his other side: a real cut, the straw off his face
const S9 = frame([-0.02, 0.6, 0.28], { az: 0, el: 3, h: 1.65, fov: 22 });
const beats = c.beats([
  ["01 wrong tool", 0, S1, "hook"],
  ["02 pressure", 0.5, S2],
  ["03 immediate splash", 1.0, S3, "escalation"],
  ["04 the silent solution", 1.8, S4],
  ["05 use the straw", 3.0, S5],
  ["06 give it back", 5.1, S6],
  ["07 it works", 6.5, S7],
  ["08 still proud", 8.0, S8, "payoff"],
  ["09 the cost of helping", 9.4, S9, "reaction"],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "vampire-vs-juice-box" : `vampire-vs-juice-box-${variant.toLowerCase()}`,
  title: "Vampire vs Juice Box",
  idea: "Story library 02: Reaper's new vampire fangs spray juice over the Wizard, who silently hands him a straw",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 14], loop: false },
  allowClip: [{ who: "wiz", with: "carton", from: 4.72, to: 5.12, reason: "his pinch on the straw now seated in the carton (the carton's own straw), until the fingers have opened and lifted off it" }],
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  music: { style: "sneaky", gain: 0.45, parts: [{ at: 0, part: "intro" }, { at: 1.0, part: "hush" }, { at: 1.8, part: "intro" }, { at: 6.5, part: "main" }, { at: 9.4, part: "intro" }] },
  sound: { sfx: 0.7, ambience: 0.3, speech: false },
  experiment: { id: "hook-2026-11", episode: "vampire-vs-juice-box", variant },
  cast, props, captions, beats,
  allowClip: [
    { who: "wiz", with: "carton", from: 1.0, to: 1.8, reason: "the juice jets land on his cheek and forearm (the carton's jets)" },
    { who: "rea", with: "carton", from: 0, to: 0.75, reason: "the fangs bite the carton's top edge against his chin" },
    { who: "rea", with: "carton", from: 6.75, to: 8.05, reason: "his lips on the straw's end for the sip" },
    { who: "wiz", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop" },
    { who: "rea", with: "table", from: 2.7, to: 5.6, reason: "his paws rest on the tabletop" },
  ],
  notes: "Generated by storyboards/juice/make-vampire-vs-juice-box.mjs (Jonny's story library 02).",
});
// A: the brief as written (no on-screen text). B: A plus a setup caption over the opening (the hook lab: on mute, a
// caption carried the setup). Pick with qa/hook.mjs.
write(import.meta.url, sb("A", c.captions));
write(import.meta.url, sb("B", [...c.captions, { from: 0, to: 1.8, text: "New vampire. Still learning.", pos: 230, pop: false }]));
