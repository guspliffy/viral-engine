// EGYPT EP05 "How old is the Sphinx really?" (19 Nov 2026), task T1: the Great Sphinx. Design: storyboards/series/ancient-aliens/05-sphinx/DESIGN.md
// sections 1, 2, 3 (all) and the 'rough' / 'wet' / 'flake' rows of its table. Bench: storyboards/series/ancient-aliens/05-sphinx/bench
// (make-eg-sphinx.mjs, eg-sphinx-sheet.png). Metres, ENGINE scale (0.40 engine m per real m; Spud 0.88).
//
//   sphinx   the Great Sphinx in DESIGN's WORLD frame: +x east (he looks east), +y up, -z north, +z south (his anatomical right), the
//            centreline z 0, the pit floor y 0, the rear x -14.60, the paw tips x +14.60. The director places it at x 0, y 0, z 0, rot 0
//            and the pit, the temple, the valley temple and the savanna line up with it (their own files use the same frame).
//            Bounds at rough 0: 29.20 (x) x 7.23 (y) x 7.60 (z): the nemes top y 7.23, the widest flank z +-3.80 at x -11.30.
//            Build: a body lofted from 9 stations (x, half width, back y; monotone cubic, 12 subdivisions per interval, 96 x 160+160
//            rows) whose cross-section is z = +-halfWidth sqrt(1 - t^4), y = t backY; 6 hard Member II ledges at B(k, x, z) =
//            b[k] + 0.006x + 0.003z + 0.025 sin(0.8x + 0.5z + 0.7k) (b 1.02 1.46 1.92 2.48 3.04 3.64, seams .14 .16 .19 .15 .21 .18) with
//            bell recesses between them (peaks .24 .38 .46 .31 .29 .17 m, x (0.85 + 0.15 sin(2.1x + 1.7z + k)), eased to 0 inside 0.32 m of
//            the back ridge and of the toe ends), Member I exposed at the base (up to B(0) - 0.07) with two benches 0.22 and 0.14 m
//            proud; the 6th ledge exists only where the back is higher than 3.64 (x > -0.1: the shoulders). Two paws 10.00 x 1.55 x 2.46
//            at z +-2.17 (gap 1.88), exponent 3.2 sections, 3 toe furrows each (0.046 wide, 0.095 deep, 1.42 long, at z -0.60 / 0 / +0.60
//            from the paw's middle line); the right tail (12-sided sweep, r 0.27 -> 0.16); the head as TWO meshes dropped 0.75 m onto
//            the shoulders (built at the design height, then y - 0.75; the panels win over DESIGN's ring table): (A) the face/skull, a
//            72 x 104 sphere of radii (1.20, 1.55, 1.30) centred (4.05, 5.60, 0), the front flattened to a gently curved plane at local
//            x 0.8, jaw narrowed to 0.8 below y -0.55, carved with a brow ridge (+0.10), two eye sockets (0.55 x 0.20, 0.18 deep, lid
//            bands), cheekbones (+0.06), a broken nose stump (0.30 wide, y +0.15..-0.25, 0.08 proud, lit top, dark underside, chipped
//            edge), lips at y -0.42 (upper +0.07, lower +0.09, 0.95 wide, mouth line 0.0375 deep, curled corners) and a chin (+0.05),
//            plus a short neck (r 0.7 under the chin to r 1.0 at the body, y 3.65..4.65); (B) the NEMES, a separate 0.10 thick shell
//            (outer 78 x 56 Surf off the skull by 0.08, an inner shell, front-edge skirts and a ragged hem): a cap over the top and back
//            of the skull that flares in a trapezoid (half width 1.25 at the temples y 6.25, 2.05 at the hem y 4.81), 9 stripe bands a
//            side (0.16 tall, alternately raised 0.03 and recessed and darker), a raised 0.08 band framing the face, and two lappets
//            (0.55 wide, 0.12 thick, x 5.2, z +-1.40, y 4.97..3.85, 7 bands) hanging to the chest. No ears, no beard. 1,350 pits (the largest 180 with a lit lip), 72 cracks, 85 bed strokes, 96
//            stains on body and paws, 180 pits and 8 cracks on the head, 4 staggered courses of repair casing at the paw bases and 3 on
//            the flanks below y 0.86 (blocks 0.31..0.56 x 0.14..0.23, 0.012 joints, bevels, 2 chips each). Every mark is a small piece
//            of real geometry glued to the surface by barycentric coordinates (it follows the surface when `rough` morphs it),
//            placed from the DESIGN section 1 hash of its index; no texture, no Math.random, no wall clock.
//            The haunch ellipsoids are buried in the loft (DESIGN says so) and only swell the nominal section; they have no mesh.
//   spec     stele true   the Dream Stele between the paws: red granite slab 0.25 x 1.44 x 0.88 (arched rise 0.22, bevel 0.034, foot
//                         0.48 x 0.08 x 1.08), bottom centre (6.93, 0.08, 0), east face carved: 0.06 border, 2 relief silhouettes
//                         0.14 x 0.23, 9 rows of unreadable cuts. false = none (the historical and imagined past).
//            flakeAt [5.40, 0.76, 3.22]   where the salt flake comes off (snapped to the south surface along z: the right paw's side).
//            rough 0, flake 0, wet 0   the start values of the params (below).
//   params   rough 0..1 (spec.rough)  0 = the weathered monument (stele, repair casing). 1 = the quarry state, 4,500 years ago: 65%
//                         of the flank curvature flattened into 6 quarry facets (3 a side), recess depth 15%, toe furrows 0.035 m guide
//                         cuts, face cuts 35% depth, fresh stone colours, the pits and stains replaced by 210 pick cuts (0.08..0.25 m),
//                         and a 3.25 m high uncut APRON along the north flank (x -14.6..-0.8, z -5.5..-1.2; it rises over rough
//                         0.20..1.0) that the pit's quarry cells join. The repair casing and the stele fade out over rough 0..0.20.
//            flake 0..1 (spec.flake)  12 pale chips (5-sided, 0.012..0.058 wide, 0.003..0.012 thick) leave flakeAt: chip i hides until
//                         flake > 0.018 i, q = clamp((flake - 0.018 i) / 0.78), +0.18 q m outward (+z), falls 0.90 q^2 m to the floor
//                         (y 0.012), spins (110..250 deg) q while it turns to lie flat; at 1 all 12 rest on the floor beside the paw.
//                         A pale scar shows on the paw once the first chip is gone.
//            wet 0..1 (spec.wet)  each bed blends to the wet palette by wet (0.75 + 0.25U); 32 runoff traces (0.015..0.06 wide, edge
//                         alpha 0.33 wet) run down head, chest and paws.
//            propState has no default for rough / flake / wet (start from spec.<name>, else 0): seed a tween with a dur-0 set at 0.
// GRIPS    (world frame, prop at the origin) pawR [9.0, 1.469, 2.17] and pawL [9.0, 1.469, -2.17] the flat middle of each paw top,
//          toeR [13.4, 1.145, 2.17] / toeL [13.4, 1.145, -2.17] the toe tops, noseTip [5.16, 5.55, 0] the broken nose.
// SOLID    userData.solid on the body, both paws, the skull, the nemes, the lappets, the apron and the stele; the paw tops are standable: paw top y =
//          1.55 at x 4.60, 1.50 at 8.20, 1.37 at 12.80, 1.05 at 14.10, 0.10 at 14.60 (smooth between), 1.23 either side of z +-2.17 (the
//          toe furrows are 0.095 deep and 0.046 wide: a hand rests on the top). The pit floor y 0 is the cast's floor. Stele top y 1.52.
//          The marks, the casing, the chips and the scar are not solid.
// Cost     about 105k triangles at rough 0 (DESIGN cap 116k), built in a fraction of a second; a param change re-lofts the morphed
//          surfaces (rough) or recolours them (wet), nothing is rebuilt per frame otherwise.
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const smax = (a, b, k) => { const h = clamp(0.5 + (0.5 * (a - b)) / k); return lerp(b, a, h) + k * h * (1 - h); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
// DESIGN section 1: the hash of a mark index i and a surface / layer channel k -> 0..1
function U(i, k = 0) {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
// channels: family * 8 + what (0 and 1 the place, 2 size, 3 angle, 4 strength, 5.. more)
const F = { PIT: 1, CRK: 2, BED: 3, STN: 4, CUT: 5, HPIT: 6, HCRK: 7, WET: 8, BLK: 9, CHP: 10, FLK: 11, BEDW: 12, STR: 13, TOE: 14 };
const R = (i, fam, ch) => U(i, fam * 8 + ch);

// ---- palette (DESIGN section 1), as linear colour triples
const C = {
  m1W: rgb("#AD8B65"), m1F: rgb("#CDB083"), m1E: rgb("#E1C498"),
  sW: rgb("#B48860"), sF: rgb("#D5AE79"), hW: rgb("#D8B17E"), hF: rgb("#E9CA96"), seam: rgb("#826344"),
  headW: rgb("#CFAB79"), headF: rgb("#E5C494"), facet: rgb("#E9C996"), cut: rgb("#957653"),
  pit: rgb("#72533B"), crack: rgb("#654B38"), stain: rgb("#9B6C4A"), scr: rgb("#EED3A8"), ink: rgb("#493526"),
  sand: rgb("#DEC198"), rep1: rgb("#DAB88E"), rep2: rgb("#C9A881"), mortar: rgb("#8D7055"),
  wetH: rgb("#746555"), wetS: rgb("#594A40"), wetHead: rgb("#887562"),
  water: rgb("#566B71"), waterEdge: rgb("#C4D9DE"), flake: rgb("#F3D5A5"),
  stele: rgb("#94776C"), relief: rgb("#624B43"), granite: rgb("#8F514D"), light: rgb("#B5746C"), grain: rgb("#573D42"),
};

// ---- the shared hard horizons (DESIGN section 2), duplicated verbatim in the site file
const BB = [1.02, 1.46, 1.92, 2.48, 3.04, 3.64], SEAM = [0.14, 0.16, 0.19, 0.15, 0.21, 0.18], PEAK = [0.24, 0.38, 0.46, 0.31, 0.29, 0.17];
const Bk = (k, x, z) => BB[k] + 0.006 * x + 0.003 * z + 0.025 * Math.sin(0.8 * x + 0.5 * z + 0.7 * k);

// monotone cubic interpolation (Fritsch-Carlson)
function pchip(xs, ys) {
  const n = xs.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
  const end = (h0, h1, d0, d1) => { let s = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1); if (Math.sign(s) !== Math.sign(d0)) s = 0; else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > 3 * Math.abs(d0)) s = 3 * d0; return s; };
  m[0] = n > 2 ? end(h[0], h[1], d[0], d[1]) : d[0]; m[n - 1] = n > 2 ? end(h[n - 2], h[n - 3], d[n - 2], d[n - 3]) : d[n - 2];
  for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
  return (x) => {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const t = clamp((x - xs[i]) / h[i]), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// the body loft
const ST = [[-14.6, 0, 0.6], [-13.3, 2.75, 2.5], [-11.3, 3.8, 3.42], [-7.0, 3.42, 3.17], [-2.0, 3.16, 3.3], [1.8, 3.28, 4.05], [3.6, 3.5, 4.66], [5.2, 2.86, 3.5], [6.1, 0, 0.3]];
const HW = pchip(ST.map((s) => s[0]), ST.map((s) => s[1])), BY = pchip(ST.map((s) => s[0]), ST.map((s) => s[2]));
const XS = []; for (let s = 0; s < 8; s++) for (let m = 0; m < 12; m++) XS.push(lerp(ST[s][0], ST[s + 1][0], m / 12)); XS.push(6.1);
const NU = XS.length - 1, NH = 66, NV = NH * 2;   // 96 x (66 rows up each side)
const xToU = (x, xs = XS) => { let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; } return lo + clamp((x - xs[lo]) / (xs[hi] - xs[lo] || 1)); };
const BENCH = (y) => lerp(lerp(0, 0.08, sst(0.34, 0.38, y)), 0.22, sst(0.62, 0.66, y));   // inset of Member I: bench A flush, bench B 0.08 in, the wall 0.22 in

// what the bed structure says at a nominal surface point: the inset d (m, rough 0), the zone, the bed id, the baked shade, the edge light
const BEDS = 15;
function bedInfo(x, y, z, o = {}) {
  const b0 = Bk(0, x, z), m1 = b0 - 0.07;
  let d = 0, zone = 0, bed = 0, shade = 1, edge = 0, seam = 0;
  if (y < m1) { d = BENCH(y); zone = 0; bed = 0; shade = 0.93 + 0.07 * sst(0, 0.5, y) - 0.05 * (d / 0.22); }
  else if (y < b0) { const u = sst(m1, b0, y); d = 0.22 * (1 - u); zone = 3; bed = 0; shade = 0.74 + 0.15 * u; }
  else {
    zone = 2; bed = 2;
    for (let k = 0; k < 6; k++) {
      const lo = Bk(k, x, z), top = lo + SEAM[k];
      if (y >= lo && y <= top) { zone = 1; bed = 2 * k + 1; d = 0; shade = 1.04; edge = Math.max(0, 1 - Math.abs(y - top) / 0.05); if (y - lo < 0.035) { seam = 1 - sst(0.01, 0.035, y - lo); shade = 0.9; } break; }
      const hi = k < 5 ? Bk(k + 1, x, z) : top + 0.95;
      if (y > top && y < hi) {
        const u = (y - top) / (hi - top), bell = Math.pow(Math.sin(Math.PI * u), 0.7);
        d = PEAK[k] * bell * (0.85 + 0.15 * Math.sin(2.1 * x + 1.7 * z + k)); zone = 2; bed = 2 * k + 2;
        shade = 1 - 0.3 * (d / 0.46) - 0.26 * sst(0.5, 1, u) + 0.05 * (1 - sst(0, 0.3, u)); if (k < 5) seam = sst(0.74, 0.97, u); break;
      }
    }
  }
  if (o.noRecess) d = 0;
  return { d, zone, bed, shade, edge, seam };
}
function rockColor(info, x, y, z, head = false) {
  let w, f, wc;
  if (head) { w = C.headW; f = C.headF; wc = C.wetHead; }
  else if (info.zone === 0) { w = C.m1W; f = C.m1F; wc = C.wetH; }
  else if (info.zone === 1) { w = C.hW; f = C.hF; wc = C.wetH; }
  else if (info.zone === 3) { w = mix3(C.m1W, C.seam, 0.45); f = mix3(C.m1F, C.seam, 0.35); wc = C.wetS; }
  else { w = C.sW; f = C.sF; wc = C.wetS; }
  if (info.edge > 0) { w = mix3(w, C.m1E, 0.45 * info.edge); f = mix3(f, C.m1E, 0.3 * info.edge); }
  if (info.seam > 0) { w = mix3(w, C.seam, 0.72 * info.seam); f = mix3(f, C.seam, 0.6 * info.seam); }
  const tone = 1 + 0.045 * Math.sin(2.3 * x + 1.1 * z + 0.7 * y) + 0.035 * Math.sin(5.1 * y + 0.9 * x + 2 * z) + 0.05 * (U(info.bed * 7 + 3, 5) - 0.5);
  const sandK = head ? 0 : 0.35 * (1 - sst(0, 0.16, y)), sh = info.shade * tone;
  w = mix3(w, C.sand, sandK); f = mix3(f, C.sand, sandK * 0.6);
  return { cw: mul3(w, sh), cf: mul3(f, sh), cwet: mul3(wc, sh * (head ? 1 : 0.95)), bed: head ? 14 : info.bed };
}
const bedU = (b) => 0.75 + 0.25 * U(b, 90);   // wet blend per bed

// ---------------------------------------------------------------------------------------------------------------------------------
// a lofted grid (u columns i, v rows j): rough 0 and rough 1 positions, vertex colours from three palettes (weathered, fresh, wet)
class Surf {
  constructor(nu, nv, kf = (r) => r, weld = false) {
    this.nu = nu; this.nv = nv; this.n = (nu + 1) * (nv + 1); this.kf = kf; this.weld = weld; this.k = NaN;
    const m3 = this.n * 3;
    this.p0 = new Float32Array(m3); this.p1 = new Float32Array(m3); this.pos = new Float32Array(m3); this.col = new Float32Array(m3);
    this.cw = new Float32Array(m3); this.cf = new Float32Array(m3); this.cwet = new Float32Array(m3); this.bed = new Uint8Array(this.n);
    this.geo = new THREE.BufferGeometry(); this.nor = null;
  }
  id(i, j) { return i * (this.nv + 1) + j; }
  set(i, j, a, b, c) {
    const q = this.id(i, j), o = q * 3; this.p0.set(a, o); this.p1.set(b ?? a, o);
    if (c) { this.cw.set(c.cw, o); this.cf.set(c.cf, o); this.cwet.set(c.cwet, o); this.bed[q] = c.bed; }
  }
  finish() {
    const idx = [], { nu, nv } = this;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = this.id(i, j), b = this.id(i + 1, j), c = a + 1, d = b + 1; idx.push(a, c, b, b, c, d); }
    this.geo.setIndex(idx);
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.n * 3), 3)); this.nor = this.geo.attributes.normal.array;
    return this;
  }
  update(r) {
    const k = this.kf(r); if (k === this.k) return false; this.k = k;
    const { p0, p1, pos } = this; for (let q = 0; q < pos.length; q++) pos[q] = p0[q] + (p1[q] - p0[q]) * k;
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals();
    if (this.weld) { const n = this.nor; for (let i = 0; i <= this.nu; i++) { const a = this.id(i, 0) * 3, b = this.id(i, this.nv) * 3; for (let c = 0; c < 3; c++) { const v = n[a + c] + n[b + c]; n[a + c] = n[b + c] = v / 2; } } this.geo.attributes.normal.needsUpdate = true; }
    this.geo.computeBoundingBox(); this.geo.computeBoundingSphere(); return true;
  }
  paint(r, wet) { paintInto(this.col, this, r, wet); this.geo.attributes.color.needsUpdate = true; }
}
function paintInto(col, S, r, wet) {
  const { cw, cf, cwet, bed } = S, fr = 0.8 * r, n = bed.length;
  for (let q = 0; q < n; q++) {
    const o = q * 3, k = wet * bedU(bed[q]);
    for (let c = 0; c < 3; c++) { const a = cw[o + c] + (cf[o + c] - cw[o + c]) * fr; col[o + c] = a + (cwet[o + c] - a) * k; }
  }
}
// a merged static mesh (no morph) that takes the same palettes
class Stat {
  constructor() { this.p = []; this.cw = []; this.cf = []; this.cwet = []; this.bed = []; this.idx = []; }
  v(x, y, z, c) { this.p.push(x, y, z); this.cw.push(...c.cw); this.cf.push(...c.cf); this.cwet.push(...c.cwet); this.bed.push(c.bed); return this.bed.length - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  finish() {
    const n = this.bed.length; this.cw = Float32Array.from(this.cw); this.cf = Float32Array.from(this.cf); this.cwet = Float32Array.from(this.cwet); this.bed = Uint8Array.from(this.bed);
    this.col = new Float32Array(n * 3); this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); this.geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3)); this.geo.setIndex(this.idx); this.geo.computeVertexNormals();
    return this;
  }
  paint(r, wet) { paintInto(this.col, this, r, wet); this.geo.attributes.color.needsUpdate = true; }
}

