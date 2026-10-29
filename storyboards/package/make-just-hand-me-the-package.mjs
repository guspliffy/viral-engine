// JUST HAND ME THE PACKAGE (Jonny's story library #04, 28 Oct 2026), built from the clip template.
// node storyboards/package/make-just-hand-me-the-package.mjs -> storyboards/package/just-hand-me-the-package{,-b}.json
//
// THE BRIEF (story library 04, ENGINE-PROMPT.md: 10.00 s, 300 frames, seven shots, cuts at 0.6 / 1.2 / 1.8 / 4 / 6 / 7.6)
//   Joke:        the Wizard turns handing over a parcel into a grand ceremony; Reaper just takes it while he bows.
//   Wants:       Reaper wants his parcel. The Wizard wants his moment.
//   Consequence: by the time the Wizard looks up, the parcel, Reaper and the open door are gone.
//   Ending:      the Wizard presents an empty mat to a shut door; his smile stalls, one embarrassed blink. Held. No loop.
//
//   01 0.0-0.6  almost handed over: the parcel inches from Reaper's open hand, the Wizard pulls it back  (cardboard rustle)
//   02 0.6-1.2  the recipient: Reaper, half-lidded, eyes on the parcel, the open hand still out        (a flat exhale)
//   03 1.2-1.8  the showman: the Wizard's grin, winding up, the parcel gripped                          (the music's pickup)
//   04 1.8-4.0  one flourish, then down: ONE grounded turn, the parcel flat on the mat, both hands off  (flourish, set-down)
//   05 4.0-6.0  bow and collect: a deep bow, empty hands spread; Reaper lifts the parcel in both hands  (cloth, box lift)
//   06 6.0-7.6  the door closes during the bow: Reaper backs in, parcel on his left arm, right hand     (latch; music stops)
//               shoves the door, it latches before the Wizard looks up; the empty mat in view
//   07 7.6-10   presenting nothing: up into a proud open-palmed "ta-da" at the empty mat and the shut   (quiet)
//               door; the smile stalls, eyes go to the door, one embarrassed blink. Hold.
//
// Blocking (x right, z toward the camera; set-doorstep.js DOORSTEP): the house front is at z -0.6 with the doorway at
// x 0.12..1.02; the blue door is hinged on its left jamb and stands open 60 deg INTO the house. The Wizard is outside on
// screen-left, Reaper in the doorway on screen-right; every camera is in front of the house (one side of the axis).
// The door sweeps a quarter circle inside the hall, so Reaper backs out of it (to the right of the open leaf, then
// behind its free edge) before his right hand shoves it shut. Hands: the Wizard holds the parcel by its two ends in
// both hands until he lets go on the mat; Reaper takes it by its two ends in both hands, then it rides on his LEFT palm
// (the brief's "supported in his left arm"), and his RIGHT hand closes the door.
import { clip, write, r3 } from "../lib/clip.mjs";

const c = clip(), { A, sfx } = c;
const END = 10.0;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places
const HINGE = [0.094, -0.73], DOOR_W = 0.952, DOOR_ANGLE = 60;              // set-doorstep.js DOORSTEP: inside the jambs
const PW = 0.42, PH = 0.26;                                                    // props-package.js PARCEL
const W0 = [-0.45, 0.18], W_YAW = 72;             // the Wizard: outside, left of the doorway, turned toward Reaper
const W1 = [-0.95, 0.2], W_BOW_YAW = 10;         // a step back for the bow, bowing to us, his back to Reaper (his hat clears him)
const W2 = [-0.62, 0.24], W_TADA_YAW = 45;        // up and a step in: "ta-da" at the mat and the door
const R0 = [0.58, -0.24], R_YAW = -20;             // Reaper: a half step out of the doorway, reaching for it
const SPIN_TO = W_YAW + 360 + 40;                 // one full turn, ending squared up to the mat (112 deg)
const MAT_SPOT = [-0.024, 0.016, 0.008];            // the parcel's bottom centre on the mat (mat top y 0.016)
const R1 = [0.402, -0.164], R_PICK_YAW = -68;      // a step out onto the mat, square to the parcel, to pick it up
const R_IN = [0.72, -0.9], R_MID = [1.02, -1.45], R_END = [0.95, -2.05], R_END_YAW = -22;   // backing in: through the door, right of the open leaf, behind its free edge

