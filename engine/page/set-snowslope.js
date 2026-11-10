import * as THREE from "three";
import { rng } from "./util.js";

// "snowslope" (Survive it EP1 "Snowed in", task T2, 9 Nov 2026): the snowy mountain world round the cottage. Jonny's
// panels 06-08: the cottage rides an avalanche down a moonlit slope, firs flipping; on DAY 100 the four step out under a
// high sun with the mountain's white cap above the roof; the cap breaks away and buries the cottage, the bare grey peak
// and its avalanche track behind. The room (set-snowcottage.js) stands at the origin; this is everything outside it.
//
// x right, z toward the inside cameras, y up, metres. The valley floor is y 0 round the origin, snow with soft drifts
// (none within 9 m, none along the ride's channel |z| < 8). The mountain stands toward +x: a 30-degree apron along the
// fall line (down toward -x) from x 30 (the knee x 20..40) to x 400, then the rock face up to the peak (SNOWSLOPE.peak,
// 1050 m high at x 1250), grey rock with snow patches, forest on its lower flanks; side ridges close the valley in z,
// low hills behind it (-x). The top third is bare rock here: the `snowcap` prop (props-avalanche.js) lies on it.
// A few hundred white-capped firs (the forest set's pointy fir, instanced) stand in clumps round the valley and on the
// apron's sides, none within 12 m of the origin and none in the ride's channel (|z| < 26 on the apron). A sky dome all
// round: day (dark 0) a high sun, blue sky, a few clouds, blue snow shadows; night (dark 1) a big moon over the ridge,
// stars, the snow glowing blue-white.
//
// Far geometry: the cameras' far plane is 300 m (stage.js) and the peak is 1.3 km away, so every surface here and in
// props-avalanche.js is drawn through farClip: beyond FAR.d0 (120 m) a vertex slides along its own view ray toward the
// camera (its distance d becomes d0 + w * ln(1 + (d - d0) / w), at most about 290 m). A ray keeps its direction, so the
// picture is the same as at full size; only the depth buffer sees the world compressed. Haze uses the real distance.
// All of it is lit by its own shader (snowMaterial): a cel sun or moon (`dark` mixes them) with blue shadows, shared
// uniforms (SNOWLIGHT) the set's clock sets each frame, so the world and the avalanche props change day and night
// together, in any look (looks.js leaves shader materials as they are). Nothing here is solid for the contact checks.
//
// spec: { type: "snowslope", seed, dark: [[t, 0..1], ...] (eased between keys, a step at equal times; or a number) }
// SNOWSLOPE: the numbers, heightAt(x, z), slopeAt(x) (the ground along the fall line, z 0), ridePath(u).

const T30 = Math.tan(Math.PI / 6);
const PEAK = { x: 1250, z: 120, y: 1050 };
// the cottage's run: from x 140 up the apron down the fall line to the origin; the apron's knee flattens it over x 40..20
// and the last 20 m are level valley floor (the cottage "ploughs into the valley floor and STOPS" there)
const RIDE = { x0: 140, x1: 0 };
export const FAR = { d0: 120, w: 36 };

// ---------- the ground ----------
function hash2(i, j) {   // integer lattice hash -> 0..1 (deterministic, no Math.random)
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, z) {   // smooth value noise, 0..1
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const ridged = (x, z) => 1 - Math.abs(2 * vnoise(x, z) - 1);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const softAbs = (d, r) => Math.sqrt(d * d + r * r) - r;
const softplus = (v, k) => (v / k > 30 ? v : k * Math.log1p(Math.exp(v / k)));
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0); return Math.max(a, b) + (h * h) / (4 * k); };

