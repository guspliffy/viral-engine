// MOVING ONE SOFA (Jonny's four friend comedies #22, 30 Oct 2026), built from the clip template.
// node storyboards/friend-comedies/22-moving-one-sofa/make-moving-one-sofa.mjs -> moving-one-sofa.json (same folder)
// Brief: /mnt/project-files/video-scripts/2026-10-30-four-friend-comedies/engine-pack/22-moving-one-sofa/ENGINE-PROMPT.md
//
// THE BRIEF (exactly 10 s, Phoenix, Wizard, Reaper; eight beats, eight-panel board)
//   Joke:        three friends, one sofa jammed across a narrow doorway: brute force bounces off, magic hits the
//                ceiling and drops it into the same jam, Reaper just cuts it in half.
//   Wants:       everyone wants the sofa through the doorway.
//   Consequence: one sofa becomes exactly two halves that each fit; the doorway never changes.
//   Ending:      both halves are in the room and Reaper sits calmly on his half; the other two stare from the landing.
//
//   1 0.00-1.20 JAMMED: Phoenix already shoving the teal two-seater jammed broadside across the doorway; the Wizard
//               watches, Reaper waits deadpan with his scythe                      (effort grunt, upholstery squeak)
//   2 1.20-2.20 CHARGE: Phoenix backs off, flares his wings and launches straight at it            (launch rush)
//   3 2.20-3.20 BOUNCE: he hits the arm, the upholstery squashes, he bounces back and lands, stunned; the sofa
//               has not moved                                                                  (springy impact)
//   4 3.20-4.20 MAGIC: the Wizard raises his staff; a compact golden spell lifts the same sofa, feet clear    (spell)
//   5 4.20-5.70 CEILING: one quick uncontrolled turn upward, it hits one patch of plaster ceiling, chunks fall,
//               the spell gives out and it drops                                    (ceiling thud, plaster falling)
//   6 5.70-6.70 STILL STUCK: it lands broadside in the SAME jam; dust settles; Reaper takes one calm step   (thud)
//   7 6.70-8.30 CUT: one controlled vertical scythe cut between the two seats; two one-seat halves part (swish)
//   8 8.30-10.0 SOLVED: Reaper pushes the halves through the unchanged doorway one after the other; he sits on his
//               half inside the room, calm; Wizard and Phoenix stare from the landing  (two floor scrapes, seat creak)
//
// Departures (each with its reason; the brief wins everywhere else):
// - The caption "my friend group moving one sofa" is on screen 0-2.4 s (Jonny 29 Oct: every clip opens on a caption,
//   even when a brief says the caption is only for the post).
// - Background music from 0:00 (Jonny 29 Oct: every clip has music), ducked under the effects.
// - Phoenix's opening grunt is the lab-pick opener (a wordless effort sound in the first half second).
// - The doorway sits behind the sofa's RIGHT half (not its middle): after the cut that half goes straight back
//   through the opening, and the left half follows after a cut (8a: right half, 8b: left half, already square to the
//   opening). With the opening in the middle, neither half could reach it while the other still stood in front of it.
// - Reaper sits on the LEFT half (the brief: "one supported half"; the board's panel 8 shows the right one): it is the
//   one he pushes in last, so he is already at its front and only turns and sits.
//
// Blocking (x right, z toward the camera, y up; set-landing.js LANDING): the doorway wall at z 0, the opening at
// x -0.53..0.53; the sofa (two sofahalf props, props-sofa.js) stands against it, its seam at x -SOFA.half / 2. Phoenix
// at its left end, the Wizard front left, Reaper right. Banister and stairs down on the far left.
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { LANDING as LD } from "../../../engine/page/set-landing.js";
import { SOFA } from "../../../engine/page/props-sofa.js";

const OPENER = { who: "phx", line: "hnnngh!", words: false };
const FOCUS = true;
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx } = c;
const END = 9.8;                         // + two 3-frame hit-stops = exactly 10.0 s of video

