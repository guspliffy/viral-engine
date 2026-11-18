import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp } from "./util.js";
import { snowMaterial, farMesh, firGeometry, firMaterial, SNOWLIGHT } from "./set-snowslope.js";

// "icelake" (friends try to 12 "frozen lake", T1): a frozen lake at dusk in a snowy pine forest. Design:
// storyboards/series/friends-try-to/12-frozen-lake/DESIGN-frozen-lake.md sections 1 and 2. Everything near is 3D out to 95 m
// (bank, firs, mounds, reeds, boulders, log, spindrift); only the three hill rings and the sky dome are painted, as the design allows.
// The ice itself (cracks, hole, slab, water) is the PROP `lakeice` (props-icelake.js); this set is the world round it.
//
// WORLD FRAME (design 1): x right, y up, z toward the main camera, metres. Ice top y 0. The origin is Chip's mark. The lake
// (ICELAKE.shore) is a closed smooth curve: near bank z +2.5..+3.3, right bank x +7.3 (the jetty's root), left x -8..-10, headlands at
// (-4.2, -10) and (4.6, -11.5), far shore z -24..-26 with the gap (a 4.5 m corridor with no tree, from (-1.5, -26) heading (-0.1, -1))
// through which the hill rings show.
//
// USE:  set: { type: "icelake" }  (no keys of its own, all hashed from fixed seeds). Put a `lakeice` prop (x 0, y 0, z 0), an
//   `icejetty` and the rods and bucket on it (props-icelake.js). The set also adds the cast light (as set-coast does): key #fff1e0 1.0
//   from (-0.35, 0.80, 0.48), hemisphere #b9cdf5 / #dfe8fb 0.9, rim #a9c8ff 0.4 from (0.5, 0.5, -0.7); the cast keeps its own colours.
//   Set the usual look keys (lighting, cel, ink, satsuei ...) beside type.
// TIME: everything that moves (cloud bands 0.2 deg/s, fir tops +-0.6 deg at 0.25 Hz, 8 spindrift wisps on a 6 s loop at 1.2 m/s
//   along the wind (0.94, 0.34)) is a function of the story time (globalThis.__setTicks).
// NOT SOLID: every mesh here is look-only (userData.solid false); the jetty, rods and bucket are props.
//
// EXPORTS (the ice prop reads them): ICELAKE { shore (points), wind, glow, gap, light, cast (the light numbers) }, shoreDist(x, z)
//   (metres to the shoreline, + on the ice, - on land), bankY(x, z) (the ground's height on land, 0 on the ice), inGap(x, z).
// COUNTS (after build, ICELAKE.counts): nearFirs 46 (+ 12 young, 3 snags), farFirs 280, mounds 16, reeds 5, boulders 4, wisps 8.
// SIZE: ground out to 95 m inland of the shore, rings at r 95 / 150 / 230 m (cameras' far plane is 300 m).

const V3 = THREE.Vector3, D2R = Math.PI / 180;
const C = (h) => new THREE.Color(h);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash2 = (i, j) => { let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vnoise = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };

// ---------------------------------------------------------------------------------------------------------- the shoreline
const SHORE_CTRL = [[-6.5, 3.6], [-3.4, 2.7], [-1.5, 2.5], [-0.3, 3.3], [1.0, 2.5], [2.8, 2.8], [5.4, 1.8],                 // near
  [7.0, -0.4], [7.3, -2.8], [6.8, -6.5], [4.6, -11.5], [6.5, -15.5], [7.5, -20],                                            // right
  [4.0, -24.5], [-1.5, -26], [-6.0, -23.5],                                                                                 // far
  [-7.5, -17], [-4.2, -10.0], [-7.8, -6.0], [-9.8, -1.5], [-8.8, 1.6]];                                                     // left