// the apron along the fall line: level to x 20, a knee to x 40, 30 degrees to x 400, then easing into the face's foot
export function slopeAt(x) {
  if (x <= 20) return 0;
  if (x <= 40) return (T30 * (x - 20) ** 2) / 40;
  if (x <= 400) return T30 * (x - 30);
  return T30 * 370 + 40 * (1 - Math.exp((-(x - 400) * T30) / 40));
}
function slopeDeriv(x) {
  if (x <= 20) return 0;
  if (x <= 40) return (T30 * (x - 20)) / 20;
  if (x <= 400) return T30;
  return T30 * Math.exp((-(x - 400) * T30) / 40);
}
// the peaks: the main one (a pyramid with a steep face toward the valley) and three lower shoulders behind and beside it
const PEAKS = [
  { ...PEAK, face: 1.065, back: 1.0, side: 0.78 },
  { x: 1480, z: -720, y: 830, face: 0.95, back: 1.0, side: 0.8 },
  { x: 1650, z: 860, y: 900, face: 0.95, back: 1.0, side: 0.8 },
  { x: 2050, z: 250, y: 990, face: 0.9, back: 1.0, side: 0.8 },
];
function peaksAt(x, z) {
  let h = -1e9;
  for (const p of PEAKS) {
    const dx = x - p.x, dz = z - p.z;
    h = smax(h, p.y - (dx < 0 ? p.face : p.back) * softAbs(dx, 30) - p.side * softAbs(dz, 40), 60);
  }
  return h;
}
// the ground: { y, face (0..1: how much of it is the mountain's rock face), apron }
function ground(x, z) {
  const a = slopeAt(x), r = Math.hypot(x, z);
  const sides = 0.42 * softplus(Math.abs(z) - 700, 30) + 0.38 * softplus(-x - 420, 30);
  let h = a + sides;
  const pk = peaksAt(x, z);
  const face = sstep(-20, 90, pk - h);
  h = smax(h, pk, 50);
  // rock: ridges and gullies on the face and the far ridges
  const rough = Math.max(face, sstep(40, 260, sides));
  if (rough > 0) h += rough * (95 * (ridged(x / 170, z / 170) - 0.5) + 32 * (ridged(x / 58 + 7.1, z / 58 - 3.3) - 0.5) + 10 * (vnoise(x / 19, z / 19) - 0.5));
  // big soft undulations far off, soft drifts near: none within 9 m, none along the ride's channel
  const far = sstep(400, 1100, r) * (1 - face);
  if (far > 0) h += far * 110 * (vnoise(x / 320 + 3.7, z / 320 + 1.3) - 0.5);
  const chan = x > -40 && x < 480 ? sstep(8, 22, Math.abs(z)) : 1;
  const near = sstep(9, 16, r) * chan * (1 - face);
  if (near > 0) h += near * (1.0 * (vnoise(x / 21, z / 21) - 0.5) + 0.12 * (vnoise(x / 8 + 9, z / 8) - 0.5)) * Math.min(1, 0.4 + r / 60);
  return { y: h, face };
}
export const heightAt = (x, z) => ground(x, z).y;

// the cottage's ride: u 0 at x 140 up the apron, 1 at the origin (level, yaw 0); u runs linearly in x along the fall line.
// pitch: degrees the floor tips with the ground (+: its +x side higher, as on the apron)
export function ridePath(u) {
  const k = Math.min(1, Math.max(0, u)), x = RIDE.x0 + (RIDE.x1 - RIDE.x0) * k;
  return { at: [x, slopeAt(x), 0], yaw: 0, pitch: (Math.atan(slopeDeriv(x)) * 180) / Math.PI };
}