// ---------------------------------------------------------------- places
const S = 1.3;                            // the sofa's scale: as on the board, its back comes to the potatoes' shoulders
const HW = r3(SOFA.half * S), D = r3(SOFA.d * S), BACK = r3(SOFA.back * S);   // one half 1.09 wide: narrower than the opening (1.3)
const SZ = r3(0.03 + D / 2);              // the sofa's centre line: its back against the wall
const SEAM = r3(-HW / 2);                 // the cut line; the right half stands square in the opening
const L0 = [r3(SEAM - HW / 2), SZ], R0 = [r3(SEAM + HW / 2), SZ];
const PHX0 = [-2.08, 0.72], PHX_BACK = [-2.85, 1.0], PHX_DOWN = [-2.75, 1.2], PHX_WATCH = [-1.0, 2.1];
const WIZ0 = [1.6, 2.05], WIZ_FLINCH = [1.55, 2.35];
const REA0 = [1.3, 0.72], REA_CUT = [0.4, 1.95], REA_PUSH = [0.42, 1.62];

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 75, expr: "focused", follow: 0.25, seed: 1.7 },
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ0, face: -35, expr: "kind", follow: 0.25, seed: 2.6 },
  { id: "rea", character: "sofa/reaper-scythe", at: REA0, face: -20, expr: "kind", follow: 0.2, seed: 3.3 },
];
const props = [
  { id: "sofaL", kind: "sofahalf", side: "L", x: L0[0], z: L0[1], scale: S },
  { id: "sofaR", kind: "sofahalf", side: "R", x: R0[0], z: R0[1], scale: S },
  { id: "aura", kind: "spellaura", x: SEAM, y: 0, z: SZ, w: r3(2 * HW + 0.3), d: r3(D + 0.3) },
];

// ---------------------------------------------------------------- the sofa as one rigid body (both halves) until the cut
// sofaKey: the whole sofa lifted by y and turned by roll degrees (about z, through its middle at PIV height)
const PIV = r3(0.45 * S);
function sofaKey(t, y, roll, dur, ease = "linear") {
  const r = (roll * Math.PI) / 180;
  for (const [id, ox] of [["sofaL", -HW / 2], ["sofaR", HW / 2]]) {
    const oy = -PIV;
    const x = SEAM + Math.cos(r) * ox - Math.sin(r) * oy, yy = y + PIV + Math.sin(r) * ox + Math.cos(r) * oy;
    c.prop(t, id, { x: r3(x), y: r3(yy), roll: r3(roll) }, dur, ease);
  }
  c.prop(t, "aura", { y: r3(y), roll: r3(roll) }, dur, ease);
}
// the top right corner of the backrest is the first thing to reach the ceiling on the turn
const PEAK_ROLL = 22, CORNER = [HW, BACK - PIV];
const cr = (PEAK_ROLL * Math.PI) / 180;
const PEAK_Y = r3(LD.h - (Math.sin(cr) * CORNER[0] + Math.cos(cr) * CORNER[1]) - PIV);
const HIT = [r3(SEAM + Math.cos(cr) * CORNER[0] - Math.sin(cr) * CORNER[1]), r3(SZ - D / 2 + 0.14)];
props.push({ id: "ceiling", kind: "ceilingbreak", x: HIT[0], y: LD.h, z: HIT[1], floor: LD.h, r: 0.38, seed: 5,
  lands: [[-0.9, 1.3], [-0.3, 1.45], [0.25, 1.25], [-1.4, 1.15], [-0.6, 1.75]] });

