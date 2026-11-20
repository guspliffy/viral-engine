// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md section C): the MONSTER, kind `heartmonster`.
// ONE lofted skin from the tail tuft to the snout tip (the bear's build, props-bear.js): a bloated grey-olive HIPPO back half, a LION front
// with a matted mane, a scarred CROC head with 36 crooked mixed teeth, amber eyes, drool. Metres, degrees; every number is at scale 1.
// A pure function of the spec, its state and the clip time t (no random numbers: every mark comes from an index; no clock).
//
//   KIND heartmonster   Origin: the floor between the four feet, facing +z (+x = her LEFT, the HEART side in the opening), at stand.
//     Size at stand: rump z -1.15 (tail tuft to z -1.43), snout tip z +1.75 (3.2 m long), 1.20 wide at z -0.5, belly sagging to y 0.30,
//     rump 1.15, shoulders 1.22, crown 1.30, mane top 1.40. Mouth point M = (0, 0.95, 1.72), jaw shut. Hippo hind legs: stumps 0.36 across at
//     x +-0.37, 4 blunt toes + 8 hind nails of 4 cm. Lion forelegs 0.20 thick at x +-0.30, paws 0.30 x 0.34 x 0.13, 8 front claws of 7 cm.
//     Pivots (stand): hips (0, 0.80, -0.75); shoulders (+-0.30, 0.95, 0.40); neck base (0, 1.05, 0.55); atlas (0, 1.12, 0.80); jaw hinge
//     (0, 1.02, 0.86); tongue root (0, 0.98, 1.00); tail root (0, 0.95, -1.15).
//   SPEC KEYS (none needed; any state key below may also be a spec key = its start value). scale / rot / x / y / z / tip / tilt as every prop.
//   STATE (tween with c.prop; read ps.<key> ?? spec.<key> ?? default). Seed with a dur-0 set at time 0 what you tween. The names jaw, breath,
//     glow and wag are propState keys (default 0 there: glow's 0.4 needs HEART_MONSTER_STATE in KIT_STATE, see NOTES, or spec glow: 0.4).
//     BODY POSE, one at a time (blend by the weights; each pose is exact at 1):
//       low 0     the lean into a low pan: elbows fold, chest drops to 0.5, neck stretches, rump stays 1.10 high; M (0, 0.24, 1.95): the chin
//                 rests in a dish at tilt -1 (a dish 0.2 m below the chin level; with jaw 1 + jawTop 1 the chin stays and the skull lifts)
//       rear 0    up on the hind legs: front paws leave the floor by rear 0.2, body 38 deg up, head 25 deg down over a level pan, paws hang at
//                 y 1.15; M (0, 1.62, 1.40); the crown is then ~2.2 (the DESIGN's 2.05 and M 1.62 cannot both hold at 25 deg: M wins)
//       sit 0     dog-waiting: haunches on the floor, hind feet forward under the belly, forelegs straight; M (0, 1.38, 1.05), crown ~1.7
//       slump 0   flat and sulking: legs splay, body squashed to 62 % about the floor, belly 12 % wider, chin on the floor between the front
//                 paws, lids to 0.6, brow ends drop 12 deg, mane sags 4 cm; M (0, 0.10, 1.85)
//     ON TOP OF ANY POSE:
//       jaw 0..1  gape 55 deg. jawTop 0.27: the share the skull takes by lifting (0.27 = lower jaw -40 deg, skull +15; 1 = the lower jaw
//                 stays, the skull lifts 55). At 0.27 open from M with 0.6 m free under it
//       chomp 0..1 ONE bite at the current jawTop: 0-0.35 opens to jaw 1 and pulls back 6 cm; 0.35-0.5 SHUT (jaw 1 -> 0), head drives down
//                 5 cm; 0.5-1 holds, relaxes. Director: 0 -> 1 in 9 frames (jawTop 1 in `low`)
//       chew (count) one cycle a whole number: jaw 0 <-> 0.3, lower jaw slides 2.5 cm sideways, cheeks bulge, head rolls 3 deg
//       lick 0..1 0-0.2 tongue tip out at her left mouth corner, 0.2-0.8 along the upper lip to the right corner, 0.8-1 back in (jaw shut)
//       headYaw -1..1 (55 deg, + = her left), headPitch -1..1 (25 deg, + = nose down) about the atlas; the neck rows take 30-65 %
//       gait (count) a heavy lateral walk, 0.60 m of travel a cycle (move the prop 0.60 m a cycle along its heading: planted feet never slide)
//       breath 0..1 6 cel puffs #e9e2c8 0.25-0.4 m across from 0.35 m to 0.9 m in front of the mouth (only with jaw > 0.3); flanks heave 2 cm
//                 at 0.5 Hz always, 1 Hz at 1
//       drool 0.5 5 glossy strings from the 5 lower fangs, 0.06-0.26 m x drool, 6 mm, a drop with a highlight at each end, swinging; 0.8 opaque
//       stain 0   JUICE (shared palette): 7 tooth tips, 4 drips 4-9 cm from the lower lip, 1 on the chin (they hang in the world frame)
//       lids 0.25 upper lid 0 wide .. 1 shut (blink adds to it);  glow 0.4 eyes emissive, a 6 cm halo #ffc23a at 1
//       wag 0     the tail thumps 20 deg each way at 1.4 Hz
//     The bite: as the skull comes down, the generator rides the heart from S up 0.06 onto the lower front teeth (monsterMouth gives M).
//   monsterMouth(params, { x, y, z, rot, scale }) -> world [x, y, z] of M (the upper front teeth, jaw shut) for the prop's state keys at that time.
//     params: low rear sit slump headYaw headPitch (the rest do not move M). Importable in Node (no DOM). The returned prop has `mouth`:
//     an empty Group "mouthHold" at M in the head frame (it follows the skull).
//   HOLD POINTS: none. The monster holds nothing and nothing is gripped by a hand (HEART_MONSTER_GRIPS is empty).
//   COUNTS (the bench sheet): TEETH 36 = 9 fangs / 15 mid / 12 stubs (upper 20: 10 a side; lower 16: 8 a side; 3 gaps: upper left 4th, lower
//     right 2nd, lower left 7th; 2 chipped flat; 1 snaggle fang 25 deg out at the upper right front; 6 hairline cracks; 8 uppers and 5 lowers
//     overlap the lips); LOCKS 46 = 14 crown + 20 ruff + 12 shoulder, in clumps of 2-3, 3-5 strand lines each, 5 dusty tips, 3 knots, 6 turquoise
//     ring beads on 3 ruff locks; BRAIDS 4 at x -0.38 -0.30 +0.30 +0.38 (0.60 / 0.45 / 0.45 / 0.60 long; plaits of 9 / 10 / 11 / 12 crossings),
//     16 GOLD beads (3 + a LAPIS-dotted teardrop each); SCARS 5 (X on the left snout, slash through the right brow and lid, 0.30 left cheek,
//     two 0.40 on the left flank; raised 8 mm, pale #c7a58f, 3-5 cross ticks each); CLAWS 8 front (a paw: 2 split, 1 broken short, a different
//     three on each) + 8 hind nails; 5 rib-roll creases a flank, 7 spine knobs, 9 blotches, 60 crack lines, 12 wrinkle lines at each hind joint,
//     40 bristles + a tail tuft with one torn notch; 12 + 20 scutes, 20 warts, ~120 pebble scales, 18 lip scales + 30 pits a side.
//   LIMITS: a pure function has no history, so the mane and braids cannot lag the head by 0.12 s: they take 60 % of the turn (the rest hangs)
//     and swing on t. Everything on the skin is solid for the checks except hair, drool, stain, breath and the halo.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { makeLoft, radialTexture } from "./geo.js";

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0), Z_AXIS = new THREE.Vector3(0, 0, 1);
const sstep = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AXIS, a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AXIS, a);
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c, a = 1) => `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")},${a})`;
const hexOf = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
const mixHex = (a, b, t) => hexOf(mixRGB(rgbOf(a), rgbOf(b), t));
const GLOW = new THREE.Color("#b8ff9a");

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map();   // every drawn texture and shared geometry is made once per page (pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function palette() {   // the same palette contract as the other animals (looks.js copies a standard material's colours once)
  const list = [];
  const reg = (m) => { m.userData.c0 = m.color.clone(); list.push(m); return m; };
  return {
    m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: GLOW, emissiveIntensity: 0, ...o })),
    b: (color, o = {}) => reg(new THREE.MeshBasicMaterial({ color, ...o })),
  };
}
const steam = (o) => { o.userData.steam = true; o.castShadow = o.receiveShadow = false; o.userData.noOutline = true; if (o.material) o.material.userData.noOutline = true; return o; };

