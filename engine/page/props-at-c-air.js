// Ancient aliens EP03 Atlantis, block C2 (task block-c/briefs/C2.md): BIMINI FROM ABOVE. The clear shallows seen from a drone, the low palm island on
// the horizon, the white cabin boat and its shadow on the sand, cumulus towers in a deep blue sky. Look target: plate 27 (plate-27-bimini-aerial.png), panel 27.
// Bench: storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-c-air.mjs (+ at-c-air-sheet.png, at-c-air-vs.png). Exports C_AIR_KINDS, C_AIR_GRIPS = {} (nothing is held).
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, sea level y 0, the sand floor y -5.5 (drawn by C1's `biminibed`).
// Origin of every kind = the place's centre (the clip puts the prop at the place's x, z, kit at-kit.mjs P.bimini); the island is at spec.at inside it.
// Everything is lookOnly scenery (surfaceOnly), none of it solid. No Math.random, no wall clock: motion is the clip clock t and params. A param tweens only when seeded
// by a dur-0 set (c.prop(0, id, { rock: 1 }, 0)); spec.<name> is its start value.
//
// !! Far plane: the clip's `far` is 1500. The sea disc is camera * far * 0.965 = 1447 m, the dome and the clouds are pinned to the far plane. The island's near
//    beach sits ~1350 m out from the origin: a camera more than ~120 m in front of the origin (z > 120) clips it. Keep the high shots at z <= 100, or move it with spec.at.
// !! Draw order: dome -100, clouds -99, then after C1's bed and road (1000-1005): boat shadow 1009 (on the sand), sea 1010 / 1010.5 (a multiply pass and a light pass: you see the floor, reef, road and hull through it), ripple ring and surf 1011.
//
//   biminisea    the sea seen from ABOVE (it draws nothing while the camera y < spec.level 0; C1's biminibed draws the underside). A camera-following disc to the horizon
//                (radius far * 0.965), flat at y 0 (the ripples are in the shading, not in the vertices, so the boat and the beach meet it cleanly). It does not cover the
//                floor: it is a transparent skin with Beer-law depth tint (floor 5.5 m down reads #2fc4c0 straight below, #1aa0b0 far out; the light path is refracted, so even
//                at grazing angles the floor, the reef and the 219 blocks show through), Fresnel sky reflection that takes over toward the horizon, a net of moving
//                white caustic lines (three cell sizes, 0.4 / 1.2 / 3.6 m, each fading where it would be under 5 px), long white sun streaks and a few real glints
//                where a ripple facet throws the sun at the lens. Origin = the place's centre (x, z), y = the sea level.
//                spec.sunAz 20 / spec.sunEl 55 (AT_DAY; degrees as the sea kit: az left of -z), spec.reach 2600 (hides when the camera is farther than this from the origin),
//                spec.depth 5.5 (floor depth in m), spec.clarity 1 (1 = 5.5 m reads #2fc4c0; 0.5 = murkier, 1.5 = glassier), spec.glint 1, spec.net 1 (caustic line strength), spec.scatter 1 (the water's own colour). With C1's biminibed under it (it already grades the bed from above) use clarity 2, scatter 0.55, net 0.9.
//                params: sunAz, sunEl, glint (0..1).
//   biminiisle   the low island on the horizon, real 3D: a heightfield 600 m along x (spec.len 600) by 110 m deep, a white sand rim with a drawn surf line, a pale shelf under
//                the water round it, dense jungle (40 leaning palms each its own, ~110 broadleaf and bush clumps, a few gold ones), a path-worn clearing, 6 small houses (white
//                walls, grey / teal roofs, ONE red roof right of centre as the plate) with dark windows, a sliver of a second island far left. spec.at [0, -1400] (the island's centre
//                in place metres), spec.len 600, spec.size 1.8 (whole island, about its centre: 1.8 reads as the painting's bigger island at a drone's distance), spec.palms 40,
//                spec.sliver true (the far second island), spec.seed 1. Standable: none.
//   biminiboat   a white 9 m cabin boat (beam 3.0): lofted hull (dark red bottom, red boot stripe, white topside, teak cap rail), teak deck planks, a cabin with a slanted dark
//                windscreen and side windows, a BLUE canopy on four poles over the aft deck, a mast with a radar dome, a red pennant and an antenna, bow rail and pulpit, fenders,
//                an orange life ring, crates, a rope coil and an outboard on the transom. It rocks gently on the clip clock. Its SHADOW lies on the sand spec.depth (5.5) m below,
//                projected along the refracted sun (each part displaced by its own height), soft, and a faint ring of ripples and a thin foam line hug the hull at the waterline.
//                Origin = the hull's centre at the waterline (y 0), bow toward -z, +x starboard-right when it heads -z. spec.rock 1 (param rock 0..1: 0 = still), spec.depth 5.5,
//                spec.sunAz 20, spec.sunEl 55 (the shadow's direction: keep them equal to the sea's), spec.canopy "#2b63b8", spec.shadow true. Standable: none.
//   biminisky    THE CUMULUS SKY, reusable at any place (C3 Port Royal, C5 the marble step: put it at the place's x, z): a dome (zenith #1f6fd8, mid #3f8fe6, horizon
//                #7ab8f0, sea-coloured #0f7fa8 below the horizon so the sea disc's rim never shows) wearing a PAINTED cloud panorama: the skies of plate 31 and plate 27, cropped
//                above their horizons, cleaned (sailboat, coast and island left out), resized, mirrored and offset into a 4096 x 384 strip that runs 360 deg round the horizon from
//                0 to 33.75 deg elevation, feathered into each other so no seam or repeat shows, its top rows baked to the gradient. File assets/props/atlantis/c/air-sky-pano.jpg
//                (146 KB; loaded async, the build waits). Dome and panorama follow the camera and are pinned to the far plane (nothing in the scene is hidden by them), like shsky.
//                spec.reach 2600 (draws only while the camera is within this of the prop's own x, z, so two places never mix), spec.sunAz 20 (a paler zone on the sun's side),
//                spec.seed 1 (turns the panorama about the horizon by seed * 49 deg: use another seed at each place so two places do not show the same clouds), spec.dome and
//                spec.cover are gone. A slow drift of the whole sky from the clip clock; no params.
//   biminiairfloor  BENCH STAND-IN for C1's `biminibed` (do not use in a clip): the sand plane at y -5.5, ~1000 reef clumps and the 219 road blocks, so the bench shows what the
//                water is for. Origin = block 0 of the road, blocks run along -z (pitch 3.65 m).
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hz = (a, b = 0) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const vn1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hz(i, seed), hz(i + 1, seed), u); };
const vn2 = (x, y, seed = 0) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); const h = (a, b) => hz(a * 57.1 + b * 13.7, seed + 3.3); return lerp(lerp(h(ix, iy), h(ix + 1, iy), ux), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy); };
const fbm2 = (x, y, seed = 0) => vn2(x, y, seed) * 0.55 + vn2(x * 2.1 + 5, y * 2.1 + 9, seed + 1) * 0.28 + vn2(x * 4.4 + 11, y * 4.4 + 3, seed + 2) * 0.17;
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const col = (hex) => new THREE.Color(hex);
const F = (n) => (Number.isInteger(n) ? `${n}.0` : `${+n.toFixed(6)}`);
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

function mark(o, { order } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = false; m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
function noLine(m) { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; }
function std(o = {}) { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o }); m.userData.noHatch = true; return m; }
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent;
  if (!s.isScene) return false;
  if (!s.userData.atHooks) { const list = (s.userData.atHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function (R, sc, cam) { if (prev) prev.apply(this, arguments); for (const f of list) f(cam); }; }
  s.userData.atHooks.add(fn); return true;
}
const sunDir = (az, el) => new THREE.Vector3(-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));

