import * as THREE from "three";
const _fist = new THREE.Quaternion();
// the thumb on a slab's front (grip edge, timeline.js phoneEdge): its pivot's place and turn in the hand
const _edgeThumb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.46, -0.118, 1.006)), _edgeThumbAt = new THREE.Vector3(0.0273, 0.0086, 0.023);
// the glove thumb's tip (the centre of its end) in its pivot's frame: the capsule at (0.024, 0.018) turned -0.75
const THUMB_TIP = new THREE.Vector3(0.024 + 0.017 * Math.sin(0.75), 0.018 + 0.017 * Math.cos(0.75), 0);
const fistWeight = (curl) => { const w = Math.min(1, Math.max(0, (curl - 0.6) / 0.3)); return w * w * (3 - 2 * w); };
const rd = (v, n) => Math.round(v * 10 ** n) / 10 ** n;
// Rig options for the clip being drawn (stage.js calls setRig(sb) when it loads a storyboard). "rig": { "hand": 2 }
// turns on the hand that can't flip (quality plan item 2, 5 Nov 2026); without it every clip draws as before.
let HAND = null, SMOOTH = true;
export const setRig = (sb) => { HAND = sb?.rig?.hand ?? null; SMOOTH = sb?.rig?.smooth !== false; };
// Hand rig 2: the hand's turn is built from a base frame plus turns away from it that a wrist can do.
// The base frame: the hand's frame when the forearm points out, forward and up (HAND_Y0, 45 degrees up from out and
// forward, square to today's look-at reference: a hanging hand, and every forearm square to that reference, keeps
// today's turn exactly), swung onto the forearm the shortest way. A look-at spins near two forearm directions (across
// the chest, and out to the back); the swing has one, in, back and down behind the hip (HAND_Y0 negated), where a forearm
// doesn't point. On the ten clips of 4-5 Nov the hand's base frame turned over 60 degrees in a frame 121 times with the
// look-at, 70 swung from out and forward, 48 from this one (tools/hand-probe/base-eval.mjs)
const _y0 = (sx) => new THREE.Vector3(0.35 * sx, 0, 1).normalize().multiplyScalar(Math.SQRT1_2).add(new THREE.Vector3(0, Math.SQRT1_2, 0)).normalize();
const HAND_Y0 = { R: _y0(-1), L: _y0(1) };
// the wrist's reach from the base frame: bend (the fingers' direction off the forearm) and twist (about the forearm). A
// turn up to the knee (radians) is used exactly; past it, the hand turns on a little further (bend about 77 degrees at
// most, twist about 88) and then back towards the base frame as the target goes on to half a turn away. So the hand
// never turns more than about 1.4 times as far as its target in a frame, and a target crossing half a turn (where the
// shortest way round changes sides, the hand pops of 5 Nov) finds the hand at its base frame on both sides
const WRIST = { bend: (65 * Math.PI) / 180, twist: (80 * Math.PI) / 180 };
const sstep = (v) => { const w = Math.min(1, Math.max(0, v)); return w * w * (3 - 2 * w); };
const _bq = new THREE.Quaternion(), _bv = new THREE.Vector3(), _bY = new THREE.Vector3(0, 1, 0);
// u (0..pi) past the knee a: a smooth curve (cubic Hermite) from a, rising at the same slope, down to 0 at half a turn
const fold = (u, a) => { if (u <= a) return u; const h = Math.PI - a, t = (u - a) / h; return (2 * t ** 3 - 3 * t ** 2 + 1) * a + (t ** 3 - 2 * t ** 2 + t) * h - (t ** 3 - t ** 2) * h; };
// a turn r (relative to the base frame) as [bend x, bend z, twist, 1, bend, twist before the limits]: the bend a
// rotation vector square to the forearm, after the twist about it, both within the wrist's reach
function wristTurn(r) {
  if (r.w < 0) r.set(-r.x, -r.y, -r.z, -r.w);
  const y2 = _bv.copy(_bY).applyQuaternion(r), ang = Math.acos(Math.min(1, Math.max(-1, y2.y)));
  const ax = y2.z, az = -y2.x, al = Math.hypot(ax, az);   // Y x y2: the bend's axis
  if (al > 1e-9) _bq.setFromAxisAngle(_bv.set(ax / al, 0, az / al), ang); else _bq.identity();
  const t = _bq.invert().multiply(r);
  let tw = 2 * Math.atan2(t.y, t.w); if (tw > Math.PI) tw -= 2 * Math.PI; if (tw < -Math.PI) tw += 2 * Math.PI;
  const b = al > 1e-9 ? fold(ang, WRIST.bend) / al : 0;
  return [ax * b, az * b, Math.sign(tw) * fold(Math.abs(tw), WRIST.twist), 1, ang, tw];
}
// how exactly a turn at weight w is matched: within the wrist's reach while the hand is on its way (w under 0.6), the
// whole turn once it is on its hold (w 1: a fist round a staff, a hand locked to a phone must match the hold exactly)
const exactW = (w) => sstep((w - 0.6) / 0.4);
// [bend x, bend z, twist] back to a rotation: the twist about the forearm, then the bend
function wristQuat(p, out) {
  const tw = new THREE.Quaternion().setFromAxisAngle(_bY, p[2]), a = Math.hypot(p[0], p[1]);
  if (a > 1e-9) out.setFromAxisAngle(_bv.set(p[0] / a, 0, p[1] / a), a); else out.identity();
  return out.multiply(tw);
}
import { Face, EXPRESSIONS } from "./face.js";
import { buildCostume } from "./costumes.js";
import { buildFries } from "./props.js";
import { rng } from "./util.js";
import { taperedTube } from "./geo.js";
import { cone, meshShape, geometryOf, shapeKey, inkMaterial } from "./handmesh.js";

const LEG_H = 0.14;

