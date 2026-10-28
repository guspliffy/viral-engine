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
import { JUICE, strawEnd } from "../../engine/page/props-juice.js";

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
const PALM = 0.03;                               // a cupped palm's centre under what it carries
const under = (C) => add(C, [0, -PALM, 0]);
const mid = (C, y = 0.42) => onCarton(C, [0, JUICE.h * y, 0]);

// where the carton's own straw stands (its foot), and the loose straw's grip, for the carton at C
const STRAW_FOOT = (C) => add(onCarton(C, [JUICE.port[0], JUICE.h, JUICE.port[1]]), [0, -JUICE.strawIn * SS, 0]);
const STRAW_TOP = (C) => add(STRAW_FOOT(C), rotY(rotY(strawEnd(), STRAW_ROT).map((v) => v * SS), RC));
const LIFT = 0.035;                               // the fist pinches the straw this far above its axis
const strawFist = (foot, tipDeg, rot) => {       // the fist for the loose straw's foot at `foot`
  const g = JUICE.strawGrip * SS, k = (tipDeg * Math.PI) / 180, d = rotY([0, Math.cos(k) * g, Math.sin(k) * g], rot);
  return add(foot, [d[0], d[1] + LIFT, d[2]]);
};

// the carton's keys (its bottom centre)
const C_BITE = add(MOUTH_REA_BITE, [0, -0.03 - H, 0]).map((v, i) => r3(v + rotY([0, 0, D / 2 - 0.022], RC)[i]));
const C_LOW = add(C_BITE, [-0.03, -0.06, 0.05]);           // lowered, sheepish, after the spray
const C_PASS = [0.0, TABLE_H + 0.1, 0.52];                  // the handoff into the Wizard's left palm
const C_WIZ = [-0.2, TABLE_H + 0.06, 0.7];                 // held steady for the straw
const C_BACK = [0.06, TABLE_H + 0.1, 0.52]; 
const C_DOWN = [0.13, TABLE_H + 0.035, 0.6];                // lowered in front of him, after the sip
                // handed back
// the straw lying on the table in front of the Wizard: its foot, pointing right-front (rot 70: the long part toward
// +x, the bend lying flat toward the back)
const S_LIE = [-0.53, TABLE_H + JUICE.strawR * SS, 0.68], S_ROT = RC + STRAW_ROT;
const S_IN = STRAW_FOOT(C_WIZ), S_ABOVE = add(S_IN, [0, JUICE.strawIn * SS + 0.02, 0]);

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
  { id: "straw", kind: "bendystraw", x: S_LIE[0], y: S_LIE[1], z: S_LIE[2], rot: S_ROT, tip: 90, scale: SS },
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
sfx(HIT, "kenney/slime", { gain: 0.45 });
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
sfx(1.95, "kenney/tick", { gain: 0.3, reason: "the dry blink" });
A(1.92, "wiz", "blink", { dur: 0.2 });
// the left hand opens, palm up, under where the carton will come
A(2.1, "wiz", "arm", { side: "L", pose: { world: under(C_PASS) }, dur: 0.35, ease: "inOut" });
A(2.1, "wiz", "grip", { side: "L", shape: "cup", dur: 0.3 });
A(2.0, "rea", "expr", { expr: "sad", set: { curve: 0.15, eye: 0.95, open: 0 }, dur: 0.3 });   // sheepish
A(2.0, "rea", "face", { brow: 0.15, dur: 0.3 });
A(2.05, "rea", "look", { to: REA_DOWN, dur: 0.2, blink: false });
A(2.0, "rea", "arm", { side: "R", pose: { world: sideR(C_LOW), palm: mid(C_LOW) }, dur: 0.2 });
A(2.0, "rea", "arm", { side: "L", pose: { world: sideL(C_LOW), palm: mid(C_LOW) }, dur: 0.2 });
A(2.25, "rea", "arm", { side: "R", pose: { world: sideR(C_PASS), palm: mid(C_PASS) }, dur: 0.4, ease: "inOut" });
A(2.25, "rea", "arm", { side: "L", pose: { world: sideL(C_PASS), palm: mid(C_PASS) }, dur: 0.4, ease: "inOut" });
sfx(2.3, "cloth", { gain: 0.3, reason: "the carton's light rustle as it is passed" });
A(2.65, "wiz", "grab", { prop: "carton", hand: "L", grip: [0, -PALM / CS, 0], pose: null });   // on his palm
A(2.68, "rea", "arm", { side: "R", pose: { world: [0.3, TABLE_H + 0.035, 0.55] }, dur: 0.35, ease: "inOut" });
A(2.68, "rea", "arm", { side: "L", pose: { world: [0.68, TABLE_H + 0.035, 0.55] }, dur: 0.35, ease: "inOut" });
A(2.75, "rea", "grip", { side: "both", shape: "paw", dur: 0.25 });
A(2.75, "wiz", "arm", { side: "L", pose: { world: under(C_WIZ) }, dur: 0.3, ease: "inOut" });
A(2.75, "wiz", "look", { to: WIZ_AT_CARTON, dur: 0.15, blink: false });