// ---- the body surface
function nomPt(x, t, hw, by) {
  const y = t * by; let zn = hw * Math.sqrt(Math.max(0, 1 - t ** 4));
  const dx = (x + 10.4) / 2.58, dy = (y - 1.35) / 1.31, q = 1 - dx * dx - dy * dy;   // the buried haunch swells the section a little where it reaches
  if (q > 0) zn = smax(zn, 2.44 + 1.11 * Math.sqrt(q), 0.05);
  return [y, zn];
}
const FACET_T = [0, 0.55, 0.9, 1];
function buildBody() {
  const S = new Surf(NU, NV);
  for (let i = 0; i <= NU; i++) {
    const x = XS[i], hw = HW(x), by = BY(x), slopeE = 1 - sst(0.35, 1.0, Math.abs(BY(x + 0.02) - BY(x - 0.02)) / 0.04), toe = slopeE * sst(0, 1.3, x + 14.6) * sst(0, 0.9, 6.1 - x);   // DESIGN says 0.32 m; the loft's end slopes are steep there and a 0.32 m ease tears the cuts into spikes
    for (let j = 0; j <= NV; j++) {
      const sg = j < NH ? -1 : 1, t = j <= NH ? j / NH : (NV - j) / NH;
      const [y, zn] = nomPt(x, t, hw, by), z = sg * zn;
      const info = bedInfo(x, y, z), ease = toe * sst(0, 0.32, zn), d0 = info.d * ease;
      let nz = (2 * zn) / (hw * hw + 1e-9), ny = (4 * t ** 3) / (by + 1e-9); const nl = Math.hypot(nz, ny) || 1; nz /= nl; ny /= nl;
      const p0 = [x, y - ny * d0, z - sg * nz * d0];
      let q = 0; while (q < 2 && t > FACET_T[q + 1]) q++;
      const A = nomPt(x, FACET_T[q], hw, by), Bq = nomPt(x, FACET_T[q + 1], hw, by), kk = (t - FACET_T[q]) / (FACET_T[q + 1] - FACET_T[q]);
      const yf = lerp(A[0], Bq[0], kk), zf = lerp(A[1], Bq[1], kk);
      const p1 = [x, lerp(y, yf, 0.65) - ny * 0.15 * d0, sg * lerp(zn, zf, 0.65) - sg * nz * 0.15 * d0];
      const c1 = rockColor({ ...info, shade: lerp(0.95, info.shade, slopeE), edge: info.edge * slopeE, seam: info.seam * slopeE }, x, y, z);
      if (slopeE < 0.999) { const c2 = rockColor({ zone: 2, bed: info.bed, shade: 0.97, edge: 0, seam: 0 }, x, y, z), k = 1 - slopeE; c1.cw = mix3(c1.cw, c2.cw, k); c1.cf = mix3(c1.cf, c2.cf, k); c1.cwet = mix3(c1.cwet, c2.cwet, k); }
      S.set(i, j, p0, p1, c1);
    }
  }
  return S.finish();
}

