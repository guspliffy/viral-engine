import * as THREE from "three";

// props-gravruin.js: fact what-if 02 gravity v2 (20 Nov 2026): the city that comes down, the street that tears open, and the
// Moon's impact wave that wipes both away. Design: storyboards/series/facts/02-gravity/DESIGN-v2.md sections A (all), B (strike
// positions), D (erase, afterglow), "Rendering and continuity". Bench: storyboards/series/facts/02-gravity/bench/make-ruin-bench.mjs.
//
// USAGE HEADER (the director reads only this).  World metres, +y up, the window looks toward -z (room window plane z -2.65, city
// ground y -60). Place BOTH kinds at x 0, y 0, z 0, rot 0, scale 1: every number below is a world number. Look-only (not solid, no
// shadow, no ink line, unlit shader materials). Needs the storyboard key "far": 6000. Pure functions of ONE param:
//   t   clip seconds, tweened by the director: c.prop(0, id, { t: 0 }, 0, "linear"); c.prop(0, id, { t: 64 }, 64, "linear").
//       Default -1 = before everything (city intact, street whole, no dust, no fire). Every DESIGN track below is read off t with
//       the DESIGN's absolute times (table TL at the top of this file). Seeking any frame in any order gives the same picture.
// Common spec keys (both kinds, all optional): seed 26031, haze "#7a5c76" (the colour far things fade to).
//
//   gruin      The city and its ground (replaces gcity and gstreet's ground in this clip; keep ghorizon and gtower).
//      Buildings: the 136 mid-city IDs 0..135 (8 blocks of 7 in z -85..-320, 10 blocks of 8 in z -320..-1950, a jittered 4 x 2
//      grid per block, footprints 9-34 x 10-40, heights 16-63, towers 76-112 m on IDs 7 12 15 19 23 27 32 37 43 49 57 65), the 14
//      flank shells beside the long street (x -16..-45 / 7..36, z -23..-80, ids 300+), and spec.infill (default 1, 0 = none)
//      about 110 extra low-detail buildings (ids 136+) in the gaps so the skyline is as dense as the v1 city (136 alone leaves
//      holes in P1). Facades 28 % lit (#FFC185 / #C17F62), floor bands and bays painted in the shader; three diffuse bands.
//      collapse = P(23,28): per building c = P((collapse - s)/(e - s)), s = .02+.15u far rows, .10+.15u near rows, .03+.12u the
//      towers, shells .12+.09u, e = s+.50+.23u (shells s+.53); floors crush bottom-up (one floor per 1/n of c, the active floor
//      closes linearly), the stack drops, towers tip 18-30 deg at c .5 and 48 deg at .82 (IDs 7 15 23 32 43 57 to -x, 12 19 27
//      37 49 65 to +x), infill 4-9 deg, shells tip toward the street; lights to zero; rubble .06-.13 H over 1.25 x footprint.
//      Dust sea: 120 clusters (78 billow clusters of 2 sprites + 42 rolls in three staggered rows that advance 0/22/64 m toward the
//      room), 0 / 72 / 120 visible at collapse 0 / .5 / 1, radii 12 -> 25 m, crest y -35 -> -25, opacity .75 -> .85; each tower
//      throws a 2-sprite dust puff every 4th floor. Strike holes: from T+.1 at (-22,-335) D 104, (102,-585) D 72, (-175,-820) D 86
//      every building / rubble within .46 D vanishes, a dark crater floor (#281F27 / #37252D) with a raised rubble rim is laid.
//      Wave (D): erase = P(56 + d/760, +.24), d = planar distance to (-52,-2500): .5 = orange ground #C44F32, rubble squashed to .35,
//      lights and fire off; 1 = everything above ground gone, scorched ground #37252D with fissures #CC5937 (afterglow gain 1 /
//      .69 / .25 over t 56..60.5), old dust gone. The fire wall itself is another builder's prop.
//      spec: dust 1 (0..1 multiplies dust opacity), infill 1, hole 1 (1 = the ground has holes where grupture lies; set 0 only
//      when grupture is not placed), puffScale 2.6 (the DESIGN's puff radii x this), dustSize 1 (multiplies every sprite size).
//      Origin: world. Ground: x +-3500, z -3200..30 (past the design's -2300 so the contact point at z -2500 is on it), fades to haze.
//   grupture   The street on x -5 (carriageway x -11..1, 4 m sidewalks, z -12..-182) with the 18 m cross street on z -44 (x -60..60):
//      asphalt #403B42, concrete #8D7C73, paint #BAA48B, rock #46383C, cut edges #281F27. about 30 independent slabs (15 a side, bevel
//      strips on every cut edge) around the main fracture (-6,-16) (-4,-28) (-8,-37) (-4,-45) (-6,-62) (-3,-83) (-7,-112) (extended
//      to z -12 and -182), 6 of the cuts are branches with wider openings. street = P(28.0,30.2) (director; design 24.1-28.5): gap 0 / .8 / 2.8-5.4 m, lip offset
//      0 / .28 / 1.25 m, alternate slabs pressed down, visible depth 7 m (floor y -67). 16 vehicles 3.8-4.8 x 1.7-2.0 x 1.3-1.7 on lanes
//      z -19..-77 ride their slab, roll 0 / 12 / 28 deg toward the fissure, hull height 1 / .55 / .16; the nearest car is at (-8.5,-25).
//      streetFire = P(28.6,31.0) (director; design 26.1-29.3): 0 / 6 / 10 fire clusters beside damaged cars (flame height 0 / 1.2 / 2.8, smoke 0 / 3.4 / 10, fireCycle
//      period .46 s), flames #FFF1B4 / #FFAB52 / #D95831, smoke #635257 / #A88C82. Same wave erase as gruin. Stays until the wave.
//      spec: fire 1 (0 = no fire), hole 1 (1 = a scorched fill plane replaces the road where the wave has passed).
//      Origin: world. Draw: opaque road, then transparent sprites (depth tested against the asphalt).
//   Cost: gruin ~28k triangles + ~330 sprites (198 dust + tower puffs; only the visible ones rasterise), grupture ~4.8k triangles + 60 sprites
//   (measured ~0.1 s per 720x1280 still for both together); every
//   animation is in the vertex shader (no per-frame geometry work, no allocation, no per-particle lights, no shadows).

const SEED = 26031, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const fr = (x) => x - Math.floor(x);
const Pk = (a, b, t) => clamp((t - a) / (b - a));
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const V3 = (hex) => new THREE.Vector3(...lin(hex));
const tri = (x) => Math.abs(x - Math.floor(x) - 0.5) * 2;
const HAZE = "#7a5c76";

// ---- the DESIGN's absolute times (one table; the shaders get the same numbers as uniforms or constants)
const TL = {
  collapse: [23, 28], street: [28.0, 30.2], streetFire: [28.6, 31.0],   // director (Sol r1 item 12): the tear happens IN the street shot (28-30.3), not before it
  waveT0: 56, waveV: 760, waveBand: 0.24, contact: [-52, -2500], afterglow: [56, 60.5],
  strikes: [{ T: 36.0, x: -22, z: -335, D: 104 }, { T: 36.36, x: 102, z: -585, D: 72 }, { T: 37.22, x: -175, z: -820, D: 86 }],
};
const AX = -5;   // street axis x
const FRAC = [[-6, -12], [-6, -16], [-4, -28], [-8, -37], [-4, -45], [-6, -62], [-3, -83], [-7, -112], [-5, -140], [-6, -182]];
const Cx = (z) => { for (let i = 1; i < FRAC.length; i++) if (z >= FRAC[i][1] || i === FRAC.length - 1) { const [x0, z0] = FRAC[i - 1], [x1, z1] = FRAC[i]; return lerp(x0, x1, clamp((z - z0) / (z1 - z0))); } return -6; };
const jagC = (z) => (tri(z * 0.37 + 0.2) - 0.5) * 0.95 + (tri(z * 1.31 + 0.6) - 0.5) * 0.55 + (tri(z * 3.1) - 0.5) * 0.22;
const HERO = [7, 12, 15, 19, 23, 27, 32, 37, 43, 49, 57, 65], HERO_LEFT = new Set([7, 15, 23, 32, 43, 57]);
const Ldir = new THREE.Vector3(-0.58, 0.40, -0.71).normalize();

// ---------------------------------------------------------------------------------------------------- shared GLSL
const GL_COMMON = `
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float sst(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
uniform float uT; uniform vec2 uContact;
float eraseAt(vec2 p){ return clamp((uT - (56. + length(p - uContact) / 760.)) / .24, 0., 1.); }
`;
const GL_FRAG_COMMON = `
uniform vec3 uHaze, uL, uOrange, uScorch, uFiss; uniform float uHzK, uHzMax, uAfter;
float bandOf(float nl){ return nl < .18 ? .5 : (nl < .58 ? .76 : 1.); }
vec3 tintOf(float g){ return mix(vec3(.82, .88, 1.05), vec3(1.22, .95, .72), clamp((g - .5) * 2., 0., 1.)); }
vec3 hazeIt(vec3 c, float d){ float glw = smoothstep(.2, .6, max(c.r, c.g)); float hz = uHzMax * (1. - exp(-d * uHzK)); return mix(c, uHaze, hz * (1. - .6 * glw)); }
// the wave's surface: base -> orange (.5) -> scorched with glowing fissures (1)
vec3 scorchOf(vec3 base, vec2 p, float er){
  if (er <= 0.) return base;
  float n = vn(p / 52.) * .62 + vn(p / 15. + 7.3) * .38, rid = 1. - smoothstep(0., .028, abs(n - .5));
  float k2 = vn(p / 6. + 3.1); vec3 sc = uScorch * (.7 + .6 * k2);
  vec3 col = er < .5 ? mix(base, uOrange * (.8 + .4 * k2), er * 2.) : mix(uOrange * (.8 + .4 * k2), sc, (er - .5) * 2.);
  return col;
}
vec3 fissOf(vec2 p, float er){
  if (er <= .5) return vec3(0.);
  float n = vn(p / 52.) * .62 + vn(p / 15. + 7.3) * .38, rid = 1. - smoothstep(0., .028, abs(n - .5));
  return uFiss * rid * sst(.55, 1., er) * uAfter * 1.7;
}
`;
function baseU(S) {
  return {
    uT: { value: -1 }, uCol: { value: 0 }, uSt: { value: 0 }, uSF: { value: 0 }, uAfter: { value: 1 }, uDust: { value: S.dust ?? 1 },
    uContact: { value: new THREE.Vector2(...TL.contact) },
    uCr: { value: TL.strikes.map((s) => new THREE.Vector4(s.x, s.z, 0.46 * s.D, s.T)) },
    uHaze: { value: V3(S.haze || HAZE) }, uHzK: { value: 0.0007 }, uHzMax: { value: 0.88 },
    uL: { value: Ldir.clone() }, uLitA: { value: V3("#FFC185") }, uLitB: { value: V3("#C17F62") },
    uOrange: { value: V3("#C44F32") }, uScorch: { value: V3("#37252D") }, uFiss: { value: V3("#CC5937") },
  };
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; m.fog = false; return m; };
const lookOnly = (o, order) => { o.castShadow = o.receiveShadow = false; o.frustumCulled = false; o.userData.solid = false; o.userData.lookOnly = true; o.userData.steam = true; o.renderOrder = order ?? 0; return o; };
const COLORSPACE = "#include <colorspace_fragment>";
function shaderMat(U, extra, vs, fs, o = {}) {
  return noLine(new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, ...o }));
}