const shoreBuild = () => {
  const cur = new THREE.CatmullRomCurve3(SHORE_CTRL.map(([x, z]) => new V3(x, 0, z)), true, "centripetal");
  const L = cur.getLength(), n0 = Math.round(L / 0.25), per = L / Math.max(1, Math.round(L / 3));   // the wobble's period is 3 m, whole turns round the loop
  const raw = cur.getSpacedPoints(n0).slice(0, n0);
  let area = 0; raw.forEach((p, i) => { const q = raw[(i + 1) % n0]; area += p.x * q.z - q.x * p.z; });
  const sgn = area > 0 ? 1 : -1;   // + z up the page when x right: area sign picks the outward side
  const pts = [], nor = [];
  for (let i = 0; i < n0; i++) {
    const p = raw[i], a = raw[(i + n0 - 1) % n0], b = raw[(i + 1) % n0];
    let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = tz * sgn, nz = -tx * sgn, s = (i / n0) * L;   // outward normal
    const w = 0.28 * Math.sin((2 * Math.PI * s) / per + 0.7) + 0.12 * Math.sin((2 * Math.PI * s) / (per * 0.62) + 2.1);   // +-0.4 m
    pts.push([p.x + nx * w, p.z + nz * w]); nor.push([nx, nz]);
  }
  return { pts, nor, n: n0, length: L };
};
const SH = shoreBuild();
const SX = new Float32Array(SH.n), SZ = new Float32Array(SH.n);
SH.pts.forEach(([x, z], i) => { SX[i] = x; SZ[i] = z; });
let X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9;
for (let i = 0; i < SH.n; i++) { X0 = Math.min(X0, SX[i]); X1 = Math.max(X1, SX[i]); Z0 = Math.min(Z0, SZ[i]); Z1 = Math.max(Z1, SZ[i]); }
function insideLake(x, z) {
  let c = false;
  for (let i = 0, j = SH.n - 1; i < SH.n; j = i++) if ((SZ[i] > z) !== (SZ[j] > z) && x < ((SX[j] - SX[i]) * (z - SZ[i])) / (SZ[j] - SZ[i]) + SX[i]) c = !c;
  return c;
}
// metres to the shoreline: + on the ice, - on land
export function shoreDist(x, z) {
  let best = 1e9;
  for (let i = 0, j = SH.n - 1; i < SH.n; j = i++) {
    const ax = SX[j], az = SZ[j], bx = SX[i] - ax, bz = SZ[i] - az, l2 = bx * bx + bz * bz;
    const t = l2 > 0 ? clamp(((x - ax) * bx + (z - az) * bz) / l2) : 0, dx = x - ax - bx * t, dz = z - az - bz * t, d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best) * (insideLake(x, z) ? 1 : -1);
}
// the gap in the forest (P7, P10): a 4.5 m corridor from (-1.5, -26) heading (-0.1, -1); `m` widens it
export const inGap = (x, z, m = 0) => z < -22 && Math.abs(x - (-1.5 + 0.1 * (z + 26))) < 2.25 + m;

// ---------------------------------------------------------------------------------------------------------- the bank
// d = metres inland: the drift lip to 0.32 over 0..0.7, 1 in 7 to 1.3 at 7.5, +-0.35 noise (period 9 m) rising to 3.5 at 45 and 9 at 90
function profile(d) {
  if (d <= 0) return d * 0.3;
  if (d < 0.7) return 0.32 * (1 - (1 - d / 0.7) ** 2);
  if (d < 7.5) return 0.32 + 0.98 * ((d - 0.7) / 6.8);
  if (d < 45) return 1.3 + 2.2 * ((d - 7.5) / 37.5);
  return 3.5 + 5.5 * ((d - 45) / 45);
}
export function bankY(x, z) {
  const d = -shoreDist(x, z);
  if (d <= 0) return 0;
  let y = profile(d) + 0.35 * (2 * vnoise(x / 9, z / 9) - 1) * sstep(1, 4, d);
  const m = (1 - sstep(4, 6, Math.abs(x))) * (1 - sstep(6, 9, z));   // the cameras stand on the near bank: under y 0.45 out to z 6
  if (m > 0 && z > 0) y = y * (1 - m) + Math.min(y, 0.45) * m;
  return Math.max(y, 0);
}
const GLOW = new V3(-1.5, 0, -26).normalize();
export const ICELAKE = {
  shore: SH.pts, wind: [0.94, 0.34], glow: [GLOW.x, GLOW.z], gap: { from: [-1.5, -26], heading: [-0.1, -1], width: 4.5 },
  light: { dir: [-0.35, 0.80, 0.48], lit: "#dfe8fb", shade: "#8ea6dc", haze: "#b9c7ea", hazeD: 260, hazeMax: 0.6 },
  cast: { key: ["#fff1e0", 1.0], hemi: ["#b9cdf5", "#dfe8fb", 0.9], rim: ["#a9c8ff", 0.4, [0.5, 0.5, -0.7]] },
  bbox: [X0, Z0, X1, Z1], counts: {}, shoreDist, bankY, inGap,
};

