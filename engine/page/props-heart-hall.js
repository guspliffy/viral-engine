// Heart of the Matter (egypt-myth 01) set A: the HALL of the two truths (storyboards/series/egypt-myth/01-heart/DESIGN.md section A).
// One prop, one kind: `hearthall`. Every number below is the DESIGN's; every mark is drawn once from its index (no random, no clock).
//
// KIND hearthall
//   Origin: the floor under the scale's pillar, y 0 = the floor. Axes: x right, y up, +z toward the camera at the queue. The door wall is at
//   z -9 (BEHIND the scale); the nave runs from z -9 to z +46 (x -8..+8, 16 x 55 m), ceiling y 10.6. Place it at x 0, y 0, z 0, rot 0, once.
//   Single-sided walls (a camera may stand outside). Only the floor takes shadows (it receives, nothing casts). Not a grip prop: no hold points
//   (HEART_HALL_GRIPS is empty). Everything in it is scenery: only the 42 stools' bodies and the columns count as solid for contact.
//
//   SPEC KEYS (all optional)
//     rowFrom  7    1..43. Judges' stools 1..42 always stand (x -5.2, z +2.0 + 0.95 (i-1), facing +x); the painted-and-flat judge figures of the
//                   far row are built from stool number rowFrom up (default 7: judges 1-6 are the real F costumes, from 7 the figures). 43 = none.
//   PARAMS (tweened by c.prop; ranges; the default is what the hall shows until a c.prop sets it)
//     doors     0   0..1. The two door leaves (2.2 x 6.4 x 0.18, hinges at x -2.2 / +2.2) swing 105 degrees out toward +z; at 0 the field is hidden.
//                   Open: the reed and wheat field (90 stems, 4 wheat ribbons that roll with a 5 s wave, an S-bend river, 9 palms, 2 birds, hills,
//                   sky), the door sun (a SpotLight "#ffe08a", 5 ray cards, a floor wedge 4.4 m wide to z -1) and 60 dust motes, all scaled by doors.
//                   The torches near the doors lean 15 degrees with the draught.
//     torch     1   0..1. All 26 flames, their glow, smoke, embers, sparks, floor and wall pools and the 5 real lights, scaled together.
//     tense     0   0..1. Flicker depth x (1 + 0.8 tense); the baked light x (1 - 0.4 tense); a cold rim DirectionalLight "#7a8fb0" (1.1 x tense).
//     rowLight  0.6 0..1. The left row of torches from z +9 and the far-row judges: 0.2 -> 1 lifts them (flames 0.35 + 0.65 x rowLight).
//   NOTE: doors, torch, tense, rowLight are NOT propState defaults (props3d.js does not import HEART_HALL_STATE): seed each with a duration-0
//   c.prop(0, id, { doors: 0, torch: 1, tense: 0, rowLight: 0.6 }, 0) first (then a later tween blends), or a tween steps at its `at`.
//
//   MADE OF (DESIGN section 12 counts, all built)
//     side walls   2 x 13 segments of 4.2 m, each painted once, per wall: 55 dado lotus pairs, 39 procession figures (8 types), 13 scenes
//                  (7 kinds, then again with the second detail set), 21 judge pictures (14 heads, 3 throne colours; stars and lotus beyond z +18.3),
//                  157 frieze lotus, 4 block borders, 12 % flaked, soot over each torch, hairline cracks.
//     door wall    2 panels (x -7.8..-2.8 / +2.8..+7.8) x 3 registers = 6 scenes (boat, throne, bird / thicket, weighing, sun disc) + the lintel wall.
//     columns      2 rows of 12 at x -6.4 / +6.4, z -6.75 + 4.5 k: shaft with painted bands, papyrus bundle capitals (24: each 8 sepals, 24 stems,
//                  8 buds), abacus 1.0 x 0.3 x 1.0 with a wing band, top 9.8.
//     architraves  1.0 wide, y 9.8..10.6 on both rows, plaster with a block border and spread-wing birds.
//     floor        black polished stone with gold inlay: 36 lotus, 16 rays, 88 spirals, 21 rosettes, veins; baked dark along z.
//     ceiling      night blue with 2366 stars (0.18 across on a 0.6 m lattice, jittered 6 cm, each turned).
//     torches      2 rows of 11 (x +-6.0, z -4.5 + 4.5 k, stand 1.75) + 2 scale braziers (-2.2 / +2.2, -3.4, rim 1.2) + 2 door braziers
//                  (-3.2 / +3.2, -8.2, rim 2.4) = 26 flames, each 3 painted frames swapped 8 x/s on crossed cards, with sway, smoke sprites,
//                  embers and sparks. Real lights: 5 PointLights (the two scale braziers, the first torch of each row, the door brazier pair) + 1 SpotLight
//                  (the door sun) + 1 DirectionalLight (the tense rim); everything else is additive cards, so the draft stays inside llvmpipe's budget.
//     judges       42 stools (reed seat, carved legs), figures on 36 of them: 3 shared geometry variants (heights 0.85 / 0.88 / 0.91), breath 1 cm at
//                  0.3 Hz, feather sway 4 degrees; flat and painted far on, real shapes near.
//   DARK: the colour of every wall, column and floor is baked: 100 % to z +10, 50 % at +18, 12 % at +30, 4 % at +42 (the nave fades to black).
//   MARKS (DESIGN table): scale (0, 0) | jackal (+0.70, -0.25) | CHOMP (-2.85, -0.98) | soul (-0.55, +0.85) | queue x -1.4, z +4.5 + 1.0 k |
//   answer line x -4.1, z +2.0..+6.75 | rope posts (-2.4, +3.6) (-0.4, +3.6). Stage on those; the hall adds no props of its own there.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// ---------------------------------------------------------------------------------------------------------------------
// helpers: hashes, colours, canvases, baked geometry. Nothing random, nothing on a clock: every mark comes from an index.
// ---------------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const H3 = (a, b, c) => hh(a * 17.13 + b * 91.7 + c * 51.3 + 7.7);
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr, i) => arr[Math.floor(i) % arr.length];

const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const rgba = (c, a) => { const A = hexA(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };

// the shared palette (DESIGN, top)
const K = {
  gold: "#e2b04a", goldS: "#9a6a1e", goldD: "#6b4612", goldL: "#fff0b8", bole: "#8a4a2a",
  lapis: "#2b4fa2", lapisS: "#1c3470", lapisL: "#5f86d6", turq: "#3fa39a", turqS: "#2a7069", turqL: "#7fd0c4",
  linen: "#f3eee2", linenS: "#cfc7b4", linenD: "#a89f8c",
  floor: "#1c1b22", floorS: "#0f0e13", floorL: "#3a3846", vein: "#2a2833",
  plaster: "#d2ad6e", ochre: "#b4472e", plasterS: "#8a6a3c", ochreS: "#7a2e1e", plasterL: "#ecd09a",
  night: "#16224a", nightS: "#0e1630", star: "#e9c85a",
  line: "#2a1c14", skin: "#e2a95c", skinS: "#b98242", limb: "#6b4a2b", green: "#5a8a4a", greenD: "#3d6a38",
  colLit: "#d9b877", colShade: "#8a6a3c", colFar: "#4a3a26", stone: "#e9d9b0", dado: "#2a2428",
};

// the baked dark along the hall: 100 % to z +10, 50 % at +18, 12 % at +30, 4 % at +42
const DKP = [[10, 1], [18, 0.5], [30, 0.12], [42, 0.04]];
function dk(z) {
  if (z <= DKP[0][0]) return 1;
  for (let i = 1; i < DKP.length; i++) if (z <= DKP[i][0]) return lerp(DKP[i - 1][1], DKP[i][1], (z - DKP[i - 1][0]) / (DKP[i][0] - DKP[i - 1][0]));
  return DKP[3][1];
}

function canvasTex(w, h, draw, name = "", aniso = 8) {
  const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, Math.round(h));
  const g = cv.getContext("2d"); draw(g, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name;
  if (typeof window !== "undefined" && window.__TEXDUMP) (window.__TEX ||= {})[name || `t${Object.keys(window.__TEX || {}).length}`] = cv;
  return t;
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
// painted, lit by nothing (the walls, floor cards, field): colour multiplies the picture
const paintMat = (map, o = {}) => noLine(new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false, ...o }));
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.6, ...o }); m.userData.noHatch = true; return m; };
const steamy = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };
const flat = (o) => { o.castShadow = false; o.userData.solid = false; return o; };
const radialTex = (stops, n = 128) => canvasTex(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);

// ---- baked, vertex-coloured geometry --------------------------------------------------------------------------------
const V3 = THREE.Vector3;
function outward(geo, cx = 0, cz = 0) {
  const p = geo.attributes.position, n = geo.attributes.normal; let s = 0;
  for (let i = 0; i < p.count; i++) s += n.getX(i) * (p.getX(i) - cx) + n.getZ(i) * (p.getZ(i) - cz);
  if (s < 0) { const ix = geo.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } geo.computeVertexNormals(); }
  return geo;
}
// a nu x nv surface from f(u, v) -> [x, y, z]; u, v in 0..1; uv kept (u, v) so a canvas can wrap it
function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; pos.push(...f(u, v)); uv.push(...(uvf ? uvf(u, v) : [u, v])); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a tube along a polyline [[x,y,z]...], radius number or fn(t)
function tube(pts, rad, seg = 6, cap = true) {
  const n = pts.length, P = pts.map((p) => new V3(...p)), pos = [], idx = [];
  const T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  let N = Math.abs(T[0].y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const B = new V3().crossVectors(T[i], N).normalize(); N = new V3().crossVectors(B, T[i]).normalize();
    const r = typeof rad === "function" ? rad(i / (n - 1)) : rad;
    for (let s = 0; s < seg; s++) { const a = (s / seg) * TAU, d = N.clone().multiplyScalar(Math.cos(a) * r).add(B.clone().multiplyScalar(Math.sin(a) * r)); pos.push(P[i].x + d.x, P[i].y + d.y, P[i].z + d.z); }
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg, c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
  if (cap) for (const [i, flip] of [[0, true], [n - 1, false]]) { const c = pos.length / 3; pos.push(P[i].x, P[i].y, P[i].z); for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg; if (flip) idx.push(c, b, a); else idx.push(c, a, b); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a body of revolution about y from [[r, y]...] (bottom to top), outward faces
function lathe(prof, seg = 24, phase = 0) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg, phase, TAU); g.deleteAttribute("uv"); g.computeVertexNormals(); return outward(g);
}
const place = (geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
  const m = new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new V3(sx, sy, sz)); geo.applyMatrix4(m); return geo;
};

// collects pieces coloured by a function of their final position and normal, and merges them (no uv)
class Bake {
  constructor() { this.list = []; }
  add(geo, col) {
    const g = geo.index ? geo.toNonIndexed() : geo; if (g.attributes.uv) g.deleteAttribute("uv");
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "color"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const v = typeof col === "function" ? col(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i) : col;
      tmp.set(v); c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); this.list.push(g); return this;
  }
  geo() { return mergeGeometries(this.list); }
}

// gold leaf on a round part: one long light band, shade in the recesses, wear to bronze (red bole in 1 spot of 4)
const vn = (x, y, z, s, sd) => {
  x *= s; y *= s; z *= s; const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const f = (a, b, c) => H3(ix + a + sd * 13, iy + b, iz + c);
  const l = (a, b, t) => a + (b - a) * t, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  return l(l(l(f(0, 0, 0), f(1, 0, 0), u), l(f(0, 1, 0), f(1, 1, 0), u), v), l(l(f(0, 0, 1), f(1, 0, 1), u), l(f(0, 1, 1), f(1, 1, 1), u), v), w);
};
const LDIR = new V3(0.25, 0.85, 0.45).normalize(), BAND = new V3(-0.35, 0.8, 0.5).normalize();
const cGold = new THREE.Color(K.gold), cGoldS = new THREE.Color(K.goldS), cGoldL = new THREE.Color(K.goldL), cBronze = new THREE.Color(K.goldD), cBole = new THREE.Color(K.bole);
// n: unit normal; o: { cav 0..1 recess shade, edge 0..1 (extra wear on edges / where hands and feet go), seed, at: [x, y, z] }
function goldAt(nx, ny, nz, o = {}) {
  const c = cGold.clone(), b = Math.pow(Math.max(0, nx * BAND.x + ny * BAND.y + nz * BAND.z), 9);
  c.lerp(cGoldL, clamp(b * 0.92));
  c.lerp(cGoldS, clamp((o.cav || 0) * 0.85 + (1 - (nx * LDIR.x + ny * LDIR.y + nz * LDIR.z)) * 0.08));
  const [x, y, z] = o.at || [0, 0, 0], w = vn(x, y, z, 7, o.seed || 1) * 0.65 + vn(x, y, z, 23, (o.seed || 1) + 5) * 0.35;
  const thr = 0.78 - (o.edge || 0) * 0.22;   // 8 % of the area (more on the edges)
  if (w > thr) { const k = sm((w - thr) / 0.05); c.lerp(vn(x, y, z, 3, (o.seed || 1) + 9) > 0.75 ? cBole : cBronze, k * 0.92); }
  return c;
}
const eggY = (t) => Math.pow(Math.sin(Math.PI * Math.pow(clamp(t), 0.82)), 0.9);

// ---------------------------------------------------------------------------------------------------------------------
// 2D painters. Every one draws in METRES on a canvas whose transform is already set (y up), flat colours inside a dark
// line of 2-3 cm (K.line). Nothing is tiled: each mark takes its own index / seed.
// ---------------------------------------------------------------------------------------------------------------------
let LN = K.line;
function ink(g, lw = 0.025, col = LN) { g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); }
function fil(g, fill, lw = 0.025, col = LN) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw > 0) ink(g, lw, col); }
const ellP = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
const polyP = (g, pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };
function smoothP(g, pts, close = true) {   // a smooth closed or open curve through the points (midpoint quadratic)
  const n = pts.length; g.beginPath();
  if (close) {
    const m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    g.moveTo(...m(n - 1)); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i)); g.closePath();
  } else { g.moveTo(...pts[0]); for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(...pts[n - 1]); }
}
function line(g, pts, lw = 0.02, col = LN) { polyP(g, pts, false); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); }
const eggP = (g, cx, cy, rx, ry, k = 0.1, n = 44) => { g.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a); const x = cx + rx * s * (1 - k * c), y = cy + ry * c; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
const withT = (g, x, y, rot, sx, sy, fn) => { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy); fn(); g.restore(); };
// LAPIS 15 % paler on faces turned to a torch (a wall point within the torch pool)
const lapisAt = (pale) => (pale ? cmix(K.lapis, K.lapisL, 0.15 * 1.9) : K.lapis);

// ---- lotus: flower (open) and bud, coloured with a dark line, and gold line art
function lotusFlower(g, x, y, h, o = {}) {
  const n = o.petals ?? 5, lean = (o.lean ?? 0) * DEG, w = h * 0.2, cols = o.cols ?? [K.lapis, K.turq, K.plasterL], lw = o.lw ?? 0.02;
  const order = []; for (let i = 0; i < n; i++) order.push(i); order.sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of order) {
    const a = ((i / (n - 1)) - 0.5) * 2 * (n > 5 ? 62 : 52) * DEG + lean, hh_ = h * (1 - 0.22 * Math.abs(i / (n - 1) - 0.5) * 2);
    g.save(); g.translate(x, y); g.rotate(-a);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, 0.25 * hh_, w * 0.8, 0.78 * hh_, 0, hh_); g.bezierCurveTo(-w * 0.8, 0.78 * hh_, -w, 0.25 * hh_, 0, 0); g.closePath();
    fil(g, cols[(i + (o.shift ?? 0)) % cols.length], lw); line(g, [[0, 0.1 * hh_], [0, 0.7 * hh_]], lw * 0.5, cmix(LN, cols[i % cols.length], 0.35));
    g.restore();
  }
}
function lotusBud(g, x, y, h, o = {}) {
  const lean = (o.lean ?? 0) * DEG, w = h * 0.2, lw = o.lw ?? 0.02;
  g.save(); g.translate(x, y); g.rotate(-lean);
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, 0.2 * h, w * 0.9, 0.7 * h, 0, h); g.bezierCurveTo(-w * 0.9, 0.7 * h, -w, 0.2 * h, 0, 0); g.closePath(); fil(g, o.col ?? K.ochre, lw);
  g.beginPath(); g.moveTo(0, 0.55 * h); g.bezierCurveTo(w * 0.7, 0.62 * h, w * 0.6, 0.85 * h, 0, h); g.bezierCurveTo(-w * 0.6, 0.85 * h, -w * 0.7, 0.62 * h, 0, 0.55 * h); fil(g, o.tip ?? K.lapis, lw * 0.8);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(s * w * 1.3, 0.1 * h, s * w * 1.1, 0.4 * h, s * w * 0.3, 0.45 * h); g.bezierCurveTo(s * w * 0.6, 0.25 * h, s * w * 0.4, 0.1 * h, 0, 0); fil(g, K.green, lw * 0.8); }
  g.restore();
}
function lotusLine(g, x, y, h, kind, lw, col, o = {}) {   // gold (or any) line art, outline only
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
  const w = h * 0.2;
  if (kind === "open") {
    for (const [a, k] of [[-58, 0.78], [-30, 0.92], [0, 1], [30, 0.92], [58, 0.78]]) { g.save(); g.rotate(-a * DEG); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, 0.25 * h * k, w * 0.8, 0.78 * h * k, 0, h * k); g.bezierCurveTo(-w * 0.8, 0.78 * h * k, -w, 0.25 * h * k, 0, 0); g.stroke(); g.restore(); }
  } else {
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, 0.2 * h, w * 0.9, 0.7 * h, 0, h); g.bezierCurveTo(-w * 0.9, 0.7 * h, -w, 0.2 * h, 0, 0); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(s * w * 1.3, 0.1 * h, s * w * 1.1, 0.4 * h, s * w * 0.3, 0.45 * h); g.stroke(); }
  }
  g.restore();
}
function papyrus(g, x, y, h, seed, col = K.green) {   // a papyrus stem with its umbel
  const bend = (hh(seed) - 0.5) * 0.12;
  line(g, [[x, y], [x + bend * 0.5, y + h * 0.5], [x + bend, y + h]], 0.025, LN); line(g, [[x, y], [x + bend * 0.5, y + h * 0.5], [x + bend, y + h]], 0.012, col);
  const t = [x + bend, y + h];
  for (let i = 0; i < 7; i++) { const a = ((i / 6) - 0.5) * 2.5; line(g, [t, [t[0] + Math.sin(a) * h * 0.2, t[1] + Math.cos(a) * h * 0.2]], 0.014, cmix(LN, col, 0.3)); }
  ellP(g, t[0], t[1] + h * 0.04, h * 0.06, h * 0.035); fil(g, cmix(col, K.plasterL, 0.25), 0.012);
}
function ostrichFeather(g, x, y, h, rot, col = "#f6f2e6", lw = 0.012) {
  g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(h * 0.2, h * 0.3, h * 0.17, h * 0.8, h * 0.02, h); g.bezierCurveTo(-h * 0.12, h * 0.8, -h * 0.17, h * 0.3, 0, 0); g.closePath(); fil(g, col, lw); line(g, [[0, -0.03 * h], [0.01 * h, h * 0.96]], lw * 0.8, "#c9b98a"); g.restore();
}
function sunDisc(g, x, y, r, rays = false) { ellP(g, x, y, r, r); fil(g, K.ochre, 0.025); ellP(g, x, y, r * 0.62, r * 0.62); fil(g, K.gold, 0.015); }
function wingsSpread(g, x, y, w, h, rows = [K.lapis, K.turq, K.gold], nf = 9, dir = 1) {   // a spread-wing bird/disc: 3 rows of feathers a side
  for (const s of [-1, 1]) for (let r = rows.length - 1; r >= 0; r--) for (let i = 0; i < nf; i++) {
    const t = i / (nf - 1), fx = x + s * (0.1 + t * w * 0.5 * (1 - 0.1 * r)), fy = y - 0.2 * h * r - t * 0.05 * h, fl = h * (0.34 + 0.12 * (1 - t)) * (1 - 0.06 * r), fw = w / nf * 0.55;
    g.save(); g.translate(fx, fy); g.rotate(s * (0.05 + 0.25 * t)); g.beginPath(); g.moveTo(-fw / 2, 0); g.lineTo(fw / 2, 0); g.lineTo(fw * 0.35, -fl * 0.92); g.quadraticCurveTo(0, -fl * 1.04, -fw * 0.35, -fl * 0.92); g.closePath(); fil(g, rows[r], 0.012); g.restore();
  }
}

// ---- a potato person in profile (egg body, collar, kilt, thin limbs), feet at (x, y), height H, facing `dir` (+1 = +u)
function limb(g, pts, w, col) { line(g, pts, w + 0.04, LN); line(g, pts, w, col); }
function person(g, o) {
  const { x, y, H, dir = 1, skin = K.skin, collar = K.lapis, seed = 0, arms = [], item, behind, stride = 0.1, tilt = 0, kiltLen = 0.27, kiltCol = K.linen, seated = false, hideLegs = false, eye = true, head = null } = o;
  const U = (a) => a * H, line2 = Math.max(0.018, H * 0.014), arm = H * 0.032;
  g.save(); g.translate(x, y); g.scale(dir, 1); if (tilt) g.rotate(-tilt);
  const S = [U(0.02), U(0.6)];
  if (behind) behind(g, H);
  for (const a of arms.filter((q) => q.back)) { const E = [(S[0] + U(a.to[0])) / 2 - U(0.03) * (a.bend ?? 1), (S[1] + U(a.to[1])) / 2 - U(0.04) * (a.bend ?? 1)]; limb(g, [S, E, [U(a.to[0]), U(a.to[1])]], arm, skin); }
  if (!hideLegs) {
    limb(g, [[-U(0.04), U(0.27)], [-U(0.04) - stride * 0.5, U(0.14)], [-U(0.05) - stride, U(0.02)]], U(0.05), skin);
    ellP(g, -U(0.05) - stride + U(0.03), U(0.015), U(0.05), U(0.02)); fil(g, skin, line2);
  }
  eggP(g, 0, U(0.58), U(0.225), U(0.335), 0.1); fil(g, skin, line2 * 1.4);
  g.save(); eggP(g, 0, U(0.58), U(0.225), U(0.335), 0.1); g.clip(); ellP(g, U(0.22), U(0.6), U(0.2), U(0.4)); g.fillStyle = skin; g.fill(); ellP(g, -U(0.22), U(0.5), U(0.17), U(0.42)); g.fillStyle = rgba(K.skinS, 0.55); g.fill();
  for (let i = 0; i < 5; i++) { ellP(g, -U(0.14) + U(0.28) * hh(seed + i * 3.1), U(0.42) + U(0.3) * hh(seed + i * 5.3), U(0.012), U(0.008)); g.fillStyle = rgba(K.skinS, 0.8); g.fill(); }
  g.restore();
  // kilt (front flare, pleats, belt)
  polyP(g, [[-U(0.17), U(0.45)], [U(0.18), U(0.45)], [U(0.27), U(0.3)], [U(0.25), U(0.27 - kiltLen + 0.27)], [-U(0.18), U(0.27 - kiltLen + 0.27)]]); fil(g, kiltCol, line2);
  for (let i = 0; i < 7; i++) { const px = -U(0.15) + i * U(0.058); line(g, [[px, U(0.44)], [px + U(0.02) * (i / 6), U(0.28)]], line2 * 0.4, K.linenS); }
  polyP(g, [[-U(0.17), U(0.47)], [U(0.18), U(0.47)], [U(0.185), U(0.435)], [-U(0.175), U(0.435)]]); fil(g, K.gold, line2 * 0.8);
  // broad collar
  g.save(); g.lineCap = "butt";
  for (const [r, c, w] of [[0.205, collar, 0.05], [0.16, K.turq, 0.03], [0.13, K.gold, 0.02]]) { g.beginPath(); g.ellipse(U(0.01), U(0.66), U(r), U(r * 0.78), 0, 1.12 * Math.PI, 1.88 * Math.PI, false); g.strokeStyle = LN; g.lineWidth = U(w) + 0.03; g.stroke(); }
  for (const [r, c, w] of [[0.205, collar, 0.05], [0.16, K.turq, 0.03], [0.13, K.gold, 0.02]]) { g.beginPath(); g.ellipse(U(0.01), U(0.66), U(r), U(r * 0.78), 0, 1.12 * Math.PI, 1.88 * Math.PI, false); g.strokeStyle = c; g.lineWidth = U(w); g.stroke(); }
  g.restore();
  // the head: a potato face (eye, brow, nose, mouth) or an animal head from `head(g, H)` at the neck
  if (head) head(g, H);
  else {
    ellP(g, U(0.115), U(0.74), U(0.036), U(0.022)); g.fillStyle = "#fffaf0"; g.fill(); ink(g, line2 * 0.6); ellP(g, U(0.125), U(0.74), U(0.014), U(0.014)); g.fillStyle = "#1a1014"; g.fill();
    line(g, [[U(0.075), U(0.78)], [U(0.115), U(0.795)], [U(0.15), U(0.78)]], line2 * 0.7);
    ellP(g, U(0.215), U(0.665), U(0.026), U(0.026)); fil(g, skin, line2 * 0.9); line(g, [[U(0.16), U(0.6)], [U(0.2), U(0.595)]], line2 * 0.6);
    for (const [lx, ly, a] of [[-0.02, 0.92, -0.5], [0.03, 0.925, 0.2]]) { g.save(); g.translate(U(lx), U(ly)); g.rotate(a); g.beginPath(); g.ellipse(0, U(0.04), U(0.02), U(0.045), 0, 0, TAU); fil(g, K.green, line2 * 0.7); g.restore(); }
  }
  // front leg over the kilt
  limb(g, [[U(0.05), U(0.27)], [U(0.05) + stride * 0.5, U(0.14)], [U(0.05) + stride, U(0.02)]], U(0.05), skin);
  ellP(g, U(0.08) + stride, U(0.015), U(0.055), U(0.022)); fil(g, skin, line2);
  for (const a of arms.filter((q) => !q.back)) { const E = [(S[0] + U(a.to[0])) / 2 + U(0.0), (S[1] + U(a.to[1])) / 2 - U(0.05) * (a.bend ?? 1)]; limb(g, [S, E, [U(a.to[0]), U(a.to[1])]], arm, skin); ellP(g, U(a.to[0]), U(a.to[1]), U(0.034), U(0.034)); fil(g, skin, line2 * 0.8); }
  if (item) item(g, H);
  g.restore();
}

