// Ancient aliens EP03 Atlantis, block C1: Bimini UNDER WATER (the road, the reef, the ceiling, the light). Brief: storyboards/series/ancient-aliens/03-atlantis/block-c/briefs/C1.md.
// Look target: plate-28-bimini-road.png (/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/), DESIGNS.md sections 0 and 4. Bench: block-c/bench/make-at-c-bimini.mjs.
// Exports C_BIMINI_KINDS, C_BIMINI_GRIPS = {} (nothing here is held). Registered through props-at-c.js.
// Axes: +y up, +x screen right from the default camera (on +z looking -z), metres, sea level y 0, sand floor y -5.5, Spud 0.88. Origin of both kinds = the centre of block 0 at
// sea level (the clip puts them at the place's x, z: kit at-kit.mjs P.bimini). Every mesh is lookOnly scenery; only the tops of blocks 0-3 are solid (invisible boxes).
// No Math.random, no wall clock: all motion comes from the clip clock t passed to apply(ps, t). Both kinds draw with their own shaders (unlit, light and water drawn in): the
// caustic net, the fog and the water grade are in every surface, from below AND from above (a camera above y 0 sees the bed through the water: path length through the water
// sets the fog), so C2's aerial can look down on the road.
//
//   biminiroad  219 blocks in ONE dead-straight single file along -z: block i centred at z = -i * 3.65 (x wobble +-0.12, yaw +-3 deg, by hash of i), width 3.0-4.0, depth 3.4,
//               the top of EVERY block at y -4.9 (0.6 proud of the sand at -5.5, sunk 0.4 more: bottom -5.9), pillow edges (r 0.24), gaps about 0.25 with sand and weed in them.
//               Blocks 0-3 are STANDABLE (top y -4.9, solid, invisible boxes the size of the block). Near blocks (0..spec.detail) are drawn in full: a pale pitted rock
//               (#aab5ac under the crust), PINK CRUST patches with rose outlines, ringed pits, cracks, yellow-green moss on the sides and edges, barnacle specks, sand dust at the
//               foot, a moving caustic net on everything; the rest (to block 218, 800 m) is the same silhouette with a lighter surface (instanced, one draw), so the line reads
//               to the horizon and from 800 m up. spec.contacts [[x, z, r], ...] (default none): soft contact shadows on the block tops at y -4.9 (x, z local, r metres: Spud's feet). Weed fringes (tall yellow-green fronds, they sway) stand in the gaps and along both sides of the near blocks. A soft contact
//               shadow lies on the sand round every block. spec.n 219, spec.detail 30, spec.sight 36 (m the water takes to fog 63 %), spec.reach 2500 (hidden when the camera is farther).
//   biminibed   everything else under the water, drawn round the origin:
//               the sand floor (#e9e4cf, ripple marks, shells, pebbles, a caustic net) to 2.2 km with darker reef patches (#1f8f9a, clumps 5-30 m, denser away from the road);
//               the reef: brain coral, pink bubble coral, branching (staghorn) coral, yellow tube sponges, purple SEA FANS that sway, sea-grass tufts and pebbles in clumps r 1-3
//               about every 8 m on both sides of the road to 60 m (more near the road's first 30 m), each with a soft contact shadow;
//               8 light SHAFTS (soft physical columns, striped with fine rays, slanted by the sun refracted into the water, spec.shafts);
//               the CEILING: the surface seen from below (only while the camera y < 0): a bright rippled mirror with Snell's window and a sun glare, dim mirror outside it, fogged
//               to the horizon; the water-coloured dome behind everything; scene fog for the cast (FogExp2, #1aa0b0, only while the camera is under y 0 and within spec.reach of
//               the origin) and ONE screen multiply quad that grades the cast and props teal (drawn after them, before the bed's surfaces; where something stands only).
//               spec.sight 36, spec.reach 2500, spec.fog "#1aa0b0", spec.sunAz 20, spec.sunEl 62 (the sun in the AIR; the shafts follow it), spec.shafts 8, spec.sway 1 (x the sway
//               of fans and grass), spec.grade [0.62, 0.90, 0.90] (the multiply colour on the cast; 0.55 mix at the surface, deeper = stronger; spec.gradeK 0.7),
//               spec.reef true (false: the floor only, for a light bench).
//   NOT DONE: the caustic net does NOT fall on the cast (the engine's cast materials take no light cookie; the grade quad is plain colour); the turtle (ALSO).
//   Colours are authored in sRGB hex and used in linear working space by the shaders; the cast sits in the water through the fog and the grade quad, not through the look pass's light.
//
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hz = (a, b = 0) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const col = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = col(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const F = (n) => (Number.isInteger(n) ? `${n}.0` : `${+n.toFixed(6)}`);
const rgb = (hex) => { const c = col(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }

const FLOOR = -5.5, TOP = -4.9, PITCH = 3.65;
const RENDER = { road: 1001, far: 1002, decal: 1003, flora: 1005, floor: 1000, ceil: 1050, shaft: 1100, grade: 900, dome: -1000 };

function mark(o, { solid = false, order, steam = false } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = !!solid; m.userData.surfaceOnly = true; if (steam) m.userData.steam = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
function noLine(m) { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; }

// one scene-level hook list: before(cam, scene) at the start of every scene render, after(cam, scene) at its end
function hookScene(root, hk) {
  let s = root; while (s.parent) s = s.parent;
  if (!s.isScene) return false;
  const reg = (s.userData.biminiHooks ||= { list: new Set(), on: false });
  if (!reg.on) {
    reg.on = true; const pb = s.onBeforeRender, pa = s.onAfterRender;
    s.onBeforeRender = function (R, sc, cam) { if (pb) pb.apply(this, arguments); for (const h of reg.list) h.before(cam, sc); };
    s.onAfterRender = function (R, sc, cam) { if (pa) pa.apply(this, arguments); for (const h of reg.list) h.after(cam, sc); };
  }
  reg.list.add(hk); return true;
}

// ================================================================================================ SHARED GLSL
const GLSL_N = `
uniform float uTime, uSight, uSwayAmp;
uniform vec3 uCam, uSun, uFog;
const float TAU = 6.2831853;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }
float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vn3(p); p = p * 2.07 + vec3(17.0, 9.0, 5.0); a *= 0.5; } return s / 0.875; }
vec3 vor(vec2 q) {   // F1, F2, cell id
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 gg = vec2(float(i), float(j)), o = 0.1 + 0.8 * h22(ip + gg); float d = length(gg + o - fp);
    if (d < f1) { f2 = f1; f1 = d; id = h12(ip + gg + 7.7); } else if (d < f2) f2 = d;
  }
  return vec3(f1, f2, id);
}
`;
const GLSL_F = `
// the caustic net (after the tiling water caustic of Dave Hoskins): thin bright lines that slide and breathe, tiling every 1 / scale metres
float caustOne(vec2 uv, float t) {   // a moving net of thin bright lines: the cell borders of a warped, drifting Voronoi, brighter where three cells meet
  vec2 q = uv + 0.16 * vec2(sin(uv.y * 2.3 + t * 0.9), cos(uv.x * 2.1 - t * 0.8));
  float px = length(fwidth(q));
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0, f3 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = h22(ip + g); o = 0.5 + 0.4 * sin(t * (0.5 + 0.6 * o.yx) + TAU * o);
    float d = length(g + o - fp);
    if (d < f1) { f3 = f2; f2 = f1; f1 = d; } else if (d < f2) { f3 = f2; f2 = d; } else if (d < f3) f3 = d;
  }
  float e = f2 - f1, w = 0.05 + px * 0.8;
  float line = 1.0 - smoothstep(0.0, w, e);
  float node = 1.0 - smoothstep(0.0, 0.18 + px, f3 - f1);
  return line * (0.55 + 0.9 * node) * (1.0 - smoothstep(0.35, 1.2, px * 6.0));
}
float caustics(vec3 wp) {
  vec2 q = wp.xz + vec2(wp.y * 0.3, 0.0);
  float fw = length(fwidth(q));
  float a = caustOne(q * 2.1, uTime * 0.55 + 23.0), b = caustOne(mat2(0.82, -0.57, 0.57, 0.82) * q * 1.35 + 4.2, uTime * 0.45 + 9.0);
  float c = a * 0.85 + b * 0.6;
  return mix(c, 0.1, smoothstep(0.1, 0.5, fw));
}
float subPath(vec3 wp) {   // the metres of water between the camera and the point
  vec3 d = wp - uCam; float L = length(d);
  if (uCam.y <= 0.0) return L;
  if (wp.y >= 0.0) return 0.0;
  return L * (-wp.y) / (uCam.y - wp.y);
}
vec3 waterFog(vec3 c, vec3 wp) {
  float L = subPath(wp); float k = 1.0 - exp(-pow(L / uSight, 1.4));
  return mix(c, uFog, k);
}
vec3 bumpN(vec3 N, vec3 P, float H, float k) {   // normal from a height field by screen derivatives
  vec3 dpx = dFdx(P), dpy = dFdy(P); float dhx = dFdx(H), dhy = dFdy(H);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 g = sign(det) * (dhx * r1 + dhy * r2) * k;
  float gl = length(g); g *= min(1.0, 0.8 * abs(det) / (gl + 1e-9));
  return normalize(abs(det) * N - g);
}
// the light of the water: teal ambient from every side, the sun from above in soft patches, the caustic net on what the sun reaches
vec3 litWater(vec3 alb, vec3 N, vec3 wp, float cK, float sunBoost) {
  float ndl = dot(N, uSun);
  float sunK = smoothstep(-0.3, 0.8, ndl);
  float lpatch = 0.80 + 0.20 * vn(wp.xz * 0.2 + vec2(uTime * 0.03, 0.0));
  vec3 amb = mix(${V3("#205058")}, ${V3("#3f9496")}, 0.5 + 0.5 * N.y);
  vec3 sunC = ${V3("#fff6dc")};
  vec3 c = alb * (amb * 0.85 + sunC * sunK * 0.55 * lpatch * sunBoost);
  float cs = caustics(wp);
  float dep = clamp(-wp.y, 0.0, 14.0);
  float reach = (0.2 + 0.8 * max(ndl, 0.0)) * (1.0 - smoothstep(6.0, 16.0, dep) * 0.6);
  c = c * (1.0 + cs * cK * reach * 1.0) + ${V3("#fff6d8")} * cs * cK * reach * 0.55;
  return c;
}
`;
const GLSL = GLSL_N + GLSL_F;

// the block skins: two crops of plate 28 (rectified, highlights flattened) on the real geometry, mirrored / turned / offset per block by hash
const blockTex = () => once("bm-blocktex", () => {
  const mk = () => { const d = new THREE.DataTexture(new Uint8Array([120, 130, 120, 255]), 1, 1); d.needsUpdate = true; return d; };
  const T = { top: { value: mk() }, side: { value: mk() } };
  const ld = new THREE.TextureLoader();
  const get = (name, key) => ld.loadAsync(`/assets/props/atlantis/c/${name}`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; T[key].value = t; });
  (globalThis.__loads ||= []).push(Promise.all([get("bimini-blocktop.jpg", "top"), get("bimini-blockside.jpg", "side")]).catch((e) => console.warn("bimini block textures:", e)));
  return T;
});
const BTEX = `
uniform sampler2D uTop, uSide;
vec3 blockSkin(vec3 P, vec3 N0, float seed, float top) {
  float hk = h12(vec2(seed * 53.0, 1.7)), hk2 = h12(vec2(seed * 29.0, 4.1)), hk3 = h12(vec2(seed * 71.0, 9.3));
  vec2 tp = P.xz / 2.7; if (hk > 0.5) tp.x = -tp.x; if (hk2 > 0.5) tp = tp.yx; if (hk3 > 0.5) tp.y = -tp.y; tp += vec2(hk * 3.0, hk2 * 5.0);
  vec3 tT = texture2D(uTop, tp).rgb;
  float sc = abs(N0.x) > abs(N0.z) ? P.z : P.x;
  vec2 sp = vec2(sc / 3.8 + hk * 7.0, (P.y + 0.5) / 1.5 + hk2 * 3.0); if (hk3 > 0.5) sp.x = -sp.x;
  vec3 tS = texture2D(uSide, sp).rgb;
  return mix(tS * vec3(0.8, 0.9, 0.85), tT, top);
}
`;

// ================================================================================================ UNIFORMS + HOOK
function makeU(S) {
  const sa = (S.sunAz ?? 20) * DEG, se = (S.sunEl ?? 62) * DEG;
  return {
    uTime: { value: 0 }, uSight: { value: S.sight ?? 36 }, uSwayAmp: { value: 0.16 * (S.sway ?? 1) },
    uCam: { value: new THREE.Vector3(0, -3, 8) }, uSun: { value: new THREE.Vector3(-Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se)) }, uFog: { value: col(S.fog ?? "#168fae") },
  };
}
const _w = new THREE.Vector3();
function installHook(P, U, group, extra) {
  const S = P.spec, reach = S.reach ?? 2500; let fog = null;
  const hk = {
    before(cam, sc) {
      P.root.updateWorldMatrix(true, false); _w.setFromMatrixPosition(P.root.matrixWorld);
      const cx = cam.matrixWorld.elements[12] - _w.x, cy = cam.matrixWorld.elements[13] - _w.y, cz = cam.matrixWorld.elements[14] - _w.z;
      U.uCam.value.set(cx, cy, cz);
      const near = Math.hypot(cx, cz) < reach && !sc.overrideMaterial;
      group.visible = Math.hypot(cx, cz) < reach;
      if (extra) extra.before(cam, sc, near, cy);
      if (extra && extra.fogOn && near && cy < 0 && sc.fog === null) { fog = extra.fogOn; sc.fog = fog; }
    },
    after(cam, sc) { if (fog && sc.fog === fog) sc.fog = null; fog = null; if (extra && extra.after) extra.after(sc); },
  };
  return hookScene(P.root, hk);
}

// ================================================================================================ GEOMETRY BUILDERS (CPU)
class GB {
  constructor() { this.p = []; this.n = []; this.c = []; this.w = []; this.u = []; this.i = []; }
  v(p, n, c, w = 0, u = [0, 0]) { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.w.push(w); this.u.push(u[0], u[1]); return this.w.length - 1; }
  tri(a, b, c) { this.i.push(a, b, c); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute("aCol", new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute("aW", new THREE.Float32BufferAttribute(this.w, 1)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2)); g.setIndex(this.i); return g;
  }
}
const n3 = (x, y, z, s = 0) => {   // value noise 0..1 for the CPU geometry
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, sm = (t) => t * t * (3 - 2 * t);
  const h = (a, b, c) => hz(a + b * 57 + c * 113, s + 3.1), L = (a, b, t) => a + (b - a) * t, ux = sm(fx), uy = sm(fy), uz = sm(fz);
  return L(L(L(h(ix, iy, iz), h(ix + 1, iy, iz), ux), L(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), ux), uy), L(L(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), ux), L(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), ux), uy), uz);
};
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// a lumpy dome / sphere: R(dir) -> radius, C(dir, r) -> colour, thMax = polar angle covered (PI/2 = a dome)
function blob(gb, nu, nv, thMax, R, C, sc = [1, 1, 1], off = [0, 0, 0], wFn = null) {
  const base = gb.w.length, P = (d) => { const r = R(d); return [d[0] * r * sc[0] + off[0], d[1] * r * sc[1] + off[1], d[2] * r * sc[2] + off[2]]; };
  const dirAt = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const th = (j / nv) * thMax, ph = (i / nu) * TAU, d = dirAt(th, ph), p = P(d);
    const t1 = norm3(cross3(d, Math.abs(d[1]) > 0.98 ? [1, 0, 0] : [0, 1, 0])), t2 = cross3(d, t1), e = 0.01;
    const pa = P(norm3([d[0] + t1[0] * e, d[1] + t1[1] * e, d[2] + t1[2] * e])), pb = P(norm3([d[0] + t2[0] * e, d[1] + t2[1] * e, d[2] + t2[2] * e]));
    let nn = norm3(cross3(sub3(pa, p), sub3(pb, p))); if (nn[0] * d[0] + nn[1] * d[1] + nn[2] * d[2] < 0) nn = [-nn[0], -nn[1], -nn[2]];
    gb.v(p, nn, C(d, R(d)), wFn ? wFn(d) : 0, [i / nu, j / nv]);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; gb.tri(a, c, b); gb.tri(b, c, d); }
}
// a tapered tube from a to b (radius ra -> rb), colours ca -> cb, sway weights wa -> wb
function tube(gb, a, b, ra, rb, sides, ca, cb, wa = 0, wb = 0, cap = true) {
  const ax = norm3(sub3(b, a)), t1 = norm3(cross3(ax, Math.abs(ax[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0])), t2 = cross3(ax, t1), base = gb.w.length;
  for (let k = 0; k <= 1; k++) for (let i = 0; i <= sides; i++) {
    const ph = (i / sides) * TAU, d = [t1[0] * Math.cos(ph) + t2[0] * Math.sin(ph), t1[1] * Math.cos(ph) + t2[1] * Math.sin(ph), t1[2] * Math.cos(ph) + t2[2] * Math.sin(ph)], r = k ? rb : ra, p0 = k ? b : a;
    gb.v([p0[0] + d[0] * r, p0[1] + d[1] * r, p0[2] + d[2] * r], d, k ? cb : ca, k ? wb : wa, [i / sides, k]);
  }
  for (let i = 0; i < sides; i++) { const q = base + i, r = q + sides + 1; gb.tri(q, r, q + 1); gb.tri(q + 1, r, r + 1); }
  if (cap && rb > 0) { const c0 = gb.v(b, ax, cb, wb), ring = gb.w.length; for (let i = 0; i <= sides; i++) { const ph = (i / sides) * TAU; gb.v([b[0] + (t1[0] * Math.cos(ph) + t2[0] * Math.sin(ph)) * rb, b[1] + (t1[1] * Math.cos(ph) + t2[1] * Math.sin(ph)) * rb, b[2] + (t1[2] * Math.cos(ph) + t2[2] * Math.sin(ph)) * rb], ax, cb, wb); } for (let i = 0; i < sides; i++) gb.tri(c0, ring + i, ring + i + 1); }
}
// a ribbon blade from the ground: height h, half-width w, bends along dir by bend, tapered to a tip
function blade(gb, x, z, h, w, dirA, bend, segs, c0, c1, twist = 0) {
  const base = gb.w.length, dx = Math.cos(dirA), dz = Math.sin(dirA), px = -dz, pz = dx;
  for (let s = 0; s <= segs; s++) {
    const f = s / segs, ww = w * (1 - f * f * 0.92) * (f > 0.98 ? 0.2 : 1), yb = h * f, off = bend * f * f * h, tw = twist * f;
    const cx = x + dx * off, cz = z + dz * off, cy = yb * (1 - bend * f * 0.25), ex = px * Math.cos(tw) * ww, ez = pz * Math.cos(tw) * ww, ey = Math.sin(tw) * ww * 0.6;
    const nrm = norm3([dx * 0.3 + px * 0.0 + dz * 0, 0.5 - f * 0.2, dz * 0.3 + 0.0]); const nn = norm3([-dz * 0 + dx * 0.55, 0.45, dz * 0.55]);
    const col = mixc(c0, c1, Math.pow(f, 0.8));
    gb.v([cx - ex, cy - ey, cz - ez], nn, col, f, [0, f]); gb.v([cx + ex, cy + ey, cz + ez], nn, col, f, [1, f]); void nrm;
  }
  for (let s = 0; s < segs; s++) { const a = base + s * 2; gb.tri(a, a + 1, a + 2); gb.tri(a + 1, a + 3, a + 2); }
}

// ---- the reef's shapes (each built once) ----
const brainGeo = (nu, nv, key) => once(`bm-brain-${nu}-${key}`, () => {
  const gb = new GB(), s = 7 + key * 13, dark = rgb("#3f4a22"), mid = rgb("#9a9a30"), lite = rgb("#cdc24e"), side = rgb("#7a8a34");
  const grooveF = (d) => { const f = n3(d[0] * 2.6 + s, d[1] * 2.6, d[2] * 2.6, 5 + key) * 0.8 + n3(d[0] * 6.5 + s, d[1] * 6.5, d[2] * 6.5, 6) * 0.2; const t = f * 9.0, fr = Math.abs(t - Math.floor(t) - 0.5) * 2; return fr; };   // 0 on a groove, 1 on a ridge
  const R = (d) => 1 + 0.18 * (n3(d[0] * 1.7 + s, d[1] * 1.7, d[2] * 1.7, 2) - 0.5); void grooveF;
  const C = (d) => { const v = n3(d[0] * 3 + s, d[1] * 3, d[2] * 3, 8); return mixc(mid, lite, v * 0.9 + (d[1] > 0.4 ? 0.15 : 0)).map((x, i) => x + (d[1] < 0.2 ? (side[i] - x) * 0.5 : 0)); void dark; };
  blob(gb, nu, nv, Math.PI * 0.5, R, C, [1, 0.62, 1], [0, -0.04, 0]);
  return gb.geo();
});
const bubbleGeo = () => once("bm-bubble", () => {   // a cushion of pink / red / white bubble polyps
  const gb = new GB(), pal = ["#d8648a", "#c0507a", "#e58aa4", "#f1b4bc", "#a8466e"].map(rgb);
  for (let k = 0; k < 15; k++) {
    const a = hz(k, 1) * TAU, rr = Math.sqrt(hz(k, 2)) * 0.5, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = 0.1 + (0.5 - rr) * 0.5 + hz(k, 3) * 0.08, r = 0.14 + 0.1 * hz(k, 4), cc = pal[Math.floor(hz(k, 5) * pal.length)];
    blob(gb, 12, 8, Math.PI, (d) => r * (1 + 0.1 * (n3(d[0] * 2 + k, d[1] * 2, d[2] * 2, 4) - 0.5)), (d) => mixc(cc, rgb("#f6d9d8"), clamp(d[1] * 0.3 + 0.1 + (hz(Math.floor((d[0] + 2) * 9), Math.floor((d[2] + 2) * 9)) > 0.8 ? 0.35 : 0))), [1, 0.85, 1], [x, y, z]);
  }
  blob(gb, 14, 6, Math.PI * 0.5, () => 0.5, () => rgb("#b6a88c"), [1, 0.16, 1], [0, 0.0, 0]);
  return gb.geo();
});
const stagGeo = (key) => once("bm-stag-" + key, () => {   // branching coral
  const gb = new GB(), c0 = rgb(["#d4683a", "#b684c4"][key]), c1 = rgb(["#f6bc88", "#e6cef0"][key]), c2 = rgb(["#9a4228", "#7a5a94"][key]);
  const grow = (p, dir, len, rad, depth, id) => {
    const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    tube(gb, p, q, rad, rad * 0.62, 6, mixc(c2, c0, depth / 4), mixc(c0, c1, depth / 3), 0, 0, depth >= 3);
    if (depth >= 3) return;
    const kids = depth === 0 ? 4 : 2 + (hz(id, 5) > 0.6 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const a = hz(id * 7 + k, 6) * TAU, sp = 0.45 + 0.45 * hz(id * 5 + k, 7);
      const nd = norm3([dir[0] + Math.cos(a) * sp, dir[1] * 0.9 + 0.35, dir[2] + Math.sin(a) * sp]);
      grow(q, nd, len * (0.7 + 0.14 * hz(id + k, 8)), rad * 0.68, depth + 1, id * 3 + k + 1);
    }
  };
  grow([0, 0, 0], [0, 1, 0], 0.26, 0.052, 0, 3 + key * 17);
  tube(gb, [0, -0.02, 0], [0, 0.06, 0], 0.11, 0.06, 8, c2, c2, 0, 0, false);
  return gb.geo();
});
const tubeSpongeGeo = (key) => once("bm-tubes-" + key, () => {
  const gb = new GB(), n = 6 + key * 2, yl = rgb("#e6c52e"), yd = rgb("#a88a18"), yh = rgb("#f6e47a"), ins = rgb("#4a3a10");
  for (let k = 0; k < n; k++) {
    const a = hz(k, 11 + key) * TAU, rr = 0.1 + 0.2 * Math.sqrt(hz(k, 12 + key)), x = Math.cos(a) * rr * (k ? 1 : 0), z = Math.sin(a) * rr * (k ? 1 : 0), h = 0.28 + 0.3 * hz(k, 13 + key), r0 = 0.06 + 0.04 * hz(k, 14 + key), lean = (hz(k, 15) - 0.5) * 0.5, ld = hz(k, 16) * TAU;
    const top = [x + Math.cos(ld) * lean * h, h, z + Math.sin(ld) * lean * h], r1 = r0 * 1.18;
    tube(gb, [x, -0.03, z], top, r0, r1, 10, yd, mixc(yl, yh, hz(k, 17)), 0, 0, false);
    tube(gb, top, [top[0] - Math.cos(ld) * lean * 0.1, top[1] - h * 0.5, top[2] - Math.sin(ld) * lean * 0.1], r1 * 0.78, r1 * 0.55, 10, ins, mixc(ins, yd, 0.5), 0, 0, false);   // the dark bore (faces inward through DoubleSide)
    const base = gb.w.length; for (let i = 0; i <= 10; i++) { const ph = (i / 10) * TAU; gb.v([top[0] + Math.cos(ph) * r1 * 0.78, top[1] + 0.002, top[2] + Math.sin(ph) * r1 * 0.78], [0, 1, 0], yh); gb.v([top[0] + Math.cos(ph) * r1 * 1.0, top[1] + 0.002, top[2] + Math.sin(ph) * r1 * 1.0], [0, 1, 0], yh); }
    for (let i = 0; i < 10; i++) { const q = base + i * 2; gb.tri(q, q + 1, q + 2); gb.tri(q + 1, q + 3, q + 2); }
  }
  return gb.geo();
});
const tuftGeo = (key) => once("bm-tuft-" + key, () => {   // sea grass / weed fringe: tall ribbon blades
  const gb = new GB(), n = 9 + key * 3, g0 = rgb(key ? "#4e6e26" : "#56762a"), g1 = rgb(key ? "#c4c040" : "#b8c244");
  for (let k = 0; k < n; k++) {
    const a = hz(k, 21 + key) * TAU, rr = 0.12 * Math.sqrt(hz(k, 22)), h = 0.4 + 0.6 * hz(k, 23 + key) ** 1.2, w = 0.035 + 0.04 * hz(k, 24);
    blade(gb, Math.cos(a) * rr, Math.sin(a) * rr, h, w, hz(k, 25) * TAU, 0.12 + 0.3 * hz(k, 26), 7, mixc(g0, rgb("#2a4a22"), hz(k, 27) * 0.5), mixc(g1, rgb("#8ea83a"), hz(k, 28) * 0.5), (hz(k, 29) - 0.5) * 1.2);
  }
  return gb.geo();
});
const pebbleGeo = () => once("bm-pebble", () => {
  const gb = new GB();
  blob(gb, 10, 7, Math.PI * 0.62, (d) => 1 + 0.25 * (n3(d[0] * 2.2, d[1] * 2.2, d[2] * 2.2, 9) - 0.5), (d) => mixc(rgb("#b7bfae"), rgb("#e0e0cf"), n3(d[0] * 3, d[1] * 3, d[2] * 3, 10)), [1, 0.62, 0.85]);
  return gb.geo();
});
const fanPlaneGeo = () => once("bm-fan", () => {
  const gb = new GB(), nx = 6, ny = 8;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const f = j / ny; gb.v([(i / nx - 0.5), f * 0.92, 0], [0, 0, 1], [1, 1, 1], f * f, [i / nx, f]); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; gb.tri(a, a + 1, a + nx + 1); gb.tri(a + 1, a + nx + 2, a + nx + 1); }
  tube(gb, [0, -0.04, 0], [0, 0.1, 0], 0.035, 0.022, 6, rgb("#5a2a4a"), rgb("#7a3a62"), 0, 0.0, false);
  return gb.geo();
});
// the purple sea fan: stems that fork, cross-links between the twigs, each stroke inked
const fanTex = (variant) => once("bm-fantex-" + variant, () => {
  const [c, g] = canvas(512, 512), strokes = [], tips = [], pal = [["#6a2f5e", "#b45a8c"], ["#7a3a6a", "#c9709e"]][variant];
  const br = (x, y, a, len, w, d, id) => {
    const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; strokes.push([x, y, x2, y2, w, d]);
    if (d >= 5) { tips.push([x2, y2, a]); return; }
    const kids = d < 1 ? 4 : 2 + (hz(id, 31) > 0.72 ? 1 : 0);
    for (let k = 0; k < kids; k++) { const da = (k / (kids - 1) - 0.5) * (1.25 - d * 0.14) + (hz(id * 3 + k, 32) - 0.5) * 0.28; br(x2, y2, a * 0.75 + da, len * (0.72 + 0.1 * hz(id + k, 33)), Math.max(3.2, w * 0.7), d + 1, id * 4 + k + 1); }
  };
  br(256, 508, 0, 118, 17, 0, 1 + variant * 5);
  const tt = tips.slice().sort((a, b) => a[2] - b[2] || a[0] - b[0]);
  const links = [];
  for (let k = 0; k + 1 < tt.length; k++) { const A = tt[k], B = tt[k + 1]; if (Math.hypot(A[0] - B[0], A[1] - B[1]) < 46) links.push([A[0], A[1], B[0], B[1], 3.2, 6]); }
  for (let k = 0; k < strokes.length; k++) { const s = strokes[k]; if (s[5] >= 3 && s[5] < 5 && hz(k, 34) > 0.45) { const f = 0.55; for (let m = k + 1; m < Math.min(strokes.length, k + 6); m++) { const o = strokes[m]; if (o[5] === s[5] && Math.hypot(o[0] - s[0], o[1] - s[1]) < 60 && Math.hypot(o[0] - s[0], o[1] - s[1]) > 4) { links.push([s[0] + (s[2] - s[0]) * f, s[1] + (s[3] - s[1]) * f, o[0] + (o[2] - o[0]) * f, o[1] + (o[3] - o[1]) * f, 3.0, 5]); break; } } } }
  g.lineCap = "round";
  for (const pass of [0, 1]) {
    for (const [x1, y1, x2, y2, w, d] of [...links, ...strokes]) {
      g.strokeStyle = pass ? `#${(d < 2 ? pal[0] : pal[1]).slice(1)}` : "#2c1428"; g.globalAlpha = pass ? 0.96 : 0.9;
      if (pass) { const k = Math.min(1, d / 5); g.strokeStyle = "#" + [0, 1, 2].map((q) => Math.round(parseInt(pal[0].slice(1 + q * 2, 3 + q * 2), 16) * (1 - k) + parseInt(pal[1].slice(1 + q * 2, 3 + q * 2), 16) * k).toString(16).padStart(2, "0")).join(""); }
      g.lineWidth = pass ? w : w + 3.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; return t;
});

// ================================================================================================ SHADERS
const fogOut = `  c = waterFog(c, vWp);\n  gl_FragColor = vec4(c, 1.0);\n  #include <colorspace_fragment>`;

// ---- the blocks ----
const BLOCK_VS = `${GLSL_N}
attribute vec2 aSz; attribute float aSeed;
varying vec3 vLp, vLn, vWp, vWn; varying float vSeed; varying vec2 vSz;
float lump(vec3 p, float s) { return (vn3(p * 0.85 + s) - 0.5) * 0.11 + (vn3(p * 2.3 + s * 1.7) - 0.5) * 0.04; }
void main() {
  vec3 u = position, h = vec3(aSz.x * 0.5, 0.5, aSz.y * 0.5);
  const float R = 0.24;
  vec3 a = 1.0 - R / h, inner = clamp(u, -a, a), dir = (u - inner) * h;
  float L = length(dir); vec3 n = L > 1e-4 ? dir / L : vec3(0.0, 1.0, 0.0);
  vec3 lp = inner * h + n * R;
  float top = smoothstep(0.2, 0.9, n.y);
  lp.y += top * 0.045 * (1.0 - 0.5 * (u.x * u.x + u.z * u.z));
  float s = aSeed * 13.7;
  #ifdef NEAR
  float b0 = lump(lp, s), e = 0.07;
  vec3 g = vec3(lump(lp + vec3(e, 0.0, 0.0), s) - lump(lp - vec3(e, 0.0, 0.0), s), lump(lp + vec3(0.0, e, 0.0), s) - lump(lp - vec3(0.0, e, 0.0), s), lump(lp + vec3(0.0, 0.0, e), s) - lump(lp - vec3(0.0, 0.0, e), s)) / (2.0 * e);
  lp += n * b0 * smoothstep(-0.35, 0.1, lp.y);
  n = normalize(n - (g - dot(g, n) * n) * 1.4);
  #endif
  vLp = lp; vLn = n; vSeed = aSeed; vSz = aSz;
  vec4 w4 = instanceMatrix * vec4(lp, 1.0); vWp = w4.xyz; vWn = normalize(mat3(instanceMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * w4;
}`;
const BLOCK_FS = `${GLSL}
${BTEX}
varying vec3 vLp, vLn, vWp, vWn; varying float vSeed; varying vec2 vSz;
float pitRing(vec2 g, vec2 seed, out float rim, out float core) {   // ringed pits on a 1-cell grid
  vec2 ip = floor(g); float depth = 0.0; rim = 0.0; core = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = ip + vec2(float(i), float(j));
    if (h12(c * 1.37 + seed) < 0.44) continue;
    vec2 ctr = c + 0.22 + 0.56 * h22(c + seed); float r = (0.12 + 0.2 * h12(c + seed + 7.7)) * 0.55, d = length(g - ctr) / max(r * 1.8, 1e-3);
    depth = max(depth, 1.0 - smoothstep(0.5, 0.82, d));
    rim = max(rim, smoothstep(0.78, 0.9, d) * (1.0 - smoothstep(0.95, 1.3, d)));
    core = max(core, 1.0 - smoothstep(0.0, 0.46, d));
  }
  return depth;
}
void main() {
  vec3 N0 = normalize(vLn), P = vLp;
  float dist = length(vWp - uCam), fd = 1.0 - smoothstep(9.0, 34.0, dist);
  float sd = vSeed * 91.7, top = smoothstep(0.55, 0.9, N0.y);
  vec3 q3 = P + vec3(sd, sd * 0.7, sd * 1.3);
  vec2 p2 = top > 0.5 ? P.xz : (abs(N0.x) > abs(N0.z) ? P.zy : P.xy); p2 += vec2(sd * 0.37, sd * 0.21);
  float edgeD = min(vSz.x * 0.5 - abs(P.x), vSz.y * 0.5 - abs(P.z));
  // the rock: pale, mottled
  float m1 = fbm3(q3 * 1.15);
  vec3 alb = mix(${V3("#8f988c")}, ${V3("#b6bfb0")}, smoothstep(0.3, 0.68, m1));
  alb = mix(alb, ${V3("#6a7c76")}, smoothstep(0.62, 0.8, fbm3(q3 * 2.6 + 4.0)) * 0.55);
  float grain = vn(p2 * 47.0); alb *= 1.0 + (grain - 0.5) * 0.2 * fd;
  float H = (vn(p2 * 6.0) - 0.5) * 0.02;
  // pink crust: ragged patches with a rose outline and a cellular skin
  vec3 w3 = q3 * 0.9 + 0.7 * vec3(vn3(q3 * 1.9), vn3(q3 * 1.9 + 11.0), vn3(q3 * 1.9 + 23.0));
  float cr = fbm3(w3 * 1.3 + 5.0) + (vn3(q3 * 9.0) - 0.5) * 0.17 * fd + (vn3(q3 * 3.7) - 0.5) * 0.12;
  float thr = 0.515 + 0.1 * (h12(vec2(vSeed * 17.0, 3.3)) - 0.45) + 0.05 * (1.0 - top);
  float crust = smoothstep(thr, thr + 0.03, cr) * (0.3 + 0.7 * top) * (1.0 - smoothstep(0.0, 0.05, abs(edgeD) - 0.0) * 0.0);
  float crEdge = (1.0 - smoothstep(0.0, 0.022, abs(cr - thr - 0.012))) * (0.3 + 0.7 * top);
  vec3 vc = vor(p2 * 17.0 + sd); float cell = 1.0 - smoothstep(0.0, 0.12, vc.y - vc.x);
  vec3 pink = mix(${V3("#cc6f8e")}, ${V3("#ebaab6")}, vn3(q3 * 6.0));
  pink = mix(pink, ${V3("#a05470")}, cell * 0.55 * fd);
  alb = mix(alb, pink, crust * 0.94);
  alb = mix(alb, ${V3("#8a4a66")}, crEdge * 0.7 * fd);
  H += crust * 0.004;
  // ringed pits (dark bore, pale core, pale rim)
  float rim, core;
  float pd = pitRing(p2 / 0.5, vec2(vSeed * 23.0, 4.1), rim, core) * (0.35 + 0.65 * smoothstep(0.1, 0.5, top + crust));
  float rimE = rim * (0.35 + 0.65 * smoothstep(0.1, 0.5, top + crust));
  alb = mix(alb, ${V3("#1d2c30")}, pd * 0.92);
  alb = mix(alb, ${V3("#c9c4a6")}, core * pd * 0.55);
  alb = mix(alb, mix(${V3("#e9bcc0")}, ${V3("#d8d2b8")}, 1.0 - crust), rimE * 0.8);
  H += -pd * 0.03 + rimE * 0.006;
  // tiny pin pits
  float pr, pc; float sp = pitRing(p2 / 0.13 + 3.1, vec2(vSeed * 5.0, 8.8), pr, pc) * fd;
  alb *= 1.0 - sp * 0.4;
  // cracks: ragged cell borders, some of them
  vec2 pcw = p2 * 0.52 + 0.18 * vec2(vn(p2 * 3.1), vn(p2 * 3.1 + 7.0)) + sd;
  vec3 cw = vor(pcw); float cd = cw.y - cw.x, wdt = 0.012 + 0.03 * h12(vec2(cw.z, 2.2));
  float crack = (1.0 - smoothstep(0.0, wdt + 0.01, cd)) * step(0.42, cw.z) * (0.6 + 0.4 * vn(p2 * 9.0)) * mix(0.3, 1.0, top);
  alb = mix(alb, ${V3("#2a3834")}, crack * 0.85);
  // moss and algae: yellow-green on the sides and the edges, stippled
  float edgeK = (1.0 - top) * 0.8 + (1.0 - smoothstep(0.0, 0.5, edgeD)) * 0.55;
  float mo = fbm3(q3 * 2.3 + 31.0);
  float moss = smoothstep(0.32, 0.64, mo * 0.8 + edgeK * 0.5 - 0.04);
  float stip = smoothstep(0.38, 0.55, vn3(q3 * 16.0) * 0.7 + mo * 0.5);
  vec3 mcol = mix(${V3("#5f7a34")}, ${V3("#b2b040")}, smoothstep(0.25, 0.75, vn3(q3 * 5.0 + 2.0)));
  mcol = mix(mcol, ${V3("#d2c24a")}, smoothstep(0.7, 0.9, vn3(q3 * 9.0)) * 0.6);
  alb = mix(alb, mcol, moss * (0.4 + 0.5 * stip) * (1.0 - crust * 0.7));
  // barnacle specks and sand dust at the foot
  vec3 bv = vor(p2 * 24.0 + sd); float bn = (1.0 - smoothstep(0.1, 0.17, bv.x)) * step(0.78, bv.z) * (1.0 - top * 0.6) * fd; alb = mix(alb, ${V3("#e8e4d4")}, bn * 0.7);
  float foot = 1.0 - smoothstep(-0.12, 0.12, P.y + 0.02);
  alb = mix(alb, mix(${V3("#cfc9ae")}, alb, 0.35), foot * (0.4 + 0.5 * vn(p2 * 6.0)));
  vec3 skin = blockSkin(P, N0, vSeed, top);
  alb = mix(skin * 1.1, mcol, moss * 0.22 * (1.0 - top * 0.6)) * (0.9 + 0.2 * m1);
  alb = mix(alb, ${V3("#cfc9ae")}, foot * 0.45);
  alb = mix(alb, pink * 0.8, crust * 0.3);
  H = (dot(skin, vec3(0.33)) - 0.25) * 0.025 + (pd * -0.012);
  vec3 N = bumpN(N0, vWp, H, 1.0 * (0.3 + 0.7 * fd));
  vec3 c = litWater(alb, N, vWp, 0.6, 1.3);
  c = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 1.3);
  vec3 V = normalize(uCam - vWp);
  float rimL = 1.0 - clamp(dot(N0, V), 0.0, 1.0);
  c *= 1.0 - smoothstep(0.78, 0.96, rimL) * 0.45;                       // the inked contour, soft
${fogOut}
}`;
const FARBLOCK_FS = `${GLSL}
${BTEX}
varying vec3 vLp, vLn, vWp, vWn; varying float vSeed; varying vec2 vSz;
void main() {
  vec3 N = normalize(vLn), P = vLp; float sd = vSeed * 91.7; float top = smoothstep(0.5, 0.9, N.y);
  vec3 q3 = P + vec3(sd, sd * 0.7, sd * 1.3);
  float m1 = vn3(q3 * 1.2) * 0.65 + vn3(q3 * 4.1) * 0.35;
  vec3 alb = mix(${V3("#8d9a94")}, ${V3("#b4c0b6")}, m1);
  float cr = vn3(q3 * 1.1 + 5.0) * 0.7 + vn3(q3 * 3.3) * 0.3, thr = 0.55 + 0.1 * (h12(vec2(vSeed * 17.0, 3.3)) - 0.45);
  alb = mix(alb, mix(${V3("#cf7c92")}, ${V3("#eab2b8")}, vn3(q3 * 5.0)), smoothstep(thr, thr + 0.05, cr) * (0.3 + 0.7 * top) * 0.9);
  float edgeD = min(vSz.x * 0.5 - abs(P.x), vSz.y * 0.5 - abs(P.z));
  float moss = smoothstep(0.3, 0.7, vn3(q3 * 2.0 + 31.0) * 0.7 + ((1.0 - top) * 0.8 + (1.0 - smoothstep(0.0, 0.5, edgeD)) * 0.5) * 0.45);
  alb = mix(alb, mix(${V3("#5f7a34")}, ${V3("#b2b040")}, vn3(q3 * 5.0)), moss * 0.7);
  alb = mix(alb, ${V3("#cfc9ae")}, (1.0 - smoothstep(-0.12, 0.12, P.y + 0.02)) * 0.5);
  alb = blockSkin(P, N, vSeed, top) * 1.0;
  alb = mix(alb, ${V3("#cfc9ae")}, (1.0 - smoothstep(-0.12, 0.12, P.y + 0.02)) * 0.45);
  vec3 c = litWater(alb, N, vWp, 0.7, 1.3);
${fogOut}
}`;

// ---- the floor ----
const FLOOR_VS = `${GLSL_N}
varying vec3 vWp;
void main() { vWp = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const FLOOR_FS = `${GLSL}
varying vec3 vWp;
void main() {
  vec2 p = vWp.xz; float dist = length(vWp - uCam), fd = 1.0 - smoothstep(30.0, 110.0, dist);
  // sand: ripple marks (wavy, warped), a long swell, mottling, grain
  vec2 wq = p + 1.7 * vec2(fbm(p * 0.33), fbm(p * 0.33 + 8.0));
  float A = smoothstep(0.3, 0.62, vn(p * 0.16 + 3.0));
  float ph = dot(wq, vec2(0.30, 0.95)) / 0.62, rid = 0.5 + 0.5 * sin(ph * TAU), r2 = 0.5 + 0.5 * sin(dot(wq, vec2(-0.55, 0.84)) / 1.9 * TAU + 2.0);
  rid = rid * rid * (3.0 - 2.0 * rid);
  float H = (rid - 0.5) * 0.026 * A * fd + (r2 - 0.5) * 0.05 + (vn(p * 9.0) - 0.5) * 0.008 * fd;
  vec3 sand = mix(${V3("#d2efe6")}, ${V3("#f0fbf2")}, vn(p * 2.0 + 5.0));
  sand = mix(sand, ${V3("#cdd2bf")}, (1.0 - rid) * 0.38 * A * fd);
  sand = mix(sand, ${V3("#d8cfae")}, smoothstep(0.5, 0.8, vn(p * 0.6 + 21.0)) * 0.3);
  sand *= 1.0 + (vn(p * 60.0) - 0.5) * 0.12 * fd;
  vec3 alb = sand;
  // shells, urchin tests and pebbles scattered on a 0.85 m grid, near only
  if (fd > 0.01) {
    vec2 g = p / 0.85, ip = floor(g); float shell = 0.0; vec3 sc = vec3(0.0); float sh = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = ip + vec2(float(i), float(j)); float hh = h12(c * 1.9 + 3.3);
      if (hh < 0.58) continue;
      vec2 ctr = c + 0.15 + 0.7 * h22(c + 5.0); float ang = h12(c + 9.0) * 6.2832, rr = (0.035 + 0.07 * h12(c + 1.7)) / 0.85;
      vec2 d = g - ctr; d = vec2(cos(ang) * d.x + sin(ang) * d.y, -sin(ang) * d.x + cos(ang) * d.y); d.x *= 0.62 + 0.5 * h12(c + 2.2);
      float e = length(d) / rr, inside = 1.0 - smoothstep(0.88, 1.0, e);
      float kind = h12(c + 4.4); vec3 cc = kind < 0.4 ? ${V3("#f6f1e2")} : kind < 0.65 ? ${V3("#ecc7b4")} : kind < 0.85 ? ${V3("#c4b49a")} : ${V3("#7d8a7c")};
      float ridge = 0.5 + 0.5 * sin(atan(d.y, d.x) * (7.0 + 6.0 * h12(c + 8.0)));
      cc = mix(cc * 0.84, cc * 1.06, ridge * (1.0 - e * 0.5));
      float shd = (1.0 - smoothstep(0.9, 1.5, length(d - vec2(0.18, -0.14) * rr * 1.6) / rr)) * (1.0 - inside);
      sh = max(sh, shd * 0.5); if (inside > shell) { shell = inside; sc = cc; H = mix(H, 0.02, inside * 0.4); }
    }
    alb = mix(alb * (1.0 - sh * fd * 0.55), sc, shell * fd);
  }
  // dark reef patches, clumps 5-30 m, denser away from the road
  float away = smoothstep(14.0, 150.0, abs(p.x));
  float rp = fbm(p * 0.05 + 11.0) * 0.6 + fbm(p * 0.16 + 4.0) * 0.4 + (vn(p * 0.7) - 0.5) * 0.05;
  float reefK = smoothstep(0.475 - 0.05 * away, 0.525 - 0.05 * away + length(fwidth(p)) * 0.12, rp) * smoothstep(8.0, 22.0, length(p - vec2(0.0, clamp(p.y, -820.0, 8.0))));
  vec3 rf = mix(${V3("#1f8f9a")}, ${V3("#3aa597")}, vn(p * 1.4)); rf = mix(rf, ${V3("#16707c")}, smoothstep(0.55, 0.75, vn(p * 3.3 + 5.0)) * 0.7);
  rf *= (1.0 + (vn(p * 11.0) - 0.5) * 0.18 * fd) * 0.8;
  alb = mix(alb, rf, reefK * 0.9);
  vec3 N = bumpN(vec3(0.0, 1.0, 0.0), vWp, H, 1.2 * fd + 0.1);
  float cK = 1.0 - reefK * 0.35;
  vec3 c = litWater(alb, N, vWp, cK, 1.0);
${fogOut}
}`;

// ---- flora (instanced, vertex-coloured) ----
const FLORA_VS = `${GLSL_N}
attribute vec3 aCol, aTint; attribute float aW, aPh;
varying vec3 vWp, vN, vC, vObj; varying vec2 vUv;
void main() {
  vObj = position;
  vec4 lp = instanceMatrix * vec4(position, 1.0); vec3 n = normalize(mat3(instanceMatrix) * normal);
  float s = aW;
  if (s > 0.0) {
    float ph = uTime * 1.2 + aPh + lp.x * 0.35 + lp.z * 0.3, sw = s * uSwayAmp * (sin(ph) + 0.4 * sin(ph * 2.3 + 1.0));
    vec2 dr = vec2(cos(aPh * 1.7), sin(aPh * 1.7)); lp.xz += dr * sw; lp.y -= abs(sw) * 0.2;
  }
  vWp = lp.xyz; vN = n; vC = aCol * aTint; vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * lp;
}`;
const FLORA_FS = `${GLSL}
#ifdef FAN
uniform sampler2D uMap;
#endif
varying vec3 vWp, vN, vC, vObj; varying vec2 vUv;
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vC;
  #ifdef BRAIN
  { float t = fbm3(vObj * 2.3 + 3.0) * 30.0 + vObj.y * 2.0, fr = abs(fract(t) - 0.5) * 2.0, gr = 1.0 - smoothstep(0.0, 0.34, fr);
    gr *= 1.0 - smoothstep(14.0, 40.0, length(vWp - uCam)); alb = mix(alb * 1.2, alb * 0.38, gr); }
  #endif
  #ifdef FAN
  vec4 m = texture2D(uMap, vUv); if (m.a < 0.42) discard; alb = m.rgb * vC;
  #endif
  float dist = length(vWp - uCam), fd = 1.0 - smoothstep(10.0, 40.0, dist);
  alb *= 0.9 + 0.2 * vn3(vWp * 11.0);
  alb *= 1.0 - smoothstep(0.64, 0.72, vn3(vWp * 27.0)) * 0.2 * fd;
  alb *= 0.72 + 0.28 * smoothstep(-5.7, -4.9, vWp.y);   // darker near the sand
  vec3 c = litWater(alb * 1.85, N, vWp, 1.0, 1.15);
  c += alb * vec3(0.34, 0.38, 0.36);
${fogOut}
}`;

// ---- soft contact shadows (instanced decals on the sand) ----
const DECAL_VS = `${GLSL_N}
attribute vec4 aD; varying vec2 vP; varying vec4 vD; varying vec3 vWp;
void main() { vec4 w = instanceMatrix * vec4(position, 1.0); vWp = w.xyz; vP = position.xz * (aD.xy + aD.w); vD = aD; gl_Position = projectionMatrix * viewMatrix * modelMatrix * w; }`;
const DECAL_FS = `${GLSL}
varying vec2 vP; varying vec4 vD; varying vec3 vWp;
void main() {
  float m = vD.w, d;
  if (vD.z > 0.5) d = (length(vP / vD.xy) - 1.0) * min(vD.x, vD.y); else { vec2 q = abs(vP) - vD.xy; d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
  float a = (1.0 - smoothstep(-0.05, m, d)) * 0.34;
  a *= 0.75 + 0.25 * vn(vWp.xz * 4.0);
  vec3 c = ${V3("#2c6a68")}; c = waterFog(c, vWp);
  gl_FragColor = vec4(c, a * (1.0 - clamp(subPath(vWp) / (uSight * 2.0), 0.0, 1.0)));
  #include <colorspace_fragment>
}`;

// ---- the ceiling (the surface seen from below), the dome, the shafts, the grade quad ----
const CEIL_VS = `${GLSL_N}
varying vec3 vWp;
void main() { vWp = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const CEIL_FS = `${GLSL}
varying vec3 vWp;
void main() {
  vec3 dv = vWp - uCam; float L = length(dv); vec3 V = dv / L;
  vec2 q = vWp.xz;
  float fw = length(fwidth(q));
  // ripple field: a bent net of bright lines that slides, and a gradient that tilts the window's edge
  vec2 wq = q + 0.9 * vec2(vn(q * 0.45 + vec2(uTime * 0.3, 0.0)) - 0.5, vn(q * 0.45 + vec2(0.0, uTime * 0.27) + 9.0) - 0.5) * 2.0;
  float net = caustOne(wq * 0.9, uTime * 0.6 + 3.0) * 0.9 + caustOne(mat2(0.8, -0.6, 0.6, 0.8) * wq * 1.5 + 2.0, uTime * 0.5 + 11.0) * 0.6;
  net = mix(net, 0.2, smoothstep(0.05, 0.4, fw));
  float tilt = (vn(q * 0.8 + vec2(uTime * 0.4, 1.0)) - 0.5) * 0.22 + (vn(q * 2.6 - vec2(uTime * 0.5, 3.0)) - 0.5) * 0.1;
  float cosT = clamp(V.y, 0.0, 1.0), sinT = sqrt(1.0 - cosT * cosT) + tilt * 0.4 * (1.0 - cosT * 0.6);
  float win = 1.0 - smoothstep(0.66, 0.78, sinT);
  vec3 sunW = normalize(vec3(uSun.x * 0.75, uSun.y, uSun.z * 0.75));
  float glare = pow(max(dot(V, sunW), 0.0), 70.0) + 0.35 * pow(max(dot(V, sunW), 0.0), 9.0);
  vec3 inW = mix(${V3("#1580a8")}, ${V3("#4fc4d0")}, smoothstep(0.55, 1.0, cosT));
  inW = mix(inW, ${V3("#e8fff8")}, clamp(glare * 1.1 + net * 0.6, 0.0, 1.0));
  vec3 outW = mix(${V3("#0e6a86")}, ${V3("#1a8fa6")}, 0.5 + 0.5 * vn(q * 0.05));
  outW = mix(outW, ${V3("#a8f0ec")}, clamp(net * 0.2, 0.0, 0.3));
  vec3 c = mix(outW, inW, win);
  float k = 1.0 - exp(-pow(L / (uSight * 1.1), 1.4)); c = mix(c, uFog, k);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const DOME_VS = `uniform vec3 uCam; varying vec3 vDir;
void main() { vDir = normalize(position); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(uCam + position, 1.0); gl_Position.z = gl_Position.w * 0.99999; }`;
const DOME_FS = `uniform vec3 uFog; varying vec3 vDir;
void main() { float e = vDir.y; vec3 c = uFog * (1.0 + 0.06 * smoothstep(0.0, 0.5, e) - 0.14 * smoothstep(0.0, -0.4, e)); gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const SHAFT_VS = `${GLSL_N}
attribute float aS; varying vec3 vWp, vWn; varying vec2 vUv; varying float vS;
void main() { vec4 w = instanceMatrix * vec4(position, 1.0); vWp = w.xyz; vWn = normalize(mat3(instanceMatrix) * normal); vUv = uv; vS = aS; gl_Position = projectionMatrix * viewMatrix * modelMatrix * w; }`;
const SHAFT_FS = `${GLSL}
varying vec3 vWp, vWn; varying vec2 vUv; varying float vS;
void main() {
  vec3 V = normalize(uCam - vWp), N = normalize(vWn);
  float face = pow(abs(dot(N, V)), 1.5);
  float u = vUv.x, v = 1.0 - vUv.y;   // v 0 at the surface, 1 at the far end
  float k = 12.0 + 14.0 * fract(vS * 7.31);
  float rays = 0.45 + 0.55 * smoothstep(0.1, 0.9, 0.5 + 0.5 * sin(u * 6.2832 * k + vS * 40.0 + vn(vec2(u * 9.0, v * 0.7 + uTime * 0.05 + vS)) * 5.0));
  rays *= 0.7 + 0.3 * sin(uTime * 0.6 + vS * 30.0 + v * 2.0);
  float depthK = clamp(1.0 + vWp.y / 7.0, 0.0, 1.0);
  float L = length(uCam - vWp);
  float a = face * rays * depthK * smoothstep(0.0, 0.26, v) * (1.0 - smoothstep(0.55, 0.98, v)) * 0.9 * smoothstep(0.4, 3.0, L);
  a *= (1.0 - 0.45 * (1.0 - exp(-pow(L / uSight, 1.4))));
  vec3 c = ${V3("#c4fff0")};
  gl_FragColor = vec4(c * a, a);
  #include <colorspace_fragment>
}`;
const GRADE_VS = `void main() { gl_Position = vec4(position.xy, 0.99999, 1.0); }`;
const GRADE_FS = `uniform vec3 uGrade; uniform float uK, uDepth;
void main() { float s = mix(uK, min(1.0, uK + 0.2), uDepth); gl_FragColor = vec4(mix(vec3(1.0), uGrade, s), 1.0); }`;

function shaderMat(U, vs, fs, o = {}) {
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...(o.uniforms || {}) }, vertexShader: vs, fragmentShader: fs, defines: o.defines || {}, side: o.side ?? THREE.FrontSide, transparent: o.transparent ?? true, depthWrite: o.depthWrite ?? true, blending: o.blending ?? THREE.NormalBlending });
  return noLine(m);
}

