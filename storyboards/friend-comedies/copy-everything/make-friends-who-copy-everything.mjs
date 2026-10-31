// FRIENDS WHO COPY EVERYTHING (Jonny's four friend comedies #21, 30 Oct 2026), built from the clip template.
// node storyboards/friend-comedies/copy-everything/make-friends-who-copy-everything.mjs
//   -> storyboards/friend-comedies/copy-everything/friends-who-copy-everything.json
// Brief: /mnt/project-files/video-scripts/2026-10-30-four-friend-comedies/engine-pack/21-friends-who-copy-everything/
// (ENGINE-PROMPT.md, the eight-panel board and IMAGE-CORRECTION.md: Dragon a smooth golden potato with orange bat wings
// and a small tail, no horns; the candle unlit until Dragon lights it; exactly two bottles; Wizard never has wings).
//
// THE BRIEF
//   Joke:        the Wizard copies everything Dragon does, a beat late, until he copies fire breath with hot sauce.
//   Wants:       Dragon wants him to stop copying; the Wizard wants to keep up.
//   Consequence: the Wizard's hot-sauce blast blows a hole in the café wall.
//   Ending:      Dragon calmly copies HIM: gulps the second bottle and inhales, cheeks puffed; the Wizard stares.
//
//   01 0.0-1.3  SIP: Dragon mid-sip at frame 0; the Wizard glances, copies 0.15 s later; both cups set down
//   02 1.3-2.1  TILT: closer; Dragon tests him with a head tilt, the Wizard mirrors it
//   03 2.1-2.9  STRETCH: both arms up, one after the other
//   04 2.9-3.6  STEP: two matching little steps sideways; Dragon stops and glares, the Wizard stops a beat later, pleased
//   05 3.6-4.5  SMALL FLAME: Dragon lights the table candle with one tiny flame; the Wizard gets an idea
//   06 4.5-5.8  HOT SAUCE: the Wizard downs the first (open) bottle, puts the empty one back, inhales
//   07 5.8-7.3  TOO MUCH: an absurd blast away from Dragon punches a hole in the empty wall; table, candle, bottle survive
//   08 7.3-8.6  COPY BACK: Dragon stares 0.3 s, picks up the SECOND bottle, copies the gulp and the inhale
//   09 8.6-10.3 FLAMES EVERYTHING (Jonny 31 Oct: "add some seconds with [him] flaming everything after drinking the
//               chilli"; replaces the brief's "no second blast"): the chilli hits, Dragon rears up and sweeps a huge
//               jet across the side wall over the ducking Wizard; scorch marks bloom where it passes
//   10 10.3-11.6 AAH: smoke from his mouth, Dragon's satisfied "aah!" (the opener again); the Wizard comes up, hat
//               smoking, and copies one last, very small "aah"
//
// Hands: Dragon's own RIGHT (screen left) holds his cup; his LEFT takes bottle 2. The Wizard's own LEFT (screen right)
// holds his cup (the mirror of Dragon), his RIGHT takes bottle 1. Both are put back down before they let go.
// State: two cups, one candle (unlit until 3.98, lit after), bottle 1 full until the Wizard's gulp then empty, bottle 2
// full until Dragon's gulp, then put back empty. The wall hole opens at 6.07 and stays; the scorch marks from 9.1 stay.
import { clip, write, r3, frame } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";
import { COPYCAT } from "../../../engine/page/props-copycat.js";

// ---------------------------------------------------------------- the lab picks (Jonny, 30 Oct 2026)
const OPENER = { who: "dra", line: "aah!", words: false, at: 0.45 };   // Dragon's satisfied "aah" after his sip (the
                                    // Wizard echoes it 0.15 s later: the copy reads from the first second)
