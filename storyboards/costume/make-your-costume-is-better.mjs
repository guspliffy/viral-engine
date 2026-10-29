// YOUR COSTUME IS BETTER THAN MINE (eight-trend-tests 02-copycat-costume, 29 Oct 2026), built from the clip template.
// node storyboards/costume/make-your-costume-is-better.mjs -> storyboards/costume/your-costume-is-better.json
//
// THE BRIEF (02-copycat-costume/ENGINE-PROMPT.md: 14.00 s, 420 frames, eight shots, wordless, no forced reset)
//   Joke:        Reaper dressed up as Phoenix with homemade cardboard wings; the real Phoenix's one wingbeat lifts him
//                for a glorious moment, the card gives way, and Phoenix catches him.
//   Wants:       Reaper wants to be Phoenix for Halloween (and to fly like him).
//   Consequence: the gust really lifts him, a little; the cardboard hinges fold and he drops into Phoenix's hands.
//   Ending:      Reaper straightens one bent feather and poses; Phoenix copies the crooked pose. Mutual pride, held.
//
//   1 0.00-0.60  low detail: tiny feet take one confident step; a floppy orange cardboard feather scrapes beside them
//   2 0.60-1.20  close: tape and Reaper's proud face above the costume edge (the DIY is unmistakable)
//   3 1.20-2.00  medium: the complete homemade wings, Reaper poses proudly; the real Phoenix steps in on the right
//   4 2.00-4.40  Phoenix studies the copy, smiles warmly, opens his own wings; Reaper tries to match the pose
//   5 4.40-7.20  Phoenix's one visible downward wingbeat; the gust lifts Reaper's stiff card wings and Reaper a little
//                off the ground. Both characters and the ground in shot
//   6 7.20-10.0  astonishment becomes joy; the card hinges fold under load; Phoenix sees it and reaches in
//   7 10.0-12.0  Phoenix catches Reaper round the lower torso and sets him on his feet; no cut hides the catch
//   8 12.0-14.0  Reaper straightens one bent feather and poses again; Phoenix folds his wings to copy the crooked pose
//
// Locks: Reaper left in cardboard wings strapped over his hood (no beak, no scythe), Phoenix right with his real wings,
// never attached to Reaper. Reaper rises less than half his height (0.52 m); Phoenix catches under the torso with
// both hands. No fire. Autumn pavement, two softly lit pumpkins at the edges; one direction of travel (toward us).
//
// Blocking (x right, z toward the camera): the pavement runs away from us into the painted street. Reaper walks toward
// the camera to his mark R0; Phoenix walks in from the right to P0. They stand 1.2 m apart (Phoenix a little nearer the camera), so both pairs of wings
// stay clear of each other when spread. For the catch Phoenix steps in beside Reaper (P1), side-on to him, his wings
// folded, and his hands go under Reaper's torso. Reaper rides an invisible carrier from the lift to the landing, so
// the lift, the sag and the set-down are one path and Phoenix's hands, aimed at the carrier, stay on him all the way.
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

const c = clip(), { A, sfx, cap } = c;
const END = 14.0;

// ---------------------------------------------------------------- places
const R_START = [-0.58, -0.4], R0 = [-0.58, 0.25];       // Reaper walks toward us to his mark
const P_START = [1.85, 0.38], P0 = [0.62, 0.38];            // Phoenix walks in from the right
const P1 = [0.17, 0.27];                                // beside Reaper, facing him side-on, for the catch
const LIFT = 0.3, SAG = 0.2;
const SHOW = 1;                                          // Phoenix's wings spread (his canonical wings: the brief's rig wins over the board's bigger ones)                             // how high the gust lifts him; where the fold drops him to

// eye targets (face look space: + right on screen, + up)
const R_AT_P = [0.75, 0.05], P_AT_R = [-0.75, 0.05], P_AT_RWING = [-0.85, -0.1], AT_CAM = [0, 0];

const cast = [
  { id: "rea", character: "lookdev/reaper-cardwings", at: R_START, face: "camera", expr: "smug", follow: 0.25, seed: 4.1 },
  { id: "phx", character: "duo/phoenix", at: P_START, face: -90, expr: "kind", follow: 0.3, seed: 1.7 },
];
const props = [
  { id: "pave", kind: "pavement", x: 0, z: 1.2, w: 8, d: 9, seed: 3 },
  { id: "leaves", kind: "leaves", x: 0.0, z: 0.45, w: 2.0, d: 1.2, n: 48, dir: -1, reach: 1.3, seed: 5 },
  { id: "pumpL", kind: "pumpkin", x: -1.1, z: -1.4, r: 0.16, rot: 0.35 },
  { id: "pumpR", kind: "pumpkin", x: 1.0, z: 1.05, r: 0.15, rot: -0.4 },
  { id: "lift", kind: "carrier", x: R0[0], y: 0, z: R0[1], rot: 0 },
];