// ---- the paws
const PAW_X = [4.6, 8.2, 12.8, 14.1, 14.6], PAW_H = [1.55, 1.5, 1.37, 1.05, 0.1];
const hp = pchip(PAW_X, PAW_H);
const PAW_HW = 1.23, PAW_RC = 0.62, PAW_E = 3.2;
const hwp = (x) => (x <= 14.6 - PAW_RC ? PAW_HW : PAW_HW * Math.pow(Math.max(0, 1 - Math.pow((x - (14.6 - PAW_RC)) / PAW_RC, 2.4)), 1 / 2.4));
const PXS = []; for (let x = 4.6; x < 12.95; x += 0.25) PXS.push(x); for (let x = 13.0; x < 13.99; x += 0.1) PXS.push(x); for (let k = 0; k <= 12; k++) PXS.push(14.0 + (0.6 * k) / 12);
const PS = (() => {   // the section columns as s = z'/halfWidth: uniform, plus fine ones around the three furrows and up the flanks
  const a = new Set(); for (let k = 1; k < 20; k++) a.add(+(-1 + (2 * k) / 20).toFixed(5));
  for (const c of [-0.6 / PAW_HW, 0, 0.6 / PAW_HW]) for (const dd of [-0.04, -0.0187, 0, 0.0187, 0.04]) a.add(+(c + dd).toFixed(5));
  for (const e of [0.9, 0.95, 0.975, 0.99, 0.997]) { a.add(e); a.add(-e); }
  a.add(1); a.add(-1); return [...a].sort((p, q) => p - q);
})();
const FURROW = { x0: 13.12, x1: 14.54, w: 0.046 };
function buildPaw(sg) {
  const S = new Surf(PXS.length - 1, PS.length - 1);
  PXS.forEach((x, i) => {
    const h = hp(x), hw = hwp(x);
    PS.forEach((s, j) => {
      const as = Math.abs(s), yr = Math.pow(Math.max(0, 1 - Math.pow(as, PAW_E)), 1 / PAW_E), y = h * yr, zl = s * hw, z = sg * 2.17 + zl;
      // outward normal of |s|^e + (y/h)^e = 1 in the (z, y) plane
      let nz = Math.sign(s) * Math.pow(as, PAW_E - 1) / (hw + 1e-9), ny = Math.pow(yr, PAW_E - 1) / (h + 1e-9); const nl = Math.hypot(nz, ny) || 1; nz /= nl; ny /= nl;
      let fd = 0, fd1 = 0;
      for (const c of [-0.6, 0, 0.6]) { const dz = zl - c * (hw / PAW_HW); if (Math.abs(dz) < FURROW.w / 2) fd = Math.max(fd, Math.cos((Math.PI * dz) / FURROW.w) ** 2); }
      fd *= sst(0, 0.2, x - FURROW.x0) * sst(0, 0.2, FURROW.x1 - x);
      const d0 = fd * 0.095, d1 = fd * 0.035;
      const info = bedInfo(x, y, z, { noRecess: true });
      S.set(i, j, [x, y - ny * d0, z - nz * d0], [x, y - ny * d1, z - nz * d1], rockColor({ ...info, d: 0, shade: info.shade * (1 - 0.45 * fd) }, x, y, z));
    });
  });
  return S.finish();
}

// ---- the head (round 3): a skull sphere with a carved face, a short neck, and the nemes as its own shell with two lappets
const SKC = [4.05, 6.35, 0], SKR = [1.2, 1.55, 1.3], HDROP = 0.75;   // all head parts are built at the design height, then dropped by HDROP onto the shoulders
const HNU = 72, HNC = 104;   // skull grid: rows top to bottom (denser round the face), columns round (seam at the back, denser at the front)
const wRow = (v) => v + (0.5 * Math.sin(TAU * v)) / TAU, wCol = (t) => t + (0.65 * Math.sin(TAU * t)) / TAU;
const NOSE2 = [[-0.15, 0.15], [0.0, 0.17], [0.15, 0.14], [0.12, 0.0], [0.16, -0.12], [0.1, -0.25], [-0.02, -0.21], [-0.12, -0.26], [-0.16, -0.1], [-0.12, 0.03]];
function inPoly(pts, px, py) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; } return c; }
function polyDist(pts, px, py) { let m = 1e9; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [ax, ay] = pts[j], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)); m = Math.min(m, Math.hypot(px - ax - dx * t, py - ay - dy * t)); } return m; }
const hz = (a, b) => U(Math.floor(a * 71) * 97 + Math.floor(b * 71), 33);   // chip noise on a ~1.5 cm grid
// the face in metres from the skull's centre: yr up, z across -> { d: out along +x, dark, light, cut }
function face2(yr, z) {
  const az = Math.abs(z); let d = 0, dark = 0, light = 0, cut = 0;
  const bump = (e, h) => (e < 1 ? h * (1 - e) * (1 - e) : 0);
  if (yr > 0.27 && yr < 0.45) { const u = (yr - 0.29) / 0.14; if (u > 0 && u < 1) { const k = Math.sin(Math.PI * u) * sst(0.85, 0.6, az); d += 0.1 * k; light = Math.max(light, 0.4 * k); } }   // the brow ridge
  { const c = bump(((az - 0.65) / 0.22) ** 2 + (yr / 0.17) ** 2, 0.06); d += c; light = Math.max(light, c * 3.5); }   // cheekbones
  for (const sg of [-1, 1]) {   // eye sockets 0.55 x 0.20, 0.12 deep, a raised upper lid band 0.04 and a lower lid
    const dz = (z - sg * 0.48) / 0.275, dy = (yr - 0.22) / 0.1, e = dz * dz + dy * dy;
    if (e < 1) { const k = sst(0, 0.5, 1 - e); d -= 0.18 * k; dark = Math.max(dark, 0.9 * k); }
    const eu = dz * dz * 0.9 + ((yr - 0.325) / 0.035) ** 2; if (eu < 1) { d += 0.04 * (1 - eu); light = Math.max(light, 0.45 * (1 - eu)); }
    const el = dz * dz * 0.9 + ((yr - 0.11) / 0.03) ** 2; if (el < 1) { d += 0.025 * (1 - el); light = Math.max(light, 0.3 * (1 - el)); }
  }
  if (yr > -0.3 && yr < 0.22 && az < 0.22) {   // the broken nose: a rough stump 0.30 wide, 0.04 proud, chipped edges
    const dd = polyDist(NOSE2, z, yr) * (inPoly(NOSE2, z, yr) ? 1 : -1) + 0.012 * (hz(z, yr) - 0.5), k = sst(0, 0.015, dd);
    d += (0.08 + 0.015 * (hz(z + 3, yr) - 0.5)) * k; cut = Math.max(cut, 0.3 * k);
    light = Math.max(light, 0.9 * k * sst(0.0, 0.1, yr) * sst(0.14, 0.04, dd + 0.0 * yr) + 0.5 * k * sst(0.1, 0.17, yr));   // a lit top edge
    dark = Math.max(dark, 0.95 * k * sst(-0.04, -0.2, yr) + 0.15 * k);   // a dark underside
  }
  {   // lips at y -0.42, 0.95 wide: upper out 0.07, lower out 0.09, a mouth line 0.025 deep, the corners curling up
    const yc = -0.42 + 0.03 * (az / 0.475) ** 2, w = sst(0.52, 0.43, az);
    if (w > 0) {
      const uu = (yr - yc) / 0.08, ul = uu > 0 && uu < 1 ? Math.sin(Math.PI * uu) * (1 - 0.25 * Math.exp(-((az / 0.06) ** 2))) : 0, ll = (yc - yr) / 0.1, lo = ll > 0 && ll < 1 ? Math.sin(Math.PI * ll) : 0;
      d += (0.07 * ul + 0.09 * lo) * w; light = Math.max(light, (0.4 * ul + 0.45 * lo) * w);
      const g = Math.exp(-(((yr - yc) / 0.012) ** 2)); d -= 0.0375 * g * w; dark = Math.max(dark, 0.85 * g * w);
      const cn = Math.exp(-(((az - 0.47) / 0.035) ** 2 + ((yr - yc - 0.015) / 0.03) ** 2)); d -= 0.03 * cn; dark = Math.max(dark, 0.55 * cn);
    }
  }
  { const c = bump((z / 0.3) ** 2 + ((yr + 0.7) / 0.14) ** 2, 0.05); d += c; light = Math.max(light, c * 4); }   // the chin
  return { d, dark, light, cut };
}
function buildHead() {
  const S = new Surf(HNU, HNC, (r) => r, true);
  for (let i = 0; i <= HNU; i++) {
    const th = Math.PI * wRow(i / HNU), uy = Math.cos(th), sn = Math.sin(th);
    for (let j = 0; j <= HNC; j++) {
      const ph = TAU * wCol(j / HNC), ux = -sn * Math.cos(ph), uz = -sn * Math.sin(ph);
      const uxs = lerp(ux, 0.8 + (ux - 0.8) * 0.3, sst(0.72, 0.88, ux));   // the front flattened to a gently curved plane at local x 0.8
      const yr = uy * SKR[1], z0 = uz * SKR[2], jaw = 1 - 0.2 * sst(-0.4, -0.7, yr), z = z0 * jaw, y = SKC[1] + yr, xb = SKC[0] + SKR[0] * uxs;
      let d = 0, dark = 0, light = 0, cut = 0;
      if (ux > 0.5) { const f = face2(yr, z0), w = sst(0.5, 0.8, ux); d = f.d * w; dark = f.dark * w; light = f.light * w; cut = f.cut * w; }
      const c = rockColor({ zone: 2, bed: 14, shade: Math.max(0.25, 1 - 1.5 * dark + 0.5 * light + 0.04 * uy), edge: 0 }, xb, y, z, true);
      if (dark > 0.05) { c.cw = mix3(c.cw, C.ink, 0.4 * clamp(dark * 1.5)); c.cf = mix3(c.cf, C.ink, 0.35 * clamp(dark * 1.5)); }
      if (cut > 0) { c.cw = mix3(c.cw, C.cut, 0.55 * cut); c.cf = mix3(c.cf, C.cut, 0.4 * cut); }
      S.set(i, j, [xb + d, y - HDROP, z], [xb + d * 0.35, y - HDROP, z], c);
    }
  }
  return S.finish();
}

