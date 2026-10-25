import * as THREE from "three";
const _fist = new THREE.Quaternion();
const fistWeight = (curl) => { const w = Math.min(1, Math.max(0, (curl - 0.6) / 0.3)); return w * w * (3 - 2 * w); };
import { Face, EXPRESSIONS } from "./face.js";
import { buildCostume } from "./costumes.js";
import { buildFries } from "./props.js";
import { rng } from "./util.js";
import { taperedTube } from "./geo.js";

const LEG_H = 0.14;

// Hand targets per arm pose, in the character's own space (it faces +z, its right hand is at -x).
// sx = -1 for the right arm, +1 for the left.
export function handTarget(pose, sx, rx, H, t) {
  const top = LEG_H + H;
  // an arm still moving when a new move starts (util.js armNow): the blend it was in
  if (pose && pose.mix) { const m = pose.mix, a = handTarget(m.from, sx, rx, H, t), b = handTarget(m.pose, sx, rx, H, t); return a.map((v, i) => v + (b[i] - v) * m.p); }
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
    case "lap":   return [sx * rx * 0.45, LEG_H + H * 0.14, 0.34];
    case "table": return [sx * rx * 0.6, LEG_H + H * 0.3, 0.44];
    case "cheeks": return [sx * (rx * 0.75), LEG_H + H * 0.5, 0.34];
    default:      return [sx * (rx + 0.08), LEG_H + H * 0.27, 0.06];   // rest
  }
}
const ELBOW_OUT = { hips: 0.24, shrug: 0.06, up: 0.1, cast: 0.1 };
const elbowOut = (q) => (q && q.mix ? elbowOut(q.mix.from) + (elbowOut(q.mix.pose) - elbowOut(q.mix.from)) * q.mix.p : typeof q === "string" ? ELBOW_OUT[q] ?? 0.13 : q ? 0.1 : 0.13);

export class Character {
  constructor(def, key) {
    this.def = def; this.key = key;
    const B = def.body, rnd = rng((B.seed || 1) * 7919);
    this.H = B.height; this.rx = B.width / 2; this.ry = B.height / 2; this.rz = B.depth / 2; this.cy = LEG_H + this.ry;
    this.lumps = Array.from({ length: 9 }, () => {
      const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      return { d, a: (rnd() * 2 - 1) * B.lump, k: 3 + rnd() * 5 };
    });

    // yaw first, then pitch and lean in the character's own frame: a flip or a kneel tips it along the way it faces
    this.root = new THREE.Group(); this.root.rotation.order = "YXZ";
    this.bodyGroup = new THREE.Group(); this.root.add(this.bodyGroup);
    this.potatoParts = new THREE.Group(); this.bodyGroup.add(this.potatoParts);

    // body
    const g = new THREE.SphereGeometry(1, 128, 96), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const q = this.bodyPoint(v); p.setXYZ(i, q.x, q.y, q.z); }
    g.computeVertexNormals();
    // gloss: 0 matte .. 1 shiny (a tomato); the default keeps the potato skin
    const gl = B.gloss ?? 0.3;
    this.skin = new THREE.MeshPhysicalMaterial({ color: B.color, roughness: 0.5 - 0.3 * Math.max(0, gl - 0.3), clearcoat: gl, clearcoatRoughness: 0.35 - 0.25 * Math.max(0, gl - 0.3) });
    this.body = new THREE.Mesh(g, this.skin); this.body.castShadow = true; this.body.receiveShadow = true;
    this.potatoParts.add(this.body);