// ---------- light: the sun by day, the moon by night (`dark`), shared by every material here and the avalanche props ----------
const dir = (az, el) => { const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180; return new THREE.Vector3(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)); };
// the discs in the sky (azimuth from +x toward +z, elevation): the sun high over the mountain's right shoulder, the moon
// over the ridge. The light comes from the camera side (upper left, front) so faces toward the valley are lit: a
// painter's cheat, as on Jonny's panels (07: the sun behind the roof, the doorway lit)
const SKY = { sun: dir(28, 52), moon: dir(-14, 47), lightDay: new THREE.Vector3(-0.36, 0.8, 0.48).normalize(), lightNight: new THREE.Vector3(-0.22, 0.76, 0.61).normalize() };
const C = (h) => new THREE.Color(h);
const DAY = { lit: C("#e8effc"), shade: C("#97afe0"), glow: C("#000000"), haze: C("#d0e0f2") };
const NIGHT = { lit: C("#7088c8"), shade: C("#23356e"), glow: C("#101a3c"), haze: C("#16254f") };
export const SNOWLIGHT = {
  uDark: { value: 0 }, uL: { value: new THREE.Vector3() }, uLit: { value: new THREE.Color() }, uShade: { value: new THREE.Color() },
  uGlow: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uHazeD: { value: 2600 }, uHazeMax: { value: 0.72 },
  uFarD0: { value: FAR.d0 }, uFarW: { value: FAR.w },
};
export function setDark(k) {
  const d = Math.min(1, Math.max(0, k)), U = SNOWLIGHT;
  U.uDark.value = d;
  U.uL.value.copy(SKY.lightDay).lerp(SKY.lightNight, d).normalize();
  for (const [u, key] of [[U.uLit, "lit"], [U.uShade, "shade"], [U.uGlow, "glow"], [U.uHaze, "haze"]]) u.value.copy(DAY[key]).lerp(NIGHT[key], d);
}
setDark(0);
// keys [[t, v], ...]: eased (smoothstep) between keys, a step where two keys share a time; a number is a constant
export function keyAt(K, t, def = 0) {
  if (K == null) return def;
  if (typeof K === "number") return K;
  if (!K.length) return def;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i + 1 < K.length; i++) {
    const [t0, v0] = K[i], [t1, v1] = K[i + 1];
    if (t >= t0 && t < t1) { const u = (t - t0) / (t1 - t0), e = u * u * (3 - 2 * u); return v0 + (v1 - v0) * e; }
  }
  return K[K.length - 1][1];
}

// ---------- the material: a cel sun or moon, blue shadows, haze, far compression ----------
const VS_HEAD = `
uniform float uFarD0, uFarW, uPull, uPullK;
varying vec3 vW; varying vec3 vN; varying float vDist; varying vec2 vUv;
#ifdef VCOL
attribute vec3 aCol; varying vec3 vCol;
#endif
// the far compression: a point beyond uFarD0 slides along its view ray toward the camera (picture unchanged); uPull
// (metres) and uPullK (a share of the distance) draw a surface lying on another (the cap on the rock) a little
// nearer, without moving it on screen
vec4 farClip(vec3 w) {
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float d = length(mv.xyz); vDist = d;
  float dd = d > uFarD0 ? uFarD0 + uFarW * log(1.0 + (d - uFarD0) / uFarW) : d;
  dd = max(dd * (1.0 - uPullK) - uPull, 0.06);
  mv.xyz *= dd / max(d, 1e-5);
  return projectionMatrix * mv;
}
mat3 rotAxis(vec3 a, float ang) {
  float s = sin(ang), c = cos(ang), oc = 1.0 - c;
  return mat3(oc * a.x * a.x + c, oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
              oc * a.x * a.y - a.z * s, oc * a.y * a.y + c, oc * a.y * a.z + a.x * s,
              oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c);
}
float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
`;
const FS_HEAD = `
uniform float uDark, uHazeD, uHazeMax, uOpacity;
uniform vec3 uL, uLit, uShade, uGlow, uHaze, uColor, uEmit;
varying vec3 vW; varying vec3 vN; varying float vDist; varying vec2 vUv;
#ifdef VCOL
varying vec3 vCol;
#endif
#ifdef MAP
uniform sampler2D uMap;
#endif
vec3 litShade(vec3 alb, vec3 N, float glowK) {
  float ndl = dot(N, uL);
  float k = smoothstep(-0.06, 0.1, ndl);
  vec3 L = mix(uShade, uLit, k) + uLit * 0.08 * smoothstep(0.62, 0.8, ndl);
  return alb * L + alb * uGlow * glowK;
}
float hz(float d) { return (1.0 - exp(-d / uHazeD)) * uHazeMax; }
`;
// the shader heads, for effects that draw their own way (camera-facing spray)
export const SNOW_GLSL = { vs: VS_HEAD, fs: FS_HEAD };
// opts: color, map, vcol (an aCol attribute), emit, opacity, pull, pullK, side, transparent, depthWrite, vHead, vPre (may
// change pos, nor, M), vPost (may change vW, vN), fHead, fBody (may change alb, alpha, emit, glowK, N), uniforms
export function snowMaterial(o = {}) {
  const defines = { ...(o.vcol && { VCOL: "" }), ...(o.map && { MAP: "" }), ...(o.side === THREE.DoubleSide && { DOUBLE: "" }), ...(o.defines || {}) };
  const m = new THREE.ShaderMaterial({
    defines,
    uniforms: { ...SNOWLIGHT, uColor: { value: new THREE.Color(o.color ?? "#ffffff") }, uEmit: { value: new THREE.Color(o.emit ?? "#000000") },
      uOpacity: { value: o.opacity ?? 1 }, uPull: { value: o.pull ?? 0 }, uPullK: { value: o.pullK ?? 0 }, ...(o.map && { uMap: { value: o.map } }), ...(o.uniforms || {}) },
    vertexShader: `${VS_HEAD}
${o.vHead || ""}
void main() {
  vec3 pos = position; vec3 nor = normal; vUv = uv;
#ifdef VCOL
  vCol = aCol;
#endif
  mat4 M = modelMatrix;
#ifdef USE_INSTANCING
  M = M * instanceMatrix;
#endif
  ${o.vPre || ""}
  vec4 w4 = M * vec4(pos, 1.0); vW = w4.xyz; vN = normalize(mat3(M) * nor);
  ${o.vPost || ""}
  gl_Position = farClip(vW);
}`,
    fragmentShader: `${FS_HEAD}
${o.fHead || ""}
void main() {
  vec3 N = normalize(vN);
#ifdef DOUBLE
  if (!gl_FrontFacing) N = -N;
#endif
  vec3 alb = uColor; float alpha = uOpacity; vec3 emit = uEmit; float glowK = 1.0;
#ifdef VCOL
  alb *= vCol;
#endif
#ifdef MAP
  alb *= texture2D(uMap, vUv).rgb;
#endif
  ${o.fBody || ""}
  vec3 c = litShade(alb, N, glowK) + emit;
  c = mix(c, uHaze, hz(vDist));
  gl_FragColor = vec4(c, alpha);
  #include <colorspace_fragment>
}`,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true,
  });
  m.userData.noOutline = true; m.userData.solid = o.solid ?? false;
  return m;
}
// a mesh drawn through farClip: never frustum-culled (its real place can lie past the far plane)
export function farMesh(geo, mat, parent, name) {
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
  // look-only: the drawn look's ground ovals and hand rays skip it (a prop's oval would cover its whole box)
  if (name) m.name = name; m.userData.solid = mat.userData.solid ?? false; m.userData.lookOnly = true; if (parent) parent.add(m); return m;
}

