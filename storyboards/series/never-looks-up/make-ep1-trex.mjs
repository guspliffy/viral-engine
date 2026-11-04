// NEVER LOOKS UP, episode 1: T-REX (4 Nov 2026). "The friend who never looks up from his phone… even when a T-rex shows up"
// Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip (01-dinosaur/); series format
// 00-SERIES-FORMAT.md; the panel notes are PANELS.md next to this file. The panels are the target.
//
// THE BRIEF
//   Joke:        a T-rex sniffs, roars and blows the log out from under Phoenix; he never looks up from his phone.
//   Wants:       the friends want him to run (or at least look); the T-rex wants a reaction.
//   Consequence: his wings catch him and he hovers, still scrolling; the T-rex's face is 20 cm from the phone.
//   Ending:      the series ending: he looks up, "huh.", back to the phone, ping; the T-rex gives up and watches his
//                screen with him; the friends glare at each other.
//   Callback:    the opening's threat (a T-rex out of the ferns) ends as a second phone-watcher.
//
//   node storyboards/series/never-looks-up/make-ep1-trex.mjs
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";
import { trexPoints } from "../../../engine/shared/trex-rig.js";

const FACES = "strong", MOTION = "natural";
const ENV = process.env.ENV ?? "fern-valley-campfire";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0;

// ---------------------------------------------------------------- places (x right, z toward us; the valley is -z)
const rad = (d) => (d * Math.PI) / 180;
const LOG = { x: -0.3, z: 0.95, rot: 30 };                     // Phoenix sits on it facing a little to screen right
const LOG_GONE = { x: -0.95, z: 1.3 };                           // rolled left against the boulder
const FIRE = [0.72, 1.45];
const ROCK = { x: -1.2, z: -0.8, w: 1.3, h: 0.46, d: 0.8 };  // the hiding rock, behind Phoenix to screen left (P2, P6-P8)
const PERCH = { x: -1.9, z: -3.15, w: 0.95, h: 0.9, d: 0.75 };   // a flat rock behind it: Reaper stands on it (the totem's top)
const BOULDER = { x: -1.55, z: 1.15, w: 0.8, h: 0.6, d: 0.7 };   // where the log stops
const PHX = [LOG.x, LOG.z];
const WIZ0 = [0.75, 0.2], VIK0 = [1.4, 0.85];
const REA0 = [PERCH.x, PERCH.z];
const WIZ_HIDE = [-1.65, -2.25], VIK_HIDE = [-0.6, -1.6];
const WIZ_TOTEM = [-1.85, -2.42], VIK_TOTEM = [-1.8, -1.6];
const REX0 = { x: 2.55, z: -3.6, rot: -50 };                     // the T-rex, half in the ferns at frame 0
const REX = { x: 2.2, z: -3.15, rot: -48 };                    // one stomp further in
const REX_NEAR = { x: 2.0, z: -1.5, rot: -43 };                // two steps in for the sniff: its head reaches Phoenix

