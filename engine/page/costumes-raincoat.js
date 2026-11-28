import * as THREE from "three";
import { garment, clothMat, liningMat, sstep } from "./costumes-art.js";

// Country vs Country 02 "Waiting at a red light" (storyboards/series/country-vs-country/02-traffic-light/DESIGN.md section 6, section 8 "Wedge's watch"):
// THE RAINCOAT, the little kid's red coat with the hood up (characters/potatobrawl/tot-kid.json), and `wedgeWatch`, the opt-in wrist watch of the
// `wedge` costume. costumes-everyday.js KIT entries `raincoat` and `wedge` call raincoatKit(C, ch) / wedgeWatch(C, ch). Metres, hand-drawn look
// (every fold, shine and stitch is drawn once, each its own length and lean), deterministic: no Math.random, no clock.
//
// RAINCOAT: WHAT IT DRAWS (sizes for the kid's body 0.46 x 0.44 x 0.40, stands 0.58 + legs; the numbers scale with the body where noted)
//   coat     a stiff A-line shell from just under the mouth line (front elevation -0.22, rising to +0.08 at the back, under the hood) down to
//            0.12 of the body's height above its bottom, flaring to 1.08 of the body's width at the hem (measured, not guessed: the flare is
//            solved from the body each time). Colour `coat` #c8352b, inside 0.6 darker, a painted shade 0.18 toward the hem.
//   folds    7 strokes `fold` #9f2a22 on the coat's own creases (th = 0.3 + 0.897 k), each its own start, length, lean and width.
//   toggles  3 down the front, capsules r 0.012 x 0.05 `toggle` #f2c230, each tilted its own way, each with a 0.02 cord loop #9f2a22.
//   pockets  2 patch pockets 0.07 x 0.06 (right at th +0.75, left at th -1.03, not mirrored), a little lighter than the coat, stitched round.
//   sleeves  coat colour, a tube along the arm, r 0.05 -> 0.04, ending `cuffGap` (0.085) before the hand's centre = 0.03 before the wrist, then a
//            rolled cuff 0.03 long in `rim`. Bare pale wrist and glove below.
//   hood     UP. A shell over the crown and the back of the head from the brow line (0.64 rad at the front, dropping down the cheeks to the coat's
//            neckline), 0.01 thick, standing 0.03 (hem) to 0.05 (crown) off the skin, a soft gathered point 0.04 at the back, top at world y
//            `hoodTop` 0.64 (the crown lift is fitted to it). A rolled rim 0.03 thick `rim` #d8453a round the face opening: it never crosses the
//            eyes (the eyes' top is at about 0.40 rad, the rim's lowest edge over them is at about 0.50) and tapers to nothing at the cheeks.
//            Two wet-shine strokes `shine` #e8776c on the hood (upper left, side right), none on the face.
//   boots    none built: limbs.color #8f2a22 in tot-kid.json IS the boots (the limb's end).
//   NOT drawn: sprout (tot-kid.json sprout.placement "none"), glasses, anything on the face.
// COSTUME KEYS (tot-kid.json "costume", all optional): coat "#c8352b", rim "#d8453a", toggle "#f2c230", fold "#9f2a22", shine "#e8776c",
//   hoodTop 0.64 (world y of the hood's top), cuffGap 0.085 (sleeve end before the hand's centre), hands "#f6dcae" (the pale hands, as every everyday costume).
// Origin: the character's own (feet on the ground). Where a hand holds it: nothing is held. No key moves anything: the coat is static, the sleeves
// follow the arms every frame.
//
// WEDGE'S WATCH (`wedge` costume key, default OFF: Wedge renders exactly as before without it):
//   watch   true | "L" | "R"  the retiree's wrist watch (costumes-skipage.js) on that wrist (true = "L"): strap #2b2f3a (`watchStrap` overrides) 0.022 wide,
//           steel case r 0.038, cream dial #f7f4ea, 12 ticks (no numerals), two hands. It sits 0.07 before the hand's centre, so with the key on the
//           bomber's cuff ends 0.115 before the hand (cuffGap, unless the file sets its own) and the watch lies on the bare wrist. It rides the arm
//           every frame; no key of its own. Turn it on in a character file: `"costume": { ..., "watch": "L" }` (the bench's wedge-watch.json).

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const lerp = (a, b, k) => a + (b - a) * k;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const brushW = (u, W, heavy = 0.5) => W * (1 - heavy + heavy * u) * Math.pow(Math.sin(PI * Math.max(0, Math.min(1, u))), 0.55);