// ---------------------------------------------------------------------------------------------------- textures
function cv(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; }
function ctex(c, { repeat = false, aniso = 4 } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const memo = new Map(), once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
// three billow sprites side by side (64 x 64 each): lobes in grey (top light, bottom dark), alpha soft, empty near the bottom edge
function billowTex() {
  return once("billow", () => ctex(cv(192, 64, (g) => {
    const R = rngOf(SEED + 401);
    for (let v = 0; v < 3; v++) {
      const lobes = [[32, 36, 21], [17, 41, 14 + 2 * R()], [47, 40, 15 + 2 * R()], [30 + 6 * (R() - 0.5), 21, 13 + 2 * R()]];
      if (v > 0) lobes.push([40 + 4 * R(), 24 + 3 * R(), 10]);
      for (const [x, y, r] of lobes) {
        const gr = g.createRadialGradient(v * 64 + x, y, 0, v * 64 + x, y, r), lum = Math.round(255 - 105 * clamp((y + r * 0.2 - 18) / 34));
        gr.addColorStop(0, `rgba(${lum},${lum},${lum},0.95)`); gr.addColorStop(0.6, `rgba(${lum},${lum},${lum},0.62)`); gr.addColorStop(1, `rgba(${lum},${lum},${lum},0)`);
        g.fillStyle = gr; g.fillRect(v * 64 + x - r, y - r, 2 * r, 2 * r);
      }
      g.globalCompositeOperation = "destination-out";
      const fd = g.createLinearGradient(0, 40, 0, 64); fd.addColorStop(0, "rgba(0,0,0,0)"); fd.addColorStop(1, "rgba(0,0,0,0.95)"); g.fillStyle = fd; g.fillRect(v * 64, 40, 64, 24);
      g.globalCompositeOperation = "source-over";
    }
  }), { aniso: 2 }));
}
// two soft flame licks (64 x 64 each, base at the bottom edge): radial #FFF1B4 core, #FFAB52 mid, #D95831 edge, soft alpha
function flameTex() {
  return once("flame", () => ctex(cv(128, 64, (g) => {
    for (let v = 0; v < 2; v++) {
      const ox = v * 64, b = v ? -4 : 3;
      g.save(); g.filter = "blur(1.6px)";
      const gr = g.createRadialGradient(ox + 32, 50, 2, ox + 32, 46, 30); gr.addColorStop(0, "rgba(255,241,180,1)"); gr.addColorStop(0.32, "rgba(255,171,82,1)"); gr.addColorStop(0.7, "rgba(217,88,49,0.85)"); gr.addColorStop(1, "rgba(217,88,49,0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(ox + 14, 58); g.bezierCurveTo(ox + 8, 38, ox + 26, 28, ox + 32 + b, 5); g.bezierCurveTo(ox + 40, 28, ox + 56, 38, ox + 50, 58); g.quadraticCurveTo(ox + 32, 66, ox + 14, 58); g.fill(); g.restore();
    }
  }), { aniso: 2 }));
}
// the ground: blocks, streets, lamps and a few warm fire dots (linear after sampling); 1024 px = 160 m
function groundTex() {
  return once("ground", () => ctex(cv(1024, 1024, (g, W, H) => {
    const R = rngOf(SEED + 11);
    g.fillStyle = "#1c1a28"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, w = 6 + R() * 30, h = 6 + R() * 30; g.fillStyle = `rgba(${28 + R() * 20},${26 + R() * 18},${40 + R() * 18},0.7)`; g.fillRect(x, y, w, h); }
    g.fillStyle = "#2c293a"; g.fillRect(0, H / 2 - 24, W, 48); g.fillRect(W / 2 - 24, 0, 48, H); g.fillRect(0, 0, W, 14); g.fillRect(0, 0, 14, H);
    g.fillStyle = "#3a3646"; g.fillRect(0, H / 2 - 2, W, 4); g.fillRect(W / 2 - 2, 0, 4, H);
    g.fillStyle = "#4a4452"; g.fillRect(0, H / 2 - 26, W, 2); g.fillRect(0, H / 2 + 24, W, 2); g.fillRect(W / 2 - 26, 0, 2, H); g.fillRect(W / 2 + 24, 0, 2, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,${170 + Math.floor(R() * 60)},${100 + Math.floor(R() * 60)},${0.45 + R() * 0.4})`; const k = R() * W; g.fillRect(k, H / 2 - 26, 2, 2); g.fillRect(k, H / 2 + 24, 2, 2); g.fillRect(W / 2 - 26, k, 2, 2); g.fillRect(W / 2 + 24, k, 2, 2); }
    for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H, r = 3 + R() * 7, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,150,70,0.55)"); gr.addColorStop(1, "rgba(255,120,50,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  }), { repeat: true, aniso: 8 }));
}

// ---------------------------------------------------------------------------------------------------- vertex soup
class VB {
  constructor(names) { this.names = names; this.a = Object.fromEntries(names.map(([k]) => [k, []])); this.idx = []; this.n = 0; }
  v(vals) { for (const [k] of this.names) this.a[k].push(...vals[k]); return this.n++; }
  quad(i0, i1, i2, i3) { this.idx.push(i0, i1, i2, i0, i2, i3); }
  tri(i0, i1, i2) { this.idx.push(i0, i1, i2); }
  geo() {
    const g = new THREE.BufferGeometry();
    for (const [k, s] of this.names) g.setAttribute(k, new THREE.Float32BufferAttribute(this.a[k], s));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1)); return g;
  }
}
const BNAMES = [["position", 3], ["normal", 3], ["aCol", 3], ["uv", 2], ["aA", 4], ["aB", 4], ["aC", 4]];

// ====================================================================================================== the city
function genCity(S) {
  const seed = S.seed ?? SEED, out = [], rects = [];
  const rid = (id, k) => rngOf(seed + id * 7919 + k * 104729)();
  const STYLE = ["#393849", "#504657", "#5F505B"];
  const push = (id, x, z, w, d, H, o = {}) => {
    const u = rid(id, 1), hero = HERO.includes(id), shell = id >= 300 && id < 400, fill = id >= 136 && id < 300;
    const fhR = 2.8 + 0.7 * rid(id, 2), n = Math.max(3, Math.round(H / fhR)), near = z > -400;
    const nr = near || hero ? n : clamp(Math.round(n / 3), 4, 8);
    let s, e, tilt, dx, dz;
    if (shell) { s = 0.12 + 0.09 * u; e = s + 0.53; tilt = 7 + 5 * rid(id, 3); dx = Math.sign(AX - x); dz = 0.15 * (rid(id, 4) - 0.5); }
    else {
      s = hero ? 0.10 + 0.38 * u : (z < -320 ? 0.02 + 0.22 * u : 0.10 + 0.38 * u); e = Math.min(0.995, s + 0.50 + 0.23 * u);
      if (hero) { tilt = 18 + 12 * rid(id, 3); dx = HERO_LEFT.has(id) ? -1 : 1; dz = 0.28 * (rid(id, 4) - 0.5); } else { tilt = 4 + 5 * rid(id, 3); dx = rid(id, 4) < 0.5 ? -1 : 1; dz = 0.5 * (rid(id, 5) - 0.5); }
    }
    const ln = Math.hypot(dx, dz); dx /= ln; dz /= ln;
    const b = { id, x, z, w, d, H, hero, shell, fill, u, fhR, nr, fhE: H / nr, s, e, tilt, dx, dz, style: Math.floor(rid(id, 6) * 3), gain: 0.9 + 0.2 * rid(id, 7), rHalf: Math.abs(dx) * w / 2 + Math.abs(dz) * d / 2, near };
    out.push(b); rects.push({ x, z, w, d }); return b;
  };
  // mid city IDs 0..55 (8 blocks of 7, 4 rows) and 56..135 (10 blocks of 8, 5 rows)
  const block = (b0, count, row, sd, rowDepth, zTop, lIn, lOut, capD, ids) => {
    const Rb = rngOf(seed + b0 * 131 + 9), cw = (lOut - lIn) / 4, dc = rowDepth / 2;
    const heroes = ids.filter((i) => HERO.includes(i)), others = ids.filter((i) => !HERO.includes(i)), cell = new Map();
    heroes.forEach((i, k) => cell.set(i, k));
    const free = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => !heroes.some((h, k) => k === c)); for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(Rb() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    others.forEach((i, k) => cell.set(i, free[k]));
    for (const id of ids) {
      const c = cell.get(id), col = c >> 1, rz = c & 1, hero = HERO.includes(id), R = (k) => rid(id, 20 + k);
      const w = Math.max(9, Math.min(hero ? 24 + 10 * R(0) : 9 + 25 * R(0), cw - 3)), d = Math.max(10, Math.min(hero ? 20 + 12 * R(1) : 10 + 30 * R(1), dc - 3, capD));
      const l = lIn + (col + 0.5) * cw + (cw - w) / 2 * (R(2) * 2 - 1) * 0.8, z = zTop - (rz + 0.5) * dc + (dc - d) / 2 * (R(3) * 2 - 1) * 0.8;
      const H = hero ? 76 + 36 * R(4) : 16 + 47 * Math.pow(R(4), 0.9);
      push(id, AX + sd * l, z, w, d, H);
    }
  };
  for (let b = 0; b < 8; b++) { const row = b >> 1, Rb = rngOf(seed + b * 17 + 5); block(b, 7, row, b & 1 ? 1 : -1, 58.75, -85 - row * 58.75, 18 + 6 * Rb(), 96 + 14 * row + 16 * Rb(), 40, Array.from({ length: 7 }, (_, k) => b * 7 + k)); }
  for (let b = 0; b < 10; b++) { const row = b >> 1, Rb = rngOf(seed + b * 23 + 41), lc = 180 + 100 * row + 80 * Rb(); block(8 + b, 8, row, b & 1 ? 1 : -1, 326, -320 - row * 326, lc - 100, lc + 100, 40, Array.from({ length: 8 }, (_, k) => 56 + b * 8 + k)); }
  // the 14 flank shells beside the long street: inner column (3 a side) and outer column (4 a side)
  const shells = [[-27, 7], [-63, 10], [-74, 10.5], [-25, 8], [-61, 10], [-70, 9], [-79, 9]];
  let sid = 300;
  for (const side of [-1, 1]) shells.forEach(([z, d], k) => {
    const inner = k < 3, R = (q) => rid(sid, 30 + q), w = 10 + 4 * R(0), xin = inner ? (side < 0 ? 16 + 5 * R(1) : 7 + 5 * R(1)) : (side < 0 ? 32 + 4 * R(1) : 23 + 4 * R(1));
    push(sid++, side < 0 ? -xin - w / 2 : xin + w / 2, z, w, d, 22 + 24 * R(2));
  });
  // infill: extra low-detail buildings in the gaps (no overlap with anything, none on the street, the near tower or the shells)
  if ((S.infill ?? 1) > 0) {
    const R = rngOf(seed + 777); rects.push({ x: 9.7, z: -49.5, w: 14, d: 13 });
    const fits = (x, z, w, d, m = 4) => !rects.some((r) => Math.abs(r.x - x) < (r.w + w) / 2 + m && Math.abs(r.z - z) < (r.d + d) / 2 + m);
    let id = 136, tries = 0, got = 0; const N = 110;
    while (got < N && tries++ < N * 80) {
      const u = R(), z = -(90 * Math.pow(1950 / 90, Math.pow(u, 0.8))), x = (R() * 2 - 1) * (0.42 * Math.abs(z) + 70);
      if (z > -200 && Math.abs(x - AX) < 24) continue;
      const w = 9 + 25 * R(), d = 10 + 30 * R(); if (!fits(x, z, w, d)) continue;
      push(id++, x, z, w, d, 16 + 47 * Math.pow(R(), 0.9)); got++;
    }
  }
  return out;
}

// per-building geometry: four facade strips with `nr` rows, a roof, small roof clutter, hero crown + antenna
function addBuilding(vb, b) {
  const { x, z, w, d, H, nr, fhE, fhR } = b, y0 = -60, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  const cw = lin(["#393849", "#504657", "#5F505B"][b.style]).map((v) => v * b.gain), A = [x, z, H, fhE], B = [b.s, b.e, b.u, b.rHalf], C = (f) => [b.dx, b.dz, f, b.tilt];
  const mk = (p, n, col, uv, f) => vb.v({ position: p, normal: n, aCol: col, uv, aA: A, aB: B, aC: C(f) });
  const faces = [[x0, z1, x1, z1, 0, 0, 1, w], [x1, z0, x0, z0, 0, 0, -1, w], [x1, z1, x1, z0, 1, 0, 0, d], [x0, z0, x0, z1, -1, 0, 0, d]];
  faces.forEach(([ax, az, bx, bz, nx, , nz, len], fi) => {
    const uo = fi * 7.3 + b.u * 53; let prev = null;
    for (let r = 0; r <= nr; r++) {
      const y = y0 + r * fhE, v = r * fhE / fhR, ia = mk([ax, y, az], [nx, 0, nz], cw, [uo, v], r), ib = mk([bx, y, bz], [nx, 0, nz], cw, [uo + len, v], r);
      if (prev) vb.quad(prev[0], prev[1], ib, ia); prev = [ia, ib];
    }
  });
  const rf = lin("#2e2d3d"), top = y0 + H;
  const ia = mk([x0, top, z1], [0, 1, 0], rf, [-1, -1], nr), ib = mk([x1, top, z1], [0, 1, 0], rf, [-1, -1], nr), ic = mk([x1, top, z0], [0, 1, 0], rf, [-1, -1], nr), id = mk([x0, top, z0], [0, 1, 0], rf, [-1, -1], nr);
  vb.quad(ia, ib, ic, id);
  { const ca = mk([x0, y0, z1], [0, 1, 0], rf, [-3, -3], 0), cb = mk([x1, y0, z1], [0, 1, 0], rf, [-3, -3], 0), cc = mk([x1, y0, z0], [0, 1, 0], rf, [-3, -3], 0), cd = mk([x0, y0, z0], [0, 1, 0], rf, [-3, -3], 0); vb.quad(ca, cb, cc, cd); }
  // a plain box on the roof (faces + top), f measured from the base in floors
  const box = (bx0, bx1, bz0, bz1, yA, yB, col, uvv = -1) => {
    const fA = (yA - y0) / fhE, fB = (yB - y0) / fhE, sides = [[bx0, bz1, bx1, bz1, 0, 1], [bx1, bz0, bx0, bz0, 0, -1], [bx1, bz1, bx1, bz0, 1, 0], [bx0, bz0, bx0, bz1, -1, 0]];
    for (const [ax, az, cx, cz, nx, nz] of sides) { const a0 = mk([ax, yA, az], [nx, 0, nz], col, [uvv, uvv], fA), b0 = mk([cx, yA, cz], [nx, 0, nz], col, [uvv, uvv], fA), b1 = mk([cx, yB, cz], [nx, 0, nz], col, [uvv, uvv], fB), a1 = mk([ax, yB, az], [nx, 0, nz], col, [uvv, uvv], fB); vb.quad(a0, b0, b1, a1); }
    const t0 = mk([bx0, yB, bz1], [0, 1, 0], col, [uvv, uvv], fB), t1 = mk([bx1, yB, bz1], [0, 1, 0], col, [uvv, uvv], fB), t2 = mk([bx1, yB, bz0], [0, 1, 0], col, [uvv, uvv], fB), t3 = mk([bx0, yB, bz0], [0, 1, 0], col, [uvv, uvv], fB); vb.quad(t0, t1, t2, t3);
  };
  const R = (k) => rngOf(SEED + b.id * 31 + k)();
  if (R(1) < 0.6) box(x - w * 0.2, x + w * 0.05, z - d * 0.15, z + d * 0.15, top, top + 2 + 2 * R(2), lin("#3a394b"));
  if (b.hero) {
    box(x - w * 0.3, x + w * 0.3, z - d * 0.3, z + d * 0.3, top, top + 3 * fhE, lin("#34334a"));
    box(x - 0.3, x + 0.3, z - 0.3, z + 0.3, top + 3 * fhE, top + 3 * fhE + 11, lin("#3a394b"));
    box(x - 0.55, x + 0.55, z - 0.55, z + 0.55, top + 3 * fhE + 11, top + 3 * fhE + 12.1, [1, 0.12, 0.08], -2);
  }
}

// rubble: one lumpy mound per building (+ two chunks near the camera), local coordinates, scaled by the shader
function addRubble(vb, b, glowOn) {
  const R = rngOf(SEED + b.id * 53 + 5), rubH = b.H * (0.06 + 0.07 * fr(b.u * 7.13)), pal = ["#5d5560", "#7a6f72", "#8a7f84", "#6e6470"].map((h) => lin(h).map((v) => v * 0.6));
  const A = [b.x, b.z, b.H, 0], B = [b.s, b.e, b.u, 0], push = (p, n, col, gl) => vb.v({ position: p, normal: n, aCol: col, uv: [0, 0], aA: A, aB: B, aC: [gl, 0, 0, 0] });
  const base = [], top = [], rot = R() * Math.PI;
  for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3, j = 0.85 + 0.3 * R(); base.push([Math.cos(a) * b.w * 0.5 * j, 0, Math.sin(a) * b.d * 0.5 * j]); top.push([Math.cos(a) * b.w * 0.3 * (0.7 + 0.6 * R()), 0.8 + 0.4 * R(), Math.sin(a) * b.d * 0.3 * (0.7 + 0.6 * R())]); }
  const nrm = (p, q, r) => { const u = new THREE.Vector3(...q).sub(new THREE.Vector3(...p)), v = new THREE.Vector3(...r).sub(new THREE.Vector3(...p)), n = u.cross(v).normalize(); return [n.x, n.y, n.z]; };
  const tri3 = (p, q, r, gl) => { const n = nrm(p, q, r), nn = n[1] < 0 ? n.map((v) => -v) : n, c = pal[Math.floor(R() * 4)].map((v) => v * (0.8 + 0.4 * R())); vb.tri(push(p, nn, c, gl[0]), push(q, nn, c, gl[1]), push(r, nn, c, gl[2])); };
  for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; tri3(base[k], base[k1], top[k1], [0, 0, glowOn]); tri3(base[k], top[k1], top[k], [0, glowOn, glowOn]); }
  for (let k = 1; k < 5; k++) tri3(top[0], top[k], top[k + 1], [glowOn, glowOn, glowOn]);
  if (b.near) for (let q = 0; q < 2; q++) {
    const yu = 0.75 * rubH, g = new THREE.BoxGeometry(1, 1, 1), sx = b.w * (0.12 + 0.12 * R()), sz = b.d * (0.1 + 0.1 * R()), sy = 0.2 * rubH * (0.8 + 0.5 * R());
    g.scale(sx, sy, sz); g.rotateY(R() * 3); g.rotateZ((R() - 0.5) * 0.7); g.rotateX((R() - 0.5) * 0.7); g.translate((R() - 0.5) * b.w * 0.45, (0.55 + 0.4 * R()) * yu, (R() - 0.5) * b.d * 0.45);
    const ng = g.toNonIndexed(), pp = ng.attributes.position, nn = ng.attributes.normal, c = [lin("#35455E"), lin("#4C4A59"), lin("#8a7f84"), lin("#526885")][Math.floor(R() * 4)].map((v) => v * 0.7);
    for (let i = 0; i < pp.count; i += 3) { const ids = [0, 1, 2].map((k) => push([pp.getX(i + k), pp.getY(i + k) / yu, pp.getZ(i + k)], [nn.getX(i + k), nn.getY(i + k), nn.getZ(i + k)], c, 0)); vb.tri(...ids); }
  }
}
// pieces that break off a collapsing building and fall (ballistic in the shader): 3 a building for the towers and near buildings
function addChunks(vb, b) {
  if (!(b.hero || (b.near && b.H > 26 && !b.fill))) return;
  const R = rngOf(SEED + b.id * 71 + 9), cols = ["#7a6f72", "#8a7f84", "#526885", "#4C4A59"].map(lin);
  for (let k = 0; k < (b.hero ? 5 : 3); k++) {
    const cs = 0.1 + 0.6 * R(), tS = TL.collapse[0] + (TL.collapse[1] - TL.collapse[0]) * (b.s + (b.e - b.s) * cs), sd = R() < 0.5 ? -1 : 1, sz = (b.hero ? 2.5 : 1.5) + 3 * R();
    const x0 = b.x + sd * b.w / 2, z0 = b.z + (R() - 0.5) * b.d, y0 = -60 + b.H * (1 - cs) * (0.35 + 0.65 * R()), g = new THREE.BoxGeometry(sz, sz * 0.6, sz * 0.8), c = cols[Math.floor(R() * 4)];
    const A = [x0, z0, y0, sz], B = [tS, (R() - 0.5) * 5, b.u, -1], C = [sd * (3 + 7 * R()), (R() - 0.5) * 6, 1 + 2 * R(), 0], pa = g.attributes.position, na = g.attributes.normal, idx = g.index.array, base = vb.n;
    for (let i = 0; i < pa.count; i++) vb.v({ position: [pa.getX(i), pa.getY(i), pa.getZ(i)], normal: [na.getX(i), na.getY(i), na.getZ(i)], aCol: c, uv: [0, 0], aA: A, aB: B, aC: C });
    for (let i = 0; i < idx.length; i += 3) vb.tri(base + idx[i], base + idx[i + 1], base + idx[i + 2]);
  }
}
// the raised rim of a strike crater: a 28-segment ring rising from T+.1
function addRim(vb, st, id) {
  const R = rngOf(SEED + 901 + id), N = 28, A = [st.x, st.z, 0, 0], B = [0, 0, 0.5, st.T + 0.1], rows = [[0.40, 0], [0.46, 1], [0.62, 0.15]], ring = [];
  const c0 = lin("#46383C"), c1 = lin("#6e6470"), c2 = lin("#281F27");
  for (let r = 0; r < 3; r++) { const row = []; for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2, j = 1 + 0.07 * Math.sin(a * 5 + id) + 0.05 * (R() - 0.5), h = rows[r][1] * (1.4 + 3.4 * R()), rad = rows[r][0] * st.D * j; const col = r === 1 ? c1 : r === 0 ? c2 : c0; row.push(vb.v({ position: [Math.cos(a) * rad, h, Math.sin(a) * rad], normal: [0, 1, 0], aCol: col, uv: [0, 0], aA: A, aB: B, aC: [r === 1 ? 0.55 : 0.1, 0, 0, 0] })); } ring.push(row); }
  for (let r = 0; r < 2; r++) for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; vb.quad(ring[r][k], ring[r][k1], ring[r + 1][k1], ring[r + 1][k]); }
}

// ====================================================================================================== shaders: city
const BLD_VS = `
${GL_COMMON}
uniform float uCol; uniform vec4 uCr[3];
attribute vec3 aCol; attribute vec4 aA, aB, aC;
varying vec3 vN, vCol, vW; varying vec2 vUV; varying float vHz, vCr, vLit, vEr, vU;
void main(){
  float c = clamp((uCol - aB.x) / (aB.y - aB.x), 0., 1.);
  float fhE = aA.w, n = aA.z / fhE, fc = c * n, k = floor(fc + 1e-4), fr = fc - k;
  if (c >= .9999) { k = n; fr = 0.; }
  float rubH = aA.z * (.06 + .07 * fract(aB.z * 7.13)), rubTh = .4 * rubH * sqrt(c);
  float f = aC.z, isCap = step(uv.x, -2.5), isBox = (uv.x < -.5 && uv.x > -2.5) ? 1. : 0.;
  float cons = (c > 0. && f <= k + .001 && isBox < .5) ? 1. : 0.;
  vec2 lp = position.xz - aA.xy;
  float wid = 1. + .25 * sst(0., .6, c), jit = h21(position.xz * 1.7 + f) - .5;
  vec2 lc = lp * (cons > .5 ? wid * (1. + .1 * jit * sst(0., .5, c)) : 1.);
  if (cons > .5 && abs(f - k) < .01 && c < .999) lc *= 1.1;
  float yy = cons > .5 ? (k > .5 ? rubTh * f / k : 0.) : rubTh + (f - k - fr) * fhE;
  if (isCap > .5) { cons = 1.; yy = rubTh; lc = lp * wid; }
  vec3 q = vec3(lc.x, yy, lc.y), nn = normal;
  if (cons < .5 && c > 0.) {
    float th0 = aC.w, t82 = th0 > 15. ? 48. : th0 * 2.2;
    float th = c < .5 ? th0 * c / .5 : mix(th0, t82, clamp((c - .5) / .32, 0., 1.));
    q.xz *= 1. - sst(.86, 1., c);
    vec3 pv = vec3(aC.x * aB.w, rubTh, aC.y * aB.w), ax = normalize(vec3(aC.y, 0., -aC.x)), r = q - pv; float a = radians(th), ca = cos(a), sa = sin(a);
    q = pv + r * ca + cross(ax, r) * sa + ax * dot(ax, r) * (1. - ca);
    nn = nn * ca + cross(ax, nn) * sa + ax * dot(ax, nn) * (1. - ca);
  }
  float er = eraseAt(aA.xy), hs = er < .5 ? mix(1., .35, er * 2.) : mix(.35, 0., (er - .5) * 2.);
  vec3 w = vec3(aA.x + q.x, -60. + q.y * hs - .4 * step(.999, er), aA.y + q.z);
  vec2 away = normalize(aA.xy - uContact + 1e-3); w.xz += away * (.12 * aB.w) * sst(.15, .5, er) * (1. - sst(.5, 1., er));
  for (int i = 0; i < 3; i++) if (uT > uCr[i].w + .1 && length(aA.xy - uCr[i].xy) < uCr[i].z + .5 * aB.w) w.y = -61.;
  if (isCap > .5 && c < .02) w.y = -61.;
  vec4 mv = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
  vHz = -mv.z; vW = w; vN = nn; vCol = aCol; vUV = uv; vCr = cons; vLit = 1. - sst(.12, .95, c); vEr = er; vU = aB.z;
}`;
const BLD_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
uniform vec3 uLitA, uLitB;
varying vec3 vN, vCol, vW; varying vec2 vUV; varying float vHz, vCr, vLit, vEr, vU;
void main(){
  vec3 N = normalize(vN), alb = vCol, em = vec3(0.);
  vec2 g = vec2(vUV.x / 3.1, vUV.y); float fw = max(fwidth(g.x), fwidth(g.y));
  if (N.y < .5 && vUV.x > -.5) {
    vec2 id = floor(g), fp = fract(g);
    float win = step(.16, fp.x) * step(fp.x, .84) * step(.22, fp.y) * step(fp.y, .78);
    float r = h21(id + vec2(vU * 173.1, vU * 57.7)), lit = step(r, .28) * vLit, r2 = h21(id.yx * 1.37 + vU * 31.1);
    vec3 dark = vec3(.012, .014, .03) * (.8 + .6 * r2), litC = r2 < .6 ? uLitA : uLitB;
    vec3 wall = alb * (fp.y > .86 ? .72 : 1.) * (fp.x < .05 ? .8 : 1.);
    float aa = 1. - sst(.3, .9, fw);
    alb = mix(mix(wall, dark, .45), mix(wall, dark, win), aa);
    em = mix(litC * .13 * vLit, litC * lit * win, aa);
  }
  float rc = sst(.3, .75, vCr);
  vec3 rb = mix(vec3(.10, .09, .11), vec3(.27, .24, .25), h21(floor(vW.xz * .8) + floor(vW.y * .9)));
  alb = mix(alb, rb, rc); em *= 1. - rc;
  float emb = step(.55, fract(vU * 13.7)) * rc * step(.72, h21(floor(vW.xz * .7 + vU * 9.))) * (.6 + .4 * sin(uT * 7. + vW.x * .9 + vW.z * 1.3)) * (1. - sst(.3, .5, vEr));
  em += vec3(.6, .12, .025) * emb;
  float nl = dot(N, uL), gn = bandOf(nl), ao = mix(.45, 1., clamp((vW.y + 60.) / 30., 0., 1.));
  vec3 c = alb * gn * tintOf(gn) * ao + em;
  c = mix(c, uOrange * .55, .45 * sst(.05, .5, vEr) * (1. - sst(.5, .95, vEr)));
  if (vUV.x < -1.5 && vUV.x > -2.5) c = vec3(1., .1, .06) * (.7 + .3 * sin(uT * 5. + vU * 40.)) * 1.4;
  c = hazeIt(c, vHz);
  gl_FragColor = vec4(c, 1.);
  ${COLORSPACE}
}`;
const RUB_VS = `
${GL_COMMON}
uniform float uCol; uniform vec4 uCr[3];
attribute vec3 aCol; attribute vec4 aA, aB, aC;
varying vec3 vN, vCol, vW; varying float vHz, vEr, vGl, vGrow;
void main(){
  vec3 w; float er = eraseAt(aA.xy), grow; vec3 nrm = normal;
  if (aB.w < -.5) {
    float tau0 = uT - aB.x, gy = -60. + aA.w * .3, tL = (aC.z + sqrt(aC.z * aC.z + 19.6 * max(aA.z - gy, 0.))) / 9.8, tau = min(tau0, tL); grow = 1.;
    if (tau0 < 0.) w = vec3(0., -61., 0.);
    else {
      float a = aB.y * tau, b2 = a * .7, land = sst(tL - .5, tL, tau0), hp = 1.5708;
      a = mix(a, floor(a / hp + .5) * hp, land); b2 = mix(b2, floor(b2 / hp + .5) * hp, land);
      float ca = cos(a), sa = sin(a), cb = cos(b2), sb = sin(b2);
      vec3 l = position; l = vec3(ca * l.x - sa * l.y, sa * l.x + ca * l.y, l.z); l = vec3(cb * l.x + sb * l.z, l.y, -sb * l.x + cb * l.z);
      nrm = vec3(ca * normal.x - sa * normal.y, sa * normal.x + ca * normal.y, normal.z); nrm = vec3(cb * nrm.x + sb * nrm.z, nrm.y, -sb * nrm.x + cb * nrm.z);
      vec3 cen = vec3(aA.x + aC.x * tau, aA.z + aC.z * tau - 4.9 * tau * tau, aA.y + aC.y * tau); cen.y = max(cen.y, gy);
      w = cen + l;
    }
    for (int i = 0; i < 3; i++) if (uT > uCr[i].w + .1 && length(aA.xy - uCr[i].xy) < uCr[i].z + 14.) w.y = -61.;
  }
  else if (aB.w > 0.) { grow = sst(aB.w, aB.w + .35, uT); w = vec3(aA.x + position.x, -60. + position.y * grow, aA.y + position.z); if (grow < .002) w.y = -61.; }
  else {
    float c = clamp((uCol - aB.x) / (aB.y - aB.x), 0., 1.), rubH = aA.z * (.06 + .07 * fract(aB.z * 7.13)); grow = c;
    float sx = mix(.35, 1., sst(0., .5, c)), g = sqrt(c);
    w = vec3(aA.x + position.x * sx, -60. + .15 * rubH * g + position.y * .75 * rubH * g, aA.y + position.z * sx);
    if (c < .002) w.y = -61.;
    vec2 away = normalize(aA.xy - uContact + 1e-3); w.xz += away * .12 * aA.z * .1 * sst(.15, .5, er) * (1. - sst(.5, 1., er));
    for (int i = 0; i < 3; i++) if (uT > uCr[i].w + .1 && length(aA.xy - uCr[i].xy) < uCr[i].z + 14.) w.y = -61.;
  }
  float hs = er < .5 ? mix(1., .35, er * 2.) : mix(.35, 0., (er - .5) * 2.);
  if (w.y > -60.9) w.y = -60. + (w.y + 60.) * hs - .4 * step(.999, er);
  vec4 mv = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
  vHz = -mv.z; vW = w; vN = nrm; vCol = aCol; vEr = er; vGl = aB.w < -.5 ? 0. : aC.x; vGrow = grow;
}`;
const RUB_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
varying vec3 vN, vCol, vW; varying float vHz, vEr, vGl, vGrow;
void main(){
  vec3 N = normalize(vN); float gn = bandOf(dot(N, uL));
  vec3 c = vCol * (.85 + .3 * h21(floor(vW.xz * 1.3))) * gn * tintOf(gn) * mix(.6, 1., clamp((vW.y + 60.) / 6., 0., 1.));
  float fl = .75 + .25 * sin(uT * 9. + vW.x * .7 + vW.z * .9), on = vGl * vGl * sst(0., .15, vGrow) * (1. - sst(.3, .5, vEr));
  c += mix(vec3(.30, .035, .01), vec3(.62, .16, .03), fl) * on * .55;
  c = mix(c, uOrange * .55, .5 * sst(.05, .5, vEr) * (1. - sst(.5, .95, vEr)));
  c = hazeIt(c, vHz);
  gl_FragColor = vec4(c, 1.);
  ${COLORSPACE}
}`;
const GND_VS = `varying vec3 vW; varying float vHz; void main(){ vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vHz = -mv.z; gl_Position = projectionMatrix * mv; }`;
const GND_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
uniform sampler2D uTex; uniform vec4 uCr[3]; uniform float uHole, uFill;
varying vec3 vW; varying float vHz;
void main(){
  vec2 p = vW.xz;
  if (uHole > .5 && uFill < .5) { if (p.x > -15. && p.x < 5. && p.y < -12. && p.y > -182.) discard; if (p.x > -60. && p.x < 60. && p.y < -31. && p.y > -57.) discard; }
  float er = eraseAt(p);
  if (uFill > .5 && er < .004) discard;
  vec3 col = uFill > .5 ? vec3(.06, .055, .065) : texture2D(uTex, p / 160.).rgb;
  for (int i = 0; i < 3; i++) {
    vec4 cr = uCr[i]; float d = length(p - cr.xy), ang = atan(p.y - cr.y, p.x - cr.x), rad = cr.z * (1. + .07 * sin(ang * 5. + cr.x) + .05 * sin(ang * 11.));
    float inside = uT > cr.w + .1 ? 1. - sst(rad * .9, rad, d) : 0.;
    col = mix(col, mix(vec3(.021, .0137, .0203), vec3(.038, .019, .026), sst(0., rad, d)), inside);
  }
  col = scorchOf(col, p, er);
  col = hazeIt(col, vHz) + fissOf(p, er) * (1. - .35 * (1. - exp(-vHz * uHzK)));
  gl_FragColor = vec4(col, 1.);
  ${COLORSPACE}
}`;

// ====================================================================================================== dust (gruin)
const DUST_VS = `
${GL_COMMON}
uniform float uCol, uDust;
attribute vec4 aP, aQ, aW;
varying vec2 vUv; varying float vA, vHz, vGl; varying vec3 vC;
void main(){
  vGl = aW.z;
  float rank = aQ.w, n = uCol < .5 ? 144. * uCol : 72. + 96. * (uCol - .5), vis = clamp((n - rank) / 4., 0., 1.);
  float Rr = uCol < .5 ? mix(.35, 1., uCol * 2.) : mix(1., 2.08, (uCol - .5) * 2.);
  float crest = uCol < .5 ? mix(-47., -35., uCol * 2.) : mix(-35., -25., (uCol - .5) * 2.);
  float op = uCol < .5 ? .75 : mix(.75, .85, (uCol - .5) * 2.);
  float settle = sst(28., 42., uT);
  float size = aP.w * Rr * (.5 + .5 * vis) * (1. - .25 * settle);
  vec3 ctr = aP.xyz;
  if (aW.x > .5) { ctr.z += uCol < .5 ? 44. * uCol : 22. + 84. * (uCol - .5); ctr.y = -60. + size * .38; op *= .72; }
  else ctr.y = -60. + size * (.2 + .14 * aW.w);
  float er = eraseAt(aP.xz);
  vA = op * vis * uDust * (1. - sst(0., .8, er)) * (1. - .45 * settle);
  float dS = length(vec2(ctr.x + 5., ctr.z - clamp(ctr.z, -110., -10.)));
  vA *= mix(.12, 1., sst(24., 62., dS - .6 * size));
  vec4 mv = modelViewMatrix * vec4(ctr, 1.); mv.xy += aQ.xy * vec2(size, size * .62); gl_Position = projectionMatrix * mv;
  vUv = vec2((aQ.z + aQ.x * .5 + .5) / 3., aQ.y * .5 + .5); vHz = -mv.z;
  vC = aW.y < .5 ? vec3(.73, .52, .44) : (aW.y < 1.5 ? vec3(.366, .305, .335) : vec3(.176, .15, .195));
}`;
const SPR_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
uniform sampler2D uMap;
varying vec2 vUv; varying float vA, vHz, vGl; varying vec3 vC;
void main(){
  vec4 t = texture2D(uMap, vUv); float a = t.a * vA; if (a < .004) discard;
  vec3 c = mix(vec3(.176, .15, .195), vC * 1.2, smoothstep(.2, .9, t.r));
  c += vec3(1., .5, .16) * .7 * vGl * (1. - smoothstep(.15, .7, vUv.y)) * (.75 + .25 * sin(uT * 8. + vUv.x * 20.));
  c = hazeIt(c, vHz * .6);
  gl_FragColor = vec4(c, a);
  ${COLORSPACE}
}`;
const PUFF_VS = `
${GL_COMMON}
uniform float uDust, uPuff;
attribute vec4 aP, aQ, aW;
varying vec2 vUv; varying float vA, vHz, vGl; varying vec3 vC;
void main(){
  vGl = 0.;
  float age = (uT - aW.x) / .7; vec3 ctr = aP.xyz; float sz = 0., op = 0.;
  if (age > 0. && age < 1.) { sz = (age < .5 ? mix(.6, 3.1, age * 2.) : mix(3.1, 6., (age - .5) * 2.)) * uPuff * aP.w; op = age < .5 ? mix(0., .7, age * 2.) : mix(.7, 0., (age - .5) * 2.); ctr.y += age * 7. + sz * .35; ctr.xz += aW.yz * age * 5.; }
  float er = eraseAt(aP.xz); vA = op * uDust * (1. - sst(0., .5, er));
  vec4 mv = modelViewMatrix * vec4(ctr, 1.); mv.xy += aQ.xy * sz; gl_Position = projectionMatrix * mv;
  vUv = vec2((aQ.z + aQ.x * .5 + .5) / 3., aQ.y * .5 + .5); vHz = -mv.z; vC = vec3(.62, .46, .4);
}`;

function buildRuin(P) {
  const S = P.spec, g = P.whole, U = baseU(S), city = genCity(S);
  // ---- buildings, rubble, rims
  const bv = new VB(BNAMES), rv = new VB(BNAMES);
  for (const b of city) { addBuilding(bv, b); addRubble(rv, b, rngOf(SEED + b.id * 3 + 19)() < 0.38 ? 0.8 : 0); addChunks(rv, b); }
  TL.strikes.forEach((st, i) => addRim(rv, st, i));
  const bm = lookOnly(new THREE.Mesh(bv.geo(), shaderMat(U, {}, BLD_VS, BLD_FS)), 1); g.add(bm);
  const rm = lookOnly(new THREE.Mesh(rv.geo(), shaderMat(U, {}, RUB_VS, RUB_FS)), 1); g.add(rm);
  // ---- ground
  const E = 3500, gg = new THREE.PlaneGeometry(2 * E, 3230); gg.rotateX(-Math.PI / 2); gg.translate(0, -60, -1585);
  const gm = lookOnly(new THREE.Mesh(gg, shaderMat(U, { uTex: { value: groundTex() }, uHole: { value: S.hole ?? 1 }, uFill: { value: 0 } }, GND_VS, GND_FS, { side: THREE.FrontSide })), 0); g.add(gm);
  // ---- dust sea: 120 clusters (78 billow clusters of 2 sprites, 42 rolls of 1), sorted far to near
  const R = rngOf(SEED + 555), cands = city.filter((b) => b.z > -900 && !b.fill || b.fill && b.z > -700).sort((a, b) => a.s - b.s), sprites = [];
  const rollRows = [-190, -250, -310];
  let rollN = 0;
  for (let j = 0; j < 120; j++) {
    const roll = Math.floor((j + 1) * 42 / 120) > Math.floor(j * 42 / 120);
    if (roll) {
      const row = rollN % 3, k = Math.floor(rollN / 3); rollN++;
      const z = rollRows[row] - 10 * R(), span = 0.42 * Math.abs(z) + 40, x = (-1 + 2 * ((k + 0.5 * row + 0.2 * R()) / 14)) * span;
      sprites.push({ x, y: 0, z, size: 22 + 14 * R(), rank: j, kind: 1, col: 1 + Math.floor(R() * 2), v: Math.floor(R() * 3), h: 0.5 });
    } else {
      const b = cands[Math.min(cands.length - 1, Math.floor((j / 120) * cands.length + R() * 3))], df = clamp(1 + Math.abs(b.z) / 900, 1, 2.2) * (S.dustSize ?? 1);
      const side = b.shell ? Math.sign(b.x - AX) : 0, bx = b.shell ? b.x + side * 14 : b.x;
      for (let q = 0; q < 2; q++) sprites.push({ x: bx + (R() - 0.5) * b.w * 1.1, y: 0, z: b.z + (R() - 0.5) * b.d * 1.1, size: Math.min(16, (b.shell ? 8 : 12 * (0.8 + 0.4 * R())) * df * 1.25), rank: j, kind: 0, col: q ? Math.floor(R() * 3) : 0, v: Math.floor(R() * 3), h: 0.2 + 0.8 * R(), gl: q === 0 && R() < 0.4 ? 1 : 0 });
    }
  }
  sprites.forEach((s) => { s.zs = s.z; s.size *= S.dustSize ?? 1; });
  sprites.sort((a, b) => a.zs - b.zs);
  const dv = new VB([["position", 3], ["aP", 4], ["aQ", 4], ["aW", 4]]), CORN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const s of sprites) { const ids = CORN.map(([cx, cy]) => dv.v({ position: [s.x, s.y, s.z], aP: [s.x, s.y, s.z, s.size], aQ: [cx, cy, s.v, s.rank], aW: [s.kind, s.col, s.gl ?? 0, s.h] })); dv.quad(...ids); }
  const bt = billowTex();
  const dm = lookOnly(new THREE.Mesh(dv.geo(), shaderMat(U, { uMap: { value: bt } }, DUST_VS, SPR_FS, { transparent: true, depthWrite: false })), 6); g.add(dm);
  // ---- tower puffs: a 2-sprite puff at every 4th floor crossing of the twelve towers
  const pv = new VB([["position", 3], ["aP", 4], ["aQ", 4], ["aW", 4]]), RP = rngOf(SEED + 606);
  for (const b of city.filter((q) => q.hero)) {
    const n = b.nr;
    for (let p = 1; p <= Math.floor(n / 4); p++) {
      const tc = TL.collapse[0] + (TL.collapse[1] - TL.collapse[0]) * (b.s + (b.e - b.s) * (4 * p) / n), a0 = RP() * Math.PI * 2;
      for (let q = 0; q < 2; q++) {
        const a = a0 + q * Math.PI, px = b.x + Math.cos(a) * b.w * 0.55, pz = b.z + Math.sin(a) * b.d * 0.55, sz = 1 + 0.4 * RP();
        const ids = CORN.map(([cx, cy]) => pv.v({ position: [px, -57, pz], aP: [px, -57, pz, sz], aQ: [cx, cy, Math.floor(RP() * 3), 0], aW: [tc, Math.cos(a), Math.sin(a), 0] })); pv.quad(...ids);
      }
    }
  }
  const pm = lookOnly(new THREE.Mesh(pv.geo(), shaderMat(U, { uMap: { value: bt }, uPuff: { value: S.puffScale ?? 2.6 } }, PUFF_VS, SPR_FS, { transparent: true, depthWrite: false })), 7); g.add(pm);
  return {
    grip: 0,
    stats: { buildings: city.length, mid: city.filter((b) => b.id < 136).length, shells: city.filter((b) => b.shell).length, infill: city.filter((b) => b.fill).length, sprites: sprites.length },
    apply(ps) {
      const t = ps.t ?? S.t ?? -1;
      U.uT.value = t; U.uCol.value = Pk(...TL.collapse, t); U.uSt.value = Pk(...TL.street, t); U.uSF.value = Pk(...TL.streetFire, t);
      const a = Pk(...TL.afterglow, t); U.uAfter.value = a < 0.5 ? lerp(1, 0.69, a * 2) : lerp(0.69, 0.25, (a - 0.5) * 2);
    },
  };
}

// ====================================================================================================== the street
const SLAB_GLSL = `
uniform float uSt;
vec3 slabMove(vec4 s){
  float m = uSt < .5 ? .4 * (uSt / .5) : .4 + (abs(s.x) - .4) * ((uSt - .5) / .5);
  float lip = uSt < .5 ? .28 * (uSt / .5) : .28 + .97 * ((uSt - .5) / .5);
  return vec3(sign(s.x) * m, -s.z * lip * s.w, 0.);
}`;
const ROAD_VS = `
${GL_COMMON}
${SLAB_GLSL}
attribute vec3 aCol; attribute vec4 aM, aR; attribute vec2 aI; attribute float aK;
varying vec3 vN, vCol, vRest; varying float vK, vEr, vHz;
void main(){
  vec3 p = position, nn = normal; float er = aK > 1.5 ? 0. : eraseAt(aR.xy);
  p.xz += aI * clamp(uSt, 0., 1.);
  vec3 mvv = slabMove(aM);
  if (aR.w > 1.5 && aR.w < 2.5) { vec3 o = vec3(aR.x, -60., aR.y); p = o + (p - o) * sst(.05, .5, uSt) * (1. - sst(.3, 1., er)); }
  else if (aR.w > .5) {
    vec3 o = vec3(aR.x, -60., aR.y), l = p - o;
    float hf = aR.w > 2.5 ? (uSt < .5 ? mix(1., .8, uSt * 2.) : mix(.8, .62, (uSt - .5) * 2.)) : (uSt < .5 ? mix(1., .55, uSt * 2.) : mix(.55, .16, (uSt - .5) * 2.));
    l.y *= hf * (1. - sst(.3, 1., er));
    float a = radians(aR.z) * (uSt < .5 ? mix(0., 12. / 28., uSt * 2.) : mix(12. / 28., 1., (uSt - .5) * 2.)), ca = cos(a), sa = sin(a);
    l = vec3(ca * l.x - sa * l.y, sa * l.x + ca * l.y, l.z); nn = vec3(ca * nn.x - sa * nn.y, sa * nn.x + ca * nn.y, nn.z);
    l.y += .95 * abs(sin(a)); p = o + l;
  }
  if (aK < 1.5) { p += mvv; p.y -= 7. * sst(.5, 1., er); }
  vEr = er; vRest = position; vN = nn; vCol = aCol; vK = aK;
  vec4 mv = modelViewMatrix * vec4(p, 1.); vHz = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const ROAD_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
uniform float uCol;
float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
varying vec3 vN, vCol, vRest; varying float vK, vEr, vHz;
void main(){
  vec3 N = normalize(vN), alb = vCol; vec2 p = vRest.xz;
  if (vK < .5) {
    float inRoad = step(-11., p.x) * step(p.x, 1.) + step(-60., p.x) * step(p.x, 60.) * step(-53., p.y) * step(p.y, -35.);
    inRoad = min(inRoad, 1.);
    vec3 asph = vec3(.0513, .0437, .0545) * .8 * (.85 + .3 * h21(floor(p * 3.))), conc = vec3(.266, .202, .175) * (.88 + .24 * h21(floor(p * 2.)));
    alb = inRoad > .5 ? asph : conc;
    if (inRoad < .5) { float jx = step(fract(p.x * .5), .03) + step(fract(p.y * .5), .03); alb *= 1. - .22 * min(jx, 1.); if (abs(p.x + 11.) < .25 || abs(p.x - 1.) < .25) alb = vec3(.18, .15, .14); }
    vec3 paint = vec3(.66, .54, .38); float mk = 0.;
    mk += step(abs(p.x + 8.), .09) * step(fract(p.y / 9.), .35) + step(abs(p.x + 2.), .09) * step(fract(p.y / 9.), .35);
    mk += (step(abs(p.x + 5.15), .07) + step(abs(p.x + 4.85), .07)) * step(-31., p.y) * 0. ;
    mk += step(abs(p.y + 44.), .09) * step(fract(p.x / 8.), .4) * step(-53., p.y) * step(abs(p.x + 5.), 60.);
    mk += step(-34.5, p.y) * step(p.y, -32.) * step(abs(p.x + 5.), 6.) * step(fract((p.x + 11.) * .85), .5);
    mk += step(-56.5, p.y) * step(p.y, -54.) * step(abs(p.x + 5.), 6.) * step(fract((p.x + 11.) * .85), .5);
    alb = mix(alb, paint, min(mk, 1.) * .97 * step(.5, inRoad));
    // director (Sol r2 #2): the collapse dust settles on the street before it tears: a pale coat, thicker at the kerbs, and dark chunks
    float edge = sst(3., 9., abs(p.x + 5.)), dn = vn2(p * .12) * .6 + vn2(p * .5) * .4, dc = vn2(p * 1.7 + 17.);
    alb = mix(alb, vec3(.24, .19, .18), uCol * clamp(.35 + .5 * edge + .6 * (dn - .5), 0., 1.) * .85);
    alb = mix(alb, vec3(.07, .055, .055), uCol * sst(.8 - .1 * edge, .86 - .1 * edge, dc) * .8);
  } else alb = mix(alb, vec3(.24, .19, .18), uCol * .3);
  float nl = dot(N, uL), gn = bandOf(nl), ao = vK > .5 ? 1. : 1.;
  vec3 c = alb * gn * tintOf(gn) * ao;
  if (vK < .5) c = scorchOf(c, vRest.xz, vEr); else c = mix(c, scorchOf(c, vRest.xz, vEr), .5 * sst(.05, .4, vEr));
  c = hazeIt(c, vHz * .1);
  gl_FragColor = vec4(c, 1.);
  ${COLORSPACE}
}`;
const FIRE_VS = `
${GL_COMMON}
${SLAB_GLSL}
uniform float uSF;
attribute vec4 aP, aQ, aS, aF;
varying vec2 vUv; varying float vA, vHz, vKind; varying vec3 vC;
void main(){
  float rank = aF.x, n = uSF < .5 ? 12. * uSF : 6. + 8. * (uSF - .5), vis = clamp(n - rank, 0., 1.);
  float fh = uSF < .5 ? mix(0., 1.2, uSF * 2.) : mix(1.2, 2.8, (uSF - .5) * 2.), sh = uSF < .5 ? mix(0., 3.4, uSF * 2.) : mix(3.4, 10., (uSF - .5) * 2.);
  float cyc = fract((uT - (26.1 + rank * .12)) / .46 + aF.y);
  float fs = cyc < .5 ? mix(.84, 1.1, cyc * 2.) : mix(1.1, .84, (cyc - .5) * 2.);
  float er = eraseAt(aP.xz), gone = 1. - sst(.15, .45, er);
  vec3 ctr = aP.xyz + slabMove(aS); ctr.y += .02;
  vec4 mv = modelViewMatrix * vec4(ctr, 1.); float kind = aQ.z, a = 0.; vec3 col = vec3(1.);
  if (kind < .5) { float hh = max(fh * fs * aP.w * 1.15, .001); mv.x += aQ.x * hh * .5 + sin(uT * 19. + aF.z * 30.) * .12 * hh; mv.y += (aQ.y * .5 + .5) * hh; a = vis * gone * smoothstep(0., .2, uSF) * (.95 + .05 * sin(uT * 14. + aF.z * 9.)); col = vec3(1.); }
  else if (kind < 1.5) { float sy = sh / 6., sz = (1.6 + 2.8 * cyc) * aP.w * (.4 + .6 * sst(0., .6, uSF)); mv = modelViewMatrix * vec4(ctr + vec3(aF.w * cyc * 3., 6. * cyc * sy + 1.2, 3. * cyc * sy), 1.); mv.xy += aQ.xy * sz; a = (cyc < .5 ? mix(0., .95, cyc * 2.) : mix(.95, 0., (cyc - .5) * 2.)) * vis * gone * sst(0., .3, uSF); col = vec3(.125, .093, .1); }
  else { float sz = (2.3 + .5 * fs) * aP.w; mv = modelViewMatrix * vec4(ctr + vec3(0., .7, 0.), 1.); mv.xy += aQ.xy * sz; a = .26 * vis * gone * fs * smoothstep(0., .2, uSF); col = vec3(1., .42, .12); }
  vKind = kind; vA = a; vC = col; vHz = -mv.z; gl_Position = projectionMatrix * mv;
  vUv = kind < .5 ? vec2((aQ.w + aQ.x * .5 + .5) * .5, aQ.y * .5 + .5) : vec2((aQ.w + aQ.x * .5 + .5) / 3., aQ.y * .5 + .5);
}`;
const FIRE_FS = `
${GL_COMMON}
${GL_FRAG_COMMON}
uniform sampler2D uMapF, uMapS;
varying vec2 vUv; varying float vA, vHz, vKind; varying vec3 vC;
void main(){
  vec4 t = vKind < .5 ? texture2D(uMapF, vUv) : texture2D(uMapS, vUv); float a = t.a * vA; if (a < .004) discard;
  vec3 c = vKind < .5 ? t.rgb * 1.6 : (vKind < 1.5 ? vC * (.45 + .75 * t.r) : vC * (.5 + .5 * t.r));
  gl_FragColor = vec4(c, a);
  ${COLORSPACE}
}`;

// point in polygon
const inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

function buildRupture(P) {
  const S = P.spec, g = P.whole, U = baseU(S), R = rngOf(SEED + 303), DEPTH = 7, TOP = -59.97;
  const RN = [["position", 3], ["normal", 3], ["aCol", 3], ["aM", 4], ["aR", 4], ["aI", 2], ["aK", 1]];
  const vb = new VB(RN), slabs = [];
  const asph = lin("#403B42"), conc = lin("#8D7C73"), rock = lin("#46383C"), cutc = lin("#281F27");
  const mkv = (p, n, col, sl, K, ins = [0, 0], car = [0, 0, 0, 0]) => vb.v({ position: p, normal: n, aCol: col, aM: sl ? [sl.ox, 0, sl.prs, sl.wvOf ? sl.wvOf(p[0]) : 0] : [0, 0, 0, 0], aR: sl ? [sl.cx, sl.cz, car[2], car[3]] : [0, 0, 0, 0], aI: ins, aK: [K] });
  const xo = (side, z) => (z <= -31 && z >= -57 ? side * 60 + (side > 0 ? 0 : 0) : (side < 0 ? -15 : 5));
  // cut lists (z of each cut, near to far) per side; 3 branches a side
  const cutsOf = (side, off) => { const zs = [-12]; let z = -12 - off; while (z > -176) { zs.push(z); z -= 8 + 7 * R(); } zs.push(-182); return zs; };
  for (const side of [-1, 1]) {
    const zs = cutsOf(side, 5 + 4 * R()), nc = zs.length, branch = new Set(); while (branch.size < 3) branch.add(2 + Math.floor(R() * (nc - 4)));
    const cut = zs.map((zc, i) => {
      const edge = i === 0 || i === nc - 1, br = branch.has(i), A = [Cx(zc) + jagC(zc), zc], zB = edge ? zc : zc + (R() - 0.5) * 3, xB = xo(side, zB), pts = [A];
      if (!edge) { for (let k = 1; k <= 2; k++) { const f = k / 3; pts.push([lerp(A[0], xB, f) + (R() - 0.5) * (br ? 4 : 1.5), zc + (R() - 0.5) * (br ? 7 : 3)]); } }
      pts.push([xB, zB]);
      return { pts, m: edge ? 0 : (br ? 0.35 + 0.25 * R() : 0.05 + 0.08 * R()), br };
    });
    for (let k = 0; k < nc - 1; k++) {
      const a = cut[k], b = cut[k + 1], zNear = zs[k], zFar = zs[k + 1], poly = [];
      for (const q of a.pts) poly.push([q[0], q[1]]);
      const Bz0 = a.pts[a.pts.length - 1][1], Bz1 = b.pts[b.pts.length - 1][1];
      for (const zb of [-31, -57]) if (zb < Bz0 && zb > Bz1) { poly.push([xo(side, zb + 0.01), zb]); poly.push([xo(side, zb - 0.01), zb]); }
      for (let i = b.pts.length - 1; i >= 0; i--) poly.push([b.pts[i][0], b.pts[i][1]]);
      for (let z = zFar + 2.2; z < zNear - 1; z += 2.2) poly.push([Cx(z) + jagC(z), z]);
      // remove consecutive duplicates
      const pts = poly.filter((p, i) => { const q = poly[(i + poly.length - 1) % poly.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.02; });
      const ox = side * (1.4 + 1.3 * R()), prs = ((k + (side > 0 ? 1 : 0)) % 2) ? 0.55 + 0.45 * R() : -(0.1 + 0.2 * R());
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const sl = { side, ox, prs, cx, cz, pts, zNear, zFar, mNear: a.m, mFar: b.m, wvOf: (x) => clamp(side < 0 ? (x + 15) / 10 : (5 - x) / 10) };
      slabs.push(sl);
      // area sign (for the inward direction of the bevel strips)
      let area = 0; for (let i = 0; i < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length]; area += x0 * z1 - x1 * z0; }
      const inset = (p) => [0, (a.m * -1) * (1 - clamp((zNear - p[1]) / (zNear - zFar))) + (b.m) * clamp((zNear - p[1]) / (zNear - zFar))];
      // top face
      const isRoad = (x, z) => (x > -11 && x < 1) || (z <= -35 && z >= -53 && Math.abs(x - AX) < 60);
      const idx = THREE.ShapeUtils.triangulateShape(pts.map((p) => new THREE.Vector2(p[0], p[1])), []);
      const top = pts.map((p) => mkv([p[0], TOP, p[1]], [0, 1, 0], asph, sl, 0, inset(p)));
      for (const [i, j, l] of idx) vb.tri(top[i], top[j], top[l]);
      // bevel strips: dark chamfers just inside every edge, walls from the top down 7 m
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz); if (len < 0.05) continue;
        const sgn = area > 0 ? 1 : -1, nx = -dz / len * sgn, nz = dx / len * sgn;   // inward (left of the edge when area > 0 in x/z)
        const fe = Math.abs(p[0] - (Cx(p[1]) + jagC(p[1]))) < 0.02 && Math.abs(q[0] - (Cx(q[1]) + jagC(q[1]))) < 0.02, bw = fe ? 0.34 : 0.2, p2 = [p[0] + nx * bw, p[1] + nz * bw], q2 = [q[0] + nx * bw, q[1] + nz * bw];
        const c0e = fe ? conc.map((v) => v * 0.45) : cutc, c1e = fe ? conc.map((v) => v * 1.5) : conc;
        const a0 = mkv([p[0], TOP + 0.012, p[1]], [0, 1, 0], c0e, sl, 1, inset(p)), a1 = mkv([q[0], TOP + 0.012, q[1]], [0, 1, 0], c0e, sl, 1, inset(q)), a2 = mkv([q2[0], TOP + 0.012, q2[1]], [0, 1, 0], c1e, sl, 1, inset(q)), a3 = mkv([p2[0], TOP + 0.012, p2[1]], [0, 1, 0], c1e, sl, 1, inset(p));
        vb.quad(a0, a1, a2, a3);
        const wn = [-nx, 0, -nz], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], surf = isRoad(mid[0], mid[1]) ? asph : conc;
        const rowsD = [[0, surf], [0.14, surf.map((v) => v * 0.7)], [0.75, conc.map((v) => v * 0.5)], [2.2, rock.map((v) => v * 0.3)], [DEPTH, cutc.map((v) => v * 0.1)]];
        let prev = null;
        for (const [dd, cc] of rowsD) { const u0 = mkv([p[0], TOP - dd, p[1]], wn, cc, sl, 1, inset(p)), u1 = mkv([q[0], TOP - dd, q[1]], wn, cc, sl, 1, inset(q)); if (prev) vb.quad(prev[0], prev[1], u1, u0); prev = [u0, u1]; }
      }
    }
  }
  // the floor 7 m down (static): road rect + cross-street rect
  for (const [x0, x1, z0, z1] of [[-17, 7, -182, -12], [-62, 62, -57, -31]]) {
    const f = [[x0, z1], [x1, z1], [x1, z0], [x0, z0]].map((p) => mkv([p[0], TOP - DEPTH - 0.02, p[1]], [0, 1, 0], cutc.map((v) => v * 0.08), null, 2));
    vb.quad(f[0], f[1], f[2], f[3]);
  }
  // 16 vehicles on the lanes z -19..-77, five of them tight to the main fissure, the nearest at (-8.5, -25)
  const cars = [], carCols = ["#E8E4DA", "#C8312B", "#2F5FB5", "#E3B22B", "#8C9097", "#D9701F", "#3E8A5A", "#F2F0EA"].map(lin);
  for (let i = 0; i < 16; i++) {
    const L = 3.8 + R(), W = 1.7 + 0.3 * R(), Hh = 1.3 + 0.4 * R(), z = i === 0 ? -25 : -19 - (58 * (i + 0.5 * R())) / 16, c = Cx(z);
    let x = i === 0 ? -8.5 : (i % 2 ? c + 1.4 + W / 2 + (i < 5 ? -0.1 : 2.4 * R()) : c - 1.4 - W / 2 - (i < 5 ? 0.4 : 1.6 * R()));
    x = clamp(x, -10.2 + W / 2, 0.2 - W / 2);
    cars.push({ x, z, L, W, H: Hh, i });
  }
  const slabAt = (x, z) => slabs.find((s) => inPoly(s.pts, x, z)) || slabs.reduce((m, s) => (Math.hypot(s.cx - x, s.cz - z) < Math.hypot(m.cx - x, m.cz - z) ? s : m), slabs[0]);
  for (const car of cars) {
    const sl = slabAt(car.x, car.z), c0 = carCols[car.i % carCols.length], sideDir = car.x < Cx(car.z) ? 1 : -1, wvC = sl.wvOf(car.x), car_sl = { ...sl, cx: car.x, cz: car.z, wvOf: () => wvC };
    car.sl = car_sl; car.wv = wvC;
    const roll = (sl.side < 0 ? -1 : 1) * ([0, 1, 3].includes(car.i) ? 44 : 28), K = [0, 0, roll, [0, 1, 2, 4, 5, 7, 9, 10, 12, 14].includes(car.i) ? 1 : 3];
    const carBox = (x0, x1, y0, y1, z0, z1, col, topCol, shade = 1) => {
      const cc = col.map((v) => v * shade), fs = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 0.85], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], 0.85], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], 1], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 1], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], 0]];
      for (const f of fs) { const col2 = f[5] === 0 ? topCol : cc.map((v) => v * f[5]); const ids = f.slice(0, 4).map((p) => mkv([car.x + p[0], -60 + p[1], car.z + p[2]], f[4], col2, car_sl, 1, [0, 0], K)); vb.quad(...ids); }
    };
    const hw = car.W / 2, hl = car.L / 2;
    carBox(-hw, hw, 0.12, car.H * 0.5, -hl, hl, c0, c0.map((v) => v * 1.1));
    carBox(-hw * 0.86, hw * 0.86, car.H * 0.5, car.H, -hl * 0.5, hl * 0.38, [0.02, 0.03, 0.05], c0.map((v) => v * 1.2));
    void sideDir;
  }
  // debris: asphalt and concrete chunks along both lips (some tipping into the crack) and strewn on the slabs; they grow in with `street`
  { const DR = rngOf(SEED + 808), dcol = [asph.map((v) => v * 1.6), conc.map((v) => v * 0.9), conc.map((v) => v * 1.3), rock.map((v) => v * 2)];
    for (let n = 0; n < 110; n++) {
      const sl = slabs[Math.floor(DR() * slabs.length)], edge = DR() < 0.62; let x, z, ang = 0, w = 0.4 + 1.3 * DR();
      if (edge) { z = lerp(sl.zFar, sl.zNear, DR()); x = Cx(z) + jagC(z) - sl.side * (0.15 + 0.5 * DR()); ang = -sl.side * (0.45 + 0.7 * DR()); w += 0.5; }
      else { let k = 0; do { x = lerp(-14.5, 4.5, DR()); z = lerp(sl.zFar, sl.zNear, DR()); } while (!inPoly(sl.pts, x, z) && k++ < 12); if (k > 12) continue; ang = (DR() - 0.5) * 0.5; }
      const h = 0.15 + 0.4 * DR(), g = new THREE.BoxGeometry(w, h, w * (0.5 + 0.6 * DR()));
      g.rotateY(DR() * 3.1); g.rotateZ(ang); g.translate(x, -60 + h * 0.5 + (edge ? 0.1 : 0.03), z);
      const ng = g.toNonIndexed(), pp = ng.attributes.position, nn = ng.attributes.normal, c = dcol[Math.floor(DR() * 4)], wvC = sl.wvOf(x), dsl = { ...sl, cx: x, cz: z, wvOf: () => wvC };
      for (let i = 0; i < pp.count; i += 3) vb.tri(...[0, 1, 2].map((k2) => mkv([pp.getX(i + k2), pp.getY(i + k2), pp.getZ(i + k2)], [nn.getX(i + k2), nn.getY(i + k2), nn.getZ(i + k2)], c, dsl, 1, [0, 0], [0, 0, 0, 2])));
    }
  }
  const rm = lookOnly(new THREE.Mesh(vb.geo(), shaderMat(U, {}, ROAD_VS, ROAD_FS, { side: THREE.DoubleSide })), 1); g.add(rm);
  // ---- fill plane: a scorched surface over the hole once the wave has passed
  const fillG = new THREE.BufferGeometry(), fp = [], fi = [];
  [[-15, 5, -182, -12], [-60, 60, -57, -31]].forEach(([x0, x1, z0, z1], k) => { fp.push(x0, -60.02, z1, x1, -60.02, z1, x1, -60.02, z0, x0, -60.02, z0); fi.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); });
  fillG.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3)); fillG.setIndex(fi);
  const gm = shaderMat(U, { uTex: { value: groundTex() }, uHole: { value: 0 }, uFill: { value: 1 } }, GND_VS, GND_FS, { side: THREE.DoubleSide });
  gm.polygonOffset = true; gm.polygonOffsetFactor = -2; gm.polygonOffsetUnits = -2;
  if (S.hole ?? 1) g.add(lookOnly(new THREE.Mesh(fillG, gm), 0));
  // ---- fire: 10 clusters beside damaged cars: 2 flames, 2 smoke puffs, 1 glow each
  const fv = new VB([["position", 3], ["aP", 4], ["aQ", 4], ["aS", 4], ["aF", 4]]), CORN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const burning = [0, 1, 2, 4, 5, 7, 9, 10, 12, 14];
  if ((S.fire ?? 1) > 0) burning.forEach((ci, rank) => {
    const car = cars[ci], c = car.sl, sdir = car.x < Cx(car.z) ? -1 : 1, bx = car.x + sdir * (car.W / 2 + 0.2), bz = car.z + (R() - 0.5) * car.L * 0.6, by = -60 + 0.35;
    const add = (kind, dx, dy, dz, size, variant, phase, dirx) => { const ids = CORN.map(([cx, cy]) => fv.v({ position: [bx + dx, by + dy, bz + dz], aP: [bx + dx, by + dy, bz + dz, size], aQ: [cx, cy, kind, variant], aS: [c.ox, 0, c.prs, car.wv], aF: [rank, phase, R(), dirx] })); fv.quad(...ids); };
    add(2, 0, 0, 0, 1.5 + 0.4 * R(), 0, 0, 0);
    for (let q = 0; q < 7; q++) { const a = (q / 7) * Math.PI * 2 + R(), r = 0.3 + 1.1 * R(); add(0, Math.cos(a) * r, 0, Math.sin(a) * r * (car.L / 3), 0.55 + 0.45 * R(), q & 1, R(), 0); }
    add(1, 0, 0.6, 0, 1.3, 0, 0.15, sdir * 0.6); add(1, 0, 0.6, 0, 1.6, 1, 0.62, sdir * 0.9); add(1, 0, 0.6, 0, 1.1, 2, 0.88, sdir * 0.3); add(1, 0, 0.6, 0, 1.5, 1, 0.38, sdir * 0.5);
  });
  const fm = lookOnly(new THREE.Mesh(fv.geo(), shaderMat(U, { uMapF: { value: flameTex() }, uMapS: { value: billowTex() } }, FIRE_VS, FIRE_FS, { transparent: true, depthWrite: false })), 8); g.add(fm);
  return {
    grip: 0,
    stats: { slabs: slabs.length, tris: vb.idx.length / 3, cars: cars.length, fires: burning.length },
    apply(ps) {
      const t = ps.t ?? S.t ?? -1;
      U.uT.value = t; U.uCol.value = Pk(...TL.collapse, t); U.uSt.value = Pk(...TL.street, t); U.uSF.value = Pk(...TL.streetFire, t);
      const a = Pk(...TL.afterglow, t); U.uAfter.value = a < 0.5 ? lerp(1, 0.69, a * 2) : lerp(0.69, 0.25, (a - 0.5) * 2);
    },
  };
}

export const GRAVRUIN_KINDS = { gruin: buildRuin, grupture: buildRupture };
