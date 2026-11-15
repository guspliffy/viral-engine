// Ancient aliens EP03 Atlantis, block B (15 Nov 2026), builder B1: the Sicily seabed + wreck in REAL 3D (panels 13-16, 22-24).
// Design: DESIGNS.md sections 0 and 3 (/mnt/project-files/videos/ancient-aliens/03-atlantis/), look target plates/plate-14-sicily-seabed.png.
// Brief: storyboards/series/ancient-aliens/03-atlantis/block-b/briefs/B1.md. Bench: block-b/bench/make-b-seabed.mjs (b-seabed-*-vs.png, b-seabed-sheet.png).
// Exports AT_B_SEABED_KINDS, AT_B_SEABED_GRIPS = {} (nothing here is held or stood on: the sand is the floor under the cast).
//
//   atbseabed   ONE prop at P.sicily (x, z = the place; y 0; no rotation). Local axes: the default camera on +z looking -z, +x screen right,
//               metres, real scale (Spud 0.88). Everything is lookOnly scenery (not solid, surfaceOnly); every material is a painted
//               shader of its own (light baked from one key + the shaft patches on the sand, water fog drawn in the shader), no scene lights.
//     the sand      ~120 x 120 m, pale #cdbf96. y 0 (+-1 cm ripples) in the PLAY AREA x -4..4, z -4..4 (Spud and the bars stand there) and along
//                   the bar line (from (0.45, 0.35) toward [-0.42, -0.91] for 12 m); beyond 6 m gentle dunes up to +-0.6 m. Ripple bands 0.45 m apart
//                   (real geometry within 13 m, drawn as shading beyond), darker silt in the troughs, speckle, soft contact shadows baked under
//                   every rock, jar and the wreck, moving shaft light patches.
//     the scatter   ~900 pebbles 3-15 cm, ~40 rocks 0.3-1.2 m (crust, moss, barnacles; none in the play area), ~110 shells (scallops with ribs,
//                   cockles), 2 starfish, 5 sea urchins, 1 crab by the first jar. Nothing within 0.45 m of the bar line.
//     the grass     ~200 tufts of ribbon blades 0.4-0.9 m (bent, lighter tips), thick at the frame edges and round the rocks, none inside the
//                   play area; sway on t (spec.sway).
//     THE WRECK     a hull 15 x 4.5, long axis from (-9, -6) (stern, left-back) to (4, -13) (bow, receding right), keel, 11 rib pairs 0.6-2.4 high
//                   (curved square timbers with tool marks, broken tops), 5 side planks (2 + 1 attached, 2 fallen), 3 thwarts, stern post with
//                   a capped top and studs, 6 pieces of debris, leaning 12 deg, sunk into the sand with sand lips, weed hanging, barnacles,
//                   worm holes, moss; dark wood #3a2e26 with lit edges.
//     5 amphoras    #a8553a, 0.9 tall (lathe: neck, two handles, pointed foot, chipped lips, crust, barnacles): two by the wreck's left end
//                   (front-left), two at the right (x 4..6, z -5..-3), one by the hull.
//     depth         three rings of rock outcrops at ~17, ~33 and ~52 m round the place (each bluer and paler by the fog), the arch rock in the
//                   33 m layer at the back right.
//     the water     backdrop sphere (the surface seen from below at y +15 with moving ripples, graded by view elevation), distance fog on every
//                   material 1 - exp(-(d / fog)^1.4), 8 additive light shafts (soft, drifting), 1800 silt motes.
//   spec: seed 1 (shifts the scatter), sway 1 (grass sway strength; 0 = still), shafts 1 (shaft strength; 0 = off), silt 1 (silt strength; 0 = off),
//         fog 35 (the fog length in metres, ~25 % at 15 m). Params: none (all motion from the clip clock t).
//   Camera notes: the cameras of the brief stand at y 0.55-1.2 over the sand; anything a camera passes within 0.3 m of is not specially handled.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export const AT_B_SEABED_GRIPS = {};

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;
// integer hash -> 0..1 (no Math.random, no clock)
function hi(i, j = 0, k = 0) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(k | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
function stream(seed) { let s = (Math.imul(seed | 0, 2654435761) ^ 0x9e3779b9) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function vn(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hi(ix, iz, 5), hi(ix + 1, iz, 5), ux), lerp(hi(ix, iz + 1, 5), hi(ix + 1, iz + 1, 5), ux), uz);
}
function vn3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hi(ix + a, iy + b, iz + c);
  return lerp(lerp(lerp(h(0, 0, 0), h(1, 0, 0), ux), lerp(h(0, 1, 0), h(1, 1, 0), ux), uy), lerp(lerp(h(0, 0, 1), h(1, 0, 1), ux), lerp(h(0, 1, 1), h(1, 1, 1), ux), uy), uz);
}
const COL = (hex) => new THREE.Color(hex);
const V3G = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
const mix = (a, b, k) => COL(a).lerp(COL(b), k);

// ------------------------------------------------------------------------------------------------ the world numbers
const BAR0 = [0.45, 0.35], BARD = (() => { const l = Math.hypot(-0.42, -0.91); return [-0.42 / l, -0.91 / l]; })();
// the hull: 18 x 5.5, its near end left of centre of camera A, the axis turned so the near (camera-side) rail meets the end of the bar line (~10.7 m out)
const WRECK = (() => {
  const W = { L: 18, W: 5.5, roll: -9 * D2R, sink: -0.2, x0: -7.0, z0: -1.0 }, h = W.W / 2; let best = 9, th0 = 0.1;
  for (let th = 0; th < 0.7; th += 0.002) {
    const D = [Math.sin(th), -Math.cos(th)], N = [Math.cos(th), Math.sin(th)];
    const rx = BAR0[0] - W.x0 - h * N[0], rz = BAR0[1] - W.z0 - h * N[1];   // solve u*D - t*BARD = r
    const det = -D[0] * BARD[1] + D[1] * BARD[0]; if (Math.abs(det) < 1e-6) continue;
    const u = (-rx * BARD[1] + rz * BARD[0]) / det, t = (D[0] * rz - D[1] * rx) / det;
    if (u > 3 && u < 15 && Math.abs(t - 10.7) < best) { best = Math.abs(t - 10.7); th0 = th; }
  }
  W.th = th0; W.x1 = W.x0 + Math.sin(th0) * W.L; W.z1 = W.z0 - Math.cos(th0) * W.L; return W;
})();
const WLEN = WRECK.L;
const WDIR = [Math.sin(WRECK.th), -Math.cos(WRECK.th)];
const WYAW = Math.atan2(-WDIR[1], WDIR[0]);   // Ry(yaw) takes local +x to WDIR
function distBar(x, z) {   // distance to the bar line segment (0..13 m)
  const dx = x - BAR0[0], dz = z - BAR0[1], t = clamp(dx * BARD[0] + dz * BARD[1], 0, 13);
  return Math.hypot(dx - BARD[0] * t, dz - BARD[1] * t);
}
function distBarW(x, z) {   // the bars end 10.7 m out at the hull's rail: timber keeps off the line up to there
  const dx = x - BAR0[0], dz = z - BAR0[1], t = clamp(dx * BARD[0] + dz * BARD[1], 0, 11.2);
  return Math.hypot(dx - BARD[0] * t, dz - BARD[1] * t);
}
function distWreck(x, z) {
  const dx = x - WRECK.x0, dz = z - WRECK.z0, t = clamp(dx * WDIR[0] + dz * WDIR[1], 0, WLEN);
  return Math.hypot(dx - WDIR[0] * t, dz - WDIR[1] * t);
}
const inPlay = (x, z, m = 0) => Math.abs(x) < 4 + m && Math.abs(z) < 4 + m;

// the ripple field (the same formula runs in the sand shader): q is a distance in metres across the bands
const ripq = (x, z) => x * 0.3 + z * 0.93 + 0.4 * Math.sin(1.7 * x + 0.4 * z) + 1.9 * Math.sin(0.12 * x + 0.2 * z + 0.7) + 0.9 * Math.sin(0.07 * x - 0.13 * z + 2.0) + 0.45 * Math.sin(0.5 * x + 0.37 * z) + 0.25 * Math.sin(0.9 * x - 0.6 * z);
function ripple(x, z) { const a = (TAU * ripq(x, z)) / (0.34 + 0.22 * (0.5 + 0.5 * Math.sin(0.21 * x - 0.17 * z + 1.0))), env = 0.08 + 0.92 * sstep(-0.1, 0.5, Math.sin(0.9 * x - 0.6 * z + 1.1) * Math.sin(0.5 * x + 0.7 * z + 0.5)); return env * (Math.sin(a) + 0.22 * Math.sin(2 * a + 1)) * 0.82; }
function dunes(x, z) {
  const r = Math.hypot(x, z), flat = Math.max(1 - sstep(3.0, 6.5, distWreck(x, z)), 1 - sstep(0.7, 2.6, distBar(x, z)));
  const m = sstep(5.5, 10, r) * (1 - flat);
  return m * clamp(0.40 * Math.sin(x * 0.17 + z * 0.06 + 1.3) + 0.28 * Math.sin(z * 0.14 - x * 0.1 + 0.4) + 0.5 * (vn(x * 0.07 + 3, z * 0.07 + 9) - 0.5), -0.6, 0.6);
}
const rippleAmp = (x, z) => (0.006 + 0.014 * sstep(4, 9, Math.hypot(x, z))) * (1 - sstep(9, 13, Math.max(Math.abs(x), Math.abs(z))));
const sandY = (x, z) => dunes(x, z) + rippleAmp(x, z) * ripple(x, z);