// ---- things people carry, and animals (all drawn facing +x from their ground point; flip with scale(-1, 1))
function jar(g, x, y, h, bands = [K.lapis, K.ochre], tilt = 0, col = K.plasterL) {
  g.save(); g.translate(x, y); g.rotate(tilt); const w = h * 0.3;
  g.beginPath(); g.moveTo(-w * 0.45, 0); g.bezierCurveTo(-w * 1.1, h * 0.25, -w * 1.05, h * 0.6, -w * 0.4, h * 0.78); g.lineTo(-w * 0.3, h * 0.92); g.lineTo(-w * 0.45, h); g.lineTo(w * 0.45, h); g.lineTo(w * 0.3, h * 0.92); g.lineTo(w * 0.4, h * 0.78);
  g.bezierCurveTo(w * 1.05, h * 0.6, w * 1.1, h * 0.25, w * 0.45, 0); g.closePath(); fil(g, col, 0.02);
  for (let i = 0; i < bands.length; i++) { const yy = h * (0.35 + 0.17 * i); g.beginPath(); g.rect(-w * 1.0, yy, w * 2.0, h * 0.07); g.save(); g.clip(); g.restore(); line(g, [[-w * 1.0 + 0.01, yy], [w * 1.0 - 0.01, yy]], h * 0.07, bands[i]); }
  g.restore();
}
function loaf(g, x, y, r, col = K.ochre) { g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r * 0.9, y + r * 1.5, x, y + r * 1.6); g.quadraticCurveTo(x + r * 0.9, y + r * 1.5, x + r, y); g.closePath(); fil(g, col, 0.015); line(g, [[x - r * 0.3, y + r * 0.5], [x + r * 0.3, y + r * 0.5]], 0.01, cmul(col, 0.7)); }
function duckP(g, x, y, s, hang = false, col = "#8a6a4a") {
  g.save(); g.translate(x, y); g.scale(s, s);
  ellP(g, 0, 0, 0.2, 0.1, hang ? -1.2 : -0.1); fil(g, col, 0.012 / s); ellP(g, 0.02, -0.02, 0.1, 0.045, hang ? -1.2 : -0.1); g.fillStyle = cmix(col, "#f6f2e6", 0.5); g.fill();
  if (hang) { line(g, [[-0.04, -0.14], [-0.02, -0.3]], 0.05 / 1, col); ellP(g, -0.02, -0.33, 0.045, 0.04); fil(g, "#2f6b3f", 0.012 / s); polyP(g, [[-0.0, -0.34], [0.05, -0.36], [0.0, -0.31]]); fil(g, K.ochre, 0.008 / s); }
  else { ellP(g, 0.2, 0.09, 0.055, 0.05); fil(g, "#2f6b3f", 0.012 / s); polyP(g, [[0.25, 0.09], [0.32, 0.075], [0.25, 0.06]]); fil(g, K.ochre, 0.008 / s); polyP(g, [[-0.18, 0.02], [-0.3, 0.08], [-0.2, -0.04]]); fil(g, col, 0.01 / s); }
  g.restore();
}
function birdP(g, x, y, s, flap = 0, col = K.linen, rot = 0) {   // a small bird, wings up (flap 0) or out (1)
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  ellP(g, 0, 0, 0.14, 0.06); fil(g, col, 0.012 / s); ellP(g, 0.16, 0.03, 0.04, 0.035); fil(g, col, 0.012 / s); polyP(g, [[0.19, 0.03], [0.26, 0.015], [0.19, 0.0]]); fil(g, K.ochre, 0.01 / s);
  const a = 0.5 + flap * 0.7; for (const k of [0, 1]) { g.save(); g.rotate(a * (k ? 0.5 : 1)); g.beginPath(); g.moveTo(-0.02, 0.02); g.quadraticCurveTo(-0.14, 0.2, -0.2, 0.3 - k * 0.05); g.quadraticCurveTo(-0.05, 0.18, 0.04, 0.03); g.closePath(); fil(g, k ? K.turq : K.lapis, 0.01 / s); g.restore(); }
  g.restore();
}
function fishP(g, x, y, len, col, seed = 0) {
  g.save(); g.translate(x, y); g.scale(len, len);
  g.beginPath(); g.moveTo(0.5, 0); g.quadraticCurveTo(0.2, 0.2, -0.3, 0.02); g.lineTo(-0.5, 0.2); g.lineTo(-0.46, 0); g.lineTo(-0.5, -0.2); g.lineTo(-0.3, -0.02); g.quadraticCurveTo(0.2, -0.2, 0.5, 0); g.closePath(); fil(g, col, 0.018 / len);
  polyP(g, [[0.1, 0.1], [-0.05, 0.28], [-0.12, 0.08]]); fil(g, cmix(col, K.line, 0.25), 0.012 / len); ellP(g, 0.32, 0.03, 0.035, 0.035); fil(g, "#fffaf0", 0.01 / len);
  g.restore();
}
function legP(g, x, y0, y1, w, col) { limb(g, [[x, y0], [x, (y0 + y1) / 2], [x, y1]], w, col); }
function calfP(g, x, y, s, seed = 0) {   // a calf, facing +x, feet at y
  const c = [K.linen, "#c98a4a", "#8a5a34", "#f3eee2"][Math.floor(hh(seed) * 4)];
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [lx, bk] of [[-0.3, 1], [-0.2, 0], [0.22, 1], [0.32, 0]]) { g.beginPath(); g.moveTo(lx - 0.035, 0.28); g.lineTo(lx + 0.035, 0.28); g.lineTo(lx + 0.025, 0.02); g.lineTo(lx - 0.025, 0.02); g.closePath(); fil(g, bk ? cmul(c, 0.85) : c, 0.02 / s); }
  g.beginPath(); g.moveTo(-0.42, 0.3); g.quadraticCurveTo(-0.45, 0.5, -0.2, 0.52); g.lineTo(0.3, 0.5); g.quadraticCurveTo(0.45, 0.48, 0.44, 0.34); g.quadraticCurveTo(0.2, 0.22, -0.2, 0.25); g.closePath(); fil(g, c, 0.02 / s);
  ellP(g, 0.05, 0.4, 0.09, 0.07, 0.3); g.fillStyle = rgba(K.ochreS, 0.55); g.fill();
  g.beginPath(); g.moveTo(0.36, 0.5); g.quadraticCurveTo(0.5, 0.58, 0.55, 0.5); g.lineTo(0.62, 0.4); g.quadraticCurveTo(0.6, 0.34, 0.54, 0.36); g.lineTo(0.42, 0.38); g.closePath(); fil(g, c, 0.02 / s);
  polyP(g, [[0.4, 0.55], [0.44, 0.64], [0.48, 0.55]]); fil(g, cmul(c, 0.85), 0.012 / s); ellP(g, 0.5, 0.46, 0.012, 0.012); g.fillStyle = LN; g.fill();
  line(g, [[-0.42, 0.34], [-0.52, 0.22], [-0.5, 0.12]], 0.025 / s, LN);
  g.restore();
}
function oxP(g, x, y, s, seed = 0) {
  const c = [K.linen, "#9a6238", "#5a3a24", "#d8b890"][Math.floor(hh(seed) * 4)];
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [lx, bk] of [[-0.55, 1], [-0.4, 0], [0.38, 1], [0.55, 0]]) { g.beginPath(); g.moveTo(lx - 0.05, 0.5); g.lineTo(lx + 0.05, 0.5); g.lineTo(lx + 0.035, 0.03); g.lineTo(lx - 0.035, 0.03); g.closePath(); fil(g, bk ? cmul(c, 0.85) : c, 0.02 / s); }
  g.beginPath(); g.moveTo(-0.75, 0.55); g.quadraticCurveTo(-0.8, 0.95, -0.35, 0.96); g.quadraticCurveTo(0, 1.1, 0.45, 0.92); g.quadraticCurveTo(0.8, 0.9, 0.78, 0.6); g.quadraticCurveTo(0.4, 0.38, -0.4, 0.42); g.closePath(); fil(g, c, 0.025 / s);
  ellP(g, -0.05, 0.7, 0.2, 0.13, 0.2); g.fillStyle = rgba(K.ochreS, 0.45); g.fill();
  g.beginPath(); g.moveTo(0.7, 0.9); g.quadraticCurveTo(0.9, 1.0, 1.05, 0.88); g.lineTo(1.12, 0.7); g.quadraticCurveTo(1.1, 0.6, 1.0, 0.62); g.lineTo(0.78, 0.62); g.closePath(); fil(g, c, 0.025 / s);
  line(g, [[0.82, 0.96], [0.84, 1.12], [0.76, 1.22]], 0.04 / s, "#efe4c8"); line(g, [[0.82, 0.96], [0.84, 1.12], [0.76, 1.22]], 0.022 / s, "#d8c9a0");
  polyP(g, [[0.72, 0.9], [0.66, 0.98], [0.76, 0.96]]); fil(g, cmul(c, 0.85), 0.012 / s); ellP(g, 0.98, 0.8, 0.014, 0.014); g.fillStyle = LN; g.fill();
  line(g, [[-0.78, 0.8], [-0.9, 0.55], [-0.88, 0.3]], 0.03 / s, LN);
  g.restore();
}
function catP(g, x, y, s, col = "#c98a4a") {   // a seated cat in profile
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-0.12, 0); g.quadraticCurveTo(-0.16, 0.2, -0.04, 0.3); g.lineTo(0.06, 0.3); g.quadraticCurveTo(0.12, 0.15, 0.1, 0); g.closePath(); fil(g, col, 0.012 / s);
  ellP(g, 0.04, 0.36, 0.07, 0.06); fil(g, col, 0.012 / s); polyP(g, [[0.0, 0.4], [0.0, 0.5], [0.05, 0.42]]); fil(g, col, 0.01 / s); polyP(g, [[0.06, 0.42], [0.1, 0.5], [0.1, 0.4]]); fil(g, col, 0.01 / s);
  ellP(g, 0.08, 0.37, 0.012, 0.012); g.fillStyle = LN; g.fill(); line(g, [[-0.12, 0.02], [-0.25, 0.06], [-0.26, 0.2]], 0.02 / s, col); line(g, [[-0.12, 0.02], [-0.25, 0.06], [-0.26, 0.2]], 0.01 / s, LN);
  g.restore();
}
function waves(g, x0, x1, y, n, spacing = 0.09, col = K.turqS, seed = 0) {
  for (let i = 0; i < n; i++) { const yy = y - i * spacing, ph = hh(seed + i * 2.3) * 0.3, per = 0.2 + 0.05 * hh(seed + i); g.beginPath(); for (let x = x0; x <= x1; x += 0.02) { const k = Math.sin((x + ph) / per * TAU) * 0.018; x === x0 ? g.moveTo(x, yy + k) : g.lineTo(x, yy + k); } g.strokeStyle = i % 2 ? K.turq : col; g.lineWidth = 0.02; g.lineCap = "round"; g.stroke(); }
}
function boat(g, x, y, len, rowers, seed, dir = 1) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.beginPath(); g.moveTo(-len / 2, 0.42); g.quadraticCurveTo(-len / 2 + 0.05, 0.12, -len / 2 + 0.32, 0.03); g.lineTo(len / 2 - 0.32, 0.03); g.quadraticCurveTo(len / 2 - 0.05, 0.12, len / 2, 0.42); g.lineTo(len / 2 - 0.1, 0.3); g.lineTo(-len / 2 + 0.1, 0.3); g.closePath(); fil(g, K.ochre, 0.025);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * len / 2, 0.42); g.quadraticCurveTo(sx * (len / 2 + 0.05), 0.58, sx * (len / 2 - 0.1), 0.66); g.quadraticCurveTo(sx * (len / 2 - 0.04), 0.5, sx * (len / 2 - 0.12), 0.38); g.closePath(); fil(g, K.green, 0.02); }
  line(g, [[-len / 2 + 0.2, 0.16], [len / 2 - 0.2, 0.16]], 0.022, K.gold); line(g, [[-len / 2 + 0.28, 0.1], [len / 2 - 0.28, 0.1]], 0.014, K.lapis);
  const R = rowers, span = len - 0.9;
  for (let i = 0; i < R; i++) { const px = -len / 2 + 0.55 + (R > 1 ? span * (i / (R - 1)) * 0.82 : 0); person(g, { x: px, y: 0.3, H: 0.78, dir: 1, seed: seed + i, skin: pick([K.skin, "#c98a46"], hh(seed + i * 3) * 2), collar: pick([K.lapis, K.turq, K.ochre], hh(seed + i * 7) * 3), hideLegs: true, kiltLen: 0.12, arms: [{ to: [0.3, 0.4] }], item: (gg, H) => { line(gg, [[0.3 * H, 0.4 * H], [0.55 * H, -0.12]], 0.03, LN); line(gg, [[0.3 * H, 0.4 * H], [0.55 * H, -0.12]], 0.016, "#c9a060"); } }); }
  const sx = len / 2 - 0.5; person(g, { x: sx, y: 0.3, H: 0.85, dir: 1, seed: seed + 99, collar: K.ochre, hideLegs: true, kiltLen: 0.12, arms: [{ to: [0.3, 0.45] }], item: (gg, H) => { line(gg, [[0.3 * H, 0.45 * H], [0.5 * H, -0.28]], 0.03, LN); line(gg, [[0.3 * H, 0.45 * H], [0.5 * H, -0.28]], 0.016, "#c9a060"); polyP(gg, [[0.45 * H, -0.24], [0.6 * H, -0.3], [0.52 * H, -0.12]]); fil(gg, "#c9a060", 0.012); } });
  g.restore();
}
function tableP(g, x, y, w, h, loaves, jars, seed) {
  polyP(g, [[x - w / 2, y + h], [x + w / 2, y + h], [x + w / 2 - 0.04, y + h - 0.05], [x - w / 2 + 0.04, y + h - 0.05]]); fil(g, K.ochreS, 0.02);
  line(g, [[x - w / 2 + 0.06, y + h - 0.05], [x - w / 2 + 0.06, y]], 0.05, LN); line(g, [[x - w / 2 + 0.06, y + h - 0.05], [x - w / 2 + 0.06, y]], 0.025, K.ochre);
  line(g, [[x + w / 2 - 0.06, y + h - 0.05], [x + w / 2 - 0.06, y]], 0.05, LN); line(g, [[x + w / 2 - 0.06, y + h - 0.05], [x + w / 2 - 0.06, y]], 0.025, K.ochre);
  for (let i = 0; i < loaves; i++) loaf(g, x - w / 2 + 0.12 + (i / (loaves - 1)) * (w - 0.3) * 0.62, y + h, 0.045 + 0.012 * hh(seed + i), pick([K.ochre, "#c98a46", K.plasterL], hh(seed + i * 5) * 3));
  for (let i = 0; i < jars; i++) jar(g, x + w / 2 - 0.13 - i * 0.11, y + h, 0.18 + 0.04 * hh(seed + i * 9), [pick([K.lapis, K.turq], i), K.ochre]);
}
function harpP(g, x, y, h, dir = 1) {   // an arched harp standing on the ground at x
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-0.05 * h, 0.9 * h, 0.5 * h, 0.92 * h); g.quadraticCurveTo(0.2 * h, 0.8 * h, 0.14 * h, 0.04 * h); g.closePath(); fil(g, K.gold, 0.02);
  for (let i = 0; i < 7; i++) { const t = (i + 1) / 8; line(g, [[0.14 * h * (1 - t) + 0.02 * h, 0.04 * h + 0.02 * h * t], [0.45 * h * t + 0.0, 0.86 * h * (0.7 + 0.3 * t) - 0.1 * h]], 0.008, "#8a6a3c"); }
  g.restore();
}
function balanceP(g, x, y, s) {   // a small balance: pillar, beam, two pans on cords, a feather and a round jar
  g.save(); g.translate(x, y); g.scale(s, s);
  line(g, [[0, 0], [0, 0.75]], 0.07 / s, LN); line(g, [[0, 0], [0, 0.75]], 0.04 / s, K.gold); polyP(g, [[-0.14, 0], [0.14, 0], [0.1, 0.04], [-0.1, 0.04]]); fil(g, K.gold, 0.02 / s);
  line(g, [[-0.42, 0.76], [0.42, 0.76]], 0.05 / s, LN); line(g, [[-0.42, 0.76], [0.42, 0.76]], 0.028 / s, K.gold); ellP(g, 0, 0.76, 0.035, 0.035); fil(g, K.lapis, 0.012 / s);
  for (const px of [-0.42, 0.42]) { line(g, [[px, 0.76], [px - 0.16, 0.36]], 0.008 / s, LN); line(g, [[px, 0.76], [px + 0.16, 0.36]], 0.008 / s, LN); g.beginPath(); g.moveTo(px - 0.18, 0.36); g.quadraticCurveTo(px, 0.3, px + 0.18, 0.36); g.closePath(); fil(g, K.gold, 0.016 / s); }
  ostrichFeather(g, 0.42, 0.37, 0.2, 0.2); ellP(g, -0.42, 0.44, 0.075, 0.075); fil(g, K.ochre, 0.015 / s);
  g.restore();
}
function sheaf(g, x, y, h, seed) {
  for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 0.7; line(g, [[x + a * 0.05, y], [x + Math.sin(a) * h * 0.5, y + h * 0.5], [x + Math.sin(a) * h * 0.95, y + Math.cos(a) * h * 0.95]], 0.018, LN); line(g, [[x + a * 0.05, y], [x + Math.sin(a) * h * 0.95, y + Math.cos(a) * h * 0.95]], 0.01, i % 2 ? "#e9b93a" : "#f6d86a"); ellP(g, x + Math.sin(a) * h * 0.97, y + Math.cos(a) * h * 0.97, 0.018, 0.045, -a); fil(g, "#e9b93a", 0.008); }
  line(g, [[x - 0.075, y + h * 0.28], [x + 0.075, y + h * 0.28]], 0.03, LN); line(g, [[x - 0.075, y + h * 0.28], [x + 0.075, y + h * 0.28]], 0.016, K.ochre);
}
function monsterSeated(g, x, y, s, dir = 1) {   // the seated monster of the weighing: hippo belly, lion mane, crocodile head (small, to read as a picture)
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  ellP(g, -0.1, 0.36, 0.5, 0.36); fil(g, "#77785f", 0.02 / s); ellP(g, -0.05, 0.25, 0.36, 0.2); g.fillStyle = "#a09c80"; g.fill();
  for (const lx of [-0.35, 0.1]) { limb(g, [[lx, 0.2], [lx + 0.04, 0.08], [lx + 0.06, 0.01]], 0.13, "#6f7059"); }
  ellP(g, 0.3, 0.7, 0.3, 0.26); fil(g, "#7a4a26", 0.02 / s); for (let i = 0; i < 9; i++) { const a = -0.4 + i * 0.42; line(g, [[0.3 + Math.cos(a) * 0.12, 0.7 + Math.sin(a) * 0.1], [0.3 + Math.cos(a) * 0.3, 0.7 + Math.sin(a) * 0.26]], 0.02 / s, "#4f2e17"); }
  g.beginPath(); g.moveTo(0.3, 0.76); g.lineTo(0.78, 0.73); g.quadraticCurveTo(0.9, 0.7, 0.86, 0.64); g.lineTo(0.56, 0.58); g.lineTo(0.3, 0.6); g.closePath(); fil(g, "#6c7048", 0.02 / s);
  for (let i = 0; i < 6; i++) polyP(g, [[0.5 + i * 0.065, 0.63], [0.52 + i * 0.065, 0.58], [0.54 + i * 0.065, 0.63]]), fil(g, "#ecd98a", 0.006 / s);
  ellP(g, 0.45, 0.78, 0.035, 0.03); fil(g, "#f0b21c", 0.01 / s); ellP(g, 0.46, 0.78, 0.008, 0.02); g.fillStyle = LN; g.fill();
  g.restore();
}

// ---- the heads of the judges: facing +x, origin = the neck's middle (head about 0.4 m)
const HEADS = [
  (g, s) => { ellP(g, 0.02, 0.19, 0.15, 0.15); fil(g, "#6a5a4a", 0.02); g.beginPath(); g.moveTo(0.12, 0.22); g.quadraticCurveTo(0.26, 0.2, 0.22, 0.05); g.quadraticCurveTo(0.18, 0.12, 0.1, 0.14); g.closePath(); fil(g, K.ochre, 0.015); ellP(g, 0.08, 0.24, 0.028, 0.026); fil(g, "#fffaf0", 0.01); ellP(g, 0.09, 0.24, 0.012, 0.012); g.fillStyle = LN; g.fill(); line(g, [[0.09, 0.2], [0.07, 0.1]], 0.02, LN); line(g, [[-0.1, 0.2], [-0.2, 0.26]], 0.04, K.lapis); },   // falcon
  (g, s) => { ellP(g, 0.0, 0.2, 0.12, 0.13); fil(g, "#f6f2e6", 0.02); g.beginPath(); g.moveTo(0.1, 0.24); g.quadraticCurveTo(0.36, 0.26, 0.38, 0.0); g.quadraticCurveTo(0.3, 0.16, 0.1, 0.17); g.closePath(); fil(g, "#2a2a30", 0.018); ellP(g, 0.05, 0.24, 0.022, 0.022); fil(g, "#fffaf0", 0.008); ellP(g, 0.055, 0.24, 0.01, 0.01); g.fillStyle = LN; g.fill(); },   // ibis
  (g, s) => { ellP(g, 0.03, 0.17, 0.16, 0.14); fil(g, "#c98a4a", 0.02); polyP(g, [[-0.08, 0.28], [-0.1, 0.46], [0.02, 0.3]]); fil(g, "#c98a4a", 0.015); polyP(g, [[0.06, 0.3], [0.16, 0.45], [0.16, 0.26]]); fil(g, "#c98a4a", 0.015); ellP(g, 0.1, 0.2, 0.025, 0.022); fil(g, "#e8d84a", 0.008); line(g, [[0.15, 0.13], [0.3, 0.15]], 0.008, LN); line(g, [[0.15, 0.11], [0.3, 0.09]], 0.008, LN); ellP(g, 0.17, 0.15, 0.015, 0.012); g.fillStyle = "#c4687a"; g.fill(); },   // cat
  (g, s) => { ellP(g, 0.03, 0.19, 0.13, 0.15); fil(g, "#e8e0c8", 0.02); g.beginPath(); g.ellipse(0.0, 0.2, 0.17, 0.15, 0, -0.4 * Math.PI, 0.8 * Math.PI); line(g, [[0.04, 0.3], [-0.13, 0.32], [-0.2, 0.2], [-0.14, 0.1], [-0.02, 0.12], [0.0, 0.2]], 0.045, LN); line(g, [[0.04, 0.3], [-0.13, 0.32], [-0.2, 0.2], [-0.14, 0.1], [-0.02, 0.12], [0.0, 0.2]], 0.025, K.gold); ellP(g, 0.12, 0.12, 0.09, 0.07, -0.3); fil(g, "#e8e0c8", 0.015); ellP(g, 0.08, 0.24, 0.02, 0.02); fil(g, "#fffaf0", 0.008); },   // ram
  (g, s) => { ellP(g, 0.03, 0.18, 0.13, 0.15); fil(g, "#efe4c8", 0.02); ellP(g, 0.13, 0.08, 0.08, 0.06, -0.3); fil(g, "#d8b890", 0.015); line(g, [[-0.04, 0.3], [-0.12, 0.42], [-0.04, 0.5]], 0.025, LN); line(g, [[0.04, 0.3], [0.12, 0.42], [0.2, 0.5]], 0.025, LN); ellP(g, 0.04, 0.5, 0.06, 0.06); fil(g, K.gold, 0.012); polyP(g, [[-0.1, 0.22], [-0.24, 0.26], [-0.12, 0.16]]); fil(g, "#efe4c8", 0.012); ellP(g, 0.08, 0.22, 0.02, 0.02); g.fillStyle = LN; g.fill(); },   // cow
  (g, s) => { ellP(g, 0.03, 0.18, 0.15, 0.14); fil(g, "#d8a860", 0.02); ellP(g, -0.06, 0.3, 0.04, 0.04); fil(g, "#d8a860", 0.012); ellP(g, 0.13, 0.1, 0.09, 0.07); fil(g, "#e8c890", 0.015); ellP(g, 0.2, 0.14, 0.02, 0.015); g.fillStyle = "#5a3a2a"; g.fill(); ellP(g, 0.08, 0.22, 0.02, 0.018); fil(g, "#e8d84a", 0.008); },   // lioness
  (g, s) => { g.beginPath(); g.moveTo(-0.1, 0.14); g.quadraticCurveTo(-0.1, 0.3, 0.1, 0.3); g.lineTo(0.42, 0.24); g.quadraticCurveTo(0.48, 0.18, 0.4, 0.12); g.lineTo(0.1, 0.06); g.closePath(); fil(g, "#6c7048", 0.02); for (let i = 0; i < 5; i++) polyP(g, [[0.17 + i * 0.045, 0.12], [0.19 + i * 0.045, 0.08], [0.21 + i * 0.045, 0.12]]), fil(g, "#f8efc0", 0.006); ellP(g, 0.06, 0.3, 0.035, 0.03); fil(g, "#6c7048", 0.012); ellP(g, 0.065, 0.31, 0.012, 0.015); g.fillStyle = LN; g.fill(); },   // crocodile
  (g, s) => { ellP(g, 0.04, 0.12, 0.2, 0.1); fil(g, "#5a8a4a", 0.02); for (const sx of [-0.04, 0.12]) { ellP(g, sx, 0.23, 0.05, 0.05); fil(g, "#7aa85a", 0.015); ellP(g, sx + 0.01, 0.235, 0.022, 0.022); g.fillStyle = "#f0e060"; g.fill(); ellP(g, sx + 0.015, 0.235, 0.008, 0.016); g.fillStyle = LN; g.fill(); } line(g, [[-0.14, 0.09], [0.22, 0.1]], 0.012, LN); },   // frog
  (g, s) => { g.beginPath(); g.moveTo(-0.02, 0); g.quadraticCurveTo(-0.2, 0.2, -0.12, 0.42); g.quadraticCurveTo(0.04, 0.5, 0.2, 0.42); g.quadraticCurveTo(0.26, 0.2, 0.14, 0); g.closePath(); fil(g, "#5a8a4a", 0.02); ellP(g, 0.04, 0.2, 0.06, 0.12); g.fillStyle = "#d8c890"; g.fill(); ellP(g, 0.03, 0.34, 0.1, 0.09); fil(g, "#5a8a4a", 0.015); ellP(g, 0.07, 0.36, 0.02, 0.02); fil(g, "#f0e060", 0.008); line(g, [[0.12, 0.3], [0.22, 0.3], [0.26, 0.34]], 0.01, K.ochre); line(g, [[0.22, 0.3], [0.26, 0.26]], 0.01, K.ochre); },   // cobra
  (g, s) => { ellP(g, 0.02, 0.16, 0.12, 0.1); fil(g, "#b09070", 0.02); polyP(g, [[-0.04, 0.22], [-0.1, 0.52], [0.0, 0.5], [0.04, 0.24]]); fil(g, "#b09070", 0.015); polyP(g, [[0.04, 0.24], [0.06, 0.5], [0.14, 0.46], [0.1, 0.22]]); fil(g, "#b09070", 0.015); ellP(g, 0.13, 0.13, 0.06, 0.045); fil(g, "#e8dcc8", 0.012); ellP(g, 0.18, 0.15, 0.012, 0.01); g.fillStyle = "#5a3a2a"; g.fill(); ellP(g, 0.07, 0.19, 0.02, 0.018); fil(g, "#e8d84a", 0.008); },   // hare
  (g, s) => { ellP(g, 0.02, 0.16, 0.16, 0.14); fil(g, "#7a7a86", 0.02); ellP(g, 0.17, 0.08, 0.14, 0.1); fil(g, "#8a8a98", 0.018); ellP(g, 0.26, 0.1, 0.012, 0.012); g.fillStyle = LN; g.fill(); ellP(g, 0.26, 0.04, 0.012, 0.012); g.fillStyle = LN; g.fill(); ellP(g, -0.06, 0.28, 0.035, 0.035); fil(g, "#7a7a86", 0.012); ellP(g, 0.08, 0.22, 0.02, 0.02); g.fillStyle = LN; g.fill(); line(g, [[0.1, 0.0], [0.3, 0.02]], 0.01, LN); },   // hippo
  (g, s) => { ellP(g, -0.04, 0.12, 0.22, 0.2); fil(g, "#9a9ab0", 0.02); ellP(g, 0.03, 0.2, 0.12, 0.12); fil(g, "#7a6a5a", 0.02); g.beginPath(); g.moveTo(0.08, 0.16); g.lineTo(0.28, 0.12); g.quadraticCurveTo(0.33, 0.06, 0.26, 0.03); g.lineTo(0.08, 0.06); g.closePath(); fil(g, "#6a5a4a", 0.018); ellP(g, 0.1, 0.22, 0.02, 0.018); fil(g, "#e8d84a", 0.008); ellP(g, 0.27, 0.1, 0.012, 0.01); g.fillStyle = LN; g.fill(); },   // baboon
  (g, s) => { ellP(g, 0.0, 0.16, 0.13, 0.12); fil(g, "#1b1a21", 0.02); g.beginPath(); g.moveTo(0.1, 0.2); g.lineTo(0.38, 0.1); g.lineTo(0.38, 0.06); g.lineTo(0.08, 0.06); g.closePath(); fil(g, "#1b1a21", 0.018); polyP(g, [[-0.08, 0.24], [-0.1, 0.5], [0.04, 0.28]]); fil(g, "#1b1a21", 0.015); polyP(g, [[0.04, 0.26], [0.1, 0.5], [0.14, 0.24]]); fil(g, "#1b1a21", 0.015); ellP(g, 0.06, 0.2, 0.022, 0.016); fil(g, "#e9a820", 0.008); ellP(g, 0.37, 0.095, 0.015, 0.012); g.fillStyle = "#0d0c10"; g.fill(); },   // jackal
  (g, s) => { ellP(g, 0.0, 0.18, 0.13, 0.13); fil(g, "#d8a0a0", 0.02); g.beginPath(); g.moveTo(0.1, 0.24); g.quadraticCurveTo(0.34, 0.24, 0.3, 0.02); g.quadraticCurveTo(0.26, 0.12, 0.1, 0.14); g.closePath(); fil(g, "#e8d4a0", 0.018); ellP(g, 0.06, 0.22, 0.022, 0.02); fil(g, "#f0e060", 0.008); ellP(g, -0.1, 0.06, 0.1, 0.06); fil(g, "#f6f2e6", 0.015); line(g, [[0.1, 0.1], [0.12, 0.0]], 0.03, "#c4687a"); },   // vulture
];
const HEAD_NAMES = ["falcon", "ibis", "cat", "ram", "cow", "lioness", "crocodile", "frog", "cobra", "hare", "hippo", "baboon", "jackal", "vulture"];

