// THE KING'S GUARD (London clip 2 of 2, 4 Nov 2026). Jonny's approved board: /mnt/project-files/video-scripts/
// 2026-11-04-london/02-kings-guard-panels.png (panel 8 corrected: Reaper stays at the wall corner). PANELS.md here.
//   node storyboards/london/kings-guard/make-kings-guard.mjs            -> kings-guard.json (the hook title burned in)
//   CLEAN=1 node storyboards/london/kings-guard/make-kings-guard.mjs    -> kings-guard-clean.json (for TikTok's text tool)
//
// THE BRIEF
//   Joke:        Phoenix tries everything to make guard Reaper laugh (face, dance, feather, fireballs) and gets nothing.
//   Wants:       Phoenix wants the guard to crack; Reaper wants to stay a perfect guard.
//   Consequence: Phoenix slips into a puddle; Reaper marches off without a flicker.
//   Ending:      round the corner Reaper is doubled over laughing; he snaps back to a stone face, but one tear is still
//                running down his cheek, and Phoenix, peeking round the corner, points straight at it.
//   Callback:    0 s the stone face Phoenix can't crack; 10 s the same stone face, cracked by one tear (same two, the
//                opposite result). Comment trigger: "What would make him crack?" (pick-a-side: which try got him).
//
// Places (the painted forecourt env, camera looking -z; x right, z toward us): the sentry box left, the palace railings
// behind, a stone gate pier with a wall to its left at the back right: the corner Reaper hides behind (panels 7-8).
import { clip, write } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const CLEAN = !!process.env.CLEAN;
const MOTION = "natural";
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const END = 10.0;

// ---------------------------------------------------------------- places
const BOX = [-0.62, -1.27], REA_BOX = [-0.62, -1.3];
const PHX = [0.3, 0.0];                       // in front of the box, a body-width right of Reaper
const PHX_TICKLE = [0.3, -0.47];              // close in, right of the box opening (panel 3)
const PHX_SLIP = [-0.36, 0.48], PHX_DOWN = [-0.5, 0.86];
const WIZ = [1.3, -1.4];                     // back right, filming
const WALL = [0.9, -2.7], PIER = [1.72, -2.35];
const REA_NOOK = [0.72, -2.07];                // in front of the wall, just left of the pier
const PHX_PEEK = [1.48, -1.4];                 // in front of the pier, leaning in round its corner
const PUDDLE = [-0.3, 0.88];

const cast = [
  { id: "rea", character: "london/reaper-guard", at: REA_BOX, face: "camera", expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "phx", character: "duo/phoenix", at: PHX, face: "camera", expr: "eager", follow: 0.3, seed: 1.7, span: 0 },
  { id: "wiz", character: "lookdev/wizard-crisp-nostaff", at: WIZ, face: -35, expr: "happy", follow: 0.3, seed: 2.6 },
];
const PHONE = { id: "phone", kind: "phone", style: "iphone", scale: 1.6, ...grips.placeFor("phone", [WIZ[0] - 0.2, 0.86, WIZ[1] + 0.3], -35) };
const FEATHER = { id: "feather", kind: "orangefeather", x: -0.18, y: 0.6, z: -0.28, rot: 0, tilt: -60, tip: -10, scale: 0.001 };
const props = [
  { id: "box", kind: "sentrybox", x: BOX[0], z: BOX[1], w: 1.04, d: 0.82, h: 2.1 },
  { id: "rails", kind: "railings", z: -2.9, x0: -4.2, x1: 4.2, h: 1.95, gaps: [[0.42, 2.1]] },
  { id: "wall", kind: "stoneblock", x: WALL[0], z: WALL[1], w: 0.92, h: 2.25, d: 0.36, seed: 3 },
  { id: "pier", kind: "stoneblock", x: PIER[0], z: PIER[1], w: 0.72, h: 2.6, d: 0.76, cap: 0.05, seed: 7 },
  { id: "puddle", kind: "wetpuddle", x: PUDDLE[0], z: PUDDLE[1], rx: 0.5, rz: 0.34 },
  PHONE, FEATHER,
  ...[0, 1, 2].map((i) => ({ id: `fb${i}`, kind: "fireball", x: PHX[0], y: 0.8, z: PHX[1] + 0.35, r: 0.07, seed: i })),
  { id: "pigeon", kind: "pigeon", wear: "rea", x: 2.1, y: 2.9, z: 0.6, rot: -60, scale: 1.25, flap: 1 },
  { id: "tongue", kind: "tongue", wear: "phx", x: 0.0, y: 0.6, z: 0.36, tip: 20 },
  { id: "steam", kind: "smokewisp", x: PHX_DOWN[0] + 0.05, y: 0.2, z: PHX_DOWN[1] - 0.45, h: 0.5, size: 0.08 },
  { id: "tearL", kind: "tear", wear: "rea", stream: true, x: 0.23, y: 0.6, z: 0.3, tilt: 15 },
  { id: "tearR", kind: "tear", wear: "rea", stream: true, x: -0.23, y: 0.6, z: 0.3, tilt: -15 },
  { id: "tear", kind: "tear", wear: "rea", x: 0.16, y: 0.585, z: 0.345, length: 0.05, scale: 1.5 },
];

