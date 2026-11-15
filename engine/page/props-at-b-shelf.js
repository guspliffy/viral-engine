import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Ancient aliens EP03 Atlantis, block B (builder B2, 15 Nov 2026): the SHELF EDGE over the deep (panel 21) in real 3D.
// Design: DESIGNS.md sections 0 + 3 ("Shelf edge"), look target plate-21-shelf-edge-deep.png (/mnt/project-files/videos/ancient-aliens/03-atlantis/).
// Brief: storyboards/series/ancient-aliens/03-atlantis/block-b/briefs/B2.md. Bench: block-b/bench/make-b-shelf.mjs (b-shelf-*-vs.png, b-shelf-sheet.png).
//
//   atbshelf   ONE prop at PLACE(25) = (20000, 120000), y 0: x, z of the prop are the place, everything below is LOCAL to it.
//              Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, Spud 0.88.
//              SHELF TOP  sand #cdbf96 with ripples (drawn in the shader, so the ground is exactly flat), pebbles, shells, rocks with a colourful crust
//                         (orange sponge tubes, pink and purple coralline, red and purple fan weed, olive weed, barnacles), seagrass #3f8a4a swaying.
//                         Sand top is y 0 (+-1 cm) in the PLAY AREA x -1.5..1.5, z -1.5..1.5 (a few pebbles and shells under 2 cm lie in it). Outside it the
//                         shelf swells up to +-0.3 m. Grass grows x -26..-4, thick at the left (x < -9) and in the foreground (z > 3), none within 6 m of the lip.
//              THE LIP    a ragged line along z at x = lipX(z) = 2.2 (z within +-1.6), receding to -x as a bay on the near side (-0.5 per m of z beyond 1.6) and
//                         leaning to +x on the far side (+0.12 per m), plus a zig-zag of promontories and bays (so half the faces look toward the camera);
//                         lipX stays 1.75..2.6 inside the play area, where the wobble is damped, a broken rock rim 0.2-0.5 m high in places (rim blocks) over a rounded 0.25 m step down into the cliff. Spud stands at (0.9, 0).
//              THE CLIFF  #3f6a78, columnar fractured rock, real faceted faces from z -34 to 34: drops from y -0.25 to -34 in 4 tiers with 3 ledges at
//                         about y -6, -12, -19, each 1-3 m wide (the ledges jut out), crusted with sponge, fan coral, barnacles and weed tufts; below the
//                         last ledge the face runs on and is lost in the deep colour (fog). Faces point to +x.
//              THE DEEP   no floor, no far wall, no fish, no shafts beyond the lip. Backdrop (an inside-out sphere that follows the camera, never fogged):
//                         surface glow #8fd8d0 at the zenith, #2a8f96 at eye level, #0f5560 below the horizon over the shelf; over the +x side (where the
//                         ray passes the lip) #0b2447 at eye level going to #06142e downward, lighter toward the surface.
//              UNDER LOOK the water surface from below at y +20 (a plane with moving ripple / caustic lines, blended into the backdrop with distance),
//                         8 soft light shafts (additive, over the shelf only: their feet lie at x -14..-2.5) that drift, and the same shafts lay moving
//                         light patches on the sand, silt motes (1400 points drifting), distance fog on every material of the kind toward the water colour
//                         (1 - exp(-(d / fog)^1.4), full at about 2.8 x fog; the cliff fogs toward the deep colour, darker the deeper). The cast and props
//                         of the generator are not fogged by this kind.
//              spec: seed 1 (the hash seed of every scatter), sway 1 (x the seagrass sway), fog 22 (m, the fog length). Params: none.
//              Set it up as `{ type: "plain", ...AT_UNDER }` with "frame": "wide", "far": 1500 (the plain set's floor mask is at the world origin only;
//              a see-through ShadowMaterial plane at y 0.004 over the play area takes Spud's shadow).
//              Hands: nothing is held (AT_B_SHELF_GRIPS = {}). Scenery: lookOnly, not solid, surfaceOnly. All motion is a function of the clip clock t.
// Everything is placed by fixed hashes (no Math.random, no wall clock). Geometry is built once per seed and shared.

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const lin = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = lin(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };

// ---------------------------------------------------------------------------------------------- noise and the shape of the place (JS side)
function vn2(x, y, k = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => hs(a * 1.0 + b * 57.0, 5.1 + k);
  return lerp(lerp(h(ix, iy), h(ix + 1, iy), u), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u), v);
}
function vn3(x, y, z, k = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hs(a + b * 57.0 + c * 113.0, 7.7 + k);
  return lerp(lerp(lerp(h(ix, iy, iz), h(ix + 1, iy, iz), u), lerp(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), u), v),
    lerp(lerp(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), u), lerp(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), u), v), w);
}
// the lip: x of the shelf edge at z (damped to 2.2 +- 0.4 inside the play area)
function lipAt(z) {
  const damp = 0.35 + 0.65 * sstep(1.5, 6, Math.abs(z));
  const zz = (z + 3.1) / 6.8, tri = Math.abs(zz - Math.floor(zz + 0.5)) * 4 - 1;   // a zig-zag of promontories and bays: half the faces look toward the camera
  return 2.2 + 0.1 * (z - clamp(z, -1.6, 1.6)) + damp * (0.8 * tri + 0.3 * Math.sin(0.62 * z + 0.4) + 0.18 * Math.sin(1.7 * z + 2.0) + 0.45 * Math.sin(0.21 * z));
}
// the shelf top: flat in the play area, swelling up to +-0.3 m outside it, rounding off to -0.25 at the lip
function groundY(x, z) {
  const d = Math.max(Math.abs(x) - 1.5, Math.abs(z) - 1.5, 0), k = sstep(0, 6, d);
  let h = k * (0.3 * (vn2(x * 0.17, z * 0.17) - 0.5) * 2 + 0.09 * (vn2(x * 0.6 + 9, z * 0.6, 2) - 0.5) * 2);
  const e = lipAt(z) - x; if (e < 0.5) h += 0.08 * sstep(0.5, 0.35, e) * (0.6 + 0.8 * vn2(x * 3.0, z * 3.0, 6)); if (e < 0.35) h -= (0.08 + 0.25) * sstep(0.35, 0.0, e);
  return h;
}
const PLAY = (x, z, m = 0) => Math.abs(x) < 1.5 + m && Math.abs(z) < 1.5 + m;

// ---------------------------------------------------------------------------------------------- GLSL: noise, fog, the underwater backdrop colour
const GLSL_COMMON = `
uniform float uTime, uFog; uniform vec3 uCam; uniform vec4 uShaft[8];
const vec3 WATER = ${V3("#1f6f8a")}, FAR_DOWN = ${V3("#12466a")}, SURF = ${V3("#5fa8bc")}, DEEP0 = ${V3("#0b2447")}, DEEP1 = ${V3("#06142e")}, DEEPUP = ${V3("#1a5878")};
const vec3 KEYDIR = vec3(-0.117, 0.94, -0.32);
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), u.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), u.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), u.x), u.y), u.z); }
float fogK(float d) { float f = 1.0 - exp(-pow(d / uFog, 1.4)); return max(f, smoothstep(2.0 * uFog, 2.8 * uFog, d)); }
// the water as seen in direction d (local axes) from the camera: surface glow above, near water at eye level, darker below, the deep over the +x side
vec3 bgColor(vec3 d) {
  float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
  float up = smoothstep(0.0, 80.0, e);
  vec3 col = mix(WATER, SURF * 0.95, pow(up, 0.75));
  col = mix(col, FAR_DOWN, smoothstep(2.0, -32.0, e));
  float px = uCam.x + 80.0 * d.x;
  float dpk = smoothstep(-14.0, 6.0, px) * (1.0 - smoothstep(8.0, 34.0, e));
  vec3 deepc = mix(DEEP0, DEEP1, smoothstep(0.0, -42.0, e));
  deepc = mix(deepc, DEEPUP, smoothstep(1.0, 14.0, e) * 0.7);
  return mix(col, deepc, dpk);
}
`;