// ---------------------------------------------------------------- 1 FEET + SCRAPE 0.00-0.60, 2 TAPE + PROUD FACE 0.60-1.20
A(0, "rea", "noblink"); A(0, "phx", "noblink");
A(0, "rea", "card", { side: "R", set: { raise: -0.1 }, dur: 0 });   // the right wing hangs, its feathers on the stones
A(0, "rea", "card", { side: "L", set: { raise: 0.05 }, dur: 0 });
A(0, "rea", "move", { to: R0, dur: 1.15, ease: "out", steps: 2.4 });
A(0, "rea", "look", { to: AT_CAM, dur: 0, blink: false });
A(0, "rea", "expr", { expr: "smug", set: { curve: 0.45, smirk: 0.25 }, dur: 0 });
A(0, "rea", "face", { lid: 0.3, dur: 0 });
c.arm(0, "rea", "R", { o: [0.06, 0.22, 0.05] }, 0);
c.arm(0, "rea", "L", { o: [0.06, 0.22, 0.05] }, 0);
sfx(0.05, "ai-package/cardboard-rustle", { gain: 0.45, reason: "the cardboard feather tip scraping the pavement beside his feet" });
// a proud chin-up as he lands on his mark: the lids drop to a pleased half, the smile widens
A(0.75, "rea", "expr", { expr: "smug", set: { curve: 0.6, smirk: 0.2, eye: 1.0 }, dur: 0.3 });
A(0.75, "rea", "pitch", { to: -5, dur: 0.35 });
A(0.6, "rea", "card", { side: "both", set: { raise: 0.8 }, dur: 0.25, ease: "out" });   // the taped card edges come up beside his head like a collar

// ---------------------------------------------------------------- 3 THE WHOLE COSTUME 1.20-2.00
// he lifts both card wings into a proud pose, fists on hips; Phoenix walks in from the right
A(1.2, "rea", "card", { side: "both", set: { raise: 0.6 }, dur: 0.35, ease: "out" });
c.arm(1.2, "rea", "R", "hips", 0.3, "settle");
c.arm(1.2, "rea", "L", "hips", 0.3, "settle");
A(1.25, "rea", "squash", { amount: 0.03, dur: 0.25 });
act.eyesLead(c, 1.25, "phx", P_AT_R);
A(1.25, "phx", "move", { to: P0, dur: 0.8, ease: "out", steps: 2.4 });
A(1.9, "phx", "turn", { to: -14, dur: 0.3 });
act.eyesLead(c, 1.95, "phx", P_AT_RWING);

// ---------------------------------------------------------------- 4 STUDY, SMILE, OPEN 2.00-4.40
// Phoenix studies the copy: eyes over the card wing, a small head tilt, then a warm smile
A(2.0, "phx", "look", { to: P_AT_RWING, dur: 0.25, blink: false });
A(2.05, "phx", "still", { dur: 0.7, idle: 0.1 });
A(2.1, "phx", "lean", { to: -6, dur: 0.4 });
A(2.1, "phx", "expr", { expr: "kind", set: { raise: 0.05, curve: 0.2 }, dur: 0.3 });
A(2.25, "rea", "look", { to: R_AT_P, dur: 0.2, blink: false });   // Reaper notices him looking, and keeps the pose
A(2.85, "phx", "look", { to: P_AT_R, dur: 0.2, blink: false });
A(2.9, "phx", "expr", { expr: "happy", set: { curve: 0.7 }, dur: 0.35 });
A(2.9, "phx", "lean", { to: 0, dur: 0.4 });
act.blinksAt(c, "phx", [3.15]);
// he opens his own wings, full and slow, chest out
A(3.35, "phx", "wings", { to: SHOW, dur: 0.55, ease: "out" });
A(3.35, "phx", "squash", { amount: 0.03, dur: 0.3 });
c.arm(3.35, "phx", "R", "hips", 0.35, "settle");
c.arm(3.35, "phx", "L", "hips", 0.35, "settle");
// Reaper tries to match it: the card wings jerk up as high as they go, arms out, eyes on Phoenix
A(3.75, "rea", "card", { side: "both", set: { raise: 0.85 }, dur: 0.3, ease: "anticSettle" });
c.arm(3.75, "rea", "R", { o: [0.3, 0.55, 0.05] }, 0.3, "settle");
c.arm(3.75, "rea", "L", { o: [0.3, 0.55, 0.05] }, 0.3, "settle");
A(3.8, "rea", "expr", { expr: "eager", set: { curve: 0.4, open: 0.15 }, dur: 0.25 });
act.blinksAt(c, "rea", [2.6]);