// elevation (radians) of a floor-based height y at angle th
const elOfY = (ch, y, th = 0) => { let a = -1.45, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; };

// a mesh from a (nu+1) x (nv+1) grid of points; the last column welds to the first when `closed`
function gridGeo(pts, nu, nv, closed = false) {
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) { const N = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}
// a flat strip from centre points, a side vector and a half width per point
function strip(cs, sides, ws) {
  const pos = [], idx = [];
  cs.forEach((c, i) => { pos.push(...c.clone().addScaledVector(sides[i], -ws[i]).toArray(), ...c.clone().addScaledVector(sides[i], ws[i]).toArray()); });
  for (let i = 0; i < cs.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a tube along pts whose radius follows rfn(0..1): parallel-transported frame, no twist
function sweep(pts, rfn, R = 10) {
  const n = pts.length, pos = [], idx = [], Nv = V(0, 0, 1), T = V(0, 0, 0), B = V(0, 0, 0);
  for (let i = 0; i < n; i++) {
    T.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize(); Nv.addScaledVector(T, -Nv.dot(T)).normalize(); B.crossVectors(T, Nv);
    const r = rfn(i / (n - 1));
    for (let k = 0; k <= R; k++) { const a = (k / R) * TAU; pos.push(pts[i].x + (Math.cos(a) * Nv.x + Math.sin(a) * B.x) * r, pts[i].y + (Math.cos(a) * Nv.y + Math.sin(a) * B.y) * r, pts[i].z + (Math.cos(a) * Nv.z + Math.sin(a) * B.z) * r); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// ink strokes in a fixed colour (a deep shade of the cloth, as costumes-art.js inkMat, but not darkened again)
function strokeMat(color) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.ink = true; return m;
}
const strokeMesh = (geo, color) => { const o = new THREE.Mesh(geo, strokeMat(color)); o.userData.inkStroke = true; return o; };
const flatMat = (color, o = {}) => { const m = clothMat(color, { side: THREE.DoubleSide, roughness: o.roughness ?? 0.7, vertexColors: o.vertexColors }); return m; };

// a point on the garment G at (th, v), its outward normal and the cloth's two directions there
function onG(G, th, v, off) {
  const e = 0.004, p = G.at(th, v, off), a = G.at(th + e, v, off).sub(G.at(th - e, v, off)), b = G.at(th, Math.min(1, v + 0.01), off).sub(G.at(th, Math.max(0, v - 0.01), off)), n = new THREE.Vector3().crossVectors(b, a).normalize();
  if (n.x * p.x + n.z * p.z < 0) n.negate();
  return { p, n, across: a.normalize(), down: b.normalize() };
}
// a brush stroke lying on G along [{ th, v }], its width following wfn(0..1)
function strokeOn(G, path, wfn, off) {
  const P = path.map(({ th, v }) => onG(G, th, v, off)), cs = [], sides = [], ws = [];
  P.forEach((q, i) => { const T = P[Math.min(P.length - 1, i + 1)].p.clone().sub(P[Math.max(0, i - 1)].p).normalize(); cs.push(q.p); sides.push(new THREE.Vector3().crossVectors(T, q.n).normalize()); ws.push(wfn(i / (P.length - 1))); });
  return strip(cs, sides, ws);
}

// the hood's lower edge round the head (elevation by th): the brow line over the face (flat, then dropping down the cheeks), HOOD_LOW (just over the coat's neckline) at the sides and back
const HOOD_LOW = -0.20, wrapTh = (th) => { const q = ((th % TAU) + TAU) % TAU; return q > PI ? q - TAU : q; };
const hoodHem = (th) => { const a = Math.abs(wrapTh(th)), topH = 0.64 - 0.30 * Math.min(1, (a / 0.8) ** 3); return HOOD_LOW + (topH - HOOD_LOW) * (1 - sstep(0.70, 1.05, a)); };

// ------------------------------------------------------------------ the coat
const FOLD_PHASE = 1.5 * PI - 0.3 * 7;   // the garment's creases fall at th = (1.5 pi + 2 pi k - phase) / 7 = 0.3 + 0.897 k
const FOLDS = [   // [v0, v1, lean (th drift), half width]: each stroke its own start, length, lean, weight
  [0.30, 0.88, 0.05, 0.0058], [0.40, 0.93, -0.04, 0.0046], [0.24, 0.82, 0.06, 0.0063], [0.35, 0.90, -0.03, 0.0052], [0.30, 0.95, 0.04, 0.0060], [0.44, 0.84, -0.06, 0.0044], [0.27, 0.91, 0.03, 0.0055],
];
function coatShell(C, ch, S) {
  const parts = ch.potatoParts, coatC = C.coat || "#c8352b", foldC = C.fold || "#9f2a22", toggleC = C.toggle || "#f2c230", thick = 0.010;
  const top = (th) => -0.22 + 0.30 * 0.5 * (1 - Math.cos(th));                          // under the mouth at the front, rising to the back (the hood covers it)
  const hemPh = elOfY(ch, S.base + 0.12 * ch.H, PI / 2);                                  // 0.12 of the body's height above its bottom
  const targetX = 0.5 * 1.08 * (2 * ch.rx);                                              // half of 1.08 body widths
  const build = (flare) => garment(ch, { topFn: top, top: top(0), hem: hemPh, folds: 7, depth: 0.007, flare, lift: 0.012, lift0: 0.008, wave: 0.003, thick, phase: FOLD_PHASE, grad: 0.18, segs: 180, rows: 36 });
  let flare = 0.07, G = build(flare);
  for (let k = 0; k < 3; k++) {   // solve the flare from the body: the measured hem half-width at the side must be 1.08 body widths / 2
    const x = (Math.abs(G.at(PI / 2, 1, thick).x) + Math.abs(G.at(-PI / 2, 1, thick).x)) / 2;
    flare = Math.max(0.01, flare + (targetX - x) * 1.05); G = build(flare);
  }
  const m = flatMat(coatC, { vertexColors: true });
  parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(coatC, 0.6)), false)); parts.add(mesh(G.hem, flatMat(coatC), false));
  // 7 fold strokes, one on each crease
  const folds = [];
  FOLDS.forEach(([v00, v1, lean, w], k) => {
    let v0 = v00;
    const th0 = (1.5 * PI + TAU * k - FOLD_PHASE) / 7, path = [], vHood = (th) => (hoodHem(th) - 0.07 - top(th)) / (hemPh - top(th));   // a stroke starts below the hood's lower edge (ink would draw through it)
    v0 = Math.max(v0, vHood(th0), vHood(th0 + lean));
    for (let i = 0; i <= 14; i++) { const u = i / 14; path.push({ th: th0 + lean * u + 0.02 * Math.sin(u * 4 + k * 1.7), v: lerp(v0, v1, u) }); }
    folds.push(strokeOn(G, path, (u) => brushW(u, w, 0.6), thick + 0.0012));
  });
  parts.add(strokeMesh(mergeAll(folds), foldC));
  // 3 toggles down the front, each tilted its own way, each with a 0.02 cord loop on the wearer's left end
  const togM = clothMat(toggleC, { roughness: 0.5 }), loopM = clothMat(foldC, { roughness: 0.8 });
  [[0.15, 0.10], [0.43, -0.07], [0.71, 0.05]].forEach(([v, tilt]) => {
    const q = onG(G, 0, v, thick + 0.012), tdir = q.across.clone().applyAxisAngle(q.n, tilt);
    const cap = mesh(new THREE.CapsuleGeometry(0.012, 0.026, 4, 10), togM); cap.position.copy(q.p); cap.quaternion.setFromUnitVectors(V(0, 1, 0), tdir); parts.add(cap);   // 0.012 radius, 0.05 long
    const loop = mesh(new THREE.TorusGeometry(0.0075, 0.0028, 6, 16), loopM, false); loop.position.copy(q.p).addScaledVector(tdir, -0.03).addScaledVector(q.n, -0.006); loop.quaternion.setFromUnitVectors(V(0, 0, 1), q.n); parts.add(loop);
  });
  // 2 patch pockets 0.07 x 0.06: lighter than the coat, stitched round, each at its own place
  [[0.75, 0.52], [-1.03, 0.56]].forEach(([th0, v0]) => {
    const e = 0.01, dth = 0.035 / (G.at(th0 + e, v0, thick).distanceTo(G.at(th0 - e, v0, thick)) / (2 * e)), dv = 0.06 / (G.at(th0, v0 + e, thick).distanceTo(G.at(th0, v0 - e, thick)) / (2 * e));
    const rr = (a, b) => a * (1 - 0.26 * Math.pow(Math.max(0, 1 - b / 0.22), 2) * Math.abs(a));   // the bottom corners round off
    const NU = 10, NV = 8, pts = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const a = (i / NU) * 2 - 1, b = j / NV; pts.push(G.at(th0 + rr(a, 1 - b) * dth, v0 + b * dv, thick + 0.004)); }
    parts.add(mesh(gridGeo(pts, NU, NV), flatMat(shade(coatC, 1.07)), false));
    const path = []; const side = (f, n) => { for (let i = 0; i <= n; i++) f(i / n); };
    side((u) => path.push({ th: th0 + rr(-1 + 2 * u, 1) * dth * 0.94, v: v0 + 0.03 * dv }), 8);        // top edge, left to right
    side((u) => path.push({ th: th0 + rr(0.94, 1 - u) * dth, v: v0 + (0.03 + 0.94 * u) * dv }), 8);    // right edge, down
    side((u) => path.push({ th: th0 + rr(0.94 - 1.88 * u, 0) * dth, v: v0 + 0.97 * dv }), 8);          // bottom edge, right to left
    side((u) => path.push({ th: th0 + rr(-0.94, u) * dth, v: v0 + (0.97 - 0.94 * u) * dv }), 8);       // left edge, up
    parts.add(strokeMesh(strokeOn(G, path, () => 0.0018, thick + 0.0058), foldC));
  });
  return G;
}
function mergeAll(gs) {   // concatenate strip geometries (all non-indexed-compatible: re-index by offset)
  const pos = [], idx = []; let off = 0;
  for (const g of gs) { const p = g.attributes.position, ix = g.index.array; for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i)); for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off); off += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------ the hood: shell, rolled rim, point at the back, two shine strokes
