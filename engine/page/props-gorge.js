import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { KIND_POSTS } from "../shared/obstacles.js";

// There's a catch EP09b "Every jump, someone forgets you" (storyboards/series/what-if/09b-teleport-forget/DESIGN.md sections 1, 2, 3, 7): the gorge
// of the broken rope bridge. Three kinds. World frame (DESIGN): x along the gorge, y up, z toward the near ledge; the near lip at z 0,
// the bridge middle at the origin, far lip z -9, river y -70. Every kind is placed at [0, 0, 0], rot 0, scale 1.
// V2 look (DESIGN-GORGE-V2.md): wall relief R(x, y) (buttresses, fins, chimneys + fine crags), 3-tone shade, dark-blue depth grade, rocky clifftop painted per
// fragment, greenery on the walls. Spec key debugCount: true logs the triangle count at build. The build throws if rock or flora touches fall corridor A or B.
// Everything is a pure function of the params and the clip time (second argument of apply); no Math.random, no wall clock.
// Hand-drawn look: ONE cel shader (sun from (-0.55, 0.45, 0.70) #ffd9a0, sky fill, three flat steps lit / half / shade, the near rim's
// shadow line on the far wall, depth haze by y, distance haze, ink lines on ledges); no texture, no canvas, no engine outline (lookOnly).
//
// SEEDING (same catch as props-firerewind.js): propState does not know lipbreak, crumble, strands, snap, sway, nearfall, hangers: until
// a tween sets one it reads spec.<name> else its default, and the FIRST tween of such a key jumps to its end value. Seed every param of
// the three with a dur-0 `set` at clip time 0 (c.prop(0, "gorge", { lipbreak: 0, crumble: 0 }, 0), c.prop(0, "rope", { strands: 3,
// snap: 0, sway: 0, nearfall: 0, hangers: 1 }, 0)).
//
//   gorge       The whole world, everything of DESIGN section 1 (ledges, both walls with beds / joints / ledges / roots / grass / pines /
//               shrubs, lip slabs, hinterland and far top with pines, ridges, river with foam, sky dome with clouds, the photo spot
//               dressing, the breaking chunk). Spec: seed 9, sky true, river true, clearing [4.0, 8.0] (x range of the far-top photo
//               clearing: flat, two 3 m pines at x 3.4 and 8.4 only when the range is the default; other ranges move the pair).
//               Params: lipbreak 0..1 (0), crumble 0..1 (0). lipbreak: clock c = p x 2.44 s, tween it linearly over 2.44 s; crack to
//               p 0.10, tip to 0.18, then free fall; pebble spray and dust from c 0.24. Never run it without bridgerope `nearfall` tweened
//               with it. crumble (clock q x 1.5 s) only acts once lipbreak is 1 (the flake at NOTCH_GRIP and 8 pebbles).
//               Solid (userData.solid): ledge tops, slabs, both walls, the chunk until p 0.10. Plants, pebbles, dust, river are not.
//               Everything is userData.steam (out of the body-in-prop checks) and lookOnly (no engine ink line, no hand shadow ray).
//   bridgerope  The bridge's keel rope and what is left: 4 posts, 2 centre stakes, the 4 dead hand ropes with their tangled planks, the
//               fray, the two hanger planks. Spec: sag 1.40, fray -4.25 (z of the fray's middle). Params: strands 3..0 (3; each step
//               tween 0.4 s linear; the top strand goes first, then the +x one, then the last), snap 0..1 (0; tween 1.0 s linear), sway
//               m -0.15..0.15 (0), nearfall 0..1 (0; the same p as gorge.lipbreak: the stake rides the chunk and drags the near half
//               off the lip after it, hidden at 1), hangers 0|1 (1; drawn while snap < 0.06).
//   planks      Six falling planks 0.9 x 0.18 x 0.04. Spec: starts (six clip times, default [-1.6, -1.1, -0.7, -0.3, 10.9, 11.0]; set
//               5 and 6 to the snap's start + 0.06), n 6. No params. Not solid. They leave from the bridgerope hanger places.
//
// Exports: GORGE (anchors, chunk outline, chunkAt(p)), BRIDGE (ropeAt(z, sway), hangers), GORGE_KINDS. All numbers are DESIGN's;
// the two places the DESIGN contradicts itself are in the NOTES of the report (corridor B vs the lower near wall, hanger x vs sway).

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const num = (v, d) => (typeof v === "number" ? v : d);
const C = (hex) => new THREE.Color(hex);
const col3 = (hex) => { const c = C(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// a paint: lit, half (default the mix of the two) and shade colours in linear space
const PT = (lit, shade, mid) => { const l = col3(lit), s = col3(shade); return { l, s, m: mid ? col3(mid) : mixc(l, s, 0.5) }; };
const FLAT = (hex) => PT(hex, hex, hex);
const Q = (h = 0, e1 = 99, e2 = 99, mode = 0) => [h, e1, e2, mode];
// shader modes (vP.w): 0 plain, 1 wall bed, 2 thin wall bed, 3 ridge (unlit, distance haze only), 5 unlit (sky, fleck), 6 ink along edge e1,
// 7 ledge top (path, hatch), 8 rope (twist)

// DESIGN-GORGE-V2 3.1: rock A is the blue-grey key; B, C, D are today's tones 50 % toward A
const lerpPT = (a, b, t) => ({ l: mixc(a.l, b.l, t), m: mixc(a.m, b.m, t), s: mixc(a.s, b.s, t) });
const TONE_A = PT("#b4bcc8", "#47536f", "#7c88a0");
const TONE = { A: TONE_A, B: lerpPT(PT("#98a3b2", "#44506a", "#707d94"), TONE_A, 0.5), C: lerpPT(PT("#b4bdc8", "#55627b", "#8996ab"), TONE_A, 0.5), D: lerpPT(PT("#8691a3", "#3b4a66", "#667592"), TONE_A, 0.5) };
const SLAB = PT("#cdb893", "#8e8088"), CRACK = FLAT("#3d3640"), FRESH = PT("#dcc9a6", "#a99a8c"), UNDER = FLAT("#2a2733");
const SLABFACE = PT("#6a6672", "#34303f", "#4c4857"), ROCKTOP = PT("#b9b4a6", "#5f5a6a", "#8f8a8c");
const GRASS = { dry: PT("#c8a64e", "#a8873f"), green: PT("#8fa257", "#6e7f47") };
const EARTH = PT("#b3a15a", "#6f6a4a"), EARTH2 = PT("#c2ad68", "#7b7050");
const PINE = { f: { l: col3("#4f7a4a"), m: col3("#2f5a3c"), s: col3("#1f3f2e") }, t: PT("#5b4636", "#3e3038") };
const ROOT = PT("#6a5240", "#5a4332", "#5a4332");
const PEB = [PT("#a59a8a", "#6f665f", "#8d8377"), PT("#8d8377", "#5c544e"), PT("#b2a797", "#7a7168")];
const CLOD = PT("#b39d82", "#7d6a55", "#a08a70");
const SHRUB = PT("#86a652", "#33604a", "#4f7a48"), SHRUBDRY = PT("#c9ab62", "#7b6a3e", "#b99a55");
const ROPE = { l: col3("#d4b382"), m: col3("#b08a5a"), s: col3("#7d5f3c") };
const WOOD = PT("#8d6b48", "#5d4838"), ENDG = PT("#a98a63", "#7a5f45"), LASH = FLAT("#3b2f28");

// ------------------------------------------------------------------------------------------------ a triangle soup with a paint per vertex
class Geo {
  constructor(capV = 3 * 2048) { this.nv = 0; this.capV = capV; this.P = new Float32Array(capV * 3); this.N = new Float32Array(capV * 3); this.L = new Float32Array(capV * 3); this.M = new Float32Array(capV * 3); this.S = new Float32Array(capV * 3); this.Q = new Float32Array(capV * 4); }
  _grow() { const cap = this.capV * 2; for (const k of ["P", "N", "L", "M", "S", "Q"]) { const a = new Float32Array(cap * (k === "Q" ? 4 : 3)); a.set(this[k]); this[k] = a; } this.capV = cap; }
  reset() { this.nv = 0; return this; }
  vert(p, n, pt, q) {
    if (this.nv >= this.capV) this._grow();
    const i = this.nv++, a = i * 3;
    this.P[a] = p[0]; this.P[a + 1] = p[1]; this.P[a + 2] = p[2]; this.N[a] = n[0]; this.N[a + 1] = n[1]; this.N[a + 2] = n[2];
    this.L[a] = pt.l[0]; this.L[a + 1] = pt.l[1]; this.L[a + 2] = pt.l[2]; this.M[a] = pt.m[0]; this.M[a + 1] = pt.m[1]; this.M[a + 2] = pt.m[2]; this.S[a] = pt.s[0]; this.S[a + 1] = pt.s[1]; this.S[a + 2] = pt.s[2];
    this.Q[i * 4] = q[0]; this.Q[i * 4 + 1] = q[1]; this.Q[i * 4 + 2] = q[2]; this.Q[i * 4 + 3] = q[3];
  }
  // flat triangle; `hint` is the outward direction (the winding and the normal follow it); pt a paint; qa.. per-corner Q arrays
  tri(a, b, c, hint, pt, qa, qb = qa, qc = qa) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-10) return;
    nx /= l; ny /= l; nz /= l;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { [b, c] = [c, b]; [qb, qc] = [qc, qb]; nx = -nx; ny = -ny; nz = -nz; }
    const n = [nx, ny, nz]; this.vert(a, n, pt, qa); this.vert(b, n, pt, qb); this.vert(c, n, pt, qc);
  }
  triN(a, b, c, na, nb, nc, pt, qa, qb = qa, qc = qa) { this.vert(a, na, pt, qa); this.vert(b, nb, pt, qb); this.vert(c, nc, pt, qc); }
  quad(a, b, c, d, hint, pt, qa, qb = qa, qc = qa, qd = qa) { this.tri(a, b, c, hint, pt, qa, qb, qc); this.tri(a, c, d, hint, pt, qa, qc, qd); }
  // a static BufferGeometry
  geometry() {
    const g = new THREE.BufferGeometry(), n = this.nv;
    g.setAttribute("position", new THREE.BufferAttribute(this.P.slice(0, n * 3), 3)); g.setAttribute("normal", new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute("aLit", new THREE.BufferAttribute(this.L.slice(0, n * 3), 3)); g.setAttribute("aMid", new THREE.BufferAttribute(this.M.slice(0, n * 3), 3)); g.setAttribute("aShade", new THREE.BufferAttribute(this.S.slice(0, n * 3), 3));
    g.setAttribute("aP", new THREE.BufferAttribute(this.Q.slice(0, n * 4), 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -30, -4.5), 400);
    return g;
  }
  // a geometry that is rewritten every frame (the rope, the planks' hanger cords): sync() after the soup is filled
  dynamic() {
    this._g = this.geometry(); for (const k of ["position", "normal", "aLit", "aMid", "aShade", "aP"]) this._g.attributes[k].setUsage(THREE.DynamicDrawUsage);
    return this._g;
  }
  sync() {
    const g = this._g, n = this.nv, map = { position: ["P", 3], normal: ["N", 3], aLit: ["L", 3], aMid: ["M", 3], aShade: ["S", 3], aP: ["Q", 4] };
    for (const [k, [f, s]] of Object.entries(map)) {
      const a = g.attributes[k];
      if (a.array.length < n * s) { g.setAttribute(k, new THREE.BufferAttribute(this[f].slice(), s)); g.attributes[k].setUsage(THREE.DynamicDrawUsage); }
      else { a.array.set(this[f].subarray(0, n * s)); a.needsUpdate = true; }
    }
    g.setDrawRange(0, n);
  }
}

// ------------------------------------------------------------------------------------------------ emitters
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// a smooth tube along `pts` (radius rad: number or array), `sides` round; the arc length and angle go into Q for the rope's twist
function tube(G, pts, rad, sides, pt, o = {}) {
  const { arc0 = 0, mode = 0, h = 0.5, capEnd = true, capStart = true } = o;
  const n = pts.length; if (n < 2) return;
  const rings = [], arcs = [0];
  for (let i = 1; i < n; i++) arcs.push(arcs[i - 1] + Math.hypot(...sub(pts[i], pts[i - 1])));
  const arcU = o.arcs || arcs;
  for (let i = 0; i < n; i++) {
    const T = nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])), ref = Math.abs(T[0]) > 0.9 ? [0, 0, 1] : [1, 0, 0];
    const Nn = nrm(sub(ref, mul(T, dot(T, ref)))), B = crs(T, Nn), r = Array.isArray(rad) ? rad[i] : rad, ring = [];
    for (let j = 0; j <= sides; j++) { const a = (j / sides) * TAU, d = add(mul(Nn, Math.cos(a)), mul(B, Math.sin(a))); ring.push({ p: add(pts[i], mul(d, r)), n: d, a: a * 0.03 }); }
    rings.push({ ring, T });
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const A = rings[i].ring[j], B = rings[i].ring[j + 1], Cc = rings[i + 1].ring[j + 1], D = rings[i + 1].ring[j];
    const q = (r, s) => Q(h, arcU[s] + arc0, r.a, mode);
    G.triN(A.p, B.p, Cc.p, A.n, B.n, Cc.n, pt, q(A, i), q(B, i), q(Cc, i + 1));
    G.triN(A.p, Cc.p, D.p, A.n, Cc.n, D.n, pt, q(A, i), q(Cc, i + 1), q(D, i + 1));
  }
  const cap = (i, sgn) => { const { ring, T } = rings[i], c = pts[i], nn = mul(T, sgn); for (let j = 0; j < sides; j++) G.triN(c, ring[j].p, ring[j + 1].p, nn, nn, nn, pt, Q(h, arcU[i] + arc0, 0, mode)); };
  if (capStart) cap(0, -1); if (capEnd) cap(n - 1, 1);
}
// a straight tapered post between two points
const post = (G, a, b, r0, r1, sides, pt, o) => tube(G, [a, b], [r0, r1], sides, pt, o);

const ICO = new Map();
function icoTris(d) {
  if (!ICO.has(d)) { const g0 = new THREE.IcosahedronGeometry(1, d), g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, out = []; for (let i = 0; i < p.length; i += 9) out.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]], [p[i + 6], p[i + 7], p[i + 8]]]); ICO.set(d, out); }
  return ICO.get(d);
}
// a faceted blob: centre, radii, turn about y
function ico(G, c, r, ry, pt, d = 0, q = Q(0.5)) {
  const co = Math.cos(ry), si = Math.sin(ry), T = (v) => { const x = v[0] * r[0], y = v[1] * r[1], z = v[2] * r[2]; return [c[0] + x * co + z * si, c[1] + y, c[2] - x * si + z * co]; };
  for (const [a, b, e] of icoTris(d)) { const A = T(a), B = T(b), E = T(e); G.tri(A, B, E, [(A[0] + B[0] + E[0]) / 3 - c[0], (A[1] + B[1] + E[1]) / 3 - c[1], (A[2] + B[2] + E[2]) / 3 - c[2]], pt, q); }
}
// a stand-alone box (centre, size, turn about y)
function boxGeo(G, c, s, ry, pt, q = Q(0.5)) {
  const co = Math.cos(ry), si = Math.sin(ry), P = (x, y, z) => [c[0] + (x * s[0]) * co + (z * s[2]) * si, c[1] + y * s[1], c[2] - (x * s[0]) * si + (z * s[2]) * co];
  const F = [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], [0, 0, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1], [0, 0, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1], [1, 0, 0]],
    [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, 0, 0]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1], [0, 1, 0]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, -1, 0]]];
  for (const f of F) { const h = [f[4][0] * co + f[4][2] * si, f[4][1], -f[4][0] * si + f[4][2] * co]; G.quad(P(...f[0].map((v, i) => v * 0.5)), P(...f[1].map((v) => v * 0.5)), P(...f[2].map((v) => v * 0.5)), P(...f[3].map((v) => v * 0.5)), h, pt, q); }
}
// a stand-alone box (centre, size) turned about y, then tilted about x and z: a loose rock block (DESIGN-GORGE-V2 2)
function tiltBox(G, c, s, ry, rx, rz, pt, q = Q(0.5)) {
  const co = Math.cos(ry), si = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
  const T = (v) => {
    let x = v[0] * s[0] * 0.5, y = v[1] * s[1] * 0.5, z = v[2] * s[2] * 0.5;
    [y, z] = [y * cx - z * sx, y * sx + z * cx]; [x, y] = [x * cz - y * sz, x * sz + y * cz];
    return [c[0] + x * co + z * si, c[1] + y, c[2] - x * si + z * co];
  };
  const F = [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]];
  for (const f of F) { const P = f.map(T), m = [0, 1, 2, 3].reduce((a, i) => add(a, P[i]), [0, 0, 0]); G.quad(P[0], P[1], P[2], P[3], sub(mul(m, 0.25), c), pt, q); }
}