// ---------------------------------------------------------------- 05 USE THE STRAW 3.00-5.10
A(3.0, "wiz", "look", { to: WIZ_AT_STRAW, dur: 0.15, blink: false });
const FIST_LIE = strawFist(S_LIE, 90, S_ROT);
A(3.1, "wiz", "arm", { side: "R", pose: { world: add(FIST_LIE, [0, 0.05, 0]) }, dur: 0.3, ease: "inOut" });
A(3.1, "wiz", "grip", { side: "R", shape: "open", dur: 0.2 });
A(3.4, "wiz", "arm", { side: "R", pose: { world: FIST_LIE }, dur: 0.12, ease: "out" });
A(3.5, "wiz", "grip", { side: "R", shape: "pinch", dur: 0.1 });
A(3.52, "wiz", "grab", { prop: "straw", hand: "R", grip: "mid", off: [0, -LIFT, 0], pose: null });
sfx(3.52, "kenney/tick", { gain: 0.25, reason: "fingers close on the straw" });
// lift it, stand it up and bring it over the port
A(3.6, "wiz", "arm", { side: "R", pose: { world: strawFist(S_ABOVE, 0, S_ROT) }, dur: 0.55, ease: "inOut" });
c.prop(3.6, "straw", { tip: 0 }, 0.5);
A(3.75, "wiz", "look", { to: WIZ_AT_PORT, dur: 0.2, blink: false });
A(3.6, "wiz", "still", { dur: 1.4, idle: 0.08 });
// a beat of aim, then the push through the foil
A(4.3, "wiz", "arm", { side: "R", pose: { world: strawFist(S_IN, 0, S_ROT) }, dur: 0.32, ease: "inOut" });
const POP = 4.3 + 0.32 * 0.3;
c.prop(POP, "carton", { port: 1 }, 0.05, "out");
sfx(POP, "pop", { gain: 0.35 });
// swap the loose straw for the carton's own, then let go
c.prop(4.68, "straw", { scale: 0 }, 0);
c.prop(4.68, "carton", { straw: 1 }, 0);
A(4.68, "wiz", "release", { prop: "straw" });
A(4.72, "wiz", "grip", { side: "R", shape: "open", dur: 0.2 });
A(4.75, "wiz", "arm", { side: "R", pose: { world: [-0.66, TABLE_H + 0.035, 0.6] }, dur: 0.4, ease: "inOut" });
A(4.85, "wiz", "grip", { side: "R", shape: "paw", dur: 0.25 });

// ---------------------------------------------------------------- 06 GIVE IT BACK 5.10-6.50
A(5.1, "wiz", "look", { to: WIZ_AT_REA, dur: 0.2, blink: false });
A(5.15, "wiz", "arm", { side: "L", pose: { world: under(C_BACK) }, dur: 0.45, ease: "inOut" });
A(5.2, "rea", "look", { to: [-0.45, -0.5], dur: 0.15, blink: false });
A(5.2, "rea", "expr", { expr: "eager", set: { open: 0, eye: 1.05 }, dur: 0.25 });
A(5.4, "rea", "arm", { side: "R", pose: { world: sideR(C_BACK), palm: mid(C_BACK) }, dur: 0.35, ease: "inOut" });
A(5.4, "rea", "grip", { side: "R", shape: "hold", dur: 0.3 });
A(5.6, "rea", "arm", { side: "L", pose: { world: sideL(C_BACK), palm: mid(C_BACK) }, dur: 0.35, ease: "inOut" });
A(5.6, "rea", "grip", { side: "L", shape: "hold", dur: 0.3 });
A(5.95, "rea", "grab", { prop: "carton", hand: "both", grip: [0, JUICE.h * 0.42, 0], pose: null });
sfx(5.85, "cloth", { gain: 0.25, reason: "quiet handling as Reaper takes the carton" });
A(6.05, "wiz", "arm", { side: "L", pose: { world: [-0.26, TABLE_H + 0.035, 0.64] }, dur: 0.4, ease: "inOut" });
A(6.1, "wiz", "grip", { side: "L", shape: "paw", dur: 0.3 });

// ---------------------------------------------------------------- 07 IT WORKS 6.50-8.00
// the carton comes up until the straw's end is at his lips
const SIP = MOUTH_REA, C_SIP = add(C_BACK, SIP.map((v, i) => v - STRAW_TOP(C_BACK)[i]));
const REA_HANDS = (C) => [{ world: sideR(C), palm: mid(C) }, { world: sideL(C), palm: mid(C) }];
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
A(8.5, "rea", "grab", { prop: "carton", hand: "R", grip: [-(JUICE.w / 2 + GAP / CS), JUICE.h * 0.42, 0], pose: null });
A(8.55, "rea", "arm", { side: "L", pose: { world: add(MOUTH_REA, rotY([0.21, 0.0, 0.0], REA_FACE)) }, dur: 0.35, ease: "inOut" });
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
const S2 = frame(mid(C_BITE, 0.7), { az: -22, el: 8, h: 0.6, fov: 16 });
const S3 = frame([-0.12, 0.62, 0.38], { az: 24, el: 3, h: 1.35, fov: 20 });   // wide enough for the jets coming in
const S4 = frame([0.0, 0.58, 0.3], { az: -4, el: 5, h: 2.0, fov: 22 });
const S5 = frame(add(C_WIZ, [-0.06, 0.16, -0.06]), { az: 0, el: 30, h: 1.1, fov: 18, push: 0.3, dur: 2.1 });
const S6 = frame([-0.03, 0.55, 0.35], { az: -4, el: 5, h: 1.75, fov: 22 });
const S7 = frame(add(MOUTH_REA, [-0.02, -0.03, 0]), { az: -18, el: 4, h: 0.95, fov: 18 });
const S8 = frame(add(MOUTH_REA, [-0.02, 0.02, 0]), { az: -12, el: -4, h: 1.25, fov: 20 });   // low angle: proud
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
