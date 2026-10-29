// THE SLOW-MOTION COOKIE RESCUE (Jonny's story library #05, 29 Oct 2026), built from the clip template.
// node storyboards/cookie/make-slow-motion-cookie-rescue.mjs -> storyboards/cookie/slow-motion-cookie-rescue{,-b,-c}.json
//
// THE BRIEF (story library 05, ENGINE-PROMPT.md: 11.00 s, 330 frames, eight shots, wordless, no loop)
//   Joke:        the Wizard stages a heroic slow-motion dive for a falling cookie that Reaper catches without moving
//                his feet.
//   Wants:       the Wizard wants to be the hero who saves the cookie.
//   Consequence: Reaper's calm one-hand catch makes the dive pointless; the Wizard lands belly-first on the cushion.
//   Ending:      Reaper offers the once-bitten cookie to the exhausted Wizard, who looks up, tired and grateful. Held.
//
//   01 0.0-0.5  cookie in danger: the cookie tips over the table's right edge; the Wizard already      (tiny dry scrape)
//               reacting; a corner of the blue cushion under the landing zone
//   02 0.5-1.0  hero mode: extreme close on the Wizard's determined eyes, a shadow crosses the face     (mock-heroic hit)
//   03 1.0-1.6  launch: medium, he pushes off stable feet, one hand out, the other balancing; cushion   (foot push, whoosh)
//   04 1.6-3.4  one slow-motion beat: the same fall and dive, slowed together; the hand reaching, the   (stretched airy note)
//               cookie falling ahead of the empty fingertips, then his face, one moving shot
//   05 3.4-4.6  effortless catch: ordinary speed; Reaper's LEFT hand closes on the whole cookie near    (fingertip catch;
//               the table edge, no step into the Wizard's path                                          heroic music cuts)
//   06 4.6-6.2  safe landing: belly-first on the cushion, both hands empty, the cushion compresses;     (soft cushion poof)
//               Reaper holds the intact cookie in his left hand
//   07 6.2-8.0  one bite: Reaper takes one small bite (the bite appears now); the Wizard lifts his face  (tiny crisp crunch)
//   08 8.0-11   offer: Reaper offers the once-bitten cookie in his left hand toward the Wizard, who      (warm resolution)
//               looks up, tired and appreciative. End on the offer.
//
// Blocking (x right, z toward the camera; every camera is in front, so screen left -> right is the dive's direction):
// a pale-wood coffee table, its right end at x 0.45; the cookie tips over that end. The thick cushion lies on the floor
// in front of and right of the table's right end. The Wizard starts behind the table's left end and dives over the
// table, diagonally toward the camera, onto the cushion, head first (his face ends up toward us). Reaper stands right
// of the table's end, out of the dive's path: his left hand catches the cookie at the edge without a step; he takes
// two steps only at the end, to offer it beside the Wizard's head.
// Hands: the Wizard's stay empty. Reaper's LEFT hand holds the cookie from the catch to the end: it lands flat in his
// cupped palm, the fingers close round it, and for the bite it stands up in his fingers (the phone-edge hold: fingers
// flat on its back, the thumb on its front, by the edge opposite the bite). The hand is locked to the cookie (arm pose
// frame), so the two turn together and the cookie's path is written once.
// Slow motion: the engine has no time stretch, so 04 is acted slowly: the dive, the fall and the cookie's tumble move
// at about a sixth of their speed, Reaper's hand rises at the same slow pace, nobody idles or blinks; 05 picks the
// speed back up on the cut.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { COOKIE } from "../../engine/page/props-cookie.js";

const c = clip(), { A, sfx } = c;
const END = 11.0;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places
const TABLE = { x: -0.1, z: 0.0, w: 1.1, d: 0.7, h: 0.42 };                // x -0.65..0.45, z -0.35..0.35
const EDGE_X = r3(TABLE.x + TABLE.w / 2), TOP = TABLE.h, CK_Z = 0.12;
const CUSH = [0.28, 0.95], CUSH_R = 0.62, CUSH_H = 0.26, CUSH_Y = 0.02;      // the floor cushion (on the rug)
const W0 = [-0.55, -0.7], W_YAW = 50;                                      // the Wizard: behind the table, left of the cookie
const R0 = [1.05, -0.18], R_YAW = -60;                                        // Reaper: right of the table's end, out of the dive's path
const R0b = [1.2, -0.25];                                                   // a small step back after the catch
const R1 = [1.22, 0.62], R1_YAW = -58;                                        // two steps to beside the Wizard's head, to offer

