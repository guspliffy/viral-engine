// The first human movement reel (Jonny, 6 Nov 2026: "jumping, walking, running, punching, grabbing stuff, doing a
// frontflip, sitting on a chair"). Writes storyboards/human/human-reel.json: one continuous take along the park path,
// the camera tracking the person, the chair placed under the seated pelvis and the box under the hands, all worked out
// from the same performance the page plays (engine/page/rigs/human-perform.js), so nothing is placed by eye.
//   node tools/human/make-reel.mjs
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const Z = -0.65;   // the middle of the park path
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));

// the moves, in order: clip, its seconds, which way the person faces (90 = screen right, 0 = the camera), the
// crossfade into it, and the label shown while it plays
const MOVES = [
  { clip: "walk", from: 0.3, to: 2.75, travel: 90, label: "walk" },
  { clip: "run", from: 0.35, to: 0.98, travel: 90, blend: 0.3, label: "run" },
  { clip: "runstop", from: 0.05, to: 1.45, travel: 90, blend: 0.2, label: "run" },
  { clip: "jump", from: 1.0, to: 2.3, heading: 60, blend: 0.3, label: "jump" },
  { clip: "punch", from: 0.25, to: 2.95, heading: 35, blend: 0.35, label: "punch" },
  { clip: "flip", from: 0, to: 1.68, travel: 90, blend: 0.3, label: "front flip" },
  { clip: "pickbox", from: 0.55, to: 3.9, travel: 90, travelTo: 1.1, blend: 0.35, label: "grab" },
  { clip: "walk", from: 0.4, to: 2.3, travel: -108, blend: 0.4, label: "sit" },   // off the path, to the chair on the grass behind it
  { clip: "sit", from: 0.1, to: 2.35, heading: 0, blend: 0.35, label: "sit" },
];
// travel: face so the clip's own net travel (from -> to) goes this way, not its first frame's facing (a run that
// veers a little still runs along the path)
function headingFor(m) {
  if (m.travel == null) return m.heading;
  const C = load(m.clip), P = new Performance([{ at: 0, clip: m.clip, from: m.from, to: m.to, place: [0, 0], heading: 0 }], clips);
  const e = P.segRoot(P.L[0], m.travelTo ?? m.to), a = Math.atan2(e.x, e.z) * 180 / Math.PI;
  return +(m.travel - a).toFixed(2);
}
const START_X = -4.6, HOLD = 1.1;   // where the walk starts; the seated hold at the end

// lay the segments end to end: each one starts `blend` before the last one ends, and is placed so its root matches
// the last one's half way through the crossfade (no slide between two clips)
const list = [];
let t = 0;
for (const [i, m] of MOVES.entries()) {
  const C = load(m.clip), seg = { at: 0, clip: m.clip, from: m.from, to: m.to, heading: headingFor(m), place: [START_X, Z] };
  if (m.blend) seg.blend = m.blend;
  if (i > 0) {
    const prev = list[i - 1], pd = prev.to - prev.from;
    seg.at = +(prev.at + pd - (m.blend ?? 0.25)).toFixed(3);
    const tm = seg.at + (m.blend ?? 0.25) / 2;
    // where the last segment is at tm, and where this one would be if placed at the origin
    seg.place = [0, 0];
    const P = new Performance([...list, seg], clips), A = P.segPose(P.L[i - 1], tm).pos, B = P.segPose(P.L[i], tm).pos;
    seg.place = [+(A.x - B.x).toFixed(4), +(A.z - B.z).toFixed(4)];
  }
  list.push(seg);
  t = seg.at + (m.to - m.from);
}
const END = +(t + HOLD).toFixed(2);
const perf = new Performance(list, clips);

// sample the performance
const S = [];
for (let s = 0; s <= END + 1e-6; s += 1 / 30) {
  const W = worldPose(perf.at(s));
  S.push({ t: s, pelvis: W.root.start.clone(), L: palmWorld(W, "l"), R: palmWorld(W, "r"), head: W.head.end.clone(), foot: Math.min(W.lfoot.end.y, W.rfoot.end.y, W.ltoes.end.y, W.rtoes.end.y) });
}
const segAt = (name) => list.find((s) => s.clip === name);
const near = (time) => S[Math.max(0, Math.min(S.length - 1, Math.round(time * 30)))];

// the box: where both palms are lowest in the pickup (the clip's bend at 1.1-1.25 s), and where it is put down
const pb = segAt("pickbox"), pbT = (u) => pb.at + (u - pb.from);
let grab = null;
for (let u = 0.9; u <= 1.5; u += 1 / 30) { const k = near(pbT(u)), y = (k.L.y + k.R.y) / 2; if (!grab || y < grab.y) grab = { y, t: pbT(u), mid: k.L.clone().add(k.R).multiplyScalar(0.5), gap: k.L.distanceTo(k.R) }; }
let put = null;
for (let u = 2.9; u <= 3.6; u += 1 / 30) { const k = near(pbT(u)), y = (k.L.y + k.R.y) / 2; if (!put || y < put.y) put = { y, t: pbT(u), mid: k.L.clone().add(k.R).multiplyScalar(0.5) }; }
const BOX = { w: +Math.max(0.15, Math.min(0.34, grab.gap)).toFixed(3), d: 0.24, h: 0.32 };
const boxBase = (mid) => [+mid.x.toFixed(3), 0, +mid.z.toFixed(3)];   // the palms hold it at its middle, low

// the chair under the seated pelvis (clip seconds 1.5-2.3)
const sit = segAt("sit"), seat = near(sit.at + (1.9 - sit.from)).pelvis;

