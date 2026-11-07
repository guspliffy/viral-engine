// The human movement reel, redo (Jonny, 6 Nov 2026 18:44: "the whole character feels off ... so many glitches ...
// use the lessons we learned"). v1 was one long take along the low-poly park; v2 is seven quick shots in the painted
// meadow (set "env", Ghibli background), the VRoid-based anime person (rig "vrm-v1"), each move its own placement and
// camera so the subject owns the frame. Every place (the box under the hands, the chair under the seat, the camera on
// the move) is worked out from the same performance the page plays (engine/page/rigs/human-perform.js).
//   node tools/human/make-reel-v3.mjs        -> storyboards/human/human-reel-v3.json
// v3 (Jonny 6 Nov 20:53, motion brief): same seven moves in the same order, about 12.7 s, on the reworked rig (feet held
// where they land, stance width, per-take floor, palms on straight arms, hands resting on the thighs, gaze, breathing).
// The run is a jog with real flight (CMU 16_35) blended into the take's own stop (16_08); the jump is a real high jump
// (16_03: crouch, push, flight, landing) instead of v2's hips multiplied up 2.2x (21 m/s2 "gravity"); the apple is
// gripped where it lies (keep) after the fingers close; the eyes find the apple first and the camera once seated.
import fs from "node:fs";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const LEG = 0.845;   // the VRoid base's thigh + shin (measured in the page, 6 Nov)
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const R = (v, n = 3) => +(+v).toFixed(n);

// the shots: a take (clip, seconds), which way it faces (heading, 0 = the camera) or travels (travel: its net path
// points that way), where its middle stands (mid: x, z of the pelvis path's middle), the camera (offset from that
// middle, or follow: the camera trucks with the pelvis), and the label
const SHOTS = [
  { name: "flip", clip: "c90_14", from: 3.85, to: 5.45, travel: 28, mid: [-0.1, -1.7], cam: { at: [0.2, 1.05, 3.9], lookY: 1.0, fov: 40, follow: 0.6 }, label: "front handspring" },
  { name: "walk", clip: "c07_01", from: 0.6, to: 2.2, travel: 30, mid: [0.0, -0.9], cam: { at: [0.4, 1.05, 3.6], lookY: 0.95, fov: 36, follow: 0.6 }, label: "walk" },
  { name: "run", clip: "c16_35", from: 0.0, to: 0.85, then: { clip: "c16_08", from: 0.55, to: 1.5, blend: 0.2 }, travel: -20, endAt: [-0.35, -0.3], cam: { at: [0.15, 1.0, 4.4], lookY: 0.95, fov: 36, follow: 0.4 }, label: "run" },
  { name: "jump", clip: "c16_03", from: 0.85, to: 2.65, heading: 25, mid: [0, -0.3], cam: { at: [0.3, 1.0, 3.3], lookY: 1.05, fov: 44 }, label: "jump" },
  { name: "punch", clip: "c14_01", from: 2.0, to: 3.45, heading: 30, mid: [0, 0.2], cam: { at: [0.25, 1.2, 3.3], lookY: 1.1, fov: 38 }, label: "punch" },
  { name: "grab", clip: "c69_70", from: 2.2, to: 4.0, refTo: 4.5, travel: 62, mid: [0.05, -0.4], cam: { at: [0, 0.98, 3.5], lookY: 0.85, fov: 38, follow: 0.5 }, label: "grab" },
  { name: "sit", clip: "c113_15", from: 0.9, to: 4.3, heading: 0, mid: [0, -0.7], cam: { at: [0.3, 1.02, 3.3], lookY: 0.85, fov: 36 }, label: "sit" },
];

