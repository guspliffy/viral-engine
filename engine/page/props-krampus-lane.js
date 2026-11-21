// KRAMPUS MYTH 01 "One night a year he checks your boots": look A, the LANE (storyboards/series/krampus-myth/01-boots/DESIGN.md section A).
// USAGE
//   kind        krampuslane   (one prop: the whole lane; nothing in it is held in a hand, KRAMPUS_LANE_GRIPS is empty)
//   ORIGIN      door 4's apron at y 0, on the house front (z 0), x 0. Metres, x right, y up, +z toward the camera.
//               Up the lane is -x, the houses stand on the -z side, the dry-stone wall and the meadow on the +z side.
//   MARKS       house k: door x = -7.6 (k - 4), apron y = 0.8 (k - 4) (door 9 at x -38, y +4.0; door 1 at x +22.8, y -2.4).
//               lane z 1.9..5.5 (centre 3.7); landings 0.16 under each apron, ramps at 20 %, the slope goes on past the village.
//               wall z 5.5..5.9 (gaps: fountain bay x -2.6..0.6, stile x 9.4..10.6); fountain at x -1.0, z 6.5.
//               lanterns: door x + 0.8 (doors 7, 5, 4, 2) or - 0.8 (9, 8, 6, 3, 1), 1.58 above the apron.
//               woodpile at door 4: x +2.80..+4.30, z +0.05..+1.01, 1.15 high; hollow opening 0.66 x 0.66 (x 2.80 end, the -x face),
//               floor y 0..0.66 under 2 planks; peep gap x 3.20 (y 0.30..0.48, 0.20 wide); cat gap x 3.82 (y 0..0.22, 0.24 wide).
//               9 loose logs at x 2.52..2.70, z 0.18..0.80 (Chip's trainer mark and the cat gap are the staging's, not drawn here).
//   SIZE        the village runs x -38 .. +23 (61 m), the lane bends into the firs from x -44, the lower village x +27..+90.
//               Set `far` of the storyboard to 300 or more (the sky dome is 255 m, the peak ring 240 m): bench uses 320.
//               The sky and the peak ring follow the camera; the key light of the set stays the clip's (the bench takes a cool key).
//   SPEC KEYS (all optional; a prop(...) call sets them over time, the defaults are KRAMPUS_LANE_STATE.krampuslane)
//     visited 10    boots filled at doors >= visited (10 = none filled), and the sledge/hoof tracks reach door `visited`
//     lit 4         the door whose lantern gets the real warm PointLight (1..9, fractions slide between doors); the neighbour kids
//                   at doors 5 and 7 drop below the sill while `lit` is their door
//     door4 0       door 4's leaf swings in 0..1 (80 degrees); the hall light, the doorway glow and the wedge follow
//     snowfall 0    0..1 of 60 / 140 / 300 flakes around the camera (drawn only when > 0)
//     shake 0       0..3: each whole number breaks a slab 1.6 x 0.5 x 0.2 off the eave of house `shakeAt` as 14 lumps and powder,
//                   it falls 3.6 m and lands as a heap (3 lobes after 3 shakes); 2 icicles drop with the first
//     shakeAt 5     the house whose eave breaks (read at build time, so set it in the first prop(...) call)
//     trickle 0.3   the fountain's thread of water and its ripple, 0..1
//     smoke 1       chimney smoke, 0..3 (14 puffs per chimney)
//     tense 0       0..1: lanterns dim 30 %, flicker deeper, a cold rim light comes up
//     kidsUp -1     -1 = the kids follow `lit`; 0..1 forces them down..up
//   COUNTS (DESIGN section 9 row A): per house 40 balusters, 5 brackets, 11 rafter tails, 33 fascia scallops, 38 icicles,
//     22 nails; 9 plaques counting 9..1, 9 lanterns, 14 lit windows, 9 chimneys, 132 log ends in the pile, 9 loose logs,
//     13 lane boots, the fountain's 29 icicles and 3 rosettes, 420 stars. KRAMPUS_LANE_COUNTS holds what the builders drew.
//   REAL LIGHTS (5): door 4's lantern, the `lit` lantern, a snow bounce at (0.6, 0.35, 2.6), the hall (scaled by door4), a cold rim (tense).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { SNOW_KINDS } from "./props-survive-snow.js";
import { firGeometry } from "./set-snowslope.js";

// ---------------------------------------------------------------------------------------------------------------------
// helpers: hashes, colours, canvases, baked geometry. Nothing random, nothing on a clock: every mark comes from an index.
// ---------------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const H3 = (a, b, c) => hh(a * 17.13 + b * 91.7 + c * 51.3 + 7.7);
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const rgba = (c, a) => { const A = hexA(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
const vn = (x, y, z, s, sd) => {   // smooth value noise
  x *= s; y *= s; z *= s; const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const f = (a, b, c) => H3(ix + a + sd * 13, iy + b, iz + c);
  const l = (a, b, t) => a + (b - a) * t, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  return l(l(l(f(0, 0, 0), f(1, 0, 0), u), l(f(0, 1, 0), f(1, 1, 0), u), v), l(l(f(0, 0, 1), f(1, 0, 1), u), l(f(0, 1, 1), f(1, 1, 1), u), v), w);
};

// the shared palette (DESIGN, top)
const K = {
  sky0: "#0e1630", sky1: "#24376b", star: "#e9eefc",
  snow: "#cfdcf2", snowS: "#7f95c4", snowD: "#4a5f96", snowL: "#ffffff", snowW: "#ffd9a0",
  wood: "#6a4528", woodB: "#3a2a1e", woodS: "#3c2616", woodBS: "#1f1610", woodLit: "#a87242", repair: "#b98a52",
  stone: "#8a8d96", stoneS: "#565a66", stoneL: "#b9bcc6",
  flame: "#ffb45a", win: "#ffc766", flameS: "#ff9a3a", core: "#fff0c0", pool: "#ffcf8a",
  iron: "#1f2126", ironS: "#101114", ironL: "#5a6270", rust: "#6a3a22",
  brass: "#c79a3a", brassS: "#7a5a1c", brassL: "#ffe9a0",
  cream: "#d9d2c0", lime: "#cfc5ae", line: "#1a120c",
  fir: "#2f6a52", firS: "#1d4636", ice: "#d7eefb", ice2: "#b9d6e8", iceE: "#7fb6dc",
  red: "#a3232b", teal: "#2f8f8a", yellow: "#f2b824", birch: "#ece6d8", birchD: "#3a2e26",
};

function canvasTex(w, h, draw, name = "", aniso = 8) {
  const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, Math.round(h));
  const g = cv.getContext("2d"); draw(g, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name;
  return t;
}
// a texture painted in METRES: the canvas covers wm x hm metres at ppm pixels per metre, y up, origin lower left
function mtex(wm, hm, ppm, fn, name = "", aniso = 8) {
  return canvasTex(wm * ppm, hm * ppm, (g, w, h) => { g.setTransform(w / wm, 0, 0, -h / hm, 0, h); g.lineJoin = "round"; g.lineCap = "round"; fn(g, wm, hm); }, name, aniso);
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const paintMat = (map, o = {}) => noLine(new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false, ...o }));
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, ...o }); m.userData.noHatch = true; return m; };
const radialTex = (stops, n = 128) => canvasTex(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);
const steamy = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };

// ---- geometry ------------------------------------------------------------------------------------------------------
const V3 = THREE.Vector3;
const place = (geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
  const m = new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new V3(sx, sy, sz)); geo.applyMatrix4(m); return geo;
};
const boxG = (w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => place(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz);
function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; pos.push(...f(u, v)); uv.push(...(uvf ? uvf(u, v) : [u, v])); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
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
const arcPts = (cx, cy, r, a0, a1, n = 10, z = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * DEG; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; });
function lathe(prof, seg = 16) { const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.deleteAttribute("uv"); g.computeVertexNormals(); return g; }
// a flat plate from an outline [[x, y]...] extruded `d` deep (front face at z = 0, back at -d), uv = (x, y) / uvs
function plate(pts, d, bevel = 0, uvs = 1, steps = 1) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps, curveSegments: 6 });
  g.translate(0, 0, -d); if (uvs !== 1) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / uvs, uv.getY(i) / uvs); } return g;
}

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
  get n() { return this.list.length; }
  geo() { return this.list.length ? mergeGeometries(this.list) : new THREE.BufferGeometry(); }
}
// the colour of a snow face: lit crown, shade on the sides, the deep tone in the shade line under a lip (n = unit normal)
function snowCol(nx, ny, nz, y = 0, jit = 0) {
  const up = clamp(ny * 0.5 + 0.5 + jit), c = cmix(K.snowS, K.snow, sm((up - 0.45) / 0.45));
  return ny < -0.25 ? cmix(K.snowD, K.snowS, clamp(1 + ny * 1.2)) : c;
}
// a lofted snow cap along x: cross-section (z, y) points for each x, thickness taper at both ends. prof(u, x) -> [[z, y]...] same length; caps: close both ends
function loftX(x0, x1, nu, prof, nvp, caps = false) {
  const pos = [], idx = [], m = nvp;
  for (let i = 0; i <= nu; i++) { const x = lerp(x0, x1, i / nu), p = prof(i / nu, x); for (const [z, y] of p) pos.push(x, y, z); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + 1, c = a + m, d = c + 1; idx.push(a, b, c, b, d, c); }
  if (caps) for (const [i, flip] of [[0, true], [nu, false]]) {
    let cy = 0, cz = 0; for (let j = 0; j < m; j++) { cy += pos[(i * m + j) * 3 + 1] / m; cz += pos[(i * m + j) * 3 + 2] / m; }
    const base = pos.length / 3; for (let j = 0; j < m; j++) pos.push(pos[(i * m + j) * 3], pos[(i * m + j) * 3 + 1], pos[(i * m + j) * 3 + 2]); pos.push(lerp(x0, x1, i / nu), cy, cz);
    for (let j = 0; j < m - 1; j++) { if (flip) idx.push(base + m, base + j + 1, base + j); else idx.push(base + m, base + j, base + j + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a rounded snow cap profile (z, y): base from z0 to z1 at y0, depth d, a lip of radius 0.4 d overhanging 0.15 d at the front (+z), a shade
// line under it; k scales the height (0 = flat on the base, the tapered ends); always CAPN points
function capProfile(z0, z1, y0, d, k = 1, ov = 0.15) {
  const r = 0.4 * d, o = ov * d, top = y0 + d * k, cz = z1 + o - r, cy = top - r * k, pts = [[z0, y0]];
  for (let i = 1; i <= 3; i++) { const t = i / 4; pts.push([z0 + (z1 - z0) * 0.22 * t, y0 + (top - y0) * Math.sin(t * Math.PI / 2) * 0.93]); }
  pts.push([lerp(z0, z1, 0.45), top], [lerp(z0, z1, 0.7), top]);
  for (let i = 0; i <= 8; i++) { const a = (90 - i * (150 / 8)) * DEG; pts.push([cz + r * Math.cos(a), cy + r * Math.sin(a) * (k > 0.02 ? 1 : 0)]); }
  pts.push([cz + 0.12 * r, Math.max(y0, cy - r)], [z1 - 0.04, y0]);
  return pts;
}
const CAPN = capProfile(0, 1, 0, 1).length;

// ---------------------------------------------------------------------------------------------------------------------
// THE PLAN (frozen: DESIGN section A). x right (up the lane = -x), y up, z toward the default camera.
// ---------------------------------------------------------------------------------------------------------------------
const DX = 7.6, DY = 0.8;
const xk = (k) => -DX * (k - 4), Yk = (k) => DY * (k - 4);
// the lane surface height (landings level 0.16 under each apron, ramps 20 %, beyond the village the slope runs on)
function laneY(x) {
  if (x < xk(9) - 1.8) return Yk(9) - 0.16 + 0.2 * (xk(9) - 1.8 - x);
  if (x > xk(1) + 1.8) { const d = x - (xk(1) + 1.8); return Yk(1) - 0.16 - 0.2 * Math.min(d, 2.4) - 0.35 * Math.max(0, d - 2.4); }
  const k = Math.max(1, Math.min(9, Math.round(-x / DX + 4))), d = x - xk(k);
  return Math.abs(d) <= 1.8 ? Yk(k) - 0.16 : Yk(k) - 0.16 - 0.2 * Math.sign(d) * (Math.abs(d) - 1.8);
}
const LANE_Z0 = 1.9, LANE_Z1 = 5.5;
const CNT = {};   // what the builders drew, by name (a count check: node harness / the bench)
const cnt = (name, n = 1) => { CNT[name] = (CNT[name] || 0) + n; };

// ---------------------------------------------------------------------------------------------------------------------
// THE HOUSE TABLE (DESIGN A, "house kit" and the nine-row table)
// ---------------------------------------------------------------------------------------------------------------------
const HT = {
  9: { pl: "edelweiss", floor: "plaster", vine: true, shut: "#3f6a4a", fl: "tulip", cut: "heart", lant: -0.8, win: "arch", up: [1, 0], spec: "ring+sledge" },
  8: { pl: "sun", floor: "timber", shut: "#4a6078", fl: "starflower", cut: "tulip", lant: -0.8, win: "star", up: [0, 0], spec: "bench+skis" },
  7: { pl: "star", floor: "timber", shut: "#7a2a22", fl: "diamond", cut: "pine", lant: 0.8, win: "cyclamen", up: [1, 0], spec: "antlers" },
  6: { pl: "snowflake", floor: "plaster", scrolls: true, shut: "#3f6a4a", fl: "tulip", cut: "circle", lant: -0.8, win: "jars", up: [1, 0], spec: "haysledge+churn" },
  5: { pl: "gentian", floor: "timber", shut: "#b98a2e", fl: "vine", cut: "heart", lant: 0.8, win: "kid", up: [0, 0], spec: "wreath+shovel" },
  4: { pl: "pine", floor: "timber", vine: true, shut: "#2f5a44", fl: "tulip", cut: "pine", shutCut: "heart", lant: 0.8, win: "arch", up: [1, 0], spec: "pile" },
  3: { pl: "clover", floor: "timber", shut: "#4a6078", fl: "starflower", cut: "star", lant: -0.8, win: "books", up: [0, 0], spec: "snowman" },
  2: { pl: "cherries", floor: "plaster", shut: "#7a2a22", fl: "diamond", cut: "heart", lant: 0.8, win: "star", up: [1, 0], spec: "handcart" },
  1: { pl: "moon", floor: "timber", shut: "#3f6a4a", fl: "tulip", cut: "tulip", lant: -0.8, win: "firjug", up: [0, 0], spec: "trough" },
};

// ---------------------------------------------------------------------------------------------------------------------
// 2D painters (metres, y up, flat colours inside a dark line; every mark is drawn once from its index)
// ---------------------------------------------------------------------------------------------------------------------
const ellP = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
const polyP = (g, pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };
const fillP = (g, fill, lw = 0, col = K.line) => { if (fill) { g.fillStyle = fill; g.fill(); } if (lw > 0) { g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } };
const lineP = (g, pts, lw, col) => { polyP(g, pts, false); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
const smoothP = (g, pts, close = true) => {
  const n = pts.length; g.beginPath();
  if (close) { const m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2]; g.moveTo(...m(n - 1)); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i)); g.closePath(); }
  else { g.moveTo(...pts[0]); for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(...pts[n - 1]); }
};
const withT = (g, x, y, rot, sx, sy, fn) => { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy); fn(); g.restore(); };

// timber grain on a rect: n lines (5-9), slightly wavy, a few knots (1 per 0.8 m), drying checks
function grain(g, x0, y0, w, h, seed, base, o = {}) {
  const n = o.lines ?? (5 + Math.floor(hh(seed * 3.1) * 5)), horiz = o.horiz ?? true;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5 + (hh(seed + i * 7.3) - 0.5) * 0.6) / n, amp = 0.004 + 0.006 * hh(seed + i * 5.1), ph = hh(seed + i * 2.3) * 6;
    g.beginPath();
    for (let s = 0; s <= 24; s++) { const u = s / 24, wob = Math.sin(u * 5 + ph) * amp + Math.sin(u * 13 + ph * 2) * amp * 0.4; const x = horiz ? x0 + u * w : x0 + t * w + wob, y = horiz ? y0 + t * h + wob : y0 + u * h; s ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = cmul(base, 0.62 + 0.2 * hh(seed + i)); g.globalAlpha = 0.5 + 0.35 * hh(seed + i * 9.1); g.lineWidth = 0.0035 + 0.003 * hh(seed + i * 4.7); g.stroke();
  }
  g.globalAlpha = 1;
}
function knot(g, x, y, r, base, horiz = true) {
  withT(g, x, y, 0, horiz ? 1.35 : 0.75, horiz ? 0.8 : 1.3, () => {
    ellP(g, 0, 0, r, r); g.fillStyle = cmul(base, 0.5); g.fill();
    for (const q of [0.66, 0.34]) { ellP(g, 0, 0, r * q, r * q); g.strokeStyle = cmul(base, 0.32); g.lineWidth = r * 0.14; g.stroke(); }
    ellP(g, -r * 0.1, r * 0.12, r * 1.25, r * 1.25); g.strokeStyle = rgba(cmul(base, 0.45), 0.6); g.lineWidth = r * 0.12; g.stroke();
  });
}

// ---- the ground-floor wall of a house: 6.6 x 1.9 m (x -2.6..4.0, y 0.40..2.30): 9 squared logs of 0.21 with lime chinking, or plaster
function paintGround(k, T) {
  return mtex(6.6, 1.9, 150, (g, W, H) => {
    if (T.floor === "plaster") {
      g.fillStyle = K.cream; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { const x = H2(k, i) * W, y = H2(k + 30, i) * H, r = 0.05 + 0.18 * H2(k + 60, i); const q = g.createRadialGradient(x, y, 0, x, y, r); const c = i % 3 ? "#b9b29c" : "#ece6d4"; q.addColorStop(0, rgba(c, 0.32)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
      const q = g.createLinearGradient(0, 0, 0, 0.5); q.addColorStop(0, rgba("#8a7f6a", 0.55)); q.addColorStop(1, rgba("#8a7f6a", 0)); g.fillStyle = q; g.fillRect(0, 0, W, 0.5);   // the splash band
      for (let i = 0; i < 3; i++) { const x = 0.6 + H2(k, i + 80) * 5.2, y = 0.15 + H2(k, i + 90) * 1.3; polyP(g, Array.from({ length: 7 }, (_, j) => [x + (0.07 + 0.05 * H2(i, j + k)) * Math.cos(j / 7 * TAU), y + (0.05 + 0.04 * H2(j, i + k)) * Math.sin(j / 7 * TAU)])); fillP(g, K.wood, 0.004, K.woodS); }   // 3 chips: the timber shows
      for (let i = 0; i < 5; i++) { const x = 0.3 + H2(k, i + 100) * 6, y = 0.3 + H2(k, i + 110) * 1.4; g.beginPath(); g.moveTo(x, y); let px = x, py = y; for (let s = 0; s < 6; s++) { px += (H2(i, s + k) - 0.5) * 0.08; py -= 0.05 + 0.06 * H2(s, i + k); g.lineTo(px, py); } g.strokeStyle = rgba("#6f6652", 0.7); g.lineWidth = 0.003; g.stroke(); }
      if (T.scrolls) {   // ochre scrolls round the window (window centre x 1.05, sill 0.55, top 1.45 in this picture)
        const oc = "#c88a3a", od = "#8a5a22";
        for (const [cy, dir] of [[1.62, 1], [0.34, -1]]) for (let s = 0; s < 6; s++) {
          const cx = 0.5 + s * 0.22, a = (s % 2 ? 1 : -1);
          g.beginPath(); for (let u = 0; u <= 16; u++) { const t = u / 16, r = 0.02 + 0.05 * (1 - t), an = t * 4.2 * a + 1.2; const x = cx + Math.cos(an) * r * 1.8 + t * 0.0, y = cy + dir * (Math.sin(an) * r + 0.0); u ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = od; g.lineWidth = 0.014; g.stroke(); g.strokeStyle = oc; g.lineWidth = 0.008; g.stroke();
        }
        lineP(g, [[0.44, 1.56], [1.68, 1.56]], 0.01, oc); lineP(g, [[0.44, 0.4], [1.68, 0.4]], 0.01, oc);
      }
      return;
    }
    for (let c = 0; c < 9; c++) {
      const y0 = c * 0.21, tone = 0.88 + 0.28 * H2(k, c), base = cmul(K.wood, tone);
      g.fillStyle = base; g.fillRect(0, y0, W, 0.21);
      const q = g.createLinearGradient(0, y0, 0, y0 + 0.21); q.addColorStop(0, rgba("#1a0e06", 0.5)); q.addColorStop(0.18, rgba("#1a0e06", 0.1)); q.addColorStop(0.7, rgba("#f0c890", 0.1)); q.addColorStop(1, rgba("#1a0e06", 0.0)); g.fillStyle = q; g.fillRect(0, y0, W, 0.21);   // a round-backed log: dark at the bottom joint, a light belly
      grain(g, 0, y0 + 0.02, W, 0.17, k * 41 + c * 3.7, base);
      for (let i = 0; i < 8; i++) knot(g, (i + 0.15 + 0.7 * H2(k * 7 + c, i)) * 0.8, y0 + 0.04 + 0.13 * H2(k + c, i + 20), 0.012 + 0.012 * H2(c, i + k), base);   // 1 knot per 0.8 m
      for (let i = 0; i < 2; i++) { const x = 0.3 + H2(k * 3 + c, i + 50) * 5.8, yy = y0 + 0.06 + 0.1 * H2(c + k, i + 60), l = 0.18 + 0.25 * H2(c, i + k * 2); g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + l / 2, yy + 0.012, x + l, yy - 0.004); g.strokeStyle = cmul(base, 0.28); g.lineWidth = 0.006; g.stroke(); }   // 2 drying checks a log
      g.fillStyle = rgba(K.lime, 0.9); g.fillRect(0, y0 - 0.004, W, 0.008);   // lime chinking, 8 mm
      g.fillStyle = rgba("#1a0e06", 0.5); g.fillRect(0, y0 - 0.012, W, 0.008);
    }
  }, `ground${k}`);
}

// ---- the upper storey: 6.6 x 1.7 m of boards 0.18 wide, sun-burnt, 3 pale repair boards
function paintUpper(k) {
  return mtex(6.6, 1.7, 150, (g, W, H) => {
    const nb = Math.ceil(6.6 / 0.18), rep = [Math.floor(H2(k, 1) * 12) + 3, Math.floor(H2(k, 2) * 12) + 15, Math.floor(H2(k, 3) * 10) + 26];
    for (let b = 0; b < nb; b++) {
      const x0 = b * 0.18, r = rep.indexOf(b), full = r === 0, base = r >= 0 ? cmul(K.repair, 0.92 + 0.15 * H2(k, b)) : cmul(K.woodB, 0.85 + 0.5 * H2(k, b + 9)), yA = r > 0 ? 0.2 + 0.4 * H2(k, b + 4) : 0, yB = r > 0 ? yA + 0.7 + 0.5 * H2(k, b + 5) : H;
      if (r > 0) { g.fillStyle = cmul(K.woodB, 0.85 + 0.5 * H2(k, b + 9)); g.fillRect(x0, 0, 0.18, H); }
      g.fillStyle = base; g.fillRect(x0, yA, 0.18, Math.min(H, yB) - yA);
      grain(g, x0, yA, 0.18, Math.min(H, yB) - yA, k * 31 + b * 1.7, base, { horiz: false });
      for (let i = 0; i < 2; i++) knot(g, x0 + 0.04 + 0.1 * H2(b, i + k), yA + (0.15 + 0.7 * H2(k + b, i + 70)) * (Math.min(H, yB) - yA), 0.01 + 0.012 * H2(b + k, i + 5), base, false);
      g.fillStyle = rgba("#0a0604", 0.85); g.fillRect(x0 - 0.003, 0, 0.006, H);   // the joint
      g.fillStyle = rgba("#f0c890", 0.08); g.fillRect(x0 + 0.01, 0, 0.02, H);
    }
    const q = g.createLinearGradient(0, H, 0, 0); q.addColorStop(0, rgba("#000", 0.18)); q.addColorStop(0.2, rgba("#000", 0)); g.fillStyle = q; g.fillRect(0, 0, W, H);
  }, `upper${k}`);
}

// ---- the door leaf: 0.95 x 1.70, 5 planks with V joints (nails are 3D, instanced)
function paintDoor(k, back = false) {
  return mtex(0.95, 1.7, 230, (g, W, H) => {
    const pw = 0.19, base0 = cmix(K.wood, "#8a5a30", 0.25 + 0.3 * H2(k, 5));
    for (let p = 0; p < 5; p++) {
      const x0 = p * pw, base = cmul(base0, 0.9 + 0.22 * H2(k * 5, p));
      g.fillStyle = base; g.fillRect(x0, 0, pw, H); grain(g, x0, 0, pw, H, k * 17 + p * 2.3 + (back ? 40 : 0), base, { horiz: false, lines: 6 + (p % 3) });
      knot(g, x0 + 0.05 + 0.09 * H2(k, p + 3), 0.3 + 1.1 * H2(k + p, 7), 0.016, base, false);
      if (p > 0) { g.fillStyle = "#0d0805"; g.fillRect(x0 - 0.007, 0, 0.014, H); g.fillStyle = rgba("#f0c890", 0.25); g.fillRect(x0 + 0.007, 0, 0.004, H); g.fillStyle = rgba("#000", 0.3); g.fillRect(x0 - 0.011, 0, 0.004, H); }
    }
    const q = g.createLinearGradient(0, 0, 0, 0.35); q.addColorStop(0, rgba("#d8c8a8", 0.35)); q.addColorStop(1, rgba("#d8c8a8", 0)); g.fillStyle = q; g.fillRect(0, 0, W, 0.35);   // the foot is scuffed pale
    for (let i = 0; i < 14; i++) { const x = H2(k, i + 200) * W, y = H2(k, i + 210) * 0.3; g.fillStyle = rgba("#fff", 0.1); g.fillRect(x, y, 0.1 * H2(i, k), 0.003); }
  }, `door${k}${back ? "b" : ""}`);
}

// ---- the plaque's picture, COUNTED (9 edelweiss petals, 8 rays, 7 points, 6 arms, 5 petals, 4 tiers, 3 leaves, 2 cherries, 1 moon): honey on dark, drawn in plaque metres (centre 0, 0)
function paintPlaque(k, T) {
  const honey = K.repair, hl = "#e2b878", sh = "#5a3a1c", gd = K.woodS;
  return mtex(0.30, 0.34, 1200, (g, W, H) => {
    g.translate(W / 2, H / 2); g.fillStyle = gd; g.fillRect(-W / 2, -H / 2, W, H);
    for (let i = 0; i < 60; i++) { g.strokeStyle = rgba("#1a0e06", 0.5); g.lineWidth = 0.0015; const x = (H2(k, i) - 0.5) * W; lineP(g, [[x, -H / 2], [x + 0.004, H / 2]], 0.0015, rgba("#1a0e06", 0.45)); }
    // a carved picture: shade offset, honey fill, light edge
    const carve = (draw, lw = 0.005) => { g.save(); g.translate(0.004, -0.004); draw(); g.fillStyle = sh; g.fill(); g.restore(); draw(); g.fillStyle = honey; g.fill(); g.strokeStyle = hl; g.lineWidth = lw * 0.6; g.stroke(); g.strokeStyle = sh; g.lineWidth = lw * 0.3; };
    const c0 = [0, 0.012];
    if (T.pl === "edelweiss") { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.1; carve(() => { g.beginPath(); g.moveTo(0, 0.012); g.quadraticCurveTo(Math.cos(a + 0.3) * 0.07, 0.012 + Math.sin(a + 0.3) * 0.07, Math.cos(a) * 0.1, 0.012 + Math.sin(a) * 0.1); g.quadraticCurveTo(Math.cos(a - 0.3) * 0.07, 0.012 + Math.sin(a - 0.3) * 0.07, 0, 0.012); }); cnt(`plaque9`); } for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ellP(g, Math.cos(a) * 0.016, 0.012 + Math.sin(a) * 0.016, 0.007, 0.007); g.fillStyle = sh; g.fill(); } ellP(g, 0, 0.012, 0.01, 0.01); g.fillStyle = "#f2d9a0"; g.fill(); lineP(g, [[0, -0.15], [0, -0.04]], 0.008, honey); }
    else if (T.pl === "sun") { carve(() => ellP(g, 0, 0, 0.055, 0.055)); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; carve(() => polyP(g, [[Math.cos(a - 0.2) * 0.07, Math.sin(a - 0.2) * 0.07], [Math.cos(a) * 0.125, Math.sin(a) * 0.125], [Math.cos(a + 0.2) * 0.07, Math.sin(a + 0.2) * 0.07]])); cnt("plaque8"); } ellP(g, 0, 0, 0.032, 0.032); g.strokeStyle = sh; g.lineWidth = 0.004; g.stroke(); }
    else if (T.pl === "star") { for (let i = 0; i < 1; i++) { carve(() => polyP(g, Array.from({ length: 14 }, (_, j) => { const a = Math.PI / 2 + j / 14 * TAU, r = j % 2 ? 0.05 : 0.125; return [Math.cos(a) * r, Math.sin(a) * r]; }))); } cnt("plaque7", 7); for (let j = 0; j < 7; j++) { const a = Math.PI / 2 + j / 7 * TAU; lineP(g, [[0, 0], [Math.cos(a) * 0.1, Math.sin(a) * 0.1]], 0.003, sh); } }
    else if (T.pl === "snowflake") { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 2; withT(g, 0, 0, a - Math.PI / 2, 1, 1, () => { carve(() => polyP(g, [[-0.008, 0], [-0.008, 0.11], [0, 0.13], [0.008, 0.11], [0.008, 0]])); for (const [y, l] of [[0.05, 0.04], [0.085, 0.03]]) for (const s of [-1, 1]) carve(() => polyP(g, [[0, y - 0.006], [s * l, y + l * 0.9], [s * l + s * 0.004, y + l * 0.9 + 0.006], [0, y + 0.007]])); }); cnt("plaque6"); } ellP(g, 0, 0, 0.013, 0.013); g.fillStyle = honey; g.fill(); }
    else if (T.pl === "gentian") { for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i / 5 * TAU; carve(() => { g.beginPath(); g.moveTo(0, 0.01); g.bezierCurveTo(Math.cos(a - 0.5) * 0.08, 0.01 + Math.sin(a - 0.5) * 0.08, Math.cos(a - 0.2) * 0.115, 0.01 + Math.sin(a - 0.2) * 0.115, Math.cos(a) * 0.12, 0.01 + Math.sin(a) * 0.12); g.bezierCurveTo(Math.cos(a + 0.2) * 0.115, 0.01 + Math.sin(a + 0.2) * 0.115, Math.cos(a + 0.5) * 0.08, 0.01 + Math.sin(a + 0.5) * 0.08, 0, 0.01); }); cnt("plaque5"); } ellP(g, 0, 0.01, 0.018, 0.018); g.fillStyle = sh; g.fill(); ellP(g, 0, 0.01, 0.009, 0.009); g.fillStyle = "#f2d9a0"; g.fill(); }
    else if (T.pl === "pine") { for (let i = 0; i < 4; i++) { const y = -0.08 + i * 0.062, w = 0.1 - i * 0.022; carve(() => polyP(g, [[-w, y], [0, y + 0.09], [w, y]])); cnt("plaque4"); } carve(() => polyP(g, [[-0.012, -0.135], [0.012, -0.135], [0.012, -0.08], [-0.012, -0.08]])); }
    else if (T.pl === "clover") { for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + i / 3 * TAU; withT(g, 0, 0.0, a - Math.PI / 2, 1, 1, () => { carve(() => { g.beginPath(); g.moveTo(0, 0.01); g.bezierCurveTo(-0.07, 0.04, -0.07, 0.115, 0, 0.1); g.bezierCurveTo(0.07, 0.115, 0.07, 0.04, 0, 0.01); }); lineP(g, [[0, 0.02], [0, 0.085]], 0.003, sh); }); cnt("plaque3"); } lineP(g, [[0, 0], [0.012, -0.1], [0.04, -0.14]], 0.012, honey); }
    else if (T.pl === "cherries") { lineP(g, [[-0.05, -0.05], [-0.02, 0.06], [0.01, 0.12]], 0.007, honey); lineP(g, [[0.055, -0.04], [0.04, 0.06], [0.01, 0.12]], 0.007, honey); for (const [x, y] of [[-0.052, -0.07], [0.056, -0.06]]) { carve(() => ellP(g, x, y, 0.042, 0.042)); ellP(g, x - 0.014, y + 0.014, 0.01, 0.007); g.fillStyle = hl; g.fill(); cnt("plaque2"); } carve(() => { g.beginPath(); g.moveTo(0.01, 0.12); g.bezierCurveTo(0.05, 0.16, 0.1, 0.15, 0.115, 0.12); g.bezierCurveTo(0.09, 0.09, 0.04, 0.1, 0.01, 0.12); }); }
    else if (T.pl === "moon") { carve(() => { g.beginPath(); g.arc(0, 0, 0.115, Math.PI * 0.12, Math.PI * 1.88, false); g.bezierCurveTo(0.06, -0.03, 0.06, 0.03, 0.115 * Math.cos(Math.PI * 0.12), 0.115 * Math.sin(Math.PI * 0.12)); }); cnt("plaque1"); }
  }, `plaque${k}`, 8);
}