// the camera: the pelvis x averaged over a window centred on the frame (no lag), a distance per move, eased
const win = 0.45, camX = (time, c = "x", w = win) => { let a = 0, n = 0; for (const k of S) if (Math.abs(k.t - time) <= w) { a += k.pelvis[c]; n++; } return a / n; };
const DIST = { walk: 5.0, run: 5.6, runstop: 5.4, jump: 5.0, punch: 3.6, pickbox: 4.4, flip: 5.8, sit: 3.8 };
const LOOKY = { walk: 0.9, run: 0.9, runstop: 0.9, jump: 1.1, punch: 1.0, pickbox: 0.8, flip: 1.15, sit: 0.8 };
const camera = [];
for (let k = 0; k <= END + 1e-6; k += 0.25) {
  const seg = [...list].reverse().find((s) => s.at <= k + 0.15) || list[0];
  const x = camX(k), z = camX(k, "z", 0.8), d = DIST[seg.clip], ly = LOOKY[seg.clip];
  camera.push({ at: +k.toFixed(2), pos: [+(x + 0.12).toFixed(3), +(ly + 0.18).toFixed(3), +(z + d).toFixed(3)], look: [+x.toFixed(3), ly, +z.toFixed(3)], fov: 32 });
}
// smooth the distance changes: average each key's z and look y with its neighbours
for (let r = 0; r < 3; r++) for (let i = 1; i < camera.length - 1; i++) for (const f of [(c) => c.pos, (c) => c.look]) {
  const a = f(camera[i - 1]), b = f(camera[i]), c = f(camera[i + 1]);
  b[1] = +((a[1] + 2 * b[1] + c[1]) / 4).toFixed(3); if (f(camera[i]) === camera[i].look) continue; b[2] = +((a[2] + 2 * b[2] + c[2]) / 4).toFixed(3);
}

// the hands: fists in the punches, a grip on the box, open on the flip's landing, relaxed on the chair
const pu = segAt("punch"), puT = (u) => +(pu.at + (u - pu.from)).toFixed(3);
const fingers = [
  [0, 0.3, 0.3], [puT(0.25), 0.3, 0.3], [puT(0.4), 0.95, 0.95], [puT(2.9), 0.95, 0.95],
  [+(grab.t - 0.25).toFixed(3), 0.15, 0.15], [+grab.t.toFixed(3), 0.55, 0.55], [+(put.t).toFixed(3), 0.55, 0.55], [+(put.t + 0.2).toFixed(3), 0.2, 0.2],
  [+(segAt("sit").at + 0.6).toFixed(3), 0.35, 0.35],
];

// captions: the hook on frame 0, then a small label for each move while it plays
// (low over the grass, clear of the title Jonny adds at the top in the app)
const SUB = 1690, captions = [];
// each label from its move's start (0 for the first) to the next label's start: never two at once
for (const [i, m] of MOVES.entries()) {
  if (i && m.label === MOVES[i - 1].label) continue;
  const from = i === 0 ? 0 : +(list[i].at + 0.05).toFixed(2);
  if (captions.length) captions[captions.length - 1].to = from;
  captions.push({ from, to: END, text: m.label, pos: SUB, pop: false, size: 62, kinetic: false });
}
captions[captions.length - 1].to = END;

const sb = {
  id: "human-reel",
  title: "Human movement reel",
  idea: "The first human character (stand-in design) walks, runs, jumps, punches, grabs a box, front-flips and sits on a chair, all from motion capture",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "sheet",
  cleanStart: true,
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  set: { type: "park", seed: 4, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.6, ambience: 0.34, guard: true },
  creative: { notes: false },
  cast: [{
    id: "h", character: "human/test-01", at: [START_X, Z], face: "camera", expr: "kind", seed: 1.3,
    perform: list, fingers,
  }],
  props: [
    { id: "box", kind: "cardbox", x: boxBase(grab.mid)[0], y: 0, z: boxBase(grab.mid)[2], rot: 0, ...BOX, closed: true },
    { id: "chair", kind: "chair", x: +seat.x.toFixed(3), y: 0, z: +(seat.z - 0.04).toFixed(3), rot: 0 },
  ],
  beats: [{ name: "reel", at: 0, len: END, do: [
    { who: "h", do: "grab", prop: "box", hand: "both", at: +grab.t.toFixed(3) },
    { who: "h", do: "release", prop: "box", at: +put.t.toFixed(3) },
  ] }],
  camera,
  captions,
  duration: END,
  credits: "Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217). Front flip authored from take 143_06.",
  notes: "Generated by tools/human/make-reel.mjs.",
};
fs.writeFileSync("storyboards/human/human-reel.json", JSON.stringify(sb, null, 1));
console.log("END", END, "grab", grab.t.toFixed(2), grab.mid.toArray().map((v) => v.toFixed(2)), "gap", grab.gap.toFixed(2), "put", put.t.toFixed(2), put.mid.toArray().map((v) => v.toFixed(2)));
console.log("seat", seat.toArray().map((v) => v.toFixed(2)));
for (const s of list) console.log(s.clip, s.at, s.place, s.heading);
const lowFoot = S.reduce((a, k) => Math.min(a, k.foot), 9), hiHead = S.reduce((a, k) => Math.max(a, k.head.y), 0);
console.log("lowest foot", lowFoot.toFixed(3), "highest head", hiHead.toFixed(2), "x range", S[0].pelvis.x.toFixed(2), Math.max(...S.map((k) => k.pelvis.x)).toFixed(2), S[S.length - 1].pelvis.x.toFixed(2));