// the cookie's path. Its origin is its centre; it lies flat (face up). A point is { x, y, z, tilt, rot, tip }.
// Tipping over the table's edge: the centre turns about the edge line (x EDGE_X, y TOP) by `tilt` (top toward +x)
// while it slides out to `past` (the centre's distance beyond the edge before the turn, negative: still on the top)
const onEdge = (tilt, past) => {
  const q = rad(tilt), vx = past, vy = COOKIE.t / 2;
  return { x: r3(EDGE_X + vx * Math.cos(q) + vy * Math.sin(q)), y: r3(TOP - vx * Math.sin(q) + vy * Math.cos(q)), z: CK_Z, tilt };
};
const CK = {
  t0: onEdge(20, -0.012),                                  // frame 0: already over the edge and tipping
  t05: onEdge(32, -0.004),                                 // a big tip in the first half second (review A)
  t15: onEdge(42, 0.008),                                  // it leaves the edge here
  slow: { x: 0.57, y: 0.385, z: CK_Z, tilt: 24 },          // the slow fall: it drops and rocks back toward flat
  catch: { x: 0.62, y: 0.36, z: CK_Z + 0.01, tilt: 8 },    // lands in Reaper's palm
};

// ---------------------------------------------------------------- the cast
const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: W0, face: W_YAW, expr: "shocked", follow: 0.25, seed: 2.6 },
  { id: "rea", character: "lookdev/reaper-crisp", at: R0, face: R_YAW, expr: "deadpan", follow: 0.2, seed: 4.1 },
];
const props = [
  { id: "rug", kind: "rug", x: 0.1, z: 0.4, w: 3.8, d: 2.8, color: "#e6d3b6", pattern: "quiet", pile: 0.5 },
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, h: TABLE.h, w: TABLE.w, d: TABLE.d, color: "#ecd3a8", leg: "#cfa26b", legX: 0.6, apron: 0.04 },
  { id: "cushion", kind: "floorcushion", x: CUSH[0], y: CUSH_Y, z: CUSH[1], r: CUSH_R, h: CUSH_H },
  { id: "cookie", kind: "chunkcookie", x: CK.t0.x, y: CK.t0.y, z: CK.t0.z, tilt: CK.t0.tilt, rot: 0, biteAt: 180 },
  { id: "path", kind: "carrier", x: W0[0], y: 0, z: W0[1], rot: W_YAW },
];

// ---------------------------------------------------------------- the cookie, start to end (Reaper's hand follows it)
c.prop(0, "cookie", CK.t05, 0.5, "linear");
c.prop(0.5, "cookie", CK.t15, 1.05, "in");
c.prop(1.55, "cookie", { x: CK.slow.x, z: CK.slow.z, tilt: CK.slow.tilt }, 1.85, "out");
c.prop(1.55, "cookie", { y: CK.slow.y }, 1.85, "in");
c.prop(3.4, "cookie", { x: CK.catch.x, z: CK.catch.z, tilt: CK.catch.tilt }, 0.12, "out");
c.prop(3.4, "cookie", { y: CK.catch.y }, 0.12, "in");
sfx(0.0, "ai/cookie-scrape", { gain: 0.45, reason: "tiny dry scrape: the cookie sliding over the table's edge" });

// ---------------------------------------------------------------- 01 COOKIE IN DANGER 0.0-0.5
// the Wizard already reacting: shocked, leaning in, his left hand reaching toward it
A(0, "wiz", "noblink"); A(0, "rea", "noblink");
A(0, "wiz", "look", { to: [0.5, -0.4], dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "shocked", set: { open: 0.55, curve: -0.75, eye: 1.25 }, dur: 0 });   // alarm, not a grin (cold read)
A(0, "wiz", "face", { brow: 0.45, dur: 0 });
A(0, "wiz", "pitch", { to: 8, dur: 0 });
c.arm(0, "wiz", "L", { x: [0.36, 0.42, 0.5] }, 0);
c.arm(0, "wiz", "R", { x: [-0.42, 0.3, -0.06] }, 0);
A(0, "wiz", "grip", { side: "L", shape: "hover", dur: 0 });              // palm down, the index leading
A(0.08, "wiz", "pitch", { to: 12, dur: 0.4 });
c.arm(0.06, "wiz", "L", { x: [0.38, 0.47, 0.56] }, 0.4, "out");          // the reach grows as it tips
// Reaper: calm, eyes on the cookie, not a muscle
A(0, "rea", "look", { to: [-0.6, -0.5], dur: 0, blink: false });
A(0, "rea", "face", { lid: 0.5, dur: 0 });
A(0, "rea", "still", { dur: 3.4, idle: 0.05 });