// ------------------------------------------------------------------------------------------------ the cel shader
const GL = (hex) => `vec3(${col3(hex).map((v) => v.toFixed(4)).join(", ")})`;   // a linear colour literal for the shader
const GVS = `
attribute vec3 aLit; attribute vec3 aMid; attribute vec3 aShade; attribute vec4 aP;
varying vec3 vW; varying vec3 vO; varying vec3 vN; varying vec3 vLit; varying vec3 vMid; varying vec3 vShade; varying vec4 vP; varying vec3 vTint;
void main() {
  mat4 M = modelMatrix;
#ifdef USE_INSTANCING
  M = M * instanceMatrix;
#endif
  vec4 w = M * vec4(position, 1.0);
  vW = w.xyz; vO = position; vN = normalize(mat3(M) * normal);
  vLit = aLit; vMid = aMid; vShade = aShade; vP = aP;
#ifdef USE_INSTANCING_COLOR
  vTint = instanceColor;
#else
  vTint = vec3(1.0);
#endif
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GFS = `
uniform vec3 uWL, uWM, uWS; uniform vec3 uL; uniform float uSlope; uniform vec3 uHazeC; uniform vec3 uDistC; uniform vec4 uStreak[10];
varying vec3 vW; varying vec3 vO; varying vec3 vN; varying vec3 vLit; varying vec3 vMid; varying vec3 vShade; varying vec4 vP; varying vec3 vTint;
const vec3 CREVICE = ${GL("#1e2338")}, WARM = ${GL("#e9d3a4")}, SHOULDER = ${GL("#d8c79c")}, MIST = ${GL("#6f8fb5")};
const vec3 ROCKL = ${GL("#b9b4a6")}, TWARM = ${GL("#c4b596")}, TCOOL = ${GL("#a3a6a8")}, TCRACK = ${GL("#2f2b36")}, MOSS = ${GL("#7d9150")};
const vec3 EARTH1 = ${GL("#b3a15a")}, EARTH2 = ${GL("#c2ad68")}, PATHC = ${GL("#a8946c")}, RIMC = ${GL("#ddd3bd")}, SLABTOP = ${GL("#d8ceb6")};
float hs1(float n) { return fract(sin(n * 127.1 + 17.3) * 43758.5453); }
float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.003; return smoothstep(e - w, e + w, x); }
float rimJag(float x) { return (hs1(floor(x / 1.3)) - 0.5) * 0.8; }
// prof() of the wall planes, ported (DESIGN-GORGE-V2 3.2): the mean plane z by y, near and far
float profN(float y) {
  if (y >= -30.0) return 0.25; if (y >= -40.0) return mix(0.25, -0.6, (-30.0 - y) / 10.0); if (y >= -55.0) return mix(-0.6, -2.2, (-40.0 - y) / 15.0);
  if (y >= -70.0) return mix(-2.2, -3.2, (-55.0 - y) / 15.0); return -3.2;
}
float profF(float y) {
  if (y >= -30.0) return -9.25; if (y >= -40.0) return mix(-9.25, -8.4, (-30.0 - y) / 10.0); if (y >= -55.0) return mix(-8.4, -6.8, (-40.0 - y) / 15.0);
  if (y >= -70.0) return mix(-6.8, -5.8, (-55.0 - y) / 15.0); return -5.8;
}
// DESIGN-GORGE-V2 3.3: the depth grade replaces the old pale haze: dark blue deep down
float depthGrade(float y) {
  if (y >= -3.0) return 0.0; if (y > -20.0) return mix(0.0, 0.30, (-3.0 - y) / 17.0); if (y > -40.0) return mix(0.30, 0.55, (-20.0 - y) / 20.0);
  if (y > -70.0) return mix(0.55, 0.70, (-40.0 - y) / 30.0); return 0.70;
}
void main() {
  float mode = vP.w, h = vP.x;
  vec3 c;
  if (mode > 4.5 && mode < 5.5) {
    gl_FragColor = vec4(vLit * vTint, 1.0);
    #include <colorspace_fragment>
    return;
  }
  bool noGrade = mode > 3.5 && mode < 4.5;   // 4: the river's boulders, final colours
  if (mode > 2.5 && mode < 3.5) c = vLit;
  else {
    vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
    float ndl = dot(N, uL);
    bool wallM = mode > 0.5 && mode < 2.5;
    bool rockM = wallM || (mode > 5.5 && mode < 6.5) || (mode > 8.5 && mode < 9.5);   // the wall modes of the V2 shading: 1, 2, 6, 9
    if (wallM) ndl -= 0.15 * h;
    float kL = bandStep(0.35, ndl), kH = bandStep(0.0, ndl), shd = 1.0;
    if (vW.z < 0.05) { shd = bandStep(rimJag(vW.x), vW.y + (-vW.z) * uSlope); kL *= shd; kH *= shd; }
    vec3 sh = vShade, lt = vLit;
    if (mode < 0.5) sh = mix(vShade, vMid, 0.4);   // plants in shade catch some sky
    if (rockM && mode < 8.5) {
      lt = mix(vMid, vLit, 0.72);   // the sunlit face is a blue-grey with a pale edge, not paper
      // shade has three tones: the +x flank of every rib goes dark (a vertical shape), the rest is the shade tone
      float kF = bandStep(0.15, dot(N, normalize(vec3(-0.80, 0.35, 0.0))));
      sh = mix(vShade * 0.55, vShade, kF);
    }
    c = mix(mix(sh, vMid, kH), lt, kL);
    if (rockM && mode < 8.5) {
      float r = (vW.z > -4.5) ? profN(vW.y) - vW.z : vW.z - profF(vW.y);   // relief depth, + out into the gap
      c = mix(c, CREVICE, 0.85 * (1.0 - bandStep(-0.45, r)));              // chimneys and recesses are dark slots
      c = mix(c, vMid, 0.35 * bandStep(0.9, r) * (1.0 - kH));              // proud buttress fronts catch the sky
      c = mix(c, WARM, 0.20 * smoothstep(-4.0, -0.5, vW.y) * kL);          // the sun's warm tops
      c = mix(c, SHOULDER, smoothstep(0.5, 0.7, N.y) * shd * smoothstep(-8.0, -1.0, vW.y));   // shoulders and ledge tops above the rim shadow
    }
    c *= vTint;
    float lit = kH;
    if (wallM) {
      // brush hatch on a quarter of the shaded facets, lichen on a few above y -12, water streaks under ledges
      float hh = fract(h * 7.13);
      if (kH < 0.5 && hh < 0.25) {
        float a = dot(vW.xy, vec2(0.866, 0.5)), b = dot(vW.xy, vec2(-0.5, 0.866)), li = floor(b / 0.11);
        if (fract(b / 0.11) < 0.14 && fract(a / 0.25 + hs1(li)) < 0.6) c = mix(c, vec3(0.159, 0.137, 0.144), 0.5);
      }
      if (vW.y > -12.0 && fract(h * 13.7) < 0.06) {
        vec2 cell = floor(vW.xy / 0.8); vec2 cc = (cell + 0.5 + 0.35 * (vec2(hs1(cell.x * 7.0 + cell.y), hs1(cell.y * 3.0 + cell.x + 9.0)) - 0.5)) * 0.8;
        if (length(vW.xy - cc) < 0.15 + 0.25 * hs1(cell.x + cell.y * 5.0)) c = mix(c, MOSS * mix(0.45, 0.8, lit), 0.75);
      }
      for (int i = 0; i < 10; i++) {
        vec4 s = uStreak[i];
        if (abs(vW.x - s.x + 0.04 * sin(vW.y * 2.1 + s.x)) < 0.15 && vW.y < s.y && vW.y > s.y - s.z && ((vW.z > -4.6) == (s.w > 0.0))) c = mix(c, vec3(0.147, 0.112, 0.108), 0.85);
      }
      if (mode > 1.5) {
        if (vP.y < 0.04) c = mix(c, vec3(0.745, 0.597, 0.381), 0.18);
        if (vP.z < 0.04) c = mix(c, vec3(0.047, 0.036, 0.042), 0.45);
      } else if (vP.z < 0.02) c = mix(c, vec3(0.047, 0.036, 0.042), 0.85);
    } else if (mode > 5.5 && mode < 6.5) {
      if (vP.y < 0.025) c = mix(c, vec3(0.047, 0.036, 0.042), 0.5);
    } else if (mode > 8.5 && mode < 9.5) {
      // a lip slab's front face: the dark slab-face tones, the top 0.06 m a pale chipped edge, a thin ink line over it
      if (vP.y < 0.06) c = SLABTOP * mix(0.7, 1.0, kH);
      if (vP.y < 0.012) c = vec3(0.047, 0.036, 0.042);
    } else if (mode > 6.5 && mode < 7.5) {
      // a rocky clifftop, painted per fragment (DESIGN-GORGE-V2 5): jittered Voronoi slabs with cracks, moss, earth, a worn rim
      vec2 p = vO.xz * vec2(0.5, 0.7692);
      vec2 ip = floor(p); float d1 = 9.0, d2 = 9.0, id1 = 0.0, id2 = 0.0;
      for (int j = -1; j <= 1; j++) for (int i = 0; i < 3; i++) {
        vec2 n = ip + vec2(float(i - 1), float(j));
        vec2 pt = n + vec2(hs1(n.x * 17.0 + n.y * 131.0 + 3.0), hs1(n.x * 53.0 + n.y * 29.0 + 11.0));
        float d = length(p - pt), idn = hs1(n.x * 13.1 + n.y * 71.7 + 9.0);
        if (d < d1) { d2 = d1; id2 = id1; d1 = d; id1 = idn; } else if (d < d2) { d2 = d; id2 = idn; }
      }
      float lf = mix(mix(0.55, 0.8, kH), 1.0, kL);
      float tn = hs1(id1 * 91.0 + 1.0);
      vec3 tone = tn < 0.25 ? vec3(1.0) : (tn < 0.5 ? vec3(0.86) : (tn < 0.75 ? TWARM / ROCKL : TCOOL / ROCKL));
      c *= tone;
      float nearTop = vW.z > -4.5 ? 1.0 : 0.0;
      float mossP = mix(0.12, 0.45, smoothstep(2.5, 6.0, vW.z));
      if (nearTop > 0.5 && hs1(id1 * 37.0 + 5.0) < mossP) c = mix(c, MOSS * lf, 0.6);
      float earthF = nearTop > 0.5 ? smoothstep(6.0, 16.0, vW.z) : smoothstep(10.0, 18.0, -vW.z);
      c = mix(c, mix(EARTH1, EARTH2, step(0.5, hs1(id1 * 53.0 + 2.0))) * lf, earthF);
      float e = d2 - d1;
      if (hs1((id1 + id2) * 917.0 + 3.0) < 0.55) c = mix(c, TCRACK, (1.0 - smoothstep(0.010, 0.014 + fwidth(e), e)) * (1.0 - 0.6 * earthF));
      vec2 pcell = floor(vW.xz / 1.2);
      if (hs1(pcell.x * 13.0 + pcell.y * 7.0 + 3.0) < 0.15) {
        float a = dot(vW.xz, vec2(0.866, 0.5)), b = dot(vW.xz, vec2(-0.5, 0.866)), li = floor(b / 0.11);
        if (fract(b / 0.11) < 0.14 && fract(a / 0.25 + hs1(li)) < 0.6) c = mix(c, vec3(0.159, 0.137, 0.144), 0.35);
      }
      float pa = (1.0 - smoothstep(0.45, 0.75, abs(vW.x + 0.12 * sin(vW.z * 1.7)))) * smoothstep(0.35, 0.65, vW.z) * (1.0 - smoothstep(10.0, 10.6, vW.z)) * step(vW.y, 0.02) * step(-0.5, vW.y);
      c = mix(c, PATHC * lf, pa * 0.6 * vP.y);
      if (vP.z < 0.10 + 0.12 * hs1(floor(vO.x / 0.23))) c = mix(c, RIMC * lf, 0.5);   // the worn, chipped rim
    } else if (mode > 7.5 && mode < 8.5) {
      float tw = fract((vP.y + vP.z * 1.4324) / 0.09);
      if (tw < 0.13) c *= 0.55;
    }
  }
  if (!noGrade) {
    if (!(mode > 2.5 && mode < 3.5)) {
      c = mix(c, uHazeC, depthGrade(vW.y));
      c = mix(c, MIST, 0.12 * smoothstep(-25.0, -60.0, vW.y));
    }
    float gh = clamp((length(cameraPosition - vW) - 45.0) / 125.0, 0.0, 1.0) * 0.40;
    c = mix(c, uDistC, gh);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const SUN = new THREE.Vector3(-0.55, 0.45, 0.70).normalize();
function gorgeMat(streaks = []) {
  const st = Array.from({ length: 10 }, (_, i) => new THREE.Vector4(...(streaks[i] || [0, 99, 0, 1])));
  const m = new THREE.ShaderMaterial({
    uniforms: { uL: { value: SUN.clone() }, uSlope: { value: SUN.y / SUN.z }, uHazeC: { value: C("#1d2a47") }, uDistC: { value: C("#a9bdd6") }, uWL: { value: C("#d8c39a") }, uWM: { value: C("#b0a08e") }, uWS: { value: C("#8e8088") }, uStreak: { value: st } },
    vertexShader: GVS, fragmentShader: GFS, side: THREE.DoubleSide, toneMapped: false, fog: false,
  });
  m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}
// a mesh the engine leaves alone: no ink hull, no hand ray, out of the body-in-prop checks; solid says what a touch check may use
function mark(o, solid, order = 0) {
  o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.renderOrder = order;
  o.userData.lookOnly = true; o.userData.steam = true; o.userData.solid = !!solid;
  return o;
}

// ------------------------------------------------------------------------------------------------ the numbers of DESIGN section 1
const TAN3 = Math.tan(3 * RAD), PERIOD = 13.4;
// beds, top to bottom: [thickness, tone, step (+ proud into the gap), thin (a hard ledge)]
const BEDS = [[1.8, "A", 0, false], [0.6, "D", 0.12, true], [2.6, "C", -0.10, false], [0.9, "B", 0.18, true], [3.4, "A", 0, false], [0.5, "D", 0.15, true], [2.2, "C", -0.08, false], [1.4, "B", 0.10, false]];
// the wall planes by y (near, far): mean plane to y -30, then the lean of the lower gorge
const PROF = { near: [[0, 0.25], [-30, 0.25], [-40, -0.6], [-55, -2.2], [-70, -3.2]], far: [[0, -9.25], [-30, -9.25], [-40, -8.4], [-55, -6.8], [-70, -5.8]] };
function prof(near, y) {
  const K = near ? PROF.near : PROF.far;
  if (y >= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (y >= K[i][0]) { const t = (y - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return lerp(K[i - 1][1], K[i][1], t); }
  return K[K.length - 1][1];
}
const OUTLINE = [[-0.20, 0], [-0.17, 0.36], [-0.02, 0.58], [0.20, 0.64], [0.42, 0.50], [0.56, 0.36], [0.60, 0]];   // the chunk's plan (x, z), DESIGN 1.3
const CHUNK_PIVOT = [0.2, -0.45, 0.62], CHUNK_C = [0.2, -0.2, 0.3];
const NOTCH_GRIP = [0.20, -0.02, 0.62];
const DEFAULT_CLEARING = [4.0, 8.0];

// the chunk's place at lipbreak p (DESIGN 1.3): a Matrix4 for the chunk's own mesh (built at its rest place) and for the stake riding it
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
function aboutPoint(out, c, rx, rz, tx, ty, tz) {   // translate(t) * translate(c) * Rz(rz) * Rx(rx) * translate(-c)
  _e.set(rx, 0, rz, "ZXY"); _q.setFromEuler(_e);
  out.makeTranslation(c[0], c[1], c[2]).multiply(_m2.makeRotationFromQuaternion(_q)).multiply(_m1.makeTranslation(-c[0], -c[1], -c[2]));
  out.premultiply(_m1.makeTranslation(tx, ty, tz));
  return out;
}
function chunkMatrix(p, out = new THREE.Matrix4()) {
  const c = p * 2.44;
  if (p <= 0.10) return out.makeTranslation(0, -0.02 * (p / 0.10), 0);
  if (p <= 0.18) { const u = sm(0, 1, (p - 0.10) / 0.08); return aboutPoint(out, CHUNK_PIVOT, -14 * RAD * u, 0, 0, -lerp(0.02, 0.06, u), 0); }
  const T = Math.max(0, c - 0.44), tip = new THREE.Matrix4();
  aboutPoint(tip, CHUNK_PIVOT, -14 * RAD, 0, 0, -0.06, 0);
  const cc = _v.set(...CHUNK_C).applyMatrix4(tip).toArray();
  aboutPoint(out, cc, -150 * RAD * T, 40 * RAD * T, 0.15 * T, -4.9 * T * T, -0.45 * T);
  return out.multiply(tip);
}
const chunkVisible = (p) => p < 0.999;
const chunkAt = (p, point = [0, 0, 0]) => _v.set(...point).applyMatrix4(chunkMatrix(p, new THREE.Matrix4())).toArray();

// ------------------------------------------------------------------------------------------------ terrain
const nz2 = (x, z) => 0.5 * Math.sin(x * 0.71 + z * 0.93 + 1.3) + 0.3 * Math.sin(x * 1.37 - z * 0.52 + 2.1) + 0.2 * Math.sin(x * 0.23 + z * 1.9);
function nearH(x, z) {
  const dx = Math.max(0, Math.abs(x) - 9), dz = z < 0 ? 0 : Math.max(0, z - 10), w = sm(0, 3, Math.hypot(dx, dz));
  return 0.25 * nz2(x, z) * w * (z < 12 ? 1 : 1) + 7 * sm(12, 32, z);
}
function farH(x, z, clr) {
  const inClr = x > clr[0] - 0.3 && x < clr[1] + 0.3 && z > -22 && z < -9, w = inClr ? 0 : sm(0, 4, -z - 9);
  return 0.4 + 0.15 * nz2(x * 0.8, z) * w + 4.6 * sm(14, 45, -z);
}
const union = (...arrs) => [...new Set(arrs.flat().map((v) => Math.round(v * 1e5) / 1e5))].sort((a, b) => a - b);
const range = (a, b, s) => { const o = []; for (let v = a; v < b - 1e-9; v += s) o.push(v); o.push(b); return o; };
// x columns for the near lip: 0.1 m inside |x| 2, 0.5 to 8, 2 beyond
const LIPX = union(range(-150, -12, 2), range(-12, -2, 0.25), range(-2, 2, 0.1), range(2, 12, 0.25), range(12, 150, 2), [-1.17, -1.03, -0.82, -0.68, 0.98, 1.12]);
const FARX = union(range(-150, -70, 4), range(-70, -8, 1), range(-8, 8, 0.5), range(8, 70, 1), range(70, 150, 4));
const interp = (xs, zs, x) => { let lo = 0, hi = xs.length - 1; if (x <= xs[0]) return zs[0]; if (x >= xs[hi]) return zs[hi]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; } return lerp(zs[lo], zs[hi], (x - xs[lo]) / (xs[hi] - xs[lo])); };

// ------------------------------------------------------------------------------------------------ wall relief (DESIGN-GORGE-V2 1)
// R(x, y) in metres, + = out into the gap: a sum of buttresses, fins (trapezoids in x) and chimneys (V recesses), each amp(y) * shape(x) with
// shape piecewise linear at fixed breakpoints. `breaks` are those breakpoints (|x| <= BRK_X) for every bed's xs, so R is exact on every shared edge.
const BRK_X = 36, FINE_DX = 0.65, FINE_X = 20;
const HERO = {
  near: { B: [[-4.3, 1.3, 1.7, -1.4], [3.9, 1.1, 1.6, -2.0], [-8.8, 1.6, 1.8, -3.5], [8.2, 1.4, 1.5, -1.2], [0, 1.4, -0.5, -6]], F: [[-6.4, 0.5, 1.6, -5], [6.0, 0.45, 1.3, -8]], C: [[-2.3, 0.4, 1.1, -0.45, -50], [2.4, 0.35, 0.9, -3, -38]] },
  far: { B: [[-3.8, 1.5, 2.0, -2.2], [3.6, 1.2, 1.7, -4.5], [-9.5, 1.8, 2.2, -1.5], [8.9, 1.5, 1.9, -7]], F: [[-6.3, 0.5, 1.8, -3], [6.1, 0.55, 1.5, -1.0], [1.9, 0.3, 0.9, -10]], C: [[-1.9, 0.4, 1.2, -3, -45], [2.6, 0.35, 1.3, -0.05, -60], [-7.4, 0.5, 1.4, -0.05, -40]] },
};
function buildRelief(near, hz, xMax) {
  const feats = [], K0 = near ? 610 : 640, hero = near ? HERO.near : HERO.far;
  const addB = (c, hw, A, top, fl, fr, fin) => feats.push({ chim: false, fin, c, hw, A, top, bot: -1e9, bk: [c - hw, c - hw * (1 - fl), c + hw * (1 - fr), c + hw], sh: [0, 1, 1, 0], nk: K0 + 20 + feats.length });
  const addC = (c, hw, D, top, bot) => feats.push({ chim: true, fin: false, c, hw, A: D, top, bot, bk: [c - hw, c, c + hw], sh: [0, -1, 0], nk: K0 + 20 + feats.length });
  hero.B.forEach(([c, hw, A, top], i) => addB(c, hw, A, top, 0.18 + 0.27 * hz(i, K0 + 1), 0.18 + 0.27 * hz(i, K0 + 2), false));
  hero.F.forEach(([c, hw, A, top]) => addB(c, hw, A, top, 0.45, 0.45, true));
  hero.C.forEach(([c, hw, D, top, bot]) => addC(c, hw, D, top, bot));
  const kLo = (w) => Math.floor(-xMax / w) - 1, kHi = (w) => Math.ceil(xMax / w) + 1;
  for (let k = kLo(7.5); k <= kHi(7.5); k++) {   // a buttress per 7.5 m cell, p 0.8
    const c = (k + hz(k, K0 + 3)) * 7.5, h = hz(k, K0 + 5); if (Math.abs(c) <= 11 || Math.abs(c) > xMax || hz(k, K0 + 4) >= 0.8) continue;
    addB(c, 1.0 + 1.2 * hz(k, K0 + 6), near ? 0.7 + 1.1 * hz(k, K0 + 7) : 0.8 + 1.4 * hz(k, K0 + 7), -1 - 13 * h * h, 0.18 + 0.27 * hz(k, K0 + 8), 0.18 + 0.27 * hz(k, K0 + 9), false);
  }
  for (let k = kLo(11); k <= kHi(11); k++) {   // a fin per 11 m cell, p 0.5
    const c = (k + hz(k, K0 + 10)) * 11, h = hz(k, K0 + 12); if (Math.abs(c) <= 11 || Math.abs(c) > xMax || hz(k, K0 + 11) >= 0.5) continue;
    addB(c, 0.35 + 0.25 * hz(k, K0 + 13), 1.2 + 0.8 * hz(k, K0 + 14), -1 - 19 * h * h, 0.45, 0.45, true);
  }
  for (let k = kLo(4.3); k <= kHi(4.3); k++) {   // a chimney per 4.3 m cell, p 0.6
    const c = (k + hz(k, K0 + 15)) * 4.3; if (Math.abs(c) <= 11 || Math.abs(c) > xMax || hz(k, K0 + 16) >= 0.6) continue;
    addC(c, 0.3 + 0.3 * hz(k, K0 + 17), 0.6 + 0.8 * hz(k, K0 + 18), -0.45 - 9.55 * hz(k, K0 + 19), -25 - 40 * hz(k, K0 + 20));
  }
  const vn = (t, k) => { const i = Math.floor(t); return lerp(hz(i, k), hz(i + 1, k), t - i); };
  const cap = (ax) => (near ? 1.8 * clamp((ax - 1.5) / 1.1) : 1.2 + 1.0 * clamp((ax - 2.2) / 1.0));
  const R = (x, y) => {
    let r = 0;
    for (const f of feats) {
      const bk = f.bk, n = bk.length - 1;
      if (x <= bk[0] || x >= bk[n] || y >= f.top || y <= f.bot) continue;
      let i = 0; while (i < n - 1 && x >= bk[i + 1]) i++;
      const sh = lerp(f.sh[i], f.sh[i + 1], (x - bk[i]) / (bk[i + 1] - bk[i]));
      r += f.chim ? f.A * clamp((f.top - y) / 1.5) * clamp((y - f.bot) / 3) * sh : f.A * clamp((f.top - y) / 1.2) * (0.8 + 0.4 * vn(y / 7 + f.c, f.nk)) * sh;
    }
    const ax = Math.abs(x);
    if (ax <= FINE_X) {   // fine crags: a value noise in x (a breakpoint every FINE_DX m) by y (rows of 2 m), -0.5..0.5 m, so the big ribs are not smooth columns
      const u = x / FINE_DX, i = Math.floor(u), v = y / 2.0, j = Math.floor(v), fy = v - j;
      const nz = (ii) => lerp(hz(ii + j * 131, K0 + 30), hz(ii + (j + 1) * 131, K0 + 30), fy);
      r += 0.5 * (lerp(nz(i), nz(i + 1), u - i) - 0.5) * sm(-0.8, -2.4, y) * 2;
    }
    r = clamp(r, -1.5, cap(ax));
    const wb = (1 - sm(1.6, 2.2, ax)) * (1 - sm(-6, -8, y));   // both walls, |x| <= 1.6 and y > -6: R in [-0.15, 0] (flat behind the bridge and the notch)
    if (wb > 0) r = lerp(r, clamp(r, -0.15, 0), wb);
    if (r > 0) r *= 1 - 0.85 * sm(-40, -70, y);   // the gorge narrows toward the river: the proud relief fades out so the two walls never meet
    return r;
  };
  const breaks = new Set([1.5, 1.6, near ? 2.6 : 2.2, near ? 2.6 : 3.2].flatMap((v) => [v, -v]));
  for (const f of feats) for (const x of f.bk) if (Math.abs(x) <= BRK_X) breaks.add(Math.round(x * 1e5) / 1e5);
  for (let i = Math.ceil(-FINE_X / FINE_DX); i * FINE_DX <= FINE_X; i++) breaks.add(Math.round(i * FINE_DX * 1e5) / 1e5);
  const shoulders = feats.filter((f) => !f.chim && f.A > 0 && Math.abs(f.c) <= 30).map((f) => ({ c: f.c, top: f.top, hw: f.hw, fin: f.fin }));
  return { R, breaks: [...breaks].sort((a, b) => a - b), shoulders, feats };
}

// ------------------------------------------------------------------------------------------------ a wall (DESIGN 1.1, 1.2)
function buildWall(G, near, hz) {
  const side = near ? 1 : -1, off = near ? 0 : 0.7, xMax = near ? 120 : 70, yTopW = near ? -0.45 : -0.05, yBotW = -70, hint = [0, 0, -side];
  const relief = buildRelief(near, hz, xMax), R = relief.R;
  const J = []; { let x = -xMax - 3, k = 0; while (x < xMax + 3) { J.push({ x, yc: -hz(k, 41 + side) * 60, h: 2 + 7 * hz(k, 42 + side), w: 0.03 + 0.05 * hz(k, 43 + side) }); x += 1.6 + 2.2 * hz(k, 44 + side); k++; } }
  const beds = []; let o = 0, bi = 0;
  for (let c = -1; c <= 6; c++) {
    let cum = 0;
    for (let j = 0; j < 8; j++) {
      const [th, tone, step, thin] = BEDS[j], top = -(off + c * PERIOD + cum), n = th > 2.0 ? Math.ceil(th / 1.8) : 1; cum += th;
      for (let m = 0; m < n; m++) {
        const yT = top - (m * th) / n, yB = top - ((m + 1) * th) / n;
        if (yB - TAN3 * xMax - 0.1 > yTopW || yT + TAN3 * xMax + 0.1 < yBotW) continue;
        beds.push({ yT, yB, tone, step: step + (n > 1 ? (m % 2) * 0.05 : 0), thin, bi: bi++, o, xs: null, j, c });
      }
      if (thin) { o += (hz(bi, 50 + side) > 0.5 ? 1 : -1) * (0.1 + 0.2 * hz(bi, 51)); if (Math.abs(o) > 0.7) o = -o * 0.5; }
    }
  }
  for (const b of beds) {
    const xs = [{ x: -xMax, dz: 0, w: 0, k: -1 }], lo = b.yT > yTopW - 1.2 ? 0 : -0.06, mid = (b.yT + b.yB) / 2;
    J.forEach((jt, k) => {
      const x = jt.x + b.o; if (x <= -xMax + 0.05 || x >= xMax - 0.05) return;
      xs.push({ x, dz: lo + (0.10 - lo) * hz(k + b.bi * 53, 77), w: Math.abs(mid - jt.yc) < jt.h / 2 ? jt.w : 0, k });
    });
    xs.push({ x: xMax, dz: 0, w: 0, k: -2 }); xs[0].dz = lo + (0.10 - lo) * hz(b.bi, 78); xs[xs.length - 1].dz = lo + (0.10 - lo) * hz(b.bi, 79);
    // the relief's breakpoints go into every bed's xs (dz interpolated, no joint): R is then exact on every shared edge
    const add = [];
    for (const x of relief.breaks) {
      if (x <= -xMax + 0.05 || x >= xMax - 0.05) continue;
      let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m].x <= x) lo = m; else hi = m; }
      add.push({ x, dz: lerp(xs[lo].dz, xs[hi].dz, (x - xs[lo].x) / (xs[hi].x - xs[lo].x)), w: 0, k: -3 });
    }
    b.xs = xs.concat(add).sort((p, q) => p.x - q.x);
  }
  const clampB = (z, x, y) => (near && y < -0.4 && y > -41 ? z + (1 - sm(1.5, 2.4, Math.abs(x))) * Math.max(0, -0.10 - z) : z);
  const zIn = (b, x, y) => {
    const xs = b.xs; let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m].x <= x) lo = m; else hi = m; }
    const a = xs[lo], c = xs[hi], t = clamp((x - a.x) / (c.x - a.x)), dz = lerp(a.dz, c.dz, t);
    return clampB(prof(near, y) - side * (R(x, y) + b.step * 0.5 - dz), x, y);
  };
  const findBed = (x, y) => { const yy = y + TAN3 * x; let best = beds[0], bd = 1e9; for (const b of beds) { if (b.yT >= yy && yy > b.yB) return b; const d = Math.min(Math.abs(b.yT - yy), Math.abs(b.yB - yy)); if (d < bd) { bd = d; best = b; } } return best; };
  const zAt = (x, y) => zIn(findBed(x, y), x, y);
  const yT = (b, x) => clamp(b.yT - TAN3 * x, yBotW, yTopW), yB = (b, x) => clamp(b.yB - TAN3 * x, yBotW, yTopW);
  const Pn = (b, x, y) => [x, y, zIn(b, x, y)];
  for (const b of beds) {
    const tone = TONE[b.tone], mode = b.thin ? 2 : 1, xs = b.xs;
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], c = xs[i + 1], xa = a.x + (a.w ? a.w / 2 : 0), xb = c.x - (c.w ? c.w / 2 : 0);
      if (xb - xa < 0.01) continue;
      const ta = yT(b, xa), ba = yB(b, xa), tb = yT(b, xb), bb = yB(b, xb);
      if (ta - ba < 1e-3 && tb - bb < 1e-3) continue;
      const h = hz(i * 13 + b.bi * 7.7 + side, 11);
      // rows: one where the wall is flat, else one per ~0.75 m so the relief's shoulders and ramps have vertices
      let m = 1; const hh = Math.max(ta - ba, tb - bb);
      if (hh > 0.8 && [R(xa, ta), R(xa, ba), R(xb, tb), R(xb, bb), R(xa, (ta + ba) / 2), R(xb, (tb + bb) / 2)].some((v) => Math.abs(v) > 1e-4)) m = Math.ceil(hh / 0.75);
      for (let j = 0; j < m; j++) {
        const y0a = lerp(ta, ba, j / m), y1a = lerp(ta, ba, (j + 1) / m), y0b = lerp(tb, bb, j / m), y1b = lerp(tb, bb, (j + 1) / m);
        G.quad(Pn(b, xa, y0a), Pn(b, xb, y0b), Pn(b, xb, y1b), Pn(b, xa, y1a), hint, tone, Q(h, ta - y0a, y0a - ba, mode), Q(h, tb - y0b, y0b - bb, mode), Q(h, tb - y1b, y1b - bb, mode), Q(h, ta - y1a, y1a - ba, mode));
      }
      if (i > 0 && a.w) {   // the joint's crack: a dark flat strip between the blocks
        const xl = a.x - a.w / 2, xr = a.x + a.w / 2, tl = yT(b, xl), bl = yB(b, xl), tr = yT(b, xr), br = yB(b, xr);
        G.quad(Pn(b, xl, tl), Pn(b, xr, tr), Pn(b, xr, br), Pn(b, xl, bl), hint, CRACK, Q(0.5));
      }
    }
  }
  // the horizontal faces between neighbouring beds (ledge tops and undersides, with an ink line on the proud edge)
  for (let n = 0; n < beds.length - 1; n++) {
    const b = beds[n], b2 = beds[n + 1], xs = union(b.xs.map((e) => e.x), b2.xs.map((e) => e.x));
    const yb = (x) => b.yB - TAN3 * x, ok = (x) => yb(x) < yTopW - 1e-3 && yb(x) > yBotW + 1e-3;
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1]; if (!ok(x0) || !ok(x1)) continue;
      const zU0 = zIn(b, x0, yb(x0)), zU1 = zIn(b, x1, yb(x1)), zL0 = zIn(b2, x0, yb(x0)), zL1 = zIn(b2, x1, yb(x1));
      if (Math.abs(zU0 - zL0) < 0.002 && Math.abs(zU1 - zL1) < 0.002) continue;
      const lowerProud = near ? zL0 + zL1 < zU0 + zU1 : zL0 + zL1 > zU0 + zU1, w0 = Math.abs(zU0 - zL0), w1 = Math.abs(zU1 - zL1);
      const lm = Math.max(w0, w1) < 0.10 ? 1 : 6;   // a thin ledge is plain wall (no ink line, no sunlit top): the strata stay a faint second read
      G.quad([x0, yb(x0), zU0], [x1, yb(x1), zU1], [x1, yb(x1), zL1], [x0, yb(x0), zL0], [0, lowerProud ? 1 : -1, 0], lowerProud ? TONE[b2.tone] : TONE[b.tone],
        Q(0.5, lowerProud ? w0 : 0, 0, lm), Q(0.5, lowerProud ? w1 : 0, 0, lm), Q(0.5, lowerProud ? 0 : w1, 0, lm), Q(0.5, lowerProud ? 0 : w0, 0, lm));
    }
  }
  // a dark backing sheet well inside the rock: nothing seen through a seam
  const bz = (y) => prof(near, y) + side * 3.2, ys = [yTopW, -30, -40, -55, -70];
  for (let i = 0; i < ys.length - 1; i++) G.quad([-xMax, ys[i], bz(ys[i])], [xMax, ys[i], bz(ys[i])], [xMax, ys[i + 1], bz(ys[i + 1])], [-xMax, ys[i + 1], bz(ys[i + 1])], hint, TONE.D, Q(0.5));
  return { near, side, beds, zAt, findBed, zIn, xMax, yTopW, yT, yB, R, shoulders: relief.shoulders };
}

