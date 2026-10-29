// THE CANDY BODYGUARD (Jonny's story library #12, 29 Oct 2026), built from the clip template.
// node storyboards/candy/make-candy-bodyguard.mjs -> storyboards/candy/candy-bodyguard.json
//
// THE BRIEF (story library 12, ENGINE-PROMPT.md: 13.00 s, eight shots, wordless, no loop), cut to 10 s on Jonny's
// 29 Oct notes for this batch: a caption, background music, short, lots of action, a strong hook in the first 2 s and
// a few quick cuts that set up the situation.
//   Joke:        Reaper, the terrifying candy guard, is scared off by Wizard's tiny toy spider.
//   Wants:       the Wizard wants a sweet; Reaper wants to be the scariest thing at the table.
//   Consequence: one rubber spider beside the bowl and the bodyguard scrambles behind the doorway.
//   Ending:      kindness, not another scare: the Wizard keeps one sweet and slides the other toward his frightened
//                friend; Reaper peeks out, tempted by the sweet but watching the spider. Held, no loop.
//
//   01 0.00-1.40 the bodyguard: the Wizard's own right hand already over the bowl; Reaper lunges up with   (growl, cloth)
//                both claws ("grrr!"), the Wizard flinches and snaps his empty hand back. Caption from frame 0.
//   02 1.40-2.10 smug: Reaper close-up, lids settle to half, a satisfied smirk ("hmph."); the Wizard's
//                hat edge at left. Off screen the Wizard's right hand drops below the table for the toy.
//   03 2.10-3.00 the idea: the Wizard close-up, his right hand rises from below the table pinching the    (handling rustle)
//                tiny toy spider; a look at it, a sideways look at Reaper and a knowing smile
//   04 3.00-3.75 tiny threat: tabletop insert, the toy set down beside the bowl, the fingers open and     (tiny tap)
//                lift away; Reaper's eyes start toward it behind
//   05 3.75-4.75 freeze: Reaper's face: eyes find the toy, the smugness stops, lids open, brows up, a held (gasp)
//                frozen thought, a small recoil, a small tense mouth
//   06 4.75-6.25 hiding (PAYOFF): a startle hop ("EEK!") and a scramble, backing away from the toy and    (hop, steps)
//                round behind the doorway's jamb; he peeks out, one hand on the jamb
//   07 6.25-8.40 a sweet gesture: the Wizard takes the orange sweet with his right hand and keeps it;    (two crinkles,
//                his left takes the purple one, sets it on the clear lane and slides it toward the door     a soft slide)
//   08 8.40-10.0 everyone has a weakness: Reaper eyes the offered sweet, checks the spider, stays tempted
//                but wary; the Wizard's affectionate knowing smile. Held.
//
// Blocking (x right, z toward the camera): a pale table across the front, the bowl in its middle; the Wizard behind
// its left end, Reaper behind the bowl's right side. The hall's right wall stands back right with the open doorway on
// its left edge (the jamb at x JAMB_X): Reaper backs away from the toy, then side-steps right behind the wall and peeks
// round the jamb. Every camera is in front, a little from the left, so the jamb hides his body and not his face.
// Hands (the brief): the Wizard's own RIGHT reaches, brings up and places the toy, then takes sweet A and keeps it;
// his own LEFT takes sweet B and slides it. Small things are pinched with the grip library's thin hold (thumb and
// index pads on opposite sides, the other fingers curled loose). Reaper never takes a sweet.
// State: the toy is in the Wizard's right hand from 03 (picked up off screen in 02), on the table from 04 on and never
// moves again; A and B sit on top of the heap until 07; exactly those two leave the bowl.
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as grips from "../lib/grips.mjs";

const c = clip(), { A, sfx } = c;