// ---------------------------------------------------------------- 1 JAMMED (0-1.2)
c.cap(0, 2.4, "my friend group moving one sofa", 250, false, { kinetic: false });
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// Phoenix shoves the sofa's left arm with both palms (the arm's outer face, local x -HW/2), leaning in hard
const PUSH_R = { prop: "sofaL", grip: [-SOFA.half / 2 - 0.025, 0.5, 0.2], palm: true }, PUSH_L = { prop: "sofaL", grip: [-SOFA.half / 2 - 0.025, 0.47, -0.14], palm: true };
c.arm(0, "phx", "R", PUSH_R, 0); c.arm(0, "phx", "L", PUSH_L, 0);
A(0, "phx", "grip", { side: "both", shape: "flat", dur: 0 });
A(0, "phx", "lean", { to: 14, dur: 0 }); A(0, "phx", "pitch", { to: 8, dur: 0 });
A(0, "phx", "expr", { expr: "angry", set: { open: 0.35, curve: -0.35, eye: 0.85 }, dur: 0 });
A(0, "phx", "look", { to: [0.6, -0.1], dur: 0, blink: false });
for (const t of [0.08, 0.5, 0.88]) { A(t, "phx", "squash", { amount: 0.07, dur: 0.28 }); }
// the sofa only creaks: a tiny wobble in place, nothing moves
for (const [t, r] of [[0.1, 1.2], [0.3, -0.6], [0.52, 1.0], [0.72, -0.4], [0.92, 0]]) { c.prop(t, "sofaL", { rot: r }, 0.18); c.prop(t, "sofaR", { rot: r * 0.5 }, 0.18); }
sfx(0.1, "creak", { gain: 0.45, reason: "the upholstery squeaks against the door frame as Phoenix shoves" });
sfx(0.55, "creak", { gain: 0.35, reason: "a second squeak on his next shove" });
// the Wizard watches, unimpressed; Reaper waits deadpan, scythe upright
A(0, "wiz", "look", { to: [-0.7, -0.05], dur: 0, blink: false }); A(0, "wiz", "face", { lid: 0.32, dur: 0 });
A(0, "wiz", "expr", { expr: "kind", set: { curve: -0.05 }, dur: 0 });
A(0, "rea", "look", { to: [-0.6, -0.05], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.45, dur: 0 });
A(0, "rea", "expr", { expr: "kind", set: { curve: 0, open: 0 }, dur: 0 });
A(0.1, "rea", "still", { dur: 5.9, idle: 0.08 });
act.blinksAt(c, "rea", [2.9, 6.05]); act.blinksAt(c, "wiz", [1.0, 5.95]); act.blinksAt(c, "phx", [3.05]);

// ---------------------------------------------------------------- 2 CHARGE (1.2-2.2)
c.arm(1.2, "phx", "R", "rest", 0.2, "inOut"); c.arm(1.2, "phx", "L", "rest", 0.2, "inOut");
A(1.2, "phx", "lean", { to: 0, dur: 0.2 }); A(1.2, "phx", "pitch", { to: 0, dur: 0.2 });
A(1.22, "phx", "move", { to: PHX_BACK, dur: 0.32, ease: "out", steps: 2 });
A(1.22, "phx", "turn", { to: 105, dur: 0.3 });
A(1.25, "phx", "expr", { expr: "angry", set: { open: 0.05, curve: -0.25, eye: 0.9 }, dur: 0.25 });
A(1.25, "phx", "look", { to: [0.8, -0.05], dur: 0.15, blink: false });
act.windUp(c, 1.56, "phx");
A(1.6, "phx", "wings", { to: 1, dur: 0.12 });
const LAUNCH = 1.82, HITT = 2.2;
A(LAUNCH, "phx", "fly", { to: { x: r3(L0[0] - HW / 2 - 0.42), y: 0.16, z: r3(SZ + 0.2) }, dur: r3(HITT - LAUNCH), ease: "in" });
A(LAUNCH, "phx", "pitch", { to: 18, dur: 0.12 });
c.arm(LAUNCH, "phx", "R", { o: [0.14, 0.42, 0.42] }, 0.15, "out"); c.arm(LAUNCH, "phx", "L", { o: [0.14, 0.42, 0.42] }, 0.15, "out");
A(LAUNCH, "phx", "grip", { side: "both", shape: "fist", dur: 0.1 });
sfx(r3(LAUNCH - 0.02), "flamejet", { gain: 0.28, dur: 0.5, reason: "Phoenix launches at the sofa (the launch rush)" });

// ---------------------------------------------------------------- 3 BOUNCE (2.2-3.2)
act.impact(c, HITT, "phx", { sound: "ai/cushion-poof", gain: 0.75, recoil: -14 });
c.prop(HITT, "sofaL", { bump: 1 }, 0.05, "out"); c.prop(r3(HITT + 0.12), "sofaL", { bump: 0 }, 0.3, "settle");
A(r3(HITT + 0.06), "phx", "fly", { to: { x: PHX_DOWN[0], y: 0.32, z: PHX_DOWN[1] }, dur: 0.3, ease: "out" });
A(r3(HITT + 0.06), "phx", "pitch", { to: -16, dur: 0.15, ease: "out" });
c.arm(r3(HITT + 0.06), "phx", "R", { o: [0.34, 0.72, 0.12] }, 0.15, "out"); c.arm(r3(HITT + 0.06), "phx", "L", { o: [0.34, 0.72, 0.12] }, 0.15, "out");
A(r3(HITT + 0.06), "phx", "grip", { side: "both", shape: "open", dur: 0.1 });
A(2.4, "phx", "turn", { to: 45, dur: 0.3 });
A(2.42, "phx", "drop", { to: 0, dur: 0.2 });
act.landDust(c, 2.62, PHX_DOWN);
sfx(2.62, "thud", { gain: 0.4 });
A(2.6, "phx", "wings", { to: 0, dur: 0.3 }); A(2.62, "phx", "pitch", { to: 0, dur: 0.3, ease: "settle" });
c.arm(2.65, "phx", "R", "rest", 0.3, "settle"); c.arm(2.65, "phx", "L", "rest", 0.3, "settle");
A(2.68, "phx", "expr", { expr: "dizzy", dur: 0.25 });
A(2.7, "phx", "still", { dur: 0.5, idle: 0.3 });
// the Wizard's eyes follow the bounce; the sofa holds, unchanged
A(2.25, "wiz", "look", { to: [-0.85, -0.12], dur: 0.15, blink: false });
A(2.75, "wiz", "face", { lid: 0.45, dur: 0.25 });

