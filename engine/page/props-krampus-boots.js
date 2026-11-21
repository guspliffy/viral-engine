// Krampus myth 01 "One night a year he checks your boots" (storyboards/series/krampus-myth/01-boots/DESIGN.md section E): the BOOTS, the two CRAYON
// DRAWINGS with their clothes pegs, the TREATS and the bunch of STICKS. Metres, x right, y up, z toward the default camera; a prop faces +z at rot 0.
// A pure function of spec, state and t: every mark is drawn once from its index (canvas textures in metres, fibres, stitches, mud patches, dashes),
// no Math.random, no clock. PICTURES ONLY: no letters or digits anywhere. Bench: storyboards/series/krampus-myth/01-boots/bench/ (boots-sheet.png).
//
// KINDS
//   kboot     A boot. Origin: the ground under the HEEL's middle (the sole's bottom is y 0), toe toward +z (rot -35 turns the toe to the left
//             of the camera and brings the peg's side, 35 degrees round from the toe toward +x, to face +z). Spec keys (default):
//               style   "felt" (default) | "leather" | "suede" | "rubber" | "furtrim"
//               who     felt only: "spud" (default) teal felt 0.30 tall, sole 0.24 x 0.105 x 0.022, shaft 0.125 / 0.135 across | "chip" yellow felt 0.26 (0.867 of
//                       Spud's, the same making) with a cream cord tied in a bow (2 ends of 0.05) and a red stripe round the sole edge. `tone: "yellow"` = who "chip".
//               color   a hex or a name (moss orange sky violet red brown pale green cream plum white teal yellow): the lane boots of the house table. On "felt" it
//                       makes a lane felt boot (the felt making, no cord, no stripe, no elbow patch); rubber and furtrim take it too
//               h       the boot's height in metres (the house table's numbers); the whole boot scales to it. Defaults: felt spud 0.30, chip 0.26 (lane felt 0.24),
//                       leather 0.25 (door 8), suede 0.20 (door 9), rubber 0.28, furtrim 0.18
//               dots    felt: that many white dots round the shaft (house 6: 9)
//               mud     0..1 (0; the yellow boot 1 from frame 0 until 16.5 s). SEED spec.mud on a boot that will be wiped: only then do its 12 crumbs exist
//               shine   0..1 (0; leather: 1 from its first frame unless spec.shine is given)
//               glint   0..1 (0) one white streak crosses the shaft (tween 0 -> 1 in 6 frames, 20.0 s)
//               droop   0..1 (0) felt: the shaft folds forward over the ankle by 70 degrees (panel 12)
//               sticks  0..1 (0) the bunch of 7 in the mouth; tween 0 -> 1 over 4 frames: it drops in, 3 degrees of shake, 2 bark curls fall to the step
//               treats  0..1 (0) the heap of 14 (7 coins, 3 mandarins, 4 walnuts) rising 0.07 above the cuff, the pieces arriving in index order (a fall each)
//               shade   0..1 (0) the boot under his shadow: 45 % darker and cooler
//             The shape (felt): TEAL / YELLOW felt 12 mm thick, a rolled cuff 0.035, 220 fibre strokes of 3-8 mm and 30 pilling dots, a blanket-stitch seam of 38 stitches
//             (19 up the back, 19 round the vamp, cream wool #efe6cf 6 mm long, 9 mm pitch), a leather heel patch with 8 stitches, a pull loop, a welt of 44 stitches on a
//             dark sole #2a3a44, cream fleece at the cuff (16 tufts), Spud's leather elbow patch #9a6a3c with 10 stitches on its left side (-x). Leather: raspberry #b0244c
//             lace-up, 7 pairs of brass eyelets, cream laces in a double bow, a tongue, a toe cap with 9 punched dots, a stacked heel, a welt of 40 stitches, a white
//             cable-knit sock cuff of 12 ribs. Suede: red #b8322e, a white fleece cuff 0.04 (22 tufts), a paler scuff on the toe, 2 white pompoms r 0.018 on cords.
//             Rubber: glossy, a moulded sole, a pull tab; furtrim: suede with a fleece roll; both with 3 snowflakes melted to dark dots on the toe.
//             Felt is matte (roughness 1): a fine grain of short flecks, the 220 strokes at about 28 % contrast, and a fuzz shell of tiny tufts 1.6 mm off the felt (gone when polished).
//             Mud: 9 smears (3 wet): brown-grey #7a674c, a dry pale feathered halo, a wet dark core, a thicker lobe dragged toward the toe or up from the sole, cracks, 3 clumps,
//             grit, and a thicker wash running down to the sole; 16 splash dots with tails up to mid shaft, a 6 mm crust round the sole rim, 2 straws, 1 leaf; going down the
//             smears shrink from their edges, toe first; 12 crumbs fall to the step and stay. Shine (a MIRROR): the nap lies flat (fibres and fuzz fade), colour deeper (+22 %
//             saturation, 13 % darker), roughness 0.2, the nearest lantern mirrored with its glow (0.042 x 0.064 on the shaft, 0.022 x 0.032 on the toe), a window highlight
//             0.040 x 0.024 on the toe cap, a streak 0.13 long, a horizon line with the dark floor mirrored under it, a rim light down each edge (cool right, warm left), a bright
//             line on the cuff roll: the SAME shapes on every polished boot, the raspberry leather included.
//             The sticks stand in the boot's own mouth: their twine is 0.06 above the cuff, the butts 0.30 below it (E's numbers; B's bunch has its twine 0.10 from the butt:
//             the swap happens on one frame, nobody sees it), tips 0.26 above the cuff; birch bark with 5-8 dashes a stick, the outer third forks once into dark twigs with
//             2 buds, 3 bark curls on the bunch. Hands: GRIPS heel, toe, toecap, shaftBack, shaftFront, shaftLeft, shaftRight, cuff, sole (metres, for the yellow felt boot 0.26;
//             they scale with spec.scale, not with `h`). For a fist round the shaft use SIZE kboot { r: 0.05, h: 0.26 } with the mug hold (see the proof sheet).
//   bootnote  One crayon drawing and its clothes peg, ONE held thing. Origin: the PEG'S TOP (the grip; the jaws close at y -0.072..-0.048, the paper hangs from y -0.052,
//             8 degrees off plumb, plane z 0, faces +z). Clip it on: stand the origin 0.045 above the cuff, 0.095 x (boot scale) out from the boot's axis on the side 35
//             degrees round from the toe, rot = the boot's rot + 35 (see noteAt in bench/make-boots-bench.mjs). Spec: who "spud" (default; TEAL PAPER portrait 0.150 x 0.200,
//             a tall egg with ONE big leaf, dark teal knit sweater, stick arms down, green ground, a white cloud) | "chip" (YELLOW PAPER landscape 0.185 x 0.165 with a dog-ear
//             0.028 at the lower right, a round ball with TWO leaves, orange hood with 2 white drawstrings, stick arms up, a red D grin, white trainers). State keys:
//             flutter (0.1) the lower edge lifts up to 10 degrees at 1.3 Hz (1 while he is next door); swing (0) 8 degrees decaying over the director's 0.5 s tween 1 -> 0;
//             kink (0) 1 = the lower 0.045 kinks 15 degrees outward (the teal paper on the yellow boot). Papers carry their own colour (90 % self-light, the paper material
//             is cooled for teal) so teal and yellow stay 118 degrees of hue apart as seen. Fibre flecks 40, a fold line across the middle, the lower edge curling 6 mm.
//             GRIPS top, peg, spring, paper.
//   ktreat    One treat, lying on its bottom (origin = the bottom centre). Spec type "coin" (default; 0.048 across x 0.007, foil #f2c64a with 40 milled notches, an
//             embossed pine tree or star-flower: spec n picks, coins n 0,2,3,5 of 7 are pines) | "mandarin" (0.058 x 0.050, 40 pores, a green star calyx, spec stem true keeps its
//             stem and leaf) | "walnut" (0.036 x 0.030, a seam and 12 wrinkle lines). Coin state: peel 0..1 (0) the foil opens in 5 petals on chocolate #4a2a1a;
//             bite 0..1 (0) an arc with 3 tooth scallops. A physics body is the engine's business; hide it below the cuff with scale 0.
// KRAMPUS_BOOTS_STATE lists the keys that tween (a "prop" action). Seed mud / shine / treats ... with a dur-0 set before the first tween if they are not in the spec.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp } from "./util.js";

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const sg = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...o });
const decal = (tex, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const thread = (c) => { const m = mat(c, { roughness: 0.95 }); m.userData.noOutline = true; return m; };
const mix = (a, b, k) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), k); return `#${c.getHexString()}`; };
function curve(pts) {   // cubic Hermite through [x, y] points
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    let i = 1; while (pts[i][0] < x) i++;
    const p0 = pts[i - 1], p1 = pts[i], pm = pts[i - 2] || p0, pn = pts[i + 1] || p1, h = p1[0] - p0[0], t = (x - p0[0]) / h;
    const m0 = ((p1[1] - pm[1]) / (p1[0] - pm[0])) * h, m1 = ((pn[1] - p0[1]) / (pn[0] - p0[0])) * h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p0[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1[1] + (t3 - t2) * m1;
  };
}
const shadowy = (o) => { o.castShadow = o.receiveShadow = true; return o; };
const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = shadowy(new THREE.Mesh(g, m)); o.position.set(x, y, z); if (parent) parent.add(o); return o; };

// ============================================================================================================ THE FELT BOOT
// Baseline = Spud's teal felt boot (DESIGN E): the sole 0.24 x 0.105 x 0.022 from z -0.055 (heel back) to +0.185 (toe tip), the shaft a superellipse
// tube round the axis (x 0, z 0.01) 0.125 across the ankle (y 0.11) opening to 0.135 at the cuff (y 0.30), the vamp a lofted dome 0.075 high at the toe box.
// Every other style is this model scaled per axis (K) and dressed differently. Marks are drawn in canvas textures in metres: 1 m = PXM px.
const G = { zb: -0.055, zf: 0.185, wS: 0.0525, wF: 0.0485, th: 0.022, z0: 0.01, rxA: 0.0505, rzA: 0.0625, rxC: 0.0675, rzC: 0.0675, yA: 0.11, H: 0.30, n: 2.5, nF: 2.4, wall: 0.012, rollR: 0.0172 };
const PXM = 2200, RM = 0.0625, SW = 900, SH = Math.round(G.H * PXM), FW = 380, FH = Math.round((G.zf - G.zb) * PXM);
const Tcurve = curve([[-0.055, 0.07], [-0.02, 0.12], [0.03, 0.126], [0.0725, 0.12], [0.10, 0.097], [0.14, 0.076], [0.165, 0.066], [0.185, 0.060]]);
function shaftR(y) { const u = clamp((y - G.yA) / (G.H - G.yA)), e = Math.pow(u, 0.9); return { rx: lerp(G.rxA, G.rxC, e), rz: lerp(G.rzA, G.rzC, e), zc: G.z0 }; }
// a point on the shaft: beta from the back (0) round through +x (pi/2) to the front (pi); returns [x, y, z, nx, nz]
function shaftPt(beta, y, off = 0, k = 1) {
  const r = shaftR(y), n = G.n, dx = Math.sin(beta), dz = -Math.cos(beta);
  const px = r.rx * sg(dx, 2 / n), pz = r.rz * sg(dz, 2 / n);
  let nx = sg(px / r.rx, n - 1) / r.rx, nz = sg(pz / r.rz, n - 1) / r.rz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
  return [px * k + nx * off, y, r.zc + pz * k + nz * off, nx, nz];
}
function footRing(z) {
  const zb = G.zb + 0.004, zf = G.zf - 0.004, cH = 0.035, cT = 0.06; let f = 1;
  if (z < zb + cH) f = Math.pow(Math.max(0, 1 - Math.pow((zb + cH - z) / cH, 2.2)), 1 / 2.2);
  else if (z > zf - cT) f = Math.pow(Math.max(0, 1 - Math.pow((z - (zf - cT)) / cT, 2.2)), 1 / 2.2);
  const yb = G.th - 0.002, Tz = Tcurve(z);
  return { w: G.wF * f, T: yb + (Tz - yb) * Math.pow(f, 0.7), yb };
}
function footTop(x, z) { const r = footRing(z), q = Math.min(1, Math.abs(x) / Math.max(r.w, 1e-5)); return r.yb + (r.T - r.yb) * Math.pow(Math.max(0, 1 - Math.pow(q, G.nF)), 1 / G.nF); }
function footNormal(x, z) {
  const e = 0.0015, dx = (footTop(x + e, z) - footTop(x - e, z)) / (2 * e), dz = (footTop(x, z + e) - footTop(x, z - e)) / (2 * e);
  return new THREE.Vector3(-dx, 1, -dz).normalize();
}
const footPx = (x, z) => { const r = footRing(z), w = Math.max(r.w, 1e-4), c = clamp(sg(x / w, G.nF / 2), -1, 1); return [(1 - Math.acos(c) / Math.PI) * FW, (1 - (z - G.zb) / (G.zf - G.zb)) * FH]; };
const shaftPx = (s, y) => [(((Math.PI - s / RM) / TAU) % 1 + 1) % 1 * SW, (1 - y / G.H) * SH];