// Phoenix holds the phone in both gloves in front of his chest (Still Scrolling)
const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const SEAT = 0.42 - 0.12, LIFT = 0.22;
const AT_PHONE = [0.03, -1];
// where the phone is in the world while he sits (his yaw LOG.rot; the hold is 0.44 in front, about 0.75 up)
const fwd = (at, yaw, d, side = 0) => [r3(at[0] + Math.sin(rad(yaw)) * d - Math.cos(rad(yaw)) * side), r3(at[1] + Math.cos(rad(yaw)) * d + Math.sin(rad(yaw)) * side)];
const PHONE_W = (() => { const [x, z] = fwd(PHX, LOG.rot, 0.44); return [x, SEAT + 0.12 + 0.33 + 0.12, z]; })();
const CREST_W = [PHX[0], 1.3, PHX[1]];

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX, face: LOG.rot, expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 2.0,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: WIZ0, face: 20, expr: "kind", follow: 0.4, seed: 2.6 },
  { id: "vik", character: "duo/viking", at: VIK0, face: -35, expr: "kind", follow: 0.4, seed: 3.3 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, y: PERCH.h, face: 0, expr: "kind", follow: 0.25, seed: 3.1 },
];
const STICK = { id: "stick", kind: "mallowstick", len: 0.75, ...grips.placeFor("toffeeapple", [VIK0[0] - 0.31, 0.32, VIK0[1] + 0.18], -35) };
const BAG0 = { x: VIK0[0] + 0.32, y: 0.36, z: VIK0[1] + 0.1 };
const BAG_DOWN = [0.85, 0, 0.95];
const props = [
  { id: "log", kind: "firelog", x: LOG.x, z: LOG.z, rot: LOG.rot, len: 1.1 },
  { id: "fire", kind: "campfire", x: FIRE[0], z: FIRE[1], lit: 1, r: 0.27 },
  { id: "rock", kind: "boulder", ...ROCK, seed: 3 },
  { id: "perch", kind: "boulder", ...PERCH, seed: 7 },
  { id: "boulder", kind: "boulder", ...BOULDER, seed: 11 },
  { id: "rex", kind: "trex", ...REX0, neckP: -5, headP: 25, neckY: -10, jaw: 0.35, lookX: 0, lookY: -0.4, brow: 0.2 },
  { id: "ferns1", kind: "ferns", x: 1.6, z: -2.45, n: 11, len: 1.9, seed: 3, from: [1, -1] },
  { id: "ferns2", kind: "ferns", x: 2.55, z: -2.1, n: 9, len: 1.7, seed: 8 },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.9, z: PHX[1] + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36" },
  STICK,
  { id: "bag", kind: "mallowbag", ...BAG0, rot: -40 },
  { id: "mallows", kind: "mallows", x: STICK.x, y: 0.9, z: STICK.z, scale: 0 },
  { id: "roar", kind: "roarlines", x: 0, y: 0, z: 0 },
];

// ---------------------------------------------------------------- T-rex poses (the snout aimed with the rig's own numbers)
const rexState = { ...REX0, neckP: -5, headP: 25, neckY: -10, lean: 0, headY: 0, headR: 0 };
// find neckY / neckP / headP / lean that put the snout tip at `target`, with the head pitched `pitch` deg (+ = nose down)
function aim(base, target, { pitch = 20, headY = 0, headR = 0 } = {}) {
  let best = null;
  for (const pitchK of [pitch].flat()) for (let lean = -5; lean <= 30; lean += 2.5) for (let nY = -70; nY <= 70; nY += 2.5) for (let nP = -25; nP <= 80; nP += 2.5) {
    const hP = pitchK - lean - nP;
    const p = trexPoints({ ...base, lean, neckY: nY, neckP: nP, headP: hP, headY, headR }).snout;
    const d = Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2]) + Math.abs(hP) * 0.002 + lean * 0.001;
    if (!best || d < best.d) best = { d, lean, neckY: nY, neckP: nP, headP: hP };
  }
  return best;
}
function rex(t, base, target, o = {}, dur = 0.4, ease = "inOut") {
  const a = aim(base, target, o);
  if (a.d > 0.12) console.log(`  rex aim at ${t}: off by ${a.d.toFixed(2)} m`);
  const set = { x: base.x, z: base.z, rot: base.rot, lean: a.lean, neckY: a.neckY, neckP: a.neckP, headP: a.headP, headY: o.headY ?? 0, headR: o.headR ?? 0, ...(o.set || {}) };
  prop(t, "rex", set, dur, ease);
  Object.assign(rexState, set);
  if (process.env.DEBUG) { const P = trexPoints({ ...rexState }); console.log(`  rex ${t}:`, JSON.stringify({ snout: P.snout.map(r3), eyeL: P.eyeL.map(r3), eyeR: P.eyeR.map(r3), head: P.head.map(r3) })); }
  return a;
}

function rexPose(t, base, set, dur = 0.4, ease = "inOut") {
  const full = { x: base.x, z: base.z, rot: base.rot, lean: 0, neckY: 0, neckP: 0, headP: 0, headY: 0, headR: 0, ...set };
  prop(t, "rex", full, dur, ease); Object.assign(rexState, full);
}

// ---------------------------------------------------------------- Phoenix: on the log, on the phone, from frame 0
A(0, "phx", "sit", { seat: "log", dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.55, dur: 0 });
act.blinksAt(c, "phx", [1.9, 4.6, 6.9]);
act.scrollPhone(c, "phx", [0.2, 1.1, 2.0, 3.0, 4.75, 5.6, 6.5, 7.3]);
prop(0, "phone", { glow: 0.6 }, 0.01);