// Hand targets per arm pose, in the character's own space (it faces +z, its right hand is at -x).
// sx = -1 for the right arm, +1 for the left.
// Natural arcs (storyboard "motion", util.js naturalOf): a hand going from one pose to another bows out on an arc
// instead of a straight line, as a real arm turning at the shoulder does (and a straight line from the hip to the head
// would cut through a round body). The bow is 6.75 p (1 - p)²: it peaks a third of the way and comes in along the
// straight line at the end, so the hand lands on a grip exactly as before. It bows forward, a little in and up,
// about a fifth of the distance (at most 8 cm); moves under 12 cm stay straight. Character.apply sets ARCS
// for the frame it draws; a blend an arm is still in when a new move starts (a mix) bows the same way, so the hand
// never jumps.
let ARCS = false;
export function arcLerp(a, b, p, sx) {
  const out = a.map((v, i) => v + (b[i] - v) * p);
  if (!ARCS || p <= 0 || p >= 1) return out;
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  if (d < 0.12) return out;
  // the bow: forward and a little in across the front of the belly (where a swinging forearm goes) and up. Bowing out to
  // the side swung the hand past the elbow point and spun it (hand-pop, natural-motion bench 31 Oct)
  const ox = -0.4 * sx, oy = 0.2, oz = 0.9, ol = Math.hypot(ox, oy, oz);
  const k = (Math.min(0.08, 0.2 * d) * 6.75 * p * (1 - p) * (1 - p)) / ol;
  return [out[0] + k * ox, out[1] + k * oy, out[2] + k * oz];
}
export function handTarget(pose, sx, rx, H, t, LH = LEG_H) {
  const LEG_H = LH, top = LEG_H + H;
  // an arm still moving when a new move starts (util.js armNow): the blend it was in
  if (pose && pose.mix) { const m = pose.mix, a = handTarget(m.from, sx, rx, H, t, LH), b = handTarget(m.pose, sx, rx, H, t, LH); return arcLerp(a, b, m.p, sx); }
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
const elbowOut = (q) => (q && q.mix ? elbowOut(q.mix.from) + (elbowOut(q.mix.pose) - elbowOut(q.mix.from)) * q.mix.p : typeof q === "string" ? ELBOW_OUT[q] ?? 0.13 : q ? q.elbow ?? 0.1 : 0.13);   // an object pose may set its own elbow: (m out from the shoulder-hand line; Pebble's hanging arms)

export class Character {
  constructor(def, key) {
    this.def = def; this.key = key;
    const B = def.body, rnd = rng((B.seed || 1) * 7919);
    this.H = B.height; this.rx = B.width / 2; this.ry = B.height / 2; this.rz = B.depth / 2;
    // legs.height (the core build, costumes-core.js): where the body starts above the floor; the potatoes keep LEG_H
    this.legH = def.legs?.height ?? LEG_H; this.cy = this.legH + this.ry;
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
    // the core build (def.build "core", Core Five redesign 5 Nov 2026, costumes-core.js): the body is a torso in its suit
    // or clothes, and a separate head (def.head) carries the skin and the face. The skin material is the head's
    const HD = def.build === "core" ? def.head : null;
    this.skin = new THREE.MeshPhysicalMaterial({ color: HD ? HD.color : B.color, roughness: 0.5 - 0.3 * Math.max(0, gl - 0.3), clearcoat: gl, clearcoatRoughness: 0.35 - 0.25 * Math.max(0, gl - 0.3) });
    this.body = new THREE.Mesh(g, HD ? new THREE.MeshStandardMaterial({ color: B.color, roughness: 0.8 }) : this.skin); this.body.castShadow = true; this.body.receiveShadow = true;
    this.potatoParts.add(this.body);

    // specks
    // body.speckColor / speckSize: crispier marks (a fried potato: dark golden-brown, bigger)
    const speckM = new THREE.MeshStandardMaterial({ color: B.speckColor ? new THREE.Color(B.speckColor) : new THREE.Color(B.color).multiplyScalar(0.8), roughness: 0.9 });
    speckM.userData.noOutline = true;
    for (let i = 0; i < (B.specks ?? 9); i++) {
      const th = (rnd() * 2 - 1) * 2.6, ph = (rnd() * 2 - 1) * 0.9;
      if (Math.abs(th) < 0.65 && ph > -0.45 && ph < 0.6) continue; // keep the face clear
      const s = this.surf(th, ph);
      // flat, low-contrast marks sunk into the skin (a colour patch, not a bead stuck on it)
      const m = new THREE.Mesh(new THREE.SphereGeometry((0.018 + rnd() * 0.014) * (B.speckSize ?? 1), 12, 8), speckM);
      m.scale.set(1, 1, 0.12); m.position.copy(s.pos).addScaledVector(s.normal, -0.0015); m.lookAt(s.pos.clone().add(s.normal));
      this.potatoParts.add(m);
    }

    // body.drips: drops of hot fat running down the skin (glossy amber beads that slide down the sides and the chin,
    // stretch and drop off, each on its own loop; drawn from the clip time in apply), and body.shine: white
    // greasy highlights on the upper side. Their own random stream, so the rest of the body stays the same
    this.drips = [];
    if (B.drips || B.shine) {
      const dr = rng((B.seed || 1) * 104729);
      const dripM = new THREE.MeshPhysicalMaterial({ color: B.dripColor || "#f6b53c", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 });
      dripM.userData.noOutline = true; dripM.userData.lookRole = "drip";
      const glintM = new THREE.MeshBasicMaterial({ color: "#fffaf0" }); glintM.userData.noOutline = true;
      // the paths keep off the face (theta within 0.65 of the front, between the brows and below the mouth)
      const paths = [[-0.95, 0.75], [0.95, 0.7], [-1.25, 0.55], [1.3, 0.6], [-1.6, 0.4], [1.65, 0.45], [-0.32, -0.42], [0.36, -0.45], [-0.75, 0.2], [0.8, 0.15], [-2.2, 0.5], [2.25, 0.55]];
      for (let i = 0; i < (B.drips || 0); i++) {
        const [th, ph0] = paths[i % paths.length], rad = 0.026 + dr() * 0.012, m = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 8), dripM);
        // a white glint on the bead, so it reads as wet at phone size
        const gl = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.35, 8, 6), glintM); gl.position.set(-0.3 * rad, 0.4 * rad, 0.75 * rad); m.add(gl);
        m.castShadow = false; this.potatoParts.add(m);
        this.drips.push({ m, th: th + (dr() - 0.5) * 0.12, ph0, per: 1.1 + dr() * 0.9, off: dr() });
      }
      const shineM = new THREE.MeshBasicMaterial({ color: "#fff6dc", transparent: true, opacity: 0.75 }); shineM.userData.noOutline = true;
      for (let i = 0; i < (B.shine || 0); i++) {
        const [th, ph, w, h] = [[-0.9, 0.6, 0.022, 0.1], [-0.7, 0.76, 0.016, 0.05], [1.0, 0.5, 0.018, 0.07], [-1.15, 0.28, 0.014, 0.05]][i % 4];
        const sp = this.surf(th, ph), m = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shineM);
        m.scale.set(w, h, 1); m.position.copy(sp.pos).addScaledVector(sp.normal, 0.003); m.lookAt(sp.pos.clone().add(sp.normal)); m.rotateZ(-0.5 * Math.sign(th));
        this.potatoParts.add(m);
      }
    }

    // face
    const F = def.face || {};
    if (HD) this._headInit(HD);
    this.face = new Face({ size: F.size ?? 1, mouth: F.mouth, iris: F.iris, cheeks: F.cheeks, brow: F.brow, lids: F.lids === false ? null : this.skin, eye: F.eye, browShape: F.browShape, blush: F.blush, layout: F.layout, freckles: F.freckles ? { n: F.freckles, color: HD?.color ?? B.color, seed: B.seed || 1 } : null, place: HD ? (u, vv) => this.headSurf(u * 0.74 * (HD.faceWide ?? 1), vv * 0.55 * (HD.faceTall ?? 1) - 0.05 + (HD.faceUp ?? 0)) : (u, vv) => this.surf(u * 0.74, vv * 0.55 - 0.05) });
    // face.rest (castLook "sheet", characters/sheet-cast.json): the character's own resting face. It is stored as the
    // difference from the generic "kind" face and added to whatever the face is doing, fully on calm faces and fading
    // out toward full reactions (shock, anger, a wide grin), so the personality shows without blunting the acting
    if (F.rest) this.restBias = Object.fromEntries(Object.keys(EXPRESSIONS.kind).map((k) => [k, (F.rest[k] ?? EXPRESSIONS.kind[k]) - EXPRESSIONS.kind[k]]));
    (HD ? this.head.group : this.potatoParts).add(this.face.group);

    // limbs
    this.limbMat = new THREE.MeshStandardMaterial({ color: def.limbs.color, roughness: 0.5 });
    if (def.hands?.type === "glove") this.limbMat.userData.lookRole = "glove";   // looks.js: its own toon values
    // limbs.role (Pebble, review 7 Nov 2026): bare skin arms and legs with gloved hands shade as skin, not as cloth gloves
    if (def.limbs?.role) this.limbMat.userData.lookRole = def.limbs.role;
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
      // hands.fingerLen / fingerR (opt-in, Pebble 7 Nov "shorter, softer fingers"): scale every finger's length / thickness
      const fL = this.def.hands?.fingerLen ?? 1, fR = this.def.hands?.fingerR ?? 1;
      const finger = (parent, x, len, r, spread, y = 0) => {
        len *= fL; r *= fR;
        const base = new THREE.Group(); base.position.set(x, y, 0); base.rotation.z = spread; parent.add(base);
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
      if (this.seamless) {
        // the seamless glove follows the artist's construction sheet (29 Oct): slimmer fingers about two thirds of the
        // palm's length, the middle longest and the little one shortest and set a little lower on the knuckle arch, with
        // small gaps between them when the hand is open
        if (H3) { finger(fingers, 0.004, 0.045, 0.017, 0.03 * sp); finger(fingers, -0.028, 0.04, 0.0165, 0.15 * sp, -0.003); }
        else { finger(fingers, 0.004, 0.045, 0.0158, 0.01 * sp); finger(fingers, -0.024, 0.042, 0.0152, 0.07 * sp, -0.002); finger(fingers, -0.047, 0.034, 0.014, 0.16 * sp, -0.008); }
        finger(index, 0, 0.041, 0.0158, -0.07 * sp);
      } else if (H3) { finger(fingers, 0.004, 0.041, 0.0185, 0.03 * sp); finger(fingers, -0.031, 0.036, 0.0178, 0.17 * sp); }
      else { finger(fingers, 0.011, 0.034, 0.0175, -0.01); finger(fingers, -0.017, 0.032, 0.017, 0.03); finger(fingers, -0.042, 0.026, 0.0157, 0.08); }
      if (!this.seamless) finger(index, 0, H3 ? 0.038 : 0.032, 0.0175, H3 ? -0.1 * sp : -0.04);
      // the index finger's pad, on the palm side of its last joint: a fingertip pinch (grip pinch > 0) closes on it
      const pad = new THREE.Object3D(); pad.position.set(0, 0.016, 0.017); bends[bends.length - 1].add(pad); g.userData.pad = pad;
      // the seamless glove pinches with the index's fingertip (the artist's precision pinch): the pad sits at the tip, the
      // index bends further so its tip, not its side, meets the thin thing, and the other fingers stay loosely curled
      if (this.seamless) { pad.position.set(0, 0.027, 0.006); g.userData.pinchBend = { index: 0.1, curl: -0.3 }; g.userData.pinchToThumb = true; }
      // the seamless glove's thumb grows from the lower side of the palm, out of the thenar mound, and leans in towards
      // the fingers (opposing the index) instead of sticking out sideways
      const ta = this.seamless ? 0.5 : 0.75, tl = this.seamless ? 0.019 : 0.017;
      thumb = this.seamless ? piv(0.04, -0.022, 0.014) : piv(0.044, -0.01, 0.012);
      const th = new THREE.Mesh(cap(0.0165, 2 * tl), M("#e020e0")); th.position.set(0.007 + tl * Math.sin(ta), 0.004 + tl * Math.cos(ta), 0); th.rotation.z = -ta; th.castShadow = true; thumb.add(th);
      if (!this.seamless) th.position.set(0.024, 0.018, 0);
      g.userData.thumbTip = th.position.clone().add(new THREE.Vector3(Math.sin(ta), Math.cos(ta), 0).multiplyScalar(tl));
      if (this.seamless) g.userData.thumbBone = { mesh: th, base: new THREE.Vector3(0.007, 0.004, 0), dir: new THREE.Vector3(Math.sin(ta), Math.cos(ta), 0), len: tl };
      th.userData.seg = { half: tl, r1: 0.019, r2: 0.0145 }; digits.push([th]);
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
  _pose(hand, elbow, at, sx, gr, axis = null, palm = null, sh = null, mv = 0, frame = null, palms = null) {
    if (HAND === 2) return this._pose2(hand, elbow, at, sx, gr, axis, palms, sh, frame);
    const U = hand.userData, y = at.clone().sub(elbow);
    // the hand aims along elbow -> hand. When a moving hand sweeps past the elbow point (an arm swinging out from the
    // side to reach), that line shrinks to nothing and turns round in a frame or two, which spun the hand; below 14 cm
    // the shoulder -> hand line takes over smoothly, as the arm's own curve does near its end. Only during a move, so a
    // pose at rest keeps its own hand; for now only on a reach to or from a held object (palm), the one place it is tested
    if (sh && mv > 0 && palm) { const k = Math.min(1, Math.max(0, (0.14 - y.length()) / 0.1)) * mv; if (k > 0) y.addScaledVector(at.clone().sub(sh).normalize(), 0.15 * k * k * (3 - 2 * k)); }
    const dbg = (U.dbg = { yl: rd(y.length(), 3) });
    if (y.lengthSq() < 1e-8) y.set(0, -1, 0); y.normalize();
    const z = new THREE.Vector3(-sx, 0, 0.35).normalize();
    dbg.cond = rd(z.clone().addScaledVector(y, -z.dot(y)).length(), 3); dbg.y = y.toArray().map((v) => rd(v, 2));
    z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize();
    hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
    // the fist turns onto the handle as the hand closes (curl 0.6 -> 0.9), so opening or closing it never pops. The
    // forearm direction, taken square to the handle, is the hand's own axis: the wrist enters the fist from the side and
    // the handle passes in front of the palm (grip frame: +x along the handle, thumb end; +z palm side)
    // a fingertip pinch (grip pinch, glove hands) turns the hand onto the axis too, without closing the fist on it
    const pw = U.glove ? Math.min(1, Math.max(0, gr.pinch || 0)) : 0;
    const w = axis ? Math.max(fistWeight(gr.curl), pw) : 0;
    if (w > 0) dbg.w = rd(w, 2);
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
          dbg.pal = rd(palm.w * f + (1 - f) * on, 2);
        }
      }
    }
    // a hand locked to what it holds (arm pose frame, timeline.js): its rotation is the hold's, whatever the forearm does
    if (frame && frame.w > 0) { hand.quaternion.slerp(frame.q, frame.w); dbg.fr = rd(frame.w, 2); }
    const up = Math.min(1, Math.max(0, gr.up || 0));
    if (up > 0) dbg.up = rd(up, 2);
    if (up > 0) {
      const zu = new THREE.Vector3(0, 1, 0), f = y.clone().addScaledVector(zu, -y.dot(zu)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zu), f, zu));
      hand.quaternion.slerp(_fist, up);
    }
    // a paw resting on a surface (grip down > 0): the palm turns to face the floor and the fingers point ahead (grip
    // ahead: 0 along the forearm .. 1 straight forward), so the curled fingers show their knuckles to the camera
    const dn = Math.min(1, Math.max(0, gr.down || 0));
    if (dn > 0) dbg.dn = rd(dn, 2);
    if (dn > 0) {
      const zd = new THREE.Vector3(0, -1, 0), f = y.clone(); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      f.lerp(new THREE.Vector3(0, 0, 1), gr.ahead ?? 0.7); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zd), f, zd));
      hand.quaternion.slerp(_fist, dn);
    }
    this._digits(hand, sx, gr, axis, pw);
  }
  // the fingers and thumb curled to the grip, and the hand's mirror and size (both hand rigs)
  _digits(hand, sx, gr, axis, pw) {
    const U = hand.userData;
    // y x z points forward for the right hand; the left hand is its mirror image, so the thumb is in front on both
    const k = U.size || 1; hand.scale.set(sx > 0 ? -k : k, k, k);
    if (U.glove) {   // the knuckle takes half the bend, the middle joint the rest (the last finger is the index)
      const pb = U.pinchBend && pw > 0 ? U.pinchBend : null, ci = gr.index + (pb ? pb.index * pw : 0), cc = gr.curl + (pb ? pb.curl * pw : 0);
      U.fingers.rotation.x = 0.85 * cc; U.index.rotation.x = 0.85 * ci;
      // a resting paw (grip down) tucks its fingertips under onto the table, so only a short rounded finger run shows
      U.bends.forEach((b, i) => { b.rotation.x = 1.0 * (i === U.bends.length - 1 ? ci : cc) + 0.45 * Math.min(1, gr.down || 0); });
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
      // the seamless glove's fingertip pinch: the thin thing sits between the index tip and the thumb's tip, so the pads
      // close on it from either side at the front of the hand, with the curled fingers below it, not round it
      if (U.pinchToThumb) { const tt = U.thumbRest.clone().add(U.thumbTip); n.copy(tt.sub(p)).normalize(); }
      const rs = gr.thin ?? 0.005, q = p.addScaledVector(n, rs);
      U.pinchPt.position.copy(q); U.pinchW = pw;
      // close: 0 the thumb stands open (reaching for it, letting go), 1 its pad is on the straw
      const tk = pw * Math.min(1, Math.max(0, gr.close ?? 1));
      const tb = U.thumbBone;
      if (tb) { tb.mesh.scale.y = 1; tb.mesh.position.copy(tb.base).addScaledVector(tb.dir, tb.len); }
      if (tk > 0) {
        const tc = q.clone().addScaledVector(n, rs + 0.0165), d = tc.clone().sub(U.thumbRest), dl = d.length();
        const TT = U.thumbTip || THUMB_TIP, qa = new THREE.Quaternion().setFromUnitVectors(TT.clone().normalize(), d.normalize());
        U.thumb.quaternion.slerp(qa, tk);
        // the seamless glove's thumb keeps its root on the palm's thenar mound (moving the root made the thumb read as a
        // separate lump on the back of the hand, Jonny 29 Oct): it only swings to the pinch, stretching a little if short
        if (tb) { const st = 1 + tk * (Math.min(1.3, Math.max(0.85, dl / TT.length())) - 1); tb.mesh.scale.y = st; tb.mesh.position.copy(tb.base).addScaledVector(tb.dir, tb.len * st); }
        else U.thumb.position.lerp(tc.sub(TT.clone().applyQuaternion(qa)), tk);
      }
    }
  }
  // Hand rig 2 ("rig": { "hand": 2 }): the same turns as _pose (fist on a handle, palm on a hold, locked frame, cupped,
  // paw), each taken as a turn away from the base frame (HAND_Y0), clamped to the wrist (WRIST) and blended as bend and
  // twist, so no blend can take the long way round and nothing switches inside a move. palms: _palms' ends of the move
  _pose2(hand, elbow, at, sx, gr, axis, palms, sh, frame) {
    const U = hand.userData;
    U.dbg = {};
    const q = this._orient2(U, elbow, at, sx, gr, axis, palms, sh, frame, U.dbg);
    hand.quaternion.copy(q); U.hold = q.hold;
    const pw = U.glove ? Math.min(1, Math.max(0, gr.pinch || 0)) : 0;
    this._digits(hand, sx, gr, axis, pw);
  }
  // the hand's turn for rig 2, in the root's space (no side effects but the record dbg, and U.fistPar)
  _orient2(U, elbow, at, sx, gr, axis, palms, sh, frame, dbg = {}) {
    const y = at.clone().sub(elbow), yl = y.length();
    // the hand aims along the drawn arm's end (hand - pull point: the arm curve's own tangent there). Letting the
    // shoulder -> hand line take over when that line is short (plan item 2 a) made the forearm turn more, not less, on
    // the ten clips of 4-5 Nov: over 40 degrees in a frame 92 times today, 235 with the take-over, 125-198 with any fixed
    // share of the shoulder line (tools/hand-probe/forearm-eval.mjs). The arm's own curve folds there, and the hand has
    // to stay on it; a steady elbow (plan item 11) is what removes the fold
    dbg.yl = rd(yl, 3);
    if (globalThis.__DIAG?.forearm) { dbg.a = at.clone().sub(elbow).toArray().map((v) => rd(v, 4)); if (sh) dbg.s = at.clone().sub(sh).toArray().map((v) => rd(v, 4)); }
    if (y.lengthSq() < 1e-8) y.set(0, -1, 0); y.normalize();
    const y0 = HAND_Y0[sx < 0 ? "R" : "L"], z0 = new THREE.Vector3(-sx, 0, 0.35).normalize();
    const B = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y0, z0), y0, z0));
    B.premultiply(new THREE.Quaternion().setFromUnitVectors(y0, y));
    dbg.cond = rd(1 + y.dot(y0), 3); dbg.y = y.toArray().map((v) => rd(v, 2));
    const Bi = B.clone().invert(), T = new THREE.Quaternion(), p = [0, 0, 0];
    let lim = 0, hold = 0;
    const exact = [];   // the holds to match exactly at the end, in order: [turn, how exactly]
    const toward = (r, u) => { for (let i = 0; i < 3; i++) p[i] += u * (r[i] - p[i]); };
    const turn = (q, w, key) => {
      if (!(w > 0)) return;
      const r = wristTurn(T.copy(Bi).multiply(q)), u = w * r[3];
      lim = Math.max(lim, r[4] / WRIST.bend, Math.abs(r[5]) / WRIST.twist);
      dbg[key] = rd(u, 2); toward(r, u);
      const e = exactW(u); hold = Math.max(hold, e); if (e > 0) exact.push([q.clone(), e]);
    };
    // the fist turns onto the handle as the hand closes (as in _pose)
    const pw = U.glove ? Math.min(1, Math.max(0, gr.pinch || 0)) : 0;
    const w = axis ? Math.max(fistWeight(gr.curl), pw) : 0;
    if (w > 0) {
      const x = axis.clone().normalize().multiplyScalar(sx > 0 ? -1 : 1);
      const o = new THREE.Vector3(at.x, 0, 0).normalize().add(new THREE.Vector3(0, 0, 1));
      if (at.x === 0) o.set(-sx, 0, 1);
      const f = y.clone().addScaledVector(x, -y.dot(x)).addScaledVector(o.addScaledVector(x, -o.dot(x)), 1.4 * (1 - pw));
      if (f.lengthSq() < 1e-6) f.set(-sx, 0, 0); f.normalize();
      if (gr.roll) f.applyAxisAngle(x, (gr.roll * Math.PI) / 180);
      if (gr.lean) { const l = (gr.lean * Math.PI) / 180, x0 = x.clone(); x.multiplyScalar(Math.cos(l)).addScaledVector(f, Math.sin(l)); f.multiplyScalar(Math.cos(l)).addScaledVector(x0, -Math.sin(l)); }
      U.fistPar = Math.abs(y.dot(x));
      if (gr.fwd) { f.lerp(new THREE.Vector3(0, 0, 1), gr.fwd).addScaledVector(x, -f.dot(x)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize(); }
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, f, new THREE.Vector3().crossVectors(x, f)));
      turn(_fist, w, "w");
    }
    // the palm on a hold: one point for the whole move (the ends' points blended by their weight), each end's wrap side
    // kept to its own end and the two ends' turns blended, never switched half way
    if (palms) {
      const P = new THREE.Vector3(); let W = 0;
      for (const e of palms) { P.addScaledVector(e.at, e.w); W += e.w; }
      P.multiplyScalar(1 / W);
      const acc = [0, 0, 0]; let wu = 0, qp = null;   // qp: the ends' holds blended, to match exactly on the hold
      for (const e of palms) {
        const zp = P.clone().sub(at), fy = y.clone();
        if (e.wrap) zp.y = 0;
        if (zp.lengthSq() < 1e-6) continue;
        zp.normalize();
        if (e.wrap) { fy.crossVectors(_bY, zp); if ((e.side ?? fy.x * at.x + fy.z * at.z) < 0) fy.negate(); }
        fy.addScaledVector(zp, -fy.dot(zp)); const fl = fy.length();
        if (fl < 1e-6) continue;
        fy.multiplyScalar(1 / fl);
        _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fy, zp), fy, zp));
        // a forearm pointing straight at the hold leaves the palm's roll open: the turn fades there instead of spinning
        const r = wristTurn(T.copy(Bi).multiply(_fist)), u = e.w * r[3] * sstep(fl / 0.3);
        lim = Math.max(lim, r[4] / WRIST.bend, Math.abs(r[5]) / WRIST.twist);
        for (let i = 0; i < 3; i++) acc[i] += u * r[i];
        if (u > 0) { if (!qp) qp = _fist.clone(); else qp.slerp(_fist, u / (wu + u)); }
        wu += u;
      }
      if (wu > 0) { toward(acc.map((v) => v / wu), wu); dbg.pal = rd(wu, 2); const e = exactW(wu); hold = Math.max(hold, e); if (e > 0) exact.push([qp, e]); }
    }
    if (frame && frame.w > 0) turn(frame.q, frame.w, "fr");
    const up = Math.min(1, Math.max(0, gr.up || 0));
    if (up > 0) {
      const zu = new THREE.Vector3(0, 1, 0), f = y.clone().addScaledVector(zu, -y.dot(zu)); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zu), f, zu));
      turn(_fist, up, "up");
    }
    const dn = Math.min(1, Math.max(0, gr.down || 0));
    if (dn > 0) {
      const zd = new THREE.Vector3(0, -1, 0), f = y.clone(); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      f.lerp(new THREE.Vector3(0, 0, 1), gr.ahead ?? 0.7); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      _fist.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(f, zd), f, zd));
      turn(_fist, dn, "dn");
    }
    if (lim > 1) dbg.lim = rd(lim, 2);   // past the wrist's knee (1)
    const out = B.multiply(wristQuat(p, T));
    for (const [q, e] of exact) out.slerp(q, e);
    out.hold = hold;   // how fully the hand is on a hold (fist, palm, locked frame, cupped, paw): the smoothing leans on it
    return out;
  }
  // rig 2's smoothing (plan item 2's fallback): the hand's turn averaged over the frames around it, 4 frames either side
  // (weights cos^2, 0.13 s each way), each worked out from the actor's state at that time, so a turn that comes in one
  // frame (a hold that switches on or off, an arm curve that folds, a quick move) spreads over several. A frame where
  // the hand is on a hold counts 7 times as much, so a hand turns onto a grip a little early, as a hand shapes itself
  // before it touches, and a hand fully on its hold keeps the hold's exact turn. A step the actor takes between two
  // frames (a teleport at a cut, a new place) ends the window there.
  // Every frame is worked out from the story alone, never from the frame drawn before it (frame cache, farm shards)
  _smoothHand(s, t, q0) {
    // the states are shared by both hands of the frame (keyed on the exact time, kept for one frame)
    if (this._stT !== t) { this._stT = t; this._stM = new Map(); }
    const stAt = (tt) => { if (!this._stM.has(tt)) this._stM.set(tt, this.stateAt(tt)); return this._stM.get(tt); };
    const U = this.arms[s].hand.userData, fistPar = U.fistPar, st0 = stAt(t);
    if (!st0) return q0;
    const K = 4, ker = (k) => Math.cos((Math.PI * k) / (2 * K + 2)) ** 2, HOLD = 6;
    const w0 = 1 + HOLD * (U.hold || 0), acc = [q0.x * w0, q0.y * w0, q0.z * w0, q0.w * w0], q = new THREE.Quaternion();
    for (const dir of [-1, 1]) {
      let prev = st0;
      for (let k = 1; k <= K; k++) {
        const tk = Math.round((t + (dir * k) / 30) * 1e6) / 1e6, st = stAt(tk);
        if (!st || !st.arms || Math.hypot(st.x - prev.x, st.z - prev.z) > 0.25 || Math.abs(st.y - prev.y) > 0.25 || Math.abs(Math.atan2(Math.sin(st.yaw - prev.yaw), Math.cos(st.yaw - prev.yaw))) > 1) break;
        prev = st;
        const sq = st.squash ?? 1, S = new THREE.Vector3(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)), ai = this._armIn(st, tk, s, S);
        const qk = this._orient2(U, ai.mid, ai.h, ai.sx, ai.gr, ai.ax, this._palms(ai.a, S, ai.from, ai.to), ai.sh, ai.fr);
        const w = ker(k) * (1 + HOLD * qk.hold) * (qk.dot(q0) < 0 ? -1 : 1);
        acc[0] += qk.x * w; acc[1] += qk.y * w; acc[2] += qk.z * w; acc[3] += qk.w * w;
      }
    }
    U.fistPar = fistPar;
    // a hand fully on its hold keeps the hold's own turn: the window's average is only the way onto it and off it
    return q.set(acc[0], acc[1], acc[2], acc[3]).normalize().slerp(q0, U.hold || 0);
  }
  // the palm holds of an arm's move for _pose2: each end's point (nested blends opened up), weight, wrap and wrap side
  // (the side test of _palm, at that end's hand)
  _palms(a, S, from, to) {
    const ends = [];
    const add = (q, w, eh) => {
      if (!q || !(w > 0)) return;
      if (q.mix) { add(q.mix.from, w * (1 - q.mix.p), eh); add(q.mix.pose, w * q.mix.p, eh); return; }
      if (!q.palm) return;
      const e = new THREE.Vector3(q.palm[0], this.legH + this.H * q.palm[1], q.palm[2]);
      const side = eh ? Math.sign((e.z - eh[2]) * eh[0] - (e.x - eh[0]) * eh[2]) || 1 : null;
      e.y = this.legH + (e.y - this.legH) * S.y;
      ends.push({ at: e, w, wrap: !!q.wrap, side });
    };
    add(a.from, 1 - a.p, from); add(a.pose, a.p, to);
    return ends.length ? ends : null;
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
    const pv = (p) => new THREE.Vector3(p[0], this.legH + this.H * p[1], p[2]), q0 = p0 && pv(p0.palm), q1 = p1 && pv(p1.palm);
    const end = a.p < 0.5 ? (p0 ? 0 : 1) : (p1 ? 1 : 0), e = end ? q1 : q0, eh = end ? to : from;
    // the side test of _pose, cross(up, palm - hand) . hand, at that end of the move
    const side = e && eh ? Math.sign((e.z - eh[2]) * eh[0] - (e.x - eh[0]) * eh[2]) || 1 : null;
    const at = q0 && q1 ? q0.clone().lerp(q1, a.p) : (q1 || q0).clone();
    at.y = this.legH + (at.y - this.legH) * S.y;
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
    // body.square (core build): a rounded box instead of an egg (a superellipsoid, 2 = round)
    const q = this.def.body.square; if (q) r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q);
    return new THREE.Vector3(d.x * this.rx * taper * r, this.cy + d.y * this.ry * r, d.z * this.rz * taper * r);
  }
  // the core build's head (def.head: width, height, depth, square, taper, neck, size): its own group on top of the torso,
  // turned by the gaze (apply), with the skin, the face, a small nose and ears. headSurf is surf() on the head, in the
  // head group's space (origin at the head's centre)
  _headInit(HD) {
    const g = new THREE.SphereGeometry(1, 96, 72), p = g.attributes.position, v = new THREE.Vector3();
    const hr = (this.head = { rx: HD.width / 2, ry: HD.height / 2, rz: HD.depth / 2, def: HD, group: new THREE.Group() });
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const q = this.headPoint(v); p.setXYZ(i, q.x, q.y, q.z); }
    g.computeVertexNormals();
    hr.mesh = new THREE.Mesh(g, this.skin); hr.mesh.castShadow = true; hr.mesh.receiveShadow = true;
    hr.cy = this.cy + this.ry + (HD.neck ?? 0.02) + hr.ry; hr.group.position.set(0, hr.cy, HD.forward ?? 0); hr.group.rotation.order = "YXZ";
    hr.group.add(hr.mesh); this.potatoParts.add(hr.group);
    // the neck: a short skin column from inside the torso's top up into the head (its top stays inside the head as it
    // turns), so the head sits on the body instead of floating over it. head.neckR: its radius (0 = none)
    const nr = HD.neckR ?? Math.min(hr.rx, hr.rz) * 0.42;
    if (nr > 0) {
      const y0 = this.cy + this.ry * (HD.neckFillet ? 0.4 : 0.8), y1 = hr.cy - hr.ry * 0.35;   // a filleted neck roots deeper so its foot never shows over a forward-set chest
      // head.neckFillet (opt-in, Pebble 7 Nov 13:16): the neck's cylinder reshaped: it leans from the chest's middle to under the head, and its top also widens (share of nr) so it runs
      // into the head's underside at a shallow angle instead of meeting it as a hard-edged column; the bottom flares as
      // neckFlare does
      const F = HD.neckFillet, rb = nr * (1.08 + (HD.neckFlare ?? 0)), h = y1 - y0;
      const ng = F ? new THREE.CylinderGeometry(nr, rb, h, 40, 12, true, Math.PI) : new THREE.CylinderGeometry(nr, rb, h, 32, 1, true);   // (its seam at the back)
      if (F) { const q = ng.attributes.position; for (let k = 0; k < q.count; k++) { const y = q.getY(k), t = y / h + 0.5, r0 = Math.hypot(q.getX(k), q.getZ(k)), r1 = nr + (rb - nr) * (1 - t) ** 2 + nr * F * t ** 3; if (r0 > 1e-6) { q.setX(k, q.getX(k) * r1 / r0); q.setZ(k, q.getZ(k) * r1 / r0 + (t - 0.5) * (HD.forward ?? 0)); } } ng.computeVertexNormals(); }   // and leans forward: its foot over the chest's middle, its top under the head
      hr.neck = new THREE.Mesh(ng, this.skin);   // head.neckFlare (opt-in): a throat widening into the chest
      hr.neck.position.set(0, (y0 + y1) / 2, (HD.forward ?? 0) * 0.5); hr.neck.castShadow = true; this.potatoParts.add(hr.neck);
    }
    if (HD.nose) { const n = this.headSurf(0, HD.nose.v ?? -0.08), m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.skin); m.scale.set(HD.nose.w ?? 0.03, HD.nose.h ?? 0.026, HD.nose.d ?? 0.022); m.position.copy(n.pos).addScaledVector(n.normal, -0.006); m.lookAt(n.pos.clone().add(n.normal)); hr.group.add(m); hr.nose = m; }
    if (HD.ears) for (const sd of [-1, 1]) { const e = this.headSurf(sd * 1.5, HD.ears.v ?? 0), m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), this.skin); m.scale.set(HD.ears.w ?? 0.03, HD.ears.h ?? 0.05, HD.ears.d ?? 0.018); m.position.copy(e.pos).addScaledVector(e.normal, 0.004); m.lookAt(e.pos.clone().add(e.normal)); m.castShadow = true; hr.group.add(m); }
  }
  headPoint(d) {
    const H = this.head, D = H.def, q = D.square ?? 2;
    let r = 1 / Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q);
    const taper = 1 - (D.taper ?? 0) * d.y;   // > 0: fuller cheeks, a narrower crown
    // head.muzzle { a, v, w, h } (Pebble the tortoise, costumes-pebble.js): a soft snout swelling out of the lower face,
    // a bump of a (share of the radius) centred at elevation v, w wide and h tall (in direction units). The face is
    // placed on this surface (headSurf), so the mouth sits on the snout
    const M = D.muzzle;
    if (M && d.z > 0) { const dy = d.y - Math.sin(M.v ?? -0.25); r *= 1 + (M.a ?? 0.1) * Math.exp(-((d.x / (M.w ?? 0.45)) ** 2) - (dy / (M.h ?? 0.3)) ** 2) * Math.min(1, d.z * 2.5); }
    const out = new THREE.Vector3(d.x * H.rx * taper * r, d.y * H.ry * r, d.z * H.rz * taper * r), P = D.profile;
    // head.profile (Pebble's correction, 6 Nov 2026; opt-in): a tortoise head shaped by separate displacements instead
    // of one radial bump. cheek: the sides widen round elevation cheekV (share of the width); snout: the lower front
    // pushes FORWARD only (share of the depth), w wide and h tall round elevation v, lift raises its tip a little; jaw:
    // the underside rounds off (share of the height) so no chin wedge forms. round (default 1): > 1 flattens the snout's
    // swelling into a rounded muzzle with a soft edge instead of a pointed Gaussian tip (Jonny 7 Nov: "not rounded"). Normals come from this same surface
    // (headSurf differentiates headPoint), so the face, cap and spots sit on what is drawn
    if (P) {
      const cheek = (P.cheek ?? 0) * Math.exp(-(((d.y - (P.cheekV ?? -0.2)) / (P.cheekH ?? 0.5)) ** 2));
      out.x *= 1 + cheek;
      if (P.snout) {
        const fz = Math.max(0, Math.min(1, (d.z - 0.05) / 0.55)), q = (d.x / (P.w ?? 0.45)) ** 2 + ((d.y - (P.v ?? -0.15)) / (P.h ?? 0.3)) ** 2, f = Math.exp(-(q ** (P.round ?? 1))) * fz * fz * (3 - 2 * fz);
        out.z += P.snout * H.rz * f; out.y += (P.lift ?? 0) * H.ry * f;
      }
      if (P.jaw && d.y < 0) out.y *= 1 - P.jaw * d.y * d.y;
      // throat (opt-in, Pebble 7 Nov 12:07: "round the lower jaw into the neck"): below elevation from (d.y), the head's
      // underside draws in to a neck of radius r round a centre z forward, and runs drop metres further down, so the jaw
      // flows into a short throat instead of ending on a broad base over a separate column
      const T = P.throat;
      if (T && d.y < (T.from ?? -0.3)) {
        const f0 = T.from ?? -0.3, t = Math.min(1, (f0 - d.y) / (1 + f0)), k = t * t * (3 - 2 * t), zc = T.z ?? 0;
        const hz = out.z - zc, L = Math.hypot(out.x, hz), rT = T.r ?? 0.12, m = L > 1e-6 ? (L + (rT - L) * k) / L : 0;
        out.x *= m; out.z = zc + hz * m; out.y -= (T.drop ?? 0.06) * k;
      }
    }
    return out;
  }
  headSurf(th, ph) {
    const at = (a, b) => this.headPoint(new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)));
    const e = 0.002, pos = at(th, ph);
    const dt = at(th + e, ph).sub(at(th - e, ph)), dp = at(th, ph + e).sub(at(th, ph - e));
    return { pos, normal: dt.cross(dp).normalize() };
  }
  // surface point + outward normal by angle around (theta, 0 = front) and elevation (phi)
  surf(th, ph) {
    const at = (a, b) => this.bodyPoint(new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)));
    const e = 0.002, pos = at(th, ph);
    const dt = at(th + e, ph).sub(at(th - e, ph)), dp = at(th, ph + e).sub(at(th, ph - e));
    return { pos, normal: dt.cross(dp).normalize() };
  }
  topY() { return this.head ? this.head.cy + this.head.ry : this.cy + this.ry * (1 + this.lumpAt(new THREE.Vector3(0, 1, 0))); }
  lumpAt(d) { let r = 0; for (const L of this.lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d))); return r; }

  // an arm's centre line from shoulder a through elbow guide c to hand b. joint: c is an elbow the arm passes through
  // (two segments with a rounded turn, cutting the corner by a fifth of each), else a curve's pull point. Shared by the drawn arm and the contact checks.
  static armCurve(a, c, b, joint = false) {
    return joint ? new THREE.CatmullRomCurve3([a, a.clone().lerp(c, 0.5), c.clone().lerp(a, 0.2), c.clone().lerp(b, 0.2), c.clone().lerp(b, 0.6), b], false, "centripetal")
      : new THREE.QuadraticBezierCurve3(a, c, b);
  }
  // the arm tube's radius at t along it (0: the shoulder, 1: the wrist) for limb width w: rooted inside the body with a
  // wider shoulder (no cut tube end shows), narrowing to a wrist before the mitten
  // k (limbs.armTaper, opt-in, Pebble 7 Nov): a further share the forearm narrows by toward the wrist (0: none)
  // a legs.dome leg's radius at t (0 hip .. 1 foot); without a dome the leg is a plain tube of radius w
  static legRadius(t, w, dome) { return dome ? w * (t < (dome.top ?? 0.3) ? Math.sqrt(Math.max(0.0004, 1 - (1 - t / (dome.top ?? 0.3)) ** 2)) : 1) * (1 + (dome.flare ?? 0) * t ** (dome.flareP ?? 1)) * (1 - (dome.waist ?? 0) * Math.sin(Math.PI * t)) : w; }
  static armRadius(t, w, k = 0) { return w * (t < 0.06 ? 1.19 * Math.sqrt(1 - (1 - t / 0.06) ** 2) : t < 0.25 ? 1.25 - t : t > 0.8 ? 1 - (t - 0.8) * 1.1 : 1) * (k ? 1 - k * Math.min(1, Math.max(0, (t - 0.2) / 0.7)) ** 1.2 : 1); }
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
    // hands.oneMat (opt-in, Pebble 7 Nov): the hand's skin and the arm tube share one material, so the look shades them
    // alike; as two materials the skin came out lighter, and where it overlaps the tube over the forearm's last stretch
    // it showed as pale stripes with dark diamonds between the tube's flat sides
    if (this.def.hands?.oneMat) this.skinMat ??= this.armMat ??= Object.assign(this.limbMat.clone(), { userData: { ...this.limbMat.userData, noOutline: true } });
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
  // finger radius). A pose exactly the same as the last frame's keeps its mesh (exactly: a rounded key kept a mesh built for a slightly
  // different pose, so a frame depended on the frame drawn before it and a shard or a cached frame came out different).
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
    // the palm (artist's sheet, 29 Oct): three flat-ish round cones fanning from a narrow wrist (about 55 % of the
    // knuckle width) out to a broad knuckle arch, the middle one set back so the palm is gently cupped, and a thenar
    // mound on the lower thumb side that the thumb grows out of through a soft web. [x, y, z at the wrist, x, y, z at the
    // knuckles, radius there, radius here] in hand units
    const PALM = [[-0.01, -0.03, 0.002, -0.032, 0.03, 0.005, 0.019, 0.021], [0.001, -0.032, -0.002, 0.001, 0.031, -0.003, 0.021, 0.023], [0.012, -0.03, 0.002, 0.03, 0.028, 0.005, 0.019, 0.021], [0.012, -0.03, 0.009, 0.036, -0.018, 0.013, 0.019, 0.018]];
    const palm = (hs.palm || PALM).map((c) => cone(P(c[0], c[1], c[2]), P(c[3], c[4], c[5]), c[6] * k, c[7] * k));
    // the forearm's last stretch (hands.stub metres of it), on the arm's own curve and 1 % thinner than its tube
    const curve = Character.armCurve(a.shoulder, a.elbow, hand.position, a.joint), arm = [], L = curve.getLength(), N = 4;
    const t0 = Math.max(0.3, 1 - (hs.stub ?? 0.15) / L), R = (t) => Character.armRadius(t, this.limbW, this.def.limbs?.armTaper) * 0.99;
    for (let i = 0; i < N; i++) { const ta = t0 + ((1 - t0) * i) / N, tb = t0 + ((1 - t0) * (i + 1)) / N; arm.push(cone(curve.getPointAt(ta), curve.getPointAt(tb), R(ta), R(tb))); }
    // hands.cuff { at, r, len }: a rolled glove rim round the wrist, at metres from the hand's centre, r times the arm
    const cuff = [];
    if (hs.cuff) { const c = hs.cuff, ta = 1 - (c.at ?? 0.1) / L, tb = 1 - ((c.at ?? 0.1) - (c.len ?? 0.025)) / L; cuff.push(cone(curve.getPointAt(ta), curve.getPointAt(tb), R(ta) * (c.r ?? 1.25), R(tb) * (c.r ?? 1.25))); }
    const fr = 0.0185 * k, b = hs.blend || {};
    const shape = { arm, palm, digits, cuff, sep: (b.sep ?? 0.12) * fr, wrist: (b.wrist ?? 0.8) * fr, root: (b.root ?? 0.5) * fr, joint: (b.joint ?? 0.15) * fr, palmK: (b.palm ?? 0.7) * fr };
    const key = [...arm, ...palm, ...digits.flat(), ...cuff].map((c) => [...c.a, ...c.ba, c.r1, c.r2].join(",")).join(";");
    a.skin.matrix.identity(); a.ink.matrix.identity(); a.skin.matrixWorldNeedsUpdate = a.ink.matrixWorldNeedsUpdate = true;
    a.skinH = new THREE.Matrix4().multiplyMatrices(inv, hand.matrixWorld);
    if (key === a.skinKey && !globalThis.__noGeomCache) return;
    // meshing ahead on workers (mesh-pool.js): the collecting pose only lists the shape; the real pose takes the
    // finished mesh made for exactly this shape, or meshes it here
    const pre = globalThis.__skinPre, h = hs.cell ?? 0.004;
    if (pre?.collect) { pre.jobs.push({ key: shapeKey(shape, h), shape, h }); return; }
    const made = pre?.ready?.get(shapeKey(shape, h));
    a.skinKey = key; a.skin.geometry.dispose();
    a.skin.geometry = a.ink.geometry = made ? geometryOf(made) : meshShape(shape, h);
  }

  _tube(old, a, c, b, w, arm = false, joint = false, stub = 0, dome = null) {
    if (old) { old.geometry.dispose(); this.root.remove(old); }
    const curve = Character.armCurve(a, c, b, joint);
    // arms: rooted inside the body with a wider shoulder (no cut tube end shows) and narrowing to a wrist before the mitten.
    // stub: under a seamless hand's skin (which carries on over the last `stub` metres of the arm), the tube closes in a
    // round cap half way along that stretch, so its outline never shows through the hand
    const L = stub ? curve.getLength() : 1, ts = 1 - (stub * 0.5) / L, tc = (w * 0.9) / L;
    const cap = (t) => (!stub || t <= ts ? 1 : Math.sqrt(Math.max(0, 1 - ((t - ts) / tc) ** 2)));
    // legs.dome (opt-in, Pebble 7 Nov "boots with flat exposed upper edges"): { top, flare } a leg whose root closes in a
    // round dome over its first `top` share (rooted inside the body, it swells out of the lower torso like a haunch) and
    // widens by `flare` toward the foot, so it reads as a short sturdy leg, not a cut tube
    const geo = arm ? taperedTube(curve, 0, 0, 32, 14, (t) => Character.armRadius(t, w, this.def.limbs?.armTaper) * cap(t))
      : dome ? taperedTube(curve, 0, 0, 28, 20, (t) => Character.legRadius(t, w, dome))
      : new THREE.TubeGeometry(curve, 14, w, this.head ? 18 : 8, false);   // the core build's thick suit legs: rounder
    if (stub) geo.setAttribute("ink", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(1), 1));
    const m = new THREE.Mesh(geo, stub ? this.armMat : this.limbMat); m.castShadow = true; this.root.add(m);
    return m;
  }

  _stain(s, a, c, b, joint) {
    const A = this.arms[s];
    if (!A.stain) {
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const g = cv.getContext("2d");
      g.fillStyle = "#a245d6";
      // blotches all the way round the sleeve (the tube's frame turns with the arm, so no side is "the front"), thinning
      // toward both ends; each one drawn again across the seam so the ring closes
      for (const [x, y, r] of [[120, 64, 30], [150, 30, 24], [96, 100, 24], [170, 84, 20], [70, 40, 16], [196, 112, 13], [128, 8, 18], [110, 128, 14], [40, 76, 8], [222, 20, 7], [88, 70, 12], [160, 56, 16]])
        for (const dy of [-128, 0, 128]) { g.beginPath(); g.arc(x, y + dy, r, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "rgba(255,235,255,0.5)"; for (const [x, y] of [[112, 50], [160, 22], [100, 104]]) { g.beginPath(); g.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2); g.fill(); }
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      A.stain = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.3, depthWrite: false }));
      A.stain.material.userData.noOutline = true; A.stain.renderOrder = 2; this.root.add(A.stain);
    }
    const arm = Character.armCurve(a, c, b, joint), t0 = 0.56, t1 = 0.9, pts = [];
    for (let k = 0; k <= 12; k++) pts.push(arm.getPoint(t0 + (t1 - t0) * (k / 12)));
    const w = this.limbW, rad = (t) => { const u = t0 + (t1 - t0) * t; return w * 1.1 * (u > 0.8 ? 1 - (u - 0.8) * 1.1 : 1); };
    A.stain.geometry.dispose(); A.stain.geometry = taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 20, 16, rad);
  }

  // st: the state the timeline computed for this frame
  // an arm's inputs at st, t: where the hand goes, the shoulder, the grip, the held handle's axis, a locked hold's
  // turn and the arm curve's pull point (S: the body's squash scale)
  _armIn(st, t, s, S) {
    const sx = s === "R" ? -1 : 1, a = st.arms[s];
    const from = handTarget(a.from, sx, this.rx, this.H, t, this.legH), to = handTarget(a.pose, sx, this.rx, this.H, t, this.legH);
    const h = new THREE.Vector3().fromArray(arcLerp(from, to, a.p, sx));
    // natural gait (timeline.js natMove): an arm hanging at rest swings against its own side's leg, along the walk
    // (a pose object with `swing` swings too: a character's own walking arms, e.g. Pebble's, instead of the generic rest)
    const sw_ = (p) => (p === "rest" ? 1 : p && typeof p === "object" && p.swing ? +p.swing : 0);
    const g = st.gait, rw = g ? sw_(a.pose) * a.p + sw_(a.from) * (1 - a.p) : 0;
    if (rw > 0) {
      const u = g.ph + (s === "R" ? 0 : 0.5), sw = -0.055 * g.amt * Math.min(1.5, Math.max(0.6, g.sd)) * Math.cos(2 * Math.PI * u) * rw;
      h.x += sw * g.dir[0]; h.z += sw * g.dir[1];
    }
    // timeline.js a.nudge ([x, y, z], this unscaled frame): the hand's drag and settle and the contact solver's push
    if (a.nudge) { h.x += a.nudge[0]; h.y += a.nudge[1]; h.z += a.nudge[2]; }
    h.y = this.legH + (h.y - this.legH) * S.y;
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
      // timeline.js a.elbowNudge ([x, y, z], unscaled): the elbow leading the hand, the solver's push; before the body push
      if (a.elbowNudge) mid.add(new THREE.Vector3(a.elbowNudge[0], a.elbowNudge[1] * S.y, a.elbowNudge[2]));
      const joint = dn > 0.5;
      // pose.margin: a pose's own elbow clearance (Pebble's hanging arms on a wide body), blended like the pose so the
      // elbow doesn't jump when a move between two poses starts
      const mg = (q) => (q && q.mix ? mg(q.mix.from) * (1 - q.mix.p) + mg(q.mix.pose) * q.mix.p : (q && typeof q === "object" && q.margin) || 1.3);
      this._outside(mid, S, joint ? 1 : mg(a.from) * (1 - a.p) + mg(a.pose) * a.p);
      return mid;
    };
    const mid = elbowFor(h);
    return { sx, a, from, to, h, sh, shN, gr, ax, dn, fr, mid };
  }
  apply(st, t) {
    const R = this.root;
    ARCS = !!st.arcs;
    R.position.set(st.x, st.y - 0.1 * (st.kneel || 0), st.z); R.rotation.set(st.pitch || 0, st.yaw, st.lean); R.scale.setScalar(st.scale ?? 1);
    R.visible = st.visible !== false;
    this.bodyGroup.visible = !st.pov;   // first person (timeline.js "pov"): only the limbs are drawn
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
    // fat drips: each slides down from its start, speeding up, stretches at the bottom and drops off, then a new
    // bead swells at the start
    for (const d of this.drips) {
      const u = ((t / d.per + d.off) % 1), ph = d.ph0 - (d.ph0 + 0.95) * u ** 1.7, sp = this.surf(d.th, ph);
      d.m.position.copy(sp.pos).addScaledVector(sp.normal, 0.012);
      const grow = Math.min(1, u * 6), stretch = 1.3 + 2.2 * u;
      d.m.scale.set(grow * 0.75, grow * stretch, grow * 0.7); d.m.visible = u < 0.97;
    }
    this.fries.group.visible = fries;
    if (fries) this.fries.apply(st, t);

    // only speech rounds the lips through `round` (an expression's own "round" was never drawn; use "pucker")
    const e = { ...st.expr }; delete e.round;
    if (this.restBias) {
      const K = EXPRESSIONS.kind, far = Math.abs(e.open - K.open) * 1.6 + Math.abs(e.eye - K.eye) * 2.2 + Math.abs(e.curve - K.curve) * 0.9 + Math.abs(e.tilt - K.tilt) * 1.4 + Math.abs((e.pupil ?? 1) - 1) * 2;
      const w = Math.max(0, Math.min(1, 1 - (far - 0.12) / 0.7));
      for (const k in this.restBias) e[k] = (e[k] ?? 0) + this.restBias[k] * w;
    }
    if (st.talk > 0) { e.open = Math.max(e.open, st.talk); e.round = st.round; }
    if (!fries) this.face.set(e, st.look, st.blink, st.face);
    // the core build's head follows the gaze part of the way (the eyes lead, the head turns about a third as far)
    if (this.head) { const lk = st.look || [0, 0], HD = this.head.def; this.head.group.rotation.set(-(HD.nod ?? 0.12) * lk[1] - (HD.pitch ?? 0), (HD.turn ?? 0.32) * lk[0], 0); }   // head.pitch: a resting chin-up tilt (radians; Pebble)

    // limbs (hidden in fries form)
    const showLimbs = !fries;
    const S = this.bodyGroup.scale;
    const hands = {};
    for (const s of ["R", "L"]) {
      const ai = this._armIn(st, t, s, S), { sx, a, from, to, h, sh, shN, gr, ax, dn, fr } = ai;
      let mid = ai.mid;
      hands[s] = h;
      const hand = this.arms[s].hand, U = hand.userData, pose = (h, mid) => { hand.position.copy(h); if (U.fingers) this._pose(hand, mid, h, sx, gr, ax, HAND === 2 ? null : this._palm(a, h, S, from, to), sh, Math.min(1, Math.max(0, 4 * a.p * (1 - a.p))), fr, HAND === 2 ? this._palms(a, S, from, to) : null); };
      pose(h, mid);
      // an arm pose aimed with point "pinch" (a straw, a pencil): the fingertip pinch lands on the target, not the hand's
      // centre, so the prop runs between the pads. The hand is posed for the target first; then hand and elbow shift
      // together by the pinch's offset, so the hand keeps its turn and the forearm still runs straight into the wrist
      // (blended like the pose itself)
      const pp = U.pinchPt ? this._pointW(a) : 0;
      if (pp > 0 && U.pinchW > 0) {
        hand.updateMatrix();
        // pose.pinchEase (Pebble's straw, 6 Nov 2026; opt-in): the shift grows with the pinch itself (U.pinchW), so the
        // hand doesn't jump the pinch's whole offset in the frame the pads start or stop closing
        const ease = (q) => q && typeof q === "object" && (q.pinchEase || (q.mix && (ease(q.mix.pose) || ease(q.mix.from))));
        const off = U.pinchPt.position.clone().applyMatrix4(hand.matrix).sub(h).multiplyScalar(pp * (ease(a.pose) || ease(a.from) ? Math.min(1, U.pinchW) : 1));
        h.sub(off); mid.sub(off); pose(h, mid);
      }
      if (HAND === 2 && SMOOTH && U.fingers && this.stateAt) hand.quaternion.copy(this._smoothHand(s, t, hand.quaternion));
      const joint = dn > 0.5;
      this.arms[s].elbow = mid; this.arms[s].joint = joint; this.arms[s].shoulder = sh.clone().addScaledVector(shN, -0.035);
      if (globalThis.__DIAG?.anchors) this._anchors(s, [this.arms[s].shoulder, mid, h]);
      this.arms[s].hand.visible = showLimbs;
      // legs
      const ph = st.walk * 6.283 + (s === "R" ? 0 : Math.PI);
      const sd = st.stride ?? 1, lift = st.walkAmt * Math.max(0, Math.sin(ph)) * 0.07 * sd;
      const fX = this.def.legs?.footX ?? 0.13;   // legs.footX (opt-in, Pebble 7 Nov): how far out each foot stands
      const foot = new THREE.Vector3(sx * fX, 0.035 + lift + st.tuck * 0.08, 0.04 + st.walkAmt * Math.cos(ph) * 0.05 * sd);
      if (st.gait) {
        // natural gait: each foot stands for 58 % of the cycle and slides back under the body at exactly the body's
        // speed (so it stays put on the floor), then swings forward along the walk, lifted, easing out and in
        const G = st.gait, u = (((G.ph + (s === "R" ? 0 : 0.5)) % 1) + 1) % 1, ST = 0.58, A = 0.5 * ST * 0.2 * G.sd * G.amt;
        let along, up = 0;
        if (u < ST) along = A * (1 - (2 * u) / ST);
        else { const w = (u - ST) / (1 - ST); along = -A + 2 * A * (w - Math.sin(2 * Math.PI * w) / (2 * Math.PI)); up = Math.sin(Math.PI * w) * 0.065 * Math.min(1.4, G.sd) * G.amt; }
        foot.set(sx * fX + along * G.dir[0], 0.035 + up + st.tuck * 0.08, 0.04 + along * G.dir[1]);
      }
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
      // foot targets (timeline.js st.feet, the planted gait: { R: { x, y, z, yaw, w }, L }): where each foot stands, in the
      // same space as st.x, st.y, st.z (the stage, or the rig the actor rides), y the foot's centre (floor + 0.035 x scale
      // + lift), yaw (radians, like st.yaw; optional) the way it faces; w 0..1 blends it in over everything above
      this.legs[s].flat = null;
      const ft = st.feet?.[s], fw = ft ? Math.min(1, Math.max(0, ft.w ?? 1)) : 0;
      if (fw > 0) {
        R.updateMatrix();
        const inv = new THREE.Matrix4().copy(R.matrix).invert();
        foot.lerp(new THREE.Vector3(ft.x, ft.y, ft.z).applyMatrix4(inv), fw);
        if (ft.yaw != null) this.legs[s].foot.quaternion.slerp(R.quaternion.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ft.yaw)), fw);
        // the heel-to-toe roll (timeline.js rollAt, "motion": { "feet": 3 }): the foot turns about its heel (toes up)
        // or its ball (heel up), so that edge stays where it is on the floor. legs.heel / legs.toe / legs.sole (m, the
        // character's own foot; default the potato foot): how far behind and ahead of the foot's centre, and how far
        // under it, the edges sit
        this.legs[s].flat = ft.pitch ? foot.clone() : null;   // where the foot would stand flat (rig(): the planted point)
        if (ft.pitch) {
          const a = ft.pitch * fw, LG = this.def.legs || {}, q = this.legs[s].foot.quaternion;
          const P = new THREE.Vector3(0, -(LG.sole ?? 0.035), a > 0 ? -(LG.heel ?? 0.094) : (LG.toe ?? 0.094));
          const rx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -a);
          foot.add(P.clone().sub(P.clone().applyQuaternion(rx)).applyQuaternion(q));
          q.multiply(rx);
        }
      }
      // a toe tap (timeline "tap"): the foot turns up about its heel, so the toe lifts while the heel stays on the floor
      const tp = st.tap?.[s] || 0;
      if (tp > 0) { const ang = 0.5 * tp; foot.y += 0.094 * Math.sin(ang); foot.z -= 0.094 * (1 - Math.cos(ang)); this.legs[s].foot.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -ang)); }
      const hip = new THREE.Vector3(sx * (this.def.legs?.hipX ?? 0.12), this.legH * S.y + (this.def.legs?.hipY ?? 0.06), 0.0);   // legs.hipY (opt-in): the leg's root above the body's bottom
      this.legs[s].foot.position.copy(foot); this.legs[s].foot.visible = showLimbs;
      const key = [h.x, h.y, h.z, sh.x, sh.y, foot.x, foot.y, foot.z, hip.y, mid.x, mid.y, mid.z, st.grip?.[s]?.down || 0].join(",");
      if (showLimbs && key !== this[`_k${s}`]) {
        this[`_k${s}`] = key;
        this.arms[s].mesh = this._tube(this.arms[s].mesh, this.arms[s].shoulder, mid, h, this.limbW, true, joint, this.seamless ? this.def.hands.stub ?? 0.15 : 0);
        const knee = hip.clone().lerp(foot, 0.5).add(new THREE.Vector3(sx * 0.02, 0, 0.02 + (this.def.legs?.knee ?? 0)));
        this.legs[s].mesh = this._tube(this.legs[s].mesh, hip, knee, foot, this.def.legs?.width ?? this.limbW * 1.1, false, false, 0, this.def.legs?.dome);
        this.legs[s].hip = hip; this.legs[s].knee = knee;   // the leg's curve, for costume parts that follow it (costumes-core.js)
      }
      // a juice stain on the forearm (face controls stainR / stainL, Vampire vs Juice Box): a wet purple patch wrapped
      // round the arm just above the wrist, rebuilt with the arm
      const stn = Math.min(1, Math.max(0, st.face?.[s === "R" ? "stainR" : "stainL"] || 0));
      if (stn > 0.01 && showLimbs) {
        if (this[`_sk${s}`] !== key) { this[`_sk${s}`] = key; this._stain(s, this.arms[s].shoulder, mid, h, joint); }
        this.arms[s].stain.visible = true; this.arms[s].stain.material.opacity = Math.min(1, stn * 1.4);
      } else if (this.arms[s].stain) this.arms[s].stain.visible = false;
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
  // the final drawn positions of the limbs, in the root's space (stage.js turns them into world space for the rig
  // motion check, qa/rig.mjs): each hand, the arm's middle (where an elbow pops), each foot. Shown: the limb is drawn
  rig() {
    const out = {};
    for (const s of ["R", "L"]) {
      const a = this.arms[s];
      if (a.hand && a.hand.visible !== false) out[`h${s}`] = a.hand.position.clone();
      if (a.elbow && a.shoulder && a.hand) out[`e${s}`] = Character.armCurve(a.shoulder, a.elbow, a.hand.position, a.joint).getPoint(0.5);
      // a rolling foot (heel to toe) turns about its heel or ball, so its centre rises and moves a little while that edge
      // stays put: the rig check follows where the foot would stand flat (the same point when it is flat)
      const f = this.legs[s]?.foot; if (f && f.visible) out[`f${s}`] = (this.legs[s].flat || f.position).clone();
    }
    return out;
  }

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
    for (const s of ["R", "L"]) { this.arms[s].hand.updateMatrixWorld(true); out[`q${s}`] = this.arms[s].hand.getWorldQuaternion(new THREE.Quaternion()).toArray(); out[`dbg${s}`] = this.arms[s].hand.userData.dbg || null; }
    // how far each hand reaches across the body's middle to the other side, in metres (0 or less: on its own side). Far
    // across, the shoulder hides behind the body and the arm reads as coming out of the chest (Zombie Too hug, 4 Nov)
    out.cross = { R: this.arms.R.hand.position.x, L: -this.arms.L.hand.position.x };
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
      out.push({ c, r: Character.armRadius(i / 24, this.limbW, this.def.limbs?.armTaper) * k });
    }
    return out;
  }
  // the visible costume meshes (hat, brim, beard, raven, hood, wings, the costume's own staff or blade) with a name for
  // reports: everything drawn on the character except its body, face, specks, arms, hands, legs and feet; parts under
  // 3 cm and see-through ones (glows, glass) left out
  costumeMeshes() {
    const skip = new Set([this.potatoParts, this.fries.group, ...["R", "L"].flatMap((s) => [this.arms[s].mesh, this.arms[s].hand, this.arms[s].skin, this.arms[s].ink, this.arms[s].tubeInk, this.legs[s].mesh, this.legs[s].foot]), ...Object.values(this._anc || {}).flat()].filter(Boolean));
    const C = this.costume, out = [], sc = new THREE.Vector3(), size = new THREE.Vector3();
    const walk = (o, name) => {
      if (skip.has(o) || !o.visible || o.userData.skin) return;   // userData.skin: painted on the skin (Pebble's limb spots)
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