function hood(C, ch) {
  const parts = ch.potatoParts, coatC = C.coat || "#c8352b", rimC = C.rim || "#d8453a", shineC = C.shine || "#e8776c", TOPW = C.hoodTop ?? 0.64;
  const TOP = 1.52, thick = 0.010, HEM_LIFT = 0.030;
  const sst = (a, b, x) => sstep(a, b, x), hem = hoodHem;
  const hemLift = (th) => HEM_LIFT + 0.010 * sst(0.9, 1.5, Math.abs(wrapTh(th)));
  const bump = (th, ph) => (C.hoodPoint ?? 0.04) * Math.exp(-((Math.abs(wrapTh(th - PI)) / 0.55) ** 2)) * Math.exp(-(((ph - 0.85) / 0.40) ** 2));   // the soft point at the back
  const make = (crown) => {
    const at = (th, tt, off) => {
      const h = hem(th), ph = h + (TOP - h) * tt, s = ch.surf(th, ph), hl = hemLift(th), lift = hl + (crown - hl) * sst(0, 0.9, tt) + bump(th, ph);
      return s.pos.clone().addScaledVector(s.normal, lift + off);
    };
    return at;
  };
  let crown = 0.05, at = make(crown);
  const NU = 160, NV = 30;
  for (let k = 0; k < 2; k++) {   // fit the crown lift so the top of the hood is TOPW above the floor
    let maxY = -1; for (let i = 0; i < NU; i += 4) maxY = Math.max(maxY, at((i / NU) * TAU, 1, thick).y);
    crown += TOPW - maxY; at = make(crown);
  }
  const outer = [], inner = [], edge = [], cols = [];
  // rows run crown -> edge, as garment(): the winding then faces outward
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const th = (i / NU) * TAU, tt = 1 - j / NV; outer.push(at(th, tt, thick)); inner.push(at(th, tt, 0)); const c = 1.06 - 0.2 * Math.pow(1 - tt, 1.2); cols.push(c, c, c); }
  for (let k = 0; k <= 2; k++) for (let i = 0; i <= NU; i++) edge.push(at((i / NU) * TAU, 0, thick * (1 - k / 2)));
  const go = gridGeo(outer, NU, NV, true), gi = gridGeo(inner, NU, NV, true), ge = gridGeo(edge, NU, 2, true);
  go.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  parts.add(mesh(go, flatMat(coatC, { vertexColors: true }))); parts.add(mesh(gi, liningMat(shade(coatC, 0.55)), false)); parts.add(mesh(ge, flatMat(coatC), false));
  // the rolled rim, 0.03 thick, round the face opening from the left cheek over the brow to the right cheek, thinning to nothing at the cheeks
  const rp = []; for (let i = 0; i <= 120; i++) { const th = -1.0 + 2.0 * (i / 120); rp.push(at(th, 0, thick * 0.5 + 0.008)); }
  parts.add(mesh(sweep(rp, (u) => 0.015 * (0.25 + 0.75 * sst(0, 0.16, Math.min(u, 1 - u))), 10), flatMat(rimC, { roughness: 0.6 })));
  // two wet-shine strokes on the hood: upper left of the crown, and a short one on the right side above the ear; each its own length, none near the face
  [[[-0.95, 1.00], [-0.78, 1.18], [-0.52, 1.34], [-0.2, 1.43], 0.0075], [[1.25, 0.90], [1.30, 0.72], [1.38, 0.52], 0.0055]].forEach((def) => {
    const w = def[def.length - 1], sp = new THREE.CatmullRomCurve3(def.slice(0, -1).map(([th, ph]) => V(th, ph, 0)));   // the path is smoothed in (th, ph), then each point is laid on the hood
    const cs = [], sides = [], ws = [], n = 18, pt = (u) => { const q = sp.getPointAt(u), th = q.x, ph = q.y, s = ch.surf(th, ph), hl = hemLift(th), lift = hl + (crown - hl) * sst(0, 0.9, (ph - hem(th)) / (TOP - hem(th))) + bump(th, ph); return { c: s.pos.clone().addScaledVector(s.normal, lift + thick + 0.0016), q: s.normal }; };
    for (let i = 0; i <= n; i++) { const u = i / n, a = pt(u), b = pt(Math.min(1, u + 0.02)), d = pt(Math.max(0, u - 0.02)), T = b.c.clone().sub(d.c).normalize(); cs.push(a.c); sides.push(new THREE.Vector3().crossVectors(T, a.q).normalize()); ws.push(brushW(u, w, 0.5)); }
    parts.add(strokeMesh(strip(cs, sides, ws), shineC));
  });
}

