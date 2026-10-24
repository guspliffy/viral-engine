import * as THREE from "three";
import { Face, EXPRESSIONS } from "./face.js";
import { buildCostume } from "./costumes.js";
import { buildFries } from "./props.js";
import { rng } from "./util.js";

const LEG_H = 0.14;

// Hand targets per arm pose, in the character's own space (it faces +z, its right hand is at -x).
// sx = -1 for the right arm, +1 for the left.
function handTarget(pose, sx, rx, H, t) {
  const top = LEG_H + H;
  // dance.js: { o: [out, up, fwd] } mirrored per side, { x: [x, up, fwd] } an absolute x
  if (pose && typeof pose === "object") return pose.x ? [pose.x[0], LEG_H + H * pose.x[1], pose.x[2]] : [sx * (rx + pose.o[0]), LEG_H + H * pose.o[1], pose.o[2]];
  switch (pose) {
    case "up":    return [sx * rx * 0.55, top + 0.3, 0.08];
    case "wave":  return [sx * (rx * 0.62 + 0.07 * Math.sin(t * 6.283 * 2.4)), top + 0.24, 0.1];
    case "point": return [sx * (rx + 0.34), LEG_H + H * 0.58, 0.32];
    case "shrug": return [sx * (rx + 0.27), LEG_H + H * 0.55, 0.2];
    case "hips":  return [sx * (rx + 0.015), LEG_H + H * 0.36, -0.02];
    case "cast":  return [sx * (rx + 0.1), LEG_H + H * 0.86, 0.36];
    case "hold":  return [sx * (rx + 0.13), LEG_H + H * 0.4, 0.16];
    case "hat":   return [sx * rx * 0.6, top + 0.02, 0.2];
    case "fist":  return [sx * (rx + 0.06), LEG_H + H * 0.66, 0.26];
    case "cheeks": return [sx * (rx * 0.75), LEG_H + H * 0.5, 0.34];
    default:      return [sx * (rx + 0.08), LEG_H + H * 0.27, 0.06];   // rest
  }
}
const ELBOW_OUT = { hips: 0.24, shrug: 0.06, up: 0.1, cast: 0.1 };

export class Character {
  constructor(def, key) {
    this.def = def; this.key = key;
    const B = def.body, rnd = rng((B.seed || 1) * 7919);
    this.H = B.height; this.rx = B.width / 2; this.ry = B.height / 2; this.rz = B.depth / 2; this.cy = LEG_H + this.ry;
    this.lumps = Array.from({ length: 9 }, () => {
      const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      return { d, a: (rnd() * 2 - 1) * B.lump, k: 3 + rnd() * 5 };
    });

    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group(); this.root.add(this.bodyGroup);
    this.potatoParts = new THREE.Group(); this.bodyGroup.add(this.potatoParts);

    // body
    const g = new THREE.SphereGeometry(1, 128, 96), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const q = this.bodyPoint(v); p.setXYZ(i, q.x, q.y, q.z); }
    g.computeVertexNormals();
    this.skin = new THREE.MeshPhysicalMaterial({ color: B.color, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.35 });
    this.body = new THREE.Mesh(g, this.skin); this.body.castShadow = true; this.body.receiveShadow = true;
    this.potatoParts.add(this.body);