// ---- the 8 types of the procession (1.5 m figures; ground line at y0): item + arm pose by index
function procItem(type, g, H, seed) {
  const U = (a) => a * H;
  if (type === 0) { for (let i = 0; i < 3; i++) { const tx = U(0.34 + 0.05 * (i - 1) + 0.04), ty = U(0.98 + 0.06 * (i % 2)); line(g, [[U(0.36), U(0.5)], [tx, ty]], 0.03, LN); line(g, [[U(0.36), U(0.5)], [tx, ty]], 0.015, K.green); if (i === 1) lotusBud(g, tx, ty, U(0.17), { lean: 6 }); else lotusFlower(g, tx, ty, U(0.15), { petals: 5, lean: (i - 1) * 14 }); } }
  else if (type === 1) { jar(g, -U(0.02), U(0.86), U(0.5), [K.lapis, K.turq, K.ochre], -0.18, K.plasterL); }
  else if (type === 2) { line(g, [[U(0.1), U(0.8)], [U(0.5), U(0.8)]], 0.04, LN); line(g, [[U(0.1), U(0.8)], [U(0.5), U(0.8)]], 0.022, K.gold); for (let i = 0; i < 5; i++) loaf(g, U(0.16 + i * 0.075), U(0.82), 0.04, pick([K.ochre, "#c98a46", K.plasterL], hh(seed + i * 3) * 3)); }
  else if (type === 3) { duckP(g, U(0.36), U(0.3), 0.9, true, pick(["#8a6a4a", "#6a5a4a", "#a07a5a"], hh(seed) * 3)); }
  else if (type === 4) { line(g, [[U(0.3), U(0.55)], [U(0.46), U(1.0)]], 0.035, LN); line(g, [[U(0.3), U(0.55)], [U(0.46), U(1.0)]], 0.018, "#c9a060"); for (let i = 0; i < 9; i++) { const a = -0.15 + (i / 8) * 1.5 - 0.7; g.save(); g.translate(U(0.46), U(1.0)); g.rotate(-a + 0.2); g.beginPath(); g.ellipse(0, U(0.11), U(0.02), U(0.11), 0, 0, TAU); fil(g, i % 3 === 0 ? K.lapis : i % 3 === 1 ? "#f6f2e6" : K.turq, 0.01); g.restore(); } }
  else if (type === 5) { line(g, [[U(0.3), U(0.5)], [U(0.45), U(0.35)], [U(0.56), U(0.36)]], 0.012, LN); calfP(g, U(0.56), 0.0, 0.55 * H / 1.5, seed); }
  else if (type === 6) { g.save(); g.translate(U(0.03), U(0.97)); g.beginPath(); g.moveTo(-U(0.14), 0); g.lineTo(U(0.14), 0); g.lineTo(U(0.18), U(0.13)); g.lineTo(-U(0.18), U(0.13)); g.closePath(); fil(g, "#c9a060", 0.02); for (let i = 1; i < 4; i++) line(g, [[-U(0.17) + i * U(0.085), U(0.01)], [-U(0.17) + i * U(0.085), U(0.12)]], 0.008, "#8a6a3c"); for (let i = 0; i < 5; i++) { ellP(g, -U(0.12) + i * U(0.06), U(0.15), U(0.03), U(0.03)); fil(g, pick([K.ochre, K.green, "#c98a46"], hh(seed + i) * 3), 0.012); } g.restore(); }
  else { g.save(); g.translate(U(0.28), U(0.28)); harpP(g, U(0.12), 0, U(0.6), 1); g.restore(); }
}
const PROC_ARMS = [
  [{ to: [0.36, 0.5] }], [{ to: [0.12, 0.98], bend: -1 }], [{ to: [0.5, 0.8] }], [{ to: [0.36, 0.36] }], [{ to: [0.3, 0.55] }], [{ to: [0.3, 0.5] }], [{ to: [0.1, 1.0], bend: -1 }], [{ to: [0.3, 0.55] }],
];

// ---- scenes of register 2 (4.2 m wide, y 3.2..5.0). u0 = the scene's left edge in wall coordinates, det = detail set (0 first pass, 1 second)
const SCENE_NAMES = ["harvest", "boat", "cattle", "marsh", "feast", "music", "weighing"];
function seatedP(g, o) {   // a seated potato person on a low stool, facing `dir`
  const { x, y, H, dir = 1, seed = 0, collar = K.turq, item, arms = [], skin = K.skin } = o, top = 0.36 * (H / 1.2), y2 = y + top - 0.25 * H;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  polyP(g, [[-0.2 * H, top], [0.14 * H, top], [0.12 * H, top - 0.05], [-0.18 * H, top - 0.05]]); fil(g, K.ochreS, 0.02);
  line(g, [[-0.16 * H, top - 0.05], [-0.18 * H, 0]], 0.03, LN); line(g, [[0.1 * H, top - 0.05], [0.12 * H, 0]], 0.03, LN);
  limb(g, [[0.02 * H, top + 0.03], [0.3 * H, top + 0.03], [0.32 * H, 0.04]], 0.05 * H, skin); ellP(g, 0.34 * H, 0.025, 0.055 * H, 0.025 * H); fil(g, skin, 0.015);
  g.restore();
  person(g, { x, y: y2, H, dir, seed, skin, collar, hideLegs: true, arms, item, kiltLen: 0.3 });
}
function jackalHead(g, H) { g.save(); g.translate(0.02 * H, 0.9 * H); g.scale(H * 1.8, H * 1.8); HEADS[12](g, 1); g.restore(); }
function sceneHarvest(g, u0, det, sd) {
  const gy = 3.3;
  for (let i = 0; i < 64; i++) { const x = u0 + 0.05 + (i / 63) * 4.1, h = 0.75 + 0.2 * hh(sd + i * 1.7); line(g, [[x, gy], [x + 0.02, gy + h * 0.6], [x + (hh(sd + i) - 0.5) * 0.06, gy + h]], 0.018, LN); line(g, [[x, gy], [x + (hh(sd + i) - 0.5) * 0.06, gy + h]], 0.009, i % 3 ? "#f6d86a" : "#e9b93a"); ellP(g, x + (hh(sd + i) - 0.5) * 0.06, gy + h + 0.035, 0.014, 0.045); fil(g, "#e9b93a", 0.008); }
  line(g, [[u0, gy], [u0 + 4.2, gy]], 0.03, LN);
  const xs = det ? [0.5, 1.62, 2.7] : [0.75, 1.85, 3.0];
  xs.forEach((dx, i) => person(g, { x: u0 + dx, y: gy + 0.02, H: 1.15, dir: 1, tilt: 0.4 + 0.06 * i, seed: sd + i, skin: pick([K.skin, "#c98a46"], hh(sd + i) * 2), collar: pick([K.lapis, K.turq, K.ochre], i + det), arms: [{ to: [0.42, 0.34], bend: 0.6 }], item: (gg, H) => { gg.save(); gg.translate(0.42 * H, 0.34 * H); gg.rotate(0.5); gg.beginPath(); gg.moveTo(0, 0); gg.quadraticCurveTo(0.18, 0.02, 0.2, -0.16); gg.lineTo(0.17, -0.13); gg.quadraticCurveTo(0.14, -0.04, 0, -0.03); gg.closePath(); fil(gg, "#c9ced6", 0.012); gg.restore(); } }));
  const sx = det ? [0.2, 1.25, 2.35, 3.45, 3.95] : [0.3, 1.35, 2.4, 3.5, 4.0];
  sx.forEach((dx, i) => sheaf(g, u0 + dx, gy + 0.02, 0.55 + 0.1 * hh(sd + i * 7), sd + i));
}
function sceneBoat(g, u0, det, sd, o = {}) {
  const len = o.len ?? 3.1, cx = u0 + (o.w ?? 4.2) / 2, by = o.y0 ?? 3.92;
  waves(g, u0 + 0.05, u0 + (o.w ?? 4.2) - 0.05, by - 0.04, 9, 0.045, K.turqS, sd);
  boat(g, cx, by, len, o.rowers ?? 4, sd + det * 11, det ? -1 : 1);
  for (let i = 0; i < 6; i++) fishP(g, u0 + 0.35 + (o.w ?? 4.2 - 0.7) * (i / 5) + 0.15 * (hh(sd + i) - 0.5), (o.y0 ?? 3.92) - 0.5 + 0.06 * hh(sd + i * 3) - 0.12 * (i % 2), 0.24 + 0.08 * hh(sd + i * 5), pick([K.ochre, K.lapis, "#c98a46", K.turq, K.gold, "#6a5a8a"], i + det * 2), sd + i);
}
function sceneCattle(g, u0, det, sd) {
  const gy = 3.3; line(g, [[u0, gy], [u0 + 4.2, gy]], 0.03, LN);
  for (let i = 0; i < 14; i++) { const x = u0 + 0.1 + 0.3 * i + 0.1 * hh(sd + i); line(g, [[x, gy], [x - 0.03, gy + 0.1]], 0.014, K.green); line(g, [[x, gy], [x + 0.03, gy + 0.12]], 0.014, K.green); }
  const xs = det ? [0.5, 1.5, 2.6] : [0.7, 1.75, 2.85];
  xs.forEach((dx, i) => oxP(g, u0 + dx, gy + 0.01, 0.78 + 0.08 * hh(sd + i * 3), sd + i + det * 4));
  person(g, { x: u0 + 3.85, y: gy + 0.02, H: 1.3, dir: -1, seed: sd, collar: K.ochre, arms: [{ to: [0.32, 0.55] }], item: (gg, H) => { line(gg, [[0.32 * H, 0.55 * H], [0.5 * H, 1.05 * H]], 0.03, LN); line(gg, [[0.32 * H, 0.55 * H], [0.5 * H, 1.05 * H]], 0.016, "#c9a060"); } });
}
function sceneMarsh(g, u0, det, sd) {
  const gy = 3.3; waves(g, u0 + 0.05, u0 + 4.15, gy + 0.02, 2, 0.07, K.turqS, sd);
  for (let i = 0; i < 14; i++) papyrus(g, u0 + 0.2 + (i / 13) * 3.8 + 0.1 * (hh(sd + i) - 0.5), gy + 0.05, 0.95 + 0.5 * hh(sd + i * 3.3), sd + i, pick([K.green, "#6a9a4a", "#4f8a4a"], i + det));
  for (let i = 0; i < 5; i++) birdP(g, u0 + 0.5 + i * 0.8 + 0.2 * hh(sd + i), 4.1 + 0.55 * hh(sd + i * 2.1) + 0.1 * i % 3, 0.55 + 0.2 * hh(sd + i * 9), (i + det) % 2 ? 0.2 : 1, pick([K.linen, "#d8c9a0", K.lapisL], i), (hh(sd + i) - 0.5) * 0.4);
  catP(g, u0 + (det ? 3.2 : 0.9), gy + 0.04, 1.0, pick(["#c98a4a", "#8a6a4a"], det));
}
function sceneFeast(g, u0, det, sd) {
  const gy = 3.3; line(g, [[u0, gy], [u0 + 4.2, gy]], 0.03, LN);
  tableP(g, u0 + 2.1, gy, 1.5, 0.72, 7, 3, sd);
  lotusFlower(g, u0 + 1.55, gy + 0.78, 0.16, { petals: 5, lean: 8 });
  seatedP(g, { x: u0 + 0.75, y: gy, H: 1.25, dir: 1, seed: sd, collar: K.turq, arms: [{ to: [0.42, 0.52] }] });
  seatedP(g, { x: u0 + 3.45, y: gy, H: 1.25, dir: -1, seed: sd + 9, collar: K.ochre, arms: [{ to: [0.42, 0.52] }] });
  if (det) { jar(g, u0 + 0.2, gy, 0.5, [K.lapis, K.ochre]); jar(g, u0 + 4.0, gy, 0.45, [K.turq, K.ochre]); } else { papyrus(g, u0 + 0.25, gy, 0.7, sd); papyrus(g, u0 + 3.95, gy, 0.6, sd + 4); }
}
function sceneMusic(g, u0, det, sd) {
  const gy = 3.3; line(g, [[u0, gy], [u0 + 4.2, gy]], 0.03, LN);
  seatedP(g, { x: u0 + 0.8, y: gy, H: 1.2, dir: 1, seed: sd, collar: K.lapis, arms: [{ to: [0.46, 0.7] }], item: (gg, H) => harpP(gg, 0.5 * H, 0, 1.15, 1) });
  person(g, { x: u0 + 2.5, y: gy + 0.02, H: 1.3, dir: 1, seed: sd + 3, collar: K.turq, arms: [{ to: [0.45, 0.72] }, { to: [0.4, 0.66], back: true }], item: (gg, H) => { line(gg, [[0.45 * H, 0.72 * H], [0.78 * H, 0.9 * H]], 0.035, LN); line(gg, [[0.45 * H, 0.72 * H], [0.78 * H, 0.9 * H]], 0.018, "#c9a060"); line(gg, [[0.45 * H, 0.7 * H], [0.78 * H, 0.84 * H]], 0.035, LN); line(gg, [[0.45 * H, 0.7 * H], [0.78 * H, 0.84 * H]], 0.018, "#c9a060"); } });
  person(g, { x: u0 + 3.5, y: gy + 0.02, H: 1.3, dir: -1, seed: sd + 7, collar: K.ochre, stride: 0.16, arms: [{ to: [0.3, 0.9] }, { to: [0.22, 0.86], back: true }], item: (gg, H) => { for (const [a, b] of [[0.3, 0.9], [0.22, 0.86]]) line(gg, [[a * H, b * H], [a * H + 0.04, b * H + 0.2]], 0.03, K.gold); } });
  if (det) person(g, { x: u0 + 1.7, y: gy + 0.02, H: 0.8, dir: 1, seed: sd + 12, collar: K.lapis, stride: 0.1, arms: [{ to: [0.3, 0.55] }] });
}
function sceneWeighing(g, u0, det, sd, o = {}) {
  const gy = o.gy ?? 3.3; line(g, [[u0, gy], [u0 + (o.w ?? 4.2), gy]], 0.03, LN);
  const c = o.cx ?? u0 + 2.1;
  balanceP(g, c, gy, 1.5);
  person(g, { x: c - 1.0, y: gy + 0.02, H: 1.4, dir: 1, seed: sd, kiltCol: K.linen, collar: K.gold, head: jackalHead, skin: "#1b1a21", arms: [{ to: [0.4, 0.62] }] });
  monsterSeated(g, c + 1.55, gy, 0.95, -1);
  for (const [dx, i] of [[0.75, 0], [1.1, 1]]) person(g, { x: c + dx - (det ? 0.1 : 0), y: gy + 0.02, H: 1.0 - 0.1 * i, dir: -1, seed: sd + 5 + i, collar: pick([K.turq, K.lapis], i), stride: 0.08, arms: [{ to: [0.3, 0.55] }] });
}
const SCENES = [sceneHarvest, sceneBoat, sceneCattle, sceneMarsh, sceneFeast, sceneMusic, sceneWeighing];

// ---- register 3: a judge as a picture: a seated potato person with an animal head on a throne, one feather in the hand
function paintJudge(g, u, y0, head, throne, dir, sd) {
  g.save(); g.translate(u, y0); g.scale(dir, 1);
  const tc = [K.lapis, K.turq, K.ochre][throne % 3], tcs = [K.lapisS, K.turqS, K.ochreS][throne % 3];
  polyP(g, [[-0.3, 0], [0.26, 0], [0.26, 0.46], [-0.3, 0.46]]); fil(g, tc, 0.022);
  polyP(g, [[-0.3, 0.46], [-0.36, 1.35], [-0.24, 1.35], [-0.2, 0.46]]); fil(g, tc, 0.022);
  for (let i = 0; i < 4; i++) line(g, [[-0.26 + i * 0.12, 0.06], [-0.26 + i * 0.12, 0.4]], 0.014, tcs); line(g, [[-0.28, 0.36], [0.24, 0.36]], 0.016, K.gold); line(g, [[-0.28, 0.1], [0.24, 0.1]], 0.016, K.gold);
  limb(g, [[0.1, 0.5], [0.46, 0.5], [0.5, 0.05]], 0.07, K.skin); ellP(g, 0.54, 0.03, 0.07, 0.03); fil(g, K.skin, 0.015);
  eggP(g, -0.02, 0.78, 0.27, 0.32, 0.08); fil(g, K.skin, 0.024);
  polyP(g, [[-0.22, 0.58], [0.34, 0.58], [0.5, 0.5], [0.5, 0.42], [-0.2, 0.42]]); fil(g, K.linen, 0.02); for (let i = 0; i < 6; i++) line(g, [[-0.15 + i * 0.09, 0.56], [-0.14 + i * 0.1, 0.44]], 0.007, K.linenS);
  for (const [r, c, w] of [[0.22, K.lapis, 0.05], [0.17, K.turq, 0.03], [0.13, K.gold, 0.02]]) { g.beginPath(); g.ellipse(0, 0.98, r, r * 0.6, 0, 1.1 * Math.PI, 1.9 * Math.PI); g.strokeStyle = LN; g.lineWidth = w + 0.03; g.stroke(); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
  limb(g, [[0.08, 0.92], [0.36, 0.84], [0.44, 0.98]], 0.05, K.skin); ellP(g, 0.44, 1.0, 0.04, 0.04); fil(g, K.skin, 0.014);
  ostrichFeather(g, 0.44, 1.02, 0.52 + 0.04 * hh(sd), -0.08 + 0.06 * hh(sd + 1));
  g.translate(0.0, 1.02); g.scale(1.0, 1.0); HEADS[head % 14](g, 1);
  g.restore();
}

// ---- bands
function blockBorder(g, u0, u1, y0, y1, sd) {
  const h = y1 - y0, cols = [K.lapis, K.plaster, K.turq, K.plaster, K.ochre, K.plaster], bh = Math.min(0.09, h - 0.06);
  g.fillStyle = K.plaster; g.fillRect(u0, y0, u1 - u0, h);
  const i0 = Math.floor(u0 / 0.12);
  for (let i = i0; i * 0.12 < u1; i++) { g.fillStyle = cols[((i % 6) + 6) % 6]; g.fillRect(i * 0.12 + 0.004, y0 + (h - bh) / 2, 0.112, bh); }
  for (const yy of [y0 + 0.012, y1 - 0.012]) line(g, [[u0, yy], [u1, yy]], 0.022, LN);
  g.strokeStyle = LN; g.lineWidth = 0.008; for (let i = i0; i * 0.12 < u1; i++) g.strokeRect(i * 0.12 + 0.004, y0 + (h - bh) / 2, 0.112, bh);
}
function dadoBand(g, u0, u1) {
  g.fillStyle = K.dado; g.fillRect(u0, 0, u1 - u0, 1.1);
  const i0 = Math.max(0, Math.floor(u0 + 9 - 0.6)), i1 = Math.min(54, Math.ceil(u1 + 9 + 0.6));
  for (let i = i0; i <= i1; i++) { const u = -9 + 0.5 + i; lotusLine(g, u - 0.2, 0.3, 0.6, "open", 0.014, K.gold); lotusLine(g, u + 0.22, 0.3, 0.5, "bud", 0.014, K.gold); line(g, [[u - 0.2, 0.3], [u - 0.2, 0.1]], 0.012, K.gold); line(g, [[u + 0.22, 0.3], [u + 0.22, 0.1]], 0.012, K.gold); }
  line(g, [[u0, 1.1], [u1, 1.1]], 0.025, K.gold); line(g, [[u0, 0.04], [u1, 0.04]], 0.012, K.goldS);
}
function friezeBand(g, u0, u1, sd) {
  g.fillStyle = K.plasterL; g.fillRect(u0, 7.2, u1 - u0, 1.0); g.fillStyle = rgba(K.ochre, 0.18); g.fillRect(u0, 7.2, u1 - u0, 1.0);
  line(g, [[u0, 7.32], [u1, 7.32]], 0.025, LN);
  const i0 = Math.max(0, Math.floor((u0 + 9) / 0.35) - 1), i1 = Math.min(156, Math.ceil((u1 + 9) / 0.35) + 1);
  for (let i = i0; i <= i1; i++) {
    const u = -9 + 0.175 + 0.35 * i, lean = (hh(sd + i * 2.3) - 0.5) * 8, n = 5 + Math.floor(hh(sd + i * 4.1) * 3), hgt = 0.5 + 0.1 * hh(sd + i * 6.7);
    line(g, [[u, 7.32], [u + Math.tan(lean * DEG) * 0.4, 7.32 + 0.3]], 0.02, LN); line(g, [[u, 7.32], [u + Math.tan(lean * DEG) * 0.4, 7.32 + 0.3]], 0.01, K.green);
    if (i % 2 === 0) lotusFlower(g, u + Math.tan(lean * DEG) * 0.4, 7.62, hgt * 0.7, { petals: n, lean, cols: i % 4 ? [K.lapis, K.turq] : [K.turq, K.lapis, K.plaster], lw: 0.012 }); else lotusBud(g, u + Math.tan(lean * DEG) * 0.4, 7.62, hgt * 0.65, { lean, lw: 0.012, col: i % 4 === 1 ? K.ochre : K.lapis, tip: i % 4 === 1 ? K.lapis : K.turq });
  }
  line(g, [[u0, 8.18], [u1, 8.18]], 0.025, LN);
}
function starPathG(g, x, y, R, rot) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + (i * Math.PI) / 5, r = i % 2 ? R * 0.42 : R; g[i ? "lineTo" : "moveTo"](x + r * Math.cos(a), y + r * Math.sin(a)); } g.closePath(); }
function nightBand(g, u0, u1, y0, y1, sd) {
  g.fillStyle = K.night; g.fillRect(u0, y0, u1 - u0, y1 - y0);
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba(K.nightS, 0)); gr.addColorStop(1, rgba(K.nightS, 0.7)); g.fillStyle = gr; g.fillRect(u0, y0, u1 - u0, y1 - y0);
  const i0 = Math.floor((u0 + 9) / 0.6) - 1, i1 = Math.ceil((u1 + 9) / 0.6) + 1, j1 = Math.ceil((y1 - y0) / 0.6);
  for (let i = i0; i <= i1; i++) for (let j = 0; j <= j1; j++) { const x = -9 + 0.3 + i * 0.6 + (hh(sd + i * 3.7 + j * 11.3) - 0.5) * 0.12, y = y0 + 0.3 + j * 0.6 + (hh(sd + i * 5.9 + j * 2.9) - 0.5) * 0.12; if (y > y1 || y < y0) continue; starPathG(g, x, y, 0.09, hh(sd + i * 1.9 + j * 7.7) * TAU); g.fillStyle = K.star; g.fill(); }
}
// the picture band of the far end of the judges: stars and lotus
function starLotusBand(g, u0, u1, sd) {
  nightBand(g, u0, u1, 5.2, 7.0, sd + 5); const i0 = Math.max(0, Math.floor((u0 - 18.3) / 0.7)), i1 = Math.ceil((u1 - 18.3) / 0.7);
  for (let i = i0; i <= i1; i++) { const u = 18.3 + 0.35 + i * 0.7; if (u < u0 - 0.5 || u > u1 + 0.5) continue; if (i % 2) lotusLine(g, u, 5.35, 0.45, "bud", 0.016, K.gold); else lotusLine(g, u, 5.35, 0.5, "open", 0.016, K.gold); }
  line(g, [[u0, 5.3], [u1, 5.3]], 0.02, K.goldS);
}
// ground lines, soot, flakes and cracks over a painted wall
function flake(g, x, y, r, sd, col = K.plaster) {
  g.beginPath(); const n = 9 + Math.floor(hh(sd) * 4);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (0.55 + 0.7 * hh(sd + i * 3.1)) * (i % 2 ? 0.8 : 1.1); const px = x + Math.cos(a) * rr * (1 + 0.5 * hh(sd + 77)), py = y + Math.sin(a) * rr * (0.7 + 0.4 * hh(sd + 5)); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = rgba(K.plasterS, 0.55); g.lineWidth = 0.008; g.stroke();
}
function crack(g, x, y, len, sd) {
  let px = x, py = y; const ang = (hh(sd) - 0.5) * 1.6 - Math.PI / 2 * (hh(sd + 1) > 0.5 ? 1 : 0), pts = [[px, py]], n = 8;
  for (let i = 1; i <= n; i++) { const a = ang + (hh(sd + i * 2.7) - 0.5) * 1.2; px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py]); }
  line(g, pts, 0.007, rgba("#2a1a0c", 0.75));
  if (hh(sd + 9) > 0.5) { const b = pts[3 + Math.floor(hh(sd + 4) * 3)]; line(g, [b, [b[0] + (hh(sd + 12) - 0.5) * 0.3, b[1] + (hh(sd + 13) - 0.5) * 0.3]], 0.005, rgba("#2a1a0c", 0.6)); }
}