// ---------------------------------------------------------------- 01 HOOK 0-1.0: the silly face (wide)
// Reaper: a stone guard all clip long until the corner (no blinks, no idle sway), eyes straight ahead
A(0, "rea", "look", { to: [0, 0], dur: 0.01, blink: false });
c.still(0, "rea", 5.75, 0);
act.blinksAt(c, "rea", []);
// Phoenix mid-face at frame 0: gloves pulling his cheeks, tongue out, eyes rolled in, wings flared, head waggling
c.arm(0, "phx", "R", "cheeks", 0.01); c.arm(0, "phx", "L", "cheeks", 0.01);
A(0, "phx", "wings", { to: 1, dur: 0.01 });
A(0, "phx", "expr", { expr: "dizzy", set: { open: 0.55, curve: 0.3, eye: 1.2, pupil: 0.55 }, dur: 0.01 });
c.prop(0, "tongue", { on: 1 }, 0.01);
A(0, "phx", "look", { to: [-0.05, -0.15], dur: 0.01, blink: false });
for (const [t, l] of [[0.0, -7], [0.22, 7], [0.44, -7], [0.66, 6], [0.86, 0]]) A(t, "phx", "lean", { to: l, dur: 0.2, ease: "inOut" });
act.opener(c, "phx", "blblblbl!", { at: 0.02, dur: 0.5 });
// the Wizard films it, grinning
const ph = grips.phone(c, "wiz", PHONE, { side: "R", height: 0.45 });
ph.secure(0, 0.01);
A(0, "wiz", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
if (!CLEAN) cap(0, 2.3, "When your friend tries to make the guard laugh", 250, false, { kinetic: false });
see(0, 1.0, ["phx.face", "rea.face", "box"], "frame 0: Phoenix's silly face right at the stone-faced guard in his box");

// ---------------------------------------------------------------- 02 THE DANCE 1.0-2.4 (wide)
c.prop(0.95, "tongue", { on: 0 }, 0.15);
A(0.95, "phx", "expr", { expr: "delighted", dur: 0.2 });
A(0.95, "phx", "lean", { to: 0, dur: 0.1 });
c.arm(1.0, "phx", "R", "up", 0.25, "out"); c.arm(1.0, "phx", "L", { o: [0.3, 0.55, 0.2] }, 0.25, "out");
for (const [t, h, l] of [[1.1, 0.16, -9], [1.48, 0.2, 9], [1.86, 0.16, -8]]) {
  A(t, "phx", "hop", { height: h, dur: 0.34 }); A(t, "phx", "lean", { to: l, dur: 0.3, ease: "inOut" });
}
c.arm(1.48, "phx", "L", "up", 0.25, "inOut"); c.arm(1.48, "phx", "R", { o: [0.3, 0.55, 0.2] }, 0.25, "inOut");
c.arm(1.86, "phx", "R", "up", 0.25, "inOut"); c.arm(1.86, "phx", "L", { o: [0.3, 0.55, 0.2] }, 0.25, "inOut");
A(1.1, "phx", "talk", { line: "la la laa!", tone: "excited", dur: 0.9, voice: false });
A(2.22, "phx", "lean", { to: 0, dur: 0.18 });
// the guard: nothing. Only the bearskin's fur stirs.
see(1.0, 2.4, ["phx", "rea.face"], "the dance gets nothing");

// ---------------------------------------------------------------- 03 THE FEATHER 2.4-3.6 (close two-shot)
A(2.25, "phx", "wings", { to: 0.2, dur: 0.3 });
A(2.3, "phx", "move", { to: PHX_TICKLE, dur: 0.35, steps: 1.4 });
c.arm(2.3, "phx", "L", "rest", 0.3); c.arm(2.3, "phx", "R", "rest", 0.3);
A(2.4, "phx", "turn", { to: -40, dur: 0.25 });
A(2.4, "phx", "expr", { expr: "eager", set: { curve: 0.8, smirk: 0.4 }, dur: 0.2 });
A(2.4, "phx", "look", { to: [-0.8, 0.25], dur: 0.15 });
// the feather comes out of his own wing (his left hand behind, then up to Reaper's chin)
const fh = grips.thin(c, "phx", FEATHER, { side: "R", from: 0.2, roll: -20, readyRoll: -20 });
c.prop(2.42, "feather", { scale: 1.6 }, 0.08);
fh.take(2.45);
const CHIN = [-0.05, 0.53, -0.6];
fh.carry(2.8, CHIN, 0.3, "inOut");
c.prop(2.8, "feather", { tilt: -75, tip: -30 }, 0.3);
for (let i = 0; i < 3; i++) { const t = 3.12 + i * 0.16; fh.carry(t, [CHIN[0] + 0.03, CHIN[1] + 0.035, CHIN[2]], 0.08, "inOut"); fh.carry(t + 0.08, CHIN, 0.08, "inOut"); }
sfx(3.12, "kenney/cloth", { gain: 0.05, reason: "the feather brushing his chin (three strokes)" });
A(3.1, "phx", "talk", { line: "tickle tickle!", tone: "excited", dur: 0.5, voice: false });
// Reaper: stone still, but one mouth corner trembles and an eyelid twitches
for (const [t, k] of [[3.15, 0.35], [3.22, 0.05], [3.3, 0.4], [3.38, 0.0]]) A(t, "rea", "face", { cornerL: k, dur: 0.06 });
A(3.24, "rea", "face", { lidL: 0.85, dur: 0.05 }); A(3.31, "rea", "face", { lidL: 0.6, dur: 0.06 });
c.textPop(3.18, "rea", "*twitch*", { dur: 0.45, size: 64, dx: -0.75, dy: -0.15 });
see(2.6, 3.55, ["rea.face", "phx.face", "feather"], "the feather under his chin, the mouth corner trembling");

// ---------------------------------------------------------------- 04 FIREBALLS + PIGEON 3.6-4.6 (wide)
A(3.42, "phx", "release", { prop: "feather", hand: "R", to: [0.05, 0.01, -0.4], dur: 0.4, arc: 0.15 });
c.prop(3.42, "feather", { tilt: 90 }, 0.4); A(3.42, "phx", "grip", { side: "R", shape: "open", dur: 0.1 });
A(3.48, "phx", "move", { to: PHX, dur: 0.22, steps: 0.8 });
A(3.48, "phx", "turn", { to: 0, dur: 0.2 });
A(3.6, "phx", "expr", { expr: "delighted", dur: 0.15 });
A(3.6, "phx", "look", { to: [0, 0.55], dur: 0.12 });
const HR = [PHX[0] - 0.3, 0.72, PHX[1] + 0.34], HL = [PHX[0] + 0.3, 0.72, PHX[1] + 0.34];
c.arm(3.48, "phx", "R", { x: [-0.3, 0.42, 0.34] }, 0.18); c.arm(3.48, "phx", "L", { x: [0.3, 0.42, 0.34] }, 0.18);
for (let i = 0; i < 3; i++) { const id = `fb${i}`, s = i % 2 ? HL : HR; c.prop(3.58, id, { x: s[0], y: s[1] + 0.08 + 0.15 * i, z: s[2] }, 0.01); c.prop(3.6, id, { on: 1 }, 0.08); }
sfx(3.6, "ai/flare", { gain: 0.5, reason: "three fireballs flare up over his gloves" });
// a three-ball cascade: every 0.2 s one ball leaves a hand and lands in the other 0.4 s later
for (let k = 0; k < 4; k++) {
  const t = 3.66 + k * 0.2, id = `fb${k % 3}`, from = k % 2 ? HL : HR, to = k % 2 ? HR : HL;
  c.prop(t, id, { x: to[0], y: to[1] + 0.06, z: to[2] }, 0.4, "linear"); c.items[c.items.length - 1].arc = 0.42;
  const side = k % 2 ? "L" : "R"; c.arm(t - 0.08, "phx", side, { x: [side === "R" ? -0.27 : 0.27, 0.48, 0.36] }, 0.1, "inOut"); c.arm(t + 0.04, "phx", side, { x: [side === "R" ? -0.3 : 0.3, 0.42, 0.34] }, 0.12, "inOut");
}
for (let i = 0; i < 3; i++) c.prop(4.42 + 0.04 * i, `fb${i}`, { on: 0 }, 0.12);
sfx(4.45, "steam", { gain: 0.12, reason: "the fireballs puff out" });
A(3.8, "phx", "talk", { line: "ta-daa!", tone: "excited", dur: 0.5, voice: false });
// the pigeon lands on the bearskin, beside the sprout
c.prop(3.62, "pigeon", { x: 0.1, y: 1.66, z: 0.04, rot: -20 }, 0.32, "out"); c.items[c.items.length - 1].arc = 0.12;
c.prop(3.9, "pigeon", { flap: 0 }, 0.12);
c.prop(4.05, "pigeon", { happy: 1 }, 0.2);
sfx(3.65, "wing-flap", { gain: 0.25, reason: "the pigeon's wings as it lands on the bearskin" });
// the Wizard laughs behind his phone
A(3.85, "wiz", "expr", { expr: "delighted", dur: 0.2 });
A(3.9, "wiz", "talk", { line: "hehehe!", tone: "excited", dur: 0.6, voice: false });
for (const [t, s] of [[3.9, 0.06], [4.05, 0.06], [4.2, 0.05]]) A(t, "wiz", "squash", { amount: s, dur: 0.14 });
see(3.65, 4.5, ["phx.face", "rea.face", "fb0", "pigeon"], "the fireballs and the pigeon on the hat; the guard's eyes stay ahead");

// ---------------------------------------------------------------- 05 THE SLIP 4.6-5.8 (wide)
A(4.55, "phx", "expr", { expr: "sad", set: { open: 0.35, eye: 0.85 }, dur: 0.2 });   // out of breath
A(4.55, "phx", "look", { to: [0, -0.1], dur: 0.2 });
c.arm(4.5, "phx", "R", "rest", 0.25); c.arm(4.5, "phx", "L", "rest", 0.25);
A(4.6, "phx", "talk", { line: "hff, hff", tone: "calm", dur: 0.4, voice: false });
A(4.75, "phx", "move", { to: PHX_SLIP, dur: 0.25, steps: 0.8 });
// the slip: the front foot shoots out, he goes over backwards and lands flat in the puddle
A(5.0, "phx", "expr", { expr: "shocked", dur: 0.08 });
A(5.0, "phx", "wings", { to: 1, dur: 0.12 });
c.arm(5.0, "phx", "R", "up", 0.15, "out"); c.arm(5.0, "phx", "L", "up", 0.15, "out");
A(5.0, "phx", "lean", { to: -72, dur: 0.24, ease: "in" }); A(5.0, "phx", "pitch", { to: -22, dur: 0.24, ease: "in" });
A(5.0, "phx", "move", { to: PHX_DOWN, dur: 0.24, ease: "in" });
A(5.0, "phx", "drop", { to: -0.18, dur: 0.24 });
A(5.02, "phx", "talk", { line: "waah!", tone: "excited", dur: 0.25, voice: false });
c.prop(5.24, "puddle", { splash: 1 }, 0.55, "out"); c.prop(5.24, "puddle", { ring: 1 }, 1.2, "out");
sfx(5.24, "splash", { gain: 0.7, reason: "Phoenix lands flat in the puddle" });
sfx(5.24, "splort", { gain: 0.3, reason: "the wet slap of a potato in a puddle" });
A(5.24, "phx", "squash", { amount: 0.18, dur: 0.2 });
A(5.26, "phx", "expr", { expr: "sad", set: { eye: 0.08, curve: -0.5, open: 0.4 }, dur: 0.12 });
A(5.3, "phx", "wings", { to: 0.6, dur: 0.3 });
c.arm(5.28, "phx", "R", { o: [0.25, 0.25, 0.1] }, 0.2); c.arm(5.28, "phx", "L", { o: [0.25, 0.25, 0.1] }, 0.2);
c.prop(5.32, "steam", { on: 1 }, 0.1); c.prop(5.9, "steam", { on: 0 }, 0.5);
sfx(5.32, "steam", { gain: 0.12, reason: "his crest fizzles out in the puddle: a puff of steam" });
A(5.35, "wiz", "expr", { expr: "shocked", dur: 0.15 });
A(5.3, "wiz", "look", { to: [-0.5, -0.35], dur: 0.15 });
see(5.25, 5.75, ["phx", "rea.face", "puddle"], "Phoenix flat in the puddle; Reaper doesn't even look down");

// ---------------------------------------------------------------- 06 CHANGE OF GUARD 5.8-7.0 (wide)
// Phoenix stays flat in the puddle while the guard marches out behind him (he never sees where he goes), then sits
// up, defeated, once the guard is past: lying low, he doesn't hide the march
A(6.62, "phx", "lean", { to: -10, dur: 0.35, ease: "inOut" }); A(6.62, "phx", "pitch", { to: 8, dur: 0.35, ease: "inOut" });
A(6.62, "phx", "drop", { to: -0.13, dur: 0.35 });
c.arm(6.62, "phx", "R", "rest", 0.35); c.arm(6.62, "phx", "L", "rest", 0.35);   // arms slump into his lap
A(5.8, "phx", "expr", { expr: "sad", dur: 0.3 }); A(5.65, "phx", "wings", { to: 0, dur: 0.4 });
A(5.8, "phx", "look", { to: [0, -0.5], dur: 0.3 });
// Reaper marches out: step out of the box, a smart turn to his left, high steps to the corner
A(5.8, "rea", "move", { to: [REA_BOX[0], REA_BOX[1] + 1.1], dur: 0.4, steps: 1.3 });
A(6.2, "rea", "turn", { to: 80, dur: 0.16, ease: "out" });
A(6.36, "rea", "move", { to: [0.25, -0.42], dur: 0.36, steps: 3.0, ease: "in" }); A(6.72, "rea", "move", { to: [0.72, -0.82], dur: 0.28, steps: 3.0, ease: "linear" });
// the Wizard lowers his phone
ph.carry(5.95, [WIZ[0] - 0.22, 0.6, WIZ[1] + 0.3], 0.4);
A(6.0, "wiz", "expr", { expr: "sad", set: { curve: 0.1 }, dur: 0.3 });
see(5.9, 6.95, ["rea", "phx", "pigeon"], "the guard marches off with the pigeon on his hat, Phoenix sits defeated");

// ---------------------------------------------------------------- 07 AROUND THE CORNER 7.0-8.5 (medium)
// a cut skips the rest of the march: he is already in the nook, doubled over, silent laughter, tears streaming
A(7.0, "rea", "move", { to: REA_NOOK, dur: 0.01 }); A(7.0, "rea", "turn", { to: 0, dur: 0.01 });
A(7.0, "phx", "hide"); A(7.0, "wiz", "hide"); c.prop(7.0, "phone", { scale: 0.001 }, 0.01);
A(7.0, "rea", "pitch", { to: 22, dur: 0.12, ease: "out" });
A(7.0, "rea", "crouch", { to: 0.5, dur: 0.12 });
A(7.0, "rea", "expr", { expr: "delighted", set: { eye: 0.05, curve: 1, open: 0.85, tilt: 0.5 }, dur: 0.08 });
A(7.0, "rea", "hat", { spin: [0, 0, -14], off: [0.03, -0.01, 0], dur: 0.15 });
A(7.0, "rea", "tilt", { to: [-28, 0], dur: 0.2 });     // the scythe leans on the wall
for (let i = 0; i < 5; i++) A(7.05 + i * 0.25, "rea", "squash", { amount: 0.06, dur: 0.2 });
c.arm(7.0, "rea", "L", { o: [-0.04, 0.08, 0.34] }, 0.1);
for (let i = 0; i < 3; i++) { const t = 7.15 + i * 0.36; c.arm(t, "rea", "L", { o: [-0.05, 0.28, 0.36] }, 0.14, "out"); c.arm(t + 0.15, "rea", "L", { o: [-0.04, 0.06, 0.34] }, 0.1, "in"); }
for (const id of ["tearL", "tearR"]) c.prop(7.0, id, { on: 1 }, 0.12);
A(7.02, "rea", "talk", { line: "pfff-hhhh!", tone: "excited", dur: 1.1, voice: false });
c.textPop(7.15, "rea", "PFFF", { dur: 0.9, size: 96, dx: 0.65, dy: -0.55 });
// the pigeon flaps off the tilted hat
c.prop(7.05, "pigeon", { flap: 1, happy: 0 }, 0.08);
c.prop(7.1, "pigeon", { x: -0.9, y: 2.6, z: 0.5, rot: 40 }, 0.6, "in");
sfx(7.08, "wing-flap", { gain: 0.25, reason: "the pigeon flaps off the tipped bearskin" });
see(7.05, 8.4, ["rea.face"], "the guard doubled over laughing round the corner");

// ---------------------------------------------------------------- 08 SNAP BACK 8.5-10.0 (same medium)
A(8.5, "rea", "pitch", { to: 0, dur: 0.1, ease: "out" });
A(8.5, "rea", "crouch", { to: 0, dur: 0.1 });
A(8.5, "rea", "hat", { spin: [0, 0, 0], off: [0, 0, 0], dur: 0.1 });
A(8.5, "rea", "tilt", { to: null, dur: 0.12 });
c.arm(8.5, "rea", "L", "rest", 0.12);
A(8.5, "rea", "expr", { expr: "deadpan", dur: 0.08 });
A(8.5, "rea", "look", { to: [0, 0], dur: 0.05, blink: false });
for (const id of ["tearL", "tearR"]) c.prop(8.5, id, { on: 0 }, 0.06);
c.prop(8.5, "tear", { on: 1, fill: 0.3 }, 0.08); c.prop(8.6, "tear", { y: 0.49, z: 0.335, fill: 1 }, 1.35, "inOut");
sfx(8.5, "whoosh", { gain: 0.25, reason: "he snaps back upright" });
c.still(8.62, "rea", 1.36, 0);
// Phoenix peeks round the corner, sees the tear, points at it, grins
A(8.5, "phx", "show"); A(8.5, "phx", "move", { to: PHX_PEEK, dur: 0.01 }); A(8.5, "phx", "pitch", { to: 0, dur: 0.01 }); A(8.5, "phx", "drop", { to: 0, dur: 0.01 });
A(8.5, "phx", "turn", { to: -30, dur: 0.01 }); A(8.5, "phx", "wings", { to: 0.3, dur: 0.01 });
A(8.5, "phx", "lean", { to: 0, dur: 0.01 }); c.arm(8.5, "phx", "R", "rest", 0.01); c.arm(8.5, "phx", "L", "rest", 0.01); A(8.5, "phx", "expr", { expr: "eager", dur: 0.01 }); A(8.62, "phx", "lean", { to: -28, dur: 0.22, ease: "out" });
A(8.62, "phx", "look", { to: [-0.8, 0.15], dur: 0.1 });
A(8.75, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 1.1 }, dur: 0.15 });
c.arm(8.85, "phx", "R", { x: [-0.42, 0.55, 0.3] }, 0.18, "out"); A(8.85, "phx", "grip", { side: "R", shape: "point", dur: 0.12 });
A(8.95, "phx", "talk", { line: "AHA!", tone: "excited", dur: 0.4, voice: false });
c.textPop(8.95, "phx", "!", { dur: 0.6, size: 110, dx: 0.4, dy: -0.6 });
see(8.9, 9.95, ["rea.face", "phx.face", "tear"], "the stone face with the one tear, and Phoenix pointing at it");

