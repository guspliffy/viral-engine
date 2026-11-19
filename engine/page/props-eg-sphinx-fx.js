// EGYPT EP05 "How old is the Sphinx really?" (19 Nov 2026), task T3: Spud's savanna, the hidden hall, the salt slice, the survey kit, Leo.
// Design: storyboards/series/ancient-aliens/05-sphinx/DESIGN.md sections 1, 2, 6, 7 (and the panels 05, 08, 11, 12, 22 of the sheets).
// Metres. Every mark (pore, pit, chip, crack, bed line, joint, scuff, stem, crystal) is drawn once, from a hash of its index (DESIGN section 1:
// hh(i, k)); no tiling texture, no canvas (0 MB), no Math.random, no wall clock: a kind's geometry is a pure function of its spec, and every
// animated value is a param (0..1 unless said) read as propState value, else spec.<name>, else 0. The animated keys here have NO propState
// default: seed them with a dur-0 set at 0.1 or later (items before a beat's start are dropped by clip.mjs) or put them in the spec.
// Light is baked into vertex colours where noted; the set's key light still shades. Everything lies in one merged mesh per material.
// Bench: storyboards/series/ancient-aliens/05-sphinx/bench (make-eg-sphinx-fx.mjs, eg-sphinx-fx-sheet.png). Tris measured: see each kind.
//
//   savanna     WORLD (place at 0, 0, 0; the Sphinx's centreline is z 0, the pit floor y 0). spec cover true: the turf r 85 (a grid, 0.7 m cells near
//               the statue, y 0.012 + 0.045 sin(.31x) sin(.43z) inside r 80, down to y -0.085 at r 85; within 0.18 m of the Sphinx's plan the
//               ground drops to bare soil y -0.04 and no tuft stands there), 2,710 tufts: 1,260 inside r 25 (3x the DESIGN density; half in 1.4 m clumps)
//               of 8 two-segment blades 0.25-0.6 tall (0.03-0.07 wide), 1,150 on r 25-52 and 300 on r 52-80 in clumps of 6 one-triangle blades
//               0.35-1.1 tall; every tuft its own green (G1/G2/G3/turf mix, dark root to light tip); 600 turf patches 0.08-0.25 + 90 broad
//               green blotches 0.7-2.1; 24 low bushes (3 lobes, dark under); 12 puddles (0.52-1.75) at the lows; 8 acacias (trunk 0.18 -> 0.07,
//               5 forks at 52-76 %, 30 lobes in 3 tiers with the darkest band underneath, 32 leaf-edge strokes each: the DESIGN tuples). spec storm true: the cloud deck (18 masses, 7 lobes each, a
//               3-band ramp #293846 -> #536477) and the horizon ground blending the turf into #788A91 over r 70-130 (to r 275, y -0.085). Both
//               false draws nothing; cover false + storm true is the 06 sky (no turf). Param gust 0..1 (spec start 0): tips and leaf strokes sway
//               6 deg * sin(2 pi gust + 2 pi U): tween 0 -> n for n sways. No rain here: place the director's `rainbox` (68 x 18 x 48 at 0,0,0).
//               aasky is the director's (afternoon, night 0, sun off). 85.4k tris (cap 86k). Not solid, not standable (scenery, lookOnly):
//               the cast stands on the stage floor at y 0 (the turf top is 0.012-0.057).
//   hiddenhall  WORLD (place at 0, 0, 0): the shell bottom centre is (11.30, -5.60, 2.17), 7.60 x 5.60 x 11.20 (x, y, z), top at y 0, the room 5.60
//               wide, floor/ceiling at local y 0.24 / 3.42 (world -5.36 / -2.18), the cavity from local z -4.60. It draws its own six lamps (a clay
//               bowl 0.31 wide on a stone stand in the aisle at xLocal +-2.05, zLocal -3.78 / -2.17 / -0.53, bowl at yLocal 1.20, a cel flame
//               0.3 high, a soft amber haze): do NOT add `oillamp`s. They burn at lamp 0. 8 shelf bays x 4 boards crowded with 256 scrolls
//               (DESIGN 96 + more rows) and 48 tablets (5-7 incisions each), 12 carved pilasters (fluted shaft, bud capital, abacus, architrave
//               over the shelves), a doorway in the back wall, dressed ashlar walls and ceiling (irregular courses 0.38-0.66, blocks 0.8-1.7,
//               each a pillowed face), the stone table with tablets and scrolls on it, the stair
//               (16 rises 0.19, treads 0.24 from zLocal 0.78, a 0.46 landing at 3.28), two 0.27 walls, the stair void in the roof. Exposed rock:
//               6 strata, 54 chips, 80 pits, 18 veins, bed lines. The pools of the lamps (radius 1.26, plus a faint wide pool 4.2, fill 0.30-0.40, a dark
//               in every corner) are baked into the room's vertex colours. spec.cut (default 2.4): the +z section plane in zLocal. The DESIGN asks for an open +Z section; at the shell's end
//               (cut 5.6) the stair's landing is a solid block in front of the room, so the default cut goes through the stair bay (step 7, its face dressed as masonry): the
//               room, shelves, table and lamps show over it from a camera above 1.9; seen from higher (y 1.6 above the roof line) the treads show. At cut > 3.03 the stair void shows in the roof. Param lamp
//               (spec start 0): the pool intensity 0.70 (1 + 0.08 sin(2 pi lamp + 6.28 U)) and the flame flicker's phase: tween it 0 -> n
//               to make the pools breathe. 34.9k tris (cap 46k) at cut 2.4. SOLID/standable: the floor at world y -5.36, the stair treads
//               (top of step k at -5.36 + 0.19 (k + 1) world y); everything else is a wall. Cast scale: Spud 0.88 stands on the floor (give him y -5.36).
//   saltslice   LOCAL (origin bottom centre, the section faces +z): a Member II block 2.40 x 1.75 x 0.66, front at z +0.33. 160 7-point pores on the 16 x 10
//               lattice cut through the face (walls, inset 0.009-0.055) minus the ones that sit under the flake (see userData.hiddenPores), 53
//               throats, 83 grains, 6 top-edge bites 0.035-0.08, 3 seam traces, 17 capillary branches that climb with damp, 31 salt clusters
//               (5 six-faced cubes on a thin glassy stem, panel 08; the largest, 14 cubes, behind the flake seat, visible from damp 0.90), the flake
//               (0.31 x 0.28 x 0.037, 8 fracture vertices shared with its seat) and 8 release chips + 12 rim chips + 16 spalls on the ground.
//               Params (spec start 0): damp 0..1 the damp front y 0.12 -> 1.27 + 0.043 sin(9x) (feather 0.075, tint 0.52, #657478), grow 0..1
//               (cluster i scales clamp((grow - 0.25 U) / 0.75)), pop 0..1 the flake (0.25 p, 0.05 p - 0.30 p^2, 0.23 p), turn 37 p deg Y, 22 p deg
//               Z; the chips 0.40-1.35 x that and 0.60 p^2 more fall. Phases for a clip: damp over 0-0.42, grow 0.30-0.76, pop 0.76-1. 22.5k tris (cap 31k).
//               Not for hands. Standable: no.
//   surveykit   LOCAL, origin = DESIGN's root (place it at 11.0, 0, 5.65), front +z: the cart (0.48 x 0.21 x 0.71, yellow, 0.024 tubing, 4 wheels r 0.105
//               with 12 grooves, the screen 0.29 x 0.18 tilted 28 deg back facing the pusher at -z, 6 traces, the push bar at y 0.69, z -0.46); the
//               rig at (-3.30, 0, 1.03) (tracks 0.31 x 0.25 x 1.48 with 26 treads, housing 1.01 x 0.77 x 1.22 set back to z -0.27 so the mast stands
//               clear of it, 12 vents, 8 bolts, the mast 0.24 x 3.18 x 0.28 at (0, 0.20, +0.48) with 18 rungs, 2 hoses, the stem 0.046, the case);
//               the table at (2.52, 0, -0.58) (top y 0.64) with the solid core along X (1.05 x 0.17, 7 bed transitions, 106 pits, 2 hairlines) in two
//               V cradles. Params (spec start 0): roll 0..1 moves the cart and its anchors +0.85 roll m along z and turns the wheels 0.85 roll / 0.105
//               rad (NOTE the engine's own `roll` is a 1-degree lean about z: this kind undoes it); drill 0..1 lowers the carriage 0.33 m and turns
//               the stem 4 turns. GRIPS gripL [-0.15, 0.69, -0.46], gripR [0.15, 0.69, -0.46] at roll 0: at roll r add [0, 0, 0.85 r] (the same
//               two points are userData.gripL / gripR Object3Ds on P.whole, parented to the cart: they follow it). They are push-bar anchors for a
//               hand on a moving cart, not a held prop (no SIZE entry, no in-hand proof). 9.0k tris (cap 24k). SOLID: cart, rig, case, table, core.
//   leo         WORLD dome r 240 about the origin (place at 0, 0, 0 with the stage's camera near it): 9 unlit 12-sided discs at 2.5x the catalogue size (director, round 2: Regulus 0.105 deg -> 0.26,
//               Eta 0.055, Algieba 0.078, Adhafera 0.055, Rasalas 0.045, Ras Elased Australis 0.069, Zosma 0.078, Chertan 0.058, Denebola 0.088;
//               the centres are exact) each with a soft round halo (an 8-triangle fan, alpha 0.7 -> 0 over 4.6 disc radii; no rays) and 10 solid
//               links (8 segments, 0.085 deg wide = 2-3 px at fov 50 on 1920 px, so draft aliasing no longer dashes them). Placement per DESIGN section 7: J2000 RA/Dec resolved at (162, 18) deg, mapped to (-Z, +Y, +X), rotated
//               -5 deg about +X and (6 + 3 rise) deg about +Z; the centre is bearing 90, altitude 6 -> 9 deg. The spacing error against the catalogue
//               is 5e-13 deg. Params (spec start 0, as DESIGN: all animated keys default to 0): show 0..1 the disc alpha, lines 0..1 (link alpha
//               0.33 lines show), rise 0..1. Put the director's `starfield` spec.hole [90, 8, 19] under it. 340 tris. Unlit, see-through, not solid.
import * as THREE from "three";

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
// DESIGN section 1: the hash of a mark index i and a channel k (independent channels for place, size, turn, strength)
const hh = (i, k = 0) => { let h = Math.imul(i + 1, 0x9E3779B1) ^ Math.imul(k + 1, 0x85EBCA6B); h = Math.imul(h ^ (h >>> 16), 0x7FEB352D); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const rr = (i, k, a, b) => a + (b - a) * hh(i, k);
const _cc = new Map();
const col = (hex) => { let c = _cc.get(hex); if (!c) { c = new THREE.Color(hex); _cc.set(hex, c); } return c; };
const mixc = (a, b, t) => new THREE.Color().copy(a).lerp(b, clamp(t));
const mulc = (a, k) => new THREE.Color(a.r * k, a.g * k, a.b * k);
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------------------------------------------------------------------------------------------------------------
// a geometry builder: positions, normals, vertex colours, indices; every primitive writes flat or smooth normals itself, so a
// whole kind merges into one mesh per material (no per-mark meshes). tf(matrix) puts every later vertex through a transform.
class B {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; this.M = null; this.NM = null; }
  get nv() { return this.p.length / 3; }
  tf(m) { this.M = m; this.NM = m ? new THREE.Matrix3().getNormalMatrix(m) : null; return this; }
  vert(x, y, z, nx, ny, nz, c) {
    if (this.M) {
      const e = this.M.elements, m = this.NM.elements;
      const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      let NX = m[0] * nx + m[3] * ny + m[6] * nz, NY = m[1] * nx + m[4] * ny + m[7] * nz, NZ = m[2] * nx + m[5] * ny + m[8] * nz; const l = Math.hypot(NX, NY, NZ) || 1;
      x = X; y = Y; z = Z; nx = NX / l; ny = NY / l; nz = NZ / l;
    }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(c.r, c.g, c.b); return this.p.length / 3 - 1;
  }
  tri(a, b, c, c0, c1 = c0, c2 = c0) {
    const n = norm3(cross3(sub3(b, a), sub3(c, a)));
    const i0 = this.vert(a[0], a[1], a[2], n[0], n[1], n[2], c0); this.vert(b[0], b[1], b[2], n[0], n[1], n[2], c1); this.vert(c[0], c[1], c[2], n[0], n[1], n[2], c2);
    this.i.push(i0, i0 + 1, i0 + 2);
  }
  quad(a, b, c, d, c0, c1 = c0, c2 = c0, c3 = c0) { this.tri(a, b, c, c0, c1, c2); this.tri(a, c, d, c0, c2, c3); }
  // a quad turned to look along `out` (flips the winding when needed)
  facing(a, b, c, d, out, col0) { const n = cross3(sub3(b, a), sub3(c, a)); if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) this.quad(a, d, c, b, col0); else this.quad(a, b, c, d, col0); }
  // a triangle turned to look along `out`
  triFacing(a, b, c, out, c0) { const n = cross3(sub3(b, a), sub3(c, a)); if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) this.tri(a, c, b, c0); else this.tri(a, b, c, c0); }
  // a box centred on (cx, cy, cz), colour one Color or six ([+x, -x, +y, -y, +z, -z])
  box(cx, cy, cz, sx, sy, sz, c) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, C = Array.isArray(c) ? c : [c, c, c, c, c, c];
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], C[0]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], C[1]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], C[2]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], C[3]);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], C[4]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], C[5]);
  }
  // a (nu x nv) grid of f(u, v) -> [x, y, z]; the normal is du x dv (flip reverses it); colf(u, v, p, n) -> Color; nf(u, v, p) -> a normal
  grid(nu, nv, f, colf, o = {}) {
    const P = [], N = [], base = this.nv, sg = o.flip ? -1 : 1;
    for (let i = 0; i <= nu; i++) { P[i] = []; for (let j = 0; j <= nv; j++) P[i][j] = f(i / nu, j / nv); }
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
      let n;
      if (o.nf) n = o.nf(i / nu, j / nv, P[i][j]);
      else {
        const a = sub3(P[Math.min(i + 1, nu)][j], P[Math.max(i - 1, 0)][j]), b = sub3(P[i][Math.min(j + 1, nv)], P[i][Math.max(j - 1, 0)]);
        n = cross3(a, b); if (Math.hypot(n[0], n[1], n[2]) < 1e-12) n = [0, 1, 0];
      }
      n = norm3(n); if (sg < 0 && !o.nf) n = [-n[0], -n[1], -n[2]];
      const c = colf ? colf(i / nu, j / nv, P[i][j], n) : col("#ffffff");
      this.vert(P[i][j][0], P[i][j][1], P[i][j][2], n[0], n[1], n[2], c);
    }
    const id = (i, j) => base + i * (nv + 1) + j;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
      if (sg > 0) this.i.push(a, b, c, a, c, d); else this.i.push(a, c, b, a, d, c);
    }
  }
  // a plane patch: o + u*a + v*b over a in [ua, ub], b in [va, vb]; the face looks along u x v (flip to reverse)
  plane(o, u, v, ua, ub, va, vb, du, dv, colf, flip = false) {
    const nu = Math.max(1, Math.ceil(Math.abs(ub - ua) / du)), nv = Math.max(1, Math.ceil(Math.abs(vb - va) / dv));
    this.grid(nu, nv, (s, t) => add3(add3(o, u, lerp(ua, ub, s)), v, lerp(va, vb, t)), colf, { flip });
  }
  // a smooth ellipsoid
  ellipsoid(cx, cy, cz, rx, ry, rz, seg, rings, colf) {
    this.grid(seg, rings, (u, v) => { const th = u * TAU, ph = v * Math.PI; return [cx + rx * Math.sin(ph) * Math.cos(th), cy + ry * Math.cos(ph), cz + rz * Math.sin(ph) * Math.sin(th)]; }, colf,
      { nf: (u, v) => { const th = u * TAU, ph = v * Math.PI; return [Math.sin(ph) * Math.cos(th) / rx, Math.cos(ph) / ry, Math.sin(ph) * Math.sin(th) / rz]; } });
  }
  // a tube along a path ([[x, y, z], ...]), radius r (number | array | f(t)), seg sides; colf(t, k/seg, p, n); round or flat caps
  tube(path, r, seg, colf, caps = true) {
    const n = path.length, T = [], F = [];
    for (let i = 0; i < n; i++) T.push(norm3(sub3(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)])));
    let up = Math.abs(T[0][1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm3(cross3(T[0], up)), v = cross3(T[0], u);
    for (let i = 0; i < n; i++) {
      if (i > 0) { const w = cross3(T[i - 1], T[i]), s = Math.hypot(...w); if (s > 1e-6) { const ax = [w[0] / s, w[1] / s, w[2] / s], ang = Math.asin(clamp(s, -1, 1)), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...ax), ang); const U = new THREE.Vector3(...u).applyQuaternion(q), V = new THREE.Vector3(...v).applyQuaternion(q); u = [U.x, U.y, U.z]; v = [V.x, V.y, V.z]; } }
      F.push([u, v]);
    }
    const rad = (i) => (typeof r === "function" ? r(i / Math.max(1, n - 1)) : Array.isArray(r) ? r[i] : r);
    const base = this.nv;
    for (let i = 0; i < n; i++) for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * TAU, nn = add3([0, 0, 0], F[i][0], Math.cos(a)); const nrm = add3(nn, F[i][1], Math.sin(a)), p = add3(path[i], nrm, rad(i));
      this.vert(p[0], p[1], p[2], nrm[0], nrm[1], nrm[2], colf ? colf(i / Math.max(1, n - 1), k / seg, p, nrm) : col("#ffffff"));
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = base + i * (seg + 1) + k, b = a + 1, c = a + seg + 1, d = c + 1; this.i.push(a, b, c, b, d, c); }
    if (caps) for (const [i, sgn] of [[0, -1], [n - 1, 1]]) {
      const c0 = colf ? colf(i / Math.max(1, n - 1), 0, path[i], T[i]) : col("#ffffff"), ctr = this.vert(path[i][0], path[i][1], path[i][2], T[i][0] * sgn, T[i][1] * sgn, T[i][2] * sgn, c0), rb = this.nv;
      for (let k = 0; k <= seg; k++) { const a = (k / seg) * TAU, nrm = add3(add3([0, 0, 0], F[i][0], Math.cos(a)), F[i][1], Math.sin(a)), p = add3(path[i], nrm, rad(i)); this.vert(p[0], p[1], p[2], T[i][0] * sgn, T[i][1] * sgn, T[i][2] * sgn, c0); }
      for (let k = 0; k < seg; k++) { if (sgn > 0) this.i.push(ctr, rb + k, rb + k + 1); else this.i.push(ctr, rb + k + 1, rb + k); }
    }
  }
  // a flat polygon fan on a surface frame s = { o, u, v } (face looks along u x v), points [a, b] in the frame, raised by off
  fan(s, pts, off, c, c2 = c) {
    const n = norm3(cross3(s.u, s.v)), P = (a, b) => add3(add3(add3(s.o, s.u, a), s.v, b), n, off);
    let ca = 0, cb = 0; for (const [a, b] of pts) { ca += a; cb += b; } ca /= pts.length; cb /= pts.length;
    for (let k = 0; k < pts.length; k++) { const q = pts[(k + 1) % pts.length]; this.tri(P(ca, cb), P(pts[k][0], pts[k][1]), P(q[0], q[1]), c, c2, c2); }
  }
  // a stroke (a ribbon) along 2D points [[a, b], ...] of the frame, width w (number | array), raised by off
  stroke(s, pts, w, off, c) {
    const n = norm3(cross3(s.u, s.v)), P = (a, b) => add3(add3(add3(s.o, s.u, a), s.v, b), n, off), L = [], R = [];
    for (let k = 0; k < pts.length; k++) {
      const p0 = pts[Math.max(0, k - 1)], p1 = pts[Math.min(pts.length - 1, k + 1)]; let da = p1[0] - p0[0], db = p1[1] - p0[1]; const l = Math.hypot(da, db) || 1; da /= l; db /= l;
      const ww = (Array.isArray(w) ? w[k] : w) / 2; L.push(P(pts[k][0] - db * ww, pts[k][1] + da * ww)); R.push(P(pts[k][0] + db * ww, pts[k][1] - da * ww));
    }
    for (let k = 0; k < pts.length - 1; k++) this.quad(R[k], R[k + 1], L[k + 1], L[k], c);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i); g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
  get tris() { return this.i.length / 3; }
}
// frame helpers: u x v must be the way the surface faces
const FR = (o, u, v) => ({ o, u, v });
const vmat = (o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1, ...o });
const bmat = (o = {}) => { const m = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
// an overlay material for marks lying 1-4 mm over a surface
const markMat = (o = {}) => { const m = vmat({ polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; return m; };
function put(b, mat, parent, o = {}) {
  const m = new THREE.Mesh(b.geo ? b.geo() : b, mat);
  m.castShadow = !!o.cast; m.receiveShadow = o.recv ?? true;
  if (o.steam) { m.frustumCulled = false; m.userData.steam = true; m.castShadow = m.receiveShadow = false; }
  if (o.scenery) { m.frustumCulled = false; m.userData.solid = false; m.userData.lookOnly = true; m.castShadow = false; }
  if (o.solid === false) m.userData.solid = false;
  if (o.order != null) m.renderOrder = o.order;
  if (o.name) m.name = o.name;
  if (o.noOutline) mat.userData.noOutline = true;
  parent.add(m); return m;
}

// ===============================================================================================================
// leo: the Lion in the Sphinx's gaze (DESIGN section 7). 9 unlit 12-sided discs and 10 links on the dome r 240 about the origin.
const LEO = [[152.0930, 11.9672, 0.105], [151.8331, 16.7627, 0.055], [154.9931, 19.8415, 0.078], [154.1726, 23.4173, 0.055], [148.1909, 26.0070, 0.045], [146.4628, 23.7743, 0.069], [168.5271, 20.5237, 0.078], [168.5600, 15.4296, 0.058], [177.2649, 14.5721, 0.088]];
const LEO_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 8], [8, 7], [7, 0], [6, 7]];
const LEO_R = 240;
// the J2000 unit vectors resolved against the (increasing RA, increasing Dec, radial) basis at (162, 18) deg and mapped to (-Z, +Y, +X)
function leoBase() {
  const a0 = 162 * D2R, d0 = 18 * D2R, dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const eRA = [-Math.sin(a0), Math.cos(a0), 0], eDec = [-Math.sin(d0) * Math.cos(a0), -Math.sin(d0) * Math.sin(a0), Math.cos(d0)], eR = [Math.cos(d0) * Math.cos(a0), Math.cos(d0) * Math.sin(a0), Math.sin(d0)];
  return LEO.map(([ra, dec]) => { const a = ra * D2R, d = dec * D2R, v = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; return [dot(v, eR), dot(v, eDec), -dot(v, eRA)]; });
}
// the stars' unit directions in the world after the rigid placement (rotate about +X by -5 deg, about +Z by 6 + 3 rise deg): for the bench's spacing check
export function leoSky(rise = 0) {
  const m = new THREE.Matrix4().makeRotationZ((6 + 3 * rise) * D2R).multiply(new THREE.Matrix4().makeRotationX(-5 * D2R));
  return leoBase().map((u) => { const v = new THREE.Vector3(...u).applyMatrix4(m); return [v.x, v.y, v.z]; });
}
export const LEO_CATALOGUE = LEO;
const LEO_BOOST = 2.5, LEO_LINE_DEG = 0.085;   // discs 2.5x the catalogue size (round 2: the stars read on a phone), links 0.07 deg = 2-3 px at the bench camera
function buildLeo(P) {
  const S = P.spec, dirs = leoBase(), riseG = new THREE.Group(), tilt = new THREE.Group();
  tilt.rotation.x = -5 * D2R; riseG.add(tilt); P.whole.add(riseG);
  const sb = new B(), lb = new B(), hb = [], C1 = col("#F2F7FF"), C2 = col("#A9C8E6");
  dirs.forEach((u, i) => {
    const e1 = norm3(cross3(u, Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), e2 = cross3(u, e1), t = Math.tan((LEO[i][2] * LEO_BOOST * D2R) / 2), ring = [];
    const at = (k, n, tt) => { const a = (k / n) * TAU, v = norm3(add3(add3(u, e1, tt * Math.cos(a)), e2, tt * Math.sin(a))); return [v[0] * LEO_R, v[1] * LEO_R, v[2] * LEO_R]; };
    for (let k = 0; k < 12; k++) ring.push(at(k, 12, t));
    const c = [u[0] * LEO_R, u[1] * LEO_R, u[2] * LEO_R];
    for (let k = 0; k < 12; k++) sb.tri(c, ring[k], ring[(k + 1) % 12], C1);
    // the soft round halo: one fan of 8, alpha 0.7 at the middle falling to 0 at 4.6 disc radii (a real star's look, no rays)
    for (let k = 0; k < 8; k++) hb.push(c, at(k, 8, t * 4.6), at(k + 1, 8, t * 4.6));
  });
  const wid = LEO_R * LEO_LINE_DEG * D2R;
  for (const [a, b] of LEO_LINKS) {
    const ua = dirs[a], ub = dirs[b], om = Math.acos(clamp(ua[0] * ub[0] + ua[1] * ub[1] + ua[2] * ub[2], -1, 1)), pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, s0 = Math.sin((1 - t) * om) / Math.sin(om), s1 = Math.sin(t * om) / Math.sin(om); pts.push([ua[0] * s0 + ub[0] * s1, ua[1] * s0 + ub[1] * s1, ua[2] * s0 + ub[2] * s1]); }
    const L = [], R = [];
    for (let k = 0; k <= 8; k++) {
      const tg = norm3(sub3(pts[Math.min(8, k + 1)], pts[Math.max(0, k - 1)])), sd = norm3(cross3(pts[k], tg));
      L.push(add3(pts[k], sd, -wid / 2 / LEO_R).map((v) => v * LEO_R)); R.push(add3(pts[k], sd, wid / 2 / LEO_R).map((v) => v * LEO_R));
    }
    for (let k = 0; k < 8; k++) lb.quad(R[k], R[k + 1], L[k + 1], L[k], C2);
  }
  const mk = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0, ...o }); m.userData.noOutline = true; return m; };
  const sm = mk("#F2F7FF"), lm = mk("#A9C8E6"), hm = mk("#FFFFFF", { vertexColors: true }), flat = (b) => { const g = b.geo(); g.deleteAttribute("color"); return g; };
  // halo geometry: a triangle per fan segment, rgba per vertex (middle 0.5, rim 0)
  const hp = [], hc = [], hn = []; for (let k = 0; k < hb.length; k += 3) { const c = hb[k]; hp.push(...c, ...hb[k + 1], ...hb[k + 2]); const nn = norm3(c); hn.push(...nn, ...nn, ...nn); hc.push(0.86, 0.93, 1, 0.7, 0.8, 0.9, 1, 0, 0.8, 0.9, 1, 0); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(hp, 3)); hg.setAttribute("normal", new THREE.Float32BufferAttribute(hn, 3)); hg.setAttribute("color", new THREE.Float32BufferAttribute(hc, 4)); hg.computeBoundingSphere();
  const links = put(flat(lb), lm, tilt, { steam: true, scenery: true, order: 7, name: "leo-links" }), halos = put(hg, hm, tilt, { steam: true, scenery: true, order: 7.5, name: "leo-halos" }), stars = put(flat(sb), sm, tilt, { steam: true, scenery: true, order: 8, name: "leo-stars" });
  return { grip: 0, apply(ps) {
    const show = clamp(num(ps, S, "show", 0)), lines = clamp(num(ps, S, "lines", 0)), rise = clamp(num(ps, S, "rise", 0));
    sm.opacity = show; hm.opacity = show; lm.opacity = 0.33 * lines * show; riseG.rotation.z = (6 + 3 * rise) * D2R; P.whole.visible = show > 0.002; links.visible = lines * show > 0.002;
  } };
}