// ---- cut-out shapes (balusters, shutters): the right half from the bottom of the axis to the top, [fraction of half width, fraction of height]; size [half width, height] in metres
const CUT = {
  heart: { w: 0.066, h: 0.15, half: Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (1 - i / 12); return [Math.pow(Math.sin(t), 3), (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 17) / 29]; }) },
  tulip: { w: 0.06, h: 0.21, half: [[0, 0], [0.3, 0.08], [0.72, 0.33], [0.98, 0.68], [0.92, 1], [0.66, 0.74], [0.32, 0.9], [0, 1]] },
  pine: { w: 0.062, h: 0.23, half: [[0, 0], [0.14, 0], [0.14, 0.14], [0.95, 0.14], [0.5, 0.4], [0.74, 0.4], [0.36, 0.66], [0.55, 0.66], [0, 1]] },
  circle: { w: 0.062, h: 0.124, half: Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + Math.PI * i / 10; return [Math.cos(a), (Math.sin(a) + 1) / 2]; }) },
  star: (() => { const v = []; for (let i = 0; i < 10; i++) { const a = (270 + i * 36) * DEG, r = i % 2 ? 0.2 : 0.5; v.push([Math.cos(a) * r, 0.5 + Math.sin(a) * r]); } const r = v.slice(0, 6).map(([x, y]) => [Math.max(0, x) / 0.476, (y - 0.095) / 0.905]); r[0][0] = 0; r[5][0] = 0; return { w: 0.07, h: 0.15, half: r }; })(),
};
const cutOutline = (name, ow = 1, oh = 1) => { const c = CUT[name], R = c.half.map(([u, v]) => [u * c.w * ow, v * c.h * oh]); return [...R, ...R.slice(1, -1).reverse().map(([x, y]) => [-x, y])]; };

// ---- a frost fern in a pane corner
function frost(g, x, y, s, dir, seed) {
  g.save(); g.translate(x, y); g.scale(dir[0], dir[1]); g.strokeStyle = rgba("#dfeaf5", 0.55); g.lineWidth = 0.0035 * s;
  for (let i = 0; i < 4; i++) { const a = (10 + i * 18) * DEG, L = (0.07 + 0.05 * hh(seed + i)) * s; lineP(g, [[0, 0], [Math.cos(a) * L, Math.sin(a) * L]], 0.0035 * s, rgba("#dfeaf5", 0.55)); for (let j = 1; j < 4; j++) for (const sd of [-1, 1]) { const t = j / 4, bx = Math.cos(a) * L * t, by = Math.sin(a) * L * t, b2 = a + sd * 0.9; lineP(g, [[bx, by], [bx + Math.cos(b2) * L * 0.3, by + Math.sin(b2) * L * 0.3]], 0.002 * s, rgba("#dfeaf5", 0.45)); } }
  g.restore();
}
// ---- a ground window 0.80 x 0.90 (lit: WINDOW glow with its picture and a lace half-curtain of 9 scallops) or a dark upper window
function paintWindow(k, T, lit, upper = false) {
  const W0 = upper ? 0.70 : 0.80, H0 = upper ? 0.80 : 0.90;
  return mtex(W0, H0, 300, (g, W, H) => {
    if (!lit) {
      const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, "#222f58"); q.addColorStop(1, "#0f1634"); g.fillStyle = q; g.fillRect(0, 0, W, H);
      polyP(g, [[W * 0.1, H * 0.1], [W * 0.3, H * 0.1], [W * 0.62, H * 0.92], [W * 0.42, H * 0.92]]); g.fillStyle = rgba("#9fb4e8", 0.2); g.fill();   // the moon on the glass
      polyP(g, [[W * 0.36, H * 0.1], [W * 0.42, H * 0.1], [W * 0.74, H * 0.92], [W * 0.68, H * 0.92]]); g.fillStyle = rgba("#9fb4e8", 0.12); g.fill();
      frost(g, 0.02, 0.02, 1, [1, 1], k + 4); frost(g, W - 0.02, 0.02, 1, [-1, 1], k + 9); frost(g, W - 0.02, H - 0.02, 0.8, [-1, -1], k + 12); return;
    }
    const q = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75); q.addColorStop(0, K.core); q.addColorStop(0.35, "#ffd98a"); q.addColorStop(1, K.win); g.fillStyle = q; g.fillRect(0, 0, W, H);
    const cx = W / 2, sillY = 0.03, pic = upper ? null : T.win;
    const flame = (x, y, s) => { ellP(g, x, y + 0.014 * s, 0.009 * s, 0.017 * s); g.fillStyle = "#f0661e"; g.fill(); ellP(g, x, y + 0.012 * s, 0.006 * s, 0.012 * s); g.fillStyle = "#ffb43a"; g.fill(); ellP(g, x, y + 0.009 * s, 0.003 * s, 0.007 * s); g.fillStyle = "#fff3b0"; g.fill(); };
    if (pic === "arch") {   // the candle arch: a dark wooden arch with 5 candles and 5 flames
      const R = 0.26, by = 0.36;
      g.beginPath(); g.arc(cx, by, R, Math.PI, 0, false); g.strokeStyle = "#2a1a10"; g.lineWidth = 0.022; g.stroke(); g.strokeStyle = "#5a3a22"; g.lineWidth = 0.008; g.stroke();
      g.fillStyle = "#2a1a10"; g.fillRect(cx - R - 0.02, sillY + 0.15, 0.04, by - sillY - 0.15); g.fillRect(cx + R - 0.02, sillY + 0.15, 0.04, by - sillY - 0.15);
      g.fillRect(cx - R - 0.05, sillY + 0.13, 0.1, 0.02); g.fillRect(cx + R - 0.05, sillY + 0.13, 0.1, 0.02);
      for (let i = 0; i < 5; i++) { const a = Math.PI * (0.1 + 0.8 * i / 4), x = cx + Math.cos(a) * R * -1, y = by + Math.sin(a) * R; g.fillStyle = "#f4ecd8"; g.fillRect(x - 0.007, y, 0.014, 0.05); g.strokeStyle = "#7a6a4a"; g.lineWidth = 0.002; g.strokeRect(x - 0.007, y, 0.014, 0.05); flame(x, y + 0.05, 1.1); cnt(`flame9`); }
      lineP(g, [[cx - 0.2, by + 0.0], [cx + 0.2, by + 0.0]], 0.004, "#2a1a10");
    } else if (pic === "star") {   // a paper star lamp with 7 points hung from the top
      lineP(g, [[cx, H], [cx, H * 0.78]], 0.003, "#6a5a3a");
      const sy = H * 0.52, R = 0.2, r = 0.085; polyP(g, Array.from({ length: 14 }, (_, j) => { const a = Math.PI / 2 + j / 14 * TAU, rr = j % 2 ? r : R; return [cx + Math.cos(a) * rr, sy + Math.sin(a) * rr]; })); fillP(g, "#fff6d2", 0.004, "#c89a4a");
      for (let j = 0; j < 7; j++) { const a = Math.PI / 2 + j / 7 * TAU; lineP(g, [[cx, sy], [cx + Math.cos(a) * R * 0.92, sy + Math.sin(a) * R * 0.92]], 0.003, rgba("#c89a4a", 0.8)); }
      cnt("star7");
      ellP(g, cx, sy, 0.05, 0.05); g.fillStyle = "#fffbe6"; g.fill();
    } else if (pic === "cyclamen") {
      polyP(g, [[cx - 0.07, sillY + 0.0], [cx + 0.07, sillY], [cx + 0.09, sillY + 0.11], [cx - 0.09, sillY + 0.11]]); fillP(g, "#b6603a", 0.004, "#5a2a14");
      for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2, x = cx + Math.sin(a) * 0.17, y = sillY + 0.14 + Math.cos(a) * 0.08; ellP(g, x, y, 0.06, 0.045, -a); fillP(g, "#4a7a4a", 0.003, "#1f3a22"); ellP(g, x, y, 0.03, 0.02, -a); g.fillStyle = rgba("#a8c8a0", 0.8); g.fill(); }
      for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.5, x0 = cx + Math.sin(a) * 0.04, x1 = cx + Math.sin(a) * 0.18 + (i - 2) * 0.015, y1 = sillY + 0.3 + 0.1 * Math.cos(a) + 0.04 * (i % 2); lineP(g, [[x0, sillY + 0.12], [x1, y1]], 0.004, "#3a6a3a");
        for (let p = 0; p < 4; p++) { const pa = a * 0.4 + Math.PI + (p - 1.5) * 0.35; withT(g, x1, y1, pa, 1, 1, () => { ellP(g, 0, -0.03, 0.014, 0.034); fillP(g, i % 2 ? "#e0489a" : "#c0307a", 0.002, "#6a1a44"); }); } }
    } else if (pic === "jars") {
      for (let i = 0; i < 3; i++) { const x = cx + (i - 1) * 0.19, h = 0.2 + 0.04 * i, col = ["#d9a02a", "#b0242a", "#5a8a3a"][i]; polyP(g, [[x - 0.065, sillY], [x + 0.065, sillY], [x + 0.065, sillY + h], [x + 0.045, sillY + h + 0.02], [x - 0.045, sillY + h + 0.02], [x - 0.065, sillY + h]]); fillP(g, col, 0.004, "#3a2210"); g.fillStyle = rgba("#fff", 0.28); g.fillRect(x - 0.05, sillY + 0.02, 0.012, h - 0.04); g.fillStyle = "#c9b890"; g.fillRect(x - 0.05, sillY + h + 0.018, 0.1, 0.024); g.strokeStyle = "#3a2210"; g.lineWidth = 0.003; g.strokeRect(x - 0.05, sillY + h + 0.018, 0.1, 0.024); g.fillStyle = "#f4ecd8"; g.fillRect(x - 0.04, sillY + 0.07, 0.08, 0.07); }
    } else if (pic === "kid") {   // the pane is empty for the kid (a separate card behind it); frost and a mitten smudge
      ellP(g, cx - 0.12, H * 0.42, 0.05, 0.05); g.fillStyle = rgba("#fff", 0.3); g.fill(); ellP(g, cx + 0.14, H * 0.46, 0.05, 0.05); g.fillStyle = rgba("#fff", 0.3); g.fill();
    } else if (pic === "books") {
      const cols = ["#8a2a2a", "#2a4a7a", "#3a6a3a", "#b88a2a"];
      for (let i = 0; i < 4; i++) { const y = sillY + i * 0.075, w = 0.36 - 0.03 * i + 0.02 * (i % 2), x = cx - w / 2 + (hh(k * 3 + i) - 0.5) * 0.06; g.fillStyle = cols[i]; g.fillRect(x, y, w, 0.07); g.strokeStyle = "#1a1008"; g.lineWidth = 0.003; g.strokeRect(x, y, w, 0.07); g.fillStyle = "#f2e8cc"; g.fillRect(x + 0.012, y + 0.008, w - 0.024, 0.01); g.fillStyle = rgba("#e2b04a", 0.9); g.fillRect(x + 0.03, y + 0.03, 0.03, 0.012); g.fillRect(x + w - 0.07, y + 0.03, 0.04, 0.012); cnt("book"); }
      ellP(g, cx, sillY + 0.3 + 0.0, 0.03, 0.05); g.fillStyle = "#f4ecd8"; g.fill(); flame(cx, sillY + 0.35, 1.0);
    } else if (pic === "firjug") {
      polyP(g, [[cx - 0.07, sillY], [cx + 0.07, sillY], [cx + 0.095, sillY + 0.1], [cx + 0.06, sillY + 0.2], [cx - 0.06, sillY + 0.2], [cx - 0.095, sillY + 0.1]]); fillP(g, "#4a6a9a", 0.004, "#1a2a44"); lineP(g, [[cx - 0.08, sillY + 0.1], [cx + 0.08, sillY + 0.1]], 0.008, "#e8e0c8"); lineP(g, [[cx + 0.09, sillY + 0.07], [cx + 0.15, sillY + 0.11], [cx + 0.1, sillY + 0.17]], 0.012, "#4a6a9a");
      for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 1.7, x1 = cx + Math.sin(a) * 0.2, y1 = sillY + 0.2 + Math.cos(a) * 0.28; lineP(g, [[cx + Math.sin(a) * 0.03, sillY + 0.2], [x1, y1]], 0.004, "#3a2a1a"); for (let n = 0; n < 8; n++) { const t = 0.3 + n / 10; const bx = cx + Math.sin(a) * (0.03 + 0.17 * t), by = sillY + 0.2 + (y1 - sillY - 0.2) * t; for (const s of [-1, 1]) lineP(g, [[bx, by], [bx + s * 0.05 * (1.1 - t * 0.7), by + 0.02 + 0.01 * (n % 2)]], 0.004, "#2f6a52"); } }
    }
    if (!upper) {   // the lace half-curtain: its top edge 9 scallops, cream lace with holes, over the lower 0.30
      const ch = 0.3, n = 9, sw = W / n;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, ch); for (let i = n - 1; i >= 0; i--) { g.quadraticCurveTo(i * sw + sw / 2, ch + 0.07, i * sw, ch); } g.closePath(); g.fillStyle = rgba("#f6f0e0", 0.8); g.fill(); g.strokeStyle = rgba("#b8a888", 0.9); g.lineWidth = 0.004; g.stroke();
      cnt("curtain.scallop", 9);
      for (let i = 0; i < 60; i++) { ellP(g, H2(k, i + 300) * W, H2(k, i + 310) * (ch - 0.02) + 0.01, 0.008, 0.008); g.fillStyle = rgba(cmix("#ffd98a", "#e8b860", 0.5), 0.55); g.fill(); }
      for (let i = 0; i < 9; i++) { g.strokeStyle = rgba("#b8a888", 0.5); g.lineWidth = 0.002; lineP(g, [[i * sw + sw / 2, ch + 0.05], [i * sw + sw / 2, 0.01]], 0.002, rgba("#b8a888", 0.5)); }
    }
    frost(g, 0.02, H - 0.02, 1, [1, -1], k + 1); frost(g, W - 0.02, H - 0.02, 1, [-1, -1], k + 2);
  }, `win${k}${lit ? "L" : "D"}${upper ? "u" : ""}`);
}

// ---- a shutter 0.40 x 0.90: a frame and 2 panels, the upper with a cut-out, the lower painted
function paintShutter(k, T) {
  const col = T.shut, dk = cmul(col, 0.62), lt = cmix(col, "#ffffff", 0.22);
  return mtex(0.40, 0.90, 220, (g, W, H) => {
    g.fillStyle = col; g.fillRect(0, 0, W, H); grain(g, 0, 0, W, H, k * 13 + 5, col, { horiz: false, lines: 7 });
    for (const [y0, h] of [[0.05, 0.38], [0.5, 0.35]]) { g.fillStyle = dk; g.fillRect(0.05, y0, W - 0.1, h); g.fillStyle = cmix(col, "#000", 0.12); g.fillRect(0.062, y0 + 0.012, W - 0.124, h - 0.024); g.strokeStyle = lt; g.lineWidth = 0.004; g.strokeRect(0.05, y0, W - 0.1, h); }
    const sh = T.shutCut || T.cut, o = cutOutline(sh, 1.0, 1.0), cx = W / 2, cy = 0.5 + 0.35 / 2 - CUT[sh].h / 2;   // the cut-out (the wall shows through)
    polyP(g, o.map(([x, y]) => [cx + x * 1.15, cy + y * 1.15])); fillP(g, "#1a0e08", 0.005, lt);
    const fy = 0.24, f = T.fl;   // the painted flower on the lower panel
    if (f === "tulip") { lineP(g, [[cx, 0.08], [cx, fy]], 0.012, "#4a8a4a"); for (const s of [-1, 1]) { polyP(g, [[cx, 0.11], [cx + s * 0.1, 0.2], [cx + s * 0.03, 0.13]]); fillP(g, "#4a8a4a", 0.003, "#1f3a22"); } for (const [dx, a] of [[-0.05, 0.25], [0.05, -0.25], [0, 0]]) { withT(g, cx + dx, fy, a, 1, 1, () => { polyP(g, [[-0.03, 0], [0.03, 0], [0.04, 0.09], [0, 0.12], [-0.04, 0.09]]); fillP(g, "#d0302a", 0.003, "#6a1410"); }); } }
    else if (f === "starflower") { lineP(g, [[cx, 0.08], [cx, fy]], 0.01, "#4a8a4a"); for (let i = 0; i < 6; i++) { withT(g, cx, fy + 0.04, i / 6 * TAU, 1, 1, () => { ellP(g, 0, 0.045, 0.02, 0.05); fillP(g, "#f4f1ea", 0.003, "#6a6a70"); }); } ellP(g, cx, fy + 0.04, 0.02, 0.02); g.fillStyle = "#e2b04a"; g.fill(); }
    else if (f === "diamond") { polyP(g, [[cx, 0.1], [cx + 0.1, fy + 0.03], [cx, 0.38], [cx - 0.1, fy + 0.03]]); fillP(g, "#e6dcc6", 0.004, "#3a1410"); polyP(g, [[cx, 0.15], [cx + 0.06, fy + 0.03], [cx, 0.33], [cx - 0.06, fy + 0.03]]); fillP(g, "#7a2a22", 0.003, "#3a1410"); ellP(g, cx, fy + 0.03, 0.015, 0.015); g.fillStyle = "#e6dcc6"; g.fill(); }
    else if (f === "vine") { g.beginPath(); for (let u = 0; u <= 20; u++) { const y = 0.08 + u / 20 * 0.32, x = cx + Math.sin(u * 0.6) * 0.06; u ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = "#3a7a3a"; g.lineWidth = 0.012; g.stroke(); for (let i = 0; i < 7; i++) { const y = 0.1 + i * 0.045, x = cx + Math.sin((y - 0.08) / 0.32 * 20 * 0.6) * 0.06, s = i % 2 ? 1 : -1; withT(g, x, y, s * 0.9, 1, 1, () => { ellP(g, 0, 0.03, 0.016, 0.034); fillP(g, "#4a9a4a", 0.003, "#1f3a22"); }); } }
    for (const y of [0.12, 0.85]) { g.fillStyle = "#101114"; g.fillRect(W - 0.0, y, 0, 0); }
  }, `shut${k}`);
}

// ---- the painted vine jamb 0.12 x 1.40 (doors 9 and 4): 5 flowers (edelweiss white, alpine rose, gentian, then again) and 9 leaves on cream inside a green line, rubbed to wood at y 0.5-0.8
function paintJamb(k, mirror) {
  return mtex(0.12, 1.4, 300, (g, W, H) => {
    g.fillStyle = "#e6dcc6"; g.fillRect(0, 0, W, H); g.strokeStyle = "#3a7a3a"; g.lineWidth = 0.007; g.strokeRect(0.008, 0.008, W - 0.016, H - 0.016);
    const sw = (y) => W / 2 + Math.sin(y * 9 + (mirror ? 2 : 0)) * 0.03;
    g.beginPath(); for (let u = 0; u <= 60; u++) { const y = 0.04 + u / 60 * (H - 0.08); u ? g.lineTo(sw(y), y) : g.moveTo(sw(y), y); } g.strokeStyle = "#2f6a3a"; g.lineWidth = 0.007; g.stroke();
    for (let i = 0; i < 9; i++) { const y = 0.09 + i * (H - 0.18) / 8.4, s = i % 2 ? 1 : -1; withT(g, sw(y), y, s * 1.0, 1, 1, () => { ellP(g, 0, 0.03, 0.013, 0.032); fillP(g, "#4a9a4a", 0.002, "#1f3a22"); }); cnt("jamb.leaf"); }
    const cols = ["#f4f1ea", "#b8322e", "#3a5fb0", "#f4f1ea", "#b8322e"];
    for (let i = 0; i < 5; i++) { const y = 0.2 + i * 0.27, x = sw(y) + (i % 2 ? 0.02 : -0.02); for (let p = 0; p < 6; p++) withT(g, x, y, p / 6 * TAU, 1, 1, () => { ellP(g, 0, 0.022, 0.011, 0.024); fillP(g, cols[i], 0.002, "#2a2a30"); }); ellP(g, x, y, 0.009, 0.009); g.fillStyle = "#e2b04a"; g.fill(); cnt("jamb.flower"); }
    const q = g.createLinearGradient(0, 0.5, 0, 0.8); q.addColorStop(0, rgba("#6a4528", 0)); q.addColorStop(0.5, rgba("#6a4528", 0.8)); q.addColorStop(1, rgba("#6a4528", 0)); g.fillStyle = q; g.fillRect(0, 0.5, W, 0.3);   // rubbed to wood where hands go
  }, `jamb${k}${mirror ? "m" : ""}`);
}

// ---- stone: irregular courses of stones, each drawn once from its index (rubble with lime pointing, or dry-laid with dark gaps), snow dusting the top edges
function stoneField(g, x0, y0, w, h, seed, o = {}) {
  const rows = o.rows ?? 4, tone = o.tone ?? K.stone, point = o.point ?? K.lime, snowTop = o.snow ?? 0.5, perRow = o.per;   // perRow: stones per row (exact), else by width
  g.fillStyle = o.gap ?? (point === "dark" ? "#14161c" : point); g.fillRect(x0, y0, w, h);
  let n = 0, ry = y0; const rh = []; let s = 0; for (let r = 0; r < rows; r++) { rh.push(0.7 + 0.6 * hh(seed + r * 3.3)); s += rh[r]; }
  for (let r = 0; r < rows; r++) {
    const hgt = (h * rh[r]) / s, cnum = perRow ? perRow[r] : Math.max(2, Math.round(w / (o.sw ?? 0.45))), ws = Array.from({ length: cnum }, (_, i) => 0.6 + 0.8 * hh(seed + r * 11 + i * 1.7)), sw = ws.reduce((a, b) => a + b, 0);
    let cx = x0;
    for (let i = 0; i < cnum; i++, n++) {
      const sw_ = (w * ws[i]) / sw, jx = (hh(seed + n * 2.1) - 0.5) * 0.01, gp = 0.006 + 0.004 * hh(seed + n * 9.1);
      const xa = cx + gp, xb = cx + sw_ - gp, ya = ry + gp, yb = ry + hgt - gp, t = 0.78 + 0.4 * hh(seed + n * 5.3), c = cmul(cmix(tone, i % 3 ? "#7a7e88" : "#9a9aa0", 0.3 * hh(seed + n)), t);
      const pts = [[xa, ya + 0.01], [lerp(xa, xb, 0.5), ya - 0.002 + jx], [xb, ya + 0.008], [xb + 0.004, lerp(ya, yb, 0.5)], [xb - 0.006, yb], [lerp(xa, xb, 0.45), yb + 0.004 + jx], [xa + 0.004, yb - 0.008], [xa - 0.003, lerp(ya, yb, 0.45)]];
      smoothP(g, pts); g.fillStyle = c; g.fill();
      g.save(); smoothP(g, pts); g.clip(); const q = g.createLinearGradient(0, yb, 0, ya); q.addColorStop(0, rgba("#000", 0.3)); q.addColorStop(0.35, rgba("#000", 0)); q.addColorStop(0.8, rgba("#fff", 0.16)); q.addColorStop(1, rgba("#fff", 0.3)); g.fillStyle = q; g.fillRect(xa - 0.02, ya - 0.02, xb - xa + 0.04, yb - ya + 0.04);
      for (let q2 = 0; q2 < 4; q2++) { ellP(g, lerp(xa, xb, hh(seed + n * 3 + q2)), lerp(ya, yb, hh(seed + n * 7 + q2 * 2)), 0.006 + 0.012 * hh(seed + q2 + n), 0.004 + 0.006 * hh(seed + n * 2 + q2), hh(n + q2)); g.fillStyle = rgba(hh(n * 2 + q2) > 0.5 ? "#fff" : "#000", 0.08); g.fill(); }
      g.restore();
      if (hh(seed + n * 6.7) < snowTop) { const sx = lerp(xa, xb, 0.1 + 0.3 * hh(seed + n * 4.1)), ex = lerp(xa, xb, 0.6 + 0.35 * hh(seed + n * 8.1)); g.beginPath(); g.moveTo(sx, yb - 0.004); g.quadraticCurveTo((sx + ex) / 2, yb + 0.014 + 0.02 * hh(seed + n), ex, yb - 0.004); g.closePath(); g.fillStyle = rgba("#e8f0fb", 0.92); g.fill(); }
      cx += sw_;
    }
    ry += hgt;
  }
  return n;
}

// ---- the apron: flagstones 0.4-0.7 across (z up from the wall), joints 2 cm packed with snow, snow thick at the edges, 12 broom strokes swept before the door
function paintApron(k) {
  return mtex(6.6, 1.9, 100, (g, W, H) => {
    g.fillStyle = "#dfe8f6"; g.fillRect(0, 0, W, H);
    let r = 0, y = 0, n = 0;
    while (y < H - 0.01) {
      const rh = Math.min(H - y, 0.4 + 0.3 * H2(k, r + 400)); let x = (r % 2) * -0.25 + 0 * W;
      while (x < W) {
        const w = 0.4 + 0.3 * H2(k * 3, n + 410); const xa = Math.max(0, x) + 0.01, xb = Math.min(W, x + w) - 0.01, ya = y + 0.01, yb = y + rh - 0.01;
        if (xb > xa) {
          const c = cmul(cmix("#8a8d96", "#9aa4b8", 0.3), 0.72 + 0.4 * H2(k + n, 7)); smoothP(g, [[xa, ya], [(xa + xb) / 2, ya + 0.004], [xb, ya], [xb + 0.004, (ya + yb) / 2], [xb, yb], [(xa + xb) / 2, yb - 0.004], [xa, yb], [xa - 0.004, (ya + yb) / 2]]); g.fillStyle = c; g.fill();
          g.save(); smoothP(g, [[xa, ya], [xb, ya], [xb, yb], [xa, yb]]); g.clip(); for (let q = 0; q < 3; q++) { ellP(g, lerp(xa, xb, H2(n, q + 420)), lerp(ya, yb, H2(n, q + 430)), 0.03 + 0.05 * H2(n + k, q), 0.02 + 0.03 * H2(q, n + k), H2(q, n)); g.fillStyle = rgba(q % 2 ? "#e8f0fb" : "#4a5568", 0.18); g.fill(); } g.restore();
          g.strokeStyle = rgba("#eef4fc", 0.95); g.lineWidth = 0.02; g.beginPath(); g.moveTo(xa - 0.01, ya - 0.01); g.lineTo(xb + 0.01, ya - 0.01); g.stroke();
          g.strokeStyle = rgba("#eef4fc", 0.95); g.beginPath(); g.moveTo(xb + 0.01, ya - 0.01); g.lineTo(xb + 0.01, yb + 0.01); g.stroke();
        }
        x += w; n++;
      }
      y += rh; r++;
    }
    // the snow lying at the edges and corners: thin by the door, thick on the front edge and the outer ends
    const lay = (x0, y0, x1, y1, a) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, rgba("#eef4fc", a)); q.addColorStop(1, rgba("#eef4fc", 0)); g.fillStyle = q; g.fillRect(0, 0, W, H); };
    lay(0, H, 0, H - 0.55, 0.95); lay(0, 0, 0.9, 0, 0.9); lay(W, 0, W - 1.2, 0, 0.9);
    for (let i = 0; i < 26; i++) { const x = H2(k, i + 500) * W, yy = H2(k, i + 510) * H, r2 = 0.05 + 0.12 * H2(k, i + 520); const q = g.createRadialGradient(x, yy, 0, x, yy, r2); q.addColorStop(0, rgba("#f4f8fe", 0.55)); q.addColorStop(1, rgba("#f4f8fe", 0)); g.fillStyle = q; g.fillRect(x - r2, yy - r2, 2 * r2, 2 * r2); }
    // swept before the door (door at x 2.6): a fan of 12 broom strokes, the swept stone bare
    const dx = 2.6;
    g.save(); g.beginPath(); g.moveTo(dx - 0.5, 0); for (let a = 0; a <= 20; a++) { const t = a / 20, ang = Math.PI * (1.0 - t * 0.0); g.lineTo(dx - 0.55 + t * 1.1 + Math.sin(t * Math.PI) * 0.0, 0 + Math.sin(t * Math.PI) * 1.25 + 0.05); } g.closePath(); g.clip();
    for (let s = 0; s < 12; s++) { const a = (-0.75 + 1.5 * s / 11) * 1.0, ang = Math.PI / 2 + a * 0.9; g.beginPath(); g.moveTo(dx + Math.cos(ang) * 0.1, 0.02); g.quadraticCurveTo(dx + Math.cos(ang) * 0.7 + 0.15 * Math.sin(s), 0.7 * Math.sin(ang), dx + Math.cos(ang) * 1.3, 1.25 * Math.sin(ang)); g.strokeStyle = rgba("#6a7488", 0.42); g.lineWidth = 0.035 + 0.01 * H2(k, s + 600); g.stroke(); g.strokeStyle = rgba("#eef4fc", 0.55); g.lineWidth = 0.008; g.stroke(); }
    g.restore();
    cnt("broom", 12);
  }, `apron${k}`);
}