// ---------- the fir: the forest set's pointy fir (a trunk and three stacked cones), white-capped, 1 m tall ----------
// set-forest.js builds it inline: same proportions here (trunk 0.6, cones r 0.75/0.57/0.39 x 0.9 at 0.75/1.25/1.75, 2.2
// tall in its units), scaled to 1 m and merged with snow caps into one geometry with an aCol colour attribute
export function firGeometry() {
  const parts = [], k = 1 / 2.2;
  const add = (g, col, y) => {
    g.translate(0, y, 0); g.scale(k, k, k);
    const n = g.attributes.position.count, c = new Float32Array(n * 3), cc = new THREE.Color(col);
    for (let i = 0; i < n; i++) { c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
    g.setAttribute("aCol", new THREE.BufferAttribute(c, 3)); g.deleteAttribute("uv");
    parts.push(g.index ? g.toNonIndexed() : g);
  };
  add(new THREE.CylinderGeometry(0.07, 0.1, 0.6, 7), "#6b4a34", 0.3);
  for (let i = 0; i < 3; i++) {
    const r = 0.75 - i * 0.18, y = 0.75 + i * 0.5;
    add(new THREE.ConeGeometry(r, 0.9, 10, 1), "#2f6a52", y);
    // the snow: a white cone over the tier's upper half and a soft white rim under its skirt
    add(new THREE.ConeGeometry(r * 0.62, 0.5, 10, 1), "#f4f7ff", y + 0.2 + 0.01);
    const rim = new THREE.TorusGeometry(r * 0.93, 0.06, 4, 10); rim.rotateX(Math.PI / 2); add(rim, "#eef3ff", y - 0.4);
  }
  // merge (all non-indexed, same attributes)
  const n = parts.reduce((s, g) => s + g.attributes.position.count, 0), out = new THREE.BufferGeometry();
  for (const key of ["position", "normal", "aCol"]) {
    const arr = new Float32Array(n * 3); let o = 0;
    for (const g of parts) { arr.set(g.attributes[key].array, o); o += g.attributes[key].array.length; }
    out.setAttribute(key, new THREE.BufferAttribute(arr, 3));
  }
  return out;
}
export const firMaterial = () => snowMaterial({ vcol: true });

// ---------- the sky ----------
function cloudTexture(rnd) {
  const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
  const x = c.getContext("2d"), W = c.width, H = c.height, row = (el) => H / 2 - (el / 90) * (H / 2);
  const puff = (cx, cy, r, sx, c0, c1) => {
    for (const ox of [-W, 0, W]) {
      const g = x.createRadialGradient(cx + ox - r * 0.2, cy - r * 0.25, r * 0.1, cx + ox, cy, r);
      g.addColorStop(0, c0); g.addColorStop(0.72, c0); g.addColorStop(1, c1);
      x.fillStyle = g; x.beginPath(); x.ellipse(cx + ox, cy, r * sx, r, 0, 0, Math.PI * 2); x.fill();
    }
  };
  // a few clumps of fair-weather cumulus: flat shadowed bases, rounded lit tops; many small, few big, in groups
  const clumps = [[0.08, 9, 1.0], [0.16, 14, 0.55], [0.31, 6, 0.8], [0.47, 17, 0.45], [0.58, 8, 1.2], [0.71, 12, 0.6], [0.86, 7, 0.9], [0.93, 21, 0.4]];
  for (const [u0, el, big] of clumps) {
    const u = (u0 + (rnd() - 0.5) * 0.03) * W, base = row(el), stretch = 1 / Math.cos((el * Math.PI) / 180), n = 8 + Math.floor(big * 14), wide = 90 * big * stretch;
    for (let i = 0; i < n; i++) { const r = (14 + rnd() * 24) * big; puff(u + (rnd() - 0.5) * wide * 2, base - r * 0.1, r, stretch * 1.25, "rgba(196,212,236,0.97)", "rgba(196,212,236,0)"); }
    for (let i = 0; i < n * 1.3; i++) { const t = rnd(), r = (14 + rnd() * 30) * big * (1 - t * 0.35); puff(u + (rnd() - 0.5) * wide * 1.8 * (1 - t * 0.4), base - r * 0.55 - t * 52 * big, r, stretch, "rgba(255,255,255,1)", "rgba(255,255,255,0)"); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;   // no mipmaps: no seam where u wraps
  return t;
}
function buildSky(rnd) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uDark: SNOWLIGHT.uDark, uSun: { value: SKY.sun.clone() }, uMoon: { value: SKY.moon.clone() }, uClouds: { value: cloudTexture(rnd) } },
    vertexShader: `varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; gl_Position.z = gl_Position.w * 0.99999; }`,
    fragmentShader: `uniform float uDark; uniform vec3 uSun, uMoon; uniform sampler2D uClouds; varying vec3 vDir;
float h3(vec3 p) { p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir); float el = d.y;
  // day: a deep blue zenith to a pale horizon; below it the haze of the far snowfields
  vec3 day = mix(vec3(0.62, 0.78, 0.93), vec3(0.24, 0.49, 0.86), smoothstep(0.02, 0.32, el));
  day = mix(day, vec3(0.09, 0.27, 0.70), smoothstep(0.3, 0.95, el));
  day = mix(day, vec3(0.70, 0.80, 0.92), smoothstep(0.0, -0.15, el));
  float sd = max(dot(d, uSun), 0.0);
  day += vec3(1.0, 0.92, 0.75) * (pow(sd, 18.0) * 0.18 + pow(sd, 260.0) * 0.6);
  day = mix(day, vec3(1.0, 0.98, 0.9), smoothstep(0.99905, 0.99925, sd));
  // night: navy to a lighter blue band over the snow, stars, the moon and its halo
  vec3 night = mix(vec3(0.06, 0.11, 0.26), vec3(0.018, 0.03, 0.09), smoothstep(0.0, 0.7, el));
  night = mix(night, vec3(0.05, 0.09, 0.2), smoothstep(0.0, -0.15, el));
  vec3 p = d * 170.0, c = floor(p), f = fract(p);
  float r = h3(c), star = 0.0;
  if (r > 0.975) { vec3 sp = vec3(h3(c + 1.3), h3(c + 2.7), h3(c + 4.1)) * 0.5 + 0.25; star = smoothstep(0.16, 0.0, length(f - sp)) * (0.35 + 0.65 * h3(c + 7.7)); }
  night += vec3(0.85, 0.9, 1.0) * star * smoothstep(0.04, 0.22, el);
  float md = max(dot(d, uMoon), 0.0);
  night += vec3(0.45, 0.55, 0.85) * (pow(md, 30.0) * 0.16 + pow(md, 400.0) * 0.35);
  float disc = smoothstep(0.99868, 0.99888, md);
  vec3 mt = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0))), mb = cross(mt, uMoon); vec2 q = vec2(dot(d - uMoon, mt), dot(d - uMoon, mb)) / 0.048;
  float spots = smoothstep(0.32, 0.1, length(q - vec2(-0.25, 0.2))) * 0.12 + smoothstep(0.22, 0.05, length(q - vec2(0.3, -0.15))) * 0.1 + smoothstep(0.16, 0.03, length(q - vec2(0.05, -0.42))) * 0.08;
  night = mix(night, vec3(1.0, 0.97, 0.86) * (1.0 - spots), disc);
  // clouds: white heaps by day, faint blue-grey by night
  vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(el, -1.0, 1.0)) / 3.1415927 + 0.5);
  vec4 cl = texture2D(uClouds, uv);
  day = mix(day, cl.rgb, cl.a);
  night = mix(night, cl.rgb * vec3(0.2, 0.25, 0.42), cl.a * 0.6 * (1.0 - disc));
  gl_FragColor = vec4(mix(day, night, uDark), 1.0);
  #include <colorspace_fragment>
}`,
    // transparent: drawn after the solid world, only where nothing else is (depth 1); keeps it out of physics and holds
    depthWrite: false, transparent: true, side: THREE.BackSide,
  });
  m.userData.noOutline = true; m.userData.solid = false;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), m);
  sky.renderOrder = -1000; sky.frustumCulled = false; sky.name = "set-snowslope-sky"; sky.userData.solid = false;
  return sky;
}

