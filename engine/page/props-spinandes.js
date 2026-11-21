import * as THREE from "three";
import { clamp, P as P01, S as S01, keys, spin, flicker, psi, alphaDeg, moonAt, seaY, sea as seaParam, alt as altT } from "./spin-tracks.js";

// props-spinandes.js: Quito, the Andes valleys, the rising sea and the high view of fact what-if 03 "Earth spins faster" (DESIGN C1-C5, G).
// Three kinds, all WORLD-placed (no grip: nobody holds them). Put each at x 0, y 0, z 0, rot 0, scale 1 so the world is DESIGN's world Q.
// Everything is a pure function of ONE tweened param `t` = clip seconds (jump it with c.prop(0, id, { t: ... }, 0), then tween to the
// next value); no random, no clock; seed 31703. The sky dome, the room, the street, rain and space are other builders'. Far plane: 6000.
//
//   kind     origin (spec.origin)   what it is
//   sandes   [0,0,0]                C1 terrain (2 graded meshes, 10.7k tris incl. skirts), C2 far range band + VOLCANO + steam plume, C3 towns: 750 houses
//                                   (CENTRO 379, LOMA 140, LADERA 83, OESTE 40, farms 12, VALLE 96, procedural facades + clay roofs, night lights),
//                                   780 tree cards, 14 palms, churches CH1-CH4 (CH1 on LOMA, CH4 the VALLE dome). ~30.3k tris in 10 draws (one is the sprite mesh).
//   ssea     [0,0,0]                C4: sea surface at seaY(t) with whitecaps, surge walls W1-W4, shore breakers (48), foam rings, spray, VALLE floating
//                                   pieces. ~13.4k tris in 8 draws (one is the sprite mesh, 320 sprites).
//   shigh    [40000,0,0] (HI)       G: the small planet cap (R 2400, centre = origin - R down), cordilleras, flood sea, cloud sea (192 sprites), the
//                                   air band, 9 rising water blobs + 36 teardrops. ~8.1k tris.
//
// SPEC KEYS (default)   origin: see table. t: 0 (the tween overrides).
//   sandes: centro 1       1 draws the 379 CENTRO houses (5.3k tris); set 0 for any shot that cannot see the plateau (window, street): saves 5.3k.
//           plumeDir -1    plume leans toward -x (the "everything streams right to left" rule); the design text says +x, set 1 to follow it.
//   ssea:   seaCols 56     columns of the sea mesh; 28 behind a window or the street (DESIGN C4).
//   shigh:  none.
// WHAT t DRIVES: sandes - night lights + terminator (spin-tracks psi/night), mist colour, plume lean/length (2x -> 20 deg 380 m, 13x -> 65 deg 1100 m).
//   ssea - sea level seaY(t), swell heights x (1 + .12 s) (and the F6 growth after 43.3 s), whitecap cover .35 -> .80, wall positions z0 + v t,
//   impact + flatten, spray, pieces. shigh - alt(t) = P(55, 60): camera height 1100 -> 1784 over the surface; blobs ride an ASSUMED camera
//   (0, 2400 + height, 0) pitched down 43.7 -> 52 deg, so keep the real P14 camera there; the cloud sea drifts toward -x.
//
// FOR THE STREET BUILDER (F6 lift-off) - the sea mesh and the shared lighting, all exported at the bottom:
//   spinSeaY(t)  y_sea.   spinSwellH(x, z, t) swell height over y_sea; spinSwellK(t) = { hm, tau } (height factor and phase time).
//   Swells SW = 3 x [height m, length m, heading deg off +z, speed m/s] = [2.2,180,0,14] [1.3,95,24,10] [.7,41,-31,7], phase offset i * 1.3.
//   Mesh: x +-2800 graded (power 1.7, 56 cols; seaCols), z -40 .. -5600 graded (power 1.8, 72 rows), transparent ShaderMaterial, depthWrite on,
//   renderOrder 2, vertex swell in the shader: vW = (x, uSeaY + swell, z). Uniforms: uSeaY, uSw[3] (vec4: height*hm, k, sin h, cos h), uPh (k c tau),
//   uCover (whitecaps), uAmp, uWall[4] (wall apron foam: x0, x1, z, height), uHm (half-float terrain height texture 448 x 560, x +-2800, z +100 .. -5700).
//   spinWorld() builds the terrain/house world once (cached); spinGroundH(x, z) exact ground height; spinGroundMesh(W, x, z) ground ON THE DRAWN MESH
//   (place things with this one). SPIN_WALLS lists W1-W4 (x0, x1, z0, v, H, zStop / bore).
//   MIST + NIGHT helper: spinEnvAt(t) -> { L (light dir toward the light), A (flicker), night [mode, v, 0], dim, moonDir, s }; in the shaders the common
//   block GLC gives mistCol(N) (dome colour at el 2 deg: day #FFC08A, night #2F3F70, twilight #F0A066, x uMistDim) and mistAmt(p, k) (reaches .55 at
//   5200 m), nightAt(p) / nightK(N) (the terminator, per fragment) and toonLit(alb, n) (bands .18 / .58, gains .50 / .76 / 1.0). Reuse them so the
//   street matches the valley (copy GLC, feed uLdir / uA / uMistDim / uNight / uMoon from spinEnvAt).
//
// DEPARTURES (director, please judge): LOMA is p 1.5, rx 125, rz 175 (design p 2, 110 x 170 was a 78 deg tower the mesh could not draw); ridges R1-R5
//   use HALF the design long x wide as their e-fold radii (the full numbers merge into one wall and bury the sea); the near mesh is graded 56 x 46
//   over z +600 .. -900 (the far mesh starts at -900), LOMA's houses sit with a foundation of <= 4.5 m; LADERA 83 (design 90); houses are
//   procedural shader facades, not atlases; W1 and W3 break at z -700 by rule (7.5 s), W2 and W4 where the ground meets them; the foam front
//   on land is a lace band (-1 .. +1.7 m), not a flat white skin; Quito's light strip in G is scaled up for the 9:16 frame.

const SEED = 31703, TAU = Math.PI * 2, DEG = Math.PI / 180;
// ------------------------------------------------------------------------------------------------ small helpers
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const fract = (x) => x - Math.floor(x);
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(a, b = 0, c = 0) { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1) ^ SEED; h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, z, s) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = hash(ix, iz, s), b = hash(ix + 1, iz, s), c = hash(ix, iz + 1, s), d = hash(ix + 1, iz + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, z, s, o = 3) { let a = 0.5, f = 1, r = 0, n = 0; for (let i = 0; i < o; i++) { r += a * vnoise(x * f, z * f, s + i); n += a; f *= 2.03; a *= 0.5; } return r / n; }
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const cv2 = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const cvTex = (c, aniso = 4) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

// ------------------------------------------------------------------------------------------------ the terrain (DESIGN C1), metres, world Q
const PROF = [[600, 46], [260, 14], [40, -6], [-3, -9], [-130, -29.3], [-560, -308], [-700, -328], [-2700, -330], [-3300, -240], [-4200, -60], [-5600, 120]];
const RZ0 = 700, RZ1 = -5800;
const RT = once("RT", () => {   // the centre profile R(z) at 1 m, corners rounded by two box passes (about 20 m)
  const n = RZ0 - RZ1 + 1; let a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const z = RZ0 - i; let y;
    if (z >= PROF[0][0]) y = PROF[0][1]; else if (z <= PROF[PROF.length - 1][0]) y = PROF[PROF.length - 1][1];
    else { let k = 1; while (PROF[k][0] > z) k++; const [z0, y0] = PROF[k - 1], [z1, y1] = PROF[k]; y = y0 + (y1 - y0) * (z - z0) / (z1 - z0); }
    a[i] = y;
  }
  for (let pass = 0; pass < 2; pass++) { const b = new Float32Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let k = -10; k <= 10; k++) s += a[Math.min(n - 1, Math.max(0, i + k))]; b[i] = s / 21; } a = b; }
  return a;
});
const R = (z) => { const f = clamp(RZ0 - z, 0, RT.length - 1.001), i = Math.floor(f); return lerp(RT[i], RT[i + 1], f - i); };
const Z0f = (x) => 60 * Math.sin(x / 310) + 35 * (Math.sin(x / 127 + 1.3) - Math.sin(1.3));
// bumps: centre, semi-axes (rx x rz; a ridge: long x wide along `ang` degrees off +z), top y, exponent p (as the design table).
const BUMPS = [
  { id: "LOMA", x: -95, z: -660, rx: 125, rz: 175, top: 10, p: 1.5 },
  { id: "OESTE", x: -640, z: -420, rx: 280, rz: 240, top: -60, p: 1 },
  { id: "ESTE", x: 560, z: -600, rx: 260, rz: 300, top: -120, p: 1 },
  { id: "VALLE", x: 810, z: -1250, rx: 300, rz: 240, top: -284, p: 2 },
  ...[[-900, -1500, 700, 150, 70, 110], [-250, -1750, 900, 190, 82, 150], [300, -2050, 620, 140, 95, 95], [1100, -1900, 800, 170, 78, 130], [-1400, -2300, 1000, 220, 88, 190]]
    .map(([x, z, rx, rz, ang, up], i) => ({ id: "R" + (i + 1), x, z, rx: rx * 0.5, rz: rz * 0.8, ang, top: -330 + up, p: 1 })),
  { id: "F1", x: -1300, z: -3400, rx: 900, rz: 420, top: 40, p: 1 }, { id: "F2", x: 200, z: -3700, rx: 1100, rz: 460, top: 120, p: 1 }, { id: "F3", x: 1500, z: -3500, rx: 800, rz: 400, top: 60, p: 1 },
];
for (const b of BUMPS) { b.amp = b.top - R(b.z); if (b.ang != null) { b.sa = Math.sin(b.ang * DEG); b.ca = Math.cos(b.ang * DEG); } }
const bumpAt = (b, x, z) => {
  const dx = x - b.x, dz = z - b.z; let q;
  if (b.ang != null) { const al = dx * b.sa + dz * b.ca, ac = dx * b.ca - dz * b.sa; q = (al / b.rx) ** 2 + (ac / b.rz) ** 2; } else q = (dx / b.rx) ** 2 + (dz / b.rz) ** 2;
  return q > 30 ? 0 : b.amp * Math.exp(-Math.pow(q, b.p));
};
function H(x, z) {
  const w = sstep(-130, -200, z), z1 = z - Z0f(x) * w; let y = R(z1);
  for (const b of BUMPS) y += bumpAt(b, x, z);
  const cm = (1 - sstep(14, 40, Math.abs(x))) * (1 - sstep(-135, -175, z)) * (1 - sstep(30, 60, z));   // the hero street corridor: smooth, 1.5 m under the street deck
  const amp = 1.2 + 8 * sstep(-326, -290, y) * (1 - sstep(-60, -12, y)) + 10 * sstep(-2700, -3600, z) + 6 * sstep(-100, 0, y) * (1 - sstep(60, 200, y));
  y += (fbm(x / 90, z / 90, 3, 3) - 0.5) * 2 * amp * (1 - cm) - 1.5 * cm;
  return y;
}
// the two meshes (near field: x +-1100, z +600..-760, 40 x 48; far field: x +-2800, z -760..-5600, 48 x 56); columns graded toward the middle
const NEAR = { x0: -1100, x1: 1100, z0: 600, z1: -900, nx: 56, nz: 46, ex: 1.5, zseg: [[600, -130, 10], [-130, -480, 10], [-480, -900, 26]] }, FAR = { x0: -2800, x1: 2800, z0: -900, z1: -5600, nx: 48, nz: 56, ex: 1.3 };
function gridOf(G) {
  const xs = [], zs = [];
  for (let i = 0; i <= G.nx; i++) { const s = (i / G.nx) * 2 - 1; xs.push(Math.sign(s) * Math.pow(Math.abs(s), G.ex) * G.x1); }
  if (G.zseg) { zs.push(G.zseg[0][0]); for (const [a, b, n] of G.zseg) for (let k = 1; k <= n; k++) zs.push(lerp(a, b, k / n)); } else for (let j = 0; j <= G.nz; j++) zs.push(lerp(G.z0, G.z1, j / G.nz));
  const y = zs.map((z) => xs.map((x) => H(x, z)));
  return { ...G, xs, zs, y };
}
const lowerIdx = (a, v) => { let lo = 0, hi = a.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m] <= v) lo = m; else hi = m - 1; } return lo; };
function gridH(g, x, z) {   // bilinear on the grid's own (graded) lines
  const xc = clamp(x, g.xs[0], g.xs[g.nx]), zc = clamp(z, Math.min(g.zs[0], g.zs[g.nz]), Math.max(g.zs[0], g.zs[g.nz]));
  const i = lowerIdx(g.xs, xc), fx = (xc - g.xs[i]) / (g.xs[i + 1] - g.xs[i] || 1);
  let j = 0, hi = g.nz - 1; while (j < hi) { const m = (j + hi + 1) >> 1; if (g.zs[m] >= zc) j = m; else hi = m - 1; }
  const fz = (g.zs[j] - zc) / (g.zs[j] - g.zs[j + 1] || 1);
  return lerp(lerp(g.y[j][i], g.y[j][i + 1], fx), lerp(g.y[j + 1][i], g.y[j + 1][i + 1], fx), fz);
}