const FOCUS = true;
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx, cap } = c;
const END = 11.6;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const DRA0 = [-0.58, 0], WIZ0 = [0.58, 0], STEP = 0.12;
const DRA1 = [r3(DRA0[0] + STEP), 0], WIZ1 = [r3(WIZ0[0] + STEP), 0];   // after the two little steps (to screen right)
const DRA_YAW = 18, WIZ_YAW = -14;
const TH = 0.42;                                                     // the table top
const TABLE = [0, 1.0], TABLE_R = 0.66;                             // its back edge 0.35, just in front of the bodies
const MUG_S = 1.9, BOT_S = 2.0, CAN_S = 1.8;
const MUG_D0 = [-0.5, TH, 0.62], MUG_W0 = [0.5, TH, 0.62];         // the cups' places on the table
const BOT1 = [0.14, TH, 0.62], BOT2 = [-0.14, TH, 0.62];               // bottle 1 (the Wizard's), bottle 2 (Dragon's)
const CANDLE = [0, TH, 0.92];
const SIDE_X = 1.45;                                                 // the café's right-hand wall (the sidewall prop, facing -x)
const HOLE = [r3(SIDE_X - 0.012), 0.95, 0.45];                          // on that wall, right of the Wizard: the blast goes sideways
const SWEEP = [[2.0, -1.9], [2.55, -1.5], [2.95, -1.05], [2.8, -0.7]];  // Dragon's jet up the side wall: [y, z] (09)

// cups and bottles at the lips (the prop's bottom centre while it is tipped to the mouth; mouths: Dragon 0.56, the
// Wizard 0.60 high, 0.35 in front of the body's middle)
const SIP_D = [-0.5, 0.47, 0.5], SIP_W = [0.52, 0.5, 0.5];
const CHEST_D = [-0.5, 0.45, 0.54], CHEST_W = [0.5, 0.47, 0.54];
const GULP_W = [0.6, 0.6, 0.42], GULP_D = [-0.38, 0.52, 0.46];
const OVER_W = [0.3, 0.6, 0.56], OVER_D = [-0.2, 0.58, 0.56];      // lifted clear of the cups on the way up

// eye targets (+ right on screen, + up)
const DRA_AT_WIZ = [0.8, 0.02], WIZ_AT_DRA = [-0.8, 0.02], DRA_AT_CANDLE = [0.4, -0.6], WIZ_AT_CANDLE = [-0.5, -0.55];
const AT_CUP = [0, -0.3], AT_HOLE = [0.7, 0.45], WIZ_AT_BOTTLE = [-0.3, -0.5], DRA_AT_BOTTLE = [0.15, -0.5];

const MUG_D = { id: "cupD", kind: "campmug", scale: MUG_S, ...grips.placeFor("campmug", SIP_D, DRA_YAW), tip: -38 };
const MUG_W = { id: "cupW", kind: "campmug", scale: MUG_S, ...grips.placeFor("campmug", MUG_W0, WIZ_YAW) };
const B1 = { id: "bottle1", kind: "hotsauce", scale: BOT_S, ...grips.placeFor("hotsauce", BOT1, WIZ_YAW), fill: 1 };
const B2 = { id: "bottle2", kind: "hotsauce", scale: BOT_S, ...grips.placeFor("hotsauce", BOT2, DRA_YAW), fill: 1 };

const cast = [
  { id: "dra", character: "lookdev/dragon-crisp-table", at: DRA0, face: DRA_YAW, expr: "kind", follow: 0.25, seed: 4.1 },
  { id: "wiz", character: "lookdev/wizard-crisp-nostaff", at: WIZ0, face: WIZ_YAW, expr: "kind", follow: 0.25, seed: 2.6 },
];
const props = [
  { id: "table", kind: "cafetable", x: TABLE[0], z: TABLE[1], h: TH, r: TABLE_R },
  MUG_D, MUG_W, B1, B2,
  { id: "candle", kind: "pillarcandle", x: CANDLE[0], y: CANDLE[1], z: CANDLE[2], scale: CAN_S, lit: 0 },
  { id: "spark", kind: "breath", mouth: "dra", target: "candle", at: [0, COPYCAT.candle.wickTop + 0.006, 0], width: 0.022 },
  { id: "sidewall", kind: "sidewall", x: SIDE_X, z: -0.1, rot: -90, w: 4.4, h: 3.6 },
  { id: "hole", kind: "wallhole", x: HOLE[0], y: HOLE[1], z: HOLE[2], rot: -90, r: 0.42, floor: HOLE[1], wall: "#f1dfc2", open: 0, burst: 0 },
  { id: "blast", kind: "breath", mouth: "wiz", target: "hole", at: [0, 0, 0], width: 0.07 },
  // Dragon's jet (09): it runs to `aim`, an unseen point (a soot decal at scale 0) that sweeps up the side wall,
  // high and behind the Wizard so it passes over his hat; a scorch mark blooms at each point it passes
  { id: "aim", kind: "soot", x: SIDE_X - 0.02, y: SWEEP[0][0], z: SWEEP[0][1], rot: -90, scale: 0, size: 0.01 },
  { id: "jet", kind: "breath", mouth: "dra", target: "aim", at: [0, 0, 0], width: 0.1 },
  ...SWEEP.map(([y, z], i) => ({ id: `scorch${i + 1}`, kind: "soot", x: r3(SIDE_X - 0.015), y, z, rot: -90, scale: 0, size: 0.62 })),
];

