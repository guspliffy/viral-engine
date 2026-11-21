import * as THREE from "three";
import { clamp } from "./util.js";

// Props for Potato Desk 11 "Court: kid and dad" (storyboards/series/potato-desk/11-court-kid-dad/DESIGN.md sections 1-5): the fries
// carton and the one loose fry the judge lifts out of it. Axes: x right, y up, z toward the camera, metres; every size and hex colour is the
// DESIGN's. No lettering and no mark anywhere. One flat colour per surface, no hatching (noHatch). Same conventions as props-court.js.
//
//   friescarton  a red paper fries carton, 0.28 wide x 0.11 deep x 0.24 high at the rim, flaring from a 0.17 x 0.07 base (a stadium section
//                at every height: flat front and back panels, half-round ends). Origin: the middle of the underside of the base (it
//                stands by itself, y 0 = its bottom), +y up. The low scooped FRONT panel faces -z, the tall BACK panel faces +z: the holder
//                stands on the +z side (the grip library's hold frame), so the scoop and the inside face whoever he faces. Back panel's top
//                edge 0.24 at the seams, 0.26 at x 0; front panel's 0.24 at the seams, 0.18 at x 0 (a flat-bottomed U). Wall 0.004 (a real
//                outer and inner face), inside floor at y 0.010, cream cut-paper rim 0.005 wide, a fold line at each seam inside.
//                Outside "#e3261d" (panels) / "#c41e1b" (round ends) / "#a81a18" (underside); inside "#ead9b8", "#c9b08a" below y 0.10,
//                floor "#b89c72"; rim "#f6ead2". Matte, roughness 0.85.
//     fill    "empty" (default "full"; also 0 = empty). Fixed per carton, never tweened (read from the spec only).
//             empty: nothing above the rim, so from the front the cream back panel shows over the scoop (0.08 high at x 0); two grease
//             blots "#cdb07c" on it and three crumbs wedged in the floor seam.
//             full: ten fixed fries (5 back row z +0.020, 5 front row z -0.018, leaning out and toward their side, tips 0.285-0.365, cut off
//             below y 0.13), a "#cc8735" bed up to y 0.17, and the loose fry's slot (back row, x -0.0215, base y 0.18, upright, tip y 0.42).
//             Every fry is the fryfan fry (0.039 x 0.24 x 0.035, bevel 0.004, "#ecb348" broad faces, "#cc8735" sides, "#f5c662" top), a
//             shape of its own so each gets its own ink line.
//     taken   0 or 1 (default 0; STEPS at its `at`, a tween key outside propState: { do: "prop", set: { taken: 1 } }). 0: the slot fry
//             stands in the carton and rides every move of it; 1: the slot is empty (show the separate `loosefry` in the same pose).
//   Held: both hands on the two round ends, the box hold: SIZE { w 0.216, h 0.182, d 0.087, r 0.099 } (grips.box(c, who, CARTON, { gap: 0.03 })
//   puts the palms at y 0.10 where the carton is 0.216 wide). One hand round one end, low, the mug hold (grips.mug(..., { height: 0.33,
//   gap: 0.038 }) = a fist at y 0.06, half-width 0.099 there). The prop's own grip 0.10. A gap of about 0.03 is for Chip (hands 1.1),
//   0.038 for Wedge (1.3): the library's defaults are for 1.7 gloves.
//
//   loosefry     the one fry the judge lifts out: the same fry as the carton's slot, 0.039 x 0.24 x 0.035, standing along +y. Origin: its
//                bottom centre. In the carton's frame its place is (-0.0215, 0.18, +0.020), upright (tip at y 0.42). The thin pinch at 0.85 of
//                its length (y 0.204): SIZE { len 0.24, r 0.018 } and grips.thin(c, who, FRY, { from: 0.85 }); 0.17 of it hangs below the hand.
//     bite   0 or 1 (default 0; steps like `taken`): the bottom 0.09 gone, the cut face "#f8dc8c" (the origin stays at the original bottom).
//   Prop grip 0.204 (the pinch).

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

