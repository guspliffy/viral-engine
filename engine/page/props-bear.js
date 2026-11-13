import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

// Props for Fight, Flight or Freeze EP02 "Bear in the camp" (12 Nov 2026; storyboards/series/fight-flight-freeze/02-bear-camp/BEAR-DESIGN.md
// and BRIEF-T2.md): the black bear, ONE kind, `bear`. A REAL adult male American black bear (Ursus americanus, about 400 kg) as a
// natural-history illustrator would draw it, never gory: ONE lofted skin from the tail stub to the nose, one loft per leg, one rigid
// loft per paw, painted fur skins, real small eyes, five modelled claws per paw. Metres, degrees, every number is at scale 1.
// Built like the sabretooth in props-iceage.js (the joints are worked out in apply() so neck, legs and tail bend as one skin).
// Every prop is a pure function of its params and the clip time (breath reads `t`; no random numbers, no clock).
//
//   bear        Ursus americanus, adult male: 2.0 long (rump z -0.96 to nose z +1.04; plus a 0.10 m stub tail), 1.08 at the shoulder,
//               1.10 at the rump (the rump is the high point, NOT the shoulder), 0.76 wide. Origin: on the ground between the feet,
//               facing +z, +x = the bear's left.
//               Side profile, back to front: a high round rump (1.10), a shallow dip mid back (1.05), a LOW soft shoulder hump (1.08),
//               a short thick neck carried level, the head carried at or just under the back line (crown 1.04, ear tips 1.12). The face
//               is one straight "Roman" line from the forehead to the nose tip (no dish, no stop). Deep barrel (belly 0.38). Tall
//               rounded ears set wide on the skull. Legs: one loft each; front = shoulder -> elbow (back) -> wrist (low) -> broad flat
//               paw, toes turned IN 12 deg; hind = hip -> knee (forward) -> heel ON THE GROUND -> long flat foot (plantigrade). Five
//               curved claws per paw (front 4.5 cm, hind 2.8 cm). Coat: glossy warm black #17130f with painted grey-brown sheen bands,
//               about 90 short fur locks on the outline; tan-brown muzzle #b07d45; black wet nose pad; NO chest blaze (the panels show
//               none). Eyes r 0.019, dark brown, close-set, a white catch-light; no visible sclera.
//               Where the head is (scale 1, rest): eyes at x +-0.09, y 0.95, z 0.885; mouth line y 0.775 (front teeth z 1.00); nose
//               tip (0, 0.83, 1.04); jaw hinge (0, 0.80, 0.76); the head turns about (0, 0.90, 0.62). The body pitches about the
//               hips (0, 0.80, -0.76).
//               gait      count of walk cycles, a real bear walk (lateral sequence: left hind, left front, right hind, right front, a
//                         quarter cycle apart); each foot is planted 62 % of a cycle and slides back 0.74 m: no sliding at 1.2 m per
//                         cycle at scale 1; the lifted paw rises 0.10 m; the body dips up to 3 cm and rolls 2 deg. 0 = standing; the
//                         walk eases in over the first 0.15 cycle (a whole number above 0 is a walk pose: tween back to 0 to stand)
//               bound     0..1 the charge: 0 the walk, 1 a rocking gallop (front pair lands together, hind pair half a cycle later
//                         and lands AHEAD of where the fronts left), sweep 1.5 times as far (1.8 m per cycle), body pitches +-7 deg,
//                         head low (atlas drops 0.10, head 10 deg down)
//               rear      0..1 stands up on the hind legs: the body pitches up 82 deg about the hips, hips rise 0.07; front paws leave
//                         the ground by rear 0.2. 0.5 = the REACH (body 41 deg, palms flat on a surface at y 1.29, z 0.80..0.98: over
//                         a tent); 1 = upright, crown 2.42, ear tips 2.49, both paws HIGH (claw tips 2.73), claws spread. The hind feet
//                         walk a shorter stride while reared (0.39 m of sweep: 0.63 m per cycle, the shuffle)
//               pawL/pawR -2..2 (0) shifts that arm along HANG -> REACH -> HIGH (pose index = clamp(2*rear + paw, 0, 2)): at rear 1,
//                         paw -1 = reaching forward at shoulder height, paw -2 = hanging in front of the chest
//               swipe     0..1 ONE stroke of a front paw: 0 and 1 = the paw where it was, 0.25 wound up high and out, 0.5 the strike
//                         (arm straight, 0.26 m across the midline), 0.75 follow-through low. swipeSide +1 the left paw (+x), -1 the
//                         right (default +1). Works on all fours (strike at y 0.76, z 1.06) and reared (rear 0.5: y 1.49, z 0.83: a windscreen)
//               climb     0..1 hugs a vertical trunk of radius 0.35 whose AXIS is at x 0, z +0.50 of the prop: the body goes vertical
//                         (86 deg) and moves 0.41 forward, belly 3 cm from the bark, fore palms on the bark at y 2.24, hind soles at
//                         y 0.62..0.86, knees and elbows splayed. Lowest point y 0.44 (the heels)
//               climbStep count of climbing cycles (diagonal pairs reach and pull): move the prop up 0.60 m per cycle; eases in as gait
//               jaw       0..1 the lower jaw drops 42 deg (0.15 m between the front teeth at 1)
//               snarl     0..1 the upper lip curls back off the canines and incisors, the nose bridge wrinkles, the nose lifts
//               ears      -1 pinned flat back .. 0 relaxed .. 1 pricked forward
//               sniff     count of sniffs: a whole number is rest; in between the nose pad lifts and the nostrils flare
//               claws     0..1 toes spread (also driven by rear and swipe: the larger wins)
//               brow, squint, blink, lookX/lookY, headY/headP, breath: as the shared params of props-iceage.js (brow -1 angry, squint 0..1
//                         heavy lids, blink 1 shut, lookX/lookY -1..1 the pupils, headY/headP degrees, + turns to the left / nods down)
//               tail      none: the 0.10 m stub does not move (propState's default `tail: 1` has no effect on the bear)
//               mouth     the returned object has `mouth`: an empty Group "mouthHold" in the head frame between the front teeth (below)
// propState has NO default for gait, bound, rear, pawL, pawR, swipe, swipeSide, climb, climbStep, snarl, ears, sniff, claws: seed each
// with a dur-0 `set` at time 0 (jaw, squint, blink, brow, lookX, lookY, headY, headP and breath have defaults, all 0). Everything is
// solid for the checks. No glow, no drool, no halo on this prop. Nothing on it is held by a hand (no GRIPS).
//
// MOUTH HOLD (the director's tool): the engine's `carry` follows only a prop's origin (no rear / head turn), so it cannot follow a mouth.
// Use the pure function bearMouth(params, { x, y, z, rot, scale }) -> world [x, y, z] of the point just under the tips of the upper
// incisors, on the midline: it turns with the head (NOT with the lower jaw). Call it from the clip generator for the bear's params at
// the time you need and tween / set the held prop there (importable in Node: no DOM). params = the bear's params at that time
// (gait, rear, climb, headP, headY ... as in the prop state; any missing is 0); x, y, z, rot (degrees), scale = the bear prop's own.
// +z out of the mouth along the muzzle, +x the bear's left, +y up into the upper teeth. The gap between the front teeth is 0.15 * jaw m:
// jaw = thickness / 0.15 (sleeping bag cloth 3 cm bunched: jaw 0.2; a pot rim or wall: jaw 0.15; a 0.15 m pot body: jaw 1, wedged).
// World position at rest, scale 1: (0, 0.755, 0.99). bearMouth does not know the walking dip of the body (up to 3 cm).

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);
const GLOW = new THREE.Color("#b8ff9a");

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map();   // every drawn texture is made once per page and shared (they are pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function palette() {   // the same palette contract as the other animals (looks.js copies a standard material's colours once)
  const list = [];
  const reg = (m) => { m.userData.c0 = m.color.clone(); list.push(m); return m; };
  return {
    m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: GLOW, emissiveIntensity: 0, ...o })),
    b: (color) => reg(new THREE.MeshBasicMaterial({ color })),
  };
}
const sstep = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c, a = 1, j = 0) => `rgba(${c.map((v) => Math.round(clamp(v + j, 0, 255))).join(",")},${a})`;
function ramp(stops, t) {
  const s = stops.map(([k, h]) => [k, rgbOf(h)]);
  if (t <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) if (t <= s[i][0]) return mixRGB(s[i - 1][1], s[i][1], (t - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1));
  return s[s.length - 1][1];
}
const lerpA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AXIS, a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);