const dCup = grips.mug(c, "dra", MUG_D, { side: "R", height: 0.6 });
const wCup = grips.mug(c, "wiz", MUG_W, { side: "L", height: 0.6 });
const wBot = grips.mug(c, "wiz", B1, { side: "R", height: 0.4 });
const dBot = grips.mug(c, "dra", B2, { side: "L", height: 0.4 });

// a big breath in: rear back a little and swell, lips pressed (the copied beat: the same for both)
const inhale = (t, who, d = 0.35) => {
  A(t, who, "pitch", { to: -8, dur: d, ease: "inOut" });
  A(t, who, "squash", { amount: -0.15, dur: d * 2 });
  A(t, who, "expr", { expr: "focused", set: { open: 0, pucker: 0.8, eye: 1.25, curve: -0.1 }, dur: 0.12 });
  A(t, who, "face", { press: 1, dur: 0.12 });
  sfx(t, "gasp", { gain: 0.35, reason: `${who} breathes in after the hot sauce` });
};
// a gulp: two swallows (the same two sounds for both, so the copy is heard too)
const gulp = (t, who, calm = false) => {
  sfx(t, "gulp", { gain: 0.45 }); sfx(r3(t + 0.14), "gulp", { gain: 0.4 });
  if (calm) { A(t, who, "expr", { expr: "deadpan", dur: 0.08 }); A(t, who, "face", { lid: 0.35, dur: 0.08 }); }   // Dragon: unbothered
  else A(t, who, "expr", { expr: "focused", set: { eye: 0.4, open: 0.15 }, dur: 0.08 });
};

// ---------------------------------------------------------------- 01 SIP 0.0-1.3
A(0, "dra", "wings", { to: 0.3, dur: 0 });                               // his orange wings a little open, so they read
for (const [who, s] of [["dra", "L"], ["wiz", "R"]]) { A(0, who, "arm", { side: s, pose: "rest", dur: 0 }); A(0, who, "grip", { side: s, shape: "relaxed", dur: 0 }); }
dCup.approach(0, 0); dCup.secure(0, 0);                                // Dragon's cup is already at his lips at frame 0
wCup.approach(0, 0); wCup.secure(0, 0);                                // the Wizard's hand is already round his cup
A(0, "dra", "look", { to: AT_CUP, dur: 0.01, blink: false });
A(0, "dra", "expr", { expr: "serene", set: { open: 0.1, pucker: 0.4, eye: 0.3 }, dur: 0.01 });
A(0, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.01, blink: false });   // he watches Dragon from frame 0
sfx(0.05, "ai/sip", { gain: 0.6 });
// the Wizard copies 0.15 s behind every move
let tw = wCup.carry(0.15, SIP_W, 0.3, "inOut", { tip: -38 });
A(0.3, "wiz", "look", { to: AT_CUP, dur: 0.12, blink: false });
A(0.3, "wiz", "expr", { expr: "serene", set: { open: 0.1, pucker: 0.4, eye: 0.3 }, dur: 0.12 });
sfx(tw, "ai/sip", { gain: 0.55 });
dCup.carry(0.45, CHEST_D, 0.25, "inOut", { tip: 0 });
A(0.45, "dra", "expr", { expr: "happy", set: { eye: 0.4 }, dur: 0.15 });
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words, at: OPENER.at });
wCup.carry(0.6, CHEST_W, 0.25, "inOut", { tip: 0 });
A(0.6, "wiz", "expr", { expr: "happy", set: { eye: 0.4 }, dur: 0.15 });
A(0.6, "wiz", "talk", { line: "aah!", tone: "excited", dur: 0.45, voice: false });
dCup.put(0.75, MUG_D0, { dur: 0.3 });
sfx(1.05, "put-down", { gain: 1.3 });
wCup.put(0.9, MUG_W0, { dur: 0.3 });
sfx(1.2, "put-down", { gain: 1.3 });
A(0.95, "dra", "look", { to: DRA_AT_WIZ, dur: 0.15, blink: false });
A(1.0, "dra", "expr", { expr: "deadpan", set: { curve: -0.05 }, dur: 0.25 });
A(1.1, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.15, blink: false });
A(1.1, "wiz", "expr", { expr: "kind", set: { curve: 0.6, eye: 1.1 }, dur: 0.25 });
cap(0, 2.8, "friends who copy *everything* you do", 250, false, { kinetic: false });