// a point beside a character: lat to its left (+) / right (-), fwd ahead, at height y (world, metres)
const rel = (p, yaw, lat, y, fwd) => [r3(p[0] + lat * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), r3(y), r3(p[1] - lat * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];
// the two hands on the ends of a parcel whose centre is `ctr`, for a holder facing `yaw` (the parcel's long side
// across the holder's body: L on the holder's left)
const ends = (ctr, yaw, gap = 0.012) => {
  const k = PW / 2 + gap, ax = [Math.cos(rad(yaw)), 0, -Math.sin(rad(yaw))];
  return { L: ctr.map((v, i) => r3(v + ax[i] * k)), R: ctr.map((v, i) => r3(v - ax[i] * k)) };
};
// world arm poses on the parcel's ends, palms turned to its middle (both hands, held from the sides)
const holdAt = (t, who, ctr, yaw, dur, ease = "inOut") => {
  const h = ends(ctr, yaw);
  for (const s of ["L", "R"]) c.arm(t, who, s, { world: h[s], palm: ctr }, dur, ease);
};
const mid = (ctr) => [ctr[0], r3(ctr[1] - PH / 2), ctr[2]];   // a centre -> the parcel's bottom centre

// the parcel's centre: held out toward Reaper at frame 0 (ahead and to the Wizard's left, over Reaper's palm), pulled
// in to the Wizard's chest: a 27 cm snatch that reads in the tight hook shot
const BOX_OUT = rel(W0, W_YAW, 0.04, 0.44, 0.5),   // (Jonny 29 Oct: further from Reaper's hand, whose forearm ran through its back corner)
  BOX_CHEST = rel(W0, W_YAW, 0, 0.52, 0.42);   // back and up: the pull reads at phone size
const BOX_MAT = [MAT_SPOT[0], r3(MAT_SPOT[1] + PH / 2), MAT_SPOT[2]];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: W0, face: W_YAW, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "rea", character: "lookdev/reaper-crisp", at: R0, face: R_YAW, expr: "deadpan", follow: 0.25, seed: 4.1 },
];
const props = [
  { id: "door", kind: "frontdoor", x: HINGE[0], z: HINGE[1], w: DOOR_W, h: 1.83, angle: DOOR_ANGLE, open: 1 },
  { id: "parcel", kind: "parcel", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, mid(BOX_OUT)[i]])), rot: W_YAW },
];

// ---------------------------------------------------------------- frame 0: everything already in motion
A(0, "wiz", "grab", { prop: "parcel", hand: "both", grip: "middle", dur: 0, pose: null });
A(0, "wiz", "grip", { side: "both", shape: "hold", dur: 0 });
holdAt(0, "wiz", BOX_OUT, W_YAW, 0);
A(0, "wiz", "noblink"); A(0, "rea", "noblink");
// Reaper's right hand is out at the parcel's height, palm up, just past its far side (on screen: right of it), inches
// short, and he leans into the reach: the want reads in frame 0
const R_HAND_OUT = rel(W0, W_YAW, 0.06, 0.3, 0.86);   // about 20 cm short of the parcel's far side, under its level: clear of it on screen too
c.arm(0, "rea", "R", { world: R_HAND_OUT, palm: [R_HAND_OUT[0], 1.2, R_HAND_OUT[2]] }, 0);
A(0, "rea", "grip", { side: "R", shape: "cup", dur: 0 });
A(0, "rea", "grip", { side: "L", shape: "relaxed", dur: 0 });
A(0, "rea", "look", { to: [-0.5, -0.35], dur: 0, blink: false });
A(0, "rea", "pitch", { to: 9, dur: 0 });
A(0.3, "rea", "pitch", { to: 0, dur: 0.35 });                          // the reach comes up short: he straightens