// ---- a lane tile (landing or ramp): packed snow, 2 sledge-runner grooves 0.9 apart, the old potato footprints that fall on it, powder 0.5 wide at both edges (v: z - 1.9)
function paintLane(i, len, prints, ppm = 70) {
  return mtex(len, 3.6, ppm, (g, W, H) => {
    g.fillStyle = "#b4c4e2"; g.fillRect(0, 0, W, H);
    for (let n = 0; n < Math.round(len * 14); n++) { const x = H2(i, n + 700) * W, y = H2(i, n + 710) * H, r = 0.05 + 0.2 * H2(i, n + 720); const q = g.createRadialGradient(x, y, 0, x, y, r); const c = n % 2 ? "#dbe6f7" : "#8aa0cc"; q.addColorStop(0, rgba(c, 0.38)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (const dy of [-0.45, 0.45]) { g.beginPath(); for (let u = 0; u <= 30; u++) { const x = u / 30 * W, y = H * 0.5 + dy + Math.sin(x * 0.7 + i) * 0.1 + Math.sin(x * 1.9 + i * 2) * 0.03; u ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = rgba("#5a6e9e", 0.6); g.lineWidth = 0.07; g.stroke(); g.strokeStyle = rgba("#ecf3fc", 0.5); g.lineWidth = 0.012; g.translate(0, 0.03); g.stroke(); g.translate(0, -0.03); g.strokeStyle = rgba("#8aa0cc", 0.5); g.lineWidth = 0.035; g.stroke(); }
    for (const [x, y, a] of prints) { withT(g, x, y, a, 1, 1, () => { ellP(g, 0, 0, 0.037, 0.024); g.fillStyle = rgba("#6a7eac", 0.75); g.fill(); ellP(g, 0.004, 0.004, 0.032, 0.02); g.fillStyle = rgba("#9db0d8", 0.8); g.fill(); }); }
    for (const [y0, dir] of [[0, 1], [H, -1]]) { const q = g.createLinearGradient(0, y0, 0, y0 + dir * 0.5); q.addColorStop(0, rgba("#f6faff", 0.95)); q.addColorStop(1, rgba("#f6faff", 0)); g.fillStyle = q; g.fillRect(0, Math.min(y0, y0 + dir * 0.5), W, 0.5); for (let n = 0; n < Math.round(len * 10); n++) { const x = H2(i, n + 740) * W, y = y0 + dir * H2(i, n + 750) * 0.45, r = 0.03 + 0.08 * H2(i, n + 760); ellP(g, x, y, r * 1.5, r * 0.8); g.fillStyle = rgba(n % 3 ? "#ffffff" : "#c9d8f0", 0.5); g.fill(); } }
  }, `lane${i}`, 8);
}

// ---- the woodpile log ends: an atlas of 12 x 11 cells, each end drawn once (quarters 50 %, halves 35 %, rounds 15 %; 2-5 radial cracks, 3-6 rings, a bark rim on the round side)
const PILE = { x0: 2.80, x1: 4.30, h: 1.15, nc: 12, nr: 11, z1: 1.01 };
function pileLayout() {
  // 11 rows of 12 round log ends, odd rows shifted by half a log (the way a pile is stacked), widths 0.85-1.15 of the mean, the peep gap (rows 3-4) and the cat gap (rows 0-1) cut out
  const idx = Array.from({ length: 132 }, (_, i) => i).sort((a, b) => hh(a * 3.7 + 1) - hh(b * 3.7 + 1)), grey = new Set(idx.slice(0, 40)), fresh = new Set(idx.slice(40, 48)), prot = new Set(idx.slice(48, 68));
  const rh = PILE.h / PILE.nr, logs = [], cellW = (PILE.x1 - PILE.x0) / 12;
  for (let r = 0; r < PILE.nr; r++) {
    const gap = (r === 3 || r === 4) ? [3.10, 3.30] : (r <= 1 ? [3.70, 3.94] : null), X0 = PILE.x0 + 0.004 + (r % 2 ? cellW * 0.5 : 0), X1 = PILE.x1 - 0.004;
    const segs = gap ? [[X0, gap[0]], [gap[1], X1]] : [[X0, X1]], lens = segs.map(([a, b]) => b - a), nL = gap ? Math.round(12 * lens[0] / (lens[0] + lens[1])) : 12, counts = gap ? [nL, 12 - nL] : [12];
    let c = 0;
    segs.forEach(([a, b], si) => {
      const n = counts[si], ws = Array.from({ length: n }, (_, j) => 0.85 + 0.3 * hh(r * 31 + (c + j) * 7.7)), sw = ws.reduce((p, q) => p + q, 0); let x = a;
      for (let j = 0; j < n; j++, c++) {
        const w = (b - a) * ws[j] / sw, id = r * 12 + c, kind = hh(id * 5.3 + 2) < 0.5 ? "q" : hh(id * 5.3 + 2) < 0.85 ? "h" : "r", h = rh - 0.008 + 0.01 * (hh(id) - 0.5);
        const R = Math.min(0.068, Math.max(0.046, 0.5 * Math.max(w, h) * (1.0 + 0.07 * hh(id * 1.3))));
        logs.push({ id, r, c, x0: x, w, y0: r * rh + 0.004, h, R, cx: x + w / 2 + 0.004 * (hh(id * 2.9) - 0.5), cy: r * rh + 0.004 + h / 2 + 0.008 * (hh(id * 2.1) - 0.5), kind, grey: grey.has(id), fresh: fresh.has(id), pr: prot.has(id) ? 0.03 + 0.025 * hh(id * 2.2) : 0.0035 * hh(id * 8.1), rot: hh(id * 9.1) * TAU });
        x += w;
      }
    });
  }
  return logs;
}
function paintLogEnds(logs) {
  const CW = 96, CH = 96;
  return canvasTex(12 * CW, 11 * CH, (g, W, H) => {
    g.fillStyle = "#140c06"; g.fillRect(0, 0, W, H);
    for (const L of logs) {
      const cx = L.c * CW + CW / 2, cy = (10 - L.r) * CH + CH / 2, R = CW * 0.49;
      const heart = L.fresh ? "#f0d2a0" : L.grey ? "#9a9184" : cmul("#d9b382", 0.88 + 0.24 * hh(L.id * 3.3)), bark = L.grey ? cmul("#5a524a", 0.8 + 0.4 * hh(L.id * 7.7)) : cmul("#4a3424", 0.75 + 0.5 * hh(L.id * 7.7)), line = L.grey ? "#5a544a" : "#7a5430";
      g.save(); g.translate(cx, cy); g.rotate(L.rot);
      // the bark rim: a ragged ring (radius 0.94-1.0 R); inside it the cambium (a lighter thin ring) and the heart
      g.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU, r = R * (0.94 + 0.06 * hh(L.id * 13 + (i % 36) * 1.7)); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = bark; g.fill();
      for (let i = 0; i < 14; i++) { const a = hh(L.id * 17 + i) * TAU, r = R * (0.86 + 0.1 * hh(L.id * 19 + i)); g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 1 + 1.6 * hh(L.id * 23 + i), 0, TAU); g.fillStyle = rgba(hh(i + L.id) > 0.5 ? "#2a1a0e" : "#6a4a30", 0.6); g.fill(); }
      const ox = R * 0.1 * (hh(L.id * 4.4) - 0.5), oy = R * 0.1 * (hh(L.id * 5.6) - 0.5), Rc = R * 0.84;
      g.beginPath(); g.arc(0, 0, Rc, 0, TAU); g.fillStyle = cmix(heart, "#fff2d0", 0.25); g.fill();
      g.save(); g.beginPath(); g.arc(0, 0, Rc - 1.2, 0, TAU); g.clip(); g.fillStyle = heart; g.fillRect(-R, -R, 2 * R, 2 * R);
      const q = g.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R * 1.1); q.addColorStop(0, rgba("#fff", L.grey ? 0.0 : 0.18)); q.addColorStop(1, rgba("#000", 0.24)); g.fillStyle = q; g.fillRect(-R, -R, 2 * R, 2 * R);
      const nring = 4 + Math.floor(hh(L.id * 6.1) * 4); for (let i = 1; i <= nring; i++) { const rr = Rc * (i / (nring + 0.3)); g.beginPath(); for (let j = 0; j <= 28; j++) { const a = j / 28 * TAU, r2 = rr * (1 + 0.04 * Math.sin(a * 3 + i + L.id)); j ? g.lineTo(ox + Math.cos(a) * r2, oy + Math.sin(a) * r2) : g.moveTo(ox + Math.cos(a) * r2, oy + Math.sin(a) * r2); } g.strokeStyle = rgba(line, 0.45 + 0.2 * hh(L.id + i)); g.lineWidth = 0.9 + 0.5 * hh(L.id * 3 + i); g.stroke(); }
      g.beginPath(); g.arc(ox, oy, 2 + 1.5 * hh(L.id), 0, TAU); g.fillStyle = rgba("#4a2c12", 0.8); g.fill();
      // checks: 2-5 radial drying cracks, tapered
      const ncr = 2 + Math.floor(hh(L.id * 8.3) * 4); for (let i = 0; i < ncr; i++) { const a = hh(L.id * 3 + i * 1.9) * TAU, len = Rc * (0.45 + 0.5 * hh(L.id * 5 + i)), ca = Math.cos(a), sa = Math.sin(a); g.beginPath(); g.moveTo(ox + ca * 3, oy + sa * 3); g.lineTo(ox + ca * len + sa * 2.2, oy + sa * len - ca * 2.2); g.lineTo(ox + ca * len - sa * 2.2, oy + sa * len + ca * 2.2); g.closePath(); g.fillStyle = rgba("#2a1608", 0.85); g.fill(); }
      // split logs: a half has 1 split through the pith, a quarter 2 crossing ones (stacked back together they still read as a round)
      const spl = L.kind === "h" ? 1 : L.kind === "q" ? 2 : 0; for (let i = 0; i < spl; i++) { const a = i * Math.PI / 2 + 0.3 * (hh(L.id * 6.6) - 0.5); g.beginPath(); g.moveTo(Math.cos(a) * -Rc, Math.sin(a) * -Rc); g.lineTo(Math.cos(a) * Rc, Math.sin(a) * Rc); g.strokeStyle = rgba("#1a0e06", 0.9); g.lineWidth = 2.6; g.stroke(); g.strokeStyle = rgba("#f4e2bc", 0.35); g.lineWidth = 0.8; g.translate(0.8, 0.8); g.stroke(); g.translate(-0.8, -0.8); }
      if (L.kind === "q") { g.fillStyle = rgba("#000", 0.07); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, Rc, 0, Math.PI / 2); g.fill(); g.fillStyle = rgba("#fff", 0.07); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, Rc, Math.PI, Math.PI * 1.5); g.fill(); }
      g.restore();
      g.beginPath(); g.arc(0, 0, Rc, 0, TAU); g.strokeStyle = rgba("#2a1608", 0.8); g.lineWidth = 1.2; g.stroke();
      g.restore();
    }
  }, "logends", 4);
}

// ---- the lantern flame: 3 painted shapes swapped 8 x a second (the hall flame look)
function paintFlame(fr) {
  return canvasTex(64, 96, (g, w, h) => {
    const tongues = [[0, 0.98, 0.26], [-0.2, 0.62, 0.2], [0.2, 0.7, 0.2]];
    const draw = (scale, col) => { g.fillStyle = col; tongues.forEach(([dx, hh_, ww], i) => { const j = hh(fr * 11.3 + i * 4.1) - 0.5, x = w / 2 + dx * w * 0.5 * scale + j * 4, top = h * (1 - hh_ * scale * (0.9 + 0.2 * hh(fr * 3.7 + i))), base = h * 0.99, wd = ww * w * scale, lean = (dx * 6 + j * 8) * scale; g.beginPath(); g.moveTo(x - wd, base); g.bezierCurveTo(x - wd * 1.2, base - (base - top) * 0.45, x - wd * 0.3 + lean * 0.2, base - (base - top) * 0.75, x + lean, top); g.bezierCurveTo(x + wd * 0.3 + lean * 0.2, base - (base - top) * 0.75, x + wd * 1.2, base - (base - top) * 0.45, x + wd, base); g.closePath(); g.fill(); }); };
    draw(1.0, "#f0661e"); draw(0.72, "#ffb43a"); draw(0.42, "#fff3b0");
  }, `lflame${fr}`, 1);
}

// ---- potato kids at a window (a window-sized card in front of the glass, transparent; the picture slides down below the sill by the texture offset)
function paintKidWindow(w, h, kids, seed) {
  return mtex(w, h, 260, (g, W, H) => {
    kids.forEach(([cx0, s], i) => {
      const cx = cx0 * W, base = 0.0, sk = "#f4b04a", skS = "#c98a38", u = s;
      withT(g, cx, base, 0, u, u, () => {
        eggP(g, 0, 0.17, 0.11, 0.145); fillP(g, sk, 0.006, "#5a3a14");
        g.save(); eggP(g, 0, 0.17, 0.11, 0.145); g.clip(); ellP(g, -0.1, 0.1, 0.09, 0.15); g.fillStyle = rgba(skS, 0.6); g.fill(); g.restore();
        for (const sd of [-1, 1]) withT(g, sd * 0.02, 0.3, sd * 0.5, 1, 1, () => { ellP(g, 0, 0.035, 0.018, 0.04); fillP(g, "#6aa04a", 0.004, "#2a4a22"); });
        for (const sd of [-1, 1]) { ellP(g, sd * 0.04, 0.2, 0.026, 0.032); fillP(g, "#fffaf0", 0.004, "#3a2210"); ellP(g, sd * 0.04 - sd * 0.003 + 0.004, 0.198, 0.013, 0.016); g.fillStyle = "#2a1a10"; g.fill(); ellP(g, sd * 0.034 + 0.004, 0.206, 0.004, 0.004); g.fillStyle = "#fff"; g.fill(); }
        ellP(g, 0, 0.12, 0.022, 0.018); fillP(g, "#7a2a22", 0.004, "#3a1410"); ellP(g, 0, 0.115, 0.012, 0.007); g.fillStyle = "#e0707a"; g.fill();
        for (const sd of [-1, 1]) { ellP(g, sd * 0.07, 0.14, 0.02, 0.012); g.fillStyle = rgba("#e8706a", 0.4); g.fill(); }
        for (const sd of [-1, 1]) { ellP(g, sd * 0.15, 0.1, 0.04, 0.045); fillP(g, sd > 0 ? "#c0302a" : "#2f8f8a", 0.005, "#3a1410"); ellP(g, sd * 0.15 - sd * 0.03, 0.12, 0.017, 0.022); fillP(g, sd > 0 ? "#c0302a" : "#2f8f8a", 0.004, "#3a1410"); }   // mittens on the glass
      });
      cnt("kid");
    });
  }, `kidwin${seed}`);
}
function eggP(g, cx, cy, rx, ry, k = 0.08, n = 40) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a); const x = cx + rx * s * (1 - k * c), y = cy + ry * c; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }

// ---------------------------------------------------------------------------------------------------------------------
// 3D builders. `c` is the build context of one kind instance: c.M(geo, mat, parent, solid, cast, recv), c.reg(mat) (a material the
// `tense` dimming reaches), c.vc / c.vcN (vertex-coloured standard materials, inked / not inked), lists the apply() loop walks.
// ---------------------------------------------------------------------------------------------------------------------
const RT20 = 20 * DEG, S20 = Math.sin(RT20), C20 = Math.cos(RT20), T20 = Math.tan(RT20);
const woodC = (base, seed, v = 0.2) => (x, y, z, nx, ny, nz) => cmul(base, 0.88 + v * hh(seed + Math.floor(x * 9) * 1.3 + Math.floor(y * 9) * 2.1));
const ironC = (x, y, z, nx, ny) => cmix(K.iron, K.ironL, clamp(ny * 0.5 + 0.2) * 0.45 + (hh(x * 71 + y * 53 + z * 31) > 0.93 ? 0.35 : 0));

// a box part list into a Bake: [w, h, d, x, y, z, color]
const boxes = (B, list) => { for (const [w, h, d, x, y, z, col, ry = 0, rz = 0, rx = 0] of list) B.add(boxG(w, h, d, x, y, z, rx, ry, rz), col); return B; };

// ---- the lantern (WROUGHT IRON). origin: the body's centre; the arm runs back to the wall at z -0.24. Returns the group and what apply() needs.
function buildLantern(c, k, T, parent) {
  const g = new THREE.Group(); g.position.set(T.lant, 1.58, 0.24); parent.add(g);
  const Bi = new Bake(), top = 0.12, bot = -0.12, wT = 0.08, wB = 0.06, ay = 0.33;
  // bracket arm 0.24 with 2 C-scrolls, one leaf, 3 collars
  Bi.add(tube([[0, ay, -0.24], [0, ay, -0.12], [0, ay, 0]], 0.0085, 6), ironC);
  Bi.add(boxG(0.05, 0.12, 0.016, 0, ay - 0.04, -0.245), ironC);
  for (const [z0, dir] of [[-0.19, 1], [-0.07, -1]]) Bi.add(tube(arcPts(0, ay - 0.04 * dir * 0 - 0.035, 0.035, 90, 90 + 280 * dir, 14).map(([x, y]) => [0, y, z0 + (x - 0) * 1]), 0.0055, 5), ironC);
  { const lf = new THREE.SphereGeometry(0.02, 8, 6); lf.scale(0.3, 1, 0.55); Bi.add(place(lf, 0, ay - 0.045, -0.12, 0, 0, 0.5), ironC); }
  for (const z of [-0.2, -0.1, -0.01]) Bi.add(place(new THREE.TorusGeometry(0.0105, 0.004, 5, 10), 0, ay, z, 0, Math.PI / 2, 0), ironC);
  // hanging chain-link to the finial, the finial ring, the pyramid cap with 4 vent slots
  Bi.add(place(new THREE.TorusGeometry(0.02, 0.005, 5, 12), 0, top + 0.145, 0, Math.PI / 2, 0, 0), ironC);
  Bi.add(place(new THREE.TorusGeometry(0.014, 0.0045, 5, 10), 0, ay - 0.012, 0, 0, Math.PI / 2, 0), ironC);
  { const cap = new THREE.ConeGeometry(0.1414, 0.1, 4, 1); cap.rotateY(Math.PI / 4); Bi.add(place(cap, 0, top + 0.05 + 0.012, 0), (x, y, z, nx, ny) => cmix(K.iron, K.ironL, clamp(ny) * 0.5)); Bi.add(boxG(0.176, 0.012, 0.176, 0, top + 0.004, 0), ironC);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; Bi.add(boxG(0.034, 0.012, 0.01, Math.sin(a) * 0.056, top + 0.06, Math.cos(a) * 0.056, -0.38 * Math.cos(a), a, 0.38 * Math.sin(a) * 0), K.ironS); } }
  // body: 4 corner bars, a cross bar on each pane, a bottom plate
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bi.add(tube([[sx * wT, top, sz * wT], [sx * wB, bot, sz * wB]], 0.0055, 5), ironC);
  for (const h of [0.5]) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, w = lerp(wB, wT, h); Bi.add(boxG(w * 2, 0.007, 0.007, 0, bot + (top - bot) * h, 0, 0, a, 0, 0).translate(Math.sin(a) * w, 0, Math.cos(a) * w), ironC); }
  Bi.add(boxG(0.13, 0.012, 0.13, 0, bot - 0.004, 0), ironC); Bi.add(place(new THREE.ConeGeometry(0.012, 0.03, 6), 0, bot - 0.022, 0, Math.PI), ironC);
  const iron = c.M(Bi.geo(), c.vc, g, false, true);
  // the amber glass (self-lit), soot on the top fifth of each pane
  { const gg = new THREE.CylinderGeometry(wT * 1.4142, wB * 1.4142, top - bot, 4, 4, true); gg.rotateY(Math.PI / 4); const p = gg.attributes.position, col = new Float32Array(p.count * 3), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const f = (p.getY(i) - bot) / (top - bot); t.set(cmix("#ffcf7a", "#6a4a20", sm((f - 0.78) / 0.2) * 0.85)); col.set([t.r, t.g, t.b], i * 3); } gg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const gm = noLine(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false, side: THREE.DoubleSide })); c.M(gg, gm, g, false, false); }
  // the candle stub and its 5 cm flame (3 painted shapes swapped 8 x a second, two crossed cards)
  c.M(new THREE.CylinderGeometry(0.011, 0.012, 0.05, 8), c.mat("#f4ecd8", { roughness: 0.7, emissive: new THREE.Color("#c8a060"), emissiveIntensity: 0.4 }), g, false, false).position.y = bot + 0.03;
  const fm = noLine(new THREE.MeshBasicMaterial({ map: c.flameTex[0], transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false })), fg = new THREE.Group(); fg.position.y = bot + 0.055; g.add(fg);
  for (const ry of [0, Math.PI / 2]) { const pg = new THREE.PlaneGeometry(0.034, 0.05); pg.translate(0, 0.025, 0); fg.add(steamy(new THREE.Mesh(pg, fm), 6)).rotation.y = ry; }
  // snow on the cap, 3.5 cm, a rounded lip
  { const sn = lathe([[0, 0], [0.1, 0], [0.108, 0.012], [0.1, 0.03], [0.072, 0.038], [0.036, 0.04], [0, 0.036]], 4); sn.rotateY(Math.PI / 4); const B = new Bake().add(place(sn, 0, top + 0.036, 0), (x, y, z, nx, ny) => snowCol(nx, ny, 0)); c.M(B.geo(), c.vcN, g, false, false); }
  // glow card r 0.55 at 0.40, the baked pools r 1.1 on the wall and r 1.6 on the snow
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.glowTex, color: K.flame, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, fog: false, toneMapped: false })); glow.material.userData.noOutline = true; glow.scale.set(1.1, 1.1, 1); glow.position.set(0, 0, 0.05); steamy(glow, 7); g.add(glow);
  const wp = steamy(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), softMat({ map: c.poolTex, color: K.pool, opacity: 0.34, blending: THREE.AdditiveBlending })), 2); wp.position.set(T.lant, 1.58, 0.012); parent.add(wp);
  const sp = steamy(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), softMat({ map: c.poolTex, color: K.pool, opacity: 0.42, blending: THREE.AdditiveBlending })), 2); sp.rotation.x = -Math.PI / 2; sp.position.set(T.lant, 0.007, 0.24); parent.add(sp);
  // 12 fixed snow glints in the pool, each lit for 4 frames every 2-5 s by its hash
  const glints = []; for (let i = 0; i < 12; i++) { const a = H2(k, i + 900) * TAU, r = 0.25 + 1.2 * Math.sqrt(H2(k, i + 910)); glints.push({ x: T.lant + Math.cos(a) * r * 0.95, z: 0.24 + Math.sin(a) * r * 0.8, per: 2 + 3 * H2(k, i + 920), ph: H2(k, i + 930) * 5 }); }
  const gm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.014, 0), noLine(new THREE.MeshBasicMaterial({ color: "#fff0c0", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })), 12); gm.frustumCulled = false; gm.userData.steam = true; gm.userData.solid = false; parent.add(gm);
  cnt("lantern"); cnt("glint", 12);
  return { k, g, fm, fg, glow, wp, sp, glints, gm, a: TAU * H2(k, 940), b: TAU * H2(k, 941), x: T.lant };
}

// ---- a boot for the lane (rubber, felt, leather, fur trim): origin on the step, toe toward +x, height h; opts: col, sole, kind, trim, dots
function buildBoot(c, h, o) {
  const g = new THREE.Group(), B = new Bake(), col = o.col, felt = o.kind === "felt", rub = o.kind === "rubber";
  const sol = o.sole || (rub ? cmul(col, 0.55) : "#2a2420"), sh = (base) => (x, y, z, nx, ny) => cmul(base, 0.78 + 0.28 * clamp(ny * 0.5 + 0.5) + 0.06 * hh(x * 91 + y * 57));
  const wid = felt ? 0.2 : 0.17;   // half-width of the shaft, in h
  const shaft = new THREE.CylinderGeometry(wid * h * 0.95, wid * h * 1.08, 0.66 * h, 14, 3); shaft.scale(1, 1, 0.82); B.add(place(shaft, -0.14 * h, 0.42 * h + 0.04 * h, 0), sh(col));
  const foot = new THREE.SphereGeometry(1, 14, 10); foot.scale(0.5 * h, 0.2 * h, 0.17 * h * (felt ? 1.15 : 1)); B.add(place(foot, 0.12 * h, 0.2 * h, 0), sh(col));
  const toe = new THREE.SphereGeometry(1, 10, 8); toe.scale(0.2 * h, 0.14 * h, 0.15 * h); B.add(place(toe, 0.46 * h, 0.14 * h, 0), sh(col));
  const ank = new THREE.SphereGeometry(1, 10, 8); ank.scale(0.2 * h, 0.2 * h, 0.15 * h); B.add(place(ank, -0.02 * h, 0.22 * h, 0), sh(col));
  const so = new THREE.SphereGeometry(1, 14, 8); so.scale(0.56 * h, 0.055 * h, 0.19 * h * (felt ? 1.1 : 1)); B.add(place(so, 0.14 * h, 0.04 * h, 0), sol);
  B.add(boxG(0.16 * h, 0.07 * h, 0.2 * h, -0.2 * h, 0.04 * h, 0), sol);
  if (o.trim === "fur") { const tr = new THREE.TorusGeometry(wid * h * 1.0, 0.045 * h, 6, 14); tr.rotateX(Math.PI / 2); tr.scale(1, 1, 0.82); B.add(place(tr, -0.14 * h, 0.75 * h + 0.02 * h, 0), (x, y, z) => cmix(o.trimCol || "#f4f1ea", "#cfcbc0", 0.5 * hh(x * 130 + z * 90))); }
  else if (o.trim === "cuff") { const tr = new THREE.CylinderGeometry(wid * h * 1.04, wid * h * 1.04, 0.07 * h, 14, 1, true); tr.scale(1, 1, 0.82); B.add(place(tr, -0.14 * h, 0.72 * h, 0), cmix(col, "#000", 0.2)); }
  const mesh = c.M(B.geo(), c.vc, g, false, true);
  if (o.dots) for (let i = 0; i < o.dots; i++) { const a = (i / o.dots) * TAU * 0.9 + 0.4, yy = 0.26 * h + 0.42 * h * hh(i * 3.3 + 1), d = new THREE.SphereGeometry(0.02 * h, 6, 4); d.scale(1, 1, 0.4); const zsign = i % 2 ? 1 : -1; const m = c.M(d, c.mat("#f4f1ea", { roughness: 0.9 }), g, false, false); m.position.set(-0.14 * h + Math.cos(a * 2) * 0.12 * h, yy, zsign * (wid * 0.82 * h + 0.005 * h)); }
  if (o.laces) for (let i = 0; i < 5; i++) { const m = c.M(boxG(0.012 * h, 0.01 * h, 0.2 * h * 0.8), c.mat("#e9dcc0"), g, false, false); m.position.set(0.12 * h - i * 0.06 * h, 0.27 * h + i * 0.012 * h, 0); }
  if (o.shine) { const m = c.M(new THREE.PlaneGeometry(0.2 * h, 0.07 * h), softMat({ color: "#ffffff", opacity: 0.35 }), g, false, false); m.position.set(-0.14 * h, 0.5 * h, wid * 0.82 * h + 0.01 * h); }
  // the fill: sticks (7 birch twigs) or 5 treats poking out of the top (shown when this door has been visited)
  const fill = new THREE.Group(); g.add(fill);
  if (o.fill === "sticks") { for (let i = 0; i < 7; i++) { const a = (i / 7 - 0.5) * 0.9, L = (0.3 + 0.12 * hh(i * 3 + o.seed)) * 1; const tg = new THREE.CylinderGeometry(0.008, 0.011, L, 5); const m = c.M(tg, c.mat(K.birch, { roughness: 0.8 }), fill, false, false); m.position.set(-0.14 * h + a * 0.22 * h, 0.75 * h + L / 2 - 0.05, (hh(i * 7 + o.seed) - 0.5) * 0.1 * h); m.rotation.set((hh(i * 5.1) - 0.5) * 0.4, 0, -a * 0.8);
    for (let d = 0; d < 3; d++) { const dm = c.M(new THREE.BoxGeometry(0.014, 0.004, 0.003), c.mat(K.birchD), m, false, false); dm.position.set(0, -L * 0.3 + d * L * 0.28, 0.01); } } }
  else if (o.fill === "treats") { const tc = ["#e8801a", "#7a4a26", "#c0302a", "#e2b04a", "#f4ecd8"]; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU, r = i === 4 ? 0 : wid * 0.55 * h; const rr = (0.034 + 0.012 * hh(i + o.seed)) * (h / 0.25); const tg = i === 3 ? new THREE.CylinderGeometry(rr, rr, 0.008, 12) : new THREE.SphereGeometry(rr, 8, 6); const m = c.M(tg, c.mat(tc[i], { roughness: 0.5 }), fill, false, false); m.position.set(-0.14 * h + Math.cos(a) * r, 0.76 * h + 0.012 * (i % 3), Math.sin(a) * r * 0.82); if (i === 3) m.rotation.x = 1.0; } }
  return { g, fill, hasFill: !!o.fill };
}

// ---- small shared pieces ------------------------------------------------------------------------------------------
// a flat rectangle on a wall whose uv runs over the whole picture (X0..X1, Y0..Y1)
function rectUV(xa, xb, ya, yb, X0, X1, Y0, Y1, z = 0) {
  const g = new THREE.PlaneGeometry(xb - xa, yb - ya), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (xa + xb) / 2, y = p.getY(i) + (ya + yb) / 2; uv.setXY(i, (x - X0) / (X1 - X0), (y - Y0) / (Y1 - Y0)); p.setXYZ(i, x, y, z); }
  return g;
}
// a wall face with a door-shaped notch (full height from y0 to ny1) as 2-3 rectangles
function wallParts(X0, X1, Y0, Y1, n0, n1, ny1, z = 0) {
  const parts = []; if (n0 - X0 > 1e-6) parts.push(rectUV(X0, n0, Y0, Y1, X0, X1, Y0, Y1, z)); if (X1 - n1 > 1e-6) parts.push(rectUV(n1, X1, Y0, Y1, X0, X1, Y0, Y1, z));
  if (ny1 < Y1) parts.push(rectUV(n0, n1, ny1, Y1, X0, X1, Y0, Y1, z));
  return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}
// a texture of the dry carved lintel board: rope moulding and 3 six-petal rosettes
function paintLintel(k) {
  return mtex(0.95, 0.20, 300, (g, W, H) => {
    const b = cmul(K.wood, 0.95 + 0.2 * H2(k, 77)); g.fillStyle = b; g.fillRect(0, 0, W, H); grain(g, 0, 0, W, H, k * 9 + 3, b, { lines: 7 });
    for (const [y, dir] of [[0.012, 1], [H - 0.012, -1]]) for (let i = 0; i < 38; i++) { const x = i * W / 38; lineP(g, [[x, y - 0.007], [x + W / 38 * 0.9, y + 0.007]], 0.009, cmul(b, 0.55)); lineP(g, [[x + 0.002, y - 0.007 + 0.002], [x + W / 38 * 0.9 + 0.002, y + 0.007 + 0.002]], 0.003, cmix(b, "#e0b070", 0.45)); }
    for (let r = 0; r < 3; r++) { const cx = W * (0.2 + 0.3 * r), cy = H / 2; for (let p = 0; p < 6; p++) withT(g, cx, cy, p / 6 * TAU, 1, 1, () => { ellP(g, 0, 0.03, 0.017, 0.037); g.fillStyle = cmul(b, 0.5); g.fill(); ellP(g, -0.002, 0.032, 0.014, 0.033); g.fillStyle = cmix(b, "#e8b878", 0.35); g.fill(); lineP(g, [[0, 0.01], [0, 0.055]], 0.002, cmul(b, 0.55)); }); ellP(g, cx, cy, 0.012, 0.012); g.fillStyle = cmul(b, 0.5); g.fill(); ellP(g, cx - 0.001, cy + 0.001, 0.009, 0.009); g.fillStyle = cmix(b, "#e8b878", 0.5); g.fill(); cnt("rosette"); }
  }, `lintel${k}`);
}
const iceMat = (c) => c.ice;
// a snow lump (a lofted ellipsoid with noise), vertex coloured as snow: rx, ry, rz radii; y is the base
function snowLump(rx, ry, rz, x, y, z, seed, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(5, seg - 3)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), n = 1 + 0.09 * Math.sin(px * 5 + seed) * Math.cos(pz * 4 + seed * 1.7) + 0.05 * Math.sin(py * 7 + seed * 2.3); p.setXYZ(i, px * rx * n, Math.max(py, -0.15) * ry * n, pz * rz * n); }
  g.computeVertexNormals(); return place(g, x, y + ry * 0.15, z);
}
const snowC = (x, y, z, nx, ny, nz) => snowCol(nx, ny, nz, y, 0.04 * Math.sin(x * 9 + z * 7));
// a snow cap of depth d on a rail/sill: along x from xa to xb, across z z0..z1 sitting at y0, with end taper and optional sag k(x)
function snowCapX(xa, xb, z0, z1, y0, d, kfn = null, nu = 0) {
  const n = nu || Math.max(8, Math.round((xb - xa) / 0.06));
  return loftX(xa, xb, n, (u, x) => { const e = Math.min(sm(u * (xb - xa) / (0.25 * d + 0.05)), sm((1 - u) * (xb - xa) / (0.25 * d + 0.05))), kk = (kfn ? kfn(x) : 1) * (0.15 + 0.85 * e) * (1 + 0.08 * Math.sin(x * 11 + y0 * 7)); return capProfile(z0, z1, y0, d, kk); }, CAPN);
}

// ---- one ground or upper window: frame, bars, self-lit glass, sill with 6 cm of snow, 2 shutters
function buildWindow(c, hg, k, T, o) {
  const { cx, cy, w, h, lit, upper } = o, g = new THREE.Group(); g.position.set(cx, cy, 0); hg.add(g);
  const tex = paintWindow(k, T, lit, upper), gl = c.M(new THREE.PlaneGeometry(w, h), paintMat(tex), g, false, false); gl.position.z = 0.012;
  const B = new Bake(), cr = K.cream, fw = 0.05, bar = 0.02, d = 0.06;
  boxes(B, [[w, fw, d, 0, h / 2 - fw / 2, d / 2, cr], [w, fw, d, 0, -h / 2 + fw / 2, d / 2, cr], [fw, h, d, -w / 2 + fw / 2, 0, d / 2, cr], [fw, h, d, w / 2 - fw / 2, 0, d / 2, cr]]);
  const rows = upper ? 2 : 3;   // 6 panes (2 x 3) on a ground window, 4 (2 x 2) up
  B.add(boxG(bar, h - 2 * fw, 0.03, 0, 0, 0.03), cr);
  for (let r = 1; r < rows; r++) B.add(boxG(w - 2 * fw, bar, 0.03, 0, -h / 2 + fw + (h - 2 * fw) * r / rows, 0.03), cr);
  const fr = c.M(B.geo(), c.vcN, g, false, true); fr.userData.k = k;
  // the sill with 6 cm of snow
  const sill = c.M(boxG(w + 0.12, 0.04, 0.14, 0, -h / 2 - 0.02, 0.07), c.mat(K.cream, { roughness: 0.8 }), g, false, true);
  const sn = new Bake().add(snowCapX(-(w + 0.08) / 2, (w + 0.08) / 2, 0.0, 0.14, -h / 2, 0.06, null, 16), snowC); c.M(sn.geo(), c.vcN, g, false, false, true);
  cnt(upper ? "win.up" : "win.ground");
  if (lit) {
    cnt("lit");
    const q = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, h * 2.2), softMat({ map: c.poolTex, color: K.win, opacity: 0.3, blending: THREE.AdditiveBlending })), 2); q.position.z = 0.014; g.add(q);
    if (!upper) { const ap = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), softMat({ map: c.poolTex, color: K.pool, opacity: 0.22, blending: THREE.AdditiveBlending })), 2); ap.rotation.x = -Math.PI / 2; ap.position.set(0, 0.008 - cy, 0.75); g.add(ap); }
  }
  // shutters 0.40 x 0.90 flat on the wall (upper: 0.35 x 0.80)
  const stex = c.shutTex[k] || (c.shutTex[k] = paintShutter(k, T)), sx = upper ? 0.35 : 0.40, sy = upper ? 0.80 : 0.90;
  const sideM = c.mat(cmul(T.shut, 0.55), { roughness: 0.8 });
  for (const s of [-1, 1]) {
    const sm_ = [sideM, sideM, sideM, sideM, c.mat("#ffffff", { map: stex, roughness: 0.85 }), sideM], m = c.M(new THREE.BoxGeometry(sx, sy, 0.03), sm_, g, false, true); m.position.set(s * (w / 2 + sx / 2 + 0.02), 0, 0.02);
    if (s < 0) { const t2 = stex.clone(); t2.wrapS = THREE.RepeatWrapping; t2.repeat.x = -1; t2.offset.x = 1; t2.needsUpdate = true; m.material[4] = c.mat("#ffffff", { map: t2, roughness: 0.85 }); }
    cnt("shutter");
  }
  return { g, gl };
}

// ---- an iron strap hinge 0.45 long ending in a split curl (in the door's front plane, from the hinge edge)
function strapHinge() {
  const B = new Bake(), L = 0.45, pts = [[0, -0.022], [L - 0.05, -0.014], [L - 0.05, 0.014], [0, 0.022]];
  B.add(plate(pts, 0.008, 0), ironC); B.add(boxG(0.05, 0.05, 0.012, 0.025, 0, 0), ironC);
  for (const s of [-1, 1]) B.add(tube(arcPts(L - 0.05, s * 0.026, 0.026, s > 0 ? -90 : 90, s > 0 ? 180 : -180, 9).map(([x, y]) => [x, y, 0.006]), 0.0075, 5), ironC);
  for (const x of [0.12, 0.25]) B.add(place(new THREE.ConeGeometry(0.01, 0.01, 4), x, 0, 0.012, Math.PI / 2, 0, Math.PI / 4), ironC);
  return B.geo();
}

