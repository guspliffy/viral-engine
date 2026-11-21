// props-krampus-beast.js - Krampus myth 01 "Krampus": kinds krampus and krampusshadow (DESIGN.md section B, F)
// Exports: KRAMPUS_BEAST_KINDS, KRAMPUS_BEAST_STATE (defaults below), KRAMPUS_BEAST_GRIPS ({}: nothing is held by a cast hand),
//          krampusPoints(params, {x,y,z,rot,scale}) -> world places for staging (pure, Node-safe), krampusCounts() -> the section 9 row B counts.
//
// krampus   Origin: the ground between the hooves, he faces +z, +x is his left. Size: crown 2.04 m, horn tops 2.50 m (stoop 0).
//           One group = body, 240 locks (rebuilt every apply: root follows the body, the tip falls plumb), carved-wood face (150 gouges,
//           3 checks, 10 teeth), 2 horns x 32 rings, 5 cowbells, 45 links, 7 birch sticks + 3 spare bunches, the wicker basket on his back
//           (28 stakes, 46 rows, lid 14 turns, 3 hinge loops) with the door-9 kid inside (1 boot, 1 sock of 5 stripes, scarf, 14 tassels).
//   spec    runner false   true = a runner copy: no kid, no torch, no spares; fur (seed*3)%5, mask seed%4, horn seed%3
//           seed 0         runner variety (integer)
//           lod "near"     "near" all 240 locks + gouges | "mid" 90 locks, no gouges | "far" painted 6-pose card, 2.0 x 3.0 m, outlined, basket + torch (follows gait)
//           height 1.72+0.36*rnd(seed)  runner crown height in m (the near Krampus is always 2.04)
//           fur 0          fur set 0..4 (non-runner)        mirror false   swap the working hand and stow claw (+x side)
//           jamAt [0.15,0.34,0.85]  where the 7 stick butts jam, in his frame (mirror flips x)      kid true   false = empty basket
//           gait 0, gaitPhase 0   (far card) pose index source
//   state   (every key also readable from spec; state wins), range 0..1 unless noted
//           stoop 0 (1 = bent 42 deg, crown 1.61, M (0,1.22,0.96))  nose 0 (1 = nose to the ground)  sniff 0 (nostril snuffle, 0..1 pulse)
//           twist 0 (-1..1 torso)  headYaw 0, headPitch 0 (-1..1)  gait 0 (cycles: 1.10 m, planted 60%)  slope 0 (-1..1 hill)
//           jam 0 (1 = the working hand jams the sticks at jamAt)  bunch 1 (birch bundle visible)  tongue 0.35 (0 in, 1 full length)
//           lick 0  jaw 0 (open)  breath 0  lids 0.3 (eyelids closed)  glow 0.5 (eye glow)  lookX, lookY 0 (eyes)  ears 0
//           ring 0 (bells swing)  lid 0 (0 shut, 1 open toward Spud: 3 stages)  stow 1 (1 = free hand stowed in the cape, 0 = clawing out)
//           kidPeek 0 (kid up to the rim)  kidTalk 0 (mouth)  kidKick 0 (boot)  scarfOut 0 (scarf blows)  torch 1  spares 3 (bunches on the belt)
//   hand    The birch bundle is held by his right hand (-x; +x with mirror): 7 sticks, butts at the jam point (default (-0.43,0.62,0.51) at
//           stoop 1, (-0.43,0.88,0.07) at stoop 0); the fingers close round the stick middle, hand frame +z along the fingers, -y palm.
//
// krampusshadow  Origin: the door foot; a flat shape on two planes, the apron (z 0..1.5 m ahead) and the door (y 0..1.8 m), x -1.8..1.8.
//           One canvas texture, blur ~2 cm, opacity 0.86, #0b0e22: horned head, ram curls, raised fist with 7 sticks, basket, long tongue, belt chain, 2 bells.
//           The figure's y 0.85 m sits on the fold: legs and bells on the step, body, horns and fist up the door (horn tips reach 1.65 m on the leaf).
//           Put it in front of the door's raised panels (the bench uses z 0.07 on the halloween door). The horns and bells sway.
//   state   grow 0 (0 = nothing, 1 = full height up the door)   sway 0 (0..1 horn and bell rock)
//   spec    gait 0 / gaitPhase 0 are not used by the shadow.
//
// Assumptions: horn arc 1.365 m (the DESIGN 0.92 does not fit the 0.86 span and 2.50 tip); horn top at stoop 1 is 2.02 (DESIGN 1.98).
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
const frac = (x) => x - Math.floor(x);
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AXIS, a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AXIS, a);
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const arr = (v) => [v.x, v.y, v.z];
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hexOf = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
const mixHex = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return hexOf(A.map((v, i) => v + (B[i] - v) * t)); };
const GLOW = new THREE.Color("#ffc23a");

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map();   // every drawn texture and shared geometry is made once per page (pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function palette() {   // the same palette contract as the other animals (looks.js copies a standard material's colours once)
  const reg = (m) => { m.userData.c0 = m.color.clone(); return m; };
  return {
    m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o })),
    b: (color, o = {}) => reg(new THREE.MeshBasicMaterial({ color, ...o })),
  };
}
const steam = (o) => { o.userData.steam = true; o.castShadow = o.receiveShadow = false; o.userData.noOutline = true; if (o.material) o.material.userData.noOutline = true; return o; };
const sph = () => once("kbSph", () => new THREE.SphereGeometry(1, 14, 10));

// 3D two-bone IK with a pole hint (props-bear.js): the middle joint between h and f; never farther than 0.9995 of the limb
function ik3(h, f, L1, L2, pole) {
  const d = [f[0] - h[0], f[1] - h[1], f[2] - h[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = [d[0] / dl, d[1] / dl, d[2] / dl];
  const dd = clamp(dl, Math.abs(L1 - L2) + 0.01, (L1 + L2) * 0.9995), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2];
  let p = [pole[0] - pd * u[0], pole[1] - pd * u[1], pole[2] - pd * u[2]]; const pl = Math.hypot(p[0], p[1], p[2]);
  p = pl < 1e-6 ? [0, 0, 1] : [p[0] / pl, p[1] / pl, p[2] / pl];
  return { E: [h[0] + u[0] * a + p[0] * hh, h[1] + u[1] * a + p[1] * hh, h[2] + u[2] * a + p[2] * hh], F: [h[0] + u[0] * dd, h[1] + u[1] * dd, h[2] + u[2] * dd], reach: dl - dd };
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
// a curved tapered tube along a Catmull-Rom curve through pts (horns excluded): radial sides, seg rings; r0 -> r1
function taperTube(pts, r0, r1, radial = 8, seg = 10, pw = 0.85, flat = 1) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pos = [], uv = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg; curve.getPointAt(u, P); curve.getTangentAt(u, T);
    N.crossVectors(T, Math.abs(T.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)).normalize(); B.crossVectors(T, N).normalize();
    const r = r0 + (r1 - r0) * Math.pow(u, pw), wn = Math.abs(N.x) >= Math.abs(B.x), rn = wn ? r : r * flat, rb = wn ? r * flat : r;
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU, c = Math.cos(a) * rn, s = Math.sin(a) * rb; pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); uv.push(u, j / radial); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const n0 = pos.length / 3; curve.getPointAt(0, P); pos.push(P.x, P.y, P.z); uv.push(0, 0.5); curve.getPointAt(1, P); pos.push(P.x, P.y, P.z); uv.push(1, 0.5);   // closed ends
  for (let j = 0; j < radial; j++) { idx.push(n0, j + 1, j); const a = seg * (radial + 1) + j; idx.push(n0 + 1, a, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a closed oval / any closed curve as a tube (rims, rings, links, belts)
function loopTube(pts, r, seg = 40, radial = 6) { const c = new THREE.CatmullRomCurve3(pts.map((p) => V3(p)), true); return new THREE.TubeGeometry(c, seg, r, radial, true); }
// a flat band along a path hugging a surface: nrm = outward normals; width across, thick out of the surface; uv u along, v across
function ribbon(pts, nrm, width, thick = 0.006) {
  const pos = [], uv = [], idx = [], n = pts.length, cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = V3(nrm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]])), N = V3(nrm3(nrm[i])), B = new THREE.Vector3().crossVectors(T, N).normalize(), P = V3(pts[i]);
    const c = [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([s, o]) => P.clone().addScaledVector(B, s * width / 2).addScaledVector(N, o * thick));
    for (const q of c) pos.push(q.x, q.y, q.z);
    uv.push(cum[i], 0, cum[i], 1, cum[i], 1, cum[i], 0);
  }
  const L = cum[n - 1] || 1; for (let i = 0; i < uv.length; i += 2) uv[i] /= L;
  for (let i = 0; i < n - 1; i++) { const a = i * 4, b = a + 4; idx.push(a + 3, a + 2, b + 3, a + 2, b + 2, b + 3, a, a + 3, b, a + 3, b + 3, b, a + 2, a + 1, b + 2, a + 1, b + 1, b + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const merge = (list) => mergeGeometries(list);
const mkSec = (c, w, up, dn, n = 2.4) => ({ c, w, up, dn, n });
const flatNormals = (g) => g;

// ---------------------------------------------------------------- colours (DESIGN B and the shared palette)
const C = {
  fur: "#2e2218", furSh: "#17100b", strand: "#5a4028", frost: "#dfeaf5", grey: "#6a6460", chestnut: "#5a3a22", cream: "#cfc4a8", black: "#1c1a1c", matted: "#3c2c20",
  mask: "#4a2e1c", maskSh: "#24140c", maskWorn: "#7a5234", oxred: "#7a2a1e", greygreen: "#4a5a48", bone: "#cfc4a8",
  horn: "#8a7458", hornSh: "#4e3f30", hornLt: "#c4b08a", hornTip: "#3a2c22",
  tongue: "#c8323a", tongueSh: "#8f1f2c", tongueLt: "#f08a8a", tongueGloss: "#ffc2c2", tongueUnder: "#e0787a",
  brass: "#c79a3a", brassSh: "#7a5a1c", brassLt: "#ffe9a0",
  wicker: "#b58a52", wickerSh: "#7a5a32", wickerGap: "#3a2a18", wickerLt: "#dcb87a",
  leather: "#4a2c1a", leatherEdge: "#2a1a10", leatherWorn: "#7a5234",
  iron: "#2a2420", rust: "#6a3a22", bloom: "#a85a2a",
  hoof: "#1c1612", hoofRim: "#6a5a48", skin: "#3a2a22", skinLt: "#5a4636", claw: "#1a1410",
  tooth: "#e6d8b0", toothRoot: "#b9a070", amber: "#e9b93a", amberC: "#ffd75a", pupil: "#1a120a",
  birch: "#ece6d8", birchDash: "#3a2e26", twig: "#4a3424", twine: "#b89a62",
  potato: "#e2a95c", scarf: "#c8322e", scarfDk: "#8f1f2c", scarfCream: "#f2e8d0",
  snow: "#cfdcf2", snowSh: "#7f95c4", snowLt: "#ffffff", puff: "#dfe6f2", halo: "#ffc23a", moon: "#0b0e22",
};
// the 5 fur colours of a runner (DESIGN: FUR, chestnut, grey, cream, black), 4 masks, 3 horn shapes
const FURS = [{ base: C.fur, sh: C.furSh, strand: C.strand }, { base: C.chestnut, sh: "#33200f", strand: "#8a5a38" }, { base: C.grey, sh: "#3e3a38", strand: "#9a948c" }, { base: C.cream, sh: "#8a8068", strand: "#efe6cc" }, { base: C.black, sh: "#0a0a0c", strand: "#403c42" }];
const MASKS = [{ base: C.mask, sh: C.maskSh, worn: C.maskWorn }, { base: C.oxred, sh: "#3e130d", worn: "#a8503a" }, { base: C.greygreen, sh: "#232d22", worn: "#7f907c" }, { base: C.bone, sh: "#8a8068", worn: "#efe6cc" }];

// ---------------------------------------------------------------- the numbers (DESIGN B), stand pose, metres; origin between the hooves, +x = his left
const HIP0 = [0, 0.98, -0.02], NB0 = [0, 1.70, 0.04], AT0 = [0, 1.80, 0.14], SH0 = 0.40, M0 = [0, 1.68, 0.45], JH0 = [0, 1.70, 0.30], TR0 = [0, 1.67, 0.40];
const LEG = { hx: 0.15, L1: 0.475, L2: 0.394, az: 0.02, ay: 0.16 }, ARM = { L1: 0.46, L2: 0.48, drop: 0.92 };
const STRIDE = 1.10, DUTY = 0.60, LIFT = 0.12, PH_L = 0.05, PH_R = 0.55;   // a cycle moves him 1.10 m; each hoof is planted 60 %; whole and half counts are double-support stances
// the torso loft: rows [y, centre z, half width, front depth, back depth, n]; a vertical spine with ref +z (front = "up"); lower = pelvis + belly, upper = chest + shoulders + hump
const LOWER_ROWS = [[0.86, -0.02, 0.30, 0.20, 0.22, 2.4], [0.93, -0.02, 0.37, 0.24, 0.26, 2.4], [1.02, -0.02, 0.39, 0.26, 0.27, 2.4], [1.14, -0.01, 0.37, 0.28, 0.27, 2.3], [1.26, 0.0, 0.37, 0.30, 0.28, 2.3], [1.34, 0.0, 0.385, 0.30, 0.285, 2.3]];
const UPPER_ROWS = [[1.26, 0.0, 0.37, 0.30, 0.28, 2.3], [1.38, 0.01, 0.40, 0.31, 0.29, 2.3], [1.50, 0.03, 0.46, 0.31, 0.30, 2.3], [1.60, 0.02, 0.52, 0.29, 0.31, 2.3], [1.70, -0.02, 0.50, 0.26, 0.30, 2.3], [1.79, -0.07, 0.41, 0.20, 0.30, 2.3], [1.86, -0.09, 0.31, 0.16, 0.28, 2.3], [1.895, -0.10, 0.19, 0.10, 0.23, 2.3], [1.915, -0.105, 0.07, 0.04, 0.12, 2.2]];
// the head: rows [y, front z, back z, half width, n] (a vertical spine, front = "up"), crown to the upper lip; the jaw hangs from JH0
const HEAD_ROWS = [[2.035, 0.20, 0.12, 0.03, 2.2], [2.015, 0.30, 0.04, 0.11, 2.6], [1.99, 0.365, -0.02, 0.15, 2.8], [1.955, 0.372, -0.03, 0.162, 3.0], [1.92, 0.374, -0.035, 0.168, 3.0], [1.885, 0.376, -0.03, 0.168, 3.0], [1.85, 0.392, -0.025, 0.162, 3.0], [1.81, 0.412, -0.01, 0.15, 3.0], [1.76, 0.428, 0.01, 0.135, 3.0], [1.715, 0.438, 0.04, 0.12, 3.0], [1.685, 0.436, 0.07, 0.102, 3.0], [1.67, 0.425, 0.10, 0.07, 2.6]];
const JAW_ROWS = [[1.69, 0.405, 0.07, 0.098, 3.0], [1.66, 0.436, 0.11, 0.094, 3.0], [1.62, 0.442, 0.15, 0.080, 3.0], [1.592, 0.446, 0.20, 0.060, 2.8], [1.572, 0.43, 0.24, 0.034, 2.4]];
const rowsToSec = (rows, oy = 0, oz = 0) => rows.map(([y, zc, w, f, b, n]) => mkSec([0, y - oy, zc - oz], w, f, b, n));
const headSec = (rows, oy, oz) => rows.map(([y, zf, zb, w, n]) => mkSec([0, y - oy, (zf + zb) / 2 - oz], w, (zf - zb) / 2, (zf - zb) / 2, n));
// the horn curve of the ram curl (left horn; the right is the mirror): up and back, out, down and forward, tips beside the cheeks. Points in stand coordinates.
const HORN_RAM = [[0.11, 2.02, 0.20], [0.135, 2.13, 0.16], [0.165, 2.25, 0.10], [0.21, 2.38, 0.02], [0.28, 2.47, -0.015], [0.34, 2.50, -0.02], [0.395, 2.45, 0.0], [0.425, 2.34, 0.05], [0.43, 2.20, 0.11], [0.42, 2.05, 0.19], [0.40, 1.94, 0.26], [0.375, 1.88, 0.295], [0.36, 1.86, 0.30]];
const HORN_GOAT = [[0.11, 2.02, 0.20], [0.14, 2.15, 0.14], [0.17, 2.28, 0.05], [0.20, 2.38, -0.06], [0.23, 2.45, -0.18], [0.26, 2.48, -0.30], [0.285, 2.47, -0.40]];
const HORN_LYRE = [[0.11, 2.02, 0.20], [0.16, 2.12, 0.17], [0.23, 2.24, 0.15], [0.30, 2.37, 0.15], [0.33, 2.50, 0.16], [0.32, 2.62, 0.17], [0.27, 2.70, 0.18]];
// jam: where the stick butts go (spec jamAt overrides), his frame
const JAM_AT = [0.15, 0.34, 0.85];

// ---------------------------------------------------------------- the pose solver (pure: shared by apply() and krampusPoints)
// Everything is in the prop's own frame (the stand coordinates). spec: mirror (the working hand and the stow claw swap sides), runner.
function solve(ps, spec = {}, t = 0) {
  const g = (k, d = 0) => ps[k] ?? spec[k] ?? d;
  const sT = clamp(g("stoop")), nz = clamp(g("nose")), tw = clamp(g("twist"), -1, 1), hy = clamp(g("headYaw"), -1, 1), hpi = clamp(g("headPitch"), -1, 1);
  const sn = g("sniff"), snA = Math.sin(Math.PI * frac(sn)) ** 2, jam = clamp(g("jam")), stow = clamp(g("stow", 1));
  const gt = g("gait"), gw = sstep(gt / 0.15), slope = Math.tan(rad(g("slope")));
  const mir = spec.mirror ? 1 : -1;   // x sign of the working (right) shoulder: his right is -x; mirror puts it on +x
  const jamAt = (ps.jamAt ?? spec.jamAt ?? JAM_AT).slice();   // given in his frame for the default hand; mirror flips x
  // ---- the walk: planted 60 %, 0.55 m a step, hips dip 3 cm at the stances, sway 5 degrees
  const dip = -0.03 * gw * (0.5 + 0.5 * Math.cos(2 * TAU * gt)), roll = rad(5) * gw * Math.sin(TAU * gt);
  const feet = [1, -1].map((s) => {
    const f = frac(gt + (s > 0 ? PH_L : PH_R)), [dz, lf] = footPath(f, STRIDE * DUTY, DUTY, LIFT), z = LEG.az + dz * gw, lift = lf * gw;
    const yg = slope * z;
    return { s, z, lift, yg, f };
  });
  const meanYg = (feet[0].yg + feet[1].yg) / 2;
  const H = new THREE.Vector3(0, HIP0[1] - 0.06 * sT + dip + meanYg, HIP0[2]);
  const Qp = qZ(roll).multiply(qX(rad(42) * sT)), Qc = Qp.clone().multiply(qY(rad(30) * tw));
  const lift2 = 0.02 * snA;   // the shoulders rise 2 cm on a sniff
  const chestPt = (p) => V3(p).sub(V3(HIP0)).applyQuaternion(Qc).add(H).add(V3([0, lift2, 0]));
  const pelPt = (p) => V3(p).sub(V3(HIP0)).applyQuaternion(Qp).add(H);
  // ---- the head: the neck stretches (stoop: the head hangs forward over the boot; nose: up and forward), the head turns about the atlas
  const stretch = V3([0, 0.13 * sT + 0.10 * nz, 0.27 * sT + 0.14 * nz]);
  const NB = chestPt(NB0), AW = chestPt(AT0).add(stretch);
  const headQ = qY(rad(30 * tw + 65 * hy)).multiply(qX(rad(62 * sT - 28 * nz + 30 * hpi)));
  const headPlace = (p) => V3(p).sub(V3(AT0)).applyQuaternion(headQ).add(AW);   // a stand point of the head frame -> the prop frame
  const jawA = rad(32) * clamp(g("jaw"));
  const jawPlace = (p) => { const q = V3(p).sub(V3(JH0)).applyAxisAngle(X_AXIS, jawA).add(V3(JH0)); return headPlace(arr(q)); };
  // ---- legs: hip (+-0.15, y, -0.02) -> hock (backward knee) -> fetlock; the hoof under it, toes out 12 degrees
  const legs = feet.map((fo) => {
    const s = fo.s, hip = pelPt([s * LEG.hx, HIP0[1], HIP0[2]]), ank = [s * LEG.hx, fo.yg + LEG.ay + fo.lift, fo.z];
    const k = ik3(arr(hip), ank, LEG.L1, LEG.L2, [0, 0.0, -1]);
    const pitch = -rad(28) * clamp(fo.lift / LIFT), hq = qY(-s * rad(12)).multiply(qX(pitch));
    return { s, hip: arr(hip), hock: k.E, ank: k.F, hq, fo };
  });
  // ---- arms: shoulders (+-0.40, 1.66, 0.02), 0.46 + 0.48; hanging plumb; the working one jams; the other stows
  const wk = mir, jDrop = 0.04 * sstep((jam - 0.7) / 0.3);
  const arms = [1, -1].map((s) => {
    const work = s === wk, sh0 = chestPt([s * SH0, 1.66, 0.02]);
    const phi = -s * rad(12) * gw * Math.cos(TAU * (gt + PH_L));   // swings against the leg on its side
    let hang = sh0.clone().add(V3([s * 0.03, -ARM.drop * Math.cos(phi), ARM.drop * Math.sin(phi) + 0.05]));
    let target = hang.clone(), fist = null, grip = 0, shoulder = sh0.clone(), bunchDir = [0, 1, 0];
    if (work) {
      shoulder.y -= jDrop;
      const f0 = hang.clone().add(V3([0, 0.05, 0.05])), f5 = shoulder.clone().add(V3([-s * 0.02, 0.04, 0.38]));
      const butt = V3(jamAt), f1 = butt.clone().add(V3([0, 0.10, 0]));
      const j = jam;
      fist = j <= 0.5 ? f0.clone().lerp(f5, sstep(j / 0.5)).add(V3([0, 0, 0])) : f5.clone().lerp(f1, sstep((j - 0.5) / 0.5)).add(V3([0, 0.14 * Math.sin(Math.PI * clamp((j - 0.5) / 0.5)), 0.04 * Math.sin(Math.PI * clamp((j - 0.5) / 0.5))]));
      // the shoulder reaches (protracts) toward a far fist so the 0.94 m arm gets there: up to 0.12 m
      const dv = fist.clone().sub(shoulder), over = Math.max(0, dv.length() - (ARM.L1 + ARM.L2) * 1.06 + 0.02);
      if (over > 0) shoulder.addScaledVector(dv.normalize(), Math.min(over, 0.12));
      const dir = fist.clone().sub(shoulder).normalize();
      target = fist.clone().addScaledVector(dir, -0.07);
      // bunch axis (his frame): jam 0 hangs a little forward, 0.5 upright, 1 upright (butt down in the boot); the twigs always up
      const ph = j <= 0.5 ? lerp(rad(150), rad(8), sstep(j / 0.5)) : lerp(rad(8), 0, sstep((j - 0.5) / 0.5));
      bunchDir = [0, Math.cos(ph), Math.sin(ph)];
      grip = 1;
    } else if (!spec.runner && stow < 1) {
      // the stow claw: up and back over the shoulder holding the kid by the scarf (stow 0), opens (0.3), the arm comes down (0.4 -> 1)
      const up = chestPt([s * 0.30, 2.40, -0.40]);
      const k = sstep((stow - 0.4) / 0.6);
      target = up.clone().lerp(hang, k); grip = 1 - sstep((stow - 0.2) / 0.15);
      if (stow < 0.4) { target = up; }
    }
    const pole = work ? [s * 0.4, -0.2, -1] : [s * 0.5, -0.3, -1];
    const k = ik3(arr(shoulder), arr(target), ARM.L1 * 1.04, ARM.L2 * 1.04, pole);
    return { s, work, sh: arr(shoulder), elbow: k.E, wrist: k.F, fist: fist && arr(fist), grip, bunchDir, short: k.reach };
  });
  return { sT, nz, tw, hy, hpi, snA, jam, stow, gt, gw, H, Qp, Qc, chestPt, pelPt, NB, AW, headQ, headPlace, jawA, jawPlace, legs, arms, dip, roll, stretch, wk, jamAt, lift2 };
}

// the world places the director needs, for any state, with the prop at {x, y, z, rot, scale}: M (between the front teeth, jaw shut), crown, horn top,
// the tongue root, the 7 stick butts' middle (jam), the lid's free edge, the basket rim centre, the atlas. params = state keys + spec (mirror, jamAt)
export function krampusPoints(params = {}, at = {}) {
  const Z = solve(params, params, params.t ?? 0), sc = at.scale ?? 1, r = rad(at.rot ?? 0), c = Math.cos(r), s = Math.sin(r);
  const place = (v) => { const x = v.x * sc, y = v.y * sc, z = v.z * sc; return [(at.x ?? 0) + x * c + z * s, (at.y ?? 0) + y, (at.z ?? 0) - x * s + z * c]; };
  const lid = clamp(params.lid ?? 0), ang = rad(75) * lid;
  const jb = Z.arms.find((a) => a.work);
  return {
    M: place(Z.headPlace(M0)), crown: place(Z.headPlace([0, 2.04, 0.20])), hornTop: place(Z.headPlace([0.37, 2.50, -0.02])), tongueRoot: place(Z.headPlace(TR0)),
    atlas: place(Z.AW), rim: place(Z.chestPt([0, 2.08, -0.66])), lidEdge: place(Z.chestPt([0, 2.08 + 0.60 * Math.sin(ang), -0.94 + 0.60 * Math.cos(ang)])),
    butts: jb && jb.fist ? place(V3(jb.fist).addScaledVector(V3(jb.bunchDir), -0.10)) : null, hand: jb ? place(V3(jb.wrist)) : null, reachShort: jb ? jb.short : 0,
  };
}


// ---------------------------------------------------------------- the skins as surfaces: a point on a loft at height y and round-parameter v (0 and 1 = the dn side, 0.5 = the front)
const TORSO = [...LOWER_ROWS.slice(0, 5), ...UPPER_ROWS].map(([y, zc, w, f, b, n]) => ({ y, zc, w, f, b, n }));   // ascending y; the lofts' spine runs up: side = -x, v 0.25 = his RIGHT, 0.75 = LEFT
const HEADR = HEAD_ROWS.map(([y, zf, zb, w, n]) => ({ y, zc: (zf + zb) / 2, w, f: (zf - zb) / 2, b: (zf - zb) / 2, n }));   // descending y; the spine runs down: side = +x, v 0.25 = his LEFT
function interpRows(rows, y) {
  const asc = rows[1].y > rows[0].y; let i = 0;
  while (i < rows.length - 2 && (asc ? y > rows[i + 1].y : y < rows[i + 1].y)) i++;
  const a = rows[i], b = rows[i + 1], f = clamp((y - a.y) / (b.y - a.y)), o = { i, f };
  for (const k of ["zc", "w", "f", "b", "n"]) o[k] = a[k] + (b[k] - a[k]) * f;
  return o;
}
function surfAt(rows, sideSign, y, v, lift = 0) {
  const r = interpRows(rows, y), a = rad(-90 + 360 * v), c = Math.cos(a), s = Math.sin(a), e = 2 / r.n;
  const x = sideSign * Math.sign(c) * Math.abs(c) ** e * (r.w + lift), z = r.zc + Math.sign(s) * Math.abs(s) ** e * ((s > 0 ? r.f : r.b) + lift);
  const nl = Math.hypot(x, z - r.zc) || 1;
  return { p: [x, y, z], n: [x / nl, 0, (z - r.zc) / nl] };
}
const torsoSurf = (y, v, lift = 0) => surfAt(TORSO, -1, y, v, lift);
const headSurf = (y, v, lift = 0) => surfAt(HEADR, 1, y, v, lift);
// texture coordinates of the head loft: u along (0 crown .. 1 upper lip), v round; a metric point (x, y) on the front -> canvas pixel
function headUV(x, y, W, H, rows = HEADR) {
  const r = interpRows(rows, Math.max(rows[rows.length - 1].y, Math.min(rows[0].y, y))), u = clamp((rows[0].y - y) / (rows[0].y - rows[rows.length - 1].y));
  const q = clamp(x / r.w, -1, 1), c = Math.sign(q) * Math.abs(q) ** (r.n / 2), v = 0.5 - Math.asin(c) / TAU;
  return [u * W, (1 - v) * H];
}
// the carved relief of the mask, metres along the surface normal at (x, y) on the front: ONE surface with a heavy V brow ridge, deep eye sockets, cheekbones, a long muzzle, furrows
const gss = (d, sg) => Math.exp(-(d * d) / (sg * sg));
function headRelief(x, y) {
  const ax = Math.abs(x), brow = 0.052 * gss(y - (1.952 + 0.30 * ax), 0.018) * (1 - sstep((ax - 0.125) / 0.05)), shelf = -0.02 * gss(y - (1.925 + 0.15 * ax), 0.016) * (1 - sstep((ax - 0.11) / 0.05));   // the brow overhangs the sockets
  const sock = -0.026 * Math.exp(-(((ax - 0.075) / 0.038) ** 2 + ((y - 1.90) / 0.028) ** 2)), cheek = 0.02 * Math.exp(-(((ax - 0.118) / 0.034) ** 2 + ((y - 1.835) / 0.026) ** 2));
  const bridge = 0.012 * Math.exp(-((x / 0.017) ** 2)) * sstep((1.96 - y) / 0.03) * (1 - sstep((1.80 - y) / 0.04)), snout = 0.05 * Math.exp(-((x / 0.056) ** 2 + ((y - 1.775) / 0.036) ** 2)), pads = 0.014 * Math.exp(-(((ax - 0.027) / 0.016) ** 2 + ((y - 1.772) / 0.014) ** 2));   // a goat snout: bridge, a forward muzzle (tip z 0.47), two nostril pads
  const fore = 0.012 * Math.exp(-((x / 0.11) ** 2 + ((y - 2.0) / 0.045) ** 2));
  const sx = 0.10 - 0.055, sy = 1.70 - 1.80, t = clamp(((ax - 0.055) * sx + (y - 1.80) * sy) / (sx * sx + sy * sy)), dx = ax - (0.055 + sx * t), dy = y - (1.80 + sy * t), furrow = -0.01 * gss(Math.hypot(dx, dy), 0.009);   // nose wing -> mouth corner
  return brow + shelf + sock + cheek + bridge + snout + pads + fore + furrow;
}
function carveHead(g, rows, relief) {
  const p = g.attributes.position, uv = g.attributes.uv, nm = g.attributes.normal, y0 = rows[0].y, y1 = rows[rows.length - 1].y, d = [];
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); uv.setX(i, clamp((y0 - y) / (y0 - y1))); if (relief) d.push(relief(p.getX(i), y) * clamp((nm.getZ(i) - 0.1) / 0.6)); }
  if (relief) { for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + nm.getX(i) * d[i], p.getY(i) + nm.getY(i) * d[i], p.getZ(i) + nm.getZ(i) * d[i]); p.needsUpdate = true; g.computeVertexNormals(); }
  uv.needsUpdate = true; return g;
}
const TORSO_Y0 = 0.86, TORSO_Y1 = 1.915;
const torsoTexU = (y) => (y - TORSO_Y0) / (TORSO_Y1 - TORSO_Y0);