// ---------------------------------------------------------------- 5 THE WINGBEAT AND THE LIFT 4.40-7.20
const BEAT = 4.95;   // the downstroke
A(BEAT - 0.3, "phx", "look", { to: P_AT_R, dur: 0.15, blink: false });
A(BEAT - 0.3, "phx", "expr", { expr: "eager", set: { curve: 0.6 }, dur: 0.2 });
A(BEAT - 0.25, "phx", "wings", { side: "R", to: 0.12, dur: 0.22, ease: "out" });   // anticipation: a little higher
A(BEAT - 0.25, "phx", "wings", { side: "L", to: 0.12, dur: 0.22, ease: "out" });
A(BEAT, "phx", "wings", { side: "R", to: -0.8, dur: 0.16, ease: "in" });           // the downstroke
A(BEAT, "phx", "wings", { side: "L", to: -0.8, dur: 0.16, ease: "in" });
A(BEAT, "phx", "squash", { amount: 0.06, dur: 0.25 });
A(BEAT, "phx", "pitch", { to: -10, dur: 0.16 });                                    // the whole body goes into the downstroke
A(BEAT + 0.3, "phx", "pitch", { to: 0, dur: 0.4 });
c.at(BEAT, { fx: "shake", dur: 0.2, amp: 0.03 });
A(BEAT + 0.25, "phx", "wings", { side: "R", to: 0, dur: 0.6, ease: "inOut" });       // and back open
A(BEAT + 0.25, "phx", "wings", { side: "L", to: 0, dur: 0.6, ease: "inOut" });
sfx(BEAT, "wing-flap", { gain: 0.9, reason: "Phoenix's one big downstroke" });
c.prop(BEAT + 0.05, "leaves", { rise: 1 }, 1.4, "linear");                          // the gust runs over the stones toward Reaper
sfx(BEAT + 0.1, "whoosh", { gain: 0.55, reason: "the gust from the wingbeat crossing to Reaper (leaves blowing)" });
sfx(BEAT + 0.18, "flutter", { gain: 0.5, reason: "the card wings shivering in the gust" });
// the gust reaches him: the card wings snap up and shiver, he is lifted off his feet a little
A(BEAT + 0.15, "rea", "card", { side: "both", set: { raise: 1, flutter: 1 }, dur: 0.2, ease: "out" });
A(BEAT + 0.15, "rea", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2 }, dur: 0.15 });
A(BEAT + 0.15, "rea", "face", { lid: 0, brow: 0.35, dur: 0.15 });
A(BEAT + 0.2, "rea", "ride", { prop: "lift", dur: 0.01 });
c.prop(BEAT + 0.3, "lift", { y: LIFT }, 0.45, "out");                               // a jump, not a drift
c.arm(BEAT + 0.2, "rea", "R", { o: [0.36, 0.5, 0.1] }, 0.3, "out");
c.arm(BEAT + 0.2, "rea", "L", { o: [0.36, 0.5, 0.1] }, 0.3, "out");
A(BEAT + 0.3, "rea", "look", { to: [0, -0.6], dur: 0.2, blink: false });        // down at his own feet, off the ground
A(BEAT + 0.3, "rea", "still", { dur: 1.2, idle: 0.3 });
A(BEAT + 0.6, "phx", "look", { to: [-0.8, 0.3], dur: 0.3, blink: false });       // Phoenix watches him go up
A(BEAT + 0.6, "phx", "expr", { expr: "delighted", set: { open: 0.3 }, dur: 0.3 });
A(6.4, "rea", "card", { side: "both", set: { flutter: 0.4 }, dur: 0.5 });          // the gust passes; the card still shivers

