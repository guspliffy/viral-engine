// The friends rig ("rig": "friends-v1"): The Little Chaos Club cast (Rusty the red panda, Pip the woodland imp, Moss
// the capybara; reference pack 2026-11-05 in references/friends-v1/). An opt-in rig family beside the potato: the
// stage builds it through engine/page/rigs/factory.js; every potato character still gets potato.js's Character,
// unchanged.
//
// What it shares with the potato (by extending Character, so the timeline, grips and checks keep one meaning):
//   - the hands: the glove with three fingers and a thumb (def.hands, four digits in all), its grip shapes, fist,
//     fingertip pinch, palm holds, locked hold frames, hand rig 2's wrist limits and smoothing, the seamless skin
//   - the timeline's state (timeline.js actorState): arm poses, grips, walks, the planted gait's foot targets (st.feet),
//     sit, kneel, hop, look, blink, expressions and face controls, follow-through
//   - the telemetry the checks read: arms[s] { shoulder, elbow, joint, hand, mesh }, legs[s] { foot, mesh }, rig(),
//     contact(), armBalls(), costumeMeshes(), face (eyes, group, place), body (the torso, the main ellipsoid)
// What is its own (the pack: "do not dress potato geometry in animal costumes"):
//   - separate torso and head surfaces per species (friends-designs.js), a head on a neck pivot that turns with the
//     gaze, real ears on root pivots, Rusty's six-band tail, two-bone arms and legs with elbows and knees, sleeves,
//     cuffs, trouser legs, paws and boots, all built once and posed per frame
//   - named arm poses from each character's own shoulders and reach (friends-anatomy.js); a hand that can't reach its
//     target stops at full reach and reports by how much (contact().reach), never stretches
//   - new channels (timeline.js FACE_KEYS, set with the "face" action): earL/earR (lift + up, - down), splayL/splayR,
//     tailWag, tailWrap, tailLift, tailAlarm, tailPin (0..1 each)
//   - body proxies for the contact and visibility checks (this.proxies: torso, head, ears, tail), so a friend can't
//     pass the checks by having no potato body
// Every pose is a pure function of the state at time t (secondary motion is rebuilt from stateAt(t - k/30), never
// from the frame drawn before), so frames can be drawn in any order, sharded or cached.
import * as THREE from "three";
import { Character, arcLerp } from "../potato.js";
import { Face, EXPRESSIONS } from "../face.js";
import { friendTarget, LEG_H } from "./friends-anatomy.js";
import { buildDesign, mat } from "./friends-designs.js";
import { stitches } from "../costumes-art.js";
import { blobMesh, ellipsoid, union, rayHit, gradient, tubeMesh, capped, smoothPath, mixHex, sstep, smax, resample } from "./friends-geo.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _m = new THREE.Matrix4();
// the clip's rig options (stage.js calls setFriendsRig(sb) beside potato.js setRig): hand rig 2 and its smoothing
let HAND2 = false, SMOOTH = true;
export const setFriendsRig = (sb) => { HAND2 = sb?.rig?.hand === 2; SMOOTH = sb?.rig?.smooth !== false; };
const disposeTree = (o) => o.traverse((q) => { if (q.geometry) q.geometry.dispose(); });

// two-bone limb: from root a to target t with segment lengths l1, l2 and the bend toward `pole`. Returns the middle
// joint and the reachable end (t itself, or the point at full reach toward it) and how far short it falls
export function twoBone(a, t, l1, l2, pole) {
  const d0 = t.clone().sub(a), dist = d0.length(), u = dist > 1e-6 ? d0.multiplyScalar(1 / dist) : V(0, -1, 0);
  const max = (l1 + l2) * 0.999, min = Math.abs(l1 - l2) + 0.01, d = clamp(dist, min, max);
  const end = dist > max ? a.clone().addScaledVector(u, max) : t.clone();
  const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
  let p = pole.clone().addScaledVector(u, -pole.dot(u));
  if (p.lengthSq() < 1e-8) p = V(0, 0, 1).addScaledVector(u, -u.z);
  p.normalize();
  return { mid: a.clone().addScaledVector(u, l1 * ca).addScaledVector(p, l1 * sa), end, short: Math.max(0, dist - max) };
}