// ---------------------------------------------------------------- the 240 locks, by hand (DESIGN): crown + nape 24, ruff 18, cape 44, chest + belly 36, arms 2 x 20, hip skirt 38, legs 2 x 20
// each: frame (head | chest | pel | arm0 | arm1 | leg0 | leg1), p = root in that frame (limbs: u along the bones, the root offset), n = out direction, L length, r0 half width.
const rr = (a, b, i) => a + (b - a) * rnd(i);
function makeLockDefs() {
  const out = [];
  const add = (cls, frame, p, n, L, r0, extra = {}) => { const id = out.length; out.push({ id, cls, frame, p, n: nrm3(n), L, r0, strands: 3 + (id % 3), clump: 0, tint: "", frost: false, bead: false, ...extra }); return id; };
  // crown and nape: 3 rows of 8 on the back of the skull, hanging over the neck (0.14-0.22)
  [[2.02, 0.07, 0.10], [1.97, -0.015, 0.15], [1.91, -0.025, 0.155]].forEach(([y, z, sp], ri) => { for (let i = 0; i < 8; i++) { const x = -sp + (2 * sp * i) / 7, id = out.length; add("crown", "head", [x, y, z], [x * 3, 0.15, -1], rr(0.14, 0.22, id * 5 + 1), rr(0.024, 0.042, id * 5 + 2)); } });
  // ruff round the face: 9 a side down the cheek line and under the jaw (0.16-0.26)
  for (const s of [1, -1]) for (let i = 0; i < 9; i++) { const t = i / 8, id = out.length; add("ruff", "head", [s * (0.168 - 0.075 * t), 1.955 - 0.33 * t, 0.15 + 0.15 * t], [s * 0.9, -0.1, 0.35], rr(0.16, 0.26, id * 5 + 1), rr(0.02, 0.036, id * 5 + 2)); }
  // shoulder cape: 2 rows of 22 over the shoulders and down the back (0.40-0.55)
  for (const [y, v0, v1] of [[1.76, 0.60, 1.40], [1.58, 0.68, 1.32]]) for (let i = 0; i < 22; i++) { const v = (v0 + ((v1 - v0) * i) / 21) % 1, sf = torsoSurf(y, v, -0.012), id = out.length; add("cape", "chest", sf.p, [sf.n[0], 0.15, sf.n[2]], rr(0.40, 0.55, id * 5 + 1), rr(0.03, 0.045, id * 5 + 2)); }
  // chest and belly: 3 rows of 12 on the front (0.25-0.38)
  for (const y of [1.50, 1.37, 1.24]) for (let i = 0; i < 12; i++) { const v = 0.355 + (0.29 * i) / 11, sf = torsoSurf(y, v, -0.012), id = out.length; add("chest", "chest", sf.p, [sf.n[0], 0.1, sf.n[2]], rr(0.25, 0.38, id * 5 + 1), rr(0.026, 0.042, id * 5 + 2)); }
  // arms: 12 in a ragged cuff 10 cm above the wrist + 8 along the outer back of the arm (0.18-0.30)
  for (const k of [0, 1]) { const s = k === 0 ? 1 : -1;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, id = out.length; add("arm", `arm${k}`, [1.84, Math.cos(a) * 0.075, Math.sin(a) * 0.075], [Math.cos(a), 0.1, Math.sin(a)], rr(0.18, 0.24, id * 5 + 1), rr(0.02, 0.03, id * 5 + 2), { cuff: true }); }
    for (let i = 0; i < 8; i++) { const u = 0.15 + 1.5 * (i / 7), id = out.length, a = 2.4 + 0.5 * Math.sin(i * 1.7); add("arm", `arm${k}`, [u, Math.cos(a) * 0.085 * s, Math.sin(a) * 0.085], [s * 0.7, 0.1, -0.7], rr(0.22, 0.30, id * 5 + 1), rr(0.026, 0.040, id * 5 + 2)); } }
  // hip skirt: a ring of 38 round the hips (0.30-0.45)
  for (let i = 0; i < 38; i++) { const sf = torsoSurf(1.06, i / 38, -0.012), id = out.length; add("hip", "pel", sf.p, [sf.n[0], 0.05, sf.n[2]], rr(0.30, 0.45, id * 5 + 1), rr(0.03, 0.045, id * 5 + 2)); }
  // legs: 14 down the thigh and shin + 6 of fetlock hair over the hoof (0.20-0.32)
  for (const k of [0, 1]) { const s = k === 0 ? 1 : -1;
    for (let i = 0; i < 14; i++) { const u = 0.10 + 1.55 * (i / 13), id = out.length, a = [-0.4, 0.5, 1.4][i % 3] + (i % 2) * 0.9; add("leg", `leg${k}`, [u, Math.cos(a) * 0.09 * s * (i % 2 ? -0.4 : 1), Math.sin(a) * 0.09], [s * 0.6, 0.05, 0.4], rr(0.20, 0.32, id * 5 + 1), rr(0.022, 0.036, id * 5 + 2)); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, id = out.length; add("leg", `leg${k}`, [1.93, Math.cos(a) * 0.055, Math.sin(a) * 0.055], [Math.cos(a), 0.0, Math.sin(a)], rr(0.16, 0.22, id * 5 + 1), rr(0.016, 0.026, id * 5 + 2), { fetlock: true }); } }
  // clumps of 2-3 (they stick together and share a sway), 30 lighter strands, 12 grey, 60 frosted tips, 30 ice beads
  let ci = 0; for (let i = 0; i < out.length;) { const m = 2 + (rnd(ci * 3 + 1) > 0.5 ? 1 : 0); for (let k = 0; k < m && i < out.length; k++, i++) out[i].clump = ci; ci++; }
  const order = (list, salt) => list.slice().sort((a, b) => rnd(a.id * 3.7 + salt) - rnd(b.id * 3.7 + salt));
  const pool = order(out, 1); pool.slice(0, 30).forEach((l) => { l.tint = "light"; }); pool.slice(30, 42).forEach((l) => { l.tint = "grey"; });
  order(out.filter((l) => l.cls === "crown"), 2).slice(0, 10).forEach((l) => { l.frost = true; });
  order(out.filter((l) => l.cls === "cape"), 3).slice(0, 30).forEach((l) => { l.frost = true; });
  for (const k of [0, 1]) order(out.filter((l) => l.frame === `arm${k}` && l.cuff), 4 + k).slice(0, 10).forEach((l) => { l.frost = true; });
  order(out.filter((l) => l.cls === "cape"), 6).slice(0, 20).forEach((l) => { l.bead = true; }); order(out.filter((l) => l.cls === "ruff"), 7).slice(0, 10).forEach((l) => { l.bead = true; });
  return out;
}
const LOCKS = makeLockDefs();
// 150 gouge strokes (brow -> temple, cheek -> jaw), 40 grain lines, 3 hairline checks, 2 woodworm clusters: the carved face, each mark once from its index
const GOUGES = [];
for (let i = 0; i < 150; i++) {
  const r = i < 45 ? 0 : i < 85 ? 1 : 2, h = (k) => rnd(i * 11 + k), s = h(9) < 0.5 ? 1 : -1;
  let x, y, dx, dy;
  if (r === 0) { x = s * (0.02 + 0.12 * h(1)); y = 1.955 + 0.065 * h(2); dx = s * 1; dy = 0.35; }          // brow to temple: out and up
  else if (r === 1) { x = s * (0.10 + 0.06 * h(1)); y = 1.84 + 0.12 * h(2); dx = s * 0.35; dy = 1; }       // temple: up the side of the head
  else { x = s * (0.03 + 0.11 * h(1)); y = 1.70 + 0.16 * h(2); dx = -s * 0.5; dy = -1; }                  // cheek to jaw: down and in
  const n = Math.hypot(dx, dy), len = 0.04 + 0.05 * h(3), w = 0.008 + 0.008 * h(4), a = Math.atan2(dy, dx) + (h(5) - 0.5) * 0.5;
  GOUGES.push({ x, y, len, w, a });
}
const GRAIN = Array.from({ length: 40 }, (_, i) => ({ x: -0.15 + (0.30 * (i + 0.5)) / 40 + (rnd(i * 3 + 1) - 0.5) * 0.004, ph: rnd(i * 3 + 2) * TAU, amp: 0.002 + 0.004 * rnd(i * 3 + 3) }));
const CHECKS = [{ name: "left brow", pts: [[0.06, 1.995], [0.075, 2.015], [0.085, 2.04], [0.092, 2.07]] }, { name: "right cheek", pts: [[-0.13, 1.85], [-0.125, 1.83], [-0.12, 1.805]] }, { name: "chin", pts: [[0.01, 1.60], [0.012, 1.585], [0.008, 1.57]] }];
const WORMS = [{ x: 0.155, y: 1.935, n: 6 }, { x: -0.105, y: 1.725, n: 7 }];


