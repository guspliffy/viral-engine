// Friends try to 08 "How could 4 friends move a Stonehenge stone?": the haul set (14 Nov 2026). Design:
// storyboards/series/friends-try-to/08-move-a-stonehenge-stone/DESIGN.md (sections 1-4; hands section 5). Bench:
// storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench (make-ftt-haul.mjs, ftt-haul-sheet.png). SEVEN kinds, nothing is held (FTT_HAUL_GRIPS = {}).
//
// THE SET FRAME (every number below, metres): s = forward along the travel line (local +x), r = to the RIGHT of travel (local +z), y up;
// G = the ground under the middle of the stone. Place every kind at the same prop position and `rot: 180` (haullash: rot 0, as the stone), then
//   world x = o.x + 124 - s,  world z = o.z - r   (o = the plain's origin; travel = world -x). Stone at set (0, 0.84, 0).
// All kinds: x/y/z/rot/tilt are the engine's own; the kind's local frame is the set frame, origin as said per kind.
// Look: timber, rope and boulder are scene-lit (they cast and receive shadow-map shadows, no ink outline); every mark (adze facet, crack,
// knot, bark strip, frost feather, grass tick, fibre) is drawn once from a hash of its index (no tiling, no Math.random, no wall clock).
// Every mesh is userData.lookOnly + surfaceOnly (no contact oval, no hand ray, judged by its surface) except the SOLID ones (haulsledge,
// pivotstone: solid true, surfaceOnly true, no lookOnly). userData.triangles on the prop's whole group = the kind's triangle count.
// Params are not in propState: each is in FTT_HAUL_STATE (the engine's KIT_STATE adds it), reads spec.<name> as its start value; seed it with a
// dur-0 set at 0 (c.prop(0, id, { slack: 0 }, 0)) and tween it as any number.
//
//   haulsledge  origin G on the ground, front +s, no params. Two oak runners at r +-0.52 (0.24 wide x 0.36 high, y 0.32..0.68, sole flat from
//               s -1.95 to 2.50, nose sweeping up on a radius 0.80 arc, 60 deg, to s 3.20, tip top y ~1.0; adze facets, cracks, knots, end grain,
//               pale scuffed soles), 4 deck beams (0.22 x 0.16 x 1.90) at s -1.70 -0.57 0.57 1.70 (deck top y 0.84 = stone underside; pale
//               rub marks on top), the round front bar (d 0.18, 2.20 long, centre s 2.40, y 0.77), cord bindings (8 on the beams, 2 on the bar),
//               two rope collars on the bar at r +-0.88 (their ropes start at (2.50, 0.77, +-0.88)). 5.15 long (s -1.95..3.20), 2.20 wide.
//               spec.ride 0.32 (runner soles' y: 0.32 = on the rail tops), spec.seed 1. SOLID. Sittable: beam tops y 0.84.
//   haullash    origin = the middle of the stone's underside, long axis x: give it EXACTLY the stone's x, y, z, rot (0) AND tilt (it rides the stone, also lifted;
//               it is in the stone's frame, not the set frame: its local z is world z, the reef knots on the top at local z +0.35 = r -0.35).
//               spec.size [4.25, 2.1, 1.1] (long, wide, thick). Three closed 2-turn girdles of 0.07 rope at x -1.135, 0, +1.135 (the strands under the
//               stone are modelled), reef knots on top at z +0.35, one ridge rope along the top centre (x +-1.135) with 3 hitch knots and two frayed
//               ends 0.35 long on the top. spec.seed 1. Not solid.
//   haulrails   origin G, +s forward. 2 peeled rails at r +-0.52 (0.20 x 0.15, top y 0.32, s -2.20..33.0, 6 butted trunks each), 58 bark sleepers
//               (d 0.24, 1.50 long, top y 0.19, one per 0.60 from s -1.80 to 32.4; 4 instanced meshes), rime on every rail and sleeper top (feathers),
//               a bare damp-wood footprint of each runner sole, a ground apron decal 20 x 9 m (s -9.5..10.5, r +-4.5, y 0.012, 128 px/m, edge fades
//               over 1.2 m) of frosted grass, trodden earth under the track (r +-0.9), frost feathers and grass ticks, and the skid marks.
//               PARAMS: creep 0..0.10 (spec.creep 0, METRES): how far the sledge has moved on; the footprint band slides back by it (at 0.05 a 5 cm
//               bare band shows behind each runner tail). skid 0..1 (spec.skid 0) at spec.skidAt [6.35, -1.04] (s, r): two scraped lines 0.12 apart
//               growing to 0.55 m toward -s with torn turf and a ridge of frost crumbs at the trailing end. spec.seed 1. Not solid.
//   haulrope    origin G, ONE PROP PER ROPE. 0.08 thick three-strand rope (helical ridges, pitch 0.24, stray fibres, whipped end with a frayed tuft),
//               smooth swept tube, 9 round (3 per strand) x 96 along the taut run + the tail. spec.from A, spec.grip H, spec.end E (each [s, y, r]),
//               spec.side +1 | -1 (outward; the coil lies on that side). Defaults = rope A (side +1): A [2.50, 0.77, 0.88], H [6.50, 0.56, 1.58],
//               E [7.45, 0.04, 2.13]; rope B (side -1): A [2.50, 0.77, -0.88], H [6.50, 0.38, -1.46], E [7.45, 0.04, -2.01].
//               TAUT LINE (gloves by world points on it): P(q) = A + q (H - A), q 0..1; rope A = (2.50 + 4.00 q, 0.77 - 0.21 q, 0.88 + 0.70 q),
//               rope B = (2.50 + 4.00 q, 0.77 - 0.39 q, -0.88 - 0.58 q) (exported as ropeTaut(spec, q)); 0.01 of q is 4.1 cm.
//               TAIL (the same at every slack): H -> ground at (H.s + 0.25, 0.04, H.r + side 0.30) -> 1.25 turns of a loop r 0.26 round
//               (H.s + 0.45, H.r + side 0.72), the upper strand 0.08 up where it crosses -> E.
//               PARAM slack 0..1 (spec.slack 0). Free span q 0..0.80, grip stretch q 0.80..1. 0..0.5: the free span sags (to the frost, 1.1 m at
//               0.5) and snakes where it lies; the grip stretch stays on the taut line (gloves valid; hands let go before 0.5). 0.5..1: the grip
//               stretch (and the end of the free span) sinks to y 0.04 and snakes; at 1 the whole rope lies on the frost, tied at A. spec.seed.
//   haullever   origin Q = the pole's centre line over the boulder, local +x toward the tip. Peeled pole 4.40 long: far end local x -3.60 (d 0.09),
//               tip end +0.80, d 0.12 at Q, last 0.30 a flat chisel 0.05 thick; 9 knots, 6 cracks, 4 bark strips, 0.03 bow. Place at set
//               (-2.64, 0.986, 0), rot 180. PARAM pump 0..1 (spec.pump 0) turns it about Q in the s-y plane: far end angle th = 20.9 - 12.9 pump
//               degrees above level. A point d m from Q toward the far end = set (-2.64 - d cos th, 0.986 + d sin th, 0) (exported leverAt(d, pump)).
//               The stone's edge rests 0.55 from Q on the tip side. pump 0: far end y 2.27; pump 1: 1.49. spec.seed 1. Not solid.
//   pivotstone  origin bottom centre: a lumpy round boulder 1.05 (s) x 0.93 high x 1.00 (r), sunk 0.05, its top exactly at local (0, 0.93, 0) with a
//               worn saddle 0.12 wide for the pole; flat-shaded facets, ~260 flecks, frost on its upper -r (shade) side, 24 grass tufts at the foot.
//               Set (-2.64, 0, 0). spec.seed 1. SOLID.
//   haulcrew    origin = the middle of the sledge's front bar on the ground (place it at set s 2.5, rot 180: local +x = forward, local x = set s - 2.5, local z = r).
//               A crowd of far Stone Age potatoes hauling OUR sledge on two ropes. The figures are the far figures of haulteam (props-sh-far.js: golden
//               egg 0.85 tall, two-brown fur cape with a cord, fur boots, dot eyes, stick arms, round hands) at a lighter tessellation, one instanced
//               mesh per unit (body, cape, cord+face, boots x2, arms x2, hands x2, ground blob), facing +x, leaning into the ropes.
//               spec.n 40 (1..260): figures, alternating the -z file (even index) and the +z file (odd), so row = floor(i / 2).
//               spec.fileZ 1.25: the ropes' z (+-); the figures stand 0.32 outside it (z +-1.57). spec.rowGap 1.05 (m along x). spec.start 3.2 (x of row 0).
//               250 figures = 125 rows, x 3.2..133.4. The two ropes (0.07 thick, twisted, brown #a8875a, 6 sides, sampled every 0.1 m) run from
//               (0, 0.77, +-0.88) (the sledge's rope collars) to each file's first hand (x start + 0.62, y 0.5, z +-fileZ), then straight at y 0.5 along the file;
//               1.0 m past the last SHOWN figure's x (the hands reach 0.62..0.73 ahead of a figure) the end sinks and lies on the ground (y 0.035).
//               Every hand sits on its rope. Variety per figure from a hash of its index: height 0.85 +-6 %, cape colour (haulteam's two browns),
//               lean 18-26 deg, step phase, body tone.
//               PARAMS (each also reads spec.<name> as its start value; tween as any number):
//                 heave 0..1 (1): 0 standing upright (hands still on the ropes), 1 full lean into the rope; scales lean and the lean pulse.
//                 walk  0..1 (0): 0 feet planted, straining (the lean pulses, no steps, no bob); 1 stepping forward at 1.15 steps a second with bob, sway, roll.
//                 grow  0..1 (1): figures shown = round(n * grow), the first (nearest the sledge) rows first, so 40 -> 250 lengthens the line; the ropes follow.
//                                 grow 0 hides the whole prop. The clip clock (t) drives step phase and pulse: the same time gives the same pose.
//               Not solid; every mesh lookOnly + surfaceOnly + steam (out of the body checks, ground blobs and light box), no shadow-map shadows.
//               Triangles at n 260, grow 1: see userData.triangles (unique geometry: 7 unit meshes + 2 rope meshes) and userData.trianglesDrawn (instances x geometry).
// Prop sizes the director's staging uses: see DESIGN section 2 (stone) and 5 (hands). Triangles (bench): see the delivery report.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const num = (v, d) => (typeof v === "number" ? v : d);
const sgp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
const col = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const mulc = (a, k) => a.map((v) => v * k);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const PAL = {
  oak: col("#8a6238"), oakShade: col("#5e4126"), oakLight: col("#b08a58"), grain: col("#c9a877"), ring: col("#7a5a36"),
  rail: col("#a57a4a"), bark: col("#5d4630"), cut: col("#caa878"),
  pole: col("#dcc79a"), knot: col("#8a6238"),
  rope: col("#a8875a"), ropeShade: col("#7a5f3c"), ropeLight: col("#cdb07e"), cord: col("#c9b48a"),
  boulder: col("#8f9499"), bShade: col("#5f6670"), fleck: col("#b9bec2"),
  frost: col("#e4ecea"), frostShade: col("#9fb5cf"), grass: col("#7a8852"), earth: col("#6a5a44"),
  bare: col("#6f4e2c"), turf: col("#55683a"), crumb: col("#f2f6f4"),
};