// ---- the fryfan fry (props-court.js): a bevelled box standing on its bottom centre, coloured face by face from its normal
function bevExtrude(shape, depth, b, curveSegments = 14) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0005, depth - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 1, curveSegments });
  g.translate(0, 0, b); return g;
}
const rectShape = (w, d) => new THREE.Shape().moveTo(-w / 2, -d / 2).lineTo(w / 2, -d / 2).lineTo(w / 2, d / 2).lineTo(-w / 2, d / 2).closePath();
const bevBox = (w, h, d, b) => bevExtrude(rectShape(w, d), h, b).rotateX(-Math.PI / 2);
function paint(geo, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, col = new Float32Array(p.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.crossVectors(b.sub(a), c.sub(a)).normalize();
    const k = fn(n.x, n.y, n.z);
    for (let j = 0; j < 3; j++) { col[(i + j) * 3] = k.r; col[(i + j) * 3 + 1] = k.g; col[(i + j) * 3 + 2] = k.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
const vmat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6, ...o }); m.userData.noHatch = true; return m; };
const FRY = { w: 0.039, len: 0.24, d: 0.035, bev: 0.004 };
const fryCol = (cut) => (nx, ny, nz) => {
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  if (cut && ny < -0.5) return new THREE.Color("#f8dc8c");
  return new THREE.Color(ay >= az - 0.05 && ay >= ax - 0.05 && ny > 0 ? "#f5c662" : az >= ax - 0.05 ? "#ecb348" : "#cc8735");
};
// a fry of length L (origin its bottom centre, standing along +y); from > 0 cuts the bottom `from` away (the origin stays put)
const fryGeo = (L = FRY.len, from = 0, cut = false) => paint(bevBox(FRY.w, L - from, FRY.d, FRY.bev).translate(0, from, 0), fryCol(cut));

// ---- the carton's numbers (DESIGN section 1)
const T = 0.24, WALL = 0.004, FLOOR = 0.010, FIL = 0.012, LOWIN = 0.10, BED = 0.17;
const fAt = (y) => 0.05 + (0.035 * y) / T;      // half the flat panel (half-width minus half-depth): 0.05 at the base, 0.085 at the rim
const rAt = (y) => 0.035 + (0.02 * y) / T;      // half-depth = the end radius: 0.035 -> 0.055
const rimBack = (u) => T + 0.02 * (1 - u * u);                                       // arch: 0.24 at the seams, 0.26 at x 0
const rimFront = (u) => { const t = clamp((Math.abs(u) - 0.5) / 0.5); return 0.18 + 0.06 * t * t; };   // U scoop: 0.18 at x 0 (+-0.002 within x +-0.05), 0.24 at the seams
const C = { panel: "#e3261d", end: "#c41e1b", under: "#a81a18", rim: "#f6ead2", cream: "#ead9b8", low: "#c9b08a", floor: "#b89c72", fold: "#b89c72" };

// the perimeter, round once: the front flat left to right, the right end, the back flat right to left, the left end. A sample is
// { k: "F" | "B" | "R" | "L", p: u (-1..1 along a flat) | angle (round an end), seam: it lies in a fold line }
function perimeter() {
  const dF = 0.0015 / 0.085, dA = 0.0015 / 0.055, s = [];
  const us = [-1, -1 + dF]; for (let i = 1; i < 40; i++) us.push(-1 + i / 20); us.push(1 - dF, 1);
  const as = [dA]; for (let j = 1; j < 12; j++) as.push((Math.PI * j) / 12); as.push(Math.PI - dA);
  for (const u of us) s.push({ k: "F", p: u, seam: Math.abs(u) > 1 - dF - 1e-9 });
  for (const a of as) s.push({ k: "R", p: a, seam: a < dA + 1e-9 || a > Math.PI - dA - 1e-9 });
  for (const u of [...us].reverse()) s.push({ k: "B", p: u, seam: Math.abs(u) > 1 - dF - 1e-9 });
  for (const a of as) s.push({ k: "L", p: Math.PI + a, seam: a < dA + 1e-9 || a > Math.PI - dA - 1e-9 });
  for (const m of s) m.rim = m.k === "F" ? rimFront(m.p) : m.k === "B" ? rimBack(m.p) : T;
  return s;
}
// a point on the section at height y, `inset` in from the outer face (negative = out)
function pos(m, y, inset) {
  const f = fAt(y), r = rAt(y) - inset;
  switch (m.k) {
    case "F": return [m.p * f, y, -r];
    case "B": return [m.p * f, y, r];
    case "R": return [f + r * Math.sin(m.p), y, -r * Math.cos(m.p)];
    default: return [-f + r * Math.sin(m.p), y, -r * Math.cos(m.p)];
  }
}
// the outer face's unit normal there (finite differences along the section and up the wall), pointing out
function wallN(m, y) {
  const e = 1e-4, a = new THREE.Vector3(...pos(m, y, 0)), tp = new THREE.Vector3(...pos({ ...m, p: m.p + e }, y, 0)).sub(a), ty = new THREE.Vector3(...pos(m, y + e, 0)).sub(a);
  const n = new THREE.Vector3().crossVectors(tp, ty).normalize();
  const out = m.k === "F" ? [0, 0, -1] : m.k === "B" ? [0, 0, 1] : [Math.sin(m.p), 0, -Math.cos(m.p)];
  return n.dot(new THREE.Vector3(...out)) < 0 ? n.negate() : n;
}