// ---------------------------------------------------------------- painted textures (browser only; every mark drawn once from its index and the seed)
const CROSS_STRAP = [[1.82, 0.14], [1.78, 0.22], [1.68, 0.30], [1.56, 0.37], [1.44, 0.45], [1.32, 0.54], [1.20, 0.63], [1.08, 0.72], [1.03, 0.76]];   // right shoulder -> left hip, (y, v)
const BASKET_STRAP = [[1.88, 0.06], [1.82, 0.13], [1.75, 0.20], [1.66, 0.27], [1.54, 0.33], [1.42, 0.37], [1.30, 0.395], [1.16, 0.41]];   // over the right shoulder (the left is the mirror, v -> 1 - v)
const BELT_Y = 1.10, BELT_W = 0.09;
const lockTex = (fi, strands, tint, frost) => once(`kbLock2${fi}${strands}${tint}${frost}`, () => cvs(128, 256, (g, W, H) => {   // canvas top = the tip, bottom = the root; x across the width (both faces)
  const F = FURS[fi], light = tint === "light", grey = tint === "grey";
  const mid = light ? mixHex(F.base, "#d8b27a", 0.38) : grey ? mixHex(F.base, C.grey, 0.7) : mixHex(F.base, F.strand, 0.4), tipC = light ? "#d9bd8c" : grey ? "#a8a29c" : mixHex(F.base, F.strand, 0.72);
  const sc = light ? mixHex(F.strand, "#d8b27a", 0.55) : grey ? "#948e88" : F.strand;
  const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, F.sh); gr.addColorStop(0.2, mixHex(F.sh, mid, 0.6)); gr.addColorStop(0.5, mid); gr.addColorStop(1, tipC); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.lineCap = "round"; const n = strands * 5 + 4;
  for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, x0 = W * (0.05 + 0.9 * f), x1 = W * (0.5 + (f - 0.5) * 0.08), wob = (rnd(k * 7 + strands * 3 + fi) - 0.5) * 14, dark = k % 3 === 1;
    g.strokeStyle = dark ? F.sh : sc; g.globalAlpha = dark ? 0.6 : 0.9; g.lineWidth = dark ? 1.8 : 2.2 + (k % 2) * 1.2; g.beginPath(); g.moveTo(x0, H); g.bezierCurveTo(x0 + wob, H * 0.66, x1 - wob * 0.5, H * 0.32, x1, 0); g.stroke();
    if (!dark && k % 2 === 0) { g.strokeStyle = tipC; g.globalAlpha = 0.5; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0 + 3, H * 0.9); g.bezierCurveTo(x0 + wob + 3, H * 0.6, x1 - wob * 0.5 + 2, H * 0.3, x1, H * 0.02); g.stroke(); } }
  g.globalAlpha = 1;
  const ge = g.createLinearGradient(0, 0, W, 0); ge.addColorStop(0, `rgba(${rgbOf(F.sh).join(",")},0.6)`); ge.addColorStop(0.2, `rgba(${rgbOf(F.sh).join(",")},0)`); ge.addColorStop(0.8, `rgba(${rgbOf(F.sh).join(",")},0)`); ge.addColorStop(1, `rgba(${rgbOf(F.sh).join(",")},0.6)`); g.fillStyle = ge; g.fillRect(0, 0, W, H);   // the edges turn away: darker
  if (frost) { const gf = g.createLinearGradient(0, H * 0.34, 0, 0); gf.addColorStop(0, "rgba(223,234,245,0)"); gf.addColorStop(0.5, "rgba(223,234,245,0.7)"); gf.addColorStop(1, "rgba(235,244,252,0.98)"); g.fillStyle = gf; g.fillRect(0, 0, W, H * 0.34); }
}));
// the skin painted with 900 fur strokes: torso 540, neck 60, each arm 60, each leg 90; patches of matted underfur (elbows, under the 3 straps, the belt line)
const FUR_STROKES = { torso: 540, neck: 60, arm0: 60, arm1: 60, leg0: 90, leg1: 90 };
const furTex = (kind, fi) => once(`kbFur${kind}${fi}`, () => { const torso = kind === "torso", W = torso ? 1024 : 256, H = torso ? 1024 : 256, F = FURS[fi]; return cvs(W, H, (g) => {
  const lit = mixHex(F.base, F.strand, 0.78), gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, mixHex(F.sh, lit, 0.5)); gr.addColorStop(0.5, lit); gr.addColorStop(1, mixHex(lit, F.sh, 0.35)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.lineCap = "round";
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${rgbOf(F.sh).join(",")},0.25)`; g.beginPath(); g.ellipse(rnd(i * 7 + 1) * W, rnd(i * 7 + 2) * H, 14 + 30 * rnd(i * 7 + 3), 10 + 22 * rnd(i * 7 + 4), 0, 0, TAU); g.fill(); }
  const patch = (x, y, rx, ry) => { for (let k = 0; k < 7; k++) { g.fillStyle = `rgba(${rgbOf(C.matted).join(",")},0.5)`; g.beginPath(); g.ellipse(x + (rnd(k * 5 + x) - 0.5) * rx * 0.5, y + (rnd(k * 5 + y + 1) - 0.5) * ry * 0.5, rx * (0.6 + 0.4 * rnd(k)), ry * (0.6 + 0.4 * rnd(k + 9)), 0, 0, TAU); g.fill(); } };
  if (torso) {
    const pt = (y, v) => [torsoTexU(y) * W, (1 - v) * H];
    for (let x = 0; x < W; x += 18) patch(...pt(BELT_Y, x / W), 34, 0.032 * W);   // the belt line: the rubbed band all round
    for (const [y, v] of CROSS_STRAP) patch(...pt(y, v), 30, 36);
    for (const [y, v] of BASKET_STRAP) { patch(...pt(y, v), 28, 34); patch(...pt(y, 1 - v), 28, 34); }
  } else if (kind.startsWith("arm")) patch(W * 0.5, H * 0.5, 40, 50);   // the elbow
  const N = FUR_STROKES[kind], base = kind === "torso" ? 1 : kind === "neck" ? 3 : kind === "arm0" ? 5 : kind === "arm1" ? 7 : kind === "leg0" ? 9 : 11;
  for (let i = 0; i < N; i++) {
    const h = (k) => rnd((i + base * 977) * 13 + k), x0 = h(1) * W, y0 = h(2) * H, len = (torso ? 40 : 28) * (0.6 + 0.8 * h(3)), a = Math.PI + (h(4) - 0.5) * 0.9, dark = i % 2 === 0;   // the hair lies down the body: toward lower y (left in the torso map)
    g.strokeStyle = dark ? F.sh : mixHex(F.strand, "#a87a4a", 0.35); g.lineWidth = dark ? 3 + 2 * h(5) : 2.4 + 1.6 * h(5); g.globalAlpha = 0.9; g.beginPath(); g.moveTo(x0, y0);
    g.quadraticCurveTo(x0 + Math.cos(a) * len * 0.5, y0 + Math.sin(a) * len * 0.5 + (h(6) - 0.5) * 10, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len + (h(6) - 0.5) * 14); g.stroke();
  }
  g.globalAlpha = 1;
}); });
// the carved mask: face (crown -> upper lip, x along, round v) and jaw. All marks go through headUV so they sit where the metric point is.
function maskPaint(g, W, H, M, jaw, gouges) {
  const rows = jaw ? JAWR : HEADR, uv = (x, y) => headUV(x, y, W, H, rows);
  const poly = (pts, fill, a = 1) => { g.fillStyle = fill; g.globalAlpha = a; g.beginPath(); pts.forEach((p, i) => { const q = uv(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fill(); g.globalAlpha = 1; };
  const line = (pts, col, wM, a = 1) => { const l = []; const r = []; for (let i = 0; i < pts.length; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, wi = wM * Math.sin(Math.PI * (0.12 + 0.76 * (i / Math.max(1, pts.length - 1)))) / 2 + 0.0006; l.push([pts[i][0] + nx * wi, pts[i][1] + ny * wi]); r.push([pts[i][0] - nx * wi, pts[i][1] - ny * wi]); } poly([...l, ...r.reverse()], col, a); };
  const ell = (x, y, rx, ry, col, a = 1) => { const pts = []; for (let k = 0; k < 16; k++) pts.push([x + Math.cos((k / 16) * TAU) * rx, y + Math.sin((k / 16) * TAU) * ry]); poly(pts, col, a); };
  const soft = (x, y, rx, ry, col, a) => { for (let k = 0; k < 6; k++) ell(x, y, rx * (1 - k * 0.15), ry * (1 - k * 0.15), col, a * 0.3); };
  g.fillStyle = M.base; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, mixHex(M.base, M.worn, 0.22)); gr.addColorStop(1, mixHex(M.base, M.sh, 0.2)); g.globalAlpha = 0.5; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) soft(-0.15 + 0.3 * rnd(i * 5 + 1), (jaw ? 1.57 : 1.675) + (jaw ? 0.12 : 0.355) * rnd(i * 5 + 2), 0.03 + 0.04 * rnd(i * 5 + 3), 0.012 + 0.02 * rnd(i * 5 + 4), i % 2 ? M.sh : M.worn, 0.22);   // the patina: broad drifts of tone
  const yTop = jaw ? 1.69 : 2.03, yBot = jaw ? 1.57 : 1.675;
  for (const gr_ of GRAIN) { const pts = []; for (let k = 0; k <= 24; k++) { const y = yTop + (yBot - yTop) * (k / 24); pts.push([gr_.x + Math.sin(y * 40 + gr_.ph) * gr_.amp, y]); } line(pts, M.sh, 0.0014, 0.3); line(pts.map(([x, y]) => [x + 0.0018, y]), M.worn, 0.0009, 0.14); }   // 40 fine grain lines, chin to brow
  if (!jaw) {
    for (const s of [1, -1]) {   // the shade that gathers in the recesses
      soft(s * 0.075, 1.90, 0.056, 0.04, "#0a0604", 0.9); soft(s * 0.075, 1.935, 0.085, 0.026, "#0a0604", 0.95); soft(s * 0.075, 1.90, 0.07, 0.045, "#0a0604", 0.7); soft(s * 0.028, 1.772, 0.02, 0.016, "#0a0604", 0.8); ell(s * 0.029, 1.772, 0.013, 0.006, "#000000", 0.95); soft(s * 0.118, 1.80, 0.04, 0.03, M.sh, 0.7); soft(s * 0.062, 1.785, 0.016, 0.055, M.sh, 0.7); soft(s * 0.10, 1.70, 0.03, 0.02, M.sh, 0.75); soft(s * 0.152, 1.93, 0.012, 0.05, M.sh, 0.6); }
    for (const s of [1, -1]) { for (let k = 0; k < 7; k++) { const x = s * (0.012 + 0.022 * k); soft(x, 1.952 + 0.30 * Math.abs(x) + 0.008, 0.03, 0.0105, M.worn, 0.85); }   // worn #7a5234 on the high points: the V of the brow,
      soft(s * 0.118, 1.842, 0.032, 0.024, M.worn, 0.8); soft(s * 0.05, 2.0, 0.03, 0.02, M.worn, 0.45); }   // the cheekbones, the forehead
    soft(0, 1.88, 0.016, 0.07, M.worn, 0.6); soft(0, 1.79, 0.035, 0.03, M.worn, 0.7); soft(0, 1.995, 0.04, 0.012, M.worn, 0.6); soft(0, 1.692, 0.06, 0.012, M.worn, 0.45);   // the bridge, the brow centre, the lip
    for (const s of [1, -1]) { ell(s * 0.075, 1.90, 0.042, 0.03, "#0a0604", 0.85); ell(s * 0.075, 1.90, 0.034, 0.024, "#000000", 0.7); }   // soot black in the sockets
    for (const s of [1, -1]) for (let k = 0; k < 4; k++) line([[s * 0.025, 1.975 + 0.012 * k], [s * 0.07, 1.984 + 0.012 * k], [s * 0.13, 1.995 + 0.014 * k]], M.sh, 0.0042, 0.8);   // 4 furrows a side over the brow
    for (const s of [1, -1]) for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.22; line([[s * 0.125, 1.83], [s * (0.115 - 0.02 * (1 - a)), 1.77], [s * (0.098 + 0.03 * a), 1.695]], M.sh, 0.0048, 0.8); }   // 3 furrows fanning from each cheekbone to the mouth corner
    if (gouges) for (const G of GOUGES) { const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, bend = Math.sin(t * Math.PI) * 0.18; pts.push([G.x + Math.cos(G.a + bend) * G.len * (t - 0.5), G.y + Math.sin(G.a + bend) * G.len * (t - 0.5)]); }
      line(pts, "#140a06", G.w * 1.0, 0.9); line(pts.map(([x, y]) => [x + 0.0028, y + 0.0028]), M.worn, G.w * 0.6, 0.8); }   // 150 gouge strokes: a dark cut with a worn lip
    for (const w of WORMS) for (let k = 0; k < w.n; k++) ell(w.x + (rnd(w.x * 100 + k) - 0.5) * 0.022, w.y + (rnd(w.y * 100 + k + 3) - 0.5) * 0.022, 0.0016, 0.0016, "#0a0604", 0.95);   // 2 woodworm clusters of 5-7 pinholes
    CHECKS.slice(0, 2).forEach((c) => line(c.pts, "#0a0604", 0.0026, 0.9));
    line([[-0.10, 1.683], [-0.07, 1.681], [-0.035, 1.68]], "#8a2a22", 0.004, 0.95); line([[0.035, 1.68], [0.07, 1.681], [0.10, 1.683]], "#8a2a22", 0.004, 0.95); line([[-0.035, 1.68], [0, 1.68], [0.035, 1.68]], "#24140c", 0.0022, 0.9);   // the lip line: old red paint rubbed off in the middle third
  } else {
    for (const s of [1, -1]) { soft(s * 0.085, 1.63, 0.03, 0.05, M.sh, 0.6); soft(s * 0.06, 1.675, 0.04, 0.012, M.worn, 0.4); }
    soft(0, 1.585, 0.035, 0.016, M.worn, 0.75);   // the worn chin
    line([[-0.10, 1.688], [-0.07, 1.686], [-0.035, 1.685]], "#8a2a22", 0.004, 0.95); line([[0.035, 1.685], [0.07, 1.686], [0.10, 1.688]], "#8a2a22", 0.004, 0.95);
    line(CHECKS[2].pts, "#0a0604", 0.0026, 0.9);
  }
}
const JAWR = JAW_ROWS.map(([y, zf, zb, w, n]) => ({ y, zc: (zf + zb) / 2, w, f: (zf - zb) / 2, b: (zf - zb) / 2, n }));
const maskTex = (mi, jaw, gouges) => once(`kbMask${mi}${jaw}${gouges}`, () => cvs(jaw ? 512 : 2048, jaw ? 512 : 1024, (g, W, H) => maskPaint(g, W, H, MASKS[mi], jaw, gouges)));
const tongueTex = () => once("kbTongue2", () => cvs(256, 128, (g, W, H) => {   // x along (root 0 .. tip 1), y round (canvas middle = the top face; the edges and the bottom are the underside)
  g.fillStyle = C.tongueSh; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, H * 0.12, 0, H * 0.88); gr.addColorStop(0, C.tongueSh); gr.addColorStop(0.3, C.tongue); gr.addColorStop(0.5, C.tongue); gr.addColorStop(0.7, C.tongue); gr.addColorStop(1, C.tongueSh); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = C.tongueSh; g.globalAlpha = 0.55; g.lineWidth = 3; g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W * 0.94, H * 0.5); g.stroke(); g.globalAlpha = 1;   // the centre groove, soft
  g.fillStyle = C.tongueGloss; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(W * 0.03, H * 0.405); g.lineTo(W * 0.78, H * 0.41); g.lineTo(W * 0.9, H * 0.425); g.lineTo(W * 0.78, H * 0.438); g.lineTo(W * 0.03, H * 0.44); g.fill(); g.globalAlpha = 1;   // ONE gloss line off centre
}));
const toothTex = (chip) => once(`kbTooth${chip}`, () => cvs(16, 64, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, C.toothRoot); gr.addColorStop(0.4, C.tooth); gr.addColorStop(1, "#f2e8c8"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));
const hoofTex = () => once("kbHoof", () => cvs(64, 64, (g, W, H) => { g.fillStyle = C.hoof; g.fillRect(0, 0, W, H); g.fillStyle = C.hoofRim; g.fillRect(0, H * 0.86, W, H * 0.14); for (const x of [7, 23, 40, 52]) { g.fillStyle = C.hoof; g.fillRect(x, H * 0.82, 6 + (x % 3), H * 0.06); }   // the pale rim, chipped
  g.strokeStyle = "#0c0a08"; g.lineWidth = 1; for (let k = 1; k <= 4; k++) { g.beginPath(); g.moveTo(0, H * (0.1 + 0.15 * k)); g.lineTo(W, H * (0.1 + 0.15 * k)); g.stroke(); } }));   // 4 growth lines
const bellTex = (edel) => once(`kbBell${edel}`, () => cvs(512, 256, (g, W, H) => {   // x along (the loop 0 .. the lip 1), y round (front at the middle)
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, C.brassSh); gr.addColorStop(0.25, C.brass); gr.addColorStop(0.62, "#d8ae48"); gr.addColorStop(1, C.brassSh); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = C.brassLt; g.globalAlpha = 0.55; g.fillRect(W * 0.56, 0, W * 0.12, H); g.globalAlpha = 1;   // the rubbed bright band round the belly
  for (let i = 0; i < 30; i++) { const x = W * (0.12 + 0.76 * rnd(i * 3 + 1)), y = H * rnd(i * 3 + 2), r = 6 + 4 * rnd(i * 3 + 3); g.fillStyle = "rgba(122,90,28,0.55)"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = "rgba(255,233,160,0.6)"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, TAU); g.fill(); }   // 30 hammer dimples
  g.strokeStyle = C.brassSh; g.lineWidth = 3; for (const y of [H * 0.25, H * 0.75]) { g.beginPath(); g.moveTo(W * 0.08, y); g.lineTo(W * 0.96, y); g.stroke(); }   // the 2 side seams
  if (edel) { g.strokeStyle = C.brassSh; g.fillStyle = "rgba(90,60,14,0.55)"; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.save(); g.translate(W * 0.42, H * 0.5); g.rotate(a); g.beginPath(); g.ellipse(0, 22, 7, 20, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); } for (const [dx, dy] of [[-5, 0], [4, 4], [3, -5]]) { g.beginPath(); g.arc(W * 0.42 + dx, H * 0.5 + dy, 3.5, 0, TAU); g.fill(); } }   // an edelweiss engraved
}));
const beltTex = (stitches) => once(`kbBelt${stitches}`, () => cvs(1024, 64, (g, W, H) => {
  g.fillStyle = C.leather; g.fillRect(0, 0, W, H); g.fillStyle = C.leatherEdge; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(122,82,52,${0.15 + 0.3 * rnd(i)})`; g.beginPath(); g.ellipse(rnd(i * 3) * W, rnd(i * 3 + 1) * H, 18 + 30 * rnd(i * 3 + 2), 5, 0, 0, TAU); g.fill(); }   // worn
  g.fillStyle = "#c9a878"; if (stitches) for (const y of [11, H - 12]) for (let i = 0; i < 60; i++) { const x = W * 0.25 + (W * 0.5 * (i + 0.5)) / 60; g.fillRect(x - 3, y - 1, 6, 2); }   // 2 stitch rows, 60 stitches on the front
  else { g.fillStyle = "#c9a878"; for (const y of [11, H - 12]) for (let x = 6; x < W; x += 16) g.fillRect(x, y - 1, 6, 2); }
}));
const barkTex = () => once("kbBark", () => cvs(256, 256, (g, W, H) => {   // 8 columns of 32: the 7 sticks of a bunch + 1; each 5-8 dark dashes
  for (let c = 0; c < 8; c++) { g.fillStyle = C.birch; g.fillRect(c * 32, 0, 32, H); g.fillStyle = "rgba(180,170,150,0.35)"; g.fillRect(c * 32, 0, 5, H);
    const n = 5 + ((c * 3) % 4); g.fillStyle = C.birchDash; for (let k = 0; k < n; k++) { const y = H * ((k + 0.3 + 0.5 * rnd(c * 9 + k)) / n), w = 8 + 14 * rnd(c * 9 + k + 2); g.fillRect(c * 32 + 8 * rnd(c * 9 + k + 5), y, w, 2.4); } }
}));
const scarfTex = (rows) => once(`kbScarf${rows}`, () => { const t = cvs(64, 64, (g, W, H) => {   // ONE knitted row across the band (a period along x); the geometry repeats it 11 x per turn (22 rows in the 2 turns)
  g.fillStyle = C.scarf; g.fillRect(0, 0, W, H); g.fillStyle = "#d9443f"; g.fillRect(W * 0.1, 0, W * 0.1, H); g.fillStyle = C.scarfDk; g.fillRect(0, 0, 5, H);
  for (let y = 0; y < H; y += 9) { g.strokeStyle = "#a02a2a"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(W * 0.2, y); g.lineTo(W * 0.5, y + 4.5); g.lineTo(W * 0.8, y); g.stroke(); g.strokeStyle = "#e86a60"; g.lineWidth = 1; g.beginPath(); g.moveTo(W * 0.2, y + 1.5); g.lineTo(W * 0.5, y + 6); g.lineTo(W * 0.8, y + 1.5); g.stroke(); } }); t.wrapS = THREE.RepeatWrapping; return t; });
const sockTex = () => once("kbSock", () => cvs(64, 64, (g, W, H) => { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? C.scarfCream : C.scarf; g.fillRect(0, (H * i) / 5, W, H / 5 + 1); } }));
const earTex = () => once("kbEar", () => cvs(64, 128, (g, W, H) => { g.fillStyle = "#6a4a3a"; g.fillRect(0, 0, W, H); g.strokeStyle = "#4a3026"; g.lineWidth = 2; for (const x of [W * 0.3, W * 0.5, W * 0.7]) { g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + (x - W / 2) * 0.5, H * 0.5, W * 0.5 + (x - W / 2) * 0.9, H * 0.12); g.stroke(); } }));   // bare inside, 3 vein lines
const handTex = () => once("kbHand", () => cvs(64, 64, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, C.skin); gr.addColorStop(0.5, C.skinLt); gr.addColorStop(1, C.skin); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));


