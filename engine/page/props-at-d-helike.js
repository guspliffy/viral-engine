// Ancient aliens EP03 Atlantis, block D: Helike by night and its flood (panel 37, TikTok part 4's frame 0). Real 3D, one kind. Bench:
// storyboards/series/ancient-aliens/03-atlantis/block-d/bench/make-at-helike.mjs (+ at-helike-sheet.png). Look target: plates/plate-37-helike-night.png.
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, Spud 0.88. Everything here is lookOnly scenery
// (not solid, surfaceOnly): the ground, the town, the sea. Place it away from the stage origin (BOARD: P.helike = [40000, 20000]); far 9000, near 0.05.
// No Math.random, no wall clock: every mark is hashed from its index; the sea, the sway, the boats and the spray move from the clip clock t only.
//
//   helike   ORIGIN = Spud's standing spot on the knoll top (x 0, z 0), the knoll top at y 0: the ground is flat at y 0 within r 0.8 (STANDABLE; cast at
//            [0, 0] of the place, prop y 0). Sea level of the calm sea y -6 (the knoll is about 6 m above the shore); at flood 1 y -2.5.
//            The knoll: hand-drawn grass (blades, arching tufts, short at Spud's feet), wild flowers (white daisies, yellow, violet), 17 lichen-spotted rocks
//            (four at r 1.8 - 2.3 round Spud, none within r 0.7), shrubs, an olive tree on the left (three twisted strands, six limbs, about 19000 silver-green
//            leaves, olives) that stirs in the wind. It falls toward the shore on -z and +x.
//            The town (-x..+x, -z): 30 white plaster houses in 4 rows (z -27, -46, -66, -100; ground rising from y -5.9 to -3.6) with red tile roofs (every tile
//            drawn), doors, windows with shutters, quoins, chimneys, annexes, oleanders; cypresses and round trees between; a 6 x 11 column Doric temple
//            12 x 22 x 9 at (33, -78) turned 9 degrees (steps, fluted drums, echinus, architrave, triglyphs, tiled roof, pediment with figures); FIVE warm windows
//            (rows 0..3) that go dark when the water reaches them; two fishing boats (one mast, a furled sail on its yard, nets, baskets, a steering oar).
//            Behind: foothills with a far hill town, THREE mountain layers (z -1.7, -3.0, -4.4 km, 190 / 300 / 420 m high) with moonlit rims and rock streaks,
//            the sky dome (stars, halo), the full moon upper right (az 19 right of -z, painted at el 7.5; its light for the baked shading is el 24), cloud banks.
//            Light is BAKED (blue-silver moon from behind-right + a silver fill from the camera side), so the kind ignores the set's lights; use AT_NIGHT for Spud.
//            Note: AT_NIGHT's key (moon az 30 LEFT) lights Spud from the left while the painted moon is on the right (the plate's): flip AT_NIGHT's key for this shot if wanted.
//   spec:    flood 0 (start value of the param), detail 1 (0.2..1.5: grass, tuft and leaf density), swell 1 (wave height factor), wind 1 (sway of grass and leaves),
//            boats true (false: none).
//   params:  flood 0..1 (a dur-0 `set` seeds it, a tween moves it): the sea rises 3.5 m (y -6 -> -2.5). At 1 the two front rows are roof-deep (water at the eaves),
//            the surf stands a third up the temple columns, white foam rings every wall and column the water touches, crests break between the houses, spray puffs
//            rise where a wall stands clear by 1 m, the boats drift from the bay (z -13) into the streets (z -36.5). The waves grow with flood (0.6 -> 1.2).
//            The glitter path of the moon, the reflections of walls and the foam are drawn in the sea's own shader; waves = apply(ps, t).
//   CAMERAS (relative to the origin; Spud at [0, 0] facing 180):
//            wide 16:9 (panel 37, Spud on the left third like the plate): pos [1.2, 2.4, 6.4]  look [8.5, -3.9, -80]  fov 34
//            tall 1080 x 1920 (part 4 frame 0, the town drowning, Spud out of frame): pos [3, 4.2, 9]  look [8, -5.5, -60]  fov 54 (set `frame` off, far 9000)
//            lower view over the flooded streets toward the temple: pos [-4, 2.6, -36]  look [30, -3.6, -80]  fov 38;  Spud's feet: pos [0.9, 0.85, 3.1] look [0, 0.18, 0] fov 30
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hh = (a, b = 0, c = 0) => hs(a * 1.0 + b * 57.31 + c * 913.17 + 0.5);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vn = (x, z, s = 0) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const h = (a, b) => hs(a * 17.13 + b * 91.7 + s * 7.31);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
};
const fbm = (x, z, s = 0, o = 4) => { let a = 0, w = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { a += w * vn(x * f, z * f, s + i * 3.1); t += w; w *= 0.5; f *= 2.03; } return a / t; };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } else { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  return t;
}
const MEMO = new Map();
const once = (key, f) => { if (!MEMO.has(key)) MEMO.set(key, f()); return MEMO.get(key); };
const hexA = (hex, a) => { const c = new THREE.Color(hex); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; };
const srgb = (hex) => { const c = new THREE.Color(hex).convertLinearToSRGB(); return [c.r, c.g, c.b]; };   // for canvas fills in 0..1 sRGB (not used for vertex colours)

// ================================================================================================================ the world
// Sea level (calm) y -6; flood 1 = y -2.5. The knoll top is y 0 at the origin (Spud). The moon: upper right, behind the town.
const WATER0 = -6, RISE = 3.5, ZS = -21.5;
const MOON_AZ = -19, MOON_EL = 24, MOON_VIS_EL = 7.5;   // degrees (az left of -z, negative = right); light elevation vs the painted moon's elevation
const LD = norm3([-Math.sin(MOON_AZ * DEG) * Math.cos(MOON_EL * DEG), Math.sin(MOON_EL * DEG), -Math.cos(MOON_AZ * DEG) * Math.cos(MOON_EL * DEG)]);
const MD = norm3([-Math.sin(MOON_AZ * DEG) * Math.cos(MOON_VIS_EL * DEG), Math.sin(MOON_VIS_EL * DEG), -Math.cos(MOON_AZ * DEG) * Math.cos(MOON_VIS_EL * DEG)]);
const FD = norm3([0.18, 0.28, 0.94]);   // the sky's silver fill from the camera side
const AMB = [0.075, 0.105, 0.2], MON = [0.78, 0.86, 1.05], FIL = [0.2, 0.27, 0.46];
// baked shade of a face with normal n: rgb multiplier on the albedo (linear). The moon wraps a little so rims stay soft.
function shade(nx, ny, nz) {
  const up = 0.5 + 0.5 * ny, d = nx * LD[0] + ny * LD[1] + nz * LD[2], m = Math.max(0, (d + 0.2) / 1.2), f = Math.max(0, nx * FD[0] + ny * FD[1] + nz * FD[2]), g = 0.55 + 0.45 * up;
  const rim = Math.pow(m, 1.6);
  return [AMB[0] * g + MON[0] * rim * 0.55 + FIL[0] * f, AMB[1] * g + MON[1] * rim * 0.55 + FIL[1] * f, AMB[2] * g + MON[2] * rim * 0.55 + FIL[2] * f];
}

// ---- the ground (one height function for the terrain, the proximity map and every prop standing on it)
const SHORE = (x) => ZS + 3 * (fbm(x * 0.03, 5, 1) - 0.5);
const TEMPLE = { x: 33, z: -78, rot: 9 * DEG, g: -4.5 };
function groundBase(x, z) {
  const zs = SHORE(x);
  const nl = (fbm(x * 0.05, z * 0.05, 2) - 0.5);
  // the town plain: gently rising, then foothills, then the massif
  const az = Math.max(0, -z - 24);
  let land = -5.9 + 0.03 * Math.min(az, 80) + 0.0065 * Math.max(0, az - 80) + 0.15 * nl;
  if (z < -110) { const k = (-z - 110); land += 10 * sstep(0, 300, k) + 36 * sstep(100, 1900, k) + 14 * (fbm(x * 0.006, z * 0.006, 4) - 0.5) * sstep(0, 500, k); }
  land += mtn(x, z);
  // the temple terrace
  { const dx = x - TEMPLE.x, dz = z - TEMPLE.z, c = Math.cos(TEMPLE.rot), s = Math.sin(TEMPLE.rot), lx = dx * c - dz * s, lz = dx * s + dz * c; const q = Math.max(Math.abs(lx) - 8.8, Math.abs(lz) - 13.8, 0); land = lerp(TEMPLE.g, land, sstep(0, 9, q)); }
  const sea = Math.max(-10.5, -6.7 - 0.38 * (z - zs));
  return lerp(sea, land, sstep(zs + 3.5, zs - 0.6, z));
}
function groundH(x, z) {
  const base = groundBase(x, z);
  const dx = Math.max(0, x - 0.8), dz = Math.max(0, -z - 0.8), d = Math.hypot(dx, dz);
  let k = 1 - Math.pow(sstep(0, 19, d), 1.15);
  const r = Math.hypot(x, z), und = (fbm(x * 0.18, z * 0.18, 9) - 0.5) * 0.5 * sstep(0.8, 3, r) * (d < 1 ? 1 : 0.45);
  return lerp(base, und, k) ;
}
// the mountains: three layers (z about -1.9 km, -3.3 km, -4.6 km), big simple ridge shapes
function mtn(x, z) {
  let h = 0;
  const ridge = (x, z, zc, zw, amp, xs, seed, xc = 0) => {
    const e = Math.exp(-Math.pow((z - zc) / zw, 2));
    const r = 0.4 + 0.6 * Math.pow(fbm((x - xc) / xs, 3, seed, 4), 1.1);
    const rg = 1 - Math.abs(2 * fbm(x / (xs * 0.42), z / (zw * 0.9), seed + 7, 4) - 1), pk = 0.55 + 0.7 * Math.pow(rg, 1.6);
    return amp * e * r * pk * (0.65 + 0.35 * Math.exp(-Math.pow((x - xc) / (xs * 2.6), 2)));
  };
  h += ridge(x, z, -1700, 520, 190, 700, 11, -150);
  h += ridge(x, z, -3000, 650, 300, 1000, 23, 450);
  h += ridge(x, z, -4400, 750, 420, 1300, 37, -300);
  return h * sstep(-300, -900, z);
}

// ================================================================================================================ mesh builder
// A triangle soup with per-vertex colour (light baked in), uv and aMv (sway amplitude, phase).
class MB {
  constructor() { this.p = []; this.c = []; this.u = []; this.m = []; this.n = 0; }
  v(x, y, z, c, u = 0, v = 0, a = 0, ph = 0) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2], c[3] ?? 1); this.u.push(u, v); this.m.push(a, ph); this.n++; }
  // o: n (normal override), ns [3 normals], ref (a point inside: orient outward), uv [[u,v]x3], sw [[a,ph]x3] or [a,ph], k (brightness), flat (no shading)
  tri(a, b, d, alb, o = {}) {
    let ns = o.ns;
    if (!ns) {
      let n = o.n;
      if (!n) {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        n = norm3([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
        if (o.ref) { const cx = (a[0] + b[0] + d[0]) / 3 - o.ref[0], cy = (a[1] + b[1] + d[1]) / 3 - o.ref[1], cz = (a[2] + b[2] + d[2]) / 3 - o.ref[2]; if (n[0] * cx + n[1] * cy + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]]; }
      }
      ns = [n, n, n];
    }
    const cs = Array.isArray(alb[0]) ? alb : [alb, alb, alb], k = o.k ?? 1;
    [a, b, d].forEach((p, i) => {
      const s = o.flat ? [1, 1, 1] : shade(ns[i][0], ns[i][1], ns[i][2]), cc = cs[i], ao = o.ao ? o.ao[i] : 1;
      const uv = o.uv ? o.uv[i] : [0, 0], sw = o.sw ? (Array.isArray(o.sw[0]) ? o.sw[i] : o.sw) : [0, 0];
      this.v(p[0], p[1], p[2], [cc[0] * s[0] * k * ao, cc[1] * s[1] * k * ao, cc[2] * s[2] * k * ao, cc[3] ?? 1], uv[0], uv[1], sw[0], sw[1]);
    });
  }
  quad(p0, p1, p2, p3, alb, o = {}) {
    const uv = o.uv || [[0, 0], [1, 0], [1, 1], [0, 1]], cs = Array.isArray(alb[0]) ? alb : [alb, alb, alb, alb], ao = o.ao;
    const sub = (i, j, k) => ({ ...o, uv: [uv[i], uv[j], uv[k]], ao: ao && [ao[i], ao[j], ao[k]], ns: o.ns && [o.ns[i], o.ns[j], o.ns[k]], sw: o.sw && Array.isArray(o.sw[0]) ? [o.sw[i], o.sw[j], o.sw[k]] : o.sw });
    this.tri(p0, p1, p2, [cs[0], cs[1], cs[2]], sub(0, 1, 2)); this.tri(p0, p2, p3, [cs[0], cs[2], cs[3]], sub(0, 2, 3));
  }
  // a box turned ry about y at (cx, y0, cz), size sx sy sz; cols {top, side, side2, front}; uv scale in metres per texture repeat (o.uvm); skipBottom
  box(cx, y0, cz, sx, sy, sz, ry, cols, o = {}) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hz = sz / 2, y1 = y0 + sy, ref = [cx, y0 + sy / 2, cz], um = o.uvm || 0;
    const P = (x, y, z) => [cx + x * c + z * s, y, cz - x * s + z * c], top = cols.top || cols.side, s1 = cols.side, s2 = cols.side2 || cols.side, fr = cols.front || s1;
    const oo = { ref, k: o.k, flat: o.flat }, UV = (w, h) => um ? [[0, h / um], [w / um, h / um], [w / um, 0], [0, 0]] : undefined;
    if (!o.noTop) this.quad(P(-hx, y1, hz), P(hx, y1, hz), P(hx, y1, -hz), P(-hx, y1, -hz), top, { ...oo, uv: um ? [[0, 0], [sx / um, 0], [sx / um, sz / um], [0, sz / um]] : undefined });
    this.quad(P(-hx, y0, hz), P(hx, y0, hz), P(hx, y1, hz), P(-hx, y1, hz), fr, { ...oo, uv: UV(sx, sy), ao: o.ao ?? [0.7, 0.7, 1, 1] });
    this.quad(P(hx, y0, -hz), P(-hx, y0, -hz), P(-hx, y1, -hz), P(hx, y1, -hz), s1, { ...oo, uv: UV(sx, sy), ao: o.ao ?? [0.7, 0.7, 1, 1] });
    this.quad(P(hx, y0, hz), P(hx, y0, -hz), P(hx, y1, -hz), P(hx, y1, hz), s2, { ...oo, uv: UV(sz, sy), ao: o.ao ?? [0.7, 0.7, 1, 1] });
    this.quad(P(-hx, y0, -hz), P(-hx, y0, hz), P(-hx, y1, hz), P(-hx, y1, -hz), s2, { ...oo, uv: UV(sz, sy), ao: o.ao ?? [0.7, 0.7, 1, 1] });
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("aCol", new THREE.Float32BufferAttribute(this.c, 4));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute("aMv", new THREE.Float32BufferAttribute(this.m, 2));
    g.computeBoundingSphere(); return g;
  }
}