// ---------------------------------------------------------------- 02 HERO MODE 0.5-1.0
// the face goes from alarm to absurd commitment: brows angle in, lids narrow, the mouth sets (full strength)
A(0.5, "wiz", "look", { to: [0.3, -0.1], dur: 0.12, blink: false });
act.mood(c, 0.52, "wiz", "focused", { hold: 0.42, lid: 0.32, squash: 0 });
A(0.6, "wiz", "expr", { expr: "focused", set: { curve: -0.25, open: 0.0, eye: 0.82 }, dur: 0.25 });
c.at(0.52, { fx: "shade", dur: 0.46, from: -0.45, to: 1.45, width: 0.55, peak: 0.42, angle: 16 });
A(0.55, "wiz", "hatwobble", { amount: 2, freq: 2, dur: 0.4 });
sfx(0.5, "ai/hero-hit", { gain: 0.75, reason: "the mock-heroic 'dah!' on his determined eyes; the hero music starts under it" });

// ---------------------------------------------------------------- 03 LAUNCH 1.0-1.6
// stable feet, a crouch, then the push: one hand out toward the cookie, the other back for balance
A(1.0, "wiz", "crouch", { to: 0.55, dur: 0.22, ease: "out" });
A(1.0, "wiz", "pitch", { to: 22, dur: 0.22 });
c.arm(1.0, "wiz", "L", { x: [0.32, 0.2, 0.25] }, 0.2);                     // both arms swing back
c.arm(1.0, "wiz", "R", { x: [-0.4, 0.26, -0.22] }, 0.2);
A(1.24, "wiz", "ride", { prop: "path", dur: 0.01 });
A(1.25, "wiz", "crouch", { to: 0, dur: 0.12 });
A(1.25, "wiz", "pitch", { to: 42, dur: 0.38, ease: "out" });
const REACH = { x: [0.32, 0.75, 0.5] }, BALANCE = { x: [-0.56, 0.62, -0.2] };
c.arm(1.25, "wiz", "L", REACH, 0.3, "out");                                // the left hand out toward the cookie
c.arm(1.25, "wiz", "R", BALANCE, 0.3, "out");                              // the right out and back, balancing
A(1.25, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(1.22, "wiz", "look", { to: [0.35, -0.35], dur: 0.12, blink: false });
c.prop(1.25, "path", { x: -0.5, z: -0.45, rot: 56 }, 0.35, "out");
c.prop(1.25, "path", { y: 0.3 }, 0.35, "out");
sfx(1.25, "step-carpet", { gain: 1.0, reason: "the foot push off the rug" });
sfx(1.27, "whoosh", { gain: 0.6, reason: "his short whoosh into the dive" });
A(1.3, "wiz", "hatsway", { tip: [-14, 0], dur: 0.3 });

// ---------------------------------------------------------------- 04 ONE SLOW-MOTION BEAT 1.6-3.4
// the same dive at about a quarter of the speed: a slow glide over the table, the hand stretching after the cookie,
// the face straining
c.prop(1.6, "path", { x: -0.35, z: -0.1, rot: 60 }, 1.8, "linear");
c.prop(1.6, "path", { y: 0.38 }, 1.8, "out");
A(1.63, "wiz", "pitch", { to: 50, dur: 1.75, ease: "linear" });
c.arm(1.6, "wiz", "L", { x: [0.34, 0.65, 0.55] }, 1.8, "inOut");            // the fingers stretch toward it
A(1.6, "wiz", "still", { dur: 1.8, idle: 0 });
A(1.7, "wiz", "look", { to: [0.45, -0.5], dur: 1.0, blink: false });
A(1.8, "wiz", "expr", { expr: "focused", set: { curve: -0.4, open: 0.35, eye: 0.9 }, dur: 1.2 });   // a slow strained grimace
A(1.7, "wiz", "hatsway", { tip: [-10, 0], dur: 1.6 });
sfx(1.1, "ai/slowmo-air", { gain: 0.6, reason: "the stretched airy slow-mo rumble: it swells through the slow motion and peaks on the catch" });
// Reaper, at the same slow pace: his eyes follow the cookie down, his left hand rises under its path, palm up
A(1.6, "rea", "look", { to: [-0.55, -0.7], dur: 1.6, blink: false });
const CUP = (o = {}) => ({ prop: "cookie", grip: [0, -COOKIE.t / 2, 0], frame: { y: [-1, 0, 0], z: [0, 1, 0], at: [0, 0.03, 0.02], ...o } });
c.arm(1.7, "rea", "L", { ...CUP(), at: [CK.catch.x, CK.catch.y - 0.06, CK.catch.z], off: [0.02, -0.03, 0.03] }, 1.7, "inOut");
A(1.7, "rea", "grip", { side: "L", shape: "cup", dur: 1.2 });
A(2.0, "rea", "pitch", { to: 8, dur: 1.4 });

// ---------------------------------------------------------------- 05 EFFORTLESS CATCH 3.4-4.6
// back to speed: the cookie drops the last few centimetres into his palm and the fingers close as it lands
A(3.27, "rea", "look", { to: [-0.5, -0.75], dur: 0.1, blink: false });   // eyes on it as the hand meets it
c.arm(3.4, "rea", "L", CUP(), 0.12, "out");
A(3.44, "rea", "grip", { side: "L", shape: "hold", dur: 0.1 });
c.prop(3.52, "cookie", { squash: 0.08 }, 0.04, "out"); c.prop(3.56, "cookie", { squash: 0 }, 0.12, "settle");
sfx(3.52, "ai/fingertip-catch", { gain: 0.55, reason: "the tiny fingertip catch: the tick of the cookie landing in his palm" });
sfx(3.5, "grab", { gain: 0.3, reason: "his fingers closing round it" });
A(3.52, "rea", "still", { dur: 0.5, idle: 0.02 });
// then, unhurried: up to his chest, a quarter turn toward the room
const CHEST = { x: 1.26, y: 0.5, z: 0.22 };                            // in front of him, a little to his left
c.prop(3.9, "cookie", { ...CHEST, rot: -20 }, 0.5, "inOut");
A(3.9, "rea", "pitch", { to: 0, dur: 0.5 });
A(3.95, "rea", "turn", { to: -20, dur: 0.5 });
A(3.95, "rea", "move", { to: R0b, dur: 0.45 });
sfx(4.18, "step-carpet", { gain: 0.95, reason: "his one step back (the storyboard names its own steps, so the auto ones are off)" });
c.arm(3.95, "rea", "R", { x: [-0.44, 0.42, -0.1] }, 0.5);                 // the free hand stays clear of the table
A(3.9, "rea", "look", { to: [-0.45, -0.25], dur: 0.25, blink: false });
// the Wizard, at ordinary speed again: the rest of the dive, down onto the cushion
// (his body's centre lands on the cushion's centre: the carrier sits 0.16 m behind it, head toward the camera)
const LAND = { x: 0.2, y: 0.13, z: 0.81 };
c.prop(3.4, "path", { x: LAND.x, z: LAND.z, rot: 32 }, 1.28, "linear");
c.prop(3.4, "path", { y: LAND.y }, 1.28, "in");
A(3.4, "wiz", "pitch", { to: 88, dur: 1.25 });
const SPREAD = (s) => ({ x: [s * 0.62, 0.7, -0.12] });                   // a belly flop: both arms out to the sides
c.arm(3.5, "wiz", "L", SPREAD(1), 0.7);
c.arm(3.5, "wiz", "R", SPREAD(-1), 0.7);
A(3.5, "wiz", "grip", { side: "both", shape: "open", dur: 0.5 });
A(3.5, "wiz", "look", { to: [0.2, -0.8], dur: 0.2, blink: false });

// ---------------------------------------------------------------- 06 SAFE LANDING 4.6-6.2
const T_LAND = 4.68;
c.prop(T_LAND, "cushion", { squash: 0.28 }, 0.08, "out");
c.prop(T_LAND + 0.08, "cushion", { squash: 0.06 }, 0.35, "settle");
c.prop(T_LAND, "cushion", { bend: 0.6 }, 0.12, "out");
c.prop(T_LAND + 0.05, "path", { y: LAND.y - 0.04 }, 0.2, "out");
A(T_LAND, "wiz", "squash", { amount: 0.14, dur: 0.24 });
A(T_LAND, "wiz", "hatwobble", { amount: 7, freq: 3, dur: 0.8 });
sfx(T_LAND, "ai/cushion-poof", { gain: 0.35, reason: "soft cushion poof (no scream): he lands belly-first on the cushion" });
const FLAT = (s) => ({ x: [s * 0.55, 0.72, 0.36] });                      // the arms flop down onto the cushion
c.arm(T_LAND - 0.04, "wiz", "L", FLAT(1), 0.22, "out");
c.arm(T_LAND - 0.04, "wiz", "R", FLAT(-1), 0.22, "out");
A(T_LAND, "wiz", "grip", { side: "both", shape: "flat", dur: 0.2 });
A(T_LAND + 0.3, "wiz", "still", { dur: 1.5, idle: 0.04 });
A(T_LAND + 0.4, "wiz", "droop", { to: 0.6, dur: 0.6 });
A(T_LAND - 0.05, "rea", "look", { to: [-0.15, -0.65], dur: 0.15, blink: false });   // Reaper looks down at him, unmoved
A(T_LAND + 0.4, "rea", "still", { dur: 1.3, idle: 0.05 });
act.blinksAt(c, "rea", [5.6]);
// after the poof: one limp flop of his near hand, then Reaper tips his head to him and looks down at the cookie (review A)
c.arm(5.0, "wiz", "R", { x: [-0.55, 0.72, 0.2] }, 0.15, "out");
c.arm(5.15, "wiz", "R", FLAT(-1), 0.18, "in");
c.prop(5.3, "cushion", { squash: 0.1 }, 0.06, "out"); c.prop(5.36, "cushion", { squash: 0.06 }, 0.25, "settle");
A(5.4, "rea", "pitch", { to: 6, dur: 0.3 });
A(5.75, "rea", "look", { to: [0.1, -0.8], dur: 0.2, blink: false });

// ---------------------------------------------------------------- 07 ONE BITE 6.2-8.0
// the cookie stands up in his fingers on its way to his mouth (the phone-edge hold, by the edge opposite the bite)
const EDGE = (o = {}) => ({ prop: "cookie", grip: [r3(COOKIE.r + 0.004), -COOKIE.t / 2, 0], frame: { y: [-1, 0, 0], z: [0, 1, 0], at: [0.02, 0.04, 0.0215], ...o } });
const MOUTH = { x: 1.077, y: 0.59, z: 0.088 };        // just in front of Reaper's mouth (render --layout "mouth")
const AT_MOUTH = { x: MOUTH.x, y: r3(MOUTH.y - COOKIE.r * 0.8), z: r3(MOUTH.z + 0.03), tilt: 90, rot: -90 };
c.arm(6.3, "rea", "L", EDGE(), 0.35, "inOut");
A(6.3, "rea", "grip", { side: "L", shape: "phoneEdge", dur: 0.3 });
c.prop(6.3, "cookie", AT_MOUTH, 0.45, "inOut");
A(6.3, "rea", "look", { to: [-0.1, -0.4], dur: 0.2, blink: false });
A(6.75, "rea", "expr", { set: { open: 0.4 }, dur: 0.08 });
c.prop(6.8, "cookie", { z: r3(AT_MOUTH.z - 0.02), y: r3(AT_MOUTH.y + 0.015) }, 0.06, "out");
c.prop(6.86, "cookie", { cut: 1 }, 0.01);                                   // the bite: one, now
A(6.86, "rea", "expr", { set: { open: 0 }, dur: 0.05 });
sfx(6.86, "ai/crunch", { gain: 0.8, reason: "tiny crisp crunch: the one bite" });
c.prop(6.92, "cookie", { ...CHEST, y: 0.5 }, 0.35, "inOut");       // back down to his chest, the bite on top
for (const [t, o] of [[7.05, 0.12], [7.2, 0], [7.35, 0.1], [7.5, 0]]) A(t, "rea", "expr", { set: { open: o, curve: 0.25 }, dur: 0.1 });   // chewing
A(7.1, "rea", "squash", { amount: 0.015, dur: 0.3 });
// the Wizard lifts his exhausted face from the cushion
A(6.5, "wiz", "pitch", { to: 40, dur: 0.7, ease: "inOut" });
A(6.45, "wiz", "droop", { to: 0.3, dur: 0.6 });
A(6.95, "wiz", "expr", { expr: "sad", set: { curve: -0.1, open: 0.12, eye: 0.82 }, dur: 0.4 });
A(6.95, "wiz", "face", { lid: 0.45, brow: 0.15, dur: 0.4 });
A(6.9, "wiz", "look", { to: [0.4, 0.2], dur: 0.3, blink: false });
c.arm(6.5, "wiz", "L", { x: [0.36, 0.55, 0.5] }, 0.6);                    // the hands push him up
c.arm(6.5, "wiz", "R", { x: [-0.45, 0.55, 0.5] }, 0.6);
act.blinksAt(c, "wiz", [7.75]);

// ---------------------------------------------------------------- 08 OFFER THE RESCUED TREASURE 8.0-11
// two steps to beside the Wizard's head, the cookie held out toward him, bitten edge up, its face to us
A(7.87, "rea", "look", { to: [-0.35, -0.5], dur: 0.15, blink: false });   // to the Wizard first, then the walk
A(8.0, "rea", "move", { to: R1, dur: 0.75 });
for (const t of [8.23, 8.45, 8.68]) sfx(t, "step-carpet", { gain: 0.55, reason: "Reaper's steps to the Wizard" });
A(8.0, "rea", "turn", { to: R1_YAW, dur: 0.75 });
c.prop(8.0, "cookie", { x: 0.92, y: 0.56, z: 0.96, rot: -58 }, 0.75, "inOut");   // low, by his side, clear of his face   // it goes with him
const OFFER = { x: 0.83, y: 0.6, z: 0.95, tilt: 90, rot: -58 };
c.prop(8.75, "cookie", OFFER, 0.6, "inOut");
sfx(8.8, "ai/warm-resolve", { gain: 0.55, reason: "the warm musical resolution as he holds the cookie out" });
A(8.7, "rea", "look", { to: [-0.2, -0.35], dur: 0.2, blink: false });
A(8.7, "rea", "pitch", { to: 3, dur: 0.4 });
A(8.8, "rea", "expr", { expr: "kind", set: { curve: 0.35, smirk: 0.2 }, dur: 0.4 });
A(8.8, "rea", "still", { dur: 2.1, idle: 0.05 });
A(9.8, "rea", "pitch", { to: 8, dur: 0.2 }); A(10.0, "rea", "pitch", { to: 3, dur: 0.25 });   // a small nod: go on
act.blinksAt(c, "rea", [9.9]);
// the Wizard looks up at it: tired, then a small grateful smile
c.arm(8.0, "wiz", "L", { x: [0.42, 0.45, 0.45] }, 0.4);                    // his hands stay on the cushion, empty
A(8.5, "wiz", "look", { to: [0.45, 0.3], dur: 0.25, blink: false });         // the cookie
A(9.6, "wiz", "look", { to: [0.55, 0.55], dur: 0.15, blink: false });        // Reaper
A(10.3, "wiz", "look", { to: [0.45, 0.3], dur: 0.15, blink: false });        // the cookie again
A(9.0, "wiz", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.85, open: 0 }, dur: 0.5 });
A(10.0, "wiz", "expr", { expr: "kind", set: { curve: 0.6, eye: 0.85, open: 0 }, dur: 0.5 });   // the tired smile grows
A(9.0, "wiz", "face", { lid: 0.42, brow: 0.2, dur: 0.5 });
A(9.1, "wiz", "still", { dur: 1.8, idle: 0.04 });
act.blinksAt(c, "wiz", [9.35]);

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and
// elevation el, far enough that the frame is h metres tall at the target with lens fov
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = rad(az), e = rad(el), d = h / 2 / Math.tan(rad(fov) / 2);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const move = (a, b, dur) => ({ ...a, to: { pos: b.pos, look: b.look, ...(b.fov && { fov: b.fov }) }, dur });
// (the cast at real scale: a potato is about 1 m tall with its hat, so a phone frame needs h >= 1.4 for one actor)
const S1 = frame([0.08, 0.52, -0.1], { az: 30, el: 3, h: 1.6, fov: 30 });                      // close on the tipping cookie, the Wizard behind it, the cushion's edge (review A)
const S2 = frame([-0.268, 0.648, -0.473], { az: 50, el: 2, h: 0.42, fov: 24, push: 0.12, dur: 0.5 });   // his eyes (render --layout "eyes" at 0.7 s)
const S3 = frame([-0.15, 0.55, -0.3], { az: 20, el: 6, h: 2.3, fov: 30 });                  // the launch, toward us, the cushion in front
// (review A: the cookie must stay in frame ahead of the fingertips; start tight on hand and cookie, pull back to his face)
const S4 = move(frame([0.38, 0.55, 0.1], { az: 20, el: 2, h: 1.45, fov: 26 }),
  frame([0.2, 0.56, 0.15], { az: 22, el: 1, h: 1.9, fov: 26 }), 1.8);