// ================================================================================================ THE ROAD
function blockData(i) {
  const w = 3.0 + 1.0 * hz(i, 13), dep = 3.4 + 0.04 * (hz(i, 14) - 0.5);
  return { w, dep, x: (hz(i, 11) - 0.5) * 0.24, yaw: (hz(i, 12) - 0.5) * 6 * DEG, z: -i * PITCH, seed: hz(i, 5) };
}
function blockBase(N, NY) {   // the unit cube surface without its bottom: top + four sides, vertices crowded toward the edges
  const pos = [], idx = [], cl = (s) => Math.sin(s * Math.PI / 2);
  const face = (fn, nu, nv) => { const b = pos.length / 3; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...fn(cl(i / nu * 2 - 1), j / nv * 2 - 1)); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, c = a + nu + 1; idx.push(a, c, a + 1, a + 1, c, a + 1 + nu + 1); } };
  face((s, t) => [s, 1, cl(t)], N, N);                         // top
  const side = (fn) => face((s, t) => fn(s, t < 0 ? -(1 - (1 - (t + 1)) * 0) : t), N, NY);
  const sideY = (j, nv) => (j / nv) * 2 - 1;
  void side; void sideY;
  const faceS = (fn) => { const b = pos.length / 3; for (let j = 0; j <= NY; j++) for (let i = 0; i <= N; i++) { const s = cl(i / N * 2 - 1), y = Math.sin((j / NY * 2 - 1) * Math.PI / 2); pos.push(...fn(s, y)); } for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) { const a = b + j * (N + 1) + i, c = a + N + 1; idx.push(a, c, a + 1, a + 1, c, a + 1 + N + 1); } };
  faceS((s, y) => [1, y, s]); faceS((s, y) => [-1, y, -s]); faceS((s, y) => [-s, y, 1]); faceS((s, y) => [s, y, -1]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  // winding: make every triangle face outward (cheap check on the unit cube)
  const p = pos, ix = g.index.array;
  for (let k = 0; k < ix.length; k += 3) { const a = ix[k] * 3, b = ix[k + 1] * 3, c = ix[k + 2] * 3; const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]], nn = cross3(e1, e2), cen = [p[a] + p[b] + p[c], p[a + 1] + p[b + 1] + p[c + 2 - 1], p[a + 2] + p[b + 2] + p[c + 2]]; if (nn[0] * cen[0] + nn[1] * cen[1] + nn[2] * cen[2] < 0) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } }
  return g;
}
const blockGeo = (kind) => once("bm-blockgeo-" + kind, () => (kind === "near" ? blockBase(30, 14) : blockBase(5, 3)));