// ---------------------------------------------------------------- 1 STOMP 0-1.5 (P1)
const CAP_Y = 640;   // gibberish captions: in the sky over the volcano, below the title's top 20 %
prop(0, "rex", { step: 1 }, 0.01);
prop(0.01, "rex", { step: 0, x: REX.x, z: REX.z }, 0.09, "in");                  // the foot lands at 0.10
c.hitStop(0.1, 3);
sfx(0.1, "dinostomp", { gain: 0.9 });
c.at(0.1, { fx: "shake", amp: 0.03, dur: 0.35 });
prop(0, "ferns1", { part: 1 }, 0.5, "out");
rexPose(0, REX0, { lean: 5, neckP: 5, headP: 18, neckY: 5, jaw: 0.45, lookX: -0.2, lookY: -0.5, brow: -0.6, squint: 0.25 }, 0.01);
rexPose(0.01, REX, { lean: 10, neckP: 8, headP: 22, neckY: 8, jaw: 0.55 }, 0.6, "out");
// the stomp throws Viking's marshmallows off his stick
prop(0.1, "stick", { fall: 1 }, 0.01);
prop(0.1, "mallows", { scale: 1, x: STICK.x + 0.05, y: 0.95, z: STICK.z + 0.1 }, 0.01);
c.at(0.11, { do: "prop", id: "mallows", set: { x: 1.0, y: 0.0, z: 1.15, burst: 1, spin: 1.5 }, dur: 0.55, ease: "in", arc: 0.25 });
prop(0.1, "fire", { puff: 1 }, 0.1); prop(0.4, "fire", { puff: 0 }, 0.5);
// Wizard: the yelp and the point
A(0, "wiz", "look", { to: [0.7, 0.75], dur: 0, blink: false });
act.shock(c, 0.02, "wiz", { open: 0.4, hold: 1.2 });
c.arm(0, "wiz", "L", { o: [0.22, 0.85, 0.2] }, 0);                       // pointing up at it (his left: the T-rex side)
A(0.05, "wiz", "talk", { line: "tee rex!", dur: 0.55, tone: "excited", voice: false });
c.cap(0.05, 1.2, "T-REX!!", CAP_Y);
// Viking: stick in the right glove, bag in the left; looks up, jaw drops
const stick = grips.thin(c, "vik", STICK, { side: "R", from: 0.18 });
stick.secure(0, 0);
A(0, "vik", "look", { to: [0.5, 0.8], dur: 0, blink: false });
act.shock(c, 0.12, "vik", { open: 0.35, hold: 1.0 });
A(0, "vik", "grab", { prop: "bag", hand: "L", grip: [0, 0.15, 0.06], pose: { o: [0.22, 0.45, 0.24] } });
// Reaper behind the rock: wide eyes up at it
A(0, "rea", "look", { to: [0.6, 0.6], dur: 0, blink: false });
act.shock(c, 0.2, "rea", { open: 0.05, eye: 1.2, hold: 2.0 });
see(0, 1.5, ["phx.face", "wiz.face", "vik.face", "rea.face", "rex", "phone"], "P1: the T-rex out of the ferns, everyone sees it but Phoenix");