// the lip slab of a wall (0.45 thick, overhanging) along the lip polyline lip [[x, z]]; `skip` leaves out [x0, x1] (the chunk takes it)
function buildSlab(G, wall, lip, skip) {
  const near = wall.near, topY = near ? 0 : 0.4, botY = topY - 0.45, hint = [0, 0, near ? -1 : 1], xm = wall.xMax;
  const xs = union(lip.map((p) => p[0]).filter((x) => Math.abs(x) <= xm));
  const lx = lip.map((p) => p[0]), lz = lip.map((p) => p[1]), zl = (x) => interp(lx, lz, x);
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1]; if (skip && x0 >= skip[0] - 1e-6 && x1 <= skip[1] + 1e-6) continue;
    G.quad([x0, topY, zl(x0)], [x1, topY, zl(x1)], [x1, botY, zl(x1)], [x0, botY, zl(x0)], hint, SLABFACE, Q(0.5, 0, 0, 9), Q(0.5, 0, 0, 9), Q(0.5, 0.45, 0, 9), Q(0.5, 0.45, 0, 9));
    // the underside: from the lip back to 1.8 m behind the wall plane (a recess below the slab stays closed, DESIGN-GORGE-V2 1)
    const zb = (x) => wall.zAt(x, botY - 0.001) + wall.side * 1.8;
    G.quad([x0, botY, zl(x0)], [x1, botY, zl(x1)], [x1, botY, zb(x1)], [x0, botY, zb(x0)], [0, -1, 0], UNDER, Q(0.5));
  }
}