export class FriendCharacter extends Character {
  constructor(def, key) {
    super(def, key);   // builds the shared glove hands, the limb records and an empty costume (its sprout is hidden)
    const A = (this.A = def.anatomy), D = (this.D = buildDesign(def));
    // the potato's own body and face, built by the shared constructor, are dropped before anything uses them
    this.bodyGroup.remove(this.potatoParts); disposeTree(this.potatoParts);
    this.potatoParts = new THREE.Group(); this.potatoParts.name = "friend-body"; this.bodyGroup.add(this.potatoParts);
    this.skin = null;   // no potato skin texture (looks.js paints ch.skin)
    this.H = def.body.height; this.rx = def.body.width / 2; this.rz = def.body.depth / 2; this.ry = (A.crown - A.hip[1]) / 2; this.cy = (A.crown + A.hip[1]) / 2;
    this.limbW = def.limbs.width;

    // torso (pivot at the hips: a squash or breath scales it from there, never the head)
    this.torso = new THREE.Group(); this.torso.name = "torso"; this.torso.position.set(0, A.hip[1], 0); this.potatoParts.add(this.torso);
    this.body = new THREE.Mesh(D.torso.geo, D.torso.mat); this.body.name = "torso"; this.body.castShadow = this.body.receiveShadow = true; this.body.userData.bodyPart = "torso";
    this.torso.add(this.body); for (const o of D.torso.det) this.torso.add(o);
    // the fur below the garment's hem shades as fur (role "skin"), the garment as cloth: one mesh, two material groups
    if (D.torso.below) {
      const g = D.torso.geo, I = g.index.array, P = g.attributes.position, up = [], lo = [];
      for (let i = 0; i < I.length; i += 3) { const y = (P.getY(I[i]) + P.getY(I[i + 1]) + P.getY(I[i + 2])) / 3; (y < D.torso.hemY ? lo : up).push(I[i], I[i + 1], I[i + 2]); }
      g.setIndex([...up, ...lo]); g.clearGroups(); g.addGroup(0, up.length, 0); g.addGroup(up.length, lo.length, 1);
      this.body.material = [D.torso.mat, D.torso.below];
    }
    // head on its neck pivot (not under the torso's scale: a squash would warp the face)
    this.neck = new THREE.Group(); this.neck.name = "neck"; this.neck.rotation.order = "YXZ"; this.potatoParts.add(this.neck);
    this.headGroup = new THREE.Group(); this.headGroup.name = "head"; this.neck.add(this.headGroup);
    this.headMesh = new THREE.Mesh(D.head.geo, D.head.mat); this.headMesh.name = "head"; this.headMesh.castShadow = this.headMesh.receiveShadow = true; this.headMesh.userData.bodyPart = "head";
    this.headGroup.add(this.headMesh); for (const o of D.head.parts) this.headGroup.add(o);
    this.ears = D.ears; for (const e of this.ears) this.headGroup.add(e.pivot);
    // the face, on the species' own head surface (place: rays from inside the head through the face's (u, v))
    const F = def.face || {}, FD = D.face, O = V(...FD.origin), cache = new Map(), field = D.head.field;
    const place = (u, v) => {
      const k = `${Math.round(u * 1e4)},${Math.round(v * 1e4)}`;
      let r = cache.get(k);
      if (!r) {
        // spread: features higher on the face fan out wider (a capybara's eyes sit on the sides of the head, above
        // and behind the long muzzle, while its mouth stays low on the muzzle's front)
        const sp = 1 + (FD.spread || 0) * sstep(FD.spreadV?.[0] ?? 0, FD.spreadV?.[1] ?? 0.4, v);
        const d = V(u * FD.gu * sp, v * FD.gv + (FD.v0 || 0), 1).normalize(), h = rayHit(field, O, d, 1);
        const pos = h ? h.pos : O.clone().addScaledVector(d, 0.15);
        r = { pos, normal: gradient(field, pos) }; if (cache.size > 40000) cache.clear(); cache.set(k, r);
      }
      return { pos: r.pos.clone(), normal: r.normal.clone() };
    };
    this.face = new Face({ size: F.size ?? 0.5, iris: F.iris, cheeks: F.cheeks ?? "#e8806a", brow: F.brow, lids: F.lids === false ? null : FD.lids, eye: F.eye, browShape: F.browShape, blush: F.blush ?? 0.6, layout: F.layout,
      freckles: F.freckles ? { n: F.freckles, color: F.freckleColor || def.palette.skin || "#c08060", seed: def.body.seed || 1 } : null, place });
    if (F.rest) this.restBias = Object.fromEntries(Object.keys(EXPRESSIONS.kind).map((k) => [k, (F.rest[k] ?? EXPRESSIONS.kind[k]) - EXPRESSIONS.kind[k]]));
    this.headGroup.add(this.face.group);
    // the face's frame for the checks: the eyes' and mouth's own places in the head (face.place)
    this.faceAnchor = { eyeU: this.face.layout.eyeU, eyeV: this.face.layout.eyeV, mouthV: this.face.layout.mouthV };

    // limbs: one tube per arm and leg (sleeve or fur, cuff, bare skin), rebuilt each frame from its joints
    const LS = def.limbStyle;
    this.armMat = mat(LS.arm.color, { role: LS.arm.role || "cloth", vc: true });
    this.legMat = mat(LS.leg.color, { role: LS.leg.role || "skin", vc: true });
    for (const s of ["R", "L"]) {
      this.root.remove(this.legs[s].foot); this.legs[s].foot.geometry.dispose();
      const foot = this._foot(def, s); this.root.add(foot); this.legs[s].foot = foot;
      const arm = new THREE.Mesh(new THREE.BufferGeometry(), this.armMat); arm.castShadow = arm.receiveShadow = true; arm.name = `arm${s}`; this.root.add(arm); this.arms[s].mesh = arm;
      const leg = new THREE.Mesh(new THREE.BufferGeometry(), this.legMat); leg.castShadow = leg.receiveShadow = true; leg.name = `leg${s}`; this.root.add(leg); this.legs[s].mesh = leg;
    }
    // Pip's sleeve patch: on the anatomical RIGHT upper outer sleeve, riding the upper arm
    if (def.patch) {
      const pm = new THREE.Mesh(new THREE.BoxGeometry(def.patch.w, def.patch.h, 0.006), mat(def.palette.patch, { role: "cloth", line: "#4a2420" }));
      const st = new THREE.Mesh(new THREE.BoxGeometry(def.patch.w + 0.008, def.patch.h + 0.008, 0.003), mat("#6a3430", { role: "char" })); st.position.z = -0.002; pm.add(st);
      // the sheet's hand-sewn edge: the potato cloth kit's cross stitches (costumes-art.js stitches) along each side
      const w = def.patch.w / 2, h = def.patch.h / 2, z = V(0, 0, 1);
      for (const [p, a, n] of [[V(0, h - 0.004, 0.003), V(1, 0, 0), 3], [V(0, -h + 0.004, 0.003), V(1, 0, 0), 3], [V(-w + 0.004, 0, 0.003), V(0, 1, 0), 2], [V(w - 0.004, 0, 0.003), V(0, 1, 0), 2]]) { const g = stitches(p, z, a, n, 0.011, "#e3c9a0"); g.traverse((o) => { if (o.isMesh) o.material.userData.noOutline = true; }); pm.add(g); }
      pm.castShadow = true; pm.name = "sleeve-patch"; this.patch = pm; this.root.add(pm);
    }
    // Rusty's tail: one continuous tube from the sacrum, six broad dark bands painted by the distance along it
    if (def.tail) {
      this.tailMat = mat(def.tail.base, { role: "skin", vc: true });
      this.tail = new THREE.Mesh(new THREE.BufferGeometry(), this.tailMat); this.tail.name = "tail"; this.tail.castShadow = this.tail.receiveShadow = true; this.tail.userData.bodyPart = "tail";
      this.root.add(this.tail);
    }
    // the checks' solids (stage.js clipping, reach): the torso, the head and each ear as the ellipsoid of its own box,
    // and the tail as a ball per joint (a curved tube's box would be mostly air). The balls ride in a hidden group, so
    // they are never drawn, raycast or hashed, but their world matrices update with the root
    this.qa = new THREE.Group(); this.qa.name = "qa-proxies"; this.qa.visible = false; this.root.add(this.qa);
    this.tailBalls = [];
    if (this.tail) {
      const g = new THREE.SphereGeometry(1, 8, 6);
      for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(g, this.tailMat); b.name = `tail-ball${i}`; b.userData.bodyPart = "tail"; this.qa.add(b); this.tailBalls.push(b); }
    }
    for (const m of [this.body, this.headMesh, ...this.ears.map((e) => e.mesh), ...this.tailBalls]) if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    this.proxies = [{ mesh: this.body, part: "torso" }, { mesh: this.headMesh, part: "head" }, ...this.ears.map((e, i) => ({ mesh: e.mesh, part: i ? "earL" : "earR" })), ...this.tailBalls.map((b) => ({ mesh: b, part: "tail" }))];
    this.reachShort = { R: 0, L: 0 }; this.legShort = { R: 0, L: 0 };
  }

  // the foot: a hind paw (sole flat on the floor, toes in front) or a boot, centred where the timeline's foot target
  // is (y 0.035 above the floor, as potato.js's foot)
  _foot(def, s) {
    const F = def.foot, g = new THREE.Group(); g.name = `foot${s}`;
    const len = def.anatomy.footLen, w = F.width, h = F.height;
    if (F.type === "boot") {
      const f = union([
        { f: ellipsoid([0, -0.01, 0.03], [w / 2, h * 0.5, len * 0.5]) },
        { f: ellipsoid([0, 0.02, -0.035], [w * 0.46, 0.06, w * 0.5]), k: 0.03 },
        { f: ellipsoid([0, 0.06, -0.03], [w * 0.42, 0.06, w * 0.44]), k: 0.03 },   // the shaft round the ankle
      ]);
      const cut = (p) => smax(smax(f(p), -(p.y + 0.035), 0.008), p.y - 0.1, 0.01);
      const geo = blobMesh(cut, { center: [0, 0.01, 0.0], wSeg: 48, hSeg: 36, paint: (p) => (p.y < -0.025 ? new THREE.Color("#2e221c") : mixHex(F.color, "#5e463a", 0.3 * sstep(0.02, 0.09, p.y))) });
      const m = new THREE.Mesh(geo, mat(F.color, { role: "cloth", vc: true })); m.castShadow = m.receiveShadow = true; m.name = "boot"; g.add(m);
    } else {
      const parts = [{ f: ellipsoid([0, -0.005, 0.0], [w / 2, h * 0.55, len * 0.42]) }];
      for (const x of [-0.6, -0.2, 0.2, 0.6]) parts.push({ f: ellipsoid([x * w * 0.42, -0.012, len * 0.36], [w * 0.17, h * 0.4, w * 0.2]), k: 0.012 });   // four toes
      parts.push({ f: ellipsoid([0, 0.02, -len * 0.18], [w * 0.4, h * 0.6, w * 0.45]), k: 0.03 });   // the heel and ankle
      const f = union(parts), cut = (p) => smax(f(p), -(p.y + 0.035), 0.006);
      const geo = blobMesh(cut, { center: [0, 0.0, 0.0], wSeg: 48, hSeg: 32, paint: (p) => mixHex(F.color, "#2a1812", p.y < -0.03 ? 0.6 : 0.1 * sstep(0, 0.03, p.y)) });
      const m = new THREE.Mesh(geo, mat(F.color, { role: "skin", vc: true })); m.castShadow = m.receiveShadow = true; m.name = "paw"; g.add(m);
    }
    g.userData.ankle = V(0, F.ankle ?? 0.035, -len * 0.16);   // where the shin meets the foot, in the foot's frame
    return g;
  }

  // ------------------------------------------------------------------------------------------- the body surface
  // the potato constructor asks for bodyPoint / surf before this.A exists: give it the potato's
  bodyPoint(d) { if (!this.A) return super.bodyPoint(d); return this.surf(Math.atan2(d.x, d.z), Math.asin(clamp(d.y, -1, 1))).pos; }
  // a point on the torso by angle round (0 front) and elevation, in the root's space (unsquashed)
  surf(th, ph) {
    if (!this.A) return super.surf(th, ph);
    const f = this.D.torso.field, o = V(0, 0.2, 0), d = V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph)), h = rayHit(f, o, d, 1);
    const p = h ? h.pos : o.clone().addScaledVector(d, 0.2), n = gradient(f, p);
    return { pos: p.add(V(0, this.A.hip[1], 0)), normal: n };
  }
  topY() { return this.A ? this.A.crown : super.topY(); }
  _outside(p) { return p; }

  // ------------------------------------------------------------------------------------------- arms
  // an arm's inputs (as potato.js _armIn, used by apply and by hand rig 2's smoothing): the hand target from the
  // friend's own pose table, the shoulder on this torso, the elbow from a two-bone solve (not a curve's pull point)
  _armIn(st, t, s, S) {
    const A = this.A, sx = s === "R" ? -1 : 1, a = st.arms[s];
    const T = (q) => friendTarget(A, q, sx, this.rx, this.H, t, arcLerp);
    const from = T(a.from), to = T(a.pose), h = new THREE.Vector3().fromArray(arcLerp(from, to, a.p, sx));
    const g = st.gait, rw = g ? (a.pose === "rest" ? a.p : 0) + (a.from === "rest" ? 1 - a.p : 0) : 0;
    if (rw > 0) { const u = g.ph + (s === "R" ? 0 : 0.5), sw = -0.07 * g.amt * Math.min(1.5, Math.max(0.6, g.sd)) * Math.cos(2 * Math.PI * u) * rw; h.x += sw * g.dir[0]; h.z += sw * g.dir[1]; }
    h.y = LEG_H + (h.y - LEG_H) * S.y;
    // the shoulder on the (squashed) torso, a little inside its surface
    const hip = A.hip[1], sh = V(sx * A.shoulder[0] * S.x, hip + (A.shoulder[1] - hip) * S.y, A.shoulder[2] * S.z), shN = V(sx, 0.2, 0).normalize();
    const gr = { ...(st.grip?.[s] || { curl: 0.15, index: 0.12, thumb: 0.1 }) }, ax = this.costume.propAxis?.(st, s) || (gr.axis ? new THREE.Vector3(...gr.axis) : null);
    const dn = clamp(gr.down || 0);
    if (dn > 0) { const k = gr.since != null ? clamp((t - gr.since) / 0.6) : 1, settle = 1 - k * k * (3 - 2 * k); gr.curl -= dn * 0.12 * settle; gr.index -= dn * 0.14 * settle; }
    const fr = this._frame(a);
    // the elbow points down, back and out; further out for hands on hips or a shrug; level and out for a hand raised high
    const out = (q) => (q && q.mix ? out(q.mix.from) + (out(q.mix.pose) - out(q.mix.from)) * q.mix.p : q === "hips" ? 1.4 : q === "shrug" ? 0.9 : q === "up" || q === "wave" ? 0.7 : 0.35);
    const o = out(a.pose) * a.p + out(a.from) * (1 - a.p), hi = clamp((h.y - sh.y) / 0.25);
    const pole = V(sx * (0.35 + o), -1 + 0.7 * hi, -0.55 - 0.2 * hi).normalize();
    // the hand's centre sits a palm's length past the wrist: aim the wrist, then put the hand on the target
    const reach = A.arm, L = this.arms[s].hand.userData.size * 0.055;
    const ik = twoBone(sh, h, reach[0], reach[1] + L, pole);
    const short = ik.short; h.copy(ik.end);
    const mid = ik.mid;
    return { sx, a, from, to, h, sh, shN, gr, ax, dn, fr, mid, short };
  }
  // the drawn arm as balls along it (stage.js inProps: an arm through a prop), with the sleeve's real radius
  armBalls(s) {
    const A = this.arms[s];
    if (!A.mesh || !A.mesh.visible || !A.elbow || !this.root.visible) return [];
    this.root.updateMatrixWorld(true); A.hand.updateMatrixWorld(true);
    const curve = Character.armCurve(A.shoulder, A.elbow, A.hand.position, true), hand = A.hand.getWorldPosition(new THREE.Vector3());
    const k = this.root.getWorldScale(new THREE.Vector3()).x, out = [];
    for (let i = 5; i <= 24; i++) {
      const c = curve.getPointAt(i / 24).applyMatrix4(this.root.matrixWorld);
      if (c.distanceTo(hand) < 0.08 * k) continue;
      out.push({ c, r: this._armR(i / 24) * k });
    }
    return out;
  }
  _armR(u) { const Y = this.def.limbStyle.arm; return Y.r[0] + (Y.r[1] - Y.r[0]) * u; }

  // ------------------------------------------------------------------------------------------- per frame
  apply(st, t) {
    const R = this.root, A = this.A, D = this.def, LS = D.limbStyle;
    R.position.set(st.x, st.y - 0.1 * (st.kneel || 0), st.z); R.rotation.set(st.pitch || 0, st.yaw, st.lean); R.scale.setScalar(st.scale ?? 1);
    R.visible = st.visible !== false;
    this.bodyGroup.visible = !st.pov;
    this.bodyGroup.scale.set(1, 1, 1);
    // a squash (a breath, a hop's crouch) scales the torso from the hips, half as much as a potato's whole body
    const sq = 1 + ((st.squash ?? 1) - 1) * 0.5, S = V(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    this.torso.scale.copy(S);
    const pl = st.plant && st.plant.w < 1 ? st.plant : null;
    if (pl) {
      R.updateMatrixWorld(true);
      this._plantM = (this._plantM || new THREE.Matrix4()).compose(V(pl.x, pl.y, pl.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), pl.yaw), new THREE.Vector3().setScalar(st.scale ?? 1));
      this._footQ = R.quaternion.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), pl.yaw));
    }
    // ---- head: on the neck, turned a little toward the gaze (the eyes lead, the head follows a third of the way),
    // with the follow-through's lag; then the face
    const hip = A.hip[1], ft = st.ft || { f: 0, s: 0, u: 0 }, lk = st.look || [0, 0];
    this.neck.position.set(0, hip + (A.neckY - hip) * S.y, (A.neckZ ?? 0) * S.z);
    this.neck.rotation.set(-0.16 * clamp(lk[1], -1, 1) + 0.12 * ft.f, 0.28 * clamp(lk[0], -1.2, 1.2), -0.1 * ft.s);
    const e = { ...st.expr }; delete e.round;
    if (this.restBias) {
      const K = EXPRESSIONS.kind, far = Math.abs(e.open - K.open) * 1.6 + Math.abs(e.eye - K.eye) * 2.2 + Math.abs(e.curve - K.curve) * 0.9 + Math.abs(e.tilt - K.tilt) * 1.4 + Math.abs((e.pupil ?? 1) - 1) * 2;
      const w = Math.max(0, Math.min(1, 1 - (far - 0.12) / 0.7));
      for (const k in this.restBias) e[k] = (e[k] ?? 0) + this.restBias[k] * w;
    }
    if (st.talk > 0) { e.open = Math.max(e.open, st.talk); e.round = st.round; }
    this.face.set(e, st.look, st.blink, st.face);
    this._ears(st, e, ft);

    // ---- arms
    const hands = {};
    this.root.updateMatrixWorld(true);
    for (const s of ["R", "L"]) {
      const ai = this._armIn(st, t, s, S), { sx, a, from, to, h, sh, gr, ax, dn, fr } = ai;
      const mid = ai.mid; hands[s] = h; this.reachShort[s] = ai.short;
      const hand = this.arms[s].hand, U = hand.userData;
      const pose = (h, mid) => { hand.position.copy(h); if (U.fingers) this._pose(hand, mid, h, sx, gr, ax, HAND2 ? null : this._palm(a, h, S, from, to), sh, Math.min(1, Math.max(0, 4 * a.p * (1 - a.p))), fr, HAND2 ? this._palms(a, S, from, to) : null); };
      pose(h, mid);
      const pp = U.pinchPt ? this._pointW(a) : 0;
      if (pp > 0 && U.pinchW > 0) { hand.updateMatrix(); const off = U.pinchPt.position.clone().applyMatrix4(hand.matrix).sub(h).multiplyScalar(pp); h.sub(off); mid.sub(off); pose(h, mid); }
      if (this._smoothOn() && U.fingers && this.stateAt) hand.quaternion.copy(this._smoothHand(s, t, hand.quaternion));
      this.arms[s].elbow = mid; this.arms[s].joint = true; this.arms[s].shoulder = sh.clone();
      hand.visible = true;
      this._armMesh(s, sh, mid, h, hand);
    }
    // ---- legs and feet: the foot where the timeline puts it (gait, plant, foot targets, sit, kneel, tap), the knee
    // from a two-bone solve toward the front
    for (const s of ["R", "L"]) this._leg(st, s, S, pl);
    if (this.patch) this._patch();
    if (this.tail) this._tail(st, t, S);
    this.costume.apply(st, t, hands, false);
    if (this.seamless) for (const s of ["R", "L"]) { this._skin(s, true); const a = this.arms[s]; if (a.tubeInk) a.tubeInk.visible = false; }
  }
  _smoothOn() { return HAND2 && SMOOTH; }

  // the arm's tube: sleeve from inside the shoulder to the cuff, then (Pip) bare forearm to the wrist; the radius and
  // colour follow the distance along it, so the cuff sits at the same place on the forearm in every pose
  _armMesh(s, sh, el, h, hand) {
    const Y = this.def.limbStyle.arm, sx = s === "R" ? -1 : 1, U = hand.userData;
    const fy = h.clone().sub(el).normalize(), wrist = h.clone().addScaledVector(fy, -U.size * 0.055);
    const inS = sh.clone().add(V(-sx * 0.035, 0.0, 0));
    const pts = smoothPath([inS, sh, sh.clone().lerp(el, 0.5), el, el.clone().lerp(wrist, 0.5), wrist], 30);
    const Lu = sh.distanceTo(el), Lf = el.distanceTo(wrist), tot = 0.035 + Lu + Lf, ue = (0.035 + Lu) / tot;
    const cuffAt = 1 - (Y.cuff?.from ?? 0.05) / tot, cuffTo = 1 - (Y.cuff?.to ?? 0.0) / tot, bare = Y.bare ? 1 - Y.bare / tot : 2;
    const r = (u) => {
      let k = u < ue ? Y.r[0] + (Y.r[1] - Y.r[0]) * (u / ue) : Y.r[1] + (Y.r[2] - Y.r[1]) * ((u - ue) / (1 - ue));
      if (u >= cuffAt && u <= cuffTo) k = Y.cuff.r;
      if (u > bare) k = Y.skinR;
      return k;
    };
    // a knit cuff (Rusty, Moss: the sheets' ribbed cuffs) gets ribs round it; Pip's rolled jacket cuff stays plain
    const rib = Y.cuff?.rib ? new THREE.Color(Y.cuff.rib) : null;
    const col = (u, a) => (u > bare ? Y.skin : u >= cuffAt && u <= cuffTo ? (rib ? new THREE.Color(Y.cuff.color).lerp(rib, sstep(0.25, 0.6, Math.abs(Math.sin(a * 7)))) : Y.cuff.color) : mixHex(Y.color, Y.shade || Y.color, 0.3 * Math.abs(Math.sin(u * 9))));
    this.arms[s].mesh.geometry = tubeMesh(pts, { radial: 16, radius: capped(r, 0.04, 0.02), color: col, ref: V(sx, 0, 0), geo: this.arms[s].mesh.geometry });
    this.arms[s].upper = [sh.clone(), el.clone()];
  }
  _patch() {
    const [a, b] = this.arms.R.upper, sx = -1, mid = a.clone().lerp(b, 0.42), ax = b.clone().sub(a).normalize();
    // outward: square to the upper arm, toward the outer side (anatomical right = -x)
    const outw = V(sx, 0, 0).addScaledVector(ax, -ax.x * sx).normalize();
    const r = this.def.limbStyle.arm.r[0] * 0.95 + 0.004;
    this.patch.position.copy(mid).addScaledVector(outw, r);
    _m.makeBasis(new THREE.Vector3().crossVectors(ax, outw), ax, outw); this.patch.quaternion.setFromRotationMatrix(_m);
  }

  _leg(st, s, S, pl) {
    const A = this.A, sx = s === "R" ? -1 : 1, R = this.root, Y = this.def.limbStyle.leg;
    const hx = A.stance;
    const ph = st.walk * 6.283 + (s === "R" ? 0 : Math.PI), sd = st.stride ?? 1, lift = st.walkAmt * Math.max(0, Math.sin(ph)) * 0.07 * sd;
    const foot = V(sx * hx, 0.035 + lift + st.tuck * 0.08, 0.02 + st.walkAmt * Math.cos(ph) * 0.06 * sd);
    if (st.gait) {
      const G = st.gait, u = (((G.ph + (s === "R" ? 0 : 0.5)) % 1) + 1) % 1, ST = 0.58, Aa = 0.5 * ST * 0.2 * G.sd * G.amt;
      let along, up = 0;
      if (u < ST) along = Aa * (1 - (2 * u) / ST);
      else { const w = (u - ST) / (1 - ST); along = -Aa + 2 * Aa * (w - Math.sin(2 * Math.PI * w) / (2 * Math.PI)); up = Math.sin(Math.PI * w) * 0.065 * Math.min(1.4, G.sd) * G.amt; }
      foot.set(sx * hx + along * G.dir[0], 0.035 + up + st.tuck * 0.08, 0.02 + along * G.dir[1]);
    }
    const kn = st.kneel || 0, si = st.sit || 0;
    foot.y += 0.1 * kn; foot.z -= 0.14 * kn;
    const sf = st.sitFeet || [0.24, -0.01];
    foot.set(foot.x + sx * 0.02 * si, foot.y + sf[1] * si, foot.z + sf[0] * si);
    const F = this.legs[s].foot;
    if (pl) { const planted = R.worldToLocal(foot.clone().applyMatrix4(this._plantM)); foot.lerp(planted, 1 - pl.w); F.quaternion.identity().slerp(this._footQ, 1 - pl.w); }
    else F.quaternion.identity();
    const ftg = st.feet?.[s], fw = ftg ? clamp(ftg.w ?? 1) : 0;
    if (fw > 0) {
      R.updateMatrix(); const inv = new THREE.Matrix4().copy(R.matrix).invert();
      foot.lerp(V(ftg.x, ftg.y, ftg.z).applyMatrix4(inv), fw);
      if (ftg.yaw != null) F.quaternion.slerp(R.quaternion.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ftg.yaw)), fw);
    }
    const tp = st.tap?.[s] || 0;
    if (tp > 0) { const ang = 0.5 * tp; foot.y += 0.094 * Math.sin(ang); foot.z -= 0.094 * (1 - Math.cos(ang)); F.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -ang)); }
    // the hip joint rides the squashed torso; the ankle is the foot's own ankle point
    const hipJ = V(sx * A.hip[0] * S.x, A.hip[1] - 0.02 * (S.y < 1 ? (1 - S.y) * 10 : 0), 0.0);
    F.position.copy(foot); F.updateMatrix();
    const ankle = F.userData.ankle.clone().applyMatrix4(F.matrix);
    const fwd = V(0, 0, 1).applyQuaternion(F.quaternion), pole = fwd.clone().add(V(sx * 0.15, 0.25 * si, 0)).normalize();
    const ik = twoBone(hipJ, ankle, A.leg[0], A.leg[1], pole);
    this.legShort[s] = ik.short;
    if (ik.short > 0) { F.position.add(ik.end.clone().sub(ankle)); }   // out of reach (a hop): the foot hangs from the leg
    const knee = ik.mid, end = ik.end;
    const top = hipJ.clone().add(V(-sx * 0.03, 0.05, 0));
    const pts = smoothPath([top, hipJ, hipJ.clone().lerp(knee, 0.5), knee, knee.clone().lerp(end, 0.5), end, end.clone().add(V(0, -0.02, 0))], 30);
    const Lt = top.distanceTo(hipJ) + hipJ.distanceTo(knee), Ls = knee.distanceTo(end), tot = Lt + Ls + 0.02, uk = Lt / tot;
    const r = (u) => (u < uk ? Y.r[0] + (Y.r[1] - Y.r[0]) * (u / uk) : Y.r[1] + (Y.r[2] - Y.r[1]) * ((u - uk) / (1 - uk)));
    let rad = r, col = () => Y.color;
    if (Y.cuff) {   // Pip: baggy trousers to a rolled cuff below the knee, then bare shin into the boot
      const c0 = uk + Y.cuff.at * (1 - uk), c1 = c0 + Y.cuff.len / tot;
      rad = (u) => (u < c0 ? r(u) * (1 + 0.25 * Math.sin(Math.PI * clamp(u / c0))) : u < c1 ? Y.cuff.r : Y.skinR);
      col = (u) => (u < c0 ? mixHex(Y.color, Y.shade, 0.3 * Math.abs(Math.sin(u * 13))) : u < c1 ? Y.cuff.color : Y.skin);
    } else {   // fur legs: soft clumps round the leg (the sheet's fluffy thighs), grooves a shade darker
      if (Y.top) col = (u) => mixHex(Y.top, Y.color, sstep(0.05, 0.4, u));
      const c0 = col, r0 = rad, clump = (u, a) => { const f = (a * 7) / (2 * Math.PI) + u * 3, q = f - Math.floor(f); return Math.pow(Math.sin(Math.PI * q), 0.6); };
      rad = (u, a) => r0(u) * (0.97 + 0.06 * clump(u, a));
      col = (u, a) => new THREE.Color(c0(u)).multiplyScalar(0.9 + 0.1 * clump(u, a));
    }
    this.legs[s].mesh.geometry = tubeMesh(pts, { radial: 16, radius: capped(rad, 0.05, 0.03), color: col, ref: V(0, 0, 1), geo: this.legs[s].mesh.geometry });
    this.legs[s].knee = knee;
  }

  // ears: a root pivot each; lift/splay channels from the timeline, a little from the face (droop on worry, lift on
  // surprise) and the head's follow-through. Bounded by the design's range
  _ears(st, e, ft) {
    const f = st.face || {}, auto = clamp((e.eye - 1) * 1.6 + (e.open > 0.6 ? 0.2 : 0), -0.3, 0.6) - clamp((e.tilt - 0.3) * 1.5, 0, 0.6) * clamp(-e.curve + 0.2);
    this.ears.forEach((E, i) => {
      const s = i ? 1 : -1, k = i ? "L" : "R", lift = clamp((f[`ear${k}`] ?? 0) + 0.5 * auto, -1, 1), splay = clamp(f[`splay${k}`] ?? 0, -1, 1), r = E.range;
      const [x, y, z] = E.rest;
      if (this.def.earMode === "side") E.pivot.rotation.set(x - 0.1 * ft.f, y + s * 0.4 * r * splay, z + s * r * lift - 0.15 * ft.s);
      else E.pivot.rotation.set(x - r * 0.8 * lift + 0.2 * ft.f, y, z - s * r * (0.6 * splay - 0.4 * Math.min(0, lift)) - 0.1 * ft.s);
    });
  }

  // ------------------------------------------------------------------------------------------- Rusty's tail
  // Seven joints along a fixed 0.8 m: the authored attitudes (calm curve, alert lift, embarrassed wrap) blended by
  // channel, a wag on top, lag from the body's turn (rebuilt from the state a moment ago, so a frame never depends on
  // the frame before), then kept off the floor and out of the body and legs. tailPin holds the tail's middle under the
  // right paw: that joint is fixed to the paw and only the part past it moves.
  _tail(st, t, S) {
    const T = this.def.tail, A = this.A, f = st.face || {}, n = 7, seg = T.length / (n - 1);
    const root = V(0, A.hip[1] + (T.root[1] - A.hip[1]) * S.y, T.root[2] * S.z);
    const w = { lift: clamp(f.tailLift || 0), wrap: clamp(f.tailWrap || 0), alarm: clamp(f.tailAlarm || 0) };
    const dirs = [];
    for (let i = 0; i < n - 1; i++) {
      const d = V(...T.calm[i]).normalize();
      d.lerp(V(...T.lift[i]).normalize(), Math.max(w.lift, 0.6 * w.alarm)).lerp(V(...T.wrap[i]).normalize(), w.wrap).normalize();
      dirs.push(d);
    }
    // wag: side to side about the vertical, growing toward the tip (a pleased wag is ~2 Hz)
    const wag = clamp(f.tailWag || 0), idle = 0.06 * Math.sin(t * 2 * Math.PI * 0.35 + 0.7);
    // lag: the body turned recently -> the tail trails behind the turn (yaw rate from the state 0.1 s ago)
    let lag = 0;
    if (this.stateAt) { const p = this.stateAt(Math.max(0, t - 0.1)), q = this.stateAt(Math.max(0, t - 0.2)); if (p && q) { let dy = p.yaw - q.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; lag = clamp(-dy * 2.2, -0.6, 0.6); } }
    for (let i = 0; i < dirs.length; i++) {
      const k = (i + 1) / dirs.length, ang = (wag * 0.55 * Math.sin(t * 2 * Math.PI * 2.1 - i * 0.7) + idle + lag) * k;
      dirs[i].applyAxisAngle(V(0, 1, 0), ang);
    }
    const J = [root.clone()]; for (const d of dirs) J.push(J[J.length - 1].clone().addScaledVector(d, seg));
    // pin: the joint at 0.6 of the length goes to the right paw's palm; the joints before it bend smoothly to reach it
    const pin = clamp(f.tailPin || 0);
    this.tailPinErr = 0;
    if (pin > 0) {
      const hp = this.arms.R.hand.position.clone(), k = 4, target = J[k].clone().lerp(hp.clone().add(V(0, -0.03, 0)), pin);
      // re-solve the first k segments as a FABRIK chain from the root to the target (lengths kept)
      const C = J.slice(0, k + 1).map((p) => p.clone());
      for (let it = 0; it < 12; it++) {
        C[k].copy(target); for (let i = k - 1; i >= 0; i--) { const d = C[i].clone().sub(C[i + 1]).setLength(seg); C[i].copy(C[i + 1]).add(d); }
        C[0].copy(root); for (let i = 1; i <= k; i++) { const d = C[i].clone().sub(C[i - 1]).setLength(seg); C[i].copy(C[i - 1]).add(d); }
      }
      const off = C[k].clone().sub(J[k]);
      for (let i = 0; i <= k; i++) J[i].copy(C[i]);
      for (let i = k + 1; i < n; i++) J[i].add(off);
      this.tailPinErr = C[k].distanceTo(target) * pin;
    }
    // keep off the floor (root space: the floor is y = -st.y / scale) and out of the torso and the thighs
    const floor = -(st.y || 0) / (st.scale ?? 1), rMax = T.radius * (1 + 0.12 * w.alarm);
    const rad = (u) => rMax * (u < 0.12 ? 0.45 + 0.55 * (u / 0.12) : u < 0.55 ? 0.82 + 0.18 * Math.sin(Math.PI * ((u - 0.12) / 0.43) * 0.5) : 1 - 0.35 * ((u - 0.55) / 0.45) ** 1.5);
    const torsoE = { c: V(0, A.hip[1] + 0.17 * S.y, 0.01), r: V(0.235 * S.x, 0.3 * S.y, 0.175 * S.z) };
    this.tailClear = { floor: Infinity, body: Infinity };
    // (pinned: only the joints past the pin are pushed; the same three passes either way, so the pin easing in never
    // changes the solve in one frame)
    const first = pin > 0 ? 5 : 1;
    for (let it = 0; it < 3; it++) {
      for (let i = first; i < n; i++) {
        const u = i / (n - 1), r = rad(u) * 0.9, p = J[i];
        if (p.y < floor + r + 0.01) p.y = floor + r + 0.01;
        const d = p.clone().sub(torsoE.c), ex = Math.hypot(d.x / (torsoE.r.x + r), d.y / (torsoE.r.y + r), d.z / (torsoE.r.z + r));
        if (ex < 1 && i > 1) p.copy(torsoE.c).add(d.multiplyScalar(1 / ex));
        // the segment keeps its length from the joint before it (pushed joints pull the rest along)
        const dir = p.clone().sub(J[i - 1]); p.copy(J[i - 1]).add(dir.setLength(seg));
      }
    }
    for (let i = 1; i < n; i++) {
      const u = i / (n - 1), r = rad(u) * 0.9, p = J[i];
      this.tailClear.floor = Math.min(this.tailClear.floor, p.y - floor - r);
      const d = p.clone().sub(torsoE.c); if (i > 1) this.tailClear.body = Math.min(this.tailClear.body, (Math.hypot(d.x / torsoE.r.x, d.y / torsoE.r.y, d.z / torsoE.r.z) - 1) * 0.2);
    }
    this.tailJoints = J;
    const pts = smoothPath([J[0].clone().add(V(0, 0.03, 0.06)), ...J], 44);
    const B = T.bands, col = (u) => {
      let c = new THREE.Color(T.light);
      for (let k = 0; k < 6; k++) { const ck = B.start + k * B.step; c = c.lerp(new THREE.Color(T.dark), sstep(B.width * 0.5 + 0.012, B.width * 0.5 - 0.012, Math.abs(u - ck))); }
      if (u < 0.06) c.lerp(new THREE.Color(T.base), 1 - u / 0.06);
      return c.lerp(new THREE.Color(T.tip), sstep(0.9, 0.97, u));
    };
    // fur: the radius ruffles round the tube in clumps that twist a little along it (the sheet's fluffy plume), the
    // grooves between clumps a shade darker; fixed in u and angle, so the clumps stay put on the tail in every pose
    const clump = (u, a) => { const f = (a * 9) / (2 * Math.PI) + u * 4.5, q = f - Math.floor(f); return Math.pow(Math.sin(Math.PI * q), 0.6); };
    const fluffR = (u, a) => rad(u) * (0.93 + 0.13 * clump(u, a) * sstep(0.04, 0.12, u));
    const fluffC = (u, a) => col(u).multiplyScalar(0.9 + 0.1 * clump(u, a));
    this.tail.geometry = tubeMesh(pts, { radial: 36, radius: capped(fluffR, 0.03, 0.09), color: fluffC, ref: V(0, 1, 0), geo: this.tail.geometry });
    // the checks' balls: one per segment, at its middle, the tube's radius there
    this.tailBalls.forEach((b, i) => { const u = (i + 0.5) / (n - 1); b.position.copy(J[i]).lerp(J[i + 1], 0.5); b.scale.setScalar(rad(u)); });
  }

  // ------------------------------------------------------------------------------------------- telemetry
  // the shared measures (potato.js contact: hand turns, how far across the body each hand reaches), plus the friends'
  // own: how far each hand and foot fell short of its target (a reach the arm can't make), the tail's clearance from
  // the floor and the body and its pin error
  contact() {
    const out = super.contact();
    out.reach = { R: +this.reachShort.R.toFixed(3), L: +this.reachShort.L.toFixed(3), fR: +this.legShort.R.toFixed(3), fL: +this.legShort.L.toFixed(3) };
    if (this.tail) out.tail = { floor: +this.tailClear.floor.toFixed(3), body: +this.tailClear.body.toFixed(3), pin: +(this.tailPinErr || 0).toFixed(3) };
    return out;
  }
  rig() {
    const out = super.rig();
    for (const s of ["R", "L"]) if (this.legs[s].knee) out[`k${s}`] = this.legs[s].knee.clone();
    if (this.tailJoints) out.tT = this.tailJoints[this.tailJoints.length - 1].clone();
    this.headGroup.updateMatrixWorld(true); this.root.updateMatrixWorld(true);
    out.hd = this.headGroup.getWorldPosition(new THREE.Vector3()).applyMatrix4(this.root.matrixWorld.clone().invert());
    return out;
  }
  // the head's centre in the world (stage.js: a face turned away from the camera)
  headCenter() { this.headGroup.updateMatrixWorld(true); return V(...this.D.head.center).applyMatrix4(this.headGroup.matrixWorld); }
  costumeMeshes() { return super.costumeMeshes().filter((c) => !c.o.userData.bodyPart || c.o.userData.bodyPart === "tail"); }
}