// ---------------------------------------------------------------- geometry builders (pure, memoised)
// a horn: one sweep along the curve with an oval base 0.105 x 0.085 + a front keel, 2 shallow grooves, 32 raised growth rings (pitch 4.0 -> 1.6 in ratio), a polished dark tip,
// frost on every upward face (vertex colours); `chip` cuts 3 cm off the tip, `notch` a 6 cm V at ring 9. rings = ring count.
function hornGeo(path, side, rings, o = {}) {
  const pts = path.map((p) => [side * p[0], p[1], p[2]]), curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(p))), Ltot = curve.getLength(), L = Ltot - (o.chip ? 0.03 : 0);
  const s0 = 0.03, sEnd = L - 0.07, p0 = ((sEnd - s0) * 0.9163) / (0.6 * rings), ringS = [];
  for (let s = s0; ringS.length < rings; s += p0 * (0.4 + 0.6 * clamp((s - s0) / (sEnd - s0)))) ringS.push(s);
  const seg = rings * 6 + 24, radial = 16, pos = [], col = [], uv = [], idx = [], P = new THREE.Vector3(), T = new THREE.Vector3(), Cn = V3([0, 2.05, 0.15]);
  const cHorn = new THREE.Color(mixHex(C.horn, C.hornSh, 0.3)), cSh = new THREE.Color(C.hornSh), cLt = new THREE.Color(C.hornLt), cTip = new THREE.Color(C.hornTip), cFr = new THREE.Color(C.frost), cWarm = new THREE.Color("#7a4e28"), tmp = new THREE.Color();   // cWarm: the lantern's warmth, so the horn reads brown and not taupe in the cool fill
  let flip = 1;
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, s = u * L; curve.getPointAt(Math.min(1, s / Ltot), P); curve.getTangentAt(Math.min(1, s / Ltot), T);
    let N = P.clone().sub(Cn); N.addScaledVector(T, -N.dot(T)); if (N.lengthSq() < 1e-8) N.set(1, 0, 0); N.normalize(); const B = new THREE.Vector3().crossVectors(T, N).normalize(), kk = B.z >= 0 ? 1 : -1;   // the winding stays one way all along the sweep; kk only picks which side is the front (keel, notch)
    // the ring profile: a raised ridge (asymmetric, steep on the tip side) at each of the rings; none on the smooth polished tip
    let ridge = 0, near = 9; for (let k = 0; k < ringS.length; k++) { const d = s - ringS[k], hw = 0.0105; if (Math.abs(d) < hw * 1.5) { const q = d / hw; const b = q < 0 ? Math.exp(-q * q * 1.6) : Math.exp(-q * q * 4.2); if (b > ridge) { ridge = b; near = k; } } }
    const tipFade = (1 - sstep((s - (L - 0.12)) / 0.07)) * (1 - 0.55 * sstep(u / 0.9)), rb = lerp(0.0065 + (o.chip ? 0.0052 : 0), 0.0425, Math.pow(Math.max(0, 1 - u * u), 0.8)) * (1 + 0.3 * ridge * tipFade);
    const rx = rb * (1 + 0.235 * (1 - u) ** 1.5), ry = rb;
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * TAU, c = Math.cos(th), sn = Math.sin(th);
      let r = 1 + 0.15 * (1 - u) ** 1.2 * Math.exp(-((th - Math.PI / 2) ** 2) / 0.35) * 0 ;   // (the keel is added below)
      let kx = c, ky = sn; const thk = Math.atan2(sn * kk, c);
      const keel = 0.13 * (1 - u) ** 1.2 * Math.exp(-((thk - Math.PI / 2) ** 2) / 0.28), g1 = 0.05 * Math.exp(-((thk - 0.62) ** 2) / 0.02) + 0.05 * Math.exp(-((thk + 0.62) ** 2) / 0.02);   // keel in front, 2 grooves on the outer face
      r = 1 + keel * (sn * kk > 0 ? 1 : 0) - g1;
      let notch = 0; if (o.notch) { const dn = (s - ringS[8]) / 0.03; if (Math.abs(dn) < 1) notch = 0.42 * (1 - Math.abs(dn)) * clamp(sn * kk * 0.5 + 0.5) ** 2 * 1.6 * (sn * kk > -0.2 ? 1 : 0.2); }
      const px = P.x + N.x * c * rx * r * (1 - notch) + B.x * ky * ry * r * (1 - notch), py = P.y + N.y * c * rx * r * (1 - notch) + B.y * ky * ry * r * (1 - notch), pz = P.z + N.z * c * rx * r * (1 - notch) + B.z * ky * ry * r * (1 - notch);
      pos.push(px, py, pz); uv.push(u, j / radial);
      const nx = N.x * c + B.x * ky, ny = N.y * c + B.y * ky;
      tmp.copy(cHorn).lerp(cSh, 0.5 * (1 - ridge) * (1 - 0.4 * u)).lerp(cSh, 0.34 * (1 - sstep(u / 0.6))).lerp(cLt, 0.6 * Math.pow(ridge, 2.5) * (0.35 + 0.65 * tipFade) + 0.32 * sstep((u - 0.35) / 0.55)); if (s > L - 0.075) tmp.lerp(cTip, sstep((s - (L - 0.075)) / 0.05));
      tmp.multiplyScalar(0.8).lerp(cWarm, 0.3); col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; if (flip > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const n0 = pos.length / 3; pos.push(pts[0][0], pts[0][1], pts[0][2]); uv.push(0, 0.5); col.push(cHorn.r, cHorn.g, cHorn.b);
  const last = (seg * (radial + 1)) * 3; let ex = 0, ey = 0, ez = 0; for (let j = 0; j < radial; j++) { ex += pos[last + j * 3]; ey += pos[last + j * 3 + 1]; ez += pos[last + j * 3 + 2]; } pos.push(ex / radial, ey / radial, ez / radial); uv.push(1, 0.5); col.push(cTip.r, cTip.g, cTip.b);
  for (let j = 0; j < radial; j++) { if (flip > 0) { idx.push(n0, j + 1, j); const a = seg * (radial + 1) + j; idx.push(n0 + 1, a, a + 1); } else { idx.push(n0, j, j + 1); const a = seg * (radial + 1) + j; idx.push(n0 + 1, a + 1, a); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  { const nA = g.attributes.normal.array, cA = g.attributes.color.array, k0 = new THREE.Color(), uA = g.attributes.uv.array; for (let i = 0; i < cA.length / 3; i++) { const u = uA[i * 2], f = clamp((nA[i * 3 + 1] - 0.74) / 0.22) * 0.4 * (u > 0.06 ? 1 : 0.2) * (1 - sstep((u * L - (L - 0.1)) / 0.05)); if (f > 0) { k0.setRGB(cA[i * 3], cA[i * 3 + 1], cA[i * 3 + 2]).lerp(cFr, f); cA[i * 3] = k0.r; cA[i * 3 + 1] = k0.g; cA[i * 3 + 2] = k0.b; } } }   // frost on the faces that really look up
  g.userData.ringS = ringS; g.userData.length = Ltot; g.userData.curve = curve; return g;
}
const unitCone = () => once("kbCone", () => { const g = new THREE.ConeGeometry(1, 1, 8, 3, false); g.translate(0, 0.5, 0); return g; });
const unitCyl = () => once("kbCyl", () => { const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false); g.translate(0, 0.5, 0); return g; });
const hoofHalf = () => once("kbHoofH", () => { const g = new THREE.CylinderGeometry(0.72, 1, 1, 14, 1, false); g.translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, p.getZ(i) + 0.22 * y * (p.getZ(i) > 0 ? -1 : -0.4)); } g.computeVertexNormals(); return g; });
// an oval chain link 0.055 x 0.035, wire 0.009 (a stadium loop)
const linkGeo = () => once("kbLink", () => { const pts = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU, c = Math.cos(a), s = Math.sin(a); pts.push([0.0175 * Math.sign(c) * Math.abs(c) ** 0.7 * 0.9 + 0, 0.0275 * Math.sign(s) * Math.abs(s) ** 0.7, 0]); } const g = loopTube(pts, 0.0045, 32, 6); return g; });
// a hammered cowbell of height h, half width w, half depth d, mouth at the bottom; origin at the loop (the top), hanging down -y
function bellShell(h, w, d) {
  const secs = [[0, 0.2, 0.5], [0.10, 0.5, 0.62], [0.30, 0.74, 0.8], [0.58, 0.92, 0.94], [0.84, 1.0, 1.0], [1.0, 1.06, 1.06]].map(([f, ww, dd], i) => mkSec([0, -f * h, 0], Math.max(0.012, ww * w), Math.max(0.01, dd * d), Math.max(0.01, dd * d), 2.1));
  const g = makeLoft(secs, { sub: 4, radial: 28, ref: [0, 0, 1] }); g.userData.set(secs); return g;
}
const bellLip = (w, d, h) => loopTube(Array.from({ length: 28 }, (_, k) => [Math.cos((k / 28) * TAU) * (w * 1.06 + 0.002), -h, Math.sin((k / 28) * TAU) * (d * 1.06 + 0.002)]), 0.0042, 40, 6);
// the leather hinge loop / small torus
const loopT = (r, t) => new THREE.TorusGeometry(r, t, 6, 14);
// birch: a bunch of 7 sticks 0.50 long, butt at the origin, twigs up (+y); returns merged geometries by material: bark (atlas columns), twigs, buds, twine, curls
function birchParts(seed, len = 0.50) {
  const bark = [], twig = [], bud = [], twine = [], curl = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + seed * 0.7, rr_ = k === 0 ? 0 : 0.011, sx = Math.cos(a) * rr_, sz = Math.sin(a) * rr_, lean = 0.075 * (k === 0 ? 0.4 : 1);
    const dx = Math.cos(a) * lean, dz = Math.sin(a) * lean, wob = (rnd(seed * 31 + k) - 0.5) * 0.012;
    const pts = [[sx * 0.5, -0.10, sz * 0.5], [sx, 0.05, sz], [sx + dx * 0.9 * 0.3, 0.05 + len * 0.3, sz + dz * 0.9 * 0.3 + wob], [sx + dx * 0.55, 0.05 + len * 0.62, sz + dz * 0.55], [sx + dx * 0.80 + wob, len * 0.66 + 0.03, sz + dz * 0.80]];   // butt .. the end of the bark (2/3)
    const g = taperTube(pts, 0.0078, 0.0045, 6, 8, 1); const uvA = g.attributes.uv; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, (k + 0.1 + 0.8 * uvA.getY(i)) / 8, uvA.getX(i)); bark.push(g);
    // the outer third forks once into dark twigs with 2 buds
    const tip = pts[4], fa = a + (rnd(seed * 17 + k) - 0.5) * 1.2;
    for (const f of [-1, 1]) { const ex = tip[0] + Math.cos(fa) * 0.05 * f + dx * 0.12, ez = tip[2] + Math.sin(fa) * 0.05 * f + dz * 0.12, ey = tip[1] + len * 0.30 + f * 0.012;
      twig.push(taperTube([tip, [lerp(tip[0], ex, 0.5) + dx * 0.04, lerp(tip[1], ey, 0.5), lerp(tip[2], ez, 0.5) + dz * 0.04], [ex, ey, ez]], 0.0055, 0.0022, 5, 6, 1));
      const b = new THREE.SphereGeometry(0.0042, 6, 5); b.translate(lerp(tip[0], ex, 0.62), lerp(tip[1], ey, 0.62), lerp(tip[2], ez, 0.62)); bud.push(b); }   // the 2 buds of a stick: one on each fork's twig
  }
  for (let t = 0; t < 3; t++) { const tt = new THREE.TorusGeometry(0.0235, 0.0034, 6, 18); tt.rotateX(Math.PI / 2); tt.translate(0, 0.10 + t * 0.0075, 0); twine.push(tt); }   // 3 turns of twine 0.10 from the butt
  for (let c = 0; c < 3; c++) { const a = c * 2.1 + seed, g = new THREE.PlaneGeometry(0.03, 0.045, 2, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.012 * Math.sin(p.getX(i) * 150) + 0.004 * p.getY(i) * 20 * 0.3); g.rotateY(a); g.translate(Math.cos(a) * 0.020, 0.16 + c * 0.07, Math.sin(a) * 0.020); curl.push(g); }   // 3 curls of peeling bark
  return { bark: merge(bark), twig: merge(twig), bud: merge(bud), twine: merge(twine), curl: merge(curl) };
}


// ---------------------------------------------------------------- the basket (DESIGN): old willow, 28 stakes, 46 weaver rows over and under (each row shifted half a stake), a 3-rod braided rim,
// a foot ring, 2 belts, 6 broken ends, a repair patch of 5 rows x 6 stakes on its left; base oval 0.46 x 0.40 at y 1.30, rim oval 0.66 x 0.56 at y 2.08, centre z -0.66
const BK = { y0: 1.30, y1: 2.08, cz: -0.66, stakes: 28, rows: 46, belts: [1.52, 1.86], patchRows: [20, 21, 22, 23, 24], patchStakes: [25, 26, 27, 0, 1, 2] };
const bkR = (y) => { const f = clamp((y - BK.y0) / (BK.y1 - BK.y0)); return { rx: 0.23 + 0.10 * f ** 0.85 + 0.012 * Math.sin(Math.PI * f), rz: 0.20 + 0.08 * f ** 0.85 + 0.010 * Math.sin(Math.PI * f) }; };
const bkP = (y, th, off = 0) => { const { rx, rz } = bkR(y), nx = Math.cos(th) * rz, nz = Math.sin(th) * rx, nl = Math.hypot(nx, nz); return [rx * Math.cos(th) + (nx / nl) * off, y, BK.cz + rz * Math.sin(th) + (nz / nl) * off]; };
const basketParts = () => once("kbBasket", () => {
  const W = 0.0075, st = [], we = [], pst = [], pwe = [], rimG = [], ends = [];
  const stakeAt = (k) => (k / BK.stakes) * TAU, rowY = (j) => 1.335 + ((2.045 - 1.335) * j) / (BK.rows - 1);
  for (let k = 0; k < BK.stakes; k++) { const th = stakeAt(k); st.push(taperTube(Array.from({ length: 9 }, (_, i) => bkP(BK.y0 + 0.01 + (0.77 * i) / 8, th, 0)), W, W, 5, 12, 1)); }
  const weaver = (j, th0, th1, lift = 0) => { const pts = [], n = Math.max(6, Math.round(((th1 - th0) / TAU) * BK.stakes * 6)); for (let i = 0; i <= n; i++) { const th = th0 + ((th1 - th0) * i) / n, kk = (th / TAU) * BK.stakes; pts.push(bkP(rowY(j), th, 0.0075 * Math.sin(Math.PI * (kk + 0.5 * j)) + lift)); } return pts; };
  for (let j = 0; j < BK.rows; j++) we.push(loopTube(weaver(j, 0, TAU * (1 - 1 / 168)).slice(0, 167), 0.0069, 168, 5));
  // the repair patch (paler willow): 5 rows x 6 stakes on the left (+x), laid on the old weave
  const pk0 = -3.5 / BK.stakes * TAU, pk1 = 2.5 / BK.stakes * TAU;
  for (const k of BK.patchStakes) { const th = stakeAt(k) + (k > 20 ? -TAU : 0); pst.push(taperTube(Array.from({ length: 5 }, (_, i) => bkP(rowY(19) - 0.004 + ((rowY(25) - rowY(19) + 0.008) * i) / 4, th, 0.010)), W * 0.95, W * 0.95, 5, 8, 1)); }
  for (const j of BK.patchRows) pwe.push(taperTube(weaver(j, pk0, pk1, 0.012), 0.0068, 0.0068, 5, 30, 1));
  for (let m = 0; m < 3; m++) { const pts = []; for (let i = 0; i < 120; i++) { const th = (i / 120) * TAU, ph = 14 * th + (m * TAU) / 3; pts.push(bkP(BK.y1 + 0.0105 * Math.sin(ph), th, 0.0105 * Math.cos(ph))); } rimG.push(loopTube(pts, 0.0095, 240, 6)); }   // the 3-rod braided rim, 0.035
  const foot = loopTube(Array.from({ length: 40 }, (_, i) => bkP(BK.y0 + 0.012, (i / 40) * TAU, 0.006)), 0.0125, 80, 6);
  [[8, 0.7], [17, 2.1], [25, 3.4], [31, 4.6], [38, 5.5], [43, 1.3]].forEach(([j, th], i) => { const a = bkP(rowY(j), th, 0.004), d = bkP(rowY(j), th, 0.05), tg = bkP(rowY(j), th + 0.12, 0.02); ends.push(taperTube([a, [(a[0] + d[0]) / 2 + (tg[0] - a[0]) * 0.3, a[1] + 0.012 * (i % 2 ? 1 : -1), (a[2] + d[2]) / 2 + (tg[2] - a[2]) * 0.3], [d[0] + (tg[0] - a[0]) * 0.8, d[1] + 0.02 * (i % 2 ? 1 : -1), d[2] + (tg[2] - a[2]) * 0.8]], 0.0048, 0.0022, 5, 6, 1)); });   // 6 broken weaver ends
  const secs = (dr) => Array.from({ length: 9 }, (_, i) => { const y = BK.y0 + ((BK.y1 - BK.y0) * i) / 8, { rx, rz } = bkR(y); return mkSec([0, y, BK.cz], rx - dr, rz - dr, rz - dr, 2.2); });
  const outer = makeLoft(secs(0.004), { sub: 3, radial: 40, ref: [0, 0, 1] }), inner = makeLoft(secs(0.018), { sub: 3, radial: 40, ref: [0, 0, 1] }); outer.userData.set(secs(0.004)); inner.userData.set(secs(0.018));
  const beltAt = (y, w) => { const pts = [], nr = []; for (let i = 0; i <= 60; i++) { const th = (i / 60) * TAU; pts.push(bkP(y, th, 0.013)); const q = bkP(y, th, 0.1); nr.push([q[0] - pts[i][0], 0, q[2] - pts[i][2]]); } return ribbon(pts, nr, w, 0.006); };
  return { stakes: merge(st), weavers: merge(we), patchStakes: merge(pst), patchWeavers: merge(pwe), rim: merge(rimG), foot, ends: merge(ends), outer, inner, belts: BK.belts.map((y) => beltAt(y, 0.05)), counts: { stakes: st.length, rows: we.length, patchRows: pwe.length, patchStakes: pst.length, rimRods: rimG.length, ends: ends.length, belts: BK.belts.length } };
});
// the lid: a shallow dome 0.70 x 0.60, 0.12 high; a spiral of 14 turns from a centre knot (a coil tube) and a braided edge; hinge line at the BACK rim. Lid frame: origin at the hinge, the lid runs +z.
const LID = { w: 0.35, d: 0.30, h: 0.12, turns: 14 };
const lidDome = (k = 1) => once(`kbLidDome${k}`, () => { const g = new THREE.SphereGeometry(1, 40, 14, 0, TAU, 0, Math.PI / 2); g.scale(LID.w * k, LID.h * k, LID.d * k); g.translate(0, 0, LID.d); return g; });
const lidCoil = () => once("kbLidCoil", () => { const pts = [], N = LID.turns * 36; for (let i = 0; i <= N; i++) { const t = i / N, rho = t * 0.985, a = LID.turns * TAU * t; pts.push([LID.w * rho * Math.cos(a), LID.h * (1 - rho * rho) + 0.004, LID.d + LID.d * rho * Math.sin(a)]); } return taperTube(pts, 0.0095, 0.0095, 5, N, 1); });
const lidEdge = () => once("kbLidEdge", () => { const out = []; for (let m = 0; m < 2; m++) { const pts = []; for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU, ph = 18 * a + m * Math.PI; pts.push([(LID.w + 0.004 + 0.007 * Math.cos(ph)) * Math.cos(a), 0.0 + 0.007 * Math.sin(ph) + 0.003, LID.d + (LID.d + 0.004 + 0.007 * Math.cos(ph)) * Math.sin(a)]); } out.push(loopTube(pts, 0.0072, 192, 5)); } return merge(out); });
const lidUnderTex = () => once("kbLidUnder", () => cvs(512, 256, (g, W, H) => { g.fillStyle = C.wickerLt; g.fillRect(0, 0, W, H); g.strokeStyle = "#b8935a"; g.lineWidth = 2; for (let k = 0; k < LID.turns + 1; k++) { g.beginPath(); g.moveTo(0, (k * H) / LID.turns); g.lineTo(W, ((k + 1) * H) / LID.turns); g.stroke(); } g.fillStyle = "rgba(255,255,255,0.12)"; for (let k = 0; k < 40; k++) g.fillRect(rnd(k) * W, rnd(k + 50) * H, 30, 2); }));


// ---------------------------------------------------------------- the lock tube: 7 rings x 7 sides, rebuilt every apply (a lock hangs plumb in every pose)
const LK_RINGS = 9, LK_RAD = 8;
function lockGeom() {
  const rows = LK_RINGS, pos = new Float32Array(rows * (LK_RAD + 1) * 3), uv = new Float32Array(rows * (LK_RAD + 1) * 2), idx = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j <= LK_RAD; j++) uv.set([0.5 + 0.5 * Math.cos((j / LK_RAD) * TAU), i / (rows - 1)], (i * (LK_RAD + 1) + j) * 2);
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < LK_RAD; j++) { const a = i * (LK_RAD + 1) + j, b = a + 1, c = a + LK_RAD + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _R = new THREE.Vector3();
function setTube(g, pts, r0) {
  const pos = g.attributes.position.array, n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; _T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    _N.crossVectors(_T, Math.abs(_T.z) > 0.9 ? X_AXIS : Z_AXIS).normalize(); _B.crossVectors(_T, _N).normalize();
    const u = i / (n - 1), r = r0 * Math.pow(Math.max(0, 1 - u * u), 0.55) * (u < 0.1 ? 0.8 + 2 * u : 1);
    for (let j = 0; j <= LK_RAD; j++) { const ang = (j / LK_RAD) * TAU, c = Math.cos(ang) * r, s = Math.sin(ang) * r * 0.75, o = (i * (LK_RAD + 1) + j) * 3; pos[o] = pts[i][0] + _N.x * c + _B.x * s; pos[o + 1] = pts[i][1] + _N.y * c + _B.y * s; pos[o + 2] = pts[i][2] + _N.z * c + _B.z * s; }
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}
// a lock as a soft tapered tuft: wide across (the width axis is tangent x the outward normal), thin, cupped so the edges lie back on the body,
// swelling over the first fifth and tapering to a point; overlapping neighbours hide the skin between them
const _W = new THREE.Vector3(), _Q = new THREE.Vector3();
function setRibbon(g, pts, r0, nOut) {
  const pos = g.attributes.position.array, n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; _T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    _W.crossVectors(_T, _Q.set(nOut[0], nOut[1], nOut[2])); if (_W.lengthSq() < 1e-4) _W.crossVectors(_T, Z_AXIS); _W.normalize(); _B.crossVectors(_W, _T).normalize();
    const u = i / (n - 1), sw = (0.8 + 0.2 * sstep(u / 0.15)) * (u < 0.15 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.15) / 0.85, 2.6)), 0.55)), hw = r0 * 1.12 * sw, th = Math.max(0.0025, hw * 0.34);
    for (let j = 0; j <= LK_RAD; j++) { const ang = (j / LK_RAD) * TAU, c = Math.cos(ang), s = Math.sin(ang), o = (i * (LK_RAD + 1) + j) * 3, cup = -0.3 * hw * c * c;
      pos[o] = pts[i][0] + _W.x * c * hw + _B.x * (s * th + cup); pos[o + 1] = pts[i][1] + _W.y * c * hw + _B.y * (s * th + cup); pos[o + 2] = pts[i][2] + _W.z * c * hw + _B.z * (s * th + cup); }
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}
// a lock's path from its root R: it stands out along n (a little), then falls plumb; the clump sways; t gives the slow life
function lockPath(R, n, L, wob, sw, t, calm, wv = 1) {
  const pts = [], down = [0, -1, 0]; let p = [R[0], R[1], R[2]]; pts.push(p.slice());
  const step = L / (LK_RINGS - 1);
  for (let i = 1; i < LK_RINGS; i++) {
    const u = (i - 0.5) / (LK_RINGS - 1), k = sstep(u / 0.55), a = 0.8 * (1 - k), b = 0.35 + 0.65 * k;
    const env = 1 - 0.55 * sstep((u - 0.45) / 0.55), d = nrm3([n[0] * a + down[0] * b + wv * wob * 0.9 * env * Math.sin(TAU * u * 1.35 + 0.6), n[1] * a + down[1] * b, n[2] * a + down[2] * b + wv * 0.32 * env * Math.sin(TAU * u * 1.15 + sw[2])]);
    p = [p[0] + d[0] * step, p[1] + d[1] * step, p[2] + d[2] * step]; pts.push(p.slice());
  }
  const sway = 0.012 * (1 + 2 * calm) * Math.sin(TAU * 0.35 * t + sw[2]); for (let i = 1; i < LK_RINGS; i++) { const u2 = (i / (LK_RINGS - 1)) ** 2; pts[i][0] += (sw[0] * 0.12 + sway) * u2 * L * 3; pts[i][2] += (sw[1] * 0.08 + sway * 0.6) * u2 * L * 3; }
  return pts;
}
const unitCylZ = () => once("kbCylZ", () => { const g = new THREE.CylinderGeometry(1, 0.8, 1, 10, 1, false); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.5); return g; });
const clawG = () => once("kbClawG", () => { const g = new THREE.ConeGeometry(1, 1, 7, 2, false); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, p.getY(i) - 0.35 * z * z); } g.computeVertexNormals(); return g; });