// ---------------------------------------------------------------- 4 MAGIC (3.2-4.2)
// the Wizard raises his staff (left hand, the grip library's staff hold) and lifts the sofa a hand's height
A(3.2, "wiz", "look", { to: [-0.45, -0.1], dur: 0.12, blink: false });
A(3.22, "wiz", "turn", { to: -55, dur: 0.25 });
A(3.25, "wiz", "expr", { expr: "focused", dur: 0.25 }); A(3.25, "wiz", "face", { lid: 0.2, dur: 0.25 });
A(3.25, "wiz", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(3.3, "wiz", "L", { o: [0.4, 0.7, 0.32] }, 0.3, "out"); A(3.3, "wiz", "tilt", { to: [18, 8], dur: 0.3 });
A(3.45, "wiz", "charge", { to: 1, dur: 0.3 });
sfx(3.4, "charge", { gain: 0.3, dur: 1.0, reason: "the Wizard's compact lift spell" });
c.prop(3.55, "aura", { glow: 1 }, 0.25);
sofaKey(3.6, 0.2, 0, 0.5, "inOut");
for (const [t, r] of [[3.95, 1.5], [4.1, -1.0]]) sofaKey(t, 0.2 + (t > 4 ? 0.02 : 0), r, 0.15, "inOut");
// Phoenix gets up and looks
A(3.3, "phx", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.1 }, dur: 0.25 });
A(3.35, "phx", "look", { to: [0.5, 0.2], dur: 0.15, blink: false });
A(3.5, "rea", "look", { to: [-0.45, 0.1], dur: 0.2, blink: false });