// ------------------------------------------------------------------------------------------------ triangle soup (flat normals; attributes aCol, aK, aUv; optional per-part transforms for the few things that move)
const pv = (a, b, c, d) => ({ pv: [a, b, c, d] });   // a per-vertex value for Soup.quad / tri
class Soup {
  constructor() { this.p = []; this.n = []; this.c = []; this.k = []; this.u = []; this.parts = []; }
  tri(A, B, C, col, k = [0, 0, 0], uv = [[0, 0], [0, 0], [0, 0]], nrm = null) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    let gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx; const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l;
    [A, B, C].forEach((q, i) => {
      this.p.push(q[0], q[1], q[2]); const nn = nrm ? (Array.isArray(nrm[0]) ? nrm[i] : nrm) : [gx, gy, gz]; this.n.push(nn[0], nn[1], nn[2]);
      const cc = col.pv ? col.pv[i] : col, kk = k.pv ? k.pv[i] : k, uu = uv[i]; this.c.push(cc[0], cc[1], cc[2]); this.k.push(kk[0], kk[1], kk[2]); this.u.push(uu[0], uu[1]);
    });
  }
  quad(A, B, C, D, col, k = [0, 0, 0], uv = [[0, 0], [1, 0], [1, 1], [0, 1]], nrm = null) {
    const sel = (v, idx) => (v && v.pv ? { pv: idx.map((i) => v.pv[i]) } : v);
    this.tri(A, B, C, sel(col, [0, 1, 2]), sel(k, [0, 1, 2]), [uv[0], uv[1], uv[2]], nrm);
    this.tri(A, C, D, sel(col, [0, 2, 3]), sel(k, [0, 2, 3]), [uv[0], uv[2], uv[3]], nrm);
  }
  get count() { return this.p.length / 9; }
  begin() { return { v0: this.p.length / 3 }; }
  end(pt) { pt.soup = this; pt.v1 = this.p.length / 3; pt.M = new THREE.Matrix4(); pt.nm = new THREE.Matrix3(); this.parts.push(pt); return pt; }
  geometry(dynamic) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(this.p), nor = new Float32Array(this.n);
    const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3);
    if (dynamic) { pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage); this.base = { p: new Float32Array(pos), n: new Float32Array(nor) }; this.live = { p: pos, n: nor }; this.pa = pa; this.na = na; }
    g.setAttribute("position", pa); g.setAttribute("normal", na); g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute("aK", new THREE.BufferAttribute(new Float32Array(this.k), 3)); g.setAttribute("aUv", new THREE.BufferAttribute(new Float32Array(this.u), 2));
    return g;
  }
  place(pt) {
    const m = pt.M.elements, bp = this.base.p, bn = this.base.n, lp = this.live.p, ln = this.live.n; pt.nm.getNormalMatrix(pt.M); const q = pt.nm.elements;
    for (let i = pt.v0; i < pt.v1; i++) {
      const o = i * 3, x = bp[o], y = bp[o + 1], z = bp[o + 2], nx = bn[o], ny = bn[o + 1], nz = bn[o + 2];
      lp[o] = m[0] * x + m[4] * y + m[8] * z + m[12]; lp[o + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; lp[o + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      const ax = q[0] * nx + q[3] * ny + q[6] * nz, ay = q[1] * nx + q[4] * ny + q[7] * nz, az = q[2] * nx + q[5] * ny + q[8] * nz, l = Math.hypot(ax, ay, az) || 1;
      ln[o] = ax / l; ln[o + 1] = ay / l; ln[o + 2] = az / l;
    }
  }
}

// ------------------------------------------------------------------------------------------------ the day, the night and the mist (every material reads the same uniforms)
const DAYK = lin("#FFC08A"), NIGHTK = lin("#2F3F70"), TWK = lin("#F0A066");   // DESIGN B3 dome keys at elevation 2 deg: the mist is the dome's colour there
function envAt(t) {
  const tt = Math.max(0, t), s = spin(tt), A = flicker(tt), al = alphaDeg(tt) * DEG, th = 55 * DEG * Math.cos(al);
  const L = [Math.sin(th), 0.45, Math.cos(th)], ll = Math.hypot(...L);
  const f = fract(psi(tt)), dSet = f - 0.5, dRise = f > 0.5 ? f - 1 : f, W = 0.22;
  let mode = 0, v = f < 0.5 ? 0 : 1;
  if (Math.abs(dSet) < W / 2) { mode = 1; v = 30 - 60 * ((dSet + W / 2) / W); } else if (Math.abs(dRise) < W / 2) { mode = 2; v = 30 - 60 * ((dRise + W / 2) / W); }
  const moon = moonAt(tt), me = moon.el * DEG, ma = moon.az * DEG;
  return { L: L.map((q) => q / ll), A, night: [mode, v, 0], dim: keys(s, [[15, 1], [16.5, 0.62], [18.5, 0.8]]), moonDir: [Math.sin(ma) * Math.cos(me), Math.sin(me), -Math.cos(ma) * Math.cos(me)], s };
}
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function makeU() {
  return { uLdir: { value: V3([0.3, 0.45, 0.85]) }, uA: { value: 1 }, uMistDay: { value: V3(DAYK) }, uMistNight: { value: V3(NIGHTK) }, uMistTw: { value: V3(TWK) }, uMistDim: { value: 1 }, uNight: { value: V3([0, 0, 0]) }, uSeaY: { value: -316 }, uT: { value: 0 }, uMoon: { value: V3([0, 0.3, -1]) } };
}
function setU(U, e, t) { U.uLdir.value.set(...e.L); U.uA.value = e.A; U.uMistDim.value = e.dim; U.uNight.value.set(...e.night); U.uSeaY.value = seaY(Math.max(0, t)); U.uT.value = t; U.uMoon.value.set(...e.moonDir); }
const GLC = `uniform vec3 uLdir; uniform float uA; uniform vec3 uMistDay; uniform vec3 uMistNight; uniform vec3 uMistTw; uniform float uMistDim; uniform vec3 uNight; uniform float uSeaY; uniform float uT; uniform vec3 uMoon;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  float nightAt(vec3 wp){ if (uNight.x < 0.5) return uNight.y; vec3 d = wp - cameraPosition; float az = degrees(atan(d.x, -d.z)); float n = smoothstep(0.0, 1.0, clamp((az - uNight.y) / 7.0 + 0.5, 0.0, 1.0)); return uNight.x < 1.5 ? n : 1.0 - n; }
  vec3 nightK(float N){ return mix(vec3(1.0), vec3(0.38, 0.46, 0.72), mix(0.45, N, uA)); }
  vec3 mistCol(float N){ return mix(uMistTw, mix(uMistDay, uMistNight, N), uA) * uMistDim; }
  float mistAmt(vec3 wp, float k){ float d = distance(wp, cameraPosition); return k * 0.55 * pow(clamp(d / 5200.0, 0.0, 1.3), 1.15); }
  vec3 toonLit(vec3 alb, vec3 n){ float nl = dot(n, uLdir); float b1 = smoothstep(0.14, 0.22, nl), b2 = smoothstep(0.54, 0.62, nl); float g = mix(mix(0.50, 0.76, b1), 1.0, b2);
    vec3 tint = mix(vec3(0.80, 0.90, 1.20), mix(vec3(1.0), vec3(1.08, 0.98, 0.86), b2), b1); return alb * g * tint; }`;
const SOLID_VS = `attribute vec3 aCol; attribute vec3 aK; attribute vec2 aUv; varying vec3 vC; varying vec3 vK; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
  void main(){ vC = aCol; vK = aK; vUv = aUv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FRAG_END = `
    float N = nightAt(vW); vec3 nk = nightK(N);`;
// terrain: vertex colour per facet, the valley field canvas and the city canvas by aK.x / aK.y, the foam front on the land at y_sea
const TERRAIN_FS = GLC + `uniform sampler2D uField; uniform sampler2D uCity; varying vec3 vC; varying vec3 vK; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    vec3 alb = vC;
    if (vK.x > 0.003) alb = mix(alb, texture2D(uField, vec2((vW.x + 2000.0) / 4000.0, (-600.0 - vW.z) / 2800.0)).rgb, vK.x);
    if (vK.y > 0.003) alb = mix(alb, texture2D(uCity, vec2((vW.x + 900.0) / 1800.0, (600.0 - vW.z) / 730.0)).rgb, vK.y);
    float nz = n2(vW.xz * 0.045) - 0.5, nz2 = n2(vW.xz * 0.21 + 7.0) - 0.5; alb *= 1.0 + 0.20 * nz + 0.08 * nz2;
    float dy = vW.y - uSeaY, fn = (n2(vW.xz * 0.30) - 0.5) * 2.6, fd = dy + fn;
    float lace = n2(vW.xz * 0.8 + 3.0), foam = smoothstep(-0.9, -0.3, fd) * (1.0 - smoothstep(0.5, 1.7, fd)) * (0.35 + 0.5 * lace), wet = smoothstep(1.2, 2.6, fd) * (1.0 - smoothstep(8.0, 10.0, dy));
    alb *= 1.0 - 0.22 * wet; alb = mix(alb, vec3(0.05, 0.16, 0.20), smoothstep(-0.5, -3.0, fd) * 0.5);
    float N = nightAt(vW); vec3 nk = nightK(N);
    vec3 col = toonLit(alb, n) * nk;
    vec3 foamC = mix(vec3(0.70, 0.78, 0.86), vec3(0.90, 0.95, 0.93), smoothstep(0.1, 0.6, dot(n, uLdir))) * max(nk, vec3(0.55));
    col = mix(col, foamC, foam);
    col = mix(col, mistCol(N), mistAmt(vW, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
// plain solids (churches, volcano, trees' trunks, pieces): vertex colour, toon bands, snow weight in aK.x (the volcano's snow is lit warm / cool by the band)
const PLAIN_FS = GLC + `varying vec3 vC; varying vec3 vK; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float N = nightAt(vW); vec3 nk = nightK(N);
    float nl = dot(n, uLdir); float b1 = smoothstep(0.14, 0.22, nl), b2 = smoothstep(0.54, 0.62, nl);
    vec3 col = toonLit(vC, n);
    if (vK.x > 0.0) { vec3 sn = mix(mix(vec3(0.43, 0.49, 0.66), vec3(0.78, 0.82, 0.92), b1), vec3(1.0, 0.80, 0.62), b2); col = mix(col, sn * (0.92 + 0.08 * h21(vW.xz * 0.2)), vK.x); }
    col *= nk;
    col = mix(col, mistCol(N), mistAmt(vW, vK.y > 0.5 ? 0.6 : 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
// houses: procedural facade (bays, shuttered windows, doors, cornice, balconies, base band, night lights) and clay tile roof (courses, mossy tiles, ridge row)
// aK = (kind 0 wall / 1 roof / 2 gable end, seed, top v); aUv = (metres along, metres up from the house base)
const HOUSE_FS = GLC + `varying vec3 vC; varying vec3 vK; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float N = nightAt(vW); vec3 nk = nightK(N);
    float d = distance(vW, cameraPosition), wf = 1.0 - smoothstep(180.0, 900.0, d), seed = vK.y, glow = 0.0; vec3 lightC = vec3(1.0, 0.79, 0.51);
    vec3 alb = vC;
    float lightsOn = max(smoothstep(0.42, 0.58, mix(0.45, N, uA)), step(uA, 0.5) * 0.8);
    if (vK.x < 0.5) {            // wall
      float u = vUv.x, v = vUv.y, top = vK.z;
      float bw = 3.2 + 0.9 * fract(seed * 7.13), cx = floor(u / bw), fx = fract(u / bw) - 0.5, fl = floor(max(v, 0.0) / 3.0), fy = fract(max(v, 0.0) / 3.0);
      float plaster = (n2(vec2(u, v) * 0.7 + seed * 40.0) - 0.5) * 0.10; alb *= 1.0 + plaster * wf;
      float inWall = step(0.0, v) * step(v, top - 0.45);
      float door = step(fl, 0.5) * step(mod(cx + floor(seed * 5.0), 4.0), 0.5);
      float wx = abs(fx), shut = step(wx, 0.27) * step(0.24, fy) * step(fy, 0.86), glass = step(wx, 0.15) * step(0.30, fy) * step(fy, 0.80);
      float doorShape = step(wx, 0.22) * step(fy, 0.72) * step(fy, 0.60 + 0.12 * sqrt(max(0.0, 1.0 - (wx / 0.22) * (wx / 0.22))));
      vec3 shutC = mix(vec3(0.17, 0.28, 0.30), mix(vec3(0.36, 0.23, 0.17), vec3(0.20, 0.31, 0.42), step(0.5, fract(seed * 3.7))), step(0.33, fract(seed * 5.3)));
      float lit = step(h21(vec2(cx, fl) + seed * 91.0), 0.34);
      vec3 wcol = alb;
      float sur = step(wx, 0.285) * step(0.225, fy) * step(fy, 0.875) * (1.0 - shut);
      wcol = mix(wcol, vec3(0.95, 0.92, 0.84), sur * wf);
      wcol = mix(wcol, shutC, shut * wf * (1.0 - door * doorShape));
      wcol = mix(wcol, vec3(0.10, 0.12, 0.16), glass * wf * (1.0 - door));
      float bal = step(0.5, fract(seed * 11.3)) * step(1.0, fl) * step(wx, 0.38) * step(fy, 0.30) * step(0.22, fy);
      wcol = mix(wcol, vec3(0.08, 0.07, 0.08), bal * wf);
      wcol = mix(wcol, mix(vec3(0.82, 0.21, 0.48), vec3(0.85, 0.26, 0.18), step(0.5, h21(vec2(cx, seed)))), bal * step(0.6, h21(vec2(floor(u * 2.0), fl))) * step(0.255, fy) * wf);
      wcol = mix(wcol, vec3(0.37, 0.23, 0.17), door * doorShape * step(wx, 0.22) * wf);
      float base = 1.0 - 0.18 * step(v, 1.0) * wf; wcol *= base;
      wcol = mix(wcol, vec3(0.95, 0.93, 0.88), step(top - 0.45, v) * step(v, top - 0.1) * 0.55);
      float winL = (glass * (1.0 - door) + door * doorShape * 0.0) * lit * wf * inWall;
      alb = wcol; glow = winL;
      float farLit = lit * 0.22 * (1.0 - wf) * 0.34 * 2.2; glow = max(glow, farLit * step(0.5, inWall));
      glow *= lightsOn; lightC = mix(lightC, mix(vec3(1.0, 0.89, 0.66), vec3(0.95, 0.64, 0.37), step(0.5, h21(vec2(cx + 3.0, fl)))), step(0.5, h21(vec2(fl, cx))));
    } else if (vK.x < 1.5) {     // roof
      float u = vUv.x, v = vUv.y, row = floor(v / 0.32), fy = fract(v / 0.32), cu = floor(u / 0.24 + 0.5 * mod(row, 2.0)), tr = h21(vec2(cu, row) + seed * 13.0), mo = h21(vec2(cu, row) + 61.0);
      vec3 rc = alb * (0.88 + 0.24 * tr);
      rc = mix(rc, vec3(0.43, 0.48, 0.31), step(mo, 0.06) * 0.7);
      rc *= 0.80 + 0.20 * smoothstep(0.0, 0.40, fy) * (1.0 - 0.4 * smoothstep(0.85, 1.0, fy));
      rc = mix(rc, rc * 1.22, step(vK.z - 0.36, v));
      alb = mix(alb, rc, wf);
    }
    vec3 col = toonLit(alb, n) * nk;
    col = mix(col, lightC, clamp(glow, 0.0, 1.0));
    col = mix(col, mistCol(N), mistAmt(vW, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
function solidMat(U, kind, extra = {}) {
  const fs = kind === "terrain" ? TERRAIN_FS : kind === "house" ? HOUSE_FS : PLAIN_FS;
  return noLine(new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: SOLID_VS, fragmentShader: fs, side: THREE.DoubleSide, fog: false }));
}

// ------------------------------------------------------------------------------------------------ the world (built once per page, shared by sandes / ssea)
const CEN = { cx: 0, cz: 210, th: 9 * DEG, pitch: 92, nu: 9, nv: 6 };   // CENTRO's colonial grid, turned 9 deg
const gridToWorld = (u, v) => [CEN.cx + u * Math.cos(CEN.th) + v * Math.sin(CEN.th), CEN.cz - u * Math.sin(CEN.th) + v * Math.cos(CEN.th)];
const worldToGrid = (x, z) => { const dx = x - CEN.cx, dz = z - CEN.cz; return [dx * Math.cos(CEN.th) - dz * Math.sin(CEN.th), dx * Math.sin(CEN.th) + dz * Math.cos(CEN.th)]; };
const PLAZAS = [[4, 2], [5, 2], [2, 4]];
const inCorridor = (x, z, m = 0) => Math.abs(x) < 17 + m && z > -137 - m && z < 48 + m;
const WALLC = [["#F2ECDD", 38], ["#EBD9A8", 14], ["#E2B24A", 12], ["#E59A84", 11], ["#8FB5D6", 8], ["#A9CDB0", 7], ["#C8654A", 6], ["#B79CC9", 4]];
const ROOFC = [["#B5543A", 34], ["#C76A45", 26], ["#A64B36", 18], ["#D08455", 14], ["#8E6A58", 8]];
const pickW = (list, r) => { let s = r * 100; for (const [c, w] of list) { if ((s -= w) <= 0) return lin(c); } return lin(list[0][0]); };
const CHURCH = { CH1: [-95, -660], CH2: [26, 131], CH3: [46, 180], CH4: [858, -1250] };   // (x, z); y from the ground

const facetCols = { grass1: lin("#6E9A4A"), grass2: lin("#8DB255"), scrub1: lin("#5E8A44"), scrub2: lin("#4E6B3A"), bank: lin("#A88F6A"), paramo: lin("#7A8450"), earth: lin("#A89B84") };
function facetColor(x, z, y, slopeDeg) {
  const nzz = vnoise(x / 60, z / 60, 11), nz2 = vnoise(x / 23 + 4, z / 23, 12), jit = 0.94 + 0.12 * nz2;
  let base;
  if (y < -235 && slopeDeg < 24) base = mixc(facetCols.grass1, facetCols.grass2, nzz);
  else base = mixc(facetCols.scrub1, facetCols.scrub2, clamp(nzz * 1.2 - 0.1 + slopeDeg / 120));
  const par = Math.max(sstep(-2700, -3300, z) * 0.9, sstep(50, 110, y) * 0.8);
  if (par > 0) base = mixc(base, facetCols.paramo, par * (0.6 + 0.4 * nzz));
  base = mixc(base, facetCols.bank, sstep(34, 46, slopeDeg));
  let fld = 0, city = 0;
  if (x > -2000 && x < 2000 && z < -600 && z > -3400 && y < -100) fld = sstep(24, 12, slopeDeg) * sstep(-2000, -1900, x) * sstep(2000, 1900, x) * sstep(-3400, -3300, z) * sstep(-600, -640, z);
  if (z > -132 && z < 600) { const [u, v] = worldToGrid(x, z); city = (1 - sstep(414, 446, Math.abs(u))) * (1 - sstep(276, 310, Math.abs(v))) * (1 - sstep(24, 38, slopeDeg)); }
  return { col: scl(base, jit), fld, city };
}
function buildTerrainSoup() {
  const gN = gridOf(NEAR), gF = gridOf(FAR), S = new Soup();
  for (const g of [gN, gF]) {
    for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) {
      const P = (jj, ii) => [g.xs[ii], g.y[jj][ii], g.zs[jj]], a = P(j, i), b = P(j, i + 1), c = P(j + 1, i + 1), d = P(j + 1, i);
      const tris = (i + j) & 1 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const [A, B, C] of tris) {
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
        const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx, l = Math.hypot(gx, gy, gz) || 1, slope = Math.acos(clamp(Math.abs(gy) / l)) / DEG;
        const cx = (A[0] + B[0] + C[0]) / 3, cz = (A[2] + B[2] + C[2]) / 3, cy = (A[1] + B[1] + C[1]) / 3, f = facetColor(cx, cz, cy, slope);
        S.tri(A, B, C, f.col, [f.fld, f.city, 0]);
      }
    }
  }
  const skirt = (g, row) => { for (let i = 0; i < g.nx; i++) { const a = [g.xs[i], g.y[row][i], g.zs[row]], b = [g.xs[i + 1], g.y[row][i + 1], g.zs[row]]; S.quad(a, b, [b[0], b[1] - 70, b[2]], [a[0], a[1] - 70, a[2]], facetCols.scrub2, [0, 0, 0]); } };
  skirt(gN, gN.nz); skirt(gF, 0);
  return { S, gN, gF };
}
const Hm = (W, x, z) => (z > -900 ? gridH(W.gN, x, z) : gridH(W.gF, x, z));

// ---- the two ground canvases: the valley's fields (x +-2000, z -600..-3400) and CENTRO's streets (x +-900, z +600..-130)
function fieldCanvas() {
  return cv2(2048, 2048, (q, W, Hh) => {
    const sx = W / 4000, sz = Hh / 2800, X = (x) => (x + 2000) * sx, Z = (z) => (-600 - z) * sz, Rg = rngOf(SEED + 41);
    q.fillStyle = "#6E9A4A"; q.fillRect(0, 0, W, Hh);
    const FC = ["#6E9A4A", "#8DB255", "#B9C46A", "#A88F4E", "#5E8A44"];
    for (let i = 0; i < 140; i++) {   // field polygons, long sides along the valley (z), skewed
      const cx = -1700 + 3400 * Rg(), cz = -650 - 2650 * Rg(), w = 40 + 120 * Rg(), l = 70 + 160 * Rg(), sk = (Rg() - 0.5) * 0.5, an = (Rg() - 0.5) * 0.5;
      const pts = [[-w / 2, -l / 2], [w / 2, -l / 2 + sk * l * 0.2], [w / 2 + sk * 20, l / 2], [-w / 2, l / 2 - sk * l * 0.2], [-w / 2 - 8 * Rg(), 0]].map(([a, b]) => [cx + a * Math.cos(an) - b * Math.sin(an), cz + a * Math.sin(an) + b * Math.cos(an)]);
      q.fillStyle = FC[(Rg() * FC.length) | 0]; q.beginPath(); pts.forEach(([x, z], k) => (k ? q.lineTo(X(x), Z(z)) : q.moveTo(X(x), Z(z)))); q.closePath(); q.fill();
      if (Rg() < 0.6) { q.strokeStyle = "#3F5F34"; q.lineWidth = 1.3; q.stroke(); }
      if (Rg() < 0.5) { q.strokeStyle = "rgba(255,255,255,0.10)"; q.lineWidth = 1; for (let k = 1; k < 5; k++) { const f = k / 5; q.beginPath(); q.moveTo(X(lerp(pts[0][0], pts[1][0], f)), Z(lerp(pts[0][1], pts[1][1], f))); q.lineTo(X(lerp(pts[3][0], pts[2][0], f)), Z(lerp(pts[3][1], pts[2][1], f))); q.stroke(); } }
    }
    q.strokeStyle = "#C9B48A"; q.lineWidth = 2;   // 11 tracks
    for (let i = 0; i < 11; i++) { let x = -1800 + 3600 * Rg(), z = -620 - 300 * Rg(); q.beginPath(); q.moveTo(X(x), Z(z)); for (let k = 0; k < 9; k++) { x += (Rg() - 0.5) * 240; z -= 260 + 120 * Rg(); q.lineTo(X(x), Z(z)); } q.stroke(); }
    q.strokeStyle = "#7FA9C9"; q.lineWidth = 14 * sx; q.lineJoin = "round"; q.beginPath();   // the river: 14 m, 9 bends
    for (let z = -600; z >= -3400; z -= 20) { const x = -150 + 190 * Math.sin((z + 600) / 330) + 60 * Math.sin((z + 600) / 97 + 1); z === -600 ? q.moveTo(X(x), Z(z)) : q.lineTo(X(x), Z(z)); }
    q.stroke();
    // VALLE: the football pitch on the terrace's low edge, 90 x 45 m, painted
    q.save(); q.fillStyle = "#79B04E"; q.fillRect(X(765), Z(-1385), 90 * sx, 45 * sz); q.strokeStyle = "#F4F8F6"; q.lineWidth = 1.2; q.strokeRect(X(766.5), Z(-1383.5), 87 * sx, 42 * sz);
    q.beginPath(); q.moveTo(X(810), Z(-1383.5)); q.lineTo(X(810), Z(-1341.5)); q.stroke(); q.beginPath(); q.arc(X(810), Z(-1362.5), 6 * sx, 0, TAU); q.stroke(); q.restore();
  });
}
function cityCanvas() {
  return cv2(2048, 1024, (q, W, Hh) => {
    const sx = W / 1800, sz = Hh / 730, Rg = rngOf(SEED + 43);
    q.fillStyle = "#A89B84"; q.fillRect(0, 0, W, Hh);
    q.setTransform(sx, 0, 0, -sz, 900 * sx, 600 * sz);
    q.fillStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 900; i++) q.fillRect(-900 + 1800 * Rg(), -130 + 730 * Rg(), 3 + 8 * Rg(), 1.2);   // cobble flecks
    const c = Math.cos(CEN.th), s = Math.sin(CEN.th);
    for (let bi = 0; bi < CEN.nu; bi++) for (let bj = 0; bj < CEN.nv; bj++) {
      const [x, z] = gridToWorld((bi - 4) * CEN.pitch, (bj - 2.5) * CEN.pitch), plaza = PLAZAS.some(([a, b]) => a === bi && b === bj);
      q.save(); q.transform(c, -s, s, c, x, z);
      q.fillStyle = plaza ? "#6E9A4A" : "#8F7F6A"; q.fillRect(-42, -42, 84, 84);
      if (plaza) {
        q.strokeStyle = "#D8C9A6"; q.lineWidth = 4; q.beginPath(); q.moveTo(-42, -42); q.lineTo(42, 42); q.moveTo(42, -42); q.lineTo(-42, 42); q.moveTo(0, -42); q.lineTo(0, 42); q.moveTo(-42, 0); q.lineTo(42, 0); q.stroke();
        q.fillStyle = "#D8C9A6"; q.beginPath(); q.arc(0, 0, 9, 0, TAU); q.fill(); q.fillStyle = "#7FA9C9"; q.beginPath(); q.arc(0, 0, 5.5, 0, TAU); q.fill();
        for (let k = 0; k < 26; k++) { q.fillStyle = k % 3 ? "#4E7F3F" : "#5E8A44"; q.beginPath(); q.arc(-38 + 76 * Rg(), -38 + 76 * Rg(), 2 + 2.2 * Rg(), 0, TAU); q.fill(); }
      } else {
        const g = Rg() < 0.5; q.fillStyle = g ? "#6E9A4A" : "#C6A57A"; q.fillRect(-27, -27, 54, 54);
        q.strokeStyle = g ? "#8DB255" : "#B08E64"; q.lineWidth = 1; q.strokeRect(-24, -24, 48, 48); if (!g) { q.fillStyle = "#7FA9C9"; q.beginPath(); q.arc(0, 0, 2.2, 0, TAU); q.fill(); }
        const nt = (Rg() * 3) | 0; for (let k = 0; k < nt; k++) { q.fillStyle = "#4E7F3F"; q.beginPath(); q.arc(-18 + 36 * Rg(), -18 + 36 * Rg(), 3.2 + 1.6 * Rg(), 0, TAU); q.fill(); }
      }
      q.restore();
    }
  });
}
function seaHeightTex(W) {   // half-float terrain height (m) over x +-2800, z +100..-5700: the sea shader's depth
  const NX = 448, NZ = 560, data = new Uint16Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) data[j * NX + i] = THREE.DataUtils.toHalfFloat(Hm(W, -2800 + ((i + 0.5) / NX) * 5600, 100 - ((j + 0.5) / NZ) * 5800));
  const t = new THREE.DataTexture(data, NX, NZ, THREE.RedFormat, THREE.HalfFloatType); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t;
}

