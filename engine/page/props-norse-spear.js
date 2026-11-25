import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp } from "./util.js";
import { hash2 } from "./costumes-art-cast.js";

// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section A): ODIN'S SPEAR.
// Metres, x right, y up, +z toward the default camera. Every mark is drawn once from its index and fixed hashes: no Math.random, no clock.
//
// KIND
//   odinspear   Origin: the BUTT'S TIP (y 0), standing up +y; 2.10 long in all; the blade's flat faces look along +-z (the face with M4 + M8
//               toward +z). A prop's `rot` turns it about y; `tilt` / `tip` lean it. Shaft round, 0.034 thick (r 0.017) to 0.028 (r 0.014).
//                 butt cap  y 0..0.05    iron cone #5a5f66, blunt (r 0.006 at the tip), scuffed (6 pale scratches), dried mud #4a3a22
//                 shaft     y 0.05..1.72 ASH WOOD #c9a46a / #8f6f42 / #e6c890: 14 long wobbled grain lines, 3 eye knots (r 0.006) at y 0.52,
//                           1.08, 1.47, 5 nicks (y 0.27, 0.66, 0.83, 1.20, 1.52); darker and glossier #a8834e where hands rubbed it: y 0.95-1.25
//                           and 0.55-0.70
//                 bands (5) SILVER, 2 rims each, at y 0.10 (0.030 high), 0.50 (0.030), 0.92 (0.030), 1.30 (0.035), 1.62 (0.045); between the rims
//                           3 marks 120 degrees apart, 0.02 tall, cut 1.2 mm, filled #3a3f46, in order M4 M6 M8 / M1 M9 M3 / M10 M5 M12 / M2 M7 M11
//                           / M4 M6 M9 (15 marks)
//                 socket    y 1.70..1.84 SILVER 0.040 -> 0.026 across: a twist band of 8 crossings at the base (2 strands, 4 turns, y 1.70-1.745),
//                           2 rivet heads (y 1.78, on +-x), a collar ring on top (y 1.84)
//                 blade     y 1.84..2.10 leaf-shaped, 0.085 wide at 40 % up (y 1.944), 0.009 thick at the rib: steel #c9d0d6, shade #7f8890 (the -x
//                           half of each face), both bevels #ffffff, a raised midrib, 18 faint herringbone chevrons along the core (9 a face, 5 %
//                           contrast, pattern welded), 4 marks (M4 and M8 on the +z face, M6 and M9 on the -z face, 0.040 tall, a chevron pair
//                           between each pair), 2 tiny edge nicks (y 1.985 and 2.030, on the +x edge)
//               spec / state keys (default):
//                 glow   0..1 (0)  fills every cut mark (15 on the bands + 4 on the blade) with RUNE GLOW #f2cf6a, lit from inside (emissive)
//                 glint  0..1 (0)  one highlight sweep up the blade, the foot of the blade at 0, the tip at 1 (at 0 and 1 nothing shows); tween 0 -> 1
//               A prop `set` tweens both. The pure function of the state: any frame in any order.
//
// WHERE A HAND HOLDS IT (ODINSPEAR_GRIPS, in the prop's frame, metres from the butt's tip; the hand closes round the shaft, which is
// 0.031 thick there: a fist with the thumb across, the knuckles +x for the right hand):
//   rest   [0, 1.10, 0]   the gesture "spear at rest": right hand, butt on the floor 0.08 in front of the right boot, hand at world y 1.0
//                         beside the body (he stands the spear a little short of upright; the director's tip decides)
//   point  [0, 0.95, 0]   the gesture "point up": right arm straight, the spear 55 degrees above level
//   low    [0, 0.62, 0]   the second rubbed patch (y 0.55-0.70): the spear carried low, or a hand steadying it
//   top    [0, 1.40, 0]   above the rubbed patch, between the band at 1.30 and the knot at 1.47
//   butt   [0, 0.30, 0]   a hand low on the shaft (leaning on it)
// Not a SIZE entry in storyboards/lib/grips.mjs (the grip library's holds name a prop by `r` and `h`): use an arm pose
// { prop: "<id>", grip: "rest" } and a grip shape "hold".

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);
const col = (h) => new THREE.Color(h);
const gauss = (x, w) => Math.exp(-((x / w) ** 2));
// a (nu+1) x (nv+1) grid of points, closed round in u (the last column meets the first with one normal); skip(i, j) drops a cell;
// ref(centroid) names the way the surface must face: the winding is flipped as a whole when most cells face the other way
function grid(nu, nv, at, closed = true, skip = null, ref = null) {
  const pos = [], idx = [], P3 = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); P3.push(p); }
  let vote = 0;
  const cells = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    if (skip && skip(i, j)) continue; const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; cells.push([a, b, c, d]);
    if (ref) { const A = P3[a], B = P3[b], Cc = P3[c], cen = A.clone().add(B).add(Cc).multiplyScalar(1 / 3), n = B.clone().sub(A).cross(Cc.clone().sub(A)); vote += Math.sign(n.dot(ref(cen))) * Math.min(1, n.length() * 1e4); }
  }
  for (const [a, b, c, d] of cells) { if (vote < 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) {
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}
function strip(pts, nrm, W) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    pos.push(...p.clone().addScaledVector(side, -W).toArray(), ...p.clone().addScaledVector(side, W).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const bucket = () => ({ g: [] });
const _n = V(0, 0, 0), _q = V(0, 0, 0);
function put(b, geo, M, colorFn) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const n = g.attributes.normal, p = g.attributes.position, cols = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { _n.fromBufferAttribute(n, i); _q.fromBufferAttribute(p, i); const c = colorFn(_n, _q, i); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  if (M) g.applyMatrix4(M);
  b.g.push(g);
}
function flush(b, mat, parent, shadow = true) {
  if (!b.g.length) return null;
  const m = new THREE.Mesh(mergeGeometries(b.g), mat); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m;
}
const vmat = (o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: o.rough ?? 0.7, metalness: 0, side: o.side ?? (o.flat ? THREE.DoubleSide : THREE.FrontSide) });
  if (o.line) m.userData.lineColor = o.line;
  if (o.flat) { m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = o.po ?? -2; m.polygonOffsetUnits = o.po ?? -2; }
  m.userData.lookRole = o.role || "cloth";
  return m;
};
const _c = new THREE.Color();
// shading from a normal in the piece's own frame (+y up, +z toward the viewer): shade underneath, light upper left
const shade = (base, sh, li, n, k = 1) => { const a = sstep(-0.55, 0.4, n.y * 0.7 + n.z * 0.4 - n.x * 0.1); _c.copy(sh).lerp(base, a); _c.lerp(li, sstep(0.55, 0.95, n.y * 0.5 + n.z * 0.5 - n.x * 0.35) * 0.55 * k); return _c.clone(); };