// ---------------------------------------------------------------- 5 CEILING (4.2-5.7)
// one quick uncontrolled turn upward: the right end swings up, the backrest corner smacks the plaster
const UP = 4.24, CEIL = 4.62;
sofaKey(UP, r3(PEAK_Y - 0.05), PEAK_ROLL - 4, r3(CEIL - UP - 0.04), "in");
sofaKey(r3(CEIL - 0.04), PEAK_Y, PEAK_ROLL, 0.04, "linear");
c.prop(CEIL, "ceiling", { smash: 1 }, 0.03);
c.prop(r3(CEIL + 0.03), "ceiling", { fall: 1 }, 0.62, "linear");
c.at(CEIL, { fx: "shake", dur: 0.25, amp: 0.03 });
c.at(CEIL, { fx: "poof", pos: [HIT[0], LD.h - 0.1, HIT[1]], dur: 0.6, color: "#efe3cf", puffs: 9, sparks: 0, size: 0.5, lift: -0.1 });
sfx(CEIL, "thud", { gain: 0.8, reason: "the sofa's corner hits the plaster ceiling" });
sfx(r3(CEIL + 0.05), "ai/screen-crack", { gain: 0.35, reason: "the plaster cracks round the hole" });
for (const [t, g] of [[5.0, 0.4], [5.08, 0.3], [5.15, 0.35], [5.22, 0.25]]) sfx(t, "kenney/impact-mining", { gain: g, reason: "plaster chunks land on the floorboards" });
// it hangs there a moment, wobbling; the spell sputters out and it drops straight back
sofaKey(r3(CEIL + 0.02), r3(PEAK_Y - 0.06), PEAK_ROLL - 6, 0.25, "out");
sofaKey(4.95, r3(PEAK_Y - 0.12), PEAK_ROLL - 3, 0.25, "inOut");
for (const [t, g] of [[5.05, 0.3], [5.12, 0.9], [5.2, 0.2], [5.26, 0]]) c.prop(t, "aura", { glow: g }, 0.05);
A(5.05, "wiz", "charge", { to: 0, dur: 0.2 });
// the Wizard strains to hold it up there (staff wobbling, eyes squeezed)
A(4.7, "wiz", "tilt", { to: [26, 2], dur: 0.15, ease: "inOut" }); A(4.9, "wiz", "tilt", { to: [12, 10], dur: 0.15, ease: "inOut" });
A(4.72, "wiz", "face", { lid: 0.1, dur: 0.15 }); A(4.75, "wiz", "squash", { amount: 0.1, dur: 0.3 });
// Phoenix, back on his feet, walks over to watch the sofa float (off camera in this shot)
A(4.4, "phx", "move", { to: PHX_WATCH, dur: 0.7, ease: "inOut", steps: 3 }); A(4.4, "phx", "turn", { to: 60, dur: 0.4 });
const LAND = 5.7;
sofaKey(5.25, 0, 0, r3(LAND - 5.25), "in");
// faces: the Wizard winces at the crack, then all of them watch it fall
A(CEIL, "wiz", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.25, curve: -0.3 }, dur: 0.12 }); A(CEIL, "wiz", "face", { lid: 0, brow: 0.4, dur: 0.15 });
A(4.3, "wiz", "look", { to: [-0.3, 0.7], dur: 0.12, blink: false });
A(4.3, "phx", "look", { to: [0.55, 0.75], dur: 0.15, blink: false });
A(4.32, "rea", "look", { to: [-0.4, 0.75], dur: 0.2, blink: false });
A(5.25, "wiz", "look", { to: [-0.45, -0.25], dur: 0.25, blink: false }); A(5.25, "phx", "look", { to: [0.6, -0.2], dur: 0.25, blink: false }); A(5.3, "rea", "look", { to: [-0.45, -0.2], dur: 0.25, blink: false });
c.arm(5.2, "wiz", "L", "rest", 0.4, "inOut"); A(5.2, "wiz", "tilt", { to: null, dur: 0.4 });

// ---------------------------------------------------------------- 6 STILL STUCK (5.7-6.7)
c.prop(LAND, "sofaL", { squash: 0.06, plaster: 1 }, 0.06, "out"); c.prop(LAND, "sofaR", { squash: 0.06, plaster: 1 }, 0.06, "out");
c.prop(r3(LAND + 0.08), "sofaL", { squash: 0 }, 0.25, "settle"); c.prop(r3(LAND + 0.08), "sofaR", { squash: 0 }, 0.25, "settle");
sfx(LAND, "thud", { gain: 0.9, reason: "the sofa drops back into the same jam" });
c.at(LAND, { fx: "shake", dur: 0.2, amp: 0.025 });
for (const x of [L0[0], R0[0]]) act.landDust(c, LAND, [x, SZ + 0.1], { puffs: 7 });
A(LAND, "wiz", "move", { to: WIZ_FLINCH, dur: 0.2, ease: "out", steps: 1 });
A(5.8, "wiz", "expr", { expr: "annoyed", dur: 0.3 }); A(5.8, "wiz", "face", { lid: 0.4, brow: 0, dur: 0.3 });
A(5.8, "phx", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.1, curve: -0.35 }, dur: 0.3 });
// Reaper: one calm step forward, to the front of the seam
A(6.05, "rea", "look", { to: [-0.6, -0.15], dur: 0.15, blink: false });
A(6.1, "rea", "move", { to: [0.95, 1.55], dur: 0.3, ease: "in", steps: 1 });
A(6.4, "rea", "move", { to: REA_CUT, dur: 0.32, ease: "out", steps: 1 });
A(6.3, "rea", "turn", { to: -95, dur: 0.4 });
A(6.7, "wiz", "look", { to: [-0.6, 0], dur: 0.2, blink: false }); A(6.6, "phx", "look", { to: [0.7, -0.05], dur: 0.15, blink: false });
A(6.72, "phx", "turn", { to: 35, dur: 0.3 });