// ---------------------------------------------------------------------------------------------------------------------
// the walls: painted canvases, drawn once. Side wall: 13 segments of 4.2 m (z -9 + 4.2 k); u = z in metres, y up.
// ---------------------------------------------------------------------------------------------------------------------
const WALL_H = 10.6, TORCH_Z = Array.from({ length: 11 }, (_, k) => -4.5 + 4.5 * k);
const segZ = (k) => [-9 + 4.2 * k, k === 12 ? 46 : -9 + 4.2 * (k + 1)];
const wallPpm = (k) => (k <= 6 ? 150 : 90);

function paleLapis(g, w, h, uOf, torchU) {   // LAPIS 15 % paler on faces turned to a torch
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let x = 0; x < w; x++) {
    const u = uOf(x); let f = 0; for (const t of torchU) f = Math.max(f, 1 - Math.min(1, Math.abs(u - t) / 2.2)); if (f <= 0.02) continue;
    const k = 0.15 * sm(f * 1.6);
    for (let y = 0; y < h; y++) { const i = (y * w + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2]; if (b > 130 && r < 110 && gg > 55 && gg < 130 && b > r + 60) { d[i] = r + (255 - r) * k; d[i + 1] = gg + (255 - gg) * k; d[i + 2] = b + (255 - b) * k; } }
  }
  g.putImageData(im, 0, 0);
}
function bakeDark(g, w, h, zOf, floorV = 0.05) {
  for (let x = 0; x < w; x++) { const a = 1 - Math.max(dk(zOf(x)), floorV); if (a < 0.01) continue; g.fillStyle = `rgba(8,6,12,${a.toFixed(3)})`; g.fillRect(x, 0, 1, h); }
}
function mottle(g, u0, u1, y0, y1, sd) {
  g.fillStyle = K.plaster; g.fillRect(u0, y0, u1 - u0, y1 - y0);
  for (let i = 0; i < Math.ceil((u1 - u0) * 5); i++) {
    const x = u0 + hh(sd + i * 1.7) * (u1 - u0), y = y0 + hh(sd + i * 3.3) * (y1 - y0), r = 0.3 + 0.7 * hh(sd + i * 5.1), q = g.createRadialGradient(x, y, 0, x, y, r);
    const c = hh(sd + i * 7.9) > 0.5 ? K.plasterL : K.plasterS; q.addColorStop(0, rgba(c, 0.13)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
}
const mkProcFig = (g, i, u, sd, dir) => {   // one of the 8 types of the procession, its kilt, collar and arm hashed
  const type = i % 8, a = (hh(sd + i * 3.7) - 0.5) * 20 * DEG, H = 1.5, arms = PROC_ARMS[type].map((q) => { const sx = 0.02 * H, sy = 0.6 * H, dx = q.to[0] * H - sx, dy = q.to[1] * H - sy, c = Math.cos(a), s = Math.sin(a); return { ...q, to: [(sx + dx * c - dy * s) / H, (sy + dx * s + dy * c) / H] }; });
  const it = (gg, HH) => procItem(type, gg, HH, sd + i);
  person(g, { x: u, y: 1.3, H, dir, seed: sd + i, skin: pick([K.skin, "#d19a52", "#c98a46"], hh(sd + i * 2.1) * 3), collar: pick([K.lapis, K.turq, K.ochre, K.gold], hh(sd + i * 4.3) * 4), kiltLen: 0.2 + 0.1 * hh(sd + i * 6.1), arms, item: it, stride: 0.09 + 0.05 * hh(sd + i) });
  if (i % 2 === 0) { const pu = u + dir * 0.7; if (hh(sd + i * 9.1) > 0.5) jar(g, pu, 1.3, 0.42, [K.turq, K.ochre]); else papyrus(g, pu, 1.3, 0.55, sd + i); }
};
function paintSideWallInto(g, w, h, ppm, side, k) {
  const [z0, z1] = segZ(k), sd = side * 1000 + k * 7.31;
  g.save();
  if (side === 0) g.setTransform(-ppm, 0, 0, -ppm, z1 * ppm, h); else g.setTransform(ppm, 0, 0, -ppm, -z0 * ppm, h);
  const lo = z0 - 1.6, hi = z1 + 1.6;
  mottle(g, z0 - 0.5, z1 + 0.5, 1.1, 8.2, sd);
  dadoBand(g, z0 - 0.5, z1 + 0.5);
  blockBorder(g, z0 - 0.5, z1 + 0.5, 1.1, 1.2, sd); for (const y of [3.0, 5.0, 7.0]) blockBorder(g, z0 - 0.5, z1 + 0.5, y, y + 0.2, sd);
  // register 1: the procession toward the doors (-z)
  line(g, [[z0 - 0.5, 1.3], [z1 + 0.5, 1.3]], 0.03, LN);
  for (let i = 0; i < 39; i++) { const u = -9 + 0.7 + 1.4 * i; if (u < lo - 0.6 || u > hi + 0.6) continue; mkProcFig(g, i + side * 3, u, sd * 0 + side * 500 + i * 3.1, -1); }
  // register 2: the scene of this segment (harvest, boat, cattle, marsh, feast, music, weighing; again with the second detail set)
  if (k <= 12) SCENES[k % 7](g, z0, k >= 7 ? 1 : 0, side * 777 + k * 13.7);
  // register 3: the judges as pictures, then stars and lotus
  for (let j = 0; j < 21; j++) { const u = -9 + 0.65 + 1.3 * j; if (u < lo - 0.7 || u > hi + 0.7) continue; paintJudge(g, u, 5.3, (j + side * 7) % 14, (j + side) % 3, -1, side * 300 + j); }
  if (z1 > 18.3) starLotusBand(g, Math.max(z0 - 0.5, 18.3), z1 + 0.5, sd);
  friezeBand(g, z0 - 0.5, z1 + 0.5, sd);
  nightBand(g, z0 - 0.5, z1 + 0.5, 8.2, 10.6, sd);
  line(g, [[z0 - 0.5, 8.2], [z1 + 0.5, 8.2]], 0.03, K.gold);
  // soot 1.5 m above each flame (the flame rim is 1.75), a faint smudge up the plaster
  for (const tz of TORCH_Z) { if (tz < lo - 1 || tz > hi + 1) continue; const q = g.createRadialGradient(tz, 3.6, 0, tz, 3.6, 1.3); q.addColorStop(0, "rgba(30,20,14,0.26)"); q.addColorStop(1, "rgba(30,20,14,0)"); g.save(); g.translate(tz, 3.6); g.scale(0.7, 1.5); g.translate(-tz, -3.6); g.fillStyle = q; g.fillRect(tz - 1.4, 3.6 - 1.3, 2.8, 2.6); g.restore(); }
  // 12 % flaked to plaster: about 1 per m2 in patches of 0.05-0.4 m, more in the lowest 0.4 m of a register
  const nF = Math.round((z1 - z0) * 7.1 * 1.0), nBase = Math.round((z1 - z0) * 1.2);
  for (let i = 0; i < nF; i++) { const x = z0 + hh(sd + i * 12.9) * (z1 - z0), y = 1.25 + hh(sd + i * 7.7) * 6.9; if (y > 8.1) continue; flake(g, x, y, 0.025 + 0.175 * Math.pow(hh(sd + i * 3.9), 1.6), sd + i * 5.3); }
  for (const by of [1.2, 3.2, 5.2]) for (let i = 0; i < nBase; i++) { const x = z0 + hh(sd + by * 31 + i * 2.9) * (z1 - z0), y = by + 0.2 * hh(sd + by * 17 + i * 4.1); flake(g, x, y, 0.03 + 0.1 * hh(sd + by + i * 1.3), sd + by * 3 + i * 8.7); }
  // 9 hairline cracks per 10 m of wall
  const c0 = Math.floor((k * 4.2) * 0.9), c1 = Math.floor(((k + 1) * 4.2) * 0.9);
  for (let i = c0; i < c1 + (k === 12 ? 1 : 0); i++) crack(g, z0 + hh(sd + i * 3.3) * (z1 - z0), 1.4 + hh(sd + i * 8.1) * 6.5, 0.3 + 1.1 * hh(sd + i * 2.2), sd + i * 4.7);
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  const uOf = (x) => (side === 0 ? z1 - x / ppm : z0 + x / ppm);
  if (k <= 6) paleLapis(g, w, h, uOf, TORCH_Z);
  bakeDark(g, w, h, uOf);
}
function paintSideWall(side, k) {
  const [z0, z1] = segZ(k), ppm = wallPpm(k), w = (z1 - z0) * ppm, h = WALL_H * ppm;
  return canvasTex(w, h, (g, W, Hh) => paintSideWallInto(g, W, Hh, ppm, side, k), `wall${side}-${k}`);
}

// ---- the door wall: left panel x -8..-2.2, right panel 2.2..8, and the part over the opening (x -2.2..2.2, y 6.4..10.6); u = x
function sceneThrone(g, u0, sd) {   // register 2, left: a seated figure on a throne, a table, 2 bearers with trays, 1 fan bearer
  const gy = 1.3 + 1.9; line(g, [[u0, gy], [u0 + 5, gy]], 0.03, LN);
  seatedP(g, { x: u0 + 3.9, y: gy, H: 1.35, dir: -1, seed: sd, collar: K.gold, arms: [{ to: [0.42, 0.58] }] });
  polyP(g, [[u0 + 4.3, gy], [u0 + 4.55, gy], [u0 + 4.55, gy + 1.0], [u0 + 4.42, gy + 1.0]]); fil(g, K.lapis, 0.022);
  tableP(g, u0 + 2.35, gy, 1.4, 0.7, 7, 3, sd + 3);
  for (let i = 0; i < 2; i++) person(g, { x: u0 + 0.55 + i * 0.75, y: gy + 0.02, H: 1.3, dir: 1, seed: sd + 20 + i, collar: pick([K.turq, K.lapis], i), arms: PROC_ARMS[2], item: (gg, H) => procItem(2, gg, H, sd + i), stride: 0.1 });
  person(g, { x: u0 + 4.7, y: gy + 0.02, H: 1.3, dir: -1, seed: sd + 31, collar: K.ochre, arms: PROC_ARMS[4], item: (gg, H) => procItem(4, gg, H, sd + 9), stride: 0.08 });
}
function sceneThicket(g, u0, sd) {   // register 1, right: 14 papyrus, 3 ducks rising, 1 cat, 2 fish
  const gy = 1.3; waves(g, u0 + 0.05, u0 + 4.95, gy + 0.02, 2, 0.07, K.turqS, sd);
  for (let i = 0; i < 14; i++) papyrus(g, u0 + 0.25 + (i / 13) * 4.5 + 0.1 * (hh(sd + i) - 0.5), gy + 0.05, 0.9 + 0.5 * hh(sd + i * 3.3), sd + i, pick([K.green, "#6a9a4a", "#4f8a4a"], i));
  for (let i = 0; i < 3; i++) duckP(g, u0 + 1.0 + i * 1.5, 2.45 + 0.2 * hh(sd + i * 3), 0.9, false, pick(["#8a6a4a", "#6a5a4a", "#a07a5a"], i));
  catP(g, u0 + 4.3, gy + 0.04, 1.0, "#c98a4a");
  for (let i = 0; i < 2; i++) fishP(g, u0 + 1.2 + i * 2.2, gy - 0.05, 0.26, pick([K.ochre, K.lapis], i), sd + i);
}
function sceneBird(g, cx, y, w) {   // register 3, left: a bird with spread wings 4.0 m, 3 rows of feathers (LAPIS, TURQUOISE, GOLD), a ring in each claw
  wingsSpread(g, cx, y + 0.28, w, 1.55, [K.lapis, K.turq, K.gold], 12);
  ellP(g, cx, y + 0.1, 0.22, 0.36); fil(g, K.ochre, 0.022); ellP(g, cx, y + 0.5, 0.15, 0.15); fil(g, K.plasterL, 0.02);
  polyP(g, [[cx - 0.04, y + 0.55], [cx + 0.1, y + 0.5], [cx + 0.0, y + 0.45]]); fil(g, K.gold, 0.012); ellP(g, cx - 0.04, y + 0.56, 0.015, 0.015); g.fillStyle = LN; g.fill();
  for (const s of [-1, 1]) { line(g, [[cx + s * 0.1, y - 0.2], [cx + s * 0.2, y - 0.3]], 0.03, LN); line(g, [[cx + s * 0.1, y - 0.2], [cx + s * 0.2, y - 0.3]], 0.016, K.gold); ellP(g, cx + s * 0.32, y - 0.32, 0.1, 0.1); g.strokeStyle = LN; g.lineWidth = 0.06; g.stroke(); g.strokeStyle = K.gold; g.lineWidth = 0.035; g.stroke(); }
}
function sceneSunDisc(g, cx, y, w) {   // register 3, right: a winged sun disc 4.4 m with 2 cobras
  wingsSpread(g, cx, y + 0.55, w, 1.55, [K.turq, K.lapis, K.gold], 13);
  sunDisc(g, cx, y + 0.45, 0.42);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.5, y + 0.12); g.quadraticCurveTo(cx + s * 0.56, y + 0.5, cx + s * 0.44, y + 0.62); g.quadraticCurveTo(cx + s * 0.34, y + 0.66, cx + s * 0.36, y + 0.55); g.quadraticCurveTo(cx + s * 0.42, y + 0.4, cx + s * 0.4, y + 0.12); g.closePath(); fil(g, K.green, 0.02); ellP(g, cx + s * 0.42, y + 0.64, 0.06, 0.06); fil(g, K.green, 0.015); ellP(g, cx + s * 0.42, y + 0.55, 0.035, 0.1); g.fillStyle = "#d8c890"; g.fill(); }
}
function paintDoorWallInto(g, w, h, ppm, which) {
  const x0 = which === 0 ? -8 : which === 1 ? 2.2 : -2.2, x1 = which === 0 ? -2.2 : which === 1 ? 8 : 2.2, sd = 4000 + which * 31;
  g.save(); g.setTransform(ppm, 0, 0, -ppm, -x0 * ppm, h);
  if (which === 2) {
    // over the opening: from the lintel (y 6.4) up
    mottle(g, x0 - 0.3, x1 + 0.3, 6.4, 8.2, sd); blockBorder(g, x0 - 0.3, x1 + 0.3, 7.0, 7.2, sd);
    wingsSpread(g, 0, 6.95, 3.9, 0.95, [K.lapis, K.turq, K.gold], 10); sunDisc(g, 0, 6.72, 0.24);
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.3, 6.5); g.quadraticCurveTo(s * 0.34, 6.78, s * 0.27, 6.86); g.quadraticCurveTo(s * 0.2, 6.9, s * 0.2, 6.82); g.quadraticCurveTo(s * 0.24, 6.7, s * 0.22, 6.5); g.closePath(); fil(g, K.green, 0.015); }
    line(g, [[x0, 6.42], [x1, 6.42]], 0.03, LN);
    friezeBand(g, x0 - 0.3, x1 + 0.3, sd); nightBand(g, x0 - 0.3, x1 + 0.3, 8.2, 10.6, sd); line(g, [[x0 - 0.3, 8.2], [x1 + 0.3, 8.2]], 0.03, K.gold);
  } else {
    mottle(g, x0 - 0.3, x1 + 0.3, 1.1, 8.2, sd); dadoBand(g, x0 - 0.3, x1 + 0.3);
    blockBorder(g, x0 - 0.3, x1 + 0.3, 1.1, 1.2, sd); for (const y of [3.0, 5.0, 7.0]) blockBorder(g, x0 - 0.3, x1 + 0.3, y, y + 0.2, sd);
    const cx = (which === 0 ? -5.3 : 5.3), u0 = cx - 2.5;
    if (which === 0) { sceneBoat(g, u0, 0, sd, { len: 3.6, rowers: 3, w: 5, y0: 1.95 }); sceneThrone(g, u0, sd + 1); sceneBird(g, cx, 5.35, 4.0); }
    else { sceneThicket(g, u0, sd); sceneWeighing(g, u0, 0, sd + 2, { w: 5, cx, gy: 3.3 }); sceneSunDisc(g, cx, 5.25, 4.4); }
    friezeBand(g, x0 - 0.3, x1 + 0.3, sd); nightBand(g, x0 - 0.3, x1 + 0.3, 8.2, 10.6, sd); line(g, [[x0 - 0.3, 8.2], [x1 + 0.3, 8.2]], 0.03, K.gold);
    const nF = Math.round((x1 - x0) * 7.1);
    for (let i = 0; i < nF; i++) { const x = x0 + hh(sd + i * 12.9) * (x1 - x0), y = 1.25 + hh(sd + i * 7.7) * 6.9; if (y > 8.1) continue; flake(g, x, y, 0.025 + 0.175 * Math.pow(hh(sd + i * 3.9), 1.6), sd + i * 5.3); }
    for (let i = 0; i < 5; i++) crack(g, x0 + hh(sd + i * 3.3) * (x1 - x0), 1.4 + hh(sd + i * 8.1) * 6.5, 0.3 + 1.1 * hh(sd + i * 2.2), sd + i * 4.7);
    for (const bx of which === 0 ? [-3.2] : [3.2]) { const q = g.createRadialGradient(bx, 3.9, 0, bx, 3.9, 1.3); q.addColorStop(0, "rgba(30,20,14,0.28)"); q.addColorStop(1, "rgba(30,20,14,0)"); g.save(); g.translate(bx, 3.9); g.scale(0.7, 1.5); g.translate(-bx, -3.9); g.fillStyle = q; g.fillRect(bx - 1.4, 3.9 - 1.3, 2.8, 2.6); g.restore(); }
  }
  g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
}
function paintDoorWall(which) {
  const ppm = 150, w = (which === 2 ? 4.4 : 5.8) * ppm, h = (which === 2 ? 4.2 : WALL_H) * ppm;
  // the centre piece is the top 4.2 m of the wall: shift its canvas to y 6.4..10.6
  return canvasTex(w, h, (g, W, Hh) => { if (which === 2) { g.save(); g.translate(0, 0); paintDoorWallInto(g, W, Hh + 6.4 * ppm, ppm, 2); g.restore(); } else paintDoorWallInto(g, W, Hh, ppm, which); }, `doorwall${which}`);
}
// ---- the architraves (1.0 wide, y 9.8..10.6): the plaster face with a block border above and below and a row of spread-wing birds
function paintArchitrave(k) {
  const [z0, z1] = segZ(k), ppm = wallPpm(k), w = (z1 - z0) * ppm, h = 0.8 * ppm;
  return canvasTex(w, h, (g, W, Hh) => {
    g.save(); g.setTransform(ppm, 0, 0, -ppm, -z0 * ppm, 10.6 * ppm);
    g.fillStyle = K.plaster; g.fillRect(z0 - 0.2, 9.8, z1 - z0 + 0.4, 0.8);
    blockBorder(g, z0 - 0.2, z1 + 0.2, 9.8, 9.94, k); blockBorder(g, z0 - 0.2, z1 + 0.2, 10.46, 10.6, k);
    for (let i = 0; i < 37; i++) { const u = -9 + 0.75 + 1.5 * i; if (u < z0 - 0.6 || u > z1 + 0.6) continue; wingsSpread(g, u, 10.1, 0.9, 0.42, [K.lapis, K.turq, K.gold], 6); ellP(g, u, 10.2, 0.05, 0.07); fil(g, K.ochre, 0.012); }
    g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
    bakeDark(g, W, Hh, (x) => z0 + x / ppm, 0.08);
  }, `arch${k}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// the floor: polished FLOOR STONE in 2.0 m slabs (joints 1 cm, 3-7 faint veins), GOLD inlay drawn over it. Tiles are
// painted once in world metres (x right, canvas y = z).
// ---------------------------------------------------------------------------------------------------------------------
const inlayCol = (z) => cmix(K.goldD, K.gold, sm((dk(z) - 0.05) / 0.5));
function rosette(g, x, y, r, col, lw = 0.012, petals = 8) {
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round";
  for (let i = 0; i < petals; i++) { const a = (i / petals) * TAU; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(r * 0.18, 0); g.bezierCurveTo(r * 0.5, -r * 0.3, r * 0.85, -r * 0.2, r, 0); g.bezierCurveTo(r * 0.85, r * 0.2, r * 0.5, r * 0.3, r * 0.18, 0); g.stroke(); g.restore(); }
  g.beginPath(); g.arc(x, y, r * 0.16, 0, TAU); g.fillStyle = col; g.fill(); g.beginPath(); g.arc(x, y, r * 0.24, 0, TAU); g.stroke();
}
function spiralG(g, x, y, R, dir, col, lw) {   // an Archimedean coil of 2 turns, outer end pointing +x
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.beginPath();
  for (let i = 0; i <= 56; i++) { const th = (i / 56) * 4 * Math.PI, r = R * (0.1 + 0.9 * (th / (4 * Math.PI))), a = dir * (th - 4 * Math.PI); const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
}
function paintFloorInto(g, w, h, x0, z0, ppm) {
  const x1 = x0 + w / ppm, z1 = z0 + h / ppm;
  g.save(); g.setTransform(ppm, 0, 0, ppm, -x0 * ppm, -z0 * ppm);
  // slabs
  const sx0 = Math.floor((x0 + 8) / 2), sx1 = Math.ceil((x1 + 8) / 2), sz0 = Math.floor((z0 + 9) / 2), sz1 = Math.ceil((z1 + 9) / 2);
  for (let ix = sx0; ix < sx1; ix++) for (let iz = sz0; iz < sz1; iz++) {
    const X = -8 + ix * 2, Z = -9 + iz * 2, sd = ix * 31.7 + iz * 7.3;
    g.fillStyle = cmix(K.floor, K.floorL, 0.05 + 0.2 * hh(sd)); g.fillRect(X, Z, 2.0, 2.0);
    const q = g.createLinearGradient(X, Z, X + 2, Z + 2); q.addColorStop(0, rgba(K.floorL, 0.10)); q.addColorStop(0.5, rgba(K.floorL, 0)); q.addColorStop(1, rgba(K.floorS, 0.18)); g.fillStyle = q; g.fillRect(X, Z, 2.0, 2.0);
    const nv = 3 + Math.floor(hh(sd + 1.1) * 5);
    for (let v = 0; v < nv; v++) {
      const s2 = sd + v * 4.3, ax = X + 2 * hh(s2), az = Z + 2 * hh(s2 + 1), ang = hh(s2 + 2) * TAU, len = 0.7 + 1.4 * hh(s2 + 3); let px = ax, pz = az; g.beginPath(); g.moveTo(px, pz);
      for (let i = 1; i <= 7; i++) { const a = ang + (hh(s2 + i * 1.7) - 0.5) * 0.9; px += Math.cos(a) * len / 7; pz += Math.sin(a) * len / 7; g.lineTo(Math.min(X + 2, Math.max(X, px)), Math.min(Z + 2, Math.max(Z, pz))); }
      g.strokeStyle = rgba(K.vein, 0.9); g.lineWidth = 0.008 + 0.01 * hh(s2 + 6); g.stroke();
    }
  }
  g.strokeStyle = K.floorS; g.lineWidth = 0.01;
  for (let ix = sx0; ix <= sx1; ix++) { g.beginPath(); g.moveTo(-8 + ix * 2, z0); g.lineTo(-8 + ix * 2, z1); g.stroke(); }
  for (let iz = sz0; iz <= sz1; iz++) { g.beginPath(); g.moveTo(x0, -9 + iz * 2); g.lineTo(x1, -9 + iz * 2); g.stroke(); }
  // baked dark along z over the stone only (the inlay keeps its own dark tone)
  { const gr = g.createLinearGradient(0, z0, 0, z1); for (let i = 0; i <= 8; i++) { const z = z0 + (z1 - z0) * (i / 8); gr.addColorStop(i / 8, `rgba(6,5,9,${(1 - (0.32 + 0.68 * dk(z))).toFixed(3)})`); } g.fillStyle = gr; g.fillRect(x0, z0, x1 - x0, z1 - z0); }
  const G = (z) => inlayCol(z);
  // the aisle's scuffed middle 1.2 m: matte, 15 % paler (a million souls walked it)
  if (z1 > 4.6) {
    const zs = Math.max(z0, 4.6); g.fillStyle = "rgba(190,186,205,0.15)"; g.fillRect(-0.6, zs, 1.2, z1 - zs);
    for (let i = 0; i < 260; i++) { const zz = 4.6 + hh(i * 3.1) * 41.4; if (zz < z0 - 1 || zz > z1 + 1) continue; const xx = -0.6 + 1.2 * hh(i * 7.7), l = 0.1 + 0.5 * hh(i * 2.3), a = (hh(i * 9.1) - 0.5) * 0.7; g.beginPath(); g.moveTo(xx, zz); g.lineTo(xx + Math.sin(a) * l * 0.5, zz + Math.cos(a) * l); g.strokeStyle = "rgba(210,206,225,0.10)"; g.lineWidth = 0.004; g.stroke(); }
  }
  // scale rings, the chain of 36 lotus, the 16 rays
  const col0 = G(0);
  g.beginPath(); g.arc(0, 0, 2.5, 0, TAU); g.strokeStyle = col0; g.lineWidth = 0.03; g.stroke(); g.beginPath(); g.arc(0, 0, 2.9, 0, TAU); g.lineWidth = 0.06; g.stroke();
  for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; lotusLine(g, Math.cos(a) * 2.545, Math.sin(a) * 2.545, 0.30, i % 2 ? "bud" : "open", 0.012, col0, { rot: a - Math.PI / 2 }); }
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, long = k % 2 === 0, r1 = long ? 4.4 : 3.8; g.save(); g.rotate(a); g.beginPath(); g.moveTo(3.1, -0.05); g.lineTo(r1 - 0.05, -0.01); g.lineTo(r1 - 0.05, 0.01); g.lineTo(3.1, 0.05); g.closePath(); g.fillStyle = col0; g.fill(); g.beginPath(); g.arc(r1, 0, 0.05, 0, TAU); g.fill(); g.restore(); }
  // the square border: a running spiral band 0.30 wide, 88 spirals, a rosette r 0.25 at each corner
  for (const [a, b, c, d] of [[-4.4, -4.4, 4.4, -4.4], [4.4, -4.4, 4.4, 4.4], [4.4, 4.4, -4.4, 4.4], [-4.4, 4.4, -4.4, -4.4]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.strokeStyle = col0; g.lineWidth = 0.012; g.stroke(); }
  g.strokeStyle = col0; g.lineWidth = 0.012; g.strokeRect(-4.1, -4.1, 8.2, 8.2);
  { const sides = [[-4.25, -4.25, 1, 0], [4.25, -4.25, 0, 1], [4.25, 4.25, -1, 0], [-4.25, 4.25, 0, -1]], pitch = 34 / 88;
    for (let i = 0; i < 88; i++) { const s = (i + 0.5) * pitch, sd_ = Math.min(3, Math.floor(s / 8.5)), t = s - sd_ * 8.5, [px, pz, dx, dz] = sides[sd_], cx = px + dx * t, cz = pz + dz * t;
      g.save(); g.translate(cx, cz); g.rotate(Math.atan2(dz, dx)); spiralG(g, 0, 0, 0.115, i % 2 ? 1 : -1, col0, 0.012); const e = pitch / 2, sg = i % 2 ? -1 : 1; g.beginPath(); g.moveTo(sg * 0.115, 0); g.lineTo(sg * e, 0); g.strokeStyle = col0; g.lineWidth = 0.012; g.stroke(); g.restore(); }
  }
  for (const [cx, cz] of [[-4.4, -4.4], [4.4, -4.4], [4.4, 4.4], [-4.4, 4.4]]) { rosette(g, cx, cz, 0.25, col0, 0.014, 8); g.beginPath(); g.arc(cx, cz, 0.27, 0, TAU); g.strokeStyle = col0; g.lineWidth = 0.01; g.stroke(); }
  // the aisle: lines at x +-1.9 from z 4.6, an 8-petal rosette every 2.0 m on the centre line (21), inlay rubbed to 60 % in the middle
  if (z1 > 4.6) {
    const za = Math.max(z0, 4.6);
    for (const x of [-1.9, 1.9]) { const sg = g.createLinearGradient(0, za, 0, z1); for (let i = 0; i <= 8; i++) { const z = za + (z1 - za) * (i / 8); sg.addColorStop(i / 8, G(z)); } g.strokeStyle = sg; g.lineWidth = 0.05; g.beginPath(); g.moveTo(x, za); g.lineTo(x, z1); g.stroke(); }
    for (let k = 0; k < 21; k++) { const z = 5 + 2 * k; if (z < z0 - 0.4 || z > z1 + 0.4) continue; g.globalAlpha = 0.6; rosette(g, 0, z, 0.22, G(z), 0.012, 8); g.globalAlpha = 1; }
  }
  // door wings: spread wings 4.4 wide, 3 rows of 11 feathers a side, a sun disc r 0.35 between
  if (z0 < -6.4) {
    const cz = -7.5, cg = G(-7.5);
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 11; i++) { const bx = s * (0.4 + (i / 10) * 1.0 * (1 - 0.1 * r)), bz = cz - 0.62 + r * 0.62 + (i / 10) * 0.05, len = (0.5 + 0.5 * (1 - i / 10) + 0.08 * r) * 1.0; g.save(); g.translate(bx, bz); g.rotate(s > 0 ? 0 : Math.PI); g.rotate(s * 0.06 * i * 0.2 + (r - 1) * 0.04 * s); g.beginPath(); g.moveTo(0, -0.05); g.lineTo(len, -0.015); g.lineTo(len, 0.015); g.lineTo(0, 0.05); g.closePath(); g.fillStyle = rgba(cg, 0.9); g.fill(); g.restore(); }
    g.beginPath(); g.arc(0, cz, 0.35, 0, TAU); g.fillStyle = cg; g.fill(); g.beginPath(); g.arc(0, cz, 0.44, 0, TAU); g.strokeStyle = cg; g.lineWidth = 0.02; g.stroke();
  }
  // footplates under each stool (42): an outline 0.70 x 0.60, a lotus at the front edge
  for (let i = 0; i < 42; i++) {
    const z = 2.0 + 0.95 * i; if (z < z0 - 0.5 || z > z1 + 0.5) continue; const c = G(z);
    g.strokeStyle = c; g.lineWidth = 0.02; g.strokeRect(-5.4, z - 0.3, 0.70, 0.60); lotusLine(g, -4.7, z, 0.18, "open", 0.012, c, { rot: -Math.PI / 2 });
  }
  g.restore();
}
function paintFloorTile(x0, x1, z0, z1, ppm, name) {
  return canvasTex((x1 - x0) * ppm, (z1 - z0) * ppm, (g, W, Hh) => paintFloorInto(g, W, Hh, x0, z0, ppm), name);
}

// ---------------------------------------------------------------------------------------------------------------------
// COLUMNS: papyrus bundle, carved and painted. Local frame: the aisle side is +x (the right-hand row is turned 180 degrees).
// lower = base-of-sheath..y 4.4 with a painted canvas per column pair (rings, picture band); upper = vertex coloured.
// ---------------------------------------------------------------------------------------------------------------------
const colR = (y) => {
  if (y < 1.4) { const t = clamp((y - 0.25) / 1.15); return 0.47 + 0.055 * t + 0.074 * Math.sin(Math.PI * Math.pow(t, 1.217)); }
  return 0.525 - 0.05 * clamp((y - 1.4) / 6.3);
};
const lobeP = (u) => { const p = ((u - 0.5) * 8 + 0.5) % 1; return p < 0 ? p + 1 : p; };
const lobePeak = (u) => Math.pow(1 - Math.abs(2 * lobeP(u) - 1), 0.85);
const lobeAmp = (y) => 0.04 * sm((y - 1.25) / 0.3);
const leafHW = (t) => (t >= 1 ? 0 : 0.44 * Math.pow(1 - Math.pow(Math.max(0, t), 1.5), 0.8));   // half-width of a sheath leaf, in lobe units
const leafCarve = (u, y) => { if (y > 1.4 || y < 0.25) return 0; const s = lobeP(u) - 0.5, hw = leafHW((y - 0.25) / 1.15); return 0.02 * sm((hw - Math.abs(s)) / 0.05 + 0.5); };
function colSurfaceFn(ys, withCarve) {
  const nv = ys.length - 1;
  return (u, v) => {
    const y = ys[Math.round(v * nv)], r0 = colR(y) * (1 - lobeAmp(y) + lobeAmp(y) * lobePeak(u)) - (withCarve ? leafCarve(u, y) : 0), a = TAU * (u - 0.5);
    return [r0 * Math.cos(a), y, -r0 * Math.sin(a)];
  };
}
const SHEATH_YS = Array.from({ length: 57 }, (_, i) => 0.25 + (1.15 * i) / 56);
function buildColumnLower() {
  const ys = [...SHEATH_YS, ...[1.9, 2.4, 2.9, 3.4, 3.9, 4.4]], f = colSurfaceFn(ys, true);
  const g = surf(192, ys.length - 1, f, (u, v) => [u, (ys[Math.round(v * (ys.length - 1))] - 0.25) / 4.15]);
  return outward(g);
}
const BELL = (y) => 0.475 + 0.475 * Math.pow(clamp((y - 8.2) / 1.18), 1.6);
function buildColumnUpper() {
  const B = new Bake(), aisle = (nx, nz) => 0.65 + 0.35 * (nx * 0.95 + nz * 0.1);
  const lit = new THREE.Color(K.colLit), shade = new THREE.Color(K.colShade), tmp = new THREE.Color();
  const stone = (nx, nz, valley) => tmp.copy(shade).lerp(lit, clamp(aisle(nx, nz))).lerp(shade, valley * 0.55).clone();
  // base disc 0..0.25 with its rounded edge
  B.add(lathe([[0.001, 0], [0.7, 0], [0.745, 0.02], [0.752, 0.05], [0.75, 0.19], [0.72, 0.235], [0.66, 0.25], [0.5, 0.25]], 40), (x, y, z, nx, ny, nz) => stone(nx, nz, 0).lerp(new THREE.Color("#a98a55"), 0.35));
  // shaft 4.4..7.7: 8 lobed stems, one sharp arris each (u of a vertex from its position)
  const ys = [4.4, 5.5, 6.6, 7.7], sf = colSurfaceFn(ys, false), sg = surf(192, 3, sf); outward(sg);
  B.add(sg, (x, y, z, nx, ny, nz) => { const u = ((Math.atan2(-z, x) / TAU) + 0.5 + 1) % 1, p = lobeP(u); return stone(nx, nz, 1 - sm(Math.min(p, 1 - p) / 0.1)); });
  // neck 7.7..8.2: 5 GOLD bands 0.06 high, 0.05 apart, the shaft showing between; 8 small stem ends hang 0.25 under them
  B.add(lathe([[0.001, 7.7], [0.462, 7.7], [0.462, 8.2], [0.001, 8.2]], 40), K.colShade);
  for (let i = 0; i < 5; i++) { const y0 = 7.7 + i * 0.11; B.add(lathe([[0.455, y0], [0.478, y0 + 0.004], [0.492, y0 + 0.03], [0.478, y0 + 0.056], [0.455, y0 + 0.06]], 36), (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 11 + i, cav: Math.abs(y - (y0 + 0.03)) > 0.024 ? 0.7 : 0 })); }
  for (let i = 0; i < 8; i++) { const a = ((i + 0.5) / 8) * TAU; const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([0.46 * Math.cos(a) * 1.0, 7.7 - 0.25 * t, 0.46 * Math.sin(a)]); } B.add(tube(pts, (t) => 0.022 * (1 - 0.7 * t) + 0.004, 6), (x, y, z, nx, ny, nz) => new THREE.Color(K.green).lerp(new THREE.Color(K.plasterL), sm((7.7 - y) / 0.25) * 0.15)); }
  // capital 8.2..9.5: an open papyrus bell
  const bellProf = []; for (let i = 0; i <= 16; i++) { const y = 8.2 + (1.18 * i) / 16; bellProf.push([BELL(y), y]); } bellProf.unshift([0.001, 8.2]);
  B.add(lathe(bellProf, 48), (x, y, z, nx, ny, nz) => stone(nx, nz, 0).lerp(new THREE.Color(K.plasterL), 0.15));
  // 8 sepals 0.45 tall at the foot (green, GOLD edge)
  for (let j = 0; j < 8; j++) {
    const psi = (j / 8) * TAU, L = 0.45;
    const sg2 = surf(6, 9, (u, v) => { const y = 8.2 + L * v, hw = 0.17 * Math.pow(Math.max(0, 1 - Math.pow(v, 1.4)), 0.7), uu = u * 2 - 1, r = BELL(y) + 0.008 + 0.016 * (1 - uu * uu) * (1 - v * 0.5), ps = psi + (uu * hw) / BELL(y); return [r * Math.cos(ps), y, r * Math.sin(ps)]; });
    outward(sg2); B.add(sg2, (x, y, z, nx, ny, nz) => new THREE.Color(K.green).lerp(new THREE.Color(K.greenD), clamp((9 - y * 0 - 8.2 - y + 8.2) * 0 + (8.65 - y) * 0.4)));
    const edge = []; for (let k = 0; k <= 10; k++) { const v = k / 10, y = 8.2 + L * v, hw = 0.17 * Math.pow(Math.max(0, 1 - Math.pow(v, 1.4)), 0.7), r = BELL(y) + 0.02; edge.push([r * Math.cos(psi - hw / BELL(y)), y, r * Math.sin(psi - hw / BELL(y))]); }
    for (let k = 9; k >= 0; k--) { const v = k / 10, y = 8.2 + L * v, hw = 0.17 * Math.pow(Math.max(0, 1 - Math.pow(v, 1.4)), 0.7), r = BELL(y) + 0.02; edge.push([r * Math.cos(psi + hw / BELL(y)), y, r * Math.sin(psi + hw / BELL(y))]); }
    B.add(tube(edge, 0.0065, 5, false), (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 21 + j }));
  }
  // 24 thin umbel stems fanning up, a shade line under every stem
  for (let i = 0; i < 24; i++) {
    const psi = (i / 24) * TAU, pts = [], sh = [];
    for (let k = 0; k <= 13; k++) { const y = 8.62 + (9.38 - 8.62) * (k / 13), r = BELL(y) + 0.016, ps = psi + 0.04 * Math.sin(psi * 3 + 1) * (k / 13); pts.push([r * Math.cos(ps), y, r * Math.sin(ps)]); const ps2 = ps + 0.016 / r, r2 = BELL(y) + 0.008; sh.push([r2 * Math.cos(ps2), y - 0.004, r2 * Math.sin(ps2)]); }
    B.add(tube(pts, 0.0115, 5, true), (x, y, z, nx, ny, nz) => tmp.set(K.plasterL).lerp(lit, 0.2).clone()); B.add(tube(sh, 0.0055, 4, false), K.colShade);
  }
  // 8 lotus buds 0.30 tall (LAPIS tips) between the stems
  for (let b = 0; b < 8; b++) {
    const psi = (b / 8) * TAU + (7.5 * DEG), yc = 9.0, rb = BELL(yc) + 0.045, tilt = Math.atan2(BELL(9.15) - BELL(8.85), 0.3) * 0.9;
    const bg = lathe([[0.001, 0], [0.028, 0.03], [0.052, 0.1], [0.05, 0.19], [0.03, 0.26], [0.001, 0.30]], 12);
    place(bg, 0, -0.15, 0, 0, 0, 0); place(bg, 0, 0, 0, 0, 0, -tilt); place(bg, rb * Math.cos(psi), yc, rb * Math.sin(psi), 0, -psi, 0);
    B.add(bg, (x, y, z, nx, ny, nz) => { const k = clamp((y - (yc - 0.15)) / 0.30); return k > 0.62 ? new THREE.Color(K.lapis).lerp(new THREE.Color(K.lapisL), sm((nx * 0 + ny) * 0.4 + 0.1)) : new THREE.Color(K.green).lerp(new THREE.Color(K.plasterL), 0.0); });
    const cal = tube([[rb * Math.cos(psi), yc - 0.14, rb * Math.sin(psi)], [(rb - 0.02) * Math.cos(psi), yc - 0.2, (rb - 0.02) * Math.sin(psi)]], 0.012, 5); B.add(cal, K.greenD);
  }
  // lip band 0.12 with 32 petal tongues, LAPIS and TURQUOISE alternating; GOLD edge 0.03
  B.add(lathe([[0.93, 9.38], [0.95, 9.385], [0.968, 9.44], [0.972, 9.5], [0.93, 9.5]], 48), (x, y, z, nx, ny, nz) => stone(nx, nz, 0).lerp(shade, 0.45));
  for (let j = 0; j < 32; j++) {
    const psi = ((j + 0.5) / 32) * TAU, hw = 0.082, y0 = 9.4, y1 = 9.485, col = j % 2 ? K.turq : K.lapis, colL = j % 2 ? K.turqL : K.lapisL;
    const tg = surf(5, 6, (u, v) => { const uu = u * 2 - 1, wv = hw * Math.sqrt(Math.max(0, 1 - Math.pow(1 - v, 2.2) * 0.9)), y = y1 - (y1 - y0) * (1 - v) * 1.0, r = 0.968 + 0.0 + 0.012 * (1 - uu * uu) - 0.0 * v, ps = psi + (uu * wv) / r; return [r * Math.cos(ps), lerp(y1, y0, 1 - v), r * Math.sin(ps)]; });
    outward(tg); B.add(tg, (x, y, z, nx, ny, nz) => new THREE.Color(col).lerp(new THREE.Color(colL), sm(ny * 0.5 + 0.3) * 0.5));
  }
  B.add(lathe([[0.95, 9.47], [0.978, 9.472], [0.988, 9.485], [0.978, 9.498], [0.95, 9.5]], 48), (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 5 }));
  return B.geo();
}
function paintWingBand(g, w, h) {
  g.fillStyle = K.plaster; g.fillRect(0, 0, w, h); g.save(); g.setTransform(w, 0, 0, -w, 0, h);
  line(g, [[0, 0.04], [1, 0.04]], 0.012, LN); line(g, [[0, 0.265], [1, 0.265]], 0.012, LN); line(g, [[0, 0.05], [1, 0.05]], 0.01, K.gold); line(g, [[0, 0.255], [1, 0.255]], 0.01, K.gold);
  for (const x of [0.25, 0.75]) { wingsSpread(g, x, 0.18, 0.4, 0.2, [K.lapis, K.turq, K.gold], 7); ellP(g, x, 0.13, 0.014, 0.03); fil(g, K.ochre, 0.006); }
  g.restore();
}
function paintColumnLower(pair) {
  const W = 728, ppm = 220, H = Math.round(4.15 * ppm), circ = W / ppm;
  return canvasTex(W, H, (g, w, h) => {
    g.save(); g.setTransform(ppm, 0, 0, -ppm, 0, h + 0.25 * ppm);   // x metres round the shaft (3.3 m), y world
    const sd = pair * 13.1;
    g.fillStyle = K.colLit; g.fillRect(0, 0.25, circ, 4.15);
    for (let i = 0; i < 40; i++) { const x = hh(sd + i * 1.3) * circ, y = 0.3 + hh(sd + i * 2.9) * 4.1, r = 0.15 + 0.4 * hh(sd + i * 4.7), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba(i % 2 ? K.plasterL : K.colShade, 0.12)); q.addColorStop(1, rgba(K.colShade, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // the 8 lobes of the shaft: a valley line between each, a pale arris on each
    for (let i = 0; i < 8; i++) { const x = ((0.5 + (i + 0.5) / 8) % 1) * circ; line(g, [[x, 1.4], [x, 4.4]], 0.012, rgba(K.colShade, 0.7)); const xa = ((0.5 + i / 8) % 1) * circ; line(g, [[xa, 1.4], [xa, 4.4]], 0.006, rgba(K.plasterL, 0.6)); }
    // sheath leaves 1.15 tall: green edged GOLD on plaster
    for (let i = 0; i < 8; i++) {
      const uc = ((0.5 + i / 8) % 1), xc = uc * circ;
      for (const off of [0, circ, -circ]) {
        const L = [], R = []; for (let k = 0; k <= 24; k++) { const t = k / 24, y = 0.25 + 1.15 * t, hw = (leafHW(t) / 8) * circ * 0.98; L.push([xc + off - hw, y]); R.push([xc + off + hw, y]); }
        const pts = [...L, ...R.reverse()]; polyP(g, pts); g.fillStyle = K.green; g.fill();
        g.save(); polyP(g, pts); g.clip(); line(g, [[xc + off, 0.25], [xc + off, 1.4]], 0.014, K.greenD); for (let k = 1; k < 7; k++) { const y = 0.25 + 1.15 * (k / 8); line(g, [[xc + off, y], [xc + off - 0.1, y + 0.1]], 0.008, rgba(K.greenD, 0.7)); line(g, [[xc + off, y], [xc + off + 0.1, y + 0.1]], 0.008, rgba(K.greenD, 0.7)); } ellP(g, xc + off + 0.08, 0.7, 0.07, 0.4); g.fillStyle = rgba(K.greenD, 0.35); g.fill(); g.restore();
        polyP(g, pts); g.strokeStyle = K.gold; g.lineWidth = 0.022; g.lineJoin = "round"; g.stroke(); g.strokeStyle = LN; g.lineWidth = 0.006; g.stroke();
      }
    }
    // 3 painted rings 0.2 each: LAPIS, TURQUOISE, OCHRE RED, thin GOLD lines between
    [[1.5, K.lapis, K.lapisS], [1.7, K.turq, K.turqS], [1.9, K.ochre, K.ochreS]].forEach(([y, c, cs], i) => { g.fillStyle = c; g.fillRect(0, y, circ, 0.2); g.fillStyle = rgba(cs, 0.5); g.fillRect(0, y, circ, 0.04); for (let k = 0; k < 120; k++) { const x = (k / 120) * circ; line(g, [[x, y + 0.04], [x + 0.01, y + 0.16]], 0.004, rgba(cs, 0.4)); } });
    for (const y of [1.5, 1.7, 1.9, 2.1]) { line(g, [[0, y], [circ, y]], 0.016, K.gold); line(g, [[0, y - 0.013], [circ, y - 0.013]], 0.004, K.goldS); }
    // picture band 2.2..4.2: two potato figures facing each other over a lotus stand (12 different pairs, one per column pair); the back carries another pair
    g.fillStyle = rgba(K.plasterL, 0.55); g.fillRect(0, 2.2, circ, 2.0); line(g, [[0, 2.2], [circ, 2.2]], 0.02, LN); line(g, [[0, 4.2], [circ, 4.2]], 0.02, LN); line(g, [[0, 2.23], [circ, 2.23]], 0.008, K.gold); line(g, [[0, 4.17], [circ, 4.17]], 0.008, K.gold);
    const pairPic = (cx, idx) => {
      const a = idx % 8, b = (idx * 3 + 2) % 8, st = idx % 3;
      person(g, { x: cx - 0.42, y: 2.3, H: 1.55, dir: 1, seed: idx * 5, collar: pick([K.lapis, K.turq, K.ochre], idx), skin: pick([K.skin, "#d19a52"], idx), arms: PROC_ARMS[a], item: (gg, HH) => procItem(a, gg, HH, idx), stride: 0.1 });
      person(g, { x: cx + 0.42, y: 2.3, H: 1.55, dir: -1, seed: idx * 5 + 2, collar: pick([K.turq, K.ochre, K.lapis], idx), skin: pick([K.skin, "#c98a46"], idx + 1), arms: PROC_ARMS[b], item: (gg, HH) => procItem(b, gg, HH, idx + 3), stride: 0.1 });
      polyP(g, [[cx - 0.1, 2.3], [cx + 0.1, 2.3], [cx + 0.06, 2.45], [cx + 0.04, 3.0], [cx + 0.1, 3.12], [cx - 0.1, 3.12], [cx - 0.04, 3.0], [cx - 0.06, 2.45]]); fil(g, K.gold, 0.02);
      if (st === 0) { lotusFlower(g, cx, 3.14, 0.34, { petals: 5 + (idx % 3), lean: 0 }); lotusBud(g, cx - 0.2, 3.1, 0.28, { lean: -22 }); lotusBud(g, cx + 0.2, 3.1, 0.28, { lean: 22 }); }
      else if (st === 1) { jar(g, cx, 3.12, 0.38, [K.lapis, K.turq], 0, K.plasterL); lotusFlower(g, cx, 3.46, 0.18, { petals: 5, lean: 0 }); }
      else { for (let i = 0; i < 3; i++) loaf(g, cx - 0.1 + i * 0.1, 3.12, 0.045, K.ochre); for (let i = 0; i < 2; i++) loaf(g, cx - 0.05 + i * 0.1, 3.2, 0.045, "#c98a46"); lotusBud(g, cx, 3.28, 0.24, {}); }
    };
    pairPic(0.5 * circ, pair); pairPic(0, (pair + 6) % 12); pairPic(circ, (pair + 6) % 12);
    for (const xs of [0.25 * circ, 0.75 * circ]) for (let i = 0; i < 6; i++) { const y = 2.45 + i * 0.3; if (i % 2) lotusBud(g, xs, y, 0.22, {}); else lotusFlower(g, xs, y, 0.22, { petals: 5, cols: i % 4 ? [K.lapis, K.turq] : [K.turq, K.lapis, K.plaster] }); line(g, [[xs, y - 0.06], [xs, y]], 0.012, K.greenD); }
    // paint rubbed pale at y 0.8-1.2 on the nave side
    for (let i = 0; i < 7; i++) { const x = 0.5 * circ + (hh(sd + i * 3.7) - 0.5) * 0.9, y = 0.8 + 0.4 * hh(sd + i * 5.1); flake(g, x, y, 0.07 + 0.1 * hh(sd + i * 1.9), sd + i * 9.3, rgba(K.stone, 0.55)); }
    g.restore();
  }, `col${pair}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// STOOLS (42): GOLD, seat 0.56 (z) x 0.46 (x), top y 0.42, 2 cm dished, woven reed top, 4 lion-paw legs with 4 toes,
// a 3 x 3 lattice brace on each side, worn to bronze on the seat's front edge and the paw tips. Origin: the floor under the seat.
// ---------------------------------------------------------------------------------------------------------------------
function paintReed(g, w, h) {
  g.fillStyle = "#b08a42"; g.fillRect(0, 0, w, h);
  const nx = 12, nz = 9, cw = w / nx, ch = h / nz;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const over = (i + j) % 2 === 0, x = i * cw, y = j * ch, c = cmix(K.gold, K.goldS, 0.2 + 0.25 * hh(i * 7.1 + j * 3.3));
    g.fillStyle = over ? c : cmix(c, K.goldS, 0.4); g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    g.fillStyle = rgba(K.goldL, over ? 0.55 : 0.15); if (over) g.fillRect(x + 1, y + 1, cw - 2, (ch - 2) * 0.3); else g.fillRect(x + 1, y + 1, (cw - 2) * 0.3, ch - 2);
    g.strokeStyle = rgba(K.goldD, 0.7); g.lineWidth = 1; g.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
  }
  g.strokeStyle = K.goldD; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
}
function buildStool() {
  const B = new Bake(), cg = (seed, edgeFn, cavFn) => (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed, edge: edgeFn ? edgeFn(x, y, z) : 0, cav: cavFn ? cavFn(x, y, z) : 0 });
  // seat slab and rim
  B.add(place(new THREE.BoxGeometry(0.46, 0.06, 0.56), 0, 0.37, 0), cg(2, (x, y, z) => (x > 0.2 ? 1 : 0), (x, y, z) => (y < 0.35 ? 0.4 : 0)));
  for (const [x, z, sx, sz] of [[0, 0.265, 0.46, 0.03], [0, -0.265, 0.46, 0.03], [0.22, 0, 0.03, 0.56], [-0.22, 0, 0.03, 0.56]]) B.add(place(new THREE.BoxGeometry(sx, 0.025, sz), x, 0.41, z), cg(3, (xx, yy, zz) => (xx > 0.2 ? 1 : 0)));
  for (const [x, z] of [[-0.185, -0.235], [0.185, -0.235], [-0.185, 0.235], [0.185, 0.235]]) {
    const lg = lathe([[0.001, 0], [0.05, 0.0], [0.052, 0.015], [0.036, 0.05], [0.027, 0.1], [0.03, 0.17], [0.048, 0.24], [0.044, 0.3], [0.04, 0.34]], 14);
    B.add(place(lg, x, 0, z), cg(4, (xx, yy) => (yy < 0.04 ? 1 : 0), (xx, yy) => (yy > 0.3 ? 0.5 : 0)));
    const paw = new THREE.SphereGeometry(0.04, 10, 6); place(paw, x + 0.03, 0.022, z, 0, 0, 0, 1.3, 0.55, 1.0); B.add(paw, cg(5, (xx, yy) => 0.7));
    for (let t = 0; t < 4; t++) { const to = new THREE.SphereGeometry(0.0145, 7, 5); place(to, x + 0.075, 0.015, z + (t - 1.5) * 0.02, 0, 0, 0, 1.3, 0.8, 0.8); B.add(to, cg(6 + t, (xx, yy) => 1)); }
  }
  for (const [side, a] of [[0, 0], [1, 0], [2, 1], [3, 1]]) {   // lattice braces: sides at z=+-0.235 (span x) and x=+-0.185 (span z)
    const alongX = side < 2, c = (side % 2 ? 1 : -1), span = alongX ? 0.31 : 0.41;
    for (let i = 0; i < 3; i++) { const y = 0.13 + i * 0.075, bx = alongX ? 0 : c * 0.185, bz = alongX ? c * 0.235 : 0; B.add(place(new THREE.BoxGeometry(alongX ? span : 0.012, 0.012, alongX ? 0.012 : span), bx, y, bz), cg(10 + side, null, () => 0.5));
      const q = (i - 1) * span * 0.3; B.add(place(new THREE.BoxGeometry(0.012, 0.19, 0.012), alongX ? q : c * 0.185, 0.2, alongX ? c * 0.235 : q), cg(14 + side, null, () => 0.5)); }
  }
  const body = B.geo();
  const mat = surf(12, 9, (u, v) => { const x = (v - 0.5) * 0.43, z = (u - 0.5) * 0.52, d = Math.min(1, ((x / 0.215) ** 2 + (z / 0.26) ** 2) * 0.5); return [x, 0.40 + 0.02 * d, z]; });
  return { body, mat };
}

