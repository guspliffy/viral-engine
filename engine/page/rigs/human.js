// Rig "human-v1": a person, for the first human movement test (6 Nov 2026). A skinned body built once from
// signed-distance shapes (tools/human/build.mjs -> assets/models/characters/<model>.json) on the CMU motion-capture
// skeleton (human-skel.js), played from real recorded motion (tools/human/clip.mjs -> assets/mocap/<clip>.json) and
// a few authored clips (the front flip), with the engine's own face (face.js) on the head bone.
//
// It extends the potato Character so every system that reads a character still finds its fields: the potato's own
// parts are built but hidden, its hands and feet are kept on the person's hands and feet (holds 2 carries a grabbed
// prop in the person's palm, the look's contact shadows land under the shoes), and its face IS the person's face.
//
// The cast entry's "perform" list says what the person does, in story time, as a pure function of t (a frame never
// depends on the frame before):
//   "perform": [ { "at": 0, "clip": "walk", "from": 0.4, "to": 3.0, "place": [x, z], "heading": 90 },
//                { "at": 2.6, "clip": "run", "from": 1.1, "to": 2.0, "blend": 0.3 }, ... ]
// at: story time the segment starts; from/to: the clip's seconds (played at `speed`, default 1, then held);
// place/heading: where the clip's first root position lands and which way (degrees, 0 = toward the camera, 90 = to
// screen right) the person faces there; left out, the segment carries on from where the last one ended.
// blend: seconds the pose crossfades from the previous segment.
// "fingers": [[t, L, R], ...] finger curl 0 (open) .. 1 (fist), eased between keys (relaxed 0.3 by default).
import * as THREE from "three";
import { Character } from "../potato.js";
import { Face } from "../face.js";
import { skeleton, BIND } from "./human-skel.js";
import { Performance, prepClip, fingerTurns } from "./human-perform.js";
import { partField, hit, normalAt } from "./human-sdf.js";

const MODELS = new Map(), CLIPS = new Map();
export const humanClips = () => CLIPS;   // (rig "vrm-v1" plays the same clips)

export async function preloadHumans(chars, sb) {
  const jobs = [], want = new Set();
  for (const def of Object.values(chars || {})) if (def.rig === "human-v1" && !MODELS.has(def.model)) want.add(def.model);
  for (const m of want) jobs.push(fetch(`/assets/models/characters/${m}.json`).then((r) => r.json()).then((j) => MODELS.set(m, j)));
  const clips = new Set();
  for (const c of sb.cast || []) for (const s of c.perform || []) if (s.clip && !CLIPS.has(s.clip)) clips.add(s.clip);
  for (const n of clips) jobs.push(fetch(`/assets/mocap/${n}.json`).then((r) => r.json()).then((j) => CLIPS.set(n, prepClip(j))));
  await Promise.all(jobs);
}

const b64f = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };

export class HumanCharacter extends Character {
  constructor(def, id, cast) {
    // the potato underneath: small, mitten hands (cheap), no costume; all of it hidden
    super({ ...def, rig: "potato", body: { lump: 0, ...(def.proxyBody || { color: "#f4cfb1", height: 0.5, width: 0.36, depth: 0.26, seed: 3 }) }, limbs: def.limbs || { color: "#f4cfb1", width: 0.03 }, hands: { type: "mitten" }, costume: null, sprout: null }, id);
    this.human = true; this.def = def; this.cast = cast || {};
    const M = MODELS.get(def.model);
    if (!M) throw new Error(`human model not loaded: ${def.model}`);
    this.model = M;
    // skeleton: rest turn identity everywhere, each bone at its start in the parent's space
    const SK = skeleton();
    this.bones = {}; this.boneList = [];
    for (const b of SK) {
      const bone = new THREE.Bone(); bone.name = `h-${b.name}`;
      bone.position.fromArray(b.start);
      if (b.parent) this.bones[b.parent].add(bone);
      this.bones[b.name] = bone; this.boneList.push(bone);
    }
    this.bodyRoot = new THREE.Group(); this.bodyRoot.name = "human";
    this.bodyRoot.add(this.bones.root);
    this.root.add(this.bodyRoot);
    // bind in the pose the body was modelled in (human-skel.js BIND, an A pose); every frame sets every turn again
    for (const [b, [ax, a]] of Object.entries(BIND)) this.bones[b].quaternion.setFromAxisAngle(new THREE.Vector3(...ax), a);
    this.bodyRoot.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(M.bones.map((n) => this.bones[n]));
    // the parts: one skinned mesh each, the look's role on the material (looks.js)
    this.mats = {}; this.parts = {};
    for (const P of M.parts) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(b64f(P.pos)), 3));
      g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(b64f(P.nrm)), 3));
      g.setAttribute("skinIndex", new THREE.BufferAttribute(new Uint16Array(b64f(P.skinI)), 4));
      g.setAttribute("skinWeight", new THREE.BufferAttribute(new Float32Array(b64f(P.skinW)), 4));
      g.setIndex(new THREE.BufferAttribute(P.wide ? new Uint32Array(b64f(P.idx)) : new Uint16Array(b64f(P.idx)), 1));
      const key = `${P.role}:${P.color}`;
      if (!this.mats[key]) {
        const m = new THREE.MeshStandardMaterial({ color: P.color, roughness: P.role === "hair" ? 0.55 : 0.85 });
        m.userData.lookRole = P.role === "skin" ? "skin" : P.role;
        if (P.role === "hair") m.userData.noShine = true;   // no glossy spots: the drawn hair is matte
        this.mats[key] = m;
      }
      const mesh = new THREE.SkinnedMesh(g, this.mats[key]);
      mesh.name = `human-${P.name}`; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      this.bodyRoot.add(mesh); mesh.bind(this.skeleton, new THREE.Matrix4());
      this.parts[P.name] = mesh;
    }
    this.skinMat = this.mats[`skin:${M.colors.skin}`];
    // the face on the head bone: face coordinates (u across, v up) cast straight back onto the head's surface
    const F = def.face || {}, head = partField({ shapes: M.faceShapes, k: 0.012 }), hb = this.bones.head;
    hb.updateMatrixWorld(true);
    const hStart = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld).applyMatrix4(new THREE.Matrix4().copy(this.bodyRoot.matrixWorld).invert());
    const FW = F.width ?? 0.092, FH = F.height ?? 0.1, FY = F.y0 ?? 0.545;
    const place = (u, v) => {
      const x = u * FW, y = FY + v * FH, from = [x, y, 0.3];
      const p = hit(head, from, [0, 0, -1], 0.5) || [x, y, 0.09];
      const n = normalAt(head, p);
      return { pos: new THREE.Vector3(p[0] - hStart.x, p[1] - hStart.y, p[2] - hStart.z), normal: new THREE.Vector3(...n) };
    };
    this.potatoParts.remove(this.face.group);
    this.face = new Face({ size: F.size ?? 0.2, iris: F.iris, cheeks: F.cheeks, brow: F.brow, lids: this.skinMat, eye: F.eye, browShape: F.browShape, blush: F.blush, layout: F.layout, freckles: F.freckles ? { n: F.freckles, color: M.colors.skin, seed: 3 } : null, place });
    hb.add(this.face.group);
    this.restBias = null;
    this.perf = new Performance(this.cast.perform || [], CLIPS, this.cast.fingers || []);
  }
  poseAt(t) { return this.perf.at(t); }
  fingersAt(t) { return this.perf.fingersAt(t); }

  apply(st, t) {
    super.apply(st, t);
    // the potato underneath stays hidden
    this.potatoParts.visible = false;
    // (and the rest of the potato on the root: its costume's crest leaves, the fries form; their places still update)
    for (const c of this.root.children) if (c !== this.bodyRoot) c.visible = false;
    for (const s of ["R", "L"]) {
      if (this.arms[s].mesh) this.arms[s].mesh.visible = false;
      if (this.legs[s].mesh) this.legs[s].mesh.visible = false;
      this.arms[s].hand.visible = false; this.legs[s].foot.visible = false;
    }
    const P = this.poseAt(t), B = this.bones;
    for (const b of this.boneList) b.quaternion.identity();
    if (P) {
      // the character's root stands under the pelvis and turns with the body (what reads the root, a two-hand hold's
      // turn, the contact shadows, finds the person where she is, not where the timeline put the stand-in)
      const par0 = this.root.parent;
      if (par0) {
        par0.updateMatrixWorld(true);
        const inv0 = new THREE.Matrix4().copy(par0.matrixWorld).invert();
        const g = new THREE.Vector3(P.pos.x, 0, P.pos.z).applyMatrix4(inv0);
        this.root.position.x = g.x; this.root.position.z = g.z;
        const f = new THREE.Vector3(0, 0, 1).applyQuaternion(P.q.root); f.y = 0;
        if (f.lengthSq() > 1e-6) this.root.rotation.set(0, Math.atan2(f.x, f.z), 0);
      }
      // the performance is in the world; the root group follows the timeline, so undo its place and turn
      this.root.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
      const par = this.root.parent; par?.updateMatrixWorld(true);
      const world = par ? P.pos.clone().applyMatrix4(par.matrixWorld) : P.pos.clone();
      B.root.position.copy(world.applyMatrix4(inv));
      const rq = new THREE.Quaternion(); this.root.getWorldQuaternion(rq);
      B.root.quaternion.copy(rq.invert().multiply(P.q.root));
      for (const b in P.q) if (b !== "root" && B[b]) B[b].quaternion.copy(P.q[b]);
    } else B.root.position.set(0, 0.87, 0);
    // fingers: each finger's three joints share the curl (more at the middle joint), the thumb folds across
    const fc = this.fingersAt(t);
    for (const [s, sx] of [["l", 1], ["r", -1]]) {
      const T = fingerTurns(fc[s.toUpperCase()], sx);
      for (const k in T) B[`${s}${k}`].quaternion.copy(T[k]);
    }
    this.bodyRoot.updateMatrixWorld(true);
    // the potato's hands and feet ride on the person's (hidden): what holds a prop holds it in the person's palm,
    // the look's contact shadows fall under the shoes
    const rootInv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    for (const [S, s, sx] of [["L", "l", 1], ["R", "r", -1]]) {
      const hm = B[`${s}hand`].matrixWorld.clone().premultiply(rootInv), hp = new THREE.Vector3(), hq = new THREE.Quaternion(), sc = new THREE.Vector3();
      hm.decompose(hp, hq, sc);
      // the palm's centre: 5 cm along the hand, 2.5 cm off the palm side
      const palm = new THREE.Vector3(sx * 0.05, -0.025, 0).applyQuaternion(hq).add(hp);
      const H = this.arms[S].hand; H.quaternion.copy(hq);
      const g = H.userData.grip ? H.userData.grip.position.clone().applyQuaternion(hq) : new THREE.Vector3();
      H.position.copy(palm).sub(g);
      this.arms[S].elbow = new THREE.Vector3().setFromMatrixPosition(B[`${s}radius`].matrixWorld).applyMatrix4(rootInv);
      this.arms[S].shoulder = new THREE.Vector3().setFromMatrixPosition(B[`${s}humerus`].matrixWorld).applyMatrix4(rootInv);
      this.arms[S].joint = true;
      const fp = new THREE.Vector3().setFromMatrixPosition(B[`${s}foot`].matrixWorld).applyMatrix4(rootInv);
      this.legs[S].foot.position.set(fp.x, Math.max(0.03, fp.y - 0.05), fp.z);
    }
  }
  // the person's own hand in the world (for tools and checks)
  handWorld(s) { return new THREE.Vector3().setFromMatrixPosition(this.bones[`${s}hand`].matrixWorld); }
}