// ---------------------------------------------------------------- 7 CUT (6.7-8.3)
// he raises the scythe, then one vertical cut down the seam between the seats
const SCY_UP = { o: [0.26, 0.98, 0.26] }, SCY_DOWN = { o: [0.06, 0.5, 0.45] };
c.arm(6.74, "rea", "R", { o: [0.36, 0.66, 0.22] }, 0.16, "inOut"); c.arm(6.9, "rea", "R", SCY_UP, 0.2, "out"); A(6.78, "rea", "tilt", { to: [-25, 0], dur: 0.32 });
A(6.85, "rea", "expr", { expr: "focused", set: { curve: 0 }, dur: 0.25 }); A(6.85, "rea", "face", { lid: 0.35, dur: 0.25 });
act.windUp(c, 7.0, "rea", { amount: 0.12 });
const CUT = 7.3;
sfx(r3(CUT - 0.02), "blade-cut", { gain: 0.45, reason: "one clean scythe swish down the seam" });
c.arm(CUT, "rea", "R", SCY_DOWN, 0.1, "in"); A(CUT, "rea", "tilt", { to: [55, 0], dur: 0.1, ease: "in" });
c.at(r3(CUT + 0.02), { fx: "slash", pos: [SEAM, 0.65, r3(SZ + 0.2)], r: 0.6, from: 100, arc: -170, dur: 0.14 });
c.hitStop(r3(CUT + 0.1), 3);
c.prop(r3(CUT + 0.08), "sofaL", { cut: 1 }, 0.02); c.prop(r3(CUT + 0.08), "sofaR", { cut: 1 }, 0.02);
// the left half tips away and slides out of the jam; the right half stays square in the opening
const PART = r3(CUT + 0.2), L1 = [r3(L0[0] - 0.45), SZ];
c.prop(PART, "sofaL", { x: L1[0], roll: 6 }, 0.22, "out"); c.prop(r3(PART + 0.22), "sofaL", { roll: 0 }, 0.18, "settle");
c.prop(PART, "sofaR", { roll: -3 }, 0.1, "out"); c.prop(r3(PART + 0.1), "sofaR", { roll: 0 }, 0.2, "settle");
sfx(PART, "scrape", { gain: 0.35, dur: 0.3, reason: "the left half slides out of the jam" });
c.at(r3(CUT + 0.12), { fx: "poof", pos: [SEAM, 0.55, r3(SZ + D / 2 - 0.1)], dur: 0.4, color: "#f4e7b6", puffs: 6, sparks: 0, size: 0.3, lift: 0.05 });
// the others' jaws drop; Reaper settles the scythe back, unbothered
A(r3(CUT + 0.15), "wiz", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.3, curve: -0.4 }, dur: 0.15 }); A(r3(CUT + 0.15), "wiz", "face", { lid: 0, brow: 0.45, dur: 0.15 });
A(r3(CUT + 0.15), "phx", "expr", { expr: "shocked", set: { open: 0.6, eye: 1.3, curve: -0.45 }, dur: 0.15 });
const STARE = 7.62;                      // the reaction insert on the other two
A(r3(STARE + 0.02), "phx", "squash", { amount: 0.08, dur: 0.25 }); A(r3(STARE + 0.02), "wiz", "squash", { amount: 0.06, dur: 0.25 });
c.arm(7.52, "rea", "R", { o: [0.36, 0.6, 0.3] }, 0.22, "inOut"); c.arm(7.74, "rea", "R", "rest", 0.25, "inOut"); A(7.52, "rea", "tilt", { to: null, dur: 0.4 });
A(7.65, "rea", "expr", { expr: "kind", set: { curve: 0.05 }, dur: 0.3 }); A(7.65, "rea", "face", { lid: 0.45, dur: 0.3 });
A(7.82, "rea", "look", { to: [0.1, -0.2], dur: 0.12, blink: false });
A(7.95, "rea", "move", { to: REA_PUSH, dur: 0.3, ease: "inOut", steps: 1 }); A(7.95, "rea", "turn", { to: 180, dur: 0.3 });

