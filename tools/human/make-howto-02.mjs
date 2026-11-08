// "How to…" episode 2: How to jump super high (Jonny, 8 Nov 2026: "lets make this one first. i want to see how it
// looks"). Brief: /mnt/project-files/video-scripts/2026-11-08-how-to/02-jump-super-high-ENGINE-PROMPT.md.
//
// Teo (the "how to" guy) stands on the low end of a home-made seesaw (a scaffold plank on a log) in the painted
// meadow. Step 1 "Squat deep": he strains in a deep squat. Step 2 "Jump": a sad little hop. He looks at his legs,
// offended, then points at Ryn, who stands on a dry-stone wall over the plank's raised end eating an apple. Step 3
// "Use a friend": Ryn tosses the apple, shrugs and hops down onto the raised end. The plank slams down and Teo is
// thrown straight up out of the frame. Cut to a high wide: Teo far above the meadow, arms out ("I'M FLYING!"), then
// falling. Back on the ground he lands on his end, the plank slams the other way and Ryn is thrown up out of frame.
// Teo grins up after him: "Your turn!" (a sky shot of Ryn, deadpan at the top). Ryn drops back onto his own wall as
// Teo sinks into the next squat: the cut to frame 0 reads as round two (reviews A and B, 8 Nov).
//
// The seesaw is a lever: its tilt moves at the slams with constant angular acceleration (gravity on a hinged board),
// both people stand on the plank's surface (cast "floor", engine/page/rigs/vrm.js), and each launch is ballistic
// (g 9.81) from the plank end's speed. All motion is CMU motion capture (credits below).
//   node tools/human/make-howto-02.mjs        -> storyboards/human/howto/howto-02-jump.json
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const LEG = 0.845, FPS = 30, G = 9.81, D2R = Math.PI / 180;
const R = (v, n = 3) => +(+v).toFixed(n);
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const OUT = "storyboards/human/howto", ID = "howto-02-jump";

// ------------------------------------------------------------------------------------------------ the seesaw
// The plank runs from Teo (screen left, near) to Ryn's wall (screen right, a little further back): 25 degrees into the
// depth, so a 9:16 frame holds both people and the sky over them. s = metres along the plank from its middle (+ toward
// the wall). Its underside rests on the log's top; its tilt (the prop's "tilt": + lifts the -s end, Teo's) swings
// between the two ends touching the grass.
const U = new THREE.Vector2(Math.cos(55 * D2R), -Math.sin(55 * D2R));   // along the plank, toward the wall (x, z)
const C = new THREE.Vector2(-0.25, -1.0);                                 // the log under the plank's middle
const PL = { len: 2.4, w: 0.26, t: 0.045 }, LOG_R = 0.11, LOG_TOP = 2 * LOG_R;
const ALPHA = Math.asin(LOG_TOP / (PL.len / 2)) / D2R;                    // the tilt at which an end rests on the grass
const S_TEO = -0.95, S_RYN = 0.95, S_WALL = 1.95;
const at2 = (s) => [R(C.x + U.x * s, 4), R(C.y + U.y * s, 4)];
const YAW = Math.atan2(U.x, U.y) / D2R - 90;                              // the prop's rot: its local +x along U
// the plank's top surface height at s for a tilt (degrees, + lifts Teo's end)
const topAt = (s, tilt) => LOG_TOP + PL.t - s * Math.sin(tilt * D2R);
const WALL = { w: 2.2, h: 1.0, d: 0.5 }, WALL_TOP = 0.97;