// ---------------------------------------------------------------------------------------------------------------------
// TORCHES and BRAZIERS: gold stand (foot with 12 petal tongues, shaft with 2 lotus knops, soot-black lip), rim y 1.75
// ---------------------------------------------------------------------------------------------------------------------
function ribbed(geo, n, amt, y0, y1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < y0 || y > y1) continue; const x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x), k = 1 + amt * Math.cos(n * th) * sm(Math.min((y - y0) / 0.01, (y1 - y) / 0.01) + 0.0 + 0.5); p.setX(i, x * k); p.setZ(i, z * k); }
  geo.computeVertexNormals(); return outward(geo);
}
function buildTorchStand() {
  const B = new Bake(), c = (seed, extra) => (x, y, z, nx, ny, nz) => { const k = goldAt(nx, ny, nz, { at: [x, y, z], seed, edge: sm(1 - Math.abs(y - 1.1) / 0.22), cav: extra ? extra(x, y, z) : 0 }); return k; };
  const foot = lathe([[0.001, 0], [0.2, 0], [0.22, 0.012], [0.215, 0.03], [0.16, 0.055], [0.09, 0.09], [0.05, 0.14], [0.036, 0.2]], 48); ribbed(foot, 12, 0.07, 0.0, 0.07); B.add(foot, c(31, (x, y) => (y < 0.03 ? 0.7 : 0)));
  B.add(lathe([[0.036, 0.19], [0.035, 1.4]], 14), c(32));
  for (const ky of [0.62, 1.1]) { const kn = lathe([[0.035, ky - 0.07], [0.058, ky - 0.045], [0.076, ky], [0.058, ky + 0.045], [0.035, ky + 0.07]], 24); ribbed(kn, 6, 0.1, ky - 0.07, ky + 0.07); B.add(kn, c(33 + ky, (x, y) => (Math.abs(y - ky) > 0.05 ? 0.6 : 0))); }
  const bowl = lathe([[0.035, 1.39], [0.065, 1.43], [0.13, 1.5], [0.18, 1.62], [0.2, 1.75], [0.185, 1.752], [0.15, 1.69], [0.08, 1.64], [0.001, 1.63]], 40);
  B.add(bowl, (x, y, z, nx, ny, nz) => (y > 1.69 ? new THREE.Color("#17120e").lerp(new THREE.Color(K.goldD), clamp((1.745 - y) / 0.04)) : (y > 1.62 && ny > 0.2) ? new THREE.Color("#2a1c14") : c(34)(x, y, z, nx, ny, nz)));
  return B.geo();
}
function buildBrazier(rimY, R) {
  const B = new Bake(), c = (seed, extra) => (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed, edge: 0.3, cav: extra ? extra(x, y, z) : 0 });
  const by = rimY - 0.30, legR = R * 1.3 + 0.12;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5, fx = Math.cos(a) * legR, fz = Math.sin(a) * legR, tx = Math.cos(a) * R * 0.55, tz = Math.sin(a) * R * 0.55, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, curve = 0.04 * Math.sin(Math.PI * t); pts.push([lerp(fx, tx, t) + Math.cos(a) * curve, lerp(0.03, by + 0.03, t), lerp(fz, tz, t) + Math.sin(a) * curve]); }
    B.add(tube(pts, (t) => 0.038 - 0.016 * t, 8), c(40 + i, (x, y) => (y > by - 0.05 ? 0.6 : 0)));
    const paw = new THREE.SphereGeometry(0.052, 10, 6); place(paw, fx + Math.cos(a) * 0.03, 0.025, fz + Math.sin(a) * 0.03, 0, 0, 0, 1.2, 0.5, 1.2); B.add(paw, c(44 + i));
    for (let t = 0; t < 3; t++) { const to = new THREE.SphereGeometry(0.014, 6, 4); const aa = a + (t - 1) * 0.35; place(to, fx + Math.cos(aa) * 0.085, 0.014, fz + Math.sin(aa) * 0.085); B.add(to, c(48 + t)); }
  }
  const ringY = by * 0.45, ringR = lerp(legR, R * 0.55, (ringY - 0.03) / (by));
  B.add(lathe([[ringR - 0.012, ringY - 0.012], [ringR + 0.018, ringY - 0.012], [ringR + 0.018, ringY + 0.012], [ringR - 0.012, ringY + 0.012]], 30), c(52));
  const bowl = lathe([[0.001, by - 0.02], [0.08 * R / 0.3, by], [0.5 * R, by + 0.05], [0.9 * R, by + 0.2], [R, rimY], [R - 0.016, rimY + 0.002], [R * 0.9, rimY - 0.06], [R * 0.6, by + 0.08], [0.001, by + 0.06]], 44);
  ribbed(bowl, 12, 0.025, by - 0.01, by + 0.12);
  B.add(bowl, (x, y, z, nx, ny, nz) => (y > rimY - 0.04 ? new THREE.Color("#17120e").lerp(new THREE.Color(K.goldD), clamp((rimY - 0.002 - y) / 0.04)) : (ny > 0.3 && y > by + 0.06) ? new THREE.Color("#2a1c14") : c(53, (xx, yy) => (yy < by + 0.04 ? 0.6 : 0))(x, y, z, nx, ny, nz)));
  return B.geo();
}