// ---------------------------------------------------------------- 02 TILT 1.3-2.1 (closer): the same way, a beat apart
A(1.32, "dra", "face", { lid: 0.3, dur: 0.25 });                        // narrowed eyes: a test
A(1.38, "dra", "lean", { to: 10, dur: 0.3, ease: "settle" });
A(1.53, "wiz", "lean", { to: 10, dur: 0.3, ease: "settle" });
A(1.6, "wiz", "expr", { expr: "delighted", set: { eye: 1.1 }, dur: 0.25 });
A(1.9, "dra", "lean", { to: 0, dur: 0.25 }); A(2.05, "wiz", "lean", { to: 0, dur: 0.25 });

// ---------------------------------------------------------------- 03 STRETCH 2.1-2.9: arms up wider than the hat brim
// Dragon (no hat) reaches straight up; the Wizard the same, only wide enough to clear his hat brim
const UP = { dra: { R: { o: [0.1, 1.2, 0.02] }, L: { o: [-0.2, 1.2, 0.02] } }, wiz: { R: { o: [0.2, 1.14, 0.06] }, L: { o: [0.26, 1.14, 0.06] } } };
for (const [who, t0] of [["dra", 2.12], ["wiz", 2.27]]) {
  for (const s of ["R", "L"]) { c.arm(t0, who, s, UP[who][s], 0.3, "settle"); A(t0, who, "grip", { side: s, shape: "fist", dur: 0.2 }); }
  A(t0, who, "squash", { amount: -0.08, dur: 0.6 });
  for (const s of ["R", "L"]) { c.arm(t0 + 0.45, who, s, "rest", 0.3, "inOut"); A(t0 + 0.55, who, "grip", { side: s, shape: "relaxed", dur: 0.2 }); }
}
A(2.12, "dra", "face", { lid: 0, dur: 0.2 });
A(2.15, "dra", "expr", { expr: "focused", set: { eye: 0.6 }, dur: 0.2 });
A(2.3, "wiz", "expr", { expr: "delighted", set: { eye: 0.5 }, dur: 0.2 });

// ---------------------------------------------------------------- 04 STEP 2.9-3.6
A(2.92, "dra", "move", { to: DRA1, dur: 0.4, steps: 2, ease: "inOut" });
A(3.07, "wiz", "move", { to: WIZ1, dur: 0.4, steps: 2, ease: "inOut" });
A(3.3, "dra", "look", { to: DRA_AT_WIZ, dur: 0.12, blink: false });
act.mood(c, 3.32, "dra", "annoyed", { hold: 0.2 });
A(3.47, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.12, blink: false });
A(3.47, "wiz", "expr", { expr: "smug", set: { curve: 0.7 }, dur: 0.25 });