function buildBlocks(P, U) {
  const S = P.spec, n = S.n ?? 219, nNear = Math.min(S.detail ?? 30, n - 1) + 1, G = new THREE.Group();
  const dummy = new THREE.Object3D(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const mk = (list, geo, fs, defines, order, name) => {
    const g = geo.clone(), m = list.length, sz = new Float32Array(m * 2), sd = new Float32Array(m);
    list.forEach((b, k) => { sz[k * 2] = b.w; sz[k * 2 + 1] = b.dep; sd[k] = b.seed; });
    g.setAttribute("aSz", new THREE.InstancedBufferAttribute(sz, 2)); g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(sd, 1));
    const mesh = new THREE.InstancedMesh(g, shaderMat(U, BLOCK_VS, fs, { defines, uniforms: { uTop: blockTex().top, uSide: blockTex().side } }), m);
    list.forEach((b, k) => { dummy.position.set(b.x, TOP - 0.5, b.z); dummy.quaternion.setFromAxisAngle(Y, b.yaw); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); mesh.setMatrixAt(k, dummy.matrix); });
    mesh.instanceMatrix.needsUpdate = true; mesh.name = name; G.add(mark(mesh, { order })); return mesh;
  };
  const all = Array.from({ length: n }, (_, i) => blockData(i));
  mk(all.slice(0, nNear), blockGeo("near"), BLOCK_FS, { NEAR: 1 }, RENDER.road, "bimini-blocks-near");
  if (n > nNear) mk(all.slice(nNear), blockGeo("far"), FARBLOCK_FS, {}, RENDER.far, "bimini-blocks-far");
  // the standable tops: blocks 0-3 as invisible solid boxes
  for (let i = 0; i < Math.min(4, n); i++) {
    const b = all[i], bx = new THREE.Mesh(new THREE.BoxGeometry(b.w, 1.0, b.dep), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
    bx.position.set(b.x, TOP - 0.5, b.z); bx.rotation.y = b.yaw; bx.name = "bimini-solid-" + i; noLine(bx.material); G.add(mark(bx, { solid: true }));
  }
  return { G, all };
}
function buildDecals(U, items) {   // items: [x, z, hx, hz, shape, margin, yaw]
  const g = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), m = items.length, dd = new Float32Array(m * 4);
  items.forEach((it, k) => dd.set([it[2], it[3], it[4], it[5]], k * 4));
  g.setAttribute("aD", new THREE.InstancedBufferAttribute(dd, 4));
  const mesh = new THREE.InstancedMesh(g, shaderMat(U, DECAL_VS, DECAL_FS, { depthWrite: false }), m), o = new THREE.Object3D(), Y = new THREE.Vector3(0, 1, 0);
  items.forEach((it, k) => { o.position.set(it[0], it[7] ?? FLOOR + 0.012, it[1]); o.quaternion.setFromAxisAngle(Y, it[6] ?? 0); o.scale.set(1, 1, 1); o.updateMatrix(); mesh.setMatrixAt(k, o.matrix); });
  mesh.instanceMatrix.needsUpdate = true; mesh.name = "bimini-decals"; return mark(mesh, { order: RENDER.decal });
}
function floraMesh(U, geo, list, o = {}) {   // list: [{x,y,z,s,sy,yaw,tint:[r,g,b],ph}]
  const g = geo.clone(), m = list.length, tint = new Float32Array(m * 3), ph = new Float32Array(m);
  list.forEach((it, k) => { tint.set(it.tint ?? [1, 1, 1], k * 3); ph[k] = it.ph ?? hz(k, 77) * TAU; });
  g.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 3)); g.setAttribute("aPh", new THREE.InstancedBufferAttribute(ph, 1));
  const mat = shaderMat(U, FLORA_VS, FLORA_FS, { side: THREE.DoubleSide, defines: o.fan ? { FAN: 1 } : o.brain ? { BRAIN: 1 } : {}, uniforms: o.map ? { uMap: { value: o.map } } : {} });
  const mesh = new THREE.InstancedMesh(g, mat, m), d = new THREE.Object3D(), Y = new THREE.Vector3(0, 1, 0);
  list.forEach((it, k) => { d.position.set(it.x, it.y ?? FLOOR - 0.04, it.z); d.quaternion.setFromAxisAngle(Y, it.yaw ?? 0); d.scale.set(it.s, it.sy ?? it.s, it.sx ?? it.s); d.updateMatrix(); mesh.setMatrixAt(k, d.matrix); });
  mesh.instanceMatrix.needsUpdate = true; mesh.name = o.name || "bimini-flora"; return mark(mesh, { order: RENDER.flora });
}