// ---- the nemes: an outer shell (a Surf, so it takes marks), an inner shell, the free edges, the hem and two lappets
const NEC = 4.05, NEY = 6.35, NNC = 56, NIC = 14, NEXP = 2.6;
const NROWS = (() => { const r = []; for (let k = 0; k < 24; k++) r.push(NEY + 1.63 * Math.sin(lerp(89 * DEG, Math.asin((7.0 - NEY) / 1.63), k / 24))); for (let k = 0; k <= 54; k++) r.push(lerp(7.0, 5.56, k / 54)); return r; })();
function nemesDims(y, inner) {
  const yr = y - NEY, Ys = inner ? 1.53 : 1.63, off = inner ? -0.02 : 0.08, rad = Math.sqrt(Math.max(0, 1 - (yr / Ys) ** 2)), rad7 = Math.sqrt(1 - ((7.0 - NEY) / Ys) ** 2);
  let a = 1.2 * rad + off, b = 1.3 * rad + off;
  if (y < 7.0) { const t = clamp((7.0 - y) / 1.44), b7 = 1.3 * rad7 + off, a7 = 1.2 * rad7 + off; b = Math.max(b, lerp(b7, inner ? 1.95 : 2.05, t)); a = Math.max(a, a7); }   // flares from half-width ~1.25 at the temples to 2.05 at y 5.55
  return { a, b };
}
const nemesTh0 = (y, row) => { let th = 0.66 * (1 - sst(7.1, 7.28, y)); if (th > 0.1) th += (U(row, 16 * 8 + 1) - 0.5) * 0.1; return th; };   // the face opening; ragged (chipped) free edge
const spw = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), p);
function nemesPt(y, s, row, inner, disp) {
  const { a, b } = nemesDims(y, inner), th = nemesTh0(y, row), sw = 0.6 * s + 0.4 * (1 - Math.cos(Math.PI * s)) / 2, al = th + sw * (TAU - 2 * th), p = 2 / NEXP;
  return [NEC + (a + disp) * spw(Math.cos(al), p), y, (b + disp) * spw(Math.sin(al), p)];
}
const bandOf = (y) => { if (y >= 7.0 || y < 5.55) return null; const k = Math.min(8, Math.floor((7.0 - y + 1e-6) / 0.16)), w = (7.0 - y) - 0.16 * k; return { k, raised: k % 2 === 0, e: Math.min(w, 0.16 - w) }; };
function buildNemes(st) {
  const nu = NROWS.length - 1, S = new Surf(nu, NNC, () => 0), HEMN = [];
  const cols = (band, row, s, x, y, z) => {
    let shade = 1, mixCut = 0, light = 0;
    if (band) { if (band.raised) { shade = 1.07; light = 0.22; } else { shade = 0.88; mixCut = 0.5; } }
    const fr = (s * NNC < 1.5 || s * NNC > NNC - 1.5) && y > 5.7 ? 1 : 0;   // the raised frame band along the cloth's front edge
    const c = rockColor({ zone: 2, bed: 14, shade: shade + 0.05 * fr, edge: 0 }, x, y, z, true);
    if (mixCut) { c.cw = mix3(c.cw, C.cut, mixCut); c.cf = mix3(c.cf, C.cut, mixCut * 0.8); c.cwet = mix3(c.cwet, mul3(C.wetS, 1), mixCut * 0.5); }
    if (light || fr) { const k = Math.max(light, fr * 0.3); c.cw = mix3(c.cw, C.facet, k); c.cf = mix3(c.cf, C.facet, k); }
    return c;
  };
  NROWS.forEach((y0, i) => {
    const band = bandOf(y0), disp = band && band.raised ? 0.03 * sst(0, 0.02, band.e + 0.0) : 0;
    for (let j = 0; j <= NNC; j++) {
      const s = j / NNC, fr = j <= 1 || j >= NNC - 1 ? 1 : 0;
      let y = y0; if (i === nu) y -= 0.05 * U(j, 16 * 8 + 2);   // a chipped hem
      const p = nemesPt(y, s, i, false, disp + 0.03 * fr * (j === 0 || j === NNC ? 0.4 : 1) * (y > 5.7 ? 1 : 0));
      S.set(i, j, [p[0], p[1] - HDROP, p[2]], null, cols(band, i, s, p[0], p[1], p[2]));
      if (i === nu) HEMN.push(p);
    }
  });
  S.finish();
  // inner shell, the free edges and the hem
  const IN = [], EDGE = [[], []];
  NROWS.forEach((y, i) => {
    IN.push([]);
    for (let c = 0; c <= NIC; c++) { const p = nemesPt(y, c / NIC, i, true, 0); IN[i].push(st.v(p[0], p[1], p[2], rockColor({ zone: 2, bed: 14, shade: 0.78, edge: 0 }, p[0], p[1], p[2], true))); }
  });
  const hint = (a, b, c, h) => { const P = st.p, ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2], bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2]; const n = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]; (n[0] * h[0] + n[1] * h[1] + n[2] * h[2] >= 0) ? st.tri(a, b, c) : st.tri(a, c, b); };
  for (let i = 0; i < nu; i++) for (let c = 0; c < NIC; c++) { const a = IN[i][c], b = IN[i + 1][c], d = IN[i][c + 1], e = IN[i + 1][c + 1]; st.tri(a, b, d); st.tri(b, e, d); const o = st.p; }
  // flip the inner shell to face inward: test one triangle against the axis and rewrite if needed
  {
    const n0 = st.idx.length - 6 * NIC * 0, P = st.p; let bad = 0, tot = 0;
    for (let q = 0; q < st.idx.length; q += 3) { const a = st.idx[q], b = st.idx[q + 1], c = st.idx[q + 2], ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2], bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2];
      const nx = ay * bz - az * by, nz = ax * by - ay * bx, cx = (P[a * 3] + P[b * 3] + P[c * 3]) / 3 - NEC, cz = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3; tot++; if (nx * cx + nz * cz > 0) bad++; }
    if (bad > tot / 2) for (let q = 0; q < st.idx.length; q += 3) { const t = st.idx[q + 1]; st.idx[q + 1] = st.idx[q + 2]; st.idx[q + 2] = t; }
  }
  for (const [ci, jc, sgn] of [[0, 0, 1], [NNC, NIC, -1]]) {   // free front edges: a skirt from the outer edge to the inner edge
    const col = (s, i) => { const p = nemesPt(NROWS[i], s, i, false, 0.0); return st.v(p[0], p[1], p[2], rockColor({ zone: 2, bed: 14, shade: 0.92, edge: 0 }, p[0], p[1], p[2], true)); };
    const O = NROWS.map((_, i) => col(ci / NNC, i));
    for (let i = 0; i < nu; i++) { const cx = st.p[O[i] * 3] - NEC, cz = st.p[O[i] * 3 + 2], h = [cx, 0, cz * 0.2 + sgn * 0.0]; hint(O[i], O[i + 1], IN[i][jc], [cx, 0, 0]); hint(O[i + 1], IN[i + 1][jc], IN[i][jc], [cx, 0, 0]); }
  }
  {   // the hem
    const O = HEMN.map((p) => st.v(p[0], p[1], p[2], rockColor({ zone: 2, bed: 14, shade: 0.9, edge: 0 }, p[0], p[1], p[2], true)));
    for (let j = 0; j < NNC; j++) { const ia = Math.floor(j / 4), ib = Math.min(NIC, Math.ceil((j + 1) / 4)); hint(O[j], O[j + 1], IN[nu][ia], [0, -1, 0]); if (ib !== ia) hint(O[j + 1], IN[nu][ib], IN[nu][ia], [0, -1, 0]); }
  }
  // lappets: 0.55 wide (z), 0.12 thick (x), from y 5.72 down to 4.6, 7 bands of 0.16 (raised 0.03 / recessed)
  for (const sg of [-1, 1]) {
    const zc = sg * 1.4, xc = 5.2, rows = [];
    for (let k = 0; k < 7; k++) { const yt = 5.72 - 0.16 * k, raised = k % 2 === 0; rows.push([yt - 0.003, raised], [yt - 0.157, raised]); }
    const front = rows.map(([y, raised], r) => { const c = [0]; const row = []; for (let q = 0; q <= 4; q++) { const z = zc + (q / 4 - 0.5) * 0.55, ybot = r === rows.length - 1 ? y - 0.04 * U(q + (sg > 0 ? 9 : 0), 16 * 8 + 3) : y, x = xc + 0.06 + (raised ? 0.03 : 0) - (q === 0 || q === 4 ? 0.012 : 0); const sh = raised ? 1.07 : 0.88, col = rockColor({ zone: 2, bed: 14, shade: sh, edge: 0 }, x, ybot, z, true); if (!raised) { col.cw = mix3(col.cw, C.cut, 0.5); col.cf = mix3(col.cf, C.cut, 0.4); } row.push(st.v(x, ybot, z, col)); } return row; });
    const back = rows.map(([y], r) => { const row = []; for (let q = 0; q <= 4; q++) { const z = zc + (q / 4 - 0.5) * 0.55, x = xc - 0.06; row.push(st.v(x, y, z, rockColor({ zone: 2, bed: 14, shade: 0.8, edge: 0 }, x, y, z, true))); } return row; });
    const cen = [xc, 5.1, zc];
    const H = (a, b, c) => hint(a, b, c, [0, 0, 0].map((_, k) => st.p[a * 3 + k] - cen[k]));
    for (let r = 0; r < rows.length - 1; r++) for (let q = 0; q < 4; q++) {
      H(front[r][q], front[r + 1][q], front[r][q + 1]); H(front[r + 1][q], front[r + 1][q + 1], front[r][q + 1]);
      H(back[r][q], back[r + 1][q], back[r][q + 1]); H(back[r + 1][q], back[r + 1][q + 1], back[r][q + 1]);
    }
    for (let r = 0; r < rows.length - 1; r++) for (const q of [0, 4]) { H(front[r][q], front[r + 1][q], back[r][q]); H(front[r + 1][q], back[r + 1][q], back[r][q]); }
    for (let q = 0; q < 4; q++) { H(front[0][q], front[0][q + 1], back[0][q]); H(front[0][q + 1], back[0][q + 1], back[0][q]); const l = rows.length - 1; H(front[l][q], front[l][q + 1], back[l][q]); H(front[l][q + 1], back[l][q + 1], back[l][q]); }
  }
  return S;
}
function buildNeck(st) {   // a short neck, r 1.0 where it meets the body, drawn in to r 0.7 under the chin so its top sits inside the skull
  const g = new THREE.CylinderGeometry(0.7, 1.0, 1.0, 28, 3, true), p = g.attributes.position, ix = g.index, ids = [];
  for (let i = 0; i < p.count; i++) { const x = 3.95 + p.getX(i), y = 4.9 + p.getY(i), z = p.getZ(i); ids.push(st.v(x, y, z, rockColor({ zone: 2, bed: 14, shade: 0.95, edge: 0 }, x, y, z, true))); }
  for (let i = 0; i < ix.count; i += 3) st.tri(ids[ix.getX(i)], ids[ix.getX(i + 1)], ids[ix.getX(i + 2)]);
}

function buildTail(st) {
  const pts = [[-13.66, 0.46, 1.82], [-12.85, 0.44, 2.89], [-11.35, 0.5, 3.51], [-9.4, 0.61, 3.48], [-8.66, 0.92, 3.24], [-9.12, 1.19, 3.27]].map((p) => new THREE.Vector3(...p));
  const cur = new THREE.CatmullRomCurve3(pts, false, "centripetal"), N = 56, M = 12, fr = cur.computeFrenetFrames(N, false), g = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = cur.getPointAt(u), rad = lerp(0.27, 0.16, u) * (u > 0.93 ? Math.sqrt(Math.max(0, 1 - (u - 0.93) / 0.07 * 0.9)) : 1); g.push([]);
    for (let m = 0; m <= M; m++) {
      const a = (m / M) * TAU, n = fr.normals[i], b = fr.binormals[i];
      const x = p.x + rad * (n.x * Math.cos(a) + b.x * Math.sin(a)), y = Math.max(0.01, p.y + rad * (n.y * Math.cos(a) + b.y * Math.sin(a))), z = Math.min(3.8, p.z + rad * (n.z * Math.cos(a) + b.z * Math.sin(a)));
      g[i].push(st.v(x, y, z, rockColor({ zone: 2, bed: 2, shade: 0.96 + 0.06 * Math.sin(a + 5 * u), edge: 0 }, x, y, z)));
    }
  }
  const flipT = true;
  for (let i = 0; i < N; i++) for (let m = 0; m < M; m++) { const a = g[i][m], b = g[i + 1][m], c = g[i][m + 1], d = g[i + 1][m + 1]; flipT ? (st.tri(a, b, c), st.tri(b, d, c)) : (st.tri(a, c, b), st.tri(b, c, d)); }
}