// ------------------------------------------------------------------------------------------------ a triangle soup with a colour per vertex
class Soup {
  constructor() { this.P = []; this.N = []; this.C = []; }
  get n() { return this.P.length / 9; }
  // flat triangle; ref = a point inside the body (the winding and the normal face away from it), null = as given
  tri(a, b, c, k, ref) {
    let n = cross(sub(b, a), sub(c, a)); const l = len(n); if (l < 1e-14) return; n = [n[0] / l, n[1] / l, n[2] / l];
    if (ref) { const m = [(a[0] + b[0] + c[0]) / 3 - ref[0], (a[1] + b[1] + c[1]) / 3 - ref[1], (a[2] + b[2] + c[2]) / 3 - ref[2]]; if (dot(n, m) < 0) { const t = b; b = c; c = t; n = [-n[0], -n[1], -n[2]]; } }
    this.P.push(...a, ...b, ...c); this.N.push(...n, ...n, ...n); this.C.push(...k, ...k, ...k);
  }
  quad(a, b, c, d, k, ref) { this.tri(a, b, c, k, ref); this.tri(a, c, d, k, ref); }
  // smooth triangle: the winding is made to agree with the vertex normals (front faces outward)
  triN(a, b, c, na, nb, nc, ka, kb = ka, kc = ka) {
    const f = cross(sub(b, a), sub(c, a));
    if (dot(f, add(add(na, nb), nc)) < 0) { [b, c] = [c, b]; [nb, nc] = [nc, nb]; [kb, kc] = [kc, kb]; }
    this.P.push(...a, ...b, ...c); this.N.push(...na, ...nb, ...nc); this.C.push(...ka, ...kb, ...kc);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.P), 3)); g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.N), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(this.C), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(10, 1, 0), 400);
    return g;
  }
}
const std = (o = {}) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, ...o }); m.userData.noOutline = true; return m; };
const mesh = (parent, S, material, { cast = true, recv = true, solid = false } = {}) => {
  const m = new THREE.Mesh(S.geo ? S.geo() : S, material); m.castShadow = cast; m.receiveShadow = recv; m.frustumCulled = false;
  m.userData.lookOnly = !solid; m.userData.solid = solid; m.userData.surfaceOnly = true; parent.add(m); return m;
};

// ---- sweeps ----
// frames along a polyline: with `hint` fixed (b = t x hint, n = b x t: planar loops, straight runs) else parallel transport
function frames(pts, hint, closed) {
  const n = pts.length, T = [];
  for (let i = 0; i < n; i++) { const a = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], b = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)]; T.push(norm(sub(b, a))); }
  const F = [];
  if (hint) { for (let i = 0; i < n; i++) { let b = cross(T[i], hint); if (len(b) < 1e-6) b = [0, 0, 1]; b = norm(b); F.push({ n: cross(b, T[i]), b, t: T[i] }); } return F; }
  const ref = Math.abs(T[0][1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
  let b = norm(cross(T[0], ref)), nn = cross(b, T[0]); F.push({ n: nn, b, t: T[0] });
  for (let i = 1; i < n; i++) { nn = norm(sub(nn, mul(T[i], dot(nn, T[i])))); b = cross(T[i], nn); F.push({ n: nn, b, t: T[i] }); }
  return F;
}
// a tube / beam: K points round, sec(i, k) -> [u, v] offsets along the frame's n and b; colf(i, k) the colour of the quad (i..i+1, k..k+1)
function sweep(S, pts, K, sec, colf, o = {}) {
  const n = pts.length, F = o.frames ?? frames(pts, o.hint, o.closed), V = [];
  for (let i = 0; i < n; i++) { const row = []; for (let k = 0; k < K; k++) { const [u, v] = sec(i, k); row.push(add(pts[i], add(mul(F[i].n, u), mul(F[i].b, v)))); } V.push(row); }
  const last = o.closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const j = (i + 1) % n;
    for (let k = 0; k < K; k++) {
      const k2 = (k + 1) % K, a = V[i][k], b = V[j][k], c = V[j][k2], d = V[i][k2], cc = o.colv ? null : colf(i, k);
      if (o.colv) {
        const na = norm(sub(a, pts[i])), nb = norm(sub(b, pts[j])), nc = norm(sub(c, pts[j])), nd = norm(sub(d, pts[i])), ca = o.colv(i, k), cb = o.colv(j, k), cd = o.colv(j, k2), ce = o.colv(i, k2);
        S.triN(a, b, c, na, nb, nc, ca, cb, cd); S.triN(a, c, d, na, nc, nd, ca, cd, ce);
      } else if (o.smooth) {
        const na = norm(sub(a, pts[i])), nb = norm(sub(b, pts[j])), nc = norm(sub(c, pts[j])), nd = norm(sub(d, pts[i]));
        S.triN(a, b, c, na, nb, nc, cc); S.triN(a, c, d, na, nc, nd, cc);
      } else S.quad(a, b, c, d, cc, mix3(pts[i], pts[j], 0.5));
    }
  }
  return { V, F };
}
// concentric end-grain rings on a cap (ring = points round, outDir = the way out)
function endGrain(S, ring, c, out, seed) {
  const fs = [1, 0.82, 0.64, 0.47, 0.31, 0.17, 0], at = (f) => ring.map((p) => add(add(c, mul(sub(p, c), f)), mul(out, 0.002 + 0.0004 * (1 - f)))), ref = sub(c, mul(out, 0.3));
  let prev = at(fs[0]);
  for (let j = 1; j < fs.length; j++) {
    const cur = at(fs[j]), k = mixc(j % 2 ? PAL.grain : PAL.ring, PAL.grain, j % 2 ? 0 : 0.35 + 0.2 * hs(j, seed));
    for (let q = 0; q < ring.length; q++) { const q2 = (q + 1) % ring.length; S.quad(prev[q], prev[q2], cur[q2], cur[q], mulc(k, 0.94 + 0.1 * hs(q + j * 31, seed)), ref); }
    prev = cur;
  }
}
// a thin double-sided blade (fibre, grass, flake): base point, direction, length, width
function blade(S, p, dir, l, w, k, up = [0, 1, 0]) {
  let s = cross(dir, up); if (len(s) < 1e-4) s = cross(dir, [1, 0, 0]); s = mul(norm(s), w / 2);
  S.tri(sub(p, s), add(p, s), add(p, mul(dir, l)), k, null);
}
// a ribbon along a polyline lying on a surface: nrm(i) the surface normal there, w the width
function ribbon(S, pts, nrm, w, k) {
  const sd = pts.map((p, i) => { const t = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])); return mul(norm(cross(nrm(i), t)), w / 2); });
  for (let i = 0; i < pts.length - 1; i++) S.quad(sub(pts[i], sd[i]), add(pts[i], sd[i]), add(pts[i + 1], sd[i + 1]), sub(pts[i + 1], sd[i + 1]), k, null);
}
// a small flat disc (a knot) on a surface: centre, normal, radius
function disc(S, c, nrm, r, kOut, kIn, seed) {
  let a = cross(nrm, [0, 1, 0]); if (len(a) < 1e-4) a = cross(nrm, [1, 0, 0]); a = norm(a); const b = norm(cross(nrm, a)), N = 8;
  const ring = (f) => { const o = []; for (let q = 0; q < N; q++) { const t = (q / N) * TAU, rr = r * f * (0.85 + 0.3 * hs(q, seed)); o.push(add(c, add(mul(a, rr * Math.cos(t)), mul(b, rr * Math.sin(t))))); } return o; };
  const o1 = ring(1), o2 = ring(0.55), cc = add(c, mul(nrm, 0.002));
  for (let q = 0; q < N; q++) { const q2 = (q + 1) % N; S.quad(o1[q], o1[q2], o2[q2], o2[q], kOut, null); S.tri(o2[q], o2[q2], cc, kIn, null); }
}
// a small ellipsoid blob (axis aligned, yaw about y)
function blob(S, c, [rx, ry, rz], k, { nu = 8, nv = 5, yaw = 0, jit = 0, seed = 0 } = {}) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), P = (j, i) => {
    const th = (Math.PI * j) / nv, ph = (TAU * i) / nu, e = 1 + jit * (hs(j * 17 + i % nu, seed) - 0.5), x = rx * Math.sin(th) * Math.cos(ph) * e, z = rz * Math.sin(th) * Math.sin(ph) * e;
    return [c[0] + x * cy + z * sy, c[1] + ry * Math.cos(th) * e, c[2] - x * sy + z * cy];
  };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) S.quad(P(j, i), P(j + 1, i), P(j + 1, i + 1), P(j, i + 1), mulc(k, 0.92 + 0.16 * hs(j * 9 + i, seed + 1)), c);
}
// uniform Catmull-Rom through control points, `per` samples per span
function spline(ctrl, per) {
  const out = [], n = ctrl.length, g = (i) => ctrl[clamp(i, 0, n - 1)];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < per; j++) {
    const t = j / per, t2 = t * t, t3 = t2 * t, p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    out.push([0, 1, 2].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)));
  }
  out.push(ctrl[n - 1]); return out;
}
// a rounded-rectangle loop of [u, v] points: centre, half sizes, corner radius, arc steps
function rrLoop(cu, cv, hu, hv, rad, nArc = 4) {
  const o = [], C = [[hu - rad, hv - rad, 0], [-hu + rad, hv - rad, 90], [-hu + rad, -hv + rad, 180], [hu - rad, -hv + rad, 270]];
  for (const [x, y, a0] of C) for (let j = 0; j <= nArc; j++) { const a = (a0 + (90 * j) / nArc) * DEG; o.push([cu + x + rad * Math.cos(a), cv + y + rad * Math.sin(a)]); }
  return o;
}
// a twisted rope / cord tube. R: radius or fn(i). o.sides 6, o.closed, o.hint, o.ridge (helical ridge amplitude, 0), o.pitch 0.24, o.seed, o.smooth
function ropeTube(S, pts, R, o = {}) {
  const sides = o.sides ?? 6, n = pts.length, ridge = o.ridge ?? 0, tw = (3 * TAU) / (o.pitch ?? 0.24), seed = o.seed ?? 1, arc = [0];
  for (let i = 1; i < n; i++) arc.push(arc[i - 1] + len(sub(pts[i], pts[i - 1])));
  const rad = (i) => (typeof R === "function" ? R(i) : R);
  const sec = (i, k) => { const a = (k / sides) * TAU, rr = rad(i) * (1 + ridge * Math.cos(3 * a - tw * arc[i])); return [rr * Math.cos(a), rr * Math.sin(a)]; };
  const base = o.base ?? PAL.rope, shade = o.shade ?? PAL.ropeShade, light = o.light ?? PAL.ropeLight;
  const colv = (i, k) => {
    const a = (k / sides) * TAU, f = 0.5 + 0.5 * Math.cos(3 * a - tw * arc[i]);
    let c = mixc(shade, base, 0.25 + 0.75 * f); if (f > 0.85) c = mixc(c, light, 0.55 * (f - 0.85) / 0.15);
    return mulc(c, 0.94 + 0.12 * hs(Math.floor(arc[i] / 0.3) + k * 0.1, seed));
  };
  return { ...sweep(S, pts, sides, sec, null, { closed: o.closed, hint: o.hint, smooth: true, colv }), arc };
}
// a bundle of frayed fibres from a point, along a direction
function fray(T, p, dir, l, n, k, seed, droop = 0) {
  for (let j = 0; j < n; j++) {
    const a = (hs(j, seed) - 0.5) * 0.9, b = (hs(j, seed + 1) - 0.5) * 0.9, d = norm(add(dir, add(mul(cross(dir, [0, 1, 0]), a * 0.5), [0, b * 0.4 - droop, 0])));
    blade(T, p, d, l * (0.6 + 0.4 * hs(j, seed + 2)), 0.012, mixc(k, PAL.ropeLight, hs(j, seed + 3) * 0.5));
  }
}
const finish = (P, group, parts) => { P.whole.userData.triangles = parts.reduce((s, S) => s + S.n, 0); P.whole.add(group); return group; };

