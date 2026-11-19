import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { ICELAKE, shoreDist } from "./set-icelake.js";

// "icelake" world props (friends try to 12 "frozen lake", task T1): icejetty, lakeice, icesplash, icerod, icebucket.
// Design: storyboards/series/friends-try-to/12-frozen-lake/DESIGN-frozen-lake.md sections 3 and 4 (the numbers there are the spec); the
// jetty is section 2.5. The world round them is the set `icelake` (set-icelake.js, exports the shoreline the ice reads). Metres, y up,
// +z toward the main camera, ice top y 0, origin = Chip's mark (0, 0). Everything is hashed from spec.seed or an index and is a function
// of the prop's keys and the story time (no Math.random, no clock, nothing remembered between frames). No lettering anywhere.
//
// --------------------------------------------------------------------------------------------------------------------------
// lakeice    the whole lake's ice top inside the set's shoreline, with the fishing hole, the crack web, the slab and the open water
//            under it: one surface, no seam within 8 m of the origin. PUT IT at x 0, y 0, z 0 (it draws in world coordinates; its
//            origin is the world origin = Chip's mark). Size: the lake, about 18 x 30 m. NOT solid (the ice is the floor; the cast
//            stands on y 0), the water, cracks and splash decals are see-through (steam). Not held.
//   SPEC   hole [-0.30, 1.60, 0.22]   centre x, z and radius of the fishing hole (wall 0.14 deep, water at y -0.02, a slush rim to
//                                     r +0.12 with 12 lumps 0.025 high, auger shavings on the lee side)
//          web [0, 0]                 the crack web's centre (Chip's mark)
//          marks { wedge [-1.35, 0.10], mash [0.80, -0.60], spud [-0.55, -0.85] }   where arms B, C, D end (the friends' feet: the arm
//                                     ends keep their offset from the default marks); the arms run on past them to full length
//          slab [7 points]            K1..K7, default [[-0.14,0.85],[0.74,-0.32],[1.41,-0.04],[1.62,0.59],[1.29,1.24],[0.61,1.65],[0.04,1.31]]
//                                     (x, z); each edge gets 2-3 kinks of +-0.04; the lip K1-K2 is tangent to ring 1 (0.40 from the web)
//          pivot [[-0.01,1.18],[1.07,-0.26]]   the line the slab turns about (the K4 side goes down)
//          tipDeg 18                  the slab's angle at slab 1
//          seed 12                    hashes the cracks' kinks, the chips, the shavings
//          shadows [[x, z, rx, rz]]   soft contact shadows (#34508c at 0.4, shifted 0.06 toward (0.35, -0.48)); default: the two rod
//                                     stands and the jetty's four mooring piles (the bucket moves: the look's own oval follows it). The CAST gets its own from the look (pass the
//                                     friends' places here only if the look's brown ovals clash)
//          tails [[x, z, len, wid]]   lee tails of drift snow behind things, along the wind (0.94, 0.34); default: the hole's rim, both
//                                     rod stands, the four mooring piles
//   KEYS   crack 0..1 (propState's own, default 0): the web grows by length from the first line, as the design's table: 0.05 the first
//                line from the hole's rim to K1 (0.62 m, FRAME 0), 0.10 on to the web centre (1.53 m) + 2 spurs, 0.20 arm B to Wedge's feet,
//                0.30 arm C to Mash's, 0.40 arm D to Spud's, 0.50 arms E and F + a Y fork on B, C, D, 0.65 ring 1 (r 0.40), 0.80 ring 2
//                (r 0.85, off the slab sector) + 6 links + the white halo under Chip (r 0.45), 1.00 ring 3 (3 pieces) + every arm to full
//                length (B 2.5, C 2.2, D 1.9, E 1.7, F 1.6 m) + 14 twigs. Nothing fades in: a tip runs from start to end, linear.
//          run 0..1 (default 0, prime with a dur-0 set at t 0): the line round the slab: 0..0.25 from (0.32, 0.24) along the lip to K1
//                and K2, 0.25..1 both tips race round the outline and meet between K4 and K5; from 0.9 its core turns water colour.
//          slab 0..1 (default 0, prime): the slab turns as one block, 0.14 thick, about the pivot, tipDeg x slab. Water at y -0.02 shows
//                under it (body #0a1322); ice under less than 0.12 of water shows through dark; a foam line on every edge at the water.
//          churn 0..1 (default 0, prime): the open water moves: 3 ripple lines running in from the edges at 0.5 m/s, 40 foam flecks, 12
//                ice chips bobbing.
//          sink 0..1 (default 0): the tipped slab drops 0.9 under the water and is hidden at 1 (the v3 ending: open water stays).
//          (`tip` and `tilt` are the engine's own keys and are NOT used here.)
//   LOOK   body #5a7fc0, blotches #3f5c96, frost #93b2de, lightening toward the horizon to #c9d3ee; bubbles; drift streaks along the wind
//          (at most 10 % inside r 1.6 of the origin, 60 % within 2 m of the shore, all snow in the last 0.6 m); cracks: white band with a
//          dark core and a pale halo, at least 3.0 / 2.0 / 1.2 px wide at 1080 wide (the ribbons widen with the view, so a line running
//          across the picture stays readable).
//   NOTE   the cast on the ice: where the ice meets the slab outline the ice is cut; when the slab is tipped the sheet shows its 0.14 wall.
//          Gear on the slab (gearheap, bucket) is the director's: they use the same `slab` tween and pivot.
//
// icejetty   the wooden jetty: deck z -3.40..-2.10, x -2.30 (head) .. +8.60 (on the bank), top y 0.20; a ledge z -2.10..-1.82, x -1.90..+1.95,
//            top y 0.10 (two rises of 0.10: the friends step up); rail on the -z edge (both edges from x 1.95 to the bank), 4 mooring piles
//            with rope, a hanging coil on the pile at x 1.95, piles in ice collars under the deck, snow drifts, icicles. ORIGIN: the
//            world origin (put it at x 0, y 0, z 0; spec.x/z move all of it). Size 10.9 x 0.85 x 1.9 m (deck + rail + piles). SOLID (the
//            cast stands on it). Not held. Exported ICEJETTY_POSTS lists the piles and rail posts ([x, y, z, r, h], world frame at
//            the origin) for engine/shared/obstacles.js (qa/clear.mjs): the director registers them there.
//   SPEC   seed 12.
//
// icerod     an ice-fishing rod resting at 35 degrees on an X stand: rod 0.42 long, blank #2e3440, orange tip #e8542c, cork handle
//            #8a5f3a, reel #8e98a3, stand legs #7a5a3a 0.16 high, 0.14 spread; a line to the water. ORIGIN: the stand's foot, on the ice;
//            the rod points along local +x (rot 180 points it -x). Size 0.34 x 0.30 x 0.14 m. Solid, not held.
//   SPEC   hole [-0.30, 1.60, 0.22] the hole it fishes (WORLD x, z; the line ends 0.10 inside its near rim), reach 0.3 unused, rot is the
//          prop's own `rot` (the line is aimed from spec.rot, which must match the prop's rot).
//   Place: (-0.80, 0, 1.72) rot 0, and (0.20, 0, 1.78) rot 180. The line sways 0.006 at 0.4 Hz.
//
// icebucket  a galvanised bucket: r 0.11 at the rim, 0.085 at the foot, 0.19 high, steel #9fb0c4, rim #d3dae1, inside #3b4048, two hoop
//            ridges, 3 dents, a wire bail lying to one side, a frost ring at the foot; empty. ORIGIN: bottom centre on the ice. Size
//            0.24 x 0.19 x 0.24 m (with the bail). Solid. Body for the director's physics: ICELAKE_BODIES.icebucket (bounce 0.1, friction 0.5).
//            Place: (0.67, 0, 1.35) (on the slab). Not held (no grip defined; ICELAKE_GRIPS is empty).
//
// icesplash  real water thrown up where the heap goes in: a crown with 14 uneven fingers (base r 0.30 -> 0.70, 0.55 high at puff 0.22), a
//            jet 0.9 high that pinches into 4 blobs, 110 drops (gravity 9.8), mist, a wet wash on the ice (60 % stays at puff 1) and 3
//            rings on the open water. No stars, no white outline, no speed lines. ORIGIN: the entry point on the water.
//   SPEC   scale 1 (the prop's own `scale`; use 0.5 and 0.4 for the small ones), dur 1.2 (seconds a puff 0 -> 1 tween takes: set it to the
//          tween's duration, the drops fall in real time), seed 12, slab: the slab outline (default as lakeice: no wash inside it).
//   KEY    puff 0..1 (propState's own): tween it linear over `dur`. See-through (steam), not solid. Size about 1.4 x 1.0 x 1.4 m.
//   Use: one at scale 1 at (1.42, -0.02, 0.94) when the heap's front reaches the water, two at 0.5 within 0.3 s, one at 0.4 for the bucket.
// --------------------------------------------------------------------------------------------------------------------------

export const ICELAKE_GRIPS = {};
export const ICELAKE_BODIES = { icebucket: { bounce: 0.1, friction: 0.5 } };
export const ICEJETTY_SIZE = { w: 10.9, h: 0.85, d: 1.9 };
export const SLAB_DEFAULT = [[-0.14, 0.85], [0.74, -0.32], [1.41, -0.04], [1.62, 0.59], [1.29, 1.24], [0.61, 1.65], [0.04, 1.31]];
export const PIVOT_DEFAULT = [[-0.01, 1.18], [1.07, -0.26]];