// ---------------------------------------------------------------- shots: [name, start, camera, kind]
const WIDE = { pos: [0.05, 1.4, 4.4], look: [0.05, 1.02, -0.6], fov: 46 };
const CLOSE = { pos: [-0.12, 1.05, 2.3], look: [-0.22, 0.98, -0.95], fov: 36 };
const NOOK = { pos: [0.9, 0.95, 1.25], look: [1.2, 0.9, -2.15], fov: 46 };
const beats = c.beats([
  ["01 silly face", 0, WIDE, "hook"],
  ["02 dance", 1.0, "keep"],
  ["03 feather", 2.4, CLOSE],
  ["04 fireballs and pigeon", 3.6, WIDE, "escalation"],
  ["05 slip", 4.6, "keep"],
  ["06 change of guard", 5.8, "keep"],
  ["07 around the corner", 7.0, NOOK, "payoff"],
  ["08 the tear", 8.5, "keep", "reveal"],
], END);

write(import.meta.url, {
  id: CLEAN ? "kings-guard-clean" : "kings-guard",
  title: "When your friend tries to make the guard laugh",
  idea: "London clip 2 (4 Nov 2026): Phoenix can't crack guard Reaper; round the corner Reaper cracks, one tear gives him away",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "sheet",
  motion: MOTION,
  set: { type: "env", env: "london-palace-forecourt-rain", aperture: 0, focus: false },
  music: { style: "march", bpm: 112, gain: 0.3, payoff: 7.0, parts: [{ at: 0, part: "main" }, { at: 6.4, part: "stop" }, { at: 7.0, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "stone" },
  hook: { show: ["phx", "rea", "box"], hint: 0, what: "Phoenix pulls a silly face an inch from the guard, who doesn't move" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "box", from: 0, to: 6.2, reason: "the guard stands in his sentry box (its walls round him) and steps out of it" },
    { who: "rea", with: "wall", from: 7.0, to: END, reason: "his back and the leaning scythe against the stone wall of the nook" },
    { who: "phx", with: "feather", from: 2.4, to: 2.9, reason: "he plucks the feather from his own wing" },
    { who: "phx", with: "puddle", from: 5.0, to: 7.0, reason: "Phoenix lies and sits in the puddle" },
    { who: "phx", with: "pier", from: 8.5, to: END, reason: "Phoenix leans round the pier's corner" },
  ],
  notes: "Generated by storyboards/london/kings-guard/make-kings-guard.mjs.",
});
