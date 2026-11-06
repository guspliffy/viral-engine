// What a person in rig "human-v1" does: the cast entry's "perform" list played as a pure function of story time
// (see human.js), plus forward kinematics on the skeleton, so node tools can ask where the pelvis or a hand will be at
// any moment (to place a chair under the seat, a box under the hands, the camera on the move). three.js maths only.
import * as THREE from "three";
import { skeleton, FINGER_NAMES } from "./human-skel.js";

const D2R = Math.PI / 180, Y = new THREE.Vector3(0, 1, 0), _q2 = new THREE.Quaternion();
const smooth = (x) => { const w = Math.min(1, Math.max(0, x)); return w * w * (3 - 2 * w); };

export function prepClip(j) {
  const n = j.root.length, qs = {};
  for (const b of j.bones) qs[b] = Float32Array.from(j.q[b]);
  // the root's heading on every frame (radians, 0 = facing +z): its forward (+z) turned, flattened, unwrapped
  const yaw = new Float32Array(n), q = new THREE.Quaternion(), f = new THREE.Vector3();
  for (let i = 0; i < n; i++) { q.fromArray(qs.root, 4 * i); f.set(0, 0, 1).applyQuaternion(q); yaw[i] = Math.atan2(f.x, f.z); }
  for (let i = 1; i < n; i++) { while (yaw[i] - yaw[i - 1] > Math.PI) yaw[i] -= 2 * Math.PI; while (yaw[i] - yaw[i - 1] < -Math.PI) yaw[i] += 2 * Math.PI; }
  return { ...j, n, qs, yaw };
}

export class Performance {
  // list: the cast entry's perform list; clips: name -> prepClip(); fingers: [[t, L, R], ...]
  // legLen (optional): the body's thigh + shin length; each clip's root path is scaled by it over the recorded
  // actor's (a shorter body takes shorter steps at a lower hip height, so the feet don't skate)
  constructor(list, clips, fingers = [], legLen = null) {
    this.fingers = fingers;
    this.L = (list || []).map((s) => ({ ...s }));
    let carry = null;
    for (const s of this.L) {
      const C = clips.get ? clips.get(s.clip) : clips[s.clip]; if (!C) throw new Error(`clip not loaded: ${s.clip}`);
      s.C = C; s.k = legLen && C.lens ? legLen / ((C.lens.lfemur + C.lens.ltibia + C.lens.rfemur + C.lens.rtibia) / 2) : 1; s.speed ??= 1; s.from ??= 0; s.to ??= C.len; s.blend ??= 0.25;
      s.dur = (s.to - s.from) / s.speed;
      const y0 = this.yaw(C, s.from);
      s.r0 = this.root(C, s.from);
      s.P = s.place ? [s.place[0], s.place[1]] : carry ? carry.P : [0, 0];
      const head = s.heading != null ? s.heading * D2R : carry ? carry.yaw : 0;
      s.rot = head - y0;
      const e = this.segRoot(s, s.to);
      carry = { P: [e.x, e.z], yaw: this.yaw(C, s.to) + s.rot };
    }
  }
  root(C, u) { const f = Math.min(C.n - 1, Math.max(0, u * C.fps)), i = Math.min(C.n - 2, Math.floor(f)), k = f - i, a = C.root[i], b = C.root[i + 1]; return new THREE.Vector3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }
  yaw(C, u) { const f = Math.min(C.n - 1, Math.max(0, u * C.fps)), i = Math.min(C.n - 2, Math.floor(f)), k = f - i; return C.yaw[i] + (C.yaw[i + 1] - C.yaw[i]) * k; }
  clipQ(C, b, u, out) {
    const T = C.qs[b]; if (!T) return out.identity();
    const f = Math.min(C.n - 1, Math.max(0, u * C.fps)), i = Math.min(C.n - 2, Math.floor(f)), k = f - i;
    out.fromArray(T, 4 * i); _q2.fromArray(T, 4 * (i + 1)); return out.slerp(_q2, k);
  }
  segRoot(s, u) {
    const r = this.root(s.C, u), d = new THREE.Vector3(r.x - s.r0.x, 0, r.z - s.r0.z).multiplyScalar(s.k).applyAxisAngle(Y, s.rot);
    // jumpGain: the hips' rise above where the take starts is multiplied (an anime jump is higher than a person's)
    const y = s.jumpGain && r.y > s.r0.y ? s.r0.y + (r.y - s.r0.y) * s.jumpGain : r.y;
    return new THREE.Vector3(s.P[0] + d.x, y * s.k + (s.lift || 0), s.P[1] + d.z);
  }
  segPose(s, t) {
    const u = Math.min(s.to, s.from + Math.max(0, t - s.at) * s.speed), out = { pos: this.segRoot(s, u), q: {} };
    for (const b of s.C.bones) out.q[b] = this.clipQ(s.C, b, u, new THREE.Quaternion());
    out.q.root.premultiply(new THREE.Quaternion().setFromAxisAngle(Y, s.rot));
    return out;
  }
  // the pose at story time t: root position and turn in the world, every recorded bone's local turn (null: no list)
  at(t) {
    const L = this.L; if (!L.length) return null;
    let i = 0; while (i + 1 < L.length && L[i + 1].at <= t) i++;
    const s = L[i], P = this.segPose(s, t);
    const w = i > 0 && s.blend > 0 ? smooth((t - s.at) / s.blend) : 1;
    if (w < 1) {
      const A = this.segPose(L[i - 1], t);
      P.pos.lerp(A.pos, 1 - w);
      for (const b in P.q) if (A.q[b]) P.q[b].slerp(A.q[b], 1 - w);
    }
    return P;
  }
  fingersAt(t) {
    const K = this.fingers;
    if (!K.length) return { L: 0.3, R: 0.3 };
    let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
    const a = K[i], b = K[i + 1];
    if (!b || t <= a[0]) return { L: a[1], R: a[2] };
    const k = smooth((t - a[0]) / (b[0] - a[0]) || 1);
    return { L: a[1] + (b[1] - a[1]) * k, R: a[2] + (b[2] - a[2]) * k };
  }
}