// ------------------------------------------------------------------ sleeves: a tube along the arm's curve, rebuilt every frame, ending SL.gap before the hand's centre, then a rolled cuff
function sleeves(ch, armM, cuffM, SL) {
  const slv = {}, cuf = {};
  for (const s of ["L", "R"]) for (const [set, m] of [[slv, armM], [cuf, cuffM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), R = 16, N = 18;
  const radius = (t, cuffAt) => t < cuffAt ? lerp(SL.r0, SL.r1, t / cuffAt) : (SL.rc + SL.cuff * Math.sin(PI * (t - cuffAt) / (1 - cuffAt))) * (1 - 0.2 * sstep(0.9, 1, t));
  const tube = (curve, ua, ub, ta, tb, n, cuffAt) => {
    const pos = new Float32Array((n + 1) * (R + 1) * 3), idx = [];
    for (let i = 0; i <= n; i++) {
      const t = ta + (tb - ta) * (i / n), u = ua + (ub - ua) * (i / n), p = curve.getPointAt(u), T = curve.getTangentAt(u);
      _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
      const r = radius(t, cuffAt);
      for (let k = 0; k <= R; k++) { const a = (k / R) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k; pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z; }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  };
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = cuf[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength());
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / L)), cuffAt = Math.max(0.5, Math.min(0.97, 1 - SL.cuffLen / (L * (to - SL.from)))), mid = SL.from + (to - SL.from) * cuffAt, NC = Math.max(3, Math.round(N * (1 - cuffAt)));
      const T0 = curve.getTangentAt(SL.from), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const g1 = tube(curve, SL.from, mid, 0, cuffAt, N - NC, cuffAt), g2 = tube(curve, mid, to, cuffAt, 1, NC, cuffAt);
      slv[s].geometry.dispose(); slv[s].geometry = g1; slv[s].visible = true;
      cuf[s].geometry.dispose(); cuf[s].geometry = g2; cuf[s].visible = true;
    }
  };
}

