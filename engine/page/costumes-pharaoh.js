import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clothMat, inkMesh, sstep } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";
import { taperedTube } from "./geo.js";

// EGYPT EP04 SERAPEUM kit (18 Nov 2026, task T1): the PHARAOH, a dry, proud mummy king (the series' guide), and the MEMPHIS PRIESTS (the
// Egyptian worker in a long robe). Two costume types through castCostume (costumes-cast.js): "pharaoh" and "priest". Design:
// storyboards/series/ancient-aliens/04-serapeum/DESIGN.md section 3 (Pharaoh) and section 6 Memphis "Workers" (priests); the look target is
// panels 03, 06, 16, 19, 23, 24 (Pharaoh) and 04 (priests) of the Egypt EP04 sheets. Cast files: characters/ancient-aliens/pharaoh.json,
// priest.json, priest-leopard.json. Face type "pharaoh" in characters/sheet-cast.json (the priests carry the worker's face in face.final).
//
//   pharaoh  Body 0.93 high x 0.68 wide x 0.60 deep (taper 0.10), base (feet to body) 0.14, skin #e0a655, no sprout, 17 cheek freckles. Face:
//            size 0.86, eyeU 0.20, eyeV 0.64, browV 0.73; heavy kohl-lined upper lids (rest lids 0.42), the left (+x) brow raised, a thin dry
//            mouth (it opens for talk), no blush. What the costume adds, all real geometry, every mark with its own place, width and
//            strength from the hash q(i,k) of DESIGN.md section 2:
//            - LINEN, 14 bands (0.004 thick, shaded per band): 9 round the torso (y = 0.19 + 0.054 i, each tilted, the upper three leave the
//              front free for the face and the collar), 3 round the neck, 2 crossed shoulder bands over the chest; 10 fibre strokes per band,
//              edge nicks and dust stains; 5 free ends with 5 frayed tips each (left shoulder, right shoulder, rear left hip, right hip, left
//              shin); 6 coils per arm and 4 per ankle (rebuilt every frame on the arm's own curve, whatever pose); 3-finger hands wrapped
//              twice on each finger (they follow the rig's fingers, any grip); the feet wrapped with a wrapped sole.
//            - NEMES: lapis and gold, one cloth over the head (y 0.77 .. 1.095, front edge 0.86 over the brows), the stripes are real bands
//              with a groove between them (lapis first from the crown, 0.049 lapis / 0.037 gold), two lappets hanging in front of the shoulders
//              to y 0.365 (two folds each), the tail down the back to y 0.44, a 0.047 gold band round the head at y 0.888, a gold cobra
//              (0.14 high, hood 0.091 wide, 5 grooves, 2 carnelian eyes) at the front of the band.
//            - COLLAR: 4 rows of 26 beads in front (gold / lapis / turquoise / carnelian cycles), a counterpoise behind, dark backing,
//              gold edge binding. - BEARD: the royal plaited beard under the mouth: 0.08 long, 0.035 wide at the top
//              tapering to 0.025, flat front, 5 blue and gold bands, a gold tie at the root; top y 0.59 (mouth y 0.624, talk gap 0.011 .. 0.026 -> at least 0.02 clear), hangs straight over the collar's top row.
//   priest   Memphis priest: characters/ancient-aliens/priest.json (body 0.82 x 0.60 x 0.50, the worker's) = the worker's body, face, skin and hands with a shaved bare head (no cloth on it), in a long pleated robe (12 pleats, 0.023 deep) with short wide sleeves (4 folds), bare golden forearms and
//            the worker's hands. costume.leopard true (priest-leopard.json): a leopard-skin panel 0.54 x 0.45 across the left shoulder to the right
//            hip with 27 rosettes and 18 fringe strands. No hair mesh, 8 scalp flecks.
//   costume keys (pharaoh, default): linen "#d9c3a0" | fibre "#f0dbb5" | fold "#aa906e" | tear "#765c49" | gold "#dca83b" | goldDark "#876328" |
//     goldLight "#f6d570" | lapis "#26447b" | lapisDark "#1d2c52" | turquoise "#3f9c9c" | carnelian "#a94830" | hands "#d9c3a0".
//   priest keys: robe "#ede1c9" | robeShade "#b5a086" | leopard false (true: the panel) | pelt "#c78e43" | rosette "#472c24" (+ the worker's keys).
//   No props, nothing standable. Origin: his feet on the floor (the rig's). Nothing is animated by the costume except the wraps on the arms and
//   legs (rebuilt when the pose changes); everything else follows the body.
//
// POSE VALUES (checked in the bench stills, storyboards/series/ancient-aliens/04-serapeum/bench/eg-pharaoh-sheet.png; rig { hand: 2 }; "R" = his
// right = -x = screen left when he faces the camera; arm pose o = [out from the body, height as a share of the body, forward], mirrored per side):
//   eyes slide sideways (panel 06, pupils screen right, lids heavier; the beard and the mouth stay put):
//     { do: "look", to: [0.7, 0], dur: 0.24 }  and  { do: "face", lidL: 0.47, lidR: 0.47, dur: 0.24 }   (back: look [0, 0], lids 0.42)
//   cough into the right wrapped hand (panel 23: the hand covers mouth and chin, eyes shut, brows down):
//     { do: "arm", side: "R", pose: { o: [-0.34, 0.455, 0.35], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } }, dur: 0.27, ease: "settle" }
//     { do: "face", lidL: 1, lidR: 1, browL: -0.3, browR: -0.3, dur: 0.12 }
//   arms spread wide, palms to the camera (panel 24: both arms nearly level, abduction ~78 deg; the same pose for both sides, o[0] is "out"):
//     { do: "arm", side: "L", pose: { o: [0.3, 0.3, 0.12], frame: { y: [0, 0.4, 0.9], z: [0, 1, 0] } }, dur: 0.68 }   and the same for side "R"
//     { do: "grip", side: "L", shape: "open", dur: 0.3 } (and "R")
//   at rest his arms hang out a little (the rig's rest pose); the wraps follow any arm pose, the finger wraps follow any grip.
// Deviations from DESIGN.md section 3 (reasons): the beard hangs 0.018 in front of the skin (the body's chest is 0.03 in front of the design's
// profile), the collar front rows rise over the shoulders by 0.03 so the arms leave from under it; the leopard panel (priests) is 0.32 wide (0.45
// would cover the face on a 0.82 body); marks use a hashed q(i,k) (the golden-ratio form lines the marks of one band up on a diagonal); the
// nemes' front edge is at y 0.86 (the brows are at 0.80-0.84); lappets end before the arm roots (th 1.3), so the arms leave from beside them.
// Hand-drawn rules as everywhere (costumes-aliens.js): each mark has its own place, width and strength from a hash of its index (no repeating
// pattern, no Math.random, no clock).

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const q = (i, k) => hash2((i + 1) * 0.61803398875 * 11.7 + (k + 1) * 0.41421356237 * 5.3, (i + 1) * 0.41421356237 * 3.1 + (k + 1) * 0.61803398875 * 7.9);   // DESIGN.md section 2's q(i,k), through a hash: the plain golden-ratio form puts the marks of one band on a diagonal line
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const clamp01 = (x) => clamp(x, 0, 1);
const wrapPi = (x) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * Math.PI / 2) ** 2);
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const rgb = (hex) => new THREE.Color(hex);
const stdMat = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: o.roughness ?? 0.5, metalness: o.metalness ?? 0.15, side: o.side ?? THREE.FrontSide, ...(o.vertexColors ? { vertexColors: true } : {}) }); m.userData.lookRole = "cloth"; return m; };
const flatMat = (color, opacity, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; m.userData.noHatch = true; return Object.assign(m, o); };