// ================================================================================================================ shaders
const NOISE = `
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm2(vec2 p) { float a = 0.0, w = 0.5; for (int i = 0; i < 4; i++) { a += w * vn2(p); p = p * 2.03 + 17.1; w *= 0.5; } return a / 0.9375; }
`;
const WAVES = `
#define WV(A, K, DX, DY, S) { float ph = K * (DX * p.x + DY * p.y) - S * t; float u = 0.5 + 0.5 * sin(ph); h += A * amp * (2.0 * u * u - 0.75); g += A * amp * K * 2.0 * u * cos(ph) * vec2(DX, DY); }
float waves(vec2 p, float t, float amp, out vec2 g) {
  float h = 0.0; g = vec2(0.0);
  WV(0.30, 0.42, 0.80, 0.60, 2.0) WV(0.22, 0.75, -0.40, 0.917, 2.71) WV(0.15, 1.30, 0.95, -0.31, 3.57) WV(0.09, 2.40, 0.20, 0.98, 4.85) WV(0.06, 4.10, -0.80, 0.60, 6.30)
  return h;
}`;
function waveJS(x, z, t, amp) {
  const W = [[0.30, 0.42, 0.80, 0.60, 2.0], [0.22, 0.75, -0.40, 0.917, 2.71], [0.15, 1.30, 0.95, -0.31, 3.57], [0.09, 2.40, 0.20, 0.98, 4.85], [0.06, 4.10, -0.80, 0.60, 6.30]];
  let h = 0; for (const [A, K, DX, DY, S] of W) { const u = 0.5 + 0.5 * Math.sin(K * (DX * x + DY * z) - S * t); h += A * amp * (2 * u * u - 0.75); } return h;
}
const WVS = `
attribute vec4 aCol; attribute vec2 aMv;
uniform float uTime, uSway;
varying vec4 vC; varying vec2 vUv; varying float vD; varying vec3 vL;
void main() {
  vC = aCol; vUv = uv; vec3 p = position;
  #ifdef SWAY
    float ph = aMv.y; p.x += aMv.x * uSway * sin(uTime * 1.7 + ph + position.x * 0.9); p.z += aMv.x * uSway * 0.6 * sin(uTime * 1.3 + ph * 1.7 + position.z); p.y += aMv.x * uSway * 0.15 * sin(uTime * 2.1 + ph);
  #endif
  vL = p;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vD = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const WFS = `