// ---------------------------------------------------------------------------------------------------------------------
// THE JUDGES' FAR ROW: the look of costume `assessor` (DESIGN F) built here as scenery, seated on the stools. Three variants
// (body seed 31 / 43 / 59, body height 0.85 / 0.88 / 0.91). Local frame: facing +x, y 0 = the seat top (world 0.42).
// ---------------------------------------------------------------------------------------------------------------------
const JB = { rz: 0.38, rx: 0.33, h: 0.88 };
const bodyRz = (y) => JB.rz * eggY(y / JB.h);
const bodyRx = (y) => JB.rx * eggY(y / JB.h);
const rAt = (phi, y) => { const a = bodyRx(y) + 1e-4, b = bodyRz(y) + 1e-4, c = Math.cos(phi), s = Math.sin(phi); return 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (b * b)); };
const robeScale = (y) => Math.max(1, (lerp(0.41, 0.38, clamp((y - 0.03) / 0.3)) + 0.0) / Math.max(0.01, (bodyRz(y) + 0.02)));
function robeR(phi, y) { const body = rAt(phi, y) + 0.02, a = lerp(0.36, 0.33, clamp((y - 0.03) / 0.3)) * 1.0, b = lerp(0.41, 0.38, clamp((y - 0.03) / 0.3)); const c = Math.cos(phi), s = Math.sin(phi), skirt = 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (b * b)); return Math.max(body, skirt); }
const neckTop = (phi) => 0.30 + 0.30 * sm(Math.abs(phi) / 1.25);
// the 9 folds: 5 fanning from the left shoulder across the chest, 4 falling over the lap. left shoulder = -z (phi < 0).
const FOLDS = [];
for (let j = 0; j < 5; j++) FOLDS.push({ kind: 0, e: -0.15 + j * 0.42, deep: j === 1 || j === 3 });
for (let k = 0; k < 4; k++) FOLDS.push({ kind: 1, e: -0.42 + k * 0.28, deep: k === 2 });
function foldField(phi, y) {
  let best = 1e9, idx = -1, disp = 0;
  FOLDS.forEach((f, i) => {
    const v = clamp((y - 0.03) / 0.57);
    const pf = f.kind === 0 ? f.e + (-1.3 - f.e) * Math.pow(v, 1.3) : f.e + 0.05 * v, d = Math.abs(phi - pf) * 0.36;
    if (f.kind === 1 && v > 0.62) return;
    const w = 0.032, amp = 0.012 * (f.kind === 1 ? (1 - v) ** 0.5 : 1 - 0.3 * v);
    disp += amp * Math.exp(-((d / w) ** 2)) * (phi > pf ? 1 : 0.6);
    if (d < best) { best = d; idx = i; }
  });
  return { d: best, idx, disp };
}
function paintOverfold(g, w, h) {
  g.fillStyle = K.linen; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { const y = ((i + 0.5 + (hh(i * 3.1) - 0.5) * 0.4) / 60) * h; g.strokeStyle = i % 7 === 3 ? K.linenD : K.linenS; g.lineWidth = Math.max(1, h * 0.006); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.07 + i) * 0.6); g.stroke(); }
  g.fillStyle = K.gold; g.fillRect(0, h * 0.93, w, h * 0.07); g.fillStyle = K.goldL; g.fillRect(0, h * 0.935, w, h * 0.015); g.fillStyle = K.goldS; g.fillRect(0, h * 0.985, w, h * 0.015);
}
function paintSleeve(g, w, h) {
  g.fillStyle = K.linen; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const x = ((i + 0.5) / 14) * w; g.strokeStyle = i % 5 === 2 ? K.linenD : K.linenS; g.lineWidth = Math.max(1, w * 0.012); g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 8) g.lineTo(x + Math.sin(y * 0.09 + i) * 0.8, y); g.stroke(); }
  g.fillStyle = K.linenS; g.fillRect(0, h * 0.94, w, h * 0.06);   // the rolled hem
}
function paintFeather(g, w, h) {
  g.clearRect(0, 0, w, h);
  const hw = (v) => (v < 0.65 ? Math.pow(v / 0.65, 0.65) : Math.pow((1 - v) / 0.35, 0.8)) * 0.5 * w * 0.94;   // v = 0 root .. 1 tip
  const Y = (v) => h * (1 - v), cx = w / 2, quill = 0.1;
  // the vane: 38 barbs a side, each slightly forward-curved, 4 splits (gaps) in it
  const splits = [0.3, 0.48, 0.66, 0.8];
  for (const s of [-1, 1]) for (let i = 0; i < 38; i++) {
    const v0 = quill + (0.96 - quill) * (i / 38), v1 = Math.min(1, v0 + 0.12 + 0.03 * hh(i * 3.7 + s)), sp = splits.some((q, k) => Math.abs(v0 - q - (s > 0 ? 0 : 0.015)) < 0.012);
    const x0 = cx, x1 = cx + s * hw(v1) * (sp ? 0.86 : 1.0), y0 = Y(v0), y1 = Y(Math.min(1, v1 + 0.04));
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Y(v0 + 0.02), x1, y1); g.lineTo(x1, y1 + h * 0.012); g.quadraticCurveTo((x0 + x1) / 2, Y(v0) + h * 0.012, x0, y0 + h * 0.008); g.closePath();
    g.fillStyle = i % 3 === 0 ? "#cfc9bb" : "#f6f2e6"; g.fill();
  }
  g.strokeStyle = "#e9dcc0"; g.lineWidth = Math.max(2, w * 0.035); g.lineCap = "round"; g.beginPath(); g.moveTo(cx, Y(0.0)); g.lineTo(cx + w * 0.02, Y(0.97)); g.stroke();
  for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; g.strokeStyle = i % 2 ? "#f6f2e6" : "#cfc9bb"; g.lineWidth = Math.max(1.5, w * 0.03); g.beginPath(); g.moveTo(cx, Y(0.04)); g.quadraticCurveTo(cx + Math.sin(a) * w * 0.2, Y(0.12), cx + Math.sin(a) * w * 0.36, Y(0.02 + 0.08 * hh(i))); g.stroke(); }
}
function buildJudgeParts(variant) {
  const seed = [31, 43, 59][variant], hb = [0.85, 0.88, 0.91][variant];
  const parts = {}, skin = new THREE.Color(K.skin), tmp = new THREE.Color();
  // ---- body: the egg, skin, face (eyes, heavy brows, a mouth turned down), potato dimples, headband, collar, arms, legs
  const B = new Bake();
  const prof = []; for (let i = 0; i <= 26; i++) { const t = i / 26, y = JB.h * t; prof.push([Math.max(0.001, JB.rz * eggY(t)), y]); }
  const eg = lathe(prof, 36); place(eg, 0, 0, 0, 0, 0, 0, JB.rx / JB.rz, 1, 1);
  { const p = eg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.022 * (vn(x, y, z, 5, seed) - 0.5); p.setX(i, x * k); p.setZ(i, z * k); } eg.computeVertexNormals(); outward(eg); }
  B.add(eg, (x, y, z) => tmp.copy(skin).lerp(new THREE.Color(K.skinS), 0.35 * (1 - sm(y / 0.5)) + 0.12 * vn(x, y, z, 9, seed)).clone());
  const eyeY = 0.63, fx = (y) => bodyRx(y) - 0.012;
  for (const s of [-1, 1]) {
    const ew = new THREE.SphereGeometry(1, 12, 8); place(ew, fx(eyeY), eyeY, s * 0.135, 0, 0, 0, 0.028, 0.062, 0.05); B.add(ew, "#fffaf0");
    const ir = new THREE.SphereGeometry(1, 10, 8); place(ir, fx(eyeY) + 0.014, eyeY - 0.004, s * 0.135 - s * 0.006, 0, 0, 0, 0.02, 0.036, 0.032); B.add(ir, "#3a2010");
    const pu = new THREE.SphereGeometry(1, 8, 6); place(pu, fx(eyeY) + 0.026, eyeY - 0.004, s * 0.135 - s * 0.006, 0, 0, 0, 0.012, 0.02, 0.018); B.add(pu, "#0a0608");
    // heavy brows, angled down toward the nose (stern)
    B.add(tube([[fx(eyeY + 0.1) + 0.006, eyeY + 0.118, s * 0.215], [fx(eyeY + 0.1) + 0.012, eyeY + 0.108, s * 0.15], [fx(eyeY + 0.1) + 0.012, eyeY + 0.085, s * 0.08]], 0.016, 6), "#2a1408");
    const ch = new THREE.SphereGeometry(1, 10, 6); place(ch, fx(0.5) - 0.002, 0.5, s * 0.205, 0, 0, 0, 0.014, 0.034, 0.05); B.add(ch, "#e08a5a");
  }
  B.add(tube([[fx(0.38) + 0.004, 0.372, -0.085], [fx(0.36) + 0.01, 0.362, -0.04], [fx(0.36) + 0.012, 0.358, 0.04], [fx(0.38) + 0.004, 0.372, 0.085]], 0.0075, 6), "#5a2a1a");   // the mouth, a frown
  for (let i = 0; i < 9; i++) { const y = 0.2 + 0.55 * hh(seed + i * 3.7), a = (hh(seed + i * 5.3) - 0.5) * 4.2, r = rAt(a, y); const dm = new THREE.SphereGeometry(1, 6, 4); place(dm, r * Math.cos(a), y, r * Math.sin(a), 0, -a, 0, 0.012, 0.007, 0.01); B.add(dm, K.skinS); }
  // headband: GOLD, 0.045 high at y 0.76, 12 LAPIS squares, a LAPIS disc at the front, a tie with two ends at the back
  { const rb = (y) => bodyRz(y) + 0.008; const hb_ = lathe([[rb(0.738), 0.738], [rb(0.738) + 0.012, 0.742], [rb(0.76) + 0.014, 0.76], [rb(0.78) + 0.012, 0.778], [rb(0.782), 0.782]], 40); place(hb_, 0, 0, 0, 0, 0, 0, JB.rx / JB.rz, 1, 1); B.add(hb_, (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 60 + variant, edge: 0.2, cav: Math.abs(y - 0.76) > 0.018 ? 0.5 : 0 }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.26, r = rAt(a, 0.76) + 0.021, sq = new THREE.BoxGeometry(0.012, 0.012, 0.012); place(sq, r * Math.cos(a), 0.76, r * Math.sin(a), 0, -a, 0); B.add(sq, K.lapis); }
    const fd = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 16); place(fd, rAt(0, 0.76) + 0.024, 0.76, 0, 0, 0, Math.PI / 2); B.add(fd, K.lapis);
    for (const s of [-1, 1]) B.add(tube([[-rAt(Math.PI, 0.76) - 0.02, 0.76, s * 0.02], [-rAt(Math.PI, 0.76) - 0.03, 0.72, s * 0.035], [-rAt(Math.PI, 0.76) - 0.03, 0.68, s * 0.05]], (t) => 0.013 * (1 - 0.3 * t), 5), (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 70 }));
  }
  // legs: the knees forward on the stool, shins down to the sandals (the floor is y -0.42)
  for (const s of [-1, 1]) {
    B.add(tube([[0.2, 0.05, s * 0.18], [0.38, 0.06, s * 0.2], [0.42, 0.0, s * 0.2], [0.42, -0.3, s * 0.2]], 0.032, 7), K.limb);
    const so = new THREE.BoxGeometry(0.15, 0.035, 0.085); place(so, 0.48, -0.395, s * 0.2); B.add(so, "#4a2f1a");
  }
  // arms: sleeves are separate; the bare forearm with a GOLD band, the glove-mitt on the knee
  const armPts = (s) => [[0.0, 0.55, s * 0.355], [0.1, 0.31, s * 0.395], [0.33, 0.13, s * 0.215]];
  for (const s of [-1, 1]) {
    const [S, E, Hd] = armPts(s); B.add(tube([S, E, Hd], 0.017, 7), K.limb);
    const fa = (t) => [lerp(E[0], Hd[0], t), lerp(E[1], Hd[1], t), lerp(E[2], Hd[2], t)], gb = new THREE.CylinderGeometry(0.0235, 0.0235, 0.035, 14, 1, true);
    const dir = new V3(Hd[0] - E[0], Hd[1] - E[1], Hd[2] - E[2]).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir), eu = new THREE.Euler().setFromQuaternion(q, "YXZ");
    place(gb, ...fa(0.5), eu.x, eu.y, eu.z); B.add(gb, (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 80, edge: 0.1 }));
    const gl = tube([fa(0.5 - 0.02), fa(0.5 + 0.02)], 0.0245, 12, false); B.add(gl, K.goldS);   // the engraved line
    const hand = new THREE.SphereGeometry(1, 12, 8); place(hand, Hd[0] + 0.02, Hd[1] - 0.005, Hd[2], 0, 0, 0, 0.05, 0.036, 0.04); B.add(hand, "#e8b872");
    const th = new THREE.SphereGeometry(1, 8, 6); place(th, Hd[0] + 0.02, Hd[1] + 0.02, Hd[2] - s * 0.036, 0, 0, 0, 0.022, 0.016, 0.016); B.add(th, "#e8b872");
  }
  parts.body = B.geo();
  // ---- robe (vertex coloured folds), the knotted fringe (48 tassels), the collar with its 18 beads
  const R = new Bake(), nu = 72, nv = 16;
  const rg = surf(nu, nv, (u, v) => { const phi = u * TAU - Math.PI, top = neckTop(phi), y = 0.03 + (top - 0.03) * v, r = robeR(phi, y) + foldField(phi, y).disp * (v > 0.02 ? 1 : 0.2); return [r * Math.cos(phi), y, r * Math.sin(phi)]; });
  outward(rg); R.add(rg, (x, y, z, nx, ny, nz) => { const phi = Math.atan2(z, x), f = foldField(phi, y); let c = new THREE.Color(K.linen); const dd = f.d; if (dd < 0.011) c = new THREE.Color(FOLDS[f.idx].deep ? K.linenD : K.linenS); else if (dd < 0.03) c.lerp(new THREE.Color(K.linenS), 0.35 * (1 - (dd - 0.011) / 0.019)); if (y < 0.052) c = new THREE.Color(K.linenS); return c; });
  for (let i = 0; i < 48; i++) { const phi = (i / 48) * TAU, r = robeR(phi, 0.03) + 0.002; const tg = new THREE.ConeGeometry(0.013, 0.045, 5); place(tg, r * Math.cos(phi), 0.012, r * Math.sin(phi), Math.PI, 0, 0); R.add(tg, K.linenS); const kn = new THREE.SphereGeometry(0.011, 6, 4); place(kn, r * Math.cos(phi), 0.03, r * Math.sin(phi)); R.add(kn, K.linenD); }
  const neck = []; for (let i = 0; i <= 48; i++) { const phi = -Math.PI + (i / 48) * TAU, y = neckTop(phi) + 0.004, r = robeR(phi, Math.min(y, 0.6)) + 0.012; neck.push([r * Math.cos(phi), y, r * Math.sin(phi)]); }
  R.add(tube(neck, 0.021, 6, false), (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 90 + variant, edge: 0.1 }));
  for (let i = 0; i < 18; i++) { const j = Math.round(((i + 0.5) / 18) * 48), p = neck[Math.min(48, j)], bd = new THREE.SphereGeometry(0.0115, 8, 6); place(bd, p[0], p[1] + 0.012, p[2], 0, 0, 0); R.add(bd, (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed: 91 })); }
  { const p0 = neck[24], ov = new THREE.SphereGeometry(1, 12, 8); place(ov, p0[0] + 0.012, p0[1] + 0.005, p0[2], 0, 0, 0, 0.012, 0.022, 0.03); R.add(ov, K.lapis); }
  parts.robe = R.geo();
  // ---- the over-fold: a band 0.17 wide from the left shoulder across the chest to the right hip, with a loose end behind the shoulder
  { const pt = (s) => { const phi = lerp(-1.42, 0.78, s), y = lerp(0.56, 0.14, s) + 0.025 * Math.sin(Math.PI * s), r = robeR(phi, y) + foldField(phi, y).disp; return [r * Math.cos(phi), y, r * Math.sin(phi), phi]; };
    const strip = (s0, s1, wd) => surf(40, 4, (u, v) => { const s = lerp(s0, s1, u), a = pt(s), b = pt(Math.min(1, s + 0.01)), T = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), N = new V3(Math.cos(a[3]), 0, Math.sin(a[3])).normalize(), Bv = new V3().crossVectors(N, T).normalize(), off = (v - 0.5) * wd; return [a[0] + Bv.x * off + N.x * 0.012, a[1] + Bv.y * off + N.y * 0.012, a[2] + Bv.z * off + N.z * 0.012]; });
    const og = strip(0, 1, 0.17); outward(og); parts.over = og;
    const tail = surf(2, 4, (u, v) => { const phi = -1.5 - 0.18 * (u - 0.5), y = 0.58 - 0.12 * v, r = robeR(phi, 0.55) + 0.014; return [r * Math.cos(phi), y, r * Math.sin(phi)]; }); outward(tail); parts.tail = tail; }
  // ---- sleeves: short and wide, 0.20 at the shoulder to 0.15, ending 0.14 before the hand's centre
  parts.sleeves = [-1, 1].map((s) => { const [S, E, Hd] = armPts(s), L = 0.27, dir = new V3(E[0] - S[0], E[1] - S[1], E[2] - S[2]).normalize(), cg = new THREE.CylinderGeometry(0.1, 0.075, L, 22, 1, true), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.clone().negate()), eu = new THREE.Euler().setFromQuaternion(q, "YXZ"); place(cg, S[0] + dir.x * L / 2 - 0.0, S[1] + dir.y * L / 2, S[2] + dir.z * L / 2, eu.x, eu.y, eu.z); return cg; });
  parts.feather = surf(1, 12, (u, v) => [0.06 * v * v * v, 0.42 * v, (u - 0.5) * 0.14], (u, v) => [u, v]); outward(parts.feather, 0, 0);
  parts.hb = hb;
  return parts;
}