// ---- the apron of rough 1: a rounded uncut bench against the north flank, x -14.6..-0.8, z -5.5..-1.2, top 3.25
const APX = []; for (let k = 0; k <= 40; k++) APX.push(lerp(-14.6, -0.8, k / 40));
function buildApron() {
  const prof = []; const z0 = -5.5, z1 = -1.2, H = 3.25, rcn = 0.16;
  const add = (z, y) => prof.push([z, y]);
  for (let y = 0; y < H - rcn; y += 0.18) add(z0, y);
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); add(z0 + rcn - rcn * Math.cos(a), H - rcn + rcn * Math.sin(a)); }
  for (let z = z0 + rcn + 0.15; z < z1 - rcn; z += 0.15) add(z, H);
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); add(z1 - rcn + rcn * Math.sin(a), H - rcn + rcn * Math.cos(a)); }
  for (let y = H - rcn - 0.18; y > 0; y -= 0.18) add(z1, y);
  add(z1, 0);
  const NVA = prof.length - 1, S = new Surf(APX.length - 1, NVA, (r) => sst(0.2, 1, r));
  APX.forEach((x, i) => {
    const dEnd = Math.min(x + 14.6, -0.8 - x), sc = dEnd >= 0.5 ? 1 : Math.sqrt(Math.max(0, 1 - ((0.5 - dEnd) / 0.5) ** 2)), zc = (z0 + z1) / 2;
    prof.forEach(([z, y], j) => {
      const zz = zc + (z - zc) * sc, yy = y * sc, info = bedInfo(x, Math.max(0, yy), zz, { noRecess: true });
      S.set(i, j, [x, 0, zz], [x, yy, zz], rockColor({ ...info, shade: info.shade * (0.97 + 0.06 * U(i * 131 + j, 60)) }, x, yy, zz));
    });
  });
  return S.finish();
}

