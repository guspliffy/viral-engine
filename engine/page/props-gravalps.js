import * as THREE from "three";
import { GRAVSKY_KINDS } from "./props-gravsky.js";

// props-gravalps.js: fact what-if 02 gravity v2 (20 Nov 2026): the Alps crushing under their own weight, seen from OUTSIDE (no TV).
// Design: storyboards/series/facts/02-gravity/DESIGN-v2.md "Rendering and continuity", section C, cameras in E; panels P5 and P6.
// Bench: storyboards/series/facts/02-gravity/bench/make-alps-bench.mjs (sheet bench/alps-sheet.jpg).
//
// ONE KIND, self-contained, look-only (not solid, no shadows, no ink pass, no room light needed). Needs the storyboard key "far": 6000.
//   galps   x 0, y 0, z 0, rot 0 (do NOT set scale / x / y / z: the kind cancels the stage's own prop transform).
//           spec.origin [40000, 0, 0]  world = origin + scale * local (the valley is 40 km from the room, so nothing else shows)
//           spec.scale  0.6            metres of world per local metre (keeps the whole valley within ~4000 m of both cameras)
//           spec.t      -1             the ONE tweened param `t` = clip seconds. Tween c.prop(0,id,{t:0},0,"linear"); c.prop(0,id,{t:64},64,"linear").
//                                      Pure function of t (seed 26031). t < 43 = intact valley, nothing moving.
//           spec.puff 2.6              multiplies the avalanche / dust billow radii (the design's 16 / 58 / 115 m read as specks at 3 km)
//           spec.rockBoost 2.0         multiplies the sizes of the small slide rocks and the R2 blocks (design 14-80 m)
//           spec.slipBoost 1.5         multiplies the cliff slip distances (design 55-110 / 180-360 m)
//           spec.treeScale 2.2         multiplies the spruce card heights (design 6-19 m); 2400 cards in clumps on slopes and benches
//           spec.light [-.58,.40,.71]  direction TOWARD the sun. The design has z -.71 (backlit, every camera-facing face in shade); the panels are
//                                      front-lit, so z is +.71 by default. Pass [-.58,.40,-.71] for the design's.
//   What `t` drives (DESIGN section C, absolute seconds; the table TAB below keeps every number in one place):
//     crush = P(43,48): ordinary summits drop .40 of their final loss at .5, all of it at 1 (7 peaks, final loss 27-38 %),
//       each peak = a fixed base + 4 rock slabs (dense polar meshes: 48 sectors x 22 rings, R2 72 x 30, ridged multi-octave relief; L1 and R1 fail early with a burst from 43.0); the trough-facing slab of every peak is a cliff (8 cliffs: L1 L2 L2b L3 L4 R1 R3 R4):
//       cliff i starts 43.08 + .195 i, ends 46.15 + .258 i; slip 0 / 55-110 / 180-360 m toward the trough (and down the valley), tilt 0 / 6-12 / 12-24 deg.
//     split = P(45.35, 47.75): R2 (the split pyramid, summit local (610,4140,-2760)) = base + two summit wedges that part along the seam
//       (-84/+108 m in X, descend 410/350, advance +120/+140, roll 9/12 deg at .5; -240/+320, 1100/990, +430/+520, 24/31 deg at 1).
//     slideAge: 24 avalanche paths (3 per peak, 3 for R2 from the seam at 45.55 45.75 46.0), starts 43.10-45.44 (16, even) and 45.51 .60 .68 .82 .92,
//       length 700-1870 m (longest first, ends by 48 s), duration max(2, 1.25 L / 610), arc position by two cubic Hermite segments
//       (derivatives .75 / 1.25 / .75); billow radius 16 / 58 / 115 m, opacity .26 / .86 / .58; a dark scar ribbon follows the head and a
//       snow fan grows at the end of the path; 3 slide rocks per path fly (grounded at age 1).
//     rockAge = P(T, T+2.05) for the 48 R2 blocks (T 45.50-45.88): diameters 14-80 m, runout 430-1230 m, arc 4 h age (1-age), h 28-120 m,
//       rotation 0 / 85-145 / 170-290 deg.
//   Draw: own sky dome (the gsky dome, r 4000 world, centred between the two cameras), 34 cloud streaks, 40 dust-bank + 240 avalanche + 32 cliff + 24 R2 + 144 block-trail billows (~510 sprites, soft feathered, rolling), solid terrain (24 cross sections x 9
//   vertices, refined 3 x 4), peaks, slabs, wedges, rocks and spruce in two merged meshes (flat facets, 3 diffuse bands .50/.76/1.00 at N.L .18/.58,
//   light (-.58,.40,-.71), baked mist #9F8994 .55 at 5200 m, ink #39313B on the rock facets), draped scar/fan ribbons, and ONE sorted billow mesh.
//   Cameras (world, with the defaults; local: P5 pos (0,2180,1550) look (0,2230,-3010) vfov 84, P6 pos (280,2610,-580) look (610,3070,-2760) vfov 57):
//     P5  pos (40000, 1308, 930)      look (40000, 1338, -1806)       fov 84   t 43.0-45.5
//     P6  pos (40168, 1566, -348)     look (40366, 1842, -1656)       fov 57   t 45.5-48.0
//   Registry (already in props3d.js): GRAVALPS_KINDS.

const SEED = 26031, TAU = Math.PI * 2, DEG = Math.PI / 180;
// ------------------------------------------------------------------------------------------------ the design's numbers
const TAB = {
  crush: [43, 48], split: [45.35, 47.75], cliffStart: [43.08, 44.25], cliffEnd: [46.15, 47.7],
  slide16: [43.10, 45.44], slideExtra: [45.51, 45.60, 45.68, 45.82, 45.92], slideR2: [45.55, 45.75, 46.0], slideEnd: 48, slideLen: [700, 1870], slideSpeed: 610,
  slideBillow: [[16, 0.26], [58, 0.86], [115, 0.58]], rockT: [45.50, 45.88], rockDur: 2.05, rockD: [14, 80], rockRun: [430, 1230], rockH: [28, 120],
  cliffSlip50: [55, 110], cliffSlip100: [180, 360], tilt50: [6, 12], tilt100: [12, 24], crushHalf: 0.4,
  wedge: { L: { x: [-84, -240], down: [410, 1100], adv: [120, 430], roll: [9, 24] }, R: { x: [108, 320], down: [350, 990], adv: [140, 520], roll: [12, 31] } },
  snowCut: 57, mist: ["#9F8994", 0.55, 5200], light: [-0.58, 0.40, 0.71], bands: [0.18, 0.58], gains: [0.50, 0.76, 1.0],
};
const PEAKS = [   // table order; R2 (index 5) is the split pyramid
  { id: "L1", s: [-1440, 3060, -1610], r: [760, 670], loss: 0.29 }, { id: "L2", s: [-2150, 3510, -2720], r: [880, 820], loss: 0.34 },
  { id: "L3", s: [-1550, 3830, -3850], r: [970, 730], loss: 0.38 }, { id: "L4", s: [-790, 3210, -4160], r: [710, 590], loss: 0.27 },
  { id: "R1", s: [1310, 3190, -1710], r: [830, 680], loss: 0.28 }, { id: "R2", s: [610, 4140, -2760], r: [990, 860], loss: 0.46 },
  { id: "R3", s: [2190, 3600, -3300], r: [910, 730], loss: 0.35 }, { id: "R4", s: [1470, 3380, -4130], r: [740, 640], loss: 0.32 },
];
const SEAM_END = [530, 3010, -2420];

// ------------------------------------------------------------------------------------------------ small helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const P01 = (t, a, b) => clamp((t - a) / (b - a));
const pw3 = (k, a, b, c) => (k < 0.5 ? lerp(a, b, k * 2) : lerp(b, c, (k - 0.5) * 2));
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(a, b = 0, c = 0) { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1) ^ SEED; h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, z, s) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = hash(ix, iz, s), b = hash(ix + 1, iz, s), c = hash(ix, iz + 1, s), d = hash(ix + 1, iz + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, z, s, o = 4) { let a = 0.5, f = 1, r = 0, n = 0; for (let i = 0; i < o; i++) { r += a * vnoise(x * f, z * f, s + i); n += a; f *= 2.03; a *= 0.5; } return r / n; }
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }

// ------------------------------------------------------------------------------------------------ terrain (local metres)
const NSEC = 24, Z0 = 1800, ZS = 6500 / 23;
const floorX = (z) => 60 - 140 * ((900 - z) / 5450), floorY = (z) => 1120 + 340 * ((900 - z) / 5450);
const snowLine = (x, z) => 2180 + 120 * Math.sin(x / 600) + 90 * Math.cos(z / 520);
const SEC = Array.from({ length: NSEC }, (_, k) => {
  const z = Z0 - k * ZS, w = 850 + 200 * Math.sin(z / 830 + 0.6), fy = floorY(z);
  const bL = clamp(1800 + 150 * Math.sin(z / 640 + 1.0), 1650, 1950), bR = clamp(1800 + 150 * Math.sin(z / 710 + 2.4), 1650, 1950);
  const close = 1700 * sstep(-3900, -4700, z), rimL = 2700 + 220 * Math.sin(z / 520 + 0.3), rimR = 2700 + 220 * Math.sin(z / 560 + 1.9);
  const dx = [-3300, -(1750 + 60 * Math.sin(z / 500)), -(w / 2 + 430), -w / 2, 0, w / 2, w / 2 + 430, 1750 + 60 * Math.sin(z / 540 + 1), 3300];
  const y = [rimL, bL + 90, bL - 40, fy + 25, fy, fy + 25, bR - 40, bR + 90, rimR].map((v, i) => v + close * (1 - 0.5 * Math.abs(dx[i]) / 3300));
  return { z, fx: floorX(z), dx, y };
});
function lat(sec, x) {
  const rel = x - sec.fx, dx = sec.dx, y = sec.y;
  if (rel <= dx[0]) return y[0] + 0.5 * (dx[0] - rel);
  if (rel >= dx[8]) return y[8] + 0.5 * (rel - dx[8]);
  let i = 0; while (i < 7 && rel > dx[i + 1]) i++;
  return lerp(y[i], y[i + 1], (rel - dx[i]) / (dx[i + 1] - dx[i]));
}
function tY(x, z) {
  const zk = clamp((Z0 - z) / ZS, 0, NSEC - 1.001), k = Math.floor(zk), f = zk - k;
  const base = lerp(lat(SEC[k], x), lat(SEC[k + 1], x), f), rel = Math.abs(x - floorX(z));
  const amp = 16 + 78 * sstep(350, 1000, rel) * (1 - 0.3 * sstep(1700, 2500, rel));
  const n1 = (fbm(x / 210, z / 210, 7) - 0.5) * 2, rg = 1 - Math.abs(fbm(x / 430 + 9, z / 430 - 3, 15, 3) * 2 - 1);
  const n2 = (fbm(x / 64, z / 64, 61, 2) - 0.5) * 2;
  return base + amp * (0.75 * n1 + 0.6 * (rg - 0.5) + 0.3 * n2);
}