// A small thing taken from above (panel 04 of Jonny's storyboard: the fingertips come down on the toy's back): the palm
// down over it, the fingers curled down round its sides (grip "clasp"), held where the hand touched it. Same steps as
// the grip library's holds: approach above it, touch, close, lift / carry / place, let go and lift off.
function fromAbove(c, who, spec, { side = "R", y = 0.09, lift = 0.06 } = {}) {
  const id = spec.id, on = (o = {}) => ({ prop: id, grip: [0, y, 0], ...o });
  const h = {
    take(t, { reach = 0.3, settle = 0.18 } = {}) {
      c.A(t, who, "grip", { side, shape: "hover", dur: 0.2 });
      c.arm(t, who, side, on({ off: [0, lift, 0] }), reach, "inOut");
      c.arm(t + reach, who, side, on(), settle, "out");
      c.A(t + reach + settle * 0.5, who, "grip", { side, shape: "clasp", dur: 0.12 });
      c.A(t + reach + settle + 0.04, who, "grab", { prop: id, hand: side, dur: 0, pose: null, keep: true });
      return r3(t + reach + settle + 0.08);
    },
    carry(t, at, dur, ease = "inOut") { c.arm(t, who, side, on({ at: at.map(r3) }), dur, ease); return r3(t + dur); },
    place(t, at, dur = 0.35) {
      const e = h.carry(t, at, dur, "out");
      c.prop(e, id, { squash: 0.05 }, 0.05, "out"); c.prop(e + 0.05, id, { squash: 0 }, 0.15, "settle");
      return e;
    },
    release(t, rest, { back = 0.22 } = {}) {
      c.A(t, who, "release", { prop: id, dur: 0 });
      c.A(t, who, "grip", { side, shape: "hover", dur: 0.14 });
      c.arm(t + 0.04, who, side, on({ off: [0, lift + 0.03, 0] }), back, "out");
      if (rest) { c.arm(t + 0.04 + back, who, side, rest, 0.4, "settle"); c.A(t + 0.04 + back, who, "grip", { side, shape: "relaxed", dur: 0.3 }); }
      return r3(t + 0.04 + back);
    },
  };
  return h;
}
const END = 10.0;

// ---------------------------------------------------------------- places
const H = 0.36;                                                         // the table top
const TABLE = { x: -0.05, z: 0.9, w: 1.5, d: 0.6 };                     // x -0.8..0.7, z 0.6..1.2
const BOWL = [0.0, H, 0.86];
const WIZ0 = [-0.62, 0.2], WIZ_YAW = 26, WIZ1 = [-0.1, 0.22];             // the Wizard steps in for the sweets (07)
const REA0 = [0.44, 0.04], REA_YAW = -28;                                // guarding, behind the bowl's right side
const JAMB_X = 0.66, JAMB_Z = -0.52;                                    // the doorway's jamb (the wall's left edge), wall centre z
const REA_BACK = [-0.04, -0.98], REA_HIDE = [0.86, -1.15], HIDE_YAW = -45; // backing off, then behind the wall
const SPIDER_LOW = [-0.3, 0.12, 0.52];                                  // below the table's back edge, in front of the Wizard (off screen)
const SPIDER_AT = [-0.27, H, 0.9];                                      // its place for good: front-left of the bowl
const A0 = [-0.07, 0.464, 0.83], B0 = [0.07, 0.462, 0.9];              // the two named sweets on top of the heap
const A_CHEST = [-0.42, 0.5, 0.54];                                     // sweet A held near the Wizard's chest
const B_LANE = [0.24, H + 0.004, 0.8], B_STOP = [0.52, H + 0.004, 0.8];   // the clear lane on the bowl's right, toward the door