// ===============================================================================================================
// surveykit: the survey crew's cart, drill rig, case and the empty core on its table (DESIGN section 7). Local frame, origin = the cart's root.
const SV = { YEL: "#DDA531", STEEL: "#58606A", ALU: "#B6BAC0", RUB: "#272A2A", SCR: "#243748", TRACE: "#608394", CASE: "#3E515C", CORE: "#D2AA7F" };
const tone = (c, i, k, amt) => mulc(c, 1 + (hh(i, k) - 0.5) * amt);
// a wheel r 0.105, width 0.058, 12 tread grooves, the hub on its +x side
function wheelGeo() {
  const b = new B(), W = 0.029, rub = col(SV.RUB), alu = col(SV.ALU), N = 24, rOut = 0.105, rIn = 0.095;
  const P = (a, x, rad) => [x, Math.sin(a) * rad, Math.cos(a) * rad], rad = (a) => [0, Math.sin(a), Math.cos(a)], tg = (a) => [0, Math.cos(a), -Math.sin(a)];
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * TAU, a1 = ((k + 1) / N) * TAU, am = (a0 + a1) / 2, r = k % 2 ? rIn : rOut, rp = (k + N - 1) % N % 2 ? rIn : rOut, c = mulc(rub, k % 2 ? 0.8 : 1.15);
    b.facing(P(a0, -W, r), P(a0, W, r), P(a1, W, r), P(a1, -W, r), rad(am), c);   // the tread face
    if (r !== rp) b.facing(P(a0, -W, Math.min(r, rp)), P(a0, W, Math.min(r, rp)), P(a0, W, Math.max(r, rp)), P(a0, -W, Math.max(r, rp)), r > rp ? tg(a0).map((v) => -v) : tg(a0), mulc(rub, 0.6));   // a groove wall
    for (const s of [-1, 1]) b.facing(P(a0, s * W, 0.05), P(a1, s * W, 0.05), P(a1, s * W, r), P(a0, s * W, r), [s, 0, 0], mulc(rub, 0.9));   // the side walls
  }
  b.tube([[0.026, 0, 0], [0.042, 0, 0]], 0.052, 14, (t) => (t < 0.5 ? alu : mulc(alu, 1.08)), true);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; b.tube([[0.04, Math.sin(a) * 0.033, Math.cos(a) * 0.033], [0.05, Math.sin(a) * 0.033, Math.cos(a) * 0.033]], 0.007, 6, () => col(SV.STEEL)); }
  return b.geo();
}
function buildSurvey(P) {
  const S = P.spec, root = P.whole, M = vmat(), YEL = col(SV.YEL), STEEL = col(SV.STEEL), ALU = col(SV.ALU), RUB = col(SV.RUB), CASE = col(SV.CASE);
  const ride = new THREE.Group(); root.add(ride);
  // ---------------- the cart
  const cart = new THREE.Group(); ride.add(cart);
  const cb = new B();
  cb.box(0, 0.195, 0, 0.48, 0.21, 0.71, [tone(YEL, 1, 1, 0.06), tone(YEL, 2, 1, 0.06), mulc(YEL, 1.1), mulc(YEL, 0.6), tone(YEL, 3, 1, 0.08), tone(YEL, 4, 1, 0.08)]);
  cb.box(0, 0.312, 0, 0.455, 0.022, 0.685, mulc(YEL, 0.88));
  cb.box(0, 0.19, 0.372, 0.4, 0.12, 0.024, ALU);
  for (const x of [-0.14, 0.14]) cb.box(x, 0.19, 0.389, 0.05, 0.02, 0.01, mulc(STEEL, 0.9));
  // 0.024 m steel tubing: the rail frame on the lid, the nose bar, the push-bar posts and cross bar
  const T = (pts, r = 0.012, c = STEEL) => cb.tube(pts, r, 8, (t) => mulc(c, 0.92 + 0.12 * t));
  T([[-0.222, 0.335, -0.34], [-0.222, 0.335, 0.34]]); T([[0.222, 0.335, -0.34], [0.222, 0.335, 0.34]]);
  T([[-0.222, 0.335, 0.34], [0.222, 0.335, 0.34]]); T([[-0.222, 0.335, -0.34], [0.222, 0.335, -0.34]]);
  T([[-0.21, 0.335, -0.34], [-0.21, 0.69, -0.46]]); T([[0.21, 0.335, -0.34], [0.21, 0.69, -0.46]]); T([[-0.21, 0.69, -0.46], [0.21, 0.69, -0.46]]);
  T([[-0.2, 0.55, -0.43], [0.2, 0.55, -0.43]], 0.009);
  T([[0, 0.335, -0.13], [0, 0.6, -0.13]], 0.012);
  for (const s of [-1, 1]) T([[s * 0.1, 0.69, -0.46], [s * 0.205, 0.69, -0.46]], 0.0175, RUB);   // the push-bar grips, 0.035 m, centred x +-0.15
  // the screen: 0.29 x 0.18, tilted 28 deg back, six traces, no text
  cb.tf(new THREE.Matrix4().makeTranslation(0, 0.65, -0.13).multiply(new THREE.Matrix4().makeRotationX(28 * D2R)));
  cb.box(0, 0, 0, 0.31, 0.2, 0.03, CASE);
  const pf = FR([0.145, -0.09, -0.0155], [-1, 0, 0], [0, 1, 0]);
  cb.plane(pf.o, pf.u, pf.v, 0, 0.29, 0, 0.18, 0.1, 0.1, () => col(SV.SCR));
  for (let i = 0; i < 6; i++) {
    const pts = [], b0 = 0.025 + 0.026 * i;
    for (let k = 0; k <= 24; k++) { const a = 0.02 + (0.25 * k) / 24; pts.push([a, b0 + 0.007 * Math.sin(a * (26 + 9 * i) + i * 1.7) * (0.5 + hh(i * 31 + k, 5) * 0.6) + 0.004 * (hh(i, 3) - 0.5)]); }
    cb.stroke(pf, pts, 0.0028, 0.0006, col(SV.TRACE));
  }
  cb.tf(null);
  // the paint's scuffs: dark and pale strokes on the yellow
  const top = FR([-0.24, 0.321, 0.345], [1, 0, 0], [0, 0, -1]);
  for (let i = 0; i < 14; i++) { const a = 0.02 + hh(i, 11) * 0.42, b = 0.02 + hh(i, 12) * 0.64, l = 0.02 + 0.05 * hh(i, 13), an = hh(i, 14) * TAU; cb.stroke(top, [[a, b], [a + Math.cos(an) * l, b + Math.sin(an) * l]], 0.004 + 0.004 * hh(i, 15), 0.0004, mixc(YEL, i % 3 ? col("#7a5a14") : col("#F3D88A"), 0.5 + 0.4 * hh(i, 16))); }
  put(cb, M, cart, { cast: true });
  const wg = wheelGeo(), wheels = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 0.25, 0.105, sz * 0.25); cart.add(piv);
    const m = put(wg, M, piv, { cast: true }); if (sx < 0) m.rotation.y = Math.PI; wheels.push(piv);
  }
  // the two push-bar anchors, on the cart: they follow it (userData.grip)
  const gripL = new THREE.Object3D(), gripR = new THREE.Object3D(); gripL.position.set(-0.15, 0.69, -0.46); gripR.position.set(0.15, 0.69, -0.46); gripL.name = "gripL"; gripR.name = "gripR"; cart.add(gripL, gripR);
  root.userData.gripL = gripL; root.userData.gripR = gripR;
  // ---------------- the drill rig at (-3.30, 0, 1.03)
  const rig = new THREE.Group(); rig.position.set(-3.3, 0, 1.03); root.add(rig);
  const rb = new B(), TW = 0.31, TH = 0.25, TL = 1.48, rad = TH / 2, SL = TL - TH, PER = 2 * SL + TAU * rad;
  const outline = (s) => {   // a point (z, y), its tangent and its outward normal on the track's stadium, s in 0..1
    let d = ((s % 1) + 1) % 1 * PER;
    if (d < SL) return { z: SL / 2 - d, y: TH, tz: -1, ty: 0, nz: 0, ny: 1 };
    d -= SL; if (d < Math.PI * rad) { const a = Math.PI / 2 + d / rad; return { z: -SL / 2 + Math.cos(a) * rad, y: rad + Math.sin(a) * rad, tz: -Math.sin(a), ty: Math.cos(a), nz: Math.cos(a), ny: Math.sin(a) }; }
    d -= Math.PI * rad; if (d < SL) return { z: -SL / 2 + d, y: 0, tz: 1, ty: 0, nz: 0, ny: -1 };
    d -= SL; const a = -Math.PI / 2 + d / rad; return { z: SL / 2 + Math.cos(a) * rad, y: rad + Math.sin(a) * rad, tz: -Math.sin(a), ty: Math.cos(a), nz: Math.cos(a), ny: Math.sin(a) };
  };
  for (const sx of [-1, 1]) {
    const x0 = sx * 0.47;
    rb.grid(60, 2, (u, v) => { const o = outline(u); return [x0 + (v - 0.5) * TW, o.y, o.z]; }, (u, v) => mulc(RUB, 0.9 + 0.2 * hh(Math.floor(u * 60), 21)), { nf: (u) => { const o = outline(u); return [0, o.ny, o.nz]; }, flip: true });
    for (let i = 0; i < 26; i++) {   // 26 treads: cleats across the belt
      const o = outline(i / 26 + 0.5 / 26), th = Math.atan2(-o.ty, o.tz);
      rb.tf(new THREE.Matrix4().makeTranslation(x0, o.y + o.ny * 0.012, o.z + o.nz * 0.012).multiply(new THREE.Matrix4().makeRotationX(th)));
      rb.box(0, 0, 0, TW, 0.026, 0.055, mulc(RUB, 1.5 + 0.2 * hh(i, 22 + (sx > 0))));
    }
    rb.tf(null);
    for (const sz of [-1, 1]) rb.tube([[x0 - TW / 2 - 0.004, rad, sz * SL / 2], [x0 + TW / 2 + 0.004, rad, sz * SL / 2]], rad * 0.82, 14, () => mulc(STEEL, 1.05), true);
    rb.tube([[x0 - TW / 2 - 0.01, rad, -SL / 2], [x0 - TW / 2 - 0.01, rad, SL / 2]], 0.045, 8, () => mulc(STEEL, 0.85), true);
  }
  rb.box(0, 0.13, 0, 1.3, 0.26, 1.22, mulc(STEEL, 0.9));   // the 0.26 chassis between and over the tracks
  rb.box(0, 0.26 + 0.385, -0.27, 1.01, 0.77, 1.22, [tone(YEL, 5, 1, 0.07), tone(YEL, 6, 1, 0.07), mulc(YEL, 1.1), mulc(YEL, 0.6), tone(YEL, 7, 1, 0.07), tone(YEL, 8, 1, 0.07)]);
  rb.box(0, 1.04, -0.27, 0.93, 0.02, 1.14, mulc(YEL, 0.85));
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) rb.box(sx * 0.5075, 0.5 + 0.065 * i, -0.45, 0.005, 0.03, 0.28, mulc(RUB, 0.9));   // 12 vents
  for (const sx of [-1, 1]) for (const sz of [-0.7, 0.16]) for (const sy of [0]) { rb.tube([[sx * 0.4, 1.05, sz], [sx * 0.4, 1.065, sz]], 0.016, 6, () => ALU); }   // 8 bolts, 4 on the lid ...
  for (const sx of [-1, 1]) for (const sz of [-0.7, 0.16]) rb.tube([[sx * 0.51, 0.3, sz], [sx * 0.52, 0.3, sz]], 0.016, 6, () => ALU);   // ... and 4 on the sides
  // the mast 0.24 x 3.18 x 0.28 at (0, 0.20, +0.48): four rails, a back plate, 18 rungs on a 0.15 m pitch
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rb.box(sx * 0.1, 0.2 + 1.59, 0.48 + sz * 0.12, 0.04, 3.18, 0.04, tone(ALU, sx + 3 * sz, 2, 0.1));
  rb.box(0, 0.2 + 1.59, 0.48 - 0.12, 0.2, 3.18, 0.012, mulc(STEEL, 1.1));
  for (let i = 0; i < 18; i++) rb.box(0, 0.4 + 0.15 * i, 0.6, 0.2, 0.022, 0.024, tone(STEEL, i, 3, 0.3));
  rb.box(0, 0.2, 0.48, 0.3, 0.08, 0.34, mulc(YEL, 0.8)); rb.box(0, 3.38, 0.48, 0.28, 0.06, 0.3, STEEL);
  // two hoses r 0.022 from the housing lid to a clamp on the mast
  for (const sx of [-1, 1]) {
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.2, 1.05, 0.1), new THREE.Vector3(sx * 0.38, 1.5, 0.3), new THREE.Vector3(sx * 0.3, 1.9, 0.52), new THREE.Vector3(sx * 0.14, 2.0, 0.64)]).getPoints(22).map((p) => [p.x, p.y, p.z]);
    rb.tube(cv, 0.022, 8, (t) => mulc(RUB, 1.4 + 0.5 * Math.sin(t * 40)));
    rb.box(sx * 0.14, 2.0, 0.64, 0.06, 0.06, 0.05, ALU);
  }
  put(rb, M, rig, { cast: true });
  // the carriage: slides 0.33 m down the mast with `drill`; the stem turns four turns
  const car = new THREE.Group(); car.position.set(0, 1.55, 0.74); rig.add(car);
  const kb = new B();
  kb.box(0, 0, 0, 0.34, 0.34, 0.3, [tone(YEL, 9, 1, 0.05), tone(YEL, 10, 1, 0.05), mulc(YEL, 1.1), mulc(YEL, 0.6), YEL, mulc(YEL, 0.8)]);
  kb.tube([[0, 0.17, 0], [0, 0.35, 0]], 0.085, 14, () => mulc(STEEL, 1.1)); kb.tube([[0, 0.35, 0], [0, 0.4, 0]], 0.05, 10, () => ALU);
  kb.box(0, 0, -0.17, 0.3, 0.3, 0.05, STEEL); kb.tube([[0, -0.17, 0], [0, -0.23, 0]], 0.05, 10, () => ALU);
  put(kb, M, car, { cast: true });
  const stem = new THREE.Group(); stem.position.set(0, 0, 0); car.add(stem);
  const sb = new B(); sb.tube([[0, -0.2, 0], [0, -1.55, 0]], 0.023, 10, (t) => mulc(STEEL, 1.0 + 0.2 * t), true);
  const hel = []; for (let k = 0; k <= 120; k++) { const t = k / 120, a = t * 8 * TAU; hel.push([Math.cos(a) * 0.027, -0.22 - t * 1.28, Math.sin(a) * 0.027]); }
  sb.tube(hel, 0.0065, 6, () => ALU, false); sb.tube([[0, -1.5, 0], [0, -1.58, 0]], 0.034, 10, () => ALU, true);
  put(sb, M, stem, { cast: true });
  // the case at (0.93, 0, 0.28)
  const cs = new B(); cs.tf(new THREE.Matrix4().makeTranslation(0.93, 0.205, 0.28));
  cs.box(0, 0, 0, 0.46, 0.41, 0.35, [CASE, CASE, mulc(CASE, 1.15), mulc(CASE, 0.6), mulc(CASE, 1.05), mulc(CASE, 0.9)]);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) cs.box(sx * 0.225, sy * 0.2, 0.175, 0.04, 0.04, 0.04, ALU);
  cs.box(-0.1, 0.07, 0.178, 0.05, 0.03, 0.01, ALU); cs.box(0.1, 0.07, 0.178, 0.05, 0.03, 0.01, ALU);
  cs.tube([[-0.07, 0.205, 0], [0.07, 0.205, 0]], 0.009, 6, () => ALU);
  cs.tf(null); put(cs, M, rig, { cast: true });
  // ---------------- the table at (2.52, 0, -0.58) and the solid core along X
  const tb = new B(); tb.tf(new THREE.Matrix4().makeTranslation(2.52, 0, -0.58));
  const TOP = 0.64, wood = col("#69492E");
  tb.box(0, TOP - 0.0225, 0, 1.55, 0.045, 0.65, [mulc(ALU, 0.75), mulc(ALU, 0.75), mulc(col("#8b8f95"), 1.1), mulc(ALU, 0.5), mulc(ALU, 0.7), mulc(ALU, 0.7)]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx * 0.68, z0 = sz * 0.27, h = TOP - 0.045, off = h * Math.tan(12 * D2R);
    tb.tube([[x0, h, z0], [x0 + sx * off * 0.8, 0, z0 + sz * off * 0.6]], 0.012, 8, () => STEEL);
  }
  const legX = (sx, y) => sx * 0.68 + sx * (TOP - 0.045) * Math.tan(12 * D2R) * 0.8 * (1 - y / (TOP - 0.045)), legZ = (sz, y) => sz * 0.27 + sz * (TOP - 0.045) * Math.tan(12 * D2R) * 0.6 * (1 - y / (TOP - 0.045));
  for (const sx of [-1, 1]) tb.tube([[legX(sx, 0.3), 0.3, -legZ(1, 0.3)], [legX(sx, 0.3), 0.3, legZ(1, 0.3)]], 0.01, 6, () => STEEL);
  tb.tube([[-legX(1, 0.14), 0.14, legZ(1, 0.14)], [legX(1, 0.14), 0.14, legZ(1, 0.14)]], 0.008, 6, () => STEEL);   // the second crossbar, along x on the +z side
  // two V cradles at x -+0.31: two wedges, a 140 deg V the core rests in
  const cw = col("#5b4630");
  for (const sx of [-1, 1]) {
    const cx = sx * 0.31;
    for (const sz of [-1, 1]) {
      const A = [cx - 0.07, TOP, 0], Bv = [cx + 0.07, TOP, 0], Cv = [cx + 0.07, TOP, sz * 0.1], D = [cx - 0.07, TOP, sz * 0.1], Ct = [cx + 0.07, TOP + 0.036, sz * 0.1], Dt = [cx - 0.07, TOP + 0.036, sz * 0.1];
      tb.facing(A, Bv, Ct, Dt, [0, 1, -sz * 0.36], mulc(cw, 1.12)); tb.facing(D, Dt, Ct, Cv, [0, 0, sz], cw);
      tb.facing(Bv, Cv, Ct, Ct, [1, 0, 0], mulc(cw, 0.85)); tb.facing(A, D, Dt, Dt, [-1, 0, 0], mulc(cw, 0.85));
    }
  }
  tb.tf(null); put(tb, M, root, { cast: true });
  // the core: 1.05 long, 0.17 across, flat cut ends, seven bed transitions 0.05-0.16 apart, 106 pits, 2 hairline fractures
  const kc = new B(), CY = TOP + 0.0905, CX = 2.52, CZ = -0.58, L = 1.05, R = 0.085, seams = [];
  let xx = -L / 2 + 0.12; for (let i = 0; i < 7; i++) { xx += rr(i, 60, 0.05, 0.16); seams.push(xx); }
  const edges = [-L / 2, ...seams, L / 2], tones = []; for (let i = 0; i < edges.length - 1; i++) tones.push(0.9 + 0.2 * hh(i, 61));
  const CORE = col(SV.CORE), SEAM = col("#826344");
  // lathe along x with bands: each band between two edges its own tone; a thin dark seam at each transition
  const bands = []; for (let i = 0; i < edges.length - 1; i++) bands.push([edges[i] + (i > 0 ? 0.004 : 0), edges[i + 1] - (i < edges.length - 2 ? 0.004 : 0), tones[i]]);
  const SEG = 28, rad0 = (x) => R * (1 + 0.012 * Math.sin(x * 23) + 0.008 * Math.sin(x * 61 + 1));
  const coreCol = (xl, a, tn) => { const n = 0.94 + 0.12 * hh(Math.floor(xl * 40) * 7 + Math.floor((a / TAU) * SEG), 62); return mulc(mixc(CORE, a > Math.PI ? col("#C79E72") : col("#DDB88C"), 0.4), tn * n); };
  for (const [x0, x1, tn] of bands) {
    const n = Math.max(1, Math.ceil((x1 - x0) / 0.1));
    kc.grid(SEG, n, (u, v) => { const x = lerp(x0, x1, v), a = u * TAU; return [CX + x, CY + Math.cos(a) * rad0(x), CZ + Math.sin(a) * rad0(x)]; }, (u, v) => coreCol(lerp(x0, x1, v), u * TAU, tn),
      { nf: (u) => { const a = u * TAU; return [0, Math.cos(a), Math.sin(a)]; } });
  }
  // the seams: thin dark bands
  for (const e of seams) kc.grid(SEG, 1, (u, v) => { const x = e - 0.0045 + 0.009 * v, a = u * TAU; return [CX + x, CY + Math.cos(a) * rad0(x) * 0.997, CZ + Math.sin(a) * rad0(x) * 0.997]; }, () => mulc(SEAM, 0.95), { nf: (u) => { const a = u * TAU; return [0, Math.cos(a), Math.sin(a)]; } });
  for (const sx of [-1, 1]) { const ec = sx > 0 ? mulc(col("#E9CA96"), 0.95) : mulc(col("#E9CA96"), 0.9); const ctr = kc.vert(CX + sx * L / 2, CY, CZ, sx, 0, 0, ec), rb0 = kc.nv; for (let k = 0; k <= SEG; k++) { const a = (k / SEG) * TAU, r = rad0(sx * L / 2); kc.vert(CX + sx * L / 2, CY + Math.cos(a) * r, CZ + Math.sin(a) * r, sx, 0, 0, mulc(ec, 0.92 + 0.1 * hh(k, 63))); } for (let k = 0; k < SEG; k++) { if (sx > 0) kc.i.push(ctr, rb0 + k, rb0 + k + 1); else kc.i.push(ctr, rb0 + k + 1, rb0 + k); } }
  // 106 pits and 2 hairline fractures on the surface (a frame wrapped on the cylinder: x along, angle around), seen from above and the +z side
  const wrap = (x, a, off) => { const r = rad0(x) + off; return [CX + x, CY + Math.cos(a) * r, CZ + Math.sin(a) * r]; };
  const pits = new B();
  for (let i = 0; i < 106; i++) {
    const x = rr(i, 64, -L / 2 + 0.02, L / 2 - 0.02), a = rr(i, 65, 0, TAU), d = rr(i, 66, 0.002, 0.012), n = 5 + (i % 3), cN = mixc(col("#72533B"), col("#493526"), hh(i, 67));
    const c = wrap(x, a, 0.0012); const ring = []; for (let k = 0; k < n; k++) { const t = (k / n) * TAU + hh(i, 68 + k) * 0.5, q = d / 2 * (0.6 + 0.6 * hh(i, 80 + k)); ring.push(wrap(x + Math.cos(t) * q, a + (Math.sin(t) * q) / R, 0.0012)); }
    for (let k = 0; k < n; k++) pits.tri(c, ring[k], ring[(k + 1) % n], mixc(CORE, cN, 0.3 + 0.6 * hh(i, 69)));
  }
  for (let f = 0; f < 2; f++) { const x0 = rr(f, 90, -0.4, 0.3), a0 = rr(f, 91, 1.0, 2.6), len = rr(f, 92, 0.04, 0.08), pts = []; for (let k = 0; k <= 6; k++) pts.push(wrap(x0 + (len * k) / 6, a0 + 0.02 * Math.sin(k * 2 + f) + (hh(f * 7 + k, 93) - 0.5) * 0.05, 0.0014)); for (let k = 0; k < 6; k++) { const o = [0, 0.0014, 0.0014]; pits.quad(add3(pts[k], [0, 0, 1], 0.0007), add3(pts[k + 1], [0, 0, 1], 0.0007), add3(pts[k + 1], [0, 0, -1], 0.0007), add3(pts[k], [0, 0, -1], 0.0007), col("#654B38")); } }
  put(kc, M, root, { cast: true }); put(pits, markMat(), root, { solid: false });
  return { grip: 0, apply(ps) {
    const roll = clamp(num(ps, S, "roll", 0)), drill = clamp(num(ps, S, "drill", 0));
    P.root.rotation.z -= (ps.roll ?? 0) * D2R;   // the engine's own `roll` is a one-degree lean about z: this kind takes the name for the cart, so undo the lean
    cart.position.z = 0.85 * roll; for (const w of wheels) w.rotation.x = (0.85 * roll) / 0.105;
    car.position.y = 1.55 - 0.33 * drill; stem.rotation.y = 4 * drill * TAU;
  } };
}