// ---- houses: records first (placement), geometry after
function genHouses(W) {
  const out = [], occ = new Set(), key = (i, j) => i * 100003 + j, CELL = 8;
  const mark = (x, z, r) => { for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) occ.add(key(i, j)); };
  const taken = (x, z, r) => { for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) if (occ.has(key(i, j))) return true; return false; };
  W.occ = { mark, taken };
  mark(CHURCH.CH1[0], CHURCH.CH1[1], 46); mark(CHURCH.CH2[0], CHURCH.CH2[1], 30); mark(CHURCH.CH3[0], CHURCH.CH3[1], 24); mark(CHURCH.CH4[0], CHURCH.CH4[1], 24);
  const Rr = rngOf(SEED + 500);
  const mk = (o) => {   // o: x z w d rot fl zone ; sets baseY, colours, seed, roof type
    if (o.w < o.d) { [o.w, o.d] = [o.d, o.w]; o.rot += Math.PI / 2; }
    const c = Math.cos(o.rot), s = Math.sin(o.rot); let lo = 1e9, hi = -1e9;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) { const y = Hm(W, o.x + (a * o.w / 2) * c + (b * o.d / 2) * s, o.z - (a * o.w / 2) * s + (b * o.d / 2) * c); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    o.lo = lo; o.baseY = Math.min(Math.max(lo, hi - 0.8), lo + 4.5); o.rise = hi - lo; o.seed = hash(Math.round(o.x * 10), Math.round(o.z * 10), 3); o.col = o.col ?? pickW(WALLC, hash(Math.round(o.x), Math.round(o.z), 1)); o.rcol = o.rcol ?? pickW(ROOFC, hash(Math.round(o.x), Math.round(o.z), 2));
    o.hip = o.hip ?? (o.w < 15 && hash(Math.round(o.x), Math.round(o.z), 4) < 0.45); o.eave = o.baseY + 3 * o.fl; out.push(o); return o;
  };
  const free = (o, r) => !inCorridor(o.x, o.z, 4) && !taken(o.x, o.z, r ?? Math.min(o.w, 12) * 0.5);
  W.mkHouse = mk;
  // CENTRO: 380, a ring of wall-to-wall rows round each patio; 3 blocks are plazas
  let nC = 0;
  for (let bi = 0; bi < CEN.nu; bi++) for (let bj = 0; bj < CEN.nv; bj++) {
    if (PLAZAS.some(([a, b]) => a === bi && b === bj)) continue;
    const u0 = (bi - 4) * CEN.pitch, v0 = (bj - 2.5) * CEN.pitch, [bx, bz] = gridToWorld(u0, v0);
    if (inCorridor(bx, bz, 52)) continue;
    const D = 15, sides = [["N", -1, 84, 0], ["S", 1, 84, 0], ["W", -1, 54, 1], ["E", 1, 54, 1]];
    for (const [nm, sg, len, ver] of sides) {
      const nseg = len > 60 ? 2 + (hash(bi, bj, nm.charCodeAt(0)) < 0.5 ? 1 : 0) : 1 + (hash(bi, bj, nm.charCodeAt(0) + 9) < 0.5 ? 1 : 0);
      const cuts = [0]; for (let k = 1; k < nseg; k++) cuts.push(len * (k / nseg) + (hash(bi, bj, k + nm.charCodeAt(0)) - 0.5) * len * 0.18); cuts.push(len);
      for (let k = 0; k < nseg; k++) {
        const a = cuts[k], b = cuts[k + 1], mid = (a + b) / 2 - len / 2, w = b - a, dd = D + (hash(bi, bj, k + 40) - 0.5) * 3;
        const [wx, wz] = ver ? gridToWorld(u0 + sg * (42 - D / 2), v0 + mid) : gridToWorld(u0 + mid, v0 + sg * (42 - D / 2));
        if (inCorridor(wx, wz, 2) || taken(wx, wz, 5)) continue;
        const fl = 1 + Math.floor(hash(bi * 7 + k, bj, nm.charCodeAt(0)) * 3), o = mk({ x: wx, z: wz, w: w - 1.2, d: dd, rot: CEN.th + (ver ? Math.PI / 2 : 0), fl, zone: "C", hip: false });
        nC++; mark(wx, wz, 3);
      }
    }
  }
  // a house run along a contour polyline (pts: {x,z,ox,oz} with the outward (downhill) direction)
  const placeAlong = (pts, cfg, R_) => {
    let n = 0; const seg = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z); seg.push([tot, l, i]); tot += l; }
    let s = cfg.s0 ?? R_() * 6, count = 0;
    while (s < tot && count < (cfg.max ?? 99)) {
      const w = lerp(cfg.w[0], cfg.w[1], R_()), d = lerp(cfg.d[0], cfg.d[1], R_()); let sg = seg.find((q) => s >= q[0] && s <= q[0] + q[1]); if (!sg) break;
      const p0 = pts[sg[2]], p1 = pts[sg[2] + 1], f = (s + w / 2 - sg[0]) / (sg[1] || 1), px = lerp(p0.x, p1.x, clamp(f)), pz = lerp(p0.z, p1.z, clamp(f)), ox = lerp(p0.ox, p1.ox, clamp(f)), oz = lerp(p0.oz, p1.oz, clamp(f)), ol = Math.hypot(ox, oz) || 1;
      const tx = -oz / ol, tz = ox / ol, hx = px - (ox / ol) * (d / 2 + 0.8), hz = pz - (oz / ol) * (d / 2 + 0.8), rot = Math.atan2(-tz, tx);
      s += w + lerp(cfg.gap[0], cfg.gap[1], R_());
      if (cfg.skip && cfg.skip(hx, hz)) continue;
      const slope = Math.abs(Hm(W, hx + ox / ol * 6, hz + oz / ol * 6) - Hm(W, hx - ox / ol * 6, hz - oz / ol * 6)) / 12; if (cfg.slope && slope > 1.4 && d * slope > 12) continue;
      if (slope > (cfg.slope ?? 1.1) || inCorridor(hx, hz, 4) || taken(hx, hz, Math.min(w, d) * 0.55)) continue;
      mk({ x: hx, z: hz, w, d, rot, fl: 1 + Math.floor(R_() * (cfg.fl ?? 3)), zone: cfg.zone }); mark(hx, hz, Math.max(w, d) * 0.5); n++; count++;
    }
    return n;
  };
  const rays = (cx, cz, a0, a1, lev, r0, rMax, nr) => {
    const pts = []; for (let k = 0; k <= nr; k++) { const a = lerp(a0, a1, k / nr), dx = Math.sin(a), dz = Math.cos(a); let r = r0, ok = false; for (; r < rMax; r += 2) if (Hm(W, cx + dx * r, cz + dz * r) < lev) { ok = true; break; } if (ok) pts.push({ x: cx + dx * r, z: cz + dz * r, ox: dx, oz: dz }); }
    return pts;
  };
  const countZone = (z) => out.filter((h) => h.zone === z).length;
  // LOMA: 140 on the south and east flanks, rows on contours 12 m apart, 5 stair alleys left open
  { const R_ = rngOf(SEED + 510), cx = -95, cz = -660, alleys = [0.15, 0.55, 0.95, 1.35, 1.75].map((a) => a * 0.9 - 0.1);
    const skipAl = (x, z) => { const a = Math.atan2(x - cx, z - cz); return alleys.some((q) => Math.abs(a - q) < 0.022 * (60 / Math.max(30, Math.hypot(x - cx, z - cz)) + 0.6)); };
    for (let lev = 2, g = 0; lev > -312 && countZone("L") < 140 && g < 60; g++) {
      const pts = rays(cx, cz, -0.75, 2.4, lev, 20, 420, 110); let sl = 0;
      if (pts.length > 2) { placeAlong(pts, { w: [8, 12], d: [8, 10], gap: [0.8, 2.4], zone: "L", skip: skipAl, max: 140 - countZone("L"), fl: 2, slope: 2.3 }, R_); for (const q of pts) sl += Math.abs(Hm(W, q.x + q.ox * 5, q.z + q.oz * 5) - Hm(W, q.x - q.ox * 5, q.z - q.oz * 5)) / 10; sl /= pts.length; }
      lev -= Math.max(12, Math.min(40, 11 * sl));   // contour rows 12 m apart in height; on the steep flanks the next row waits for a house depth of ground
    }
    // the rest of the 140: terraces on the south and east shoulders where the ground lets a house stand (aligned to the contour)
    for (let g = 0; countZone("L") < 140 && g < 9000; g++) {
      const a = lerp(-0.8, 2.5, R_()), r = lerp(90, 330, R_()), x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r, gx = Hm(W, x + 6, z) - Hm(W, x - 6, z), gz = Hm(W, x, z + 6) - Hm(W, x, z - 6), sl = Math.hypot(gx, gz) / 12;
      if (sl > 1.15 || Hm(W, x, z) < -296 || inCorridor(x, z, 6) || taken(x, z, 7)) continue;
      mk({ x, z, w: lerp(8, 12, R_()), d: lerp(8, 10, R_()), rot: Math.atan2(-gx, -gz), fl: 1 + Math.floor(R_() * 2), zone: "L" }); mark(x, z, 8);
    } }
  // LADERA: 90 on the slope z -150..-420, rows every 14 m of height, 6-10 a row, never on the street axis
  { const R_ = rngOf(SEED + 520);
    for (let lev = -48, g = 0; lev > -300 && countZone("D") < 90 && g < 30; lev -= 14, g++) {
      const pts = []; for (let x = -380; x <= 380; x += 5) { let z = -126, ok = false; for (; z > -440; z -= 2) if (Hm(W, x, z) < lev) { ok = true; break; } if (ok && z > -430) pts.push({ x, z, ox: 0, oz: -1 }); }
      if (pts.length < 6) continue; const nrun = 6 + Math.floor(R_() * 5), s0 = R_() * Math.max(1, (pts.length * 5) - nrun * 14);
      placeAlong(pts, { w: [8, 12], d: [8, 10], gap: [1.5, 4], zone: "D", s0, max: Math.min(nrun, 90 - countZone("D")), fl: 2, skip: (x) => Math.abs(x) < 17 }, R_);
    } }
  // OESTE: 40, loose rows with fields between
  { const R_ = rngOf(SEED + 530);
    for (let lev = -72, g = 0; lev > -300 && countZone("O") < 40 && g < 20; lev -= 16, g++) { const pts = rays(-640, -420, 0, TAU, lev, 10, 330, 90); if (pts.length > 3) placeAlong(pts, { w: [8, 12], d: [8, 10], gap: [8, 24], zone: "O", max: Math.min(8, 40 - countZone("O")), fl: 2, s0: R_() * 60 }, R_); } }
  // farms: 3 on ESTE (yard walls) and 9 on the ridges
  W.farms = [];
  [[505, -560], [610, -640], [585, -515]].forEach(([x, z], i) => { const o = mk({ x, z, w: 11, d: 9, rot: (hash(i, 7) - 0.5) * 0.8, fl: 1, zone: "F", hip: false }); W.farms.push(o); mark(x, z, 20); });
  BUMPS.filter((b) => /^R\d/.test(b.id)).forEach((b, bi) => { const n = bi === 2 ? 1 : 2; for (let k = 0; k < n; k++) { const al = (k ? 1 : -1) * b.rx * (0.25 + 0.4 * hash(bi, k, 9)), x = b.x + al * b.sa + (hash(bi, k, 5) - 0.5) * 30, z = b.z + al * b.ca; const o = mk({ x, z, w: 10, d: 8, rot: (hash(bi, k, 6) - 0.5) * 1.2, fl: 1, zone: "F", hip: false }); W.farms.push(o); mark(x, z, 22); } });
  // VALLE: 96 houses in 14 blocks round a 60 x 50 m plaza; CH4 on the east side
  { const R_ = rngOf(SEED + 540), P0 = [810, -1250], pitchU = 46, pitchV = 42, tmp = [];
    for (let bi = -2; bi <= 2; bi++) for (let bj = -1; bj <= 1; bj++) {
      if (bi === 0 && bj === 0) continue; const cx = P0[0] + bi * pitchU + (bi > 0 ? 8 : 0), cz = P0[1] + bj * pitchV; if (bi === 1 && bj === 0) continue;
      const nh = 7; const pos = [[-14, -12, 0], [2, -12, 0], [-14, 12, 0], [2, 12, 0], [-17, 0, 1], [17, 0, 1], [14, -12, 0], [14, 12, 0]].slice(0, nh);
      for (const [a, b, ver] of pos) tmp.push({ x: cx + a * (ver ? 1 : 1), z: cz + b * 0.95, w: ver ? 9 + R_() * 3 : 11 + R_() * 4, d: 10 + R_() * 3, rot: ver ? Math.PI / 2 : 0, fl: 1 + Math.floor(R_() * 2) });
    }
    tmp.push({ x: 880, z: -1228, w: 10, d: 11, rot: 0.1, fl: 1 }, { x: 880, z: -1272, w: 10, d: 11, rot: -0.1, fl: 2 }, { x: 735, z: -1300, w: 12, d: 10, rot: 0, fl: 2 }, { x: 735, z: -1200, w: 11, d: 10, rot: 0, fl: 1 }, { x: 790, z: -1300, w: 12, d: 10, rot: 0, fl: 2 });
    for (const o of tmp) { if (countZone("V") >= 96) break; if (Math.abs(o.x - 810) < 36 && Math.abs(o.z - -1250) < 31 + o.d / 2) continue; if (Math.abs(o.x - 858) < 20 && Math.abs(o.z - -1250) < 26) continue; o.zone = "V"; mk({ ...o, hip: false }); mark(o.x, o.z, 5); }
    for (let g = 0; countZone("V") < 96 && g < 600; g++) { const x = 700 + 220 * R_(), z = -1330 + 170 * R_(); if (Math.abs(x - 810) < 40 && Math.abs(z + 1250) < 35) continue; if (taken(x, z, 6)) continue; mk({ x, z, w: 10, d: 9, rot: 0, fl: 1 + Math.floor(R_() * 2), zone: "V", hip: false }); mark(x, z, 6); }
    // the 18 that lose their roof: the ones nearest the surge side (north), seeded
    const vs = out.filter((h) => h.zone === "V"); vs.sort((a, b) => a.z - b.z + (hash(a.x, a.z) - 0.5) * 60); vs.slice(0, 18).forEach((h) => { h.loose = true; });
  }
  W.houses = out; return out;
}

// ---- house geometry
function addHouse(S, h, roofS, partsOut) {
  const { x, z, w, d, rot, fl, baseY, col, rcol, seed, hip, loose } = h, c = Math.cos(rot), s = Math.sin(rot);
  const loc = (u, v, y) => [x + u * c + v * s, y, z - u * s + v * c], hw = w / 2, hd = d / 2, yb = h.lo - 1.6, top = baseY + 3 * fl, vTop = 3 * fl;
  const cs = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
  for (let i = 0; i < 4; i++) {
    const A = cs[i], B = cs[(i + 1) % 4], L = Math.hypot(B[0] - A[0], B[1] - A[1]), u0 = Math.floor(hash(Math.round(x), Math.round(z), i) * 3) * 1.1;
    S.quad(loc(A[0], A[1], yb), loc(B[0], B[1], yb), loc(B[0], B[1], top), loc(A[0], A[1], top), col, [0, seed, vTop], [[u0, yb - baseY], [u0 + L, yb - baseY], [u0 + L, vTop], [u0, vTop]]);
  }
  const ov = 0.6, hdE = hd + ov, pitch = Math.tan((24 + 6 * hash(Math.round(x), Math.round(z), 8)) * DEG), rise = hdE * pitch, yE = top - 0.25, yR = yE + rise, slope = Math.hypot(hdE, rise);
  const R = loose ? roofS : S;
  if (loose) S.quad(loc(-hw, -hd, top - 0.3), loc(hw, -hd, top - 0.3), loc(hw, hd, top - 0.3), loc(-hw, hd, top - 0.3), lin("#4A3428"), [2, seed, 0]);
  const pt = loose ? R.begin() : null, rk = [1, seed, slope], uw = w + 2 * ov;
  if (!hip) {
    for (const sg of [-1, 1]) R.quad(loc(-hw - ov, sg * hdE, yE), loc(hw + ov, sg * hdE, yE), loc(hw + ov, 0, yR), loc(-hw - ov, 0, yR), rcol, rk, [[0, 0], [uw, 0], [uw, slope], [0, slope]]);
    for (const sg of [-1, 1]) S.tri(loc(sg * hw, -hd, top), loc(sg * hw, hd, top), loc(sg * hw, 0, top + hd * pitch), col, [2, seed, 0], [[0, 0], [1, 0], [0.5, 1]]);
  } else {
    const rl = Math.max(0, hw - hd * 0.9);
    for (const sg of [-1, 1]) R.quad(loc(-hw - ov, sg * hdE, yE), loc(hw + ov, sg * hdE, yE), loc(rl, 0, yR), loc(-rl, 0, yR), rcol, rk, [[0, 0], [uw, 0], [uw - slope * 0.6, slope], [slope * 0.6, slope]]);
    for (const sg of [-1, 1]) R.tri(loc(sg * (hw + ov), -hdE, yE), loc(sg * (hw + ov), hdE, yE), loc(sg * rl, 0, yR), rcol, rk, [[0, 0], [2 * hdE, 0], [hdE, slope]]);
  }
  if (loose) { R.end(pt); pt.h = h; pt.piv = [x, top, z]; partsOut.push(pt); }
}