// story times
const T = {
  hop: 1.6,          // Teo's little jump take starts (squat before it)
  look: 3.0,         // he looks down at his legs
  point: 3.9,        // he points at Ryn, then at the plank
  rynShrug: 3.6, rynHop: 4.3,
  slam1: 5.4,        // Ryn's feet land on the raised end: the plank swings down (Teo's end up)
  slamDur: 0.07,     // the swing: its end speed at Teo's spot (2 x 0.35 m / 0.07 s) is the throw's v0, so he leaves it without a kink
  v0: 10.0,          // the plank end's throw (m/s up): about 5 m up, 2 s in the air
};
T.launch1 = R(T.slam1 + T.slamDur);
T.air = R((2 * T.v0) / G);
T.land = R(T.launch1 + T.air);           // Teo lands on his end (now up): the plank swings back
// Teo comes down from 5 m: a harder slam throws Ryn higher, aimed (review A) so he drops back onto his own wall at
// rynBack, landing crouch and all: the hard cut to frame 0 (Ryn on the wall) reads as round two
T.rynBack = 9.9;
{ const y0 = 2 * LOG_R + PL.t + S_RYN * Math.sin(ALPHA * D2R), tau0 = T.rynBack - T.land - 0.06;
  T.v0b = R((WALL_TOP - y0 + 0.5 * G * tau0 * tau0) / tau0, 3);
  T.slamDur2 = R((2 * 2 * S_RYN * Math.sin(ALPHA * D2R)) / T.v0b, 4); }   // the swing's end speed at Ryn's spot = his v0
T.launch2 = R(T.land + T.slamDur2);
const END = 10.5;

// the tilt over time: Teo's end down, then Ryn's slam, then Teo's slam; a small wobble when Teo's hop lands
const tiltKeys = [];
{
  const lo = -ALPHA, hi = ALPHA;
  tiltKeys.push([0, lo]);
  // the hop (Teo's feet off the board 1.75-2.2 s, the board settles back with a knock and a small bounce on landing)
  tiltKeys.push([2.2, lo], [2.27, lo + 1.4], [2.36, lo]);
  const swing = (t0, a, b, dur = T.slamDur) => { for (let i = 0; i <= 4; i++) { const p = i / 4; tiltKeys.push([R(t0 + p * dur, 4), R(a + (b - a) * p * p, 3)]); } };
  swing(T.slam1, lo, hi);
  swing(T.land, hi, lo, T.slamDur2);
}
const tiltAt = (t) => { let k = 0; while (k + 1 < tiltKeys.length && tiltKeys[k + 1][0] <= t) k++; const a = tiltKeys[k], b = tiltKeys[k + 1]; if (!b || t <= a[0]) return a[1]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); };

// ------------------------------------------------------------------------------------------------ the people
// a segment placed so its pelvis stands over (x, z) at the take's frame `ref` (default its first), facing `heading`
function seg(at, clip, from, to, speed, place, heading, extra = {}) {
  load(clip);
  const base = { at: R(at, 4), clip, from, to, speed: R(speed, 4), heading: R(heading, 2), ...extra };
  const probe = new Performance([{ ...base, at: 0, place: [0, 0] }], clips, [], LEG);
  const p = probe.at(((extra.ref ?? from) - from) / speed).pos;
  delete base.ref;
  return { ...base, place: [R(place[0] - p.x, 4), R(place[1] - p.z, 4)] };
}
const teoAt = at2(S_TEO), rynLand = at2(S_RYN), rynWall = at2(S_WALL);
const toRyn = Math.atan2(rynWall[0] - teoAt[0], rynWall[1] - teoAt[1]) / D2R;   // ~ 114 degrees: right and away
const teoFace = 62, rynFace = -35;                                                // 3/4 to camera, toward each other