const colorAttr = (g, col) => {
  const n = g.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(col);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute("aCol", new THREE.BufferAttribute(a, 3)); return g;
};
const prep = (g, col) => { let n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal" && k !== "aCol") n.deleteAttribute(k); if (col) colorAttr(n, col); return n; };
const mergeG = (list) => (list.length ? mergeGeometries(list) : null);

function bankMesh(g) {
  const rows = [-0.25, 0, 0.15, 0.3, 0.5, 0.7, 1.1, 1.8, 3, 4.5, 6, 7.5, 10, 14, 19, 25, 32, 40, 50, 60, 72, 85, 100], NR = rows.length, N = SH.n;
  const nrm = (i, d) => {   // the outward normal, smoothed more the farther inland (the offset curve stays unfolded)
    const w = Math.min(40, Math.round((Math.max(0, d) * 0.8) / 0.25)); let x = 0, z = 0;
    for (let k = -w; k <= w; k++) { const q = SH.nor[(i + k + N * 4) % N]; x += q[0]; z += q[1]; }
    const l = Math.hypot(x, z) || 1; return [x / l, z / l];
  };
  const pos = new Float32Array(N * NR * 3), col = new Float32Array(N * NR * 3), A = C("#f4f8ff"), B = C("#dbe6fa"), t = new THREE.Color();
  for (let j = 0; j < NR; j++) for (let i = 0; i < N; i++) {
    const d = rows[j], [nx, nz] = nrm(i, d), x = SX[i] + nx * d, z = SZ[i] + nz * d, k = (j * N + i) * 3;
    pos[k] = x; pos[k + 1] = bankY(x, z) - (d <= 0 ? 0.04 : 0); pos[k + 2] = z;
    const hol = sstep(0.5, 0.78, vnoise(x / 2.4 + 3, z / 2.4)) * 0.8 + 0.2 * sstep(0.4, 0.8, vnoise(x / 0.9, z / 0.9 + 7));
    t.copy(A).lerp(B, hol); col[k] = t.r; col[k + 1] = t.g; col[k + 2] = t.b;
  }
  const idx = []; for (let j = 0; j < NR - 1; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + ((i + 1) % N), c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  // (folds where the shore bends toward the lake are z-buffer-safe: every row reads the same height field)
  return farMesh(geo, snowMaterial({ vcol: true, side: THREE.DoubleSide }), g, "set-icelake-bank");
}

// ---------------------------------------------------------------------------------------------------------- the near fir
// a 1 m tall fir (instance scale = its height): 6 tiers, each a skirt of 9-11 lobes drooping 15-25 deg, a snow pad on 55-75 % of its top,
// the trunk on the lowest 12 %; `broken`: a missing bough. <= 900 triangles.
function nearFirGeo(seed, broken) {
  const r = rng(seed * 977 + 13), parts = [], LIT = ["#2b5a4c", "#27544a", "#2f604f"], UND = "#1d3f3a", PAD = "#f1f6ff";
  const nT = 6, push = (pos, col) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); parts.push(colorAttr(g, col)); };
  const hole = broken ? { tier: 1 + Math.floor(r() * 3), a: r() * 0.7, span: 0.18 + 0.1 * r() } : null;
  for (let i = 0; i < nT; i++) {
    const yB = 0.12 + i * 0.138, R = 0.205 * (1 - i * 0.145) * (0.92 + 0.16 * r()), lobes = 9 + Math.floor(r() * 3), droop = Math.tan((15 + 10 * r()) * D2R);
    const M = lobes * 3, yA = yB + R * droop * 0.9, ring = [], padK = [];
    for (let k = 0; k <= M; k++) {
      const ph = (k % 3), a = ((k % M) / M) * Math.PI * 2, rr = R * [1.0, 0.8, 0.8][ph] * (0.9 + 0.2 * r()), yy = yB - (ph === 0 ? 0.02 : 0);
      ring.push([Math.cos(a) * rr, yy, Math.sin(a) * rr, a / (Math.PI * 2)]); padK.push(0.55 + 0.2 * r());
    }
    ring[M] = ring[0].slice(); padK[M] = padK[0];
    const top = [], und = [], pad = [];
    for (let k = 0; k < M; k++) {
      const p = ring[k], q = ring[k + 1], u = p[3];
      if (hole && hole.tier === i && ((u - hole.a + 1) % 1) < hole.span) continue;
      top.push(0, yA, 0, q[0], q[1], q[2], p[0], p[1], p[2]);
      und.push(0, yB - 0.015, 0, p[0], p[1], p[2], q[0], q[1], q[2]);
      const f0 = padK[k], f1 = padK[k + 1], th0 = 0.012 * (1 - f0 * 0.6), th1 = 0.012 * (1 - f1 * 0.6);
      const mk = (pp, f, th) => [pp[0] * f, yA + (pp[1] - yA) * f + th, pp[2] * f];
      const a = mk(p, f0, th0), b = mk(q, f1, th1);
      pad.push(0, yA + 0.014, 0, b[0], b[1], b[2], a[0], a[1], a[2]);
    }
    push(top, LIT[(i + Math.floor(r() * 3)) % 3]); push(und, UND); push(pad, PAD);
  }
  // the leader and the trunk
  const spike = new THREE.ConeGeometry(0.02, 0.17, 6); spike.translate(0, 0.915, 0); parts.push(colorAttr(prep(spike), LIT[0]));
  const trunk = new THREE.CylinderGeometry(0.009, 0.013, 0.2, 7); trunk.translate(0, 0.1, 0); parts.push(colorAttr(prep(trunk), "#5a4334"));
  return mergeG(parts.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { if (!g.attributes.normal) g.computeVertexNormals(); return g; }));
}
function snagGeo(seed) {
  const r = rng(seed * 313 + 5), parts = [];
  const trunk = new THREE.CylinderGeometry(0.012, 0.03, 1, 6); trunk.translate(0, 0.5, 0); parts.push(colorAttr(prep(trunk), "#6f6a6a"));
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const y = 0.35 + (0.58 * (i + 0.3 * r())) / n, a = r() * 6.28, len = 0.05 + 0.07 * r(), st = new THREE.CylinderGeometry(0.004, 0.009, len, 5);
    st.translate(0, len / 2, 0); st.rotateZ(1.15 + 0.3 * r()); st.rotateY(a); st.translate(0, y, 0); parts.push(colorAttr(prep(st), "#6f6a6a"));
    const cap = new THREE.SphereGeometry(0.011, 6, 4); cap.scale(1.3, 0.6, 1.3); cap.translate(Math.cos(a) * len * 0.8, y + len * 0.5, -Math.sin(a) * len * 0.8); parts.push(colorAttr(prep(cap), "#f1f6ff"));
  }
  const tcap = new THREE.SphereGeometry(0.02, 6, 4); tcap.scale(1.2, 0.55, 1.2); tcap.translate(0, 1.0, 0); parts.push(colorAttr(prep(tcap), "#f1f6ff"));
  return mergeG(parts.map(prep));
}
const SWAY = (U) => ({
  uniforms: { uT: U },
  vHead: "uniform float uT;",
  vPre: "vec3 ip = vec3(M[3][0], 0.0, M[3][2]); float ph = fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832; float sw = 0.0105 * sin(6.2832 * 0.25 * uT + ph); pos.x += pos.y * sw; pos.z += pos.y * sw * 0.4;",
});

