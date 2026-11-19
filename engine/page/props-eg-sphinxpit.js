// EGYPT EP05 "How old is the Sphinx really?" (19 Nov 2026), task T2: the Sphinx enclosure, the Sphinx Temple, Khafre's valley temple and causeway.
// Design: storyboards/series/ancient-aliens/05-sphinx/DESIGN.md sections 1, 2, 4, 5 (and 8 row 2). Bench: storyboards/series/ancient-aliens/
// 05-sphinx/bench/make-eg-sphinxpit.mjs (eg-sphinxpit-sheet.png). Metres, SCALE 0.40 engine m per real m (the cast: Spud 0.88).
// WORLD FRAME (the director places all three kinds at x 0, y 0, z 0, rot 0): +x east, -z north, the Sphinx's centreline z 0, the pit floor y 0.
// Every mark (a pit, a bed stroke, a stain, a fissure, a chisel mark, a chip, a ripple, a fleck) is drawn once, as its own small real
// geometry, from the DESIGN section 1 hash of its index (position, size, angle and strength from independent channels). No canvas, no tiling
// texture, no Math.random, no wall clock. Light is baked into vertex colours (a little ambient occlusion in the grooves, a dark underside
// to each seam); the set's key light still shades the stone. Geometry is merged per material: rock (outlined), ground and marks (no ink
// line), water (see-through, userData.steam). Nothing here carries contact ovals (lookOnly). A param propState has no default for
// (wet, flow, quarry, build) reads spec.<name> as its start value: seed it with a dur-0 set at 0.
//
//   sphinxpit    the enclosure. Floor y 0 inside the polyline (x,z) (16.60,-8.60) (-15.40,-8.60) (-18.20,-6.65) (-18.20,6.95) (-15.60,9.35)
//                (16.60,9.35); rims north/west/south 4.20/4.95/4.65 blended on the chamfers; the east side is open onto the terrace
//                (x 16.60-36, z -11..29, y 0, flat, with a gentle bank round it). The wall: a 0.38 m foot (Member I, to the first
//                bed less 0.07), then Member II with the six shared hard beds B(k, x, z) (DESIGN section 2) as proud seams (lips 0.07-0.13)
//                between set-back soft beds, and 62 rain grooves (25/12/25 north/west/south, the west takes the chamfers): pitch
//                side/(n+1), jitter +-0.18, width 0.48-0.88, depth 0.23-0.70, drift 0.14 sin(1.4y), inset D cos^2(pi d / w), mesh 0.10 m
//                along the wall and 0.12 m up, 19 of them with a real V fissure (0.025-0.075 wide, 0.07-0.18 deep); 780 pits, 190 bed
//                strokes, 105 stains. The north shelf y 1.12 (0.10 -> 1.32 wide, inner edge z -7.30 over x 4.40-8.80) carries four half-cut
//                blocks on a 0.24 m base web, three channels each (shared gaps between neighbours) and 36 chisel marks each; the two
//                eastern ones have a 0.19 x 0.11 x 0.15 lever socket. Floor: 36 sand patches (soft mounds), 360 ripples, 145 chips (relief
//                <= 0.045). Outside: the rim ledge 1.35 m, the plateau falling to y -0.10 at r 80 (put gizaplateau at (0, -0.10, 0)
//                under it), the causeway's cutting south of the pit.
//                spec: match false (true: the recess x 4.78-8.38, y 1.12-2.48 to z -8.73 and the wall's east return x 7.205-8.38 whose
//                front z -7.55 carries the same beds as the witness block; grooves are suppressed there), ramp false (true: the east ramp
//                of panel 16, x 10.0-16.8, z centre 5.20, 2.8 wide, height 0 -> 0.42), wet 0, flow 0, quarry 0.
//                params wet 0..1 (rock and floor to the wet palette per bed, groove depth x (1 - 0.24 wet (1 - flow)), 28 water ribbons
//                10/8/10 down the groove bottoms and off the bed lips, 15 pools with ripples, a 3.6 x 0.5 m mud band at each outer paw),
//                flow 0..1 (7 dashes per ribbon march at fract(flow + U + j/7), two ripples per pool grow at fract(flow + U + j/2): tween
//                it 0 -> N to keep it running), quarry 0..1 (ceil(12 quarry) cells of uncut rock from the west, north row first: 6 x 2
//                cells 2.30 x 2.00 from (-14.20, -7.35), tops 3.25/3.25/2.85/2.55/1.85/1.12, channels 0.18 x 0.40; the north-wall grooves
//                behind them shrink by 1 - 0.8 quarry; use 1 for panel 15, 0.34 for 16).
//                SOLID / standable: the pit floor y 0 (the sand patches rise at most 0.018, ripples 0.02, chips 0.045: feet may sink a
//                hair), the north shelf top y 1.12 (width 0.10-1.32 along the north wall), the block web top y 1.36, the quarry cell tops
//                (see quarry), the ramp. The walls are walls. Origin the world origin. GRIPS none. Triangles about 80-91k (cap 112k).
//   sphinxtemple the Sphinx Temple, origin (25.60, 0, 0), front +x, built in world coordinates: footprint 17.88 x 21.00, walls 1.35 thick
//                in 3 courses 0.88/0.92/1.05 of blocks 0.92-1.34 long (joints 0.022-0.046, half-block stagger, the beds of the pit wall carried
//                through: block i samples B about (1.40 + 0.46 (i mod 9), 0.97 + 0.13 (i mod 5), -7.55)), six monoliths 2.24 x 0.98 x
//                1.12, two east doors 1.45 wide at z +-5.35 (courses 1 and 2), two sanctuaries 2.30 x 4.10 at x +-5.45 (0.5 thick walls,
//                the court side open), 24 pier sites, paving 0.10 thick (top y 0.012), footings recessed 0.14. Per block 3 chips, 5 pits,
//                2 chisel marks.
//                spec: era 'ruin' (default: perimeter courses kept 100/72/15 % by hash, 15 pier stumps 0.12-0.48, 85 % of the paving) |
//                'quarry' (the building site: the walls rise by `build`), match false (true: adds the witness block 2.24 x 0.98 x 1.12 at
//                (6.08, 1.12, -8.11), front +z, its beds B(k, x, -7.55) = the return's: seam error <= 0.010, see userData.seamError).
//                param build 0..1 (era quarry only; 35 % of course 1 at 0; blocks appear by course, then east / north / west / south /
//                sanctuaries / piers, then along the run; 1: 2.85 m at three corners and 1.80 m at the NE corner (the corner blocks of
//                course 3 and four more on the north / east runs are left out), the 24 piers 1.84 m (four 0.46 courses), 10 statue bases
//                0.68 x 0.26 x 0.65 round the court, 3 loose casing blanks 1.16 x 0.84 x 0.32 east; the paving is laid from 0.88; use .47
//                for panel 16 and .91 for 18). SOLID / standable: the paving top y 0.012, the wall tops, the statue bases (0.26). About 20-35k tris
//                (cap 54k).
//   khafrevalley Khafre's valley temple, origin (25.60, 0, 19.64), front east: 17.60 x 3.60 x 17.60, 7 deg batter, six red granite casing
//                columns (5 joints) x three rows a face with 3 grain lines and 11 flecks a slab, a limestone roof of slabs inside a 0.22 granite
//                band, two east portals 1.24 x 2.55 at local z +-4.65 (jambs 0.16), the west exit 1.35 x 2.32 at z -7.19, the T hall inside
//                (crossbar 4.8 x 9.8 at (-2.6, 0), stem 6.4 x 4.8 at (3.0, 0), 16 pillars 0.42 x 2.60 x 0.42), and the causeway:
//                (16.8, 0.40, 12.45) -> (-20, 4.90, 11.20) -> (-149, 6.80, -24.00), road 1.80 wide, parapets 0.32 high in 1.25 m blocks, an
//                embankment to the terrain, the landing 3.10 x 0.35 x 4.00 at (-150.55, 6.45, -24.00) (the director places `pyramid`
//                at (-188.6, 6.80, -24.00) s 0.34, and aasky). No params. SOLID / standable: the road deck, the landing, the hall floor y 0.
//                About 20-30k tris (cap 30k).
// userData on every root: tris (counts per mesh); sphinxtemple also seamError, visible, total.
// Cast scale: Spud 0.88. The Sphinx itself (kind sphinx) and the savanna are other files.
import * as THREE from "three";

// ---------------------------------------------------------------------------------------------------------------
// shared kit: hash (DESIGN section 1), colours, geometry accumulators, the bed function B (section 2)
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
// DESIGN section 1: h = imul(i+1, 0x9E3779B1) ^ imul(k+1, 0x85EBCA6B); h = imul(h ^ (h >>> 16), 0x7FEB352D); U = ((h ^ (h >>> 15)) >>> 0) / 2^32
const U = (i, k) => { let h = Math.imul((i | 0) + 1, 0x9E3779B1) ^ Math.imul((k | 0) + 1, 0x85EBCA6B); h = Math.imul(h ^ (h >>> 16), 0x7FEB352D); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const HX = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
// palette (DESIGN section 1)
const PAL = {
  m1: HX("#CDB083"), m1w: HX("#AD8B65"), m1e: HX("#E1C498"),
  sf: HX("#D5AE79"), hf: HX("#E9CA96"), sw: HX("#B48860"), hw: HX("#D8B17E"), seam: HX("#826344"),
  ink: HX("#493526"), pit: HX("#72533B"), crack: HX("#654B38"), stain: HX("#9B6C4A"), scratch: HX("#EED3A8"),
  sand: HX("#DEC198"), ripple: HX("#C3A278"), rub1: HX("#B9956D"), rub2: HX("#EBD0AA"), rep1: HX("#DAB88E"), rep2: HX("#C9A881"), mortar: HX("#8D7055"),
  coreS: HX("#BE946B"), coreH: HX("#D7B38A"), tedge: HX("#EDD0A8"), joint: HX("#806249"), gran: HX("#8F514D"), granL: HX("#B5746C"), grain: HX("#573D42"), paving: HX("#DDCEAF"),
  wHard: HX("#746555"), wSoft: HX("#594A40"), mud: HX("#685845"), water: HX("#566B71"), waterE: HX("#C4D9DE"),
};
// the six shared hard horizons B(k, x, z), their seam thicknesses (DESIGN section 2). Duplicated verbatim in props-eg-sphinx.js.
const BB = [1.02, 1.46, 1.92, 2.48, 3.04, 3.64], ST = [0.14, 0.16, 0.19, 0.15, 0.21, 0.18];
const Bf = (k, x, z) => BB[k] + 0.006 * x + 0.003 * z + 0.025 * Math.sin(0.8 * x + 0.5 * z + 0.7 * k);

// a geometry accumulator: positions, vertex colours (rgb or rgba), indices
class Acc {
  constructor(alpha = false) { this.p = []; this.c = []; this.i = []; this.alpha = alpha; }
  v(x, y, z, c, a = 1) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); if (this.alpha) this.c.push(a); return this.p.length / 3 - 1; }
  get tris() { return this.i.length / 3; }
  tri(a, b, c) { this.i.push(a, b, c); }
  // a triangle wound to face the hint direction
  triN(a, b, c, hx, hy, hz) {
    const p = this.p, ax = p[b * 3] - p[a * 3], ay = p[b * 3 + 1] - p[a * 3 + 1], az = p[b * 3 + 2] - p[a * 3 + 2], bx = p[c * 3] - p[a * 3], by = p[c * 3 + 1] - p[a * 3 + 1], bz = p[c * 3 + 2] - p[a * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    if (nx * hx + ny * hy + nz * hz >= 0) this.i.push(a, b, c); else this.i.push(a, c, b);
  }
  quadN(a, b, c, d, hx, hy, hz) { this.triN(a, b, c, hx, hy, hz); this.triN(a, c, d, hx, hy, hz); }
  y(i) { return this.p[i * 3 + 1]; }
  geo(normals = true) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, this.alpha ? 4 : 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(this.i), 1));
    if (normals) g.computeVertexNormals();
    g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  }
}
// two neighbouring columns of vertices (arrays of indices, each ascending in y) joined into a strip by walking up both
// (a zipper by y), wound to face the hint. Handles columns with different row sets (a seam crossing one block edge).
function zipY(a, A, B, hx, hy, hz) {
  let i = 0, j = 0;
  while (i < A.length - 1 || j < B.length - 1) {
    const adv = j >= B.length - 1 || (i < A.length - 1 && a.y(A[i + 1]) <= a.y(B[j + 1]));
    if (adv) { a.triN(A[i], B[j], A[i + 1], hx, hy, hz); i++; } else { a.triN(A[i], B[j], B[j + 1], hx, hy, hz); j++; }
  }
}
// the same, joining two rings by a parameter (arrays of {i, t}): used between rings of the terrain
function zipT(a, A, B, hx, hy, hz) {
  let i = 0, j = 0;
  while (i < A.length - 1 || j < B.length - 1) {
    const adv = j >= B.length - 1 || (i < A.length - 1 && A[i + 1].t <= B[j + 1].t);
    if (adv) { a.triN(A[i].i, B[j].i, A[i + 1].i, hx, hy, hz); i++; } else { a.triN(A[i].i, B[j].i, B[j + 1].i, hx, hy, hz); j++; }
  }
}
// materials: rock (outlined), ground and marks (no ink line), water (see-through)
const rockMat = () => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, metalness: 0 }); m.userData.lineColor = "#493526"; m.userData.lookRole = "set"; return m; };   // lookRole "set": the soft scenery ramp, not the character ramp that turns stone orange
const groundMat = () => { const m = rockMat(); m.userData.noOutline = true; return m; };
const markMat = () => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; m.userData.lookRole = "set"; return m; };
const waterMat = () => { const m = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); m.userData.noOutline = true; return m; };
function addMesh(parent, geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = !!o.cast; m.receiveShadow = o.recv !== false; m.frustumCulled = false;
  if (o.steam) { m.userData.steam = true; m.castShadow = false; m.receiveShadow = false; m.renderOrder = o.order ?? 5; }
  if (o.lookOnly !== false) m.userData.lookOnly = true;   // a whole site: no contact oval under it
  if (o.solid === false) m.userData.solid = false;
  parent.add(m); return m;
}
const swapGeo = (m, g) => { const old = m.geometry; m.geometry = g; if (old && old.dispose) old.dispose(); };
// a small value noise along one axis from the hash (smooth between whole steps)
const vnoise = (i, k, t) => { const f = Math.floor(t), r = smooth(t - f); return lerp(U(i * 7919 + f, k), U(i * 7919 + f + 1, k), r); };
// tone of a vertex: a little hash brightness so no two cells are one flat colour
const tone = (c, i, k, a = 0.05) => mulc(c, 1 + (U(i, k) - 0.5) * 2 * a);