// ---- the balcony: 5 S-scroll brackets, floor boards seen from below, 40 baluster boards forming the cut-out shape between each pair, a handrail under snow on 4 chamfered posts, 3 flower boxes
function buildBalcony(c, hg, k, T) {
  const woodM = cmul(K.wood, 1.05), B = new Bake(), Bw = new Bake();
  // underside: boards 1 cm apart (a painted plane facing down) and the front edge board
  const ut = mtex(6.6, 0.6, 100, (g, W, H) => { g.fillStyle = "#2a1c12"; g.fillRect(0, 0, W, H); for (let i = 0; i < 52; i++) { const x = i * W / 52; g.fillStyle = cmul(K.wood, 0.62 + 0.3 * H2(k, i + 800)); g.fillRect(x + 0.006, 0, W / 52 - 0.012, H); grain(g, x + 0.006, 0, W / 52 - 0.012, H, k * 5 + i, K.wood, { horiz: false, lines: 3 }); } }, `under${k}`);
  const up = new THREE.PlaneGeometry(6.6, 0.6); up.rotateX(Math.PI / 2); up.translate(0.7, 2.2, 0.3); const um = c.M(up, paintMat(ut, { side: THREE.FrontSide }), hg, false, false);
  const ug = new THREE.PlaneGeometry(6.6, 0.6); ug.rotateX(-Math.PI / 2); ug.translate(0.7, 2.3, 0.3); c.M(ug, c.mat(cmul(K.wood, 0.9), { roughness: 0.9 }), hg, false, true, true);
  B.add(boxG(6.6, 0.1, 0.05, 0.7, 2.25, 0.575), (x, y, z) => cmul(woodM, 0.8 + 0.3 * hh(Math.floor(x * 4) + k)));
  // 5 brackets: an S-scroll (z, y) with one notch, 0.06 thick
  const bx = [-2.35, -1.25, 1.5, 2.75, 3.75];
  const bs = [[0, 2.2], [0.44, 2.2], [0.46, 2.15], [0.4, 2.1], [0.3, 2.085], [0.25, 2.06], [0.27, 2.02], [0.2, 2.0], [0.13, 2.0], [0.12, 1.96], [0.14, 1.94], [0.1, 1.92], [0.03, 1.93], [0.0, 1.95]];
  for (const x of bx) { const sg = plate(bs.map(([z, y]) => [z, y]), 0.06, 0); sg.rotateY(-Math.PI / 2); sg.translate(x + 0.03, 0, 0); B.add(sg, (X, Y, Z) => cmul(woodM, 0.7 + 0.4 * (Y - 1.9) + 0.1 * hh(Z * 50))); const sc = new THREE.TorusGeometry(0.032, 0.012, 5, 10, Math.PI * 1.5); sc.rotateY(Math.PI / 2); B.add(place(sc, x, 1.985, 0.2, 0, 0, 0), woodM); cnt("bracket"); }
  // 40 baluster boards 0.15 wide at 0.165 pitch: the board edges carry the halves of the cut-out
  const cut = CUT[T.cut], bw = 0.15, pitch = 0.165, bh0 = 2.30, bh1 = 2.96, ymid = 2.30 + 0.38 - cut.h / 2;
  const shape = (left, right) => {
    const s = new THREE.Shape(), xL = -bw / 2, xR = bw / 2, half = cut.half.map(([u, v]) => [u * cut.w, v * cut.h]);
    s.moveTo(xL, bh0); s.lineTo(xR, bh0);
    if (right) { s.lineTo(xR, ymid); for (const [d, y] of half) s.lineTo(xR - d, ymid + y); }
    s.lineTo(xR, bh1); s.lineTo(xL, bh1); if (left) { s.lineTo(xL, ymid + cut.h); for (let i = half.length - 1; i >= 0; i--) s.lineTo(xL + half[i][0], ymid + half[i][1]); }
    s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -0.0125); return g;
  };
  const gMid = shape(true, true), gFirst = shape(false, true), gLast = shape(true, false), x0 = -2.6 + bw / 2 + (6.6 - 39 * pitch - bw) / 2;
  for (let i = 0; i < 40; i++) {
    const g = (i === 0 ? gFirst : i === 39 ? gLast : gMid).clone(), x = x0 + i * pitch, tone = 0.86 + 0.3 * H2(k, i + 810), repair = H2(k, i + 820) < 0.05;
    place(g, x, 0, 0.6); Bw.add(g, (X, Y, Z, nx, ny, nz) => cmul(repair ? K.repair : woodM, tone * (0.92 + 0.1 * Math.sin(X * 90 + i))));
    cnt("baluster");
  }
  cnt("cutout", 39);
  // handrail 0.10 x 0.06, 4 chamfered posts, snow 10 cm sagging between the posts
  B.add(boxG(6.6, 0.06, 0.1, 0.7, 2.99, 0.6), (x) => cmul(woodM, 0.85 + 0.2 * hh(Math.floor(x * 3))));
  const px = [-2.52, -0.33, 1.87, 3.9]; for (const x of px) { const p = new THREE.CylinderGeometry(0.046, 0.046, 0.72, 8); p.rotateY(Math.PI / 8); B.add(place(p, x, 2.66, 0.6), woodM); B.add(place(new THREE.ConeGeometry(0.052, 0.05, 8), x, 3.045, 0.6), cmul(woodM, 0.8)); cnt("post"); }
  for (const x of [-2.6, 4.0]) { B.add(boxG(0.05, 0.05, 0.6, x, 2.99, 0.3), woodM); B.add(boxG(0.04, 0.04, 0.6, x, 2.55, 0.3), woodM); }
  const rail = new Bake().add(snowCapX(-2.62, 4.02, 0.52, 0.68, 3.02, 0.10, (x) => { let m = 1; for (let i = 0; i < 3; i++) { const a = px[i], b = px[i + 1]; if (x >= a && x <= b) m = 1 - 0.3 * Math.pow(Math.sin(Math.PI * (x - a) / (b - a)), 2); } return m; }, 130), snowC);
  c.M(B.geo(), c.vc, hg, false, true); c.M(Bw.geo(), c.vc, hg, false, true); c.M(rail.geo(), c.vcN, hg, false, false, true);
  // 3 flower boxes 1.2 long: snow, 5 fir sprigs and 9 red berries each
  const Bf = new Bake(), Bs = new Bake(), Br = new Bake();
  [-1.35, 0.95, 3.05].forEach((fx, bi) => {
    boxes(Bf, [[1.2, 0.17, 0.16, fx, 2.86, 0.74, (x, y, z, nx, ny) => cmul(woodM, 0.8 + 0.2 * ny)], [0.06, 0.1, 0.06, fx - 0.55, 2.98, 0.64, woodM]]);
    Bs.add(snowCapX(fx - 0.58, fx + 0.58, 0.67, 0.81, 2.945, 0.045, null, 20), snowC);
    for (let s = 0; s < 5; s++) { const sx = fx - 0.46 + s * 0.23 + (H2(k * 3 + bi, s + 830) - 0.5) * 0.05, hgt = 0.16 + 0.07 * H2(k + bi, s + 840), cone = new THREE.ConeGeometry(0.06 + 0.02 * H2(s, k), hgt, 6, 1); cone.rotateZ((H2(bi, s + k) - 0.5) * 0.5); Bf.add(place(cone, sx, 2.95 + hgt / 2, 0.74 + (H2(s, bi + k) - 0.5) * 0.04), (x, y) => cmix(K.firS, K.fir, clamp((y - 2.95) / 0.2))); cnt("sprig"); }
    for (let b = 0; b < 9; b++) { Br.add(place(new THREE.SphereGeometry(0.0115, 6, 5), fx - 0.5 + (b + 0.5) * (1.0 / 9) + (H2(bi * 9 + b, k) - 0.5) * 0.03, 2.98 + 0.06 * H2(b, bi + k * 2), 0.8 + (H2(b + bi, k + 3) - 0.5) * 0.04), cmix("#a3232b", "#cf4a44", H2(b, k))); cnt("berry"); }
  });
  c.M(Bf.geo(), c.vcN, hg, false, true); c.M(Bs.geo(), c.vcN, hg, false, false, true); c.M(Br.geo(), c.vcN, hg, false, false);
}

// ---- eave and roof: 11 rafter tails with a scroll end, a fascia of 33 scallops, 38 icicles, 20 degree roof under 0.45 of snow (lip 0.10 over the eave, sagging 3 cm between rafters,
// 2 old slide scars with 6 rows of grey shingles), a stone chimney with a smoke wisp
const RL = 4.3 / C20;   // slope length, ridge to eave
const roofPt = (x, sig, h, side = 1) => [x, 5.16 - sig * S20 + h * C20, side > 0 ? -3.2 + sig * C20 + h * S20 : -3.2 - (sig * C20 + h * S20)];
function paintShingles(k, n) {
  return mtex(1.2, 1.4, 120, (g, W, H) => {
    g.fillStyle = "#2c2418"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 6; r++) { const y0 = r * (H / 6), hr = H / 6, off = (r % 2) * 0.07; for (let i = -1; i < 9; i++) { const x0 = i * 0.14 + off, c = cmul("#7a808c", 0.7 + 0.5 * H2(k * 7 + n, r * 11 + i)); polyP(g, [[x0 + 0.005, y0 + hr + 0.02], [x0 + 0.135, y0 + hr + 0.02], [x0 + 0.135, y0 + 0.05], [x0 + 0.07, y0 + 0.012 + 0.02 * H2(r, i + k)], [x0 + 0.005, y0 + 0.05]]); fillP(g, c, 0.004, "#1a1610"); lineP(g, [[x0 + 0.03, y0 + hr], [x0 + 0.03, y0 + 0.09]], 0.002, rgba("#1a1610", 0.5)); } cnt("shingle.row"); }
    for (let i = 0; i < 12; i++) { ellP(g, H2(k, i + 1000) * W, H2(k, i + 1010) * H, 0.05 + 0.05 * H2(i, k), 0.02 + 0.03 * H2(k, i), 0); g.fillStyle = rgba("#e8f0fb", 0.8); g.fill(); }
  }, `shingle${k}${n}`);
}
function paintStoneBox(w, h, ppm, seed, per) { return mtex(w, h, ppm, (g) => { stoneField(g, 0, 0, w, h, seed, { rows: per.length, per, point: K.lime, snow: 0.12 }); }, `sb${seed}`); }

function buildRoof(c, hg, k, T, slab) {
  const x0 = -3.0, x1 = 4.4, scarX = [-2.4 + 1.1 * H2(k, 1100), 1.5 + 1.6 * H2(k, 1101)], scarS = [1.1 + 0.8 * H2(k, 1102), 1.5 + 0.9 * H2(k, 1103)];
  // the deck (old boards, under the snow) front and back, the gable triangles
  const dm = c.mat("#2a2016", { roughness: 0.95, side: THREE.DoubleSide });
  c.M(surf(1, 1, (u, v) => roofPt(lerp(x0, x1, u), -0.2 + v * (RL + 0.2), -0.005)), dm, hg, false, true);
  c.M(surf(1, 1, (u, v) => roofPt(lerp(x0, x1, u), -0.2 + v * (RL + 0.2), -0.005, -1)), dm, hg, false, true);
  for (const x of [-2.6, 4.0]) { const gt = new THREE.BufferGeometry(); const a = [x, 4.0, 0.0], b = [x, 4.0, -6.4], t = [x, 5.16, -3.2]; gt.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...t], 3)); gt.computeVertexNormals(); c.M(gt, c.mat(K.woodB, { side: THREE.DoubleSide, roughness: 0.9 }), hg, false, true); }
  // rafters: 11 tails, 0.10 x 0.14, from the wall plate out to the eave, a carved scroll end
  const Bt = new Bake(), tail = (() => { const pts = [[0, 0], [1.2, 0], [1.27, 0.015], [1.31, 0.055], [1.29, 0.1], [1.23, 0.127], [1.17, 0.14], [0, 0.14]]; const g = plate(pts, 0.1, 0); g.translate(0, 0, 0.05); const sc = new THREE.TorusGeometry(0.036, 0.013, 5, 10, Math.PI * 1.6); sc.translate(1.3, 0.0, 0); return [g, sc]; })();
  for (let i = 0; i < 11; i++) {
    const x = -2.5 + 0.65 * i, a = tail[0].clone(), b = tail[1].clone(); for (const gg of [a, b]) { gg.rotateX(0); } const m = new THREE.Matrix4().compose(new V3(x, 4.07, -0.12), new THREE.Quaternion().setFromEuler(new THREE.Euler(RT20, 0, 0)), new V3(1, 1, 1)); a.applyMatrix4(m); b.applyMatrix4(m);
    const f = (X, Y, Z, nx, ny) => cmul(K.woodB, 0.95 + 0.3 * hh(i * 3 + k) + 0.2 * ny); Bt.add(a, f); Bt.add(b, f); cnt("tail");
  }
  // the fascia board 0.16 tall with 33 scallops along its lower edge, 0.03 thick, hung at the eave
  { const n = 33, xa = -3.0, xb = 4.4, p = (xb - xa) / n, pts = [[xa, 0.16], [xb, 0.16]]; for (let i = n - 1; i >= 0; i--) for (let u = 0; u <= 6; u++) { const t = u / 6; pts.push([xa + p * (i + 1 - t), 0.05 - 0.05 * Math.sin(Math.PI * t)]); } pts.push([xa, 0.16]);
    const cl = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 1e-5); const fg = plate(cl, 0.03, 0); fg.translate(0, 3.44, 1.13);
    Bt.add(fg, (X, Y, Z, nx, ny, nz) => cmul(K.wood, (0.7 + 0.2 * hh(Math.floor(X * 6) + k)) * (nz > 0.5 ? 1.0 : 0.8))); cnt("scallop", n); }
  c.M(Bt.geo(), c.vc, hg, false, true);
  // 38 icicles from the fascia: 0.08-0.45 long, never 3 neighbours of one length, the longest over the downhill corner
  { const n = 38, ls = []; for (let i = 0; i < n; i++) { let L = 0.08 + 0.37 * Math.pow(H2(k, i + 1200), 1.7); while (i >= 2 && Math.abs(L - ls[i - 1]) < 0.012 && Math.abs(L - ls[i - 2]) < 0.012) L += 0.03; ls.push(Math.min(0.43, L)); }
    ls[34] = 0.45; const xs = []; for (let i = 0; i < n; i++) xs.push(-2.9 + (i + 0.5 + (H2(k, i + 1210) - 0.5) * 0.7) * (7.2 / n));
    xs[34] = 3.95; for (let i = 0; i < n; i++) { c.ices.push({ k, i, x: hg.position.x + xs[i], y: hg.position.y + 3.47 + 0.01 * H2(k, i), z: 1.12 + (H2(k, i + 1220) - 0.5) * 0.04, L: ls[i], r: 0.016 + 0.03 * ls[i], hx: xs[i] }); cnt("icicle"); } }
  // roof snow: a heightfield loft along x (lip, sag, scars); for the `shake` house the 1.6 m of lip is a separate slab
  const Bs = new Bake(), L = RL, ov = 0.10, NT = 44, rPt = [];
  const th = (x, sig) => {
    let t = 0.45 * (1 + 0.06 * (vn(x, sig, k, 1.7, 3) - 0.5) + 0.05 * Math.sin(x * 2.3 + sig * 1.1 + k));
    t -= 0.03 * Math.pow(Math.sin(Math.PI * (x + 2.5) / 0.65), 2) * sm((sig - (L - 1.6)) / 1.6);   // 3 cm sag between the rafters
    for (let s = 0; s < 2; s++) t *= 1 - sm((x - scarX[s]) / 0.06) * sm((scarX[s] + 1.2 - x) / 0.06) * sm((sig - scarS[s]) / 0.12) * sm((scarS[s] + 1.4 - sig) / 0.12);
    return t;
  };
  const profile = (x, sig0, sig1, lip, kE) => {
    const out = [], r0 = 0.4 * 0.45;
    for (let j = 0; j < NT; j++) { const sg = lerp(sig0, sig1 - (lip ? r0 : 0), j / (NT - 1)); out.push([sg, th(x, sg) * kE * (j === 0 ? 0.0 + 1 : 1)]); }
    const tt = th(x, sig1) * kE;
    if (lip) { const r = 0.4 * tt, cs = sig1 + ov - r, ch = tt - r; for (let i = 0; i <= 8; i++) { const a = (90 - i * (150 / 8)) * DEG; out.push([cs + r * Math.cos(a), ch + r * Math.sin(a)]); } out.push([cs + 0.12 * r, Math.max(0.0, ch - r)], [sig1 - 0.04, 0]); }
    else { out.push([sig1, tt * 0.9], [sig1 - 0.02, tt * 0.7], [sig1 - 0.04, tt * 0.5], [sig1 - 0.06, tt * 0.3], [sig1 - 0.07, tt * 0.15], [sig1 - 0.07, 0], [sig1 - 0.07, 0], [sig1 - 0.07, 0], [sig1 - 0.07, 0], [sig1 - 0.07, 0], [sig1 - 0.07, 0]); }
    return out;
  };
  const NP = NT + 11, kEnd = (x) => 0.18 + 0.82 * sm(Math.min(x - x0, x1 - x) / 0.45);
  const loft = (xa, xb, sig0, sig1, lip, side, caps, nu) => loftX(xa, xb, nu ?? Math.max(4, Math.round((xb - xa) / 0.06)), (u, x) => profile(x, sig0, sig1, lip, kEnd(x)).map(([sg, h]) => { const p = roofPt(x, sg, h, side); return [p[2], p[1]]; }), NP, caps);
  const sc = (g) => Bs.add(g, (X, Y, Z, nx, ny, nz) => { const c0 = snowCol(nx, ny, nz); return Y > 5.5 ? cmix(c0, "#ffffff", 0.35) : c0; });
  sc(loft(x0, x1, -0.25, RL, true, -1, false)); // the back slope (no scars)
  if (slab) { const a = -0.8, b = 0.8; sc(loft(x0, a, -0.2, RL, true, 1, true)); sc(loft(b, x1, -0.2, RL, true, 1, true)); sc(loft(a, b, -0.2, RL - 0.5, false, 1, true, 28)); }
  else sc(loft(x0, x1, -0.2, RL, true, 1, false));
  const roofM = c.M(Bs.geo(), c.vcSnow, hg, false, false, true); roofM.userData.roof = true;
  if (slab) { const Bq = new Bake(); Bq.add(loftX(-0.8, 0.8, 28, (u, x) => { const tt = th(x, L), r = 0.4 * tt, o = [], s0 = L - 0.5; for (let j = 0; j < 8; j++) { const sg = lerp(s0, L - r, j / 7); o.push([sg, th(x, sg)]); } const cs = L + ov - r, ch = tt - r; for (let i = 0; i <= 8; i++) { const a = (90 - i * (150 / 8)) * DEG; o.push([cs + r * Math.cos(a), ch + r * Math.sin(a)]); } o.push([cs + 0.12 * r, Math.max(0, ch - r)], [L - 0.04, 0], [s0, 0], [s0, 0], [s0, 0]); return o.slice(0, 8 + 9 + 5).map(([sg, h]) => { const p = roofPt(x, sg, h, 1); return [p[2], p[1]]; }); }, 22, true), (X, Y, Z, nx, ny, nz) => snowCol(nx, ny, nz));
    const sm_ = c.M(Bq.geo(), c.vcSnow, hg, false, true, true); c.slab = { g: sm_, hg, lumps: null }; }
  // the shingle patches of the 2 slide scars (6 rows each)
  for (let s = 0; s < 2; s++) { const sh = c.M(surf(1, 1, (u, v) => roofPt(scarX[s] + 1.2 * u, scarS[s] + 1.4 * v, 0.012)), paintMat(paintShingles(k, s), { side: THREE.DoubleSide }), hg, false, false); }
  // the stone chimney 0.5 x 0.5 at (1.6, -2.0), 0.9 out of the snow, capped; its smoke wisp is drawn by apply()
  { const yb = roofPt(1.6, (-2.0 + 3.2) / C20, 0)[1] - 0.15, yt = roofPt(1.6, (-2.0 + 3.2) / C20, 0.45)[1] + 0.9, hh2 = yt - yb;
    const tex = paintStoneBox(0.5, hh2, 90, k * 5 + 1, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3].slice(0, Math.max(5, Math.round(hh2 / 0.2))));
    const sm2 = c.mat("#ffffff", { map: tex, roughness: 0.95 }); const bx = c.M(new THREE.BoxGeometry(0.5, hh2, 0.5), sm2, hg, true, true); bx.position.set(1.6, yb + hh2 / 2, -2.0);
    const Bc = new Bake(); Bc.add(boxG(0.64, 0.07, 0.64, 1.6, yt + 0.035, -2.0), (x, y, z, nx, ny) => cmix(K.stoneS, K.stone, clamp(ny + 0.3))); for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bc.add(boxG(0.1, 0.09, 0.1, 1.6 + sx * 0.22, yt - 0.04, -2.0 + sz * 0.22), K.stone);
    Bc.add(snowCapX(1.28, 1.92, -2.3, -1.7, yt + 0.07, 0.12, null, 14), snowC); const fl = new THREE.PlaneGeometry(0.24, 0.24); fl.rotateX(-Math.PI / 2); Bc.add(place(fl, 1.6, yt + 0.071, -2.0), K.ironS);
    c.M(Bc.geo(), c.vcN, hg, false, true, true); c.chims.push({ k, x: hg.position.x + 1.6, y: hg.position.y + yt + 0.12, z: -2.0 }); cnt("chimney"); }
}

// ---- the log ends at the corners: 9 courses x 2 corners standing 0.12 proud, each end with 4-6 rings and one radial check (an atlas of 6 x 4 cells)
function buildCornerEnds(c, hg, k) {
  const CW = 64, tex = canvasTex(6 * CW, 4 * CW, (g, W, H) => {
    g.fillStyle = cmul(K.wood, 0.9); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const cx = (i % 6) * CW + CW / 2, cy = Math.floor(i / 6) * CW + CW / 2, base = cmul(K.wood, 0.95 + 0.35 * H2(k, i + 1300));
      g.fillStyle = base; g.fillRect(cx - CW / 2, cy - CW / 2, CW, CW);
      const n = 4 + Math.floor(H2(k, i + 1310) * 3), ox = (H2(k, i + 1320) - 0.5) * 6, oy = (H2(k, i + 1330) - 0.5) * 6;
      g.save(); g.beginPath(); g.rect(cx - CW / 2, cy - CW / 2, CW, CW); g.clip();
      for (let r = n; r >= 1; r--) { g.beginPath(); g.arc(cx + ox, cy + oy, r * (CW * 0.62 / n), 0, TAU); g.strokeStyle = rgba(cmul(base, 0.5), 0.9); g.lineWidth = 1.4; g.stroke(); if (r % 2) { g.fillStyle = rgba(cmul(base, 0.82), 0.5); g.fill(); } }
      const a = H2(k, i + 1340) * TAU; g.beginPath(); g.moveTo(cx + ox, cy + oy); g.lineTo(cx + ox + Math.cos(a) * CW * 0.6, cy + oy + Math.sin(a) * CW * 0.6); g.strokeStyle = "#1a0e06"; g.lineWidth = 2; g.stroke();
      g.restore(); g.strokeStyle = "#1a0e06"; g.lineWidth = 1.5; g.strokeRect(cx - CW / 2 + 1, cy - CW / 2 + 1, CW - 2, CW - 2);
    }
  }, `ends${k}`, 4);
  const parts = []; let n = 0;
  for (const sd of [0, 1]) for (let r = 0; r < 9; r++, n++) {
    const g = new THREE.BoxGeometry(0.2, 0.2, 0.12), uv = g.attributes.uv, cell = n, u0 = (cell % 6) / 6, v0 = 1 - (Math.floor(cell / 6) + 1) / 4;
    for (let i = 0; i < uv.count; i++) { const face = Math.floor(i / 4); if (face === 4) uv.setXY(i, u0 + uv.getX(i) / 6, v0 + uv.getY(i) / 4); else uv.setXY(i, 17 / 6 % 1 * 0 + 5 / 6 + 0.01 + uv.getX(i) * 0.02, 0.01 + uv.getY(i) * 0.02); }
    g.translate(sd ? 3.9 : -2.5, 0.4 + 0.21 * r + 0.105, 0.06); parts.push(g); cnt("logend");
  }
  c.M(mergeGeometries(parts), c.mat("#ffffff", { map: tex, roughness: 0.95 }), hg, true, true);
}

// ---- the house: plinth, walls, door, windows, balcony, eave, roof, lantern; returns what apply() needs
function buildHouse(c, k) {
  const T = HT[k], hg = new THREE.Group(); hg.position.set(xk(k), Yk(k), 0); c.root.add(hg);
  const gT = c.mat("#ffffff", { map: paintGround(k, T), roughness: 0.92 }), uT = c.mat("#ffffff", { map: paintUpper(k), roughness: 0.92 });
  const dn0 = -0.475, dn1 = 0.475;
  // plinth: rubble stone with lime pointing, about 60 stones showing; a ledge; the door cuts through
  { const tex = mtex(6.6, 0.4, 200, (g, W, H) => { const n = stoneField(g, 0, 0, W, H, k * 17 + 2, { rows: 4, per: [15, 15, 15, 15], tone: K.stone, point: K.lime, snow: 0.2 }); cnt("pstone", n); }, `plinth${k}`);
    c.M(wallParts(-2.6, 4.0, 0, 0.4, dn0, dn1, 0.4, 0.05), c.mat("#ffffff", { map: tex, roughness: 0.95 }), hg, true, true); for (const [xa, xb] of [[-2.6, dn0 - 0.14], [dn1 + 0.14, 4.0]]) c.M(boxG(xb - xa, 0.025, 0.09, (xa + xb) / 2, 0.4125, 0.045), c.mat(K.stone, { roughness: 0.9 }), hg, false, true, true); }
  c.M(wallParts(-2.6, 4.0, 0.4, 2.3, dn0, dn1, 1.7, 0), gT, hg, true, true);
  c.M(wallParts(-2.6, 4.0, 2.3, 4.0, -0.375, 0.375, 3.75, 0), uT, hg, true, true);
  buildCornerEnds(c, hg, k);
  // the door's reveal (0.2 deep), the dark behind it (door 4 has its hall instead), the threshold stone 0.06
  { const B = new Bake(); boxes(B, [[0.04, 1.7, 0.2, dn0 - 0.02, 0.85, -0.1, K.woodS], [0.04, 1.7, 0.2, dn1 + 0.02, 0.85, -0.1, K.woodS], [0.99, 0.05, 0.2, 0, 1.725, -0.1, K.woodS], [1.14, 0.06, 0.34, 0, 0.03, 0.0, (x, y, z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny) * 0.5)]]); c.M(B.geo(), c.vcN, hg, false, true); }
  if (k !== 4) { const dk = c.M(new THREE.PlaneGeometry(0.95, 1.7), noLine(new THREE.MeshBasicMaterial({ color: "#0c0806" })), hg, false, false); dk.position.set(0, 0.85, -0.2); }
  // balcony door in the upper wall 0.75 x 1.45
  { const lt = c.M(new THREE.PlaneGeometry(0.75, 1.45), c.mat("#ffffff", { map: paintDoor(k + 30), roughness: 0.9 }), hg, false, true); lt.position.set(0, 3.025, 0.012); const B = new Bake(); boxes(B, [[0.07, 1.5, 0.06, -0.41, 3.025, 0.03, K.woodS], [0.07, 1.5, 0.06, 0.41, 3.025, 0.03, K.woodS], [0.89, 0.08, 0.06, 0, 3.79, 0.03, K.woodS], [0.89, 0.04, 0.08, 0, 2.32, 0.04, K.woodS]]); c.M(B.geo(), c.vcN, hg, false, true);
    const kn = c.M(new THREE.SphereGeometry(0.02, 6, 5), c.mat(K.iron), hg, false, false); kn.position.set(0.28, 3.0, 0.05); }
  // door frame 0.14, lintel board 0.95 x 0.20 with 3 rosettes and a rope moulding, painted vine jambs on 9 and 4
  { const B = new Bake(), fm = (x, y, z, nx, ny, nz) => cmul(K.wood, 0.9 + 0.2 * hh(Math.floor(y * 8) + k)) ; boxes(B, [[0.14, 1.84, 0.08, -0.545, 0.92, 0.04, fm], [0.14, 1.84, 0.08, 0.545, 0.92, 0.04, fm], [1.23, 0.14, 0.08, 0, 1.77, 0.04, fm], [1.3, 0.05, 0.12, 0, 2.065, 0.06, (x, y, z, nx, ny) => cmul(K.wood, 0.8 + 0.3 * ny)]]);
    for (const sx of [-1, 1]) for (const [ya, yb] of [[0, 1.7]]) B.add(boxG(0.012, 1.7, 0.012, sx * 0.475 + (sx < 0 ? 0.0 : 0) , 0.85, 0.083), K.woodB);   // the 1 cm chamfer line on each post
    c.M(B.geo(), c.vcN, hg, false, true);
    const lin = c.M(new THREE.BoxGeometry(0.95, 0.2, 0.05), [c.vcM(K.woodS), c.vcM(K.woodS), c.vcM(K.wood), c.vcM(K.woodS), c.mat("#ffffff", { map: paintLintel(k), roughness: 0.9 }), c.vcM(K.woodS)], hg, false, true); lin.position.set(0, 1.94, 0.055);
    if (T.vine) for (const s of [-1, 1]) { const jm = c.M(new THREE.PlaneGeometry(0.12, 1.4), c.mat("#ffffff", { map: paintJamb(k, s > 0), roughness: 0.9 }), hg, false, true); jm.position.set(s * 0.545, 0.78, 0.082); } }
  // the door leaf (hinge at x -0.475, swings into the house): 5 planks, 2 strap hinges, lock plate with a keyhole and lever handle, 22 nails, the plaque
  const piv = new THREE.Group(); piv.position.set(dn0, 0, -0.02); hg.add(piv); const lf = new THREE.Group(); lf.position.set(0.475, 0, 0); piv.add(lf);
  { const sd = c.vcM(K.woodS), face = c.mat("#ffffff", { map: paintDoor(k), roughness: 0.9 }), back = c.mat("#ffffff", { map: paintDoor(k, true), roughness: 0.9 }); const bm = c.M(new THREE.BoxGeometry(0.95, 1.7, 0.05), [sd, sd, sd, sd, face, back], lf, false, true); bm.position.set(0, 0.85, -0.025); bm.userData.leaf = true;
    const Bi = new Bake(); for (const y of [0.34, 1.34]) { const sg = strapHinge(); place(sg, -0.475 + 0.0, y, 0.003); Bi.add(sg, ironC); }
    Bi.add(boxG(0.05, 0.22, 0.01, 0.405, 0.95, 0.005), ironC); Bi.add(boxG(0.008, 0.026, 0.004, 0.405, 0.97, 0.011), K.ironS); Bi.add(place(new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 6), 0.405, 0.945, 0.011, Math.PI / 2), K.ironS);
    Bi.add(place(new THREE.CylinderGeometry(0.015, 0.015, 0.014, 8), 0.4, 1.02, 0.016, Math.PI / 2), ironC); Bi.add(boxG(0.13, 0.014, 0.014, 0.34, 1.02, 0.022), ironC); Bi.add(place(new THREE.SphereGeometry(0.014, 6, 5), 0.275, 1.02, 0.022), ironC);
    if (k === 9) { Bi.add(boxG(0.1, 0.12, 0.012, 0, 1.58, 0.005), ironC); Bi.add(place(new THREE.TorusGeometry(0.045, 0.008, 6, 16), 0, 1.54, 0.024), ironC); Bi.add(place(new THREE.SphereGeometry(0.014, 6, 5), 0, 1.6, 0.02), ironC); cnt("knocker"); }
    c.M(Bi.geo(), c.vcN, lf, false, true);
    const nail = new THREE.ConeGeometry(0.0125, 0.012, 4); nail.rotateX(Math.PI / 2); nail.rotateZ(Math.PI / 4); const ni = new THREE.InstancedMesh(nail, c.mat(K.iron, { roughness: 0.5, metalness: 0.2 }), 22), d = new THREE.Object3D();
    let n = 0; for (const y of [0.34 + 0.4, 1.34 - 0.18]) for (let i = 0; i < 11; i++, n++) { d.position.set(-0.4 + i * 0.08, y + 0.0, 0.002); d.rotation.set(0, 0, 0); d.scale.setScalar(0.9 + 0.2 * H2(k, n + 1400)); d.updateMatrix(); ni.setMatrixAt(n, d.matrix); cnt("nail"); } ni.userData.solid = false; lf.add(ni);
    // the plaque: a limewood shield 0.30 x 0.34, 5 scallops a side, relief 1.5 cm, 1.2 cm of snow on the top edge
    const pts = []; const W = 0.15, Hh = 0.17; pts.push([-W, Hh], [W, Hh]);
    for (let i = 0; i < 5; i++) for (let u = 1; u <= 4; u++) { const y0 = Hh - i * 0.054, t = u / 4; pts.push([W - 0.012 * Math.sin(Math.PI * t) * 0 + 0.0 + 0.007 * Math.sin(Math.PI * t), y0 - 0.054 * t]); }
    pts.push([0.075, -0.145], [0, -Hh], [-0.075, -0.145]);
    for (let i = 4; i >= 0; i--) for (let u = 4; u >= 1; u--) { const y0 = Hh - i * 0.054, t = u / 4; pts.push([-W - 0.007 * Math.sin(Math.PI * t), y0 - 0.054 * t]); }
    const clean = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 1e-5), pg = plate(clean, 0.015, 0, 1);
    const pm = new THREE.Mesh(pg, [c.mat("#ffffff", { map: paintPlaque(k, T), roughness: 0.7 }), c.mat(K.woodS, { roughness: 0.8 })]); { const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 0.15) / 0.30, (uv.getY(i) + 0.17) / 0.34); }
    pm.position.set(0, 1.22, 0.003 + 0.015); pm.castShadow = true; lf.add(pm); cnt("plaque");
    const sn = new Bake().add(snowCapX(-0.15, 0.15, 0.0, 0.03, 1.39, 0.012, null, 10), snowC); c.M(sn.geo(), c.vcN, lf, false, false).position.set(0, 0, 0.003 + 0.01);
    if (k === 5) { const Bw = new Bake(); const R = 0.26, wg = new THREE.TorusGeometry(R, 0.045, 7, 36); Bw.add(place(wg, 0, 1.22, 0.04), (x, y, z) => cmix(K.firS, K.fir, hh(x * 50 + y * 70))); for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; Bw.add(place(new THREE.ConeGeometry(0.02, 0.07, 4), Math.cos(a) * R, 1.22 + Math.sin(a) * R, 0.06, Math.cos(a) * 0 + Math.PI / 2, 0, a - Math.PI / 2), K.firS); }
      for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i / 5) * TAU; Bw.add(place(new THREE.SphereGeometry(0.032, 8, 6), Math.cos(a) * R, 1.22 + Math.sin(a) * R, 0.085), cmix("#a3232b", "#cf4a44", H2(i, k))); cnt("apple"); } c.M(Bw.geo(), c.vcN, lf, false, true); } }
  // the windows: the ground window at x -1.55 (sill 0.95), two upper ones (sill 2.95); the upper ones named in the table are lit
  const win = buildWindow(c, hg, k, T, { cx: -1.55, cy: 1.40, w: 0.80, h: 0.90, lit: true, upper: false });
  const upX = [-1.7, 2.1];
  const ups = upX.map((x, i) => buildWindow(c, hg, k, T, { cx: x, cy: 3.35, w: 0.70, h: 0.80, lit: !!T.up[i], upper: true }));
  const lant = buildLantern(c, k, T, hg);
  buildBalcony(c, hg, k, T);
  buildRoof(c, hg, k, T, c.shakeAt === k);
  // the flagstone apron: top at y 0, x -2.6..4.0, z 0..1.9; its front edge is a dry-stone step: flush at the uphill end, 0.16 at the landing, 0.60 downhill with 3 stone steps
  { const g = new THREE.PlaneGeometry(6.6, 1.9); g.rotateX(-Math.PI / 2); g.translate(0.7, 0, 0.95); const ap = c.M(g, c.mat("#ffffff", { map: paintApron(k), roughness: 0.95 }), hg, false, true, true);
    const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 2.6) / 6.6, p.getZ(i) / 1.9);
    // the retaining face: z 1.9, from the apron's top down to the lane
    const xs = [-2.6, -1.8, 1.8, 4.0], face = surf(40, 1, (u, v) => { const x = lerp(-2.6, 4.0, u), ly = laneY(xk(k) + x) - Yk(k); return [x, lerp(0, Math.min(0, ly), v), 1.9]; }, (u, v) => [u, v]);
    const ft = mtex(6.6, 0.9, 80, (g2, W, H) => { stoneField(g2, 0, 0, W, H, k * 13 + 7, { rows: 5, sw: 0.4, tone: K.stone, point: "dark", snow: 0.35 }); }, `face${k}`);
    // flip the strip so the picture's top is the apron top: v = 1 at the top
    const fp = face.attributes.uv; for (let i = 0; i < fp.count; i++) fp.setY(i, 1 - fp.getY(i));
    c.M(face, c.mat("#ffffff", { map: ft, roughness: 0.95, side: THREE.DoubleSide }), hg, true, true);
    // the downhill end face (x 4.0) and the 3 stone steps
    const eg = surf(1, 1, (u, v) => [4.0, lerp(0, laneY(xk(k) + 4.0) - Yk(k), v), lerp(0, 1.9, u)]); c.M(eg, c.mat(K.stoneS, { roughness: 0.95, side: THREE.DoubleSide }), hg, true, true);
    const Bst = new Bake(); for (let i = 0; i < 3; i++) { const top = -0.4 + 0.2 * i, dpt = 0.9 - 0.28 * i; Bst.add(place(new THREE.BoxGeometry(1.3, top + 0.9, dpt), 3.2, (top - 0.9) / 2, 1.9 + dpt / 2), (x, y, z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny) * 0.55 + 0.15 * hh(Math.floor(x * 5) + i + k))); Bst.add(snowCapX(2.6, 3.8, 1.9 + dpt - 0.18, 1.9 + dpt + 0.0, top, 0.04, null, 10), snowC); }
    c.M(Bst.geo(), c.vcN, hg, true, true, true); }
  // iron boot scrapers each side of the door (a blade on two stakes), snow banked 0.25 on the plinth except 1.4 m swept by the door
  { const B = new Bake(); for (const x of [-0.82, 0.82]) { B.add(boxG(0.26, 0.07, 0.014, x, 0.2, 0.14), ironC); for (const s of [-1, 1]) B.add(boxG(0.016, 0.22, 0.016, x + s * 0.11, 0.11, 0.14), ironC); B.add(boxG(0.014, 0.014, 0.1, x - 0.11, 0.2, 0.09), ironC); B.add(boxG(0.014, 0.014, 0.1, x + 0.11, 0.2, 0.09), ironC); cnt("scraper"); } c.M(B.geo(), c.vcN, hg, false, true); }
  { const Bn = new Bake(), segs = k === 4 ? [[-2.55, -0.7], [0.7, 2.7]] : [[-2.55, -0.7], [0.7, 3.95]]; for (const [a, b] of segs) Bn.add(snowCapX(a, b, 0.0, 0.5, 0.02, 0.25, (x) => 0.82 + 0.18 * Math.sin(x * 3.1 + k), 0), snowC);
    Bn.add(snowCapX(-2.55, 3.95, 1.6, 1.92, 0.0, 0.085, (x) => 0.62 + 0.3 * Math.sin(x * 2.3 + k * 1.7) + 0.08 * Math.sin(x * 7.1 + k), 0), snowC);   // the rounded snow lip along the apron's front edge
    c.M(Bn.geo(), c.vcSnow, hg, false, false, true); }
  return { k, hg, T, piv, win, ups, lant };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE LANE: tiles of packed snow (landings 3.6 x 3.6, ramps 4.0 x 3.6 rising 0.8), water bars, the shovelled bank, the alleys, the dry-stone wall and its stile