// ------------------------------------------------------------------------------------------------ palettes (linear)
const C = {
  snow: lin("#F3E8DA"), snowSh: lin("#E9DDD3"), rockDark: lin("#463C4A"), rockMid: lin("#7A625E"), rockLit: lin("#A98470"), fresh: lin("#8B7164"), cleave: lin("#403C48"),
  fir1: lin("#2C4A44"), fir2: lin("#4A6254"), mist: lin(TAB.mist[0]), ink: lin("#39313B"), ground: lin("#4A5550"), debris: lin("#B39A91"),
};
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ------------------------------------------------------------------------------------------------ the triangle soup (smooth or flat normals, per-vertex colour + ao, stable texture coords)
// ao: 0..1 = a rock / snow surface (gullies are low), -1 = a flat painted face (cut faces, spruce), -2 = a block (snow on its tops only)
const pick = (x, i) => (Array.isArray(x) && Array.isArray(x[0]) ? x[i] : x);
class Soup {
  constructor() { this.p = []; this.n = []; this.c = []; this.a = []; this.parts = []; }
  tri(a, b, c, col, ao = 1, nrm = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx; const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l;
    const per = nrm && Array.isArray(nrm[0]);
    [a, b, c].forEach((v, i) => {
      let n = per ? nrm[i] : nrm || [gx, gy, gz]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / nl, n[1] / nl, n[2] / nl];
      if (n[0] * gx + n[1] * gy + n[2] * gz < 0) n = [-n[0], -n[1], -n[2]];
      this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]);
      const cc = pick(col, i); this.c.push(cc[0], cc[1], cc[2]); this.a.push(Array.isArray(ao) ? ao[i] : ao);
    });
  }
  quad(a, b, c, d, col, ao = 1, nn = null) {
    const cv = Array.isArray(col[0]), av = Array.isArray(ao);
    this.tri(a, b, c, cv ? [col[0], col[1], col[2]] : col, av ? [ao[0], ao[1], ao[2]] : ao, nn && [nn[0], nn[1], nn[2]]);
    this.tri(a, c, d, cv ? [col[0], col[2], col[3]] : col, av ? [ao[0], ao[2], ao[3]] : ao, nn && [nn[0], nn[2], nn[3]]);
  }
  begin() { return { v0: this.p.length / 3 }; }
  end(pt) { pt.soup = this; pt.v1 = this.p.length / 3; pt.M = new THREE.Matrix4(); pt.nm = new THREE.Matrix3(); this.parts.push(pt); return pt; }
  geometry(dynamic) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(this.p), nor = new Float32Array(this.n);
    const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3);
    if (dynamic) { pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage); this.base = { p: new Float32Array(pos), n: new Float32Array(nor) }; this.live = { p: pos, n: nor }; this.pa = pa; this.na = na; }
    g.setAttribute("position", pa); g.setAttribute("normal", na); g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute("aAo", new THREE.BufferAttribute(new Float32Array(this.a), 1)); g.setAttribute("aTc", new THREE.BufferAttribute(new Float32Array(this.p), 3));
    return g;
  }
  place(pt) {   // pt.M = its matrix this frame
    const m = pt.M.elements, bp = this.base.p, bn = this.base.n, lp = this.live.p, ln = this.live.n; pt.nm.getNormalMatrix(pt.M); const q = pt.nm.elements;
    for (let i = pt.v0; i < pt.v1; i++) {
      const o = i * 3, x = bp[o], y = bp[o + 1], z = bp[o + 2], nx = bn[o], ny = bn[o + 1], nz = bn[o + 2];
      lp[o] = m[0] * x + m[4] * y + m[8] * z + m[12]; lp[o + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; lp[o + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      const ax = q[0] * nx + q[3] * ny + q[6] * nz, ay = q[1] * nx + q[4] * ny + q[7] * nz, az = q[2] * nx + q[5] * ny + q[8] * nz, l = Math.hypot(ax, ay, az) || 1;
      ln[o] = ax / l; ln[o + 1] = ay / l; ln[o + 2] = az / l;
    }
  }
}

// ------------------------------------------------------------------------------------------------ materials
const SOLID_VS = `attribute vec3 aCol; attribute vec3 aTc; attribute float aAo; varying vec3 vN; varying vec3 vC; varying vec3 vTc; varying vec3 vW; varying float vAo;
  void main(){ vC = aCol; vTc = aTc; vAo = aAo; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SOLID_FS = `uniform vec3 uL; uniform vec3 uMist; uniform vec3 uMistB; uniform vec3 uInkC; uniform vec3 uSnowLit; uniform vec3 uSnowMid; uniform vec3 uSnowSh; uniform vec3 uCleave;
  uniform float uS; uniform float uOy; uniform float uDrop; uniform float uInkOn; uniform float uStreak; uniform float uFloor;
  varying vec3 vN; varying vec3 vC; varying vec3 vTc; varying vec3 vW; varying float vAo;
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    vec3 tc = vTc; float raw = step(vAo, -0.5), blk = step(vAo, -1.5), ao = clamp(vAo, 0.0, 1.0);
    float nb = n2(tc.xz * 0.07 + tc.y * 0.05), nf = n2(vec2(tc.x + tc.z, tc.y) * 0.21), ns = n2(tc.xz * 0.013 + 3.0);
    vec3 alb = vC;
    float strata = sin(tc.y * 0.034 + ns * 7.0 + nb * 1.5); alb *= 1.0 + 0.11 * strata;
    float streak = n2(vec2((tc.x * 0.8 + tc.z * 0.6) * 0.05, tc.y * 0.0042 + ns * 0.5));
    alb = mix(alb, uCleave, smoothstep(0.58, 0.78, streak) * uStreak * (1.0 - 0.5 * blk));
    alb *= mix(0.32, 1.0, ao) * (1.0 - raw) + raw;
    float ny = n.y + (nb - 0.5) * 0.45;
    float snowY = 2180.0 + 120.0 * sin(tc.x / 600.0) + 90.0 * cos(tc.z / 520.0) - uDrop;
    float alt = smoothstep(snowY - 200.0, snowY + 260.0, tc.y + (nb - 0.5) * 300.0);
    float sc = (0.95 * smoothstep(0.40, 0.68, ny) + 0.6 * (1.0 - ao) * smoothstep(0.2, 0.45, ny)) * alt;
    float snow = smoothstep(0.40, 0.50, sc + (nf - 0.5) * 0.4) * (1.0 - raw);
    snow = mix(snow, smoothstep(0.52, 0.66, n.y + (nf - 0.5) * 0.35), blk) * (1.0 - raw * (1.0 - blk));
    float flr = uFloor * smoothstep(0.78, 0.92, n.y) * (1.0 - smoothstep(1500.0, 1900.0, tc.y));
    float band = smoothstep(0.50, 0.64, n2(vec2(tc.z * 0.0045 + 0.5 * sin(tc.x * 0.006), tc.x * 0.0022)));
    float drift = smoothstep(0.52, 0.74, n2(vec2(tc.x * 0.022, tc.z * 0.006) + ns * 3.0));
    float nl = dot(n, uL) + (nb - 0.5) * 0.3 + (ns - 0.5) * 0.3 + flr * 0.1 * sin(tc.x * 0.05 + ns * 9.0);
    float b1 = smoothstep(0.14, 0.22, nl), b2 = smoothstep(0.54, 0.62, nl);
    float g = mix(mix(0.50, 0.76, b1), 1.0, b2);
    vec3 tint = mix(vec3(0.80, 0.90, 1.28), mix(vec3(1.0), vec3(1.10, 0.98, 0.84), b2), b1);
    vec3 rock = alb * g * tint, sn = mix(mix(uSnowSh, uSnowMid, b1), uSnowLit, b2);
    sn = mix(sn, uSnowSh, clamp(drift * 0.55 + band * 0.6, 0.0, 0.85) * flr);
    vec3 col = mix(rock, sn, snow);
    vec3 vd = cameraPosition - vW; float d = length(vd) / uS, ly = (vW.y - uOy) / uS;
    float rim = 1.0 - abs(dot(n, normalize(vd)));
    col = mix(col, uInkC, smoothstep(0.80, 0.95, rim) * 0.75 * uInkOn * (1.0 - smoothstep(1500.0, 5500.0, d)));
    float m = 0.82 * (1.0 - exp(-pow(d / 2900.0, 1.25)));
    m = max(m, 0.2 * (1.0 - smoothstep(1100.0, 1700.0, ly)) * clamp(d / 1800.0, 0.0, 1.0));
    col = mix(col, mix(uMist, uMistB, smoothstep(1400.0, 4600.0, d)), m);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
function solidMat(info, spec, drop, ink) {
  const L = new THREE.Vector3(...(spec.light ?? TAB.light)).normalize();
  const U = (h) => new THREE.Vector3(...lin(h));
  return noLine(new THREE.ShaderMaterial({
    uniforms: { uL: { value: L }, uMist: { value: U(TAB.mist[0]) }, uMistB: { value: U("#8A93B6") }, uInkC: { value: U("#39313B") }, uSnowLit: { value: U("#F8DFCB") }, uSnowMid: { value: U("#DCCBC9") }, uSnowSh: { value: U("#9CA9BD") }, uCleave: { value: U("#403C48") }, uS: { value: info.s }, uOy: { value: info.o[1] }, uDrop: { value: drop }, uInkOn: { value: ink }, uStreak: { value: ink ? 0.65 : 0.0 }, uFloor: { value: ink ? 0.0 : 1.0 } },
    vertexShader: SOLID_VS, fragmentShader: SOLID_FS, side: THREE.DoubleSide, fog: false,
  }));
}
const FLAT_VS = "attribute vec4 aCol4; varying vec4 vC; varying vec3 vW; void main(){ vC = aCol4; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }";
const FLAT_FS = `uniform vec3 uMist; uniform float uS; varying vec4 vC; varying vec3 vW;
  void main(){ float d = distance(vW, cameraPosition) / uS; vec3 c = mix(vC.rgb, uMist, 0.82 * (1.0 - exp(-pow(d / 2900.0, 1.25)))); gl_FragColor = vec4(c, vC.a);
    #include <colorspace_fragment>
  }`;
const BIL_VS = `attribute vec2 aCorner; attribute vec4 aSz; attribute vec3 aPal; attribute float aRot; uniform float uS; varying vec2 vUv; varying float vA; varying vec3 vPal;
  void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position, 1.0); float hs = min(aSz.x * uS, 0.10 * max(-vp.z, 1.0)); float cr = cos(aRot), sr = sin(aRot);
    vec2 cc = vec2(aCorner.x * aSz.y, aCorner.y); vp.xy += hs / aSz.y * vec2(cr * cc.x - sr * cc.y, sr * cc.x + cr * cc.y) ; vA = aSz.z; vPal = aPal;
    vec2 tile = vec2(mod(aSz.w, 2.0), floor(aSz.w / 2.0)); vUv = (tile + aCorner * 0.5 + 0.5) * 0.5; gl_Position = projectionMatrix * vp; }`;
const BIL_FS = `uniform sampler2D uMap; uniform vec3 uPal[9]; varying vec2 vUv; varying float vA; varying vec3 vPal;
  vec3 ramp(vec3 s, vec3 b, vec3 r, float t){ return t < 0.5 ? mix(s, b, t * 2.0) : mix(b, r, (t - 0.5) * 2.0); }
  void main(){ vec4 tx = texture2D(uMap, vUv); float a = tx.a * vA; if (a < 0.003) discard; float t = tx.r;
    vec3 c = vPal.x * ramp(uPal[0], uPal[1], uPal[2], t) + vPal.y * ramp(uPal[3], uPal[4], uPal[5], t) + vPal.z * ramp(uPal[6], uPal[7], uPal[8], t);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb *= a; gl_FragColor.a = a; }`;
// the sprite atlas (2 x 2 tiles of 128): soft powder-snow puffs (0-1: rolling clumps with feathered edges, light on top, cool underside) and
// flat streaks (2-3: sky clouds); r = tone (0 shade .. 1 sunlit), a = feathered coverage
function billowTex() {
  return once("billow", () => {
    const N = 128, W = N * 2, data = new Uint8Array(W * W * 4);
    for (let v = 0; v < 4; v++) {
      const streak = v >= 2, tx = (v % 2) * N, ty = Math.floor(v / 2) * N, R = rngOf(SEED + 900 + v);
      const lobes = [[0, 0, 0.55]]; for (let i = 0; i < 5; i++) { const a = R() * TAU, dd = 0.2 + 0.3 * R(); lobes.push([Math.cos(a) * dd * (streak ? 1.6 : 1), Math.sin(a) * dd * 0.7, 0.28 + 0.2 * R()]); }
      for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
        const u = ((px + 0.5) / N) * 2 - 1, w = ((py + 0.5) / N) * 2 - 1, o = ((ty + py) * W + tx + px) * 4;
        let d = 0; for (const [cx, cy, r] of lobes) { const q = ((u - cx) / (streak ? r * 1.5 : r)) ** 2 + ((w - cy) / (streak ? r * 0.55 : r)) ** 2; d = Math.max(d, 1 - q); }
        const nz = fbmN(u * 2.6 + v * 5, w * 2.6, 3) - 0.5, dens = d + 0.7 * nz * (1 - 0.4 * d), a = sstep(0.0, 0.55, dens) * (1 - sstep(0.78, 1, Math.hypot(u, w)));
        const tone = clamp(0.5 + 0.5 * w * (streak ? 0.6 : 1) + 0.8 * nz + 0.25 * (dens - 0.4) - 0.12 * u);
        data[o] = data[o + 1] = data[o + 2] = Math.round(tone * 255); data[o + 3] = Math.round(a * 255);
      }
    }
    const t = new THREE.DataTexture(data, W, W, THREE.RGBAFormat); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
  });
}
const fbmN = (x, z, s) => fbm(x, z, s, 3);
const ridge = (n) => Math.pow(1 - Math.abs(2 * n - 1), 1.6);