const V3 = THREE.Vector3, D2R = Math.PI / 180, TAU = Math.PI * 2;
const C = (h) => new THREE.Color(h);
const hz = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const g3 = (hex) => { const c = C(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const fx = (o, order = 5) => { o.traverse((c) => { c.frustumCulled = false; c.castShadow = c.receiveShadow = false; c.userData.steam = true; c.userData.solid = false; c.userData.lookOnly = true; if (c.isMesh) c.renderOrder = order; }); return o; };
const notSolid = (o) => { o.traverse((c) => { c.userData.solid = false; c.userData.lookOnly = true; c.castShadow = c.receiveShadow = false; c.frustumCulled = false; }); return o; };
// solid for the contact checks and the hands, but left out of the look's ground oval (its box would be the whole prop): `steam` is how the look skips a mesh there
const solidNoOval = (o) => { o.traverse((c) => { if (c.isMesh) { c.userData.solid = true; c.userData.steam = true; } }); return o; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// a soup of unindexed triangles (flat shading); quad() flips its winding to face `out`
class Soup {
  constructor() { this.p = []; }
  tri(a, b, c) { this.p.push(...a, ...b, ...c); }
  quad(a, b, c, d, out) { if (out && dot3(cross3(sub3(b, a), sub3(c, a)), out) < 0) [b, d] = [d, b]; this.tri(a, b, c); this.tri(a, c, d); }
  slab(x0, x1, y0, y1, z0, z1, bottom = false) {
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    return this;
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.computeVertexNormals(); return g; }
}
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal") n.deleteAttribute(k); return n; };
const mergeFlat = (list) => mergeGeometries(list.map(flat));
const withColor = (g, col) => { const n = flat(g), a = new Float32Array(n.attributes.position.count * 3), c = C(col); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } n.setAttribute("color", new THREE.BufferAttribute(a, 3)); return n; };

// a flat polygon (x, z points, with holes) lying at y = 0, facing up
function flatShape(outer, holes = []) {
  const mk = (pts) => pts.map(([x, z]) => new THREE.Vector2(x, -z));
  const s = new THREE.Shape(mk(outer)); for (const h of holes) s.holes.push(new THREE.Path(mk(h)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g;
}
const circlePts = (cx, cz, r, n = 40) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cz + Math.sin((i / n) * TAU) * r]);
const polyArea = (p) => { let a = 0; p.forEach((q, i) => { const r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; }); return a / 2; };
function inPoly(p, x, z, m = 0) {
  let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < ((p[j][0] - p[i][0]) * (z - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  if (c || m <= 0) return c;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const ax = p[j][0], az = p[j][1], bx = p[i][0] - ax, bz = p[i][1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)); if (Math.hypot(x - ax - bx * t, z - az - bz * t) < m) return true; }
  return false;
}

// ================================================================================================================ shared GLSL
const GL = `
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
// ice under water: dark, to black at 0.12 under the surface (water y -0.02)
vec3 underWater(vec3 c, float y) { if (y > -0.02) return c; float d = clamp((-0.02 - y) / 0.12, 0.0, 1.0); return mix(c * 0.55, vec3(0.004, 0.008, 0.02), d); }
`;
const shaderMat = (o) => {
  const m = new THREE.ShaderMaterial({ side: THREE.FrontSide, ...o });
  m.userData.noOutline = true; m.userData.solid = false; return m;
};
const VS_WORLD = `uniform vec3 uLocOff; varying vec3 vW; varying vec3 vL;
void main() { vL = position + uLocOff; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WALLC = ["#d2eef2", "#7fb6d4", "#3f78a8"];

// ================================================================================================================ the ice shader
const ICE_FS = `
uniform sampler2D uShore; uniform vec4 uBox; uniform vec4 uSh[12]; uniform vec4 uTail[16]; uniform float uNSh, uNTail;
varying vec3 vW; varying vec3 vL; ${GL}
const vec2 WD = vec2(0.94, 0.34); const vec2 WP = vec2(-0.34, 0.94);
float shoreD(vec2 p) { return texture2D(uShore, (p - uBox.xy) / uBox.zw).r * 4.0; }
void main() {
  vec2 p = vL.xz;
  float aa = fwidth(p.x) + fwidth(p.y) + 1e-4;
  // body, soft dark blotches (1.5-4 m) over about 30 %, frosted patches over about 20 %
  float blot = smoothstep(0.50, 0.64, 0.6 * vn(p / 2.7 + 3.1) + 0.28 * vn(p / 1.35 + 9.0) + 0.12 * vn(p / 0.5));
  float frost = smoothstep(0.58, 0.74, 0.65 * vn(p / 3.3 + 11.7) + 0.35 * vn(p / 0.8 + 5.0));
  vec3 col = mix(${g3("#5a7fc0")}, ${g3("#3f5c96")}, blot);
  col = mix(col, ${g3("#93b2de")}, frost * 0.8 * (1.0 - 0.7 * blot));
  // 30 bubble clusters over the lake (one per 4 m cell, a few dots 0.01-0.03 in a group 0.1 wide)
  {
    vec2 cell = floor(p / 4.0); vec2 hc = h22(cell); vec2 cc = (cell + 0.06 + 0.88 * hc) * 4.0;
    if (h12(cell + 7.0) < 0.9 && length(p - cc) < 0.14) {
      float a = 0.0;
      for (int i = 0; i < 7; i++) { vec2 o = (h22(cell * 7.0 + float(i)) - 0.5) * 0.17; float r = 0.01 + 0.02 * h12(cell + float(i) * 3.7); a = max(a, 1.0 - smoothstep(r - aa, r + aa, length(p - cc - o))); }
      col = mix(col, vec3(1.0), 0.35 * a);
    }
  }
  // snow: streaks along the wind (0.6-3.5 long, 0.04-0.18 wide, tapered, one per ~2 m2 in clumps), none near the middle, drifting at the shore
  float sd = shoreD(p);
  float u = dot(p, WD), v = dot(p, WP);
  vec2 cell = vec2(floor(u / 4.0), floor(v / 0.5));
  float k1 = h12(cell + 31.0), k2 = h12(cell + 47.0), k3 = h12(cell + 59.0), k4 = h12(cell + 71.0);
  float len = mix(0.6, 3.5, k2 * k2), wid = mix(0.04, 0.18, k3), u0 = k1 * (4.0 - len), uc = cell.x * 4.0 + u0, vc = cell.y * 0.5 + 0.25 + (k4 - 0.5) * (0.5 - wid - 0.04);
  float clump = clamp(2.0 * smoothstep(0.35, 0.75, vn(p / 3.0 + 4.0)) + 0.18, 0.0, 1.6);
  float nr = mix(0.2, 1.0, smoothstep(1.6, 3.4, length(p)));
  float dens = clump * nr + 0.6 * (1.0 - smoothstep(0.0, 2.0, sd));
  float t = (u - uc) / len;
  if (h12(cell + 83.0) < dens && t > 0.0 && t < 1.0) {
    float hw = 0.5 * wid * pow(sin(3.14159 * t), 0.7);
    col = mix(col, ${g3("#eef4ff")}, 0.85 * (1.0 - smoothstep(hw - aa, hw + aa, abs(v - vc))));
  }
  // lee tails behind things
  for (int i = 0; i < 16; i++) {
    if (float(i) >= uNTail) break;
    vec4 tl = uTail[i]; vec2 q = p - tl.xy; float a = dot(q, WD) / tl.z, b = dot(q, WP);
    float w = 0.5 * tl.w * (1.0 - a) * (1.0 - 0.3 * a);
    if (a > 0.0 && a < 1.0) col = mix(col, ${g3("#eef4ff")}, 0.8 * (1.0 - smoothstep(w - aa, w + aa, abs(b))) * smoothstep(0.0, 0.06, a) * (1.0 - smoothstep(0.75, 1.0, a)));
  }
  // the last 0.6 m at the bank is all snow (a wavering edge)
  float solid = 1.0 - smoothstep(0.42, 0.62, sd + 0.22 * (vn(p * 4.0) - 0.5));
  col = mix(col, ${g3("#e0e9f8")}, solid);
  // soft contact shadows: an oval 1.1 x the footprint, shifted 0.06 toward (0.35, -0.48)
  float sh = 0.0;
  for (int i = 0; i < 12; i++) {
    if (float(i) >= uNSh) break;
    vec4 s = uSh[i]; vec2 q = (p - s.xy - vec2(0.0207, -0.0398)) / s.zw; sh = max(sh, 0.4 * (1.0 - smoothstep(0.35, 1.0, length(q))));
  }
  col = mix(col, ${g3("#34508c")}, sh * (1.0 - solid));
  // toward the horizon the ice lightens to #c9d3ee, up to 0.45 beyond 15 m from the camera
  float dc = distance(vW, cameraPosition);
#ifdef SLAB
  col = underWater(col, vW.y);
  col = mix(col, ${g3("#dfeaf7")}, 1.0 - smoothstep(0.005, 0.013, abs(vW.y + 0.02)));
#endif
  col = mix(col, ${g3("#c9d3ee")}, 0.45 * smoothstep(15.0, 45.0, dc));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const WALL_FS = `varying vec3 vW; varying vec3 vL; ${GL}
void main() {
  float y = vL.y;
  vec3 c = y > -0.03 ? ${g3(WALLC[0])} : (y > -0.10 ? ${g3(WALLC[1])} : ${g3(WALLC[2])});
  c = underWater(c, vW.y);
  c = mix(c, ${g3("#dfeaf7")}, 1.0 - smoothstep(0.005, 0.013, abs(vW.y + 0.02)));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
// the open water: body #0a1322 over the black below, glint facets, foam on every edge, ripples and flecks with `churn`
const WATER_FS = `
uniform vec2 uPoly[40]; uniform float uN; uniform vec3 uCirc; uniform float uT, uChurn, uAlpha; varying vec3 vW; varying vec3 vL; ${GL}
float edgeD(vec2 p) {
  if (uCirc.z > 0.0) return uCirc.z - length(p - uCirc.xy);
  float best = 1e9;
  for (int i = 0; i < 40; i++) {
    if (float(i) >= uN) break;
    vec2 a = uPoly[i], b = uPoly[int(mod(float(i) + 1.0, uN))], ab = b - a; float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); best = min(best, length(p - a - ab * t));
  }
  return best;
}
void main() {
  vec2 p = vW.xz; float dE = edgeD(p);
  // deep in the middle, a lighter blue toward the edges (frozen lake v3: the big opening read as a black plate)
  vec3 col = mix(${g3("#2c4f7c")}, ${g3("#0f1f38")}, smoothstep(0.02, 0.55, dE)); float a = uAlpha;
  // glint facets 0.12 across on 8 %, drifting 0.2 m/s
  vec2 q = p / 0.12 + vec2(uT * 0.2 / 0.12, 0.0), cell = floor(q), f = fract(q) - 0.5;
  float ang = h12(cell + 3.0) * 6.28, ca = cos(ang), sa = sin(ang); vec2 r = vec2(ca * f.x - sa * f.y, sa * f.x + ca * f.y);
  float gln = step(h12(cell), 0.08) * (1.0 - smoothstep(0.18, 0.24, abs(r.x) + abs(r.y) * 2.2));
  col = mix(col, ${g3("#2b426e")}, gln); a = max(a, gln * 0.85);
  if (uChurn > 0.01) {
    // three ripple lines 0.12 apart running in from the edges at 0.5 m/s
    float s = mod(uT * 0.5, 0.9);
    for (int k = 0; k < 3; k++) { float wob = 0.012 * sin(p.x * 9.0 + p.y * 7.0 + float(k) * 2.1); float rl = (1.0 - smoothstep(0.004, 0.02, abs(dE + wob - (s + 0.12 * float(k))))) * (1.0 - smoothstep(0.25, 0.7, dE)); col = mix(col, ${g3("#4b6ea3")}, 0.6 * rl * uChurn); a = max(a, rl * uChurn); }   // soft, broken, fading toward the middle
    // 40 foam flecks (0.22 m cells) drifting
    vec2 fq = p / 0.22 + vec2(uT * 0.1, uT * 0.05), fc = floor(fq), ff = fract(fq);
    if (h12(fc + 11.0) < 0.62) { vec2 fo = 0.2 + 0.6 * h22(fc + 5.0); float fr = 0.03 + 0.06 * h12(fc + 9.0); float d = length((ff - fo) * 0.22); float fl = 1.0 - smoothstep(fr * 0.22 - 0.004, fr * 0.22 + 0.004, d); col = mix(col, ${g3("#dfeaf7")}, fl * uChurn); a = max(a, fl * uChurn); }
  }
  float foam = 1.0 - smoothstep(0.016, 0.028, dE + 0.004 * sin(p.x * 40.0 + p.y * 33.0));
  col = mix(col, ${g3("#dfeaf7")}, foam); a = max(a, foam);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;
// the crack ribbons: a polyline ribbon per line, widened per vertex so the white band is never under its pixel minimum at 1080 wide
const CRACK_VS = `
attribute float aSide; attribute vec3 aDir; attribute vec4 aMeta;
uniform float uRunK;
varying float vCross; varying float vHalf; varying float vPw; varying vec4 vMeta; varying vec4 vWid; varying vec2 vMin;
void main() {
  float cls = aMeta.z; float wW, wC, wH, minW, minC;
  if (cls < 0.5) { wW = 0.045; wC = 0.012; wH = 0.11; minW = 3.0; minC = 1.0; }
  else if (cls < 1.5) { wW = 0.028; wC = 0.008; wH = 0.06; minW = 2.0; minC = 0.7; }
  else if (cls < 2.5) { wW = 0.012; wC = 0.0; wH = 0.0; minW = 1.2; minC = 0.0; }
  else if (cls < 3.5) { wW = 0.06; wC = mix(0.02, 0.035, uRunK); wH = 0.11; minW = 3.0; minC = 1.0; }
  else { wW = 0.02; wC = 0.0; wH = 0.0; minW = 1.0; minC = 0.0; }
  vec4 w4 = modelMatrix * vec4(position, 1.0);
  vec3 side3 = vec3(aDir.x, 0.0, aDir.y);
  mat4 vp = projectionMatrix * viewMatrix;
  vec4 c0 = vp * w4, c1 = vp * (w4 + vec4(side3 * 0.05, 0.0));
  float asp = projectionMatrix[1][1] / projectionMatrix[0][0];
  vec2 ref = asp < 1.0 ? vec2(1080.0, 1080.0 / asp) : vec2(1920.0, 1920.0 / asp);
  float pw = 0.5;
  if (c0.w > 0.05 && c1.w > 0.05) pw = max(length((c1.xy / c1.w - c0.xy / c0.w) * 0.5 * ref / 0.05), 0.5);
  float hf = max(wH * 0.5, max(wW * 0.75, minW * 0.75 / pw) + 1.3 / pw);
  hf = min(hf, 0.9);
  vec3 wp = w4.xyz + side3 * aSide * hf * aDir.z;
  vCross = aSide; vHalf = hf; vPw = pw; vMeta = aMeta; vWid = vec4(wW, wC, wH, cls); vMin = vec2(minW, minC);
  gl_Position = vp * vec4(wp, 1.0);
}`;
const CRACK_FS = `
uniform float uKey, uRunK, uFade;
varying float vCross; varying float vHalf; varying float vPw; varying vec4 vMeta; varying vec4 vWid; varying vec2 vMin;
void main() {
  if (vMeta.x > uKey + 1e-5) discard;
  float behind = (uKey - vMeta.x) / max(vMeta.y, 1e-4);
  bool growing = uKey < vMeta.w - 1e-4;
  float tp = growing ? mix(0.4, 1.0, clamp(behind / 0.15, 0.0, 1.0)) : 1.0;
  float fresh = growing ? 1.0 + 0.5 * (1.0 - smoothstep(0.0, 0.25, behind)) : 1.0;
  float d = abs(vCross) * vHalf * vPw;
  float wh = max(vWid.x * 0.5 * fresh * vPw, vMin.x * 0.5) * tp;
  float ch = vWid.y > 0.0 ? max(vWid.y * 0.5 * vPw, vMin.y * 0.5) * tp : 0.0;
  float hh = vWid.z * 0.5 * vPw * tp;
  float aw = 1.0 - smoothstep(wh - 0.5, wh + 0.5, d);
  float ac = ch > 0.0 ? 1.0 - smoothstep(ch - 0.5, ch + 0.5, d) : 0.0;
  float ah = hh > 0.0 ? (1.0 - smoothstep(hh - 1.0, hh + 1.0, d)) * (vWid.w < 1.5 && vWid.w > 0.5 ? 0.25 : 0.35) : 0.0;
  vec3 col = vec3(${g3("#dce8fa").slice(5, -1)});
  col = mix(col, vec3(${g3("#e0e9f8").slice(5, -1)}), aw);
  vec3 core = vWid.w > 2.5 && vWid.w < 3.5 ? mix(vec3(${g3("#1b2c55").slice(5, -1)}), vec3(${g3("#0a1322").slice(5, -1)}), uRunK) : vec3(${g3("#1b2c55").slice(5, -1)});
  col = mix(col, core, ac);
  float a = max(max(ah, aw * 0.98), ac) * uFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

// ================================================================================================================ the crack web (geometry)
// kinked polyline from a to b: a kink every 0.12-0.30 m, +-12 degrees, hashed, never a curve and never an even zigzag
function kinkPath(a, b, seed, step = [0.12, 0.30], maxDeg = 12) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  if (L < 1e-4) return [a.slice(), b.slice()];
  const tx = dx / L, tz = dz / L, nx = -tz, nz = tx, s = [0];
  let i = 0; while (s[s.length - 1] < L - step[0] - 1e-6) s.push(s[s.length - 1] + step[0] + hz(seed, ++i) * (step[1] - step[0]));
  if (s.length > 1 && L - s[s.length - 1] < 0.06) s.pop();
  if (s[s.length - 1] < L) s.push(L);
  const off = [0]; let o = 0;
  for (let k = 1; k < s.length; k++) { o += Math.tan((hz(seed, 100 + k) * 2 - 1) * maxDeg * D2R) * (s[k] - s[k - 1]); off.push(o); }
  const oe = off[off.length - 1];
  return s.map((sv, k) => [a[0] + tx * sv + nx * (off[k] - oe * (sv / L)), a[1] + tz * sv + nz * (off[k] - oe * (sv / L))]);
}
const plen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
const along = (pts, s) => { let acc = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + l >= s || i === pts.length - 1) { const t = l > 0 ? clamp((s - acc) / l) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, i, (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]))]; } acc += l; } return [...pts[pts.length - 1], pts.length - 1, 0]; };
// the point where a polyline first crosses radius r about c
function crossAt(pts, r, c = [0, 0]) {
  for (let i = 1; i < pts.length; i++) {
    const a = Math.hypot(pts[i - 1][0] - c[0], pts[i - 1][1] - c[1]), b = Math.hypot(pts[i][0] - c[0], pts[i][1] - c[1]);
    if ((a - r) * (b - r) <= 0 && a !== b) { const t = (r - a) / (b - a); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
  }
  return null;
}
const angOf = (p, c = [0, 0]) => { let a = Math.atan2(p[1] - c[1], p[0] - c[0]) / D2R; return a; };
const norm360 = (a) => ((a % 360) + 360) % 360;

class Ribbons {
  constructor() { this.pos = []; this.side = []; this.dir = []; this.meta = []; this.idx = []; this.n = 0; }
  // pts [[x, z]], cls 0 main / 1 secondary / 2 hairline / 3 run / 4 chip, arr: arrival key per vertex (monotonic), y height
  line(pts, cls, arr, y = 0.003) {
    const n = pts.length; if (n < 2) return;
    const s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const end = arr[n - 1], base = this.n;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], c = pts[i];
      let t1 = [c[0] - a[0], c[1] - a[1]], t2 = [b[0] - c[0], b[1] - c[1]];
      const l1 = Math.hypot(...t1), l2 = Math.hypot(...t2);
      t1 = l1 > 1e-9 ? [t1[0] / l1, t1[1] / l1] : t2.map((v) => v / (l2 || 1)); t2 = l2 > 1e-9 ? [t2[0] / l2, t2[1] / l2] : t1;
      let m = [-(t1[1] + t2[1]), t1[0] + t2[0]]; const ml = Math.hypot(...m) || 1; m = [m[0] / ml, m[1] / ml];
      const nrm = [-t2[1], t2[0]], mit = Math.min(1.8, 1 / Math.max(0.55, m[0] * nrm[0] + m[1] * nrm[1]));
      const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), ds = s[i1] - s[i0], rate = ds > 1e-9 ? Math.max(1e-4, (arr[i1] - arr[i0]) / ds) : 1;
      for (const sd of [-1, 1]) {
        this.pos.push(c[0], y, c[1]); this.side.push(sd); this.dir.push(m[0], m[1], mit); this.meta.push(arr[i], rate, cls, end);
      }
    }
    for (let i = 0; i < n - 1; i++) { const a = base + i * 2; this.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    this.n += n * 2;
  }
  // linear arrival from k0 to k1 along the length
  lin(pts, cls, k0, k1, y) {
    const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = s[s.length - 1] || 1; this.line(pts, cls, s.map((v) => k0 + ((k1 - k0) * v) / L), y); return s.map((v) => k0 + ((k1 - k0) * v) / L);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute("aSide", new THREE.Float32BufferAttribute(this.side, 1));
    g.setAttribute("aDir", new THREE.Float32BufferAttribute(this.dir, 3)); g.setAttribute("aMeta", new THREE.Float32BufferAttribute(this.meta, 4)); g.setIndex(this.idx);
    return g;
  }
}

// the slab outline: K1..K7 with 2-3 kinks of +-0.04 on each edge; the lip K1-K2 carries P0, the tangent point of ring 1
function slabOutline(K, web, seed) {
  const poly = [], kIdx = [];
  const foot = (a, b) => { const abx = b[0] - a[0], abz = b[1] - a[1], t = ((web[0] - a[0]) * abx + (web[1] - a[1]) * abz) / (abx * abx + abz * abz); return [a[0] + abx * t, a[1] + abz * t, t]; };
  let p0Idx = -1;
  for (let e = 0; e < K.length; e++) {
    const a = K[e], b = K[(e + 1) % K.length];
    kIdx.push(poly.length); poly.push(a.slice());
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
    const nk = 2 + Math.floor(hz(seed, 50 + e) * 2);   // 2-3 kinks
    const ts = []; for (let k = 0; k < nk; k++) ts.push((k + 0.5 + (hz(seed, 60 + e * 5 + k) - 0.5) * 0.5) / nk);
    if (e === 0) { const f = foot(a, b); ts.push(f[2]); ts.sort((x, y) => x - y); }
    ts.forEach((t, k) => {
      const isP0 = e === 0 && Math.abs(t - foot(a, b)[2]) < 1e-9, o = isP0 ? 0 : (hz(seed, 70 + e * 5 + k) < 0.5 ? -1 : 1) * (0.015 + 0.025 * hz(seed, 80 + e * 5 + k));
      if (isP0) p0Idx = poly.length;
      poly.push([a[0] + dx * t + nx * o, a[1] + dz * t + nz * o]);
    });
  }
  return { poly, kIdx, p0Idx };
}

function buildCracks(S) {
  const web = S.web, seed = S.seed, W = (p) => [p[0] + web[0], p[1] + web[1]];
  const dm = { wedge: [-1.35, 0.10], mash: [0.80, -0.60], spud: [-0.55, -0.85] }, mk = S.marks, sh = (n) => [mk[n][0] - dm[n][0], mk[n][1] - dm[n][1]];
  const o = W([0, 0]), R = new Ribbons(), RR = new Ribbons();
  const out = slabOutline(S.slab, web, seed), poly = out.poly;
  const inSlab = (x, z, m = 0.08) => inPoly(poly, x, z, m);
  const lines = {};   // full paths for ring crossings
  // ----- the first line: hole rim -> K1 (0.62 m, crack 0..0.05) -> web centre (to 1.53 m, 0.05..0.10)
  const K1 = S.slab[0];
  const L0a = kinkPath([-0.26, 1.38], [-0.35, 1.10], seed + 1).concat(kinkPath([-0.35, 1.10], K1.slice(), seed + 2).slice(1));
  const L0b = kinkPath(K1.slice(), [-0.22, 0.42], seed + 3).concat(kinkPath([-0.22, 0.42], o, seed + 4).slice(1));
  R.lin(L0a, 0, 0, 0.05); R.lin(L0b, 0, 0.05, 0.10);
  lines.L0 = L0a.concat(L0b.slice(1));
  // two spurs of 0.15 at the web centre
  for (const [ang, k] of [[165, 1], [-95, 2]]) { const e = [o[0] + 0.15 * Math.cos(ang * D2R), o[1] + 0.15 * Math.sin(ang * D2R)]; R.lin(kinkPath(o, e, seed + 10 + k, [0.05, 0.1], 18), 1, 0.06, 0.10); }
  // ----- arms: stage 1 ends at the friends' feet (or toward E, F), stage 2 runs on to full length at 0.80..1.0
  const arm = (name, end1, full, k1a, k1b, k2a, k2b, seedK, forkK) => {
    const d = [end1[0] - o[0], end1[1] - o[1]], l1 = Math.hypot(...d), u = [d[0] / l1, d[1] / l1], end2 = [o[0] + u[0] * full, o[1] + u[1] * full];
    const p1 = kinkPath(o, end1, seedK), p2 = kinkPath(end1, end2, seedK + 5);
    R.lin(p1, 0, k1a, k1b); R.lin(p2, 0, k2a, k2b); lines[name] = p1.concat(p2.slice(1));
    return { p1, p2, u, end1 };
  };
  const wB = sh("wedge"), wC = sh("mash"), wD = sh("spud");
  const B = arm("B", W([-1.22 + wB[0], 0.09 + wB[1]]), 2.5, 0.10, 0.20, 0.80, 0.92, seed + 20);
  const Cc = arm("C", W([0.70 + wC[0], -0.52 + wC[1]]), 2.2, 0.20, 0.30, 0.84, 0.96, seed + 30);
  const D = arm("D", W([-0.48 + wD[0], -0.74 + wD[1]]), 1.9, 0.30, 0.40, 0.88, 1.0, seed + 40);
  const E = arm("E", W([-0.64, 0.64]), 1.7, 0.40, 0.50, 0.82, 0.94, seed + 50);
  const F = arm("F", W([0.14, -0.79]), 1.6, 0.40, 0.50, 0.86, 0.98, seed + 60);
  // Y forks of 0.3 on the ends of B, C, D (0.40..0.50)
  [B, Cc, D].forEach((a, i) => {
    const h = Math.atan2(a.u[1], a.u[0]);
    for (const sgn of [-1, 1]) { const ang = h + sgn * (24 + 6 * hz(seed, 90 + i)) * D2R; R.lin(kinkPath(a.end1, [a.end1[0] + 0.3 * Math.cos(ang), a.end1[1] + 0.3 * Math.sin(ang)], seed + 95 + i * 2 + (sgn > 0 ? 1 : 0), [0.08, 0.15]), 1, 0.40, 0.50); }
  });
  // ----- rings: chords between arm crossings (one kink each); the slab sector (from the web, K2 .. +x .. K1) stays uncracked beyond ring 1
  const armsAll = [lines.L0, lines.B, lines.C, lines.D, lines.E, lines.F];
  const nodesAt = (r) => armsAll.map((p) => { const c = crossAt(p, r, o); return c && { p: c, a: norm360(angOf(c, o)) }; }).filter(Boolean);
  const jit = (a, r) => r + (hz(Math.round(norm360(a) * 10), seed + 3) - 0.5) * 0.06;
  const wrapD = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
  // points along an angular range [a0, a0 + span] (degrees, increasing or decreasing) with the arm crossings as nodes
  const ringPts = (r, a0, span, k) => {
    const dir = Math.sign(span), cr = nodesAt(r).map((n) => n.a), inside = [];
    for (const c of cr) { let d = (c - a0) * dir; d = ((d % 360) + 360) % 360; if (d > 1.5 && d < Math.abs(span) - 1.5) inside.push(d); }
    inside.sort((x, y) => x - y);
    const marks = [0, ...inside, Math.abs(span)], nodes = [];
    for (let i = 0; i < marks.length - 1; i++) {   // subdivide spans over 50 degrees
      const m0 = marks[i], m1 = marks[i + 1], nn = Math.ceil((m1 - m0) / 50);
      for (let j = 0; j < nn; j++) nodes.push(m0 + ((m1 - m0) * j) / nn);
    }
    nodes.push(Math.abs(span));
    const pts = [];
    for (let i = 0; i < nodes.length; i++) {
      const ang = (a0 + dir * nodes[i]) * D2R, c = nodesAt(r).find((n) => Math.abs(wrapD(n.a - (a0 + dir * nodes[i]))) < 0.01);
      if (i > 0) { const mid = (a0 + dir * (nodes[i - 1] + nodes[i]) / 2 + dir * (hz(k, i) - 0.5) * 0.3 * (nodes[i] - nodes[i - 1])) * D2R, rm = r + (hz(k, 20 + i) - 0.5) * 0.1; pts.push([o[0] + Math.cos(mid) * rm, o[1] + Math.sin(mid) * rm]); }
      const rr = jit(a0 + dir * nodes[i], r); pts.push(c ? c.p : [o[0] + Math.cos(ang) * rr, o[1] + Math.sin(ang) * rr]);
    }
    return pts;
  };
  const a0 = norm360(angOf(crossAt(lines.L0, 0.4, o) || [-0.2, 0.36], o));
  R.lin(ringPts(0.40, a0, 180, seed + 110), 1, 0.50, 0.65); R.lin(ringPts(0.40, a0, -180, seed + 120), 1, 0.50, 0.65);
  // ring 2: only on bearings outside the slab sector (K1's bearing .. round through -x .. K2's), grows 0.65..0.80
  const bK1 = norm360(angOf(S.slab[0], o)), bK2 = norm360(angOf(S.slab[1], o));
  R.lin(ringPts(0.85, bK1 + 0.5, norm360(bK2 - bK1 - 0.5), seed + 130), 1, 0.65, 0.80);
  // six links between rings 1 and 2
  [108, 155, 200, 258, 300, 331].forEach((a, i) => {
    const ang = a * D2R, p0 = [o[0] + Math.cos(ang) * 0.40, o[1] + Math.sin(ang) * 0.40], p1 = [o[0] + Math.cos(ang + 0.05) * 0.85, o[1] + Math.sin(ang + 0.05) * 0.85];
    R.lin(kinkPath(p0, p1, seed + 140 + i, [0.1, 0.2]), 1, 0.68 + 0.01 * i, 0.74 + 0.01 * i);
  });
  // ring 3: 3 pieces on about 60 % of the arc outside the sector, 0.80..1.0
  [[118, 54, 0.80, 0.92], [206, 46, 0.84, 0.96], [276, 42, 0.88, 1.0]].forEach(([s0, sp, ka, kb], i) => R.lin(ringPts(1.35, s0, sp, seed + 150 + i * 7), 1, ka, kb));
  // 14 twigs 0.1-0.25 (0.88..1.0), off the full-length arms, none into the slab sector or under the ledge
  const stage2 = [B.p2, Cc.p2, D.p2, E.p2, F.p2];
  for (let i = 0, n = 0, t = 0; n < 14 && t < 200; t++) {
    const arr = stage2[Math.floor(hz(seed, 200 + t) * stage2.length)], s = plen(arr) * (0.2 + 0.7 * hz(seed, 210 + t)), [bx, bz, , h] = along(arr, s);
    const ang = h + (hz(seed, 220 + t) < 0.5 ? -1 : 1) * (35 + 25 * hz(seed, 230 + t)) * D2R, len = 0.10 + 0.15 * hz(seed, 240 + t), e = [bx + Math.cos(ang) * len, bz + Math.sin(ang) * len];
    if (inSlab(e[0], e[1], 0.25) || e[1] < -1.7) continue;
    const ka = 0.88 + 0.1 * hz(seed, 250 + t); R.lin(kinkPath([bx, bz], e, seed + 260 + t, [0.05, 0.1]), 2, ka, Math.min(1, ka + 0.05)); n++; i++;
  }
  // 3-5 white chips at each kink of the main and secondary lines (0.01-0.03 long)
  const chipsOf = (list) => {
    for (let li = 0; li < list.length; li++) {
      const { pts, arr } = list[li];
      for (let i = 1; i < pts.length - 1; i++) {
        const nc = 3 + Math.floor(hz(seed + li, i) * 3);
        for (let c = 0; c < nc; c++) {
          const ang = hz(seed + li, i * 9 + c) * TAU, d = 0.012 + 0.04 * hz(seed + li, i * 9 + c + 4), l = 0.01 + 0.02 * hz(seed + li, i * 9 + c + 8), x = pts[i][0] + Math.cos(ang) * d, z = pts[i][1] + Math.sin(ang) * d, a2 = hz(seed + li, i * 9 + c + 12) * TAU;
          R.line([[x, z], [x + Math.cos(a2) * l, z + Math.sin(a2) * l]], 4, [arr[i], arr[i]], 0.0034);
        }
      }
    }
  };
  const chipList = [];
  const mkc = (pts, k0, k1) => { const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, arr: s.map((v) => k0 + ((k1 - k0) * v) / (s[s.length - 1] || 1)) }; };
  chipList.push(mkc(L0a, 0, 0.05), mkc(L0b, 0.05, 0.10), mkc(B.p1, 0.10, 0.20), mkc(B.p2, 0.80, 0.92), mkc(Cc.p1, 0.20, 0.30), mkc(Cc.p2, 0.84, 0.96), mkc(D.p1, 0.30, 0.40), mkc(D.p2, 0.88, 1.0), mkc(E.p1, 0.40, 0.50), mkc(E.p2, 0.82, 0.94), mkc(F.p1, 0.40, 0.50), mkc(F.p2, 0.86, 0.98));
  chipsOf(chipList);
  // ----- run: from P0 on ring 1 both ways along the lip, then both tips race round the outline and meet between K4 and K5
  const P = poly, ki = out.kIdx, p0 = out.p0Idx, n = P.length;
  const mx45 = [(S.slab[3][0] + S.slab[4][0]) / 2, (S.slab[3][1] + S.slab[4][1]) / 2];
  let mIdx = ki[3] + 1; for (let i = ki[3] + 1; i < ki[4]; i++) if (Math.hypot(P[i][0] - mx45[0], P[i][1] - mx45[1]) < Math.hypot(P[mIdx][0] - mx45[0], P[mIdx][1] - mx45[1])) mIdx = i;
  const pathA = []; for (let i = p0; i <= mIdx; i++) pathA.push(P[i]);                       // P0 .. K2 .. K3 .. K4 .. the meeting vertex
  const pathB = []; for (let i = p0; i >= 0; i--) pathB.push(P[i]); for (let i = n - 1; i >= mIdx; i--) pathB.push(P[i]);   // P0 .. K1 .. K7 .. K6 .. K5 .. the meeting vertex
  const runArr = (pts, kLip) => {   // 0..0.25 up to the lip's end vertex (K2 or K1), then 0.25..1 the rest
    const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const sl = s[kLip], L = s[s.length - 1];
    return s.map((v) => (v <= sl ? (0.25 * v) / sl : 0.25 + (0.75 * (v - sl)) / (L - sl)));
  };
  RR.line(pathA, 3, runArr(pathA, ki[1] - p0), 0.0036); RR.line(pathB, 3, runArr(pathB, p0), 0.0036);
  return { crack: R.geo(), run: RR.geo(), poly, kIdx: out.kIdx, p0: out.p0Idx };
}

// ================================================================================================================ lakeice
function shoreTexture() {
  const [x0, z0, x1, z1] = ICELAKE.bbox, mx = 0.6, bx0 = x0 - mx, bz0 = z0 - mx, sx = x1 - x0 + 2 * mx, sz = z1 - z0 + 2 * mx, res = 0.12, W = Math.ceil(sx / res), H = Math.ceil(sz / res);
  const data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = bx0 + (i + 0.5) * (sx / W), z = bz0 + (j + 0.5) * (sz / H), d = clamp(shoreDist(x, z), 0, 4) / 4;
    const k = (j * W + i) * 4; data[k] = Math.round(d * 255); data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return { tex: t, box: new THREE.Vector4(bx0, bz0, sx, sz) };
}

function lakeice(P) {
  const S0 = P.spec, S = {
    hole: S0.hole ?? [-0.30, 1.60, 0.22], web: S0.web ?? [0, 0], marks: { wedge: [-1.35, 0.10], mash: [0.80, -0.60], spud: [-0.55, -0.85], ...(S0.marks || {}) },
    slab: S0.slab ?? SLAB_DEFAULT, pivot: S0.pivot ?? PIVOT_DEFAULT, tipDeg: S0.tipDeg ?? 18, seed: S0.seed ?? 12,
  };
  const [hx, hz0, hr] = S.hole, root = P.whole;
  const cr = buildCracks(S), poly = cr.poly;
  const polyV = poly.map(([x, z]) => new THREE.Vector2(x, z));
  const [px, pz] = S.pivot[0], axD = new V3(S.pivot[1][0] - px, 0, S.pivot[1][1] - pz).normalize();
  const shadows = (S0.shadows ?? [[-0.77, 1.72, 0.19, 0.08], [0.17, 1.78, 0.19, 0.08], [-1.90, -2.10, 0.08, 0.08], [1.95, -2.10, 0.08, 0.08], [-2.30, -2.10, 0.08, 0.08], [-2.30, -3.40, 0.08, 0.08]]).slice(0, 12);
  const wind = new THREE.Vector2(...ICELAKE.wind).normalize();
  const tails = (S0.tails ?? [[hx + wind.x * 0.2, hz0 + wind.y * 0.2, 0.8, 0.28], [-0.77, 1.72, 0.55, 0.14], [0.17, 1.78, 0.55, 0.14], [-1.90, -2.10, 0.6, 0.12], [1.95, -2.10, 0.6, 0.12], [-2.30, -2.10, 0.6, 0.12], [-2.30, -3.40, 0.6, 0.12]]).slice(0, 16);
  const st = shoreTexture();
  const vec4s = (a, n) => Array.from({ length: n }, (_, i) => (a[i] ? new THREE.Vector4(a[i][0], a[i][1], a[i][2], a[i][3]) : new THREE.Vector4(0, 0, 1, 1)));
  const iceU = () => ({ uShore: { value: st.tex }, uBox: { value: st.box }, uSh: { value: vec4s(shadows, 12) }, uTail: { value: vec4s(tails, 16) }, uNSh: { value: shadows.length }, uNTail: { value: tails.length }, uLocOff: { value: new V3() } });
  // ---- the ice sheet: the shoreline with the hole and the slab outline cut out
  const sheetM = shaderMat({ vertexShader: VS_WORLD, fragmentShader: ICE_FS, uniforms: iceU() });
  const sheet = new THREE.Mesh(flatShape(ICELAKE.shore, [circlePts(hx, hz0, hr, 36), poly]), sheetM); sheet.name = "lakeice-sheet"; root.add(sheet);
  // ---- walls: the hole's (inside faces) and the sheet's cut round the slab
  const wallM = shaderMat({ vertexShader: VS_WORLD, fragmentShader: WALL_FS, uniforms: { uLocOff: { value: new V3() } } });
  const hw = new THREE.CylinderGeometry(hr, hr, 0.14, 36, 1, true); hw.translate(hx, -0.07, hz0);
  const holeWall = new THREE.Mesh(hw, wallM.clone()); holeWall.material.side = THREE.BackSide; holeWall.material.userData = { noOutline: true, solid: false }; root.add(holeWall);
  const cut = new Soup(), cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cz = poly.reduce((a, q) => a + q[1], 0) / poly.length;
  poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz; cut.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], -0.14, b[1]], [a[0], -0.14, a[1]], [-mx, 0, -mz]); });
  const cutWall = new THREE.Mesh(cut.geo(), wallM); root.add(cutWall);
  // the black below the open water (hole: at -0.14; slab opening: at -0.7, wide enough to be seen under the cut edge)
  const darkM = basic("#04080f");
  const hb = new THREE.CircleGeometry(hr, 36); hb.rotateX(-Math.PI / 2); mesh(hb, darkM, root, hx, -0.14, hz0).castShadow = false;
  const ob = new THREE.CircleGeometry(3.2, 40); ob.rotateX(-Math.PI / 2); mesh(ob, darkM, root, cx, -0.7, cz).castShadow = false;
  // ---- open water: the hole and the slab outline, one material each
  const waterU = (poly2, circ) => ({ uPoly: { value: Array.from({ length: 40 }, (_, i) => (poly2[i] ? new THREE.Vector2(...poly2[i]) : new THREE.Vector2()) ) }, uN: { value: poly2.length }, uCirc: { value: circ }, uT: { value: 0 }, uChurn: { value: 0 }, uAlpha: { value: 0.55 }, uLocOff: { value: new V3() } });
  const mkWater = (geo, y, u, order) => { const m = shaderMat({ vertexShader: VS_WORLD, fragmentShader: WATER_FS, uniforms: u, transparent: true, depthWrite: false }); const o = new THREE.Mesh(geo, m); o.position.y = y; o.renderOrder = order; return fx(o, order); };
  const holeG = new THREE.CircleGeometry(hr + 0.001, 36); holeG.rotateX(-Math.PI / 2); holeG.translate(hx, 0, hz0);
  const waterHole = mkWater(holeG, -0.02, waterU([], new V3(hx, hz0, hr)), 10); root.add(waterHole);
  const slabWaterG = flatShape(poly.map(([x, z]) => [cx + (x - cx) * 1.04, cz + (z - cz) * 1.04]));
  const waterSlab = mkWater(slabWaterG, -0.02, waterU(poly, new V3(0, 0, 0)), 10); root.add(waterSlab);
  // skim ice crescent on 15 % of the hole's water, #7fa6cc at 0.6
  { const pts = [], a0 = 150 * D2R, a1 = 245 * D2R, n = 14;
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([hx + Math.cos(a) * (hr - 0.004), hz0 + Math.sin(a) * (hr - 0.004)]); }
    for (let i = n; i >= 0; i--) { const t = i / n, a = lerp(a0, a1, t), r = hr - 0.004 - 0.085 * Math.sin(t * Math.PI); pts.push([hx + Math.cos(a) * r, hz0 + Math.sin(a) * r]); }
    const g = flatShape(pts); g.translate(0, -0.016, 0); root.add(fx(new THREE.Mesh(g, basic("#7fa6cc", { transparent: true, opacity: 0.6, depthWrite: false })), 11)); }
  // slush rim r 0.22-0.34, 0.025 high, 12 uneven lumps, #dfe9f6 with wet patches #a9bfe0
  { const NA = 60, NR = 4, pos = [], col = [], idx = [], A = C("#cfdcf0"), B = C("#a9bfe0"), t = new THREE.Color(), ph = Array.from({ length: 12 }, (_, i) => [((i + hz(S.seed, i) * 0.7) / 12) * TAU, 0.6 + 0.8 * hz(S.seed, 20 + i)]);
    const lump = (a) => { let h = 0.35; for (const [pa, pk] of ph) { let d = Math.abs(((a - pa + Math.PI * 3) % TAU) - Math.PI); d = Math.PI - d; h += pk * Math.exp(-((d / 0.24) ** 2)); } return h; };
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) {
      const a = (i % NA) / NA * TAU, u = j / NR, r = hr - 0.01 + (0.34 - hr + 0.01) * u, y = 0.025 * lump(a) * Math.pow(1 - u, 0.7) * 0.8 + (j === NR ? -0.004 : 0);
      pos.push(hx + Math.cos(a) * r, y, hz0 + Math.sin(a) * r); t.copy(A).lerp(B, smooth(0.5, 0.72, hz(Math.floor(a * 7) + j * 13, S.seed)) * (j > 0 ? 1 : 0)); col.push(t.r, t.g, t.b);
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    mesh(g, mat("#ffffff", { vertexColors: true, roughness: 0.9 }), root, 0, 0, 0).userData.solid = false;
    // auger shavings: a mound 0.25 x 0.15 x 0.05 on the lee side
    const sg = new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2); sg.scale(0.125, 0.05, 0.075);
    const sm = mesh(sg, mat("#f2f6ff", { roughness: 0.9 }), root, hx + wind.x * 0.34, 0.0, hz0 + wind.y * 0.34); sm.rotation.y = -Math.atan2(wind.y, wind.x); sm.userData.solid = false; }
  // ---- the slab: one block that turns about the pivot (its top is the ice shader in the slab's own coordinates)
  const slabG = new THREE.Group(); slabG.position.set(px, 0, pz); root.add(slabG);
  const slabU = iceU(); slabU.uLocOff.value.set(px, 0, pz);
  const slabM = shaderMat({ vertexShader: VS_WORLD, fragmentShader: ICE_FS, uniforms: slabU, defines: { SLAB: "" } });
  const top = flatShape(poly); top.translate(-px, 0, -pz); slabG.add(new THREE.Mesh(top, slabM));
  const wallU = { uLocOff: { value: new V3() } }, slabWall = shaderMat({ vertexShader: VS_WORLD, fragmentShader: WALL_FS, uniforms: wallU });
  const sides = new Soup(); poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz; sides.quad([a[0] - px, 0, a[1] - pz], [b[0] - px, 0, b[1] - pz], [b[0] - px, -0.14, b[1] - pz], [a[0] - px, -0.14, a[1] - pz], [mx, 0, mz]); });
  slabG.add(new THREE.Mesh(sides.geo(), slabWall));
  // ---- cracks (ribbons) and the halo under Chip
  const mkCrack = (geo, key, order) => {
    const m = shaderMat({ vertexShader: CRACK_VS, fragmentShader: CRACK_FS, uniforms: { uKey: { value: 0 }, uRunK: { value: 0 }, uFade: { value: 1 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -4;
    const o = new THREE.Mesh(geo, m); o.name = `lakeice-${key}`; o.renderOrder = order; root.add(fx(o, order)); return o;
  };
  const crackM = mkCrack(cr.crack, "cracks", 12), runM = mkCrack(cr.run, "run", 13);
  const haloM = shaderMat({ vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: `uniform float uA; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(${g3("#dce8fa")}, uA * 0.30 * (1.0 - smoothstep(0.25, 1.0, r)));\n#include <colorspace_fragment>\n}`, uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false });
  const hg = new THREE.PlaneGeometry(0.9, 0.9); hg.rotateX(-Math.PI / 2); const halo = new THREE.Mesh(hg, haloM); halo.position.set(S.web[0], 0.0025, S.web[1]); halo.renderOrder = 11; root.add(fx(halo, 11));
  // ---- 12 ice chips bobbing on the open water (churn): hashed spots just inside the K3-K5 edges
  const chips = Array.from({ length: 12 }, (_, i) => {
    const e = [S.slab[2], S.slab[3], S.slab[4]], k = Math.floor(hz(S.seed, 300 + i) * 2), a = e[k], b = e[k + 1], t = hz(S.seed, 310 + i), x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), inw = 0.1 + 0.4 * hz(S.seed, 320 + i);
    const dx = cx - x, dz = cz - z, l = Math.hypot(dx, dz), r = 0.03 + 0.05 * hz(S.seed, 330 + i);
    const g = new THREE.CircleGeometry(r, 6); g.rotateX(-Math.PI / 2); const o = new THREE.Mesh(g, basic("#aec8ea")); o.rotation.y = hz(S.seed, 340 + i) * 6; o.renderOrder = 11; fx(o, 11); root.add(o);
    return { o, x: x + (dx / l) * inw, z: z + (dz / l) * inw, ph: hz(S.seed, 350 + i) * TAU };
  });
  const q = new THREE.Quaternion();
  notSolid(root);
  return { grip: 0, apply(ps, t) {
    const crack = clamp(ps.crack ?? 0), run = clamp(Number(ps.run) || 0), slab = clamp(Number(ps.slab) || 0), churn = clamp(Number(ps.churn) || 0), tt = t ?? 0;
    crackM.material.uniforms.uKey.value = crack; runM.material.uniforms.uKey.value = run;
    const rk = smooth(0.9, 1.0, run); runM.material.uniforms.uRunK.value = rk; runM.material.uniforms.uFade.value = 1 - 0.8 * smooth(0.1, 0.6, slab);
    haloM.uniforms.uA.value = smooth(0.65, 0.8, crack);
    q.setFromAxisAngle(axD, S.tipDeg * D2R * slab); slabG.quaternion.copy(q);
    const sink = clamp(Number(ps.sink) || 0); slabG.position.y = -0.9 * sink; slabG.visible = sink < 0.999; waterSlab.material.uniforms.uAlpha.value = 0.55 + 0.42 * sink;   // deep open water: what is under it (the slab, a body) goes dark   // sink 0..1: the tipped slab goes under (v3 ending)
    for (const w of [waterHole, waterSlab]) { w.material.uniforms.uT.value = tt; w.material.uniforms.uChurn.value = churn; }
    waterSlab.visible = run > 0.001 || slab > 0.001;
    chips.forEach((c) => { c.o.visible = churn > 0.05; c.o.position.set(c.x, -0.02 + 0.004 + 0.01 * Math.sin(tt * 2.4 + c.ph), c.z); });
  } };
}

// ================================================================================================================ icerod
function icerod(P) {
  const S = P.spec, hole = S.hole ?? [-0.30, 1.60, 0.22], root = P.whole;
  const L = 0.42, ang = 35 * D2R, yc = 0.14, y0 = 0.05, sc = (yc - y0) / Math.sin(ang);   // the rod crosses the stand at s = sc from its handle end
  const dir = new V3(Math.cos(ang), Math.sin(ang), 0), start = new V3(-sc * Math.cos(ang), y0, 0);
  const rodG = new THREE.Group(); rodG.position.copy(start); rodG.rotation.z = ang; root.add(rodG);
  // blank 0.42 long r 0.006 -> 0.002 (a cone along local +x), orange tip, cork handle, reel
  const blank = new THREE.CylinderGeometry(0.002, 0.006, L, 8); blank.rotateZ(-Math.PI / 2); blank.translate(L / 2, 0, 0); mesh(blank, mat("#2e3440", { roughness: 0.4 }), rodG);
  const tip = new THREE.CylinderGeometry(0.0022, 0.0028, 0.04, 8); tip.rotateZ(-Math.PI / 2); tip.translate(L - 0.02, 0, 0); mesh(tip, mat("#e8542c", { roughness: 0.5 }), rodG);
  const handle = new THREE.CylinderGeometry(0.0075, 0.0085, 0.10, 10); handle.rotateZ(-Math.PI / 2); handle.translate(0.05, 0, 0); mesh(handle, mat("#8a5f3a", { roughness: 0.8 }), rodG);
  const reel = new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14); reel.rotateX(Math.PI / 2); mesh(reel, mat("#8e98a3", { roughness: 0.35, metalness: 0.4 }), rodG, 0.115, -0.014, 0);
  // the X stand: two 0.018 wood legs 0.16 high, 0.14 spread, crossing at the top, in the plane across the rod
  const wood = mat("#7a5a3a", { roughness: 0.9 }), tx = 0;   // the stand stands at x 0
  for (const sd of [-1, 1]) {
    const a = new V3(0, 0, sd * 0.07), b = new V3(0, 0.17, -sd * 0.035), d = b.clone().sub(a), l = d.length(), g = new THREE.BoxGeometry(0.018, l, 0.018);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize())); const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); mesh(g, wood, root, tx, 0, 0);
  }
  // the line: tip -> the water 0.10 inside the hole's near rim, a hair (0.0015) thick, swaying 0.006 at 0.4 Hz
  const tipW = start.clone().add(dir.clone().multiplyScalar(L)), rot = (S.rot ?? 0) * D2R;
  const toLocal = (wx, wz) => { const dx = wx - (S.x ?? 0), dz = wz - (S.z ?? 0); return [dx * Math.cos(rot) - dz * Math.sin(rot), dx * Math.sin(rot) + dz * Math.cos(rot)]; };
  const [lx, lz] = toLocal(hole[0], hole[1]), dl = Math.hypot(lx, lz) || 1, end0 = new V3(lx / dl * Math.max(0.1, dl - hole[2] + 0.10), -0.02, lz / dl * Math.max(0.1, dl - hole[2] + 0.10));
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 1, 4), basic("#dfe6f2", { transparent: true, opacity: 0.8 })); fx(line, 4); root.add(line);
  solidNoOval(root); line.userData.solid = false;
  return { grip: 0, apply(ps, t) {
    const sw = 0.006 * Math.sin(TAU * 0.4 * (t ?? 0)), a = tipW, b = end0.clone().add(new V3(sw * 0.5, 0, sw)), d = b.clone().sub(a), l = d.length();
    line.position.copy(a).add(b).multiplyScalar(0.5); line.scale.set(1, l, 1); line.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
  } };
}