// ---------------------------------------------------------------------------------------------------------------
// a profiled block: a box whose four sides carry the shared hard beds as real relief (hard seams stand proud, the soft beds
// between them are set back 0.025-0.063 m, 0.012 m bevels), flat top, no bottom. bed(k, ex) is the absolute y of the base of
// hard bed k at the x offset ex from the block's middle (a fixed ex for a side that faces x). Colours from pal (soft/hard).
// Returns the vertex counts it added so a caller can budget. opts.pocket {u, v, w, d, depth} cuts a pocket in the top.
function profiledBox(a, b, o) {
  const { x0, x1, y0, y1, z0, z1 } = b, cx = (x0 + x1) / 2, key = o.key ?? 0;
  const soft = o.soft ?? PAL.coreS, hard = o.hard ?? PAL.coreH, edge = o.edge ?? PAL.tedge, seamC = o.seam ?? PAL.joint, bed = o.bed;
  const wob = o.tone ?? 1, bevel = 0.02;
  const setb = (k) => 0.025 + 0.038 * U(key * 13 + k, 31);
  const profile = (ex) => {   // [{ y, off, c }] ascending, off >= 0 set back
    const pts = [];
    if (bed) for (let k = 0; k < 6; k++) {
      const yb = bed(k, ex), yt = yb + ST[k]; if (yt < y0 - 0.1 || yb > y1 + 0.1) continue;
      const s = setb(k);
      pts.push([yb - bevel, s, 0], [yb, 0, 1], [yt, 0, 1], [yt + bevel, s, 0]);
    }
    const at = (y) => { if (!pts.length || y <= pts[0][0]) return [pts.length ? pts[0][1] : 0, pts.length ? pts[0][2] : 0]; for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) { const t = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] + 1e-9); return [lerp(pts[i - 1][1], pts[i][1], t), lerp(pts[i - 1][2], pts[i][2], t)]; } const l = pts[pts.length - 1]; return [l[1], l[2]]; };
    const ys = [y0]; for (const p of pts) if (p[0] > y0 + 1e-4 && p[0] < y1 - 1e-4) ys.push(p[0]); ys.push(y1);
    ys.sort((p, q) => p - q);
    return ys.map((y) => { const [off, h] = at(y); return { y, off, h }; });
  };
  const faces = [
    { nx: 0, nz: 1, ax: x0, bx: x1, pz: z1, side: "z" },     // +z front
    { nx: 0, nz: -1, ax: x1, bx: x0, pz: z0, side: "z" },    // -z back
    { nx: 1, nz: 0, ax: z1, bx: z0, pz: x1, side: "x" },     // +x
    { nx: -1, nz: 0, ax: z0, bx: z1, pz: x0, side: "x" },    // -x
  ];
  let fi = 0;
  for (const f of faces) {
    if (o.skip && o.skip[fi]) { fi++; continue; }
    const len = Math.abs(f.bx - f.ax), nu = f.side === "z" ? Math.max(1, Math.ceil(len / (o.colStep ?? 0.9))) : 1, cols = [];
    for (let i = 0; i <= nu; i++) {
      const u = lerp(f.ax, f.bx, i / nu), ex = f.side === "z" ? u - cx : f.nx * (x1 - x0) / 2, prof = profile(ex), chain = [];
      for (const r of prof) {
        const off = r.off; let X, Z;
        if (f.side === "z") { X = u; Z = f.pz - f.nz * off; } else { X = f.pz - f.nx * off; Z = u; }
        const base = mixc(r.h > 0.5 ? hard : soft, r.h > 0.5 ? PAL.hf : PAL.sf, 0);
        let cc = mixc(base, seamC, r.h < 0.5 && r.off > 0.001 && r.off < 0.03 ? 0.6 : 0); // the dark underside line of a seam
        cc = tone(mulc(cc, wob), key * 977 + i * 31 + Math.round(r.y * 100), 17, 0.035);
        chain.push(a.v(X, r.y, Z, cc));
      }
      cols.push(chain);
    }
    for (let i = 0; i < nu; i++) zipY(a, cols[i], cols[i + 1], f.nx, 0, f.nz);
    fi++;
  }
  // the top (a flat quad, a pocket when asked)
  if (!o.skip || !o.skip[4]) {
    const topc = tone(mixc(edge, hard, 0.45), key * 41 + 3, 19, 0.04);
    const pk = o.pocket;
    if (!pk) {
      const q = [a.v(x0, y1, z0, topc), a.v(x1, y1, z0, topc), a.v(x1, y1, z1, topc), a.v(x0, y1, z1, topc)]; a.quadN(q[0], q[1], q[2], q[3], 0, 1, 0);
    } else {
      const px0 = pk.x - pk.w / 2, px1 = pk.x + pk.w / 2, pz0 = pk.z - pk.d / 2, pz1 = pk.z + pk.d / 2, dk = mulc(PAL.joint, 0.8);
      const xs = [x0, px0, px1, x1], zs = [z0, pz0, pz1, z1], idx = [];
      for (let j = 0; j < 4; j++) { idx.push([]); for (let i = 0; i < 4; i++) idx[j].push(a.v(xs[i], y1, zs[j], topc)); }
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { if (i === 1 && j === 1) continue; a.quadN(idx[j][i], idx[j][i + 1], idx[j + 1][i + 1], idx[j + 1][i], 0, 1, 0); }
      const yb = y1 - pk.depth, pt = [a.v(px0, yb, pz0, dk), a.v(px1, yb, pz0, dk), a.v(px1, yb, pz1, dk), a.v(px0, yb, pz1, dk)];
      a.quadN(pt[0], pt[1], pt[2], pt[3], 0, 1, 0);
      const wall = (p, q, nx, nz) => { const w0 = a.v(a.p[p * 3], y1, a.p[p * 3 + 2], mulc(topc, 0.8)), w1 = a.v(a.p[q * 3], y1, a.p[q * 3 + 2], mulc(topc, 0.8)), w2 = a.v(a.p[q * 3], yb, a.p[q * 3 + 2], dk), w3 = a.v(a.p[p * 3], yb, a.p[p * 3 + 2], dk); a.quadN(w0, w1, w2, w3, nx, 0, nz); };
      wall(pt[0], pt[1], 0, 1); wall(pt[1], pt[2], -1, 0); wall(pt[2], pt[3], 0, -1); wall(pt[3], pt[0], 1, 0);
    }
  }
}
// a plain coloured box (own verts per face): for footings, plugs and small bases
function plainBox(a, x0, y0, z0, x1, y1, z1, c, c2 = null) {
  const top = c2 ?? c;
  const f = (pts, col, nx, ny, nz) => { const q = pts.map((p) => a.v(p[0], p[1], p[2], col)); a.quadN(q[0], q[1], q[2], q[3], nx, ny, nz); };
  f([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top, 0, 1, 0);
  f([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c, 0, 0, 1);
  f([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], c, 0, 0, -1);
  f([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], c, 1, 0, 0);
  f([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], c, -1, 0, 0);
}
// a pit (a dimple): a fan of 6 around a centre pushed in along -n. p: surface point, n: unit normal, r: radius, d: depth
function dimple(a, p, n, r, depth, rimC, cenC, rot, ex = null) {
  const t1 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = t1[1] * n[2] - t1[2] * n[1], uy = t1[2] * n[0] - t1[0] * n[2], uz = t1[0] * n[1] - t1[1] * n[0]; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
  const vx = n[1] * uz - n[2] * uy, vy = n[2] * ux - n[0] * uz, vz = n[0] * uy - n[1] * ux;
  const c = a.v(p[0] - n[0] * depth, p[1] - n[1] * depth, p[2] - n[2] * depth, cenC), ring = [];
  for (let i = 0; i < 6; i++) { const t = rot + (i / 6) * TAU, rr = r * (0.8 + 0.4 * U(Math.round(rot * 1000) + i, 77)), co = Math.cos(t) * rr, si = Math.sin(t) * rr * (ex ?? 1); ring.push(a.v(p[0] + ux * co + vx * si + n[0] * 0.0015, p[1] + uy * co + vy * si + n[1] * 0.0015, p[2] + uz * co + vz * si + n[2] * 0.0015, rimC)); }
  for (let i = 0; i < 6; i++) a.triN(c, ring[i], ring[(i + 1) % 6], n[0], n[1], n[2]);
}

// ---------------------------------------------------------------------------------------------------------------
// a weathered block: one ring of 8-10 points (the vertical edges rounded by a chamfer c = rho, 0.05-0.09) lofted up through rows, so the
// edges and the top are rounded and every vertex is shared (smooth shading). The shared hard beds are real relief on every face: the soft
// beds sit back 0.03-0.06 m (a little darker, weathered), the hard beds stand proud and lighter, a dark inked line runs under each hard
// bed. bed(k, ex) = absolute y of the base of hard bed k at the x offset ex from the block's middle. Rows follow each vertex's own seam
// heights, so the seams of two blocks that sample the same B meet. Returns off(y, ex) (how far the face is set back there) for marks.
function weatheredBlock(a, bx, y0, y1, o = {}) {
  const key = o.key ?? 0, cx = (bx.x0 + bx.x1) / 2, cz = (bx.z0 + bx.z1) / 2, hx = (bx.x1 - bx.x0) / 2, hz = (bx.z1 - bx.z0) / 2;
  const rho = Math.min(0.05 + 0.04 * U(key, 601), hx * 0.4, hz * 0.4), c = rho, bed = o.bed && !o.noBeds && !o.lite ? o.bed : null;
  const softC = mixc(o.soft ?? PAL.coreS, PAL.pit, 0.20), hardC = mixc(o.hard ?? PAL.coreH, PAL.tedge, 0.22), inkC = o.seam ?? PAL.ink, tn = o.tone ?? 1, rec = 0.04 + 0.025 * U(key, 602);
  const hs = (k, ex, y) => { const yb = bed(k, ex), yt = yb + ST[k]; return smooth((y - (yb - 0.035)) / 0.045) * (1 - smooth((y - yt) / 0.035)); };
  const strength = (y, ex) => { let m = 0; if (bed) for (let k = 0; k < 6; k++) m = Math.max(m, hs(k, ex, y)); return m; };
  const off = (y, ex) => (bed ? rec * (1 - strength(y, ex)) : 0);
  const longZ = hx * 2 >= hz * 2, mid = (len) => len >= 1.7;
  const ring = [[hx, -hz + c, 1, 0], [hx, hz - c, 1, 0], [hx - c, hz, 0, 1]];
  if (longZ && mid(hx * 2)) ring.push([0, hz, 0, 1]); ring.push([-hx + c, hz, 0, 1], [-hx, hz - c, -1, 0]);
  if (!longZ && mid(hz * 2)) ring.push([-hx, 0, -1, 0]); ring.push([-hx, -hz + c, -1, 0], [-hx + c, -hz, 0, -1]);
  if (longZ && mid(hx * 2)) ring.push([0, -hz, 0, -1]); ring.push([hx - c, -hz, 0, -1]);
  if (!longZ && mid(hz * 2)) ring.splice(1, 0, [hx, 0, 1, 0]);
  const ys = bed ? [0, 1, 2, 3, 4, 5].filter((k) => bed(k, 0) - 0.04 < y1 && bed(k, 0) + ST[k] + 0.04 > y0) : [];
  const rows = [{ t: "b" }]; for (const k of ys) rows.push({ t: "sA", k }, { t: "hS", k }, { t: "hE", k }, { t: "sB", k }); rows.push({ t: "tA" }, { t: "cap" });
  const yTop = y1 - 0.09, grid = [];
  const yOf = (r, ex, prev) => { let y; switch (r.t) { case "b": y = y0; break; case "sA": y = bed(r.k, ex) - 0.035; break; case "hS": y = bed(r.k, ex) + 0.01; break; case "hE": y = bed(r.k, ex) + ST[r.k]; break; case "sB": y = bed(r.k, ex) + ST[r.k] + 0.035; break; case "tA": y = y1 - 0.08; break; default: y = y1; }
    if (r.k !== undefined) y = Math.min(y, yTop); return Math.max(prev, clamp(y, y0, y1)); };
  // drop a row that sits on the one before it at every vertex (a seam clamped to the bottom or the top): 16 triangles a row saved
  { const keep = [0]; let last = ring.map(() => y0);
    for (let j = 1; j < rows.length; j++) { const yy = ring.map(([px], v) => yOf(rows[j], px, last[v])); if (j === rows.length - 1 || yy.some((y, v) => y - last[v] > 0.004)) { keep.push(j); last = yy; } }
    const kr = keep.map((j) => rows[j]); rows.length = 0; rows.push(...kr); }
  ring.forEach(([px, pz, nx, nz], v) => {
    const ex = px, col = []; let prev = y0;
    rows.forEach((r, j) => {
      const y = yOf(r, ex, prev); prev = y;
      const t = clamp((y - (y1 - 0.08)) / 0.08), topIn = y > y1 - 0.08 ? rho * (1 - Math.sqrt(Math.max(0, 1 - t * t))) : 0, m = strength(y, ex);
      const rough = (U(key * 977 + v * 31 + j, 604) - 0.5) * 0.008, d = (bed ? rec * (1 - m) : 0) + topIn + (r.t === "cap" ? 0 : rough * (1 - m * 0.5));
      let cc = mixc(softC, hardC, m); if (r.t === "hS") cc = mixc(cc, inkC, 0.7); if (r.t === "sA") cc = mulc(cc, 0.92); if (r.t === "tA" || r.t === "tB" || r.t === "cap") cc = mixc(cc, o.edge ?? PAL.tedge, 0.28);
      if (o.aoLow) cc = mulc(cc, lerp(o.aoLow, 1, smooth((y - y0) / 0.5)));
      cc = tone(mulc(cc, tn), key * 131 + v * 17 + j, 603, 0.045);
      if (o.chan) { const dep = clamp((o.chan.top - 0.05 - y) / 0.5); cc = mulc(cc, 1 - o.chan.dark * smooth(dep) * (y > o.chan.floor - 0.3 ? 1 : 0)); }
      const Xr = clamp(px - nx * d, -hx + d, hx - d), Zr = clamp(pz - nz * d, -hz + d, hz - d);
      col.push(a.v(cx + Xr, y, cz + Zr, cc));
    });
    grid.push(col);
  });
  const n = ring.length;
  for (let v = 0; v < n; v++) { const A = grid[v], B = grid[(v + 1) % n], nxm = ring[v][2] + ring[(v + 1) % n][2], nzm = ring[v][3] + ring[(v + 1) % n][3]; for (let j = 0; j < rows.length - 1; j++) a.quadN(A[j], B[j], B[j + 1], A[j + 1], nxm, 0, nzm); }
  // the top: a flat rectangle (the chamfer and the top rounding meet it exactly), with a pocket if asked
  const tD = rho + (bed ? rec : 0), X0 = bx.x0 + tD, X1 = bx.x1 - tD, Z0 = bx.z0 + tD, Z1 = bx.z1 - tD, topc = tone(mulc(mixc(o.edge ?? PAL.tedge, hardC, 0.4), tn), key * 41 + 3, 19, 0.04), pk = o.pocket;
  if (!pk) { const q = [a.v(X0, y1, Z0, topc), a.v(X1, y1, Z0, topc), a.v(X1, y1, Z1, topc), a.v(X0, y1, Z1, topc)]; a.quadN(q[0], q[1], q[2], q[3], 0, 1, 0); }
  else {
    const px0 = pk.x - pk.w / 2, px1 = pk.x + pk.w / 2, pz0 = pk.z - pk.d / 2, pz1 = pk.z + pk.d / 2, dk = mulc(PAL.joint, 0.55), xs = [X0, px0, px1, X1], zs = [Z0, pz0, pz1, Z1], idx = [];
    for (let j = 0; j < 4; j++) { idx.push([]); for (let i = 0; i < 4; i++) idx[j].push(a.v(xs[i], y1, zs[j], topc)); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { if (i === 1 && j === 1) continue; a.quadN(idx[j][i], idx[j][i + 1], idx[j + 1][i + 1], idx[j + 1][i], 0, 1, 0); }
    const yb = y1 - pk.depth, pt = [a.v(px0, yb, pz0, dk), a.v(px1, yb, pz0, dk), a.v(px1, yb, pz1, dk), a.v(px0, yb, pz1, dk)]; a.quadN(pt[0], pt[1], pt[2], pt[3], 0, 1, 0);
    const wall = (p, q, nx, nz) => { const w0 = a.v(a.p[p * 3], y1, a.p[p * 3 + 2], mulc(topc, 0.6)), w1 = a.v(a.p[q * 3], y1, a.p[q * 3 + 2], mulc(topc, 0.6)), w2 = a.v(a.p[q * 3], yb, a.p[q * 3 + 2], dk), w3 = a.v(a.p[p * 3], yb, a.p[p * 3 + 2], dk); a.quadN(w0, w1, w2, w3, nx, 0, nz); };
    wall(pt[0], pt[1], 0, 1); wall(pt[1], pt[2], -1, 0); wall(pt[2], pt[3], 0, -1); wall(pt[3], pt[0], 1, 0);
  }
  return { off, rho, rec };
}

// ---------------------------------------------------------------------------------------------------------------
// THE ENCLOSURE (sphinxpit). World frame of DESIGN section 2: +x east, -z north, the Sphinx's centreline z 0, floor y 0.
const PIT = [[16.6, -8.6], [-15.4, -8.6], [-18.2, -6.65], [-18.2, 6.95], [-15.6, 9.35], [16.6, 9.35]];
const RIMH = [4.20, 4.20, 4.95, 4.95, 4.65, 4.65];
const SEG = []; let LTOT = 0;
for (let j = 0; j < 5; j++) {
  const [x0, z0] = PIT[j], [x1, z1] = PIT[j + 1], len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
  SEG.push({ j, x0, z0, x1, z1, len, dx, dz, nx: dz, nz: -dx, s0: LTOT, h0: RIMH[j], h1: RIMH[j + 1] }); LTOT += len;   // n = the inward normal (into the pit)
}
const L_N = SEG[0].len, L_W = SEG[1].len + SEG[2].len + SEG[3].len;
const segOf = (s) => { for (let j = 0; j < 5; j++) if (s <= SEG[j].s0 + SEG[j].len + 1e-9) return SEG[j]; return SEG[4]; };
const rimH = (s) => { const g = segOf(s); return lerp(g.h0, g.h1, smooth((s - g.s0) / g.len)); };
const SPH = { x: 14.9, z: 4.1 };   // the Sphinx's footprint (marks and pools keep out of it)
const inSphinx = (x, z, m = 0) => Math.abs(x) < SPH.x + m && Math.abs(z) < SPH.z + m;
const WITNESS = { x: 6.08, y: 1.12, z: -8.11, w: 2.24, h: 0.98, d: 1.12 };   // DESIGN section 5
const RET = { x0: 7.205, x1: 8.38, zf: -7.55 };                              // the pit wall's east return beside the witness
const GROOVES = (() => {
  const out = [], sides = [[0, L_N, 25], [L_N, L_N + L_W, 12], [L_N + L_W, LTOT, 25]]; let gi = 0;
  sides.forEach(([a, b, n], side) => {
    const pitch = (b - a) / (n + 1);
    for (let i = 0; i < n; i++, gi++) out.push({ gi, side, s: a + pitch * (i + 1) + (U(gi, 1) * 2 - 1) * 0.18, w: 0.48 + 0.40 * U(gi, 2), D: 0.23 + 0.47 * U(gi, 3), ph: TAU * U(gi, 4), fiss: false });
  });
  [...out].sort((p, q) => U(p.gi, 5) - U(q.gi, 5)).slice(0, 19).forEach((g) => { g.fiss = true; g.fw = 0.025 + 0.05 * U(g.gi, 6); g.fd = 0.07 + 0.11 * U(g.gi, 7); g.fy0 = 1.4 + 1.3 * U(g.gi, 8); g.fl = 1.0 + 1.7 * U(g.gi, 9); });
  return out;
})();
const MATCHZ = [4.78, 8.38];
const SHELF_Y = 1.12;
const shelfW = (x) => (x <= 4.4 ? 0.10 + 1.20 * smooth((x + 15.4) / 19.8) : x <= 8.8 ? 1.30 : 1.30 + 0.02 * ((x - 8.8) / 7.8));
// the four half-cut blocks on the shelf: centre x, z; size x, y, z; channel width
const NBLOCKS = [[9.20, -8.05, 1.24, 0.91, 0.90, 0.14], [10.73, -8.04, 1.38, 1.00, 0.96, 0.16], [12.34, -8.01, 1.47, 0.84, 1.02, 0.18], [14.06, -7.96, 1.60, 0.75, 1.04, 0.19]];
const QTOP = [3.25, 3.25, 2.85, 2.55, 1.85, 1.12], QX0 = -14.2, QZ0 = -7.35, QCX = 2.3, QCZ = 2.0;
const CAUSE = [[16.8, 0.40, 12.45], [-20, 4.90, 11.20], [-149, 6.80, -24.00]];
function causeNear(x, z) {
  let best = null;
  for (let j = 0; j < 2; j++) {
    const a = CAUSE[j], b = CAUSE[j + 1], dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz, t = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / L2), px = a[0] + dx * t, pz = a[2] + dz * t, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { d, y: lerp(a[1], b[1], t), j, t };
  }
  return best;
}
function nearestWall(x, z) {
  let best = null;
  for (const g of SEG) {
    const t = clamp((x - g.x0) * g.dx + (z - g.z0) * g.dz, 0, g.len), px = g.x0 + g.dx * t, pz = g.z0 + g.dz * t, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { d, s: g.s0 + t };
  }
  return best;
}
// the ground outside: the rim height declining to y -0.10 at r 80; the east terrace (x 16.6-36, z -11..29) at y 0 with a gentle bank
// round it; the causeway's cutting where its deck is lower than the plateau. east = the part of the ground east of x 16.6.
function ground(x, z, east) {
  const r = Math.hypot(x, z), nw = nearestWall(x, z), H = rimH(nw.s);
  let P = -0.10 + (H + 0.10) * (1 - smooth((r - 20) / 60));
  const cn = causeNear(x, z), cut = cn.y - 0.06 + 0.8 * Math.max(0, cn.d - 1.05);
  P = lerp(P, Math.min(P, cut), smooth((nw.d - 1.35) / 1.2));
  if (east) { const d = Math.hypot(Math.max(0, x - 36), Math.max(0, -11 - z, z - 29)); P = Math.min(P, 0.12 * d); }
  return P;
}
// ---- the wall columns
const gainTop = (col, y) => smooth((col.H - y) / 0.35) * smooth((y - (col.yf + 0.03)) / 0.35);
function makeCol(s, match) {
  const g = segOf(s), u = clamp(s - g.s0, 0, g.len);
  const bx = g.x0 + g.dx * u, bz = g.z0 + g.dz * u;
  let nx = g.nx, nz = g.nz, mx = nx, mz = nz;
  for (let j = 1; j < 5; j++) if (Math.abs(s - SEG[j].s0) < 1e-6) { const a = SEG[j - 1], b = SEG[j], dd = 1 + a.nx * b.nx + a.nz * b.nz, l = Math.hypot(a.nx + b.nx, a.nz + b.nz); mx = (a.nx + b.nx) / dd; mz = (a.nz + b.nz) / dd; nx = (a.nx + b.nx) / l; nz = (a.nz + b.nz) / l; }
  const H = rimH(s), inM = match && g.j === 0 && bx >= MATCHZ[0] - 0.03 && bx <= MATCHZ[1] + 0.03, zB = inM ? -7.55 : bz;
  const bs = BB.map((_, k) => Bf(k, bx, zB)), yf = bs[0] - 0.07, lips = BB.map((_, k) => 0.07 + 0.06 * vnoise(k, 11, s / 0.6));
  const keys = [[0, -0.38], [yf, -0.38], [yf + 0.03, 0]];
  for (let k = 0; k < 6; k++) keys.push([bs[k] - 0.03, 0], [bs[k], -lips[k]], [bs[k] + ST[k], -lips[k]], [bs[k] + ST[k] + 0.05, 0]);
  keys.push([H, 0]);
  const rx = match && g.j === 0 ? smooth((bx - MATCHZ[0]) / 0.02) * smooth((MATCHZ[1] - bx) / 0.02) : 0;
  const gr = GROOVES.filter((q) => Math.abs(q.s - s) < q.w / 2 + 0.16);
  return { s, bx, bz, nx, nz, mx, mz, tx: g.dx, tz: g.dz, H, bs, yf, lips, keys, rx, gr, seg: g.j };
}
const profOff = (col, y) => {
  const K = col.keys; if (y <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (y <= K[i][0]) { const t = (y - K[i - 1][0]) / (K[i][0] - K[i - 1][0] + 1e-9); return lerp(K[i - 1][1], K[i][1], t); }
  return K[K.length - 1][1];
};
function grooveIn(col, y, gm) {
  let m = 0;
  for (const q of col.gr) { const d = col.s - (q.s + 0.14 * Math.sin(1.4 * y + q.ph)), hw = q.w / 2; if (Math.abs(d) < hw) { const c = Math.cos((Math.PI * d) / q.w), v = q.D * gm[q.gi] * c * c; if (v > m) m = v; } }
  return m * gainTop(col, y);
}
const recessOff = (col, y) => (col.rx > 0 ? 0.13 * col.rx * smooth((y - 1.05) / 0.08) * (1 - smooth((y - 2.46) / 0.04)) : 0);
const offTotal = (col, y, gm) => profOff(col, y) + grooveIn(col, y, gm) + recessOff(col, y);
const wallPt = (col, y, off) => [col.bx - col.mx * off, y, col.bz - col.mz * off];
function colRows(col) {
  const K = col.keys, ys = [];
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i][0], b = K[i + 1][0]; if (b <= a + 1e-6) continue;
    const step = i < 2 ? 0.5 : i >= 3 && (i - 3) % 4 === 1 ? 0.22 : 0.12;   // the foot and a seam's flat face are plain: fewer rows there
    const n = Math.max(1, Math.ceil((b - a) / step - 1e-6)); for (let q = 0; q < n; q++) ys.push(lerp(a, b, q / n));
  }
  ys.push(K[K.length - 1][0]);
  if (col.rx > 0) ys.push(1.05, 1.13, 2.46, 2.50);
  return ys.sort((p, q) => p - q).filter((y, i, a) => i === 0 || y > a[i - 1] + 1e-5);
}
const colsCache = {};
function wallS(match) {
  if (colsCache[match]) return colsCache[match];
  const forced = new Set([0, LTOT]); SEG.forEach((g) => forced.add(g.s0));
  const zones = GROOVES.filter((g) => !(match && g.side === 0 && 16.6 - g.s > MATCHZ[0] - 0.2 && 16.6 - g.s < MATCHZ[1] + 0.2)).map((g) => [Math.max(0, g.s - g.w / 2 - 0.16), Math.min(LTOT, g.s + g.w / 2 + 0.16)]).sort((a, b) => a[0] - b[0]);
  const merged = []; for (const z of zones) { const l = merged[merged.length - 1]; if (l && z[0] <= l[1] + 1e-6) l[1] = Math.max(l[1], z[1]); else merged.push([...z]); }
  merged.forEach((z) => { forced.add(z[0]); forced.add(z[1]); });
  if (match) for (const x of [8.38, 8.36, 4.80, 4.78]) forced.add(16.6 - x);
  const stops = [...forced].sort((a, b) => a - b), inZone = (s) => merged.some((z) => s >= z[0] - 1e-6 && s < z[1] - 1e-6);
  const out = [0]; let cur = 0;
  while (cur < LTOT - 1e-6) {
    const step = inZone(cur + 1e-6) ? 0.1 : 0.5; let nxt = Math.min(LTOT, cur + step);
    for (const f of stops) if (f > cur + 1e-6 && f < nxt - 1e-6) { nxt = f; break; }
    out.push(nxt); cur = nxt;
  }
  return (colsCache[match] = out);
}
function rockColour(col, y, off, gIn, wet, key) {
  const bs = col.bs; let kb = 0, hard = -1;
  for (let k = 0; k < 6; k++) { if (y >= bs[k] - 0.015) kb = k + 1; if (y >= bs[k] - 0.02 && y <= bs[k] + ST[k] + 0.06) hard = k; }
  let c;
  if (y < col.yf + 0.015) {
    const w = clamp(0.35 + 0.4 * U(99, 201) + gIn), top = smooth((y - (col.yf - 0.12)) / 0.12);
    c = mixc(mixc(PAL.m1, PAL.m1w, w), PAL.m1e, top * 0.6);
  } else {
    const w = clamp(0.28 + 0.45 * U(kb, 202) + gIn * 0.9);
    c = hard >= 0 ? mixc(PAL.hf, PAL.hw, w) : mixc(PAL.sf, PAL.sw, w);
    if (hard >= 0 && y < bs[hard] + 0.012) c = mixc(c, PAL.seam, 0.55);
    c = mixc(c, PAL.stain, 0.08 * U(kb, 203));
  }
  if (wet > 0.001) { const tw = clamp(wet * (0.75 + 0.25 * U(kb, 204))); c = mixc(c, y >= col.yf + 0.015 && hard >= 0 ? PAL.wHard : y < col.yf + 0.015 ? mixc(PAL.wHard, PAL.wSoft, 0.4) : PAL.wSoft, tw); }
  const ao = 1 - 0.5 * clamp(gIn / 0.4) - 0.10 * clamp(-off / 0.1), vert = 0.86 + 0.14 * smooth(y / 2.4);
  return tone(mulc(c, ao * vert), key, 23, 0.03);
}

// ---- small marks: a V-cut (a chisel mark, a fissure) between two points on a plane with normal n
function vgroove(a, p0, p1, n, wid, depth, cE, cC) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
  let ax = dy * n[2] - dz * n[1], ay = dz * n[0] - dx * n[2], az = dx * n[1] - dy * n[0]; const l = Math.hypot(ax, ay, az) || 1; ax = (ax / l) * wid / 2; ay = (ay / l) * wid / 2; az = (az / l) * wid / 2;
  const up = 0.001, V = (p, s, d, c) => a.v(p[0] + ax * s + n[0] * (up - d), p[1] + ay * s + n[1] * (up - d), p[2] + az * s + n[2] * (up - d), c);
  const e0L = V(p0, -1, 0, cE), c0 = V(p0, 0, depth, cC), e0R = V(p0, 1, 0, cE), e1L = V(p1, -1, 0, cE), c1 = V(p1, 0, depth, cC), e1R = V(p1, 1, 0, cE);
  a.quadN(e0L, c0, c1, e1L, n[0], n[1], n[2]); a.quadN(c0, e0R, e1R, c1, n[0], n[1], n[2]);
}
// a flat polygon fan on a plane (a disc or a ragged patch): centre c, ring points
function fanFlat(a, c, ring, n, cc, cr) {
  const ci = a.v(c[0], c[1], c[2], cc), r = ring.map((p) => a.v(p[0], p[1], p[2], cr));
  for (let i = 0; i < r.length; i++) a.triN(ci, r[i], r[(i + 1) % r.length], n[0], n[1], n[2]);
}