// ---------------------------------------------------------------------------------------------------------------------
// DOORS: GOLD-clad cedar, both faces alike: 4 rails, 3 relief panels 1.8 high (a heron among 7 reeds / a lotus clump / 9 papyrus
// stems), LAPIS inlay lines, 22 dome studs on each rail, wear at the meeting edge and a scuff along the bottom.
// ---------------------------------------------------------------------------------------------------------------------
const RAILS = [[0, 0.25], [2.05, 2.30], [4.10, 4.35], [6.15, 6.40]], PANELS = [[0.25, 2.05], [2.30, 4.10], [4.35, 6.15]];
function paintHeron(g, cx, y0, sd) {
  const gold = K.gold, hi = K.goldL, deep = K.goldD;
  for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * 0.2 + (hh(sd + i) - 0.5) * 0.06, h = 0.9 + 0.5 * hh(sd + i * 2.3); line(g, [[x, y0], [x + (hh(sd + i * 5) - 0.5) * 0.08, y0 + h * 0.5], [x + (hh(sd + i * 7) - 0.5) * 0.1, y0 + h]], 0.04, deep); line(g, [[x, y0], [x + (hh(sd + i * 7) - 0.5) * 0.1, y0 + h]], 0.022, i % 2 ? gold : hi); for (let k = 0; k < 3; k++) line(g, [[x + (hh(sd + i * 7) - 0.5) * 0.1, y0 + h - 0.02], [x + (hh(sd + i * 7) - 0.5) * 0.1 + (k - 1) * 0.07, y0 + h + 0.1]], 0.014, deep); }
  // the heron 1.4 tall, 2 head plumes
  line(g, [[cx - 0.05, y0 + 0.02], [cx - 0.06, y0 + 0.5]], 0.05, deep); line(g, [[cx - 0.05, y0 + 0.02], [cx - 0.06, y0 + 0.5]], 0.03, gold);
  line(g, [[cx + 0.07, y0 + 0.02], [cx + 0.08, y0 + 0.5]], 0.05, deep); line(g, [[cx + 0.07, y0 + 0.02], [cx + 0.08, y0 + 0.5]], 0.03, gold);
  ellP(g, cx, y0 + 0.78, 0.26, 0.3, 0.2); fil(g, gold, 0.025, deep); ellP(g, cx - 0.04, y0 + 0.76, 0.17, 0.22, 0.2); g.fillStyle = rgba(K.goldS, 0.4); g.fill();
  for (let i = 0; i < 6; i++) line(g, [[cx - 0.16 + i * 0.05, y0 + 0.9 - i * 0.04], [cx - 0.12 + i * 0.05, y0 + 0.62]], 0.012, K.lapisS);
  g.beginPath(); g.moveTo(cx + 0.14, y0 + 0.95); g.bezierCurveTo(cx + 0.3, y0 + 1.05, cx + 0.12, y0 + 1.15, cx + 0.2, y0 + 1.3); g.lineTo(cx + 0.26, y0 + 1.3); g.bezierCurveTo(cx + 0.2, y0 + 1.1, cx + 0.4, y0 + 1.02, cx + 0.2, y0 + 0.88); g.closePath(); fil(g, hi, 0.02, deep);
  ellP(g, cx + 0.24, y0 + 1.33, 0.06, 0.05); fil(g, gold, 0.02, deep); polyP(g, [[cx + 0.29, y0 + 1.34], [cx + 0.55, y0 + 1.3], [cx + 0.29, y0 + 1.31]]); fil(g, hi, 0.014, deep);
  line(g, [[cx + 0.2, y0 + 1.37], [cx - 0.04, y0 + 1.46]], 0.012, deep); line(g, [[cx + 0.2, y0 + 1.36], [cx - 0.0, y0 + 1.4]], 0.012, deep);
  ellP(g, cx + 0.245, y0 + 1.34, 0.012, 0.012); g.fillStyle = K.lapisS; g.fill();
  g.beginPath(); g.moveTo(cx - 0.2, y0 + 0.9); g.quadraticCurveTo(cx - 0.55, y0 + 0.7, cx - 0.5, y0 + 0.45); g.quadraticCurveTo(cx - 0.3, y0 + 0.6, cx - 0.12, y0 + 0.62); g.closePath(); fil(g, K.gold, 0.02, deep);
}
function paintLotusClump(g, cx, y0, sd) {
  const C = [K.goldL, K.gold, K.goldS];
  for (let i = 0; i < 3; i++) { const x = cx + (i - 1) * 0.42; ellP(g, x, y0 + 0.1, 0.28, 0.07, (hh(sd + i) - 0.5) * 0.2); fil(g, K.goldS, 0.02, K.goldD); line(g, [[x - 0.2, y0 + 0.1], [x + 0.2, y0 + 0.1]], 0.008, K.goldD); }
  const fl = [[-0.5, 1.2], [-0.25, 1.4], [0.0, 1.5], [0.28, 1.35], [0.52, 1.15]], bu = [[-0.36, 0.95], [-0.1, 1.05], [0.15, 0.98], [0.4, 0.85]];
  fl.forEach(([dx, h], i) => { line(g, [[cx + dx * 0.6, y0 + 0.1], [cx + dx, y0 + h - 0.3]], 0.04, K.goldD); line(g, [[cx + dx * 0.6, y0 + 0.1], [cx + dx, y0 + h - 0.3]], 0.022, K.gold); lotusFlower(g, cx + dx, y0 + h - 0.32, 0.32, { petals: 5, lean: dx * 20, cols: [K.goldL, K.gold, K.lapis], lw: 0.014 }); });
  bu.forEach(([dx, h], i) => { line(g, [[cx + dx * 0.7, y0 + 0.1], [cx + dx, y0 + h - 0.25]], 0.034, K.goldD); line(g, [[cx + dx * 0.7, y0 + 0.1], [cx + dx, y0 + h - 0.25]], 0.018, K.gold); lotusBud(g, cx + dx, y0 + h - 0.27, 0.26, { lean: dx * 25, col: K.goldL, tip: K.lapis, lw: 0.014 }); });
}
function paintPapyrus9(g, cx, y0, sd) {
  for (let i = 0; i < 9; i++) { const x = cx + (i - 4) * 0.17 + (hh(sd + i) - 0.5) * 0.05, h = 0.8 + 0.4 * hh(sd + i * 3.3), t = [x + (hh(sd + i * 5) - 0.5) * 0.1, y0 + h]; line(g, [[x, y0], [(x + t[0]) / 2, y0 + h * 0.5], t], 0.045, K.goldD); line(g, [[x, y0], [(x + t[0]) / 2, y0 + h * 0.5], t], 0.025, i % 2 ? K.gold : K.goldL); for (let k = 0; k < 9; k++) { const a = ((k / 8) - 0.5) * 2.6; line(g, [t, [t[0] + Math.sin(a) * 0.22, t[1] + Math.cos(a) * 0.2]], 0.015, K.goldD); } ellP(g, t[0], t[1] + 0.03, 0.05, 0.03); fil(g, K.lapis, 0.01, K.goldD); }
}
function paintLeaf(side, sd) {   // side 0 = left leaf (meeting edge at its right), 1 = right leaf (meeting edge at its left)
  const ppm = 200, W = 440, H = 1280;
  return canvasTex(W, H, (g, w, h) => {
    g.save(); g.setTransform(ppm, 0, 0, -ppm, 0, h);
    const oldLN = LN; LN = K.goldD;
    g.fillStyle = K.gold; g.fillRect(0, 0, 2.2, 6.4);
    // leaf seams every 0.085, each wobbled, at 6 % contrast; each sheet a hair different
    for (let i = 0; i < 26; i++) for (let j = 0; j < 76; j++) { g.fillStyle = `rgba(${hh(sd + i * 3.1 + j * 7.7) > 0.5 ? "255,240,184" : "154,106,30"},0.035)`; g.fillRect(i * 0.085, j * 0.085, 0.085, 0.085); }
    g.strokeStyle = "rgba(107,70,18,0.16)"; g.lineWidth = 0.004;
    for (let i = 1; i < 26; i++) { g.beginPath(); for (let y = 0; y <= 6.4; y += 0.1) { const x = i * 0.085 + 0.004 * Math.sin(y * 9 + i * 2.3); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    for (let j = 1; j < 76; j++) { g.beginPath(); for (let x = 0; x <= 2.2; x += 0.1) { const y = j * 0.085 + 0.004 * Math.sin(x * 8 + j * 1.9); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    // rails and stiles: darker gold with a bevel
    g.fillStyle = "#c99a3a"; for (const [a, b] of RAILS) g.fillRect(0, a, 2.2, b - a); g.fillRect(0, 0, 0.25, 6.4); g.fillRect(1.95, 0, 0.25, 6.4);
    for (const [a, b] of RAILS) { line(g, [[0, b - 0.012], [2.2, b - 0.012]], 0.012, K.goldL); line(g, [[0, a + 0.012], [2.2, a + 0.012]], 0.012, K.goldS); }
    // 3 relief panels: bevel frame, LAPIS inlay lines
    PANELS.forEach(([a, b], pi) => {
      g.fillStyle = "#b98a32"; g.fillRect(0.25, a, 1.7, b - a);
      g.fillStyle = K.goldL; g.beginPath(); g.moveTo(0.25, a); g.lineTo(0.25, b); g.lineTo(0.31, b - 0.06); g.lineTo(0.31, a + 0.06); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0.25, b); g.lineTo(1.95, b); g.lineTo(1.89, b - 0.06); g.lineTo(0.31, b - 0.06); g.closePath(); g.fill();
      g.fillStyle = K.goldD; g.beginPath(); g.moveTo(1.95, a); g.lineTo(1.95, b); g.lineTo(1.89, b - 0.06); g.lineTo(1.89, a + 0.06); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0.25, a); g.lineTo(1.95, a); g.lineTo(1.89, a + 0.06); g.lineTo(0.31, a + 0.06); g.closePath(); g.fill();
      g.fillStyle = "#c89a38"; g.fillRect(0.31, a + 0.06, 1.58, b - a - 0.12);
      for (const ins of [0.08, 0.11]) { g.strokeStyle = K.lapis; g.lineWidth = 0.008; g.strokeRect(0.25 + ins, a + ins, 1.7 - 2 * ins, b - a - 2 * ins); }
      g.save(); g.beginPath(); g.rect(0.33, a + 0.08, 1.54, b - a - 0.16); g.clip();
      const sx = sd * 7 + pi * 31; if (pi === 0) paintHeron(g, 1.1, a + 0.12, sx); else if (pi === 1) paintLotusClump(g, 1.1, a + 0.1, sx); else paintPapyrus9(g, 1.1, a + 0.1, sx);
      g.restore();
    });
    LN = oldLN;
    // wear: rubbed to bronze at y 0.9-1.5 by the meeting edge (red bole shows in 1 spot of 4), a 0.5 m scuff along the bottom
    const mx = side === 0 ? 2.2 : 0;
    for (let i = 0; i < 12; i++) { const x = mx + (side === 0 ? -1 : 1) * (0.02 + 0.24 * hh(sd + i * 2.7)), y = 0.9 + 0.6 * hh(sd + i * 4.9); flake(g, x, y, 0.025 + 0.06 * hh(sd + i * 1.7), sd + i * 9.1, i % 4 === 0 ? K.bole : K.goldD); }
    for (let i = 0; i < 10; i++) { const x = 0.7 + 0.5 * hh(sd + i * 3.9), y = 0.02 + 0.13 * hh(sd + i * 6.1); flake(g, x, y, 0.02 + 0.05 * hh(sd + i * 2.3), sd + i * 7.3, i % 4 === 1 ? K.bole : K.goldD); }
    g.restore();
  }, `leaf${side}`);
}
function buildStud() { const g = new THREE.SphereGeometry(0.03, 10, 6, 0, TAU, 0, Math.PI / 2); g.rotateX(Math.PI / 2); return g; }   // a dome stud r 0.03 on +z

// ---------------------------------------------------------------------------------------------------------------------
// FIELD OF REEDS (seen through the opening only; hidden at doors 0)
// ---------------------------------------------------------------------------------------------------------------------
function paintStem(i) {   // one wheat stem (or, 1 in 5, a green reed with a brown head), 0.42 x 2.1 m, drawn once
  const reed = i % 5 === 3, W = 64, H = 320;
  return canvasTex(W, H, (g, w, h) => {
    g.clearRect(0, 0, w, h); const bend = (hh(i * 3.3) - 0.5) * 12, grains = 12 + Math.floor(hh(i * 5.1) * 5);
    const stalk = reed ? "#7a9a3a" : "#c9a13a";
    g.lineCap = "round"; g.strokeStyle = cmul(stalk, 0.55); g.lineWidth = 5.5; g.beginPath(); g.moveTo(w / 2, h); g.quadraticCurveTo(w / 2 + bend, h * 0.5, w / 2 + bend * 1.6, 70); g.stroke();
    g.strokeStyle = stalk; g.lineWidth = 3.4; g.stroke();
    for (const [v, s] of [[0.78, -1], [0.55, 1]]) { const x0 = w / 2 + bend * (1 - v) * 0.9, y0 = h * v; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + s * 14, y0 - 12, x0 + s * 22, y0 + 8 + 10 * hh(i + v)); g.strokeStyle = reed ? "#6a8a30" : "#b9972f"; g.lineWidth = 3; g.stroke(); }
    const hx = w / 2 + bend * 1.6;
    if (reed) { g.fillStyle = "#6a4a2a"; g.beginPath(); g.ellipse(hx, 52, 5.5, 22, 0, 0, TAU); g.fill(); g.strokeStyle = "#3a2a18"; g.lineWidth = 1; g.stroke(); g.strokeStyle = "#7a9a3a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx, 30); g.lineTo(hx + 3, 8); g.stroke(); }
    else for (let k = 0; k < grains; k++) {
      const t = k / (grains - 1), y = 74 - t * 62, s = k % 2 ? 1 : -1, gx = hx + s * (4.4 - 1.5 * t), a = s * 0.34;
      g.save(); g.translate(gx, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 3.6, 6.8, 0, 0, TAU); g.fillStyle = k % 3 ? "#e9b93a" : "#f6d86a"; g.fill(); g.strokeStyle = "#a07a20"; g.lineWidth = 0.8; g.stroke(); g.restore();
      g.strokeStyle = k % 2 ? "#f0cf68" : "#d9a93a"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx + s * 1.5, y - 5); g.lineTo(gx + s * 8 + (hh(i + k) - 0.5) * 4, y - 22 - 4 * hh(i * 7 + k)); g.stroke();
    }
  }, `stem${i}`, 4);
}
function paintWheatRibbon(r) {   // field ribbons: #f0c95a paling to #f6e08a, strokes of wheat in rows
  const W = 1536, H = 192;
  return canvasTex(W, H, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f6e08a"); gr.addColorStop(1, "#f0c95a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 14; j++) for (let i = 0; i < 200; i++) { const x = hh(r * 997 + j * 31 + i * 1.7) * w, y = (j + hh(r * 331 + i * 2.9 + j)) / 14 * h, l = 7 + 11 * (1 - j / 14); g.strokeStyle = hh(i + j * 5 + r) > 0.5 ? "rgba(228,176,52,0.7)" : "rgba(250,226,140,0.7)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hh(i * 3 + j) - 0.5) * 4, y - l); g.stroke(); }
  }, `ribbon${r}`, 4);
}
function paintWave(r) {   // the wind wave: soft lighter bands, one crossing every 5 s
  return canvasTex(256, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 16; i++) gr.addColorStop(i / 16, `rgba(255,248,200,${(0.5 * (0.5 + 0.5 * Math.sin((i / 16) * TAU * (2 + r % 2) + r)) ** 2).toFixed(3)})`); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, `wave${r}`, 1);
}
function paintPalm(i) {
  return canvasTex(256, 384, (g, w, h) => {
    g.clearRect(0, 0, w, h); const lean = (hh(i * 3.1) - 0.5) * 30;
    g.strokeStyle = "#6a4a2a"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(w / 2, h); g.quadraticCurveTo(w / 2 + lean * 0.6, h * 0.6, w / 2 + lean, 140); g.stroke(); g.strokeStyle = "#8a6a3a"; g.lineWidth = 6; g.stroke();
    for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI, ex = w / 2 + lean + Math.cos(a) * (90 + 30 * hh(i + k)), ey = 140 + Math.sin(a) * -50 + 24 + 24 * hh(i * 2 + k); g.beginPath(); g.moveTo(w / 2 + lean, 140); g.quadraticCurveTo((w / 2 + lean + ex) / 2, 100 - 20 * Math.abs(Math.sin(a)), ex, ey); g.lineWidth = 9; g.strokeStyle = "#3f7a30"; g.stroke(); g.lineWidth = 4; g.strokeStyle = "#5a9a3a"; g.stroke(); }
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(w / 2 + lean + (k - 1) * 8, 150, 6, 0, TAU); g.fillStyle = "#6a4a2a"; g.fill(); }
  }, `palm${i}`, 4);
}