export function raincoatKit(C, ch) {
  const S = { base: ch.cy - ch.ry };
  coatShell(C, ch, S);
  hood(C, ch);
  const coatC = C.coat || "#c8352b";
  const sl = sleeves(ch, flatMat(coatC), flatMat(C.rim || "#d8453a", { roughness: 0.6 }), { from: 0.04, gap: C.cuffGap ?? 0.085, r0: 0.05, r1: 0.04, rc: 0.038, cuff: 0.008, cuffLen: 0.03 });
  return { sl };
}

// ------------------------------------------------------------------ Wedge's wrist watch (costume.watch true | "L" | "R"): the retiree's build (costumes-skipage.js wristWatch), strap #2b2f3a
// returns apply(st, t): the watch rides the arm every frame (call it after the sleeves have moved)
export function wedgeWatch(C, ch) {
  const side = C.watch === "R" ? "R" : "L", sx = side === "R" ? -1 : 1;
  const grp = new THREE.Group(), face = new THREE.Group(); grp.visible = false; ch.root.add(grp); grp.add(face);
  const stM = new THREE.MeshStandardMaterial({ color: C.watchStrap || "#2b2f3a", roughness: 0.75, side: THREE.DoubleSide }), steel = new THREE.MeshStandardMaterial({ color: "#c9ced6", roughness: 0.3, metalness: 0.7 });
  const dialM = new THREE.MeshStandardMaterial({ color: "#f7f4ea", roughness: 0.5 }), inkM = new THREE.MeshStandardMaterial({ color: "#2b2f3a", roughness: 0.6 });
  for (const m of [stM, steel, dialM, inkM]) m.userData.lookRole = "cloth";
  const W = 0.022, RO = 0.0385, RI = 0.0345, ax = new THREE.Matrix4().makeRotationX(PI / 2);   // the strap is a thin ring round the arm's tangent (the group's z)
  const ring = new THREE.Group(); grp.add(ring);
  { const o = new THREE.CylinderGeometry(RO, RO, W, 28, 1, true).applyMatrix4(ax), i = new THREE.CylinderGeometry(RI, RI, W, 28, 1, true).applyMatrix4(ax);
    ring.add(mesh(o, stM, true), mesh(i, stM, false));
    for (const z of [-W / 2, W / 2]) ring.add(mesh(new THREE.RingGeometry(RI, RO, 28).translate(0, 0, z), stM, false)); }
  face.position.y = RO + 0.006 - 0.001;   // the case on the back of the wrist (group y = outward), 0.012 thick, sitting on the strap
  face.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 28), steel, true));
  const dl = mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.002, 28), dialM, false); dl.position.y = 0.0065; face.add(dl);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, t = mesh(new THREE.BoxGeometry(0.0022, 0.0016, k % 3 ? 0.004 : 0.007), inkM, false); t.position.set(Math.sin(a) * 0.0255, 0.0078, Math.cos(a) * 0.0255); t.rotation.y = a; face.add(t); }
  for (const [l, a, w] of [[0.021, 0.5, 0.0024], [0.014, 2.6, 0.003]]) { const h = mesh(new THREE.BoxGeometry(w, 0.0016, l), inkM, false); h.position.set(Math.sin(a) * l / 2, 0.0078, Math.cos(a) * l / 2); h.rotation.y = a; face.add(h); }
  const pin = mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.0024, 10), inkM, false); pin.position.y = 0.0082; face.add(pin);
  const _m = new THREE.Matrix4(), _o = V(0, 0, 0), _t = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0);
  return () => {
    const A = ch.arms?.[side]; if (!A?.shoulder || !A.elbow || !A.hand) { grp.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Ln = Math.max(0.05, curve.getLength()), u = Math.min(1, 1 - 0.07 / Ln);
    curve.getPointAt(u, _o); curve.getTangentAt(u, _t);
    _n.set(0.6 * sx, 0.8, 1.0); _n.addScaledVector(_t, -_n.dot(_t)).normalize();
    _b.crossVectors(_n, _t).normalize(); _m.makeBasis(_b, _n, _t); grp.quaternion.setFromRotationMatrix(_m); grp.position.copy(_o); grp.visible = true;
  };
}