// ---- the floor: its colour (sand patches, ripples' tone, mud when wet) and its height (the patches are soft mounds, 0.004-0.018 m)
const PATCHES = Array.from({ length: 36 }, (_, i) => ({ x: lerp(-17.5, 15.5, U(i, 301)), z: lerp(-8.0, 8.8, U(i, 302)), r: 0.2 + 1.1 * U(i, 303), k: 0.3 + 0.3 * U(i, 304), light: U(i, 305) < 0.55, h: 0.004 + 0.014 * U(i, 306) }));
function floorH(x, z) { let h = 0; for (const p of PATCHES) { const d = Math.hypot(x - p.x, z - p.z) / p.r; if (d < 1) h = Math.max(h, p.h * smooth(1 - d)); } return h; }
function floorCol(x, z, wet, key) {
  let c = PAL.sand;
  for (const p of PATCHES) { const d = Math.hypot(x - p.x, z - p.z) / p.r; if (d < 1) c = mixc(c, p.light ? PAL.rub2 : PAL.ripple, p.k * smooth(1 - d)); }
  const dw = nearestWall(x, z).d; c = mulc(c, 1 - 0.20 * smooth(1 - dw / 1.1));
  if (wet > 0.001) c = mixc(c, PAL.mud, clamp(wet * (0.55 + 0.3 * U(Math.round(x * 2) * 97 + Math.round(z * 2), 311))));
  return tone(c, key, 29, 0.04);
}
const freeSpot = (x, z, m) => { if (inSphinx(x, z, m)) return false; for (const g of SEG) if ((x - g.x0) * g.nx + (z - g.z0) * g.nz < 0.55 + m) return false; return x < 16.0; };
const PITSPOTS = (() => {   // 15 pools, then the marks' free spots are drawn by index in the builder
  const out = []; let t = 0;
  for (let i = 0; out.length < 15 && t < 400; t++) { const r = 0.30 + 1.35 * U(t, 321) ** 1.5, x = lerp(-17, 15.5, U(t, 322)), z = lerp(-8.2, 8.8, U(t, 323)); if (freeSpot(x, z, r + 0.2)) { out.push({ x, z, r, k: out.length }); i++; } }
  return out;
})();