function biminiroad(P) {
  const S = P.spec, U = makeU(S), G = P.whole, grp = new THREE.Group(); G.add(grp);
  const { G: bl, all } = buildBlocks(P, U); grp.add(bl);
  // contact shadows round every block + sand in the gaps
  grp.add(buildDecals(U, all.map((b) => [b.x, b.z, b.w * 0.5 + 0.05, b.dep * 0.5 + 0.05, 0, 0.9, b.yaw])));
  // soft contact shadows of what stands on the road: spec.contacts [[x, z, r], ...] on the top of block 0..3 (the cast's feet)
  if ((S.contacts || []).length) grp.add(buildDecals(U, S.contacts.map(([x, z, r]) => [x, z, r, r * 0.8, 1, 0.12, 0, TOP + 0.006])));
  // weed fringes: tall fronds in the gaps and along both sides of the near blocks (they sway)
  const tufts0 = [], tufts1 = [], nGap = Math.min(S.detail ?? 30, all.length - 1) + 10;
  for (let i = 0; i < nGap; i++) {
    const b = all[i], b2 = all[i + 1] || b, zg = (b.z + b2.z) * 0.5, wmin = Math.min(b.w, b2.w);
    const nt = i < 24 ? 3 : 2;
    for (let k = 0; k < nt; k++) { const x = (hz(i * 9 + k, 41) - 0.5) * (wmin - 0.4), sc = 0.7 + 0.8 * hz(i * 9 + k, 42); (hz(i * 9 + k, 43) > 0.5 ? tufts0 : tufts1).push({ x: x + (b.x + b2.x) / 2, z: zg + (hz(i * 9 + k, 44) - 0.5) * 0.1, s: sc * (i < 12 ? 1 : 0.7), sy: sc * (0.75 + 0.45 * hz(i * 9 + k, 45)) * (i < 4 ? 1 : 0.62), yaw: hz(i * 9 + k, 46) * TAU, tint: [0.92 + 0.16 * hz(k, i), 0.95 + 0.1 * hz(i, k), 0.9 + 0.2 * hz(i + k, 3)] }); }
    for (const sd of [-1, 1]) if (i < 34 && hz(i * 3 + sd, 47) > 0.35) { const sc = 0.8 + 0.7 * hz(i, 48 + sd); tufts1.push({ x: b.x + sd * (b.w * 0.5 + 0.12 + 0.2 * hz(i, 49)), z: b.z + (hz(i * 5 + sd, 50) - 0.5) * 2.2, s: sc, sy: sc * 1.1, yaw: hz(i, 51 + sd) * TAU, tint: [1, 1, 0.95] }); }
  }
  grp.add(floraMesh(U, tuftGeo(0), tufts0, { name: "bimini-gapweed-a" })); grp.add(floraMesh(U, tuftGeo(1), tufts1, { name: "bimini-gapweed-b" }));
  let ok = false;
  return {
    grip: 0,
    apply(ps, t) {
      U.uTime.value = t;
      if (!ok) ok = installHook(P, U, grp, null);
    },
  };
}