// ================================================================================================ the kind
export const KRAMPUS_BEAST_STATE = {
  krampus: { stoop: 0, nose: 0, sniff: 0, twist: 0, headYaw: 0, headPitch: 0, gait: 0, slope: 0, jam: 0, bunch: 1, tongue: 0.35, lick: 0, jaw: 0, breath: 0, lids: 0.3, glow: 0.5, lookX: 0, lookY: 0, ears: 0, ring: 0, lid: 0, stow: 1, kidPeek: 0, kidTalk: 0, kidKick: 0, scarfOut: 0, torch: 1, spares: 3 },
  krampusshadow: { grow: 0, sway: 0 },
};
export const KRAMPUS_BEAST_GRIPS = {};
const HS = (p) => [p[0] - AT0[0], p[1] - AT0[1], p[2] - AT0[2]];   // stand point -> the head frame
const QID = new THREE.Quaternion();
const qFromTo = (a, b) => new THREE.Quaternion().setFromUnitVectors(V3(nrm3(a)), V3(nrm3(b)));
// a hand (wrist frame: +z along the fingers, -y the palm side): palm 0.11, fingers 0.10, 3 fingers and a thumb, 3 knuckle creases a finger, claws 3.5 cm
function buildHand(S, M, side, brokenThumb) {
  const g = new THREE.Group(), fingers = [], skin = M.hand, crease = M.crease, claw = M.claw;
  const palm = mesh(sph(), skin, g, 0, 0, 0.052); palm.scale.set(0.052, 0.025, 0.058);
  const finger = (x, z, len1, len2, r, rot, thumb) => {
    const f1 = new THREE.Group(); f1.position.set(x, 0, z); f1.rotation.y = rot; g.add(f1);
    const a = mesh(unitCylZ(), skin, f1); a.scale.set(r, r, len1); mesh(sph(), skin, f1).scale.setScalar(r * 1.06);
    const f2 = new THREE.Group(); f2.position.z = len1; f1.add(f2); mesh(sph(), skin, f2).scale.setScalar(r * 0.95);
    const b = mesh(unitCylZ(), skin, f2); b.scale.set(r * 0.82, r * 0.82, len2);
    const cl = mesh(clawG(), claw, f2, 0, 0, len2 - 0.002); cl.scale.set(0.0072, 0.0072, brokenThumb && thumb ? 0.016 : 0.035); cl.castShadow = false;
    for (const [grp, z, k] of [[f1, len1 * 0.25, 1.0], [f1, len1 * 0.72, 0.9], [f2, len2 * 0.45, 0.85]]) { const t = mesh(new THREE.TorusGeometry(r * k * 1.02, 0.0013, 5, 14), crease, grp, 0, 0, z); t.castShadow = false; }
    fingers.push({ f1, f2, thumb: !!thumb }); return f1;
  };
  [-1, 0, 1].forEach((i) => finger(i * 0.029, 0.105, 0.058 - 0.003 * Math.abs(i), 0.046 - 0.002 * Math.abs(i), 0.0125 - 0.0006 * Math.abs(i), i * 0.045, false));
  finger(-side * 0.052, 0.025, 0.040, 0.034, 0.0135, -side * 0.7, true);
  return { g, fingers, curl(c, th) { for (const f of fingers) { f.f1.rotation.x = f.thumb ? (0.15 + th * 0.5) : (0.18 + c * 1.1); f.f2.rotation.x = f.thumb ? 0.25 + th * 0.6 : 0.28 + c * 1.25; } } };
}
export const KRAMPUS_BEAST_KINDS = {
  krampus(P) {
    const S = palette(), DS = THREE.DoubleSide, spec = P.spec || {}, runner = !!spec.runner, lod = spec.lod || "near", seedN = Math.round(spec.seed ?? 0), near = lod === "near";
    const kidOn = !runner && spec.kid !== false;
    const fi = runner ? (((seedN * 3) % 5) + 5) % 5 : (spec.fur ?? 0), mi = runner ? ((seedN % 4) + 4) % 4 : 0, hi = runner ? ((seedN % 3) + 3) % 3 : 0, extraHorns = runner && ((seedN % 4) + 4) % 4 === 3;
    const height = runner ? (spec.height ?? 1.72 + 0.36 * rnd(seedN * 7 + 1)) : 2.04;
    if (lod === "far") return buildFar(P, S, { fi, hi, mi, height, seedN });
    const root = new THREE.Group(); root.scale.setScalar(height / 2.04); P.whole.add(root);
    const mk = (g, m, par = root) => { const o = mesh(g, m, par); return o; };
    // ---- materials
    const furM = (k) => S.m("#ffffff", { map: furTex(k, fi), roughness: 0.92 });
    const skinM = furM("torso"), neckM = furM("neck"), armM = [furM("arm0"), furM("arm1")], legM = [furM("leg0"), furM("leg1")];
    const Mt = { hand: S.m("#ffffff", { map: handTex(), roughness: 0.7 }), crease: S.m("#1a1410", { roughness: 0.9 }), claw: S.m(C.claw, { roughness: 0.4 }) };
    const ironM = S.m(C.iron, { roughness: 0.55, metalness: 0.6 }), rustM = S.m(C.rust, { roughness: 0.7, metalness: 0.4 }), bloomM = S.m(C.bloom, { roughness: 0.7, metalness: 0.3 });
    const brassM = S.m(C.brass, { roughness: 0.3, metalness: 0.75 }), leatherM = S.m(C.leather, { roughness: 0.7 }), woodM = S.m(C.maskWorn, { roughness: 0.7 }), snowM = S.m(C.snowLt, { roughness: 0.6 });
    const hoofM = S.m("#ffffff", { map: hoofTex(), roughness: 0.55 });
    const pelS = new THREE.Group(), chestS = new THREE.Group(), headS = new THREE.Group(), pelG = new THREE.Group(), chestG = new THREE.Group(), headG = new THREE.Group(), jawG = new THREE.Group(), jawS = new THREE.Group();
    pelS.position.set(-HIP0[0], -HIP0[1], -HIP0[2]); chestS.position.copy(pelS.position); headS.position.set(-AT0[0], -AT0[1], -AT0[2]); jawG.position.set(JH0[0], JH0[1], JH0[2]); jawS.position.set(-JH0[0], -JH0[1], -JH0[2]);
    root.add(pelG, chestG, headG); pelG.add(pelS); chestG.add(chestS); headG.add(headS); headS.add(jawG); jawG.add(jawS);
    // ---- the torso: ONE lofted skin from the hips to the hump in two pieces (pelvis + belly, chest + shoulders + hump), the same painted fur; the chest turns about the spine
    const torsoUV = (g) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setX(i, torsoTexU(p.getY(i))); uv.needsUpdate = true; };
    const loft = (rows, ref = [0, 0, 1], o = {}) => { const secs = rows; const g = makeLoft(secs, { sub: o.sub ?? 3, radial: o.radial ?? 36, ref }); g.userData.set(secs); return g; };
    const lowerG = loft(LOWER_ROWS.map(([y, zc, w, f, b, n]) => mkSec([0, y, zc], w, f, b, n))), upperG = loft(UPPER_ROWS.map(([y, zc, w, f, b, n]) => mkSec([0, y, zc], w, f, b, n)));
    torsoUV(lowerG); torsoUV(upperG); mesh(lowerG, skinM, pelS); mesh(upperG, skinM, chestS);
    // ---- neck (updated: it stretches), arms and legs (one loft each, IK)
    const neckGeo = makeLoft([0, 1, 2, 3].map(() => mkSec([0, 1.7, 0], 0.1, 0.1, 0.1)), { sub: 4, radial: 20, ref: [0, 1, 0] }), neckMesh = mesh(neckGeo, neckM, root);
    const ARM_R = [0.097, 0.092, 0.082, 0.075, 0.062], LEG_R = [0.125, 0.118, 0.078, 0.058, 0.052];
    const limbs = [0, 1].map((k) => ({ arm: makeLoft(ARM_R.map((r) => mkSec([0, 1, 0], r, r, r, 2.2)), { sub: 4, radial: 18, ref: [0, 0, 1] }), leg: makeLoft(LEG_R.map((r) => mkSec([0, 1, 0], r, r, r, 2.3)), { sub: 4, radial: 18, ref: [0, 0, 1] }) }));
    limbs.forEach((l, k) => { mesh(l.arm, armM[k], root); mesh(l.leg, legM[k], root); });
    // ---- hooves: two halves with a 1.5 cm cleft, 0.15 x 0.13 x 0.11, toes out; fetlock hair over the top with 3 snow clumps a leg
    const hooves = [0, 1].map((k) => { const g = new THREE.Group(); root.add(g); const s = k === 0 ? 1 : -1;
      for (const hx of [-1, 1]) { const h = mesh(hoofHalf(), hoofM, g, hx * 0.0365, 0, 0.03); h.scale.set(0.029, 0.11, 0.075); }
      for (let c = 0; c < 3; c++) { const o = mesh(sph(), snowM, g, (c - 1) * 0.036, 0.135 + 0.006 * (c % 2), 0.0 + 0.02 * c - 0.02); o.scale.set(0.02, 0.014, 0.018); o.castShadow = false; }
      return g; });
    // ---- hands + manacles (iron 0.05 wide, 2 rivets each wrist; a broken link on the working one)
    const hands = [0, 1].map((k) => { const s = k === 0 ? 1 : -1, h = buildHand(S, Mt, s, s === (spec.mirror ? 1 : -1)); root.add(h.g);
      const mg = new THREE.Group(); mg.position.z = -0.06; h.g.add(mg);
      const band = mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.05, 20, 1, true), ironM, mg); band.rotation.x = Math.PI / 2; band.material.side = DS;
      for (let r = 0; r < 2; r++) { const a = (r ? 2.2 : 0.9) + (k ? 0.3 : 0); const rv = mesh(sph(), rustM, mg, Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0); rv.scale.setScalar(0.0075); }
      if (s === (spec.mirror ? 1 : -1)) { const c = mesh(new THREE.TorusGeometry(0.014, 0.0045, 6, 14, Math.PI * 1.7), ironM, mg, 0, -0.082, 0.0); c.rotation.set(0, Math.PI / 2, 0.4); }   // the broken link: a ring with a gap
      return h; });
    // ---- the 240 locks (see makeLockDefs): each one tube rebuilt in apply so it hangs plumb in every pose
    const lockM = {}; const lockMat = (l) => { const key = `${l.strands}${l.tint}${l.frost}`; return lockM[key] ?? (lockM[key] = S.m("#ffffff", { map: lockTex(fi, l.strands, l.tint, l.frost), roughness: 0.95, side: DS })); };
    const lockSel = near ? LOCKS : LOCKS.slice().sort((a, b) => rnd(a.id * 5.3 + 2) - rnd(b.id * 5.3 + 2)).slice(0, 90);   // mid: 90 outline locks
    const locks = lockSel.map((d) => { const geo = lockGeom(), m = new THREE.Mesh(geo, lockMat(d)); m.frustumCulled = false; m.castShadow = false; root.add(m); const bead = d.bead && near ? mesh(sph(), S.m("#dfeaf5", { roughness: 0.12, metalness: 0.1 }), root) : null; if (bead) { bead.scale.setScalar(0.0055 + 0.0045 * rnd(d.id * 3 + 1)); bead.castShadow = false; } return { d, geo, m, bead, sw: [rnd(d.clump * 13 + 1) - 0.5, rnd(d.clump * 13 + 2) - 0.5, rnd(d.clump * 13 + 3) * TAU] }; });


    // ---- the head: carved wood that is alive. ONE loft crown -> upper lip (satin MASK WOOD with the painted gouges, grain, furrows, checks, woodworm), the jaw its own loft on the hinge
    const maskM = S.m("#ffffff", { map: maskTex(mi, false, near), roughness: 0.5 }), jawM = S.m("#ffffff", { map: maskTex(mi, true, near), roughness: 0.5 }), maskSolid = S.m(MASKS[mi].base, { roughness: 0.5 }), maskDark = S.m(MASKS[mi].sh, { roughness: 0.6 }), maskWorn = S.m(MASKS[mi].worn, { roughness: 0.5 });
    const headGeo = carveHead(loft(headSec(HEAD_ROWS, 0, 0), [0, 0, 1], { radial: 96, sub: 6 }), HEADR, headRelief), jawGeo = carveHead(loft(headSec(JAW_ROWS, 0, 0), [0, 0, 1], { radial: 40, sub: 4 }), JAWR, null); mesh(headGeo, maskM, headS); mesh(jawGeo, jawM, jawS);
    const sock = [1, -1].map((s) => { const ey = 1.90, ex = s * 0.075;
      const ring = mesh(new THREE.TorusGeometry(0.040, 0.0075, 6, 22), maskDark, headS, ex, ey, 0.372); ring.scale.set(1.0, 0.64, 0.6);   // the socket's raised rim
      const hollow = mesh(sph(), S.m("#0a0604", { roughness: 0.9 }), headS, ex, ey, 0.372); hollow.scale.set(0.037, 0.0235, 0.012); hollow.castShadow = false;
      for (let b = 0; b < 2; b++) { const bag = mesh(new THREE.TorusGeometry(0.030 - b * 0.004, 0.0013, 5, 16, Math.PI * 0.7), maskDark, headS, ex, ey - 0.034 - b * 0.011, 0.381 - b * 0.001); bag.rotation.z = Math.PI * 1.15; bag.castShadow = false; }   // 2 carved bag lines under each eye
      return { s }; });
    // the brow ridge (0.30 wide, 25 degrees a side to a V over the nose) is carved into the head surface: headRelief
    const frontZ = (x, y) => { const p = headGeo.attributes.position; let best = 1e9, bz = 0.42; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z < 0.2) continue; const dx = p.getX(i) - x, dy = p.getY(i) - y, d = dx * dx + dy * dy; if (d < best) { best = d; bz = z; } } return bz; };
    const nostrils = [1, -1].map((s) => { const o = mesh(sph(), S.m("#0a0604", { roughness: 0.9 }), headS, s * 0.029, 1.772, frontZ(s * 0.029, 1.772) + 0.001); o.scale.set(0.013, 0.0055, 0.008); o.rotation.set(0, 0, s * rad(35)); o.castShadow = false; return o; });   // 2 nostril slits 0.03 at 35 degrees, set into the pads
    mesh(sph(), maskSolid, jawS, 0, 1.585, 0.428).scale.set(0.028, 0.02, 0.02);   // the chin knob
    for (const s of [1, -1]) { const peg = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), woodM, headS, s * 0.104, 1.70, 0.30); peg.rotation.z = Math.PI / 2; }   // the jaw's 2 hinge pegs
    // the mouth: inside #5a1a22, 10 teeth in bone (root stain), a thin carved lip line (painted)
    const inM = S.m("#5a1a22", { roughness: 0.8, side: DS }), toothM = [S.m("#ffffff", { map: toothTex(false), roughness: 0.35 }), S.m("#ffffff", { map: toothTex(true), roughness: 0.35 })];
    { const roof = mesh(new THREE.CircleGeometry(1, 20), inM, headS, 0, 1.678, 0.24); roof.rotation.x = Math.PI / 2; roof.scale.set(0.092, 0.17, 1); roof.castShadow = false; const floor = mesh(new THREE.CircleGeometry(1, 20), inM, jawS, 0, 1.69, 0.25); floor.rotation.x = -Math.PI / 2; floor.scale.set(0.088, 0.17, 1); floor.castShadow = false;
      const th = mesh(sph(), S.m("#2a0c12", { roughness: 0.9 }), headS, 0, 1.70, 0.12); th.scale.set(0.08, 0.04, 0.05); th.castShadow = false; }
    const tooth = (parent, x, y, z, len, r, lean, chip) => { const m = mesh(chip ? unitCyl() : unitCone(), toothM[0], parent, x, y, z); m.scale.set(r, len, r); m.rotation.set(lean[0], 0, lean[1]); m.castShadow = false; return m; };
    const teeth = [];
    // upper: 2 fangs of 3.0 cm and 4 flat teeth with a 4 mm gap between the middle two
    for (const s of [1, -1]) { teeth.push(tooth(headS, s * 0.056, 1.690, 0.428, 0.030, 0.0068, [0, -s * 0.06], false)); teeth[teeth.length - 1].rotation.x = Math.PI; teeth[teeth.length - 1].position.y = 1.69; }
    for (const [x, l] of [[0.0115, 0.017], [-0.0115, 0.018], [0.032, 0.015], [-0.032, 0.016]]) { const t = mesh(new THREE.BoxGeometry(0.0185, l, 0.0085), toothM[0], headS, x, 1.686 - l / 2 + 0.004, 0.440); t.rotation.z = (x > 0 ? 1 : -1) * 0.03; teeth.push(t); }
    // lower: 2 tusks of 4.5 cm curving up outside the lip, 2 teeth (one chipped flat)
    for (const s of [1, -1]) { teeth.push(mesh(taperTube([[s * 0.046, 1.664, 0.436], [s * 0.054, 1.684, 0.453], [s * 0.057, 1.704, 0.455], [s * 0.056, 1.714, 0.448]], 0.0078, 0.0022, 7, 10, 0.9), toothM[0], jawS)); }
    teeth.push(tooth(jawS, 0.017, 1.676, 0.436, 0.013, 0.0072, [0, 0], false)); teeth.push(tooth(jawS, -0.017, 1.676, 0.436, 0.010, 0.0066, [0, 0.0], true));
    // eyes: balls r 0.024 amber with a GOAT pupil bar, a catch-light, lids; the brightest warm point (emissive + a 5 cm halo)
    const eyeTex = once("kbEye", () => cvs(128, 64, (g, W, H) => { const gr = g.createRadialGradient(W * 0.25, H / 2, 1, W * 0.25, H / 2, H * 0.45); gr.addColorStop(0, C.amberC); gr.addColorStop(1, C.amber); g.fillStyle = C.amber; g.fillRect(0, 0, W, H); g.fillStyle = gr; g.beginPath(); g.ellipse(W * 0.25, H / 2, W * 0.12, H * 0.4, 0, 0, TAU); g.fill(); g.fillStyle = "#c9861a"; g.fillRect(W * 0.7, 0, W * 0.3, H); }));
    const eyeM = S.m("#ffffff", { map: eyeTex, roughness: 0.15, emissive: new THREE.Color("#ffb020"), emissiveMap: eyeTex, emissiveIntensity: 0.5 }), pupilM = S.b(C.pupil), catchM = S.b("#ffffff"), lidM = S.m(MASKS[mi].base, { roughness: 0.6 });
    const haloTex = once("kbHalo", () => radialTexture([[0, "rgba(255,194,58,1)"], [0.35, "rgba(255,194,58,0.55)"], [1, "rgba(255,194,58,0)"]]));
    const eyes = [1, -1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.075, 1.90, 0.372); g.rotation.order = "YXZ"; headS.add(g);
      const ball = mesh(new THREE.SphereGeometry(0.024, 20, 14), eyeM, g); ball.castShadow = false; ball.rotation.y = -Math.PI / 2;
      const pupil = mesh(new THREE.BoxGeometry(0.016, 0.005, 0.002), pupilM, g, 0, 0, 0.0235); pupil.castShadow = false; pupil.userData.noOutline = true;   // the goat pupil: a horizontal bar 0.016 x 0.005
      const cl = mesh(sph(), catchM, g, -0.008 * s, 0.009, 0.0225); cl.scale.setScalar(0.0035); cl.castShadow = false; cl.userData.noOutline = true;
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0262, 20, 10, 0, TAU, 0, Math.PI / 2), lidM); lid.rotation.x = -Math.PI / 2; lid.castShadow = false; const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.set(0, 0, 0.02); g.add(halo); halo.userData.noOutline = true;
      const brow = mesh(new THREE.TorusGeometry(0.03, 0.0016, 5, 14, Math.PI * 0.75), maskDark, g, 0, 0.012, 0.012); brow.rotation.z = Math.PI * 0.13; brow.castShadow = false;
      return { g, lidP, halo, ball, pupil, cl, s }; });
    // ears: goat ears 0.17 x 0.07, fur outside, bare #6a4a3a inside with 3 vein lines; a nick in the left
    const earFur = furM("neck"), earIn = S.m("#ffffff", { map: earTex(), roughness: 0.8 });
    const ears = [1, -1].map((s) => { const pv = new THREE.Group(); pv.position.set(s * 0.166, 1.90, 0.18); headS.add(pv); const g = new THREE.Group(); pv.add(g);
      const secs = [[0.0, 0.034, 0.010], [0.05, 0.040, 0.0085], [0.10, 0.034, 0.007], [0.14, 0.021, 0.005], [0.17, 0.004, 0.003]].map(([x, w, t]) => mkSec([x, 0, 0], w, t, t, 2.2)), eg = makeLoft(secs, { sub: 4, radial: 14, ref: [0, 0, 1] }); eg.userData.set(secs);
      if (s === 1) { const p = eg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), k = Math.max(0, 1 - Math.abs(x - 0.108) / 0.018); if (y > 0.004 && k > 0) p.setY(i, y - 0.017 * k); } p.needsUpdate = true; eg.computeVertexNormals(); }   // the nick in the left ear
      mesh(eg, earFur, g); const ig = new THREE.PlaneGeometry(1, 1); const inner = mesh(ig, earIn, g, 0.085, 0, 0.0092); inner.scale.set(0.15, 0.062, 1); inner.rotation.set(0, 0, 0); inner.material.side = DS; inner.castShadow = false;
      return { pv, g, s }; });
    // horns: the ram curl (or a runner's goat sweep / tall lyre), 32 rings, left tip chipped 3 cm, right horn notched; frost on every upward face, a 2 cm snow pad on each curl
    const HP = hi === 0 ? HORN_RAM : hi === 1 ? HORN_GOAT : HORN_LYRE, nRings = hi === 0 ? 32 : hi === 1 ? 24 : 22, hornM = S.m("#ffffff", { vertexColors: true, roughness: 0.8 });
    const horns = [1, -1].map((s) => { const geo = hornGeo(HP, s, nRings, s === 1 ? { chip: true } : { notch: true }); const m = mesh(geo, hornM, headS); return { geo, s }; });
    if (hi === 0) for (const s of [1, -1]) { const pad = mesh(sph(), snowM, headS, s * 0.34, 2.512, -0.02); pad.scale.set(0.05, 0.012, 0.032); pad.castShadow = false; }
    if (extraHorns) for (const s of [1, -1]) mesh(hornGeo([[0.14, 1.98, 0.13], [0.20, 2.06, 0.10], [0.255, 2.10, 0.06], [0.285, 2.085, 0.03]], s, 10, {}), hornM, headS);
    // the goatee: 9 locks from the chin knob, 0.22 long, #6a5a48 paling to #a89878, frost on 4 tips
    const goatTex = (fr) => once(`kbGoat${fr}`, () => cvs(32, 64, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, "#6a5a48"); gr.addColorStop(1, "#a89878"); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = "#4a3c2c"; g.lineWidth = 2; for (const x of [W * 0.3, W * 0.65]) { g.beginPath(); g.moveTo(x, H); g.lineTo(x, 0); g.stroke(); } if (fr) { const gf = g.createLinearGradient(0, H * 0.25, 0, 0); gf.addColorStop(0, "rgba(223,234,245,0)"); gf.addColorStop(1, "rgba(235,244,252,1)"); g.fillStyle = gf; g.fillRect(0, 0, W, H * 0.25); } }));
    const goat = Array.from({ length: 9 }, (_, i) => { const geo = lockGeom(), m = new THREE.Mesh(geo, S.m("#ffffff", { map: goatTex([1, 3, 5, 7].includes(i)), roughness: 0.9, side: DS })); m.frustumCulled = false; m.castShadow = false; root.add(m); return { geo, m, i }; });
    // snow pads on both shoulders and the hump (3 cm), 6 lumps that fall on each jam
    const pads = [[0.36, 1.765, 0.0, 0.09, 0.016, 0.07], [-0.36, 1.765, 0.0, 0.09, 0.016, 0.07], [0, 1.905, -0.10, 0.07, 0.016, 0.05]].map(([x, y, z, rx, ry, rz]) => { const o = mesh(sph(), snowM, chestS, x, y - 0.01, z); o.scale.set(rx, ry, rz); o.castShadow = false; return o; });
    const lumps = Array.from({ length: 6 }, (_, i) => { const o = mesh(sph(), snowM, root); const k = [0.022 + 0.01 * rnd(i), 0.016, 0.022]; o.scale.set(...k); o.castShadow = false; return { o, i, k, x: (i % 2 ? 1 : -1) * (0.30 + 0.06 * (i >> 1)), z: 0.02 - 0.04 * (i % 3) }; });


    // ---- belt, straps, buckles (leather #4a2c1a; 2 stitch rows, 60 stitches on the belt front; 9 brass rivets on the cross strap; an iron buckle 0.12 square; a BRASS buckle on each basket strap)
    const beltM = S.m("#ffffff", { map: beltTex(true), roughness: 0.7 }), strapM = S.m("#ffffff", { map: beltTex(false), roughness: 0.7 });
    { const pts = [], nr = []; for (let i = 0; i <= 64; i++) { const sf = torsoSurf(BELT_Y, i / 64, 0.020); pts.push(sf.p); nr.push(sf.n); } mesh(ribbon(pts, nr, BELT_W, 0.012), beltM, pelS);
      const bz = torsoSurf(BELT_Y, 0.5, 0.034).p; const bg = new THREE.Group(); bg.position.set(0, BELT_Y, bz[2]); pelS.add(bg);   // the iron buckle 0.12 square
      for (const [x, y, w, h] of [[-0.054, 0, 0.012, 0.12], [0.054, 0, 0.012, 0.12], [0, 0.054, 0.12, 0.012], [0, -0.054, 0.12, 0.012]]) mesh(new THREE.BoxGeometry(w, h, 0.012), ironM, bg, x, y, 0);
      mesh(new THREE.BoxGeometry(0.008, 0.10, 0.008), ironM, bg, 0.0, 0, 0.002); }
    const strapPath = (list, mirror, lift) => { const pts = [], nr = []; for (const [y, v] of list) { const sf = torsoSurf(y, mirror ? 1 - v : v, lift); pts.push(sf.p); nr.push(sf.n); } return [pts, nr]; };
    { const [pts, nr] = strapPath(CROSS_STRAP, false, 0.014); mesh(ribbon(pts, nr, 0.07, 0.010), strapM, chestS);
      const cu = new THREE.CatmullRomCurve3(pts.map((q) => V3(q))); for (let i = 0; i < 9; i++) { const q = cu.getPointAt((i + 0.5) / 9), nn = nr[Math.min(nr.length - 1, Math.floor(((i + 0.5) / 9) * nr.length))]; const r = mesh(sph(), brassM, chestS, q.x + nn[0] * 0.012, q.y, q.z + nn[2] * 0.012); r.scale.set(0.0075, 0.0075, 0.0045); r.castShadow = false; } }   // 9 brass rivets
    for (const m of [false, true]) { const [pts, nr] = strapPath(BASKET_STRAP, m, 0.024); const side = m ? 1 : -1;
      const ext = [[side * 0.17, 1.918, -0.395], [side * 0.14, 1.925, -0.33]]; const all = [...ext, ...pts], allN = [[side * 0.2, 0.3, 0.9], [side * 0.2, 0.5, 0.8], ...nr]; mesh(ribbon(all, allN, 0.05, 0.010), strapM, chestS);
      const q = torsoSurf(1.42, m ? 1 - 0.37 : 0.37, 0.04).p; const bk = new THREE.Group(); bk.position.set(q[0], q[1], q[2]); chestS.add(bk); for (const [x, y, w, h] of [[-0.0185, 0, 0.006, 0.05], [0.0185, 0, 0.006, 0.05], [0, 0.022, 0.04, 0.006], [0, -0.022, 0.04, 0.006]]) mesh(new THREE.BoxGeometry(w, h, 0.007), brassM, bk, x, y, 0); mesh(new THREE.BoxGeometry(0.004, 0.044, 0.005), brassM, bk, 0, 0, 0.002); }
    // ---- the chain and the 5 bells: a belt chain of 22 oval links with 3 cowbells on 3-link drops at links 6, 11, 16; 14 links hang from the non-working wrist with 2 small bells: 45 links
    const linkMats = [ironM, bloomM], BLOOM = new Set([3, 12, 20, 29, 38]); let linkN = 0;
    const mkLink = (par) => { const i = linkN++; const m = mesh(linkGeo(), BLOOM.has(i) ? bloomM : (i % 4 === 1 ? rustM : ironM), par); m.castShadow = false; return m; };
    const bellMat = (edel) => S.m("#ffffff", { map: bellTex(edel), roughness: 0.3, metalness: 0.7 });
    function buildBell(h, w, d, edel, rv) {   // origin at the leather loop (the top), hangs down -y; clapper ball 2 cm below the lip
      const g = new THREE.Group(); mesh(bellShell(h, w, d), bellMat(edel), g); mesh(bellLip(w, d, h), brassM, g);
      const lp = mesh(new THREE.TorusGeometry(0.012, 0.0032, 6, 14), leatherM, g, 0, 0.008, 0); lp.rotation.y = Math.PI / 2;
      for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const f = 0.22 + 0.15 * k, ww = (f < 0.3 ? 0.74 : f < 0.58 ? 0.92 : 1.0) * w * 0.98; const r = mesh(sph(), brassM, g, sx * ww, -h * f, 0); r.scale.setScalar(0.0034); r.castShadow = false; }   // 2 side seams of 5 rivets
      const clap = new THREE.Group(); clap.position.y = -h * 0.08; g.add(clap); const rod = mesh(unitCyl(), ironM, clap); rod.scale.set(0.0028, 1, 0.0028); rod.scale.y = h * 0.92 - 0.0; rod.rotation.x = Math.PI; rod.position.y = 0; const ball = mesh(sph(), ironM, clap, 0, -(h * 0.92) - 0.02, 0); ball.scale.setScalar(rv); ball.castShadow = false;
      return { g, clap }; }
    const chainLinks = Array.from({ length: 22 }, () => mkLink(root));
    const BELLS = [{ link: 6, h: 0.19, w: 0.075, edel: true, rv: 0.012 }, { link: 11, h: 0.17, w: 0.065, edel: false, rv: 0.012 }, { link: 16, h: 0.15, w: 0.06, edel: false, rv: 0.012 }];
    const drops = BELLS.map((b, bi) => { const g = new THREE.Group(); root.add(g); const lk = [1, 2, 3].map((m) => { const l = mkLink(g); l.position.y = -0.04 * m; l.rotation.y = m % 2 ? Math.PI / 2 : 0; return l; });
      const bell = buildBell(b.h, b.w, 0.05, b.edel, b.rv); bell.g.position.y = -0.04 * 3 - 0.034; g.add(bell.g); return { g, bell, bi, f: 2.1 }; });
    const wrist = new THREE.Group(); if (!runner) root.add(wrist);
    const wLinks = runner ? [] : Array.from({ length: 14 }, (_, i) => { const l = mkLink(wrist); l.position.y = -0.044 * i - 0.02; l.rotation.y = i % 2 ? 0 : Math.PI / 2; return l; });
    const wBells = runner ? [] : [{ h: 0.11, w: 0.045, at: 7, x: 0.03 }, { h: 0.09, w: 0.038, at: 14, x: 0 }].map((b, bi) => { const bell = buildBell(b.h, b.w, 0.03, false, 0.008); bell.g.position.set(b.x, -0.044 * b.at - 0.02 - (bi ? 0.05 : 0.035), 0); wrist.add(bell.g); return { bell, bi, f: 2.9 }; });
    const ringsB = [-0.30, 0.36].map((x, i) => { const r = mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 14), ironM, pelS, x, 1.10 - 0.02 * i, i ? 0.10 : 0.26); r.rotation.y = Math.PI / 2; return r; });
    // ---- the birch bunch in the working fist (7 sticks 0.50 long, 3 turns of twine, 3 curls of peeling bark, the outer third forks into dark twigs with 2 buds) + 3 spare bunches under the belt at the hip; a runner holds a torch instead
    const barkM = S.m("#ffffff", { map: barkTex(), roughness: 0.75 }), twigM = S.m(C.twig, { roughness: 0.8 }), budM = S.m("#6a4a2a", { roughness: 0.7 }), twineM = S.m(C.twine, { roughness: 0.85 }), curlM = S.m("#f4efe2", { roughness: 0.8, side: DS });
    const bunchOf = (seed) => { const g = new THREE.Group(), bp = birchParts(seed); mesh(bp.bark, barkM, g); mesh(bp.twig, twigM, g); mesh(bp.bud, budM, g); mesh(bp.twine, twineM, g); mesh(bp.curl, curlM, g).castShadow = false; return g; };
    const bunch = runner ? new THREE.Group() : bunchOf(0), torch = new THREE.Group(); root.add(bunch, torch);
    const spares = runner ? [] : [1, 2, 3].map((k) => { const g = bunchOf(k); g.scale.setScalar(0.96); pelS.add(g); const m = spec.mirror ? 1 : -1; g.position.set(m * (0.31 + 0.022 * k), 1.12, -0.06 + 0.07 * (k - 2)); g.quaternion.copy(qFromTo([0, 1, 0], [m * (-0.12 + 0.1 * k), -0.78, -0.58 + 0.14 * k])); return g; });
    if (runner) { const sh = mesh(unitCyl(), S.m("#8a6a42", { roughness: 0.85 }), torch); sh.scale.set(0.016, 0.55, 0.016); sh.position.y = -0.10; const hd = mesh(sph(), S.m("#2a1a10", { roughness: 0.9 }), torch, 0, 0.50, 0); hd.scale.set(0.036, 0.055, 0.036); for (let k = 0; k < 3; k++) { const w = mesh(new THREE.TorusGeometry(0.0345, 0.0035, 5, 14), twineM, torch, 0, 0.465 + 0.03 * k, 0); w.rotation.x = Math.PI / 2; }
      const fl = [["#ff9a3a", 0.075, 0.36], ["#ffb45a", 0.055, 0.27], ["#fff0c0", 0.032, 0.17]].map(([c, r, h], i) => { const o = steam(new THREE.Mesh(new THREE.ConeGeometry(r, h, 10, 1, false), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.92 }))); o.position.y = 0.55 + h * 0.5 - 0.02; torch.add(o); return o; });
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: once("kbTorchGlow", () => radialTexture([[0, "rgba(255,154,58,0.85)"], [1, "rgba(255,154,58,0)"]])), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(0.8); gl.position.y = 0.72; torch.add(gl); gl.userData.noOutline = true; torch.userData.fl = fl; torch.userData.gl = gl; }


    // ---- the basket on his back + its lid (not on a runner); ground truth: DESIGN section B
    const basketG = new THREE.Group(), lidG = new THREE.Group(); chestS.add(basketG); basketG.visible = !runner;
    const wickerM = [S.m(C.wicker, { roughness: 0.85 }), S.m(mixHex(C.wicker, C.wickerLt, 0.22), { roughness: 0.85 }), S.m(mixHex(C.wicker, C.wickerSh, 0.35), { roughness: 0.9 }), S.m(C.wickerLt, { roughness: 0.8 }), S.m(C.wickerSh, { roughness: 0.9 })];
    let BP = null, lidParts = null;
    if (!runner) {
      BP = basketParts();
      mesh(BP.outer, S.m(C.wickerGap, { roughness: 1 }), basketG); mesh(BP.inner, S.m("#1a1210", { roughness: 1, side: THREE.BackSide }), basketG);
      mesh(BP.stakes, wickerM[2], basketG); mesh(BP.weavers, wickerM[0], basketG); mesh(BP.rim, wickerM[1], basketG); mesh(BP.foot, wickerM[2], basketG); mesh(BP.ends, wickerM[3], basketG).castShadow = false;
      mesh(BP.patchStakes, wickerM[3], basketG); mesh(BP.patchWeavers, wickerM[3], basketG);
      const bmat = S.m("#ffffff", { map: beltTex(false), roughness: 0.7, side: DS });
      BP.belts.forEach((b, i) => { mesh(b, bmat, basketG); const q = bkP(BK.belts[i], 0, 0.026); const bg = new THREE.Group(); bg.position.set(q[0], q[1], q[2]); bg.rotation.y = Math.PI / 2; basketG.add(bg); for (const [x, y, w, h] of [[-0.0175, 0, 0.006, 0.05], [0.0175, 0, 0.006, 0.05], [0, 0.022, 0.04, 0.006], [0, -0.022, 0.04, 0.006]]) mesh(new THREE.BoxGeometry(w, h, 0.007), brassM, bg, x, y, 0); mesh(new THREE.BoxGeometry(0.004, 0.044, 0.005), brassM, bg, 0, 0, 0.002); });   // 2 leather belts with brass buckles
      for (const x of [-0.15, 0, 0.15]) { const l = mesh(new THREE.TorusGeometry(0.02, 0.0062, 6, 14), leatherM, basketG, x, BK.y1 - 0.004, BK.cz - bkR(BK.y1).rz - 0.006); l.rotation.y = Math.PI / 2; l.scale.set(1, 1.1, 1); }   // 3 hinge loops at the back rim
      lidG.position.set(0, BK.y1, BK.cz - bkR(BK.y1).rz); basketG.add(lidG);   // hinge line y 2.08, z -0.94
      mesh(lidDome(1), S.m(C.wickerGap, { roughness: 1 }), lidG); mesh(lidCoil(), wickerM[4], lidG); mesh(lidEdge(), wickerM[4], lidG);
      const under = mesh(lidDome(0.985), S.m("#ffffff", { map: lidUnderTex(), roughness: 0.8, side: THREE.BackSide }), lidG); under.castShadow = false;
      mesh(sph(), wickerM[4], lidG, 0, LID.h + 0.004, LID.d).scale.set(0.022, 0.016, 0.022);   // the centre knot of the spiral
      const pad = mesh(sph(), snowM, lidG, 0, LID.h - 0.005, LID.d); pad.scale.set(0.22, 0.012, 0.17); pad.castShadow = false;   // 2 cm of snow
      const lloop = mesh(new THREE.TorusGeometry(0.014, 0.0035, 6, 12), leatherM, lidG, 0, 0.004, 2 * LID.d + 0.006); lloop.rotation.y = Math.PI / 2;
      const toggleHang = new THREE.Group(); toggleHang.position.set(0, 0.0, 2 * LID.d + 0.02); lidG.add(toggleHang); const tg = mesh(unitCyl(), woodM, toggleHang); tg.scale.set(0.006, 0.05, 0.006); tg.rotation.x = Math.PI; tg.castShadow = false;
      const toggleSeat = mesh(unitCyl(), woodM, basketG, 0, BK.y1 + 0.004, BK.cz + bkR(BK.y1).rz + 0.016); toggleSeat.scale.set(0.006, 0.05, 0.006); toggleSeat.rotation.z = Math.PI / 2; toggleSeat.position.x = 0.025; toggleSeat.castShadow = false;
      lidParts = { pad, toggleHang, toggleSeat };
    }
    // ---- the door-9 kid (built inside; only ever seen in the basket): 0.43 tall, an egg 0.34 x 0.30 x 0.27 on 0.09 legs, Spud's skin, a leaf, a red scarf (22 rows, wound twice, 2 ends with 7 tassels each),
    //      cream mittens on a string, ONE red suede boot with a fleece cuff (right) and a sock with 5 stripes (left)
    const kidG = new THREE.Group(); chestS.add(kidG); kidG.visible = kidOn;
    const kidP = { };
    if (kidOn) {
      const skin = S.m(C.potato, { roughness: 0.7 }), dark = S.m("#2a1a10", { roughness: 0.4 }), scarfM = S.m("#ffffff", { map: scarfTex(1), roughness: 0.95, side: DS }), creamM = S.m(C.scarfCream, { roughness: 0.9 }), suede = S.m("#b52a2a", { roughness: 1 }), fleece = S.m("#f6f1e6", { roughness: 1 }), sockM = S.m("#ffffff", { map: sockTex(), roughness: 0.95 });
      const eggSecs = [[0.09, 0.07, 0.065], [0.12, 0.12, 0.105], [0.18, 0.15, 0.135], [0.26, 0.15, 0.135], [0.34, 0.125, 0.115], [0.40, 0.07, 0.07], [0.43, 0.02, 0.02]].map(([y, w, d]) => mkSec([0, y, 0], w, d, d, 2.2)), eg = makeLoft(eggSecs, { sub: 3, radial: 24, ref: [0, 0, 1] }); eg.userData.set(eggSecs); mesh(eg, skin, kidG);
      const leaf = mesh(sph(), S.m("#6aa84a", { roughness: 0.6 }), kidG, 0, 0.435, 0.012); leaf.scale.set(0.014, 0.004, 0.032); leaf.rotation.x = 0.35;
      const eyesK = [1, -1].map((s) => { const o = mesh(sph(), dark, kidG, s * 0.055, 0.30, 0.125); o.scale.set(0.015, 0.02, 0.007); const h = mesh(sph(), catchM, kidG, s * 0.055 - 0.003, 0.308, 0.131); h.scale.setScalar(0.0045); h.userData.noOutline = true; const b = mesh(new THREE.TorusGeometry(0.022, 0.0017, 5, 12, Math.PI * 0.8), dark, kidG, s * 0.055, 0.328, 0.122); b.rotation.z = Math.PI * 0.1; return o; });
      const mouth = mesh(sph(), S.m("#5a1a22", { roughness: 0.6 }), kidG, 0, 0.262, 0.133); mouth.scale.set(0.02, 0.002, 0.004);
      const legsK = [1, -1].map((s) => { const lg = new THREE.Group(); lg.position.set(s * 0.06, 0.09, 0); kidG.add(lg); const sh = mesh(unitCyl(), s < 0 ? suede : sockM, lg); sh.scale.set(s < 0 ? 0.034 : 0.027, -0.09, s < 0 ? 0.034 : 0.027); sh.position.y = 0;
        const ft = mesh(sph(), s < 0 ? suede : sockM, lg, 0, -0.082, 0.026); ft.scale.set(s < 0 ? 0.036 : 0.03, 0.022, 0.056);
        if (s < 0) { const cuff = mesh(new THREE.TorusGeometry(0.034, 0.012, 7, 16), fleece, lg, 0, -0.012, 0); cuff.rotation.x = Math.PI / 2; } return lg; });
      const sc = [0, 1].map((k) => { const t = mesh(new THREE.TorusGeometry(0.146 + 0.003 * k, 0.026, 8, 28), scarfM, kidG, 0, 0.215 - 0.036 * k, 0.0); t.rotation.x = Math.PI / 2; t.scale.set(1.0, 0.92, 1); { const uv = t.geometry.attributes.uv; if (!t.geometry.userData.s) { for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 11); t.geometry.userData.s = 1; } } return t; });
      const mkEnd = (par) => { const g = new THREE.Group(); par.add(g); const band = mesh(new THREE.PlaneGeometry(0.06, 0.16, 1, 6), scarfM, g); band.position.y = -0.08; { const uv = band.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getY(i) * 8); } band.castShadow = false;
        for (let t = 0; t < 7; t++) { const tl = mesh(taperTube([[0, 0, 0], [0, -0.014, 0.001], [0, -0.028, 0]], 0.0042, 0.002, 5, 3, 1), creamM, g, -0.0275 + t * 0.0092, -0.16, 0); tl.castShadow = false; }   // 7 cream tassels
        return g; };
      const ends = [0, 1].map((k) => { const g = mkEnd(kidG); g.position.set(k ? 0.05 : -0.05, 0.20, 0.17); return g; }), endOut = mkEnd(basketG);
      const strP = [];  for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; strP.push([Math.cos(a) * 0.155, 0.235, -Math.abs(Math.sin(a)) * 0.0 - Math.sin(a) * 0.1]); } mesh(loopTube(strP, 0.0016, 40, 4), creamM, kidG).castShadow = false;   // the mitten string behind the neck
      const mit = [1, -1].map((s) => { const g = new THREE.Group(); kidG.add(g); const hnd = mesh(sph(), creamM, g); hnd.scale.set(0.026, 0.032, 0.02); const th = mesh(sph(), creamM, g, -s * 0.024, 0.006, 0.004); th.scale.set(0.011, 0.018, 0.011); return { g, s }; });
      Object.assign(kidP, { eg, eyesK, mouth, legsK, ends, endOut, mit, sc });
    }
    // ---- the tongue (a loft, hangs plumb), the breath, the flakes
    const TN = 14, tongueSecs = () => Array.from({ length: TN }, (_, i) => mkSec([0, 1.67 - 0.02 * i, 0.4], 0.03, 0.006, 0.006, 2.4));
    const tongueGeo = makeLoft(tongueSecs(), { sub: 3, radial: 14, ref: [0, 0, 1] }), tongueM = S.m("#ffffff", { map: tongueTex(), roughness: 0.45 }), tongueMesh = mesh(tongueGeo, tongueM, root); tongueMesh.castShadow = false; tongueGeo.userData.set(tongueSecs());
    const puffM = () => { const m = new THREE.MeshBasicMaterial({ color: C.puff, transparent: true, depthWrite: false }); m.userData.noOutline = true; return m; };
    const puffs = Array.from({ length: 4 }, () => { const o = steam(new THREE.Mesh(sph(), puffM())); root.add(o); return o; });
    const wisps = Array.from({ length: 4 }, () => { const o = steam(new THREE.Mesh(sph(), puffM())); root.add(o); return o; });   // 2 off the tongue + 2 drawn INTO the nose
    const flakes = Array.from({ length: 3 }, (_, i) => { const o = steam(new THREE.Mesh(new THREE.CircleGeometry(1, 6), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, side: DS, depthWrite: false }))); root.add(o); return o; });


    const mouthG = new THREE.Group(); mouthG.name = "mouthHold"; mouthG.position.set(...M0); headS.add(mouthG);
    const _v = new THREE.Vector3();
    const LICK_TIP = (() => { const Zr = solve({ nose: 1 }, {}), p = V3([0.10, 2.05, 0.85]).sub(Zr.AW).applyQuaternion(Zr.headQ.clone().invert()).add(V3(AT0)); return arr(p); })();   // the tip of a lick, in the head frame (world (0.10, 2.05, 0.85) at nose 1)
    return {
      grip: 0, mouth: mouthG,
      apply(ps, t) {
        const tt = t ?? 0, g = (k, d = 0) => ps[k] ?? spec[k] ?? d, Z = solve(ps, spec, tt), ring = clamp(g("ring")), gt = Z.gt, gw = Z.gw;
        pelG.position.copy(Z.H); pelG.quaternion.copy(Z.Qp); chestG.position.copy(Z.H); chestG.position.y += Z.lift2; chestG.quaternion.copy(Z.Qc);
        const stow = Z.stow, lidV = clamp(g("lid")), kick = Math.sin(2 * TAU * g("kidKick")), kf = sstep(g("kidKick") / 0.25);
        // ---- the basket rides the torso: it bobs 2 cm a footfall and dips 3 cm when the kid lands; the lid opens about the back hinge, a bump of 3 degrees a kick
        if (!runner) {
          basketG.position.y = 0.02 * gw * (0.5 + 0.5 * Math.cos(2 * TAU * gt)) - 0.03 * Math.sin(Math.PI * clamp((stow - 0.7) / 0.3)) * (stow < 1 ? 1 : 0);
          const ang = rad(75) * lidV + rad(3) * Math.max(0, kick) * kf; lidG.rotation.x = -ang;
          const slide = sstep((lidV - 0.3) / 0.12); lidParts.pad.position.z = LID.d - 0.34 * slide; lidParts.pad.position.y = LID.h - 0.005 - 0.05 * slide; lidParts.pad.visible = slide < 0.98; lidParts.pad.scale.set(0.22 * (1 - slide * 0.4), 0.012 * (1 - slide), 0.17);
          const seated = lidV < 0.02; lidParts.toggleSeat.visible = seated; lidParts.toggleHang.visible = !seated;
          const Qw = Z.Qc.clone().multiply(qX(-ang)), dl = V3([0, -1, 0]).applyQuaternion(Qw.clone().invert()); lidParts.toggleHang.quaternion.copy(qFromTo([0, -1, 0], arr(dl))).multiply(qX(0.12 * Math.sin(TAU * 0.9 * tt) * (1 - Math.min(1, lidV * 4))));
        }
        // ---- neck (stretches), head, jaw
        { const a = Z.NB, b = Z.AW, mid = a.clone().lerp(b, 0.5), bow = V3([0, 0.02, 0]); const pts = [a, a.clone().lerp(b, 0.34).add(bow), a.clone().lerp(b, 0.68).add(bow), b], wd = [0.125, 0.113, 0.103, 0.098];
          neckGeo.userData.set(pts.map((q, i) => mkSec(arr(q), wd[i], 0.105, 0.105, 2.2))); }
        headG.position.copy(Z.AW); headG.quaternion.copy(Z.headQ); jawG.rotation.x = Z.jawA;
        // ---- eyes
        { const lids = clamp(g("lids", 0.3) + 0.4 * clamp(ps.blink ?? 0)), glow = clamp(g("glow", 0.5), 0, 1.2), lx = clamp(g("lookX"), -1, 1), ly = clamp(g("lookY"), -1, 1);
          eyeM.emissiveIntensity = 0.12 + 0.9 * glow;
          for (const e of eyes) { e.lidP.rotation.x = rad(35 + 140 * clamp(lids)); e.halo.material.opacity = clamp(glow) * 0.9; e.halo.scale.setScalar(0.10 * clamp(glow)); e.halo.visible = glow > 0.02; e.g.rotation.set(-ly * rad(18), lx * rad(25), 0); } }
        { const e = clamp(g("ears"), -1, 1); for (const E of ears) { E.pv.scale.x = E.s; E.pv.rotation.set(0, rad(38) * Math.max(0, -e), 0); E.g.rotation.z = -rad(e >= 0 ? lerp(15, -22, e) : lerp(15, 45, -e)); } }
        nostrils.forEach((n) => { n.scale.y = 0.002 + 0.0025 * Z.snA; });
        // ---- the 240 locks, the goatee, the ice beads: every lock hangs plumb whatever the body does
        { const arm = (k, u) => { const A = Z.arms[k]; return u < 1 ? mix3(A.sh, A.elbow, u) : mix3(A.elbow, A.wrist, u - 1); }, leg = (k, u) => { const A = Z.legs[k]; return u < 1 ? mix3(A.hip, A.hock, u) : mix3(A.hock, A.ank, u - 1); };
          const calm = Math.min(1, 0.25 + gw + ring);
          for (const L of locks) { const d = L.d; let R, n;
            if (d.frame === "head") { R = arr(Z.headPlace(d.p)); n = arr(V3(d.n).applyQuaternion(Z.headQ)); }
            else if (d.frame === "chest") { R = arr(Z.chestPt(d.p)); n = arr(V3(d.n).applyQuaternion(Z.Qc)); }
            else if (d.frame === "pel") { R = arr(Z.pelPt(d.p)); n = arr(V3(d.n).applyQuaternion(Z.Qp)); }
            else if (d.frame[0] === "a") { const k = +d.frame[3], q = arm(k, d.p[0]); R = [q[0] + d.p[1], q[1], q[2] + d.p[2]]; n = d.n; }
            else { const k = +d.frame[3], q = leg(k, d.p[0]); R = [q[0] + d.p[1], q[1], q[2] + d.p[2]]; n = d.n; }
            const pts = lockPath(R, n, d.L * (0.85 + 0.55 * rnd(d.id * 7 + 3)), rnd(d.id) - 0.5, L.sw, tt, calm); setRibbon(L.geo, pts, d.r0, n); if (L.bead) L.bead.position.set(...pts[pts.length - 1]); }
          goat.forEach((G) => { const R = arr(Z.jawPlace([(G.i - 4) * 0.0075, 1.575, 0.422])), n = arr(V3([(G.i - 4) * 0.05, -0.2, 0.6]).applyQuaternion(Z.headQ)); setTube(G.geo, lockPath(R, n, 0.22 - Math.abs(G.i - 4) * 0.012, (G.i % 3) - 1, [0, 0, G.i], tt, calm, 0.12), 0.011); }); }
        // ---- legs, hooves
        Z.legs.forEach((l, k) => { const mid = (a, b, f) => mix3(a, b, f), hp = [l.hip[0], l.hip[1] + 0.04, l.hip[2]];
          limbs[k].leg.userData.set([hp, mid(l.hip, l.hock, 0.5), l.hock, mid(l.hock, l.ank, 0.5), l.ank].map((p, i) => mkSec(p, LEG_R[i], LEG_R[i], LEG_R[i], 2.3)));
          const o = V3(l.ank).add(V3([0, -LEG.ay, 0]).applyQuaternion(l.hq)); hooves[k].position.copy(o); hooves[k].quaternion.copy(l.hq); });
        // ---- arms, hands, the bunch (or a runner's torch), the stow claw
        const work = Z.arms.find((a) => a.work), bunchOn = !runner && clamp(g("bunch", 1)) > 0.02;
        Z.arms.forEach((A, k) => { const mid = (a, b) => mix3(a, b, 0.5);
          limbs[k].arm.userData.set([A.sh, mid(A.sh, A.elbow), A.elbow, mid(A.elbow, A.wrist), A.wrist].map((p, i) => mkSec(p, ARM_R[i], ARM_R[i], ARM_R[i], 2.2)));
          const d = nrm3([A.wrist[0] - A.elbow[0], A.wrist[1] - A.elbow[1], A.wrist[2] - A.elbow[2]]), H = hands[k]; let q, pos = A.wrist;
          if (A.work && A.fist) { const b = A.bunchDir, yv = [d[1] * b[2] - d[2] * b[1], d[2] * b[0] - d[0] * b[2], d[0] * b[1] - d[1] * b[0]]; q = basisQ(d, yv); const gc = V3([0, -0.032, 0.068]).applyQuaternion(q); pos = [A.fist[0] - gc.x, A.fist[1] - gc.y, A.fist[2] - gc.z];
            H.curl(bunchOn || runner ? 1.0 : 0.4, bunchOn || runner ? 1.0 : 0.3); }
          else { q = basisQ(d, [A.s, 0, 0]); H.curl(0.35 + 0.5 * (A.grip || 0), 0.4); }
          H.g.position.set(...pos); H.g.quaternion.copy(q); });
        { const A = work; const b = A.bunchDir;
          bunch.visible = bunchOn; bunch.position.set(A.fist[0] - b[0] * 0.10, A.fist[1] - b[1] * 0.10, A.fist[2] - b[2] * 0.10); bunch.quaternion.copy(qFromTo([0, 1, 0], b));
          torch.visible = runner; if (runner) { const tq = clamp(g("torch", 1)); torch.position.set(A.fist[0], A.fist[1], A.fist[2]); torch.quaternion.copy(qFromTo([0, 1, 0], [b[0] * 0.5, 1, b[2] * 0.5 + 0.1])); torch.userData.fl.forEach((o, i) => { const f = 0.85 + 0.15 * Math.sin(TAU * (6 + i) * tt + i * 2.1); o.scale.set(f, f * (0.9 + 0.2 * Math.sin(TAU * 8 * tt + i)), f); o.visible = tq > 0.02; o.material.opacity = 0.92 * tq; }); torch.userData.gl.material.opacity = tq; torch.userData.gl.visible = tq > 0.02; } }
        { const sp = Math.round(clamp(g("spares", 3), 0, 3)); spares.forEach((s, i) => { s.visible = i < sp; }); }
        // ---- belt chain (22 links, sag to y 0.90), 3 cowbells on 3-link drops, the wrist chain with 2 small bells; 'ring' swings them 22 degrees (big 2.1 Hz, small 2.9 Hz), clappers a quarter cycle late
        { const A = Z.pelPt([-0.30, 1.10, 0.26]), B = Z.pelPt([0.36, 1.08, 0.10]), sag = Math.max(0.05, (A.y + B.y) / 2 - 0.90), sw = (u) => 0.04 * (ring * Math.sin(TAU * 1.0 * tt) + 0.5 * gw * Math.sin(TAU * 2 * gt)) * 4 * u * (1 - u);
          const P = (u) => [A.x + (B.x - A.x) * u + sw(u), A.y + (B.y - A.y) * u - sag * 4 * u * (1 - u), A.z + (B.z - A.z) * u];
          ringsB[0].position.copy(A).sub(Z.H).applyQuaternion(Z.Qp.clone().invert()).add(V3(HIP0)); ringsB[1].position.copy(B).sub(Z.H).applyQuaternion(Z.Qp.clone().invert()).add(V3(HIP0));
          chainLinks.forEach((l, i) => { const u = (i + 0.5) / 22, p = P(u), a = P(Math.max(0, u - 0.02)), b = P(Math.min(1, u + 0.02)), T = nrm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]); l.position.set(...p); l.quaternion.copy(qFromTo([0, 1, 0], T)).multiply(qY(i % 2 ? Math.PI / 2 : 0)); });
          drops.forEach((D, i) => { const u = (BELLS[i].link - 0.5) / 22, p = P(u), ph = i * 1.9, a1 = rad(22) * ring * Math.sin(TAU * 2.1 * tt + ph) + rad(7) * gw * Math.sin(2 * TAU * gt + ph); D.g.position.set(...p); D.g.rotation.set(0.4 * a1, 0, a1); D.bell.clap.rotation.z = rad(28) * ring * Math.sin(TAU * 2.1 * tt + ph - Math.PI / 2) + 0.4 * a1; D.bell.clap.rotation.x = 0.25 * Math.sin(TAU * 2.1 * tt + ph - 0.5) * ring; }); }
        if (!runner) { const A = Z.arms.find((a) => !a.work), d = nrm3([A.wrist[0] - A.elbow[0], A.wrist[1] - A.elbow[1], A.wrist[2] - A.elbow[2]]);
          wrist.position.set(A.wrist[0] - d[0] * 0.06, A.wrist[1] - d[1] * 0.06 - 0.073, A.wrist[2] - d[2] * 0.06); wrist.rotation.set(0.05 * ring * Math.cos(TAU * 1.1 * tt), 0, 0.07 * ring * Math.sin(TAU * 1.1 * tt));
          wBells.forEach((w, i) => { const ph = 0.8 + i * 1.3, a1 = rad(22) * ring * Math.sin(TAU * 2.9 * tt + ph); w.bell.g.rotation.set(0.4 * a1, 0, a1); w.bell.clap.rotation.z = rad(28) * ring * Math.sin(TAU * 2.9 * tt + ph - Math.PI / 2) + 0.4 * a1; }); }
        // ---- snow lumps that fall on each jam
        { const p = clamp((Z.jam - 0.72) / 0.28); lumps.forEach((L) => { const q = Z.chestPt([L.x, 1.76, L.z]); L.o.visible = p > 0.001 && p < 0.97; L.o.position.set(q.x, q.y - 0.02 - 1.15 * p * p * (0.7 + 0.1 * L.i), q.z + 0.05 * p * (1 + (L.i % 2))); { const m = 1 - 0.5 * sstep((p - 0.8) / 0.2); L.o.scale.set(L.k[0] * m, L.k[1] * m, L.k[2] * m); } });   // (was setScalar: a 1 m snow ball for a frame on every jam, Krampus myth 01 draft) }
        // ---- the tongue: hangs plumb from the mouth (0 inside, 0.35 the loll of 0.28 m, 1 unrolled to 0.72 m), a lick stretches it up and forward, round a flake, and snaps back
        { const tg = g("tongue", 0.35), tl = tg <= 0 ? 0 : tg <= 0.35 ? 0.28 * (tg / 0.35) : 0.28 + 0.44 * ((tg - 0.35) / 0.65), lk = g("lick"), lp = lk - Math.floor(lk), lickOn = lp > 1e-4 && lp < 1 - 1e-4;
          tongueMesh.visible = tg > 0.02 || lickOn; const R = Z.jawPlace(TR0), fwd = V3([0, 0, 1]).applyQuaternion(Z.headQ), fh = V3([fwd.x, 0, fwd.z]).normalize();
          const hang = [R.clone()]; { let pcur = R.clone(), sacc = 0; const ds = tl / (TN - 1); for (let i = 1; i < TN; i++) { sacc += ds; const kk = sstep(sacc / 0.11), dir = fwd.clone().multiplyScalar(0.9 * (1 - kk)).add(V3([0, -(0.25 + 0.75 * kk), 0])).normalize(); pcur = pcur.clone().addScaledVector(dir, ds); hang.push(pcur); } }
          let pts = hang.map((p, i) => { const u = i / (TN - 1); return p.clone().addScaledVector(fh, 0.04 * Math.max(0, (u - 0.7) / 0.3) ** 2).add(V3([0.004 * Math.sin(TAU * 0.8 * tt + i * 0.5) * u, 0, 0])); });
          let tipW = null;
          if (lickOn) { const wl = lp < 0.3 ? sstep(lp / 0.3) : lp < 0.7 ? 1 : 1 - sstep((lp - 0.7) / 0.3), ub = clamp((lp - 0.3) / 0.4), T0 = Z.headPlace(LICK_TIP), sweep = (ub - 0.5) * 0.25 * (lp >= 0.3 && lp <= 0.7 ? 1 : (lp < 0.3 ? 0 : 0));
            const tip = V3([T0.x + (lp < 0.3 ? 0 : lp <= 0.7 ? -(0.5 - ub) * 0.25 + (-0.125 + 0.125) : 0.125) * 1, T0.y + (lp >= 0.3 && lp <= 0.7 ? 0.03 * Math.sin(Math.PI * ub) : 0), T0.z]);
            if (lp > 0.7) tip.x = T0.x + 0.125 * (1 - sstep((lp - 0.7) / 0.3)); if (lp >= 0.3 && lp <= 0.7) tip.x = T0.x - 0.125 + 0.25 * ub;
            const lickPts = pts.map((_, i) => { const u = i / (TN - 1); return R.clone().lerp(tip, u).add(V3([0, 0.03 * Math.sin(Math.PI * u), 0])); }); pts = pts.map((p, i) => p.clone().lerp(lickPts[i], wl)); tipW = { tip: pts[TN - 1], wl, ub, lp }; }
          const Lc = pts.reduce((a, p, i) => i ? a + p.distanceTo(pts[i - 1]) : 0, 0), wScale = lickOn ? 1 : 1;
          tongueGeo.userData.set(pts.map((p, i) => { const u = i / (TN - 1), w = 0.0375 * (1 - 0.6 * u) * (1 + 0.012 * Math.sin(TAU * 3 * u + 1)) * Math.sqrt(Math.max(0.04, 1 - sstep((u - 0.82) / 0.18) ** 2)); return mkSec(arr(p), Math.max(0.004, w), 0.006, 0.006, 2.4); }));
          flakes.forEach((f, i) => { const on = !!tipW && tipW.lp > 0.3 && tipW.lp < 0.9; f.visible = on; if (on) { const melt = clamp((tipW.lp - 0.35) / 0.55); f.position.copy(pts[TN - 2 - i * 2 > 0 ? TN - 2 - i * 2 : 1]).add(V3([0.0, 0.006, 0.01])); f.scale.setScalar(0.013 * (1 - 0.8 * melt * (0.5 + 0.25 * i))); f.lookAt(f.position.clone().add(V3([0, 0.3, 1]))); f.material.opacity = 1 - 0.6 * melt; } });
          // ---- breath (4 cel puffs 0.40 from the nostrils, 0.5 Hz, 1 Hz at breath 1, reach 0.7 m), 2 wisps off a long tongue, 2 wisps drawn INTO the nose on a sniff
          const br = clamp(g("breath")), nose = Z.headPlace([0, 1.797, 0.468]), f2 = 0.5 + 0.5 * br, tw = clamp((tg - 0.5) / 0.25);
          puffs.forEach((o, k) => { const ph = frac(tt * f2 + k / 4), d = 0.40 + 0.30 * ph; o.visible = br > 0.01; o.position.copy(nose).addScaledVector(fwd, d).add(V3([0.03 * Math.sin(k * 2.3), -0.12 * ph, 0])); o.scale.setScalar(0.06 + 0.09 * ph); o.material.opacity = br * 0.85 * (1 - ph) ** 0.8; });
          wisps.forEach((o, k) => { if (k < 2) { const ph = frac(tt * 0.9 + k / 2), q = pts[Math.floor(TN * 0.55)]; o.visible = tw > 0.02; o.position.set(q.x + 0.01 * Math.sin(k * 3 + ph * 4), q.y + 0.04 + 0.16 * ph, q.z + 0.03 * ph); o.scale.setScalar(0.018 + 0.03 * ph); o.material.opacity = tw * 0.7 * (1 - ph); } else { const ph = frac(Z.snA * 0.0 + tt * 1.3 + (k - 2) / 2); o.visible = Z.snA > 0.05; const side = V3([1, 0, 0]).applyQuaternion(Z.headQ); o.position.copy(nose).addScaledVector(fwd, 0.14 * (1 - ph)).addScaledVector(side, (k === 2 ? -1 : 1) * 0.022 * (1 - ph)).add(V3([0, -0.04 * (1 - ph), 0])); o.scale.setScalar(0.014 + 0.012 * (1 - ph)); o.material.opacity = Z.snA * 0.75 * Math.sin(Math.PI * clamp(ph)); } }); }
        // ---- the door-9 kid in the basket
        if (kidOn) {
          const pk = clamp(g("kidPeek")), sc = Z.stow, drop = clamp((sc - 0.3) / 0.5), side = -Z.wk;
          const ky = pk < 0.5 ? lerp(1.34, 1.82, sstep(pk / 0.5)) : lerp(1.82, 1.95, sstep((pk - 0.5) / 0.5)), kz = lerp(-0.62, -0.50, sstep(pk)), stowed = [0, ky, kz], dang = [side * 0.30, 2.07, -0.29];
          let pos = [lerp(dang[0], stowed[0], sstep(drop)), lerp(dang[1], stowed[1], drop * drop), lerp(dang[2], stowed[2], sstep(drop))], rx = 0;
          if (sc < 0.3) { rx = -0.12; } else if (sc < 0.8) rx = -0.12 * (1 - drop);
          if (kf > 0) { pos = [lerp(pos[0], 0, kf), lerp(pos[1], 2.20, kf), lerp(pos[2], -0.52, kf)]; rx = lerp(rx, Math.PI, kf); }
          kidG.position.set(...pos); kidG.rotation.set(rx, 0, 0);
          const ped = sc < 0.3 ? 0.8 * Math.sin(TAU * 1.7 * tt) : 0, kicks = rad(25) * kick * kf;
          kidP.legsK.forEach((lg, i) => { lg.rotation.x = (i ? 1 : -1) * (ped + kicks); });
          const tk = clamp(g("kidTalk")); kidP.mouth.scale.set(lerp(0.02, 0.014, tk), lerp(0.002, 0.014, tk), 0.004);
          kidP.mit.forEach((m) => { const hang = [m.s * 0.15, 0.16, 0.10], rim = [m.s * 0.10, 2.11 - pos[1], -0.385 - pos[2]], f = sstep(pk) * (kf > 0.5 ? 0 : 1); m.g.position.set(lerp(hang[0], rim[0], f), lerp(hang[1], rim[1], f), lerp(hang[2], rim[2], f)); });
          const out = clamp(g("scarfOut")) > 0.5; kidP.ends[1].visible = !out; kidP.endOut.visible = out; kidP.endOut.position.set(0.12, BK.y1 + 0.004, BK.cz + bkR(BK.y1).rz + 0.01); kidP.endOut.rotation.set(-0.35 + 0.05 * Math.sin(TAU * 0.6 * tt), 0, 0.05);
        }
      },
    };
  },


  // ================================================================================================ his shadow (panel 01): a flat shape on two planes, the apron (to z +1.5) and the door above it, bent 90 degrees where they meet
  krampusshadow(P) {
    const spec = P.spec || {}, root = new THREE.Group(); P.whole.add(root);
    const TW = 3.6, TH = 3.3, CW = 1024, CH = 1024, DOOR_T = 1.5;   // unfolded: t = 1.5 - z on the apron (z 1.5 .. 0), t = 1.5 + y on the door; x -1.8 .. 1.8
    const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    let drawn = null;
    const draw = (hornRock, bellSw) => {
      const g = cv.getContext("2d"); g.clearRect(0, 0, CW, CH);
      const tmp = document.createElement("canvas"); tmp.width = CW; tmp.height = CH; const h = tmp.getContext("2d");
      // the figure's y 0.85 sits on the fold between apron and door: the legs and the bells' chain fall on the step, the body, horns and fist climb the door (horn tips reach 1.65 on the leaf at grow 1)
      const SX = 1.2, PX = CW / TW, PY = CH / TH, FOLD = 0.85, X = (x) => (x * SX + TW / 2) * PX, Y = (y) => CH - (DOOR_T + (y - FOLD)) * PY, RX = (w) => w * SX * PX, RY = (w) => w * PY;
      h.fillStyle = "#000"; h.strokeStyle = "#000"; h.lineCap = "round"; h.lineJoin = "round";
      const poly = (pts) => { h.beginPath(); pts.forEach(([x, y], i) => (i ? h.lineTo(X(x), Y(y)) : h.moveTo(X(x), Y(y)))); h.closePath(); h.fill(); };
      const smooth = (pts) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal"); poly(c.getPoints(90).map((v) => [v.x, v.y])); };
      const taper = (pts, w0, w1) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "centripetal"), N = Math.ceil(c.getLength() / 0.005); for (let i = 0; i <= N; i++) { const f = i / N, v = c.getPointAt(f), w = w0 + (w1 - w0) * f; h.beginPath(); h.ellipse(X(v.x), Y(v.y), RX(w), RY(w), 0, 0, TAU); h.fill(); } };
      const lockTri = (x, y, len, lean, wd) => { h.beginPath(); h.moveTo(X(x - wd), Y(y)); h.quadraticCurveTo(X(x - wd * 0.4 + lean * 0.3), Y(y - len * 0.6), X(x + lean), Y(y - len)); h.quadraticCurveTo(X(x + wd * 0.4 + lean * 0.4), Y(y - len * 0.55), X(x + wd), Y(y)); h.closePath(); h.fill(); };
      // legs (goat: thigh, back-bent hock, thin shin, split hoof)
      for (const sd of [-1, 1]) { poly([[sd * 0.06, 1.0], [sd * 0.32, 0.98], [sd * 0.30, 0.66], [sd * 0.22, 0.42], [sd * 0.235, 0.09], [sd * 0.30, 0.0], [sd * 0.115, 0.0], [sd * 0.125, 0.09], [sd * 0.115, 0.40], [sd * 0.06, 0.66]]); }
      // the trunk: hips, belly, chest, hump and shoulders
      smooth([[0.0, 0.99], [-0.34, 1.0], [-0.42, 1.2], [-0.5, 1.45], [-0.62, 1.68], [-0.4, 1.84], [-0.12, 1.86], [0.12, 1.86], [0.4, 1.84], [0.62, 1.68], [0.5, 1.45], [0.42, 1.2], [0.34, 1.0]]);
      // arms: his left (screen right) hangs with the claws open, his right (screen left) is raised in a fist with the 7 sticks
      taper([[0.52, 1.72], [0.7, 1.45], [0.72, 1.16], [0.66, 0.97]], 0.105, 0.065); h.beginPath(); h.ellipse(X(0.66), Y(0.93), RX(0.075), RY(0.07), 0, 0, TAU); h.fill();
      for (const cx of [-0.045, 0, 0.045]) taper([[0.66 + cx, 0.93], [0.67 + cx * 1.6, 0.84], [0.66 + cx * 2, 0.78]], 0.014, 0.004);
      taper([[-0.52, 1.72], [-0.84, 1.52], [-0.8, 1.84]], 0.105, 0.075); h.beginPath(); h.ellipse(X(-0.8), Y(1.9), RX(0.085), RY(0.08), 0, 0, TAU); h.fill();
      for (let k = 0; k < 7; k++) { const d = k - 3; h.lineWidth = RX(0.011); h.beginPath(); h.moveTo(X(-0.8 + d * 0.012), Y(1.94)); h.quadraticCurveTo(X(-0.8 + d * 0.03), Y(2.2), X(-0.8 + d * 0.055), Y(2.42 + 0.03 * Math.abs(d))); h.stroke(); }
      for (const cx of [-0.05, 0, 0.05]) taper([[-0.8 + cx, 1.96], [-0.8 + cx * 1.3, 2.01]], 0.013, 0.004);
      // the basket on the other shoulder: a drum with a rim and a lid dome, a strap over the chest
      h.beginPath(); h.roundRect(X(0.2), Y(2.28), RX(0.6), RY(0.62), RX(0.05)); h.fill(); h.beginPath(); h.roundRect(X(0.17), Y(2.32), RX(0.66), RY(0.09), RX(0.04)); h.fill(); h.beginPath(); h.ellipse(X(0.5), Y(2.32), RX(0.3), RY(0.09), 0, Math.PI, TAU); h.fill();
      // the head: skull, 2 ears, the goatee and the long tongue
      h.beginPath(); h.ellipse(X(0), Y(1.9), RX(0.17), RY(0.2), 0, 0, TAU); h.fill(); poly([[-0.1, 1.74], [0.1, 1.74], [0.07, 1.6], [0, 1.57], [-0.07, 1.6]]);
      for (const sd of [-1, 1]) { poly([[sd * 0.15, 1.96], [sd * 0.40, 1.88], [sd * 0.38, 1.83], [sd * 0.17, 1.84]]); }
      for (const k of [-1, 0, 1]) taper([[k * 0.02, 1.62], [k * 0.035, 1.5], [k * 0.05, 1.4]], 0.02, 0.003);
      taper([[0.0, 1.64], [0.012, 1.5], [0.008, 1.36]], 0.04, 0.03); h.beginPath(); h.ellipse(X(0.008), Y(1.355), RX(0.03), RY(0.035), 0, 0, TAU); h.fill();
      // both ram curls (rocking 3 degrees with `sway`)
      for (const sd of [-1, 1]) { h.save(); h.translate(X(sd * 0.11), Y(2.0)); h.rotate(sd * hornRock); h.translate(-X(sd * 0.11), -Y(2.0)); taper(HORN_RAM.map(([x, y]) => [sd * x, y]), 0.062, 0.011); h.restore(); }
      // 34 shaggy locks along the hems: shoulder cape 10, hips 12, the raised arm 5, the hanging arm 4, the flanks 3
      let ln = 0; const lk = (x, y, len, lean, wd) => { lockTri(x, y, len * (0.85 + 0.3 * rnd(ln * 3 + 1)), lean, wd); ln++; };
      for (let i = 0; i < 10; i++) { const x = -0.5 + (1.0 * i) / 9; lk(x, 1.62 - 0.05 * Math.abs(x), 0.2, x * 0.1, 0.05); }
      for (let i = 0; i < 12; i++) { const x = -0.36 + (0.72 * i) / 11; lk(x, 1.0, 0.22, x * 0.12, 0.045); }
      for (let i = 0; i < 5; i++) lk(-0.84 + 0.02 * i, 1.55 - 0.1 * i, 0.18, -0.06, 0.04);
      for (let i = 0; i < 4; i++) lk(0.74 - 0.01 * i, 1.4 - 0.11 * i, 0.16, 0.05, 0.04);
      for (let i = 0; i < 3; i++) lk((i % 2 ? 1 : -1) * 0.44, 1.3 - 0.08 * i, 0.16, (i % 2 ? 1 : -1) * 0.05, 0.04);
      // the belt chain (22 links, a swag) with the drop chain and two bells: the bells hang across the fold, on the step and on the leaf
      const link = (x, y, a, big) => { h.save(); h.translate(X(x), Y(y)); h.rotate(a); h.lineWidth = RX(0.0075 * big); h.beginPath(); h.ellipse(0, 0, RX(0.019 * big), RY(0.011 * big), 0, 0, TAU); h.stroke(); h.restore(); };
      for (let i = 0; i < 12; i++) { const f = i / 11, x = 0.18 + 0.44 * f, y = 1.0 - 0.1 * Math.sin(Math.PI * f); link(x, y, 0, i % 2 ? 0.8 : 1); }
      for (let i = 0; i < 5; i++) link(0.40, 0.93 - 0.032 * i, Math.PI / 2, 1);
      for (let i = 0; i < 4; i++) link(0.58, 0.95 - 0.032 * i, Math.PI / 2, 1);
      for (const [bx, by, bs] of [[0.40, 0.76, 1.0], [0.58, 0.80, 0.9]]) { h.save(); h.translate(X(bx), Y(by + 0.03)); h.rotate(bellSw * bs); const bw = 0.085 * bs, bh = 0.17 * bs;
        h.beginPath(); h.ellipse(0, RY(-0.012), RX(0.018), RY(0.016), 0, 0, TAU); h.fill();   // the crown loop
        h.beginPath(); h.moveTo(RX(-0.03 * bs), 0); h.quadraticCurveTo(RX(-0.075 * bs), RY(bh * 0.45), RX(-bw), RY(bh)); h.lineTo(RX(bw), RY(bh)); h.quadraticCurveTo(RX(0.075 * bs), RY(bh * 0.45), RX(0.03 * bs), 0); h.closePath(); h.fill();
        h.beginPath(); h.ellipse(0, RY(bh + 0.034 * bs), RX(0.024 * bs), RY(0.024 * bs), 0, 0, TAU); h.fill(); h.restore(); }   // the clapper hangs below the lip with a gap
      g.filter = "blur(5px)"; g.drawImage(tmp, 0, 0); g.filter = "none"; tex.needsUpdate = true;
    };
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: C.moon, transparent: true, opacity: 0.86, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    mat.userData.noOutline = true;
    const plane = (w, h, v0, v1) => { const gm = new THREE.PlaneGeometry(w, h); const uv = gm.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + (v1 - v0) * (uv.getY(i))); return gm; };
    const apron = new THREE.Mesh(plane(TW, 1.5, 0, DOOR_T / TH), mat); apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.004, 0.75);
    const door = new THREE.Mesh(plane(TW, 1.8, DOOR_T / TH, 1), mat); door.position.set(0, 0.9, 0.004);
    for (const o of [apron, door]) { o.castShadow = o.receiveShadow = false; o.userData.noOutline = true; root.add(o); }
    return { grip: 0,
      apply(ps, t) {
        const g = (k, d = 0) => ps[k] ?? spec[k] ?? d, gr = clamp(g("grow")), sw = clamp(g("sway")), tt = t ?? 0;
        const hr = rad(3) * sw * Math.sin(TAU * 0.5 * tt), bs = rad(14) * sw * Math.sin(TAU * 2.9 * tt), key = `${Math.round(hr * 1e4)}|${Math.round(bs * 1e4)}`;
        if (key !== drawn) { drawn = key; draw(hr, bs); }
        tex.offset.set((1 - gr) * 0.5, (1 - gr) * 0.30); mat.opacity = 0.86 * clamp(gr * 6); apron.visible = door.visible = gr > 0.001;   // it slides in from screen left and up the door; at 1 the horn tips reach y 1.55 on the leaf
      } };
  },
};