// ---- a merged-geometry builder: flat faces (vertices not shared) with one colour each, normals by computeVertexNormals
class MB {
  constructor() { this.p = []; this.c = []; this.i = []; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); return this.p.length / 3 - 1; }
  tri(a, b, c, k) { const n = this.v(...a, k); this.v(...b, k); this.v(...c, k); this.i.push(n, n + 1, n + 2); }
  quad(a, b, c, d, k) { this.tri(a, b, c, k); this.tri(a, c, d, k); }
  grid(rows, k, flip = false) {   // rows[j][i] = [x, y, z]: smooth shared vertices, one colour (or k(j, i) -> Color)
    const b = this.p.length / 3, nI = rows[0].length;
    rows.forEach((r, j) => r.forEach((p, i) => this.v(p[0], p[1], p[2], typeof k === "function" ? k(j, i) : k)));
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nI - 1; i++) { const a = b + j * nI + i, bb = a + 1, c = a + nI, d = c + 1; if (flip) this.i.push(a, bb, c, bb, d, c); else this.i.push(a, c, bb, bb, c, d); }
  }
  box(cx, cy, cz, sx, sy, sz, k) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], k); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], k);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], k); this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], k);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], k); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], k);
  }
  tube(a, b, r0, r1, k, n = 6) {   // a tapered tube between two points
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A).normalize(), u = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(d, u).normalize(), t = new THREE.Vector3().crossVectors(d, s).normalize(), ring = (P, r) => Array.from({ length: n }, (_, q) => { const an = (q / n) * TAU; return P.clone().addScaledVector(s, Math.cos(an) * r).addScaledVector(t, Math.sin(an) * r).toArray(); });
    const R0 = ring(A, r0), R1 = ring(B, r1);
    for (let q = 0; q < n; q++) { const q2 = (q + 1) % n; this.quad(R0[q], R0[q2], R1[q2], R1[q], k); }
  }
  blob(cx, cy, cz, rx, ry, rz, k, rot = 0) {   // a squashed icosahedron (flat faces)
    const g = once("ico0", () => new THREE.IcosahedronGeometry(1, 0)), pa = g.attributes.position, cr = Math.cos(rot), sr = Math.sin(rot);
    for (let f = 0; f < pa.count; f += 3) {
      const P = [0, 1, 2].map((q) => { const x = pa.getX(f + q) * rx, y = pa.getY(f + q) * ry, z = pa.getZ(f + q) * rz; return [cx + x * cr - z * sr, cy + y, cz + x * sr + z * cr]; });
      this.tri(P[0], P[1], P[2], k);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i);
    g.computeVertexNormals(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g;
  }
}
const C = (hex, v = 0, seed = 0) => { const c = col(hex); if (v) { const k = 1 + (hz(seed, 91) - 0.5) * v; c.multiplyScalar(k); } return c; };
const mixC = (a, b, k) => col(a).lerp(col(b), k);