// 3D two-bone IK with a pole hint: the middle joint between h and f ([x, y, z]); it lies in the plane of h, f and `pole` on the pole's side.
// The foot is never farther than 0.9995 of the leg (callers dip the body first so it is reached).
function ik3(h, f, L1, L2, pole) {
  const d = [f[0] - h[0], f[1] - h[1], f[2] - h[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = [d[0] / dl, d[1] / dl, d[2] / dl];
  const dd = clamp(dl, Math.abs(L1 - L2) + 0.01, (L1 + L2) * 0.9995), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2];
  let p = [pole[0] - pd * u[0], pole[1] - pd * u[1], pole[2] - pd * u[2]]; const pl = Math.hypot(p[0], p[1], p[2]);
  p = pl < 1e-6 ? [0, 0, 1] : [p[0] / pl, p[1] / pl, p[2] / pl];
  return [h[0] + u[0] * a + p[0] * hh, h[1] + u[1] * a + p[1] * hh, h[2] + u[2] * a + p[2] * hh];
}
// one foot on its walk cycle: f the phase 0..1; stance (a share `duty` of it) sweeps the planted foot back by `S` metres at a constant
// speed, swing carries it forward over the rest, lifted by `H` at the top. Returns [forward offset, lift].
function footPath(f, S, duty, H) {
  if (f < duty) return [S * (0.5 - f / duty), 0];
  const u = (f - duty) / (1 - duty);
  return [S * (-0.5 + sstep(u)), H * Math.sin(Math.PI * u)];
}
// a rotation taking local z to `zAxis` and local y to the nearest direction to `yAxis`
function basisQ(zAxis, yAxis) {
  const z = new THREE.Vector3(...zAxis).normalize(), y = new THREE.Vector3(...yAxis);
  y.addScaledVector(z, -y.dot(z)); if (y.lengthSq() < 1e-9) y.set(0, 1, 0).addScaledVector(z, -z.y);
  y.normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// ---------------------------------------------------------------- the numbers (BEAR-DESIGN.md section 2, 3, 7, 8)
// body loft rows: [z, centre y, half width, up, down, n, share of the head's turn]
const NB = [
  [-0.96, 0.80, 0.10, 0.10, 0.12, 2.2, 0], [-0.88, 0.78, 0.24, 0.24, 0.24, 2.2, 0], [-0.74, 0.76, 0.32, 0.33, 0.30, 2.3, 0], [-0.58, 0.76, 0.35, 0.34, 0.32, 2.3, 0],
  [-0.38, 0.74, 0.37, 0.34, 0.34, 2.3, 0], [-0.15, 0.72, 0.38, 0.33, 0.34, 2.3, 0], [0.08, 0.72, 0.37, 0.34, 0.34, 2.3, 0], [0.28, 0.74, 0.36, 0.34, 0.34, 2.3, 0],
  [0.42, 0.76, 0.33, 0.30, 0.32, 2.3, 0.12], [0.54, 0.80, 0.27, 0.24, 0.26, 2.3, 0.38], [0.64, 0.84, 0.23, 0.21, 0.22, 2.4, 0.70], [0.72, 0.86, 0.21, 0.18, 0.20, 2.5, 1],
  [0.80, 0.86, 0.20, 0.17, 0.17, 2.5, 1], [0.87, 0.875, 0.155, 0.11, 0.115, 2.5, 1], [0.93, 0.86, 0.10, 0.085, 0.09, 2.4, 1], [0.98, 0.843, 0.09, 0.068, 0.068, 2.4, 1],
  [1.02, 0.835, 0.075, 0.05, 0.05, 2.4, 1], [1.04, 0.83, 0.04, 0.028, 0.03, 2.4, 1],
];
const TAILS = [[0, 0.74, -1.06, 0.02], [0, 0.79, -1.03, 0.035], [0, 0.82, -0.99, 0.05]];
const NT = TAILS.length, NN = NT + NB.length, uOf = (i) => i / (NN - 1);
const PV0 = [0, 0.80, -0.76], HP0 = [0, 0.90, 0.62], JH = [0, 0.80, 0.76], MOUTH0 = [0, 0.755, 0.99];
const rel = (p) => [p[0] - HP0[0], p[1] - HP0[1], p[2] - HP0[2]];
const FRONT = { hx: 0.21, hy: 0.80, hz: 0.30, L1: 0.40, L2: 0.37, fz: 0.32, fh: 0.10 };
const HIND = { hx: 0.20, hy: 0.80, hz: -0.76, L1: 0.42, L2: 0.38, heelZ: -0.80, fh: 0.09 };
// each leg: key, side, front?, walk phase, bound phase, climb phase
const LEGS = [
  { k: "fl", s: 1, f: true, w: 0.25, b: 0.0, c: 0 }, { k: "fr", s: -1, f: true, w: 0.75, b: 0.10, c: 0.5 },
  { k: "bl", s: 1, f: false, w: 0.0, b: 0.50, c: 0.5 }, { k: "br", s: -1, f: false, w: 0.50, b: 0.58, c: 0 },
];
// arm poses [phiH, phiF, wr, ex, wx] (degrees; metres sideways, + outward)
const ARM = { hang: [15, 55, -25, 0.06, -0.02], reach: [69, 84, 0, 0.08, 0.06], high: [132, 170, -25, 0.16, 0.26] };
const SWIPE = [[120, 175, -30, 0.22, 0.34], [80, 95, -15, 0.02, -0.26], [35, 60, 10, -0.02, -0.34]];   // A wind-up, B strike, C follow-through
const CLIMB = { pitch: 74, pv: [0, 0.90, -0.46], foreA: 66, foreY: 2.30, hindA: 50, hindY: 0.62 };   // leaning 16 deg off the trunk, chest on the bark
const BARK = { x: 0, z: 0.50, r: 0.35 };   // the climbed trunk's axis and radius, in the prop's frame
const barkAt = (s, a, off, y) => [s * (BARK.r + off) * Math.sin(a), y, BARK.z - (BARK.r + off) * Math.cos(a)];
const barkN = (s, a) => [s * Math.sin(a), 0, -Math.cos(a)];

// ---------------------------------------------------------------- the pose solver (pure: shared by apply() and bearMouth)
// Angles phi are in the y-z plane from straight DOWN (0) toward +z (90 = forward, 180 = up).
const dirYZ = (phi) => [0, -Math.cos(phi), Math.sin(phi)];
function armFromAngles(S, s, a) {
  const h = rad(a[0]), f = rad(a[1]), E = [S[0] + s * a[3], S[1] - 0.40 * Math.cos(h), S[2] + 0.40 * Math.sin(h)];
  return { E, W: [S[0] + s * a[4], E[1] - 0.37 * Math.cos(f), E[2] + 0.37 * Math.sin(f)], p: dirYZ(f + rad(a[2])) };
}
function anglesOfArm(S, s, A) {
  const ph = Math.atan2(A.E[2] - S[2], -(A.E[1] - S[1])), pf = Math.atan2(A.W[2] - A.E[2], -(A.W[1] - A.E[1])), pp = Math.atan2(A.p[2], -A.p[1]);
  return [deg(ph), deg(pf), deg(pp - pf), (A.E[0] - S[0]) * s, (A.W[0] - S[0]) * s];
}
function solve(ps) {
  const g = ps.gait ?? 0, bd = clamp(ps.bound ?? 0), rr = clamp(ps.rear ?? 0), cl = clamp(ps.climb ?? 0), ck = ps.climbStep ?? 0;
  const sr = sstep(rr), sc = sstep(cl), wk = sstep(g / 0.15) * (1 - sc), wc = sstep(ck / 0.15) * sc;
  const swipe = clamp(ps.swipe ?? 0), swS = (ps.swipeSide ?? 1) >= 0 ? 1 : -1, bell = Math.sin(Math.PI * swipe), swAct = sstep(swipe / 0.05) * (1 - sstep((swipe - 0.95) / 0.05));
  const sf = (((ps.sniff ?? 0) % 1) + 1) % 1, sk = Math.sin(Math.PI * sf) ** 2;
  // ---- trunk: pitch about the hips (negative = chest up), the hips move for the rear and the climb, roll and shift
  const thDeg = -(82 * sr) * (1 - sc) - CLIMB.pitch * sc + 7 * bd * Math.sin(TAU * (g + 0.15)) * wk * (1 - sr) * (1 - sc), th = rad(thDeg);
  const PV = mix3([0, 0.80 + 0.07 * sr, -0.76 + 0.06 * sr], CLIMB.pv, sc);
  const valL = Math.cos(TAU * (g - 0.06)) * wk * (1 - sr);
  let rollD = -2 * valL + 5 * swS * bell, shx = 0.02 * valL - 0.04 * swS * bell;
  const cs = Math.cos(TAU * (ck - 0.3)) * wc; rollD += -4 * cs; shx += -0.03 * cs;
  const q = qX(th).multiply(qZ(rad(rollD)));
  const o0 = new THREE.Vector3(PV[0] + shx, PV[1], PV[2]).sub(new THREE.Vector3(...PV0).applyQuaternion(q));
  const tmp = new THREE.Vector3();
  const place0 = (p) => { tmp.set(p[0], p[1], p[2]).applyQuaternion(q).add(o0); return [tmp.x, tmp.y, tmp.z]; };
  // ---- feet on the walk cycle (the bound sweeps farther, the reared hind feet shuffle a shorter stride)
  const S0 = 0.74 * (1 + 0.5 * bd), duty = 0.62 - 0.17 * bd, Hh = 0.10 * (1 + 0.8 * bd), gF = (1 - sstep(rr / 0.2)) * (1 - sc);
  const L = LEGS.map((l) => {
    const f = ((((g + l.w + (l.b - l.w) * bd) % 1) + 1) % 1), [dz, lf] = footPath(f, l.f ? S0 : S0 * (1 - 0.47 * sr), duty, Hh);
    const dzz = dz * wk, lift = lf * wk, hip = l.f ? [l.s * FRONT.hx, FRONT.hy, FRONT.hz] : [l.s * HIND.hx, HIND.hy, HIND.hz];
    const tgt = l.f ? [l.s * FRONT.hx, lift + FRONT.fh, FRONT.fz + dzz] : [l.s * HIND.hx, lift + HIND.fh, HIND.heelZ + dzz + 0.15 * bd];
    return { ...l, lift, tgt, hip };
  });
  // ---- the dip: the body drops so that every planted leg reaches its foot
  let dip = 0;
  for (const l of L) {
    const Hp = place0(l.hip), Lr = (l.f ? FRONT.L1 + FRONT.L2 : HIND.L1 + HIND.L2) * 0.997, hz = l.tgt[2] - Hp[2];
    dip = Math.min(dip, (l.tgt[1] + Math.sqrt(Math.max(0, Lr * Lr - hz * hz)) - Hp[1]) * (l.f ? gF : 1));
  }
  dip *= 1 - sc;
  const o = o0.clone(); o.y += dip;
  const place = (p) => { tmp.set(p[0], p[1], p[2]).applyQuaternion(q).add(o); return [tmp.x, tmp.y, tmp.z]; };
  // ---- the head: turns about the atlas; the neck rows follow by their share
  const K = 0.85 + (0.50 - 0.85) * sc;
  const hp = (ps.headP ?? 0) - K * thDeg + 10 * bd - 1.5 * sk, hy = (ps.headY ?? 0) - 8 * swS * bell;
  const hpEff = [0, 0.90 - 0.10 * bd, 0.62];
  const qHead = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(hp), rad(hy), 0, "YXZ"));
  // ---- the legs
  const legs = L.map((l) => {
    const s = l.s, pawP = (s > 0 ? ps.pawL : ps.pawR) ?? 0;
    if (l.f) {
      const Sh = place(l.hip), wrist = l.tgt;
      const Eg = ik3(Sh, wrist, FRONT.L1, FRONT.L2, [0, 0, -1]), phiG = rad(65 - 30 * clamp(l.lift / Hh)), Gp = dirYZ(phiG);
      const u = clamp(2 * rr + pawP, 0, 2), a = u < 1 ? lerpA(ARM.hang, ARM.reach, u) : lerpA(ARM.reach, ARM.high, u - 1), A = armFromAngles(Sh, s, a);
      const gw = gF;
      let arm = { E: mix3(A.E, Eg, gw), W: mix3(A.W, wrist, gw), p: nrm3(mix3(A.p, Gp, gw)) };
      let claws = Math.max(ps.claws ?? 0, 0.9 * sstep(u - 1)), yawW = gw;
      if (s === swS && swipe > 0 && swipe < 1) {   // one stroke: base -> A -> B -> C -> base, in joint angles
        const base = anglesOfArm(Sh, s, arm), keys = [base, ...SWIPE, base], t4 = swipe * 4, seg = Math.min(3, Math.floor(t4));
        arm = armFromAngles(Sh, s, lerpA(keys[seg], keys[seg + 1], sstep(t4 - seg))); claws = Math.max(claws, bell); yawW = gw * (1 - swAct);
      }
      const yaw = -s * rad(12) * yawW;
      const qy = qY(yaw), zP = new THREE.Vector3(...arm.p).applyQuaternion(qy), yP = new THREE.Vector3(0, arm.p[2], -arm.p[1]).applyQuaternion(qy);
      let W = arm.W, E = arm.E, fq = basisQ(zP.toArray(), yP.toArray());
      if (sc > 0) {   // the climb: fore wrist on the bark at 60 deg, palm on it, toes up, claws in
        const f = ((((ck + l.c) % 1) + 1) % 1), [dy, lf] = footPath(f, 0.36, 0.60, 0.06), a60 = rad(CLIMB.foreA), n = barkN(s, a60);
        const Wc = barkAt(s, a60, 0.07, CLIMB.foreY + dy * wc); Wc[0] += n[0] * lf * wc; Wc[2] += n[2] * lf * wc;
        const Ec = ik3(Sh, Wc, FRONT.L1, FRONT.L2, [s, -0.6, -0.3]);
        E = mix3(E, Ec, sc); W = mix3(W, Wc, sc); fq = fq.slerp(basisQ([0, 1, 0], n), sc);
      }
      const up = new THREE.Vector3(0, 0.09, 0.01).applyQuaternion(q), pad = [Sh[0] + up.x, Sh[1] + up.y, Sh[2] + up.z], dE = nrm3([W[0] - E[0], W[1] - E[1], W[2] - E[2]]);
      return { s, f: true, claws, fq, fo: W, pts: [pad, Sh, mix3(Sh, E, 0.5), E, mix3(E, W, 0.5), W, [W[0] + dE[0] * 0.03, W[1] + dE[1] * 0.03, W[2] + dE[2] * 0.03]] };
    }
    const Hp = place(l.hip), heel = l.tgt;
    const pitch = Math.min(rad(25), Math.asin(clamp(l.lift / 0.24)) * 0.95);
    let H = heel, fq = qY(s * rad(5 + 10 * sr)).multiply(qX(pitch)), pole = [0, 0, 1];
    if (sc > 0) {   // the climb: heel on the bark at 50 deg, sole flat on it, toes up
      const f = ((((ck + l.c) % 1) + 1) % 1), [dy, lf] = footPath(f, 0.36, 0.60, 0.06), a50 = rad(CLIMB.hindA), n = barkN(s, a50);
      const Hc = barkAt(s, a50, 0.10, CLIMB.hindY + dy * wc); Hc[0] += n[0] * lf * wc; Hc[2] += n[2] * lf * wc;
      H = mix3(heel, Hc, sc); fq = fq.slerp(basisQ([0, 1, 0], n), sc); pole = mix3(pole, [s, 0.3, 0.2], sc);
    }
    const Kn = ik3(Hp, H, HIND.L1, HIND.L2, pole), up = new THREE.Vector3(0, 0.09, 0).applyQuaternion(q), dK = nrm3([H[0] - Kn[0], H[1] - Kn[1], H[2] - Kn[2]]);
    return { s, f: false, claws: ps.claws ?? 0, fq, fo: H, pts: [[Hp[0] + up.x, Hp[1] + up.y, Hp[2] + up.z], Hp, mix3(Hp, Kn, 0.5), Kn, mix3(Kn, H, 0.5), [H[0] + dK[0] * 0.02, H[1] + dK[1] * 0.02, H[2] + dK[2] * 0.02]] };
  });
  const headPos = place(hpEff), qHeadW = q.clone().multiply(qHead);
  return { q, o, dip, th, hp, hy, hpEff, qHead, headPos, qHeadW, legs, sk, wk, sr, sc, wc, g, bd, swS, bell, Hh, duty, rollD };
}
// the point between the front teeth (BEAR-DESIGN.md section 9) in the world, for a bear prop at {x, y, z, rot, scale}
export function bearMouth(params = {}, at = {}) {
  const Z = solve(params), m = rel(MOUTH0), v = new THREE.Vector3(m[0], m[1], m[2]).applyQuaternion(Z.qHeadW).add(new THREE.Vector3(...Z.headPos));
  const sc = at.scale ?? 1, r = rad(at.rot ?? 0), c = Math.cos(r), s = Math.sin(r), x = v.x * sc, y = v.y * sc, z = v.z * sc;
  return [(at.x ?? 0) + x * c + z * s, (at.y ?? 0) + y, (at.z ?? 0) - x * s + z * c];
}