// a shot's takes (one, or a take blended into the next: "then") as perform segments from shot time 0
const segsOf = (sh, heading, place) => [{ at: 0, clip: sh.clip, from: sh.from, to: sh.to, place, heading, blend: 0 }, ...(sh.then ? [{ at: R(sh.to - sh.from - sh.then.blend), clip: sh.then.clip, from: sh.then.from, to: sh.then.to, blend: sh.then.blend }] : [])];
const lenOf = (sh) => R(sh.to - sh.from + (sh.then ? sh.then.to - sh.then.from - sh.then.blend : 0));
const one = (sh, heading, place) => new Performance(segsOf(sh, heading, place), clips, [], LEG);
const list = [];
let t = 0;
for (const sh of SHOTS) {
  load(sh.clip); if (sh.then) load(sh.then.clip);
  const len = lenOf(sh);
  let heading = sh.heading;
  if (sh.travel != null) { const P = one(sh, 0, [0, 0]), a0 = P.at(0).pos, e = P.at(len - 1e-4).pos; heading = R(sh.travel - Math.atan2(e.x - a0.x, e.z - a0.z) * 180 / Math.PI, 2); }
  // place it so the pelvis path's middle (or its end, endAt) stands where the shot wants it
  const P0 = one(sh, heading, [0, 0]), a = P0.at(0).pos, b = sh.refTo ? P0.segRoot(P0.L[0], sh.refTo) : P0.at(len - 1e-4).pos;   // (refTo: placed as the longer take was, where the palms were measured)
  const ref = sh.endAt ? b : { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, want = sh.endAt || sh.mid;
  const segs = segsOf(sh, heading, [R(want[0] - ref.x, 4), R(want[1] - ref.z, 4)]).map((g) => ({ ...g, at: R(g.at + t) }));
  list.push(...segs); sh.seg = segs[0]; sh.t0 = t; sh.t1 = t + len;
  t = sh.t1;
}
const END = R(t);
const perf = new Performance(list, clips, [], LEG);

// the performance sampled at 30 fps (pelvis, palms, head, feet), each sample tagged with its shot
const S = [];
for (let i = 0; i <= Math.round(END * 30); i++) {
  const s = i / 30, W = worldPose(perf.at(Math.min(s, END - 1e-4)));
  S.push({ t: s, pelvis: W.root.start.clone(), L: palmWorld(W, "l"), R: palmWorld(W, "r"), head: W.head.end.clone(), foot: Math.min(W.lfoot.end.y, W.rfoot.end.y) });
}
const at = (s) => S[Math.max(0, Math.min(S.length - 1, Math.round(s * 30)))];
const shot = (n) => SHOTS.find((s) => s.name === n);
const mean = (sh, f) => { const k = S.filter((q) => q.t >= sh.t0 && q.t <= sh.t1); return k.reduce((a, q) => a + f(q), 0) / k.length; };

// the cameras: one shot per move; a "follow" shot trucks with the pelvis (by that share of its travel), so a move
// that crosses the frame stays in it; the painted meadow allows about +-0.9 m sideways round x 0 (qa/env.mjs)
const beats = [];
for (const sh of SHOTS) {
  const c = sh.cam, mx = mean(sh, (q) => q.pelvis.x), mz = mean(sh, (q) => q.pelvis.z);
  const pos = c.at ? [...c.at] : [mx, c.y, mz + c.dist];
  const p0 = at(sh.t0 + 0.05).pelvis, p1 = at(sh.t1 - 0.05).pelvis, f = c.follow || 0;
  const lookA = [R(mx + (p0.x - mx) * f), c.lookY, R(mz + (p0.z - mz) * f)], lookB = [R(mx + (p1.x - mx) * f), c.lookY, R(mz + (p1.z - mz) * f)];
  const truck = 0;
  const beat = { name: sh.name, at: R(sh.t0), len: R(sh.t1 - sh.t0), shot: { pos: [R(pos[0] + (lookA[0] - mx) * truck), pos[1], pos[2]], look: lookA, fov: c.fov }, do: [] };
  if (f) beat.shot.to = { pos: [R(pos[0] + (lookB[0] - mx) * truck), pos[1], pos[2]], look: lookB }, beat.shot.dur = beat.len, beat.shot.ease = "inOut";
  beats.push(beat);
}

// the pick-up: the take's actor reaches down with the right hand to about 36 cm off the floor (he picked something
// off a low table), so an apple sits on a crate there. Measured in the page (cast "diagPalms": the rendered body's
// palm, not this script's skeleton): right palm lowest at x 0.352, y 0.365, z -0.504 from 9.9 to 10.17 s; the knees
// and shins stay above and beside the crate (lowest knee 0.42 m, feet at x 0.03-0.10). (v5 review: the take turned
// 28 degrees toward the camera so the reaching hand shows; the palm then closes at about x 0.36, y 0.21, z -0.31, the
// crate stands under it, knees above 0.36 m and feet at x 0.03-0.12 stay clear of it)
const T = (n, u) => R(shot(n).t0 + (u - shot(n).from));
const gb = shot("grab");
// the palm where the hand closes, measured in the page on this rig (cast diagPalms; written by a --layout pass)
const MEAS = fs.existsSync("storyboards/human/human-reel-v3.palm.json") ? JSON.parse(fs.readFileSync("storyboards/human/human-reel-v3.palm.json", "utf8")) : null;
const grab = MEAS ? { t: MEAS.t, at: MEAS.at } : { t: R(gb.t0 + (3.15 - gb.from)), at: [0.352, 0.365, -0.504] };
const APPLE_R = 0.07 * 0.6, crateH = R(grab.at[1] - 0.045 - APPLE_R);
// (a beat's "do" times count from the beat's start) each prop is only there in its own shot (scale 0.001 is the
// engine's "not there"): v1's chair and box stood in front of every other move
const gbeat = beats.find((b) => b.name === "grab"), sbeat = beats.find((b) => b.name === "sit");
// keep: the apple is held exactly where it lies when the closed hand takes it (v2 glided it into the palm over 0.12 s)
gbeat.do.push({ who: "h", do: "grab", prop: "apple", hand: "R", at: R(grab.t - gb.t0), dur: 0, keep: true, pose: null });
for (const id of ["crate", "apple"]) gbeat.do.push({ do: "prop", id, at: 0, dur: 0, set: { scale: id === "apple" ? 0.6 : 1 } }, { do: "prop", id, at: gbeat.len, dur: 0, set: { scale: 0.001 } });
// the chair under the seated pelvis (the take sits at about clip 2.6-4.3 s)
const st = shot("sit"), seat = at(st.t0 + (3.2 - st.from)).pelvis, back = at(st.t0 + 0.05).pelvis;
// the chair faces the way the seated person faces (here the camera, +z); its seat centre a little behind the pelvis
const chair = { id: "chair", kind: "chair", x: R(seat.x), y: 0, z: R(seat.z - 0.06), rot: 0 };
sbeat.do.push({ do: "prop", id: "chair", at: 0, dur: 0, set: { scale: 1 } });

// the hands: relaxed, flat on the ground in the handspring, fists in the punches, round the box, relaxed on the chair
const fingers = [
  [0, 0.15, 0.15], [T("walk", 0.2), 0.55, 0.55],   // (v5 review: a fuller curl, open hands read as mittens at phone size)
  [T("punch", 2.0), 0.95, 0.95], [T("grab", 2.2), 0.4, 0.4],
  // the hand opens on the way down and closes round the apple before the lift starts
  [R(grab.t - 0.4), 0.4, 0.4], [R(grab.t - 0.2), 0.4, 0.12], [R(grab.t), 0.4, 0.72],
  [T("sit", 0.9), 0.4, 0.4], [T("sit", 2.6), 0.3, 0.3],
];
// the boxing guard: the take's fists sit by the actor's face, which on the bigger anime head is inside it, so the
// arms turn out and the elbows open a little (tried on the stills: fists in front of the chin)
// (v5: the seated head lift went: the character's posture "level" keeps the face near level by itself)
const poses = [{ from: T("punch", 2.0), to: T("punch", 3.45), ramp: 0.01, bones: { leftUpperArm: [0, 0.35, 0], rightUpperArm: [0, -0.35, 0], leftLowerArm: [0, 0.3, 0], rightLowerArm: [0, -0.3, 0] } }];
// seated: both hands come to rest on the thighs once the weight is on the chair
// (v5 review: not a mirror image: the right hand lands 0.25 s later and nearer the hip, so that elbow bends more)
const rest = [{ hand: "L", from: T("sit", 2.75), to: END + 1, ramp: 0.45, u: 0.62 }, { hand: "R", from: T("sit", 3.0), to: END + 1, ramp: 0.45, u: 0.48 }];
// the seat: the hips settle onto the chair (seat top 0.42 + 0.115 from the hips joint down to the sitting bones on
// this body), eased in while the take lowers itself (clip 2.1 to 2.6)
const seatY = 0.42 + 0.115, seat2 = [{ from: T("sit", 2.1), to: END + 1, ramp: 0.5, y: seatY }];
// the eyes: on the apple before the hand goes for it, on the camera once seated
const sitCam = beats.find((b) => b.name === "sit").shot.pos;
const gaze = [
  { from: R(grab.t - 0.9), to: R(grab.t + 0.25), ramp: 0.12, at: grab.at },
  { from: T("sit", 3.0), to: END + 1, ramp: 0.25, at: sitCam },
];

// captions: a hook on frame 0, then a small label per move, low over the ground (clear of the title Jonny adds on top)
const captions = [{ from: 0, to: 1.6, text: "new anime guy: first move test", pos: 1560, size: 66, pop: false, kinetic: false }];
for (const sh of SHOTS) captions.push({ from: R(sh.t0), to: R(sh.t1), text: sh.label, pos: 1730, pop: false, size: 54, kinetic: false });

const sb = {
  id: "human-reel-v3",
  title: "Human movement reel v3",
  idea: "The anime person (VRoid CC0 base in the house look) does a front handspring, walks, runs and stops, jumps, punches, picks up a box and sits on a chair: seven quick shots in the painted meadow, all motion capture",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  set: { type: "env", env: "meadow-path", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.6, ambience: 0.34, surface: "dirt", room: "open", guard: true },
  creative: { notes: false },
  cast: [{ id: "h", character: "human/vrm-test-01", at: [list[0].place[0], list[0].place[1]], face: "camera", expr: "kind", seed: 1.3, perform: list, fingers, poses, rest, gaze, seat: seat2, calm: [{ from: T("sit", 1.6), to: T("sit", 2.5), ramp: 0.25, k: 0.97 }], diagPalms: !!process.env.DIAG }],
  props: [
    { id: "crate", kind: "cardbox", x: grab.at[0], y: 0, z: grab.at[2], rot: 0, w: 0.28, d: 0.3, h: crateH, closed: true, scale: 0.001 },
    { id: "apple", kind: "apple", x: grab.at[0], y: R(crateH + APPLE_R), z: grab.at[2], rot: 0, scale: 0.001 },
    { ...chair, scale: 0.001 },
  ],
  beats,
  captions,
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217).",
  notes: "Generated by tools/human/make-reel-v3.mjs.",
};
fs.writeFileSync("storyboards/human/human-reel-v3.json", JSON.stringify(sb, null, 1));
// proof versions (motion brief: a plain level grid, fixed cameras, the whole body): the same performance, props and
// timing, the painted meadow swapped for set "plain" with a 25 cm grid, and each shot seen by a camera that does not
// move, from the side of its travel, from its front, or from three-quarters, far enough to hold its whole path
// (fov 30). PROOF_FPS renders more frames a second (120 played at 30 = a real quarter-speed render)
fs.mkdirSync("storyboards/human/proof", { recursive: true });
for (const view of ["side", "front", "q34"]) {
  const pb = JSON.parse(JSON.stringify(sb));
  pb.id = `hr3-grid-${view}`; pb.title = `Human reel v3 proof, grid, ${view}`;
  pb.set = { type: "plain", grid: 0.25, aperture: 0, focus: false, lighting: 2 };
  delete pb.music; pb.sound = { sfx: 0, ambience: 0 };
  pb.captions = [{ from: 0, to: END, text: `grid proof: ${view}`, pos: 1730, size: 46, pop: false, kinetic: false }];
  if (process.env.PROOF_FPS) pb.fps = +process.env.PROOF_FPS;
  for (const b of pb.beats) {
    const sh = shot(b.name), k = S.filter((q) => q.t >= sh.t0 && q.t < sh.t1 - 1e-6);   // (the sample at t1 is the next shot's)
    const xs = k.map((q) => q.pelvis.x), zs = k.map((q) => q.pelvis.z), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    // the shot's facing: its heading (degrees from +z) for moves on the spot, its net path for travelling ones
    const h = (sh.seg.heading || 0) * Math.PI / 180, e = k[k.length - 1].pelvis, a = k[0].pelvis, moved = Math.hypot(e.x - a.x, e.z - a.z) > 0.6;
    let fx = moved ? (e.x - a.x) : Math.sin(h), fz = moved ? (e.z - a.z) : Math.cos(h); const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;
    const dir = view === "front" ? [fx, fz] : view === "side" ? [fz, -fx] : [(fx + fz) / Math.SQRT2, (fz - fx) / Math.SQRT2];
    const hf = 2 * Math.atan(Math.tan(15 * Math.PI / 180) * 9 / 16), d = Math.max(4.2, (span + 1.3) / (2 * Math.tan(hf / 2)));
    b.shot = { pos: [R(cx + dir[0] * d), 1.0, R(cz + dir[1] * d)], look: [R(cx), 0.9, R(cz)], fov: 30 };
  }
  fs.writeFileSync(`storyboards/human/proof/${pb.id}.json`, JSON.stringify(pb, null, 1));
}
console.log("END", END, "crate h", crateH);
console.log("seat", seat.toArray().map((v) => v.toFixed(2)), "start of sit", back.toArray().map((v) => v.toFixed(2)));
for (const sh of SHOTS) {
  const k = S.filter((q) => q.t >= sh.t0 && q.t <= sh.t1);
  console.log(sh.name, sh.seg.at, "heading", sh.seg.heading, "pelvis x", Math.min(...k.map((q) => q.pelvis.x)).toFixed(2), Math.max(...k.map((q) => q.pelvis.x)).toFixed(2), "z", Math.min(...k.map((q) => q.pelvis.z)).toFixed(2), Math.max(...k.map((q) => q.pelvis.z)).toFixed(2), "head max", Math.max(...k.map((q) => q.head.y)).toFixed(2), "foot min", Math.min(...k.map((q) => q.foot)).toFixed(3));
}