// ------------------------------------------------------------------------------------------------ geometry helpers
// an indexed-free triangle accumulator: position, normal, uv, colour, seed
class Acc {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.s = []; this.r = []; }
  vert(p, n, u, c, s) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.u.push(u[0], u[1]); this.c.push(c.r, c.g, c.b); this.s.push(s); }
  quad(a, b, c, d, n, ua, ub, uc, ud, col, s) {   // a b c d counter-clockwise seen from the normal side
    const nn = n || new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    this.vert(a, nn, ua, col, s); this.vert(b, nn, ub, col, s); this.vert(c, nn, uc, col, s);
    this.vert(a, nn, ua, col, s); this.vert(c, nn, uc, col, s); this.vert(d, nn, ud, col, s);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute("aSeed", new THREE.Float32BufferAttribute(this.s, 1));
    return g;
  }
}
// a three.js geometry -> non-indexed with position, normal, uv, colour (one colour or a fn(x,y,z)), aSeed, transformed by m4
function prep(geo, m4, color, seed = 0) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (m4) g.applyMatrix4(m4);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), P = g.attributes.position;
  for (let i = 0; i < n; i++) {
    const k = typeof color === "function" ? color(P.getX(i), P.getY(i), P.getZ(i), i) : color;
    c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(n).fill(seed), 1));
  return g;
}
const merge = (list) => mergeGeometries(list, false);
const M4 = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
// a smooth displaced blob (icosphere run through f(dir) -> radius), welded so the normals are smooth
function blobGeo(detail, f) {
  let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4);
  const P = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).normalize(); const r = f(v); P.setXYZ(i, v.x * r, v.y * r, v.z * r); }
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------------------------------------ shaders
const GLSL_DECL = `
uniform float uTime, uFog, uShaftK, uBump;
uniform vec3 uKey;
uniform vec4 uSh[8];
varying vec3 vL; varying vec3 vMV; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying vec3 vO; varying float vS;
`;
const GLSL_NOISE = `
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
// round dots on a 3D cell grid: prob = how many cells hold one, rad = radius in cell units
float dots3(vec3 p, float rad, float prob) {
  vec3 i = floor(p), f = fract(p); float h = h31(i); if (h > prob) return 0.0;
  vec3 c = vec3(h31(i + 11.1), h31(i + 23.7), h31(i + 5.3)) * 0.6 + 0.2; float r = rad * (0.6 + 0.8 * h31(i + 9.9));
  return smoothstep(r, r * 0.55, length(f - c));
}
float dots2(vec2 p, float rad, float prob) {
  vec2 i = floor(p), f = fract(p); float h = h21(i); if (h > prob) return 0.0;
  vec2 c = vec2(h21(i + 11.1), h21(i + 23.7)) * 0.6 + 0.2; float r = rad * (0.6 + 0.8 * h21(i + 9.9));
  return smoothstep(r, r * 0.55, length(f - c));
}
vec3 waterCol(float e) {
  vec3 c = mix(${V3G("#0f5560")}, ${V3G("#2a8f96")}, smoothstep(-0.5, 0.0, e));
  c = mix(c, ${V3G("#3aa7ad")}, smoothstep(0.0, 0.5, e));
  return mix(c, ${V3G("#8fd8d0")}, smoothstep(0.45, 1.0, e));
}
`;
const GLSL_COMMON = GLSL_DECL + GLSL_NOISE + `
float shaftSum(vec2 xz) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) { vec2 d = xz - uSh[i].xy; float r = uSh[i].z; s += exp(-dot(d, d) / (r * r)) * (0.78 + 0.22 * sin(uTime * 0.7 + uSh[i].w + xz.x * 0.9)); }
  return s * uShaftK;
}
// baked light: one key from above-right, soft; cool teal in the shade
vec3 lighting(vec3 base, vec3 n, float ao) {
  float k = smoothstep(-0.30, 0.95, dot(n, uKey));
  vec3 L = mix(vec3(0.52, 0.72, 0.78), vec3(1.07, 1.05, 0.97), k);
  return base * L * ao;
}
vec3 finish(vec3 col) {
  float d = length(vMV); vec3 dw = transpose(mat3(viewMatrix)) * (vMV / max(d, 0.001));
  float f = 1.0 - exp(-pow(d / uFog, 1.4));
  col *= exp(-d * vec3(0.024, 0.010, 0.006));   // the warm colours die first
  return mix(col, waterCol(min(dw.y, 0.3)), f);
}
`;
const VS = `
attribute float aSeed;
#ifdef SWAY
attribute vec3 aRoot; attribute float aSw;
uniform float uSway;
#endif
${GLSL_COMMON}
void main() {
  vec3 p = position;
  #ifdef SWAY
    float ph = aRoot.x * 0.9 + aRoot.z * 0.6 + aSeed * 6.2832; float b = uv.y * uv.y;
    p.x += uSway * aSw * b * (0.55 * sin(uTime * 1.15 + ph) + 0.25 * sin(uTime * 2.7 + ph * 1.9) + 0.4 * sin(uTime * 0.55 + aRoot.x * 0.35));
    p.z += uSway * aSw * b * (0.35 * sin(uTime * 0.9 + ph * 1.3 + 1.0));
  #endif
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix; mat3 nm = transpose(inverse(mat3(im)));
  #else
    mat4 im = mat4(1.0); mat3 nm = mat3(1.0);
  #endif
  vec4 lp = im * vec4(p, 1.0); vL = lp.xyz; vec4 mv = modelViewMatrix * lp; vMV = mv.xyz;
  vN = normalize(nm * normal); vUv = uv; vS = aSeed; vO = position + vec3(aSeed * 7.13, aSeed * 3.71, aSeed * 5.37);
  vC = color;
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  gl_Position = projectionMatrix * mv;
}`;
const FS_HEAD = `${GLSL_COMMON}
vec3 surf(vec3 base, inout vec3 n, inout float ao);
void main() {
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float ao = mix(0.62, 1.0, smoothstep(-0.25, 0.5, vL.y));
  vec3 col = surf(vC, n, ao);
  gl_FragColor = vec4(finish(lighting(col, n, ao)), 1.0);
  #include <colorspace_fragment>
}`;
const SURF = {
  plain: `vec3 surf(vec3 base, inout vec3 n, inout float ao) { return base * (0.9 + 0.2 * vn3(vO * 22.0)); }`,
  grass: `vec3 surf(vec3 base, inout vec3 n, inout float ao) { ao = 1.0; float rib = smoothstep(0.16, 0.0, abs(vUv.x - 0.5)); return base * (1.0 + 0.22 * rib) * (0.92 + 0.14 * vn2(vec2(vUv.x * 3.0, vUv.y * 9.0 + vS * 40.0))); }`,
  sand: `
vec3 surf(vec3 base, inout vec3 n, inout float ao) {
  ao = 1.0; vec2 p = vL.xz; float d = length(vMV);
  float fadeR = 1.0 - smoothstep(5.0, 15.0, d);
  float eps = 0.02;
  float ripC = rip(p), gx = (rip(p + vec2(eps, 0.0)) - ripC) / eps, gz = (rip(p + vec2(0.0, eps)) - ripC) / eps;
  n = normalize(n + vec3(-gx, 0.0, -gz) * (uBump * fadeR));
  vec3 c = base;
  float tr = ripC * fadeR;
  c = mix(c, c * vec3(0.78, 0.80, 0.78) + vec3(0.0, 0.01, 0.015), smoothstep(0.2, -0.9, tr) * 0.09);   // silt in the troughs
  c = mix(c, c * vec3(1.06, 1.06, 1.0), smoothstep(0.3, 1.0, tr) * 0.10);   // pale crests
  float fa = 1.0 - smoothstep(10.0, 34.0, d), fb = 1.0 - smoothstep(4.0, 16.0, d);
  float dk = dots2(p * 44.0, 0.26, 0.24) * fa, lt = dots2(p * 36.0 + 7.0, 0.26, 0.12) * fa, bl = dots2(p * 19.0 + 3.0, 0.24, 0.05) * fb, wh = dots2(p * 12.0 + 9.0, 0.28, 0.018) * fb;
  c = mix(c, c * vec3(0.60, 0.56, 0.50), dk * 0.7); c = mix(c, vec3(0.92, 0.88, 0.76), lt * 0.32); c = mix(c, vec3(0.34, 0.42, 0.46), bl * 0.6); c = mix(c, vec3(0.90, 0.88, 0.80), wh * 0.7);
  // short pencil dashes along the ripple crests
  float dash = smoothstep(0.55, 0.9, vn2(vec2(ripq(p) * 4.2, dot(p, vec2(0.98, -0.18)) * 1.6))) * smoothstep(0.2, 0.8, ripC) * fb; c *= 1.0 - 0.10 * dash;
  c *= 0.9 + 0.2 * vn2(p * 0.16 + 4.0);
  // the light of the shafts laid on the sand, with a moving net of caustic lines
  float sh = shaftSum(p);
  vec2 q = p * 0.9; float w = vn2(q + vec2(uTime * 0.11, uTime * 0.07)) * 0.6 + vn2(q * 2.1 - vec2(uTime * 0.14, -uTime * 0.09) + 5.0) * 0.4;
  float net = smoothstep(0.07, 0.0, abs(w - 0.5));
  c *= 1.0 + sh * (0.30 + 0.45 * net) * vec3(1.0, 0.98, 0.82);
  return c;
}`,
  rock: `
vec3 surf(vec3 base, inout vec3 n, inout float ao) {
  vec3 p = vO * RK;
  float strata = vn3(vec3(p.x * 0.8, p.y * 6.0, p.z * 0.8)); vec3 c = base * (0.80 + 0.30 * strata);
  c *= 0.84 + 0.30 * vn3(p * 6.5) * vn3(p * 2.0 + 1.0) * 1.6;
  float lich = smoothstep(0.60, 0.78, vn3(p * 4.2 + 3.0)), lich2 = smoothstep(0.64, 0.80, vn3(p * 3.0 + 11.0));
  c = mix(c, vec3(0.58, 0.54, 0.34), lich * 0.38); c = mix(c, vec3(0.62, 0.40, 0.24), lich2 * 0.28);
  float up = smoothstep(0.10, 0.75, n.y + 0.45 * (vn3(p * 2.6 + 5.0) - 0.5));
  float moss = up * smoothstep(0.42, 0.66, vn3(p * 3.4 + 21.0));
  vec3 mc = mix(vec3(0.15, 0.30, 0.12), vec3(0.30, 0.44, 0.16), vn3(p * 24.0));
  c = mix(c, mc, moss * 0.8);
  #ifndef FAR
    float bn = dots3(p * 15.0, 0.30, 0.34) * smoothstep(0.30, 0.6, vn3(p * 2.0 + 7.0)); c = mix(c, vec3(0.86, 0.85, 0.78), bn * 0.9);
    float bn2 = dots3(p * 15.0, 0.44, 0.34) * (1.0 - bn); c *= 1.0 - 0.18 * bn2 * smoothstep(0.30, 0.6, vn3(p * 2.0 + 7.0));
    float pit = dots3(p * 27.0 + 4.0, 0.20, 0.16); c *= 1.0 - 0.38 * pit;
  #endif
  return c;
}`,
  wood: `
vec3 surf(vec3 base, inout vec3 n, inout float ao) {
  vec3 c = base; float u = vUv.x, v = vUv.y;
  float grain = vn2(vec2(u * 34.0 + vS * 9.0, v * 0.9)); c *= 0.78 + 0.44 * grain;
  float bl = smoothstep(0.55, 0.8, vn2(vec2(u * 5.0 + vS * 3.0, v * 0.5 + 2.0))); c = mix(c, vec3(0.34, 0.31, 0.27), bl * 0.55);   // bleached streaks
  // adze marks: slanted short strokes, each cell its own place and strength
  vec2 g = vec2(u * 6.0, v * 4.2); vec2 cell = floor(g); float hc = h21(cell + vS * 13.0); vec2 f = fract(g) - 0.5;
  float stroke = smoothstep(0.075, 0.0, abs(f.y - f.x * (0.5 + hc * 0.8) + (hc - 0.5) * 0.3)) * smoothstep(0.5, 0.2, abs(f.x)) * step(0.35, hc);
  c *= 1.0 - 0.42 * stroke * hc; c += vec3(0.05, 0.045, 0.03) * stroke * (1.0 - hc);
  float edge = smoothstep(0.34, 0.5, abs(u - 0.5)); c += vec3(0.30, 0.20, 0.12) * edge * (0.5 + 0.7 * clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
  c *= vec3(1.18, 1.0, 0.86);
  vec3 p = vL;
  float low = 1.0 - smoothstep(0.1, 1.1, p.y);
  c = mix(c, vec3(0.16, 0.21, 0.11), low * 0.30 * vn3(p * 2.2));   // slime at the sand
  float up = smoothstep(-0.1, 0.6, n.y + 0.4 * (vn3(p * 3.0) - 0.5));
  float moss = up * smoothstep(0.50, 0.64, vn3(p * 6.0 + 2.0) * 0.7 + vn3(p * 17.0) * 0.3); vec3 mc = mix(vec3(0.24, 0.30, 0.10), vec3(0.45, 0.52, 0.18), vn3(p * 40.0));
  c = mix(c, mc, moss * 0.9);
  float clus = smoothstep(0.42, 0.6, vn3(p * 2.7 + 8.0)) * (0.45 + 0.55 * low);
  float bn = dots3(p * 24.0, 0.40, 0.75) * clus; c = mix(c, vec3(0.86, 0.85, 0.78), bn); c = mix(c, vec3(0.45, 0.42, 0.36), bn * smoothstep(0.1, 0.0, 0.5 - bn) * 0.0);
  float hole = dots3(p * 24.0 + 3.0, 0.20, 0.16) * (1.0 - bn); c = mix(c, vec3(0.03, 0.025, 0.02), hole);
  float ring = dots3(p * 24.0 + 3.0, 0.32, 0.16) * (1.0 - hole) * (1.0 - bn); c = mix(c, c * 1.25, ring * 0.35);
  return c;
}`,
  clay: `
vec3 surf(vec3 base, inout vec3 n, inout float ao) {
  vec3 q = vO;   // metres: every mark below has its own size
  vec3 c = base * (0.80 + 0.30 * vn3(q * 9.0) + 0.14 * vn3(q * 31.0));
  c = mix(c, c * vec3(0.66, 0.52, 0.48), smoothstep(0.56, 0.76, vn3(q * 5.0 + 20.0)) * 0.55);   // darker fired patches
  c = mix(c, vec3(0.84, 0.56, 0.24), smoothstep(0.50, 0.70, vn3(q * 5.0 + 4.0)) * 0.55);      // ochre bloom
  float low = 1.0 - smoothstep(0.0, 0.75, vL.y + 0.08 * (vn3(q * 7.0) - 0.5));
  float crust = smoothstep(0.54, 0.68, vn3(q * 8.0 + 12.0) * 0.65 + vn3(q * 23.0) * 0.35) * (0.25 + 0.75 * low);
  c = mix(c, vec3(0.66, 0.60, 0.48) * (0.85 + 0.3 * vn3(q * 70.0)), crust * 0.38);                 // lime crust, rough
  float moss = smoothstep(0.50, 0.64, vn3(q * 10.0 + 33.0)) * (0.15 + 0.85 * low) * smoothstep(0.0, 0.5, n.y + 0.5);
  c = mix(c, vec3(0.20, 0.34, 0.12) * (0.8 + 0.5 * vn3(q * 45.0)), moss * 0.55);
  float clus = smoothstep(0.46, 0.64, vn3(q * 5.5 + 17.0)) * (0.35 + 0.65 * low);
  float bn = dots3(q * 32.0, 0.38, 0.6) * clus; c = mix(c, vec3(0.92, 0.90, 0.82), bn * 0.95);
  float ring = dots3(q * 32.0, 0.5, 0.6) * clus * (1.0 - bn); c *= 1.0 - 0.28 * ring;
  float pit = dots3(q * 40.0 + 6.0, 0.22, 0.20); c *= 1.0 - 0.38 * pit;
  float fleck = dots3(q * 90.0 + 2.0, 0.30, 0.12); c = mix(c, vec3(0.28, 0.17, 0.13), fleck * 0.6);
  c *= 1.0 - 0.10 * smoothstep(0.06, 0.0, abs(fract(q.y * 6.5 + 0.35 * vn3(q * 4.0)) - 0.5));   // throwing rings
  float rim = pow(1.0 - abs(dot(n, normalize(-vMV))), 2.5); c += vec3(0.75, 0.45, 0.25) * rim * 0.45 * (0.4 + 0.6 * smoothstep(-0.2, 0.8, dot(n, uKey)));
  return c;
}`,
};
const SAND_FUNCS = `
float ripq(vec2 p) { return p.x * 0.3 + p.y * 0.93 + 0.4 * sin(1.7 * p.x + 0.4 * p.y) + 1.9 * sin(0.12 * p.x + 0.2 * p.y + 0.7) + 0.9 * sin(0.07 * p.x - 0.13 * p.y + 2.0) + 0.45 * sin(0.5 * p.x + 0.37 * p.y) + 0.25 * sin(0.9 * p.x - 0.6 * p.y); }
float rip(vec2 p) { float a = 6.2832 * ripq(p) / (0.34 + 0.22 * (0.5 + 0.5 * sin(0.21 * p.x - 0.17 * p.y + 1.0))); float env = 0.08 + 0.92 * smoothstep(-0.1, 0.5, sin(0.9 * p.x - 0.6 * p.y + 1.1) * sin(0.5 * p.x + 0.7 * p.y + 0.5)); return env * (sin(a) + 0.22 * sin(2.0 * a + 1.0)) * 0.82; }
`;