// ---------------------------------------------------------------- painted skins (each drawn once from the seeded rnd)
const FUR = "#17130f", SHAD = "#0c0a08", MIDT = "#2a231c", SH1 = "#5b5148", SH2 = "#8a8074", TAN = "#b07d45", INSIDE = "#6e2a30";
const rowU = (n) => (n + 2) / 20;   // table row n (1-based) -> u along the body canvas
// direction (unit, canvas px) and length of one hair stroke at canvas (x, y): by area, as the recipe
function hairAt(x, y, W, H, k) {
  const r = (x / W) * 20 - 2, d = Math.abs(y / H - 0.5) * 2, sy = y < H / 2 ? -1 : 1;
  let bx = -1, dy = 0.1, L = 14 + 12 * rnd(k + 3), lw = 1.6 + 0.8 * rnd(k + 5);
  if (r >= 12) { bx = -1; dy = d * 0.7; L = r < 13.6 && d > 0.15 && d < 0.75 ? 12 + 2 * rnd(k + 3) : 6 + 4 * rnd(k + 3); lw = 1.2; }
  else if (r >= 9.5) { bx = -1; dy = 0.3; L = 18 + 4 * rnd(k + 3); if (d > 0.7) { dy = 0.0; L = 26; } }
  else if (r >= 7) { if (r > 8) { bx = 0.2; dy = 1; } else { bx = -0.5; dy = 1; } L = 18 + 6 * rnd(k + 3); }
  else if (d < 0.3) { bx = -1; dy = 0.1; L = 22 + 4 * rnd(k + 3); }
  else if (d > 0.85) { bx = 0; dy = 1; L = 26; }
  else { bx = -1; dy = 0.45; L = 16 + 8 * rnd(k + 3); }
  const l = Math.hypot(bx, dy) || 1;
  return { ux: bx / l, uy: (sy * dy) / l, L, lw };
}
const bodyTex = () => once("bearBodyT2", () => cvs(1024, 512, (g, W, H) => {
  const stops = [[0, FUR], [0.5, "#1c1712"], [0.8, "#120f0c"], [1, SHAD]], mz = W * rowU(14.4);
  const gr = g.createLinearGradient(0, 0, 0, H); for (let i = 0; i <= 16; i++) { const k = i / 16; gr.addColorStop(k, css(ramp(stops, Math.abs(k - 0.5) * 2))); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.lineCap = "round";
  const cS = rgbOf(SHAD), cM = rgbOf(MIDT), c1 = rgbOf(SH1), c2 = rgbOf(SH2);
  // layered shag: tapered clumps
  for (let i = 0; i < 520; i++) {
    const x = rnd(i * 7 + 1) * W, y = rnd(i * 7 + 2) * H; if (x > mz) continue;
    const h = hairAt(x, y, W, H, i * 7), len = 34 + 22 * rnd(i * 7 + 4), wd = 9 + 5 * rnd(i * 7 + 5), px = -h.uy, py = h.ux;
    g.fillStyle = css(cS, 0.55); g.beginPath(); g.moveTo(x + px * wd / 2, y + py * wd / 2); g.lineTo(x - px * wd / 2, y - py * wd / 2); g.lineTo(x + h.ux * len, y + h.uy * len); g.closePath(); g.fill();
    g.fillStyle = css(cM, 0.6); g.beginPath(); g.moveTo(x + h.ux * len * 0.4 + px * wd * 0.28, y + h.uy * len * 0.4 + py * wd * 0.28); g.lineTo(x + h.ux * len * 0.4 - px * wd * 0.28, y + h.uy * len * 0.4 - py * wd * 0.28); g.lineTo(x + h.ux * len, y + h.uy * len); g.closePath(); g.fill();
  }
  // hair strokes
  for (let i = 0; i < 9000; i++) {
    const x = rnd(i * 5 + 11) * W, y = rnd(i * 5 + 12) * H; if (x > mz) continue;
    const h = hairAt(x, y, W, H, i * 5 + 100); g.strokeStyle = i % 2 ? css(cS, 0.45) : css(cM, 0.5); g.lineWidth = h.lw * (0.9 + 0.2 * rnd(i + 5)) + (h.lw > 1.5 ? 0.3 : 0);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + h.ux * h.L, y + h.uy * h.L); g.stroke();
  }
  // gloss: soft grey-brown bands on the crest and the upper flank only (d 0..0.08, 0.20..0.42), never on the belly
  const bands = [[0.04, 0.04], [0.31, 0.11]], gx = W * rowU(13);
  for (let i = 0; i < 2600; i++) {
    const [c, hw] = bands[i % 3 === 0 ? 0 : 1], d = Math.max(0, c + (rnd(i * 4 + 1) + rnd(i * 4 + 2) - 1) * hw), x = rnd(i * 4 + 3) * gx, y = H / 2 + (rnd(i * 4 + 4) < 0.5 ? -1 : 1) * d * H / 2;
    const h = hairAt(x, y, W, H, i * 4 + 5000), L = 16 + 14 * rnd(i + 3); g.strokeStyle = css(c1, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + h.ux * L, y + h.uy * L); g.stroke();
  }
  for (let i = 0; i < 420; i++) {
    const [c, hw] = bands[i % 3 === 0 ? 0 : 1], d = Math.max(0, c + (rnd(i * 4 + 7001) - 0.5) * hw * 0.6), x = rnd(i * 4 + 7002) * gx, y = H / 2 + (rnd(i * 4 + 7003) < 0.5 ? -1 : 1) * d * H / 2;
    const h = hairAt(x, y, W, H, i * 4 + 7004), L = 10 + 6 * rnd(i + 9); g.strokeStyle = css(c2, 0.35); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + h.ux * L, y + h.uy * L); g.stroke();
  }
  // the tan muzzle: a soft uneven edge from the top of row 14.6 down and back to the mouth corner at row 13.6
  const nz = (y, k) => 0.5 + 0.5 * (0.6 * Math.sin(y * 0.09 + rnd(k) * 6) + 0.4 * Math.sin(y * 0.31 + rnd(k + 5) * 6));
  for (let y = 0; y < H; y += 2) {
    const d = Math.abs(y / H - 0.5) * 2, b = W * rowU(15.15) + (W * rowU(14.75) - W * rowU(15.15)) * sstep(d / 0.9) + (nz(y, 3) - 0.5) * 12;
    const gg = g.createLinearGradient(b - 14, 0, b + 12, 0); gg.addColorStop(0, "rgba(110,75,42,0)"); gg.addColorStop(0.45, "rgba(110,75,42,0.95)"); gg.addColorStop(1, css(rgbOf(TAN), 1));
    g.fillStyle = gg; g.fillRect(b - 14, y, W - b + 14, 2.2);
  }
  const lx = W * rowU(15.4);   // lighter tan beside the nose and along the lips' edge
  for (const [y0, dir] of [[0, 1], [H, -1]]) { const gg = g.createLinearGradient(0, y0, 0, y0 + dir * H * 0.32); gg.addColorStop(0, "rgba(201,160,104,0.85)"); gg.addColorStop(1, "rgba(201,160,104,0)"); g.fillStyle = gg; g.fillRect(lx, dir > 0 ? y0 : y0 - H * 0.32, W - lx, H * 0.32); }
  const bx0 = W * rowU(15.2), bx1 = bx0 + (W - bx0) * 0.6;   // the bridge: darker along the top of the nose
  { const gg = g.createLinearGradient(0, H * 0.44, 0, H * 0.56); gg.addColorStop(0, "rgba(90,61,36,0)"); gg.addColorStop(0.5, "rgba(90,61,36,0.95)"); gg.addColorStop(1, "rgba(90,61,36,0)"); g.fillStyle = gg; g.fillRect(bx0, H * 0.4, bx1 - bx0, H * 0.2); g.fillStyle = gg; g.fillRect(bx1, H * 0.46, 40, H * 0.08); }
  for (let i = 0; i < 500; i++) {   // very short strokes in the tan
    const x = bx0 + rnd(i * 3 + 9001) * (W - bx0), y = rnd(i * 3 + 9002) * H, l = 4 + 2 * rnd(i + 9003); g.strokeStyle = i % 2 ? "rgba(138,95,51,0.5)" : "rgba(201,160,104,0.5)"; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - l, y + (y < H / 2 ? -1 : 1) * l * 0.25); g.stroke();
  }
  g.fillStyle = "#15110f"; g.fillRect(W * rowU(17.85), 0, W, H);   // rows 17-18: the nose pad is black (from the middle of row 17: the pad is 0.07 wide)
  { const gg = g.createLinearGradient(W * rowU(17.45), 0, W * rowU(17.85), 0); gg.addColorStop(0, "rgba(21,17,15,0)"); gg.addColorStop(1, "rgba(21,17,15,1)"); g.fillStyle = gg; g.fillRect(W * rowU(17.45), 0, W * (rowU(17.85) - rowU(17.45)), H); }
  // the mouth roof (4.5 % of H each side) and the black lip line beside it
  const rx0 = W * rowU(13.6), rx1 = W * rowU(16.4);
  g.fillStyle = INSIDE; g.fillRect(rx0, 0, rx1 - rx0, H * 0.03); g.fillRect(rx0, H * 0.97, rx1 - rx0, H * 0.03);
  g.fillStyle = "#1c1513"; g.fillRect(rx0, H * 0.03, rx1 - rx0, 5); g.fillRect(rx0, H * 0.97 - 5, rx1 - rx0, 5);
  // the eyes sit in dark sockets (the tan does not reach them)
  for (const yy of [0.417, 0.583]) { g.fillStyle = "rgba(12,10,8,0.6)"; g.beginPath(); g.ellipse(W * rowU(14.0), H * yy, 15, 11, 0, 0, TAU); g.fill(); }
  g.fillStyle = "rgba(12,10,8,0.85)"; g.fillRect(0, 0, W * uOf(2.4), H);   // the stub tail end
}));
const legTex = (outerTop) => once(`bearLegT2${outerTop}`, () => cvs(256, 256, (g, W, H) => {   // x down the leg (top 0), y round it; the outer face is the sheen band
  g.fillStyle = FUR; g.fillRect(0, 0, W, H); g.lineCap = "round";
  const cS = rgbOf(SHAD), cM = rgbOf(MIDT), c1 = rgbOf(SH1), oy = outerTop ? 0.25 * H : 0.75 * H;
  for (let i = 0; i < 1600; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H, L = 10 + 8 * rnd(i * 3 + 3) + (x > W * 0.5 ? 5 : 0); g.strokeStyle = i % 2 ? css(cS, 0.55) : css(cM, 0.55); g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (rnd(i + 5) - 0.5) * 4); g.stroke(); }
  for (let i = 0; i < 220; i++) { const x = rnd(i * 3 + 501) * W, y = oy + (rnd(i * 3 + 502) + rnd(i * 3 + 503) - 1) * 20, L = 12 + 8 * rnd(i + 7); g.strokeStyle = css(c1, 0.5); g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (rnd(i + 5) - 0.5) * 3); g.stroke(); }
  g.fillStyle = "rgba(12,10,8,0.5)"; g.fillRect(W * 0.88, 0, W * 0.12, H);
}));
const pawTex = () => once("bearPawT2", () => cvs(128, 128, (g, W, H) => {   // x along the paw, y round it (dorsal at the middle row)
  g.fillStyle = "#15110e"; g.fillRect(0, 0, W, H); g.lineCap = "round";
  for (let i = 0; i < 320; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H; g.strokeStyle = i % 2 ? css(rgbOf(SHAD), 0.6) : css(rgbOf(MIDT), 0.5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y + (rnd(i + 5) - 0.5) * 3); g.stroke(); }
  g.strokeStyle = "rgba(6,5,4,0.85)"; g.lineWidth = 2; for (let k = 0; k < 4; k++) { const y = H * (0.5 + (k - 1.5) * 0.11); g.beginPath(); g.moveTo(W * 0.62, y); g.lineTo(W, y); g.stroke(); }
}));
const earTex = () => once("bearEarT2", () => cvs(128, 128, (g, W, H) => {   // x up the ear, y round it: the front (inside) is the middle row
  g.fillStyle = FUR; g.fillRect(0, 0, W, H); g.lineCap = "round";
  for (let i = 0; i < 120; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H; g.strokeStyle = i % 2 ? css(rgbOf(SHAD), 0.6) : css(rgbOf(MIDT), 0.6); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + (rnd(i + 5) - 0.5) * 3); g.stroke(); }
  g.fillStyle = "#4a3a2c"; g.fillRect(W * 0.02, H * 0.2, W * 0.86, H * 0.6);
  const gr = g.createRadialGradient(W * 0.42, H * 0.5, 4, W * 0.42, H * 0.5, W * 0.4); gr.addColorStop(0, "rgba(28,20,14,0.85)"); gr.addColorStop(1, "rgba(28,20,14,0)"); g.fillStyle = gr; g.fillRect(0, H * 0.2, W, H * 0.6);
  for (let i = 0; i < 90; i++) { const x = rnd(i + 400) * W * 0.85, y = H * (0.22 + 0.56 * rnd(i + 500)); g.strokeStyle = "rgba(90,70,52,0.5)"; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y); g.stroke(); }
}));
const jawTex = () => once("bearJawT2", () => cvs(256, 128, (g, W, H) => {   // x along the jaw, y round it: the top (middle row) is the inside of the mouth
  g.fillStyle = "#2a1f16"; g.fillRect(0, 0, W, H); g.lineCap = "round";
  for (let i = 0; i < 200; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H; g.strokeStyle = i % 2 ? css(rgbOf(SHAD), 0.6) : css(rgbOf("#8a5f33"), 0.5); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 7, y + (y < H / 2 ? -2 : 2)); g.stroke(); }
  const gt = g.createLinearGradient(W * 0.2, 0, W * 0.6, 0); gt.addColorStop(0, "rgba(138,95,51,0)"); gt.addColorStop(1, "rgba(150,106,60,0.9)"); g.fillStyle = gt; g.fillRect(W * 0.2, 0, W * 0.8, H);
  g.fillStyle = INSIDE; g.fillRect(W * 0.05, H * 0.41, W * 0.95, H * 0.18);
  g.fillStyle = "#1c1513"; g.fillRect(W * 0.3, H * 0.38, W * 0.7, 4); g.fillRect(W * 0.3, H * 0.62 - 4, W * 0.7, 4);
}));
const lockTex = (tip) => once(`bearLockT2${tip}`, () => cvs(32, 128, (g, W, H) => {   // v 1 (the top row) is the root
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, tip); gr.addColorStop(1, FUR); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(3 + i * 5, 4); g.lineTo(3 + i * 5, H); g.stroke(); }
}));
const clawTex = () => once("bearClawT2", () => cvs(8, 64, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, "#3a2f26"); gr.addColorStop(1, "#b8a88a"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));
const noseTex = () => once("bearNoseT2", () => cvs(128, 64, (g, W, H) => {   // the front of the sphere is u 0.25; the comma nostrils
  g.fillStyle = "#15110f"; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * 0.25, H * 0.3, 2, W * 0.25, H * 0.3, 16); gr.addColorStop(0, "rgba(90,84,78,0.5)"); gr.addColorStop(1, "rgba(90,84,78,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "#040302"; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(W * (0.25 + k * 0.045), H * 0.55, 6, 4, k * 0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(W * (0.25 + k * 0.07), H * 0.62, 3.4, 2, k * 0.9, 0, TAU); g.fill(); }
}));
const fleck = (base, seed = 1, n = 60, a = 0.14) => once(`bf${base}${seed}`, () => cvs(64, 64, (g, W, H) => {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; g.beginPath(); g.ellipse(rnd(seed * 97 + i) * W, rnd(seed * 97 + i + 300) * H, 2 + rnd(i) * 3, 1.5, rnd(i + seed) * 3, 0, TAU); g.fill(); }
}));