// ================================================================================================================ haulsledge
function runner(B, T, r0, seed) {
  const st = [], K = 24;
  const push = (x, y, a, hh, sc = 1) => st.push({ p: [x, y, r0], n: [-Math.sin(a), Math.cos(a), 0], t: [Math.cos(a), Math.sin(a), 0], hh, sc });
  push(-1.95, 0.5, 0, 0.18, 0.72); push(-1.92, 0.5, 0, 0.18, 0.94);
  for (let i = 0; i <= 34; i++) push(-1.9 + (4.4 * i) / 34, 0.5, 0, 0.18);
  for (let j = 1; j <= 8; j++) { const a = (60 * DEG * j) / 8; push(2.5 + 0.8 * Math.sin(a), 0.5 + 0.8 * (1 - Math.cos(a)), a, lerp(0.18, 0.13, j / 8)); }
  { const L = st.at(-1), a = 60 * DEG; push(L.p[0] + L.t[0] * 0.02, L.p[1] + L.t[1] * 0.02, a, 0.13, 0.92); push(L.p[0] + L.t[0] * 0.045, L.p[1] + L.t[1] * 0.045, a, 0.13, 0.52); }
  const nS = st.length, last = nS - 1, pts = st.map((s) => s.p), F = st.map((s) => ({ n: s.n, b: [0, 0, 1], t: s.t }));
  const sec = (i, k) => {
    const a = (k / K) * TAU, s = st[i], end = i < 1 || i >= nS - 2, j = end ? 0 : 0.009 * (hs(i * 29 + k * 7, seed) - 0.5);
    return [s.hh * s.sc * sgp(Math.sin(a), 1 / 3) + j, 0.12 * s.sc * sgp(Math.cos(a), 1 / 3) + j];
  };
  const colf = (i, k) => {   // long staggered facets (an adze takes 0.25-0.5 m at a stroke), not a chessboard
    const a = ((k + 0.5) / K) * TAU, sy = Math.sin(a), L = 2 + Math.floor(hs(k, seed + 60) * 4), off = Math.floor(hs(k, seed + 61) * 7), fi = Math.floor((i + off) / L), h = hs(fi * 31 + k, seed + 2), t = (h - 0.5) * 2;
    let c = t > 0 ? mixc(PAL.oak, PAL.oakLight, 0.3 * t * (h > 0.93 ? 1.8 : 1)) : mixc(PAL.oak, PAL.oakShade, -0.3 * t);
    if (sy < -0.55) c = mixc(c, PAL.grain, 0.28 + 0.3 * hs(i * 7 + k, seed + 5)); else if (sy < -0.05) c = mulc(c, 0.84);
    return c;
  };
  const { V } = sweep(B, pts, K, sec, colf, { frames: F });
  const rad = (i, k) => norm(sub(V[i][k], pts[i]));
  // end grain: the tail and the nose
  endGrain(B, V[0], pts[0], mul(F[0].t, -1), seed); endGrain(B, V[last], pts[last], F[last].t, seed + 1);
  // 9 drying cracks, 12 knots
  for (let c = 0; c < 9; c++) {
    const i0 = 2 + Math.floor(hs(c, seed + 10) * (nS - 12)), n = 3 + Math.floor(hs(c, seed + 11) * 3), k = Math.floor(hs(c, seed + 12) * K), line = [];
    for (let i = i0; i < Math.min(i0 + n, nS - 3); i++) { const kk = (k + Math.round((hs(i, seed + c) - 0.5) * 1.4) + K) % K; line.push(add(V[i][kk], mul(rad(i, kk), 0.003))); }
    if (line.length > 1) ribbon(T, line, (i) => rad(i0 + i, k), 0.007 + 0.004 * hs(c, seed + 13), PAL.oakShade);
  }
  for (let c = 0; c < 26; c++) {   // grain lines along the trunk
    const i0 = 2 + Math.floor(hs(c, seed + 70) * (nS - 12)), n = 4 + Math.floor(hs(c, seed + 71) * 7), k = Math.floor(hs(c, seed + 72) * K), line = [];
    for (let i = i0; i < Math.min(i0 + n, nS - 3); i++) line.push(add(V[i][k], mul(rad(i, k), 0.0025)));
    if (line.length > 1) ribbon(T, line, (i) => rad(i0 + i, k), 0.005, mixc(PAL.oak, PAL.oakShade, 0.5));
  }
  for (let c = 0; c < 12; c++) {
    const i = 3 + Math.floor(hs(c, seed + 20) * (nS - 8)), k = Math.floor(hs(c, seed + 21) * K), r = rad(i, k);
    disc(T, add(add(V[i][k], V[i + 1][k]), [0, 0, 0]).map((v) => v / 2).map((v, a) => v + r[a] * 0.003), r, 0.026 + 0.02 * hs(c, seed + 22), PAL.oakShade, mixc(PAL.oak, PAL.oakShade, 0.5), seed + c);
  }
  return st;
}
const loopAt = (cx, cy, z, hu, hv, rad, plane = "xy") => rrLoop(0, 0, hu, hv, rad).map(([u, v]) => [cx + u, cy + v, z]);
function buildSledge(P) {
  const S = P.spec, seed = S.seed ?? 1, B = new Soup(), T = new Soup(), g = new THREE.Group();
  g.position.y = num(S.ride, 0.32) - 0.32;
  runner(B, T, 0.52, seed * 10 + 1); runner(B, T, -0.52, seed * 10 + 2);
  const cordCol = mixc(PAL.cord, PAL.ropeShade, 0.15);
  // 4 deck beams
  [-1.7, -0.57, 0.57, 1.7].forEach((s, bi) => {
    const sd = seed * 100 + bi * 13, n = 13, pts = [], K = 16;
    for (let i = 0; i < n; i++) pts.push([s, 0.76, -0.95 + (1.9 * i) / (n - 1)]);
    const sc = (i) => (i === 0 || i === n - 1 ? 0.9 : 1);
    const sec = (i, k) => { const a = (k / K) * TAU, j = (hs(i * 23 + k, sd) - 0.5) * 0.006 - 0.003; return [0.08 * sc(i) * sgp(Math.sin(a), 2 / 7) + (Math.sin(a) > 0.5 ? j : j * 0.5), 0.11 * sc(i) * sgp(Math.cos(a), 2 / 7) + j * 0.5]; };
    const colf = (i, k) => {
      const a = ((k + 0.5) / K) * TAU, sy = Math.sin(a), z = pts[i][2], h = hs(Math.floor((i + Math.floor(hs(k, sd + 3) * 3)) / 2) * 17 + k, sd + 1);
      let c = mixc(PAL.oak, h < 0.5 ? PAL.oakLight : PAL.oakShade, 0.26 * Math.abs(h - 0.5) * 2);
      if (sy > 0.6 && Math.abs(z) < 1.08 && hs(i * 5 + k, sd + 2) > 0.4) c = mixc(c, PAL.oakLight, 0.55 + 0.3 * hs(i, k + sd));   // pale rub marks where the stone lay
      if (sy < -0.4) c = mulc(c, 0.8);
      return c;
    };
    const { V } = sweep(B, pts, K, sec, colf, { hint: [0, 1, 0] });
    endGrain(B, V[0], pts[0], [0, 0, -1], sd); endGrain(B, V[n - 1], pts[n - 1], [0, 0, 1], sd + 1);
    for (const sg of [1, -1]) {   // bindings to the runners: 5 turns of 0.035 cord and a cross
      for (let j = 0; j < 5; j++) ropeTube(B, loopAt(s, 0.76, sg * 0.52 + (j - 2) * 0.045 + 0.003 * hs(j, sd), 0.126, 0.092, 0.035), 0.0175 - 0.0015 * hs(j + sg, sd), { closed: true, hint: [0, 0, 1], sides: 5, base: cordCol, shade: PAL.ropeShade, seed: sd + j });
      for (const d of [1, -1]) ropeTube(B, [0, 1, 2, 3, 4, 5].map((q) => [s + d * (-0.1 + 0.04 * q), 0.846, sg * 0.52 - (q - 2.5) * 0.034]), 0.0135, { sides: 5, base: cordCol, shade: PAL.ropeShade, seed: sd + 9 });
    }
  });
  // the front bar and its two collars
  { const n = 12, K = 14, sd = seed * 100 + 77, pts = []; for (let i = 0; i < n; i++) pts.push([2.4 + 0.012 * Math.sin(i * 1.7 + seed), 0.77, -1.1 + (2.2 * i) / (n - 1)]);
    const sc = (i) => (i === 0 || i === n - 1 ? 0.9 : 1);
    const sec = (i, k) => { const a = (k / K) * TAU, r = 0.09 * sc(i) * (1 + 0.04 * (hs(i * 7 + k, sd) - 0.5)); return [r * Math.sin(a), r * Math.cos(a)]; };
    const { V } = sweep(B, pts, K, sec, (i, k) => mixc(PAL.oak, hs(i * 11 + k, sd + 1) < 0.5 ? PAL.oakLight : PAL.oakShade, 0.22 * hs(i * 3 + k, sd + 2)), { hint: [0, 1, 0] });
    endGrain(B, V[0], pts[0], [0, 0, -1], sd); endGrain(B, V[n - 1], pts[n - 1], [0, 0, 1], sd + 1);
    for (const sg of [1, -1]) {
      for (let j = 0; j < 5; j++) ropeTube(B, rrLoop(0, 0, 0.1, 0.1, 0.1, 5).map(([u, v]) => [2.4 + u, 0.77 + v, sg * 0.52 + (j - 2) * 0.045]), 0.0175, { closed: true, hint: [0, 0, 1], sides: 5, base: cordCol, shade: PAL.ropeShade, seed: sd + j });
      for (let j = 0; j < 4; j++) ropeTube(B, rrLoop(0, 0, 0.12, 0.12, 0.12, 5).map(([u, v]) => [2.4 + u, 0.77 + v, sg * 0.88 + (j - 1.5) * 0.082]), 0.04, { closed: true, hint: [0, 0, 1], sides: 6, ridge: 0.1, seed: sd + 20 + j });
      blob(B, [2.5, 0.77, sg * 0.88], [0.075, 0.062, 0.13], PAL.rope, { seed: sd + 30 + sg, jit: 0.2 });
    }
  }
  mesh(g, B, std(), { solid: true }); mesh(g, T, std({ side: THREE.DoubleSide }), { cast: false, solid: false });
  return finish(P, g, [B, T]);
}