// ---- the twelve RUNE MARKS (DESIGN.md), cell 1 wide x 2 high, strokes (x0,y0)-(x1,y1)
const RUNE = {
  1: [[0, 0, 0, 2], [0, 1.0, 0.6, 1.6], [0, 1.45, 0.5, 1.95]],
  2: [[0, 0, 0, 2], [0, 2, 0.7, 1.3], [0.7, 1.3, 0.7, 0]],
  3: [[0, 0, 0, 2], [0, 1.5, 0.5, 1.0], [0.5, 1.0, 0, 0.5]],
  4: [[0, 0, 0, 2], [0, 2, 0.6, 1.45], [0, 1.4, 0.6, 0.85]],
  5: [[0.6, 1.6, 0, 1.0], [0, 1.0, 0.6, 0.4]],
  6: [[0, 0.3, 0.8, 1.7], [0, 1.7, 0.8, 0.3]],
  7: [[0.4, 0, 0.4, 2], [0.1, 1.3, 0.7, 0.8]],
  8: [[0, 0, 0, 2], [0, 2, 0.6, 1.4]],
  9: [[0, 0.4, 0, 1.6], [0.8, 0.4, 0.8, 1.6], [0, 1.6, 0.8, 0.4], [0, 0.4, 0.8, 1.6]],
  10: [[0.4, 0, 0.4, 2], [0.4, 1.4, 0.1, 1.0], [0.1, 1.0, 0.4, 0.6], [0.4, 0.6, 0.7, 1.0], [0.7, 1.0, 0.4, 1.4]],
  11: [[0.4, 1.6, 0, 1.0], [0, 1.0, 0.4, 0.4], [0.4, 0.4, 0.8, 1.0], [0.8, 1.0, 0.4, 1.6]],
  12: [[0, 0, 0, 2], [0, 2, 0.35, 1.65], [0.35, 1.65, 0.7, 2], [0, 0, 0.35, 0.35], [0.35, 0.35, 0.7, 0]],
};
const MARK_W = { 1: 0.6, 2: 0.7, 3: 0.5, 4: 0.6, 5: 0.6, 6: 0.8, 7: 0.7, 8: 0.6, 9: 0.8, 10: 0.7, 11: 0.8, 12: 0.7 };   // cell widths, to centre each mark
const BANDS = [[0.10, 0.030, [4, 6, 8]], [0.50, 0.030, [1, 9, 3]], [0.92, 0.030, [10, 5, 12]], [1.30, 0.035, [2, 7, 11]], [1.62, 0.045, [4, 6, 9]]];