// the uniforms every material shares (one object: apply() sets them once)
function makeShared(S) {
  return {
    uTime: { value: 0 }, uFog: { value: S.fog ?? 35 }, uShaftK: { value: S.shafts ?? 1 }, uSway: { value: S.sway ?? 1 }, uBump: { value: 0.35 },
    uKey: { value: new THREE.Vector3(0.22, 0.93, 0.18).normalize() }, uSh: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    uOrg: { value: new THREE.Vector3() }, uSilt: { value: S.silt ?? 1 },
  };
}
function mkMat(U, kind, o = {}) {
  const defines = {};
  if (o.sway) defines.SWAY = "";
  if (o.far) defines.FAR = "";
  let fs = FS_HEAD + (kind === "sand" ? SAND_FUNCS : "") + SURF[kind];
  fs = fs.replace("main() {", "main() {");
  if (kind === "rock") defines.RK = (o.rk ?? 4.0).toFixed(2);
  if (kind === "rock" && !("RK" in defines)) defines.RK = "4.0";
  const m = new THREE.ShaderMaterial({ uniforms: U, defines, vertexShader: VS, fragmentShader: fs, side: o.side ?? THREE.FrontSide, fog: false, vertexColors: true });
  m.userData.noOutline = true; m.userData.noHatch = true;
  m.customProgramCacheKey = () => `atb-seabed-${kind}-${o.sway ? "s" : ""}${o.far ? "f" : ""}${o.rk ?? ""}`;
  return m;
}
function mark(o, steam = false, order = null) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = false; m.userData.surfaceOnly = true; if (steam) m.userData.steam = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}

// ------------------------------------------------------------------------------------------------ the sand
const OCC = [];   // soft contact shadows to bake into the sand: { x, z, r, k }  (filled by the builders below)
function addOcc(x, z, r, k, h = 0) { OCC.push({ x: x - 0.30 * h, z: z - 0.22 * h, r: r + 0.35 * h, k }); }
function sandGeo() {
  const parts = [];
  const lod = (half, step, hole, ripOn) => {
    const n = Math.round((2 * half) / step); step = (2 * half) / n; const pos = [], col = [], nor = [], idx = [];
    const base = COL("#d4c394"), silt = COL("#a99d78"), green = COL("#a8a874"), warm = COL("#d4c49a");
    const ys = new Float32Array((n + 1) * (n + 1));
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const x = -half + i * step, z = -half + j * step, y = dunes(x, z) + (ripOn ? rippleAmp(x, z) * ripple(x, z) : 0);
      ys[j * (n + 1) + i] = y;
      pos.push(x, y, z);
      const m1 = vn(x * 0.11 + 1, z * 0.11 + 4), m2 = vn(x * 0.37 + 8, z * 0.37 + 2);
      const c = base.clone().lerp(green, clamp((m1 - 0.5) * 1.1 + 0.15) * 0.45).lerp(warm, clamp(m2 - 0.5) * 0.5).lerp(silt, sstep(0.1, 0.9, Math.max(0, 0.5 - m1) * 1.2) * 0.25);
      let sh = 1;
      for (const o of OCC) { const dx = x - o.x, dz = z - o.z; if (dx > o.r * 2.2 || dx < -o.r * 2.2 || dz > o.r * 2.2 || dz < -o.r * 2.2) continue; sh -= o.k * Math.exp(-(dx * dx + dz * dz) / (o.r * o.r)); }
      sh = clamp(sh, 0.28, 1);
      col.push(c.r * lerp(0.86, 1, sh), c.g * lerp(0.9, 1, sh), c.b * lerp(0.98, 1, sh)); col[col.length - 3] *= sh; col[col.length - 2] *= sh; col[col.length - 1] *= lerp(sh, 1, 0.25);
    }
    const at = (i, j) => ys[Math.min(n, Math.max(0, j)) * (n + 1) + Math.min(n, Math.max(0, i))];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * step), gz = (at(i, j + 1) - at(i, j - 1)) / (2 * step), l = Math.hypot(gx, 1, gz);
      nor.push(-gx / l, 1 / l, -gz / l);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const cx = -half + (i + 0.5) * step, cz = -half + (j + 0.5) * step;
      if (hole && Math.abs(cx) < hole && Math.abs(cz) < hole) continue;
      const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((n + 1) * (n + 1) * 2), 2)); g.setAttribute("aSeed", new THREE.Float32BufferAttribute(new Float32Array((n + 1) * (n + 1)), 1));
    g.setIndex(idx); return g;
  };
  parts.push(lod(14, 0.075, 0, true));
  parts.push(lod(40, 0.4, 14, false));
  parts.push(lod(60, 2.0, 40, false));
  return parts;
}

// ------------------------------------------------------------------------------------------------ small things: pebbles, shells, starfish, urchins, crab
const PEBBLE_COLS = ["#6f8590", "#7c8a8e", "#8e8a7e", "#b08a50", "#4f6068", "#cfd0c4", "#9a7a5a", "#5f7a6e", "#a9a79a", "#7a6a60"].map(COL);
function gridGeo(nu, nv, fn) {   // indexed grid; fn(u, v) -> [x, y, z, r, g, b]
  const pos = [], col = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const r = fn(i / nu, j / nv); pos.push(r[0], r[1], r[2]); col.push(r[3], r[4], r[5]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const withColor = (g) => { const n = g.attributes.position.count, P = g.attributes.position, C = g.attributes.color, o = new Float32Array(n * 3); for (let i = 0; i < n; i++) { o[i * 3] = C.getX(i); o[i * 3 + 1] = C.getY(i); o[i * 3 + 2] = C.getZ(i); } return o; };
// colour kept through a "prep"-like step: a geometry with its own colour attribute, transformed, non-indexed, with a seed
function keepColor(geo, m4, seed = 0, tint = null) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
  if (m4) g.applyMatrix4(m4);
  if (tint) { const C = g.attributes.color; for (let i = 0; i < C.count; i++) C.setXYZ(i, C.getX(i) * tint.r, C.getY(i) * tint.g, C.getZ(i) * tint.b); }
  g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(seed), 1)); return g;
}
function scallopGeo() {   // hinge at the origin, the fan toward +z, 1 unit long; ribs and growth lines drawn
  const TH = 1.0;
  return gridGeo(34, 14, (u, v) => {
    const th = (u * 2 - 1) * TH, r = 0.04 + v * 0.96, rib = Math.cos(th * 16), ca = Math.cos(th * 0.9);
    const x = r * Math.sin(th) * 1.0, z = r * Math.cos(th) * 0.95 * 1.0, h = 0.30 * (r * (1.18 - r * 0.7)) * ca + 0.03 * rib * r * (0.6 + r) + 0.012 * Math.sin(r * 40);
    const band = 0.86 + 0.14 * rib + 0.07 * Math.sin(r * 34), pink = Math.max(0, Math.sin(r * 7 + th * 2.5)) * 0.18;
    return [x, h, z, band * (1 - pink * 0.4), band * (1 - pink * 0.9), band * (1 - pink * 0.8)];
  });
}
function cockleGeo() {   // an oval cap with radial ribs and growth rings
  return gridGeo(40, 10, (u, v) => {
    const a = u * TAU, r = v, rib = Math.cos(a * 20), sx = 1.0, sz = 0.82;
    const h = 0.46 * Math.sqrt(Math.max(0, 1 - r * r)) * (1 + 0.05 * rib * r) + 0.015 * Math.sin(r * 36);
    const band = 0.84 + 0.16 * rib * r + 0.08 * Math.sin(r * 30 + 1.0);
    return [r * Math.cos(a) * sx, h * 0.62, r * Math.sin(a) * sz, band, band * 0.98, band * 0.94];
  });
}
function starGeo() {
  const R = 1, rings = 7, seg = 60, pos = [], col = [], idx = [];
  for (let k = 0; k <= rings; k++) for (let s = 0; s < seg; s++) {
    const th = (s / seg) * TAU, arm = Math.pow(Math.abs(Math.cos(2.5 * th)), 2.4), rad = R * (0.26 + 0.74 * arm), rr = (k / rings) * rad;
    const ridge = 0.5 + 0.5 * arm, h = 0.16 * (1 - Math.pow(k / rings, 2.2)) * (0.45 + 0.55 * ridge) + 0.02;
    pos.push(Math.cos(th) * rr, h, Math.sin(th) * rr);
    const spot = (k % 2 === 0 && arm > 0.3) ? 1.0 : 0.0, base = hi(s * 3 + k, 4) * 0.12;
    col.push(0.86 - 0.18 * spot + base, 0.45 - 0.14 * spot + base * 0.5, 0.20 - 0.06 * spot);
  }
  for (let k = 0; k < rings; k++) for (let s = 0; s < seg; s++) { const a = k * seg + s, b = k * seg + ((s + 1) % seg), c = (k + 1) * seg + s, d = (k + 1) * seg + ((s + 1) % seg); idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (g.attributes.normal.getY(3 * seg + 5) < 0) { const ia = g.index.array; for (let i = 0; i < ia.length; i += 3) { const t = ia[i + 1]; ia[i + 1] = ia[i + 2]; ia[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}
function urchinGeo(seed) {
  const list = [prep(new THREE.IcosahedronGeometry(0.042, 1), M4(0, 0.03, 0, 0, 1, 0.8, 1), COL("#3a2a4f"))];
  const N = 70;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 1.7, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963 + seed;
    const d = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).normalize(), L = 0.05 + 0.025 * hi(i, seed);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), m = new THREE.Matrix4().compose(d.clone().multiplyScalar(0.04).add(new THREE.Vector3(0, 0.03, 0)), q, new THREE.Vector3(1, L / 0.05, 1));
    list.push(prep(new THREE.ConeGeometry(0.0042, 0.05, 5).translate(0, 0.025, 0), m, (x, yy) => mix("#4a3868", "#8a7aa8", clamp(yy * 1.2))));
  }
  return merge(list);
}
function crabGeo() {
  const sh = COL("#c85a3a"), dark = COL("#8a3a2a"), pale = COL("#e6a070"), list = [];
  list.push(prep(new THREE.SphereGeometry(0.05, 14, 10), M4(0, 0.03, 0, 0, 1.25, 0.5, 0.9), (x, y) => (y > 0.04 ? sh.clone().lerp(pale, 0.2) : sh)));
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {   // four legs a side: two segments
      const z0 = -0.02 + k * 0.016, ang = (k - 1.5) * 0.28, ex = s * 0.095, ey = 0.045 + (k % 2) * 0.006;
      list.push(prep(new THREE.CylinderGeometry(0.0045, 0.0035, 0.07, 5).rotateZ(Math.PI / 2 * -s * 0.0).translate(0, 0.035, 0), (() => { const m = new THREE.Matrix4().compose(new THREE.Vector3(s * 0.052, 0.034, z0), new THREE.Quaternion().setFromEuler(new THREE.Euler(ang * 0.4, ang, -s * 1.15)), new THREE.Vector3(1, 1, 1)); return m; })(), dark));
      list.push(prep(new THREE.CylinderGeometry(0.0035, 0.003, 0.06, 5).translate(0, -0.03, 0), (() => new THREE.Matrix4().compose(new THREE.Vector3(s * 0.11, 0.058, z0 + ang * 0.03), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ang, s * 0.28)), new THREE.Vector3(1, 1, 1)))(), dark));
    }
    // the claw: an arm forward and a big pincer
    list.push(prep(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6).translate(0, 0.03, 0), new THREE.Matrix4().compose(new THREE.Vector3(s * 0.05, 0.035, 0.03), new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, s * -0.25, 0)), new THREE.Vector3(1, 1, 1)), sh));
    list.push(prep(new THREE.SphereGeometry(0.022, 10, 8), M4(s * 0.07, 0.05, 0.085, s * 0.3, 1.0, 0.7, 1.5), pale));
    list.push(prep(new THREE.ConeGeometry(0.012, 0.04, 6).rotateX(Math.PI / 2), M4(s * 0.075, 0.05, 0.12, s * 0.4), sh));
    list.push(prep(new THREE.CylinderGeometry(0.0018, 0.0018, 0.025, 4).translate(0, 0.012, 0), M4(s * 0.016, 0.055, 0.045), dark));
    list.push(prep(new THREE.SphereGeometry(0.0062, 6, 5), M4(s * 0.016, 0.082, 0.045), COL("#101010")));
  }
  return merge(list);
}