// ================================================================================================================ haullash
function buildLash(P) {
  const S = P.spec, [L, W, H] = S.size ?? [4.25, 2.1, 1.1], seed = S.seed ?? 1, B = new Soup(), T = new Soup(), g = new THREE.Group();
  const hw = (x) => (W / 2) * (1 - 0.03 * Math.sin(Math.PI * (x / L + 0.5))) + 0.03;
  [-1.135, 0, 1.135].forEach((x0, gi) => {
    for (const dx of [-0.0375, 0.0375]) {
      const x = x0 + dx, pts = rrLoop(0, H / 2, hw(x), H / 2 + 0.03, 0.08, 5).map(([z, y]) => [x, y, z]);
      ropeTube(B, pts, 0.035, { closed: true, hint: [1, 0, 0], sides: 6, ridge: 0.08, seed: seed * 10 + gi * 2 + (dx > 0 ? 1 : 0), pitch: 0.2 });
    }
    // the reef knot on top at z +0.35 and its four short tails
    const y = H + 0.045;
    blob(B, [x0 - 0.035, y, 0.35 - 0.04], [0.05, 0.04, 0.07], PAL.rope, { yaw: 0.3, seed: gi * 7 + 1, jit: 0.2 }); blob(B, [x0 + 0.035, y, 0.35 + 0.04], [0.05, 0.04, 0.07], PAL.rope, { yaw: -0.3, seed: gi * 7 + 2, jit: 0.2 });
    for (let q = 0; q < 4; q++) { const sgx = q < 2 ? -1 : 1, sgz = q % 2 ? 1 : -1; fray(T, [x0 + sgx * 0.04, H + 0.03, 0.35 + sgz * 0.08], norm([sgx * 0.5, 0, sgz * 1]), 0.1, 4, PAL.rope, seed * 31 + gi * 5 + q); }
  });
  // the ridge rope along the top centre, x -1.135 .. +1.135 and two tails 0.35 long to +-1.485
  { const pts = []; for (let i = 0; i <= 30; i++) { const x = -1.485 + (2.97 * i) / 30; pts.push([x, H + 0.031, 0.012 * Math.sin(x * 3 + seed) + (Math.abs(x) > 1.135 ? Math.sign(x) * 0.02 * (Math.abs(x) - 1.135) : 0)]); }
    ropeTube(B, pts, 0.03, { sides: 6, ridge: 0.08, seed: seed * 10 + 7, pitch: 0.2 });
    for (const sg of [-1, 1]) fray(T, pts[sg > 0 ? 30 : 0], [sg, 0, 0], 0.1, 8, PAL.rope, seed * 17 + (sg > 0 ? 1 : 0), 0.0);
    for (const x0 of [-1.135, 0, 1.135]) blob(B, [x0, H + 0.04, 0], [0.06, 0.045, 0.05], PAL.rope, { seed: x0 * 3 + 5, jit: 0.2 });
  }
  mesh(g, B, std(), {}); mesh(g, T, std({ side: THREE.DoubleSide }), { cast: false });
  return finish(P, g, [B, T]);
}