// ---- trees: 780 crossed cards (alpha-cut silhouettes) in clumps; 14 palms (9 fronds) on the plazas; VALLE's 28 round crowns are 60-triangle blobs
function treeAtlas() {
  return once("treeAtlas", () => {
    const c = cv2(1024, 1024, (q) => {
      for (let id = 0; id < 5; id++) {
        const ox = (id % 3) * 341, oy = Math.floor(id / 3) * 512, R_ = rngOf(SEED + 70 + id), cx = ox + 170;
        const blob = (x, y, r, col) => { q.fillStyle = col; q.beginPath(); q.ellipse(x, y, r, r * 0.82, 0, 0, TAU); q.fill(); };
        if (id < 3) {   // eucalyptus: a slim, tall, drooping crown
          q.strokeStyle = "#6B5A48"; q.lineWidth = 9; q.beginPath(); q.moveTo(cx, oy + 508); q.quadraticCurveTo(cx + 14 * (id - 1), oy + 300, cx + 8 * (1 - id), oy + 110); q.stroke();
          for (let k = 0; k < 16; k++) { const f = k / 15, y = oy + 120 + f * 250, sp = 30 + 80 * Math.sin(Math.PI * Math.min(1, f * 1.1 + 0.1)), x = cx + (R_() - 0.5) * sp * 1.4, r = 26 + 22 * R_();
            blob(x, y, r, ["#2E4F2E", "#3F6B3A", "#4C7A40"][(R_() * 3) | 0]); q.strokeStyle = "#3F6B3A"; q.lineWidth = 3; for (let m = 0; m < 3; m++) { q.beginPath(); q.moveTo(x + (R_() - 0.5) * r, y + r * 0.5); q.lineTo(x + (R_() - 0.5) * r * 1.4, y + r * 0.5 + 26 + 30 * R_()); q.stroke(); } }
          for (let k = 0; k < 12; k++) blob(cx + (R_() - 0.5) * 90, oy + 110 + R_() * 160, 10 + 9 * R_(), "#7BA84E");
        } else {        // a round crown on a short trunk
          q.strokeStyle = "#6B5A48"; q.lineWidth = 12; q.beginPath(); q.moveTo(cx, oy + 508); q.lineTo(cx, oy + 330); q.stroke();
          for (let k = 0; k < 9; k++) { const a = k * 0.7 + id, r = 80 + 40 * R_(), x = cx + Math.cos(a) * 60 * R_(), y = oy + 230 + Math.sin(a) * 50 * R_(); blob(x, y, r, "#2E4F2E"); }
          for (let k = 0; k < 9; k++) { const a = k * 0.7 + id + 1, r = 62 + 32 * R_(), x = cx - 14 + Math.cos(a) * 55 * R_(), y = oy + 215 + Math.sin(a) * 44 * R_(); blob(x, y, r, "#3F6B3A"); }
          for (let k = 0; k < 8; k++) blob(cx - 40 + R_() * 50, oy + 170 + R_() * 60, 30 + 20 * R_(), "#5E8A44");
          for (let k = 0; k < 12; k++) blob(cx - 50 + R_() * 70, oy + 150 + R_() * 70, 8 + 8 * R_(), "#8DB255");
        }
      }
    });
    const t = cvTex(c, 4); return t;
  });
}
const TREE_FS = GLC + `uniform sampler2D uTree; varying vec3 vC; varying vec2 vUv; varying vec3 vW;
  void main(){ vec4 tx = texture2D(uTree, vUv); if (tx.a < 0.5) discard; float N = nightAt(vW); vec3 col = tx.rgb * vC; col *= nightK(N); col = mix(col, mistCol(N), mistAmt(vW, 1.0)); gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
const TREE_VS = `attribute vec3 aCol; attribute vec2 aUv; varying vec3 vC; varying vec2 vUv; varying vec3 vW; void main(){ vC = aCol; vUv = aUv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
function genTrees(W) {
  const out = [], R_ = rngOf(SEED + 600), occ = W.occ;
  const add = (x, z, kind) => {
    if (out.length >= 780 || inCorridor(x, z, 6)) return false; const id = kind === "e" ? (R_() * 3) | 0 : 3 + ((R_() * 2) | 0);
    if (occ.taken(x, z, 3)) return false; const y = Hm(W, x, z) - 0.4, h = kind === "e" ? lerp(12, 24, R_()) : lerp(6, 12, R_()), w = kind === "e" ? h * 0.46 : h * 0.9;
    out.push({ x, y, z, h, w, id, ang: R_() * Math.PI, tint: mixc([1, 1, 1], [0.92, 1.0, 0.86], R_()) }); return true;
  };
  const clump = (cx, cz, n, rad, kind, ok) => { let k = 0; for (let g = 0; k < n && g < n * 10; g++) { const a = R_() * TAU, r = rad * Math.sqrt(R_()), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (ok && !ok(x, z)) continue; if (add(x, z, kind)) k++; } };
  const slopeOk = (x, z) => Math.abs(Hm(W, x + 5, z) - Hm(W, x - 5, z)) < 8 && Hm(W, x, z) > -300;
  for (let i = 0; i < 12; i++) clump(560 + (R_() - 0.5) * 360, -600 + (R_() - 0.5) * 460, 8 + ((R_() * 5) | 0), 22, "e", (x, z) => Hm(W, x, z) > -250);                 // ESTE eucalyptus
  for (let i = 0; i < 9; i++) clump(-95 + (R_() - 0.5) * 400, -660 + (R_() - 0.5) * 400, 6 + ((R_() * 4) | 0), 18, R_() < 0.6 ? "e" : "r", slopeOk);       // LOMA's skirts
  for (let i = 0; i < 9; i++) clump(-640 + (R_() - 0.5) * 500, -420 + (R_() - 0.5) * 400, 5 + ((R_() * 4) | 0), 20, "r", slopeOk);                      // OESTE
  for (let i = 0; i < 14; i++) clump((R_() - 0.5) * 760, -170 - R_() * 320, 6 + ((R_() * 5) | 0), 16, R_() < 0.5 ? "e" : "r", (x, z) => slopeOk(x, z) && Math.abs(x) > 24);   // the slope under the street
  BUMPS.filter((b) => /^R\d/.test(b.id)).forEach((b, bi) => { for (let i = 0; i < 5; i++) { const al = (R_() - 0.5) * b.rx * 1.4; clump(b.x + al * b.sa, b.z + al * b.ca, 8 + ((R_() * 5) | 0), 20, R_() < 0.5 ? "e" : "r", (x, z) => Hm(W, x, z) > -300); } });
  for (let i = 0; i < 8; i++) clump(-1500 + 3000 * R_(), -2900 - 600 * R_(), 8, 40, "r", (x, z) => Hm(W, x, z) > -150);
  const [px, pz] = [0, 0]; void px; void pz;
  for (let bi = 0; bi < CEN.nu; bi++) for (let bj = 0; bj < CEN.nv; bj++) {   // 0-2 patio trees a block
    if (PLAZAS.some(([a, b]) => a === bi && b === bj)) continue; const [bx, bz] = gridToWorld((bi - 4) * CEN.pitch, (bj - 2.5) * CEN.pitch); if (inCorridor(bx, bz, 52)) continue;
    const n = Math.floor(R_() * 3); for (let k = 0; k < n; k++) { const x = bx + (R_() - 0.5) * 34, z = bz + (R_() - 0.5) * 34; if (out.length < 780) out.push({ x, y: Hm(W, x, z) - 0.4, z, h: lerp(7, 11, R_()), w: 8, id: 3 + ((R_() * 2) | 0), ang: R_() * Math.PI, tint: [1, 1, 1] }); }
  }
  for (let g = 0; out.length < 780 && g < 4000; g++) { const x = -1100 + 2200 * R_(), z = -150 - 560 * R_(); if (Hm(W, x, z) > -260 && slopeOk(x, z)) add(x, z, R_() < 0.5 ? "e" : "r"); }
  return out;
}
function treeSoup(list) {
  const S = new Soup();
  for (const t of list) {
    const col = t.id % 3, row = Math.floor(t.id / 3), u0 = (col * 341) / 1024, u1 = (col * 341 + 340) / 1024, v1 = 1 - (row * 512) / 1024, v0 = 1 - (row * 512 + 512) / 1024;
    for (let c = 0; c < 2; c++) { const a = t.ang + c * Math.PI / 2, ux = Math.cos(a) * t.w / 2, uz = Math.sin(a) * t.w / 2; S.quad([t.x - ux, t.y, t.z - uz], [t.x + ux, t.y, t.z + uz], [t.x + ux, t.y + t.h, t.z + uz], [t.x - ux, t.y + t.h, t.z - uz], t.tint, [0, 0, 0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
  }
  return S;
}
function palmSoup(W) {   // 14 palms: trunk 6 triangles, 9 fronds (arched blades of 2 triangles) each
  const S = new Soup(), R_ = rngOf(SEED + 650), tr = lin("#8A7658"), fr = [lin("#3F6B3A"), lin("#5E8A44"), lin("#4E7F3F")];
  const spots = []; for (const [bi, bj] of PLAZAS) { const [bx, bz] = gridToWorld((bi - 4) * CEN.pitch, (bj - 2.5) * CEN.pitch); for (let k = 0; k < 5; k++) spots.push([bx + [-26, 26, -26, 26, 0][k] + (R_() - 0.5) * 4, bz + [-26, -26, 26, 26, 30][k] + (R_() - 0.5) * 4]); }
  spots.slice(0, 14).forEach(([x, z]) => {
    const y = Hm(W, x, z), hgt = 9 + 4 * R_(), n = 3; const ring = (yy, r) => Array.from({ length: n }, (_, k) => [x + Math.cos(k * TAU / n) * r, yy, z + Math.sin(k * TAU / n) * r]);
    const a = ring(y - 0.5, 0.45), b = ring(y + hgt, 0.28); for (let k = 0; k < n; k++) S.quad(a[k], a[(k + 1) % n], b[(k + 1) % n], b[k], tr);
    for (let f = 0; f < 9; f++) { const an = f * TAU / 9 + R_() * 0.3, dx = Math.cos(an), dz = Math.sin(an), L = 3.8 + 1.4 * R_(), px = -dz * 0.55, pz = dx * 0.55, top = y + hgt;
      const m = [x + dx * L * 0.55, top + 1.3, z + dz * L * 0.55], e = [x + dx * L, top - 1.4, z + dz * L], c = fr[f % 3];
      S.quad([x + px * 0.2, top, z + pz * 0.2], [x - px * 0.2, top, z - pz * 0.2], [m[0] - px, m[1], m[2] - pz], [m[0] + px, m[1], m[2] + pz], c);
      S.tri([m[0] + px, m[1], m[2] + pz], [m[0] - px, m[1], m[2] - pz], e, mixc(c, lin("#2E4F2E"), 0.3)); }
  });
  return S;
}
function blobSoup(W, houses) {   // VALLE: 28 round-crown trees as 60-triangle blobs, crowns 9-15 m (they stand half under in P3)
  const S = new Soup(), R_ = rngOf(SEED + 660), spots = [];
  for (let g = 0; spots.length < 28 && g < 600; g++) { const x = 690 + 240 * R_(), z = -1340 + 180 * R_(), d = Math.hypot((x - 810) / 34, (z + 1250) / 28); if (d < 1 || W.occ.taken(x, z, 4)) continue; spots.push([x, z]); W.occ.mark(x, z, 5); }
  spots.forEach(([x, z], i) => {
    const y = Hm(W, x, z), r = lerp(4.5, 7.5, R_()), cy = y + r * 0.9 + 3, ry = r * 0.85, segs = 6, rings = 6, c1 = i % 2 ? lin("#4E7F3F") : lin("#3F6B3A"), c2 = lin("#5E8A44");
    const P_ = (ri, k) => { const lat = (ri / rings) * Math.PI, rr = Math.sin(lat) * r, an = (k / segs) * TAU + (ri % 2) * 0.5; return [x + Math.cos(an) * rr, cy + Math.cos(lat) * ry, z + Math.sin(an) * rr]; };
    for (let ri = 0; ri < rings; ri++) for (let k = 0; k < segs; k++) {
      const a = P_(ri, k), b = P_(ri, k + 1), c = P_(ri + 1, k + 1), d = P_(ri + 1, k), col = mixc(c1, c2, clamp(1 - ri / rings + 0.2 * hash(i, ri, k)));
      if (ri === 0) S.tri(a, c, d, col); else if (ri === rings - 1) S.tri(a, b, d, scl(col, 0.8)); else S.quad(a, b, c, d, col);
    }
    S.quad([x - 0.3, y - 0.5, z - 0.3], [x + 0.3, y - 0.5, z + 0.3], [x + 0.3, cy - 1, z + 0.3], [x - 0.3, cy - 1, z - 0.3], lin("#6B5A48"));
  });
  return S;
}

// ---- churches (hero geometry, <= 900 triangles each). Frame of a church: origin (cx, cz), turned `rot`; u across, v along the nave; the facade is at +v (toward +z, the camera side).
function churchKit(S) {
  const K = {};
  const frame = (cx, cz, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return (u, v, y) => [cx + u * c + v * s, y, cz - u * s + v * c]; };
  K.box = (f, u0, u1, v0, v1, y0, y1, col, top = col, shade = 0.84) => {
    const p = (u, v, y) => f(u, v, y);
    S.quad(p(u0, v1, y0), p(u1, v1, y0), p(u1, v1, y1), p(u0, v1, y1), col); S.quad(p(u1, v0, y0), p(u0, v0, y0), p(u0, v0, y1), p(u1, v0, y1), scl(col, shade));
    S.quad(p(u1, v1, y0), p(u1, v0, y0), p(u1, v0, y1), p(u1, v1, y1), scl(col, 0.92)); S.quad(p(u0, v0, y0), p(u0, v1, y0), p(u0, v1, y1), p(u0, v0, y1), scl(col, 0.92));
    S.quad(p(u0, v0, y1), p(u0, v1, y1), p(u1, v1, y1), p(u1, v0, y1), top);
  };
  K.prismU = (f, u0, u1, v0, v1, y, rise, col, ov = 0.8, gcol) => {   // ridge along u
    const vm = (v0 + v1) / 2, hv = (v1 - v0) / 2 + ov;
    S.quad(f(u0 - ov, vm - hv, y), f(u1 + ov, vm - hv, y), f(u1 + ov, vm, y + rise), f(u0 - ov, vm, y + rise), scl(col, 0.88));
    S.quad(f(u1 + ov, vm + hv, y), f(u0 - ov, vm + hv, y), f(u0 - ov, vm, y + rise), f(u1 + ov, vm, y + rise), col);
    S.tri(f(u0, v0, y), f(u0, v1, y), f(u0, vm, y + rise * (hv - ov) / hv), gcol ?? col); S.tri(f(u1, v1, y), f(u1, v0, y), f(u1, vm, y + rise * (hv - ov) / hv), gcol ?? col);
  };
  K.spire = (f, u, v, y, r, h, n, col, colB) => { for (let k = 0; k < n; k++) { const a0 = (k + 0.5) * TAU / n, a1 = (k + 1.5) * TAU / n; S.tri(f(u + Math.cos(a0) * r, v + Math.sin(a0) * r, y), f(u + Math.cos(a1) * r, v + Math.sin(a1) * r, y), f(u, v, y + h), k % 2 ? col : (colB ?? scl(col, 0.9))); } };
  K.cyl = (f, u, v, y0, y1, r, n, col, top) => { for (let k = 0; k < n; k++) { const a0 = k * TAU / n, a1 = (k + 1) * TAU / n, p0 = [u + Math.cos(a0) * r, v + Math.sin(a0) * r], p1 = [u + Math.cos(a1) * r, v + Math.sin(a1) * r]; S.quad(f(p0[0], p0[1], y0), f(p1[0], p1[1], y0), f(p1[0], p1[1], y1), f(p0[0], p0[1], y1), scl(col, 0.86 + 0.14 * Math.cos(a0 + 0.8))); if (top) S.tri(f(u, v, y1), f(p0[0], p0[1], y1), f(p1[0], p1[1], y1), top); } };
  K.dome = (f, u, v, y, r, hy, n, rings, colA, colB, ribEvery) => {   // ribs: every `ribEvery`-th sector in colB
    const P_ = (ri, k) => { const lat = (ri / rings) * Math.PI / 2, rr = Math.cos(lat) * r, an = (k / n) * TAU; return f(u + Math.cos(an) * rr, v + Math.sin(an) * rr, y + Math.sin(lat) * hy); };
    for (let k = 0; k < n; k++) for (let ri = 0; ri < rings; ri++) { const col = ribEvery && k % ribEvery === 0 ? colB : colA, a = P_(ri, k), b = P_(ri, k + 1), c = P_(ri + 1, k + 1), d = P_(ri + 1, k); if (ri === rings - 1) S.tri(a, b, c, scl(col, 0.9 + 0.1 * Math.cos(k * TAU / n))); else S.quad(a, b, c, d, scl(col, 0.9 + 0.1 * Math.cos(k * TAU / n))); }
  };
  K.arch = (f, face, u, v, y, w, h, col) => {   // a dark arched opening decal on a face: 0 +v, 1 -v, 2 +u, 3 -u (0.12 m proud)
    const o = 0.12, P_ = (a, yy) => (face === 0 ? f(u + a, v + o, yy) : face === 1 ? f(u + a, v - o, yy) : face === 2 ? f(u + o, v + a, yy) : f(u - o, v + a, yy));
    S.quad(P_(-w / 2, y), P_(w / 2, y), P_(w / 2, y + h * 0.7), P_(-w / 2, y + h * 0.7), col); S.tri(P_(-w / 2, y + h * 0.7), P_(w / 2, y + h * 0.7), P_(0, y + h), col);
  };
  K.cross = (f, u, v, y, h, col) => { S.quad(f(u - 0.12, v, y), f(u + 0.12, v, y), f(u + 0.12, v, y + h), f(u - 0.12, v, y + h), col); S.quad(f(u - h * 0.28, v, y + h * 0.66), f(u + h * 0.28, v, y + h * 0.66), f(u + h * 0.28, v, y + h * 0.66 + 0.24), f(u - h * 0.28, v, y + h * 0.66 + 0.24), col); S.quad(f(u, v - 0.12, y), f(u, v + 0.12, y), f(u, v + 0.12, y + h), f(u, v - 0.12, y + h), col); };
  return K;
}
function buildChurches(W) {
  const S = new Soup(), K = churchKit(S), gnd = (x, z, r) => { let m = -1e9; for (let a = 0; a < 8; a++) m = Math.max(m, Hm(W, x + Math.cos(a * TAU / 8) * r, z + Math.sin(a * TAU / 8) * r)); return Math.max(m, Hm(W, x, z)) + 0.4; };
  const stone = lin("#8E8A8F"), stoneL = lin("#B4AEB0"), stoneD = lin("#5E5A66"), dark = lin("#3A3036"), white = lin("#F4EFE4"), tile = lin("#B5543A"), tileD = lin("#8E4030");
  const [x1, z1] = CHURCH.CH1; { // CH1 on LOMA: twin towers, nave, crossing tower, rose window, buttress fins
    const y0 = gnd(x1, z1, 16), f = frame0(x1, z1, 0), yb = y0 - 26;
    K.box(f, -13, 13, -31, 31, yb, y0 + 22, stone, stone, 0.82); K.prismU(f, -13, 13, -31, 31, y0 + 22, 6.5, lin("#6C5A5E"), 0.6, stone);
    for (const sg of [-1, 1]) { const u0 = sg > 0 ? 4 : -13, u1 = sg > 0 ? 13 : -4, uc = sg * 8.5;   // twin towers 9 x 9, 58 m, with 16 m octagonal spires
      K.box(f, u0, u1, 22, 31, yb, y0 + 58, stoneL, stoneL, 0.8); K.box(f, u0 - 0.5, u1 + 0.5, 21.5, 31.5, y0 + 30, y0 + 31.4, stone); K.box(f, u0 - 0.5, u1 + 0.5, 21.5, 31.5, y0 + 55.6, y0 + 58.4, stone);
      K.spire(f, uc, 26.5, y0 + 58.4, 5.1, 16, 8, lin("#6E7C8A"), lin("#5A6672")); K.spire(f, uc, 26.5, y0 + 74.2, 0.7, 3, 4, stone);
      for (const [yy, hh] of [[y0 + 36, 9], [y0 + 46, 8]]) { K.arch(f, 0, uc, 31, yy, 2.6, hh, dark); K.arch(f, 2 * sg > 0 ? 2 : 3, sg > 0 ? 13 : -13, 26.5, yy, 2.6, hh, dark); K.arch(f, sg > 0 ? 3 : 2, sg > 0 ? 4 : -4, 26.5, yy, 2.6, hh, dark); }
      K.arch(f, 0, uc, 31, y0 + 12, 2.2, 7, dark); K.arch(f, 0, uc, 31, y0 + 22, 1.6, 4.6, dark); }
    K.box(f, -6, 6, -8, 4, y0 + 20, y0 + 38, stoneL, stoneL, 0.82); K.spire(f, 0, -2, y0 + 38, 6.2, 9, 8, lin("#6E7C8A"), lin("#5A6672")); for (const q of [[0, 4.05, 1], [0, -8.05, 0]]) K.arch(f, q[2], q[0], q[1] > 0 ? 4 : -8, y0 + 27, 2.4, 7, dark);
    { const rc = [0, 31.15, y0 + 15.5], rr = 3, n = 12; for (let k = 0; k < n; k++) { const a0 = k * TAU / n, a1 = (k + 1) * TAU / n; S.tri(f(rc[0], rc[1], rc[2]), f(Math.cos(a0) * rr, rc[1], rc[2] + Math.sin(a0) * rr), f(Math.cos(a1) * rr, rc[1], rc[2] + Math.sin(a1) * rr), k % 2 ? lin("#46567E") : lin("#8C4A5A")); } }
    K.arch(f, 0, 0, 31, y0 + 0.2, 5.6, 11, dark);
    for (let k = 0; k < 8; k++) for (const sg of [-1, 1]) { const v = -27 + 7.7 * k; K.box(f, sg > 0 ? 13 : -15.4, sg > 0 ? 15.4 : -13, v - 0.7, v + 0.7, yb, y0 + 17 - (k % 2) * 0.01, stoneL, stone, 0.8); K.arch(f, sg > 0 ? 2 : 3, sg > 0 ? 13 : -13, v + 3.8, y0 + 8, 1.6, 6, dark); }
  }
  const [x2, z2] = CHURCH.CH2; { // CH2: white bell tower in 3 stages, copper-green dome, nave 40 x 14 x 15
    const y0 = gnd(x2, z2, 12), f = frame0(x2, z2, 0.04), yb = y0 - 8;
    K.box(f, -20, -3, -14, 20, yb, y0 + 14, white, white, 0.84); K.prismU(f, -20, -3, -14, 20, y0 + 14, 5, tile, 0.7, white); K.arch(f, 0, -11, 20, y0 + 0.2, 3, 7, dark);
    for (let k = 0; k < 4; k++) { K.arch(f, 2, -3, -9 + 8 * k, y0 + 5, 1.6, 6, dark); K.arch(f, 3, -20, -9 + 8 * k, y0 + 5, 1.6, 6, dark); }
    const tw = [[8, 0, 14], [7, 14, 24], [6, 24, 30]];
    tw.forEach(([w, a, b], i) => { K.box(f, -w / 2, w / 2, -w / 2 + 6, w / 2 + 6, i ? y0 + a : yb, y0 + b, white, white, 0.84); K.box(f, -w / 2 - 0.3, w / 2 + 0.3, -w / 2 + 5.7, w / 2 + 6.3, y0 + b - 0.5, y0 + b + 0.3, lin("#DCD3C0")); });
    for (const [face, uu, vv] of [[0, 0, 10], [1, 0, 2], [2, 3.5, 6], [3, -3.5, 6]]) { K.arch(f, face, uu, vv, y0 + 3, 2.2, 6.5, dark); K.arch(f, face, uu * 0.86, vv + (face < 2 ? 0 : 0) - (face < 2 ? (face === 0 ? 0.5 : -0.5) * 0 : 0), y0 + 16, 1.8, 5.5, dark); K.arch(f, face, uu * 0.86, vv, y0 + 25, 1.4, 4.2, dark); }
    K.cyl(f, 0, 6, y0 + 30, y0 + 31, 3.6, 12, lin("#DCD3C0")); K.dome(f, 0, 6, y0 + 31, 3.5, 3.6, 16, 5, lin("#5F9A8A"), lin("#4A8070"), 2); K.cyl(f, 0, 6, y0 + 34.6, y0 + 37.4, 0.9, 8, white, lin("#5F9A8A")); K.cross(f, 0, 6, y0 + 37.4, 3.4, lin("#3A3036"));
  }
  const [x3, z3] = CHURCH.CH3; { // CH3: blue-tile dome on a drum with 12 ribs, rose facade, two bell gables
    const y0 = gnd(x3, z3, 10), f = frame0(x3, z3, -0.03), yb = y0 - 7, fac = lin("#F2DAD2");
    K.box(f, -12, 12, 4, 7.5, yb, y0 + 15, fac, fac, 0.84); K.box(f, -12, 12, -16, 4, yb, y0 + 10, white, white, 0.84); K.prismU(f, -12, 12, -16, 4, y0 + 10, 4, tile, 0.6, white);
    for (const sg of [-1, 1]) { const uc = sg * 9; K.box(f, uc - 2, uc + 2, 4, 7.5, y0 + 15, y0 + 18, fac); S.tri(f(uc - 2.2, 7.6, y0 + 18), f(uc + 2.2, 7.6, y0 + 18), f(uc, 7.6, y0 + 21), fac); K.arch(f, 0, uc, 7.5, y0 + 12, 1.6, 4, dark); K.box(f, uc - 0.5, uc + 0.5, 7.5, 7.9, y0 + 14.2, y0 + 15.3, lin("#D8B24A")); }
    K.arch(f, 0, 0, 7.5, y0 + 0.2, 4.4, 8.6, dark); K.arch(f, 0, -7.5, 7.5, y0 + 5, 2, 5, dark); K.arch(f, 0, 7.5, 7.5, y0 + 5, 2, 5, dark);
    { const n = 10, rc = [0, 7.65, y0 + 10.6]; for (let k = 0; k < n; k++) S.tri(f(0, rc[1], rc[2]), f(Math.cos(k * TAU / n) * 1.9, rc[1], rc[2] + Math.sin(k * TAU / n) * 1.9), f(Math.cos((k + 1) * TAU / n) * 1.9, rc[1], rc[2] + Math.sin((k + 1) * TAU / n) * 1.9), k % 2 ? lin("#46567E") : lin("#D8B24A")); }
    K.cyl(f, 0, -6, y0 + 10, y0 + 18, 7, 16, white, null); for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2; K.arch(f, 0, Math.cos(a) * 6.9, -6 + Math.sin(a) * 6.9, y0 + 11.5, 1.2, 3.6, dark); void 0; }
    K.dome(f, 0, -6, y0 + 18, 7.5, 7.5, 36, 5, lin("#3F5FA8"), lin("#E8E2D0"), 3); K.cyl(f, 0, -6, y0 + 25.4, y0 + 27.8, 1.2, 8, white, lin("#3F5FA8")); K.cross(f, 0, -6, y0 + 27.8, 2.4, lin("#3A3036"));
  }
  const [x4, z4] = CHURCH.CH4; { // CH4 (VALLE, east of the plaza): white tower 6.5 x 6.5 x 24, dome #D9D2C4, cross top 27 over the ground; nave 34 x 12 x 11; the last thing above water in P3
    const gy = Hm(W, x4, z4), y0 = gy + 0.3, f = frame0(x4, z4, 0), yb = y0 - 4;
    K.box(f, -6, 6, -17, 17, yb, y0 + 11, white, white, 0.84); K.prismU(f, -6, 6, -17, 17, y0 + 11, 3.6, tile, 0.6, white);
    for (let k = 0; k < 4; k++) K.arch(f, 3, -6, -11 + 7.5 * k, y0 + 3, 1.4, 4.6, dark); K.arch(f, 0, 0, 17, y0 + 0.2, 3, 6, dark);
    K.box(f, -3.25, 3.25, 17 - 6.5, 17, yb, y0 + 22, white, white, 0.84); K.box(f, -3.6, 3.6, 17 - 6.9, 17.4, y0 + 21.2, y0 + 22.2, lin("#DCD3C0"));
    for (const [face, uu, vv] of [[0, 0, 17], [3, -3.25, 13.75], [2, 3.25, 13.75]]) { K.arch(f, face, uu, vv, y0 + 14, 1.6, 5, dark); K.arch(f, face, uu, vv, y0 + 5, 1.2, 3.6, dark); }
    K.dome(f, 0, 13.75, y0 + 22.2, 3.4, 2.5, 12, 4, lin("#D9D2C4"), lin("#BFB8A8"), 2); K.cyl(f, 0, 13.75, y0 + 24.6, y0 + 25.6, 0.7, 8, white, lin("#D9D2C4")); K.cross(f, 0, 13.75, y0 + 25.4, 1.6, lin("#3A3036"));
  }
  return S;
  function frame0(cx, cz, rot) { return frame(cx, cz, rot); }
  function frame(cx, cz, rot) { const c = Math.cos(rot), s = Math.sin(rot); return (u, v, y) => [cx + u * c + v * s, y, cz - u * s + v * c]; }
}

// ---- the volcano (C2): polar mesh 48 x 22, centre (-140, -4700), base y -60, base r 760, summit +395 (31 deg), crater notch 70 m
function buildVolcano() {
  const S = new Soup(), cx = -140, cz = -4700, J = 48, NR = 22, R0 = 760, rock = lin("#5A5560"), para = lin("#6E7F4E"), gully = lin("#46424E");
  const hf = (r, th) => {
    let y = r >= 70 ? 395 - 0.6 * r : 353 - 30 * (1 - (r / 70) ** 2);
    const g = Math.pow(Math.max(0, Math.cos(22 * th)), 6), dep = 16 * Math.sin(clamp(r / 760) * Math.PI) ** 0.8; y -= dep * g;
    y += (fbm(Math.cos(th) * 2.2 + r / 300, Math.sin(th) * 2.2, 77, 3) - 0.5) * 22 * sstep(60, 200, r) * (1 - sstep(600, 760, r));
    return y;
  };
  const snowY = (th) => 210 + 26 * Math.sin(6 * th) - 60 * Math.pow(Math.max(0, Math.cos(14 * th + 0.4)), 4);
  const V = (i, j) => { const th = ((j % J) / J) * TAU, r = R0 * (1 - i / NR); return [cx + Math.cos(th) * r, hf(r, th), cz + Math.sin(th) * r, th, r]; };
  for (let i = 0; i < NR; i++) for (let j = 0; j < J; j++) {
    const a = V(i, j), b = V(i, j + 1), c = V(i + 1, j + 1), d = V(i + 1, j);
    for (const [A, B, C] of i === NR - 1 ? [[a, b, c]] : [[a, b, c], [a, c, d]]) {
      const th = (A[3] + B[3] + C[3]) / 3 + (A[3] > 5 && B[3] < 1 ? 0 : 0), yy = (A[1] + B[1] + C[1]) / 3, r = (A[4] + B[4] + C[4]) / 3, tw = ((j + 0.5) / J) * TAU, sy = snowY(tw);
      const snow = clamp((yy - sy) / 12 + 0.5), pk = yy < 80 + 20 * Math.sin(5 * tw) ? 1 : 0, gl = Math.pow(Math.max(0, Math.cos(22 * tw)), 6);
      let col = pk ? mixc(para, rock, sstep(40, 100, yy)) : rock; col = mixc(col, gully, gl * 0.55 * (1 - snow)); col = scl(col, 0.92 + 0.16 * hash(i, j, 5));
      S.tri([A[0], A[1], A[2]], [B[0], B[1], B[2]], [C[0], C[1], C[2]], snow > 0.02 ? mixc(col, lin("#E6E4EA"), snow) : col, [snow, 1, 0]); void th; void r;
    }
  }
  return S;
}
// ---- far range band (as ghorizon): z -5400, x +-3600, y -60..+420, canvas 4096 x 512: three ridge layers and three snow peaks left of centre
function bandTexture() {
  return once("band", () => cvTex(cv2(4096, 512, (q, W, Hh) => {
    const mx = (x) => ((x + 3600) / 7200) * W, my = (y) => ((420 - y) / 480) * Hh, ridge = (seed, base, amp, k) => { const pts = []; for (let px = 0; px <= W; px += 8) { const x = (px / W) * 7200 - 3600, n = fbm(x / k, 0, seed, 4); pts.push([px, my(base + amp * (n - 0.35) * 1.8 + 12 * Math.sin(x / (k * 0.45) + seed))]); } return pts; };
    const fillRidge = (pts, col) => { q.fillStyle = col; q.beginPath(); q.moveTo(0, Hh); pts.forEach(([x, y]) => q.lineTo(x, y)); q.lineTo(W, Hh); q.closePath(); q.fill(); };
    fillRidge(ridge(5, 150, 130, 600), "#7C86B8");
    const peaks = [[-1750, 380, 900], [-1200, 335, 760], [-700, 285, 620]];   // three snow peaks left of centre
    for (const [x, top, hw] of peaks) {
      const n = 64, L = [], Rr = []; for (let k = 0; k <= n; k++) { const f = k / n, px = x + (f - 0.5) * 2 * hw, prof = top - (top + 60) * Math.pow(Math.abs(f - 0.5) * 2, 0.8) * 0.92 + 14 * (fbm(px / 60, 1, 9, 3) - 0.5); (f <= 0.5 ? L : Rr).push([mx(px), my(prof)]); }
      q.fillStyle = "#7C86B8"; q.beginPath(); q.moveTo(mx(x - hw), Hh); L.concat(Rr).forEach(([a, b]) => q.lineTo(a, b)); q.lineTo(mx(x + hw), Hh); q.closePath(); q.fill();
      const sy = top - 150 - 20 * Math.sin(x), snow = (poly, col) => { q.fillStyle = col; q.beginPath(); poly.forEach(([a, b], k) => (k ? q.lineTo(a, b) : q.moveTo(a, b))); q.closePath(); q.fill(); };
      const left = L.filter(([, b]) => b < my(sy)), right = Rr.filter(([, b]) => b < my(sy));
      if (left.length) snow([[left[0][0], my(sy)], ...left, [mx(x), my(top)]], "#B9C2DA");
      if (right.length) snow([[mx(x), my(top)], ...right, [right[right.length - 1][0], my(sy)], [mx(x + 40), my(sy + 30)], [mx(x - 20), my(sy + 55)]], "#F2F0EE");
    }
    fillRidge(ridge(11, 90, 90, 420), "#6A7AA0"); fillRidge(ridge(17, 35, 55, 260), "#5E7F6A");
    const g = q.createLinearGradient(0, Hh * 0.55, 0, Hh); g.addColorStop(0, "rgba(124,134,184,0)"); g.addColorStop(1, "rgba(124,134,184,0.55)"); q.fillStyle = g; q.fillRect(0, Hh * 0.55, W, Hh * 0.45);
  })));
}
const BAND_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BAND_FS = GLC + `uniform sampler2D uMap; varying vec2 vUv; varying vec3 vW;
  void main(){ vec4 tx = texture2D(uMap, vUv); if (tx.a < 0.01) discard; float N = nightAt(vW); vec3 col = tx.rgb * mix(vec3(1.0), vec3(1.05, 0.98, 0.95), 0.4); col *= nightK(N); col = mix(col, mistCol(N), mistAmt(vW, 0.5)); gl_FragColor = vec4(col, tx.a);
    #include <colorspace_fragment>
  }`;

// ---- sprites: one soft, rolling, sorted translucent mesh (foam billows, spray, steam, teardrops); atlas 4 x 4 tiles of 128
function spriteAtlas() {
  return once("sprAtlas", () => {
    const N = 128, W = N * 4, data = new Uint8Array(W * W * 4);
    for (let tile = 0; tile < 8; tile++) {
      const tx = (tile % 4) * N, ty = Math.floor(tile / 4) * N, R_ = rngOf(SEED + 900 + tile), lobes = [[0, 0, 0.5]], dots = [];
      for (let i = 0; i < 6; i++) { const a = R_() * TAU, dd = 0.2 + 0.32 * R_(); lobes.push([Math.cos(a) * dd, Math.sin(a) * dd * 0.75, 0.26 + 0.2 * R_()]); }
      for (let i = 0; i < 46; i++) { const a = R_() * TAU, dd = Math.sqrt(R_()) * 0.8; dots.push([Math.cos(a) * dd, Math.sin(a) * dd, 0.035 + 0.075 * R_()]); }
      for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
        const u = ((px + 0.5) / N) * 2 - 1, w = ((py + 0.5) / N) * 2 - 1, o = ((ty + py) * W + tx + px) * 4, rr = Math.hypot(u, w), nz = fbm(u * 2.6 + tile * 5, w * 2.6, 21 + tile, 3) - 0.5;
        let a = 0, tone = 0.5;
        if (tile < 2 || tile === 4 || tile === 5) {
          let d = 0; for (const [cx, cy, r] of lobes) { const q = ((u - cx) / r) ** 2 + ((w - cy) / (r * 0.9)) ** 2; d = Math.max(d, 1 - q); }
          const rag = tile < 2 ? 0.95 : 0.6; a = sstep(0, 0.5, d + rag * nz * (1 - 0.4 * d)) * (1 - sstep(0.76, 1, rr)); tone = clamp(0.55 + 0.4 * w + 0.7 * nz + 0.2 * (d - 0.4) - 0.1 * u);
          if (tile < 2) tone = clamp(tone + 0.2);
        } else if (tile === 2) {   // a burst of spray: scattered round drops
          let d = 0; for (const [cx, cy, r] of dots) d = Math.max(d, 1 - Math.hypot(u - cx, w - cy) / r); a = sstep(0, 0.35, d) * 0.95; tone = clamp(0.7 + 0.3 * w - 0.2 * u);
        } else if (tile === 3) { a = Math.pow(Math.max(0, 1 - rr * rr), 1.6) * 0.8; tone = clamp(0.6 + 0.3 * w + 0.4 * nz); }
        else if (tile === 6) {   // teardrop, tail down: round head, tapered tail
          const head = Math.hypot(u, (w - 0.32) / 0.95) / 0.42, tail = w < 0.32 ? Math.abs(u) / (0.40 * Math.max(0.02, (w + 0.95) / 1.27)) : 9, d = Math.min(head, tail * (w > -0.95 ? 1 : 9));
          a = 1 - sstep(0.82, 1.0, d); tone = clamp(0.35 + 0.6 * (w + 0.4) - 0.3 * u + 0.5 * Math.exp(-(((u + 0.17) / 0.12) ** 2 + ((w - 0.52) / 0.10) ** 2)));
        } else { a = Math.pow(Math.max(0, 1 - ((u * 0.55) ** 2 + (w * 2.2) ** 2)), 1.5) * (0.7 + 0.5 * nz); tone = clamp(0.6 + 0.3 * w); }
        data[o] = data[o + 1] = data[o + 2] = Math.round(clamp(tone) * 255); data[o + 3] = Math.round(clamp(a) * 255);
      }
    }
    const t = new THREE.DataTexture(data, W, W, THREE.RGBAFormat); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
  });
}
const SPR_VS = `attribute vec2 aCorner; attribute vec4 aSz; attribute vec3 aC0; attribute vec3 aC1; attribute float aRot; varying vec2 vUv; varying float vA; varying vec3 vC0; varying vec3 vC1; varying vec3 vW;
  void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 vp = viewMatrix * wp; float hs = min(aSz.x, 0.25 * max(-vp.z, 1.0)); float cr = cos(aRot), sr = sin(aRot);
    vec2 cc = vec2(aCorner.x * aSz.y, aCorner.y); vp.xy += hs * vec2(cr * cc.x - sr * cc.y, sr * cc.x + cr * cc.y); vA = aSz.z; vC0 = aC0; vC1 = aC1;
    vec2 tile = vec2(mod(aSz.w, 4.0), floor(aSz.w / 4.0)); vUv = (tile + aCorner * 0.5 + 0.5) * 0.25; gl_Position = projectionMatrix * vp; }`;
const SPR_FS = GLC + `uniform sampler2D uMap; varying vec2 vUv; varying float vA; varying vec3 vC0; varying vec3 vC1; varying vec3 vW;
  void main(){ vec4 tx = texture2D(uMap, vUv); float a = tx.a * vA; if (a < 0.003) discard; vec3 col = mix(vC0, vC1, tx.r); float N = nightAt(vW); col *= max(nightK(N), vec3(0.58)); col = mix(col, mistCol(N), mistAmt(vW, 0.8));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb *= a; gl_FragColor.a = a; }`;
class Sprites {
  constructor(n, U, order = 10) {
    this.n = n; const NQ = n; this.pos = new Float32Array(NQ * 12); this.sz = new Float32Array(NQ * 16); this.rot = new Float32Array(NQ * 4); this.c0 = new Float32Array(NQ * 12); this.c1 = new Float32Array(NQ * 12);
    const corner = new Float32Array(NQ * 8); for (let i = 0; i < NQ; i++) for (let k = 0; k < 4; k++) corner.set([k === 1 || k === 2 ? 1 : -1, k >= 2 ? 1 : -1], i * 8 + k * 2);
    this.idx = new Uint32Array(NQ * 6); for (let i = 0; i < NQ; i++) this.idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const g = new THREE.BufferGeometry(); this.g = g;
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); g.setAttribute("aCorner", new THREE.BufferAttribute(corner, 2)); g.setAttribute("aSz", new THREE.BufferAttribute(this.sz, 4));
    g.setAttribute("aC0", new THREE.BufferAttribute(this.c0, 3)); g.setAttribute("aC1", new THREE.BufferAttribute(this.c1, 3)); g.setAttribute("aRot", new THREE.BufferAttribute(this.rot, 1)); g.setIndex(new THREE.BufferAttribute(this.idx, 1)); g.index.setUsage(THREE.DynamicDrawUsage);
    const m = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, uMap: { value: spriteAtlas() } }, vertexShader: SPR_VS, fragmentShader: SPR_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide, fog: false }));
    this.mesh = lookOnly(new THREE.Mesh(g, m), order);
    const order_ = new Uint16Array(NQ), key = new Float32Array(NQ), tmp = new THREE.Vector3(), me = this.mesh;
    me.onBeforeRender = (renderer, scene, camera) => {
      me.worldToLocal(tmp.copy(camera.position)); const cx = tmp.x, cy = tmp.y, cz = tmp.z;
      for (let i = 0; i < NQ; i++) { key[i] = (this.pos[i * 12] - cx) ** 2 + (this.pos[i * 12 + 1] - cy) ** 2 + (this.pos[i * 12 + 2] - cz) ** 2; order_[i] = i; }
      order_.sort((a, b) => key[b] - key[a] || a - b);
      for (let n2 = 0; n2 < NQ; n2++) { const q = order_[n2], v = q * 4; this.idx.set([v, v + 1, v + 2, v, v + 2, v + 3], n2 * 6); }
      g.index.needsUpdate = true;
    };
    this.used = 0;
  }
  col(i, c0, c1) { for (let k = 0; k < 4; k++) { this.c0.set(c0, i * 12 + k * 3); this.c1.set(c1, i * 12 + k * 3); } }
  set(i, x, y, z, hs, a, tile, rot = 0, asp = 1) { for (let k = 0; k < 4; k++) { this.pos[i * 12 + k * 3] = x; this.pos[i * 12 + k * 3 + 1] = y; this.pos[i * 12 + k * 3 + 2] = z; this.sz.set([a > 0.004 ? hs : 0, asp, a, tile], i * 16 + k * 4); this.rot[i * 4 + k] = rot; } }
  hide(i) { this.set(i, 0, 0, 0, 0, 0, 0); }
  touch() { const a = this.g.attributes; a.position.needsUpdate = a.aSz.needsUpdate = a.aRot.needsUpdate = true; }
  colTouch() { const a = this.g.attributes; a.aC0.needsUpdate = a.aC1.needsUpdate = true; }
}