// ---- geometry: a lofted grid
function loft(NU, NV, fn, test = null) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const q = fn(i, j); pos.push(...q.p); uv.push(...q.uv); }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (test) {   // test: [vertex index, [dx, dy, dz]] the direction its normal must face; flip the winding if not
    const n = g.attributes.normal, k = test[0], d = test[1];
    if (n.getX(k) * d[0] + n.getY(k) * d[1] + n.getZ(k) * d[2] < 0) { const ix = g.index.array; for (let q = 0; q < ix.length; q += 3) { const t = ix[q + 1]; ix[q + 1] = ix[q + 2]; ix[q + 2] = t; } g.index.needsUpdate = true; g.computeVertexNormals(); }
  }
  return g;
}
function offsetGeo(g, off) { const o = g.clone(), p = o.attributes.position, n = o.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * off, p.getY(i) + n.getY(i) * off, p.getZ(i) + n.getZ(i) * off); return o; }
const NSU = 72, NSV = 34, NFU = 40, NFZ = 44;
const YTOP = G.H - 0.0175;   // the shaft wall ends where the cuff roll's centre is
function shaftGeo(inner = false, k = 1) {
  const y0 = inner ? G.th + 0.04 : G.th, off = inner ? -G.wall : 0;
  return loft(NSU, NSV, (i, j) => { const b = TAU * i / NSU, y = lerp(y0, YTOP, j / NSV), p = shaftPt(b, y, off, 1); return { p: [p[0], p[1], p[2]], uv: [i / NSU, y / G.H] }; }, [Math.floor(NSV / 2) * (NSU + 1) + NSU / 4, inner ? [-1, 0, 0] : [1, 0, 0]]);
}
function footGeo() {
  const zb = G.zb + 0.004, zf = G.zf - 0.004;
  return loft(NFU, NFZ, (i, j) => {
    const z = zb + (zf - zb) * (0.5 - 0.5 * Math.cos(Math.PI * j / NFZ)), r = footRing(z), a = Math.PI * (1 - i / NFU);
    return { p: [r.w * sg(Math.cos(a), 2 / G.nF), r.yb + (r.T - r.yb) * sg(Math.sin(a), 2 / G.nF), z], uv: [i / NFU, (z - G.zb) / (G.zf - G.zb)] };
  }, [Math.floor(NFZ / 2) * (NFU + 1) + NFU / 2, [0, 1, 0]]);
}
// the cuff roll: a tube of radius rollR swept round the cuff, its centre 3.5 mm out of the shaft surface
function rollGeo(rad = G.rollR, extra = 0, yOff = 0) {
  const NA = 18, Hc = G.H - G.rollR;
  return loft(NSU, NA, (i, j) => {
    const b = TAU * i / NSU, a = TAU * j / NA, p = shaftPt(b, Hc, 0.0035), ca = Math.cos(a), sa = Math.sin(a), rt = rad + extra;
    return { p: [p[0] + p[3] * rt * ca, Hc + yOff + rt * sa, p[2] + p[4] * rt * ca], uv: [i / NSU, j / NA] };
  }, [NSU / 4, [1, 0, 0]]);
}
// the dark floor of the hollow (the inside is lined 12 mm in)
function floorGeo() {
  const y = G.th + 0.04, pos = [0, y, G.z0], idx = [], nrm = [0, 1, 0];
  for (let i = 0; i <= NSU; i++) { const p = shaftPt(TAU * i / NSU, y, -G.wall); pos.push(p[0], y, p[2]); nrm.push(0, 1, 0); if (i < NSU) idx.push(0, i + 2, i + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx); return g;
}
// the sole: a slab from the plan outline (half width wS), y 0..th
function planPts(n = 120, grow = 0) {   // [x, z] round the sole's plan, from the toe tip anticlockwise seen from above
  const pts = [], zb = G.zb, zf = G.zf, cH = 0.045, cT = 0.075;
  const half = (z) => { let f = 1; if (z < zb + cH) f = Math.pow(Math.max(0, 1 - Math.pow((zb + cH - z) / cH, 2.2)), 1 / 2.2); else if (z > zf - cT) f = Math.pow(Math.max(0, 1 - Math.pow((z - (zf - cT)) / cT, 2.2)), 1 / 2.2); return (G.wS + grow) * f; };
  const m = Math.floor(n / 2);
  for (let i = 0; i <= m; i++) { const z = zf - (zf - zb) * (0.5 - 0.5 * Math.cos(Math.PI * i / m)); pts.push([-half(z), z]); }   // the left side, toe to heel
  for (let i = 1; i < m; i++) { const z = zb + (zf - zb) * (0.5 - 0.5 * Math.cos(Math.PI * i / m)); pts.push([half(z), z]); }   // the right side, heel to toe
  return pts;
}
function soleGeo(y0, y1, grow = 0) {
  const pts = planPts(120, grow), s = new THREE.Shape(); pts.forEach(([x, z], i) => s[i ? "lineTo" : "moveTo"](x, -z)); s.closePath();
  const bt = 0.0016, g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, y1 - y0 - 2 * bt), bevelEnabled: true, bevelSize: bt, bevelThickness: bt, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, y0 + bt, 0); return g;
}
// equal-arc walk along a polyline: n points with their tangents
function walk(pts, n, closed = true, start = 0) {
  const seg = [], L = []; let tot = 0; const m = pts.length;
  for (let i = 0; i < (closed ? m : m - 1); i++) { const a = pts[i], b = pts[(i + 1) % m], d = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push(d); L.push(tot); tot += d; }
  const out = [];
  for (let k = 0; k < n; k++) {
    let q = ((start + k / (closed ? n : Math.max(1, n - 1))) % 1) * tot, i = 0; while (i < seg.length - 1 && L[i] + seg[i] < q) i++;
    const a = pts[i], b = pts[(i + 1) % m], f = seg[i] ? (q - L[i]) / seg[i] : 0, dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
    out.push({ p: [a[0] + dx * f, a[1] + dz * f], t: [dx / dl, dz / dl], q: q / tot });
  }
  return { pts: out, len: tot };
}
// a small cylinder from a to b (Vector3) as geometry
function capsule(a, b, r, seg = 5) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(), g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.applyQuaternion(q); const c = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5); g.translate(c.x, c.y, c.z); return g;
}
function tubeThrough(pts, r, seg = 40, rad = 6, closed = false) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, "catmullrom", 0.5), seg, r, rad, closed); }