// ------------------------------------------------------------------------------------------------ plants and small things
const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };

// a tuft of dry grass: n blades, a flat triangle each
function tuft(G, x, y, z, hgt, k, pt, nb = 9) {
  for (let b = 0; b < nb; b++) {
    const ang = hs(k, b) * TAU, r0 = 0.035 * hs(k, b + 30), bx = x + Math.cos(ang) * r0, bz = z + Math.sin(ang) * r0, h = hgt * (0.6 + 0.4 * hs(k, b + 60)), lean = (0.4 + 0.6 * hs(k, b + 90)) * h * 0.45, w = 0.008 + 0.006 * hs(k, b + 120);
    const wa = hs(k, b + 150) * TAU, px = Math.cos(wa) * w, pz = Math.sin(wa) * w;
    const p = hs(k, 7) < 0.1 && b % 3 === 0 ? GRASS.green : pt;
    G.tri([bx - px, y, bz - pz], [bx + px, y, bz + pz], [bx + Math.cos(ang) * lean, y + h, bz + Math.sin(ang) * lean], null, p, Q(hs(k, b)));
  }
}
function pebble(G, x, y, z, size, k, pt) { ico(G, [x, y + size * 0.2, z], [size / 2, size * 0.32, size / 2 * (0.8 + 0.4 * hs(k, 2))], hs(k, 3) * TAU, pt ?? PEB[Math.floor(hs(k, 1) * 3) % 3], 0, Q(hs(k, 4))); }

// a Ghibli pine: a trunk, 5..7 drooping tiers each one flat shape with a scalloped lower edge. o.out: a horizontal unit (the lean of a clinging pine)
function pine(G, x, y, z, H, k, o = {}) {
  const n = 5 + Math.floor(hs(k, 1) * 3), crown = 0.16 * H, Rb = (o.rad ?? 0.27) * H, ang0 = hs(k, 2) * TAU;
  let cx = x, cz = z, cy = y;
  if (o.out) {
    const k35 = 0.5, s35 = Math.sin(35 * RAD), c35 = Math.cos(35 * RAD), m = [x + o.out[0] * s35 * k35, y + c35 * k35, z + o.out[2] * s35 * k35];
    tube(G, [[x, y, z], m, [m[0], m[1] + 0.9 * H, m[2]]], [0.045 * Math.min(1, H / 2), 0.04 * Math.min(1, H / 2), 0.012 * H], 5, PINE.t, { h: hs(k, 3) });
    ico(G, [x, y, z], [0.12, 0.1, 0.12], 0, PINE.t, 0, Q(hs(k, 4)));   // the root knot
    cx = m[0]; cz = m[2]; cy = m[1];
  } else post(G, [x, y, z], [x, y + 0.9 * H, z], 0.04 * H, 0.012 * H, 5, PINE.t, { h: hs(k, 3) });
  const baseY = o.out ? cy - 0.5 * Math.cos(35 * RAD) + 0.0 : y;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), apex = baseY + crown + ((i + 1) / n) * (H - crown) + 0.04 * H, tierH = ((H - crown) / n) * 1.9, R = Rb * (1 - 0.82 * u), rim = apex - tierH;
    const pts = [], M = 8, a0 = ang0 + i * 0.7;
    for (let j = 0; j < 2 * M; j++) { const a = a0 + (j * TAU) / (2 * M), even = j % 2 === 0, r = R * (even ? 1 : 0.72) * (0.92 + 0.16 * hs(k, 10 + i * 17 + j)); pts.push([cx + Math.cos(a) * r, rim - (even ? 0.09 * R : -0.02 * R), cz + Math.sin(a) * r]); }
    const ap = [cx, apex, cz];
    for (let j = 0; j < 2 * M; j++) G.tri(ap, pts[j], pts[(j + 1) % (2 * M)], null, PINE.f, Q(hs(k, i * 5 + j)));
  }
}
const shrub = (G, x, y, z, r, k, dry) => ico(G, [x, y + r * 0.55, z], [r, r * 0.7, r], hs(k, 1) * TAU, dry ? SHRUBDRY : SHRUB, 1, Q(hs(k, 2)));
// a root: a thin flattened rope down the wall
function rootAt(G, W, x, y0, len, k) {
  const pts = []; for (let i = 0; i <= 4; i++) { const y = y0 - (len * i) / 4, wob = 0.05 * Math.sin(i * 1.7 + k * 3.1); pts.push([x + wob, y, W.zAt(x + wob, y) - W.side * 0.05]); }
  tube(G, pts, [0.03, 0.026, 0.022, 0.018, 0.012], 4, ROOT, { h: hs(k, 5) });
}
// a ledge off a wall: a shelf `depth` deep, 0.12 thick, `width` wide at (x, y); returns the shelf's middle (x, y, z)
function shelf(G, W, x, y, depth, width) {
  const zw = W.zAt(x, y), bed = W.findBed(x, y), tone = TONE[bed.tone], s = W.side;
  let zf = zw - s * depth; if (W.near && Math.abs(x) < 1.5) zf = Math.max(zf, -0.12);
  const zb = zw + s * 0.12, hw = width / 2, t = 0.12, hint = [0, 0, -s];
  G.quad([x - hw, y, zb], [x + hw, y, zb], [x + hw, y, zf], [x - hw, y, zf], [0, 1, 0], tone, Q(0.5, 0.2, 0, 6), Q(0.5, 0.2, 0, 6), Q(0.5, 0, 0, 6), Q(0.5, 0, 0, 6));
  G.quad([x - hw, y, zf], [x + hw, y, zf], [x + hw, y - t, zf], [x - hw, y - t, zf], hint, tone, Q(0.5, 0, 0, 6), Q(0.5, 0, 0, 6), Q(0.5, t, 0, 6), Q(0.5, t, 0, 6));
  G.quad([x - hw, y - t, zb], [x + hw, y - t, zb], [x + hw, y - t, zf], [x - hw, y - t, zf], [0, -1, 0], tone, Q(0.5));
  for (const sx of [-1, 1]) G.quad([x + sx * hw, y, zb], [x + sx * hw, y, zf], [x + sx * hw, y - t, zf], [x + sx * hw, y - t, zb], [sx, 0, 0], tone, Q(0.5));
  return [x, y, (zb + zf) / 2 - s * 0.0];
}