// keep only position / normal / color, make every part non-indexed, then merge
function merge(gs) {
  const keep = gs.filter((g) => g?.attributes?.position?.count).map((g0) => {
    const g = g0.index ? g0.toNonIndexed() : g0.clone(); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "color"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.color) g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    return g;
  });
  return keep.length === 1 ? keep[0] : keep.length ? mergeGeometries(keep) : new THREE.BufferGeometry();
}
const paint = (g, hex) => { const c = rgb(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g; };

// ---------- a surface from a (u, v) grid: at(u, v) -> Vector3 (.k = shade 0..1, or .c = a Color); faces turned to outOf(p) ----------
function gridGeo(nu, nv, at, outOf, seam = false) {
  const pos = [], col = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z);
    if (p.c) col.push(p.c.r, p.c.g, p.c.b); else { const k = p.k ?? 1; col.push(k, k, k); }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  let s = 0; const A = V(0, 0, 0), B = V(0, 0, 0), Cc = V(0, 0, 0);
  for (let k = 0; k < idx.length; k += 3 * Math.max(1, Math.floor(idx.length / 3 / 200))) {
    A.fromArray(pos, idx[k] * 3); B.fromArray(pos, idx[k + 1] * 3); Cc.fromArray(pos, idx[k + 2] * 3);
    const n = B.clone().sub(A).cross(Cc.clone().sub(A)); if (n.lengthSq() < 1e-16) continue;
    s += Math.sign(n.dot(outOf(A.clone().add(B).add(Cc).multiplyScalar(1 / 3))));
  }
  if (s < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  if (seam) {
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}
// a flat ribbon along points (sides: a unit vector per point, ws: half width per point)
function ribbon(cs, sides, ws) {
  const pos = [], idx = [];
  cs.forEach((c, i) => { pos.push(...c.clone().addScaledVector(sides[i], -ws[i]).toArray(), ...c.clone().addScaledVector(sides[i], ws[i]).toArray()); });
  for (let i = 0; i < cs.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const tri = (a, b, c) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a.toArray(), ...b.toArray(), ...c.toArray()], 3)); g.computeVertexNormals(); return g; };

// ---------- parallel-transport frames along a curve (a tube's cross sections for any pose of an arm or leg) ----------
function framesOf(curve, M = 24) {
  const F = [], T = V(0, 0, 0), N = V(0, 1, 0), B = V(0, 0, 0); curve.getTangentAt(0, T);
  const w = sstep(0.75, 0.95, Math.abs(T.y)); N.set(0, 1 - w, w);
  for (let i = 0; i <= M; i++) { const t = i / M, p = curve.getPointAt(t); curve.getTangentAt(t, T); N.addScaledVector(T, -N.dot(T)); if (N.lengthSq() < 1e-8) N.set(1, 0, 0); N.normalize(); B.crossVectors(T, N); F.push({ p, T: T.clone(), N: N.clone(), B: B.clone() }); }
  return (t) => { const x = clamp01(t) * M, i = Math.min(M - 1, Math.floor(x)), f = x - i, a = F[i], b = F[i + 1]; return { p: a.p.clone().lerp(b.p, f), T: a.T.clone().lerp(b.T, f).normalize(), N: a.N.clone().lerp(b.N, f).normalize(), B: a.B.clone().lerp(b.B, f).normalize() }; };
}
// a linen coil round a tube: centre t, width w (m), tilt (rad), the tube's radius at t, thickness; its edge puffs a little
function coilGeo(frame, L, t, w, tilt, ph, rAt, thick, kk) {
  const cen = frame(t).p;
  return gridGeo(26, 3, (u, v) => {
    const a = u * TAU, ts = t + ((v - 0.5) * w) / L + (Math.tan(tilt) * Math.cos(a + ph) * w * 0.5) / L, f = frame(ts), d = f.N.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.B, Math.sin(a));
    const e = 1 - Math.abs(2 * v - 1) ** 2, p = f.p.clone().addScaledVector(d, rAt(clamp(ts, 0.02, 0.98)) + thick * (0.55 + 0.45 * e) + 0.0012 * Math.sin(a * 3 + kk));
    p.k = (0.9 + 0.12 * hs(kk, 3)) * (1 - 0.16 * (1 - e) * (0.5 + 0.5 * Math.cos(a - 1))); return p;
  }, (p) => p.clone().sub(cen), true);
}

export const PHARAOH_TYPES = ["pharaoh", "priest"];