// ---------- the ground mesh: one grid, fine round the origin, coarser with distance ----------
function axis(lo, hi, k) {   // cell size 1 + k |v|
  const out = [0];
  for (let v = 0; v < hi;) { v += 1 + k * v; out.push(Math.min(v, hi)); if (v >= hi) break; }
  const neg = [];
  for (let v = 0; v > lo;) { v -= 1 + k * -v; neg.push(Math.max(v, lo)); if (v <= lo) break; }
  return [...neg.reverse(), ...out];
}
function buildGround(g, S) {
  const xs = axis(-2600, 2900, 0.022), zs = axis(-2600, 2600, 0.03), nx = xs.length, nz = zs.length;
  const pos = new Float32Array(nx * nz * 3), face = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], q = ground(x, z), k = j * nx + i;
    // S.pad { x, z0, z1, drop }: the ground dips under a room standing on it (a room floor at y 0 would z-fight with it)
    const dip = S.pad && Math.abs(x) <= S.pad.x && z >= S.pad.z0 && z <= S.pad.z1 ? S.pad.drop : 0;
    pos[k * 3] = x; pos[k * 3 + 1] = q.y - dip; pos[k * 3 + 2] = z; face[k] = q.face;
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let n = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  // colours: snow where it can lie, grey rock where it's steep and on the face (bare in the top third: the cap prop),
  // snow-dusted forest on the lower flanks; a slight blue in the valley's hollows
  const nor = geo.attributes.normal, col = new Float32Array(nx * nz * 3), c = new THREE.Color();
  const SNOW = C("#f6f9ff"), SNOWB = C("#e3ecfb"), ROCK = C("#80858f"), ROCKD = C("#545964"), FOREST = C("#46705f");
  const capY = PEAK.y * (2 / 3);
  for (let k = 0; k < nx * nz; k++) {
    const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2], steep = 1 - nor.getY(k), f = face[k];
    const rockTone = vnoise(x / 40 + 3, z / 40) * 0.6 + vnoise(x / 11, z / 11 + 5) * 0.4;
    c.copy(ROCK).lerp(ROCKD, rockTone);
    let snow = sstep(0.42, 0.24, steep);
    snow *= 1 - f * (0.55 + 0.35 * sstep(0.45, 0.65, vnoise(x / 70, z / 70)));   // the face: snow in patches and gullies
    if (y > capY - 25 && Math.abs(z - PEAK.z) < 640 && x > 500 && x < 1850) snow *= sstep(capY - 5, capY - 25, y);   // the top third: bare (the cap lies on it)
    snow = Math.min(1, Math.max(0, snow));
    const forest = sstep(0.5, 0.62, vnoise(x / 95 + 11, z / 95 - 4)) * sstep(90, 160, y) * sstep(560, 430, y) * sstep(0.5, 0.3, steep) * (1 - sstep(0, 1, x > -40 && x < 470 && Math.abs(z) < 90 ? 1 : 0));
    const sn = new THREE.Color().copy(SNOW).lerp(SNOWB, vnoise(x / 30 + 1, z / 30) * 0.7);
    c.lerp(sn, snow);
    if (forest > 0) c.lerp(new THREE.Color().copy(FOREST).lerp(SNOW, 0.28 + 0.25 * vnoise(x / 9, z / 9)), forest * 0.9);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
  const m = farMesh(geo, snowMaterial({ vcol: true }), g, "set-snowslope-ground");
  return m;
}

