// Costume `stnick`: Saint Nick for Krampus myth 01 "One night a year he checks your boots" (task T-C, 21 Nov 2026), built from
// storyboards/series/krampus-myth/01-boots/DESIGN.md section C on Spud's potato block (characters/krampus-myth/nick.json: body #e2a95c
// 0.88 x 0.76 x 0.66, seed 53, cast scale 1.22 -> 1.24 m standing, mitre top 1.63 m). One bench: storyboards/series/krampus-myth/01-boots/bench/
// make-nick-bench.mjs. Everything is built once from the rig's surface (ch.surf) in body-local metres (origin on the floor under the middle).
//
// USAGE (character file): "costume": { "type": "spud", "stnick": true }   or   "stnick": { ...keys }   (dispatched by costumes-cast.js)
//   keys (a number, or keyframes [[clip seconds, value], ...], linear, held outside), STNICK_STATE defaults:
//     smile 0   0..1  the mouth under the moustache lifts (happy arcs on the eyes are the director's expression, not drawn here)
//     talk  0   0..1  the beard tip follows the mouth; it also follows st.expr.open and st.talk, so a spoken line needs no key
//     glow  0   0..1  the book's light on the beard, moustache and mitre front (warm #ffe2a0)
//     kneel 0   0..1  the hem; it follows st.kneel (the rig's kneel action) by itself. 1: the cope and the alb spread to a pool
//                     1.25 x wider, 7 puddled folds, a trail 0.18 behind, lying on the snow (every cope and alb vertex is
//                     recomputed from its rest position when the state changes)
//     red "#a3232b"   the cope and mitre red (the shade ramp is derived from it)
//     mitreBase 0.72  body-local y of the mitre's lower band (above the brows; the rig's eye line measures 0.483, lip line 0.389)
//   Also read per frame: st.nick.smile / st.nick.glow (an action may drive them).
//
// WHAT IS DRAWN (STNICK_COUNTS, filled at build, = DESIGN section 9 row C): 19 beard locks; mitre 5 + 9 scrolls, 14 pearls, 4 flowers;
//   the cope's front band 11 oak leaves + 6 acorns; 16 lily sprigs; 40 hem lozenges; 12 hair locks, 2 moustache wings, brow tufts that
//   follow the rig's brows, 2 lappets, the cope's back shield (3 gold balls and a boot), 9 back folds, ermine collar, rope and tassels
//   on the alb, gloves with a gold quatrefoil and a ring, lace cuffs. Whites carry a soft emissive so the cel look keeps their folds.
//
// SIZES (metres, body-local, before the 1.22 cast scale): mitre 0.47 high on a 0.72 band, half-widths 0.30 / 0.36; beard to 0.28 below the
//   lip line; cope to the floor; hem pool 1.25 x the standing hem when kneeling.
//
// HANG POINTS (out.hang, body-local metres, on the cope's outer face with a gold ring each): book [0.398, 0.198, 0.13] (the chain),
//   sack [-0.408, 0.194, 0.135] (the rope). The book and the crook are other files (props-krampus-nick.js).
//
// WHERE THE HANDS HOLD THE BOOK (the director's staging, DESIGN section C gestures): READ: the open book lies on the left palm and
//   forearm, its middle at (0, 0.44, 0.52) in his frame, top edge at y 0.58 (0.03 under the lip line), tilted 50 degrees to his eyes; the
//   right index runs down the right page; lids 0.8. KNEEL AND POUR: the rig's `kneel`, the book on its chain at the hip, the sack in both
//   hands 0.20 above the boot's cuff. The bench stands a plain slab and a box in for them.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { hash2 } from "./costumes-art-cast.js";

const TAU = Math.PI * 2, PI = Math.PI, DEG = PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3 + 41, i * 0.71 + n * 1.7 + 9);   // a hash 0..1 for mark i, channel n (Nick's own seed)
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * PI / 2) ** 2);
const wrapPi = (x) => ((((x + PI) % TAU) + TAU) % TAU) - PI;
const col = (h) => new THREE.Color(h);
const se = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);

// a (nu+1) x (nv+1) grid of points, closed round in u (the last column meets the first with one normal)
function grid(nu, nv, at, closed = true, rev = false) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (rev) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) {
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}
// the same grid with a colour per vertex: colAt(u, v, normal, position) -> Color; returns a non-indexed geometry for a bucket
function cgrid(nu, nv, at, colAt, closed = false, rev = false) {
  const g = grid(nu, nv, at, closed, rev), N = g.attributes.normal, P = g.attributes.position, cols = new Float32Array(P.count * 3), n = V(0, 0, 0), p = V(0, 0, 0);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const k = j * (nu + 1) + i; n.fromBufferAttribute(N, k); p.fromBufferAttribute(P, k);
    const c = colAt(i / nu, j / nv, n, p); cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g.toNonIndexed();
}
// a brush stroke lying on a surface: centre points, the surface normal at each, a half width, tapering to a point at both ends
function ribbon(pts, nrm, W, heavy = 0.4) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    const u = i / n, w = W * (1 - heavy + heavy * u) * Math.pow(Math.sin(PI * clamp(0.04 + u * 0.92)), 0.55);
    pos.push(...p.clone().addScaledVector(side, -w).toArray(), ...p.clone().addScaledVector(side, w).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a band of constant half width W (square ends), or of a half width given by a function of the index
function strip(pts, nrm, W) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize(), w = typeof W === "function" ? W(i / n) : W;
    pos.push(...p.clone().addScaledVector(side, -w).toArray(), ...p.clone().addScaledVector(side, w).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a tube along points (a Catmull-Rom curve), radius r(t), radial segments; colAt(t, a, normal) -> Color
function sweep(pts, r, radial, colAt, segs = 0, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts, closed), N = segs || Math.max(8, pts.length * 4), fr = curve.computeFrenetFrames(N, closed), P = [];
  for (let i = 0; i <= N; i++) P.push(curve.getPointAt(i / N));
  return cgrid(radial, N, (u, v) => {
    const i = Math.round(v * N), t = i / N, a = u * TAU, rr = typeof r === "function" ? r(t) : r, nn = fr.normals[i], bb = fr.binormals[i];
    return P[i].clone().addScaledVector(nn, Math.cos(a) * rr).addScaledVector(bb, Math.sin(a) * rr);
  }, (u, v, n) => colAt(v, u * TAU, n), true);
}
// ---- vertex-coloured buckets: many small parts merged into one mesh per colour family
const bucket = () => ({ g: [] });
function put(b, geo, M, colorFn) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const n = g.attributes.normal, p = g.attributes.position, cols = new Float32Array(n.count * 3), v = V(0, 0, 0), q = V(0, 0, 0);
  for (let i = 0; i < n.count; i++) { v.fromBufferAttribute(n, i); q.fromBufferAttribute(p, i); const c = colorFn(v, q, i); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  if (M) g.applyMatrix4(M);
  b.g.push(g);
}
const add = (b, g, M) => { if (g.index) g = g.toNonIndexed(); if (g.attributes.uv) g.deleteAttribute("uv"); if (M) g.applyMatrix4(M); b.g.push(g); };   // a geometry that already has colours
function flush(b, mat, parent, shadow = true) {
  if (!b.g.length) return null;
  const m = new THREE.Mesh(mergeGeometries(b.g), mat); m.castShadow = m.receiveShadow = shadow; parent.add(m); b.g.length = 0; return m;
}
const vmat = (o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: o.rough ?? 0.55, metalness: 0, side: o.side ?? (o.flat ? THREE.DoubleSide : THREE.FrontSide) });
  if (o.line) m.userData.lineColor = o.line;
  if (o.flat) { m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  if (o.role) m.userData.lookRole = o.role;
  return m;
};
// a flat polygon [[a, b], ...] (a simple outline) filled and subdivided to edges <= maxEdge, then mapped by map(a, b) -> { p, n }; colAt(a, b, n) -> Color
function fillPoly(poly, map, colAt, maxEdge = 0.014) {
  const tri = THREE.ShapeUtils.triangulateShape(poly.map(([a, b]) => new THREE.Vector2(a, b)), []), out = [];
  const push = (A, B, C, d) => {
    const ab = Math.hypot(A[0] - B[0], A[1] - B[1]), bc = Math.hypot(B[0] - C[0], B[1] - C[1]), ca = Math.hypot(C[0] - A[0], C[1] - A[1]), m = Math.max(ab, bc, ca);
    if (m <= maxEdge || d > 6) { out.push([A, B, C]); return; }
    const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
    if (m === ab) { const M = mid(A, B); push(A, M, C, d + 1); push(M, B, C, d + 1); } else if (m === bc) { const M = mid(B, C); push(A, B, M, d + 1); push(A, M, C, d + 1); } else { const M = mid(C, A); push(A, B, M, d + 1); push(M, B, C, d + 1); }
  };
  for (const t of tri) push(poly[t[0]], poly[t[1]], poly[t[2]], 0);
  const pos = [], cols = [], nrm = [];
  for (const T of out) {
    const R = T.map((q) => { const mp = map(q[0], q[1]); return { p: mp.p, n: mp.n, c: colAt(q[0], q[1], mp.n) }; });
    const fn = R[1].p.clone().sub(R[0].p).cross(R[2].p.clone().sub(R[0].p));
    if (fn.dot(R[0].n) < 0) R.reverse();
    for (const r of R) { pos.push(r.p.x, r.p.y, r.p.z); cols.push(r.c.r, r.c.g, r.c.b); nrm.push(r.n.x, r.n.y, r.n.z); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}
// a filled disc-like shape from a function of the angle: r(a) metres, mapped; centred on (ca, cb); the shape is a polygon of n points
const blob = (ca, cb, rFn, n = 24, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, r = rFn(a); return [ca + r * Math.cos(a + rot), cb + r * Math.sin(a + rot)]; });

export const STNICK_STATE = { smile: 0, talk: 0, glow: 0, kneel: 0 };   // the costume keys and their defaults (header USAGE)
export const STNICK_COUNTS = {};   // filled when a Nick is built: the DESIGN section 9 row C counts, as drawn

// a number or keyframes [[t, v], ...] (clip seconds, linear between, held outside) -> a function of the clip time
const keyed = (spec, def = 0) => {
  const kf = Array.isArray(spec) ? spec : null, base = kf ? 0 : +(spec ?? def);
  return (t) => { if (!kf) return base; if (t <= kf[0][0]) return kf[0][1]; for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) return lerp(kf[i - 1][1], kf[i][1], (t - kf[i - 1][0]) / Math.max(1e-6, kf[i][0] - kf[i - 1][0])); return kf[kf.length - 1][1]; };
};