// ---------------------------------------------------------------------------------------------------------------------
const LB = (() => { const b = [-44, xk(9) - 1.8]; for (let k = 9; k >= 1; k--) { b.push(xk(k) + 1.8); if (k > 1) b.push(xk(k - 1) - 1.8); } b.push(27, 60, 95); return b; })();   // tile breakpoints: landings and ramps, then the run down
// the 140 old potato footprints in 9 crossing trails (ovals 0.07): [x, z, angle]
function potatoPrints() {
  const out = [], counts = [16, 15, 17, 14, 16, 15, 17, 15, 15];
  counts.forEach((n, t) => { const x0 = -38 + 6.2 * t + 3 * hh(t * 7 + 2), z0 = t % 2 ? 2.3 : 5.0, th = (t % 2 ? 1 : -1) * (0.18 + 0.2 * hh(t * 3 + 1)); for (let i = 0; i < n; i++) { const s = i * 0.4, x = x0 + s * Math.cos(th), z = z0 + s * Math.sin(th) + (i % 2 ? 0.09 : -0.09); out.push([x, Math.max(2.15, Math.min(5.3, z)), th + 0.1 * (hh(t * 31 + i) - 0.5)]); } });
  return out;
}
function buildLane(c) {
  const g = new THREE.Group(); c.root.add(g); const prints = potatoPrints(); cnt("print", prints.length);
  for (let i = 0; i < LB.length - 1; i++) {
    const xa = LB[i], xb = LB[i + 1], len = xb - xa, ya = laneY(xa), yb = laneY(xb), long = len > 10, ppm = long ? 14 : 70;
    const tp = prints.filter(([x]) => x >= xa - 0.05 && x <= xb + 0.05).map(([x, z, a]) => [x - xa, z - LANE_Z0, a]);
    const tex = paintLane(i, len, tp, ppm), nu = Math.max(4, Math.round(len / (long ? 6 : 0.5))), nv = 8;
    const geo = surf(nu, nv, (u, v) => { const x = xa + u * len, z = LANE_Z0 + v * 3.6, edge = (u === 0 || u === 1) ? 0 : 1, n = 0.025 * (vn(x, 0, z, 0.9, 5) - 0.5) * edge * (v === 0 || v === 1 ? 0.5 : 1); return [x, lerp(ya, yb, u) + n, z]; }, (u, v) => [u, v]);
    const m = c.M(geo, c.mat("#ffffff", { map: tex, roughness: 0.95 }), g, false, false, true); m.userData.lane = i;
  }
  // 5 timber water bars on each ramp (low ridges 0.8 apart)
  { const B = new Bake(); for (let k = 9; k > 1; k--) for (let i = 0; i < 5; i++) { const x = xk(k) + 1.8 + 0.4 + 0.8 * i, y = laneY(x); { const lg = new THREE.CylinderGeometry(0.09, 0.09, 3.5, 12, 1); lg.rotateX(Math.PI / 2); lg.scale(1, 0.62, 1); const sl = -Math.atan(0.2); B.add(place(lg, x, y + 0.012, 3.7, 0, 0, sl), (X, Y, Z, nx, ny) => ny > 0.12 ? cmix(K.snowS, K.snow, clamp(ny * 1.1 - 0.05) * (0.8 + 0.2 * hh(Math.floor(Z * 3 + k)))) : cmix("#3a281a", "#5a4030", hh(i + k))); } cnt("waterbar"); } c.M(B.geo(), c.vcN, g, false, false, true); }
  // the shovelled bank 0.35 high along the wall: 30 spade facets (flat shaded), none at the fountain bay or the stile
  { const x0 = xk(9) - 1.8, x1 = xk(1) + 1.8, n = 30, pos = [], col = [], tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n; if ((xa < 0.6 && xb > -2.6) || (xb > 9.4 && xa < 10.6)) continue;
      const ba = Math.min(laneY(xa), laneY(xb), laneY((xa + xb) / 2)) - 0.02, h1 = 0.3 + 0.1 * hh(i * 3.3), h2 = 0.35 + 0.05 * hh(i * 5.7), zf = 5.0 - 0.1 * hh(i * 7.1), zm = 5.2 + 0.1 * hh(i * 2.9), ya = (x) => laneY(x) - 0.02;
      const P0 = [xa, ya(xa), zf], P1 = [xb, ya(xb), zf], M0 = [xa + 0.1, ya(xa) + h1 * 0.7, zm], M1 = [xb - 0.1, ya(xb) + h1 * 0.55 + 0.04 * hh(i), zm], T0 = [xa + 0.2, ya(xa) + h2, 5.5], T1 = [xb - 0.2, ya(xb) + h2 + 0.03 * (hh(i * 9.1) - 0.5), 5.5];
      for (const tri of [[P0, M0, P1], [P1, M0, M1], [M0, T0, M1], [M1, T0, T1], [P0, P0, M0].slice(0, 0)]) { if (tri.length < 3) continue; for (const v of tri) pos.push(...v); }
      cnt("facet", 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const nn = geo.attributes.normal, pp = geo.attributes.position; for (let i = 0; i < pp.count; i++) { tmp.set(snowCol(nn.getX(i), nn.getY(i), nn.getZ(i), 0, 0.1 * (hh(Math.floor(i / 3) * 3.1) - 0.5))); col.push(tmp.r, tmp.g, tmp.b); }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); c.M(geo, c.vcSnow, g, false, false, true); }
  // the alleys between the houses (x_k + 4.0 .. x_k + 5.0, z -6.5 .. 1.9) at the lane's height, and the snow behind the houses
  for (let k = 9; k > 1; k--) { const xa = xk(k) + 4.0, xb = xk(k) + 5.0, al = surf(4, 8, (u, v) => { const x = lerp(xa, xb, u), z = lerp(-6.5, 1.9, v); return [x, laneY(x) + 0.03 * (vn(x, 0, z, 1.3, 8) - 0.5), z]; }, (u, v) => [u, v]); c.M(al, c.mat("#9fb2d8", { roughness: 0.95 }), g, false, false, true); }
  return g;
}

// ---- the dry-stone wall 0.40 thick, z +5.5..+5.9, 0.70 above the lane (following it), capstones 0.5 long, snow caps 0.18, a gap for the fountain bay and a stile of 2 slabs at x +10
function buildWall(c) {
  const g = new THREE.Group(), gaps = [[-2.6, 0.6], [9.4, 10.6]]; c.root.add(g);
  const segs = []; for (let i = 0; i < LB.length - 1; i++) { let a = LB[i], b = LB[i + 1]; if (a >= 27) break; if (b > 27) b = 27; let cuts = [[a, b]]; for (const [ga, gb] of gaps) cuts = cuts.flatMap(([p, q]) => (gb <= p || ga >= q ? [[p, q]] : [[p, Math.max(p, ga)], [Math.min(q, gb), q]])).filter(([p, q]) => q - p > 0.05); segs.push(...cuts); }
  const Bc = new Bake(), Bs = new Bake(); let si = 0, ncap = 0;
  for (const [a, b] of segs) {
    const w = b - a, ya = laneY(a), yb = laneY(b), tex = mtex(w, 1.0, 100, (gg) => { stoneField(gg, 0, 0, w, 1.0, 200 + si * 3, { rows: 5, sw: 0.5, tone: K.stone, point: "dark", snow: 0.3 }); }, `wall${si}`);
    const mk = (z, flip) => { const f = surf(Math.max(1, Math.round(w / 1.5)), 1, (u, v) => { const x = lerp(a, b, u), y = laneY(x); return [x, lerp(y - 0.3, y + 0.7, v), z]; }, (u, v) => [u, v]); if (flip) { const ix = f.index; for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); } f.computeVertexNormals(); } return f; };
    const mt = c.mat("#ffffff", { map: tex, roughness: 0.95, side: THREE.DoubleSide }); c.M(mk(5.5, true), mt, g, true, true, true); c.M(mk(5.9, false), mt, g, true, true, true); si++;
    for (const [x, ex] of [[a, -1], [b, 1]]) if (gaps.some(([ga, gb]) => Math.abs(x - ga) < 0.01 || Math.abs(x - gb) < 0.01)) { const y = laneY(x), eg = surf(1, 1, (u, v) => [x, y - 0.3 + v * 1.0, 5.5 + u * 0.4], null); c.M(eg, c.mat(K.stoneS, { side: THREE.DoubleSide }), g, true, true, true); }
    for (let x = a + 0.25; x < b - 0.2; x += 0.5) { const y = laneY(x) + 0.7, hgt = 0.1 + 0.03 * hh(ncap * 1.7), pitch = Math.atan2(yb - ya, w); Bc.add(boxG(0.48, hgt, 0.46 + 0.03 * hh(ncap), x, y + hgt / 2 - 0.01, 5.7 + (hh(ncap * 2.3) - 0.5) * 0.03, 0, 0, pitch), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny * 0.7) * 0.6 + 0.2 * hh(ncap * 3))); ncap++; }
    Bs.add(loftX(a + 0.05, b - 0.05, Math.max(8, Math.round(w / 0.2)), (u, x) => capProfile(5.56, 5.84, laneY(x) + 0.7, 0.18, 0.55 + 0.45 * sm(u * w / 0.4) * sm((1 - u) * w / 0.4) + 0.12 * Math.sin(x * 1.9)), CAPN), snowC);
  }
  c.M(Bc.geo(), c.vcN, g, true, true, true); c.M(Bs.geo(), c.vcSnow, g, false, false, true); cnt("capstone", ncap);
  // the stile at x +10: two slabs through the gap
  { const B = new Bake(); for (let i = 0; i < 2; i++) { const y = laneY(10) + 0.22 + 0.2 * i; B.add(boxG(0.9, 0.16, 0.5 - 0.0 * i, 10, y - 0.08 + 0.0, 5.5 + 0.2 + i * 0.4 * 0), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny) * 0.6)); } B.add(boxG(0.9, 0.16, 0.5, 10, laneY(10) + 0.08, 5.15), K.stone); B.add(snowCapX(9.6, 10.4, 5.0, 5.3, laneY(10) + 0.16, 0.06, null, 8), snowC); c.M(B.geo(), c.vcN, g, true, true, true); cnt("stile", 2); }
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// DOOR 4: the hall behind the leaf, the woodpile with Chip's hollow, the chopping block
// ---------------------------------------------------------------------------------------------------------------------
const boardsTex = (seed, w, h, ppm, base = "#c8924e") => mtex(w, h, ppm, (g, W, H) => { const nb = Math.round(W / 0.14); for (let i = 0; i < nb; i++) { const x0 = i * W / nb, c = cmul(base, 0.84 + 0.3 * H2(seed, i)); g.fillStyle = c; g.fillRect(x0, 0, W / nb, H); grain(g, x0, 0, W / nb, H, seed * 11 + i, c, { horiz: false, lines: 5 }); g.fillStyle = rgba("#2a1608", 0.8); g.fillRect(x0, 0, 0.004, H); } }, `boards${seed}`);
function buildHall(c, hg) {
  const g = new THREE.Group(); hg.add(g); const em = (col, k = 0.5) => ({ emissive: new THREE.Color(K.win), emissiveIntensity: k }); c.hallMats = [];
  const wall = (tex, rot) => { const m = c.mat("#ffffff", { map: tex, roughness: 0.9, emissive: new THREE.Color(K.win), emissiveIntensity: 0.0, side: THREE.DoubleSide }); c.hallMats.push(m); return m; };
  const bt = boardsTex(41, 1.6, 1.9, 140), bt2 = boardsTex(42, 1.9, 1.9, 140);
  // floor (a rag runner with 9 red and cream stripes), back wall, side walls, ceiling
  const rug = mtex(0.5, 1.7, 160, (gg, W, H) => { gg.fillStyle = "#e8dcc0"; gg.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { gg.fillStyle = i % 2 ? "#e8dcc0" : "#b8322e"; gg.fillRect(0, i * H / 9, W, H / 9); for (let j = 0; j < 14; j++) lineP(gg, [[0.02 + j * 0.034, i * H / 9], [0.02 + j * 0.034 + 0.006, (i + 1) * H / 9]], 0.004, rgba("#000", 0.12)); } gg.fillStyle = "#6a4a2a"; gg.fillRect(0, 0, 0.012, H); gg.fillRect(W - 0.012, 0, 0.012, H); cnt("rug.stripe", 9); }, "rug");
  const fl = new THREE.PlaneGeometry(1.6, 1.7); fl.rotateX(-Math.PI / 2); fl.translate(0, 0.002, -1.05); c.M(fl, wall(boardsTex(43, 1.6, 1.7, 100, "#b88444")), g, false, false, true);
  const rg = new THREE.PlaneGeometry(0.5, 1.7); rg.rotateX(-Math.PI / 2); rg.translate(0.0, 0.006, -1.05); c.M(rg, c.mat("#ffffff", { map: rug, roughness: 1 }), g, false, false, true);
  c.M(new THREE.PlaneGeometry(1.6, 1.9).translate(0, 0.95, -1.9), wall(bt), g);
  { const lw = new THREE.PlaneGeometry(1.7, 1.9); lw.rotateY(Math.PI / 2); lw.translate(-0.8, 0.95, -1.05); c.M(lw, wall(bt2), g); const rw = new THREE.PlaneGeometry(1.7, 1.9); rw.rotateY(-Math.PI / 2); rw.translate(0.8, 0.95, -1.05); c.M(rw, wall(bt2), g); const ce = new THREE.PlaneGeometry(1.6, 1.7); ce.rotateX(Math.PI / 2); ce.translate(0, 1.9, -1.05); c.M(ce, wall(boardsTex(44, 1.6, 1.7, 80, "#9a6a34")), g); }
  // 4 pegs with a teal scarf, a yellow bobble hat and 2 small coats (on the back wall)
  const Bp = new Bake(); [-0.52, -0.17, 0.17, 0.52].forEach((x, i) => { Bp.add(place(new THREE.CylinderGeometry(0.014, 0.018, 0.1, 6), x, 1.45, -1.85, Math.PI / 2), K.woodS); Bp.add(place(new THREE.SphereGeometry(0.024, 6, 5), x, 1.45, -1.8), "#b8884a"); cnt("peg"); });
  const cloth = (w, h, d, x, y, z, col, wob = 0.01) => { const gg = new THREE.BoxGeometry(w, h, d, 6, 8, 1), p = gg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + wob * Math.sin(p.getY(i) * 22 + p.getX(i) * 9 + x * 5)); gg.computeVertexNormals(); return place(gg, x, y, z); };
  Bp.add(cloth(0.1, 0.5, 0.03, -0.52, 1.18, -1.8, "#2f8f8a"), (x, y) => (Math.floor((y + 3) * 14) % 2 ? "#2f8f8a" : "#cfe6e0")); Bp.add(cloth(0.1, 0.1, 0.03, -0.52, 1.5, -1.8, "#2f8f8a"), "#2f8f8a"); cnt("scarf");
  Bp.add(place(new THREE.ConeGeometry(0.09, 0.2, 10), -0.17, 1.43, -1.8, 0, 0, 0.0), K.yellow); Bp.add(place(new THREE.SphereGeometry(0.035, 8, 6), -0.17, 1.55, -1.8), "#fff09a"); cnt("hat");
  Bp.add(cloth(0.2, 0.46, 0.06, 0.17, 1.2, -1.8, "#a3232b"), (x, y) => cmul("#a3232b", 0.85 + 0.15 * hh(Math.floor(y * 30)))); Bp.add(cloth(0.22, 0.5, 0.06, 0.52, 1.18, -1.8, "#3a5a8a"), "#3a5a8a"); cnt("coat", 2);
  c.M(Bp.geo(), c.vc, g, false, false); 
  // the shelf with the candle arch (5 candles), a boot tray with 2 pairs of slippers
  { const Bs = new Bake(); Bs.add(boxG(0.6, 0.025, 0.16, 0, 1.68, -1.83), K.wood); Bs.add(boxG(0.025, 0.12, 0.1, -0.25, 1.62, -1.84), K.woodS); Bs.add(boxG(0.025, 0.12, 0.1, 0.25, 1.62, -1.84), K.woodS);
    Bs.add(tube(arcPts(0, 1.69, 0.17, 0, 180, 14).map(([x, y]) => [x, y, -1.83]), 0.011, 5), "#2a1a10"); cnt("shelf.arch");
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.1 + 0.8 * i / 4), x = Math.cos(a) * 0.17, y = 1.69 + Math.sin(a) * 0.17; Bs.add(place(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 6), x, y + 0.02, -1.83), "#f4ecd8"); cnt("hall.flame"); }
    Bs.add(boxG(0.5, 0.03, 0.24, 0.45, 0.015, -1.0), "#6a4a2a"); Bs.add(boxG(0.5, 0.012, 0.012, 0.45, 0.03, -0.89), "#3a2a1a");
    for (const [x, z, col] of [[0.32, -1.0, "#a3232b"], [0.4, -1.0, "#a3232b"], [0.52, -1.0, "#2f8f8a"], [0.6, -1.0, "#2f8f8a"]]) { const sg = new THREE.SphereGeometry(1, 8, 6); sg.scale(0.065, 0.03, 0.035); Bs.add(place(sg, x, 0.05, z + (x > 0.45 ? 0.02 : -0.03)), col); }
    c.M(Bs.geo(), c.vc, g, false, false); const fl2 = []; for (let i = 0; i < 5; i++) { const a = Math.PI * (0.1 + 0.8 * i / 4); const m = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.045), noLine(new THREE.MeshBasicMaterial({ map: c.flameTex[0], transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }))), 6); m.position.set(Math.cos(a) * 0.17, 1.69 + Math.sin(a) * 0.17 + 0.068, -1.83); g.add(m); fl2.push(m); } c.hallFlames = fl2; }
  // the hall's light: a real point light (scaled by door4) and the wedge on the apron (1.0 wide, reaching z +1.6), a coir mat 0.6 x 0.35 on the threshold
  const L = new THREE.PointLight(K.win, 0, 5, 2); L.position.set(0, 1.4, -0.9); L.castShadow = false; hg.add(L); c.hallLight = L;
  const wedge = steamy(new THREE.Mesh(surf(1, 8, (u, v) => [(u - 0.5) * lerp(0.95, 1.2, v), 0.01, lerp(0.0, 1.6, v)], (u, v) => [u, 1 - v]), softMat({ map: canvasTex(8, 64, (gg, w, h) => { const q = gg.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.6, "rgba(255,255,255,0.45)"); q.addColorStop(1, "rgba(255,255,255,0)"); gg.fillStyle = q; gg.fillRect(0, 0, w, h); }, "wedge", 1), color: "#ffd98a", opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 2); hg.add(wedge); c.hallWedge = wedge;
  const door = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.7), softMat({ map: c.poolTex, color: "#ffc766", opacity: 0, blending: THREE.AdditiveBlending })), 4); door.position.set(0, 0.85, 0.06); hg.add(door); c.hallDoorGlow = door;
  const mat = mtex(0.6, 0.35, 220, (gg, W, H) => { gg.fillStyle = "#8a6a3a"; gg.fillRect(0, 0, W, H); for (let i = 0; i < 400; i++) { const x = H2(7, i) * W, y = H2(8, i) * H; lineP(gg, [[x, y], [x + 0.012 * (H2(9, i) - 0.5), y + 0.012 * (H2(10, i) - 0.5)]], 0.004, cmul("#8a6a3a", 0.6 + 0.6 * H2(11, i))); }
    gg.save(); gg.translate(W / 2, H / 2); for (let i = 0; i < 4; i++) { const y = -0.1 + i * 0.05, w = 0.1 - i * 0.02; polyP(gg, [[-w, y], [0, y + 0.07], [w, y]]); gg.fillStyle = rgba("#b49058", 0.55); gg.fill(); } gg.fillStyle = rgba("#b49058", 0.55); gg.fillRect(-0.01, -0.14, 0.02, 0.05); gg.restore();
    gg.strokeStyle = "#4a3418"; gg.lineWidth = 0.02; gg.strokeRect(0.01, 0.01, W - 0.02, H - 0.02); }, "coir");
  { const mg = new THREE.PlaneGeometry(0.6, 0.35); mg.rotateX(-Math.PI / 2); mg.translate(0, 0.07, 0.17); c.M(mg, c.mat("#ffffff", { map: mat, roughness: 1 }), hg, false, false, true); cnt("coir"); }
}