// Teo: squat (high jump take's crouch, slowed), the little hop (16_01, hips 0.7 x), looking at his legs (standing,
// slowed), the point (14_25: an arm up toward Ryn, then down at the board), thrown up (16_03 push-off into its
// flight, slowed while the board's throw carries him), the landing (16_03), standing and looking up
const air1 = R(T.land - 0.05 - (T.launch1 - 0.13));
const teo = [
  seg(0, "c16_03", 1.18, 1.32, R(0.14 / T.hop, 4), teoAt, teoFace, { blend: 0 }),   // sinking through the bottom of the squat (review A: frame 0 is the effort; slow, never still)
  seg(T.hop, "c16_01", 0.85, 2.25, 1, teoAt, teoFace, { blend: 0.2, jumpGain: 0.7 }),
  seg(T.look, "c16_01", 2.0, 2.6, 0.66, teoAt, 50, { blend: 0.25 }),
  seg(T.point, "c13_14", 0.35, 0.88, 0.38, teoAt, 100, { blend: 0.25, ref: 0.6 }),   // 13_14: the right arm reaches straight out at Ryn and holds (14_25 kept a hand at his face)
  seg(T.launch1 - 0.2, "c16_03", 1.35, 1.55, 1, teoAt, teoFace, { blend: 0.2, ref: 1.55 }),
  seg(T.launch1, "c16_03", 1.55, 2.06, R(0.51 / air1, 4), teoAt, teoFace, { blend: 0.06, ref: 1.55 }),
  seg(T.land - 0.05, "c16_03", 2.06, 2.75, 1, teoAt, teoFace, { blend: 0.06, ref: 2.06 }),
  seg(T.land + 0.64, "c16_03", 2.75, 3.4, 0.5, teoAt, 40, { blend: 0.3 }),
  seg(T.land + 1.9, "c111_28", 2.0, 2.5, 1, teoAt, teoFace, { blend: 0.45 }),   // turning back toward the wall, as at frame 0
  seg(10.0, "c16_03", 1.0, 1.18, 0.36, teoAt, teoFace, { blend: 0.3 }),   // review B: round two's squat already under way at the loop seam
];
// Ryn: eating on the wall (79_15, both hands to the mouth; the apple in his right), a shrug (141_21), the hop down
// (16_05 forward jump: crouch 0.5-0.95, flight 1.05-1.6, landing), standing on the board looking up (111_28), thrown
// up (16_03 push-off and flight)
const HOP = { from: 0.53, land: 1.62 };
const rynHopAt = R(T.slam1 - (HOP.land - HOP.from));
const ryn = [
  seg(0, "c79_15", 0.6, 4.2, 1, rynWall, rynFace, { blend: 0 }),
  seg(T.rynShrug, "c141_21", 0.5, 1.2, 1, rynWall, rynFace, { blend: 0.25 }),
  seg(rynHopAt, "c16_05", HOP.from, 2.3, 1, rynLand, rynFace, { blend: 0.15, ref: HOP.land }),
  seg(R(rynHopAt + 2.3 - HOP.from), "c111_28", 2.0, 4.2, 1, rynLand, rynFace, { blend: 0.3 }),
  seg(T.launch2 - 0.13, "c16_03", 1.42, 1.55, 1, rynLand, rynFace, { blend: 0.1, ref: 1.55 }),
  seg(T.launch2, "c16_03", 1.55, 2.0, R(0.45 / (T.rynBack - 0.05 - T.launch2), 4), rynLand, rynFace, { blend: 0.06, ref: 1.55, slide: [1.55, 1.9, R(rynWall[0] - rynLand[0], 3), R(rynWall[1] - rynLand[1], 3)] }),
  seg(T.rynBack - 0.05, "c16_03", 2.06, 2.75, 1, rynWall, rynFace, { blend: 0.06, ref: 2.06 }),
];
const rynTakeoff = R(rynHopAt + (1.05 - HOP.from));

// the floor under each of them (cast "floor"): the board's surface where they stand, the wall top, and the throws
const floorKeys = (fn, t0 = 0, t1 = END) => { const k = []; for (let t = t0; t <= t1 + 1e-6; t += 1 / FPS) k.push([R(t, 4), R(fn(t), 4)]); return k; };
const fly = (t, t0, y0, v0 = T.v0) => { const tau = t - t0; return y0 + v0 * tau - 0.5 * G * tau * tau; };
const teoFloor = (t) => {
  if (t >= T.launch1 && t < T.land) return fly(t, T.launch1, topAt(S_TEO, tiltAt(T.launch1)));
  return topAt(S_TEO, tiltAt(t));
};
const rynFloor = (t) => {
  if (t < rynTakeoff) return WALL_TOP;
  if (t < T.slam1) { const p = (t - rynTakeoff) / (T.slam1 - rynTakeoff); return WALL_TOP + (topAt(S_RYN, tiltAt(T.slam1)) - WALL_TOP) * p; }
  if (t >= T.rynBack) return WALL_TOP;
  if (t >= T.launch2) return Math.max(fly(t, T.launch2, topAt(S_RYN, tiltAt(T.launch2)), T.v0b), t > T.launch2 + 0.3 ? WALL_TOP : 0);
  return topAt(S_RYN, tiltAt(t));
};
const perf = { teo: new Performance(teo, clips, [], LEG), ryn: new Performance(ryn, clips, [], LEG) };
const poseAt = (who, t) => worldPose(perf[who].at(Math.min(t, END - 1e-4)));
const lift = (who, t) => (who === "teo" ? teoFloor(t) : rynFloor(t));
const headAt = (who, t) => { const h = poseAt(who, t).head.end.clone(); h.y += lift(who, t); return h; };

