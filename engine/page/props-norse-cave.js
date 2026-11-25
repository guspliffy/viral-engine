// Norse myth 01 "One eye for one sip": D1, the ROOT CAVE (storyboards/series/norse-myth/01-wednesday/DESIGN.md section D1; panels 01-05, 11-22).
// One prop, one kind: `norsecave`. A full 360 degree set, single-sided walls (a camera may stand outside). Every mark is drawn once from its index
// (no Math.random, no clock); everything that moves is a pure function of the clip time t and the params. Nothing in it is solid: every mesh is
// userData.lookOnly / surfaceOnly (the contact gate judges big scenery by its surface); only the floor receives shadows. The well (D2), the head (C)
// and the real lights belong to others: the footprint of the well (plinth r 1.44, cap y 0.30) and the marks are left free.
//
// KIND norsecave
//   Origin: the centre of the well on the cave floor (y 0), +z toward the default camera, x right. Place it ONCE at x 0, y 0, z 0, rot 0.
//   Hero side is -z (the well, the back roots, THE GAP); +z closes with root R5 and the way in. Cave shell: floor x -7.2..7.8, z -9..9, vault 6.3..9.1 m.
//   Roots (lofted ropes, 3 strands twisted once every 9 m on R1, 2 on R2-R5): R1 5.6 thick (4.4 at the ground, ceiling 7.1 over the well, runs back
//   through the gap to the trunk), R2 left wall 2.6, R3 the gap's sill 1.8, R4 right back 1.5, R5 front arch 2.0, as the DESIGN's centre lines.
//   Floor: dead flat inside r 4.5 (one painted 2250 x 2700 canvas: 46 flagstones, joints with moss and dark water, 5 puddles), packed earth beyond.
//   Marks (suggested, bodies 0.35 m or more off the plinth): Chip (-0.70, 0, 2.25) | Odin (0.90, 0, 2.35) | Spud (-1.65, 0, 2.60) | sip stone Chip (-1.70, 0, -0.30)
//   | Spud (-2.55, 0, 0.55). No curtain strand hangs within 1.2 m of Odin's mark (tips are at y 2.6 or more); mist above 0.35 m never stands within 2.2 m of a mark.
//   The gap: x -3.2..3.8, y 4.2..7.9 at z -8.5; from a camera at (0, 1.2, 6) it sits 12-25 degrees above level (the top of a tall frame). Through it: sky, 4 wind-torn
//   clouds, the trunk face (z -22.5, right 60 %), 30 leaves streaming left to right. Cameras must stay inside the cave's shell or outside it (a camera in a root
//   renders solid brown, movement.md); the sky and trunk are real geometry out to z -95, so cameras may look through the gap.
//   The way in: under R5 at (-0.8, 0, 8.5), 2.6 x 3.3, 5 rough steps up into dimness, a faint daylight glow at its end.
//
//   SPEC KEYS (all optional; a prop entry's own keys, like rowFrom in the Egypt hall)
//     benchWell    false  BENCH ONLY: a plain cylinder (r 1.39-1.44, y 0..0.30) + a flat water disc + a plain head cylinder where D2's well and C's head stand.
//     benchLights  false  BENCH ONLY: the four lights of DESIGN section 10 so a still reads like the film. In a clip the light plan owns them.
//     hide         []     names of meshes to hide (debug), e.g. ["cave-sky"].
//   PARAMS (tweened by c.prop; ranges; NORSE_CAVE_STATE seeds the default, so a tween starts from it; still seed with a dur-0 set if you read the spec)
//     runes   0.35  0..1   glow of the 12 carved marks (RUNE GLOW #f2cf6a, additive), pulsing 8 % at 0.15 Hz; `gold` lifts it to 1.
//     shafts  1     0..1.5 the 5 light shafts (0.5-1.1 wide, #ffe6a8 at 0.18, 90 motes) and their floor pools; every 4-6 s a cloud shadow shrinks them 30 % for 1 s.
//     mist    1     0..1.5 the 14 mist cards (2-4 m wide, #cfe6ea at 0.22, drifting 0.06 m/s toward +x, thicker at the walls).
//     gust    0     0..1   wind through the gap: curtains sway 5 degrees (2 at rest), 12 more leaves blow in (6 at rest), mist sways 3 x as fast (a bounded sway: it
//                          never jumps), the streaming leaves are 0.8 s quicker.
//     dim     0     0..1   43.0 s: baked ambient x (1 - 0.3 dim) (vertex colours and the floor), shafts x (1 - 0.6 dim), the light net loses its gold lines.
//     gold    0     0..1   57.0 s: the light net turns all gold #ffd45a at 0.4, runes to 1, shafts 20 % warmer.
//
//   MADE OF (section D1 and 12 counts, printed at build as "[norsecave] {...}" and on G.userData.caveStats)
//     5 roots (R1-R5) + 2 roots framing the gap + 3 that surface in the floor; bark ridges (R1 40, R2 12, R3 9, R4 8, R5 9) with cross cracks; 5 burls with spiral
//     grain and 3 snapped stubs (pale wood, 6-9 rings) on R1; 180 moss cushions, 60 hanging moss, 90 lichen discs, 14 bracket fungi (R2, R4), 34 fern crowns
//     (12 on the sill); 12 carved marks in 5 groups (G1 R2, G2 R1, G3 R3, G4 R4, G5 R5; each marked turned to face the apron, two half under moss);
//     6 curtains of 140 strands (forks, hair roots, 37 strands with moss and a drop); 46 flagstones, 5 puddles (4 under drip lines), 40 floor leaves;
//     earth walls with 120 set stones, 300 hair roots, 9 ledges (moss, ferns), 2 trickles (0.8 m/s); 5 shafts, 90 motes, 14 mist cards, the blue veil behind z -6;
//     the light net (3 layers, 0.15 m/s) on R1's undersides and on the curtains (their own shader); 4 drips with rings; 6 + 12 leaves in the air.
//   Light: the cave uses the engine's lights (vertex-coloured Standard materials, the look turns them to toon) plus painted glows; the light net and the curtains are shaders.
//   Size: about 230 000 triangles in about 75 meshes; apply() costs about 4 ms. Held by hands: nothing (NORSE_CAVE_GRIPS is empty).
import * as THREE from "three";
import { clamp } from "./util.js";

// ---------------------------------------------------------------------------------------------------------------------
// helpers: hashes, noise, colours, the vertex-coloured mesh builder. Nothing random, nothing on a clock: every mark comes from an index.
// ---------------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const V3 = THREE.Vector3;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const vn = (x, y, z, s = 1, sd = 0) => {   // value noise 0..1
  x *= s; y *= s; z *= s; const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const f = (a, b, c) => hh((ix + a) * 17.13 + (iy + b) * 91.7 + (iz + c) * 51.3 + sd * 13.7 + 7.7);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(f(0, 0, 0), f(1, 0, 0), u), l(f(0, 1, 0), f(1, 1, 0), u), v), l(l(f(0, 0, 1), f(1, 0, 1), u), l(f(0, 1, 1), f(1, 1, 1), u), v), w);
};
const col = (h) => new THREE.Color(h);

// DESIGN palette (top part, section D1)
const K = {
  bark: col("#5b4a3c"), furrow: col("#2e241d"), ridge: col("#8a7560"), far: col("#6f8f9a"),
  moss: col("#6f9140"), mossH: col("#9aa83e"), mossS: col("#3f5a28"), mossL: col("#a9c456"), mossHL: col("#c9cf6a"),
  lichen: col("#b9c7a6"), lichenO: col("#c9a93a"), lichenR: col("#8fa088"), lichenL: col("#dfe8cf"),
  wet: col("#7b8284"), wetS: col("#4a5357"), wetL: col("#a9b3b2"), glint: col("#d9eef0"),
  earth: col("#2b3334"), ash: col("#c9a46a"), ashS: col("#8f6f42"), ashL: col("#e6c890"),
  rune: col("#f2cf6a"), runeCut: col("#3a2c1c"), runeL: col("#fff1b8"),
  fern: col("#4f7a3a"), fernS: col("#2f5226"), fernL: col("#8fb04e"),
  bracketO: col("#c98a3a"), bracketC: col("#e9dcc0"), bracketS: col("#7a5224"),
};
const LEAF = ["#d9952e", "#e6b23c", "#b86f26", "#8a4f22", "#c9c04a"].map(col);
const hex = (c) => `#${c.getHexString()}`;   // note: getHexString returns sRGB hex
const cm = (a, b, t) => a.clone().lerp(b, clamp(t));

// ---- the vertex-coloured mesh builder (positions, colours, indices; normals from the shared vertices)
const _a = new V3(), _b = new V3(), _c = new V3();
class Mesher {
  constructor() { this.p = []; this.c = []; this.i = []; this.n = 0; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); return this.n++; }
  vv(p, c) { return this.v(p.x, p.y, p.z, c); }
  // a triangle; with `ref` (a direction) the winding is flipped so its face looks along ref
  tri(a, b, c, ref) {
    if (ref) {
      const P = this.p; _a.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]); _b.set(P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]);
      if (_c.crossVectors(_a, _b).dot(ref) < 0) { this.i.push(a, c, b); return; }
    }
    this.i.push(a, b, c);
  }
  quad(a, b, c, d, ref) { this.tri(a, b, c, ref); this.tri(a, c, d, ref); }
  // a THREE geometry placed by a matrix, coloured by colf(x, y, z, nx, ny, nz) or one colour
  addGeo(g, m4, colf) {
    const pos = g.attributes.position, nor = g.attributes.normal, nm = new THREE.Matrix3().getNormalMatrix(m4), v = new V3(), n = new V3(), base = this.n;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m4); n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      this.vv(v, typeof colf === "function" ? colf(v.x, v.y, v.z, n.x, n.y, n.z, i) : colf);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) this.i.push(base + g.index.getX(i)); else for (let i = 0; i < pos.count; i++) this.i.push(base + i);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }
}
const mat4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new V3(sx, sy, sz));
// an orthonormal pair of tangents for a normal
function tangents(n, hint) {
  let t1 = hint ? hint.clone().addScaledVector(n, -hint.dot(n)) : new V3(0, 1, 0).addScaledVector(n, -n.y);
  if (t1.lengthSq() < 1e-4) t1 = new V3(1, 0, 0).addScaledVector(n, -n.x);
  t1.normalize(); return [t1, new V3().crossVectors(n, t1).normalize()];
}

// ---- small organic parts, all drawn once from their index/seed ---------------------------------------------------
// a moss cushion: a lumpy dome (9 x 4) sunk 1.5 cm into the surface, two greens (by seed), shade at the foot fading into the bark (a soft edge), a paler top (not bright), flecks, and a fringe of 10 micro tufts
const MOSS_B = col("#85983a"), MOSS_BS = col("#4a5a2a");
function mossCushion(M, p, n, t1, size, hf, el, seed) {
  const t2 = new V3().crossVectors(n, t1).normalize(), nu = 9, nv = 4, R = size / 2, Hh = size * hf, base = M.n, tmp = new THREE.Color(), two = seed % 2 === 0, mid = (two ? K.moss : MOSS_B).clone().multiplyScalar(0.82), sh = (two ? K.mossS : MOSS_BS).clone().multiplyScalar(0.9);
  for (let k = 0; k <= nv; k++) {
    const psi = (k / nv) * Math.PI / 2, rad = Math.cos(psi), ht = Math.sin(psi);
    for (let u = 0; u < nu; u++) {
      const a = TAU * u / nu, lump = 1 + 0.22 * (hh(seed * 7.3 + u * 3.7 + 1) - 0.5), hl = 0.8 + 0.4 * hh(seed * 3.1 + u * 5.1 + k);
      const x = Math.cos(a) * R * rad * lump * el, y = Math.sin(a) * R * rad * lump, h = ht * Hh * hl - 0.02;
      const f = hh(seed * 11 + u * 2.3 + k * 7.9);
      tmp.copy(sh).lerp(mid, sm(k / 2)).lerp(K.mossL, sm((k - 2) / 2) * 0.4);
      if (k === 0) tmp.lerp(K.bark, 0.4);
      if (f > 0.88) tmp.lerp(K.mossL, 0.25); else if (f < 0.12) tmp.lerp(sh, 0.5);
      M.v(p.x + t1.x * x + t2.x * y + n.x * h, p.y + t1.y * x + t2.y * y + n.y * h, p.z + t1.z * x + t2.z * y + n.z * h, tmp);
    }
  }
  for (let k = 0; k < nv; k++) for (let u = 0; u < nu; u++) { const a = base + k * nu + u, b = base + k * nu + (u + 1) % nu, c = a + nu, d = b + nu; M.quad(a, b, d, c, n); }
  for (let q = 0; q < 10; q++) {   // the fringe: micro tufts round the foot
    const a = TAU * (q + hh(seed * 5 + q)) / 10, k = 0.95 + 0.25 * hh(seed + q * 3.3), sz = Math.max(0.01, size * (0.03 + 0.04 * hh(seed + q * 1.9))), cx = Math.cos(a) * R * k * el, cy = Math.sin(a) * R * k;
    const o = new V3().copy(p).addScaledVector(t1, cx).addScaledVector(t2, cy).addScaledVector(n, -0.008);
    tmp.copy(q % 3 === 0 ? sh : q % 3 === 1 ? mid : MOSS_B).lerp(K.mossL, q % 4 === 0 ? 0.2 : 0);
    const i0 = M.vv(o.clone().addScaledVector(t1, sz), tmp), i1 = M.vv(o.clone().addScaledVector(t2, sz).addScaledVector(t1, -sz * 0.5), tmp), i2 = M.vv(o.clone().addScaledVector(t2, -sz).addScaledVector(t1, -sz * 0.5), tmp), i3 = M.vv(o.clone().addScaledVector(n, sz * 0.9), cm(mid, K.mossL, 0.3));
    M.tri(i0, i1, i3, n); M.tri(i1, i2, i3, n); M.tri(i2, i0, i3, n);
  }
}
// a ribbon along points (two-sided look comes from the material): width fn(t), side vector
function ribbon(M, pts, wf, side, cf) {
  const idx = [];
  pts.forEach((p, i) => { const t = i / (pts.length - 1), w = wf(t) / 2, c = cf(t); idx.push([M.v(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, c), M.v(p.x + side.x * w, p.y + side.y * w, p.z + side.z * w, c)]); });
  for (let i = 0; i < pts.length - 1; i++) { M.tri(idx[i][0], idx[i][1], idx[i + 1][0]); M.tri(idx[i][1], idx[i + 1][1], idx[i + 1][0]); }
}
// hanging moss: a cluster of 3-6 drooping tapered strands from a point (thickest at the top, paler at the tip)
function hangMoss(M, p, n, seed, len) {
  const ns = 7 + Math.floor(hh(seed * 3.3) * 7), t = new THREE.Color(), t2 = new THREE.Color();
  for (let s = 0; s < ns; s++) {
    const o = p.clone().add(new V3((hh(seed + s * 3.1) - 0.5) * 0.2, 0, (hh(seed + s * 7.7) - 0.5) * 0.2)), L = len * (0.55 + 0.45 * hh(seed * 2 + s * 5.9)), pts = [];
    const sx = (hh(seed + s * 9.1) - 0.5) * 0.12, sz = (hh(seed + s * 4.3) - 0.5) * 0.12;
    for (let k = 0; k <= 4; k++) { const u = k / 4; pts.push(new V3(o.x + sx * u * u, o.y - L * u - 0.01, o.z + sz * u * u)); }
    const ang = hh(seed + s * 2.7) * Math.PI, side = new V3(Math.cos(ang), 0, Math.sin(ang));
    ribbon(M, pts, (u) => 0.02 * (1 - 0.85 * u) * (0.8 + 0.4 * hh(seed + s)), side, (u) => t.copy(K.mossH).lerp(K.mossS, 0.25 * (1 - u)).lerp(K.mossHL, sm(u * 1.4) * 0.8).clone());
  }
}
// a lichen disc: a pale rim ring and a disc (9 sides), a light centre dot; 1 in 4 ochre
function lichenDisc(M, p, n, r, seed) {
  const [t1, t2] = tangents(n), ochre = seed % 4 === 0, base = ochre ? K.lichenO : K.lichen, rim = ochre ? cm(K.lichenO, K.lichenL, 0.5) : K.lichenR, N = 9, rot = hh(seed) * TAU;
  const lift = 0.008, c0 = M.vv(p.clone().addScaledVector(n, lift + 0.003), cm(base, K.lichenL, 0.45)), ring = [], ring2 = [];
  for (let i = 0; i < N; i++) { const a = rot + TAU * i / N, k = 1 + 0.18 * (hh(seed * 3 + i) - 0.5), d = p.clone().addScaledVector(t1, Math.cos(a) * r * 0.78 * k).addScaledVector(t2, Math.sin(a) * r * 0.78 * k).addScaledVector(n, lift); ring.push(M.vv(d, base)); }
  for (let i = 0; i < N; i++) { const a = rot + TAU * i / N, k = 1 + 0.2 * (hh(seed * 5 + i) - 0.5), d = p.clone().addScaledVector(t1, Math.cos(a) * r * k).addScaledVector(t2, Math.sin(a) * r * k).addScaledVector(n, lift - 0.002); ring2.push(M.vv(d, rim)); }
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; M.tri(c0, ring[i], ring[j], n); M.quad(ring[i], ring2[i], ring2[j], ring[j], n); }
}
// a bracket fungus: a thick half-dome shelf (1.7 x as wide as deep), 3-5 ochre and cream bands, a pale rim and a dark underside, tilted up 12 degrees, sticking out of the surface along `out`
function bracket(M, p, up, out, r, bands, seed) {
  const t2 = new V3().crossVectors(up, out).normalize(), tilt = 0.2, nu = 12, rows = bands * 3, base = M.n, tmp = new THREE.Color(), pt = (k, a, hh_) => { const rr = r * (k / rows), x = Math.cos(a) * rr, y = Math.sin(a) * rr * 1.75; return p.clone().addScaledVector(out, x).addScaledVector(t2, y).addScaledVector(up, hh_ + tilt * x); };
  const thick = 0.34 * r, top = (k) => thick * Math.pow(1 - k / rows, 0.55) + 0.05 * r * (k % 2);
  for (let k = 0; k <= rows; k++) {
    const band = Math.floor(k / 3), kk = k % 3, c = k === 0 ? K.bracketS : kk === 0 ? col("#4a2c12") : (band % 2 ? col("#e6d8b4") : col("#9a5a1a"));
    for (let u = 0; u <= nu; u++) { const a = -Math.PI / 2 + Math.PI * u / nu, lump = 1 + 0.07 * (hh(seed * 3 + u * 2.1 + k) - 0.5); tmp.copy(c).multiplyScalar(0.92 + 0.16 * hh(seed + u + k * 3)); if (k === rows) tmp.lerp(K.bracketC, 0.8); M.vv(pt(k * lump, a, top(k)), tmp); }
  }
  const w = nu + 1;
  for (let k = 0; k < rows; k++) for (let u = 0; u < nu; u++) { const a = base + k * w + u; M.quad(a, a + 1, a + w + 1, a + w, up); }
  // the skirt (cream lip going down to the dark underside) and the underside
  const lip = [], und = [];
  for (let u = 0; u <= nu; u++) { const a = -Math.PI / 2 + Math.PI * u / nu; lip.push(M.vv(pt(rows, a, top(rows) * 0.6), K.bracketC)); und.push(M.vv(pt(rows, a, -0.1 * r), col("#4a3018"))); }
  for (let u = 0; u < nu; u++) M.quad(lip[u], lip[u + 1], und[u + 1], und[u], out);
  const cen = M.vv(pt(0, 0, -0.08 * r), col("#3a2410"));
  for (let u = 0; u < nu; u++) M.tri(cen, und[u], und[u + 1], up.clone().negate());
  for (let u = 0; u < nu; u++) M.quad(base + rows * w + u, base + rows * w + u + 1, lip[u + 1], lip[u], out);
}
// a fern crown: 5-9 fronds from one point, each an arch of 0.3-0.7 with 9 pairs of leaflets
function fern(M, p, n, seed) {
  const nf = 5 + Math.floor(hh(seed * 1.7) * 5), [t1, t2] = tangents(n), tmp = new THREE.Color(), rot = hh(seed) * TAU;
  for (let f = 0; f < nf; f++) {
    const a = rot + TAU * f / nf + (hh(seed * 5 + f) - 0.5) * 0.5, L = 0.3 + 0.4 * hh(seed * 3 + f * 2.2), lean = 0.5 + 0.55 * hh(seed * 7 + f * 1.3);
    const dir = t1.clone().multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)), side = new V3().crossVectors(dir, n).normalize();
    const pts = []; for (let k = 0; k <= 9; k++) { const u = k / 9; pts.push(p.clone().addScaledVector(dir, L * lean * u * 1.0).addScaledVector(n, L * (0.9 * Math.sin(u * 1.5) * (1 - lean * 0.4) - 0.35 * u * u * lean))); }
    for (let k = 1; k < 9; k++) {
      const u = k / 9, ll = L * 0.2 * Math.sin(Math.PI * Math.pow(u, 0.7)) * (1 - 0.5 * u) + 0.01, a0 = pts[k], a1 = pts[k + 1] || pts[k];
      tmp.copy(K.fernS).lerp(K.fern, sm(u * 2)).lerp(K.fernL, sm((u - 0.4) * 1.5) * 0.7);
      for (const sd of [-1, 1]) {
        const tip = a0.clone().addScaledVector(side, sd * ll).addScaledVector(dir, 0.35 * ll).addScaledVector(n, -0.15 * ll);
        const i0 = M.vv(a0, tmp), i1 = M.vv(tip, tmp.clone().lerp(K.fernL, 0.3)), i2 = M.vv(a1.clone().addScaledVector(side, sd * ll * 0.12), tmp);
        M.tri(i0, i1, i2);
      }
    }
    ribbon(M, pts, (u) => 0.012 * (1 - 0.8 * u), side, () => K.fernS);
  }
}
// a thin tapered tube along points (3-4 sides, closed tip)
function thinTube(M, pts, rf, cf, sides = 4) {
  const n = pts.length; let N = new V3(0, 0, 1); const rings = [];
  for (let i = 0; i < n; i++) {
    const T = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    if (Math.abs(T.dot(N)) > 0.95) N = new V3(1, 0, 0);
    const B = new V3().crossVectors(T, N).normalize(); N = new V3().crossVectors(B, T).normalize();
    const r = rf(i / (n - 1)), c = cf(i / (n - 1)), ids = [];
    for (let s = 0; s < sides; s++) { const a = TAU * s / sides; ids.push(M.v(pts[i].x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r, pts[i].y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r, pts[i].z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r, c)); }
    rings.push(ids);
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) { const a = rings[i][s], b = rings[i][(s + 1) % sides], c = rings[i + 1][s], d = rings[i + 1][(s + 1) % sides]; M.tri(a, b, c); M.tri(b, d, c); }
}