// ------------------------------------------------------------------------------------------------ grass blades
function bladeGeo(blades) {
  const pos = [], nor = [], uv = [], col = [], seed = [], root = [], sw = [], idx = [];
  const SEG = 6;
  blades.forEach((b, bi) => {
    const f = [Math.cos(b.yaw), Math.sin(b.yaw)], sd = [-f[1], f[0]], base = pos.length / 3, c0 = b.c0, c1 = b.c1;
    for (let k = 0; k <= SEG; k++) {
      const t = k / SEG, hz = b.h * (b.lean * t + b.bend * t * t), curve = b.bend * t;
      const y = b.hang ? -b.h * t * (1 - 0.15 * t) : b.h * t * (1 - 0.32 * curve * curve), w = b.w * (1 - Math.pow(t, 1.7) * 0.94) * 0.5, tw = b.twist * t;
      const cx = b.x + f[0] * hz, cz = b.z + f[1] * hz, cy = b.y + y;
      const sx = sd[0] * Math.cos(tw) , sz = sd[1] * Math.cos(tw), sy = Math.sin(tw);
      for (const sgn of [-1, 1]) {
        pos.push(cx + sx * w * sgn, cy + sy * w * sgn, cz + sz * w * sgn);
        const tt = Math.pow(t, 1.1), k2 = 0.9 + 0.2 * hi(bi, 3);
        col.push(lerp(c0.r, c1.r, tt) * k2, lerp(c0.g, c1.g, tt) * k2, lerp(c0.b, c1.b, tt) * k2);
        uv.push(sgn < 0 ? 0 : 1, t); seed.push(b.seed); root.push(b.x, b.y, b.z); sw.push(b.sw);
        nor.push(f[0] * 0.4 - 0, 0.15, f[1] * 0.4);   // facing the blade's lean side (fixed up below)
      }
    }
    for (let k = 0; k < SEG; k++) { const a = base + k * 2, bb = a + 1, c = a + 2, d = a + 3; idx.push(a, bb, c, bb, d, c); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1)); g.setAttribute("aRoot", new THREE.Float32BufferAttribute(root, 3)); g.setAttribute("aSw", new THREE.Float32BufferAttribute(sw, 1));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------------------------------------ amphora
const AMPH_PROFILE = [[0.0, 0.0], [0.022, 0.025], [0.06, 0.075], [0.125, 0.16], [0.19, 0.265], [0.245, 0.37], [0.268, 0.46], [0.262, 0.545], [0.225, 0.63], [0.165, 0.705], [0.112, 0.765], [0.088, 0.805], [0.084, 0.835], [0.092, 0.862], [0.118, 0.885], [0.122, 0.9], [0.100, 0.9], [0.075, 0.88]];
function amphoraGeo(seed) {
  const pts = AMPH_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  let body = new THREE.LatheGeometry(pts, 30); body.deleteAttribute("uv"); body = mergeVertices(body, 1e-4);
  const P = body.attributes.position;
  for (let i = 0; i < P.count; i++) {   // the potter's wobble, chipped lip, dents in the belly
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), th = Math.atan2(z, x), r = Math.hypot(x, z);
    let dy = 0, k = 1 + 0.018 * Math.sin(th * 3 + seed) + 0.012 * Math.sin(y * 17 + seed * 2);
    if (y > 0.87) { const ch = hi(Math.round((th + Math.PI) * 5), seed); dy = ch > 0.7 ? -0.035 * (ch - 0.7) / 0.3 : 0; k *= ch > 0.82 ? 0.92 : 1; }
    if (y > 0.3 && y < 0.6) k *= 1 - 0.05 * sstep(0.7, 1, Math.sin(th * 2 + seed * 3) * Math.sin(y * 25));
    P.setXYZ(i, x * k, y + dy, z * k); void r;
  }
  body.computeVertexNormals();
  const list = [prep(body, null, COL("#bb6840")), prep(new THREE.CircleGeometry(0.088, 18).rotateX(-Math.PI / 2), M4(0, 0.872, 0), COL("#160d0a"))];
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.088, 0.822, 0), new THREE.Vector3(s * 0.158, 0.885, 0), new THREE.Vector3(s * 0.236, 0.835, 0), new THREE.Vector3(s * 0.248, 0.73, 0), new THREE.Vector3(s * 0.228, 0.63, 0)]);
    const tube = new THREE.TubeGeometry(curve, 14, 0.03, 7, false); tube.scale(1, 1, 0.78);
    list.push(prep(tube, null, COL("#b0603a")));
  }
  return merge(list);
}