// ================================================================================================ THE BED
function clumps() {   // the reef: deterministic lists per kind
  const L = { brain: [], brainLo: [], bubble: [], stag0: [], stag1: [], tube0: [], tube1: [], fan0: [], fan1: [], grass: [], pebble: [], decals: [] };
  let k = 0; const R = (a = 0) => hz(++k, a);
  const tintOf = (base, jit) => [base[0] * (1 - jit + 2 * jit * R(1)), base[1] * (1 - jit + 2 * jit * R(2)), base[2] * (1 - jit + 2 * jit * R(3))];
  const item = (kind, x, z, s, extra = {}) => {
    const yaw = R(4) * TAU, ph = R(5) * TAU;
    if (kind === "brain") { (s > 0.7 ? L.brain : L.brainLo).push({ x, z, s, sy: s * (0.85 + 0.3 * R(6)), yaw, tint: tintOf([1, 1, 1], 0.14), ph }); L.decals.push([x, z, s * 1.05, s * 1.05, 1, 0.55 * s + 0.2]); }
    else if (kind === "bubble") { L.bubble.push({ x, z, s: s * 1.6, yaw, tint: tintOf([1, 1, 1], 0.1), ph }); L.decals.push([x, z, s * 0.9, s * 0.9, 1, 0.5 * s + 0.2]); }
    else if (kind === "stag") { (R(7) > 0.5 ? L.stag0 : L.stag1).push({ x, z, s: s * 0.7, yaw, tint: tintOf([1, 1, 1], 0.08), ph }); L.decals.push([x, z, s * 0.8, s * 0.8, 1, 0.5 * s + 0.2]); }
    else if (kind === "tube") { (R(8) > 0.5 ? L.tube0 : L.tube1).push({ x, z, s: s * 1.25, yaw, tint: tintOf([1, 1, 1], 0.08), ph }); L.decals.push([x, z, s * 0.5, s * 0.5, 1, 0.4 * s + 0.15]); }
    else if (kind === "fan") { (R(9) > 0.5 ? L.fan0 : L.fan1).push({ x, z, s: s * 2.5, sy: s * 2.8, yaw: extra.yaw ?? yaw, tint: [0.9 + 0.2 * R(10), 0.9 + 0.2 * R(11), 0.9 + 0.2 * R(12)], ph }); }
    else if (kind === "grass") L.grass.push({ x, z, s: 0.8 + 0.7 * R(13), sy: 0.8 + 0.8 * R(14), yaw, tint: tintOf([1, 1, 1], 0.1), ph });
    else if (kind === "pebble") L.pebble.push({ x, z, s: 0.08 + 0.22 * R(15), sy: 0.07 + 0.13 * R(16), sx: 0.1 + 0.2 * R(17), yaw, tint: tintOf([1, 1, 1], 0.12), ph, y: FLOOR - 0.02 });
  };
  const clump = (cx, cz, rad) => {
    const main = R(20); let kind = main < 0.3 ? "brain" : main < 0.4 ? "stag" : main < 0.55 ? "tube" : main < 0.7 ? "bubble" : "fan";
    item(kind, cx, cz, kind === "fan" ? 0.9 + 0.5 * R(21) : 0.7 + 0.8 * R(21) * rad);
    const nSat = 3 + Math.floor(R(22) * 4);
    for (let j = 0; j < nSat; j++) {
      const a = R(23) * TAU, rr = (0.9 + 1.7 * R(24)) * rad, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, w = R(25);
      if (w < 0.2) item("brain", x, z, 0.4 + 0.5 * R(26)); else if (w < 0.34) item("bubble", x, z, 0.28 + 0.26 * R(27)); else if (w < 0.46) item("tube", x, z, 0.6 + 0.5 * R(28));
      else if (w < 0.46) item("stag", x, z, 0.5 + 0.4 * R(29)); else if (w < 0.78) item("fan", x, z, 0.5 + 0.55 * R(30)); else item("grass", x, z, 1);
    }
    for (let j = 0; j < 2 + Math.floor(R(31) * 3); j++) { const a = R(32) * TAU, rr = (0.4 + 2.6 * R(33)) * rad; item("pebble", cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 1); }
  };
  for (const side of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      const x0 = [3.6, 6.6, 11.5, 19, 32][row], step = [4.6, 6, 8, 10, 14][row], zTop = [14, 20, 28, 38, 46][row], zBot = [-48, -60, -70, -70, -64][row];
      for (let z = zTop - R(34) * step; z > zBot; z -= step * (0.7 + 0.6 * R(35))) clump(side * (x0 + 2.2 * R(36) + (row < 3 ? 0.8 * R(37) : 3 * R(37))), z + (R(38) - 0.5) * 2.5, 0.8 + 0.55 * R(39));
    }
  }
  // lone pebbles and tufts between the clumps
  for (let j = 0; j < 150; j++) { const a = R(40), x = (a < 0.5 ? -1 : 1) * (3.2 + 40 * R(41) ** 1.6), z = 25 - 95 * R(42); item(R(43) > 0.4 ? "pebble" : "grass", x, z, 1); }
  return L;
}
const biminiL = () => once("bm-clumps", clumps);