// ------------------------------------------------------------------------------------------------ peaks
function gYof(peaks) {   // ground height incl. the (unbroken) mountains, for paths, fans and landing rocks
  return (x, z) => {
    let y = tY(x, z);
    for (const p of peaks) { const q = Math.hypot((x - p.cx) / p.rx, (z - p.cz) / p.rz); if (q < 1) y = Math.max(y, p.sy - (p.sy - p.A) * Math.pow(q, 1 / p.pw) + 10); }
    return y;
  };
}
// the unbroken surface of a peak at elliptical radius rho (0 summit, 1 base): a cone with ridged multi-octave relief (arêtes, gullies, buttresses)
function peakSurface(pk, x, z, rho) {
  const H = pk.sy - pk.A, e = sstep(0.02, 0.2, rho) * (1 - sstep(0.9, 1.0, rho)), s = pk.pi * 7;
  const r1 = ridge(fbm(x / 620, z / 620, 71 + s, 3)), r2 = ridge(fbm(x / 250, z / 250, 81 + s, 3)), r3 = ridge(fbm(x / 100, z / 100, 91 + s, 2));
  const d = H * (0.26 * (r1 - 0.5) + 0.13 * (r2 - 0.5) + 0.05 * (r3 - 0.5)) * e;
  return { y: pk.sy - H * Math.pow(rho, 1 / pk.pw) + d, ao: clamp(0.2 + 0.95 * (0.35 * r1 + 0.65 * r2) + 0.2 * (r3 - 0.5), 0.25, 1), r1 };
}