// ------------------------------------------------------------------------------------------------ the wreck
const hb = (u) => (WRECK.W / 2) * Math.pow(Math.sin(Math.PI * (0.035 + 0.93 * (u / WRECK.L))), 0.55) * (1 - 0.15 * (u / WRECK.L));
const Hh = (u) => 4.4 - 1.3 * (u / WRECK.L);
const hullPt = (u, side, phi, off = 0) => new THREE.Vector3(u, Hh(u) * (1 - Math.cos(phi)) - 0.15, side * (hb(u) + off) * Math.sin(phi));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// a square-section timber swept along pts; bHint(i) = the thickness direction, w x t the section (w1 x t1 at the far end)
function sweep(acc, pts, o) {
  const n = pts.length, T = [], A = [], B = [], len = [0];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], t = new THREE.Vector3().subVectors(b, a).normalize();
    const h = o.bHint(i, pts[i]), aa = new THREE.Vector3().crossVectors(t, h).normalize(), bb = new THREE.Vector3().crossVectors(aa, t).normalize();
    T.push(t); A.push(aa); B.push(bb); if (i) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
  }
  const rings = pts.map((p, i) => {
    const k = n > 1 ? i / (n - 1) : 0, w = lerp(o.w, o.w1 ?? o.w, k) * 0.5, t = lerp(o.t, o.t1 ?? o.t, k) * 0.5;
    const cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sa, sb], c) => {
      const q = p.clone().addScaledVector(A[i], sa * w).addScaledVector(B[i], sb * t);
      if (i === n - 1 && o.jag) q.addScaledVector(T[i], -o.jag * hi(o.seed * 7 + c, 3) * (c % 2 ? 1 : 0.35));
      if (o.rough) q.addScaledVector(A[i], (hi(o.seed * 3 + i, c, 1) - 0.5) * o.rough).addScaledVector(B[i], (hi(o.seed * 5 + i, c, 2) - 0.5) * o.rough);
      return q;
    });
    return cs;
  });
  const col = o.col.clone().multiplyScalar(0.85 + 0.3 * hi(o.seed, 1)), cap = o.cap ?? col.clone().lerp(COL("#a89070"), 0.55);
  const nrm = (i, f) => { const [sa, sb] = [[0, 1], [-1, 0], [0, -1], [1, 0]][f]; return A[i].clone().multiplyScalar(sa).addScaledVector(B[i], sb); };
  for (let i = 0; i < n - 1; i++) for (let f = 0; f < 4; f++) {
    const f1 = (f + 1) % 4, a = rings[i][f], b = rings[i][f1], c = rings[i + 1][f1], d = rings[i + 1][f];
    const nn = nrm(i, f).add(nrm(i + 1, f)).normalize(), v0 = len[i], v1 = len[i + 1];
    const g = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (g.dot(nn) >= 0) acc.quad(a, b, c, d, nn, [0, v0], [1, v0], [1, v1], [0, v1], col, o.seed);
    else acc.quad(b, a, d, c, nn, [1, v0], [0, v0], [0, v1], [1, v1], col, o.seed);
  }
  for (const [i, sgn] of [[0, -1], [n - 1, 1]]) {
    const r = rings[i], nn = T[i].clone().multiplyScalar(sgn), g = new THREE.Vector3().subVectors(r[1], r[0]).cross(new THREE.Vector3().subVectors(r[2], r[0]));
    if (i === 0 && o.noStartCap) continue;
    if (g.dot(nn) >= 0) acc.quad(r[0], r[1], r[2], r[3], nn, [0, 0], [1, 0], [1, 1], [0, 1], cap, o.seed); else acc.quad(r[1], r[0], r[3], r[2], nn, [1, 0], [0, 0], [0, 1], [1, 1], cap, o.seed);
  }
}
const WOOD = COL("#3a2e26");
function buildWreck(wm) {
  const L = WRECK.L, acc = new Acc(), weed = [], studs = [];
  const blocked = (pts, lim = 0.55) => pts.some((p) => { const q = p.clone().applyMatrix4(wm); return distBarW(q.x, q.z) < lim; });   // timber stays off the bar line
  const sinkY = WRECK.sink, ribTops = [];
  // keel, the tall curved post at the near end (u 0) with its capped head and studs, the stem at the far end
  const keel = []; for (let i = 0; i <= 16; i++) { const u = -0.3 + (i / 16) * (L + 0.6); keel.push(V(u, -0.17 + 0.05 * Math.sin(u * 0.4) + (u > L - 1.5 ? (u - (L - 1.5)) * 0.1 : 0), 0.03 * Math.sin(u * 0.7))); }
  sweep(acc, keel, { w: 0.48, t: 0.36, w1: 0.38, t1: 0.30, bHint: () => V(0, 1, 0), col: WOOD, seed: 1, jag: 0.2 });
  const post = []; for (let i = 0; i <= 12; i++) { const k = i / 12; post.push(V(-0.3 - 0.9 * Math.pow(k, 2.2), -0.4 + k * 4.9, 0.05 * Math.sin(k * 3))); }
  sweep(acc, post, { w: 0.50, t: 0.44, w1: 0.38, t1: 0.34, bHint: () => V(0, 0, 1), col: WOOD.clone().multiplyScalar(0.95), seed: 2, rough: 0.025 });
  { const m = new THREE.Matrix4().compose(post[12].clone().add(V(0, 0.12, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.1, -0.2)), new THREE.Vector3(1, 1, 1)); mergeInto(acc, prep(new THREE.BoxGeometry(0.66, 0.36, 0.58), m, WOOD.clone().multiplyScalar(1.1)), 3); }
  for (let i = 0; i < 9; i++) { const k = 0.3 + i * 0.07, q = post[Math.min(12, Math.round(k * 12))]; for (const z of [0.2, -0.2]) studs.push(V(q.x + 0.02, -0.4 + k * 4.9 + (i % 2) * 0.05, z)); }
  weed.push({ p: post[8].clone().add(V(0, 0, 0.2)), n: 10, L: 0.5 }, { p: post[10].clone().add(V(0, 0, -0.2)), n: 8, L: 0.45 });
  const stem = []; for (let i = 0; i <= 9; i++) { const k = i / 9; stem.push(V(L + 0.2 + 0.7 * k * k, -0.3 + k * 2.4, -0.05 * k)); }
  sweep(acc, stem, { w: 0.40, t: 0.34, bHint: () => V(0, 0, 1), col: WOOD, seed: 4, jag: 0.25 });
  // 12 rib pairs, each ONE continuous U rising from the keel, flaring out, broken at its own heights per side
  const NR = 12;
  for (let i = 0; i < NR; i++) {
    const u = 1.3 + i * ((L - 3.4) / (NR - 1)), s = u / L, parts = {};
    for (const side of [-1, 1]) {
      const near = side > 0, base = (3.4 - 2.55 * s) * (near ? 0.92 : 0.85), Hr = clamp(base + (hi(i, near ? 1 : 2, 7) - 0.5) * 0.9, 0.8, 3.4) * (hi(i, near ? 3 : 4, 8) < 0.15 ? 0.6 : 1);
      const yTop = Hr - sinkY, phiTop = Math.acos(clamp(1 - (yTop + 0.15) / Hh(u), -0.3, 0.97)), N = 9, pts = [];
      for (let k = 0; k <= N; k++) { const phi = lerp(0.0, phiTop, k / N); const q = hullPt(u + (hi(i, side, 9) - 0.5) * 0.05, side, phi, 0); q.x += 0.03 * Math.sin(k + i); pts.push(q); }
      parts[side] = { pts, phiTop, ok: !blocked(pts, 0.8) };
    }
    const far = parts[-1], nea = parts[1]; if (!far.ok && !nea.ok) continue;
    const seq = [];   // psi from the far top down to the keel and up the near side
    if (far.ok) for (let k = far.pts.length - 1; k >= 1; k--) seq.push({ q: far.pts[k], psi: -lerp(0, far.phiTop, k / 9) });
    seq.push({ q: far.pts[0].clone(), psi: 0 });
    if (nea.ok) for (let k = 1; k < nea.pts.length; k++) seq.push({ q: nea.pts[k], psi: lerp(0, nea.phiTop, k / 9) });
    const pts = seq.map((e) => e.q), nrm = (k) => { const psi = seq[k].psi; return V(0, -hb(u) * Math.cos(psi), Hh(u) * Math.sin(psi)).normalize(); };
    sweep(acc, pts, { w: 0.40 - 0.05 * s, t: 0.38, w1: 0.30 - 0.04 * s, t1: 0.28, bHint: nrm, col: WOOD, seed: 10 + i * 2, jag: 0.2, rough: 0.015 });
    for (const side of [-1, 1]) { const pr = parts[side]; if (!pr.ok) continue;
      ribTops.push({ p: pr.pts[9].clone(), side, i, mid: pr.pts[6].clone() });
      weed.push({ p: pr.pts[9].clone().add(V(0, -0.05, side * 0.08)), n: 14 + Math.floor(hi(i, side, 12) * 8), L: 0.7 });
      weed.push({ p: pr.pts[7].clone().add(V(0, 0, side * 0.2)), n: 10 + Math.floor(hi(i, side, 14) * 6), L: 0.65 });
      weed.push({ p: pr.pts[4].clone().add(V(0, 0, side * 0.2)), n: 8, L: 0.5 });
      weed.push({ p: pr.pts[9].clone().add(V(0, 0.03, 0)), n: 12, L: 0.2 });   // short fur on the broken top
    }
  }
  // long rails joining the rib tops and the mid-heights, some snapped and sagging
  const rails = (key, seedb, dy) => {
    for (const side of [-1, 1]) {
      const tops = ribTops.filter((r) => r.side === side).sort((a, b) => a.i - b.i); let run = [];
      const flush = () => {
        if (run.length >= 2) {
          const pts = [];
          run.forEach((r, k) => { pts.push(r[key].clone().add(V(0, dy, side * 0.22))); if (k < run.length - 1) { const m = r[key].clone().lerp(run[k + 1][key], 0.5); m.y += dy - 0.1 - 0.25 * hi(r.i, side, 60 + seedb); m.z += side * 0.22; pts.push(m); } });
          if (hi(run[0].i, side, 61 + seedb) < 0.55) pts[pts.length - 1].y -= 0.5;   // the snapped end drops
          if (!blocked(pts, 0.6)) { sweep(acc, pts, { w: 0.26, t: 0.2, bHint: () => V(0, 0, side), col: WOOD.clone().lerp(COL("#4a3c30"), 0.3), seed: 60 + seedb + run[0].i, jag: 0.3, rough: 0.015 }); weed.push({ p: pts[1].clone().add(V(0, -0.1, 0)), n: 8, L: 0.5 }); }
        }
        run = [];
      };
      tops.forEach((r, k) => { if (k > 0 && r.i !== tops[k - 1].i + 1) flush(); run.push(r); if (hi(r.i, side, 62 + seedb) < 0.25) flush(); });
      flush();
    }
  };
  rails("p", 0, 0.0); rails("mid", 10, 0.0);
  // side planks: on the ribs, with a gap where the bars come in
  const strake = (ua, ub, phi, side, off, seed, w = 0.3) => {
    const N = Math.max(4, Math.round((ub - ua) / 0.5)), all = [], blk = [];
    const nrmAt = (u) => { const a = Hh(u) * Math.sin(phi), b = side * hb(u) * Math.cos(phi); return V(0, -b, a).multiplyScalar(side).normalize(); };
    for (let k = 0; k <= N; k++) { const u = lerp(ua, ub, k / N); all.push(hullPt(u, side, phi + 0.03 * Math.sin(u * 0.9 + seed), 0.2 + off)); blk.push(blocked([all[k]], 0.85)); }
    let k0 = 0;
    for (let k = 0; k <= N + 1; k++) {
      if (k <= N && !blk[k]) continue;
      if (k - k0 >= 3) {
        const pts = all.slice(k0, k), us = pts.map((q) => q.x);
        sweep(acc, pts, { w, t: 0.11, bHint: (i) => nrmAt(us[i]), col: WOOD.clone().lerp(COL("#4a3c30"), 0.4), seed: seed + k0 * 0.01, jag: 0.3, rough: 0.012 });
        pts.forEach((q, i) => { if (i > 0 && i < pts.length - 1) studs.push(q.clone().addScaledVector(nrmAt(us[i]), 0.07)); });
        for (let j = 0; j < Math.min(5, pts.length - 1); j++) weed.push({ p: pts[Math.min(pts.length - 1, j * 2 + 1)].clone().add(V(0, -w * 0.5, side * 0.02)), n: 6, L: 0.4 });
      }
      k0 = k + 1;
    }
  };
  strake(1.5, 12.5, 1.0, -1, 0.0, 32); strake(4.5, L - 1.5, 0.62, -1, 0.0, 35, 0.28); strake(1.8, 7.2, 0.8, 1, 0.0, 36); strake(10.4, 15.2, 0.5, 1, 0.0, 30);
  const fall = (a, b, seed, w = 0.32, t = 0.1) => {
    const mid = a.clone().lerp(b, 0.5); mid.y -= 0.05; if (blocked([a, mid, b])) return;
    sweep(acc, [a, mid, b], { w, t, bHint: () => V(0, 1, 0), col: WOOD.clone().lerp(COL("#4a3c30"), 0.5), seed, jag: 0.35, rough: 0.02 }); weed.push({ p: mid.clone().add(V(0, -0.02, 0)), n: 8, L: 0.4 });
    weed.push({ p: a.clone().lerp(b, 0.25).add(V(0, -0.1, 0)), n: 6, L: 0.4 });
  };
  // the long diagonals: from a near rib's broken top down across the hull to the sand
  [1, 3, 5, 8].forEach((ri, j) => { const t = ribTops.find((r) => r.side > 0 && r.i === ri) || ribTops.find((r) => r.side > 0 && r.i === ri + 1); if (!t) return;
    fall(t.p.clone().add(V(0, 0.1, 0)), V(t.p.x + 2.6 + 0.5 * j, 0.45, t.p.z - 3.3 - 0.3 * j), 33 + j, 0.34); });
  fall(V(L - 1.6, 1.0, -1.8), V(L - 5.0, 0.35, 0.4), 38, 0.3);
  // thwarts across the hull
  const thwart = (u, y, seed, zA = null, zB = null) => {
    const phi = Math.acos(clamp(1 - (y + 0.15) / Hh(u), -1, 1)), zr = hb(u) * Math.sin(phi);
    if (blocked([V(u, y, zA ?? -zr), V(u, y, 0), V(u, y, zB ?? zr)], 0.5)) return;
    sweep(acc, [V(u, y, zA ?? -zr - 0.2), V(u, y + 0.01, ((zA ?? -zr) + (zB ?? zr)) / 2), V(u, y, zB ?? zr + 0.2)], { w: 0.3, t: 0.26, bHint: () => V(0, 1, 0), col: WOOD, seed, jag: 0.2, rough: 0.015 });
    weed.push({ p: V(u, y - 0.12, (zB ?? zr) * 0.5), n: 7, L: 0.45 });
  };
  thwart(2.8, 1.8, 40); thwart(6.0, 1.3, 41, null, 0.4); thwart(9.2, 1.0, 42, -0.5, null); thwart(12.4, 0.8, 43);
  // debris on the sand
  [[-3.6, 0.1, 3.4, 0.4, 50], [L - 2.6, 0.07, -3.2, 2.1, 51], [9.4, 0.06, 3.6, 0.9, 52], [L + 1.0, 0.1, 1.2, 1.4, 53], [0.6, 0.08, 3.9, 2.6, 54], [7.2, 0.1, -4.0, 0.2, 55], [14.2, 0.08, 3.4, 0.7, 56]].forEach(([u, y, z, yaw, seed]) => {
    const Ld = 0.9 + 0.8 * hi(seed, 1), a = V(u, y, z), b = V(u + Math.cos(yaw) * Ld, y + 0.04 + 0.1 * hi(seed, 2), z + Math.sin(yaw) * Ld);
    if (blocked([a, a.clone().lerp(b, 0.5), b], 0.7)) return;
    sweep(acc, [a, a.clone().lerp(b, 0.5), b], { w: 0.2 + 0.08 * hi(seed, 3), t: 0.14, bHint: () => V(0, 1, 0), col: WOOD, seed, jag: 0.12, rough: 0.012 });
  });
  return { acc, weed, studs };
}
function mergeInto(acc, geo, seed) {   // append a prepped non-indexed geometry (position, normal, uv, color) to an Acc
  const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, C = geo.attributes.color;
  for (let i = 0; i < P.count; i++) { acc.p.push(P.getX(i), P.getY(i), P.getZ(i)); acc.n.push(N.getX(i), N.getY(i), N.getZ(i)); acc.u.push(U.getX(i) * 0 + (i % 3 === 1 ? 1 : 0), U.getY(i) * 0 + (i % 3 === 2 ? 1 : 0)); acc.c.push(C.getX(i), C.getY(i), C.getZ(i)); acc.s.push(seed); }
}