// ===============================================================================================================
// saltslice: a Member II section with salt in its pores (DESIGN section 7). Local frame: origin bottom centre, the section faces +z.
const SALT_C = { FS: "#D5AE79", FH: "#E9CA96", WS: "#B48860", WH: "#D8B17E", SEAM: "#826344", DAMP: "#657478", DEDGE: "#8EACAC", CAP: "#65858B", PIT: "#72533B", INK: "#493526", CRACK: "#654B38", SB: "#F0EEE2", SL: "#FFFAEB", SS: "#B8C6C7", FLAKE: "#F3D5A5" };
function buildSalt(P) {
  const S = P.spec, root = P.whole, M = vmat(), ZF = 0.33, ZB = -0.33, HX = 1.2, HY = 1.75;
  const C = Object.fromEntries(Object.entries(SALT_C).map(([k, v]) => [k, col(v)]));
  // ---- the upper chips along the top edge: six V bites 0.035-0.080 deep
  const NOTCH = []; for (let n = 0; n < 6; n++) { const d = rr(n, 211, 0.035, 0.08); NOTCH.push({ x: rr(n, 210, -1.0, 1.0), d, w: d * 1.15 }); }
  const ytop = (x) => { let y = HY; for (const n of NOTCH) { const t = 1 - Math.abs(x - n.x) / n.w; if (t > 0) y = Math.min(y, HY - n.d * t); } return y - 0.005 * (0.5 + 0.5 * Math.sin(41 * x + 1)); };
  // ---- the beds: three seam traces split the section into four beds, soft / hard alternating
  const SEAMS = [0, 1, 2].map((k) => ({ y: [0.52, 1.0, 1.43][k] + rr(k, 205, -0.04, 0.04), t: rr(k, 206, 0.025, 0.06) }));
  const seamY = (x, k) => SEAMS[k].y + 0.012 * Math.sin(5 * x + 2 * k) + 0.006 * Math.sin(17 * x + k);
  const nz = (x, y) => 0.5 + 0.25 * Math.sin(x * 11.3 + y * 5.1) + 0.15 * Math.sin(x * 23.7 - y * 17.9 + 1.3) + 0.1 * Math.sin(y * 31 + x * 7);
  const baseCol = (x, y) => {
    let band = 0; for (let k = 0; k < 3; k++) if (y > seamY(x, k)) band++;
    const wf = 0.15 + 0.5 * nz(x * 0.8 + 3, y), c = band % 2 === 0 ? mixc(C.FH, C.WH, wf) : mixc(C.FS, C.WS, wf);
    let out = mulc(c, 0.94 + 0.12 * nz(x * 2.3, y * 1.7));
    for (let k = 0; k < 3; k++) { const d = Math.abs(y - seamY(x, k)) / (SEAMS[k].t / 2); if (d < 1) out = mixc(out, C.SEAM, 0.85 * (1 - d * d)); }
    return out;
  };
  const front = (x, damp) => lerp(0.12, 1.27, damp) + 0.043 * Math.sin(9 * x);
  const faceColor = (x, y, damp) => {
    let c = baseCol(x, y); const f = front(x, damp), t = clamp((f - y) / 0.075);
    if (t > 0) c = mixc(mulc(c, 0.93), C.DAMP, 0.52 * t);
    const e = Math.abs(y - (f - 0.012)) / 0.02; if (e < 1) c = mixc(c, C.DEDGE, 0.3 * (1 - e) * (damp > 0.001 || f > 0.121 ? 1 : 0.6));
    return c;
  };
  // ---- the pores: a 16 x 10 lattice, 7-point irregular holes cut through the face, each with its walls
  const colE = [-1.2]; for (let c = 1; c <= 16; c++) colE.push(-1.166 + 0.132 * c); colE.push(1.073, 1.2);
  const rowE = [0]; for (let r = 1; r <= 9; r++) rowE.push(0.014 + 0.1722 * r);
  const SEAT = { cx: 1.02, cy: 1.13, depth: 0.071, thick: 0.037 };
  SEAT.pts = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + (hh(k, 220) - 0.5) * 0.25, q = 0.88 + 0.2 * hh(k, 221); SEAT.pts.push([SEAT.cx + Math.cos(a) * 0.155 * q, SEAT.cy + Math.sin(a) * 0.14 * q]); }
  const inPoly = (poly, x, y) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
  const distPoly = (poly, x, y) => { let m = 1e9; for (let i = 0; i < poly.length; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); m = Math.min(m, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return m; };
  const PORES = [];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 16; c++) {
    const i = r * 16 + c, x0 = colE[c], x1 = colE[c + 1], y0 = rowE[r], y1 = r === 9 ? HY : rowE[r + 1];
    let rad = rr(i, 203, 0.008, 0.042), x = -1.1 + (1.98 / 15) * c + rr(i, 201, -0.02, 0.02), y = 0.1 + (1.55 / 9) * r + rr(i, 202, -0.02, 0.02);
    const inset = clamp(lerp(0.009, 0.055, (rad - 0.008) / 0.034) * (0.75 + 0.5 * hh(i, 204)), 0.009, 0.055);
    // keep the rim inside its cell (and under the top bites)
    for (let tries = 0; tries < 8; tries++) {
      const rm = rad * 1.18 + 0.004; x = clamp(x, x0 + rm, x1 - rm); y = Math.max(y0 + rm, y);
      if (r === 9) { let ym = 9; for (let k = -4; k <= 4; k++) ym = Math.min(ym, ytop(x + (k / 4) * rm)); if (y + rm + 0.008 > ym) { y = ym - rm - 0.008; if (y - rm < y0 + 0.004) { rad *= 0.85; continue; } } }
      else y = Math.min(y, y1 - rm);
      break;
    }
    const rim = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + (hh(i, 270 + k) - 0.5) * 0.5, q = 0.82 + 0.36 * hh(i, 280 + k); rim.push([x + Math.cos(a) * rad * q, y + Math.sin(a) * rad * q]); }
    PORES.push({ i, c, r, x, y, rad, inset, rim, alive: true });
  }
  let hidden = 0;
  for (const p of PORES) if (p.c >= 15 && p.r >= 5 && p.r <= 7) { if (inPoly(SEAT.pts, p.x, p.y) || distPoly(SEAT.pts, p.x, p.y) < p.rad * 1.2 + 0.008) { p.alive = false; hidden++; } }
  // ---- the face: every cell is its own small polygon, pores and the flake seat as holes
  const FB = new B(), meta = [];
  const fv = (x, y, z, nzz, f = 0, tint = null) => { const i = FB.vert(x, y, z, 0, 0, nzz, faceColor(x, y, 0)); meta[i] = { x, y, f, tint }; return i; };
  const nH = (a, b) => Math.max(1, Math.ceil((b - a) / 0.035 - 1e-9)), ex = (a, b) => { const n = nH(a, b), o = []; for (let k = 0; k <= n; k++) o.push(a + ((b - a) * k) / n); return o; };
  const topXs = (a, b) => { const set = new Set(); const n = Math.max(1, Math.ceil((b - a) / 0.02)); for (let k = 0; k <= n; k++) set.add(a + ((b - a) * k) / n); for (const nn of NOTCH) for (const v of [nn.x - nn.w, nn.x, nn.x + nn.w]) if (v > a + 1e-4 && v < b - 1e-4) set.add(v); return [...set].sort((p, q) => q - p); };   // descending
  const tris2 = (contour, holes) => {
    const all = [contour, ...holes].flat(), v2 = contour.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const idx = []; for (const t of THREE.ShapeUtils.triangulateShape(v2, h2)) idx.push(t);
    return { all, idx };
  };
  const emit = (contour, holes) => {
    const { all, idx } = tris2(contour, holes), ids = all.map((p) => fv(p[0], p[1], ZF, 1));
    for (const [a, b, c] of idx) { const A = all[a], Bp = all[b], Cp = all[c], area = (Bp[0] - A[0]) * (Cp[1] - A[1]) - (Bp[1] - A[1]) * (Cp[0] - A[0]); if (area > 0) FB.i.push(ids[a], ids[b], ids[c]); else FB.i.push(ids[a], ids[c], ids[b]); }
  };
  const ring = (xa, xb, ya, yb, topf) => {   // a cell contour, CCW, start inclusive / end exclusive per side
    const out = [], xs = ex(xa, xb), nx = xs.length - 1;
    for (let k = 0; k < nx; k++) out.push([xs[k], ya]);
    const yR = topf ? topf(xb) : yb, nyR = nH(ya, yR); for (let k = 0; k < nyR; k++) out.push([xb, ya + ((yR - ya) * k) / nyR]);
    if (topf) for (const x of topXs(xa, xb)) { if (Math.abs(x - xa) > 1e-9) out.push([x, topf(x)]); } else for (let k = nx; k > 0; k--) out.push([xs[k], yb]);
    const yL = topf ? topf(xa) : yb, nyL = nH(ya, yL); for (let k = nyL; k > 0; k--) out.push([xa, ya + ((yL - ya) * k) / nyL]);
    return out;
  };
  const gridCell = (xa, xb, ya, yb) => {
    const xs = ex(xa, xb), ys = ex(ya, yb), id = []; for (let i = 0; i < xs.length; i++) { id[i] = []; for (let j = 0; j < ys.length; j++) id[i][j] = fv(xs[i], ys[j], ZF, 1); }
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) FB.i.push(id[i][j], id[i + 1][j], id[i + 1][j + 1], id[i][j], id[i + 1][j + 1], id[i][j + 1]);
  };
  const poreById = (c, r) => PORES[r * 16 + c];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 18; c++) {
    if (c >= 15 && r >= 5 && r <= 7) continue;   // the seat block below
    const xa = colE[c], xb = colE[c + 1], ya = rowE[r], yb = r === 9 ? HY : rowE[r + 1], p = c < 16 ? poreById(c, r) : null;
    if (r === 9) emit(ring(xa, xb, ya, yb, ytop), p && p.alive ? [p.rim] : []);
    else if (p && p.alive) emit(ring(xa, xb, ya, yb), [p.rim]);
    else gridCell(xa, xb, ya, yb);
  }
  {   // the seat block: x 0.814-1.2, y 0.875-1.391: the flake seat and whatever lattice pores fit beside it
    const xa = colE[15], xb = colE[18], ya = rowE[5], yb = rowE[8], out = [];
    for (let c = 15; c < 18; c++) { const xs = ex(colE[c], colE[c + 1]); for (let k = 0; k < xs.length - 1; k++) out.push([xs[k], ya]); }
    for (let r = 5; r < 8; r++) { const ys = ex(rowE[r], rowE[r + 1]); for (let k = 0; k < ys.length - 1; k++) out.push([xb, ys[k]]); }
    for (let c = 17; c >= 15; c--) { const xs = ex(colE[c], colE[c + 1]); for (let k = xs.length - 1; k > 0; k--) out.push([xs[k], yb]); }
    for (let r = 7; r >= 5; r--) { const ys = ex(rowE[r], rowE[r + 1]); for (let k = ys.length - 1; k > 0; k--) out.push([xa, ys[k]]); }
    const holes = [SEAT.pts.map((q) => q)]; for (let r = 5; r < 8; r++) { const p = poreById(15, r); if (p.alive) holes.push(p.rim); }
    emit(out, holes);
  }
  // pore walls: rim -> mid ring -> floor ring -> centre, shaded by depth
  const PITC = C.PIT, INKC = C.INK;
  for (const p of PORES) {
    if (!p.alive) continue;
    const rings = [[1, 0, 0.3, PITC], [0.78, 0.5, 0.58, PITC], [0.42, 1.0, 0.8, INKC]], R = rings.map(([s, dz]) => p.rim.map(([x, y]) => [p.x + (x - p.x) * s, p.y + (y - p.y) * s, ZF - p.inset * dz]));
    const vid = (pt, f, tint) => fv(pt[0], pt[1], pt[2], 1, f, tint);
    for (let s = 0; s < 2; s++) for (let k = 0; k < 7; k++) {
      const k2 = (k + 1) % 7, a = R[s][k], b = R[s][k2], c = R[s + 1][k2], d = R[s + 1][k], mx = (a[0] + b[0] + c[0] + d[0]) / 4, my = (a[1] + b[1] + c[1] + d[1]) / 4, out = [p.x - mx, p.y - my, 0.55];
      const q = [a, b, c, d], fs = [rings[s][2], rings[s][2], rings[s + 1][2], rings[s + 1][2]], ts = [rings[s][3], rings[s][3], rings[s + 1][3], rings[s + 1][3]];
      const n = norm3(cross3(sub3(b, a), sub3(c, a))), flip = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0, ord = flip ? [0, 3, 2, 1] : [0, 1, 2, 3];
      const ids = ord.map((o) => { const v = FB.vert(q[o][0], q[o][1], q[o][2], flip ? -n[0] : n[0], flip ? -n[1] : n[1], flip ? -n[2] : n[2], faceColor(q[o][0], q[o][1], 0)); meta[v] = { x: q[o][0], y: q[o][1], f: fs[o], tint: ts[o] }; return v; });
      FB.i.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
    }
    const cz = [p.x, p.y, ZF - p.inset * 1.02], ctr = FB.vert(cz[0], cz[1], cz[2], 0, 0, 1, faceColor(p.x, p.y, 0)); meta[ctr] = { x: p.x, y: p.y, f: 0.9, tint: INKC };
    const base = FB.nv; for (let k = 0; k < 7; k++) { const q = R[2][k], v = FB.vert(q[0], q[1], q[2], 0, 0, 1, faceColor(q[0], q[1], 0)); meta[v] = { x: q[0], y: q[1], f: 0.8, tint: INKC }; }
    for (let k = 0; k < 7; k++) FB.i.push(ctr, base + k, base + (k + 1) % 7);
  }
  // the seat: dark walls down 0.071, a pale fracture floor
  const seatZ = ZF - SEAT.depth, FLK = C.FLAKE;
  for (let k = 0; k < 8; k++) {
    const a = SEAT.pts[k], b = SEAT.pts[(k + 1) % 8], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], out = [SEAT.cx - mid[0], SEAT.cy - mid[1], 0];
    const q = [[a[0], a[1], ZF], [b[0], b[1], ZF], [b[0], b[1], seatZ], [a[0], a[1], seatZ]], cc = [mulc(C.SEAM, 0.9), mulc(C.SEAM, 0.9), mulc(C.SEAM, 0.55), mulc(C.SEAM, 0.55)];
    const n = norm3(cross3(sub3(q[1], q[0]), sub3(q[2], q[0]))), flip = n[0] * out[0] + n[1] * out[1] < 0, ord = flip ? [0, 3, 2, 1] : [0, 1, 2, 3], ids = ord.map((o) => FB.vert(q[o][0], q[o][1], q[o][2], flip ? -n[0] : n[0], flip ? -n[1] : n[1], flip ? -n[2] : n[2], cc[o]));
    FB.i.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
  }
  { const ctr = FB.vert(SEAT.cx, SEAT.cy, seatZ, 0, 0, 1, mulc(FLK, 0.86)), base = FB.nv; for (let k = 0; k < 8; k++) FB.vert(SEAT.pts[k][0], SEAT.pts[k][1], seatZ + 0.003 * (hh(k, 222) - 0.5), 0, 0, 1, mulc(FLK, 0.7 + 0.2 * hh(k, 223))); for (let k = 0; k < 8; k++) FB.i.push(ctr, base + k, base + (k + 1) % 8); }
  // ---- the block behind the face: sides, back, and the top following the bites
  const bodyCol = (x, y, z) => mulc(baseCol(x * 0.6 + z * 1.7, y), 0.82);
  const addBody = (b, mt) => {
    const mv = (c, x, y) => c;
    for (const sx of [-1, 1]) {
      const f = (u, v) => [sx * HX, v * (sx === 1 ? ytop(HX - 0.0) : ytop(-HX)), lerp(ZB, ZF, u)];
      b.grid(6, 36, f, (u, v, p) => { const c = bodyCol(sx * HX, p[1], p[2]); return c; }, { flip: sx < 0 });
    }
    b.grid(30, 36, (u, v) => [lerp(-HX, HX, u), v * ytop(lerp(-HX, HX, u)), ZB], (u, v, p) => bodyCol(p[0], p[1], 0), { flip: true });
    const nx = 120; b.grid(nx, 6, (u, v) => { const x = lerp(-HX, HX, u); return [x, ytop(x) + 0.004 * Math.sin(x * 53 + v * 9) * v, lerp(ZF, ZB, v)]; }, (u, v, p) => mulc(mixc(baseCol(p[0], 1.6), C.FH, 0.35), 0.96 + 0.1 * hh(Math.floor(u * 120) * 7 + Math.floor(v * 6), 290)));
  };
  addBody(FB, null);
  // the damp front is repainted into every vertex colour: faceColor(x, y, damp) with the same tint rule
  const faceGeo = FB.geo(), faceMesh = put(faceGeo, M, root, { cast: true });
  // ---- the flake: 8 fracture vertices shared with the seat, 0.31 x 0.28 x 0.037, flush with the face
  const fk = new THREE.Group(), fZ = ZF - SEAT.thick / 2; fk.position.set(SEAT.cx, SEAT.cy, fZ); root.add(fk);
  const KB = new B(), kmeta = [];
  { const kv = (x, y, z, n, c, f = 0, tint = null) => { const i = KB.vert(x, y, z, n[0], n[1], n[2], c); kmeta[i] = { x: x + SEAT.cx, y: y + SEAT.cy, f, tint }; return i; };
    const pts = SEAT.pts.map(([x, y]) => [(x - SEAT.cx) * 0.99, (y - SEAT.cy) * 0.99]), hz = SEAT.thick / 2;
    const ctr = kv(0, 0, hz, [0, 0, 1], faceColor(SEAT.cx, SEAT.cy, 0)), mid = pts.map(([x, y]) => kv(x * 0.55, y * 0.55, hz, [0, 0, 1], faceColor(x * 0.55 + SEAT.cx, y * 0.55 + SEAT.cy, 0))), rim = pts.map(([x, y]) => kv(x, y, hz, [0, 0, 1], faceColor(x + SEAT.cx, y + SEAT.cy, 0)));
    for (let k = 0; k < 8; k++) { const k2 = (k + 1) % 8; KB.i.push(ctr, mid[k], mid[k2], mid[k], rim[k], rim[k2], mid[k], rim[k2], mid[k2]); }
    const back = pts.map(([x, y], k) => [x * 0.96, y * 0.96, -hz + 0.004 * (hh(k, 224) - 0.5)]);
    for (let k = 0; k < 8; k++) {   // the fracture sides and back: warm flake colour
      const k2 = (k + 1) % 8, a = [pts[k][0], pts[k][1], hz], b = [pts[k2][0], pts[k2][1], hz];
      KB.facing(a, back[k], back[k2], b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], mulc(FLK, 0.82 + 0.12 * hh(k, 225)));
      KB.tri([0, 0, -hz - 0.002], back[k2], back[k], mulc(FLK, 0.95));
    }
  }
  const flakeMesh = put(KB, M, fk, { cast: true });
  // ---- 8 release chips and 12 more fracture chips on the seat rim; 16 spalls on the ground in front
  const CH = []; const chB = new B();
  for (let i = 0; i < 8; i++) { const k = i, a = SEAT.pts[k], b = SEAT.pts[(k + 1) % 8], t = 0.3 + 0.4 * hh(i, 300), s = rr(i, 301, 0.009, 0.031), cx = lerp(a[0], b[0], t) + (a[0] - SEAT.cx) * 0.06, cy = lerp(a[1], b[1], t) + (a[1] - SEAT.cy) * 0.06; CH.push({ cx, cy, s, k: rr(i, 302, 0.4, 1.35), spin: rr(i, 303, 0.6, 2.2) }); }
  const chipLocal = (s, i) => { const pts = []; for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + hh(i, 310 + k) * 0.8, q = s * (0.45 + 0.4 * hh(i, 320 + k)); pts.push([Math.cos(a) * q, Math.sin(a) * q]); } return pts; };
  for (const ch of CH) { const pts = chipLocal(ch.s, CH.indexOf(ch)), ap = [0, 0, ch.s * 0.35]; for (let k = 0; k < 5; k++) { const a = [pts[k][0], pts[k][1], 0], b = [pts[(k + 1) % 5][0], pts[(k + 1) % 5][1], 0]; chB.tri(a, b, ap, mulc(FLK, 1.0), mulc(FLK, 0.85), mulc(col(SALT_C.SL), 0.95)); } chB.tri([pts[0][0], pts[0][1], 0], [pts[2][0], pts[2][1], 0], [pts[1][0], pts[1][1], 0], mulc(FLK, 0.7)); chB.tri([pts[0][0], pts[0][1], 0], [pts[3][0], pts[3][1], 0], [pts[2][0], pts[2][1], 0], mulc(FLK, 0.7)); chB.tri([pts[0][0], pts[0][1], 0], [pts[4][0], pts[4][1], 0], [pts[3][0], pts[3][1], 0], mulc(FLK, 0.7)); ch.v0 = chB.nv - 24 - 3 * 0; }
  const chipGeo0 = chB.geo(), chipBase = chipGeo0.attributes.position.array.slice(); let chipVerts = [];
  { let v = 0; for (const ch of CH) { ch.vs = v; v += 5 * 3 + 9; ch.vn = 24; } }
  const chipMesh = put(chipGeo0, M, root, { cast: true });
  const sp = new B();   // static spalls and fracture chips
  for (let i = 0; i < 12; i++) { const a = rr(i, 330, 0, TAU), q = 0.17 + 0.05 * hh(i, 331), s = rr(i, 332, 0.008, 0.03), x = SEAT.cx + Math.cos(a) * q * 1.1, y = SEAT.cy + Math.sin(a) * q * 0.98, pts = chipLocal(s, 40 + i); sp.fan(FR([x, y, ZF], [1, 0, 0], [0, 1, 0]), pts.map(([u, v]) => [u, v]), 0.0014 + 0.002 * hh(i, 333), mixc(FLK, C.WH, 0.5 * hh(i, 334)), mulc(FLK, 0.85)); }
  for (let i = 0; i < 16; i++) { const x = rr(i, 340, -1.05, 1.25), z = rr(i, 341, 0.36, 0.62), s = rr(i, 342, 0.012, 0.04), pts = chipLocal(s, 60 + i); sp.fan(FR([x, 0.0015, z], [1, 0, 0], [0, 0, -1]), pts.map(([u, v]) => [u, v]), 0.001 + 0.003 * hh(i, 343), mixc(FLK, C.WH, hh(i, 344)), mulc(C.WH, 0.7)); }
  // 83 grains, 0.004-0.014: small lumps on the face between the pores
  for (let i = 0, n = 0; n < 83 && i < 600; i++) {
    const x = rr(i, 350, -1.15, 1.15), y = rr(i, 351, 0.03, 1.7), s = rr(n, 352, 0.004, 0.014);
    if (PORES.some((p) => p.alive && Math.hypot(p.x - x, p.y - y) < p.rad * 1.3 + s) || inPoly(SEAT.pts, x, y) || distPoly(SEAT.pts, x, y) < 0.02 || y > ytop(x) - 0.02) continue;
    n++; const c = mixc(C.SB, baseCol(x, y), 0.4 + 0.4 * hh(n, 353)), a = [x - s / 2, y - s / 2, ZF], b = [x + s / 2, y - s / 2, ZF], cc = [x, y + s / 2, ZF], ap = [x + 0.15 * s, y, ZF + s * 0.55];
    sp.tri(a, b, ap, mulc(c, 0.8)); sp.tri(b, cc, ap, mulc(c, 1.0)); sp.tri(cc, a, ap, mulc(c, 0.9));
  }
  put(sp, M, root, { cast: false });
  // throats: 53 hair channels between neighbouring pores, and the damp-bearing capillaries
  const marks = new B(), fr = FR([0, 0, ZF], [1, 0, 0], [0, 1, 0]), deg = new Map();
  let nt = 0;
  for (let t = 0; t < 400 && nt < 53; t++) {
    const a = PORES[Math.floor(hh(t, 231) * 160)], dc = Math.floor(hh(t, 232) * 3) - 1, dr = Math.floor(hh(t, 233) * 3) - 1; if (!a.alive || (dc === 0 && dr === 0)) continue;
    const cc = a.c + dc, rr_ = a.r + dr; if (cc < 0 || cc > 15 || rr_ < 0 || rr_ > 9) continue; const b = PORES[rr_ * 16 + cc]; if (!b.alive) continue;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, s0 = a.rad * 0.9, s1 = L - b.rad * 0.9, pts = [];
    for (let k = 0; k <= 5; k++) { const s = lerp(s0, s1, k / 5), w = 0.006 * Math.sin(k * 2 + t) * hh(t, 234); pts.push([a.x + ux * s - uy * w, a.y + uy * s + ux * w]); }
    marks.stroke(fr, pts, rr(t, 235, 0.0015, 0.006), 0.0012, mixc(C.PIT, C.INK, 0.5)); nt++; deg.set(a.i, (deg.get(a.i) || 0) + 1); deg.set(b.i, (deg.get(b.i) || 0) + 1);
  }
  put(marks, markMat(), root, { solid: false });
  // capillary branches: 17 ribbons whose tips climb with damp
  const NB = 44, BRS = [];
  for (let b = 0; b < 17; b++) BRS.push({ x0: rr(b, 250, -1.12, 1.12), w: rr(b, 251, 0.005, 0.019), lead: rr(b, 252, 0.04, 0.2), ph: rr(b, 253, 0, TAU), ph2: rr(b, 254, 0, TAU) });
  const brX = (br, y) => br.x0 + 0.035 * Math.sin(5.5 * y + br.ph) + 0.012 * Math.sin(19 * y + br.ph2);
  const mkRib = (c) => { const g = new THREE.BufferGeometry(), n = BRS.length * NB * 2, pos = new Float32Array(n * 3), nr = new Float32Array(n * 3), cl = new Float32Array(n * 3), idx = []; for (let i = 0; i < n; i++) { nr[i * 3 + 2] = 1; cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b; } for (let b = 0; b < BRS.length; b++) for (let j = 0; j < NB - 1; j++) { const a = (b * NB + j) * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nr, 3)); g.setAttribute("color", new THREE.BufferAttribute(cl, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, ZF), 1.6); return g; };
  const ribEdge = mkRib(C.DEDGE), ribCore = mkRib(C.CAP);
  put(ribEdge, markMat({ polygonOffsetFactor: -2 }), root, { solid: false }); put(ribCore, markMat({ polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), root, { solid: false });
  const DY = 1.56 / (NB - 1);
  const setRibs = (damp) => {
    for (const [g, k, z] of [[ribEdge, 1.4, ZF + 0.0009], [ribCore, 1, ZF + 0.0015]]) {
      const pos = g.attributes.position.array;
      BRS.forEach((br, b) => {
        const tip = front(br.x0, damp) + br.lead, jm = Math.min(NB - 1, Math.max(0, Math.floor((tip - 0.01) / DY)));
        for (let j = 0; j < NB; j++) {
          const jj = Math.min(j, jm), y = 0.01 + jj * DY, x = brX(br, y), taper = clamp((jm - jj) / 4), w = (br.w * k * (0.5 + 0.5 * (1 - jj / NB)) * (0.25 + 0.75 * taper)) / 2, o = (b * NB + j) * 6;
          pos[o] = x - w; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + w; pos[o + 4] = y; pos[o + 5] = z;
        }
      });
      g.attributes.position.needsUpdate = true;
    }
  };
  // ---- 31 salt clusters: 30 at crossed pores and the largest behind the flake seat; five six-faced crystals each
  const crystals = [], cb = new B(), crystalCol = (n) => { const d = 0.7 * n[1] + 0.5 * n[2]; return d > 0.5 ? C.SL : d > -0.1 ? C.SB : C.SS; };
  const live = PORES.filter((p) => p.alive), cand = live.filter((p) => deg.get(p.i)).sort((a, b) => hh(a.i, 360) - hh(b.i, 360)), rest = live.filter((p) => !deg.get(p.i)).sort((a, b) => hh(a.i, 361) - hh(b.i, 361));
  const picks = [...cand, ...rest].slice(0, 30);
  const addCluster = (id, px, py, pz, count, spread, e0, e1, seat) => {
    // panel 08: the salt stands on a thin glassy stem that climbs the face out of the pore, a burst of cubes at its tip
    const len = seat ? 0.012 : rr(id, 365, 0.035, 0.11), lean = (hh(id * 31 + 7, 366) - 0.5) * 0.03, tipC = [px + lean, py + len, seat ? pz : ZF + 0.006];
    if (!seat) {
      const path = []; for (let k = 0; k <= 5; k++) { const t = k / 5; path.push([px + lean * t * t + 0.004 * Math.sin(t * 5 + id), py + len * t, lerp(pz, ZF + 0.006, Math.min(1, t * 2))]); }
      const v0 = cb.nv; cb.tube(path, (t) => 0.0045 * (1 - 0.35 * t), 6, (t) => mixc(C.SS, C.SB, 0.4 + 0.5 * t), false); crystals.push({ id, v0, vn: cb.nv - v0, pv: [px, py, pz], seat: false });
    }
    for (let k = 0; k < count; k++) {
      const key = id * 31 + k, e = rr(key, 370, e0, e1), ox = (hh(key, 371) - 0.5) * 2 * spread, oy = (hh(key, 372) - 0.5) * 2 * spread, yaw = hh(key, 373) * TAU, pit = (hh(key, 374) - 0.5) * 1.0, rol = (hh(key, 375) - 0.5) * 1.0;
      const m = new THREE.Matrix4().makeTranslation(tipC[0] + ox, tipC[1] + oy, tipC[2] + e * (seat ? 0.5 : 0.35)).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pit, rol, yaw, "XYZ")));
      cb.tf(m); const v0 = cb.nv; const h = e / 2, Q = (n) => crystalCol(new THREE.Vector3(...n).transformDirection(m).toArray());
      cb.quad([h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h], Q([1, 0, 0])); cb.quad([-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h], Q([-1, 0, 0]));
      cb.quad([-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h], Q([0, 1, 0])); cb.quad([-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h], Q([0, -1, 0]));
      cb.quad([-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h], Q([0, 0, 1])); cb.quad([h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h], Q([0, 0, -1]));
      cb.tf(null); crystals.push({ id, v0, vn: 36, pv: [px, py, pz], seat: !!seat });
    }
  };
  picks.forEach((p, n) => addCluster(n, p.x, p.y, ZF - p.inset * 0.55, 5, Math.max(0.004, p.rad * 0.5), 0.009, 0.033, false));
  addCluster(30, SEAT.cx, SEAT.cy, seatZ + 0.002, 14, 0.085, 0.016, 0.033, true);
  const crGeo = cb.geo(), crBase = crGeo.attributes.position.array.slice(), crMesh = put(crGeo, M, root, { cast: true });
  const setCrystals = (grow, damp) => {
    const pos = crGeo.attributes.position.array;
    for (const c of crystals) {
      let s = clamp((grow - 0.25 * hh(c.id, 380)) / 0.75); if (c.seat) s *= damp >= 0.9 ? 1 : 0;
      for (let v = c.v0; v < c.v0 + c.vn; v++) for (let k = 0; k < 3; k++) pos[v * 3 + k] = c.pv[k] + (crBase[v * 3 + k] - c.pv[k]) * s;
    }
    crGeo.attributes.position.needsUpdate = true; crGeo.computeBoundingSphere();
  };
  // ---- the recolouring and the state
  const targets = [[faceGeo, meta], [KB.geo ? flakeMesh.geometry : null, kmeta]].filter((t) => t[0]);
  const paint = (damp) => { for (const [g, mt] of targets) { const ca = g.attributes.color.array; for (let i = 0; i < mt.length; i++) { const m = mt[i]; if (!m) continue; let c = faceColor(m.x, m.y, damp); if (m.f > 0) c = mixc(c, m.tint, m.f); ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; } g.attributes.color.needsUpdate = true; } };
  const chipPos = chipGeo0.attributes.position.array;
  const setPop = (p) => {
    fk.position.set(SEAT.cx + 0.25 * p, SEAT.cy + 0.05 * p - 0.3 * p * p, fZ + 0.23 * p); fk.rotation.set(0, 37 * p * D2R, 22 * p * D2R, "XYZ");
    const tx = 0.25 * p, ty = 0.05 * p - 0.3 * p * p, tz = 0.23 * p;
    CH.forEach((ch, i) => {
      const an = ch.spin * p * 2.2, ca = Math.cos(an), sa = Math.sin(an);
      for (let v = ch.vs; v < ch.vs + ch.vn; v++) { const lx = chipBase[v * 3], ly = chipBase[v * 3 + 1], lz = chipBase[v * 3 + 2], rx = lx * ca - lz * sa, rz = lx * sa + lz * ca; chipPos[v * 3] = ch.cx + rx + tx * ch.k; chipPos[v * 3 + 1] = ch.cy + ly + ty * ch.k - 0.6 * p * p; chipPos[v * 3 + 2] = ZF + rz + tz * ch.k; }
    });
    chipGeo0.attributes.position.needsUpdate = true; chipGeo0.computeBoundingSphere();
  };
  let last = "";
  const apply = (ps) => {
    const damp = clamp(num(ps, S, "damp", 0)), grow = clamp(num(ps, S, "grow", 0)), pop = clamp(num(ps, S, "pop", 0)), key = `${damp}|${grow}|${pop}`;
    if (key === last) return; last = key; paint(damp); setRibs(damp); setCrystals(grow, damp); setPop(pop);
  };
  apply({}); 
  P.whole.userData.hiddenPores = hidden;
  return { grip: 0, apply };
}