// ---------------------------------------------------------------------------------------------------------------------------------
// decals: small pieces of real geometry glued to a Surf by barycentric coordinates (follow the surface when it morphs)
function metric(S, gu, gv) {
  const i = clamp(Math.floor(gu), 0, S.nu - 1), j = clamp(Math.floor(gv), 0, S.nv - 1), p = S.p0, a = S.id(i, j) * 3, b = S.id(i + 1, j) * 3, c = S.id(i, j + 1) * 3;
  return [Math.max(1e-3, Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2])), Math.max(1e-3, Math.hypot(p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]))];
}
class Decals {
  constructor(alpha = true) { this.alpha = alpha; this.sid = []; this.b3 = []; this.w3 = []; this.off = []; this.col = []; this.idx = []; this.gu = []; this.gv = []; this.n = 0; }
  v(S, sidx, gu, gv, off, c) {
    gu = clamp(gu, 0, S.nu); gv = clamp(gv, 0, S.nv);
    const i = Math.min(S.nu - 1, Math.floor(gu)), j = Math.min(S.nv - 1, Math.floor(gv)), a = gu - i, b = gv - j, A = S.id(i, j), Bv = S.id(i + 1, j), Cc = A + 1, D = Bv + 1;
    if (a + b <= 1) { this.b3.push(A, Bv, Cc); this.w3.push(1 - a - b, a, b); } else { this.b3.push(Bv, D, Cc); this.w3.push(1 - b, a + b - 1, 1 - a); }
    this.sid.push(sidx); this.gu.push(gu); this.gv.push(gv); this.off.push(off); this.col.push(...(this.alpha ? c : [c[0], c[1], c[2]])); return this.n++;
  }
  // wound so the outward side faces out whatever order the mark was drawn in (the grids are all wound the same way: clockwise in (u, v) is outward)
  tri(a, b, c) { const g = this.gu, h = this.gv, ar = (g[b] - g[a]) * (h[c] - h[a]) - (g[c] - g[a]) * (h[b] - h[a]); ar > 0 ? this.idx.push(a, c, b) : this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.tri(a, b, c); this.tri(b, d, c); }
  finish() {
    this.b3 = Uint32Array.from(this.b3); this.w3 = Float32Array.from(this.w3); this.sid = Uint8Array.from(this.sid); this.off = Float32Array.from(this.off);
    this.geo = new THREE.BufferGeometry(); this.pos = new Float32Array(this.n * 3); this.nrm = new Float32Array(this.n * 3);
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute("normal", new THREE.BufferAttribute(this.nrm, 3));
    this.geo.setAttribute("color", new THREE.Float32BufferAttribute(this.col, this.alpha ? 4 : 3)); this.geo.setIndex(this.idx); return this;
  }
  update(surfs, scale = 1, sink = 0) {
    const { b3, w3, sid, off, pos, nrm } = this;
    for (let v = 0; v < this.n; v++) {
      const S = surfs[sid[v]], sp = S.pos, sn = S.nor, a = b3[v * 3] * 3, b = b3[v * 3 + 1] * 3, c = b3[v * 3 + 2] * 3, w0 = w3[v * 3], w1 = w3[v * 3 + 1], w2 = w3[v * 3 + 2];
      const nx = w0 * sn[a] + w1 * sn[b] + w2 * sn[c], ny = w0 * sn[a + 1] + w1 * sn[b + 1] + w2 * sn[c + 1], nz = w0 * sn[a + 2] + w1 * sn[b + 2] + w2 * sn[c + 2], l = Math.hypot(nx, ny, nz) || 1, o = off[v] * scale - sink;
      pos[v * 3] = w0 * sp[a] + w1 * sp[b] + w2 * sp[c] + (nx / l) * o; pos[v * 3 + 1] = w0 * sp[a + 1] + w1 * sp[b + 1] + w2 * sp[c + 1] + (ny / l) * o; pos[v * 3 + 2] = w0 * sp[a + 2] + w1 * sp[b + 2] + w2 * sp[c + 2] + (nz / l) * o;
      nrm[v * 3] = nx / l; nrm[v * 3 + 1] = ny / l; nrm[v * 3 + 2] = nz / l;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.normal.needsUpdate = true; this.geo.computeBoundingSphere();
  }
}
// a mark's local frame: (ma, mb) metres along u and v from (gu, gv), turned by ang
const rot2 = (a, b, ang) => [a * Math.cos(ang) - b * Math.sin(ang), a * Math.sin(ang) + b * Math.cos(ang)];
function mark(D, S, si, gu, gv) {
  const m = metric(S, gu, gv);
  return { at: (a, b, off, c, ang = 0) => { const [x, y] = rot2(a, b, ang); return D.v(S, si, gu + x / m[0], gv + y / m[1], off, c); }, m };
}
const rgba = (c, a) => [c[0], c[1], c[2], a];

// ---- body, paw, head and apron marks
function addPit(D, S, si, gu, gv, i, fam, dia, deep, a) {
  const k = mark(D, S, si, gu, gv), n = dia < 0.03 ? 5 : 7, r = dia / 2, c0 = rgba(C.pit, a), c1 = rgba(C.pit, a * 0.3), ctr = k.at(0, 0, 0.0012 + 0.001 * U(i, fam * 8 + 6), c0), ring = [];
  for (let j = 0; j < n; j++) { const th = (j / n) * TAU + 0.5 * U(i * 7 + j, fam * 8 + 3), rr = r * (0.7 + 0.5 * U(i * 7 + j, fam * 8 + 5)); ring.push(k.at(Math.cos(th) * rr, Math.sin(th) * rr, 0.003, c1)); }
  for (let j = 0; j < n; j++) D.tri(ctr, ring[j], ring[(j + 1) % n]);
  if (deep) {   // a lit lip on the lower side of the largest pits
    const lip = [], lo = rgba(C.scr, 0.55 * a);
    for (let j = 0; j <= 4; j++) { const th = Math.PI * (1.1 + 0.8 * (j / 4)), c = Math.cos(th), s = Math.sin(th); lip.push([k.at(c * r * 0.95, s * r * 0.95, 0.0035, lo), k.at(c * r * 1.4, s * r * 1.4, 0.003, rgba(C.scr, 0))]); }
    for (let j = 0; j < 4; j++) D.quad(lip[j][0], lip[j + 1][0], lip[j][1], lip[j + 1][1]);
  }
}
// a big pit (0.04..0.12 m): a dark hollow baked into the face with a lit lip on its lower side
function addBigPit(D, S, si, gu, gv, i, dia, dir, a) {
  const k = mark(D, S, si, gu, gv), r = dia / 2, n = 6, dark = rgba(mix3(C.pit, C.ink, 0.7), a), edge = rgba(mix3(C.pit, C.ink, 0.4), a * 0.5);
  const ctr = k.at(0, -dir * r * 0.1, 0.0014, dark), ring = [];
  for (let j = 0; j < n; j++) { const th = (j / n) * TAU + 0.6 * U(i * 7 + j, 120), rr = r * (0.78 + 0.45 * U(i * 7 + j, 121)); ring.push(k.at(Math.cos(th) * rr, Math.sin(th) * rr, 0.003, edge)); }
  for (let j = 0; j < n; j++) D.tri(ctr, ring[j], ring[(j + 1) % n]);
  const lip = []; for (let j = 0; j <= 3; j++) { const ph = (j / 3) * Math.PI, c = Math.cos(ph), sn = Math.sin(ph); lip.push([k.at(c * r * 0.92, dir * sn * r * 0.92, 0.0036, rgba(C.scr, 0.8)), k.at(c * r * (1.0 + 0.55 * sn), dir * sn * r * (1.0 + 0.55 * sn), 0.003, rgba(C.scr, 0.05))]); }
  for (let j = 0; j < 3; j++) D.quad(lip[j][0], lip[j + 1][0], lip[j][1], lip[j + 1][1]);
}
function addRibbon(D, S, si, gu, gv, pts, wid, off, cols) {   // pts: [[a, b]...] metres; wid per point; cols per point rgba
  const k = mark(D, S, si, gu, gv), L = [], Rr = [];
  for (let q = 0; q < pts.length; q++) {
    const p0 = pts[Math.max(0, q - 1)], p1 = pts[Math.min(pts.length - 1, q + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = wid[q] / 2;
    L.push(k.at(pts[q][0] + nx * w, pts[q][1] + ny * w, off, cols[q])); Rr.push(k.at(pts[q][0] - nx * w, pts[q][1] - ny * w, off, cols[q]));
  }
  for (let q = 0; q < pts.length - 1; q++) D.quad(L[q], L[q + 1], Rr[q], Rr[q + 1]);
}
function polyline(len, n, ang, bend, i, fam) {
  const pts = [[0, 0]]; let a = ang;
  for (let q = 1; q <= n; q++) { a += (U(i * 11 + q, fam * 8 + 5) - 0.5) * bend; pts.push([pts[q - 1][0] + (len / n) * Math.cos(a), pts[q - 1][1] + (len / n) * Math.sin(a)]); }
  return pts;
}
function buildMarks(surfs) {
  const body = surfs.body, pawR = surfs.pawR, pawL = surfs.pawL, head = surfs.head, apron = surfs.apron, nemes = surfs.nemes;
  const A = new Decals(), Sx = new Decals(), Bd = new Decals(), Wt = new Decals();   // A: pits + stains (fade out with rough), Sx: cracks + bed strokes, Bd: tool cuts (fade in), Wt: runoff
  const si = { body: 0, pawR: 1, pawL: 2, head: 3, apron: 4, nemes: 5 };
  const pick = (i, fam) => { const q = R(i, fam, 7); return q < 0.78 ? ["body", body] : q < 0.89 ? ["pawR", pawR] : ["pawL", pawL]; };
  const place = (nm, S, i, fam) => nm === "body" ? [xToU(lerp(-13.4, 5.4, R(i, fam, 0))), lerp(3, NV - 3, R(i, fam, 1))] : [lerp(2, S.nu - 2, R(i, fam, 0)), lerp(1, S.nv - 1, R(i, fam, 1))];
  // pits
  const dia = []; for (let i = 0; i < 1350; i++) dia.push(0.012 + 0.056 * Math.pow(R(i, F.PIT, 2), 1.6));
  const thr = [...dia].sort((a, b) => b - a)[179];
  for (let i = 0; i < 1350; i++) { const [nm, S] = pick(i, F.PIT), [gu, gv] = place(nm, S, i, F.PIT); addPit(A, S, si[nm], gu, gv, i, F.PIT, dia[i], dia[i] >= thr, 0.3 + 0.6 * R(i, F.PIT, 4)); }
  // big pits, clustered in the soft beds: 70 clusters of 12, dia 0.04..0.12 m
  for (let c = 0; c < 70; c++) {
    const onB = R(c, 15, 7) < 0.82, S = onB ? body : R(c, 15, 6) < 0.5 ? pawR : pawL, nm = onB ? "body" : S === pawR ? "pawR" : "pawL"; let g0 = null;
    for (let t = 0; t < 14 && !g0; t++) {
      const gu = onB ? xToU(lerp(-13, 5, R(c * 14 + t, 15, 0))) : lerp(3, S.nu - 3, R(c * 14 + t, 15, 0)), gv = lerp(4, S.nv - 4, R(c * 14 + t, 15, 1)), b = S.bed[S.id(Math.round(gu), Math.round(gv))];
      if (b >= 2 && b < 14 && b % 2 === 0) g0 = [gu, gv];
    }
    if (!g0) continue;
    const m = metric(S, g0[0], g0[1]);
    for (let q = 0; q < 12; q++) {
      const i = c * 12 + q, gu = g0[0] + ((R(i, 15, 2) - 0.5) * 1.5) / m[0], gv = clamp(g0[1] + ((R(i, 15, 3) - 0.5) * 0.5) / m[1], 3, S.nv - 3), dia = 0.045 + 0.075 * Math.pow(R(i, 15, 4), 1.3);
      addBigPit(A, S, si[nm], gu, gv, i, dia, gv < S.nv / 2 ? -1 : 1, 0.7 + 0.28 * R(i, 15, 5));
    }
  }
  // cracks (72, 0.10..0.74 m, 2..5 segments)
  for (let i = 0; i < 72; i++) {
    const [nm, S] = pick(i, F.CRK), [gu, gv] = place(nm, S, i, F.CRK), n = 2 + Math.floor(4 * R(i, F.CRK, 6) * 0.999), len = 0.1 + 0.64 * Math.pow(R(i, F.CRK, 2), 1.4), ang = R(i, F.CRK, 3) * Math.PI;
    const pts = polyline(len, n, ang, 1.1, i, F.CRK), w0 = 0.007 + 0.009 * R(i, F.CRK, 4), a = 0.3 + 0.6 * R(i, F.CRK, 4);
    addRibbon(Sx, S, si[nm], gu, gv, pts, pts.map((_, q) => w0 * (1 - 0.7 * q / n)), 0.0022, pts.map((_, q) => rgba(C.crack, a * (1 - 0.35 * q / n))));
  }
  // bed strokes (85, 0.08..0.48 m): along the bed, a dark line with a pale one under it
  for (let i = 0; i < 85; i++) {
    const [nm, S] = pick(i, F.BED), [gu, gv] = place(nm, S, i, F.BED), len = 0.08 + 0.4 * R(i, F.BED, 2), a = 0.3 + 0.6 * R(i, F.BED, 4), w = 0.008 + 0.012 * R(i, F.BED, 5);
    const pts = [[0, 0], [len * 0.35, 0.004 * (R(i, F.BED, 6) - 0.5)], [len * 0.7, 0.005 * (R(i, F.BED, 7) - 0.5)], [len, 0]];
    addRibbon(Sx, S, si[nm], gu, gv, pts, [w * 0.5, w, w, w * 0.4], 0.0018, pts.map(() => rgba(C.seam, a)));
    addRibbon(Sx, S, si[nm], gu, gv, pts.map((p) => [p[0], p[1] - w * 1.1]), [w * 0.4, w * 0.6, w * 0.6, w * 0.3], 0.0016, pts.map(() => rgba(C.scr, a * 0.7)));
  }
  // stains (96, 0.09..0.44 high, 0.015..0.075 wide): a streak running down the face, fading toward its foot
  for (let i = 0; i < 96; i++) {
    const [nm, S] = pick(i, F.STN), [gu, gv0] = place(nm, S, i, F.STN), h = 0.09 + 0.35 * R(i, F.STN, 2), w = 0.015 + 0.06 * R(i, F.STN, 3), a = 0.3 + 0.6 * R(i, F.STN, 4), mid = S.nv / 2;
    const dir = gv0 < mid ? -1 : 1, gv = clamp(gv0, 6, S.nv - 6), k = mark(A, S, si[nm], gu, gv);
    const rows = [0, 1, 2, 3].map((q) => { const f = q / 3, ww = w * (1 - 0.55 * f) / 2, al = a * (1 - f) * 0.85 + 0.0, b = dir * h * f; return [k.at(-ww, b, 0.0014, rgba(C.stain, al)), k.at(ww, b, 0.0014, rgba(C.stain, al))]; });
    for (let q = 0; q < 3; q++) A.quad(rows[q][0], rows[q][1], rows[q + 1][0], rows[q + 1][1]);
  }
  // head (below the headcloth, off the face): 120 pits (0.009..0.030), 6 cracks (0.09..0.23); the nemes: 200 pits (0.010..0.040), 8 cracks (scaled down)
  for (let i = 0; i < 120; i++) {
    const gu = lerp(22, 66, R(i, F.HPIT, 0)), gv = lerp(2, HNC - 2, R(i, F.HPIT, 1)), d = 0.009 + 0.021 * R(i, F.HPIT, 2);
    if (gv > HNC * 0.5 - 18 && gv < HNC * 0.5 + 18 && gu < 54) continue;   // keep the face's eyes, nose and mouth clear
    addPit(A, head, si.head, gu, gv, i + 5000, F.HPIT, d, false, 0.3 + 0.6 * R(i, F.HPIT, 4));
  }
  for (let i = 0; i < 200; i++) addPit(A, nemes, si.nemes, lerp(4, nemes.nu - 2, R(i, F.HPIT, 5)), lerp(2, nemes.nv - 2, R(i, F.HPIT, 6)), i + 7000, F.HPIT, 0.01 + 0.03 * R(i, F.HPIT, 7), false, 0.3 + 0.6 * R(i, F.HPIT, 3));
  for (let i = 0; i < 14; i++) {
    const hd = i < 6, S = hd ? head : nemes, nm = hd ? "head" : "nemes", gu = hd ? lerp(54, 66, R(i, F.HCRK, 0)) : lerp(8, nemes.nu - 8, R(i, F.HCRK, 0)), gv = hd ? lerp(4, HNC * 0.3, R(i, F.HCRK, 1)) + (i % 2 ? HNC * 0.5 : 0) : lerp(4, nemes.nv - 4, R(i, F.HCRK, 1)), len = 0.09 + 0.14 * R(i, F.HCRK, 2), n = 2 + (i % 3);
    const pts = polyline(len, n, R(i, F.HCRK, 3) * Math.PI, 1.0, i, F.HCRK), w0 = 0.006 + 0.004 * R(i, F.HCRK, 4);
    addRibbon(Sx, S, si[nm], gu, gv, pts, pts.map((_, q) => w0 * (1 - 0.6 * q / n)), 0.0022, pts.map(() => rgba(C.crack, 0.6)));
  }
  // 210 pick cuts of the quarry (rough 1): 170 on the body, 40 on the apron, slanted 65..82 deg
  for (let i = 0; i < 210; i++) {
    const onA = i >= 170, S = onA ? apron : body, nm = onA ? "apron" : "body", len = 0.08 + 0.17 * R(i, F.CUT, 2), ang = (65 + 17 * R(i, F.CUT, 3)) * DEG * (R(i, F.CUT, 6) < 0.5 ? 1 : -1) + Math.PI / 2, w = 0.012 + 0.008 * R(i, F.CUT, 5), a = 0.4 + 0.5 * R(i, F.CUT, 4);
    const gu = onA ? lerp(3, S.nu - 3, R(i, F.CUT, 0)) : xToU(lerp(-13.4, 5.4, R(i, F.CUT, 0))), gv = onA ? lerp(4, S.nv - 4, R(i, F.CUT, 1)) : lerp(4, NV - 4, R(i, F.CUT, 1));
    const pts = [[0, 0], [len * 0.5 * Math.cos(ang), len * 0.5 * Math.sin(ang)], [len * Math.cos(ang), len * Math.sin(ang)]];
    addRibbon(Bd, S, si[nm], gu, gv, pts, [w * 0.4, w, w * 0.4], 0.002, pts.map(() => rgba(C.ink, a)));
    addRibbon(Bd, S, si[nm], gu, gv, pts.map((p) => [p[0] + w * 0.9, p[1]]), [w * 0.3, w * 0.5, w * 0.3], 0.0016, pts.map(() => rgba(C.scr, a * 0.6)));
  }
  // 32 runoff traces (wet): head 10, body 12, paws 10, along the steepest descent
  for (let i = 0; i < 32; i++) {
    const grp = i < 10 ? "head" : i < 22 ? "body" : i % 2 ? "pawR" : "pawL", S = surfs[grp], w = 0.015 + 0.045 * R(i, F.WET, 2), n = 12;
    let gu, gv, dir, len;
    if (grp === "head") { gu = lerp(6, 30, R(i, F.WET, 0)); gv = lerp(HNC * 0.2, HNC * 0.8, R(i, F.WET, 1)); dir = 1; len = 0.5 + 0.9 * R(i, F.WET, 3); }
    else if (grp === "body") { gu = xToU(lerp(1.8, 5.1, R(i, F.WET, 0))); const sd = R(i, F.WET, 7) < 0.5 ? -1 : 1; gv = NH + sd * lerp(8, 34, R(i, F.WET, 1)); dir = sd < 0 ? -1 : 1; len = 0.7 + 1.5 * R(i, F.WET, 3); }
    else { gu = lerp(3, S.nu - 3, R(i, F.WET, 0)); const sd = R(i, F.WET, 7) < 0.5 ? -1 : 1; gv = S.nv / 2 + sd * lerp(2, 9, R(i, F.WET, 1)); dir = sd; len = 0.4 + 0.8 * R(i, F.WET, 3); }
    const k = mark(Wt, S, si[grp], gu, gv), sw = (R(i, F.WET, 4) - 0.5) * 0.6, pts = [];
    for (let q = 0; q <= n; q++) { const f = q / n; pts.push([sw * f * len * 0.25 + 0.015 * Math.sin(5 * f + i), dir * len * f]); }
    // the stroke runs along v (rows) on the body and paws; on the head the rows are y, so it runs along u
    const ps = grp === "head" ? pts.map((p) => [p[1], p[0]]) : pts;
    addRibbon(Wt, S, si[grp], gu, gv, ps, ps.map((_, q) => w * (1 - 0.5 * q / n)), 0.0026, ps.map((_, q) => rgba(C.water, 0.42 * (1 - 0.6 * q / n))));
    for (const e of [-1, 1]) addRibbon(Wt, S, si[grp], gu, gv, ps.map((p) => (grp === "head" ? [p[0], p[1] + e * w * 0.45] : [p[0] + e * w * 0.45, p[1]])), ps.map(() => Math.max(0.004, w * 0.16)), 0.0032, ps.map((_, q) => rgba(C.waterEdge, 0.33 * (1 - 0.5 * q / n))));
  }
  return { A, Sx, Bd, Wt };
}

// ---- repair casing: courses of small blocks on the paw bases (4) and the flanks (3), below y 0.86
function rowAtY(S, i, y, side) {   // fractional row of height y on one flank of a paw station
  const nv = S.nv, p = S.p0; let lo = side > 0 ? nv >> 1 : 0, hi = side > 0 ? nv : (nv >> 1);
  const ys = (j) => p[S.id(i, j) * 3 + 1];
  if (side > 0) { for (let j = lo; j < hi; j++) if (ys(j + 1) <= y) return j + (ys(j) - y) / (ys(j) - ys(j + 1) + 1e-9); return hi; }
  for (let j = hi; j > lo; j--) if (ys(j - 1) <= y) return j - (ys(j) - y) / (ys(j) - ys(j - 1) + 1e-9); return lo;
}
function buildCasing(surfs) {
  const D = new Decals(false), si = { body: 0, pawR: 1, pawL: 2 }, mortar = rgba(mul3(C.mortar, 0.7), 1);
  let bi = 0;
  const run = (nm, S, side, x0, x1, heights, gvOf, xs, fam) => {
    let y = 0.03;
    heights.forEach((h, ci) => {
      const ya = y, yb = y + h; y = yb;
      const gvAt = (x, yy) => { const u = xToU(x, xs), i0 = Math.min(S.nu - 1, Math.floor(u)), f = u - i0; return nm === "body" ? gvOf(x, yy) : lerp(rowAtY(S, i0, yy, side), rowAtY(S, i0 + 1, yy, side), f); };
      const V = (x, yy, off, c) => D.v(S, si[nm], xToU(x, xs), gvAt(x, yy), off, c);
      // the mortar bed of the course
      const nSeg = Math.ceil((x1 - x0) / 0.12), strip = [];
      for (let s = 0; s <= nSeg; s++) { const x = lerp(x0, x1, s / nSeg); strip.push([V(x, ya, 0.0025, mortar), V(x, yb, 0.0025, mortar)]); }
      for (let s = 0; s < nSeg; s++) D.quad(strip[s][0], strip[s + 1][0], strip[s][1], strip[s + 1][1]);
      let x = x0 - 0.35 * R(ci * 31 + (side > 0 ? 7 : 0) + si[nm] * 13, F.BLK, 2);
      while (x < x1) {
        const L = 0.25 + 0.37 * Math.pow(R(bi, F.BLK, 0), 1.2), gap = 0.01 + 0.02 * R(bi, F.BLK, 6), xa = Math.max(x0, x) + gap / 2, xb = Math.min(x1, x + L) - gap / 2;
        if (xb - xa > 0.12) {
          const jy = (R(bi, F.BLK, 1) - 0.5) * 0.024, hh = h * (0.82 + 0.22 * R(bi, F.BLK, 7)), ya2 = ya + jy + 0.005, yb2 = ya + hh + jy - 0.005, depth = 0.006 + 0.024 * R(bi, F.BLK, 2);
          const cn = [[xa, ya2], [xb, ya2], [xb, yb2], [xa, yb2]], P = [];
          cn.forEach(([cx, cy], c) => {   // a corner may be broken off (a diagonal chip), points kept in counter-clockwise order
            if (R(bi * 4 + c, F.BLK, 4) < 0.4) {
              const k = Math.min(0.015 + 0.04 * R(bi * 4 + c, F.BLK, 5), (xb - xa) * 0.3, (yb2 - ya2) * 0.45);
              if (c === 0) P.push([cx, cy + k], [cx + k, cy]); else if (c === 1) P.push([cx - k, cy], [cx, cy + k]); else if (c === 2) P.push([cx, cy - k], [cx - k, cy]); else P.push([cx + k, cy], [cx, cy - k]);
            } else P.push([cx, cy]);
          });
          const base = mix3(mix3(C.rep1, C.rep2, R(bi, F.BLK, 3)), C.sW, 0.22 * R(bi, F.BLK, 4)), sh = 0.9 + 0.2 * R(bi, F.BLK, 5), mc = P.reduce((q, p2) => [q[0] + p2[0] / P.length, q[1] + p2[1] / P.length], [0, 0]), bv = 0.012 + 0.01 * R(bi, F.BLK, 6);
          const colAt = (px, py, k) => { const g = (0.9 + 0.16 * clamp((py - ya2) / (yb2 - ya2))) * sh * (1 + 0.07 * (U(Math.floor(px * 70) * 131 + Math.floor(py * 70), 41) - 0.5)); return rgba(mul3(base, g * k), 1); };
          const o = P.map(([px, py]) => V(px, py, 0.003, colAt(px, py, 0.72)));
          const q2 = P.map(([px, py]) => { const l = Math.hypot(mc[0] - px, mc[1] - py) || 1, ex = px + ((mc[0] - px) / l) * bv, ey = py + ((mc[1] - py) / l) * bv; return V(ex, ey, depth, colAt(ex, ey, 1)); });
          for (let k = 1; k < q2.length - 1; k++) D.tri(q2[0], q2[k], q2[k + 1]);
          for (let k = 0; k < P.length; k++) { const j = (k + 1) % P.length; D.quad(o[k], o[j], q2[k], q2[j]); }
        }
        x += L; bi++;
      }
    });
  };
  const bodyGv = (sg) => (x, yy) => { const t = clamp(yy / BY(x), 0, 1); return sg < 0 ? NH * t : NV - NH * t; };
  for (const sg of [-1, 1]) run("body", surfs.body, sg, -13.4, 4.2, [0.2, 0.19, 0.17], bodyGv(sg), XS);
  for (const [nm, S] of [["pawR", surfs.pawR], ["pawL", surfs.pawL]]) for (const side of [-1, 1]) run(nm, S, side, 5.3, 14.05, [0.2, 0.19, 0.18, 0.17], null, PXS);
  return D;
}

// ---- the Dream Stele (static, world coordinates)
function buildStele() {
  const st = new Stat(), W = 0.44, HY0 = 0.08, HR = 1.3, HT = 1.52, XC = 6.93, TH = 0.125, BEV = 0.034;
  const outline = [[-W, HY0], [W, HY0], [W, HR]]; const Rr = (W * W + (HT - HR) ** 2) / (2 * (HT - HR)), cy = HT - Rr;
  for (let k = 1; k < 14; k++) { const a = Math.asin(clamp(W / Rr)) * (1 - (2 * k) / 14); outline.push([Rr * Math.sin(a), cy + Rr * Math.cos(a)]); }
  outline.push([-W, HR]);
  const cen = [0, 0.8], shrink = (p, k) => [cen[0] + (p[0] - cen[0]) * (1 - (k * 2) / (2 * W)), cen[1] + (p[1] - cen[1]) * (1 - (k * 2) / (HT - HY0)) ];
  const colr = (x, y, z, k) => { const g = 0.96 + 0.08 * Math.sin(9 * y + 4 * z) * Math.sin(3.1 * z + 1.7) + 0.03 * (U(Math.floor(y * 40) * 53 + Math.floor(z * 40), 70) - 0.5); const c = mul3(C.stele, g * k); return { cw: c, cf: c, cwet: c, bed: 15 }; };
  const rings = [[XC + TH, 1, 1.0], [XC + TH - BEV, 0, 0.95], [XC - TH + BEV, 0, 0.82], [XC - TH, 1, 0.76]];   // x, shrink?, shade
  const L = rings.map(([x, sh, k]) => outline.map((p) => { const q = sh ? shrink(p, BEV) : p; return st.v(x, q[1], q[0], colr(x, q[1], q[0], k)); }));
  const n = outline.length;
  for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = L[r][i], b = L[r][j], c = L[r + 1][i], d = L[r + 1][j]; st.tri(a, b, c); st.tri(b, d, c); }
  const fc = st.v(XC + TH, 0.8, 0, colr(XC + TH, 0.8, 0, 1)), bc = st.v(XC - TH, 0.8, 0, colr(XC - TH, 0.8, 0, 0.76));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; st.tri(fc, L[0][j], L[0][i]); st.tri(bc, L[3][i], L[3][j]); }
  // the foot 0.48 x 0.08 x 1.08
  const box = (x0, x1, y0, y1, z0, z1, k) => {
    const v = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) v.push(st.v(x, y, z, colr(x, y, z, k)));
    const f = (a, b, c, d) => { st.tri(a, b, c); st.tri(b, d, c); }; f(v[0], v[1], v[2], v[3]); f(v[4], v[6], v[5], v[7]); f(v[0], v[4], v[1], v[5]); f(v[2], v[3], v[6], v[7]); f(v[0], v[2], v[4], v[6]); f(v[1], v[5], v[3], v[7]);
  };
  box(XC - 0.24, XC + 0.24, 0, 0.08, -0.54, 0.54, 0.88);
  // the east face: border line, two relief silhouettes, nine rows of unreadable cuts, all proud by 3 mm
  const xf = XC + TH + 0.003, rel = (zy, off = 0) => zy.map(([z, y]) => st.v(xf + off, y, z, { cw: C.relief, cf: C.relief, cwet: C.relief, bed: 15 }));
  const frame = (k) => outline.map((p) => shrink(p, 0.06 + k)).map(([z, y]) => [z, y]);
  const fo = rel(frame(0)), fi = rel(frame(0.014));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; st.tri(fo[i], fo[j], fi[i]); st.tri(fo[j], fi[j], fi[i]); }
  for (const zc of [-0.14, 0.14]) {   // two figures 0.14 x 0.23: a head and a body
    const fig = [[-0.04, 0.99], [0.04, 0.99], [0.07, 1.12], [0.03, 1.12], [0.035, 1.17], [0.0, 1.22], [-0.035, 1.17], [-0.03, 1.12], [-0.07, 1.12]].map(([z, y]) => [zc * 0.65 + z * 1, y]);
    const v = rel(fig), c = st.v(xf, 1.1, zc * 0.65, { cw: C.relief, cf: C.relief, cwet: C.relief, bed: 15 });
    for (let i = 0; i < v.length; i++) st.tri(c, v[i], v[(i + 1) % v.length]);
  }
  let ci = 0; for (let row = 0; row < 9; row++) {
    const y = 0.88 - 0.062 * row, cnt = 7 + Math.floor(5 * R(row, F.STR, 3));
    for (let k = 0; k < cnt; k++) { const w = 0.012 + 0.02 * R(ci, F.STR, 4), z = -0.3 + (0.6 * (k + 0.3 * R(ci, F.STR, 5))) / cnt, h = 0.008 + 0.01 * R(ci, F.STR, 6); ci++; const v = rel([[z, y], [z + w, y], [z, y + h], [z + w, y + h]]); st.tri(v[0], v[1], v[2]); st.tri(v[1], v[3], v[2]); }
  }
  return st.finish();
}