// ---------------------------------------------------------------- 05 SMALL FLAME 3.6-4.5
A(3.6, "dra", "look", { to: DRA_AT_CANDLE, dur: 0.15, blink: false });
A(3.65, "dra", "turn", { to: 30, dur: 0.3, ease: "inOut" });
A(3.65, "dra", "pitch", { to: 9, dur: 0.3, ease: "inOut" });
A(3.7, "dra", "face", { lid: 0.15, brow: 0, dur: 0.15 });
A(3.7, "dra", "expr", { expr: "focused", set: { pucker: 0.9, open: 0.15 }, dur: 0.15 });
c.prop(3.82, "spark", { on: 1, fire: 0.6, len: 0.1 }, 0.03);
c.prop(3.85, "spark", { len: 1 }, 0.07, "out");
sfx(3.8, "ai/ignite", { gain: 0.8, reason: "the wick catches (3.98)" });
c.prop(3.98, "candle", { lit: 1 }, 0.12, "out");
c.prop(4.18, "spark", { on: 0, len: 0, fire: 0 }, 0.08);   // held long enough to read as fire breath (review A)
A(4.22, "dra", "pitch", { to: 0, dur: 0.3 }); A(4.22, "dra", "turn", { to: DRA_YAW, dur: 0.35 });
A(4.24, "dra", "expr", { expr: "smug", dur: 0.25 });
A(3.75, "wiz", "look", { to: WIZ_AT_CANDLE, dur: 0.15, blink: false });
A(4.0, "wiz", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.2 }, dur: 0.15 });
act.idea(c, 4.2, "wiz", { at: WIZ_AT_BOTTLE, hold: 0.2 });

// ---------------------------------------------------------------- 06 HOT SAUCE 4.5-5.8
tw = wBot.take(4.45, { reach: 0.2, settle: 0.12 });
tw = wBot.carry(tw, OVER_W, 0.1, "inOut");
tw = wBot.carry(tw, GULP_W, 0.12, "inOut", { tip: -70 });
gulp(r3(tw + 0.02), "wiz");
c.prop(tw, "bottle1", { fill: 0 }, 0.16, "inOut");
tw = wBot.carry(r3(tw + 0.16), OVER_W, 0.13, "inOut", { tip: 0 });
const putW = wBot.place(tw, BOT1, 0.16);
sfx(putW, "put-down-glass", { gain: 0.5 });
wBot.release(r3(putW + 0.02), { rest: false });   // the arm waits beside the bottle, then flies out with the blast
A(4.55, "dra", "look", { to: [0.5, -0.2], dur: 0.15, blink: false });
A(4.6, "dra", "expr", { expr: "deadpan", dur: 0.25 });
inhale(5.42, "wiz");