// 3D two-bone IK with a pole hint (props-bear.js): the middle joint between h and f; the foot is never farther than 0.9995 of the leg
function ik3(h, f, L1, L2, pole) {
  const d = [f[0] - h[0], f[1] - h[1], f[2] - h[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = [d[0] / dl, d[1] / dl, d[2] / dl];
  const dd = clamp(dl, Math.abs(L1 - L2) + 0.01, (L1 + L2) * 0.9995), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2];
  let p = [pole[0] - pd * u[0], pole[1] - pd * u[1], pole[2] - pd * u[2]]; const pl = Math.hypot(p[0], p[1], p[2]);
  p = pl < 1e-6 ? [0, 0, 1] : [p[0] / pl, p[1] / pl, p[2] / pl];
  return [h[0] + u[0] * a + p[0] * hh, h[1] + u[1] * a + p[1] * hh, h[2] + u[2] * a + p[2] * hh];
}
function footPath(f, S, duty, H) {   // [forward offset, lift] of a foot on its walk cycle f 0..1: planted `duty` of it, sweeping back S
  if (f < duty) return [S * (0.5 - f / duty), 0];
  const u = (f - duty) / (1 - duty);
  return [S * (-0.5 + sstep(u)), H * Math.sin(Math.PI * u)];
}
function basisQ(zAxis, yAxis) {   // a rotation taking local z to zAxis and local y to the nearest direction to yAxis
  const z = new THREE.Vector3(...zAxis).normalize(), y = new THREE.Vector3(...yAxis);
  y.addScaledVector(z, -y.dot(z)); if (y.lengthSq() < 1e-9) y.set(0, 1, 0).addScaledVector(z, -z.y);
  y.normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
// a curved tapered tube along a Catmull-Rom curve through pts; radial sides, seg rings; r0 -> r1 (claws, locks, braids, scars, strings)
function taperTube(pts, r0, r1, radial = 8, seg = 10, pw = 0.85, flat = 1) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pos = [], uv = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg; curve.getPointAt(u, P); curve.getTangentAt(u, T);
    N.crossVectors(T, Math.abs(T.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)).normalize(); B.crossVectors(T, N).normalize();
    const r = r0 + (r1 - r0) * Math.pow(u, pw), wn = Math.abs(N.x) >= Math.abs(B.x), rn = wn ? r : r * flat, rb = wn ? r * flat : r;
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU, c = Math.cos(a) * rn, s = Math.sin(a) * rb; pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); uv.push(j / radial, 1 - u); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const n0 = pos.length / 3; curve.getPointAt(0, P); pos.push(P.x, P.y, P.z); uv.push(0.5, 1); curve.getPointAt(1, P); pos.push(P.x, P.y, P.z); uv.push(0.5, 0);   // closed ends
  for (let j = 0; j < radial; j++) { idx.push(n0, j + 1, j); const a = seg * (radial + 1) + j; idx.push(n0 + 1, a, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- colours (DESIGN C and the shared palette)
const C = {
  hide: "#6c7048", hideSh: "#454a30", lip: "#a8a274", olive: "#77785f", belly: "#a09c80", crease: "#4f5140", blotch: "#8f7f78",
  fur: "#8a6f4a", furSh: "#5e4a30", mane: "#7a4a26", maneSh: "#4f2e17", maneTip: "#a8703a",
  scar: "#c7a58f", claw: "#d9cfae", clawCr: "#4a3d2c", tooth: "#ecd98a", root: "#b98f3c", tip: "#f8efc0",
  mouth: "#7a2f3c", throat: "#3a1820", tongue: "#d9778a", amber: "#f0b21c", amberC: "#ffd75a", fleck: "#c9861a", pupil: "#1a120a",
  gold: "#e2b04a", goldSh: "#9a6a1e", goldDeep: "#6b4612", goldLt: "#fff0b8", bole: "#8a4a2a",
  lapis: "#2b4fa2", lapisSh: "#1c3470", lapisLt: "#5f86d6", turq: "#3fa39a", turqSh: "#2a7069", turqLt: "#7fd0c4",
  juice: "#f0502a", juiceSh: "#c9341a", juiceLt: "#ff9a6b", gloss: "#fff3e6", drool: "#eef2e6", puff: "#e9e2c8", halo: "#ffc23a", ink: "#2a1c14",
};

// ---------------------------------------------------------------- the numbers: ONE skin, tail -> snout (DESIGN C), stand pose, metres
// rows: [z, top y, bottom y, half width, superellipse n, lower half height (default half the thickness), share of the head's turn]
const SK = (z, top, bot, hw, n = 2.4, dn, sh = 0) => ({ z, top, bot, hw, n, dn: dn ?? (top - bot) / 2, sh });
const CREASES = [-0.85, -0.60, -0.35, -0.12, 0.08];   // the 5 fat rib-roll creases (DESIGN), 3 cm deep: the row is 3 cm narrower there
const LIP = (z) => 0.944 + 0.062 * sstep((1.28 - z) / 0.40);   // the lip line: level at 0.944 along the snout, curving UP at the back into a grin (1.006 at the hinge)
const rumpRow = (z) => { const s = Math.sqrt(Math.max(0.01, 1 - ((-0.75 - z) / 0.40) ** 2)); return SK(z, 0.93 + 0.23 * s, 0.93 - 0.47 * s, Math.max(0.05, 0.575 * s), 2.2); };   // a round heavy rump: an ellipse in plan
const HEADROWS = [[0.88, 1.34, 0.285, 2.8], [0.95, 1.40, 0.29, 3.0], [1.02, 1.39, 0.285, 3.0], [1.10, 1.34, 0.27, 3.0], [1.20, 1.27, 0.245, 3.0], [1.30, 1.22, 0.22, 3.0], [1.42, 1.19, 0.20, 3.0], [1.54, 1.165, 0.19, 3.0], [1.63, 1.16, 0.18, 3.0], [1.69, 1.165, 0.185, 3.0], [1.73, 1.145, 0.15, 2.8], [1.755, 1.10, 0.07, 2.4]];
const SEC = [
  // tail 0.28 x 0.09 (4 rows), then the hippo back half: a round barrel, rump -1.15, belly 1.20 wide at -0.5 hanging to y 0.30 (lower than the chest)
  SK(-1.43, 0.925, 0.835, 0.040, 2.2), SK(-1.36, 0.952, 0.858, 0.046, 2.2), SK(-1.28, 0.985, 0.872, 0.056, 2.2), SK(-1.20, 1.0, 0.84, 0.08, 2.2),
  rumpRow(-1.15), rumpRow(-1.11), rumpRow(-1.05), rumpRow(-0.98), rumpRow(-0.91), SK(-0.85, 1.16, 0.40, 0.52, 2.3),
  SK(-0.725, 1.16, 0.34, 0.59, 2.25), SK(-0.60, 1.15, 0.31, 0.57, 2.25), SK(-0.475, 1.15, 0.28, 0.60, 2.2), SK(-0.35, 1.16, 0.29, 0.57, 2.25),
  SK(-0.235, 1.17, 0.33, 0.595, 2.3), SK(-0.12, 1.17, 0.40, 0.55, 2.3), SK(-0.02, 1.18, 0.46, 0.55, 2.4), SK(0.08, 1.20, 0.52, 0.48, 2.4),
  // lion front: chest 0.80 wide at z 0.40, shoulders y 1.22
  SK(0.22, 1.21, 0.62, 0.42, 2.4), SK(0.40, 1.28, 0.66, 0.44, 2.4),
  // neck inside the ruff (the mane base: a full matted mass over neck and shoulders), mane top ~1.5; the share is how much of the head's turn the row takes
  SK(0.55, 1.48, 0.70, 0.44, 2.1, undefined, 0), SK(0.66, 1.50, 0.70, 0.43, 2.1, undefined, 0.3), SK(0.76, 1.44, 0.78, 0.38, 2.1, undefined, 0.65), SK(0.84, 1.37, 0.88, 0.31, 2.2, undefined, 1),
  // croc skull, heavier: deep brow over the eyes, a short deep snout, flat underside (the roof of the mouth) on the lip line, tip 0.30 wide
  ...HEADROWS.map(([z, top, hw, n]) => SK(z, top, LIP(z) - 0.012, hw, n, 0.012, 1)),
];
const NS = SEC.length, I_BODY = 4, I_NECK = 20, I_HEAD = 24;
// lower jaw rows (stand coordinates, hinged at J): flat inside floor on top (y 0.935), deep chin below; [z, top, bottom, half width, n]
const JROWS = [[0.86, 0.82, 0.22, 2.6], [0.92, 0.79, 0.26, 3.0], [1.0, 0.785, 0.27, 3.0], [1.10, 0.795, 0.255, 3.0], [1.25, 0.82, 0.215, 3.0], [1.40, 0.83, 0.195, 3.0], [1.55, 0.84, 0.183, 3.0], [1.66, 0.845, 0.178, 3.0], [1.72, 0.85, 0.15, 2.8], [1.745, 0.88, 0.07, 2.4]].map(([z, bot, hw, n]) => [z, LIP(z) - 0.012, bot, hw, n]);
const PV0 = [0, 0.80, -0.75], A0 = [0, 1.12, 0.80], J0 = [0, 1.02, 0.86], NB0 = [0, 1.05, 0.55], M0 = [0, 0.95, 1.72], TR0 = [0, 0.95, -1.15], S0 = [0, 1.2, 0.40];
// legs: front (lion) shoulders (+-0.30, 0.95, 0.40), 0.20 thick; hind (hippo) stumps 0.36 across, hip (+-0.40, 0.80, -0.75)
const FRONT = { hx: 0.30, hy: 0.95, hz: 0.40, L1: 0.46, L2: 0.42 }, HIND = { hx: 0.37, hy: 0.80, hz: -0.75, L1: 0.40, L2: 0.36 };
const FROWS = [[0.13, 0.15, 0.15], [0.12, 0.14, 0.14], [0.105, 0.12, 0.12], [0.10, 0.11, 0.11], [0.095, 0.10, 0.10], [0.09, 0.095, 0.095], [0.09, 0.095, 0.09]];
const HROWS = [[0.15, 0.17, 0.17], [0.17, 0.19, 0.19], [0.18, 0.20, 0.20], [0.17, 0.18, 0.18], [0.165, 0.17, 0.17], [0.16, 0.15, 0.15], [0.16, 0.14, 0.14]];
// pose key table: th trunk pitch about the hips (deg, + nose down), pv hips [y, z], M mouth point [y, z] (jaw shut), hp head pitch (deg, + nose down),
// ff / hf front wrist / hind heel targets [y, z], fx / hx foot x, hang front paws hang, ldy leg roots drop, fl flatten the body, yaw paw toe-out (deg)
const POSE = {
  stand: { th: 0, pv: [0.80, -0.75], M: [0.95, 1.72], hp: 0, ff: [0.10, 0.50], hf: [0.10, -0.80], fx: 0.30, hx: 0.40, hang: 0, ldy: 0, fl: 0, yaw: 0 },
  low: { th: 20, pv: [0.74, -0.78], M: [0.24, 1.95], hp: 20, ff: [0.10, 1.05], hf: [0.10, -0.80] },
  rear: { th: -14, pv: [0.50, -0.85], M: [1.38, 1.70], hp: 8, ff: [0.10, 0.45], hf: [0.10, -0.80], fx: 0.52, hang: 0, hx: 0.46 },   // the LUNGE over the pan (opening 01): paws planted wide, haunches low, chest up, head thrust forward and up
  sit: { th: -20, pv: [0.41, -1.00], M: [1.38, 1.05], hp: -5, ff: [0.10, 0.12], hf: [0.10, -0.35] },
  slump: { th: 0, pv: [0.80, -0.75], M: [0.10, 1.85], hp: 6, ff: [0.10, 1.12], hf: [0.10, -0.30], fx: 0.55, hx: 0.66, ldy: -0.48, fl: 1, yaw: 16 },
};

// ---------------------------------------------------------------- the skin in (z, angle) terms: where a mark or a scar sits at rest
// angle 0 = +x (her LEFT), 90 = the top, 180 = her right, -90 = the belly line (v = (angle + 90) / 360)
const ZU = SEC.map((r) => r.z);
function uOfZ(z) { let i = 0; while (i < NS - 2 && z > ZU[i + 1]) i++; return (i + clamp((z - ZU[i]) / (ZU[i + 1] - ZU[i]))) / (NS - 1); }
function zOfU(u) { const f = clamp(u) * (NS - 1), i = Math.min(NS - 2, Math.floor(f)); return ZU[i] + (ZU[i + 1] - ZU[i]) * (f - i); }
const vOfAng = (a) => ((((a + 90) / 360) % 1) + 1) % 1;
function rowAt(z, rows = SEC) {
  let i = 0; while (i < rows.length - 2 && z > rows[i + 1].z) i++;
  const a = rows[i], b = rows[i + 1], f = clamp((z - a.z) / (b.z - a.z)), L = (k) => a[k] + (b[k] - a[k]) * f;
  const dn = L("dn"), cy = L("bot") + dn;
  return { cy, w: L("hw"), up: L("top") - cy, dn, n: L("n") };
}
const JSEC = JROWS.map(([z, top, bot, hw, n]) => ({ z, top, bot, hw, n, dn: top - 0.012 - bot }));
JSEC.forEach((r) => { r.top = r.top; });
function surf(z, ang, rows = SEC, lift = 0) {   // the skin point at rest (stand frame), `lift` metres out along the normal-ish
  const r = rowAt(z, rows), e = 2 / r.n, c = Math.cos(rad(ang)), s = Math.sin(rad(ang));
  const x = Math.sign(c) * Math.abs(c) ** e * (r.w + lift), y = r.cy + Math.sign(s) * Math.abs(s) ** e * ((s > 0 ? r.up : r.dn) + lift * (s > 0 ? 1 : 0.2));
  return [x, y, z];
}
function mpd(z, a, rows = SEC) { const p = surf(z, a - 1, rows), q = surf(z, a + 1, rows); return Math.hypot(q[0] - p[0], q[1] - p[1]) / 2; }   // metres per degree round the section
// angle of a point at x on the top (s > 0) or bottom surface of the row at z
function angOfX(z, x, top = true, rows = SEC) { const r = rowAt(z, rows), c = Math.sign(x) * Math.min(1, Math.abs(x) / r.w) ** (r.n / 2), s = Math.sqrt(Math.max(0, 1 - c * c)); return deg(Math.atan2(top ? s : -s, c)); }
const topY = (x, z) => surf(z, angOfX(z, x))[1];
const EYE_Y = topY(0.17, 0.98) - 0.004;   // the eyes sit on the skull's shoulder
// the upper jaw's lip outline in plan, left half (x >= 0): from the snout's front centre round the boss and back to the hinge; arc length s from the front
function outline(rows, zFront, zBack, step = 0.004) {
  const pts = [[0, zFront]];
  for (let z = zFront - 0.004; z >= zBack; z -= step) pts.push([rowAt(z, rows).w, z]);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return (s) => { let i = 1; while (i < pts.length - 1 && cum[i] < s) i++; const f = clamp((s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)), a = pts[i - 1], b = pts[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
}
const UPLINE = outline(SEC.slice(I_HEAD), 1.762, 1.02), LOLINE = outline(JSEC, 1.752, 1.0);

// ---------------------------------------------------------------- the 36 teeth, each by hand (DESIGN): 9 fangs 7-10 cm (F), 15 mid 4-6 (M), 12 stubs 1.5-3 (S)
// side +1 = her left (+x). Slots count from the front along the lip; a missing slot is a GAP: upper left 4th, lower right 2nd, lower left 7th.
// [slot, class, length cm, lean (degrees, + outward), fore/aft (degrees, + forward), flags]  flags: s snaggle, c chipped flat, k hairline crack, t juice tip
const TEETH = {
  UL: { up: true, side: 1, slots: 11, row: [[1, "M", 5.2, 4, 3, ""], [2, "F", 11.0, 9, -4, "kt"], [3, "S", 2.5, -8, 5, ""], [5, "F", 8.0, 12, 2, ""], [6, "M", 4.5, -6, -7, ""], [7, "S", 2.0, 5, 8, ""], [8, "M", 5.5, -13, 0, "k"], [9, "S", 1.8, 10, -5, ""], [10, "M", 4.0, -3, 9, ""], [11, "S", 2.8, 14, -8, ""]] },
  UR: { up: true, side: -1, slots: 10, row: [[1, "F", 12.0, 25, 4, "st"], [2, "M", 5.5, -9, -3, ""], [3, "S", 2.2, 6, 6, ""], [4, "M", 6.0, 3, -9, "k"], [5, "F", 8.5, -12, 5, "c"], [6, "S", 1.6, 8, -4, ""], [7, "M", 4.8, -5, 10, ""], [8, "S", 2.9, 13, 2, ""], [9, "M", 4.2, -10, -6, ""], [10, "S", 2.0, 4, 7, ""]] },
  LR: { up: false, side: -1, slots: 9, row: [[1, "F", 10.5, 16, 3, "t"], [3, "M", 4.4, -7, 5, ""], [4, "M", 5.8, 5, -6, ""], [5, "S", 2.6, 11, 4, ""], [6, "F", 8.0, 15, -5, "kt"], [7, "M", 4.0, -4, 8, ""], [8, "S", 1.5, 9, -3, ""], [9, "M", 4.6, -11, 6, ""]] },
  LL: { up: false, side: 1, slots: 9, row: [[1, "F", 10.5, 16, -3, "t"], [2, "M", 5.2, -8, 4, "k"], [3, "M", 4.1, 6, 7, ""], [4, "F", 9.5, 14, 2, "ct"], [5, "S", 2.4, -5, -8, ""], [6, "M", 5.0, 10, 5, "k"], [8, "F", 8.0, 16, -6, "t"], [9, "S", 2.9, -12, 3, ""]] },
};
const TOOTH_LIST = [];
for (const [rk, R] of Object.entries(TEETH)) for (const [slot, cls, len, lean, fore, fl] of R.row) {
  const id = TOOTH_LIST.length, line = R.up ? UPLINE : LOLINE, s = (R.up ? 0.036 : 0.070) + (slot - 1) * (R.up ? 0.083 : 0.083) + (rnd(id * 7 + 3) - 0.5) * 0.016;
  const [px, pz] = line(s), inset = R.up ? 0.005 : 0.006;
  TOOTH_LIST.push({ id, rk, up: R.up, side: R.side, slot, cls, len: len / 100, lean, fore, fl, x: R.side * Math.max(0, px - inset), z: pz, ovl: R.up && (cls === "F" || (cls === "M" && len >= 5)) || (!R.up && cls === "F") });
}

// ---------------------------------------------------------------- the pose solver (pure: shared by apply() and monsterMouth)
// Walk: a heavy lateral sequence, left hind, left front, right hind, right front, a quarter cycle apart; 0.60 m of travel a cycle, each foot planted 70 %.
const LEGS = [{ k: "fl", s: 1, f: true, w: 0.25 }, { k: "fr", s: -1, f: true, w: 0.75 }, { k: "bl", s: 1, f: false, w: 0.0 }, { k: "br", s: -1, f: false, w: 0.5 }];
const STRIDE = 0.60, DUTY = 0.70, LIFT = 0.10, JAW_GAPE = 55, V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function chompOf(c) {   // ONE bite, c 0..1: 0-0.35 opens to jaw 1 and pulls back 6 cm; 0.35-0.5 SHUT, the head drives down 5 cm; 0.5-1 holds, relaxes
  c = clamp(c); if (c <= 0) return { jaw: 0, back: 0, down: 0 };
  if (c < 0.35) { const u = sstep(c / 0.35); return { jaw: u, back: 0.06 * u, down: 0 }; }
  if (c < 0.5) { const u = (c - 0.35) / 0.15; return { jaw: 1 - u, back: 0.06 * (1 - u), down: 0.05 * sstep(u) }; }
  const u = (c - 0.5) / 0.5; return { jaw: 0, back: 0, down: 0.05 * (1 - sstep((u - 0.12) / 0.88)) };
}
function solve(ps, t = 0) {
  const g = (k, d = 0) => ps[k] ?? d;
  const W = [clamp(g("low")), clamp(g("rear")), clamp(g("sit")), clamp(g("slump"))], PO = [POSE.low, POSE.rear, POSE.sit, POSE.slump];
  const mixv = (k) => { const b = POSE.stand[k]; return Array.isArray(b) ? b.map((v, i) => v + PO.reduce((a, p, j) => a + W[j] * ((p[k] ?? b)[i] - v), 0)) : b + PO.reduce((a, p, j) => a + W[j] * ((p[k] ?? b) - b), 0); };
  const thD = mixv("th"), pv = mixv("pv"), Mp = mixv("M"), hpD = mixv("hp"), ff = mixv("ff"), hf = mixv("hf"), fx = mixv("fx"), hx = mixv("hx"), hang = clamp(mixv("hang")), ldy = mixv("ldy"), fl = clamp(mixv("fl")), yawP = mixv("yaw");
  const pose = Math.max(...W), gw = sstep(g("gait") / 0.15) * (1 - pose), gt = g("gait");
  // ---- the trunk about the hips, then the dip that lets every planted leg reach its foot
  const q = qX(rad(thD)), PV = V3(PV0), o0 = V3([0, pv[0], pv[1]]);
  const place0 = (p) => V3(p).sub(PV).applyQuaternion(q).add(o0);
  const rootOf = (l) => l.f ? [l.s * FRONT.hx * (1 + 0.12 * fl), FRONT.hy, FRONT.hz] : [l.s * HIND.hx * (1 + 0.12 * fl), HIND.hy, HIND.hz];
  const L = LEGS.map((l) => {
    const f = ((((gt + l.w) % 1) + 1) % 1), [dz, lf] = footPath(f, STRIDE * DUTY, DUTY, LIFT), dzz = dz * gw, lift = lf * gw;
    const tgt = l.f ? [l.s * fx * (1 + 0.0 * fl), ff[0] + lift, ff[1] + dzz] : [l.s * hx, hf[0] + lift, hf[1] + dzz];
    return { ...l, lift, tgt, root: rootOf(l) };
  });
  let dip = 0;
  for (const l of L) {
    const Hp = place0(l.root).add(V3([0, ldy, 0])), Lr = (l.f ? FRONT.L1 + FRONT.L2 : HIND.L1 + HIND.L2) * 0.997, hz = l.tgt[2] - Hp.z, hxz = l.tgt[0] - Hp.x;
    dip = Math.min(dip, (l.tgt[1] + Math.sqrt(Math.max(0, Lr * Lr - hz * hz - hxz * hxz)) - Hp.y) * gw * (l.f ? 0.6 : 1));
  }
  const o = o0.clone(); o.y += dip;
  const place = (p) => V3(p).sub(PV).applyQuaternion(q).add(o);
  // ---- the head: pitch + yaw about the atlas, the skull lifts about the hinge by its share of the gape (jawTop), the chomp and the chew move it
  const cm = chompOf(g("chomp")), chewC = g("chew"), chewJ = chewC > 0 ? 0.3 * (0.5 - 0.5 * Math.cos(TAU * chewC)) : 0, chewS = chewC > 0 ? Math.sin(TAU * chewC) : 0;
  const jw = clamp(Math.max(g("jaw"), cm.jaw) + chewJ), jawTop = g("jawTop", 0.27), gape = JAW_GAPE * jw, lift = gape * jawTop;
  const yaw = 55 * clamp(g("headYaw"), -1, 1), hpTot = hpD + 25 * clamp(g("headPitch"), -1, 1);
  const Q = qY(rad(yaw)).multiply(qX(rad(hpTot))).multiply(qZ(rad(3 * chewS)));
  const Qp = qX(rad(hpD));
  const dM = V3([0, M0[1] - A0[1], M0[2] - A0[2]]).applyQuaternion(Qp), Aw = V3([0, Mp[0], Mp[1]]).sub(dM);
  Aw.add(V3([0, 0, -1]).applyQuaternion(Q).multiplyScalar(cm.back)).add(V3([0, -cm.down, 0]));
  Aw.y += dip * 0.5;
  const Rl = qX(-rad(lift)), Qh = Q.clone().multiply(Rl);
  const Jv = V3(J0), Av = V3(A0), tH = Aw.clone().add(Jv.clone().sub(Jv.clone().applyQuaternion(Rl)).sub(Av).applyQuaternion(Q));
  const headPlace = (p) => V3(p).applyQuaternion(Qh).add(tH);
  // ---- the legs
  const legs = L.map((l) => {
    const s = l.s, Hp = place(l.root).add(V3([0, ldy, 0])), Sh = [Hp.x, Hp.y, Hp.z], W_ = l.tgt;
    const upv = V3([0, 0.10, 0]).applyQuaternion(q), pad = [Sh[0] + upv.x, Sh[1] + upv.y, Sh[2] + upv.z];
    let E, fq, wr = W_;
    if (l.f) {
      E = ik3(Sh, wr, FRONT.L1, FRONT.L2, [s * 0.25, 0.4 + 0.5 * W[0], -1]);
      const dEW = nrm3([wr[0] - E[0], wr[1] - E[1], wr[2] - E[2]]), pitch = -rad(40) * clamp(l.lift / LIFT), pz = nrm3(mix3([0, Math.sin(pitch), Math.cos(pitch)], [dEW[0], dEW[1] * 0.7 - 0.3, dEW[2]], hang * 0.8));
      fq = qY(-s * rad(yawP)).multiply(basisQ(pz, [0, 1, 0]));
    } else {
      E = ik3(Sh, wr, HIND.L1, HIND.L2, [s * (0.2 + 0.8 * Math.max(W[2], W[3])), 0.3, 1]);
      const pitch = -rad(30) * clamp(l.lift / LIFT);
      fq = qY(-s * rad(yawP)).multiply(qX(pitch));
    }
    const dE = nrm3([wr[0] - E[0], wr[1] - E[1], wr[2] - E[2]]);
    return { s, f: l.f, fo: wr, fq, pts: [pad, Sh, mix3(Sh, E, 0.5), E, mix3(E, wr, 0.5), wr, [wr[0] + dE[0] * 0.03, wr[1] + dE[1] * 0.03, wr[2] + dE[2] * 0.03]] };
  });
  return { q, o, place, place0, Q, Qh, Aw, tH, headPlace, legs, jw, gape, lift, drop: gape - lift, chewS, chewC, fl, W, gw, gt, dip, yaw, hpTot, thD, jawTop, cm, hang, pose };
}
// the point between the front teeth (the upper ones, jaw shut) in the world, for a heartmonster prop at {x, y, z, rot, scale}; params = its state keys (low, rear, sit, slump, headYaw, headPitch, ... any missing is 0)
export function monsterMouth(params = {}, at = {}) {
  const Z = solve(params), v = Z.headPlace(M0), sc = at.scale ?? 1, r = rad(at.rot ?? 0), c = Math.cos(r), s = Math.sin(r), x = v.x * sc, y = v.y * sc, z = v.z * sc;
  return [(at.x ?? 0) + x * c + z * s, (at.y ?? 0) + y, (at.z ?? 0) - x * s + z * c];
}

// ---------------------------------------------------------------- painted skins (every mark drawn once from its index: rnd(i), no tiling, no clock)
const SKW = 4096, SKH = 1024;
const regionPal = (z) => {   // base, shade, underside by the part of the animal
  const hip = [C.olive, "#575941", C.belly], lion = [C.fur, C.furSh, "#6e5738"], mane = [C.mane, C.maneSh, "#5f3a1d"], hide = [C.hide, C.hideSh, C.lip], tail = ["#5a5c44", C.crease, "#6c6e54"];
  const mixP = (a, b, f) => a.map((c, i) => mixHex(c, b[i], f));
  if (z < -1.2) return tail.map((c) => c);
  if (z < -1.12) return mixP(tail, hip, (z + 1.2) / 0.08);
  if (z < 0.0) return hip;
  if (z < 0.10) return mixP(hip, lion, z / 0.10);
  if (z < 0.40) return lion;
  if (z < 0.52) return mixP(lion, mane, (z - 0.40) / 0.12);
  if (z < 0.84) return mane;
  if (z < 0.88) return mixP(mane, hide, (z - 0.84) / 0.04);
  return hide;
};
const skinTex = () => once("hmSkin", () => cvs(SKW, SKH, (g, W, H) => {
  const U = (z) => uOfZ(z) * W, V = (a) => vOfAng(a) * H;
  const at = (z, a) => { const m = mpd(z, a); return (dz, ds) => [U(z + dz), V(a + ds / m)]; };   // a local frame in metres on the skin
  const poly = (pts, st, lw, close = false) => {   // a polyline that lifts the pen where v wraps
    g.strokeStyle = st; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    pts.forEach((p, i) => { if (i === 0 || Math.abs(p[1] - pts[i - 1][1]) > H * 0.5) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); if (close) g.closePath(); g.stroke();
  };
  const sideA = (a, s) => (s > 0 ? a : 180 - a);   // an angle on her left (s 1) mirrored onto her right
  // ---- 1. the colour of each part, shaded round the section (the light comes from above-left: the underside and her right are the shade side)
  for (let x = 0; x < W; x += 2) {
    const z = zOfU((x + 1) / W), [b, sh, un] = regionPal(z), gr = g.createLinearGradient(0, 0, 0, H);
    const stops = [[0, un], [0.10, un], [0.20, mixHex(un, b, 0.55)], [0.30, mixHex(b, sh, 0.12)], [0.42, b], [0.52, mixHex(b, "#ffffff", 0.06)], [0.62, b], [0.76, mixHex(b, sh, 0.5)], [0.88, mixHex(un, sh, 0.35)], [0.94, un], [1, un]];
    for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(x, 0, 2.2, H);
  }
  // pore speckle over everything but the mane
  for (let i = 0; i < 5200; i++) { const z = -1.43 + rnd(i * 3 + 1) * 3.18, a = rnd(i * 3 + 2) * 360 - 90; if (z > 0.4 && z < 0.86) continue; g.fillStyle = i % 3 ? "rgba(30,32,20,0.16)" : "rgba(235,235,200,0.10)"; g.beginPath(); g.arc(U(z), V(a), 1 + rnd(i + 9) * 1.8, 0, TAU); g.fill(); }
  // ---- 2. the hippo back half
  const HZ0 = -1.40, HZ1 = 0.06;
  for (const zc of CREASES) for (const s of [1, -1]) {   // 5 fat rib-roll creases a flank, 0.9 long, 3 cm deep: a dark line with the roll's light edge in front of it
    const pts = [], hl = [], sh = [];
    for (let k = 0; k <= 16; k++) { const a = 75 - (113 * k) / 16, w = Math.sin(k * 1.7 + zc * 9) * 0.014 + 0.07 * (a - 20) / 100 * s, f = at(zc + w, sideA(a, s)); pts.push(f(0, 0)); hl.push(at(zc + 0.045 + w, sideA(a, s))(0, 0)); sh.push(at(zc - 0.03 + w, sideA(a, s))(0, 0)); }
    poly(sh, "rgba(40,42,28,0.20)", 40); poly(hl, "rgba(170,172,134,0.26)", 36); poly(pts, "rgba(79,81,64,0.42)", 13);
  }
  [-0.92, -0.70, -0.48, -0.26, -0.06].forEach((zc, i) => {   // 5 belly fold lines across the underside
    const pts = []; for (let k = 0; k <= 14; k++) { const a = -90 + (k - 7) * 6.5, w = Math.sin(k * 1.3 + i * 2.1) * 0.01; pts.push(at(zc + w, a)(0, 0)); }
    poly(pts, "rgba(79,81,64,0.8)", 7); poly(pts.map((p) => [p[0] + 5, p[1]]), "rgba(210,205,170,0.3)", 4);
  });
  [[-0.95, 55, 0.2, 0.2], [-0.62, 130, 0.15, 0.22], [-0.38, 20, 0.2, 0.18], [-0.20, 200, 0.16, 0.2], [-1.05, 160, 0.12, 0.16], [-0.78, 8, 0.14, 0.2], [-0.5, 95, 0.2, 0.24], [-0.1, 70, 0.14, 0.18], [-0.74, 215, 0.17, 0.2]].forEach(([z, a, rz, rs]) => {   // 9 pink-grey blotches
    const f = at(z, a), c = f(0, 0), e = f(rz, rs), rx = Math.abs(e[0] - c[0]), ry = Math.abs(e[1] - c[1]); g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, "rgba(143,127,120,0.7)"); gr.addColorStop(0.6, "rgba(143,127,120,0.4)"); gr.addColorStop(1, "rgba(143,127,120,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  });
  for (let i = 0; i < 60; i++) {   // 60 fine dry-mud crack lines
    const z = HZ0 + rnd(i * 5 + 101) * (HZ1 - HZ0), a = -75 + rnd(i * 5 + 102) * 330, f = at(z, a), th = rnd(i * 5 + 103) * TAU, len = 0.04 + 0.07 * rnd(i * 5 + 104), pts = [f(0, 0)]; let dz = 0, ds = 0, ang = th;
    for (let k = 0; k < 5; k++) { ang += (rnd(i * 17 + k) - 0.5) * 1.6; dz += (len / 5) * Math.cos(ang); ds += (len / 5) * Math.sin(ang); pts.push(f(dz, ds)); }
    poly(pts, "rgba(60,62,44,0.8)", 1.7); poly(pts.map((p) => [p[0] + 1.5, p[1] + 1]), "rgba(200,200,160,0.22)", 1);
  }
  // ---- 3. the lion front: short fur strokes over the hide, ragged where they start (z 0.0 .. 0.1)
  for (let i = 0; i < 3600; i++) {
    const z = -0.03 + rnd(i * 4 + 201) * 0.50, a = -90 + rnd(i * 4 + 202) * 360; if (rnd(i * 4 + 203) > sstep((z + 0.03) / 0.14) * 1.0 + 0.02) continue;
    const f = at(z, a), dn = a > 90 && a < 270 ? 1 : -1, L = 0.018 + 0.03 * rnd(i * 4 + 204); g.lineCap = "round"; g.lineWidth = 2 + rnd(i) * 1.2;
    g.strokeStyle = i % 3 === 0 ? css(rgbOf("#b0925f"), 0.55) : i % 3 === 1 ? css(rgbOf(C.furSh), 0.6) : css(rgbOf("#6e5738"), 0.5); const p0 = f(0, 0), p1 = f(-L * 0.8, dn * L * 0.5); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
  }
  // ---- 4. the matted ruff (the mane's base skin): long clumped strands lying back and down, dark between the clumps
  for (let i = 0; i < 90; i++) { const z = 0.42 + rnd(i * 3 + 301) * 0.42, a = -90 + rnd(i * 3 + 302) * 360, f = at(z, a), dn = a > 90 && a < 270 ? 1 : -1, pts = []; for (let k = 0; k <= 8; k++) pts.push(f(-k * 0.022, dn * k * 0.009 + Math.sin(k * 0.9 + i) * 0.012)); poly(pts, "rgba(79,46,23,0.32)", 9 + rnd(i) * 7); }
  for (let i = 0; i < 3200; i++) {
    const z = 0.40 + rnd(i * 4 + 401) * 0.47, a = -90 + rnd(i * 4 + 402) * 360, f = at(z, a), dn = a > 90 && a < 270 ? 1 : -1, L = 0.04 + 0.07 * rnd(i * 4 + 403);
    g.lineWidth = 1.6 + rnd(i) * 1.8; g.strokeStyle = i % 5 === 0 ? css(rgbOf(C.maneTip), 0.5) : i % 2 ? css(rgbOf(C.maneSh), 0.55) : css(rgbOf("#93602f"), 0.5);
    const p0 = f(0, 0), p1 = f(-L, dn * L * 0.4); g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + (rnd(i + 5) - 0.5) * 6, p1[0], p1[1]); g.stroke();
  }
  // ---- 5. the croc head: skull z 0.88..1.76
  const HZ = (z) => z > 0.86;
  // palate (the roof of the mouth) on the underside, with 7 ridges; lips round the edge
  { const x0 = U(0.86), x1 = U(1.78); g.fillStyle = C.mouth; g.fillRect(x0, 0, x1 - x0, H * 0.205); g.fillRect(x0, H * 0.795, x1 - x0, H * 0.205);
    g.fillStyle = C.lip; g.fillRect(x0, H * 0.205, x1 - x0, H * 0.04); g.fillRect(x0, H * 0.755, x1 - x0, H * 0.04);
    for (const [y0, dir] of [[0, 1], [H, -1]]) { const gr = g.createLinearGradient(0, y0, 0, y0 + dir * H * 0.2); gr.addColorStop(0, "rgba(58,24,32,0.55)"); gr.addColorStop(1, "rgba(58,24,32,0)"); g.fillStyle = gr; g.fillRect(x0, dir > 0 ? y0 : y0 - H * 0.2, x1 - x0, H * 0.2); }
    for (let k = 0; k < 7; k++) { const zr = 1.08 + k * 0.088; for (const s of [1, -1]) { const pts = []; for (let j = 0; j <= 8; j++) { const a = s > 0 ? -90 + 72 * (j / 8) : -90 - 72 * (j / 8); pts.push([U(zr - 0.035 * (1 - j / 8) ** 2 + 0.0), V(a)]); } poly(pts, "rgba(58,24,32,0.7)", 9); poly(pts.map((p) => [p[0] - 2, p[1]]), "rgba(190,100,115,0.65)", 4); } } }
  // the wavy upper lip (the lip colour boundary meanders; a notch behind the tip) and the lip scales and pits
  for (const s of [1, -1]) {
    const edge = [], band = []; for (let z = 0.9; z <= 1.76; z += 0.012) { const a = 6.5 + 2.2 * Math.sin(z * 52 + 0.3) + 1 * Math.sin(z * 131 + 1) - (z > 1.6 ? (z - 1.6) * 12 : 0); edge.push([U(z), V(sideA(a, s))]); band.push([U(z), V(sideA(-6, s))]); }
    g.beginPath(); edge.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); band.slice().reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.fillStyle = C.lip; g.fill(); poly(edge, "rgba(42,44,28,0.75)", 3);
    const nf = at(1.625, sideA(4, s)); g.fillStyle = "rgba(42,28,20,0.9)"; g.beginPath(); { const p = [nf(-0.012, 0), nf(0.014, 0), nf(0.0, s * -0.012)]; g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.closePath(); } g.fill();
    for (let k = 0; k < 18; k++) {   // 18 lip scales a side
      const z = 1.03 + k * 0.0395, f = at(z, sideA(3.4, s)), c = [f(-0.016, -0.007), f(0.016, -0.007), f(0.016, 0.007), f(-0.016, 0.007)]; g.fillStyle = k % 2 ? "rgba(190,186,140,0.9)" : "rgba(176,172,126,0.9)"; g.beginPath(); c.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); g.strokeStyle = "rgba(84,86,52,0.8)"; g.lineWidth = 1.6; g.stroke();
    }
    for (let k = 0; k < 30; k++) { const z = 1.01 + k * 0.0245, f = at(z, sideA(k % 2 ? 9.5 : 0.6, s)), p = f(0, 0); g.fillStyle = "rgba(34,36,22,0.85)"; g.beginPath(); g.arc(p[0], p[1], 2.1, 0, TAU); g.fill(); }   // 30 dark pit dots a side
  }
  // skull top: 2 rows of 6 squarish scutes of 5-7 cm, one broken; the nape: 4 rows of 5 keeled scutes
  const scute = (z, x, w, d, key, broken = false) => {
    const a = angOfX(z, x), f = at(z, a), c = [f(-d / 2, -w / 2), f(d / 2, -w / 2), f(d / 2, w / 2), f(-d / 2, w / 2)];
    g.beginPath(); const mid = f(0, 0); c.forEach((p, i) => { const q = [mid[0] + (p[0] - mid[0]) * 0.97, mid[1] + (p[1] - mid[1]) * 0.97]; i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath();
    const gr = g.createRadialGradient(mid[0] - 4, mid[1] - 4, 2, mid[0], mid[1], 40); gr.addColorStop(0, "#80845a"); gr.addColorStop(1, "#5b6040"); g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(42,44,28,0.9)"; g.lineWidth = 3.2; g.stroke();
    if (key) { const k0 = f(-d * 0.4, 0), k1 = f(d * 0.4, 0); poly([k0, k1], "rgba(42,44,28,0.8)", 2.4); poly([[k0[0] + 2, k0[1] - 2], [k1[0] + 2, k1[1] - 2]], "rgba(180,184,130,0.5)", 1.6); }
    if (broken) { const p = [f(d * 0.5, w * 0.5), f(d * 0.5, w * 0.05), f(d * 0.12, w * 0.12), f(d * 0.22, w * 0.5)]; g.fillStyle = "#3a3d26"; g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); g.strokeStyle = "#b9bd8c"; g.lineWidth = 1.8; g.stroke(); }
  };
  const SW = [0.055, 0.065, 0.07, 0.07, 0.065, 0.055];
  [0.885, 0.945].forEach((zr, row) => { let x = -0.19; SW.forEach((w, k) => { scute(zr, x + w / 2, w * 0.97, 0.058, false, row === 0 && k === 3); x += w; }); });
  [0.62, 0.68, 0.74, 0.80].forEach((zr, row) => { for (let k = 0; k < 5; k++) scute(zr + (k % 2) * 0.012, (k - 2) * 0.05, 0.046, 0.05, false); });
  // ~120 pebble scales drawn as part arcs, 1.5-3 cm, densest on the shade side (her right); 80 on the skull's cheeks (the jaw has 40 more)
  for (let i = 0; i < 80; i++) {
    const right = i < 52, z = 0.9 + rnd(i * 3 + 501) * 0.62, a = right ? 118 + rnd(i * 3 + 502) * 70 : -12 + rnd(i * 3 + 503) * 66, f = at(z, a), r = 0.0075 + 0.0075 * rnd(i + 600), c = f(0, 0), e = f(r, r), rx = Math.abs(e[0] - c[0]), ry = Math.abs(e[1] - c[1]), a0 = rnd(i + 700) * TAU;
    g.strokeStyle = "rgba(48,52,30,0.55)"; g.lineWidth = 2.2; g.beginPath(); g.ellipse(c[0], c[1], rx, ry, 0, a0, a0 + 2.2 + rnd(i + 800) * 2.2); g.stroke();
    g.strokeStyle = "rgba(160,166,110,0.30)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(c[0] - 1.5, c[1] - 1.5, rx, ry, 0, a0 + 3.4, a0 + 5.2); g.stroke();
  }
  for (let i = 0; i < 36; i++) { const z = 0.9 + rnd(i * 3 + 901) * 0.8, a = 28 + rnd(i * 3 + 902) * 120, f = at(z, a), c = f(0, 0), e = f(0.012, 0.012); g.fillStyle = `rgba(60,66,40,${0.07 + 0.08 * rnd(i)})`; g.beginPath(); g.ellipse(c[0], c[1], Math.abs(e[0] - c[0]) * 2, Math.abs(e[1] - c[1]) * 2, 0, 0, TAU); g.fill(); }
}));

// legs: x down the leg (top 0), y round it (0.25 = her left side, 0.75 = her right). Front legs are lion fur (+ the 3 old tooth dots on the LEFT foreleg's outer face); hind legs are hippo hide
// with 12 wrinkle lines at each of the two joints and dry-mud cracks.
const poly2 = (g, pts, st, lw) => { g.strokeStyle = st; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };
const foreTex = (left) => once(`hmFore${left}`, () => cvs(256, 256, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); [[0, "#6e5738"], [0.2, C.fur], [0.4, "#977a52"], [0.5, "#977a52"], [0.65, C.fur], [0.8, C.furSh], [1, "#6e5738"]].forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1500; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H, L = 9 + 8 * rnd(i * 3 + 3); g.strokeStyle = i % 3 === 0 ? "rgba(176,146,95,0.5)" : i % 3 === 1 ? "rgba(94,74,48,0.55)" : "rgba(60,46,28,0.4)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (rnd(i + 5) - 0.5) * 3); g.stroke(); }
  if (left) for (let k = 0; k < 3; k++) { const x = W * (0.40 + k * 0.055), y = H * 0.25; g.fillStyle = "rgba(199,165,143,0.85)"; g.beginPath(); g.ellipse(x, y, 3.6, 5, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(58,40,28,0.95)"; g.beginPath(); g.ellipse(x, y, 1.6, 2.4, 0, 0, TAU); g.fill(); }   // a row of 3 old tooth dots
}));
const hindTex = () => once("hmHind", () => cvs(256, 256, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); [[0, C.belly], [0.15, C.belly], [0.3, C.olive], [0.5, "#838469"], [0.7, C.olive], [0.85, "#575941"], [1, C.belly]].forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { g.fillStyle = i % 3 ? "rgba(30,32,20,0.16)" : "rgba(235,235,200,0.1)"; g.beginPath(); g.arc(rnd(i * 2 + 1) * W, rnd(i * 2 + 2) * H, 1 + rnd(i) * 1.5, 0, TAU); g.fill(); }
  for (let i = 0; i < 22; i++) { const x = rnd(i * 5 + 11) * W, y = rnd(i * 5 + 12) * H, pts = [[x, y]]; let a = rnd(i * 5 + 13) * TAU; for (let k = 0; k < 4; k++) { a += (rnd(i * 9 + k) - 0.5) * 1.5; pts.push([pts[k][0] + Math.cos(a) * 9, pts[k][1] + Math.sin(a) * 9]); } poly2(g, pts, "rgba(60,62,44,0.8)", 1.5); }
  [0.30, 0.58].forEach((u, j) => { for (let k = 0; k < 12; k++) { const x = W * (u + (k - 5.5) * 0.0105), pts = []; for (let m = 0; m <= 6; m++) pts.push([x + Math.sin(m * 1.4 + k + j) * 2.4, H * (0.08 + 0.84 * (m / 6) * (0.55 + 0.4 * rnd(j * 20 + k)))]); poly2(g, pts, "rgba(79,81,64,0.85)", 1.8); poly2(g, pts.map((p) => [p[0] + 2, p[1]]), "rgba(210,210,170,0.25)", 1); } });   // 12 wrinkle lines at each joint
}));
const pawTex = (front) => once(`hmPaw${front}`, () => cvs(128, 128, (g, W, H) => {   // x along the paw (back 0 .. toes 1), y round it
  g.fillStyle = front ? C.fur : C.olive; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H; g.strokeStyle = front ? (i % 2 ? "rgba(94,74,48,0.6)" : "rgba(176,146,95,0.45)") : (i % 2 ? "rgba(60,62,44,0.5)" : "rgba(210,210,170,0.2)"); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + (rnd(i + 5) - 0.5) * 3); g.stroke(); }
  g.fillStyle = "rgba(30,22,14,0.35)"; g.fillRect(0, 0, W, H * 0.12); g.fillRect(0, H * 0.88, W, H * 0.12);
  g.strokeStyle = "rgba(42,30,20,0.85)"; g.lineWidth = 2.4; for (let k = 0; k < 3; k++) { const y = H * (0.5 + (k - 1) * 0.13); g.beginPath(); g.moveTo(W * 0.66, y); g.lineTo(W, y); g.stroke(); }
}));
const clawTex = (kind) => once(`hmClaw${kind}`, () => cvs(16, 64, (g, W, H) => {   // v 0 = root, 1 = tip (taperTube v runs 1 at the root: the gradient is drawn root at the bottom)
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#8c7f5e"); gr.addColorStop(0.25, C.claw); gr.addColorStop(1, "#ece3c4"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = C.clawCr; g.lineWidth = 1.4; if (kind === "split") { g.beginPath(); g.moveTo(W * 0.5, H * 0.1); g.lineTo(W * 0.48, H * 0.75); g.stroke(); g.lineWidth = 0.9; g.beginPath(); g.moveTo(W * 0.62, H * 0.35); g.lineTo(W * 0.6, H * 0.6); g.stroke(); }
  if (kind === "broken") { g.beginPath(); g.moveTo(0, H * 0.28); g.lineTo(W * 0.4, H * 0.22); g.lineTo(W * 0.7, H * 0.3); g.lineTo(W, H * 0.2); g.stroke(); }
  g.fillStyle = "rgba(74,61,44,0.35)"; g.fillRect(W * 0.8, 0, W * 0.2, H);
}));
// the lower jaw: x along (hinge 0), y round (0.5 = the top, the inside of the mouth; 0 = the chin)
const jawTex = () => once("hmJaw", () => cvs(1024, 256, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); [[0, C.lip], [0.07, C.lip], [0.14, mixHex(C.lip, C.hide, 0.55)], [0.22, C.hide], [0.25, C.lip], [0.28, C.mouth], [0.5, C.mouth], [0.72, C.mouth], [0.75, C.lip], [0.78, C.hide], [0.86, mixHex(C.hideSh, C.lip, 0.4)], [0.93, C.lip], [1, C.lip]].forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(58,24,32,0.5)"; g.fillRect(0, H * 0.3, W * 0.18, H * 0.4);
  for (let i = 0; i < 40; i++) {   // 40 pebble scales on the jaw (and the chin)
    const x = W * (0.12 + 0.84 * rnd(i * 3 + 1)), y = H * (i % 2 ? 0.04 + 0.26 * rnd(i * 3 + 2) : 0.70 + 0.26 * rnd(i * 3 + 3)), r = 5 + 6 * rnd(i + 9), a0 = rnd(i + 20) * TAU;
    g.strokeStyle = "rgba(48,52,30,0.55)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, r * 1.2, r * 0.8, 0, a0, a0 + 2.4 + rnd(i) * 2); g.stroke();
  }
  for (let i = 0; i < 24; i++) { const x = W * (0.2 + 0.03 * i); for (const y of [H * 0.215, H * 0.785]) { g.fillStyle = "rgba(34,36,22,0.8)"; g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill(); } }
  g.strokeStyle = "rgba(42,44,28,0.8)"; g.lineWidth = 2.5; for (const y of [H * 0.245, H * 0.755]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
}));
const tongueTex = () => once("hmTongue", () => cvs(64, 128, (g, W, H) => {   // x along the tongue (root 0), y round (0.5 = the top)
  g.fillStyle = C.tongue; g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(160,70,95,0.7)"); gr.addColorStop(0.3, "rgba(217,119,138,0)"); gr.addColorStop(0.7, "rgba(217,119,138,0)"); gr.addColorStop(1, "rgba(160,70,95,0.7)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(150,60,85,0.95)"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W * 0.92, H * 0.5); g.stroke(); g.strokeStyle = "rgba(255,200,210,0.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H * 0.44); g.lineTo(W * 0.92, H * 0.44); g.stroke(); g.beginPath(); g.moveTo(0, H * 0.56); g.lineTo(W * 0.92, H * 0.56); g.stroke();
  for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(255,214,222,0.35)"; g.beginPath(); g.arc(rnd(i * 2 + 1) * W, H * (0.2 + 0.6 * rnd(i * 2 + 2)), 1.4, 0, TAU); g.fill(); }
}));
const toothTex = (crack) => once(`hmTooth${crack}`, () => cvs(16, 64, (g, W, H) => {   // v 0 = the root (canvas bottom), 1 = the tip
  const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, C.root); gr.addColorStop(0.2, C.root); gr.addColorStop(0.34, C.tooth); gr.addColorStop(0.82, C.tooth); gr.addColorStop(1, C.tip); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,250,215,0.5)"; g.fillRect(W * 0.18, H * 0.1, W * 0.14, H * 0.7);
  if (crack) { g.strokeStyle = "rgba(120,96,40,0.95)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * 0.55, H * 0.15); g.lineTo(W * 0.42, H * 0.4); g.lineTo(W * 0.58, H * 0.6); g.lineTo(W * 0.5, H * 0.78); g.stroke(); }
}));
const eyeTex = () => once("hmEye", () => cvs(256, 128, (g, W, H) => {   // the front of the sphere is u 0.25, v 0.5
  g.fillStyle = C.amber; g.fillRect(0, 0, W, H); const cx = W * 0.25, cy = H * 0.5;
  const gr = g.createRadialGradient(cx, cy, 2, cx, cy, 34); gr.addColorStop(0, C.amberC); gr.addColorStop(0.55, "#f6c43a"); gr.addColorStop(1, C.amber); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 36, 34, 0, 0, TAU); g.fill();
  g.strokeStyle = C.fleck; g.lineWidth = 1.4; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11); g.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 29); g.stroke(); }   // 8 fine radial flecks
  g.fillStyle = "rgba(150,90,20,0.55)"; g.beginPath(); g.ellipse(cx, cy, 36, 34, 0, 0, TAU); g.lineWidth = 2.4; g.strokeStyle = "rgba(150,90,20,0.6)"; g.stroke();
  g.fillStyle = C.pupil; g.beginPath(); g.ellipse(cx, cy, 5.2, 21, 0, 0, TAU); g.fill();   // the vertical slit pupil, 0.012 wide
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx + 9, cy - 11, 3.6, 0, TAU); g.fill();   // one catch-light
}));
const nostrilTex = () => once("hmNostril", () => cvs(128, 64, (g, W, H) => { g.fillStyle = "#5f6342"; g.fillRect(0, 0, W, H); g.fillStyle = "#1a120a"; for (const k of [-1, 1]) { g.save(); g.translate(W * 0.25 + k * 18, H * 0.5); g.rotate(k * 0.5); g.beginPath(); g.ellipse(0, 0, 11, 2.6, 0, 0, TAU); g.fill(); g.restore(); } }));
// mane locks: v 1 (the top row of the canvas) is the root; 3, 4 or 5 strand lines run down it; `tip` = a dusty tip (#a8703a)
const lockTex = (strands, tip) => once(`hmLock${strands}${tip}`, () => cvs(64, 128, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.maneSh); gr.addColorStop(0.22, C.mane); gr.addColorStop(0.7, C.mane); gr.addColorStop(1, tip ? C.maneTip : "#8d5a2f"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < strands; k++) { const x = W * (0.12 + (0.76 * (k + 0.5)) / strands); g.strokeStyle = "rgba(60,30,12,0.8)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, H * 0.3, x - 4, H * 0.6, x + 2, H); g.stroke(); g.strokeStyle = "rgba(160,100,52,0.55)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 3, 0); g.bezierCurveTo(x + 7, H * 0.3, x - 1, H * 0.6, x + 5, H); g.stroke(); }
}));
// a three-strand plait with n crossings (9-12), drawn once: v 1 (canvas top) = the root
const braidTex = (n) => once(`hmBraid${n}`, () => cvs(64, 256, (g, W, H) => {
  g.fillStyle = C.maneSh; g.fillRect(0, 0, W, H);
  for (let k = 0; k < n; k++) for (let s = 0; s < 3; s++) {
    const y0 = (H / n) * k + (s * H) / (3 * n), x = W * (0.22 + 0.28 * s), up = (k + s) % 2 ? -1 : 1;
    g.fillStyle = (k + s) % 2 ? C.mane : "#8d5a2f"; g.strokeStyle = "rgba(40,20,8,0.9)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y0 + 1); g.quadraticCurveTo(x, y0 + up * 6 + H / (2 * n), x + 9, y0 + H / n); g.lineTo(x + 9, y0 + H / n + 6); g.quadraticCurveTo(x, y0 + up * 6 + H / (2 * n) + 8, x - 9, y0 + 8); g.closePath(); g.fill(); g.stroke();
  }
}));
// gold leaf on a bead (u round, v 1 = the top): one long light band, shade in the recess, 2 engraved rings, 8 % worn through to bronze (1 spot in 4 shows the red bole)
const beadTex = (variant) => once(`hmBead${variant}`, () => cvs(128, 64, (g, W, H) => {
  g.fillStyle = C.gold; g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(154,106,30,0.55)"); gr.addColorStop(0.5, "rgba(154,106,30,0)"); gr.addColorStop(1, "rgba(154,106,30,0.6)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = C.goldLt; g.globalAlpha = 0.85; g.fillRect(W * 0.28, H * 0.08, W * 0.07, H * 0.84); g.globalAlpha = 1;
  g.strokeStyle = C.goldDeep; g.lineWidth = 2.2; for (const y of [H * 0.34, H * 0.66]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.strokeStyle = "rgba(255,240,184,0.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 2.4); g.lineTo(W, y + 2.4); g.stroke(); g.strokeStyle = C.goldDeep; g.lineWidth = 2.2; }
  for (let k = 0; k < 4; k++) { const x = W * rnd(variant * 11 + k * 3 + 1), y = H * (0.15 + 0.7 * rnd(variant * 11 + k * 3 + 2)); g.fillStyle = k === variant % 4 ? C.bole : C.goldDeep; g.beginPath(); g.ellipse(x, y, 6 + 5 * rnd(variant + k), 3 + 3 * rnd(variant * 3 + k), 0, 0, TAU); g.fill(); }
}));
const lapisTex = () => once("hmLapis", () => cvs(32, 32, (g, W, H) => { const gr = g.createRadialGradient(11, 10, 1, 16, 16, 17); gr.addColorStop(0, C.lapisLt); gr.addColorStop(0.45, C.lapis); gr.addColorStop(1, C.lapisSh); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(233,200,90,0.8)"; g.fillRect(4 + rnd(i * 2) * 24, 4 + rnd(i * 2 + 1) * 24, 1.6, 1.6); } }));
const turqTex = () => once("hmTurq", () => cvs(32, 32, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.turqLt); gr.addColorStop(0.4, C.turq); gr.addColorStop(1, C.turqSh); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));

// ---------------------------------------------------------------- geometry
const mkSec = (c, w, up, dn, n = 2.4) => ({ c, w, up, dn, n });
const rowSec = (r) => mkSec([0, r.bot + r.dn, r.z], r.hw, r.top - (r.bot + r.dn), r.dn, r.n);
const merge = (list) => mergeGeometries(list.map((g) => g.index ? g : g));
function clawGeo(kind, len) {   // 7 cm (front) or 4 cm (hind) curved claws; split = two prongs along the length, broken = short and blunt
  return once(`hmClawG${kind}${len}`, () => {
    const mk = (L, r0, r1, ox = 0, spread = 0) => { const a1 = rad(8.75), a2 = rad(26), p1 = [ox, -Math.sin(a1) * L / 2, Math.cos(a1) * L / 2], p2 = [ox + spread * L * 0.5, p1[1] - Math.sin(a2) * L / 2, p1[2] + Math.cos(a2) * L / 2]; return taperTube([[ox, 0, 0], p1, p2], r0, r1, 7, 8); };
    if (kind === "split") return merge([mk(len, 0.0062, 0.0016, -0.0042, -0.12), mk(len, 0.0062, 0.0016, 0.0042, 0.12)]);
    if (kind === "broken") return mk(len * 0.58, 0.0092, 0.0042);
    return mk(len, len > 0.05 ? 0.0095 : 0.009, 0.002);
  });
}
// a raised pale scar (8 mm): a flat-ish tube along the points with 3-5 cross ticks; `cen(p)` gives the section centre for the tick direction
function scarGeo(strokes, ticks, cen) {
  const parts = [];
  for (const pts of strokes) {
    parts.push(taperTube(pts, 0.0055, 0.0055, 6, pts.length * 4, 1));
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(p))), T = new THREE.Vector3(), P = new THREE.Vector3();
    for (let k = 1; k <= ticks; k++) {
      curve.getPointAt(k / (ticks + 1), P); curve.getTangentAt(k / (ticks + 1), T);
      const c = cen(P), n = new THREE.Vector3(P.x - c[0], P.y - c[1], P.z - c[2]).normalize(), b = new THREE.Vector3().crossVectors(T, n).normalize().multiplyScalar(0.02);
      parts.push(taperTube([[P.x - b.x, P.y - b.y, P.z - b.z], [P.x + b.x, P.y + b.y, P.z + b.z]], 0.0036, 0.0036, 5, 2, 1));
    }
  }
  return merge(parts);
}
const onSkin = (z, a, lift = 0.0025, rows = SEC) => { const m = mpd(z, a, rows); return (dz, ds) => surf(z + dz, a + ds / m, rows, lift); };
// a unit cone, base at y 0 and the apex at y 1, a slight backward bend (teeth)
const toothGeo = () => once("hmToothG", () => { const g = new THREE.ConeGeometry(1, 1, 8, 4, false); g.translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, p.getZ(i) - 0.22 * y * y); } g.computeVertexNormals(); return g; });
const toothChipGeo = () => once("hmToothChip", () => { const g = new THREE.CylinderGeometry(0.42, 1, 1, 8, 1, false); g.translate(0, 0.5, 0); return g; });
const unitSphere = () => once("hmSph", () => new THREE.SphereGeometry(1, 14, 10));
const lockPts = (R, h, D, drop, L, wob, sw) => [0, 0.25, 0.5, 0.75, 1].map((t) => [R[0] + h[0] * D * L * t ** 1.2 + wob * 0.028 * Math.sin(Math.PI * t * 1.6) + sw[0] * t * t * L, R[1] - drop * L * t ** 1.05, R[2] + h[1] * D * L * t ** 1.2 + wob * 0.01 * Math.sin(Math.PI * t * 1.3 + 1) + sw[1] * t * t * L]);