// eye targets (face look space: + right on screen, + up)
const WIZ_AT_BOWL = [0.45, -0.6], WIZ_AT_REA = [0.8, 0.05], WIZ_AT_HAND = [-0.15, -0.35];
const REA_AT_HAND = [-0.55, -0.45], REA_AT_WIZ = [-0.8, 0.0], REA_AT_SPIDER = [-0.55, -0.7];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ0, face: WIZ_YAW, expr: "kind", follow: 0.25, seed: 2.6 },
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: REA_YAW, expr: "smug", follow: 0.25, seed: 4.1 },
];
const SPIDER = { id: "spider", kind: "toyspider", span: 0.2, color: "#2b2036", mark: "#ff8a1a", x: SPIDER_LOW[0], y: SPIDER_LOW[1], z: SPIDER_LOW[2], rot: 30, scale: 0.001 };
const SWEET_A = { id: "sweetA", kind: "candy", x: A0[0], y: A0[1], z: A0[2], rot: 20, color: "#ff8a1a", big: 1.35 };
const SWEET_B = { id: "sweetB", kind: "candy", x: B0[0], y: B0[1], z: B0[2], rot: -12, color: "#8e3fd1", big: 1.35 };
const props = [
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, h: H, w: TABLE.w, d: TABLE.d, color: "#ecd8b4", leg: "#cfa874", legX: 0.62, apron: 0.04 },
  { id: "bowl", kind: "bowl", x: BOWL[0], y: BOWL[1], z: BOWL[2], colors: ["#ff8a1a", "#8e3fd1", "#ffa43a", "#6f2fb8"] },
  { id: "jamb", kind: "jambwall", x: JAMB_X, z: JAMB_Z, w: 1.8, h: 2.6, room: { x: -0.3, d: 1.15, color: "#8e84b4" } },
  SWEET_A, SWEET_B, SPIDER,
];

// ---------------------------------------------------------------- 01 THE BODYGUARD 0.00-1.40
// frame 0: the Wizard's right hand is already over the bowl, Reaper's eyes on it
A(0, "wiz", "noblink"); A(0, "rea", "noblink");
A(0, "wiz", "pitch", { to: 6, dur: 0 });
c.arm(0, "wiz", "R", { world: [-0.16, 0.56, 0.74] }, 0);
A(0, "wiz", "grip", { side: "R", shape: "hover", dur: 0 });
c.arm(0.02, "wiz", "R", { world: [-0.1, 0.53, 0.8] }, 0.3, "out");                 // still coming in
A(0, "wiz", "look", { to: WIZ_AT_BOWL, dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "kind", set: { curve: 0.55, eye: 1.05 }, dur: 0 });
A(0, "rea", "look", { to: REA_AT_HAND, dur: 0, blink: false });
A(0, "rea", "face", { lid: 0.3, dur: 0 });
// frame 0 is already action: Reaper is rising over the bowl, claws half up (analytics 29 Oct: open mid-action)
A(0, "rea", "pitch", { to: 5, dur: 0 });
c.arm(0, "rea", "R", { x: [-0.3, 0.68, 0.3] }, 0); c.arm(0, "rea", "L", { x: [0.34, 0.68, 0.3] }, 0);
A(0, "rea", "grip", { side: "both", shape: "open", set: { curl: 0.5, index: 0.45, thumb: 0.4 }, dur: 0 });
A(0, "rea", "expr", { expr: "angry", set: { open: 0.25, curve: -0.2, eye: 1.05 }, dur: 0 });
// 0.12: Reaper lunges over the bowl, both claws up, a theatrical growl
const CLAW = { shape: "open", set: { curl: 0.62, index: 0.55, thumb: 0.45 } };
A(0.1, "rea", "pitch", { to: 12, dur: 0.16, ease: "out" });
c.arm(0.1, "rea", "R", { x: [-0.36, 1.0, 0.22] }, 0.16, "out");
c.arm(0.1, "rea", "L", { x: [0.36, 1.0, 0.22] }, 0.16, "out");
A(0.1, "rea", "grip", { side: "both", ...CLAW, dur: 0.12 });
A(0.1, "rea", "expr", { expr: "angry", set: { open: 0.55, curve: -0.3, eye: 1.1 }, dur: 0.12 });   // a snarl, not a grin (review A)
A(0.1, "rea", "hop", { height: 0.08, dur: 0.22 });
c.textPop(0.14, "rea", "GRR!", { dur: 0.6, size: 96, dx: -0.3, dy: -0.9, angle: -6, color: "speaker" });
A(0.1, "rea", "face", { lid: 0.1, dur: 0.12 });
A(0.12, "rea", "look", { to: REA_AT_WIZ, dur: 0.1, blink: false });
c.macro(0.14, "rea", "say", { line: "grrr!", tone: "excited", caption: false });
sfx(0.1, "cloth", { gain: 0.6, reason: "the hood and sleeves whipping up as Reaper lunges" });
// 0.36: the Wizard flinches: the empty hand snaps back to his chest, the body leans away, the hat wobbles
c.arm(0.36, "wiz", "R", { x: [-0.22, 0.6, 0.28] }, 0.14, "out");
A(0.36, "wiz", "grip", { side: "R", shape: "open", dur: 0.1 });
A(0.36, "wiz", "pitch", { to: -9, dur: 0.18, ease: "out" });
A(0.36, "wiz", "squash", { amount: 0.06, dur: 0.24 });
A(0.36, "wiz", "hatwobble", { amount: 8, freq: 3, dur: 0.8 });
A(0.34, "wiz", "look", { to: WIZ_AT_REA, dur: 0.08, blink: false });
A(0.34, "wiz", "expr", { expr: "shocked", set: { open: 0.5, curve: -0.5, eye: 1.25 }, dur: 0.1 });
A(0.36, "wiz", "face", { brow: 0.4, dur: 0.12 });
sfx(0.38, "gasp", { gain: 0.55, reason: "the Wizard's short intake of breath as he flinches" });
// Reaper holds the scare a beat, then the claws come down
A(0.3, "rea", "still", { dur: 0.45, idle: 0.05 });
A(0.8, "rea", "pitch", { to: 0, dur: 0.3, ease: "inOut" });
c.arm(0.8, "rea", "R", "rest", 0.3, "settle"); c.arm(0.8, "rea", "L", "rest", 0.3, "settle");
A(0.85, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.25 });
A(0.85, "rea", "expr", { expr: "smug", set: { curve: 0.4, smirk: 0.5 }, dur: 0.3 });
A(0.85, "rea", "face", { lid: 0.42, dur: 0.3 });
A(0.75, "wiz", "pitch", { to: 0, dur: 0.35 });
A(0.9, "wiz", "expr", { expr: "kind", set: { curve: -0.1, eye: 1.0 }, dur: 0.3 });   // a little put out
A(0.9, "wiz", "face", { brow: 0.15, dur: 0.3 });