// ---------------------------------------------------------------- 2 PANIC 1.5-3.2 (P2)
// Viking drops the bag by the fire and runs; the Wizard runs round the rock's left; both end up behind it with Reaper
A(1.35, "vik", "release", { prop: "bag", to: BAG_DOWN, dur: 0.3, arc: 0.05 });
stick.release(1.33);
c.arm(1.55, "vik", "R", { o: [0.12, 0.38, 0.18] }, 0.2); c.arm(1.55, "vik", "L", { o: [0.12, 0.38, 0.18] }, 0.2);   // arms out as he runs
c.arm(2.6, "vik", "R", "rest", 0.3); c.arm(2.6, "vik", "L", "rest", 0.3);                                                               // drops the stick where it is
prop(1.33, "stick", { y: 0, tilt: 80, x: STICK.x - 0.25, z: STICK.z + 0.35 }, 0.3, "in");
prop(1.65, "bag", { rot: -70, tilt: 75 }, 0.15);
// one smooth run each round the rock's right end (a curve, eased in and out: the legs never stop half way)
const runCurve = (who, t0, dur, p0, ctl, p1, n = 16) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, k = u * u * (3 - 2 * u), a = (1 - k) ** 2, b = 2 * k * (1 - k), d = k * k;
    pts.push([r3(u * dur), r3(a * p0[0] + b * ctl[0] + d * p1[0]), r3(a * p0[1] + b * ctl[1] + d * p1[1])]);
  }
  A(t0, who, "run", { pts, dur, rate: [[0, 2.5], [dur * 0.3, 4.2], [dur, 2.5]], stride: 1.7 });
};
runCurve("wiz", 1.32, 1.23, WIZ0, [0.2, -1.55], WIZ_HIDE);
A(1.28, "wiz", "turn", { to: -149, dur: 0.25 }); A(1.95, "wiz", "turn", { to: -116, dur: 0.35 }); A(2.45, "wiz", "turn", { to: -20, dur: 0.4 });
runCurve("vik", 1.52, 1.13, VIK0, [0.45, -1.3], VIK_HIDE);
A(1.48, "vik", "turn", { to: -148, dur: 0.25 }); A(2.1, "vik", "turn", { to: -122, dur: 0.3 }); A(2.55, "vik", "turn", { to: -5, dur: 0.4 });
A(1.17, "wiz", "look", { to: [-0.7, -0.2], dur: 0.12, blink: false });             // eyes first: where to run
A(1.34, "vik", "look", { to: [-0.8, -0.2], dur: 0.12, blink: false });
A(1.96, "wiz", "look", { to: [-0.6, -0.1], dur: 0.12, blink: false });
A(2.0, "vik", "look", { to: [-0.6, -0.1], dur: 0.12, blink: false });
A(6.14, "vik", "look", { to: [-0.3, 0.1], dur: 0.12, blink: false });
c.arm(1.35, "wiz", "L", "rest", 0.25);
// behind the rock: Viking took the front spot; the Wizard glares at him, then waves at Phoenix
A(2.3, "wiz", "look", { to: [0.8, -0.1], dur: 0.12, blink: false });
act.mood(c, 2.3, "wiz", "angry", { hold: 0.3 });
A(2.6, "vik", "look", { to: [0.4, 0.75], dur: 0.15, blink: false });
c.arm(2.65, "wiz", "R", { o: [0.18, 0.85, 0.25] }, 0.15, "out");      // waving with the arm away from Viking
c.arm(2.8, "wiz", "R", { o: [0.28, 0.68, 0.25] }, 0.12); c.arm(2.95, "wiz", "R", { o: [0.18, 0.85, 0.25] }, 0.12); c.arm(3.3, "wiz", "R", "rest", 0.2);
A(2.62, "wiz", "look", { to: [-0.8, -0.2], dur: 0.12, blink: false });
A(2.65, "wiz", "talk", { line: "psst psst!", dur: 0.5, tone: "excited", voice: false });
c.cap(2.65, 3.2, "psst! LOOK UP!", CAP_Y);
A(1.8, "rea", "crouch", { to: 0.25, dur: 0.4 });                                     // Reaper sinks a little lower
// the T-rex lifts its head, eyeing Phoenix
rexPose(1.5, REX, { lean: 2, neckP: -8, headP: 30, neckY: 10, headR: -6, jaw: 0.15, lookX: -0.5, lookY: -0.6, brow: -0.3, squint: 0.15 }, 0.8);
// two steps in (3.0, 3.3): the head comes down behind Phoenix
prop(2.95, "rex", { step: 1, x: (REX.x + REX_NEAR.x) / 2, z: (REX.z + REX_NEAR.z) / 2, rot: -46 }, 0.15, "out");
prop(3.1, "rex", { step: 0 }, 0.08, "in"); sfx(3.18, "dinostomp", { gain: 0.45 });
prop(3.18, "rex", { step: 1, x: REX_NEAR.x, z: REX_NEAR.z, rot: REX_NEAR.rot }, 0.12, "out");
prop(3.3, "rex", { step: 0 }, 0.08, "in"); sfx(3.38, "dinostomp", { gain: 0.4 });
// the ping: Phoenix's tiny smile at the phone
sfx(2.7, "notify", { gain: 0.32 });
A(2.75, "phx", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.2 });   // the tiny smile (half lids, not a grin)
A(2.75, "phx", "face", { lid: 0.6, dur: 0.2 });
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.25 }); A(3.1, "phx", "face", { lid: 0.55, dur: 0.25 });
see(1.6, 3.1, ["phx.face", "wiz.face", "rea.face"], "P2: the friends hiding behind the rock, Phoenix smiling at his phone");