function buildForest(g, rnd, uT) {
  const heightAt = bankY, out = { near: 0, young: 0, snags: 0, far: 0 };
  const placed = [];
  const free = (x, z, gap) => placed.every((p) => Math.hypot(p[0] - x, p[1] - z) > gap);
  // clump anchors by place: [x, z, count]
  const PLACES = {
    far: [[-8.6, -28.6, 4], [-6.2, -32.5, 3], [3.2, -29.5, 3], [7.0, -27.8, 4], [-9.6, -24.6, 4]],
    rightHead: [[7.6, -12.2, 5]], leftHead: [[-6.6, -10.2, 4]],
    leftShore: [[-12.2, -3.6, 5], [-11.4, -14.5, 4]], jetty: [[9.8, -7.0, 3], [10.2, 0.8, 3]], nearBank: [[-8.0, 6.4, 2], [7.4, 6.8, 2]],
  };
  const trees = [];   // [x, z, h, yaw, lean, variant]
  const young = [];
  for (const [place, list] of Object.entries(PLACES)) for (const [ax, az, n] of list) {
    const first = [];
    for (let k = 0, tries = 0; k < n && tries < 400; tries++) {
      const a = rnd() * 6.28, d = 1.5 + rnd() * (place === "far" ? 5 : 4.5), x = ax + Math.cos(a) * d * (k ? 1 : 0.3), z = az + Math.sin(a) * d * (k ? 1 : 0.3);
      if (shoreDist(x, z) > -1.5 || inGap(x, z, 1.2) || !free(x, z, 1.5 + 2.5 * rnd())) continue;
      if (x > 6.3 && z > -4.9 && z < -0.9 && Math.hypot(x - 8.6, z + 2.7) < 4) continue;   // the jetty's root
      const big = trees.length === 7 || trees.length === 29;
      placed.push([x, z]); trees.push([x, z, big ? 15 : 6 + 7 * rnd() ** 0.8, rnd() * 6.28, (rnd() * 4 * D2R), Math.floor(rnd() * 6)]); first.push([x, z]); k++;
    }
    // young ones (2-4 m) at the clump's front, toward the lake, still 1.5 m or more inland
    const [fx, fz] = first[0] || [ax, az];
    for (let k = 0, tries = 0; k < 1 + (place === "far" ? 1 : 0) + (place === "leftShore" ? 1 : 0) && tries < 80 && young.length < 12; tries++) {
      const toward = Math.atan2(-fz, -fx), x = fx + Math.cos(toward + (rnd() - 0.5)) * (1.6 + 1.6 * rnd()), z = fz + Math.sin(toward + (rnd() - 0.5)) * (1.6 + 1.6 * rnd());
      if (shoreDist(x, z) > -1.5 || inGap(x, z, 1.0) || !free(x, z, 1.2)) continue;
      placed.push([x, z]); young.push([x, z, 2 + 2 * rnd(), rnd() * 6.28, rnd() * 4 * D2R, Math.floor(rnd() * 6)]); k++;
    }
  }
  out.near = trees.length; out.young = young.length;
  const variants = Array.from({ length: 6 }, (_, i) => nearFirGeo(i + 1, i === 2 || i === 5));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion(), Y = new V3(0, 1, 0), X = new V3(1, 0, 0);
  const all = [...trees, ...young];
  variants.forEach((geo, v) => {
    const list = all.filter((t) => t[5] === v); if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, snowMaterial({ vcol: true, ...SWAY(uT) }), list.length);
    list.forEach(([x, z, h, yaw, lean], i) => {
      qy.setFromAxisAngle(Y, yaw); q.setFromAxisAngle(X, lean).premultiply(qy);
      M.compose(new V3(x, heightAt(x, z) - 0.15, z), q, new V3(h * 0.9, h, h * 0.9)); im.setMatrixAt(i, M);
    });
    im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.userData.solid = false; im.userData.lookOnly = true; im.name = `set-icelake-nearfirs-${v}`; g.add(im);
  });
  // three dead snags 5-8 m
  const snags = [[8.2, -12.8], [-8.9, -8.6], [-6.8, -26.8]].filter(([x, z]) => shoreDist(x, z) < -1.5);
  out.snags = snags.length;
  const sg = snagGeo(3), si = new THREE.InstancedMesh(sg, snowMaterial({ vcol: true }), snags.length);
  snags.forEach(([x, z], i) => { const h = 5 + 3 * rnd(); qy.setFromAxisAngle(Y, rnd() * 6); M.compose(new V3(x, heightAt(x, z) - 0.1, z), qy, new V3(h, h, h)); si.setMatrixAt(i, M); });
  si.instanceMatrix.needsUpdate = true; si.frustumCulled = false; si.userData.solid = false; si.userData.lookOnly = true; si.name = "set-icelake-snags"; g.add(si);
  // far firs: 280 instances of the shared fir, 7-14 m, 10-95 m inland, denser with distance
  const spots = [];
  for (let tries = 0; spots.length < 280 && tries < 60000; tries++) {
    const x = -110 + 220 * rnd(), z = -125 + 190 * rnd(), rad = Math.hypot(x, z);
    if (rad > 92) continue;
    const d = -shoreDist(x, z); if (d < 10 || d > 95 || inGap(x, z, 1.8)) continue;
    if (rnd() > 0.12 + 0.88 * sstep(10, 95, d)) continue;
    const h = 7 + 7 * rnd() ** 1.4; spots.push([x, heightAt(x, z) - 0.2, z, h, rnd() * 6.28, 0.85 + 0.3 * rnd()]);
  }
  out.far = spots.length;
  const fm = new THREE.InstancedMesh(firGeometry(), firMaterial(), spots.length);
  spots.forEach(([x, y, z, h, yaw, w], i) => { qy.setFromAxisAngle(Y, yaw); M.compose(new V3(x, y, z), qy, new V3(h * w, h, h * w)); fm.setMatrixAt(i, M); });
  fm.instanceMatrix.needsUpdate = true; fm.frustumCulled = false; fm.userData.solid = false; fm.userData.lookOnly = true; fm.name = "set-icelake-farfirs"; g.add(fm);
  return out;
}