// ---- the shaft's radius: 0.017 at y 0.05 to 0.014 at 1.72, wobbled (a hand-cut ash shaft is never a lathe)
const rS = (y) => lerp(0.017, 0.014, clamp((y - 0.05) / 1.67)) * (1 + 0.022 * Math.sin(y * 11.3 + 0.7) + 0.014 * Math.sin(y * 29 + 2.1) + 0.01 * Math.sin(y * 61));
const ctr = (y) => ({ x: 0.0016 * Math.sin(y * 3.1 + 0.4), z: 0.0014 * Math.sin(y * 2.3 + 1.9) });   // the shaft's very slight bow
const sPt = (y, a, off = 0) => { const r = rS(y) + off, c = ctr(y); return V(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r); };
const sNm = (a) => V(Math.cos(a), 0, Math.sin(a));
// a mark's points on a cylinder of radius R about the x/z centre c(y): stroke lists to ribbons (R is read from `radiusAt`)
function cylStroke(strokes, yc, a0, unit, wCell, radiusAt, off) {
  const out = [];
  for (const [x0, y0, x1, y1] of strokes) {
    const pts = [], nrm = [], N = 6;
    for (let i = 0; i <= N; i++) { const t = i / N, x = lerp(x0, x1, t) - wCell / 2, y = lerp(y0, y1, t) - 1, yy = yc + y * unit, a = a0 + (x * unit) / radiusAt(yy); pts.push(bandPt(yy, a, radiusAt(yy) + off)); nrm.push(sNm(a)); }
    out.push([pts, nrm]);
  }
  return out;
}
const bandPt = (y, a, r) => { const c = ctr(y); return V(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r); };