// =====================================================================================================================================
function pharaohBody(C, ch, out) {
  const parts = ch.potatoParts, RX = ch.rx, RY = ch.ry, RZ = ch.rz, CY = ch.cy;
  const LIN = C.linen || "#d9c3a0", FIB = C.fibre || "#f0dbb5", FOLD = C.fold || "#aa906e", TEAR = C.tear || "#765c49";
  const GOLD = C.gold || "#dca83b", GOLDD = C.goldDark || "#876328", GOLDL = C.goldLight || "#f6d570", LAP = C.lapis || "#26447b", LAPD = C.lapisDark || "#1d2c52";
  const TURQ = C.turquoise || "#3f9c9c", CARN = C.carnelian || "#a94830";
  const outBody = (p) => V(p.x / RX, (p.y - CY) / RY, p.z / RZ);
  // the elevation that puts the skin at world height y when going round at angle th (surf's own numbers, two Newton steps)
  const phFor = (th, y) => { let ph = Math.asin(clamp((y - CY) / RY, -0.999, 0.999)); for (let i = 0; i < 2; i++) { const s = ch.surf(th, ph).pos; ph = clamp(ph + (y - s.y) / (RY * Math.max(0.2, Math.cos(ph))), -1.5, 1.5); } return ph; };
  const ringAt = (th, y) => ch.surf(th, phFor(th, y));
  const onBodyAt = (p) => { const th = Math.atan2(p.x / (RX * 0.95), p.z / (RZ * 0.95)), ph = Math.asin(clamp((p.y - CY) / RY, -0.99, 0.99)); return { th, ph, s: ch.surf(th, ph) }; };
  const linenM = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true, role: "glove" }); linenM.color.set(LIN);
  const addTo = (g, m, shadow = true) => parts.add(mesh(g, m, shadow));
  const FOLDK = (() => { const l = new THREE.Color(LIN), f = new THREE.Color(FOLD); return new THREE.Color(f.r / l.r, f.g / l.g, f.b / l.b); })();   // the fold colour as a multiplier of the linen
  const linGeos = [];   // everything made of linen on the body (merged into one mesh at the end)
  const stainGeos = [], fibreGeos = [], nickGeos = [];

  // ======================================================== LINEN: 9 torso bands + 3 neck bands (rings round the body, each tilted)
  const bandSpec = [];
  const SLOPE = [-12, 18, -9, 24, -16, 10, -20, 14, -8];
  for (let i = 0; i < 9; i++) bandSpec.push({ y: 0.19 + 0.054 * i, w: 0.074 + 0.004 * (i % 3), sl: SLOPE[i], gap: i >= 6 ? 1.2 : 0, lift: 0.0072, i });
  [[0.52, -5, 1.2], [0.545, 7, 1.2], [0.575, -4, 1.2]].forEach(([y, sl, gap], k) => bandSpec.push({ y, w: 0.034, sl, gap, lift: 0.0045, i: 9 + k }));
  const bandInfo = [];   // for the fibre strokes, nicks, stains
  for (const b of bandSpec) {
    const sl = Math.tan(b.sl * Math.PI / 180), th0 = b.gap, th1 = TAU - b.gap, lift0 = b.lift + 0.0014 * (b.i % 2), kb = 0.97 + 0.1 * q(b.i, 3);
    const at = (u, v, off = 0) => {
      const th = th0 + u * (th1 - th0), x = ringAt(th, b.y).pos.x, yc = b.y + sl * x * 0.9, ph = phFor(th, yc + (v - 0.5) * b.w), s = ch.surf(th, ph);
      const e = 1 - Math.abs(2 * v - 1) ** 3, p = s.pos.clone().addScaledVector(s.normal, lift0 * (0.5 + 0.5 * e) + 0.0012 * Math.sin(th * 5 + b.i * 2.3) + off);
      const tone = kb * (0.96 + 0.06 * Math.sin(th * 9 + b.i)), sh = Math.max(sstep(0.5, 0.97, v), sstep(0.2, 0, v) * 0.6);   // the fold shade (#aa906e) under each band edge
      p.c = new THREE.Color(tone, tone, tone).lerp(FOLDK, sh * 0.95); p.nrm = s.normal; return p;
    };
    const nu = Math.max(24, Math.round(150 * (th1 - th0) / TAU));
    linGeos.push(gridGeo(nu, 3, (u, v) => at(u, v), outBody, th0 === 0));
    bandInfo.push({ b, at, th0, th1 });
  }
  // the under-wrap: one linen layer under the bands, in the fold shade, so a gap between two bands shows linen and never skin (below the chin, the face stays free)
  for (const [y0, y1, gap] of [[0.15, 0.56, 0], [0.56, 0.82, 1.3]]) {
    const th0 = gap, th1 = TAU - gap, nu = Math.max(24, Math.round(150 * (th1 - th0) / TAU));
    linGeos.push(gridGeo(nu, 6, (u, v) => { const th = th0 + u * (th1 - th0), s = ch.surf(th, phFor(th, y0 + (y1 - y0) * v)), p = s.pos.clone().addScaledVector(s.normal, 0.0024); p.k = 0.8 + 0.06 * Math.sin(th * 6 + v * 7); return p; }, outBody, th0 === 0));
  }
  // two crossed shoulder bands, (+-0.29, 0.57, 0.19) -> (-+0.16, 0.28, 0.29), width 0.085, lying over the others
  for (const sd of [-1, 1]) {
    const A = V(sd * 0.29, 0.57, 0.19), B = V(-sd * 0.16, 0.28, 0.29), N = 40, cs = [], ns = [];
    for (let k = 0; k <= N; k++) { const p = A.clone().lerp(B, k / N), o = onBodyAt(p); cs.push(o.s.pos); ns.push(o.s.normal); }
    const at = (u, v) => {
      const k = Math.round(u * N), i = clamp(k, 0, N), T = cs[Math.min(N, i + 1)].clone().sub(cs[Math.max(0, i - 1)]).normalize(), side = ns[i].clone().cross(T).normalize();
      const e = 1 - Math.abs(2 * v - 1) ** 3, p = cs[i].clone().addScaledVector(side, (v - 0.5) * 0.085).addScaledVector(ns[i], 0.0062 * (0.5 + 0.5 * e));
      p.k = (sd > 0 ? 0.97 : 1.02) * (1 - 0.2 * sstep(0.6, 1, v)); p.nrm = ns[i]; return p;
    };
    linGeos.push(gridGeo(N, 3, at, outBody)); bandInfo.push({ b: { i: sd > 0 ? 12 : 13, w: 0.085 }, at, th0: 0, th1: 1 });
  }
  // fibre strokes (10 per band: 0.013-0.060 long, 0.0009 wide), edge nicks (7) and dust stains (12), all on the bands
  bandInfo.forEach(({ b, at, th0, th1 }, bi) => {
    for (let s = 0; s < 10; s++) {
      const u0 = 0.04 + 0.9 * q(s, bi * 3), len = (0.013 + 0.047 * q(s, bi * 3 + 11)) / Math.max(0.2, (th1 - th0) * 0.3), v0 = 0.1 + 0.8 * q(s, bi * 3 + 7), dv = (q(s, bi * 3 + 13) - 0.5) * 0.12, cs = [], sd = [];
      for (let k = 0; k <= 4; k++) { const u = clamp(u0 + len * (k / 4), 0, 1); const p = at(u, clamp(v0 + dv * k / 4, 0.05, 0.95), 0.0009); cs.push(p); sd.push(null); }
      cs.forEach((p, k) => { const T = cs[Math.min(4, k + 1)].clone().sub(cs[Math.max(0, k - 1)]); sd[k] = (p.nrm || V(0, 1, 0)).clone().cross(T).normalize(); });
      fibreGeos.push(ribbon(cs, sd, cs.map(() => 0.00045)));
    }
  });
  const edgeInk = [];   // each band's lower and upper edge: a hand-drawn line in 2-4 strokes with gaps
  bandInfo.forEach(({ at, th0, th1 }, bi) => {
    for (const [v, nst] of [[0.03, 3], [0.97, 3]]) {
      let u = 0.02 + 0.1 * q(bi, v * 50);
      for (let st = 0; st < nst && u < 0.95; st++) {
        const len = (0.3 + 0.2 * q(st, bi * 7 + (v > 0.5 ? 3 : 0))) * (th1 - th0 > 2 ? 1 : 1.6), u1 = Math.min(0.99, u + len), cs = [], sd = [];
        for (let k = 0; k <= 10; k++) cs.push(at(u + (u1 - u) * k / 10, v, 0.0012));
        cs.forEach((p, k) => { const T = cs[Math.min(10, k + 1)].clone().sub(cs[Math.max(0, k - 1)]); sd[k] = (p.nrm || V(0, 0, 1)).clone().cross(T).normalize(); });
        edgeInk.push(ribbon(cs, sd, cs.map((_, k) => 0.0032 * Math.sin(Math.PI * (0.08 + 0.84 * k / 10)) * (0.7 + 0.5 * q(st, bi + 5)))));
        u = u1 + 0.015 + 0.05 * q(st, bi * 3 + 1);
      }
    }
  });
  for (let n = 0; n < 7; n++) {   // an edge nick: a little dark notch on the lower or upper edge of a band
    const bi = Math.floor(q(n, 1) * 12), { at, b } = bandInfo[bi], u = 0.1 + 0.8 * q(n, 5), top = q(n, 9) < 0.5, L = 0.007 + 0.011 * q(n, 21), W = 0.003 + 0.004 * q(n, 23), v = top ? 0.99 : 0.01;
    const p0 = at(u, v, 0.001), p1 = at(clamp(u + L / 0.5, 0, 1), v, 0.001), pm = at((u + clamp(u + L / 0.5, 0, 1)) / 2, top ? 0.99 - W / b.w : 0.01 + W / b.w, 0.001);
    nickGeos.push(tri(p0, p1, pm));
  }
  for (let n = 0; n < 12; n++) {   // a dust stain: a soft darker patch
    const bi = Math.floor(q(n, 2) * 14), { at } = bandInfo[bi], c = at(0.1 + 0.8 * q(n, 6), 0.3 + 0.4 * q(n, 8), 0.0016), r = 0.007 + 0.0135 * q(n, 25), g = new THREE.CircleGeometry(r, 14), nrm = c.nrm || V(0, 0, 1);
    g.scale(1, 0.55 + 0.45 * q(n, 27), 1); g.rotateZ(q(n, 29) * 3);
    g.applyMatrix4(new THREE.Matrix4().compose(c, new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nrm), V(1, 1, 1))); stainGeos.push(g);
  }

  // ======================================================== FREE ENDS: 5 strips with 5 frayed tips each
  // [th, y, hang length, width, outward angle of the sway]
  const ENDS = [[1.65, 0.64, 0.18, 0.036, 1.0], [-1.65, 0.65, 0.14, 0.032, -1.0], [2.05, 0.4, 0.16, 0.04, 1.0], [-1.0, 0.32, 0.12, 0.03, -1.2]];
  const freeEnd = (th, y0, L, W, sway, key, sRef) => {
    const N = 12, P = [], Nr = [], up = V(0, -1, 0);
    for (let k = 0; k <= N; k++) {
      const t = k / N, s = ringAt(th + sway * 0.06 * t * t, y0 - L * 0.85 * t), n = s.normal.clone();
      P.push(s.pos.clone().addScaledVector(n, 0.0055 + 0.07 * t ** 1.3 + 0.005 * Math.sin(t * 5 + key)).addScaledVector(V(0, -1, 0), 0.15 * L * t * t)); Nr.push(n);
    }
    const sides = P.map((p, k) => Nr[k].clone().cross(P[Math.min(N, k + 1)].clone().sub(P[Math.max(0, k - 1)])).normalize());
    const g = [], wv = (t) => W * 1.4 * (1 - 0.1 * t) * 0.5;
    const body = gridGeo(3, N, (u, v) => { const k = Math.round(v * N), p = P[k].clone().addScaledVector(sides[k], (u - 0.5) * 2 * wv(v)); p.k = (0.94 + 0.08 * hs(key, 4)) * (1 - 0.14 * Math.abs(2 * u - 1)); return p; }, (p) => outBody(p), false);
    g.push(body);
    // 5 frayed tips: triangles of different length, each on its own fifth of the width
    const last = P[N], sd = sides[N], dn = last.clone().sub(P[N - 1]).normalize();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5 - 0.5) * 2 * wv(1), b = ((k + 1) / 5 - 0.5) * 2 * wv(1), l = 0.01 + 0.014 * q(k, key * 3 + 1), lean = (q(k, key * 3 + 5) - 0.5) * 0.012;
      const tg = tri(last.clone().addScaledVector(sd, a), last.clone().addScaledVector(sd, b), last.clone().addScaledVector(sd, (a + b) / 2 + lean).addScaledVector(dn, l)); paint(tg, shade(LIN, 0.9 + 0.1 * q(k, key)));
      g.push(tg);
    }
    return g;
  };
  const endGeos = []; ENDS.forEach(([th, y, L, W, sw], k) => endGeos.push(...freeEnd(th, y, L, W, sw, k + 1)));
  for (const g of endGeos) if (!g.attributes.color) paint(g, "#ffffff");

  // ======================================================== NEMES
  const NTOP = 1.095, FRONT_HEM = 0.86, EAR_HEM = 0.77, LAP_HEM = 0.365, TAIL_HEM = 0.44;
  const yBody = (ph) => CY + RY * Math.sin(ph);
  const lapL = (a) => sstep(0.8, 0.98, a) * sstep(1.3, 1.12, a);          // 0..1 across a lappet (inner edge .. outer edge)
  const tailL = (a) => sstep(2.66, 2.74, a);
  const hemY = (th) => { const a = Math.abs(wrapPi(th)), base = EAR_HEM + (FRONT_HEM - EAR_HEM) * sstep(0.9, 0.55, a); let y = base - (base - LAP_HEM) * lapL(a); if (a > Math.PI - 0.46) { const d = (Math.PI - a) / 0.46; y = Math.min(y, TAIL_HEM + 0.075 * (1 - Math.sqrt(Math.max(0, 1 - d * d)))); } return y; };
  const nOff = (th, ph) => {
    const a = Math.abs(wrapPi(th)), y = yBody(ph);
    let o = 0.012 + 0.013 * sstep(0.9, 1.5, ph) + 0.02 * sstep(0.6, 2.6, a);
    const hang = sstep(EAR_HEM + 0.03, LAP_HEM, y);   // 0 at the shoulder .. 1 at the hem
    o += 0.036 * hang * lapL(a) + 0.02 * hang * tailL(a);
    for (const c of [0.98, 1.2]) o += 0.012 * bump((a - c) / 0.07) * hang * lapL(a) * 1;   // two folds per lappet, 0.012 deep
    return o;
  };
  const nemesAt = (th, ph0, off = 0) => {
    const ph = Math.min(ph0, 1.52), s = ch.surf(th, ph), a = Math.abs(wrapPi(th)), y = yBody(ph), hang = sstep(EAR_HEM + 0.03, LAP_HEM, y) * lapL(a), p = s.pos.clone().addScaledVector(s.normal, nOff(th, ph) + off);
    p.z += 0.03 * hang; p.nrm = s.normal; return p;
  };
  const phHem = (th) => phFor(th, hemY(th) - 0.016);
  // the stripes: lapis first from the crown, 0.049 lapis / 0.037 gold, alternating down to the hem
  const bands = []; { let y = NTOP, k = 0; while (y > 0.33) { const w = k % 2 ? 0.037 : 0.049; bands.push({ y0: y, y1: y - w, col: k % 2 ? GOLD : LAP, dark: k % 2 ? GOLDD : LAPD, k }); y -= w; k++; } }
  const phOfY = (y) => (y >= NTOP - 1e-6 ? Math.PI / 2 : Math.asin(clamp((y - 0.02 - CY) / RY, -0.999, 0.999)));
  const NC = 200, nemesGeos = [];
  {
    const cols = Array.from({ length: NC + 1 }, (_, c) => -Math.PI + (TAU * c) / NC), hemPh = cols.map(phHem);
    const intervals = [];   // [ph from, ph to, colour, groove]
    for (const b of bands) { const pa = phOfY(b.y0), pb = phOfY(b.y1), gp = 0.0011 / (RY * 0.6); intervals.push([pa, pb + gp, rgb(b.col), false, b], [pb + gp, pb - gp, rgb(b.dark), true, b]); }
    for (const [pa, pb, col, groove, b] of intervals) {
      const sub = groove ? 1 : 3;
      const g = gridGeo(NC, sub, (u, v) => {
        const c = Math.round(u * NC), th = cols[c], ph = Math.max(Math.min(pa + (pb - pa) * v, Math.PI / 2), hemPh[c]);
        const p = nemesAt(th, ph, groove ? -0.0014 : 0.0006 * Math.sin(v * Math.PI)), tone = groove ? 0.9 : 0.93 + 0.1 * q(b.k, 7) + 0.05 * Math.sin(th * 3 + b.k * 2);
        p.c = col.clone().multiplyScalar(tone * (1 - 0.1 * (1 - v) * 0)); return p;
      }, outBody, true);
      nemesGeos.push(g);
    }
    // the cut edge of the cloth along the hem: a thin strip, 0.004 thick, in the colour of the stripe it ends in
    const edge = gridGeo(NC, 1, (u, v) => { const c = Math.round(u * NC), th = cols[c], ph = hemPh[c], p = nemesAt(th, ph, v ? -0.004 : 0); const y = yBody(ph), b = bands.find((bb) => y <= bb.y0 - 0.02 && y > bb.y1 - 0.02) || bands[0]; p.c = rgb(b.dark).multiplyScalar(0.85); return p; }, outBody, true);
    nemesGeos.push(edge);
    // a hem line of 24 tiny nicks? no: the nemes is whole cloth. The front edge over the brows is drawn by the toon outline.
  }
  const nemesM = stdMat("#ffffff", { roughness: 0.8, metalness: 0, side: THREE.DoubleSide, vertexColors: true }); nemesM.userData.lookRole = "cloth";
  // gold band round the head at y 0.888 (0.047 wide), raised on the cloth
  const bandG = gridGeo(NC, 4, (u, v) => {
    const th = -Math.PI + u * TAU, y = 0.888 + (v - 0.5) * 0.047, ph = phFor(th, y - nOff(th, phFor(th, y)) * 0.8), s = ch.surf(th, ph), p = s.pos.clone().addScaledVector(s.normal, nOff(th, ph) + 0.0065 * (0.6 + 0.4 * (1 - Math.abs(2 * v - 1) ** 2)));
    const e = Math.abs(2 * v - 1); p.c = rgb(e > 0.82 ? GOLDD : e > 0.7 ? GOLDL : GOLD).multiplyScalar(0.96 + 0.06 * Math.sin(th * 11)); return p;
  }, outBody, true);
  const goldM = stdMat("#ffffff", { roughness: 0.42, metalness: 0.1, vertexColors: true, side: THREE.DoubleSide });
  addTo(merge(nemesGeos), nemesM); addTo(bandG, goldM);

  // ---- the cobra: a gold uraeus at the front of the band, 0.14 high, hood 0.091 wide and 0.029 deep, 5 grooves, 2 carnelian eyes
  {
    const gm = stdMat(GOLD, { roughness: 0.4, metalness: 0.12 }), gd = stdMat(GOLDD, { roughness: 0.5, metalness: 0.1 }), cm = stdMat(CARN, { roughness: 0.4, metalness: 0 });
    const cobra = new THREE.Group();
    const bz = ringAt(0, 0.86).pos.z + nOff(0, phFor(0, 0.86)) + 0.01;   // front of the band
    const neck = new THREE.CatmullRomCurve3([V(0, 0.853, bz - 0.004), V(0, 0.884, bz + 0.014), V(0, 0.915, bz + 0.03), V(0, 0.945, bz + 0.036)]);
    cobra.add(mesh(taperedTube(neck, 0, 0, 14, 12, (t) => 0.0125 * (1 - 0.15 * t)), gm));
    const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), gm); hood.scale.set(0.0455, 0.036, 0.0145); hood.position.set(0, 0.944, bz + 0.036); hood.castShadow = true; cobra.add(hood);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.0165, 16, 12), gm); head.scale.set(0.95, 0.9, 1.2); head.position.set(0, 0.985, bz + 0.042); head.castShadow = true; cobra.add(head);
    const hp = V(0, 0.944, bz + 0.036);
    for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 8, 6), cm); e.position.set(sd * 0.0095, 0.99, bz + 0.058); cobra.add(e); }
    // the hood's grooves: 5 thin ridges down its face, each on the ellipsoid's own surface
    const grooves = [];
    for (let k = 0; k < 5; k++) {
      const x = (k - 2) * 0.0135, ps = [], ns = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, y = 0.944 + (-0.03 + 0.056 * t) * (1 - 0.15 * Math.abs(k - 2) * 0.5) * 1, rx = x / 0.0455, ry = (y - 0.944) / 0.036, s = 1 - rx * rx - ry * ry;
        if (s <= 0.02) continue; ps.push(V(x, y, hp.z + 0.0145 * Math.sqrt(s) + 0.001)); ns.push(V(0, 0, 1));
      }
      if (ps.length > 2) grooves.push(ribbon(ps, ps.map(() => V(1, 0, 0)), ps.map((_, i) => 0.0009 * (0.7 + 0.5 * Math.sin(Math.PI * i / (ps.length - 1))))));
    }
    cobra.add(inkMesh(merge(grooves), GOLDD, 0.7));
    // a collar plate where it meets the band
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.022, 0.008, 16), gm); plate.position.set(0, 0.856, bz - 0.003); plate.rotation.x = 0.4; plate.castShadow = true; cobra.add(plate);
    parts.add(cobra);
  }

  // ======================================================== COLLAR: 4 rows of 26 beads in front, a counterpoise behind, backing, binding
  {
    const ROWS = [0.525, 0.497, 0.469, 0.441], CYC = [[GOLD, LAP, TURQ, LAP], [CARN, GOLD, TURQ], [TURQ, LAP, CARN, GOLD], [GOLD, GOLD, CARN]];
    const beadGeo = { }, base = [], bind = [], EX = 0.285, ZC = 0.0525, EZ = 0.2515;
    const rowPt = (phi, r, off = 0) => {   // the collar's ellipse, projected on the body, lifted over the shoulders
      const x = EX * Math.sin(phi), z = ZC + EZ * Math.cos(phi), y = ROWS[r] + 0.09 * (x / EX) ** 2, th = Math.atan2(x / (RX * 0.95), z / (RZ * 0.95)), s = ringAt(th, y);
      const lift = 0.0075 + 0.03 * sstep(0.45, 0.95, Math.abs(Math.sin(phi))) + off;
      return { p: s.pos.clone().addScaledVector(s.normal, lift), n: s.normal, th };
    };
    for (const [phi0, phi1, back] of [[-75, 75, false], [105, 255, true]]) {
      for (let r = 0; r < 4; r++) {
        const cyc = CYC[r], N = 26;
        for (let j = 0; j < N; j++) {
          const f = (j + 0.5) / N, phi = (phi0 + (phi1 - phi0) * f) * Math.PI / 180, e = 0.5 / N * (phi1 - phi0) * Math.PI / 180 * 0.5;
          const a = rowPt(phi - e, r), b = rowPt(phi + e, r), c = rowPt(phi, r), T = b.p.clone().sub(a.p), wlen = T.length(), Tn = T.normalize(), Nn = c.n.clone().sub(Tn.clone().multiplyScalar(c.n.dot(Tn))).normalize(), Up = Nn.clone().cross(Tn).normalize();
          const M = new THREE.Matrix4().makeBasis(Tn, Up, Nn);
          const key = cyc[j % cyc.length], g = new THREE.SphereGeometry(0.5, 8, 6); g.scale(Math.min(0.0155, wlen * 0.9), 0.018 * (0.96 + 0.08 * q(j, r)), 0.009);
          g.applyMatrix4(new THREE.Matrix4().compose(c.p, new THREE.Quaternion().setFromRotationMatrix(M), V(1, 1, 1))); paint(g, shade(key, 0.92 + 0.14 * q(j, r * 5 + 2)));
          (beadGeo[key] ||= []).push(g);
        }
        // the dark backing between the beads
        const NB = 40, cs = [], sd = [];
        for (let k = 0; k <= NB; k++) { const phi = (phi0 + (phi1 - phi0) * k / NB) * Math.PI / 180, a = rowPt(phi, r, -0.0042); cs.push(a.p); sd.push(null); }
        cs.forEach((p, k) => { const o = rowPt((phi0 + (phi1 - phi0) * k / NB) * Math.PI / 180, r); const T = cs[Math.min(NB, k + 1)].clone().sub(cs[Math.max(0, k - 1)]); sd[k] = o.n.clone().cross(T).normalize(); });
        base.push(paint(ribbon(cs, sd, cs.map(() => 0.0105)), "#3b2a22"));
        if (r === 0 || r === 3) { // edge binding 0.009 wide, along the top of row 0 and the bottom of row 3
          const cs2 = [], sd2 = [];
          for (let k = 0; k <= NB; k++) { const phi = (phi0 + (phi1 - phi0) * k / NB) * Math.PI / 180, a = rowPt(phi, r, 0.0005); const T = rowPt(phi + 0.02, r).p.clone().sub(rowPt(phi - 0.02, r).p).normalize(); const up = a.n.clone().cross(T).normalize(); cs2.push(a.p.clone().addScaledVector(up, (r === 0 ? 1 : -1) * 0.0155)); sd2.push(up); }
          bind.push(paint(ribbon(cs2, sd2.map((u) => u), cs2.map(() => 0.0045)), GOLDD));
        }
      }
    }
    for (const [key, gs] of Object.entries(beadGeo)) addTo(merge(gs), stdMat("#ffffff", { roughness: 0.42, metalness: 0.1, vertexColors: true }));
    addTo(merge([...base, ...bind]), stdMat("#ffffff", { roughness: 0.7, metalness: 0, vertexColors: true, side: THREE.DoubleSide }), false);
  }

  // ======================================================== BEARD: the royal plaited beard under the mouth, flat front, 5 blue and gold bands, a gold tie at the root
  {
    const TY = 0.588, L = 0.08, N = 5, HT = 0.0175, HB = 0.0125, DEP = 0.014, zc = ringAt(0, 0.55).pos.z + 0.018 - DEP / 2;
    const hw = (y) => HB + (HT - HB) * (y - (TY - L)) / L, gs = [], ink = [];
    for (let k = 0; k < N; k++) {
      const yt = TY - (L / N) * k, yb = yt - L / N + 0.0006, g = new THREE.BoxGeometry(1, 1, 1);
      const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const yy = yb + (yt - yb) * (P.getY(i) + 0.5), w = hw(yy); P.setXYZ(i, P.getX(i) * 2 * w, yy, zc + P.getZ(i) * DEP); }
      g.computeVertexNormals(); gs.push(paint(g.toNonIndexed(), k % 2 ? GOLD : LAP));
      if (k) { const y = yt, w = hw(y), ps = [V(-w, y, zc + DEP / 2 + 0.0006), V(0, y, zc + DEP / 2 + 0.0006), V(w, y, zc + DEP / 2 + 0.0006)]; ink.push(ribbon(ps, ps.map(() => V(0, 1, 0)), ps.map(() => 0.0007))); }
    }
    addTo(merge(gs), stdMat("#ffffff", { roughness: 0.6, metalness: 0.1, vertexColors: true }));
    parts.add(inkMesh(merge(ink), GOLDD, 0.6));
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(HT * 1.18, HT * 1.18, 0.008, 18), stdMat(GOLD, { roughness: 0.4 })); tie.scale.set(1, 1, 0.55); tie.position.set(0, TY - 0.002, zc); tie.castShadow = true; parts.add(tie);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(HT * 1.18, 0.0018, 6, 18), stdMat(GOLDD, { roughness: 0.5 })); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 0.55, 1); rim.position.set(0, TY + 0.002, zc); parts.add(rim);
  }

  // ======================================================== body linen: merge, add marks
  addTo(merge([...linGeos, ...endGeos]), linenM);
  if (edgeInk.length) parts.add(inkMesh(merge(edgeInk), FOLD, 0.5));
  if (fibreGeos.length) parts.add(mesh(merge(fibreGeos), flatMat(FIB, 0.7), false));
  if (nickGeos.length) parts.add(mesh(merge(nickGeos), flatMat(TEAR, 0.95), false));
  if (stainGeos.length) parts.add(mesh(merge(stainGeos), flatMat(FOLD, 0.28), false));

  // ======================================================== arms and legs: coils (rebuilt on the pose), wrapped hands, wrapped feet
  const limbR = ch.limbW, linenArm = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true, role: "glove" }); linenArm.color.set(LIN);
  const armR = (t) => ch.constructor.armRadius(t, ch.limbW, ch.def.limbs?.armTaper) * 0.99;
  const legW = ch.def.legs?.width ?? ch.limbW * 1.1;
  const W = {};
  for (const s of ["L", "R"]) { W[s] = { arm: new THREE.Mesh(new THREE.BufferGeometry(), linenArm), leg: new THREE.Mesh(new THREE.BufferGeometry(), linenArm), akey: "", lkey: "" }; for (const m of [W[s].arm, W[s].leg]) { m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); } }
  const key3 = (...ps) => ps.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|");
  const buildWraps = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], S = W[s], sx = s === "L" ? 1 : 0;
      if (A?.shoulder && A.elbow && A.hand) {
        const k = key3(A.shoulder, A.elbow, A.hand.position) + A.joint;
        if (S.akey !== k) {
          S.akey = k; const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.1, curve.getLength()), frame = framesOf(curve, 28), gs = [];
          for (let c = 0; c < 6; c++) {
            const t = 0.2 + 0.64 * (c / 5) + 0.015 * (hs(c, 40 + sx) - 0.5), w = c % 2 ? 0.031 : 0.036, tilt = (c % 2 ? -1 : 1) * (0.1 + 0.18 * hs(c, 41 + sx));
            gs.push(coilGeo(frame, L, t, w * 1.25, tilt, c * 1.7 + sx, armR, 0.0046, c + sx * 9 + 3));
          }
          S.arm.geometry.dispose(); S.arm.geometry = merge(gs); S.arm.visible = true;
        }
      } else S.arm.visible = false;
      const lg = ch.legs?.[s];
      if (lg?.hip && lg.knee && lg.foot) {
        const k = key3(lg.hip, lg.knee, lg.foot.position);
        if (S.lkey !== k) {
          S.lkey = k; const curve = ch.constructor.armCurve(lg.hip, lg.knee, lg.foot.position, false), L = Math.max(0.05, curve.getLength()), frame = framesOf(curve, 12), gs = [];
          for (let c = 0; c < 4; c++) {
            const t = 0.2 + 0.2 * c, w = c % 2 ? 0.031 : 0.036, tilt = (c % 2 ? -1 : 1) * (0.12 + 0.16 * hs(c, 44 + sx));
            gs.push(coilGeo(frame, L, t, w, tilt, c * 1.3, () => legW, 0.0045, c + sx * 9 + 21));
          }
          if (s === "L") {   // the shin's free end: it hangs from the third coil, 0.06 long, 0.023 wide, 5 frayed tips
            const f = frame(0.5), a = Math.PI * 0.35, d = f.N.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.B, Math.sin(a)), top = f.p.clone().addScaledVector(d, legW + 0.007), N = 6, P = [];
            for (let i = 0; i <= N; i++) { const t = i / N; P.push(top.clone().addScaledVector(d, 0.016 * t * t).addScaledVector(V(0, -1, 0), 0.12 * t)); }
            const sd = d.clone().cross(V(0, -1, 0)).normalize(), g = gridGeo(3, N, (u, v) => { const p = P[Math.round(v * N)].clone().addScaledVector(sd, (u - 0.5) * 0.023); p.k = 0.93; return p; }, (p) => p.clone().sub(f.p));
            gs.push(g);
            for (let k = 0; k < 5; k++) { const a0 = (k / 5 - 0.5) * 0.023, b0 = ((k + 1) / 5 - 0.5) * 0.023, l = 0.012 + 0.018 * q(k, 77); gs.push(paint(tri(P[N].clone().addScaledVector(sd, a0), P[N].clone().addScaledVector(sd, b0), P[N].clone().addScaledVector(sd, (a0 + b0) / 2).addScaledVector(V(0, -1, 0), l)), shade(LIN, 0.92))); }
          }
          S.leg.geometry.dispose(); S.leg.geometry = merge(gs); S.leg.visible = true;
        }
      } else S.leg.visible = false;
    }
  };
  // wrapped hands: two linen wraps (0.009 wide) on each finger, one on the thumb, one at the wrist, as children of the rig's finger bones
  {
    const wrapM = clothMat(shade(LIN, 0.94), { roughness: 0.95 });
    for (const s of ["L", "R"]) {
      const hand = ch.arms?.[s]?.hand, U = hand?.userData; if (!U?.digits) continue;
      U.digits.forEach((dg, di) => dg.forEach((m, si) => {
        const seg = m.userData.seg; if (!seg) return;
        const nW = dg.length === 1 ? 2 : 1, rr = (si === 0 ? seg.r1 : (seg.r1 + seg.r2) / 2);
        for (let w = 0; w < nW; w++) {
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(rr * 1.07, rr * 1.07, 0.009, 14, 1, true), wrapM);
          ring.position.y = (nW === 1 ? 0.1 : w ? 0.45 : -0.45) * seg.half + (hs(di * 3 + si, 50) - 0.5) * 0.004; ring.rotation.z = (hs(di * 3 + si, 51 + w) - 0.5) * 0.35; ring.castShadow = true; m.add(ring);
        }
      }));
      const wr = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.038, 0.016, 18, 1, true), wrapM); wr.position.y = -0.052; wr.scale.z = 0.7; hand.add(wr);
    }
    for (const s of ["L", "R"]) {   // feet: four wraps across the ball and a wrapped sole
      const f = ch.legs?.[s]?.foot; if (!f) continue;
      const fm = ch.limbMat.clone(); fm.color.set(shade(LIN, 0.97)); fm.userData = { ...ch.limbMat.userData, noOutline: false }; f.material = fm;
      for (let k = 0; k < 4; k++) { const z = -0.045 + 0.03 * k + 0.01 * (hs(k, 60 + (s === "L" ? 1 : 0)) - 0.5), rr = 0.0765 * Math.sqrt(Math.max(0.1, 1 - (z / 0.078) ** 2)), ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.0062, 6, 22), wrapM); ring.position.z = z; ring.rotation.y = (hs(k, 62) - 0.5) * 0.4; f.add(ring); }
      const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.0745, 0.0745, 0.01, 26), wrapM); sole.position.y = -0.0715; sole.scale.set(0.97, 1, 1.18); f.add(sole);
    }
  }
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); buildWraps(); };
  out.sitDepth = 0;
  return out;
}