// ---------- the firs: clumps round the valley and up the apron's sides ----------
function buildFirs(g, rnd) {
  const spots = [];
  const okAt = (x, z) => {
    if (Math.hypot(x, z) < 12) return false;
    if (x > -45 && x < 470 && Math.abs(z) < 26) return false;   // the ride's channel
    return true;
  };
  const clump = (cx, cz) => {
    const n = 2 + Math.floor(rnd() ** 2 * 11), spread = 4 + rnd() * 10;
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * spread, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (!okAt(x, z)) continue;
      const q = ground(x, z); if (q.face > 0.3) continue;
      spots.push([x, q.y - 0.25, z, 5 + rnd() ** 2.2 * 15, rnd() * Math.PI * 2, 0.85 + rnd() * 0.3]);
    }
  };
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 24 + rnd() ** 1.4 * 230; clump(Math.cos(a) * r, Math.sin(a) * r); }
  for (let i = 0; i < 32; i++) { const s = rnd() < 0.5 ? -1 : 1; clump(40 + rnd() * 380, s * (34 + rnd() ** 1.3 * 380)); }
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, r = 260 + rnd() * 380; clump(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = firGeometry(), im = new THREE.InstancedMesh(geo, firMaterial(), spots.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  spots.forEach(([x, y, z, h, yaw, w], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw); s.set(h * w, h, h * w); p.set(x, y, z); M.compose(p, q, s); im.setMatrixAt(i, M); });
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = "set-snowslope-firs"; im.userData.solid = false; g.add(im);
  return spots.length;
}

// the world alone (the "snowslope" set, the benches) and inside the "snowcottage" set
export function buildSnowWorld(scene, S = {}) {
  const rnd = rng((S.seed || 11) * 733 + 5), g = new THREE.Group(); g.name = "set-snowslope"; scene.add(g);
  scene.background = new THREE.Color("#d6e6f6");
  g.add(buildSky(rnd));
  buildGround(g, S);
  SNOWSLOPE.firs = buildFirs(g, rnd);
  const dark = S.dark;
  setDark(keyAt(dark, 0));
  (globalThis.__setTicks ||= []).push((t) => setDark(keyAt(dark, t)));
  return g;
}

export const SNOWSLOPE = {
  peak: { ...PEAK }, capY: PEAK.y * (2 / 3), apron: { x0: 30, x1: 400, deg: 30, knee: [20, 40] }, ride: { ...RIDE },
  faceFoot: 480,   // x where the rock face rises out of the apron (z 0)
  clear: 12, far: { ...FAR }, sun: SKY.sun.toArray(), moon: SKY.moon.toArray(), firs: 0,
  heightAt, slopeAt, ridePath, keyAt,
};