// ---- everything that depends on wet / flow / quarry is rebuilt from these when one of them changes
function pitStatic(S) { return { match: !!S.match, ramp: !!S.ramp }; }
function grooveMuls(match, dm, quarry) {
  const n = Math.ceil(12 * quarry - 1e-9), gm = [];
  for (const g of GROOVES) {
    let m = dm;
    if (g.side === 0) {
      const x = 16.6 - g.s, c = Math.floor((x - QX0) / QCX);
      if (quarry > 0 && c >= 0 && c < 6 && 2 * c < n) m *= 1 - 0.8 * quarry;
      if (match) m *= 1 - smooth((x - (MATCHZ[0] - 0.2)) / 0.3) * (1 - smooth((x - (MATCHZ[1] - 0.1)) / 0.3));
    }
    gm.push(m);
  }
  return gm;
}
function buildRock(rock, marks, floor, gm, wet, quarry, st) {
  const match = st.match, S = wallS(match), cols = S.map((s) => makeCol(s, match)), chains = [];
  // the wall
  cols.forEach((col, ci) => {
    const chain = [];
    for (const y of colRows(col)) {
      const gIn = grooveIn(col, y, gm), off = profOff(col, y) + gIn + recessOff(col, y), p = wallPt(col, y, off);
      chain.push(rock.v(p[0], p[1], p[2], rockColour(col, y, off, gIn, wet, ci * 131 + Math.round(y * 50))));
    }
    chains.push(chain);
  });
  for (let i = 0; i < cols.length - 1; i++) zipY(rock, chains[i], chains[i + 1], cols[i].nx, 0, cols[i].nz);
  // the north shelf (y 1.12): a solid mass in front of the wall, top and front face
  { const xs = []; for (let x = 16.6; x > -15.4 + 1e-6; x -= 0.5) xs.push(x); xs.push(-15.4);
    const st0 = xs.map((x, i) => { const zf = -8.6 + shelfW(x), top = tone(mixc(PAL.m1e, PAL.hf, 0.5), i, 41, 0.03), mid = tone(mixc(PAL.m1, PAL.m1w, 0.45), i, 42, 0.03), up = tone(mixc(PAL.hf, PAL.hw, 0.3), i, 43, 0.03);
      return { tb: rock.v(x, SHELF_Y, -8.85, top), tf: rock.v(x, SHELF_Y, zf, top), f1: rock.v(x, SHELF_Y, zf, up), f2: rock.v(x, 0.9, zf, mid), f3: rock.v(x, 0, zf, mulc(mid, 0.9)) }; });
    for (let i = 0; i < st0.length - 1; i++) { const A = st0[i], B = st0[i + 1]; rock.quadN(A.tb, B.tb, B.tf, A.tf, 0, 1, 0); rock.quadN(A.f1, B.f1, B.f2, A.f2, 0, 0, 1); rock.quadN(A.f2, B.f2, B.f3, A.f3, 0, 0, 1); }
    const E = st0[0], zf = -8.6 + shelfW(16.6), ec = mixc(PAL.m1, PAL.hf, 0.4);
    const q = [rock.v(16.6, 0, -8.85, ec), rock.v(16.6, 0, zf, ec), rock.v(16.6, SHELF_Y, zf, ec), rock.v(16.6, SHELF_Y, -8.85, ec)]; rock.quadN(q[0], q[1], q[2], q[3], 1, 0, 0); void E;
  }
  // the four half-cut blocks, their base web, three channels each (W / E / S), the lever sockets of the two eastern ones
  { const WEB = SHELF_Y + 0.24, hardC = { soft: PAL.sf, hard: PAL.hf, edge: PAL.m1e, seam: PAL.seam };
    const bl = NBLOCKS.map(([cx, cz, w, h, d, cw], i) => ({ cx, cz, w, h, d, cw, x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, top: SHELF_Y + h, depth: 0.51 + 0.22 * U(i, 41) }));
    bl.forEach((b) => { b.floor = Math.max(WEB, b.top - Math.min(b.depth, b.top - WEB)); b.zs = Math.min(b.z1 + b.cw, -7.30 - 0.02); });
    const xa = bl[0].x0 - bl[0].cw, xb = bl[3].x1 + bl[3].cw, zS = Math.max(...bl.map((b) => b.zs));
    profiledBox(rock, { x0: xa, x1: xb, y0: SHELF_Y, y1: WEB, z0: -8.8, z1: zS }, { ...hardC, key: 60, bed: (k, ex) => Bf(k, (xa + xb) / 2 + ex, -8.0), colStep: 1.5, skip: [false, true, false, false, false] });
    const plug = (x0, x1, z0, z1, f) => { if (f > WEB + 0.004) plainBox(rock, x0, WEB, z0, x1, f, z1, mulc(mixc(PAL.hf, PAL.hw, 0.35), 0.28), mulc(mixc(PAL.m1e, PAL.hf, 0.4), 0.3)); };   // the channel floor: dark, so the slot reads
    bl.forEach((b, i) => {
      const bed = (k, ex) => Bf(k, b.cx + ex, b.cz), pk = i >= 2 ? { x: b.cx + (U(i, 51) - 0.5) * 0.4, z: b.z1 - 0.2, w: 0.19, d: 0.15, depth: 0.11 } : null;
      const wb = weatheredBlock(rock, { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, WEB, b.top, { soft: PAL.coreS, hard: PAL.coreH, edge: PAL.tedge, seam: PAL.ink, key: 70 + i, bed, pocket: pk, chan: { top: b.top, floor: b.floor, dark: 0.7 } });
      blockMarks(marks, { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }, WEB, b.top, 70 + i, 1, wb.off, 2);
      plug(b.x0, b.x1, b.z1, b.zs, b.floor);                       // S channel
      const wx0 = i === 0 ? b.x0 - b.cw : bl[i - 1].x1, wx1 = b.x0, wf = i === 0 ? b.floor : Math.max(b.floor, bl[i - 1].floor);
      plug(wx0, wx1, b.z0 + 0.04, Math.min(b.z1, bl[i === 0 ? 0 : i - 1].z1), wf);   // W channel (shared with the neighbour's E)
      if (i === 3) plug(b.x1, b.x1 + b.cw, b.z0 + 0.04, b.z1, b.floor);               // E channel of the last
      // 36 chisel marks (0.065-0.15 long, 0.008-0.017 wide, 0.006 deep, at 65-82 deg)
      for (let m = 0; m < 36; m++) {
        const key = i * 100 + m, L = 0.09 + 0.12 * U(key, 61), wd = 0.02 + 0.016 * U(key, 62), ang = (65 + 17 * U(key, 63)) * DEG * (U(key, 64) < 0.5 ? -1 : 1), face = U(key, 65), loc = mixc(PAL.hf, PAL.hw, 0.3), cE = mixc(loc, PAL.ink, 0.45), cC = mixc(loc, PAL.ink, 0.92);
        let p0, p1, n;
        if (face < 0.45) { const px = lerp(b.x0 + 0.1, b.x1 - 0.1, U(key, 66)), pz = lerp(b.z0 + 0.1, b.z1 - 0.1, U(key, 67)); if (pk && Math.abs(px - pk.x) < 0.2 && Math.abs(pz - pk.z) < 0.17) continue; n = [0, 1, 0]; p0 = [px - Math.cos(ang) * L / 2, b.top, pz - Math.sin(ang) * L / 2]; p1 = [px + Math.cos(ang) * L / 2, b.top, pz + Math.sin(ang) * L / 2]; }
        else if (face < 0.8) { const px = lerp(b.x0 + 0.1, b.x1 - 0.1, U(key, 66)), py = lerp(WEB + 0.1, b.top - 0.1, U(key, 67)); n = [0, 0, 1]; { const zf = b.z1 - wb.off(py, px - b.cx); p0 = [px - Math.cos(ang) * L / 2, py - Math.sin(ang) * L / 2, zf]; p1 = [px + Math.cos(ang) * L / 2, py + Math.sin(ang) * L / 2, zf]; } }
        else { const sd = U(key, 68) < 0.5 ? -1 : 1, xx = sd > 0 ? b.x1 : b.x0, pz = lerp(b.z0 + 0.1, b.z1 - 0.1, U(key, 66)), py = lerp(WEB + 0.1, b.top - 0.1, U(key, 67)); n = [sd, 0, 0]; { const xo = xx - sd * wb.off(py, 0); p0 = [xo, py - Math.sin(ang) * L / 2, pz - Math.cos(ang) * L / 2]; p1 = [xo, py + Math.sin(ang) * L / 2, pz + Math.cos(ang) * L / 2]; } }
        vgroove(marks, p0, p1, n, wd, 0.006, cE, cC);
      }
    });
  }
  // the match: the wall's east return beside the witness block (front z -7.55, the same beds)
  if (match) {
    const rb = { x0: RET.x0, x1: RET.x1, z0: -8.73, z1: RET.zf }, rw = weatheredBlock(rock, rb, SHELF_Y, 2.48, { soft: PAL.coreS, hard: PAL.coreH, edge: PAL.tedge, seam: PAL.ink, key: 90, bed: (k, ex) => Bf(k, (RET.x0 + RET.x1) / 2 + ex, RET.zf) });
    blockMarks(marks, rb, SHELF_Y, 2.48, 90, 1, rw.off, 2);
  }
  // quarry: ceil(12 quarry) cells counted from the west, north row first
  const nq = Math.ceil(12 * quarry - 1e-9);
  for (let n = 0; n < nq; n++) {
    const c = n >> 1, r = n & 1, x0 = QX0 + QCX * c, z0 = QZ0 + QCZ * r, top = QTOP[c], cx = x0 + QCX / 2, cz = z0 + QCZ / 2, yf = Bf(0, cx, cz) - 0.07, q = { soft: PAL.sf, hard: PAL.hf, edge: PAL.m1e, seam: PAL.seam };
    const bed = (k, ex) => Bf(k, cx + ex, cz);
    plainBox(rock, x0, 0, z0, x0 + QCX, yf, z0 + QCZ, mixc(PAL.m1, PAL.m1w, 0.3), mixc(PAL.m1, PAL.m1e, 0.4));
    profiledBox(rock, { x0, x1: x0 + QCX, y0: yf, y1: top - 0.40, z0, z1: z0 + QCZ }, { ...q, key: 100 + n, bed, colStep: 0.8, skip: [false, false, false, false, true] });
    profiledBox(rock, { x0: x0 + 0.09, x1: x0 + QCX - 0.09, y0: top - 0.40, y1: top, z0: z0 + 0.09, z1: z0 + QCZ - 0.09 }, { ...q, key: 120 + n, bed, colStep: 0.8 });
    // the channels: the floor of the cut at top-0.40 (the lower box's top face is what shows between cells)
    { const t = mixc(PAL.m1e, PAL.hf, 0.3), y = top - 0.40, v = [rock.v(x0, y, z0, t), rock.v(x0 + QCX, y, z0, t), rock.v(x0 + QCX, y, z0 + QCZ, t), rock.v(x0, y, z0 + QCZ, t)]; rock.quadN(v[0], v[1], v[2], v[3], 0, 1, 0); }
  }
  // the east ramp (spec.ramp): x 10.0-16.8, z centre 5.20, 2.8 wide, height 0 -> 0.42
  if (st.ramp) {
    const nx = 14, nz = 4, g = [], rc = (i, j) => tone(mixc(PAL.rub1, PAL.rub2, U(i * 17 + j, 331) * 0.7), i * 9 + j, 332, 0.04);
    for (let i = 0; i <= nx; i++) { g.push([]); const x = lerp(10.0, 16.8, i / nx), h = 0.42 * (x - 10) / 6.8; for (let j = 0; j <= nz; j++) g[i].push(rock.v(x, h + 0.012 * U(i * 7 + j, 333), 3.8 + 2.8 * j / nz, rc(i, j))); }
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) rock.quadN(g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1], 0, 1, 0);
    for (const zz of [3.8, 6.6]) for (let i = 0; i < nx; i++) { const x0 = lerp(10.0, 16.8, i / nx), x1 = lerp(10.0, 16.8, (i + 1) / nx), c = mulc(PAL.rub1, 0.85), v = [rock.v(x0, 0, zz, c), rock.v(x1, 0, zz, c), rock.v(x1, 0.42 * (x1 - 10) / 6.8, zz, c), rock.v(x0, 0.42 * (x0 - 10) / 6.8, zz, c)]; rock.quadN(v[0], v[1], v[2], v[3], 0, 0, zz < 5 ? -1 : 1); }
    for (let k = 0; k < 40; k++) { const x = lerp(10.2, 16.6, U(k, 335)), z = lerp(3.9, 6.5, U(k, 336)), h = 0.42 * (x - 10) / 6.8 + 0.01; dimple(marks, [x, h, z], [0, 1, 0], 0.03 + 0.06 * U(k, 337), -0.012 - 0.02 * U(k, 338), PAL.rub2, PAL.rub1, TAU * U(k, 339)); }
  }
  // ---- the floor (ground material): 0.5 m cells, the patches' mounds, projected into the walls' footing
  { const nx = 71, nz = 38, x0 = -18.7, x1 = 16.6, z0 = -9.05, z1 = 9.8, V = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      let x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz);
      for (let pass = 0; pass < 2; pass++) for (const g of SEG) { const sd = (x - g.x0) * g.nx + (z - g.z0) * g.nz; if (sd < -0.45) { x += g.nx * (-0.45 - sd); z += g.nz * (-0.45 - sd); } }
      V.push(floor.v(x, floorH(x, z), z, floorCol(x, z, wet, i * 91 + j)));
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = V[j * (nx + 1) + i], b = V[j * (nx + 1) + i + 1], c = V[(j + 1) * (nx + 1) + i + 1], d = V[(j + 1) * (nx + 1) + i]; if ((i + j) & 1) { floor.triN(a, b, c, 0, 1, 0); floor.triN(a, c, d, 0, 1, 0); } else { floor.triN(a, b, d, 0, 1, 0); floor.triN(b, c, d, 0, 1, 0); } }
  }
}

// ---- the ground outside (static): rings round the wall top, then the east side
const RING_D = [0, 1.35, 2.4, 4.0, 6.5, 9.5, 13.5, 19.65, 27, 36, 47, 60, 74, 90];
function groundCol(x, z, y, east, key, ledge) {
  const r = Math.hypot(x, z);
  if (ledge) return tone(mixc(PAL.hw, PAL.m1e, 0.55), key, 51, 0.04);
  const slope = Math.hypot(ground(x + 1, z, east) - ground(x - 1, z, east), ground(x, z + 1, east) - ground(x, z - 1, east)) / 2;
  let c = mixc(PAL.sand, PAL.hw, 0.32 * smooth(y / 4.5) * (1 - smooth((r - 30) / 40)));
  c = mixc(c, PAL.sw, clamp(slope * 1.3) * 0.85);
  return tone(c, key, 52, 0.045);
}
function buildTerrain(acc, match) {
  const S = wallS(match), coarse = [];
  for (const g of SEG) { const n = Math.max(2, Math.ceil(g.len / 1.6)); for (let q = 0; q < n; q++) coarse.push(g.s0 + (g.len * q) / n); }
  coarse.push(LTOT);
  const rings = [];
  RING_D.forEach((d, k) => {
    const list = k <= 1 ? S : coarse, chain = [];
    list.forEach((s, ci) => {
      const col = makeCol(s, false), x = col.bx - col.mx * d, z = col.bz - col.mz * d, y = k <= 1 ? col.H : ground(x, z, false);
      chain.push({ i: acc.v(x, y, z, groundCol(x, z, y, false, k * 977 + ci, k === 1 || k === 0)), t: s, x, y, z });
    });
    rings.push(chain);
  });
  for (let k = 0; k < rings.length - 1; k++) zipT(acc, rings[k], rings[k + 1], 0, 1, 0);
  // the east side: x 16.6 -> 100, z at the rings' ends and between
  const xs = [16.6, 18, 20, 22.5, 25.5, 28.5, 31.5, 34, 36, 38.5, 42, 47, 53, 60, 68, 77, 86, 100];
  const zset = new Set([-4, 0, 4]); RING_D.forEach((d) => { zset.add(Math.round((-8.6 - d) * 1000) / 1000); zset.add(Math.round((9.35 + d) * 1000) / 1000); }); zset.add(-8.6); zset.add(9.35);
  const zs = [...zset].sort((a, b) => a - b), V = [];
  zs.forEach((z, j) => { V.push([]); xs.forEach((x, i) => { const y = ground(x, z, true); V[j].push(acc.v(x, y, z, groundCol(x, z, y, true, i * 31 + j, false))); }); });
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) { const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i]; if ((i + j) & 1) { acc.triN(a, b, c, 0, 1, 0); acc.triN(a, c, d, 0, 1, 0); } else { acc.triN(a, b, d, 0, 1, 0); acc.triN(b, c, d, 0, 1, 0); } }
  // the cut face along x 16.6 where the plateau stands above the east side
  const zi = (z) => zs.findIndex((q) => Math.abs(q - z) < 1e-6);
  RING_D.forEach((d, k) => {
    if (k === 0) return;
    for (const side of [0, 1]) {
      const z0 = side ? 9.35 + RING_D[k - 1] : -8.6 - RING_D[k - 1], z1 = side ? 9.35 + d : -8.6 - d, wa = rings[k - 1][side ? rings[k - 1].length - 1 : 0], wb = rings[k][side ? rings[k].length - 1 : 0], ea = V[zi(z0)][0], eb = V[zi(z1)][0];
      const c = mixc(PAL.sw, PAL.hw, 0.35), q = [acc.v(16.6, wa.y, z0, c), acc.v(16.6, wb.y, z1, c), acc.v(16.6, acc.p[eb * 3 + 1], z1, mulc(c, 0.85)), acc.v(16.6, acc.p[ea * 3 + 1], z0, mulc(c, 0.85))];
      acc.quadN(q[0], q[1], q[2], q[3], 1, 0, 0);
    }
  });
}