const BRACE = { o: [0.22, 0.78, -0.12] };   // arms flung out and back as the blast leaves him (clear of the table as he turns)
// ---------------------------------------------------------------- 07 TOO MUCH 5.8-7.3: away from Dragon, into the wall
A(5.74, "wiz", "turn", { to: 62, dur: 0.16, ease: "out" });
for (const s of ["R", "L"]) { c.arm(5.66, "wiz", s, BRACE, 0.16, "out"); c.arm(7.32, "wiz", s, "rest", 0.3, "inOut"); }
A(5.74, "wiz", "look", { to: [0.2, 0.45], dur: 0.1, blink: false });
A(5.86, "wiz", "pitch", { to: -10, dur: 0.1, ease: "out" });
A(5.86, "wiz", "expr", { expr: "shocked", set: { open: 0.9, eye: 0.5 }, dur: 0.08 });
A(5.86, "wiz", "face", { press: 0, dur: 0.06 });
A(5.86, "wiz", "squash", { amount: 0.1, dur: 0.5 });
c.prop(5.9, "blast", { on: 1, fire: 1, len: 0.1 }, 0.03);
c.prop(5.93, "blast", { len: 1 }, 0.14, "out");
sfx(5.7, "flamejet", { gain: 0.55, reason: "the Wizard's oversized blast (5.9-6.45)" });
c.prop(6.07, "hole", { open: 1 }, 0.08, "out");
c.prop(6.07, "hole", { burst: 3 }, 3, "linear");
c.hitStop(6.07);
c.at(6.07, { fx: "flash", peak: 0.35, dur: 0.2 });   // brings its own impact sound; kept under Dragon's jet (the payoff is the loudest moment)
c.at(6.07, { fx: "shake", amp: 0.07, dur: 0.5 });
c.at(6.1, { fx: "poof", pos: [r3(HOLE[0] - 0.05), r3(HOLE[1] - 0.5), r3(HOLE[2] - 0.15)], color: "#f1dfc2", puffs: 14, sparks: 0, speed: 0.6, dur: 0.8 });   // at the wall, clear of the Wizard's face
sfx(6.1, "crumble", { gain: 0.35 });
c.prop(6.4, "blast", { on: 0, fire: 0 }, 0.2, "inOut");
c.prop(6.62, "blast", { len: 0 }, 0.01);
A(6.45, "wiz", "pitch", { to: 0, dur: 0.3 });
A(6.5, "wiz", "turn", { to: 40, dur: 0.35, ease: "inOut" });
A(6.5, "wiz", "look", { to: AT_HOLE, dur: 0.15, blink: false });
A(6.5, "wiz", "expr", { expr: "shocked", set: { open: 0.45, eye: 1.3 }, dur: 0.15 });
A(6.1, "dra", "look", { to: AT_HOLE, dur: 0.1, blink: false });
act.shock(c, 6.12, "dra", { open: 0.3, eye: 1.3, brow: 0.4, dur: 0.15, hold: 0.6 });

// ---------------------------------------------------------------- 08 COPY BACK 7.3-9.0 (no second blast)
A(7.0, "wiz", "turn", { to: WIZ_YAW, dur: 0.35, ease: "inOut" });
A(7.05, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.15, blink: false });
act.sheepish(c, 7.1, "wiz");
A(7.3, "dra", "look", { to: DRA_AT_WIZ, dur: 0.12, blink: false });
A(7.3, "dra", "expr", { expr: "deadpan", set: { curve: 0 }, dur: 0.3 });
A(7.3, "dra", "face", { lid: 0.35, brow: 0, dur: 0.3 });
A(7.3, "dra", "still", { dur: 0.32, idle: 0.05 });
A(7.62, "dra", "look", { to: DRA_AT_BOTTLE, dur: 0.12, blink: false });
let tb = dBot.take(7.62, { reach: 0.14, settle: 0.1 });
tb = dBot.carry(tb, OVER_D, 0.1, "inOut");
tb = dBot.carry(tb, GULP_D, 0.12, "inOut", { tip: -70 });
gulp(r3(tb + 0.02), "dra", true);
c.prop(tb, "bottle2", { fill: 0 }, 0.16, "inOut");
tb = dBot.carry(r3(tb + 0.18), OVER_D, 0.14, "inOut", { tip: 0 });
const putD = dBot.place(tb, BOT2, 0.16);   // the empty bottle back on the table before the jet (he turns away from it)
sfx(putD, "put-down-glass", { gain: 0.5 });
dBot.release(r3(putD + 0.02));
inhale(8.2, "dra", 0.2);   // held until the chilli hits
A(r3(tb + 0.05), "wiz", "look", { to: WIZ_AT_DRA, dur: 0.1, blink: false });
act.shock(c, r3(tb + 0.1), "wiz", { open: 0.35, eye: 1.3, brow: 0.45, dur: 0.15, hold: 0.6 });