// ---------------------------------------------------------------- 02 SMUG 1.40-2.10
A(1.4, "rea", "look", { to: [-0.3, 0.1], dur: 0.15, blink: false });
A(1.45, "rea", "expr", { expr: "smug", set: { curve: 0.55, smirk: 0.65 }, dur: 0.25 });
A(1.45, "rea", "face", { lid: 0.52, dur: 0.25 });
A(1.5, "rea", "pitch", { to: -5, dur: 0.25, ease: "out" });                          // chin up, pleased with himself
c.macro(1.55, "rea", "say", { line: "hmph.", tone: "calm", caption: false });
A(1.9, "rea", "still", { dur: 1.2, idle: 0.08 });
// the Wizard, at the frame's left edge: his eyes narrow, the mischief starts
A(1.6, "wiz", "look", { to: WIZ_AT_REA, dur: 0.1, blink: false });
A(1.65, "wiz", "face", { lid: 0.35, brow: 0.05, dur: 0.25 });
A(1.7, "wiz", "expr", { expr: "sly", set: { curve: 0.35, smirk: 0.5 }, dur: 0.3 });
// off screen: the right hand drops below the table's back edge to the toy (it appears there unseen and is pinched)
c.prop(1.4, "spider", { scale: 1 }, 0.01);
const SPIDER_SPEC = { ...SPIDER, scale: 1 };
const sp = fromAbove(c, "wiz", SPIDER_SPEC, { side: "R", y: 0.115 });
let t = sp.take(1.42, { reach: 0.32, settle: 0.18 });                                // fingers closed by ~1.95