// ---------------------------------------------------------------------------------------------------------- shore dressing
function dressing(g, rnd) {
  const A = C("#f4f8ff");
  // 16 snow mounds on the shoreline, gaps 1-6 m; two at the sheet's bottom corners
  const mounds = [[-1.9, 2.6, 0.7, 0.3], [1.7, 2.7, 0.8, 0.36]];
  let s = 0.17 * SH.length;
  while (mounds.length < 16) {
    s += 1 + 5 * rnd(); const i = Math.floor((s / SH.length) * SH.n) % SH.n, p = SH.pts[i], nn = SH.nor[i];
    const x = p[0] + nn[0] * 0.4, z = p[1] + nn[1] * 0.4;
    if (z > 1.5 && x > -2.3 && x < 2.2) continue;   // none on the near shore between x -1.6 and 1.5 (the lenses look over it)
    mounds.push([x, z, 0.35 + 0.75 * rnd() ** 1.6, 0.15 + 0.35 * rnd()]);
  }
  const mg = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), M = new THREE.Matrix4(), q = new THREE.Quaternion();
  const mim = new THREE.InstancedMesh(mg, snowMaterial({ color: "#f4f8ff" }), mounds.length);
  mounds.forEach(([x, z, r, h], i) => { q.setFromAxisAngle(new V3(0, 1, 0), rnd() * 6); M.compose(new V3(x, bankY(x, z) - 0.03, z), q, new V3(r, h, r * (0.8 + 0.4 * rnd()))); mim.setMatrixAt(i, M); });
  mim.instanceMatrix.needsUpdate = true; mim.frustumCulled = false; mim.name = "set-icelake-mounds"; mim.userData.solid = false; mim.userData.lookOnly = true; g.add(mim);
  // dead reeds: 5 clumps of 14-30 blades 0.25-0.55 long, bent toward +x, a snow ring at the foot
  const reedAt = [[-2.3, 2.5], [2.1, 2.9], [6.6, -1.9], [-8.9, -0.5], [-4.6, -9.6]], parts = [], lit = C("#b7964f"), shade = C("#8a6d38");
  for (const [cx, cz] of reedAt) {
    const n = 14 + Math.floor(rnd() * 17), by = bankY(cx, cz);
    for (let b = 0; b < n; b++) {
      const bx = cx + (rnd() - 0.5) * 0.36, bz = cz + (rnd() - 0.5) * 0.3, h = 0.25 + 0.3 * rnd(), bend = 0.08 + 0.18 * rnd(), w = 0.007 + 0.005 * rnd(), c = rnd() < 0.45 ? shade : lit, tw = (rnd() - 0.5) * 0.06;
      const pos = [], col = [], ys = [0, 0.5, 1];
      const P = ys.map((t) => [bx + bend * t * t + tw * t, by - 0.02 + h * t, bz]);
      for (let k = 0; k < 2; k++) {
        const a = P[k], bb = P[k + 1], wa = w * (1 - 0.5 * ys[k]), wb = w * (1 - 0.5 * ys[k + 1]);
        pos.push(a[0] - wa, a[1], a[2], a[0] + wa, a[1], a[2], bb[0] + wb, bb[1], bb[2], a[0] - wa, a[1], a[2], bb[0] + wb, bb[1], bb[2], bb[0] - wb, bb[1], bb[2]);
      }
      const tip = P[2]; pos.push(tip[0] - w * 0.5, tip[1], tip[2], tip[0] + w * 0.5, tip[1], tip[2], tip[0] + bend * 0.15, tip[1] + 0.05, tip[2]);
      const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); bg.computeVertexNormals(); parts.push(colorAttr(bg, c));
    }
    const ring = new THREE.TorusGeometry(0.17, 0.05, 5, 14); ring.rotateX(Math.PI / 2); ring.scale(1, 0.6, 1); ring.translate(cx, by + 0.0, cz); parts.push(colorAttr(prep(ring), "#f4f8ff"));
  }
  const reeds = new THREE.Mesh(mergeG(parts.map(prep)), snowMaterial({ vcol: true, side: THREE.DoubleSide })); reeds.frustumCulled = false; reeds.name = "set-icelake-reeds"; reeds.userData.solid = false; reeds.userData.lookOnly = true; g.add(reeds);
  // four snow-capped boulders (left headland, the jetty's root) and one snowed-in log
  const rocks = [[-5.1, -9.2, 0.8], [-3.4, -11.2, 0.5], [7.6, -4.6, 0.9], [7.9, -0.9, 0.45]], rp = [];
  for (const [x, z, r] of rocks) {
    const ico = new THREE.IcosahedronGeometry(r, 1), pp = ico.attributes.position;
    for (let i = 0; i < pp.count; i++) { const k = 0.82 + 0.3 * hash2(Math.round(pp.getX(i) * 40 + x * 7), Math.round(pp.getZ(i) * 40 + pp.getY(i) * 31)); pp.setXYZ(i, pp.getX(i) * k, pp.getY(i) * k * 0.78, pp.getZ(i) * k); }
    ico.translate(x, bankY(x, z) + r * 0.2, z); ico.computeVertexNormals(); rp.push(colorAttr(prep(ico), "#6a7186"));
    const cap = new THREE.SphereGeometry(r * 0.74, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2.6); cap.scale(1.05, 0.9, 1.05); cap.translate(x, bankY(x, z) + r * 0.2 + r * 0.34, z); rp.push(colorAttr(prep(cap), "#f4f8ff"));
  }
  const log = new THREE.CylinderGeometry(0.15, 0.17, 2.4, 9); log.rotateZ(Math.PI / 2); log.rotateY(0.45); log.translate(5.9, bankY(5.9, 2.4) + 0.1, 2.4); rp.push(colorAttr(prep(log), "#5a4334"));
  const lsn = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); lsn.scale(1.0, 0.26, 0.34); lsn.rotateY(0.45); lsn.translate(5.86, bankY(5.9, 2.4) + 0.2, 2.4); rp.push(colorAttr(prep(lsn), "#f4f8ff"));
  const rm = new THREE.Mesh(mergeG(rp.map(prep)), snowMaterial({ vcol: true })); rm.frustumCulled = false; rm.name = "set-icelake-rocks"; rm.userData.solid = false; rm.userData.lookOnly = true; g.add(rm);
  return { mounds: mounds.length, reeds: reedAt.length, boulders: rocks.length };
}