// ---------------------------------------------------------------- 09 FLAMES EVERYTHING 8.6-10.3
A(8.62, "dra", "expr", { expr: "shocked", set: { eye: 1.45, open: 0, pucker: 0.9, curve: -0.2 }, dur: 0.1 });   // the chilli hits
A(8.62, "dra", "squash", { amount: -0.24, dur: 0.25 });
A(8.62, "dra", "look", { to: [0.6, 0.5], dur: 0.12, blink: false });
sfx(8.62, "sizzle", { gain: 0.5, reason: "the chilli heating Dragon up from inside (eyes bulge, body swells)" });
A(8.78, "wiz", "look", { to: [-0.4, 0.4], dur: 0.1, blink: false });   // he sees it coming and ducks
A(8.8, "wiz", "crouch", { to: 1, dur: 0.15 });
A(8.8, "wiz", "squash", { amount: 0.2, dur: 0.15 });
A(8.8, "wiz", "pitch", { to: -6, dur: 0.15, ease: "out" });   // cowering back, off the table
A(8.8, "wiz", "expr", { expr: "shocked", set: { eye: 1.45, open: 0.55, curve: -0.7 }, dur: 0.1 });
A(8.82, "dra", "turn", { to: 68, dur: 0.2, ease: "out" });
A(8.82, "dra", "pitch", { to: -10, dur: 0.2, ease: "out" });
A(8.82, "dra", "wings", { to: 0.8, dur: 0.15 });
for (const s of ["R", "L"]) { c.arm(8.8, "dra", s, BRACE, 0.16, "out"); A(8.8, "dra", "grip", { side: s, shape: "fist", dur: 0.15 }); }
A(8.95, "dra", "expr", { expr: "shocked", set: { open: 1, eye: 0.6, curve: 0 }, dur: 0.06 });
A(8.95, "dra", "face", { press: 0, dur: 0.05 });
A(8.95, "dra", "squash", { amount: 0.12, dur: 0.4 });
c.prop(8.97, "jet", { on: 1, fire: 1, len: 0.1 }, 0.03);
c.prop(9.0, "jet", { len: 1 }, 0.12, "out");
sfx(8.92, "flamejet", { gain: 1.6, dur: 1.3, reason: "Dragon's chilli jet (8.97-10.15), the payoff" });
sfx(8.97, "ai/flare", { gain: 1.2, reason: "the jet bursts out of Dragon's mouth" });
sfx(9.55, "flamejet", { gain: 0.8, dur: 0.7, reason: "the jet keeps roaring up the wall" });
c.at(8.97, { fx: "shake", amp: 0.06, dur: 1.1 });
const PASS = [9.12, 9.42, 9.72, 9.98];   // when the jet's head reaches each sweep point
SWEEP.forEach(([y, z], i) => {
  if (i) c.prop(PASS[i - 1], "aim", { y, z }, r3(PASS[i] - PASS[i - 1]), "inOut");
  c.prop(PASS[i], `scorch${i + 1}`, { scale: 1 }, 0.12, "out");
  c.at(PASS[i], { fx: "poof", pos: [r3(SIDE_X - 0.1), r3(y - 0.1), z], color: "#5e5652", puffs: 6, sparks: 4, speed: 0.4, dur: 0.7 });
});
c.prop(9.0, "candle", { fire: 1 }, 0.15, "out");                        // the candle flares in the heat
c.prop(10.0, "candle", { fire: 0 }, 0.3, "inOut");
c.prop(10.1, "jet", { on: 0, fire: 0 }, 0.18, "inOut");
c.prop(10.3, "jet", { len: 0 }, 0.01);

// ---------------------------------------------------------------- 10 AAH 10.3-11.6
A(10.15, "dra", "turn", { to: DRA_YAW, dur: 0.3, ease: "inOut" });
A(10.15, "dra", "pitch", { to: 0, dur: 0.3, ease: "inOut" });
A(10.15, "dra", "wings", { to: 0.3, dur: 0.3 });
for (const s of ["R", "L"]) { c.arm(10.15, "dra", s, "rest", 0.3, "inOut"); A(10.3, "dra", "grip", { side: s, shape: "relaxed", dur: 0.2 }); }
c.at(10.2, { fx: "poof", pos: [-0.3, 0.62, 0.5], color: "#8a827d", puffs: 3, sparks: 0, speed: 0.12, dur: 0.5 });   // a wisp of smoke from his mouth
A(10.2, "dra", "squash", { amount: 0, dur: 0.3 });
A(10.4, "dra", "look", { to: [0.2, 0.1], dur: 0.12, blink: false });
A(10.42, "dra", "expr", { expr: "happy", set: { eye: 0.35 }, dur: 0.15 });
A(10.42, "dra", "talk", { line: "aah!", tone: "excited", dur: 0.45, voice: false });   // the opener again: refreshed
A(10.35, "wiz", "crouch", { to: 0, dur: 0.3 });
A(10.35, "wiz", "squash", { amount: 0, dur: 0.3 });
A(10.35, "wiz", "pitch", { to: 0, dur: 0.3, ease: "inOut" });
A(10.4, "wiz", "look", { to: AT_HOLE, dur: 0.12, blink: false });
A(10.45, "wiz", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.3 }, dur: 0.15 });
A(10.95, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.12, blink: false });
act.sheepish(c, 11.0, "wiz");
A(11.1, "wiz", "talk", { line: "aah...", tone: "excited", dur: 0.35, voice: false });   // one last copy, very small