// ------------------------------------------------------------------------------------------------ the water: backdrop, shafts, silt
const BACK_VS = `varying vec3 vD; void main() { vD = normalize(position); vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * vD * 600.0, 1.0); gl_Position = p; }`;
const BACK_FS = `uniform float uTime; uniform vec3 uOrg, uKey; varying vec3 vD;
${GLSL_NOISE}
void main() {
  vec3 d = normalize(vD); float e = d.y; vec3 c = waterCol(e);
  vec3 cam = cameraPosition - uOrg;
  float up = smoothstep(0.03, 0.4, e);
  if (e > 0.02) {
    float t = (15.0 - cam.y) / e; vec2 sp = cam.xz + d.xz * t;
    float a = vn2(sp * 0.42 + vec2(uTime * 0.10, uTime * 0.06)) * 0.52 + vn2(sp * 0.95 - vec2(uTime * 0.13, -uTime * 0.09) + 5.0) * 0.30 + vn2(sp * 2.1 + vec2(-uTime * 0.19, uTime * 0.12) + 9.0) * 0.18;
    float lines = smoothstep(0.085, 0.0, abs(a - 0.5)), lines2 = smoothstep(0.06, 0.0, abs(vn2(sp * 1.5 + vec2(uTime * 0.17, -uTime * 0.1) + 3.0) - 0.5));
    float pat = 0.45 + 0.55 * smoothstep(0.25, 0.75, vn2(sp * 0.22 + 2.0));
    c += vec3(0.62, 0.95, 0.90) * (lines * 0.55 + lines2 * 0.3) * pat * up * (0.45 + 0.8 * e);
    float sun = pow(max(dot(d, uKey), 0.0), 9.0); c += vec3(0.55, 0.85, 0.75) * sun * 0.55;
    // the surface's own dark wavelets between the lights, toward the horizon
    c *= 1.0 - 0.12 * up * (1.0 - e) * smoothstep(0.3, 0.7, vn2(sp * 0.6 + 1.0));
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function backdrop(U) {
  const m = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uOrg: U.uOrg, uKey: U.uKey }, vertexShader: BACK_VS, fragmentShader: BACK_FS, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false });
  m.userData.noOutline = true; m.userData.noHatch = true; m.customProgramCacheKey = () => "atb-seabed-backdrop";
  const me = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 28), m); me.name = "atb-backdrop"; me.renderOrder = -500; return me;
}
function shaftMesh(U) {
  const pos = [], uvs = [], idxA = [], ind = [];
  for (let i = 0; i < 8; i++) { const b = pos.length / 3; for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) { pos.push(x, y, 0); uvs.push(x + 0.5, y); idxA.push(i); } ind.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute("aIdx", new THREE.Float32BufferAttribute(idxA, 1)); g.setIndex(ind);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSh: U.uSh, uKey: U.uKey, uOrg: U.uOrg, uShaftK: U.uShaftK },
    vertexShader: `attribute float aIdx; uniform float uTime; uniform vec4 uSh[8]; uniform vec3 uKey, uOrg; varying vec2 vUv; varying float vPh; varying float vDist;
