// A relaxed natural stand as a "mocap" take (assets/mocap/stand.json), built from numbers instead of picked from a
// recording: the CMU takes we have never stand still and straight (114_05 at 14.9 s, the old turnaround pose, had the
// knees bent 29 degrees and the elbows 40, which read as a crouch, Jonny 8 Nov "stand weird and not natural").
//   node tools/human/make-stand.mjs [params.json]
// Every value is a turn away from the database's T pose, in degrees, from the posture research
// (characters/own-character-pipeline/research/research_notes/natural-standing-posture.md).
import fs from "node:fs";
import * as THREE from "three";
import { skeleton } from "../../engine/page/rigs/human-skel.js";
import { prepClip, Performance, worldPose } from "../../engine/page/rigs/human-perform.js";

const P = {
  // arms: lowered about the forward axis only, which already puts the palms against the thighs with the thumbs
  // forward (the T pose has the palms down; a CT study of people standing measured that same ~90 degree forearm
  // turn); any extra twist read as "hands turned oddly". 10 degrees out shows a gap at the waist (anime sheets:
  // 8-15; real 4.5; over 25 reads as an A pose); elbow 15 (measured 15.5, 13-18)
  armOut: 10, armFwd: 3, elbow: 15, pronate: 0, wrist: 5,
  // legs: knees soft (3-6 degrees; 0 reads locked), feet 5-8 degrees toe-out each, turned at the hip so the knee
  // follows the foot (a foot turned alone twists the knee)
  legOut: 1.5, kneeFlex: 4, toeOut: 7,
  pelvisTilt: 0, chestUp: 0, neck: 0, head: 0,                     // the database's spine already carries the S curve
  weight: 0,                                                       // contrapposto: + = weight on the left leg (0..1)
  ...(process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : {}),
};
const D = Math.PI / 180, X = new THREE.Vector3(1, 0, 0), Yv = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const SK = skeleton(), byName = Object.fromEntries(SK.map((b) => [b.name, b]));
const rest = (n) => new THREE.Vector3(...byName[n].dir);
const aim = (n, dir) => new THREE.Quaternion().setFromUnitVectors(rest(n), dir.clone().normalize());
const ax = (v, a) => new THREE.Quaternion().setFromAxisAngle(v, a * D);

// world turns
const W = {};
for (const b of SK) W[b.name] = new THREE.Quaternion();
W.root = ax(X, P.pelvisTilt);
for (const [s, sx] of [["l", 1], ["r", -1]]) {
  const wl = sx > 0 ? P.weight : -P.weight;                       // this leg carries more (straighter) or less
  const out = (P.legOut - wl * 1.5) * D, flex = (P.kneeFlex + Math.max(0, -wl) * 8) * D;
  const thigh = new THREE.Vector3(sx * Math.sin(out), -Math.cos(out), Math.sin(flex * 0.55));
  const shin = new THREE.Vector3(sx * Math.sin(out * 0.5), -Math.cos(out), -Math.sin(flex * 0.45));
  const yaw = ax(Yv, sx * P.toeOut);
  W[`${s}femur`] = yaw.clone().multiply(aim(`${s}femur`, thigh));
  W[`${s}tibia`] = yaw.clone().multiply(aim(`${s}tibia`, shin));
  // the foot: flat on the floor, its rest direction kept, turned toe-out about the vertical
  const fd = rest(`${s}foot`); fd.y = 0; fd.normalize(); fd.applyAxisAngle(Yv, sx * P.toeOut * D - Math.atan2(rest(`${s}foot`).x, rest(`${s}foot`).z));
  W[`${s}foot`] = new THREE.Quaternion().setFromUnitVectors(rest(`${s}foot`), new THREE.Vector3(fd.x, rest(`${s}foot`).y, fd.z).normalize());
  W[`${s}toes`] = W[`${s}foot`].clone();
  // the arm: lowered from the T pose (about the forward axis), a little forward, then the elbow and the forearm's twist
  const down = ax(Z, -sx * (90 - P.armOut)), fwd = ax(X, -P.armFwd);
  W[`${s}humerus`] = fwd.clone().multiply(down);
  const armDir = new THREE.Vector3(sx, 0, 0).applyQuaternion(W[`${s}humerus`]);
  const lat = new THREE.Vector3().crossVectors(armDir, Z).normalize().multiplyScalar(-sx);   // the elbow's hinge axis
  const bend = ax(new THREE.Vector3(1, 0, 0), -P.elbow);
  const foreDir = armDir.clone().applyQuaternion(bend);
  const twist = new THREE.Quaternion().setFromAxisAngle(foreDir.clone().normalize(), sx * P.pronate * D);
  W[`${s}radius`] = twist.clone().multiply(bend).multiply(W[`${s}humerus`]);
  W[`${s}wrist`] = W[`${s}radius`].clone().multiply(ax(Z, sx * P.wrist));
  for (const n of ["hand", "fingers", "thumb"]) W[`${s}${n}`] = W[`${s}wrist`].clone();
  W[`${s}clavicle`] = new THREE.Quaternion();
}
W.thorax = ax(X, -P.chestUp); W.upperback = ax(X, -P.chestUp * 0.5);
W.lowerneck = W.thorax.clone().multiply(ax(X, P.neck)); W.upperneck = W.lowerneck.clone(); W.head = W.upperneck.clone().multiply(ax(X, P.head));