// ---------------------------------------------------------------- 03 THE IDEA 2.10-3.00
t = sp.carry(2.1, [-0.32, 0.44, 0.52], 0.2, "in");                                    // straight up past the table's back edge
t = sp.carry(t, [-0.62, 0.4, 0.66], 0.24, "out");                                  // up into view, in front of his chest
sfx(2.14, "cloth", { gain: 0.35, reason: "soft handling rustle as his hand comes up from under the table" });
A(2.3, "wiz", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
A(2.32, "wiz", "expr", { expr: "sly", set: { curve: 0.5, smirk: 0.75 }, dur: 0.25 });
A(2.32, "wiz", "face", { lid: 0.42, dur: 0.25 });
A(2.7, "wiz", "look", { to: WIZ_AT_REA, dur: 0.1, blink: false });                    // a sideways look at Reaper
A(2.72, "wiz", "face", { lid: 0.4, brow: 0.2, dur: 0.2 });
A(2.4, "wiz", "still", { dur: 0.55, idle: 0.1 });

// ---------------------------------------------------------------- 04 TINY THREAT 3.00-3.75
A(2.98, "wiz", "pitch", { to: 12, dur: 0.35 });
A(2.98, "wiz", "look", { to: [0.1, -0.75], dur: 0.12, blink: false });
t = sp.place(2.98, SPIDER_AT, 0.45);                                                   // contact at 3.38
sfx(t, "put-down", { gain: 0.3, reason: "the tiny rubber toy touching the wood" });
c.prop(3.0, "spider", { rot: 35 }, 0.36, "inOut");                                    // turned to face Reaper as it goes down
t = sp.release(t + 0.1, { x: [-0.3, 0.46, 0.42] });                         // fingers open and lift away
A(3.6, "wiz", "pitch", { to: 4, dur: 0.3 });
A(3.3, "rea", "look", { to: [-0.35, -0.25], dur: 0.25, blink: false });               // his eyes begin to drift toward it

// ---------------------------------------------------------------- 05 FREEZE 3.75-4.75
A(3.8, "rea", "look", { to: [-0.6, -0.85], dur: 0.1, blink: false });                 // the gaze finds it
A(3.95, "rea", "face", { lid: 0, brow: 0.5, dur: 0.16 });                              // lids open wide, brows up
A(3.95, "rea", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.22, curve: -0.6, tilt: 0.5 }, dur: 0.2 });   // the smile drops
A(4.02, "rea", "still", { dur: 0.45, idle: 0 });                                       // the frozen thought
sfx(4.05, "gasp", { gain: 0.45, reason: "Reaper's tiny breath catch as he recognises the spider" });
A(4.25, "rea", "look", { to: [0, 0], dur: 0.08, blink: false });                          // a look at us: did you see that?
A(4.48, "rea", "pitch", { to: -10, dur: 0.18, ease: "out" });                          // a small recoil
A(4.48, "rea", "squash", { amount: 0.05, dur: 0.2 });
c.arm(4.48, "rea", "R", { x: [-0.2, 0.62, 0.36] }, 0.16, "out");                       // hands up to his chest
c.arm(4.48, "rea", "L", { x: [0.2, 0.62, 0.36] }, 0.16, "out");
A(4.48, "rea", "grip", { side: "both", shape: "fist", set: { curl: 0.9 }, dur: 0.12 });
A(4.5, "rea", "expr", { expr: "shocked", set: { eye: 1.25, open: 0.35, curve: -0.7, tilt: 0.5 }, dur: 0.15 });
// the Wizard watches him, enjoying it
A(3.85, "wiz", "look", { to: WIZ_AT_REA, dur: 0.12, blink: false });
A(3.9, "wiz", "expr", { expr: "sly", set: { curve: 0.65, smirk: 0.4 }, dur: 0.3 });