// ---------------------------------------------------------------------------------------------------------- sky, rings, mist
const GL = `
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
`;
const g3 = (hex) => { const c = C(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const flt = (n) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
function look(m, order) { m.userData.noOutline = true; m.userData.solid = false; return m; }
function skyDome(g, uT) {
  const bands = [[7.5, 1.7], [10.8, 2.2], [14.2, 2.7], [17.8, 2.1], [21.2, 1.5]];
  const m = new THREE.ShaderMaterial({
    uniforms: { uT }, side: THREE.BackSide, depthWrite: false, transparent: true,
    vertexShader: `varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; gl_Position.z = gl_Position.w * 0.99999; }`,
    fragmentShader: `uniform float uT; varying vec3 vDir; ${GL}
const vec2 GLOW = vec2(${flt(GLOW.x)}, ${flt(GLOW.z)});
void main() {
  vec3 d = normalize(vDir); float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
  float dl = degrees(acos(clamp(dot(normalize(d.xz + 1e-5), GLOW), -1.0, 1.0)));
  float gk = 1.0 - smoothstep(0.0, 25.0, dl);                      // 1 at the glow centre
  vec3 c = mix(${g3("#cfd3ee")}, ${g3("#8fb0e6")}, smoothstep(10.0, 30.0, e));
  c = mix(c, ${g3("#4f77c2")}, smoothstep(30.0, 90.0, e));
  vec3 band = mix(${g3("#c9c3e6")}, ${g3("#f3c6cf")}, smoothstep(0.0, 0.5, gk));
  band = mix(band, ${g3("#f8dcc2")}, smoothstep(0.45, 1.0, gk));
  float bk = 1.0 - smoothstep(5.0, 11.0 + 6.0 * gk, e);
  c = mix(c, band, bk);
  if (e < 0.0) c = band;
  float az = radians(degrees(atan(d.x, d.z)) - 0.2 * uT);          // the bands slide 0.2 degrees a second
  vec2 ring = vec2(cos(az), sin(az));
${bands.map(([ec, th], i) => `  { float bot = ${flt(ec)} - ${flt(th)} * (0.55 + 0.6 * vn(ring * ${flt(4 + i)} + ${flt(i * 7.3)}));
    float top = ${flt(ec)} + ${flt(th)} * (0.45 + 0.7 * vn(ring * ${flt(5 + i)} + ${flt(i * 3.1 + 20)}));
    if (e > bot && e < top) { float u = (e - bot) / (top - bot);
      vec3 cc = mix(mix(${g3("#a9a7d8")}, ${g3("#f2b6c4")}, gk * 0.9), ${g3("#a9a7d8")}, smoothstep(0.35, 0.75, u));
      float pres = smoothstep(0.30, 0.52, 0.6 * vn(vec2(degrees(az) * 0.06 + ${flt(i * 1.7)}, ${flt(i)})) + 0.4 * vn(vec2(degrees(az) * 0.19 + ${flt(i * 3.3)}, ${flt(i + 5)})));
      c = mix(c, cc, 0.92 * pres * smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.82, 1.0, u))); } }`).join("\n")}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  look(m);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), m); sky.renderOrder = -1000; sky.frustumCulled = false; sky.name = "set-icelake-sky"; sky.userData.solid = false; sky.userData.lookOnly = true; g.add(sky);
}
// the three painted hill rings (r 95 / 150 / 230 m); `dip` over the gap
function rings(g) {
  const gapA = Math.atan2(-1.5, -26);   // atan(x, z) of the gap's bearing
  const defs = [[95, 14, "#3f5c8f", true, 3], [150, 30, "#6d86bb", false, 6], [230, 58, "#a3b3d8", false, 14]];
  defs.forEach(([R, H, col, teeth, dip], i) => {
    const m = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: {},
      vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `varying vec3 vW; ${GL}
void main() {
  float a = atan(vW.x, vW.z), da = abs(mod(a - ${flt(gapA)} + 3.14159, 6.28318) - 3.14159);
  vec2 cs = vec2(cos(a), sin(a)); float s = a * ${flt(R)};
  float top = ${flt(H)} * (1.0 + 0.32 * (2.0 * (0.65 * vn(cs * 3.0 + ${flt(i * 17.3 + 2)}) + 0.35 * vn(cs * 9.0 + ${flt(i * 5.1)})) - 1.0));
${teeth ? `  float ci = floor(s / 3.1), f = fract(s / 3.1), wv = mix(2.0, 4.0, h12(vec2(ci, 1.0))) / 3.1;
  top += -3.0 + mix(3.0, 7.0, h12(vec2(ci, 2.0))) * max(0.0, 1.0 - abs(f - 0.5) * 2.0 / wv);` : ""}
  top = mix(top, ${flt(dip)}, 1.0 - smoothstep(0.03, 0.16, da));   // dips over the gap
  if (vW.y > top) discard;
  vec3 c = ${g3(col)};
${i === 2 ? `  float up = smoothstep(0.7, 1.0, vW.y / max(top, 1.0)), nz = vn(vec2(a * 40.0, vW.y * 0.25));
  c = mix(c, ${g3("#dfe6f6")}, up * smoothstep(0.35, 0.55, nz + 0.3 * up));
  c = mix(c, ${g3("#f0cdd6")}, (1.0 - smoothstep(0.0, 0.9, da)) * smoothstep(0.84, 0.98, vW.y / max(top, 1.0)) * 0.8);` : `  c = mix(c, c * 0.86, smoothstep(0.0, 1.0, 1.0 - vW.y / max(top, 1.0)) * 0.35);`}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
    });
    look(m);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H * 1.5 + 1, 256, 1, true).translate(0, (H * 1.5 + 1) / 2 - 1, 0), m);
    cyl.frustumCulled = false; cyl.renderOrder = -900 + i; cyl.name = `set-icelake-ring-${i + 1}`; cyl.userData.solid = false; cyl.userData.lookOnly = true; g.add(cyl);
  });
  // mist at the far shore: 2 m high, #b9c6e6 at 0.35
  const mm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; ${GL} void main() { float a = 0.35 * (1.0 - smoothstep(0.35, 1.0, vUv.y)) * (0.8 + 0.2 * vn(vec2(vUv.x * 40.0, 3.0))) * smoothstep(0.0, 0.08, vUv.y);
  gl_FragColor = vec4(${g3("#b9c6e6")}, a);\n  #include <colorspace_fragment>\n}`,
  });
  look(mm);
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(26, 2).translate(0, 1, 0), mm); mist.position.set(-1, 0.02, -25.2); mist.renderOrder = 3; mist.name = "set-icelake-mist"; mist.userData.solid = false; mist.userData.lookOnly = true; mist.userData.steam = true; g.add(mist);
}