// (review A: hold on the hand while it closes, then pull back so the Wizard sails across the lower left, Reaper whole)
const S5 = { ...move(frame([0.62, 0.45, 0.1], { az: -15, el: 18, h: 1.05, fov: 24 }), { pos: [1.3, 1.3, 4.5], look: [0.65, 0.45, 0.3], fov: 32 }, 1.2), ease: "inOut" };
const S6 = frame([0.7, 0.5, 0.55], { az: -55, el: 28, h: 2.8, fov: 30 });                   // the landing from the side: belly-first, Reaper behind with the cookie
const S7 = { pos: [1.05, 1.0, 4.3], look: [0.75, 0.55, 0.6], fov: 26 };                       // the bite, the Wizard lifting his face
const S8 = frame([0.8, 0.6, 0.8], { az: 6, el: 6, h: 2.6, fov: 28, push: 0.15, dur: 3 });   // the offer, between their faces
const beats = c.beats([
  ["01 cookie in danger", 0, S1, "hook"],
  ["02 hero mode", 0.5, S2],
  ["03 launch", 1.0, S3],
  ["04 one slow-motion beat", 1.6, S4, "escalation"],
  ["05 effortless catch", 3.4, S5, "payoff"],
  ["06 safe landing", 4.6, S6, "reaction"],
  ["07 one bite", 6.2, S7],
  ["08 offer the rescued treasure", 8.0, S8],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "slow-motion-cookie-rescue" : `slow-motion-cookie-rescue-${variant.toLowerCase()}`,
  title: "The Slow-Motion Cookie Rescue",
  idea: "Story library 05: the Wizard stages a heroic slow-motion dive for a falling cookie; Reaper just catches it, takes a bite and offers it to him",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  // the hero music: from the hero hit to the catch, where it cuts (lockMusic puts the stop on a bar line)
  music: { file: "ai/hero-bed/hero-bed-02.ogg", from: 0.5, until: 3.52, gain: 0.5 },
  sound: { sfx: 0.7, ambience: 0.3, speech: false, surface: "carpet", signature: false },
  experiment: { id: "hook-2026-11", episode: "slow-motion-cookie-rescue", variant },
  hook: { show: ["wiz", "cookie"], hint: 0, what: "the cookie tips over the table's edge and the Wizard is already reaching for it" },
  cast, props, captions, beats,
  allowClip: [
    { who: "wiz", with: "cushion", from: T_LAND - 0.05, to: END, reason: "he lands belly-first on the cushion and lies on it" },
    { who: "rea", with: "cookie", from: 6.45, to: 7.0, reason: "the bite: the cookie comes up to his mouth" },
  ],
  notes: "Generated by storyboards/cookie/make-slow-motion-cookie-rescue.mjs (Jonny's story library 05).",
});
// The brief rules out burned-in captions ("the complete story must work muted and without reading"), so there are no
// caption openings to test: the one opening is the brief's own, checked with qa/hook.mjs and a cold read.
write(import.meta.url, sb("A", c.captions));