// ---------------------------------------------------------------- 01 ALMOST HANDED OVER 0.0-0.6
holdAt(0.04, "wiz", BOX_CHEST, W_YAW, 0.3, "out");                      // snatched back into his own two-handed grip
A(0.04, "wiz", "pitch", { to: -8, dur: 0.3 });                          // the body follows the pull
A(0, "wiz", "look", { to: [0.45, 0.0], dur: 0, blink: false });         // on Reaper: "not so fast"
A(0, "wiz", "expr", { expr: "cocky", set: { curve: 0.7, smirk: 0.5 }, dur: 0 });
sfx(0.04, "ai-package/cardboard-rustle", { gain: 0.6, reason: "cardboard rustle: the parcel snatched back" });
A(0.22, "rea", "look", { to: [-0.45, -0.05], dur: 0.1, blink: false });   // his eyes follow it
A(0.3, "rea", "grip", { side: "R", shape: "hold", dur: 0.1 });              // his hand closes on air...
A(0.48, "rea", "grip", { side: "R", shape: "cup", dur: 0.15 });              // ...and opens again, still out

// ---------------------------------------------------------------- 02 THE RECIPIENT 0.6-1.2
A(0.6, "rea", "face", { lid: 0.55, dur: 0.15 });                          // half-lidded
A(0.62, "rea", "expr", { expr: "deadpan", set: { curve: -0.15, smirk: 0 }, dur: 0.15 });
A(0.7, "rea", "squash", { amount: 0.03, dur: 0.35 });                     // the flat exhale
A(0.6, "rea", "still", { dur: 1.2, idle: 0.04 });
sfx(0.68, "ai-package/flat-exhale", { gain: 0.22, reason: "Reaper's flat exhale (the squash)" });

// ---------------------------------------------------------------- 03 THE SHOWMAN 1.2-1.8
A(1.2, "wiz", "look", { to: [0.15, 0.1], dur: 0.12, blink: false });
A(1.22, "wiz", "expr", { expr: "delighted", set: { curve: 1.0, open: 0.35, eye: 1.1 }, dur: 0.15 });
A(1.22, "wiz", "face", { brow: 0.45, dur: 0.2 });
A(1.25, "wiz", "pitch", { to: -10, dur: 0.35 });                          // chest out, chin up: the windup
A(1.28, "wiz", "crouch", { to: 0.25, dur: 0.32 });                        // weight down before the turn
A(1.62, "wiz", "pitch", { to: 0, dur: 0.24 });
A(1.62, "wiz", "crouch", { to: 0, dur: 0.24 });
holdAt(1.25, "wiz", rel(W0, W_YAW, 0, 0.45, 0.46), W_YAW, 0.35);         // the parcel hugged a little higher
A(1.25, "wiz", "hatwobble", { amount: 4, freq: 3, dur: 0.6 });
// Reaper's hand gives up: it sinks and turns in, palm to his side, and hangs there (a drop to "rest" flips the palm)
c.arm(1.3, "rea", "R", { world: [R_HAND_OUT[0] + 0.06, 0.24, R_HAND_OUT[2] - 0.12], palm: [R0[0], 0.3, R0[1]] }, 0.4);
A(1.6, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.4 });