// ---------------------------------------------------------------- 06 HIDING 4.75-6.25 (payoff)
A(4.8, "rea", "hop", { height: 0.16, dur: 0.36 });                                     // a startle hop
c.arm(4.8, "rea", "R", { x: [-0.42, 0.92, 0.2] }, 0.14, "out");                        // arms fly up
c.arm(4.8, "rea", "L", { x: [0.42, 0.92, 0.2] }, 0.14, "out");
A(4.8, "rea", "grip", { side: "both", shape: "open", dur: 0.1 });
act.emote(c, 4.84, "rea", "EEK!", { dur: 0.9, size: 104 });
sfx(4.8, "sting", { gain: 0.5, reason: "the 'dun!' shock sting on Reaper's startle jump (analytics 29 Oct: a sting on the scare)" });
c.macro(4.82, "rea", "say", { line: "eek!", tone: "excited", caption: false });
// the scramble: backing away from the toy (eyes on it), then round behind the wall
A(5.02, "rea", "look", { to: [-0.5, -0.65], dur: 0.1, blink: false });                // eyes stay on the toy as he backs off
A(5.16, "rea", "move", { to: REA_BACK, dur: 0.42, ease: "inOut", steps: 4.6 });
A(5.16, "rea", "turn", { to: 10, dur: 0.4 });
c.arm(5.16, "rea", "R", { x: [-0.3, 0.62, 0.3] }, 0.25); c.arm(5.16, "rea", "L", { x: [0.3, 0.62, 0.3] }, 0.25);
A(5.16, "rea", "grip", { side: "both", shape: "fist", set: { curl: 0.9 }, dur: 0.15 });
A(5.16, "rea", "pitch", { to: -4, dur: 0.3 });
A(5.6, "rea", "move", { to: REA_HIDE, dur: 0.4, ease: "inOut", steps: 4.2 });
A(5.6, "rea", "turn", { to: HIDE_YAW, dur: 0.4 });
A(5.6, "rea", "look", { to: REA_AT_SPIDER, dur: 0.1, blink: false });
c.arm(5.6, "rea", "R", "rest", 0.35, "settle"); c.arm(5.6, "rea", "L", "rest", 0.35, "settle");
A(5.7, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.25 });
// the peek: a lean out round the jamb, both fists held up by his chest (hidden by the wall)
A(5.85, "rea", "lean", { to: -10, dur: 0.25, ease: "settle" });
A(6.0, "rea", "expr", { expr: "sad", set: { eye: 1.15, open: 0.08, curve: -0.35, tilt: 0.45 }, dur: 0.25 });
A(6.0, "rea", "face", { lid: 0.08, brow: 0.35, dur: 0.25 });
// the Wizard follows him with his eyes, amused, the hand by his chest
A(4.85, "wiz", "look", { to: [0.9, 0.0], dur: 0.15, blink: false });
A(5.2, "wiz", "turn", { to: 34, dur: 0.4 });
A(5.4, "wiz", "expr", { expr: "kind", set: { curve: 0.6, smirk: 0.3 }, dur: 0.3 });
act.blinksAt(c, "wiz", [5.95]);