// ------------------------------------------------------------------------------------------------ the shared world memo
function getWorld() {
  return once("world", () => {
    const T = buildTerrainSoup(), W = { gN: T.gN, gF: T.gF, terrain: T.S };
    genHouses(W); W.trees = genTrees(W); return W;
  });
}
function yardWalls(W, S) {   // a low yard wall round each farm
  const col = lin("#D8C9A6"), colT = lin("#8E6A58");
  for (const f of W.farms) {
    const c = Math.cos(f.rot), s = Math.sin(f.rot), loc = (u, v, y) => [f.x + u * c + v * s, y, f.z - u * s + v * c], hw = 15, hd = 11;
    const cs = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
    for (let i = 0; i < 4; i++) { const A = cs[i], B = cs[(i + 1) % 4], yA = Hm(W, ...[loc(A[0], A[1], 0)[0], loc(A[0], A[1], 0)[2]]), yB = Hm(W, loc(B[0], B[1], 0)[0], loc(B[0], B[1], 0)[2]); S.quad(loc(A[0], A[1], yA - 0.5), loc(B[0], B[1], yB - 0.5), loc(B[0], B[1], yB + 1.4), loc(A[0], A[1], yA + 1.4), col); S.quad(loc(A[0], A[1], yA + 1.4), loc(B[0], B[1], yB + 1.4), loc(B[0], B[1], yB + 1.55), loc(A[0], A[1], yA + 1.55), colT); }
  }
}