// ------------------------------------------------------------------------------------------------ cameras
// The meadow painting allows the camera about +-0.9 m sideways, 2 m back, 4 m up, a pan of 10 deg left / 4 right and
// a tilt of 8 deg (node qa/env.mjs --range meadow-path), widest fov 52.
const mid = [R((teoAt[0] + rynWall[0]) / 2), R((teoAt[1] + rynWall[1]) / 2)];
const WIDE = { pos: [-0.2, 1.25, 4.8], look: [-0.2, 1.8, -1.2], fov: 48 };   // straight into the painting (its frame is barely wider than ours): the plank runs into depth, Ryn left of the big tree
const TEO_MED = { pos: [-0.35, 1.4, 3.3], look: [R(teoAt[0] + 0.12), 1.5, R(teoAt[1])], fov: 42 };   // head to feet, the head under the step card
const TWO = { pos: [0.15, 1.4, 4.6], look: [-0.09, 1.5, -0.5], fov: 44 };   // review A: both of them for the point, the toss, the hop and the launch
const PAY = { pos: [-0.2, 1.0, 4.0], look: [-0.45, 1.2, -1.2], fov: 42 };   // low and tighter: Ryn's look up as Teo drops in
const RYN_SKY = { pos: [0.3, 7.0, 4.8], look: [0.5, 8.4, -1.8], fov: 30 };   // review B: Ryn at the top of his flight, deadpan again
const HIGH = { pos: [-0.5, 5.4, 4.8], look: [R(teoAt[0] - 0.35), 6.6, R(teoAt[1])], fov: 32 };   // Teo at the top of his flight against the sky, right of centre (his line in the sky left of him)
const beats = [
  { name: "squat", kind: "hook", at: 0, len: 2.95, shot: WIDE, do: [] },
  { name: "legs", kind: "reaction", at: 2.95, len: 0.95, shot: TEO_MED, do: [] },
  { name: "launch", kind: "turn", at: 3.9, len: 2.25, shot: TWO, do: [] },
  { name: "apex", kind: "reveal", at: 6.15, len: 0.75, shot: HIGH, do: [] },
  { name: "payoff", kind: "payoff", at: 6.9, len: 1.65, shot: PAY, do: [] },
  { name: "rynsky", kind: "reaction", at: 8.55, len: 0.55, shot: RYN_SKY, do: [] },
  { name: "again", kind: "reaction", at: 9.1, len: R(END - 9.1), shot: WIDE, do: [] },
].map((b) => ({ ...b, shot: { pos: b.shot.pos.map((v) => R(v)), look: b.shot.look.map((v) => R(v)), fov: b.shot.fov } }));
const beatAt = (t) => beats.find((b) => t >= b.at - 1e-6 && t < b.at + b.len - 1e-6) ?? beats[beats.length - 1];
const put = (t, item) => { const b = beatAt(t); b.do.push({ ...item, at: R(Math.max(0, t - b.at)) }); };

// ------------------------------------------------------------------------------------------------ props
const props = [
  { id: "log", kind: "firelog", x: C.x, y: 0, z: C.y, rot: R(YAW + 90, 2), len: 0.7, r: LOG_R },
  { id: "plank", kind: "seesawplank", x: C.x, y: LOG_TOP, z: C.y, rot: R(YAW, 2), tilt: R(tiltKeys[0][1], 3), len: PL.len, w: PL.w, t: PL.t },
  { id: "wall", kind: "drystone", x: rynWall[0], y: 0, z: rynWall[1], rot: R(YAW + 90, 2), w: WALL.w, h: WALL.h, d: WALL.d },
  { id: "apple", kind: "apple", x: rynWall[0], y: 1.9, z: rynWall[1], rot: 0, scale: 1.0 },
];
// the board's tilt, key by key (linear between: the slam keys follow a constant angular acceleration)
for (let i = 1; i < tiltKeys.length; i++) {
  const [t, v] = tiltKeys[i], t0 = tiltKeys[i - 1][0];
  put(t0, { do: "prop", id: "plank", dur: R(t - t0, 4), ease: "linear", set: { tilt: R(v, 3) } });
}
// the apple: in Ryn's right hand from frame 0; tossed over his shoulder into the grass behind the wall as he shrugs
put(0, { who: "ryn", do: "grab", prop: "apple", hand: "R", dur: 0 });
const behind = at2(S_WALL + 1.6);
put(3.95, { who: "ryn", do: "release", prop: "apple", to: [R(behind[0] + 0.4), 0.05, R(behind[1] - 0.5)], dur: 0.5 });