// ---- the flake: 12 chips and the scar
function pawSouthZ(x, y) { const h = hp(x), s = Math.pow(clamp(1 - Math.pow(clamp(y / h), PAW_E)), 1 / PAW_E); return 2.17 + hwp(x) * s; }
function buildChips(fa) {
  const chips = [], p = [], c = [], idx = [];
  for (let i = 0; i < 12; i++) {
    const w = 0.012 + 0.046 * R(i, F.CHP, 2), th = 0.003 + 0.009 * R(i, F.CHP, 3), a = R(i, F.CHP, 0) * TAU, rad = 0.09 * Math.sqrt(R(i, F.CHP, 1));
    const x0 = fa[0] + rad * Math.cos(a), y0 = Math.max(0.03, fa[1] + rad * Math.sin(a)), z0 = pawSouthZ(x0, y0) + 0.0015, loc = [];
    for (let k = 0; k < 5; k++) { const t = (k / 5) * TAU + 0.5 * R(i * 5 + k, F.CHP, 4), r = (w / 2) * (0.7 + 0.5 * R(i * 5 + k, F.CHP, 5)); loc.push([r * Math.cos(t), r * Math.sin(t)]); }
    const base = p.length / 3; chips.push({ x0, y0, z0, loc, th, base, spin: (110 + 140 * R(i, F.CHP, 6)) * DEG, a0: R(i, F.CHP, 7) * TAU });
    for (let s = 0; s < 2; s++) for (let k = 0; k < 5; k++) { p.push(0, 0, 0); const cc = s === 0 ? C.flake : mul3(C.sW, 1.0); c.push(cc[0], cc[1], cc[2]); }
    for (let k = 1; k < 4; k++) { idx.push(base, base + k, base + k + 1); idx.push(base + 5, base + 5 + k + 1, base + 5 + k); }
    for (let k = 0; k < 5; k++) { const k2 = (k + 1) % 5; idx.push(base + k, base + k2, base + 5 + k); idx.push(base + k2, base + 5 + k2, base + 5 + k); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); geo.setIndex(idx);
  const place = (fl) => {
    const pos = geo.attributes.position.array;
    chips.forEach((ch, i) => {
      const vis = fl > 0.018 * i, q = clamp((fl - 0.018 * i) / 0.78), fall = 0.9 * q * q, y = Math.max(0.012, ch.y0 - fall), z = ch.z0 + 0.18 * q;
      const pr = clamp(fall / Math.max(1e-4, ch.y0 - 0.012)), phi = -(Math.PI / 2) * pr, sp = ch.spin * q + ch.a0 * 0, cs = Math.cos(sp), sn = Math.sin(sp), cp = Math.cos(phi), sph = Math.sin(phi);
      for (let s = 0; s < 2; s++) for (let k = 0; k < 5; k++) {
        const o = (ch.base + s * 5 + k) * 3;
        if (!vis) { pos[o] = pos[o + 1] = pos[o + 2] = 0; continue; }
        const lx = ch.loc[k][0] * cs - ch.loc[k][1] * sn, ly = ch.loc[k][0] * sn + ch.loc[k][1] * cs, lz = s === 0 ? ch.th / 2 : -ch.th / 2;
        pos[o] = ch.x0 + lx; pos[o + 1] = y + ly * cp - lz * sph; pos[o + 2] = z + ly * sph + lz * cp;
      }
    });
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  };
  return { geo, place };
}
function buildScar(fa, pawR) {
  const D = new Decals(), y = fa[1], x = fa[0], u = xToU(x, PXS), i0 = Math.min(pawR.nu - 1, Math.floor(u)), gv = lerp(rowAtY(pawR, i0, y, 1), rowAtY(pawR, i0 + 1, y, 1), u - i0), k = mark(D, pawR, 1, u, gv);
  const ctr = k.at(0, 0, 0.002, rgba(C.flake, 0.85)), ring = [];
  for (let j = 0; j < 5; j++) { const t = (j / 5) * TAU + 0.4, r = 0.055 * (0.8 + 0.4 * U(j, 99)); ring.push(k.at(Math.cos(t) * r, Math.sin(t) * r, 0.0026, rgba(C.m1W, 0.7))); }
  for (let j = 0; j < 5; j++) D.tri(ctr, ring[j], ring[(j + 1) % 5]);
  return D.finish();
}

// ---------------------------------------------------------------------------------------------------------------------------------
const rockMat = () => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, metalness: 0 }); m.userData.lineColor = "#493526"; m.userData.lookRole = "set"; return m; };   // lookRole "set": the soft scenery ramp (a lit side and a light blue-grey shade), not the character ramp that turned the shaded flank chocolate
const decalMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; return m; };
function addMesh(parent, geo, mat, { solid = false, cast = true, name = "" } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false; if (name) m.name = name;
  m.userData.solid = solid; parent.add(m); return m;
}