// ================================================================================================================ icebucket
function icebucket(P) {
  const root = P.whole, H = 0.19, rTop = 0.11, rFoot = 0.085, steel = mat("#9fb0c4", { roughness: 0.4, metalness: 0.5 });
  const seed = P.spec.seed ?? 12, dents = [[0.9, 0.12, 0.75], [3.6, 0.07, 0.7], [5.2, 0.14, 0.6]];   // angle, height, depth (mm-ish)
  const prof = []; for (let i = 0; i <= 12; i++) { const y = (i / 12) * H; prof.push(new THREE.Vector2(lerp(rFoot, rTop, i / 12), y)); }
  const lg = new THREE.LatheGeometry(prof, 40), pp = lg.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); let k = 1;
    for (const [da, dy, dd] of dents) { const d = Math.abs(((a - da + Math.PI * 3) % TAU) - Math.PI); k -= 0.045 * dd * Math.exp(-(((Math.PI - d) / 0.28) ** 2) - (((y - dy) / 0.03) ** 2)); }
    pp.setXYZ(i, (x / r) * r * k, y, (z / r) * r * k);
  }
  lg.computeVertexNormals(); mesh(lg, steel, root);
  const inner = new THREE.LatheGeometry(prof.map((v) => new THREE.Vector2(v.x - 0.004, v.y + (v.y === 0 ? 0.004 : 0))), 40); mesh(inner, mat("#3b4048", { roughness: 0.8, side: THREE.BackSide }), root);
  const bot = new THREE.CircleGeometry(rFoot - 0.004, 28); bot.rotateX(-Math.PI / 2); mesh(bot, mat("#3b4048", { roughness: 0.8 }), root, 0, 0.006, 0);
  const rim = new THREE.TorusGeometry(rTop, 0.0045, 6, 40); rim.rotateX(Math.PI / 2); mesh(rim, mat("#d3dae1", { roughness: 0.35, metalness: 0.5 }), root, 0, H, 0);
  for (const y of [0.07, 0.125]) { const r = lerp(rFoot, rTop, y / H) + 0.001, tor = new THREE.TorusGeometry(r, 0.0035, 5, 40); tor.rotateX(Math.PI / 2); mesh(tor, steel, root, 0, y, 0); }
  // the wire bail lying to one side: a half circle of wire 0.004 thick, tipped over the rim onto the bucket's +z side
  const bail = new THREE.TorusGeometry(rTop, 0.0035, 5, 28, Math.PI); bail.scale(1, 1.45, 1);   // a half ellipse 0.22 wide, 0.16 high, hooked on the rim
  const bm = mesh(bail, mat("#8e98a3", { roughness: 0.4, metalness: 0.6 }), root, 0, H, 0); bm.rotation.x = 1.92;   // lying out over the +z side
  // frost ring at the foot (flat on the ice)
  const fr = new THREE.RingGeometry(rFoot + 0.002, rFoot + 0.03, 30); fr.rotateX(-Math.PI / 2); const fm = mesh(fr, basic("#e8f1fb", { transparent: true, opacity: 0.7, depthWrite: false }), root, 0, 0.003, 0); fx(fm, 4);
  void seed;
  return { grip: 0, apply() {} };
}