// ================================================================================================================ haulrails
const RAIL_Y0 = 0.17, SLEEP_S = (i) => -1.8 + 0.6 * i, NSLEEP = 58;
const wander = (s, rail, seed) => {   // [sideways, up] of a rail's centre line: +-0.02 / +-0.01, zero under the sledge
  const f = sm((Math.abs(s - 0.3) - 2.6) / 1.0), a = seed * 3 + rail * 17;
  return [f * (0.012 * Math.sin(s * 0.9 + a) + 0.008 * Math.sin(s * 2.3 + a * 1.7)), f * (0.006 * Math.sin(s * 1.3 + a * 0.6) + 0.004 * Math.sin(s * 3.1 + a))];
};
const SECT = [[-0.09, -0.075], [0.09, -0.075], [0.10, -0.035], [0.10, 0.025], [0.09, 0.065], [0.075, 0.075], [-0.075, 0.075], [-0.09, 0.065], [-0.10, 0.025], [-0.10, -0.035]];   // [lateral, up] about the centre
const TRUNKS = [[5.9, 6.1, 5.7, 6.4, 5.6, 5.5], [6.2, 5.6, 6.3, 5.7, 5.9, 5.5]];
function railTrunks(rail) {   // [[s0, s1]...] with joints snapped onto the sleepers
  let s = -2.2; const out = [], cut = [];
  for (let i = 0; i < 5; i++) { s += TRUNKS[rail][i]; const k = Math.round((s + 1.8) / 0.6); cut.push(SLEEP_S(k)); }
  const ends = [-2.2, ...cut, 33.0]; for (let i = 0; i < 6; i++) out.push([ends[i] + (i ? 0.006 : 0), ends[i + 1] - (i < 5 ? 0.006 : 0)]); return out;
}
const sleeperOf = (i, seed) => ({ s: SLEEP_S(i), d: 0.24 * (1 + 0.2 * (hs(i, seed + 40) - 0.5)), l: 1.5 * (1 + 0.12 * (hs(i, seed + 41) - 0.5)), yaw: (hs(i, seed + 42) - 0.5) * 6 * DEG, dr: 0.02 * (hs(i, seed + 43) - 0.5) });
function sleeperGeo(sd) {
  const S = new Soup(), K = 10, n = 6, zs = [-0.5, -0.49, -0.35, 0.35, 0.49, 0.5], scs = [0.7, 0.93, 1, 1, 0.93, 0.7], pts = zs.map((z) => [0, 0, z]);
  const { V } = sweep(S, pts, K, (i, k) => { const a = (k / K) * TAU, r = 0.5 * scs[i] * (1 + 0.1 * (hs(i * 7 + k, sd) - 0.5)); return [r * Math.sin(a), r * Math.cos(a)]; },
    (i, k) => { const h = hs(i * 13 + k, sd + 1); return i === 0 || i === n - 2 ? mixc(PAL.bark, PAL.cut, 0.3) : mixc(PAL.bark, h < 0.5 ? PAL.oakShade : PAL.rail, 0.35 * Math.abs(h - 0.5) * 2); }, { hint: [0, 1, 0] });
  for (const e of [0, n - 1]) { const o = e ? 1 : -1, ring = V[e], c = pts[e]; for (let q = 0; q < K; q++) { const q2 = (q + 1) % K; S.tri(add(c, [0, 0, o * 0.002]), add(ring[q], [0, 0, o * 0.002]), add(ring[q2], [0, 0, o * 0.002]), mixc(PAL.cut, PAL.grain, hs(q, sd + 5) * 0.6), mul(c, 1).map((v, a) => v - (a === 2 ? o * 0.3 : 0))); } }
  return S.geo();
}
function apronTex(seed) {
  const W = 2560, H = 1152, PPM = 128, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const X = (s) => (s + 9.5) * PPM, Y = (r) => (4.5 - r) * PPM, hsv = (i, k) => hs(i, k + seed * 7);
  g.fillStyle = "#8c9c64"; g.fillRect(0, 0, W, H);
  const blot = ["#9fb074", "#7f9058", "#a6b67c", "#88995f", "#96a76b"];
  for (let i = 0; i < 900; i++) { g.globalAlpha = 0.16 + 0.14 * hsv(i, 3); g.fillStyle = blot[i % 5]; g.beginPath(); g.ellipse(hsv(i, 1) * W, hsv(i, 2) * H, 14 + 60 * hsv(i, 4), 8 + 30 * hsv(i, 5), (hsv(i, 6) - 0.5) * 0.8, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // the trodden earth under the track (r +-0.9, ragged), with speckle
  for (let x0 = 0; x0 < W; x0 += 16) {   // trodden earth in 16 px slices, fading out toward -s (behind the sledge)
    const sM = (x0 + 8) / PPM - 9.5, fade = clamp((sM + 8.5) / 6) * 0.82 + 0.1;
    g.globalAlpha = fade; g.fillStyle = "#6f5f48"; g.beginPath(); g.moveTo(x0, Y(0.9) + 7 * Math.sin(x0 * 0.05 + seed) + 9 * (hsv(x0, 7) - 0.5));
    g.lineTo(x0 + 17, Y(0.9) + 7 * Math.sin((x0 + 16) * 0.05 + seed) + 9 * (hsv(x0 + 16, 7) - 0.5)); g.lineTo(x0 + 17, Y(-0.9) + 7 * Math.sin((x0 + 16) * 0.043 + 2 + seed) + 9 * (hsv(x0 + 16, 8) - 0.5)); g.lineTo(x0, Y(-0.9) + 7 * Math.sin(x0 * 0.043 + 2 + seed) + 9 * (hsv(x0, 8) - 0.5)); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 700; i++) { g.globalAlpha = 0.25 + 0.3 * hsv(i, 11); g.fillStyle = i % 3 ? "#4e4130" : "#85705a"; const x = hsv(i, 9) * W, y = Y(-0.85 + 1.7 * hsv(i, 10)); g.beginPath(); g.ellipse(x, y, 2 + 6 * hsv(i, 12), 1 + 3 * hsv(i, 13), hsv(i, 14) * 3, 0, TAU); g.fill(); }
  // frost feathers (denser on the shade side, r < 0), crumbs on the earth, grass ticks
  const stroke = (x, y, a, l, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); };
  for (let i = 0; i < 2600; i++) {
    const x = hsv(i, 20) * W, v = hsv(i, 21), y = (1 - Math.pow(v, 1.0 + 0.35 * (hsv(i, 22) < 0.5 ? 1 : 0))) * H, shade = (H - y) / H > 0.5 ? 1 : 0.5, a = hsv(i, 23) * TAU, l = 6 + 12 * hsv(i, 24);
    g.globalAlpha = 0.55 + 0.4 * hsv(i, 25); g.strokeStyle = hsv(i, 26) < shade * 0.55 ? "#9fb5cf" : "#e4ecea";
    stroke(x, y, a, l, 1.6); stroke(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, a + 0.8, l * 0.4, 1.1); stroke(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, a - 0.8, l * 0.4, 1.1);
  }
  for (let i = 0; i < 900; i++) { const x = hsv(i, 30) * W, y = hsv(i, 31) * H; g.globalAlpha = 0.7; g.strokeStyle = i % 2 ? "#5d6f3f" : "#4f6035"; stroke(x, y, -Math.PI / 2 + (hsv(i, 32) - 0.5) * 0.8, 7 + 8 * hsv(i, 33), 1.5); }
  for (let i = 0; i < 400; i++) { const x = hsv(i, 40) * W, y = Y(-0.9 + 1.8 * hsv(i, 41)); g.globalAlpha = 0.8; g.fillStyle = "#f2f6f4"; g.beginPath(); g.ellipse(x, y, 1.5 + 2.5 * hsv(i, 42), 1 + 1.5 * hsv(i, 43), hsv(i, 44) * 3, 0, TAU); g.fill(); }
  g.globalAlpha = 1; g.globalCompositeOperation = "destination-in";
  const FADE = 1.2 * PPM;
  for (const [x0, y0, x1, y1] of [[0, 0, FADE, 0], [W, 0, W - FADE, 0], [0, 0, 0, FADE], [0, H, 0, H - FADE]]) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildRails(P) {
  const S = P.spec, seed = S.seed ?? 1, B = new Soup(), T = new Soup(), FP = new Soup(), g = new THREE.Group(), cast = {};
  const railPt = (rail, s) => { const [wr, wy] = wander(s, rail, seed); return [s, RAIL_Y0 + 0.075 + wy, (rail ? -0.52 : 0.52) + wr]; };
  const sleepers = Array.from({ length: NSLEEP }, (_, i) => sleeperOf(i, seed));
  // rails: 6 trunks each
  for (let rail = 0; rail < 2; rail++) railTrunks(rail).forEach(([s0, s1], ti) => {
    const sd = seed * 100 + rail * 10 + ti, n = Math.max(3, Math.round((s1 - s0) / 0.3) + 1), pts = [];
    const jr = 0.008 * (hs(sd, 5) - 0.5), jy = 0.006 * (hs(sd, 6) - 0.5);
    for (let i = 0; i < n; i++) { const p = railPt(rail, s0 + ((s1 - s0) * i) / (n - 1)); p[2] += jr; p[1] += jy; pts.push(p); }
    const K = SECT.length;
    const sec = (i, k) => { const [v, u] = SECT[k], e = i === 0 || i === n - 1 ? 0.96 : 1; return [u * e, v * e]; };
    const colf = (i, k) => {
      const h = hs(i * 19 + k, sd), top = k === 5 || k === 6 || k === 4 || k === 7;
      if (!top && k !== 0 && k !== 1 && h > 0.92 && hs(i, sd + 3) > 0.3) return mixc(PAL.bark, PAL.rail, 0.2);   // a bark strip
      return mixc(PAL.rail, h < 0.5 ? PAL.oakLight : PAL.oakShade, (top ? 0.12 : 0.2) * Math.abs(h - 0.5) * 2);
    };
    const { V } = sweep(B, pts, K, sec, colf, { hint: [0, 1, 0] });
    for (const e of [0, n - 1]) { const o = e ? 1 : -1, ring = V[e], c = pts[e]; for (let q = 0; q < K; q++) { const q2 = (q + 1) % K; B.tri(add(c, [o * 0.002, 0, 0]), add(ring[q], [o * 0.002, 0, 0]), add(ring[q2], [o * 0.002, 0, 0]), mixc(PAL.cut, PAL.grain, hs(q, sd + 8) * 0.5), add(c, [-o * 0.3, 0, 0])); } }
  });
  // sleepers: 4 instanced variants
  const sm4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), po = new THREE.Vector3(), mat = std();
  for (let v = 0; v < 4; v++) {
    const idx = sleepers.map((_, i) => i).filter((i) => i % 4 === v), im = new THREE.InstancedMesh(sleeperGeo(seed * 9 + v), mat, idx.length);
    idx.forEach((si, j) => { const s = sleepers[si]; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw); sc.set(s.d, s.d, s.l); po.set(s.s, 0.19 - s.d / 2, s.dr); sm4.compose(po, q, sc); im.setMatrixAt(j, sm4); const k = 0.92 + 0.16 * hs(si, seed + 44); im.setColorAt(j, new THREE.Color(k, k, k)); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.userData.lookOnly = true; im.userData.solid = false; im.userData.surfaceOnly = true; g.add(im);
  }
  const sleeperTris = NSLEEP * (5 * 10 * 2 + 2 * 10);
  // rime: a coat on every rail top (thicker and bluer on the shade side) and on the sleeper tops, then drawn feathers
  const polyIdx = [8, 7, 6, 5, 4];   // the coat follows the section: -r shoulder, top, +r shoulder
  for (let rail = 0; rail < 2; rail++) {
    const NSEG = 352, s0 = -2.2, ds = 35.2 / NSEG;
    for (let i = 0; i < NSEG; i++) {
      const rows = (s) => {
        const c = railPt(rail, s), j = hs(Math.round(s * 10), seed + rail * 3), f1 = 0.55 + 0.45 * hs(Math.round(s * 10), seed + 70), f2 = 0.2 + 0.7 * hs(Math.round(s * 10), seed + 71);
        const pt = (k, o = 0.003) => add(c, [0, SECT[k][1] + o, SECT[k][0]]);
        const l2 = add(pt(8, 0.003), mul(sub(add(c, [0, SECT[9][1], SECT[9][0]]), pt(8, 0.003)), 0.3 + 0.7 * f1)), r1 = mix3(pt(5, 0.002), pt(4, 0.002), f2);
        void j; return [l2, pt(8, 0.004), pt(7, 0.004), pt(6, 0.003), pt(5, 0.003), r1];
      };
      const a = rows(s0 + i * ds), b = rows(s0 + (i + 1) * ds), ks = [PAL.frostShade, mixc(PAL.frostShade, PAL.frost, 0.5), PAL.frost, PAL.frost, mixc(PAL.frost, PAL.frostShade, 0.2)];
      const thin = hs(Math.floor(i / 2), seed + rail + 90) < 0.16 ? 0.3 : 0;   // a few patches where the rime is thin and the wood shows through
      for (let r = 0; r < 5; r++) T.quad(a[r], a[r + 1], b[r + 1], b[r], mixc(mulc(ks[r], 0.96 + 0.08 * hs(i * 5 + r, seed + rail)), PAL.rail, r === 2 || r === 3 ? thin : 0), null);
    }
  }
  const topY = (si) => 0.19 - sleepers[si].d / 2 + sleepers[si].d / 2;
  void topY;
  for (let i = 0; i < NSLEEP; i++) {
    const sl = sleepers[i], R = sl.d / 2, cy = 0.19 - R, cz = Math.cos(sl.yaw), sz = Math.sin(sl.yaw);
    const pt = (z, x) => [sl.s + x * cz + z * sz, cy + Math.sqrt(Math.max(0, R * R - x * x)) * 0.995 + 0.003, sl.dr + z * cz - x * sz];
    const spans = [[-sl.l / 2 + 0.03, -0.63], [-0.41, 0.41], [0.63, sl.l / 2 - 0.03]];
    for (const [za, zb] of spans) { const m = Math.max(2, Math.round((zb - za) / 0.1)); for (let j = 0; j < m; j++) {
      const z0 = lerp(za, zb, j / m), z1 = lerp(za, zb, (j + 1) / m), w0 = 0.05 + 0.03 * hs(i * 31 + j, seed + 50), w1 = 0.05 + 0.03 * hs(i * 31 + j + 1, seed + 50);
      T.quad(pt(z0, -w0), pt(z0, w0), pt(z1, w1), pt(z1, -w1), mixc(PAL.frost, PAL.frostShade, 0.15 + 0.2 * hs(i * 7 + j, seed + 51)), null);
    } }
  }
  // feathers: ~40 per metre on every rail top and on the sleeper tops outside the rails (not under the sledge: s -1.95..2.55)
  const feather = (x, y, z, k, ls, sd) => { const a = hs(sd, 1) * TAU, l = 0.012 + 0.025 * hs(sd, 2), w = 0.004 + 0.003 * hs(sd, 3), d = [Math.cos(a), 0, Math.sin(a)]; blade(T, [x, y, z], d, l * ls, w, k, [0, 1, 0]); };
  let fi = 0;
  for (let rail = 0; rail < 2; rail++) {
    const n = Math.round(35.2 * 40);
    for (let i = 0; i < n; i++, fi++) {
      const s = -2.2 + 35.2 * hs(fi, seed + 60); if (s > -1.95 && s < 2.55) continue;
      const u = Math.pow(hs(fi, seed + 61), 1.6), lat = -0.075 + 0.15 * u, c = railPt(rail, s), shade = u < 0.5;
      feather(s, c[1] + 0.078, c[2] + lat, shade ? mixc(PAL.frostShade, PAL.frost, 0.4) : PAL.frost, 1, fi + seed * 1000);
    }
  }
  for (let i = 0; i < NSLEEP; i++) {
    const sl = sleepers[i], R = sl.d / 2, cy = 0.19 - R, n = Math.round(sl.l * 40 * 0.7);
    for (let j = 0; j < n; j++, fi++) {
      let z = (hs(fi, seed + 62) - 0.5) * (sl.l - 0.08); if (Math.abs(Math.abs(z) - 0.52) < 0.11) continue;
      const x = (hs(fi, seed + 63) - 0.5) * 0.12, u = x < 0 ? 0 : 1;
      feather(sl.s + x, cy + Math.sqrt(Math.max(0, R * R - x * x)) + 0.004, sl.dr + z, u ? PAL.frost : mixc(PAL.frostShade, PAL.frost, 0.4), 1, fi + seed * 1000);
    }
  }
  // the bare footprints (one mesh per rail, slides back with `creep`): damp wood, a crisp broken edge 2 cm at the ends
  const foot = new THREE.Group();
  for (let rail = 0; rail < 2; rail++) {
    const NS = 90, s0 = -1.95, s1 = 2.5;
    const rowAt = (s, lift) => { const c = railPt(rail, s); return [8, 7, 6, 5, 4].map((k, i) => add(c, [0, SECT[k][1] + lift + (i === 0 || i === 4 ? 0 : 0.0006), SECT[k][0] + (k === 8 ? -0.006 : k === 4 ? 0.006 : 0)])); };
    for (let i = 0; i < NS; i++) {
      const a = rowAt(s0 + ((s1 - s0) * i) / NS, 0.0045), b = rowAt(s0 + ((s1 - s0) * (i + 1)) / NS, 0.0045), k = mulc(PAL.bare, 0.92 + 0.16 * hs(i + rail * 91, seed + 80));
      for (let r = 0; r < 4; r++) FP.quad(a[r], a[r + 1], b[r + 1], b[r], k, null);
    }
    for (const [sEnd, dir] of [[s0, -1], [s1, 1]]) {   // zigzag ends 2 cm wide
      const m = 10, rows = rowAt(sEnd, 0.0045);
      for (let j = 0; j < m; j++) { const t0 = j / m, t1 = (j + 1) / m, ex = (hs(j + rail * 17, seed + 81 + (dir > 0 ? 1 : 0)) * 0.02) * dir, zz = (t) => { const f = t * 4, i = Math.min(3, Math.floor(f)); return mix3(rows[i], rows[i + 1], f - i); };
        FP.tri(zz(t0), zz(t1), add(zz((t0 + t1) / 2), [ex, 0.0004, 0]), mulc(PAL.bare, 0.9), null); }
    }
  }
  const footMesh = mesh(foot, FP, std({ side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), { cast: false });
  void footMesh;
  // the skid marks (Chip's feet): two scraped lines growing toward -s, torn turf and frost crumbs at the trailing end
  const [kS, kR] = S.skidAt ?? [6.35, -1.04], skid = new THREE.Group(), tail = new THREE.Group(), LN = new Soup(), TURF = new Soup();
  for (const dz of [-0.06, 0.06]) {
    const m = 14; for (let i = 0; i < m; i++) {
      const x0 = -i / m, x1 = -(i + 1) / m, w0 = 0.032 * (1 - 0.3 * x0 * -1) * (0.85 + 0.3 * hs(i, seed + dz * 100)), w1 = 0.03 * (0.85 + 0.3 * hs(i + 1, seed + dz * 100));
      LN.quad([x0, 0, dz - w0], [x0, 0, dz + w0], [x1, 0, dz + w1], [x1, 0, dz - w1], mulc(mixc(PAL.earth, PAL.oakShade, 0.35), 0.9 + 0.2 * hs(i, 5 + dz)), null);
    }
  }
  skid.position.set(kS, 0.0195, kR); skid.scale.x = 0; mesh(skid, LN, std({ side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }), { cast: false });
  for (let j = 0; j < 12; j++) {   // torn turf flaps, lifted
    const x = -0.14 * hs(j, seed + 90), z = (hs(j, seed + 91) - 0.5) * 0.3, w = 0.04 + 0.05 * hs(j, seed + 92), up = 0.02 + 0.035 * hs(j, seed + 93);
    TURF.tri([x, 0, z - w / 2], [x, 0, z + w / 2], [x - 0.04 - 0.05 * hs(j, seed + 94), up, z + (hs(j, seed + 95) - 0.5) * 0.04], mixc(PAL.turf, PAL.grass, hs(j, seed + 96) * 0.4), null);
    TURF.tri([x, 0.002, z - w / 2], [x - 0.05, 0.002, z], [x - 0.03, up * 0.6, z + w / 3], mulc(PAL.turf, 0.7), null);
  }
  for (let j = 0; j < 40; j++) {   // the ridge of frost crumbs
    const x = -0.2 + 0.2 * hs(j, seed + 97), z = (hs(j, seed + 98) - 0.5) * 0.34, r = 0.006 + 0.01 * hs(j, seed + 99), h = 0.006 + 0.012 * hs(j, seed + 100);
    TURF.tri([x - r, 0, z - r], [x + r, 0, z - r * 0.3], [x, h, z + r], mixc(PAL.crumb, PAL.frostShade, 0.15 * hs(j, 3)), null);
  }
  tail.position.set(0, 0, 0); tail.scale.setScalar(0); skid.add(tail); mesh(tail, TURF, std({ side: THREE.DoubleSide }), { cast: false });
  // the ground apron decal
  const apron = (() => {
    const g2 = new THREE.BufferGeometry(), v = [[-9.5, 0.012, 4.5], [10.5, 0.012, 4.5], [10.5, 0.012, -4.5], [-9.5, 0.012, -4.5]];
    g2.setAttribute("position", new THREE.BufferAttribute(new Float32Array(v.flat()), 3)); g2.setAttribute("normal", new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
    g2.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 2)); g2.setIndex([0, 1, 2, 0, 2, 3]); g2.boundingSphere = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 12);
    const m = new THREE.MeshStandardMaterial({ map: apronTex(seed), roughness: 1, transparent: true, depthWrite: false }); m.userData.noOutline = true;
    const me = new THREE.Mesh(g2, m); me.castShadow = false; me.receiveShadow = true; me.frustumCulled = false; me.renderOrder = 1; me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; return me;
  })();
  mesh(g, B, std(), {}); mesh(g, T, std({ side: THREE.DoubleSide }), { cast: false }); g.add(foot); g.add(skid); g.add(apron);
  P.whole.userData.triangles = B.n + T.n + FP.n + LN.n + TURF.n + sleeperTris + 2;
  P.whole.add(g);
  let last = "";
  return {
    grip: 0,
    apply(ps) {
      const cr = clamp(num(ps.creep, num(S.creep, 0)), 0, 0.1), sk = clamp(num(ps.skid, num(S.skid, 0))), key = `${cr}|${sk}`; if (key === last) return; last = key;
      foot.position.x = -cr; skid.visible = sk > 0.001; skid.scale.x = Math.max(1e-4, 0.55 * sk);
      tail.visible = sk > 0.02; const k = sm(sk * 4) * 1; tail.scale.set(k / Math.max(1e-4, 0.55 * sk), k, k);
    },
  };
}

// ================================================================================================================ haulrope
const ROPE_DEF = { 1: { from: [2.5, 0.77, 0.88], grip: [6.5, 0.56, 1.58], end: [7.45, 0.04, 2.13] }, [-1]: { from: [2.5, 0.77, -0.88], grip: [6.5, 0.38, -1.46], end: [7.45, 0.04, -2.01] } };
const ropeDef = (S) => { const side = S.side === -1 ? -1 : 1, d = ROPE_DEF[side]; return { side, A: S.from ?? d.from, H: S.grip ?? d.grip, E: S.end ?? d.end }; };
export const ropeTaut = (S, q) => { const { A, H } = ropeDef(S); return [A[0] + q * (H[0] - A[0]), A[1] + q * (H[1] - A[1]), A[2] + q * (H[2] - A[2])]; };
export const leverAt = (d, pump = 0) => { const th = (20.9 - 12.9 * pump) * DEG; return [-2.64 - d * Math.cos(th), 0.986 + d * Math.sin(th), 0]; };
function ropePath({ A, H, E, side }, slack) {
  const NM = 96, k = clamp(slack / 0.5), k2 = sm((slack - 0.5) / 0.5), pts = [];
  for (let i = 0; i <= NM; i++) {
    const q = i / NM, yT = lerp(A[1], H[1], q); let y = yT, r = lerp(A[2], H[2], q);
    if (q <= 0.8) { const u = q / 0.8, raw = yT - 1.1 * k * 4 * u * (1 - u); y = Math.max(0.04, raw); r += side * 0.1 * k * Math.sin(3 * Math.PI * u) * clamp((0.14 - raw) / 0.14); }
    if (k2 > 0) { const w = q >= 0.8 ? 1 : sm((q - 0.55) / 0.25); y = lerp(y, 0.04, k2 * w); if (q >= 0.8) r += side * 0.08 * k2 * Math.sin(10 * Math.PI * (q - 0.8)); }
    pts.push([lerp(A[0], H[0], q), y, r]);
  }
  // the tail: H -> the ground -> 1.25 turns of a loop r 0.26 (upper strand 0.08 up where it crosses) -> E
  const He = pts[NM], G1 = [H[0] + 0.25, 0.04, H[2] + side * 0.3], C = [H[0] + 0.45, H[2] + side * 0.72], th0 = Math.atan2(G1[2] - C[1], G1[0] - C[0]);
  const loop = (dir) => { const o = []; for (let j = 0; j <= 16; j++) { const f = j / 16, a = th0 + dir * TAU * 1.25 * f; o.push([C[0] + 0.26 * Math.cos(a), 0.04 + 0.08 * sm((f - 0.7) / 0.12), C[1] + 0.26 * Math.sin(a)]); } return o; };
  const score = (dir) => { const l = loop(dir), p = l.at(-1), a = th0 + dir * TAU * 1.25, t = [-dir * Math.sin(a), 0, dir * Math.cos(a)]; return dot(t, norm(sub(E, p))); };
  const dir = score(1) >= score(-1) ? 1 : -1, lp = loop(dir);
  const ctrl = [He, [H[0] + 0.1, lerp(He[1], 0.04, 0.6), H[2] + side * 0.12], G1, ...lp, mix3(lp.at(-1), E, 0.5).map((v, i) => (i === 1 ? 0.07 : v)), E];
  const tailPts = spline(ctrl, 3);
  return [...pts.slice(0, -1), ...tailPts];
}
function buildRope(P) {
  const S = P.spec, d = ropeDef(S), seed = S.seed ?? (d.side > 0 ? 1 : 2), g = new THREE.Group();
  const mB = std(), mT = std({ side: THREE.DoubleSide });
  let mb = null, mt = null, last = null;
  const rebuild = (slack) => {
    const B = new Soup(), T = new Soup(), pts = ropePath(d, slack), n = pts.length, arc = [0];
    for (let i = 1; i < n; i++) arc.push(arc[i - 1] + len(sub(pts[i], pts[i - 1])));
    const L = arc[n - 1], R = (i) => (arc[i] > L - 0.07 ? 0.044 : 0.04);
    const tube = ropeTube(B, pts, R, { sides: 9, ridge: 0.13, seed, pitch: 0.24 });
    // whipping (the last 7 cm) in cord colour
    // stray fibres ~7 per metre
    const nf = Math.round(L * 7);
    for (let j = 0; j < nf; j++) {
      const a = hs(j, seed + 50) * L; let i = 1; while (i < n - 1 && arc[i] < a) i++;
      const f = tube.F[i], ang = hs(j, seed + 51) * TAU, rad = add(mul(f.n, Math.cos(ang)), mul(f.b, Math.sin(ang))), p = add(pts[i], mul(rad, 0.037)), dr = norm(add(mul(rad, 0.55), mul(f.t, 0.85 * (hs(j, seed + 52) > 0.5 ? 1 : -1))));
      blade(T, p, dr, 0.05 + 0.05 * hs(j, seed + 53), 0.009, mixc(PAL.ropeLight, PAL.rope, hs(j, seed + 54) * 0.5));
    }
    // the whipped end: cord turns and a 0.12 frayed tuft
    const fe = tube.F[n - 1], e = pts[n - 1];
    for (let j = 0; j < 3; j++) { const c = sub(e, mul(fe.t, 0.015 + 0.02 * j)); ropeTube(B, rrLoop(0, 0, 0.044, 0.044, 0.044, 3).map(([u, v]) => add(c, add(mul(fe.n, u), mul(fe.b, v)))), 0.007, { closed: true, hint: fe.t, sides: 4, base: PAL.cord, shade: PAL.cord, seed: j }); }
    fray(T, e, fe.t, 0.12, 9, PAL.rope, seed * 11);
    // cap the start (it is hidden in the collar's knot)
    const ring = tube.V[0], c0 = pts[0]; for (let q = 0; q < ring.length; q++) B.tri(c0, ring[q], ring[(q + 1) % ring.length], PAL.ropeShade, add(c0, mul(tube.F[0].t, 0.2)));
    if (mb) { mb.geometry.dispose(); mt.geometry.dispose(); g.remove(mb); g.remove(mt); }
    mb = mesh(g, B, mB, {}); mt = mesh(g, T, mT, { cast: false });
    P.whole.userData.triangles = B.n + T.n;
  };
  rebuild(num(S.slack, 0)); last = num(S.slack, 0); P.whole.add(g);
  return { grip: 0, apply(ps) { const s = clamp(num(ps.slack, num(S.slack, 0))); if (s !== last) { last = s; rebuild(s); } } };
}

// ================================================================================================================ haullever + pivotstone
function buildLever(P) {
  const S = P.spec, seed = S.seed ?? 1, B = new Soup(), T = new Soup(), pole = new THREE.Group(), g = new THREE.Group(), X0 = -3.6, X1 = 0.8, n = 45, K = 12;
  const xs = Array.from({ length: n }, (_, i) => X0 + ((X1 - X0) * i) / (n - 1)), bow = (x) => 0.03 * Math.sin((Math.PI * (x - X0)) / (X1 - X0));
  const pts = xs.map((x) => [x, 0, bow(x)]), rz = (x) => (x <= 0 ? lerp(0.045, 0.06, (x - X0) / -X0) : 0.06 + 0.002 * hs(Math.round(x * 20), seed));
  const ry = (x) => (x > 0.5 ? lerp(0.06, 0.025, sm((x - 0.5) / 0.3)) : rz(x)), cs = (a) => Math.cos(a), sn = (a) => Math.sin(a);
  const barks = [0, 1, 2, 3].map((b) => ({ i0: 3 + Math.floor(hs(b, seed + 3) * 36), l: 3 + Math.floor(hs(b, seed + 4) * 4), k0: Math.floor(hs(b, seed + 5) * K) }));
  const colf = (i, k) => {
    const h = hs(i * 11 + k, seed);
    for (const b of barks) if (i >= b.i0 && i < b.i0 + b.l && ((k - b.k0 + K) % K) < 4) return mixc(PAL.bark, PAL.oakShade, hs(i, k) * 0.4);
    return mixc(PAL.pole, h < 0.5 ? PAL.ropeLight : PAL.rope, 0.18 * Math.abs(h - 0.5) * 2 + 0.05 * hs(i, 2));
  };
  const { V } = sweep(B, pts, K, (i, k) => { const a = (k / K) * TAU; return [ry(xs[i]) * sn(a), rz(xs[i]) * cs(a)]; }, colf, { hint: [0, 1, 0], smooth: true });
  endGrain(B, V[0], pts[0], [-1, 0, 0], seed);
  { const ring = V[n - 1], c = pts[n - 1]; for (let q = 0; q < K; q++) B.tri(add(c, [0.002, 0, 0]), add(ring[q], [0.002, 0, 0]), add(ring[(q + 1) % K], [0.002, 0, 0]), mixc(PAL.grain, PAL.pole, 0.5), add(c, [-0.3, 0, 0])); }
  for (let c = 0; c < 9; c++) {   // knots
    const i = 2 + Math.floor(hs(c, seed + 20) * (n - 6)), k = Math.floor(hs(c, seed + 21) * K), p = V[i][k], r = norm(sub(p, pts[i]));
    blob(B, add(p, mul(r, 0.002)), [0.022 + 0.012 * hs(c, seed + 22), 0.022 + 0.012 * hs(c, seed + 23), 0.022], PAL.knot, { nu: 6, nv: 4, seed: c });
  }
  for (let c = 0; c < 6; c++) {   // drying cracks
    const i0 = 2 + Math.floor(hs(c, seed + 30) * (n - 12)), k = Math.floor(hs(c, seed + 31) * K), line = [];
    for (let i = i0; i < i0 + 4 + Math.floor(hs(c, seed + 32) * 5); i++) { const kk = k; line.push(add(V[i][kk], mul(norm(sub(V[i][kk], pts[i])), 0.002))); }
    ribbon(T, line, (i) => norm(sub(V[i0 + i][k], pts[i0 + i])), 0.007, PAL.oakShade);
  }
  mesh(pole, B, std(), {}); mesh(pole, T, std({ side: THREE.DoubleSide }), { cast: false });
  g.add(pole); finish(P, g, [B, T]);
  let last = null;
  return { grip: 0, apply(ps) { const p = clamp(num(ps.pump, num(S.pump, 0))); if (p === last) return; last = p; pole.rotation.z = -(20.9 - 12.9 * p) * DEG; } };
}
function buildPivot(P) {
  const S = P.spec, seed = S.seed ?? 1, B = new Soup(), T = new Soup(), g = new THREE.Group(), NU = 48, NV = 32, A = 0.505, Bz = 0.48, Cy = 0.49, cy0 = 0.48;
  const lump = (x, y, z) => 0.04 * (0.5 * Math.sin(x * 7 + seed * 1.3) * Math.cos(z * 6 + 1) + 0.3 * Math.sin(y * 9 + x * 4 + seed) + 0.35 * Math.cos(z * 8 - y * 5 + seed * 2));
  const pt = (j, i) => {
    const th = Math.PI * Math.pow(j / NV, 1.3), ph = (TAU * i) / NU, ux = Math.sin(th) * Math.cos(ph), uy = Math.cos(th), uz = Math.sin(th) * Math.sin(ph);
    const e = 1 + lump(ux, uy, uz) * Math.pow(Math.sin(th), 0.5) / 0.5 * 0.6;
    let x = A * ux * e, y = cy0 + Cy * uy * e, z = Bz * uz * e;
    // the worn saddle along s for the pole: 0.12 wide, bottom exactly 0.93 at the origin
    const wz = Math.abs(z) / 0.075, wx = Math.abs(x) / 0.3, hh = sm((y - 0.78) / 0.12);
    if (wz < 1 && wx < 1 && j > 0) y -= 0.04 * (1 - wz * wz) * (1 - wx * wx) * hh;
    if (j === 0) { x = 0; y = 0.93; z = 0; }
    return [x, y, z];
  };
  const ctr = [0, 0.45, 0], grid = [], vn = (x, y, z, sd) => {   // smooth value noise
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi), h = (a, b, c) => hs(a * 12.9898 + b * 78.233 + c * 37.719, sd);
    return lerp(lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v), lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
  };
  const FD = norm([0, 0.8, -0.6]), nOf = (p) => norm([p[0] / (A * A), (p[1] - cy0) / (Cy * Cy), p[2] / (Bz * Bz)]);
  const colAt = (p) => {
    const n = nOf(p), a = vn(p[0] * 3.2, p[1] * 3.2, p[2] * 3.2, seed + 1), b = vn(p[0] * 9, p[1] * 9, p[2] * 9, seed + 2), c0 = clamp(0.5 + (a - 0.5) * 1.1 + (b - 0.5) * 0.5);
    let k = mixc(PAL.bShade, PAL.boulder, 0.25 + 0.75 * c0); if (n[1] < 0.1) k = mulc(k, 0.78 + 0.22 * clamp((n[1] + 0.6) / 0.7));
    const fw = (dot(n, FD) - 0.32) / 0.3 + 0.7 * (vn(p[0] * 6, p[1] * 6, p[2] * 6, seed + 3) - 0.5), f = sm(fw);
    if (f > 0) k = mixc(k, mixc(PAL.frostShade, PAL.frost, 0.55 + 0.4 * b), f * 0.92);
    const gw = 1 - clamp(Math.abs(p[2]) / 0.11); if (gw > 0 && p[1] > 0.8) k = mixc(k, PAL.fleck, 0.35 * gw);   // the saddle is rubbed pale
    return k;
  };
  for (let j = 0; j <= NV; j++) { const row = []; for (let i = 0; i < NU; i++) row.push(pt(j, i)); grid.push(row); }
  const nrmGrid = grid.map((row) => row.map(nOf)), colGrid = grid.map((row) => row.map(colAt));
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const i2 = (i + 1) % NU, a = grid[j][i], b = grid[j + 1][i], c = grid[j + 1][i2], d = grid[j][i2];
    B.triN(a, b, c, nrmGrid[j][i], nrmGrid[j + 1][i], nrmGrid[j + 1][i2], colGrid[j][i], colGrid[j + 1][i], colGrid[j + 1][i2]);
    B.triN(a, c, d, nrmGrid[j][i], nrmGrid[j + 1][i2], nrmGrid[j][i2], colGrid[j][i], colGrid[j + 1][i2], colGrid[j][i2]);
  }
  for (let f = 0; f < 260; f++) {   // flecks
    const j = 2 + Math.floor(hs(f, seed + 10) * (NV - 4)), i = Math.floor(hs(f, seed + 11) * NU), p = mix3(grid[j][i], grid[j + 1][(i + 1) % NU], 0.5), r = norm(sub(p, ctr)), dd = hs(f, seed + 12) * TAU;
    const a = norm(cross(r, [0, 1, 0]).every((v) => Math.abs(v) < 1e-5) ? [1, 0, 0] : cross(r, [0, 1, 0])), b = norm(cross(r, a)), s = 0.01 + 0.02 * hs(f, seed + 13), o = add(p, mul(r, 0.003));
    T.tri(add(o, mul(add(mul(a, Math.cos(dd)), mul(b, Math.sin(dd))), s)), add(o, mul(add(mul(a, Math.cos(dd + 2.2)), mul(b, Math.sin(dd + 2.2))), s * 0.7)), add(o, mul(add(mul(a, Math.cos(dd + 4.2)), mul(b, Math.sin(dd + 4.2))), s * 0.7)), mixc(PAL.fleck, PAL.boulder, 0.2 * hs(f, seed + 14)), null);
  }
  for (let t = 0; t < 24; t++) {   // grass tufts at the foot
    const a = (t / 24) * TAU + 0.2 * (hs(t, seed + 20) - 0.5), rr = 0.46 + 0.1 * hs(t, seed + 21), bx = rr * 1.0 * Math.cos(a) * 1.04, bz = rr * Math.sin(a);
    for (let b = 0; b < 5; b++) { const aa = hs(t * 7 + b, seed + 22) * TAU; blade(T, [bx + 0.03 * Math.cos(aa), 0, bz + 0.03 * Math.sin(aa)], norm([0.25 * Math.cos(aa + 1), 1, 0.25 * Math.sin(aa + 1)]), 0.08 + 0.08 * hs(t * 7 + b, seed + 23), 0.018, mixc(PAL.grass, PAL.turf, hs(t * 7 + b, seed + 24) * 0.7), [1, 0, 0]); }
  }
  mesh(g, B, std(), { solid: true }); mesh(g, T, std({ side: THREE.DoubleSide }), { cast: false });
  return finish(P, g, [B, T]);
}