// ---------------------------------------------------------------- 6 JOY, THE FOLD, THE REACH 7.20-10.0
A(7.2, "rea", "look", { to: R_AT_P, dur: 0.25, blink: false });
A(7.3, "rea", "expr", { expr: "delighted", set: { open: 0.5, eye: 1.15 }, dur: 0.35 });   // astonishment becomes joy
A(7.3, "rea", "face", { lid: 0, brow: 0.2, dur: 0.3 });
c.arm(7.4, "rea", "R", { o: [0.26, 0.82, 0.12] }, 0.35, "settle");               // fists up, below the hood top
c.arm(7.4, "rea", "L", { o: [0.26, 0.82, 0.12] }, 0.35, "settle");
A(7.45, "rea", "squash", { amount: 0.04, dur: 0.3 });
const FOLD = 8.6;
A(FOLD, "rea", "card", { side: "both", set: { fold: 1, flutter: 0, raise: 0.55 }, dur: 0.3, ease: "in" });   // the hinges give
A(FOLD, "rea", "card", { side: "L", set: { crook: 1 }, dur: 0.25, ease: "in" });
sfx(FOLD, "creak", { gain: 0.5, reason: "the card hinges straining as they bend" });
sfx(FOLD + 0.12, "ai-package/cardboard-rustle", { gain: 0.45, reason: "the card folding over" });
c.prop(FOLD + 0.15, "lift", { y: 0.12 }, 0.18, "in");                               // the card gives: his stomach drops
A(FOLD + 0.33, "rea", "squash", { amount: 0.06, dur: 0.2 });
c.at(FOLD + 0.3, { fx: "shake", dur: 0.15, amp: 0.025 });
A(FOLD + 0.2, "rea", "expr", { expr: "shocked", set: { open: 0.18, curve: -0.1 }, dur: 0.15 });
A(FOLD + 0.25, "rea", "look", { to: [-0.6, 0.1], dur: 0.15, blink: false });      // at his folded wing
c.arm(FOLD + 0.25, "rea", "R", { o: [0.3, 0.45, 0.1] }, 0.3, "out");
c.arm(FOLD + 0.25, "rea", "L", { o: [0.3, 0.45, 0.1] }, 0.3, "out");
// Phoenix sees the fold: the smile drops, wings tuck in, and he steps in with both hands out
A(FOLD + 0.1, "phx", "look", { to: [-0.85, 0.25], dur: 0.12, blink: false });
A(FOLD + 0.2, "phx", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.2 }, dur: 0.15 });
A(FOLD + 0.35, "phx", "wings", { to: 0, dur: 0.45 });
A(FOLD + 0.35, "phx", "wings", { side: "R", to: -0.6, dur: 0.45 });
A(FOLD + 0.35, "phx", "wings", { side: "L", to: -0.6, dur: 0.45 });
A(FOLD + 0.4, "phx", "move", { to: P1, dur: 0.6, ease: "inOut", steps: 2.4 });
A(FOLD + 0.4, "phx", "turn", { to: -65, dur: 0.5 });
c.arm(FOLD + 0.5, "phx", "R", { o: [-0.12, 0.32, 0.3] }, 0.3, "out");                    // both hands forward, low
c.arm(FOLD + 0.5, "phx", "L", { o: [-0.12, 0.32, 0.3] }, 0.3, "out");
act.eyesLead(c, FOLD + 0.8, "phx", [-0.8, -0.2]);
A(FOLD + 0.6, "phx", "crouch", { to: 0.5, dur: 0.4 });                               // down to Reaper's height
c.arm(FOLD + 0.8, "phx", "R", { prop: "lift", grip: [0.32, 0.16, 0.04] }, 0.35, "out");     // both hands under his torso, from his side
c.arm(FOLD + 0.8, "phx", "L", { prop: "lift", grip: [0.3, 0.17, -0.2] }, 0.35, "out");
c.prop(9.55, "lift", { y: 0.08 }, 0.4, "in");                                      // he slips down...