// ---- marks: every mark is drawn once from its index (canvas textures in metres, cached per look)
const cacheT = new Map();
const memo = (key, fn) => { if (!cacheT.has(key)) cacheT.set(key, fn()); return cacheT.get(key); };
const SEEDS = { shaft: 3.1, foot: 7.7 };
function rrectPts(cx, cy, w, h, r, n = 8) {   // a rounded rectangle, closed polygon (px)
  const pts = [], c = [[cx + w / 2 - r, cy - h / 2 + r, -90], [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180]];
  for (const [x, y, a0] of c) for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * DEG; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  return pts;
}
const polyPath = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.closePath(); };
// a leather patch with n cream stitches round its edge (px), centred at cx, cy
function drawPatch(g, cx, cy, w, h, nSt, leather = "#9a6a3c") {
  const r = Math.min(w, h) * 0.3, pts = rrectPts(cx, cy, w, h, r);
  g.save(); polyPath(g, pts); const gr = g.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); gr.addColorStop(0, mix(leather, "#ffffff", 0.16)); gr.addColorStop(1, mix(leather, "#000000", 0.18)); g.fillStyle = gr; g.fill();
  g.lineWidth = 0.0016 * PXM; g.strokeStyle = mix(leather, "#000000", 0.55); g.lineJoin = "round"; g.stroke();
  const inset = 0.0048 * PXM, inner = rrectPts(cx, cy, w - 2 * inset, h - 2 * inset, r * 0.7), st = walk(inner, nSt, true, 0.02).pts;
  g.lineCap = "round"; g.lineWidth = 0.0012 * PXM; g.strokeStyle = "#efe6cf"; const hl = 0.0025 * PXM;
  for (const s of st) { g.beginPath(); g.moveTo(s.p[0] - s.t[0] * hl, s.p[1] - s.t[1] * hl); g.lineTo(s.p[0] + s.t[0] * hl, s.p[1] + s.t[1] * hl); g.stroke(); }
  g.restore();
}
function blobPts(cx, cy, r, seed, f, n = 14) {   // an irregular mud blob; f scales it down (edges shrink in)
  const pts = [], el = 1 + 0.35 * (rr(seed * 3.7) - 0.5), rot = rr(seed * 5.1) * TAU;
  for (let i = 0; i < n; i++) { const a = TAU * i / n, k = r * f * (0.72 + 0.5 * rr(seed * 11.3 + i * 2.9)); const x = Math.cos(a) * k * el, y = Math.sin(a) * k / el; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return pts;
}
function smoothPath(g, pts) {   // quadratic curves through the mid points: a soft closed blob
  const n = pts.length; g.beginPath();
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (!i) g.moveTo(mx, my); else g.quadraticCurveTo(a[0], a[1], mx, my); }
  const a = pts[0], b = pts[1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.closePath();
}
const lighten = (c, k) => mix(c, "#ffffff", k), darken = (c, k) => mix(c, "#000000", k);

// the nap: 220 fibre strokes of 3-8 mm (150 on the shaft, 70 on the vamp) and 30 pilling dots (20 / 10), over a fine felt grain of short flecks (1-1.6 mm)
function fibreTex(piece) {
  return memo("fibre" + piece, () => canvasTex(piece === "shaft" ? SW : FW, piece === "shaft" ? SH : FH, (g, W, H) => {
    g.clearRect(0, 0, W, H); const shaft = piece === "shaft", N = shaft ? 150 : 70, P = shaft ? 20 : 10, sd = SEEDS[piece], F = shaft ? 2600 : 1100; g.lineCap = "round";
    for (let i = 0; i < F; i++) {   // the grain: short flecks, light and dark, every direction
      const x = rr(i * 1.3 + sd + 20) * W, y = rr(i * 2.9 + sd + 21) * H, len = (0.0010 + 0.0007 * rr(i * 4.1 + sd + 22)) * PXM, a = rr(i * 6.7 + sd + 23) * TAU, k = rr(i * 8.3 + sd + 24);
      g.strokeStyle = k < 0.55 ? `rgba(255,255,255,${0.16 + 0.14 * rr(i + 1)})` : `rgba(0,0,0,${0.12 + 0.12 * rr(i + 2)})`; g.lineWidth = 0.00065 * PXM;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    for (let i = 0; i < N; i++) {
      const x = rr(i * 3.1 + sd) * W, y = rr(i * 5.3 + sd + 1) * H, len = (0.003 + 0.005 * rr(i * 7.7 + sd + 2)) * PXM, a = rr(i * 9.1 + sd + 3) * TAU, lite = rr(i * 2.2 + sd + 4) < 0.5;
      g.strokeStyle = lite ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.26)"; g.lineWidth = 0.0011 * PXM;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.6, y + Math.sin(a + 0.6) * len * 0.6, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    for (let i = 0; i < P; i++) {
      const x = rr(i * 4.7 + sd + 11) * W, y = rr(i * 6.1 + sd + 12) * H, r = (0.0007 + 0.0007 * rr(i * 8.3 + sd)) * PXM;
      g.fillStyle = "rgba(0,0,0,0.16)"; g.beginPath(); g.arc(x + 0.5, y + 0.8, r * 1.1, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,0.38)"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  }));
}
// the fuzz: a thin shell of tiny lighter tufts standing 1.6 mm off the felt (alpha-tested), so the silhouette and the seams are not razor-edged
function fuzzTex(piece) {
  return memo("fuzz" + piece, () => canvasTex(piece === "shaft" ? SW : FW, piece === "shaft" ? SH : FH, (g, W, H) => {
    g.clearRect(0, 0, W, H); const shaft = piece === "shaft", F = shaft ? 1500 : 650, sd = SEEDS[piece] + 40; g.fillStyle = "#ffffff"; g.strokeStyle = "#ffffff"; g.lineCap = "round";
    for (let i = 0; i < F; i++) {
      const x = rr(i * 1.7 + sd) * W, y = rr(i * 3.3 + sd + 1) * H, a = rr(i * 5.9 + sd + 2) * TAU, len = (0.0012 + 0.0016 * rr(i * 7.1 + sd + 3)) * PXM;
      g.lineWidth = (0.0006 + 0.0004 * rr(i + sd)) * PXM; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
  }));
}

// ---- the dressing, per look: patches, caps, scuffs, dots (static)
function decoTex(piece, cfg) {
  return memo(`deco${piece}|${cfg.kind}|${cfg.who}|${cfg.dots}`, () => canvasTex(piece === "shaft" ? SW : FW, piece === "shaft" ? SH : FH, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    if (piece === "shaft") {
      if (cfg.kind === "felt") {   // the leather heel patch (8 stitches) on the back: it wraps over the texture seam, so it is drawn twice
        for (const dx of [0, SW]) drawPatch(g, dx, shaftPx(0, 0.06)[1], 0.056 * PXM, 0.056 * PXM, 8, "#7d5230");
        if (cfg.who === "spud") { const [x, y] = shaftPx(-0.094, 0.175); drawPatch(g, x, y, 0.040 * PXM, 0.052 * PXM, 10, "#9a6a3c"); }   // Spud's elbow patch, 10 stitches, on the left side
      }
      if (cfg.dots) {   // white dots round the shaft (the red felt of house 6: 9)
        g.fillStyle = "#fbf6ea";
        for (let i = 0; i < cfg.dots; i++) { const s = -0.17 + 0.34 * ((i % 3) + 0.5 * (Math.floor(i / 3) % 2) + 0.25) / 3, y = 0.16 + 0.05 * Math.floor(i / 3), [x, py] = shaftPx(s * 1.0, y); g.beginPath(); g.arc(x, py, 0.0042 * PXM, 0, TAU); g.fill(); }
      }
    } else {
      if (cfg.kind === "suede") {   // a paler scuff on the toe
        const [x, y] = footPx(-0.006, 0.168); g.save(); g.translate(x, y); g.scale(1, 1.4); const q = g.createRadialGradient(0, 0, 0, 0, 0, 0.026 * PXM); q.addColorStop(0, "rgba(255,225,205,0.55)"); q.addColorStop(0.6, "rgba(255,225,205,0.25)"); q.addColorStop(1, "rgba(255,225,205,0)"); g.fillStyle = q; g.beginPath(); g.arc(0, 0, 0.026 * PXM, 0, TAU); g.fill(); g.restore();
      }
      if (cfg.kind === "leather") {   // the toe cap: a scalloped seam and 9 punched dots
        const pt = (x, z) => footPx(x, z), line = [];
        for (let i = 0; i <= 32; i++) { const x = -0.046 + 0.092 * i / 32, z = 0.128 - 0.016 * Math.pow(Math.abs(x) / 0.046, 1.6) + 0.006 * Math.sin(i * 1.6) * 0; line.push(pt(x, 0.126 + 0.012 * Math.pow(x / 0.046, 2))); }
        g.strokeStyle = "rgba(60,16,36,0.55)"; g.lineWidth = 0.0012 * PXM; g.beginPath(); line.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.stroke();
        g.strokeStyle = "rgba(255,200,225,0.45)"; g.lineWidth = 0.0007 * PXM; g.beginPath(); line.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y + 2)); g.stroke();
        for (let i = 0; i < 9; i++) {   // 3 rows of 3, a broguing
          const row = Math.floor(i / 3), col = i % 3, x = (col - 1) * 0.018 + (row === 1 ? 0.0 : 0.0), z = 0.146 + row * 0.011, [px, py] = pt(x, z);
          g.fillStyle = "#6a1a38"; g.beginPath(); g.arc(px, py, 0.0020 * PXM, 0, TAU); g.fill(); g.fillStyle = "rgba(255,190,215,0.6)"; g.beginPath(); g.arc(px - 0.5, py + 0.9, 0.0012 * PXM, 0, TAU); g.fill();
        }
      }
      if (cfg.kind === "rubber" || cfg.kind === "furtrim") {   // 3 snowflakes melted to dark dots on the toe
        for (const [x, z] of [[-0.018, 0.150], [0.010, 0.162], [0.021, 0.139]]) { const [px, py] = footPx(x, z); g.fillStyle = "rgba(20,28,40,0.42)"; g.beginPath(); g.ellipse(px, py, 0.0030 * PXM, 0.0042 * PXM, 0.3, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.arc(px - 1, py - 2, 0.0009 * PXM, 0, TAU); g.fill(); }
      }
    }
  }));
}

// ---- the polish: painted reflections (the same shapes on every polished boot), drawn at full strength; the mesh's opacity is `shine`
function lanternShape(g, cx, cy, w, h) {   // a small warm lantern: iron cap and base, an amber body with a core
  const x0 = cx - w / 2, y0 = cy - h / 2;
  g.save(); g.fillStyle = "#4a3a2a"; g.beginPath(); g.moveTo(cx, y0); g.lineTo(x0 + w, y0 + h * 0.2); g.lineTo(x0, y0 + h * 0.2); g.closePath(); g.fill(); g.fillRect(x0 + w * 0.1, y0 + h * 0.9, w * 0.8, h * 0.1);
  const gr = g.createLinearGradient(0, y0 + h * 0.2, 0, y0 + h * 0.9); gr.addColorStop(0, "#ffb45a"); gr.addColorStop(1, "#ff9a3a"); g.fillStyle = gr; g.fillRect(x0 + w * 0.1, y0 + h * 0.2, w * 0.8, h * 0.7);
  g.fillStyle = "#fff0c0"; g.beginPath(); g.ellipse(cx, y0 + h * 0.56, w * 0.2, h * 0.2, 0, 0, TAU); g.fill();
  g.strokeStyle = "rgba(42,45,52,0.8)"; g.lineWidth = Math.max(1, w * 0.07); g.beginPath(); g.moveTo(cx, y0 + h * 0.24); g.lineTo(cx, y0 + h * 0.86); g.stroke(); g.restore();
}
function shineTex(piece, K) {   // a mirror: the lantern, a long streak, a horizon with the dark floor under it, a rim light down each edge
  return memo(`shine${piece}|${K.join(",")}`, () => canvasTex(piece === "shaft" ? SW : FW, piece === "shaft" ? SH : FH, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const glow = (cx, cy, r) => { const q = g.createRadialGradient(cx, cy, 0, cx, cy, r); q.addColorStop(0, "rgba(255,196,110,0.42)"); q.addColorStop(1, "rgba(255,196,110,0)"); g.fillStyle = q; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); };
    if (piece === "shaft") {   // the lantern mirrored 0.042 x 0.064 with its glow, the streak 0.13 long beside it, the horizon at y 0.15, the rim lights at the edges
      const yh = (1 - 0.152 / G.H) * SH, y0 = (1 - 0.034 / G.H) * SH, y1 = (1 - 0.18 / G.H) * SH;   // the dark floor mirrored in the lower shaft
      const fl = g.createLinearGradient(0, y1, 0, y0); fl.addColorStop(0, "rgba(34,18,6,0)"); fl.addColorStop(0.3, "rgba(34,18,6,0.34)"); fl.addColorStop(1, "rgba(34,18,6,0.42)"); g.fillStyle = fl; g.fillRect(0, y1, W, y0 - y1);
      g.fillStyle = "rgba(255,236,190,0.55)"; g.fillRect(0, yh - 2, W, 4);
      const [sx, sy] = shaftPx(-0.064, 0.19), L = 0.13 / K[1] * PXM, wd = 0.0095 / K[0] * PXM;
      const q = g.createLinearGradient(0, sy - L / 2, 0, sy + L / 2); q.addColorStop(0, "rgba(255,246,208,0)"); q.addColorStop(0.15, "rgba(255,246,208,0.95)"); q.addColorStop(0.82, "rgba(255,246,208,0.8)"); q.addColorStop(1, "rgba(255,246,208,0)");
      g.fillStyle = q; g.beginPath(); g.ellipse(sx, sy, wd / 2, L / 2, 0, 0, TAU); g.fill();
      const [lx, ly] = shaftPx(-0.026, 0.215); glow(lx, ly, 0.052 / K[1] * PXM); lanternShape(g, lx, ly, 0.042 / K[0] * PXM, 0.064 / K[1] * PXM);
      for (const [ss0, col, wr] of [[0.088, "255,246,230", 1], [-0.088, "255,214,150", 0.8]]) {   // the rim lights
        const [ex, ey0] = shaftPx(ss0, 0.27), ey1 = shaftPx(ss0, 0.045)[1], gq = g.createLinearGradient(0, ey0, 0, ey1); gq.addColorStop(0, `rgba(${col},0)`); gq.addColorStop(0.15, `rgba(${col},${0.9 * wr})`); gq.addColorStop(0.7, `rgba(${col},${0.8 * wr})`); gq.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gq; g.beginPath(); g.roundRect(ex - 0.0042 / K[0] * PXM, ey0, 0.0084 / K[0] * PXM, ey1 - ey0, 6); g.fill();
      }
    } else {   // on the toe: the window 0.040 x 0.024 and the lantern 0.022 x 0.032, a horizon line across, snow blue above it, a rim line along each sole edge
      const hz = footPx(0, 0.152)[1], q = g.createLinearGradient(0, hz, 0, 0); q.addColorStop(0, "rgba(150,180,235,0.10)"); q.addColorStop(1, "rgba(110,150,235,0.34)"); g.fillStyle = q; g.fillRect(0, 0, W, hz);
      g.strokeStyle = "rgba(223,234,250,0.95)"; g.lineWidth = 0.0016 * PXM; g.beginPath(); for (let i = 0; i <= 24; i++) { const [x, y] = footPx(-0.05 + 0.1 * i / 24, 0.152); g[i ? "lineTo" : "moveTo"](x, y); } g.stroke();
      const wx = -0.021, wz = 0.118, ww = 0.040 / K[0], wl = 0.024 / K[2], P = (u, v) => footPx(wx + u * ww, wz + v * wl);
      const win = [P(-.5, -.5), P(.5, -.5), P(.5, .5), P(-.5, .5)]; g.fillStyle = "#fff6d0"; g.beginPath(); win.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.closePath(); g.fill();
      g.strokeStyle = "rgba(160,120,60,0.6)"; g.lineWidth = 0.0011 * PXM; for (const [a, b] of [[P(0, -.5), P(0, .5)], [P(-.5, 0), P(.5, 0)]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      const [lx, ly] = footPx(0.027, 0.118); glow(lx, ly, 0.026 / K[0] * PXM); lanternShape(g, lx, ly, 0.022 / K[0] * PXM, 0.032 / K[2] * PXM);
      for (const [ex, col] of [[0.045, "255,246,230"], [-0.045, "255,214,150"]]) { const [u0] = footPx(ex, 0.06), x0 = ex > 0 ? W - 0.0085 * PXM : 0, gq = g.createLinearGradient(0, footPx(0, 0.17)[1], 0, footPx(0, -0.02)[1]); gq.addColorStop(0, `rgba(${col},0)`); gq.addColorStop(0.25, `rgba(${col},0.85)`); gq.addColorStop(0.8, `rgba(${col},0.7)`); gq.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gq; g.fillRect(x0, 0, 0.0085 * PXM, H); }
    }
  }));
}
function rollShineTex() {   // the rim line on the cuff: a bright line along the roll's top-outer side, broken and brighter to the left
  return memo("rollshine", () => canvasTex(512, 64, (g, W, H) => {
    g.clearRect(0, 0, W, H); const y = (1 - 55 / 360) * H;
    for (let i = 0; i < 64; i++) { const x0 = W * i / 64, a = 0.35 + 0.55 * (0.5 - 0.5 * Math.cos(TAU * (i / 64 - 0.58))) ; g.fillStyle = `rgba(255,246,208,${Math.min(1, a + 0.15)})`; g.fillRect(x0, y - 4, W / 64 + 1, 8); }
  }));
}
function glintTex() {
  return memo("glint", () => { const t = canvasTex(256, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H); const q = g.createLinearGradient(W * 0.42, 0, W * 0.58, 0); q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.5, "rgba(255,255,255,0.95)"); q.addColorStop(1, "rgba(255,255,255,0)");
    g.save(); g.translate(W / 2, H / 2); g.rotate(0.35); g.translate(-W / 2, -H / 2); g.fillStyle = q; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore();
  }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
}

// ---- the mud (redrawn when it changes): 9 patches (3 wet), 16 splash dots, drawn from their index; item k shrinks away from its edges
// when mud falls, the toe first: item k of n is gone at mud 0.73 (n-1-k)/(n-1) and whole 0.27 above that
const MUD = [
  { on: "f", x: -0.006, z: 0.152, r: 0.030, big: 1.15 }, { on: "f", x: -0.026, z: 0.108, r: 0.025, wet: 1 }, { on: "f", x: 0.027, z: 0.138, r: 0.026 },
  { on: "f", x: 0.020, z: 0.090, r: 0.022 }, { on: "f", x: -0.043, z: 0.118, r: 0.022, wet: 1 }, { on: "f", x: 0.043, z: 0.100, r: 0.022 },
  { on: "s", s: -0.092, y: 0.070, r: 0.026 }, { on: "s", s: 0.088, y: 0.062, r: 0.025, wet: 1 }, { on: "s", s: 0.196, y: 0.055, r: 0.030 },
];
const mudFrac = (m, k, n) => ss((m - 0.73 * (n - 1 - k) / (n - 1)) / 0.27);
const SPLASH = Array.from({ length: 16 }, (_, i) => i < 6
  ? { on: "f", x: (rr(i * 3.3 + 1) - 0.5) * 0.08, z: 0.075 + 0.1 * rr(i * 4.1 + 2), r: 0.0014 + 0.0020 * rr(i * 5.9 + 3) }
  : { on: "s", s: (rr(i * 3.9 + 4) - 0.5) * 0.39, y: 0.035 + 0.115 * rr(i * 6.7 + 5), r: 0.0014 + 0.0021 * rr(i * 7.3 + 6) });
// A patch is a smear, not a spot: a drier, paler ragged halo that feathers out, a body of brown-grey mud with a wet dark core, a thicker lobe
// dragged toward the toe (feet) or the sole (shaft), a few cracks where it is dry, 3 clumps (shadow, body, highlight), a tapered drag streak and a
// scatter of grit; a wash of thicker mud runs down to the sole under it. All from the patch index.
const MD = { dry: [172, 154, 122], mud: [122, 103, 76], dark: [82, 66, 46], grey: [126, 118, 104] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const nz = (sd, a) => 0.5 * Math.sin(2 * a + sd * 1.7) + 0.3 * Math.sin(3 * a + sd * 2.9 + 1) + 0.2 * Math.sin(5 * a + sd * 4.3 + 2);
function rag(cx, cy, rx, ry, rot, sd, n = 28, amp = 0.34) {   // a ragged blob: 2 octaves of angular noise and a jitter
  const pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = TAU * i / n, k = 1 + amp * nz(sd, a) + 0.24 * (rr(sd * 7.1 + i * 3.3) - 0.5), x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
  return pts;
}
const radial = (g, cx, cy, r, stops) => { const q = g.createRadialGradient(cx, cy, 0, cx, cy, r); for (const [o, c] of stops) q.addColorStop(o, c); return q; };
function drawSmear(g, cx, cy, r, sd, f, wet, dx, dy, drag) {
  const rot = Math.atan2(dy, dx), R = r * f, px = -dy, py = dx;
  if (drag) {   // the tapered drag streak: from the patch away along (dx, dy)
    const L = R * (1.9 + 0.6 * rr(sd)), W0 = R * 0.46;
    g.beginPath(); g.moveTo(cx + px * W0, cy + py * W0); g.quadraticCurveTo(cx + dx * L * 0.55 + px * W0 * 0.8, cy + dy * L * 0.55 + py * W0 * 0.8, cx + dx * L, cy + dy * L); g.quadraticCurveTo(cx + dx * L * 0.5 - px * W0 * 0.3, cy + dy * L * 0.5 - py * W0 * 0.3, cx - px * W0, cy - py * W0); g.closePath();
    g.fillStyle = radial(g, cx, cy, L, [[0, rgba(MD.mud, 0.92)], [0.6, rgba(MD.mud, 0.6)], [1, rgba(MD.dry, 0.0)]]); g.fill();
  }
  smoothPath(g, rag(cx + dx * R * 0.2, cy + dy * R * 0.2, R * 1.55, R * 1.05, rot, sd + 3)); g.fillStyle = radial(g, cx, cy, R * 2.1, [[0, rgba(MD.grey, 0.55)], [0.5, rgba(MD.grey, 0.40)], [1, rgba(MD.grey, 0)]]); g.fill();   // the dry halo: a grey-brown wash that feathers out
  smoothPath(g, rag(cx + dx * R * 0.1, cy + dy * R * 0.1, R * 1.0, R * 0.6, rot, sd)); g.fillStyle = radial(g, cx, cy, R * 1.05, [[0, rgba(wet ? MD.dark : MD.mud, 0.95)], [0.62, rgba(MD.mud, 0.9)], [1, rgba(MD.grey, 0.7)]]); g.fill();   // the body
  smoothPath(g, rag(cx + dx * R * 0.5, cy + dy * R * 0.5, R * 0.5, R * 0.38, rot, sd + 5, 20)); g.fillStyle = rgba(MD.dark, 0.6); g.fill();   // the thick lobe
  if (!wet) { g.strokeStyle = rgba(MD.dark, 0.55); g.lineWidth = 1.3; g.lineCap = "round"; for (let q = 0; q < 5; q++) { const a = rr(sd * 3.3 + q * 2.1) * TAU, l0 = R * 0.12, l1 = R * (0.45 + 0.35 * rr(sd + q)), mx = Math.cos(a + 0.4) * (l0 + l1) / 2, my = Math.sin(a + 0.4) * (l0 + l1) / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * l0, cy + Math.sin(a) * l0); g.lineTo(cx + mx, cy + my); g.lineTo(cx + Math.cos(a) * l1, cy + Math.sin(a) * l1); g.stroke(); } }   // the cracks
  for (let q = 0; q < 3; q++) {   // 3 clumps
    const a = rr(sd * 3.1 + q * 5.3) * TAU, d = R * (0.2 + 0.6 * rr(sd * 5.7 + q)), qx = cx + Math.cos(a) * d, qy = cy + Math.sin(a) * d, cr = R * (0.14 + 0.12 * rr(sd * 2.3 + q * 3));
    smoothPath(g, rag(qx + 1.2, qy + 1.8, cr, cr * 0.85, a, sd + q, 12, 0.3)); g.fillStyle = "rgba(28,20,12,0.5)"; g.fill();
    smoothPath(g, rag(qx, qy, cr, cr * 0.85, a, sd + q, 12, 0.3)); g.fillStyle = wet ? "#4c3b28" : "#6a5639"; g.fill();
    g.fillStyle = "rgba(196,176,138,0.75)"; g.beginPath(); g.ellipse(qx - cr * 0.3, qy - cr * 0.35, cr * 0.38, cr * 0.22, -0.6, 0, TAU); g.fill();
  }
  for (let q = 0; q < 10; q++) {   // grit scattered round the edge, more of it along the drag
    const a = rot + (rr(sd * 4.1 + q * 1.9) - 0.5) * (q < 6 ? 2.2 : TAU), d = R * (1.05 + 0.6 * rr(sd * 6.3 + q)), qr = (0.45 + 0.7 * rr(sd * 8.9 + q)) * 2.2;
    g.fillStyle = rgba(q % 3 ? MD.mud : MD.dark, 0.88); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, qr, qr * 0.8, a, 0, TAU); g.fill();
  }
  if (wet) { g.strokeStyle = "rgba(255,244,214,0.55)"; g.lineWidth = 0.0013 * PXM * f; g.lineCap = "round"; g.beginPath(); g.arc(cx - R * 0.18, cy - R * 0.14, R * 0.45, 3.5, 4.5); g.stroke(); g.fillStyle = "rgba(255,244,214,0.62)"; g.beginPath(); g.arc(cx + R * 0.24, cy + R * 0.12, 0.0013 * PXM * f, 0, TAU); g.fill(); }
}
function drawMud(gS, gF, m) {
  gS.clearRect(0, 0, SW, SH); gF.clearRect(0, 0, FW, FH);
  const soleY = (1 - 0.024 / G.H) * SH;
  const put = (it, k, n, isDot) => {
    const f = mudFrac(m, k, n); if (f < 0.02) return; const g = it.on === "s" ? gS : gF;
    const seed = (isDot ? 40 : 0) + k, spots = [];
    if (it.on === "s") { const [x, y] = shaftPx(it.s, it.y); spots.push([x, y]); if (x < 0.2 * SW) spots.push([x + SW, y]); if (x > 0.8 * SW) spots.push([x - SW, y]); } else spots.push(footPx(it.x, it.z));
    for (const [cx, cy] of spots) {
      if (isDot) {   // a splash dot with a short tail flung away from the sole
        const tx = it.on === "s" ? 0 : Math.sign(it.x || 1) * 0.5, ty = it.on === "s" ? -1 : -0.3, rd = it.r * PXM * f;
        g.fillStyle = rgba(MD.mud, 0.92); g.beginPath(); g.ellipse(cx, cy, rd, rd * 0.85, 0, 0, TAU); g.fill();
        g.strokeStyle = rgba(MD.mud, 0.7); g.lineWidth = rd * 0.8; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + tx * rd * 2.2, cy + ty * rd * 2.2); g.stroke(); continue;
      }
      const r = it.r * PXM * (it.big || 1);
      if (it.on === "s") {   // the thicker wash down to the sole under the patch
        const hw = r * 1.15, top = cy + r * 0.25, pts = [[cx - hw * 1.1, soleY + 6]];
        for (let q = 0; q <= 6; q++) pts.push([cx - hw + 2 * hw * q / 6, top + (rr(seed * 5.3 + q * 1.7) - 0.3) * r * 0.5 * f + (1 - f) * (soleY - top)]);
        pts.push([cx + hw * 1.1, soleY + 6]);
        const q = g.createLinearGradient(0, top, 0, soleY); q.addColorStop(0, rgba(MD.mud, 0)); q.addColorStop(0.35, rgba(MD.mud, 0.7 * f)); q.addColorStop(1, rgba(MD.dark, 0.95 * f));
        smoothPath(g, pts); g.fillStyle = q; g.fill();
      } else if (Math.abs(it.x) > 0.015) {   // on the foot: the same, running out to the sole edge on that side
        const sgn = Math.sign(it.x), edge = sgn > 0 ? FW : 0, wid = FW * (0.15 + 0.07 * rr(seed)) * f, hh = r * 1.25, pts = [[edge, cy - hh * 1.1]];
        for (let q = 0; q <= 6; q++) pts.push([edge - sgn * wid * (0.7 + 0.5 * rr(seed * 4.1 + q * 2.3)), cy - hh + 2 * hh * q / 6]);
        pts.push([edge, cy + hh * 1.1]);
        const gq = g.createLinearGradient(edge - sgn * wid * 1.2, 0, edge, 0); gq.addColorStop(0, rgba(MD.mud, 0)); gq.addColorStop(0.4, rgba(MD.mud, 0.7 * f)); gq.addColorStop(1, rgba(MD.dark, 0.95 * f));
        smoothPath(g, pts); g.fillStyle = gq; g.fill();
      }
      const dxy = it.on === "s" ? [Math.sin(seed * 2.1) * 0.35, 1] : [Math.sign(it.x || 1) * 0.8, -0.55], dl = Math.hypot(dxy[0], dxy[1]);
      if (it.on === "s") dxy[1] = -1;   // the shaft's smear tapers up, away from the sole
      drawSmear(g, cx, cy, r, seed, f, !!it.wet, dxy[0] / dl, dxy[1] / dl, it.on === "s" || k % 2 === 0);
    }
  };
  MUD.forEach((it, k) => put(it, k, 9, false)); SPLASH.forEach((it, k) => put(it, k, 16, true));
}

// ============================================================================================================ THE TREATS
// Each piece lies on its bottom (origin = the bottom centre). Coin 0.048 x 0.007, mandarin 0.058 x 0.050, walnut 0.036 x 0.030.
const COIN_R = 0.024, COIN_T = 0.007;
const PINE = [0, 2, 3, 5], isPine = (n) => PINE.includes(((n % 7) + 7) % 7);   // coins 0..6: 4 pine trees, 3 star-flowers
function coinOutline(bite, milled = true) {   // polar polygon: the rim with 40 milled notches; a bite is 3 tooth scallops (circles of 5.2 mm) cut at 35 degrees
  const pts = [], N = 400;
  for (let i = 0; i < N; i++) {
    const a = TAU * i / N; let r = COIN_R - (milled ? 0.0006 * (0.5 - 0.5 * Math.cos(40 * a)) : 0);
    if (bite > 0.001) {
      for (let c = -1; c <= 1; c++) {
        const ca = (35 + c * 21) * DEG, cd = COIN_R - 0.0030 + 0.0052 * (1 - bite), cr = 0.0058 * Math.min(1, bite * 1.4 + 0.1);   // centre distance falls as the bite grows
        const cx = Math.cos(ca) * cd, cy = Math.sin(ca) * cd, ux = Math.cos(a), uy = Math.sin(a), b = ux * cx + uy * cy, d2 = cx * cx + cy * cy - cr * cr;
        const disc = b * b - d2; if (disc > 0) { const t = b - Math.sqrt(disc); if (t > 0 && t < r) r = t; }
      }
    }
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}
function coinSlab(bite, h, y0 = 0) {
  const s = new THREE.Shape(); coinOutline(bite).forEach(([x, z], i) => s[i ? "lineTo" : "moveTo"](x, -z)); s.closePath();
  const bt = 0.0007, g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * bt, bevelEnabled: true, bevelSize: bt * 0.7, bevelThickness: bt, bevelSegments: 1, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); g.translate(0, y0 + bt, 0); return g;
}
function embossTex(pine, choc) {   // the foil face: a border ring and an embossed pine tree or a six-petal star-flower
  return memo(`emboss${pine}${choc}`, () => canvasTex(256, 256, (g, W) => {
    const base = choc ? "#4a2a1a" : "#f2c64a", hi = choc ? "#7a4a30" : "#fff0a0", lo = choc ? "#2a140a" : "#b88a1e", c = W / 2;
    g.fillStyle = base; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(${choc ? "255,220,180" : "255,244,190"},${0.07 + 0.06 * rr(i)})`; g.lineWidth = 1 + 2 * rr(i + 3); g.beginPath(); const a = rr(i * 2.3) * TAU, r = W * (0.2 + 0.28 * rr(i * 3.1)); g.arc(c + Math.cos(a) * W * 0.1, c + Math.sin(a) * W * 0.1, r, a, a + 1.3 + rr(i)); g.stroke(); }   // the crinkle of the foil
    const emb = (draw) => { g.save(); g.translate(1.6, 1.6); g.strokeStyle = g.fillStyle = lo; draw(); g.restore(); g.save(); g.translate(-1.2, -1.2); g.strokeStyle = g.fillStyle = hi; draw(); g.restore(); g.strokeStyle = g.fillStyle = base; draw(); };
    emb(() => { g.lineWidth = 5; g.beginPath(); g.arc(c, c, W * 0.43, 0, TAU); g.stroke(); for (let i = 0; i < 24; i++) { const a = TAU * i / 24; g.beginPath(); g.arc(c + Math.cos(a) * W * 0.385, c + Math.sin(a) * W * 0.385, 2.4, 0, TAU); g.fill(); } });
    if (pine) emb(() => { for (let t = 0; t < 3; t++) { const y0 = c + 38 - t * 36, w = 62 - t * 14; g.beginPath(); g.moveTo(c, y0 - 56 + t * 8); g.lineTo(c + w, y0 + 6); g.lineTo(c - w, y0 + 6); g.closePath(); g.fill(); } g.fillRect(c - 7, c + 40, 14, 26); });
    else emb(() => { for (let p = 0; p < 6; p++) { g.save(); g.translate(c, c); g.rotate(TAU * p / 6); g.beginPath(); g.ellipse(0, -44, 17, 38, 0, 0, TAU); g.fill(); g.restore(); } g.beginPath(); g.arc(c, c, 18, 0, TAU); g.fill(); });
  }));
}
function makeCoin(n, o = {}) {
  const g = new THREE.Group(), gold = mat("#f2c64a", { roughness: 0.34, metalness: 0.25 }), choc = mat("#4a2a1a", { roughness: 0.6 }), wallM = mat("#7a4a30", { roughness: 0.7 });
  const faceM = (isChoc) => { const m = new THREE.MeshStandardMaterial({ map: embossTex(isPine(n), isChoc), roughness: isChoc ? 0.55 : 0.3, metalness: isChoc ? 0 : 0.25, side: THREE.DoubleSide }); return m; };
  let body = null, cho = null, wall = null, key = "";
  const petalsG = new THREE.Group(); g.add(petalsG);
  const petals = [];
  const CH = Math.cos(Math.PI / 5);   // the chord of a petal's arc sits at 0.809 of the radius: the hinge is that chord, so a peeled petal stays joined to the coin along it
  for (let k = 0; k < 5; k++) {   // the foil face in 5 petals: each a sector hinged on its chord (two corners on the rim)
    const a0 = TAU * k / 5 - TAU / 10 + Math.PI / 2, Rr = COIN_R - 0.0004, pts = [[0, 0]]; for (let i = 0; i <= 12; i++) { const a = a0 + TAU / 5 * i / 12; pts.push([Math.cos(a) * Rr, Math.sin(a) * Rr]); }
    const s = new THREE.Shape(); pts.forEach(([x, z], i) => s[i ? "lineTo" : "moveTo"](x, z)); s.closePath(); const pg = new THREE.ShapeGeometry(s, 4), p = pg.attributes.position, uv = pg.attributes.uv;
    const hing = a0 + TAU / 10, hx = Math.cos(hing) * Rr * CH, hz = -Math.sin(hing) * Rr * CH;   // after the flip below: x, z of the chord's middle
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); uv.setXY(i, 0.5 + x / (2 * COIN_R), 0.5 + y / (2 * COIN_R)); }
    pg.rotateX(-Math.PI / 2); pg.translate(-hx, 0, -hz);   // the sector's points relative to the chord's middle (the shape's y became -z)
    const piv = new THREE.Group(); piv.position.set(hx, COIN_T + 0.0006, hz); const pm = shadowy(new THREE.Mesh(pg, faceM(false))); pm.castShadow = false; piv.add(pm); petalsG.add(piv); petals.push({ piv, hing });
  }
  const chocFace = new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Array(9).fill(0), 3)), faceM(true)); chocFace.position.y = COIN_T + 0.0002; g.add(chocFace);
  const set = (peel, bite) => {
    const k = `${Math.round(bite * 24)}`;
    if (k !== key) {   // the slab and the bite's cut wall are rebuilt only when the bite changes
      key = k; for (const o of [body, wall]) if (o) { g.remove(o); o.geometry.dispose(); }
      body = mesh(coinSlab(bite, COIN_T), gold, g); const b = Math.round(bite * 24) / 24;
      { const f = (COIN_R - 0.0012) / COIN_R, sh = new THREE.Shape(); coinOutline(b, false).forEach(([x, z], i) => sh[i ? "lineTo" : "moveTo"](x * f, -z * f)); sh.closePath();   // the chocolate under the foil, with the bite cut out of it
        const cg = new THREE.ShapeGeometry(sh, 1); cg.rotateX(-Math.PI / 2); const pp = cg.attributes.position, uu = cg.attributes.uv; for (let i = 0; i < pp.count; i++) uu.setXY(i, 0.5 + pp.getX(i) / (2 * COIN_R), 0.5 - pp.getZ(i) / (2 * COIN_R)); chocFace.geometry.dispose(); chocFace.geometry = cg; }
      if (b > 0.001) {   // the cut face of the chocolate, a strip just outside the gold wall along the bitten rim
        const pos = [], idx = [], pts = coinOutline(b), cut = [];
        pts.forEach(([x, z], i) => { const r = Math.hypot(x, z); if (r < COIN_R - 0.0012) cut.push(i); });
        for (const i of cut) { const [x, z] = pts[i], l = Math.hypot(x, z), ox = x / l * 0.00015, oz = z / l * 0.00015; pos.push(x + ox, 0.0007, z + oz, x + ox, COIN_T - 0.0007, z + oz); }
        for (let q = 0; q < cut.length - 1; q++) if (cut[q + 1] === cut[q] + 1) { const a = q * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2, a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals(); wall = mesh(wg, wallM, g); wall.castShadow = false;
      } else wall = null;
    }
    const p = clamp(peel), e = 1 - Math.pow(1 - p, 2);
    for (let k2 = 0; k2 < 5; k2++) {   // a petal is flipped about its hinge: 0 = flat on the face, about 130 degrees = standing open like a tulip, still joined along its chord
      const { piv, hing } = petals[k2], ax = new THREE.Vector3(-Math.sin(hing - Math.PI / 2) * 0 + Math.sin(hing), 0, Math.cos(hing)).normalize();   // the tangent
      piv.quaternion.setFromAxisAngle(ax, -(e * (118 + 22 * rr(k2 * 3.3 + n)) + 8 * Math.sin(p * Math.PI)) * DEG * (1));
    }
    chocFace.visible = p > 0.01; petalsG.visible = p < 0.995 || true;
  };
  set(o.peel ?? 0, o.bite ?? 0);
  return { group: g, set };
}

function mandarinTex() {
  return memo("mandarin", () => canvasTex(512, 256, (g, W, H) => {   // equirect: x = longitude, y = latitude (top = the calyx pole)
    g.fillStyle = "#f08a1e"; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(255,194,102,0.55)"); gr.addColorStop(0.45, "rgba(255,194,102,0)"); gr.addColorStop(1, "rgba(201,96,26,0.6)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${rr(i) < 0.5 ? "255,170,70" : "205,100,24"},0.10)`; g.beginPath(); g.ellipse(rr(i * 3.1) * W, rr(i * 4.7) * H, 24 + 40 * rr(i + 2), 10 + 18 * rr(i + 5), 0, 0, TAU); g.fill(); }
    for (let k = 0; k < 40; k++) {   // 40 pore dots, evenly over the sphere (a golden-angle spiral)
      const lat = Math.asin(1 - 2 * (k + 0.5) / 40), lon = (k * 2.399963) % TAU, x = lon / TAU * W, y = (0.5 - lat / Math.PI) * H, sx = 1 / Math.max(0.35, Math.cos(lat));
      g.fillStyle = "rgba(180,84,16,0.8)"; g.beginPath(); g.ellipse(x, y, 2.6 * sx, 2.6, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,200,110,0.7)"; g.beginPath(); g.ellipse(x - 0.8, y - 0.9, 1 * sx, 1, 0, 0, TAU); g.fill();
    }
  }));
}
let MANG = null;
function makeMandarin(o = {}) {
  const g = new THREE.Group();
  if (!MANG) { const sp = new THREE.SphereGeometry(1, 48, 32), p = sp.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.abs(y), dim = a > 0.88 ? 0.1 * Math.pow((a - 0.88) / 0.12, 2) : 0; p.setY(i, y - Math.sign(y) * dim); } sp.computeVertexNormals(); MANG = sp; }
  const body = mesh(MANG, new THREE.MeshStandardMaterial({ map: mandarinTex(), roughness: 0.55 }), g); body.scale.set(0.029, 0.0255, 0.029); body.position.y = 0.0255;
  const leafM = mat("#5f8f2a", { roughness: 0.6 });
  const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.0034 : 0.0108, a = TAU * i / 10; st[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); } st.closePath();   // the green star calyx: 5 pointed leaflets
  const cal = mesh(new THREE.ExtrudeGeometry(st, { depth: 0.0008, bevelEnabled: false }), leafM, g); cal.rotation.x = -Math.PI / 2; cal.position.y = 0.0494; cal.castShadow = false;
  if (o.stem) {   // this mandarin keeps its stem and one leaf
    mesh(new THREE.CylinderGeometry(0.0012, 0.0016, 0.009, 6), mat("#6a5a2a"), g, 0, 0.0535, 0);
    const lf = new THREE.Shape(); lf.moveTo(0, 0); lf.bezierCurveTo(0.004, 0.003, 0.012, 0.003, 0.017, 0); lf.bezierCurveTo(0.012, -0.0035, 0.004, -0.0035, 0, 0);
    const leaf = mesh(new THREE.ShapeGeometry(lf, 8), new THREE.MeshStandardMaterial({ color: "#4fae2e", roughness: 0.6, side: THREE.DoubleSide }), g, 0.001, 0.0555, 0); leaf.rotation.set(-1.2, 0.3, 0.35); leaf.castShadow = false;
  }
  return { group: g, set() {} };
}