// ---- the woodpile (x +2.80..+4.30, z +0.05..+1.01, 1.15 high): 132 log ends in 12 columns x 11 rows, the hollow, the cover, the loose logs, the block
function buildPile(c, hg) {
  const g = new THREE.Group(), logs = pileLayout(); hg.add(g);
  const atlas = paintLogEnds(logs), Bk = new Bake(), Bsn = new Bake();
  // the mass behind the ends, dark; the -x end face (log sides) with the hollow's opening 0.66 x 0.66
  { const B = new Bake(), M = "#241810";   // the dark mass behind the ends, in 3 blocks round the hollow (x 2.8..3.6, y 0..0.66, z 0.05..0.71), 0.09 behind the front so the recessed logs show
    B.add(boxG(0.68, 1.15, 0.84, 3.95, 0.575, 0.47), M); B.add(boxG(0.79, 0.48, 0.84, 3.205, 0.91, 0.47), M); B.add(boxG(0.79, 0.66, 0.17, 3.205, 0.33, 0.805), M); c.M(B.geo(), c.vcN, g, true, true, false); }
  { const sidesTex = mtex(0.96, 1.15, 160, (gg, W, H) => { gg.fillStyle = "#2a1c12"; gg.fillRect(0, 0, W, H); for (let r = 0; r < 11; r++) for (let q = 0; q < 3; q++) { const y0 = r * H / 11, x0 = q * W / 3, hgt = H / 11 * (0.9 + 0.1 * H2(r, q)); const col = cmix("#5a3c24", "#8a6a44", H2(r * 3, q + 5)); gg.fillStyle = col; gg.fillRect(x0 + 0.006, y0 + 0.004, W / 3 - 0.012, hgt - 0.008); for (let l = 0; l < 3; l++) lineP(gg, [[x0 + 0.01, y0 + hgt * (0.25 + 0.25 * l)], [x0 + W / 3 - 0.01, y0 + hgt * (0.25 + 0.25 * l) + 0.004]], 0.003, cmul(col, 0.6)); if (H2(r, q + 20) < 0.35) lineP(gg, [[x0 + 0.02 + 0.2 * H2(q, r), y0 + 0.02], [x0 + 0.08 + 0.2 * H2(q, r), y0 + hgt - 0.02]], 0.004, "#1a1008"); } }, "pileside");
    const eg = wallParts(0.05, 1.01, 0, 1.15, 0.05, 0.71, 0.66, 0); eg.rotateY(-Math.PI / 2); eg.translate(2.8, 0, 0); c.M(eg, c.mat("#ffffff", { map: sidesTex, roughness: 0.95, side: THREE.DoubleSide }), g, true, true, true);
    // the hollow: floor of bark crumbs and sawdust, charred walls, 2 planks at y 0.66, the cat's straw nest at the far end
    const burnt = mtex(0.8, 0.66, 140, (gg, W, H) => { gg.fillStyle = "#2c2018"; gg.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { const x = H2(3, i) * W, y = H2(4, i) * H; polyP(gg, Array.from({ length: 5 }, (_, j) => [x + (0.03 + 0.04 * H2(i, j)) * Math.cos(j / 5 * TAU), y + (0.02 + 0.04 * H2(j, i)) * Math.sin(j / 5 * TAU)])); fillP(gg, cmix("#22180f", "#5a4430", H2(i, 5)), 0.003, "#0c0806"); } for (let i = 0; i < 14; i++) { ellP(gg, H2(5, i) * W, H2(6, i) * H, 0.006, 0.004); gg.fillStyle = rgba("#a8441a", 0.6); gg.fill(); } }, "burnt");
    const bm = c.mat("#ffffff", { map: burnt, roughness: 1, side: THREE.DoubleSide, emissive: new THREE.Color("#8a5428"), emissiveMap: burnt, emissiveIntensity: 0.5 }), hz = (w, h) => new THREE.PlaneGeometry(w, h);
    { const a = hz(0.8, 0.66); a.translate(3.2, 0.33, 0.052); c.M(a, bm, g); const b = hz(0.66, 0.66); b.rotateY(Math.PI / 2); b.translate(3.6, 0.33, 0.38); c.M(b, bm, g); const f = hz(0.8, 0.66); f.translate(3.2, 0.33, 0.71); c.M(f, bm, g); const pl = hz(0.8, 0.66); pl.rotateX(Math.PI / 2); pl.translate(3.2, 0.66, 0.38); c.M(pl, c.mat("#6a4a2a", { side: THREE.DoubleSide }), g);
      const fl = hz(0.8, 0.66); fl.rotateX(-Math.PI / 2); fl.translate(3.2, 0.004, 0.38); const sd = mtex(0.8, 0.66, 120, (gg, W, H) => { gg.fillStyle = "#c8a46a"; gg.fillRect(0, 0, W, H); for (let i = 0; i < 260; i++) { const x = H2(1, i) * W, y = H2(2, i) * H; ellP(gg, x, y, 0.004 + 0.008 * H2(3, i), 0.003 + 0.004 * H2(4, i), H2(5, i) * 3); gg.fillStyle = rgba(H2(6, i) > 0.5 ? "#4a3220" : "#e8d098", 0.8); gg.fill(); } }, "sawdust"); c.M(fl, c.mat("#ffffff", { map: sd, roughness: 1 }), g, false, false, true);
      const Bn = new Bake(); for (let i = 0; i < 46; i++) { const a = H2(11, i) * TAU, r = 0.1 + 0.1 * H2(12, i), L = 0.1 + 0.08 * H2(13, i); Bn.add(boxG(L, 0.004, 0.004, 3.42 + Math.cos(a) * r, 0.015 + 0.04 * H2(14, i) * (1 - r * 2), 0.38 + Math.sin(a) * r, 0, a + H2(15, i), (H2(16, i) - 0.5) * 0.6), cmix("#d9b45a", "#a8843a", H2(17, i))); }
      Bn.add(place(new THREE.TorusGeometry(0.17, 0.025, 5, 16), 3.42, 0.03, 0.38, Math.PI / 2), "#c8a050"); cnt("nest"); c.M(Bn.geo(), c.vcN, g, false, false, true);
      const Bc = new Bake(); for (let i = 0; i < 30; i++) Bc.add(boxG(0.03 + 0.03 * H2(20, i), 0.008, 0.015 + 0.02 * H2(21, i), 2.9 + 0.6 * H2(22, i), 0.006, 0.1 + 0.55 * H2(23, i), 0, H2(24, i) * 3), cmix("#4a3424", "#6a4a2a", H2(25, i))); c.M(Bc.geo(), c.vcN, g, false, false, true); cnt("crumb", 30); } }
  // the 132 log ends: round faces from the atlas (a 24-sided disc each, radius 0.046-0.068, set as the pile is stacked), the log bodies behind them (bark cylinders), snow wedges on the 20 that stick out
  const uvq = [], posq = [], idxq = [], SEG = 24; let nq = 0;
  for (const L of logs) {
    const z = PILE.z1 - L.pr + 0.003, R = L.R, cx = L.cx, cy = L.cy, u0 = (L.c + 0.5) / 12, v0 = (L.r + 0.5) / 11;
    posq.push(cx, cy, z); uvq.push(u0, v0);
    for (let i = 0; i < SEG; i++) { const a = i / SEG * TAU; posq.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R, z); uvq.push(u0 + 0.49 * Math.cos(a) / 12, v0 + 0.49 * Math.sin(a) / 11); }
    const bs = nq * (SEG + 1); for (let i = 0; i < SEG; i++) idxq.push(bs, bs + 1 + i, bs + 1 + (i + 1) % SEG); nq++;
    const cg = new THREE.CylinderGeometry(R * 0.985, R * 0.985, 0.3, 10, 1); cg.rotateX(Math.PI / 2);
    Bk.add(place(cg, cx, cy, z - 0.153), (X, Y, Z, nx, ny, nz) => cmul(L.grey ? "#6a625a" : "#5a3c24", 0.75 + 0.35 * hh(L.id + Math.floor(Z * 20)) + 0.15 * ny));
    if (L.pr > 0.02) { Bsn.add(snowLump(R * 1.05, 0.03, 0.05, cx, cy + R * 0.9, z - 0.03, L.id, 6), snowC); cnt("wedge"); }
    cnt("logend.pile");
  }
  { const qg = new THREE.BufferGeometry(); qg.setAttribute("position", new THREE.Float32BufferAttribute(posq, 3)); qg.setAttribute("uv", new THREE.Float32BufferAttribute(uvq, 2)); qg.setIndex(idxq); qg.computeVertexNormals(); c.M(qg, c.reg(noLine(stdMat({ map: atlas, roughness: 0.9 }))), g, true, true, true); }
  c.M(Bk.geo(), c.vc, g, false, true, true); c.M(Bsn.geo(), c.vcN, g, false, false, true);
  // the peep gap (x 3.20, y 0.30..0.48, 0.20 wide) shows the hollow's dark; the cat gap (x 3.82, y 0..0.22, 0.24 wide) a tunnel with straw at its end
  { const Bv = new Bake(); Bv.add(boxG(0.24, 0.22, 0.3, 3.82, 0.11, 0.86), "#0a0705"); c.M(Bv.geo(), c.vcN, g, false, false); const sc = new THREE.Group(); for (let i = 0; i < 9; i++) { const s = c.M(boxG(0.07, 0.004, 0.004), c.mat("#d9b45a"), sc); s.position.set(3.82 + (H2(30, i) - 0.5) * 0.14, 0.01 + 0.012 * i % 0.1, 0.72 + 0.1 * H2(31, i)); s.rotation.set(0, H2(32, i) * 2, (H2(33, i) - 0.5) * 0.8); } g.add(sc); }
  // posts (3), the lean-to cover of 3 boards at 12 degrees with 0.20 of snow and 8 icicles
  { const B = new Bake(); for (const x of [2.80, 3.55, 4.30]) { B.add(boxG(0.09, 1.34, 0.09, x, 0.67, 1.04), (X, Y, Z, nx, ny) => cmul(K.wood, 0.7 + 0.3 * ny)); cnt("pilepost"); }
    const T12 = 12 * DEG; for (let i = 0; i < 3; i++) { const zc = 0.18 + i * 0.4, bd = place(new THREE.BoxGeometry(1.9, 0.03, 0.4), 3.55, 1.5 - zc * Math.tan(T12) - 0.0, zc, T12 * -1, 0, 0); B.add(bd, (X, Y, Z, nx, ny) => cmul(K.woodB, 1.0 + 0.5 * hh(i * 5 + Math.floor(X * 8)) + 0.25 * ny)); cnt("coverboard"); }
    const sg = loftX(2.62, 4.48, 30, (u, x) => { const k = 0.2 + 0.8 * sm(Math.min(u, 1 - u) * 1.86 / 0.35), pr = capProfile(-0.05, 1.12, 0.0, 0.2, k * (1 + 0.1 * Math.sin(x * 7))); return pr.map(([s, h]) => [s * Math.cos(T12) + h * Math.sin(T12), 1.515 - s * Math.sin(T12) + h * Math.cos(T12)]); }, CAPN);
    Bsn.list.length = 0; Bsn.add(sg, snowC); c.M(Bsn.geo(), c.vcSnow, g, false, true, true); c.M(B.geo(), c.vc, g, false, true, true);
    for (let i = 0; i < 8; i++) { const L = 0.05 + 0.13 * H2(60, i), x = 2.7 + i * 0.235 + 0.04 * H2(61, i); c.ices.push({ k: 0, i, x: hg.position.x + x, y: 1.515 - 1.1 * Math.sin(T12) - 0.01, z: 1.12, L, r: 0.014 + 0.03 * L, hx: x, pile: true }); cnt("icicle.pile"); } }
  // the 9 loose logs (reused `firewood` at 0.6) by the opening (x +2.45..+2.80), the chopping block (reused at 0.7) at (+4.00, +1.50) with a hatchet 0.36 stuck in it and 14 chips round it
  const loose = new THREE.Group(); g.add(loose); c.loose = loose;
  [[2.54, 0.18, 0.3, 0], [2.66, 0.31, -0.5, 0], [2.56, 0.46, 1.4, 0], [2.7, 0.57, 0.1, 0], [2.52, 0.71, -0.9, 0], [2.67, 0.8, 0.6, 0], [2.6, 0.25, 2.0, 0.1], [2.62, 0.52, 0.9, 0.1], [2.58, 0.66, -0.3, 0.1]].forEach(([x, z, ry, y], i) => { const fg = new THREE.Group(); SNOW_KINDS.firewood({ whole: fg, root: fg, spec: { len: 0.5, r: 0.09 } }); fg.scale.setScalar(0.6); fg.position.set(x, y, z); fg.rotation.y = ry; loose.add(fg); cnt("looselog"); });
  const blk = new THREE.Group(); SNOW_KINDS.choppingblock({ whole: blk, root: blk, spec: {} }); blk.scale.setScalar(0.7); blk.position.set(4.0, 0, 1.5); g.add(blk); cnt("block");
  { const B = new Bake(); B.add(tube([[4.0, 0.3, 1.5], [4.06, 0.5, 1.5], [4.14, 0.66, 1.5]], 0.016, 6), K.woodS); B.add(place(plate([[0, -0.02], [0.1, -0.05], [0.12, 0.05], [0, 0.04]], 0.012), 4.15, 0.68, 1.51, 0, 0, 0.5), (X, Y, Z, nx, ny) => cmix(K.ironS, K.ironL, clamp(ny + 0.2) * 0.6)); cnt("hatchet");
    for (let i = 0; i < 14; i++) { const a = H2(70, i) * TAU, r = 0.22 + 0.4 * H2(71, i); B.add(boxG(0.04 + 0.03 * H2(72, i), 0.012, 0.02 + 0.015 * H2(73, i), 4.0 + Math.cos(a) * r, 0.007, 1.5 + Math.sin(a) * r, 0, H2(74, i) * 3), cmix("#d9b382", "#8f867a", H2(75, i) * 0.7)); cnt("chip"); } c.M(B.geo(), c.vcN, g, false, true, true); }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE FOUNTAIN (panel 03): a stone trough with 3 rosettes and 4 panels, a pillar with a brass ram's-head spout, 29 icicles, a frozen sheet, a dipper on a chain, a bucket frozen to the step
// ---------------------------------------------------------------------------------------------------------------------
const BANDV = new V3(-0.35, 0.8, 0.5).normalize();
const brassC = (seed) => (x, y, z, nx, ny, nz) => {
  let col = new THREE.Color(K.brass); const b = Math.pow(Math.max(0, nx * BANDV.x + ny * BANDV.y + nz * BANDV.z), 9);
  col.lerp(new THREE.Color(K.brassL), clamp(b * 0.9)); const tar = vn(x, y, z, 31, seed) * 0.6 + vn(x, y, z, 11, seed + 3) * 0.4; if (tar > 0.62) col.lerp(new THREE.Color(hh(seed + Math.floor(x * 20)) > 0.5 ? K.brassS : "#4a5a34"), sm((tar - 0.62) / 0.1) * 0.8);
  if (Math.hypot(x * 9 - seed * 0.3, y * 9, z * 9) < 0.5 + 0.0) col.lerp(new THREE.Color(K.brassS), 0.7);
  return col;
};
function buildFountain(c) {
  const g = new THREE.Group(); g.position.set(-1.0, -0.16, 6.4); c.root.add(g);
  const stoneV = (seed) => (X, Y, Z, nx, ny, nz) => cmix(K.stoneS, K.stoneL, clamp(ny * 0.55 + 0.2 + 0.4 * hh(Math.floor(X * 9 + Y * 7 + Z * 11) + seed) - 0.2) * 0.8);
  // the bay: floor, side walls, back wall (the cut in the meadow behind the lane's wall)
  { const flo = new THREE.PlaneGeometry(3.2, 1.7); flo.rotateX(-Math.PI / 2); flo.translate(0, 0.002, -0.05); const ft = mtex(3.2, 1.7, 90, (gg, W, H) => { gg.fillStyle = "#dbe6f6"; gg.fillRect(0, 0, W, H); stoneField(gg, 0.05, 0.05, W - 0.1, H - 0.1, 333, { rows: 3, sw: 0.5, tone: K.stone, point: "#e8f0fb", snow: 0.8 }); const q = gg.createRadialGradient(W / 2, H / 2, 0.3, W / 2, H / 2, 1.8); q.addColorStop(0, rgba("#eef4fc", 0)); q.addColorStop(1, rgba("#eef4fc", 0.9)); gg.fillStyle = q; gg.fillRect(0, 0, W, H); }, "bayfloor");
    c.M(flo, c.mat("#ffffff", { map: ft, roughness: 0.95 }), g, false, false, true); }
  // an octagonal basin (apothem 0.68, 0.54 high, walls 0.12) on a stepped plinth: 8 facets, 3 on the lane side carry a raised panel with a six-petal rosette, 5 a plain raised panel;
  // a rounded rim in stone under a lumpy cap of snow; the pillar stands behind it (PZ). `oct` lathes a profile (apothem, y) and squares the circle into an octagon (facet centres on 0, 45... degrees from -z)
  const PZ = 0.72, DZ = PZ - 0.48, A8 = 0.68;
  const octR = (th) => { const d = ((((th * 180 / Math.PI) + 22.5) % 45) + 45) % 45 - 22.5; return 1 / Math.cos(d * Math.PI / 180); };
  const oct = (prof, seg = 32, wob = 0) => { const lg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg), p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), th = Math.atan2(x, -z), f = octR(th) * (1 + wob * (vn(th * 3, p.getY(i), 0, 1.7, 41) - 0.5)); p.setX(i, x * f); p.setZ(i, z * f); }
    const ng = lg.toNonIndexed(); ng.deleteAttribute("uv"); ng.computeVertexNormals(); return ng; };
  const stoneN = (seed) => (X, Y, Z, nx, ny, nz) => { const lit = clamp(0.5 + 0.35 * ny + 0.3 * (nx * -0.55 + nz * 0.45)); return cmix(K.stoneS, K.stoneL, clamp(lit * 0.85 + 0.25 * (hh(Math.floor(X * 8) + Math.floor(Z * 8) * 7 + Math.floor(Y * 9) * 3 + seed) - 0.5))); };
  const Bt = new Bake(), st = stoneN(7);
  Bt.add(oct([[0.0, 0.0], [0.8, 0.0], [0.8, 0.07], [0.74, 0.09], [0.74, 0.12], [0.69, 0.12], [0.69, 0.44], [0.68, 0.47], [0.73, 0.49], [0.74, 0.54], [0.7, 0.56], [0.57, 0.56], [0.56, 0.44], [0.0, 0.43]], 32), st);
  Bt.add(boxG(2.0, 0.08, 0.3, 0, 0.04, -0.98), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny) * 0.55 + 0.1 * hh(Math.floor(X * 9))));   // the step in front (the bucket stands on it)
  c.M(Bt.geo(), c.vcN, g, true, true, true);
  // the raised panels (stone coursing, a lit top edge and a dark bottom edge, a carved six-petal rosette on the 3 facing the lane)
  { const mkPanel = (rosette, seed) => mtex(0.48, 0.34, 240, (gg, W, H) => { gg.fillStyle = "#7a7e88"; gg.fillRect(0, 0, W, H); stoneField(gg, 0, 0, W, H, 91 + seed, { rows: 3, per: [3, 3, 3], tone: K.stone, point: "#3a3d46", snow: 0.1 });
        gg.fillStyle = "#4a4e5a"; gg.fillRect(0.03, 0.03, W - 0.06, H - 0.06); gg.fillStyle = "#a9acb6"; gg.fillRect(0.03, 0.03, W - 0.065, H - 0.065); gg.fillStyle = "#8f929c"; gg.fillRect(0.05, 0.05, W - 0.1, H - 0.1); gg.fillStyle = "#c9ccd6"; gg.fillRect(0.03, 0.03, W - 0.06, 0.012); gg.fillStyle = "#2f323c"; gg.fillRect(0.03, H - 0.042, W - 0.06, 0.012); gg.strokeStyle = "#2a2d36"; gg.lineWidth = 0.004; gg.strokeRect(0.03, 0.03, W - 0.06, H - 0.06);
        if (rosette) { const x = W / 2, y = H / 2; for (let p = 0; p < 6; p++) withT(gg, x, y, p / 6 * TAU, 1, 1, () => { ellP(gg, 0, 0.065, 0.028, 0.07); gg.fillStyle = "#4a4e5a"; gg.fill(); ellP(gg, -0.004, 0.068, 0.025, 0.066); gg.fillStyle = "#c9ccd6"; gg.fill(); ellP(gg, 0.003, 0.062, 0.017, 0.05); gg.fillStyle = "#a9acb6"; gg.fill(); gg.strokeStyle = "#2a2d36"; gg.lineWidth = 0.004; ellP(gg, 0, 0.065, 0.028, 0.07); gg.stroke(); }); ellP(gg, x, y, 0.03, 0.03); gg.fillStyle = "#d4d7e0"; gg.fill(); gg.strokeStyle = "#2a2d36"; gg.stroke(); ellP(gg, x, y, 0.012, 0.012); gg.fillStyle = "#7a7e88"; gg.fill(); } }, `fpanel${seed}`);
    const mats = [c.mat("#ffffff", { map: mkPanel(true, 0), roughness: 0.9 }), c.mat("#ffffff", { map: mkPanel(false, 1), roughness: 0.9 })];
    for (let f = 0; f < 8; f++) { const th = f * Math.PI / 4, front = f === 0 || f === 1 || f === 7, nx = Math.sin(th), nz = -Math.cos(th), pg = new THREE.PlaneGeometry(0.48, 0.34); pg.rotateY(Math.PI - th); const m = c.M(pg, mats[front ? 0 : 1], g, false, true, true); m.position.set(nx * 0.6925, 0.28, nz * 0.6925); if (front) cnt("rosette.fountain"); } }
  // the rim cap of snow: rounded, lumpy, with a lip drooping over the outside
  { const Bs = new Bake(); Bs.add(oct([[0.72, 0.5], [0.775, 0.53], [0.785, 0.575], [0.75, 0.612], [0.68, 0.635], [0.61, 0.622], [0.55, 0.58], [0.5, 0.55]], 48, 0.35), snowC); c.M(Bs.geo(), c.vcSnow, g, false, true, true); }
  // the ice sheet in the basin (#b9d6e8, 5 cracks, a dark melt hole 0.16 under the spout)
  { const it = mtex(1.08, 1.08, 200, (gg, W, H) => { gg.fillStyle = K.ice2; gg.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { ellP(gg, H2(5, i) * W, H2(6, i) * H, 0.05 + 0.1 * H2(7, i), 0.03 + 0.05 * H2(8, i), H2(9, i) * 3); gg.fillStyle = rgba(i % 2 ? "#e4f1fa" : "#8fb2cc", 0.28); gg.fill(); }
      for (let i = 0; i < 5; i++) { gg.beginPath(); let x = W * (0.1 + 0.2 * i), y = i % 2 ? 0.05 : H - 0.05; gg.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (H2(i, s) - 0.5) * 0.18; y += (i % 2 ? 1 : -1) * 0.12; gg.lineTo(x, y); } gg.strokeStyle = rgba("#fff", 0.85); gg.lineWidth = 0.005; gg.stroke(); gg.strokeStyle = rgba("#5a7a98", 0.7); gg.lineWidth = 0.002; gg.stroke(); cnt("crack"); }
      const hx = W / 2 - 0.0765, hy = H / 2 + 0.185; ellP(gg, hx, hy, 0.08, 0.08); gg.fillStyle = "#1a2a3a"; gg.fill(); ellP(gg, hx, hy, 0.095, 0.095); gg.strokeStyle = rgba("#e4f1fa", 0.9); gg.lineWidth = 0.012; gg.stroke(); }, "icesheet");
    const ig = new THREE.CircleGeometry(0.54, 8); ig.rotateX(-Math.PI / 2); ig.rotateY(Math.PI / 8); ig.translate(0, 0.435, 0); c.M(ig, c.mat("#ffffff", { map: it, roughness: 0.25, emissive: new THREE.Color(K.iceE), emissiveIntensity: 0.2 }), g, false, false, true); cnt("meltholes"); }
  // the pillar 0.30 square x 1.45 behind the basin: a carved shaft (courses, a framed niche, a rope band), 4 chamfers, a band of 5 zigzag notches, a pyramid cap with a stone ball 0.20 under 0.14 of snow
  { const Bp = new Bake();
    const pt = mtex(0.3, 1.3, 220, (gg, W, H) => { gg.fillStyle = "#7a7e88"; gg.fillRect(0, 0, W, H); stoneField(gg, 0, 0, W, H, 411, { rows: 7, per: [2, 2, 2, 2, 2, 2, 2], tone: K.stone, point: "#3a3d46", snow: 0.08 });
      gg.fillStyle = "#4a4e5a"; gg.fillRect(0.05, 0.28, W - 0.1, 0.62); gg.fillStyle = "#9a9da8"; gg.fillRect(0.055, 0.285, W - 0.11, 0.61); gg.fillStyle = "#b9bcc6"; gg.fillRect(0.055, 0.285, W - 0.11, 0.012); gg.fillStyle = "#2f323c"; gg.fillRect(0.055, 0.88, W - 0.11, 0.012);
      gg.beginPath(); gg.moveTo(0.09, 0.84); gg.lineTo(0.09, 0.5); gg.arc(W / 2, 0.5, W / 2 - 0.09, Math.PI, 0); gg.lineTo(W - 0.09, 0.84); gg.closePath(); gg.fillStyle = "#6a6e78"; gg.fill(); gg.strokeStyle = "#2a2d36"; gg.lineWidth = 0.004; gg.stroke(); gg.beginPath(); gg.moveTo(0.1, 0.84); gg.lineTo(0.1, 0.5); gg.arc(W / 2, 0.5, W / 2 - 0.1, Math.PI, 0); gg.strokeStyle = "#c9ccd6"; gg.lineWidth = 0.004; gg.stroke();
      for (const y0 of [0.12, 0.96]) for (let i = 0; i < 20; i++) { const x = 0.01 + i * 0.0145; lineP(gg, [[x, y0 - 0.014], [x + 0.014, y0 + 0.014]], 0.004, "#2a2d36"); lineP(gg, [[x + 0.002, y0 - 0.014], [x + 0.016, y0 + 0.014]], 0.003, "#b9bcc6"); }
      gg.fillStyle = "#2a2d36"; gg.fillRect(0, 0.105, W, 0.004); gg.fillRect(0, 0.135, W, 0.004); gg.fillRect(0, 0.945, W, 0.004); gg.fillRect(0, 0.975, W, 0.004); }, "pillarface");
    const shaft = new THREE.BoxGeometry(0.3, 1.3, 0.3); shaft.translate(0, 0.1 + 0.65, PZ); c.M(shaft, c.mat("#ffffff", { map: pt, roughness: 0.9 }), g, true, true, true);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) Bp.add(place(new THREE.BoxGeometry(0.07, 1.3, 0.07), sx * 0.15, 0.75, PZ + sz * 0.15, 0, Math.PI / 4, 0), stoneN(13));   // the 4 chamfers
    Bp.add(boxG(0.42, 0.1, 0.42, 0, 0.05, PZ), stoneN(3)); Bp.add(boxG(0.36, 0.06, 0.36, 0, 0.13, PZ), stoneN(4)); Bp.add(boxG(0.38, 0.05, 0.38, 0, 1.425, PZ), stoneN(5));
    for (let i = 0; i < 5; i++) { const x = -0.12 + i * 0.06; Bp.add(place(new THREE.ConeGeometry(0.03, 0.05, 3), x, 1.2, PZ - 0.152, 0, 0, i % 2 ? Math.PI : 0), K.stoneS); cnt("zigzag"); }   // a band of 5 zigzag notches
    const cap = new THREE.ConeGeometry(0.28, 0.2, 4); cap.rotateY(Math.PI / 4); Bp.add(place(cap, 0, 1.55, PZ), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny)));
    Bp.add(place(new THREE.SphereGeometry(0.1, 12, 9), 0, 1.72, PZ), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny * 0.6 + 0.4)));
    Bp.add(snowLump(0.12, 0.14, 0.12, 0, 1.76, PZ, 3, 12), snowC); c.M(Bp.geo(), c.vcN, g, true, true, true); }
  // the brass ram's-head spout 0.34 long at y 0.95, its 2 horns curled; a dipper on a 9-link chain; a bucket with 3 hoops frozen to the step
  { const Bb = new Bake(), bc = brassC(5); Bb.add(tube([[0, 0.95, 0.33 + DZ], [0, 0.95, 0.15 + DZ], [0, 0.95, -0.0 + DZ]], (t) => 0.03 - 0.008 * t, 10), bc);
    const hd = new THREE.SphereGeometry(1, 14, 10); hd.scale(0.06, 0.055, 0.075); Bb.add(place(hd, 0, 0.96, -0.03 + DZ), bc); const sn = new THREE.SphereGeometry(1, 10, 8); sn.scale(0.034, 0.03, 0.06); Bb.add(place(sn, 0, 0.935, -0.1 + DZ), bc);
    Bb.add(place(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8), 0, 0.915, -0.15 + DZ, Math.PI / 2), K.brassS);
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * 4.4 + 0.2, r = 0.065 - 0.04 * i / 18; pts.push([s * (0.05 + Math.sin(a) * r * 0.9), 0.985 + 0.0 + Math.cos(a) * r - 0.04, 0.0 - 0.02 + Math.sin(a * 0.5) * 0.0 + 0.0]); } Bb.add(tube(pts.map(([x, y, z], i) => [x + s * 0.02, y, z + 0.015 * (i / 18) - 0.03 + DZ]), (t) => 0.014 * (1 - 0.6 * t), 6), bc); cnt("horn"); }
    for (const s of [-1, 1]) Bb.add(place(new THREE.SphereGeometry(0.01, 6, 5), s * 0.028, 0.975, -0.075 + DZ), K.ironS);
    c.M(Bb.geo(), c.vc, g, false, true, true);
    // the dipper: a tin cup on a 9-link chain from the pillar
    const Bd = new Bake(), tin = (x, y, z, nx, ny) => cmix("#7a8088", "#e4e8ee", clamp(ny * 0.5 + 0.3)); for (let i = 0; i < 9; i++) Bd.add(place(new THREE.TorusGeometry(0.012, 0.0035, 4, 8), -0.17, 1.0 - i * 0.03, PZ + 0.0, i % 2 ? Math.PI / 2 : 0, 0, 0).translate(0, 0, 0), K.ironL); cnt("chainlink", 9);
    Bd.add(place(new THREE.CylinderGeometry(0.05, 0.035, 0.06, 10, 1, true), -0.17, 0.69, PZ), tin); Bd.add(place(new THREE.CylinderGeometry(0.035, 0.035, 0.004, 10), -0.17, 0.66, PZ), tin); Bd.add(tube([[-0.13, 0.7, PZ], [-0.1, 0.72, PZ - 0.01], [-0.07, 0.74, PZ - 0.02]], 0.006, 5), tin); c.M(Bd.geo(), c.vcN, g, false, true, true);
    const Bw = new Bake(); const bk = lathe([[0.1, 0], [0.12, 0.2], [0.115, 0.28]], 14); Bw.add(place(bk, -0.75, 0.08, -0.98), (x, y, z) => cmix("#6a4528", "#9a7040", hh(Math.floor(Math.atan2(z + 0.98, x + 0.75) * 7) + 3)));
    for (const y of [0.1, 0.23, 0.35]) Bw.add(place(new THREE.TorusGeometry(0.1 + (y - 0.08) * 0.09, 0.006, 4, 16).rotateX(Math.PI / 2), -0.75, y, -0.98), K.ironL); cnt("hoop", 3);
    Bw.add(place(new THREE.CylinderGeometry(0.125, 0.14, 0.04, 14), -0.75, 0.095, -0.98), "#cfe6f4"); Bw.add(snowLump(0.1, 0.03, 0.1, -0.75, 0.36, -0.98, 5, 8), snowC); c.M(Bw.geo(), c.vcN, g, false, true, true); cnt("bucket"); }
  // 29 icicles: 9 on the spout (longest 0.38), 14 on the trough rim (0.05-0.20), 6 on the cap
  { const wx = g.position.x, wy = g.position.y, wz = g.position.z;
    const sl = [0.38, 0.3, 0.26, 0.21, 0.17, 0.14, 0.12, 0.09, 0.07]; sl.forEach((L, i) => { const a = i / 9 * TAU; c.ices.push({ k: -1, i, x: wx + 0.0 + Math.cos(a) * 0.04, y: wy + 0.94 - 0.01 * (i % 3), z: wz - 0.05 + DZ + Math.sin(a) * 0.04 - 0.02 * (i > 4), L, r: 0.014 + 0.03 * L, hx: 0 }); cnt("icicle.fountain"); });
    for (let i = 0; i < 14; i++) { const L = 0.05 + 0.15 * H2(81, i), th = (-100 + i * (200 / 13) + 4 * (H2(82, i) - 0.5)) * DEG, r = 0.76 * octR(th); c.ices.push({ k: -1, i: 10 + i, x: wx + Math.sin(th) * r, y: wy + 0.505, z: wz - Math.cos(th) * r, L, r: 0.012 + 0.03 * L, hx: 0 }); cnt("icicle.fountain"); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, L = 0.06 + 0.1 * H2(83, i); c.ices.push({ k: -1, i: 30 + i, x: wx + Math.cos(a) * 0.24, y: wy + 1.5 - 0.02, z: wz + PZ + Math.sin(a) * 0.24, L, r: 0.012 + 0.03 * L, hx: 0 }); cnt("icicle.fountain"); } }
  // the frozen overflow tongue 0.4 down the downhill corner, a thread of water from the spout into the melt hole (`trickle`)
  { const tg = plate([[0, 0], [0.12, 0], [0.1, -0.2], [0.06, -0.4], [0.03, -0.36], [0.0, -0.18]], 0.025, 0.004); tg.rotateY(Math.PI / 2 * 0); const tm = c.M(tg, c.ice, g, false, false, true); tm.position.set(0.55, 0.54, -0.36); tm.rotation.y = 0.0; cnt("tongue"); }
  const th = steamy(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.5, 6), softMat({ color: "#dff1fb", opacity: 0.8 })), 5); th.position.set(0, 0.7, DZ - 0.03); g.add(th); c.trickle = th;
  const rp = steamy(new THREE.Mesh(new THREE.RingGeometry(0.03, 0.05, 20), softMat({ color: "#ffffff", opacity: 0.5, side: THREE.DoubleSide })), 5); rp.rotation.x = -Math.PI / 2; rp.position.set(0, 0.445, DZ - 0.03); g.add(rp); c.ripple = rp;
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// BOOTS on the steps (13 lane-built; doors 9, 8 and 4 carry E's) and what only one house has
// ---------------------------------------------------------------------------------------------------------------------
const BOOTS = {
  7: [{ h: 0.30, col: "#5a7a3a", kind: "rubber", fill: "treats" }, { h: 0.24, col: "#e8801a", kind: "felt", fill: "sticks" }, { h: 0.18, col: "#8ac8e8", kind: "felt", trim: "fur", fill: "treats" }],
  6: [{ h: 0.28, col: "#7a4aa0", kind: "rubber", fill: "treats" }, { h: 0.22, col: "#c0302a", kind: "felt", dots: 9, fill: "treats" }],
  5: [{ h: 0.27, col: "#6a4528", kind: "leather", laces: true, fill: "sticks" }, { h: 0.20, col: "#a8c8e8", kind: "felt", fill: "treats" }],
  3: [{ h: 0.26, col: "#3a8a4a", kind: "felt" }, { h: 0.22, col: "#e8dcc0", kind: "leather", laces: true }],
  2: [{ h: 0.24, col: "#e8801a", kind: "rubber" }],
  1: [{ h: 0.28, col: "#6a4528", kind: "leather", laces: true }, { h: 0.22, col: "#6a2a4a", kind: "felt" }, { h: 0.16, col: "#f4f1ea", kind: "rubber" }],
};
function buildBoots(c, h) {
  for (const [i, o] of (BOOTS[h.k] || []).entries()) {
    const b = buildBoot(c, o.h, { ...o, seed: h.k * 5 + i }); b.g.position.set(0.30 + 0.34 * i, 0, 1.10); b.g.rotation.y = Math.PI + (H2(h.k, i + 1500) - 0.5) * 0.6; h.hg.add(b.g); b.k = h.k; c.boots.push(b); cnt("laneboot");
  }
}
function buildSpecials(c, h) {
  const k = h.k, hg = h.hg, B = new Bake(), Bs = new Bake(), wd = (base, sd) => (X, Y, Z, nx, ny) => cmul(base, 0.8 + 0.3 * hh(Math.floor(X * 13 + Z * 7) + sd) + 0.15 * ny);
  if (k === 9) {   // a child's sledge leaning by the door: 2 runners, 5 slats, a rope
    const sl = new THREE.Group(); sl.position.set(1.65, 0.02, 0.2); sl.rotation.x = -105 * DEG; hg.add(sl); const Bq = new Bake();
    for (const x of [-0.13, 0.13]) { Bq.add(tube([[x, 0.03, -0.45], [x, 0.01, -0.3], [x, 0.01, 0.35], [x, 0.04, 0.5], [x, 0.1, 0.55]], 0.012, 5), ironC); Bq.add(boxG(0.025, 0.1, 0.03, x, 0.07, -0.3), K.woodB); Bq.add(boxG(0.025, 0.1, 0.03, x, 0.07, 0.3), K.woodB); }
    for (let i = 0; i < 5; i++) Bq.add(boxG(0.4, 0.02, 0.1, 0, 0.125, -0.38 + i * 0.19), wd("#b07a3a", i)); Bq.add(tube(arcPts(0, 0.12, 0.2, 0, 180, 10).map(([x, y]) => [x * 0.5, 0.13, 0.5 + y * 0.35 - 0.04]), 0.006, 4), "#c8b080");
    c.M(Bq.geo(), c.vcN, sl, false, true, true); cnt("sledge");
  }
  if (k === 8) {   // a bench with a snow cushion, 2 pairs of skis against the wall
    B.add(boxG(1.3, 0.05, 0.42, 2.6, 0.43, 0.3), wd("#8a5a30", 1)); for (const x of [2.05, 3.15]) for (const z of [0.15, 0.45]) B.add(boxG(0.06, 0.42, 0.06, x, 0.21, z), wd("#6a4528", 2)); B.add(boxG(1.2, 0.04, 0.05, 2.6, 0.2, 0.3), wd("#6a4528", 3));
    Bs.add(snowCapX(2.0, 3.2, 0.12, 0.48, 0.455, 0.1, null, 20), snowC); cnt("bench");
    for (const [x, col] of [[1.28, "#b8322e"], [1.36, "#b8322e"], [1.48, "#3a5a8a"], [1.56, "#3a5a8a"]]) { const sk = plate([[-0.035, 0], [0.035, 0], [0.035, 1.5], [0.02, 1.62], [-0.02, 1.7], [-0.035, 1.62]], 0.014, 0); sk.rotateX(-Math.PI / 2); const ang = 8 * DEG; const m = new THREE.Matrix4().compose(new V3(x, 0.02, 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ang, 0, 0)), new V3(1, 1, 1)); sk.applyMatrix4(m); B.add(sk, wd(col, 9)); cnt("ski"); }
  }
  if (k === 7) {   // stag antlers (10 points) on a shield on the balcony post at x +1.87
    const sh = plate([[-0.1, -0.1], [0.1, -0.1], [0.12, 0.05], [0, 0.13], [-0.12, 0.05]], 0.02, 0); sh.translate(1.87, 2.62, 0.655); B.add(sh, wd("#6a4528", 4));
    for (const s of [-1, 1]) { const pts = [[s * 0.02, 2.7, 0.68], [s * 0.1, 2.75, 0.72], [s * 0.2, 2.86, 0.74], [s * 0.26, 3.0, 0.75], [s * 0.28, 3.14, 0.75]].map(([x, y, z]) => [1.87 + x, y, z]); B.add(tube(pts, (t) => 0.014 * (1 - 0.6 * t), 6), (X, Y) => cmix("#8a7458", "#d8c8a0", clamp((Y - 2.7) / 0.4)));
      for (const [ti, len] of [[0.2, 0.1], [0.4, 0.13], [0.6, 0.11], [0.8, 0.08]]) { const i = Math.floor(ti * 4), p = pts[i], q = pts[i + 1], f = ti * 4 - i, bx = lerp(p[0], q[0], f), by = lerp(p[1], q[1], f), bz = lerp(p[2], q[2], f); B.add(tube([[bx, by, bz], [bx + s * 0.02, by + len * 0.7, bz + 0.03], [bx - s * 0.02, by + len, bz + 0.04]], 0.008, 5), "#d8c8a0"); cnt("point"); }
      B.add(tube([[pts[4][0], pts[4][1], pts[4][2]], [pts[4][0] + s * 0.02, pts[4][1] + 0.1, pts[4][2]]], 0.007, 5), "#e8dcc0"); cnt("point"); cnt("tine.tip"); }
  }
  if (k === 6) {   // a hay sledge under the balcony (a load of hay), a milk churn
    const Bq = new Bake(); for (const z of [0.2, 0.7]) { Bq.add(tube([[1.65, 0.05, z], [1.8, 0.03, z], [3.2, 0.03, z], [3.4, 0.08, z], [3.46, 0.2, z]], 0.02, 5), ironC); Bq.add(boxG(0.05, 0.1, 0.05, 2.0, 0.1, z), K.woodB); Bq.add(boxG(0.05, 0.1, 0.05, 3.0, 0.1, z), K.woodB); }
    Bq.add(boxG(1.4, 0.04, 0.6, 2.5, 0.16, 0.45), wd("#8a5a30", 6)); for (let i = 0; i < 38; i++) Bq.add(snowLump(0.14 + 0.1 * H2(i, 7), 0.12 + 0.1 * H2(i, 8), 0.12 + 0.08 * H2(i, 9), 1.95 + 1.1 * H2(i, 10), 0.2 + 0.28 * H2(i, 11) * (1 - Math.abs(H2(i, 10) - 0.5)), 0.3 + 0.3 * H2(i, 12), i, 5), (X, Y) => cmix("#8a6a2a", "#d8bc66", clamp((Y - 0.15) / 0.55) * (0.5 + 0.5 * hh(Math.floor(X * 20)))));
    Bs.add(snowCapX(2.0, 3.0, 0.25, 0.65, 0.6, 0.06, null, 12), snowC); cnt("haysledge");
    const ch = lathe([[0.0, 0], [0.12, 0], [0.14, 0.06], [0.13, 0.35], [0.1, 0.45], [0.07, 0.52], [0.09, 0.56], [0.0, 0.56]], 14); B.add(place(ch, 3.65, 0.0, 0.35), (X, Y, Z, nx, ny) => cmix("#6a7078", "#d8dde4", clamp(ny * 0.4 + 0.4 + 0.4 * (hh(Math.floor(Y * 20)) > 0.9 ? 1 : 0)))); B.add(place(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 12), 3.65, 0.58, 0.35), "#8a9098"); for (const s of [-1, 1]) B.add(tube(arcPts(3.65 + s * 0.12, 0.42, 0.04, s > 0 ? -90 : 270, s > 0 ? 90 : -90, 8).map(([x, y]) => [x, y, 0.35]), 0.008, 4), K.ironL); cnt("churn");
    c.M(Bq.geo(), c.vc, hg, false, true, true);
  }
  if (k === 5) {   // a snow shovel and a birch broom leaning at the wall
    B.add(tube([[1.3, 0.0, 0.2], [1.3, 0.75, 0.12], [1.3, 1.3, 0.07]], 0.014, 5), wd("#8a5a30", 8)); const sv = plate([[-0.13, 0], [0.13, 0], [0.14, 0.3], [0, 0.36], [-0.14, 0.3]], 0.012, 0); sv.rotateX(-1.1); sv.translate(1.3, 0.0, 0.26); B.add(sv, (X, Y, Z, nx, ny) => cmix("#7a6a50", "#a8987a", clamp(ny))); cnt("shovel");
    for (let i = 0; i < 40; i++) { const a = H2(i, 3) * TAU, r = 0.045 * H2(i, 4), x = 1.55 + Math.cos(a) * r; B.add(tube([[x, 0.02, 0.2 + Math.sin(a) * r], [x + (Math.cos(a)) * 0.01, 0.3, 0.17 + Math.sin(a) * r * 0.6]], 0.003, 3, false), (X, Y) => cmix("#b8a070", "#ece6d8", H2(i, 5))); } B.add(tube([[1.55, 0.28, 0.17], [1.55, 0.8, 0.12], [1.55, 1.25, 0.08]], 0.012, 5), wd("#8a5a30", 9)); B.add(place(new THREE.TorusGeometry(0.05, 0.007, 4, 10), 1.55, 0.3, 0.17, Math.PI / 2), "#4a3424"); cnt("broom.birch");
  }
  if (k === 3) {   // a snowman 0.75 tall: pot hat, twig arms, 5 coal buttons
    const bx = 2.3, bz = 0.95; Bs.add(snowLump(0.17, 0.17, 0.17, bx, 0.0, bz, 1, 14), snowC); Bs.add(snowLump(0.125, 0.125, 0.125, bx, 0.3, bz, 2, 12), snowC); Bs.add(snowLump(0.09, 0.09, 0.09, bx, 0.52, bz, 3, 10), snowC);
    for (const s of [-1, 1]) B.add(tube([[bx + s * 0.11, 0.42, bz], [bx + s * 0.26, 0.5, bz + 0.03], [bx + s * 0.34, 0.58, bz + 0.04]], 0.007, 4), "#4a3424"), B.add(tube([[bx + s * 0.26, 0.5, bz + 0.03], [bx + s * 0.3, 0.46, bz + 0.05]], 0.005, 4), "#4a3424");
    for (const [x, y, z] of [[-0.03, 0.62, 0.075], [0.03, 0.62, 0.075], [0, 0.38, 0.12], [0, 0.31, 0.125], [0, 0.24, 0.12]]) B.add(place(new THREE.SphereGeometry(0.014, 6, 5), bx + x, y, bz + z), "#14100c"), cnt("coal");
    B.add(place(new THREE.ConeGeometry(0.012, 0.07, 5), bx, 0.58, bz + 0.11, Math.PI / 2), "#e8801a"); B.add(place(new THREE.CylinderGeometry(0.055, 0.045, 0.09, 12), bx, 0.72, bz), "#2a2a30"); B.add(place(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 12), bx, 0.675, bz), "#2a2a30"); B.add(tube(arcPts(bx + 0.06, 0.74, 0.03, -60, 100, 6).map(([x, y]) => [x, y, bz]), 0.005, 4), "#2a2a30"); cnt("snowman");
  }
  if (k === 2) {   // a handcart with 2 sacks under snow
    B.add(boxG(1.1, 0.06, 0.6, 2.5, 0.38, 0.8), wd("#8a5a30", 12)); for (const z of [0.5, 1.1]) B.add(boxG(1.1, 0.14, 0.03, 2.5, 0.45, z), wd("#6a4528", 13)); for (const x of [1.95, 3.05]) B.add(boxG(0.03, 0.14, 0.6, x, 0.45, 0.8), wd("#6a4528", 14));
    for (const z of [0.42, 1.18]) { B.add(place(new THREE.TorusGeometry(0.28, 0.025, 6, 20), 2.5, 0.3, z, 0, 0, 0).rotateY(0), wd("#6a4528", 15)); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.add(tube([[2.5, 0.3, z], [2.5 + Math.cos(a) * 0.27, 0.3 + Math.sin(a) * 0.27, z]], 0.01, 4, false), wd("#8a5a30", 16)); } B.add(place(new THREE.SphereGeometry(0.04, 6, 5), 2.5, 0.3, z), ironC); cnt("wheel"); }
    B.add(tube([[3.05, 0.42, 0.65], [3.6, 0.46, 0.55]], 0.016, 5), wd("#6a4528", 17)); B.add(tube([[3.05, 0.42, 0.95], [3.6, 0.46, 1.05]], 0.016, 5), wd("#6a4528", 18)); B.add(boxG(0.03, 0.03, 0.5, 3.6, 0.46, 0.8), wd("#6a4528", 19));
    for (const [x, z] of [[2.2, 0.8], [2.8, 0.85]]) { const sk = new THREE.SphereGeometry(1, 12, 9), p = sk.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 0.26 * (1 + 0.08 * Math.sin(i * 1.7)), p.getY(i) * 0.19, p.getZ(i) * 0.2); sk.computeVertexNormals(); B.add(place(sk, x, 0.55, z, 0, x, 0), (X, Y) => cmix("#8a7448", "#b8a068", hh(Math.floor(X * 25 + Y * 17)))); Bs.add(snowLump(0.22, 0.07, 0.17, x, 0.66, z, x * 3, 10), snowC); cnt("sack"); }
  }
  if (k === 1) {   // a stone cattle trough
    for (const [w, d, x, z] of [[1.5, 0.12, 2.3, 0.55], [1.5, 0.12, 2.3, 1.05], [0.12, 0.62, 1.62, 0.8], [0.12, 0.62, 2.98, 0.8]]) B.add(boxG(w, 0.52, d, x, 0.26, z), (X, Y, Z, nx, ny) => cmix(K.stoneS, K.stoneL, clamp(ny * 0.5 + 0.3 * hh(Math.floor(X * 9 + Z * 9))))); B.add(boxG(1.5, 0.1, 0.6, 2.3, 0.05, 0.8), K.stoneS);
    const ig = new THREE.PlaneGeometry(1.34, 0.46); ig.rotateX(-Math.PI / 2); ig.translate(2.3, 0.42, 0.8); c.M(ig, c.ice, hg, false, false, true); Bs.add(snowCapX(1.58, 3.02, 0.48, 1.12, 0.52, 0.1, null, 20), snowC); cnt("trough");
  }
  if (B.n) c.M(B.geo(), c.vc, hg, k === 1 || k === 8 || k === 3, true, true); if (Bs.n) c.M(Bs.geo(), c.vcSnow, hg, false, false, true);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE FAR LAYERS: meadow beyond the wall, the lane bending into the firs, the lower village, the peaks, the sky and its 420 stars