// ------------------------------------------------------------------------------------------------ the gorge
function buildGorge(spec) {
  const S = spec.seed ?? 9, clr = Array.isArray(spec.clearing) ? spec.clearing : DEFAULT_CLEARING;
  const hz = (i, k = 0) => hs(i + S * 17.13, k);
  const rock = new Geo(1 << 18), flora = new Geo(1 << 17), decal = new Geo(1 << 13), back = new Geo(1 << 14), chunkG = new Geo(1 << 12);

  // ---- the lips
  const NOTCH = [[-1.1, 0.12], [-0.75, 0.15], [1.05, 0.10]];
  const vnx = (t, k) => { const i = Math.floor(t); return lerp(hz(i, k), hz(i + 1, k), t - i); };
  // DESIGN-GORGE-V2 2: the lips are jagged outside the stage (|x| > 1.5): out to -0.6 / in to +0.2 on the near lip, -9.2..-8.4 on the far one
  const jag = (x) => (0.6 * vnx(x / 2.3, 11) + 0.25 * vnx(x / 0.7, 12)) / 0.85;
  const lipAmp = (x) => (Math.abs(x) > 120 ? 0 : Math.abs(x) <= 1.5 ? 0.06 : 0.03);
  const lipN = LIPX.map((x) => {
    const ax = Math.abs(x); let z;
    if (ax <= 1.5 || ax > 120) z = (hz(Math.round(x * 10), 5) * 2 - 1) * lipAmp(x);
    else z = lerp(-0.6, 0.2, jag(x)) * lerp(0.12, 1, sm(1.5, 4, ax));
    for (const [nx, d] of NOTCH) if (Math.abs(x - nx) <= 0.0701) z += d;
    return [x, z];
  });
  const farN = FARX.map((x) => { const ax = Math.abs(x); return [x, ax <= 2 ? -9 + (hz(Math.round(x * 2), 6) * 2 - 1) * 0.08 : ax > 70 ? -9 : -9 + (lerp(-9.2, -8.4, jag(x + 40)) + 9) * sm(2, 3.5, ax)]; });
  const lx = lipN.map((p) => p[0]), lz = lipN.map((p) => p[1]), lipZ = (x) => interp(lx, lz, x);
  const fx = farN.map((p) => p[0]), fz = farN.map((p) => p[1]), farLipZ = (x) => interp(fx, fz, x);

  // ---- the walls
  const nearW = buildWall(rock, true, hz), farW = buildWall(rock, false, hz);
  buildSlab(rock, nearW, lipN, [-0.2, 0.6]); buildSlab(rock, farW, farN, null);
  const streaks = [];
  for (const W of [nearW, farW]) {
    const thin = W.beds.filter((b) => b.thin && b.yB > -36);
    for (let i = 0; i < 5; i++) { const b = thin[Math.floor(hz(i * 5 + W.side, 61) * thin.length)], x = (hz(i, 62 + W.side) - 0.5) * 15; streaks.push([x, b.yB - TAN3 * x - 0.05, 3 + 4 * hz(i, 63 + W.side), W.side]); }
  }

  // ---- the chunk, the notch, the crack: one jagged outline for all three
  const arcPts = []; {
    const a0 = [-0.2, lipZ(-0.2)], a1 = [0.6, lipZ(0.6)], pts = [a0, ...OUTLINE.slice(1, 6), a1];
    for (let i = 0; i < pts.length - 1; i++) { arcPts.push(pts[i]); const m = [(pts[i][0] + pts[i + 1][0]) / 2 + (hz(i, 81) - 0.5) * 0.04, (pts[i][1] + pts[i + 1][1]) / 2 + (hz(i, 82) - 0.35) * 0.07]; arcPts.push(m); }
    arcPts.push(a1);
  }
  const frontPts = lipN.filter((p) => p[0] > -0.2 + 1e-6 && p[0] < 0.6 - 1e-6).reverse();   // from x 0.6 back to -0.2, the chunk's front edge on the lip
  const chunkPoly = [...arcPts, ...frontPts];
  const tris2 = (poly) => THREE.ShapeUtils.triangulateShape(poly.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const yb = (z) => -(0.30 + 0.15 * clamp(z / 0.64));
  const cen = [0.2, 0.3];
  const rd = (x, z) => clamp(z - lipZ(x));   // depth behind the lip, for the worn rim of the shader (mode 7, vP.z)
  {
    for (const f of tris2(chunkPoly)) {
      const [a, b, c] = f.map((i) => chunkPoly[i]);
      chunkG.tri([a[0], 0, a[1]], [b[0], 0, b[1]], [c[0], 0, c[1]], [0, 1, 0], ROCKTOP, Q(0.5, 1, rd(a[0], a[1]), 7), Q(0.5, 1, rd(b[0], b[1]), 7), Q(0.5, 1, rd(c[0], c[1]), 7));
      chunkG.tri([a[0], yb(a[1]), a[1]], [b[0], yb(b[1]), b[1]], [c[0], yb(c[1]), c[1]], [0, -1, 0], UNDER, Q(0.5));
    }
    for (let i = 0; i < chunkPoly.length; i++) {
      const a = chunkPoly[i], b = chunkPoly[(i + 1) % chunkPoly.length], isFront = i >= arcPts.length - 1 && i < chunkPoly.length;   // the arc ends at index arcPts.length-1 (the point a1)
      const mx = (a[0] + b[0]) / 2 - cen[0], mz = (a[1] + b[1]) / 2 - cen[1], hn = [mx, 0, mz];
      chunkG.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], yb(b[1]), b[1]], [a[0], yb(a[1]), a[1]], hn, isFront ? SLABFACE : FRESH, Q(0.5, 0, 0, isFront ? 9 : 0), Q(0.5, 0, 0, isFront ? 9 : 0), Q(0.5, 0.3, 0, isFront ? 9 : 0), Q(0.5, 0.3, 0, isFront ? 9 : 0));
    }
    // the notch the chunk leaves: a pale slope from the jagged outline (y 0) down to the wall (y -0.5), and its two end caps
    const bot = arcPts.map((p) => [p[0], -0.5, nearW.zAt(p[0], -0.5)]);
    for (let i = 0; i < arcPts.length - 1; i++) {
      const a = arcPts[i], b = arcPts[i + 1];
      rock.quad([a[0], 0, a[1]], [b[0], 0, b[1]], bot[i + 1], bot[i], [0, 1, -0.5], FRESH, Q(0.5));
    }
    for (const [i, hx] of [[0, 1], [arcPts.length - 1, -1]]) {
      const x = arcPts[i][0], zl = arcPts[i][1], zw = bot[i][2];
      rock.quad([x, 0, zl], [x, -0.45, zl], [x, -0.45, zw], [x, -0.5, zw], [hx, 0, 0], FRESH, Q(0.5));
    }
  }

  // ---- the near ledge top: a grid with the lip's jag, the chunk's patch cut out and filled by its own triangulation
  const RZ = [0.35, 0.8, 1.2, 2, 3.5, 5.5, 8, 10, 12, 16, 20, 25, 32, 38, 45];
  for (let i = 0; i < lipN.length - 1; i++) {
    const x0 = lipN[i][0], x1 = lipN[i + 1][0];
    for (let r = 0; r < RZ.length; r++) {
      if (r < 3 && x0 >= -1.6 - 1e-6 && x1 <= 1.6 + 1e-6) continue;   // the patch
      const z00 = r === 0 ? lipN[i][1] : RZ[r - 1], z10 = r === 0 ? lipN[i + 1][1] : RZ[r - 1], z0 = RZ[r];
      const a = [x0, nearH(x0, z00), z00], b = [x1, nearH(x1, z10), z10], c = [x1, nearH(x1, z0), z0], d = [x0, nearH(x0, z0), z0];
      rock.quad(a, b, c, d, [0, 1, 0], ROCKTOP, Q(0.5, 1, rd(a[0], a[2]), 7), Q(0.5, 1, rd(b[0], b[2]), 7), Q(0.5, 1, rd(c[0], c[2]), 7), Q(0.5, 1, rd(d[0], d[2]), 7));
    }
  }
  {   // the patch: x -1.6..1.6, z lip..1.2, minus the chunk's outline
    const patch = []; for (const p of lipN) if (p[0] >= -1.6 - 1e-6 && p[0] <= -0.2 + 1e-6) patch.push(p);
    for (let i = 1; i < arcPts.length - 1; i++) patch.push(arcPts[i]);
    for (const p of lipN) if (p[0] >= 0.6 - 1e-6 && p[0] <= 1.6 + 1e-6) patch.push(p);
    patch.push([1.6, 0.35], [1.6, 0.8], [1.6, 1.2], [-1.6, 1.2], [-1.6, 0.8], [-1.6, 0.35]);
    for (const f of tris2(patch)) { const [a, b, c] = f.map((i) => patch[i]); rock.tri([a[0], 0, a[1]], [b[0], 0, b[1]], [c[0], 0, c[1]], [0, 1, 0], ROCKTOP, Q(0.5, 1, rd(a[0], a[1]), 7), Q(0.5, 1, rd(b[0], b[1]), 7), Q(0.5, 1, rd(c[0], c[1]), 7)); }
  }
  // ---- the far top
  const FRZ = [-9.6, -10.5, -12, -14, -17, -20, -25, -30, -37, -45];
  for (let i = 0; i < farN.length - 1; i++) {
    const x0 = farN[i][0], x1 = farN[i + 1][0];
    for (let r = 0; r < FRZ.length; r++) {
      const z00 = r === 0 ? farN[i][1] : FRZ[r - 1], z10 = r === 0 ? farN[i + 1][1] : FRZ[r - 1], z0 = FRZ[r], zc = (z00 + z0) / 2, h = hz(i * 29 + r, 92);
      const a = [x0, farH(x0, z00, clr), z00], b = [x1, farH(x1, z10, clr), z10], c = [x1, farH(x1, z0, clr), z0], d = [x0, farH(x0, z0, clr), z0];
      rock.quad(a, b, c, d, [0, 1, 0], ROCKTOP, Q(0.5, 1, 1, 7));
    }
  }
  // ---- the spurs that close the gorge: far wall at x +-70 (out to z -3.5), near wall at +-120 (out to z -6)
  for (const sx of [-1, 1]) {
    for (const [W, xs, zEnd] of [[farW, 70, -3.5], [nearW, 120, -6]]) {
      const X = sx * xs, side = W.side;
      for (const b of W.beds) {
        const t = W.yT(b, X), bt = W.yB(b, X); if (t - bt < 1e-3) continue;
        const za = (y) => prof(W.near, y) + side * 0.3, tone = TONE[b.tone];
        rock.quad([X, t, za(t)], [X, t, zEnd], [X, bt, zEnd], [X, bt, za(bt)], [-sx, 0, 0], tone, Q(0.5, t - bt, 0, 6), Q(0.5, t - bt, 0, 6), Q(0.5, 0, 0, 6), Q(0.5, 0, 0, 6));
      }
      const top = W.near ? 0 : 0.4, zs = W.near ? 0 : -9, X2 = sx * 150;
      rock.quad([X, top, zs], [X2, top, zs], [X2, top, zEnd], [X, top, zEnd], [0, 1, 0], ROCKTOP, Q(0.5, 1, 1, 7));
    }
  }

  // ---- decals on the near top: joints, the lip's two cracks, grass mats (those inside the chunk's outline ride it)
  const dec = (x0, z0, x1, z1, w, pt, y = 0.003) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.25)), nx = (-(z1 - z0) / L) * w / 2, nzz = ((x1 - x0) / L) * w / 2;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, ax = lerp(x0, x1, u0), az = lerp(z0, z1, u0), bx = lerp(x0, x1, u1), bz = lerp(z0, z1, u1), G = inPoly([(ax + bx) / 2, (az + bz) / 2], chunkPoly) ? chunkG : decal;
      G.quad([ax - nx, y, az - nzz], [ax + nx, y, az + nzz], [bx + nx, y, bz + nzz], [bx - nx, y, bz - nzz], [0, 1, 0], pt, Q(0.5));
    }
  };
  {   // the lip's two cracks (the straight joint decals are gone: the top is painted per fragment)
    for (const zc of [0.35, 0.80]) { let xx = -1.5, k = 0; while (xx < 1.5) { const len = 0.25 + 0.35 * hz(k + zc * 10, 99); dec(xx, zc + (hz(k, 100) - 0.5) * 0.02, Math.min(1.5, xx + len), zc + (hz(k + 1, 100) - 0.5) * 0.02, 0.02, CRACK); xx += len + 0.1 + 0.2 * hz(k, 101); k++; } } }
  for (let k = 0; k < 6; k++) {   // painted grass mats 0.8..1.6 m
    const mx = (hz(k, 102) - 0.5) * 14, mz = 2 + 7 * hz(k, 103), w = 0.8 + 0.8 * hz(k, 104); if (Math.abs(mx) < 1.0) continue;
    const pts = []; for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU, r = w / 2 * (0.8 + 0.4 * hz(k * 10 + j, 105)); pts.push([mx + Math.cos(a) * r * 1.3, mz + Math.sin(a) * r * 0.8]); }
    for (let j = 0; j < 10; j++) decal.tri([mx, 0.004, mz], [pts[j][0], 0.004, pts[j][1]], [pts[(j + 1) % 10][0], 0.004, pts[(j + 1) % 10][1]], [0, 1, 0], FLAT("#b99a4d"), Q(0.5));
  }

  // ---- plants on the ledges: dry tufts, pebbles (the near lip's 60, the photo's 8; the lip's four rollers are the chunk's own), the far top's tufts and junipers
  const spud = [];
  for (let k = 0; k < 70; k++) {
    const x = (hz(k, 110) - 0.5) * 16, z = 0.7 + 9.3 * hz(k, 111); if ((Math.abs(x) < 0.6 && z > 0.5) || (Math.abs(x) < 1.5 && z < 1.2)) continue;
    const ph = x > 3.5 && x < 8.5 && z > 1.5 ? 0.12 + 0.03 * hz(k, 112) : 0.12 + 0.13 * hz(k, 112);
    tuft(flora, x, 0, z, ph, k, hz(k, 113) > 0.5 ? GRASS.dry : lerpPT(GRASS.dry, GRASS.green, 0.0));
  }
  for (let k = 0; k < 14; k++) tuft(flora, 3.5 + 5 * hz(k, 114), 0, 0.3 + 1.0 * hz(k, 115), 0.12 + 0.13 * hz(k, 116), 200 + k, GRASS.dry);
  for (let k = 0; k < 60; k++) { const x = (hz(k, 117) > 0.5 ? 1 : -1) * (8 + 32 * hz(k, 118)), z = 0.3 + 11 * hz(k, 119); tuft(flora, x, nearH(x, z), z, 0.15 + 0.15 * hz(k, 120), 300 + k, GRASS.dry); }
  for (let k = 0; k < 60; k++) {
    const x = (hz(k, 121) - 0.5) * 6, near = k < 40, z = near ? 0.05 + 0.95 * hz(k, 122) : 1 + 2 * hz(k, 122), s = 0.02 + 0.04 * hz(k, 123);
    if (Math.abs(x) < 0.0 || z < 0.0) continue;
    const zl = lipZ(x); if (z < zl + s * 0.5) continue;
    (inPoly([x, z], chunkPoly) ? chunkG : flora) === chunkG ? pebble(chunkG, x, 0, z, s, 400 + k) : pebble(flora, x, 0, z, s, 400 + k);
  }
  for (let k = 0; k < 8; k++) pebble(flora, 3.5 + 5 * hz(k, 124), 0, 0.3 + 8.2 * hz(k, 125), 0.02 + 0.04 * hz(k, 126), 500 + k);
  for (let k = 0; k < 50; k++) { const x = (hz(k, 130) - 0.5) * 24, z = -9.4 - 7 * hz(k, 131); if (x > clr[0] - 0.4 && x < clr[1] + 0.4 && z > -21) { if (hz(k, 132) > 0.4) continue; } tuft(flora, x, farH(x, z, clr), z, 0.14 + 0.16 * hz(k, 133), 600 + k, GRASS.dry); }
  for (let k = 0; k < 24; k++) { const x = (hz(k, 134) - 0.5) * 60, z = -9.3 - 1.0 * hz(k, 135); shrub(flora, x, farH(x, z, clr), z, 0.4 + 0.4 * hz(k, 136) / 1, 700 + k, k % 5 === 0); }

  // ---- pines: the far top (60, a clearing for the photo, 3 on the rim), the near hinterland (40) and the near rim (8)
  const farClear = (x, z) => x > clr[0] - 0.8 && x < clr[1] + 0.8 && z > -21;
  for (let k = 0, placed = 0; placed < 60 && k < 400; k++) {
    const x = (hz(k, 140) - 0.5) * 60, z = -10.5 - 34.5 * hz(k, 141); if (farClear(x, z)) continue; placed++;
    pine(flora, x, farH(x, z, clr) - 0.05, z, 4 + 5 * hz(k, 142), 800 + k);
  }
  for (const [x, z, k] of [[-5.2, -10.8, 0], [-2.6, -11.5, 1], [3.0, -11.0, 2]]) pine(flora, x, 0.35, z, 4 + 3 * hz(k, 143), 900 + k);
  pine(flora, clr[0] - 0.6, 0.35, -14, 3.0, 910); pine(flora, clr[1] + 0.4, 0.35, -14, 3.0, 911);
  for (let k = 0, placed = 0; placed < 40 && k < 400; k++) {
    const x = (hz(k, 144) - 0.5) * 80, z = 12 + 33 * hz(k, 145); if (Math.abs(x) < 8 && z < 12.5) continue; placed++;
    pine(flora, x, nearH(x, z) - 0.05, z, 4 + 5 * hz(k, 146), 1000 + k);
  }
  for (let k = 0; k < 8; k++) { const x = (hz(k, 147) > 0.5 ? 1 : -1) * (9 + 21 * hz(k, 148)), z = 1.5 + 6.5 * hz(k, 149); pine(flora, x, nearH(x, z) - 0.05, z, 3.5 + 3.5 * hz(k, 150), 1100 + k); }

  // ---- wall plants (DESIGN 1.2): grass ledges, clinging pines, shrubs, roots; plus 1 pine and 2 shrubs per 12 m outside the detail zone
  const NG = [[-2.1, -3.0], [1.9, -6.2], [-0.4, -8.9], [2.4, -13.1], [-1.8, -16.4], [0.6, -20.7], [-2.6, -24.3], [1.6, -28.8], [-0.9, -34.0]];
  const FG = [[1.2, -2.2], [-2.4, -5.6], [0.3, -10.4], [2.7, -12.8], [-1.5, -17.9], [2.0, -22.6], [-0.2, -26.1], [-2.8, -31.5], [1.1, -36.5]];
  for (const [W, list] of [[nearW, NG], [farW, FG]]) list.forEach(([x, y], k) => {
    const inCorr = W.near && Math.abs(x) < 1.5, depth = inCorr ? 0.2 + 0.2 * hz(k, 160) : 0.2 + 0.6 * hz(k, 160), m = shelf(rock, W, x, y, depth, 0.6);
    tuft(flora, m[0], m[1], m[2], 0.3, 1200 + k + (W.near ? 0 : 50), hz(k, 161) > 0.5 ? GRASS.dry : lerpPT(GRASS.dry, GRASS.green, 0.0), 12);
  });
  const CN = [[-2.6, -4.5, 2.2], [3.1, -11.0, 1.8], [-3.8, -19.0, 2.5], [2.2, -27.0, 1.6]], CF = [[-2.2, -2.8, 2.4], [1.6, -8.5, 2.0], [3.9, -15.0, 2.6], [-0.6, -21.5, 1.8], [-3.3, -30.0, 2.2]];
  for (const [W, list] of [[nearW, CN], [farW, CF]]) list.forEach(([x, y, H], k) => pine(flora, x, y, W.zAt(x, y), H, 1300 + k + (W.near ? 0 : 20), { out: [0, 0, -W.side], rad: 0.22 }));
  for (const [W, base] of [[nearW, 0], [farW, 1]]) for (let k = 0; k < 10; k++) {
    let x = (hz(k, 170 + base) - 0.5) * 16; if (W.near && Math.abs(x) < 1.8) x += x < 0 ? -2 : 2;
    const y = -3 - 33 * hz(k, 171 + base), s = shelf(rock, W, x, y, 0.45, 0.8); shrub(flora, s[0], s[1], s[2], 0.2 + 0.15 * hz(k, 172), 1400 + k + base * 20, k % 10 < 3);
  }
  for (const [W, base] of [[nearW, 0], [farW, 1]]) for (let k = 0; k < 40; k++) {
    let x = (hz(k, 330 + base) - 0.5) * 20; if (W.near && Math.abs(x) < 1.8) x += x < 0 ? -2.2 : 2.2;
    const y = -2 - 58 * hz(k, 331 + base), s = shelf(rock, W, x, y, 0.5, 0.9);
    if (k % 3 === 0) pine(flora, s[0], s[1], s[2], 1.2 + 0.8 * hz(k, 332), 1700 + k + base * 50, { out: [0, 0, -W.side], rad: 0.22 });
    else { shrub(flora, s[0], s[1], s[2], 0.25 + 0.2 * hz(k, 333), 1800 + k + base * 50, k % 7 === 0); tuft(flora, s[0] + 0.2, s[1], s[2], 0.25, 1900 + k, GRASS.dry, 8); }
  }
  [-4.1, -2.6, -1.4, -0.7, 0.9, 1.5, 2.3, 3.4].forEach((x, k) => rootAt(flora, nearW, x, -0.45, 0.4 + 1.4 * hz(k, 180), k));
  for (const W of [nearW, farW]) for (let seg = -W.xMax; seg < W.xMax; seg += 12) {
    const c = seg + 6; if (Math.abs(c) < 9) continue;
    const k = Math.round(seg), x = seg + 12 * hz(k, 190 + W.side), y = -3 - 62 * hz(k, 191 + W.side);
    pine(flora, x, y, W.zAt(x, y), 1.6 + 1.0 * hz(k, 192), 1500 + k + (W.near ? 0 : 300), { out: [0, 0, -W.side], rad: 0.22 });
    for (let j = 0; j < 2; j++) { const x2 = seg + 12 * hz(k + j, 193 + W.side), y2 = -3 - 62 * hz(k + j, 194), s = shelf(rock, W, x2, y2, 0.4, 0.7); shrub(flora, s[0], s[1], s[2], 0.2 + 0.15 * hz(k + j, 195), 1600 + k + j, j === 1); }
  }

  // ---- DESIGN-GORGE-V2 2 and 4: the clifftop's loose blocks, the far rim's teeth, grass tufts, and the clinging greenery of both walls
  const ROCKB = [TONE.A, TONE.C, TONE.B];
  for (let k = 0; k < 14; k++) {   // near rim blocks: none in x -3..3, <= 0.45 m high and z <= 0.9 inside |x| 8
    const x = (hz(k, 800) > 0.5 ? 1 : -1) * (3.2 + 26.8 * hz(k, 801)), inner = Math.abs(x) < 8, w = 0.25 + 0.65 * hz(k, 802), zl = lipZ(x);
    const hgt = Math.min(inner ? 0.45 : 0.8, w * (0.5 + 0.5 * hz(k, 803))), z = zl + 0.15 + hz(k, 804) * ((inner ? 0.9 : 1.6) - zl - 0.15);
    tiltBox(flora, [x, nearH(x, z) + hgt * 0.35, z], [w, hgt, w * (0.7 + 0.5 * hz(k, 805))], hz(k, 806) * TAU, (hz(k, 807) - 0.5) * 0.4, (hz(k, 808) - 0.5) * 0.4, ROCKB[k % 3], Q(hz(k, 809)));
  }
  for (let k = 0; k < 22; k++) {   // far rim teeth: z -9.3..-11, 0.4..2.2 m high, 0.5..1.4 wide, none in |x| < 1.6, <= 0.5 m high in the clearing
    const x = (hz(k, 810) > 0.5 ? 1 : -1) * (1.8 + 28 * hz(k, 811)), z = -9.3 - 1.7 * hz(k, 812), w = 0.5 + 0.9 * hz(k, 813);
    const hgt = x > clr[0] - 0.6 && x < clr[1] + 0.6 ? Math.min(0.5, 0.4 + 0.1 * hz(k, 814)) : 0.4 + 1.8 * hz(k, 814), y0 = farH(x, z, clr) - 0.1;
    if (k % 2) tiltBox(flora, [x, y0 + hgt * 0.45, z], [w, hgt, w * 0.8], hz(k, 815) * TAU, (hz(k, 816) - 0.5) * 0.3, (hz(k, 817) - 0.5) * 0.3, ROCKB[k % 3], Q(hz(k, 818)));
    else ico(flora, [x, y0 + hgt * 0.35, z], [w * 0.55, hgt * 0.7, w * 0.45], hz(k, 815) * TAU, ROCKB[k % 3], 0, Q(hz(k, 818)));
  }
  for (let k = 0; k < 60; k++) {   // stage-side tufts, 0.10..0.25 m, none in x -3..3
    const x = (hz(k, 820) > 0.5 ? 1 : -1) * (3 + 11 * hz(k, 821)), zl = Math.max(0.1, lipZ(x) + 0.08), z = zl + hz(k, 822) * (9 - zl);
    tuft(flora, x, nearH(x, z), z, 0.10 + 0.15 * hz(k, 823), 2000 + k, hz(k, 824) > 0.5 ? GRASS.dry : GRASS.green);
  }
  for (let k = 0; k < 12; k++) {   // along the lip at 1.7 <= |x| <= 3, z < 0.22, <= 0.14 m
    const x = (hz(k, 825) > 0.5 ? 1 : -1) * (1.7 + 1.3 * hz(k, 826)), zl = lipZ(x), z = zl + 0.03 + hz(k, 827) * Math.max(0.01, Math.min(0.22, zl + 0.2) - zl - 0.03);
    tuft(flora, x, 0, z, 0.08 + 0.06 * hz(k, 828), 2100 + k, GRASS.dry, 7);
  }
  // greenery: a shrub is 2..3 squashed icos (d 1 above y -20, d 0 below)
  const clump = (x, y, z, k, side) => {
    const n = 2 + (hz(k, 830) > 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const r = 0.35 + 0.55 * hz(k * 3 + i, 831), ox = (hz(k * 3 + i, 832) - 0.5) * 0.9, oy = hz(k * 3 + i, 833) * 0.25;
      ico(flora, [x + ox, y + oy + r * 0.45, z - side * r * 0.3], [r, r * 0.7, r], hz(k * 3 + i, 834) * TAU, SHRUB, y > -20 ? 1 : 0, Q(hz(k * 3 + i, 835)));
    }
  };
  for (const [W, nS, nP, base] of [[nearW, 26, 9, 0], [farW, 40, 14, 1]]) {
    const side = W.side, okAt = (x, z, reach) => (W.near ? Math.abs(x) >= 2.2 : Math.abs(x) >= 2.2 || z + reach <= -6.2);
    let ns = 0, np = 0;
    W.shoulders.forEach((sh, i) => {   // a clump on every buttress and fin shoulder, a pine on every third
      if (ns >= nS) return;
      const x = sh.c + (hz(i, 840 + base) - 0.5) * sh.hw, y = sh.top - 0.55, z = W.zAt(x, y);
      if (!okAt(x, z, 1.4)) return;
      clump(x, y, z, 2200 + i + base * 100, side); ns++;
      if (i % 3 === 0 && np < nP) { const px = sh.c + (hz(i, 842 + base) - 0.5) * sh.hw * 1.2; pine(flora, px, y - 0.1, W.zAt(px, y - 0.1), 1.5 + 2.0 * hz(i, 843 + base), 2300 + i + base * 100, { out: [0, 0, -side], rad: 0.22 }); np++; }
    });
    for (let k = 0, t = 0; (ns < nS || np < nP) && t < 400; t++) {   // the rest on bed ledges: 60 % above y -15, 30 % to -30, 10 % below
      const kk = k * 9 + (t % 9), u = hz(kk, 850 + base), x = (hz(kk, 851 + base) - 0.5) * 60;
      const y0 = u < 0.6 ? -3 - 12 * hz(kk, 852 + base) : u < 0.9 ? -15 - 15 * hz(kk, 852 + base) : -30 - 30 * hz(kk, 852 + base);
      const bed = W.findBed(x, y0), y = bed.yB - TAN3 * x - 0.02;
      if (y > -2.5 || y < -62 || Math.abs(x) < 2.2 && W.near || Math.abs(W.zAt(x - 0.45, y) - W.zAt(x + 0.45, y)) > 0.25) continue;
      const wantPine = np < nP && (ns >= nS || hz(kk, 853 + base) < 0.3);
      if (wantPine) { pine(flora, x, y, W.zAt(x, y), 1.5 + 2.0 * hz(kk, 854 + base), 2400 + kk + base * 500, { out: [0, 0, -side], rad: 0.22 }); np++; k++; continue; }
      if (ns >= nS) break;
      const m = shelf(rock, W, x, y, 0.5, 0.9);
      if (!okAt(x, m[2], 1.4)) continue;
      clump(m[0], m[1], m[2], 2500 + kk + base * 500, side); ns++; k++;
    }
  }
  for (let k = 0; k < 10; k++) {   // far rim: junipers between the teeth
    const x = (hz(k, 860) > 0.5 ? 1 : -1) * (2.0 + 26 * hz(k, 861)), z = -9.4 - 1.0 * hz(k, 862);
    if (x > clr[0] - 0.6 && x < clr[1] + 0.6) continue;
    for (let i = 0; i < 2; i++) { const r = 0.35 + 0.35 * hz(k * 2 + i, 863); ico(flora, [x + (i - 0.5) * 0.6, farH(x, z, clr) + r * 0.3, z - i * 0.2], [r, r * 0.75, r], hz(k, 864 + i) * TAU, SHRUB, 1, Q(hz(k, 866))); }
  }

  // ---- river floor and boulders (the water is its own shader), ridges and clouds
  for (let k = 0; k < 28; k++) {
    const x = (hz(k, 200) - 0.5) * 140, side = hz(k, 201) > 0.5 ? 1 : -1, r = 0.3 + 0.5 * hz(k, 202), z = -4.5 + side * (0.8 + 0.4 * hz(k, 203));
    ico(flora, [x, -70 + r * 0.3, z], [r, r * 0.7, r * 0.9], hz(k, 204) * TAU, PT("#2c3442", "#232a36", "#283040"), 1, Q(hz(k, 205), 99, 99, 4));
  }
  const ridge = (z, x0, x1, tmin, tmax, ph, c1, c2) => {
    const prof2 = (x) => lerp(tmin, tmax, 0.5 + 0.28 * Math.sin(x * 0.045 + ph) + 0.22 * Math.sin(x * 0.13 + ph * 2.3)), A = FLAT(c1), B = FLAT(c2);
    for (let x = x0; x < x1; x += 6) {
      const ta = prof2(x), tb = prof2(x + 6), hint = [0, 0, -Math.sign(z)];
      back.quad([x, -90, z], [x + 6, -90, z], [x + 6, tb, z], [x, ta, z], hint, A, Q(0, 99, 99, 3));
      if (hz(Math.round(x), 210) > 0.45) for (const dz of [0.4, -0.4]) back.quad([x, ta - 0.38 * (ta - 2), z + dz], [x + 6, tb - 0.38 * (tb - 2), z + dz], [x + 6, tb, z + dz], [x, ta, z + dz], hint, B, Q(0, 99, 99, 3));
    }
  };
  ridge(-60, -200, 200, 8, 15, 0.9, "#8aa2c4", "#a0b4d0"); ridge(-90, -200, 200, 14, 26, 0.4, "#9bb0cc", "#a9bdd8"); ridge(-160, -200, 200, 26, 44, 1.9, "#b4c6de", "#c0d0e4");
  ridge(80, -200, 200, 10, 16, 2.7, "#8aa2c4", "#a9bdd8"); ridge(150, -200, 200, 20, 38, 4.1, "#b4c6de", "#c0d0e4");
  // clouds: hard-edged cumulus banks on the dome, three tones (azimuth from -z, elevation of the base, width, height in metres)
  const DOME_C = [0, 0, -4.5], RC = 262;
  const cloud = (az, el, W, ht, k) => {
    const a = az * RAD, e = el * RAD, d = [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)], right = nrm(crs(d, [0, 1, 0])), up = crs(right, d), c0 = add(DOME_C, mul(d, RC)), hint = mul(d, -1);
    let lay = 0; const P = (u, v) => add(add(add(c0, mul(right, u)), mul(up, v)), mul(d, -lay));
    const n = 6, lobes = []; for (let i = 0; i < n; i++) lobes.push([(i / (n - 1) - 0.5) * W * 0.8 + (hz(k * 7 + i, 220) - 0.5) * W * 0.06, ht * (0.5 + 0.5 * Math.sin((Math.PI * (i + 0.5)) / n)) * (0.8 + 0.4 * hz(k * 7 + i, 221))]);
    const body = FLAT("#f4c1a8"), under = FLAT("#c48fa6"), topc = FLAT("#fbe3cf"), q = Q(0, 99, 99, 5);
    lay = 0;
    for (const [u, r] of lobes) for (let j = 0; j < 12; j++) back.tri(P(u, 0), P(u + Math.cos((j / 12) * Math.PI) * r, Math.sin((j / 12) * Math.PI) * r), P(u + Math.cos(((j + 1) / 12) * Math.PI) * r, Math.sin(((j + 1) / 12) * Math.PI) * r), hint, body, q);
    const u0 = Math.min(...lobes.map((l) => l[0] - l[1] * 0.9)), u1 = Math.max(...lobes.map((l) => l[0] + l[1] * 0.9)), hu = ht * 0.2;
    lay = 0.8;
    back.quad(P(u0, 0), P(u1, 0), P(u1, hu), P(u0, hu), hint, under, q);
    lay = 1.6;
    for (const [u, r] of lobes) for (let j = 0; j < 8; j++) {
      const a0 = (40 + (j * 120) / 8) * RAD, a1 = (40 + ((j + 1) * 120) / 8) * RAD, ox = 0.10 * r, oy = -0.2 * r;
      back.quad(P(u + Math.cos(a0) * r, Math.sin(a0) * r), P(u + Math.cos(a1) * r, Math.sin(a1) * r), P(u + ox + Math.cos(a1) * r * 0.96, oy + Math.sin(a1) * r * 0.96), P(u + ox + Math.cos(a0) * r * 0.96, oy + Math.sin(a0) * r * 0.96), hint, topc, q);
    }
  };
  [[-14, 8.5, 70, 20], [9, 10.5, 100, 26], [-38, 17, 65, 18], [33, 9, 80, 21], [180, 14, 90, 22], [95, 26, 70, 18], [-100, 31, 85, 20]].forEach(([az, el, W, ht], k) => cloud(az, el, W, ht, k));

  // ---- the corridors stay free (DESIGN-GORGE-V2 0): no rock or flora triangle may touch fall corridor A or B
  {
    const CORR = [{ n: "A", x: [-1.2, 1.2], z: [-5.6, -3.4], y: [-40, 0] }, { n: "B", x: [-1.2, 1.2], z: [-1.6, -0.15], y: [-40, -0.5] }];
    for (const [nm, G] of [["rock", rock], ["flora", flora]]) {
      const P = G.P; let bad = 0, first = null;
      for (let i = 0; i + 2 < G.nv; i += 3) {
        for (let u = 0; u <= 6; u++) for (let v = 0; v <= 6 - u; v++) {
          const w0 = u / 6, w1 = v / 6, w2 = 1 - w0 - w1, x = P[i * 3] * w0 + P[i * 3 + 3] * w1 + P[i * 3 + 6] * w2, y = P[i * 3 + 1] * w0 + P[i * 3 + 4] * w1 + P[i * 3 + 7] * w2, z = P[i * 3 + 2] * w0 + P[i * 3 + 5] * w1 + P[i * 3 + 8] * w2;
          for (const C2 of CORR) if (x > C2.x[0] && x < C2.x[1] && z > C2.z[0] && z < C2.z[1] && y > C2.y[0] && y < C2.y[1]) { if (!bad++) first = [C2.n, x, y, z]; }
        }
      }
      if (bad) throw new Error(`gorge: ${nm} touches fall corridor ${first[0]} at ${first.slice(1).map((v) => v.toFixed(2))} (${bad} samples)`);
    }
  }
  if (spec.debugCount) console.log(`gorge triangles: rock ${rock.nv / 3}, flora ${flora.nv / 3}, decal ${decal.nv / 3}, back ${back.nv / 3}, chunk ${chunkG.nv / 3}`);
  return { rock, flora, decal, back, chunkG, streaks, arcPts, lipZ, nearW, farW, chunkPoly };
}