// ================================================================================================================ haulcrew
// The figure kit is COPIED from engine/page/props-sh-far.js (haulteam's far potatoes: FIG, units(), armMat, buildHaul's instanced frame()), at a lighter
// tessellation for 260 of them. Parts face +z at the origin there; the frame() below turns them to +x exactly as haulteam does.
const CW = { rx: 0.34, ry: 0.4, rz: 0.31, cy: 0.44 }, CW_GOLD = "#e2a95c", CW_FUR = ["#7a5a3c", "#8d8478"], CW_BOOT = "#5d4630";
const cwColored = (g, c) => {   // plain geometry: no index, no uv, a vertex colour (a flat colour or a function (x, y, z) -> [r, g, b])
  g = g.index ? g.toNonIndexed() : g; g.deleteAttribute("uv");
  const p = g.attributes.position, a = new Float32Array(p.count * 3), flat = typeof c !== "function", cc = flat ? col(c) : null;
  for (let i = 0; i < p.count; i++) { const q = flat ? cc : c(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
};
let CW_UNITS = null;
function crewUnits() {
  if (CW_UNITS) return CW_UNITS;
  const { rx, ry, rz, cy } = CW, white = [1, 1, 1];
  const egg = new THREE.SphereGeometry(1, 14, 10);
  { const p = egg.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.07 * (hs(Math.round(p.getX(i) * 40) * 3.1 + Math.round(p.getY(i) * 40) * 7.7 + Math.round(p.getZ(i) * 40) * 11.3) - 0.5); p.setXYZ(i, p.getX(i) * k * rx, p.getY(i) * k * ry + cy, p.getZ(i) * k * rz); } egg.computeVertexNormals(); }
  const body = cwColored(egg, (x, y) => { const k = 0.93 + 0.14 * clamp((y - 0.1) / 0.7); return [k, k, k]; });
  // cape: rings from the neck down, back and sides, front open, an uneven fur hem
  const cape = new Soup(), TH = [1.0, 1.25, 1.5, 1.7, 1.85], NJ = 14, SPAN = 1.55, K = 1.1;
  const capeP = (th, ph) => [rx * K * Math.sin(th) * Math.sin(ph), cy + ry * K * Math.cos(th), -rz * K * Math.sin(th) * Math.cos(ph)];
  for (let k = 0; k < TH.length - 1; k++) for (let j = 0; j < NJ; j++) {
    const ph0 = -SPAN + (2 * SPAN * j) / NJ, ph1 = -SPAN + (2 * SPAN * (j + 1)) / NJ, hemA = k === TH.length - 2, t0 = TH[k], t1 = TH[k + 1];
    const h = (jj) => (hemA ? 0.2 * (jj % 2) + 0.1 * (hs(jj * 3.3) - 0.5) : 0), sh = (kk, jj) => 0.82 + 0.18 * hs(kk * 19.1 + jj * 5.3);
    const q = (sh(k, j) + sh(k, j + 1) + sh(k + 1, j) * (hemA ? 0.8 : 1) + sh(k + 1, j + 1) * (hemA ? 0.8 : 1)) / 4;
    cape.quad(capeP(t0, ph0), capeP(t0, ph1), capeP(t1 + h(j + 1), ph1), capeP(t1 + h(j), ph0), [q, q, q], null);
  }
  for (let j = 0; j < NJ; j++) { const ph0 = -SPAN + (2 * SPAN * j) / NJ, ph1 = -SPAN + (2 * SPAN * (j + 1)) / NJ; cape.tri(capeP(1.85, ph0), capeP(1.85, ph1), capeP(2.05 + 0.12 * hs(j * 7.7), (ph0 + ph1) / 2), [0.7, 0.7, 0.7], null); }
  // cord at the neck: a thin ring and a bead at the front
  const cordP = [];
  { const t = new THREE.TorusGeometry(1, 0.045, 4, 14); t.rotateX(Math.PI / 2); t.scale(rx * K * Math.sin(1.0), 1, rz * K * Math.sin(1.0)); t.translate(0, cy + ry * K * Math.cos(1.0) - 0.01, 0); cordP.push(cwColored(t, "#c9b48a"));
    const b = new THREE.SphereGeometry(0.035, 5, 4); b.translate(0, cy + ry * K * Math.cos(1.0) - 0.03, rz * K * Math.sin(1.0)); cordP.push(cwColored(b, "#b89a68")); }
  // the face: two dot eyes, a small mouth
  const faceP = [];
  for (const x of [-0.11, 0.11]) { const e = new THREE.SphereGeometry(0.036, 5, 4); e.translate(x, cy + 0.12, 0.262); faceP.push(cwColored(e, "#2b1d14")); }
  { const m = new THREE.SphereGeometry(1, 6, 4); m.scale(0.05, 0.022, 0.03); m.translate(0, cy - 0.04, 0.3); faceP.push(cwColored(m, "#6a2e22")); }
  const boot = (() => { const g = new THREE.SphereGeometry(1, 6, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.18 * (hs(Math.round(p.getX(i) * 20) * 3 + Math.round(p.getY(i) * 20) * 5 + Math.round(p.getZ(i) * 20) * 7) - 0.5); p.setXYZ(i, p.getX(i) * 0.1 * k, p.getY(i) * 0.07 * k + 0.07, p.getZ(i) * 0.15 * k + 0.03); } g.computeVertexNormals(); return cwColored(g, (x, y) => { const k = 0.8 + 0.4 * clamp(y / 0.15); return [k, k, k]; }); })();
  const arm = (() => { const c = new THREE.CylinderGeometry(0.034, 0.03, 1, 5); c.translate(0, 0.5, 0); return cwColored(c, white); })();
  const hand = cwColored(new THREE.SphereGeometry(0.055, 6, 4), white);
  const sd = new THREE.CircleGeometry(1, 10); sd.rotateX(-Math.PI / 2);
  const capeG = cape.geo(); capeG.deleteAttribute("uv");
  return (CW_UNITS = { body, cape: capeG, det: mergeGeometries([...cordP, ...faceP]), boot, arm, hand, sd });
}
// a stick arm from world point a to b as the unit arm (length along +y)
function cwArm(a, b, th) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 0.001, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), q, new THREE.Vector3(th, L, th));
}
function buildCrew(P) {
  const S = P.spec, U = crewUnits(), N = Math.max(1, Math.min(260, Math.round(num(S.n, 40)))), fz = num(S.fileZ, 1.25), gap = num(S.rowGap, 1.05), x0 = num(S.start, 3.2), HY = 0.5;
  const F = [];
  for (let i = 0; i < N; i++) {
    const f = i % 2 ? 1 : -1, row = i >> 1, s = (0.85 * (0.94 + 0.12 * hs(i, 21))) / 0.85;
    F.push({ f, x: x0 + row * gap, z: f * (fz + 0.32), s, lean: (18 + 8 * hs(i, 22)) * DEG, ph: hs(i, 23) * TAU, tone: 0.92 + 0.16 * hs(i, 24), fur: hs(i, 25) < 0.5 ? 0 : 1 });
    const q = F[i]; q.hx = q.x + 0.62 * s; q.hz = f * fz;
  }
  const g = new THREE.Group(), flag = (m) => { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.userData.solid = false; m.userData.lookOnly = true; m.userData.surfaceOnly = true; m.userData.steam = true; return m; };
  const charm = (o = {}) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "char"; return m; };
  const mk = (geo, mat, count) => { const im = new THREE.InstancedMesh(geo, mat, count); g.add(flag(im)); return im; };
  const shM = new THREE.MeshBasicMaterial({ color: "#1c1814", transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }); shM.userData.noOutline = true;
  const bodyIM = mk(U.body, charm(), N), capeIM = mk(U.cape, charm({ side: THREE.DoubleSide }), N), detIM = mk(U.det, charm(), N), bootIM = mk(U.boot, charm(), N * 2), armIM = mk(U.arm, charm(), N * 2), handIM = mk(U.hand, charm(), N * 2), shIM = mk(U.sd, shM, N);
  shIM.renderOrder = 2;
  const IMS = [bodyIM, capeIM, detIM, bootIM, armIM, handIM, shIM], C = new THREE.Color();
  F.forEach((q, i) => {
    bodyIM.setColorAt(i, C.set(CW_GOLD).multiplyScalar(q.tone)); capeIM.setColorAt(i, C.set(CW_FUR[q.fur])); detIM.setColorAt(i, C.set("#ffffff")); shIM.setColorAt(i, C.set("#ffffff"));
    for (let s = 0; s < 2; s++) { bootIM.setColorAt(i * 2 + s, C.set(CW_BOOT)); armIM.setColorAt(i * 2 + s, C.set(CW_GOLD).multiplyScalar(q.tone)); handIM.setColorAt(i * 2 + s, C.set(CW_GOLD).multiplyScalar(q.tone)); }
  });
  for (const m of IMS) m.instanceColor.needsUpdate = true;
  // the two ropes: rebuilt when the number of shown figures changes (their length follows the last shown row)
  const mR = std(); let rope = null, ropeKey = -1, ropeTris = 0;
  const ropes = (m) => {
    const B = new Soup(), xl = x0 + Math.floor((Math.max(m, 1) - 1) / 2) * gap, xe = xl + 1.0, xd = xl + 0.8;
    for (const f of [-1, 1]) {
      const A = [0, 0.77, f * 0.88], H = [x0 + 0.62, HY, f * fz], pts = [], n1 = Math.max(2, Math.ceil(len(sub(H, A)) / 0.1));
      for (let i = 0; i < n1; i++) pts.push(mix3(A, H, i / n1));
      for (let x = H[0]; x < xd - 1e-6; x += 0.1) pts.push([x, HY, f * fz]);
      for (let j = 0; j <= 6; j++) { const k = sm(j / 6); pts.push([lerp(xd, xe, j / 6), lerp(HY, 0.035, k), f * fz]); }
      ropeTube(B, pts, 0.035, { sides: 6, ridge: 0.1, pitch: 0.9, seed: f + 3 });
    }
    if (rope) { rope.geometry.dispose(); g.remove(rope); }
    rope = mesh(g, B, mR, { cast: false }); rope.userData.steam = true; ropeTris = B.n;
  };
  const V = new THREE.Vector3(), Q = new THREE.Quaternion(), Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), Q3 = new THREE.Quaternion(), Sv = new THREE.Vector3(), M = new THREE.Matrix4(), Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const tri = (geo) => geo.attributes.position.count / 3, perFig = tri(U.body) + tri(U.cape) + tri(U.det) + 2 * (tri(U.boot) + tri(U.arm) + tri(U.hand)) + tri(U.sd);
  const uniq = tri(U.body) + tri(U.cape) + tri(U.det) + tri(U.boot) + tri(U.arm) + tri(U.hand) + tri(U.sd);
  const shown = (grow) => Math.round(N * clamp(grow));
  let last = "";
  const set = (t, heave, walk, grow) => {
    const m = shown(grow), key = `${t}|${heave}|${walk}|${m}`; if (key === last) return; last = key;
    g.visible = m > 0; if (m !== ropeKey) { ropeKey = m; ropes(m); }
    P.whole.userData.triangles = Math.round(uniq * 1 + ropeTris); P.whole.userData.trianglesDrawn = Math.round(perFig * m + ropeTris);
    for (const im of IMS) im.count = im === bootIM || im === armIM || im === handIM ? m * 2 : m;
    for (let i = 0; i < m; i++) {
      const q = F[i], s = q.s, phi = t * 1.15 * TAU + q.ph, pulse = Math.sin(2 * phi), bob = 0.022 * (0.5 + 0.5 * pulse) * walk, lean = heave * (q.lean + 0.05 * pulse), roll = 0.05 * Math.sin(phi) * walk, dx = 0.04 * Math.cos(2 * phi + 0.8) * (0.35 + 0.65 * walk) * heave;
      Q1.setFromAxisAngle(Z, -lean); Q2.setFromAxisAngle(X, roll); Q3.setFromAxisAngle(Y, Math.PI / 2); Q.copy(Q1).multiply(Q2).multiply(Q3);
      V.set(q.x + dx, bob, q.z); Sv.set(s, s, s); const Mb = new THREE.Matrix4().compose(V, Q, Sv);
      bodyIM.setMatrixAt(i, Mb); capeIM.setMatrixAt(i, Mb); detIM.setMatrixAt(i, Mb);
      for (let sd2 = 0; sd2 < 2; sd2++) {
        const sg = sd2 ? 1 : -1, fp = phi + (sd2 ? 0 : Math.PI), fx = q.x + 0.15 * s * Math.sin(fp) * walk, lift = 0.06 * Math.max(0, Math.cos(fp)) * walk;
        Q1.setFromAxisAngle(Y, Math.PI / 2); Q2.setFromAxisAngle(Z, -0.3 * Math.max(0, Math.cos(fp)) * walk); Q3.copy(Q2).multiply(Q1);
        bootIM.setMatrixAt(i * 2 + sd2, M.compose(V.set(fx, lift, q.z + sg * 0.13 * s), Q3, Sv.set(s, s, s)));
        const sh = new THREE.Vector3(sg * 0.3, 0.5, 0.03).applyMatrix4(Mb), hp = [q.hx + sg * 0.07, HY, q.hz + (sd2 ? 0.03 : -0.03)];
        armIM.setMatrixAt(i * 2 + sd2, cwArm(sh.toArray(), hp, s)); handIM.setMatrixAt(i * 2 + sd2, M.compose(V.set(hp[0], hp[1], hp[2]), Q.identity(), Sv.set(s, s, s)));
      }
      shIM.setMatrixAt(i, M.compose(V.set(q.x + 0.18, 0.02, q.z), Q.identity(), Sv.set(0.5 * s, 1, 0.34 * s)));
    }
    for (const im of IMS) im.instanceMatrix.needsUpdate = true;
  };
  set(0, clamp(num(S.heave, 1)), clamp(num(S.walk, 0)), clamp(num(S.grow, 1)));
  P.whole.add(g);
  return { grip: 0, apply(ps, t = 0) { set(t, clamp(num(ps.heave, num(S.heave, 1))), clamp(num(ps.walk, num(S.walk, 0))), clamp(num(ps.grow, num(S.grow, 1)))); } };
}

const wrap = (fn) => (P) => { const d = fn(P); return d && d.apply ? d : { grip: 0 }; };
const plainKind = (fn) => (P) => { const g = fn(P); void g; return { grip: 0 }; };
export const FTT_HAUL_KINDS = {
  haulsledge: plainKind(buildSledge), haullash: plainKind(buildLash), haulrails: wrap(buildRails), haulrope: wrap(buildRope), haullever: wrap(buildLever), pivotstone: plainKind(buildPivot), haulcrew: wrap(buildCrew),
};
export const FTT_HAUL_GRIPS = {};
export const FTT_HAUL_STATE = { haulrope: { slack: 0 }, haullever: { pump: 0 }, haulrails: { creep: 0, skid: 0 }, haulcrew: { heave: 1, walk: 0, grow: 1 } };