// a triangle soup with a flat colour per quad (hard colour changes between surfaces) and optional vertex normals
function soup() {
  const P = [], N = [], K = [], col = new THREE.Color();
  const tri = (a, b, c, hex, na, nb, nc) => {
    col.set(hex);
    if (!na) { const n = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).cross(new THREE.Vector3(...c).sub(new THREE.Vector3(...a))).normalize(); na = nb = nc = [n.x, n.y, n.z]; }
    for (const [p, n] of [[a, na], [b, nb], [c, nc]]) { P.push(...p); N.push(...n); K.push(col.r, col.g, col.b); }
  };
  return {
    tri,
    quad(a, b, c, d, hex, ns) { tri(a, b, c, hex, ns?.[0], ns?.[1], ns?.[2]); tri(a, c, d, hex, ns?.[0], ns?.[2], ns?.[3]); },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(K, 3));
      return g;
    },
  };
}

function buildShell() {
  const S = perimeter(), n = S.length, sh = soup(), nw = S.map((m) => wallN(m, 0.12)), v3 = (x) => [x.x, x.y, x.z];
  const arc = (m) => m.k === "R" || m.k === "L";
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, A = S[i], B = S[j], out = arc(A) || arc(B) ? C.end : C.panel, seam = A.seam && B.seam;
    const ni = v3(nw[i]), nj = v3(nw[j]), inI = ni.map((v) => -v), inJ = nj.map((v) => -v);
    // outside: from the top of the bottom fillet up to the rim
    sh.quad(pos(A, FIL, 0), pos(A, A.rim, 0), pos(B, B.rim, 0), pos(B, FIL, 0), out, [ni, ni, nj, nj]);
    // the bottom edge, radius 0.012 (four rows, the first two in the underside colour), normals turning from the wall to straight down
    const rows = [0, 1, 2, 3].map((k) => { const f = (-Math.PI / 2) + (k * Math.PI) / 6; return { y: FIL * (1 + Math.sin(f)), inset: FIL * (1 - Math.cos(f)), cs: Math.cos(f), sn: Math.sin(f) }; });
    const bn = (nn, r) => { const h = Math.hypot(nn[0], nn[2]) || 1, v = [(nn[0] / h) * r.cs, r.sn, (nn[2] / h) * r.cs], l = Math.hypot(...v); return v.map((x) => x / l); };
    for (let k = 0; k < 3; k++) {
      const r0 = rows[k], r1 = rows[k + 1];
      sh.quad(pos(A, r0.y, r0.inset), pos(A, r1.y, r1.inset), pos(B, r1.y, r1.inset), pos(B, r0.y, r0.inset), k < 2 ? C.under : out, [bn(ni, r0), bn(ni, r1), bn(nj, r1), bn(nj, r0)]);
    }
    // the underside
    sh.tri([0, 0, 0], pos(A, 0, FIL), pos(B, 0, FIL), C.under, [0, -1, 0], [0, -1, 0], [0, -1, 0]);
    // inside: dark kraft below y 0.10, cream above, the fold line at each seam; the floor
    const lo = (m, y) => pos(m, y, WALL);
    sh.quad(lo(A, FLOOR), lo(B, FLOOR), lo(B, LOWIN), lo(A, LOWIN), seam ? C.fold : C.low, [inI, inJ, inJ, inI]);
    sh.quad(lo(A, LOWIN), lo(B, LOWIN), lo(B, B.rim), lo(A, A.rim), seam ? C.fold : C.cream, [inI, inJ, inJ, inI]);
    sh.tri([0, FLOOR, 0], lo(B, FLOOR), lo(A, FLOOR), C.floor, [0, 1, 0], [0, 1, 0], [0, 1, 0]);
    // the cut paper edge, 0.005 wide (0.0005 out and in of the 0.004 wall)
    sh.quad(pos(A, A.rim, -0.0005), pos(A, A.rim, WALL + 0.0005), pos(B, B.rim, WALL + 0.0005), pos(B, B.rim, -0.0005), C.rim);
  }
  return sh.geo();
}
// the fries' bed: a flat top at y 0.17 over the inside
function buildBed() {
  const S = perimeter(), n = S.length, sh = soup();
  for (let i = 0; i < n; i++) sh.tri([0, BED, 0], pos(S[(i + 1) % n], BED, WALL + 0.0003), pos(S[i], BED, WALL + 0.0003), "#cc8735", [0, 1, 0], [0, 1, 0], [0, 1, 0]);
  return sh.geo();
}