// ------------------------------------------------------------------------------------------------ acting
const STRAIN = { angry: 1, ih: 0.55 }, EFFORT = { angry: 0.7, aa: 0.5 }, HUFF = { angry: 0.55, surprised: 0.45 },
  PLEAD = { sad: 0.55, happy: 0.35 }, SHOCK = { surprised: 1, aa: 0.75 }, JOY = { happy: 1, aa: 0.6 }, DROP = { surprised: 0.8, aa: 0.45 },
  GRIN = { happy: 0.9 }, FLAT = { relaxed: 0.2 }, SMIRK = { happy: 0.25, angry: 0.15 }, BLINKY = { surprised: 0.35 }, OFFENDED = { sad: 0.5, angry: 0.6 }, UHOH = { surprised: 0.8, aa: 0.4 };
const faces = {
  teo: [[0, STRAIN], [1.65, EFFORT], [2.45, HUFF], [2.95, OFFENDED], [3.95, PLEAD], [T.slam1, SHOCK], [6.15, JOY], [6.85, DROP], [T.land + 0.25, GRIN]],
  ryn: [[0, FLAT], [2.3, SMIRK], [3.2, FLAT], [7.05, UHOH], [8.75, FLAT]],   // deadpan again by the top of his flight
};
// eyes: Teo straight out in the squat, down at his knees after the hop, on Ryn while he points, up after Ryn at the
// end; Ryn on Teo the whole time, up where Teo went after the throw
const knees = (() => { const W = poseAt("teo", 2.8); const k = W.lfemur ? W.lfemur.end.clone() : W.root.start.clone(); return [R(k.x + 0.05), R(0.45 + teoFloor(2.8)), R(k.z + 0.1)]; })();
const sky = (who) => { const p = who === "teo" ? teoAt : rynLand; return [R(p[0] + 0.3), 9, R(p[1] + 0.2)]; };
const teoHead = (t) => headAt("teo", t).toArray().map((v) => R(v));
const gaze = {
  teo: [
    { from: 2.35, to: 3.75, ramp: 0.15, at: knees },   // (lower and closer: the head really drops)
    { from: 3.85, to: 5.45, ramp: 0.2, at: headAt("ryn", 4.4).toArray().map((v) => R(v)) },
    { from: T.land + 0.45, to: T.rynBack - 0.5, ramp: 0.3, at: sky("ryn") },
    { from: T.rynBack - 0.45, to: END + 1, ramp: 0.3, at: [R(rynWall[0]), 1.9, R(rynWall[1])] },   // following him down onto the wall
  ],
  ryn: [
    { from: 0, to: 2.0, ramp: 0.2, at: teoHead(1.0) },
    { from: 2.0, to: 3.6, ramp: 0.2, at: teoHead(2.7) },
    { from: 3.6, to: T.slam1, ramp: 0.2, at: teoHead(4.4) },
    { from: T.launch1 + 0.25, to: T.launch2 - 0.2, ramp: 0.35, at: sky("teo") },
  ],
};
// hands: Teo's fists clench in the squat, open in the flight; Ryn's right hand round the apple until the toss
const fingers = {
  teo: [[0, 0.9, 0.9], [1.7, 0.5, 0.5], [3.9, 0.4, 0.12], [T.launch1, 0.15, 0.15], [T.land, 0.45, 0.45]],
  ryn: [[0, 0.45, 0.7], [3.9, 0.45, 0.7], [4.0, 0.3, 0.2], [T.slam1, 0.45, 0.45], [7.5, 0.15, 0.15], [T.rynBack, 0.45, 0.45]],
};