// ---------------------------------------------------------------- 04 ONE FLOURISH, THEN DOWN 1.8-4.0
c.textPop(1.95, "rea", "annoyed", { dur: 1.05, size: 96, dx: -0.35, dy: -0.75 });   // Jonny 29 Oct: over Reaper's head while the Wizard spins
// the turn: arms switch to the same hold in his own frame, so the parcel turns with him (one full turn + 28 deg)
const localHold = (y, fwd) => ["L", "R"].map((s) => [s, { x: [r3((s === "L" ? 1 : -1) * (PW / 2 + 0.012)), r3((y - 0.14) / 1.04), fwd], palm: [0, r3((y - 0.14) / 1.04), fwd] }]);
for (const [s, pose] of localHold(0.45, 0.46)) c.arm(1.88, "wiz", s, pose, 0.02);
A(1.82, "wiz", "look", { to: [0.6, 0.1], dur: 0.1, blink: false });     // the eyes lead the turn
// the turn passes the camera with a showman's beat: he faces us for a moment, grinning, then finishes onto the mat
const spin = [[1.95, W_YAW + 60, 0.2, "in"], [2.15, 300, 0.3, "linear"], [2.45, 360, 0.14, "out"], [2.74, SPIN_TO, 0.26, "inOut"]];
for (const [t, to, dur, ease] of spin) { A(t, "wiz", "turn", { to, dur, ease }); c.prop(t, "parcel", { rot: to }, dur, ease); }
A(2.4, "wiz", "look", { to: [0, 0.1], dur: 0.1, blink: false });         // to us, mid-spin
A(2.45, "wiz", "face", { brow: 0.6, dur: 0.12 });
A(2.7, "wiz", "look", { to: [0.6, -0.2], dur: 0.1, blink: false });     // the eyes lead the rest of the turn
A(1.95, "wiz", "hatsway", { tip: [-6, 10], dur: 0.5 });
A(2.74, "wiz", "hatwobble", { amount: 7, freq: 3.2, dur: 0.8 });
A(2.98, "wiz", "squash", { amount: 0.05, dur: 0.22 });                   // he lands the turn: the weight settles
// down onto the mat: back to world poses (the same points), then a bend at the knees and hips
holdAt(3.0, "wiz", rel(W0, SPIN_TO, 0, 0.45, 0.46), SPIN_TO, 0.02);
A(2.96, "wiz", "look", { to: [0.1, -0.7], dur: 0.12, blink: false });
A(3.04, "wiz", "crouch", { to: 0.6, dur: 0.46 });
A(3.04, "wiz", "pitch", { to: 22, dur: 0.46 });
holdAt(3.04, "wiz", BOX_MAT, SPIN_TO, 0.46);
A(3.5, "wiz", "release", { prop: "parcel", to: MAT_SPOT, dur: 0.04 });
sfx(3.5, "put-down", { gain: 0.7, reason: "cardboard set-down on the mat" });
sfx(3.5, "ai-package/box-set-down", { gain: 0.5, reason: "the cardboard of the set-down" });
A(3.52, "wiz", "grip", { side: "both", shape: "flat", dur: 0.12 });
for (const s of ["L", "R"]) c.arm(3.54, "wiz", s, { x: [s === "L" ? 0.32 : -0.32, 0.14, 0.42], palm: [s === "L" ? 0.32 : -0.32, 1.1, 0.42] }, 0.24);   // both hands open, up off it
A(3.5, "rea", "look", { to: [-0.5, -0.6], dur: 0.15, blink: false });