// ---------------------------------------------------------------------------------------------- the one painted material of every solid thing (sand, rock, cliff, pebbles, shells, grass, crust)
// MODES (defines): SAND, ROCK, CLIFF, PLAIN (instance colour only), FAN (alpha texture), BLADE (grass), SWAY, TOPDARK, SEEDATTR, EDGEATTR
const SURF_VS = `${GLSL_COMMON}
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vD; varying vec2 vUv; varying float vSeed; varying float vEdge; varying float vU; varying float vH;
#ifdef SEEDATTR
attribute float aSeed;
#endif
#ifdef CLIFFATTR
attribute float aU, aH;
#endif
#ifdef EDGEATTR
attribute float aEdge;
#endif
void main() {
  vec4 lp = vec4(position, 1.0); vec3 ln = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
  #endif
  vec3 vcol = vec3(1.0);
  #ifdef USE_COLOR
    vcol = color;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vcol *= instanceColor;
  #endif
  #ifdef SWAY
    vec3 base = instanceMatrix[3].xyz; float hh = position.y; float ht = length(instanceMatrix[1].xyz);
    float ph = base.x * 1.7 + base.z * 1.3;
    float s = (sin(uTime * 1.25 + ph) * 0.65 + sin(uTime * 2.3 + ph * 1.9) * 0.3 + 0.4 * sin(uTime * 0.55 + base.z * 0.4)) * SWAYAMP * hh * hh * ht;
    lp.x += s; lp.z += s * 0.45 * cos(ph);
  #endif
  vP = lp.xyz; vN = ln; vC = vcol; vUv = uv;
  vSeed = 0.0; vEdge = 0.0; vU = 0.5; vH = -1.0;
  #ifdef CLIFFATTR
    vU = aU; vH = aH;
  #endif
  #ifdef SEEDATTR
    vSeed = aSeed;
  #endif
  #ifdef EDGEATTR
    vEdge = aEdge;
  #endif
  vec4 mv = modelViewMatrix * lp; vD = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SURF_FS = `${GLSL_COMMON}
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vD; varying vec2 vUv; varying float vSeed; varying float vEdge; varying float vU; varying float vH;
#ifdef FAN
uniform sampler2D uMap;
#endif
const vec3 ORANGE = ${V3("#d08a2a")}, OCHRE = ${V3("#b89a3a")}, PINK = ${V3("#c9739a")}, PURPLE = ${V3("#7a5aa0")}, OLIVE = ${V3("#7a8a3a")}, RED = ${V3("#b8333a")}, BARN = ${V3("#d8d8c8")};
// the light patches the shafts lay on things that face up (each shaft: x, z of its foot, radius, strength)
float shaftLight(vec3 p) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) { vec4 q = uShaft[i]; vec2 d = p.xz - q.xy; float r = q.z; float k = exp(-dot(d, d) / (r * r)); k *= 0.75 + 0.25 * vn2(p.xz * 3.2 + vec2(uTime * 0.5, float(i) * 3.1)); s += k * q.w; }
  return s;
}
vec3 crustPaint(vec3 base, vec3 q, float sd, float amount) {
  vec3 c = base * (0.82 + 0.34 * vn3(q * 8.0 + sd));
  float p1 = vn3(q * 2.7 + sd * 7.0), p2 = vn3(q * 4.6 + 11.0 + sd * 3.0), p3 = vn3(q * 7.5 + 23.0 + sd), p4 = vn3(q * 3.3 + 41.0 + sd * 5.0);
  float f = vn3(q * 21.0 + sd * 2.0);
  c = mix(c, OLIVE * 0.8, smoothstep(0.6, 0.7, p4) * 0.6 * amount);
  c = mix(c, ORANGE * 0.9, smoothstep(0.72, 0.78, p1) * (0.35 + 0.3 * f) * amount);
  c = mix(c, PINK * 0.85, smoothstep(0.74, 0.8, p2) * (0.35 + 0.3 * f) * amount);
  c = mix(c, PURPLE * 0.9, smoothstep(0.78, 0.84, p3) * 0.45 * amount);
  c = mix(c, OCHRE * 0.85, smoothstep(0.7, 0.78, vn3(q * 6.0 + 71.0 + sd)) * 0.55 * amount);
  float dots = smoothstep(0.84, 0.88, vn3(q * 45.0 + sd)); c = mix(c, BARN * 0.85, dots * 0.6 * amount);
  c *= 1.0 - 0.45 * smoothstep(0.78, 0.86, vn3(q * 26.0 + 5.0 + sd));   // dark pits
  return c;
}
void main() {
  vec3 n = normalize(vN);
  #ifdef NFLIP
    if (dot(n, vP - uCam) > 0.0) n = -n;
  #endif
  vec3 alb = vC;
  float fogDeep = 0.0;
  float lightK = 1.0;
  #ifdef FAN
    vec4 tx = texture2D(uMap, vUv); if (tx.a < 0.42) discard; alb *= (0.7 + 0.5 * tx.r);
  #endif
  #ifdef BLADE
    float rib = 1.0 - smoothstep(0.0, 0.07, abs(vUv.x - 0.5));
    alb = mix(alb * 0.55, alb * 1.25, smoothstep(0.0, 0.85, vUv.y)); alb = mix(alb, alb * 1.3, rib * 0.35);
    alb = mix(alb, ORANGE * 0.5 + alb * 0.5, smoothstep(0.9, 1.0, vUv.y) * 0.35);
    n = normalize(vec3(n.x * 0.5, 0.8, n.z * 0.5) + vec3(0.0, 0.6, 0.0));
  #endif
  #ifdef SAND
    vec2 p = vP.xz;
    float edge = vEdge;
    // broad tone, ripples (a warped, slowly bending set of crests) and grain
    vec2 w = p + 0.9 * vec2(vn2(p * 0.8), vn2(p * 0.8 + 7.0));
    float rip = sin(dot(w, vec2(0.94, 0.34)) * 17.0 + 1.7 * vn2(p * 2.0));
    float rip2 = sin(dot(w, vec2(0.82, -0.57)) * 9.0 + 3.0 * vn2(p * 1.3 + 4.0));
    alb = 0.9 * mix(${V3("#cdbf96")}, ${V3("#bba978")}, vn2(p * 0.35) * 0.8);
    alb = mix(alb, ${V3("#d8cca4")}, smoothstep(0.55, 0.8, vn2(p * 0.9 + 5.0)) * 0.55);
    alb *= 1.0 + 0.085 * rip + 0.04 * rip2;
    alb *= 0.93 + 0.14 * vn2(p * 55.0);
    // the rocky zone at the lip: gravel and a darker rock-sand
    float rk = smoothstep(1.6, 0.6, edge) * (0.4 + 0.6 * vn2(p * 3.0)) * 0.5;
    float rim = smoothstep(0.62, 0.46, edge + 0.06 * (vn2(p * 6.0) - 0.5));
    alb = mix(alb, ${V3("#6f7a6a")} * (0.8 + 0.4 * vn2(p * 12.0)), rk * 0.5);
    alb = mix(alb, crustPaint(${V3("#4a5e66")}, vP * 1.5, 3.0, 1.0), rim);
    // pebbles, shell bits and dark specks: one dot per cell, own place and size by hash, faded where a pixel is wider than the dot
    float px = max(fwidth(p.x), fwidth(p.y));
    for (int L = 0; L < 2; L++) {
      float sc = L == 0 ? 11.0 : 27.0;
      vec2 cp = p * sc, ci = floor(cp), cf = fract(cp);
      vec2 hh = h22(ci + float(L) * 19.0); float hc = h12(ci + 3.7 + float(L) * 11.0);
      vec2 off = 0.2 + 0.6 * hh; float rad = (L == 0 ? 0.13 : 0.1) * (0.5 + hc);
      float dd = length((cf - off) * vec2(1.0, 1.0 + 0.5 * hh.x));
      float fade = 1.0 - smoothstep(0.35, 1.0, px * sc);
      float clus = vn2(p * 0.7 + float(L) * 13.0); float present = step(L == 0 ? 0.72 : 0.62, hc * 0.5 + hh.y * 0.5 + 0.2 * rk + 0.3 * clus) * step(0.35, clus + 0.2 * rk);
      float m = (1.0 - smoothstep(rad * 0.75, rad, dd)) * present * fade;
      vec3 dc = hc < 0.35 ? ${V3("#5c5e5a")} : (hc < 0.62 ? ${V3("#8a7a58")} : (hc < 0.88 ? ${V3("#ece4d0")} : ${V3("#6f6a58")}));
      float rimk = smoothstep(rad * 0.5, rad, dd);
      alb = mix(alb, dc * (1.05 - 0.4 * rimk) , m * 0.9);
      alb = mix(alb, alb * 0.55, m * 0.0);
      // a little dark crescent shadow on the side away from the light
      float sh = (1.0 - smoothstep(rad, rad * 1.6, length(cf - off - vec2(0.03, 0.04)))) * (1.0 - m) * present * fade;
      alb *= 1.0 - 0.28 * sh;
    }
    // silt patches in the hollows
    alb = mix(alb, alb * ${V3("#a8b890")}, smoothstep(0.62, 0.8, vn2(p * 0.55 + 20.0)) * 0.3);
    // ripple relief shading
    float gx = 17.0 * 0.94 * cos(dot(w, vec2(0.94, 0.34)) * 17.0), gz = 17.0 * 0.34 * cos(dot(w, vec2(0.94, 0.34)) * 17.0);
    n = normalize(n + vec3(-gx, 0.0, -gz) * 0.006 * (1.0 - rk) * (1.0 - rim));
  #endif
  #ifdef ROCK
    alb = crustPaint(alb, vP * 1.0, vSeed, 0.8);
    // weed film and shadow in the lower part
    alb *= 0.85 + 0.25 * smoothstep(-0.3, 0.6, n.y);
  #endif
  #ifdef CLIFF
    // tall columnar rock: every column its own facet angle (lit #3f6a78 / shade #23404c), deep dark cracks between columns, a muted mottle, a thin silt dusting on the ledge tops
    float isCol = vH >= 0.0 ? 1.0 : 0.0;
    vec3 L2 = normalize(vec3(-0.35, 0.3, -0.9)), L3 = normalize(vec3(0.85, 0.1, 0.5));
    float facet = clamp(0.48 + 0.9 * dot(n, L2) - 0.35 * max(dot(n, L3), 0.0) + 0.3 * (vH - 0.5) * isCol, 0.0, 1.0);
    vec3 base = mix(${V3("#23404c")}, ${V3("#3f6a78")}, facet);
    vec3 q = vec3(vP.x * 1.2, vP.y * 0.22, vP.z * 3.0);
    base *= 0.84 + 0.32 * vn3(q * 3.0 + 3.0);
    base = mix(base, base * 1.28 + ${V3("#101a18")}, smoothstep(0.62, 0.8, vn3(q * 6.0 + 9.0)) * 0.45);
    vec3 c2 = base;
    vec3 sq = vec3(vP.x * 1.6, vP.y * 2.2, vP.z * 3.0);
    c2 = mix(c2, OLIVE * 0.5, smoothstep(0.66, 0.8, vn3(sq * 3.0 + 19.0)) * 0.18);
    c2 = mix(c2, OCHRE * 0.55, smoothstep(0.76, 0.86, vn3(sq * 4.5 + 5.0)) * 0.1);
    c2 = mix(c2, PINK * 0.5, smoothstep(0.8, 0.88, vn3(sq * 6.5 + 31.0)) * 0.15);
    c2 = mix(c2, PURPLE * 0.55, smoothstep(0.8, 0.88, vn3(sq * 8.0 + 7.0)) * 0.15);
    c2 *= 0.9 + 0.2 * vn3(vP * 17.0);
    c2 = mix(c2, BARN * 0.6, smoothstep(0.86, 0.9, vn3(vP * 30.0)) * 0.3);
    // cracks: a dark gap at each column edge, and hairline cracks inside the columns
    float eu = min(vU, 1.0 - vU);
    float crack = (1.0 - smoothstep(0.0, 0.1, eu + 0.03 * vn2(vec2(vP.y * 1.5, vP.z)))) * isCol;
    c2 *= 1.0 - 0.92 * crack;
    float hl = smoothstep(0.1, 0.14, vU) * (1.0 - smoothstep(0.16, 0.26, vU)) * isCol;
    c2 = mix(c2, ${V3("#5f8f9c")}, hl * 0.65 * (0.5 + 0.5 * vH));
    float cr = abs(fract(vP.z * 2.1 + 0.8 * vn2(vec2(vP.z * 2.0, vP.y * 0.2))) - 0.5);
    c2 *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.03, cr)) * vn2(vec2(vP.z * 4.0, vP.y * 0.5)) * isCol;
    float bed = abs(fract(vP.y * 0.7 + 0.8 * vn2(vec2(vP.z * 0.6, vP.y * 0.3))) - 0.5);
    c2 *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.03, bed));
    float topK = smoothstep(0.55, 0.9, n.y);
    c2 = mix(c2, ${V3("#6f8a88")} * (0.8 + 0.3 * vn2(vP.xz * 9.0)), topK * 0.22);
    alb = c2;
    fogDeep = 1.0;
  #endif
  #ifdef TOPDARK
    if (n.y > 0.9) alb *= 0.25;
  #endif
  float nl = dot(n, KEYDIR);
  float amb = mix(0.52, 0.86, n.y * 0.5 + 0.5);
  vec3 col = alb * (amb + 0.4 * max(nl, 0.0));
  #ifdef CLIFF
    col = alb * (0.95 + 0.35 * max(nl, 0.0));
  #endif
  // shaft light patches on the upward faces (over the shelf only)
  #ifdef SAND
    col += alb * ${V3("#e8fff0")} * shaftLight(vP) * 0.34 * (1.0 + 0.0);
  #else
    col += alb * ${V3("#e8fff0")} * shaftLight(vP) * 0.22 * smoothstep(0.1, 0.8, n.y);
  #endif
  // fog toward the water; the cliff toward the deep, darker the deeper
  float fk = fogK(vD);
  vec3 fogCol = WATER;
  #ifdef CLIFF
    float dk = clamp(0.3 - vP.y / 14.0, 0.0, 1.0); dk = dk * dk * (3.0 - 2.0 * dk);
    fogCol = mix(WATER * 0.9, mix(DEEP0 * 1.2, DEEP1, clamp(-vP.y / 30.0, 0.0, 1.0)), dk);
    fk = max(fk, 0.0) * mix(0.9, 1.0, dk);
    // deeper means darker even near (the light does not reach)
    col = mix(col, DEEP0 * 1.15, smoothstep(-1.0, -15.0, vP.y) * 0.85);
    col *= mix(1.0, 0.6, clamp(-vP.y / 30.0, 0.0, 1.0));
  #endif
  gl_FragColor = vec4(mix(col, fogCol, fk), 1.0);
  #include <colorspace_fragment>
}`;
function surfMat(defs = {}, uniforms = {}) {
  const m = new THREE.ShaderMaterial({
    defines: { SWAYAMP: "0.2", ...defs }, uniforms: { ...uniforms }, vertexShader: SURF_VS, fragmentShader: SURF_FS,
    side: "DOUBLE" in defs ? THREE.DoubleSide : THREE.FrontSide, vertexColors: "VCOL" in defs,
  });
  delete m.defines.VCOL; delete m.defines.DOUBLE; if ("DOUBLE" in defs) m.defines.NFLIP = "";
  m.userData.noOutline = true; m.userData.solid = false; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true;
  m.extensions = { derivatives: true };
  return m;
}
function mark(o, { order, surface = true } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = false; if (surface) m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}

// ---------------------------------------------------------------------------------------------- geometry helpers
function colAttr(geo, rgb) { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = rgb[0]; a[i * 3 + 1] = rgb[1]; a[i * 3 + 2] = rgb[2]; } geo.setAttribute("color", new THREE.BufferAttribute(a, 3)); return geo; }
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _m = new THREE.Matrix4(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0), AX_Y = new THREE.Vector3(0, 1, 0);
// a batch of instances of one geometry: add() the matrix pieces and a colour, build() once
class Batch {
  constructor(geo) { this.geo = geo; this.m = []; this.c = []; }
  add(px, py, pz, sx, sy, sz, dir, twist, hex, jit = 0.12, k = 0) {
    _q.setFromUnitVectors(UP, _v.set(dir[0], dir[1], dir[2]).normalize()); _q2.setFromAxisAngle(AX_Y, twist); _q.multiply(_q2);
    _m.compose(_p.set(px, py, pz), _q, _s.set(sx, sy, sz)); this.m.push(..._m.elements);
    _c.set(hex); const j = 1 + (hs(this.m.length, 9 + k) - 0.5) * 2 * jit; this.c.push(_c.r * j, _c.g * j, _c.b * j);
  }
  get n() { return this.c.length / 3; }
  build(mat) {
    const n = this.n, im = new THREE.InstancedMesh(this.geo, mat, Math.max(1, n));
    im.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(this.m.length ? this.m : 16), 16);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.c.length ? this.c : 3), 3);
    im.count = n; im.frustumCulled = false; return im;
  }
}

// ---------------------------------------------------------------------------------------------- the shelf terrain (one indexed grid, the lip as its last column)
function buildTerrain() {
  const XS = [-120, -80, -56, -42, -32, -26, -22, -19, -16.5, -14.2, -12.2, -10.4, -8.8, -7.4, -6.2, -5.1, -4.1, -3.2, -2.4, -1.7, -1.1, -0.55, 0, 0.55, 1.1, 1.6, 2.0, 2.4];
  const ZS = [-120, -80, -60, -46, -38];
  for (let z = -34; z <= 34.001; z += 0.8) ZS.push(+z.toFixed(2));
  ZS.push(38, 46, 60, 80, 120);
  const x0 = -120, nx = XS.length, nz = ZS.length, pos = new Float32Array(nx * nz * 3), edge = new Float32Array(nx * nz), idx = [];
  const lip0 = 2.4;
  for (let j = 0; j < nz; j++) {
    const z = ZS[j], L = lipAt(z);
    for (let i = 0; i < nx; i++) {
      const s = (XS[i] - x0) / (lip0 - x0), x = x0 + s * (L - x0), k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = groundY(x, z); pos[k * 3 + 2] = z; edge[k] = L - x;
    }
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------- the cliff: boundaries along z, 4 tiers, 3 ledges, columnar facets
const TIER_TOP = [-0.25, null, null, null];
function buildCliff(seed) {
  const ZB = []; let z = -36, k = 0; while (z < 36) { ZB.push(z); z += 0.6 + 1.5 * Math.pow(hs(k++, 3 + seed), 1.3); } ZB.push(z);
  const nb = ZB.length, LV = [-6, -12, -19];
  const ylev = (i, zz) => LV[i] + 0.55 * (vn2(zz * 0.17 + i * 9, i * 3.3, 4) - 0.5) * 2;
  const NR = 6;   // rows per face
  // per tier arrays: xt (top x), xb (bottom x), row x offsets, yt, yb
  const tiers = [];
  let xtPrev = null;
  for (let t = 0; t < 4; t++) {
    const T = { xt: [], xb: [], yt: [], yb: [], off: [] };
    for (let b = 0; b < nb; b++) {
      const zz = ZB[b], h = hs(b + t * 131, 11 + seed);
      let xt;
      if (t === 0) xt = lipAt(zz) + 0.7 * (h - 0.5) + 0.12;
      else { const w = clamp(1.0 + 2.0 * vn2(zz * 0.12 + t * 5.3, t * 1.7, 6) + 0.9 * (hs(b, 21 + t) - 0.5), 0.9, 3.1); xt = tiers[t - 1].xb[b] + w; }
      const yt = t === 0 ? -0.25 + 0.12 * (hs(b, 5) - 0.5) : ylev(t - 1, zz), yb = t < 3 ? ylev(t, zz) : -36;
      const lean = (t === 3 ? 0.9 : 0.55) * (hs(b + t * 977, 31 + seed) - 0.25) * (t === 3 ? 1.5 : 1);
      T.xt.push(xt); T.xb.push(xt + lean); T.yt.push(yt); T.yb.push(yb);
      const row = []; for (let r = 0; r <= NR; r++) row.push((r === 0 || r === NR) ? 0 : (hs(b * 17 + r * 5 + t * 301, 41 + seed) - 0.5) * 0.3 * (r % 2 ? 1 : 0.7));
      T.off.push(row);
    }
    tiers.push(T);
  }
  const P = [];   // triangle soup, non-indexed
  const UU = [], HH = [];
  const tri = (a, ua, b, ub, c, uc, h) => { P.push(...a, ...b, ...c); UU.push(ua, ub, uc); HH.push(h, h, h); };
  const rowPos = (T, b, r) => { const f = r / NR; return [lerp(T.xt[b], T.xb[b], f) + T.off[b][r], lerp(T.yt[b], T.yb[b], Math.pow(f, 1.0)), ZB[b]]; };
  for (let t = 0; t < 4; t++) {
    const T = tiers[t];
    for (let b = 0; b < nb - 1; b++) for (let r = 0; r < NR; r++) {
      const a = rowPos(T, b, r), bb = rowPos(T, b + 1, r), c = rowPos(T, b, r + 1), d = rowPos(T, b + 1, r + 1);
      const hh = hs(b + t * 131, 77 + seed); tri(a, 0, bb, 1, c, 0, hh); tri(bb, 1, d, 1, c, 0, hh);
    }
    if (t < 3) {   // the ledge top between this tier's bottom and the next tier's top (same y at each boundary)
      const N = tiers[t + 1];
      for (let b = 0; b < nb - 1; b++) {
        const a = [T.xb[b], T.yb[b], ZB[b]], bb = [T.xb[b + 1], T.yb[b + 1], ZB[b + 1]], c = [N.xt[b], N.yt[b], ZB[b]], d = [N.xt[b + 1], N.yt[b + 1], ZB[b + 1]];
        const m1 = [(a[0] + c[0]) / 2 + 0.3 * (hs(b, 55) - 0.5), a[1] + 0.3 * (hs(b, 56) - 0.5), ZB[b]], m2 = [(bb[0] + d[0]) / 2 + 0.12 * (hs(b + 1, 55) - 0.5), bb[1] + 0.3 * (hs(b + 1, 56) - 0.5), ZB[b + 1]];
        tri(a, 0, bb, 1, m1, 0, -1); tri(bb, 1, m2, 1, m1, 0, -1); tri(m1, 0, m2, 1, c, 0, -1); tri(m2, 1, d, 1, c, 0, -1);
      }
    }
  }
  // a skirt under the first tier's top edge, closing to the shelf (the terrain edge is at lipAt, y -0.25)
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute("aU", new THREE.BufferAttribute(new Float32Array(UU), 1)); g.setAttribute("aH", new THREE.BufferAttribute(new Float32Array(HH), 1)); g.computeVertexNormals();
  // face lookup: x of tier t at z, fraction f of its height (0 top .. 1 bottom): returns [x, y, z, nx, nz]
  const faceAt = (t, zz, f) => {
    let b = 0; while (b < nb - 2 && ZB[b + 1] < zz) b++;
    const k = clamp((zz - ZB[b]) / (ZB[b + 1] - ZB[b])), T = tiers[t], r = Math.min(NR - 1, Math.floor(f * NR)), fr = f * NR - r;
    const x = (bb) => lerp(lerp(T.xt[bb], T.xb[bb], r / NR) + T.off[bb][r], lerp(T.xt[bb], T.xb[bb], (r + 1) / NR) + T.off[bb][r + 1], fr);
    const y = (bb) => lerp(lerp(T.yt[bb], T.yb[bb], r / NR), lerp(T.yt[bb], T.yb[bb], (r + 1) / NR), fr);
    const xa = x(b), xb = x(b + 1), dz = ZB[b + 1] - ZB[b], nxn = dz, nzn = -(xb - xa), l = Math.hypot(nxn, nzn);
    return [lerp(xa, xb, k), lerp(y(b), y(b + 1), k), zz, nxn / l, nzn / l];
  };
  const ledgeAt = (t, zz, u) => {   // t = 0..2, u 0 (inner edge) .. 1 (outer)
    let b = 0; while (b < nb - 2 && ZB[b + 1] < zz) b++;
    const k = clamp((zz - ZB[b]) / (ZB[b + 1] - ZB[b])), T = tiers[t], N = tiers[t + 1];
    const xa = lerp(T.xb[b], N.xt[b], u), xb = lerp(T.xb[b + 1], N.xt[b + 1], u);
    return [lerp(xa, xb, k), lerp(T.yb[b], T.yb[b + 1], k) + 0.02, zz];
  };
  return { geo: g, faceAt, ledgeAt, ZB };
}

// ---------------------------------------------------------------------------------------------- rocks (displaced spheres with a painted crust) and what grows on them
function rockLocal(R, d) {   // the surface point (in the rock's own frame) for the unit direction d
  const n1 = vn3(d[0] * 1.9 + R.seed * 3.1, d[1] * 1.9, d[2] * 1.9, 1) - 0.5, n2 = vn3(d[0] * 4.7 + 5, d[1] * 4.7 + R.seed, d[2] * 4.7, 2) - 0.5, n3 = vn3(d[0] * 11 + 9, d[1] * 11, d[2] * 11 + R.seed, 3) - 0.5;
  const strata = 0.05 * Math.sin(d[1] * 9 + R.seed * 5 + n1 * 3);
  const rr = 1 + 0.5 * n1 + 0.1 * n2 + 0.03 * n3 + 0.4 * strata;
  let x = d[0] * rr * R.r * R.sx, y = d[1] * rr * R.r * R.sy, z = d[2] * rr * R.r * R.sz;
  y = Math.max(y, -0.38 * R.r * R.sy);
  return [x, y, z];
}
function rockWorld(R, d) {
  const l = rockLocal(R, d), c = Math.cos(R.yaw), s = Math.sin(R.yaw);
  return [R.x + l[0] * c + l[2] * s, R.y + l[1], R.z - l[0] * s + l[2] * c];
}
function buildRocks(seed) {
  const R = [];
  const KEY = [[-4.2, 3.4, 1.05, 0.62], [-6.9, 0.5, 0.82, 0.66], [-3.0, -3.0, 0.55, 0.7], [-9, 6.5, 0.95, 0.6], [-1.0, -4.7, 0.5, 0.7], [0.6, -5.1, 0.42, 0.7], [-2.4, 6.3, 0.4, 0.7],
    [-6.5, -5.2, 0.72, 0.65], [-12, -2, 1.15, 0.6], [-14.5, 8, 0.85, 0.62], [-5.4, 9.8, 0.62, 0.7], [-1.6, 3.9, 0.3, 0.75], [-3.6, 1.2, 0.34, 0.7], [-2.2, -1.8, 0.22, 0.7]];
  KEY.forEach(([x, z, r, sy], i) => R.push({ x, z, r, sx: 1 + 0.2 * (hs(i, 70) - 0.5), sy, sz: 1 + 0.25 * (hs(i, 71) - 0.5), yaw: hs(i, 72) * TAU, seed: i + 1, kind: "key" }));
  let n = 0, tries = 0;
  while (n < 40 && tries < 400) {
    tries++; const x = -36 + 36.2 * hs(tries, 80 + seed), z = -28 + 56 * hs(tries, 81 + seed), r = 0.12 + 0.62 * Math.pow(hs(tries, 82 + seed), 2.2);
    if (x > lipAt(z) - 1.0 || (Math.abs(x) < 2.6 && Math.abs(z) < 2.6) || R.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 0.2)) continue;
    R.push({ x, z, r, sx: 1 + 0.3 * (hs(tries, 83) - 0.5), sy: 0.5 + 0.3 * hs(tries, 84), sz: 1 + 0.3 * (hs(tries, 85) - 0.5), yaw: hs(tries, 86) * TAU, seed: 20 + tries, kind: "scatter" }); n++;
  }
  // the broken rim along the lip: blocks 0.2-0.5 m high, some gaps
  for (let zz = -33, i = 0; zz < 33; zz += 0.7 + 0.8 * hs(i, 90), i++) {
    const inPlay = Math.abs(zz) < 2.4;
    if (!inPlay && hs(i, 91) < 0.16) continue;
    const r = (inPlay ? 0.26 + 0.1 * hs(i, 92) : (0.24 + 0.22 * hs(i, 92)) * (zz > 3 ? 0.7 : 1)), x = lipAt(zz) + (inPlay ? 0.1 : -0.1) + (hs(i, 93) - 0.5) * 0.3;
    R.push({ x, z: zz, r, sx: 1.0 + 0.4 * hs(i, 94), sy: inPlay ? 0.55 : 0.6 + 0.35 * hs(i, 95), sz: 0.9 + 0.4 * hs(i, 96), yaw: hs(i, 97) * TAU, seed: 60 + i, kind: "rim" });
  }
  R.forEach((o) => { o.y = groundY(o.x, o.z) + (o.kind === "rim" ? 0.0 : 0.05 * o.r); });
  // geometry: one displaced sphere per rock, merged
  const parts = [];
  const greys = ["#46586a", "#4e5e66", "#42525e", "#58606a", "#4c5a62"];
  R.forEach((o, i) => {
    let g = new THREE.IcosahedronGeometry(1, o.r > 0.3 ? 4 : 3); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4);
    const p = g.attributes.position, c = Math.cos(o.yaw), s = Math.sin(o.yaw), base = lin(greys[i % greys.length]);
    for (let k = 0; k < p.count; k++) {
      const d = _v.set(p.getX(k), p.getY(k), p.getZ(k)).normalize().toArray(), l = rockLocal(o, d);
      p.setXYZ(k, o.x + l[0] * c + l[2] * s, o.y + l[1], o.z - l[0] * s + l[2] * c);
    }
    const n = p.count, col = new Float32Array(n * 3), sd = new Float32Array(n);
    for (let k = 0; k < n; k++) { const j = 0.85 + 0.3 * hs(i, 33); col[k * 3] = base.r * j; col[k * 3 + 1] = base.g * j; col[k * 3 + 2] = base.b * j; sd[k] = o.seed * 1.37; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1)); g.computeVertexNormals(); parts.push(g);
  });
  return { rocks: R, geo: mergeGeometries(parts) };
}

// ---------------------------------------------------------------------------------------------- the small geometries that get instanced
const memoGeo = (k, f) => once("geo:" + k, f);
function bladeGeo() {   // a tapered ribbon, 6 segments, y 0..1, x -0.5..0.5 scaled by the instance
  return memoGeo("blade", () => {
    const S = 6, pos = [], uv = [], idx = [];
    for (let i = 0; i <= S; i++) { const y = i / S, w = 0.5 * (1 - Math.pow(y, 1.6) * 0.92), bend = 0.16 * y * y; pos.push(-w, y, bend, w, y, bend); uv.push(0, y, 1, y); }
    for (let i = 0; i < S; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeVertexNormals(); return g;
  });
}
function pebbleGeo() {
  return memoGeo("pebble", () => {
    let g = new THREE.IcosahedronGeometry(0.5, 1); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4);
    const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const j = 0.82 + 0.36 * hs(Math.round(p.getX(k) * 977 + p.getY(k) * 331 + p.getZ(k) * 113), 12); p.setXYZ(k, p.getX(k) * j, p.getY(k) * j, p.getZ(k) * j); }
    g.computeVertexNormals(); return g;
  });
}
function shellGeo() {   // a scallop: a ribbed dome over a fan outline, hinge at the origin, 1 m across (scale it)
  return memoGeo("shell", () => {
    const NT = 16, NR = 6, pos = [], idx = [];
    for (let r = 0; r <= NR; r++) for (let t = 0; t <= NT; t++) {
      const rr = (r / NR) * 0.5, th = (t / NT - 0.5) * 2.0, rib = 0.018 * Math.sin(th * 12) * (r / NR), dome = 0.12 * Math.sin((r / NR) * Math.PI * 0.8) * (1 - th * th * 0.4);
      pos.push(rr * Math.cos(th), dome + rib + (r === 0 ? 0 : 0), rr * Math.sin(th));
    }
    for (let r = 0; r < NR; r++) for (let t = 0; t < NT; t++) { const a = r * (NT + 1) + t, b = a + 1, c = a + NT + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  });
}
function tubeGeo() { return memoGeo("tube", () => new THREE.CylinderGeometry(0.42, 0.58, 1, 7, 1, false).translate(0, 0.5, 0)); }
function barnGeo() { return memoGeo("barn", () => new THREE.CylinderGeometry(0.3, 0.52, 1, 6, 1, false).translate(0, 0.5, 0)); }
function blobGeo() { return memoGeo("blob", () => { let g = new THREE.IcosahedronGeometry(0.5, 1); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4); g.computeVertexNormals(); return g; }); }
function fanGeo() { return memoGeo("fan", () => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)); }
function fanTex() {
  return once("fanTex", () => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    g.lineCap = "round"; g.strokeStyle = "#ffffff";
    let n = 0;
    const branch = (x, y, a, len, w, d) => {
      const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; g.lineWidth = w; g.globalAlpha = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      if (d <= 0) return; const k = 2 + (hs(n++, 40) > 0.6 ? 1 : 0);
      for (let i = 0; i < k; i++) branch(x2, y2, a + (i - (k - 1) / 2) * (0.42 + 0.2 * hs(n++, 41)) + (hs(n++, 42) - 0.5) * 0.2, len * (0.62 + 0.15 * hs(n++, 43)), Math.max(1.4, w * 0.66), d - 1);
    };
    branch(128, 250, 0, 58, 7, 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// ---------------------------------------------------------------------------------------------- the whole place
function atbshelf(P) {
  const S = P.spec, G = P.whole, seed = S.seed ?? 1, swayK = S.sway ?? 1, fogLen = S.fog ?? 22;
  const U = { uTime: { value: 0 }, uFog: { value: fogLen }, uCam: { value: new THREE.Vector3(0, 3, 9) }, uShaft: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 3, 0)) } };
  const gp = new THREE.Vector3();
  const track = (cam) => { G.getWorldPosition(gp); U.uCam.value.set(cam.position.x - gp.x, cam.position.y - gp.y, cam.position.z - gp.z); };
  const add = (o, name, order, surface = true) => { o.name = name; G.add(mark(o, { order, surface })); if (!surface) o.traverse((m) => { m.userData.steam = true; }); return o; };
  const M = (defs) => surfMat(defs, U);

  // ---- backdrop sphere: follows the camera by view rotation only, drawn first, never fogged
  const bd = new THREE.ShaderMaterial({
    uniforms: U, depthTest: false, depthWrite: false, side: THREE.BackSide,
    vertexShader: `${GLSL_COMMON}\nvarying vec3 vDir;\nvoid main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `${GLSL_COMMON}\nvarying vec3 vDir;\nvoid main() { gl_FragColor = vec4(bgColor(normalize(vDir)), 1.0);\n  #include <colorspace_fragment>\n}`,
  });
  bd.userData.noOutline = true; bd.userData.outlineParameters = { visible: false };
  const bdm = add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), bd), "atbshelf-backdrop", -1000, false); bdm.onBeforeRender = (r, s, cam) => track(cam);

  // ---- the water surface seen from below at y +20: moving ripple lines, blended into the backdrop with distance
  const sf = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `${GLSL_COMMON}\nvarying vec3 vP; void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `${GLSL_COMMON}\nvarying vec3 vP;