// ---------------------------------------------------------------- 8 SOLVED (8.3-10.0)
// the other two step up to the doorway to look (out of frame in 8a: placed at the cut to 8b)
const B8 = 8.76;                         // the cut from 8a to 8b
const PHX_END = [-0.75, 2.2], WIZ_END = [1.0, 2.35];
A(B8, "phx", "move", { to: PHX_END, dur: 0.01 }); A(B8, "phx", "turn", { to: 168, dur: 0.01 });
A(B8, "wiz", "move", { to: WIZ_END, dur: 0.01 }); A(B8, "wiz", "turn", { to: 198, dur: 0.01 });
// 8a: his free left hand on the right half's arm, he shoves it straight back through the opening; it slides on into
// the room and off to the right. He stops at the threshold (the opening is only a little wider than the half)
const RIN = [0.98, -1.15], LIN = [-0.25, -1.5];
const PUSH = (id) => ({ prop: id, grip: [SOFA.half / 2 - 0.1, SOFA.armTop + 0.01, r3(SOFA.d / 2 - 0.12)], palm: true });
const LET_GO = { o: [0.3, 0.42, 0.22] };
c.arm(8.22, "rea", "L", PUSH("sofaR"), 0.14, "out"); A(8.24, "rea", "grip", { side: "L", shape: "flat", dur: 0.1 });
c.prop(8.34, "sofaR", { z: -0.9 }, 0.42, "inOut"); c.prop(8.76, "sofaR", { x: RIN[0], z: RIN[1] }, 0.25, "out");
sfx(8.36, "scrape", { gain: 0.5, dur: 0.4, reason: "floor scrape 1: the right half slides through the doorway" });
A(8.34, "rea", "move", { to: [REA_PUSH[0], 0.95], dur: 0.24, ease: "out", steps: 1 });
c.arm(8.4, "rea", "L", LET_GO, 0.14, "out"); c.arm(8.56, "rea", "L", "rest", 0.15, "inOut");
// 8b (a reframe; he has gone back for it): the left half, already pushed square to the opening, gets the same shove,
// slides straight in, and he follows it through and sits down on it
c.prop(B8, "sofaL", { x: 0, z: SZ, roll: 0 }, 0.01);
A(B8, "rea", "move", { to: REA_PUSH, dur: 0.01 }); c.arm(B8, "rea", "L", PUSH("sofaL"), 0.01);
c.prop(8.78, "sofaL", { x: LIN[0], z: LIN[1] }, 0.42, "inOut");
sfx(8.8, "scrape", { gain: 0.5, dur: 0.4, reason: "floor scrape 2: the left half slides through the doorway" });
A(8.78, "rea", "move", { to: [REA_PUSH[0], 0.95], dur: 0.2, ease: "out", steps: 1 });
c.arm(8.84, "rea", "L", LET_GO, 0.12, "out"); c.arm(8.98, "rea", "L", "rest", 0.15, "inOut");
A(8.85, "rea", "look", { to: [0, -0.2], dur: 0.12, blink: false });
A(8.98, "rea", "move", { to: [LIN[0], r3(LIN[1] + D / 2 + 0.42)], dur: 0.26, ease: "inOut", steps: 2 });
A(9.14, "rea", "turn", { to: 0, dur: 0.2, ease: "inOut" });
A(9.14, "rea", "ride", { prop: "sofaL", off: [0, 0.35, 0.03], sit: true, dur: 0.18 });
sfx(9.3, "sit", { gain: 0.5, reason: "the seat creaks as Reaper sits on his half" });
A(9.25, "rea", "look", { to: [0, 0.05], dur: 0.15, blink: false });
A(9.28, "rea", "expr", { expr: "kind", set: { curve: 0.3, open: 0 }, dur: 0.3 }); A(9.28, "rea", "face", { lid: 0.62, dur: 0.3 });
A(9.36, "rea", "still", { dur: 0.42, idle: 0.04 });
A(B8, "phx", "look", { to: [0.15, 0.0], dur: 0.2, blink: false }); A(B8, "wiz", "look", { to: [0.2, 0.0], dur: 0.2, blink: false });
A(B8, "phx", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.2, curve: -0.3 }, dur: 0.2 });