act.blinksAt(c, "dra", [2.85, 5.25]);
act.blinksAt(c, "wiz", [3.17, 4.9]);   // he copies the blink too, a beat late

// ---------------------------------------------------------------- shots (set by hand: a vertical two-shot crops the
// outer shoulders, as the board does; the wide shows the wall hole)
const TWO = frame([0, 0.9, 0.3], { h: 3.05, fov: 30 });
const CLOSE2 = frame([-0.16, 0.84, 0.3], { h: 2.6, fov: 30 });
const WIDE = frame([0.56, 1.0, 0.2], { h: 4.2, fov: 34, az: -10 });
const NEAR = frame([0.12, 0.8, 0.3], { h: 2.68, fov: 30 });   // closer for the candle and the bottles (review A)
const PAY = frame([0, 0.86, 0.3], { h: 2.9, fov: 30 });
const CLOSE_D = frame([-0.36, 0.74, 0.3], { h: 1.9, fov: 30 });   // Dragon's face as the chilli hits
const BLAZE = frame([0.3, 1.25, 0.1], { h: 4.6, fov: 34, az: -10 });   // the whole side wall, the jet and the ducking Wizard
const beats = c.beats([
  ["sip", 0, TWO, "hook"],
  ["tilt", 1.3, CLOSE2],
  ["stretch", 2.1, TWO],
  ["step", 2.9, "keep"],
  ["small flame", 3.6, NEAR],
  ["hot sauce", 4.5, "keep", "escalation"],
  ["too much", 5.8, WIDE, "reveal"],
  ["shocked", 6.5, PAY],                          // review A: back to the two-shot for both shocked faces
  ["copy back", 7.3, "keep"],
  ["chilli hits", 8.6, CLOSE_D],
  ["flames everything", 8.92, BLAZE, "payoff"],
  ["aah", 10.3, PAY],
], END);

write(import.meta.url, {
  id: "friends-who-copy-everything",
  title: "Friends Who Copy Everything",
  idea: "The Wizard copies Dragon a beat late, all the way to fire breath via hot sauce; then Dragon copies him back",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "golden",
  set: { type: "plain", color: "#efe2c8", floor: "#b98a5f", light: "golden", para: 0, bloom: "emissive",
    plate: { src: "assets/plates/cafe-golden.png", z: -2.3, center: [0.3, 1.3], height: 5.6 },
    aperture: FOCUS ? 0.045 : 0, ...(FOCUS && { focus: "acting", focusBand: 0.7 }) },   // both sit at one depth: a 0.7 m sharp band keeps both faces crisp (0.25 blurred them, Jonny 31 Oct)
  music: { style: "bounce", gain: 0.22, parts: [{ at: 0, part: "main" }, { at: 7.25, part: "stop" }, { at: 7.62, part: "main" }, { at: 8.6, part: "stop" }, { at: 8.92, part: "main" }] },
  direct: { master: TWO },
  sound: { sfx: 0.6, ambience: 0.3, surface: "wood" },
  hook: { show: ["dra", "wiz", "cupD", "cupW"], hint: 0.3, what: "the Wizard copies Dragon's sip a beat late" },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [],
  notes: "Generated by storyboards/friend-comedies/copy-everything/make-friends-who-copy-everything.mjs.",
});