// ---------------------------------------------------------------------------------------------------------------------
const sY = (x) => { let s = 0; for (let i = -4; i <= 4; i++) s += laneY(x + i); return s / 9; };   // the lane's height smoothed over 9 m
const EXT = (x) => sY(Math.min(x, 90)) + (x < -44 ? 0.003 * (-44 - x) * (-44 - x) : 0);
const zc = (x) => (x < -44 ? 3.7 - 0.0096 * (-44 - x) * (-44 - x) : 3.7);   // the lane's centre line; it bends right (toward -z) up in the firs
const BAY = [-2.6, 0.6, 5.9, 7.2];
function terrainH(x, z) {
  const base = EXT(x), up = clamp((-42 - x) / 6), n = (vn(x, 0, z, 0.06, 11) - 0.5) * 0.9 + (vn(x, 0, z, 0.21, 12) - 0.5) * 0.25;
  let h;
  if (x > 27) { const d = (x - 27); h = base - 0.3 + (z > 3.7 ? Math.max(-Math.tan(15 * DEG) * (z - 3.7), -10) : Math.min(0.35 * (3.7 - z), 18)) + n * (0.4 + d * 0.01); }
  else if (z >= 5.9) h = Math.max(base - 26, base + 0.3 - Math.tan(15 * DEG) * (z - 5.9) - (z > 40 ? 0.25 * (z - 40) : 0) + n);
  else { const zb = Math.max(z, -62); h = base - 0.6 + Math.max(0, -7.8 - zb) * 0.35 + (zb < -7.8 ? n * 0.6 : 0) + (zb < -30 ? 0.01 * (zb + 30) * (zb + 30) : 0); }
  if (up > 0) { const hill = base - 0.4 + 0.026 * Math.pow(Math.abs(z - zc(x)), 1.5) + n * 1.2; h = lerp(h, hill, sm(up)); }
  return h;
}
function buildTerrain(c) {
  const mk = (a, b, st, extra) => { const s = new Set(); for (let v = a; v <= b + 1e-6; v += st) s.add(Math.round(v * 100) / 100); for (const e of extra) s.add(e); const arr = [...s].sort((p, q) => p - q), out = []; for (const v of arr) if (!out.length || v - out[out.length - 1] > 0.8 || extra.includes(v)) out.push(v); return out; };
  const xs = mk(-125, 300, 3.2, [-2.6, 0.6, -44, 27]), zs = mk(-130, 130, 3.2, [5.9, 7.2, 5.0, -7.8]);
  const pos = [], col = [], idx = [], tmp = new THREE.Color(), tr = [0, 1, 2].map((i) => 10 + 8 * i);
  for (let j = 0; j < zs.length; j++) for (let i = 0; i < xs.length; i++) { const x = xs[i], z = zs[j], y = terrainH(x, z); pos.push(x, y, z);
    const sh = clamp(0.5 + (terrainH(x + 1, z) - terrainH(x - 1, z)) * -0.25), trk = tr.some((t, q) => z > 5.9 && x < 27 && Math.abs(z - (t + 3 * Math.sin(x * 0.07 + q * 2))) < 0.35) ? 0.6 : 0, fz = clamp((z - 8) / 30), far = clamp((x - 70) / 170);
    tmp.set(cmix(cmix(cmix(K.snow, K.snowS, 0.25 + 0.4 * sh + 0.2 * (vn(x, 0, z, 0.3, 2) - 0.5)), K.snowS, trk * 0.8 + 0.3 * fz), "#5a6aa0", far * 0.75)); col.push(tmp.r, tmp.g, tmp.b); }
  const nx = xs.length; for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const cxm = (xs[i] + xs[i + 1]) / 2, czm = (zs[j] + zs[j + 1]) / 2; if (cxm > BAY[0] && cxm < BAY[1] && czm > BAY[2] && czm < BAY[3]) continue;
    const a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1; idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = c.M(g, c.vcSnow, c.root, false, false, true); cnt("terrain");
  // the up-lane ribbon (packed snow with 2 sledge grooves) bending right into the firs, and the lower lane
  { const pts = [], n = 60; for (let i = 0; i <= n; i++) { const x = -44 - i * (51 / n); pts.push([x, zc(x)]); } const pos2 = [], col2 = [], idx2 = [];
    pts.forEach(([x, z], i) => { const dz = (pts[Math.min(i + 1, n)][1] - pts[Math.max(i - 1, 0)][1]), dx = (pts[Math.min(i + 1, n)][0] - pts[Math.max(i - 1, 0)][0]), L = Math.hypot(dx, dz), nxv = -dz / L, nzv = dx / L, w = 1.8 - 0.4 * i / n; for (const s of [-1, 0, 1]) { pos2.push(x + nxv * s * w, EXT(x) + 0.03 + (s === 0 ? 0.0 : -0.04), z + nzv * s * w); const e = s === 0 ? 0 : 1; col2.push(...new THREE.Color(cmix("#b4c4e2", "#f6faff", e * 0.7)).toArray()); } });
    for (let i = 0; i < n; i++) for (let s = 0; s < 2; s++) { const a = i * 3 + s, b = a + 1, cc = a + 3, d = cc + 1; idx2.push(a, b, cc, b, d, cc); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos2, 3)); rg.setAttribute("color", new THREE.Float32BufferAttribute(col2, 3)); rg.setIndex(idx2); rg.computeVertexNormals(); c.M(rg, c.vcSnow, c.root, false, false, true); }
  { const pos2 = [], idx2 = []; for (let i = 0; i <= 20; i++) { const x = 24.6 + i * 3.4; for (const z of [1.9, 5.5]) pos2.push(x, laneY(x) + 0.02, z); } for (let i = 0; i < 20; i++) { const a = i * 2; idx2.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos2, 3)); rg.setIndex(idx2); rg.computeVertexNormals(); c.M(rg, c.mat("#b4c4e2", { side: THREE.DoubleSide }), c.root, false, false, true); }
}