// ---------------------------------------------------------------- shots: [name, start, camera, kind?]
const beats = c.beats([
  ["1a jammed", 0, { pos: [-0.4, 1.5, 6.9], look: [-0.4, 0.85, 0.5], fov: 60, to: { pos: [-0.4, 1.45, 6.4] }, dur: 0.6, ease: "linear" }, "hook"],
  ["1b watching", 0.6, { pos: [0.3, 1.1, 5.8], look: [1.15, 0.9, 1.3], fov: 48, focus: [1.45, 0.9, 1.4] }],
  ["2 charge", 1.2, { pos: [-2.0, 0.95, 4.7], look: [-2.15, 0.72, 0.8], fov: 50 }],
  ["3 bounce", 2.2, "keep"],
  ["4 magic", 3.2, { pos: [1.7, 1.05, 6.2], look: [0.5, 1.05, 0.9], fov: 54, focus: [1.0, 0.9, 1.3], to: { pos: [1.65, 1.05, 6.0] }, dur: 1.0, ease: "linear" }],
  ["5 ceiling", 4.2, { pos: [1.1, 0.55, 5.9], look: [0.1, 1.45, 0.5], fov: 66, focus: [0.6, 1.2, 1.3] }],
  ["6 still stuck", 5.7, { pos: [0.25, 1.2, 6.8], look: [0.25, 0.85, 0.9], fov: 64, focus: [0.2, 0.9, 1.5] }],
  ["7 cut", 6.7, { pos: [-1.35, 1.05, 5.5], look: [-0.1, 0.8, 0.9], fov: 50, focus: [0, 0.8, 1.3] }, "payoff"],
  ["7b stare", STARE, { pos: [0.3, 1.05, 6.8], look: [0.3, 0.85, 2.0], fov: 62, focus: [0.3, 0.9, 2.1] }],
  ["8a solved", 7.97, { pos: [-0.5, 2.1, 5.2], look: [0.05, 0.5, -1.0], fov: 48, focus: [0.4, 0.7, 0.5] }],
  ["8b solved", B8, { pos: [-0.1, 2.3, 5.0], look: [0.05, 0.55, -1.3], fov: 52, focus: [-0.25, 0.8, -1.2] }],
  ["8c sits", 9.3, { pos: [-0.1, 2.3, 5.0], look: [0.05, 0.55, -1.3], fov: 52, focus: [-0.25, 0.8, -1.2], to: { pos: [-0.1, 1.9, 3.9] }, dur: 0.5, ease: "out" }, "reaction"],
], END);

// contact a beat needs, with its reason; the checks read these windows on the video's clock (after the hit-stops)
const HOLDS = c.hitStops.map((h) => ({ at: h.at, dur: h.frames / 30 }));
const rt = (t) => r3(t + HOLDS.filter((h) => t > h.at + 1e-9).reduce((a, h) => a + h.dur, 0));
const ALLOW = [
    { who: "phx", with: "sofaL", from: 0, to: 1.25, reason: "Phoenix shoves the sofa's left arm with both palms" },
    { who: "phx", with: "sofaL", from: 2.15, to: 2.4, reason: "Phoenix flies into the arm's upholstery and bounces off it" },
    { who: "rea", with: "sofaL", from: 7.25, to: 7.45, reason: "the scythe cuts down through the sofa between the seats" },
    { who: "rea", with: "sofaR", from: 7.25, to: 7.45, reason: "the scythe cuts down through the sofa between the seats" },
    { who: "rea", with: "sofaR", from: 8.2, to: B8, reason: "Reaper's palm pushes the right half's arm" },
    { who: "rea", with: "sofaL", from: B8, to: 9.1, reason: "Reaper's palm pushes the left half's arm" },
    { who: "rea", with: "sofaL", from: 9.1, to: END, reason: "Reaper sits on his half" },
].map((w) => ({ ...w, from: rt(w.from), to: rt(w.to) }));

write(import.meta.url, {
  id: "moving-one-sofa",
  title: "Moving One Sofa",
  idea: "Jonny's four friend comedies #22 (30 Oct 2026): one sofa jammed in a doorway; force, magic, then Reaper's scythe",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "golden",
  set: { type: "landing", light: "golden", wallZ: LD.roomBack, aperture: FOCUS ? 0.045 : 0, ...(FOCUS && { focus: "acting", focusBand: 0.7 }) },
  music: { gain: 0.8 },
  sound: { sfx: 0.7, ambience: 0.25, signature: { payoff: false, entrances: false }, surface: "wood" },
  hook: { show: ["phx", "wiz", "rea", "sofaL", "sofaR"], hint: 0, what: "Phoenix shoves a sofa jammed across a narrow doorway; it doesn't budge" },
  creative: { length: [10, 10] },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: ALLOW,
  notes: "Generated by storyboards/friend-comedies/22-moving-one-sofa/make-moving-one-sofa.mjs.",
});