// ------------------------------------------------------------------------------------------------ sandes: C1 terrain, C2 far range + volcano + plume, C3 towns, churches, trees
function sandes(P) {
  const S = P.spec, O = S.origin ?? [0, 0, 0], W = getWorld(), U = makeU(), G = new THREE.Group(); P.whole.add(G);
  const mats = { terrain: solidMat(U, "terrain", { uField: { value: once("fieldTex", () => cvTex(fieldCanvas(), 8)) }, uCity: { value: once("cityTex", () => cvTex(cityCanvas(), 8)) } }), house: solidMat(U, "house"), plain: solidMat(U, "plain") };
  G.add(lookOnly(new THREE.Mesh(W.terrain.geometry(false), mats.terrain), 0));
  // far band
  { const m = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, uMap: { value: bandTexture() } }, vertexShader: BAND_VS, fragmentShader: BAND_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })), me = lookOnly(new THREE.Mesh(new THREE.PlaneGeometry(7200, 480), m), -1); me.position.set(0, 180, -5400); G.add(me); }
  G.add(lookOnly(new THREE.Mesh(buildVolcano().geometry(false), mats.plain), 0));
  // towns
  const hs = new Soup(), hsC = new Soup(), roofS = new Soup(), loose = []; for (const h of W.houses) addHouse(h.zone === "C" ? hsC : hs, h, roofS, loose);
  G.add(lookOnly(new THREE.Mesh(hs.geometry(false), mats.house), 0)); const centroMesh = lookOnly(new THREE.Mesh(hsC.geometry(false), mats.house), 0); G.add(centroMesh);
  const roofGeo = roofS.geometry(true), roofMesh = lookOnly(new THREE.Mesh(roofGeo, mats.house), 1); G.add(roofMesh);
  for (const pt of loose) { const e = pt.h.eave + 2; let tR = 1e9; for (let tt = 0; tt < 40; tt += 0.05) if (seaY(tt) >= e) { tR = tt; break; } pt.tR = tR; pt.dir = [(hash(Math.round(pt.h.x), 1, 77) - 0.5) * 1.2, 1 - 0.3 * hash(Math.round(pt.h.z), 2, 77)]; pt.tilt = (15 + 20 * hash(Math.round(pt.h.x), 3, 77)) * DEG; pt.drift = 6 + 14 * hash(Math.round(pt.h.z), 4, 77); }
  G.add(lookOnly(new THREE.Mesh(buildChurches(W).geometry(false), mats.plain), 0));
  { const m = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, uTree: { value: treeAtlas() } }, vertexShader: TREE_VS, fragmentShader: TREE_FS, side: THREE.DoubleSide, fog: false })); G.add(lookOnly(new THREE.Mesh(treeSoup(W.trees).geometry(false), m), 0)); }
  { const misc = palmSoup(W), bl = blobSoup(W), yw = new Soup(); yardWalls(W, yw); for (const sp of [bl, yw]) { misc.p.push(...sp.p); misc.n.push(...sp.n); misc.c.push(...sp.c); misc.k.push(...sp.k); misc.u.push(...sp.u); } G.add(lookOnly(new THREE.Mesh(misc.geometry(false), mats.plain), 0)); }
  // the steam plume: 14 billows, one new every .23 s
  const spr = new Sprites(14, U, 10); G.add(spr.mesh); for (let i = 0; i < 14; i++) spr.col(i, lin("#B9B0BE"), lin("#E9E4E0")); spr.colTouch();
  const crater = [-140, 357, -4700], Mt = new THREE.Matrix4(), q0 = new THREE.Quaternion(), ax = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), pv3 = new THREE.Vector3(), Mp = new THREE.Matrix4();
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? 0, rs = Math.max(ps.scale, 1e-4); G.position.set((O[0] - ps.x) / rs, (O[1] - ps.y) / rs, (O[2] - ps.z) / rs); G.scale.setScalar(1 / rs);
      setU(U, envAt(t), t); centroMesh.visible = (ps.centro ?? S.centro ?? 1) > 0.5;
      // VALLE's 18 roofs: let go when the water is 2 m over the eaves, tip 15-35 deg, drift 6-20 m, then float on
      for (const pt of loose) {
        const e = t - pt.tR; if (e <= 0) { pt.M.identity(); pt.soup.place(pt); continue; }
        const k = sstep(0, 1.6, e), dy = Math.max(0, seaY(t) + 0.3 - (pt.h.eave - 0.25)), dist = pt.drift * k + 0.5 * Math.max(0, e - 1.6), dl = Math.hypot(pt.dir[0], pt.dir[1]);
        ax.set(0, 1, 0).cross(pv3.set(pt.dir[0] / dl, 0, pt.dir[1] / dl)).normalize(); q0.setFromAxisAngle(ax, pt.tilt * k);
        Mt.compose(pv3.set(pt.piv[0] + pt.dir[0] / dl * dist, pt.piv[1] + dy * k, pt.piv[2] + pt.dir[1] / dl * dist), q0, one); Mp.makeTranslation(-pt.piv[0], -pt.piv[1], -pt.piv[2]); Mt.multiply(Mp); pt.M.copy(Mt); pt.soup.place(pt);
      }
      roofS.pa.needsUpdate = true; roofS.na.needsUpdate = true;
      // plume: lean 20 -> 65 deg and length 380 -> 1100 m from 2x to 13x; it shears toward the wind (-x, the one screen direction right -> left)
      const kk = clamp((spin(t) - 2) / 11), lean = lerp(20, 65, kk) * DEG, len = lerp(380, 1100, kk), sgn = S.plumeDir ?? -1;
      for (let i = 0; i < 14; i++) {
        const a = (((t / 0.23 - i) % 14) + 14) % 14 * 0.23, f = a / 3.22, la = lean * (0.55 + 0.45 * f), x = crater[0] + sgn * Math.sin(la) * len * Math.pow(f, 1.15), y = crater[1] + Math.cos(la) * len * Math.pow(f, 0.9) + 20 * f, hs = (60 + 160 * f) / 2;
        spr.set(i, x + 12 * Math.sin(i * 1.7), y, crater[2] + 10 * Math.cos(i * 2.3), hs, 0.9 * sstep(0, 0.07, f) * (1 - sstep(0.55, 1, f)), 4 + (i % 2), hash(i, 5) * TAU + t * 0.15, 1.1);
      }
      spr.touch();
    },
  };
}

// ------------------------------------------------------------------------------------------------ the sea (C4, C5, F6's swell)
const SW = [[2.2, 180, 0, 14], [1.3, 95, 24, 10], [0.7, 41, -31, 7]];   // height m, length m, heading deg off +z (the way it travels), speed m/s
function swellK(t) {   // heights x (1 + .12 s) and, from 43.3 s, x (1 + 1.4 P(43.3,48)); speeds x (1 - .65 P(43.3,48)): the phase time is the integral of the speed factor
  const u = clamp(t - 43.3, 0, 4.7), pint = t <= 43.3 ? 0 : t <= 48 ? (u * u) / (2 * 4.7) : 2.35 + (t - 48);
  return { hm: (1 + 0.12 * spin(t)) * (1 + 1.4 * P01(t, 43.3, 48)), tau: t - 0.65 * pint };
}
function swellH(x, z, t, sk = swellK(t)) { let y = 0; for (let i = 0; i < 3; i++) { const [a, L, hd, c] = SW[i], k = TAU / L, h = hd * DEG; y += a * sk.hm * Math.sin(k * (x * Math.sin(h) + z * Math.cos(h) - c * sk.tau) + i * 1.3); } return y; }
const SEA_VS = `uniform vec4 uSw[3]; uniform vec3 uPh; uniform float uSeaY; varying vec3 vW; varying vec2 vG; varying float vH;
  float swell(vec2 p, out vec2 g){ float y = 0.0; g = vec2(0.0); for (int i = 0; i < 3; i++) { float ph = uSw[i].y * (p.x * uSw[i].z + p.y * uSw[i].w) - uPh[i] + float(i) * 1.3; y += uSw[i].x * sin(ph); g += uSw[i].x * uSw[i].y * cos(ph) * vec2(uSw[i].z, uSw[i].w); } return y; }
  void main(){ vec2 g; float y = swell(position.xz, g); vG = g; vH = y; vW = vec3(position.x, uSeaY + y, position.z); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`;
const SEA_FS = GLC + `uniform sampler2D uHm; uniform sampler2D uWc; uniform float uCover; uniform float uAmp; uniform vec4 uWall[4]; varying vec3 vW; varying vec2 vG; varying float vH;
  float wcLayer(vec2 uv, float c){ vec4 t = texture2D(uWc, uv); return c < 0.5 ? mix(t.r, t.g, clamp((c - 0.35) / 0.15, 0.0, 1.0)) : c < 0.65 ? mix(t.g, t.b, (c - 0.5) / 0.15) : mix(t.b, t.a, clamp((c - 0.65) / 0.15, 0.0, 1.0)); }
  void main(){
    float N = nightAt(vW); vec3 nk = nightK(N); vec3 V = normalize(cameraPosition - vW);
    float gh = texture2D(uHm, vec2((vW.x + 2800.0) / 5600.0, (100.0 - vW.z) / 5800.0)).r, depth = vW.y - gh;
    vec2 dn = vec2(n2(vW.xz * 0.09 + vec2(uT * 0.4, 0.0)) - 0.5, n2(vW.xz * 0.09 + vec2(5.0, uT * 0.3)) - 0.5);
    vec3 n = normalize(vec3(-vG.x * 3.0 + dn.x * 0.34, 1.0, -vG.y * 3.0 + dn.y * 0.34));
    float nl = dot(n, uLdir), tone = 0.5 * smoothstep(0.12, 0.22, nl) + 0.5 * smoothstep(0.54, 0.62, nl); tone = mix(tone, 0.45, smoothstep(250.0, 1400.0, distance(cameraPosition, vW)));
    float hRel = clamp(vH / max(uAmp, 0.1) * 0.5 + 0.5, 0.0, 1.0);
    vec3 deep = vec3(0.0137, 0.0612, 0.1329), mid = vec3(0.0273, 0.1541, 0.2705), shallow = vec3(0.1144, 0.3968, 0.4565);
    vec3 col = mix(deep, mid, tone); col = mix(col, mid * 1.5, smoothstep(0.55, 1.0, hRel) * 0.45);
    col = mix(col, shallow * (0.7 + 0.3 * tone), (1.0 - smoothstep(0.0, 12.0, depth)) * 0.85);
    col *= nk;
    float c = uCover, a1 = wcLayer(vW.xz / 380.0 + vec2(0.0, uT * 9.0 / 380.0), c), cs = 0.906, sn = 0.423;
    vec2 q = vec2(vW.x * cs - vW.z * sn, vW.x * sn + vW.z * cs) / 290.0 + vec2(uT * 6.0 / 290.0, 0.0); float a2 = wcLayer(q, c);
    float crest = 0.5 + 0.5 * smoothstep(0.3, 0.8, hRel);
    float foam = max(a1, a2) * crest * 0.92;
    float dd = depth + 2.0 * (n2(vW.xz * 0.2) - 0.5), lace = (1.0 - smoothstep(0.0, 2.4, dd)) * (0.45 + 0.55 * step(0.0, sin(depth * 1.6 - uT * 2.4 + n2(vW.xz * 0.08) * 6.0)));
    foam = max(foam, lace * 0.8);
    for (int i = 0; i < 4; i++) { vec4 w = uWall[i]; float fx = smoothstep(w.x - 20.0, w.x + 40.0, vW.x) * (1.0 - smoothstep(w.y - 40.0, w.y + 20.0, vW.x)), dz = vW.z - w.z; float ap = fx * (1.0 - smoothstep(0.0, 90.0, dz)) * smoothstep(-8.0, 2.0, dz) * smoothstep(3.0, 14.0, w.w);
      float ln = n2(vW.xz * 0.33 + vec2(0.0, uT * 2.0)) * 0.7 + n2(vW.xz * 0.9) * 0.3; foam = max(foam, ap * smoothstep(0.30, 0.62, ln + 0.35 * (1.0 - dz / 90.0))); }
    vec3 foamC = mix(vec3(0.58, 0.67, 0.78), vec3(0.80, 0.88, 0.95), smoothstep(0.1, 0.6, nl)) * max(nk, vec3(0.55));
    col = mix(col, foamC, clamp(foam, 0.0, 1.0));
    float gl = smoothstep(0.9986, 0.9998, dot(reflect(-V, n), uMoon)), sp = step(0.52, n2(vW.xz * 0.7 + uT * 0.8)); col += vec3(0.9, 0.95, 1.0) * gl * sp * 2.5 * smoothstep(0.4, 0.6, N) * step(0.3, uA);
    float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.22; col = mix(col, mistCol(N), fres);
    col = mix(col, mistCol(N), mistAmt(vW, 1.0));
    float al = mix(0.35, 1.0, smoothstep(0.0, 15.0, depth)); al = max(al, clamp(foam, 0.0, 1.0)); al *= smoothstep(-0.2, 0.6, min(depth, uSeaY - gh + 2.0));   // fix r0: a swell crest may wash 2 m over a shore but never climbs the street (at 15x the swell is 12 m: a blue wall stood in P11)
    gl_FragColor = vec4(col, al);
    #include <colorspace_fragment>
  }`;