// ------------------------------------------------------------------------------------------------ sound + voice
const sfx = (t, n, gain, reason, extra = {}) => put(t, { sfx: n, gain, reason, ...extra });
sfx(0.05, "ai/crunch", 0.55, "Ryn bites his apple on the wall");
sfx(1.78, "whoosh", 0.35, "Teo's little jump", { dur: 0.25 });
sfx(2.2, "land", 0.4, "Teo's feet land back on the board");
put(2.2, { fx: "poof", pos: [teoAt[0], R(topAt(S_TEO, -ALPHA) + 0.01, 3), R(teoAt[1] + 0.12)], dur: 0.35, color: "#d8c8ae", puffs: 3, sparks: 0, size: 0.15, lift: 0.03, sound: false });   // review B: the sad hop has a visible end
sfx(2.24, "plank-rattle", 0.3, "the board knocks and rattles on the log under him");
sfx(3.97, "whoosh", 0.3, "the apple flies over Ryn's shoulder", { dur: 0.3 });
sfx(4.47, "step-grass", 0.4, "the apple drops in the grass behind the wall");
sfx(T.slam1, "hit-wood", 1.0, "Ryn lands on the raised end: the board slams down");
sfx(T.slam1 + 0.01, "kenney/impact-plank-medium", 0.8, "the slam's hollow board thud on a phone speaker");
sfx(T.launch1, "rocket", 0.85, "Teo shoots straight up into the sky");
sfx(T.land, "hit-wood", 1.0, "Teo lands on his end: the board slams the other way");
sfx(T.land + 0.01, "land", 0.8, "Teo's feet hit the board");
sfx(T.land + 0.02, "slap", 0.7, "the board end smacks flat on the log side: a woody crack that carries on a phone speaker");
sfx(T.launch2, "rocket", 0.8, "Ryn shoots up out of frame");
const hitStop = [{ at: R(Math.round(T.slam1 * FPS) / FPS, 4), frames: 3 }, { at: R(Math.ceil(T.land * FPS) / FPS, 4), frames: 3 }];
put(T.slam1, { fx: "shake", dur: 0.25, amp: 0.025 });
put(T.land, { fx: "shake", dur: 0.25, amp: 0.025 });
// dust where each plank end hits the grass, and off the wall top when Ryn lands back on it
const endAt = (s) => at2(s);
put(T.launch1, { fx: "poof", pos: [endAt(1.15)[0], 0.02, R(endAt(1.15)[1] + 0.1)], dur: 0.5, color: "#e9d8c0", puffs: 9, sparks: 0, size: 0.45, lift: 0.06, sound: false });
put(T.launch2, { fx: "poof", pos: [endAt(-1.15)[0], 0.02, R(endAt(-1.15)[1] + 0.1)], dur: 0.5, color: "#e9d8c0", puffs: 9, sparks: 0, size: 0.45, lift: 0.06, sound: false });
put(T.rynBack, { fx: "poof", pos: [rynWall[0], WALL_TOP + 0.02, R(rynWall[1] + 0.1)], dur: 0.45, color: "#d9d2c4", puffs: 7, sparks: 0, size: 0.35, lift: 0.05, sound: false });
sfx(T.rynBack, "land", 0.75, "Ryn drops back onto his wall");
// lines (Teo; Ryn never speaks): every line has its subtitle low in the frame, under the step cards
// each line's caption sits in clear sky or grass beside the people in its shot (pos = top of the box, x = its centre, px)
const say = (t, line, tone, style, take, pos, x) => put(t, { macro: "say", who: "teo", line, tone, ...(style ? { style } : {}), ...(take ? { take } : {}), pos, x });
say(0.05, "Hnnngh!", "angry", null, null, 720, 330);                                                  // left, over Teo, under the card
say(4.0, "Jump on it!", "excited", "pleading, hopeful, pointing at the board", null, 690, 330);       // over Teo's head in the two-shot, clear of the plank end and Ryn
say(6.15, "I'M FLYING!", "excited", "overjoyed, shouting from high up in the sky", 2, 900, 330);     // the sky left of him
say(8.58, "Your turn!", "excited", "laughing, delighted, looking up", null, 1180, 540);              // under Ryn in the sky shot (Teo calls it from below)
for (const w of ["teo", "ryn"]) beats[0].do.push({ who: w, do: "noblink", at: 0 });