    // specks
    const speckM = new THREE.MeshStandardMaterial({ color: new THREE.Color(B.color).multiplyScalar(0.72), roughness: 0.8 });
    speckM.userData.noOutline = true;
    for (let i = 0; i < 9; i++) {
      const th = (rnd() * 2 - 1) * 2.6, ph = (rnd() * 2 - 1) * 0.9;
      if (Math.abs(th) < 0.65 && ph > -0.45 && ph < 0.6) continue; // keep the face clear
      const s = this.surf(th, ph);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018 + rnd() * 0.014, 10, 8), speckM);
      m.scale.set(1, 1, 0.3); m.position.copy(s.pos); m.lookAt(s.pos.clone().add(s.normal));
      this.potatoParts.add(m);
    }

    // face
    const F = def.face || {};
    this.face = new Face({ size: 1, iris: F.iris, cheeks: F.cheeks, place: (u, vv) => this.surf(u * 0.74, vv * 0.55 - 0.05) });
    this.potatoParts.add(this.face.group);

    // limbs
    this.limbMat = new THREE.MeshStandardMaterial({ color: def.limbs.color, roughness: 0.5 });
    this.limbW = def.limbs.width;
    this.arms = { R: { mesh: null, hand: null }, L: { mesh: null, hand: null } };
    this.legs = { R: { mesh: null, foot: null }, L: { mesh: null, foot: null } };
    for (const s of ["R", "L"]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 14), this.limbMat); hand.castShadow = true; this.root.add(hand); this.arms[s].hand = hand;
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), this.limbMat); foot.scale.set(0.9, 0.5, 1.25); foot.castShadow = true; this.root.add(foot); this.legs[s].foot = foot;
    }

    // costume (hat, held prop, sprout) and the alternative "fries" form
    this.costume = buildCostume(def, this);
    this.fries = buildFries(def, this); this.fries.group.visible = false; this.root.add(this.fries.group);
    this._limbKey = "";
  }

  // point on the potato for a unit direction, in bodyGroup space (y = 0 is the ground)
  bodyPoint(d) {
    let r = 1;
    for (const L of this.lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - 0.07 * d.y;
    return new THREE.Vector3(d.x * this.rx * taper * r, this.cy + d.y * this.ry * r, d.z * this.rz * taper * r);
  }
  // surface point + outward normal by angle around (theta, 0 = front) and elevation (phi)
  surf(th, ph) {
    const at = (a, b) => this.bodyPoint(new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)));
    const e = 0.002, pos = at(th, ph);
    const dt = at(th + e, ph).sub(at(th - e, ph)), dp = at(th, ph + e).sub(at(th, ph - e));
    return { pos, normal: dt.cross(dp).normalize() };
  }
  topY() { return this.cy + this.ry * (1 + this.lumpAt(new THREE.Vector3(0, 1, 0))); }
  lumpAt(d) { let r = 0; for (const L of this.lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d))); return r; }

  _tube(old, a, c, b, w) {
    if (old) { old.geometry.dispose(); this.root.remove(old); }
    const curve = new THREE.QuadraticBezierCurve3(a, c, b);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, w, 8, false), this.limbMat); m.castShadow = true; this.root.add(m);
    return m;
  }

  // st: the state the timeline computed for this frame
  apply(st, t) {
    const R = this.root;
    R.position.set(st.x, st.y, st.z); R.rotation.set(st.pitch || 0, st.yaw, st.lean);
    R.visible = st.visible !== false;
    const sq = st.squash; this.bodyGroup.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));

    const fries = st.form === "fries";
    this.potatoParts.visible = !fries;
    this.fries.group.visible = fries;
    if (fries) this.fries.apply(st, t);

    const e = { ...st.expr };
    if (st.talk > 0) { e.open = Math.max(e.open, st.talk); e.round = st.round; }
    if (!fries) this.face.set(e, st.look, st.blink);

    // limbs (hidden in fries form)
    const showLimbs = !fries;
    const sxOf = { R: -1, L: 1 };
    const S = this.bodyGroup.scale;
    const hands = {};
    for (const s of ["R", "L"]) {
      const sx = sxOf[s], a = st.arms[s];
      const from = handTarget(a.from, sx, this.rx, this.H, t), to = handTarget(a.pose, sx, this.rx, this.H, t);
      const h = new THREE.Vector3().fromArray(from).lerp(new THREE.Vector3().fromArray(to), a.p);
      h.y = LEG_H + (h.y - LEG_H) * S.y;
      hands[s] = h;
      const sh = this.surf(sx * 1.38, 0.02).pos; sh.set(sh.x * S.x, sh.y * S.y, sh.z * S.z);
      const elb = (q) => (typeof q === "string" ? ELBOW_OUT[q] ?? 0.13 : 0.1), out = elb(a.pose) * a.p + elb(a.from) * (1 - a.p);
      const mid = sh.clone().lerp(h, 0.5).add(new THREE.Vector3(sx * out, -0.06, 0.02));
      this.arms[s].hand.position.copy(h);
      this.arms[s].hand.visible = showLimbs;
      // legs
      const ph = st.walk * 6.283 + (s === "R" ? 0 : Math.PI);
      const lift = st.walkAmt * Math.max(0, Math.sin(ph)) * 0.07;
      const foot = new THREE.Vector3(sx * 0.13, 0.035 + lift + st.tuck * 0.08, 0.04 + st.walkAmt * Math.cos(ph) * 0.05);
      const hip = new THREE.Vector3(sx * 0.12, LEG_H * S.y + 0.06, 0.0);
      this.legs[s].foot.position.copy(foot); this.legs[s].foot.visible = showLimbs;
      const key = [h.x, h.y, h.z, sh.x, sh.y, foot.x, foot.y, foot.z, hip.y, out].map((x) => x.toFixed(4)).join(",");
      if (showLimbs && key !== this[`_k${s}`]) {
        this[`_k${s}`] = key;
        this.arms[s].mesh = this._tube(this.arms[s].mesh, sh, mid, h, this.limbW);
        this.legs[s].mesh = this._tube(this.legs[s].mesh, hip, hip.clone().lerp(foot, 0.5).add(new THREE.Vector3(sx * 0.02, 0, 0.02)), foot, this.limbW * 1.1);
      }
      if (this.arms[s].mesh) this.arms[s].mesh.visible = showLimbs;
      if (this.legs[s].mesh) this.legs[s].mesh.visible = showLimbs;
    }
    this.costume.apply(st, t, hands, fries);
  }
}

export const DEFAULT_EXPR = (def) => EXPRESSIONS[(def.face && def.face.default) || "kind"] || EXPRESSIONS.kind;