// the far runner: a painted card from 6 drawn walk poses (lod "far")
function buildFar(P, S, o) {
  const root = new THREE.Group(); root.scale.setScalar(o.height / 2.04); P.whole.add(root);
  const CWD = 256, CHT = 384, M = 128;   // 6 cells of 2.0 x 3.0 m at 128 px a metre: the horns, the raised torch and the swinging arm all fit inside their cell
  const base = once(`kbFar2${o.fi}${o.hi}${o.mi}`, () => cvs(CWD * 6, CHT, (g) => { const F = FURS[o.fi], MK = MASKS[o.mi], OUT = "#0c0806", HP = o.hi === 0 ? HORN_RAM : o.hi === 1 ? HORN_GOAT : HORN_LYRE;
    g.lineCap = "round"; g.lineJoin = "round";
    for (let k = 0; k < 6; k++) { const cx = k * CWD + CWD / 2, gy = 372, ph = (k / 6) * TAU, bob = 0.012 * M * Math.abs(Math.sin(ph)), X = (x) => cx + x * M, Y = (y) => gy - y * M - bob;
      const path = (pts, close) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); if (close) g.closePath(); };
      const shape = (pts, fill, outW = 0.025) => { path(pts, true); g.lineWidth = outW * M; g.strokeStyle = OUT; g.stroke(); g.fillStyle = fill; g.fill(); };
      const limb = (pts, w0, w1, col) => { for (const [pass, add] of [[OUT, 0.03], [col, 0]]) { g.strokeStyle = pass; for (let i = 0; i < pts.length - 1; i++) { g.lineWidth = (w0 + (w1 - w0) * (i / (pts.length - 1)) + add) * M; g.beginPath(); g.moveTo(X(pts[i][0]), Y(pts[i][1])); g.lineTo(X(pts[i + 1][0]), Y(pts[i + 1][1])); g.stroke(); } } };
      // legs: thigh, back-bent hock, thin shin, split hoof; the two swing in opposite phase
      for (const s of [-1, 1]) { const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * 0.2, hx = s * 0.15; limb([[hx, 1.0], [hx + sw * 0.4, 0.58], [hx + sw * 0.25 - 0.02 * s, 0.36], [hx + sw, 0.1]], 0.19, 0.075, F.sh); shape([[hx + sw - 0.06, 0.11], [hx + sw + 0.06, 0.11], [hx + sw + 0.07, 0.0], [hx + sw - 0.07, 0.0]], C.hoof, 0.02); }
      // the basket on the back (behind the head), then the shaggy trunk with a ragged hem, then the arms
      shape([[0.1, 1.72], [0.1, 2.12], [0.14, 2.2], [0.66, 2.2], [0.7, 2.12], [0.7, 1.72]], C.wicker, 0.02); g.strokeStyle = C.wickerSh; g.lineWidth = 0.012 * M; for (let r = 0; r < 6; r++) { g.beginPath(); g.moveTo(X(0.1), Y(1.78 + 0.07 * r)); g.lineTo(X(0.7), Y(1.78 + 0.07 * r)); g.stroke(); } shape([[0.07, 2.2], [0.73, 2.2], [0.66, 2.3], [0.14, 2.3]], C.wickerLt, 0.02);
      const jag = (pts, amp) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.07)), nx = b[1] - a[1], ny = -(b[0] - a[0]), nl = Math.hypot(nx, ny) || 1; for (let j = 0; j < n; j++) { const f = j / n, o = j % 2 ? amp : -amp * 0.3; out.push([a[0] + (b[0] - a[0]) * f + (nx / nl) * o, a[1] + (b[1] - a[1]) * f + (ny / nl) * o]); } } return out; };   // a ragged fur edge
      shape(jag([[-0.3, 1.0], [-0.42, 1.2], [-0.52, 1.5], [-0.62, 1.7], [-0.4, 1.84], [0, 1.88], [0.4, 1.84], [0.62, 1.7], [0.52, 1.5], [0.42, 1.2], [0.3, 1.0]], 0.05), F.base, 0.03);
      { const gb = g.createLinearGradient(0, Y(1.9), 0, Y(1.0)); gb.addColorStop(0, "rgba(0,0,0,0)"); gb.addColorStop(1, `rgba(${rgbOf(F.sh).join(",")},0.6)`); g.fillStyle = gb; path([[-0.3, 1.0], [-0.42, 1.2], [-0.52, 1.5], [-0.62, 1.7], [-0.4, 1.84], [0, 1.88], [0.4, 1.84], [0.62, 1.7], [0.52, 1.5], [0.42, 1.2], [0.3, 1.0]], true); g.fill(); }
      g.fillStyle = F.sh; g.strokeStyle = OUT; g.lineWidth = 0.012 * M; for (let i = 0; i < 15; i++) { const px = -0.36 + (0.72 * i) / 14, py = 1.04 - 0.03 * Math.sin(i * 1.7), L = 0.17 + 0.07 * ((i * 5) % 3); g.beginPath(); g.moveTo(X(px - 0.045), Y(py)); g.quadraticCurveTo(X(px - 0.02), Y(py - L * 0.6), X(px + 0.01 * (px > 0 ? 1 : -1)), Y(py - L)); g.quadraticCurveTo(X(px + 0.03), Y(py - L * 0.5), X(px + 0.045), Y(py)); g.closePath(); g.fill(); g.stroke(); }
      g.strokeStyle = F.strand; g.lineWidth = 0.012 * M; g.globalAlpha = 0.8; for (let i = 0; i < 14; i++) { const px = -0.4 + 0.8 * rnd(i * 5 + k), py = 1.15 + 0.6 * rnd(i * 5 + 1 + k); g.beginPath(); g.moveTo(X(px), Y(py)); g.lineTo(X(px - 0.02), Y(py - 0.17)); g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = F.base; for (let i = 0; i < 9; i++) { const px = -0.5 + (1.0 * i) / 8, py = 1.78 - 0.1 * Math.abs(px); g.beginPath(); g.moveTo(X(px - 0.05), Y(py)); g.lineTo(X(px + 0.01), Y(py - 0.2 - 0.04 * (i % 3))); g.lineTo(X(px + 0.05), Y(py)); g.closePath(); g.fill(); }   // the cape fringe
      g.fillStyle = C.leather; g.fillRect(X(-0.36), Y(1.14), 0.72 * M, 0.06 * M);
      const arm = Math.sin(ph) * 0.12; limb([[-0.5, 1.7], [-0.62 + arm, 1.35], [-0.58 + arm * 1.6, 0.98]], 0.15, 0.09, F.base); shape([[-0.64 + arm * 1.6, 0.98], [-0.52 + arm * 1.6, 0.98], [-0.54 + arm * 1.6, 0.86], [-0.62 + arm * 1.6, 0.86]], C.skin, 0.015);   // the swinging arm and hand
      limb([[0.5, 1.7], [0.68, 1.95], [0.7, 2.12]], 0.15, 0.09, F.base); g.strokeStyle = C.twig; g.lineWidth = 0.03 * M; g.beginPath(); g.moveTo(X(0.7), Y(1.95)); g.lineTo(X(0.7), Y(2.5)); g.stroke();   // the torch arm, raised, and the torch stick
      const fl = g.createRadialGradient(X(0.7), Y(2.58), 1, X(0.7), Y(2.58), 0.34 * M); fl.addColorStop(0, "#fff0c0"); fl.addColorStop(0.35, "#ffb45a"); fl.addColorStop(1, "rgba(255,154,58,0)"); g.fillStyle = fl; g.beginPath(); g.arc(X(0.7), Y(2.58), 0.34 * M, 0, TAU); g.fill();
      g.fillStyle = "#ffcf6a"; g.beginPath(); g.moveTo(X(0.66), Y(2.5)); g.quadraticCurveTo(X(0.64), Y(2.62), X(0.7), Y(2.74)); g.quadraticCurveTo(X(0.76), Y(2.62), X(0.74), Y(2.5)); g.closePath(); g.fill();
      // the head: mask, brow, eyes, tongue, then the two horns on top
      for (const s of [-1, 1]) shape([[s * 0.15, 1.97], [s * 0.34, 1.9], [s * 0.17, 1.84]], F.sh, 0.015);
      g.beginPath(); g.ellipse(X(0), Y(1.9), 0.165 * M, 0.2 * M, 0, 0, TAU); g.lineWidth = 0.03 * M; g.strokeStyle = OUT; g.stroke(); g.fillStyle = MK.base; g.fill();
      g.fillStyle = MK.worn; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(X(0), Y(1.86), 0.04 * M, 0.1 * M, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = MK.sh; g.lineWidth = 0.03 * M; g.beginPath(); g.moveTo(X(-0.14), Y(1.99)); g.lineTo(X(0), Y(1.94)); g.lineTo(X(0.14), Y(1.99)); g.stroke();
      g.fillStyle = C.amberC; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X(s * 0.075), Y(1.9), 0.03 * M, 0.017 * M, 0, 0, TAU); g.fill(); }
      g.fillStyle = C.tooth; g.fillRect(X(-0.045), Y(1.7), 0.02 * M, 0.04 * M); g.fillRect(X(0.025), Y(1.7), 0.02 * M, 0.04 * M);
      g.strokeStyle = OUT; g.lineWidth = 0.075 * M; g.beginPath(); g.moveTo(X(0), Y(1.69)); g.lineTo(X(0.004), Y(1.46)); g.stroke(); g.strokeStyle = C.tongue; g.lineWidth = 0.05 * M; g.beginPath(); g.moveTo(X(0), Y(1.69)); g.lineTo(X(0.004), Y(1.47)); g.stroke();
      for (const s of [-1, 1]) { for (const [col, wd] of [[OUT, 0.075], [C.horn, 0.05]]) { g.strokeStyle = col; g.lineWidth = wd * M; g.beginPath(); HP.forEach(([x, y], i) => (i ? g.lineTo(X(s * x), Y(y)) : g.moveTo(X(s * x), Y(y)))); g.stroke(); } g.strokeStyle = C.hornSh; g.lineWidth = 0.012 * M; g.beginPath(); HP.forEach(([x, y], i) => (i ? g.lineTo(X(s * x + s * 0.012), Y(y + 0.012)) : g.moveTo(X(s * x + s * 0.012), Y(y + 0.012)))); g.stroke(); }
      g.fillStyle = C.brass; g.strokeStyle = OUT; g.lineWidth = 0.01 * M; for (const bx of [-0.12, 0.02, 0.16]) { g.beginPath(); g.arc(X(bx), Y(1.0 - 0.05 + 0.03 * Math.sin(ph * 2 + bx * 9)), 0.045 * M, 0, TAU); g.fill(); g.stroke(); } } }));
  const tex = base.clone(); tex.needsUpdate = true; tex.repeat.set(1 / 6, 1);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 }), card = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), mat); card.position.y = 1.5 - 0.09; root.add(card); card.castShadow = false;
  return { grip: 0, apply(ps, t) { const gt = (ps.gait ?? P.spec.gait ?? 0) + (P.spec.gaitPhase ?? 0), k = Math.floor(frac(gt) * 6 + 1e-6) % 6; tex.offset.set(k / 6, 0); } };
}