// ---- the marks on the wall and the floor
function surfNormal(col0, s, y, gm, match) {
  const e = 0.012, P = (ds, dy) => { const c = makeCol(clamp(s + ds, 0, LTOT), match); return wallPt(c, y + dy, offTotal(c, y + dy, gm)); };
  const A = P(e, 0), B = P(-e, 0), C = P(0, e), D = P(0, -e), t1 = [A[0] - B[0], A[1] - B[1], A[2] - B[2]], t2 = [C[0] - D[0], C[1] - D[1], C[2] - D[2]];
  let n = [t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0]]; const l = Math.hypot(...n) || 1; n = n.map((v) => v / l);
  if (n[0] * col0.nx + n[2] * col0.nz < 0) n = n.map((v) => -v);
  return n;
}
function wallMarks(m, gm, wet, match) {
  const diam = Array.from({ length: 780 }, (_, i) => 0.014 + 0.050 * U(i, 3) ** 1.4), big = [...diam].sort((p, q) => q - p)[179];
  const at = (s, y) => { const col = makeCol(s, match), gIn = grooveIn(col, y, gm), off = profOff(col, y) + gIn + recessOff(col, y); return { col, gIn, off, p: wallPt(col, y, off) }; };
  const hidden = (col, y) => col.seg === 0 && y < SHELF_Y + 0.04 && shelfW(col.bx) > 0.02;
  for (let i = 0; i < 780; i++) {   // pits
    const s = LTOT * U(i, 1), H = rimH(s), foot = U(i, 7) < 0.12, y = foot ? lerp(0.08, 0.85, U(i, 2)) : lerp(1.0, H - 0.15, U(i, 2));
    const a = at(s, y); if (hidden(a.col, y)) continue;
    const n = surfNormal(a.col, s, y, gm, match), al = 0.30 + 0.60 * U(i, 5), loc = rockColour(a.col, y, a.off, a.gIn, wet, i), d = diam[i], depth = d >= big ? 0.006 + 0.016 * U(i, 4) : 0.002 + 0.002 * U(i, 4);
    dimple(m, a.p, n, d / 2, depth, mixc(loc, PAL.pit, al * 0.3), mixc(loc, PAL.pit, al), TAU * U(i, 6), 0.75 + 0.25 * U(i, 8));
  }
  for (let i = 0; i < 190; i++) {   // bed strokes
    const s0 = LTOT * U(i, 11), c0 = makeCol(s0, match), k = Math.floor(6 * U(i, 12)), y0 = c0.bs[k] + ST[k] * U(i, 14) + (U(i, 15) - 0.5) * 0.12, L = 0.12 + 0.58 * U(i, 13) ** 1.3, sl = (U(i, 16) - 0.5) * 0.18, hw = 0.004 + 0.009 * U(i, 17), al = 0.30 + 0.60 * U(i, 18);
    if (y0 > c0.H - 0.3) continue; const vs = [];
    for (let j = 0; j < 4; j++) { const s = clamp(s0 + (j / 3 - 0.5) * L, 0, LTOT), y = y0 + (s - s0) * sl, a = at(s, y); if (hidden(a.col, y)) { vs.length = 0; break; } const n = surfNormal(a.col, s, y, gm, match), loc = rockColour(a.col, y, a.off, a.gIn, wet, i * 7 + j), f = j === 0 || j === 3 ? 0.35 : 1, c = mixc(loc, PAL.ink, al * f); vs.push([a.p, n, c]); }
    if (vs.length < 4) continue;
    const ids = vs.map(([p, n, c]) => [m.v(p[0] + n[0] * 0.002, p[1] + n[1] * 0.002 - hw, p[2] + n[2] * 0.002, c), m.v(p[0] + n[0] * 0.002, p[1] + n[1] * 0.002 + hw, p[2] + n[2] * 0.002, c)]);
    for (let j = 0; j < 3; j++) m.quadN(ids[j][0], ids[j + 1][0], ids[j + 1][1], ids[j][1], vs[j][1][0], vs[j][1][1], vs[j][1][2]);
  }
  for (let i = 0; i < 105; i++) {   // stains (vertical streaks)
    const s0 = LTOT * U(i, 21), c0 = makeCol(s0, match), top = lerp(1.6, c0.H - 0.25, U(i, 22)), len = 0.18 + 0.77 * U(i, 23), wd = 0.04 + 0.16 * U(i, 24), al = (0.30 + 0.60 * U(i, 25)) * 0.8, rows = []; let bad = false;
    for (let j = 0; j < 3; j++) { const y = top - (len * j) / 2, w = wd * (1 - 0.55 * j / 2), r = []; for (const sd of [-1, 1]) { const s = clamp(s0 + sd * w / 2, 0, LTOT), a = at(s, y); if (hidden(a.col, y)) { bad = true; break; } const n = surfNormal(a.col, s, y, gm, match), loc = rockColour(a.col, y, a.off, a.gIn, wet, i * 5 + j); r.push(m.v(a.p[0] + n[0] * 0.0025, a.p[1], a.p[2] + n[2] * 0.0025, mixc(loc, PAL.stain, al * (j === 0 ? 0.5 : j === 1 ? 1 : 0.25)))); } if (bad) break; rows.push(r); }
    if (!bad) for (let j = 0; j < 2; j++) m.quadN(rows[j][0], rows[j][1], rows[j + 1][1], rows[j + 1][0], c0.nx, 0, c0.nz);
  }
  for (const g of GROOVES) {   // fissures in the 19 deepened grooves
    if (!g.fiss || gm[g.gi] < 0.2) continue;
    const col0 = makeCol(g.s, match), y0 = g.fy0, y1 = Math.min(g.fy0 + g.fl, col0.H - 0.5), nst = Math.max(2, Math.ceil((y1 - y0) / 0.1)), P = [];
    for (let j = 0; j <= nst; j++) { const y = lerp(y0, y1, j / nst), s = g.s + 0.14 * Math.sin(1.4 * y + g.ph), a = at(s, y), taper = Math.abs(Math.sin(Math.PI * j / nst)) ** 0.6; P.push({ a, y, taper, n: [a.col.nx, 0, a.col.nz], t: [a.col.tx, 0, a.col.tz] }); }
    const ids = P.map((q) => { const w = g.fw * (0.35 + 0.65 * q.taper), dd = g.fd * q.taper, loc = rockColour(q.a.col, q.y, q.a.off, q.a.gIn, wet, g.gi), cE = mixc(loc, PAL.crack, 0.4), cC = mixc(loc, PAL.crack, 0.95), p = q.a.p;
      return [m.v(p[0] - q.t[0] * w / 2 + q.n[0] * 0.001, p[1], p[2] - q.t[2] * w / 2 + q.n[2] * 0.001, cE), m.v(p[0] - q.n[0] * dd, p[1], p[2] - q.n[2] * dd, cC), m.v(p[0] + q.t[0] * w / 2 + q.n[0] * 0.001, p[1], p[2] + q.t[2] * w / 2 + q.n[2] * 0.001, cE)]; });
    for (let j = 0; j < nst; j++) for (let h = 0; h < 2; h++) m.quadN(ids[j][h], ids[j + 1][h], ids[j + 1][h + 1], ids[j][h + 1], P[j].n[0], 0, P[j].n[2]);
  }
}
function floorMarks(m, wet) {
  const cnt = { r: 0, c: 0 };
  for (let t = 0; cnt.r < 360 && t < 2500; t++) {   // ripples
    const x = lerp(-17.5, 15.6, U(t, 341)), z = lerp(-8.2, 8.9, U(t, 342)); if (!freeSpot(x, z, 0.3)) continue;
    const L = 0.12 + 0.40 * U(t, 343), wd = 0.03 + 0.05 * U(t, 344), h = 0.006 + 0.014 * U(t, 345), ang = (U(t, 346) - 0.5) * 0.9 + (U(t, 347) < 0.25 ? Math.PI / 2 : 0), y0 = floorH(x, z), ca = Math.cos(ang), sa = Math.sin(ang), loc = floorCol(x, z, wet, t), rc = mixc(loc, PAL.ripple, 0.6 + 0.3 * U(t, 348));
    const A = m.v(x - ca * L / 2, y0 + 0.001, z - sa * L / 2, mulc(rc, 0.92)), B = m.v(x + sa * wd / 2, y0 + 0.002, z - ca * wd / 2, mulc(rc, 0.8)), C = m.v(x + ca * L / 2, y0 + 0.001, z + sa * L / 2, mulc(rc, 0.92)), D = m.v(x - sa * wd / 2, y0 + 0.002, z + ca * wd / 2, mulc(rc, 1.06)), R = m.v(x, y0 + h, z, mulc(rc, 1.1));
    m.triN(R, A, B, 0, 1, 0); m.triN(R, B, C, 0, 1, 0); m.triN(R, C, D, 0, 1, 0); m.triN(R, D, A, 0, 1, 0); cnt.r++;
  }
  for (let t = 0; cnt.c < 145 && t < 2500; t++) {   // chips (rubble)
    const x = lerp(-17.5, 15.6, U(t, 351)), z = lerp(-8.2, 8.9, U(t, 352)); if (!freeSpot(x, z, 0.3)) continue;
    const d = 0.04 + 0.20 * U(t, 353) ** 1.5, h = Math.min(0.045, 0.3 * d), y0 = floorH(x, z), loc = floorCol(x, z, wet, t + 5000), c = mixc(U(t, 354) < 0.5 ? PAL.rub1 : PAL.rub2, PAL.mud, wet * 0.5);
    const ci = m.v(x, y0 + h, z, tone(mulc(c, 1.05), t, 55)), ring = []; for (let i = 0; i < 6; i++) { const a = U(t, 356) * TAU + (i / 6) * TAU, rr = (d / 2) * (0.75 + 0.5 * U(t * 7 + i, 357)); ring.push(m.v(x + Math.cos(a) * rr, y0 + 0.002, z + Math.sin(a) * rr, mixc(loc, mulc(c, 0.8), 0.7))); }
    for (let i = 0; i < 6; i++) m.triN(ci, ring[i], ring[(i + 1) % 6], 0, 1, 0); cnt.c++;
  }
  // the mud band at each outer paw (3.6 x 0.5 m), darker as it wets
  for (const sd of [-1, 1]) {
    const zc = sd * 3.65, xs = []; for (let x = 9.8; x <= 13.4 + 1e-6; x += 0.3) xs.push(x);
    const rows = xs.map((x, i) => { const j0 = (U(i + (sd > 0 ? 40 : 0), 361) - 0.5) * 0.1, j1 = (U(i + (sd > 0 ? 40 : 0), 362) - 0.5) * 0.1, edge = i === 0 || i === xs.length - 1 ? 0.5 : 1; return [-0.25 * edge + j0, 0.25 * edge + j1].map((dz) => { const z = zc + dz, c = mixc(floorCol(x, z, wet, i), PAL.mud, clamp(0.25 + 0.7 * wet)); return m.v(x, floorH(x, z) + 0.004, z, c); }); });
    for (let i = 0; i < rows.length - 1; i++) m.quadN(rows[i][0], rows[i + 1][0], rows[i + 1][1], rows[i][1], 0, 1, 0);
  }
  // the pools: a mud halo here (the water itself is the water layer)
  for (const p of PITSPOTS) {
    const c = mixc(floorCol(p.x, p.z, wet, p.k), PAL.mud, clamp(0.3 + 0.7 * wet)), ring = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, rr = p.r * 1.22 * (0.9 + 0.2 * U(p.k * 31 + i, 371)); ring.push([p.x + Math.cos(a) * rr, floorH(p.x, p.z) + 0.003, p.z + Math.sin(a) * rr]); }
    fanFlat(m, [p.x, floorH(p.x, p.z) + 0.003, p.z], ring, [0, 1, 0], mulc(c, 0.85), c);
  }
}
// ---- the water: ribbons down 28 grooves (10/8/10), dashes marching along them, pools and their ripples
const RIBS = (() => {
  const out = [], bySide = [[], [], []]; GROOVES.forEach((g) => bySide[g.side].push(g));
  [10, 8, 10].forEach((m, side) => { const L = bySide[side]; for (let j = 0; j < m; j++) out.push(L[Math.min(L.length - 1, Math.floor(((j + 0.5) * L.length) / m))]); });
  return out;
})();
function ribbonPaths(gm, match) {
  return RIBS.map((g, ri) => {
    const col0 = makeCol(g.s, match), yTop = col0.H - 0.22, n = Math.ceil((yTop - 0.03) / 0.12), clr = 0.015 + 0.04 * U(g.gi, 381), wd = 0.035 + 0.105 * U(g.gi, 382), pts = [];
    for (let j = 0; j <= n; j++) {
      const y = lerp(yTop, 0.03, j / n), s = g.s + 0.14 * Math.sin(1.4 * y + g.ph), col = makeCol(s, match); let off = 1e9;
      for (let q = 0; q < 4; q++) off = Math.min(off, offTotal(col, y + 0.2 * q, gm));
      const p = wallPt(col, y, off); pts.push({ x: p[0] + col.nx * clr, y, z: p[2] + col.nz * clr, nx: col.nx, nz: col.nz, tx: col.tx, tz: col.tz });
    }
    const cum = [0]; for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y, pts[j].z - pts[j - 1].z));
    return { g, pts, cum, wd, ri };
  });
}
function buildWater(paths, wet, flow) {
  const a = new Acc(true), A = (c, k) => [c[0], c[1], c[2]], aw = 0.62 * wet, ae = 0.5 * wet;
  a.v(0, -50, 0, PAL.water, 0); a.v(0, -50, 0, PAL.water, 0); a.v(0, -50, 0, PAL.water, 0); a.tri(0, 1, 2);
  if (wet < 0.01) return a.geo(false);
  for (const R of paths) {
    const rows = R.pts.map((p) => { const hw = R.wd / 2; return [-hw, -hw * 0.62, hw * 0.62, hw].map((s, h) => a.v(p.x + p.tx * s, p.y, p.z + p.tz * s, h === 0 || h === 3 ? PAL.waterE : PAL.water, h === 0 || h === 3 ? ae : aw)); });
    for (let j = 0; j < rows.length - 1; j++) for (let h = 0; h < 3; h++) a.quadN(rows[j][h], rows[j + 1][h], rows[j + 1][h + 1], rows[j][h + 1], R.pts[j].nx, 0, R.pts[j].nz);
    const Lt = R.cum[R.cum.length - 1], at = (d) => { let j = 1; while (j < R.cum.length - 1 && R.cum[j] < d) j++; const t = clamp((d - R.cum[j - 1]) / (R.cum[j] - R.cum[j - 1] + 1e-9)), p = R.pts[j - 1], q = R.pts[j]; return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), z: lerp(p.z, q.z, t), nx: p.nx, nz: p.nz, tx: p.tx, tz: p.tz }; };
    for (let j = 0; j < 7; j++) {   // 7 dashes at fract(flow + U + j/7)
      const q = (flow + U(R.g.gi, 391) + j / 7) % 1, d0 = q * Lt, d1 = Math.min(Lt, d0 + 0.22), fade = Math.sin(Math.PI * q);
      if (d1 - d0 < 0.05) continue; const p0 = at(d0), p1 = at(d1), hw = R.wd * 0.3, al = 0.8 * wet * fade, o = 0.004;
      const v = [p0, p1].flatMap((p) => [a.v(p.x + p.tx * -hw + p.nx * o, p.y, p.z + p.tz * -hw + p.nz * o, PAL.waterE, al), a.v(p.x + p.tx * hw + p.nx * o, p.y, p.z + p.tz * hw + p.nz * o, PAL.waterE, al)]);
      a.quadN(v[0], v[1], v[3], v[2], p0.nx, 0, p0.nz);
    }
  }
  for (const p of PITSPOTS) {   // pools (depth 0.007-0.019 below the mud's rim is the halo's job) and 2 ripples each
    const y = floorH(p.x, p.z) + 0.006, ring = [], ring2 = []; for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU, rr = p.r * (0.88 + 0.12 * U(p.k * 31 + i, 372)); ring.push([p.x + Math.cos(an) * rr, y, p.z + Math.sin(an) * rr]); ring2.push([p.x + Math.cos(an) * rr * 0.86, y, p.z + Math.sin(an) * rr * 0.86]); }
    const ci = a.v(p.x, y, p.z, PAL.water, 0.62 * wet), r1 = ring.map((q) => a.v(q[0], q[1], q[2], PAL.waterE, 0.5 * wet)), r2 = ring2.map((q) => a.v(q[0], q[1] + 0.0005, q[2], PAL.water, 0.62 * wet));
    for (let i = 0; i < 18; i++) { a.triN(ci, r2[i], r2[(i + 1) % 18], 0, 1, 0); a.quadN(r2[i], r1[i], r1[(i + 1) % 18], r2[(i + 1) % 18], 0, 1, 0); }
    for (let j = 0; j < 2; j++) {
      const q = (flow + U(p.k, 392) + j / 2) % 1, rr = lerp(0.06, 0.38, q), al = 0.32 * wet * (1 - q), w = 0.022, o = [], ii = [];
      for (let i = 0; i < 16; i++) { const an = (i / 16) * TAU; o.push(a.v(p.x + Math.cos(an) * (rr + w), y + 0.002, p.z + Math.sin(an) * (rr + w), PAL.waterE, al)); ii.push(a.v(p.x + Math.cos(an) * rr, y + 0.002, p.z + Math.sin(an) * rr, PAL.waterE, al)); }
      for (let i = 0; i < 16; i++) a.quadN(ii[i], o[i], o[(i + 1) % 16], ii[(i + 1) % 16], 0, 1, 0);
    }
  }
  void A; return a.geo(false);
}