// ================================================================================================================ icesplash
function icesplash(P) {
  const S = P.spec, DUR = S.dur ?? 1.2, seed = S.seed ?? 12, root = P.whole, slabPoly = slabOutline(S.slab ?? SLAB_DEFAULT, [0, 0], 12).poly;
  const col = { body: C("#223a66"), rim: C("#9fc0ea"), tip: C("#f2f7ff") };
  // crown: 14 uneven fingers, a ragged ring sheet
  const NA = 84, NV = 6, cpos = new Float32Array((NA + 1) * (NV + 1) * 3), ccol = new Float32Array((NA + 1) * (NV + 1) * 3), cidx = [];
  const fing = (a) => { let h = 0.35; for (let k = 0; k < 14; k++) { const pa = ((k + 0.5 * hz(seed, k)) / 14) * TAU, pk = 0.55 + 0.45 * hz(seed, 20 + k); let d = Math.abs(((a - pa + Math.PI * 3) % TAU) - Math.PI); d = Math.PI - d; h = Math.max(h, pk * Math.max(0, 1 - d / (0.16 + 0.07 * hz(seed, 40 + k)))); } return h; };
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
    const k = (j * (NA + 1) + i) * 3, f = fing((i % NA) / NA * TAU), v = j / NV, c = v > 0.86 && f > 0.78 ? col.tip : v > 0.62 ? col.rim : col.body;
    ccol[k] = c.r; ccol[k + 1] = c.g; ccol[k + 2] = c.b;
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; cidx.push(a, c, b, b, c, d); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.BufferAttribute(cpos, 3)); cg.setAttribute("color", new THREE.BufferAttribute(ccol, 3)); cg.setIndex(cidx);
  const crown = new THREE.Mesh(cg, basic("#ffffff", { vertexColors: true, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); root.add(fx(crown, 6));
  // jet and its 4 blobs
  const jetG = new THREE.CylinderGeometry(0.03, 0.07, 1, 10, 1, false); jetG.translate(0, 0.5, 0);
  const jet = new THREE.Mesh(jetG, basic("#223a66", { transparent: true, opacity: 0.92 })); root.add(fx(jet, 6));
  const jetRim = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.071, 1, 10, 1, true).translate(0, 0.5, 0), basic("#9fc0ea", { transparent: true, opacity: 0.0 })); root.add(fx(jetRim, 6)); jetRim.visible = false;
  const blobs = Array.from({ length: 4 }, (_, i) => { const r = 0.03 + 0.03 * hz(seed, 60 + i), o = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), basic(i % 2 ? "#2f4c80" : "#223a66")); root.add(fx(o, 6)); return { o, a: hz(seed, 70 + i) * TAU, v: 0.25 + 0.35 * hz(seed, 80 + i) }; });
  // 110 drops thrown at puff 0.02-0.2
  const ND = 110, dg = new THREE.SphereGeometry(1, 6, 4), dm = basic("#ffffff"), drops = new THREE.InstancedMesh(dg, dm, ND), dots = new THREE.InstancedMesh(dg, basic("#ffffff"), ND);
  fx(drops, 7); fx(dots, 8); root.add(drops); root.add(dots);
  const D = Array.from({ length: ND }, (_, i) => {
    const r = 0.008 + 0.027 * Math.pow(hz(seed, 100 + i), 3), a = hz(seed, 110 + i) * TAU, el = (35 + 45 * hz(seed, 120 + i)) * D2R, sp = 1.5 + 2.7 * hz(seed, 130 + i), t0 = (0.02 + 0.18 * hz(seed, 140 + i)) * DUR;
    return { r, a, vx: Math.cos(a) * Math.cos(el) * sp, vz: Math.sin(a) * Math.cos(el) * sp, vy: Math.sin(el) * sp, t0, small: r < 0.012 };
  });
  drops.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ND * 3), 3); dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ND * 3), 3);
  D.forEach((d, i) => { const c = d.small ? C("#dfeaf7") : C("#2f4c80"); drops.setColorAt(i, c); dots.setColorAt(i, C("#ffffff")); });
  // mist: a white haze r 0.5 at 0.25 for puff 0.05-0.4
  const mist = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), basic("#ffffff", { transparent: true, opacity: 0, depthWrite: false })); mist.scale.set(1, 0.7, 1); root.add(fx(mist, 5));
  // wash on the ice: a wet sheet r 0.5 -> 1.3 (ice x 0.72), edge line #dfeaf7, none over the open slab outline; 30 wet dots; 3 rings on the water
  const polyArr = Array.from({ length: 40 }, (_, i) => (slabPoly[i] ? new THREE.Vector2(...slabPoly[i]) : new THREE.Vector2()));
  const washM = shaderMat({ vertexShader: `varying vec3 vW; varying vec2 vUv; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec2 uPoly[40]; uniform float uN, uA; varying vec3 vW; varying vec2 vUv;
bool inP(vec2 p) { bool c = false; for (int i = 0; i < 40; i++) { if (float(i) >= uN) break; vec2 a = uPoly[i], b = uPoly[int(mod(float(i) + 1.0, uN))]; if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
void main() { float r = length(vUv - 0.5) * 2.0; if (r > 1.0 || inP(vW.xz)) discard;
  float ed = 1.0 - smoothstep(0.93, 0.985, r); float ln = smoothstep(0.88, 0.93, r) * (1.0 - smoothstep(0.95, 0.99, r));
  vec3 c = mix(vec3(0.02, 0.04, 0.10), ${g3("#dfeaf7")}, ln); float a = mix(0.28, 0.9, ln) * ed * uA;
  gl_FragColor = vec4(c, a);\n#include <colorspace_fragment>\n}`,
    uniforms: { uPoly: { value: polyArr }, uN: { value: slabPoly.length }, uA: { value: 1 } }, transparent: true, depthWrite: false });
  const wg = new THREE.PlaneGeometry(2, 2); wg.rotateX(-Math.PI / 2); const wash = new THREE.Mesh(wg, washM); wash.renderOrder = 9; root.add(fx(wash, 9));
  const wdots = Array.from({ length: 30 }, (_, i) => { const a = hz(seed, 400 + i) * TAU, r = 0.5 + 0.9 * Math.sqrt(hz(seed, 410 + i)), g = new THREE.CircleGeometry(0.01 + 0.02 * hz(seed, 420 + i), 7); g.rotateX(-Math.PI / 2); const o = new THREE.Mesh(g, basic("#1d2f5a", { transparent: true, opacity: 0.55, depthWrite: false })); o.position.set(Math.cos(a) * r, 0.005, Math.sin(a) * r); fx(o, 9); root.add(o); return { o, t: (0.2 + 0.6 * hz(seed, 430 + i)) }; });
  const rings = Array.from({ length: 3 }, (_, i) => { const g = new THREE.RingGeometry(0.97, 1.0, 40); g.rotateX(-Math.PI / 2); const m = basic("#dfeaf7", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), o = new THREE.Mesh(g, m); o.position.y = 0.004; fx(o, 8); root.add(o); return { o, m, d: 0.08 + 0.12 * i }; });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), ONE = new V3(1, 1, 1);
  return { grip: 0, apply(ps) {
    const p = clamp(ps.puff ?? 0), tau = p * DUR, vis = p > 0.001 && p < 0.999;
    // crown: base r 0.30 -> 0.70 over puff 0-0.35, 0.55 high at 0.22, down by 0.5
    const rb = lerp(0.30, 0.70, smooth(0, 0.35, p)), hC = p < 0.22 ? 0.55 * Math.sin((p / 0.22) * Math.PI / 2) : 0.55 * (1 - smooth(0.22, 0.5, p)) ;
    crown.visible = vis && hC > 0.004;
    if (crown.visible) {
      const a = cg.attributes.position.array;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
        const k = (j * (NA + 1) + i) * 3, th = (i % NA) / NA * TAU, f = fing(th), v = j / NV, hh = hC * (0.5 + 0.5 * f) * v, rr = rb + 0.16 * hC * Math.pow(v, 1.4) + (1 - f) * 0.03 * v;
        a[k] = Math.cos(th) * rr; a[k + 1] = hh; a[k + 2] = Math.sin(th) * rr;
      }
      cg.attributes.position.needsUpdate = true;
    }
    // jet: up to 0.9 at puff 0.42, then it pinches into 4 blobs, down by 0.8
    const jh = p < 0.42 ? 0.9 * Math.sin(smooth(0.02, 0.42, p) * Math.PI / 2) : 0.9 * (1 - smooth(0.42, 0.62, p)), jr = lerp(1, 0.55, smooth(0.3, 0.55, p));
    jet.visible = vis && jh > 0.01; jet.scale.set(jr, Math.max(jh, 0.001), jr);
    blobs.forEach((b, i) => {
      const tb = (p - 0.42) * DUR, y0 = 0.9 * 0.55 + 0.1 * i, y = y0 + b.v * tb * 2 - 4.9 * tb * tb * 1.0;
      b.o.visible = vis && p > 0.42 && p < 0.8 && y > 0; b.o.position.set(Math.cos(b.a) * 0.03 * i, Math.max(0, y), Math.sin(b.a) * 0.03 * i);
    });
    // drops
    for (let i = 0; i < ND; i++) {
      const d = D[i], t = tau - d.t0, y = d.vy * t - 4.9 * t * t, on = vis && t > 0 && y > -0.001 && p < 0.95;
      if (!on) { M4.compose(new V3(0, -5, 0), Q, new V3(0, 0, 0)); drops.setMatrixAt(i, M4); dots.setMatrixAt(i, M4); continue; }
      const x = d.vx * t, z = d.vz * t; M4.compose(new V3(x, y, z), Q, new V3(d.r, d.r, d.r)); drops.setMatrixAt(i, M4);
      if (!d.small) { const o = d.r * 0.5; M4.compose(new V3(x - 0.35 * d.r, y + 0.4 * d.r, z + 0.6 * d.r), Q, new V3(d.r * 0.28, d.r * 0.28, d.r * 0.28)); dots.setMatrixAt(i, M4); void o; } else dots.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
    }
    drops.instanceMatrix.needsUpdate = true; dots.instanceMatrix.needsUpdate = true; drops.visible = dots.visible = vis;
    // mist, wash, wet dots, rings
    mist.visible = vis && p > 0.05 && p < 0.4; mist.material.opacity = 0.25 * Math.sin(Math.PI * clamp((p - 0.05) / 0.35)); mist.position.y = 0.3;
    const wr = lerp(0.5, 1.3, smooth(0.08, 0.8, p)), wa = p < 0.001 ? 0 : lerp(0.0, 1.0, smooth(0.02, 0.25, p)) * (1 - 0.4 * smooth(0.5, 1.0, p));
    wash.visible = wa > 0.01; wash.scale.set(wr, 1, wr); wash.material.uniforms.uA.value = wa;
    const sc = Math.max(ps.scale ?? 1, 1e-3), iceY = (0.005 - (ps.y ?? 0)) / sc, waterY = (-0.0185 - (ps.y ?? 0)) / sc;   // the wash lies on the ice (world y 0), the rings on the water (world y -0.02)
    wash.position.y = iceY;
    wdots.forEach((w) => { w.o.visible = p > w.t; const s = clamp((p - w.t) / 0.15); w.o.scale.set(s, 1, s); w.o.position.y = iceY + 0.001; });
    rings.forEach((r) => { const k = clamp((p - r.d) / 0.7), s = 0.1 + 0.9 * k; r.o.visible = p > r.d && p < 1; r.o.scale.set(s, 1, s); r.m.opacity = 0.7 * (1 - k); r.o.position.y = waterY; });
  } };
}