// fixed fries: x at the rim line, lean outward (deg), tip y; each row also leans toward its side (deg) and sits at z
const BACK = { z: 0.02, sz: 1, toward: 3, fries: [[-0.1075, 14, 0.325], [-0.0645, 5, 0.34], [0.0215, 2, 0.335], [0.0645, 8, 0.365], [0.1075, 15, 0.32]] };
const FRONT = { z: -0.018, sz: -1, toward: 6, fries: [[-0.092, 12, 0.29], [-0.046, 4, 0.315], [0, 1, 0.3], [0.046, 6, 0.32], [0.092, 13, 0.285]] };
const SLOT = [-0.0215, 0.18, 0.02];   // the loose fry's base in the carton's frame
const rad = (d) => (d * Math.PI) / 180;

const up = new THREE.Vector3(0, 1, 0);
export const CARTON_KINDS = {
  friescarton(P) {
    const S = P.spec, empty = S.fill === "empty" || S.fill === 0;
    const sm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }); sm.userData.noHatch = true;
    mesh(buildShell(), sm, P.whole);
    if (empty) {
      // two grease blots on the inside of the back panel (drawn once each), three crumbs in the floor seam
      const slope = 0.02 / T, nrm = new THREE.Vector3(0, slope, -1).normalize();
      for (const [w, h, x, y] of [[0.034, 0.024, -0.045, 0.215], [0.022, 0.018, 0.06, 0.2]]) {
        const bm = new THREE.MeshStandardMaterial({ color: "#cdb07c", roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }); bm.userData.noOutline = true; bm.userData.noHatch = true;
        const o = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), bm); o.scale.set(w, h, 1);
        o.position.set(x, y, rAt(y) - WALL - 0.0006); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm); o.userData.solid = false; P.whole.add(o);
      }
      for (const [x, z, hex, ry] of [[-0.05, 0.012, "#ecb348", 0.4], [0.02, -0.015, "#ecb348", -0.3], [0.06, 0.018, "#cc8735", 0.9]]) {
        const cm = mat(hex, { roughness: 0.7 }); cm.userData.noHatch = true;
        mesh(new THREE.BoxGeometry(0.01, 0.006, 0.007), cm, P.whole, x, FLOOR + 0.003, z).rotation.y = ry;
      }
    } else {
      const bm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }); bm.userData.noHatch = true;
      mesh(buildBed(), bm, P.whole);
      const gm = vmat();
      for (const row of [BACK, FRONT]) for (const [x, deg, tipY] of row.fries) {
        // passes through (x, 0.24, row z) leaning outward and toward its side; the bottom is cut at y 0.13, the tip at tipY
        const v = new THREE.Vector3(Math.sign(x || 1) * Math.tan(rad(deg)), 1, row.sz * Math.tan(rad(row.toward))), c0 = new THREE.Vector3(x, T, row.z);
        const b = c0.clone().addScaledVector(v, 0.13 - T), L = (tipY - 0.13) * v.length();
        const g = new THREE.Group(); g.position.copy(b); g.quaternion.setFromUnitVectors(up, v.clone().normalize()); P.whole.add(g);
        mesh(fryGeo(L), gm, g);
      }
      // the loose fry's slot: the same fry as `loosefry`, standing upright in the carton
      const slot = new THREE.Group(); slot.position.set(...SLOT); P.whole.add(slot);
      mesh(fryGeo(), gm, slot);
      const apply = (ps) => { slot.visible = !((ps.taken ?? S.taken ?? 0) > 0.5); };
      apply({});
      return { grip: 0.1, apply };
    }
    return { grip: 0.1 };
  },

  loosefry(P) {
    const S = P.spec, gm = vmat(), whole = mesh(fryGeo(), gm, P.whole), bitten = mesh(fryGeo(FRY.len, 0.09, true), gm, P.whole);
    const apply = (ps) => { const b = (ps.bite ?? S.bite ?? 0) > 0.5; whole.visible = !b; bitten.visible = b; };
    apply({});
    return { grip: 0.204, apply };
  },
};