void main() {
  vec3 v = vP - uCam; float d = length(v); vec3 dir = v / d;
  vec2 p = vP.xz * 0.42; float t = uTime;
  vec2 q = p + 0.5 * vec2(sin(p.y * 1.7 + t * 0.7), cos(p.x * 1.5 + t * 0.6));
  float c = 0.5 * vn2(q * 1.0 + vec2(t * 0.12, 0.0)) + 0.3 * vn2(q * 2.3 - vec2(0.0, t * 0.2) + 5.0) + 0.2 * vn2(q * 5.0 + t * 0.3 + 9.0);
  float line = smoothstep(0.07, 0.0, abs(c - 0.52)) * (1.0 - smoothstep(8.0, 90.0, d)), sheen = smoothstep(0.35, 0.7, c);
  vec3 col = mix(${V3("#2f86a0")}, ${V3("#5fa8bc")}, sheen * 0.85);
  col = mix(col, ${V3("#a8dcea")}, line * 0.5);
  vec3 bg = bgColor(dir);
  float k = smoothstep(30.0, 420.0, d);
  gl_FragColor = vec4(mix(col, bg, k), 1.0 - smoothstep(380.0, 640.0, d) * 0.0);
  #include <colorspace_fragment>
}`,
  });
  sf.userData.noOutline = true; sf.userData.outlineParameters = { visible: false };
  const surf = add(new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1).rotateX(Math.PI / 2).translate(0, 20, 0), sf), "atbshelf-surface", -900, false);

  // ---- the shelf sand
  const sandM = M({ SAND: "", EDGEATTR: "" });
  add(new THREE.Mesh(once("terrain", buildTerrain), sandM), "atbshelf-sand", 1);
  // Spud's contact shadow: the engine's key light only shadows the world origin, not this place, so a soft dark oval is painted on the sand at each spec.shadows
  // entry [x, z, radius] (default one at Spud's mark [0.9, 0, 0.4]); thrown 0.1 m away from the key light (the light is up and slightly left-behind)
  {
    const sm = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      vertexShader: `varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv;\nvoid main() { float d = length(vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(0.15, 1.0, d)) * 0.5; gl_FragColor = vec4(0.02, 0.09, 0.11, a);\n  #include <colorspace_fragment>\n}`,
    });
    sm.userData.noOutline = true; sm.userData.outlineParameters = { visible: false };
    const B = new Batch(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
    for (const [x, z, r] of (S.shadows ?? [[0.9, 0, 0.4]])) B.add(x + 0.05, 0.006, z + 0.12, r * 2.0, 1, r * 2.3, [0, 1, 0], 0, "#ffffff", 0, 1);
    add(B.build(sm), "atbshelf-spudshadow", 2);
  }

  // ---- the cliff
  const cliff = once("cliff" + seed, () => buildCliff(seed));
  add(new THREE.Mesh(cliff.geo, M({ CLIFF: "", DOUBLE: "", CLIFFATTR: "" })), "atbshelf-cliff", 1);

  // ---- rocks
  const rk = once("rocks" + seed, () => buildRocks(seed));
  add(new THREE.Mesh(rk.geo, M({ ROCK: "", VCOL: "", SEEDATTR: "" })), "atbshelf-rocks", 1);
  // contact shadows under the rocks (dark soft ovals thrown away from the light)
  {
    const sg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), sm = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      vertexShader: `${GLSL_COMMON}\nvarying vec2 vUv; varying float vD;\nvoid main() { vUv = uv; vec4 lp = instanceMatrix * vec4(position, 1.0); vec4 mv = modelViewMatrix * lp; vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${GLSL_COMMON}\nvarying vec2 vUv; varying float vD;\nvoid main() { float d = length(vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(0.35, 1.0, d)) * 0.42 * (1.0 - fogK(vD)); gl_FragColor = vec4(${V3("#102a30")}, a);\n  #include <colorspace_fragment>\n}`,
    });
    sm.userData.noOutline = true; sm.userData.outlineParameters = { visible: false };
    const B = new Batch(sg);
    rk.rocks.forEach((o) => { const sc = o.r * (o.kind === "rim" ? 3.0 : 2.7); B.add(o.x + 0.3 * o.r, groundY(o.x, o.z) + 0.012, o.z + 0.22 * o.r, sc * 1.1 * o.sx, 1, sc * 0.9 * o.sz, [0, 1, 0], 0, "#ffffff", 0, 1); });
    add(B.build(sm), "atbshelf-rockshadows", 1.5);
  }

  // ---- ground scatter: pebbles, shells; every one from a hash of its index
  const sandPos = (i, k, xmin, xmax, zmin, zmax) => [xmin + (xmax - xmin) * hs(i, k), zmin + (zmax - zmin) * hs(i, k + 1)];
  const rockHit = (x, z) => rk.rocks.some((o) => Math.hypot(o.x - x, o.z - z) < o.r * 1.15);
  {
    const B = new Batch(pebbleGeo()), PAL = ["#55575a", "#6a6a60", "#8a7452", "#6a5440", "#b8b3a0", "#7a8078", "#a8745a", "#4a4a50"];
    for (let i = 0, n = 0; n < 1700 && i < 6000; i++) {
      const near = n < 1200, [x, z] = near ? sandPos(i, 100 + seed, -16, 2.2, -12, 14) : sandPos(i, 100 + seed, -40, 2.0, -30, 30);
      if (x > lipAt(z) - 0.25 || rockHit(x, z)) continue;
      const inPlay = PLAY(x, z, 0.2); if (inPlay && hs(i, 103) > 0.12) continue;
      const sz = (inPlay ? 0.014 : 0.025) + 0.085 * Math.pow(hs(i, 104), 2.4) * (near ? 1 : 1.5), hgt = sz * (0.45 + 0.3 * hs(i, 105));
      B.add(x, groundY(x, z) + hgt * 0.1, z, sz * (1 + 0.5 * hs(i, 106)), hgt, sz * (1 + 0.4 * hs(i, 107)), [0, 1, 0], hs(i, 108) * TAU, PAL[Math.floor(hs(i, 109) * PAL.length)], 0.14, 2); n++;
    }
    add(B.build(M({ PLAIN: "" })), "atbshelf-pebbles", 1);
  }
  {
    const B = new Batch(shellGeo()), PAL = ["#f1ead8", "#e8d4c0", "#d8b87a", "#f6f0e4", "#e8c8b8", "#c9a88a"];
    for (let i = 0, n = 0; n < 650 && i < 4000; i++) {
      const [x, z] = n < 450 ? sandPos(i, 200 + seed, -14, 2.2, -10, 12) : sandPos(i, 200 + seed, -34, 2.0, -26, 26);
      if (x > lipAt(z) - 0.3 || rockHit(x, z)) continue;
      const inPlay = PLAY(x, z, 0.2); if (inPlay && hs(i, 203) > 0.1) continue;
      const sz = (inPlay ? 0.03 : 0.04) + 0.07 * hs(i, 204), tilt = (hs(i, 205) - 0.5) * 0.5;
      const dir = [Math.sin(tilt), 1, Math.cos(hs(i, 206) * TAU) * 0.1]; B.add(x, groundY(x, z) + 0.004, z, sz, sz * (inPlay ? 0.45 : 1), sz, dir, hs(i, 207) * TAU, PAL[Math.floor(hs(i, 208) * PAL.length)], 0.08, 3); n++;
    }
    add(B.build(M({ PLAIN: "", DOUBLE: "" })), "atbshelf-shells", 1);
  }

  // ---- crust on rocks and the cliff: sponge tubes, barnacles, coralline blobs, fan weed, weed tufts
  const tubes = new Batch(tubeGeo()), barns = new Batch(barnGeo()), blobs = new Batch(blobGeo()), fans = new Batch(fanGeo()), weeds = new Batch(bladeGeo());
  const SPONGE = ["#b8862e", "#a8742a", "#b87a34"], CORAL = ["#a8708a", "#8a6a8a", "#9a7a90", "#b08a9a", "#7a6a96"], FAN = ["#a8303a", "#b8402a", "#6a4a8a", "#c04a3a", "#8a3a6a"], WEED = ["#6a7a3a", "#5a7a3a", "#8a8a3a", "#4a6a3a"];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // grow one cluster at point p with surface normal n (unit array)
  const cluster = (p, nn, i, scale, kinds) => {
    const t1 = norm([-nn[2], 0, nn[0]]).map((v) => v), t2 = [nn[1] * t1[2] - nn[2] * t1[1], nn[2] * t1[0] - nn[0] * t1[2], nn[0] * t1[1] - nn[1] * t1[0]];
    const at = (a, b) => [p[0] + t1[0] * a + t2[0] * b, p[1] + t1[1] * a + t2[1] * b, p[2] + t1[2] * a + t2[2] * b];
    const kind = kinds[Math.floor(hs(i, 300) * kinds.length)], cnt = [3, 14, 3, 1, 3][kind] + Math.floor(hs(i, 301) * [5, 14, 4, 1, 3][kind]);
    for (let k = 0; k < cnt; k++) {
      const a = (hs(i * 11 + k, 302) - 0.5) * 0.22 * scale * (kind === 1 ? 1.4 : 1), b = (hs(i * 11 + k, 303) - 0.5) * 0.22 * scale * (kind === 1 ? 1.4 : 1), q = at(a, b), j = i * 13 + k;
      const lean = norm([nn[0] + (hs(j, 304) - 0.5) * 0.5, nn[1] + (hs(j, 305) - 0.5) * 0.5, nn[2] + (hs(j, 306) - 0.5) * 0.5]);
      if (kind === 0) { const r = (0.014 + 0.014 * hs(j, 307)) * scale, h = (0.03 + 0.05 * hs(j, 308)) * scale; tubes.add(q[0], q[1], q[2], r * 2, h, r * 2, nn, hs(j, 309) * TAU, SPONGE[Math.floor(hs(j, 310) * 3)], 0.1, 4); }
      else if (kind === 1) { const r = (0.003 + 0.004 * hs(j, 311)) * scale; barns.add(q[0], q[1], q[2], r * 2, r * (0.7 + 0.6 * hs(j, 312)), r * 2, nn, hs(j, 313) * TAU, "#d6d6c6", 0.1, 5); }
      else if (kind === 2) { const r = (0.02 + 0.03 * hs(j, 314)) * scale; blobs.add(q[0], q[1], q[2], r * 1.5, r * 0.5, r * 1.4, nn, hs(j, 315) * TAU, CORAL[Math.floor(hs(j, 316) * 5)], 0.1, 6); }
      else if (kind === 3) { const w = (0.14 + 0.2 * hs(j, 317)) * scale; fans.add(q[0], q[1], q[2], w, w * (0.9 + 0.3 * hs(j, 318)), w, [Math.abs(nn[1]) > 0.7 ? 0 : 0, 1, 0], 0, "#ffffff", 0, 7);
        // orient the fan flat to the surface: its normal (local z) along nn
        const mm = fans.m, o = mm.length - 16; _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _v.set(nn[0], nn[1], nn[2])); _q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (hs(j, 319) - 0.5) * 1.2); _q.multiply(_q2);
        _m.compose(_p.set(q[0] + nn[0] * 0.01, q[1] + nn[1] * 0.01, q[2] + nn[2] * 0.01), _q, _s.set(w, w * (0.9 + 0.3 * hs(j, 318)), w)); for (let e = 0; e < 16; e++) mm[o + e] = _m.elements[e];
        _c.set(FAN[Math.floor(hs(j, 320) * 5)]); fans.c.splice(fans.c.length - 3, 3, _c.r, _c.g, _c.b); }
      else { const h = (0.08 + 0.16 * hs(j, 321)) * scale; weeds.add(q[0], q[1], q[2], 0.02 * scale, h, 0.02, norm([nn[0] * 0.6, nn[1] + 0.5, nn[2] * 0.6]), hs(j, 322) * TAU, WEED[Math.floor(hs(j, 323) * 4)], 0.14, 8); }
    }
  };
  rk.rocks.forEach((o, ri) => {
    const nC = Math.round(o.kind === "rim" ? 2 + 7 * o.r : (o.r > 0.5 ? 38 * o.r + 10 : 8 + 25 * o.r)), sc = clamp(0.6 + o.r * 1.2, 0.6, 1.5);
    for (let c = 0; c < nC; c++) {
      const i = ri * 97 + c; const th = hs(i, 330) * TAU, y = 0.1 + 0.9 * Math.pow(hs(i, 331), 0.85), rr = Math.sqrt(1 - y * y);
      const d = [rr * Math.cos(th), y * (o.kind === "rim" && y > 0.6 ? 0.95 : 0.9), rr * Math.sin(th)], dd = norm(d), p = rockWorld(o, dd);
      const e = 0.04 * o.r, p2 = rockWorld(o, norm([dd[0] + e, dd[1], dd[2]])), p3 = rockWorld(o, norm([dd[0], dd[1], dd[2] + e]));
      const a = [p2[0] - p[0], p2[1] - p[1], p2[2] - p[2]], b = [p3[0] - p[0], p3[1] - p[1], p3[2] - p[2]];
      let nn = norm([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]); if (nn[0] * dd[0] + nn[1] * dd[1] + nn[2] * dd[2] < 0) nn = nn.map((v) => -v);
      if (PLAY(p[0], p[2], 0.15) && p[1] < 0.25) continue;
      cluster(p, nn, i, sc, [1, 1, 1, 1, 1, 2, 4, 3, 0]);
    }
  });
  // the cliff faces: a lot of small clusters, more at the ledges; ledge tops get weed tufts and sponge
  for (let i = 0; i < 1100; i++) {
    const t = Math.floor(hs(i, 340) * 4), zz = -30 + 60 * hs(i, 341), f = 0.04 + 0.92 * hs(i, 342);
    const fa = cliff.faceAt(t, zz, f); if (fa[1] < -26) continue;
    const nn = norm([fa[3], 0.08, fa[4]]);
    cluster([fa[0] + nn[0] * 0.01, fa[1], fa[2]], nn, 5000 + i, 1.8, [1, 1, 1, 1, 3, 4, 0, 1]);
  }
  for (let i = 0; i < 90; i++) {
    const t = Math.floor(hs(i, 360) * 4), zz = -28 + 56 * hs(i, 361), fa = cliff.faceAt(t, zz, 0.1 + 0.8 * hs(i, 362)); if (fa[1] < -22) continue;
    cluster([fa[0] + fa[3] * 0.02, fa[1], fa[2]], norm([fa[3], 0.05, fa[4]]), 7000 + i, 1.9, [3]);
  }
  for (let i = 0; i < 360; i++) {
    const t = Math.floor(hs(i, 350) * 3), zz = -30 + 60 * hs(i, 351), l = cliff.ledgeAt(t, zz, 0.05 + 0.9 * hs(i, 352));
    cluster(l, [0, 1, 0], 9000 + i, 1.7, [0, 2, 4, 4, 1]);
  }
  add(tubes.build(M({ PLAIN: "", TOPDARK: "" })), "atbshelf-sponge", 1);
  add(barns.build(M({ PLAIN: "", TOPDARK: "" })), "atbshelf-barnacles", 1);
  add(blobs.build(M({ PLAIN: "" })), "atbshelf-coralline", 1);
  {
    const fm = M({ PLAIN: "", FAN: "", DOUBLE: "" }); fm.uniforms.uMap = { value: fanTex() };
    add(fans.build(fm), "atbshelf-fans", 1);
  }
  add(weeds.build(M({ PLAIN: "", BLADE: "", SWAY: "", DOUBLE: "", SWAYAMP: (0.5 * swayK).toFixed(3) })), "atbshelf-weed", 1);

  // ---- seagrass: tufts of blades, thick at the left and in the foreground, none within 6 m of the lip
  {
    const B = new Batch(bladeGeo()), PAL = ["#3f8a4a", "#348044", "#4a9a52", "#5aa458", "#2f7a46", "#6aa850"];
    for (let i = 0, n = 0; n < 3600 && i < 30000; i++) {
      const x = -27 + 23.4 * hs(i, 400 + seed), z = -22 + 44 * hs(i, 401 + seed);
      const dens = (0.5 + 0.9 * sstep(-5, -12, x)) * (0.6 + 0.4 * sstep(0, 6, z)) * (0.35 + 0.65 * sstep(1.0, 9.0, 18 - Math.abs(z - 4) * 0.6)) + 0.35 * sstep(-3, -4.0, x) * 0.0;
      const zone = sstep(0.5, 3, z) * sstep(-13, -8, x) * sstep(-3.4, -5, x) * sstep(12, 7, z);
      if (hs(i, 402) > (dens + 2.2 * zone) * 1.7 || x > lipAt(z) - 6.2 || rockHit(x, z)) continue;
      const nb = 5 + Math.floor(hs(i, 403) * 5), rad = 0.07, hmax = (0.5 + 0.7 * hs(i, 404)) * (0.85 + 0.35 * sstep(-6, -16, x)) * (1 + 0.7 * zone);
      for (let b = 0; b < nb; b++) {
        const j = i * 9 + b, a = hs(j, 405) * TAU, rr = rad * Math.sqrt(hs(j, 406)), bx = x + Math.cos(a) * rr, bz = z + Math.sin(a) * rr, h = hmax * (0.55 + 0.45 * hs(j, 407)), w = 0.026 + 0.028 * hs(j, 408);
        B.add(bx, groundY(bx, bz) - 0.01, bz, w, h, w, [Math.cos(hs(j, 409) * TAU) * 0.16, 1, Math.sin(hs(j, 409) * TAU) * 0.16], hs(j, 410) * TAU, PAL[Math.floor(hs(j, 411) * PAL.length)], 0.1, 9);
      }
      n++;
    }
    add(B.build(M({ PLAIN: "", BLADE: "", SWAY: "", DOUBLE: "", SWAYAMP: (0.55 * swayK).toFixed(3) })), "atbshelf-seagrass", 1);
  }

  // ---- 8 light shafts (two crossed soft cards each), over the shelf only; their feet are also the light patches on the sand
  const SH = [];
  for (let i = 0; i < 8; i++) SH.push({ x: -12 + 12 * hs(i, 500 + seed), z: -14 + 20 * hs(i, 501 + seed), w: 0.9 + 1.2 * hs(i, 502), ph: hs(i, 503) * TAU, yaw: hs(i, 504) * Math.PI, sp: 0.5 + 0.5 * hs(i, 505) });
  const D = new THREE.Vector3(0.117, -0.94, 0.32).normalize();
  let shaftIM;
  {
    const sg = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), sm = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `${GLSL_COMMON}\nvarying vec2 vUv; varying float vD; varying float vPh; varying float vY;\nvoid main() { vUv = vec2(uv.x, -position.y); vPh = instanceMatrix[3].x * 0.7; vec4 lp = instanceMatrix * vec4(position, 1.0); vY = lp.y; vec4 mv = modelViewMatrix * lp; vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${GLSL_COMMON}\nvarying vec2 vUv; varying float vD; varying float vPh; varying float vY;
void main() {
  float u = abs(vUv.x - 0.5) * 2.0, v = vUv.y;
  float a = exp(-u * u * 3.2) * smoothstep(0.0, 0.08, v) * (1.0 - smoothstep(0.55, 1.0, v));
  a *= 0.9 + 0.1 * sin(uTime * 1.4 + vPh) + 0.08 * vn2(vec2(vUv.x * 4.0 + vPh, v * 9.0 - uTime * 0.25));
  a *= 0.3 * (1.0 - 0.45 * fogK(vD)) * smoothstep(-1.5, 3.0, vY);
  gl_FragColor = vec4(${V3("#9fd4e0")}, a);
  #include <colorspace_fragment>
}`,
    });
    sm.userData.noOutline = true; sm.userData.outlineParameters = { visible: false };
    shaftIM = new THREE.InstancedMesh(sg, sm, 16); shaftIM.frustumCulled = false; add(shaftIM, "atbshelf-shafts", 30, false);
  }
  const placeShafts = (t) => {
    SH.forEach((s, i) => {
      const dx = 0.7 * Math.sin(t * 0.13 * s.sp + s.ph), dz = 0.7 * Math.cos(t * 0.11 * s.sp + s.ph * 1.3), fx = s.x + dx, fz = s.z + dz;   // the foot at y 0
      const len = 22.6, topY = 20, k = topY / -D.y, w = s.w * (1 + 0.12 * Math.sin(t * 0.4 + s.ph));
      const topx = fx - D.x * k, topz = fz - D.z * k;
      // the card hangs from its top point along D; the second card is crossed with it
      for (let c = 0; c < 2; c++) {
        _q.setFromUnitVectors(UP.clone().negate(), D); _q2.setFromAxisAngle(D, s.yaw + (c * Math.PI) / 2); _q2.multiply(_q);
        _m.compose(_p.set(topx, topY, topz), _q2, _s.set(w * 1.4, len + 2, 1)); shaftIM.setMatrixAt(i * 2 + c, _m);
      }
      U.uShaft.value[i].set(fx, fz, 1.5 * w, 0.55 * (0.8 + 0.2 * Math.sin(t * 1.1 + s.ph)));
    });
    shaftIM.instanceMatrix.needsUpdate = true;
  };

  // ---- silt motes: 1400 points drifting in a box that wraps round the camera
  {
    const N = 1400, sp = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
    for (let i = 0; i < N; i++) { sp[i * 3] = hs(i, 600); sp[i * 3 + 1] = hs(i, 601); sp[i * 3 + 2] = hs(i, 602); ph[i] = hs(i, 603) * TAU; sz[i] = hs(i, 604); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3)); g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1)); g.setAttribute("aSz", new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false,
      vertexShader: `${GLSL_COMMON}\nattribute float aPh, aSz; varying float vA;
void main() {
  vec3 box = vec3(16.0, 9.0, 16.0);
  vec3 c = uCam + vec3(0.0, -1.0, 0.0), wob = 0.05 * vec3(sin(uTime * 0.9 + aPh), sin(uTime * 0.7 + aPh * 1.7), cos(uTime * 0.8 + aPh * 1.3));
  vec3 p = position * box + vec3(0.06 * uTime, -0.02 * uTime, 0.03 * uTime) + wob;
  p = c + mod(p - c + box * 0.5, box) - box * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = mix(1.5, 2.6, aSz) * clamp(6.0 / max(-mv.z, 1.0), 0.6, 1.2);
  vec3 bgc = bgColor(normalize(p - uCam)); float lum = dot(bgc, vec3(0.3, 0.5, 0.2));
  vA = (0.12 + 0.22 * aSz) * (1.0 - fogK(length(mv.xyz))) * (0.12 + 0.88 * smoothstep(0.03, 0.2, lum)) * step(aSz, 0.75);
}`,
      fragmentShader: `${GLSL_COMMON}\nvarying float vA;\nvoid main() { vec2 q = gl_PointCoord - 0.5; if (dot(q, q) > 0.25) discard; gl_FragColor = vec4(${V3("#bfe0c0")}, vA);\n  #include <colorspace_fragment>\n}`,
    });
    m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const pts = add(new THREE.Points(g, m), "atbshelf-silt", 31, false); pts.onBeforeRender = (r, s, cam) => track(cam);
  }

  return {
    grip: 0,
    apply(ps, t) { U.uTime.value = t; placeShafts(t); },
  };
}

export const AT_B_SHELF_KINDS = { atbshelf };
export const AT_B_SHELF_GRIPS = {};