function buildPit(P) {
  const S = P.spec, root = P.whole, st = pitStatic(S);
  const rockM = rockMat(), groundM = groundMat(), marksM = markMat(), wM = waterMat();
  const terr = new Acc(); buildTerrain(terr, st.match);
  addMesh(root, terr.geo(), groundM);
  const rockMesh = addMesh(root, new THREE.BufferGeometry(), rockM, { cast: true }), floorMesh = addMesh(root, new THREE.BufferGeometry(), groundM), marksMesh = addMesh(root, new THREE.BufferGeometry(), marksM, { solid: false }), waterMesh = addMesh(root, new THREE.BufferGeometry(), wM, { steam: true, order: 6, solid: false });
  let kHeavy = "", kWater = "", paths = null;
  const info = root.userData; info.tris = {};
  const run = (wet, flow, quarry) => {
    const dm = 1 - 0.24 * wet * (1 - flow), kh = `${wet.toFixed(3)}|${dm.toFixed(3)}|${quarry.toFixed(3)}`;
    if (kh !== kHeavy) {
      kHeavy = kh; const gm = grooveMuls(st.match, dm, quarry), rock = new Acc(), marks = new Acc(), floor = new Acc();
      buildRock(rock, marks, floor, gm, wet, quarry, st); wallMarks(marks, gm, wet, st.match); floorMarks(marks, wet);
      swapGeo(rockMesh, rock.geo()); swapGeo(floorMesh, floor.geo()); swapGeo(marksMesh, marks.geo()); paths = ribbonPaths(gm, st.match); kWater = "";
      info.tris = { rock: rock.tris, floor: floor.tris, marks: marks.tris, terrain: terr.tris };
    }
    const kw = `${wet.toFixed(3)}|${flow.toFixed(3)}`;
    if (kw !== kWater) { kWater = kw; const g = buildWater(paths, wet, flow); swapGeo(waterMesh, g); info.tris.water = g.index.count / 3; }
  };
  run(clamp(num({}, S, "wet", 0)), clamp(num({}, S, "flow", 0)), clamp(num({}, S, "quarry", 0)));
  return { grip: 0, apply(ps) { run(clamp(num(ps, S, "wet", 0)), clamp(num(ps, S, "flow", 0)), clamp(num(ps, S, "quarry", 0))); } };
}

// ---------------------------------------------------------------------------------------------------------------
// THE SPHINX TEMPLE (sphinxtemple): origin (25.60, 0, 0) in the world frame, front +x. Built in world coordinates.
const TX = 25.6, TW = 17.88, TD = 21.0, TT = 1.35, CH = [0.88, 0.92, 1.05], CY = [0, 0.88, 1.80];
const BLOCKC = { soft: PAL.coreS, hard: PAL.coreH, edge: PAL.tedge, seam: PAL.ink };
const RET_PCT = [1.0, 0.72, 0.15];
// the wall runs (local frame, x front/east, z south): east and west carry the corners, north and south run between them
const RUNS = (() => {
  const hx = TW / 2, hz = TD / 2, c = TT / 2;
  return [
    { name: "east", order: 0, axis: "z", fixed: hx - c, a0: -hz, a1: hz, th: TT, doors: [-5.35, 5.35] },
    { name: "north", order: 1, axis: "x", fixed: -hz + c, a0: -hx + TT, a1: hx - TT, th: TT },
    { name: "west", order: 2, axis: "z", fixed: -hx + c, a0: -hz, a1: hz, th: TT },
    { name: "south", order: 3, axis: "x", fixed: hz - c, a0: -hx + TT, a1: hx - TT, th: TT },
    // the two sanctuaries (2.30 x 4.10 at x +-5.45): a back wall and two side walls 0.5 thick
    ...[1, -1].flatMap((sd, q) => [
      { name: "sanN" + q, order: 4, axis: "x", fixed: -1.80, a0: sd * 5.45 - 1.15, a1: sd * 5.45 + 1.15, th: 0.5 },
      { name: "sanS" + q, order: 4, axis: "x", fixed: 1.80, a0: sd * 5.45 - 1.15, a1: sd * 5.45 + 1.15, th: 0.5 },
      { name: "sanB" + q, order: 4, axis: "z", fixed: sd * 6.35, a0: -2.05, a1: 2.05, th: 0.5 },
    ]),
  ];
})();
const PIERS = (() => {
  const out = []; for (let i = 0; i < 6; i++) { const t = -3.6 + (7.2 * i) / 5, u = -4.2 + (8.4 * i) / 5; out.push([t, -5.2], [t, 5.2], [-4.55, u], [4.55, u]); }
  return out;
})();
// the blocks of one wall course of one run (a door splits it for the two lower courses): lengths 0.92-1.34 with a half-block stagger
function layoutRun(run, c, state, monoSet) {
  const segs = []; if (run.doors && c < 2) { let a = run.a0; for (const d of run.doors) { segs.push([a, d - 0.725]); a = d + 0.725; } segs.push([a, run.a1]); } else segs.push([run.a0, run.a1]);
  const out = [];
  for (const [sa, sb] of segs) {
    let u = sa, first = true;
    while (u < sb - 0.05) {
      const idx = state.n++, mono = c === 0 && monoSet && monoSet.has(state.n0), reg = 0.92 + 0.42 * U(idx, 401);
      let len = mono ? 1.9 + 0.34 * U(idx, 402) : reg; if (c === 0) state.n0++;
      if (first && c % 2 === 1) len = reg * 0.5; first = false;
      const ub = Math.min(sb, u + len), jn = 0.022 + 0.024 * U(idx, 403);
      if (ub - u > 0.2) out.push({ idx, run, c, ua: u, ub, jn, mono: !!mono, h: mono ? 0.98 : CH[c], gap: ub < sb - 1e-6 });
      u = ub;
    }
  }
  return out;
}
function layoutAll(era) {
  const probe = { n: 0, n0: 0 }; RUNS.forEach((r) => [0, 1, 2].forEach((c) => layoutRun(r, c, probe, null)));
  const N0 = probe.n0, mono = new Set(Array.from({ length: 6 }, (_, j) => Math.floor(((j + 0.5) * N0) / 6)));
  const st = { n: 0, n0: 0 }, all = [];
  for (const r of RUNS) for (const c of [0, 1, 2]) for (const b of layoutRun(r, c, st, mono)) all.push(b);
  // retention
  const keep = [];
  if (era === "ruin") { for (const b of all) if (U(b.idx, 404) < RET_PCT[b.c] || b.mono) keep.push(b); }
  else {
    const c3 = all.filter((b) => b.c === 2 && (b.run.name === "north" || b.run.name === "east")), ne = (b) => (b.run.name === "east" && b.ua < -10.5 + 1.4 + 0.2) || (b.run.name === "north" && b.ub > TW / 2 - TT - 0.01 - 1.4 + 1.35);
    const corner = new Set(c3.filter(ne).slice(0, 2)), empty = new Set(corner); [...c3].sort((p, q) => U(q.idx, 421) - U(p.idx, 421)).filter((b) => !empty.has(b)).slice(0, 5 - Math.min(2, corner.size)).forEach((b) => empty.add(b));
    for (const b of all) if (!empty.has(b)) keep.push(b);
  }
  return keep;
}
function worldBox(b) {
  const r = b.run, a0 = b.ua + b.jn / 2 * (b.ua > r.a0 + 1e-6 ? 1 : 0), a1 = b.ub - b.jn / 2 * (b.gap ? 1 : 0), f0 = r.fixed - r.th / 2, f1 = r.fixed + r.th / 2;
  return r.axis === "x" ? { x0: TX + a0, x1: TX + a1, z0: f0, z1: f1 } : { x0: TX + f0, x1: TX + f1, z0: a0, z1: a1 };
}
function rotateRange(a, from, cx, cz, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = from; i < a.p.length / 3; i++) { const x = a.p[i * 3] - cx, z = a.p[i * 3 + 2] - cz; a.p[i * 3] = cx + x * c - z * s; a.p[i * 3 + 2] = cz + x * s + z * c; }
}
// per block: 3 chips, 5 pits, 2 chisel marks (0.018-0.08 m) on its big faces and top
function blockMarks(m, bx, y0, y1, idx, tone0, off = null, lv = 2) {   // lv 2: the feature blocks (3 chips, 13 pits, 2 chisel marks), 1: wall blocks (1, 5, 1), 0: small stumps (0, 1, 0)
  const nC = [0, 1, 3][lv], nP = [1, 3, 5][lv], nS = [0, 2, 8][lv], nG = [0, 1, 2][lv];
  const cx = (bx.x0 + bx.x1) / 2, cz = (bx.z0 + bx.z1) / 2, hx = (bx.x1 - bx.x0) / 2, hz = (bx.z1 - bx.z0) / 2;
  const place = (k) => { const f = U(idx * 17 + k, 441), px = U(idx * 17 + k, 442), py = U(idx * 17 + k, 443);
    const wide = hx >= hz;   // the long axis is x: the big faces are +-z
    if (f < 0.20) return { p: [lerp(bx.x0 + 0.12, bx.x1 - 0.12, px), y1, lerp(bx.z0 + 0.12, bx.z1 - 0.12, py)], n: [0, 1, 0], t: [1, 0, 0] };
    const sd = f < 0.60 ? 1 : -1, yy = lerp(y0 + 0.06, y1 - 0.06, py);
    const xx = lerp(bx.x0 + 0.12, bx.x1 - 0.12, px), zz = lerp(bx.z0 + 0.12, bx.z1 - 0.12, px), o = off ? off(yy, wide ? xx - (bx.x0 + bx.x1) / 2 : 0) : 0;
    return wide ? { p: [xx, yy, (sd > 0 ? bx.z1 : bx.z0) - sd * o], n: [0, 0, sd], t: [1, 0, 0] } : { p: [(sd > 0 ? bx.x1 : bx.x0) - sd * o, yy, zz], n: [sd, 0, 0], t: [0, 0, 1] };
  };
  const loc = mulc(mixc(PAL.coreS, PAL.coreH, 0.5), tone0);
  for (let k = 0; k < nC; k++) { const q = place(k), r = 0.009 + 0.031 * U(idx * 17 + k, 444); dimple(m, q.p, q.n, r, 0.008, mixc(loc, PAL.tedge, 0.55), mixc(loc, PAL.joint, 0.5), TAU * U(idx * 17 + k, 445)); }   // chips: pale broken edge
  for (let k = 3; k < 3 + nP; k++) { const q = place(k), r = 0.022 + 0.045 * U(idx * 17 + k, 446); dimple(m, q.p, q.n, r, 0.012 + 0.018 * U(idx * 17 + k, 447), mixc(loc, PAL.pit, 0.35), mixc(loc, PAL.pit, 0.9), TAU * U(idx * 17 + k, 448)); }   // weathering pits
  for (let k = 20; k < 20 + nS; k++) { const q = place(k), r = 0.012 + 0.025 * U(idx * 17 + k, 746); dimple(m, q.p, q.n, r, 0.009 + 0.012 * U(idx * 17 + k, 747), mixc(loc, PAL.pit, 0.3), mixc(loc, PAL.pit, 0.85), TAU * U(idx * 17 + k, 748)); }
  for (let k = 8; k < 8 + nG; k++) { const q = place(k), L = 0.018 + 0.062 * U(idx * 17 + k, 449), ang = (U(idx * 17 + k, 450) - 0.5) * 1.2, t2 = q.n[1] === 1 ? [0, 0, 1] : [0, 1, 0], d = [q.t[0] * Math.cos(ang) + t2[0] * Math.sin(ang), q.t[1] * Math.cos(ang) + t2[1] * Math.sin(ang), q.t[2] * Math.cos(ang) + t2[2] * Math.sin(ang)];
    vgroove(m, [q.p[0] - d[0] * L / 2, q.p[1] - d[1] * L / 2, q.p[2] - d[2] * L / 2], [q.p[0] + d[0] * L / 2, q.p[1] + d[1] * L / 2, q.p[2] + d[2] * L / 2], q.n, 0.008, 0.005, mixc(loc, PAL.ink, 0.2), mixc(loc, PAL.ink, 0.55)); }
}
function emitBlock(rock, marks, bx, y0, y1, idx, extra = {}) {
  const sx = 1.40 + 0.46 * (idx % 9), sy = 0.97 + 0.13 * (idx % 5), cx = (bx.x0 + bx.x1) / 2, tn = 0.93 + 0.12 * U(idx, 405);
  const bed = extra.bed ?? ((k, ex) => y0 + (Bf(k, sx + ex, -7.55) - sy));
  const wb = weatheredBlock(rock, bx, y0, y1, { ...BLOCKC, ...extra, key: idx, tone: tn, bed });
  const big = Math.max(bx.x1 - bx.x0, bx.z1 - bx.z0) >= 1.7;
  void cx; blockMarks(marks, bx, y0, y1, idx, tn, wb.off, extra.lite ? 0 : big ? 2 : 1);
}
function buildTempleGeo(S, era, buildP, match) {
  const rock = new Acc(), marks = new Acc(), floor = new Acc();
  const quarry = era === "quarry", kept = layoutAll(era);
  // the ranked list: wall blocks by course then run then along the run; piers' courses join as the interior run; furniture last
  const items = []; kept.forEach((b) => items.push({ k: [b.c, b.run.order, b.run.order === 4 ? b.idx : b.ua], t: "wall", b }));
  if (quarry) {
    PIERS.forEach((p, i) => { for (let j = 0; j < 4; j++) items.push({ k: [j, 4, 1000 + i], t: "pier", p, i, j }); });
    for (let i = 0; i < 10; i++) items.push({ k: [3.5, 5, i], t: "base", i });
    for (let i = 0; i < 3; i++) items.push({ k: [3.6, 6, i], t: "blank", i });
  }
  items.sort((p, q) => p.k[0] - q.k[0] || p.k[1] - q.k[1] || p.k[2] - q.k[2]);
  let n1 = kept.filter((b) => b.c === 0).length, N = items.length, vis = quarry ? Math.floor(lerp(0.35 * n1, N, clamp(buildP)) + 1e-6) : N;
  if (quarry && buildP >= 0.999) vis = N;
  // footings (recessed 0.14, top flush): under every run
  for (const r of RUNS) { if (r.order === 4 && !quarry) continue; const f0 = r.fixed - r.th / 2 - 0.06, f1 = r.fixed + r.th / 2 + 0.06, c = mixc(PAL.tedge, PAL.coreH, 0.5);
    if (r.axis === "x") plainBox(floor, TX + r.a0 - 0.06, -0.14, f0, TX + r.a1 + 0.06, 0.004, f1, mulc(c, 0.8), c); else plainBox(floor, TX + f0, -0.14, r.a0 - 0.06, TX + f1, 0.004, r.a1 + 0.06, mulc(c, 0.8), c); }
  const prev = new Map();
  for (let q = 0; q < vis; q++) {
    const it = items[q];
    if (it.t === "wall") {
      const b = it.b, bx = worldBox(b), y0 = CY[b.c], y1 = y0 + b.h;
      emitBlock(rock, marks, bx, b.c === 0 ? 0 : y0, y1, b.idx);
      // a dark closer in the joint to the neighbour on the same course when both stand
      const key = `${b.run.name}|${b.c}`, pb = prev.get(key); if (pb && Math.abs(pb.ub - b.ua) < 1e-6) { const r = b.run, jm = b.ua, h = Math.min(pb.h, b.h), jc = mulc(PAL.joint, 0.8);
        const f0 = r.fixed - r.th / 2, f1 = r.fixed + r.th / 2; let v;
        if (r.axis === "x") v = [rock.v(TX + jm, y0, f0, jc), rock.v(TX + jm, y0, f1, jc), rock.v(TX + jm, y0 + h, f1, jc), rock.v(TX + jm, y0 + h, f0, jc)]; else v = [rock.v(TX + f0, y0, jm, jc), rock.v(TX + f1, y0, jm, jc), rock.v(TX + f1, y0 + h, jm, jc), rock.v(TX + f0, y0 + h, jm, jc)];
        rock.quadN(v[0], v[1], v[2], v[3], r.axis === "x" ? 1 : 0, 0, r.axis === "x" ? 0 : 1); }
      prev.set(key, b);
    } else if (it.t === "pier") {
      const [px, pz] = it.p, h = 0.46, bx = { x0: TX + px - 0.28, x1: TX + px + 0.28, z0: pz - 0.28, z1: pz + 0.28 };
      emitBlock(rock, marks, bx, h * it.j, h * (it.j + 1), 600 + it.i * 4 + it.j, { lite: true });
    } else if (it.t === "base") {
      const i = it.i, pos = [[-2.88, -4.45], [0, -4.45], [2.88, -4.45], [-2.88, 4.45], [0, 4.45], [2.88, 4.45], [-3.65, -1.7], [-3.65, 1.7], [3.65, -1.7], [3.65, 1.7]][i];
      const a0 = rock.p.length / 3; plainBox(rock, TX + pos[0] - 0.34, 0, pos[1] - 0.325, TX + pos[0] + 0.34, 0.26, pos[1] + 0.325, mixc(PAL.coreS, PAL.coreH, 0.5), mixc(PAL.tedge, PAL.coreH, 0.4)); void a0;
    } else if (it.t === "blank") {
      const i = it.i, from = rock.p.length / 3, cx = TX + 10.6 + 0.9 * i, cz = [-3.4, 0.6, 4.4][i];
      emitBlock(rock, marks, { x0: cx - 0.58, x1: cx + 0.58, z0: cz - 0.42, z1: cz + 0.42 }, 0, 0.32, 700 + i, { soft: PAL.tedge, hard: mixc(PAL.tedge, PAL.coreH, 0.3), lite: true });
      rotateRange(rock, from, cx, cz, (U(i, 451) - 0.5) * 0.7);
    }
  }
  // the ruin's pier stumps
  if (!quarry) {
    const order = PIERS.map((_, i) => i).sort((p, q) => U(p, 431) - U(q, 431)).slice(0, 15);
    order.forEach((i) => { const [px, pz] = PIERS[i], h = 0.12 + 0.36 * U(i, 432); emitBlock(rock, marks, { x0: TX + px - 0.28 + 0.02 * U(i, 433), x1: TX + px + 0.28, z0: pz - 0.28, z1: pz + 0.28 - 0.03 * U(i, 434) }, 0, h, 600 + i, { lite: true }); });
  }
  // the paving: 1.3 x 1.6 slabs 0.10 thick (top y 0.012) over the inside; the ruin keeps 85%; the quarry lays it late
  if (!quarry || buildP >= 0.88) {
    const x0 = -TW / 2 + TT, x1 = TW / 2 - TT, z0 = -TD / 2 + TT, z1 = TD / 2 - TT, nx = Math.ceil((x1 - x0) / 1.3), nz = Math.ceil((z1 - z0) / 1.6);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (!quarry && U(i * 31 + j, 461) > 0.85) continue;
      const ax = lerp(x0, x1, i / nx), bx = lerp(x0, x1, (i + 1) / nx), az = lerp(z0, z1, j / nz), bz = lerp(z0, z1, (j + 1) / nz), g = 0.012, c = tone(mixc(PAL.paving, PAL.tedge, 0.2 * U(i * 7 + j, 462)), i * 13 + j, 463, 0.035), dk = mulc(PAL.joint, 0.8);
      const u = [rock.v(TX + ax - 0.01, 0.004, az - 0.01, dk), rock.v(TX + bx + 0.01, 0.004, az - 0.01, dk), rock.v(TX + bx + 0.01, 0.004, bz + 0.01, dk), rock.v(TX + ax - 0.01, 0.004, bz + 0.01, dk)]; rock.quadN(u[0], u[1], u[2], u[3], 0, 1, 0);
      const t = [rock.v(TX + ax + g, 0.012, az + g, c), rock.v(TX + bx - g, 0.012, az + g, c), rock.v(TX + bx - g, 0.012, bz - g, c), rock.v(TX + ax + g, 0.012, bz - g, c)]; rock.quadN(t[0], t[1], t[2], t[3], 0, 1, 0);
    }
  }
  // the witness block (match): 2.24 x 0.98 x 1.12 at world (6.08, 1.12, -8.11), front +z, the beds of the pit wall at z -7.55
  let seamErr = 0;
  if (match) {
    const W = WITNESS, bx = { x0: W.x - W.w / 2, x1: W.x + W.w / 2, z0: W.z - W.d / 2, z1: W.z + W.d / 2 };
    const bed = (k, ex) => Bf(k, W.x + ex, -7.55);
    const wb = weatheredBlock(rock, bx, W.y, W.y + W.h, { ...BLOCKC, key: 91, bed });
    for (let m = 0; m < 24; m++) { const key = 900 + m, L = 0.05 + 0.09 * U(key, 61), ang = (65 + 17 * U(key, 63)) * DEG * (U(key, 64) < 0.5 ? -1 : 1), px = lerp(bx.x0 + 0.1, bx.x1 - 0.1, U(key, 66)), py = lerp(W.y + 0.1, W.y + W.h - 0.1, U(key, 67)), loc = mixc(PAL.hf, PAL.hw, 0.3);
      vgroove(marks, [px - Math.cos(ang) * L / 2, py - Math.sin(ang) * L / 2, bx.z1 - wb.off(py, px - W.x)], [px + Math.cos(ang) * L / 2, py + Math.sin(ang) * L / 2, bx.z1 - wb.off(py, px - W.x)], [0, 0, 1], 0.012, 0.005, mixc(loc, PAL.ink, 0.25), mixc(loc, PAL.ink, 0.6)); }
    blockMarks(marks, bx, W.y, W.y + W.h, 91, 1, wb.off, 2);
    // the seam mismatch at the 0.005 m joint: both fronts evaluate B(k, x, -7.55) at their own world x (setback 0.025, bevel 0.004)
    for (let k = 0; k < 6; k++) for (let i = 0; i <= 8; i++) { const xw = lerp(RET.x0 - 0.2, RET.x0, i / 8), xr = xw + 0.005; seamErr = Math.max(seamErr, Math.abs(Bf(k, xw, -7.55) - Bf(k, xr, -7.55)) + 0.004 * 0); }
  }
  return { rock, marks, floor, seamErr, vis, N };
}
function buildTemple(P) {
  const S = P.spec, root = P.whole, era = S.era === "quarry" ? "quarry" : "ruin", match = !!S.match;
  const rockM = rockMat(), marksM = markMat(), floorM = groundMat();
  const rockMesh = addMesh(root, new THREE.BufferGeometry(), rockM, { cast: true }), marksMesh = addMesh(root, new THREE.BufferGeometry(), marksM, { solid: false }), floorMesh = addMesh(root, new THREE.BufferGeometry(), floorM);
  let key = ""; const info = root.userData;
  const run = (b) => {
    const bp = era === "quarry" ? clamp(b) : 1, probe = era === "quarry" ? buildTempleGeo(S, era, bp, match) : null, k = era === "quarry" ? `${probe.vis}|${bp >= 0.88}` : "ruin";
    if (k === key) return; key = k;
    const g = probe ?? buildTempleGeo(S, era, 1, match);
    swapGeo(rockMesh, g.rock.geo()); swapGeo(marksMesh, g.marks.geo()); swapGeo(floorMesh, g.floor.geo());
    info.tris = { rock: g.rock.tris, marks: g.marks.tris, floor: g.floor.tris }; info.seamError = g.seamErr; info.visible = g.vis; info.total = g.N;
  };
  run(num({}, S, "build", 0));
  return { grip: 0, apply(ps) { run(num(ps, S, "build", 0)); } };
}