uniform sampler2D map; uniform vec3 uHaze; uniform float uHazeD; uniform float uWater; uniform float uTime; uniform float uAlphaCut;
varying vec4 vC; varying vec2 vUv; varying float vD; varying vec3 vL;
${NOISE}
void main() {
  vec4 c = vC;
  #ifdef MAP
    vec4 t = texture2D(map, vUv); c.rgb *= t.rgb; c.a *= t.a;
  #endif
  #ifdef MTN
    vec3 q = vL;
    vec2 a = vec2(q.x * 0.012 + q.z * 0.007, q.y * 0.018 + q.z * 0.011);
    float cr = fbm2(a), rid = 1.0 - abs(fbm2(a * 2.3 + 5.0) * 2.0 - 1.0), fine = vn2(a * 9.0);
    float lum = 0.18 + 1.25 * cr * cr + 1.1 * pow(rid, 2.2) * clamp(0.3 + vC.a * 1.8, 0.0, 1.0);
    c.rgb *= lum * (0.86 + 0.28 * fine);
    c.a = 1.0;
  #endif
  #ifdef WET
    float w = 1.0 - smoothstep(uWater - 0.05, uWater + 0.7 + 0.15 * sin(uTime * 1.6 + vL.x * 0.9 + vL.z * 0.7), vL.y);
    c.rgb = mix(c.rgb, c.rgb * vec3(0.5, 0.62, 0.9), w * 0.75);
  #endif
  float f = (1.0 - exp(-pow(vD / uHazeD, 1.7))) * 0.92;
  c.rgb = mix(c.rgb, uHaze, clamp(f, 0.0, 1.0));
  if (c.a < uAlphaCut) discard;
  gl_FragColor = vec4(c.rgb, 1.0);
  #include <colorspace_fragment>
}`;
function makeU() { return { uTime: { value: 0 }, uSway: { value: 1 }, uWater: { value: WATER0 }, uHaze: { value: new THREE.Color(...rgb("#101c46")) }, uHazeD: { value: 6000 } }; }
// kind of material: { map, sway, wet, mtn, side }
function wmat(U, o = {}) {
  const u = { ...U, map: { value: o.map || null }, uAlphaCut: { value: o.cut ?? 0.0 } }, defines = {};
  if (o.map) defines.MAP = 1; if (o.sway) defines.SWAY = 1; if (o.wet) defines.WET = 1; if (o.mtn) defines.MTN = 1;
  const m = new THREE.ShaderMaterial({ uniforms: u, defines, vertexShader: WVS, fragmentShader: WFS, side: THREE.DoubleSide, fog: false });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
}
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = false; me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true;
  if (o.order != null) me.renderOrder = o.order;
  parent.add(me); return me;
}

// ================================================================================================================ painted textures (made once)
function wrapDraw(S, x, y, r, f) { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { if (x + dx > -r && x + dx < S + r && y + dy > -r && y + dy < S + r) f(x + dx, y + dy); } }
const plasterTex = () => once("plaster", () => {
  const S = 512, [c, g] = canvas(S, S), R = (i, k = 0) => hh(i, k, 5);
  g.fillStyle = "#ece8dc"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 170; i++) {   // lime-wash mottling: soft blotches, light and dusty
    const x = R(i, 1) * S, y = R(i, 2) * S, r = 14 + 60 * R(i, 3), dark = R(i, 4) < 0.55, col = dark ? (R(i, 5) < 0.5 ? "#c9c3b0" : "#d4cdb8") : "#f8f6ee";
    wrapDraw(S, x, y, r, (px, py) => { const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, hexA(col, 0.10 + 0.2 * R(i, 6))); gr.addColorStop(1, hexA(col, 0)); g.fillStyle = gr; g.fillRect(px - r, py - r, 2 * r, 2 * r); });
  }
  g.lineCap = "round";
  for (let i = 0; i < 260; i++) {   // trowel strokes: short sweeps with their own length and weight
    const x = R(i, 10) * S, y = R(i, 11) * S, l = 12 + 40 * R(i, 12), a = -0.25 + 0.5 * R(i, 13), light = R(i, 14) < 0.5;
    g.strokeStyle = light ? "rgba(255,255,250,0.22)" : "rgba(150,140,115,0.14)"; g.lineWidth = 0.8 + 2.2 * R(i, 15);
    wrapDraw(S, x, y, l, (px, py) => { g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + l / 2, py + Math.sin(a) * l * 0.5 + 2, px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke(); });
  }
  for (let i = 0; i < 4; i++) {   // fallen plaster: the stone shows, each patch with its own stones
    const x = 40 + R(i, 20) * (S - 80), y = 40 + R(i, 21) * (S - 80), w = 14 + 26 * R(i, 22), h = 10 + 18 * R(i, 23);
    g.fillStyle = hexA("#b8ac90", 0.7); g.beginPath();
    for (let k = 0; k < 11; k++) { const a = (k / 11) * TAU, rr = 0.8 + 0.4 * R(i * 11 + k, 24); const px = x + Math.cos(a) * w * rr, py = y + Math.sin(a) * h * rr; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.fill();
    for (let k = 0; k < 7; k++) { const sx = x + (R(i * 7 + k, 25) - 0.5) * w * 1.3, sy = y + (R(i * 7 + k, 26) - 0.5) * h * 1.3, sw = 8 + 11 * R(i * 7 + k, 27), sh = 5 + 7 * R(i * 7 + k, 28); g.fillStyle = hexA(R(i * 7 + k, 29) < 0.5 ? "#8a7d62" : "#bfb292", 0.9); g.fillRect(sx - sw / 2, sy - sh / 2, sw, sh); g.strokeStyle = "rgba(70,60,45,0.5)"; g.lineWidth = 1; g.strokeRect(sx - sw / 2, sy - sh / 2, sw, sh); }
    g.strokeStyle = "rgba(90,80,62,0.6)"; g.lineWidth = 1.6; g.beginPath();
    for (let k = 0; k < 11; k++) { const a = (k / 11) * TAU, rr = 0.8 + 0.4 * R(i * 11 + k, 24); const px = x + Math.cos(a) * w * rr, py = y + Math.sin(a) * h * rr; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.stroke();
  }
  g.lineWidth = 1.2;
  for (let i = 0; i < 16; i++) {   // hairline cracks, wandering
    let x = R(i, 30) * S, y = R(i, 31) * S, a = R(i, 32) * TAU; g.strokeStyle = hexA("#6f6755", 0.35 + 0.3 * R(i, 33)); g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 9; k++) { a += (R(i * 9 + k, 34) - 0.5) * 1.1; x += Math.cos(a) * (7 + 12 * R(i * 9 + k, 35)); y += Math.sin(a) * (7 + 12 * R(i * 9 + k, 35)); g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 22; i++) {   // rain streaks down from the eaves
    const x = R(i, 40) * S, y = R(i, 41) * S * 0.5, l = 40 + 150 * R(i, 42), gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, "rgba(110,100,80,0.0)"); gr.addColorStop(0.2, "rgba(110,100,80,0.16)"); gr.addColorStop(1, "rgba(110,100,80,0)");
    g.fillStyle = gr; g.fillRect(x, y, 2 + 5 * R(i, 43), l);
  }
  return ctex(c, { repeat: true });
});
const tileTex = () => once("tiles", () => {
  const S = 256, [c, g] = canvas(S, S), NC = 8, NR = 8, W = S / NC, H = S / NR, R = (i, k = 0) => hh(i, k, 9);
  g.fillStyle = "#5a2418"; g.fillRect(0, 0, S, S);
  for (let r = 0; r < NR; r++) for (let q = 0; q < NC; q++) {
    const id = r * NC + q, x0 = q * W + (r % 2 ? W * 0.25 : -W * 0.1) * (R(id, 1) * 0.5 + 0.75), y0 = r * H, base = R(id, 2) < 0.18 ? "#a8452a" : R(id, 2) < 0.6 ? "#c2603c" : "#b4522f";
    for (const dx of [-S, 0]) {
      const x = x0 + dx;
      const gr = g.createLinearGradient(x, 0, x + W, 0);   // a half-round tile: lit crown, dark flanks
      gr.addColorStop(0, "#6e2c1c"); gr.addColorStop(0.28, base); gr.addColorStop(0.5, "#e08a58"); gr.addColorStop(0.72, base); gr.addColorStop(1, "#6a2a1a");
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + 1, y0 + H + 1); g.lineTo(x + 1.5, y0 + 2); g.quadraticCurveTo(x + W / 2, y0 - 1 + 2 * R(id, 3), x + W - 1.5, y0 + 2); g.lineTo(x + W - 1, y0 + H + 1); g.closePath(); g.fill();
      g.fillStyle = hexA("#2a0e08", 0.5); g.fillRect(x + 1, y0 + H - 3, W - 2, 3);   // the shadow under the lap
      g.fillStyle = hexA("#f4b080", 0.25 + 0.2 * R(id, 4)); g.fillRect(x + 2, y0 + 1, W - 4, 2);   // lit lip
      if (R(id, 5) < 0.3) { g.fillStyle = hexA("#7a8a4a", 0.35); for (let k = 0; k < 4; k++) g.fillRect(x + 3 + R(id * 4 + k, 6) * (W - 8), y0 + 3 + R(id * 4 + k, 7) * (H - 8), 1 + 2 * R(id * 4 + k, 8), 1 + 2 * R(id * 4 + k, 9)); }
      if (R(id, 10) < 0.22) { g.strokeStyle = hexA("#3a1408", 0.55); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + W * (0.3 + 0.4 * R(id, 11)), y0 + 3); g.lineTo(x + W * (0.3 + 0.4 * R(id, 12)), y0 + H - 3); g.stroke(); }
    }
  }
  return ctex(c, { repeat: true });
});
// a soft foamy puff (spray, mist): white lace with blue shade underneath
const puffTex = () => once("puff", () => {
  const S = 128, [c, g] = canvas(S, S);
  for (let i = 0; i < 70; i++) {
    const a = hh(i, 1, 3) * TAU, r = Math.sqrt(hh(i, 2, 3)) * 44, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * 0.9, rr = 5 + 14 * hh(i, 3, 3) * (1 - r / 70);
    const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, hexA(y > 64 ? "#cfdcee" : "#f4f8ff", 0.5)); gr.addColorStop(1, hexA("#ffffff", 0)); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  for (let i = 0; i < 40; i++) { const a = hh(i, 4, 3) * TAU, r = 18 + 38 * hh(i, 5, 3), x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * 0.9; g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(x, y, 0.8 + 1.8 * hh(i, 6, 3), 0, TAU); g.fill(); }
  const m = g.createRadialGradient(64, 64, 20, 64, 64, 64); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)"); g.globalCompositeOperation = "destination-in"; g.fillStyle = m; g.fillRect(0, 0, S, S);
  return ctex(c);
});
const glowTex = () => once("glow", () => { const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,230,170,1)"); gr.addColorStop(0.25, "rgba(255,190,100,0.55)"); gr.addColorStop(1, "rgba(255,160,70,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return ctex(c); });

// ================================================================================================================ the terrain
function mirrorGeo(f, t, s0, k) { const a = []; let x = f, s = s0; a.push(x); while (x + s < t - 1e-6) { x += s; a.push(x); s *= k; } a.push(t); return a; }
function xAxis() {
  const pos = mirrorGeo(135, 5400, 2.6, 1.13), neg = pos.map((v) => -v).reverse();
  const mid = []; for (let x = -135; x < -16; x += 2) mid.push(x); for (let x = -16; x < 18; x += 0.5) mid.push(x); for (let x = 18; x < 135; x += 2) mid.push(x);
  return [...neg.slice(0, -1), ...mid, ...pos];
}
function zAxisNear() {   // from -160 to +80
  const a = []; for (let z = -160; z < -14; z += 2) a.push(z); for (let z = -14; z < 16; z += 0.5) a.push(z); for (let z = 16; z < 46; z += 2) a.push(z); a.push(46, 60, 80);
  return a;
}
function zAxisFar() { return [...mirrorGeo(2400, 5400, 150, 1.12).map((v) => -v).reverse().slice(0, -1), ...mirrorGeo(160, 2400, 3, 1.06).map((v) => -v).reverse()]; }
function xAxisFar() { const pos = mirrorGeo(0, 1500, 26, 1.0).concat(mirrorGeo(1500, 5400, 26, 1.12).slice(1)); return [...pos.slice(1).map((v) => -v).reverse(), ...pos]; }
function terrainCol(x, z, h, nrm) {
  const nb = fbm(x * 0.11, z * 0.11, 5), nz = fbm(x * 0.7, z * 0.7, 3), sl = 1 - nrm[1];
  const gA = rgb("#4f8a2c"), gB = rgb("#8fb13c"), gC = rgb("#34622a"), dry = rgb("#b2a850"), rock = rgb("#7686b0"), soil = rgb("#7a6a4c"), sea = rgb("#34454a"), wetR = rgb("#4a5650");
  let c;
  if (z > -23 && z < 60 && Math.abs(x) < 200) {   // the knoll and the shore
    c = mix3(mix3(gC, gA, clamp(nb * 1.5)), gB, clamp((nz - 0.35) * 1.6) * 0.8);
    c = mix3(c, dry, clamp((fbm(x * 0.35, z * 0.35, 8) - 0.55) * 3) * 0.6);
    c = mix3(c, soil, sstep(-3.8, -5.6, h) * 0.8); c = mix3(c, wetR, sstep(-5.6, -6.2, h) * 0.8); c = mix3(c, sea, sstep(-6.3, -7.6, h));
    c = mix3(c, rock, clamp(sl * 2.2 - 0.45));
  } else if (z > -112) {   // the town plain: packed earth, grass, dark gardens
    c = mix3(rgb("#8c7c58"), mix3(gA, gC, 0.5), clamp((nb - 0.35) * 2.5)); c = mix3(c, rgb("#a49a78"), clamp((nz - 0.55) * 2));
    c = mix3(c, soil, 0.2); c = mix3(c, wetR, sstep(-5.3, -6.1, h) * 0.5); c = mix3(c, rock, clamp(sl * 2 - 0.3));
  } else {   // hills and the three layers of mountains: green low, grey rock high, bluer and paler with distance
    const hz = clamp(-z / 5000), alt = clamp(h / 380);
    const forest = mix3(rgb("#1c3a34"), rgb("#3a6040"), clamp((nb - 0.35) * 2));
    c = mix3(forest, rgb("#56704a"), clamp((nz - 0.6) * 1.5) * 0.4);
    c = mix3(c, rock, clamp(sstep(0.05, 0.45, alt) * 0.8 + sl * 1.8 + (nz - 0.5) * 0.8 - 0.3));
    c = mix3(c, rgb("#3a4a78"), sstep(0.04, 0.9, hz) * 0.78);
    c = mix3(c, rgb("#9ba8cc"), sstep(0.05, 0.9, hz) * 0.3 * sstep(0.25, 0.9, sl + alt * 0.5));
  }
  return c;
}
function terrainMesh(xs, zs, U, root, o) {
  const nx = xs.length, nz = zs.length, H = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = groundH(xs[i], zs[j]);
  const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 4), uv = new Float32Array(nx * nz * 2), mv = new Float32Array(nx * nz * 2);
  const hAt = (i, j) => H[clamp(j, 0, nz - 1) * nx + clamp(i, 0, nx - 1)];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], h = H[j * nx + i], i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1);
    const gx = (hAt(i1, j) - hAt(i0, j)) / (xs[i1] - xs[i0]), gz = (hAt(i, j1) - hAt(i, j0)) / (zs[j1] - zs[j0]), n = norm3([-gx, 1, -gz]);
    const alb = terrainCol(x, z, h, n), s = shade(n[0], n[1], n[2]), k = j * nx + i;
    if (o.rim) { const m = Math.pow(Math.max(0, n[0] * LD[0] + n[1] * LD[1] + n[2] * LD[2]), 1.4) * o.rim; s[0] += MON[0] * m; s[1] += MON[1] * m; s[2] += MON[2] * m; }
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    col[k * 4] = alb[0] * s[0]; col[k * 4 + 1] = alb[1] * s[1]; col[k * 4 + 2] = alb[2] * s[2]; col[k * 4 + 3] = clamp(1 - n[1]);
    uv[k * 2] = x; uv[k * 2 + 1] = z;
  }
  const idx = []; for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aCol", new THREE.BufferAttribute(col, 4)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("aMv", new THREE.BufferAttribute(mv, 2));
  g.setIndex(idx); g.computeBoundingSphere();
  put(root, g, wmat(U, o), { order: 1 });
}
function buildTerrain(U, root) {
  terrainMesh(xAxis(), zAxisNear(), U, root, { wet: true });
  terrainMesh(xAxisFar(), zAxisFar(), U, root, { mtn: true, rim: 1.0 });
}

// ================================================================================================================ the knoll: grass, flowers, rocks, shrubs, the olive
const hv = (a, b = 0) => hh(a, b, 7);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const GRASS = ["#2f5e22", "#4f8a2c", "#6f9f32", "#9bb840", "#b9be4c"].map(rgb);
const grassCol = (r) => { const k = r * (GRASS.length - 1), i = Math.min(GRASS.length - 2, Math.floor(k)); return mix3(GRASS[i], GRASS[i + 1], k - i); };

function blade(B, x, y, z, h, w, ang, lean, cB, cT, sway, ph, nrm) {
  const dx = Math.cos(ang), dz = Math.sin(ang), px = -dz * w, pz = dx * w;
  B.tri([x - px, y - 0.02, z - pz], [x + px, y - 0.02, z + pz], [x + dx * lean, y + h, z + dz * lean], [cB, cB, cT], { n: nrm || norm3([dx * 0.5, 0.78, dz * 0.5 + 0.35]), sw: [[0, ph], [0, ph], [sway, ph]] });
}
// a tuft: n blades arching out of one point (two segments each)
function tuft(B, x, y, z, h, n, seed, cB, cT) {
  for (let k = 0; k < n; k++) {
    const a = hv(seed, k) * TAU, hk = h * (0.55 + 0.6 * hv(seed, k + 40)), lean = hk * (0.25 + 0.5 * hv(seed, k + 80)), w = 0.012 + 0.012 * hv(seed, k + 120), dx = Math.cos(a), dz = Math.sin(a), px = -dz * w, pz = dx * w, ph = hv(seed, k + 160) * TAU;
    const m = [x + dx * lean * 0.45, y + hk * 0.6, z + dz * lean * 0.45], t = [x + dx * lean * 1.2, y + hk * 0.92, z + dz * lean * 1.2], nn = norm3([dx * 0.5, 0.7, dz * 0.5 + 0.35]), cM = mix3(cB, cT, 0.55);
    B.quad([x - px, y - 0.02, z - pz], [x + px, y - 0.02, z + pz], [m[0] + px * 0.8, m[1], m[2] + pz * 0.8], [m[0] - px * 0.8, m[1], m[2] - pz * 0.8], [cB, cB, cM, cM], { n: nn, sw: [[0, ph], [0, ph], [0.01, ph], [0.01, ph]] });
    B.tri([m[0] - px * 0.8, m[1], m[2] - pz * 0.8], [m[0] + px * 0.8, m[1], m[2] + pz * 0.8], t, [cM, cM, cT], { n: nn, sw: [[0.01, ph], [0.01, ph], [0.035, ph]] });
  }
}
function flower(B, x, y, z, hgt, col, ctr, size, seed, kind) {
  const lx = (hv(seed, 1) - 0.5) * 0.12, lz = (hv(seed, 2) - 0.5) * 0.12, hx = x + lx, hy = y + hgt, hz = z + lz, ph = hv(seed, 3) * TAU, stem = rgb("#4f7f30");
  B.quad([x - 0.004, y, z], [x + 0.004, y, z], [hx + 0.004, hy, hz], [hx - 0.004, hy, hz], [mul3(stem, 0.6), mul3(stem, 0.6), stem, stem], { n: [0, 0.8, 0.6], sw: [[0, ph], [0, ph], [0.012, ph], [0.012, ph]] });
  const nh = norm3([lx * 2, 0.7, 0.75 + lz]), u = norm3(cross(nh, [0, 1, 0.001])), v = cross(nh, u), np = kind === "daisy" ? 8 : 5, lit = 1.05 + 0.3 * hv(seed, 4), sw = [0.012, ph];
  for (let i = 0; i < np; i++) {
    const a = (i / np) * TAU + hv(seed, 5) * 2, a2 = a + TAU / np * 0.5, a0 = a - TAU / np * 0.5, r = size * (0.9 + 0.2 * hv(seed, 6 + i)), rw = size * 0.5;
    const dir = (ang, rr) => [hx + (u[0] * Math.cos(ang) + v[0] * Math.sin(ang)) * rr, hy + (u[1] * Math.cos(ang) + v[1] * Math.sin(ang)) * rr, hz + (u[2] * Math.cos(ang) + v[2] * Math.sin(ang)) * rr];
    B.tri([hx, hy, hz], dir(a0, rw), dir(a, r), [mul3(col, 0.8), col, mul3(col, lit)], { n: nh, sw });
    B.tri([hx, hy, hz], dir(a, r), dir(a2, rw), [mul3(col, 0.8), mul3(col, lit), col], { n: nh, sw });
  }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU, b = ((i + 1) / 5) * TAU, rr = size * 0.28; B.tri([hx + nh[0] * 0.002, hy + nh[1] * 0.002, hz + nh[2] * 0.002], [hx + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * rr, hy + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * rr, hz + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * rr], [hx + (u[0] * Math.cos(b) + v[0] * Math.sin(b)) * rr, hy + (u[1] * Math.cos(b) + v[1] * Math.sin(b)) * rr, hz + (u[2] * Math.cos(b) + v[2] * Math.sin(b)) * rr], ctr, { n: nh, k: 1.2, sw }); }
}
function buildGrass(U, root, qual, spud) {
  const B = new MB(), T = new MB(), F = new MB();
  const N = Math.round(34000 * qual);
  for (let i = 0; i < N; i++) {
    const r = 0.25 + 15 * Math.pow(hv(i, 1), 1.55), a = hv(i, 2) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r * (z0 => z0)(1);
    const y = groundH(x, z); if (y < WATER0 + 0.4) continue;
    const dens = 1 - sstep(-4.6, -6.0, y); if (hv(i, 3) > dens) continue;
    const hr = r < 0.6 ? 0.45 : 0.55 + 0.45 * sstep(0.6, 3.2, r), h = (0.07 + 0.24 * hv(i, 4)) * hr * (1 + 0.6 * (hv(i, 5) > 0.93 ? 1 : 0)), w = 0.011 + 0.014 * hv(i, 6), t = hv(i, 7), ph = hv(i, 8) * TAU;
    const cT = grassCol(clamp(0.25 + 0.7 * t + 0.1 * (fbm(x * 0.5, z * 0.5, 4) - 0.5))), cB = mul3(grassCol(0.05 + 0.3 * t), 0.7);
    blade(B, x, y, z, h, w, hv(i, 9) * TAU, h * (0.12 + 0.55 * hv(i, 10)), cB, cT, 0.012 + 0.03 * h, ph);
  }
  const NT = Math.round(300 * qual);   // tufts, taller and fuller, the ones that break the lawn
  for (let i = 0; i < NT; i++) {
    const r = 0.9 + 13 * Math.pow(hv(i, 21), 1.3), a = hv(i, 22) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, y = groundH(x, z); if (y < WATER0 + 0.5 || hv(i, 23) > 1 - sstep(-4.6, -6, y)) continue;
    const t = hv(i, 24); tuft(T, x, y, z, 0.22 + 0.32 * hv(i, 25), 9 + Math.floor(8 * hv(i, 26)), i * 3 + 1, mul3(grassCol(0.1 + 0.2 * t), 0.75), grassCol(0.45 + 0.5 * t));
  }
  // wild flowers in drifts: white (right of Spud and bottom left), yellow, violet
  const drifts = [[-3.2, 3.2, "w", 70], [-1.2, 2.4, "w", 34], [3.2, 1.6, "y", 36], [1.7, 3.4, "v", 30], [4.6, -1.2, "y", 24], [-2.6, -1.2, "v", 26], [0.4, -3.2, "w", 22], [6.4, 3.2, "w", 20], [-5.8, 2.2, "y", 22], [2.4, 0.9, "y", 14], [-0.4, 2.6, "v", 14]];
  const cols = { w: [rgb("#f4f4ee"), rgb("#f6e08a")], y: [rgb("#f2c72a"), rgb("#d98a1a")], v: [rgb("#9a7cd6"), rgb("#f2e6a0")] };
  drifts.forEach(([cx, cz, k, n], di) => {
    for (let i = 0; i < Math.round(n * qual); i++) {
      const a = hv(di * 100 + i, 31) * TAU, r = 1.6 * Math.sqrt(hv(di * 100 + i, 32)), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = groundH(x, z);
      if (y < WATER0 + 0.8 || Math.hypot(x, z) < 0.45) continue;
      flower(F, x, y, z, 0.12 + 0.22 * hv(di * 100 + i, 33), cols[k][0], cols[k][1], (k === "w" ? 0.028 : 0.022) + 0.014 * hv(di * 100 + i, 34), di * 100 + i, k === "w" && hv(di * 100 + i, 35) < 0.5 ? "daisy" : "five");
    }
  });
  const mG = wmat(U, { sway: true });
  put(root, B.geo(), mG, { order: 2 }); put(root, T.geo(), mG, { order: 2 }); put(root, F.geo(), mG, { order: 2 });
}
// leaves: lance-shaped, silver-green, each with its own length, width, droop
function leaf(B, p, d, len, wid, alb, ph, sway = 0.02) {
  const s = norm3(cross(d, [0.2, 1, 0.1])), mid = add3(p, sc3(d, len * 0.45)), tip = add3(add3(p, sc3(d, len)), [0, -len * 0.14, 0]);
  const l = add3(mid, sc3(s, -wid)), r = add3(mid, sc3(s, wid)); let n = norm3(cross(sub3(l, p), sub3(r, p))); if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
  const lo = mul3(alb, 0.8);
  B.tri(p, l, r, [lo, alb, alb], { n, sw: [[0, ph], [sway, ph], [sway, ph]] });
  B.tri(l, tip, r, [alb, mul3(alb, 1.12), alb], { n: norm3([n[0], n[1] + 0.1, n[2]]), sw: [[sway, ph], [sway * 1.6, ph], [sway, ph]] });
}
function bush(B, x, y, z, rad, seed, n) {
  for (let i = 0; i < n; i++) {
    const a = hv(seed, i) * TAU, e = hv(seed, i + 300) * 1.25, r = rad * (0.25 + 0.75 * Math.sqrt(hv(seed, i + 600))), bx = x + Math.cos(a) * r * Math.cos(e) * 0.8, bz = z + Math.sin(a) * r * Math.cos(e) * 0.8, by = y + 0.05 + Math.sin(e) * rad * 0.9;
    const d = norm3([Math.cos(a) * 0.7, 0.55 + 0.4 * hv(seed, i + 900), Math.sin(a) * 0.7]), t = hv(seed, i + 1200);
    leaf(B, [bx, by, bz], d, 0.12 + 0.1 * hv(seed, i + 1500), 0.014 + 0.012 * hv(seed, i + 1800), mix3(rgb("#3f6f33"), rgb("#8aa860"), t), hv(seed, i + 2100) * TAU, 0.02);
  }
}
// a rock: a noisy ball, flat-bottomed, each face its own tone; lichen spots lie on it as small discs
function rock(B, cx, cy, cz, sx, sy, sz, rot, seed, o = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 3), pa = geo.attributes.position, c = Math.cos(rot), s = Math.sin(rot), V = [];
  for (let i = 0; i < pa.count; i++) {
    const d = norm3([pa.getX(i), pa.getY(i), pa.getZ(i)]), nse = (vn(d[0] * 2.2 + seed, d[2] * 2.2 + d[1] * 1.7, seed) - 0.5) * 0.5 + (vn(d[0] * 6 + seed, d[2] * 6 + d[1] * 5, seed + 3) - 0.5) * 0.12, r = 1 + nse + 0.035 * Math.sin(d[1] * 17 + seed * 3);
    let x = d[0] * r * sx, y = d[1] * r * sy, zz = d[2] * r * sz; y = Math.max(y, -0.22 * sy);
    V.push([cx + x * c + zz * s, cy + y, cz - x * s + zz * c]);
  }
  const grey = o.col || rgb("#8d9098"), warm = rgb("#9a9486"), moss = rgb("#6d8048"), faces = [];
  for (let f = 0; f < V.length / 3; f++) {
    const a = V[f * 3], b = V[f * 3 + 1], d = V[f * 3 + 2], n = norm3(cross(sub3(b, a), sub3(d, a))), ctr = [(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3, (a[2] + b[2] + d[2]) / 3];
    const nn = (n[0] * (ctr[0] - cx) + n[1] * (ctr[1] - cy - sy * 0.3) + n[2] * (ctr[2] - cz) < 0) ? [-n[0], -n[1], -n[2]] : n;
    const band = Math.sin((ctr[1] - cy) * 16 / Math.max(0.3, sy) + seed) > 0.55 ? 0.86 : 1, v = 0.86 + 0.28 * hv(seed * 977 + f, 1);
    let alb = mix3(grey, warm, 0.5 * vn(ctr[0] * 3 + seed, ctr[2] * 3));
    alb = mix3(alb, moss, clamp((nn[1] - 0.55) * 1.8) * 0.55 * vn(ctr[0] * 5, ctr[2] * 5 + seed));
    B.tri(a, b, d, mul3(alb, v * band), { n: nn });
    faces.push([a, b, d, nn]);
  }
  const lich = [rgb("#e0a62c"), rgb("#c8cc66"), rgb("#ece6c2"), rgb("#d98a30"), rgb("#4a4e46")], nl = Math.round((o.lichen ?? 70));
  for (let i = 0; i < nl; i++) {
    const f = faces[Math.floor(hv(seed * 31 + i, 2) * faces.length)], [a, b, d, n] = f; if (n[1] < 0.05) continue;
    let u = hv(seed * 31 + i, 3), v = hv(seed * 31 + i, 4); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v + n[0] * 0.006, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v + n[1] * 0.006, a[2] + (b[2] - a[2]) * u + (d[2] - a[2]) * v + n[2] * 0.006];
    const e1 = norm3(cross(n, [0.3, 1, 0.2])), e2 = cross(n, e1), rr = (0.012 + 0.045 * Math.pow(hv(seed * 31 + i, 5), 2)) * Math.max(sx, sz), col = lich[Math.floor(hv(seed * 31 + i, 6) * 4.99)], k = 6;
    for (let q = 0; q < k; q++) {
      const a0 = (q / k) * TAU, a1 = ((q + 1) / k) * TAU, r0 = rr * (0.8 + 0.4 * hv(seed * 31 + i, 10 + q)), r1 = rr * (0.8 + 0.4 * hv(seed * 31 + i, 10 + (q + 1) % k));
      B.tri(p, [p[0] + (e1[0] * Math.cos(a0) + e2[0] * Math.sin(a0)) * r0, p[1] + (e1[1] * Math.cos(a0) + e2[1] * Math.sin(a0)) * r0, p[2] + (e1[2] * Math.cos(a0) + e2[2] * Math.sin(a0)) * r0], [p[0] + (e1[0] * Math.cos(a1) + e2[0] * Math.sin(a1)) * r1, p[1] + (e1[1] * Math.cos(a1) + e2[1] * Math.sin(a1)) * r1, p[2] + (e1[2] * Math.cos(a1) + e2[2] * Math.sin(a1)) * r1], col, { n, k: 1.15 });
    }
  }
}
// tubes: bark and branches along a Catmull-Rom path; colours by ring and by side (ridges)
function tube(B, pts, r0, r1, sides, cFn, o = {}) {
  const n = o.seg || 10, cu = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.5), P = cu.getPoints(n), rings = [];
  let up = [0, 1, 0];
  for (let i = 0; i <= n; i++) {
    const p = P[i], q = P[Math.min(n, i + 1)], pr = P[Math.max(0, i - 1)], t = norm3([q.x - pr.x, q.y - pr.y, q.z - pr.z]);
    let a = cross(t, Math.abs(t[1]) > 0.95 ? [1, 0, 0] : up); a = norm3(a); const b = cross(t, a), k = i / n, r = lerp(r0, r1, Math.pow(k, o.pow || 1)) * (1 + (o.knob ? 0.18 * Math.sin(k * 17 + (o.seed || 0)) : 0));
    const ring = []; for (let j = 0; j < sides; j++) { const ang = (j / sides) * TAU + (o.twist || 0) * k, c = Math.cos(ang), s = Math.sin(ang), nn = [a[0] * c + b[0] * s, a[1] * c + b[1] * s, a[2] * c + b[2] * s]; ring.push({ p: [p.x + nn[0] * r * (o.oval ?? 1), p.y + nn[1] * r, p.z + nn[2] * r * (o.oval ?? 1)], n: nn }); }
    rings.push(ring);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < sides; j++) {
    const j2 = (j + 1) % sides, A = rings[i][j], Bq = rings[i][j2], C = rings[i + 1][j2], D = rings[i + 1][j], ca = cFn(i / n, j), cb = cFn(i / n, j2), cc = cFn((i + 1) / n, j2), cd = cFn((i + 1) / n, j);
    B.quad(A.p, Bq.p, C.p, D.p, [ca, cb, cc, cd], { ns: [A.n, Bq.n, C.n, D.n], sw: o.sw });
  }
  return P;
}
function buildOlive(U, root, qual) {
  const W = new MB(), L = new MB(), g0 = groundH(-3.1, -0.6), bark = [rgb("#5a4838"), rgb("#7c6a52"), rgb("#9b8a6e"), rgb("#46382c")];
  const barkC = (seed) => (k, j) => { const v = hv(seed + j * 3, 1), m = mix3(bark[0], bark[1], v); return mix3(m, bark[2], (j % 3 === 0 ? 0.35 : 0) * hv(seed + Math.floor(k * 9), 2)); };
  // the trunk: three twisted strands, a split at the top, buttress roots
  const tops = [];
  for (let s = 0; s < 3; s++) {
    const a0 = (s / 3) * TAU, pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, a = a0 + t * 2.6, off = 0.17 * (1 - 0.35 * t); pts.push([-3.1 + 1.1 * Math.pow(t, 1.3) + Math.cos(a) * off, g0 - 0.05 + t * 1.95, -0.6 + 0.35 * t + Math.sin(a) * off]); }
    tops.push(tube(W, pts, 0.27, 0.16, 8, barkC(10 + s), { seg: 12, knob: true, seed: s, pow: 0.8 }).pop());
  }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3, l = 0.55 + 0.6 * hv(i, 50), x0 = -3.1 + Math.cos(a) * 0.1, z0 = -0.6 + Math.sin(a) * 0.1; tube(W, [[x0, g0 + 0.3, z0], [x0 + Math.cos(a) * l * 0.4, g0 + 0.1, z0 + Math.sin(a) * l * 0.4], [x0 + Math.cos(a) * l, g0 - 0.03, z0 + Math.sin(a) * l]], 0.13, 0.03, 6, barkC(30 + i), { seg: 6 }); }
  const fork = [-2.1, g0 + 1.9, -0.3];
  // limbs: five main branches fanning up and out; each with sub-branches, twigs, leaves and olives
  const limbs = [[1.0, 0.75, 0.5, 3.6], [0.3, 1.0, 0.2, 3.0], [-0.9, 0.65, 0.5, 3.4], [0.5, 0.4, 1.0, 3.2], [1.0, 0.3, -0.2, 3.3], [-0.3, 0.55, 1.0, 2.7]];
  const olives = [];
  const palL = [rgb("#5f7f4c"), rgb("#8fa97c"), rgb("#b9ccb0"), rgb("#7a9a62")];
  limbs.forEach(([dx, dy, dz, len], li) => {
    const d = norm3([dx, dy, dz]), pts = [fork];
    for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push([fork[0] + d[0] * len * t + 0.3 * Math.sin(li * 2 + t * 3), fork[1] + d[1] * len * t * (1 - 0.35 * t) + 0.18 * Math.sin(t * 5 + li), fork[2] + d[2] * len * t + 0.25 * Math.sin(li * 3 + t * 4)]); }
    const P = tube(W, pts, 0.15, 0.035, 7, barkC(60 + li * 7), { seg: 14, knob: true, seed: li });
    for (let sb = 0; sb < 7; sb++) {
      const u = 0.25 + 0.7 * hv(li * 10 + sb, 60), pi = Math.min(P.length - 2, Math.floor(u * (P.length - 1))), p = P[pi], q = P[pi + 1], td = norm3([q.x - p.x, q.y - p.y, q.z - p.z]);
      const a = hv(li * 10 + sb, 61) * TAU, sd = norm3([td[0] * 0.6 + Math.cos(a) * 0.8, td[1] * 0.4 + 0.35 + 0.4 * hv(li * 10 + sb, 62), td[2] * 0.6 + Math.sin(a) * 0.8]), sl = 0.9 + 1.0 * hv(li * 10 + sb, 63);
      const sp = [[p.x, p.y, p.z], [p.x + sd[0] * sl * 0.4, p.y + sd[1] * sl * 0.4, p.z + sd[2] * sl * 0.4], [p.x + sd[0] * sl * 0.8, p.y + sd[1] * sl * 0.75 - 0.05, p.z + sd[2] * sl * 0.8], [p.x + sd[0] * sl, p.y + sd[1] * sl * 0.9 - 0.12, p.z + sd[2] * sl]];
      const SP = tube(W, sp, 0.045, 0.009, 5, barkC(90 + li * 13 + sb), { seg: 6 });
      for (let tw = 0; tw < 7; tw++) {
        const w = 0.2 + 0.8 * hv(li * 100 + sb * 10 + tw, 70), wi = Math.min(SP.length - 2, Math.floor(w * (SP.length - 1))), tp = SP[wi], tq = SP[wi + 1], tdir = norm3([tq.x - tp.x, tq.y - tp.y, tq.z - tp.z]);
        const b = hv(li * 100 + sb * 10 + tw, 71) * TAU, wd = norm3([tdir[0] + Math.cos(b) * 0.8, tdir[1] + 0.3 * (hv(li * 100 + sb * 10 + tw, 72) - 0.4), tdir[2] + Math.sin(b) * 0.8]), wl = 0.35 + 0.35 * hv(li * 100 + sb * 10 + tw, 73), seed = li * 1000 + sb * 100 + tw;
        const tpts = [[tp.x, tp.y, tp.z], [tp.x + wd[0] * wl * 0.5, tp.y + wd[1] * wl * 0.5, tp.z + wd[2] * wl * 0.5], [tp.x + wd[0] * wl, tp.y + wd[1] * wl - 0.04, tp.z + wd[2] * wl]];
        tube(W, tpts, 0.007, 0.003, 3, () => bark[1], { seg: 2 });
        const nlf = Math.round(64 * qual);
        for (let k = 0; k < nlf; k++) {
          const f = k / nlf, base = [tpts[0][0] + (tpts[2][0] - tpts[0][0]) * f, tpts[0][1] + (tpts[2][1] - tpts[0][1]) * f, tpts[0][2] + (tpts[2][2] - tpts[0][2]) * f], side = k % 2 ? 1 : -1, ang = hv(seed + k, 80) * 0.9 + 0.35;
          const ld = norm3([wd[0] + side * Math.cos(b + 1.6) * ang * 1.6, wd[1] + 0.25 + (hv(seed + k, 81) - 0.5) * 0.8, wd[2] + side * Math.sin(b + 1.6) * ang * 1.6]), t = hv(seed + k, 82);
          leaf(L, base, ld, 0.075 + 0.075 * hv(seed + k, 83), 0.012 + 0.012 * hv(seed + k, 84), t < 0.5 ? mix3(palL[0], palL[1], t * 2) : mix3(palL[2], palL[3], (t - 0.5) * 2), hv(seed + k, 85) * TAU, 0.025);
          if (k % 9 === 4 && hv(seed + k, 86) < 0.55) olives.push([base[0] + ld[0] * 0.06, base[1] - 0.03, base[2] + ld[2] * 0.06, seed + k]);
        }
        // the end leaf of the twig
        leaf(L, tpts[2], wd, 0.1, 0.014, palL[1], hv(seed, 90) * TAU, 0.025);
      }
    }
  });
  // olives: small ovals, green with a few ripe dark ones, each hung by a short stalk
  const O = new MB();
  for (const [x, y, z, sd] of olives) {
    const ripe = hv(sd, 91) < 0.18, col = ripe ? rgb("#3a3f2a") : mix3(rgb("#4a5e2a"), rgb("#7f9234"), hv(sd, 92)), rx = 0.013 + 0.004 * hv(sd, 93), ry = rx * 1.3, y0 = y - ry * 1.4;
    const ring = (k) => { const a = (k / 6) * TAU; return [x + Math.cos(a) * rx, y0 + ry * 0.2, z + Math.sin(a) * rx]; };
    for (let k = 0; k < 6; k++) { const a = ring(k), b = ring((k + 1) % 6); O.tri(a, b, [x, y0 + ry * 1.2, z], [mul3(col, 0.9), mul3(col, 0.9), mul3(col, 1.25)], { ref: [x, y0 + ry * 0.4, z] }); O.tri(a, [x, y0 - ry * 0.9, z], b, [mul3(col, 0.9), mul3(col, 0.6), mul3(col, 0.9)], { ref: [x, y0 + ry * 0.4, z] }); }
  }
  const mW = wmat(U, { wet: true }), mL = wmat(U, { sway: true });
  put(root, W.geo(), mW, { order: 2 }); put(root, L.geo(), mL, { order: 2 }); put(root, O.geo(), mL, { order: 2 });
}
function buildFoliage(U, root, qual) {
  const R = new MB(), S = new MB();
  // rocks near Spud's feet (r >= 0.7 clear), a few big ones bottom left, flat slabs and stones down the slope
  const rocks = [[-1.55, -0.95, 0.5, 0.3, 0.42, 0.9, 1], [1.75, -1.3, 0.4, 0.22, 0.32, 2.1, 2], [0.85, 2.0, 0.34, 0.2, 0.28, 0.4, 3], [-2.3, 1.15, 0.62, 0.36, 0.5, 1.5, 4],
    [-4.6, 2.3, 1.15, 0.7, 0.95, 0.6, 5], [-3.3, 3.9, 0.85, 0.5, 0.7, 2.6, 6], [-6.0, 1.0, 0.9, 0.55, 0.8, 1.1, 7], [3.6, 1.8, 0.55, 0.16, 0.42, 0.3, 8], [2.4, -3.0, 0.7, 0.2, 0.5, 2.3, 9], [-0.2, -4.6, 0.6, 0.17, 0.46, 1.9, 10], [5.0, -1.2, 0.5, 0.15, 0.38, 0.7, 11],
    [-2.6, -4.2, 0.55, 0.16, 0.44, 2.9, 12], [1.2, -7.4, 0.8, 0.28, 0.6, 0.5, 13], [4.8, -5.4, 0.9, 0.3, 0.65, 1.7, 14], [-3.8, -7.6, 0.7, 0.24, 0.5, 2.2, 15], [0.2, 3.7, 0.3, 0.1, 0.22, 0.9, 16], [2.2, 3.1, 0.26, 0.09, 0.2, 2.0, 17]];
  rocks.forEach(([x, z, sx, sy, sz, rot, sd]) => { const y = groundH(x, z); rock(R, x, y + sy * 0.12, z, sx, sy, sz, rot, sd, { lichen: sx > 0.45 ? 90 : 36 }); });
  const shrubs = [[-6.4, -1.4, 0.9, 1], [-2.0, 4.8, 0.55, 2], [3.4, 3.0, 0.4, 3], [-5.4, 4.0, 0.7, 4], [4.4, -3.4, 0.5, 5], [-0.9, -3.0, 0.38, 6], [-7.6, 3.2, 0.8, 7], [-1.6, -6.2, 0.55, 8]];
  shrubs.forEach(([x, z, r, sd]) => bush(S, x, groundH(x, z), z, r, sd * 17, Math.round(150 * r * qual)));
  // little bushes of low thorny shrub in rock crevices near the big stones
  const mR = wmat(U, { wet: true }), mS = wmat(U, { sway: true });
  put(root, R.geo(), mR, { order: 2 }); put(root, S.geo(), mS, { order: 2 });
}

// ================================================================================================================ the town
const ROWS = [
  { z: -27, xs: [-78, -55, -33, -12, 14, 40, 64, 88], q: 1 },
  { z: -46, xs: [-90, -66, -42, -18, 6, 30, 56, 82], q: 1 },
  { z: -66, xs: [-84, -58, -32, -6, 16, 64, 90], q: 0.7 },
  { z: -100, xs: [-90, -62, -36, -10, 14, 70, 94], q: 0.5 },
];
const WARM_AT = [[0, 3], [1, 2], [1, 6], [2, 2], [3, 4]];
const PLASTER_T = [rgb("#f0ede2"), rgb("#ebe3d0"), rgb("#f2efe6"), rgb("#e6e0d0")];
function houses() {
  const L = []; let id = 0;
  ROWS.forEach((row, ri) => row.xs.forEach((x0, i) => {
    const sd = ri * 31 + i, w = 6.4 + 2.6 * hv(sd, 1), d = 5.4 + 2.4 * hv(sd, 2), wh = 3.2 + 0.6 * hv(sd, 3), x = x0 + (hv(sd, 4) - 0.5) * 6, z = row.z + (hv(sd, 5) - 0.5) * 5, rot = (hv(sd, 6) - 0.5) * 0.22;
    L.push({ id: id++, ri, i, sd, w, d, wh, x, z, rot, g: groundH(x, z), gable: hv(sd, 7) < 0.4, chim: hv(sd, 8) < 0.35, annex: hv(sd, 9) < 0.3, warm: WARM_AT.some(([a, b]) => a === ri && b === i), q: row.q, tint: Math.floor(hv(sd, 10) * 3.99), roofT: 0.88 + 0.3 * hv(sd, 11), door: (hv(sd, 12) - 0.5) * (w - 3.4) });
  }));
  return L;
}
function buildHouse(Bp, Bt, Bd, Wn, H, fp) {
  const { x, z, rot, w, d, wh, g, sd, q } = H, c = Math.cos(rot), s = Math.sin(rot), hx = w / 2, hz = d / 2, y0 = g - 0.35, y1 = g + wh;
  const P = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c], ref = [x, g + wh / 2, z];
  const pl = mul3(PLASTER_T[H.tint], 1), pU = (a, b) => [[a / 3, 1], [b / 3, 1], [b / 3, 0], [a / 3, 0]];
  const wall = (p0, p1, lenU, off) => {   // a wall quad from lower p0 to lower p1, up to y1
    const hgt = y1 - y0, u0 = off / 3, u1 = (off + lenU) / 3, v = hgt / 3;
    Bp.quad([p0[0], y0, p0[2]], [p1[0], y0, p1[2]], [p1[0], y1, p1[2]], [p0[0], y1, p0[2]], pl, { ref, uv: [[u0, v], [u1, v], [u1, 0], [u0, 0]], ao: [0.72, 0.72, 1, 1] });
  };
  wall(P(-hx, 0, hz), P(hx, 0, hz), w, sd * 1.7); wall(P(hx, 0, -hz), P(-hx, 0, -hz), w, sd * 1.3); wall(P(hx, 0, hz), P(hx, 0, -hz), d, sd * 2.1); wall(P(-hx, 0, -hz), P(-hx, 0, hz), d, sd * 0.9);
  // plinth stones
  Bd.box(x, y0 - 0.1, z, w + 0.14, 0.7, d + 0.14, rot, { side: rgb("#a6a08e"), top: rgb("#bdb7a4") }, { noTop: false });
  // the roof: hip or gable, its tiles are the texture; eaves overhang 0.45, a darker eave edge, a ridge row
  const ov = 0.45, ex = hx + ov, ez = hz + ov, rh = (H.gable ? 1.5 : 1.35) + 0.5 * hv(sd, 13), ey = y1 - 0.02, tc = mul3(rgb("#e8a07a"), H.roofT * (0.9 + 0.2 * hv(sd, 14)));
  const roofQ = (a, b, cc, e, flip) => { const [p0, p1, p2, p3] = [a, b, cc, e]; const sl = Math.hypot(Math.hypot(p3[0] - p0[0], p3[2] - p0[2]), p3[1] - p0[1]), ln = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]); Bt.quad(p0, p1, p2, p3, tc, { ref, uv: [[0, 0], [ln / 2, 0], [ln / 2 * 0.8, sl / 2.2], [-ln / 2 * 0.0, sl / 2.2]], ao: [0.85, 0.85, 1, 1] }); };
  if (H.gable) {
    const R1 = P(-ex, ey + rh, 0), R2 = P(ex, ey + rh, 0);
    roofQ(P(-ex, ey, ez), P(ex, ey, ez), R2, R1); roofQ(P(ex, ey, -ez), P(-ex, ey, -ez), R1, R2);
    for (const sg of [1, -1]) Bp.tri(P(sg * hx, y1, hz), P(sg * hx, y1, -hz), P(sg * hx, y1 + rh * (hz / ez) * 0.98, 0), pl, { ref, uv: [[0, 1], [1, 1], [0.5, 0]] });
  } else {
    const rl = Math.max(0.35, ex - ez), R1 = P(-rl, ey + rh, 0), R2 = P(rl, ey + rh, 0);
    roofQ(P(-ex, ey, ez), P(ex, ey, ez), R2, R1); roofQ(P(ex, ey, -ez), P(-ex, ey, -ez), R1, R2);
    Bt.tri(P(ex, ey, ez), P(ex, ey, -ez), R2, tc, { ref, uv: [[0, 0], [ez, 0], [ez / 2, rh]] }); Bt.tri(P(-ex, ey, -ez), P(-ex, ey, ez), R1, tc, { ref, uv: [[0, 0], [ez, 0], [ez / 2, rh]] });
  }
  const ec = mul3(rgb("#a8503a"), 0.8);   // eave edge (the thickness of the tiles)
  Bd.box(x + 0 * c, ey - 0.2, z, 2 * ex, 0.2, 2 * ez, rot, { side: ec, top: ec }, { noTop: true, ao: [0.8, 0.8, 0.9, 0.9] });
  const rc = mul3(rgb("#b8583a"), H.roofT);
  if (H.gable) Bd.box(x, ey + rh - 0.04, z, 2 * ex + 0.1, 0.16, 0.34, rot, { side: rc, top: mul3(rc, 1.1) }, {});
  else { const rl = Math.max(0.35, ex - ez); Bd.box(x, ey + rh - 0.04, z, 2 * rl + 0.3, 0.16, 0.32, rot, { side: rc, top: mul3(rc, 1.1) }, {}); }
  if (H.chim) { const [cx, , cz] = P(hx * 0.45, 0, -hz * 0.2); Bd.box(cx, ey + 0.4, cz, 0.62, rh + 1.0, 0.62, rot, { side: mix3(pl, rgb("#b9a58a"), 0.35), top: rgb("#4a4038") }, {}); Bd.box(cx, ey + rh + 1.35, cz, 0.78, 0.14, 0.78, rot, { side: rgb("#cfc6b0"), top: rgb("#cfc6b0") }, {}); }
  // an annex (low lean-to) on one side
  if (H.annex && q > 0.6) { const aw = 3.2, ad = d * 0.7, ah = wh * 0.72, [ax, , az] = P(hx + aw / 2 - 0.05, 0, -d * 0.1); Bd.box(ax, y0, az, aw, ah + 0.35, ad, rot, { side: mix3(pl, rgb("#c4b690"), 0.65), top: tc }, { noTop: true }); Bt.quad(P(hx - 0.2, g + ah + 0.55, -d * 0.1 + ad / 2 + 0.3), P(hx + aw + 0.2, g + ah - 0.05, -d * 0.1 + ad / 2 + 0.3), P(hx + aw + 0.2, g + ah - 0.05, -d * 0.1 - ad / 2 - 0.3), P(hx - 0.2, g + ah + 0.55, -d * 0.1 - ad / 2 - 0.3), tc, { ref, uv: [[0, 0], [2, 0], [2, 3], [0, 3]] }); }
  // door, windows (recess dark, frame, sill, shutters), quoins
  const face = (lx, y, lz, nx, nz) => [x + lx * c + lz * s + nx * 0.02, y, z - lx * s + lz * c + nz * 0.02];
  const zf = hz + 0.02, dark = rgb("#241c18"), wood = rgb("#7a5a3a"), stone = rgb("#c8c1ac");
  const dx = H.door;
  Bd.box(...(() => { const p = P(dx, 0, hz + 0.04); return [p[0], g, p[2]]; })(), 1.1, 2.2, 0.1, rot, { side: dark, top: dark }, { noTop: true });
  Bd.box(...(() => { const p = P(dx, 0, hz + 0.1); return [p[0], g + 2.2, p[2]]; })(), 1.6, 0.28, 0.3, rot, { side: stone, top: stone }, {});
  Bd.box(...(() => { const p = P(dx - 0.62, 0, hz + 0.1); return [p[0], g, p[2]]; })(), 0.16, 2.2, 0.2, rot, { side: wood, top: wood }, {}); Bd.box(...(() => { const p = P(dx + 0.62, 0, hz + 0.1); return [p[0], g, p[2]]; })(), 0.16, 2.2, 0.2, rot, { side: wood, top: wood }, {});
  Bd.box(...(() => { const p = P(dx, 0, hz + 0.45); return [p[0], g - 0.05, p[2]]; })(), 1.5, 0.14, 0.7, rot, { side: stone, top: mul3(stone, 1.1) }, {});
  const win = (lx, wy, side, key) => {
    const ww = 0.78, wh2 = 1.0, hot = key === "warm";
    const p = P(side === "f" ? lx : hx, 0, side === "f" ? hz : lx);
    const yaw = rot + (side === "f" ? 0 : Math.PI / 2);
    const out = side === "f" ? 0.05 : 0.05;
    const cx2 = p[0] + (side === "f" ? s * out : c * out), cz2 = p[2] + (side === "f" ? c * out : -s * out);
    if (!hot) Bd.box(cx2, wy, cz2, ww, wh2, 0.1, yaw, { side: rgb("#1b2236"), top: rgb("#1b2236") }, { noTop: true });
    Bd.box(cx2, wy - 0.08, cz2, ww + 0.34, 0.1, 0.22, yaw, { side: stone, top: stone }, {}); Bd.box(cx2, wy + wh2, cz2, ww + 0.26, 0.12, 0.2, yaw, { side: stone, top: stone }, {});
    if (q > 0.6) { const sh = hv(sd * 5 + Math.floor(lx * 10), 20) < 0.6 ? rgb("#4f8392") : rgb("#8a5a34"); for (const sg of [-1, 1]) { const o = Math.cos(yaw) * sg * (ww / 2 + 0.22), o2 = -Math.sin(yaw) * sg * (ww / 2 + 0.22); Bd.box(cx2 + o, wy - 0.02, cz2 + o2, 0.4, wh2 + 0.04, 0.06, yaw, { side: sh, top: sh }, { noTop: true }); } }
    return [cx2, wy, cz2, yaw];
  };
  const wins = [];
  const wy = g + 1.45 + (H.warm ? 0 : 0.0);
  const slots = [-hx * 0.62, hx * 0.58].filter((lx) => Math.abs(lx - dx) > 1.5);
  slots.forEach((lx, k) => wins.push(win(lx, wy, "f", H.warm && k === 0 ? "warm" : "plain")));
  if (q > 0.6) { win(-hz * 0.25, wy, "s", "plain"); }
  if (wh > 3.5 && q > 0.6) Bd.box(...(() => { const p = P(0, 0, hz + 0.03); return [p[0], g + 2.7, p[2]]; })(), 0.5, 0.7, 0.1, rot, { side: dark, top: dark }, { noTop: true });
  if (q > 0.6) for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) { const qq = { side: mul3(stone, 0.9 + 0.15 * hv(sd * 9 + k, 30)), top: stone }, wq = 0.5 + 0.25 * (k % 2); const [qx, , qz] = P(sg * (hx - wq / 2 + 0.06), 0, hz + 0.02); Bd.box(qx, g + k * 0.62 - 0.1, qz, wq, 0.54, 0.4, rot, qq, {}); }
  // oleander and a vine at some doors
  if (hv(sd, 40) < 0.55 && q > 0.6) { const [bx, , bz] = P(dx + (hv(sd, 41) < 0.5 ? -1.3 : 1.3), 0, hz + 0.7); bush(Bd, bx, g, bz, 0.65, sd * 3 + 5, 90); for (let k = 0; k < 9; k++) { const a = hv(sd * 9 + k, 42) * TAU, r = 0.6 * hv(sd * 9 + k, 43); const px = bx + Math.cos(a) * r, pz = bz + Math.sin(a) * r, py = g + 0.35 + 0.5 * hv(sd * 9 + k, 44), pk = rgb("#e0709c"); Bd.tri([px, py, pz], [px + 0.05, py, pz + 0.02], [px + 0.02, py + 0.06, pz + 0.04], pk, { n: [0, 0.6, 0.8], k: 1.3 }); } }
  fp.push({ cx: x, cz: z, rot, hx: hx + 0.1, hz: hz + 0.1, base: g, top: y1 });
  if (H.warm) Wn.push({ win: wins[0], y: wy, g });
}
// cypress: a dark flame of eight-sided rings with a ragged edge
function cypress(B, x, z, h, seed) {
  const y0 = groundH(x, z) - 0.2, R = h * 0.075 * (0.9 + 0.25 * hv(seed, 1)), rings = 12, sides = 10, P = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings, rad = r === rings ? 0.02 : R * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.9)), 0.62) * (0.8 + 0.4 * hv(seed * 13 + r, 2)), ring = [];
    for (let j = 0; j < sides; j++) { const a = (j / sides) * TAU + t * 0.9, rr = rad * (0.82 + 0.36 * hv(seed * 131 + r * 9 + j, 3)); ring.push([x + Math.cos(a) * rr + 0.08 * Math.sin(t * 5 + seed) * t * h * 0.1, y0 + t * h, z + Math.sin(a) * rr, [Math.cos(a), 0.25, Math.sin(a)]]); }
    P.push(ring);
  }
  const dk = rgb("#1b4632"), lt = rgb("#3a7a50");
  for (let r = 0; r < rings; r++) for (let j = 0; j < sides; j++) {
    const j2 = (j + 1) % sides, a = P[r][j], b = P[r][j2], c2 = P[r + 1][j2], d2 = P[r + 1][j], cv = (q, rr) => mix3(dk, lt, clamp(0.22 * (rr / rings) + 0.75 * fbm(q[0] * 0.9 + seed, q[2] * 0.9 + q[1] * 0.45, 4, 3) - 0.1));
    B.quad(a.slice(0, 3), b.slice(0, 3), c2.slice(0, 3), d2.slice(0, 3), [cv(a, r), cv(b, r), cv(c2, r + 1), cv(d2, r + 1)], { ns: [norm3(a[3]), norm3(b[3]), norm3(c2[3]), norm3(d2[3])], ao: [0.7, 0.7, 1, 1], sw: [0.0, seed] });
  }
}
// round tree: overlapping lumpy balls on a trunk, moon on the tops, a few pink blossoms
function roundTree(B, x, z, h, seed, blossom) {
  const y0 = groundH(x, z) - 0.2, trunk = rgb("#5a4634");
  tube(B, [[x, y0, z], [x + 0.1, y0 + h * 0.3, z], [x, y0 + h * 0.55, z + 0.05]], 0.22, 0.12, 6, () => trunk, { seg: 4 });
  const dk = rgb("#244f30"), lt = rgb("#4f8a46");
  for (let b = 0; b < 5; b++) {
    const a = hv(seed, b + 10) * TAU, r = b === 0 ? 0 : h * 0.22 * hv(seed, b + 20), cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r, cy = y0 + h * (0.62 + 0.16 * hv(seed, b + 30)), rad = h * (0.26 + 0.1 * hv(seed, b + 40));
    const geo = new THREE.IcosahedronGeometry(1, 2), pa = geo.attributes.position, V = [];
    for (let i = 0; i < pa.count; i++) { const dd = norm3([pa.getX(i), pa.getY(i), pa.getZ(i)]), rr = rad * (1 + 0.34 * (vn(dd[0] * 3.5 + seed + b, dd[2] * 3.5 + dd[1] * 2.5, b) - 0.5) + 0.1 * (vn(dd[0] * 9 + b, dd[2] * 9 + dd[1] * 7, seed) - 0.5)); V.push([cx + dd[0] * rr, cy + dd[1] * rr * 0.85, cz + dd[2] * rr, dd]); }
    for (let f = 0; f < V.length / 3; f++) { const a2 = V[f * 3], b2 = V[f * 3 + 1], c2 = V[f * 3 + 2], cc = [a2, b2, c2].map((q) => mix3(dk, lt, clamp(0.15 + 1.1 * vn(q[0] * 0.9 + seed, q[2] * 0.9 + q[1] * 0.7, b) + 0.2 * (q[3][1])))); B.tri(a2.slice(0, 3), b2.slice(0, 3), c2.slice(0, 3), cc, { ns: [a2[3], b2[3], c2[3]], ao: [1, 1, 1] }); }
    if (blossom) for (let k = 0; k < 14; k++) { const dd = norm3([hv(seed * 9 + b * 30 + k, 6) - 0.5, hv(seed * 9 + b * 30 + k, 7) * 0.6, hv(seed * 9 + b * 30 + k, 8) * 0.6 + 0.3]), p = [cx + dd[0] * rad * 1.02, cy + dd[1] * rad * 0.9, cz + dd[2] * rad * 1.02]; B.tri(p, [p[0] + 0.14, p[1] + 0.02, p[2]], [p[0] + 0.05, p[1] + 0.15, p[2] + 0.04], mix3(rgb("#e0709c"), rgb("#f4c0d4"), hv(seed + k, 9)), { n: dd, k: 1.3 }); }
  }
}
// ================================================================================================================ the temple
function buildTemple(Bm, Bt, Bd, fp) {
  const { x, z, rot, g } = TEMPLE, c = Math.cos(rot), s = Math.sin(rot), P = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c], marble = rgb("#e4e9ee"), warm = rgb("#d9d6c8"), shadeM = rgb("#aeb8c8"), ref = [x, g + 3, z];
  // steps: three courses, 13.9 x 23.9 at the foot
  for (let k = 0; k < 3; k++) { const w = 13.9 - 0.45 * 2 * k, d = 23.9 - 0.45 * 2 * k; Bm.box(x, g + 0.2 * k - 0.1, z, w, 0.3, d, rot, { side: mix3(marble, warm, 0.2 * k), top: marble }, {}); }
  fp.push({ cx: x, cz: z, rot, hx: 6.95, hz: 11.95, base: g, top: g + 0.55 });
  const y0 = g + 0.6, CH = 4.6, CR0 = 0.5, CR1 = 0.38, cols = [];
  const col = (lx, lz, seed) => {
    const sides = 16, rings = 7, base = P(lx, y0, lz);
    for (let r = 0; r < rings; r++) for (let j = 0; j < sides; j++) {
      const t0 = r / rings, t1 = (r + 1) / rings, rad = (t) => lerp(CR0, CR1, t) * (1 + 0.04 * Math.sin(t * 3.1)), a0 = (j / sides) * TAU, a1 = ((j + 1) / sides) * TAU;
      const pt = (t, a) => [base[0] + Math.cos(a) * rad(t), y0 + t * CH, base[2] + Math.sin(a) * rad(t)], nm = [Math.cos((a0 + a1) / 2), 0.05, Math.sin((a0 + a1) / 2)];
      const fl = j % 2 ? 0.88 : 1.02, drum = (r % 2 ? 0.97 : 1.03) * (0.96 + 0.07 * hv(seed * 40 + r * 17 + j, 1));
      Bm.quad(pt(t0, a0), pt(t0, a1), pt(t1, a1), pt(t1, a0), mix3(marble, warm, 0.25 * hv(seed * 9 + r, 2)), { n: nm, k: fl * drum, ao: r === 0 ? [0.75, 0.75, 1, 1] : undefined });
    }
    // echinus + abacus
    for (let j = 0; j < sides; j++) { const a0 = (j / sides) * TAU, a1 = ((j + 1) / sides) * TAU, nm = [Math.cos((a0 + a1) / 2), 0.3, Math.sin((a0 + a1) / 2)]; Bm.quad([base[0] + Math.cos(a0) * CR1, y0 + CH, base[2] + Math.sin(a0) * CR1], [base[0] + Math.cos(a1) * CR1, y0 + CH, base[2] + Math.sin(a1) * CR1], [base[0] + Math.cos(a1) * 0.62, y0 + CH + 0.22, base[2] + Math.sin(a1) * 0.62], [base[0] + Math.cos(a0) * 0.62, y0 + CH + 0.22, base[2] + Math.sin(a0) * 0.62], marble, { n: nm, k: j % 2 ? 0.9 : 1 }); }
    Bm.box(base[0], y0 + CH + 0.22, base[2], 1.28, 0.2, 1.28, rot, { side: marble, top: marble }, {});
    fp.push({ cx: base[0], cz: base[2], rot, hx: 0.55, hz: 0.55, base: y0, top: y0 + CH });
  };
  let sdc = 0;
  for (let i = 0; i < 6; i++) { const lx = -4.6 + i * 1.84; col(lx, 11.0 - 0.0, sdc++); col(lx, -11.0, sdc++); }
  for (let i = 1; i < 10; i++) { const lz = -10 + i * 2; col(-5.4 + 0.0, lz + 0.0, sdc++); col(5.4, lz, sdc++); }   // sides: 9 each between the corners (11 per side with the corners)
  // cella: the inner room, taller than the colonnade is wide, with a door and pilasters
  const cw = 8.2, cd = 15.6, ch = CH + 0.7;
  Bm.box(x, y0, z, cw, ch + 0.5, cd, rot, { side: marble, top: marble, front: warm }, { uvm: 0 });
  fp.push({ cx: x, cz: z, rot, hx: cw / 2, hz: cd / 2, base: y0, top: y0 + ch });
  const dk = rgb("#1a2030"); { const p = P(0, y0, cd / 2 + 0.03); Bd.box(p[0], y0, p[2], 1.8, 3.0, 0.1, rot, { side: dk, top: dk }, { noTop: true }); }
  // entablature: architrave, frieze (triglyphs + metopes), cornice, all round
  const ya = y0 + CH + 0.42, ah = 0.72, fh = 0.78, EW = 13.0, ED = 23.0;
  Bm.box(x, ya, z, EW, ah, ED, rot, { side: marble, top: marble }, { noTop: true });
  const yf = ya + ah;
  Bm.box(x, yf, z, EW - 0.15, fh, ED - 0.15, rot, { side: mix3(marble, shadeM, 0.35), top: marble }, { noTop: true });
  for (const [lz, nrm] of [[ED / 2 - 0.02, 1], [-ED / 2 + 0.02, -1]]) for (let i = 0; i < 14; i++) { const lx = -EW / 2 + 0.55 + i * ((EW - 1.1) / 13), p = P(lx, yf, lz + nrm * 0.06); Bd.box(p[0], yf + 0.05, p[2], 0.34, fh - 0.1, 0.1, rot, { side: rgb("#9aa6bc"), top: rgb("#9aa6bc") }, { noTop: true }); }
  for (const [lx, nrm] of [[EW / 2 - 0.02, 1], [-EW / 2 + 0.02, -1]]) for (let i = 0; i < 25; i++) { const lz = -ED / 2 + 0.55 + i * ((ED - 1.1) / 24), p = P(lx + nrm * 0.06, yf, lz); Bd.box(p[0], yf + 0.05, p[2], 0.1, fh - 0.1, 0.34, rot, { side: rgb("#9aa6bc"), top: rgb("#9aa6bc") }, { noTop: true }); }
  const yc = yf + fh;
  Bm.box(x, yc, z, EW + 0.9, 0.28, ED + 0.9, rot, { side: marble, top: marble }, {});
  // roof: terracotta tile slopes with a pediment (front and back) and acroteria
  const ry = yc + 0.28, rh = 1.95, hw = (EW + 0.9) / 2, hd = (ED + 0.9) / 2, tc = rgb("#e29a74");
  const slope = Math.hypot(hw, rh), rr = [P(0, ry + rh, -hd), P(0, ry + rh, hd)];
  Bt.quad(P(-hw, ry, hd), P(-hw, ry, -hd), rr[0], rr[1], tc, { ref, uv: [[0, 0], [hd, 0], [hd, slope / 2.2], [0, slope / 2.2]] }); Bt.quad(P(hw, ry, -hd), P(hw, ry, hd), rr[1], rr[0], tc, { ref, uv: [[0, 0], [hd, 0], [hd, slope / 2.2], [0, slope / 2.2]] });
  Bd.box(x, ry + rh - 0.05, z, 0.34, 0.2, 2 * hd + 0.2, rot, { side: rgb("#c06a48"), top: rgb("#d88458") }, {});
  for (const sg of [1, -1]) {   // the tympanum: a recessed triangle, darker, with a row of figures
    const lz = sg * (hd - 0.12), p0 = P(-hw + 0.3, ry, lz), p1 = P(hw - 0.3, ry, lz), p2 = P(0, ry + rh - 0.22, lz);
    Bm.tri(p0, p1, p2, mix3(marble, shadeM, 0.55), { n: norm3([s * sg, 0.05, c * sg]) });
    for (let k = 0; k < 9; k++) { const t = (k + 0.5) / 9, lx = lerp(-hw + 1.1, hw - 1.1, t), fh2 = 0.7 + 0.6 * (1 - Math.abs(t - 0.5) * 2) * (0.7 + 0.4 * hv(k, 70)), p = P(lx, ry, lz + sg * 0.08); Bd.box(p[0], ry + 0.05, p[2], 0.34, fh2, 0.2, rot, { side: mix3(marble, warm, 0.4), top: marble }, {}); const hd2 = P(lx, ry + 0.05 + fh2 + 0.12, lz + sg * 0.08); Bd.box(hd2[0], hd2[1] - 0.12, hd2[2], 0.2, 0.22, 0.2, rot, { side: marble, top: marble }, {}); }
    for (const [lx, h2] of [[-hw + 0.3, 0.7], [hw - 0.3, 0.7], [0, 0.9]]) { const p = P(lx, ry + (lx === 0 ? rh - 0.3 : 0), lz + sg * 0.05); Bd.box(p[0], p[1], p[2], 0.5, h2, 0.5, rot, { side: marble, top: marble }, {}); }
    // raking cornice
    for (const [a, b] of [[p0, p2], [p2, p1]]) { Bd.tri(a, b, [a[0] + sg * s * 0.4, a[1] + 0.2, a[2] + sg * c * 0.4], marble, { n: [0, 0.9, 0.3] }); }
  }
}

// ================================================================================================================ sky
const SKY_ZEN = "#03082a", SKY_MID = "#071a50", SKY_HOR = "#12296a";
const moonTex = () => once("moon", () => {
  const S = 256, [c, g] = canvas(S, S), cx = S / 2, R = 92;
  let gr = g.createRadialGradient(cx, cx, R * 0.9, cx, cx, S / 2); gr.addColorStop(0, "rgba(210,225,255,0.55)"); gr.addColorStop(0.35, "rgba(150,180,255,0.18)"); gr.addColorStop(1, "rgba(120,150,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.save(); g.beginPath(); g.arc(cx, cx, R, 0, TAU); g.clip();
  gr = g.createRadialGradient(cx - 18, cx - 18, 10, cx, cx, R); gr.addColorStop(0, "#fffdf0"); gr.addColorStop(0.7, "#f6f0d6"); gr.addColorStop(1, "#dcd2a8"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 16; i++) {   // maria: soft grey-tan patches, each its own shape
    const x = cx + (hv(i, 1) - 0.5) * R * 1.5, y = cx + (hv(i, 2) - 0.5) * R * 1.5, r = 10 + 24 * hv(i, 3); g.fillStyle = hexA(hv(i, 4) < 0.5 ? "#a99c6c" : "#bdb283", 0.35 + 0.3 * hv(i, 5));
    g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, rr = r * (0.6 + 0.8 * hv(i * 9 + k, 6)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.fill();
  }
  for (let i = 0; i < 46; i++) {   // craters: a dark rim on one side, light on the other
    const a = hv(i, 10) * TAU, r0 = R * Math.sqrt(hv(i, 11)) * 0.95, x = cx + Math.cos(a) * r0, y = cx + Math.sin(a) * r0, r = 1.5 + 6 * Math.pow(hv(i, 12), 2);
    g.strokeStyle = "rgba(120,108,70,0.55)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0.6, 3.6); g.stroke(); g.strokeStyle = "rgba(255,252,225,0.5)"; g.beginPath(); g.arc(x, y, r, 3.8, 6.1); g.stroke();
  }
  gr = g.createRadialGradient(cx, cx, R * 0.6, cx, cx, R); gr.addColorStop(0, "rgba(120,110,70,0)"); gr.addColorStop(1, "rgba(120,110,70,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.restore();
  return ctex(c);
});
const cloudTex = (seed, wide) => once("cloud" + seed, () => {
  const W = 512, H = wide ? 160 : 320, [c, g] = canvas(W, H), n = wide ? 26 : 40, puffs = [];
  for (let i = 0; i < n; i++) {
    const u = hv(seed * 100 + i, 1), x = 30 + u * (W - 60), band = wide ? H * 0.5 + Math.sin(u * 5 + seed) * H * 0.16 : H * 0.62 - 40 * Math.pow(Math.abs(u - 0.5) * 2, 2), y = band + (hv(seed * 100 + i, 2) - 0.5) * H * (wide ? 0.34 : 0.55), r = (wide ? 7 : 12) + (wide ? 20 : 38) * Math.pow(hv(seed * 100 + i, 3), 1.7);
    puffs.push([x, y, r]);
  }
  puffs.sort((a, b) => a[1] - b[1]);   // far-up puffs first, the low ones overlap them
  g.filter = "blur(1px)";
  for (const [x, y, r] of puffs) {
    const lump = [], nl = 5 + Math.floor(3 * hv(x * 7 + y, 20));
    for (let k = 0; k < nl; k++) { const t = k / (nl - 1) * 2 - 1; lump.push([x + t * r * 1.5, y - (1 - t * t) * r * 0.55 * (0.6 + 0.8 * hv(x + k, 21)), r * (0.38 + 0.4 * (1 - Math.abs(t)) * (0.7 + 0.5 * hv(x + k, 22)))]); }
    const gr = g.createLinearGradient(0, y - r * 1.1, 0, y + r * 0.4); gr.addColorStop(0, "rgba(104,134,214,0.95)"); gr.addColorStop(0.45, "rgba(40,64,140,0.95)"); gr.addColorStop(1, "rgba(14,26,72,0.95)");
    g.fillStyle = gr; g.beginPath(); for (const [lx, ly, lr] of lump) { g.moveTo(lx + lr, ly); g.arc(lx, ly, lr, 0, TAU); } g.moveTo(x - r * 1.9, y + r * 0.3); g.lineTo(x + r * 1.9, y + r * 0.3); g.lineTo(x + r * 1.5, y - r * 0.1); g.lineTo(x - r * 1.5, y - r * 0.1); g.closePath(); g.fill();
    g.strokeStyle = "rgba(200,218,255,0.75)"; g.lineWidth = 1.4; g.beginPath(); for (const [lx, ly, lr] of lump) { g.moveTo(lx + lr * Math.cos(-2.3), ly + lr * Math.sin(-2.3)); g.arc(lx, ly, lr, -2.3, -0.4); } g.stroke();
  }
  g.filter = "none";
  const m = g.createLinearGradient(0, 0, W, 0); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.1, "rgba(0,0,0,1)"); m.addColorStop(0.9, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)"); g.globalCompositeOperation = "destination-in"; g.fillStyle = m; g.fillRect(0, 0, W, H);
  return ctex(c);
});
function buildSky(root) {
  const u = { uMoon: { value: new THREE.Vector3(...MD) }, uTime: { value: 0 }, cZ: { value: new THREE.Color(...rgb(SKY_ZEN)) }, cM: { value: new THREE.Color(...rgb(SKY_MID)) }, cH: { value: new THREE.Color(...rgb(SKY_HOR)) } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uMoon, cZ, cM, cH; uniform float uTime; varying vec3 vD; ${NOISE}
      void main() {
        vec3 d = normalize(vD); float el = d.y;
        vec3 col = mix(cH, cM, smoothstep(0.0, 0.22, el)); col = mix(col, cZ, smoothstep(0.18, 0.75, el));
        float md = max(dot(d, uMoon), 0.0);
        col += vec3(0.0015, 0.003, 0.008) * pow(md, 4.0) + vec3(0.02, 0.035, 0.09) * pow(md, 45.0) + vec3(0.2, 0.28, 0.5) * pow(md, 420.0);
        float az = atan(d.x, -d.z); vec2 gq = vec2(az * 260.0, el * 260.0), id = floor(gq), f = fract(gq) - 0.5; float hh = h21(id);
        float st = step(0.965, hh) * smoothstep(0.38, 0.0, length(f - (vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5) * 0.5)) * (0.5 + 0.5 * h21(id + 1.7)) * smoothstep(0.02, 0.18, el) * (1.0 - smoothstep(0.0, 0.35, md * 1.2));
        col += vec3(0.8, 0.88, 1.0) * st * (0.75 + 0.25 * sin(uTime * 2.3 + hh * 90.0));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  m.userData.noOutline = true; m.userData.noHatch = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 48, 24), m); dome.renderOrder = -20; dome.frustumCulled = false; dome.userData.lookOnly = true; dome.userData.surfaceOnly = true; root.add(dome);
  const card = (tex, az, el, wDeg, hDeg, order, op = 1) => {
    const R = 6200, dir = norm3([-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)]);
    const w = 2 * R * Math.tan(wDeg * DEG / 2), h = 2 * R * Math.tan(hDeg * DEG / 2), mm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false, opacity: op });
    mm.userData.noOutline = true; mm.userData.noHatch = true;
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mm); me.position.set(dir[0] * R, dir[1] * R, dir[2] * R); me.lookAt(0, 0, 0); tex.flipY = true; me.renderOrder = order; me.frustumCulled = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true; root.add(me); return me;
  };
  card(moonTex(), MOON_AZ, MOON_VIS_EL, 8.5, 8.5, -19);
  card(cloudTex(1, true), 14, 14.5, 52, 12, -18, 0.95); card(cloudTex(2, true), -41, 11.5, 30, 8, -18, 0.9); card(cloudTex(3, true), -12, 6.2, 36, 9, -18, 0.9); card(cloudTex(4, true), 30, 7, 40, 10, -18, 0.9); card(cloudTex(5, true), -4, 21, 46, 8, -18, 0.8);
  return u;
}

// ================================================================================================================ the proximity map (foam rings): walls, columns and the shore, rendered into a data texture once
const PX = { x0: -130, z0: -150, sx: 260, sz: 180, res: 0.25 };
const enc = (h) => Math.round(clamp((h + 10) / 20) * 255);
function proxTex(fps) {
  const NX = Math.round(PX.sx / PX.res), NZ = Math.round(PX.sz / PX.res), data = new Uint8Array(NX * NZ * 4), GX = PX.sx + 1, GZ = PX.sz + 1, T = new Float32Array(GX * GZ);
  for (let j = 0; j < GZ; j++) for (let i = 0; i < GX; i++) T[j * GX + i] = groundH(PX.x0 + i, PX.z0 + j);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const fx = i * PX.res, fz = j * PX.res, ix = Math.min(GX - 2, Math.floor(fx)), iz = Math.min(GZ - 2, Math.floor(fz)), ax = fx - ix, az = fz - iz;
    const h = lerp(lerp(T[iz * GX + ix], T[iz * GX + ix + 1], ax), lerp(T[(iz + 1) * GX + ix], T[(iz + 1) * GX + ix + 1], ax), az);
    data[(j * NX + i) * 4 + 3] = enc(h);
  }
  const R = 1.7;
  for (const f of fps) {
    const c = Math.cos(f.rot), s = Math.sin(f.rot), ext = Math.max(f.hx, f.hz) + R + 0.3, i0 = Math.max(0, Math.floor((f.cx - ext - PX.x0) / PX.res)), i1 = Math.min(NX - 1, Math.ceil((f.cx + ext - PX.x0) / PX.res)), j0 = Math.max(0, Math.floor((f.cz - ext - PX.z0) / PX.res)), j1 = Math.min(NZ - 1, Math.ceil((f.cz + ext - PX.z0) / PX.res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const wx = PX.x0 + (i + 0.5) * PX.res - f.cx, wz = PX.z0 + (j + 0.5) * PX.res - f.cz, lx = wx * c - wz * s, lz = wx * s + wz * c;
      const qx = Math.max(Math.abs(lx) - f.hx, 0), qz = Math.max(Math.abs(lz) - f.hz, 0), d = Math.hypot(qx, qz), p = clamp(1 - d / R), k = (j * NX + i) * 4, v = Math.round(p * 255);
      if (v >= data[k]) { data[k] = v; data[k + 1] = enc(f.top); data[k + 2] = enc(f.base); }
    }
  }
  const t = new THREE.DataTexture(data, NX, NZ, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// ================================================================================================================ the sea
const SEA_VS = `
uniform float uTime, uLevel, uAmp; varying vec3 vP; varying float vD; varying float vH;
${WAVES}
void main() {
  vec3 p = position; vec2 g; float h = waves(p.xz, uTime, uAmp, g);
  p.y = uLevel + h; vP = p; vH = h;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); vD = length(mv.xyz); gl_Position = projectionMatrix * mv;
}`;
const SEA_FS = `
uniform float uTime, uLevel, uAmp, uFlood; uniform vec3 uMoon, uOrigin, cDeep, cShal, cSkyH, cSkyZ, cHaze; uniform sampler2D tProx; uniform vec4 uPX;
varying vec3 vP; varying float vD; varying float vH;
${NOISE}
${WAVES}
void main() {
  vec2 p = vP.xz; float t = uTime; vec2 g; float h = waves(p, t, uAmp, g);
  vec2 dn = (vec2(vn2(p * 2.1 + vec2(t * 0.35, 0.0)), vn2(p * 2.1 + vec2(7.3, 2.9) - vec2(0.0, t * 0.3))) - 0.5) * 0.3 + (vec2(vn2(p * 5.3 + t * 0.5), vn2(p * 5.3 + 3.7 - t * 0.4)) - 0.5) * 0.18;
  vec3 N = normalize(vec3(-g.x - dn.x, 1.0, -g.y - dn.y));
  vec3 V = normalize(cameraPosition - uOrigin - vP);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float fres = 0.03 + 0.97 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 5.0);
  float ry = clamp(R.y, 0.0, 1.0);
  vec3 sky = mix(cSkyH, cSkyZ, smoothstep(0.0, 0.8, ry));
  float md = max(dot(R, uMoon), 0.0);
  float lit = max(dot(N, normalize(uMoon * vec3(1.0, 0.8, 1.0))), 0.0);
  float hN = clamp(h / (0.82 * uAmp + 0.001), -1.0, 1.0);
  vec3 col = mix(cDeep, cShal, clamp(0.28 + 0.4 * hN + 1.5 * lit * lit, 0.0, 1.0));
  col += vec3(0.02, 0.07, 0.15) * lit;
  col = mix(col, sky, fres * 0.55);
  float sp = pow(md, 700.0) * 5.0 + pow(md, 220.0) * 0.35;
  float brk = 0.2 + 1.3 * vn2(vec2(p.x * 2.0 + t * 0.4, p.y * 0.6 - t * 0.3));
  col += vec3(1.0, 0.96, 0.84) * sp * brk * (0.4 + 1.0 * vn2(p * 3.1 + t * 0.6));
  // foam: crests, the rings round walls and columns, the shore
  vec2 uv = (p - uPX.xy) / uPX.zw; float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec4 tx = texture2D(tProx, uv); float prox = tx.r * inside, top = tx.g * 20.0 - 10.0, bas = tx.b * 20.0 - 10.0, terr = tx.a * 20.0 - 10.0;
  float W = uLevel, dep = W - terr;
  float lace = smoothstep(0.5, 0.64, fbm2(p * vec2(1.3, 3.2) + vec2(t * 0.2, -t * 0.12))), lace2 = smoothstep(0.46, 0.62, fbm2(p * 1.5 + vec2(-t * 0.15, t * 0.1) + 9.0));
  float crest = smoothstep(0.32 - 0.12 * uFlood, 0.75, hN + 0.45 * (fbm2(p * 0.7 + t * 0.2) - 0.5));
  float wet = step(bas - 0.15, W) * step(W, top + 0.5) * inside;
  float ring = prox * wet;
  float slap = 0.5 + 0.5 * sin(ring * 13.0 - t * 3.2 + fbm2(p * 1.3) * 6.0);
  float foam = crest * lace * (0.6 + 0.5 * uFlood) + smoothstep(0.6, 1.0, ring) + smoothstep(0.1, 0.8, ring) * lace2 * (0.3 + 0.4 * slap);
  float shore = (1.0 - smoothstep(0.0, 0.6, dep)) * inside * step(0.0, dep);
  foam += shore * lace2 * (0.5 + 0.5 * sin(dep * 14.0 - t * 2.0 + fbm2(p) * 5.0)) + smoothstep(0.12, 0.0, dep) * step(0.0, dep) * inside * 0.45;
  foam = clamp(foam, 0.0, 1.0);
  vec3 fc = mix(vec3(0.40, 0.55, 0.84), vec3(0.94, 0.97, 1.0), clamp(0.5 + 0.9 * lit + 0.25 * hN, 0.0, 1.0));
  // houses and columns seen again in the water: faint wobbling strokes toward the viewer
  float rf = 0.0;
  for (int k = 1; k < 4; k++) { vec2 q = p + vec2(0.0, float(k) * 0.9 + 0.4 * sin(p.x * 3.0 + t * 1.3 + float(k))); vec2 u2 = (q - uPX.xy) / uPX.zw; vec4 t2 = texture2D(tProx, u2); rf += t2.r * step(W, t2.g * 20.0 - 10.0) * step(0.97, t2.r) * (1.0 - float(k) / 4.0); }
  col = mix(col, vec3(0.45, 0.6, 0.82), clamp(rf, 0.0, 1.0) * 0.28 * inside * (0.4 + fres));
  col = mix(col, fc, foam);
  float f = (1.0 - exp(-pow(vD / 3500.0, 1.7))) * 0.8; col = mix(col, cHaze, clamp(f, 0.0, 1.0));
  float alpha = mix(1.0, smoothstep(0.0, 0.55, dep + 0.1 * h), inside);
  gl_FragColor = vec4(col, max(alpha, foam * 0.9));
  #include <colorspace_fragment>
}`;
function buildSea(root, prox) {
  const neg = mirrorGeo(130, 5400, 3, 1.14).map((v) => -v).reverse(), pos = mirrorGeo(130, 5400, 3, 1.14), mid = []; for (let x = -130; x < 130; x += 1.5) mid.push(x);
  const xs = [...neg.slice(0, -1), ...mid, ...pos], zf = mirrorGeo(160, 900, 3, 1.14).map((v) => -v).reverse(), zs = [...zf.slice(0, -1)]; for (let z = -160; z < 40; z += 1.5) zs.push(z); for (const z of [40, 52, 70, 100, 160, 300, 600]) zs.push(z);
  const nx = xs.length, nz = zs.length, pos3 = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos3[k] = xs[i]; pos3[k + 1] = 0; pos3[k + 2] = zs[j]; }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos3, 3)); g.setIndex(idx); g.computeBoundingSphere();
  const u = { uTime: { value: 0 }, uLevel: { value: WATER0 }, uAmp: { value: 0.7 }, uFlood: { value: 0 }, uMoon: { value: new THREE.Vector3(...MD) }, uOrigin: { value: new THREE.Vector3() }, cDeep: { value: new THREE.Color(...rgb("#0f2652")) }, cShal: { value: new THREE.Color(...rgb("#2f58a0")) }, cSkyH: { value: new THREE.Color(...rgb("#1f3466")) }, cSkyZ: { value: new THREE.Color(...rgb("#0c1a48")) }, cHaze: { value: new THREE.Color(...rgb("#101c46")) }, tProx: { value: prox }, uPX: { value: new THREE.Vector4(PX.x0, PX.z0, PX.sx, PX.sz) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SEA_VS, fragmentShader: SEA_FS, transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: false });
  m.userData.noOutline = true; m.userData.noHatch = true;
  put(root, g, m, { order: 5 }); return u;
}
// spray and mist between the walls: camera-facing lace puffs that rise and spread where the water touches a wall or column
const SPRAY_VS = `
attribute vec4 aS; attribute vec2 aB; uniform float uTime, uLevel, uAmp, uFlood; varying vec2 vUv; varying float vA;
${WAVES}
void main() {
  float age = fract(uTime * aS.z + aS.y); vec2 g; float h = waves(position.xz, uTime, uAmp, g);
  float on = step(aB.x - 0.1, uLevel) * step(uLevel, aB.y - 1.0) * smoothstep(0.05, 0.3, uFlood);
  vec3 c = vec3(position.x + 0.5 * age * sin(aS.y * 40.0), uLevel + h + 0.1 + age * (0.5 + 0.5 * aS.w), position.z + 0.6 * age * cos(aS.y * 31.0));
  vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.0); mv.xy += (uv * 2.0 - 1.0) * aS.x * (0.45 + age * 1.1);
  vUv = uv; vA = on * sin(3.14159 * age) * (0.4 + 0.3 * aS.w); gl_Position = projectionMatrix * mv;
}`;
const SPRAY_FS = `uniform sampler2D map; varying vec2 vUv; varying float vA; void main() { vec4 t = texture2D(map, vUv); float a = t.a * vA; if (a < 0.01) discard; gl_FragColor = vec4(t.rgb * vec3(0.9, 0.95, 1.0), a * 0.9);
#include <colorspace_fragment>
}`;
function buildSpray(root, fps, seaU) {
  const list = [];
  fps.forEach((f, fi) => {
    if (f.hx > 5 && f.hx < 7 && f.hz > 11) { for (let k = 0; k < 10; k++) list.push([f.cx + (hv(k, 1) - 0.5) * 12, f.cz + 11.5 + 0.5 * hv(k, 2), f.base, f.top, 1.1 + 0.6 * hv(k, 3)]); return; }
    const c = Math.cos(f.rot), s = Math.sin(f.rot), n = f.hx > 2 ? 3 : 1;
    for (let k = 0; k < n; k++) { const lx = (hv(fi * 7 + k, 4) * 2 - 1) * f.hx, lz = f.hz + 0.3, px = f.cx + lx * c + lz * s, pz = f.cz - lx * s + lz * c; list.push([px, pz, f.base, f.top, f.hx > 2 ? 0.9 + 0.5 * hv(fi * 7 + k, 5) : 0.5 + 0.25 * hv(fi * 7 + k, 5)]); }
  });
  const n = list.length, pos = new Float32Array(n * 4 * 3), uv = new Float32Array(n * 4 * 2), aS = new Float32Array(n * 4 * 4), aB = new Float32Array(n * 4 * 2), idx = [];
  list.forEach(([x, z, b, t, sz], i) => {
    const ph = hv(i, 9), rate = 0.35 + 0.3 * hv(i, 10), w = hv(i, 11);
    for (let q = 0; q < 4; q++) { const k = i * 4 + q; pos[k * 3] = x; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z; uv[k * 2] = q % 2; uv[k * 2 + 1] = q < 2 ? 0 : 1; aS.set([sz, ph, rate, w], k * 4); aB.set([b, t], k * 2); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("aS", new THREE.BufferAttribute(aS, 4)); g.setAttribute("aB", new THREE.BufferAttribute(aB, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({ uniforms: { map: { value: puffTex() }, uTime: seaU.uTime, uLevel: seaU.uLevel, uAmp: seaU.uAmp, uFlood: seaU.uFlood }, vertexShader: SPRAY_VS, fragmentShader: SPRAY_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
  m.userData.noOutline = true; m.userData.noHatch = true; put(root, g, m, { order: 8 });
}

// ================================================================================================================ the boats
// a small fishing boat, 5.2 m: planked hull (strakes with their own butt joints), thwarts, one mast, a furled sail on its yard, a net heap, baskets, a steering oar.
// local axes: x along the boat (bow +x), y up, z across. Origin: the keel's middle at the waterline.
function buildBoat(seed) {
  const B = new MB(), L = 5.2, BE = 1.7, plank = [rgb("#6a4a30"), rgb("#7b5a38"), rgb("#8a6644"), rgb("#5a3e28")], inner = rgb("#9a7650"), NS = 13, ST = 6;
  const sec = (u) => {   // cross-section points from the keel (centre) to the gunwale, one side (+z)
    const a = Math.abs(u), b = (BE / 2) * Math.pow(Math.max(0, 1 - Math.pow(a, 2.3)), 0.62), yk = -0.28 + 0.3 * Math.pow(a, 2.2), yg = 0.5 + 0.18 * u * u + (u > 0 ? 0.42 * Math.pow(u, 6) : 0.16 * Math.pow(-u, 5));
    const P = []; for (let k = 0; k <= ST; k++) { const t = k / ST; P.push([lerp(0, b, Math.pow(t, 0.8) * (0.12 + 0.88 * Math.sin(t * Math.PI / 2))), lerp(yk, yg, Math.pow(t, 1.35))]); }
    return P;
  };
  const S = []; for (let i = 0; i <= NS; i++) S.push(sec(-1 + (2 * i) / NS));
  for (let i = 0; i < NS; i++) for (let k = 0; k < ST; k++) for (const sg of [1, -1]) {
    const u0 = -1 + (2 * i) / NS, u1 = -1 + (2 * (i + 1)) / NS, a = S[i][k], b = S[i + 1][k], c = S[i + 1][k + 1], d = S[i][k + 1];
    const P3 = (u, p) => [u * L / 2, p[1], sg * p[0]], pk = Math.floor(i * 0.5 + hv(seed * 10 + k, 1) * 3) % 4, col = mix3(plank[pk], plank[(pk + 1) % 4], hv(seed * 100 + i * 7 + k, 2));
    const nmid = norm3([0, 0.5 * (k + 1) / ST, sg]);
    B.quad(P3(u0, a), P3(u1, b), P3(u1, c), P3(u0, d), mul3(col, 0.86 + 0.2 * hv(seed * 77 + i * 5 + k, 3)), { n: [0.0, 0.25 + 0.5 * k / ST, sg * (0.95 - 0.3 * k / ST)], ao: [0.82, 0.82, 1, 1] });
    // the strake seam: a thin dark line along the upper edge
    B.quad(P3(u0, d), P3(u1, c), [P3(u1, c)[0], P3(u1, c)[1] - 0.03, P3(u1, c)[2]], [P3(u0, d)[0], P3(u0, d)[1] - 0.03, P3(u0, d)[2]], mul3(plank[3], 0.55), { n: nmid });
    // inner face: a liner a little in, lighter wood, facing inward
    const I = (u, p) => [u * L / 2, p[1] + 0.03, sg * (p[0] - 0.05)];
    B.quad(I(u0, a), I(u1, b), I(u1, c), I(u0, d), mul3(inner, 0.8 + 0.3 * hv(seed * 88 + i * 3 + k, 4)), { n: [0, 0.6, -sg * 0.8] });
  }
  // gunwale rail along both sides, fore and aft posts
  for (let i = 0; i < NS; i++) for (const sg of [1, -1]) { const u0 = -1 + (2 * i) / NS, u1 = -1 + (2 * (i + 1)) / NS, a = S[i][ST], b = S[i + 1][ST]; B.quad([u0 * L / 2, a[1] + 0.02, sg * (a[0] - 0.06)], [u1 * L / 2, b[1] + 0.02, sg * (b[0] - 0.06)], [u1 * L / 2, b[1] + 0.02, sg * (b[0] + 0.05)], [u0 * L / 2, a[1] + 0.02, sg * (a[0] + 0.05)], plank[2], { n: [0, 1, 0], k: 1.15 }); }
  // the bottom boards and three thwarts
  for (let i = 0; i < NS; i++) { const u0 = -1 + (2 * i) / NS, u1 = -1 + (2 * (i + 1)) / NS, a = S[i][1], b = S[i + 1][1]; B.quad([u0 * L / 2, a[1] + 0.12, -a[0]], [u1 * L / 2, b[1] + 0.12, -b[0]], [u1 * L / 2, b[1] + 0.12, b[0]], [u0 * L / 2, a[1] + 0.12, a[0]], mul3(inner, 0.7), { n: [0, 1, 0] }); }
  for (const tx of [-1.0, 0.1, 1.15]) B.box(tx, 0.22, 0, 0.3, 0.07, BE * 0.8, 0, { side: plank[2], top: mul3(plank[1], 1.1) }, {});
  // the mast, the yard with the furled sail lashed along it, the stays
  const mx = 0.55, mastH = 3.5, tubeC = (c) => () => c;
  tube(B, [[mx, 0.1, 0], [mx, mastH * 0.5, 0], [mx + 0.02, mastH, 0]], 0.065, 0.04, 8, tubeC(rgb("#8a6a48")), { seg: 4 });
  B.box(mx, 0.2, 0, 0.34, 0.16, 0.34, 0, { side: plank[0], top: plank[1] }, {});
  const yc = [mx + 0.05, mastH - 0.5, 0];
  tube(B, [[yc[0] - 0.1, yc[1] - 0.12, -1.7], [yc[0], yc[1], 0], [yc[0] - 0.1, yc[1] - 0.12, 1.7]].map(([a, b, c]) => [a, b + 0.0, c]), 0.04, 0.04, 6, tubeC(rgb("#7a5a3a")), { seg: 6 });
  tube(B, [[yc[0] - 0.02, yc[1] - 0.2, -1.6], [yc[0] + 0.03, yc[1] - 0.12, 0], [yc[0] - 0.02, yc[1] - 0.2, 1.6]], 0.115, 0.115, 8, (k, j) => mix3(rgb("#dcd2b8"), rgb("#bdb094"), 0.5 * hv(j + seed, 5) + 0.3 * Math.sin(k * 40) ** 2), { seg: 8 });
  for (let k = 0; k < 7; k++) { const z = -1.4 + k * 0.47; B.box(yc[0] + 0.0, yc[1] - 0.34, z, 0.28, 0.28, 0.07, 0, { side: rgb("#6a5238"), top: rgb("#6a5238") }, {}); }
  const line = (a, b, c) => { const dd = norm3(sub3(b, a)), p = norm3(cross(dd, [0, 0, 1])); const q = sc3(p, 0.012); B.quad(sub3(a, q), add3(a, q), add3(b, q), sub3(b, q), c, { n: [0, 0.4, 0.9] }); };
  line([mx, mastH - 0.05, 0], [L / 2 - 0.1, 0.9, 0], rgb("#a09070")); line([mx, mastH - 0.05, 0], [-L / 2 + 0.2, 0.7, 0], rgb("#a09070"));
  // net heap and two baskets, a coil of rope, the steering oar
  for (let k = 0; k < 14; k++) { const a = hv(seed * 9 + k, 6) * TAU, r = 0.3 * Math.sqrt(hv(seed * 9 + k, 7)), x = -1.65 + Math.cos(a) * r, z = 0.15 + Math.sin(a) * r * 0.8, y = 0.26 + 0.18 * (1 - r / 0.3) * hv(seed * 9 + k, 8); B.tri([x - 0.13, y, z - 0.08], [x + 0.13, y, z + 0.1], [x, y + 0.14, z], mix3(rgb("#7f7a62"), rgb("#a49e82"), hv(seed * 9 + k, 9)), { n: [0, 1, 0.3] }); }
  for (const [bx, bz] of [[1.55, 0.3], [1.3, -0.35]]) { const bc = rgb("#8c6a3a"); for (let j = 0; j < 8; j++) { const a0 = (j / 8) * TAU, a1 = ((j + 1) / 8) * TAU; B.quad([bx + Math.cos(a0) * 0.18, 0.16, bz + Math.sin(a0) * 0.18], [bx + Math.cos(a1) * 0.18, 0.16, bz + Math.sin(a1) * 0.18], [bx + Math.cos(a1) * 0.23, 0.46, bz + Math.sin(a1) * 0.23], [bx + Math.cos(a0) * 0.23, 0.46, bz + Math.sin(a0) * 0.23], mix3(bc, rgb("#a8864c"), j % 2 * 0.4), { n: [Math.cos((a0 + a1) / 2), 0.1, Math.sin((a0 + a1) / 2)] }); } }
  tube(B, [[-L / 2 + 0.5, 0.9, 0.0], [-L / 2 - 0.5, 0.5, 0.2], [-L / 2 - 1.5, -0.45, 0.35]], 0.04, 0.025, 6, tubeC(rgb("#8a6a48")), { seg: 4 });
  B.quad([-L / 2 - 1.15, -0.1, 0.33], [-L / 2 - 1.75, -0.7, 0.33], [-L / 2 - 1.75, -0.7, 0.45], [-L / 2 - 1.15, -0.1, 0.45], rgb("#8a6a48"), { n: [0, 0.3, 0.9] });
  return B.geo();
}
function buildBoats(U, root) {
  const boats = [];
  const defs = [{ a: [13, -14.5], b: [-6, -36.5], yaw0: 0.5, yaw1: -0.3, s: 1 }, { a: [33, -15.5], b: [18, -36.5], yaw0: -0.35, yaw1: 0.35, s: 2 }];
  for (const d of defs) {
    const grp = new THREE.Group(), me = put(grp, buildBoat(d.s), wmat(U, { wet: true }), { order: 3 }); me.scale.setScalar(1.35); root.add(grp); boats.push({ grp, d });
  }
  return boats;
}
function poseBoats(boats, t, fl, amp, level) {
  for (const { grp, d } of boats) {
    const k = sstep(0, 1, fl), x = lerp(d.a[0], d.b[0], k) + 0.7 * Math.sin(t * 0.31 + d.s) , z = lerp(d.a[1], d.b[1], k) + 0.5 * Math.cos(t * 0.27 + d.s * 2), yaw = lerp(d.yaw0, d.yaw1, k) + 0.08 * Math.sin(t * 0.4 + d.s);
    const c = Math.cos(yaw), s = Math.sin(yaw), h = (px, pz) => waveJS(px, pz, t, amp);
    const hc = h(x, z), hb = h(x + c * 2.2, z - s * 2.2), hs2 = h(x - c * 2.2, z + s * 2.2), hp = h(x + s * 0.8, z + c * 0.8), hq = h(x - s * 0.8, z - c * 0.8);
    grp.position.set(x, level + hc * 0.8 + 0.5, z); grp.rotation.set(0, 0, 0); grp.rotation.order = "YZX";
    grp.rotation.y = yaw; grp.rotation.z = Math.atan2(hb - hs2, 4.4) * 0.9; grp.rotation.x = Math.atan2(hp - hq, 1.6) * 0.7;
  }
}

// ================================================================================================================ the kind
const helike = (P) => {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root);
  const U = makeU(), qual = clamp(S.detail ?? 1, 0.2, 1.5);
  const skyU = buildSky(root);
  buildTerrain(U, root);
  buildGrass(U, root, qual);
  buildFoliage(U, root, qual);
  buildOlive(U, root, qual);
  // the town
  const Bp = new MB(), Bt = new MB(), Bd = new MB(), Bm = new MB(), Bc = new MB(), fps = [], Wn = [];
  const H = houses();
  for (const h of H) buildHouse(Bp, Bt, Bd, Wn, h, fps);
  buildTemple(Bm, Bt, Bd, fps);
  for (let i = 0; i < 34; i++) {
    const row = ROWS[i % 4], x = -100 + 205 * hv(i, 50), z = row.z + 9 + 10 * hv(i, 51) * (i % 2 ? -1 : 1) - 4;
    if (Math.abs(x - 8) < 9 && z > -42 || fps.some((f) => Math.hypot(x - f.cx, z - f.cz) < Math.max(f.hx, f.hz) + 2.2) || (x > TEMPLE.x - 10 && x < TEMPLE.x + 10 && z < TEMPLE.z + 14 && z > TEMPLE.z - 14)) continue;
    if (i % 3) cypress(Bc, x, z, 8 + 5 * hv(i, 53), i); else roundTree(Bc, x, z, 4.8 + 2.4 * hv(i, 54), i, hv(i, 55) < 0.4);
  }
  for (let i = 0; i < 130; i++) {   // the slope behind the town: more cypresses and trees, small and dark
    const x = -240 + 520 * hv(i, 60), z = -118 - 420 * Math.pow(hv(i, 61), 1.3);
    if (i % 4) cypress(Bc, x, z, 9 + 5 * hv(i, 62), 200 + i); else roundTree(Bc, x, z, 6 + 3 * hv(i, 63), 200 + i, false);
  }
  const mP = wmat(U, { map: plasterTex(), wet: true }), mT = wmat(U, { map: tileTex(), wet: true }), mD = wmat(U, { wet: true }), mS = wmat(U, { wet: true, sway: true });
  put(root, Bp.geo(), mP, { order: 2 }); put(root, Bt.geo(), mT, { order: 2 }); put(root, Bd.geo(), mD, { order: 2 }); put(root, Bm.geo(), mD, { order: 2 }); put(root, Bc.geo(), mS, { order: 2 });
  // the far hill town: small white blocks with tile tops on the first foothills
  { const Bf = new MB(); for (let i = 0; i < 90; i++) { const left = i % 2, x = left ? -330 + 230 * hv(i, 70) : 90 + 320 * hv(i, 70), z = -560 - 240 * hv(i, 71) - 30 * Math.sin(x * 0.02), g = groundH(x, z), w = 7 + 6 * hv(i, 72), hgt = 5 + 3 * hv(i, 73); Bf.box(x, g - 1.2, z, w, hgt + 1.2, w * 0.8, (hv(i, 74) - 0.5) * 0.6, { side: mul3(rgb("#e8e6dc"), 1), top: rgb("#c2603c") }, {}); Bf.box(x, g - 1.2 + hgt + 1.2, z, w + 1, 0.8, w * 0.8 + 1, 0, { side: rgb("#b4522f"), top: rgb("#d2703e") }, {}); } put(root, Bf.geo(), wmat(U, {}), { order: 2 }); }
  // warm windows: five, each goes dark when the water reaches it
  const wins = Wn.map(({ win: [cx, wy, cz, yaw], y }) => {
    const grp = new THREE.Group(), B2 = new MB(), warm = rgb("#ffb458"), hot = rgb("#fff0b8");
    B2.box(cx, wy, cz, 0.78, 1.0, 0.12, yaw, { side: warm, top: warm }, { noTop: true, flat: true });
    B2.box(cx, wy + 0.1, cz, 0.4, 0.5, 0.14, yaw, { side: hot, top: hot }, { noTop: true, flat: true });
    B2.box(cx, wy, cz, 0.05, 1.0, 0.16, yaw, { side: rgb("#3a2a1c"), top: rgb("#3a2a1c") }, { noTop: true, flat: true }); B2.box(cx, wy + 0.5, cz, 0.78, 0.05, 0.16, yaw, { side: rgb("#3a2a1c"), top: rgb("#3a2a1c") }, { noTop: true, flat: true });
    put(grp, B2.geo(), wmat(U, {}), { order: 3 });
    const gm = new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.85, side: THREE.DoubleSide, fog: false }); gm.userData.noOutline = true; gm.userData.noHatch = true;
    const gq = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), gm); gq.position.set(cx + Math.sin(yaw) * 0.12, wy, cz + Math.cos(yaw) * 0.12); gq.rotation.y = yaw; gq.renderOrder = 9; gq.frustumCulled = false; gq.userData.lookOnly = true; gq.userData.surfaceOnly = true; grp.add(gq);
    root.add(grp); return { grp, y, gm };
  });
  const prox = proxTex(fps), seaU = buildSea(root, prox);
  buildSpray(root, fps, seaU);
  const boats = S.boats === false ? [] : buildBoats(U, root);
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, fl = clamp(num(ps, S, "flood", 0)), level = WATER0 + RISE * fl, amp = (0.6 + 0.6 * fl) * (S.swell ?? 1);
      U.uTime.value = tt; U.uWater.value = level; U.uSway.value = S.wind ?? 1; skyU.uTime.value = tt;
      seaU.uTime.value = tt; seaU.uLevel.value = level; seaU.uAmp.value = amp; seaU.uFlood.value = fl; seaU.uOrigin.value.set(P.root.position.x, P.root.position.y, P.root.position.z);
      for (const w of wins) { const on = level < w.y - 0.5; w.grp.visible = on; w.gm.opacity = 0.8 + 0.1 * Math.sin(tt * 3.1 + w.y * 9); }
      poseBoats(boats, tt, fl, amp, level);
    },
  };
};
export const AT_D_HELIKE_KINDS = { helike };