// the finger bones' turns for a curl (0 open .. 1 fist): each finger's three joints share it, the thumb folds across
export function fingerTurns(c, sx) {
  const out = {};
  FINGER_NAMES.forEach((f, k) => {
    const spread = (1 - c) * (k - 1.4) * 0.07 * sx;
    out[`${f}1`] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spread, -sx * c * 1.45 - sx * 0.12));
    out[`${f}2`] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -sx * (c * 1.7 + 0.18));
    out[`${f}3`] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -sx * (c * 1.1 + 0.1));
  });
  out.thumb1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * c * 0.5, -sx * c * 0.35));
  out.thumb2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sx * c * 0.6);
  out.thumb3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sx * c * 0.5);
  return out;
}

// forward kinematics in the world for a pose from Performance.at: { bone: { start, end, q } }
const SK = skeleton();
export function worldPose(P) {
  const out = {};
  for (const b of SK) {
    const local = b.parent ? (P.q[b.name] || new THREE.Quaternion()) : P.q.root;
    if (!b.parent) { out.root = { start: P.pos.clone(), q: local.clone() }; out.root.end = out.root.start.clone(); continue; }
    const par = out[b.parent], q = par.q.clone().multiply(local);
    const start = new THREE.Vector3(...b.start).applyQuaternion(par.q).add(par.start);
    out[b.name] = { start, q, end: new THREE.Vector3(...b.dir).multiplyScalar(b.len).applyQuaternion(q).add(start) };
  }
  return out;
}
// the centre of a palm (5 cm along the hand, 2.5 cm off its palm side), in the world
export function palmWorld(W, s) { const sx = s === "l" ? 1 : -1, h = W[`${s}hand`]; return new THREE.Vector3(sx * 0.05, -0.025, 0).applyQuaternion(h.q).add(h.start); }
