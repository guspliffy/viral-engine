import * as THREE from "three";
const _fist = new THREE.Quaternion();
// the thumb on a slab's front (grip edge, timeline.js phoneEdge): its pivot's place and turn in the hand
const _edgeThumb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.46, -0.118, 1.006)), _edgeThumbAt = new THREE.Vector3(0.0273, 0.0086, 0.023);
// the glove thumb's tip (the centre of its end) in its pivot's frame: the capsule at (0.024, 0.018) turned -0.75
const THUMB_TIP = new THREE.Vector3(0.024 + 0.017 * Math.sin(0.75), 0.018 + 0.017 * Math.cos(0.75), 0);
const fistWeight = (curl) => { const w = Math.min(1, Math.max(0, (curl - 0.6) / 0.3)); return w * w * (3 - 2 * w); };
import { Face, EXPRESSIONS } from "./face.js";
import { buildCostume } from "./costumes.js";
import { buildFries } from "./props.js";
import { rng } from "./util.js";
import { taperedTube } from "./geo.js";
import { cone, meshShape, inkMaterial } from "./handmesh.js";

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
    const speckM = new THREE.MeshStandardMaterial({ color: new THREE.Color(B.color).multiplyScalar(0.8), roughness: 0.9 });
    speckM.userData.noOutline = true;
    for (let i = 0; i < (B.specks ?? 9); i++) {
      const th = (rnd() * 2 - 1) * 2.6, ph = (rnd() * 2 - 1) * 0.9;
      if (Math.abs(th) < 0.65 && ph > -0.45 && ph < 0.6) continue; // keep the face clear
      const s = this.surf(th, ph);
      // flat, low-contrast marks sunk into the skin (a colour patch, not a bead stuck on it)
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018 + rnd() * 0.014, 12, 8), speckM);
      m.scale.set(1, 1, 0.12); m.position.copy(s.pos).addScaledVector(s.normal, -0.0015); m.lookAt(s.pos.clone().add(s.normal));
      this.potatoParts.add(m);
    }

    // face
    const F = def.face || {};
    this.face = new Face({ size: 1, iris: F.iris, cheeks: F.cheeks, brow: F.brow, lids: F.lids === false ? null : this.skin, eye: F.eye, browShape: F.browShape, blush: F.blush, place: (u, vv) => this.surf(u * 0.74, vv * 0.55 - 0.05) });
    this.potatoParts.add(this.face.group);

    // limbs
    this.limbMat = new THREE.MeshStandardMaterial({ color: def.limbs.color, roughness: 0.5 });
    if (def.hands?.type === "glove") this.limbMat.userData.lookRole = "glove";   // looks.js: its own toon values
    if (globalThis.__DIAG?.colors) this.limbMat = new THREE.MeshLambertMaterial({ color: "#3060e0" });   // arms and legs blue
    this.limbW = def.limbs.width;
    this.seamless = def.hands?.type === "glove" && !!def.hands?.seamless;
    this.arms = { R: { mesh: null, hand: null }, L: { mesh: null, hand: null } };
    this.legs = { R: { mesh: null, foot: null }, L: { mesh: null, foot: null } };
    for (const s of ["R", "L"]) {
      const hand = ["mitten", "glove"].includes(def.hands?.type ?? "mitten") ? this._mitten(s) : new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 14), this.limbMat);
      hand.castShadow = true; this.root.add(hand); this.arms[s].hand = hand;
      if (this.seamless) this._skinInit(s);
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
    const glove = this.def.hands?.type === "glove";
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), M("#e03030")); g.add(palm); palm.castShadow = true;
    palm.userData.rest = glove ? [0.88, 0.82, 0.55] : [1, 0.95, 0.78]; palm.scale.fromArray(palm.userData.rest);
    const piv = (x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p; };
    let fingers, index, thumb;
    const bends = [], digits = [], rolls = [];
    if (glove) {
      // hands.type "glove": Jonny's hand & grip study, a cartoon glove with four separate rounded fingers, a thumb and
      // a wrist. Each finger bends at the knuckle (fingers / index pivot) and again half way (bends), so a curl rolls it
      fingers = piv(-0.002, 0.034, 0); index = piv(0.031, 0.034, 0.002);
      const finger = (parent, x, len, r, spread) => {
        const base = new THREE.Group(); base.position.x = x; base.rotation.z = spread; parent.add(base);
        const a = new THREE.Mesh(cap(r, len * 0.5), M("#ff9a20")); a.position.y = len * 0.25 + r * 0.6; a.castShadow = true; base.add(a);
        const mid = new THREE.Group(); mid.position.y = len * 0.5 + r * 0.6; base.add(mid); bends.push(mid);
        const b = new THREE.Mesh(cap(r * 0.97, len * 0.38), M("#ff9a20")); b.position.y = len * 0.19 + r * 0.4; b.castShadow = true; mid.add(b);
        // the seamless skin's bones: a finger thickest just past its root, tapering to a round tip (hands.seamless)
        a.userData.seg = { half: len * 0.25, r1: r * 1.02, r2: r * 0.95 }; b.userData.seg = { half: len * 0.19, r1: r * 0.95, r2: r * 0.8 };
        digits.push([a, b]);
        // round knuckles: a ball where the finger leaves the palm and one in the middle joint, so a curled finger reads as
        // a soft rolled glove finger instead of two blocks with a crease between them
        const k0 = new THREE.Mesh(new THREE.SphereGeometry(r * 1.04, 14, 10), M("#ff9a20")); k0.position.y = r * 0.35; base.add(k0);
        const k1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.99, 14, 10), M("#ff9a20")); mid.add(k1);
      };
      // short, plump fingers (Jonny's hand study: the glove's fingers are about as long as the palm is deep); hands.fingers
      // 3: three fingers and a thumb (Jonny, 29 Oct), the outer two a little fatter to fill the palm
      const H3 = this.def.hands?.fingers === 3, sp = this.def.hands?.spread ?? 1;
      if (H3) { finger(fingers, 0.004, 0.041, 0.0185, 0.03 * sp); finger(fingers, -0.031, 0.036, 0.0178, 0.17 * sp); }
      else { finger(fingers, 0.011, 0.034, 0.0175, -0.01); finger(fingers, -0.017, 0.032, 0.017, 0.03); finger(fingers, -0.042, 0.026, 0.0157, 0.08); }
      finger(index, 0, H3 ? 0.038 : 0.032, 0.0175, H3 ? -0.1 * sp : -0.04);
      // the index finger's pad, on the palm side of its last joint: a fingertip pinch (grip pinch > 0) closes on it
      const pad = new THREE.Object3D(); pad.position.set(0, 0.016, 0.017); bends[bends.length - 1].add(pad); g.userData.pad = pad;
      thumb = piv(0.044, -0.01, 0.012);
      const th = new THREE.Mesh(cap(0.0165, 0.034), M("#e020e0")); th.position.set(0.024, 0.018, 0); th.rotation.z = -0.75; th.castShadow = true; thumb.add(th);
      th.userData.seg = { half: 0.017, r1: 0.019, r2: 0.0145 }; digits.push([th]);
      // the wrist: the heel of the hand narrowing into the forearm
      const w = (this.def.limbs.width * 0.82) / g.userData.size, heel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, w, 0.05, 20, 1), M("#e03030"));
      heel.position.y = -0.052; heel.scale.z = 0.66; heel.castShadow = true; g.add(heel);
    } else {
      fingers = piv(-0.012, 0.04, 0); const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.046, 20, 14), M("#ff9a20"));
      mitt.scale.set(1.05, 1.05, 0.8); mitt.position.y = 0.045; mitt.castShadow = true; fingers.add(mitt);
      index = piv(0.032, 0.04, 0.004); const ix = new THREE.Mesh(cap(0.017, 0.036), M("#f5e020")); ix.position.y = 0.032; ix.castShadow = true; index.add(ix);
      thumb = piv(0.042, -0.008, 0.016); const th = new THREE.Mesh(cap(0.019, 0.03), M("#e020e0"));
      th.position.set(0.026, 0.012, 0); th.rotation.z = -1.0; th.castShadow = true; thumb.add(th);
      // hands.wrist: the heel of the hand, a short cone from the forearm's wrist out to the palm
      if (this.def.hands?.wrist) {
        const w = (this.def.limbs.width * 0.78) / g.userData.size, heel = new THREE.Mesh(new THREE.CylinderGeometry(0.046, w, 0.055, 20, 1), M("#e03030"));
        heel.position.y = -0.05; heel.scale.z = 0.8; heel.castShadow = true; g.add(heel);
      }
    }
    // the handle runs along x through the curl of the fingers, between them and the top of the palm
    const grip = dc ? new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff", depthTest: false })) : new THREE.Object3D();
    grip.position.set(0.002, 0.04, 0.016); g.add(grip);
    // the fist on a handle (staff, scythe, sword): three finger rolls wrapped round the shaft, stacked along it, their
    // knuckles making a three-bump arc on the outer side, and a thumb lying over the top and across the front towards
    // the body (Jonny's reference grip). The mitten fingers shrink away as this closes in, so the change never pops.
    const fist = new THREE.Group(); fist.position.copy(grip.position); fist.scale.setScalar(0.001); fist.visible = false; g.add(fist);
    [[-0.027, 0.015, M("#ff9a20")], [-0.001, 0.0158, M("#ff9a20")], [0.024, 0.0148, M("#ff9a20")]].forEach(([x, tr, mm], i) => {
      const R = 0.019 + tr, pts = [];
      for (let k = 0; k <= 12; k++) { const ph = (-60 + (k * 255) / 12) * (Math.PI / 180); pts.push(new THREE.Vector3(x, R * Math.cos(ph), R * Math.sin(ph))); }
      const roll = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 24, 10, (t) => tr * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.15)))), mm);
      roll.castShadow = true; fist.add(roll); rolls.push({ pts, tr });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(tr * 0.78, 10, 8), mm); tip.position.copy(pts[pts.length - 1]); fist.add(tip);   // fingertip
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(tr * 1.05, 12, 10), mm); knuckle.position.copy(pts[2]); fist.add(knuckle);
    });
    const tf = new THREE.Mesh(cap(0.0145, 0.03), M("#e020e0")); tf.rotation.x = Math.PI / 2 - 0.35; tf.rotation.z = -0.25;
    tf.rotation.order = "ZXY"; tf.position.set(0.04, -0.012, 0.03); tf.castShadow = true; fist.add(tf);
    if (glove) g.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });   // fingers shade each other
    // where a fingertip pinch holds a thin prop (a straw): between the index pad and the thumb, set by _pose
    const pinchPt = new THREE.Object3D(); g.add(pinchPt);
    g.userData = { ...g.userData, fingers, index, thumb, thumbRest: thumb.position.clone(), grip, fist, palm, side: s, bends, glove, pinchPt, digits, rolls };
    // hands.seamless: the parts stay as the hand's bones (posed, measured by the contact checks) but aren't drawn; one
    // skin grown over them is (Character._skin)
    if (glove && this.def.hands?.seamless) g.traverse((o) => { if (o.isMesh) o.layers.set(1); });
    return g;
  }
  // aim a mitten along the forearm (elbow -> hand) with the palm turned in towards the body, and curl it to the grip
  // axis: the held handle's direction (a staff, a scythe). A closed hand then turns its fist around it: the handle runs
  // through the curled fingers from the little finger to the thumb, thumb on top, knuckles out, fingers pointing forward.
  // sh, mv: the shoulder, and how far the arm is into a move (0 at either end, 1 half way)
  _pose(hand, elbow, at, sx, gr, axis = null, palm = null, sh = null, mv = 0, frame = null) {
    const U = hand.userData, y = at.clone().sub(elbow);
    // the hand aims along elbow -> hand. When a moving hand sweeps past the elbow point (an arm swinging out from the
    // side to reach), that line shrinks to nothing and turns round in a frame or two, which spun the hand; below 14 cm
    // the shoulder -> hand line takes over smoothly, as the arm's own curve does near its end. Only during a move, so a
    // pose at rest keeps its own hand; for now only on a reach to or from a held object (palm), the one place it is tested
    if (sh && mv > 0 && palm) { const k = Math.min(1, Math.max(0, (0.14 - y.length()) / 0.1)) * mv; if (k > 0) y.addScaledVector(at.clone().sub(sh).normalize(), 0.15 * k * k * (3 - 2 * k)); }
    if (y.lengthSq() < 1e-8) y.set(0, -1, 0); y.normalize();
    const z = new THREE.Vector3(-sx, 0, 0.35).normalize();
    z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize();
    hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
    // the fist turns onto the handle as the hand closes (curl 0.6 -> 0.9), so opening or closing it never pops. The
    // forearm direction, taken square to the handle, is the hand's own axis: the wrist enters the fist from the side and
    // the handle passes in front of the palm (grip frame: +x along the handle, thumb end; +z palm side)
    // a fingertip pinch (grip pinch, glove hands) turns the hand onto the axis too, without closing the fist on it
    const pw = U.glove ? Math.min(1, Math.max(0, gr.pinch || 0)) : 0;
    const w = axis ? Math.max(fistWeight(gr.curl), pw) : 0;
    if (w > 0) {
      const x = axis.clone().normalize().multiplyScalar(sx > 0 ? -1 : 1);   // the mirrored left hand's thumb is at -x
      // the knuckles face the forearm direction square to the handle, pulled towards out-and-forward from the body: when the
      // forearm runs along the handle (a raised staff) that direction shrinks to nothing and would spin the fist end-on
      // or flip it, so the steady out-and-forward pull takes over, smoothly, and keeps the knuckles to the front
      const o = new THREE.Vector3(at.x, 0, 0).normalize().add(new THREE.Vector3(0, 0, 1));
      if (at.x === 0) o.set(-sx, 0, 1);
      // a pinch keeps the fingers running on along the forearm (a pen hold), not pulled out to the front
      const f = y.clone().addScaledVector(x, -y.dot(x)).addScaledVector(o.addScaledVector(x, -o.dot(x)), 1.4 * (1 - pw));
      if (f.lengthSq() < 1e-6) f.set(-sx, 0, 0); f.normalize();
      // roll: the hand turned about the held axis (degrees), to show the pinch to the camera
      if (gr.roll) f.applyAxisAngle(x, (gr.roll * Math.PI) / 180);
      // lean: a pinch's knuckle line tips off the held axis (degrees, the little finger end back towards the wrist), so
      // the curled fingers stay clear of a straw that runs on below the fingertips, as in Jonny's grip reference
      if (gr.lean) { const l = (gr.lean * Math.PI) / 180, x0 = x.clone(); x.multiplyScalar(Math.cos(l)).addScaledVector(f, Math.sin(l)); f.multiplyScalar(Math.cos(l)).addScaledVector(x0, -Math.sin(l)); }
      U.fistPar = Math.abs(y.dot(x));
      // fwd: the fist turns its knuckles to face forward (a mug or teacup handle held beside the cup: the fingers wrap
      // the front of the handle and the palm faces the cup)
      if (gr.fwd) { f.lerp(new THREE.Vector3(0, 0, 1), gr.fwd).addScaledVector(x, -f.dot(x)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize(); }
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, f, new THREE.Vector3().crossVectors(x, f)));
      hand.quaternion.slerp(_fist, w);
    }
    // a cupped hand (grip up > 0): the palm turns to face up, fingers still pointing along the forearm, so a jar or an
    // orb sits in it from below
    // a hand on something it holds (arm pose palm): the palm turns to face that point, the fingers still pointing along
    // the forearm as far as they can, so they lie on the jar instead of turning away from it. wrap: the palm faces the
    // axis level and the fingers go round it on the side away from the body (a jar held from behind: fingers across its
    // back, thumb up)
    if (palm && palm.w > 0) {
      const zp = palm.at.clone().sub(at), fy = y.clone();
      if (palm.wrap) zp.y = 0;
      if (zp.lengthSq() > 1e-6) {
        zp.normalize();
        if (palm.wrap) { fy.crossVectors(new THREE.Vector3(0, 1, 0), zp); if ((palm.side ?? fy.x * at.x + fy.z * at.z) < 0) fy.negate(); }
        fy.addScaledVector(zp, -fy.dot(zp));
        if (fy.lengthSq() > 1e-6) {
          fy.normalize();
          _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fy, zp), fy, zp));
          // close to half a turn from the hand's own pose, the shortest way round swaps sides from one frame to the next
          // and spun the hand as it turned in or out (a reach, a release). Part way, the palm then turns only as the arm
          // swings round and the way gets clear (fully below about 140 degrees); a hand on its hold (w 1) is untouched
          const k = Math.min(1, Math.abs(hand.quaternion.dot(_fist)) / 0.35), f = k * k * (3 - 2 * k);
          const g = Math.min(1, Math.max(0, (palm.w - 0.85) / 0.15)), on = g * g * (3 - 2 * g);
          hand.quaternion.slerp(_fist, palm.w * f + (1 - f) * on);
        }
      }
    }
    // a hand locked to what it holds (arm pose frame, timeline.js): its rotation is the hold's, whatever the forearm does
    if (frame && frame.w > 0) hand.quaternion.slerp(frame.q, frame.w);
    const up = Math.min(1, Math.max(0, gr.up || 0));
    if (up > 0) {
      const zu = new THREE.Vector3(0, 1, 0), f = y.clone().addScaledVector(zu, -y.dot(zu)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zu), f, zu));
      hand.quaternion.slerp(_fist, up);
    }
    // a paw resting on a surface (grip down > 0): the palm turns to face the floor and the fingers point ahead (grip
    // ahead: 0 along the forearm .. 1 straight forward), so the curled fingers show their knuckles to the camera
    const dn = Math.min(1, Math.max(0, gr.down || 0));
    if (dn > 0) {
      const zd = new THREE.Vector3(0, -1, 0), f = y.clone(); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      f.lerp(new THREE.Vector3(0, 0, 1), gr.ahead ?? 0.7); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zd), f, zd));
      hand.quaternion.slerp(_fist, dn);
    }
    // y x z points forward for the right hand; the left hand is its mirror image, so the thumb is in front on both
    const k = U.size || 1; hand.scale.set(sx > 0 ? -k : k, k, k);
    if (U.glove) {   // the knuckle takes half the bend, the middle joint the rest (the last finger is the index)
      U.fingers.rotation.x = 0.85 * gr.curl; U.index.rotation.x = 0.85 * gr.index;
      // a resting paw (grip down) tucks its fingertips under onto the table, so only a short rounded finger run shows
      U.bends.forEach((b, i) => { b.rotation.x = 1.0 * (i === U.bends.length - 1 ? gr.index : gr.curl) + 0.45 * Math.min(1, gr.down || 0); });
    } else { U.fingers.rotation.x = 1.65 * gr.curl; U.index.rotation.x = 1.75 * gr.index; }
    U.thumb.rotation.set(0, -1.15 * gr.thumb, 0.35 * gr.thumb);
    // on a handle the wrapped fist (U.fist) takes over from the mitten fingers
    const tw = axis && !(pw > 0) ? fistWeight(gr.curl) : 0, keep = Math.max(0.001, 1 - tw);   // a pinch keeps its own fingers
    U.thumb.position.copy(U.thumbRest);
    // grip edge (phoneEdge): the thumb's root moves up the front of the palm and the thumb lies across the slab's front,
    // its pad just past the edge (the glove's thumb is too short to reach round a thin edge from its resting root)
    const ed = Math.min(1, Math.max(0, gr.edge || 0));
    if (ed > 0) { U.thumb.quaternion.slerp(_edgeThumb, ed); U.thumb.position.lerp(_edgeThumbAt, ed); }
    U.fist.visible = tw > 0.001; U.fist.scale.setScalar(Math.max(0.001, tw));
    // a closed fist is more compact than the open mitten, and its palm draws back behind the handle so the handle always
    // runs through the fingers, never through the palm
    const pr = U.palm.userData.rest; U.palm.scale.set(pr[0], pr[1], pr[2] - 0.18 * tw).multiplyScalar(1 - 0.15 * tw); U.palm.position.z = -0.034 * tw;
    for (const part of [U.fingers, U.index, U.thumb]) { part.visible = keep > 0.002; part.scale.setScalar(keep); }
    // a fingertip pinch: the held thing's axis runs through pinchPt, against the index finger's pad, and the thumb turns
    // and reaches so its tip closes on the other side of it (the thumb and index pads opposing, Jonny's straw grip)
    if (U.pad) {
      const pad = U.pad, mid = pad.parent, chain = [mid, mid.parent, U.index], p = pad.position.clone(), n = new THREE.Vector3(0, 0, 1);
      for (const o of chain) { o.updateMatrix(); p.applyMatrix4(o.matrix); n.applyQuaternion(o.quaternion); }
      const rs = gr.thin ?? 0.005, q = p.addScaledVector(n, rs);
      U.pinchPt.position.copy(q); U.pinchW = pw;
      // close: 0 the thumb stands open (reaching for it, letting go), 1 its pad is on the straw
      const tk = pw * Math.min(1, Math.max(0, gr.close ?? 1));
      if (tk > 0) {
        const tc = q.clone().addScaledVector(n, rs + 0.0165), d = tc.clone().sub(U.thumbRest);
        const qa = new THREE.Quaternion().setFromUnitVectors(THUMB_TIP.clone().normalize(), d.normalize());
        U.thumb.quaternion.slerp(qa, tk);
        U.thumb.position.lerp(tc.sub(THUMB_TIP.clone().applyQuaternion(qa)), tk);
      }
    }
  }
  // the rotation of a hand locked to a hold (arm poses with frame, resolved by timeline.js), blended with the arm's move:
  // from one hold to another the hand turns the short way between the two; onto or off a hold, it turns onto it as it
  // arrives (w: how far)
  _frame(a) {
    const one = (q) => {
      if (q && q.mix) return mix(one(q.mix.from), one(q.mix.pose), q.mix.p);
      if (!q || !q.frame) return null;
      const Y = new THREE.Vector3(...q.frame.y), Z = new THREE.Vector3(...q.frame.z);
      return { q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(Y, Z), Y, Z)), w: 1, e: q.frame.elbow ?? 0 };
    };
    // e: how much the hold's elbow guide applies (frame.elbow), blended like the frame
    const mix = (f0, f1, p) => (f0 && f1 ? { q: f0.q.clone().slerp(f1.q, p), w: 1, e: f0.e + (f1.e - f0.e) * p } : f0 ? { q: f0.q, w: 1 - p, e: f0.e * (1 - p) } : f1 ? { q: f1.q, w: p, e: f1.e * p } : null);
    return mix(one(a.from), one(a.pose), a.p);
  }
  // how far an arm's move is aimed with point "pinch" (arm poses resolved by timeline.js), blended like the pose
  _pointW(a) {
    const one = (q) => (q && q.mix ? one(q.mix.from) * (1 - q.mix.p) + one(q.mix.pose) * q.mix.p : q && q.point === "pinch" ? 1 : 0);
    return one(a.from) * (1 - a.p) + one(a.pose) * a.p;
  }
  // the point an arm's palm faces (arm poses with palm, resolved by timeline.js), blended with the arm's move: the hand
  // turns onto it as it reaches and back to its own pose as it leaves; null when neither end of the move has one.
  // from, to: the hand at each end of the move. A wrap's fingers go round the side the hold at that end uses (away from
  // the body), so they never flip over half way through a move as the hand crosses in front of the body
  _palm(a, h, S, from = null, to = null) {
    const pt = (q) => (q && q.mix ? pt(q.mix.p < 0.5 ? q.mix.from : q.mix.pose) : q && q.palm ? q : null);
    const wt = (q) => (q && q.mix ? wt(q.mix.from) + (wt(q.mix.pose) - wt(q.mix.from)) * q.mix.p : q && q.palm ? 1 : 0);
    const p0 = pt(a.from), p1 = pt(a.pose), w = wt(a.from) * (1 - a.p) + wt(a.pose) * a.p;
    if (!(p0 || p1) || w <= 0) return null;
    const pv = (p) => new THREE.Vector3(p[0], LEG_H + this.H * p[1], p[2]), q0 = p0 && pv(p0.palm), q1 = p1 && pv(p1.palm);
    const end = a.p < 0.5 ? (p0 ? 0 : 1) : (p1 ? 1 : 0), e = end ? q1 : q0, eh = end ? to : from;
    // the side test of _pose, cross(up, palm - hand) . hand, at that end of the move
    const side = e && eh ? Math.sign((e.z - eh[2]) * eh[0] - (e.x - eh[0]) * eh[2]) || 1 : null;
    const at = q0 && q1 ? q0.clone().lerp(q1, a.p) : (q1 || q0).clone();
    at.y = LEG_H + (at.y - LEG_H) * S.y;
    return { at, w, wrap: !!(end ? p1 : p0).wrap, side };
  }
  // where a prop held in hand s sits, in the root's space (the hand centre for ball hands)
  gripPoint(s) {
    const h = this.arms[s].hand;
    if (!h.userData.grip) return h.position.clone();
    h.updateMatrix(); return h.userData.grip.position.clone().applyMatrix4(h.matrix);
  }

  // push a point (root space) out of the body sideways until it clears the surface by an arm's width
  // (bezier control points: k > 1 pushes further, since the curve passes inside its control point)
  _outside(p, S, k0 = 1) {
    const cy = this.cy * S.y, rx = this.rx * S.x, ry = this.ry * S.y, rz = this.rz * S.z, m = (1 + (this.limbW * 1.3) / Math.min(rx, rz)) * k0;
    const dx = p.x, dy = p.y - cy, dz = p.z, e = Math.hypot(dx / rx, dy / ry, dz / rz);
    if (e >= m) return p;
    const hz = Math.hypot(dx / rx, dz / rz); if (hz < 1e-4) return p;
    const need = Math.sqrt(Math.max(0, m * m - (dy / ry) ** 2)), k = Math.max(1, need / hz);
    p.x = dx * k; p.z = dz * k; return p;
  }
  // point on the potato for a unit direction, in bodyGroup space (y = 0 is the ground)
  bodyPoint(d) {
    let r = 1;
    for (const L of this.lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (this.def.body.taper ?? 0.07) * d.y;   // body.taper: how much narrower the top is (an egg: ~0.16)
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

  // an arm's centre line from shoulder a through elbow guide c to hand b. joint: c is an elbow the arm passes through
  // (two segments with a rounded turn, cutting the corner by a fifth of each), else a curve's pull point. Shared by the drawn arm and the contact checks.
  static armCurve(a, c, b, joint = false) {
    return joint ? new THREE.CatmullRomCurve3([a, a.clone().lerp(c, 0.5), c.clone().lerp(a, 0.2), c.clone().lerp(b, 0.2), c.clone().lerp(b, 0.6), b], false, "centripetal")
      : new THREE.QuadraticBezierCurve3(a, c, b);
  }
  // the arm tube's radius at t along it (0: the shoulder, 1: the wrist) for limb width w: rooted inside the body with a
  // wider shoulder (no cut tube end shows), narrowing to a wrist before the mitten
  static armRadius(t, w) { return w * (t < 0.06 ? 1.19 * Math.sqrt(1 - (1 - t / 0.06) ** 2) : t < 0.25 ? 1.25 - t : t > 0.8 ? 1 - (t - 0.8) * 1.1 : 1); }
  // storyboard "debug": { "anchors": true }: shoulder (red), elbow (green) and hand (blue) of each arm, drawn on top
  _anchors(s, pts) {
    this._anc ??= {};
    if (!this._anc[s]) this._anc[s] = ["#ff2020", "#20e040", "#2060ff"].map((c) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: c, depthTest: false }));
      m.renderOrder = 999; this.root.add(m); return m;
    });
    pts.forEach((p, i) => this._anc[s][i].position.copy(p));
  }

  // the skin and its ink shell are made with the character (the look converts their materials once, at the start): the
  // skin takes the limbs' colour and shading but not three's outline (it shows through the skin's small dips as specks);
  // its own ink shell draws the line, thinning away in creases, in the colour and width the look gives the arm tube
  _skinInit(s) {
    const a = this.arms[s];
    this.skinMat ??= Object.assign(this.limbMat.clone(), { userData: { ...this.limbMat.userData, noOutline: true } });
    a.skin = new THREE.Mesh(new THREE.BufferGeometry(), this.skinMat);
    a.skin.castShadow = true; a.skin.receiveShadow = !!this.def.hands.selfShadow; a.skin.frustumCulled = false; a.skin.matrixAutoUpdate = false; this.root.add(a.skin);
    const im = inkMaterial(); im.userData.outlineParameters = { visible: false };
    // the line the look gives the legs (same material as the arms used to have)
    const line = () => { const op = this.legs[s].mesh?.material?.userData?.outlineParameters; im.uniforms.thickness.value = op && op.visible !== false && op.thickness ? op.thickness : 0; if (op?.color) im.uniforms.color.value.fromArray(op.color); };
    a.ink = new THREE.Mesh(a.skin.geometry, im); a.ink.frustumCulled = false; a.ink.onBeforeRender = line; a.ink.matrixAutoUpdate = false; this.root.add(a.ink);
    // the arm tube: the same ink, instead of three's outline
    this.armMat ??= Object.assign(this.limbMat.clone(), { userData: { ...this.limbMat.userData, noOutline: true } });
    a.tubeInk = new THREE.Mesh(new THREE.BufferGeometry(), im); a.tubeInk.frustumCulled = false; a.tubeInk.onBeforeRender = line; this.root.add(a.tubeInk);
  }

  // hands.seamless: one skin over the glove and the end of its forearm, grown from the posed hand parts (handmesh.js):
  // the palm two fat round cones (a flat mitten block that runs up into the finger roots), the fingers and thumb, and
  // the last stretch of the arm's own curve a hair inside the arm tube, so the arm runs into the hand through a soft
  // wrist instead of meeting a separate blob. Blends from the research (wrist ~0.8, finger root ~0.5, knuckle ~0.15
  // finger radius). A pose that hasn't changed since the last frame (to a tenth of a millimetre) keeps its mesh.
  _skin(s, show) {
    const a = this.arms[s], hand = a.hand, U = hand.userData, hs = this.def.hands;
    a.skin.visible = a.ink.visible = show && !globalThis.__noSkin;
    if (!a.skin.visible || !a.elbow) return;
    this.root.updateMatrixWorld(true);
    const inv = this.root.matrixWorld.clone().invert(), M = new THREE.Matrix4(), A = new THREE.Vector3(), B = new THREE.Vector3(), sc = new THREE.Vector3();
    // a motion blur sample (stage.js blur, a fraction of a frame away) carries the frame's skin along with the hand
    // instead of growing a new one: the hand barely changes shape in that time
    if (globalThis.__skinRigid && a.skinH) {
      M.multiplyMatrices(inv, hand.matrixWorld).multiply(a.skinH.clone().invert());
      a.skin.matrix.copy(M); a.ink.matrix.copy(M); a.skin.matrixWorldNeedsUpdate = a.ink.matrixWorldNeedsUpdate = true; return;
    }
    const shown = (o) => { for (let q = o; q && q !== hand; q = q.parent) if (!q.visible) return false; return true; };
    const seg = (o) => { M.multiplyMatrices(inv, o.matrixWorld); sc.setFromMatrixScale(M); const k = (sc.x + sc.z) / 2, d = o.userData.seg; return cone(A.set(0, -d.half, 0).applyMatrix4(M), B.set(0, d.half, 0).applyMatrix4(M), d.r1 * k, d.r2 * k); };
    const digits = U.digits.filter((d) => shown(d[0]) && d[0].getWorldScale(sc).y > 0.05).map((d) => d.map(seg));
    if (U.fist.visible) {
      M.multiplyMatrices(inv, U.fist.matrixWorld); sc.setFromMatrixScale(M); const k = (sc.x + sc.y + sc.z) / 3, w = (u) => 0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.15));
      for (const r of U.rolls) { const p = r.pts.map((q) => q.clone().applyMatrix4(M)), n = p.length - 1; digits.push(p.slice(1).map((q, i) => cone(p[i], q, r.tr * k * w(i / n), r.tr * k * w((i + 1) / n)))); }
    }
    M.multiplyMatrices(inv, hand.matrixWorld); sc.setFromMatrixScale(M); const k = (sc.x + sc.y + sc.z) / 3;
    const P = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M);
    const palm = (hs.palm || [[-0.02, -0.025, 0, -0.021, 0.028, 0, 0.031, 0.029], [0.02, -0.025, 0, 0.022, 0.028, 0.002, 0.032, 0.029]]).map((c) => cone(P(c[0], c[1], c[2]), P(c[3], c[4], c[5]), c[6] * k, c[7] * k));
    // the forearm's last stretch (hands.stub metres of it), on the arm's own curve and 1 % thinner than its tube
    const curve = Character.armCurve(a.shoulder, a.elbow, hand.position, a.joint), arm = [], L = curve.getLength(), N = 4;
    const t0 = Math.max(0.3, 1 - (hs.stub ?? 0.15) / L), R = (t) => Character.armRadius(t, this.limbW) * 0.99;
    for (let i = 0; i < N; i++) { const ta = t0 + ((1 - t0) * i) / N, tb = t0 + ((1 - t0) * (i + 1)) / N; arm.push(cone(curve.getPointAt(ta), curve.getPointAt(tb), R(ta), R(tb))); }
    // hands.cuff { at, r, len }: a rolled glove rim round the wrist, at metres from the hand's centre, r times the arm
    const cuff = [];
    if (hs.cuff) { const c = hs.cuff, ta = 1 - (c.at ?? 0.1) / L, tb = 1 - ((c.at ?? 0.1) - (c.len ?? 0.025)) / L; cuff.push(cone(curve.getPointAt(ta), curve.getPointAt(tb), R(ta) * (c.r ?? 1.25), R(tb) * (c.r ?? 1.25))); }
    const fr = 0.0185 * k, b = hs.blend || {};
    const shape = { arm, palm, digits, cuff, sep: (b.sep ?? 0.12) * fr, wrist: (b.wrist ?? 0.8) * fr, root: (b.root ?? 0.5) * fr, joint: (b.joint ?? 0.15) * fr, palmK: (b.palm ?? 0.7) * fr };
    const key = [...arm, ...palm, ...digits.flat(), ...cuff].map((c) => [...c.a, ...c.ba, c.r1, c.r2].map((x) => Math.round(x * 1e4)).join(",")).join(";");
    a.skin.matrix.identity(); a.ink.matrix.identity(); a.skin.matrixWorldNeedsUpdate = a.ink.matrixWorldNeedsUpdate = true;
    a.skinH = new THREE.Matrix4().multiplyMatrices(inv, hand.matrixWorld);
    if (key === a.skinKey) return;
    a.skinKey = key; a.skin.geometry.dispose();
    a.skin.geometry = a.ink.geometry = meshShape(shape, hs.cell ?? 0.004);
  }

  _tube(old, a, c, b, w, arm = false, joint = false, stub = 0) {
    if (old) { old.geometry.dispose(); this.root.remove(old); }
    const curve = Character.armCurve(a, c, b, joint);
    // arms: rooted inside the body with a wider shoulder (no cut tube end shows) and narrowing to a wrist before the mitten.
    // stub: under a seamless hand's skin (which carries on over the last `stub` metres of the arm), the tube closes in a
    // round cap half way along that stretch, so its outline never shows through the hand
    const L = stub ? curve.getLength() : 1, ts = 1 - (stub * 0.5) / L, tc = (w * 0.9) / L;
    const cap = (t) => (!stub || t <= ts ? 1 : Math.sqrt(Math.max(0, 1 - ((t - ts) / tc) ** 2)));
    const geo = arm ? taperedTube(curve, 0, 0, 32, 14, (t) => Character.armRadius(t, w) * cap(t))
      : new THREE.TubeGeometry(curve, 14, w, 8, false);
    if (stub) geo.setAttribute("ink", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(1), 1));
    const m = new THREE.Mesh(geo, stub ? this.armMat : this.limbMat); m.castShadow = true; this.root.add(m);
    return m;
  }

  // st: the state the timeline computed for this frame
  apply(st, t) {
    const R = this.root;
    R.position.set(st.x, st.y - 0.1 * (st.kneel || 0), st.z); R.rotation.set(st.pitch || 0, st.yaw, st.lean); R.scale.setScalar(st.scale ?? 1);
    R.visible = st.visible !== false;
    const sq = st.squash; this.bodyGroup.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    // planted feet (timeline.js st.plant): where the last step left them, in the world; drawn in the body's frame
    const pl = st.plant && st.plant.w < 1 ? st.plant : null;
    if (pl) {
      R.updateMatrixWorld(true);
      this._plantM = (this._plantM || new THREE.Matrix4()).compose(new THREE.Vector3(pl.x, pl.y, pl.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pl.yaw), new THREE.Vector3().setScalar(st.scale ?? 1));
      this._footQ = R.quaternion.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pl.yaw));
    }

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
      // limbs.shoulder: where on the body's side the arm comes out (surf height; lower for short arms over a table)
      const shp = this.surf(sx * 1.38, this.def.limbs.shoulder ?? 0.02), sh = shp.pos, shN = shp.normal; sh.set(sh.x * S.x, sh.y * S.y, sh.z * S.z);
      const gr = { ...(st.grip?.[s] || { curl: 0.15, index: 0.12, thumb: 0.1 }) }, ax = this.arms[s].hand.userData.fingers ? this.costume.propAxis?.(st, s) || (gr.axis ? new THREE.Vector3(...gr.axis) : null) : null;
      const dn = Math.min(1, Math.max(0, gr.down || 0));
      if (dn > 0) {
        // the fingers settle onto the top once, just after the paw lands, then hold still (weight, not a fidget)
        const k = gr.since != null ? Math.min(1, Math.max(0, (t - gr.since) / 0.6)) : 1, settle = 1 - k * k * (3 - 2 * k);
        gr.curl -= dn * 0.12 * settle; gr.index -= dn * 0.14 * settle;
      }
      const fr = this._frame(a);
      // the elbow (the arm curve's pull point) for the hand at h
      const elbowFor = (h) => {
        const out = elbowOut(a.pose) * a.p + elbowOut(a.from) * (1 - a.p);
        const mid = sh.clone().lerp(h, 0.5).add(new THREE.Vector3(sx * out, -0.06, 0.02));
        // a hand closed on a staff or handle: the elbow drops below the shoulder-hand line, so the forearm comes out from the
        // body into the side of the fist, square to the handle, instead of running down alongside it
        const pw = ax && this.arms[s].hand.userData.glove ? Math.min(1, gr.pinch || 0) : 0, hw = ax ? fistWeight(gr.curl) * (1 - pw) : 0;
        // elbow guide: beside the body a little below the fist, so the forearm rises into the fist as in the reference art
        // (upper arm down and out from the shoulder, a bend, forearm up to the staff); for a hand in front of the belly, half
        // way round the body from the shoulder to the hand, so the arm wraps round the body instead of through it
        if (hw > 0) {
          const g = Math.abs(h.x) > this.rx * S.x * 0.9 ? new THREE.Vector3(h.x - sx * 0.12, h.y - 0.09, h.z - 0.02) : sh.clone().lerp(h, 0.5);
          mid.lerp(g, hw);
        }
        // a fingertip pinch (a straw, a pencil): a long, level forearm coming in from the shoulder's side (Jonny's straw
        // sheet), its elbow a little over half the shoulder-hand distance straight back from the hand, so the hand, which
        // points along the forearm, turns smoothly as the hand moves and the wrist stays in line with the arm
        if (pw > 0) {
          const d = h.clone().sub(sh), L = d.length(); d.y = 0;
          if (d.lengthSq() > 1e-6) { d.normalize(); const e = h.clone().addScaledVector(d, -0.55 * L); e.y = h.y - 0.03; mid.lerp(e, pw); }
        }
        // a paw resting on a table (grip down): a real elbow, the upper arm down the side and the forearm forward onto
        // the top, like Jonny's target, instead of one long curve from the shoulder; the fingers settle a little now
        // and then so a resting hand isn't frozen while the body breathes
        if (dn > 0) {
          // the authored elbow: low at the front corner of the body just above the table (not straight out to the side, where
          // it would push into a neighbour), a forearm's length behind the paw, so the upper
          // arm drops down the side and only a short forearm comes forward onto the top
          const el = Math.asin(Math.max(-0.95, Math.min(0.95, (h.y / S.y - this.cy) / this.ry))), side = this.surf(sx * 1.2, el);
          const elbow = side.pos.set(side.pos.x * S.x, side.pos.y * S.y, side.pos.z * S.z).addScaledVector(side.normal, this.limbW * 1.05);
          elbow.y = h.y + 0.035; elbow.z += (h.z - elbow.z) * 0.12;
          mid.lerp(elbow, dn);
        }
        // the elbow never sinks into the body (a curve's pull point needs the wider margin: the curve passes inside it;
        // the jointed paw arm passes through its elbow, so it only needs the arm's own radius)
        // a hand locked to a hold whose frame asks for it (frame.elbow): the elbow out beside the body and below the shoulder-hand line, so the
        // upper arm hangs and the forearm comes into the hold from the side, low and relaxed (a phone held by its edges),
        // instead of hooked straight up from the shoulder
        if (fr && fr.e > 0) {
          // a hand reaching across in front of the body (round a held phone's far edge): the elbow comes forward to the
          // hand's depth and a little in front, so the forearm passes in front of the prop instead of through it
          const across = Math.min(1, Math.max(0, (0.25 - h.x * sx) / 0.2));
          const elbow = new THREE.Vector3(sh.x + sx * 0.06, Math.min(sh.y, h.y) - 0.12, sh.z + (h.z - sh.z) * 0.35 + (h.z + 0.06 - sh.z - (h.z - sh.z) * 0.35) * across);
          mid.lerp(elbow, fr.e);
        }
        const joint = dn > 0.5;
        this._outside(mid, S, joint ? 1 : 1.3);
        return mid;
      };
      let mid = elbowFor(h);
      const hand = this.arms[s].hand, U = hand.userData, pose = (h, mid) => { hand.position.copy(h); if (U.fingers) this._pose(hand, mid, h, sx, gr, ax, this._palm(a, h, S, from, to), sh, Math.min(1, Math.max(0, 4 * a.p * (1 - a.p))), fr); };
      pose(h, mid);
      // an arm pose aimed with point "pinch" (a straw, a pencil): the fingertip pinch lands on the target, not the hand's
      // centre, so the prop runs between the pads. The hand is posed for the target first; then hand and elbow shift
      // together by the pinch's offset, so the hand keeps its turn and the forearm still runs straight into the wrist
      // (blended like the pose itself)
      const pp = U.pinchPt ? this._pointW(a) : 0;
      if (pp > 0 && U.pinchW > 0) {
        hand.updateMatrix();
        const off = U.pinchPt.position.clone().applyMatrix4(hand.matrix).sub(h).multiplyScalar(pp);
        h.sub(off); mid.sub(off); pose(h, mid);
      }
      const joint = dn > 0.5;
      this.arms[s].elbow = mid; this.arms[s].joint = joint; this.arms[s].shoulder = sh.clone().addScaledVector(shN, -0.035);
      if (globalThis.__DIAG?.anchors) this._anchors(s, [this.arms[s].shoulder, mid, h]);
      this.arms[s].hand.visible = showLimbs;
      // legs
      const ph = st.walk * 6.283 + (s === "R" ? 0 : Math.PI);
      const lift = st.walkAmt * Math.max(0, Math.sin(ph)) * 0.07;
      const foot = new THREE.Vector3(sx * 0.13, 0.035 + lift + st.tuck * 0.08, 0.04 + st.walkAmt * Math.cos(ph) * 0.05);
      // kneeling: the body drops, the feet stay on the floor tucked behind; sitting: the feet stick out in front
      const kn = st.kneel || 0, si = st.sit || 0;
      foot.y += 0.1 * kn; foot.z -= 0.14 * kn;
      // sitFeet [forward, up] (the sit action's `feet`): on a round stool the legs stick out further so they clear its edge
      const sf = st.sitFeet || [0.24, -0.01];
      foot.set(foot.x + sx * 0.02 * si, foot.y + sf[1] * si, foot.z + sf[0] * si);
      if (pl) {
        const planted = R.worldToLocal(foot.clone().applyMatrix4(this._plantM));
        foot.lerp(planted, 1 - pl.w);
        this.legs[s].foot.quaternion.identity().slerp(this._footQ, 1 - pl.w);
      } else this.legs[s].foot.quaternion.identity();
      const hip = new THREE.Vector3(sx * 0.12, LEG_H * S.y + 0.06, 0.0);
      this.legs[s].foot.position.copy(foot); this.legs[s].foot.visible = showLimbs;
      const key = [h.x, h.y, h.z, sh.x, sh.y, foot.x, foot.y, foot.z, hip.y, mid.x, mid.y, mid.z, st.grip?.[s]?.down || 0].map((x) => x.toFixed(4)).join(",");
      if (showLimbs && key !== this[`_k${s}`]) {
        this[`_k${s}`] = key;
        this.arms[s].mesh = this._tube(this.arms[s].mesh, this.arms[s].shoulder, mid, h, this.limbW, true, joint, this.seamless ? this.def.hands.stub ?? 0.15 : 0);
        this.legs[s].mesh = this._tube(this.legs[s].mesh, hip, hip.clone().lerp(foot, 0.5).add(new THREE.Vector3(sx * 0.02, 0, 0.02)), foot, this.limbW * 1.1);
      }
      if (this.seamless) { this._skin(s, showLimbs); const a = this.arms[s]; a.tubeInk.geometry = a.mesh.geometry; a.tubeInk.visible = showLimbs; }
      if (this.arms[s].mesh) this.arms[s].mesh.visible = showLimbs;
      if (this.legs[s].mesh) this.legs[s].mesh.visible = showLimbs;
    }
    this.costume.apply(st, t, hands, fries);
    if (globalThis.__DIAG?.clearance && !fries) this._clearance(t);
  }

  // contact measures for qa/check.mjs (stage.js ENGINE.contact) and the clearance diagnostic, in metres (negative =
  // they intersect): staff: the gap between the held prop's shaft and the holding arm outside the fist (arm) and the
  // body (body), how far the grip sits off the shaft (gripOff) and how nearly the forearm runs along it (par, 0..1;
  // near 1 the fist has nothing to turn around); brim: how deep each arm reaches into the hat brim (0 = clear)
  contact() {
    const S = this.bodyGroup.scale, out = { staff: null, brim: { R: 0, L: 0 } };
    const shoulder = (s) => { const p = this.surf((s === "R" ? -1 : 1) * 1.38, this.def.limbs.shoulder ?? 0.02).pos; return p.set(p.x * S.x, p.y * S.y, p.z * S.z); };
    const curveOf = (s) => this.arms[s].elbow ? Character.armCurve(this.arms[s].shoulder || shoulder(s), this.arms[s].elbow, this.arms[s].hand.position, this.arms[s].joint) : null;
    const L = this.costume.propLine?.();
    if (L && curveOf(L.hand)) {
      const s = L.hand, a = this.arms[s], curve = curveOf(s), seg = new THREE.Line3(L.a, L.b), q = new THREE.Vector3(), c = new THREE.Vector3();
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
      out.staff = { hand: s, arm, body, tip: L.a.y, gripOff: seg.closestPointToPoint(L.grip, false, q).distanceTo(L.grip), par: a.hand.userData.fistPar ?? 0,
        fist: L.grip.toArray().map((v) => Math.round(v * 1000) / 1000), end: L.b.toArray().map((v) => Math.round(v * 1000) / 1000) };   // fist and tip in root space (aiming a cut)
    }
    // the brim as a disc around the hat's up axis (costume hatBrim: its group and radius), in the root's space
    const hb = this.costume.hatBrim;
    if (hb && hb.group.visible && hb.r > 0) {
      this.root.updateMatrixWorld(true);
      const inv = this.root.matrixWorld.clone().invert(), m = hb.group.matrixWorld.clone().premultiply(inv);
      const ctr = new THREE.Vector3().setFromMatrixPosition(m), sc = new THREE.Vector3().setFromMatrixScale(m), up = new THREE.Vector3(0, 1, 0).transformDirection(m);
      const R = hb.r * Math.max(sc.x, sc.z), half = this.limbW / 2 + 0.02, c = new THREE.Vector3();
      for (const s of ["R", "L"]) {
        const curve = curveOf(s), hp = this.arms[s].hand.position; if (!curve || !this.arms[s].mesh?.visible) continue;
        for (let i = 0; i <= 40; i++) {
          curve.getPoint(i / 40, c);
          if (c.distanceTo(hp) < 0.07) continue;   // the hand itself may hold the brim (a hat tip); the arm may not cross it
          c.sub(ctr); const h = c.dot(up), r = c.addScaledVector(up, -h).length();
          if (Math.abs(h) < half && r < R) out.brim[s] = Math.max(out.brim[s], Math.min(half - Math.abs(h), R - r));
        }
      }
    }
    // the helmet glass as a sphere: how deep a raised arm runs inside it above the glass's middle (the arm root sits
    // inside the glass on every pose, so an arm that leaves it low, beside the shoulder, is fine)
    const hm = this.costume.helmet;
    if (hm && hm.mesh.visible) {
      this.root.updateMatrixWorld(true);
      const m = hm.mesh.matrixWorld.clone().premultiply(this.root.matrixWorld.clone().invert());
      const ctr = new THREE.Vector3().setFromMatrixPosition(m), sc = new THREE.Vector3().setFromMatrixScale(m), R = hm.r * Math.max(sc.x, sc.y, sc.z), c = new THREE.Vector3();
      out.helmet = { R: 0, L: 0 };
      for (const s of ["R", "L"]) {
        const curve = curveOf(s); if (!curve || !this.arms[s].mesh?.visible) continue;
        for (let i = 0; i <= 40; i++) {
          curve.getPoint(i / 40, c);
          if (c.y < ctr.y) continue;
          out.helmet[s] = Math.max(out.helmet[s], R - this.limbW / 2 - c.distanceTo(ctr));
        }
      }
    }
    for (const s of ["R", "L"]) { this.arms[s].hand.updateMatrixWorld(true); out[`q${s}`] = this.arms[s].hand.getWorldQuaternion(new THREE.Quaternion()).toArray(); }
    return out;
  }
  // the drawn arm s as balls along its centre line, in the world (stage.js inProps: an arm through a prop), from where
  // it leaves the body (a fifth of the way along) to the wrist; the last 8 cm before the hand are the hand's own parts
  armBalls(s) {
    const A = this.arms[s];
    if (!A.mesh || !A.mesh.visible || !A.elbow || !this.root.visible) return [];
    this.root.updateMatrixWorld(true); A.hand.updateMatrixWorld(true);
    const curve = Character.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), hand = A.hand.getWorldPosition(new THREE.Vector3());
    const k = this.root.getWorldScale(new THREE.Vector3()).x, out = [];
    for (let i = 5; i <= 24; i++) {
      const c = curve.getPointAt(i / 24).applyMatrix4(this.root.matrixWorld);
      if (c.distanceTo(hand) < 0.08 * k) continue;
      out.push({ c, r: Character.armRadius(i / 24, this.limbW) * k });
    }
    return out;
  }
  // the visible costume meshes (hat, brim, beard, raven, hood, wings, the costume's own staff or blade) with a name for
  // reports: everything drawn on the character except its body, face, specks, arms, hands, legs and feet; parts under
  // 3 cm and see-through ones (glows, glass) left out
  costumeMeshes() {
    const skip = new Set([this.potatoParts, this.fries.group, ...["R", "L"].flatMap((s) => [this.arms[s].mesh, this.arms[s].hand, this.legs[s].mesh, this.legs[s].foot]), ...Object.values(this._anc || {}).flat()].filter(Boolean));
    const C = this.costume, out = [], sc = new THREE.Vector3(), size = new THREE.Vector3();
    const walk = (o, name) => {
      if (skip.has(o) || !o.visible) return;
      if (C.hat && o === C.hat) name = "hat"; else if (C.prop && o === C.prop) name = "prop"; else if (C.helmet && o === C.helmet.mesh) name = "helmet"; else if (o.name && !o.isMesh) name = o.name;
      if (o.isMesh && o.geometry?.attributes?.position && !o.isSprite) {
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!(m && m.transparent && m.opacity < 0.5 && !(C.helmet && o === C.helmet.mesh))) {
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          o.geometry.boundingBox.getSize(size).multiply(o.getWorldScale(sc));
          if (Math.max(size.x, size.y, size.z) >= 0.03) out.push({ o, name: o.name || name });
        }
      }
      for (const c of o.children) walk(c, name);
    };
    this.root.updateMatrixWorld(true);
    for (const c of this.root.children) walk(c, "costume");
    return out;
  }
  // diagnostic: "diag: clearance t=.. arm=.. body=.." per frame. Storyboard "debug": { "clearance": true }.
  _clearance(t) {
    const k = this.contact().staff; if (!k) return;
    console.log(`diag: clearance t=${t.toFixed(2)} arm=${k.arm.toFixed(3)} body=${k.body.toFixed(3)} tip=${k.tip.toFixed(3)} gripOff=${k.gripOff.toFixed(3)} par=${k.par.toFixed(2)}`);
  }
}