// ---------------------------------------------------------------- 07 A SWEET GESTURE 6.25-8.40
// a step in toward the bowl, then the right hand takes sweet A and keeps it by his chest
A(6.12, "wiz", "look", { to: [0.3, -0.6], dur: 0.12, blink: false });                // eyes to the bowl, then the step
A(6.25, "wiz", "move", { to: WIZ1, dur: 0.35, ease: "inOut", steps: 2 });
A(6.25, "wiz", "turn", { to: 22, dur: 0.35 });
A(6.3, "wiz", "pitch", { to: 12, dur: 0.3 });
A(6.3, "wiz", "look", { to: [0.35, -0.7], dur: 0.12, blink: false });
const ha = grips.thin(c, "wiz", SWEET_A, { side: "R", from: 0.5, roll: 10 });
t = ha.take(6.45, { reach: 0.3, settle: 0.18 });                                      // closed by ~7.0
sfx(t - 0.05, "crinkle", { gain: 0.5, reason: "the orange wrapper crinkling as he takes sweet A" });
t = ha.carry(t + 0.02, A_CHEST, 0.3, "inOut");
// the left takes sweet B, puts it on the lane and slides it toward the doorway
A(6.82, "wiz", "look", { to: [0.35, -0.65], dur: 0.12, blink: false });               // eyes on sweet B first
const hb = fromAbove(c, "wiz", SWEET_B, { side: "L", y: 0.085 });
t = hb.take(6.95, { reach: 0.28, settle: 0.18 });                                     // closed by ~7.47
sfx(t - 0.05, "crinkle", { gain: 0.45, reason: "the purple wrapper crinkling as he takes sweet B" });
t = hb.place(t + 0.02, B_LANE, 0.25);                                                 // on the table by ~7.75
t = hb.carry(t + 0.04, B_STOP, 0.42, "out");                                          // the gentle slide, slowing to a stop
sfx(t - 0.42, "ai/cookie-scrape", { gain: 0.3, reason: "the soft tabletop slide of the purple sweet toward Reaper" });
t = hb.release(t + 0.06, { world: [0.2, H + 0.07, 0.66] });                         // let go; the hand rests on the table
A(t + 0.1, "wiz", "grip", { side: "L", shape: "paw", dur: 0.3 });
sfx(t - 0.2, "ai/warm-resolve", { gain: 0.45, reason: "the warm resolving chord as he lets go of the offered sweet" });
A(7.0, "wiz", "look", { to: [0.45, -0.7], dur: 0.15, blink: false });
A(7.8, "wiz", "look", { to: [0.75, -0.55], dur: 0.25, blink: false });               // follows the sweet
// Reaper's eyes follow the sweet from behind the jamb
A(7.1, "rea", "look", { to: [-0.45, -0.55], dur: 0.2, blink: false });
A(7.85, "rea", "look", { to: [-0.3, -0.6], dur: 0.35, blink: false });
act.blinksAt(c, "rea", [6.9]);

// ---------------------------------------------------------------- 08 EVERYONE HAS A WEAKNESS 8.40-10.0
A(8.45, "rea", "look", { to: [-0.3, -0.6], dur: 0.1, blink: false });
A(8.5, "rea", "expr", { expr: "kind", set: { eye: 1.15, open: 0.05, curve: 0.15, tilt: 0.3 }, dur: 0.3 });   // tempted
A(8.5, "rea", "lean", { to: -12, dur: 0.4 });                                           // leans a little further out
A(8.95, "rea", "look", { to: [-0.85, -0.45], dur: 0.1, blink: false });                // checks the spider
A(8.97, "rea", "face", { brow: 0.5, lid: 0, dur: 0.12 });
A(8.97, "rea", "expr", { expr: "sad", set: { eye: 1.2, curve: -0.3, tilt: 0.5 }, dur: 0.12 });
A(8.97, "rea", "lean", { to: -4, dur: 0.15 });                                          // pulls back
A(9.4, "rea", "look", { to: [-0.1, -0.8], dur: 0.15, blink: false });
A(9.4, "rea", "lean", { to: -13, dur: 0.3 });                                          // leans out again                // back to the sweet
A(9.45, "rea", "expr", { expr: "kind", set: { eye: 1.1, curve: 0.05, tilt: 0.35, press: 0.4 }, dur: 0.3 });
A(9.45, "rea", "face", { brow: 0.3, lid: 0.1, dur: 0.3 });
A(9.5, "rea", "still", { dur: 0.48, idle: 0.05 });
// the Wizard: an affectionate, knowing look at his friend, his own sweet up where it shows
A(8.42, "wiz", "look", { to: [-0.3, -0.3], dur: 0.1, blink: false });
ha.carry(8.55, [-0.42, 0.56, 0.56], 0.35, "inOut");
A(8.5, "wiz", "pitch", { to: 2, dur: 0.35 });
A(8.8, "wiz", "look", { to: WIZ_AT_REA, dur: 0.2, blink: false });
A(8.65, "wiz", "expr", { expr: "kind", set: { curve: 0.65, smirk: 0.2 }, dur: 0.35 });
A(8.65, "wiz", "face", { lid: 0.32, brow: 0.2, dur: 0.35 });
A(8.8, "wiz", "lean", { to: 5, dur: 0.4 });
act.blinksAt(c, "wiz", [9.2]);
A(9.0, "wiz", "still", { dur: 0.98, idle: 0.06 });