// ---------------------------------------------------------------- geometry
// a curved tapered tube along a smooth curve through pts (claws)
function taperTube(pts, r0, r1, radial = 8, seg = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pos = [], uv = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg; curve.getPointAt(u, P); curve.getTangentAt(u, T);
    N.crossVectors(T, Math.abs(T.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)).normalize(); B.crossVectors(T, N).normalize();
    const r = r0 + (r1 - r0) * Math.pow(u, 0.85);
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r; pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); uv.push(j / radial, u); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// flat tapered locks of hair lying nearly flat on the skin: list rows { p, q (a quaternion: local -y is the way the lock lies, +z the skin normal), L, w, bend, u }
function locksGeo(list, seg = 5) {
  const pos = [], uv = [], idx = [], v = new THREE.Vector3(), m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  let base = 0;
  for (const k of list) {
    m.compose(pv.set(...k.p), k.q, one);
    const u0 = k.u ?? 0;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, hw = (k.w / 2) * Math.sqrt(Math.max(0.0004, 1 - Math.pow(t, 2.4))) * (1 - 0.4 * t), y = -k.L * t, z = (k.bend ?? 0.05) * t * t * k.L, wob = Math.sin(t * 3.2 + u0 * 9) * 0.06 * k.L * t;
      for (let j = -1; j <= 1; j++) { v.set(j * hw + wob, y, z + (j === 0 ? 0.01 * (1 - t) : 0)).applyMatrix4(m); pos.push(v.x, v.y, v.z); uv.push(u0 + (j + 1) * 0.12, 1 - t * 0.98); }
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j, b = a + 1, c = a + 3, d = c + 1; idx.push(a, c, b, b, c, d); }
    base += (seg + 1) * 3;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the skin of the body loft at rest: row interpolation and the surface point / normal for the fur locks
function rowAt(z) {
  let i = 0; while (i < NB.length - 2 && z > NB[i + 1][0]) i++;
  const a = NB[i], b = NB[i + 1], f = clamp((z - a[0]) / (b[0] - a[0])), L = (k) => a[k] + (b[k] - a[k]) * f;
  return { cy: L(1), w: L(2), up: L(3), dn: L(4), n: L(5) };
}
function skinPt(z, ang) {
  const r = rowAt(z), e = 2 / r.n, c = Math.cos(ang), s = Math.sin(ang);
  return new THREE.Vector3(Math.sign(c) * Math.abs(c) ** e * r.w, r.cy + Math.sign(s) * Math.abs(s) ** e * (s > 0 ? r.up : r.dn), z);
}
// one lock on the skin at body row z, side s, angle th from the back (0 back, 90 flank, 180 belly): lies back (bk) and down (dn) along the skin, 15-25 deg off it
function lockAt(z, thB, s, bk, dn, L, w, seed) {
  const ang = s > 0 ? Math.PI / 2 - rad(thB) : Math.PI / 2 + rad(thB), P = skinPt(z, ang), d = 0.01;
  const Tz = skinPt(z + d, ang).sub(skinPt(z - d, ang)).normalize(), Ta = skinPt(z, ang + d).sub(skinPt(z, ang - d)).normalize();
  const N = new THREE.Vector3().crossVectors(Ta, Tz).normalize(); if (N.dot(new THREE.Vector3(P.x, P.y - 0.74, 0)) < 0) N.negate();
  const down = Ta.clone().multiplyScalar(s > 0 ? -1 : 1), D = new THREE.Vector3().addScaledVector(Tz, -bk).addScaledVector(down, dn).normalize();
  const a = rad(9 + 8 * rnd(seed + 7)); D.multiplyScalar(Math.cos(a)).addScaledVector(N, Math.sin(a)).normalize();
  const Y = D.clone().negate(), X = new THREE.Vector3().crossVectors(Y, N).normalize(), Zv = new THREE.Vector3().crossVectors(X, Y).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Zv));
  P.addScaledVector(N, 0.004);
  return { p: [P.x, P.y, P.z], q, L, w, bend: 0.02 + 0.05 * rnd(seed + 3), u: rnd(seed + 11) };
}
// the fur locks of the body (in the body frame) and the head (in the head frame, the rows' own turn about HP)
function bodyLocks() {
  const out = []; let n = 0;
  const add = (cnt, zr, thr, bk, dn, Lr, wr) => { for (let i = 0; i < cnt; i++) { const k = ++n * 13, s = i % 2 ? 1 : -1; out.push(lockAt(zr[0] + (zr[1] - zr[0]) * rnd(k + 1), thr[0] + (thr[1] - thr[0]) * rnd(k + 2), s, bk, dn, Lr[0] + (Lr[1] - Lr[0]) * rnd(k + 3), wr[0] + (wr[1] - wr[0]) * rnd(k + 4), k)); } };
  add(14, [-0.55, 0.38], [0, 22], 1, 0.1, [0.06, 0.09], [0.03, 0.04]);       // the back line and the hump
  add(10, [-0.95, -0.6], [20, 100], 1, 0.15, [0.05, 0.07], [0.03, 0.04]);    // the rump and the back of the buttocks
  add(14, [-0.5, 0.3], [140, 172], 0.1, 1, [0.06, 0.09], [0.03, 0.04]);      // the belly line
  add(14, [0.30, 0.42], [90, 170], 0.5, 1, [0.06, 0.09], [0.03, 0.04]);      // the chest
  add(12, [-0.45, 0.30], [55, 115], 1, 0.45, [0.05, 0.08], [0.03, 0.04]);    // the flanks
  return out;
}
function headLocks() {
  const out = [], hp = HP0; let n = 0;
  const add = (cnt, zr, thr, bk, dn, Lr, wr) => { for (let i = 0; i < cnt; i++) { const k = 5000 + ++n * 13, s = i % 2 ? 1 : -1, l = lockAt(zr[0] + (zr[1] - zr[0]) * rnd(k + 1), thr[0] + (thr[1] - thr[0]) * rnd(k + 2), s, bk, dn, Lr[0] + (Lr[1] - Lr[0]) * rnd(k + 3), wr[0] + (wr[1] - wr[0]) * rnd(k + 4), k); l.p = [l.p[0] - hp[0], l.p[1] - hp[1], l.p[2] - hp[2]]; out.push(l); } };
  add(14, [0.78, 0.86], [60, 105], 1, 0.3, [0.03, 0.045], [0.02, 0.028]);    // the cheeks and the jaw corners (7 a side)
  add(6, [0.66, 0.72], [10, 40], 1, 0.1, [0.035, 0.05], [0.022, 0.03]);      // the nape
  add(4, [0.73, 0.75], [0, 6], 1, 0.1, [0.03, 0.04], [0.02, 0.025]);         // between the ears
  return out;
}
// the top of the muzzle at z and x (for the snarl wrinkles)
const muzzleTop = (z, x) => { const r = rowAt(z); return r.cy + r.up * (1 - clamp(Math.abs(x) / r.w) ** r.n) ** (1 / r.n); };
// a brow ridge: a loft along x
const browLoft = (nodes) => makeLoft(nodes.map(([x, w, h]) => ({ c: [x, 0, 0], w, up: h, dn: h * 0.8, n: 2.4 })), { sub: 3, radial: 12 });
// small real eyes (props-iceage.js realEyes, tuned: darker pupil, a catch-light r 0.003)
function realEyes(S, parent, o) {
  const R = o.R, sclM = S.b(o.sclera), rimM = S.b(o.rim), irisM = S.b(o.iris), pupM = S.b("#050403"), glM = S.b("#ffffff");
  [rimM, irisM, pupM, glM].forEach((m, k) => { m.polygonOffset = true; m.polygonOffsetFactor = -(k + 1); m.polygonOffsetUnits = -(k + 1); });
  const cap = (r, th, m) => { const g = new THREE.SphereGeometry(r, 24, 14, 0, TAU, 0, th); g.rotateX(Math.PI / 2); return new THREE.Mesh(g, m); };
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * o.x, o.y, o.z); g.rotation.order = "YXZ"; g.rotation.set(o.tilt ?? 0, s * o.spread, 0); parent.add(g);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), sclM));
    const pup = new THREE.Group(); g.add(pup);
    pup.add(cap(R * 1.004, o.irisTh + 0.12, rimM), cap(R * 1.008, o.irisTh, irisM), cap(R * 1.012, o.pupilTh, pupM));
    const gl = new THREE.Mesh(new THREE.SphereGeometry(R * 0.16, 8, 6), glM); gl.position.set(R * 0.3, R * 0.34, R * 0.9); pup.add(gl);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 24, 12, 0, TAU, 0, Math.PI / 2), o.lidM); lid.scale.set(1, 1.05, 1); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
    const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP);
    const browG = new THREE.Group(); browG.position.set(s * o.x, o.y + R * o.browUp, o.z); browG.rotation.y = s * o.spread; parent.add(browG);
    const browT = new THREE.Group(); browG.add(browT); mesh(o.browGeo, o.browM, browT, 0, 0, R * 0.2).castShadow = false;
    return { pup, lidP, browG, browT, s };
  });
  return {
    apply(ps) {
      const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1), lidK = Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0)), bw = clamp(ps.brow ?? 0, -1, 1);
      for (const e of eyes) {
        e.pup.rotation.set(-ly * 0.4, lx * 0.45 - e.s * 0.06, 0);
        e.lidP.rotation.x = rad(35 + 140 * lidK);
        e.browT.rotation.z = (e.s * -20 * Math.max(0, -bw) * Math.PI) / 180 + e.s * 0.1 * Math.max(0, bw);   // brow -1 tilts the inner end down 20 deg
        e.browG.position.y = o.y + R * o.browUp + 0.010 * Math.max(0, bw) - 0.012 * Math.max(0, -bw);
      }
    },
  };
}