void main() {
  int i = int(aIdx + 0.5); vec4 s = uSh[i]; float ph = s.w; vUv = uv; vPh = ph;
  vec2 lean = uKey.xz / uKey.y + 0.10 * vec2(sin(ph * 3.1), cos(ph * 2.3)) + 0.05 * vec2(sin(uTime * 0.23 + ph), cos(uTime * 0.19 + ph * 1.7));
  float y = mix(-0.3, 15.0, uv.y);
  vec3 ctr = vec3(s.x + lean.x * (y + 0.3), y, s.y + lean.y * (y + 0.3)); vec3 cam = cameraPosition - uOrg;
  vec3 axis = normalize(vec3(lean.x, 1.0, lean.y)); vec3 side = normalize(cross(axis, normalize(cam - ctr)));
  float w = s.z * (1.0 + 0.5 * sin(uTime * 0.31 + ph * 2.0) * 0.2) * (0.78 + 0.4 * (1.0 - uv.y));
  vec3 p = ctr + side * (uv.x - 0.5) * 2.0 * w; vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform float uTime; uniform float uShaftK; varying vec2 vUv; varying float vPh; varying float vDist;
void main() {
  float ax = abs(vUv.x - 0.5) * 2.0, across = exp(-ax * ax * 3.4);
  float streak = 0.72 + 0.28 * sin(vUv.x * 21.0 + vPh * 3.0 + vUv.y * 4.0 + uTime * 0.5) * sin(vUv.x * 9.0 - vPh + uTime * 0.31);
  float along = (0.28 + 0.72 * pow(vUv.y, 1.1)) * smoothstep(0.0, 0.09, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  float a = across * streak * along * (0.88 + 0.12 * sin(uTime * 0.6 + vPh)) * smoothstep(0.5, 3.0, vDist) * 0.2 * uShaftK;
  gl_FragColor = vec4(vec3(0.74, 0.96, 0.9), a);
  #include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
  });
  m.userData.noOutline = true; m.userData.noHatch = true; m.customProgramCacheKey = () => "atb-seabed-shafts";
  const me = new THREE.Mesh(g, m); me.name = "atb-shafts"; return me;
}
function siltPoints(U) {
  const N = 1800, R = stream(77), sp = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) { sp.set([R(), R(), R()], i * 3); size[i] = 0.004 + 0.008 * R() * R(); ph[i] = R() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3)); g.setAttribute("aSize", new THREE.BufferAttribute(size, 1)); g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSilt: U.uSilt, uViewH: { value: 1080 } },
    vertexShader: `attribute float aSize, aPh; uniform float uTime, uViewH; varying float vA;
void main() {
  vec3 box = vec3(12.0, 5.0, 14.0), c = cameraPosition, wob = 0.05 * vec3(sin(0.9 * uTime + aPh), sin(0.7 * uTime + aPh * 1.7), cos(0.8 * uTime + aPh * 0.6));
  vec3 p = position * box + vec3(0.05 * uTime, -0.012 * uTime, 0.02 * uTime) + wob; p = c + mod(p - c + box * 0.5, box) - box * 0.5;
  p.y = max(p.y, -1.0e9);
  vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * projectionMatrix[1][1] * uViewH * 0.5 / max(-mv.z, 0.05), 1.6, 4.0);
  vA = (0.45 + 0.4 * sin(uTime * 0.8 + aPh * 3.0)) * (1.0 - smoothstep(6.0, 15.0, length(mv.xyz))) * smoothstep(0.15, 0.8, -mv.z);
}`,
    fragmentShader: `uniform float uSilt; varying float vA; void main() { vec2 q = gl_PointCoord - 0.5; float r2 = dot(q, q); if (r2 > 0.25) discard; float a = vA * uSilt * (1.0 - r2 * 3.0); gl_FragColor = vec4(vec3(0.82, 0.93, 0.84), a * 0.55);
  #include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false, fog: false,
  });
  m.userData.noOutline = true; m.userData.noHatch = true; m.customProgramCacheKey = () => "atb-seabed-silt";
  const me = new THREE.Points(g, m); me.name = "atb-silt";
  me.onBeforeRender = (R) => { const v = new THREE.Vector2(); R.getDrawingBufferSize(v); m.uniforms.uViewH.value = v.y; };
  return me;
}

// ------------------------------------------------------------------------------------------------ the rock outcrops (three layers) and the arch rock
function outcrops(U) {
  const LAYERS = [
    { r: [17, 21], n: 18, w: [5, 11], h: [2.4, 4.6], d: [4, 7], col: "#5f7f78", skip: 0.15, seed: 100 },
    { r: [31, 36], n: 18, w: [10, 20], h: [5, 9.5], d: [7, 12], col: "#527b84", skip: 0.0, seed: 200 },
    { r: [50, 57], n: 18, w: [20, 38], h: [9, 16], d: [12, 20], col: "#467a8c", skip: 0, seed: 300 },
  ];
  const list = [];
  const shape = (seed, flat = 1) => blobGeo(3, (d) => {
    const q = vn3(d.x * 2.0 + seed, d.y * 2.0, d.z * 2.0), q2 = vn3(d.x * 5.1 + seed * 2, d.y * 4.0 + 3, d.z * 5.1), q3 = vn3(d.x * 11 + seed, d.y * 9, d.z * 11 + 4);
    let r = 1 + 0.30 * (q - 0.5) * 2 + 0.12 * (q2 - 0.5) * 2 + 0.04 * (q3 - 0.5) * 2;
    return r * (d.y > 0.55 ? 1 - 0.18 * (d.y - 0.55) : 1);
  });
  const variants = [0, 1, 2, 3, 4, 5].map((i) => shape(i * 3.7 + 1));
  const arch = (() => {
    let g = new THREE.TorusGeometry(3.2, 1.45, 18, 44); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4); g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), d = (vn3(x * 0.55 + 3, y * 0.55, z * 0.55) - 0.5) * 1.5 + (vn3(x * 1.7, y * 1.7 + 5, z * 1.7) - 0.5) * 0.5; P.setXYZ(i, x + N.getX(i) * d, y + N.getY(i) * d, z + N.getZ(i) * d); }
    g.computeVertexNormals(); return g;
  })();
  const colorOf = (hex, k = 1) => { const c = COL(hex); return (x, y) => c.clone().multiplyScalar(k * (0.9 + 0.2 * vn3(x * 0.2, y * 0.4, 1))).lerp(COL("#7f9a86"), clamp((y - 3) * 0.04, 0, 0.3)); };
  LAYERS.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      if (hi(i, L.seed, 1) < L.skip) continue;
      const ang = ((i + 0.5 * hi(i, L.seed, 2)) / L.n) * TAU, r0 = lerp(L.r[0], L.r[1], hi(i, L.seed, 3)), w = lerp(L.w[0], L.w[1], hi(i, L.seed, 4)), h = lerp(L.h[0], L.h[1], hi(i, L.seed, 5)), d = lerp(L.d[0], L.d[1], hi(i, L.seed, 6));
      let r = r0, x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      for (let k = 0; k < 40 && distWreck(x, z) < 6.5 + 0.45 * Math.max(w, d); k++) { r += 1; x = Math.cos(ang) * r; z = Math.sin(ang) * r; }
      if (li === 1 && Math.hypot(x - 12.8, z + 29) < 9) continue;   // keep the arch's neighbourhood for the arch
      const yaw = ang + Math.PI / 2 + (hi(i, L.seed, 7) - 0.5) * 0.8;
      const g = variants[Math.floor(hi(i, L.seed, 8) * variants.length)], m = M4(x, -h * 0.30, z, yaw, w * 0.5, h * 0.95, d * 0.5);
      list.push(prep(g, m, colorOf(L.col, 0.92 + 0.16 * hi(i, L.seed, 9)), L.seed + i));
    }
  });
  // the arch rock: a ring of stone with two shoulders, in the 33 m layer at the back right
  list.push(prep(arch, M4(12.8, 1.7, -29.0, 0.28, 1.0, 1.05, 1.5), colorOf("#5e7c78", 1.02), 777));
  list.push(prep(variants[2], M4(8.9, -1.0, -30.2, 0.2, 4.2, 3.0, 4.2), colorOf("#5e7c78", 0.95), 778));
  list.push(prep(variants[4], M4(17.2, -1.2, -29.4, 0.5, 4.6, 3.8, 4.4), colorOf("#5e7c78", 1.0), 779));
  list.push(prep(variants[1], M4(13.4, -1.4, -33.0, 0.1, 7.5, 5.6, 4.6), colorOf("#587a78", 0.96), 780));
  return list;
}

// ------------------------------------------------------------------------------------------------ the kind
function instanced(geo, mat, list) {   // list: { m: Matrix4, c: Color, s: seed }
  const im = new THREE.InstancedMesh(geo, mat, list.length), sd = new Float32Array(list.length);
  list.forEach((e, i) => { im.setMatrixAt(i, e.m); im.setColorAt(i, e.c ?? new THREE.Color(1, 1, 1)); sd[i] = e.s ?? 0; });
  const g2 = geo.clone(); g2.setAttribute("aSeed", new THREE.InstancedBufferAttribute(sd, 1)); im.geometry = g2; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; return im;
}
const SHAFT_SPOTS = [[-7.0, -8.4, 2.0], [-3.2, -9.8, 1.7], [0.9, -11.4, 2.3], [2.8, -6.2, 1.5], [-1.4, -2.4, 1.9], [3.6, 1.0, 1.6], [-4.8, -4.4, 1.4], [6.4, -8.6, 2.1]];
const STRIP_OK = (x, z, m = 0.45) => distBar(x, z) > m;

function atbseabed(P) {
  const S = P.spec, G = P.whole, U = makeShared(S), seed = S.seed ?? 1;
  OCC.length = 0;
  SHAFT_SPOTS.forEach(([x, z, r], i) => U.uSh.value[i].set(x, z, r, hi(i, 77) * TAU));
  const mats = {
    sand: mkMat(U, "sand"), plain: mkMat(U, "plain"), plain2: mkMat(U, "plain", { side: THREE.DoubleSide, far: false }), rock: mkMat(U, "rock", { rk: 4.0 }), rockFar: mkMat(U, "rock", { far: true, rk: 0.5 }),
    wood: mkMat(U, "wood", { side: THREE.DoubleSide }), clay: mkMat(U, "clay"), grass: mkMat(U, "grass", { sway: true, side: THREE.DoubleSide }),
  };
  const meshes = [];
  const add = (geo, mat, o = {}) => { const me = new THREE.Mesh(geo, mat); me.name = o.name ?? "atb"; if (o.order != null) me.renderOrder = o.order; meshes.push(me); G.add(me); return me; };
  const addI = (im, name) => { im.name = name; meshes.push(im); G.add(im); return im; };

  // ---- THE WRECK (built first: the blocked test keeps timber off the bar line)
  const wm = new THREE.Matrix4().makeTranslation(WRECK.x0, -WRECK.sink, WRECK.z0).multiply(new THREE.Matrix4().makeRotationY(WYAW)).multiply(new THREE.Matrix4().makeRotationX(WRECK.roll));
  const { acc, weed, studs } = buildWreck(wm);
  const woodGeo = acc.geo(); woodGeo.applyMatrix4(wm);
  // timber standing on the bar line is a bug: report the nearest vertex (the bench prints it)
  { const Pw = woodGeo.attributes.position; let mn = 9; for (let i = 0; i < Pw.count; i++) if (Pw.getY(i) < 0.4) mn = Math.min(mn, distBar(Pw.getX(i), Pw.getZ(i))); P.whole.userData.wreckBarGap = mn; }
  add(woodGeo, mats.wood, { name: "atb-wreck" });
  // sand lips along the hull and a shadow under it
  const lips = [];
  for (let k = 0; k < 90; k++) {
    const u = 0.2 + (k / 89) * (WRECK.L + 0.2), side = k % 2 ? 1 : -1, v = side * hb(u) * (0.52 + 0.22 * hi(k, 5)) , q = new THREE.Vector3(u, 0, v).applyMatrix4(wm);
    lips.push({ m: M4(q.x, sandY(q.x, q.z) - 0.015, q.z, WYAW + (hi(k, 6) - 0.5) * 0.5, 0.3 + 0.5 * hi(k, 7), 0.07 + 0.09 * hi(k, 8), 0.22 + 0.18 * hi(k, 9)), c: new THREE.Color(1, 1, 1), s: k });
  }
  for (let k = 0; k < 16; k++) {   // the sand heaped in the hull under the ribs, between the near ribs
    const u = 0.8 + hi(k, 31) * (WRECK.L - 1), q = new THREE.Vector3(u, 0, (hi(k, 32) - 0.5) * hb(u) * 1.0).applyMatrix4(wm);
    lips.push({ m: M4(q.x, sandY(q.x, q.z) - 0.02, q.z, WYAW + (hi(k, 33) - 0.5) * 0.7, 0.4 + 0.5 * hi(k, 34), 0.06 + 0.07 * hi(k, 35), 0.3 + 0.2 * hi(k, 36)), c: new THREE.Color(1, 1, 1), s: 90 + k });
  }
  addI(instanced(prep(blobGeo(2, (d) => 1 + 0.12 * (vn3(d.x * 3, d.y * 3, d.z * 3) - 0.5)), null, COL("#cdbf96")), mats.sand, lips), "atb-lips");
  for (let u = 0; u <= WRECK.L; u += 1.1) { const q = new THREE.Vector3(u, 0, 0).applyMatrix4(wm); addOcc(q.x, q.z, 2.1, 0.30, 1.6); }
  for (let u = 0.5; u <= WRECK.L; u += 0.8) for (const s of [-1, 1]) { const q = new THREE.Vector3(u, 0, s * hb(u) * 0.72).applyMatrix4(wm); addOcc(q.x, q.z, 0.55, 0.22, 0.9); }
  // weed hanging from the timber and the little iron studs
  const wblades = [];
  weed.forEach((w, wi) => {
    const p = w.p.clone().applyMatrix4(wm);
    for (let k = 0; k < w.n; k++) {
      const hsh = (j) => hi(wi, k, j + 40);
      wblades.push({ x: p.x + (hsh(1) - 0.5) * 0.12, y: p.y, z: p.z + (hsh(2) - 0.5) * 0.12, h: w.L * (0.55 + 0.9 * hsh(3)), w: 0.022 + 0.02 * hsh(4), yaw: hsh(5) * TAU, lean: 0.1 + 0.2 * hsh(6), bend: 0.2 * hsh(7), twist: (hsh(8) - 0.5) * 1.2, hang: true,
        c0: COL("#46592a"), c1: mix("#7f9a38", "#a8bc58", hsh(9)), seed: hsh(10), sw: 0.45 * w.L });
    }
  });

  // ---- amphoras
  const AM = [
    { x: -0.35, z: 4.05, ry: 0.5, rx: 0.1, rz: 1.38, bury: 0.12, s: 1, k: 1.3 },   // the big one lying lower left, mouth toward the camera's left
    { x: 3.2, z: -0.5, ry: -0.4, rx: -0.1, rz: -0.18, bury: 0.38, s: 3, k: 1.1 }, { x: 3.95, z: -1.5, ry: 0.9, rx: 0.0, rz: -0.75, bury: 0.15, s: 4, k: 1.0 },   // the pair at the right: one upright half buried, one leaning
    { x: -2.6, z: -5.6, ry: -0.7, rx: 0.0, rz: 1.5, bury: 0.12, s: 2, k: 1.0 }, { x: -1.2, z: -10.2, ry: 2.2, rx: 0.1, rz: 1.45, bury: 0.15, s: 5, k: 1.0 },   // by the wreck
  ];
  const amphList = [];
  for (const a of AM) {
    const g = amphoraGeo(a.s * 3.1); g.scale(a.k, a.k, a.k); const e = new THREE.Euler(a.rx, a.ry, a.rz, "YXZ"), q = new THREE.Quaternion().setFromEuler(e);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); g.computeBoundingBox();
    const y = sandY(a.x, a.z) - a.bury - g.boundingBox.min.y * 0 - (g.boundingBox.min.y - 0);   // lowest point sits `bury` under the sand
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(a.x, y, a.z));
    amphList.push(keepColor(prep(g, null, COL("#a8553a"), a.s)));
    addOcc(a.x, a.z, 0.5 * a.k, 0.42, 0.55 * a.k);
  }
  add(merge(amphList), mats.clay, { name: "atb-amphoras" });
  // sand banked against the jars
  const jarLips = AM.map((a, i) => ({ m: M4(a.x - 0.05, sandY(a.x, a.z) - 0.01, a.z + 0.06, i, 0.62 * AM[i].k, 0.13, 0.46 * AM[i].k), c: new THREE.Color(1, 1, 1), s: 200 + i }));
  addI(instanced(prep(blobGeo(2, (d) => 1 + 0.15 * (vn3(d.x * 3, d.y * 3, d.z * 3) - 0.5)), null, COL("#bfb28a")), mats.sand, jarLips), "atb-jarlips");

  // ---- rocks
  const R = stream(2000 + seed * 13);
  const rocks = [];
  const okRock = (x, z, s) => !inPlay(x, z, s * 0.9 + 0.3) && distBar(x, z) > s + 0.9 && distWreck(x, z) > 3.0 + s;
  const clusters = [[-0.9, 5.3, 1.2], [1.3, 5.4, 1.3], [-6.7, 3.9, 1.1], [-8.6, -0.6, 0.8], [6.4, 4.7, 1.1], [8.4, 0.4, 0.8], [5.4, -7.6, 0.8], [-3.5, 8.2, 0.7], [2.9, 8.9, 0.6], [-11.2, 3.2, 0.9], [10.8, -4.2, 0.8], [9.4, 7.4, 0.8], [12.5, -9.0, 0.7], [0.8, 14, 0.7], [-4.9, 2.6, 0.8], [4.8, 2.1, 0.9], [4.9, -2.2, 0.8], [3.6, -5.9, 0.8], [1.8, -8.4, 0.7], [6.8, -6.9, 0.8], [-14, -4, 0.8]];
  clusters.forEach(([cx, cz, k], ci) => {
    const nb = 2 + Math.floor(hi(ci, 3, seed) * 3);
    for (let j = 0; j <= nb; j++) {
      const big = j === 0, s = big ? (0.42 + 0.2 * hi(ci, j, 1)) * k : (0.12 + 0.2 * hi(ci, j, 2)) * k, a = hi(ci, j, 3) * TAU, d = big ? 0 : 0.7 + 1.1 * hi(ci, j, 4);
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (okRock(x, z, s)) rocks.push({ x, z, s, ci, j });
    }
  });
  for (let i = 0; i < 26; i++) { const a = R() * TAU, r = 5.5 + 24 * Math.pow(R(), 1.3), x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.14 + 0.28 * R() * R(); if (okRock(x, z, s)) rocks.push({ x, z, s, ci: 50 + i, j: 0 }); }
  const rockList = rocks.map((k, i) => {
    const sx = k.s * (0.95 + 0.5 * hi(i, 1)), sy = k.s * (0.55 + 0.3 * hi(i, 2)), sz = k.s * (0.8 + 0.4 * hi(i, 3));
    addOcc(k.x, k.z, k.s * 1.15, 0.5, k.s * 0.7);
    const tint = COL(["#7d8a8c", "#8a8272", "#6f7f86", "#92887a", "#76827a", "#80767a"][i % 6]);
    return { m: M4(k.x, sandY(k.x, k.z) + sy * 0.25, k.z, hi(i, 4) * TAU, sx, sy, sz, (hi(i, 5) - 0.5) * 0.3, (hi(i, 6) - 0.5) * 0.3), c: tint, s: i * 1.7 + 3 };
  });
  const rockGeo = prep(blobGeo(3, (d) => 1 + 0.26 * (vn3(d.x * 2.2 + 1, d.y * 2.2, d.z * 2.2) - 0.5) * 2 + 0.07 * (vn3(d.x * 6 + 4, d.y * 6, d.z * 6) - 0.5) * 2), null, new THREE.Color(1, 1, 1));
  addI(instanced(rockGeo, mats.rock, rockList), "atb-rocks");

  // ---- pebbles (3-15 cm)
  const pebs = [], PR = stream(3000 + seed * 17);
  const pebGeo = prep(blobGeo(1, (d) => 1 + 0.2 * (vn3(d.x * 1.7 + 2, d.y * 1.7, d.z * 1.7) - 0.5) * 2), null, new THREE.Color(1, 1, 1));
  for (let i = 0; pebs.length < 2500 && i < 9000; i++) {
    const a = PR() * TAU, r = 32 * Math.pow(PR(), 1.25), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (distBar(x, z) < 0.45 || distWreck(x, z) < 1.5 && PR() < 0.5) continue;
    const play = inPlay(x, z), sz = 0.03 + 0.12 * Math.pow(PR(), 3);
    if (play && (PR() < 0.35 || sz > 0.08)) continue;
    const rad = sz * 0.5, k = 0.55 + 0.25 * PR(), c = PEBBLE_COLS[Math.floor(PR() * PEBBLE_COLS.length)].clone().multiplyScalar(0.85 + 0.3 * PR());
    pebs.push({ m: M4(x, sandY(x, z) + rad * 0.15, z, PR() * TAU, rad * (1 + 0.5 * PR()), rad * k, rad * (0.8 + 0.4 * PR()), (PR() - 0.5) * 0.4, (PR() - 0.5) * 0.4), c, s: i * 0.37 });
  }
  for (const k of rocks) for (let j = 0; j < 9; j++) {   // a skirt of pebbles round each rock
    const a = PR() * TAU, d = k.s * (1.1 + 0.9 * PR()), x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d, rad = 0.012 + 0.04 * PR() * PR();
    if (distBar(x, z) < 0.45) continue;
    pebs.push({ m: M4(x, sandY(x, z) + rad * 0.15, z, PR() * TAU, rad * 1.3, rad * 0.6, rad), c: PEBBLE_COLS[Math.floor(PR() * PEBBLE_COLS.length)].clone().multiplyScalar(0.9), s: pebs.length * 0.37 });
  }
  for (let i = 0; i < 80; i++) {   // pebbles that read at 1080p, in the camera A / B foreground
    const x = -2.6 + 5.4 * PR(), z = 2.6 + 3.4 * PR(), rad = 0.018 + 0.04 * PR() * PR() + 0.01;
    if (distBar(x, z) < 0.45) continue;
    pebs.push({ m: M4(x, sandY(x, z) + rad * 0.2, z, PR() * TAU, rad * 1.4, rad * 0.65, rad, (PR() - 0.5) * 0.3, (PR() - 0.5) * 0.3), c: PEBBLE_COLS[Math.floor(PR() * PEBBLE_COLS.length)].clone().multiplyScalar(0.9 + 0.2 * PR()), s: 900 + i });
  }
  addI(instanced(pebGeo, mats.plain, pebs), "atb-pebbles");

  // ---- shells
  const SH = stream(4000 + seed * 19), shellCols = ["#f1ece0", "#e9dcc4", "#e6b8b0", "#d8a090", "#d9b27e", "#c9ccd0", "#f4e6d6", "#b8946a"].map(COL);
  const scal = [], cock = [];
  const bigScallops = [[-0.6, 4.7, 0.09], [0.2, 5.0, 0.1], [0.9, 4.6, 0.085], [1.4, 4.95, 0.095], [-0.3, 4.3, 0.08], [0.7, 4.3, 0.09], [-1.0, 4.1, 0.07], [1.7, 4.4, 0.075], [-0.1, 5.5, 0.1], [1.1, 5.6, 0.09], [-2.4, 4.9, 0.1], [2.6, 4.9, 0.09], [-3.4, 3.1, 0.08], [3.9, 3.4, 0.08], [-2.9, 1.4, 0.07], [3.1, 2.2, 0.075]];
  bigScallops.forEach(([x, z, s], i) => { if (STRIP_OK(x, z)) scal.push({ m: M4(x, sandY(x, z) + 0.008, z, i * 1.3 + 0.4, s, s, s, (i % 2) * 3.14159, 0), c: shellCols[i % 5], s: 600 + i }); });
  for (let i = 0; i < 150; i++) {
    const a = SH() * TAU, r = 24 * Math.pow(SH(), 1.15), x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.05 + 0.05 * SH(), flip = SH() < 0.3;
    if (!STRIP_OK(x, z)) continue; const c = shellCols[Math.floor(SH() * shellCols.length)].clone().multiplyScalar(0.85 + 0.2 * SH());
    scal.push({ m: M4(x, sandY(x, z) + (flip ? 0.012 : 0.006), z, SH() * TAU, s, s, s, flip ? 3.14159 : (SH() - 0.5) * 0.4, (SH() - 0.5) * 0.3), c, s: i });
  }
  for (let i = 0; i < 160; i++) {
    const a = SH() * TAU, r = 22 * Math.pow(SH(), 1.15), x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.022 + 0.03 * SH(), flip = SH() < 0.35;
    if (!STRIP_OK(x, z)) continue; const c = shellCols[Math.floor(SH() * shellCols.length)].clone().multiplyScalar(0.8 + 0.25 * SH());
    cock.push({ m: M4(x, sandY(x, z) + 0.004, z, SH() * TAU, s, s, s, flip ? 3.14159 : (SH() - 0.5) * 0.3, (SH() - 0.5) * 0.3), c, s: 100 + i });
  }
  addI(instanced(keepColor(scallopGeo(), null, 0), mats.plain2, scal), "atb-scallops");
  addI(instanced(keepColor(cockleGeo(), null, 0), mats.plain2, cock), "atb-cockles");

  // ---- starfish, urchins, the crab
  const small = [];
  [[-2.7, 5.3, 0.10, 0.4], [3.3, -6.9, 0.085, 2.0]].forEach(([x, z, s, ry], i) => { if (STRIP_OK(x, z)) small.push(keepColor(starGeo(), M4(x, sandY(x, z), z, ry, s, s, s), 10 + i)); addOcc(x, z, s * 1.2, 0.3); });
  [[-6.1, 2.6], [7.3, 1.8], [-8.0, -2.9], [5.0, 5.8], [-4.2, 7.0]].forEach(([x, z], i) => { if (STRIP_OK(x, z)) small.push(keepColor(urchinGeo(i * 5.3), M4(x, sandY(x, z) - 0.006, z, i), 20 + i)); addOcc(x, z, 0.1, 0.3); });
  small.push(keepColor(crabGeo(), M4(-4.45, sandY(-4.45, -0.9) + 0.002, -0.9, 0.35, 1.25), 30));
  addOcc(-4.45, -0.9, 0.16, 0.4);
  studs.forEach((s, i) => { const q = s.clone().applyMatrix4(wm); small.push(prep(new THREE.SphereGeometry(0.026, 6, 4), M4(q.x, q.y, q.z, 0, 1, 0.6, 1), COL("#6a6052"))); void i; });
  add(merge(small), mats.plain, { name: "atb-small" });

  // ---- the grass
  const blades = [...wblades], GR = stream(5000 + seed * 23);
  const tuft = (x, z, nb, hMul = 1, spread = 0.13) => {
    const base = COL(["#2f6a38", "#33703c", "#2b6334"][Math.floor(GR() * 3)]);
    for (let k = 0; k < nb; k++) {
      const a = GR() * TAU, d = Math.sqrt(GR()) * spread, h = (0.4 + 0.5 * GR()) * hMul, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      blades.push({ x: px, y: sandY(px, pz) - 0.01, z: pz, h, w: 0.032 + 0.020 * GR(), yaw: GR() * TAU, lean: 0.12 + 0.3 * GR(), bend: 0.25 + 0.5 * GR(), twist: (GR() - 0.5) * 0.9, hang: false,
        c0: base.clone().multiplyScalar(0.8), c1: mix("#8fb840", "#b6cc5a", GR()).lerp(COL("#3f8a4a"), 0.25 * GR()), seed: GR(), sw: 0.3 * h });
    }
  };
  const tufts = [];
  clusters.forEach(([cx, cz], ci) => { const n = 3 + Math.floor(3 * hi(ci, 9)); for (let j = 0; j < n; j++) { const a = hi(ci, j, 11) * TAU, d = 0.5 + 1.4 * hi(ci, j, 12); tufts.push([cx + Math.cos(a) * d, cz + Math.sin(a) * d, 8 + Math.floor(5 * hi(ci, j, 13)), 1.0]); } });
  for (let i = 0; i < 700 && tufts.length < 230; i++) {
    const a = GR() * TAU, r = 4.6 + 22 * Math.pow(GR(), 1.35), x = Math.cos(a) * r, z = Math.sin(a) * r, edge = clamp(Math.max(Math.abs(x) - 4.2, (z - 4.6) * 1.2) * 0.18, 0, 1);
    if (inPlay(x, z, 0.5) || !STRIP_OK(x, z, 0.9) || distWreck(x, z) < 2.0 || GR() > 0.12 + 0.88 * edge) continue;
    tufts.push([x, z, 6 + Math.floor(6 * GR()), 0.8 + 0.4 * GR()]);
  }
  [[-0.5, 5.7, 14, 1.3], [1.0, 5.9, 14, 1.2], [0.2, 6.4, 13, 1.3], [-2.1, 5.7, 13, 1.2], [2.0, 5.2, 12, 1.1], [3.0, 5.5, 13, 1.2], [-1.0, 5.0, 12, 1.1], [-3.0, 5.0, 12, 1.2], [4.0, 4.7, 11, 1.1], [-4.7, 2.7, 15, 1.3], [-5.2, 1.0, 14, 1.3], [-4.6, 4.2, 13, 1.2], [4.5, 0.5, 15, 1.3], [5.0, -1.4, 14, 1.3], [5.6, -3.2, 14, 1.3], [4.7, 2.4, 14, 1.2], [6.3, -5.0, 13, 1.2], [5.3, 4.0, 14, 1.3], [-6.0, 5.2, 13, 1.2], [-1.6, 3.6, 0, 1], [-5.8, -3.0, 12, 1.2]].filter((t) => t[2] > 0 && distWreck(t[0], t[1]) > 2.4).forEach((t) => tufts.push(t));
  for (const [x, z, nb, hm] of tufts) if (!inPlay(x, z, 0.4) && STRIP_OK(x, z, 0.9)) tuft(x, z, nb, hm);
  add(bladeGeo(blades), mats.grass, { name: "atb-grass" }).userData.softGrass = true;   // seagrass bends round a body: see-through for the contact checks (steam, set below)

  // ---- the sand (last: the shadows of everything above are baked into it)
  const sandParts = sandGeo();
  sandParts.forEach((g, i) => add(g, mats.sand, { name: `atb-sand${i}` }));

  // ---- the three rock layers
  const outs = outcrops(U);
  add(merge(outs), mats.rockFar, { name: "atb-outcrops" });

  mark(G);
  // the water: backdrop, shafts, silt
  const back = backdrop(U); G.add(mark(back, true, -500)); const sh = shaftMesh(U); G.add(mark(sh, true, 30)); const silt = siltPoints(U); G.add(mark(silt, true, 31));
  for (const me of meshes) { me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; if (me.userData.softGrass) me.userData.steam = true; me.frustumCulled = false; }
  const v3 = new THREE.Vector3();
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0; U.uTime.value = tt; G.updateWorldMatrix(true, false); G.getWorldPosition(v3); U.uOrg.value.set(v3.x, 0, v3.z);
      U.uSway.value = ps.sway ?? S.sway ?? 1; U.uShaftK.value = ps.shafts ?? S.shafts ?? 1; U.uSilt.value = ps.silt ?? S.silt ?? 1; U.uFog.value = ps.fog ?? S.fog ?? 35;
      sh.visible = U.uShaftK.value > 0.001; silt.visible = U.uSilt.value > 0.001;
    },
  };
}
export const AT_B_SEABED_KINDS = { atbseabed };