const WAL = { w: 0.018, h: 0.015, d: 0.0145 };
const wrinkle = (k) => { const u0 = (k % 6) / 6 + (k < 6 ? 0 : 0.5 / 6) + 0.04 * (rr(k * 3.7) - 0.5), v0 = 0.12 + 0.08 * rr(k * 5.1), pts = []; for (let i = 0; i <= 8; i++) pts.push([(u0 + 0.045 * Math.sin(i * 1.3 + k)) % 1, v0 + 0.62 * i / 8]); return pts; };
function walnutTex() {
  return memo("walnut", () => canvasTex(512, 256, (g, W, H) => {
    g.fillStyle = "#b08a5a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rr(i) < 0.5 ? "122,90,54" : "210,170,110"},0.16)`; g.beginPath(); g.ellipse(rr(i * 3.1) * W, rr(i * 4.7) * H, 12 + 30 * rr(i + 2), 5 + 14 * rr(i + 5), rr(i) * 3, 0, TAU); g.fill(); }
    g.lineCap = "round";
    for (let k = 0; k < 12; k++) { const w = wrinkle(k); g.strokeStyle = "rgba(122,90,54,0.85)"; g.lineWidth = 1.8; g.beginPath(); w.forEach(([u, v], i) => g[i ? "lineTo" : "moveTo"](u * W, v * H)); g.stroke(); g.strokeStyle = "rgba(240,205,150,0.45)"; g.lineWidth = 1.2; g.beginPath(); w.forEach(([u, v], i) => g[i ? "lineTo" : "moveTo"](u * W + 2.4, v * H + 1)); g.stroke(); }
    g.strokeStyle = "#5a3c1e"; g.lineWidth = 4.5; for (const u of [0.25, 0.75]) { g.beginPath(); g.moveTo(u * W, 0); g.lineTo(u * W, H); g.stroke(); }   // the seam
  }));
}
let WALG = null;
function makeWalnut() {
  const g = new THREE.Group();
  if (!WALG) {
    const sp = new THREE.SphereGeometry(1, 56, 36), p = sp.attributes.position, uv = sp.attributes.uv, curves = Array.from({ length: 12 }, (_, k) => wrinkle(k));
    for (let i = 0; i < p.count; i++) {
      const u = uv.getX(i), v = 1 - uv.getY(i); let d = 9;
      for (const c of curves) for (let q = 0; q < c.length - 1; q++) { const a = c[q], b = c[q + 1], ax = (u - a[0] + 1.5) % 1 - 0.5, bx = (b[0] - a[0] + 1.5) % 1 - 0.5, dx = bx, dy = b[1] - a[1], t = clamp((ax * dx + (v - a[1]) * dy) / (dx * dx + dy * dy), 0, 1), ex = (ax - dx * t) * 2, ey = v - a[1] - dy * t; d = Math.min(d, Math.hypot(ex, ey)); }
      const gr = Math.exp(-Math.pow(d / 0.022, 2)), seam = Math.exp(-Math.pow(Math.min(Math.abs(u - 0.25), Math.abs(u - 0.75)) / 0.012, 2)), pole = 1 - 0.03 * Math.pow(Math.abs(p.getY(i)), 6);
      const k = (1 - 0.030 * gr + 0.035 * seam) * pole; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    sp.computeVertexNormals(); WALG = sp;
  }
  const w = mesh(WALG, new THREE.MeshStandardMaterial({ map: walnutTex(), roughness: 0.8 }), g); w.scale.set(WAL.w, WAL.h, WAL.d); w.position.y = WAL.h;   // the seam runs in the x-y plane (u 0.25 / 0.75 = +-x... a great circle)
  w.rotation.y = Math.PI / 2;
  return { group: g, set() {} };
}
const makeTreat = (type, o = {}) => (type === "mandarin" ? makeMandarin(o) : type === "walnut" ? makeWalnut() : makeCoin(o.n ?? 0, o));

// ============================================================================================================ STYLES
const NAMED = { moss: "#5f7a3a", orange: "#e8822a", sky: "#8fc4e8", skyblue: "#8fc4e8", violet: "#7a4aa8", red: "#c0392b", brown: "#6a4528", pale: "#a8c8e0", paleblue: "#a8c8e0", green: "#4f9a4f", cream: "#efe4c8", plum: "#6a2a52", white: "#f4f4f0", teal: "#2f8f8a", yellow: "#f2b824" };
const palOf = (base) => ({ base, shade: darken(base, 0.34), light: lighten(base, 0.32) });
function resolve(S) {
  const kind = S.style || "felt", col = S.color ? (NAMED[S.color] || S.color) : null;
  let who = S.who || (S.tone === "yellow" ? "chip" : "spud"), pal, K, sole = "#2a3a44", rough = 1, H;
  const u = (h, h0) => { const k = (S.h ?? h) / h0; return [k, k, k]; };
  if (kind === "felt") {
    if (col) { who = "lane"; pal = palOf(col); K = u(0.24, 0.30); } else if (who === "chip") { pal = { base: "#f2b824", shade: "#b9861a", light: "#ffd95a" }; K = u(0.26, 0.30); } else { who = "spud"; pal = { base: "#2f8f8a", shade: "#1c5f5c", light: "#5fb8b0" }; K = u(0.30, 0.30); }
  } else if (kind === "leather") {
    pal = col ? palOf(col) : { base: "#b0244c", shade: "#6e1431", light: "#e2607e" }; const k = (S.h ?? 0.25) / 0.25; K = [0.933 * k, 0.833 * k, 0.958 * k]; sole = "#3a1824"; rough = 0.34; who = "lace";
  } else if (kind === "suede") {
    pal = col ? palOf(col) : { base: "#b8322e", shade: "#7e1f1f", light: "#d65a50" }; const k = (S.h ?? 0.20) / 0.20; K = [0.743 * k, 0.667 * k, 0.708 * k]; sole = "#3a2a22"; rough = 1; who = "kid";
  } else if (kind === "rubber") { pal = palOf(col || NAMED.moss); K = u(0.28, 0.30); sole = "#1f2428"; rough = 0.24; who = "lane"; }
  else { pal = palOf(col || NAMED.sky); K = u(0.18, 0.30); sole = "#4a3a30"; rough = 1; who = "lane"; }   // furtrim: suede with a fleece roll
  H = G.H * K[1];
  return { kind, who, pal, K, sole, rough, H, dots: S.dots || 0, key: `${kind}|${who}|${pal.base}|${K.map((v) => v.toFixed(3)).join(",")}|${S.dots || 0}` };
}

// ---- small shared geometry, made once
const memoG = new Map();
const geo = (key, fn) => { if (!memoG.has(key)) memoG.set(key, fn()); return memoG.get(key); };
function lumpGeo(sx, sy, sz, seed, det = 2) {
  const g = new THREE.IcosahedronGeometry(1, det), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.20 * Math.sin(x * 5.1 + seed) * Math.sin(y * 4.3 + seed * 1.7) + 0.12 * Math.sin(z * 6.7 + seed * 2.3) * Math.cos(x * 3.9); p.setXYZ(i, x * f * sx, y * f * sy, z * f * sz); }
  g.computeVertexNormals(); return g;
}
function tuftsGeo(n, k, y, off, w, h, lean = 0) {   // n cream wool tufts round the rim, each 3 lumps
  const parts = [];
  for (let i = 0; i < n; i++) {
    const b = TAU * (i + 0.2 * (rr(i * 3.3 + k) - 0.5)) / n, p = shaftPt(b, y, off - 0.0025 * rr(i * 2.1)), sc = 0.85 + 0.3 * rr(i * 4.7 + k);
    for (const [dx, dy, s] of [[0, 0.5, 1], [-0.5, 0.2, 0.7], [0.5, 0.25, 0.75]]) {
      const g = lumpGeo(w * s * sc, h * s * sc, w * s * sc, i * 1.7 + dy + k, 1), t = new THREE.Vector3(-p[4], 0, p[3]);
      g.translate(p[0] + t.x * dx * w * 1.2 + p[3] * lean * h, p[1] + dy * h, p[2] + t.z * dx * w * 1.2 + p[4] * lean * h); parts.push(g);
    }
  }
  return mergeGeometries(parts);
}
function stitchGeo(list, r = 0.0011, len = 0.006) {
  return mergeGeometries(list.map((s) => { const c = new THREE.Vector3(...s.p), d = new THREE.Vector3(...s.d).normalize().multiplyScalar(len / 2); return capsule(c.clone().sub(d), c.clone().add(d), r, 5); }));
}
// the front-most surface point of the felt boot at x, y (shaft front or the vamp), z
function frontZ(x, y) {
  const r = shaftR(y); let zs = -9; if (Math.abs(x) < r.rx) zs = r.zc + r.rz * Math.pow(1 - Math.pow(Math.abs(x) / r.rx, G.n), 1 / G.n);
  let zf = -9; for (let z = G.zf - 0.006; z > 0.03; z -= 0.0015) if (footTop(x, z) >= y) { zf = z; break; }
  return Math.max(zs, zf);
}
// sock/fleece band: a stadium tube round the cuff (height 2 hy, thick ny), ribs: n ribs standing 1.6 mm
function bandGeo(hy, ny, yc, ribs = 0, off = 0.0045) {
  const NA = 16, NU = 96;
  return loft(NU, NA, (i, j) => {
    const b = TAU * i / NU, a = TAU * j / NA, p = shaftPt(b, yc, off), ca = Math.cos(a), sa = Math.sin(a);
    const rib = ribs ? 0.0032 * Math.pow(0.5 + 0.5 * Math.cos(ribs * b + 6 * sa), 1.4) : 0, pw = Math.pow(Math.abs(ca), 0.7) * Math.sign(ca), qw = Math.pow(Math.abs(sa), 0.8) * Math.sign(sa);
    return { p: [p[0] + p[3] * (ny * pw + rib * Math.max(0, ca)), yc + hy * qw, p[2] + p[4] * (ny * pw + rib * Math.max(0, ca))], uv: [i / NU, j / NA] };
  }, [NU / 4, [1, 0, 0]]);
}