// ================================================================================================ kinds
export const BEAR_KINDS = {
  bear(P) {
    const S = palette(), DS = THREE.DoubleSide;
    const coat = S.m("#ffffff", { map: bodyTex(), roughness: 0.5 });
    const legML = S.m("#ffffff", { map: legTex(false), roughness: 0.5 }), legMR = S.m("#ffffff", { map: legTex(true), roughness: 0.5 }), pawM = S.m("#ffffff", { map: pawTex(), roughness: 0.6 });
    const earM = S.m("#ffffff", { map: earTex(), roughness: 0.5 }), jawM = S.m("#ffffff", { map: jawTex(), roughness: 0.55 }), lidM = S.m("#1a1511", { roughness: 0.5 }), browM = S.m("#1c1712", { roughness: 0.55 });
    const lockM = [lockTex(MIDT), lockTex(MIDT), lockTex(MIDT), lockTex(SH1)].map((t) => S.m("#ffffff", { map: t, roughness: 0.55, side: DS }));
    const ivory = S.m("#efe6cf", { roughness: 0.35 }), clawM = S.m("#ffffff", { map: clawTex(), roughness: 0.35 }), padM = S.m("#2a211d", { roughness: 0.7 });
    const tongueM = S.m("#c9697a", { roughness: 0.55 }), gumM = S.m("#7a3d40", { roughness: 0.6 }), noseM = S.m("#ffffff", { map: noseTex(), roughness: 0.25 }), wrinkM = S.m("#0c0a08", { roughness: 0.8 });
    const root = new THREE.Group(); P.whole.add(root);
    const bodyG = new THREE.Group(); root.add(bodyG);   // the fur locks ride the trunk's rigid transform

    // ---- skin: tail stub, body, neck and skull, ONE loft
    const mkSec = (c, w, up, dn, n = 2.2) => ({ c, w, up, dn, n });
    const bodyRest = [...TAILS.map(([x, y, z, r]) => mkSec([x, y, z], r, r, r)), ...NB.map((r) => mkSec([0, r[1], r[0]], r[2], r[3], r[4], r[5]))];
    const bodyGeo = makeLoft(bodyRest, { sub: 5, radial: 28 }), trunk = mesh(bodyGeo, coat, root);
    // fur locks: the outline is not a smooth tube
    lockMeshes(bodyLocks(), lockM, bodyG);

    // ---- legs: ONE loft each (pad, shoulder / hip, mid, elbow / knee, mid, wrist / heel, a little overshoot), then a rigid paw in its own frame
    const FROWS = [[0.12, 0.15, 0.15], [0.17, 0.21, 0.21], [0.16, 0.19, 0.19], [0.125, 0.14, 0.15], [0.11, 0.125, 0.125], [0.095, 0.11, 0.105], [0.095, 0.11, 0.105]];
    const BROWS = [[0.10, 0.13, 0.13], [0.17, 0.21, 0.22], [0.165, 0.20, 0.20], [0.125, 0.15, 0.14], [0.10, 0.11, 0.11], [0.08, 0.085, 0.09]];
    const FP = [[0.095, 0.11, 0.105, 0], [0.10, 0.10, 0.09, 0.07], [0.105, 0.06, 0.05, 0.17], [0.075, 0.035, 0.03, 0.19]];   // [half width, top, bottom, z] along the paw (z = from the wrist)
    const HP_ = [[0.08, 0.09, 0.09, 0, 0], [0.085, 0.07, 0.075, 0.08, -0.015], [0.095, 0.05, 0.05, 0.17, -0.04], [0.095, 0.035, 0.03, 0.24, -0.06]];   // the hind foot: [w, top, bottom, z, y] from the heel centre
    const mkClaws = (parent, front) => {
      const arr = [], len = front ? 0.045 : 0.028, r0 = front ? 0.011 : 0.009, step = front ? 0.036 : 0.033;
      const geo = once(`bearClawG${front}`, () => { const L = len, a1 = rad(8.75), a2 = rad(26); const p0 = [0, 0, 0], p1 = [0, -Math.sin(a1) * L / 2, Math.cos(a1) * L / 2], p2 = [0, p1[1] - Math.sin(a2) * L / 2, p1[2] + Math.cos(a2) * L / 2]; return taperTube([p0, p1, p2], r0, 0.002, 8, 10); });
      for (let k = -2; k <= 2; k++) { const c = mesh(geo, clawM, parent); c.rotation.order = "YXZ"; c.castShadow = false; arr.push({ c, k }); }
      return arr;
    };
    const legs = LEGS.map((l) => {
      const front = l.f, geo = makeLoft((front ? FROWS : BROWS).map((r, i) => mkSec(front ? [l.s * 0.21, 0.8 - i * 0.1, 0.3] : [l.s * 0.2, 0.8 - i * 0.1, -0.76], ...r, 2.6)), { sub: 4, radial: 20, ref: [0, 0, 1] });
      mesh(geo, l.s > 0 ? legML : legMR, root);
      const pg = new THREE.Group(); pg.rotation.order = "XYZ"; root.add(pg);
      let pawGeo, claws;
      if (front) {
        pawGeo = makeLoft(FP.map(([w, u, d, z]) => mkSec([0, 0, z], w, u, d, 2.4)), { sub: 4, radial: 16, ref: [0, 1, 0] }); mesh(pawGeo, pawM, pg);
        const pm = mesh(new THREE.SphereGeometry(1, 14, 8).scale(0.065, 0.004, 0.035), padM, pg, 0, -0.093, 0.075); pm.castShadow = false;
        for (let k = -2; k <= 2; k++) { const tp = mesh(new THREE.SphereGeometry(0.016, 8, 6).scale(1, 0.25, 1.2), padM, pg, k * 0.034, -0.05, 0.158 + 0.012 * (2 - Math.abs(k)) * 0.35); tp.castShadow = false; }
        claws = mkClaws(pg, true);
      } else {
        pawGeo = makeLoft(HP_.map(([w, u, d, z, y]) => mkSec([0, y, z], w, u, d, 2.4)), { sub: 4, radial: 16, ref: [0, 1, 0] }); mesh(pawGeo, pawM, pg);
        const pm = mesh(new THREE.SphereGeometry(1, 14, 8).scale(0.045, 0.004, 0.085), padM, pg, 0, -0.092, 0.10); pm.castShadow = false;
        for (let k = -2; k <= 2; k++) { const tp = mesh(new THREE.SphereGeometry(0.014, 8, 6).scale(1, 0.25, 1.2), padM, pg, k * 0.03, -0.088, 0.225 + 0.006 * (2 - Math.abs(k)) * 0.35); tp.castShadow = false; }
        claws = mkClaws(pg, false);
      }
      return { ...l, geo, pg, claws, front };
    });

    // ---- head frame: everything below turns with the head about HP
    const headG = new THREE.Group(); headG.rotation.order = "YXZ"; root.add(headG);
    lockMeshes(headLocks(), lockM, headG);
    // lower jaw (hinged at J, its top is the inside of the mouth): jawRows = [z, centre y, half w, up, down]
    const jawG = new THREE.Group(); jawG.position.set(...rel(JH)); headG.add(jawG);
    const jr = [[0.76, 0.735, 0.12, 0.04, 0.05], [0.84, 0.725, 0.105, 0.05, 0.05], [0.92, 0.725, 0.085, 0.05, 0.045], [0.98, 0.73, 0.07, 0.045, 0.04], [1.01, 0.74, 0.04, 0.03, 0.03]];
    const jawSec = (s) => jr.map(([z, y, w, u, d], i) => mkSec([0, y - JH[1], z - JH[2]], w + 0.004, u + 0.012 - (i >= 2 && i <= 4 ? 0.012 * s : 0), d, 2.4));
    const jawGeo = makeLoft(jawSec(0), { sub: 4, radial: 16 }); mesh(jawGeo, jawM, jawG);
    // teeth: upper canines, upper incisors, lower canines (in front of the upper ones), lower incisors, cheek teeth, gums, tongue
    const tooth = (parent, x, y, z, len, r, back, flip) => { const gm = new THREE.ConeGeometry(r, len, 8); gm.translate(0, -len / 2, 0); const c = mesh(gm, ivory, parent, x, y, z); if (flip) c.rotation.x = Math.PI - back; else c.rotation.x = back; c.castShadow = false; return c; };
    for (const s of [-1, 1]) {
      tooth(headG, ...rel([s * 0.05, 0.775, 0.985]), 0.036, 0.011, rad(10), false);
      tooth(jawG, s * 0.042, 0.775 - JH[1], 0.97 - JH[2], 0.030, 0.010, rad(-6), true);
    }
    for (let k = 0; k < 6; k++) {
      const a = ((k - 2.5) / 2.5) * 0.9, x = Math.sin(a) * 0.04, z = 0.995 + (1 - Math.cos(a)) * 0.012;
      tooth(headG, ...rel([x, 0.775, z]), 0.012, 0.0048, 0, false);
      tooth(jawG, x * 0.9, 0.775 - JH[1], 0.985 - JH[2] + (1 - Math.cos(a)) * 0.01, 0.010, 0.0042, 0, true);
    }
    const ridge = (up) => makeLoft([0, 1, 2, 3, 4].map((i) => mkSec([0, 0, i * 0.0225], 0.007, up ? 0.003 + (i % 2) * 0.004 : 0.002, up ? 0.002 : 0.003 + (i % 2) * 0.004, 2.2)), { sub: 2, radial: 8 });
    for (const s of [-1, 1]) {   // cheek teeth: a low bumpy ivory ridge each side, upper (bumps down) and lower (bumps up), z 0.84..0.93
      mesh(ridge(false), ivory, headG, ...rel([s * 0.06, 0.775, 0.84])).castShadow = false;
      mesh(ridge(true), ivory, jawG, s * 0.06, 0.775 - JH[1], 0.84 - JH[2]).castShadow = false;
    }
    const tongue = makeLoft([[0.80, 0.03, 0.006], [0.85, 0.042, 0.006], [0.91, 0.045, 0.006], [0.95, 0.035, 0.006], [0.975, 0.02, 0.005]].map(([z, w, u]) => mkSec([0, 0.769 - JH[1], z - JH[2]], w, u, u, 2.2)), { sub: 3, radial: 12 });
    mesh(tongue, tongueM, jawG).castShadow = false;
    // nose pad cap: a wet squashed sphere with two comma nostrils
    const nose = mesh(new THREE.SphereGeometry(1, 20, 12).scale(0.027, 0.014, 0.013), noseM, headG, ...rel([0, 0.84, 1.034]));
    // snarl wrinkles: three dark arcs across the bridge
    const wrinkles = [0.90, 0.925, 0.95].map((z) => {
      const pts = [-0.05, -0.025, 0, 0.025, 0.05].map((x) => new THREE.Vector3(x, muzzleTop(z, x) - muzzleTop(z, 0) + 0.002, 0));
      const g = new THREE.Group(); g.position.set(...rel([0, muzzleTop(z, 0), z])); headG.add(g);
      const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.004, 5), wrinkM, g); m.castShadow = false; return g;
    });
    // ears: tall, round, wide set, one flat rounded loft each
    const EW = [[0.040, 0.025, 0], [0.050, 0.022, 0.03], [0.0525, 0.02, 0.06], [0.045, 0.019, 0.09], [0.028, 0.014, 0.105], [0.008, 0.006, 0.115]];
    const earGeo = makeLoft(EW.map(([w, u, y]) => mkSec([0, y, 0], w, u, u, 2.0)), { sub: 3, radial: 16, ref: [0, 0, 1] });
    const ears = [-1, 1].map((s) => { const g = new THREE.Group(); g.rotation.order = "YXZ"; g.position.set(...rel([s * 0.15, 1.005, 0.73])); headG.add(g); mesh(earGeo, earM, g); return { g, s }; });
    // eyes: r 0.019, dark brown, close-set, in dark sockets, one catch-light
    const face = realEyes(S, headG, { x: 0.09, y: 0.957 - HP0[1], z: 0.892 - HP0[2], R: 0.019, spread: rad(30), tilt: 0, sclera: "#3a2a20", rim: "#0a0807", iris: "#2a1a0e", irisTh: 1.05, pupilTh: 0.58, lidM, browGeo: browLoft([[-0.035, 0.012, 0.004], [0, 0.02, 0.007], [0.035, 0.012, 0.004]]), browM, browUp: 1.15 });
    // the mouth hold: an empty group between the front teeth, in the head frame
    const mouth = new THREE.Group(); mouth.name = "mouthHold"; mouth.position.set(...rel(MOUTH0)); headG.add(mouth);

    const sec = new Array(NN), v3 = new THREE.Vector3(), qI = new THREE.Quaternion();
    return {
      grip: 0, mouth,
      apply(ps, t) {
        const Z = solve(ps), tt = t ?? 0, br = clamp(ps.breath ?? 0), jw = clamp(ps.jaw ?? 0), sn = clamp(ps.snarl ?? 0), bz = 1 + 0.012 * (1 + 2 * br) * Math.sin(tt * 1.9);
        const bump = (Z.wk > 0 ? Z.wk : 0) * 0.015 * [0.25, 0.75].reduce((a, ph) => { const f = ((((Z.g + ph) % 1) + 1) % 1); return a + (f < Z.duty ? Math.sin(Math.PI * f / Z.duty) ** 2 : 0); }, 0) * (1 - Z.sr);
        const place = (c, hw) => {
          let p = c;
          if (hw > 0) { qI.identity().slerp(Z.qHead, hw); v3.set(c[0] - HP0[0], c[1] - HP0[1], c[2] - HP0[2]).applyQuaternion(qI); p = [HP0[0] + (Z.hpEff[0] - HP0[0]) * hw + v3.x, HP0[1] + (Z.hpEff[1] - HP0[1]) * hw + v3.y, HP0[2] + (Z.hpEff[2] - HP0[2]) * hw + v3.z]; }
          v3.set(p[0], p[1], p[2]).applyQuaternion(Z.q).add(Z.o); return [v3.x, v3.y, v3.z];
        };
        TAILS.forEach(([x, y, z, r], i) => { sec[i] = mkSec(place([x, y, z], 0), r, r, r); });
        NB.forEach((r, i) => {
          const k = r[0] > -0.2 && r[0] < 0.45 ? bz : 1; let cy = r[1], up = r[3], dn = r[4], w = r[2];
          if (i === 7) up += bump;
          if (i === 14 || i === 15 || i === 16) dn -= [0.022, 0.036, 0.030][i - 14] * sn;
          if (i === 14 || i === 15) w += 0.008 * sn;
          if (i === 16 || i === 17) cy += 0.006 * Z.sk;
          sec[NT + i] = { c: place([0, cy, r[0]], r[6]), w: w * k, up: up * k, dn: dn * k, n: r[5] };
        });
        bodyGeo.userData.set(sec); trunk.userData.cores = sec;   // the checks' creature-in-prop test (stage.js clipping)
        bodyG.position.copy(Z.o); bodyG.quaternion.copy(Z.q);
        headG.position.set(...Z.headPos); headG.quaternion.copy(Z.qHeadW);
        jawG.rotation.x = rad(42) * jw; jawGeo.userData.set(jawSec(sn));
        // ears: pricked forward .. pinned back; brow < 0 adds up to -0.4
        const ev = clamp((ps.ears ?? 0) - 0.4 * Math.max(0, -clamp(ps.brow ?? 0, -1, 1)), -1, 1);
        for (const e of ears) {
          const out = ev >= 0 ? 20 - 12 * ev : 20 + 15 * -ev, fwd = ev >= 0 ? 10 + 15 * ev : 10 - 80 * -ev;
          e.g.rotation.set(rad(fwd), 0, -e.s * rad(out)); e.g.scale.set(1, ev >= 0 ? 1 : 1 + 0.4 * ev, 1);
        }
        // nose: wet cap lifts and flares with sniff, rises with snarl
        nose.position.set(...rel([0, 0.84 + 0.012 * Z.sk + 0.008 * sn, 1.034])); nose.scale.set(1 + 0.12 * Z.sk, 1, 1);
        wrinkles.forEach((g) => { g.visible = sn > 0.02; g.scale.set(Math.max(sn, 0.001), Math.max(sn, 0.001), Math.max(sn, 0.001)); });
        face.apply(ps);
        // legs: lofts and rigid paws
        legs.forEach((l, i) => {
          const d = Z.legs[i];
          l.geo.userData.set(d.pts.map((p, k) => mkSec(p, ...(l.front ? FROWS : BROWS)[k], 2.6)));
          l.pg.position.set(...d.fo); l.pg.quaternion.copy(d.fq);
          const c = clamp(d.claws);
          for (const { c: m, k } of l.claws) {
            const ak = k * 9;   // outer +-18, inner +-9 at claws 1
            m.rotation.set(rad(-10) * c, rad(ak) * c, 0);
            if (l.front) m.position.set(k * 0.036 * (1 + 0.12 * c) + 0, -0.012, 0.172 + (Math.abs(k) < 2 ? 0.015 : 0));
            else m.position.set(k * 0.033 * (1 + 0.12 * c), -0.065, 0.232 + (Math.abs(k) < 2 ? 0.012 : 0));
          }
        });
      },
    };
  },
};
// the locks split over four materials (row i takes material i % 4: every fourth tip is the sheen colour): one merged mesh each
function lockMeshes(list, mats, parent) {
  return mats.map((m, k) => { const o = mesh(locksGeo(list.filter((_, i) => i % mats.length === k)), m, parent); o.castShadow = false; o.userData.noOutline = true; return o; });
}