// ---------------------------------------------------------------- 3 SNIFF 3.2-5.0 (P3)
// the head comes down behind him, snout at his crest; three snorts; his breath flattens the crest
const SNIFF_AT = [PHX[0] + 0.55, 1.5, PHX[1] - 0.15];
rex(3.0, REX_NEAR, SNIFF_AT, { pitch: [40, 50, 60], headR: -8, set: { jaw: 0, lookX: -0.3, lookY: -0.8, brow: 0.6 } }, 0.55);
for (const t of [3.85, 4.2, 4.55]) { prop(t, "rex", { sniff: 1 }, 0.1, "out"); prop(t + 0.12, "rex", { sniff: 0 }, 0.15); sfx(t, "snort", { gain: 0.7 }); }
// he pats his crest back into shape with his right glove, then back to the phone
c.arm(4.3, "phx", "R", { o: [0.04, 0.9, 0.1] }, 0.25, "out");             // beside the crest, from his own side
A(4.3, "phx", "release", { prop: "phone", hand: "R", dur: 0 });
for (const t of [4.6, 4.78]) A(t, "phx", "squash", { amount: 0.02, dur: 0.1 });
c.arm(4.9, "phx", "R", PHONE_R, 0.25, "inOut");
A(5.15, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
// the friends: Wizard hides his eyes for a flinch then peeks, Viking gapes
c.arm(3.6, "wiz", "R", { x: [-0.07, 0.62, 0.42] }, 0.2); c.arm(3.6, "wiz", "L", { x: [0.07, 0.62, 0.42] }, 0.2);
c.arm(3.85, "wiz", "R", { x: [-0.2, 0.5, 0.4] }, 0.15); c.arm(3.85, "wiz", "L", { x: [0.2, 0.5, 0.4] }, 0.15);
see(3.6, 4.9, ["phx.face", "rex"], "P3: the T-rex sniffing at Phoenix's crest, Phoenix patting it down");

// ---------------------------------------------------------------- 4 ROAR 5.0-6.3 (P4)
const ROAR_AT = [PHX[0] + (REX_NEAR.x - PHX[0]) * 0.22, 1.7, PHX[1] + (REX_NEAR.z - PHX[1]) * 0.22];
rex(5.0, REX_NEAR, ROAR_AT, { pitch: [20, 30, 40], set: { jaw: 0.25, brow: -1, lookX: -0.4, lookY: -0.3, squint: 0.3 } }, 0.3);
prop(5.25, "rex", { jaw: 1, arms: 1, breath: 1 }, 0.15, "out");
c.at(5.4, { fx: "shake", amp: 0.045, dur: 0.6 });
c.hitStop(5.4, 3);
sfx(5.4, "dinoroar", { gain: 1.0 });
{ // the speed lines start at the open mouth and blow along the snout toward Phoenix
  const P = trexPoints({ ...rexState, scale: 1 }), f = P.forward;
  prop(5.0, "roar", { x: r3(P.snout[0] + f[0] * 0.1), y: r3(P.snout[1] - 0.25), z: r3(P.snout[2] + f[2] * 0.1), rot: r3((Math.atan2(f[0], f[2]) * 180) / Math.PI), tip: r3((Math.asin(-f[1]) * 180) / Math.PI) }, 0.01);
}
prop(5.3, "roar", { puff: 1 }, 0.1); prop(6.35, "roar", { puff: 0 }, 0.25);
prop(5.4, "fire", { wobble: -1 }, 0.15, "out"); prop(6.4, "fire", { wobble: 0 }, 0.5);
// the bag blows up off the ground and tumbles left
prop(5.45, "bag", { x: 0.05, y: 1.4, z: 2.0, spin: 2, tilt: 0 }, 0.6, "out");
prop(6.05, "bag", { x: -1.0, y: 0.0, z: 2.05, spin: 3 }, 0.45, "in");
prop(5.45, "mallows", { x: 0.05, y: 0.0, z: 1.8, spin: 3.5 }, 0.8, "inOut");
// the blast rolls the log out from under him: the wings flick open and he hovers in the same pose
const T_LOG = 6.0;   // the log goes first; he drops a hair, then the wings flick open and catch him
c.at(T_LOG, { fx: "shake", amp: 0.02, dur: 0.25 });
A(T_LOG + 0.06, "phx", "drop", { to: SEAT - 0.04, dur: 0.06 });
A(T_LOG + 0.1, "phx", "span", { to: 0.6, dur: 0.12, ease: "out" });
A(T_LOG + 0.12, "phx", "fly", { to: { y: SEAT + LIFT }, dur: 0.3, ease: "out" });
sfx(T_LOG + 0.1, "wings", { gain: 0.45, dur: END - (T_LOG + 0.1) - 0.05 });
prop(T_LOG, "log", { x: LOG_GONE.x, z: LOG_GONE.z, spin: -1.2 }, 0.55, "out");
sfx(T_LOG + 0.05, "scrape", { gain: 0.5, dur: 0.4, reason: "the log rolls away over the dirt" });
sfx(T_LOG + 0.55, "thud-soft", { gain: 0.5, reason: "the log hits the boulder" });
A(6.55, "phx", "span", { to: 1, dur: 0.3 });
A(6.95, "phx", "span", { to: 0.55, dur: 0.4 });                     // half folded: he hovers on small beats
// friends cower
A(5.35, "wiz", "crouch", { to: 0.4, dur: 0.15 }); A(5.35, "vik", "crouch", { to: 0.4, dur: 0.15 });
c.arm(5.3, "wiz", "R", "rest", 0.2); c.arm(5.3, "wiz", "L", "rest", 0.2);
act.shock(c, 5.35, "wiz", { open: 0.4, hold: 1.0 });
see(5.3, 6.2, ["rex", "phx.face"], "P4: the roar in his face, the crest blown back, he keeps scrolling");
see(6.3, 6.95, ["phx.face", "log"], "P5: the log rolled away, Phoenix hovering on his wings");

// ---------------------------------------------------------------- 5 HOVER 6.3-7.0 (P5) and 6 PEAK 7.0-8.0 (P6)
prop(6.3, "rex", { jaw: 0.1, arms: 0, breath: 0, squint: 0, brow: 0.6, lookX: -0.5, lookY: -0.4 }, 0.35);
// the totem: Viking crouched at the bottom, the Wizard above, Reaper on top
A(6.3, "wiz", "crouch", { to: 0, dur: 0.3 }); A(6.28, "vik", "crouch", { to: 0, dur: 0.45 });
A(6.22, "wiz", "look", { to: [0.2, 0.3], dur: 0.12, blink: false });
A(6.3, "wiz", "move", { to: WIZ_TOTEM, dur: 0.35 }); A(6.28, "vik", "move", { to: VIK_TOTEM, dur: 0.72 });
A(6.4, "rea", "crouch", { to: 0, dur: 0.3 });
for (const w of ["wiz", "vik", "rea"]) A(6.5, w, "look", { to: [-0.85, -0.05], dur: 0.15, blink: false });
// the peak: snout 20 cm from the phone, one eye on him
const PEAK_AT = [PHONE_W[0] + 0.5, PHONE_W[1] + LIFT + 0.02, PHONE_W[2] + 0.4];
rex(6.9, REX_NEAR, PEAK_AT, { pitch: [-5, 0, 5, 10], headY: 0, headR: 12, set: { jaw: 0, lookX: -0.7, lookY: -0.2, brow: 0.8 } }, 0.55);
for (const w of ["wiz", "vik", "rea"]) act.shock(c, 7.0, w, { open: 0.35, hold: 2.6 });
see(7.1, 8.0, ["phx.face", "rex", "wiz.face", "vik.face", "rea.face"], "P6: the T-rex's eye right by the phone, the friends' totem frozen");

// ---------------------------------------------------------------- 7 LOOK-UP 8.0-9.0 (P7, the series ending)
A(8.05, "phx", "look", { to: [0.75, 0.55], dur: 0.12, blink: false });
A(8.05, "phx", "face", { lid: 0.15, dur: 0.12 });
A(8.05, "phx", "pitch", { to: -8, dur: 0.15 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.cap(8.5, 9.0, "huh.", 600);   // in the sky over his head: the lower third is all T-rex snout and Phoenix in this framing
prop(8.0, "rex", { lookX: -0.8, lookY: -0.1 }, 0.2);
see(8.1, 8.95, ["phx.face", "rex"], "P7: Phoenix looks up into the T-rex's eye: huh.");

// ---------------------------------------------------------------- 8 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.55, dur: 0.15 });
A(9.0, "phx", "pitch", { to: 0, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.36 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });                    // the tiny smile, held to the cut
A(9.28, "phx", "squash", { amount: 0.02, dur: 0.25 });
act.scrollPhone(c, "phx", [9.35]);
// the T-rex gives up and lowers its head beside him to watch the screen too
const WATCH_AT = [PHONE_W[0] + 0.52, PHONE_W[1] + LIFT + 0.08, PHONE_W[2] + 0.42];
rex(9.2, REX_NEAR, WATCH_AT, { pitch: [5, 10, 15, 20], headR: 6, set: { lookX: -0.6, lookY: -0.6, squint: 0.55, brow: 0.9, wag: 1 } }, 0.6);
for (const [w, l] of [["wiz", [0.6, 0.0]], ["vik", [0.0, 0.6]], ["rea", [-0.5, -0.3]]]) A(9.4, w, "look", { to: l, dur: 0.15, blink: false });
act.mood(c, 9.45, "wiz", "annoyed", { hold: 0.5 }); act.mood(c, 9.45, "rea", "annoyed", { hold: 0.5 }); act.mood(c, 9.45, "vik", "annoyed", { hold: 0.5 });
see(9.4, 9.95, ["phx.face", "rex", "phone"], "P8: the T-rex watching the phone with him");

// ---------------------------------------------------------------- shots (Jonny's panels; the camera always looks into the valley)
// the painting's camera looks up eye.pitch (env.json, + = down) along -z; every shot keeps near that axis (qa/env.mjs:
// pans 8 deg right / 10 left, tilt 8 deg, fov up to 52, sideways 1.2 m)
const EYE_PITCH = -9.155;
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const WIDE = shot([0.1, 1.5, 7.8], { fov: 46 });                    // the painting's own camera
const MED_SNIFF = shot([-0.05, 1.55, 5.4], { pan: 2, tilt: -3, fov: 42 });   // the head over him from the upper right
const ROARW = shot([0.1, 1.45, 6.2], { tilt: -4, fov: 40 });
const HOVER = shot([-0.3, 1.5, 7.8], { fov: 50 });
const PEAK = shot([-0.25, 2.0, 5.8], { pan: 1, tilt: -8, fov: 44 });          // higher: the friends' totem shows over the rock
const LOOKUP = shot([0.05, 1.8, 5.2], { pan: 2, tilt: -7, fov: 40 });     // Phoenix left, the T-rex eye right (P7)
const BACKDOWN = shot([-0.15, 2.05, 6.2], { pan: 1, tilt: -8, fov: 48 });
const beats = c.beats([
  ["P1 stomp", 0, WIDE, "hook"],
  ["P2 panic", 1.5, "keep"],
  ["P3 sniff", 3.2, MED_SNIFF],
  ["P4 roar", 5.0, ROARW],
  ["P5 hover", 6.3, HOVER],
  ["P6 peak", 7.0, PEAK],
  ["P7 look-up", 8.0, LOOKUP, "payoff"],
  ["P8 back down", 9.0, BACKDOWN, "reaction"],
], END);

write(import.meta.url, {
  id: "never-looks-up-trex",
  title: "The friend who never looks up from his phone… even when a T-rex shows up",
  idea: "Never Looks Up ep 1: a T-rex sniffs, roars and blows the log away; Phoenix never looks up until the series' 'huh.', and the T-rex ends up watching his phone",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 8.5,
  set: { type: "env", env: ENV, shade: "soft", aperture: 0, focus: false },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } },
  music: { style: "bounce", key: 9, lowCut: 150, gain: 0.32 },
  sound: { sfx: 0.7, ambience: 0.35, surface: "dirt", room: "open", flaps: false, signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "vik", "rea", "rex", "phone"], hint: 0, what: "a T-rex pushes out of the ferns behind Phoenix, who only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "log", from: 0, to: T_LOG + 0.1, reason: "Phoenix sits on the log (his legs rest over it) until it rolls away" },
    { who: "phx", with: "rex", from: 6.85, to: END, reason: "the T-rex's snout rests right beside the phone (the peak); its head passes beside Phoenix, never through him (draft strip checked)" },
    { who: "rea", with: "perch", from: 0, to: END, reason: "Reaper stands on the flat rock behind the hiding rock" },
      ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep1-trex.mjs. Panels: PANELS.md. Title added in TikTok's text tool.",
});