// ------------------------------------------------------------------------------------------------ the sky dome, the water, a flat cel puff
function skyMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uZen: { value: C("#6f9fd8") }, uMid: { value: C("#a9c6e8") }, uHor: { value: C("#f3d2b0") }, uBelow: { value: C("#cfd6d2") } },
    vertexShader: `varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uZen, uMid, uHor, uBelow; varying vec3 vD;
void main() {
  float el = degrees(asin(clamp(normalize(vD).y, -1.0, 1.0)));
  vec3 c = mix(uHor, uMid, smoothstep(0.0, 40.0, el)); c = mix(c, uZen, smoothstep(40.0, 90.0, el));
  c = mix(uBelow, c, smoothstep(-1.2, 0.4, el));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, toneMapped: false, fog: false,
  });
  m.userData.noOutline = true; return m;
}
function waterMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uBase: { value: C("#d6efe6") }, uDeep: { value: C("#8fc7b4") }, uFoam: { value: C("#ffffff") }, uGravel: { value: C("#46505e") }, uFloor: { value: C("#22343a") }, uDist: { value: C("#a9bdd6") } },
    vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT; uniform vec3 uBase, uDeep, uFoam, uGravel, uFloor, uDist; varying vec3 vW;
float hs1(float n) { return fract(sin(n * 127.1 + 17.3) * 43758.5453); }
void main() {
  float cx = -4.5 + 0.35 * sin(vW.x * 0.15708), dz = vW.z - cx, halfW = 0.9;
  vec3 c = abs(dz) < 1.3 ? uGravel : uFloor;   // banks, then the floor beyond them (final colours, no grade)
  if (abs(dz) <= halfW) {
    float deepC = 0.25 * sin(vW.x * 0.31 + 1.0);
    c = abs(dz - deepC) < 0.285 ? uDeep : uBase;
    float lane = floor((dz + halfW) / 0.3), x2 = vW.x - 3.0 * uT + hs1(lane) * 50.0, cell = floor(x2 / 7.0), s = fract(x2 / 7.0);
    float fz = abs(fract((dz + halfW) / 0.3) - 0.5);
    if (hs1(lane * 3.0 + cell * 1.7) > 0.12 && s < 0.3 && fz < 0.333) c = uFoam;
  }
  float gh = clamp((length(cameraPosition - vW) - 45.0) / 125.0, 0.0, 1.0) * 0.40;
  gl_FragColor = vec4(mix(c, uDist, gh), 1.0);
  #include <colorspace_fragment>
}`,
    toneMapped: false, fog: false, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; return m;
}
function puffMat(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uCol: { value: C("#cdbfa6") }, uSeed: { value: seed } },
    vertexShader: `varying vec2 vQ; void main() { vQ = position.xy * 2.0; vec4 vp = viewMatrix * modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); vp.xy += position.xy * length(modelMatrix[0].xyz); gl_Position = projectionMatrix * vp; }`,
    fragmentShader: `uniform float uA, uSeed; uniform vec3 uCol; varying vec2 vQ;
void main() {
  float r = length(vQ), e = 0.9 + 0.07 * sin(atan(vQ.y, vQ.x) * 5.0 + uSeed) + 0.04 * sin(atan(vQ.y, vQ.x) * 9.0 - uSeed * 2.0);
  if (r > e || uA < 0.01) discard;
  vec3 c = uCol; if (vQ.y * 0.6 - vQ.x * 0.4 < -0.35) c *= 0.82;
  gl_FragColor = vec4(c, uA);
  #include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; return m;
}

// ------------------------------------------------------------------------------------------------ gorge
// the world's anchors (DESIGN 1.5)
export const GORGE = {
  LIP: 0, FAR_RIM: { z: -9, y: 0.4 }, STAGE: { x: [-8, 8], z: [0, 10], y: 0 },
  SPUD_LIP: [0.20, 0, 0.15], CHIP_LIP: [-0.75, 0, 0.20], NOTCH_GRIP,
  WALL_PLANES: { near: 0.25, far: -9.25 }, CORRIDOR_A: { x: [-1.2, 1.2], z: [-5.6, -3.4], y: [0, -40] }, CORRIDOR_B: { x: [-1.2, 1.2], z: [-1.6, -0.15], y: [-0.5, -40] },
  // the four of the photo, feet (x, 0, 1.5) facing +z, tall in m; the camera of DESIGN 6
  PHOTO_SPOT: { z: 1.5, feet: { wedge: [5.05, 0, 1.5], spud: [5.85, 0, 1.5], chip: [6.48, 0, 1.5], mash: [7.10, 0, 1.5] }, tall: { wedge: 1.1, spud: 1.0, chip: 0.65, mash: 1.35 }, cam: { pos: [6.0, 1.0, 7.8], look: [6.0, 1.05, 1.5], fov: 50 } },
  CHUNK_OUTLINE: OUTLINE, CHUNK_BREAK_SECONDS: 2.44,
  chunkAt,                                                   // chunkAt(p, [x, y, z] in the chunk's rest frame) -> world point
  chunkMatrix: (p) => chunkMatrix(p, new THREE.Matrix4()),   // THREE.Matrix4 of the chunk at lipbreak p
  chunkSolid: (p) => p <= 0.10,
};

function gorge(P) {
  const S = P.spec, g = P.whole, B = buildGorge(S), mat = gorgeMat(B.streaks);
  const meshes = [];
  const add = (geo, solid, order, m = mat, name) => { const o = mark(new THREE.Mesh(geo.geometry(), m), solid, order); if (name) o.name = name; g.add(o); meshes.push(o); return o; };
  add(B.rock, true, 0, mat, "gorge-rock"); add(B.flora, false, 0, mat, "gorge-flora"); add(B.back, false, 0, mat, "gorge-backdrop");
  const decalM = gorgeMat(B.streaks); decalM.polygonOffset = true; decalM.polygonOffsetFactor = -2; decalM.polygonOffsetUnits = -4;
  add(B.decal, false, 1, decalM, "gorge-decals");
  const chunk = add(B.chunkG, true, 0, mat, "gorge-chunk");
  if (S.sky !== false) { const d = mark(new THREE.Mesh(new THREE.SphereGeometry(280, 48, 32), skyMat()), false, -1000); d.position.set(0, 0, -4.5); d.name = "gorge-sky"; g.add(d); }
  const water = waterMat();
  if (S.river !== false) { const w = new THREE.PlaneGeometry(300, 24); w.rotateX(-Math.PI / 2); const o = mark(new THREE.Mesh(w, water), false, 0); o.position.set(0, -70, -4.5); o.name = "gorge-river"; g.add(o); }

  // the crack along the chunk's outline: a ribbon rewritten while the chunk is still on
  const crackG = new Geo(2048), crack = new THREE.Mesh(new THREE.BufferGeometry(), decalM);
  { const a = B.arcPts; for (let i = 0; i < a.length - 1; i++) crackG.quad([a[i][0], 0.004, a[i][1]], [a[i + 1][0], 0.004, a[i + 1][1]], [a[i + 1][0], 0.004, a[i + 1][1] + 0.01], [a[i][0], 0.004, a[i][1] + 0.01], [0, 1, 0], CRACK, Q(0.5)); }
  crack.geometry = crackG.dynamic(); mark(crack, false, 2); g.add(crack);

  // the spray: 4 rollers off the chunk's front, 16 pebbles + 6 clods from the break, 8 pebbles of the crumble; one instanced mesh with a tint each
  const NR = 4, NS = 22, NC = 8, NT = NR + NS + NC;
  const pg = new Geo(256); ico(pg, [0, 0, 0], [0.5, 0.4, 0.5], 0, PEB[0], 0, Q(0.5));
  const spray = mark(new THREE.InstancedMesh(pg.geometry(), mat, NT), false, 0); spray.name = "gorge-spray";
  const tints = Array.from({ length: NT }, (_, j) => (j >= NR + 16 && j < NR + NS ? new THREE.Color(1.0, 0.93, 0.82) : new THREE.Color().setScalar(0.85 + 0.3 * hs(j, 7)))); tints.forEach((c, j) => spray.setColorAt(j, c));
  g.add(spray);
  const flake = mark(new THREE.Mesh((() => { const f = new Geo(256); ico(f, [0, 0, 0], [0.5, 0.35, 0.5], 0.4, FRESH, 0, Q(0.5)); return f.geometry(); })(), mat), false, 0); flake.name = "gorge-flake"; g.add(flake);
  const puffs = Array.from({ length: 7 }, (_, i) => { const m = puffMat(i * 1.7), o = mark(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), false, 3); o.visible = false; g.add(o); return o; });
  const dum = new THREE.Object3D(), arcA = B.arcPts, lipZ = B.lipZ;
  const roll = Array.from({ length: NR }, (_, i) => ({ x: 0.0 + 0.13 * i + 0.05 * hs(i, 1), z: lipZ(0.1) + 0.08 + 0.06 * hs(i, 2), s: 0.025 + 0.015 * hs(i, 3), c0: 0.03 + 0.05 * i }));
  const spr = Array.from({ length: NS }, (_, j) => {
    const a = arcA[1 + Math.floor(hs(j, 230) * 11)];
    return { x: a[0], z: a[1], c0: 0.24 + 0.26 * (j / (NS - 1)), v: [(hs(j, 231) - 0.5) * 1.2, 0.2 + hs(j, 232), -(0.3 + 1.1 * hs(j, 233))], s: j < 16 ? 0.02 + 0.03 * hs(j, 234) : 0.06 + 0.04 * hs(j, 234), ax: nrm([hs(j, 235) - 0.5, hs(j, 236) - 0.5, hs(j, 237) - 0.5]), w: 3 + 6 * hs(j, 238) };
  });
  const crm = Array.from({ length: NC }, (_, j) => ({ x: NOTCH_GRIP[0] + (hs(j, 240) - 0.5) * 0.12, z: NOTCH_GRIP[2] - 0.02 * hs(j, 241), c0: 0.3 * (j / (NC - 1)), v: [(hs(j, 242) - 0.5) * 0.3, 0.05 * hs(j, 243), -(0.1 + 0.4 * hs(j, 244))], s: 0.02 + 0.03 * hs(j, 245), ax: nrm([hs(j, 246) - 0.5, hs(j, 247) - 0.5, hs(j, 248) - 0.5]), w: 3 + 6 * hs(j, 249) }));
  const putInst = (i, x, y, z, s, ax, w, t) => { dum.position.set(x, y, z); dum.quaternion.setFromAxisAngle(_v.set(...ax), w * t); dum.scale.setScalar(s * 2); dum.updateMatrix(); spray.setMatrixAt(i, dum.matrix); };
  const hideInst = (i) => { dum.position.set(0, -500, 0); dum.scale.setScalar(0.0001); dum.updateMatrix(); spray.setMatrixAt(i, dum.matrix); };
  const M = new THREE.Matrix4(), V = new THREE.Vector3();
  return {
    grip: 0,
    apply(ps, t) {
      const p = clamp(num(ps.lipbreak, num(S.lipbreak, 0))), q = clamp(num(ps.crumble, num(S.crumble, 0))), c = p * 2.44;
      chunk.visible = p < 0.999;
      if (chunk.visible) { chunkMatrix(p, M); M.decompose(chunk.position, chunk.quaternion, chunk.scale); }
      // the crack, wider as the chunk sinks, gone once it tips
      crack.visible = p < 0.10; if (crack.visible) { const w = lerp(0.005, 0.015, p / 0.10); crackG.reset(); const a = arcA; for (let i = 0; i < a.length - 1; i++) { const dx = a[i + 1][0] - a[i][0], dz = a[i + 1][1] - a[i][1], l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * w, nz = (dx / l) * w; crackG.quad([a[i][0] - nx, 0.004, a[i][1] - nz], [a[i + 1][0] - nx, 0.004, a[i + 1][1] - nz], [a[i + 1][0] + nx, 0.004, a[i + 1][1] + nz], [a[i][0] + nx, 0.004, a[i][1] + nz], [0, 1, 0], CRACK, Q(0.5)); } crackG.sync(); }
      // the four rollers off the chunk's front, then the spray, then the crumble's
      roll.forEach((r, i) => {
        const T = c - r.c0, y0 = r.s * 0.2;
        if (p >= 0.999) return hideInst(i);
        if (T <= 0) { chunkMatrix(p, M); V.set(r.x, y0, r.z).applyMatrix4(M); return putInst(i, V.x, V.y, V.z, r.s, [0, 0, 1], 0, 0); }
        const zl = lipZ(r.x), Tf = Math.max(0, (r.z - zl) / 0.8), z = r.z - 0.8 * Math.min(T, Tf + 1), Tg = Math.max(0, T - Tf);
        putInst(i, r.x, y0 - 4.9 * Tg * Tg, z - 0.3 * Tg, r.s, [1, 0, 0], 6, T);
      });
      spr.forEach((s, j) => {
        const T = c - s.c0; if (T < 0 || p >= 0.999) return hideInst(NR + j);
        putInst(NR + j, s.x + s.v[0] * T, 0.02 + s.v[1] * T - 4.9 * T * T, s.z + s.v[2] * T, s.s, s.ax, s.w, T);
      });
      crm.forEach((s, j) => {
        const T = q * 1.5 - s.c0; if (p < 0.999 || T < 0 || q <= 0) return hideInst(NR + NS + j);
        putInst(NR + NS + j, s.x + s.v[0] * T, NOTCH_GRIP[1] + s.v[1] * T - 4.9 * T * T, s.z + s.v[2] * T, s.s, s.ax, s.w, T);
      });
      spray.instanceMatrix.needsUpdate = true;
      // the flake: sits at the notch's grip once the chunk is gone, falls with the crumble
      flake.visible = p >= 0.999; if (flake.visible) { const T = q * 1.5; flake.position.set(NOTCH_GRIP[0], NOTCH_GRIP[1] - 4.9 * T * T, NOTCH_GRIP[2] - 0.2 * T); flake.rotation.set(2.2 * T, 0, 3.1 * T); flake.scale.setScalar(0.12); }
      // dust: six puffs along the break line from c 0.24, rising 0.2 m, gone by 0.95; one 0.15 m wisp at the crumble
      puffs.forEach((o, i) => {
        let on, x, y, z, d, a;
        if (i < 6) { const c0 = 0.24 + 0.03 * i, u = (c - c0) / (0.95 - c0), ar = arcA[1 + Math.floor((i / 5) * 10)]; on = u >= 0 && u <= 1 && p < 0.999; x = ar[0]; z = ar[1]; y = 0.05 + 0.2 * u; d = (0.15 + 0.15 * hs(i, 250)) * (0.6 + 0.4 * u); a = 0.5 * (1 - u * u); }
        else { const u = q * 1.5 / 1.0; on = p >= 0.999 && q > 0 && u <= 1; x = NOTCH_GRIP[0]; y = NOTCH_GRIP[1] + 0.05 + 0.2 * u; z = NOTCH_GRIP[2]; d = 0.15 * (0.6 + 0.4 * u); a = 0.5 * (1 - u * u); }
        o.visible = !!on; if (on) { o.position.set(x, y, z); o.scale.setScalar(d); o.material.uniforms.uA.value = a; }
      });
      water.uniforms.uT.value = t;
    },
  };
}

// ------------------------------------------------------------------------------------------------ planks (DESIGN 3)
const PL = [   // x0, y0, z0, xd, zc, ph, w1, w2
  [-1.9, -1.0, -3.7, -0.4, -4.2, 0.0, 310, 70], [1.6, -1.0, -5.3, 0.5, -4.9, 1.7, -260, 110], [-1.4, -1.0, -5.0, -0.3, -4.7, 3.1, 220, -90],
  [2.1, -1.0, -3.9, 0.4, -4.3, 4.4, -340, 60], [0, -1.31, -2.6, -1.6, -4.0, 0.9, 190, -120], [0, -1.16, -6.4, 1.7, -5.0, 2.6, -230, 80]];
const HANG_TILT = [0, 0, 0, 0, 9, -7];   // degrees in the wall plane for the two hangers (within 12 of plumb)
const dropD = (t) => 14 * (t - 1.4 * (1 - Math.exp(-t / 1.4)));
const plankPos = (i, t) => {
  const [x0, y0, z0, xd, zc, ph] = PL[i], y = y0 - dropD(t), tm = Math.min(1, t);
  const zb = y > -30 ? z0 : lerp(z0, zc, clamp((-30 - y) / 40));
  return [x0 + xd * (1 - Math.exp(-t / 0.8)) + 0.25 * tm * Math.sin(TAU * 0.7 * t + ph), y, zb + 0.2 * tm * Math.sin(TAU * 0.55 * t + 2 * ph)];
};
const plankEnd = PL.map((r) => { let lo = 0, hi = 30; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (r[1] - dropD(m) > -69.9) lo = m; else hi = m; } return (lo + hi) / 2; });
const _Z = new THREE.Vector3(0, 0, 1), _Y = new THREE.Vector3(0, 1, 0), _X = new THREE.Vector3(1, 0, 0);
function plankQuat(i, tt, out = new THREE.Quaternion()) {
  const a0 = 40 * (i + 1) * RAD, [, , , , , , w1, w2] = PL[i], qz = new THREE.Quaternion().setFromAxisAngle(_Z, HANG_TILT[i] * RAD * (1 - sm(0, 0.5, tt)));
  const qy1 = new THREE.Quaternion().setFromAxisAngle(_Y, w2 * tt * RAD + a0), qx = new THREE.Quaternion().setFromAxisAngle(_X, 90 * RAD * sm(0, 0.9, tt)), qy2 = new THREE.Quaternion().setFromAxisAngle(_Y, w1 * tt * RAD + a0);
  return out.copy(qz).multiply(qy1).multiply(qx).multiply(qy2);
}
// one plank into G: 0.18 wide (x), 0.9 long (y), 0.04 thick (z), corners chipped by plank i's own hash, lash marks and a knot; M places it
function plankInto(G, i, M) {
  const T = (p) => (M ? _v.set(p[0], p[1], p[2]).applyMatrix4(M).toArray() : p), D = (d) => (M ? _v.set(d[0], d[1], d[2]).transformDirection(M).toArray() : d);
  const a = [0, 1, 2, 3].map((k) => 0.012 + 0.03 * hs(i * 4 + k, 300)); a[Math.floor(hs(i, 301) * 4)] = 0.055;
  const W = 0.09, L = 0.45, z = 0.02;
  const poly = [[W - a[0], L], [-W + a[1], L], [-W, L - a[1]], [-W, -L + a[2]], [-W + a[2], -L], [W - a[3], -L], [W, -L + a[3]], [W, L - a[0]]];
  const q = Q(hs(i, 302));
  for (let j = 0; j < 8; j++) {
    const p0 = poly[j], p1 = poly[(j + 1) % 8];
    G.tri(T([0, 0, z]), T([p0[0], p0[1], z]), T([p1[0], p1[1], z]), D([0, 0, 1]), WOOD, q);
    G.tri(T([0, 0, -z]), T([p0[0], p0[1], -z]), T([p1[0], p1[1], -z]), D([0, 0, -1]), WOOD, q);
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, endEdge = j === 0 || j === 4;
    G.quad(T([p0[0], p0[1], z]), T([p1[0], p1[1], z]), T([p1[0], p1[1], -z]), T([p0[0], p0[1], -z]), D([mx, my, 0]), endEdge ? ENDG : WOOD, q);
  }
  for (const yy of [L - 0.12, -L + 0.12]) for (const zz of [z + 0.0006, -z - 0.0006]) G.quad(T([-W, yy - 0.015, zz]), T([W, yy - 0.015, zz]), T([W, yy + 0.015, zz]), T([-W, yy + 0.015, zz]), D([0, 0, Math.sign(zz)]), LASH, q);
  const kx = (hs(i, 303) - 0.5) * 0.08, ky = (hs(i, 304) - 0.5) * 0.5;
  for (let j = 0; j < 6; j++) { const a0 = (j / 6) * TAU, a1 = ((j + 1) / 6) * TAU; G.tri(T([kx, ky, z + 0.0006]), T([kx + Math.cos(a0) * 0.016, ky + Math.sin(a0) * 0.022, z + 0.0006]), T([kx + Math.cos(a1) * 0.016, ky + Math.sin(a1) * 0.022, z + 0.0006]), D([0, 0, 1]), FLAT("#4a382a"), q); }
}

function planks(P) {
  const S = P.spec, g = P.whole, mat = gorgeMat([]), n = Math.min(6, S.n ?? 6), starts = Array.isArray(S.starts) ? S.starts : [-1.6, -1.1, -0.7, -0.3, 10.9, 11.0];
  const items = Array.from({ length: n }, (_, i) => {
    const G = new Geo(1024); plankInto(G, i, null);
    const m = mark(new THREE.Mesh(G.geometry(), mat), false, 0); m.name = `plank${i + 1}`; m.visible = false; g.add(m);
    const fg = new Geo(128); for (let j = 0; j < 12; j++) fg.tri([0, 0, 0], [Math.cos((j / 12) * TAU) * 0.4, 0, Math.sin((j / 12) * TAU) * 0.4], [Math.cos(((j + 1) / 12) * TAU) * 0.4, 0, Math.sin(((j + 1) / 12) * TAU) * 0.4], [0, 1, 0], FLAT("#f4fbf5"), Q(0, 99, 99, 5));
    const f = mark(new THREE.Mesh(fg.geometry(), mat), false, 1); f.visible = false; g.add(f);
    return { m, f };
  });
  const qq = new THREE.Quaternion();
  return {
    grip: 0,
    apply(ps, t) {
      items.forEach((it, i) => {
        const tt = t - (starts[i] ?? 0), te = plankEnd[i];
        it.m.visible = tt >= 0 && tt < te;
        if (it.m.visible) { const p = plankPos(i, tt); it.m.position.set(p[0], p[1], p[2]); it.m.quaternion.copy(plankQuat(i, tt, qq)); }
        const u = (tt - te) / 0.4; it.f.visible = u >= 0 && u <= 1;
        if (it.f.visible) { const p = plankPos(i, te); it.f.position.set(p[0], -69.95, p[2]); it.f.scale.setScalar(1 - 0.3 * u); }
      });
    },
  };
}

// ------------------------------------------------------------------------------------------------ the bridge rope (DESIGN 2)
const gcurve = (s) => 0.5 * 4 * s * (1 - s) + 0.5 * (1 - Math.abs(2 * s - 1));
const ropeP = (s, sway = 0, sag = 1.40) => { const g = gcurve(s); return [sway * g, 0.30 + 0.40 * s - sag * g, 0.5 - 10 * s]; };
export const BRIDGE = {
  // a glove point on the rope at z: [x, y, z]
  ropeAt: (z, sway = 0, sag = 1.40) => ropeP((0.5 - z) / 10, sway, sag),
  GLOVE: { chip: -4.5, spud: -4.75, fray: -4.25, spudAlt: -4.0 },
  hangers: [{ z: -2.6, y: -1.31, plank: 5 }, { z: -6.4, y: -1.16, plank: 6 }],
  STAKE_NEAR: [0, 0, 0.5], STAKE_FAR: [0, 0.4, -9.5], POSTS: KIND_POSTS.bridgerope.map(([x, y, z]) => [x, y, z]),   // engine/shared/obstacles.js: qa/clear.mjs reads the same posts
  FRAY_Z: [-4.37, -4.13],
};
const E3 = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const unit = (v) => nrm(v);
// the arc length along the intact curve from the near lip (s 0.05) and from the far lip (s 0.95), tabulated once
const ARC = (() => {
  const N = 400, near = new Float32Array(N + 1), far = new Float32Array(N + 1); let a = 0;
  for (let i = 1; i <= N; i++) { const s0 = (i - 1) / N, s1 = i / N, d = Math.hypot(...sub(ropeP(s1), ropeP(s0))); if (s0 >= 0.05) a += d; near[i] = a; }
  a = 0; for (let i = N - 1; i >= 0; i--) { const s0 = (i + 1) / N, s1 = i / N, d = Math.hypot(...sub(ropeP(s1), ropeP(s0))); if (s0 <= 0.95) a += d; far[i] = a; }
  return { near, far, N };
})();
const arcNear = (s) => ARC.near[Math.round(clamp(s) * ARC.N)], arcFar = (s) => ARC.far[Math.round(clamp(s) * ARC.N)];

function bridgerope(P) {
  const S = P.spec, g = P.whole, sag = num(S.sag, 1.40), fz = num(S.fray, -4.25), mat = gorgeMat([]);
  const sA = (0.5 - (fz + 0.12)) / 10, sB = (0.5 - (fz - 0.12)) / 10, sL = 0.05, sF = 0.95;
  const LHN = 4.40, LHF = 4.97, aEndN = arcNear(sA), aEndF = arcFar(sB), kN = LHN / aEndN, kF = LHF / aEndF;
  const WOODP = PT("#7a6048", "#4f3f3a"), CORD = PT("#b08a5a", "#7d5f3c", "#9a7a52"), HAND = PT("#b08a5a", "#7d5f3c", "#9a7a52");
  // ---- static: posts, the far stake, the dead hand ropes and their planks
  const st = new Geo(1 << 14), stake = new Geo(1 << 12);
  const lean = 5 * RAD;
  for (const [x, y, z] of BRIDGE.POSTS) {
    const near = z > 0, s = near ? -1 : 1, top = [x, y + 1.3 * Math.cos(lean), z + s * 1.3 * Math.sin(lean)], at = (h) => [x, y + h * Math.cos(lean), z + s * h * Math.sin(lean)];
    tube(st, [[x, y, z], top], 0.08, 8, WOODP, { h: 0.5, capEnd: false });
    for (let j = 0; j < 8; j++) { const a0 = (j / 8) * TAU, a1 = ((j + 1) / 8) * TAU; st.tri(top, [top[0] + Math.cos(a0) * 0.08, top[1], top[2] + Math.sin(a0) * 0.08], [top[0] + Math.cos(a1) * 0.08, top[1], top[2] + Math.sin(a1) * 0.08], [0, 1, 0], ENDG, Q(0.5)); }
    for (const h of [1.05, 1.10, 1.15]) tube(st, [at(h), at(h + 0.035)], 0.092, 8, HAND, { h: 0.3 });
    const sx = Math.sign(x) * 0.075; st.quad([x + sx, y + 0.45, z], [x + sx * 1.04, y + 0.45, z + 0.015], [x + sx * 1.04, y + 1.2, z + s * 0.1 + 0.015], [x + sx, y + 1.2, z + s * 0.1], [Math.sign(x), 0, 0], FLAT("#2f2830"), Q(0.5));   // the split down one side
  }
  {   // stakes: 0.14 thick, 0.45 tall, leaning 12 degrees away from the gap; rope wound 4 turns and knotted at 0.30 up
    const l12 = 12 * RAD, mk = (G, x, y, z, s) => {
      const b = [x, y, z - s * 0.30 * Math.tan(l12) * 0 + (-s) * -0.0], base = [x, y, z - s * 0.30 * Math.tan(l12)], top = [x, y + 0.45 * Math.cos(l12), base[2] + s * 0.45 * Math.sin(l12)], at = (h) => [x, y + h * Math.cos(l12), base[2] + s * h * Math.sin(l12)];
      void b; tube(G, [base, top], 0.07, 7, WOODP, { h: 0.2, capEnd: false });
      for (let j = 0; j < 7; j++) { const a0 = (j / 7) * TAU, a1 = ((j + 1) / 7) * TAU; G.tri(top, [top[0] + Math.cos(a0) * 0.07, top[1], top[2] + Math.sin(a0) * 0.07], [top[0] + Math.cos(a1) * 0.07, top[1], top[2] + Math.sin(a1) * 0.07], [0, 1, 0], ENDG, Q(0.5)); }
      for (let k = 0; k < 4; k++) tube(G, [at(0.19 + 0.033 * k), at(0.19 + 0.033 * k + 0.026)], 0.083, 7, ROPE, { h: 0.4 });
      ico(G, at(0.30), [0.05, 0.04, 0.05], 0.5, ROPE, 0, Q(0.5));
    };
    mk(stake, 0, 0, 0.5, 1); mk(st, 0, 0.4, -9.5, -1);
  }
  const REM = [{ x: -0.9, near: true, len: 5.2, pl: [[1.6, -12], [2.9, 20], [4.6, -35]] }, { x: 0.9, near: true, len: 1.2, frayed: true, pl: [] }, { x: -0.9, near: false, len: 2.4, pl: [[1.8, 15]] }, { x: 0.9, near: false, len: 6.0, pl: [[1.2, -8], [2.5, 25], [3.9, -18], [5.4, 40]] }];
  REM.forEach((r, ri) => {
    const near = r.near, s = near ? -1 : 1, pz = near ? 0.5 : -9.5, py = near ? 0 : 0.4, lipY = near ? 0 : 0.4, zr = near ? -0.10 : -8.90, zl = near ? 0 : -9;
    const topP = [r.x, py + 1.2 * Math.cos(lean), pz + s * 1.2 * Math.sin(lean)], pts = [topP];
    for (const u of [0.25, 0.5, 0.75]) pts.push([r.x, lerp(topP[1], lipY + 0.04, u), lerp(topP[2], zl, u)]);
    pts.push([r.x, lipY + 0.035, zl], [r.x, lipY - 0.02, zl + s * 0.08 * 1], [r.x, lipY - 0.12, zr]);
    const nSeg = Math.max(2, Math.round(r.len / 0.4));
    for (let j = 1; j <= nSeg; j++) pts.push([r.x + 0.012 * Math.sin(j * 1.9 + ri), lipY - 0.12 - ((r.len - 0.12) * j) / nSeg, zr]);
    tube(st, pts, 0.02, 5, HAND, { h: 0.3 });
    for (let c = 0.6; c < r.len; c += 0.6) tube(st, [[r.x, lipY - c, zr], [r.x + 0.012, lipY - c - 0.05, zr + s * -0.03], [r.x + 0.02, lipY - c - 0.13, zr + s * -0.03]], 0.0075, 3, CORD, { h: 0.5 });
    const end = pts[pts.length - 1];
    if (r.frayed) for (let f = 0; f < 6; f++) { const a = hs(f, 260 + ri) * TAU; tube(st, [end, [end[0] + Math.cos(a) * 0.03, end[1] - 0.05, end[2] + Math.sin(a) * 0.03], [end[0] + Math.cos(a) * 0.06, end[1] - 0.11, end[2] + Math.sin(a) * 0.05]], 0.003, 3, FLAT("#d9c08f"), { h: 0.5 }); }
    r.pl.forEach(([d, tilt], pi) => {
      const y = lipY - d, M = new THREE.Matrix4().makeTranslation(r.x + 0.02 * pi, y, zr - s * 0.045).multiply(new THREE.Matrix4().makeRotationZ(tilt * RAD));
      plankInto(st, (ri * 3 + pi + 1) % 6, M);
      tube(st, [[r.x, y + 0.02, zr], [r.x + 0.04, y - 0.1, zr - s * 0.045]], 0.0075, 3, CORD, { h: 0.5 });
    });
  });
  const statik = mark(new THREE.Mesh(st.geometry(), mat), false, 0); statik.name = "bridge-static"; g.add(statik);
  const stakeM = mark(new THREE.Mesh(stake.geometry(), mat), false, 0); stakeM.name = "bridge-stake"; g.add(stakeM);
  // ---- dynamic: the rope, its strands and fibres, the two hangers
  const dyn = new Geo(1 << 16), dynM = mark(new THREE.Mesh(dyn.dynamic(), mat), false, 0); dynM.name = "bridge-rope"; g.add(dynM);
  const swingA = (t, ph) => Math.sin(TAU * 0.4 * t + ph);
  const hq = new THREE.Quaternion(), hM = new THREE.Matrix4(), hP = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const stakeRest = new THREE.Vector3(0, 0, 0.5);
  const nfD = (p) => chunkAt(p, [0, 0, 0.5]);
  const disp = (p) => { const w = nfD(clamp(p)); return [w[0] - 0, w[1] - 0, w[2] - 0.5]; };

  return {
    grip: 0,
    apply(ps, t) {
      const snap = clamp(num(ps.snap, num(S.snap, 0))), sway = clamp(num(ps.sway, num(S.sway, 0)), -0.15, 0.15), nearfall = clamp(num(ps.nearfall, num(S.nearfall, 0))), strands = clamp(num(ps.strands, num(S.strands, 3)), 0, 3), hangers = num(ps.hangers, num(S.hangers, 1)) >= 0.5;
      dyn.reset();
      const nearGone = nearfall >= 0.999;
      // the stake rides the chunk
      stakeM.visible = !nearGone; if (!nearGone) { chunkMatrix(nearfall, hM); hM.decompose(stakeM.position, stakeM.quaternion, stakeM.scale); stakeM.position.add(hP.set(0, 0, 0)); }
      // ---- near piece: stake to the fray
      const kS = clamp(1.3 * snap - 0.1);
      const pivN = [0, 0.03, 0], pivF = [0, 0.43, -9];
      const nearPt = (s) => {
        const P0 = ropeP(s, sway, sag);
        let out = P0;
        if (s < sL) { const slack = [0.035 * Math.sin((0.5 - P0[2]) * 14), 0.03, P0[2]]; out = [lerp(P0[0], slack[0], E3(kS)), lerp(P0[1], slack[1], E3(kS)), lerp(P0[2], slack[2], E3(kS))]; }
        else if (snap > 0) {
          const a = arcNear(s) * kN, u = clamp(a / LHN), v = sub(P0, pivN), r = Math.hypot(...v), d0 = mul(v, 1 / (r || 1)), k = clamp(1.3 * snap - 0.3 * u), E = E3(k);
          let dir = unit(add(mul(d0, 1 - E), mul([0, -1, 0], E)));
          let pos = add(pivN, mul(dir, lerp(r, a, E)));
          pos[2] += -0.03 * E;
          const w = clamp((u - 0.85) / 0.15), ang = 50 * RAD * Math.sin(Math.PI * k), L15 = 0.15 * LHN;
          pos[2] += -L15 * Math.sin(ang) * w * w / 3; pos[1] += L15 * (1 - Math.cos(ang)) * w * w / 3;
          pos[0] += a * Math.sin(2 * RAD * swingA(t, 0) * sm(0.8, 1, snap));
          out = pos;
        }
        const pn = nearfall - 0.14 * (s / sA);
        if (nearfall > 0 && pn > 0) { const d = disp(pn); out = add(out, d); }
        return out;
      };
      const farPt = (s) => {
        const P0 = ropeP(s, sway, sag);
        let out = P0;
        if (s > sF) { const slack = [0.035 * Math.sin((0.5 - P0[2]) * 14), 0.43, P0[2]]; out = [lerp(P0[0], slack[0], E3(kS)), lerp(P0[1], slack[1], E3(kS)), lerp(P0[2], slack[2], E3(kS))]; }
        else if (snap > 0) {
          const a = arcFar(s) * kF, u = clamp(a / LHF), v = sub(P0, pivF), r = Math.hypot(...v), d0 = mul(v, 1 / (r || 1)), k = clamp(1.3 * snap - 0.3 * u), E = E3(k);
          const dir = unit(add(mul(d0, 1 - E), mul([0, -1, 0], E)));
          const pos = add(pivF, mul(dir, lerp(r, a, E)));
          pos[2] += 0.03 * E;
          const w = clamp((u - 0.85) / 0.15), ang = 50 * RAD * Math.sin(Math.PI * k), L15 = 0.15 * LHF;
          pos[2] += L15 * Math.sin(ang) * w * w / 3; pos[1] += L15 * (1 - Math.cos(ang)) * w * w / 3;
          pos[0] += a * Math.sin(2 * RAD * swingA(t, 1.6) * sm(0.8, 1, snap));
          out = pos;
        }
        return out;
      };
      const sNear = []; { const N = 56; for (let i = 0; i <= N; i++) sNear.push((i / N) * (sA - 0.005)); sNear.push(sA); }
      const sNearU = [...new Set([...sNear, sL])].sort((a, b) => a - b);
      const sFar = []; { const N = 56; for (let i = 0; i <= N; i++) sFar.push(sB + (i / N) * (1 - sB)); sFar.push(sF); }
      const sFarU = [...new Set(sFar)].sort((a, b) => a - b);
      const radA = sNearU.map((s) => (s > sA - 0.0051 ? 0.03 - 0.01 * clamp((s - (sA - 0.005)) / 0.005) : 0.03)), radB = sFarU.map((s) => (s < sB + 0.0051 ? 0.02 + 0.01 * clamp((s - sB) / 0.005) : 0.03));
      const ptsA = sNearU.map(nearPt), ptsB = sFarU.map(farPt), nA = ptsA.length;
      if (!nearGone) tube(dyn, ptsA, radA, 6, ROPE, { mode: 8, h: 0.5, arcs: sNearU.map((s) => s * 10) });
      tube(dyn, ptsB, radB, 6, ROPE, { mode: 8, h: 0.5, arcs: sFarU.map((s) => s * 10) });
      // ---- the fray: stump ends, fibres, strands
      const endA = ptsA[nA - 1], TA = unit(sub(endA, ptsA[nA - 2])), endB = ptsB[0], TB = unit(sub(endB, ptsB[1]));
      const frame = (T) => { const ref = Math.abs(T[0]) > 0.9 ? [0, 0, 1] : [1, 0, 0], N1 = unit(sub(ref, mul(T, dot(T, ref)))); return [N1, crs(T, N1)]; };
      const fibres = (end, T, n, k0) => {
        const [N1, B1] = frame(T);
        for (let f = 0; f < n; f++) {
          const phi = hs(f, k0) * TAU, al = (30 + 40 * hs(f, k0 + 1)) * RAD, len = 0.05 + 0.06 * hs(f, k0 + 2), rad = add(mul(N1, Math.cos(phi)), mul(B1, Math.sin(phi))), d = unit(add(mul(T, Math.cos(al)), mul(rad, Math.sin(al)))), b = add(end, mul(rad, 0.012));
          tube(dyn, [b, add(b, mul(d, len * 0.5)), add(add(b, mul(d, len)), mul(T, -0.0))], [0.0016, 0.0013, 0.0008], 3, FLAT("#d9c08f"), { h: 0.5 });
        }
      };
      const nf = snap >= 0.08 ? 12 : 7;
      if (!nearGone) fibres(endA, TA, nf, 270);
      fibres(endB, TB, nf, 290);
      const spread = 1 + 0.385 * clamp(3 - strands, 0, 2);
      const OFF = [[0, 0.015], [0.013, -0.0075], [-0.013, -0.0075]];
      const fSnap = snap >= 0.08 ? 0.3 + 0.7 * clamp((snap - 0.08) / 0.4) : 0;
      for (let k = 0; k < 3; k++) {
        const fk = clamp(3 - k - strands), fe = Math.max(fk, fSnap), off = (T) => { const o = [OFF[k][0] * spread, OFF[k][1] * spread, 0]; return sub(o, mul(T, dot(T, o))); };
        const pale = lerpPT(PT("#c9a877", "#9c8052"), PT("#e8d6ae", "#b8a67e"), clamp(fe / 0.3));
        if (fe < 0.3) {
          if (nearGone) continue;
          const oA = off(TA), oB = off(TB), r = lerp(0.007, 0.004, fe / 0.3), pts = [0, 1 / 3, 2 / 3, 1].map((u) => add(lerp3(endA, endB, u), lerp3(oA, oB, u)));
          tube(dyn, pts, r, 5, pale, { h: 0.5 });
          if (fe > 0.01) for (let f = 0; f < 3; f++) { const m = pts[1 + (f % 2)], phi = hs(f, 280 + k) * TAU; tube(dyn, [m, add(m, [Math.cos(phi) * 0.012 * fe / 0.3, 0.006, Math.sin(phi) * 0.012 * fe / 0.3])], [0.0012, 0.0008], 3, FLAT("#e8d6ae"), { h: 0.5 }); }
        } else {
          const A = 120 * RAD * clamp((fe - 0.3) / 0.3), wd = sm(0.6, 1, fe), sw = Math.tan(10 * RAD) * Math.sin(TAU * 2.5 * (fe - 0.6)) * (1 - clamp((fe - 0.6) / 0.4)) * wd;
          for (const [end, T, sg] of [[endA, TA, 1], [endB, TB, -1]]) {
            if (end === endA && nearGone) continue;
            const o = off(T), pts = [add(end, o)];
            for (let j = 0; j < 4; j++) {
              const q0 = (j + 0.5) / 4, th = sg * A * q0, d1 = [T[0], T[1] * Math.cos(th) - T[2] * Math.sin(th), T[1] * Math.sin(th) + T[2] * Math.cos(th)];
              const d = unit(add(mul(unit(d1), 1 - wd), mul([sw, -1, 0], wd)));
              pts.push(add(pts[j], mul(d, 0.03)));
            }
            tube(dyn, pts, [0.0045, 0.004, 0.0035, 0.003, 0.0025], 4, pale, { h: 0.5 });
          }
        }
      }
      // ---- the two hanger planks, tied under the rope (drawn while snap < 0.06)
      if (hangers && snap < 0.06) {
        BRIDGE.hangers.forEach((h, i) => {
          const pi = 4 + i, s = (0.5 - h.z) / 10, rp = ropeP(s, sway, sag);
          plankQuat(pi, 0, hq); hP.set(rp[0], h.y, h.z); hM.compose(hP, hq, one);
          plankInto(dyn, pi, hM);
          const top = _v.set(0, 0.45, 0).applyQuaternion(hq).add(hP).toArray();
          tube(dyn, [rp, [lerp(rp[0], top[0], 0.5), lerp(rp[1], top[1], 0.5), lerp(rp[2], top[2], 0.5)], top], 0.0075, 4, CORD, { h: 0.5 });
        });
      }
      dyn.sync();
    },
  };
}
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const GORGE_KINDS = { gorge, bridgerope, planks };