// ---------------------------------------------------------------------------------------------------------------------
// ROOTS: a lofted rope (k strands twisted once every `twist` m, furrows `depth` deep), frames by parallel transport.
// ---------------------------------------------------------------------------------------------------------------------
class Root {
  constructor(id, pts, o) {
    this.id = id; this.idn = [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 97, 7); this.o = o;
    this.curve = new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p)), false, "centripetal");
    this.L = this.curve.getLength();
    const N = (this.N = Math.max(10, Math.ceil(this.L / (o.ds ?? 0.3))));
    this.fr = []; let Nn = null;
    for (let i = 0; i <= N; i++) {
      const c = this.curve.getPointAt(i / N), T = this.curve.getTangentAt(i / N).normalize();
      if (!Nn) { Nn = Math.abs(T.y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); }
      const B = new V3().crossVectors(T, Nn).normalize(); Nn = new V3().crossVectors(B, T).normalize();
      this.fr.push({ c, T, N: Nn.clone(), B });
    }
  }
  frame(s) {
    const x = clamp(s) * this.N, i = Math.min(this.N - 1, Math.floor(x)), f = x - i, a = this.fr[i], b = this.fr[i + 1];
    const c = a.c.clone().lerp(b.c, f), N = a.N.clone().lerp(b.N, f).normalize(), T = a.T.clone().lerp(b.T, f).normalize(), B = new V3().crossVectors(T, N).normalize();
    return { c, T, N: new V3().crossVectors(B, T).normalize(), B };
  }
  R(s) { const u = s * this.L; return this.o.R(s) * (1 + 0.045 * Math.sin(u * 0.83 + this.idn * 2.1) + 0.03 * Math.sin(u * 2.1 + this.idn)); }
  prof(phi) { const q = Math.sin(this.o.k * phi / 2); return Math.pow(q * q, 1.25); }   // 0 on a strand's crown, 1 in a furrow
  fineAt(s, phi) { const u = s * this.L, fq = Math.sin(this.o.k * 3 * phi / 2 + 1.7 * Math.sin(u * 0.31 + phi * 2 + this.idn)); return Math.pow(fq * fq, 2.5) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(u * 0.5 + phi * 3 + this.idn * 1.3))); }
  r(s, phi) { const u = s * this.L, ov = 1 + 0.1 * Math.cos(2 * (phi + this.tw(s)) + this.idn); return this.R(s) * ov - this.o.depth * this.prof(phi) - (this.o.fine ?? 0.09) * this.R(s) * this.fineAt(s, phi) + 0.012 * Math.sin(5 * phi + u * 0.7 + this.idn); }
  tw(s) { return (this.o.phase ?? 0) + TAU * s * this.L / this.o.twist; }
  PF(fr, s, phi, lift = 0) { const a = phi + this.tw(s), r = this.r(s, phi) + lift, c = Math.cos(a), sn = Math.sin(a); return new V3(fr.c.x + (fr.N.x * c + fr.B.x * sn) * r, fr.c.y + (fr.N.y * c + fr.B.y * sn) * r, fr.c.z + (fr.N.z * c + fr.B.z * sn) * r); }
  P(s, phi, lift = 0) { return this.PF(this.frame(s), s, phi, lift); }
  normal(s, phi) {
    const e = Math.min(0.2 / this.L, 0.02), d = 0.03, ds = this.P(Math.min(1, s + e), phi).sub(this.P(Math.max(0, s - e), phi)), dp = this.P(s, phi + d).sub(this.P(s, phi - d)), n = new V3().crossVectors(dp, ds).normalize();
    const out = this.P(s, phi).sub(this.frame(s).c); if (n.dot(out) < 0) n.negate(); return n;
  }
  // the point on the surface and its normal at (s, phi)
  at(s, phi, lift = 0) { const n = this.normal(s, phi); return { s, phi, n, p: this.P(s, phi, lift), T: this.frame(s).T }; }
  // phi on ring s whose normal looks most along dir
  facing(s, dir, from = 0, to = TAU) {
    let best = -2, bp = from; const n = 48;
    for (let j = 0; j < n; j++) { const phi = from + (to - from) * j / n, d = this.normal(s, phi).dot(dir); if (d > best) { best = d; bp = phi; } }
    return bp;
  }
  // the nearest ring to a world point, and the surface point + normal under it (lift above the surface)
  project(p, lift = 0) {
    let bi = 0, bd = 1e9; for (let i = 0; i <= this.N; i++) { const d = this.fr[i].c.distanceToSquared(p); if (d < bd) { bd = d; bi = i; } }
    let s = bi / this.N;
    for (let k = 0; k < 3; k++) { const fr = this.frame(s); s = clamp(s + p.clone().sub(fr.c).dot(fr.T) / this.L); }
    const fr = this.frame(s), d = p.clone().sub(fr.c), a = Math.atan2(d.dot(fr.B), d.dot(fr.N)), phi = a - this.tw(s);
    return this.at(s, phi, lift);
  }
  topAt(x) { let b = 1e9, y = 0; for (let i = 0; i <= this.N; i++) { const d = Math.abs(this.fr[i].c.x - x); if (d < b) { b = d; y = this.fr[i].c.y + this.R(i / this.N); } } return y; }
  // the loft: M segments a ring; colf(p, n, f, s, phi) -> Color; the winding is chosen so faces look outward
  build(Mh, Mseg, colf) {
    const N = this.N, base = Mh.n, ref = new V3();
    for (let i = 0; i <= N; i++) {
      const s = i / N, fr = this.fr[i];
      for (let j = 0; j < Mseg; j++) { const phi = TAU * j / Mseg, p = this.PF(fr, s, phi), n = p.clone().sub(fr.c).normalize(); Mh.vv(p, colf(p, n, this.prof(phi), s, phi, s * this.L, this.fineAt(s, phi))); }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < Mseg; j++) {
      const a = base + i * Mseg + j, b = base + i * Mseg + (j + 1) % Mseg, c = a + Mseg, d = b + Mseg, fr = this.fr[i];
      ref.set(Mh.p[a * 3] - fr.c.x, Mh.p[a * 3 + 1] - fr.c.y, Mh.p[a * 3 + 2] - fr.c.z);
      Mh.quad(a, c, d, b, ref);
    }
    for (const [i, flip] of [[0, true], [N, false]]) {   // caps
      const fr = this.fr[i], cc = Mh.v(fr.c.x, fr.c.y, fr.c.z, K.furrow);
      for (let j = 0; j < Mseg; j++) { const a = base + i * Mseg + j, b = base + i * Mseg + (j + 1) % Mseg; Mh.tri(cc, a, b, flip ? fr.T.clone().negate() : fr.T); }
    }
  }
}

// the colour of bark at a point: furrow dark, ridge light on the side toward the well, the far colour beyond 9 m, a low noise
const WELL = new V3(0, 0.3, 0);
const _w = new V3();
function barkColor(p, n, f, tint, u, phi, g) {
  const c = new THREE.Color();
  c.copy(K.furrow).lerp(K.bark, sm((1 - f) * 1.6));
  _w.copy(WELL).sub(p); const dw = _w.length(); _w.multiplyScalar(1 / (dw || 1));
  const toward = Math.max(0, n.dot(_w)), crown = sm((1 - f) * 1.7 - 0.55);
  c.lerp(K.ridge, crown * (0.3 + 0.7 * toward));
  const nz = vn(p.x, p.y, p.z, 2.4, 3) - 0.5, nz2 = vn(p.x, p.y, p.z, 9, 5) - 0.5;
  c.multiplyScalar(1 + 0.3 * nz + 0.18 * nz2);
  if (g !== undefined) { c.lerp(K.furrow, 0.85 * sm(g * 1.4)); c.lerp(K.ridge, 0.45 * sm((0.15 - g) * 6) * (0.4 + 0.6 * crown)); }
  if (u !== undefined) { const m = Math.abs(Math.sin(phi * 9 + 2.6 * vn(u * 0.35, phi * 2, 0.5, 1, 4))), brk = vn(u * 0.9, phi * 4, 1.5, 1, 6); if (m < 0.2 && brk > 0.4) c.lerp(K.furrow, 0.75 * sm((0.2 - m) / 0.12)); else if (m > 0.9 && brk > 0.5) c.lerp(K.ridge, 0.35); }
  if (n.y < -0.2) c.multiplyScalar(0.86 + 0.14 * (1 + n.y));   // an underside is darker
  if (p.z < -9.4 && p.y > 3) { c.lerp(new THREE.Color("#b09468"), 0.38 * sm((-p.z - 9.4) / 2)); c.multiplyScalar(1.12); }   // outside the gap: in the sun
  else c.lerp(K.far, 0.8 * sm((dw - 9) / 5));
  if (tint) c.lerp(tint.c, tint.k);
  return c;
}

// bark ridges: raised ribbons that follow the twist (each its own run of the root), with cross cracks every 0.4-1.1 m
function barkRidges(M, root, count, seed, avoid = [], rk = 1, sFrom = 0.04, sTo = 0.96) {
  let cracks = 0;
  for (let q = 0; q < count; q++) {
    const sd = seed + q * 13.7, k = root.o.k, strand = Math.floor(hh(sd) * k), crown = TAU * strand / k;
    const phi0 = crown + (hh(sd + 1) - 0.5) * (TAU / k) * 0.9, w = 0.12 + 0.18 * hh(sd + 2), rise = (0.03 + 0.03 * hh(sd + 3)) * rk;
    const len = 3 + 9 * hh(sd + 4), s0 = lerp(sFrom, sTo - len / root.L, hh(sd + 5)), s1 = Math.min(sTo, Math.max(sFrom + 0.02, s0) + len / root.L), n = Math.max(4, Math.ceil((s1 - s0) * root.L / 0.22));
    const rows = [];
    for (let j = 0; j <= n; j++) {
      const s = lerp(s0, s1, j / n), fr = root.frame(s), tap = Math.pow(Math.sin(Math.PI * Math.min(1, (j + 0.5) / (n + 1))), 0.5), phi = phi0 + 0.07 * Math.sin(j * 0.5 + sd);
      const dphi = (w / 2) / Math.max(0.3, root.r(s, phi)), pc = root.PF(fr, s, phi, rise * tap), pl = root.PF(fr, s, phi - dphi, 0.0), pr = root.PF(fr, s, phi + dphi, 0.0);
      const nrm = pc.clone().sub(fr.c).normalize(), mid = barkColor(pc, nrm, 0, null).lerp(K.ridge, 0.6), edge = barkColor(pl, nrm, 0.5, null).multiplyScalar(0.62), near = avoid.some((a) => a.distanceToSquared(pc) < 1.0);
      rows.push([M.vv(pl, edge), M.vv(pc, mid), M.vv(pr, edge), near]);
    }
    for (let j = 0; j < n; j++) { const a = rows[j], b = rows[j + 1]; if (a[3] || b[3]) continue; const ref = root.frame(lerp(s0, s1, j / n)); const out = a[1] === undefined ? null : new V3(M.p[a[1] * 3] - ref.c.x, M.p[a[1] * 3 + 1] - ref.c.y, M.p[a[1] * 3 + 2] - ref.c.z); M.quad(a[0], b[0], b[1], a[1], out); M.quad(a[1], b[1], b[2], a[2], out); }
    // cross cracks
    let u = s0 * root.L + 0.2 + 0.9 * hh(sd + 6);
    while (u < s1 * root.L - 0.2) {
      if (avoid.some((a) => root.P(u / root.L, phi0).distanceToSquared(a) < 1.0)) { u += 0.6; continue; }
      const s = u / root.L, fr = root.frame(s), phi = phi0, dphi = (w * 0.85) / Math.max(0.3, root.r(s, phi)), dl = 0.022 / root.L;
      const a = root.PF(root.frame(s - dl), s - dl, phi - dphi, rise * 0.8), b = root.PF(root.frame(s - dl), s - dl, phi + dphi, rise * 0.8), c = root.PF(root.frame(s + dl), s + dl, phi + dphi, rise * 0.8), d = root.PF(root.frame(s + dl), s + dl, phi - dphi, rise * 0.8);
      const ref = a.clone().sub(fr.c); M.quad(M.vv(a, K.furrow), M.vv(b, K.furrow), M.vv(c, K.furrow), M.vv(d, K.furrow), ref); cracks++;
      u += 0.4 + 0.7 * hh(sd + 7 + cracks * 1.3);
    }
  }
  return cracks;
}

// ---- the twelve RUNE MARKS (cell 1 wide x 2 high), straight strokes (x, y)-(x, y); cut width 6 % of the mark's height
const RUNES = {
  M1: [[0, 0, 0, 2], [0, 1.0, 0.6, 1.6], [0, 1.45, 0.5, 1.95]],
  M2: [[0, 0, 0, 2], [0, 2, 0.7, 1.3], [0.7, 1.3, 0.7, 0]],
  M3: [[0, 0, 0, 2], [0, 1.5, 0.5, 1.0], [0.5, 1.0, 0, 0.5]],
  M4: [[0, 0, 0, 2], [0, 2, 0.6, 1.45], [0, 1.4, 0.6, 0.85]],
  M5: [[0.6, 1.6, 0, 1.0], [0, 1.0, 0.6, 0.4]],
  M6: [[0, 0.3, 0.8, 1.7], [0, 1.7, 0.8, 0.3]],
  M7: [[0.4, 0, 0.4, 2], [0.1, 1.3, 0.7, 0.8]],
  M8: [[0, 0, 0, 2], [0, 2, 0.6, 1.4]],
  M9: [[0, 0.4, 0, 1.6], [0.8, 0.4, 0.8, 1.6], [0, 1.6, 0.8, 0.4], [0, 0.4, 0.8, 1.6]],
  M10: [[0.4, 0, 0.4, 2], [0.4, 1.4, 0.1, 1.0], [0.1, 1.0, 0.4, 0.6], [0.4, 0.6, 0.7, 1.0], [0.7, 1.0, 0.4, 1.4]],
  M11: [[0.4, 1.6, 0, 1.0], [0, 1.0, 0.4, 0.4], [0.4, 0.4, 0.8, 1.0], [0.8, 1.0, 0.4, 1.6]],
  M12: [[0, 0, 0, 2], [0, 2, 0.35, 1.65], [0.35, 1.65, 0.7, 2], [0, 0, 0.35, 0.35], [0.35, 0.35, 0.7, 0]],
};
// rune groups: [root, world point, marks, height of each]
const GROUPS = [
  ["R2", [-5.9, 3.0, -1.5], ["M4", "M6"], [0.5, 0.42]],
  ["R1", [4.6, 3.6, 2.2], ["M8", "M1", "M10"], [0.45, 0.5, 0.38]],
  ["R3", [-1.2, 2.6, -8.1], ["M6", "M9"], [0.44, 0.5]],
  ["R4", [6.0, 2.8, -2.2], ["M3", "M12", "M5"], [0.5, 0.4, 0.46]],
  ["R5", [1.8, 3.4, 8.2], ["M2", "M7"], [0.42, 0.48]],
];