// ===============================================================================================================
// hiddenhall: the secret library under the right paw, a cutaway (DESIGN section 6). WORLD frame: the shell bottom centre sits at (11.30, -5.60, 2.17).
const HALL_ORG = [11.3, -5.6, 2.17];
function buildHall(P) {
  const S = P.spec, root = P.whole, hall = new THREE.Group(); hall.position.set(...HALL_ORG); root.add(hall);
  const SX = 3.8, SH = 5.6, SZB = 5.6, RX = 2.8, FL = 0.24, CE = 3.42, ZBK = -4.6, NOTCH_X = 1.23, NOTCH_TOP = 4.68, NZ0 = 3.03;
  // the +z section plane: spec.cut (default 1.6, through the stair bay); the stair void in the roof only shows when the cut is past z 3.03
  const ZC = clamp(S.cut ?? 2.4, 0.9, 5.6), SZ = ZC, hasNotch = ZC > NZ0 + 0.01;
  const soff = (z) => (z < NZ0 ? CE : z > 5.08 ? NOTCH_TOP : lerp(CE, NOTCH_TOP, (z - NZ0) / (5.08 - NZ0))), NT = soff(ZC);
  const SEC = col("#8F694A"), MAS = col("#9D744D"), MASD = col("#6B4B37"), WOOD = col("#69492E"), GRAIN = col("#3F2B22"), ROPE = col("#AF8A50");
  const nz = (x, y) => 0.5 + 0.25 * Math.sin(x * 9.3 + y * 4.1) + 0.15 * Math.sin(x * 21.7 - y * 15.9 + 1.3) + 0.1 * Math.sin(y * 29 + x * 5);
  // ---- six strata 0.20-0.47 thick in the exposed rock
  const STR = []; for (let k = 0; k < 6; k++) { const t = rr(k, 400, 0.2, 0.47), y0 = 0.45 + k * 0.86 + rr(k, 401, -0.1, 0.18); STR.push([y0, y0 + t]); }
  const strIdx = (y) => STR.findIndex(([a, b]) => y >= a && y <= b);
  const rockCol = (x, y, z, idx) => { let c = idx < 0 ? SEC : idx % 2 ? mixc(SEC, col("#493526"), 0.4) : mixc(SEC, col("#E2B879"), 0.55); return mulc(c, 0.9 + 0.2 * nz(x * 1.3 + z * 0.7, y * 1.7)); };
  // ---- the exposed rock: the +z cut (with the cavity and the stair notch as holes), the two side faces, the top (the pit floor level)
  const RB = new B();
  const bps = new Set([0, FL, CE, NT, SH]); for (const [a, b] of STR) { bps.add(a); bps.add(b); }
  const ys = [...bps].sort((a, b) => a - b);
  for (let i = 0; i < ys.length - 1; i++) {
    const ya = ys[i], yb = ys[i + 1], ym = (ya + yb) / 2, idx = strIdx(ym), cf = (u, v, p) => rockCol(p[0], p[1], 0, idx);
    let iv = [[-SX, SX]]; if (ya >= FL - 1e-6 && yb <= CE + 1e-6) iv = [[-SX, -RX], [RX, SX]]; else if (ya >= CE - 1e-6 && yb <= NT + 1e-6 && NT > CE) iv = [[-SX, -NOTCH_X], [NOTCH_X, SX]];
    for (const [xa, xb] of iv) RB.plane([0, 0, SZ], [1, 0, 0], [0, 1, 0], xa, xb, ya, yb, 0.25, 0.12, cf);
    for (const sx of [-1, 1]) RB.plane([sx * SX, 0, 0], sx > 0 ? [0, 0, -1] : [0, 0, 1], [0, 1, 0], sx > 0 ? -ZC : -SZB, sx > 0 ? SZB : ZC, ya, yb, 0.55, 0.16, (u, v, p) => rockCol(p[2], p[1], 1, idx));
  }
  const SAND = col("#DEC198"), RIP = col("#C3A278");
  RB.plane([0, SH, 0], [0, 0, 1], [1, 0, 0], -SZB, ZC, -SX, SX, 0.4, 0.4, (u, v, p) => mulc(mixc(SAND, RIP, 0.5 * nz(p[0] * 2, p[2] * 0.6)), 0.95));
  put(RB, vmat(), hall, { cast: true });
  // ---- the room: lit by six lamps, baked into vertex colours (and re-baked when `lamp` moves)
  const IB = new B();
  const stone = (i) => mulc(mixc(MAS, col("#D7B38A"), 0.45), 0.92 + 0.14 * hh(i, 417));
  const STONE = col("#D7B38A"), JOINT = mulc(MASD, 0.5);
  const slabC = (x, z, k) => { const ix = Math.floor(x / 0.7 + 0.001 * k), iz = Math.floor(z / 0.7 + 3); return mulc(mixc(MAS, col("#BE946B"), 0.35 * hh(ix * 31 + iz, 410)), 0.88 + 0.22 * hh(ix * 17 + iz * 5, 411)); };
  const DX0 = -0.55, DX1 = 0.55, DTOP = FL + 2.05, DEEP = 0.55;   // the doorway in the back wall
  // dressed ashlar on a frame fr (a along u, b along v, the face looks along u x v): courses 0.38-0.66, blocks 0.8-1.7 long, laid in broken bond; every block its
  // own pillowed face (a cell grid raised up to 0.022, rim darker, top lighter) with its own tone, a thin dark joint between; cut(a0, a1, b0, b1) -> true skips a block
  const ashlar = (fr, a0, a1, b0, b1, key, o = {}) => {
    const n = norm3(cross3(fr.u, fr.v)), forced = o.forced ?? [], cutR = o.cut ?? [], lMin = o.lMin ?? 0.8, lMax = o.lMax ?? 1.7, hMin = o.hMin ?? 0.38, hMax = o.hMax ?? 0.66, amp = o.amp ?? 0.022, MG = 0.008;
    let v = b0, c = 0, bi = 0;
    const block = (aa, bb, vv0, vv1) => {
      if (bb - aa < 0.12) return; bi++; const id = key * 1009 + bi, A0 = aa + MG, A1 = bb - MG, V0 = vv0 + MG, V1 = vv1 - MG, nu = Math.max(2, Math.round((A1 - A0) / 0.2)), nv = Math.max(2, Math.round((V1 - V0) / 0.17));
      const base = mulc(mixc(mixc(MAS, STONE, 0.15 + 0.5 * hh(id, 604)), col("#C79A62"), 0.2 * hh(id, 608)), 0.82 + 0.3 * hh(id, 605)), ap = amp * (0.6 + 0.8 * hh(id, 603));
      IB.grid(nu, nv, (s, t) => { const h = ap * Math.sqrt(Math.sin(Math.PI * s) * Math.sin(Math.PI * t)) + 0.005 * Math.sin(s * 7 + id) * Math.sin(t * 5 + id * 0.3); return add3(add3(add3(fr.o, fr.u, lerp(A0, A1, s)), fr.v, lerp(V0, V1, t)), n, h); },
        (s, t) => mulc(base, (0.8 + 0.28 * t) * (0.86 + 0.14 * Math.sqrt(Math.sin(Math.PI * s) * Math.sin(Math.PI * t)))));
      if (hh(id, 606) < 0.55) for (let k = 0; k < 3; k++) { const a = lerp(A0 + 0.1, A1 - 0.25, hh(id * 7 + k, 609)), b = lerp(V0 + 0.06, V1 - 0.06, hh(id * 7 + k, 610)), l = rr(id * 7 + k, 611, 0.1, 0.26); IB.stroke(fr, [[a, b], [a + l, b + l * 0.35 * (hh(id + k, 612) - 0.4)]], 0.009, amp + 0.004, mulc(base, 0.62)); }
    };
    while (v < b1 - 0.02) {
      let top = v + rr(key * 100 + c, 600, hMin, hMax); for (const f of forced) if (f > v + 0.05 && f < top + 0.15) top = f; if (b1 - top < 0.22) top = b1; top = Math.min(top, b1);
      let a = a0 - rr(key * 100 + c, 601, 0, lMax * 0.6), k = 0;
      while (a < a1 - 0.02) {
        const e = a + rr(key * 977 + c * 31 + k, 602, lMin, lMax); k++;
        let segs = [[Math.max(a, a0), Math.min(e, a1)]];
        for (const [ca0, ca1, cb] of cutR) if (v < cb - 0.01) segs = segs.flatMap(([s0, s1]) => (s1 <= ca0 || s0 >= ca1 ? [[s0, s1]] : [[s0, Math.min(s1, ca0)], [Math.max(s0, ca1), s1]]));
        for (const [s0, s1] of segs) block(s0, s1, v, top);
        a = e;
      }
      v = top; c++;
    }
  };
  // dark joint planes behind the ashlar (the back wall one leaves the doorway open)
  const JF = () => JOINT;
  IB.plane([0, 0, ZBK], [1, 0, 0], [0, 1, 0], -RX, DX0, FL, CE, 1.4, 1.6, JF); IB.plane([0, 0, ZBK], [1, 0, 0], [0, 1, 0], DX1, RX, FL, CE, 1.4, 1.6, JF); IB.plane([0, 0, ZBK], [1, 0, 0], [0, 1, 0], DX0, DX1, DTOP, CE, 1.2, 1.6, JF);
  IB.plane([RX, 0, 0], [0, 0, 1], [0, 1, 0], ZBK, SZ, FL, CE, 1.5, 1.6, JF); IB.plane([-RX, 0, 0], [0, 0, -1], [0, 1, 0], -SZ, -ZBK, FL, CE, 1.5, 1.6, JF);
  const ZB = Math.min(NZ0, ZC);
  IB.plane([0, CE, 0], [1, 0, 0], [0, 0, 1], -RX, RX, ZBK, ZB, 1.5, 1.5, JF);
  ashlar(FR([0, 0, ZBK], [1, 0, 0], [0, 1, 0]), -RX, RX, FL, CE, 1, { forced: [DTOP], cut: [[DX0, DX1, DTOP]] });
  ashlar(FR([RX, 0, 0], [0, 0, 1], [0, 1, 0]), ZBK, SZ, FL, CE, 2);
  ashlar(FR([-RX, 0, 0], [0, 0, -1], [0, 1, 0]), -SZ, -ZBK, FL, CE, 3);
  ashlar(FR([0, CE, 0], [1, 0, 0], [0, 0, 1]), -RX, RX, ZBK, ZB, 4, { lMin: 1.2, lMax: 2.4, hMin: 0.7, hMax: 1.1, amp: 0.03 });
  if (hasNotch) for (const [xa, xb] of [[-RX, -NOTCH_X], [NOTCH_X, RX]]) IB.plane([0, CE, 0], [1, 0, 0], [0, 0, 1], xa, xb, NZ0, SZ, 0.3, 0.3, (u, v, p) => mulc(MAS, 0.8));
  if (hasNotch) IB.grid(8, 14, (u, v) => { const z = lerp(NZ0, SZ, v); return [lerp(-NOTCH_X, NOTCH_X, u), soff(z), z]; }, (u, v, p) => mulc(MAS, 0.75));
  if (hasNotch) for (const sx of [-1, 1]) IB.grid(14, 3, (u, v) => { const z = lerp(NZ0, SZ, u); return [sx * NOTCH_X, lerp(CE, soff(z), v), z]; }, (u, v, p) => mulc(MAS, 0.78), { flip: sx > 0 });
  // the floor: flags, thin dark joints (4 mm proud)
  IB.plane([0, FL, 0], [0, 0, 1], [1, 0, 0], ZBK - DEEP, SZ, -RX, RX, 0.2, 0.2, (u, v, p) => slabC(p[0], p[2], 0));
  { const fl = FR([0, FL, 0], [0, 0, 1], [1, 0, 0]), jw = (i) => rr(i, 413, 0.009, 0.016), JL = mulc(MASD, 0.7);
    for (let k = 0; ZBK + 0.7 * k < SZ; k++) { const z = ZBK + 0.7 * k; IB.stroke(fl, [[z, -RX], [z + 0.01, 0], [z, RX]], jw(k), 0.003, JL); }
    for (let k = 0; k < 8; k++) for (let r = 0; r < 15; r++) { const z0 = ZBK + 0.7 * r, x = -RX + 0.7 * k + 0.35 * (r % 2) + 0.2 * (hh(r * 9 + k, 414) - 0.5); if (x > -RX + 0.05 && x < RX - 0.05 && z0 + 0.7 < SZ + 0.7) IB.stroke(fl, [[z0, x], [Math.min(SZ, z0 + 0.7), x]], jw(k + r * 9), 0.003, JL); }
  }
  // the doorway at the back: a recess 0.55 deep, dark; carved jambs, a lintel and a cavetto cornice
  { const DK = mulc(MASD, 0.42), DB = mulc(MASD, 0.3);
    IB.plane([0, 0, ZBK - DEEP], [1, 0, 0], [0, 1, 0], DX0, DX1, FL, DTOP, 0.3, 0.3, () => DB);
    IB.plane([DX0, 0, ZBK], [0, 0, -1], [0, 1, 0], 0, DEEP, FL, DTOP, 0.3, 0.3, () => DK); IB.plane([DX1, 0, ZBK], [0, 0, 1], [0, 1, 0], -DEEP, 0, FL, DTOP, 0.3, 0.3, () => DK);
    IB.plane([0, DTOP, 0], [1, 0, 0], [0, 0, 1], DX0, DX1, ZBK - DEEP, ZBK, 0.3, 0.3, () => DB);
    IB.plane([0, FL, 0], [0, 0, 1], [1, 0, 0], ZBK - DEEP, ZBK, DX0, DX1, 0.3, 0.3, () => mulc(DK, 1.2));
    const sc = stone(300); for (const s of [-1, 1]) { IB.box(s * (0.55 + 0.11), FL + 1.03, ZBK + 0.075, 0.22, 2.06, 0.15, sc); IB.box(s * (0.55 + 0.11), FL + 0.07, ZBK + 0.1, 0.28, 0.14, 0.2, mulc(sc, 0.9)); }
    IB.box(0, DTOP + 0.11, ZBK + 0.09, 1.56, 0.22, 0.18, mulc(sc, 1.05)); IB.box(0, DTOP + 0.27, ZBK + 0.12, 1.84, 0.1, 0.24, mulc(sc, 1.15)); IB.box(0, DTOP + 0.36, ZBK + 0.1, 1.96, 0.07, 0.2, mulc(sc, 1.2));
  }
  // twelve carved pilasters: plinth, base moulding, a fluted shaft 0.23 x 0.26, a neck, a flared bud capital and an abacus; 2.70 high in all; an architrave runs
  // along each side over the shelves
  const frustum = (cx, y0, cz, wx0, wz0, wx1, wz1, h, c) => {
    const P = (sx, sz, w0, w1, y) => [cx + sx * (y === y0 ? w0 : w1) / 2, y, cz + sz * (y === y0 ? wz0 : wz1) / 2], q = (sx, sz, y, w, wz) => [cx + sx * w / 2, y, cz + sz * wz / 2], y1 = y0 + h;
    const s = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) { const [a, b] = [s[k], s[(k + 1) % 4]]; IB.facing(q(a[0], a[1], y0, wx0, wz0), q(b[0], b[1], y0, wx0, wz0), q(b[0], b[1], y1, wx1, wz1), q(a[0], a[1], y1, wx1, wz1), [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2], c); }
    IB.quad(q(-1, -1, y1, wx1, wz1), q(-1, 1, y1, wx1, wz1), q(1, 1, y1, wx1, wz1), q(1, -1, y1, wx1, wz1), mulc(c, 1.08));
  };
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = -4.15 + 0.73 * i, x0 = s * 2.67, c = stone(i + (s > 0 ? 0 : 20)), fx = x0 - s * 0.115;
    IB.box(x0, FL + 0.05, z, 0.33, 0.1, 0.37, mulc(c, 0.9)); IB.box(x0, FL + 0.14, z, 0.28, 0.08, 0.31, mulc(c, 0.98));
    IB.box(x0, FL + 1.24, z, 0.23, 2.12, 0.26, [c, c, mulc(c, 1.05), mulc(c, 0.8), mulc(c, 0.95), mulc(c, 0.9)]);
    const ff = s > 0 ? FR([fx - 0.002, 0, 0], [0, 0, 1], [0, 1, 0]) : FR([fx + 0.002, 0, 0], [0, 1, 0], [0, 0, 1]);
    for (const dz of [-0.075, 0, 0.075]) IB.stroke(ff, s > 0 ? [[z + dz, FL + 0.2], [z + dz, FL + 2.28]] : [[FL + 0.2, z + dz], [FL + 2.28, z + dz]], 0.016, 0.0, mulc(c, 0.55));
    IB.box(x0, FL + 2.33, z, 0.27, 0.06, 0.3, mulc(c, 1.1)); frustum(x0, FL + 2.36, z, 0.24, 0.27, 0.32, 0.52, 0.22, mulc(c, 1.12)); IB.box(x0, FL + 2.62, z, 0.36, 0.08, 0.56, mulc(c, 1.18));
    for (const dz of [-0.1, 0, 0.1]) IB.box(x0 - s * 0.12, FL + 2.5, z + dz, 0.05, 0.16, 0.05, mulc(c, 0.7));
  }
  for (const s of [-1, 1]) IB.box(s * 2.55, FL + 2.8, -2.4, 0.46, 0.2, 4.2, mulc(stone(40 + s), 1.12));
  // four shelf bays a side; the walls of the room sit behind them
  const BAYZ = [-3.65, -2.5, -1.35, -0.2], BOARD0 = FL + 0.36, SCR_B = col("#8F533C"), SCR = col("#D8B67B"), TAB = col("#B9966F"), CUTS = col("#66503B");
  let bayN = 0, nScroll = 0, nTablet = 0;
  const scroll = (cx, y, z, q, r = 0.06) => {
    const x0 = cx - 0.16, x1 = cx + 0.16, bind = mulc(SCR_B, 0.8 + 0.4 * hh(q, 442)), par = mulc(SCR, 0.88 + 0.24 * hh(q, 443));
    IB.tube([[x0, y, z], [x0 + 0.045, y, z], [x1 - 0.045, y, z], [x1, y, z]], [r - 0.002, r, r, r - 0.002], 6, (t) => (t < 0.2 || t > 0.8 ? bind : par), true); nScroll++;
  };
  const tablet = (tx, ty, tz, s, q) => {
    IB.box(tx, ty, tz, 0.065, 0.3, 0.23, mulc(TAB, 0.9 + 0.2 * hh(q, 446))); nTablet++;
    const ff = s > 0 ? FR([tx - 0.0335, ty - 0.12, tz - 0.1], [0, 0, 1], [0, 1, 0]) : FR([tx + 0.0335, ty - 0.12, tz + 0.1], [0, 0, -1], [0, 1, 0]);
    const nI = 5 + (q % 3);
    for (let r = 0; r < nI; r++) { const y0 = 0.035 + (0.2 * r) / nI + 0.01 * hh(q * 9 + r, 447), l = rr(q * 9 + r, 448, 0.08, 0.17), a0 = 0.03 + (0.17 - l) * hh(q * 9 + r, 449); IB.stroke(ff, [[a0, y0], [a0 + l, y0 + 0.004 * (hh(r, 450) - 0.5)]], 0.0075, 0.0012, CUTS); }
  };
  for (const s of [-1, 1]) for (const zc of BAYZ) {
    const xc = s * 2.43, wc = (i, k) => mulc(mixc(WOOD, GRAIN, 0.25 + 0.4 * hh(i, 420 + k)), 0.9 + 0.2 * hh(i, 430 + k));
    for (const e of [-1, 1]) IB.box(xc, FL + 1.16, zc + e * 0.5025, 0.43, 2.32, 0.045, wc(bayN * 2 + (e > 0), 1));
    IB.box(s * 2.63, FL + 1.16, zc, 0.02, 2.32, 1.05, mulc(WOOD, 0.7));
    for (let k = 0; k < 4; k++) {
      const yb = BOARD0 + 0.51 * k, key = bayN * 4 + k; IB.box(xc, yb - 0.0275, zc, 0.43, 0.055, 1.05, wc(key, 2));
      const hasTab = k < 3, cxs = xc - s * 0.03, y1 = yb + 0.06, y2 = yb + 0.06 + 0.108;
      if (hasTab) {   // four scrolls lying, three above them, two tablets standing at the +z end
        for (let j = 0; j < 4; j++) { const q = key * 8 + j; scroll(cxs + (hh(q, 440) - 0.5) * 0.03, y1, zc - 0.44 + 0.12 * j + (hh(q, 441) - 0.5) * 0.01, q); }
        for (let j = 0; j < 3; j++) { const q = key * 8 + 4 + j; scroll(cxs + (hh(q, 440) - 0.5) * 0.03, y2, zc - 0.38 + 0.12 * j, q); }
        for (let j = 0; j < 2; j++) { const q = key * 2 + j; tablet(xc + s * (0.05 + 0.04 * hh(q, 444)), yb + 0.15, zc + 0.145 + 0.26 * j + (hh(q, 445) - 0.5) * 0.02, s, q + j * 5); }
      } else {   // the top shelf: seven across, four above
        for (let j = 0; j < 7; j++) { const q = key * 8 + j; scroll(cxs + (hh(q, 440) - 0.5) * 0.03, y1, zc - 0.435 + 0.145 * j, q); }
        for (let j = 0; j < 4; j++) { const q = key * 8 + 7 + j; scroll(cxs + (hh(q, 440) - 0.5) * 0.03, y1 + 0.108, zc - 0.36 + 0.145 * (j + 0.5) + 0.07 * 0, q); }
      }
    }
    bayN++;
  }
  // the stone table 1.60 x 0.72 x 0.84 centred (0, -2.72), with tablets and scrolls laid on it
  IB.box(0, FL + 0.66, -2.72, 1.6, 0.12, 0.84, stone(90)); for (const sx of [-1, 1]) IB.box(sx * 0.58, FL + 0.3, -2.72, 0.24, 0.6, 0.7, mulc(stone(91 + sx), 0.9));
  { const TT = FL + 0.72, rot = (a, cx, cz) => new THREE.Matrix4().makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(a));
    [[-0.5, -2.62, 0.1], [-0.18, -2.8, -0.2], [0.2, -2.66, 0.35], [0.52, -2.78, -0.12], [0.02, -2.5, 0.05]].forEach(([x, z, a], i) => { IB.tf(rot(a, x, z)); IB.box(0, TT + 0.016 + (i === 4 ? 0.034 : 0), 0, 0.3, 0.032, 0.22, mulc(TAB, 0.9 + 0.2 * hh(i, 460))); IB.tf(null); });
    [[-0.3, -2.92, 0.3], [0.3, -2.48, -0.5]].forEach(([x, z, a], i) => { IB.tf(rot(a, x, z)); IB.tube([[-0.16, TT + 0.06, 0], [-0.115, TT + 0.06, 0], [0.115, TT + 0.06, 0], [0.16, TT + 0.06, 0]], [0.058, 0.06, 0.06, 0.058], 6, (t) => (t < 0.2 || t > 0.8 ? SCR_B : SCR), true); IB.tf(null); });
  }
  // the stair: 16 rises 0.19, treads 0.24, from z 0.78, a 0.46 landing, which runs on to the cut
  for (let k = 0; k < 16 && 0.78 + 0.24 * k < ZC; k++) { const top = FL + 0.19 * (k + 1), z0 = 0.78 + 0.24 * k, len = Math.min(0.24, ZC - z0), c = stone(100 + k); IB.box(0, (top + FL) / 2, z0 + len / 2, 2.46, top - FL, len, [mulc(c, 0.8), mulc(c, 0.8), mulc(c, 1.12), mulc(c, 0.6), mulc(c, 0.7), mulc(c, 0.75)]); IB.box(0, top - 0.004, z0 + len / 2 + 0.005, 2.2, 0.01, len - 0.005, mulc(c, 1.2 - 0.12 * hh(k, 451))); }
  if (ZC > 0.79 && ZC <= 4.62) { const kS = Math.min(15, Math.floor((ZC - 0.78) / 0.24)); ashlar(FR([0, 0, ZC + 0.002], [1, 0, 0], [0, 1, 0]), -1.23, 1.23, FL, FL + 0.19 * (kS + 1), 5, { lMin: 0.55, lMax: 1.05, hMin: 0.28, hMax: 0.42, amp: 0.016 }); }
  if (ZC > 4.63) { const top = FL + 0.19 * 16, c = stone(120); IB.box(0, (top + FL) / 2, (0.78 + 3.84 + SZ) / 2, 2.46, top - FL, SZ - 4.62, [mulc(c, 0.8), mulc(c, 0.8), mulc(c, 1.12), mulc(c, 0.6), mulc(c, 0.7), mulc(c, 0.75)]); }
  // two walls 0.27 thick along the stair, the top line 1.40 over the treads
  for (const s of [-1, 1]) {
    const x0 = s * NOTCH_X, x1 = s * (NOTCH_X + 0.27), xa = Math.min(x0, x1), xb = Math.max(x0, x1), zc = 0.78 + (CE - (FL + 0.19 + 1.4)) / (0.19 / 0.24), poly = [[0.78, FL], [SZ, FL], [SZ, Math.min(CE, FL + 0.19 + 1.4 + (SZ - 0.78) * 0.19 / 0.24)]]; if (zc < SZ) poly.push([zc, CE]); poly.push([0.78, FL + 0.19 + 1.4]);
    const clean = poly.filter((p, i) => i === 0 || Math.hypot(p[0] - poly[i - 1][0], p[1] - poly[i - 1][1]) > 1e-6), c = stone(140 + (s > 0)), V = (x, p) => [x, p[1], p[0]];
    for (let i = 1; i + 1 < clean.length; i++) { IB.triFacing(V(xb, clean[0]), V(xb, clean[i]), V(xb, clean[i + 1]), [1, 0, 0], mulc(c, 0.95)); IB.triFacing(V(xa, clean[0]), V(xa, clean[i]), V(xa, clean[i + 1]), [-1, 0, 0], mulc(c, 0.95)); }
    for (let i = 0; i < clean.length; i++) { const p = clean[i], q = clean[(i + 1) % clean.length], mz = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, cz = (0.78 + SZ) / 2, cy = (FL + CE) / 2; IB.facing(V(xa, p), V(xb, p), V(xb, q), V(xa, q), [0, my - cy, mz - cz], mulc(c, p[1] === q[1] && p[1] > FL + 0.5 ? 1.12 : 0.85)); }
  }
  // six lamps, drawn here (the director places no oillamp props): each a clay bowl 0.31 wide on a stone stand in the aisle, a flame 0.2 high above it; they burn at
  // lamp 0 too, `lamp` only moves the flicker and the baked pools
  const LAMPS = []; for (const s of [-1, 1]) for (const z of [-3.78, -2.17, -0.53]) LAMPS.push({ x: s * 2.05, y: 1.36, z, s });
  const CLAY = col("#8D5030"); const flames = new THREE.Group(); hall.add(flames); const flameG = [], GLOW = [];
  const fmO = new THREE.MeshBasicMaterial({ color: "#F28A32", transparent: true, opacity: 0.97, depthWrite: false, toneMapped: false }), fmI = new THREE.MeshBasicMaterial({ color: "#FFF0B4", transparent: true, opacity: 0.99, depthWrite: false, toneMapped: false }); fmO.userData.noOutline = fmI.userData.noOutline = true;
  const lathe = (cx, cy, cz, prof, seg, colf) => IB.grid(seg, prof.length - 1, (u, v) => { const k = Math.min(prof.length - 1, Math.round(v * (prof.length - 1))), a = u * TAU; return [cx + Math.cos(a) * prof[k][0], cy + prof[k][1], cz + Math.sin(a) * prof[k][0]]; }, colf, { flip: true });
  const BOWL = [[0, 0], [0.07, 0.012], [0.12, 0.05], [0.15, 0.11], [0.158, 0.15], [0.135, 0.158], [0.105, 0.128], [0, 0.105]];
  LAMPS.forEach((L, i) => {
    const sc = stone(60 + i), by = L.y - 0.16, glow = [];
    IB.box(L.x, FL + 0.04, L.z, 0.34, 0.08, 0.34, mulc(sc, 0.9)); IB.box(L.x, FL + 0.11, L.z, 0.26, 0.06, 0.26, sc);
    IB.tube([[L.x, FL + 0.14, L.z], [L.x, FL + 0.4, L.z], [L.x, by - 0.1, L.z]], [0.085, 0.07, 0.06], 10, (t) => mulc(sc, 0.9 + 0.2 * t), false);
    IB.tube([[L.x, FL + 0.46, L.z], [L.x, FL + 0.52, L.z]], [0.095, 0.095], 10, () => mulc(sc, 1.1), true); IB.tube([[L.x, by - 0.16, L.z], [L.x, by - 0.1, L.z]], [0.1, 0.1], 10, () => mulc(sc, 1.12), true);
    lathe(L.x, by, L.z, BOWL, 14, (u, v) => mulc(CLAY, 0.78 + 0.5 * v)); IB.tube([[L.x - 0.16, by + 0.14, L.z], [L.x - 0.2, by + 0.15, L.z]], [0.012, 0.012], 5, () => mulc(CLAY, 0.7), true);
    const g = new THREE.Group(); g.position.set(L.x, by + 0.125, L.z); flames.add(g);
    const o = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.3, 8), fmO), n = new THREE.Mesh(new THREE.ConeGeometry(0.033, 0.19, 7), fmI); o.position.y = 0.15; n.position.y = 0.105;
    for (const m of [o, n]) { m.userData.steam = true; m.frustumCulled = false; m.renderOrder = 6; m.castShadow = m.receiveShadow = false; g.add(m); } flameG.push(g);
    L.f = [L.x, by + 0.125 + 0.14, L.z];
  });
  // a soft round amber haze round each flame (a fan with the alpha falling to 0 at 0.9), facing the section
  { const gp = [], gc = [], gn = []; for (const L of LAMPS) for (let k = 0; k < 10; k++) { const a0 = (k / 10) * TAU, a1 = ((k + 1) / 10) * TAU; gp.push(...L.f, L.f[0] + Math.cos(a0) * 0.9, L.f[1] + Math.sin(a0) * 0.9, L.f[2] + 0.1, L.f[0] + Math.cos(a1) * 0.9, L.f[1] + Math.sin(a1) * 0.9, L.f[2] + 0.1); gn.push(0, 0, 1, 0, 0, 1, 0, 0, 1); gc.push(1, 0.75, 0.36, 0.5, 1, 0.64, 0.28, 0, 1, 0.64, 0.28, 0); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute("normal", new THREE.Float32BufferAttribute(gn, 3)); gg.setAttribute("color", new THREE.Float32BufferAttribute(gc, 4)); gg.computeBoundingSphere();
    const gm = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); gm.userData.noOutline = true;
    const gmesh = new THREE.Mesh(gg, gm); gmesh.renderOrder = 5; gmesh.frustumCulled = false; gmesh.castShadow = gmesh.receiveShadow = false; gmesh.userData.steam = true; hall.add(gmesh);
  }
  // the light of the lamps baked into the room's vertex colours: fill 0.24-0.3, pools of radius 1.26 (DESIGN) plus a wide faint pool of 3.6, and a dark in every corner
  const ipos = IB.p, inor = IB.n, ibase = Float32Array.from(IB.c), nvI = IB.nv, wIdx = [], wVal = [], aoK = new Float32Array(nvI);
  const smoothk = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
  for (let v = 0; v < nvI; v++) {
    const x = ipos[v * 3], y = ipos[v * 3 + 1], z = ipos[v * 3 + 2], d3 = [RX - Math.abs(x), Math.min(y - FL, CE - y), z - ZBK].map((d) => Math.max(0, d)).sort((a, b) => a - b);
    aoK[v] = 0.62 + 0.38 * smoothk(d3[1] / 0.55) * (0.85 + 0.15 * smoothk(d3[0] / 0.3));
    const w = new Array(6).fill(0); let any = false;
    for (let i = 0; i < 6; i++) { const f = LAMPS[i].f, dx = f[0] - x, dy = f[1] - y, dz = f[2] - z, d = Math.hypot(dx, dy, dz), nn = (dx * inor[v * 3] + dy * inor[v * 3 + 1] + dz * inor[v * 3 + 2]) / (d || 1), lam = 0.4 + 0.6 * Math.max(0, nn);
      let t = 0; if (d < 1.26) t += (1 - d / 1.26) ** 2 * lam; if (d < 4.2) t += 0.34 * (1 - d / 4.2) ** 2 * (0.3 + 0.7 * Math.max(0, nn)); if (t > 0) { w[i] = t; any = true; } }
    if (any) { wIdx.push(v); wVal.push(w); }
  }
  const AMB = col("#FFB557"), ig = IB.geo(), imesh = put(ig, vmat(), hall, { cast: true }), ica = ig.attributes.color.array;
  const Ui = LAMPS.map((_, i) => hh(i, 460));
  const bake = (lamp) => {
    for (let v = 0; v < nvI; v++) { ica[v * 3] = ibase[v * 3] * 0.40 * aoK[v]; ica[v * 3 + 1] = ibase[v * 3 + 1] * 0.37 * aoK[v]; ica[v * 3 + 2] = ibase[v * 3 + 2] * 0.38 * aoK[v]; }
    const I = Ui.map((u) => 0.7 * (1 + 0.08 * Math.sin(TAU * lamp + 6.28 * u)));
    wIdx.forEach((v, j) => { let s = 0; for (let i = 0; i < 6; i++) s += I[i] * wVal[j][i]; s *= 3.6 * (0.55 + 0.45 * aoK[v]); ica[v * 3] += ibase[v * 3] * AMB.r * s; ica[v * 3 + 1] += ibase[v * 3 + 1] * AMB.g * s; ica[v * 3 + 2] += ibase[v * 3 + 2] * AMB.b * s; });
    ig.attributes.color.needsUpdate = true;
  };
  // ---- the marks on the exposed rock: bed lines, 54 chips, 80 pits, 18 vein strokes (individual, hashed)
  const MK = new B(), INK = col("#493526"), PIT = col("#72533B"), CRK = col("#654B38"), STN = col("#9B6C4A"), SCT = col("#EED3A8");
  const faces = [{ fr: FR([0, 0, SZ], [1, 0, 0], [0, 1, 0]), a: [-SX, SX], b: [0, SH], hole: (x, y) => (y > FL - 0.05 && y < CE + 0.05 && Math.abs(x) < RX + 0.05) || (y > CE - 0.05 && y < NT + 0.05 && NT > CE && Math.abs(x) < NOTCH_X + 0.05), w: 0.6 },
    { fr: FR([SX, 0, 0], [0, 0, -1], [0, 1, 0]), a: [-SZ, SZB], b: [0, SH], hole: () => false, w: 0.2 }, { fr: FR([-SX, 0, 0], [0, 0, 1], [0, 1, 0]), a: [-SZB, SZ], b: [0, SH], hole: () => false, w: 0.2 }];
  const place = (key, fi, margin) => { for (let t = 0; t < 40; t++) { const f = faces[fi], a = rr(key * 50 + t, 470, f.a[0] + margin, f.a[1] - margin), b = rr(key * 50 + t, 471, margin, SH - margin); if (!f.hole(a, b)) return [a, b]; } return null; };
  const faceOf = (i) => { const u = hh(i, 472); return u < 0.6 ? 0 : u < 0.8 ? 1 : 2; };
  faces.forEach((f, fi) => {   // bed lines along every stratum edge
    STR.forEach(([ya, yb], k) => [ya, yb].forEach((y, e) => {
      const cuts = fi !== 0 || y < FL || y > NT ? [[f.a[0], f.a[1]]] : y <= CE ? [[-SX, -RX], [RX, SX]] : [[-SX, -NOTCH_X], [NOTCH_X, SX]];
      for (const [a0, a1] of cuts) { const pts = [], n = Math.max(2, Math.ceil((a1 - a0) / 0.35)); for (let j = 0; j <= n; j++) { const a = lerp(a0, a1, j / n); pts.push([a, y + 0.012 * Math.sin(a * 3.1 + k * 2 + e) + 0.006 * Math.sin(a * 13 + k)]); } MK.stroke(f.fr, pts, e ? 0.016 : 0.026, 0.002 + 0.001 * e, mixc(SEC, INK, 0.5 + 0.35 * hh(k * 2 + e, 473))); }
    }));
  });
  const rim = (fr, a, b, r, i, nPts, c, off, c2) => { const pts = []; for (let k = 0; k < nPts; k++) { const t = (k / nPts) * TAU + hh(i, 480 + k) * 0.5, q = r * (0.6 + 0.6 * hh(i, 490 + k)); pts.push([a + Math.cos(t) * q, b + Math.sin(t) * q * 0.85]); } MK.fan(fr, pts, off, c, c2 ?? c); };
  for (let i = 0; i < 54; i++) { const fi = faceOf(i), p = place(i, fi, 0.2); if (!p) continue; const r = rr(i, 474, 0.0125, 0.07), fr = faces[fi].fr; rim(fr, p[0], p[1], r, i, 5 + (i % 3), mixc(SEC, SCT, 0.5), 0.0035, mixc(SEC, SCT, 0.35)); rim(fr, p[0] + r * 0.12, p[1] - r * 0.18, r * 0.7, i + 100, 5, mixc(SEC, PIT, 0.7), 0.0042); }
  for (let i = 0; i < 80; i++) { const fi = faceOf(i + 300), p = place(i + 300, fi, 0.1); if (!p) continue; rim(faces[fi].fr, p[0], p[1], rr(i, 475, 0.006, 0.026), i + 200, 7, mixc(SEC, i % 4 ? PIT : INK, 0.4 + 0.5 * hh(i, 476)), 0.003); }
  for (let i = 0; i < 18; i++) { const fi = faceOf(i + 600), p = place(i + 600, fi, 0.3); if (!p) continue; const l = rr(i, 477, 0.13, 0.51), an = rr(i, 478, -0.5, 0.5) + (i % 2 ? 1.2 : 0), pts = [[p[0], p[1]]]; for (let k = 1; k <= 6; k++) pts.push([p[0] + Math.cos(an + 0.35 * (hh(i * 7 + k, 479) - 0.5)) * l * (k / 6), p[1] + Math.sin(an + 0.35 * (hh(i * 7 + k, 481) - 0.5)) * l * (k / 6)]); MK.stroke(faces[fi].fr, pts, rr(i, 482, 0.008, 0.02), 0.0032, i % 3 ? mixc(SEC, STN, 0.8) : mixc(SEC, SCT, 0.7)); }
  put(MK, markMat(), hall, { solid: false });
  let lastLamp = null;
  return { grip: 0, apply(ps, t) {
    const lamp = num(ps, S, "lamp", 0);
    if (lamp !== lastLamp) { lastLamp = lamp; bake(lamp); }
    flameG.forEach((g, i) => { const w = 1 + 0.11 * Math.sin((t ?? 0) * 9.3 + Ui[i] * 6.28) + 0.06 * Math.sin((t ?? 0) * 23 + Ui[i] * 11); g.scale.set(1 + (1 - w) * 0.3, w, 1 + (1 - w) * 0.3); });
  } };
}