// ---------------------------------------------------------------------------------------------------------------
// KHAFRE'S VALLEY TEMPLE MINIATURE + the compressed causeway (khafrevalley). World frame; the temple's middle (25.60, 0, 19.64).
const VX = 25.6, VZ = 19.64, VH = 3.6, VB = Math.tan(7 * DEG), vBat = (v) => 8.8 - v * VB;
// hollow volumes of the inside (local x east, z south): [x0, x1, z0, z1, ceiling]
const VOLS = [
  [-5.0, -0.2, -4.9, 4.9, 3.0],            // the crossbar of the T
  [-0.2, 6.2, -2.4, 2.4, 3.0],             // the stem
  [-0.2, 8.4, -5.27, -4.03, 2.55],         // the north portal's passage
  [-0.2, 8.4, 4.03, 5.27, 2.55],           // the south portal's passage
  [-8.8, -5.1, -7.865, -6.515, 2.32],      // the west exit's passage
  [-5.8, -4.5, -7.865, -4.9, 2.32],        // its turn to the crossbar
];
const PILLARS = [...[-1, 1].flatMap((sx) => [-2, -1, 0, 1, 2].map((j) => [-2.6 + sx * 0.81, j * 1.62])), ...[-1, 0, 1].flatMap((i) => [-1, 1].map((sz) => [3.0 + i * 1.62, sz * 0.81]))];
function vface(name) {   // a battered outer face: p(u, v) and its outward normal
  const c = Math.cos(7 * DEG), s = Math.sin(7 * DEG);
  switch (name) {
    case "east": return { p: (u, v) => [VX + vBat(v), v, VZ + u], n: [c, s, 0] };
    case "west": return { p: (u, v) => [VX - vBat(v), v, VZ + u], n: [-c, s, 0] };
    case "south": return { p: (u, v) => [VX + u, v, VZ + vBat(v)], n: [0, s, c] };
    default: return { p: (u, v) => [VX + u, v, VZ - vBat(v)], n: [0, s, -c] };
  }
}
const FACES = {
  east: { rows: [0, 1.2, 2.55, 3.6], open: [[-4.65, 1.24, 2.55], [4.65, 1.24, 2.55]] },
  west: { rows: [0, 1.16, 2.32, 3.6], open: [[-7.19, 1.35, 2.32]] },
  south: { rows: [0, 1.2, 2.4, 3.6], open: [] },
  north: { rows: [0, 1.2, 2.4, 3.6], open: [] },
};
// a flat little quad on a face (a grain line or a fleck): centre p, normal n, tangent t, w x h
function flatQ(a, p, n, t, w, h, c, off = 0.003) {
  const b = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
  const V = (sx, sy) => a.v(p[0] + t[0] * sx * w / 2 + b[0] * sy * h / 2 + n[0] * off, p[1] + t[1] * sx * w / 2 + b[1] * sy * h / 2 + n[1] * off, p[2] + t[2] * sx * w / 2 + b[2] * sy * h / 2 + n[2] * off, c);
  a.quadN(V(-1, -1), V(1, -1), V(1, 1), V(-1, 1), n[0], n[1], n[2]);
}
function buildValleyGeo() {
  const rock = new Acc(), marks = new Acc(), jc = mulc(PAL.joint, 0.7);
  // ---- the four granite-faced walls: 6 casing columns (5 joints) x 3 rows, each slab its own tone, 3 grain lines, 11 flecks
  let sl = 0;
  for (const [name, F] of Object.entries(FACES)) {
    const f = vface(name), cols = 6, tdir = name === "east" ? [0, 0, 1] : name === "west" ? [0, 0, -1] : name === "south" ? [-1, 0, 0] : [1, 0, 0];
    const uSign = name === "east" || name === "north" ? 1 : name === "west" ? 1 : 1;
    for (let r = 0; r < 3; r++) for (let cI = 0; cI < cols; cI++) {
      const u0 = -8.8 + (17.6 * cI) / cols, u1 = -8.8 + (17.6 * (cI + 1)) / cols, v0 = F.rows[r], v1 = F.rows[r + 1];
      // cut the openings (a row under an opening's top)
      let iv = [[u0, u1]];
      for (const [oc, ow, ot] of F.open) if (v1 <= ot + 1e-6) { const a = oc - ow / 2, b = oc + ow / 2; iv = iv.flatMap(([p, q]) => (b <= p || a >= q ? [[p, q]] : [[p, Math.min(q, a)], [Math.max(p, b), q]].filter(([x, y]) => y > x + 0.02))); }
      for (const [p, q] of iv) {
        const key = sl++, tone0 = 0.9 + 0.2 * U(key, 501), c = mixc(PAL.gran, PAL.granL, 0.2 + 0.5 * U(key, 502));
        const P = (u, v, o) => { const w = f.p(u, v); return [w[0] + f.n[0] * o, w[1] + f.n[1] * o, w[2] + f.n[2] * o]; };
        const back = [P(p, v0, 0), P(q, v0, 0), P(q, v1, 0), P(p, v1, 0)].map((w) => rock.v(w[0], w[1], w[2], jc)); rock.quadN(back[0], back[1], back[2], back[3], f.n[0], f.n[1], f.n[2]);
        const g = 0.01, front = [P(p + g, v0 + g, 0.012), P(q - g, v0 + g, 0.012), P(q - g, v1 - g, 0.012), P(p + g, v1 - g, 0.012)].map((w, i) => rock.v(w[0], w[1], w[2], tone(mulc(i < 2 ? mixc(c, PAL.grain, 0.12) : c, tone0), key * 5 + i, 503, 0.03))); rock.quadN(front[0], front[1], front[2], front[3], f.n[0], f.n[1], f.n[2]);
        // 3 grain lines and 11 flecks
        const mid = (u, v) => P(u, v, 0.012);
        for (let k = 0; k < 3; k++) { const u = lerp(p + 0.2, q - 0.2, U(key * 3 + k, 511)), v = lerp(v0 + 0.15, v1 - 0.15, U(key * 3 + k, 512)), L = 0.3 + 0.9 * U(key * 3 + k, 513); const pt = mid(u, v); flatQ(marks, pt, f.n, tdir, Math.min(L, q - p - 0.2), 0.012, mixc(c, PAL.grain, 0.55)); }
        for (let k = 0; k < 11; k++) { const u = lerp(p + 0.05, q - 0.05, U(key * 11 + k, 521)), v = lerp(v0 + 0.05, v1 - 0.05, U(key * 11 + k, 522)), s2 = 0.008 + 0.019 * U(key * 11 + k, 523); flatQ(marks, mid(u, v), f.n, tdir, s2, s2, U(key * 11 + k, 524) < 0.5 ? PAL.grain : PAL.granL); }
      }
    }
    // jambs 0.16 beside each opening
    for (const [oc, ow, ot] of F.open) for (const sd of [-1, 1]) {
      const a = oc + sd * ow / 2, b = a + sd * 0.16, w = [f.p(Math.min(a, b), 0), f.p(Math.max(a, b), 0), f.p(Math.max(a, b), ot), f.p(Math.min(a, b), ot)];
      const q = w.map((t, i) => rock.v(t[0] + f.n[0] * 0.02, t[1] + (i < 2 ? 0 : 0), t[2] + f.n[2] * 0.02, mixc(PAL.granL, PAL.gran, 0.3))); rock.quadN(q[0], q[1], q[2], q[3], f.n[0], f.n[1], f.n[2]);
    }
    void uSign;
  }
  // ---- the roof: limestone slabs inside a 0.22 granite band, joints between the slabs
  { const hb = vBat(VH), band = 0.22, y = VH, n = 6, c0 = mixc(PAL.coreS, PAL.coreH, 0.4);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x0 = -hb + band + ((2 * hb - 2 * band) * i) / n, x1 = -hb + band + ((2 * hb - 2 * band) * (i + 1)) / n, z0 = -hb + band + ((2 * hb - 2 * band) * j) / n, z1 = -hb + band + ((2 * hb - 2 * band) * (j + 1)) / n, key = 800 + j * 7 + i, c = tone(mixc(c0, PAL.tedge, 0.25 * U(key, 531)), key, 532, 0.04);
      const b = [rock.v(VX + x0, y - 0.01, VZ + z0, mulc(PAL.joint, 0.8)), rock.v(VX + x1, y - 0.01, VZ + z0, mulc(PAL.joint, 0.8)), rock.v(VX + x1, y - 0.01, VZ + z1, mulc(PAL.joint, 0.8)), rock.v(VX + x0, y - 0.01, VZ + z1, mulc(PAL.joint, 0.8))]; rock.quadN(b[0], b[1], b[2], b[3], 0, 1, 0);
      const t = [rock.v(VX + x0 + 0.012, y, VZ + z0 + 0.012, c), rock.v(VX + x1 - 0.012, y, VZ + z0 + 0.012, c), rock.v(VX + x1 - 0.012, y, VZ + z1 - 0.012, c), rock.v(VX + x0 + 0.012, y, VZ + z1 - 0.012, c)]; rock.quadN(t[0], t[1], t[2], t[3], 0, 1, 0);
      for (let k = 0; k < 3; k++) flatQ(marks, [VX + lerp(x0 + 0.2, x1 - 0.2, U(key * 3 + k, 541)), y, VZ + lerp(z0 + 0.2, z1 - 0.2, U(key * 3 + k, 542))], [0, 1, 0], [1, 0, 0], 0.4 + 0.6 * U(key * 3 + k, 543), 0.012, mixc(c, PAL.joint, 0.45));
      for (let k = 0; k < 11; k++) { const s2 = 0.008 + 0.019 * U(key * 11 + k, 544); flatQ(marks, [VX + lerp(x0 + 0.05, x1 - 0.05, U(key * 11 + k, 545)), y, VZ + lerp(z0 + 0.05, z1 - 0.05, U(key * 11 + k, 546))], [0, 1, 0], [1, 0, 0], s2, s2, U(key * 11 + k, 547) < 0.5 ? PAL.joint : PAL.tedge); }
    }
    // the casing's top edge: four strips of granite
    const g = mixc(PAL.granL, PAL.gran, 0.3), s = [[-hb, -hb, hb, -hb + band], [-hb, hb - band, hb, hb], [-hb, -hb + band, -hb + band, hb - band], [hb - band, -hb + band, hb, hb - band]];
    for (const [x0, z0, x1, z1] of s) { const q = [rock.v(VX + x0, y, VZ + z0, g), rock.v(VX + x1, y, VZ + z0, g), rock.v(VX + x1, y, VZ + z1, g), rock.v(VX + x0, y, VZ + z1, g)]; rock.quadN(q[0], q[1], q[2], q[3], 0, 1, 0); }
  }
  // ---- the inside: floor, ceiling and walls of each hollow volume (a wall is left open where a neighbour joins), 16 pillars
  const wallC = mulc(mixc(PAL.gran, PAL.grain, 0.25), 0.62), floorC = mulc(PAL.paving, 0.72), ceilC = mulc(mixc(PAL.gran, PAL.grain, 0.45), 0.5);   // the inside is in shade
  const vq = (pts, c, nx, ny, nz) => { const q = pts.map((p, i) => rock.v(p[0], p[1], p[2], tone(c, Math.round(p[0] * 7 + p[2] * 13 + i), 551, 0.03))); rock.quadN(q[0], q[1], q[2], q[3], nx, ny, nz); };
  VOLS.forEach(([x0, x1, z0, z1, hc], vi) => {
    vq([[VX + x0, 0.002, VZ + z0], [VX + x1, 0.002, VZ + z0], [VX + x1, 0.002, VZ + z1], [VX + x0, 0.002, VZ + z1]], floorC, 0, 1, 0);
    vq([[VX + x0, hc, VZ + z0], [VX + x1, hc, VZ + z0], [VX + x1, hc, VZ + z1], [VX + x0, hc, VZ + z1]], ceilC, 0, -1, 0);
    const open = (axis, pos, lo, hi, sgn) => {   // free intervals of a wall at axis = pos facing sgn: minus the lateral span of every volume that continues on the other side
      let iv = [[lo, hi]]; const e = 1e-4;
      VOLS.forEach((o, oi) => {
        if (oi === vi) return; const [a0, a1, b0, b1] = o, [r0, r1] = axis === "x" ? [a0, a1] : [b0, b1], [s0, s1] = axis === "x" ? [b0, b1] : [a0, a1];
        const across = sgn > 0 ? r0 < pos - e && r1 > pos - e : r1 > pos + e && r0 < pos + e; if (!across) return;
        iv = iv.flatMap(([p, q]) => (s1 <= p || s0 >= q ? [[p, q]] : [[p, Math.min(q, s0)], [Math.max(p, s1), q]].filter(([x, y]) => y > x + 0.01)));
      });
      return iv;
    };
    for (const [pos, sgn] of [[x0, 1], [x1, -1]]) for (const [p, q] of open("x", pos, z0, z1, sgn)) vq([[VX + pos, 0, VZ + p], [VX + pos, 0, VZ + q], [VX + pos, hc, VZ + q], [VX + pos, hc, VZ + p]], wallC, sgn, 0, 0);
    for (const [pos, sgn] of [[z0, 1], [z1, -1]]) for (const [p, q] of open("z", pos, x0, x1, sgn)) vq([[VX + p, 0, VZ + pos], [VX + q, 0, VZ + pos], [VX + q, hc, VZ + pos], [VX + p, hc, VZ + pos]], wallC, 0, 0, sgn);
  });
  PILLARS.forEach(([px, pz], i) => {
    plainBox(rock, VX + px - 0.21, 0, VZ + pz - 0.21, VX + px + 0.21, 2.6, VZ + pz + 0.21, tone(mixc(PAL.gran, PAL.granL, 0.35), i, 561, 0.04), PAL.granL);
    plainBox(rock, VX + px - 0.3, 2.6, VZ + pz - 0.3, VX + px + 0.3, 3.0, VZ + pz + 0.3, mixc(PAL.gran, PAL.grain, 0.2), PAL.granL);
    for (let k = 0; k < 3; k++) flatQ(marks, [VX + px, lerp(0.3, 2.3, U(i * 3 + k, 562)), VZ + pz + 0.21], [0, 0, 1], [1, 0, 0], 0.3, 0.01, mixc(PAL.gran, PAL.grain, 0.6));
  });
  return { rock, marks };
}
// ---- the causeway: a road 1.8 wide with 0.32 high parapets in 1.25 m blocks (0.03 joints), on an embankment down to the terrain, a landing at the end
function buildCauseway(rock) {
  const pts = []; for (let j = 0; j < 2; j++) { const a = CAUSE[j], b = CAUSE[j + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.ceil(L / 2.5); for (let i = j === 0 ? 0 : 1; i <= n; i++) pts.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), lerp(a[2], b[2], i / n)]); }
  const hw = 0.9, pw = 0.30, st = pts.map((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let dx = q[0] - o[0], dz = q[2] - o[2]; const l = Math.hypot(dx, dz); dx /= l; dz /= l; return { p, dx, dz, rx: -dz, rz: dx, g: ground(p[0], p[2], p[0] >= 16.6) }; });
  const road = mixc(PAL.paving, PAL.coreH, 0.4), core = mixc(PAL.coreS, PAL.coreH, 0.45);
  const at = (s, side, off, y) => [s.p[0] + s.rx * side * off, y, s.p[2] + s.rz * side * off];
  for (let i = 0; i < st.length - 1; i++) {
    const A = st[i], B = st[i + 1], tn = 0.95 + 0.1 * U(i, 571);
    const q = [at(A, -1, hw, A.p[1]), at(A, 1, hw, A.p[1]), at(B, 1, hw, B.p[1]), at(B, -1, hw, B.p[1])].map((w, k) => rock.v(w[0], w[1], w[2], tone(mulc(road, tn), i * 4 + k, 572, 0.02))); rock.quadN(q[0], q[1], q[2], q[3], 0, 1, 0);
    for (const side of [-1, 1]) {   // the embankment's face, in 0.6 m courses of banded colour, from the parapet's foot to the terrain
      const sideAt = (S) => { const drop = Math.max(0, S.p[1] - S.g), bt = 0.25 * drop; return { top: at(S, side, hw + pw, S.p[1]), bot: at(S, side, hw + pw + bt, Math.min(S.p[1], S.g - 0.03)), drop }; };
      const a = sideAt(A), b = sideAt(B), m = Math.max(1, Math.ceil(Math.max(a.drop, b.drop) / 0.6)), rows = [];
      for (let k = 0; k <= m; k++) { const t = k / m, c = tone(mulc(mixc(core, PAL.coreS, (k & 1) * 0.35), 0.92), i * 31 + k, 573, 0.03); rows.push([0, 1].map((e) => { const S = e ? b : a, w = [lerp(S.top[0], S.bot[0], t), lerp(S.top[1], S.bot[1], t), lerp(S.top[2], S.bot[2], t)]; return rock.v(w[0], w[1], w[2], c); })); }
      for (let k = 0; k < m; k++) rock.quadN(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0], side * st[i].rx, 0, side * st[i].rz);
    }
  }
  // parapets: blocks 1.25 long, 0.30 thick, 0.32 high, 0.03 joints, both edges
  let acc = 0; const total = (() => { let s = 0; for (let i = 0; i < st.length - 1; i++) s += Math.hypot(st[i + 1].p[0] - st[i].p[0], st[i + 1].p[2] - st[i].p[2]); return s; })();
  const cum = [0]; for (let i = 1; i < st.length; i++) cum.push(cum[i - 1] + Math.hypot(st[i].p[0] - st[i - 1].p[0], st[i].p[2] - st[i - 1].p[2]));
  const sampleAt = (d) => { let i = 1; while (i < st.length - 1 && cum[i] < d) i++; const t = clamp((d - cum[i - 1]) / (cum[i] - cum[i - 1] + 1e-9)), A = st[i - 1], B = st[i]; return { x: lerp(A.p[0], B.p[0], t), y: lerp(A.p[1], B.p[1], t), z: lerp(A.p[2], B.p[2], t), dx: A.dx, dz: A.dz, rx: A.rx, rz: A.rz }; };
  for (let d = 0, bi = 0; d < total - 0.2; d += 1.25, bi++) {
    const d1 = Math.min(total, d + 1.25 - 0.03), P0 = sampleAt(d), P1 = sampleAt(d1), c = tone(mixc(PAL.coreH, PAL.tedge, 0.3 * U(bi, 581)), bi, 582, 0.04);
    for (const side of [-1, 1]) {
      const o0 = hw + (side > 0 ? 0 : 0), pt = (P, e) => [P.x + P.rx * side * (hw + e), P.y, P.z + P.rz * side * (hw + e)];
      const a = pt(P0, 0), b = pt(P0, pw), cc = pt(P1, pw), dd = pt(P1, 0), h = 0.32, up = (w, k) => [w[0], w[1] + k, w[2]]; void o0;
      const V = (w, k, col) => rock.v(w[0], w[1] + k, w[2], col);
      const top = [V(a, h, c), V(b, h, c), V(cc, h, c), V(dd, h, c)]; rock.quadN(top[0], top[1], top[2], top[3], 0, 1, 0);
      const outer = [V(b, 0, mulc(c, 0.9)), V(cc, 0, mulc(c, 0.9)), V(cc, h, mulc(c, 0.95)), V(b, h, mulc(c, 0.95))]; rock.quadN(outer[0], outer[1], outer[2], outer[3], side * P0.rx, 0, side * P0.rz);
      const inner = [V(dd, 0, mulc(c, 0.92)), V(a, 0, mulc(c, 0.92)), V(a, h, c), V(dd, h, c)]; rock.quadN(inner[0], inner[1], inner[2], inner[3], -side * P0.rx, 0, -side * P0.rz);
      const e1 = [V(a, 0, mulc(c, 0.8)), V(b, 0, mulc(c, 0.8)), V(b, h, mulc(c, 0.85)), V(a, h, mulc(c, 0.85))]; rock.quadN(e1[0], e1[1], e1[2], e1[3], -P0.dx, 0, -P0.dz);
      const e2 = [V(cc, 0, mulc(c, 0.8)), V(dd, 0, mulc(c, 0.8)), V(dd, h, mulc(c, 0.85)), V(cc, h, mulc(c, 0.85))]; rock.quadN(e2[0], e2[1], e2[2], e2[3], P1.dx, 0, P1.dz);
    }
    void acc;
  }
  // the landing 3.10 x 0.35 x 4.00 at (-150.55, 6.45, -24.00), on a footing down to the plateau
  plainBox(rock, -150.55 - 1.55, 6.45, -24 - 2.0, -150.55 + 1.55, 6.80, -24 + 2.0, mixc(PAL.coreS, PAL.coreH, 0.5), mixc(PAL.tedge, PAL.coreH, 0.4));
  plainBox(rock, -150.55 - 1.3, -0.1, -24 - 1.7, -150.55 + 1.3, 6.45, -24 + 1.7, mulc(mixc(PAL.coreS, PAL.coreH, 0.4), 0.88));
}
function buildValley(P) {
  const root = P.whole, rockM = rockMat(), marksM = markMat();
  const v = buildValleyGeo(); buildCauseway(v.rock);
  addMesh(root, v.rock.geo(), rockM, { cast: true }); addMesh(root, v.marks.geo(), marksM, { solid: false });
  root.userData.tris = { rock: v.rock.tris, marks: v.marks.tris };
  return { grip: 0, apply() {} };
}

export const EG_SPHINXPIT_GRIPS = {};
export const EG_SPHINXPIT_KINDS = { sphinxpit: buildPit, sphinxtemple: buildTemple, khafrevalley: buildValley };