// ---------------------------------------------------------------------------------------------------------------------
// canvases and painted cards
// ---------------------------------------------------------------------------------------------------------------------
function canvasTex(w, h, draw, name = "", aniso = 8) {
  const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, Math.round(h));
  const g = cv.getContext("2d"); draw(g, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name;
  if (typeof window !== "undefined" && window.__TEXDUMP) (window.__TEX ||= {})[name || `t${Object.keys(window.__TEX || {}).length}`] = cv;
  return t;
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true, ...o }); m.userData.noHatch = true; return m; };
const radialTex = (stops, n = 128) => canvasTex(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
// every mesh of this set: scenery for the contact gate and the shadow blobs (userData.solid false, lookOnly, surfaceOnly: judged by its surface)
const scenery = (o, { steam = false, order = null, recv = false } = {}) => {
  o.userData.solid = false; o.userData.lookOnly = true; o.userData.surfaceOnly = true; o.castShadow = false; o.receiveShadow = recv; o.frustumCulled = false;
  if (steam) o.userData.steam = true; if (order != null) o.renderOrder = order; return o;
};

// ---- the floor plan: 46 flagstones (a Voronoi of 46 seeds in r 1.5..4.75), joints 0.02-0.05, ragged outer edge near r 4.85
const FX0 = -7.2, FX1 = 7.8, FZ0 = -9, FZ1 = 9, FS = 150;
function clipHP(poly, nx, nz, d) {   // keep nx x + nz z <= d
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], da = nx * a[0] + nz * a[1] - d, db = nx * b[0] + nz * b[1] - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function polyArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function floorPlan() {
  const seeds = []; let d0 = 1.12, k = 0, tries = 0;
  while (seeds.length < 46) {
    const r = Math.sqrt(lerp(1.5 * 1.5, 4.75 * 4.75, hh(k * 1.713 + 0.5))), a = TAU * hh(k * 2.911 + 0.3), x = r * Math.cos(a), z = r * Math.sin(a); k++; tries++;
    if (seeds.every((s) => Math.hypot(s[0] - x, s[1] - z) >= d0)) seeds.push([x, z]);
    if (tries > 1600 && seeds.length < 46) { seeds.length = 0; tries = 0; d0 *= 0.97; k += 7919; }
  }
  const slabs = [], edges = [];
  seeds.forEach((s, i) => {
    let poly = [[s[0] - 3, s[1] - 3], [s[0] + 3, s[1] - 3], [s[0] + 3, s[1] + 3], [s[0] - 3, s[1] + 3]];
    seeds.forEach((q, j) => {
      if (j === i) return; const dx = q[0] - s[0], dz = q[1] - s[1], d = Math.hypot(dx, dz); if (d > 4.6) return;
      const jw = 0.02 + 0.03 * H2(Math.min(i, j), Math.max(i, j));
      poly = clipHP(poly, dx / d, dz / d, d / 2 - jw / 2 + (s[0] * dx / d + s[1] * dz / d));   // bisector measured from the origin
    });
    for (let q = 0; q < 36; q++) { const a = TAU * q / 36, ro = 4.85 + 0.32 * (hh(q * 3.7 + 1.1) - 0.5) + 0.16 * Math.sin(a * 3 + 0.7); poly = clipHP(poly, Math.cos(a), Math.sin(a), ro); }
    poly = poly.map(([x, z], n) => [x + (hh(i * 31 + n * 7.7) - 0.5) * 0.05, z + (hh(i * 17 + n * 3.1) - 0.5) * 0.05]);
    if (poly.length >= 3 && polyArea(poly) > 0.12) slabs.push({ i, seed: s, poly, area: polyArea(poly) });
  });
  return slabs;
}
// the eight ways out of a slab's joint: moss on 60 % of the joints' length, dark water on 15 %: intervals per edge, hashed, then scaled to the share
function jointRuns(slabs) {
  let total = 0, moss = 0, water = 0; const runs = [];
  for (const s of slabs) for (let e = 0; e < s.poly.length; e++) {
    const a = s.poly[e], b = s.poly[(e + 1) % s.poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
    const seed = s.i * 13 + e * 5.3, fm = clamp(0.6 + 0.45 * (hh(seed) - 0.5), 0.2, 0.95), fw = 0.143 * (0.4 + 1.2 * hh(seed + 1)), segs = [];
    // moss: 2-3 runs covering fm of the edge; water: one run covering fw in the rest
    const nm = 2 + (hh(seed + 2) > 0.5 ? 1 : 0), cuts = []; for (let q = 0; q < nm * 2; q++) cuts.push(hh(seed + 3 + q));
    let t0 = 0; const m = []; for (let q = 0; q < nm; q++) { const w = fm / nm * (0.8 + 0.4 * hh(seed + 20 + q)), st = clamp(t0 + (1 - fm) / (nm + 1) * (0.5 + hh(seed + 30 + q)) , 0, 1); m.push([st, Math.min(1, st + w)]); t0 = Math.min(1, st + w); }
    const cover = m.reduce((u, r) => u + (r[1] - r[0]), 0), wst = hh(seed + 50) * (1 - fw), w2 = [wst, wst + fw];
    runs.push({ a, b, len, moss: m, water: w2, seed }); total += len; moss += len * cover; water += len * (w2[1] - w2[0]);
  }
  return { runs, mossShare: moss / total, waterShare: water / total, total };
}
// paint the floor into a 2D context set to metres (x right, z down)
function paintFloor(g, plan, jr, drip) {
  const WELLC = [0, 0];
  g.fillStyle = "#2b3334"; g.fillRect(FX0, FZ0, FX1 - FX0, FZ1 - FZ0);
  // packed earth: blotches
  for (let i = 0; i < 900; i++) { const x = FX0 + (FX1 - FX0) * hh(i * 3.1), z = FZ0 + (FZ1 - FZ0) * hh(i * 5.3 + 1), r = 0.08 + 0.5 * hh(i * 7.7 + 2); g.beginPath(); g.ellipse(x, z, r, r * (0.5 + 0.5 * hh(i * 11)), hh(i * 13) * TAU, 0, TAU); g.fillStyle = hh(i * 17) > 0.5 ? "rgba(70,86,86,0.11)" : "rgba(14,20,22,0.15)"; g.fill(); }
  // pebble drifts beyond r 5.5 (14 drifts) and single pebbles
  const peb = (x, z, r, c) => { g.beginPath(); g.ellipse(x, z, r, r * 0.75, hh(x * 7 + z * 3) * 3, 0, TAU); g.fillStyle = c; g.fill(); g.lineWidth = 0.008; g.strokeStyle = "rgba(14,20,22,0.7)"; g.stroke(); g.beginPath(); g.ellipse(x - r * 0.25, z - r * 0.3, r * 0.4, r * 0.25, 0, 0, TAU); g.fillStyle = "rgba(220,235,235,0.18)"; g.fill(); };
  const PC = ["#4a5357", "#5d6667", "#6b6558", "#3a4446", "#7b8284", "#554d42"];
  for (let d = 0; d < 14; d++) { const a = TAU * hh(d * 9.1 + 4), r = 5.8 + 1.6 * hh(d * 5.7), cx = 0.3 + r * Math.cos(a) * 0.95, cz = r * Math.sin(a) * 1.15; if (cx < FX0 + 0.3 || cx > FX1 - 0.3 || cz < FZ0 + 0.3 || cz > FZ1 - 0.3) continue; for (let p = 0; p < 70; p++) { const rr = 0.15 + 0.7 * Math.pow(hh(d * 100 + p * 1.3), 0.7), aa = TAU * hh(d * 77 + p * 2.9); peb(cx + rr * Math.cos(aa), cz + rr * 0.8 * Math.sin(aa), 0.025 + 0.05 * hh(d * 31 + p * 7), PC[Math.floor(hh(d * 13 + p * 3.3) * PC.length)]); } }
  for (let i = 0; i < 700; i++) { const x = FX0 + 0.3 + (FX1 - FX0 - 0.6) * hh(i * 2.3 + 9), z = FZ0 + 0.3 + (FZ1 - FZ0 - 0.6) * hh(i * 4.1 + 3); if (Math.hypot(x - 0.3, z) < 5.6) continue; peb(x, z, 0.012 + 0.03 * hh(i * 5), PC[Math.floor(hh(i * 6.7) * PC.length)]); }
  // joints: a darker, damp line under every slab, then the slabs
  g.lineJoin = "round";
  for (const s of plan) { g.beginPath(); s.poly.forEach(([x, z], k) => (k ? g.lineTo(x, z) : g.moveTo(x, z))); g.closePath(); g.lineWidth = 0.09; g.strokeStyle = "#1a2425"; g.stroke(); }
  for (const s of plan) {
    const [cx, cz] = s.seed, d = Math.hypot(cx, cz), tone = 0.68 + 0.3 * hh(s.i * 3.3 + 1), warm = hh(s.i * 5.1 + 2);
    g.beginPath(); s.poly.forEach(([x, z], k) => (k ? g.lineTo(x, z) : g.moveTo(x, z))); g.closePath();
    const gr = g.createLinearGradient(cx - 0.6 * Math.sign(cx || 1) * 0.5, cz - 0.6 * Math.sign(cz || 1) * 0.5, cx + 0.6 * Math.sign(cx || 1) * 0.5, cz + 0.6 * Math.sign(cz || 1) * 0.5);   // lighter toward the well
    const base = cm(K.wet, K.wetS, 0.32 + 0.25 * hh(s.i * 7.7)).multiplyScalar(tone * (warm > 0.8 ? 1.06 : 1)), lit = cm(base, K.wetL, 0.2 + 0.4 * Math.exp(-d / 2.8));
    gr.addColorStop(0, hex(lit)); gr.addColorStop(1, hex(cm(base, K.wetS, 0.3))); g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // tone patches, stipple, stains
    for (let q = 0; q < 6; q++) { const x = cx + (hh(s.i * 41 + q) - 0.5) * 1.2, z = cz + (hh(s.i * 43 + q) - 0.5) * 1.2, r = 0.12 + 0.3 * hh(s.i * 47 + q); g.beginPath(); g.ellipse(x, z, r, r * 0.7, hh(q) * 3, 0, TAU); g.fillStyle = q % 2 ? "rgba(20,30,32,0.10)" : "rgba(210,225,226,0.09)"; g.fill(); }
    const nst = Math.round(s.area * 55); for (let q = 0; q < nst; q++) { const x = cx + (hh(s.i * 53 + q * 1.7) - 0.5) * 1.8, z = cz + (hh(s.i * 59 + q * 2.3) - 0.5) * 1.8; g.fillStyle = q % 3 ? "rgba(30,42,44,0.30)" : "rgba(220,235,235,0.22)"; g.fillRect(x, z, 0.006 + 0.01 * hh(q * 3 + s.i), 0.006 + 0.01 * hh(q * 5 + s.i)); }
    // painted sheen: a pale wet band toward the well
    const sh = g.createRadialGradient(0, 0, 1.3, 0, 0, 4.6); sh.addColorStop(0, "rgba(217,238,240,0.30)"); sh.addColorStop(0.5, "rgba(169,179,178,0.13)"); sh.addColorStop(1, "rgba(169,179,178,0)"); g.fillStyle = sh; g.fillRect(cx - 2, cz - 2, 4, 4);
    g.restore();
    // worn edge: dark outline, light lip on the edges facing up-left
    g.lineWidth = 0.014; g.strokeStyle = "rgba(18,26,28,0.85)"; g.stroke();
    for (let e = 0; e < s.poly.length; e++) { const a = s.poly[e], b = s.poly[(e + 1) % s.poly.length], nx = (b[1] - a[1]), nz = -(b[0] - a[0]); if ((nx * -0.5 + nz * -0.8) > 0) { g.beginPath(); g.moveTo(a[0] + (cx - a[0]) * 0.03, a[1] + (cz - a[1]) * 0.03); g.lineTo(b[0] + (cx - b[0]) * 0.03, b[1] + (cz - b[1]) * 0.03); g.lineWidth = 0.011; g.strokeStyle = "rgba(217,238,240,0.45)"; g.stroke(); } }
    // 2-5 hairline cracks or pits
    const nc = 2 + Math.floor(hh(s.i * 61) * 4);
    for (let q = 0; q < nc; q++) {
      const sd = s.i * 71 + q * 9.1;
      if (hh(sd) > 0.62) { const x = cx + (hh(sd + 1) - 0.5) * 0.9, z = cz + (hh(sd + 2) - 0.5) * 0.9, r = 0.01 + 0.025 * hh(sd + 3); g.beginPath(); g.ellipse(x, z, r, r * 0.7, hh(sd + 4) * 3, 0, TAU); g.fillStyle = "rgba(14,22,24,0.85)"; g.fill(); g.lineWidth = 0.005; g.strokeStyle = "rgba(217,238,240,0.35)"; g.stroke(); continue; }
      let x = cx + (hh(sd + 1) - 0.5) * 0.8, z = cz + (hh(sd + 2) - 0.5) * 0.8, a = hh(sd + 5) * TAU; g.beginPath(); g.moveTo(x, z);
      const n = 5 + Math.floor(hh(sd + 6) * 6); for (let k = 0; k < n; k++) { a += (hh(sd + 7 + k) - 0.5) * 1.1; x += Math.cos(a) * 0.05; z += Math.sin(a) * 0.05; g.lineTo(x, z); }
      g.lineWidth = 0.0045; g.strokeStyle = "rgba(14,22,24,0.9)"; g.stroke();
    }
  }
  // joints: dark water on 15 %, moss on 60 %
  const along = (r, t) => [r.a[0] + (r.b[0] - r.a[0]) * t, r.a[1] + (r.b[1] - r.a[1]) * t];
  for (const r of jr.runs) {
    const [t0, t1] = r.water; if (t1 - t0 > 0.01) { const p0 = along(r, t0), p1 = along(r, t1); g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.lineWidth = 0.02; g.lineCap = "round"; g.strokeStyle = "#0e242c"; g.stroke(); g.beginPath(); g.moveTo(p0[0] + 0.01, p0[1] - 0.004); g.lineTo(p1[0] + 0.01, p1[1] - 0.004); g.lineWidth = 0.004; g.strokeStyle = "rgba(217,238,240,0.5)"; g.stroke(); }
  }
  for (const r of jr.runs) for (const [t0, t1] of r.moss) {
    const n = Math.max(2, Math.round((t1 - t0) * r.len / 0.032));
    for (let q = 0; q < n; q++) { const t = lerp(t0, t1, (q + hh(r.seed * 3 + q)) / n), p = along(r, t), rr = 0.012 + 0.03 * hh(r.seed * 5 + q * 1.7), ox = (hh(r.seed * 7 + q * 2.1) - 0.5) * 0.03, oz = (hh(r.seed * 9 + q * 3.3) - 0.5) * 0.03; g.beginPath(); g.ellipse(p[0] + ox, p[1] + oz, rr, rr * 0.8, hh(q) * 3, 0, TAU); g.fillStyle = q % 5 === 0 ? hex(K.mossL) : q % 3 === 0 ? hex(K.mossS) : hex(K.moss); g.fill(); if (q % 4 === 0) { g.beginPath(); g.ellipse(p[0] + ox - rr * 0.2, p[1] + oz - rr * 0.3, rr * 0.45, rr * 0.3, 0, 0, TAU); g.fillStyle = "rgba(201,207,106,0.55)"; g.fill(); } }
  }
  // 5 puddles 0.3-0.9: dark water, a wet rim, painted glow streaks toward the well (no mirror)
  const pud = [];
  for (let p = 0; p < 5; p++) {
    const c = drip[p] ?? [[3.7, 3.3], 0.45]; const [px, pz] = c[0], r = c[1];
    pud.push({ x: px, z: pz, r });
    const pts = []; for (let k = 0; k < 9; k++) { const a = TAU * k / 9, rr = r * (0.82 + 0.3 * hh(p * 31 + k * 3.3)); pts.push([px + Math.cos(a) * rr, pz + Math.sin(a) * rr * 0.78]); }
    g.beginPath(); for (let k = 0; k < 9; k++) { const a = pts[k], b = pts[(k + 1) % 9], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pm = pts[(k + 8) % 9], m0 = [(pm[0] + a[0]) / 2, (pm[1] + a[1]) / 2]; if (k === 0) g.moveTo(m0[0], m0[1]); g.quadraticCurveTo(a[0], a[1], m[0], m[1]); } g.closePath();
    const gr = g.createRadialGradient(px, pz, 0, px, pz, r); gr.addColorStop(0, "#2f6f80"); gr.addColorStop(0.7, "#1d4452"); gr.addColorStop(1, "#122d36"); g.fillStyle = gr; g.fill(); g.lineWidth = 0.02; g.strokeStyle = "rgba(169,179,178,0.8)"; g.stroke(); g.lineWidth = 0.008; g.strokeStyle = "rgba(14,22,24,0.9)"; g.stroke();
    g.save(); g.clip();
    const dir = Math.atan2(-pz, -px); for (let q = 0; q < 8; q++) { const o = (hh(p * 17 + q) - 0.5) * r * 1.4, along2 = (hh(p * 19 + q) - 0.5) * r * 0.9, len = r * (0.25 + 0.5 * hh(p * 23 + q)), ca = Math.cos(dir), sa = Math.sin(dir); const x0 = px + ca * along2 - sa * o, z0 = pz + sa * along2 + ca * o; g.beginPath(); g.moveTo(x0, z0); g.lineTo(x0 + ca * len, z0 + sa * len); g.lineWidth = 0.008 + 0.01 * hh(q + p); g.lineCap = "round"; g.strokeStyle = q % 3 === 0 ? "rgba(255,233,168,0.7)" : "rgba(143,224,240,0.65)"; g.stroke(); }
    g.restore();
  }
  return pud;
}

// ---------------------------------------------------------------------------------------------------------------------
// the cave's shape: a rounded footprint round (0.3, 0), a vault whose height follows R1; the gap and the way in are cut out of the shell
// ---------------------------------------------------------------------------------------------------------------------
const CEN = [0.3, 0.0], BA = 7.5, BB = 9.0, BN = 4;
const bnd = (th) => { const c = Math.cos(th), s = Math.sin(th); return Math.pow(Math.pow(Math.abs(c) / BA, BN) + Math.pow(Math.abs(s) / BB, BN), -1 / BN); };
const wback = (th) => Math.pow(clamp(-Math.sin(th)), 2);
const leanK = (th, y) => 1 + 0.14 * sm(y / 7) * (1 - wback(th));
const R1XZ = [[0.5, -13], [-0.8, -7.5], [0.8, -2], [3.8, 2.6], [6.5, 6.2], [8.2, 8.8]];
function dR1(x, z) {
  let d = 1e9;
  for (let i = 0; i < R1XZ.length - 1; i++) {
    const [ax, az] = R1XZ[i], [bx, bz] = R1XZ[i + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
const Hc = (x, z) => 6.3 + 2.4 * Math.exp(-Math.pow(dR1(x, z) / 3.0, 2)) + 2.8 * sm((-z - 5.5) / 3) * Math.exp(-Math.pow((x - 0.3) / 5.5, 4));
// the gap in the back wall (x, y at z -8.5): 7.0 x 3.7, uneven
const GAP = [[-3.2, 4.5], [-2.2, 4.3], [-0.8, 4.2], [0.8, 4.25], [2.2, 4.3], [3.3, 4.5], [3.8, 5.4], [3.7, 6.6], [3.4, 7.5], [2.6, 7.9], [1.0, 7.75], [-0.6, 7.9], [-1.9, 7.7], [-2.9, 7.3], [-3.3, 6.4], [-3.15, 5.4]];
function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
const DOOR = { x0: -2.1, x1: 0.5, h: 3.3 };   // the way in under R5: 2.6 wide x 3.4 high at (-0.8, 0, 8.5)
// the shell point at angle th, w in 0..1 (0..0.5 the wall from the floor up, 0.5..1 the ceiling inward); lumpy earth
function shellPt(th, w, out = new V3()) {
  const b = bnd(th), c = Math.cos(th), s = Math.sin(th);
  let top = 7; for (let k = 0; k < 3; k++) { const L = leanK(th, top); top = Hc(CEN[0] + c * b * L, CEN[1] + s * b * L); }
  let rad, y;
  if (w <= 0.5) { y = top * (w / 0.5); rad = b * leanK(th, y); const lump = 0.7 * (vn(th * 5.5, y * 0.5, 0, 1, 2) - 0.5) * 2 + 0.28 * (vn(th * 17, y * 1.7, 1, 1, 5) - 0.5) * 2, fl = sm(y / 0.7) * sm((top - y) / 0.8 + 0.4); rad -= lump * fl; }
  else { const rho = 1 - (w - 0.5) / 0.5, rr = b * leanK(th, top) * rho; rad = rr; y = Hc(CEN[0] + c * rr, CEN[1] + s * rr) + 0.5 * (vn(th * 5, rho * 7, 3, 1, 4) - 0.5) * 2 * sm((1 - rho) * 5); }
  return out.set(CEN[0] + c * rad, y, CEN[1] + s * rad);
}
// the surface a ceiling strand hangs from at (x, z): the earth vault or R1's underside, whichever is lower
function ceilAt(x, z, r1) {
  let y = Hc(x, z) - 0.25;
  if (r1) for (let yy = 5.0; yy < y; yy += 0.08) { let inside = false; for (let i = 0; i <= r1.N; i += 1) { const f = r1.fr[i]; if (Math.abs(f.c.z - z) > 3.2) continue; if (f.c.distanceToSquared(new V3(x, yy, z)) < Math.pow(r1.R(i / r1.N) * 0.97, 2)) { inside = true; break; } } if (inside) { y = yy + 0.12; break; } }
  return y;
}

// ---- curtains: 6 groups, 140 strands
const CURT = [[-3.2, -2.5, 2.2, 24], [2.6, -3.4, 2.0, 22], [-1.0, -5.5, 3.0, 30], [4.4, 1.0, 1.8, 18], [-4.6, 2.2, 2.0, 20], [0.5, 6.4, 2.4, 26]];
const STRAND = new THREE.Color("#4d3d2f"), STRANDL = new THREE.Color("#7d6a52");
function buildCurtains(r1) {
  const M = new Mesher(), strands = [], tips = []; let nStr = 0, forks = 0, hair = 0, mossy = 0;
  CURT.forEach(([cx, cz, wd, n], ci) => {
    let longest = null;
    for (let i = 0; i < n; i++) {
      const sd = ci * 211 + i * 7.31, x = cx + ((i + 0.5) / n - 0.5) * wd + (hh(sd) - 0.5) * wd / n * 0.9, z = cz + (hh(sd + 1) - 0.5) * 0.7, top = ceilAt(x, z, r1) + 0.1;
      const maxLen = Math.min(4.3, top - 2.6), len = Math.max(1.6, lerp(1.6, maxLen, Math.pow(hh(sd + 2), 0.8)));
      const r0 = 0.014 + 0.034 * hh(sd + 3), v0 = M.n, ang = hh(sd + 4) * TAU, ax = Math.cos(ang), az = Math.sin(ang), drift = (0.08 + 0.3 * hh(sd + 5)), pts = [], N = 12;
      for (let k = 0; k <= N; k++) { const u = k / N, w = Math.sin(u * 3.1 + sd) * 0.02 * u; pts.push(new V3(x + ax * drift * u * u + az * w, top - len * u, z + az * drift * u * u - ax * w)); }
      thinTube(M, pts, (u) => lerp(r0, 0.004, Math.pow(u, 0.8)), (u) => STRAND.clone().lerp(STRANDL, sm(u * 1.2) * 0.35 + 0.1 * hh(sd + 8)), 4);
      // 1-3 forks in the lowest third
      const nf = 1 + Math.floor(hh(sd + 6) * 3);
      for (let f = 0; f < nf; f++) {
        const u0 = 0.67 + 0.28 * hh(sd + 10 + f), k0 = Math.floor(u0 * N), p0 = pts[k0], fa = hh(sd + 12 + f) * TAU, fl = 0.15 + 0.3 * hh(sd + 14 + f), fp = [];
        for (let k = 0; k <= 4; k++) { const u = k / 4; fp.push(new V3(p0.x + Math.cos(fa) * fl * 0.55 * u, p0.y - fl * 0.85 * u, p0.z + Math.sin(fa) * fl * 0.55 * u)); }
        thinTube(M, fp, (u) => lerp(r0 * 0.5, 0.003, u), (u) => STRAND.clone().lerp(STRANDL, 0.3 + 0.4 * u), 3); forks++;
      }
      // hair roots
      const nh = 4 + Math.floor(hh(sd + 20) * 4);
      for (let h = 0; h < nh; h++) { const k0 = 2 + Math.floor(hh(sd + 22 + h) * (N - 3)), p0 = pts[k0], ha = hh(sd + 24 + h) * TAU, hl = 0.06 + 0.12 * hh(sd + 26 + h); thinTube(M, [p0, new V3(p0.x + Math.cos(ha) * hl * 0.8, p0.y - hl * 0.4, p0.z + Math.sin(ha) * hl * 0.8), new V3(p0.x + Math.cos(ha) * hl * 1.2, p0.y - hl * 1.1, p0.z + Math.sin(ha) * hl * 1.2)], () => 0.0015, () => STRANDL, 3); hair++; }
      // 1 in 4: hanging moss along the lower half and a drop at the tip
      if (i % 4 === 1) {
        mossy++;
        for (let q = 0; q < 3; q++) { const k0 = Math.floor(N * (0.35 + 0.18 * q)), p0 = pts[k0].clone(), L = 0.12 + 0.2 * hh(sd + 30 + q); hangMoss(M, p0, new V3(0, -1, 0), sd * 3 + q, L * 1.4); }
        const tip = pts[N]; const dg = new THREE.IcosahedronGeometry(0.014, 1); M.addGeo(dg, mat4(tip.x, tip.y - 0.016, tip.z, 0, 0, 0, 0.85, 1.5, 0.85), new THREE.Color("#dff2f5"));
      }
      strands.push({ v0, v1: M.n, top, ax, az, ph: TAU * hh(sd + 40), ph2: TAU * hh(sd + 41), c: ci }); nStr++;
      if (!longest || len > longest.len) longest = { len, x: pts[N].x, z: pts[N].z, y: pts[N].y };
    }
    tips.push(longest);
  });
  return { M, strands, tips, counts: { strands: nStr, forks, hair, mossy } };
}

// ---------------------------------------------------------------------------------------------------------------------
// the kind
// ---------------------------------------------------------------------------------------------------------------------
const inside = (x, z, m = 0.3) => Math.pow(Math.abs(x - CEN[0]) / (BA - m), BN) + Math.pow(Math.abs(z - CEN[1]) / (BB - m), BN) < 1;
const inCave = (p) => p.y > -0.05 && inside(p.x, p.z, 0.4) && p.y < Hc(p.x, p.z) - 0.3;

// where each defined thing sits
const ROOT_DEFS = [
  ["R1", [[3.4, 14.3, -24], [3.0, 13.5, -20], [0.5, 11.2, -13], [-0.8, 10.2, -7.5], [0.8, 9.8, -2], [3.8, 8.6, 2.6], [6.5, 5.0, 6.2], [8.2, -1.5, 8.8]], { R: (s) => lerp(2.8, 2.2, sm((s - 0.82) / 0.18)), k: 3, depth: 0.35, twist: 9, phase: 0.3 }, 72],
  ["R2", [[-8.5, 9, -8], [-7.2, 5.5, -3.5], [-6.4, 2.2, 0.5], [-6.8, -1, 4.5]], { R: (s) => 1.3 * (1 - 0.15 * sm((s - 0.8) / 0.2)), k: 2, depth: 0.14, twist: 6.5, phase: 1.1 }, 44],
  ["R3", [[-6, 0.2, -7.5], [-2, 3.2, -8.6], [2.5, 3.6, -8.4], [6.5, 0.4, -6.5]], { R: (s) => 0.9, k: 2, depth: 0.1, twist: 5, phase: 2.0 }, 40],
  ["R4", [[5.5, 9, -7], [6.2, 4.5, -3], [6.8, 0, -0.5]], { R: (s) => 0.75, k: 2, depth: 0.08, twist: 4.5, phase: 0.6 }, 36],
  ["R5", [[-5.5, -0.5, 6.5], [-3, 4.2, 8.2], [1.5, 4.8, 8.6], [4.5, 5.5, 7.5], [6.4, 5.3, 7.2]], { R: (s) => 1.0, k: 2, depth: 0.1, twist: 5.5, phase: 2.8 }, 40],
];
// the roots that frame the gap (growing round an opening), and three that surface in the earth floor
const FRAME_DEFS = [
  ["F1", [[-2.9, 8.0, -8.75], [-3.45, 6.9, -8.7], [-3.55, 5.6, -8.65], [-3.3, 4.7, -8.6], [-2.5, 4.35, -8.55]], { R: () => 0.3, k: 2, depth: 0.05, twist: 2.5, phase: 0.2, ds: 0.2 }, 22],
  ["F2", [[2.9, 8.0, -8.75], [3.5, 7.2, -8.7], [4.0, 6.0, -8.65], [3.85, 5.0, -8.6], [3.2, 4.45, -8.55]], { R: () => 0.28, k: 2, depth: 0.05, twist: 2.2, phase: 1.0, ds: 0.2 }, 22],
];
const FLOORROOT_DEFS = [
  ["S1", [[-7.4, -0.1, 3.4], [-6.2, 0.02, 2.2], [-5.7, 0.0, 0.6], [-5.9, -0.1, -1.2]], { R: (s) => 0.2 * Math.sin(Math.PI * clamp(s * 1.05, 0, 1)) ** 0.5 + 0.02, k: 2, depth: 0.03, twist: 1.6, phase: 0.1, ds: 0.16 }, 16],
  ["S2", [[6.2, -0.1, -4.4], [5.9, 0.0, -2.2], [6.1, 0.02, 0.2], [6.9, -0.1, 1.6]], { R: (s) => 0.2 * Math.sin(Math.PI * clamp(s * 1.05, 0, 1)) ** 0.5 + 0.02, k: 2, depth: 0.03, twist: 1.5, phase: 0.8, ds: 0.16 }, 16],
  ["S3", [[-3.4, -0.1, -8.4], [-1.4, 0.0, -7.6], [0.6, 0.0, -7.9], [2.4, -0.1, -8.4]], { R: (s) => 0.18 * Math.sin(Math.PI * clamp(s * 1.05, 0, 1)) ** 0.5 + 0.02, k: 2, depth: 0.03, twist: 1.4, phase: 1.5, ds: 0.16 }, 16],
];
const MARKS = [[-0.70, 2.25], [0.90, 2.35], [-1.65, 2.60], [-1.70, -0.30], [-2.55, 0.55]];   // Chip, Odin, Spud, Chip at the sip stone, Spud beside him

function scatter(root, count, seed, tests, sr = [0.02, 0.98]) {
  const out = []; let k = 0, ti = 0;
  while (out.length < count && ti < tests.length) {
    const s = lerp(sr[0], sr[1], hh(seed + k * 1.31)), phi = TAU * hh(seed + k * 2.17 + 0.5); k++;
    if (k > count * 500 * (ti + 1)) { ti++; continue; }
    const a = root.at(s, phi); if (tests[ti](a)) out.push(a);
  }
  return out;
}
const upper = (a) => inCave(a.p) && a.n.y > 0.3, upperLoose = (a) => inCave(a.p) && a.n.y > -0.05, any = (a) => inCave(a.p);
const lower = (a) => inCave(a.p) && a.n.y < -0.35 && a.p.y > 3.2, lowerLoose = (a) => inCave(a.p) && a.n.y < -0.1 && a.p.y > 2.8;
const flank = (a) => inCave(a.p) && a.n.y > -0.25 && a.p.y < 7.6;

// a lumpy burl with spiral grain on R1: 28 x 14 grid, the grain a spiral of dark bands, a raised ring round its foot
function burl(M, p, n, t1, dia, seed) {
  const t2 = new V3().crossVectors(n, t1).normalize(), nu = 28, nv = 14, R = dia / 2, base = M.n, tmp = new THREE.Color();
  for (let k = 0; k <= nv; k++) {
    const rr = k / nv, hgt = Math.pow(Math.max(0, 1 - rr * rr), 0.45) * dia * 0.55;
    for (let u = 0; u < nu; u++) {
      const a = TAU * u / nu, lump = 1 + 0.12 * (vn(Math.cos(a) * 2 + seed, Math.sin(a) * 2, rr * 3, 1.5, 7) - 0.5), ph = (a / TAU) * 2 + rr * 3.6 + seed * 0.13, g = ph - Math.floor(ph), dark = g < 0.2 || (g > 0.52 && g < 0.6);
      const x = Math.cos(a) * R * rr * lump, y = Math.sin(a) * R * rr * lump, h = hgt * (1 + (dark ? -0.05 : 0.04)) - 0.03 + (k === nv ? 0.0 : 0);
      tmp.copy(K.bark).lerp(K.ridge, 0.25 + 0.3 * rr); if (dark) tmp.copy(K.furrow).lerp(K.bark, 0.25); if (k === 0) tmp.copy(K.furrow);
      M.v(p.x + t1.x * x + t2.x * y + n.x * h, p.y + t1.y * x + t2.y * y + n.y * h, p.z + t1.z * x + t2.z * y + n.z * h, tmp.clone());
    }
  }
  for (let k = 0; k < nv; k++) for (let u = 0; u < nu; u++) { const a = base + k * nu + u, b = base + k * nu + (u + 1) % nu, c = a + nu, d = b + nu; M.quad(a, b, d, c, n); }
}
// a snapped side root: a stub 0.3-0.5 thick, 0.5-0.9 long, a cut end of pale wood with 6-9 growth rings and jagged splinters
function stub(M, p, n, dirv, thick, len, rings, seed) {
  const d = dirv.clone().normalize(), [t1, t2] = tangents(d), r0 = thick / 2, sides = 14, segs = 4, base = M.n, tmp = new THREE.Color();
  for (let k = 0; k <= segs; k++) {
    const u = k / segs, r = r0 * (1 - 0.1 * u) * (k === 0 ? 1.15 : 1);
    for (let s = 0; s < sides; s++) {
      const a = TAU * s / sides, jag = k === segs ? 1 : 1, c = Math.cos(a), sn = Math.sin(a), split = k === segs ? 0.1 * len * (hh(seed + s * 3.3) > 0.55 ? hh(seed + s * 1.7) : 0) : 0;
      tmp.copy(K.bark).lerp(K.furrow, 0.35 * (1 - u) + 0.15 * hh(seed + s)); if (k >= segs - 0.01) tmp.copy(K.ashS);
      const L = len * u + split;
      M.v(p.x + d.x * L + (t1.x * c + t2.x * sn) * r * jag, p.y + d.y * L + (t1.y * c + t2.y * sn) * r * jag, p.z + d.z * L + (t1.z * c + t2.z * sn) * r * jag, tmp.clone());
    }
  }
  for (let k = 0; k < segs; k++) for (let s = 0; s < sides; s++) { const a = base + k * sides + s, b = base + k * sides + (s + 1) % sides, c = a + sides, e = b + sides; const axp = p.clone().addScaledVector(d, len * k / segs); M.quad(a, b, e, c, new V3(M.p[a * 3] - axp.x, M.p[a * 3 + 1] - axp.y, M.p[a * 3 + 2] - axp.z)); }
  // the cut end, slightly slanted: concentric rings of pale wood
  const endC = p.clone().addScaledVector(d, len * 0.98), nRing = rings, tilt = t1.clone().multiplyScalar(0.16);
  let prev = null;
  for (let q = nRing; q >= 1; q--) {
    const rr = r0 * 0.96 * q / nRing, c = q % 2 ? K.ash : K.ashS, ids = [];
    for (let s = 0; s < sides; s++) { const a = TAU * s / sides, ca = Math.cos(a), sa = Math.sin(a); ids.push(M.v(endC.x + t1.x * ca * rr + t2.x * sa * rr + tilt.x * (ca * rr / r0), endC.y + t1.y * ca * rr + t2.y * sa * rr + tilt.y * (ca * rr / r0), endC.z + t1.z * ca * rr + t2.z * sa * rr + tilt.z * (ca * rr / r0), q % 2 ? cm(K.ash, K.ashL, 0.25 * hh(seed + q)) : K.ashS)); }
    const cc = M.vv(endC, q % 2 ? K.ash : K.ashS);
    if (prev) for (let s = 0; s < sides; s++) M.quad(ids[s], ids[(s + 1) % sides], prev[(s + 1) % sides], prev[s], d);
    else for (let s = 0; s < sides; s++) M.tri(cc, ids[s], ids[(s + 1) % sides], d);
    prev = ids;
    void c;
  }
  const cc2 = M.vv(endC, K.furrow); for (let s = 0; s < sides; s++) M.tri(cc2, prev[s], prev[(s + 1) % sides], d);
  // splinters at the break
  for (let s = 0; s < 5; s++) { const a = TAU * (s + hh(seed + s)) / 5, r = r0 * 0.85, q0 = endC.clone().addScaledVector(t1, Math.cos(a) * r).addScaledVector(t2, Math.sin(a) * r), q1 = q0.clone().addScaledVector(d, 0.06 + 0.1 * hh(seed + s * 2)), w = 0.03 * thick / 0.4; const i0 = M.vv(q0.clone().addScaledVector(t2, w), K.ashL), i1 = M.vv(q0.clone().addScaledVector(t2, -w), K.ash), i2 = M.vv(q1, K.ashL); M.tri(i0, i1, i2); }
}

// ---- leaves (flat, a midrib darker), three shapes; the colour per instance is one of the five DRY LEAF colours
function leafMesher(kind, L) {
  const M = new Mesher(), n = 9, rows = [];
  const wid = (u) => kind === 0 ? 0.26 * Math.sin(Math.PI * Math.pow(u, 0.8)) : kind === 1 ? 0.4 * Math.sin(Math.PI * u) * (1 + 0.28 * Math.sin(u * 17)) : 0.46 * Math.sin(Math.PI * Math.pow(u, 0.9)) * (1 + 0.35 * Math.cos(u * 15 + 1));
  const rib = new THREE.Color(0.72, 0.72, 0.72), edge = new THREE.Color(1, 1, 1);
  for (let k = 0; k <= n; k++) { const u = k / n, y = (u - 0.5) * L, w = wid(u) * L * 0.5, c = (k === 0 || k === n) ? edge : rib; rows.push([M.v(-w, y, 0, edge), M.v(0, y, 0.004 * L, c), M.v(w, y, 0, edge)]); }
  for (let k = 0; k < n; k++) { M.quad(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0], new V3(0, 0, 1)); M.quad(rows[k][1], rows[k][2], rows[k + 1][2], rows[k + 1][1], new V3(0, 0, 1)); }
  return M.build();
}
// the soft cards
const wispTex = () => canvasTex(256, 64, (g, w, h) => {
  for (let i = 0; i < 18; i++) { const x = w * (0.1 + 0.8 * hh(i * 3.3)), y = h * (0.45 + 0.4 * hh(i * 5.1)), rx = w * (0.1 + 0.18 * hh(i * 7.7)), ry = h * (0.15 + 0.3 * hh(i * 9.9)); const q = g.createRadialGradient(x, y, 0, x, y, rx); q.addColorStop(0, "rgba(255,255,255,0.7)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = q; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore(); }
  const e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(0.18, "rgba(0,0,0,0)"); e.addColorStop(0.82, "rgba(0,0,0,0)"); e.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = e; g.fillRect(0, 0, w, h);
  const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, "rgba(0,0,0,1)"); v.addColorStop(0.55, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
}, "mist", 4);
const beamTex = () => canvasTex(32, 128, (g, w, h) => {
  const im = g.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i / (w - 1)) * 2 - 1, v = j / (h - 1); const a = Math.pow(Math.max(0, 1 - u * u), 1.6) * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.7)), 0.8) * (0.55 + 0.45 * (1 - v)); im.data.set([255, 255, 255, Math.round(a * 255)], (j * w + i) * 4); } g.putImageData(im, 0, 0);
}, "beam", 1);
const trickleTex = () => canvasTex(32, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const x = 3 + (w - 6) * hh(i * 3.3 + 1), len = h * (0.25 + 0.4 * hh(i * 5.1)), y0 = h * hh(i * 7.7); g.fillStyle = `rgba(223,242,245,${0.55 + 0.4 * hh(i)})`; for (const dy of [0, -h]) { g.beginPath(); g.roundRect(x - 1, y0 + dy, 2 + 2 * hh(i * 2.2), len, 1.5); g.fill(); } if (y0 + len > h) { g.beginPath(); g.roundRect(x - 1, y0 - h, 2, len, 1.5); g.fill(); } }
}, "trickle", 4);
const cloudTex = (i) => canvasTex(512, 160, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const n = 11; for (let k = 0; k < n; k++) { const u = k / (n - 1), x = w * (0.16 + 0.5 * u), y = h * (0.55 - 0.18 * Math.sin(Math.PI * u) * (0.6 + 0.4 * hh(i * 3 + k))), r = h * (0.2 + 0.2 * Math.sin(Math.PI * u) * (0.6 + 0.4 * hh(i * 7 + k * 2.2))); g.beginPath(); g.ellipse(x, y, r * 1.25, r, 0, 0, TAU); g.fillStyle = k % 2 ? "#ffffff" : "#eef5fb"; g.fill(); }
  // the tail torn off to the right by the wind: streaks
  for (let s = 0; s < 6; s++) { const y = h * (0.45 + 0.35 * hh(i * 11 + s)), x0 = w * (0.5 + 0.2 * hh(i * 13 + s)), len = w * (0.15 + 0.3 * hh(i * 17 + s)); const q = g.createLinearGradient(x0, 0, x0 + len, 0); q.addColorStop(0, "rgba(255,255,255,0.9)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.beginPath(); g.ellipse(x0 + len / 2, y, len / 2, h * (0.03 + 0.04 * hh(s + i)), 0, 0, TAU); g.fill(); }
  g.globalCompositeOperation = "source-atop"; const sh = g.createLinearGradient(0, 0, 0, h); sh.addColorStop(0.4, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(150,185,215,0.55)"); g.fillStyle = sh; g.fillRect(0, 0, w, h);
}, "cloud", 4);
const skyTex = () => canvasTex(64, 512, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "#5f9bd6"); q.addColorStop(0.5, "#6fa9dc"); q.addColorStop(0.8, "#a9cbe8"); q.addColorStop(1, "#dcecf5"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "sky", 1);

// a lumpy stone (an icosahedron, detail 1, squashed and turned), half sunk
const STONE_COL = ["#4a5357", "#5d6667", "#3a4446", "#6f7a7c", "#554d42", "#7b8284"].map(col);
function stoneAt(M, p, nIn, size, seed, moss) {
  const g = new THREE.IcosahedronGeometry(1, 1), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 1 + 0.22 * (vn(x * 1.7 + seed, y * 1.7, z * 1.7, 1, 11) - 0.5) * 2; pos.setXYZ(i, x * k, y * k, z * k); }
  g.computeVertexNormals();
  const base = STONE_COL[Math.floor(hh(seed * 1.7) * STONE_COL.length)], e = new THREE.Euler(hh(seed) * 3, hh(seed + 1) * 3, hh(seed + 2) * 3), n = nIn.clone().normalize(), sx = size * (0.8 + 0.5 * hh(seed + 3)), sy = size * (0.55 + 0.4 * hh(seed + 4)), sz = size * (0.7 + 0.4 * hh(seed + 5));
  const m = new THREE.Matrix4().compose(p.clone().addScaledVector(n, -size * 0.05), new THREE.Quaternion().setFromEuler(e), new V3(sx, sy, sz));   // half buried: its centre sits in the wall
  const ctr = p.clone();
  M.addGeo(g, m, (x, y, z, nx, ny, nz) => { const c = base.clone().multiplyScalar(0.55 + 0.28 * (ny * 0.5 + 0.5)); const d = new V3(x, y, z).sub(ctr).dot(n); c.lerp(K.furrow, 0.6 * sm((0.12 * size - d) / (0.3 * size))); if (ny > 0.55) c.lerp(K.wetL, 0.1); if (moss && ny > 0.35) c.lerp(K.moss, 0.5 * sm((ny - 0.35) * 2.5)); return c; });
  // the contact ring: a dark skirt of earth where the stone meets the wall (a flat annulus, 1.3 x its radius, lifted 8 mm)
  const [t1, t2] = tangents(n), R = Math.max(sx, sz) * 1.0, ring = 14, dk = new THREE.Color("#10181a"), c0 = M.vv(ctr.clone().addScaledVector(n, 0.006), dk), outer = [];
  for (let i = 0; i < ring; i++) { const a = TAU * i / ring, k = 1.3 + 0.2 * (hh(seed * 3 + i) - 0.5); outer.push(M.vv(ctr.clone().addScaledVector(t1, Math.cos(a) * R * k).addScaledVector(t2, Math.sin(a) * R * k).addScaledVector(n, 0.006), cm(dk, K.earth, 0.65))); }
  for (let i = 0; i < ring; i++) M.tri(c0, outer[i], outer[(i + 1) % ring], n);
}
function jitterBox(w, h, d, sx, sy, sz, seed, amp) {
  const g = new THREE.BoxGeometry(w, h, d, sx, sy, sz).toNonIndexed(), pos = g.attributes.position, seen = new Map();
  for (let i = 0; i < pos.count; i++) { const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`; if (!seen.has(key)) seen.set(key, [(hh(seed + seen.size * 3.1) - 0.5) * amp, (hh(seed + seen.size * 5.7) - 0.5) * amp * 0.6, (hh(seed + seen.size * 7.3) - 0.5) * amp]); const j = seen.get(key); pos.setXYZ(i, pos.getX(i) + j[0], pos.getY(i) + j[1], pos.getZ(i) + j[2]); }
  g.computeVertexNormals(); return g;
}
function flatSlab(M, cx, cz, r, seed, lift, tiltA) {
  const n = 7, top = [], bot = [], c = cm(K.wet, K.wetS, 0.3 + 0.2 * hh(seed));
  for (let i = 0; i < n; i++) { const a = TAU * (i + 0.3 * hh(seed + i)) / n, rr = r * (0.75 + 0.35 * hh(seed * 3 + i)), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr * 0.8, y = lift * (0.5 + 0.5 * Math.cos(a - tiltA)) + 0.012; top.push(M.v(x, y, z, cm(c, K.wetL, 0.15 + 0.15 * hh(seed + i * 2)))); bot.push(M.v(x, -0.05, z, K.wetS)); }
  const tc = M.v(cx, lift * 0.5 + 0.02, cz, cm(c, K.wetL, 0.28));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri(tc, top[i], top[j], new V3(0, 1, 0)); M.quad(top[i], bot[i], bot[j], top[j], new V3(Math.cos(TAU * i / n), 0, Math.sin(TAU * i / n))); }
}
// the drift centres (shared by the painted floor and the real pebbles)
const driftAt = (d) => { const a = TAU * hh(d * 9.1 + 4), r = 5.8 + 1.6 * hh(d * 5.7); return [0.3 + r * Math.cos(a) * 0.95, r * Math.sin(a) * 1.15]; };

// the net of light (the well's caustic on every surface facing it): three layers of a warped grid, drawn as lines, 0.15 m/s
const NET_VS = `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const NET_FS = `uniform float uT; uniform float uGold; uniform float uStr; uniform float uDim; uniform vec3 uWell; varying vec3 vW; varying vec3 vN;
float net(vec2 p, float k, float ph){ vec2 q = p * k; q += 0.42 * vec2(sin(q.y * 1.3 + ph), cos(q.x * 1.5 + ph * 0.8)); float m = min(abs(sin(q.x)), abs(sin(q.y))); return 1.0 - smoothstep(0.0, 0.2, m); }
void main(){ vec3 n = normalize(vN), a = abs(n); vec2 uv = (a.x > a.y && a.x > a.z) ? vW.zy : (a.y > a.z ? vW.xz : vW.xy);
  float t = uT; float l1 = net(uv + vec2(1.0, 0.3) * 0.15 * t, 2.6, t * 0.9); float l2 = net(uv + vec2(-0.5, 1.0) * 0.15 * t, 3.5, t * 0.7 + 2.0); float l3 = net(uv + vec2(0.3, -1.0) * 0.15 * t, 1.9, t * 0.5 + 4.0);
  vec3 cy = vec3(0.561, 0.878, 0.941), go = vec3(1.0, 0.914, 0.659), gg = vec3(1.0, 0.831, 0.353);
  vec3 c = cy * (l1 + l3 * 0.8) + go * l2 * (1.0 - uDim); c = mix(c, gg * (l1 + l2 + l3) * 0.7, uGold);
  float d = length(vW - uWell), fade = 1.0 - smoothstep(3.0, 7.0, d), face = clamp(dot(n, normalize(uWell - vW)) * 1.4, 0.0, 1.0);
  float aa = uStr * fade * face; gl_FragColor = vec4(c * aa, 1.0); }`;
const CURT_FS = `uniform float uT; uniform float uGold; uniform float uStr; uniform float uDim; uniform vec3 uWell; varying vec3 vW; varying vec3 vN; varying vec3 vC;
float net(vec2 p, float k, float ph){ vec2 q = p * k; q += 0.42 * vec2(sin(q.y * 1.3 + ph), cos(q.x * 1.5 + ph * 0.8)); float m = min(abs(sin(q.x)), abs(sin(q.y))); return 1.0 - smoothstep(0.0, 0.2, m); }
void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; vec3 key = normalize(vec3(0.15, 0.75, -0.65)); float lam = 0.5 + 0.5 * dot(n, key); vec3 base = vC * (0.55 + 0.6 * lam) * (1.0 - 0.3 * uDim);
  vec3 a = abs(n); vec2 uv = (a.x > a.y && a.x > a.z) ? vW.zy : (a.y > a.z ? vW.xz : vW.xy); float t = uT;
  float l1 = net(uv + vec2(1.0, 0.3) * 0.15 * t, 2.6, t * 0.9), l2 = net(uv + vec2(-0.5, 1.0) * 0.15 * t, 3.5, t * 0.7 + 2.0), l3 = net(uv + vec2(0.3, -1.0) * 0.15 * t, 1.9, t * 0.5 + 4.0);
  vec3 cy = vec3(0.561, 0.878, 0.941), go = vec3(1.0, 0.914, 0.659), gg = vec3(1.0, 0.831, 0.353); vec3 c = cy * (l1 + l3 * 0.8) + go * l2 * (1.0 - uDim); c = mix(c, gg * (l1 + l2 + l3) * 0.7, uGold);
  float d = length(vW - uWell), fade = 1.0 - smoothstep(3.0, 7.0, d), face = clamp(dot(n, normalize(uWell - vW)) * 1.4 + 0.35, 0.0, 1.0); gl_FragColor = vec4(base + c * uStr * fade * face * 1.6, 1.0); }`;

// ---------------------------------------------------------------------------------------------------------------------
export const NORSE_CAVE_STATE = { norsecave: { runes: 0.35, shafts: 1, mist: 1, gust: 0, dim: 0, gold: 0 } };
export const NORSE_CAVE_GRIPS = {};

export const NORSE_CAVE_KINDS = {
  norsecave(P) {
    const S = P.spec, G = P.whole, stats = {}, bakedList = [];
    const mesh = (geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); scenery(m, o); G.add(m); if (o.baked) bakedList.push({ geo, base: Float32Array.from(geo.attributes.color.array) }); return m; };
    const barkMat = stdMat(), lineless = (m) => noLine(m);
    const wallPoint = (th, y) => { let top = 7; for (let k = 0; k < 3; k++) { const L = leanK(th, top); top = Hc(CEN[0] + Math.cos(th) * bnd(th) * L, CEN[1] + Math.sin(th) * bnd(th) * L); } return shellPt(th, 0.5 * clamp(y / top, 0, 1)); };
    const inward = (p) => new V3(CEN[0] - p.x, 0, CEN[1] - p.z).normalize();

    // ================================================================= roots, ridges, burls, stubs
    const bark = new Mesher(), roots = {};
    for (const [id, pts, o, seg] of [...ROOT_DEFS, ...FRAME_DEFS, ...FLOORROOT_DEFS]) { const r = new Root(id, pts, o); r.build(bark, seg, (p, n, f, s, phi, u, g) => barkColor(p, n, f, null, u, phi, g)); roots[id] = r; }
    const runeAnchors = GROUPS.map(([rid, wp]) => roots[rid].project(new V3(...wp)).p);
    stats.crossCracks = { R1: barkRidges(bark, roots.R1, 40, 100, runeAnchors, 2.6), R2: barkRidges(bark, roots.R2, 12, 200, runeAnchors, 2.0), R3: barkRidges(bark, roots.R3, 9, 300, runeAnchors, 1.8), R4: barkRidges(bark, roots.R4, 8, 400, runeAnchors, 1.8), R5: barkRidges(bark, roots.R5, 9, 500, runeAnchors, 1.8) };
    const BURLS = [[-1.3, 7.6, -6.8, 0.8], [1.4, 7.4, -4.2, 0.6], [-0.8, 7.3, -1.8, 0.9], [2.6, 7.6, 0.4, 0.5], [4.7, 6.8, 3.6, 0.7]];
    BURLS.forEach(([x, y, z, d], i) => { const a = roots.R1.project(new V3(x, y, z)); burl(bark, a.p, a.n, tangents(a.n, a.T)[0], d, i * 7 + 1); });
    const STUBS = [[0.4, 7.1, -5.6, 0.4, 0.7, 8], [2.0, 7.5, -1.2, 0.3, 0.55, 6], [-1.2, 7.6, -3.4, 0.5, 0.85, 9]];
    STUBS.forEach(([x, y, z, th, ln, rg], i) => { const a = roots.R1.project(new V3(x, y, z), -0.04), d = a.n.clone().multiplyScalar(0.85).add(new V3(0.25 * (i - 1), -0.35, 0.2)).normalize(); stub(bark, a.p, a.n, d, th, ln, rg, i * 5 + 3); });
    { let nk = 0; for (const id of ["R1", "R2", "R3", "R4", "R5"]) scatter(roots[id], id === "R1" ? 16 : 5, 12000 + nk * 7, [(a) => inCave(a.p) && a.n.y > -0.4]).forEach((a, i) => { const [t1] = tangents(a.n, a.T); burl(bark, a.p, a.n, t1, 0.14 + 0.16 * hh(nk * 3 + i), 40 + nk++); }); stats.knots = nk; }
    stats.burls = BURLS.length; stats.stubs = STUBS.length;

    // ================================================================= moss (180 cushions), hanging moss (60), lichen (90), brackets (14), ferns (34)
    const mossM = new Mesher(), hangM = new Mesher(), lichM = new Mesher(), brM = new Mesher(), fernM = new Mesher(), detM = new Mesher(), glowM = new Mesher();
    let nMoss = 0, nHang = 0, nLich = 0, nBr = 0, nFern = 0;
    const mossAt = (a, i, size) => { const [t1] = tangents(a.n, a.T); mossCushion(mossM, a.p, a.n, t1, size ?? 0.15 + 0.95 * Math.pow(hh(i * 1.9 + 0.4), 3.6), 0.2 + 0.1 * hh(i + 5), 1 + 0.9 * hh(i + 3), i); nMoss++; };
    const furrowTest = (r) => (a) => inCave(a.p) && r.prof(a.phi) > 0.6 && a.n.y > -0.05;
    [["R1", 56, 1000], ["R2", 22, 2000], ["R3", 28, 3000], ["R4", 18, 4000], ["R5", 22, 5000], ["S1", 5, 6000], ["S2", 5, 7000], ["S3", 4, 8000]].forEach(([id, n, sd]) => {
      const r = roots[id]; scatter(r, n, sd, [upper, furrowTest(r), upperLoose, any]).forEach((a, i) => mossAt(a, sd + i));
    });
    [["R1", 18, 1100], ["R2", 8, 2100], ["R3", 8, 3100], ["R4", 6, 4100], ["R5", 10, 5100]].forEach(([id, n, sd]) => { scatter(roots[id], n, sd, [lower, lowerLoose, any]).forEach((a, i) => { hangMoss(hangM, a.p.clone().addScaledVector(a.n, -0.04), a.n, sd + i * 3.7, 0.2 + 0.5 * hh(sd + i)); nHang++; }); });
    for (let i = 0; i < 10; i++) { const t = (i + 0.5 + 0.3 * (hh(i * 3.1) - 0.5)) / 10, k = Math.floor(t * 8), pa = GAP[(2 + k + 7) % GAP.length]; const q = GAP[9 + Math.min(6, Math.floor(t * 7))]; void pa; hangMoss(hangM, new V3(q[0] + (hh(i) - 0.5) * 0.3, q[1] + 0.05, -8.62), new V3(0, -1, 0), 9100 + i * 3.1, 0.25 + 0.4 * hh(i + 9)); nHang++; }
    [["R1", 18, 1200], ["R2", 18, 2200], ["R3", 14, 3200], ["R4", 16, 4200], ["R5", 14, 5200]].forEach(([id, n, sd]) => { scatter(roots[id], n, sd, [flank, upperLoose, any]).forEach((a, i) => { lichenDisc(lichM, a.p, a.n, 0.02 + 0.1 * Math.pow(hh(sd + i * 1.7), 1.4), sd + i); nLich++; }); });
    [["R2", [3, 2, 2], 2300], ["R4", [3, 2, 2], 4300]].forEach(([id, groups, sd]) => {
      const r = roots[id];
      groups.forEach((cnt, gi) => {
        const base = scatter(r, 1, sd + gi * 77, [(a) => inCave(a.p) && Math.abs(a.n.y) < 0.55 && a.p.y > 1.0 && a.p.y < 5.0 && a.n.x * (id === "R2" ? 1 : -1) > 0.2]);
        const a0 = base[0]; if (!a0) return; (stats.bracketAt ||= []).push([id, +a0.p.x.toFixed(2), +a0.p.y.toFixed(2), +a0.p.z.toFixed(2), +a0.n.x.toFixed(2), +a0.n.z.toFixed(2)]);
        for (let q = 0; q < cnt; q++) {
          const s = clamp(a0.s + (hh(sd + gi * 5 + q) - 0.5) * 0.04, 0.02, 0.98), phi = a0.phi + (hh(sd + gi * 9 + q * 2) - 0.5) * 0.5, a = r.at(s, phi), out = new V3(a.n.x, 0, a.n.z).normalize(), rr = 0.1 + 0.25 * hh(sd + gi * 13 + q * 3);
          bracket(brM, a.p.clone().addScaledVector(a.n, -0.03).add(new V3(0, 0.34 * q - 0.1, 0)), new V3(0, 1, 0), out, rr, 3 + Math.floor(hh(sd + gi * 17 + q) * 3), sd + gi * 7 + q); nBr++;
        }
      });
    });
    // ferns: 12 on the gap's sill (R3's top), 12 at the feet of roots, 10 on the wall ledges (below)
    for (let k = 0; k < 12; k++) {
      const x = lerp(-3.5, 3.4, (k + 0.5 + 0.35 * (hh(k * 3.7) - 0.5)) / 12); let bi = 0, bd = 1e9; const r3 = roots.R3; for (let i = 0; i <= r3.N; i++) { const d = Math.abs(r3.fr[i].c.x - x); if (d < bd) { bd = d; bi = i; } }
      const s = bi / r3.N, a = r3.at(s, r3.facing(s, new V3(0, 1, 0)) + (hh(k) - 0.5) * 0.5); fern(fernM, a.p.clone().addScaledVector(a.n, -0.03), new V3(0, 1, 0).lerp(a.n, 0.4).normalize(), 6100 + k * 3.3); nFern++;
    }
    [[-6.2, 3.9], [-6.9, 2.6], [-6.5, 5.1], [6.6, -0.8], [6.9, 0.6], [6.4, -2.0], [7.1, 7.4], [6.4, 8.2], [-5.3, 5.6], [-6.0, 6.9], [-5.6, -6.9], [5.6, -6.3]].forEach(([x, z], i) => { fern(fernM, new V3(x, 0.02, z), new V3(0, 1, 0), 6200 + i * 4.1); nFern++; });

    // ================================================================= carved runes: 12 marks in 5 groups, glow at `runes`
    const APRON = new V3(-0.3, 1.4, 3.5), faceApron = (r, a) => { let best = a, bs = -9; for (let d = -1.0; d <= 1.001; d += 0.1) { const b = r.at(a.s, a.phi + d), sc = b.n.dot(APRON.clone().sub(b.p).normalize()) - 0.3 * Math.abs(d); if (sc > bs) { bs = sc; best = b; } } return best; };
    const markList = [];
    GROUPS.forEach(([rid, wp, marks, hs], gi) => {
      const r = roots[rid], a0 = faceApron(r, r.project(new V3(...wp))), n = a0.n, _dbg = ((stats.runeAt ||= []).push([+a0.p.x.toFixed(2), +a0.p.y.toFixed(2), +a0.p.z.toFixed(2), +a0.n.x.toFixed(2), +a0.n.y.toFixed(2), +a0.n.z.toFixed(2)])), up = new V3(0, 1, 0).addScaledVector(n, -n.y); if (up.lengthSq() < 0.04) up.copy(a0.T).addScaledVector(n, -a0.T.dot(n)); up.normalize();
      const right = new V3().crossVectors(up, n).normalize(); let cursor = -0.3 * marks.length;
      marks.forEach((name, mi) => {
        const h = hs[mi], sc = h / 2, strokes = RUNES[name], w = h * 0.06, wid = Math.max(...strokes.flatMap((s) => [s[0], s[2]])) * sc, ox = cursor, oy = [0, -0.18, 0.12][mi % 3] - h / 2;
        cursor += wid + 0.45;
        const lowEnds = []; let minY = 1e9;
        strokes.forEach(([x0, y0, x1, y1]) => {
          const len = Math.hypot(x1 - x0, y1 - y0) * sc, nseg = Math.max(2, Math.ceil(len / 0.045)), pts = [], nrm = [];
          for (let q = 0; q <= nseg; q++) { const u = q / nseg, wp2 = a0.p.clone().addScaledVector(right, ox + (x0 + (x1 - x0) * u) * sc).addScaledVector(up, oy + (y0 + (y1 - y0) * u) * sc).addScaledVector(n, 0.5); const pr = r.project(wp2, 0); pts.push(pr.p); nrm.push(pr.n); }
          const dir = new V3(x1 - x0, y1 - y0, 0), tang = pts[nseg].clone().sub(pts[0]).normalize();
          void dir;
          const sideOf = (i) => new V3().crossVectors(tang, nrm[i]).normalize();
          const lift = (i, k) => pts[i].clone().addScaledVector(nrm[i], k);
          const strip = (M, off, ww, lf, c1, c2) => { const ids = pts.map((p, i) => { const s = sideOf(i), q = lift(i, lf); return [M.vv(q.clone().addScaledVector(s, off - ww / 2), c1), M.vv(q.clone().addScaledVector(s, off + ww / 2), c2 ?? c1)]; }); for (let i = 0; i < nseg; i++) { M.quad(ids[i][0], ids[i][1], ids[i + 1][1], ids[i + 1][0], nrm[i]); } };
          strip(detM, 0, w, 0.012, K.runeCut);
          strip(detM, -(w / 2 + 0.008), 0.014, 0.02, cm(K.bark, K.ridge, 0.8)); strip(detM, w / 2 + 0.008, 0.014, 0.02, cm(K.bark, K.ridge, 0.8));
          strip(glowM, 0, w * 0.6, 0.017, new THREE.Color(1, 1, 1));
          for (const [yy, pp] of [[y0, pts[0]], [y1, pts[nseg]]]) { minY = Math.min(minY, yy); lowEnds.push([yy, pp, nrm[yy === y0 ? 0 : nseg]]); }
        });
        // moss in the lower ends: a tuft at the lowest end of the mark
        const lo = lowEnds.filter((e) => e[0] <= minY + 0.01).slice(0, 2); lo.forEach(([, pp, nn], i) => { const [t1] = tangents(nn); mossCushion(mossM, pp.clone().addScaledVector(nn, 0.0), nn, t1, 0.07 + 0.03 * hh(gi * 7 + mi + i), 0.4, 1.2, 9500 + gi * 13 + mi * 3 + i); });
        markList.push({ gi, mi, name, h });
      });
      // two groups have a mark half under moss: a real cushion over the lower half of its first mark
      if (gi === 1 || gi === 3) { const mk = marks[0], h = hs[0], ctr = a0.p.clone().addScaledVector(right, -0.3 * marks.length + 0.2 * h).addScaledVector(up, -0.18 * (0) - 0.7 * h * 0.5); const pr = r.project(ctr.addScaledVector(n, 0.5), 0); const [t1] = tangents(pr.n, a0.T); mossCushion(mossM, pr.p, pr.n, t1, 0.5 * h + 0.2, 0.3, 1.5, 9700 + gi); nMoss++; void mk; }
    });
    stats.marks = markList.length;

    // ================================================================= the earth walls and ceiling
    const shell = new Mesher(), NT = 192, NW = 56, grid = [];
    const gapCut = (p) => p.z < -7.0 && inPoly(p.x, p.y, GAP.map(([x, y]) => [x, y])) , doorCut = (p) => p.z > 7.0 && p.x > DOOR.x0 - 0.02 && p.x < DOOR.x1 + 0.02 && p.y < DOOR.h;
    const tmpv = new V3();
    for (let j = 0; j <= NW; j++) for (let i = 0; i <= NT; i++) {
      const th = TAU * (i % NT) / NT - Math.PI, w = j / NW; shellPt(th, w, tmpv);
      const lump = vn(tmpv.x, tmpv.y, tmpv.z, 0.9, 6) - 0.5, l2 = vn(tmpv.x, tmpv.y, tmpv.z, 2.4, 7) - 0.5, grain = vn(tmpv.x, tmpv.y, tmpv.z, 6, 8) - 0.5, strata = Math.sin(tmpv.y * 2.6 + 3 * vn(tmpv.x, tmpv.z, 0, 0.5, 3)), c = K.earth.clone().multiplyScalar(0.62 + 1.0 * lump + 0.8 * l2 + 0.3 * grain + 0.12 * strata);
      if (l2 > 0.12) c.lerp(new THREE.Color('#4a4234'), 0.5 * sm((l2 - 0.12) * 5)); else if (l2 < -0.15) c.lerp(new THREE.Color('#1c2a2c'), 0.5 * sm((-0.15 - l2) * 5));
      c.lerp(K.wetS, 0.25 * sm(1.2 - tmpv.y)); c.lerp(K.mossS, 0.18 * sm(0.8 - tmpv.y) * (0.5 + hh(i * 3 + j)));
      c.multiplyScalar(0.72 * (0.55 + 0.45 * sm(tmpv.y / 1.6))); if (w > 0.5) c.multiplyScalar(0.62);
      c.multiplyScalar(1 - 0.35 * sm((tmpv.y - 4) / 6));
      if (tmpv.z < -8 && tmpv.y > 4 && tmpv.y < 9 && Math.abs(tmpv.x - 0.3) < 4.5) c.lerp(new THREE.Color("#4a5a58"), 0.28);   // damp round the gap
      grid.push(shell.vv(tmpv, c));
    }
    const cellP = new V3();
    for (let j = 0; j < NW; j++) for (let i = 0; i < NT; i++) {
      const a = j * (NT + 1) + i, b = a + 1, c = a + NT + 1, d = c + 1;
      cellP.set((shell.p[a * 3] + shell.p[d * 3]) / 2, (shell.p[a * 3 + 1] + shell.p[d * 3 + 1]) / 2, (shell.p[a * 3 + 2] + shell.p[d * 3 + 2]) / 2);
      if (j < NW / 2 && (gapCut(cellP) || doorCut(cellP))) continue;
      const ref = new V3(CEN[0] - cellP.x, 3 - cellP.y, CEN[1] - cellP.z); shell.quad(a, b, d, c, ref);
    }
    const wallBox = []; void wallBox;
    // ledges (9), set stones (120), pebbles, heaved slabs
    const stoneM = new Mesher(), LEDGES = [[Math.PI, 1.6, 1.6], [Math.PI - 0.28, 3.0, 1.2], [Math.PI + 0.38, 2.2, 1.4], [-2.45, 1.2, 1.5], [-0.95, 2.0, 1.3], [0.12, 1.4, 1.7], [0.46, 3.3, 1.1], [2.35, 1.8, 1.4], [0.95, 2.4, 1.2]], ledgeTops = [];
    LEDGES.forEach(([th, y, wd], i) => {
      const p = wallPoint(th, y), nin = inward(p), dep = 0.35 + 0.35 * hh(i * 5.1), g = jitterBox(wd, 0.22, dep, 6, 1, 2, 300 + i * 11, 0.05), psi = Math.atan2(nin.x, nin.z);
      const cpos = p.clone().addScaledVector(nin, dep / 2 - 0.12); cpos.y = y;
      stoneM.addGeo(g, mat4(cpos.x, cpos.y, cpos.z, 0, psi, 0), (x, yy, z, nx, ny) => { const c = cm(K.wet, K.wetS, 0.4 + 0.3 * hh(i)); c.multiplyScalar(0.8 + 0.3 * (ny * 0.5 + 0.5)); if (ny < -0.5) c.multiplyScalar(0.6); if (ny > 0.6) c.lerp(K.wetL, 0.12); return c; });
      ledgeTops.push({ p: new V3(cpos.x, y + 0.11, cpos.z), nin, t: new V3(Math.cos(psi), 0, -Math.sin(psi)), dep, wd, i });
    });
    ledgeTops.forEach((l, i) => {   // each ledge: two moss cushions and a fern (one gets a second), and a lichen or two
      for (let q = 0; q < 2; q++) { const pp = l.p.clone().addScaledVector(l.t, (q ? 0.3 : -0.28) * l.wd * (0.8 + 0.4 * hh(i + q))).addScaledVector(l.nin, (hh(i * 3 + q) - 0.5) * l.dep * 0.5); mossAt({ p: pp, n: new V3(0, 1, 0), T: l.t }, 8800 + i * 5 + q, 0.2 + 0.4 * hh(i * 9 + q)); }
      fern(fernM, l.p.clone().addScaledVector(l.t, 0.1 * l.wd).addScaledVector(l.nin, 0.02), new V3(0, 1, 0), 6300 + i * 5.3); nFern++;
      if (i === 0) { fern(fernM, l.p.clone().addScaledVector(l.t, -0.38 * l.wd), new V3(0, 1, 0), 6390); nFern++; }
      if (i < 5) for (let q = 0; q < 2; q++) { lichenDisc(lichM, l.p.clone().addScaledVector(l.t, (q ? 0.15 : -0.1) * l.wd).addScaledVector(l.nin, 0.05 + 0.1 * q), new V3(0, 1, 0), 0.03 + 0.05 * hh(i + q * 7), 8900 + i * 2 + q); nLich++; }
    });
    // 120 set stones 0.1-0.6: 14 round the way in, 8 round the gap, the rest on the walls
    let nStone = 0;
    const DOORS = []; for (let q = 0; q < 14; q++) { const side = q % 2, k = Math.floor(q / 2), x = side ? DOOR.x1 + 0.1 : DOOR.x0 - 0.1, y = 0.25 + k * 0.5 + 0.2 * (hh(q) - 0.5); DOORS.push([x, y]); }
    DOORS.forEach(([x, y], q) => { const th = Math.atan2(8.95, x - CEN[0]), p = wallPoint(th, y); stoneAt(stoneM, p, inward(p), 0.18 + 0.2 * hh(q * 3.1 + 2), 700 + q, q % 3 === 0); nStone++; });
    for (let q = 0; q < 8; q++) { const a = TAU * q / 8 + 0.3, x = 0.3 + 3.75 * Math.cos(a) * (Math.abs(Math.cos(a)) > 0.3 ? 1.0 : 0.9), y = 6.05 + 2.0 * Math.sin(a), p = new V3(x, y, -8.8); stoneAt(stoneM, p, new V3(0, 0, 1), 0.2 + 0.2 * hh(q * 2.3), 750 + q, true); nStone++; }
    for (let q = 0; nStone < 120 && q < 4000; q++) {
      const th = TAU * hh(q * 1.91 + 5) - Math.PI, y = 0.15 + 6 * Math.pow(hh(q * 3.37 + 2), 1.3), p = wallPoint(th, y);
      if (gapCut({ x: p.x, y: p.y, z: p.z }) || doorCut(p) || p.y > Hc(p.x, p.z) - 0.4) continue;
      stoneAt(stoneM, p, inward(p), 0.1 + 0.5 * Math.pow(hh(q * 7.7 + 1), 2.2), 800 + q, hh(q * 11) > 0.55); nStone++;
    }
    for (let d = 0; d < 3; d++) { const [cx, cz] = driftAt(d + 1); for (let q = 0; q < 55; q++) { const rr = 0.15 + 0.7 * Math.pow(hh(d * 100 + q * 1.3), 0.7), aa = TAU * hh(d * 77 + q * 2.9), s = 0.025 + 0.05 * hh(d * 31 + q * 7); stoneAt(stoneM, new V3(cx + rr * Math.cos(aa), 0, cz + rr * 0.8 * Math.sin(aa)), new V3(0, 1, 0), s, 20000 + d * 100 + q, false); } }
    [[5.9, 4.4, 0.06, 0.4], [-5.7, -4.9, 0.045, 2.2], [1.4, -7.0, 0.035, 4.0]].forEach(([x, z, lf, ta], i) => flatSlab(stoneM, x, z, 0.5 + 0.1 * i, 40 + i * 5, lf, ta));
    stats.stones = nStone; stats.ledges = LEDGES.length;
    // 300 hair roots drawn on the walls
    const hairM = new Mesher(); let nHair = 0;
    for (let q = 0; nHair < 300 && q < 4000; q++) {
      let th = TAU * hh(q * 2.17 + 1) - Math.PI, y = 0.5 + 6.3 * hh(q * 4.11 + 3); const pts = [], dth = (hh(q * 5.3) - 0.5) * 0.05, dy = 0.08 + 0.12 * hh(q * 6.1), steps = 5 + Math.floor(hh(q * 7.9) * 5);
      let ok = true; for (let k = 0; k < steps; k++) { const p = wallPoint(th + dth * k + 0.012 * Math.sin(k * 1.7 + q), Math.max(0.1, y - dy * k * (0.6 + 0.8 * hh(q + k)))); if (gapCut({ x: p.x, y: p.y, z: p.z }) || doorCut(p) || p.y > Hc(p.x, p.z) - 0.2) { ok = false; break; } pts.push(p.addScaledVector(inward(p), 0.015)); }
      if (!ok || pts.length < 4) continue; nHair++;
      thinTube(hairM, pts, (u) => lerp(0.014, 0.003, u), (u) => cm(new THREE.Color("#4d3d2f"), K.ridge, 0.2 + 0.3 * u + 0.2 * hh(q)), 3);
    }
    stats.hairRoots = nHair;

    // ================================================================= the way in under R5 (tunnel, 5 rough steps, a faint daylight glow)
    const tun = new Mesher(), tcol = (z, c) => c.clone().multiplyScalar(0.7 * (1 - 0.82 * sm((z - 8.8) / 6)) + 0.04), tx0 = DOOR.x0, tx1 = DOOR.x1;
    { const Q = (a, b, c, d, ref, cc) => { const ids = [a, b, c, d].map((p) => tun.vv(new V3(...p), tcol(p[2], cc))); tun.quad(ids[0], ids[1], ids[2], ids[3], ref); };
      for (let k = 0; k < 6; k++) { const z0 = 8.6 + k * 1.15, z1 = z0 + 1.15, e = K.earth.clone().multiplyScalar(1.1 + 0.3 * hh(k)); Q([tx0, 0, z0], [tx0, DOOR.h + 0.2, z0], [tx0 + 0.0, DOOR.h + 0.2, z1], [tx0, 0, z1], new V3(1, 0, 0), e); Q([tx1, 0, z1], [tx1, DOOR.h + 0.2, z1], [tx1, DOOR.h + 0.2, z0], [tx1, 0, z0], new V3(-1, 0, 0), e); Q([tx0, DOOR.h + 0.2, z0], [tx1, DOOR.h + 0.2, z0], [tx1, DOOR.h + 0.2, z1], [tx0, DOOR.h + 0.2, z1], new V3(0, -1, 0), e.clone().multiplyScalar(0.8)); }
      for (let k = 0; k < 5; k++) { const z0 = 8.75 + k * 0.62, g = jitterBox(tx1 - tx0, 0.2 * (k + 1), 0.62, 6, 1, 2, 900 + k * 9, 0.04); tun.addGeo(g, mat4((tx0 + tx1) / 2, 0.1 * (k + 1), z0 + 0.31), (x, y, z, nx, ny) => { const c = cm(K.wet, K.wetS, 0.35 + 0.1 * k); c.multiplyScalar(0.9 + 0.2 * ny); if (ny < 0.2 && nx * 0 === 0) c.lerp(K.mossS, 0.25 * hh(k * 3 + y * 5)); return tcol(z, c); }); }
      Q([tx0, 1.0, 11.85], [tx0, 1.0, 15.4], [tx1, 1.2, 15.4], [tx1, 1.0, 11.85], new V3(0, 1, 0), K.wet.clone().multiplyScalar(0.8)); }

    // ================================================================= the floor: a polar fan over the footprint, one painted canvas (46 slabs, joints, puddles)
    const curt = buildCurtains(roots.R1);
    const dripAt = [0, 1, 2, 4].map((c) => curt.tips[c]);
    const plan = floorPlan(), jr = jointRuns(plan);
    stats.slabs = plan.length; stats.mossJoint = Math.round(jr.mossShare * 100); stats.waterJoint = Math.round(jr.waterShare * 100);
    const puddleSpec = [[[dripAt[0].x, dripAt[0].z], 0.55], [[dripAt[1].x, dripAt[1].z], 0.42], [[dripAt[2].x, dripAt[2].z], 0.9], [[dripAt[3].x, dripAt[3].z], 0.35], [[3.5, 3.4], 0.3]];
    let puddles = null;
    const floorTex = canvasTex((FX1 - FX0) * FS, (FZ1 - FZ0) * FS, (g, w, h) => { g.setTransform(FS, 0, 0, FS, -FX0 * FS, -FZ0 * FS); puddles = paintFloor(g, plan, jr, puddleSpec); }, "cave-floor", 8);
    floorTex.wrapS = floorTex.wrapT = THREE.ClampToEdgeWrapping;
    const floorGeo = (() => {
      const nt = 192, nr = 36, pos = [], uv = [], idx = [], colr = [];
      pos.push(CEN[0], 0, CEN[1]); uv.push((CEN[0] - FX0) / (FX1 - FX0), 1 - (CEN[1] - FZ0) / (FZ1 - FZ0)); colr.push(1, 1, 1);
      for (let k = 1; k <= nr; k++) for (let i = 0; i < nt; i++) { const th = TAU * i / nt - Math.PI, b = bnd(th) * (k / nr) * (k === nr ? 1.0 : 1), x = CEN[0] + Math.cos(th) * b, z = CEN[1] + Math.sin(th) * b; pos.push(x, 0, z); uv.push((x - FX0) / (FX1 - FX0), 1 - (z - FZ0) / (FZ1 - FZ0)); colr.push(1, 1, 1); }
      for (let i = 0; i < nt; i++) idx.push(0, 1 + ((i + 1) % nt), 1 + i);
      for (let k = 1; k < nr; k++) for (let i = 0; i < nt; i++) { const a = 1 + (k - 1) * nt + i, b = 1 + (k - 1) * nt + (i + 1) % nt, c = a + nt, d = b + nt; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    })();
    // (the fan's triangles face up: check one and flip if needed)
    { const n = floorGeo.attributes.normal; if (n.getY(1) < 0) { const ix = floorGeo.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } floorGeo.computeVertexNormals(); } }
    const floorM = mesh(floorGeo, new THREE.MeshStandardMaterial({ map: floorTex, vertexColors: true, roughness: 0.55, metalness: 0.0 }), { recv: true, baked: true }); floorM.name = "cave-floor";
    floorM.material.userData.noHatch = true;
    // bark, details
    const gBark = bark.build(); const barkMesh = mesh(gBark, barkMat, { baked: true }); barkMesh.name = "cave-roots";
    const matDS = (o = {}) => stdMat({ side: THREE.DoubleSide, ...o });
    const mkM = (M, mat, name, baked = true) => { const m = mesh(M.build(), mat, { baked }); m.name = name; return m; };
    mkM(mossM, lineless(matDS()), "cave-moss"); mkM(hangM, lineless(matDS()), "cave-hanging-moss"); mkM(lichM, lineless(matDS()), "cave-lichen"); mkM(brM, lineless(matDS()), "cave-brackets"); mkM(fernM, lineless(matDS()), "cave-ferns");
    mkM(detM, lineless(stdMat()), "cave-rune-cuts"); mkM(shell, stdMat(), "cave-earth"); mkM(stoneM, stdMat(), "cave-stones"); mkM(hairM, lineless(matDS()), "cave-hair-roots"); mkM(tun, stdMat(), "cave-way-in");
    stats.moss = nMoss; stats.hanging = nHang; stats.lichen = nLich; stats.brackets = nBr; stats.ferns = nFern;
    Object.assign(stats, curt.counts);

    // ================================================================= the curtains (140 strands): swaying, with the light net in their own shader
    const cu = curt.M.build(), cuPos = cu.attributes.position, cuBase = Float32Array.from(cuPos.array), cuH = new Float32Array(cuPos.count);
    curt.strands.forEach((s) => { for (let v = s.v0; v < s.v1; v++) cuH[v] = Math.max(0, s.top - cuBase[v * 3 + 1]); });
    const netU = { uT: { value: 0 }, uGold: { value: 0 }, uStr: { value: 0.25 }, uDim: { value: 0 }, uWell: { value: new V3(0, 0.3, 0) } };
    const curtMat = new THREE.ShaderMaterial({ uniforms: netU, vertexColors: true, side: THREE.DoubleSide, vertexShader: `varying vec3 vW; varying vec3 vN; varying vec3 vC; void main(){ vC = color; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`, fragmentShader: CURT_FS });
    curtMat.userData.noOutline = true; curtMat.userData.outlineParameters = { visible: false };
    const curtMesh = mesh(cu, curtMat); curtMesh.name = "cave-curtains";
    // the light net on R1, R2 and their kin: only the triangles within 7.4 m of the well that face it, lifted 1.2 cm
    const netGeo = (() => {
      const pos = gBark.attributes.position, nor = gBark.attributes.normal, ix = gBark.index, P = [], N = [], c = new V3(), n = new V3(), w = new V3(0, 0.3, 0);
      for (let i = 0; i < ix.count; i += 3) {
        const a = ix.getX(i), b = ix.getX(i + 1), d = ix.getX(i + 2); c.set(0, 0, 0); n.set(0, 0, 0);
        for (const k of [a, b, d]) { c.x += pos.getX(k) / 3; c.y += pos.getY(k) / 3; c.z += pos.getZ(k) / 3; n.x += nor.getX(k); n.y += nor.getY(k); n.z += nor.getZ(k); }
        if (c.z < -9.3 || c.distanceTo(w) > 7.6) continue; n.normalize(); if (n.dot(w.clone().sub(c).normalize()) < 0.05) continue;
        for (const k of [a, b, d]) { P.push(pos.getX(k) + nor.getX(k) * 0.012, pos.getY(k) + nor.getY(k) * 0.012, pos.getZ(k) + nor.getZ(k) * 0.012); N.push(nor.getX(k), nor.getY(k), nor.getZ(k)); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); return g;
    })();
    const netMat = noLine(new THREE.ShaderMaterial({ uniforms: netU, vertexShader: NET_VS, fragmentShader: NET_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const netMesh = scenery(new THREE.Mesh(netGeo, netMat), { steam: true, order: 4 }); netMesh.name = "cave-light-net"; G.add(netMesh);

    // ================================================================= the glow of the carved runes (additive, the `runes` level)
    const runeMat = softMat({ color: "#f2cf6a", opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexColors: true });
    const runeGlow = scenery(new THREE.Mesh(glowM.build(), runeMat), { steam: true, order: 5 }); runeGlow.name = "cave-rune-glow"; G.add(runeGlow);

    // ================================================================= the view through the gap: sky, 4 clouds, the trunk face, 30 leaves
    const vw = new THREE.Group(); vw.name = "cave-gap-view"; G.add(vw);
    { const sky = scenery(new THREE.Mesh(new THREE.PlaneGeometry(200, 120), noLine(new THREE.MeshBasicMaterial({ map: skyTex(), toneMapped: false, fog: false }))), { order: -5 }); sky.position.set(0, 35, -62); sky.name = 'cave-sky'; vw.add(sky); }
    const clouds = []; for (let i = 0; i < 4; i++) { const m = scenery(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), softMat({ map: cloudTex(i), side: THREE.DoubleSide })), { order: -3 }); const w = 15 + 6 * hh(i * 3.1), z = -48 - 4 * i; m.scale.set(w, w * 0.31, 1); vw.add(m); clouds.push({ m, w, z, y: 17 + 3.2 * i + 2 * hh(i), v: 7.4 + 1.6 * hh(i * 5.3), ph: hh(i * 7.7) }); }
    {   // the trunk face (E1's bark recipe at 40 %): a bulging wall 15 wide, y 4..45, 4 strands, 26 ridges, one tier of 6 brackets, moss on its left
      const TM = new Mesher(), nu = 130, nv = 120, tcx = 6, zb = (x) => -22.5 - (9 - Math.sqrt(81 - clamp(Math.abs(x - tcx), 0, 8.5) ** 2)), sun = new THREE.Color("#b09468");
      // 4 strands twisted slowly up the trunk, fine broken grooves in them: the bark is real relief (furrows 0.45 deep, grooves 0.12)
      const strandK = (x, y) => { const ph = (x - tcx) * 0.42 + 0.9 * Math.sin(y * 0.09) + y * 0.01, st = Math.abs(Math.sin(ph)), fq = Math.sin((x - tcx) * 2.1 + 1.6 * Math.sin(y * 0.31 + x * 0.7) + y * 0.05), fine = Math.pow(fq * fq, 2.5) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(y * 0.5 + x * 1.3))); return { st, fine }; };
      const relief = (x, y) => { const { st, fine } = strandK(x, y); return -0.45 * (1 - Math.pow(st, 0.6)) - 0.12 * fine + 0.3 * st; };
      const tc = (x, y) => { const { st, fine } = strandK(x, y), grain = vn(x * 0.9, y * 0.12, 0, 1, 9) - 0.5, grain2 = vn(x * 4.5, y * 0.5, 1, 1, 3) - 0.5; const c = cm(new THREE.Color("#6f5b45"), sun, 0.45 + 0.4 * grain).multiplyScalar(1 + 0.3 * grain2); c.lerp(new THREE.Color("#3a2c20"), 0.85 * sm((0.25 - st) / 0.25)); c.lerp(new THREE.Color("#3a2c20"), 0.8 * sm(fine * 1.4)); c.lerp(new THREE.Color("#a58c68"), 0.4 * sm((st - 0.8) * 5) * (1 - fine)); if (x < 0.4) c.lerp(K.moss, 0.25 * sm((0.4 - x) / 1.2)); return c; };
      const zz = (x, y) => zb(x) + relief(x, y);
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const x = tcx - 7.5 + 15 * i / nu, y = 4 + 41 * j / nv; TM.v(x, y, zz(x, y), tc(x, y)); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i; TM.quad(a, a + 1, a + nu + 2, a + nu + 1, new V3(0, 0, 1)); }
      for (let q = 0; q < 26; q++) { const sd = 700 + q * 5.3, x = tcx - 7 + 14 * hh(sd), y0 = 4 + 30 * hh(sd + 1), ln = 3 + 7 * hh(sd + 2), w = 0.2 + 0.3 * hh(sd + 3), rows = []; const n = Math.ceil(ln / 0.4); for (let k = 0; k <= n; k++) { const y = y0 + ln * k / n, xx = x + 0.15 * Math.sin(y * 0.7 + sd), tap = Math.max(0, Math.sin(Math.PI * k / n)) ** 0.5, c = tc(xx, y).lerp(K.ridge, 0.4); rows.push([TM.v(xx - w / 2, y, zz(xx - w / 2, y) + 0.04, c.clone().multiplyScalar(0.65)), TM.v(xx, y, zz(xx, y) + 0.4 * tap + 0.04, c.lerp(K.ridge, 0.5)), TM.v(xx + w / 2, y, zz(xx + w / 2, y) + 0.04, c.clone().multiplyScalar(0.65))]); } for (let k = 0; k < n; k++) { TM.quad(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0], new V3(0, 0, 1)); TM.quad(rows[k][1], rows[k][2], rows[k + 1][2], rows[k + 1][1], new V3(0, 0, 1)); } }
      for (let q = 0; q < 6; q++) bracket(TM, new V3(tcx - 4 + 1.9 * q + 0.4 * hh(q), 14.2 + 0.5 * hh(q * 3.3), zb(tcx - 4 + 1.9 * q) + 0.2), new V3(0, 1, 0), new V3(0, 0, 1), 0.5 + 0.45 * hh(q * 5.1), 3 + (q % 3), 900 + q);
      for (let q = 0; q < 26; q++) { const x = tcx - 7.3 + 2.2 * hh(q * 3.7 + 1), y = 5 + 18 * hh(q * 5.9), n = new V3(0, 0, 1); mossCushion(TM, new V3(x, y, zb(x) + 0.1), n, new V3(1, 0, 0), 0.5 + 1.1 * hh(q * 7.3), 0.3, 1.3, 950 + q); }
      const tm = scenery(new THREE.Mesh(TM.build(), noLine(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false, side: THREE.DoubleSide }))), { order: -2 }); tm.name = "cave-gap-trunk"; vw.add(tm);
    }
    const leafG = [leafMesher(0, 0.2), leafMesher(1, 0.18), leafMesher(2, 0.2)], leafMat = noLine(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    const mkLeaves = (parent, n, order) => { const out = []; for (let k = 0; k < 3; k++) { const cnt = Math.round(n / 3), im = new THREE.InstancedMesh(leafG[k], leafMat, cnt); scenery(im, { order }); im.userData.solid = false; parent.add(im); for (let i = 0; i < cnt; i++) im.setColorAt(i, LEAF[(i * 2 + k) % 5]); out.push({ im, cnt }); } return out; };
    const gapLeaves = mkLeaves(vw, 30, -1), caveLeaves = mkLeaves(G, 18, 1);
    // 40 dry leaves blown in, in drifts at the walls
    { const LM = new Mesher(), drifts = 7; for (let q = 0; q < 40; q++) {
        const d = q % drifts, a = TAU * hh(d * 9.7 + 2), rr = 6.1 + 1.0 * hh(d * 3.3), cx = CEN[0] + Math.cos(a) * rr * (BA / 8), cz = CEN[1] + Math.sin(a) * rr * (BB / 8), x = cx + (hh(q * 5.3) - 0.5) * 1.3, z = cz + (hh(q * 7.9) - 0.5) * 1.3;
        if (!inside(x, z, 0.5) || Math.hypot(x - 0.3, z) < 5.4) { const b = bnd(Math.atan2(z - CEN[1], x - CEN[0])) - 0.5, th = Math.atan2(z - CEN[1], x - CEN[0]); LM.addGeo(leafG[q % 3], mat4(CEN[0] + Math.cos(th) * b, 0.012 + 0.012 * hh(q), CEN[1] + Math.sin(th) * b, -Math.PI / 2 + (hh(q * 2) - 0.5) * 0.4, hh(q * 3) * TAU, 0), LEAF[q % 5]); continue; }
        LM.addGeo(leafG[q % 3], mat4(x, 0.01 + 0.02 * hh(q * 11), z, -Math.PI / 2 + (hh(q * 2) - 0.5) * 0.5, hh(q * 3) * TAU, 0, 1 + 0.4 * hh(q)), (cx0, cy0, cz0, nx, ny, nz, i) => { const c = LEAF[q % 5].clone(); const sh = leafG[q % 3].attributes.color.getX(i % leafG[q % 3].attributes.color.count); return c.multiplyScalar(sh); });
      }
      const lg = LM.build(); const lm = mesh(lg, lineless(stdMat({ side: THREE.DoubleSide })), { baked: true }); lm.name = "cave-floor-leaves"; }
    stats.floorLeaves = 40;

    // ================================================================= light shafts (5), the pools, 90 motes
    const poolTex = radialTex([[0, "rgba(255,255,255,1)"], [0.5, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]], 64), bt = beamTex(), BEAMS = [[[-2.4, 7.2], [-2.3, -2.0], 0.5], [[-0.9, 7.4], [-0.9, -1.2], 1.1], [[0.6, 7.5], [0.5, -0.8], 0.8], [[1.9, 7.3], [1.6, -1.6], 0.6], [[3.1, 7.0], [2.7, -2.4], 0.9]];
    const shafts = BEAMS.map(([g, f, w], i) => {
      const a = new V3(g[0], g[1], -8.5), b = new V3(f[0], 0.02, f[1]), mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length(), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.clone().normalize());
      const grp = new THREE.Group(); grp.position.copy(mid); grp.quaternion.copy(q); G.add(grp);
      const mt = softMat({ map: bt, color: "#ffe6a8", opacity: 0.18, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const planes = [0, Math.PI / 2].map((ry) => { const m = scenery(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mt), { steam: true, order: 3 }); m.rotation.y = ry; m.scale.set(w, len, 1); m.rotation.order = "YXZ"; grp.add(m); return m; });
      const pool = scenery(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), softMat({ map: poolTex, color: "#ffe6a8", opacity: 0.2, blending: THREE.AdditiveBlending })), { steam: true, order: 2 });
      pool.rotation.x = -Math.PI / 2; pool.position.set(b.x, 0.012, b.z); const sl = len / Math.max(0.1, a.y); pool.scale.set(w * 1.6, w * 1.6 * (0.9 + 0.5 * Math.min(2, Math.abs(dir.z) / Math.abs(dir.y))), 1); void sl; G.add(pool);
      return { grp, planes, mt, pool, w, a, b, len, dir };
    });
    const MOTES = 90, moteG = new THREE.BufferGeometry(), motePos = new Float32Array(MOTES * 3), moteCol = new Float32Array(MOTES * 3), moteInfo = [];
    for (let i = 0; i < MOTES; i++) moteInfo.push({ b: i % 5, u: hh(i * 3.3), du: 0.012 + 0.02 * hh(i * 5.1), lx: (hh(i * 7.7) - 0.5), lz: (hh(i * 9.1) - 0.5), ph: TAU * hh(i * 11.3) });
    moteG.setAttribute("position", new THREE.BufferAttribute(motePos, 3)); moteG.setAttribute("color", new THREE.BufferAttribute(moteCol, 3));
    const moteMat = noLine(new THREE.PointsMaterial({ map: radialTex([[0, "rgba(255,255,255,1)"], [0.5, "rgba(255,255,255,0.6)"], [1, "rgba(255,255,255,0)"]], 32), size: 0.026, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, color: "#fff3cc", toneMapped: false, fog: false }));
    const motes = new THREE.Points(moteG, moteMat); scenery(motes, { steam: true, order: 3 }); G.add(motes);
    // cloud-shadow events every 4-6 s (1 s long)
    const shEvents = []; { let tt = 3.2; for (let n = 0; n < 60; n++) { shEvents.push(tt); tt += 4 + 2 * hh(n * 3.7 + 1); } }

    // ================================================================= mist (14 cards), the blue veil behind z -6
    const wt = wispTex(), mistCards = [];
    const MIST = [[-6.0, -2.6, 3.6, 0.6, 0.3], [-6.4, 3.6, 3.0, 0.55, 0.3], [-5.0, -6.6, 3.4, 0.6, 0.3], [-1.2, -7.4, 4.0, 0.5, 0.3], [3.8, -7.0, 3.4, 0.55, 0.3], [6.2, -3.0, 3.0, 0.6, 0.3], [6.4, 3.0, 3.2, 0.55, 0.3], [-3.0, -4.0, 3.0, 0.3, 0.22], [2.0, -4.6, 2.8, 0.3, 0.22], [-2.8, 0.6, 2.4, 0.28, 0.2], [0.8, -1.8, 2.2, 0.26, 0.2], [3.4, 1.0, 2.6, 0.28, 0.2], [-1.0, 4.8, 2.0, 0.25, 0.18], [3.4, 5.6, 2.4, 0.3, 0.2]];
    MIST.forEach(([x, z, w, h, op], i) => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); const m = scenery(new THREE.Mesh(g, softMat({ map: wt, color: "#cfe6ea", opacity: op, side: THREE.DoubleSide })), { steam: true, order: 2 }); m.rotation.y = (hh(i * 5.3) - 0.5) * 1.1; m.position.set(x, 0.01, z); m.scale.set(w, h, 1); G.add(m); mistCards.push({ m, x, z, w, h, op, i }); });
    stats.mist = MIST.length;
    { // the veil: a 30 % blue card across z -6 with the gap cut out (scaled from the usual camera at (0, 1.2, 6))
      const sh = new THREE.Shape([[-11, 0], [11, 0], [11, 14], [-11, 14]].map(([x, y]) => new THREE.Vector2(x, y))), k = 12 / 14.5, hole = new THREE.Path(GAP.map(([x, y]) => new THREE.Vector2(x * k * 1.04, 1.2 + (y - 1.2) * k)));
      sh.holes.push(hole); const vg = new THREE.ShapeGeometry(sh);
      const veil = scenery(new THREE.Mesh(vg, softMat({ color: "#4f7f8e", opacity: 0.3, side: THREE.DoubleSide })), { steam: true, order: 1 }); veil.position.set(0, 0, -6); veil.name = "cave-veil"; G.add(veil);
    }

    // ================================================================= two trickles on the back wall, 4 drip lines with rings, 6 leaves in the air
    const tkT = trickleTex(); tkT.wrapS = tkT.wrapT = THREE.RepeatWrapping;
    const trickles = [[5.2, 2.8], [-4.6, 2.5]].map(([x, ht], i) => {
      const foot = roots.R3.topAt(x) + 0.02, g = new THREE.PlaneGeometry(0.2, ht), m = scenery(new THREE.Mesh(g, softMat({ map: tkT.clone(), color: "#dff2f5", opacity: 0.85, side: THREE.DoubleSide })), { steam: true, order: 3 });
      m.material.map.repeat.set(1, ht / 0.5); m.material.map.needsUpdate = true; m.position.set(x, foot + ht / 2 - 0.05, -8.62); G.add(m);
      const mi = scenery(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), softMat({ map: wt, color: "#dff2f5", opacity: 0.35 })), { steam: true, order: 3 }); mi.position.set(x, foot + 0.22, -8.5); G.add(mi);
      return { m, mi, ht, x };
    });
    const ringTex = radialTex([[0, "rgba(255,255,255,0)"], [0.72, "rgba(255,255,255,0)"], [0.84, "rgba(255,255,255,0.9)"], [0.92, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]], 128);
    const drips = dripAt.map((d, i) => {
      const ring = scenery(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), softMat({ map: ringTex, color: "#dff2f5", opacity: 0 })), { steam: true, order: 3 }); ring.rotation.x = -Math.PI / 2; ring.position.set(puddleSpec[i][0][0], 0.014, puddleSpec[i][0][1]); G.add(ring);
      const drop = scenery(new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 1), noLine(new THREE.MeshBasicMaterial({ color: "#dff2f5", toneMapped: false }))), { steam: true, order: 3 }); drop.scale.set(0.8, 1.4, 0.8); G.add(drop);
      return { ring, drop, x: d.x, y: d.y, z: d.z, T: 1.1 + 1.2 * hh(i * 4.3 + 2), ph: hh(i * 8.1) };
    });
    stats.drips = drips.length; stats.puddles = puddles ? puddles.length : 0;
    // way-in glow: faint daylight at the far end of the tunnel
    { const gm = scenery(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), softMat({ map: radialTex([[0, "rgba(255,244,210,1)"], [0.55, "rgba(255,236,190,0.5)"], [1, "rgba(255,230,180,0)"]], 64), color: "#fff1c8", opacity: 0.4, blending: THREE.AdditiveBlending })), { steam: true, order: 2 }); gm.position.set((tx0 + tx1) / 2, 2.2, 15.2); gm.rotation.y = Math.PI; G.add(gm); }
    // bench stand-in for the well (spec.benchWell): a plain cylinder at the well's footprint, not part of the set
    if (S.benchWell) { const m = scenery(new THREE.Mesh(new THREE.CylinderGeometry(1.39, 1.44, 0.3, 40), new THREE.MeshStandardMaterial({ color: "#8a8f90", roughness: 0.9 })), { recv: true }); m.position.y = 0.15; m.userData.lookOnly = false; G.add(m); const w = scenery(new THREE.Mesh(new THREE.CircleGeometry(1.15, 36), new THREE.MeshBasicMaterial({ color: "#2f9fc6" })), {}); w.rotation.x = -Math.PI / 2; w.position.y = 0.305; G.add(w); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 1.2, 28), new THREE.MeshStandardMaterial({ color: "#8a8f78", roughness: 0.9 })); scenery(hd, {}); hd.position.set(0, 0.8, -0.2); G.add(hd); }

    if (S.benchLights) {   // bench only: the five real lights of DESIGN section 10 so a still reads like the film (the clip's light plan owns them in a clip)
      const mk = (c, i, rg, x, y, z) => { const l = new THREE.PointLight(c, i, rg, 2); l.position.set(x, y, z); G.add(l); return l; };
      mk("#8fdcea", 6, 7, 0, 0.45, 0); mk("#ffd45a", 3, 3.5, 0.4, 0.3, 0.6); mk("#ffe9c8", 5, 8, 0, 1.6, 5.5);
      const sp = new THREE.SpotLight("#ffe6b0", 110, 30, 0.7, 0.6, 1.2); sp.position.set(1, 12, -12); const tg = new THREE.Object3D(); tg.position.set(0, 0, -0.5); G.add(tg); sp.target = tg; G.add(sp);
    }
    if (S.hide) G.traverse((o) => { if (S.hide.includes(o.name)) o.visible = false; });

    // ================================================================= state
    G.userData.caveStats = stats; if (typeof console !== "undefined") console.log("[norsecave] " + JSON.stringify(stats));
    const DS = NORSE_CAVE_STATE.norsecave, g0 = (ps, k) => ps?.[k] ?? S[k] ?? DS[k];
    let lastK = -1;
    const tmpO = new THREE.Object3D(), frac = (x) => x - Math.floor(x), WELL_C = new THREE.Color();
    const shaftA = new THREE.Color("#ffe6a8"), shaftB = new THREE.Color("#ffd990"), runeA = new THREE.Color("#f2cf6a"), runeB = new THREE.Color("#ffd45a");
    const e1s = shafts.map((s) => new V3().crossVectors(s.dir, new V3(0, 1, 0)).normalize()), e2s = shafts.map((s, i) => new V3().crossVectors(s.dir.clone().normalize(), e1s[i]).normalize());
    return {
      grip: 0,
      apply(ps, t) {
        const runes = clamp(g0(ps, "runes"), 0, 1), shaftsK = clamp(g0(ps, "shafts"), 0, 1.5), mistK = clamp(g0(ps, "mist"), 0, 1.5), gust = clamp(g0(ps, "gust")), dim = clamp(g0(ps, "dim")), gold = clamp(g0(ps, "gold"));
        // baked ambient x (1 - 0.3 dim)
        const k = 1 - 0.3 * dim;
        if (Math.abs(k - lastK) > 1e-5) { lastK = k; for (const b of bakedList) { const a = b.geo.attributes.color.array, s = b.base; for (let i = 0; i < a.length; i++) a[i] = s[i] * k; b.geo.attributes.color.needsUpdate = true; } }
        // the light net: 0.25, all gold at 0.4 with `gold`; the gold lines go with `dim`
        netU.uT.value = t; netU.uGold.value = gold; netU.uStr.value = lerp(0.25, 0.4, gold) * (1 - 0.15 * dim); netU.uDim.value = dim;
        // runes: pulse 8 % at 0.15 Hz, to 1 with `gold`
        const rl = lerp(runes, 1, gold) * (1 + 0.08 * Math.sin(TAU * 0.15 * t)); runeMat.opacity = clamp(0.9 * rl, 0, 1); runeGlow.visible = rl > 0.01; runeMat.color.copy(runeA).lerp(runeB, gold);
        // shafts: shrink 30 % for 1 s every 4-6 s (the wind outside), x (1 - 0.6 dim), 20 % warmer with gold
        let cloud = 0; for (const e of shEvents) { const dt = t - e; if (dt >= -0.01 && dt < 1) { cloud = sm(dt / 0.25) * sm((1 - dt) / 0.25); break; } }
        const sK = shaftsK * (1 - 0.6 * dim), wsc = 1 - 0.3 * cloud;
        shafts.forEach((s, i) => { s.mt.opacity = 0.18 * sK; s.mt.color.copy(shaftA).lerp(shaftB, gold); s.grp.visible = sK > 0.004; for (const p of s.planes) p.scale.x = s.w * wsc; s.pool.visible = sK > 0.004; s.pool.material.opacity = 0.2 * sK * (0.85 + 0.15 * wsc); s.pool.material.color.copy(shaftA).lerp(shaftB, gold); void i; });
        motes.visible = sK > 0.004;
        if (motes.visible) {
          const pp = moteG.attributes.position, cc = moteG.attributes.color;
          moteInfo.forEach((m, i) => { const s = shafts[m.b], u = frac(m.u + m.du * t), w = s.w * wsc * 0.5; const lx = m.lx * w * 2 + 0.05 * Math.sin(TAU * 0.13 * t + m.ph), lz = m.lz * w * 2 + 0.05 * Math.cos(TAU * 0.11 * t + m.ph); pp.setXYZ(i, s.a.x + s.dir.x * u + e1s[m.b].x * lx + e2s[m.b].x * lz, s.a.y + s.dir.y * u + e1s[m.b].y * lx + e2s[m.b].y * lz, s.a.z + s.dir.z * u + e1s[m.b].z * lx + e2s[m.b].z * lz); const a = Math.pow(Math.sin(Math.PI * u), 0.7) * sK * 0.9; cc.setXYZ(i, a, a * 0.95, a * 0.8); });
          pp.needsUpdate = true; cc.needsUpdate = true;
        }
        // mist: drifts 0.06 m/s toward +x (3 x as fast in a gust: a bounded sway, so a tween never jumps), thicker at the walls, never above 0.35 m near the marks
        const x0 = -7.0, x1 = 7.4, span = x1 - x0;
        for (const c of mistCards) {
          const drift = 0.06 * t + gust * 0.9 * Math.sin(TAU * t / 5.5 + c.i), xr = ((c.x - x0 + drift) % span + span) % span + x0, ex = Math.min(xr - x0, x1 - xr), edge = sm(ex / 1.3);
          let dm = 1e9; for (const [mx, mz] of MARKS) dm = Math.min(dm, Math.hypot(mx - xr, mz - c.z));
          const f = sm((dm - c.w * 0.5 - 2.2) / 0.7), he = lerp(0.3, c.h, f);
          c.m.position.x = xr; c.m.scale.y = he; c.m.visible = mistK > 0.01 && edge > 0.01; c.m.material.opacity = c.op * mistK * edge * (0.7 + 0.3 * f) * (1 - 0.1 * dim);
        }
        // curtains: sway 2 degrees at 0.2 Hz (5 in a gust), each strand its own phase
        const amp = (2 + 3 * gust) * DEG, pa = cuPos.array;
        for (const s of curt.strands) {
          const a1 = amp * Math.sin(TAU * 0.2 * t + s.ph), a2 = amp * 0.6 * Math.sin(TAU * 0.2 * t + s.ph2 + 1.3), ca = Math.tan(a1), cb = Math.tan(a2), dx = s.ax * ca - s.az * cb, dz = s.az * ca + s.ax * cb;
          for (let v = s.v0; v < s.v1; v++) { const h = cuH[v]; pa[v * 3] = cuBase[v * 3] + dx * h; pa[v * 3 + 2] = cuBase[v * 3 + 2] + dz * h; }
        }
        cuPos.needsUpdate = true;
        // leaves in the air: 6 at any time (12 more in a gust)
        caveLeaves.forEach(({ im, cnt }, kk) => {
          for (let i = 0; i < cnt; i++) {
            const L = i * 3 + kk, sp = L < 6 ? 1 : 1.7, T = (7 + 4 * hh(L * 3.1 + 1)) / sp, u = frac(t / T + hh(L * 5.7)), xs = -1.5 + 4 * hh(L * 7.3), xe = 3.6 + 3 * hh(L * 9.7), ze = -3.5 + 5.5 * hh(L * 11.3);
            const vis = L < 6 ? 1 : clamp(gust * 12 - (L - 6)), sc = vis * sm(u / 0.05) * sm((1 - u) / 0.1) * (1 + 0.2 * hh(L));
            tmpO.position.set(lerp(xs, xe, u) + 0.6 * Math.sin(TAU * (1.7 * u + hh(L))), lerp(6.4 + hh(L * 2.1), 0.05, Math.pow(u, 1.15)) + 0.12 * Math.sin(TAU * (3 * u + hh(L * 3))), lerp(-8.0, ze, u));
            tmpO.rotation.set(TAU * (1.3 * u + hh(L)), TAU * (0.9 * u + hh(L * 2)), TAU * 0.5 * Math.sin(TAU * u + L)); tmpO.scale.setScalar(Math.max(1e-4, sc)); tmpO.updateMatrix(); im.setMatrixAt(i, tmpO.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
        });
        // the 30 leaves streaming left to right across the gap
        gapLeaves.forEach(({ im, cnt }, kk) => {
          for (let i = 0; i < cnt; i++) {
            const L = i * 3 + kk, T = 4 + 2.4 * hh(L * 3.7 + 2) - 0.8 * gust, u = frac(t / T + hh(L * 5.3)), z = -10.5 - 7 * hh(L * 7.1);
            tmpO.position.set(lerp(-7.5, 8.5, u), 6.6 + 4.6 * hh(L * 11.7) + 1.3 * Math.sin(TAU * (1.4 * u + hh(L))) - 1.0 * u, z);
            tmpO.rotation.set(TAU * (2.1 * u + hh(L)), TAU * (1.6 * u + hh(L * 2)), TAU * 0.6 * Math.sin(TAU * 1.5 * u + L)); tmpO.scale.setScalar(1.6 * (0.8 + 0.5 * hh(L * 13.3))); tmpO.updateMatrix(); im.setMatrixAt(i, tmpO.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
        });
        for (const c of clouds) { const u = frac((t * c.v + c.ph * 60) / 60); c.m.position.set(-30 + 60 * u, c.y, c.z); c.m.visible = true; }
        // trickles slide 0.8 m/s, mist at the foot breathes
        trickles.forEach((tk, i) => { tk.m.material.map.offset.y = frac(0.8 * t / 0.5); tk.mi.scale.set(1 + 0.12 * Math.sin(TAU * 0.5 * t + i), 1 + 0.15 * Math.sin(TAU * 0.7 * t + i * 2), 1); });
        // 4 drips: a drop grows at the root tip, falls, and rings the puddle
        drips.forEach((d, i) => {
          const tc = ((t + d.ph * d.T) % d.T + d.T) % d.T, fd = Math.sqrt(2 * Math.max(0.1, d.y - 0.03) / 9.81), tf = 0.35 * d.T;
          let y = d.y - 0.02, sc = 0.0001, rs = 0.0001, ro = 0;
          if (tc < tf) { y = d.y - 0.02; sc = 0.15 + 0.85 * sm(tc / tf); }
          else if (tc < tf + fd) { const q = (tc - tf) / fd; y = lerp(d.y - 0.02, 0.03, q * q); sc = 1; }
          else if (tc < tf + fd + 0.9) { const q = (tc - tf - fd) / 0.9; rs = lerp(0.05, 0.5, 1 - (1 - q) * (1 - q)); ro = 0.7 * (1 - q); }
          d.drop.position.set(d.x, y, d.z); d.drop.scale.set(0.8 * sc, 1.4 * sc, 0.8 * sc); d.drop.visible = sc > 0.001; d.ring.scale.set(rs, rs, 1); d.ring.material.opacity = ro; d.ring.visible = ro > 0.005;
        });
        void WELL_C;
      },
    };
  },
};