export function stnick(C, ch, out) {
  const K = C.stnick === true ? {} : C.stnick || {}, parts = ch.potatoParts;
  const LOC = ch.cy - ch.ry;                                                   // bodyGroup y of body-local 0 (the legs' length)
  const phOf = (yl) => Math.asin(clamp((yl + LOC - ch.cy) / ch.ry, -0.995, 0.995));
  const surfAt = (th, yl) => ch.surf(th, phOf(yl));
  const root = new THREE.Group(); root.name = "stnick"; root.position.y = LOC; parts.add(root);   // body-local coordinates from here on
  const bp = (th, yl, off = 0, flatN = 1) => { const s = surfAt(th, yl), n = s.normal.clone(); n.y *= flatN; n.normalize(); const p = s.pos.clone().addScaledVector(n, off); p.y -= LOC; return { p, n }; };
  const thFor = (x, yl) => { const ph = phOf(yl); let lo = 0, hi = PI / 2; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (ch.surf(m, ph).pos.x < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  const front = (x, yl, off = 0, flatN = 1) => bp(Math.sign(x || 1) * thFor(Math.abs(x), yl), yl, off, flatN);   // the point x metres from the middle on the body's front, `off` out
  const frame = (th, yl, off = 0, flatN = 0.4) => { const { p, n } = bp(th, yl, off, flatN), X = V(0, 1, 0).cross(n).normalize(), Y = n.clone().cross(X).normalize(); return new THREE.Matrix4().makeBasis(X, Y, n).setPosition(p); };

  // ---- palette (DESIGN header: shared palette, GOLD LEAF rule of egypt-myth 01)
  const GB = col("#e2b04a"), GS = col("#9a6a1e"), GD = col("#6b4612"), GL = col("#fff0b8"), GBOLE = col("#8a4a2a");
  const RED = col(K.red || "#a3232b"), REDS = col("#6e141c"), REDL = col("#cf4a44");
  const BW = col("#f4f1ea"), BWS = col("#cfcbc0"), BWD = col("#a9a59c"), BWL = col("#ffffff"), BWC = col("#a7b0c6"), BWCD = col("#7f88a3"), GLOWC = col("#ffe2a0");
  const LINEN = col("#f3eee2"), LINF = col("#cfc7b4"), LIND = col("#a89f8c");
  const LINING = col("#d9a43a"), LINS = col("#a97a22"), LINL = col("#f2c866");
  const PEARL = col("#f7f1e4"), PEARLS = col("#cfc7b4"), RUBY = col("#c8323a"), RUBYS = col("#8f1f2c"), RUBYL = col("#f08a8a");
  const _c = new THREE.Color();
  const gold = (n, wear = 0, bole = false) => {
    const k = sstep(-0.6, 0.45, n.y * 0.6 + n.z * 0.5), c = _c.copy(GS).lerp(GB, k);
    c.lerp(GL, sstep(0.76, 0.93, n.y * 0.55 + n.z * 0.83) * 0.92);
    if (wear > 0) c.lerp(bole ? GBOLE : GD, clamp(wear));
    return c.clone();
  };
  // flat embroidery: the thread catches the light along its middle (v 0..1 across a stroke or a leaf)
  const thread = (across = 0.5, wear = 0) => { const c = GB.clone().lerp(GS, 0.5 * Math.pow(Math.abs(across - 0.5) * 2, 1.4)).lerp(GL, 0.7 * Math.exp(-(((across - 0.4) / 0.16) ** 2))); if (wear > 0) c.lerp(GD, wear); return c; };
  const pearlCol = (n) => PEARLS.clone().lerp(PEARL, sstep(-0.3, 0.5, n.y * 0.6 + n.z * 0.5)).lerp(BWL, 0.8 * sstep(0.8, 0.95, n.y * 0.55 + n.z * 0.83));
  const redCol = (n) => { const k = sstep(-0.5, 0.5, n.y * 0.55 + n.z * 0.45); return _c.copy(REDS).lerp(RED, k).lerp(REDL, 0.55 * sstep(0.6, 0.95, n.y * 0.7 + n.z * 0.4)).clone(); };
  const roundCol = (base, light, shade) => (n) => { const c = _c.copy(shade).lerp(base, sstep(-0.6, 0.4, n.y * 0.6 + n.z * 0.5)); c.lerp(light, sstep(0.78, 0.93, n.y * 0.55 + n.z * 0.83) * 0.7); return c.clone(); };
  // wear: 8 % of the gold rubbed through to bronze, 1 spot in 4 to the red bole (egypt-myth 01 rule)
  const wearAt = (i, ch2 = 0) => (hs(i, 20 + ch2) < 0.08 ? 0.7 : 0);
  const B = { gold: bucket(), red: bucket(), redS: bucket(), linen: bucket(), white: bucket(), lining: bucket(), pearl: bucket(), ruby: bucket(), deco: bucket(), ink: bucket(), snow: bucket(), alb: bucket(), albDeco: bucket(), cope: bucket(), copeDeco: bucket(), copeGold: bucket(), ermine: bucket() };
  const counts = STNICK_COUNTS; for (const k of Object.keys(counts)) delete counts[k];

  // ---- measure the rig (DESIGN C assumed eye line 0.60 and lip line 0.36)
  const F = ch.face, FL = F.layout;
  const eyeQ = F.place(FL.eyeU, FL.eyeV), mouthQ = F.place(0, FL.mouthV);
  const Ey = eyeQ.pos.y - LOC, Ly = mouthQ.pos.y - LOC, Ez = mouthQ.pos.z;
  counts.measured = { eyeY: +Ey.toFixed(3), lipY: +Ly.toFixed(3), shiftEye: +(Ey - 0.60).toFixed(3), shiftLip: +(Ly - 0.36).toFixed(3) };
  const glowParts = [];   // meshes whose colours take the book's light: { geo, base, mask }
  const flushGlow = (b, mat, parent, maskFn) => {
    const m = flush(b, mat, parent); if (!m) return null;
    const geo = m.geometry, P = geo.attributes.position, Cc = geo.attributes.color, mask = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) mask[i] = maskFn(P.getX(i), P.getY(i), P.getZ(i));
    glowParts.push({ geo, base: Cc.array.slice(), mask, mesh: m }); return m;
  };

  // a mesh material for the white things (beard, hair, ermine, linen): matte cloth that keeps its whites in the cast look
  const whiteMat = (line = "#9a9280", emis = 0.4) => { const m = vmat({ line: "#a9a392", rough: 0.95, role: "cloth" }); m.emissive = BW.clone(); m.emissiveIntensity = 0.3; return m; };
  const whiteFlat = () => { const m = vmat({ flat: true, rough: 0.95 }); m.emissive = BW.clone(); m.emissiveIntensity = 0.3; return m; };
  const beardMat = () => { const m = vmat({ line: "#8e97b0", rough: 0.95, role: "cloth" }); m.emissive = BW.clone(); m.emissiveIntensity = 0.3; return m; };
  const shiftAll = (b, p) => { for (const g of b.g) g.translate(-p.x, -p.y, -p.z); };

  // ================================================================ BEARD: 19 locks (7 long centre ones, 12 side ones) over an underbody
  const beard = new THREE.Group(); beard.name = "stnick-beard"; root.add(beard);
  const bPivot = V(0, Ly - 0.02, Ez + 0.02); beard.position.copy(bPivot);
  const offB = (y) => 0.024 + 0.056 * sstep(Ly + 0.03, Ly - 0.11, y);   // off the face: 0.024 at the cheeks, 0.08 at the chin and below (0.07 off the face at the chin)
  const Bk = { lock: bucket(), line: bucket(), under: bucket() };
  let nLocks = 0;
  const lockSpecs = [];
  {
    // 7 long centre locks: root under the mouth, a soft double point (the two lowest at +-0.035), 3 locks cross a neighbour
    const cx = [[-3, -0.115, 0.285, 1.0, 1], [-2, -0.07, 0.24, 4.2, -1], [-1, -0.035, 0.205, 3.0, -1], [0, 0.0, 0.18, 3.5, 1], [1, 0.038, 0.205, 3.0, 1], [2, 0.075, 0.24, 2.0, -1], [3, 0.12, 0.285, 4.2, 1]];
    for (const [c, x1, y1, layer, curl] of cx) lockSpecs.push({ x0: c * 0.03, y0: Ly - 0.025, x1, y1, W: 0.062, amp: 0.62, curl: c === 0 ? 1 : curl, layer, ph: c * 0.9, long: true });
    // 12 side locks, 6 a side, the outer ones sweep in from the cheek and curl out at the tip
    const sd = [[0.272, 0.435, 0.205, 0.285, 0.5, 0.5], [0.243, 0.415, 0.168, 0.25, 0.5, 1.6], [0.215, 0.395, 0.145, 0.27, 0.52, 1.0], [0.185, 0.375, 0.118, 0.235, 0.5, 1.3], [0.16, 0.365, 0.092, 0.25, 0.46, 1.8], [0.13, 0.36, 0.078, 0.225, 0.44, 2.2]];
    for (const s of [-1, 1]) sd.forEach(([x0, y0, x1, y1, amp, layer], k) => lockSpecs.push({ x0: s * x0, y0, x1: s * x1, y1, W: 0.060, amp, curl: s, layer, ph: k * 1.3 + (s > 0 ? 0.6 : 0), side: true }));
  }
  const lockWidth = (W, t) => W * (0.5 + 0.5 * sstep(0, 0.22, t)) * Math.pow(Math.max(0, 1 - t), 0.5) * (1 + 0.1 * Math.sin(t * 9));
  lockSpecs.forEach((sp, idx) => {
    const n = 26, path = [], len = Math.hypot(sp.x1 - sp.x0, sp.y1 - sp.y0) * 1.05, chord = Math.atan2(sp.x1 - sp.x0, -(sp.y1 - sp.y0));
    let x = sp.x0, y = sp.y0;
    for (let i = 0; i <= n; i++) {
      const t = i / n; path.push([x, y]);
      const al = chord + sp.amp * Math.sin(TAU * t + sp.ph) * (1 - 0.3 * t) + sp.curl * 1.55 * Math.pow(sstep(0.74, 1, t), 1.4);   // 2 half-waves, then the tip curls out by turns
      x += (len / n) * Math.sin(al); y -= (len / n) * Math.cos(al);
    }
    const off = (i2) => offB(path[i2][1]) + 0.0045 * sp.layer, P = [], Nn = [];
    path.forEach(([px, py], i2) => { const q = front(px, py, off(i2), 1); P.push(q.p); Nn.push(q.n); });
    const T = P.map((p, i2) => P[Math.min(n, i2 + 1)].clone().sub(P[Math.max(0, i2 - 1)]).normalize()), Sd = P.map((p, i2) => Nn[i2].clone().cross(T[i2]).normalize());
    const w = (t) => lockWidth(sp.W, t);
    const g = cgrid(6, n, (u, v) => { const i2 = Math.round(v * n), e = 2 * u - 1; return P[i2].clone().addScaledVector(Sd[i2], w(v) * e).addScaledVector(Nn[i2], 0.62 * w(v) * (1 - e * e)); },
      (u, v, nn, pp) => {
        const e = Math.abs(2 * u - 1), c = BW.clone().lerp(BWC, sstep(0.35, 1, e) * 0.9).lerp(BWS, 0.14 * hs(idx, 5)).lerp(BWL, 0.3 * Math.pow(1 - e, 2) * (nn.y > -0.2 ? 1 : 0.3));
        c.lerp(BWCD, 0.55 * (1 - sstep(0, 0.16, v))).lerp(BWC, 0.3 * sstep(0.55, 1, v) * (1 - e));   // the root is in the moustache's shade
        if (sp.layer > 3.5) c.lerp(BWCD, 0.25 * sstep(0.7, 1, e));   // a crossing lock leaves a thin shade line on its neighbour
        return c;
      }, false, true);
    add(Bk.lock, g);
    // 3-5 strand lines down the lock, each tapering out at the tip, plus its wave
    const S = 3 + (idx % 3);
    for (let k = 0; k < S; k++) {
      const e = ((k + 1) / (S + 1)) * 2 - 1, pts = [], nr = [];
      for (let i2 = 1; i2 <= n - 1; i2++) { const t = i2 / n; pts.push(P[i2].clone().addScaledVector(Sd[i2], w(t) * e * 0.9 + 0.0015 * Math.sin(i2 * 0.7 + k * 2)).addScaledVector(Nn[i2], 0.62 * w(t) * (1 - e * e) + 0.0016)); nr.push(Nn[i2]); }
      put(Bk.line, ribbon(pts, nr, 0.0016, 0.2), null, () => BWC.clone().lerp(BWCD, 0.45 + 0.3 * hs(idx * 7 + k, 3)));
    }
    nLocks++;
  });
  counts.beardLocks = nLocks;
  {   // the underbody: the beard's shade ground behind the locks (no skin shows between them)
    const outline = [[-0.27, 0.43], [-0.2, 0.372], [-0.12, 0.352], [0.12, 0.352], [0.2, 0.372], [0.27, 0.43], [0.252, 0.36], [0.215, 0.29], [0.16, 0.235], [0.1, 0.19], [0.05, 0.16], [0, 0.17], [-0.05, 0.16], [-0.1, 0.19], [-0.16, 0.235], [-0.215, 0.29], [-0.252, 0.36]];
    const g = fillPoly(outline, (a, b) => front(a, b, offB(b) - 0.006, 1), (a, b) => BWC.clone().lerp(BWCD, 0.4 * (1 - sstep(0.15, 0.42, b))), 0.02);
    add(Bk.under, g);
  }
  // the lowest third of the beard takes the book's light
  const yBeardBot = 0.17, yGlow = yBeardBot + (Ly - 0.03 - yBeardBot) / 3;
  const beardMask = (x, y) => 1 - sstep(yGlow - 0.05, yGlow + 0.05, y);
  shiftAll(Bk.lock, bPivot); shiftAll(Bk.line, bPivot); shiftAll(Bk.under, bPivot);
  flushGlow(Bk.under, beardMat(), beard, (x, y) => beardMask(x, y + bPivot.y));
  flushGlow(Bk.lock, beardMat(), beard, (x, y) => beardMask(x, y + bPivot.y));
  flushGlow(Bk.line, whiteFlat(), beard, (x, y) => beardMask(x, y + bPivot.y));

  // ================================================================ MOUSTACHE: 2 wings 0.13 long, tips curled up 0.02, 6 strand lines a wing (hides the mouth line)
  const wings = [];
  for (const sd of [-1, 1]) {
    const piv = front(0.004 * sd, Ly - 0.004, 0.0, 1), grp = new THREE.Group(); grp.name = sd > 0 ? "stnick-moustache-L" : "stnick-moustache-R"; grp.position.copy(piv.p); root.add(grp);
    const NW = 26, wx = (t) => sd * (0.004 + 0.158 * t), wy = (t) => Ly - 0.004 - 0.062 * Math.pow(Math.sin(t * PI * 0.5), 1.3) + 0.046 * Math.pow(sstep(0.58, 1, t), 1.5);
    const hh = (t) => 0.037 * (0.62 + 0.4 * Math.sin(PI * t * 0.8 + 0.3)) * Math.pow(Math.max(0, 1 - t), 0.6) + 0.0006;
    const C = [], Nn = [];
    for (let i = 0; i <= NW; i++) { const t = i / NW, q = front(wx(t), wy(t), 0.034 + 0.8 * hh(t), 1); C.push(q.p); Nn.push(q.n); }
    const Tn = C.map((p, i) => C[Math.min(NW, i + 1)].clone().sub(C[Math.max(0, i - 1)]).normalize()), Sd = C.map((p, i) => Nn[i].clone().cross(Tn[i]).normalize());
    const g = cgrid(10, NW, (u, v) => { const i = Math.round(v * NW), a = u * TAU; return C[i].clone().addScaledVector(Sd[i], Math.cos(a) * hh(v)).addScaledVector(Nn[i], Math.sin(a) * hh(v) * 0.8); },
      (u, v, nn) => BW.clone().lerp(BWS, sstep(0.1, -0.7, nn.y) * 0.6).lerp(BWL, 0.25 * sstep(0.4, 0.9, nn.y)), true);
    const mb = bucket(); add(mb, g); shiftAll(mb, piv.p);
    const lines = bucket();
    for (let k = 0; k < 6; k++) {   // 6 strand lines along the wing's upper half
      const a = (0.12 + (k / 5) * 0.76) * PI, pts = [], nr = [];
      for (let i = 2; i <= NW - 2; i++) { const t = i / NW; pts.push(C[i].clone().addScaledVector(Sd[i], Math.cos(a) * hh(t) * 1.02).addScaledVector(Nn[i], Math.sin(a) * hh(t) * 0.8 * 1.02 + 0.0008)); nr.push(Nn[i]); }
      put(lines, ribbon(pts, nr, 0.0011, 0.2), null, () => BWS.clone().lerp(BWD, 0.25 * hs(sd * 3 + k, 4)));
    }
    shiftAll(lines, piv.p);
    flush(mb, whiteMat("#8d8a80", 0.16), grp); flush(lines, whiteFlat(), grp, false);
    wings.push({ grp, sd });
  }
  counts.moustache = { wings: 2, strandLines: 12 };

  // ================================================================ HAIR: 12 white locks from under the mitre at the temples and the nape, down to y 0.50
  {
    const hb = bucket(), hl = bucket(); let n = 0;
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) {
      const th0 = s * (1.22 + 0.33 * k + 0.05 * (hs(k + (s > 0 ? 7 : 0), 1) - 0.5)), y0 = 0.725, y1 = 0.50 - 0.02 * hs(k + (s > 0 ? 3 : 9), 2), NN = 16, curl = s * (k % 2 ? 1 : -1);
      const P = [], Nn = [];
      for (let i = 0; i <= NN; i++) {
        const t = i / NN, y = lerp(y0, y1, t), th = th0 + curl * 0.07 * Math.sin(t * PI * 1.1) * (1 - 0.2 * t) + curl * 0.05 * sstep(0.8, 1, t), off = 0.016 + 0.07 * sstep(0.62, 0.22, y) + 0.012 * Math.sin(t * PI) + 0.012 * sstep(0.85, 1, t);
        const q = bp(th, y, off, 1); P.push(q.p); Nn.push(q.n);
      }
      const T = P.map((p, i) => P[Math.min(NN, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize()), Sd = P.map((p, i) => Nn[i].clone().cross(T[i]).normalize());
      const w = (t) => 0.021 * (0.7 + 0.3 * Math.sin(PI * clamp(t * 1.1))) * Math.pow(Math.max(0, 1 - t * t * t), 0.5);
      add(hb, cgrid(5, NN, (u, v) => { const i = Math.round(v * NN), e = 2 * u - 1; return P[i].clone().addScaledVector(Sd[i], w(v) * e).addScaledVector(Nn[i], 0.5 * w(v) * (1 - e * e)); },
        (u, v) => { const e = Math.abs(2 * u - 1); return BW.clone().lerp(BWS, sstep(0.55, 1, e) * 0.7).lerp(BWD, 0.5 * (1 - sstep(0, 0.2, v))); }, false, true));
      for (const e of [-0.35, 0.3]) { const pts = [], nr = []; for (let i = 1; i < NN; i++) { const t = i / NN; pts.push(P[i].clone().addScaledVector(Sd[i], w(t) * e).addScaledVector(Nn[i], 0.5 * w(t) * (1 - e * e) + 0.0014)); nr.push(Nn[i]); } put(hl, ribbon(pts, nr, 0.0011, 0.2), null, () => BWS.clone()); }
      n++;
    }
    counts.hairLocks = n;
    flushGlow(hb, whiteMat("#8d8a80", 0.16), root, () => 0); flush(hl, whiteFlat(), root, false);
  }

  // ================================================================ BROW TUFTS: 2 of 7 white locks 0.09 wide, rebuilt on the rig's brow centre line each time the rig redraws its brows
  const tufts = [null, null], tuftKey = [null, null], tuftMat = whiteMat("#8d8a80", 0.16);
  const bodyN = (p) => V(p.x / (ch.rx * ch.rx), (p.y + LOC - ch.cy) / (ch.ry * ch.ry), p.z / (ch.rz * ch.rz)).normalize();
  const tuftGeo = (C, side) => {   // C: the brow's centre line (body-local), inner end first
    const b = bucket(), n = C.length - 1, at = (s) => { const f = clamp(s) * n, i = Math.min(n - 1, Math.floor(f)); return C[i].clone().lerp(C[i + 1], f - i); };
    for (let j = 0; j < 7; j++) {
      const s = 0.26 + 0.5 * (j / 6) + 0.02 * (hs(j + side * 5, 1) - 0.5), B0 = at(s), Tn = at(s + 0.04).sub(at(s - 0.04)).normalize(), nn = bodyN(B0);
      const up = V(0, 1, 0).addScaledVector(nn, -nn.y).normalize(), out = Tn.clone().multiplyScalar(1);
      const L = 0.05 + 0.022 * Math.sin(PI * (0.15 + 0.7 * j / 6)) + 0.008 * hs(j + side * 5, 2), lean = 0.35 + 0.5 * (j / 6);   // longer toward the middle, leaning outward
      const dir = up.clone().multiplyScalar(0.9).addScaledVector(out, lean).normalize(), P = [], Nm = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; P.push(B0.clone().addScaledVector(dir, L * t).addScaledVector(out, 0.5 * L * t * t * 0.9).addScaledVector(nn, 0.009 + 0.016 * t * t + 0.004 * Math.sin(t * PI))); Nm.push(nn); }
      const Tt = P.map((p, i) => P[Math.min(8, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize()), Sd = P.map((p, i) => Nm[i].clone().cross(Tt[i]).normalize());
      const w = (t) => 0.0145 * Math.pow(Math.max(0, 1 - t), 0.6) * (0.7 + 0.3 * Math.sin(PI * clamp(t * 1.2)));
      add(b, cgrid(3, 8, (u, v) => { const i = Math.round(v * 8), e = 2 * u - 1; return P[i].clone().addScaledVector(Sd[i], w(v) * e).addScaledVector(nn, 0.004 * (1 - e * e)); }, (u, v) => BW.clone().lerp(BWS, sstep(0.55, 1, Math.abs(2 * u - 1)) * 0.6).lerp(BWD, 0.3 * (1 - sstep(0, 0.25, v))), false, true));
    }
    return b;
  };
  const rebuildTufts = () => {
    for (let i = 0; i < 2; i++) {
      const m = F.brows[i]; if (!m) { if (tufts[i]) tufts[i].visible = false; continue; }
      if (tuftKey[i] === m.geometry.uuid && tufts[i]) continue;
      tuftKey[i] = m.geometry.uuid;
      const P = m.geometry.attributes.position, rad = 8, rings = P.count / (rad + 1), C = [];
      for (let r = 0; r < rings; r++) { const c = V(0, 0, 0); for (let j = 0; j < rad; j++) c.add(V(P.getX(r * (rad + 1) + j), P.getY(r * (rad + 1) + j), P.getZ(r * (rad + 1) + j))); c.multiplyScalar(1 / rad); c.y -= LOC; C.push(c); }
      const sub = []; for (let r = 0; r < rings; r += 2) sub.push(C[r]);   // inner end first (the brow is drawn from its inner end)
      const bk = tuftGeo(sub, i ? 1 : -1), geo = mergeGeometries(bk.g);
      if (tufts[i]) { tufts[i].geometry.dispose(); tufts[i].geometry = geo; } else { tufts[i] = new THREE.Mesh(geo, tuftMat); tufts[i].castShadow = true; root.add(tufts[i]); }
      tufts[i].visible = true;
      const Pg = geo.attributes.position, Cc = geo.attributes.color;
      const gp = glowParts.find((q) => q.mesh === tufts[i]); const rec = { geo, base: Cc.array.slice(), mask: new Float32Array(Pg.count).fill(0.7), mesh: tufts[i] };
      if (gp) glowParts[glowParts.indexOf(gp)] = rec; else glowParts.push(rec);
      lastGlow = -1;
    }
  };
  counts.browTufts = { tufts: 2, locksEach: 7 };
  let lastGlow = -1;

  // ================================================================ MITRE (DESIGN C): band edge y M0, peaks at y 1.20, a cleft between the peaks
  // two shield plates (front, back) lofted from the head's ring at the band; half width 0.305 at the band, 0.36 from y 0.92 up; each plate's top
  // edge is a pointed arch (peak at the middle, 1.20) falling to the shelf at the side (0.92); the plates close to 0.035 each side of the middle at
  // the peaks (a cleft 0.07), and a V opens between the peaks seen from the side
  const M0 = K.mitreBase ?? 0.72, MT = 1.20, MP = 0.28, PSI_C = 0.93;
  const mA = (y) => lerp(0.305, 0.36, Math.pow(sstep(M0, 0.92, y), 0.8));
  const mB = (y) => 0.035 + (0.275 - 0.035) * Math.pow(1 - clamp((y - M0) / (MT - M0)), 1.3);
  const topOf = (ps) => MT - MP * Math.pow(Math.min(ps / PSI_C, 1), 1.5);
  const pz = (sd, x, y) => { const a = mA(y), r = clamp(x / a, -0.999, 0.999); return sd * mB(y) * Math.sqrt(1 - r * r); };
  const pm = (sd, x, y, off = 0) => {   // a point on a shield plate by (x, y), `off` out along the plate's normal; sd +1 front, -1 back
    const e = 0.004, P0 = V(x, y, pz(sd, x, y)), dx = V(x + e, y, pz(sd, x + e, y)).sub(V(x - e, y, pz(sd, x - e, y))), dy = V(x, y + e, pz(sd, x, y + e)).sub(V(x, y - e, pz(sd, x, y - e)));
    const n = dx.cross(dy).normalize(); if (n.z * sd < 0) n.negate();
    return { p: P0.addScaledVector(n, off), n };
  };
  const mit = new THREE.Group(); mit.name = "stnick-mitre"; root.add(mit);
  {
    // the velvet: 2 plates, lofted in (phi, v); the nap sheen is a lighter band where the plate faces the key light
    const g = cgrid(128, 30, (u, v) => {
      const ph = u * TAU, ps = Math.abs(Math.cos(ph)), y = lerp(M0, topOf(ps), v), a = mA(y), b = mB(y);
      return V(a * Math.cos(ph), y, b * Math.sin(ph));
    }, (u, v, n, p) => {
      const c = redCol(n); const sheen = Math.exp(-(((p.y - 0.97) / 0.11) ** 2)) * sstep(0.1, 0.8, Math.abs(n.z)) * 0.5;
      c.lerp(REDL, sheen); c.lerp(REDS, 0.35 * (1 - sstep(M0, M0 + 0.05, p.y)));
      return c;
    }, true);
    add(B.red, g);
    // the ridge that closes the top between the plates (lining red), along the top edge
    const rg = cgrid(1, 90, (u, v) => { const ph = v * PI, ps = Math.abs(Math.cos(ph)), y = topOf(ps), a = mA(y), b = mB(y); return V(a * Math.cos(ph), y, (u * 2 - 1) * b * Math.sin(ph)); }, () => REDS.clone());
    add(B.redS, rg);
    // the circlet 0.05 round the head (GOLD), a rounded band standing 0.004 off the velvet
    const NU = 160, cg = cgrid(NU, 6, (u, v) => {
      const ph = u * TAU, y = M0 + 0.05 * v, a = mA(y) + 0.003 * Math.sin(PI * v) + 0.0025, b = mB(y) + 0.003 * Math.sin(PI * v) + 0.0025;
      return V(a * Math.cos(ph), y, b * Math.sin(ph));
    }, (u, v, n, p) => { const i = Math.floor(u * 40); return thread(0.12 + 0.76 * v, wearAt(i * 9 + Math.floor(v * 3), 1)); }, true, true);
    add(B.gold, cg);
    // twisted cord 0.006 on both edges of the circlet and up both edges of the vertical band
    const cord = (pts, closed = false, r = 0.0031) => { const len = pts.reduce((s, p, i) => s + (i ? p.distanceTo(pts[i - 1]) : 0), 0); add(B.gold, sweep(pts, r, 6, (t, a, n) => { const tw = Math.sin(((t * len) / 0.0042 + a / TAU) * TAU); return gold(n, 0).lerp(GS, tw > 0.2 ? 0.4 : 0).lerp(GL, tw < -0.6 ? 0.25 : 0); }, Math.max(24, Math.round(len / 0.006)), closed)); };
    for (const yy of [M0 + 0.0015, M0 + 0.0485]) { const pts = []; for (let i = 0; i < 64; i++) { const ph = (i / 64) * TAU; pts.push(V((mA(yy) + 0.0055) * Math.cos(ph), yy, (mB(yy) + 0.0055) * Math.sin(ph))); } cord(pts, true); }
    // gold piping on the outer edges: round the top edge of both plates (the shelves and the peaks) and up each side seam; a bead on each peak
    {
      const pts = []; for (let i = 0; i < 128; i++) { const ph = (i / 128) * TAU, ps = Math.abs(Math.cos(ph)), y = topOf(ps) + 0.002; pts.push(V(mA(y) * Math.cos(ph), y, mB(y) * Math.sin(ph))); }
      add(B.gold, sweep(pts, 0.0047, 7, (t, a, n) => gold(n, wearAt(Math.floor(t * 50), 2)), 200, true));
      for (const sx of [-1, 1]) { const s = []; for (let i = 0; i <= 8; i++) { const y = M0 + 0.05 + (0.92 - M0 - 0.05) * (i / 8); s.push(V(sx * (mA(y) + 0.002), y, 0)); } add(B.gold, sweep(s, 0.0036, 6, (t, a, n) => gold(n, 0), 16)); }
      for (const sd of [-1, 1]) { const bead = new THREE.SphereGeometry(0.012, 14, 10); put(B.gold, bead, new THREE.Matrix4().setPosition(0, MT + 0.004, sd * mB(MT - 0.004)), (n) => gold(n, 0)); }
    }
    // snow on both shelves of the cleft: 2 cm deep, the lip rounded (radius 40 % of the depth) and overhanging 15 %, a shade line under it
    for (const sx of [-1, 1]) {
      const sg = new THREE.SphereGeometry(1, 24, 14); sg.scale(0.03, 0.02, 0.062);
      put(B.snow, sg, new THREE.Matrix4().setPosition(sx * 0.345, 0.92 + 0.001, 0), (n) => { const k = sstep(-0.25, 0.55, n.y); return col("#7f95c4").lerp(col("#cfdcf2"), sstep(-0.5, 0.1, n.y)).lerp(col("#ffffff"), k * 0.9); });
    }
  }
  // decoration on both plates: the vertical band 0.055 wide, 5 scrolls and 14 seed pearls on it, 4 six-petal flowers with pearl centres, 9 scrolls on the circlet's front
  const scroll = (map, cx, cy, R, flip, rot, buck, dark = 1) => {
    const pts = [], nr = [], n = 34;
    for (let i = -6; i <= n; i++) {   // a short lead-in stem, then the spiral of 1.5 turns shrinking to its eye
      let a, b; if (i < 0) { const t0 = V(-Math.sin(rot), Math.cos(rot), 0).multiplyScalar(flip), d = (-i / 6) * 1.5 * R; a = cx + R * Math.cos(rot) - t0.x * d; b = cy + R * Math.sin(rot) - t0.y * d; }
      else { const th = (i / n) * 3 * PI, r = R * (1 - 0.86 * i / n), al = rot + th * flip; a = cx + r * Math.cos(al); b = cy + r * Math.sin(al); }
      const q = map(a, b, 0.0008); pts.push(q.p); nr.push(q.n);
    }
    put(buck, ribbon(pts, nr, 0.0017 * (R / 0.0115) ** 0.5, 0.3), null, () => GS.clone().lerp(GD, 0.35 * dark));
    for (const i of [8, 17, 26]) {   // 3 leaves on the outside of the turns
      const th = (i / n) * 3 * PI, r = R * (1 - 0.86 * i / n), al = rot + th * flip, a0 = cx + r * Math.cos(al), b0 = cy + r * Math.sin(al), L = R * 0.92, W = R * 0.36, dir = al + flip * 0.5;
      const poly = []; for (let k = 0; k <= 8; k++) { const s = k / 8; poly.push([s * L, W * Math.pow(Math.sin(PI * s), 0.85)]); } for (let k = 7; k >= 1; k--) { const s = k / 8; poly.push([s * L, -W * Math.pow(Math.sin(PI * s), 0.85)]); }
      const R2 = poly.map(([x, y]) => [a0 + x * Math.cos(dir) - y * Math.sin(dir), b0 + x * Math.sin(dir) + y * Math.cos(dir)]);
      add(buck, fillPoly(R2, (a, b) => map(a, b, 0.0006), () => GS.clone().lerp(GD, 0.2 * dark), 0.006));
    }
  };
  const flower = (map, cx, cy, size, bk, pk, k0 = 0) => {   // 6 petals + a pearl centre
    for (let k = 0; k < 6; k++) {
      const al = (k / 6) * TAU + 0.26, L = size * 0.5, W = size * 0.17, poly = [];
      for (let q = 0; q <= 8; q++) { const s = q / 8; poly.push([s * L, W * Math.pow(Math.sin(PI * Math.pow(s, 0.8)), 0.9)]); } for (let q = 7; q >= 1; q--) { const s = q / 8; poly.push([s * L, -W * Math.pow(Math.sin(PI * Math.pow(s, 0.8)), 0.9)]); }
      const R2 = poly.map(([x, y]) => [cx + x * Math.cos(al) - y * Math.sin(al), cy + x * Math.sin(al) + y * Math.cos(al)]);
      add(bk, fillPoly(R2, (a, b) => map(a, b, 0.0012 + 0.0003 * k), (a, b) => { const d = Math.hypot(a - cx, b - cy) / L; return thread(0.2 + 0.5 * d, wearAt(k0 * 6 + k, 3)); }, 0.006));
    }
    const m = map(cx, cy, 0.0045), sp = new THREE.SphereGeometry(size * 0.15, 14, 10);
    put(pk, sp, new THREE.Matrix4().setPosition(m.p), pearlCol);
  };
  let nPearls = 0, nFlowers = 0, nScV = 0, nScC = 0;
  for (const sd of [1, -1]) {
    const map = (a, b, off) => pm(sd, a, b, off + 0.0035 + 0.0028);   // on the band
    const mapV = (a, b, off) => pm(sd, a, b, off);
    // the vertical band: 0.055 wide, from the circlet to the peak, rounded across, with a cord down each edge
    const YB0 = M0 + 0.05, YB1 = MT - 0.012;
    add(B.gold, cgrid(5, 36, (u, v) => { const e = 2 * u - 1; return pm(sd, e * 0.0235, lerp(YB0, YB1, v), 0.0032 + 0.0026 * (1 - e * e)).p; }, (u, v, n) => { const i = Math.floor(v * 36); return thread(u, wearAt(i * 3 + Math.floor(u * 5) + (sd > 0 ? 0 : 200), 4)); }, false, sd < 0));
    for (const x of [-0.0275, 0.0275]) { const pts = []; for (let i = 0; i <= 28; i++) { const y = lerp(M0 + 0.047, MT - 0.014, i / 28), q = pm(sd, x, y, 0.0038); pts.push(q.p); } const len = pts.reduce((s, p, i) => s + (i ? p.distanceTo(pts[i - 1]) : 0), 0); add(B.gold, sweep(pts, 0.0031, 6, (t, a, n) => { const tw = Math.sin(((t * len) / 0.0042 + a / TAU) * TAU); return gold(n, 0).lerp(GS, tw > 0.2 ? 0.4 : 0).lerp(GL, tw < -0.6 ? 0.25 : 0); }, 60)); }
    for (let k = 0; k < 5; k++) { scroll(map, 0, 0.84 + 0.075 * k, 0.0115, k % 2 ? -1 : 1, (k % 2 ? 0.5 : 2.6) + 0.2 * hs(k + (sd > 0 ? 0 : 9), 5), B.deco); if (sd > 0) nScV++; }
    for (let k = 0; k < 7; k++) for (const x of [-0.0205, 0.0205]) { const y = 0.80 + 0.0567 * k, q = pm(sd, x, y, 0.0035 + 0.0026 * (1 - (x / 0.0235) ** 2) + 0.005), sp = new THREE.SphereGeometry(0.006, 12, 9); put(B.pearl, sp, new THREE.Matrix4().setPosition(q.p), pearlCol); if (sd > 0) nPearls++; }
    for (const [x, y] of [[0.15, 0.832], [-0.15, 0.832], [0.118, 0.99], [-0.118, 0.99]]) { flower(mapV, x, y, 0.05, B.deco, B.pearl, nFlowers); if (sd > 0) nFlowers++; }
    // 9 scrolls along the circlet's front (alternately turned), a running vine
    for (let k = 0; k < 9; k++) { const x = (k - 4) * 0.0485; scroll((a, b, off) => pm(sd, a, b, off + 0.0058), x, M0 + 0.025, 0.0105, k % 2 ? -1 : 1, k % 2 ? 1.2 : -1.2 + 3.1, B.deco); if (sd > 0) nScC++; }
  }
  counts.mitre = { verticalScrolls: nScV, circletScrolls: nScC, pearls: nPearls, flowers: nFlowers, peaks: 2, lappets: 2 };

  // ---- the 2 lappets 0.06 x 0.30 from the back of the circlet down to y 0.44: velvet with gold edges, 3 small flowers, a gold end bar, a fringe of 9 threads
  const lappets = [];
  for (const sd of [-1, 1]) {
    const x0 = sd * 0.085, y0 = M0 + 0.004, y1 = 0.44, NN = 18, P = [], Nn = [];
    const backPt = (x, y, off) => bp(sd * (PI - thFor(Math.abs(x), y)), y, off, 1);
    const offL = (y) => lerp(0.036, 0.084, sstep(0.69, 0.6, y));
    const piv = backPt(x0, y0, offL(y0)).p.clone(), grp = new THREE.Group(); grp.name = sd > 0 ? "stnick-lappet-L" : "stnick-lappet-R"; grp.position.copy(piv); root.add(grp);
    for (let i = 0; i <= NN; i++) { const y = lerp(y0, y1, i / NN), x = x0 * (1 + 0.1 * (i / NN)), q = backPt(x, y, offL(y)); P.push(q.p); Nn.push(q.n); }
    const T = P.map((p, i) => P[Math.min(NN, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize()), Sd = P.map((p, i) => Nn[i].clone().cross(T[i]).normalize());
    const lb = { red: bucket(), gold: bucket(), pearl: bucket(), deco: bucket() }, wd = (v) => 0.03 * (0.9 + 0.1 * v);
    add(lb.red, cgrid(4, NN, (u, v) => { const i = Math.round(v * NN), e = 2 * u - 1; return P[i].clone().addScaledVector(Sd[i], wd(v) * e).addScaledVector(Nn[i], 0.003 * (1 - e * e)); }, (u, v, n) => redCol(n).lerp(REDS, 0.15), false, true));
    for (const e of [-1, 1]) add(lb.gold, cgrid(2, NN, (u, v) => { const i = Math.round(v * NN); return P[i].clone().addScaledVector(Sd[i], wd(v) * e * (0.78 + 0.22 * u)).addScaledVector(Nn[i], 0.0045); }, (u, v, n) => gold(n, wearAt(Math.floor(v * 18) + (e > 0 ? 30 : 0) + (sd > 0 ? 60 : 0), 5)), false, e > 0));
    for (const v of [0.22, 0.5, 0.78]) {   // 3 small flowers
      const i = Math.round(v * NN), c = P[i].clone().addScaledVector(Nn[i], 0.005);
      for (let k = 0; k < 6; k++) { const al = (k / 6) * TAU, d = Sd[i].clone().multiplyScalar(Math.cos(al)).addScaledVector(T[i], Math.sin(al)); const pt = new THREE.SphereGeometry(0.0055, 8, 6); pt.scale(1.5, 0.55, 0.5); const bas = new THREE.Matrix4().makeBasis(d, Nn[i].clone().cross(d).normalize(), Nn[i]).setPosition(c.clone().addScaledVector(d, 0.0075)); put(lb.gold, pt, bas, (n) => gold(n, 0)); }
      put(lb.pearl, new THREE.SphereGeometry(0.0046, 10, 8), new THREE.Matrix4().setPosition(c.clone().addScaledVector(Nn[i], 0.002)), pearlCol);
    }
    // the gold end bar and 9 fringe threads
    const eB = P[NN].clone().addScaledVector(Nn[NN], 0.003), bar = new THREE.BoxGeometry(0.066, 0.012, 0.006), BM = new THREE.Matrix4().makeBasis(Sd[NN].clone().negate(), T[NN], Nn[NN]).setPosition(eB.clone().addScaledVector(T[NN], -0.004));
    put(lb.gold, bar, BM, (n) => gold(n, wearAt(sd + 5, 6)));
    for (let k = 0; k < 9; k++) { const x = (k / 8 - 0.5) * 0.058, pts = [], nr = []; for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(eB.clone().addScaledVector(Sd[NN], x).addScaledVector(T[NN], -0.008 - 0.02 * (0.85 + 0.3 * hs(k + sd * 7, 8)) * t).addScaledVector(Nn[NN], 0.003 + 0.004 * t + 0.002 * Math.sin(t * 3 + k))); nr.push(Nn[NN]); } add(lb.deco, ribbon(pts, nr, 0.0013, 0.1).toNonIndexed(), null); const gl = lb.deco.g[lb.deco.g.length - 1], cc = new Float32Array(gl.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = GB.r; cc[i + 1] = GB.g; cc[i + 2] = GB.b; } gl.setAttribute("color", new THREE.BufferAttribute(cc, 3)); }
    for (const k of Object.keys(lb)) shiftAll(lb[k], piv);
    flush(lb.red, vmat({ line: "#4a0e14", rough: 0.9, role: "cloth" }), grp); flush(lb.gold, vmat({ line: "#5a3c10", rough: 0.4 }), grp); flush(lb.pearl, vmat({ line: "#8d8575", rough: 0.3 }), grp); flush(lb.deco, vmat({ flat: true, rough: 0.5 }), grp, false);
    lappets.push({ grp, sd });
  }

  // flush the mitre's buckets
  flush(B.red, (() => { const m = vmat({ line: "#4a0e14", rough: 0.92, role: "cloth", side: THREE.DoubleSide }); m.emissive = col("#6a1620"); m.emissiveIntensity = 0.6; return m; })(), mit);
  flush(B.redS, vmat({ line: "#3a0a10", rough: 0.92, role: "cloth", side: THREE.DoubleSide }), mit);
  flush(B.gold, vmat({ line: "#5a3c10", rough: 0.4 }), mit);
  flush(B.deco, vmat({ flat: true, rough: 0.55 }), mit, false);
  flush(B.pearl, vmat({ line: "#8d8575", rough: 0.3 }), mit);
  flush(B.snow, vmat({ line: "#7f95c4", rough: 0.95 }), mit);

  // ================================================================ COPE (DESIGN C): from the collar line y 0.56 round the back and sides to a hem at y -0.12, open in front
  const YC = 0.56, YHEM = -0.12, YB = 0.30, BASEC = 0.035, FHC = 1.28;
  const hemWave = (th) => 0.004 * Math.sin(th * 5 + 0.7) + 0.003 * Math.sin(th * 11 + 2.1);
  // 9 broad folds from the collar, centred on the back, each its own width and depth; they die out toward the front edges and the collar
  const FOLDS = Array.from({ length: 9 }, (_, i) => ({ th: PI + (i - 4) * 0.56 + 0.06 * (hs(i, 31) - 0.5), a: 0.012 + 0.013 * hs(i, 32), w: 0.27 + 0.06 * hs(i, 33) }));
  const thEcache = new Map();
  const edgeX = (yl) => lerp(0.20, 0.30, clamp((YC - yl) / (YC - YHEM)));   // the opening: 0.20 from the middle at the top, 0.30 at the hem
  const copeRaw = (th, yl, off = 0, fold = true) => {
    const yw = yl + hemWave(th) * sstep(0.0, YHEM, yl), ylc = Math.max(yw, YB), s = surfAt(th, ylc), n = s.normal.clone(); n.y *= 0.4; n.normalize();
    let fo = 0;
    if (fold) { const g = 0.2 + 0.8 * sstep(0.56, 0.1, yw), tw = wrapPi(th); for (const f of FOLDS) fo += f.a * bump(wrapPi(th - f.th) / f.w); fo *= g * sstep(0.7, 1.3, Math.abs(tw)); }
    const p = s.pos.clone().addScaledVector(n, BASEC + fo + off);
    if (yw < YB) { const f = 1 + (FHC - 1) * sstep(0, 1, (YB - yw) / (YB - YHEM)); p.x *= f; p.z *= f; p.y -= YB - yw; }
    p.y -= LOC; return { p, n, fo };
  };
  const thE = (yl) => {   // the angle (from the front) of the cope's opening edge at height yl
    const key = Math.round(yl * 4000); let v = thEcache.get(key); if (v != null) return v;
    let lo = 0.02, hi = 1.5; const want = edgeX(yl);
    for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (copeRaw(m, yl, 0, false).p.x < want) lo = m; else hi = m; }
    v = (lo + hi) / 2; thEcache.set(key, v); return v;
  };
  const rhoAt = (yl, th) => { const p = copeRaw(th, yl, 0, false).p; return Math.hypot(p.x, p.z); };
  const copeSh = (th, yl) => {   // the shade side of every fold: light from the left, a flank that falls toward +th is in shade
    const D = 0.02, d0 = copeRaw(th - D, yl, 0, true).fo, d1 = copeRaw(th + D, yl, 0, true).fo; return -(d1 - d0) / (2 * D) * 3.0;
  };
  const dress = [];   // meshes that follow the kneel: every vertex of the cope and the alb is a function of its rest position
  const regDress = (m) => { if (!m) return m; const P = m.geometry.attributes.position, idx = []; for (let i = 0; i < P.count; i++) if (P.getY(i) < 0.34) idx.push(i); dress.push({ mesh: m, geo: m.geometry, rest: P.array.slice(), idx }); return m; };

  // the velvet shell: a grid in (u across the cloth from edge to edge round the back, v down)
  {
    const NU = 200, NV = 46, rows = Array.from({ length: NV + 1 }, (_, j) => lerp(YC, YHEM, j / NV)), te = rows.map(thE);
    const g = cgrid(NU, NV, (u, v) => { const j = Math.round(v * NV), th = te[j] + u * (TAU - 2 * te[j]); return copeRaw(th, rows[j], 0, true).p; },
      (u, v, n, p) => {
        const j = Math.round(v * NV), th = te[j] + u * (TAU - 2 * te[j]), sh = copeSh(th, rows[j]), c = RED.clone();
        if (sh > 0) c.lerp(REDS, clamp(sh) * 0.55); else c.lerp(REDL, clamp(-sh) * 0.5);
        c.lerp(REDL, 0.34 * Math.exp(-(((rows[j] - 0.47) / 0.07) ** 2)) * sstep(-0.2, 0.6, n.y));   // the nap sheen over the shoulders
        c.lerp(REDS, 0.18 * sstep(0.15, -0.12, rows[j]));
        const nap = 0.035 * (hs(Math.floor(u * NU) * 7 + j, 34) - 0.5); c.offsetHSL(0, 0, nap);
        return c;
      }, false, true);
    add(B.cope, g);
  }
  // front bands 0.10 wide on the darker ground, a running gold oak vine (11 leaves, 6 acorns a band), gold cord on both edges; the lining where the edge turns back
  const YB0 = 0.538, YB1 = YHEM + 0.062, LB = YB0 - YB1;
  const bandMap = (sd, p, q, off) => {   // p metres across from the cope's edge outward, q metres down from the collar
    const y = YB0 - q * (YB0 - YB1) / LB;
    const th = sd * (thE(y) + p / rhoAt(y, thE(y)));
    return copeRaw(th, y, off, true);
  };
  const OFFB = 0.0036;
  let nLeaves = 0, nAcorns = 0;
  for (const sd of [-1, 1]) {
    add(B.copeDeco, cgrid(6, 60, (u, v) => bandMap(sd, u * 0.10, v * LB, OFFB).p, (u, v) => REDS.clone().lerp(col("#4e0e15"), 0.35 * Math.pow(Math.abs(u * 2 - 1), 3))));
    // cord on both band edges (twisted), the lining where the cope's edge turns back
    for (const p of [0.003, 0.097]) { const pts = []; for (let i = 0; i <= 50; i++) pts.push(bandMap(sd, p, (i / 50) * LB, OFFB + 0.0016).p); const len = pts.reduce((s, q, i) => s + (i ? q.distanceTo(pts[i - 1]) : 0), 0); add(B.copeGold, sweep(pts, 0.0031, 6, (t, a, n) => { const tw = Math.sin(((t * len) / 0.0044 + a / TAU) * TAU); return gold(n, wearAt(Math.floor(t * 40) + (p > 0.05 ? 90 : 0) + (sd > 0 ? 0 : 400), 7)).lerp(GS, tw > 0.2 ? 0.4 : 0).lerp(GL, tw < -0.6 ? 0.22 : 0); }, 100)); }
    {
      const pts = [], nr = []; for (let i = 0; i <= 50; i++) { const q = bandMap(sd, -0.0065, (i / 50) * LB, 0.0045); pts.push(q.p); nr.push(q.n); }
      add(B.copeDeco, strip(pts, nr, 0.0072).toNonIndexed(), null);
      const gg = B.copeDeco.g[B.copeDeco.g.length - 1], P = gg.attributes.position, cc = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) { const c = LINING.clone().lerp(LINL, 0.35 * Math.exp(-((((i % 4) - 1.5) / 1.2) ** 2))).lerp(LINS, 0.25 * hs(Math.floor(i / 6), 35)); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; }
      gg.setAttribute("color", new THREE.BufferAttribute(cc, 3));
    }
    // the vine: a wandering stem, leaves alternating, acorns hanging between
    const stemB = (q) => 0.05 + 0.0205 * Math.sin((q / LB) * TAU * 3.3 + (sd > 0 ? 0.4 : 2.2));
    {
      const pts = [], nr = []; for (let i = 0; i <= 90; i++) { const q = 0.02 + (i / 90) * (LB - 0.04), m = bandMap(sd, stemB(q), q, OFFB + 0.0012); pts.push(m.p); nr.push(m.n); }
      add(B.copeDeco, ribbon(pts, nr, 0.0023, 0.1).toNonIndexed(), null);
      const gg = B.copeDeco.g[B.copeDeco.g.length - 1], cc = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = GB.r; cc[i + 1] = GB.g; cc[i + 2] = GB.b; }
      gg.setAttribute("color", new THREE.BufferAttribute(cc, 3));
    }
    for (let k = 0; k < 11; k++) {
      const q0 = 0.03 + (LB - 0.06) * ((k + 0.5) / 11), side = k % 2 ? 1 : -1, p0 = stemB(q0), tilt = 0.62 + 0.12 * (hs(k + (sd > 0 ? 0 : 11), 36) - 0.5), dp = side * Math.sin(tilt), dq = Math.cos(tilt);
      const L = 0.050 + 0.006 * hs(k + (sd > 0 ? 0 : 11), 37), W = 0.0125, poly = [];
      const wl = (s) => W * Math.pow(Math.sin(PI * Math.pow(s, 0.85)), 0.75) * (1 + 0.3 * Math.cos(5 * PI * s + 0.4)) ;   // an oak leaf: 5 rounded lobes along each side
      for (let i = 0; i <= 14; i++) { const s = i / 14; poly.push([s * L, wl(s)]); } for (let i = 13; i >= 1; i--) { const s = i / 14; poly.push([s * L, -wl(s)]); }
      const mapL = (l, w, off = 0) => bandMap(sd, p0 + l * dp - w * dq * 1, q0 + l * dq + w * dp * 1, OFFB + 0.0018 + off);
      add(B.copeDeco, fillPoly(poly, (l, w) => mapL(l, w), (l, w) => thread(0.5 + w / (2 * W), wearAt(k * 5 + (sd > 0 ? 0 : 50), 8)), 0.008));
      const mr = [], mn = []; for (let i = 0; i <= 8; i++) { const q = mapL((i / 8) * L * 0.92, 0, 0.0012); mr.push(q.p); mn.push(q.n); }
      add(B.copeDeco, ribbon(mr, mn, 0.0009, 0.2).toNonIndexed(), null); { const gg = B.copeDeco.g[B.copeDeco.g.length - 1], cc = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = GL.r; cc[i + 1] = GL.g; cc[i + 2] = GL.b; } gg.setAttribute("color", new THREE.BufferAttribute(cc, 3)); }
      nLeaves += sd > 0 ? 1 : 0;
    }
    for (const k of [0, 2, 4, 6, 8, 10]) {   // 6 acorns: a small stem, the nut (an oval) and its scaled cup
      const q0 = 0.03 + (LB - 0.06) * ((k + 1.5) / 11), side = k % 4 === 0 ? 1 : -1, p0 = stemB(q0), pc = p0 + side * 0.012, qc = q0 + 0.022;
      const mp = (a, b, off) => bandMap(sd, a, b, OFFB + 0.0018 + off);
      const sp = [], sn = []; for (let i = 0; i <= 5; i++) { const t = i / 5, m = mp(p0 + (pc - p0) * t, q0 + (qc - 0.012 - q0) * t, 0.0004); sp.push(m.p); sn.push(m.n); }
      add(B.copeDeco, ribbon(sp, sn, 0.0013, 0.1).toNonIndexed(), null); { const gg = B.copeDeco.g[B.copeDeco.g.length - 1], cc = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { cc[i] = GB.r; cc[i + 1] = GB.g; cc[i + 2] = GB.b; } gg.setAttribute("color", new THREE.BufferAttribute(cc, 3)); }
      const nut = blob(0, 0, (a) => 1, 18).map(([x, y]) => [pc + x * 0.0072, qc + 0.004 + y * 0.0105]);
      add(B.copeDeco, fillPoly(nut, (a, b) => mp(a, b, 0.0014), (a, b) => thread(0.25 + 0.6 * ((a - pc) / 0.0072 + 1) / 2, 0), 0.005));
      const cup = []; for (let i = 0; i <= 10; i++) { const a = PI + (i / 10) * PI; cup.push([pc + 0.0098 * Math.cos(a) * -1, qc - 0.0085 + 0.0072 * Math.sin(a) * -1]); } cup.push([pc - 0.0098, qc - 0.0085]);
      add(B.copeDeco, fillPoly(cup, (a, b) => mp(a, b, 0.0022), (a, b) => GS.clone().lerp(GB, 0.25 + 0.3 * ((b - (qc - 0.0085)) / 0.0072)), 0.005));
      nAcorns += sd > 0 ? 1 : 0;
    }
  }
  counts.copeBand = { leavesPerBand: nLeaves, acornsPerBand: nAcorns, bands: 2 };

  // the hem band 0.06 with 40 gold lozenges, between two gold cords
  {
    const Y0 = YHEM + 0.004, Y1 = YHEM + 0.06, YM = (Y0 + Y1) / 2, NUh = 160, hemTh = (u, y) => { const a = thE(y); return a + u * (TAU - 2 * a); };
    add(B.copeDeco, cgrid(NUh, 4, (u, v) => copeRaw(hemTh(u, lerp(Y0, Y1, v)), lerp(Y0, Y1, v), OFFB, true).p, (u, v) => REDS.clone().lerp(col("#4e0e15"), 0.3 * Math.pow(Math.abs(v * 2 - 1), 2))));
    for (const y of [Y0 - 0.001, Y1 + 0.001]) { const pts = []; for (let i = 0; i <= 90; i++) pts.push(copeRaw(hemTh(i / 90, y), y, OFFB + 0.0016, true).p); const len = pts.reduce((s, q, i) => s + (i ? q.distanceTo(pts[i - 1]) : 0), 0); add(B.copeGold, sweep(pts, 0.0031, 6, (t, a, n) => { const tw = Math.sin(((t * len) / 0.0044 + a / TAU) * TAU); return gold(n, wearAt(Math.floor(t * 60) + (y > 0 ? 300 : 0), 9)).lerp(GS, tw > 0.2 ? 0.4 : 0).lerp(GL, tw < -0.6 ? 0.22 : 0); }, 180)); }
    // 40 lozenges spaced evenly along the hem's length
    const S = 400, cum = [0], ths = []; { let prev = null; for (let i = 0; i <= S; i++) { const th = hemTh(i / S, YM), p = copeRaw(th, YM, 0, false).p; if (prev) cum.push(cum[i - 1] + p.distanceTo(prev)); ths.push(th); prev = p; } }
    const tot = cum[S]; let nL = 0;
    for (let k = 0; k < 40; k++) {
      const s = ((k + 0.5) / 40) * tot; let i = 1; while (i < S && cum[i] < s) i++; const f = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]), th0 = lerp(ths[i - 1], ths[i], f), rho = rhoAt(YM, th0);
      const mp = (a, b, off) => copeRaw(th0 + a / rho, YM + b, OFFB + off, true);
      const outer = [[0, 0.0235], [0.0135, 0], [0, -0.0235], [-0.0135, 0]], inner = [[0, 0.0125], [0.0068, 0], [0, -0.0125], [-0.0068, 0]];
      add(B.copeDeco, fillPoly(outer, (a, b) => mp(a, b, 0.0016), (a, b) => thread(0.5 - 0.5 * Math.abs(a) / 0.0135 + 0.1 * (b > 0 ? 1 : -1), wearAt(k, 10)), 0.006));
      add(B.copeDeco, fillPoly(inner, (a, b) => mp(a, b, 0.0024), () => REDS.clone().lerp(col("#4e0e15"), 0.3), 0.006));
      put(B.copeGold, new THREE.SphereGeometry(0.0032, 8, 6), new THREE.Matrix4().setPosition(mp(0, 0, 0.0036).p), (n) => gold(n, 0));
      nL++;
    }
    counts.hemLozenges = nL;
  }

  // the damask: 16 gold lily sprigs 0.08 on a half-drop lattice of 0.16, only 20 % brighter than the red (tone on tone), round the back and sides
  {
    const cand = [];
    for (let c = -5; c <= 5; c++) for (let r = -1; r <= 3; r++) {
      const s = c * 0.16, y = 0.04 + 0.16 * r + (c % 2 ? 0.08 : 0);
      if (y < 0.0 || y > 0.45) continue;
      if (Math.abs(s) < 0.13 + 0.05 && y + 0.046 > 0.10 && y - 0.038 < 0.40) continue;   // clear of the back shield
      cand.push({ s, y, d: Math.hypot(s * 0.9, y - 0.22) });
    }
    cand.sort((a, b) => a.d - b.d || a.s - b.s);
    const pick = cand.slice(0, 16), DAM = (n) => redCol(n).multiplyScalar(1.2);
    pick.forEach((q, k) => {
      const th0 = PI + q.s / rhoAt(q.y, PI), mp = (a, b, off) => copeRaw(th0 + a / rhoAt(q.y + b, th0), q.y + b, 0.0022 + off, true);
      const petal = (pts, W0) => { const poly = []; const n = pts.length - 1; const P2 = pts; for (let i = 0; i <= n; i++) { const t = i / n, a = P2[i], w = W0 * Math.pow(Math.sin(PI * Math.pow(t, 0.8)), 0.9) + 0.0004, b = P2[Math.min(n, i + 1)], c0 = P2[Math.max(0, i - 1)], tx = b[0] - c0[0], ty = b[1] - c0[1], l = Math.hypot(tx, ty) || 1; poly.push([a[0] - (ty / l) * w, a[1] + (tx / l) * w]); } for (let i = n - 1; i >= 1; i--) { const t = i / n, a = P2[i], w = W0 * Math.pow(Math.sin(PI * Math.pow(t, 0.8)), 0.9) + 0.0004, b = P2[Math.min(n, i + 1)], c0 = P2[Math.max(0, i - 1)], tx = b[0] - c0[0], ty = b[1] - c0[1], l = Math.hypot(tx, ty) || 1; poly.push([a[0] + (ty / l) * w, a[1] - (tx / l) * w]); } return poly; };
      const mid = Array.from({ length: 9 }, (_, i) => [0, -0.004 + (i / 8) * 0.046]);   // the centre petal, pointed
      const lf = Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [-0.004 - 0.022 * Math.sin(t * 1.3), 0.0 + 0.024 * t - 0.006 * t * t * 0 + 0.002 * Math.sin(t * 3)]; });
      const rt = lf.map(([a, b]) => [-a, b]);
      for (const [pts, W0] of [[mid, 0.0062], [lf, 0.0052], [rt, 0.0052]]) add(B.copeDeco, fillPoly(petal(pts, W0), (a, b) => mp(a, b, 0), (a, b, n) => DAM(n), 0.005));
      const stem = [[0, -0.038], [0.0015, -0.02], [0, -0.004]], band = [[-0.011, -0.006], [0.011, -0.006], [0.011, -0.001], [-0.011, -0.001]];   // the stem and the tie round the petals
      const sp = stem.map(([a, b]) => mp(a, b, 0.0004)); add(B.copeDeco, ribbon(sp.map((m) => m.p), sp.map((m) => m.n), 0.0016, 0.1).toNonIndexed(), null);
      { const gg = B.copeDeco.g[B.copeDeco.g.length - 1], cc = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < gg.attributes.position.count; i++) { const n = V(gg.attributes.normal.getX(i), gg.attributes.normal.getY(i), gg.attributes.normal.getZ(i)), c = DAM(n); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; } gg.setAttribute("color", new THREE.BufferAttribute(cc, 3)); }
      add(B.copeDeco, fillPoly(band, (a, b) => mp(a, b, 0.0006), (a, b, n) => DAM(n), 0.006));
      for (const sx of [-1, 1]) { const lp = petal([[sx * 0.0015, -0.03], [sx * 0.009, -0.026], [sx * 0.016, -0.018], [sx * 0.019, -0.01]], 0.0034); add(B.copeDeco, fillPoly(lp, (a, b) => mp(a, b, 0.0003), (a, b, n) => DAM(n), 0.005)); }
    });
    counts.lilySprigs = pick.length;
  }

  // the back shield 0.26 x 0.30 with the embroidered picture: 3 gold balls over a small boot
  {
    const SC = 0.25, SH = 0.15, SW = 0.13, th0 = PI, mp = (s, y, off) => copeRaw(th0 + s / rhoAt(y, th0), y, OFFB + off, true);
    const shield = []; shield.push([-SW, SC + SH], [SW, SC + SH], [SW, SC - 0.02]); for (let i = 1; i <= 14; i++) { const t = i / 15; shield.push([SW * Math.cos(t * PI / 2), SC - 0.02 - (SH - 0.02 + 0.0) * Math.pow(Math.sin(t * PI / 2), 1.5)]); } shield.push([0, SC - SH]); for (let i = 14; i >= 1; i--) { const t = i / 15; shield.push([-SW * Math.cos(t * PI / 2), SC - 0.02 - (SH - 0.02) * Math.pow(Math.sin(t * PI / 2), 1.5)]); } shield.push([-SW, SC - 0.02]);
    add(B.copeDeco, fillPoly(shield, (a, b) => mp(a, b, 0.0006), (a, b) => REDS.clone().lerp(col("#4e0e15"), 0.3 * (Math.abs(a) / SW) ** 2), 0.016));
    const inner = shield.map(([a, b]) => [a * 0.93, SC + (b - SC) * 0.93]); const cp = inner.map(([a, b]) => mp(a, b, 0.0026).p); cp.push(cp[0].clone());
    add(B.copeGold, sweep(cp, 0.0033, 6, (t, a, n) => { const tw = Math.sin(((t * 1.2) / 0.0044 + a / TAU) * TAU); return gold(n, wearAt(Math.floor(t * 50), 11)).lerp(GS, tw > 0.2 ? 0.4 : 0).lerp(GL, tw < -0.6 ? 0.22 : 0); }, 140));
    for (const [s, y] of [[-0.05, 0.35], [0.05, 0.35], [0, 0.296]]) { const q = mp(s, y, 0.0), sp = new THREE.SphereGeometry(0.027, 20, 14); put(B.copeGold, sp, new THREE.Matrix4().setPosition(q.p.clone().addScaledVector(q.n, 0.014)), (n) => gold(n, 0)); }
    const boot = [[-0.017, 0.058], [0.015, 0.058], [0.017, 0.014], [0.042, 0.008], [0.058, -0.004], [0.06, -0.022], [-0.026, -0.022], [-0.028, -0.006], [-0.02, 0.012]].map(([a, b]) => [a, b + 0.185]);
    add(B.copeDeco, fillPoly(boot, (a, b) => mp(a, b, 0.0022), (a, b) => thread(0.3 + 0.4 * (b - 0.163) / 0.08, 0), 0.006));
    const sole = [[-0.028, 0.163], [0.06, 0.163], [0.06, 0.171], [-0.028, 0.171]]; add(B.copeDeco, fillPoly(sole, (a, b) => mp(a, b, 0.0032), () => GS.clone().lerp(GD, 0.3), 0.006));
    counts.backShield = { balls: 3, boot: 1 };
  }

  // ================================================================ ERMINE: a white roll 0.025 on the collar, round the back and sides to the front edges
  {
    const te = thE(YC), N = 70, pts = [];
    for (let i = 0; i <= N; i++) pts.push(copeRaw(te + 0.03 + (i / N) * (TAU - 2 * te - 0.06), YC + 0.002, 0.017, false).p);
    const rr = (t) => 0.0165 * (1 + 0.09 * Math.sin(t * 110) + 0.06 * Math.sin(t * 47 + 1.3)) * (0.7 + 0.3 * sstep(0, 0.03, t) * sstep(1, 0.97, t));
    add(B.ermine, sweep(pts, rr, 11, (t, a, n) => BW.clone().lerp(BWS, sstep(0.25, -0.75, n.y) * 0.75).lerp(BWL, 0.3 * sstep(0.5, 0.95, n.y)).lerp(BWD, 0.12 * hs(Math.floor(t * 90) + Math.floor(a * 2), 41)), 280));
    for (const p of [pts[0], pts[N]]) put(B.ermine, new THREE.SphereGeometry(0.0145, 12, 9), new THREE.Matrix4().setPosition(p), (n) => BW.clone().lerp(BWS, sstep(0.2, -0.7, n.y) * 0.7));
    for (let k = 0; k < 14; k++) {   // the black ermine tails
      const t = (k + 0.5) / 14 + 0.02 * (hs(k, 42) - 0.5), i = Math.min(N - 1, Math.floor(t * N)), p = pts[i], th = te + 0.03 + t * (TAU - 2 * te - 0.06), cn = copeRaw(th, YC, 0, false).n;
      const sp = new THREE.SphereGeometry(1, 8, 6); sp.scale(0.0036, 0.0105, 0.0022);
      const q = p.clone().addScaledVector(cn, 0.0145).addScaledVector(V(0, 1, 0), 0.008 + 0.003 * hs(k, 43)), bas = new THREE.Matrix4().makeBasis(V(1, 0, 0), V(0, 1, 0), V(0, 0, 1));
      const Z = cn.clone().multiplyScalar(0.8).add(V(0, 0.6, 0)).normalize(), X = V(0, 1, 0).cross(Z).normalize(), Y = Z.clone().cross(X).normalize(); bas.makeBasis(X, Y, Z).setPosition(q);
      put(B.ink, sp, bas, () => col("#231c1a"));
    }
  }

  // ================================================================ ALB: under the cope, in the front opening, at the cuffs and 3 cm under the hem
  const YTA = 0.40, BASEA = 0.016, FHA = 1.20, YBA = 0.30, YHA = YHEM - 0.0246;
  const ALBF = Array.from({ length: 9 }, (_, i) => ({ th: (i - 4) * 0.17 + 0.02 * (hs(i, 44) - 0.5), a: 0.005 + 0.005 * hs(i, 45), w: 0.1 }));
  const albFold = (th, yl) => { let f = 0; for (const q of ALBF) f += q.a * bump(wrapPi(th - q.th) / q.w); return f * (0.25 + 0.75 * sstep(0.42, 0.0, yl)); };
  const albPt = (th, yl, off = 0) => {
    const ylc = Math.max(yl, YBA), s = surfAt(th, ylc), n = s.normal.clone(); n.y *= 0.4; n.normalize();
    const p = s.pos.clone().addScaledVector(n, BASEA + off + albFold(th, yl));
    if (yl < YBA) { const f = 1 + (FHA - 1) * sstep(0, 1, (YBA - yl) / (YBA - YHA)); p.x *= f; p.z *= f; p.y -= YBA - yl; }
    p.y -= LOC; return { p, n };
  };
  {
    const NU = 140, NV = 36, g = cgrid(NU, NV, (u, v) => { const th = -PI + u * TAU; return albPt(th, lerp(YTA, YHA, v), 0).p; },
      (u, v, n) => { const th = -PI + u * TAU; let sh = 0; const D = 0.02; sh = -(albFold(th + D, 0.1) - albFold(th - D, 0.1)) / (2 * D) * 5; const c = LINEN.clone(); if (sh > 0) c.lerp(LINF, clamp(sh) * 0.9); c.lerp(LINF, 0.1 * v); return c; }, true, true);
    add(B.alb, g);
    // 9 fold lines in the opening (the 3 deepest darker), each wobbled and ending at its own height
    ALBF.forEach((f, k) => {
      const pts = [], nr = []; for (let i = 0; i <= 18; i++) { const t = i / 18, yy = lerp(0.36 - 0.04 * hs(k, 46), YHA + 0.03 + 0.03 * hs(k, 47), t), q = albPt(f.th + 0.012 * Math.sin(t * 4 + k * 1.7), yy, 0.0018); pts.push(q.p); nr.push(q.n); }
      put(B.albDeco, ribbon(pts, nr, 0.0024, 0.2), null, () => (f.a > 0.0088 ? LIND.clone() : LINF.clone()));
    });
    { const pts = Array.from({ length: 100 }, (_, i) => { const th = -PI + (i / 100) * TAU; return albPt(th, YHA + 0.004, 0.003).p; }); put(B.alb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 200, 0.0065, 7, true), null, (n, p, i) => LINEN.clone().lerp(LINF, 0.35 + 0.2 * Math.sin(i * 0.013))); }   // the rolled hem
    // the gold rope round it at y 0.22 (twisted), a knot on his right and 2 tassels 0.12 long
    {
      const pts = Array.from({ length: 80 }, (_, i) => albPt(-PI + (i / 80) * TAU, 0.22, 0.0095).p), len = 2.2;
      add(B.copeGold, sweep(pts, 0.0072, 7, (t, a, n) => { const tw = Math.sin(((t * len) / 0.012 + a / TAU * 2) * TAU); return gold(n, wearAt(Math.floor(t * 70), 12)).lerp(GS, tw > 0.1 ? 0.45 : 0).lerp(GL, tw < -0.7 ? 0.2 : 0); }, 240, true));
      const thK = -thFor(0.105, 0.22), K0 = albPt(thK, 0.22, 0.0125);
      const kM = new THREE.Matrix4().makeBasis(V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)).setPosition(K0.p);
      put(B.copeGold, new THREE.SphereGeometry(0.0125, 14, 10), kM, (n) => gold(n, 0));
      for (const sx of [-1, 1]) { const lg = new THREE.SphereGeometry(0.0095, 12, 9); lg.scale(1.5, 0.8, 0.8); lg.rotateZ(sx * 0.5); put(B.copeGold, lg, new THREE.Matrix4().setPosition(K0.p.clone().add(V(sx * 0.016, 0.004, 0.0025))), (n) => gold(n, 0)); }
      [[-0.014, 0.12, 0.8], [0.012, 0.105, 0.55]].forEach(([dx, L, swing], k) => {   // 2 tassels: a cord, a gold head, a skirt of fine threads
        const a0 = K0.p.clone().add(V(dx, -0.01, 0.006)), cord = [], nr = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6; cord.push(a0.clone().add(V(0.004 * Math.sin(t * 2.4 + k), -t * L * 0.5, 0.004 * t * t))); nr.push(V(0, 0, 1)); }
        add(B.copeGold, sweep(cord, 0.0034, 6, (t, a, n) => gold(n, 0).lerp(GS, 0.2), 14));
        const hp = cord[6].clone().add(V(0, -0.009, 0)); put(B.copeGold, new THREE.SphereGeometry(0.0125, 14, 10), new THREE.Matrix4().setPosition(hp), (n) => gold(n, wearAt(k + 70, 13)));
        const ring = new THREE.TorusGeometry(0.0115, 0.0028, 6, 18); ring.rotateX(PI / 2); put(B.copeGold, ring, new THREE.Matrix4().setPosition(hp.clone().add(V(0, -0.0105, 0))), (n) => gold(n, 0));
        for (let w = 0; w < 18; w++) {   // the skirt: 18 threads hanging 0.05 from under the head
          const al = (w / 18) * TAU, r0 = 0.0105, tp = [], tn = [];
          for (let i = 0; i <= 5; i++) { const t = i / 5; tp.push(hp.clone().add(V(Math.cos(al) * (r0 + 0.006 * t + 0.002 * Math.sin(t * 3 + w)), -0.012 - t * (L * 0.5 - 0.02) * (0.9 + 0.2 * hs(w + k * 20, 48)), Math.sin(al) * (r0 + 0.006 * t))).add(V(0.004 * swing * t * t, 0, 0))); tn.push(V(Math.cos(al), 0, Math.sin(al))); }
          add(B.copeDeco, ribbon(tp, tn, 0.0014, 0.15).toNonIndexed(), null);
          const gg = B.copeDeco.g[B.copeDeco.g.length - 1], cc = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { const c = GB.clone().lerp(GS, 0.25 * hs(w + k * 20, 49)); cc[i] = c.r; cc[i + 1] = c.g; cc[i + 2] = c.b; } gg.setAttribute("color", new THREE.BufferAttribute(cc, 3));
        }
      });
    }
    counts.alb = { foldLines: 9, ropeTassels: 2 };
  }

  // the hang points (the book on its chain at the LEFT hip, the sack on its rope at the RIGHT hip): on the cope's outer face; a gold ring at each
  const hangAt = (hx, hy, hz) => { const th = Math.atan2(hx, hz), q = copeRaw(th, hy, 0.01, true); return q; };
  const HANG = { book: hangAt(0.33, 0.20, 0.12), sack: hangAt(-0.33, 0.20, 0.12) };
  for (const k of ["book", "sack"]) {
    const q = HANG[k], X = V(0, 1, 0).cross(q.n).normalize(), Y = q.n.clone().cross(X).normalize(), M = new THREE.Matrix4().makeBasis(X, Y, q.n).setPosition(q.p);
    const tg = new THREE.TorusGeometry(0.0135, 0.0032, 8, 22); put(B.copeGold, tg, M, (n) => gold(n, 0));
    put(B.copeGold, new THREE.SphereGeometry(0.0075, 10, 8), M.clone().multiplyScalar(1).setPosition(q.p.clone().addScaledVector(q.n, -0.006)), (n) => gold(n, 0));
  }

  // flush the dress's buckets (the cope's and the alb's meshes follow the kneel)
  const clothM = (line) => vmat({ line, rough: 0.92, role: "cloth" });
  { const cm = clothM("#4a0e14"); cm.emissive = col("#6a1620"); cm.emissiveIntensity = 0.7; regDress(flush(B.cope, cm, root)); }
  regDress(flush(B.copeDeco, vmat({ flat: true, rough: 0.8 }), root, false));
  regDress(flush(B.copeGold, vmat({ line: "#5a3c10", rough: 0.4 }), root));
  regDress(flush(B.ermine, whiteMat("#8d8a80", 0.18), root));
  regDress(flush(B.ink, vmat({ flat: true, rough: 1 }), root, false));
  regDress(flush(B.alb, whiteMat("#9a9280", 0.4), root));
  regDress(flush(B.albDeco, whiteFlat(), root, false));
  counts.hang = { book: HANG.book.p.toArray().map((v) => +v.toFixed(3)), sack: HANG.sack.p.toArray().map((v) => +v.toFixed(3)) };

  // ================================================================ GLOVES: a gold quatrefoil 12 mm on the back of each, a gold ring with a red stone over the right middle finger
  for (const s of ["R", "L"]) {
    const hand = ch.arms?.[s]?.hand; if (!hand) continue;
    const gb = bucket(), sc = 1 / (hand.userData.size || 1.3), z = -0.0375, y0 = 0.012;
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + PI / 4, pt = new THREE.SphereGeometry(0.0029, 12, 8); pt.scale(1, 1, 0.42); put(gb, pt, new THREE.Matrix4().setPosition(Math.cos(a) * 0.0027, y0 + Math.sin(a) * 0.0027, z), (n) => gold(V(n.x, n.y, -n.z), 0)); }
    put(gb, new THREE.SphereGeometry(0.0017, 8, 6), new THREE.Matrix4().setPosition(0, y0, z - 0.0007), () => GD.clone().lerp(GS, 0.4));
    void sc;
    const qm = new THREE.Mesh(mergeGeometries(gb.g), vmat({ line: "#5a3c10", rough: 0.4 })); qm.castShadow = true; qm.name = "stnick-quatrefoil"; hand.add(qm);
    if (s === "R") {
      const fb = hand.userData.fingers?.children?.[0];
      if (fb) {
        const rb = bucket(), ring = new THREE.TorusGeometry(0.0188, 0.0033, 8, 22); ring.rotateX(PI / 2); put(rb, ring, new THREE.Matrix4().setPosition(0, 0.0235, 0), (n) => gold(n, 0));
        const set = new THREE.TorusGeometry(0.0052, 0.0016, 8, 16); put(rb, set, new THREE.Matrix4().setPosition(0, 0.0235, -0.0212), (n) => gold(V(n.x, n.y, -n.z), 0));
        const st = new THREE.SphereGeometry(0.0043, 12, 9); st.scale(1, 1, 0.65); put(rb, st, new THREE.Matrix4().setPosition(0, 0.0235, -0.0222), (n) => RUBYS.clone().lerp(RUBY, sstep(-0.3, 0.5, n.y * 0.6 - n.z * 0.5)).lerp(RUBYL, 0.8 * sstep(0.8, 0.95, n.y * 0.55 - n.z * 0.83)));
        const rm = new THREE.Mesh(mergeGeometries(rb.g), vmat({ line: "#5a3c10", rough: 0.35 })); rm.castShadow = true; rm.name = "stnick-ring"; fb.add(rm);
      }
    }
  }
  counts.gloves = { quatrefoils: 2, ring: 1 };

  // ================================================================ SLEEVES (alb, rebuilt when the pose changes): end 0.14 before the hand's centre in a lace edge of 14 scallops
  const TUBE_R = 72, TUBE_N = 26;
  const slM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); slM.userData.lookRole = "cloth"; slM.userData.lineColor = "#9a9280"; slM.emissive = LINEN.clone(); slM.emissiveIntensity = 0.4;
  const cuffM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); cuffM.userData.lookRole = "cloth"; cuffM.userData.lineColor = "#9a9280"; cuffM.emissive = LINEN.clone(); cuffM.emissiveIntensity = 0.4;
  // the lace: 14 scallops hanging from a rolled cuff, an eyelet in each, built in the arm's frame (z along the arm toward the hand)
  const laceGeo = (R) => {
    const NS = 14, NU = NS * 10, NVL = 6, scal = (f) => Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
    const g = cgrid(NU, NVL, (u, v) => { const a = u * TAU, f = (u * NS) % 1, ze = 0.004 + 0.0215 * scal(f), r = R * (1 + 0.1 * v) + 0.0; return V(Math.cos(a) * r, Math.sin(a) * r, 0.0105 + v * ze); },
      (u, v) => { const f = (u * NS) % 1, d = Math.hypot((f - 0.5) * 0.017 * 1.0, (v - 0.5) * 0.02 * 0.9), c = BW.clone().lerp(LINF, 0.35 * v); if (d < 0.0036) c.lerp(LIND, 0.8); if (v > 0.9) c.lerp(LINF, 0.5); return c; }, true);
    const cuff = new THREE.TorusGeometry(R, 0.0075, 8, 40), cc = new Float32Array(cuff.attributes.position.count * 3); for (let i = 0; i < cc.length; i += 3) { const c = LINEN.clone().lerp(LINF, 0.25); cc[i] = c.r; cc[i + 1] = c.g; cc[i + 2] = c.b; }
    cuff.deleteAttribute("uv"); cuff.setAttribute("color", new THREE.BufferAttribute(cc, 3)); cuff.translate(0, 0, 0.0075);
    return mergeGeometries([g, cuff.toNonIndexed()]);
  };
  const sl = {}, lace = {}, key = {};
  for (const s of ["L", "R"]) {
    sl[s] = new THREE.Mesh(new THREE.BufferGeometry(), slM); lace[s] = new THREE.Mesh(laceGeo(0.0605), cuffM);
    for (const m of [sl[s], lace[s]]) { m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); }
  }
  const _t = V(0, 0, 0), _x = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4(), up = V(0, 1, 0), fw = V(0, 0, 1);
  const armTube = (curve, ub, rad, n, n0, seed) => {
    const R = TUBE_R, pos = [], idx = [], cols = [], Nn = n0.clone(), Tn = V(0, 0, 0), Bn = V(0, 0, 0);
    for (let i = 0; i <= n; i++) {
      const w = i / n, u = ub * w, p = curve.getPointAt(u); curve.getTangentAt(u, Tn); Nn.addScaledVector(Tn, -Nn.dot(Tn)).normalize(); Bn.crossVectors(Tn, Nn);
      for (let k = 0; k <= R; k++) {
        const a = (k / R) * TAU, r = rad(w, a); pos.push(p.x + r * (Math.cos(a) * Nn.x + Math.sin(a) * Bn.x), p.y + r * (Math.cos(a) * Nn.y + Math.sin(a) * Bn.y), p.z + r * (Math.cos(a) * Nn.z + Math.sin(a) * Bn.z));
        const c = _c.copy(LINEN); let m = 0;
        for (let j = 0; j < 12; j++) { const aj = ((j + 0.5 + 0.3 * (hs(j + seed, 1) - 0.5)) / 12) * TAU + 0.05 * Math.sin(w * 6 + j), d = Math.abs(wrapPi(a - aj)) * r, hw = 0.002 * (0.8 + 0.4 * hs(j + seed, 2)); m = Math.max(m, 1 - sstep(hw * 0.6, hw * 1.5, d)); }
        c.lerp(LINF, m * (0.6 + 0.25 * w)); c.lerp(LINF, 0.12 * w); cols.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  };
  const buildSleeves = () => {
    for (const s of ["L", "R"]) {
      const Am = ch.arms?.[s]; if (!Am?.shoulder || !Am.elbow || !Am.hand) { sl[s].visible = lace[s].visible = false; continue; }
      const k = [Am.shoulder, Am.elbow, Am.hand.position].map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|") + Am.joint;
      const curve = ch.constructor.armCurve(Am.shoulder, Am.elbow, Am.hand.position, Am.joint), L0 = Math.max(0.05, curve.getLength());
      const to = Math.max(0.34, Math.min(0.94, 1 - 0.14 / L0));
      const T0 = curve.getTangentAt(0.02), wv = sstep(0.75, 0.95, Math.abs(T0.y)), n0 = up.clone().multiplyScalar(1 - wv).addScaledVector(fw, wv);
      if (key[s] !== k) {
        key[s] = k;
        // wide at the shoulder (tucked under the cope: the first 14 % grow from 0.045) to 0.062 at the cuff
        const rad = (t) => (0.082 - 0.02 * Math.pow(t, 0.9)) * (0.55 + 0.45 * sstep(0, 0.14, t)) * (1 + 0.03 * Math.sin(t * 9));
        sl[s].geometry.dispose(); sl[s].geometry = armTube(curve, to, (q) => rad(q), TUBE_N, n0, s === "L" ? 10 : 30); sl[s].visible = true;
      }
      const pe = curve.getPointAt(to), Te = curve.getTangentAt(to).normalize();   // the lace's frame: z along the arm toward the hand
      _x.copy(n0).addScaledVector(Te, -n0.dot(Te)).normalize(); _z.crossVectors(_x, Te).multiplyScalar(-1); _m.makeBasis(_x, Te.clone().cross(_x).negate(), Te);
      lace[s].quaternion.setFromRotationMatrix(_m); lace[s].position.copy(pe); lace[s].visible = true;
    }
  };

  // ================================================================ the kneel: the hem spreads to a pool 1.25 x wider with 7 puddled folds and trails 0.18 behind, lying on the snow
  const PUD = Array.from({ length: 7 }, (_, i) => ({ th: (i / 7) * TAU + 0.5 * (hs(i, 50) - 0.5), w: 0.3 + 0.12 * hs(i, 51), a: 0.7 + 0.6 * hs(i, 52) }));
  let lastKneel = null; const _o = [0, 0, 0];
  const deformDress = (k, L) => {
    for (const d of dress) {
      const R = d.rest, P = d.geo.attributes.position, A = P.array;
      for (const i of d.idx) {
        const x = R[i * 3], y = R[i * 3 + 1], z = R[i * 3 + 2], w = sstep(0.30, -0.14, y);
        if (k <= 0 || w <= 0) { A[i * 3] = x; A[i * 3 + 1] = y; A[i * 3 + 2] = z; continue; }
        const wh = Math.pow(w, 1.2), sp = 1 + 0.25 * k * wh;
        let X = x * sp, Z = z * sp; Z -= 0.18 * k * Math.pow(w, 1.5) * sstep(0.2, -0.35, z);
        const th = Math.atan2(X, Z), rr = Math.hypot(X, Z) || 1; let pf = 0; for (const f of PUD) pf += f.a * bump(wrapPi(th - f.th) / f.w);
        const push = 0.05 * k * w * w * pf; X += (X / rr) * push; Z += (Z / rr) * push;
        const yr = ((((L.target + Z * L.sinP) / L.cosP) - X * L.sinL) / L.cosL) - LOC, lift = Math.max(-0.06, yr - YHEM);
        A[i * 3] = X; A[i * 3 + 1] = y + w * lift + 0.013 * k * w * w * (0.4 + 0.6 * pf); A[i * 3 + 2] = Z;
      }
      P.needsUpdate = true; d.geo.computeVertexNormals(); d.geo.computeBoundingSphere(); d.geo.computeBoundingBox();
    }
  };

  // ================================================================ keys and apply
  const kSmile = keyed(K.smile, 0), kTalk = keyed(K.talk, 0), kGlow = keyed(K.glow, 0), kKneel = keyed(K.kneel, 0);
  const baseApply = out.apply, _gc = new THREE.Color();
  out.apply = (st, t, ...rest) => {
    baseApply && baseApply(st, t, ...rest);
    const nk = st?.nick || {}, smile = clamp(Math.max(kSmile(t), nk.smile || 0)), glow = clamp(Math.max(kGlow(t), nk.glow || 0));
    const speech = clamp(Math.max(st?.expr?.open ?? 0, st?.talk ?? 0, kTalk(t), nk.talk || 0)), ft = st?.ft || { f: 0, s: 0 };
    // moustache: tips up 12 degrees with the smile, 6 with speech; the beard wags 2 with speech and lags the head; the cheeks lift the beard's top
    for (const w of wings) w.grp.rotation.z = w.sd * (12 * DEG * smile + 6 * DEG * speech);
    beard.rotation.x = 2 * DEG * speech; beard.rotation.z = -0.07 * (ft.s || 0); beard.position.y = bPivot.y + 0.008 * smile;
    for (const l of lappets) { l.grp.rotation.z = -0.1 * (ft.s || 0); l.grp.rotation.x = 0.06 * (ft.f || 0); }
    rebuildTufts();
    if (Math.abs(glow - lastGlow) > 1e-4) {   // the book's light on the lowest third of the beard and on the brows
      lastGlow = glow;
      for (const q of glowParts) { const C2 = q.geo.attributes.color, A = C2.array; for (let i = 0; i < q.mask.length; i++) { const m = q.mask[i] * glow; if (m <= 0) { A[i * 3] = q.base[i * 3]; A[i * 3 + 1] = q.base[i * 3 + 1]; A[i * 3 + 2] = q.base[i * 3 + 2]; continue; } A[i * 3] = lerp(q.base[i * 3], Math.min(1, q.base[i * 3] * 0.55 + GLOWC.r * 0.5), m); A[i * 3 + 1] = lerp(q.base[i * 3 + 1], Math.min(1, q.base[i * 3 + 1] * 0.55 + GLOWC.g * 0.5), m); A[i * 3 + 2] = lerp(q.base[i * 3 + 2], Math.min(1, q.base[i * 3 + 2] * 0.5 + GLOWC.b * 0.3), m); } C2.needsUpdate = true; }
    }
    // the kneel follows the rig's: the hem on the snow whatever the body does
    const sc = st?.scale ?? 1, kn = clamp(Math.max(st?.kneel || 0, nk.kneel || 0, kKneel(t))), P = st?.pitch || 0, Ln = st?.lean || 0;
    const kk = [kn.toFixed(4), P.toFixed(4), Ln.toFixed(4), (st?.y ?? 0).toFixed(3), sc.toFixed(3)].join("|");
    if (kk !== lastKneel) { lastKneel = kk; deformDress(kn, { target: (0.016 + 0.1 * kn) / sc, sinP: Math.sin(P), cosP: Math.cos(P), sinL: Math.sin(Ln), cosL: Math.cos(Ln) }); }
    buildSleeves();
  };
  out.hat = null; out.prop = null; out.sitDepth = 0;
  out.hang = { book: HANG.book.p.toArray(), sack: HANG.sack.p.toArray() };   // body-local metres: where the chain of the book and the rope of the sack are fixed (header)
  return out;
}