// =====================================================================================================================================
export function pharaoh(C, ch, out) {
  if (C.type === "priest") return priest(C, ch, out);
  return pharaohBody(C, ch, out);
}
// ---------- the body's skirt (as costumes-plato.js): hangs from the ring at elevation phJ straight down to the height yHem, opening to `flare` x the ring ----------
function skirtSurface(ch, phJ, phEnd, yHem, flare) {
  const pt = (th, ph) => {
    if (ph >= phJ) return ch.surf(th, ph).pos;
    const s0 = ch.surf(th, phJ).pos, t = Math.min(1.3, (phJ - ph) / (phJ - phEnd)), f = 1 + (flare - 1) * Math.sin(Math.min(1, t) * Math.PI / 2) ** 1.6;
    return V(s0.x * f, s0.y + (yHem - s0.y) * t, s0.z * f);
  };
  return Object.assign(Object.create(ch), { surf(th, ph) {
    if (ph >= phJ + 0.004) return ch.surf(th, ph);
    const p = pt(th, ph), e = 2e-3, a = pt(th + e, ph).sub(pt(th - e, ph)), b = pt(th, ph + e).sub(pt(th, ph - e)), n = a.cross(b).normalize();
    if (n.x * p.x + n.z * p.z < 0) n.negate();
    return { pos: p, normal: n };
  } });
}