function whitecapTex() {   // 220 comma strokes, 6-30 px, alpha .5-.9: four cumulative cover levels in R G B A (.35 .50 .65 .80)
  return once("wc", () => {
    const N = 1024, data = new Uint8Array(N * N * 4), R_ = rngOf(SEED + 880), lev = [0.35, 0.5, 0.65, 0.8];
    for (let i = 0; i < 220; i++) {
      const L = Math.round(lerp(6, 30, R_() ** 1.4)), cx = R_() * N, cy = R_() * N, an = R_() * TAU, curve = (R_() - 0.5) * 1.6, al = lerp(0.5, 0.9, R_()), level = R_() * 0.8 + 0.02, ch0 = level <= 0.35 ? 0 : level <= 0.5 ? 1 : level <= 0.65 ? 2 : 3;
      for (let k = 0; k <= L * 2; k++) {
        const f = k / (L * 2), a = an + curve * f, x = cx + Math.cos(a) * f * L, y = cy + Math.sin(a) * f * L, r = lerp(2.6, 0.7, f) * (1 + 0.5 * (L / 30));
        for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          const d = Math.hypot(dx, dy) / r; if (d > 1) continue; const px = (((Math.round(x) + dx) % N) + N) % N, py = (((Math.round(y) + dy) % N) + N) % N, v = Math.round(255 * al * (1 - d * d));
          for (let ch = ch0; ch < 4; ch++) { const o = (py * N + px) * 4 + ch; if (v > data[o]) data[o] = v; }
        }
      }
    }
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; void lev; return t;
  });
}
// ---- the surge walls: strip 40 x 12 (back slope 18 deg, face 65 deg, lip overhang 12 m), a lit face, foam crest, spray
const WALLS = [
  { id: "W1", x0: -250, x1: 750, z0: -1150, v: 60, H: 220, nx: 40, zStop: -700 },
  { id: "W3", x0: -900, x1: -100, z0: -1570, v: 60, H: 120, nx: 32, zStop: -700 },
  { id: "W2", x0: 225, x1: 1375, z0: -1930, v: 140, H: 120, nx: 40, bore: 16 },
  { id: "W4", x0: 310, x1: 1210, z0: -2350, v: 140, H: 100, nx: 32, bore: 16 },
];
const PROFILE = [[-3.08, 0], [-2.2, 0.20], [-1.35, 0.5], [-0.62, 0.75], [-0.2, 0.92], [-0.08, 1.0], [0.03, 0.985], [0.1, 0.92], [0.05, 0.86], [0.14, 0.68], [0.25, 0.45], [0.38, 0.2], [0.56, 0.0]];   // (dz / H toward the camera side, y / H)
const NP = PROFILE.length;
const WALL_VS = `attribute vec4 aP; varying vec3 vW; varying vec3 vN; varying vec4 vP; void main(){ vP = aP; vN = normal; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WALL_FS = GLC + `varying vec3 vW; varying vec3 vN; varying vec4 vP;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float N = nightAt(vW); vec3 nk = nightK(N); float yN = vP.x, s = vP.y;
    vec3 back = vec3(0.0273, 0.1141, 0.2232), face = vec3(0.0494, 0.2384, 0.3915), lip = vec3(0.3467, 0.6514, 0.6867);
    vec3 col = mix(back, face, smoothstep(5.4, 7.2, s)); col = mix(col, lip, smoothstep(6.2, 7.0, s) * (1.0 - smoothstep(8.2, 9.0, s)) * 0.7);
    float nl = dot(n, uLdir), b1 = smoothstep(0.14, 0.22, nl), b2 = smoothstep(0.54, 0.62, nl);
    col = toonLit(col, n);
    float onFace = smoothstep(7.0, 9.5, s);
    col = mix(col, vec3(0.16, 0.50, 0.52) * (0.55 + 0.6 * b2), onFace * smoothstep(0.45, 0.95, yN) * 0.45);   // light through the wave
    float rip = n2(vec2(vW.x * 0.045, yN * 7.0 + (1.0 - onFace) * vW.z * 0.02)); col *= 0.90 + 0.18 * rip;
    float streak = smoothstep(0.42, 0.78, n2(vec2(vW.x * 0.07, yN * 2.6 + 3.0))) * smoothstep(0.30, 0.85, yN) * onFace;
    float crest = smoothstep(0.80, 0.96, yN + (n2(vec2(vW.x * 0.09, vW.z * 0.05)) - 0.5) * 0.10);
    float toe = (1.0 - smoothstep(0.0, 0.12, yN)) * 0.85;
    float back2 = (1.0 - onFace) * smoothstep(0.62, 0.74, n2(vW.xz * 0.05 + uT * 0.3)) * 0.35 * smoothstep(0.2, 0.9, yN);
    float foam = clamp(crest + streak * 0.75 + toe + back2 + smoothstep(0.5, 0.9, n2(vW.xz * 0.2)) * 0.15 * smoothstep(0.7, 1.0, yN), 0.0, 1.0);
    vec3 foamC = mix(vec3(0.46, 0.56, 0.68), mix(vec3(0.70, 0.80, 0.88), vec3(0.90, 0.95, 0.93), b2), b1);
    col = col * nk; col = mix(col, foamC * max(nk, vec3(0.55)), foam);
    col = mix(col, mistCol(N), mistAmt(vW, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
// ---- VALLE's foam: a V on each house's surge (north) side and a ring in its last 6 m, riding the water (lifted a little more with distance to keep clear of the sea's depth)
const FOAM_VS = `uniform vec4 uSw[3]; uniform vec3 uPh; uniform float uSeaY; attribute vec3 aF; varying vec3 vW; varying vec3 vF; varying float vD;
  float swell(vec2 p){ float y = 0.0; for (int i = 0; i < 3; i++) { float ph = uSw[i].y * (p.x * uSw[i].z + p.y * uSw[i].w) - uPh[i] + float(i) * 1.3; y += uSw[i].x * sin(ph); } return y; }
  void main(){ float sy = uSeaY + swell(position.xz); vec3 p = vec3(position.x, sy, position.z); float d = distance(p, cameraPosition); p.y += 0.3 + 0.0016 * d; vW = p; vF = aF; vD = sy - aF.z; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`;
const FOAM_FS = GLC + `varying vec3 vW; varying vec3 vF; varying float vD;
  void main(){ float N = nightAt(vW); float lace = 0.55 + 0.45 * n2(vW.xz * 0.9 + uT * 0.6); float a = (vF.y < 0.5 ? pow(1.0 - vF.x, 1.3) : (1.0 - vF.x) * 0.9) * lace * smoothstep(0.0, 1.6, vD) * 0.92; if (a < 0.01) discard;
    vec3 col = vec3(0.90, 0.95, 0.94) * max(nightK(N), vec3(0.55)); col = mix(col, mistCol(N), mistAmt(vW, 1.0)); gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;
function foamSoup(houses) {   // positions + aF (ring param 0..1, type 0 ring / 1 V, ground y)
  const pos = [], aF = [];
  for (const h of houses) {
    if (h.zone !== "V") continue; const c = Math.cos(h.rot), s = Math.sin(h.rot), hw = h.w / 2 + 0.3, hd = h.d / 2 + 0.3, ow = hw + 6, od = hd + 6, L = (u, v) => [h.x + u * c + v * s, h.z - u * s + v * c], g = h.lo;
    const ring = [[[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]], [[-ow, -od], [ow, -od], [ow, od], [-ow, od]]];
    for (let i = 0; i < 4; i++) { const a = L(...ring[0][i]), b = L(...ring[0][(i + 1) % 4]), C = L(...ring[1][(i + 1) % 4]), D = L(...ring[1][i]); for (const [p, q, f] of [[a, 0], [b, 0], [C, 1], [a, 0], [C, 1], [D, 1]].map((x) => [x[0], null, x[1]])) { pos.push(p[0], 0, p[1]); aF.push(f, 0, g); } }
    const apex = L(0, -hd - 18), l = L(-hw - 3, -hd), r = L(hw + 3, -hd); for (const [p, f] of [[l, 0], [r, 0], [apex, 1]]) { pos.push(p[0], 0, p[1]); aF.push(f, 1, g); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute("aF", new THREE.BufferAttribute(new Float32Array(aF), 3)); return g;
}
// ---- floating pieces (36): 17 beams, 14 roof slabs, 5 trunks, riding the surge through VALLE
function piecesSoup() {
  const S = new Soup(), parts = [], R_ = rngOf(SEED + 910), wood = [lin("#8A5A3C"), lin("#6B4531"), lin("#A87A52")], tileC = [lin("#B5543A"), lin("#C76A45"), lin("#A64B36")];
  const boxP = (len, h, d, col) => { const pt = S.begin(), x = len / 2, y = h / 2, z = d / 2, q = (a, b, c, e, k = 1) => S.quad(a, b, c, e, scl(col, k)); q([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]); q([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], 0.85); q([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], 1.1); q([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], 0.9); q([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], 0.9); return S.end(pt); };
  for (let i = 0; i < 36; i++) {
    let pt, kind; if (i < 17) { kind = "beam"; pt = boxP(lerp(3, 7, R_()), 0.22, 0.3, wood[i % 3]); } else if (i < 31) { kind = "slab"; pt = boxP(3, 0.16, 2, tileC[i % 3]); } else {
      kind = "trunk"; const L = lerp(8, 12, R_()), r = 0.45; pt = S.begin(); for (let k = 0; k < 6; k++) { const a0 = k * TAU / 6, a1 = (k + 1) * TAU / 6, c = scl(wood[1], 0.8 + 0.2 * Math.cos(a0 + 0.7)); S.quad([-L / 2, Math.cos(a0) * r, Math.sin(a0) * r], [L / 2, Math.cos(a0) * r * 0.75, Math.sin(a0) * r * 0.75], [L / 2, Math.cos(a1) * r * 0.75, Math.sin(a1) * r * 0.75], [-L / 2, Math.cos(a1) * r, Math.sin(a1) * r], c); S.tri([-L / 2, 0, 0], [-L / 2, Math.cos(a0) * r * 1.9, Math.sin(a0) * r * 1.9], [-L / 2 - 0.8, Math.cos(a1) * r * 2.3, Math.sin(a1) * r * 2.3], scl(wood[0], 0.9)); } S.end(pt);
    }
    const front = i < 24 ? WALLS[2] : WALLS[3], x = lerp(715, 930, R_()), z = lerp(-1330, -1170, R_());
    Object.assign(pt, { kind, x, z, tb: (z - front.z0) / front.v, vz: lerp(9, 14, R_()), vx: (R_() - 0.5) * 3, w: lerp(10, 40, R_()) * DEG * (R_() < 0.5 ? -1 : 1), yaw0: R_() * TAU, ph: R_() * TAU });
    parts.push(pt);
  }
  return { S, parts };
}
function sseaKind(P) {
  const Sp = P.spec, O = Sp.origin ?? [0, 0, 0], W = getWorld(), U = makeU(), G = new THREE.Group(); P.whole.add(G);
  const swU = { uSw: { value: [0, 1, 2].map(() => new THREE.Vector4()) }, uPh: { value: new THREE.Vector3() }, uWall: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) } };
  // sea surface: 56 x 72 cells (spec.seaCols 28 behind a window or the street), graded: dense under the street end and toward the middle
  const NXs = Sp.seaCols ?? 56, NZs = 72, xs = [], zs = [];
  for (let i = 0; i <= NXs; i++) { const s = (i / NXs) * 2 - 1; xs.push(Math.sign(s) * Math.pow(Math.abs(s), 1.7) * 2800); }
  for (let j = 0; j <= NZs; j++) zs.push(-(40 + 5560 * Math.pow(j / NZs, 1.8)));
  { const pos = new Float32Array((NXs + 1) * (NZs + 1) * 3), idx = []; for (let j = 0; j <= NZs; j++) for (let i = 0; i <= NXs; i++) pos.set([xs[i], 0, zs[j]], (j * (NXs + 1) + i) * 3);
    for (let j = 0; j < NZs; j++) for (let i = 0; i < NXs; i++) { const a = j * (NXs + 1) + i, b = a + 1, c = a + NXs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, ...swU, uHm: { value: once("hmTex", () => seaHeightTex(W)) }, uWc: { value: whitecapTex() }, uCover: { value: 0.35 }, uAmp: { value: 3 } }, vertexShader: SEA_VS, fragmentShader: SEA_FS, transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: false }));
    G.add(lookOnly(new THREE.Mesh(g, m), 2)); }
  // the walls
  const wallMats = noLine(new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: WALL_VS, fragmentShader: WALL_FS, side: THREE.DoubleSide, fog: false }));
  const wl = WALLS.map((w) => {
    const nx = w.nx, NV = (nx + 1) * NP, pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), aP = new Float32Array(NV * 4), idx = [];
    for (let i = 0; i < nx; i++) for (let k = 0; k < NP - 1; k++) { const a = i * NP + k, b = (i + 1) * NP + k, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("aP", new THREE.BufferAttribute(aP, 4)); g.setIndex(idx);
    pos.fill(0); const me = lookOnly(new THREE.Mesh(g, wallMats), 1); G.add(me);
    // impact time: the front meets ground higher than the water (after the town, or at the slope toe for the first two)
    let tI = 99; if (w.zStop != null) tI = (w.zStop - w.z0) / w.v; else for (let t = 0; t < 40; t += 0.02) { const zf = w.z0 + w.v * t; if (zf > -1000) { let b = 0; for (let k = 0; k < 12; k++) if (Hm(W, lerp(w.x0, w.x1, (k + 0.5) / 12), zf) > seaY(t) + 3) b++; if (b >= 5) { tI = t; break; } } }
    return { ...w, g, pos, nor, aP, me, tI, h: new Float32Array(nx + 1), zc: new Float32Array(nx + 1), by: new Float32Array(nx + 1), cols: [] };
  });
  // sprites: breakers 48, per wall 30 crest billows + 16 spray + 22 impact spray
  const NB = 48, spr = new Sprites(NB + 4 * (30 + 16 + 22), U, 10); G.add(spr.mesh);
  for (let i = 0; i < NB; i++) spr.col(i, lin("#B9C9D6"), lin("#F4F8F6")); for (let i = NB; i < spr.n; i++) spr.col(i, lin("#B9C9D6"), lin("#F4F8F6")); spr.colTouch();
  const ray = Array.from({ length: NB }, (_, i) => { const x = -1100 + 46.8 * i, zs_ = [], hs = []; for (let z = -20; z > -3000; z -= 6) { zs_.push(z); hs.push(Hm(W, x, z)); } return { x, zs: zs_, hs }; });
  // foam rings, floating pieces
  const fm = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, ...swU }, vertexShader: FOAM_VS, fragmentShader: FOAM_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })); G.add(lookOnly(new THREE.Mesh(foamSoup(W.houses), fm), 6));
  const pcs = piecesSoup(), pgeo = pcs.S.geometry(true), pmesh = lookOnly(new THREE.Mesh(pgeo, solidMat(U, "plain")), 1); G.add(pmesh);
  const Mt = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const colOf = (w, x) => clamp((x - w.x0) / (w.x1 - w.x0));
  return {
    grip: 0, seaMesh: null,
    apply(ps) {
      const t = ps.t ?? Sp.t ?? 0, rs = Math.max(ps.scale, 1e-4); G.position.set((O[0] - ps.x) / rs, (O[1] - ps.y) / rs, (O[2] - ps.z) / rs); G.scale.setScalar(1 / rs);
      const e = envAt(t); setU(U, e, t); const sk = swellK(t), sy = seaY(Math.max(0, t)), amp = (SW[0][0] + SW[1][0] + SW[2][0]) * sk.hm, sm = G.children[0].material;
      for (let i = 0; i < 3; i++) { const [a, L, hd, c] = SW[i], k = TAU / L, h = hd * DEG; swU.uSw.value[i].set(a * sk.hm, k, Math.sin(h), Math.cos(h)); swU.uPh.value.setComponent(i, k * c * sk.tau); }
      sm.uniforms.uCover.value = lerp(0.35, 0.80, clamp((spin(t) - 2) / 8)); sm.uniforms.uAmp.value = amp;
      // walls
      wl.forEach((w, wi) => {
        const nx = w.nx, zf = w.z0 + w.v * t, xm = (w.x0 + w.x1) / 2, flat = t > w.tI ? sstep(0, 1.2, t - w.tI) : 0, vis = flat < 1 && t >= 0;
        for (let i = 0; i <= nx; i++) {
          const u = i / nx, x = lerp(w.x0, w.x1, u), zc = zf + 0.00005 * (x - xm) ** 2 + 6 * (vnoise(x / 70, 3, wi) - 0.5), g = Hm(W, x, zc), depth = sy - g, env = Math.min(sstep(0, 0.14, u), sstep(1, 0.86, u));
          const open = w.bore ? (w.bore + (w.H - w.bore) * sstep(2, 60, depth)) : w.H * sstep(0, 8, depth);   // fix r0: full height over any open water (the valley floor is only 12-14 m under at 0 s: sstep(0, 25) gave W1 ~100 m and the terrain edge hid it until 1.2 s)
          w.h[i] = (depth < 0.5 ? 0 : open) * env * (1 + 0.1 * (vnoise(x / 55, 7, wi) - 0.5)) * (1 - flat); w.zc[i] = zc;
        }
        for (let i = 0; i <= nx; i++) { const a = w.h[Math.max(0, i - 1)], b = w.h[i], c = w.h[Math.min(nx, i + 1)]; w.cols[i] = 0.25 * a + 0.5 * b + 0.25 * c; }
        let top = 0; for (let i = 0; i <= nx; i++) top = Math.max(top, w.cols[i]);
        for (let i = 0; i <= nx; i++) {
          const x = lerp(w.x0, w.x1, i / nx), h = vis ? Math.max(w.cols[i], 0.01) : 0.01;
          for (let k = 0; k < NP; k++) { const o = (i * NP + k) * 3, z = w.zc[i] + PROFILE[k][0] * h, yb = sy + swellH(x, z, t, sk); w.pos[o] = x; w.pos[o + 1] = yb + PROFILE[k][1] * h; w.pos[o + 2] = z; w.aP.set([PROFILE[k][1], k, h, i / nx], (i * NP + k) * 4); }
        }
        const P_ = w.pos;   // normals from the strip's neighbours
        for (let i = 0; i <= nx; i++) for (let k = 0; k < NP; k++) {
          const i0 = Math.max(0, i - 1), i1 = Math.min(nx, i + 1), k0 = Math.max(0, k - 1), k1 = Math.min(NP - 1, k + 1), a = (i1 * NP + k) * 3, b = (i0 * NP + k) * 3, c = (i * NP + k1) * 3, d = (i * NP + k0) * 3;
          const ux = P_[a] - P_[b], uy = P_[a + 1] - P_[b + 1], uz = P_[a + 2] - P_[b + 2], vx = P_[c] - P_[d], vy = P_[c + 1] - P_[d + 1], vz = P_[c + 2] - P_[d + 2];
          let nx_ = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx_, ny, nz) || 1; nx_ /= l; ny /= l; nz /= l;
          w.nor.set([nx_, ny, nz], (i * NP + k) * 3);
        }
        w.g.attributes.position.needsUpdate = w.g.attributes.normal.needsUpdate = w.g.attributes.aP.needsUpdate = true;
        sm.uniforms.uWall.value[wi].set(w.x0, w.x1, zf, vis ? top : 0);
        // crest billows (30), thrown spray (16), impact spray (22)
        const b0 = NB + wi * 68, Hs = Math.pow(Math.max(top, 1) / 220, 0.7);
        for (let j = 0; j < 30; j++) {
          const u = (j + 0.5 + (hash(wi, j, 1) - 0.5) * 0.7) / 30, ci = Math.round(u * nx), h = w.cols[ci], x = lerp(w.x0, w.x1, u), r = lerp(40, 90, hash(wi, j, 2)) * 0.5 * Hs * (0.7 + 0.3 * Math.min(1, h / Math.max(top, 1)));
          spr.set(b0 + j, x, sy + swellH(x, w.zc[ci], t, sk) + 0.97 * h, w.zc[ci] + 0.03 * h + 2, r, vis && h > 2 ? 0.92 : 0, j % 2, hash(wi, j, 3) * TAU + t * (hash(wi, j, 4) - 0.5), 1.1);
        }
        for (let j = 0; j < 16; j++) {
          const u = (j + 0.5) / 16, ci = Math.round(u * nx), h = w.cols[ci], x = lerp(w.x0, w.x1, u) + (hash(wi, j, 5) - 0.5) * 30, k = fract(t * 0.9 + hash(wi, j, 6)), ahead = lerp(20, 60, hash(wi, j, 7)) * Hs;
          spr.set(b0 + 30 + j, x, sy + 0.95 * h + 0.35 * h * 0.2 * 4 * k * (1 - k) * 2 + 4, w.zc[ci] + ahead * k, 7 + 10 * Hs, vis && h > 4 ? 0.75 * Math.sin(Math.PI * k) : 0, 2, hash(wi, j, 8) * TAU, 1);
        }
        for (let j = 0; j < 22; j++) {
          const a = clamp((t - w.tI - j * 0.02) / 1.6), x = lerp(w.x0, w.x1, (j + 0.5 + (hash(wi, j, 9) - 0.5)) / 22), zz = w.z0 + w.v * w.tI, up = lerp(60, 140, hash(wi, j, 10)), on = t > w.tI && a < 1;
          spr.set(b0 + 46 + j, x, sy + 8 + up * Math.sin(a * Math.PI / 2) * (1 - 0.15 * a), zz + 30 * a + 10 * hash(wi, j, 11), 16 + 22 * a, on ? 0.9 * Math.sin(Math.PI * clamp(a * 0.9 + 0.05)) : 0, 2 + (j % 2), hash(wi, j, 12) * TAU, 1);
        }
      });
      // breakers: 48 on shore rays, each where its ray meets the sea
      for (let i = 0; i < NB; i++) {
        const r = ray[i]; let zS = null; for (let k = 0; k < r.hs.length; k++) if (r.hs[k] < sy) { zS = r.zs[k]; break; }
        const k = fract(t / 1.4 + hash(i, 1, 13)), size = lerp(8, 30, k) * 0.5, a = zS == null ? 0 : 0.8 * Math.sin(Math.PI * k) ** 1.2;
        spr.set(i, r.x, sy + 9 * k + size * 0.5 + 1, (zS ?? 0) - 3 * k, size, a, i % 2, hash(i, 2, 13) * TAU, 1.25);
      }
      spr.touch();
      // floating pieces
      pcs.parts.forEach((pt, pi) => {
        const e2 = t - pt.tb; if (e2 <= 0) { s3.set(1e-4, 1e-4, 1e-4); Mt.compose(p3.set(0, -9999, 0), qt.identity(), s3); pt.M.copy(Mt); pcs.S.place(pt); return; }
        const tt = Math.min(e2, 5) + 0.12 * Math.max(0, e2 - 5), x = pt.x + pt.vx * tt, z = pt.z + pt.vz * tt, y = Math.max(sy + swellH(x, z, t, sk), Hm(W, x, z) + 0.15) + 0.12 + 0.1 * Math.sin(e2 * 3 + pt.ph);
        eu.set(0.16 * Math.sin(e2 * 2.1 + pt.ph), pt.yaw0 + pt.w * e2, 0.12 * Math.sin(e2 * 1.7 + pt.ph * 2), "YXZ"); qt.setFromEuler(eu); const k = sstep(0, 0.2, e2); s3.set(k, k, k);
        Mt.compose(p3.set(x, y, z), qt, s3); pt.M.copy(Mt); pcs.S.place(pt);
      });
      pcs.S.pa.needsUpdate = true; pcs.S.na.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------------------------------------ shigh: G, high above Quito (world HI); sphere radius 2400 at the HI origin, the point under the camera is (0, 2400, 0)
const HI_R = 2400, FLOOD = 8;
const HI_PK = { W: [[-160, 30], [-420, 46], [-690, 24], [-940, 40], [-1240, 34], [-1560, 28], [-1900, 20]], E: [[-260, 26], [-520, 36], [-800, 44], [-1090, 22], [-1380, 38], [-1720, 30], [-2060, 18]] };   // 14 peaks (18-46); 6 stand over 33 and carry snow
const HI_ISL = [[260, -300, 14], [330, -650, 20], [420, -980, 16], [560, -420, 22], [610, -1300, 18], [480, -1700, 24], [760, -900, 14], [700, -2000, 20]];
function hiRelief(u, w) {
  const uw = -58 + 14 * Math.sin(w / 190 + 0.6), ue = 58 + 12 * Math.sin(w / 210 + 2.1);
  let h = 10 + 1.6 * (fbm(u / 45, w / 45, 201, 2) - 0.5), rg = 0;
  for (const [pk, uc] of [[HI_PK.W, uw], [HI_PK.E, ue]]) {
    let A = 11; for (const [wk, hk] of pk) A += (hk - 11) * Math.exp(-(((w - wk) / 80) ** 2));
    const d = (u - uc) / 36; rg = Math.max(rg, (A - 10) * Math.exp(-d * d) * (0.86 + 0.28 * fbm(u / 22, w / 22, 203, 2)));
  }
  h += rg; h *= 1 - 0.86 * sstep(95, 185, Math.abs(u));
  for (const [ui, wi, hi] of HI_ISL) h = Math.max(h, 6 + hi * Math.exp(-(((u - ui) / 46) ** 2 + ((w - wi) / 90) ** 2)) * (0.8 + 0.4 * fbm(u / 25, w / 25, 205, 2)));
  return h;
}
const HI_MAP = { u0: -1280, u1: 1280, w0: 200, w1: -2800 }, HI_INS = { u0: -150, u1: 150, w0: -420, w1: -960 };
const QUITO_DOTS = once("quito", () => {
  const R_ = rngOf(SEED + 1200), out = [], cores = [-520, -700, -880];
  for (let i = 0; i < 2200; i++) { const core = R_() < 0.5, w = core ? cores[(R_() * 3) | 0] + (R_() + R_() + R_() - 1.5) * 90 : -450 - 500 * R_(), u = (R_() + R_() + R_() - 1.5) * (core ? 34 : 56) + 8 * Math.sin(w / 120); out.push([u, w, R_() < 0.6 ? 0 : 1, 0.6 + 0.4 * R_()]); }
  [[-25, -1200], [30, -1450], [-15, -1700], [40, -1900], [-30, -2150], [20, -2400]].forEach(([tu, tw], k) => { const n = 60 + ((k * 17) % 80); for (let i = 0; i < n; i++) { const a = R_() * TAU, r = (14 + 10 * R_()) * Math.sqrt(R_()); out.push([tu + Math.cos(a) * r * 0.7, tw + Math.sin(a) * r * 1.4, R_() < 0.6 ? 0 : 1, 0.55 + 0.4 * R_()]); } });
  return out;
});
const SRGB_LUT = once("srgbLut", () => Uint8Array.from({ length: 1201 }, (_, i) => { const x = Math.min(1, i / 1000); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)); }));
function hiPaint(Wd, Hd, ext, GN) {   // returns { rgba, lights }: colour + sea fraction (alpha), and the lights (Quito's 2,200 dots, six towns)
  const du = (ext.u1 - ext.u0) / Wd, dw = (ext.w1 - ext.w0) / Hd, gu = (ext.u1 - ext.u0) / GN, gw = (ext.w1 - ext.w0) / GN, NG = GN + 1, grid = new Float32Array(NG * NG), shd = new Float32Array(NG * NG);
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) grid[j * NG + i] = hiRelief(ext.u0 + i * gu, ext.w0 + j * gw);
  const L = [0.25, 0.55, 0.8], ll = Math.hypot(...L);
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const g = (jj, ii) => grid[Math.min(NG - 1, Math.max(0, jj)) * NG + Math.min(NG - 1, Math.max(0, ii))], gx = (g(j, i + 1) - g(j, i - 1)) / (2 * Math.abs(gu)), gz = (g(j + 1, i) - g(j - 1, i)) / (2 * gw), nx = -gx * 3.2, nz = -gz * 3.2, nl = Math.hypot(nx, 1, nz);
    shd[j * NG + i] = clamp(0.5 + 0.7 * ((nx * L[0] + L[1] + nz * L[2]) / (nl * ll)), 0.45, 1.25);
  }
  const bil = (A, u, w) => { const fx = clamp((u - ext.u0) / gu, 0, GN - 0.001), fz = clamp((w - ext.w0) / gw, 0, GN - 0.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, o = j * NG + i; return (A[o] * (1 - a) + A[o + 1] * a) * (1 - b) + (A[o + NG] * (1 - a) + A[o + NG + 1] * a) * b; };
  const rgba = new Uint8Array(Wd * Hd * 4), lights = new Uint8Array(Wd * Hd);
  const C = { sea: lin("#1F4666"), seaS: lin("#2E6C8E"), foam: lin("#F4F8F6"), paramo: lin("#6E7F4E"), ridge: lin("#7A6A50"), valley: lin("#5E8A44"), forest: lin("#2F5F34"), snow: lin("#F2F0EE"), snowSh: lin("#B9C2DA") }, t3 = [0, 0, 0];
  const mx = (a, b, k) => { t3[0] = a[0] + (b[0] - a[0]) * k; t3[1] = a[1] + (b[1] - a[1]) * k; t3[2] = a[2] + (b[2] - a[2]) * k; return t3; };
  const enc = (x) => SRGB_LUT[Math.min(1200, Math.max(0, (x * 1000) | 0))];
  for (let py = 0; py < Hd; py++) for (let px = 0; px < Wd; px++) {
    const u = ext.u0 + (px + 0.5) * du, w = ext.w0 + (py + 0.5) * dw, h = bil(grid, u, w), o = (py * Wd + px) * 4, nz = vnoise(u / 7, w / 7, 311);
    let c, a = 0, sh = 1;
    if (h < FLOOD) {
      const dep = FLOOD - h, lace = 1 - sstep(0, 1.3, dep + (nz - 0.5) * 1.5); c = mx(C.seaS, C.sea, sstep(0, 5, dep)); sh = 0.92 + 0.16 * nz; if (lace > 0) { sh = sh * (1 - lace) + lace; c = mx(c, C.foam, lace * 0.9); } a = Math.round(255 * clamp(1 - lace));
    } else {
      sh = bil(shd, u, w) * (0.94 + 0.12 * nz); const ru = Math.abs(u);
      if (h > 33 - 2.5 * nz) c = mx(C.snow, C.snowSh, sstep(0.95, 0.65, sh));
      else if (h > 22) c = mx(C.ridge, C.paramo, sstep(0.9, 1.1, sh) * 0.6 + 0.3 * nz);
      else if (ru < 60 && h < 14) c = mx(C.valley, C.forest, 0.25 * nz);
      else if (h < 26 && ru >= 60) c = mx(C.forest, C.valley, 0.3 * nz);
      else c = mx(C.paramo, C.forest, 0.5);
      const lace = 1 - sstep(0, 1.1, h - FLOOD + (nz - 0.5)); if (lace > 0) c = mx(c, C.foam, lace * 0.7);
    }
    rgba[o] = enc(c[0] * sh); rgba[o + 1] = enc(c[1] * sh); rgba[o + 2] = enc(c[2] * sh); rgba[o + 3] = a;
  }
  const rad = Math.max(1, Math.round(1.7 / Math.min(Math.abs(du), Math.abs(dw))));
  for (const [u, w, , k] of QUITO_DOTS) { const px = Math.round((u - ext.u0) / du), py = Math.round((w - ext.w0) / dw); for (let dy = -rad + 1; dy <= rad; dy++) for (let dx = -rad + 1; dx <= rad; dx++) { const x = px + dx, y = py + dy; if (x < 0 || y < 0 || x >= Wd || y >= Hd) continue; const o = y * Wd + x; lights[o] = Math.max(lights[o], Math.round(255 * k * (1 - 0.3 * Math.hypot(dx - 0.5, dy - 0.5) / rad))); } }
  return { rgba, lights };
}
function hiMaps() {
  return once("hiMaps", () => {
    const base = hiPaint(2048, 2048, HI_MAP, 640), ins = hiPaint(1024, 1024, HI_INS, 300);
    const mk = (d, n, fmt) => { const t = new THREE.DataTexture(d, n, n, fmt); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; return t; };
    const mapT = mk(base.rgba, 2048, THREE.RGBAFormat), insT = mk(ins.rgba, 1024, THREE.RGBAFormat); mapT.colorSpace = insT.colorSpace = THREE.SRGBColorSpace;   // sRGB bytes; the alpha holds the sea fraction
    return { mapT, insT, ligT: mk(base.lights, 2048, THREE.RedFormat), ligI: mk(ins.lights, 1024, THREE.RedFormat) };
  });
}
const sphereP = (u, w, y) => { const d = Math.hypot(u, w), th = d / HI_R, ph = Math.atan2(w, u), r = HI_R + y; return [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)]; };
const CAP_VS = `attribute vec2 aMap; attribute vec2 aIns; varying vec2 vM; varying vec2 vI; varying vec3 vW; varying vec3 vN; void main(){ vM = aMap; vI = aIns; vN = normal; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CAP_FS = GLC + `uniform sampler2D uMap; uniform sampler2D uIns; uniform sampler2D uLig; uniform sampler2D uLigI; varying vec2 vM; varying vec2 vI; varying vec3 vW; varying vec3 vN;
  void main(){
    vec4 m = texture2D(uMap, vM); vec3 col = m.rgb; float sea = m.a, lig = texture2D(uLig, vM).r;
    float inI = step(0.0, vI.x) * step(vI.x, 1.0) * step(0.0, vI.y) * step(vI.y, 1.0), ef = smoothstep(0.0, 0.06, vI.x) * smoothstep(1.0, 0.94, vI.x) * smoothstep(0.0, 0.06, vI.y) * smoothstep(1.0, 0.94, vI.y);
    if (inI > 0.5) { vec4 mi = texture2D(uIns, vI); col = mix(col, mi.rgb, ef); sea = mix(sea, mi.a, ef); lig = mix(lig, texture2D(uLigI, vI).r, ef); }
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float N = nightAt(vW); vec3 nk = nightK(N);
    vec2 mp = vec2(vM.x * 2560.0, vM.y * 3000.0);
    float s1 = step(0.80, h21(floor((mp + vec2(0.0, uT * 4.0)) / 3.0))) * step(length(fract((mp + vec2(0.0, uT * 4.0)) / 3.0) - 0.5), 0.30), s2 = step(0.84, h21(floor((mp + vec2(0.0, uT * 9.0)) / 5.5) + 17.0)) * step(length(fract((mp + vec2(0.0, uT * 9.0)) / 5.5) - 0.5), 0.26);
    col = mix(col, vec3(0.62, 0.90, 0.86), clamp(s1 * 0.55 + s2 * 0.5, 0.0, 0.7) * sea);
    float nl = dot(n, uLdir), g = mix(0.84, 1.0, smoothstep(0.1, 0.5, nl)); col *= g * mix(vec3(0.96, 0.98, 1.06), vec3(1.05, 0.99, 0.92), smoothstep(0.3, 0.7, nl));
    col *= nk;
    float lightsOn = max(smoothstep(0.42, 0.58, mix(0.45, N, uA)), step(uA, 0.5) * 0.8);
    col += mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.76, 0.40), step(0.5, n2(vM * 1900.0))) * lig * lightsOn * 2.4;
    col = mix(col, mistCol(N), mistAmt(vW, 0.9));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
const BAND_AIR_VS = `uniform vec3 uC; uniform float uR; attribute vec2 aB; varying float vE;
  void main(){ vec3 cp = cameraPosition - uC; float D = length(cp); vec3 up = cp / D; vec3 f0 = vec3(0.0, 0.0, -1.0); vec3 fw = normalize(f0 - up * dot(f0, up)); vec3 rt = cross(fw, up);
    float dip = acos(clamp(uR / D, 0.0, 1.0)), depr = dip - radians(aB.y); vec3 dir = (fw * cos(aB.x) + rt * sin(aB.x)) * cos(depr) - up * sin(depr); vE = aB.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + dir * 5200.0, 1.0); }`;
const BAND_AIR_FS = `varying float vE; uniform vec3 uK0; uniform vec3 uK1; uniform vec3 uK2; uniform vec3 uK3;
  void main(){ vec3 c = vE < 0.4 ? uK0 : vE < 1.2 ? mix(uK0, uK1, (vE - 0.4) / 0.8) : vE < 3.0 ? mix(uK1, uK2, (vE - 1.2) / 1.8) : vE < 8.0 ? mix(uK2, uK3, (vE - 3.0) / 5.0) : uK3; float a = vE < 8.0 ? 1.0 : 1.0 - smoothstep(8.0, 16.0, vE);
    gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }`;
const BLOB_VS = `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vN = mat3(modelMatrix) * normal; vV = cameraPosition - wp.xyz; vP = position; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BLOB_FS = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
  float hh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float nn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(hh(i), hh(i + vec3(1, 0, 0)), f.x), mix(hh(i + vec3(0, 1, 0)), hh(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(hh(i + vec3(0, 0, 1)), hh(i + vec3(1, 0, 1)), f.x), mix(hh(i + vec3(0, 1, 1)), hh(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  void main(){
    vec3 n = normalize(vN), v = normalize(vV); float rim = pow(1.0 - abs(dot(n, v)), 2.2);
    vec3 body = vec3(0.0497, 0.3418, 0.4564), edge = vec3(0.0137, 0.1144, 0.1946);
    vec3 col = mix(body, edge, rim);
    float vein = 1.0 - smoothstep(0.0, 0.06, abs(nn(vP * 2.6) - 0.5)); col = mix(col, vec3(0.34, 0.74, 0.74), vein * 0.35 * (1.0 - rim));
    float sun = smoothstep(0.2, 0.9, dot(n, normalize(vec3(0.62, 0.28, -0.72)))); col = mix(col, vec3(1.0, 0.48, 0.25), sun * 0.30);
    float h1 = pow(max(dot(n, normalize(vec3(-0.45, 0.62, 0.64))), 0.0), 28.0), h2 = pow(max(dot(n, normalize(vec3(-0.2, 0.75, 0.62))), 0.0), 90.0), h3 = pow(max(dot(n, normalize(vec3(0.5, -0.3, 0.8))), 0.0), 60.0) * 0.5;
    col = mix(col, vec3(1.0), clamp(h1 * 0.55 + h2 + h3, 0.0, 1.0));
    float a = mix(0.42, 0.75, rim); a = max(a, clamp(h1 * 0.55 + h2 + h3, 0.0, 0.95));
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;
function blobGeo(seed) {   // icosphere (320 triangles), the top flattened to a cap, the underside pulled into 3-5 drip lobes
  const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, nl = 3 + Math.floor(hash(seed, 1) * 3), ph = hash(seed, 2) * TAU;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const an = Math.atan2(z, x);
    if (y > 0.35) y = 0.35 + (y - 0.35) * 0.45;
    if (y < -0.05) { const lobe = Math.pow(Math.max(0, Math.cos(nl * (an - ph))), 2); y -= lobe * 0.75 * (-y); const k = 1 - 0.25 * lobe * (-y); x *= k; z *= k; }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); return g;
}
function shighKind(P) {
  const Sp = P.spec, O = Sp.origin ?? [40000, 0, 0], U = makeU(), G = new THREE.Group(); P.whole.add(G);
  const M = hiMaps();
  // cap: a graded grid on the sphere (equidistant), 64 x 32 cells, the cordilleras as relief; the sea is flat at the flood line
  { const NXc = 64, NZc = 32, us = [], ws = []; for (let i = 0; i <= NXc; i++) { const s = (i / NXc) * 2 - 1; us.push(Math.sign(s) * Math.pow(Math.abs(s), 1.6) * 1200); } for (let j = 0; j <= NZc; j++) ws.push(lerp(150, -2800, j / NZc));
    const pos = [], map = [], ins = [], hts = ws.map((w) => us.map((u) => Math.max(hiRelief(u, w), FLOOD)));
    const P_ = (j, i) => sphereP(us[i], ws[j], hts[j][i]);
    for (let j = 0; j <= NZc; j++) for (let i = 0; i <= NXc; i++) { const p = P_(j, i); pos.push(...p); map.push((us[i] - HI_MAP.u0) / (HI_MAP.u1 - HI_MAP.u0), (HI_MAP.w0 - ws[j]) / (HI_MAP.w0 - HI_MAP.w1)); ins.push((us[i] - HI_INS.u0) / (HI_INS.u1 - HI_INS.u0), (ws[j] - HI_INS.w0) / (HI_INS.w1 - HI_INS.w0)); }
    const nor = new Float32Array(pos.length), idx = [];
    for (let j = 0; j <= NZc; j++) for (let i = 0; i <= NXc; i++) { const a = P_(j, Math.min(NXc, i + 1)), b = P_(j, Math.max(0, i - 1)), c = P_(Math.min(NZc, j + 1), i), d = P_(Math.max(0, j - 1), i); const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } nor.set([nx / l, ny / l, nz / l], (j * (NXc + 1) + i) * 3); }
    for (let j = 0; j < NZc; j++) for (let i = 0; i < NXc; i++) { const a = j * (NXc + 1) + i, b = a + 1, c = a + NXc + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("aMap", new THREE.Float32BufferAttribute(map, 2)); g.setAttribute("aIns", new THREE.Float32BufferAttribute(ins, 2)); g.setIndex(idx);
    const m = noLine(new THREE.ShaderMaterial({ uniforms: { ...U, uMap: { value: M.mapT }, uIns: { value: M.insT }, uLig: { value: M.ligT }, uLigI: { value: M.ligI } }, vertexShader: CAP_VS, fragmentShader: CAP_FS, side: THREE.DoubleSide, fog: false }));
    G.add(lookOnly(new THREE.Mesh(g, m), 0)); }
  // air: a band along the limb (6 rings, 64 segments over +-72 deg), placed round the camera in the vertex shader
  { const rings = [0, 0.4, 1.2, 3, 8, 16], NS = 64, pos = [], b = [], idx = []; for (let r = 0; r < rings.length; r++) for (let i = 0; i <= NS; i++) { pos.push(0, 0, 0); b.push((-72 + (144 * i) / NS) * DEG, rings[r]); }
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < NS; i++) { const a = r * (NS + 1) + i, c = a + NS + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aB", new THREE.Float32BufferAttribute(b, 2)); g.setIndex(idx);
    const m = noLine(new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Vector3() }, uR: { value: HI_R }, uK0: { value: V3(lin("#BFE0FF")) }, uK1: { value: V3(lin("#5F8FE0")) }, uK2: { value: V3(lin("#2B3470")) }, uK3: { value: V3(lin("#0A0E24")) } }, vertexShader: BAND_AIR_VS, fragmentShader: BAND_AIR_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    G.add(lookOnly(new THREE.Mesh(g, m), 1)); G.userData.air = m; }
  // cloud sea: 96 lobes of 2 sprites in two banks, tops sheared toward -x; and the rising water: 9 blobs with 4 teardrops each
  const NC = 192, NB = 9, spr = new Sprites(NC + NB * 4, U, 12); G.add(spr.mesh);
  const lobes = Array.from({ length: 96 }, (_, i) => { const bank = i < 48 ? -1 : 1, R_ = (k) => hash(i, k, 55); return { bank, u0: bank * lerp(150, 520, R_(1)), w: lerp(-170, -1700, R_(2) ** 1.4), y: lerp(20, 40, R_(3)), r: lerp(26, 70, R_(4)), s: lerp(0.5, 1.2, R_(5)), ph: R_(6) * TAU }; });
  for (let i = 0; i < NC; i++) spr.col(i, lin("#7C86B8"), lin("#F2F0F4")); for (let i = NC; i < spr.n; i++) spr.col(i, lin("#1F5F7A"), lin("#BFEFF2")); spr.colTouch();
  const blobs = Array.from({ length: NB }, (_, i) => { const m = new THREE.Mesh(blobGeo(i), new THREE.ShaderMaterial({ vertexShader: BLOB_VS, fragmentShader: BLOB_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })); noLine(m.material); lookOnly(m, 13); G.add(m);
    const R_ = (k) => hash(i, k, 66), d = lerp(8, 60, (i / (NB - 1)) ** 1.3); return { m, d, yaw: (R_(1) - 0.5) * 22 * DEG, pit: (R_(2) - 0.5) * 18 * DEG, size: Math.min([3.2, 4, 1.5, 6, 2.2, 5, 1.8, 4.5, 2.8][i], 0.16 * d + 0.4), rise: lerp(2, 6, R_(3)), ph: R_(4) * TAU }; });
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? Sp.t ?? 0, rs = Math.max(ps.scale, 1e-4); G.position.set((O[0] - ps.x) / rs, (O[1] - ps.y) / rs, (O[2] - ps.z) / rs); G.scale.setScalar(1 / rs);
      setU(U, envAt(t), t); G.userData.air.uniforms.uC.value.set(O[0], O[1], O[2]);
      for (let i = 0; i < 96; i++) {
        const L = lobes[i], drift = L.bank * 0 + ((t * 4) % 160), x0 = L.u0 - drift, wrap = x0 < -700 ? x0 + 1400 : x0;
        for (let k = 0; k < 2; k++) {
          const shear = k * 26, u = wrap - shear * (1 + L.s), y = L.y + k * L.r * 0.55, p = sphereP(u, L.w, y), a = 0.8 * (k ? 0.85 : 1) * sstep(0, 0.1, 1 - Math.abs(wrap) / 700);
          spr.set(i * 2 + k, p[0], p[1], p[2], L.r * (k ? 0.75 : 1), a, 4 + ((i + k) & 1), 0.25 * Math.sin(L.ph * 3 + k), 1.6 + 0.8 * k);
        }
      }
      // the camera of DESIGN G (0, 2400 + height over the surface, 0), pitched down; the blobs ride with it
      const al = altT(t), hc = keys(al, [[0, 1100], [0.5, 1450], [1, 1784]]), pit = keys(al, [[0, 43.7], [0.5, 48.4], [1, 52]]) * DEG, cy = HI_R + hc, te = t - 55;
      blobs.forEach((b, i) => {
        const pe = pit + b.pit, ya = b.yaw, dx = Math.sin(ya) * Math.cos(pe), dy = -Math.sin(pe), dz = -Math.cos(ya) * Math.cos(pe), bx = dx * b.d, by = cy + dy * b.d + b.rise * te, bz = dz * b.d, rr = (b.size / 2) * (1 + 0.12 * Math.sin(TAU * 0.7 * t + b.ph));
        b.m.position.set(bx, by, bz); b.m.scale.set(rr * (1 + 0.05 * Math.sin(t * 1.3 + i)), rr, rr * (1 - 0.05 * Math.sin(t * 1.3 + i))); b.m.rotation.y = 12 * DEG * t + b.ph;
        for (let k = 0; k < 4; k++) { const f = (k + 1) / 4; spr.set(NC + i * 4 + k, bx + (hash(i, k, 71) - 0.5) * rr * 1.4, by - rr * (1.1 + 1.2 * f), bz + (hash(i, k, 72) - 0.5) * rr * 1.2, rr * (0.28 + 0.12 * hash(i, k, 73)), 0.62 * (1 - 0.4 * f), 6, 0, 0.55); }
      });
      spr.touch();
    },
  };
}
export const SPINANDES_KINDS = { sandes, ssea: sseaKind, shigh: shighKind };
export { seaY as spinSeaY, swellH as spinSwellH, swellK as spinSwellK, envAt as spinEnvAt, H as spinGroundH, Hm as spinGroundMesh, getWorld as spinWorld, WALLS as SPIN_WALLS };