// ===============================================================================================================
// savanna: Spud's green, rainy Sahara around the Sphinx (DESIGN section 6). WORLD frame (Sphinx centreline z 0, pit floor y 0).
const SAV = { SOIL: "#586142", TURF: "#546F37", G1: "#37512C", G2: "#678743", G3: "#8CA55D", TRUNK: "#493E33", TGRAIN: "#7B6B50", C1: "#2F472F", C2: "#496536", C3: "#6B8548", WATER: "#566B71", WEDGE: "#C4D9DE", CTOP: "#536477", CBASE: "#293846", HORIZON: "#788A91" };
const ACACIAS = [[-8, -11, 3.5, 6.8], [9, 8, 4.2, 7.8], [-23, 9, 3.7, 7.0], [18, -13, 3.2, 6.0], [-32, -17, 3.0, 5.4], [25, 14, 3.7, 6.5], [-45, 7, 3.1, 5.9], [29, -27, 4.0, 7.4]];
// the Sphinx's plan (DESIGN section 3: loft stations, paws, haunches, tail): the half width at x, for the clearance of the turf
const LOFT = [[-14.6, 0], [-13.3, 2.75], [-11.3, 3.8], [-7, 3.42], [-2, 3.16], [1.8, 3.28], [3.6, 3.5], [5.2, 2.86], [6.1, 0]];
function sphinxHalf(x) {
  let h = 0;
  for (let i = 0; i < LOFT.length - 1; i++) if (x >= LOFT[i][0] && x <= LOFT[i + 1][0]) h = lerp(LOFT[i][1], LOFT[i + 1][1], (x - LOFT[i][0]) / (LOFT[i + 1][0] - LOFT[i][0]));
  if (x >= 4.6 && x <= 14.6) { const e = Math.max(0, x - 13.98) / 0.62; h = Math.max(h, 3.4 * Math.sqrt(Math.max(0, 1 - e * e))); }
  const dx = (x + 10.4) / 2.58; if (Math.abs(dx) < 1) h = Math.max(h, 2.44 + 1.11 * Math.sqrt(1 - dx * dx));
  if (x > -13.7 && x < -8.6) h = Math.max(h, 3.0 + 0.78 * smooth(Math.min((x + 13.7) / 0.8, (-8.6 - x) / 0.8)));
  return h;
}
const sphinxDist = (x, z) => (Math.abs(x) <= 14.6 || (x > -14.6 && x < 14.6) ? Math.abs(z) - sphinxHalf(x) : Math.hypot(x > 0 ? x - 14.6 : x + 14.6, Math.max(0, Math.abs(z) - sphinxHalf(x > 0 ? 14.6 : -14.6))));
const turfY = (x, z) => 0.012 + 0.045 * Math.sin(0.31 * x) * Math.sin(0.43 * z);
function buildSavanna(P) {
  const S = P.spec, root = P.whole, cover = S.cover !== false, storm = S.storm !== false;
  const C = Object.fromEntries(Object.entries(SAV).map(([k, v]) => [k, col(v)]));
  let setGust = () => {}, lastG = null;
  if (cover) {
    const wetK = storm ? 0.88 : 1;
    // ---- the turf r 85: a grid with finer cells near the statue, dropped and bared within 0.18 m of the Sphinx
    const axis = (fine, step, grow, lim) => { const a = [0]; for (let v = step; v <= fine + 1e-9; v += step) { a.push(v); a.unshift(-v); } let s = step * grow, v = fine; while (v < lim) { v += s; s *= grow; a.push(v); a.unshift(-v); } return a; };
    const xs = axis(20, 0.7, 1.2, 86), zs = axis(10, 0.7, 1.2, 86), TB = new B();
    const yAt = (x, z) => { const r = Math.hypot(x, z); let y = r < 80 ? turfY(x, z) : lerp(turfY(x, z), -0.085, smooth((r - 80) / 5)); if (r >= 80) y = lerp(turfY(x, z), -0.085, smooth((r - 80) / 5)); const sd = sphinxDist(x, z); if (sd < 0.68) y = lerp(-0.04, y, smooth((sd - 0.18) / 0.5)); return y; };
    const turfCol = (x, z, y) => {
      const sd = sphinxDist(x, z), n = 0.5 + 0.3 * Math.sin(x * 0.7 + z * 0.4) + 0.2 * Math.sin(x * 2.3 - z * 1.9 + 1);
      const big = 0.5 + 0.5 * Math.sin(x * 0.13 + Math.sin(z * 0.09) * 2.2) * Math.sin(z * 0.17 - x * 0.06 + 1.3), mid = 0.5 + 0.5 * Math.sin(x * 0.41 + z * 0.23 + Math.sin(x * 0.17) * 2);
      let c = mixc(C.G1, C.TURF, 0.35 + 0.5 * big); c = mixc(c, C.G2, clamp(0.55 * mid * big)); c = mixc(c, C.SOIL, clamp(0.04 + 0.22 * n * n * (1 - big) - 0.1));
      const st = 0.5 + 0.5 * Math.sin(x * 1.9 + Math.sin(z * 0.7) * 2) * Math.sin(z * 2.3 - x * 0.5); c = mixc(c, st > 0.62 ? C.G3 : C.G1, 0.22 * Math.abs(st - 0.5) * 2);
      c = mulc(c, wetK * (0.88 + 0.24 * hh(Math.floor(x * 1.5) * 131 + Math.floor(z * 1.5), 500))); return mixc(C.SOIL, c, smooth((sd - 0.1) / 0.6));
    };
    const nx = xs.length, nz_ = zs.length, vi = new Int32Array(nx * nz_).fill(-1), Y = new Float32Array(nx * nz_);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz_; j++) Y[i * nz_ + j] = yAt(xs[i], zs[j]);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz_; j++) {
      const x = xs[i], z = zs[j]; if (Math.hypot(x, z) > 92) continue;
      const yx0 = Y[Math.max(0, i - 1) * nz_ + j], yx1 = Y[Math.min(nx - 1, i + 1) * nz_ + j], yz0 = Y[i * nz_ + Math.max(0, j - 1)], yz1 = Y[i * nz_ + Math.min(nz_ - 1, j + 1)];
      const n = norm3([-(yx1 - yx0) / (xs[Math.min(nx - 1, i + 1)] - xs[Math.max(0, i - 1)]), 1, -(yz1 - yz0) / (zs[Math.min(nz_ - 1, j + 1)] - zs[Math.max(0, j - 1)])]);
      vi[i * nz_ + j] = TB.vert(x, Y[i * nz_ + j], z, n[0], n[1], n[2], turfCol(x, z, Y[i * nz_ + j]));
    }
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz_ - 1; j++) { const a = vi[i * nz_ + j], b = vi[(i + 1) * nz_ + j], c = vi[(i + 1) * nz_ + j + 1], d = vi[i * nz_ + j + 1]; if (a < 0 || b < 0 || c < 0 || d < 0) continue; if (Math.hypot((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2) > 85.5) continue; TB.i.push(a, d, c, a, c, b); }
    put(TB, vmat(), root, { scenery: true, recv: true, noOutline: true, name: "turf" });
    // ---- puddles at the lows of the swell: 12, radii 0.52-1.75
    const trunks = ACACIAS.map(([x, z]) => [x, z]), PUD = [], cands = [];
    for (let k = -8; k <= 8; k++) for (let m = -12; m <= 12; m++) if (Math.abs(k + m) % 2 === 1) { const x = 5.067 + 10.134 * k, z = 3.653 + 7.306 * m; if (Math.hypot(x, z) < 70 && sphinxDist(x, z) > 3.2 && !trunks.some(([a, b]) => Math.hypot(a - x, b - z) < 3.4)) cands.push([x, z]); }
    cands.sort((a, b) => hh(Math.round(a[0] * 7 + a[1] * 3), 510) - hh(Math.round(b[0] * 7 + b[1] * 3), 510));
    cands.slice(0, 12).forEach(([x, z], i) => PUD.push({ x, z, r: rr(i, 511, 0.52, 1.75) }));
    const WB = new B(), WE = new B();
    for (const p of PUD) {
      const y = turfY(p.x, p.z) + 0.026, N = 22;
      for (let k = 0; k < N; k++) { const a0 = (k / N) * TAU, a1 = ((k + 1) / N) * TAU, w0 = 1 + 0.12 * Math.sin(a0 * 3 + p.x), w1 = 1 + 0.12 * Math.sin(a1 * 3 + p.x); const q0 = [p.x + Math.cos(a0) * p.r * w0, y, p.z + Math.sin(a0) * p.r * w0], q1 = [p.x + Math.cos(a1) * p.r * w1, y, p.z + Math.sin(a1) * p.r * w1];
        WB.tri([p.x, y, p.z], q1, q0, mulc(C.WATER, 0.85)); const o0 = [p.x + Math.cos(a0) * (p.r * w0 + 0.05), y, p.z + Math.sin(a0) * (p.r * w0 + 0.05)], o1 = [p.x + Math.cos(a1) * (p.r * w1 + 0.05), y, p.z + Math.sin(a1) * (p.r * w1 + 0.05)]; if (hh(k + p.x * 3, 512) > 0.3) WE.quad(q0, q1, o1, o0, mixc(C.WATER, C.WEDGE, 0.75)); }
    }
    put(WB, vmat({ roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), root, { scenery: true, noOutline: true, name: "puddles" });
    put(WE, markMat(), root, { scenery: true, name: "puddle-edges" });
    const inPud = (x, z, m) => PUD.some((p) => Math.hypot(p.x - x, p.z - z) < p.r * 1.15 + m);
    const free = (x, z, m = 0.18) => sphinxDist(x, z) > m && !trunks.some(([a, b]) => Math.hypot(a - x, b - z) < 0.5) && !inPud(x, z, 0.05);
    // ---- turf patches 0.08-0.25: 1,000 flat clumps in lighter and darker greens, plus 90 broad meadow blotches 0.7-2.1 m (no flowers)
    const PB = new B();
    for (let i = 0, n = 0; n < 600 && i < 3000; i++) {
      const r = 80 * Math.sqrt(hh(i, 520)), a = hh(i, 521) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!free(x, z, 0.3)) continue; n++;
      const s = rr(i, 522, 0.08, 0.25), y = turfY(x, z) + 0.004 + 0.002 * hh(i, 523), c = mulc(mixc(hh(i, 524) < 0.5 ? C.G1 : C.G2, C.TURF, 0.3), wetK), pts = []; for (let k = 0; k < 5; k++) { const t = (k / 5) * TAU + hh(i, 525 + k) * 0.6, q = s * (0.5 + 0.5 * hh(i, 530 + k)); pts.push([Math.cos(t) * q, Math.sin(t) * q]); }
      PB.fan(FR([x, y, z], [1, 0, 0], [0, 0, -1]), pts, 0, c, mulc(c, 0.85));
    }
    for (let i = 0, n = 0; n < 90 && i < 600; i++) {
      const r = 62 * Math.sqrt(hh(i, 600)), a = hh(i, 601) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, s = rr(i, 602, 0.7, 2.1); if (!free(x, z, s + 0.2) || PUD.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + s)) continue; n++;
      const y = turfY(x, z) + 0.006, tone = hh(i, 603), c = mulc(mixc(mixc(C.G1, C.G2, tone), C.TURF, 0.25), wetK * (0.92 + 0.2 * hh(i, 604))), pts = [];
      for (let k = 0; k < 9; k++) { const t = (k / 9) * TAU + hh(i, 605 + k) * 0.35, q = s * (0.62 + 0.45 * hh(i, 620 + k)); pts.push([Math.cos(t) * q * 1.25, Math.sin(t) * q]); }
      PB.fan(FR([x, y, z], [1, 0, 0], [0, 0, -1]), pts, 0, c, mulc(c, 0.9));
    }
    put(PB, vmat(), root, { scenery: true, noOutline: true, name: "turf-patches" });
    // ---- 2,710 tufts: 1,260 within r 25 (3x the DESIGN density) of eight two-segment blades 0.25-0.6 tall; 1,150 on r 25-52 and 300 on r 52-80 in clumps of six
    // one-triangle blades 0.35-0.95 tall (the mid and far ground reads as meadow); a green of its own per tuft; tips sway 6 deg * sin(2 pi gust + 2 pi U)
    const BL = [], BF = [], NB = 6, GRN = [C.G1, C.G2, C.G3, C.TURF], NNEAR = 1260, NMID = 1150, NTOT = 2710;
    const zone = (n) => (n < NNEAR ? 0 : n < NNEAR + NMID ? 1 : 2);
    for (let i = 0, n = 0; n < NTOT && i < 16000; i++) {
      const zn = zone(n);
      let x, z;
      if (zn === 0 && i % 2 === 0) { const r = 25 * Math.sqrt(hh(i, 540)), a = hh(i, 541) * TAU; x = Math.cos(a) * r; z = Math.sin(a) * r; }
      else if (zn === 0) {   // half of the near tufts stand in 260 thick clumps (1.4 m across): the lawn reads as meadow with bare turf between
        const ci = Math.floor(hh(i, 551) * 260), r0 = 25 * Math.sqrt(hh(ci + 500, 540)), a0 = hh(ci + 500, 541) * TAU, rc = 0.7 * Math.sqrt(hh(i, 554)), ac = hh(i, 555) * TAU;
        x = Math.cos(a0) * r0 + Math.cos(ac) * rc; z = Math.sin(a0) * r0 + Math.sin(ac) * rc;
      }
      else {   // clumps: a hashed centre, the tuft within 2.1 m of it
        const ci = Math.floor(hh(i, 551) * (zn === 1 ? 190 : 40)), r0 = zn === 1 ? lerp(25, 52, Math.sqrt(hh(ci, 552))) : lerp(52, 80, Math.sqrt(hh(ci + 99, 552))), a0 = hh(ci, 553) * TAU, rc = 2.1 * Math.sqrt(hh(i, 554)), ac = hh(i, 555) * TAU;
        x = Math.cos(a0) * r0 + Math.cos(ac) * rc; z = Math.sin(a0) * r0 + Math.sin(ac) * rc;
      }
      if (!free(x, z)) continue;
      const near = zn === 0, h0 = near ? 0.25 + 0.35 * Math.pow(hh(i, 542), 0.8) : (0.35 + 0.6 * Math.pow(hh(i, 542), 0.8)) * (zn === 2 ? 1.15 : 1), ty = turfY(x, z) - 0.004, tone = 0.86 + 0.28 * hh(i, 543);
      const cA = mixc(mixc(GRN[Math.floor(hh(i, 556) * 3.99)], GRN[Math.floor(hh(i, 557) * 3.99)], hh(i, 558)), C.G3, 0.08 * hh(i, 559)); n++;
      for (let b = 0; b < (near ? 8 : NB); b++) {
        const q = n * NB + b, sp = near ? 0.18 : 0.22, ox = (hh(q, 544) - 0.5) * sp, oz = (hh(q, 545) - 0.5) * sp, az = hh(q, 546) * TAU;
        (near ? BL : BF).push({ x: x + ox, y: ty, z: z + oz, dx: Math.cos(az), dz: Math.sin(az), h: h0 * (0.62 + 0.5 * hh(q, 547)), w: near ? rr(q, 548, 0.03, 0.07) : rr(q, 548, 0.05, 0.1), bend: rr(q, 549, 8, 33) * D2R, U: hh(q, 550), tone, cA });
      }
    }
    const NBL = BL.length, NBF = BF.length, gpos = new Float32Array(NBL * 15), gcol = new Float32Array(NBL * 15), gnor = new Float32Array(NBL * 15), gidx = new Uint32Array(NBL * 9);
    const fpos = new Float32Array(NBF * 9), fcol = new Float32Array(NBF * 9), fnor = new Float32Array(NBF * 9), fidx = new Uint32Array(NBF * 3);
    BL.forEach((bl, k) => {
      const k0 = bl.tone * wetK, base = mulc(mixc(bl.cA, C.G1, 0.65), k0 * 0.8), mid = mulc(bl.cA, k0), tip = mulc(mixc(bl.cA, C.G3, 0.45), k0 * 1.05), cs = [base, base, mid, mid, tip];
      for (let v = 0; v < 5; v++) { gcol[k * 15 + v * 3] = cs[v].r; gcol[k * 15 + v * 3 + 1] = cs[v].g; gcol[k * 15 + v * 3 + 2] = cs[v].b; gnor[k * 15 + v * 3 + 1] = 1; }
      const o = k * 5; gidx.set([o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4], k * 9);
    });
    BF.forEach((bl, k) => {
      const k0 = bl.tone * wetK, base = mulc(mixc(bl.cA, C.G1, 0.6), k0 * 0.85), tip = mulc(mixc(bl.cA, C.G3, 0.4), k0 * 1.05), cs = [base, base, tip];
      for (let v = 0; v < 3; v++) { fcol[k * 9 + v * 3] = cs[v].r; fcol[k * 9 + v * 3 + 1] = cs[v].g; fcol[k * 9 + v * 3 + 2] = cs[v].b; fnor[k * 9 + v * 3 + 1] = 1; }
      fidx.set([k * 3, k * 3 + 1, k * 3 + 2], k * 3);
    });
    const writeBlade = (k, gustA) => {
      const bl = BL[k], be = bl.bend + gustA, o = k * 15, sx = -bl.dz, sz = bl.dx, h2 = bl.h / 2;
      const a1 = be * 0.5, a2 = be, mx = bl.x + bl.dx * Math.sin(a1) * h2, my = bl.y + Math.cos(a1) * h2, mz = bl.z + bl.dz * Math.sin(a1) * h2, tx = mx + bl.dx * Math.sin(a2) * h2, ty = my + Math.cos(a2) * h2, tz = mz + bl.dz * Math.sin(a2) * h2;
      const w0 = bl.w / 2, w1 = bl.w * 0.35, p = gpos;
      p[o] = bl.x - sx * w0; p[o + 1] = bl.y; p[o + 2] = bl.z - sz * w0; p[o + 3] = bl.x + sx * w0; p[o + 4] = bl.y; p[o + 5] = bl.z + sz * w0;
      p[o + 6] = mx - sx * w1; p[o + 7] = my; p[o + 8] = mz - sz * w1; p[o + 9] = mx + sx * w1; p[o + 10] = my; p[o + 11] = mz + sz * w1; p[o + 12] = tx; p[o + 13] = ty; p[o + 14] = tz;
    };
    const writeFar = (k, gustA) => {
      const bl = BF[k], be = (bl.bend + gustA) * 0.8, o = k * 9, sx = -bl.dz * bl.w / 2, sz = bl.dx * bl.w / 2, p = fpos;
      p[o] = bl.x - sx; p[o + 1] = bl.y; p[o + 2] = bl.z - sz; p[o + 3] = bl.x + sx; p[o + 4] = bl.y; p[o + 5] = bl.z + sz;
      p[o + 6] = bl.x + bl.dx * Math.sin(be) * bl.h; p[o + 7] = bl.y + Math.cos(be) * bl.h; p[o + 8] = bl.z + bl.dz * Math.sin(be) * bl.h;
    };
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(gpos, 3)); gg.setAttribute("normal", new THREE.BufferAttribute(gnor, 3)); gg.setAttribute("color", new THREE.BufferAttribute(gcol, 3)); gg.setIndex(new THREE.BufferAttribute(gidx, 1));
    gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.3, 0), 95);
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fpos, 3)); fg.setAttribute("normal", new THREE.BufferAttribute(fnor, 3)); fg.setAttribute("color", new THREE.BufferAttribute(fcol, 3)); fg.setIndex(new THREE.BufferAttribute(fidx, 1));
    fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.3, 0), 95);
    put(fg, vmat({ side: THREE.DoubleSide }), root, { scenery: true, noOutline: true, name: "grass-clumps" });
    put(gg, vmat({ side: THREE.DoubleSide }), root, { scenery: true, noOutline: true, name: "grass" });
    // ---- 28 low bushes (0.35-0.8 tall, three lobes each), dark under, lit on top
    const BU = new B();
    for (let i = 0, n = 0; n < 24 && i < 400; i++) {
      const r = 46 * Math.sqrt(hh(i, 700)), a = hh(i, 701) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r; if (r < 4 || !free(x, z, 1.4) || PUD.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + 1.0) || ACACIAS.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 3)) continue; n++;
      const y0 = turfY(x, z), sc = rr(i, 702, 0.75, 1.25);
      for (let l = 0; l < 3; l++) {
        const k = i * 5 + l, rx = rr(k, 703, 0.45, 0.8) * sc, ry = rr(k, 704, 0.28, 0.46) * sc, ox = l === 0 ? 0 : (l === 1 ? -1 : 1) * rx * 0.7, oz = (hh(k, 705) - 0.5) * rx * 0.8;
        BU.ellipsoid(x + ox, y0 + ry * 0.55 + (l === 0 ? 0.08 : 0), z + oz, rx, ry, rx * rr(k, 706, 0.8, 1.1), 7, 4, (u, v, p, nn) => { const c = nn[1] > 0.4 ? C.C3 : nn[1] > -0.05 ? C.C2 : mulc(C.C1, 0.6); return mulc(c, wetK * (0.9 + 0.2 * hh(k * 3 + Math.floor(u * 7), 707))); });
      }
    }
    put(BU, vmat({ side: THREE.DoubleSide }), root, { scenery: true, noOutline: true, name: "bushes" });
    // ---- eight acacias: trunk, five forks at 52-76 %, 19 canopy lobes, 32 leaf-edge strokes a crown
    const AB = new B(), SW = [];
    ACACIAS.forEach(([tx, tz, H, D], t) => {
      const key = (k) => t * 1000 + k, R = D / 2, bendX = (hh(key(1), 560) - 0.5) * 0.5, bendZ = (hh(key(2), 560) - 0.5) * 0.5, y0 = turfY(tx, tz);
      const trunk = []; for (let k = 0; k <= 6; k++) { const u = k / 6; trunk.push([tx + bendX * u * u, y0 - 0.05 + (H + 0.05) * u, tz + bendZ * u * u]); }
      AB.tube(trunk, (u) => lerp(0.18, 0.07, u), 8, (u, k) => mulc(mixc(C.TRUNK, C.TGRAIN, hh(Math.floor(k * 8) + t * 9, 561) < 0.35 ? 0.7 : 0.12 * hh(Math.floor(u * 6), 562)), 0.85 + 0.25 * u), true);
      const at = (u) => trunk[Math.min(6, Math.round(u * 6))].slice();
      for (let f = 0; f < 5; f++) {
        const u = lerp(0.52, 0.76, hh(key(10 + f), 563)), az = (f / 5) * TAU + hh(key(20 + f), 564) * 0.9, base = [tx + bendX * u * u, y0 + H * u, tz + bendZ * u * u], rr_ = R * rr(key(30 + f), 565, 0.45, 0.8), top = [tx + Math.cos(az) * rr_, y0 + H + 0.45 + 0.3 * hh(key(40 + f), 566), tz + Math.sin(az) * rr_];
        const mid = [lerp(base[0], top[0], 0.5) - Math.cos(az) * 0.1, lerp(base[1], top[1], 0.45) + 0.1, lerp(base[2], top[2], 0.5) - Math.sin(az) * 0.1];
        AB.tube([base, [lerp(base[0], mid[0], 0.5), lerp(base[1], mid[1], 0.5), lerp(base[2], mid[2], 0.5)], mid, top], (v) => lerp(0.085, 0.032, v), 6, (v) => mulc(C.TRUNK, 0.9 + 0.3 * v), true);
      }
      // 30 lobes in three tiers (one centre, seven inner, ten middle, twelve outer), Y radius 0.52-0.83; flat-topped like the panel, the
      // underside in the darkest band
      const lobes = []; lobes.push([0, 0, 0]); for (let k = 0; k < 7; k++) lobes.push([Math.cos((k / 7) * TAU + 0.3) * R * 0.34, Math.sin((k / 7) * TAU + 0.3) * R * 0.34, 1]);
      for (let k = 0; k < 10; k++) lobes.push([Math.cos((k / 10) * TAU + 0.1) * R * 0.62, Math.sin((k / 10) * TAU + 0.1) * R * 0.62, 2]); for (let k = 0; k < 12; k++) lobes.push([Math.cos((k / 12) * TAU) * R * 0.84, Math.sin((k / 12) * TAU) * R * 0.84, 3]);
      lobes.forEach(([lx, lz, tier], k) => {
        const outer = Math.hypot(lx, lz) / R, rx = R * rr(key(50 + k), 567, 0.2, 0.3), ry = rr(key(70 + k), 568, 0.52, 0.83) * (tier === 3 ? 0.8 : 1), cy = y0 + H + 0.62 - 0.4 * outer * outer + 0.14 * (hh(key(90 + k), 569) - 0.5), cx = tx + lx + (hh(key(100 + k), 570) - 0.5) * 0.3, cz = tz + lz + (hh(key(110 + k), 571) - 0.5) * 0.3;
        AB.ellipsoid(cx, cy, cz, rx, ry, rx * rr(key(120 + k), 572, 0.85, 1.15), 8, 4, (u, v, p, n) => { const lit = n[1] * 0.8 + (n[0] + n[2]) * 0.1; const c = lit > 0.42 ? C.C3 : lit > 0.05 ? C.C2 : lit > -0.3 ? C.C1 : mulc(C.C1, 0.52); return mulc(c, 0.9 + 0.2 * hh(key(130 + k) * 3 + Math.floor(u * 8), 573)); });
      });
      // 32 leaf-edge strokes along the crown's rim, each its own swaying piece
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * TAU + hh(key(200 + k), 574) * 0.2, rim = R * rr(key(210 + k), 575, 0.9, 1.1), L = rr(key(220 + k), 576, 0.06, 0.19), px = tx + Math.cos(a) * rim, pz = tz + Math.sin(a) * rim, py = y0 + H + 0.25 + 0.25 * hh(key(230 + k), 577), up = 0.4 + 0.6 * hh(key(240 + k), 578);
        const dir = norm3([Math.cos(a) * 0.8 + (hh(key(250 + k), 579) - 0.5) * 0.4, up, Math.sin(a) * 0.8 + (hh(key(260 + k), 580) - 0.5) * 0.4]), sd = norm3(cross3(dir, [0, 1, 0])), w = L * 0.22, c = mulc(C.C3, 0.85 + 0.35 * hh(key(270 + k), 581));
        const v0 = AB.nv, P0 = [px, py, pz]; AB.quad(add3(P0, sd, -w), add3(P0, sd, w), add3(add3(P0, dir, L), sd, w * 0.25), add3(add3(P0, dir, L), sd, -w * 0.25), mulc(c, 0.8), mulc(c, 0.8), c, c);
        SW.push({ v0, vn: AB.nv - v0, pv: P0, ax: norm3([-Math.sin(a), 0, Math.cos(a)]), U: hh(key(280 + k), 582) });
      }
    });
    const ag = AB.geo(), abase = ag.attributes.position.array.slice(), apos = ag.attributes.position.array;
    put(ag, vmat({ side: THREE.DoubleSide }), root, { cast: false, scenery: true, noOutline: true, name: "acacias" });
    setGust = (g) => {
      for (let k = 0; k < NBL; k++) writeBlade(k, (6 * D2R) * Math.sin(TAU * g + TAU * BL[k].U));
      for (let k = 0; k < NBF; k++) writeFar(k, (6 * D2R) * Math.sin(TAU * g + TAU * BF[k].U));
      gg.attributes.position.needsUpdate = true; fg.attributes.position.needsUpdate = true;
      for (const s of SW) {
        const ang = 6 * D2R * Math.sin(TAU * g + TAU * s.U), c = Math.cos(ang), sn = Math.sin(ang), [ax, ay, az] = s.ax;
        for (let v = s.v0; v < s.v0 + s.vn; v++) { const rx = abase[v * 3] - s.pv[0], ry = abase[v * 3 + 1] - s.pv[1], rz = abase[v * 3 + 2] - s.pv[2], d = ax * rx + ay * ry + az * rz, cx = ay * rz - az * ry, cy = az * rx - ax * rz, cz = ax * ry - ay * rx; apos[v * 3] = s.pv[0] + rx * c + cx * sn + ax * d * (1 - c); apos[v * 3 + 1] = s.pv[1] + ry * c + cy * sn + ay * d * (1 - c); apos[v * 3 + 2] = s.pv[2] + rz * c + cz * sn + az * d * (1 - c); }
      }
      ag.attributes.position.needsUpdate = true;
    };
    P.whole.userData.counts = { tufts: NNEAR + NBF / NB, blades: NBL + NBF, acacias: ACACIAS.length, puddles: PUD.length, tuftsWithin25: NNEAR };
  }
  if (storm) {
    // ---- the cloud deck: 18 masses, 7 merged lobes each, a vertical colour ramp in three cel bands
    const CB = new B(), CT = C.CTOP, CBS = C.CBASE;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const id = i * 3 + j, cx = -62 + 24 * i, cy = 18 + 3 * j, cz = -55 + 45 * j, rx = rr(id, 590, 17, 26), ry = rr(id, 591, 2.8, 4.8), rz = rr(id, 592, 10, 19);
      for (let l = 0; l < 7; l++) {
        const k = id * 10 + l, ox = l === 0 ? 0 : (hh(k, 593) - 0.5) * 1.3 * rx, oy = (hh(k, 594) - 0.35) * 0.7 * ry, oz = l === 0 ? 0 : (hh(k, 595) - 0.5) * 1.3 * rz;
        CB.ellipsoid(cx + ox, cy + oy, cz + oz, rx * rr(k, 596, 0.38, 0.6), ry * rr(k, 597, 0.8, 1.2), rz * rr(k, 598, 0.38, 0.6), 8, 4, (u, v, p) => { const t = clamp((p[1] - (cy - ry * 1.1)) / (ry * 2.6)); const q = t < 0.34 ? 0 : t < 0.68 ? 0.5 : 1; return mixc(CBS, CT, q * 0.85 + 0.15 * t); });
      }
    }
    put(CB, bmat(), root, { scenery: true, name: "storm-deck" });
    // ---- the horizon: turf colour into the storm horizon colour over r = 70-130
    const HB = new B(), RS = [70, 85, 100, 115, 130, 170, 220, 275], NA = 72;
    const hcol = (r) => mixc(mulc(C.TURF, 0.75), C.HORIZON, smooth((r - 70) / 60));
    HB.grid(NA, RS.length - 1, (u, v) => { const r = RS[Math.round(v * (RS.length - 1))], a = u * TAU; return [Math.cos(a) * r, -0.085, Math.sin(a) * r]; }, (u, v) => hcol(RS[Math.round(v * (RS.length - 1))]), { nf: () => [0, 1, 0], flip: false });
    put(HB, bmat({ polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), root, { scenery: true, name: "storm-horizon" });
  }
  return { grip: 0, apply(ps) { const g = num(ps, S, "gust", 0); if (g !== lastG) { lastG = g; setGust(g); } } };
}

export const EG_SPHINXFX_GRIPS = { surveykit: { gripL: [-0.15, 0.69, -0.46], gripR: [0.15, 0.69, -0.46] } };
export const EG_SPHINXFX_KINDS = { savanna: buildSavanna, hiddenhall: buildHall, saltslice: buildSalt, surveykit: buildSurvey, leo: buildLeo };