// ============================================================================================================ THE STICKS
const BIRCH = "#ece6d8", BDASH = "#3a2e26", BTWIG = "#4a3424", TWINE = "#b89a62";
function barkTex() {   // 7 columns, one per stick: bark with 5-8 dark dashes (lenticels) each
  return memo("bark", () => canvasTex(7 * 64, 256, (g, W, H) => {
    g.fillStyle = BIRCH; g.fillRect(0, 0, W, H);
    for (let c = 0; c < 7; c++) {
      const x0 = c * 64;
      for (let i = 0; i < 6; i++) { g.strokeStyle = `rgba(190,182,162,${0.25 + 0.2 * rr(c * 9 + i)})`; g.lineWidth = 1.2; g.beginPath(); const x = x0 + 4 + rr(c * 7 + i * 3) * 56; g.moveTo(x, 0); g.lineTo(x + (rr(i + c) - 0.5) * 3, H); g.stroke(); }
      const nd = 5 + (c % 4);   // 5, 6, 7, 8, 5, 6, 7 dashes
      for (let i = 0; i < nd; i++) { const y = H * (0.06 + 0.88 * (i + 0.5 * rr(c * 5 + i)) / nd), x = x0 + 6 + rr(c * 11 + i * 2) * 36, w = 10 + 18 * rr(c * 13 + i); g.fillStyle = BDASH; g.beginPath(); g.ellipse(x + w / 2, y, w / 2, 2.1, 0, 0, TAU); g.fill(); }
    }
  }));
}
function stickParts(i) {   // one birch stick 0.50 long, butt at the origin, pointing +y: bark to 0.34, then dark twigs forking once, 2 buds
  const bark = new THREE.CylinderGeometry(0.0052, 0.0090, 0.34, 10, 6), uv = bark.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, (i + uv.getX(q)) / 7); bark.translate(0, 0.17, 0);
  const lean = (rr(i * 3.1) - 0.5) * 0.02, tw = tubeThrough([[0, 0.335, 0], [lean * 0.4, 0.40, 0.003], [lean, 0.47, 0.005], [lean * 1.4, 0.50, 0.003]], 0.0030, 12, 5);
  const fk = tubeThrough([[lean * 0.4, 0.395, 0.002], [0.013, 0.43, 0.004], [0.026, 0.463, 0.007]], 0.0020, 10, 5);
  const b1 = new THREE.SphereGeometry(0.0034, 8, 6).translate(lean * 1.4, 0.503, 0.003), b2 = new THREE.SphereGeometry(0.0030, 8, 6).translate(0.027, 0.466, 0.007);
  return { bark, twig: mergeGeometries([tw, fk, b1, b2]) };
}
function curlGeo() { const g = new THREE.CylinderGeometry(0.0055, 0.0055, 0.026, 12, 1, true, 0, 4.4); return g; }

// ============================================================================================================ THE BOOT
const HEAP = [   // [type, x, y(centre above the cuff), z, rx, ry, rz]: 7 coins, 3 mandarins, 4 walnuts, in arrival order
  ["walnut", -0.020, -0.034, 0.016, 0.3, 0.5, 0], ["coin", 0.026, -0.030, -0.010, 0.6, 0.2, 0.3], ["mandarin", -0.016, -0.020, -0.012, 0, 0, 0], ["walnut", 0.030, -0.004, 0.022, 0.2, 1.1, 0.4],
  ["coin", 0.030, 0.000, -0.020, 1.5708, 0.27, 0], ["mandarin", 0.022, 0.020, 0.000, 0, 0.8, 0], ["coin", -0.030, 0.014, 0.024, 0.7, 0.4, 0.2], ["walnut", -0.028, 0.034, -0.016, 0.5, 0.2, 0.7],
  ["coin", 0.000, 0.040, 0.032, 1.5708, -0.44, 0], ["coin", -0.002, 0.034, -0.034, -0.5, 0.9, 0], ["walnut", 0.034, 0.040, 0.020, 0.1, 0.3, 0.2], ["mandarin", -0.022, 0.042, 0.000, 0, 2.2, 0],
  ["coin", 0.010, 0.046, -0.012, 0.9, 0.5, 0.1], ["coin", 0.026, 0.042, 0.034, 0.5, 1.9, 0.3],
];
const HALF = { coin: COIN_T / 2, mandarin: 0.0255, walnut: WAL.h };
const BUNCH = [   // the 7 sticks: [azimuth deg, tilt deg, lean-out?]: a vertical one, 4 fanned 7 degrees (14 across), 2 leaning further out
  [0, 0, 0], [45, 7, 0], [135, 7, 0], [225, 7, 0], [315, 7, 0], [20, 10, 1], [200, 9, 1],
];