// ---------------------------------------------------------------- shots ([name, start, camera, kind]; the brief fixes them)
const S1 = frame([0.0, 0.72, 0.45], { az: -6, el: -2, h: 1.75, fov: 28 });                    // low two-shot over the bowl, room for the caption
const S2 = frame([0.24, 0.66, 0.15], { az: -18, el: 0, h: 1.1, fov: 28, push: 0.04, dur: 0.7 });   // Reaper, the Wizard's hat edge at left
const S3 = frame([-0.5, 0.64, 0.5], { az: 6, el: 2, h: 1.25, fov: 28 });                 // the Wizard and the rising hand
const S4 = frame([-0.24, 0.46, 0.82], { az: -12, el: 24, h: 0.66, fov: 30 });             // tabletop insert, Reaper behind
const S5 = frame([0.36, 0.62, 0.18], { az: -22, el: 2, h: 0.95, fov: 28, push: 0.05, dur: 1.0 });   // Reaper's face
const S6 = frame([0.12, 0.72, -0.2], { az: -8, el: 5, h: 2.45, fov: 30 });               // the scramble behind the jamb
const S7 = frame([0.14, 0.62, 0.45], { az: -10, el: 15, h: 1.75, fov: 30, push: 0.12, dur: 2.15 });             // face and hands: the two sweets
const S8 = frame([0.25, 0.66, -0.15], { az: -10, el: 4, h: 2.05, fov: 28, push: 0.06, dur: 1.6 });   // the two-shot: friend, sweet, toy
const beats = c.beats([
  ["01 the bodyguard", 0, S1, "hook"],
  ["02 smug", 1.4, S2],
  ["03 the idea", 2.1, S3],
  ["04 tiny threat", 3.0, S4],
  ["05 freeze", 3.75, S5, "reaction"],
  ["06 hiding", 4.75, S6, "payoff"],
  ["07 a sweet gesture", 6.25, S7],
  ["08 everyone has a weakness", 8.4, S8],
], END);

// The brief rules out burned-in text, but Jonny's standing rule (29 Oct) is a hook caption in the first second: it
// names the guard, not the twist, and is gone before the toy appears.
c.cap(0, 1.4, "When the candy has security", 250, false, { kinetic: false });

write(import.meta.url, {
  id: "candy-bodyguard",
  title: "The Candy Bodyguard",
  idea: "Story library 12: Reaper scares the Wizard away from the candy bowl, a tiny toy spider sends him behind the doorway, and the Wizard slides him a sweet",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/entry-hall-golden.png", z: -2.3, center: [-0.2, 1.2], height: 4.2 } },
  // Jonny liked the clips with background music best: his picked spooky bed under the whole clip
  music: { file: "ai/spooky/spooky-02.ogg", gain: 0.5 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", signature: false },
  hook: { show: ["wiz", "rea", "bowl"], hint: 0.14, what: "the Wizard's hand is over the candy and Reaper lunges at him" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "wiz", with: "bowl", from: 6.55, to: 7.25, reason: "his fingers dip among the sweets on top of the heap as he takes the orange one" },
    { who: "wiz", with: "sweetB", from: 6.55, to: 7.25, reason: "the purple sweet lies next to the orange one his fingers close on" },
  ],
  notes: "Generated by storyboards/candy/make-candy-bodyguard.mjs (Jonny's story library 12).",
});