// ---------------------------------------------------------------- 05 BOW AND COLLECT 4.0-6.0
// the Wizard: half a step back, square to the camera side, a deep bow with empty hands spread, eyes shut
A(3.66, "wiz", "pitch", { to: 0, dur: 0.25 });
A(3.66, "wiz", "crouch", { to: 0, dur: 0.25 });
A(3.6, "wiz", "look", { to: [-0.2, 0.0], dur: 0.12, blink: false });
A(3.62, "wiz", "move", { to: W1, dur: 0.4, steps: 2 });
A(3.62, "wiz", "turn", { to: W_BOW_YAW + 360, dur: 0.4 });
const spread = (s, y, fwd) => ({ x: [s === "L" ? 0.62 : -0.62, r3(y), fwd], palm: [s === "L" ? 0.62 : -0.62, r3(y + 1), fwd] });
// (his left hand, on Reaper's side, goes flat on his heart: spread wide, it lands on the parcel and Reaper on screen)
c.arm(3.82, "wiz", "L", { x: [0.15, 0.32, 0.45], palm: [0.15, 0.32, -0.6] }, 0.38);
c.arm(3.82, "wiz", "R", spread("R", 0.26, 0.16), 0.38);
A(4.0, "wiz", "pitch", { to: 38, dur: 0.45, ease: "out" });
A(3.98, "wiz", "face", { lid: 1, dur: 0.18 });
A(3.98, "wiz", "expr", { expr: "serene", set: { curve: 0.9, open: 0 }, dur: 0.2 });
A(4.1, "wiz", "hatwobble", { amount: 5, freq: 2.6, dur: 0.7 });
A(4.45, "wiz", "still", { dur: 3.15, idle: 0.1 });
sfx(4.0, "cloth", { gain: 0.45, reason: "fabric rustle: the bow" });
// Reaper: eyes to the parcel, a step out onto the mat, bend, both hands on its ends
A(3.92, "rea", "look", { to: [-0.3, -0.75], dur: 0.12, blink: false });
A(4.02, "rea", "turn", { to: R_PICK_YAW, dur: 0.3 });
A(4.02, "rea", "move", { to: R1, dur: 0.3, steps: 1 });
A(4.1, "rea", "crouch", { to: 0.6, dur: 0.35 });
A(4.1, "rea", "pitch", { to: 22, dur: 0.35 });
holdAt(4.1, "rea", BOX_MAT, R_PICK_YAW, 0.35);
A(4.1, "rea", "grip", { side: "both", shape: "hold", dur: 0.35 });
A(4.46, "rea", "grab", { prop: "parcel", hand: "both", grip: "middle", dur: 0, pose: null });
sfx(4.46, "ai-package/cardboard-rustle", { gain: 0.5, reason: "small box lift: cardboard in both hands" });
// up: the parcel lifted in both hands to his chest, then he backs in through the door with it
const BOX_UP = rel(R1, R_PICK_YAW, 0, 0.44, 0.46);
A(4.52, "rea", "crouch", { to: 0, dur: 0.38 });
A(4.52, "rea", "pitch", { to: 0, dur: 0.38 });
holdAt(4.52, "rea", BOX_UP, R_PICK_YAW, 0.38);
A(4.62, "rea", "look", { to: [-0.6, -0.4], dur: 0.15, blink: false });   // one flat glance at the bowing Wizard
// in his own frame from here, so the parcel goes where he goes
for (const [s, pose] of localHold(0.44, 0.46)) c.arm(4.9, "rea", s, pose, 0.02);
A(4.86, "rea", "look", { to: [-0.35, -0.2], dur: 0.12, blink: false });
A(4.98, "rea", "move", { to: R_IN, dur: 0.5, ease: "in", steps: 2.2 });
A(4.98, "rea", "turn", { to: -25, dur: 0.5 });
c.prop(4.98, "parcel", { rot: SPIN_TO + 43 }, 0.5);                   // the parcel turns with him (its rot = his yaw + 180)
// past the jambs: onto his left palm (the left hand takes it by its end, slides under its middle and carries it at his
// side, the parcel turned to lie along his forearm); the right hand comes free
const ENDL = [r3(-(PW / 2 + 0.012)), r3(PH / 2), 0];   // his left hand is on its -x end (rot = yaw + 180)
A(5.5, "rea", "grab", { prop: "parcel", hand: "L", grip: ENDL, dur: 0, pose: null });
A(5.52, "rea", "grab", { prop: "parcel", hand: "L", grip: [0, 0, 0], dur: 0.4 });
A(5.52, "rea", "grip", { side: "L", shape: "cup", dur: 0.3 });
c.arm(5.52, "rea", "L", { x: [0.52, 0.27, 0.14], palm: [0.52, 1.2, 0.14] }, 0.55);
c.arm(5.52, "rea", "R", "rest", 0.4);
A(5.52, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
A(5.36, "rea", "look", { to: [-0.3, -0.15], dur: 0.12, blink: false });
A(5.48, "rea", "move", { to: R_MID, dur: 0.5, ease: "linear", steps: 2.2 });
A(5.85, "rea", "look", { to: [-0.45, -0.1], dur: 0.12, blink: false });   // back toward the bowing Wizard and the door
A(5.98, "rea", "move", { to: R_END, dur: 0.42, ease: "out", steps: 2.2 });
A(5.6, "rea", "turn", { to: R_END_YAW, dur: 0.5 });
c.prop(5.52, "parcel", { rot: SPIN_TO + 43 - 90 + 3 }, 0.55);          // a quarter turn: along his forearm (yaw + 90)

// ---------------------------------------------------------------- 06 THE DOOR CLOSES DURING THE BOW 6.0-7.6
// the shove: right hand to the door's free edge, then the door swings shut and latches
const EDGE = [r3(HINGE[0] + DOOR_W * Math.cos(rad(DOOR_ANGLE))), 0.36,   // low on the edge: clear of his face on screen
  r3(HINGE[1] - DOOR_W * Math.sin(rad(DOOR_ANGLE)))];
A(6.2, "rea", "look", { to: [-0.55, -0.1], dur: 0.12, blink: false });   // a held glance at the bowing Wizard
A(6.6, "rea", "face", { lid: 0.75, dur: 0.2 });                          // decided: the lids drop as it swings
c.arm(6.42, "rea", "R", { world: [EDGE[0] + 0.03, EDGE[1], EDGE[2] - 0.06], palm: [EDGE[0] - 0.2, EDGE[1], EDGE[2] + 0.2] }, 0.18);
A(6.42, "rea", "grip", { side: "R", shape: "flat", dur: 0.15 });
c.prop(6.58, "door", { open: 0 }, 0.6, "in");
c.prop(7.18, "door", { latch: 1 }, 0.04);
c.arm(6.68, "rea", "R", { world: [EDGE[0] + 0.12, 0.22, EDGE[2] - 0.04], palm: [EDGE[0] - 0.08, 0.22, EDGE[2] + 0.16] }, 0.45);   // the pushing hand just sinks, palm still out (a drop to "rest" flips it)
A(6.68, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
sfx(7.18, "latch", { gain: 0.75, reason: "the door latches" });

// ---------------------------------------------------------------- 07 PRESENTING NOTHING 7.6-10
A(7.56, "wiz", "look", { to: [0.3, 0.1], dur: 0.1, blink: false });
A(7.6, "wiz", "pitch", { to: -5, dur: 0.45, ease: "out" });
A(7.6, "wiz", "turn", { to: W_TADA_YAW + 360, dur: 0.4 });
A(7.62, "wiz", "move", { to: W2, dur: 0.4, steps: 1 });
for (const s of ["L", "R"]) c.arm(7.62, "wiz", s, { x: [s === "L" ? 0.6 : -0.62, 0.5, s === "L" ? 0.18 : 0.04], palm: [s === "L" ? 0.65 : -0.66, 1.5, s === "L" ? 0.3 : 0.12] }, 0.38, "out");
A(7.62, "wiz", "grip", { side: "both", shape: "flat", dur: 0.25 });
A(7.62, "wiz", "face", { lid: 0.05, brow: 0.5, dur: 0.15 });
A(7.62, "wiz", "expr", { expr: "delighted", set: { curve: 1.0, open: 0.4, eye: 1.08 }, dur: 0.15 });
A(7.65, "wiz", "hatwobble", { amount: 5, freq: 3, dur: 0.6 });
A(8.05, "wiz", "pitch", { to: 0, dur: 0.3 });
// the smile stalls: the mouth closes, held too long
A(8.35, "wiz", "expr", { set: { open: 0.05, curve: 0.55, eye: 1.0 }, dur: 0.3 });
A(8.4, "wiz", "still", { dur: 1.6, idle: 0.05 });
A(8.5, "wiz", "look", { to: [0.55, -0.6], dur: 0.15, blink: false });    // eyes down to the empty mat...
A(8.9, "wiz", "look", { to: [0.7, 0.1], dur: 0.15, blink: false });      // ...then up to the shut door
A(8.9, "wiz", "face", { brow: -0.15, dur: 0.3 });
A(8.95, "wiz", "expr", { set: { curve: -0.12, open: 0.15, smirk: 0, tilt: 0.3 }, dur: 0.35 });   // the smile gone
for (const s of ["L", "R"]) c.arm(9.0, "wiz", s, { x: [s === "L" ? 0.5 : -0.52, 0.2, s === "L" ? 0.14 : 0.04], palm: [s === "L" ? 0.54 : -0.56, 1.2, s === "L" ? 0.24 : 0.12] }, 0.4);   // the ta-da arms drop
A(9.0, "wiz", "grip", { side: "both", shape: "relaxed", dur: 0.3 });
A(9.0, "wiz", "squash", { amount: 0.04, dur: 0.3 });
A(9.0, "wiz", "hatsway", { tip: [0, -12], dur: 0.45 });                     // the hat tip droops
A(9.3, "wiz", "blink", { dur: 0.32 });                                    // one embarrassed blink

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and
// elevation el, far enough that the frame is h metres tall at the target with lens fov
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = rad(az), e = rad(el), d = h / 2 / Math.tan(rad(fov) / 2);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const S1 = frame([0.1, 0.74, 0.05], { az: 30, el: 10, h: 2.3, fov: 22 });   // both faces and the door; from the right, so Reaper's dark glove reads against the parcel, not his hoodie
const S2 = frame([0.44, 0.7, -0.1], { az: -25, el: 3, h: 1.75, fov: 18 });
const S3 = frame([-0.4, 1.0, 0.2], { az: 35, el: 2, h: 1.75, fov: 18 });
const S4 = frame([-0.08, 0.85, 0.0], { az: 38, el: 6, h: 3.1, fov: 26 });   // from his facing side: the show and the set-down face us
const S5 = frame([-0.3, 0.62, 0.0], { az: -25, el: 3, h: 2.8, fov: 22 });
const S6 = frame([0.28, 0.82, -0.7], { az: -18, el: 10, h: 2.8, fov: 24 });
// 07 pushes in from the two-shot to the Wizard's face as his smile stalls
const S7 = { ...frame([-0.2, 0.8, -0.15], { az: -10, el: 3, h: 2.6, fov: 22 }), to: (({ pos, look }) => ({ pos, look }))(frame([-0.25, 0.8, 0.05], { az: -10, el: 3, h: 1.95, fov: 22 })), dur: 2.4 };
const beats = c.beats([
  ["01 almost handed over", 0, S1, "hook"],
  ["02 the recipient", 0.6, S2],
  ["03 the showman", 1.2, S3],
  ["04 one flourish, then down", 1.8, S4],
  ["05 bow and collect", 4.0, S5, "escalation"],
  ["06 the door closes during the bow", 6.0, S6, "payoff"],
  ["07 presenting nothing", 7.6, S7, "reaction"],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "just-hand-me-the-package" : `just-hand-me-the-package-${variant.toLowerCase()}`,
  title: "Just Hand Me the Package",
  idea: "Story library 04: the Wizard turns a parcel handover into a ceremony; Reaper takes it and shuts the door while he bows",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 12], loop: false },
  set: { type: "doorstep", light: "golden", wallZ: -9, seed: 4 },
  music: { file: "ai-package/fanfare-03.ogg", bpm: 103.7, from: 1.2, until: 7.18 },   // the theatrical bed, cut by the latch
  sound: { sfx: 0.7, ambience: 0.3, speech: false, room: "porch", surface: "concrete" },
  experiment: { id: "hook-2026-11", episode: "just-hand-me-the-package", variant },
  cast, props, captions, beats,
  notes: "Generated by storyboards/package/make-just-hand-me-the-package.mjs (Jonny's story library 04).",
});
// A: the brief as written (no on-screen text). B: A plus a caption over the three opening cuts in Reaper's voice (the
// hook lab: on mute, a caption carried the setup). C: a caption that promises the show instead. Pick with qa/hook.mjs.
write(import.meta.url, sb("A", c.captions));
write(import.meta.url, sb("B", [...c.captions, { from: 0, to: 1.8, text: "Bro. Just hand it over.", pos: 230, pop: false }]));
write(import.meta.url, sb("C", [...c.captions, { from: 0, to: 1.8, text: "POV: the delivery guy is extra", pos: 230, pop: false }]));