function buildBoot(P) {
  const S = P.spec, cfg = resolve(S), K = cfg.K, pal = cfg.pal, kind = cfg.kind, who = cfg.who, W = P.whole, tints = [];
  const tm = (m, sat = false) => { tints.push({ m, base: m.color.clone(), sat }); return m; };
  const bodyM = tm(mat(pal.base, { roughness: cfg.rough }), true), innerM = tm(mat(darken(pal.base, 0.38), { roughness: 1 })), soleM = tm(mat(cfg.sole, { roughness: 0.8 }));
  const cream = tm(thread("#efe6cf")), fleece = tm(mat("#f4efe4", { roughness: 1 }));
  const bootG = new THREE.Group(); bootG.scale.set(K[0], K[1], K[2]); W.add(bootG);
  const footG = new THREE.Group(); bootG.add(footG);
  const pivG = new THREE.Group(); pivG.position.set(0, G.yA, G.z0); bootG.add(pivG);
  const shaftG = new THREE.Group(); shaftG.position.set(0, -G.yA, -G.z0); pivG.add(shaftG);
  const SG = geo("shaft", () => shaftGeo(false)), FG = geo("foot", footGeo), RG = geo("roll", () => rollGeo());
  mesh(SG, bodyM, shaftG); mesh(FG, bodyM, footG);
  const innerMesh = mesh(geo("inner", () => shaftGeo(true)), innerM, shaftG); innerMesh.castShadow = false; mesh(geo("floor", floorGeo), innerM, shaftG).castShadow = false;
  const ov = (parent, g0, tex, off, o = {}, sat = false) => { const m = tm(decal(tex, o)), me = new THREE.Mesh(offsetGeo(g0, off), m); me.castShadow = me.receiveShadow = false; parent.add(me); return { me, m }; };

  // ---- the cuff
  if (kind === "felt" || kind === "rubber") mesh(RG, bodyM, shaftG);
  if (kind === "felt") mesh(geo(`tufts16`, () => tuftsGeo(16, 1, G.H - 0.004, -0.001, 0.0062, 0.0085)), fleece, shaftG);
  if (kind === "suede" || kind === "furtrim") { mesh(geo("fleeceband", () => bandGeo(0.0205, 0.0078, G.H - 0.0215, 0, 0.0035)), fleece, shaftG); mesh(geo("tufts22", () => tuftsGeo(22, 2, G.H - 0.003, 0.001, 0.0070, 0.0095)), fleece, shaftG); }
  if (kind === "leather") mesh(geo("sock", () => bandGeo(0.0205, 0.0092, G.H - 0.0205, 12, 0.0045)), tm(mat("#f4f1ea", { roughness: 1 })), shaftG);
  // ---- the sole
  if (kind === "leather") {
    mesh(geo("sole-l", () => soleGeo(0.010, G.th)), soleM, footG);
    mesh(geo("heel-l", () => { const pts = planPts(120, 0).filter(([, z]) => z < G.zb + 0.07), s = new THREE.Shape(); pts.forEach(([x, z], i) => s[i ? "lineTo" : "moveTo"](x, -z)); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.0092, bevelEnabled: true, bevelSize: 0.001, bevelThickness: 0.001, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, 0.001, 0); return g; }), tm(mat("#4a1c2c", { roughness: 0.7 })), footG);   // the stacked heel 0.02 (0.010 under the sole + the sole's own)
  } else {
    mesh(geo("sole", () => soleGeo(0, G.th)), soleM, footG);
    if (kind === "rubber") {
      mesh(geo("outsole", () => soleGeo(0, 0.008, 0.0012)), tm(mat("#14181b", { roughness: 0.9 })), footG);
      const lugs = walk(planPts(120, 0.0012), 22).pts.map((s) => { const nx = s.t[1], nz = -s.t[0]; return { p: [s.p[0] + nx * 0.0006, 0.004, s.p[1] + nz * 0.0006], d: [nx, 0, nz] }; });
      mesh(geo("lugs", () => stitchGeo(lugs, 0.0026, 0.004)), tm(mat("#14181b", { roughness: 0.9 })), footG);
    }
  }
  if (who === "chip") mesh(geo("stripe", () => soleGeo(0.0075, 0.0145, 0.0008)), tm(mat("#b43a23", { roughness: 0.7 })), footG);
  // ---- stitches: felt 38 (19 up the back + 19 round the vamp) and the welt 44; leather welt 40
  if (kind === "felt") {
    mesh(geo("stitch38", () => {
      const back = walk([[0, 0.262], [0, 0.100]], 19, false).pts.map((s) => { const p = shaftPt(0, s.p[1], 0.0006); return { p: [p[0], p[1], p[2]], d: [1, 0, 0] }; });
      const arc = []; for (let i = 0; i <= 48; i++) { const f = Math.PI * i / 48; arc.push([-0.046 * Math.cos(f), 0.060 + 0.060 * Math.sin(f)]); }
      const vamp = walk(arc, 19, false).pts.map((s) => { const x = s.p[0], z = s.p[1], y = footTop(x, z) + 0.0006, n = footNormal(x, z), T = new THREE.Vector3(s.t[0], (footTop(x + s.t[0] * 0.002, z + s.t[1] * 0.002) - footTop(x - s.t[0] * 0.002, z - s.t[1] * 0.002)) / 0.004, s.t[1]).normalize(), d = new THREE.Vector3().crossVectors(n, T).normalize(); return { p: [x, y, z], d: [d.x, d.y, d.z], n }; });
      const th = [tubeThrough(back.map((s) => s.p), 0.0005, 24, 4), tubeThrough(vamp.map((s) => [s.p[0] + s.n.x * 0.0003, s.p[1] + s.n.y * 0.0003, s.p[2] + s.n.z * 0.0003]), 0.0005, 40, 4)];
      return mergeGeometries([stitchGeo(back), stitchGeo(vamp), ...th]);
    }), cream, footG);
  }
  if (kind === "felt" || kind === "leather") {
    const n = kind === "felt" ? 44 : 40;
    mesh(geo(`welt${n}`, () => stitchGeo(walk(planPts(120, 0.0006), n).pts.map((s) => { const nx = s.t[1], nz = -s.t[0]; return { p: [s.p[0] + nx * 0.0004, G.th, s.p[1] + nz * 0.0004], d: [0, 1, 0] }; }), 0.0010, 0.0055)), cream, footG);
  }
  // ---- felt extras: the pull loop at the back; Chip's cord tied in a bow with 2 ends of 0.05
  if (kind === "felt" || kind === "rubber") {
    const zb = G.z0 - G.rzC;
    const loop = tubeThrough([[0, G.H - 0.026, zb - 0.0205], [0, G.H - 0.006, zb - 0.0240], [0, G.H + 0.016, zb - 0.0170], [0, G.H + 0.0255, zb - 0.0020], [0, G.H + 0.014, zb + 0.0130], [0, G.H - 0.006, zb + 0.0140]], 0.0036, 24, 6);
    mesh(loop, bodyM, shaftG).scale.x = 2.3;
  }
  if (kind === "rubber") {   // the pull tab: a flat tab on the back of the rim
    const zb = G.z0 - G.rzC; const tab = mesh(new THREE.BoxGeometry(0.022, 0.034, 0.0035), bodyM, shaftG, 0, G.H - 0.004, zb - 0.0225); tab.rotation.x = 0.06;
  }
  if (who === "chip") {
    const yc = G.H - 0.040, pts = []; for (let i = 0; i < 96; i++) { const p = shaftPt(TAU * i / 96, yc, 0.0022); pts.push([p[0], p[1], p[2]]); }
    mesh(tubeThrough(pts, 0.0022, 200, 6, true), cream, shaftG);
    const bb = Math.PI + 0.95, p0 = shaftPt(bb, yc, 0.0026), nn = new THREE.Vector3(p0[3], 0, p0[4]), tt = new THREE.Vector3(-p0[4], 0, p0[3]), up = new THREE.Vector3(0, 1, 0);
    const L = (a, b, c) => [p0[0] + tt.x * a + nn.x * c, p0[1] + b, p0[2] + tt.z * a + nn.z * c];
    const parts = [new THREE.SphereGeometry(0.0036, 10, 8).translate(...L(0, 0, 0.0026))];
    for (const s of [-1, 1]) {
      parts.push(tubeThrough([L(0, 0, 0.003), L(s * 0.007, 0.010, 0.005), L(s * 0.016, 0.0105, 0.004), L(s * 0.0205, 0.002, 0.0035), L(s * 0.014, -0.004, 0.0035), L(s * 0.004, -0.001, 0.003)], 0.0021, 30, 6));   // the 2 loops
      parts.push(tubeThrough([L(s * 0.002, -0.002, 0.003), L(s * 0.004, -0.014, 0.004), L(s * 0.007, -0.031, 0.0035), L(s * 0.0085, -0.052, 0.003)], 0.0021, 20, 6));   // the 2 ends, 0.05 long
    }
    mesh(mergeGeometries(parts), cream, shaftG);
  }
  if (kind === "suede") {   // 2 white pompoms r 0.018 on cords
    for (const s of [-1, 1]) {
      const b = Math.PI + s * 0.30, p0 = shaftPt(b, G.H - 0.030, 0.003), p1 = shaftPt(b + s * 0.05, G.H - 0.062, 0.016), p2 = shaftPt(b + s * 0.08, G.H - 0.082, 0.020);
      mesh(tubeThrough([[p0[0], p0[1], p0[2]], [p1[0], p1[1], p1[2]], [p2[0], p2[1] + 0.006, p2[2]]], 0.0013, 12, 5), cream, shaftG);
      mesh(geo("pom", () => lumpGeo(0.018, 0.018, 0.018, 4.4, 2)), fleece, shaftG, p2[0], p2[1] - 0.008, p2[2]);
    }
  }
  if (kind === "leather") {   // 7 pairs of brass eyelets, cream laces criss-crossed, a double bow, the tongue
    const brass = tm(mat("#c79a3a", { roughness: 0.3, metalness: 0.15 })), ys = Array.from({ length: 7 }, (_, k) => 0.105 + 0.0175 * k), gx = 0.0125;
    const surf = (x, y) => { const z = frontZ(x, y), e = 0.0012, fx = (frontZ(x + e, y) - frontZ(x - e, y)) / (2 * e), fy = (frontZ(x, y + e) - frontZ(x, y - e)) / (2 * e); return { p: new THREE.Vector3(x, y, z), n: new THREE.Vector3(-fx, -fy, 1).normalize() }; };
    const eyes = [], eg = new THREE.TorusGeometry(0.0034, 0.0011, 6, 14), laces = [];
    ys.forEach((y, k) => { for (const sx of [-1, 1]) { const q = surf(sx * gx, y), g = eg.clone(); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), q.n)); g.translate(q.p.x + q.n.x * 0.0006, q.p.y + q.n.y * 0.0006, q.p.z + q.n.z * 0.0006); eyes.push(g); } });
    mesh(mergeGeometries(eyes), brass, footG);
    const at = (x, y, o) => { const q = surf(x, y); return [q.p.x + q.n.x * o, q.p.y + q.n.y * o, q.p.z + q.n.z * o]; };
    for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) laces.push(tubeThrough([at(sx * gx, ys[k], 0.0030), at(0, (ys[k] + ys[k + 1]) / 2, 0.0050), at(-sx * gx, ys[k + 1], 0.0030)], 0.0016, 10, 5));
    laces.push(tubeThrough([at(-gx, ys[0], 0.003), at(0, ys[0] - 0.001, 0.0045), at(gx, ys[0], 0.003)], 0.0016, 8, 5));
    const top = surf(0, ys[6] + 0.002), c = [top.p.x + top.n.x * 0.005, top.p.y + top.n.y * 0.005, top.p.z + top.n.z * 0.005];
    const Q = (a, b, o = 0.0) => [c[0] + a, c[1] + b, c[2] + o];
    laces.push(new THREE.SphereGeometry(0.0034, 8, 6).translate(...Q(0, 0, 0.001)));
    for (const [ang, sc] of [[0.35, 1], [-0.2, 0.78]]) for (const s of [-1, 1]) {   // the double bow: 2 bows, 4 loops
      const R = (a, b) => { const ca = Math.cos(ang * s), sa = Math.sin(ang * s); return Q((a * ca - b * sa) * sc, (a * sa + b * ca) * sc, 0.0008 * s * s + (sc < 1 ? 0.0012 : 0)); };
      laces.push(tubeThrough([R(0, 0), R(s * 0.007, 0.009), R(s * 0.016, 0.0095), R(s * 0.020, 0.0015), R(s * 0.013, -0.004), R(s * 0.003, -0.001)], 0.0016, 24, 5));
    }
    laces.push(tubeThrough([Q(-0.002, -0.002), Q(-0.006, -0.016, 0.002), Q(-0.011, -0.031, 0.003)], 0.0016, 12, 5), tubeThrough([Q(0.002, -0.002), Q(0.007, -0.014, 0.002), Q(0.010, -0.027, 0.003)], 0.0016, 12, 5));
    mesh(mergeGeometries(laces), tm(thread("#f1e8d2")), footG);
    const tongue = mesh(new THREE.BoxGeometry(0.030, 0.050, 0.0042), tm(mat(pal.shade, { roughness: 0.4 })), shaftG, 0, G.H - 0.002, G.z0 + G.rzC - 0.0105); tongue.rotation.x = -0.12;
  }
  // ---- painted layers: the nap (felt), the dressing, the polish, the glint
  const fibM = [];
  const fuzzO = [];   // the fuzz shell (felt only): shown until the polish takes over
  if (kind === "felt") {
    fibM.push(ov(shaftG, SG, fibreTex("shaft"), 0.0003).m, ov(footG, FG, fibreTex("foot"), 0.0003).m);
    const fz = { color: lighten(pal.base, 0.09), transparent: false, alphaTest: 0.5, depthWrite: true, roughness: 1 };
    fuzzO.push(ov(shaftG, SG, fuzzTex("shaft"), 0.0016, fz).me, ov(footG, FG, fuzzTex("foot"), 0.0016, fz).me);
  }
  ov(shaftG, SG, decoTex("shaft", cfg), 0.0006); ov(footG, FG, decoTex("foot", cfg), 0.0006);
  const shineM = [ov(shaftG, SG, shineTex("shaft", K), 0.0014).m, ov(footG, FG, shineTex("foot", K), 0.0014).m];
  if (kind === "felt" || kind === "rubber") shineM.push(ov(shaftG, RG, rollShineTex(), 0.0005).m);
  const gt = glintTex(), gm = tm(decal(gt, { blending: THREE.AdditiveBlending, opacity: 0 })), gl = new THREE.Mesh(offsetGeo(SG, 0.0020), gm); gl.visible = false; gl.castShadow = false; shaftG.add(gl);
  // ---- the mud: canvases made when it first shows; the crust on the sole rim, 2 straws, a leaf (3D), 12 crumbs
  let mudS = null, mudF = null, mudKey = "", mudOv = null;
  const mudMat = tm(mat("#6a5740", { roughness: 0.95, vertexColors: true })), crust = new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Array(9).fill(0), 3)).setAttribute("color", new THREE.Float32BufferAttribute(new Array(9).fill(1), 3)), mudMat); crust.castShadow = true; crust.visible = false; footG.add(crust);
  const strawM = tm(mat("#c9a45c", { roughness: 0.9 })), leafM = tm(mat("#6a4a2a", { roughness: 0.9, side: THREE.DoubleSide }));
  const straws = [1, 5].map((pi, q) => { const it = MUD[pi], y = footTop(it.x, it.z), n = footNormal(it.x, it.z), g = new THREE.CylinderGeometry(0.0008, 0.0008, 0.036, 5); g.translate(0, 0.018, 0); const m = mesh(g, strawM, footG, it.x, y - 0.002, it.z); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x + (q ? 0.7 : -0.6), n.y * 0.8, n.z + 0.3).normalize()); return { m, pi }; });
  const leaf = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.004, 0.006, 0.013, 0.006, 0.026, 0); sh.bezierCurveTo(0.013, -0.006, 0.004, -0.006, 0, 0); const it = MUD[3], n = footNormal(it.x, it.z), m = mesh(new THREE.ShapeGeometry(sh, 8), leafM, footG, it.x - 0.01, footTop(it.x, it.z) + 0.0016, it.z); m.castShadow = false; m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); m.rotateZ(0.6); return m; })();
  const crumbs = Array.from({ length: 12 }, (_, j) => {
    const src = MUD[j % 6], y0 = footTop(src.x, src.z), a = rr(j * 3.7 + 2) * TAU, rad = 0.075 + 0.07 * rr(j * 5.1 + 3), sz = 0.0028 + 0.0034 * rr(j * 7.3 + 4);
    const m = mesh(lumpGeo(sz, sz * 0.75, sz, j * 2.3, 1), tm(mat(j % 4 === 3 ? "#8a6e48" : "#5a4226", { roughness: 1 })), W);
    return { m, from: [src.x * K[0], y0 * K[1], src.z * K[2]], to: [Math.cos(a) * rad, sz * 0.7, 0.05 + Math.sin(a) * rad * 0.9], at: 0.9 - 0.78 * j / 11 };
  });
  const crumbOn = S.mud !== undefined;   // only a boot that was given mud drops crumbs
  const rebuildCrust = (m) => {
    const pts = planPts(96, 0.0010), NS = pts.length, NA = 7, w = walk(pts, NS).pts, col = [];
    const g = loft(NS, NA, (i, j) => { const k = i % NS, s = w[k], q = Math.min(s.q, 1 - s.q) * 2, f = ss((m - 0.73 * (1 - q)) / 0.27), r = 0.0062 * f * (0.7 + 0.55 * rr(k * 3.3 + 1)), a = TAU * j / NA, nx = s.t[1], nz = -s.t[0]; return { p: [s.p[0] + nx * r * Math.cos(a) * 0.9, G.th + 0.002 + r * Math.sin(a), s.p[1] + nz * r * Math.cos(a) * 0.9], uv: [i / NS, j / NA] }; }, [Math.floor(NS / 4) * 1 + 0, [0, 1, 0]]);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const c = new THREE.Color("#6e5b42").lerp(new THREE.Color("#a08c6c"), rr(i * 1.7) * 0.7); col.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); crust.geometry.dispose(); crust.geometry = g;
  };
  const ensureMud = () => {
    if (mudS) return; const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    mudS = mk(SW, SH); mudF = mk(FW, FH);
    mudOv = [ov(shaftG, SG, mudS, 0.0019), ov(footG, FG, mudF, 0.0019)];
  };

  // ---- the sticks and the treats (loose parts standing in the boot's mouth, in the boot's own metres)
  const cuffY = G.H * K[1], axZ = G.z0 * K[2], ri = (G.rxC - G.wall) * K[0] * 0.98;
  const sticksG = new THREE.Group(); sticksG.position.set(0, cuffY, axZ); W.add(sticksG);
  const barkM = tm(mat("#ffffff", { roughness: 0.8, map: barkTex() })), twigM = tm(mat(BTWIG, { roughness: 0.9 })), twineM = tm(mat(TWINE, { roughness: 0.95 }));
  const bunch = new THREE.Group(); sticksG.add(bunch);
  const yT = 0.06;   // the twine is 0.06 above the cuff; the butts stand 0.30 below it
  BUNCH.forEach(([az, tilt, out], i) => {
    const sp = stickParts(i), st = new THREE.Group(), a = az * DEG, t = tilt * DEG;
    mesh(sp.bark, barkM, st); mesh(sp.twig, twigM, st);
    if (!out) { const d = new THREE.Vector3(Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); st.position.set(0, yT, 0).addScaledVector(d, -0.30); }
    else { const d = new THREE.Vector3(Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); st.position.set(Math.cos(a) * 0.012, -0.24, Math.sin(a) * 0.012); }
    bunch.add(st);
  });
  for (let q = 0; q < 3; q++) mesh(new THREE.TorusGeometry(0.0148, 0.0018, 6, 20), twineM, bunch, 0, yT - 0.0046 + q * 0.0046, 0).rotation.x = Math.PI / 2;   // 3 turns of twine
  mesh(new THREE.SphereGeometry(0.0034, 8, 6), twineM, bunch, 0.0, yT, 0.0158);
  const barkCurlM = new THREE.MeshStandardMaterial({ color: BIRCH, roughness: 0.8, side: THREE.DoubleSide });   // 3 curls of peeling bark stay on the bunch
  [[0.085, 0.4], [0.16, 2.6], [0.03, 4.4]].forEach(([y, ang], q) => { const c = mesh(curlGeo(), tm(barkCurlM), bunch, Math.cos(ang) * 0.011, yT + y, Math.sin(ang) * 0.011); c.rotation.set(0.2 * q, ang, 0.5 - 0.2 * q); c.castShadow = false; });
  const fallC = [0, 1].map((q) => { const c = mesh(curlGeo(), tm(barkCurlM), sticksG); c.castShadow = false; return { c, q }; });   // 2 more curls fall when the sticks settle
  const heapG = new THREE.Group(); heapG.position.set(0, cuffY, axZ); W.add(heapG);
  const sc = clamp(ri / 0.0555, 0.55, 1.2), heap = HEAP.map(([type, x, y, z, rx, ry, rz], i) => {
    let coinN = 0; for (let q = 0; q < i; q++) if (HEAP[q][0] === "coin") coinN++;
    const t = makeTreat(type, { n: coinN, stem: i === 11 }), wrap = new THREE.Group(), inner = t.group; inner.position.y = -HALF[type]; wrap.add(inner);
    wrap.rotation.set(rx, ry, rz); wrap.visible = false; heapG.add(wrap); return { wrap, x: x * sc, y, z: z * sc, rx, ry, rz, i };
  });

  const state = { shade: -1, shine: -1, mudK: "", drK: -1 };
  const hsl = { h: 0, s: 0, l: 0 };
  return {
    grip: 0,
    apply(ps, t) {
      const mud = clamp(ps.mud ?? S.mud ?? 0), shine = clamp(kind === "leather" && S.shine === undefined ? 1 : (ps.shine ?? S.shine ?? 0)), shade = clamp(ps.shade ?? 0), glint = clamp(ps.glint ?? 0), droop = clamp(ps.droop ?? 0), stk = clamp(ps.sticks ?? 0), trt = clamp(ps.treats ?? 0);
      const tk = `${Math.round(shade * 40)}|${Math.round(shine * 40)}`;
      if (tk !== state.tk) {   // the polish makes the base 6 % more saturated; the shadow is 45 % darker and cooler
        state.tk = tk; const sd = Math.round(shade * 40) / 40, sh = Math.round(shine * 40) / 40, tint = new THREE.Color(1 - 0.55 * sd, 1 - 0.47 * sd, 1 - 0.38 * sd);
        for (const e of tints) { e.m.color.copy(e.base); if (e.sat) { e.m.color.getHSL(hsl); e.m.color.setHSL(hsl.h, Math.min(1, hsl.s * (1 + 0.22 * sh)), hsl.l * (1 - 0.13 * sh)); } e.m.color.multiply(tint); }
        for (const m of fibM) m.opacity = 1 - 0.88 * sh; for (const m of shineM) m.opacity = sh; for (const o of fuzzO) o.visible = sh < 0.5;
        if (kind === "felt") bodyM.roughness = 1 - 0.8 * sh; else if (kind === "leather") bodyM.roughness = 0.34 - 0.14 * sh;
      }
      pivG.rotation.x = droop * 70 * DEG;
      gl.visible = glint > 0.001 && glint < 0.999; gm.opacity = 0.75 * ss(Math.min(glint, 1 - glint) * 5); gt.offset.x = 0.5 - lerp(0.64, 0.36, glint); gt.repeat.set(1, 1);
      // mud
      const mk = `${Math.round(mud * 48)}`; if (mk !== mudKey) {
        mudKey = mk; const m = Math.round(mud * 48) / 48;
        if (m > 0.004) { ensureMud(); drawMud(mudS.image.getContext("2d"), mudF.image.getContext("2d"), m); mudS.needsUpdate = mudF.needsUpdate = true; rebuildCrust(m); }
        if (mudOv) for (const o of mudOv) o.me.visible = m > 0.004; crust.visible = m > 0.004;
        for (const s of straws) { const f = mudFrac(m, s.pi, 9); s.m.visible = f > 0.3; s.m.scale.setScalar(f); }
        leaf.visible = mudFrac(m, 3, 9) > 0.3; leaf.scale.setScalar(mudFrac(m, 3, 9));
        crumbs.forEach((c) => {   // fall to the step and stay
          const p = clamp((c.at - m) / 0.08); c.m.visible = crumbOn && p > 0.001; const e = p * p; c.m.position.set(lerp(c.from[0], c.to[0], p), lerp(c.from[1], c.to[1], e) + 0.012 * Math.sin(Math.PI * p) * (1 - p), lerp(c.from[2], c.to[2], p)); c.m.rotation.set(p * 5, p * 3, 0);
        });
      }
      // sticks: butts down in the boot, a 4-frame settle with 3 degrees of shake, 2 bark curls fall
      sticksG.visible = stk > 0.002;
      if (sticksG.visible) {
        const e = ss(stk / 0.7), drop = 0.07 * (1 - e) * (1 - e), shake = 3 * Math.sin(Math.PI * stk) * Math.sin(TAU * 1.5 * stk) * DEG;
        bunch.position.y = drop; bunch.rotation.z = shake; bunch.rotation.x = shake * 0.5;
        for (const { c, q } of fallC) { const p = clamp((stk - 0.35 - 0.1 * q) / 0.6), end = [q ? -0.085 : 0.07, -cuffY + 0.0075, q ? 0.06 : -0.075], st = [q ? 0.009 : -0.011, 0.14 + 0.06 * q, 0.008]; c.visible = p > 0.001 && stk > 0.35; c.position.set(lerp(st[0], end[0], p), lerp(st[1], end[1], p * p), lerp(st[2], end[2], p)); c.rotation.set(p * 6 + q, p * 4, p * 2 + 1.2 * (1 - p)); }
      }
      // treats: a heap rising to 0.07 above the cuff, the pieces arriving in index order
      const NP = heap.length, win = 0.2;
      for (const h of heap) {
        const a = (h.i / NP) * (1 - win), p = clamp((trt - a) / win); h.wrap.visible = p > 0.001;
        if (h.wrap.visible) { const fall = 1 - p * p; h.wrap.position.set(h.x + 0.012 * fall * (rr(h.i * 2.1) - 0.5), h.y + 0.12 * fall, h.z); h.wrap.rotation.set(h.rx + fall * (rr(h.i * 3.3) - 0.5) * 2, h.ry + fall * 1.5, h.rz); }
      }
    },
  };
}