// =====================================================================================================================================
// PRIEST: the worker's body, face and hands, a shaved bare head, a long pleated robe + short wide sleeves
function priest(C, ch, out) {
  out.sitDepth = 0;
  const parts = ch.potatoParts, RX = ch.rx, RY = ch.ry, RZ = ch.rz, CY = ch.cy;
  const ROBE = C.robe || "#ede1c9", RSH = C.robeShade || "#b5a086", PELT = C.pelt || "#c78e43", ROS = C.rosette || "#472c24";
  // the worker's hands and feet (as costumes-aliens.js egyptworker): one glove colour, brown-tan feet; shaved head, no cloth on it
  { const pale = C.hands || "#f6dcae";
    if (ch.skinMat) ch.skinMat.color.set(pale);
    if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(pale);
    if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(pale); hm.userData = { ...ch.limbMat.userData };
      for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); ch.limbMat.userData.noOutline = true; }
    const fm = ch.limbMat.clone(); fm.color.set(C.feet || "#b98a5a"); fm.userData = { ...ch.limbMat.userData, noOutline: true };
    for (const s of ["L", "R"]) { const f = ch.legs?.[s]?.foot; if (f) f.material = fm; } }
  const outXZ = (p) => V(p.x, 0, p.z), T = 0.006, PHJ = -0.5, HEMY = 0.06, NU = 200, NV = 40;
  const hyb = skirtSurface(ch, PHJ, -1.5, HEMY, 1.12);
  const top = (th) => -0.36 + 0.75 * sstep(0.6, 1.6, Math.abs(wrapPi(th)));
  const hemPh = (th) => -1.5 + 0.03 * Math.sin(th * 3 + 0.5) + 0.02 * Math.sin(th * 7 + 2);
  const PL = Array.from({ length: 12 }, (_, k) => ({ th: (k + 0.5 + 0.7 * (hs(k, 60) - 0.5)) * TAU / 12 - Math.PI, w: 0.15 + 0.12 * hs(k, 61), A: 0.023 * (0.75 + 0.25 * hs(k, 62)), sl: (hs(k, 63) - 0.5) * 0.3, v0: 0.04 + 0.2 * hs(k, 64) }));
  const pleat = (th, v) => { let f = 0; for (const p of PL) f += bump(wrapPi(th - p.th - p.sl * v) / p.w) * sstep(p.v0, p.v0 + 0.25, v) * p.A / 0.023; return f; };
  const baseLift = (ph) => 0.014 + 0.026 * sstep(-0.1, -0.42, ph);
  const robeN = (s) => { const n = s.normal.clone(); n.y *= 0.4; return n.normalize(); };
  const robeAt = (th, v, off = 0) => {
    const tp = top(th), ph = tp + (hemPh(th) - tp) * v, s = hyb.surf(th, ph), f = pleat(th, v);
    const p = s.pos.clone().addScaledVector(robeN(s), baseLift(ph) + 0.023 * f * (0.5 + 0.5 * v) + 0.007 * bump((v - 0.02) / 0.04) + off); p.k = 0.8 + 0.2 * Math.min(1, f * 0.8 + 0.3) - 0.1 * sstep(0.95, 1, v); p.ph = ph; p.nrm = robeN(s); return p;
  };
  const robeM = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); robeM.color.set(ROBE);
  const robeG = [gridGeo(NU, NV, (u, v) => robeAt(u * TAU - Math.PI, v), outXZ, true)];
  robeG.push(gridGeo(NU, 1, (u, k) => robeAt(u * TAU - Math.PI, 1, k ? 0 : T), outXZ, true));   // the hem's cut edge
  parts.add(mesh(merge(robeG), robeM));
  // fold lines: one down a flank of each pleat, a shorter one beside some, and a hem line
  const inks = [], line = (path, n, W) => { const cs = [], sd = []; for (let k = 0; k <= n; k++) { const [th, v] = path(k / n); cs.push(robeAt(th, v, 0.0012)); } cs.forEach((p, k) => { const Tt = cs[Math.min(n, k + 1)].clone().sub(cs[Math.max(0, k - 1)]); sd[k] = p.nrm.clone().cross(Tt).normalize(); }); inks.push(ribbon(cs, sd, cs.map((_, k) => W * 0.5 * Math.sin(Math.PI * (0.06 + 0.88 * k / n)) + 0.0004))); };
  PL.forEach((p, k) => {
    const sd = hs(k, 66) < 0.5 ? -1 : 1;
    line((u) => [p.th + sd * 0.8 * p.w + p.sl * (p.v0 + 0.1 + u) + 0.02 * Math.sin(u * 4 + k), p.v0 + 0.1 + (0.9 + 0.06 * hs(k, 67) - p.v0 - 0.1) * u], 18, 0.0036 + 0.0014 * hs(k, 68));
    if (hs(k, 69) > 0.45) line((u) => [p.th - sd * 0.7 * p.w + p.sl * (0.45 + u * 0.4), 0.45 + 0.1 * hs(k, 70) + 0.4 * u], 12, 0.003);
  });
  for (let k = 0; k < 8; k++) line((u) => [-Math.PI + (k + u) * TAU / 8, 0.985], 26, 0.003);
  // the neckline: drawn in strokes with gaps
  for (let k = 0; k < 6; k++) line((u) => [-Math.PI + (k + 0.05 + 0.9 * u) * TAU / 6, 0.012], 30, 0.0034);
  parts.add(inkMesh(merge(inks), RSH, 0.5));

  // ---- the leopard-skin panel (priest-leopard): 0.54 long across the left shoulder to the right hip, 0.45 wide, 27 rosettes, 18 fringe strands
  if (C.leopard) {
    const A = { th: 1.5, ph: -0.12 }, B = { th: -0.7, ph: -0.95 }, ex = (th, ph) => ({ th, ph });
    const cpt = (s) => ex(A.th + (B.th - A.th) * s, A.ph + (B.ph - A.ph) * s);
    const dirm = (s) => { const a = cpt(Math.max(0, s - 0.02)), b = cpt(Math.min(1, s + 0.02)), mx = (b.th - a.th) * RX * Math.cos((a.ph + b.ph) / 2), my = (b.ph - a.ph) * RY, l = Math.hypot(mx, my) || 1; return [mx / l, my / l]; };
    const PW = 0.32;
    const onRobe = (th, ph, off) => { const v = Math.min(1, (ph - top(th)) / (hemPh(th) - top(th))); return robeAt(th, v, off); };
    const pt = (s, w, off = 0) => {   // s 0..1 along the diagonal, w -0.5..0.5 across
      const c = cpt(s), [mx, my] = dirm(s), th = c.th + (-my) * w * PW / (RX * Math.cos(c.ph)), ph = clamp(c.ph + mx * w * PW / RY, -1.4, 1.2);
      const p = onRobe(th, ph, 0.011 + 0.004 * Math.sin(s * 9 + w * 5) + off); p.k = (0.9 + 0.12 * q(Math.round(s * 7), 3)) * (1 - 0.14 * Math.abs(2 * w)); p.th = th; p.ph = ph; return p;
    };
    const lm = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); lm.color.set(PELT);
    const panel = gridGeo(48, 32, (u, v) => pt(u, v - 0.5), outXZ);
    parts.add(mesh(panel, lm));
    // 27 rosettes: a dark ring with a darker amber heart, Ø 0.019-0.066, each its own place, size and turn
    const rg = [];
    for (let i = 0; i < 27; i++) {
      const s = 0.03 + 0.92 * q(i, 3), w = 0.04 + 0.92 * q(i, 10) - 0.5, c = pt(s, w, 0.0042), r = (0.019 + 0.047 * q(i, 17) ** 1.4) / 2, nrm = c.nrm, Q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nrm);
      const ring = new THREE.RingGeometry(r * 0.52, r, 12), heart = new THREE.CircleGeometry(r * 0.42, 10);
      for (const g of [ring, heart]) { g.scale(1, 0.7 + 0.3 * q(i, 23), 1); g.rotateZ(q(i, 29) * 3); g.applyMatrix4(new THREE.Matrix4().compose(c, Q, V(1, 1, 1))); }
      rg.push(paint(ring, ROS)); rg.push(paint(heart, shade(PELT, 0.78)));
    }
    const rm = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); rm.userData.noOutline = true; rm.polygonOffset = true; rm.polygonOffsetFactor = -2; rm.polygonOffsetUnits = -2;
    parts.add(mesh(merge(rg), rm, false));
    // 18 fringe strands (0.021 wide) hang from the lower edge, each its own length
    const fg = [];
    for (let k = 0; k < 18; k++) {
      const w = (k + 0.5) / 18, len = 0.03 + 0.035 * q(k, 5), N = 4;
      const g = gridGeo(1, N, (u, v) => { const base = pt(1, w, 0.0), th = base.th, ph = base.ph - (len * v * 1.0) / RY * (0.9 + 0.1 * Math.cos(v)); const p = onRobe(th + (u - 0.5) * 0.021 / (RX * 0.9), ph, 0.011 + 0.006 * v + 0.0); p.k = (0.9 + 0.15 * q(k, 8)) * (1 - 0.15 * v); return p; }, outXZ);
      fg.push(g);
    }
    parts.add(mesh(merge(fg), lm));
    const fi = []; for (let k = 0; k < 18; k += 2) { const w = (k + 0.5) / 18, cs = [], sd = []; for (let j = 0; j <= 4; j++) { const b = pt(1, w, 0.0013); cs.push(onRobe(b.th, b.ph - (0.03 * j) / RY, 0.0125 + 0.006 * j / 4)); } cs.forEach((p, j) => { const Tt = cs[Math.min(4, j + 1)].clone().sub(cs[Math.max(0, j - 1)]); sd[j] = p.nrm.clone().cross(Tt).normalize(); }); fi.push(ribbon(cs, sd, cs.map(() => 0.0007))); }
    parts.add(inkMesh(merge(fi), ROS, 0.8));
    // the panel's edges: a line along each long side
    const ei = []; for (const w of [-0.5, 0.5]) { const cs = [], sd = []; for (let j = 0; j <= 24; j++) cs.push(pt(j / 24, w + (w < 0 ? 0.012 : -0.012), 0.0014)); cs.forEach((p, j) => { const Tt = cs[Math.min(24, j + 1)].clone().sub(cs[Math.max(0, j - 1)]); sd[j] = p.nrm.clone().cross(Tt).normalize(); }); ei.push(ribbon(cs, sd, cs.map(() => 0.0016))); }
    parts.add(inkMesh(merge(ei), ROS, 0.9));
  }
  // eight scalp flecks (Ø 0.003) on the forehead and temples under the khat's band
  { const fl = []; for (let i = 0; i < 8; i++) { const th = (i % 2 ? 1 : -1) * (0.1 + 1.1 * q(i, 3)), ph = 0.55 + 0.7 * q(i, 9), s = ch.surf(th, ph), g = new THREE.CircleGeometry(0.0015, 8); g.applyMatrix4(new THREE.Matrix4().compose(s.pos.clone().addScaledVector(s.normal, 0.0014), new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), s.normal), V(1, 1, 1))); fl.push(g); }
    parts.add(mesh(merge(fl), flatMat("#a46e34", 0.8), false)); }

  // ---- the sleeves: short wide ones (0.23 long, 0.17 across at the open end, 4 folds), rebuilt on the arm's own curve for any pose
  const armR = (t) => ch.constructor.armRadius(t, ch.limbW, ch.def.limbs?.armTaper) * 0.99;
  const sm = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); sm.color.set(ROBE);
  const SL = {}; for (const s of ["L", "R"]) { SL[s] = { out: new THREE.Mesh(new THREE.BufferGeometry(), sm), ink: inkMesh(new THREE.BufferGeometry(), RSH, 0.5), key: "" }; for (const m of Object.values(SL[s])) if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); } SL[s].ink.castShadow = false; }
  const key3 = (...ps) => ps.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|");
  const buildSleeves = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], S = SL[s], sx = s === "L" ? 0 : 1;
      if (!A?.shoulder || !A.elbow || !A.hand) { S.out.visible = S.ink.visible = false; continue; }
      const k = key3(A.shoulder, A.elbow, A.hand.position) + A.joint; if (S.key === k) continue; S.key = k;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.1, curve.getLength()), frame = framesOf(curve, 28), ta = 0.02, tb = Math.min(0.8, ta + 0.23 / L), ph0 = sx * 1.9;
      const rim = (a) => tb * (1 + 0.07 * Math.sin(a * 3 + ph0) + 0.04 * Math.sin(a * 5 + ph0 * 2.3));
      const at = (t, a, off = 0) => {
        const f = frame(t), d = f.N.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.B, Math.sin(a)), x = clamp01((t - ta) / (tb - ta)), r = armR(clamp(t, 0.02, 0.9)) + 0.018 + (0.085 - armR(tb) - 0.018) * x ** 1.5 + 0.0105 * Math.sin(4 * a + ph0) * sstep(0.05, 0.6, x) + off;
        const p = f.p.clone().addScaledVector(d, r); p.y -= 0.045 * Math.max(0, -d.y) ** 1.5 * x; p.o = d; return p;
      };
      const g = gridGeo(32, 10, (u, v) => { const a = u * TAU, p = at(ta + (rim(a) - ta) * v, a); p.k = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(4 * a + ph0)) - 0.08 * v; return p; }, (p) => { const c = frame(ta + (tb - ta) * 0.5).p; return p.clone().sub(c); }, true);
      S.out.geometry.dispose(); S.out.geometry = g; S.out.visible = true;
      const ls = []; for (let f = 0; f < 4; f++) { const a = ((f + 0.25) / 4) * TAU * 1 - ph0 / 4 * 0 + (ph0 * -1) / 4, cs = [], sd = []; for (let i = 0; i <= 10; i++) cs.push(at(ta + 0.08 + (rim(a) - ta - 0.1) * i / 10, a + 0.12 * Math.sin(i * 0.5 + f), 0.0013)); cs.forEach((p, i) => { sd[i] = p.o.clone().cross(frame(0.5).T).normalize(); }); ls.push(ribbon(cs, cs.map((p, i) => curve.getTangentAt(clamp01(ta + (tb - ta) * i / 10)).clone().cross(p.o).normalize()), cs.map((_, i) => 0.0016 * Math.sin(Math.PI * (0.08 + 0.84 * i / 10)) + 0.0004))); }
      S.ink.geometry.dispose(); S.ink.geometry = merge(ls); S.ink.visible = true;
    }
  };
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); buildSleeves(); };
  return out;
}