function buildSphinx(P) {
  const S = P.spec, G = P.whole;
  const fa = Array.isArray(S.flakeAt) ? S.flakeAt : [5.4, 0.76, 3.22];
  const body = buildBody(), pawR = buildPaw(1), pawL = buildPaw(-1), head = buildHead(), apron = buildApron();
  const st = new Stat(), nemes = buildNemes(st); buildNeck(st);
  for (let q = 1; q < st.p.length; q += 3) st.p[q] -= HDROP;   // the lappets, the nemes' inner shell and the neck drop with the head
  buildTail(st); st.finish();
  const surfs = { body, pawR, pawL, head, apron, nemes }, sl = [body, pawR, pawL, head, apron, nemes];
  const rm = rockMat();
  addMesh(G, body.geo, rm, { solid: true, name: "sphinx-body" }); addMesh(G, pawR.geo, rm, { solid: true, name: "sphinx-pawR" }); addMesh(G, pawL.geo, rm, { solid: true, name: "sphinx-pawL" });
  addMesh(G, head.geo, rm, { solid: true, name: "sphinx-head" }); addMesh(G, nemes.geo, rm, { solid: true, name: "sphinx-nemes" }); addMesh(G, st.geo, rm, { solid: true, name: "sphinx-wings" });
  const apronM = addMesh(G, apron.geo, rm, { solid: true, name: "sphinx-apron" });
  const mk = buildMarks(surfs), cas = buildCasing(surfs);
  for (const d of [mk.A, mk.Sx, mk.Bd, mk.Wt, cas]) d.finish();
  const scar = buildScar(fa, pawR);
  const mA = decalMat({ transparent: true, depthWrite: false }), mS = decalMat({ transparent: true, depthWrite: false }), mB = decalMat({ transparent: true, depthWrite: false }), mW = decalMat({ transparent: true, depthWrite: false }), mScar = decalMat({ transparent: true, depthWrite: false });
  const mC = decalMat({ polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mAm = addMesh(G, mk.A.geo, mA, { cast: false }), mSm = addMesh(G, mk.Sx.geo, mS, { cast: false }), mBm = addMesh(G, mk.Bd.geo, mB, { cast: false }), mWm = addMesh(G, mk.Wt.geo, mW, { cast: false });
  const casM = addMesh(G, cas.geo, mC, { cast: false }), scarM = addMesh(G, scar.geo, mScar, { cast: false });
  for (const o of [mAm, mSm, mBm, mWm, casM, scarM]) o.renderOrder = 2;
  for (const o of [mWm]) o.renderOrder = 3;
  let steleM = null, steleMat = null;
  if (S.stele !== false) { const sg = buildStele(); sg.paint(0, 0); steleMat = rockMat(); steleMat.side = THREE.DoubleSide; steleM = addMesh(G, sg.geo, steleMat, { solid: true, name: "sphinx-stele" }); }
  const chips = buildChips(fa), cm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }); cm.userData.noOutline = true;
  addMesh(G, chips.geo, cm, { cast: false, name: "sphinx-chips" });
  const last = { r: NaN, wet: NaN, fl: NaN };
  const set = (r, wet, fl) => {
    const morph = r !== last.r;
    if (morph) {
      for (const s of sl) s.update(r);
      for (const d of [mk.A, mk.Sx, mk.Bd, mk.Wt, scar]) d.update(sl);
      const cf = 1 - clamp(r / 0.2); cas.update(sl, cf, (1 - cf) * 0.06); casM.visible = cf > 0.001;
      mA.opacity = 1 - r; mAm.visible = r < 0.999; mB.opacity = r; mBm.visible = r > 0.001; apronM.visible = r > 0.001; mk.Bd.geo.computeBoundingSphere();
      if (steleM) { steleMat.transparent = cf < 1; steleMat.opacity = cf; steleM.visible = cf > 0.01; }
    }
    if (morph || wet !== last.wet) { for (const s of sl) s.paint(r, wet); st.paint(r, wet); mW.opacity = wet; mWm.visible = wet > 0.001; }
    if (fl !== last.fl) { chips.place(fl); scarM.visible = fl > 0.0001; mScar.opacity = clamp(fl * 30); }
    last.r = r; last.wet = wet; last.fl = fl;
  };
  set(clamp(S.rough ?? 0), clamp(S.wet ?? 0), clamp(S.flake ?? 0));
  return { grip: 0, apply(ps) { set(clamp(num(ps, S, "rough", 0)), clamp(num(ps, S, "wet", 0)), clamp(num(ps, S, "flake", 0))); } };
}

export const EG_SPHINX_GRIPS = {
  sphinx: { pawR: [9.0, hp(9.0), 2.17], pawL: [9.0, hp(9.0), -2.17], toeR: [13.4, hp(13.4), 2.17], toeL: [13.4, hp(13.4), -2.17], noseTip: [5.16, 5.55, 0] },
};
export const EG_SPHINX_KINDS = { sphinx: buildSphinx };