    // specks
    const speckM = new THREE.MeshStandardMaterial({ color: new THREE.Color(B.color).multiplyScalar(0.72), roughness: 0.8 });
    speckM.userData.noOutline = true;
    for (let i = 0; i < (B.specks ?? 9); i++) {
      const th = (rnd() * 2 - 1) * 2.6, ph = (rnd() * 2 - 1) * 0.9;
      if (Math.abs(th) < 0.65 && ph > -0.45 && ph < 0.6) continue; // keep the face clear
      const s = this.surf(th, ph);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018 + rnd() * 0.014, 10, 8), speckM);
      m.scale.set(1, 1, 0.3); m.position.copy(s.pos); m.lookAt(s.pos.clone().add(s.normal));
      this.potatoParts.add(m);
    }

    // face
    const F = def.face || {};
    this.face = new Face({ size: 1, iris: F.iris, cheeks: F.cheeks, brow: F.brow, lids: F.lids === false ? null : this.skin, eye: F.eye, browShape: F.browShape, blush: F.blush, place: (u, vv) => this.surf(u * 0.74, vv * 0.55 - 0.05) });
    this.potatoParts.add(this.face.group);

    // limbs
    this.limbMat = new THREE.MeshStandardMaterial({ color: def.limbs.color, roughness: 0.5 });
    if (globalThis.__DIAG?.colors) this.limbMat = new THREE.MeshLambertMaterial({ color: "#3060e0" });   // arms and legs blue
    this.limbW = def.limbs.width;
    this.arms = { R: { mesh: null, hand: null }, L: { mesh: null, hand: null } };
    this.legs = { R: { mesh: null, foot: null }, L: { mesh: null, foot: null } };
    for (const s of ["R", "L"]) {
      const hand = (def.hands?.type ?? "mitten") === "mitten" ? this._mitten(s) : new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 14), this.limbMat);
      hand.castShadow = true; this.root.add(hand); this.arms[s].hand = hand;
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), this.limbMat); foot.scale.set(0.9, 0.5, 1.25); foot.castShadow = true; this.root.add(foot); this.legs[s].foot = foot;
    }

    // costume (hat, held prop, sprout) and the alternative "fries" form
    this.costume = buildCostume(def, this);
    this.fries = buildFries(def, this); this.fries.group.visible = false; this.root.add(this.fries.group);
    this._limbKey = "";
  }

  // a mitten hand (def.hands.type "mitten"): palm, three fingers as one mitten, a separate index finger and a thumb, each
  // on its own pivot so the grip shapes (timeline.js GRIPS) can curl them. Local frame: +y along the forearm out to
  // the fingertips, +z out of the palm, +x towards the thumb. `grip` marks where a held handle sits.
  _mitten(s) {
    const g = new THREE.Group(), cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12);
    // debug "colors": flat colours per part (palm red, fingers orange, index yellow, thumb magenta) to read the grip
    const dc = globalThis.__DIAG?.colors, m = this.limbMat, M = (c) => (dc ? new THREE.MeshLambertMaterial({ color: c }) : m);
    g.userData.size = this.def.hands?.size ?? 1.3;   // the concept's big round mittens
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), M("#e03030")); palm.scale.set(1, 0.95, 0.78); palm.castShadow = true; g.add(palm);
    const piv = (x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p; };
    const fingers = piv(-0.012, 0.04, 0), mitt = new THREE.Mesh(new THREE.SphereGeometry(0.046, 20, 14), M("#ff9a20"));
    mitt.scale.set(1.05, 1.05, 0.8); mitt.position.y = 0.045; mitt.castShadow = true; fingers.add(mitt);
    const index = piv(0.032, 0.04, 0.004), ix = new THREE.Mesh(cap(0.017, 0.036), M("#f5e020")); ix.position.y = 0.032; ix.castShadow = true; index.add(ix);
    const thumb = piv(0.042, -0.008, 0.016), th = new THREE.Mesh(cap(0.019, 0.03), M("#e020e0"));
    th.position.set(0.026, 0.012, 0); th.rotation.z = -1.0; th.castShadow = true; thumb.add(th);
    // the handle runs along x through the curl of the fingers, between them and the top of the palm
    const grip = dc ? new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff", depthTest: false })) : new THREE.Object3D();
    grip.position.set(0.002, 0.04, 0.016); g.add(grip);
    g.userData = { ...g.userData, fingers, index, thumb, grip, side: s };
    return g;
  }
  // aim a mitten along the forearm (elbow -> hand) with the palm turned in towards the body, and curl it to the grip
  // axis: the held handle's direction (a staff, a scythe). A closed hand then turns its fist around it: the handle runs
  // through the curled fingers from the little finger to the thumb, thumb on top, knuckles out, fingers pointing forward.
  _pose(hand, elbow, at, sx, gr, axis = null) {
    const U = hand.userData, y = at.clone().sub(elbow).normalize();
    const z = new THREE.Vector3(-sx, 0, 0.35).normalize();
    z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize();
    hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
    // the fist turns onto the handle as the hand closes (curl 0.6 -> 0.9), so opening or closing it never pops. The
    // forearm direction, taken square to the handle, is the hand's own axis: the wrist enters the fist from the side and
    // the handle passes in front of the palm (grip frame: +x along the handle, thumb end; +z palm side)
    const w = axis ? fistWeight(gr.curl) : 0;
    if (w > 0) {
      const x = axis.clone().normalize().multiplyScalar(sx > 0 ? -1 : 1);   // the mirrored left hand's thumb is at -x
      const f = y.clone().addScaledVector(x, -y.dot(x)); if (f.lengthSq() < 1e-6) f.set(-sx, 0, 0); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, f, new THREE.Vector3().crossVectors(x, f)));
      hand.quaternion.slerp(_fist, w);
    }
    // a cupped hand (grip up > 0): the palm turns to face up, fingers still pointing along the forearm, so a jar or an
    // orb sits in it from below
    const up = Math.min(1, Math.max(0, gr.up || 0));
    if (up > 0) {
      const zu = new THREE.Vector3(0, 1, 0), f = y.clone().addScaledVector(zu, -y.dot(zu)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zu), f, zu));
      hand.quaternion.slerp(_fist, up);
    }
    // y x z points forward for the right hand; the left hand is its mirror image, so the thumb is in front on both
    const k = U.size || 1; hand.scale.set(sx > 0 ? -k : k, k, k);
    U.fingers.rotation.x = 1.65 * gr.curl; U.index.rotation.x = 1.75 * gr.index;
    U.thumb.rotation.set(0, -1.15 * gr.thumb, 0.35 * gr.thumb);
  }
  // where a prop held in hand s sits, in the root's space (the hand centre for ball hands)
  gripPoint(s) {
    const h = this.arms[s].hand;
    if (!h.userData.grip) return h.position.clone();
    h.updateMatrix(); return h.userData.grip.position.clone().applyMatrix4(h.matrix);
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

  _tube(old, a, c, b, w, arm = false) {
    if (old) { old.geometry.dispose(); this.root.remove(old); }
    const curve = new THREE.QuadraticBezierCurve3(a, c, b);
    // arms: rooted inside the body with a wider shoulder (no cut tube end shows) and narrowing to a wrist before the mitten
    const geo = arm ? taperedTube(curve, 0, 0, 20, 10, (t) => w * (t < 0.25 ? 1.25 - t : t > 0.8 ? 1 - (t - 0.8) * 1.1 : 1))
      : new THREE.TubeGeometry(curve, 14, w, 8, false);
    const m = new THREE.Mesh(geo, this.limbMat); m.castShadow = true; this.root.add(m);
    return m;
  }

  // st: the state the timeline computed for this frame
  apply(st, t) {
    const R = this.root;
    R.position.set(st.x, st.y - 0.1 * (st.kneel || 0), st.z); R.rotation.set(st.pitch || 0, st.yaw, st.lean); R.scale.setScalar(st.scale ?? 1);
    R.visible = st.visible !== false;
    const sq = st.squash; this.bodyGroup.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));

    const fries = st.form === "fries";
    this.potatoParts.visible = !fries;
    this.fries.group.visible = fries;
    if (fries) this.fries.apply(st, t);

    const e = { ...st.expr };
    if (st.talk > 0) { e.open = Math.max(e.open, st.talk); e.round = st.round; }
    if (!fries) this.face.set(e, st.look, st.blink, st.face);

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
      const shp = this.surf(sx * 1.38, 0.02), sh = shp.pos, shN = shp.normal; sh.set(sh.x * S.x, sh.y * S.y, sh.z * S.z);
      const out = elbowOut(a.pose) * a.p + elbowOut(a.from) * (1 - a.p);
      const mid = sh.clone().lerp(h, 0.5).add(new THREE.Vector3(sx * out, -0.06, 0.02));
      // a hand closed on a staff or handle: the elbow drops below the shoulder-hand line, so the forearm comes out from the
      // body into the side of the fist, square to the handle, instead of running down alongside it
      const gr = st.grip?.[s] || { curl: 0.15, index: 0.12, thumb: 0.1 }, ax = this.arms[s].hand.userData.fingers ? this.costume.propAxis?.(st, s) : null;
      const hw = ax ? fistWeight(gr.curl) : 0;
      if (hw > 0) mid.lerp(new THREE.Vector3(h.x - sx * 0.15, h.y - 0.01, h.z - 0.02), hw);   // elbow guide: beside the body at fist height
      this.arms[s].hand.position.copy(h);
      if (this.arms[s].hand.userData.fingers) this._pose(this.arms[s].hand, mid, h, sx, gr, ax);
      this.arms[s].elbow = mid;
      this.arms[s].hand.visible = showLimbs;
      // legs
      const ph = st.walk * 6.283 + (s === "R" ? 0 : Math.PI);
      const lift = st.walkAmt * Math.max(0, Math.sin(ph)) * 0.07;
      const foot = new THREE.Vector3(sx * 0.13, 0.035 + lift + st.tuck * 0.08, 0.04 + st.walkAmt * Math.cos(ph) * 0.05);
      // kneeling: the body drops, the feet stay on the floor tucked behind; sitting: the feet stick out in front
      const kn = st.kneel || 0, si = st.sit || 0;
      foot.y += 0.1 * kn; foot.z -= 0.14 * kn;
      foot.set(foot.x + sx * 0.02 * si, foot.y - 0.01 * si, foot.z + 0.24 * si);
      const hip = new THREE.Vector3(sx * 0.12, LEG_H * S.y + 0.06, 0.0);
      this.legs[s].foot.position.copy(foot); this.legs[s].foot.visible = showLimbs;
      const key = [h.x, h.y, h.z, sh.x, sh.y, foot.x, foot.y, foot.z, hip.y, out, hw].map((x) => x.toFixed(4)).join(",");
      if (showLimbs && key !== this[`_k${s}`]) {
        this[`_k${s}`] = key;
        this.arms[s].mesh = this._tube(this.arms[s].mesh, sh.clone().addScaledVector(shN, -0.035), mid, h, this.limbW, true);
        this.legs[s].mesh = this._tube(this.legs[s].mesh, hip, hip.clone().lerp(foot, 0.5).add(new THREE.Vector3(sx * 0.02, 0, 0.02)), foot, this.limbW * 1.1);
      }
      if (this.arms[s].mesh) this.arms[s].mesh.visible = showLimbs;
      if (this.legs[s].mesh) this.legs[s].mesh.visible = showLimbs;
    }
    this.costume.apply(st, t, hands, fries);
    if (globalThis.__DIAG?.clearance && !fries) this._clearance(t);
  }

  // diagnostic: the gap between the held prop's shaft and the holding arm (outside the fist) and the body, logged as
  // "diag: clearance t=.. arm=.. body=.." in metres (negative = they intersect). Storyboard "debug": { "clearance": true }.
  _clearance(t) {
    const L = this.costume.propLine?.(); if (!L) return;
    const s = L.hand, a = this.arms[s]; if (!a.elbow) return;
    const sh = this.surf((s === "R" ? -1 : 1) * 1.38, 0.02).pos, S = this.bodyGroup.scale; sh.set(sh.x * S.x, sh.y * S.y, sh.z * S.z);
    const curve = new THREE.QuadraticBezierCurve3(sh, a.elbow, a.hand.position), seg = new THREE.Line3(L.a, L.b), q = new THREE.Vector3(), c = new THREE.Vector3();
    let arm = Infinity, body = Infinity;
    for (let i = 0; i <= 60; i++) {
      curve.getPoint(i / 60, c);
      if (c.distanceTo(L.grip) < 0.09) continue;   // the fist itself, where the hand is meant to touch the wood
      seg.closestPointToPoint(c, true, q); arm = Math.min(arm, c.distanceTo(q) - L.r - this.limbW);
    }
    for (let i = 0; i <= 60; i++) {
      seg.at(i / 60, c); const d = c.clone().sub(new THREE.Vector3(0, this.cy * S.y, 0));
      const e = Math.sqrt((d.x / (this.rx * S.x)) ** 2 + (d.y / (this.ry * S.y)) ** 2 + (d.z / (this.rz * S.z)) ** 2);
      body = Math.min(body, (e - 1) * Math.min(this.rx, this.rz) - L.r);
    }
    console.log(`diag: clearance t=${t.toFixed(2)} arm=${arm.toFixed(3)} body=${body.toFixed(3)} tip=${L.a.y.toFixed(3)} gripOff=${seg.closestPointToPoint(L.grip, false, q).distanceTo(L.grip).toFixed(3)}`);
  }
}

export const DEFAULT_EXPR = (def) => EXPRESSIONS[(def.face && def.face.default) || "kind"] || EXPRESSIONS.kind;