export function odinspear(P) {
  const S = P.spec, W = P.whole, root = new THREE.Group(); W.add(root);
  const ASH = col("#c9a46a"), ASHS = col("#8f6f42"), ASHL = col("#e6c890"), RUB = col("#a8834e"), RUBS = col("#7a5a30");
  const SIL = col("#b9bfc6"), SILS = col("#6f7780"), SILT = col("#4a5058"), SILL = col("#f2f6fa"), CUT = col("#3a3f46"), GLOW = col("#f2cf6a");
  const IRON = col("#5a5f66"), IRONL = col("#8a9096"), MUD = col("#4a3a22"), STEEL = col("#c9d0d6"), STEELS = col("#7f8890"), WHITE = col("#ffffff");
  const flat = (po = -3) => vmat({ flat: true, rough: 0.9, po });

  // ---------------------------------------------------------------- butt cap (iron cone, blunt, scuffed, dried mud)
  {
    const prof = [[0.0, 0.0], [0.006, 0.0005], [0.0085, 0.006], [0.0125, 0.02], [0.0165, 0.036], [0.0188, 0.047], [0.0195, 0.0505]].map(([r, y]) => new THREE.Vector2(r, y));
    const lat = new THREE.LatheGeometry(prof, 20), b = bucket();
    put(b, lat, null, (n, p) => { const c = shade(IRON, col("#383c42"), col("#7c828a"), n, 0.8), k = hs(Math.floor(p.y * 400) + Math.floor(Math.atan2(p.z, p.x) * 8) * 31, 3); c.lerp(MUD, 0.9 * sstep(0.026, 0.004, p.y) * (0.45 + 0.55 * hs(Math.floor(Math.atan2(p.z, p.x) * 6), 5)) * (k > 0.25 ? 1 : 0.3)); return c; });
    flush(b, vmat({ line: "#1c1e22", rough: 0.55, role: "metal" }), root);
    const sc = bucket();   // 6 pale scuffs
    for (let k = 0; k < 6; k++) { const a = hs(k, 61) * TAU, y0 = 0.012 + 0.03 * hs(k, 62), len = 0.008 + 0.012 * hs(k, 63), pts = [], ns = []; for (let i = 0; i <= 4; i++) { const y = y0 + len * i / 4, r = 0.0085 + (y - 0.006) / 0.044 * 0.011 + 0.0006, aa = a + 0.12 * (hs(k, 64) - 0.5) * i / 4; pts.push(V(Math.cos(aa) * r, y, Math.sin(aa) * r)); ns.push(sNm(aa)); } put(sc, strip(pts, ns, 0.0006), null, () => IRONL.clone()); }
    flush(sc, flat(-3), root, false);
  }

  // ---------------------------------------------------------------- shaft (ASH WOOD)
  const NA = 20, NY = 170, Y0 = 0.05, Y1 = 1.72;
  const grainT = (y, a) => hs(Math.floor(y * 90) * 7 + Math.floor((a / TAU) * 46), 8);
  {
    const geo = grid(NA, NY, (u, v) => sPt(lerp(Y0, Y1, v), u * TAU), true, null, (cen) => V(cen.x, 0, cen.z));
    const b = bucket(); put(b, geo, null, (n, p) => { const a = Math.atan2(p.z, p.x), y = p.y, g = grainT(y, a), c = shade(ASH, ASHS, ASHL, n, 0.7); c.lerp(ASHS, 0.22 * g * g + 0.12 * gauss(Math.sin(a * 7 + y * 1.3), 0.3)); return c; });
    flush(b, vmat({ line: "#4a3418", rough: 0.78, role: "wood" }), root);
    // the rubbed patches: darker and glossier, y 0.55-0.70 and 0.95-1.25, the edges fading into the wood
    const rub = bucket();
    for (const [a0, a1] of [[0.55, 0.70], [0.95, 1.25]]) {
      const n0 = Math.round((a1 - a0) / 0.012);
      const g = grid(NA, n0, (u, v) => { const y = lerp(a0, a1, v); return sPt(y, u * TAU, 0.0007 * sstep(0, 0.2, Math.min(v, 1 - v) * (a1 - a0) / 0.03)); }, true, null, (cen) => V(cen.x, 0, cen.z));
      put(rub, g, null, (n, p) => { const a = Math.atan2(p.z, p.x), c = shade(RUB, RUBS, col("#c29a62"), n, 0.8); c.lerp(RUBS, 0.25 * grainT(p.y, a)); return c; });
    }
    flush(rub, vmat({ line: "#4a3418", rough: 0.28, role: "wood" }), root);
    // 14 long wobbled grain lines, each running most of the shaft, never quite straight
    const gb = bucket();
    for (let k = 0; k < 14; k++) {
      const a0 = (k + 0.4 * (hs(k, 11) - 0.5)) / 14 * TAU, ya = 0.07 + 0.2 * hs(k, 12), yb = 1.70 - 0.3 * hs(k, 13), N = 70, pts = [], ns = [];
      for (let i = 0; i <= N; i++) { const t = i / N, y = lerp(ya, yb, t), a = a0 + 0.13 * Math.sin(y * 2.7 + k * 1.7) + 0.05 * Math.sin(y * 9.1 + k); pts.push(sPt(y, a, 0.0004)); ns.push(sNm(a)); }
      put(gb, strip(pts, ns, 0.00055 + 0.0004 * hs(k, 14)), null, () => ASHS.clone().lerp(col("#6d5030"), 0.45 * hs(k, 15)));
    }
    // 3 eye knots, r 0.006 at y 0.52, 1.08, 1.47: a dark centre and two growth rings, the grain bending round
    [[0.52, 0.9], [1.08, 3.4], [1.47, 5.5]].forEach(([y, a], i) => {
      const ring = (rx, ry, w, c) => { const pts = [], ns = []; for (let j = 0; j <= 20; j++) { const q = j / 20 * TAU, yy = y + Math.sin(q) * ry, aa = a + Math.cos(q) * rx / rS(y); pts.push(sPt(yy, aa, 0.0006)); ns.push(sNm(aa)); } put(gb, strip(pts, ns, w), null, () => c.clone()); };
      ring(0.0095, 0.0145, 0.0004, col("#7a5a34")); ring(0.0072, 0.0105, 0.0005, col("#5e4224")); ring(0.0042, 0.0062, 0.0006, col("#3e2a14"));
      const fan = new THREE.BufferGeometry(), pos = [], idx = []; pos.push(...sPt(y, a, 0.0007).toArray()); for (let j = 0; j <= 14; j++) { const q = j / 14 * TAU, p = sPt(y + Math.sin(q) * 0.006, a + Math.cos(q) * 0.0042 / rS(y), 0.0007); pos.push(...p.toArray()); } for (let j = 1; j <= 14; j++) idx.push(0, j, j + 1);
      fan.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fan.setIndex(idx); fan.computeVertexNormals(); put(gb, fan, null, () => col("#2e1e0c"));
    });
    // 5 nicks: a short cut across the grain with a pale lip above it
    [0.27, 0.66, 0.83, 1.20, 1.52].forEach((y, i) => {
      const a = 0.4 + i * 1.37, pts = [], ns = [], lp = [], ln = []; for (let j = 0; j <= 6; j++) { const aa = a + (j / 6 - 0.5) * 0.55; pts.push(sPt(y + 0.0008 * Math.sin(j * 2), aa, 0.0006)); ns.push(sNm(aa)); lp.push(sPt(y + 0.004, aa, 0.0006)); ln.push(sNm(aa)); }
      put(gb, strip(pts, ns, 0.0015), null, () => col("#3a2a14")); put(gb, strip(lp, ln, 0.0007), null, () => ASHL.clone());
    });
    flush(gb, flat(-3), root, false);
  }

  // ---------------------------------------------------------------- the marks' one material (cut #3a3f46; `glow` turns it RUNE GLOW and lights it)
  const marksM = new THREE.MeshStandardMaterial({ color: CUT, roughness: 0.8, emissive: new THREE.Color("#000000"), side: THREE.DoubleSide });
  marksM.userData.noOutline = true; marksM.polygonOffset = true; marksM.polygonOffsetFactor = -5; marksM.polygonOffsetUnits = -5; marksM.userData.noHatch = true;
  const markB = bucket(); let nMarks = 0;

  // ---------------------------------------------------------------- 5 silver bands, 2 rims each, 3 marks 120 degrees apart (15 marks)
  {
    const bb = bucket(), rb = bucket();
    BANDS.forEach(([yc, h, marks], bi) => {
      const rB = (y) => rS(y) + 0.0016, y0 = yc - h / 2, y1 = yc + h / 2;
      const geo = grid(NA, 6, (u, v) => { const y = lerp(y0, y1, v), c = ctr(y), r = rB(y) + 0.0002 * Math.sin(v * Math.PI); return V(c.x + Math.cos(u * TAU) * r, y, c.z + Math.sin(u * TAU) * r); }, true, null, (cen) => V(cen.x, 0, cen.z));
      put(bb, geo, null, (n, p) => { const c = shade(SIL, SILS, SILL, n, 1.1), e = Math.min(p.y - y0, y1 - p.y) / h; c.lerp(SILT, 0.35 * sstep(0.22, 0.0, e) + 0.1 * hs(Math.floor(Math.atan2(p.z, p.x) * 5) + bi * 9, 4)); return c; });
      for (const sg of [-1, 1]) { const y = yc + sg * (h / 2 - 0.0009), c = ctr(y), t = new THREE.TorusGeometry(rB(y) + 0.0005, 0.0013, 6, 28); t.rotateX(Math.PI / 2); t.translate(c.x, y, c.z); put(rb, t, null, (n) => shade(SIL, SILS, SILL, n, 1.2).lerp(SILT, 0.15 * hs(bi * 2 + (sg > 0), 6))); }
      marks.forEach((m, k) => {
        const a0 = Math.PI / 2 - 1.15 + bi * 0.37 + k * TAU / 3, unit = 0.01;
        for (const [pts, nrm] of cylStroke(RUNE[m], yc, a0, unit, MARK_W[m], rB, 0.0003)) put(markB, strip(pts, nrm, 0.0006), null, () => col("#ffffff"));
        nMarks++;
      });
    });
    flush(bb, vmat({ line: "#2e3338", rough: 0.32, role: "metal" }), root); flush(rb, vmat({ line: "#2e3338", rough: 0.3, role: "metal" }), root);
  }

  // ---------------------------------------------------------------- socket (y 1.70..1.84): twist band, 2 rivets, collar
  const sockR = (y) => lerp(0.0205, 0.013, Math.pow(clamp((y - 1.70) / 0.14), 0.85)) + 0.0006 * Math.sin((y - 1.70) / 0.14 * Math.PI);
  {
    const sb = bucket(), geo = grid(NA, 10, (u, v) => { const y = lerp(1.70, 1.84, v), c = ctr(y), r = sockR(y); return V(c.x + Math.cos(u * TAU) * r, y, c.z + Math.sin(u * TAU) * r); }, true, null, (cen) => V(cen.x, 0, cen.z));
    put(sb, geo, null, (n, p) => shade(SIL, SILS, SILL, n, 1.1).lerp(SILT, 0.25 * sstep(1.76, 1.70, p.y) * hs(Math.floor(Math.atan2(p.z, p.x) * 4), 7)));
    // the twist band: 2 strands, 4 turns each, going round opposite ways: 8 crossings, alternately over and under
    for (const sg of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 64; i++) { const t = i / 64, y = 1.70 + 0.045 * t, a = sg * 4 * TAU * t + (sg > 0 ? Math.PI : 0), r = sockR(y) + 0.0013 + 0.0008 * sg * Math.sin(TAU * 4 * t), c = ctr(y); pts.push(V(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r)); }
      put(sb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.0017, 6), null, (n) => shade(SIL, SILS, SILL, n, 1.3));
    }
    // two rivet heads on the +x and -x sides, each a domed disc with a ring
    for (const sg of [-1, 1]) { const y = 1.78, r = sockR(y), c = ctr(y), s = new THREE.SphereGeometry(0.0034, 10, 6); s.scale(0.6, 1, 1); s.translate(c.x + sg * (r + 0.0004), y, c.z); put(sb, s, null, (n) => shade(SIL, SILS, SILL, n, 1.4)); const t = new THREE.TorusGeometry(0.0042, 0.0007, 5, 14); t.rotateY(Math.PI / 2); t.translate(c.x + sg * (r + 0.0002), y, c.z); put(sb, t, null, () => SILS.clone()); }
    const cl = new THREE.TorusGeometry(0.0142, 0.0028, 7, 28); cl.rotateX(Math.PI / 2); cl.translate(ctr(1.836).x, 1.836, ctr(1.836).z); put(sb, cl, null, (n) => shade(SIL, SILS, SILL, n, 1.3));
    const cl2 = new THREE.TorusGeometry(0.0128, 0.0013, 5, 28); cl2.rotateX(Math.PI / 2); cl2.translate(ctr(1.7).x, 1.7, ctr(1.7).z); put(sb, cl2, null, () => SILS.clone());
    flush(sb, vmat({ line: "#2e3338", rough: 0.32, role: "metal" }), root);
  }

  // ---------------------------------------------------------------- blade (y 1.84..2.10)
  const BY0 = 1.84, BL = 0.26, c0 = ctr(1.84), nick = [[0.558, 1], [0.731, 1]];
  const bw = (v, sg) => { const s = v / 0.4, w = v < 0.4 ? 0.0135 + 0.029 * Math.pow(Math.sin(s * Math.PI / 2), 0.85) : 0.0425 * Math.pow(Math.cos(clamp((v - 0.4) / 0.6) * Math.PI / 2), 0.8); let e = w; if (sg > 0) for (const [vn] of nick) e -= 0.0023 * gauss((v - vn) / 0.011, 1) * (v > 0.05 ? 1 : 0); return Math.max(0.0004, e); };
  const bh = (u, v) => { const au = Math.abs(u), T = 0.0045 * (1 - 0.3 * v * v) * (1 - Math.pow(v, 6)); return T * (0.40 + 0.60 * gauss(au, 0.17)) * (1 - sstep(0.62, 1, au) * (0.97)) ; };
  const bPt = (f, u, v, lift = 0) => V(c0.x + u * bw(v, u > 0 ? 1 : -1), BY0 + v * BL, c0.z + f * (bh(u, v) + lift));
  const blade = {};
  for (const f of [1, -1]) {
    const geo = grid(32, 44, (a, b) => bPt(f, a * 2 - 1, b), false, null, () => V(0, 0, f)), bb = bucket();
    put(bb, geo, null, (n, p) => { const u = (p.x - c0.x) / Math.max(0.004, bw(clamp((p.y - BY0) / BL), p.x > c0.x ? 1 : -1)) * 1, au = Math.abs(u), c = STEEL.clone(); if (u < 0) c.lerp(STEELS, 0.55 * sstep(0, -0.3, u) + 0.15); c.lerp(WHITE, 0.95 * sstep(0.78, 0.86, au)); c.lerp(WHITE, 0.25 * gauss(au, 0.07)); return c; });
    blade[f] = bb;
    const chev = bucket();
    // 9 faint herringbone chevrons along the core (5 % contrast), the point toward the tip
    const CH = [0.06, 0.115, 0.385, 0.445, 0.69, 0.735, 0.78, 0.825, 0.87];
    for (const v of CH) {
      const a = 0.62 * bw(v, 1), pts = [], ns = [];
      for (let i = -6; i <= 6; i++) { const q = i / 6, x = q * a, vy = v - 0.17 * (Math.abs(q) * a) / 0.0425 * 0.5, p = bPt(f, x / bw(vy, x > 0 ? 1 : -1), vy, 0.0004); pts.push(p); ns.push(V(0, 0, f)); }
      put(chev, strip(pts, ns, 0.0011), null, () => STEEL.clone().multiplyScalar(0.95));
    }
    flush(chev, flat(-3), root, false);
    // the 2 marks a face: +z M4 and M8, -z M6 and M9, 0.040 tall (unit 0.02), cut 6 % of that
    const ms = f > 0 ? [[4, 0.25], [8, 0.575]] : [[6, 0.25], [9, 0.575]];
    for (const [m, vc] of ms) for (const [x0, y0, x1, y1] of RUNE[m]) {
      const pts = [], ns = []; for (let i = 0; i <= 8; i++) { const t = i / 8, x = (lerp(x0, x1, t) - MARK_W[m] / 2) * 0.02, vy = vc + (lerp(y0, y1, t) - 1) * 0.02 / BL, uu = x / bw(vy, x > 0 ? 1 : -1); pts.push(bPt(f, clamp(uu, -0.9, 0.9), vy, 0.0004)); ns.push(V(0, 0, f)); }
      put(markB, strip(pts, ns, 0.0012), null, () => col("#ffffff")); 
    }
    nMarks += 2;
  }
  flush(blade[1], vmat({ line: "#3a4048", rough: 0.28, role: "metal" }), root); flush(blade[-1], vmat({ line: "#3a4048", rough: 0.28, role: "metal" }), root);
  flush(markB, marksM, root, false);
  // the raised midrib's two edges: a thin line of light down each side, a lighter edge line at both bevels' feet
  {
    const lb = bucket();
    for (const f of [1, -1]) for (const u of [-0.12, 0.12, -0.86, 0.86]) { const pts = [], ns = []; for (let i = 0; i <= 20; i++) { const v = 0.03 + 0.9 * i / 20; pts.push(bPt(f, u, v, 0.0003)); ns.push(V(0, 0, f)); } put(lb, strip(pts, ns, Math.abs(u) > 0.5 ? 0.0004 : 0.0003), null, () => (Math.abs(u) > 0.5 ? WHITE.clone() : STEELS.clone().lerp(STEEL, 0.4))); }
    flush(lb, flat(-3), root, false);
  }
  // the glint: a soft diagonal highlight sweeping up the blade, additive, recoloured per frame from the state (never a tweened opacity)
  const glintG = [1, -1].map((f) => { const g = grid(16, 30, (a, b) => bPt(f, a * 2 - 1, b, 0.0007), false, null, () => V(0, 0, f)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); return g; });
  const glintM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); glintM.userData.noOutline = true; glintM.userData.noHatch = true;
  const glintMesh = glintG.map((g) => { const m = new THREE.Mesh(g, glintM); m.castShadow = false; m.renderOrder = 6; m.frustumCulled = false; root.add(m); return m; });
  root.userData.counts = { marks: nMarks, bands: BANDS.length };
  let lastGl = -1;
  return {
    grip: 1.10,
    apply(ps) {
      const gl = clamp(ps.glow ?? S.glow ?? 0), g = clamp(ps.glint ?? S.glint ?? 0);
      marksM.color.copy(CUT).lerp(GLOW, gl); marksM.emissive.copy(GLOW).multiplyScalar(0.85 * gl);
      const on = g > 0.001 && g < 0.999; for (const m of glintMesh) m.visible = on;
      if (on && g !== lastGl) {
        lastGl = g; const cv = lerp(-0.12, 1.12, g);
        for (const geo of glintG) { const p = geo.attributes.position, c = geo.attributes.color; for (let i = 0; i < p.count; i++) { const v = clamp((p.getY(i) - BY0) / BL), u = (p.getX(i) - c0.x) / Math.max(0.004, bw(v, p.getX(i) > c0.x ? 1 : -1)), s = v + 0.22 * u - cv, I = 0.9 * gauss(s, 0.07) * (1 - 0.5 * Math.abs(u)); c.setXYZ(i, I, I, I * 0.95); } c.needsUpdate = true; }
      }
    },
  };
}

export const NORSE_SPEAR_KINDS = { odinspear };
// hand points in the prop's own frame (metres from the butt's tip, before rot and scale), for arm poses { prop, grip: "name" }
export const NORSE_SPEAR_GRIPS = {
  odinspear: { rest: [0, 1.10, 0], point: [0, 0.95, 0], low: [0, 0.62, 0], top: [0, 1.40, 0], butt: [0, 0.30, 0] },
};
export const NORSE_SPEAR_STATE = { odinspear: { glow: 0, glint: 0 } };