// ---------------------------------------------------------------------------------------------------------- spindrift on the ice
function spindrift(g) {
  const W = new V3(0.94, 0, 0.34), wisps = [];
  const shape = new THREE.PlaneGeometry(1, 1, 8, 1), p = shape.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, w = Math.sin(Math.PI * u) ** 0.8; p.setY(i, p.getY(i) * w); }
  shape.rotateX(-Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const h = (k) => hash2(i * 17 + k, 5), len = 1.5 + 1.5 * h(1), wid = 0.12 + 0.12 * h(2), m = new THREE.MeshBasicMaterial({ color: "#eef4ff", transparent: true, opacity: 0, depthWrite: false });
    m.userData.noOutline = true; const o = new THREE.Mesh(shape, m); o.scale.set(len, 1, wid); o.rotation.y = -Math.atan2(W.z, W.x); o.renderOrder = 4; o.frustumCulled = false; o.userData.solid = false; o.userData.lookOnly = true; o.userData.steam = true; o.name = `set-icelake-wisp-${i}`;
    g.add(o); wisps.push({ o, m, x0: -5.5 + 3.5 * h(3) - 3.6, z0: -14 + 9.4 * h(4) + (W.z / W.x) * 0, ph: h(5) * 6, len });
  }
  return (t) => wisps.forEach((w) => { const u = ((t + w.ph) % 6) / 6, d = 7.2 * u; w.o.position.set(w.x0 + W.x * d, 0.006, w.z0 + W.z * d); w.m.opacity = 0.25 * Math.sin(Math.PI * u) ** 0.7; });
}