// ================================================================================================ THE SKY: dome + cumulus
const SKY_TOP = "#1f6fd8", SKY_MID = "#3f8fe6", SKY_HOR = "#7ab8f0", SEA_FAR = "#0f7fa8";
const SKYFN = `
vec3 skyBase(float e) {
  vec3 c = mix(vec3HOR, vec3MID, smoothstep(0.0, 0.3, e));
  return mix(c, vec3TOP, smoothstep(0.25, 0.95, e));
}`;
const V3 = (hex) => { const c = col(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const skyGLSL = () => SKYFN.replace("vec3HOR", V3(SKY_HOR)).replace("vec3MID", V3(SKY_MID)).replace("vec3TOP", V3(SKY_TOP));

const DOME_VS = `varying vec3 vD; uniform float uReach; uniform vec2 uOrigin;
void main() { if (distance(cameraPosition.xz, uOrigin) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vD = vec3(0.0, 1.0, 0.0); return; } vD = position; vec3 p = cameraPosition + position * 1000.0; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); gl_Position.z = gl_Position.w * 0.99995; }`;
const DOME_FS = `varying vec3 vD; uniform float uSunAz, uPanoOn, uShift; uniform sampler2D uPano;
${skyGLSL()}
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  vec3 d = normalize(vD); float e = d.y;
  vec3 c;
  if (e >= 0.0) {
    c = skyBase(e);
    // a soft paler zone toward the sun's side, and faint thin cirrus streaks high up
    float az = atan(d.x, -d.z);
    c += vec3(0.06, 0.07, 0.05) * smoothstep(1.0, 0.0, abs(az + uSunAz * 0.01745)) * (1.0 - smoothstep(0.0, 0.7, e));
    float st = smoothstep(0.6, 0.85, vn(vec2(az * 9.0, e * 60.0)) * 0.6 + vn(vec2(az * 22.0, e * 130.0)) * 0.4) * smoothstep(0.18, 0.4, e) * (1.0 - smoothstep(0.5, 0.8, e));
    c = mix(c, vec3(0.9, 0.95, 1.0), st * 0.35);
    // the painted cloud panorama (plates 31 and 27 skies, cleaned, mirrored and offset round the whole horizon): rows 0..33.75 deg, its top rows ARE this gradient
    float el = degrees(asin(clamp(e, 0.0, 1.0)));
    if (uPanoOn > 0.5 && el < 33.75) {
      vec3 pc = texture2D(uPano, vec2(fract(az / 6.28318 + 0.5 + uShift), el / 33.75)).rgb;
      c = mix(c, pc, 1.0 - smoothstep(31.0, 33.75, el));
    }
  } else {
    c = ${V3(SEA_FAR)} * mix(1.0, 0.82, smoothstep(0.0, 0.2, -e));
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

function sq(x) { return x * x; }

const urlOf = (x) => `/${String(x).replace(/^\/+/, "")}`;
let panoJob = null;
const PANO = { value: null };
function loadPano() {
  return (panoJob ??= (async () => {
    const t = await new THREE.TextureLoader().loadAsync(urlOf("assets/props/atlantis/c/air-sky-pano.jpg"));
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; PANO.value = t;   // no mipmaps: the azimuth wrap would show as a one-pixel line
  })());
}
function biminisky(P) {
  const S = P.spec, seed = S.seed ?? 1, RU = { uReach: { value: S.reach ?? 2600 }, uOrigin: { value: new THREE.Vector2() } };
  const U = { uSunAz: { value: S.sunAz ?? 20 }, uReach: RU.uReach, uOrigin: RU.uOrigin, uPano: PANO, uPanoOn: { value: 0 }, uShift: { value: (seed * 0.137) % 1 } };
  const g = new THREE.SphereGeometry(1, 64, 32); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: true }); noLine(m);
  const me = new THREE.Mesh(g, m); me.name = "c-air-dome"; P.whole.add(mark(me, { order: -100 }));
  (globalThis.__loads ||= []).push(loadPano());
  return { grip: 0, apply(ps, t) { RU.uOrigin.value.set(ps.x, ps.z); U.uPanoOn.value = PANO.value ? 1 : 0; U.uShift.value = ((seed * 0.137) + t * 0.00004) % 1; } };
}

// ================================================================================================ THE SEA FROM ABOVE
const SEA_WAVES = [[0.9, 9, 0.7, 0.0], [-0.5, 14, 0.55, 1.7], [0.2, 7.5, 0.4, 3.1], [-0.85, 4.6, 0.28, 4.0], [0.6, 3.1, 0.2, 2.2], [-0.15, 2.0, 0.14, 5.3]];   // dir angle (rad from +z), k (rad/m), slope amplitude, phase
const wavesSlopeGLSL = () => SEA_WAVES.map(([an, k, a, ph], i) => `  { float w = sqrt(9.81 * ${F(k * 0.35)}); float ph = ${F(k)} * (${F(Math.sin(an))} * p.x + ${F(Math.cos(an))} * p.y) - w * ${F(0.9 + 0.1 * i)} * t + ${F(ph)}; float fd = 1.0 - smoothstep(0.12, 0.45, foot * ${F(k / TAU)}); g += ${F(a * 0.045)} * fd * cos(ph) * vec2(${F(Math.sin(an))}, ${F(Math.cos(an))}); }`).join("\n");

const BSEA_COMMON = `
uniform float uTime, uExtent, uReach, uLevel; uniform vec2 uOrigin;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y); }
vec2 vor(vec2 q) {
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 gg = vec2(float(i), float(j)), o = 0.1 + 0.8 * hash22(ip + gg); float d = length(gg + o - fp);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return vec2(f1, f2);
}
vec2 slope(vec2 p, float t, float foot) {   // slope (dh/dx, dh/dz) of the ripples; waves shorter than a few pixels fade out
  vec2 g = vec2(0.0);
${wavesSlopeGLSL()}
  return g;
}`;
const BSEA_VS = `${BSEA_COMMON}
varying vec3 vW;
void main() {
  vec2 c = cameraPosition.xz;
  if (cameraPosition.y < uLevel || distance(c, uOrigin) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vW = vec3(0.0); return; }
  vec2 xz = c + position.xz * uExtent;
  vW = vec3(xz.x, uLevel, xz.y); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const BSEA_FS = `${BSEA_COMMON}
uniform vec3 uSun, uTintN, uTintF, uHi, uHor;
uniform float uDepth, uGlint, uNet, uPass, uScat; uniform vec3 uKrgb;
varying vec3 vW;
${skyGLSL()}
vec3 skyAt(vec3 d) {
  float e = clamp(d.y, 0.0, 1.0);
  vec3 c = skyBase(e);
  float az = atan(d.x, -d.z);
  float bank = smoothstep(0.52, 0.8, vnoise(vec2(az * 7.0, 3.0)) * 0.6 + vnoise(vec2(az * 17.0, 8.0)) * 0.4) * (1.0 - smoothstep(0.03, 0.2, e));
  return mix(c, vec3(0.93, 0.97, 1.0), bank * 0.18);
}
float netLines(vec2 p, vec2 g, float cell, float foot, float t, float seed) {
  float cpx = cell / max(foot, 1e-4);   // pixels per cell
  float vis = smoothstep(9.0, 24.0, cpx) * (1.0 - smoothstep(90.0, 420.0, cpx));
  if (vis < 0.01) return 0.0;
  vec2 q = (p + g * 4.0) / cell + vec2(t * 0.07, -t * 0.05) * (1.0 + seed) + seed * 7.3;
  vec2 f = vor(q); float e = (f.y - f.x) * 0.5;
  return (1.0 - smoothstep(0.008, 0.028 + 0.45 / max(cpx, 1.0), e)) * vis;
}
void main() {
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv / d;
  vec2 fwv = abs(dFdx(vW.xz)) + abs(dFdy(vW.xz)); float foot = max(max(fwv.x, fwv.y), 1e-3);
  vec2 p = vW.xz, g = slope(p, uTime, foot);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float cosI = clamp(dot(N, V), 0.0, 1.0);
  float Fr = 0.02 + 0.98 * pow(1.0 - cosI, 5.0);
  float sinT2 = (1.0 - cosI * cosI) / 1.7689, cosT = sqrt(1.0 - sinT2);
  vec3 Tr = exp(-uKrgb * uDepth / cosT);   // the light that reaches the floor and comes back, per channel (red goes first): Beer's law along the refracted path
  float Tg = Tr.g;
  vec3 tint = mix(uTintN, uTintF, smoothstep(40.0, 900.0, d));
  vec3 R = reflect(-V, N); R.y = max(R.y, 0.02);
  vec3 sky = skyAt(normalize(R));
  // the net of caustic light lines (three cell sizes) and long white sun streaks
  float L = max(netLines(p, g, 0.28, foot, uTime, 0.0), max(netLines(p, g, 0.7, foot, uTime, 1.0), max(netLines(p, g, 1.7, foot, uTime, 2.0) * 0.8, netLines(p, g, 4.0, foot, uTime, 4.0) * 0.45)));
  float L2 = netLines(p + 3.1, g, 0.55, foot, uTime * 1.3, 3.0) * 0.5; L = max(L, L2);
  float un = vnoise(p * 0.18 + 4.0);
  L *= (0.45 + 0.4 * smoothstep(0.2, 0.7, un)) * uNet;
  float streak = 0.0;
  for (int q = 0; q < 0; q++) {   // long white sun streaks across the ripples: a fine set near, a coarse set far (each fades where its line would be under 2 px)
    float per = q == 0 ? 1.2 : 5.0, wd = 0.06, fp = foot / per;
    float sx = p.y / per + 2.5 * vnoise(vec2(p.x * 0.11 / per * 1.5, p.y * 0.07 / per * 1.5) + float(q) * 9.0) + 0.4 * sin(p.x * 0.15 + uTime * 0.2);
    float line = (1.0 - smoothstep(wd * 0.3, wd + fp * 1.2, abs(fract(sx) - 0.5))) * wd / (wd + fp * 0.8);
    float vis = 1.0;
    streak = max(streak, line * vis * 1.6 * smoothstep(0.5, 0.74, vnoise(vec2(p.x * 0.33 / per * 1.5 + uTime * 0.05, p.y * 0.42 / per * 1.5) + float(q) * 4.0)) * (1.0 - smoothstep(300.0, 1100.0, d)));
  }
  vec3 H = normalize(uSun + V); float nh = dot(N, H);
  float dash = vnoise(vec2(p.x * 3.7, p.y * 1.1 + uTime * 0.4));
  float gl = 0.3 * smoothstep(0.9985 - 0.0005 * dash, 0.99905, nh) * uGlint * (1.0 - smoothstep(500.0, 1200.0, d));
  vec3 Cpre = tint * (1.0 - Tg) * 0.62 * uScat * (1.0 - Fr) + sky * Fr;
  Cpre += uHi * L * 0.5 * (1.0 - Fr * 0.6);
  float cs = max(0.12, foot * 2.2); vec2 sc = floor(p / cs + vec2(uTime * 0.6, 0.0)); float sh = hash12(sc * 1.7 + 3.0);
  float spark = step(0.992, sh) * (0.5 + 0.5 * sin(uTime * 4.0 + sh * 300.0)) * (1.0 - smoothstep(200.0, 700.0, d)) * smoothstep(0.0, 0.3, 1.0 - cosI + 0.15);
  Cpre += vec3(1.0) * clamp(spark * 0.9 + gl, 0.0, 1.0) * 0.7;
  float hz = smoothstep(0.62, 1.0, d / uExtent);   // the last 40% of the disc melts into the horizon colour
  Tr = mix(Tr * (1.0 - Fr), vec3(0.0), hz); Cpre = mix(Cpre, uHor, hz);
  if (uPass < 0.5) { gl_FragColor = vec4(Tr, 1.0); return; }   // pass 0 multiplies what is under the water by Tr (blend: dst * src)
  gl_FragColor = vec4(Cpre, 1.0);   // pass 1 adds the water's own light (blend: dst + src)
  #include <colorspace_fragment>
}`;
const bseaGeo = once("c-air-sea-geo", () => {   // a polar grid 0..1 round the camera, rings geometrically spaced
  const NR = 90, NA = 128, r0 = 0.0004, pos = new Float32Array((NR + 1) * NA * 3), idx = [];
  for (let i = 0; i <= NR; i++) { const r = r0 * Math.pow(1 / r0, i / NR); for (let j = 0; j < NA; j++) { const a = (j / NA) * TAU; pos[(i * NA + j) * 3] = Math.sin(a) * r; pos[(i * NA + j) * 3 + 2] = Math.cos(a) * r; } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g;
});

const SEA_ORDER = 1010;   // after C1's bed (1000), road (1001), decals and flora (1003-1005): the sea is the last skin over them
function biminisea(P) {
  const S = P.spec, depth = S.depth ?? 5.5, clar = S.clarity ?? 1;
  // alpha-over of the tint on the floor: choose k so that T(5.5 m straight down) = 0.42 at clarity 1 (the floor shows at 42%)
  const U = {
    uTime: { value: 0 }, uExtent: { value: 1447 }, uReach: { value: S.reach ?? 2600 }, uLevel: { value: 0 }, uOrigin: { value: new THREE.Vector2() },
    uSun: { value: sunDir(S.sunAz ?? 20, S.sunEl ?? 55) }, uTintN: { value: col("#05b6b8") }, uTintF: { value: col("#0a80b0") }, uHi: { value: col("#e6fffb") }, uHor: { value: col(SEA_FAR) },
    uDepth: { value: depth }, uPass: { value: 0 }, uKrgb: { value: new THREE.Vector3(-Math.log(0.14), -Math.log(0.6), -Math.log(0.68)).multiplyScalar(1 / 5.5 / clar) }, uGlint: { value: 1 }, uNet: { value: S.net ?? 1 }, uScat: { value: S.scatter ?? 1 },
  };
  const U1 = { ...U, uPass: { value: 1 } };   // shared values, own pass flag
  const m0 = new THREE.ShaderMaterial({ uniforms: U, vertexShader: BSEA_VS, fragmentShader: BSEA_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }); noLine(m0);
  const m1 = new THREE.ShaderMaterial({ uniforms: U1, vertexShader: BSEA_VS, fragmentShader: BSEA_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }); noLine(m1);
  const me0 = new THREE.Mesh(bseaGeo, m0), me1 = new THREE.Mesh(bseaGeo, m1); me0.name = "c-air-sea"; me1.name = "c-air-sea-light"; P.whole.add(mark(me0, { order: SEA_ORDER }), mark(me1, { order: SEA_ORDER + 0.5 }));
  hookScene(P.root, (cam) => { if (cam && cam.isPerspectiveCamera) U.uExtent.value = Math.max(50, cam.far * 0.965); });
  const az0 = S.sunAz ?? 20, el0 = S.sunEl ?? 55, gl0 = S.glint ?? 1;
  return {
    grip: 0,
    apply(ps, t) {
      U.uSun.value.copy(sunDir(ps.sunAz ?? az0, ps.sunEl ?? el0)); U.uTime.value = t; U.uLevel.value = ps.y ?? 0; U.uOrigin.value.set(ps.x, ps.z); U.uGlint.value = ps.glint ?? gl0;
    },
  };
}

// ================================================================================================ THE ISLAND
function biminiisle(P) {
  const S = P.spec, seed = S.seed ?? 1, len = S.len ?? 600, at = S.at ?? [0, -1400], sc = S.size ?? 1.8;
  const AX = len / 2, AZ = 55, root = new THREE.Group(); root.position.set(at[0], 0, at[1]); root.scale.setScalar(sc);
  const SAND = col("#f4ead0"), WET = col("#e0d6b4"), SHELF = col("#eadfbd");
  // the outline: an ellipse with a hand-drawn wobble
  const rim = (th) => 1 + 0.16 * (vn1(th * 3.1 + 2, seed) - 0.5) * 2 + 0.07 * (vn1(th * 9 + 7, seed + 1) - 0.5) * 2;
  const ev = (x, z) => { const th = Math.atan2(z / AZ, x / AX); return Math.hypot(x / AX, z / AZ) / rim(th); };
  const hgt = (x, z) => {
    const e = ev(x, z), n = fbm2(x * 0.02, z * 0.05, seed + 3);
    if (e > 1.45) return -5.6;
    if (e > 1.0) { const k = (e - 1.0) / 0.45; return lerp(0.1, -5.6, Math.pow(k, 0.6)) - 0.2 * n * k; }
    if (e > 0.86) return lerp(1.1 + 0.4 * n, 0.1, sstep(0.86, 1.0, e));
    return 1.1 + 0.35 * n + 2.6 * sstep(0.86, 0.3, e) * (0.55 + 0.45 * vn2(x * 0.03, z * 0.06, seed + 4)) + 0.6 * sstep(0.5, 0.2, e);
  };
  // ---- ground: a coloured heightfield
  const NX = 220, NZ = 64, X0 = -AX * 1.5, Z0 = -AZ * 1.75, DX = (-2 * X0) / NX, DZ = (-2 * Z0) / NZ;
  const rows = [];
  for (let j = 0; j <= NZ; j++) { const r = []; for (let i = 0; i <= NX; i++) { const x = X0 + i * DX, z = Z0 + j * DZ; r.push([x, hgt(x, z), z]); } rows.push(r); }
  const gb = new MB();
  const grass = [col("#3f8f35"), col("#58a63e"), col("#2f7a30"), col("#7ab648")];
  gb.grid(rows, (j, i) => {
    const x = X0 + i * DX, z = Z0 + j * DZ, e = ev(x, z), y = rows[j][i][1], n = vn2(x * 0.09, z * 0.2, seed + 6), n2 = vn2(x * 0.5, z * 0.9, seed + 7);
    let c;
    if (e > 1.0) { c = SHELF.clone().lerp(col("#d8d2b4"), sstep(1.0, 1.35, e) * 0.7); }
    else if (e > 0.9) { c = SAND.clone().lerp(WET, sstep(0.97, 1.0, e)); c.multiplyScalar(0.94 + 0.1 * n2); }
    else if (e > 0.82) { c = SAND.clone().lerp(col("#7ab648"), sstep(0.82, 0.9, 1.72 - e * 1.0 - 0.8) * 0.0 + (1 - sstep(0.82, 0.9, e)) * 0.85); }
    else { c = grass[Math.floor(n * 3.99)].clone().lerp(grass[Math.floor(n2 * 3.99)], 0.4); c.multiplyScalar(0.8 + 0.3 * y / 4); if (vn2(x * 0.05, z * 0.1, seed + 8) > 0.72) c.lerp(col("#c9b868"), 0.5); }
    return c;
  });
  const gm = std({ vertexColors: true, roughness: 0.95 }); gm.side = THREE.DoubleSide;
  root.add(new THREE.Mesh(gb.geo(), gm));
  // ---- the surf line on the waterline: broken white dashes along e = 1.03, one long strip with a drawn mask
  {
    const NS = 360, pr = [], pr2 = [];
    for (let i = 0; i <= NS; i++) { const th = (i / NS) * TAU; const ex = (e0) => { const R0 = rim(th) * e0; return [Math.cos(th) * AX * R0, 0.14, Math.sin(th) * AZ * R0]; }; pr.push(ex(1.012)); pr2.push(ex(1.055)); }
    const pos = [], uv = [], idx = [];
    pr.forEach((a, i) => { const b = pr2[i]; pos.push(...a, ...b); uv.push(i / NS, 0, i / NS, 1); if (i < NS) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const [c, cg] = canvas(4096, 64); cg.fillStyle = "rgba(255,255,255,0)"; cg.clearRect(0, 0, 4096, 64);
    for (let k = 0; k < 520; k++) { const x = hz(k, 71 + seed) * 4096, w = 6 + 40 * hz(k, 72), y = 4 + 40 * hz(k, 73), a = 0.35 + 0.55 * hz(k, 74); cg.fillStyle = `rgba(255,255,255,${a})`; cg.beginPath(); cg.ellipse(x, y, w, 3 + 7 * hz(k, 75), 0, 0, TAU); cg.fill(); }
    const grd = cg.createLinearGradient(0, 0, 0, 64); grd.addColorStop(0, "rgba(255,255,255,0.35)"); grd.addColorStop(0.3, "rgba(255,255,255,0.1)"); grd.addColorStop(1, "rgba(255,255,255,0)"); cg.fillStyle = grd; cg.fillRect(0, 0, 4096, 64);
    const t = tex(c); t.wrapS = THREE.RepeatWrapping;
    const mm = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }); noLine(mm);
    const me = new THREE.Mesh(g, mm); me.name = "c-air-surf"; me.renderOrder = SEA_ORDER + 1; root.add(me);
  }
  // ---- vegetation: merged flat-shaded foliage (vertex colours)
  const fb = new MB(), pb = new MB(), tb = new MB();
  const onLand = (x, z, lim) => ev(x, z) < lim;
  const gy = (x, z) => Math.max(0.2, hgt(x, z));
  const GREENS = ["#2f7a30", "#3f8f35", "#58a63e", "#26642c", "#4a9a3a", "#6aa83e"], GOLD = ["#d6a02a", "#c98a2a", "#b8b030"];
  // palms: a leaning trunk (rings of colour) and a crown of drooping fronds
  const nP = S.palms ?? 40;
  for (let i = 0; i < nP; i++) {
    let x, z, tries = 0; do { const u = hz(i, seed + 20 + tries * 3), v = hz(i, seed + 21 + tries * 3); x = (u - 0.5) * 2 * AX * 0.88; z = (v - 0.5) * 2 * AZ * 0.8; tries++; } while ((!onLand(x, z, 0.8) || ev(x, z) < 0.12 && false) && tries < 12);
    if (!onLand(x, z, 0.82)) continue;
    const h = 15 + 7 * hz(i, 30), lean = (hz(i, 31) - 0.5) * 2 * 0.28 * h, la = hz(i, 32) * TAU, dir = [Math.cos(la), Math.sin(la)], y0 = gy(x, z) - 0.3;
    const pt = (s) => [x + dir[0] * lean * s * s, y0 + h * s, z + dir[1] * lean * s * s];
    const NSG = 6;
    for (let s = 0; s < NSG; s++) { const a = pt(s / NSG), b = pt((s + 1) / NSG); tb.tube(a, b, 0.42 * (1 - 0.45 * s / NSG), 0.42 * (1 - 0.45 * (s + 1) / NSG), s % 2 ? col("#9a7a52") : col("#7e6240"), 5); }
    const top = pt(1), nF = 9 + Math.floor(4 * hz(i, 34)), fa0 = hz(i, 33) * TAU;
    for (let f = 0; f < nF; f++) {
      const an = fa0 + (f / nF) * TAU + (hz(f, i + 40) - 0.5) * 0.3, dx = Math.cos(an), dz = Math.sin(an), L = 7 + 2.6 * hz(f, i + 41), up = 0.6 + 0.9 * hz(f, i + 42), W = 1.7 + 0.7 * hz(f, i + 43);
      const NSF = 8, left = [], right = [], cc = mixC("#2f7a30", "#5aa83c", hz(f, i + 44));
      for (let q = 0; q <= NSF; q++) { const u = q / NSF, out = L * u, yy = L * (up * 0.5 * u - 0.55 * u * u) + 0.4, w = W * Math.sin(Math.PI * Math.pow(u, 0.6)) * 0.5 + 0.03; const px = top[0] + dx * out, pz = top[2] + dz * out, py = top[1] + yy; left.push([px - dz * w, py - 0.12 * w * 2, pz + dx * w]); right.push([px + dz * w, py - 0.12 * w * 2, pz - dx * w]); const mid = [px, py + 0.06, pz]; left[q].mid = mid; right[q].mid = mid; }
      for (let q = 0; q < NSF; q++) { const k1 = mixC(cc.getStyle(), "#a6d65a", 0.25 * (1 - q / NSF)), k2 = cc.clone().multiplyScalar(0.8); pb.tri(left[q], left[q].mid, left[q + 1], k1); pb.tri(left[q + 1], left[q].mid, left[q + 1].mid, k1); pb.tri(right[q], right[q + 1], right[q].mid, k2); pb.tri(right[q + 1], right[q + 1].mid, right[q].mid, k2); pb.tri(left[q].mid, left[q + 1].mid, right[q].mid, k1); pb.tri(right[q].mid, left[q + 1].mid, right[q + 1].mid, k1); }
    }
    for (let q = 0; q < 4; q++) fb.blob(top[0] + Math.cos(q * 1.7) * 0.5, top[1] - 0.5, top[2] + Math.sin(q * 1.7) * 0.5, 0.42, 0.4, 0.42, col("#7a5a2a"));   // coconuts at the crown
  }
  // broadleaf and bush clumps: the dense green band
  const nB = Math.round(260 * len / 600);
  for (let i = 0; i < nB; i++) {
    const u = hz(i, seed + 50), v = hz(i, seed + 51), x = (u - 0.5) * 2 * AX * 0.9, z = (v - 0.5) * 2 * AZ * 0.85, e = ev(x, z);
    if (e > 0.88) continue;
    const big = hz(i, seed + 52) < 0.45, r = big ? 5.5 + 5 * hz(i, 53) : 2.6 + 2.6 * hz(i, 53), y0 = gy(x, z), hh = big ? r * 1.15 : r * 0.7;
    const base = hz(i, seed + 54) < 0.12 ? GOLD[Math.floor(hz(i, 55) * 3)] : GREENS[Math.floor(hz(i, 56) * GREENS.length)];
    for (let q = 0; q < (big ? 4 : 2); q++) { const a = hz(i * 7 + q, 57) * TAU, d = r * 0.45 * hz(i * 7 + q, 58), k = C(base, 0.3, i * 7 + q), rr = r * (0.65 + 0.3 * hz(i * 7 + q, 59)); fb.blob(x + Math.cos(a) * d, y0 + hh * (0.55 + 0.4 * hz(i * 7 + q, 60)), z + Math.sin(a) * d, rr, hh * 0.65, rr, k, a); }
    if (big) tb.tube([x, y0 - 0.2, z], [x, y0 + hh * 0.7, z], 0.35, 0.28, col("#6a4e32"), 4);
  }
  // low scrub along the sand
  for (let i = 0; i < 90; i++) {
    const th = hz(i, seed + 61) * TAU, e = 0.8 + 0.08 * hz(i, 62), R0 = rim(th) * e, x = Math.cos(th) * AX * R0, z = Math.sin(th) * AZ * R0, r = 0.8 + 1.4 * hz(i, 63);
    fb.blob(x, gy(x, z) + r * 0.3, z, r * 1.4, r * 0.55, r, C(GREENS[i % GREENS.length], 0.3, i), th);
  }
  const fm = std({ vertexColors: true, roughness: 0.9, flatShading: true }); fm.side = THREE.DoubleSide;
  root.add(new THREE.Mesh(fb.geo(), fm), new THREE.Mesh(pb.geo(), fm), new THREE.Mesh(tb.geo(), std({ vertexColors: true, roughness: 0.95, flatShading: true })));
  // ---- houses: white walls, dark windows, hip or gable roofs; one red roof right of centre
  const hb = new MB();
  const HS = [[-170, -4, 8, 6, "#7a8a8e", 0.3], [-118, 4, 7, 5.5, "#3f7c88", 0.6], [-62, -2, 9, 6, "#b8bdc0", 0.1], [96, -2, 11, 7, "#c8382c", 0.0], [150, 6, 8, 5.5, "#8a9498", 0.2], [-24, 8, 6, 5, "#a8742c", 0.5]];
  for (const [hx, hzz, w, d, rc, rot] of HS) {
    const y0 = gy(hx, hzz), ht = 3.6, cs = Math.cos(rot), sn = Math.sin(rot), P3 = (lx, ly, lz) => [hx + lx * cs - lz * sn, y0 + ly, hzz + lx * sn + lz * cs];
    const walls = col("#f6f2e8"), shade = col("#e4e0d6");
    const X = w / 2, Z = d / 2;
    hb.quad(P3(-X, 0, Z), P3(X, 0, Z), P3(X, ht, Z), P3(-X, ht, Z), walls); hb.quad(P3(X, 0, -Z), P3(-X, 0, -Z), P3(-X, ht, -Z), P3(X, ht, -Z), shade);
    hb.quad(P3(X, 0, Z), P3(X, 0, -Z), P3(X, ht, -Z), P3(X, ht, Z), shade); hb.quad(P3(-X, 0, -Z), P3(-X, 0, Z), P3(-X, ht, Z), P3(-X, ht, -Z), walls);
    const rcol = col(rc), rcl = rcol.clone().multiplyScalar(0.72), ry = ht + 2.2;   // hip roof
    hb.tri(P3(-X - 0.5, ht, Z + 0.5), P3(X + 0.5, ht, Z + 0.5), P3(X * 0.5, ry, 0), rcol); hb.tri(P3(-X - 0.5, ht, Z + 0.5), P3(X * 0.5, ry, 0), P3(-X * 0.5, ry, 0), rcol);
    hb.tri(P3(X + 0.5, ht, -Z - 0.5), P3(-X - 0.5, ht, -Z - 0.5), P3(-X * 0.5, ry, 0), rcl); hb.tri(P3(X + 0.5, ht, -Z - 0.5), P3(-X * 0.5, ry, 0), P3(X * 0.5, ry, 0), rcl);
    hb.tri(P3(X + 0.5, ht, Z + 0.5), P3(X + 0.5, ht, -Z - 0.5), P3(X * 0.5, ry, 0), rcl.clone().multiplyScalar(0.9)); hb.tri(P3(-X - 0.5, ht, -Z - 0.5), P3(-X - 0.5, ht, Z + 0.5), P3(-X * 0.5, ry, 0), rcl.clone().multiplyScalar(1.05));
    const nW = Math.max(2, Math.floor(w / 2.5)), win = col("#2a3f52");
    for (let q = 0; q < nW; q++) { const wx = -X + (q + 0.5) * (w / nW); hb.quad(P3(wx - 0.55, 1.2, Z + 0.02), P3(wx + 0.55, 1.2, Z + 0.02), P3(wx + 0.55, 2.6, Z + 0.02), P3(wx - 0.55, 2.6, Z + 0.02), win); }
    hb.quad(P3(-0.5, 0, Z + 0.03), P3(0.5, 0, Z + 0.03), P3(0.5, 2.3, Z + 0.03), P3(-0.5, 2.3, Z + 0.03), col("#7a5a3a"));
  }
  const hm = std({ vertexColors: true, roughness: 0.8 }); hm.side = THREE.DoubleSide; root.add(new THREE.Mesh(hb.geo(), hm));
  // ---- the second, far island: a low sliver seen at the left of the horizon (a green ridge with pale ends)
  if (S.sliver !== false) {
    const sb = new MB(), sg = new THREE.Group(); const SX = -520 - at[0], SZ = -1240 - at[1], SL = 280, rows2 = [];
    for (let j = 0; j <= 8; j++) { const r = []; for (let i = 0; i <= 70; i++) { const u = i / 70, x = SX + (u - 0.5) * SL, z = SZ + (j / 8 - 0.5) * 36, prof = Math.sin(Math.PI * u) ** 0.7 * (1 - Math.abs(j / 8 - 0.5) * 1.6); r.push([x, Math.max(-0.5, (7 * prof + 3 * (vn1(u * 9, 4) - 0.5) * prof) - 0.3), z]); } rows2.push(r); }
    sb.grid(rows2, (j, i) => { const u = i / 70, e = Math.abs(j / 8 - 0.5) * 2; return mixC("#4a8a50", "#c9cdb0", Math.max(1 - Math.sin(Math.PI * u) * 2.2, e * 0.6)); });
    const sm = std({ vertexColors: true, roughness: 0.95 }); sm.side = THREE.DoubleSide; sg.add(new THREE.Mesh(sb.geo(), sm)); root.add(sg); void sg;
  }
  P.whole.add(mark(root, { order: 0 }));
  return { grip: 0, apply() {} };
}

// ================================================================================================ THE BOAT
const BOAT_L = 9, BOAT_B = 1.5;
const boatSection = (s) => {   // half beam, the sheer height, the keel depth at station s (0 = bow, 1 = stern)
  const B = BOAT_B * Math.pow(clamp(s / 0.5), 0.72) * (1 - 0.1 * sstep(0.72, 1, s)) * (s < 0.5 ? 1 : 1);
  return { B, sheer: 0.95 + 0.5 * Math.pow(1 - s, 2.2) + 0.12 * (1 - s), keel: -0.78 + 0.5 * (1 - sstep(0, 0.45, s)) };
};
const deckTex = () => once("c-air-deck", () => {
  const [c, g] = canvas(256, 512); g.fillStyle = "#b98448"; g.fillRect(0, 0, 256, 512);
  const NP = 8;
  for (let p = 0; p < NP; p++) {
    const x0 = (p / NP) * 256, w = 256 / NP; g.fillStyle = ["#c28d4f", "#b47e43", "#c9955a", "#b98448"][p % 4]; g.fillRect(x0, 0, w, 512);
    for (let k = 0; k < 28; k++) { g.strokeStyle = `rgba(110,64,28,${0.12 + 0.2 * hz(k, p + 3)})`; g.lineWidth = 0.7 + hz(k, p + 4); const y = hz(k, p + 5) * 512, xx = x0 + 3 + hz(k, p + 6) * (w - 6); g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + (hz(k, p + 7) - 0.5) * 3, y + 20 + 40 * hz(k, p + 8)); g.stroke(); }
    g.fillStyle = "rgba(70,40,18,0.85)"; g.fillRect(x0, 0, 1.6, 512);
    for (let q = 0; q < 6; q++) { const y = 40 + q * 90 + hz(q, p + 9) * 30; g.fillStyle = "rgba(60,42,28,0.8)"; g.beginPath(); g.arc(x0 + 5, y, 1.3, 0, TAU); g.arc(x0 + w - 5, y, 1.3, 0, TAU); g.fill(); }
  }
  return tex(c);
});

function biminiboat(P) {
  const S = P.spec, depth = S.depth ?? 5.5, rockK = S.rock ?? 1, canopy = col(S.canopy ?? "#2b63b8");
  const boat = new THREE.Group();
  const hb = new MB(), WHITE = col("#f6f3ec"), WHT2 = col("#e6e3dc"), RED = col("#c4382c"), DRED = col("#7a2622"), TEAK = col("#a8682e"), GLASS = col("#1d3550"), STEEL = col("#c9ced2"), DARK = col("#2a2d33");
  const NS = 24, st = Array.from({ length: NS + 1 }, (_, i) => i / NS);
  const Z = (s) => -BOAT_L / 2 + BOAT_L * s;
  const sec = st.map((s) => { const q = boatSection(s), bw = q.B * 0.9; return { s, z: Z(s), B: q.B, sheer: q.sheer, keel: q.keel, bw }; });
  // hull: bands (bottom, boot stripe, topside, teak cap), both sides, shared vertices along each strip
  const bands = [
    (q, sg) => [[0, q.keel], [sg * q.bw * 0.4, q.keel + 0.08], [sg * q.bw * 0.82, -0.42], [sg * q.bw, -0.12]], DRED,
    (q, sg) => [[sg * q.bw, -0.12], [sg * q.B * 0.99, 0.26]], RED,
    (q, sg) => [[sg * q.B * 0.99, 0.26], [sg * q.B * 1.03, q.sheer * 0.6], [sg * q.B * 1.02, q.sheer - 0.14]], WHITE,
    (q, sg) => [[sg * q.B * 1.02, q.sheer - 0.14], [sg * q.B * 1.04, q.sheer + 0.02]], TEAK,
  ];
  for (let b = 0; b < bands.length; b += 2) for (const sg of [-1, 1]) {
    const rows = sec.map((q) => bands[b](q, sg).map(([x, y]) => [x, y, q.z]));
    hb.grid(rows, bands[b + 1], sg > 0);
  }
  // inner side of the topside (white), the teak cap's top face
  for (const sg of [-1, 1]) {
    hb.grid(sec.map((q) => [[sg * q.B * 1.04, q.sheer + 0.02, q.z], [sg * (q.B * 1.04 - 0.1), q.sheer + 0.02, q.z]]), TEAK, sg > 0);
    hb.grid(sec.map((q) => [[sg * (q.B * 1.04 - 0.1), q.sheer + 0.02, q.z], [sg * (q.B * 1.0 - 0.1), q.sheer - 0.34, q.z]]), WHT2, sg < 0);
  }
  // transom
  { const q = sec[NS]; hb.quad([-q.bw, -0.12, q.z], [q.bw, -0.12, q.z], [q.B * 1.03, q.sheer * 0.9, q.z], [-q.B * 1.03, q.sheer * 0.9, q.z], WHITE); hb.quad([-q.bw * 0.4, q.keel, q.z], [q.bw * 0.4, q.keel, q.z], [q.bw, -0.12, q.z], [-q.bw, -0.12, q.z], DRED); }
  // the deck (textured): between the two inner sides, 0.34 below the sheer
  const dkRows = sec.map((q) => { const y = q.sheer - 0.34; return [[-(q.B * 1.0 - 0.1), y, q.z], [(q.B * 1.0 - 0.1), y, q.z]]; });
  const dg = new THREE.BufferGeometry(), dp = [], du = [], di = [];
  dkRows.forEach((r, j) => { for (const [x, y, z] of r) { dp.push(x, y, z); du.push(x / 3 * 0.5 + 0.5, z / 2.0); } if (j < dkRows.length - 1) { const a = j * 2; di.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
  dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute("uv", new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals(); dg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const dm = std({ map: deckTex(), roughness: 0.8 }); dm.side = THREE.DoubleSide; dm.map.wrapS = dm.map.wrapT = THREE.RepeatWrapping;
  boat.add(new THREE.Mesh(dg, dm));
  const dY = (z) => { const s = (z + BOAT_L / 2) / BOAT_L; return boatSection(clamp(s)).sheer - 0.34; };
  // cabin: slanted windscreen, flat roof, side windows; spans z -0.6 .. 2.2, width 2.3 (a prism)
  const CZ0 = -0.6, CZ1 = 2.3, CW = 1.12, CH = 1.55, FT = 0.5, y0 = dY(1.2);
  const front = (sg) => [sg * CW, y0, CZ0], frontT = (sg) => [sg * CW * 0.94, y0 + CH, CZ0 + FT * 1.6], rearT = (sg) => [sg * CW * 0.94, y0 + CH + 0.08, CZ1], rear = (sg) => [sg * CW, y0, CZ1];
  hb.quad(front(1), rear(1), rearT(1), frontT(1), WHITE); hb.quad(rear(-1), front(-1), frontT(-1), rearT(-1), WHITE);   // sides
  hb.quad(front(-1), front(1), frontT(1), frontT(-1), GLASS);   // windscreen
  hb.quad(frontT(-1), frontT(1), rearT(1), rearT(-1), WHITE);   // roof
  hb.quad(rear(1), rear(-1), rearT(-1), rearT(1), WHT2);
  const sw = (sg, zA, zB) => { const lerpP = (z) => (z - CZ0) / (CZ1 - CZ0), top = (z) => y0 + 0.82 + 0.6 * 0, yA = y0 + 0.62, yB = y0 + CH - 0.28, xs = (z) => sg * (CW + 0.015); hb.quad([xs(zA), yA, zA], [xs(zB), yA, zB], [xs(zB), yB, zB], [xs(zA), yB, zA], sg > 0 ? GLASS : GLASS); void lerpP; void top; };
  for (const sg of [-1, 1]) { for (const [a, b] of [[0.55, 1.1], [1.2, 1.75], [1.85, 2.2]]) sw(sg, a, b); hb.box(sg * (CW + 0.02), y0 + 0.92, 1.18, 0.02, 0.06, 2.0, STEEL); }
  hb.box(0, y0 + 0.9, CZ1 + 0.02, 0.9, 1.3, 0.03, GLASS);   // rear door
  hb.box(0, y0 + CH + 0.1, 0.9, 1.8, 0.1, 1.6, WHT2);   // roof lip
  // the blue canopy on four poles over the aft deck (z 2.5 .. 4.4)
  const CY = y0 + 2.15, cz0 = 2.45, cz1 = 4.35, cw = 1.35;
  for (const px of [-1.2, 1.2]) for (const pz of [cz0 + 0.05, cz1 - 0.1]) hb.tube([px, dY(pz), pz], [px * 1.0, CY, pz], 0.035, 0.035, STEEL, 5);
  { const rowsC = []; for (let j = 0; j <= 4; j++) { const z = lerp(cz0, cz1, j / 4), r = []; for (let i = 0; i <= 6; i++) { const u = i / 6 * 2 - 1; r.push([u * (cw + 0.1), CY + 0.18 * (1 - u * u) - 0.1 * Math.abs(j / 4 - 0.5), z]); } rowsC.push(r); } hb.grid(rowsC, canopy, true); hb.grid(rowsC, canopy.clone().multiplyScalar(0.7), false);
    for (const sg of [-1, 1]) hb.box(sg * (cw + 0.1), CY - 0.08, (cz0 + cz1) / 2, 0.05, 0.16, cz1 - cz0, canopy.clone().multiplyScalar(0.8));
    hb.box(0, CY + 0.17, (cz0 + cz1) / 2, 0.05, 0.03, cz1 - cz0, WHITE); }
  // mast with crosstree, radar dome, antenna, a red pennant
  const MX = 0, MZ = 0.85, MY = y0 + CH + 0.12;
  hb.tube([MX, MY, MZ], [MX, MY + 2.9, MZ], 0.05, 0.03, STEEL, 5); hb.box(MX, MY + 2.1, MZ, 0.9, 0.04, 0.04, STEEL);
  hb.blob(MX + 0.0, MY + 0.2, MZ + 0.55, 0.34, 0.2, 0.34, WHITE); hb.tube([MX, MY + 2.9, MZ], [MX + 0.1, MY + 3.7, MZ], 0.012, 0.006, DARK, 4);
  hb.tri([MX, MY + 2.78, MZ], [MX, MY + 2.5, MZ], [MX - 0.1, MY + 2.62, MZ + 0.7], RED); hb.tri([MX, MY + 2.78, MZ], [MX - 0.1, MY + 2.62, MZ + 0.7], [MX, MY + 2.5, MZ], col("#e65a4a"));
  hb.box(0.3, MY + 0.12, MZ - 0.1, 0.16, 0.2, 0.16, DARK);   // nav light
  // bow rail and pulpit: posts and a top tube along each side from the bow to the cabin
  const railPts = (sg) => { const out = []; for (const z of [-3.9, -3.2, -2.5, -1.8, -1.1]) { const q = boatSection((z + BOAT_L / 2) / BOAT_L); out.push([sg * (q.B * 1.0 - 0.14), dY(z), z]); } return out; };
  for (const sg of [-1, 1]) { const rp = railPts(sg); rp.forEach((p) => hb.tube(p, [p[0], p[1] + 0.62, p[2]], 0.016, 0.016, STEEL, 4)); for (let i = 0; i < rp.length - 1; i++) { hb.tube([rp[i][0], rp[i][1] + 0.62, rp[i][2]], [rp[i + 1][0], rp[i + 1][1] + 0.62, rp[i + 1][2]], 0.014, 0.014, STEEL, 4); hb.tube([rp[i][0], rp[i][1] + 0.3, rp[i][2]], [rp[i + 1][0], rp[i + 1][1] + 0.3, rp[i + 1][2]], 0.01, 0.01, STEEL, 4); } }
  { const q = boatSection(0.05), zb = -4.2, a = [-(q.B * 1.0 - 0.1) * 0.55, dY(zb) + 0.62, zb], b = [(q.B * 1.0 - 0.1) * 0.55, dY(zb) + 0.62, zb]; hb.tube(a, b, 0.014, 0.014, STEEL, 4); for (const p of [a, b]) hb.tube([p[0], dY(zb), p[2]], p, 0.016, 0.016, STEEL, 4); }
  // fenders (white), an orange life ring on the cabin side, a rope coil, crates, an anchor at the bow, the outboard
  for (const sg of [-1, 1]) for (const z of [-0.9, 0.9, 2.7]) { const q = boatSection((z + BOAT_L / 2) / BOAT_L); hb.tube([sg * q.B * 1.05, q.sheer - 0.1, z], [sg * q.B * 1.07, q.sheer - 0.78, z], 0.1, 0.1, col("#eef2f4"), 6); hb.box(sg * q.B * 1.04, q.sheer - 0.06, z, 0.03, 0.03, 0.03, DARK); }
  { const rc = col("#e8761c"), cx = CW + 0.07, cy = y0 + 1.05, cz = 1.7; for (let q = 0; q < 14; q++) { const a0 = (q / 14) * TAU, a1 = ((q + 1) / 14) * TAU, k = q % 2 ? rc : WHITE; hb.quad([cx, cy + Math.cos(a0) * 0.3, cz + Math.sin(a0) * 0.3], [cx, cy + Math.cos(a1) * 0.3, cz + Math.sin(a1) * 0.3], [cx + 0.06, cy + Math.cos(a1) * 0.3, cz + Math.sin(a1) * 0.3], [cx + 0.06, cy + Math.cos(a0) * 0.3, cz + Math.sin(a0) * 0.3], k); hb.quad([cx + 0.06, cy + Math.cos(a0) * 0.3, cz + Math.sin(a0) * 0.3], [cx + 0.06, cy + Math.cos(a1) * 0.3, cz + Math.sin(a1) * 0.3], [cx + 0.06, cy + Math.cos(a1) * 0.17, cz + Math.sin(a1) * 0.17], [cx + 0.06, cy + Math.cos(a0) * 0.17, cz + Math.sin(a0) * 0.17], k); } }
  hb.box(-0.55, dY(3.1) + 0.16, 3.55, 0.7, 0.32, 0.5, col("#9a6a38")); hb.box(0.45, dY(3.3) + 0.14, 3.6, 0.55, 0.28, 0.42, col("#7a8a94"));   // crates on the aft deck
  for (let q = 0; q < 6; q++) hb.tube([0.6 + 0.02 * q, dY(-2.6) + 0.04 + 0.03 * q, -2.6], [0.62, dY(-2.6) + 0.05 + 0.03 * q, -2.6], 0.2 - 0.01 * q, 0.2 - 0.01 * q, col("#d6c6a0"), 8);   // rope coil
  hb.tube([0, dY(-4.0) + 0.1, -4.1], [0, dY(-4.0) + 0.5, -4.35], 0.03, 0.03, DARK, 4); hb.quad([-0.14, dY(-4.0) + 0.08, -4.3], [0.14, dY(-4.0) + 0.08, -4.3], [0.1, dY(-4.0) + 0.3, -4.5], [-0.1, dY(-4.0) + 0.3, -4.5], DARK);   // anchor
  { const zt = Z(1) + 0.18; hb.box(0, 0.35, zt, 0.42, 0.78, 0.3, DARK); hb.box(0, 0.85, zt, 0.5, 0.36, 0.34, col("#3c4048")); hb.tube([0, 0.0, zt + 0.1], [0, -0.55, zt + 0.1], 0.05, 0.05, DARK, 5); hb.blob(0, -0.55, zt + 0.15, 0.18, 0.05, 0.1, col("#4a4e56")); }
  // a pair of steps at the stern, a stern light
  hb.box(0, dY(4.4) + 0.5, 4.46, 0.05, 0.05, 0.05, col("#f2d36a"));
  const bm = std({ vertexColors: true, roughness: 0.55 }); bm.side = THREE.DoubleSide;
  boat.add(new THREE.Mesh(hb.geo(), bm));
  P.whole.add(mark(boat, { order: 0 }));
  // ---- the ripple ring + foam line at the waterline (drawn over the sea)
  const ringSize = 18, [rc, rg] = canvas(512, 512), RS = 512 / ringSize;
  {
    const hull = (e) => { const pts = []; for (let i = 0; i <= 40; i++) { const s = i / 40, q = boatSection(s); pts.push([q.bw * 1.05 + e, Z(s)]); } for (let i = 40; i >= 0; i--) { const s = i / 40, q = boatSection(s); pts.push([-(q.bw * 1.05 + e), Z(s)]); } return pts; };
    const path = (pts) => { rg.beginPath(); pts.forEach(([x, z], i) => { const X = 256 + x * RS, Y = 256 + z * RS; if (i) rg.lineTo(X, Y); else rg.moveTo(X, Y); }); rg.closePath(); };
    rg.filter = "blur(2.5px)";
    for (const [e, a, w] of [[0.08, 0.85, 3.2], [0.55, 0.38, 2.4], [1.15, 0.22, 2.0], [1.9, 0.12, 1.6]]) { path(hull(e)); rg.strokeStyle = `rgba(240,255,252,${a})`; rg.lineWidth = w; rg.setLineDash(e < 0.2 ? [] : [30 + 20 * e, 14 + 10 * e]); rg.stroke(); }
    rg.filter = "none";
  }
  const rt = tex(rc), rm = new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, side: THREE.DoubleSide }); noLine(rm);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(ringSize, ringSize), rm); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.025; ring.name = "c-air-boat-ring"; P.whole.add(mark(ring, { order: SEA_ORDER + 1 }));
  // ---- the shadow on the sand: parts projected along the refracted sun, each displaced by its height, soft
  let shadow = null;
  if (S.shadow !== false) {
    const az = (S.sunAz ?? 20) * DEG, el = (S.sunEl ?? 55) * DEG, zen = Math.PI / 2 - el, tanA = Math.tan(zen), sinR = Math.sin(zen) / 1.33, tanR = sinR / Math.sqrt(1 - sinR * sinR);
    const away = [Math.sin(az), Math.cos(az)];   // the shadow falls away from the sun: toward +x, +z for the sun at az 20 left of -z
    const off = (h) => h * tanA + depth * tanR;
    const SIZE = 24, [sc, sg] = canvas(512, 512), PS = 512 / SIZE;
    const poly = (pts, h, a) => { const o = off(h); sg.beginPath(); pts.forEach(([x, z], i) => { const X = 256 + (x + away[0] * o) * PS, Y = 256 + (z + away[1] * o) * PS; if (i) sg.lineTo(X, Y); else sg.moveTo(X, Y); }); sg.closePath(); sg.fillStyle = `rgba(4,34,46,${Math.min(1, a * 1.5)})`; sg.fill(); };
    sg.filter = "blur(5px)";
    const outline = []; for (let i = 0; i <= 30; i++) { const s = i / 30, q = boatSection(s); outline.push([q.B, Z(s)]); } for (let i = 30; i >= 0; i--) { const s = i / 30, q = boatSection(s); outline.push([-q.B, Z(s)]); }
    poly(outline, 0.4, 0.5);
    poly([[-CW, CZ0], [CW, CZ0], [CW, CZ1], [-CW, CZ1]], 2.2, 0.28);
    poly([[-cw - 0.1, cz0], [cw + 0.1, cz0], [cw + 0.1, cz1], [-cw - 0.1, cz1]], 3.3, 0.5);
    poly([[-0.04, MZ - 0.04], [0.04, MZ - 0.04], [0.04 + 0.0, MZ + 0.04], [-0.04, MZ + 0.04]], 3.0, 0.0);
    sg.strokeStyle = "rgba(6,40,52,0.5)"; sg.lineWidth = 3; sg.beginPath(); const m0 = off(MY + 0.1), m1 = off(MY + 3.6); sg.moveTo(256 + (MX + away[0] * m0) * PS, 256 + (MZ + away[1] * m0) * PS); sg.lineTo(256 + (MX + away[0] * m1) * PS, 256 + (MZ + away[1] * m1) * PS); sg.stroke();
    sg.filter = "none";
    const sm = new THREE.MeshBasicMaterial({ map: tex(sc), transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide }); noLine(sm);
    shadow = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), sm); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -depth + 0.3; shadow.name = "c-air-boat-shadow"; P.whole.add(mark(shadow, { order: SEA_ORDER - 1 }));
  }
  return {
    grip: 0,
    apply(ps, t) {
      const k = ps.rock ? ps.rock : rockK;
      boat.rotation.z = 0.032 * k * Math.sin(t * 0.85 + 0.6); boat.rotation.x = 0.016 * k * Math.sin(t * 0.62 + 2.1); boat.position.y = 0.045 * k * Math.sin(t * 0.85 + 2.2) - 0.02 * k;
      const sc2 = 1 + 0.012 * k * Math.sin(t * 0.9); ring.scale.set(sc2, 1, sc2); ring.material.opacity = 0.9 + 0.1 * Math.sin(t * 1.3);
      if (shadow) shadow.position.x = 0.04 * k * Math.sin(t * 0.85 + 0.4);
    },
  };
}