// the step cards: the tutorial's own labels, top of the safe zone (y 470+), clear of Jonny's title (y 0-384)
const card = (from, to, badge, text) => ({ from, to, text, badge, style: "step", pos: 470, kinetic: false, pop: true });
const captions = [card(0.1, 1.65, "STEP 1", "Squat deep"), card(1.7, 3.85, "STEP 2", "Jump"), card(4.25, 5.3, "STEP 3", "Use a friend")];

const cast = (id, look, list, floor, seed) => ({
  id, character: look, at: list[0].place, face: FLAT, faces: faces[id], seed, perform: list, fingers: fingers[id], gaze: gaze[id],
  floor: floorKeys(floor), noBlink: id === "teo" ? [[0, 0.6], [2.95, 3.9]] : [[0, 0.6]],
});
const sb = {
  id: ID,
  title: "How to jump super high",
  idea: "Teo follows a jump tutorial on a home-made seesaw: a deep squat, a sad little hop, then his friend Ryn drops onto the other end and throws him into the sky; when he lands, Ryn goes up",
  fps: FPS, look: "anime-pro", profile: "short", loop: true,
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  motionBlur: false,
  set: { type: "env", env: "meadow-path", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, life: "auto" },
  music: { style: "bounce", lead: "bell", gain: 0.32, lowCut: 150 },
  sound: { sfx: 0.65, ambience: 0.3, surface: "grass", room: "open", guard: true, speech: true },
  creative: { notes: false },
  hook: { show: ["teo", "ryn", "plank"], hint: 1.7, what: "his jump is 15 cm" },
  cast: [cast("teo", "human/teo", teo, teoFloor, 1.3), cast("ryn", "human/ryn", ryn, rynFloor, 2.1)],
  props,
  beats,
  hitStop,
  visible: [
    { from: 0.1, to: 2.9, see: ["teo", "ryn", "plank"], why: "the squat and the hop on the board, Ryn watching from the wall" },
    { from: 3.0, to: 3.85, see: ["teo.face"], why: "Teo offended at his own legs" },
    { from: 3.95, to: 4.6, see: ["teo", "ryn"], why: "Teo points, Ryn tosses the apple" },
    { from: 7.0, to: 7.45, see: ["ryn.face"], why: "Ryn looks up as Teo drops in" },
    { from: 8.6, to: 9.05, see: ["ryn.face"], why: "Ryn deadpan at the top of his flight" },
    { from: 9.95, to: 10.4, see: ["ryn", "teo"], why: "Ryn back on his wall: round two" },
    { from: 4.75, to: 5.4, see: ["ryn", "plank"], why: "Ryn's hop onto the raised end" },
    { from: 6.2, to: 6.85, see: ["teo"], why: "Teo high over the meadow" },
    { from: 9.15, to: 9.9, see: ["teo"], why: "Teo grinning up after Ryn" },
  ],
  allowClip: [
    { who: ["teo"], from: R(T.launch1 + 0.15), to: R(T.land - 0.25), checks: ["out-of-frame"], reason: "thrown out of the top of the frame on purpose" },
    { who: ["ryn"], from: R(T.launch2 + 0.15), to: R(T.rynBack - 0.2), checks: ["out-of-frame"], reason: "thrown out of the top of the frame on purpose, drops back onto the wall" },
  ],
  captions, captionStyle: "kinetic",
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217): 16_01, 16_03, 16_05, 13_14, 79_15, 141_21, 111_28.",
  notes: "Generated by tools/human/make-howto-02.mjs.",
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/${ID}.json`, JSON.stringify(sb, null, 1));
console.log("END", END, "alpha", R(ALPHA, 2), "launch1", T.launch1, "land", T.land, "launch2", T.launch2, "ryn hop", rynHopAt, "takeoff", rynTakeoff, "apex", R(topAt(S_TEO, ALPHA) + T.v0 * T.v0 / (2 * G), 2));
console.log("teo", teoAt, "ryn wall", rynWall, "land", rynLand, "toRyn", R(toRyn, 1), "yaw", R(YAW, 1));