// ---- the firs (the white-capped fir of the snow slope, 1 m tall, instanced): 40 in 6 clumps on the meadow, 120 up the lane, the slope behind the houses, the lower village
function buildFirs(c) {
  const fg = firGeometry(), cp = fg.attributes.aCol; fg.setAttribute("color", new THREE.BufferAttribute(cp.array.slice(), 3)); fg.deleteAttribute("aCol");
  const list = [];
  const clumps = [[-30, 14], [-6, 24], [20, 18], [44, 30], [-40, 30], [8, 36]]; clumps.forEach(([cx, cz], q) => { for (let i = 0; i < (q < 4 ? 7 : 6); i++) { const x = cx + (H2(q, i + 1600) - 0.5) * 14, z = cz + (H2(q, i + 1610) - 0.5) * 10; list.push([x, z, 4 + 7 * H2(q, i + 1620)]); } }); const nMead = list.length;
  for (let i = 0; i < 120; i++) { const x = -42 - 54 * Math.sqrt(H2(i, 1630)), side = H2(i, 1640) < 0.5 ? -1 : 1, off = 3.5 + 20 * H2(i, 1650) * (1 + (-44 - x) * 0.04); list.push([x, zc(x) + side * off, 5 + 8 * H2(i, 1660)]); }
  for (let i = 0; i < 70; i++) list.push([-44 + 76 * H2(i, 1670), -9 - 36 * H2(i, 1680), 5 + 8 * H2(i, 1690)]);
  for (let i = 0; i < 30; i++) list.push([30 + 60 * H2(i, 1700), (H2(i, 1710) < 0.5 ? -1 : 1) * (14 + 14 * H2(i, 1720)) + 4, 4 + 6 * H2(i, 1730)]);
  for (let i = 0; i < 110; i++) { const x = 34 + 210 * Math.pow(H2(i, 1740), 1.5), z = -90 + 180 * H2(i, 1750); if (x < 100 && Math.abs(z - 3.7) < 9 + 6 * H2(i, 1755)) continue; list.push([x, z, 6 + 8 * H2(i, 1760)]); }
  const nValley = list.length - nMead - 120 - 70 - 30;
  const im = new THREE.InstancedMesh(fg, c.reg(noLine(stdMat({ vertexColors: true, roughness: 0.95 }))), list.length), d = new THREE.Object3D();
  list.forEach(([x, z, s], i) => { d.position.set(x, terrainH(x, z) - 0.15, z); d.rotation.set(0, hh(i * 3.1) * TAU, 0); d.scale.set(s * (0.9 + 0.2 * hh(i * 5.7)), s, s * (0.9 + 0.2 * hh(i * 7.3))); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); im.frustumCulled = false; im.userData.solid = false; c.root.add(im);
  cnt("fir.meadow", nMead); cnt("fir.up", 120); cnt("fir.back", 70); cnt("fir.low", 30); cnt("fir.valley", nValley);
}

// ---- the meadow furniture: a split-rail fence of 26 capped posts, 2 log hay barns 3 x 3 with snow roofs and a ladder, the sledge tracks (painted in the terrain), the last 2 fence posts and a hay rack up the lane
function buildMeadow(c) {
  const B = new Bake(), Bs = new Bake(), post = (x, z, h = 1.1) => { const y = terrainH(x, z); B.add(boxG(0.14, h, 0.14, x, y + h / 2 - 0.1, z), (X, Y, Z, nx, ny) => cmul(K.wood, 0.75 + 0.3 * hh(Math.floor(Y * 6) + x))); Bs.add(snowLump(0.1, 0.05, 0.1, x, y + h - 0.12, z, x, 6), snowC); return y; };
  const fz = (x) => 12.5 + 6 * Math.sin(x * 0.045) + 2 * Math.sin(x * 0.13);
  const xs = []; for (let i = 0; i < 26; i++) xs.push(-42 + i * 4.9);
  xs.forEach((x, i) => { const y = post(x, fz(x)); cnt("fencepost"); if (i < 25) { const x2 = xs[i + 1], y2 = terrainH(x2, fz(x2)); for (const hh_ of [0.35, 0.75]) { B.add(tube([[x + 0.07, y + hh_, fz(x)], [x2 - 0.07, y2 + hh_, fz(x2)]], 0.035, 5), (X, Y) => cmul(K.wood, 0.7 + 0.3 * hh(Math.floor(X)))); } } });
  for (const x of [-96, -90]) { const z = zc(x) + 3.5; post(x, z); }   // the last 2 fence posts up the lane
  { const x = -60, z = zc(x) + 4.5, y = terrainH(x, z); for (const sx of [-0.8, 0.8]) B.add(boxG(0.1, 1.2, 0.1, x + sx, y + 0.6, z), K.wood); B.add(boxG(1.8, 0.08, 0.1, x, y + 1.15, z), K.wood); for (let i = 0; i < 8; i++) B.add(boxG(0.03, 0.9, 0.03, x - 0.7 + i * 0.2, y + 0.55, z + 0.15), K.wood); B.add(boxG(1.8, 0.05, 0.5, x, y + 1.18, z + 0.2), (X, Y, Z, nx, ny) => cmix("#c8a85a", "#e8d9a0", hh(Math.floor(X * 20)))); Bs.add(snowLump(0.9, 0.1, 0.3, x, y + 1.22, z + 0.2, 4, 8), snowC); cnt("hayrack"); }
  c.M(B.geo(), c.vcN, c.root, false, false, true); c.M(Bs.geo(), c.vcSnow, c.root, false, false, true);
  // 2 log barns 3 x 3 (2.4 high) with snow roofs and a ladder
  for (const [bx, bz] of [[-12, 16], [9, 22]]) {
    const by = terrainH(bx, bz) - 0.1, g = new THREE.Group(); g.position.set(bx, by, bz); c.root.add(g);
    const lt = mtex(3, 2.4, 70, (gg, W, H) => { for (let r = 0; r < 12; r++) { const y0 = r * H / 12, b = cmul(K.wood, 0.8 + 0.4 * H2(bx + r, 3)); gg.fillStyle = b; gg.fillRect(0, y0, W, H / 12); grain(gg, 0, y0, W, H / 12, bx + r * 3, b, { lines: 4 }); gg.fillStyle = rgba("#1a0e06", 0.6); gg.fillRect(0, y0, W, 0.012); } }, `barn${bx}`);
    const bm = c.mat("#ffffff", { map: lt, roughness: 0.95 }); for (const [w, ry, x, z] of [[3, 0, 0, 1.5], [3, Math.PI, 0, -1.5], [3, Math.PI / 2, 1.5, 0], [3, -Math.PI / 2, -1.5, 0]]) { const p = new THREE.PlaneGeometry(w, 2.4); p.rotateY(ry); p.translate(x, 1.2, z); c.M(p, bm, g, true, true, true); }
    const Br = new Bake(), Rs = new Bake(); const rr = 2.1 * Math.tan(25 * DEG); for (const s of [-1, 1]) { const rp = new THREE.BoxGeometry(3.6, 0.06, 2.0); Br.add(place(rp, 0, 2.4 + rr / 2 + 0.05, s * 1.0, -s * 25 * DEG * -1, 0, 0), K.woodS); }
    Rs.add(loftX(-1.9, 1.9, 24, (u, x) => { const k = 0.25 + 0.75 * sm(Math.min(u, 1 - u) * 3.8 / 0.5), out = []; for (const [s, z] of [[-1, 1]]) { } const pr = capProfile(-1.75, 1.75, 0, 0.4, k), A = 25 * DEG; return pr.map(([zz, h]) => [zz, 2.4 + rr + 0.05 - Math.abs(zz) * Math.tan(A) + h]); }, CAPN), snowC);
    const lad = new Bake(); for (const sx of [-0.2, 0.2]) lad.add(tube([[sx + 1.7, 0, 1.3], [sx + 1.7, 2.3, 1.55]], 0.025, 5), K.wood); for (let i = 0; i < 8; i++) lad.add(boxG(0.4, 0.03, 0.04, 1.7, 0.25 + i * 0.27, 1.32 + 0.1 * i / 8 * 2), K.wood);
    c.M(Br.geo(), c.vcN, g, true, true, false); c.M(Rs.geo(), c.vcSnow, g, false, true, true); c.M(lad.geo(), c.vcN, g, false, true, false); cnt("barn");
  }
}

// ---- the lower village down the lane (x +27..+90, dropping 22 m): 34 snow roofs, 46 lit windows as points, the church of F (no clock) at (+74, +16), a river as a dark ribbon with 6 moon glints
function buildLowerVillage(c) {
  const Bh = new Bake(), Bs = new Bake(), wins = [], R = (i, s) => H2(i, s + 1800);
  for (let i = 0; i < 34; i++) {
    const x = 32 + 56 * (i / 34) + 2 * R(i, 1), side = i % 2 ? 1 : -1, z = 3.7 + side * (9 + 9 * R(i, 2) + (i % 4 === 0 ? 8 : 0)), w = 4 + 2 * R(i, 3), d = 5 + 2 * R(i, 4), h = 3 + R(i, 5), y = terrainH(x, z) - 0.2, ry = R(i, 6) < 0.5 ? 0 : Math.PI / 2;
    Bh.add(place(new THREE.BoxGeometry(w, h + 2.4, d), x, y + (h - 2.4) / 2, z, 0, ry, 0), (X, Y, Z, nx, ny) => cmix("#2a2230", "#4a3a3a", 0.4 + 0.3 * hh(i)));
    const rf = new THREE.CylinderGeometry(0.01, 0.75 * Math.max(w, d), 0.5 * Math.max(w, d), 4, 1); rf.rotateY(Math.PI / 4); rf.scale(1, 0.9, 1); Bs.add(place(rf, x, y + h + 0.5 * 0.5 * Math.max(w, d) * 0.9 - 0.1, z, 0, ry, 0), (X, Y, Z, nx, ny) => cmix(K.snowS, K.snow, clamp(ny))); cnt("roof.low");
    const nw = i < 12 ? 2 : 1; for (let q = 0; q < nw && wins.length < 40; q++) wins.push([x - (ry === 0 ? w / 2 : d / 2) - 0.05, y + 1.4 + 0.5 * q, z + (q ? 1.2 : -1.0)]);
  }
  // the church (nave, tower and spire, no clock), at (+74, +16)
  { const cx = 74, cz = 16, cy = terrainH(cx, cz) - 0.2; Bh.add(boxG(6, 6.5, 12, cx, cy + 3.25, cz), "#3a3040"); Bh.add(boxG(3.4, 10, 3.4, cx, cy + 5, cz + 7.2), "#3a3040"); const sp = new THREE.ConeGeometry(2.6, 6, 4); sp.rotateY(Math.PI / 4); Bs.add(place(sp, cx, cy + 13, cz + 7.2), K.snow); const rf = new THREE.CylinderGeometry(0.01, 5, 2.4, 4, 1); rf.rotateY(Math.PI / 4); rf.scale(1.1, 1, 1.5); Bs.add(place(rf, cx, cy + 7.6, cz), K.snow); cnt("church");
    for (let i = 0; i < 6; i++) wins.push([cx - 3.05, cy + 3 + 0.3 * (i % 2), cz - 4.5 + i * 1.8]); for (let i = 0; i < 2; i++) wins.push([cx - 1.75, cy + 6 + 1.5 * i, cz + 7.2]); }
  c.M(Bh.geo(), c.vcN, c.root, false, false, true); c.M(Bs.geo(), c.vcSnow, c.root, false, false, true);
  { const wp = new Float32Array(46 * 3); for (let i = 0; i < 46; i++) { const w = wins[i % wins.length]; wp.set([w[0], w[1], w[2] + (i >= wins.length ? 0.9 : 0)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(wp, 3)); const pm = noLine(new THREE.PointsMaterial({ map: c.glowTex, color: K.win, size: 1.1, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false })); const pt = new THREE.Points(g, pm); pt.frustumCulled = false; pt.userData.solid = false; c.root.add(pt); cnt("window.low", 46); }
  // the river: a dark ribbon in the valley with 6 moon glints
  { const pts = [], n = 30; for (let i = 0; i <= n; i++) { const x = 20 + 100 * i / n, z = 62 - 20 * i / n + 8 * Math.sin(i * 0.5); pts.push([x, z]); } const pos = [], idx = [];
    pts.forEach(([x, z], i) => { pos.push(x, terrainH(x, z - 2.5) + 0.15, z - 2.5, x, terrainH(x, z + 2.5) + 0.15, z + 2.5); }); for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    c.M(rg, softMat({ color: "#141c34", opacity: 0.95, side: THREE.DoubleSide }), c.root, false, false, false).renderOrder = 1; const Bg = new Bake(); for (let i = 0; i < 6; i++) { const q = pts[3 + i * 4]; Bg.add(boxG(2.4, 0.05, 0.3, q[0], terrainH(q[0], q[1]) + 0.25, q[1]), "#f4f1e0"); } const gm = c.M(Bg.geo(), noLine(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false })), c.root); gm.userData.solid = false; cnt("glint.river", 6); }
}

// ---------------------------------------------------------------------------------------------------------------------
// SKY: the dome (NIGHT SKY), 420 stars in 3 sizes (12 % twinkling 8 %), 4 thin moonlit clouds, the MOON (a disc 3.2 degrees across, 5 grey seas, a halo of 9 degrees at 0.15), the peaks as a painted ring
// ---------------------------------------------------------------------------------------------------------------------
const SKYR = 255, RINGR = 240, EL0 = -9, EL1 = 38;
const azDir = (az, el, r = 1) => { const a = az * DEG, e = el * DEG; return [-Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.sin(a) * Math.cos(e) * r]; };   // az 0 = up the lane (-x), + toward -z (right of that view)
const yOfEl = (e, H) => ((Math.tan(EL1 * DEG) - Math.tan(e * DEG)) / (Math.tan(EL1 * DEG) - Math.tan(EL0 * DEG))) * H;
function paintPanorama() {
  const W = 4096, H = 512, xAz = (a) => ((((90 + a) % 360) + 360) % 360) / 360 * W;   // the ring is mirrored (scale.x -1): u = (90 + az) / 360
  return canvasTex(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    const Y = (e) => yOfEl(e, H), X = (a) => xAz(a), ppd = W / 360;
    // a ridge of peaks as polygons [az offset, el] around a centre, lit left (toward the moon), shade right
    const ridge = (a0, pts, lit, shade, seed) => {
      const P = pts.map(([da, e]) => [X(a0 + da), Y(e)]); const wrap = (x) => x;
      for (const off of [0, -W, W]) {
        g.save(); g.translate(off, 0); g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(P[P.length - 1][0], Y(-12)); g.lineTo(P[0][0], Y(-12)); g.closePath(); g.clip();
        const sx = P.reduce((m, p) => (p[1] < m[1] ? p : m), P[0]); g.fillStyle = shade; g.fillRect(0, 0, W, H);
        g.fillStyle = lit; g.beginPath(); g.moveTo(sx[0], sx[1]); for (let i = 0; i < 18; i++) { const t = i / 17; g.lineTo(sx[0] - (6 + 90 * t) * ppd * 0.25 * (1 - 0.3 * Math.sin(t * 5 + seed)) , sx[1] + t * (Y(-12) - sx[1])); } g.lineTo(sx[0] - 600, Y(-12)); g.lineTo(sx[0] - 600, 0); g.closePath(); g.fill();
        // lit faces: facets on the left of the summit, separated by ridges
        for (let f = 0; f < 7; f++) { const x0 = sx[0] - (f + 1) * 14 * ppd * 0.25 * (0.6 + 0.8 * hh(seed + f)), y0 = sx[1] + 12 + f * 8; g.fillStyle = rgba(f % 2 ? "#e8f0ff" : "#9fb4e0", 0.25); g.beginPath(); g.moveTo(sx[0] - 2, sx[1] + 4); g.lineTo(x0, y0 + 60 * hh(seed + f * 3)); g.lineTo(x0 + 20, y0 + 160); g.lineTo(sx[0] - 4, y0 + 120); g.closePath(); g.fill(); }
        // 9 rock bands #2a3358 (broken strips), 3 hanging snowfields
        for (let b = 0; b < 9; b++) { const y = sx[1] + 14 + b * (Y(-4) - sx[1]) / 10 + 6 * hh(seed + b * 5); g.beginPath(); g.moveTo(sx[0] - 160, y); for (let q = 0; q <= 16; q++) g.lineTo(sx[0] - 160 + q * 20, y + (hh(seed + b * 17 + q) - 0.5) * 10 + (q % 2 ? 2 : -2)); g.lineWidth = 3 + 3 * hh(seed + b); g.strokeStyle = rgba("#2a3358", 0.55); g.stroke(); if (off === 0 && seed === 7) cnt("rockband"); }
        for (let s = 0; s < 3; s++) { const x = sx[0] - 60 + s * 52 + 10 * hh(seed + s), y = sx[1] + 30 + 34 * hh(seed + s * 7); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 24, y + 20, x + 14, y + 80, x + 4 - 6 * s, y + 130); g.bezierCurveTo(x - 14, y + 80, x - 22, y + 30, x, y); g.fillStyle = rgba("#eaf0ff", 0.55); g.fill(); if (off === 0 && seed === 7) cnt("snowfield"); }
        g.restore();
      }
    };
    // the far range, valley: 5 peaks #5a6aa0 to #8a98c8 round the horizon
    [[120, 8, "#5a6aa0"], [152, 11, "#6a7ab0"], [186, 7, "#7a8abc"], [218, 12, "#8a98c8"], [256, 9, "#6a7ab0"]].forEach(([a, e, col], i) => { ridge(a, [[-16, -2], [-9, e * 0.55], [-4, e * 0.8], [0, e], [3, e * 0.7], [8, e * 0.6], [17, -2]], cmix(col, "#c9d6f0", 0.3), cmul(col, 0.78), 90 + i); cnt("peak.far"); });
    // low ridges all round (so no gap), the 3 peaks next to the hero: 2 to its left, 1 to its right
    [[-28, 6], [60, 7], [96, 6], [300, 8], [336, 6]].forEach(([a, e], i) => ridge(a, [[-18, -2], [-8, e * 0.6], [0, e], [9, e * 0.55], [20, -2]], "#8a9ac8", "#4a5a8a", 40 + i));
    ridge(-39 + 6, [[-14, -2], [-6, 9], [-2, 13.5], [1, 15], [4, 10], [9, 5], [15, -2]], "#c9d6f0", "#3a4a7a", 11); cnt("peak.low");
    ridge(-20 + 6, [[-13, -2], [-7, 10], [-3, 17], [0, 20], [3, 16], [8, 8], [14, -2]], "#c9d6f0", "#3a4a7a", 12); cnt("peak.low");
    ridge(34, [[-12, -2], [-6, 8], [-2, 15], [1, 17], [4, 10], [9, 6], [15, -2]], "#c9d6f0", "#3a4a7a", 13); cnt("peak.low");
    // the hero peak, 6 degrees right of up the lane: a horn
    ridge(6, [[-17, -2], [-10, 7], [-6, 13], [-3.6, 19], [-1.6, 24], [-0.4, 27.5], [0.2, 28.5], [1.2, 25], [2.4, 20], [4.6, 13], [8, 8], [13, 4], [20, -2]], "#c9d6f0", "#3a4a7a", 7); cnt("peak.hero");
    // a thin banner cloud #dfe8f8 at 0.5 streaming from the summit
    { const x = X(6), y = Y(27.5); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x, y + 4 + i * 3); g.bezierCurveTo(x + 40, y - 10 + i * 4, x + 160, y + 6 + i * 6, x + 260, y + 4 + i * 8 + 5 * i); g.bezierCurveTo(x + 150, y + 20 + i * 5, x + 40, y + 16 + i * 3, x, y + 8 + i * 3); g.fillStyle = rgba("#dfe8f8", 0.5 - 0.08 * i); g.fill(); } cnt("banner"); }
    // the mist band #7f95c4 at 0.35 above the valley, the valley floor below
    { const q = g.createLinearGradient(0, Y(8), 0, Y(-2)); q.addColorStop(0, rgba("#7f95c4", 0)); q.addColorStop(0.6, rgba("#7f95c4", 0.35)); q.addColorStop(1, rgba("#7f95c4", 0.5)); g.fillStyle = q; g.fillRect(0, Y(8), W, Y(-2) - Y(8)); const q2 = g.createLinearGradient(0, Y(-2), 0, Y(-9)); q2.addColorStop(0, "#6a7aae"); q2.addColorStop(1, "#4a5a90"); g.fillStyle = q2; g.fillRect(0, Y(-2), W, H - Y(-2)); }
  }, "panorama", 4);
}
function paintMoon() {
  return canvasTex(256, 256, (g, W) => {
    g.clearRect(0, 0, W, W); const q = g.createRadialGradient(128, 128, 0, 128, 128, 128); q.addColorStop(0, rgba("#dfe8ff", 0.0)); q.addColorStop(0.355, rgba("#dfe8ff", 0.0)); q.addColorStop(0.36, rgba("#dfe8ff", 0.4)); q.addColorStop(1, rgba("#dfe8ff", 0)); g.fillStyle = q; g.fillRect(0, 0, W, W);   // the halo, 9 degrees (the disc is 3.2 degrees = 0.355 of it)
    const R = 128 * 0.355; ellP2(g, 128, 128, R); g.fillStyle = "#f4f1e0"; g.fill();
    for (let i = 0; i < 5; i++) { g.save(); ellP2(g, 128, 128, R); g.clip(); const a = i / 5 * TAU + 0.6, r = R * (0.2 + 0.45 * hh(i + 3)); ellP2(g, 128 + Math.cos(a) * r, 128 + Math.sin(a) * r, R * (0.16 + 0.12 * hh(i * 2)), 0); g.fillStyle = rgba("#a8a8a8", 0.5); g.fill(); g.restore(); cnt("moon.sea"); }
  }, "moon", 1);
}
function ellP2(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
function paintCloud(seed) {
  return canvasTex(512, 96, (g, W, H) => { g.clearRect(0, 0, W, H); for (let i = 0; i < 26; i++) { const x = 40 + (W - 80) * (i / 25), y = H / 2 + (hh(seed + i) - 0.5) * 18, r = 14 + 26 * hh(seed + i * 3) * Math.sin(Math.PI * i / 25); const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba("#c9d6f0", 0.34)); q.addColorStop(0.6, rgba("#9fb0d8", 0.14)); q.addColorStop(1, rgba("#9fb0d8", 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); } for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(30 + i * 20, H / 2 - 8 - 4 * hh(seed + i)); g.bezierCurveTo(120 + i * 30, H / 2 - 18, 260 + i * 20, H / 2 - 12, 470 - i * 14, H / 2 - 4); g.strokeStyle = rgba("#dfe8f8", 0.2); g.lineWidth = 1.2; g.stroke(); } }, `cloud${seed}`, 1);
}
function buildSky(c) {
  const sk = new THREE.Group(); c.root.add(sk); c.sky = sk;
  { const g = new THREE.SphereGeometry(SKYR, 40, 24), p = g.attributes.position, col = new Float32Array(p.count * 3), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const e = Math.asin(clamp(p.getY(i) / SKYR, -1, 1)) / (Math.PI / 2); t.set(cmix(K.sky1, K.sky0, sm(e * 1.6))); col.set([t.r, t.g, t.b], i * 3); }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); const m = c.M(g, noLine(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false, depthWrite: false })), sk); m.renderOrder = -10; m.frustumCulled = false; cnt("skydome"); }
  // the painted ring of peaks
  { const tex = paintPanorama(); tex.wrapS = THREE.RepeatWrapping; const hgt = RINGR * (Math.tan(EL1 * DEG) - Math.tan(EL0 * DEG)), g = new THREE.CylinderGeometry(RINGR, RINGR, hgt, 96, 1, true);
    const m = c.M(g, noLine(new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, toneMapped: false, fog: false, depthWrite: false })), sk); m.position.y = RINGR * (Math.tan(EL1 * DEG) + Math.tan(EL0 * DEG)) / 2; m.renderOrder = -9; m.frustumCulled = false; m.scale.x = -1; }
  // 420 stars: 260 of 1 px, 110 of 1.5 px, 50 of 2.5 px; weighted to the sky up the lane and down it; 12 % (50) twinkle by 8 %
  const sizes = [[260, 1], [110, 1.5], [50, 2.5]], stars = []; let sidx = 0; c.starSets = [];
  const dot = canvasTex(16, 16, (g, w, h) => { const q = g.createRadialGradient(8, 8, 0, 8, 8, 8); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.5, "rgba(255,255,255,0.8)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "star", 1);
  for (const [n, px] of sizes) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), base = [], tw = [];
    for (let i = 0; i < n; i++, sidx++) { const r = hh(sidx * 7.3 + 2), az = r < 0.45 ? (hh(sidx * 3.1) - 0.5) * 110 : r < 0.7 ? 180 + (hh(sidx * 3.1) - 0.5) * 110 : hh(sidx * 3.1) * 360, el = 5 + 75 * Math.pow(hh(sidx * 5.9 + 1), 0.8), d = azDir(az, el, SKYR - 3); pos.set(d, i * 3);
      const b = 0.55 + 0.45 * hh(sidx * 9.7), twk = (sidx % 8 === 0 && sidx < 400); base.push(b); tw.push(twk ? { ph: TAU * hh(sidx * 2.2) } : null); col.set([b, b, b * 1.0], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pm = noLine(new THREE.PointsMaterial({ map: dot, size: px * 1.5, sizeAttenuation: false, vertexColors: true, color: K.star, transparent: true, depthWrite: false, toneMapped: false, fog: false })); const pt = new THREE.Points(g, pm); pt.frustumCulled = false; pt.renderOrder = -8; pt.userData.steam = true; pt.userData.solid = false; sk.add(pt); c.starSets.push({ g, base, tw }); cnt("star", n); }
  // the moon: 14 degrees left of up the lane, 27 up; 4 thin clouds
  { const d = azDir(-14, 27, 1), mm = new THREE.Mesh(new THREE.PlaneGeometry(2 * 245 * Math.tan(4.5 * DEG), 2 * 245 * Math.tan(4.5 * DEG)), softMat({ map: paintMoon() })); mm.position.set(d[0] * 245, d[1] * 245, d[2] * 245); mm.lookAt(0, 0, 0); mm.renderOrder = -7; mm.userData.solid = false; mm.frustumCulled = false; sk.add(mm); mm.material.blending = THREE.NormalBlending; cnt("moon");
    [[-30, 33, 40], [20, 25, 34], [-52, 18, 28], [120, 30, 36]].forEach(([az, el, wd], i) => { const q = azDir(az, el, 1), cm = new THREE.Mesh(new THREE.PlaneGeometry(2 * 235 * Math.tan(wd / 2 * DEG), 235 * Math.tan(wd / 7 * DEG) * 2), softMat({ map: paintCloud(i * 7 + 1), opacity: 0.8 })); cm.position.set(q[0] * 235, q[1] * 235, q[2] * 235); cm.lookAt(0, 0, 0); cm.renderOrder = -6; cm.userData.solid = false; cm.frustumCulled = false; sk.add(cm); cnt("cloud"); }); }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE LIVING PARTS: snowfall, tracks, smoke, the neighbours' kids, the eave slab (`shake`), the icicles, the real lights
// ---------------------------------------------------------------------------------------------------------------------
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent; if (!s.isScene) return false;
  if (!s.userData.krLaneHooks) { const list = (s.userData.krLaneHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function () { if (prev) prev.apply(this, arguments); const cam = arguments[2]; for (const f of list) f(cam); }; }
  s.userData.krLaneHooks.add(fn); return true;
}
function buildSnow(c) {
  const layers = [[100, 0.03, [-14, 16], [0.9, 4.2]], [260, 0.02, [-20, 24], [0.9, 9]], [620, 0.012, [-30, 40], [0.9, 26]]], H = 8; c.snowL = [];   // 60 / 140 / 300 of them in a doorstep shot at snowfall 1
  const tex = c.glowTex;
  layers.forEach(([n, size, xr, zr], li) => {
    const pos = new Float32Array(n * 3), base = [];
    for (let i = 0; i < n; i++) { const id = li * 1000 + i; base.push({ x: lerp(xr[0], xr[1], hh(id * 3.7 + 1)), z: lerp(zr[0], zr[1], hh(id * 5.3 + 2)), ph: hh(id * 7.1 + 3), sw: TAU * hh(id * 2.9 + 4), sa: 0.15 * (0.5 + 0.5 * hh(id * 4.4)), sf: 0.4 + 0.3 * hh(id * 6.6) }); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
    const pm = noLine(new THREE.PointsMaterial({ map: tex, color: "#ffffff", size, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0.95, toneMapped: false, fog: false })); const pt = new THREE.Points(g, pm); pt.frustumCulled = false; pt.userData.steam = true; pt.userData.solid = false; pt.renderOrder = 8; c.root.add(pt);
    c.snowL.push({ g, base, n, pt, H });
  });
}
function updateSnow(c, amount, t) {
  for (const L of c.snowL) {
    const vis = Math.floor(L.n * clamp(amount)); L.g.setDrawRange(0, vis); L.pt.visible = vis > 0; if (!vis) continue;
    const p = L.g.attributes.position;
    for (let i = 0; i < vis; i++) { const b = L.base[i], gy = (b.z > 5.9 ? laneY(b.x) - 0.6 : laneY(b.x)) + 0.25, fall = ((b.ph * L.H * 1.0 + 0.9 * t) % L.H + L.H) % L.H; p.setXYZ(i, b.x + b.sa * Math.sin(TAU * b.sf * t + b.sw), gy + L.H - fall, b.z + b.sa * Math.cos(TAU * b.sf * t * 0.8 + b.sw)); }
    p.needsUpdate = true;
  }
}
// the tracks (follow `visited`): cloven hoof prints 0.14 x 0.12 with a stride of 0.55 (toes out 12 degrees), Nick's round prints 0.11 beside them, a crook dimple every 1.1 m, a chain drag line 2 cm wide
function buildTracks(c) {
  const N = Math.ceil((xk(1) + 0.3 + 44) / 0.55) + 1, mk = (geo, color, n) => { const m = new THREE.InstancedMesh(geo, noLine(stdMat({ color, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })), n); m.frustumCulled = false; m.userData.solid = false; m.count = 0; c.root.add(m); return m; };
  const hoof = (() => { const s = new THREE.Shape(); for (const sd of [-1, 1]) { s.absellipse(sd * 0.03, 0, 0.028, 0.058, 0, TAU, false); s.closePath(); } const g = new THREE.ShapeGeometry(s, 8); g.rotateX(-Math.PI / 2); return g; })();
  const hm = mk(hoof, "#5a6eaa", N), nm = mk(new THREE.CircleGeometry(0.055, 14).rotateX(-Math.PI / 2), "#6a7eb4", N), cm = mk(new THREE.CircleGeometry(0.022, 10).rotateX(-Math.PI / 2), "#4a5f96", N), dm = mk(new THREE.PlaneGeometry(1, 0.02).rotateX(-Math.PI / 2), "#566aa4", Math.ceil((xk(1) + 44) / 0.9) + 2);
  const d = new THREE.Object3D(), put = (m, i, x, z, ry, sl) => { const y = laneY(x) + 0.014; d.position.set(x, y, z); d.rotation.set(0, ry, 0); d.rotation.order = "YXZ"; d.rotation.z = Math.atan2(-(laneY(x + 0.1) - laneY(x - 0.1)), 0.2) * 1; d.scale.set(sl ?? 1, 1, 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); };
  const zt = (x) => 3.5 + 0.25 * Math.sin(x * 0.3);
  let nc = 0; for (let i = 0; i < N; i++) { const x = -44 + 0.55 * i, side = i % 2 ? 1 : -1, z = zt(x) + side * 0.18; put(hm, i, x, z, Math.PI / 2 * 0 + side * 12 * DEG, 1); put(nm, i, x + 0.1, zt(x) + 0.62 + 0.06 * side, 0, 1); if (i % 2 === 0) { put(cm, nc++, x, zt(x) + 0.95, 0, 1); } }
  for (let i = 0; i < dm.instanceMatrix.count; i++) { const x = -44 + 0.9 * i + 0.45; put(dm, i, x, zt(x), 0, 0.92); }
  cnt("track", N); c.tracks = { hm, nm, cm, dm, N, nc };
}
// the smoke wisps (the cottage sled's puffs: rising 1.25 m/s, drifting down the lane), 14 puffs a chimney
function buildSmoke(c) {
  const n = 14 * c.chims.length, sm_ = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), noLine(new THREE.MeshBasicMaterial({ color: "#959ba8", transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, fog: false })), n); sm_.frustumCulled = false; sm_.userData.steam = true; sm_.userData.solid = false; sm_.renderOrder = 4; c.root.add(sm_); c.smoke = sm_;
}
function updateSmoke(c, smoke, t) {
  const d = new THREE.Object3D(); let n = 0;
  c.chims.forEach((ch, ci) => { for (let i = 0; i < 14; i++, n++) { const ph = hh(ci * 17 + i * 3.1), tau = ((i / 14 + t * 0.36 + 0.07 * ci) % 1 + 1) % 1, age = tau * 2.8, env = sm(tau / 0.07) * (1 - sm((tau - 0.55) / 0.45)), r = (0.07 + 0.3 * tau) * (0.6 + 0.8 * ph) * env * clamp(smoke, 0, 3) * 0.55;
    d.position.set(ch.x + 0.6 * age * 1.0 + (0.5 * (ph - 0.5) + 0.3 * Math.sin(ph * 6 + t * 1.3)) * tau * 1.2, ch.y + 1.25 * age + 0.25 * age * age, ch.z + (0.45 * Math.sin(ph * 19) + 0.3 * Math.sin(ph * 11 + t)) * tau * 1.2); d.scale.setScalar(Math.max(r, 1e-4)); d.updateMatrix(); c.smoke.setMatrixAt(n, d.matrix); } });
  c.smoke.instanceMatrix.needsUpdate = true; c.smoke.visible = smoke > 0.001;
}

// ---------------------------------------------------------------------------------------------------------------------
// STATE and the kind
// ---------------------------------------------------------------------------------------------------------------------
export const KRAMPUS_LANE_STATE = { krampuslane: { visited: 10, lit: 4, door4: 0, snowfall: 0, shake: 0, trickle: 0.3, smoke: 1, tense: 0, kidsUp: -1 } };
export const KRAMPUS_LANE_GRIPS = {};
export const KRAMPUS_LANE_COUNTS = CNT;

export const KRAMPUS_LANE_KINDS = {
  krampuslane(P) {
    const S = P.spec, root = P.whole, dim = [];
    const c = { root, dim, ices: [], chims: [], shutTex: {}, shakeAt: S.shakeAt ?? 5, slab: null, boots: [], lanterns: [], kids: [], pools: [] };
    c.reg = (m, base = "#ffffff") => { dim.push({ m, c: new THREE.Color(base) }); return m; };
    c.mat = (color, o = {}) => { const m = stdMat({ color, ...o }); return c.reg(m, o.map ? "#ffffff" : color); };
    c.vcM = (col) => c.mat(col, { roughness: 0.9 });
    c.vc = c.reg(stdMat({ vertexColors: true, roughness: 0.85 })); c.vcN = c.reg(noLine(stdMat({ vertexColors: true, roughness: 0.85 })));
    c.vcSnow = c.reg(noLine(stdMat({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })));
    c.ice = noLine(stdMat({ color: K.ice, roughness: 0.25, emissive: new THREE.Color(K.iceE), emissiveIntensity: 0.28 }));
    c.M = (geo, mat, parent = root, solid = false, cast = false, recv = false) => { const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = recv; o.userData.solid = solid; parent.add(o); return o; };
    c.flameTex = [0, 1, 2].map(paintFlame);
    c.glowTex = radialTex([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]], 64);
    c.poolTex = radialTex([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.55)"], [0.7, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]], 128);
    for (const key of Object.keys(CNT)) delete CNT[key];
    // the lane, wall, terrain and far layers
    buildLane(c); buildWall(c); buildFountain(c); buildTerrain(c); buildFirs(c); buildMeadow(c); buildLowerVillage(c); buildSky(c);
    // the nine houses
    const houses = []; for (let k = 9; k >= 1; k--) { const h = buildHouse(c, k); houses.push(h); buildBoots(c, h); buildSpecials(c, h); }
    const h4 = houses.find((h) => h.k === 4); buildHall(c, h4.hg); buildPile(c, h4.hg);
    // the neighbours' kids: 5 at the ground window, 7 (two) at the lit upper window
    for (const [k, up, kids] of [[5, false, [[0.5, 1.0]]], [7, true, [[0.3, 0.85], [0.7, 0.85]]]]) { const h = houses.find((q) => q.k === k), w = up ? h.ups[0] : h.win, W = up ? 0.7 : 0.8, Hh = up ? 0.8 : 0.9; const tex = paintKidWindow(W, Hh, kids, k); const m = c.M(new THREE.PlaneGeometry(W, Hh), noLine(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false })), w.g, false, false); m.position.z = 0.018; m.renderOrder = 2; c.kids.push({ k, tex, m }); }
    // the icicles (all 379), instanced; the eave slab's lumps and the powder curtain; the heap
    { const geo = new THREE.ConeGeometry(1, 1, 8, 1); geo.rotateX(Math.PI); geo.translate(0, -0.5, 0); const im = new THREE.InstancedMesh(geo, c.ice, c.ices.length); im.frustumCulled = false; im.userData.solid = false; root.add(im); c.iceMesh = im; c.iceN = c.ices.length;
      const o = new THREE.Object3D(); c.ices.forEach((q, i) => { o.position.set(q.x, q.y, q.z); o.rotation.set(0, 0, 0.05 * (hh(i * 3.1) - 0.5)); o.scale.set(q.r, q.L, q.r); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); }
    const sa = houses.find((h) => h.k === c.shakeAt); c.shakeHouse = sa;
    c.dropIce = c.ices.map((q, i) => ({ q, i })).filter(({ q }) => q.k === c.shakeAt && Math.abs(q.hx) < 0.8).slice(0, 2);
    { const gm = c.reg(noLine(stdMat({ vertexColors: true, roughness: 0.95 })));
      const lumps = []; for (let i = 0; i < 14; i++) { const gl = snowLump(0.16 + 0.06 * hh(i), 0.1 + 0.04 * hh(i * 2), 0.14, 0, 0, 0, i * 3, 7); const g = new Bake().add(gl, snowC).geo(); const m = new THREE.Mesh(g, gm); m.castShadow = false; m.visible = false; m.userData.solid = false; root.add(m); lumps.push({ m, ox: -0.7 + 1.4 * (i % 7) / 6 + 0.04 * hh(i * 4), oz: 0.0 + 0.06 * hh(i * 5) + (i >= 7 ? 0.14 : 0.0), oy: (i >= 7 ? 0.05 : 0.0), sd: hh(i * 7.7) - 0.5, vz: 0.15 + 0.35 * hh(i * 3.3) }); }
      c.lumps = lumps;
      const heap = new Bake(); [[-0.55, 0.2, 0.5], [0.0, 0.22, 0.66], [0.55, 0.18, 0.46]].forEach(([x, h, w], i) => heap.add(snowLump(w * 0.5, h, 0.32, x, 0, 0, i * 5 + 1, 10), snowC)); // 3 lobes
      c.heaps = [0, 1, 2].map((i) => { const b = new Bake(); const [x, h, w] = [[-0.55, 0.2, 0.5], [0.0, 0.26, 0.66], [0.55, 0.2, 0.46]][i]; b.add(snowLump(w * 0.5, h, 0.32, x, 0, 0, i * 5 + 1, 10), snowC); const m = new THREE.Mesh(b.geo(), gm); m.castShadow = false; m.visible = false; m.userData.solid = false; root.add(m); return m; });
      c.puffs = []; for (let i = 0; i < 5; i++) { const m = steamy(new THREE.Sprite(new THREE.SpriteMaterial({ map: c.glowTex, color: "#e6eefc", transparent: true, depthWrite: false, opacity: 0, toneMapped: false, fog: false })), 6); m.visible = false; root.add(m); c.puffs.push(m); }
      { const n = 90, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const pt = new THREE.Points(g, noLine(new THREE.PointsMaterial({ map: c.glowTex, color: "#e8f0ff", size: 0.16, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0, toneMapped: false, fog: false }))); pt.frustumCulled = false; pt.userData.steam = true; pt.userData.solid = false; pt.renderOrder = 7; pt.visible = false; root.add(pt); c.powder = { pt, n }; } }
    buildSnow(c); buildTracks(c); buildSmoke(c);
    // the real lights (6 at most with the clip's moon key and the book): door 4's lantern, the lantern of door `lit`, the snow bounce, the hall wedge (in buildHall), a cold rim for `tense`
    const mkL = (col, rg, x, y, z) => { const l = new THREE.PointLight(col, 0, rg, 2); l.position.set(x, y, z); l.castShadow = false; root.add(l); return l; };
    const L4 = mkL(K.flame, 5, xk(4) + HT[4].lant, Yk(4) + 1.58, 0.3), LL = mkL(K.flame, 5, xk(4) + HT[4].lant, Yk(4) + 1.58, 0.3), LB_ = mkL(K.pool, 4, 0.6, 0.35, 2.6);
    const rim = new THREE.DirectionalLight("#b9cdf5", 0); rim.position.set(-10, 4, 1.0); const rimT = new THREE.Object3D(); root.add(rimT); rim.target = rimT; rim.castShadow = false; root.add(rim);
    const lantOf = (k) => houses.find((h) => h.k === k).lant;
    const g0 = (ps, k, d) => { const v = ps[k] ?? S[k]; return v == null ? d : v; };
    // lookOnly on every mesh: the engine's contact oval for a prop is as big as the prop's box (a 250 m slab at y 0.008) and would darken everything under y 0
    // (door 3's lower leaf, the lane below door 4, the valley); no oval, no hand ray onto the lane (as props-aa-site.js `big`)
    root.traverse((o) => { if (o.isMesh) o.userData.lookOnly = true; });
    let hooked = false, last = {};
    const skyAt = (cam) => { if (!cam || !cam.isPerspectiveCamera) return; const p = root.worldToLocal(cam.getWorldPosition(new THREE.Vector3())); c.sky.position.set(p.x, p.y, p.z); };
    const tmp = new THREE.Object3D();
    return {
      grip: 0, houses, c,
      apply(ps, t) {
        if (!hooked) hooked = hookScene(root, skyAt);
        const tense = clamp(g0(ps, "tense", 0)), visited = g0(ps, "visited", 10), lit = g0(ps, "lit", 4), door4 = clamp(g0(ps, "door4", 0)), snowfall = clamp(g0(ps, "snowfall", 0)), shake = Math.max(0, g0(ps, "shake", 0)), trickle = clamp(g0(ps, "trickle", 0.3)), smoke = g0(ps, "smoke", 1), kidsUp = g0(ps, "kidsUp", -1);
        const dimK = 1 - 0.3 * tense; for (const e of dim) e.m.color.copy(e.c).multiplyScalar(dimK);
        const depth = 1 + 0.75 * tense, fr = Math.floor(t * 8 + 1e-6);
        // lanterns: flame frames, flicker, glow, pools, snow glints; the real lights follow their lanterns
        const fls = {};
        for (const l of houses.map((h) => h.lant)) {
          const fl = 1 + depth * 0.08 * Math.sin(TAU * 1.3 * t + l.a) + depth * 0.04 * Math.sin(TAU * 3.7 * t + l.b); fls[l.k] = fl;
          l.fm.map = c.flameTex[(fr + l.k) % 3]; l.fg.scale.set(0.94 + 0.06 * fl, 0.9 + 0.12 * fl, 1); l.glow.material.opacity = 0.4 * fl; l.wp.material.opacity = 0.34 * fl * dimK; l.sp.material.opacity = 0.42 * fl * dimK;
          const f30 = Math.floor(t * 30 + 1e-6); for (let i = 0; i < 12; i++) { const gl = l.glints[i]; if (!l.gm) break; const on = (((t + gl.ph) % gl.per) + gl.per) % gl.per < 4 / 30; tmp.position.set(gl.x, 0.013, gl.z); tmp.scale.setScalar(on ? 1 : 0.0001); tmp.updateMatrix(); l.gm.setMatrixAt(i, tmp.matrix); } if (l.gm) l.gm.instanceMatrix.needsUpdate = true;
        }
        L4.intensity = 2.4 * fls[4]; const k0 = Math.floor(clamp(lit, 1, 9)), k1 = Math.min(9, k0 + 1), f = clamp(lit, 1, 9) - k0, a = houses.find((h) => h.k === k0).lant, b = houses.find((h) => h.k === k1).lant;
        LL.position.set(lerp(xk(k0) + a.x, xk(k1) + b.x, f), lerp(Yk(k0), Yk(k1), f) + 1.58, 0.3); LL.intensity = 2.4 * lerp(fls[k0], fls[k1], f);
        LB_.intensity = 0.5; rim.intensity = 1.2 * tense;
        // door 4: the leaf swings in to 80 degrees; the hall light, the wedge and the doorway glow follow
        { const h = h4; h.piv.rotation.y = 80 * DEG * door4; c.hallGroupVis = door4 > 0.001; for (const m of c.hallMats) m.emissiveIntensity = 0.22 * door4; c.hallLight.intensity = 5 * door4; c.hallWedge.material.opacity = 0.6 * door4; c.hallDoorGlow.material.opacity = 0.5 * door4; c.hallWedge.visible = door4 > 0.001; c.hallDoorGlow.visible = door4 > 0.001; for (const fm of c.hallFlames) fm.material.map = c.flameTex[fr % 3]; }
        // boots: the fills show on visited doors (numbers `visited` and up)
        for (const b of c.boots) b.fill.visible = b.k >= visited - 1e-6;
        // the neighbours' kids drop below the sill while `lit` is their door and come back
        for (const kd of c.kids) { const d = sm(1 - Math.abs(lit - kd.k) * 2), up = kidsUp >= 0 ? kidsUp : 1 - d; kd.tex.offset.y = -(1 - up) * 0.75; kd.m.visible = up > 0.001; }
        // the tracks reach the landing of the lowest visited door
        { const xv = xk(clamp(visited, 1, 10)) + 0.0, n = clamp(Math.floor((xv + 44) / 0.55), 0, c.tracks.N); c.tracks.hm.count = c.tracks.nm.count = n; c.tracks.cm.count = Math.floor(n / 2); c.tracks.dm.count = clamp(Math.floor((xv + 44) / 0.9), 0, c.tracks.dm.instanceMatrix.count); }
        // the fountain's thread of water, the smoke, the snow
        { const th = c.trickle; th.visible = trickle > 0.01; th.scale.set(0.6 + trickle * 0.8, 1, 0.6 + trickle * 0.8); th.material.opacity = 0.8 * clamp(trickle * 2); c.ripple.visible = trickle > 0.01; c.ripple.scale.setScalar(0.8 + 0.4 * (0.5 + 0.5 * Math.sin(TAU * 2.1 * t))); c.ripple.material.opacity = 0.5 * clamp(trickle * 2); }
        updateSmoke(c, smoke, t); updateSnow(c, snowfall, t);
        // the stars: 12 % twinkle by 8 %
        for (const ss of c.starSets) { const col = ss.g.attributes.color; ss.base.forEach((b, i) => { const w = ss.tw[i]; const v = w ? b * (1 + 0.08 * Math.sin(TAU * 0.5 * t + w.ph)) : b; col.setXYZ(i, v, v, v); }); col.needsUpdate = true; }
        // `shake`: each whole number breaks a slab 1.6 x 0.5 x 0.2 off the eave lip of house `shakeAt` as 14 lumps and 5 puffs of powder; it falls 3.6 m, lands as a heap on the apron edge (3 lobes after 3 shakes), 2 icicles drop with the first
        if (sa) {
          const hx = sa.hg.position.x, hy = sa.hg.position.y, ev = [0, 1, 2].map((e) => clamp(shake - e));
          if (c.slab) c.slab.g.visible = shake < 1e-4;
          const o = new THREE.Object3D();
          c.lumps.forEach((L, i) => { let vis = false; for (let e = 0; e < 3; e++) { const p = ev[e]; if (p > 1e-4 && p < 0.97 && !vis) { vis = true; const fall = 3.6 * p * p, sp = 1 + 0.5 * p; L.m.position.set(hx + L.ox * sp + L.sd * 0.4 * p, hy + 3.58 - fall + L.oy, 0.95 + L.oz + L.vz * p * 0.5); L.m.rotation.set(p * 3 * L.sd, p * 2, p * 4 * L.sd); L.m.scale.setScalar(1 - 0.35 * p); } } L.m.visible = vis; });
          c.heaps.forEach((m, i) => { const landed = clamp(shake - (i + 1) + 0.0) >= 0.97 ? 1 : 0; m.visible = landed > 0; m.position.set(hx + 0.0, hy + 0.0 + (sa.hg.position.y - sa.hg.position.y), 1.55 + 0.0); m.position.x = hx + 0.0; m.position.y = hy; });
          c.puffs.forEach((m, i) => { let vis = false; for (let e = 0; e < 3; e++) { const p = ev[e]; if (p > 1e-4 && p < 1.4 && !vis) { vis = true; const q = clamp(p / 1.4), fall = 3.6 * Math.min(p, 1) * Math.min(p, 1) * 0.9; m.position.set(hx - 0.8 + 0.4 * i + 0.08 * Math.sin(i * 4 + p * 5), hy + 3.5 - fall + 0.1 * i, 1.0 + 0.1 * i); m.scale.setScalar(0.3 + 0.8 * q + 0.07 * i); m.material.opacity = 0.42 * Math.sin(Math.PI * clamp(q * 1.1)) * (1 - 0.5 * q); } } m.visible = vis; });
          { let pp = 0; for (let e = 0; e < 3; e++) if (ev[e] > 1e-4 && ev[e] < 1.4) pp = ev[e]; const pw = c.powder; pw.pt.visible = pp > 0; if (pp > 0) { const q = clamp(pp / 1.4), arr = pw.pt.geometry.attributes.position; for (let i = 0; i < pw.n; i++) { const f = 0.85 + 0.3 * hh(i * 2.3); arr.setXYZ(i, hx + (-0.8 + 1.6 * hh(i * 3.1)) * (1 + 0.5 * pp), hy + 3.58 - 3.6 * Math.pow(Math.min(pp, 1), 2) * f - 0.25 * hh(i * 7.7) * q, 1.0 + 0.7 * q * hh(i * 5.7) + 0.1 * Math.sin(i * 4 + pp * 6)); } arr.needsUpdate = true; pw.pt.material.opacity = 0.8 * Math.sin(Math.PI * clamp(q * 1.05)) * (1 - 0.4 * q); pw.pt.material.size = 0.1 + 0.2 * q; } }
          const p0 = ev[0], o2 = new THREE.Object3D(); c.dropIce.forEach(({ q, i }) => { const fall = p0 > 0 ? 3.6 * p0 * p0 + 0.0 : 0; o2.position.set(q.x + 0.05 * p0, q.y - fall, q.z + 0.15 * p0); o2.rotation.set(0, 0, 0.05 * (hh(i * 3.1) - 0.5)); const gone = p0 >= 0.97; o2.scale.set(q.r, gone ? 1e-4 : q.L, q.r); o2.updateMatrix(); c.iceMesh.setMatrixAt(i, o2.matrix); }); c.iceMesh.instanceMatrix.needsUpdate = true;
        }
      },
    };
  },
};