// ================================================================================================ BENCH STAND-IN FOR THE FLOOR
function biminiairfloor(P) {
  const S = P.spec, seed = S.seed ?? 1, FY = -5.5;
  const [c, g] = canvas(1024, 1024); g.fillStyle = "#e6d9b0"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${150 + 60 * hz(k, 5)},${130 + 50 * hz(k, 6)},${90 + 40 * hz(k, 7)},${0.05 + 0.1 * hz(k, 8)})`; g.beginPath(); g.ellipse(hz(k, 1) * 1024, hz(k, 2) * 1024, 4 + 24 * hz(k, 3), 2 + 9 * hz(k, 4), hz(k, 9) * 3, 0, TAU); g.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 12);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(900, 2700), std({ map: t, roughness: 1 })); plane.rotation.x = -Math.PI / 2; plane.position.set(0, FY, -700); P.whole.add(mark(plane, { order: -2 }));
  const rb = new MB(), REEF = ["#1f4a32", "#2a5a3a", "#183c2c", "#3a6a42", "#26503c", "#46784c"];
  const CELL = 10;
  for (let ix = -22; ix <= 22; ix++) for (let iz = -75; iz <= 12; iz++) {
    const x = ix * CELL + (hz(ix * 91 + iz, seed + 2) - 0.5) * CELL, z = iz * CELL + (hz(ix * 53 + iz, seed + 3) - 0.5) * CELL, ax = Math.abs(x);
    if (ax < 4.5 && z < 14) continue;
    const n = fbm2(x * 0.02, z * 0.02, seed + 5), dens = smooth(0.46, 0.72, n) * (1 - 0.55 * sstep(300, 700, -z));
    if (hz(ix * 17 + iz * 31, seed + 4) > dens * 1.1) continue;
    const nb = 3 + Math.floor(4 * hz(ix + iz * 7, seed + 9)), r0 = 1.8 + 3.5 * hz(ix * 3 + iz, seed + 10);
    for (let b = 0; b < nb; b++) { const a = hz(b + ix * 5, iz + seed) * TAU, d = r0 * 0.9 * hz(b * 3 + ix, iz + 4), r = r0 * (0.4 + 0.5 * hz(b + ix * 2, iz * 3)), kc = C(REEF[Math.floor(hz(b + ix * 11, iz + 7) * REEF.length)], 0.3, ix * 13 + iz * 3 + b); rb.blob(x + Math.cos(a) * d, FY + r * 0.35, z + Math.sin(a) * d, r, r * 0.6, r * 0.9, kc, a); }
  }
  P.whole.add(mark(new THREE.Mesh(rb.geo(), std({ vertexColors: true, flatShading: true })), { order: -2 }));
  const bb = new MB();
  for (let i = 0; i < 219; i++) { const z = -i * 3.65, k = C("#3f5a4a", 0.25, i), top = C("#4f6e5a", 0.3, i + 300); bb.box(0, FY + 0.45, z, 3.3, 1.5, 3.3, k); bb.quad([-1.65, FY + 1.2, z + 1.65], [1.65, FY + 1.2, z + 1.65], [1.65, FY + 1.2, z - 1.65], [-1.65, FY + 1.2, z - 1.65], top); if (hz(i, 41) > 0.5) bb.blob((hz(i, 42) - 0.5) * 2.4, FY + 1.25, z + (hz(i, 43) - 0.5) * 2, 0.35 + 0.3 * hz(i, 44), 0.14, 0.3, col("#d9cfa8"), hz(i, 45) * 3); }
  P.whole.add(mark(new THREE.Mesh(bb.geo(), std({ vertexColors: true, flatShading: true })), { order: -2 }));
  return { grip: 0, apply() {} };
}
function smooth(a, b, x) { return sstep(a, b, x); }

export const C_AIR_KINDS = { biminisea, biminiisle, biminiboat, biminisky, biminiairfloor };
export const C_AIR_GRIPS = {};