// world -> local (each bone's turn inside its parent's), the clip's 29 recorded bones
const ref = JSON.parse(fs.readFileSync("assets/mocap/c114_05.json", "utf8"));
const local = {};
for (const n of ref.bones) {
  const b = byName[n]; const par = b?.parent;
  local[n] = par ? W[par].clone().invert().multiply(W[n]) : W[n].clone();
}
// the root's height: the lower foot's sole where the reference take's feet stand
const fr = Math.round(14.9 * ref.fps), refC = prepClip(ref);
const refW = worldPose(new Performance([{ at: 0, clip: "r", from: 14.9, to: 14.9, place: [0, 0], heading: 0 }], { r: refC }).at(0));
const floor = Math.min(refW.lfoot.end.y, refW.rfoot.end.y, refW.ltoes.end.y, refW.rtoes.end.y);
const P0 = { pos: new THREE.Vector3(0, 0, 0), q: { ...local } }; P0.q.root = local.root;
const W0 = worldPose(P0), low = Math.min(W0.lfoot.end.y, W0.rfoot.end.y, W0.ltoes.end.y, W0.rtoes.end.y);
const y = floor - low, N = 2, len = 10;
const clip = { name: "stand", source: "procedural relaxed stand (tools/human/make-stand.mjs)", credit: "own work", fps: N / len, len, lens: ref.lens, bones: ref.bones,
  root: Array.from({ length: N }, () => [0, +y.toFixed(4), 0]), q: {} };
for (const n of ref.bones) clip.q[n] = Array.from({ length: N }, () => local[n].toArray().map((v) => +v.toFixed(6))).flat();
fs.writeFileSync("assets/mocap/stand.json", JSON.stringify(clip));
const Wc = worldPose(P0), deg = (a, b) => (a.angleTo(b) / D).toFixed(1), v = (j) => j.end.clone().sub(j.start);
for (const s of ["l", "r"]) console.log(s, "arm from down", deg(v(Wc[`${s}humerus`]), new THREE.Vector3(0, -1, 0)), "elbow", deg(v(Wc[`${s}humerus`]), v(Wc[`${s}radius`])), "knee", deg(v(Wc[`${s}femur`]), v(Wc[`${s}tibia`])), "hand x", Wc[`${s}wrist`].end.x.toFixed(3), "foot x", Wc[`${s}foot`].end.x.toFixed(3));
console.log("root y", y.toFixed(3), "wrote assets/mocap/stand.json");