// ================================================================================================================ icejetty
const PILE_AT = [[-1.90, -2.10], [1.95, -2.10], [-2.30, -2.10], [-2.30, -3.40]];
const RAIL_X0 = -2.25;
export const ICEJETTY_POSTS = (() => {
  const out = PILE_AT.map(([x, z]) => [x, 0.20, z, 0.06, 0.55]);   // mooring piles: foot at the deck, to y 0.75
  for (let x = RAIL_X0; x < 7.7; x += 1.15) out.push([x, 0.20, -3.37, 0.04, 0.50]);   // -z rail posts (0.06 square, to y 0.70)
  for (let x = 1.95 + 1.15; x < 7.7; x += 1.15) out.push([x, 0.20, -2.13, 0.04, 0.50]);   // +z rail posts from x 1.95 to the bank
  return out;
})();
function icejetty(P) {
  const root = P.whole, seed = P.spec.seed ?? 12, X0 = -2.30, X1 = 8.60, ZB = -3.40, ZF = -2.10, TOP = 0.20, PL = 0.11, GAP = 0.012;
  const woods = ["#7b6654", "#6a5746", "#8a7460"], soups = woods.map(() => new Soup()), nails = new Soup();
  const N = Math.floor((X1 - X0) / (PL + GAP)); let prev = -1;
  for (let i = 0; i < N; i++) {
    let c = Math.floor(hz(seed + i, 3) * 3); if (c === prev) c = (c + 1 + Math.floor(hz(seed + i, 4) * 2)) % 3; prev = c;
    const x0 = X0 + i * (PL + GAP), z0 = ZB + (hz(seed + i, 5) - 0.5) * 0.024, z1 = ZF + (hz(seed + i, 6) - 0.5) * 0.024;
    soups[c].slab(x0, x0 + PL, TOP - 0.03, TOP, z0, z1);
    for (const zz of [ZB + 0.18, ZF - 0.18]) { const x = x0 + PL / 2 + (hz(seed + i, 7 + zz) - 0.5) * 0.02, z = zz + (hz(seed + i, 9) - 0.5) * 0.02, r = 0.011; nails.quad([x - r, TOP + 0.0015, z], [x, TOP + 0.0015, z + r], [x + r, TOP + 0.0015, z], [x, TOP + 0.0015, z - r], [0, 1, 0]); }
  }
  woods.forEach((c, k) => mesh(soups[k].geo(), mat(c, { roughness: 0.9 }), root));
  mesh(nails.geo(), basic("#3a2c20"), root).userData.noOutline = true;
  // stringers and the ledge
  const under = new Soup(); for (const z of [ZB + 0.18, ZF - 0.18]) under.slab(X0 + 0.05, X1 - 0.05, TOP - 0.08, TOP - 0.03, z - 0.025, z + 0.025); mesh(under.geo(), mat("#4a3b2e", { roughness: 0.95 }), root);
  const ledge = new Soup(); [0, 1].forEach((k) => { const z0 = ZF + k * 0.14 + 0.004, z1 = ZF + (k + 1) * 0.14 - 0.004; ledge.slab(-1.90, 1.95, 0.07, 0.10, z0, z1); }); mesh(ledge.geo(), mat("#7b6654", { roughness: 0.9 }), root);
  const stubs = new Soup(); [-1.80, -0.92, 0.0, 0.95, 1.86].forEach((x) => stubs.slab(x - 0.025, x + 0.025, 0.0, 0.07, ZF + 0.115, ZF + 0.165)); mesh(stubs.geo(), mat("#5e4c3c", { roughness: 0.95 }), root);
  // piles under the deck every 1.5 m on both edges, each in an ice collar
  const piles = [], collars = [];
  for (let x = X0 + 0.2; x < 7.4; x += 1.5) for (const z of [ZB + 0.04, ZF - 0.04]) {
    const g = new THREE.CylinderGeometry(0.055, 0.06, TOP - 0.03, 7); g.translate(x, (TOP - 0.03) / 2, z); piles.push(g);
    const c = new THREE.TorusGeometry(0.095, 0.022, 5, 14); c.rotateX(Math.PI / 2); c.scale(1, 0.7, 1); c.translate(x, 0.004, z); collars.push(c);
  }
  mesh(mergeFlat(piles), mat("#6a5746", { roughness: 0.95 }), root); mesh(mergeFlat(collars), mat("#dbe8f7", { roughness: 0.5 }), root);
  // mooring piles r 0.06 to y 0.75, 3 turns of rope at y 0.50-0.58, a 0.04 snow cap; the hanging coil on the pile at x 1.95
  const rope = mat("#d8d2c0", { roughness: 0.9 }), pileM = mat("#6a5746", { roughness: 0.95 }), cap = mat("#f4f8ff", { roughness: 0.9 });
  for (const [x, z] of PILE_AT) {
    const lg = new THREE.CylinderGeometry(0.06, 0.065, 0.75 - 0.08, 9); mesh(lg, pileM, root, x, 0.08 + (0.75 - 0.08) / 2, z);
    for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(0.066, 0.011, 5, 14); t.rotateX(Math.PI / 2); mesh(t, rope, root, x, 0.50 + 0.04 * k, z); }
    const sg = new THREE.SphereGeometry(0.07, 9, 5, 0, TAU, 0, Math.PI / 2); sg.scale(1, 0.57, 1); mesh(sg, cap, root, x, 0.75, z);
  }
  for (let k = 0; k < 4; k++) { const t = new THREE.TorusGeometry(0.09, 0.011, 5, 16); mesh(t, rope, root, 1.95, 0.49, -2.10 + 0.075 + 0.013 * k); }
  // the rail: posts 0.06 square to y 0.70 every 1.15 m, one top beam 0.06 x 0.05 (top y 0.66), a 0.035 snow cap on every top face
  const posts = new Soup(), beam = new Soup(), caps = new Soup();
  const rail = (z, x0) => {
    for (let x = x0; x < 7.7; x += 1.15) { posts.slab(x - 0.03, x + 0.03, TOP, 0.70, z - 0.03, z + 0.03); caps.slab(x - 0.04, x + 0.04, 0.70, 0.735, z - 0.04, z + 0.04); }
    beam.slab(x0 - 0.03, 7.73, 0.61, 0.66, z - 0.03, z + 0.03);
    // cap on the beam in drifts (70 % of its length)
    for (let x = x0; x < 7.6; x += 0.9) if (hz(seed + x * 3, 11) < 0.7) caps.slab(x, x + 0.25 + 0.5 * hz(seed + x * 3, 12), 0.66, 0.695, z - 0.034, z + 0.034);
  };
  rail(ZB + 0.03, RAIL_X0); rail(ZF - 0.03 + 0.0, 1.95 + 1.15);
  mesh(posts.geo(), mat("#7b6654", { roughness: 0.9 }), root); mesh(beam.geo(), mat("#6a5746", { roughness: 0.9 }), root); mesh(caps.geo(), cap, root);
  // snow on 55 % of the deck in wind drifts (deepest, 0.05, along the -z edge and round posts), on 30 % of the ledge
  const drifts = []; let x = X0 + 0.2, n = 0;
  while (x < 7.6) {
    const len = 0.7 + 1.5 * hz(seed, 500 + n), gap = 0.5 + 1.2 * hz(seed, 520 + n); n++;
    const z = ZB + 0.10 + 0.10 * hz(seed, 540 + n), w = 0.25 + 0.45 * hz(seed, 560 + n), thick = 0.02 + 0.03 * hz(seed, 580 + n);
    const g = new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI / 2); g.scale(len / 2, thick, w / 2); g.translate(x + len / 2, TOP + 0.002, z); drifts.push(g);
    if (hz(seed, 600 + n) < 0.55) { const g2 = new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, Math.PI / 2); g2.scale(len * 0.35, thick * 0.6, 0.25); g2.translate(x + len * 0.5, TOP + 0.002, ZF - 0.45 - 0.3 * hz(seed, 610 + n)); drifts.push(g2); }
    x += len + gap;
  }
  for (const [px, pz] of [...PILE_AT.slice(0, 2), ...[RAIL_X0, 0.05, 1.20, 3.5, 4.65, 5.8].map((v) => [v, ZB + 0.03])]) { const g = new THREE.SphereGeometry(0.13, 9, 4, 0, TAU, 0, Math.PI / 2); g.scale(1, 0.4, 1); g.translate(px, TOP + 0.002, pz); if (pz < -2.5 || px > 1.95) drifts.push(g); }
  for (let k = 0; k < 4; k++) { const lx = -1.7 + 0.9 * k + 0.4 * hz(seed, 620 + k), l = 0.25 + 0.3 * hz(seed, 630 + k); if (hz(seed, 640 + k) < 0.45) { const g = new THREE.SphereGeometry(1, 9, 4, 0, TAU, 0, Math.PI / 2); g.scale(l, 0.02, 0.06); g.translate(lx, 0.10, ZF + 0.07); drifts.push(g); } }
  mesh(mergeFlat(drifts), cap, root);
  // icicles under the deck's edge where there is no ledge (0.03-0.09 long)
  const ic = []; const icg = (x, z, hh) => { const g = new THREE.ConeGeometry(0.006 + 0.004 * hz(x * 31, z), hh, 5); g.rotateX(Math.PI); g.translate(x, TOP - 0.03 - hh / 2, z); ic.push(g); };
  for (let xx = X0 + 0.1; xx < 7.5; xx += 0.1 + 0.1 * hz(xx * 17, 3)) { icg(xx, ZB + 0.005, 0.03 + 0.06 * hz(xx * 13, 7)); if (xx > 1.98) icg(xx + 0.03, ZF - 0.005, 0.03 + 0.06 * hz(xx * 19, 9)); }
  mesh(mergeFlat(ic), mat("#d7eefb", { roughness: 0.25, emissive: C("#7fb6dc"), emissiveIntensity: 0.25 }), root).castShadow = false;
  solidNoOval(root);
  return { grip: 0 };
}

export const ICELAKE_KINDS = { lakeice, icesplash, icerod, icebucket, icejetty };