// ---------------------------------------------------------------- the hand-placed marks: warts, locks, braids
// 20 warts [x, z, r] on the skull top, cheeks and snout (head frame, stand coordinates)
const WARTS = [[0.05, 0.915, 0.010], [-0.11, 0.97, 0.012], [0.12, 1.06, 0.011], [-0.04, 1.08, 0.009], [0.19, 1.10, 0.010], [-0.19, 1.13, 0.013], [0.08, 1.17, 0.008], [-0.10, 1.22, 0.010], [0.13, 1.28, 0.012], [-0.06, 1.31, 0.008],
  [0.09, 1.38, 0.011], [-0.12, 1.40, 0.009], [0.04, 1.47, 0.010], [-0.09, 1.52, 0.012], [0.11, 1.55, 0.008], [-0.03, 1.60, 0.009], [0.07, 1.64, 0.011], [-0.11, 1.66, 0.008], [0.015, 1.70, 0.007], [0.145, 1.20, 0.009]];
// the mane's 46 locks, in clumps of two and three (stand coordinates of the root; frame: the head for crown + ruff, the shoulders for the rest)
const CROWN_G = [[-0.26, 1.40, 0.90, 3], [-0.12, 1.44, 0.87, 2], [0.03, 1.46, 0.86, 3], [0.17, 1.44, 0.88, 3], [0.29, 1.40, 0.90, 3]];
const RUFF_G = [[-0.40, 1.32, 0.80, 3], [-0.44, 1.12, 0.82, 2], [-0.38, 0.94, 0.86, 3], [-0.17, 0.86, 0.90, 2], [0.17, 0.86, 0.90, 2], [0.38, 0.94, 0.86, 3], [0.44, 1.12, 0.82, 2], [0.40, 1.32, 0.80, 3]];
const SHLD_G = [[-0.46, 1.22, 0.46, 3], [-0.26, 1.40, 0.40, 2], [0.0, 1.44, 0.36, 2], [0.26, 1.40, 0.40, 2], [0.46, 1.22, 0.46, 3]];
const DUSTY = new Set([2, 9, 18, 31, 40]), KNOT = new Set([7, 25, 33]), BEADED = new Set([16, 22, 29]);
function makeLocks() {
  const out = []; let n = 0;
  const add = (groups, cls, lenR, rR, dirf) => groups.forEach(([gx, gy, gz, cnt], gi) => {
    const sw = [(rnd(gi * 31 + n) - 0.5) * 0.6, (rnd(gi * 17 + n + 3) - 0.5) * 0.5];   // one sway for the whole clump: the locks stick together in twos and threes
    for (let k = 0; k < cnt; k++, n++) {
      const i = n * 13, R = [gx + (k - (cnt - 1) / 2) * 0.03 + (rnd(i + 1) - 0.5) * 0.012, gy + (rnd(i + 2) - 0.5) * 0.02, gz + (rnd(i + 3) - 0.5) * 0.024], L = lenR[0] + (lenR[1] - lenR[0]) * rnd(i + 4), r0 = rR[0] + (rR[1] - rR[0]) * rnd(i + 5);
      const d = dirf(gx, gi, k, i); out.push({ n, cls, R, L, r0, sw, h: d.h, D: d.D, drop: d.drop, wob: (rnd(i + 6) - 0.5) * 2, strands: 3 + (n % 3), dusty: DUSTY.has(n), knot: KNOT.has(n), beaded: BEADED.has(n) });
    }
  });
  add(CROWN_G, "crown", [0.18, 0.25], [0.02, 0.040], (gx, gi, k, i) => ({ h: [gx * 0.5, -1], D: 0.78, drop: 0.38 }));   // lying back over the neck
  add(RUFF_G, "ruff", [0.30, 0.42], [0.022, 0.045], (gx, gi, k, i) => ({ h: [Math.sign(gx) * 0.8, -0.25], D: 0.22, drop: 0.96 }));   // by the cheeks and under the jaw, hanging
  add(SHLD_G, "shoulder", [0.25, 0.35], [0.022, 0.042], (gx, gi, k, i) => ({ h: [Math.sign(gx || 1) * 0.5, -0.9], D: 0.30, drop: 0.93 }));   // over the shoulders
  return out;
}
const BRAIDS = [[-0.38, 0.60, 9], [-0.30, 0.45, 10], [0.30, 0.45, 11], [0.38, 0.60, 12]];   // [x, hanging length, crossings drawn]