// ---------------------------------------------------------------------------------------------------------------------
// flame cards: 3 painted shapes (5 tongues in 3 cel tones), swapped 8 x a second
// ---------------------------------------------------------------------------------------------------------------------
function paintFlame(fr) {
  return canvasTex(128, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const tongues = [[0, 0.98, 0.26], [-0.2, 0.66, 0.2], [0.2, 0.72, 0.2], [-0.36, 0.4, 0.15], [0.36, 0.44, 0.15]];
    const draw = (scale, col) => {
      g.fillStyle = col;
      tongues.forEach(([dx, hh_, ww], i) => {
        const j = (hh(fr * 11.3 + i * 4.1) - 0.5), x = w / 2 + dx * w * 0.5 * scale + j * 6, top = h * (1 - hh_ * scale * (0.9 + 0.2 * hh(fr * 3.7 + i))), base = h * 0.99, wd = ww * w * scale, lean = (dx * 8 + j * 14) * scale;
        g.beginPath(); g.moveTo(x - wd, base - (scale < 1 ? h * 0.02 : 0)); g.bezierCurveTo(x - wd * 1.2, base - (base - top) * 0.45, x - wd * 0.3 + lean * 0.2, base - (base - top) * 0.75, x + lean, top); g.bezierCurveTo(x + wd * 0.3 + lean * 0.2, base - (base - top) * 0.75, x + wd * 1.2, base - (base - top) * 0.45, x + wd, base - (scale < 1 ? h * 0.02 : 0)); g.closePath(); g.fill();
      });
      if (scale === 1) { g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.34, h * 0.06, 0, 0, TAU); g.fill(); }
    };
    draw(1.0, "#f0661e"); draw(0.72, "#ffb43a"); draw(0.42, "#fff3b0");
  }, `flame${fr}`, 1);
}
const smokeTex = () => radialTex([[0, "rgba(255,255,255,0.9)"], [0.55, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]], 64);
const poolTex = () => radialTex([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.55)"], [0.7, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]], 128);
const streakTex = () => canvasTex(32, 128, (g, w, h) => { const im = g.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i / (w - 1)) * 2 - 1, v = (j / (h - 1)) * 2 - 1, a = Math.pow(Math.max(0, 1 - u * u), 1.5) * Math.pow(Math.max(0, 1 - Math.abs(v)), 0.8); im.data.set([255, 255, 255, Math.round(a * 255)], (j * w + i) * 4); } g.putImageData(im, 0, 0); }, "streak", 1);
const rayTex = () => canvasTex(16, 128, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.7, "rgba(255,255,255,0.35)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); const hz = g.createLinearGradient(0, 0, w, 0); hz.addColorStop(0, "rgba(0,0,0,1)"); hz.addColorStop(0.5, "rgba(0,0,0,0)"); hz.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = hz; g.fillRect(0, 0, w, h); }, "ray", 1);
const mote = () => canvasTex(32, 32, (g, w, h) => { const q = g.createRadialGradient(16, 16, 0, 16, 16, 16); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.5, "rgba(255,255,255,0.6)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "mote", 1);

// ---------------------------------------------------------------------------------------------------------------------
export const HEART_HALL_STATE = { hearthall: { doors: 0, torch: 1, tense: 0, rowLight: 0.6 } };
export const HEART_HALL_GRIPS = {};

export const HEART_HALL_KINDS = {
  hearthall(P) {
    const S = P.spec, root = P.whole, rowFrom = Math.max(1, Math.min(43, S.rowFrom ?? 7));
    const dim = [];   // materials whose colour is the baked light x (1 - 0.4 tense)
    const reg = (m, base = "#ffffff") => { dim.push({ m, c: new THREE.Color(base) }); return m; };
    const M = (geo, mat, parent = root, solid = false, recv = false) => { const o = new THREE.Mesh(geo, mat); o.castShadow = false; o.receiveShadow = recv; o.userData.solid = solid; parent.add(o); return o; };
    const grp = (parent = root) => { const g = new THREE.Group(); parent.add(g); return g; };
    const flipTex = (t) => { const c = t.clone(); c.wrapS = THREE.RepeatWrapping; c.repeat.x = -1; c.offset.x = 1; c.needsUpdate = true; return c; };

    // ---------------------------------------------------------------- floor
    for (const ix of [-8, 0]) for (const iz of [-9, -3, 3]) {
      const tex = paintFloorTile(ix, ix + 8, iz, iz + 6, 200, `floor-${ix}-${iz}`), m = reg(stdMat({ map: tex, roughness: 0.34, metalness: 0.0 }));
      const o = M(new THREE.PlaneGeometry(8, 6), m, root, false, true); o.rotation.x = -Math.PI / 2; o.position.set(ix + 4, 0, iz + 3);
    }
    for (let i = 0; i < 5; i++) {
      const z0 = 9 + 7.4 * i, tex = paintFloorTile(-8, 8, z0, z0 + 7.4, 80, `floor-far-${i}`), m = reg(stdMat({ map: tex, roughness: 0.34 }));
      const o = M(new THREE.PlaneGeometry(16, 7.4), m, root, false, true); o.rotation.x = -Math.PI / 2; o.position.set(0, 0, z0 + 3.7);
    }

    // ---------------------------------------------------------------- walls: side walls (2 x 13 painted segments), door wall, end wall
    for (const side of [0, 1]) for (let k = 0; k < 13; k++) {
      const [z0, z1] = segZ(k), m = reg(paintMat(paintSideWall(side, k)));
      const o = M(new THREE.PlaneGeometry(z1 - z0, WALL_H), m); o.position.set(side ? 8 : -8, WALL_H / 2, (z0 + z1) / 2); o.rotation.y = side ? -Math.PI / 2 : Math.PI / 2;
    }
    { const o = M(new THREE.PlaneGeometry(16, WALL_H), reg(paintMat(null, { color: "#06050a" }), "#06050a")); o.position.set(0, WALL_H / 2, 46); o.rotation.y = Math.PI; }
    for (const [which, wd, ht, cx, cy] of [[0, 5.8, WALL_H, -5.1, WALL_H / 2], [1, 5.8, WALL_H, 5.1, WALL_H / 2], [2, 4.4, 4.2, 0, 8.5]]) { const o = M(new THREE.PlaneGeometry(wd, ht), reg(paintMat(paintDoorWall(which)))); o.position.set(cx, cy, -9); }
    // ceiling: NIGHT BLUE, darker along z; stars 0.18 across on a 0.6 m lattice, each shifted up to 6 cm and turned (about 2.8 per m2)
    { const g = new THREE.PlaneGeometry(16, 55, 1, 55), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const z = p.getY(i) + 18.5; c.set(K.night).multiplyScalar(0.25 + 0.75 * dk(z)); col.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3)); const o = M(g, reg(paintMat(null, { vertexColors: true }))); o.rotation.x = Math.PI / 2; o.position.set(0, WALL_H, 18.5); }
    { const sg = new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.038 : 0.09; s[i ? "lineTo" : "moveTo"](r * Math.cos(a), r * Math.sin(a)); } s.closePath(); return s; })()); sg.rotateX(Math.PI / 2);
      const nx = 26, nz = 91, st = new THREE.InstancedMesh(sg, noLine(new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide, fog: false })), nx * nz), d = new THREE.Object3D(), c = new THREE.Color();
      let n = 0; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = -7.8 + 0.3 + i * 0.6 + (hh(i * 3.7 + j * 11.3) - 0.5) * 0.12, z = -9 + 0.3 + j * 0.6 + (hh(i * 5.9 + j * 2.9) - 0.5) * 0.12; d.position.set(x, WALL_H - 0.01, z); d.rotation.set(0, hh(i * 1.9 + j * 7.7) * TAU, 0); d.updateMatrix(); st.setMatrixAt(n, d.matrix); c.set(K.star).multiplyScalar(0.3 + 0.7 * dk(z)); st.setColorAt(n, c); n++; }
      st.count = n; st.userData.solid = false; st.frustumCulled = false; root.add(st); }
    // architraves: plaster, a block border top and bottom and a row of small spread-wing birds between
    for (let k = 0; k < 13; k++) {
      const [z0, z1] = segZ(k), len = z1 - z0, zm = (z0 + z1) / 2, tx = paintArchitrave(k), tf = flipTex(tx), dir = paintMat(tx), flp = paintMat(tf);
      for (const side of [-1, 1]) {
        const inner = side < 0 ? flp : dir, outer = side < 0 ? dir : flp;   // left row: inner face looks +x (u runs to -z), right row: -x
        const a = M(new THREE.PlaneGeometry(len, 0.8), reg(inner)); a.position.set(side * 5.9, 10.2, zm); a.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const b = M(new THREE.PlaneGeometry(len, 0.8), reg(outer)); b.position.set(side * 6.9, 10.2, zm); b.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        const u = M(new THREE.PlaneGeometry(1.0, len), reg(paintMat(null, { color: cmul(K.plasterS, Math.max(dk(zm), 0.08)) }), cmul(K.plasterS, Math.max(dk(zm), 0.08)))); u.rotation.x = Math.PI / 2; u.position.set(side * 6.4, 9.8, zm);
      }
    }

    // ---------------------------------------------------------------- columns: 2 rows of 12
    const colLowerGeo = buildColumnLower(), colUpperGeo = buildColumnUpper(), abTex = canvasTex(512, 154, paintWingBand, "abacus"), abMat = (f) => { const m = stdMat({ map: abTex, roughness: 0.7 }); reg(m, toHex([f * 255, f * 255, f * 255])); return m; };
    const colEmissive = []; const colSolidBase = [];
    for (let k = 0; k < 12; k++) {
      const z = -6.75 + 4.5 * k, f = 0.32 + 0.68 * dk(z), lowTex = paintColumnLower(k), chipG = (() => { const B = new Bake(); for (let c = 0; c < 6; c++) { const a = hh(k * 17 + c * 3.1) * TAU, w = 0.03 + 0.07 * hh(k * 7 + c), hgt = 0.03 + 0.05 * hh(k * 11 + c * 2), bx = new THREE.BoxGeometry(0.025, hgt, w); place(bx, 0.752 * Math.cos(a), 0.03 + (0.2 - hgt) * hh(k * 13 + c * 5), 0.752 * Math.sin(a), 0, -a, 0); B.add(bx, K.stone); } return B.geo(); })();
      for (const side of [-1, 1]) {
        const g = grp(); g.position.set(side * 6.4, 0, z); g.rotation.y = side > 0 ? Math.PI : 0;
        const lm = reg(stdMat({ map: lowTex, roughness: 0.7 }), toHex([f * 255, f * 255, f * 255])), um = reg(stdMat({ vertexColors: true, roughness: 0.7, emissive: new THREE.Color("#ffb060"), emissiveIntensity: 0 }), toHex([f * 255, f * 255, f * 255]));
        M(colLowerGeo, lm, g, true); M(colUpperGeo, um, g, true); M(chipG, reg(stdMat({ vertexColors: true, roughness: 0.9 }), toHex([f * 255, f * 255, f * 255])), g, false);
        const ab = M(new THREE.BoxGeometry(1.0, 0.3, 1.0), [abMat(f), abMat(f), stdMat({ color: cmul(K.plaster, f) }), stdMat({ color: cmul(K.plasterS, f) }), abMat(f), abMat(f)], g, false); ab.position.y = 9.65;
        colEmissive.push({ mat: um, z, side, k });
      }
    }

    // ---------------------------------------------------------------- torches (22) and braziers (4): 26 flames
    const flames = [], torchGeo = buildTorchStand(), scaleBraz = buildBrazier(1.2, 0.30), doorBraz = buildBrazier(2.4, 0.38);
    const defs = [];
    for (const side of [-1, 1]) for (let k = 0; k < 11; k++) defs.push({ x: side * 6.0, z: -4.5 + 4.5 * k, rim: 1.75, geo: torchGeo, kind: "torch", side, k, row: side < 0 && -4.5 + 4.5 * k >= 9 });
    for (const x of [-2.2, 2.2]) defs.push({ x, z: -3.4, rim: 1.2, geo: scaleBraz, kind: "scale", side: Math.sign(x), k: -1 });
    for (const x of [-3.2, 3.2]) defs.push({ x, z: -8.2, rim: 2.4, geo: doorBraz, kind: "door", side: Math.sign(x), k: -2 });
    const flameTex = [0, 1, 2].map(paintFlame), smTex = smokeTex(), plTex = poolTex(), stTex = streakTex();
    const emberGeo = new THREE.IcosahedronGeometry(0.011, 0), sparkGeo = new THREE.IcosahedronGeometry(0.01, 0);
    const sparkList = [];
    defs.forEach((d, i) => {
      const fz = 0.4 + 0.6 * dk(d.z), sm_ = reg(stdMat({ vertexColors: true, roughness: 0.4 }), toHex([fz * 255, fz * 255, fz * 255]));
      const st = M(d.geo, sm_, root, false); st.position.set(d.x, 0, d.z);
      const h = 0.42 + 0.13 * hh(i * 3.1 + 2), fg = grp(); fg.position.set(d.x, d.rim - 0.03, d.z);
      const fm = noLine(new THREE.MeshBasicMaterial({ map: flameTex[0], transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
      for (const ry of [0, Math.PI / 2]) { const pg = new THREE.PlaneGeometry(h * 0.62, h); pg.translate(0, h / 2, 0); const pl = steamy(new THREE.Mesh(pg, fm), 6); pl.rotation.y = ry; fg.add(pl); }
      const gm = softMat({ map: radialTex([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]], 64), color: "#ff9a3a", opacity: 0, blending: THREE.AdditiveBlending }), glow = new THREE.Sprite(Object.assign(new THREE.SpriteMaterial({ map: gm.map, color: "#ff9a3a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false, toneMapped: false }), {})); glow.material.userData.noOutline = true; glow.scale.set(1.8, 1.8, 1); glow.position.set(d.x, d.rim + h * 0.4, d.z); steamy(glow, 7); root.add(glow);
      const fp = steamy(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), softMat({ map: plTex, color: "#ffb060", opacity: 0, blending: THREE.AdditiveBlending })), 2); fp.rotation.x = -Math.PI / 2; fp.position.set(d.x, 0.006, d.z); root.add(fp);
      let wp = null; if (d.kind === "torch") { wp = steamy(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), softMat({ map: plTex, color: "#ffb060", opacity: 0, blending: THREE.AdditiveBlending })), 2); wp.position.set(d.x < 0 ? -7.975 : 7.975, 2.5, d.z); wp.rotation.y = d.x < 0 ? Math.PI / 2 : -Math.PI / 2; root.add(wp); }
      if (d.kind === "door") { wp = steamy(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), softMat({ map: plTex, color: "#ffb060", opacity: 0, blending: THREE.AdditiveBlending })), 2); wp.position.set(d.x, 3.2, -8.985); root.add(wp); }
      const sk = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.6), softMat({ map: stTex, color: "#ffb060", opacity: 0, blending: THREE.AdditiveBlending })), 2); sk.rotation.x = -Math.PI / 2; sk.position.set(d.x, 0.007, d.z + 1.3); root.add(sk);
      const smoke = []; const smM = noLine(new THREE.SpriteMaterial({ map: smTex, color: "#3a302a", transparent: true, depthWrite: false, opacity: 0, fog: false }));
      for (let q = 0; q < 8; q++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smTex, color: "#3a302a", transparent: true, depthWrite: false, opacity: 0, fog: false })); sp.material.userData.noOutline = true; steamy(sp, 5); root.add(sp); smoke.push(sp); }
      const nS = 6 + Math.floor(hh(i * 7.7) * 4); for (let s = 0; s < nS; s++) sparkList.push({ f: i, rate: 0.8 + 0.7 * hh(i * 13 + s * 3.1), ph: hh(i * 17 + s * 5.3), dx: (hh(i * 19 + s) - 0.5) * 0.3, dz: (hh(i * 23 + s) - 0.5) * 0.3, sw: hh(i * 29 + s * 2) * TAU });
      flames.push({ ...d, i, h, group: fg, mat: fm, glow, fp, wp, sk, smoke, a: TAU * hh(i * 3.7), b: TAU * hh(i * 5.9 + 1), sway: TAU * hh(i * 9.1), draught: d.kind !== "torch" || (d.z < 1), solid: sm_ });
    });
    const NE = flames.length * 12, embers = new THREE.InstancedMesh(emberGeo, noLine(new THREE.MeshBasicMaterial({ color: "#ff6a1e", toneMapped: false, fog: false })), NE); embers.userData.steam = true; embers.userData.solid = false; embers.frustumCulled = false; root.add(embers);
    const sparks = new THREE.InstancedMesh(sparkGeo, noLine(new THREE.MeshBasicMaterial({ color: "#ffd27a", toneMapped: false, fog: false })), sparkList.length); sparks.userData.steam = true; sparks.userData.solid = false; sparks.frustumCulled = false; root.add(sparks);
    // polish: under each column a pale streak at 0.12
    for (let k = 0; k < 12; k++) for (const side of [-1, 1]) { const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.6), softMat({ map: stTex, color: "#fff0d0", opacity: 0.12 * (0.3 + 0.7 * dk(-6.75 + 4.5 * k)) })), 2); o.rotation.x = -Math.PI / 2; o.position.set(side * 6.4, 0.007, -6.75 + 4.5 * k + 1.3); root.add(o); }

    // ---------------------------------------------------------------- real lights (6 at most) + the cold rim
    const mkPL = (x, y, z, rg) => { const l = new THREE.PointLight("#ffb060", 0, rg, 2); l.position.set(x, y, z); l.castShadow = false; root.add(l); return l; };
    const lights = [mkPL(-2.2, 1.5, -3.4, 8), mkPL(2.2, 1.5, -3.4, 8), mkPL(-6, 2.05, 0, 9), mkPL(6, 2.05, 0, 9), mkPL(-6, 2.05, 4.5, 9)];
    const lightOf = [flames.findIndex((f) => f.kind === "scale" && f.side < 0), flames.findIndex((f) => f.kind === "scale" && f.side > 0), flames.findIndex((f) => f.kind === "torch" && f.side < 0 && f.k === 1), flames.findIndex((f) => f.kind === "torch" && f.side > 0 && f.k === 1), flames.findIndex((f) => f.kind === "torch" && f.side < 0 && f.k === 2)];
    const sun = new THREE.SpotLight("#ffe08a", 0, 30, 0.5, 0.6, 1.2); sun.position.set(0, 5, -14); const sunT = new THREE.Object3D(); sunT.position.set(0, 0, -2); root.add(sunT); sun.target = sunT; sun.castShadow = false; root.add(sun);
    const rim = new THREE.DirectionalLight("#7a8fb0", 0); rim.position.set(-0.6, 0.5, -0.6).multiplyScalar(10); const rimT = new THREE.Object3D(); root.add(rimT); rim.target = rimT; rim.castShadow = false; root.add(rim);

    // ---------------------------------------------------------------- dust round the scale (80) and in the door light (60)
    const moteT = mote(), mkMotes = (n, box, seed, sz, op, col) => {
      const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), base = [], dirs = [];
      for (let i = 0; i < n; i++) { base.push([box[0] + (box[3] - box[0]) * hh(seed + i * 3.1), box[1] + (box[4] - box[1]) * hh(seed + i * 5.7), box[2] + (box[5] - box[2]) * hh(seed + i * 7.3)]); const a = hh(seed + i * 11.3) * TAU, e = (hh(seed + i * 13.7) - 0.5) * 1.2; dirs.push([Math.cos(a) * Math.cos(e), Math.sin(e) * 0.6 + 0.15, Math.sin(a) * Math.cos(e)]); }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pm = noLine(new THREE.PointsMaterial({ map: moteT, color: col, size: sz, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
      const pt = new THREE.Points(g, pm); pt.frustumCulled = false; pt.userData.steam = true; pt.userData.solid = false; root.add(pt); return { pt, g, base, dirs, box, mat: pm, op };
    };
    const dustA = mkMotes(80, [-2.6, 0.2, -2.6, 2.6, 3.2, 2.6], 500, 0.016, 0.25, "#ffd9a0"), dustB = mkMotes(60, [-2.2, 0.4, -9, 2.2, 5.2, -1], 700, 0.016, 0.25, "#ffe9b0");
    const placeMotes = (D, t, vis) => { D.pt.visible = vis > 0.003; if (!D.pt.visible) return; D.mat.opacity = D.op * vis; const p = D.g.attributes.position, [x0, y0, z0, x1, y1, z1] = D.box, sx = x1 - x0, sy = y1 - y0, sz = z1 - z0; for (let i = 0; i < D.base.length; i++) { const b = D.base[i], d = D.dirs[i], wr = (v, lo, sp) => lo + (((v - lo) % sp) + sp) % sp; p.setXYZ(i, wr(b[0] + d[0] * 0.05 * t, x0, sx), wr(b[1] + d[1] * 0.05 * t, y0, sy), wr(b[2] + d[2] * 0.05 * t, z0, sz)); } p.needsUpdate = true; };

    // ---------------------------------------------------------------- stools (42) and the far row of judges
    const stoolG = buildStool(), reedTex = canvasTex(240, 192, paintReed, "reed"), jparts = [0, 1, 2].map(buildJudgeParts);
    const ofTex = canvasTex(512, 128, paintOverfold, "overfold"), slTex = canvasTex(128, 128, paintSleeve, "sleeve"), feTex = canvasTex(128, 320, paintFeather, "feather");
    const judges = [];
    for (let i = 0; i < 42; i++) {
      const z = 2.0 + 0.95 * i, f = 0.4 + 0.6 * dk(z), sc = toHex([f * 255, f * 255, f * 255]);
      const sg = grp(); sg.position.set(-5.2, 0, z);
      M(stoolG.body, reg(stdMat({ vertexColors: true, roughness: 0.38 }), sc), sg, true); M(stoolG.mat, reg(stdMat({ map: reedTex, roughness: 0.6 }), sc), sg, true);
      if (i + 1 >= rowFrom) {
        const v = i % 3, pp = jparts[v], jg = grp(); jg.position.set(-5.2, 0.42, z); const bg = grp(jg); bg.scale.set(1, pp.hb / 0.88, 1);
        const jf = 1, vm = stdMat({ vertexColors: true, roughness: 0.8 }), lm = stdMat({ map: ofTex, roughness: 0.9, side: THREE.DoubleSide }), sm2 = stdMat({ map: slTex, roughness: 0.9, side: THREE.DoubleSide }), fm = stdMat({ map: feTex, roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.4 });
        const mats = [vm, lm, sm2];
        const bodyM = M(pp.body, vm, bg, false), robeM = M(pp.robe, vm, bg, false), ovM = M(pp.over, lm, bg, false), tlM = M(pp.tail, lm, bg, false);
        for (const s of pp.sleeves) M(s, sm2, bg, false);
        const fg = grp(bg); fg.position.set(0, 0.86, -0.05); const lean = (5 + 10 * hh(i * 3.3 + 9)) * DEG; fg.rotation.z = lean; M(pp.feather, fm, fg, false);
        judges.push({ i, z, bg, fg, vm, lm, sm: sm2, fm, lean, ph: TAU * hh(i * 7.1), ph2: TAU * hh(i * 9.3) });
      }
    }

    // ---------------------------------------------------------------- doors: frame, two leaves, lintel with its cavetto cornice
    const doorG = grp(), leaves = [];
    { const B = new Bake(), gc = (seed) => (x, y, z, nx, ny, nz) => goldAt(nx, ny, nz, { at: [x, y, z], seed, edge: 0.15 });
      B.add(place(new THREE.BoxGeometry(0.12, 6.52, 0.24), -2.26, 3.26, -8.88), gc(101)); B.add(place(new THREE.BoxGeometry(0.12, 6.52, 0.24), 2.26, 3.26, -8.88), gc(102)); B.add(place(new THREE.BoxGeometry(4.64, 0.12, 0.24), 0, 6.46, -8.88), gc(103));
      B.add(place(new THREE.BoxGeometry(4.4, 0.15, 0.7), 0, 0.075, -9.35), K.linenS);
      M(B.geo(), stdMat({ vertexColors: true, roughness: 0.38 }), doorG, false); }
    const cavTex = canvasTex(520, 48, (g, w, h) => { for (let i = 0; i < 52; i++) { g.fillStyle = [K.lapis, K.turq, K.gold][i % 3]; g.fillRect((i / 52) * w, 0, w / 52 + 1, h); g.fillStyle = "rgba(255,240,184,0.25)"; g.fillRect((i / 52) * w, 0, 2, h); } g.fillStyle = K.gold; g.fillRect(0, h * 0.9, w, h * 0.1); g.fillRect(0, 0, w, h * 0.05); }, "cavetto");
    { const cg = surf(1, 10, (u, v) => { const a = v * Math.PI / 2; return [(u - 0.5) * 5.2, 7.12 + 0.48 * v, -9 + 0.3 * (1 - Math.cos(a))]; }); const cm = paintMat(cavTex, { side: THREE.DoubleSide }); reg(cm); M(cg, cm, doorG); }
    const studG = buildStud(), studM = stdMat({ color: K.gold, roughness: 0.3, metalness: 0.2 }), shoeM = stdMat({ color: K.goldD, roughness: 0.4, metalness: 0.3 });
    for (const side of [0, 1]) {
      const hinge = grp(doorG); hinge.position.set(side ? 2.2 : -2.2, 3.2, -8.91);
      const tex = paintLeaf(side, 11 + side * 17), texB = flipTex(tex), faceM = stdMat({ map: tex, roughness: 0.34 }), backM = stdMat({ map: texB, roughness: 0.34 }), edgeM = stdMat({ color: K.gold, roughness: 0.4 });
      const lf = M(new THREE.BoxGeometry(2.2, 6.4, 0.18), [edgeM, edgeM, edgeM, edgeM, faceM, backM], hinge, false); lf.position.x = side ? -1.1 : 1.1;
      const studs = new THREE.InstancedMesh(studG, studM, 4 * 22 * 2), d = new THREE.Object3D(); let n = 0;
      for (const [a, b] of RAILS) for (let q = 0; q < 22; q++) for (const fz of [1, -1]) { d.position.set(-1.05 + q * (2.1 / 21), (a + b) / 2 - 3.2, fz * 0.09); d.rotation.set(0, fz > 0 ? 0 : Math.PI, 0); d.updateMatrix(); studs.setMatrixAt(n++, d.matrix); }
      studs.userData.solid = false; lf.add(studs);
      for (const yy of [-3.2 + 0.06, 3.2 - 0.06]) { const sh = M(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 14), shoeM, hinge, false); sh.position.set(0, yy, 0); }
      leaves.push({ hinge, side });
    }
    // the door sun: 5 ray cards (0.14), a floor wedge 4.4 m wide reaching z -1, scaled by `doors`
    const rTex = rayTex(), rays = [];
    for (let i = 0; i < 5; i++) { const x = -1.8 + i * 0.9, len = Math.hypot(8, 5.4), pg = new THREE.PlaneGeometry(0.3 + 0.12 * hh(i * 3.3), len); pg.translate(0, -len / 2, 0); const o = steamy(new THREE.Mesh(pg, softMat({ map: rTex, color: "#ffe08a", opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 3); o.position.set(x, 5.6, -8.9); o.rotation.x = -Math.atan2(8, 5.4) + Math.PI; o.lookAt(x * 0.6, 0, -1); doorG.add(o); rays.push(o); }
    const wedge = steamy(new THREE.Mesh(surf(1, 8, (u, v) => [(u - 0.5) * lerp(4.4, 3.0, v), 0.008, lerp(-9, -1, v)], (u, v) => [u, 1 - v]), softMat({ map: canvasTex(8, 64, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.7, "rgba(255,255,255,0.5)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "wedge", 1), color: "#ffe9b0", opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 2); doorG.add(wedge);

    // ---------------------------------------------------------------- the field of reeds: step and path, 90 stems, 4 ribbons of wheat, the river, hills and sky
    const fieldG = grp(), fbasic = (o) => { const m = noLine(new THREE.MeshBasicMaterial({ toneMapped: false, fog: false, ...o })); return m; };
    const fplane = (w, h, mat, x, y, z, rx = -Math.PI / 2) => { const o = M(new THREE.PlaneGeometry(w, h), mat, fieldG); o.rotation.x = rx; o.position.set(x, y, z); return o; };
    fplane(160, 6.4, fbasic({ color: "#b98f32" }), 0, 0.001, -12.8);
    { const pt = canvasTex(330, 495, (g, w, h) => { g.fillStyle = K.colLit; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = rgba("#a98a55", 0.25); g.fillRect(hh(i) * w, hh(i * 2.7) * h, 3 + 6 * hh(i * 5), 1.5); } for (let i = 0; i < 30; i++) { const x = 14 + hh(i * 3.7) * (w - 28), y = 14 + hh(i * 7.1) * (h - 28), r = 3 + 5 * hh(i * 11.3); g.beginPath(); g.ellipse(x, y, r, r * 0.7, hh(i) * 3, 0, TAU); g.fillStyle = pick(["#a98a55", "#c9b890", "#8a7048", "#e9d9b0"], hh(i * 13) * 4); g.fill(); g.strokeStyle = "rgba(60,40,20,0.6)"; g.lineWidth = 1; g.stroke(); } }, "path"); fplane(2.2, 3.3, fbasic({ map: pt }), 0, 0.006, -11.35); }
    const stems = []; for (let i = 0; i < 90; i++) { const left = i % 2 === 0, x = (left ? -1 : 1) * (1.35 + 5.5 * hh(i * 5.3 + 1)), z = -10 - 6 * hh(i * 7.9 + 3), hh_ = 1.5 + 0.6 * hh(i * 3.9), sg = new THREE.PlaneGeometry(0.42, 2.1); sg.translate(0, 1.05, 0); const o = M(sg, noLine(new THREE.MeshBasicMaterial({ map: paintStem(i), alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false, fog: false })), fieldG); o.position.set(x, 0, z); o.scale.set(1, hh_ / 2.1, 1); stems.push({ o, ph: TAU * hh(i * 11.7), x, z }); }
    const ribbons = []; for (let r = 0; r < 4; r++) { const z0 = -16 - r * 6, tex = paintWheatRibbon(r); fplane(140, 6.2, fbasic({ map: tex }), 0, 0.85 + 0.002 * r, z0 - 3); const wt = paintWave(r); wt.wrapS = THREE.RepeatWrapping; wt.repeat.x = 2; const wm = softMat({ map: wt, color: "#fff8c8", opacity: 0.55 }); fplane(140, 6.2, wm, 0, 0.862 + 0.002 * r, z0 - 3); ribbons.push({ wt, r }); }
    fplane(260, 100, fbasic({ color: "#93b856" }), 0, -0.02, -90);
    fplane(260, 8, fbasic({ color: "#c9a13a" }), 0, 0.0, -42);
    { const xc = (z) => 9 * Math.sin(((-z - 40) / 30) * Math.PI * 1.25 + 0.3), wd = (z) => 6 + 8 * ((-z - 40) / 30);
      const rv = surf(1, 30, (u, v) => { const z = -40 - 30 * v; return [xc(z) + (u - 0.5) * wd(z), 0.03, z]; }); M(rv, fbasic({ color: "#3f8fd0", side: THREE.DoubleSide }), fieldG);
      for (const s of [-1, 1]) { const bk = surf(1, 30, (u, v) => { const z = -40 - 30 * v, e = xc(z) + s * wd(z) / 2; return [e + s * (u * 3.0), 0.025, z]; }); M(bk, fbasic({ color: "#7fae4a", side: THREE.DoubleSide }), fieldG); }
      for (let i = 0; i < 12; i++) { const z = -42 - 26 * hh(i * 3.7), x = xc(z) + (hh(i * 5.9) - 0.5) * wd(z) * 0.7, g_ = new THREE.PlaneGeometry(0.9 + 1.6 * hh(i * 2.1), 0.08 + 0.1 * hh(i)); const o = M(g_, fbasic({ color: "#9fd4f5" }), fieldG); o.rotation.x = -Math.PI / 2; o.position.set(x, 0.04, z); }
      for (let i = 0; i < 9; i++) { const z = -42 - 25 * (i / 8) - 1.5 * hh(i), s = i % 2 ? 1 : -1, x = xc(z) + s * (wd(z) / 2 + 1.5 + 2 * hh(i * 4.3)), ht = 3 + 2 * hh(i * 6.1), pg = new THREE.PlaneGeometry(ht * 0.67, ht); pg.translate(0, ht / 2, 0); const o = M(pg, noLine(new THREE.MeshBasicMaterial({ map: paintPalm(i), alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false, fog: false })), fieldG); o.position.set(x, 0, z); }
      const bt = [0, 1].map((fl) => canvasTex(128, 64, (g, w, h) => { g.save(); g.setTransform(300, 0, 0, -300, 0.3 * 128 / 1.0 * 1.0, h * 0.5); g.scale(1, 1); birdP(g, 0.1, 0.0, 1.0, fl, "#ffffff", 0); g.restore(); }, `bird${fl}`, 1));
      var birds = [0, 1].map((i) => { const mat = noLine(new THREE.MeshBasicMaterial({ map: bt[0], transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false, depthWrite: false })), o = M(new THREE.PlaneGeometry(0.8, 0.4), mat, fieldG); return { o, mat, bt, i }; }); }
    { const hc = canvasTex(1024, 256, (g, w, h) => { for (const [col, base, amp, ph] of [["#c9bfd6", 0.62, 0.22, 1.3], ["#a79ac0", 0.45, 0.2, 0.2]]) { g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (1 - (base + amp * (0.5 + 0.35 * Math.sin(x * 0.011 + ph) + 0.2 * Math.sin(x * 0.027 + ph * 2) + 0.1 * Math.sin(x * 0.07 + ph * 3))))); g.lineTo(w, h); g.closePath(); g.fillStyle = col; g.fill(); } }, "hills"); const o = M(new THREE.PlaneGeometry(420, 42), noLine(new THREE.MeshBasicMaterial({ map: hc, transparent: true, toneMapped: false, fog: false })), fieldG); o.position.set(0, 21, -120); }
    { const sk = canvasTex(1024, 512, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "#6fb4ea"); q.addColorStop(1, "#d9efff"); g.fillStyle = q; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { const cx = 120 + i * 190 + 40 * hh(i), cy = h * (0.35 + 0.35 * hh(i * 3.1)); for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(cx + (k - 2.5) * 34, cy + 6 * Math.sin(k * 1.7), 52 - 4 * Math.abs(k - 2.5) * 2, 28 - 3 * Math.abs(k - 2.5), 0, 0, TAU); g.fillStyle = k % 2 ? "#ffffff" : "#dfe8f2"; g.fill(); } } }, "sky"); const o = M(new THREE.PlaneGeometry(900, 360), fbasic({ map: sk }), fieldG); o.position.set(0, 80, -150); }
    for (const o of fieldG.children) { o.userData.solid = false; o.castShadow = false; }

    // ---------------------------------------------------------------- state
    const g0 = (ps, k, d) => { const v = ps[k] ?? S[k]; return v == null ? d : v; };
    const tmpD = new THREE.Object3D(), tmpC = new THREE.Color();
    return {
      grip: 0,
      apply(ps, t) {
        const doors = clamp(g0(ps, "doors", 0)), torch = clamp(g0(ps, "torch", 1)), tense = clamp(g0(ps, "tense", 0)), rowL = clamp(g0(ps, "rowLight", 0.6));
        const dimK = 1 - 0.4 * tense; for (const e of dim) e.m.color.copy(e.c).multiplyScalar(dimK);
        // judges: the far row sits in the baked dark; the left row of torches from z +9 lights it up (rowLight 0.2 -> 1)
        const lit = clamp((rowL - 0.2) / 0.8);
        for (const j of judges) {
          const f = (dk(j.z) + lit * 0.55 * (1 - dk(j.z))) * dimK; tmpC.setRGB(f, f, f); j.vm.color.copy(tmpC); j.lm.color.copy(tmpC); j.sm.color.copy(tmpC);
          const ff = (0.28 + 0.72 * f); j.fm.color.setRGB(ff, ff, ff * 0.97);
          j.bg.position.y = 0.01 * Math.sin(TAU * 0.3 * t + j.ph); j.fg.rotation.z = j.lean + 4 * DEG * Math.sin(TAU * 0.4 * (t - 0.15) + j.ph2);
        }
        // doors
        const ang = doors * 105 * DEG; for (const l of leaves) l.hinge.rotation.y = l.side ? ang : -ang;
        fieldG.visible = doors > 0.002;
        const sunK = doors; sun.intensity = 90 * sunK; for (const r of rays) r.material.opacity = 0.14 * sunK; wedge.material.opacity = 0.28 * sunK;
        placeMotes(dustA, t, torch); placeMotes(dustB, t, doors);
        rim.intensity = 1.1 * tense;
        // flames
        const depth = 1 + 0.8 * tense, fr = Math.floor(t * 8);
        for (const f of flames) {
          const row = f.row ? 0.35 + 0.65 * rowL : 1, vis = torch * row, fl = 1 + depth * 0.10 * Math.sin(TAU * 1.3 * t + f.a) + depth * 0.06 * Math.sin(TAU * 3.7 * t + f.b), show = vis > 0.004;
          f.group.visible = show; f.glow.visible = show; f.fp.visible = show; if (f.wp) f.wp.visible = show; f.sk.visible = show;
          const lean = f.draught ? 15 * DEG * doors : 0;
          f.mat.map = flameTex[(fr + f.i) % 3]; const sc = (0.55 + 0.45 * vis) * (0.94 + 0.06 * fl); f.group.scale.set(sc, sc * (0.95 + 0.08 * fl), sc);
          f.group.rotation.set(lean + 6 * DEG * 0.5 * Math.sin(TAU * 0.7 * t + f.sway + 1), 0, 6 * DEG * Math.sin(TAU * 0.6 * t + f.sway));
          const k = vis * fl; f.glow.material.opacity = clamp(0.35 * k, 0, 0.6);
          const pk = (0.3 + 0.7 * dk(f.z)) * k; f.fp.material.opacity = clamp(0.30 * pk, 0, 0.6); if (f.wp) f.wp.material.opacity = clamp(0.30 * pk, 0, 0.6); f.sk.material.opacity = clamp(0.30 * k * (0.3 + 0.7 * dk(f.z)), 0, 0.6);
          // smoke: a ribbon from the flame tip, 0.35 -> 0 opacity over 1.6 m, widening 0.08 -> 0.35, 3 curls (puffs on a helix, a function of t)
          const tipY = f.rim + f.h * 0.9 * sc;
          for (let q = 0; q < 8; q++) {
            const s = (((q / 8) + 0.55 * t * (0.9 + 0.2 * hh(f.i)) + hh(f.i * 5.3)) % 1 + 1) % 1, sp = f.smoke[q], ang = TAU * 3 * s + f.a;
            sp.position.set(f.x + 0.09 * s * Math.sin(ang), tipY + 1.6 * s, f.z + 0.09 * s * Math.cos(ang) + Math.tan(lean) * 1.6 * s * (lean > 0 ? 1 : 0)); sp.scale.setScalar(0.08 + 0.27 * s); sp.visible = show; sp.material.opacity = 0.35 * (1 - s) * sm(s * 5) * clamp(vis * 1.4);
          }
          // 12 embers on the rim
          for (let e = 0; e < 12; e++) { const a = (e / 12) * TAU + f.a, r = f.kind === "torch" ? 0.19 : f.kind === "scale" ? 0.29 : 0.37, pulse = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(TAU * (1.1 + 0.9 * hh(f.i * 31 + e)) * t + e * 1.7)); tmpD.position.set(f.x + r * Math.cos(a), f.rim + 0.004, f.z + r * Math.sin(a)); tmpD.scale.setScalar(show ? pulse : 0.0001); tmpD.updateMatrix(); embers.setMatrixAt(f.i * 12 + e, tmpD.matrix); }
        }
        embers.instanceMatrix.needsUpdate = true;
        sparkList.forEach((s, n) => { const f = flames[s.f], vis = torch * (f.row ? 0.35 + 0.65 * rowL : 1), ph = (((t * s.rate + s.ph) % 1) + 1) % 1, rise = 0.6 * (1 - (1 - ph) * (1 - ph)); tmpD.position.set(f.x + s.dx * ph * 0.5 + 0.03 * Math.sin(s.sw + 5 * ph), f.rim + f.h * 0.5 + rise, f.z + s.dz * ph * 0.5 + 0.03 * Math.cos(s.sw + 5 * ph)); tmpD.scale.setScalar(vis > 0.004 ? Math.pow(1 - ph, 0.7) + 0.0001 : 0.0001); tmpD.updateMatrix(); sparks.setMatrixAt(n, tmpD.matrix); });
        sparks.instanceMatrix.needsUpdate = true;
        // real lights follow their flames
        lights.forEach((l, i) => { const f = flames[lightOf[i]], row = f.row ? 0.35 + 0.65 * rowL : 1, fl = 1 + depth * 0.10 * Math.sin(TAU * 1.3 * t + f.a) + depth * 0.06 * Math.sin(TAU * 3.7 * t + f.b); l.intensity = 12 * torch * row * fl; });
        // columns take the warmth of the torches beside them
        for (const c of colEmissive) { let s = 0, n = 0; for (const j of [c.k - 1, c.k]) { if (j < 0 || j > 10) continue; const f = flames[(c.side < 0 ? 0 : 11) + j], row = f.row ? 0.35 + 0.65 * rowL : 1; s += (1 + depth * 0.10 * Math.sin(TAU * 1.3 * t + f.a) + depth * 0.06 * Math.sin(TAU * 3.7 * t + f.b)) * row * (0.3 + 0.7 * dk(c.z)); n++; } c.mat.emissiveIntensity = 0.16 * torch * (s / Math.max(1, n)); }
        // the field: stems sway 4 degrees at 0.4 Hz, wheat waves cross every 5 s, birds
        if (fieldG.visible) {
          for (const s of stems) { s.o.rotation.z = 4 * DEG * Math.sin(TAU * 0.4 * t + s.ph); s.o.rotation.x = 1.5 * DEG * Math.sin(TAU * 0.4 * t + s.ph * 1.7); }
          for (const r of ribbons) r.wt.offset.x = -(t / 5 + r.r * 0.13) % 1;
          for (const b of birds) { const u = (t * 0.045 + b.i * 0.5) % 1; b.o.position.set(-12 + 24 * u, 2.0 + 0.4 * Math.sin(t * 1.3 + b.i * 2) + b.i * 0.6, -55 - b.i * 6); b.mat.map = b.bt[Math.floor(t * 4 + b.i) % 2]; }
        }
      },
    };
  },
};