// ---------------------------------------------------------------- 7 THE CATCH, SET DOWN 10.0-12.0
// ...into Phoenix's hands, which have been under him since 9.55: a small give, then down to his feet
A(10.0, "phx", "squash", { amount: 0.04, dur: 0.25 });
sfx(10.0, "thud-soft", { gain: 0.5, reason: "Reaper dropping into Phoenix's hands" });
A(10.0, "phx", "expr", { expr: "focused", set: { curve: 0.2 }, dur: 0.2 });
A(10.05, "rea", "expr", { expr: "kind", set: { open: 0.12, eye: 1.15 }, dur: 0.25 });    // relief
A(10.1, "rea", "look", { to: [0.7, -0.15], dur: 0.2, blink: false });
c.prop(10.35, "lift", { y: 0 }, 0.9, "inOut");
A(10.35, "phx", "crouch", { to: 0.6, dur: 0.9 });                                    // he bends as he sets him down
A(11.35, "phx", "crouch", { to: 0, dur: 0.4 });
A(11.25, "rea", "ride", { prop: null });
A(11.25, "rea", "squash", { amount: 0.03, dur: 0.2 });
sfx(11.25, "step", { gain: 0.6, reason: "his feet touching the pavement" });
c.arm(11.3, "phx", "R", { o: [0.16, 0.3, 0.02] }, 0.35, "inOut");                  // hands off, out and back down to his sides
c.arm(11.3, "phx", "L", { o: [0.12, 0.3, 0.26] }, 0.35, "inOut");   // the far hand comes out in front of him, not through him
c.arm(11.75, "phx", "R", { o: [0.06, 0.22, 0.05] }, 0.25, "inOut");
c.arm(11.75, "phx", "L", { o: [0.06, 0.22, 0.05] }, 0.25, "inOut");
act.eyesLead(c, 11.8, "phx", [-0.75, 0.05]);
A(11.8, "phx", "move", { to: [0.82, 0.42], dur: 0.45, ease: "inOut", steps: 2.4 });   // a step back once his hands are down
A(12.0, "phx", "turn", { to: -30, dur: 0.4 });
A(11.5, "phx", "expr", { expr: "kind", set: { curve: 0.5 }, dur: 0.3 });
c.arm(11.3, "rea", "R", { o: [0.06, 0.22, 0.05] }, 0.4, "inOut");
c.arm(11.3, "rea", "L", { o: [0.06, 0.22, 0.05] }, 0.4, "inOut");

// ---------------------------------------------------------------- 8 STRAIGHTEN, POSE, COPY 12.0-14.0
// Reaper straightens the bent feather of his left wing (a pinch at its bend: the tip comes back up), then poses again
// with the crooked wings: the right one up, the left one hanging, a proud tilt toward Phoenix. Phoenix copies it, mirrored
// (his wing on Reaper's side hangs, the other is up, the same tilt toward Reaper): mutual pride
A(11.95, "rea", "look", { to: [0.7, -0.45], dur: 0.2, blink: false });
A(12.0, "rea", "turn", { to: -22, dur: 0.35 });                                     // his left side (the bent wing) toward us
A(12.0, "rea", "card", { side: "L", set: { raise: 0.9, fold: 0.6 }, dur: 0.3 });     // the crooked tip beside his head
c.arm(12.1, "rea", "L", { x: [0.5, 0.75, -0.3] }, 0.35, "out");
A(12.35, "rea", "grip", { side: "L", shape: "pinch", dur: 0.12 });
A(12.45, "rea", "card", { side: "L", set: { crook: 0 }, dur: 0.3, ease: "inOut" });
sfx(12.45, "ai-package/cardboard-rustle", { gain: 0.3, reason: "the bent card feather pushed straight" });
A(12.8, "rea", "grip", { side: "L", shape: "open", dur: 0.12 });
A(12.85, "rea", "turn", { to: 0, dur: 0.35 });
A(12.85, "rea", "card", { side: "R", set: { raise: 0.8, fold: 0.5 }, dur: 0.3, ease: "out" });
A(12.85, "rea", "look", { to: AT_CAM, dur: 0.2, blink: false });
A(12.85, "rea", "card", { side: "L", set: { fold: 0.85, raise: 0.4 }, dur: 0.3 });
c.arm(12.85, "rea", "R", "hips", 0.3, "settle");
c.arm(12.85, "rea", "L", "hips", 0.3, "settle");
A(12.9, "rea", "lean", { to: -9, dur: 0.35, ease: "settle" });
A(12.95, "rea", "expr", { expr: "smug", set: { curve: 0.65, smirk: 0.2 }, dur: 0.3 });
A(12.95, "rea", "face", { lid: 0.3, brow: 0, dur: 0.3 });
A(13.05, "phx", "look", { to: P_AT_R, dur: 0.2, blink: false });
A(13.25, "phx", "wings", { to: SHOW, dur: 0.4 });
A(13.25, "phx", "wings", { side: "R", to: -0.8, dur: 0.4 });
A(13.25, "phx", "wings", { side: "L", to: 0.1, dur: 0.4 });
c.arm(13.25, "phx", "R", "hips", 0.3, "settle");
c.arm(13.25, "phx", "L", "hips", 0.3, "settle");
A(13.3, "phx", "lean", { to: 9, dur: 0.35, ease: "settle" });
A(13.3, "phx", "pitch", { to: -6, dur: 0.35 });
A(13.3, "phx", "expr", { expr: "happy", set: { curve: 0.8 }, dur: 0.3 });
A(13.55, "phx", "look", { to: AT_CAM, dur: 0.2, blink: false });
A(13.45, "rea", "look", { to: R_AT_P, dur: 0.2, blink: false });
A(13.5, "rea", "expr", { expr: "happy", set: { curve: 0.6 }, dur: 0.3 });
sfx(12.9, "ai/warm-resolve", { gain: 0.3, reason: "a warm ending under the two proud poses" });