function biminibed(P) {
  const S = P.spec, U = makeU(S), G = P.whole, grp = new THREE.Group(); G.add(grp);
  // the floor (one big quad) and the dome
  const fg = new THREE.PlaneGeometry(4400, 4400).rotateX(-Math.PI / 2).translate(0, FLOOR, 0);
  const floor = new THREE.Mesh(fg, shaderMat(U, FLOOR_VS, FLOOR_FS)); floor.name = "bimini-floor"; grp.add(mark(floor, { order: RENDER.floor }));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 14), new THREE.ShaderMaterial({ uniforms: { uCam: U.uCam, uFog: U.uFog }, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false }));
  noLine(dome.material); dome.name = "bimini-dome"; grp.add(mark(dome, { order: RENDER.dome }));
  // the ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(4400, 4400).rotateX(Math.PI / 2), shaderMat(U, CEIL_VS, CEIL_FS, { side: THREE.DoubleSide })); ceil.name = "bimini-ceiling"; ceil.visible = false;
  grp.add(mark(ceil, { order: RENDER.ceil }));
  // the shafts: soft columns, striped with rays
  const nS = S.shafts ?? 8, sg = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true).translate(0, -0.5, 0), sa = new Float32Array(nS);
  const sunA = U.uSun.value, dd = new THREE.Vector3(-sunA.x * 0.75, -sunA.y, -sunA.z * 0.75).normalize();
  const shafts = new THREE.InstancedMesh(sg, shaderMat(U, SHAFT_VS, SHAFT_FS, { side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), nS), ob = new THREE.Object3D(), up = dd.clone().negate(), qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  const POS = [[-1.5, -10], [6, -16], [-7, -24], [2.5, -34], [-3.5, 4], [9, -3], [-11, -12], [0.5, -52]];
  for (let k = 0; k < nS; k++) {
    const [x, z] = POS[k % POS.length], r = 1.6 + 2.6 * hz(k, 61), len = 10.5, top = new THREE.Vector3(x + (hz(k, 62) - 0.5) * 2, 0.3, z);
    ob.position.copy(top); ob.quaternion.copy(qq); ob.scale.set(r, len, r); ob.updateMatrix(); shafts.setMatrixAt(k, ob.matrix); sa[k] = hz(k, 63);
  }
  sg.setAttribute("aS", new THREE.InstancedBufferAttribute(sa, 1)); shafts.instanceMatrix.needsUpdate = true; shafts.name = "bimini-shafts"; grp.add(mark(shafts, { order: RENDER.shaft, steam: true }));
  // the reef
  if (S.reef !== false) {
    const L = biminiL(), fan0 = fanTex(0), fan1 = fanTex(1);
    grp.add(buildDecals(U, L.decals));
    const add = (geo, list, o) => { if (list.length) grp.add(floraMesh(U, geo, list, o)); };
    add(brainGeo(30, 18, 0), L.brain, { name: "bimini-brain", brain: true }); add(brainGeo(14, 8, 1), L.brainLo, { name: "bimini-brain-lo", brain: true }); add(bubbleGeo(), L.bubble, { name: "bimini-bubble" });
    add(stagGeo(0), L.stag0, { name: "bimini-stag0" }); add(stagGeo(1), L.stag1, { name: "bimini-stag1" }); add(tubeSpongeGeo(0), L.tube0, { name: "bimini-tube0" }); add(tubeSpongeGeo(1), L.tube1, { name: "bimini-tube1" });
    add(fanPlaneGeo(), L.fan0, { fan: true, map: fan0, name: "bimini-fan0" }); add(fanPlaneGeo(), L.fan1, { fan: true, map: fan1, name: "bimini-fan1" });
    add(tuftGeo(0), L.grass, { name: "bimini-grass" }); add(pebbleGeo(), L.pebble, { name: "bimini-pebbles" });
  }
  // the grade quad (the cast) and the scene fog
  const gu = { uGrade: { value: new THREE.Vector3(...(S.grade ?? [0.62, 0.90, 0.90])) }, uK: { value: S.gradeK ?? 0.7 }, uDepth: { value: 0 } };
  const gm = new THREE.ShaderMaterial({ uniforms: gu, vertexShader: GRADE_VS, fragmentShader: GRADE_FS, transparent: true, depthWrite: false, blending: THREE.CustomBlending });
  Object.assign(gm, { depthFunc: THREE.GreaterDepth, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }); noLine(gm);
  const grade = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gm); grade.name = "bimini-grade"; grade.visible = false; grp.add(mark(grade, { order: RENDER.grade, steam: true }));
  const fogObj = new THREE.FogExp2(col(S.fog ?? "#168fae").multiplyScalar(0.9), 1 / ((S.sight ?? 36) * 0.9));
  let ok = false;
  const extra = {
    fogOn: fogObj,
    before(cam, sc, near, cy) { const under = near && cy < 0; ceil.visible = under; grade.visible = under; dome.visible = under; gu.uDepth.value = clamp(-cy / 6); },
    after() { },
  };
  return {
    grip: 0,
    apply(ps, t) {
      U.uTime.value = t;
      if (!ok) ok = installHook(P, U, grp, extra);
    },
  };
}

export const C_BIMINI_KINDS = { biminiroad, biminibed };
export const C_BIMINI_GRIPS = {};