// ------------------------------------------------------------------------------------------------ the kind
function galps(P) {
  const S = P.spec, O = S.origin ?? [40000, 0, 0], SC = S.scale ?? 0.6, PUFF = S.puff ?? 2.6, RB = S.rockBoost ?? 2.0, SB = S.slipBoost ?? 1.5, TS = S.treeScale ?? 2.2;
  const info = { s: SC, o: O };
  const G = new THREE.Group(); P.whole.add(G);
  // ---- own sky (the gsky dome, centred between the two cameras) and the cloud atlas
  const CAMW = [[0, 2180, 1550], [280, 2610, -580]].map((c) => [O[0] + SC * c[0], O[1] + SC * c[1], O[2] + SC * c[2]]);
  const domeC = [0, 1, 2].map((i) => (CAMW[0][i] + CAMW[1][i]) / 2);
  const domeG = new THREE.Group(); P.whole.add(domeG); GRAVSKY_KINDS.gsky({ spec: { from: [0, 0, 0] }, whole: domeG });
  const matT = solidMat(info, S, 1500, 0), matR = solidMat(info, S, 0, 1);
  const stT = new Soup(), stR = new Soup(), dyn = new Soup();
  // ---- terrain: 24 cross sections x 9 vertices refined 8 x 6, smooth normals, snow in the shader (the valley floor and benches are snowy)
  const NX = 8, NZ = 6, cols = 8 * NX + 1, rows = (NSEC - 1) * NZ + 1, grid = [];
  for (let r = 0; r < rows; r++) {
    const z = Z0 - (r / NZ) * ZS, zk = clamp((Z0 - z) / ZS, 0, NSEC - 1.001), k = Math.floor(zk), f = zk - k, row = [];
    for (let c = 0; c < cols; c++) {
      const i = Math.floor(c / NX), u = (c % NX) / NX, i2 = Math.min(i + 1, 8), dxa = lerp(SEC[k].dx[i], SEC[k + 1].dx[i], f), dxb = lerp(SEC[k].dx[i2], SEC[k + 1].dx[i2], f);
      const x = floorX(z) + (c === cols - 1 ? dxb : lerp(dxa, dxb, u)); row.push([x, tY(x, z), z]);
    }
    grid.push(row);
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrmz = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const gV = grid.map((row, r) => row.map(([x, y, z], c) => {
    const n = nrmz(crs(sub(grid[r][Math.min(c + 1, cols - 1)], grid[r][Math.max(c - 1, 0)]), sub(grid[Math.min(r + 1, rows - 1)][c], grid[Math.max(r - 1, 0)][c])));
    if (n[1] < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
    const slope = Math.acos(clamp(n[1])) / DEG, sl = snowLine(x, z), hs = clamp(fbm(x / 140, z / 140, 41) * 1.3 - 0.15);
    const rk = mixc(C.rockDark, C.rockLit, clamp(0.25 + 0.6 * hs)), fo = mixc(C.fir1, C.fir2, clamp(fbm(x / 90, z / 90, 33) * 1.4 - 0.2)), gr = mixc(C.ground, C.rockMid, clamp(hs * 0.7 + 0.15));
    const low = y < 2000 ? fo : gr, ao = clamp(0.5 + 0.9 * ridge(fbm(x / 120, z / 120, 9, 3)), 0.45, 1);
    return { p: [x, y, z], n, col: mixc(low, rk, Math.max(sstep(46, 58, slope), sstep(sl + 40, sl + 200, y))), ao };
  }));
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
    const q = [gV[r][c], gV[r][c + 1], gV[r + 1][c + 1], gV[r + 1][c]], o = (r + c) & 1 ? q : [q[1], q[2], q[3], q[0]];
    stT.quad(o[0].p, o[1].p, o[2].p, o[3].p, o.map((v) => v.col), o.map((v) => v.ao), o.map((v) => v.n));
  }
  // ---- peaks: dense polar meshes with ridged relief; the base is static, the slabs / wedges are dynamic parts
  const peaks = PEAKS.map((pk, pi) => {
    const [cx, sy, cz] = pk.s, [rx, rz] = pk.r, isR2 = pi === 5;
    return { ...pk, pi, isR2, cx, sy, cz, rx, rz, A: clamp(tY(cx, cz), 1550, 1820), pw: isR2 ? 1.05 : 0.8, J: isR2 ? 72 : 48, NR: isR2 ? 30 : 22, cutI: isR2 ? 17 : 10 };
  });
  const gY = gYof(peaks), slabs = [], nonR2 = peaks.filter((p) => !p.isR2);
  peaks.forEach((pk) => {
    const R = rngOf(SEED + 300 + pk.pi), { J, NR, cutI } = pk, step = TAU / J;
    const sgn = Math.sign(floorX(pk.cz) - pk.cx) || 1, troughAz = Math.atan2(0.45, sgn), g0 = pk.isR2 ? J / 2 : pk.id === "L1" || pk.id === "R1" ? 17 : 11 + (pk.pi % 3);
    const th0 = pk.isR2 ? Math.atan2((SEAM_END[2] - pk.s[2]) / pk.rz, (SEAM_END[0] - pk.s[0]) / pk.rx) : troughAz - (g0 * step) / 2, H = pk.sy - pk.A;
    // vertex grid: rows 0..NR-1 (rho 1 .. 1/NR), row NR = the summit
    const V = Array.from({ length: NR + 1 }, () => new Array(J));
    for (let i = 0; i < NR; i++) for (let j = 0; j < J; j++) {
      const th = th0 + j * step, of = 1 + 0.3 * (fbm(Math.cos(th) * 1.7 + pk.pi * 3, Math.sin(th) * 1.7, 5, 2) - 0.5), rho = 1 - i / NR;
      const x = pk.cx + Math.cos(th) * pk.rx * rho * of, z = pk.cz + Math.sin(th) * pk.rz * rho * of, g = tY(x, z), sf = peakSurface(pk, x, z, rho);
      const y = i === 0 ? g - 30 : Math.max(sf.y, g + 25), t = clamp(0.5 + 0.7 * (fbm(x / 170, z / 170, 5) - 0.5) + 0.35 * (sf.r1 - 0.5));
      V[i][j] = { p: [x, y, z], n: [0, 1, 0], ao: sf.ao, col: t < 0.5 ? mixc(C.rockDark, C.rockMid, t * 2) : mixc(C.rockMid, C.rockLit, (t - 0.5) * 2) };
    }
    const apexV = { p: [pk.cx, pk.sy, pk.cz], n: [0, 1, 0], ao: 0.9, col: C.rockMid }; for (let j = 0; j < J; j++) V[NR][j] = apexV;
    for (let i = 0; i < NR; i++) for (let j = 0; j < J; j++) {
      const a = V[Math.max(i - 1, 0)][j].p, b = V[i + 1][j].p, c = V[i][(j + 1) % J].p, d = V[i][(j + J - 1) % J].p, v = V[i][j];
      let n = nrmz(crs(sub(c, d), sub(b, a))); const rr = Math.hypot(v.p[0] - pk.cx, v.p[2] - pk.cz) || 1, s = n[1] + (0.6 * (n[0] * (v.p[0] - pk.cx) + n[2] * (v.p[2] - pk.cz))) / rr; if (s < 0) n = [-n[0], -n[1], -n[2]]; v.n = n;
    }
    const yc = V[cutI].reduce((s, v) => s + v.p[1], 0) / J, Cc = [pk.cx, yc, pk.cz], vj = (i, j) => V[i][((j % J) + J) % J];
    Object.assign(pk, { yc, apex: apexV.p, Cc, H, V, th0, step });
    const facet = (soup, i, j) => { const q = [vj(i, j), vj(i, j + 1), vj(i + 1, j + 1), vj(i + 1, j)]; if (i + 1 === NR) soup.tri(q[0].p, q[1].p, q[2].p, [q[0].col, q[1].col, q[2].col], [q[0].ao, q[1].ao, q[2].ao], [q[0].n, q[1].n, q[2].n]); else soup.quad(q[0].p, q[1].p, q[2].p, q[3].p, q.map((v) => v.col), q.map((v) => v.ao), q.map((v) => v.n)); };
    const fresh = (k) => mixc(C.cleave, C.fresh, k);
    for (let i = 0; i < cutI; i++) for (let j = 0; j < J; j++) facet(stR, i, j);
    for (let j = 0; j < J; j++) stR.tri(Cc, vj(cutI, j).p, vj(cutI, j + 1).p, fresh(0.2 + 0.5 * hash(pk.pi, j)), -1);
    const groups = [];
    if (pk.isR2) groups.push([0, J / 2], [J / 2, J]);
    else { groups.push([0, g0]); const rem = J - g0, a = Math.floor(rem / 3); groups.push([g0, g0 + a], [g0 + a, g0 + 2 * a], [g0 + 2 * a, J]); }
    groups.forEach(([j0, j1], gi) => {
      const pt = dyn.begin();
      for (let j = j0; j < j1; j++) {
        for (let i = cutI; i < NR; i++) facet(dyn, i, j);
        dyn.tri(Cc, vj(cutI, j + 1).p, vj(cutI, j).p, fresh(0.15 + 0.4 * hash(pk.pi, j + 50)), -1);
      }
      for (const jb of [j0, j1]) {   // the two radial cut faces: dark cleavage with fresh fracture #8B7164
        for (let i = cutI; i < NR; i++) dyn.tri(Cc, vj(i, jb).p, vj(i + 1, jb).p, fresh(0.25 + 0.65 * hash(pk.pi * 7 + jb, i)), -1);
      }
      dyn.end(pt);
      const mid = th0 + ((j0 + j1) / 2) * step, main = pk.isR2 ? false : gi === 0 || (pk.id === "L2" && gi === 1), slab = { pk, pt, gi, main, mid, wedge: pk.isR2 ? (gi === 0 ? "L" : "R") : null };
      if (!pk.isR2) {
        const RS = rngOf(SEED + 400 + pk.pi * 10 + gi), dT = [sgn, 0, 0.45], dl = Math.hypot(...dT), radial = [Math.cos(mid), 0, Math.sin(mid)];
        const mix = main ? [dT[0] / dl, 0, dT[2] / dl] : (() => { const q = [(0.5 * dT[0]) / dl + radial[0], 0, (0.5 * dT[2]) / dl + radial[2]], l = Math.hypot(q[0], q[2]); return [q[0] / l, 0, q[2] / l]; })();
        const f = main ? 1 : 0.4 + 0.3 * RS();
        Object.assign(slab, { dir: mix, m50: lerp(TAB.cliffSlip50[0], TAB.cliffSlip50[1], RS()) * f, m100: lerp(TAB.cliffSlip100[0], TAB.cliffSlip100[1], RS()) * f, t50: lerp(TAB.tilt50[0], TAB.tilt50[1], RS()) * (main ? 1 : 0.6), t100: lerp(TAB.tilt100[0], TAB.tilt100[1], RS()) * (main ? 1 : 0.6), shake: RS() * 100 });
      }
      slabs.push(slab);
    });
  });
  const cliffs = []; nonR2.forEach((pk) => slabs.filter((s) => s.pk === pk && s.main).forEach((s) => cliffs.push(s)));
  cliffs.forEach((s, i) => { s.cs = TAB.cliffStart[0] + (i / 7) * (TAB.cliffStart[1] - TAB.cliffStart[0]); s.ce = TAB.cliffEnd[0] + (i / 7) * (TAB.cliffEnd[1] - TAB.cliffEnd[0]); });
  for (const s of slabs) if (!s.pk.isR2 && !s.main) { const m = cliffs.find((c) => c.pk === s.pk); s.cs = m.cs + 0.15 + 0.2 * hash(s.pk.pi, s.gi); s.ce = m.ce + 0.1; }
  cliffs[0].hero = true; cliffs[5].hero = true;   // L1 and R1: a big early failure (burst from 43.0), then the design's slow slip
  // ---- spruce forest: 2400 crossing tiered cards in clumps on the slopes and benches below 1990 m + 6 rows along the valley floor (snow-dusted)
  const treeList = [];
  {
    const R = rngOf(SEED + 77); let tries = 0; const NT = 2400, push = (x, z, rowTree) => { const y = tY(x, z), h = lerp(6, 19, R()) * TS * (rowTree ? 0.8 : 1); treeList.push({ x, y, z, h, col: mixc(C.fir1, C.fir2, R()), ang: R() * Math.PI }); };
    while (treeList.length < NT && tries++ < NT * 30) {
      const z = lerp(1750, -2800, R() ** 1.2), rel = (R() < 0.5 ? -1 : 1) * lerp(330, 2300, R()), x = floorX(z) + rel, y = tY(x, z);
      if (y > 1990 || y < floorY(z) + 12 || fbm(x / 260, z / 260, 44) < 0.3 || gY(x, z) > y + 40) continue;
      const sx = (tY(x + 25, z) - tY(x - 25, z)) / 50, sz = (tY(x, z + 25) - tY(x, z - 25)) / 50; if (Math.hypot(sx, sz) > 0.95) continue;
      push(x, z, false);
    }
    for (const side of [-1, 1]) for (const rel of [130, 240, 340]) for (let z = 1700; z > -2600; z -= 46 + 30 * R()) if (R() > 0.22) push(floorX(z) + side * (rel + 30 * Math.sin(z / 170) + 14 * R()), z, true);
  }
  const addTree = (soup, tr, lift) => {
    const { x, z, h, col, ang } = tr, y = tr.y + lift, w = h * 0.2, nrm = [Math.cos(ang) * 0.5, 0.55, Math.sin(ang) * 0.5];
    for (let card = 0; card < 2; card++) {
      const a = ang + (card * Math.PI) / 2, ux = Math.cos(a), uz = Math.sin(a);
      for (let tier = 0; tier < 3; tier++) {
        const y0 = y + h * (0.08 + tier * 0.27), y1 = y0 + h * (0.42 - tier * 0.06), ww = w * (1.15 - tier * 0.3);
        soup.tri([x - ux * ww, y0, z - uz * ww], [x + ux * ww, y0, z + uz * ww], [x, y1, z], mixc(tier === 2 ? scl(col, 1.1) : col, C.snowSh, tier === 0 ? 0 : 0.18 + 0.12 * tier), -1, nrm);
      }
    }
  };
  // ---- slab patches: a lifted skin of the terrain (or of R2's face) with a scar under it; it slides, tilts and sheds powder from its start time
  const patches = [], dynT = new Soup();
  function addPatch(get, r0, r1, c0, c1, dyn_, scar, lift, spec, trees) {
    const pt = dyn_.begin(), up = (v, k) => [v.p[0] + v.n[0] * k, v.p[1] + v.n[1] * k, v.p[2] + v.n[2] * k], dn = (q) => [q[0], q[1] - 80, q[2]], cell = (r, c) => [get(r, c), get(r, c + 1), get(r + 1, c + 1), get(r + 1, c)];
    let cx = 0, cy = 0, cz = 0, n = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const q = cell(r, c); scar.quad(up(q[0], 9), up(q[1], 9), up(q[2], 9), up(q[3], 9), mixc(C.cleave, C.fresh, 0.35 + 0.4 * hash(r, c)), -1);
      dyn_.quad(up(q[0], lift), up(q[1], lift), up(q[2], lift), up(q[3], lift), q.map((v) => v.col), q.map((v) => v.ao), q.map((v) => v.n));
      for (const v of q) { cx += v.p[0]; cy += v.p[1]; cz += v.p[2]; n++; x0 = Math.min(x0, v.p[0]); x1 = Math.max(x1, v.p[0]); z0 = Math.min(z0, v.p[2]); z1 = Math.max(z1, v.p[2]); }
      const edges = [[r === r0, 0, 1], [c === c1 - 1, 1, 2], [r === r1 - 1, 2, 3], [c === c0, 3, 0]];
      for (const [on, a, b] of edges) if (on) { const A = up(q[a], lift), B = up(q[b], lift); dyn_.quad(A, B, dn(B), dn(A), mixc(C.cleave, C.fresh, 0.25 + 0.3 * hash(r + a, c)), -1); }
    }
    if (trees) for (const tr of treeList) if (!tr.used && tr.x >= x0 && tr.x <= x1 && tr.z >= z0 && tr.z <= z1) { tr.used = true; addTree(dyn_, tr, lift); }
    dyn_.end(pt); const piv = [cx / n, cy / n, cz / n], pa = { pt, piv, hold: 0.25, fall: 1.8, ...spec };
    if (spec.land) { const tx = floorX(piv[2]) + (spec.dir[0] > 0 ? -150 : 150), tz = piv[2] + 0.35 * Math.abs(tx - piv[0]); pa.tgt = [tx, tY(tx, tz) + 40, tz]; }   // it falls to the valley floor and stops there
    else { const dl = Math.hypot(spec.dir[0], spec.dir[1]); pa.tgt = [piv[0] + (spec.dir[0] / dl) * spec.dist, piv[1] - spec.drop * spec.dist, piv[2] + (spec.dir[1] / dl) * spec.dist]; }
    patches.push(pa);
  }
  const gGet = (r, c) => gV[r][c];
  const near = (z) => Math.round((Z0 - z) / (ZS / NZ));
  addPatch(gGet, near(30), near(-470), 12, 26, dynT, stT, 22, { start: 43.05, dir: [1, 0.35], dist: 560, tilt: 24, drop: 0.5, land: true, fall: 1.7 }, true);
  addPatch(gGet, near(-60), near(-540), 38, 52, dynT, stT, 22, { start: 43.12, dir: [-1, 0.35], dist: 560, tilt: 24, drop: 0.5, land: true, fall: 1.7 }, true);
  addPatch(gGet, near(-820), near(-1330), 12, 26, dynT, stT, 22, { start: 43.3, dir: [1, 0.35], dist: 520, tilt: 22, drop: 0.5, land: true, fall: 1.6 }, true);
  addPatch(gGet, near(-700), near(-1200), 38, 52, dynT, stT, 22, { start: 43.4, dir: [-1, 0.35], dist: 520, tilt: 22, drop: 0.5, land: true, fall: 1.6 }, true);
  {
    const R2p = peaks[5], Vg = (i, j) => R2p.V[i][((j % R2p.J) + R2p.J) % R2p.J], pg = (i, j) => { const v = Vg(i, j); return v; };
    addPatch(pg, 3, 15, R2p.J - 14, R2p.J - 2, dyn, stR, 20, { start: 43.1, dir: [-0.35, 1], dist: 520, tilt: 18, drop: 0.55 }, false);
    addPatch(pg, 3, 15, 2, 14, dyn, stR, 20, { start: 43.25, dir: [0.35, 1], dist: 520, tilt: 18, drop: 0.55 }, false);
  }
  for (const tr of treeList) if (!tr.used) addTree(stT, tr, 0);
  // ---- angular rock blocks: a jittered box with the face centres pushed out (24 triangles), snow on the tops from the shader
  function rockPart(seed) {
    const R = rngOf(seed), cv = Array.from({ length: 8 }, (_, i) => [(i & 1 ? 1 : -1) * (1 + (R() - 0.5) * 0.5), (i & 2 ? 1 : -1) * (0.8 + (R() - 0.5) * 0.4), (i & 4 ? 1 : -1) * (1 + (R() - 0.5) * 0.5)]);
    const faces = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]], pt = dyn.begin();
    for (const f of faces) {
      const q = f.map((i) => cv[i]), cen = [0, 1, 2].map((k) => (q[0][k] + q[1][k] + q[2][k] + q[3][k]) / 4), nn = nrmz(crs(sub(q[1], q[0]), sub(q[3], q[0]))), sg = nn[0] * cen[0] + nn[1] * cen[1] + nn[2] * cen[2] < 0 ? -1 : 1, bump = (R() - 0.3) * 0.22;
      const mid = [cen[0] + sg * nn[0] * bump, cen[1] + sg * nn[1] * bump, cen[2] + sg * nn[2] * bump], col = R() < 0.25 ? mixc(C.fresh, C.rockLit, R()) : mixc(C.rockDark, C.rockLit, 0.15 + 0.7 * R());
      for (let k = 0; k < 4; k++) dyn.tri(q[k], q[(k + 1) % 4], mid, col, -2);
    }
    return dyn.end(pt);
  }
  const R2 = peaks[5];
  const blocks = Array.from({ length: 48 }, (_, i) => {
    const R = rngOf(SEED + 600 + i), T0 = lerp(TAB.rockT[0], TAB.rockT[1], i / 47), f = 0.1 + 0.9 * R(), side = i % 2 ? "R" : "L";
    const size = lerp(TAB.rockD[0], TAB.rockD[1], R() ** 1.7) * 0.5 * RB, run = lerp(TAB.rockRun[0], TAB.rockRun[1], R()), dev = (R() - 0.5) * 1.5, h = lerp(TAB.rockH[0], TAB.rockH[1], R());
    const ax = [R() - 0.5, R() - 0.5, R() - 0.5], al = Math.hypot(...ax) || 1;
    return { pt: rockPart(SEED + 700 + i), T0, f, side, size, run, dev, h, ax: ax.map((q) => q / al), a50: lerp(85, 145, R()), a100: lerp(170, 290, R()), asp: [0.8 + 0.5 * R(), 0.7 + 0.4 * R(), 0.8 + 0.5 * R()] };
  });
  // ---- avalanche paths
  const starts = [...Array.from({ length: 16 }, (_, i) => lerp(TAB.slide16[0], TAB.slide16[1], i / 15)), ...TAB.slideExtra], paths = [];
  const marchPath = (sx, sz, Lt, seed, owner) => {
    const R = rngOf(seed); let x = sx, z = sz, len = 0; const pts = [{ x, y: gY(x, z), z, s: 0 }];
    for (let n = 0; n < 120 && len < Lt; n++) {
      const dxf = floorX(z) - x, ad = Math.abs(dxf), sg = Math.sign(dxf) || 1; let dx = sg * sstep(60, 520, ad), dz = 0.55 + 0.25 * Math.sin(n * 0.8 + seed);
      if (owner) { const q = Math.hypot((x - owner.cx) / owner.rx, (z - owner.cz) / owner.rz), w = 1.3 * (1 - sstep(0.85, 1.25, q)), l = Math.hypot(x - owner.cx, z - owner.cz) || 1; dx += ((x - owner.cx) / l) * w; dz += ((z - owner.cz) / l) * w; }
      dx += (R() - 0.5) * 0.25; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const stp = 55, nx = x + dx * stp, nz = Math.min(z + dz * stp, 1700), ny = gY(nx, nz), pr = pts[pts.length - 1], seg = Math.hypot(nx - pr.x, ny - pr.y, nz - pr.z), rem = Lt - len;
      if (seg > rem) { const k = rem / seg; pts.push({ x: lerp(pr.x, nx, k), y: lerp(pr.y, ny, k), z: lerp(pr.z, nz, k), s: Lt }); len = Lt; break; }
      len += seg; x = nx; z = nz; pts.push({ x, y: ny, z, s: len });
    }
    return pts;
  };
  nonR2.forEach((pk, k) => {
    for (let q = 0; q < 3; q++) {
      const rank = k + q * 7, start = starts[rank], troughAz = Math.atan2(0.45, Math.sign(floorX(pk.cz) - pk.cx) || 1), az = troughAz + (q - 1) * 0.55;
      const sx = pk.cx + Math.cos(az) * pk.rx * 0.55, sz = pk.cz + Math.sin(az) * pk.rz * 0.55, Lt = Math.min(lerp(TAB.slideLen[1], TAB.slideLen[0], rank / 20), ((TAB.slideEnd - start) * TAB.slideSpeed) / 1.25);
      paths.push({ pk, start, Lt, pts: marchPath(sx, sz, Lt, SEED + 800 + rank, pk) });
    }
  });
  [0.55, 0.75, 0.92].forEach((f, q) => {
    const start = TAB.slideR2[q], sx = lerp(610, SEAM_END[0], f), sz = lerp(-2760, SEAM_END[2], f), Lt = Math.min([1100, 1000, 900][q], ((TAB.slideEnd - start) * TAB.slideSpeed) / 1.25);
    paths.push({ pk: R2, start, Lt, pts: marchPath(sx + 20, sz + 20, Lt, SEED + 850 + q, R2) });
  });
  for (const p of paths) {
    p.dur = p.start < 43.7 ? 1.5 : Math.max(2.0, (1.25 * p.Lt) / TAB.slideSpeed);   // the first four-plus run fast: heads on the floor by 44.5
    p.rocks = Array.from({ length: 3 }, (_, i) => ({ f: 0.5 + 0.5 * hash((p.start * 100) | 0, i), lat: (hash((p.start * 100) | 0, i + 5) - 0.5) * 0.8, size: lerp(8, 24, hash((p.start * 100) | 0, i + 9)) * 0.5 * RB, h: lerp(10, 40, hash((p.start * 100) | 0, i + 11)), pt: rockPart(SEED + 1000 + ((p.start * 100) | 0) + i) }));
  }
  const sample = (p, s) => { const pts = p.pts; s = clamp(s, 0, p.Lt); let i = 1; while (i < pts.length - 1 && pts[i].s < s) i++; const a = pts[i - 1], b = pts[i], k = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0; return [lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k)]; };
  const herm = (age) => { const a = clamp(age), h = (u, p0, p1, d0, d1) => (2 * u ** 3 - 3 * u * u + 1) * p0 + (u ** 3 - 2 * u * u + u) * d0 + (-2 * u ** 3 + 3 * u * u) * p1 + (u ** 3 - u * u) * d1; return a < 0.5 ? h(a / 0.5, 0, 0.5, 0.75 * 0.5, 1.25 * 0.5) : h((a - 0.5) / 0.5, 0.5, 1, 1.25 * 0.5, 0.75 * 0.5); };
  // ---- meshes
  const stTMesh = lookOnly(new THREE.Mesh(stT.geometry(false), matT), 0); G.add(stTMesh);
  const stRMesh = lookOnly(new THREE.Mesh(stR.geometry(false), matR), 0); G.add(stRMesh);
  const dynGeo = dyn.geometry(true), dynMesh = lookOnly(new THREE.Mesh(dynGeo, matR), 1); G.add(dynMesh);
  const dynTGeo = dynT.geometry(true); G.add(lookOnly(new THREE.Mesh(dynTGeo, matT), 1));
  // ---- draped scars + fans (one buffer): ribbon 10 segments, fan 9 triangles per path
  const NSEG = 10, FV = 10, perPath = (NSEG + 1) * 2 + FV, flatPos = new Float32Array(paths.length * perPath * 3), flatCol = new Float32Array(paths.length * perPath * 4), flatIdx = [];
  paths.forEach((p, pi) => {
    const b = pi * perPath;
    for (let j = 0; j <= NSEG; j++) {
      const s = (j / NSEG) * p.Lt, c = sample(p, s), c2 = sample(p, Math.min(p.Lt, s + 30)), c1 = sample(p, Math.max(0, s - 30)); let tx = c2[0] - c1[0], tz = c2[2] - c1[2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const wd = 30 + 30 * (j / NSEG);
      for (const sd of [-1, 1]) { const x = c[0] - tz * wd * sd, z = c[2] + tx * wd * sd, v = b + j * 2 + (sd > 0 ? 1 : 0); flatPos.set([x, gY(x, z) + 14, z], v * 3); }
      if (j < NSEG) { const v = b + j * 2; flatIdx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    }
    const fb = b + (NSEG + 1) * 2; for (let k = 1; k < FV; k++) flatIdx.push(fb, fb + k, fb + 1 + (k % (FV - 1)));
    const e = p.pts[p.pts.length - 1], e0 = sample(p, Math.max(0, p.Lt - 60)); p.fanDir = Math.atan2(e.z - e0[2], e.x - e0[0]); p.fanR = lerp(110, 230, hash((p.start * 100) | 0, 21)); p.fanC = [e.x, e.z];
  });
  const flatGeo = new THREE.BufferGeometry(); flatGeo.setAttribute("position", new THREE.BufferAttribute(flatPos, 3)); flatGeo.setAttribute("aCol4", new THREE.BufferAttribute(flatCol, 4)); flatGeo.setIndex(flatIdx);
  const flatMat = noLine(new THREE.ShaderMaterial({ uniforms: { uMist: { value: new THREE.Vector3(...C.mist) }, uS: { value: SC } }, vertexShader: FLAT_VS, fragmentShader: FLAT_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  G.add(lookOnly(new THREE.Mesh(flatGeo, flatMat), 5));
  // ---- billows: 34 sky clouds, 40 valley-floor dust bank, 10 per avalanche path, 4 per cliff, 24 R2 seam / foot, 3 trail puffs per R2 block
  const quads = [], addQ = (o) => { quads.push({ c: [0, 0, 0], hs: 0, asp: 1, a: 0, tile: 0, rot: 0, pal: [1, 0, 0], ...o }); return quads.length - 1; };
  const Rc = rngOf(SEED + 55);
  for (let i = 0; i < 34; i++) {
    const az = lerp(-55, 62, Rc()), el = lerp(6, 40, Rc() ** 1.2), dist = 3500, dir = [Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)], hw = dist * Math.tan(lerp(4, 11, Rc()) * DEG) * 1.2, asp = lerp(2.2, 3.6, Rc());
    addQ({ c: [0, 1, 2].map((k) => (domeC[k] + dir[k] * dist - O[k]) / SC), hs: hw / SC, asp, a: lerp(0.55, 0.85, Rc()), tile: 2 + (i % 2), pal: [0, 0, 1] });
  }
  const NQ_STATIC = quads.length, bank0 = quads.length, NBANK = 64; for (let i = 0; i < NBANK; i++) addQ({ tile: i % 2, pal: [0.35, 0.65, 0] });
  const NP = 10, PF = [1, 0.93, 0.86, 0.78, 0.69, 0.6, 0.5, 0.4, 0.28, 0.15], PR = [1, 0.7, 0.85, 0.6, 0.7, 0.9, 0.55, 0.5, 0.42, 0.36], PA = [1, 0.9, 0.85, 0.75, 0.68, 0.6, 0.5, 0.4, 0.3, 0.22];
  paths.forEach((p, pi) => { p.q0 = quads.length; for (let i = 0; i < NP; i++) addQ({ tile: (pi + i) % 2, pal: hash(pi, i + 40) < 0.5 ? [0.85, 0.15, 0] : [0.3, 0.7, 0] }); });
  cliffs.forEach((s) => { s.q0 = quads.length; for (let i = 0; i < 4; i++) addQ({ tile: (s.pk.pi + i) % 2, pal: [0.5, 0.5, 0] }); });
  patches.forEach((pa) => { pa.q0 = quads.length; for (let i = 0; i < 4; i++) addQ({ tile: i % 2, pal: [0.8, 0.2, 0] }); });
  const seam0 = quads.length; for (let i = 0; i < 24; i++) addQ({ tile: i % 2, pal: [i % 3 === 0 ? 0.3 : 0.7, i % 3 === 0 ? 0.7 : 0.3, 0] });
  blocks.forEach((b, bi) => { b.q0 = quads.length; for (let k = 0; k < 3; k++) addQ({ tile: (bi + k) % 2, pal: [0.4, 0.6, 0] }); });
  const NQ = quads.length, qPos = new Float32Array(NQ * 12), qCorner = new Float32Array(NQ * 8), qSz = new Float32Array(NQ * 16), qPal = new Float32Array(NQ * 12), qRot = new Float32Array(NQ * 4), qIdx = new Uint32Array(NQ * 6);
  quads.forEach((q, i) => { for (let k = 0; k < 4; k++) { qCorner.set([k === 1 || k === 2 ? 1 : -1, k >= 2 ? 1 : -1], i * 8 + k * 2); qPal.set(q.pal, i * 12 + k * 3); } });
  const qGeo = new THREE.BufferGeometry(); qGeo.setAttribute("position", new THREE.BufferAttribute(qPos, 3)); qGeo.setAttribute("aCorner", new THREE.BufferAttribute(qCorner, 2)); qGeo.setAttribute("aSz", new THREE.BufferAttribute(qSz, 4)); qGeo.setAttribute("aPal", new THREE.BufferAttribute(qPal, 3)); qGeo.setAttribute("aRot", new THREE.BufferAttribute(qRot, 1));
  qGeo.setIndex(new THREE.BufferAttribute(qIdx, 1)); qGeo.index.setUsage(THREE.DynamicDrawUsage);
  const palU = [["#8A8FB0", "#E2D4D2", "#FFE6CF"], ["#6E6068", "#B09A94", "#E8C6AE"], ["#655773", "#C48590", "#F4A88B"]].flat().map((h) => new THREE.Vector3(...lin(h)));
  const qMat = noLine(new THREE.ShaderMaterial({ uniforms: { uMap: { value: billowTex() }, uPal: { value: palU }, uS: { value: SC } }, vertexShader: BIL_VS, fragmentShader: BIL_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide, fog: false }));
  const qMesh = lookOnly(new THREE.Mesh(qGeo, qMat), 10); G.add(qMesh);
  const setQ = (i, c, hs, a, asp = 1, rot = 0) => { const o = i * 12, q = quads[i]; for (let k = 0; k < 4; k++) { qPos[o + k * 3] = c[0]; qPos[o + k * 3 + 1] = c[1]; qPos[o + k * 3 + 2] = c[2]; qSz.set([a > 0.004 ? hs : 0, asp, a, q.tile], i * 16 + k * 4); qRot[i * 4 + k] = rot; } q.c = c; };
  quads.forEach((q, i) => { if (i < NQ_STATIC) setQ(i, q.c, q.hs, q.a, q.asp); });
  const order = new Uint16Array(NQ).map((_, i) => i), key = new Float32Array(NQ), tmpV = new THREE.Vector3();
  qMesh.onBeforeRender = (renderer, scene, camera) => {
    qMesh.worldToLocal(tmpV.copy(camera.position)); const cx = tmpV.x, cy = tmpV.y, cz = tmpV.z;
    for (let i = 0; i < NQ; i++) key[i] = (qPos[i * 12] - cx) ** 2 + (qPos[i * 12 + 1] - cy) ** 2 + (qPos[i * 12 + 2] - cz) ** 2;
    for (let i = 0; i < NQ; i++) order[i] = i; order.sort((a, b) => key[b] - key[a] || a - b);
    for (let n = 0; n < NQ; n++) { const q = order[n], v = q * 4; qIdx.set([v, v + 1, v + 2, v, v + 2, v + 3], n * 6); }
    qGeo.index.needsUpdate = true;
  };
  // ---- per frame
  const Mt = new THREE.Matrix4(), Mp = new THREE.Matrix4(), pos = new THREE.Vector3(), qt = new THREE.Quaternion(), sc3 = new THREE.Vector3(), ax3 = new THREE.Vector3(), dir3 = new THREE.Vector3();
  const dustRamp = (age) => [pw3(age, TAB.slideBillow[0][0], TAB.slideBillow[1][0], TAB.slideBillow[2][0]), pw3(age, TAB.slideBillow[0][1], TAB.slideBillow[1][1], TAB.slideBillow[2][1])];
  const setPart = (pt, px, py, pz, quat, s3, pvx, pvy, pvz) => { Mt.compose(pos.set(px, py, pz), quat, s3); if (pvx !== undefined) { Mp.makeTranslation(-pvx, -pvy, -pvz); Mt.multiply(Mp); } pt.M.copy(Mt); pt.soup.place(pt); };
  const hideQ = new THREE.Quaternion(), s0 = new THREE.Vector3(1e-4, 1e-4, 1e-4), s1 = new THREE.Vector3(1, 1, 1);
  const wedgeAt = (side, k) => { const W = TAB.wedge[side]; return { dx: pw3(k, 0, W.x[0], W.x[1]), dy: -pw3(k, 0, W.down[0], W.down[1]), dz: pw3(k, 0, W.adv[0], W.adv[1]), roll: pw3(k, 0, W.roll[0], W.roll[1]) * (side === "L" ? 1 : -1) * DEG }; };
  const blockPos = (b, age, out) => {   // the flight of an R2 block (local metres), age 0..1
    const wk = wedgeAt(b.side, P01(b.T0, TAB.split[0], TAB.split[1])), sp = [lerp(R2.apex[0], SEAM_END[0], b.f), lerp(R2.apex[1], SEAM_END[1], b.f), lerp(R2.apex[2], SEAM_END[2], b.f)];
    const st0 = [sp[0] + wk.dx, sp[1] + wk.dy, sp[2] + wk.dz + b.size * 0.6], ex = st0[0] + Math.sin(b.dev) * b.run, ez = Math.min(st0[2] + Math.cos(b.dev) * b.run, 1700), ey = gY(ex, ez) + b.size * 0.35;
    out[0] = lerp(st0[0], ex, age); out[2] = lerp(st0[2], ez, age); out[1] = lerp(st0[1], ey, age) + 4 * b.h * age * (1 - age); return out;
  };
  const bp = [0, 0, 0];
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, rs = Math.max(ps.scale, 1e-4);
      G.position.set((O[0] - ps.x) / rs, (O[1] - ps.y) / rs, (O[2] - ps.z) / rs); G.scale.setScalar(SC / rs);
      domeG.position.set((domeC[0] - ps.x) / rs, (domeC[1] - ps.y) / rs, (domeC[2] - ps.z) / rs); domeG.scale.setScalar(1 / rs);
      const crush = P01(t, TAB.crush[0], TAB.crush[1]), loss = pw3(crush, 0, TAB.crushHalf, 1), split = P01(t, TAB.split[0], TAB.split[1]);
      const slabState = (s) => {   // slip m, tilt, descent factor, dust progress
        const p = P01(t, s.cs, s.ce); let m = SB * pw3(p, 0, s.m50, s.m100), ti = pw3(p, 0, s.t50, s.t100) * DEG, dp = p, dsc = 0.3;
        if (s.hero) { const h = sstep(43.0, 43.8, t); m = Math.max(m, 330 * SB * h); ti = Math.max(ti, 24 * DEG * h); dp = Math.max(p, 0.6 * sstep(43.0, 43.6, t)); dsc = 0.6; }
        return { p, m, ti, dp, dsc };
      };
      for (const s of slabs) {
        const pk = s.pk, pv = pk.Cc;
        if (pk.isR2) { const w = wedgeAt(s.wedge, split), cp = sstep(0, 1, P01(t, 43.1, 45.3)), ex = s.wedge === "L" ? -1 : 1; qt.setFromAxisAngle(ax3.set(0, 0, 1), w.roll); setPart(s.pt, pv[0] + w.dx + ex * 12 * cp, pv[1] + w.dy - 260 * cp, pv[2] + w.dz, qt, s1, pv[0], pv[1], pv[2]); continue; }
        const st = slabState(s), L = pk.loss * pk.H, hcap = pk.sy - pk.yc, sq = 1 - (0.55 * L * loss) / hcap, drop = 0.45 * L * loss, shake = st.p > 0 && st.p < 1 ? Math.sin(t * 41 + s.shake) * 5 * Math.sin(st.p * Math.PI) : 0;
        ax3.set(0, 1, 0).cross(dir3.set(s.dir[0], 0, s.dir[2])).normalize(); qt.setFromAxisAngle(ax3, st.ti);
        setPart(s.pt, pv[0] + s.dir[0] * st.m, pv[1] - st.dsc * st.m - drop + shake, pv[2] + s.dir[2] * st.m, qt, sc3.set(1, sq, 1), pv[0], pv[1], pv[2]);
      }
      hideQ.identity();
      for (const pa of patches) {   // let go after a short creep, then fall: distance grows with the square of the time, the tilt grows, it stops on the floor and breaks into powder
        const el = t - pa.start, u = clamp((el - pa.hold) / pa.fall), g = u * u, tl = pa.start + pa.hold + pa.fall, sink = sstep(0, 0.7, t - tl);
        const dl = Math.hypot(pa.dir[0], pa.dir[1]), dx = pa.dir[0] / dl, dz = pa.dir[1] / dl, tilt = el <= 0 ? 0 : (3 * sstep(0, pa.hold, el) + (pa.tilt + 18) * g) * DEG, sz = Math.max(0.03, 1 - 0.97 * sink);
        ax3.set(0, 1, 0).cross(dir3.set(dx, 0, dz)).normalize(); qt.setFromAxisAngle(ax3, tilt);
        const mx = pa.tgt[0] - pa.piv[0], my = pa.tgt[1] - pa.piv[1], mz = pa.tgt[2] - pa.piv[2];
        setPart(pa.pt, pa.piv[0] + mx * g, pa.piv[1] + my * g - 6 * sstep(0, pa.hold, el), pa.piv[2] + mz * g, qt, sc3.set(sz, sz, sz), pa.piv[0], pa.piv[1], pa.piv[2]);
        const burst = sstep(0, 0.9, t - tl), a = el <= 0 ? 0 : 0.85 * sstep(0, 0.1, el) * (1 - 0.6 * sstep(0.2, 2.2, t - tl)), r = (170 + 260 * g + 300 * burst) * PUFF * 0.45;
        for (let i = 0; i < 4; i++) { const f = [0.1, 0.4, 0.7, 1][i], gg = Math.max(g * f, 0); setQ(pa.q0 + i, [pa.piv[0] + mx * gg - dx * 60 + (i - 1.5) * (50 + 90 * burst) * dz, pa.piv[1] + my * gg + 130 + 90 * i * Math.max(g, burst), pa.piv[2] + mz * gg - dz * 60 + (i - 1.5) * (50 + 90 * burst) * dx], a > 0 ? r * (1 - 0.12 * i) : 0, a * (1 - 0.1 * i), 1.1, hash(i, 91) * TAU + t * (i % 2 ? 1 : -1) * 0.9); }
      }
      for (const b of blocks) {
        const ageT = (t - b.T0) / TAB.rockDur, age = clamp(ageT), q0 = b.q0;
        if (age <= 0) { setPart(b.pt, 0, -9999, 0, hideQ, s0); for (let k = 0; k < 3; k++) setQ(q0 + k, [0, 0, 0], 0, 0); continue; }
        blockPos(b, age, bp); qt.setFromAxisAngle(ax3.set(...b.ax), pw3(age, 0, b.a50, b.a100) * DEG); const grow = sstep(0, 0.05, age) * b.size;
        setPart(b.pt, bp[0], bp[1], bp[2], qt, sc3.set(grow * b.asp[0], grow * b.asp[1], grow * b.asp[2]));
        const fade = sstep(0, 0.06, ageT) * (1 - sstep(1.0, 1.5, ageT));   // the dust trail: three puffs left behind, growing and thinning
        for (let k = 0; k < 3; k++) { blockPos(b, clamp(ageT - 0.07 * (k + 1)), bp); const r = b.size * (1.3 + 0.9 * k) * PUFF / 2.6 * (1 + 0.6 * clamp(ageT)); setQ(q0 + k, [bp[0], bp[1] + r * 0.2, bp[2]], fade > 0.01 ? r : 0, 0.55 * fade * (1 - 0.28 * k), 1.1, b.f * 6 + k + ageT * 1.5); }
      }
      paths.forEach((p, pi) => {
        const age = P01(t, p.start, p.start + p.dur), sH = herm(age), head = sH * p.Lt, [rad0, op] = dustRamp(age), rad = Math.max(rad0, 40), b = pi * perPath;
        for (let j = 0; j <= NSEG; j++) { const s = (j / NSEG) * p.Lt, a = age <= 0 ? 0 : 0.85 * (1 - sstep(head - 60, head + 30, s)) * (1 - 0.45 * (j / NSEG)) * (age >= 1 ? 0.7 : 1); for (let sd = 0; sd < 2; sd++) flatCol.set([0.17 + 0.2 * (j / NSEG), 0.13 + 0.15 * (j / NSEG), 0.14 + 0.12 * (j / NSEG), a], (b + j * 2 + sd) * 4); }
        const fb = b + (NSEG + 1) * 2, fg = sstep(0.3, 1, age), fr = p.fanR * (0.25 + 0.75 * fg) * (age > 0 ? 1 : 0), fa = age <= 0 ? 0 : 0.88 * sstep(0.35, 0.95, age);
        flatCol.set([0.93, 0.85, 0.78, fa], fb * 4); flatPos.set([p.fanC[0], gY(p.fanC[0], p.fanC[1]) + 16, p.fanC[1]], fb * 3);
        for (let k = 1; k < FV; k++) { const an = p.fanDir + ((k - 1) / (FV - 2) - 0.5) * 2.4, rr = fr * (0.8 + 0.4 * hash(pi, k)), x = p.fanC[0] + Math.cos(an) * rr * 0.75, z = p.fanC[1] + Math.sin(an) * rr * 1.1; flatPos.set([x, gY(x, z) + 14, z], (fb + k) * 3); flatCol.set([0.78, 0.7, 0.66, fa * 0.7], (fb + k) * 4); }
        const on = age > 0 ? 1 : 0, env = sstep(0, 0.06, age), pf = p.pk.isR2 ? 0.55 : 1;   // a dense head, a thinning tail that rises and rolls
        for (let i = 0; i < NP; i++) {
          const q = p.q0 + i, c = sample(p, head * PF[i]), r = rad * PUFF * 0.75 * pf * PR[i], lat = (hash(pi, i + 60) - 0.5) * (0.5 + 0.08 * i) * r, rise = r * 0.4 + (1 - PF[i]) * rad * 1.2 * on;
          setQ(q, [c[0] + lat, c[1] + rise, c[2]], on ? r : 0, on * env * op * PA[i] * (age >= 1 ? 0.8 : 1), 1.15, hash(pi, i + 90) * TAU + (t - p.start) * (hash(pi, i + 70) - 0.5) * 3.2);
        }
        p.rocks.forEach((rk) => {
          const a = clamp((age - 0.02) / 0.98), c = sample(p, head * rk.f), r = age <= 0 ? 0 : sstep(0, 0.08, age) * rk.size, x = c[0] + rk.lat * 60, z = c[2], y = gY(x, z) + rk.size * 0.3 + 4 * rk.h * a * (1 - a) * (age < 1 ? 1 : 0);
          qt.setFromAxisAngle(ax3.set(rk.f, 1, rk.lat).normalize(), a * 6); setPart(rk.pt, x, age <= 0 ? -9999 : y, z, qt, sc3.set(r, r, r));
        });
      });
      {   // the cloud wall rolling down the valley floor toward the camera: dense at the front, thinning behind it
        const wp = P01(t, 43.4, 45.6), zf = lerp(-4000, 1100, wp);
        for (let i = 0; i < NBANK; i++) {
          const R_ = (k) => hash(i, k + 120), q = i / NBANK, z = zf - q * q * 3000 - R_(1) * 160, r = (440 - 220 * q) * (PUFF / 2.6) * (0.7 + 0.5 * R_(2));
          const x = floorX(z) + (R_(3) - 0.5) * 760, y = Math.max(gY(x, z), floorY(z)) + r * 0.6 + 200 * (1 - q) * R_(4), a = wp <= 0 ? 0 : 0.88 * sstep(0, 0.1, wp) * (1 - 0.5 * q);
          setQ(bank0 + i, [x, y, z], a > 0 ? r : 0, a, 1.35, R_(5) * TAU + t * (R_(6) - 0.5) * 2.4);
        }
      }
      cliffs.forEach((s) => {
        const st = slabState(s), pk = s.pk, a = st.dp <= 0 ? 0 : 0.85 * sstep(0, 0.05, st.dp) * (1 - 0.4 * sstep(0.6, 1, st.dp)), r = (70 + 110 * st.dp) * PUFF * 0.6;
        for (let i = 0; i < 4; i++) setQ(s.q0 + i, [pk.Cc[0] + s.dir[0] * st.m * (0.3 + 0.25 * i) + (i - 1.5) * 90, pk.yc + 0.2 * (pk.sy - pk.yc) + 110 * i * st.dp + r * 0.2, pk.Cc[2] + pk.rz * 0.5 + s.dir[2] * st.m * (0.3 + 0.25 * i)], a > 0 ? r * (1 - 0.15 * i) : 0, a * (1 - 0.15 * i), 1.1, hash(pk.pi, i + 3) * TAU + t * 0.8 * (i % 2 ? 1 : -1));
      });
      for (let i = 0; i < 24; i++) {   // R2: 12 puffs low on the seam riding the wedges, 12 round its foot
        const R_ = (k) => hash(i, k + 70), side = i % 2 ? "R" : "L", w = wedgeAt(side, split);
        if (i < 12) {
          const f = 0.9 + 0.3 * R_(1), c = [lerp(R2.apex[0], SEAM_END[0], f) + w.dx + (R_(2) - 0.5) * 200, lerp(R2.apex[1], SEAM_END[1], f) + w.dy * (0.5 + 0.4 * R_(3)) + 30 * R_(4), lerp(R2.apex[2], SEAM_END[2], f) + w.dz + 60 + (R_(5) - 0.5) * 120];
          const a = split <= 0 ? 0 : 0.5 * sstep(0.02, 0.2, split) * (1 - 0.3 * sstep(0.7, 1, split)), r = (20 + 60 * Math.sqrt(split)) * PUFF * 0.7 * (0.6 + 0.5 * R_(6));
          setQ(seam0 + i, c, a > 0 ? r : 0, a, 1.15, R_(8) * TAU + t * (R_(9) - 0.5) * 2);
        } else {
          const an = R_(7) * TAU, dd = 200 + 560 * R_(8) * split, z = R2.cz + 330 + 600 * R_(9) * split, x = R2.cx + Math.cos(an) * dd + (R_(10) - 0.5) * 300, r = (50 + 150 * Math.sqrt(split)) * PUFF * 0.8 * (0.6 + 0.5 * R_(12)), y = gY(x, z) + r * 0.35 + 80 * R_(11) * split;
          setQ(seam0 + i, [x, y, z], split > 0 ? r : 0, split <= 0 ? 0 : 0.7 * sstep(0.05, 0.35, split), 1.3, R_(13) * TAU + t * (R_(14) - 0.5));
        }
      }
      dyn.pa.needsUpdate = true; dyn.na.needsUpdate = true; dynT.pa.needsUpdate = true; dynT.na.needsUpdate = true; flatGeo.attributes.aCol4.needsUpdate = true; flatGeo.attributes.position.needsUpdate = true; qGeo.attributes.position.needsUpdate = true; qGeo.attributes.aSz.needsUpdate = true; qGeo.attributes.aRot.needsUpdate = true;
    },
  };
}

export const GRAVALPS_KINDS = { galps };