// ================================================================================================ the kind
export const HEART_MONSTER_STATE = { heartmonster: { low: 0, rear: 0, sit: 0, slump: 0, jaw: 0, jawTop: 0.27, chomp: 0, chew: 0, lick: 0, headYaw: 0, headPitch: 0, gait: 0, breath: 0, drool: 0.5, stain: 0, lids: 0.25, glow: 0.4, wag: 0 } };
const FP = [[0.10, 0.03, -0.10, -0.06], [0.14, 0.03, -0.10, 0.04], [0.15, 0.00, -0.10, 0.14], [0.14, -0.03, -0.10, 0.24], [0.09, -0.05, -0.10, 0.285]];   // front paw 0.30 x 0.34 x 0.13: [half width, top, bottom, z] from the wrist
const HP = [[0.15, 0.04, -0.10, -0.08], [0.17, 0.04, -0.10, 0.04], [0.17, 0.0, -0.10, 0.16], [0.15, -0.04, -0.10, 0.25]];   // hind foot
const CLAW_KINDS = { fl: ["whole", "split", "broken", "split"], fr: ["split", "broken", "whole", "split"] };   // 2 split + 1 broken short a paw, a different three on each
const lowerLid = () => once("hmLowerLid", () => { const g = new THREE.TorusGeometry(0.046, 0.0032, 6, 20, Math.PI * 0.9); g.rotateZ(Math.PI * 1.05); return g; });
export const HEART_MONSTER_KINDS = {
  heartmonster(P) {
    const S = palette(), DS = THREE.DoubleSide, spec = P.spec || {};
    const skinM = S.m("#ffffff", { map: skinTex(), roughness: 0.62 }), jawM = S.m("#ffffff", { map: jawTex(), roughness: 0.55 });
    const foreM = [foreTex(true), foreTex(false)].map((t) => S.m("#ffffff", { map: t, roughness: 0.7 })), hindM = S.m("#ffffff", { map: hindTex(), roughness: 0.7 });
    const pawFM = S.m("#ffffff", { map: pawTex(true), roughness: 0.7 }), pawHM = S.m("#ffffff", { map: pawTex(false), roughness: 0.7 });
    const hideM = S.m("#7a7e52", { roughness: 0.6 }), hideDk = S.m(C.hideSh, { roughness: 0.7 }), scarM = S.m(C.scar, { roughness: 0.55 }), spineM = S.m("#6f7058", { roughness: 0.7 }), bristleM = S.m(C.crease, { roughness: 0.8 });
    const toothM = [S.m("#ffffff", { map: toothTex(false), roughness: 0.3 }), S.m("#ffffff", { map: toothTex(true), roughness: 0.3 })];
    const clawM = { whole: S.m("#ffffff", { map: clawTex("whole"), roughness: 0.4 }), split: S.m("#ffffff", { map: clawTex("split"), roughness: 0.4 }), broken: S.m("#ffffff", { map: clawTex("broken"), roughness: 0.4 }) };
    const tongueM = S.m("#ffffff", { map: tongueTex(), roughness: 0.22 }), throatM = S.m(C.throat, { roughness: 0.9 });
    const eyeM = S.m("#ffffff", { map: eyeTex(), roughness: 0.18, emissive: new THREE.Color("#ffb020"), emissiveMap: eyeTex(), emissiveIntensity: 0.4 });
    const lidM = S.m(C.hide, { roughness: 0.65 }), wetM = S.m("#dfe6c4", { roughness: 0.1 });
    const lockM = {}; for (const s of [3, 4, 5]) for (const t of [false, true]) lockM[`${s}${t}`] = S.m("#ffffff", { map: lockTex(s, t), roughness: 0.75 });
    const braidM = [9, 10, 11, 12].map((n) => S.m("#ffffff", { map: braidTex(n), roughness: 0.8 })), beadM = [0, 1, 2, 3].map((v) => S.m("#ffffff", { map: beadTex(v), roughness: 0.28, metalness: 0.35 }));
    const lapisM = S.m("#ffffff", { map: lapisTex(), roughness: 0.25 }), turqM = S.m("#ffffff", { map: turqTex(), roughness: 0.3 }), knotM = S.m(C.mane, { roughness: 0.8 });
    const juiceM = S.m(C.juice, { roughness: 0.25 }), juiceDk = S.m(C.juiceSh, { roughness: 0.3 }), glossM = S.b(C.gloss), droolM = S.m(C.drool, { roughness: 0.08, transparent: true, opacity: 0.8 });
    droolM.userData.noOutline = true; juiceM.userData.noOutline = true;
    const root = new THREE.Group(); P.whole.add(root);
    const bodyG = new THREE.Group(), tailG = new THREE.Group(), headG = new THREE.Group(), maneG = new THREE.Group(), shldG = new THREE.Group();
    root.add(bodyG, tailG, headG, maneG, shldG); headG.rotation.order = "YXZ";

    // ---- ONE skin, tail to snout
    const bodyGeo = makeLoft(SEC.map(rowSec), { sub: 5, radial: 40 }), trunk = mesh(bodyGeo, skinM, root);
    tailG.position.set(...TR0);
    // hippo marks: 7 spine knobs, bristles on the rump and tail (40, sparse), the tail tuft with one torn notch
    [-0.98, -0.80, -0.62, -0.44, -0.26, -0.08, 0.10].forEach((z, i) => { const r = 0.040 - 0.004 * (i % 2), o = mesh(unitSphere(), spineM, bodyG, 0, topY(0, z) - 0.004, z); o.scale.set(r, r * 0.55, r * 1.2); });
    const bristles = (list, parent, off) => { const parts = []; for (const [p, d, L] of list) { const g = new THREE.ConeGeometry(0.0022, L, 4, 1); g.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, V3(nrm3(d))); g.applyQuaternion(q); g.translate(p[0] - off[0], p[1] - off[1], p[2] - off[2]); parts.push(g); } const o = mesh(merge(parts), bristleM, parent); o.castShadow = false; return o; };
    { const rump = [], tail = []; for (let i = 0; i < 26; i++) { const z = -1.12 + rnd(i * 3 + 1) * 1.0, a = 20 + rnd(i * 3 + 2) * 140, p = surf(z, a, SEC, 0.001), c = [0, rowAt(z).cy, z], n = [p[0] - c[0], p[1] - c[1] + 0.2, p[2] - c[2] - 0.15]; rump.push([p, n, 0.03 + 0.03 * rnd(i + 40)]); }
      bristles(rump, bodyG, [0, 0, 0]);
      for (let i = 0; i < 14; i++) { const z = -1.40 + rnd(i * 3 + 91) * 0.24, a = rnd(i * 3 + 92) * 360 - 90, p = surf(z, a, SEC, 0.001), c = [0, rowAt(z).cy, z]; tail.push([p, [p[0] - c[0], p[1] - c[1], p[2] - c[2] - 0.4], 0.035 + 0.03 * rnd(i + 70)]); }
      const tuft = []; for (let k = 0; k < 11; k++) { if (k === 4) continue; const a = ((k - 5) / 5) * 0.9, L = (k === 3 || k === 5 ? 0.04 : 0.07 + 0.03 * rnd(k + 5)); tuft.push([[Math.sin(a) * 0.02, 0.88 + Math.cos(a * 2) * 0.012, -1.435], [Math.sin(a) * 0.5, -0.1 + Math.cos(a) * 0.1, -1], L]); }   // 10 bristles, the 5th torn out of the tuft
      bristles(tail.concat(tuft), tailG, TR0.map((v, i) => v)); }
    // scars: the X on the left flank is below; two 0.40 on the left flank
    { const cen = (p) => [0, rowAt(p.z).cy, p.z], f1 = onSkin(-0.55, 28), f2 = onSkin(-0.20, 40);
      mesh(scarGeo([[f1(-0.14, 0.14), f1(-0.02, 0.04), f1(0.05, -0.05), f1(0.14, -0.14)]], 5, cen), scarM, bodyG).castShadow = false;
      mesh(scarGeo([[f2(-0.14, 0.12), f2(-0.04, 0.05), f2(0.05, -0.04), f2(0.14, -0.13)]], 4, cen), scarM, bodyG).castShadow = false; }

    // ---- legs: ONE loft each, then a rigid paw in its own frame
    const legs = LEGS.map((l) => {
      const rows = l.f ? FROWS : HROWS, geo = makeLoft(rows.map((r, i) => mkSec([l.s * (l.f ? 0.3 : 0.4), 0.9 - i * 0.1, 0.3], ...r, 2.6)), { sub: 4, radial: 20, ref: [0, 0, 1] });
      mesh(geo, l.f ? foreM[l.s > 0 ? 0 : 1] : hindM, root);
      const pg = new THREE.Group(); root.add(pg);
      const pawRows = l.f ? FP : HP, pg0 = makeLoft(pawRows.map(([w, u, d, z]) => mkSec([0, (u + d) / 2, z], w, u - (u + d) / 2, (u + d) / 2 - d, 2.4)), { sub: 4, radial: 16, ref: [0, 1, 0] });
      mesh(pg0, l.f ? pawFM : pawHM, pg);
      if (l.f) {
        [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => { const t = mesh(unitSphere(), pawFM, pg, k * 0.072, -0.052, 0.225); t.scale.set(0.040, 0.034, 0.048);
          const c = mesh(clawGeo(CLAW_KINDS[l.k][i], 0.07), clawM[CLAW_KINDS[l.k][i]], pg, k * 0.072, -0.040, 0.262); c.castShadow = false; });
      } else {
        [-1.5, -0.5, 0.5, 1.5].forEach((k) => { const t = mesh(unitSphere(), pawHM, pg, k * 0.078, -0.058, 0.235); t.scale.set(0.040, 0.036, 0.046);
          const c = mesh(clawGeo("whole", 0.04), clawM.whole, pg, k * 0.078, -0.050, 0.268); c.castShadow = false; });
      }
      return { ...l, geo, pg, rows };
    });
    // fur ticks on each foreleg's outline: 30 a leg (updated with the leg)
    const ticks = [0, 1].map((side) => { const g = new THREE.BufferGeometry(), N = 30; g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 9), 3)); const idx = []; for (let i = 0; i < N; i++) idx.push(i * 3, i * 3 + 1, i * 3 + 2); g.setIndex(idx); const o = mesh(g, S.m(C.furSh, { roughness: 0.8, side: DS }), root); o.castShadow = false; o.frustumCulled = false; return { g, N, side }; });

    // ---- the head frame: everything below is in stand coordinates and rides the skull (lift + turn about the atlas)
    // lower jaw (hinged at J): its own loft, the inside of the mouth on top
    const jawG = new THREE.Group(); jawG.position.set(...J0); headG.add(jawG);
    const jawGeo = makeLoft(JSEC.map((r) => mkSec([0, r.bot + r.dn - J0[1], r.z - J0[2]], r.hw, r.top - (r.bot + r.dn), r.dn, r.n)), { sub: 4, radial: 32 }); mesh(jawGeo, jawM, jawG);
    // throat: a dark pocket at the back of the mouth
    { const o = mesh(unitSphere(), throatM, headG, 0, 0.96, 0.93); o.scale.set(0.22, 0.10, 0.08); o.castShadow = false; }
    // the 36 teeth: placed by hand (TEETH)
    const toothMeshes = [], stainTips = [];
    for (const T of TOOTH_LIST) {
      const parent = T.up ? headG : jawG, y0 = T.up ? LIP(T.z) - 0.008 : LIP(T.z) - 0.014, org = T.up ? [T.x, y0, T.z] : [T.x - J0[0], y0 - J0[1], T.z - J0[2]];
      const l = rad(T.lean) * T.side, fa = rad(T.fore), sgn = T.up ? -1 : 1;
      const d = nrm3([Math.sin(l), sgn * Math.cos(l) * Math.cos(fa), Math.sin(fa) * Math.cos(l)]), r = T.cls === "F" ? Math.max(0.0155, T.len * 0.19) : T.cls === "M" ? 0.0125 : 0.0085;
      const m = mesh(T.fl.includes("c") ? toothChipGeo() : toothGeo(), toothM[T.fl.includes("k") ? 1 : 0], parent, ...org);
      m.quaternion.setFromUnitVectors(Y_AXIS, V3(d)); m.scale.set(r, T.len, r); m.castShadow = false; toothMeshes.push(m);
      if (T.fl.includes("t")) { const c = mesh(toothGeo(), juiceM, parent, org[0] + d[0] * T.len * 0.64, org[1] + d[1] * T.len * 0.64, org[2] + d[2] * T.len * 0.64); c.quaternion.copy(m.quaternion); c.scale.set(r * 0.4, T.len * 0.36, r * 0.4); c.castShadow = false; c.userData.noOutline = true; stainTips.push(c); }
    }
    // eyes at (+-0.17, EYE_Y, 0.98) (on the skull's shoulder): amber ball r 0.045 in a bulging socket under a raised brow ridge of 3 fused scutes, lid, wet lower lid line, a halo
    const haloTex = once("hmHalo", () => radialTexture([[0, "rgba(255,194,58,1)"], [0.35, "rgba(255,194,58,0.55)"], [1, "rgba(255,194,58,0)"]]));
    const eyes = [1, -1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.17, EYE_Y, 0.98); g.rotation.order = "YXZ"; g.rotation.set(rad(-8), s * rad(28), 0); headG.add(g);
      const ball = mesh(new THREE.SphereGeometry(0.045, 24, 16), eyeM, g); ball.castShadow = false;
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0495, 24, 12, 0, TAU, 0, Math.PI / 2), lidM); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
      const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP);
      const lw = mesh(lowerLid(), wetM, g, 0, 0, 0.002); lw.castShadow = false; lw.userData.noOutline = true; const lw2 = mesh(lowerLid(), S.m(C.lip, { roughness: 0.6 }), g, 0, -0.002, 0); lw2.scale.setScalar(1.06);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.set(0, 0, 0.03); g.add(halo);
      const brow = new THREE.Group(); brow.position.set(s * 0.17, EYE_Y, 0.98); headG.add(brow);   // 3 fused scutes over a bulging socket
      { const so = mesh(unitSphere(), lidM, brow, s * 0.004, -0.004, -0.006); so.scale.set(0.066, 0.060, 0.070); so.castShadow = false; }
      [[-0.040, 0.050, 0.026, 0.024], [0.0, 0.058, 0.030, 0.028], [0.042, 0.050, 0.026, 0.024]].forEach(([dz, dy, sx, sy], k) => { const o = mesh(unitSphere(), k === 1 ? hideM : lidM, brow, 0, dy, dz); o.scale.set(0.050, sy, sx + 0.008); o.rotation.z = s * -0.14; });
      const ridge = mesh(unitSphere(), hideDk, brow, 0, 0.042, 0); ridge.scale.set(0.048, 0.012, 0.082); ridge.castShadow = false;
      return { g, lidP, halo, brow, s };
    });
    // nostril bump with 2 slits; two ridges along the snout; 20 warts; the mouth point
    { const bump = mesh(unitSphere(), hideM, headG, 0, topY(0, 1.70) + 0.003, 1.70); bump.scale.set(0.072, 0.026, 0.042);
      for (const k of [-1, 1]) { const o = mesh(unitSphere(), throatM, headG, k * 0.02, topY(0, 1.70) + 0.024, 1.705); o.scale.set(0.014, 0.0034, 0.0052); o.rotation.y = k * 0.5; o.castShadow = false; }
      for (const s of [-1, 1]) { const pts = [[0.115, 1.06], [0.100, 1.22], [0.075, 1.40], [0.050, 1.57], [0.026, 1.68]].map(([x, z]) => [s * x, topY(s * x, z) + 0.006, z]); const o = mesh(taperTube(pts, 0.0105, 0.0065, 6, 14, 1), hideM, headG); o.castShadow = false; }
      WARTS.forEach(([x, z, r]) => { const o = mesh(unitSphere(), hideM, headG, x, topY(x, z) + r * 0.2, z); o.scale.set(r, r * 0.8, r); o.castShadow = false; });
      // the 3 scars of the head: X on the left snout (two 0.16 strokes), the slash through the right brow and lid (0.22), one 0.30 on the left cheek
      const cenH = (p) => [0, rowAt(p.z).cy, p.z], fx = onSkin(1.46, 64, 0.003);
      mesh(scarGeo([[fx(-0.057, -0.057), fx(0, 0), fx(0.057, 0.057)], [fx(-0.057, 0.057), fx(0, 0), fx(0.057, -0.057)]], 3, cenH), scarM, headG).castShadow = false;
      const sl = [[0.058, 0.066, -0.078], [0.028, 0.092, -0.036], [-0.004, 0.098, 0.006], [-0.050, 0.062, 0.052], [-0.080, -0.010, 0.088]].map((o) => [-0.17 + o[0], EYE_Y + o[1], 0.98 + o[2]]);   // across the right brow, over the lid
      mesh(scarGeo([sl], 5, (p) => [-0.17, EYE_Y, 0.98]), scarM, headG).castShadow = false;
      const fc = onSkin(1.05, 22, 0.003); mesh(scarGeo([[fc(-0.12, 0.09), fc(-0.03, 0.03), fc(0.04, -0.03), fc(0.12, -0.09)]], 4, cenH), scarM, headG).castShadow = false; }
    const mouth = new THREE.Group(); mouth.name = "mouthHold"; mouth.position.set(...M0); headG.add(mouth);
    // the tongue (a loft in the jaw frame; 0.34 x 0.11 at rest; the lick moves it out along the upper lip)
    const TN = 8, tongueW = [0.040, 0.054, 0.060, 0.058, 0.052, 0.043, 0.030, 0.014], tongueGeo = makeLoft(Array.from({ length: TN }, (_, i) => mkSec([0, 0, i * 0.04], tongueW[i], 0.014, 0.012, 2.4)), { sub: 3, radial: 14 });
    const tongue = mesh(tongueGeo, tongueM, jawG); tongue.castShadow = false;
    // drool: 5 glossy strings from the lower teeth, swinging; stain: 4 drips from the lower lip + 1 on the chin (a hanging group swings in the world frame)
    const hangers = [];
    const hanger = (parent, org, len0, r, mat, hi) => { const g = new THREE.Group(); g.position.set(...org); parent.add(g); const s = mesh(new THREE.CylinderGeometry(r, r * 0.8, 1, 8, 1, true), mat, g); s.geometry.translate(0, -0.5, 0); const dp = mesh(unitSphere(), mat, g); dp.scale.set(r * 1.9, r * 2.6, r * 1.9); const h = mesh(unitSphere(), glossM, g); h.scale.setScalar(r * 0.55); [s, dp, h].forEach((o) => { o.castShadow = false; o.userData.noOutline = true; }); const hh = { g, s, dp, h, len0, r }; hangers.push(hh); return hh; };
    const DROOLS = [[0, 1], [1, 1], [2, 5], [3, 6], [4, 7]], droolList = [], stainList = [];
    { const lows = TOOTH_LIST.filter((T) => !T.up && T.cls === "F"), lens = [0.12, 0.26, 0.08, 0.20, 0.15];
      lows.forEach((T, i) => { const x = T.side * (rowAt(T.z, JSEC).w + 0.004); droolList.push(hanger(jawG, [x - J0[0], LIP(T.z) - 0.018 - J0[1], T.z - J0[2]], lens[i], 0.003, droolM)); });
      [[0.10, 1.60, 0.040], [-0.12, 1.50, 0.090], [0.15, 1.36, 0.060], [-0.15, 1.28, 0.070]].forEach(([x, z, L]) => { const w = rowAt(z, JSEC).w; stainList.push(hanger(jawG, [Math.sign(x) * (w + 0.002) - J0[0], LIP(z) - 0.02 - J0[1], z - J0[2]], L, 0.0045, juiceM)); });
      const chin = mesh(unitSphere(), juiceM, jawG, 0, 0.866 - J0[1], 1.715 - J0[2]); chin.scale.set(0.017, 0.022, 0.014); chin.userData.noOutline = true; stainList.push({ chin }); }
    // breath puffs: 6 cel puffs
    const puffG = new THREE.Group(); root.add(puffG);
    const puffs = Array.from({ length: 6 }, (_, k) => { const m = new THREE.MeshBasicMaterial({ color: C.puff, transparent: true, depthWrite: false }); m.userData.noOutline = true; const o = steam(new THREE.Mesh(unitSphere(), m)); puffG.add(o); return o; });

    // ---- the mane: 46 locks (frames: head for crown + ruff, shoulders for the rest), 4 braids, 16 gold beads, 6 turquoise ring beads
    const LOCKS = makeLocks(), ruffBeads = [];
    for (const k of LOCKS) {
      const parent = k.cls === "shoulder" ? shldG : maneG, org = k.cls === "shoulder" ? [0, 1.2, 0.40] : A0, pts = lockPts(k.R, k.h, k.D, k.drop, k.L, k.wob, k.sw).map((p) => [p[0] - org[0], p[1] - org[1], p[2] - org[2]]);
      const o = mesh(taperTube(pts, k.r0, k.r0 * 0.12, 8, 12, 0.85, 0.5), lockM[`${k.strands}${k.dusty}`], parent); o.castShadow = false;
      const at = (t) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => V3(p))); return c.getPointAt(t); };
      if (k.knot) { const p = at(0.55), kn = mesh(unitSphere(), knotM, parent, p.x, p.y, p.z); kn.scale.setScalar(0.02); kn.castShadow = false; }
      if (k.beaded) for (const t of [0.34, 0.62]) { const p = at(t), b = mesh(new THREE.TorusGeometry(0.02, 0.0075, 8, 14), turqM, parent, p.x, p.y, p.z); b.rotation.x = Math.PI / 2; b.castShadow = false; ruffBeads.push(b); }
    }
    const strandM = [S.m(C.mane, { roughness: 0.8 }), S.m("#93602f", { roughness: 0.8 }), S.m("#6a3d1e", { roughness: 0.8 })];
    const braids = BRAIDS.map(([x, len, n], bi) => {
      const g = new THREE.Group(); g.position.set(x - A0[0], 1.20 - A0[1], 0.96 - A0[2]); maneG.add(g);
      const axis = (t) => [x * 0.06 * t, -len * t, 0.004 * Math.sin(t * 3)], P = n / 3;   // n crossings drawn = n / 3 periods of the three-strand plait
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a0 = axis(t), ph = TAU * P * t + (k * TAU) / 3, A = 0.0125 * Math.min(1, t * 8); pts.push([a0[0] + A * Math.sin(ph), a0[1], a0[2] + A * Math.cos(ph)]); } const o = mesh(taperTube(pts, 0.0125, 0.0105, 6, 60, 1), strandM[k], g); o.castShadow = false; }
      [0.38, 0.62, 0.84].forEach((f, k) => { const a0 = axis(f), b = mesh(new THREE.SphereGeometry(0.035, 16, 12), beadM[(bi + k) % 4], g, a0[0], a0[1], a0[2]); b.rotation.y = rnd(bi * 5 + k) * TAU; });
      const td = new THREE.LatheGeometry([[0, -0.115], [0.016, -0.100], [0.036, -0.075], [0.045, -0.05], [0.040, -0.026], [0.020, -0.004], [0, 0.0]].map(([r, y]) => new THREE.Vector2(r, y)), 18), a1 = axis(1), tdm = mesh(td, beadM[(bi + 3) % 4], g, a1[0], a1[1] - 0.01, 0);
      const dot = mesh(unitSphere(), lapisM, tdm, 0, -0.055, 0.040); dot.scale.setScalar(0.013);   // the LAPIS dot on the teardrop end bead
      return { g, ph: bi * 1.7 };
    });
    const nodes = { ticks };

    const sec = new Array(NS);
    return {
      grip: 0, mouth,
      apply(ps, t) {
        const tt = t ?? 0, Z = solve(ps, tt), g = (k, d = 0) => ps[k] ?? P.spec?.[k] ?? d;
        const br = clamp(g("breath")), hv = 0.02 * Math.sin(TAU * (0.5 + 0.5 * br) * tt), sl = Z.W[3], lk = clamp(g("lick")), wag = clamp(g("wag")), psi = rad(20) * wag * Math.sin(TAU * 1.4 * tt);
        const chew = Z.chewC > 0 ? Math.sin(Math.PI * (Z.chewC % 1)) ** 2 : 0, kf = 1 - 0.38 * sl, af = -0.146 * sl;
        // ---- the skin rows
        SEC.forEach((r, i) => {
          let top = r.top, bot = r.bot, hw = r.hw, dn = r.dn;
          if (sl > 0 && r.sh < 1) { top = kf * top + af; bot = kf * bot + af; dn *= kf; if (i >= I_BODY && i < I_NECK - 6) hw *= 1 + 0.12 * sl; }   // flat and sulking: the body is squashed to 62 % about the floor, the belly 12 % wider
          if (i >= I_BODY && i < I_NECK - 4) { const env = Math.sin(Math.PI * clamp((r.z + 1.1) / 1.35)); hw += hv * env; dn += hv * env * 0.5; }
          if (i >= I_HEAD && i < I_HEAD + 6) hw += 0.035 * chew * Math.sin(Math.PI * (i - I_HEAD + 0.5) / 6);
          const cy = bot + dn; let c0 = [0, cy, r.z];   // (rows are in stand coordinates, then placed)
          if (i < 4 && psi) { const v = V3(c0).sub(V3(TR0)).applyAxisAngle(Y_AXIS, psi).add(V3(TR0)); c0 = [v.x, v.y, v.z]; }
          const p = r.sh <= 0 ? Z.place(c0) : r.sh >= 1 ? Z.headPlace(c0) : Z.place(c0).lerp(Z.headPlace(c0), r.sh);
          sec[i] = mkSec([p.x, p.y, p.z], hw, top - cy, dn, r.n);
        });
        bodyGeo.userData.set(sec); trunk.userData.cores = sec;
        bodyG.position.copy(Z.o).sub(V3(PV0).applyQuaternion(Z.q)).add(V3([0, af, 0]).applyQuaternion(Z.q)); bodyG.quaternion.copy(Z.q); bodyG.scale.set(1, kf, 1);
        tailG.position.copy(Z.place(TR0)); tailG.quaternion.copy(Z.q).multiply(qY(psi));
        headG.position.copy(Z.tH); headG.quaternion.copy(Z.Qh);
        jawG.rotation.set(rad(Z.gape), 0, 0); jawG.position.set(J0[0] + 0.025 * Z.chewS * (Z.chewC > 0 ? 1 : 0), J0[1], J0[2]);
        // ---- eyes
        const lids = clamp(g("lids", 0.25) + 0.35 * sl + clamp(g("blink"))), glow = clamp(g("glow"), 0, 1.2);
        eyeM.emissiveIntensity = 0.12 + 0.9 * glow;
        for (const e of eyes) { e.lidP.rotation.x = rad(35 + 140 * clamp(lids)); e.halo.material.opacity = clamp(glow) * 0.9; e.halo.scale.setScalar(0.12 * clamp(glow)); e.halo.visible = glow > 0.02; e.brow.rotation.z = -e.s * rad(12) * sl; }
        // ---- the mane and the braids: they hang from the head and hang on (a pure function has no history: they follow 60 % of the turn and swing on t)
        const mq = new THREE.Quaternion().slerp(Z.Q, 0.6).multiply(qZ(0.03 * Math.sin(TAU * 0.45 * tt) * (0.4 + Math.abs(Z.yaw) / 55))).multiply(qX(0.02 * Math.sin(TAU * 0.37 * tt + 1)));
        maneG.position.copy(Z.Aw); maneG.position.y -= 0.04 * sl; maneG.quaternion.copy(mq);
        braids.forEach((b, i) => { b.g.rotation.set(0.05 * Math.sin(TAU * 0.6 * tt + b.ph) + 0.002 * Z.yaw, 0, 0.06 * Math.sin(TAU * 0.5 * tt + b.ph + 1) - 0.0035 * Z.yaw); });
        const shq = new THREE.Quaternion().slerp(Z.q, 0.5), sp = Z.place([S0[0], S0[1] * kf + af, S0[2]]); shldG.position.copy(sp); shldG.position.y -= 0.04 * sl; shldG.quaternion.copy(shq);
        // ---- legs: lofts, paws, fur ticks
        legs.forEach((l, i) => {
          const d = Z.legs[i]; l.geo.userData.set(d.pts.map((p, k) => mkSec(p, ...l.rows[k], 2.6))); l.pg.position.set(...d.fo); l.pg.quaternion.copy(d.fq);
        });
        ticks.forEach((tk, si) => {
          const d = Z.legs[si], pos = tk.g.attributes.position.array, curve = new THREE.CatmullRomCurve3(d.pts.slice(1).map((p) => V3(p))), P0 = new THREE.Vector3(), T0 = new THREE.Vector3();
          for (let i = 0; i < tk.N; i++) {
            const u = 0.08 + 0.84 * ((i + rnd(i * 3 + si)) / tk.N), side = i % 2 ? 1 : -1; curve.getPointAt(u, P0); curve.getTangentAt(u, T0);
            const r = 0.12 - 0.03 * u, w = V3(nrm3([T0.y, -T0.x, 0])).multiplyScalar(0); const out = V3([side, 0, 0]);
            const base = P0.clone().addScaledVector(out, r * 0.96), len = 0.035 + 0.02 * rnd(i + 11 + si * 7), tip = base.clone().addScaledVector(out, 0.012).addScaledVector(T0, len * 0.9).add(V3([0, 0, -0.012]));
            const b1 = base.clone().addScaledVector(T0, -0.007), b2 = base.clone().addScaledVector(T0, 0.007);
            pos.set([b1.x, b1.y, b1.z, b2.x, b2.y, b2.z, tip.x, tip.y, tip.z], i * 9);
          }
          tk.g.attributes.position.needsUpdate = true; tk.g.computeVertexNormals(); tk.g.computeBoundingSphere();
        });
        // ---- the tongue: at rest on the jaw floor; the lick pushes the tip out of the front and along the upper lip, left corner -> right corner -> back in
        { const rest = Array.from({ length: TN }, (_, i) => [0, LIP(1.0 + i * 0.0486) - 0.002, 1.0 + i * 0.0486]);
          let pts = rest;
          if (lk > 0.001 && lk < 0.999) {
            const a = clamp(Math.min(lk / 0.06, (1 - lk) / 0.06)), out = (lk < 0.2) ? sstep(lk / 0.2) : lk > 0.8 ? 1 - sstep((lk - 0.8) / 0.2) : 1, pp = lk < 0.2 ? -1 : lk > 0.8 ? 1 : -1 + 2 * sstep((lk - 0.2) / 0.6);
            const ap = Math.abs(pp), sArc = 0.22 * ap * out, tipP = (s, f) => { const q = UPLINE(s), nx = q[0] + 0.0001, nz = q[1] - 1.55, nl = Math.hypot(nx, nz), off = 0.012 + 0.17 * (1 - ap) * out * f; return [(pp <= 0 ? 1 : -1) * (q[0] * 1.05 + (nx / nl) * off), 0.956 + 0.012 * f, q[1] + 0.004 + (nz / nl) * off]; };
            const path = [[0, 0.950, 1.50], [0, 0.953, 1.66], [0, 0.956, 1.745]]; const n = 6; for (let k = 1; k <= n; k++) path.push(tipP(0.002 + (sArc * k) / n, k / n));
            const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
            const L0 = cum[cum.length - 1], lick = Array.from({ length: TN }, (_, i) => { const d = (i / (TN - 1)) * L0; let j = 1; while (j < path.length - 1 && cum[j] < d) j++; const f = clamp((d - cum[j - 1]) / (cum[j] - cum[j - 1] || 1)); return mix3(path[j - 1], path[j], f); });
            pts = rest.map((p, i) => mix3(p, lick[i], a));
          }
          tongueGeo.userData.set(pts.map((p, i) => mkSec([p[0] - J0[0], p[1] - J0[1], p[2] - J0[2]], tongueW[i], 0.014, 0.012, 2.4))); }
        // ---- drool + stain strings: hang in the world whatever the pose (the group undoes the jaw's turn), swing on t
        const jawQ = Z.Qh.clone().multiply(qX(rad(Z.gape))), jinv = jawQ.clone().invert(), dr = clamp(g("drool", 0.5)), stn = clamp(g("stain"));
        const hang = (h, amt, k) => { h.g.visible = amt > 0.01; h.g.quaternion.copy(jinv).multiply(qZ(0.09 * Math.sin(TAU * 0.7 * tt + k * 1.3))).multiply(qX(0.06 * Math.sin(TAU * 0.55 * tt + k))); const L = Math.max(0.001, h.len0 * amt); h.s.scale.set(1, L, 1); h.dp.position.y = -L - h.r * 1.2; h.h.position.set(h.r * 0.5, -L - h.r * 0.7, h.r * 1.2); };
        droolList.forEach((h, k) => hang(h, dr, k)); stainList.forEach((h, k) => { if (h.chin) { h.chin.visible = stn > 0.02; h.chin.scale.set(0.017 * stn, 0.022 * stn, 0.014 * stn); } else hang(h, stn, k + 5); });
        stainTips.forEach((c) => { c.visible = stn > 0.02; });
        // ---- breath: 6 cel puffs at 0.35 m from the mouth, 0.25-0.4 m across, reach 0.9 m, only with the jaw open past 0.3
        { const gb = br * sstep((Z.jw - 0.3) / 0.15), mp = Z.headPlace(V3([0, 0.95, 1.72])), fwd = V3([0, 0, 1]).applyQuaternion(Z.Q);
          puffs.forEach((o, k) => { const ph = (((tt * 0.9 + k / 6) % 1) + 1) % 1, d = 0.35 + 0.55 * ph, r = (0.125 + 0.075 * ((k * 5) % 3) / 2) * (0.7 + 0.5 * ph);
            o.visible = gb > 0.02; o.position.copy(mp).addScaledVector(fwd, d); o.position.y += 0.25 * ph + 0.04 * Math.sin(k * 2.1); o.position.x += 0.07 * Math.sin(k * 3.3 + ph * 2); o.scale.setScalar(r); o.material.opacity = gb * 0.85 * (1 - ph) ** 0.8; }); }
      },
    };
  },
};
export const HEART_MONSTER_GRIPS = {};
// the counts of DESIGN section 12 for this piece, from the data (the bench prints them; importable in Node)
export function monsterCounts() {
  const T = TOOTH_LIST, by = (f) => T.filter(f).length, rows = {};
  for (const [rk, R] of Object.entries(TEETH)) { const cls = R.row.map((r) => r[1]), seq = []; let run = 1, three = 0; for (let i = 1; i < cls.length; i++) { const adj = R.row[i][0] - R.row[i - 1][0] === 1; if (adj && cls[i] === cls[i - 1]) { run++; if (run >= 3) three++; } else run = 1; } rows[rk] = { teeth: cls.length, slots: R.slots, gaps: R.slots - cls.length, threeInARow: three }; }
  const L = makeLocks();
  return {
    teeth: { total: T.length, fangs: by((t) => t.cls === "F"), mid: by((t) => t.cls === "M"), stubs: by((t) => t.cls === "S"), upper: by((t) => t.up), lower: by((t) => !t.up), chipped: by((t) => t.fl.includes("c")), snaggle: by((t) => t.fl.includes("s")), cracked: by((t) => t.fl.includes("k")), juiceTips: by((t) => t.fl.includes("t")), upperOverLips: by((t) => t.up && t.ovl), lowerOverLips: by((t) => !t.up && t.ovl), maxLean: Math.max(...T.filter((t) => !t.fl.includes("s")).map((t) => Math.abs(t.lean))), maxFore: Math.max(...T.map((t) => Math.abs(t.fore))), rows },
    locks: { total: L.length, crown: L.filter((k) => k.cls === "crown").length, ruff: L.filter((k) => k.cls === "ruff").length, shoulder: L.filter((k) => k.cls === "shoulder").length, strands: [3, 4, 5].map((s) => L.filter((k) => k.strands === s).length), dusty: L.filter((k) => k.dusty).length, knots: L.filter((k) => k.knot).length, ringBeadLocks: L.filter((k) => k.beaded).length, ringBeads: L.filter((k) => k.beaded).length * 2, thickCm: [Math.min(...L.map((k) => k.r0 * 200)), Math.max(...L.map((k) => k.r0 * 200))].map((v) => Math.round(v * 10) / 10) },
    braids: { count: BRAIDS.length, goldBeads: BRAIDS.length * 4, crossings: BRAIDS.map((b) => b[2]), lengths: BRAIDS.map((b) => b[1]) },
    scars: 5, claws: { front: 8, hind: 8, perPaw: CLAW_KINDS },
  };
}