// ---------------------------------------------------------------------------------------------------------- the set
export function buildIcelake(scene, S = {}) {
  const rnd = rng((S.seed || 12) * 733 + 5), g = new THREE.Group(); g.name = "set-icelake"; scene.add(g);
  scene.background = new THREE.Color("#b9c7ea");
  const L = SNOWLIGHT, I = ICELAKE.light;   // the snow family's shared light uniforms, set to the dusk values (never setDark)
  L.uDark.value = 0; L.uL.value.set(...I.dir).normalize(); L.uLit.value.set(I.lit); L.uShade.value.set(I.shade); L.uGlow.value.set("#000000"); L.uHaze.value.set(I.haze); L.uHazeD.value = I.hazeD; L.uHazeMax.value = I.hazeMax;
  const uT = { value: 0 };
  skyDome(g, uT); rings(g); bankMesh(g);
  ICELAKE.counts = { ...buildForest(g, rnd, uT), ...dressing(g, rnd), wisps: 8 };
  const drift = spindrift(g);
  // the cast light (the set's own, inside its group: the look keeps lights that a set builds itself)
  const [kc, ki] = ICELAKE.cast.key, key = new THREE.DirectionalLight(kc, ki), tgt = new THREE.Object3D(); key.name = "set-icelake-key"; key.castShadow = false;
  key.position.set(...I.dir.map((v) => v * 10)); tgt.position.set(0, 0, 0); g.add(tgt); key.target = tgt; g.add(key);
  const [hs, hg, hi] = ICELAKE.cast.hemi, hemi = new THREE.HemisphereLight(hs, hg, hi); hemi.name = "set-icelake-fill"; g.add(hemi);
  const [rc, ri, rp] = ICELAKE.cast.rim, rim = new THREE.DirectionalLight(rc, ri); rim.name = "set-icelake-rim"; rim.position.set(...rp.map((v) => v * 10)); rim.target = tgt; g.add(rim);
  const tick = (t) => { uT.value = t; drift(t); };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return g;
}