// ============================================================================================================ THE CRAYON DRAWINGS
const PAPER = { spud: { w: 0.150, h: 0.200, base: "#9fe0d4" }, chip: { w: 0.185, h: 0.165, base: "#fff09a" } };
const PAPER_SELF = 0.9;   // the paper carries its own colour: 90 % of it is self-light, so it holds its hue under the lantern
const BROWN = "#5a3a22", GOLD = "#e2a95c", PPM = 4400;
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const OVERSHOOT = new Set([6, 17, 31]);   // the 7th, 18th and 32nd stroke of a drawing run 2-4 mm over the outline: 3 places
function hatch(g, poly, color, st, o = {}) {   // wax strokes 4-6 mm wide, ~15 % of the paper showing, darker at each stroke's end
  const ang = o.ang ?? 0.8, w = o.w ?? 0.0050, step = o.step ?? w * 1.12, al = o.alpha ?? 0.92, c = [0, 0]; let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  c[0] = (x0 + x1) / 2; c[1] = (y0 + y1) / 2; const R = Math.hypot(x1 - x0, y1 - y0) / 2, dx = Math.cos(ang), dy = Math.sin(ang);
  g.lineCap = "round";
  for (let i = -Math.floor(R / step); i <= Math.floor(R / step); i++) {
    const off = i * step + (rr(st.n * 2.7 + i) - 0.5) * step * 0.3, bx = c[0] - dy * off, by = c[1] + dx * off; let run = null;
    for (let t = -R; t <= R + 0.0004; t += 0.0004) {
      const inside = inPoly(poly, bx + dx * t, by + dy * t);
      if (inside && !run) run = [t, t]; else if (inside) run[1] = t;
      if ((!inside || t >= R) && run) {
        const ex = OVERSHOOT.has(st.n) ? 0.002 + 0.002 * rr(st.n * 1.3) : 0, a = run[0] - 0.0006 * rr(st.n + 1), b = run[1] + 0.0006 * rr(st.n + 2) + ex, ww = w * (0.86 + 0.28 * rr(st.n * 4.1));
        g.strokeStyle = color; g.globalAlpha = al * (0.88 + 0.12 * rr(st.n * 5.3)); g.lineWidth = ww; g.beginPath(); g.moveTo(bx + dx * a, by + dy * a); g.lineTo(bx + dx * b, by + dy * b); g.stroke();
        g.globalAlpha = 0.16; g.fillStyle = "#000"; for (const e of [a, b]) { g.beginPath(); g.arc(bx + dx * e, by + dy * e, ww * 0.42, 0, TAU); g.fill(); }
        g.globalAlpha = 1; st.n++; run = null;
      }
    }
  }
}
function crayonLine(g, pts, color, width, st, closed = false) {   // a wobbling brown wax line, drawn twice
  g.lineCap = g.lineJoin = "round";
  for (let pass = 0; pass < 2; pass++) {
    g.strokeStyle = color; g.globalAlpha = pass ? 0.55 : 0.95; g.lineWidth = width * (pass ? 0.7 : 1); g.beginPath();
    pts.forEach(([x, y], i) => { const wx = 0.00028 * Math.sin(i * 1.9 + pass * 2.1 + st.n), wy = 0.00028 * Math.cos(i * 1.3 + pass * 1.1); g[i ? "lineTo" : "moveTo"](x + wx, y + wy); });
    if (closed) g.closePath(); g.stroke();
  }
  g.globalAlpha = 1; st.n++;
}
const arcPts = (cx, cy, rx, ry, a0, a1, n = 24, rot = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
const eggPts = (cx, cy, a, b, n = 72) => Array.from({ length: n }, (_, i) => { const t = TAU * i / n; return [cx + a * Math.cos(t) * (1 - 0.10 * Math.sin(t)), cy + b * Math.sin(t)]; });
const leafPts = (cx, cy, L, Wd, rot) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([-L / 2 + L * t, Wd / 2 * Math.sin(Math.PI * t) * (1 - 0.25 * t)]); } for (let i = 16; i >= 0; i--) { const t = i / 16; pts.push([-L / 2 + L * t, -Wd / 2 * Math.sin(Math.PI * t) * (1 - 0.25 * t)]); } return pts.map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); };
function garment(cx, cy, a, b, round, k, zig, amp) {   // the lower arc of the figure up to the height where sin t = k, closed with a zigzag
  const al = Math.asin(k), tL = Math.PI - al, tR = TAU + al, pts = [], pt = (t) => round ? [cx + a * Math.cos(t), cy + b * Math.sin(t)] : [cx + a * Math.cos(t) * (1 - 0.10 * Math.sin(t)), cy + b * Math.sin(t)];
  for (let i = 0; i <= 40; i++) pts.push(pt(tL + (tR - tL) * i / 40));
  const xr = pts[pts.length - 1][0], xl = pts[0][0], yc = cy + b * k;
  for (let i = 1; i <= zig * 2; i++) pts.push([xr + (xl - xr) * i / (zig * 2), yc + (i % 2 ? amp : 0) * (i === zig * 2 ? 0 : 1)]);
  return pts;
}
function drawPaper(who) {
  const { w, h, base } = PAPER[who], W = Math.round(w * PPM), H = Math.round(h * PPM), spud = who === "spud", st = { n: 0 };
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { const q = g.createRadialGradient(rr(i * 3.1) * W, rr(i * 4.3) * H, 0, rr(i * 3.1) * W, rr(i * 4.3) * H, 0.05 * PPM); q.addColorStop(0, `rgba(${rr(i) < 0.5 ? "255,255,255" : "120,150,110"},0.10)`); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, W, H); }
  g.save(); g.setTransform(PPM, 0, 0, -PPM, W / 2, H / 2);
  g.lineCap = "round";
  for (let i = 0; i < 40; i++) {   // 40 fibre flecks
    const x = (rr(i * 2.3 + 1) - 0.5) * w, y = (rr(i * 3.7 + 2) - 0.5) * h, a = rr(i * 5.9) * TAU, l = 0.001 + 0.002 * rr(i * 7.1);
    g.strokeStyle = i % 3 ? "rgba(255,255,255,0.55)" : "rgba(110,100,70,0.28)"; g.lineWidth = 0.0004; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const cy = spud ? 0.000 : -0.002, cx = 0;
  if (spud) {
    const a = 0.040, b = 0.050, ey = cy - 0.006;
    hatch(g, arcPts(0, cy - b - 0.020, 0.058, 0.0055, 0, TAU, 20).map(([x, y]) => [x, y]), "#3f9a3a", st, { ang: 0.12, w: 0.0045 });   // a green ground scribble
    const cl = [[-0.056, 0.078, 0.0085], [-0.047, 0.0855, 0.0105], [-0.037, 0.0815, 0.0085], [-0.0285, 0.0775, 0.0065]], top = [];   // a white crayon cloud, top left: 4 bumps on a flat base
    for (let x = -0.0645; x <= -0.0220; x += 0.0012) { let y = 0.0715; for (const [bx, by, br] of cl) { const d = br * br - (x - bx) * (x - bx); if (d > 0) y = Math.max(y, by + Math.sqrt(d)); } top.push([x, y]); }
    hatch(g, [...top, [-0.0220, 0.0715], [-0.0645, 0.0715]], "#ffffff", st, { ang: 0.5, w: 0.0045, alpha: 0.9 }); crayonLine(g, top, "rgba(255,255,255,0.95)", 0.0020, st); crayonLine(g, [[-0.0645, 0.0715], [-0.0220, 0.0715]], "rgba(255,255,255,0.8)", 0.0016, st);
    for (const s of [-1, 1]) { const f = [[cx + s * 0.015, ey - b - 0.0065 + 0.052], 0]; hatch(g, arcPts(cx + s * 0.014, cy - b - 0.005, 0.0085, 0.0052, 0, TAU, 14), "#7a4a2a", st, { ang: 0.4, w: 0.0036 }); crayonLine(g, arcPts(cx + s * 0.014, cy - b - 0.005, 0.0085, 0.0052, 0, TAU, 14), BROWN, 0.0016, st, true); }   // 2 brown boot blobs
    const egg = eggPts(cx, cy, a, b), gar = garment(cx, cy, a, b, false, -0.1, 8, 0.0048);
    hatch(g, egg, GOLD, st, { ang: 0.9, w: 0.0052 }); hatch(g, gar, "#1f6f6c", st, { ang: 0.55, w: 0.0050, alpha: 0.95 });
    crayonLine(g, egg, BROWN, 0.0022, st, true); crayonLine(g, gar.slice(40), BROWN, 0.0016, st);
    const yc = cy + b * -0.1;   // 5 knit V marks and the rolled collar line
    g.strokeStyle = "#0e4543"; g.lineWidth = 0.0014; g.lineJoin = "round"; for (const [vx, vy] of [[-0.018, -0.010], [0, -0.010], [0.018, -0.010], [-0.009, -0.024], [0.009, -0.024]]) { g.beginPath(); g.moveTo(cx + vx - 0.0045, yc + vy + 0.0045); g.lineTo(cx + vx, yc + vy); g.lineTo(cx + vx + 0.0045, yc + vy + 0.0045); g.stroke(); }
    crayonLine(g, arcPts(cx, yc - 0.002, 0.020, 0.0065, Math.PI + 0.25, TAU - 0.25, 16), "#b8e6dc", 0.0018, st); crayonLine(g, arcPts(cx, yc - 0.0075, 0.021, 0.0065, Math.PI + 0.25, TAU - 0.25, 16), "#0e4543", 0.0014, st);
    for (const s of [-1, 1]) { const x0 = cx + s * 0.034, y0 = yc - 0.002, x1 = cx + s * 0.048, y1 = yc - 0.032; crayonLine(g, [[x0, y0], [x0 + s * 0.008, (y0 + y1) / 2], [x1, y1]], BROWN, 0.0020, st); for (let f = -1; f <= 1; f++) crayonLine(g, [[x1, y1], [x1 + s * 0.0035 * f + s * 0.0008, y1 - 0.0075]], BROWN, 0.0015, st); }   // stick arms down, rake hands of 3 fingers
    g.fillStyle = BROWN; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 0.0155, cy + 0.020, 0.0034, 0, TAU); g.fill(); }   // 2 dot eyes
    crayonLine(g, arcPts(cx, cy + 0.011, 0.0085, 0.0045, Math.PI + 0.35, TAU - 0.35, 12), BROWN, 0.0016, st);   // a small calm smile
    crayonLine(g, [[cx + 0.002, cy + b - 0.001], [cx + 0.004, cy + b + 0.007], [cx + 0.008, cy + b + 0.012]], "#4a7a22", 0.0018, st);   // the short stem
    const lf = leafPts(cx + 0.027, cy + b + 0.015, 0.040, 0.022, 0.38); hatch(g, lf, "#4fae2e", st, { ang: 1.1, w: 0.0045 }); crayonLine(g, lf, "#2f6e1c", 0.0015, st, true); crayonLine(g, [[cx + 0.010, cy + b + 0.0105], [cx + 0.045, cy + b + 0.0215]], "#2f6e1c", 0.0010, st);   // ONE big leaf leaning right
  } else {
    const r = 0.0425, ball = Array.from({ length: 72 }, (_, i) => [cx + r * Math.cos(TAU * i / 72), cy + r * Math.sin(TAU * i / 72)]), gar = garment(cx, cy, r, r, true, 0.1, 9, 0.0048);
    hatch(g, arcPts(0, cy - r - 0.017, 0.060, 0.0055, 0, TAU, 20), "#e8821a", st, { ang: 0.1, w: 0.0045 });   // an orange ground scribble
    for (const s of [-1, 1]) { const px = cx + s * 0.017, py = cy - r - 0.004, shoe = arcPts(px, py, 0.0092, 0.0055, 0, TAU, 16); hatch(g, shoe, "#ffffff", st, { ang: 0.3, w: 0.0036, alpha: 0.95 }); crayonLine(g, shoe, BROWN, 0.0016, st, true); crayonLine(g, [[px - 0.0085, py - 0.0016], [px + 0.0085, py - 0.0016]], "#b43a23", 0.0020, st); }   // 2 white trainer blobs, a red stripe each
    hatch(g, ball, GOLD, st, { ang: 0.9, w: 0.0052 }); hatch(g, gar, "#f59e00", st, { ang: 0.55, w: 0.0050, alpha: 0.95 });
    crayonLine(g, ball, BROWN, 0.0022, st, true); crayonLine(g, gar.slice(40), BROWN, 0.0018, st);
    const yc = cy + r * 0.1;   // the U hood collar, 2 white drawstring strokes 0.020 ending in dots
    crayonLine(g, [[cx - 0.015, yc + 0.001], ...arcPts(cx, yc - 0.002, 0.015, 0.013, Math.PI, TAU, 14).slice(1, -1), [cx + 0.015, yc + 0.001]], BROWN, 0.0020, st);
    for (const s of [-1, 1]) { const x0 = cx + s * 0.0125, y0 = yc - 0.008; g.strokeStyle = "#ffffff"; g.lineWidth = 0.0020; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + s * 0.0015, y0 - 0.017); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x0 + s * 0.0017, y0 - 0.0195, 0.0028, 0, TAU); g.fill(); }
    for (const s of [-1, 1]) { const x0 = cx + s * 0.037, y0 = yc - 0.014, x1 = cx + s * 0.066, y1 = cy + 0.034; crayonLine(g, [[x0, y0], [(x0 + x1) / 2 + s * 0.002, (y0 + y1) / 2], [x1, y1]], BROWN, 0.0020, st); for (let f = -1; f <= 1; f++) crayonLine(g, [[x1, y1], [x1 + s * 0.0035 + s * 0.0035 * f * 0.4, y1 + 0.0072 + 0.0015 * f * 0]], BROWN, 0.0015, st); }   // stick arms up in a V
    g.fillStyle = BROWN; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 0.0170, cy + 0.0275, 0.0034, 0, TAU); g.fill(); crayonLine(g, [[cx + s * 0.0118, cy + 0.0345], [cx + s * 0.0225, cy + 0.0345 + s * 0.0012]], BROWN, 0.0014, st); }   // 2 dot eyes with brow dashes
    const mouth = [[cx - 0.0155, cy + 0.0155], [cx + 0.0155, cy + 0.0155], ...arcPts(cx, cy + 0.0155, 0.0155, 0.0105, 0, -Math.PI, 14).slice(1, -1).reverse().reverse()];   // a huge open grin: a D on its back
    const D = [[cx - 0.0155, cy + 0.0155], ...arcPts(cx, cy + 0.0155, 0.0155, 0.0112, Math.PI, TAU, 16), [cx + 0.0155, cy + 0.0155]]; void mouth;
    hatch(g, D, "#d9483a", st, { ang: 0.7, w: 0.0036, alpha: 1 }); crayonLine(g, D, BROWN, 0.0016, st, true);
    for (const s of [-1, 1]) { const lf = leafPts(cx + s * 0.0135, cy + r + 0.014, 0.032, 0.016, Math.PI / 2 - s * 0.61); hatch(g, lf, "#4fae2e", st, { ang: 1.1, w: 0.0040 }); crayonLine(g, lf, "#2f6e1c", 0.0014, st, true); }   // TWO leaves in a V, 70 degrees apart
  }
  g.restore();
  // one fold line across the middle, a light edge under it
  g.fillStyle = "rgba(60,60,40,0.10)"; g.fillRect(0, H / 2 - 1.2, W, 2.4); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(0, H / 2 + 1.2, W, 2);
  if (!spud) {   // the dog-ear: the lower right corner 0.028 is folded over: the missing triangle, the flap and its shadow
    const d = 0.028 * PPM; g.save(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.moveTo(W, H - d); g.lineTo(W, H); g.lineTo(W - d, H); g.closePath(); g.fill(); g.restore();
    g.fillStyle = "#fff8c4"; g.beginPath(); g.moveTo(W, H - d); g.lineTo(W - d, H); g.lineTo(W - d, H - d); g.closePath(); g.fill();
    g.strokeStyle = "rgba(120,100,30,0.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(W, H - d); g.lineTo(W - d, H); g.stroke(); g.strokeStyle = "rgba(120,100,30,0.35)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(W - d + 1, H - d - 3); g.lineTo(W - d + 1, H); g.moveTo(W, H - d + 1); g.lineTo(W - d, H - d + 1); g.stroke();
  }
  return cv;
}
const paperTex = (who) => memo("paper" + who, () => { const t = new THREE.CanvasTexture(drawPaper(who)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
function backTex(who) {
  return memo("paperback" + who, () => { const f = paperTex(who).image, cv = document.createElement("canvas"); cv.width = f.width; cv.height = f.height; const g = cv.getContext("2d"); g.fillStyle = mix(PAPER[who].base, "#ffffff", 0.18); g.fillRect(0, 0, cv.width, cv.height); g.globalAlpha = 0.16; g.drawImage(f, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "destination-in"; g.drawImage(f, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; });
}
// the peg: beech 0.072 x 0.011 x 0.012, two halves, a steel spring of 3 turns; origin = the top end (the grip), the jaws close at y -0.072..-0.048
function pegParts() {
  const half = (s) => {   // profile in (z, y); s = +1 the outer half
    const P = [[0.0007, 0], [0.0058, 0], [0.0062, -0.004], [0.0060, -0.012], [0.0057, -0.026], [0.0050, -0.034], [0.0052, -0.044], [0.0060, -0.056], [0.0064, -0.072], [0.0036, -0.072], [0.0030, -0.064], [0.0022, -0.060], [0.0016, -0.056], [0.0012, -0.050], [0.0007, -0.040], [0.0007, -0.020]];
    const sh = new THREE.Shape(); P.forEach(([z, y], i) => sh[i ? "lineTo" : "moveTo"](s * z, y)); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.0100, bevelEnabled: true, bevelSize: 0.0004, bevelThickness: 0.0005, bevelSegments: 1, curveSegments: 4 }); g.rotateY(-Math.PI / 2); g.translate(0.0055, 0, 0); return g;
  };
  const turns = 3, pts = []; for (let i = 0; i <= 72; i++) { const a = TAU * turns * i / 72; pts.push([-0.0066 + 0.0132 * i / 72, -0.034 + 0.0040 * Math.cos(a), 0.0040 * Math.sin(a)]); }
  const spring = mergeGeometries([tubeThrough(pts, 0.00065, 120, 5), tubeThrough([pts[0], [-0.0066, -0.045, 0.0062]], 0.00065, 4, 5), tubeThrough([pts[72], [0.0066, -0.021, -0.0062]], 0.00065, 4, 5)]);
  return { outer: half(1), inner: half(-1), spring };
}
function bootnote(P) {
  const S = P.spec, who = S.who === "chip" ? "chip" : "spud", { w, h } = PAPER[who], rows = 26, cols = 4, seed = who === "chip" ? 1.7 : 0.4;
  const root = new THREE.Group(); P.whole.add(root);
  const pp = pegParts(), beech = mat("#e3c690", { roughness: 0.7 }), steel = mat("#9aa3aa", { roughness: 0.35, metalness: 0.3 });
  mesh(pp.outer, beech, root); mesh(pp.inner, beech, root); mesh(pp.spring, steel, root);
  const hang = new THREE.Group(); hang.position.set(0, -0.052, 0); root.add(hang);   // the paper hangs from its top edge, clamped in the jaws
  const pos = new Float32Array((rows + 1) * (cols + 1) * 3), uv = new Float32Array((rows + 1) * (cols + 1) * 2), idx = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { uv[(r * (cols + 1) + c) * 2] = c / cols; uv[(r * (cols + 1) + c) * 2 + 1] = 1 - r / rows; }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); pg.setIndex(idx);
  const tex = paperTex(who), pm = (map, side) => new THREE.MeshStandardMaterial({ map, color: who === "spud" ? "#3c4c58" : "#4a4a4a", roughness: 0.95, emissive: new THREE.Color(who === "spud" ? "#c4e8ff" : "#ffffff"), emissiveMap: map, emissiveIntensity: PAPER_SELF, side, alphaTest: 0.5 });
  const front = shadowy(new THREE.Mesh(pg, pm(tex, THREE.FrontSide))), back = shadowy(new THREE.Mesh(pg, pm(backTex(who), THREE.BackSide))); hang.add(front, back); front.castShadow = back.castShadow = false;
  const bend = (s, f, kk) => {   // the paper's turn at depth s below the jaws (radians, toward +z = outward)
    const u = s / h, lift = f * 10 * DEG * u * u, kink = kk * 15 * DEG * ss((s - (h - 0.045)) / 0.012), crease = 3 * DEG * ss((s - h / 2) / 0.004), curl = 40 * DEG * ss((u - 0.82) / 0.18);
    return lift + kink + crease + curl;
  };
  let key = "";
  return {
    grip: 0,
    apply(ps, t) {
      const fl = clamp(ps.flutter ?? 0.1), kk = clamp(ps.kink ?? 0), sw = clamp(ps.swing ?? 0), fq = fl * (0.5 + 0.5 * Math.sin(TAU * 1.3 * (t ?? 0) + seed));
      const k2 = `${fq.toFixed(4)}|${kk}`; if (k2 !== key) {
        key = k2; let y = 0, z = 0; const ds = h / rows;
        for (let r = 0; r <= rows; r++) {
          const s = r * ds; if (r) { const ph = bend(s, fq, kk); y -= Math.cos(ph) * ds; z += Math.sin(ph) * ds; }
          for (let c = 0; c <= cols; c++) { const k = (r * (cols + 1) + c) * 3; pos[k] = -w / 2 + w * c / cols; pos[k + 1] = y; pos[k + 2] = z; }
        }
        pg.attributes.position.needsUpdate = true; pg.computeVertexNormals(); pg.computeBoundingSphere();
      }
      hang.rotation.x = -(8 + 8 * sw * Math.cos(3 * Math.PI * (1 - sw))) * DEG;   // hangs 8 degrees off plumb; the swing decays over the director's tween
    },
  };
}

// ============================================================================================================ THE KINDS
function ktreat(P) {
  const S = P.spec, type = S.type || "coin", tr = makeTreat(type, { n: S.n ?? 0, stem: !!S.stem, peel: S.peel ?? 0, bite: S.bite ?? 0 });
  P.whole.add(tr.group); let key = "";
  return { grip: type === "coin" ? 0.004 : 0, apply(ps) { const k = `${ps.peel}|${ps.bite}`; if (k !== key) { key = k; tr.set(clamp(ps.peel ?? 0), clamp(ps.bite ?? 0)); } } };
}
export const KRAMPUS_BOOTS_KINDS = { kboot: buildBoot, bootnote, ktreat };
export const KRAMPUS_BOOTS_GRIPS = {
  kboot: { heel: [0, 0, -0.035], toe: [0, 0.04, 0.16], toecap: [0, 0.07, 0.115], shaftBack: [0, 0.15, -0.050], shaftFront: [0, 0.15, 0.060], shaftLeft: [-0.050, 0.15, 0.009], shaftRight: [0.050, 0.15, 0.009], cuff: [0, 0.26, 0.009], sole: [0, 0, 0.06] },
  bootnote: { top: [0, 0, 0], peg: [0, -0.010, 0], spring: [0, -0.034, 0], paper: [0, -0.110, 0] },
  ktreat: { top: [0, 0.007, 0], mid: [0, 0.0035, 0] },
};
export const KRAMPUS_BOOTS_STATE = {
  kboot: { mud: 0, shine: 0, glint: 0, droop: 0, sticks: 0, treats: 0, shade: 0 },
  bootnote: { flutter: 0.1, swing: 0, kink: 0 },
  ktreat: { peel: 0, bite: 0 },
};