// the counts of DESIGN section 9 row B, from the data (the bench prints them; importable in Node)
export function krampusCounts() {
  const by = (f) => LOCKS.filter(f).length, bp = basketParts().counts;
  return {
    locks: { total: LOCKS.length, crown: by((l) => l.cls === "crown"), ruff: by((l) => l.cls === "ruff"), cape: by((l) => l.cls === "cape"), chest: by((l) => l.cls === "chest"), arms: [0, 1].map((k) => by((l) => l.frame === `arm${k}`)), hip: by((l) => l.cls === "hip"), legs: [0, 1].map((k) => by((l) => l.frame === `leg${k}`)),
      light: by((l) => l.tint === "light"), grey: by((l) => l.tint === "grey"), frost: by((l) => l.frost), beads: by((l) => l.bead), clumps: new Set(LOCKS.map((l) => l.clump)).size },
    furStrokes: Object.values(FUR_STROKES).reduce((a, b) => a + b, 0), face: { gouges: GOUGES.length, grain: GRAIN.length, checks: CHECKS.length, worms: WORMS.map((w) => w.n) },
    teeth: { upper: 2 + 4, lower: 2 + 2, total: 10 }, horns: { ringsEach: 32, ramLength: hornLen(), span: 0.86 },
    bells: 5, links: { belt: 22, drops: 9, wrist: 14, total: 22 + 9 + 14 }, birch: { sticks: 7, spareBunches: 3, twineTurns: 3, bark: 3 },
    basket: { stakes: bp.stakes, rows: bp.rows, rimRods: bp.rimRods, ends: bp.ends, belts: bp.belts, patch: `${bp.patchRows} rows x ${bp.patchStakes} stakes`, lidTurns: LID.turns, hingeLoops: 3 },
    kid: { boots: 1, socks: 1, sockStripes: 5, scarfRows: 22, tassels: 14 },
  };
}
function hornLen() { const c = new THREE.CatmullRomCurve3(HORN_RAM.map((p) => V3(p))); return Math.round(c.getLength() * 1000) / 1000; }