// hook caption: on screen from frame 0 (not word by word), cleared before the reveal settles
cap(0, 0.6, "My friend\ndressed as me.", 1180, false, { kinetic: false });   // low over the paving while the shot is on his feet
cap(0.6, 2.0, "My friend\ndressed as me.", 300, false, { kinetic: false });   // then above the heads

// ---------------------------------------------------------------- shots (by hand: the brief fixes all eight)
const S1 = { pos: [-0.95, 0.12, 1.75], look: [-0.72, 0.14, 0.0], fov: 40 };                      // low: feet + feather
const S2 = { pos: [-0.2, 1.2, 2.75], look: [-0.62, 0.95, 0.2], fov: 36 };                       // close: face + taped wing root
const MASTER = { pos: [0.02, 1.05, 5.9], look: [0.02, 0.72, 0.3], fov: 37 };                    // medium: both, wings and ground
const S3 = MASTER;
const S4 = { pos: [0.06, 1.0, 5.4], look: [0.0, 0.8, 0.3], fov: 37, to: { pos: [0.03, 0.98, 4.5], look: [0.0, 0.8, 0.3] }, dur: 2.4 };                          // the two-shot, a step nearer
const S5 = { pos: [-0.05, 0.45, 6.3], look: [-0.05, 0.55, 0.3], fov: 37 };                       // wider: both + the ground
const S6 = { pos: [-0.05, 1.05, 5.4], look: [-0.15, 0.85, 0.35], fov: 37, to: { pos: [-0.12, 1.0, 4.7], look: [-0.12, 0.84, 0.35] }, dur: 1.4 };
const S7 = { pos: [-0.15, 0.95, 4.6], look: [-0.18, 0.66, 0.4], fov: 37 };
const S8 = { pos: [0.12, 1.0, 5.2], look: [0.12, 0.74, 0.3], fov: 44 };                         // the two poses, a step nearer
const beats = c.beats([
  ["1 feet and feather", 0, S1, "hook"],
  ["2 tape and pride", 0.6, S2],
  ["3 the whole costume", 1.2, S3, "reveal"],
  ["4 study, smile, open", 2.0, S4],
  ["5 the wingbeat", 4.4, S5],
  ["5 the gust lifts him", BEAT, "keep", "payoff"],             // same shot: the payoff (and the music's beat 1) is the downstroke
  ["6 joy, the fold, the reach", 7.2, S6, "escalation"],
  ["7 the catch", 10.0, S7],
  ["8 crooked pride", 12.0, S8, "reaction"],
], END);

write(import.meta.url, {
  id: "your-costume-is-better",
  title: "Your Costume Is Better Than Mine",
  idea: "Eight trend tests 02 (Ramalama costume walk, adapted): Reaper in homemade cardboard Phoenix wings; Phoenix's wingbeat lifts him, the card folds, Phoenix catches him",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [12, 16], loop: false },
  set: { type: "plain", color: "#f3d9a8", floor: "#a88f78", light: "golden", key: [-4.5, 4.2, 3.2], aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/autumn-sidewalk.png", z: -2.2, center: [0.0, 1.7], height: 6.8 } },
  sound: { sfx: 0.7, ambience: 0.25, surface: "concrete", signature: false },
  hook: { show: ["rea"], hint: 0.6, what: "a homemade cardboard feather scraping beside Reaper's feet, then his proud face (the brief opens on the feet)" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "phx", with: "rea", from: 9.3, to: 12.0, reason: "the catch: Phoenix's hands under Reaper's torso (brief shot 7), until he steps back" },
  ],
  notes: "Generated by storyboards/costume/make-your-costume-is-better.mjs (eight-trend-tests 02-copycat-costume).",
});
