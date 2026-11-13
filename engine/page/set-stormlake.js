import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// "stormlake" (You wake up mid EP02 "sinking car", task T1, 12 Nov 2026; DESIGN.md sections 1, 2, 4 in
// storyboards/series/you-wake-up-mid/02-sinking-car): a road bridge snapped in the middle over a lake in a storm, the
// world above the water and under it. Panels 01, 03, 10-12.
//
// WORLD FRAME (the whole clip): x right, y up, z = the car's heading, metres. The lake surface is y 0; the origin is the
// impact point. Nothing is drawn farther than about 280 m from the origin (the cameras' far plane is 300 m).
//   Near bridge stump  x -4..4, deck top y 14.0 (DECK_Y), from the land at z -140 to its broken lip at z -14
//                      (LIP.near: jagged over z -16.5..-14; with spec lip:false the deck ends in a clean cut at z -17).
//   Far bridge stump   the same section from its lip at z +30 (LIP.far) to the land at z +215.
//   Deck section       bridgeend's (props-wakeup-out.js) 8.0 wide x 0.9 thick won over DESIGN's 9.0 x 0.5 (DESIGN 1.2
//                      says so): slab y 13.1..14.0, box girder 5.0 x 1.4 (underside y 11.7), parapets 0.25 x 0.9 on the
//                      slab's edges (x +-3.875, top y 14.9), one steel rail at y 15.05. Piers 5.0 (x) x 1.6 (z) from the
//                      bed to y 10.5, cap 8.0 x 2.0 x 1.2 (y 10.5..11.7), at z -20 -50 -80 36 66 96 126 156 186.
//   Lips               5 teeth 0.3-0.9 m deep, a recessed lower slab and girder, 9 rebar rods, 2 lumps hanging on rebar,
//                      painted cracks 4 m back, the +x parapet bent 30 degrees outward over the last 3 m with its rail
//                      torn and hanging 2 m. With lip:false and the bridgeend prop at the near lip, give the prop len <= 3
//                      (its deck top is y 0 at its origin: put it at y 14.0) so the two decks don't overlap.
//   Shores             the bay (land where x > 30 + 5 sin(z / 19): mud rising 1:12 near SHORE, 1:8 farther along, a
//                      bank at 3 m, 30 firs 18-45 m back), the abutment (land where z < -95 + 4 sin(x / 23), a 3 m earth
//                      bank, 14 fir cards at z -110..-130, an embankment under the deck) and the far shore (z > 200 +
//                      6 sin(x / 31), under a mist band). Elsewhere the lake runs out to the painted hill rings
//                      (r 160 / 210 / 260 m, pushed out to 220 / 250 / 275 m round +z, behind the far shore).
//   SHORE (panel 12)   centre (34.5, 0.40, -6): a LEVEL patch 2.5 (x) x 4.0 (z) m at y 0.40, blended into the 1:12 mud over
//                      2 m. Reeds, rocks and puddles keep off it and off the strip toward +x (x > 35, z -9..-2: the
//                      30.0 camera's line). Lake bed y = -clamp(depth, 0, 7.5) +- 0.3 m noise (7.5 m at the origin).
//
// SPEC { type: "stormlake",
//   lip: true          the near lip's broken edge (false: a clean cut at z -17 for the bridgeend prop)
//   under: "auto"      the underwater look when the camera's world y < 0; true / false force it on / off
//   hole: null         [x, z, yaw, halfL, halfW] metres / degrees: the lake surface is not drawn inside this box (the car's
//                      footprint: halfL along its heading, halfW across, yaw = the car's rot), from above and below
//   shafts: [0, 0]     [x, z]: the centre of the 10 x 10 m patch the 7 light shafts stand in (underwater only)
//   wipe: 0            0..1: the full-frame foam wipe at the surfacing (frames 810-811: 1 then 0.6)
//   dark: 0            0..1: the whole world (sky, water, land) dimmed by up to 45 %
//   seed               not used (everything is placed by fixed hashes)
//   ink, hatch, cel, lighting, satsuei, aperture, bloom ...: the look's keys, passed through as every set takes them;
//                      the set reads ink (its own line width: ink.set px, default 1.1; the bridge x 1.5) and hatch
//                      (false: no pencil strokes on the set's shade faces). The set's own surfaces ignore the scene's
//                      lights: they are painted from DESIGN's lit / shade colours and key direction (-0.30, 0.87, 0.40).
// }
// TWEENS: a set takes keys as a list in the spec, as snowslope's "dark" does (a storyboard cannot tween a set key with
// an action): "hole": [[t, [x, z, yaw, halfL, halfW]], [t, [...]], ...] (eased smoothstep between keys, a step where two
// keys share a time; a third element "linear" in a key, [t, v, "linear"], makes the segment after it linear so the hole
// can follow a rig's linear move; a null value hides the hole from that key on), the same for "shafts" ([t, [x, z]]),
// "wipe" and "dark" ([t, number]). A plain value is a constant.
//
// EXPORTS STORMLAKE { waveAt(x, z, t) (the surface y; heads ride it), heightAt(x, z) (ground or lake-bed y), depthAt(x, z)
// (water depth without the bed noise), shoreX(z), SHORE, LIP, DECK_Y, DECK, PIERS, WAVES, KEY, FOG, ... }.
// waveAt is exact within 30 m of the camera (beyond that the drawn surface flattens: 30-40 m taper, flat past 40 m).
//
// UNDERWATER (camera y < 0): the sky becomes the green background (by the view ray's elevation, darker with depth); the
// set's own surfaces fog to it exactly (1 - exp(-(d / 5.4)^1.7), full from 13 m; the ceiling half); the cast and props
// fog with a scene FogExp2 (density 1 / 5.4, one colour #1f4a3c x depth: DESIGN's allowed fallback), get the green grade
// by ONE screen-space multiply quad (#a8d8c0 at 0.55 at the surface to 0.75 at 6 m down; drawn after the opaque cast and
// props, before the set's own surfaces, only where something stands), and their ink lines turn #0c2a22 (outline
// colours set for the frame and put back after it). NOT done (they need looks.js): the cast's hatching colour and
// strength underwater and the thin top rim; the cel bands stay as the look draws them. Rain veil, hills, mist and sky are
// hidden; 7 light shafts, 1500 silt specks, the bed's 20 stones and 12 weed tufts show.
// Scene state the frame changes (fog, outline colours, two pixel-size uniforms) is set in scene.onBeforeRender and put
// back in onAfterRender, so what the frame cache hashes between frames depends on the story time alone.
// Everything is a function of story time and the camera: no Math.random, no clock. All of it is see-through for the
// contact checks (userData.solid false); water, foam, light, fog and silt are userData.steam.

const D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash2(i, j) {   // integer lattice hash -> 0..1
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const stream = (seed) => { let n = 0; return () => hash2(seed, n++); };

// ---------- numbers ----------
export const DECK_Y = 14.0;
export const DECK = { top: 14.0, w: 8.0, slab: 0.9, girderW: 5.0, girderD: 1.4, under: 11.7, parapetH: 0.9, parapetT: 0.25, railY: 15.05, railR: 0.03 };
export const PIERS = { w: 5.0, d: 1.6, top: 10.5, cap: [8.0, 1.2, 2.0], z: [-20, -50, -80, 36, 66, 96, 126, 156, 186] };
export const LIP = { near: { z: -14, from: -16.5, land: -140, cut: -17 }, far: { z: 30, from: 32.5, land: 215 }, x: [-4, 4], y: DECK_Y };
export const SHORE = { at: [34.5, 0.4, -6], size: [2.5, 4.0], slope: 1 / 12 };
export const KEY = new THREE.Vector3(-0.3, 0.87, 0.4).normalize();
export const WAVES = [[0.22, 9, 20, 3.7, 0.0], [0.14, 5, -15, 2.8, 1.7], [0.08, 2.6, 50, 2.0, 4.1], [0.04, 1.2, -40, 1.4, 2.6]]
  .map(([a, len, head, speed, ph]) => ({ a, len, head, speed, ph, k: (2 * Math.PI) / len, dx: Math.cos(head * D2R), dz: Math.sin(head * D2R), w: ((2 * Math.PI) / len) * speed }));
export const FOG = { d: 5.4, pow: 1.7, full: 13, color: "#1f4a3c", density: 1 / 5.4, grade: "#a8d8c0", gradeK: [0.55, 0.75], ink: "#0c2a22" };
const HOLE_DEFAULT = { halfL: 1.6, halfW: 0.52 };

export const shoreX = (z) => 30 + 5 * Math.sin(z / 19);
const abutZ = (x) => -95 + 4 * Math.sin(x / 23);
const farZ = (x) => 200 + 6 * Math.sin(x / 31);
// water depth from the three shorelines (no bed noise); <= 0 on land
export const depthAt = (x, z) => Math.min(shoreX(z) - x, z - abutZ(x), farZ(x) - z) * 0.27;
export function waveAt(x, z, t) {
  const amp = clamp(depthAt(x, z) / 3);
  let h = 0;
  for (const W of WAVES) h += W.a * Math.sin(W.k * (W.dx * x + W.dz * z) - W.w * t + W.ph);
  return h * amp;
}
function patchW(x, z) {
  const dx = Math.max(Math.abs(x - SHORE.at[0]) - SHORE.size[0] / 2, 0), dz = Math.max(Math.abs(z - SHORE.at[2]) - SHORE.size[1] / 2, 0);
  return 1 - sstep(0, 2, Math.hypot(dx, dz));
}
function land(x, z) {   // { y, region 0 bay 1 abutment 2 far, dl (metres from the waterline), rise (bay: height before the bank) }
  const dBay = shoreX(z) - x, dAb = z - abutZ(x), dFar = farZ(x) - z;
  let y = 0, region = 0, dl = 1e9;
  if (dBay < 0) { const d = -dBay, k = 1 / 12 + (1 / 8 - 1 / 12) * sstep(12, 30, Math.abs(z + 6)), b = 3 / k; const h = Math.min(d * k, 3) + 4 * sstep(b, b + 6, d); if (h >= y) { y = h; region = 0; } dl = Math.min(dl, d); }
  if (dAb < 0) { const d = -dAb, h = Math.min(3, d * 0.5) + 8.6 * sstep(5, 25, d) * (1 - sstep(6, 22, Math.abs(x))); if (h > y) { y = h; region = 1; } dl = Math.min(dl, d); }
  if (dFar < 0) { const d = -dFar, h = Math.min(4, d * 0.3) + 7.6 * sstep(5, 20, d) * (1 - sstep(6, 22, Math.abs(x))); if (h > y) { y = h; region = 2; } dl = Math.min(dl, d); }
  const w = patchW(x, z);
  y += (SHORE.at[1] - y) * w;
  y += 0.03 * (2 * vnoise(x / 1.5, z / 1.5) - 1) * (1 - w) * clamp(y / 0.2);
  return { y, region, dl };
}
export function heightAt(x, z) {
  const dw = depthAt(x, z);
  if (dw > 0) { const d = Math.min(dw, 7.5); return -d + 0.3 * (2 * vnoise(x / 4 + 17.3, z / 4 - 3.1) - 1) * clamp(d / 1.5); }
  return land(x, z).y;
}

// ---------- colours and the shared GLSL ----------
const lin = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = lin(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const F = (n) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const U = {   // shared by every material here (story time; two pixel-size uniforms set per render and put back)
  uTime: { value: 0 }, uUnderMode: { value: -1 }, uDim: { value: 1 }, uPx: { value: 1 }, uViewH: { value: 1920 }, uHatchK: { value: 1 },
  uHole: { value: new THREE.Vector4(0, 0, 0, 0) }, uHoleYaw: { value: 0 }, uWipe: { value: 0 },
};
const wavesGLSL = () => {
  const lines = WAVES.map((W, i) => `  ph = ${F(W.k)} * (${F(W.dx)} * p.x + ${F(W.dz)} * p.y) - ${F(W.w)} * t + ${F(W.ph)};
  r.x += ${F(W.a)} * f[${i}] * sin(ph); r.yz += ${F(W.a * W.k)} * f[${i}] * cos(ph) * vec2(${F(W.dx)}, ${F(W.dz)});`);
  return `vec3 wavesAt(vec2 p, float t, vec4 f) {   // (height, dh/dx, dh/dz); f: each wave's weight
  vec3 r = vec3(0.0); float ph;
${lines.join("\n")}
  return r;
}
float wavePhase(int i, vec2 p, float t) {
${WAVES.slice(0, 2).map((W, i) => `  if (i == ${i}) return ${F(W.k)} * (${F(W.dx)} * p.x + ${F(W.dz)} * p.y) - ${F(W.w)} * t + ${F(W.ph)};`).join("\n")}
  return 0.0;
}`;
};
const COMMON = `
uniform float uTime, uUnderMode, uDim, uPx, uViewH, uHatchK;
const vec3 KEY = vec3(${F(KEY.x)}, ${F(KEY.y)}, ${F(KEY.z)});
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y); }
float underK() { return uUnderMode < -0.5 ? (cameraPosition.y < 0.0 ? 1.0 : 0.0) : uUnderMode; }
float depthDark() { return max(0.6, 1.0 - 0.06 * max(0.0, -cameraPosition.y)); }
vec3 underBg(vec3 d) {
  float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
  vec3 c = e >= 0.0 ? mix(${V3("#1f4a3c")}, ${V3("#3f8064")}, clamp(e / 30.0, 0.0, 1.0))
    : (e > -30.0 ? mix(${V3("#1f4a3c")}, ${V3("#12302a")}, -e / 30.0) : mix(${V3("#12302a")}, ${V3("#081714")}, (-e - 30.0) / 60.0));
  return c * depthDark();
}
float fogF(float d) { return d >= ${F(FOG.full)} ? 1.0 : 1.0 - exp(-pow(d / ${F(FOG.d)}, ${F(FOG.pow)})); }
vec3 finish(vec3 c, vec3 wp, float fogK) {
  vec3 v = wp - cameraPosition; float d = length(v);
  if (underK() > 0.5) return mix(c, underBg(v / max(d, 1e-4)), fogF(d) * fogK);
  return mix(c, ${V3("#7c878a")}, 0.72 * (1.0 - exp(-d / 230.0))) * uDim;
}
float shoreDepth(vec2 p) {
  return min(min(30.0 + 5.0 * sin(p.y / 19.0) - p.x, p.y - (-95.0 + 4.0 * sin(p.x / 23.0))), 200.0 + 6.0 * sin(p.x / 31.0) - p.y) * 0.27;
}
${wavesGLSL()}
`;
const KILL = "gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return;";   // a vertex outside the clip box: nothing is drawn

function mark(o, steam = false, order = 901) {
  o.traverse((c) => { c.userData.solid = false; c.userData.lookOnly = true; if (steam) c.userData.steam = true; c.castShadow = false; c.receiveShadow = false; c.renderOrder = order; });
  return o;
}
const put = (g, o, name) => { o.name = name; g.add(o.userData.solid === false ? o : mark(o)); return o; };
function noLine(m) { m.userData.noOutline = true; m.userData.solid = false; m.userData.outlineParameters = { visible: false }; return m; }
function shader(o) {
  const m = new THREE.ShaderMaterial({ defines: o.defines || {}, uniforms: { ...U, ...(o.uniforms || {}) }, vertexShader: o.vs, fragmentShader: o.fs,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? !o.transparent, depthTest: o.depthTest ?? true, blending: o.blending ?? THREE.NormalBlending });
  return noLine(m);
}

// ---------- the painted, lit material of every solid thing here: a cel key (lit / shade / deep underside), pencil
// strokes in the shade, haze above water and the exact underwater fog below ----------
const LAKE_VS = `${COMMON}
varying vec3 vW; varying vec3 vN;
#ifdef VCOL
attribute vec3 aCol; varying vec3 vCol;
#endif
`;
function lakeMat(o = {}) {
  const defines = { ...(o.vcol && { VCOL: "" }), ...(o.double && { DOUBLE: "" }), ...(o.defines || {}) };
  const m = new THREE.ShaderMaterial({
    defines,
    uniforms: { ...U, uLit: { value: lin(o.lit ?? "#ffffff") }, uShade: { value: lin(o.shade ?? "#9e9e9e") }, uDeep: { value: lin(o.deep ?? o.shade ?? "#808080") }, uHatch: { value: o.hatch ?? 0 }, ...(o.uniforms || {}) },
    vertexShader: `${LAKE_VS}
${o.vHead || ""}
void main() {
  vec3 pos = position; vec3 nor = normal;
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
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`,
    fragmentShader: `${COMMON}
uniform vec3 uLit, uShade, uDeep; uniform float uHatch;
varying vec3 vW; varying vec3 vN;
#ifdef VCOL
varying vec3 vCol;
#endif
float hatchLine() { vec2 p = gl_FragCoord.xy / max(uPx, 0.1); float l = abs(fract((p.x + p.y) / 7.0) - 0.5) * 7.0; return 1.0 - smoothstep(0.5, 1.3, l); }
${o.fHead || ""}
void main() {
  vec3 N = normalize(vN);
#ifdef DOUBLE
  if (!gl_FrontFacing) N = -N;
#endif
  vec3 lit = uLit, shade = uShade, deep = uDeep;
#ifdef VCOL
  lit *= vCol; shade *= vCol; deep *= vCol;
#endif
  float fwx = fwidth(vW.x);
  ${o.fBody || ""}
  float ndl = dot(N, KEY);
  float k = smoothstep(0.0, 0.1, ndl);
  vec3 c = mix(shade, lit, k);
  c = mix(c, deep, smoothstep(0.5, 0.7, -N.y));
  float hs = (1.0 - k) * uHatch * uHatchK * (1.0 - underK());
  if (hs > 0.001) c = mix(c, shade * 0.6, 0.6 * hs * hatchLine());
  c = finish(c, vW, 1.0);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  m.userData.solid = false;
  if (o.ink) { m.userData.outlineParameters = { thickness: o.ink, color: lin(o.inkColor ?? "#24292b").toArray(), alpha: 1 }; }
  else noLine(m);
  return m;
}

// ---------- geometry helpers ----------
function clean(g) {   // non-indexed, position / normal / uv only (so any of them merge)
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
  if (!n.attributes.uv) n.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
  return n;
}
const merge = (list) => mergeGeometries(list.map(clean));
const boxAt = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function slabGeo(pts, top, depth) {   // a plan polygon [[x, z], ...] extruded down from y top
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  g.rotateX(Math.PI / 2); g.translate(0, top, 0); return g;
}
const tube = (pts, r, seg = 12) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false);
function lumpGeo(size, seed) {
  const g = new THREE.IcosahedronGeometry(size / 2, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 0.75 + 0.5 * vnoise(x * 5 + seed * 3.1, y * 5 + z * 4 + seed); p.setXYZ(i, x * n, y * n * 0.85, z * n); }
  const out = g.toNonIndexed(); out.computeVertexNormals(); return out;
}

// ---------- the bridge ----------
const LIPS = {
  near: { tip: [0.05, 0.0, 0.1, 0.0, 0.08, 0.02], val: [0.55, 0.3, 0.9, 0.45, 0.7], seed: 11, rebar: [-3.5, -2.7, -1.9, -0.9, -0.1, 0.8, 1.7, 2.6, 3.4], lumps: [[-1.6, 0.55, 0.75], [2.3, 0.4, 1.05]] },
  far: { tip: [0.02, 0.08, 0.0, 0.1, 0.0, 0.06], val: [0.7, 0.4, 0.85, 0.3, 0.6], seed: 23, rebar: [-3.4, -2.5, -1.6, -0.8, 0.1, 1.0, 1.8, 2.7, 3.5], lumps: [[1.2, 0.7, 0.85], [-2.6, 0.45, 0.6]] },
};
// one stump: from the land (zBack) to the lip (zLip); L = the lip's numbers, null for a clean cut
function buildStump(zBack, zLip, L, parts) {
  const s = Math.sign(zLip - zBack), T = DECK.top, R = stream(L ? L.seed : 5);
  const edge = (extra) => { const out = []; for (let j = 0; j <= 10; j++) { const d = j % 2 === 0 ? L.tip[j / 2] : L.val[(j - 1) / 2]; out.push([4 - 0.8 * j, zLip - s * (d + extra(j))]); } return out; };
  const top = L ? edge(() => 0) : [[4, zLip], [-4, zLip]];
  const low = L ? edge(() => 0.35 + 0.5 * R()) : [[4, zLip], [-4, zLip]];
  const gird = L ? Array.from({ length: 6 }, (_, j) => [2.5 - j, zLip - s * (1.3 + 0.7 * R())]) : [[2.5, zLip], [-2.5, zLip]];
  const poly = (e, w) => [[w, zBack], ...e, [-w, zBack]];
  parts.concrete.push(slabGeo(poly(top, 4), T, 0.45), slabGeo(poly(low, 4), T - 0.45, 0.45), slabGeo(poly(gird, 2.5), T - 0.9, DECK.girderD));
  const zAt = (e, x) => { for (let i = 0; i + 1 < e.length; i++) { const [x0, z0] = e[i], [x1, z1] = e[i + 1]; if (x <= x0 && x >= x1) return z0 + ((z1 - z0) * (x0 - x)) / (x0 - x1); } return e[e.length - 1][1]; };
  // parapets, rail and posts; the +x one bent outward over its last 3 m at a lip
  const px = 4 - DECK.parapetT / 2, py = T + DECK.parapetH / 2, ry = DECK.railY;
  const run = (x, z0, z1, list, steel) => {
    const len = Math.abs(z1 - z0), mid = (z0 + z1) / 2;
    list.push(boxAt(DECK.parapetT, DECK.parapetH, len, x, py, mid));
    steel.push(new THREE.CylinderGeometry(DECK.railR, DECK.railR, len, 8).rotateX(Math.PI / 2).translate(x, ry, mid));
    for (let k = 1; k < len / 2; k++) steel.push(boxAt(0.05, 0.15, 0.05, x, T + DECK.parapetH + 0.075, z0 + Math.sign(z1 - z0) * 2 * k));
  };
  const zA = L ? zLip - s * 3.3 : zLip, zB = zLip - s * 0.35;
  run(px, zBack, zA, parts.concrete, parts.steel);
  run(-px, zBack, L ? zLip - s * 0.6 : zLip, parts.concrete, parts.steel);
  if (!L) return;
  const bentC = [], bentS = [];
  run(px, zA, zB, bentC, bentS);
  const M = new THREE.Matrix4().makeTranslation(4, T, 0).multiply(new THREE.Matrix4().makeRotationZ(-30 * D2R)).multiply(new THREE.Matrix4().makeTranslation(-4, -T, 0));
  for (const g of bentC) parts.concrete.push(g.applyMatrix4(M));
  for (const g of bentS) parts.steel.push(g.applyMatrix4(M));
  const E = new THREE.Vector3(px, ry, zB).applyMatrix4(M);
  parts.steel.push(tube([[E.x, E.y, E.z], [E.x + 0.2, E.y - 0.25, E.z + s * 0.3], [E.x + 0.42, E.y - 1.0, E.z + s * 0.48], [E.x + 0.36, E.y - 2.0, E.z + s * 0.38]], DECK.railR, 16));
  // rebar: 9 rods out of the broken faces, bent down 20-70 degrees, 0.6-1.8 m long
  L.rebar.forEach((x) => {
    const y = T - 0.12 - 0.7 * R(), e = y > T - 0.45 ? top : low, z0 = zAt(e, x) + s * 0.15;
    const len = 0.6 + 1.2 * R(), a = (20 + 50 * R()) * D2R, z1 = z0 + s * len * 0.4;
    const p2 = [x + (R() - 0.5) * 0.3, y - Math.sin(a) * len * 0.6, z1 + s * Math.cos(a) * len * 0.6];
    parts.rebar.push(tube([[x, y, z0 - s * 0.25], [x, y, z0], [x, y - 0.05, z1], p2], 0.02, 10));
  });
  // two lumps of concrete hanging on rebar under the broken edge
  for (const [x, hang, size] of L.lumps) {
    const z0 = zAt(low, x) - s * 0.2, yTop = T - 0.9 - hang, cz = z0 + s * 0.25;
    parts.rebar.push(tube([[x, T - 0.85, z0 - s * 0.1], [x, T - 0.95, z0 + s * 0.12], [x + 0.05, yTop + 0.2, cz], [x + 0.05, yTop - size * 0.2, cz]], 0.02, 10));
    parts.concrete.push(lumpGeo(size, x * 7 + hang).translate(x + 0.05, yTop - size * 0.4, cz));
  }
}
const KIND_DECK = `
float cracks(vec2 p, float fw) {   // painted cracks running back 4 m from both lips
  float best = 0.0;
  for (int L = 0; L < 2; L++) {
    float lipz = L == 0 ? ${F(LIP.near.z)} : ${F(LIP.far.z)}; float s = L == 0 ? 1.0 : -1.0;
    float back = (lipz - p.y) * s;
    if (back < -0.2 || back > 4.2) continue;
    if (L == 0 && NEARLIP == 0) continue;
    for (int i = 0; i < 4; i++) {
      float fi = float(i) + float(L) * 4.0;
      float x0 = -3.0 + 2.0 * float(i) + 0.7 * (hash12(vec2(fi, 1.3)) - 0.5);
      float len = mix(2.4, 4.0, hash12(vec2(fi, 5.1)));
      float x = x0 + 0.3 * sin(back * 2.1 + fi * 1.7) + 0.1 * sin(back * 6.3 + fi * 4.1) + 0.45 * (hash12(vec2(fi, 2.2)) - 0.5) * back;
      float w = 0.02 * (1.0 - back / len);
      best = max(best, step(back, len) * (1.0 - smoothstep(w, w + fw, abs(p.x - x))));
    }
  }
  return best;
}`;
const DECK_BODY = `
  if (N.y > 0.7 && abs(vW.y - ${F(DECK.top)}) < 0.06 && abs(vW.x) < 3.76) {
    lit = ${V3("#3a3d40")};
    lit = mix(lit, ${V3("#5a6266")}, 0.9 * (1.0 - smoothstep(1.35, 1.6, abs(vW.x))));
    float dash = (1.0 - smoothstep(0.075 - fwx, 0.075, abs(vW.x))) * step(mod(vW.z, 9.0), 3.0);
    lit = mix(lit, ${V3("#c9c6b8")}, dash);
    lit = mix(lit, ${V3("#1f2224")}, cracks(vW.xz, fwx));
    shade = lit * 0.72;
  } else if (abs(N.x) > 0.7 && vW.y < ${F(DECK.top - 0.01)} && abs(vW.x) > 2.4) {
    // dark rain runs under the parapet: one per 1.2 m, 0.4-1.5 m long, 8-20 cm wide, tapering
    float sd = sign(vW.x), cz = vW.z / 1.2, ci = floor(cz);
    float cx = 0.25 + 0.5 * hash12(vec2(ci, sd)), w = mix(0.08, 0.2, hash12(vec2(ci + 3.1, sd))) / 1.2, len = mix(0.4, 1.5, hash12(vec2(ci + 7.7, sd)));
    float yy = ${F(DECK.top)} - vW.y, taper = 1.0 - 0.6 * clamp(yy / len, 0.0, 1.0);
    float r = step(yy, len) * (1.0 - smoothstep(0.4 * w * taper, 0.5 * w * taper, abs(fract(cz) - cx)));
    lit = mix(lit, ${V3("#454c4e")}, 0.85 * r); shade = mix(shade, ${V3("#454c4e")} * 0.8, 0.85 * r);
  }`;
const PIER_BODY = `
  float st = 1.0 - smoothstep(0.7, 0.85, vW.y), al = (1.0 - smoothstep(0.25, 0.32, vW.y)) * step(-0.05, vW.y);
  lit = mix(lit, ${V3("#3b4340")}, st); shade = mix(shade, ${V3("#3b4340")} * 0.75, st);
  lit = mix(lit, ${V3("#44553a")}, al); shade = mix(shade, ${V3("#44553a")} * 0.72, al);`;

function buildBridge(g, S, inkPx) {
  const parts = { concrete: [], steel: [], rebar: [] };
  buildStump(LIP.near.land, S.lip === false ? LIP.near.cut : LIP.near.z, S.lip === false ? null : LIPS.near, parts);
  buildStump(LIP.far.land, LIP.far.z, LIPS.far, parts);
  const ink = inkPx(1.5);
  const conc = lakeMat({ lit: "#9a9d98", shade: "#5f6668", deep: "#454c4e", hatch: 1, ink, inkColor: "#26292a", fHead: KIND_DECK, fBody: DECK_BODY, defines: { NEARLIP: S.lip === false ? 0 : 1 } });
  put(g, new THREE.Mesh(merge(parts.concrete), conc), "set-stormlake-deck");
  g.add(mark(new THREE.Mesh(merge(parts.steel), lakeMat({ lit: "#7c8488", shade: "#4a5054", deep: "#3a3f42", ink: inkPx(0.8), inkColor: "#1c2022" }))));
  g.add(mark(new THREE.Mesh(merge(parts.rebar), lakeMat({ lit: "#3a2f2a", shade: "#261e1a", deep: "#1e1815" }))));
  // piers: wall piers from the bed (0.6 m into it) to y 10.5, a hammerhead cap on top
  const piers = [];
  for (const z of PIERS.z) {
    const bot = heightAt(0, z) - 0.6, h = PIERS.top - bot;
    piers.push(boxAt(PIERS.w, h, PIERS.d, 0, bot + h / 2, z), boxAt(PIERS.cap[0], PIERS.cap[1], PIERS.cap[2], 0, PIERS.top + PIERS.cap[1] / 2, z));
  }
  put(g, new THREE.Mesh(merge(piers), lakeMat({ lit: "#9a9d98", shade: "#5f6668", deep: "#454c4e", hatch: 1, ink, inkColor: "#26292a", fBody: PIER_BODY })), "set-stormlake-piers");
}

// ---------- the ground: lake bed, bay mud, the banks (one height field, fine round SHORE) ----------
function axisPts(lo, hi, cell) { const out = [lo]; let v = lo; while (v < hi - 1e-6) { v = Math.min(hi, v + cell(v)); out.push(v); } return out; }
function buildGround(g) {
  const xs = axisPts(-130, 172, (x) => (x >= 22 && x < 46 ? 0.5 : x >= 8 && x < 75 ? 1 : x >= -40 && x < 110 ? 3 : 6));
  const zs = axisPts(-160, 250, (z) => (z >= -22 && z < 10 ? 0.5 : z >= -45 && z < 35 ? 1 : z >= -135 && z < 225 ? 3 : 6));
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), c = new THREE.Color();
  const BED = lin("#1a2a22"), MUD = lin("#4a3f33"), WET = lin("#6b6659"), PLAT = lin("#3d3a2c"), EARTH = lin("#3a332b"), FAR = lin("#383c35");
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], k = j * nx + i, dw = depthAt(x, z);
    let y;
    if (dw > 0) { y = heightAt(x, z); c.copy(BED).multiplyScalar(0.85 + 0.3 * vnoise(x / 3, z / 3)); }
    else {
      const L = land(x, z); y = L.y;
      if (L.region === 0) c.copy(MUD).lerp(PLAT, sstep(2.6, 3.6, y));
      else if (L.region === 1) c.copy(EARTH); else c.copy(FAR);
      c.multiplyScalar(0.9 + 0.2 * vnoise(x / 2.3, z / 2.3));
      c.lerp(WET, 0.85 * (1 - sstep(0, 1.5, L.dl)));
    }
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let n = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1; idx[n++] = a; idx[n++] = cc; idx[n++] = b; idx[n++] = b; idx[n++] = cc; idx[n++] = d; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  const m = mark(new THREE.Mesh(geo, lakeMat({ vcol: true, lit: "#ffffff", shade: "#9e9e9e", deep: "#808080" })));
  m.name = "set-stormlake-ground"; g.add(m);
}
// near SHORE: keep off the level patch and the 30.0 camera's strip toward +x
const offPatch = (x, z, m = 0.6) => !(Math.abs(x - SHORE.at[0]) < SHORE.size[0] / 2 + m && Math.abs(z - SHORE.at[2]) < SHORE.size[1] / 2 + m) && !(x > 35 && z > -9 && z < -2);

function buildShoreBits(g, inkPx) {
  const R = stream(401);
  // 6 puddles 0.3-0.8 m on the mud, draped on the ground
  const puds = [];
  for (let n = 0, tries = 0; n < 6 && tries < 200; tries++) {
    const a = R() * Math.PI * 2, r = 2.2 + 5 * R(), x = SHORE.at[0] + Math.cos(a) * r, z = SHORE.at[2] + Math.sin(a) * r, rad = 0.15 + 0.25 * R();
    if (!offPatch(x, z, 0.8) || depthAt(x, z) > -0.4) continue;
    const c = new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2), p = c.attributes.position;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), pz = p.getZ(i), w = 1 + 0.25 * Math.sin(Math.atan2(pz, px) * 3 + n); const X = x + px * rad * 1.3 * w, Z = z + pz * rad * w; p.setXYZ(i, X, heightAt(X, Z) + 0.015, Z); }
    c.computeVertexNormals(); puds.push(c); n++;
  }
  put(g, new THREE.Mesh(merge(puds), lakeMat({ lit: "#5d6a68", shade: "#4f5b59" })), "set-stormlake-puddles");
  // 14 rocks 0.3-1.4 m: 5 in the shallows, 9 on the mud round SHORE (many small, few big); each its own mesh (inked)
  const rockM = lakeMat({ lit: "#5c6162", shade: "#3a4042", deep: "#30363a", hatch: 1, ink: inkPx(1.0), inkColor: "#1e2224" });
  const rocks = [];
  for (let tries = 0; rocks.length < 14 && tries < 600; tries++) {
    const shallow = rocks.length < 5, size = 0.3 + 1.1 * R() ** 2.2;
    let x, z;
    if (shallow) { z = SHORE.at[2] - 14 + 26 * R(); x = shoreX(z) - 0.4 - 3 * R(); }
    else { const a = R() * Math.PI * 2, r = 2.5 + 8 * R(); x = SHORE.at[0] + Math.cos(a) * r; z = SHORE.at[2] + Math.sin(a) * r; if (depthAt(x, z) > -0.5) continue; }
    if (!offPatch(x, z, 0.5 + size / 2) || rocks.some((q) => Math.hypot(q[0] - x, q[1] - z) < (q[2] + size) * 0.7 + 0.4)) continue;
    rocks.push([x, z, size]);
  }
  rocks.forEach(([x, z, size], i) => {
    const geo = lumpGeo(1, i * 3.7 + 1), y = heightAt(x, z) - 0.22 * size;
    geo.scale(size, size * 0.62, size * 0.85); geo.rotateY(hash2(i, 9) * Math.PI * 2); geo.translate(x, y + 0.25 * size, z);
    put(g, new THREE.Mesh(geo, rockM), `set-stormlake-rock-${i}`);
  });
  return rocks;
}

// ---------- reeds (and the bed's weed tufts): ONE instanced mesh of blades, every third with a cattail head ----------
function bladeGeo() {
  const pos = [], nor = [], uv = [], idx = [], rows = 7;
  for (let r = 0; r <= rows; r++) { const v = r / rows, w = 0.0075 * (1 - 0.85 * v); pos.push(-w, v, 0, w, v, 0); nor.push(0, 0, 1, 0, 0, 1); uv.push(0, v, 1, v); }
  for (let r = 0; r < rows; r++) { const a = r * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const blade = new THREE.BufferGeometry(); blade.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); blade.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); blade.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); blade.setIndex(idx);
  const head = new THREE.CylinderGeometry(0.0125, 0.0125, 0.095, 6).translate(0, 0.84, 0);
  const g = merge([blade, head]), n = g.attributes.position.count, part = new Float32Array(n), nb = blade.index.count;
  for (let i = nb; i < n; i++) part[i] = 1;
  g.setAttribute("aPart", new THREE.BufferAttribute(part, 1));
  return g;
}
function buildReeds(g, rocks) {
  const R = stream(533), inst = [];
  // 9 clumps within 6 m of SHORE (some at the waterline, none on the patch or in the camera strip)
  const clumps = [];
  for (let tries = 0; clumps.length < 9 && tries < 800; tries++) {
    const a = R() * Math.PI * 2, r = 2.4 + 3.6 * R(), x = SHORE.at[0] + Math.cos(a) * r, z = SHORE.at[2] + Math.sin(a) * r;
    if (!offPatch(x, z, 0.9) || depthAt(x, z) > 0.35) continue;
    if (clumps.some((c) => Math.hypot(c[0] - x, c[1] - z) < 1.6) || rocks.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] / 2 + 0.5)) continue;
    clumps.push([x, z, 25 + Math.floor(16 * R()), 0.25 + 0.3 * R(), R() * Math.PI * 2]);
  }
  for (const [cx, cz, n, spread, ph] of clumps) for (let b = 0; b < n; b++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * spread, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const h = (0.9 + 0.7 * R()) * (1 - 0.25 * (d / spread));
    inst.push({ x, y: heightAt(x, z) - 0.03, z, h: Math.max(0.9, h), yaw: R() * Math.PI, lean: 8 + 7 * R(), ph: ph + 0.6 * R(), head: b % 3 === 0 ? 1 : 0, tint: 0 });
  }
  // 12 weed tufts 0.4 m on the bed round the car (3-12 m from the origin, none within 2.5 m of it)
  for (let t = 0; t < 12; t++) {
    const a = R() * Math.PI * 2, r = 2.5 + 9.5 * R(), cx = Math.cos(a) * r, cz = Math.sin(a) * r, ph = R() * 6.28;
    for (let b = 0; b < 8; b++) { const x = cx + (R() - 0.5) * 0.3, z = cz + (R() - 0.5) * 0.3; inst.push({ x, y: heightAt(x, z) - 0.02, z, h: 0.3 + 0.15 * R(), yaw: R() * Math.PI, lean: -6 + 12 * R(), ph: ph + R(), head: 0, tint: 1 }); }
  }
  const geo = bladeGeo(), aRe = new Float32Array(inst.length * 4), aH = new Float32Array(inst.length);
  inst.forEach((q, i) => { aRe.set([q.lean, q.ph, q.head, q.tint], i * 4); aH[i] = q.h; });
  geo.setAttribute("aRe", new THREE.InstancedBufferAttribute(aRe, 4)); geo.setAttribute("aH", new THREE.InstancedBufferAttribute(aH, 1));
  const m = lakeMat({
    double: true, lit: "#6d7a45", shade: "#3f4a2c",
    vHead: "attribute vec4 aRe; attribute float aH; attribute float aPart; varying float vPart; varying float vTint;",
    vPre: "vPart = aPart; vTint = aRe.w; if (aPart > 0.5 && aRe.z < 0.5) pos = vec3(0.0, 0.8, 0.0);",
    vPost: "float v = clamp(position.y, 0.0, 1.0); float ln = radians(aRe.x + 4.0 * sin(6.2832 * uTime / 1.7 + aRe.y)); vW.x += sin(ln) * aH * pow(v, 1.5); vW.y -= (1.0 - cos(ln)) * aH * v;",
    fHead: "varying float vPart; varying float vTint;",
    fBody: `if (vTint > 0.5) { lit = ${V3("#2c4a34")}; shade = ${V3("#1c3022")}; } if (vPart > 0.5) { lit = ${V3("#4a3323")}; shade = ${V3("#4a3323")} * 0.65; }`,
  });
  const im = new THREE.InstancedMesh(geo, m, inst.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  inst.forEach((b, i) => { q.setFromAxisAngle(Y, b.yaw); M.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(1, b.h, 1)); im.setMatrixAt(i, M); });
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = "set-stormlake-reeds"; g.add(mark(im));
  return { clumps: clumps.length, blades: inst.length };
}

// ---------- firs: 30 instanced 3D firs behind the bay, 14 painted cards on the abutment shore ----------
function firGeo() {
  const parts = [new THREE.CylinderGeometry(0.03, 0.05, 0.16, 6).translate(0, 0.08, 0)];
  [[0.32, 0.4, 0.1], [0.26, 0.36, 0.3], [0.2, 0.32, 0.5], [0.13, 0.3, 0.7]].forEach(([r, h, y]) => parts.push(new THREE.ConeGeometry(r, h, 9, 1).translate(0, y + h / 2, 0)));
  return merge(parts);
}
function buildFirs(g) {
  const R = stream(611), spots = [];
  for (let c = 0; spots.length < 30 && c < 40; c++) {   // clumps of 2-6 with gaps, many small and few big
    const cz = -70 + 125 * R(), cx = shoreX(cz) + 20 + 22 * R(), n = 2 + Math.floor(5 * R() ** 1.5);
    for (let i = 0; i < n && spots.length < 30; i++) {
      const x = cx + (R() - 0.5) * 9, z = cz + (R() - 0.5) * 9, back = x - shoreX(z);
      if (back < 18 || back > 45 || spots.some((s) => Math.hypot(s[0] - x, s[2] - z) < 2.5)) continue;
      spots.push([x, heightAt(x, z) - 0.3, z, 10 + 4 * R() ** 1.8, R() * 6.28]);
    }
  }
  const im = new THREE.InstancedMesh(firGeo(), lakeMat({ lit: "#2a3a32", shade: "#18221d" }), spots.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  spots.forEach(([x, y, z, h, yaw], i) => { q.setFromAxisAngle(Y, yaw); M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(h * 0.85, h, h * 0.85)); im.setMatrixAt(i, M); });
  im.instanceMatrix.needsUpdate = true; im.name = "set-stormlake-firs"; g.add(mark(im));
  // the abutment's fir cards: 14 crossed cards 9-13 m at z -110..-130, clear of the bridge
  const cards = [];
  for (let i = 0, tries = 0; i < 14 && tries < 200; tries++) {
    const x = -75 + 150 * R(), z = -110 - 20 * R(), h = 9 + 4 * R();
    if (Math.abs(x) < 9) continue;
    for (const a of [0, Math.PI / 2]) cards.push(new THREE.PlaneGeometry(h * 0.55, h).translate(0, h / 2, 0).rotateY(a + 0.3 * R()).translate(x, heightAt(x, z) - 0.3, z));
    i++;
  }
  const cm = shader({
    side: THREE.DoubleSide,
    vs: `${COMMON}\nvarying vec2 vUv; varying vec3 vW;\nvoid main() { if (underK() > 0.5) { ${KILL} } vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fs: `${COMMON}\nvarying vec2 vUv; varying vec3 vW;
void main() {
  float v = vUv.y, u = abs(vUv.x - 0.5), w;
  if (v < 0.08) w = 0.035; else { float vv = (v - 0.08) / 0.92; w = 0.48 * (1.0 - vv) * (0.45 + 0.55 * (1.0 - fract(vv * 6.0))) + 0.01; }
  if (u > w) discard;
  gl_FragColor = vec4(finish(${V3("#1f2c27")}, vW, 1.0), 1.0);
  #include <colorspace_fragment>
}`,
  });
  put(g, new THREE.Mesh(merge(cards), cm), "set-stormlake-fircards");
  return spots.length;
}

// ---------- sky: a gradient, five painted cloud bands sliding +x, the pale break; underwater the green background ----------
function buildSky(g) {
  const bands = [[5, 2.5], [11, 3.5], [19, 5], [30, 7], [47, 9]];
  const m = shader({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    vs: `varying vec3 vDir;\nvoid main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; gl_Position.z = gl_Position.w * 0.99999; }`,
    fs: `${COMMON}\nvarying vec3 vDir;
void main() {
  vec3 d = normalize(vDir), c;
  if (underK() > 0.5) c = underBg(d);
  else {
    float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
    c = e < 40.0 ? mix(${V3("#7c878a")}, ${V3("#4a545b")}, smoothstep(0.0, 40.0, e)) : mix(${V3("#4a545b")}, ${V3("#2b3238")}, smoothstep(40.0, 90.0, e));
    float az = radians(degrees(atan(d.x, d.z)) - 0.4 * uTime);   // the clouds slide toward +x at 0.4 degrees a second
    vec2 ring = vec2(cos(az), sin(az));
    float br = degrees(acos(clamp(dot(d, KEY), -1.0, 1.0))) + 4.0 * (vnoise(ring * 6.0 + 3.0) - 0.5);
    c = mix(c, ${V3("#9aa5a8")}, 1.0 - smoothstep(9.0, 14.0, br));
${bands.map(([ec, th], i) => `    { float bot = ${F(ec)} - ${F(th)} * (0.55 + 0.6 * vnoise(ring * ${F(4 + i)} + ${F(i * 7.3)}));
      float top = ${F(ec)} + ${F(th)} * (0.45 + 0.7 * vnoise(ring * ${F(5 + i)} + ${F(i * 3.1 + 20)}));
      if (e > bot && e < top) {
        float u = (e - bot) / (top - bot);
        vec3 cc = mix(${V3("#23292e")}, mix(${V3("#4d575e")}, ${V3("#5f6a70")}, ${F(i / 4)}), smoothstep(0.05, 0.6, u));
        float hs = abs(fract((degrees(az) * 1.4 + e * 2.2) / 1.6) - 0.5);
        cc = mix(cc, ${V3("#23292e")}, (1.0 - u) * 0.55 * (1.0 - smoothstep(0.08, 0.14, hs)) * step(0.4, vnoise(vec2(degrees(az) * 0.5, e))));
        c = mix(c, cc, 0.88 * smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.85, 1.0, u)));
      } }`).join("\n")}
    c *= uDim;
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m);
  sky.frustumCulled = false; sky.name = "set-stormlake-sky"; g.add(mark(sky, false, -1000));
}

// ---------- hill rings (painted cards), mist on the far shore, the rain veil round the camera ----------
function buildHills(g) {
  const rings = [[160, 22, "#26352f", 60, true], [210, 45, "#3a4a47", 40, false], [260, 70, "#56656a", 15, false]];
  rings.forEach(([r, h, col, push, teeth], i) => {
    const m = shader({
      side: THREE.DoubleSide, defines: teeth ? { TEETH: "" } : {},
      uniforms: { uR: { value: r }, uB: { value: push }, uH: { value: h }, uSeed: { value: i * 17.3 + 2 }, uCol: { value: lin(col) } },
      vs: `${COMMON}\nuniform float uR, uB; varying vec3 vW;
void main() { if (underK() > 0.5) { ${KILL} }
  float a = atan(position.x, position.z), rr = uR + uB * (1.0 - smoothstep(20.0, 50.0, abs(degrees(a))));
  vW = vec3(sin(a) * rr, position.y, cos(a) * rr); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fs: `${COMMON}\nuniform float uH, uSeed; uniform vec3 uCol; varying vec3 vW;
void main() {
  float a = atan(vW.x, vW.z); vec2 cs = vec2(cos(a), sin(a));
  float top = uH * (1.0 + 0.3 * (2.0 * (0.65 * vnoise(cs * 3.0 + uSeed) + 0.35 * vnoise(cs * 9.0 + uSeed * 2.0)) - 1.0));
  vec3 c = uCol;
#ifdef TEETH
  float s = mod(a - 2.356 + 6.2832, 6.2832) * length(vW.xz);   // metres along the ring, the seam toward (+x, -z)
  float ci = floor(s / 3.0), f = fract(s / 3.0), wv = mix(2.0, 4.0, hash12(vec2(ci, 1.0))) / 3.0;
  top += -3.0 + mix(3.0, 7.0, hash12(vec2(ci, 2.0))) * max(0.0, 1.0 - abs(f - 0.5) * 2.0 / wv);
  float hs = abs(fract(s / 1.3 + 0.37 * hash12(vec2(floor(s / 1.3), 4.0))) - 0.5);
  c = mix(c, c * 0.7, step(hs, 0.07) * step(0.45, vnoise(vec2(s / 1.3, vW.y / 4.0))));
#endif
  if (vW.y > top) discard;
  gl_FragColor = vec4(c * uDim, 1.0);
  #include <colorspace_fragment>
}`,
    });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, h * 1.45 + 1, 256, 1, true).translate(0, (h * 1.45 + 1) / 2 - 1, 0), m);
    cyl.frustumCulled = false; cyl.name = `set-stormlake-hills-${i + 1}`; g.add(mark(cyl, false, 901));
  });
  // the mist band on the water at the far shore: 6 m tall, #8a9698 at 0.5, a soft top
  const mist = shader({
    transparent: true, side: THREE.DoubleSide,
    vs: `${COMMON}\nvarying vec3 vW;\nvoid main() { if (underK() > 0.5) { ${KILL} } vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fs: `${COMMON}\nvarying vec3 vW;\nvoid main() { float top = 6.0 + 2.0 * (vnoise(vec2(vW.x / 23.0, 1.7)) - 0.5); float a = 0.5 * (1.0 - smoothstep(top - 3.0, top, vW.y));
  gl_FragColor = vec4(${V3("#8a9698")} * uDim, a);\n  #include <colorspace_fragment>\n}`,
  });
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(540, 9).translate(0, 4.5, 0), mist); mm.position.set(0, 0, 195); mm.name = "set-stormlake-mist"; g.add(mark(mm, true, 10));
  // the rain veil: 3 upright streak cylinders round the camera at 20, 40, 80 m, streaks falling 9 m/s tilted 12 deg to +x
  [[80, 0.12], [40, 0.18], [20, 0.25]].forEach(([r, op], i) => {
    const cells = Math.round((2 * Math.PI * r) / (0.0125 * r));
    const m = shader({
      transparent: true, side: THREE.DoubleSide, uniforms: { uR: { value: r }, uOp: { value: op }, uCw: { value: (2 * Math.PI * r) / cells } },
      vs: `${COMMON}\nvarying vec3 vL; varying vec3 vW;\nvoid main() { if (underK() > 0.5) { ${KILL} } vL = position; vW = position + cameraPosition; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fs: `${COMMON}\nuniform float uR, uOp, uCw; varying vec3 vL; varying vec3 vW;
void main() {
  float ang = atan(vL.x, vL.z), y = vW.y;
  float c = ang * uR + y * cos(ang) * 0.21256, s = y + 9.0 * uTime, cl = 0.03 * uR;
  vec2 cell = vec2(floor(c / uCw), floor(s / cl));
  float present = step(hash12(cell + uR), 0.28), off = (0.2 + 0.6 * hash12(cell + 1.7)) * uCw;
  float fw = max(fwidth(c), 1e-4), d = abs(c - cell.x * uCw - off);
  float line = 1.0 - smoothstep(0.4 * fw, 1.1 * fw, d), sl = s / cl - cell.y, along = step(0.15, sl) * step(sl, 0.75);
  gl_FragColor = vec4(${V3("#c9d4d6")}, uOp * present * line * along * uDim);
  #include <colorspace_fragment>
}`,
    });
    const hh = Math.max(40, r * 1.8), cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hh * 2, 96, 1, true), m);
    cyl.frustumCulled = false; cyl.name = `set-stormlake-veil-${r}`; g.add(mark(cyl, true, 20 + i));
  });
}

// ---------- the lake surface: a displaced 80 x 80 m patch round the camera, a flat plane beyond; above and below ----------
const WATER_FS = (outer) => `${COMMON}
uniform vec4 uHole; uniform float uHoleYaw;
varying vec3 vW;
float rectD(vec2 q) { vec2 d = abs(q) - vec2(${F(PIERS.w / 2)}, ${F(PIERS.d / 2)}); return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float pierD(vec2 p) {
  float k = clamp(floor((-20.0 - p.y) / 30.0 + 0.5), 0.0, 2.0), k2 = clamp(floor((p.y - 36.0) / 30.0 + 0.5), 0.0, 5.0);
  return min(rectD(p - vec2(0.0, -20.0 - 30.0 * k)), rectD(p - vec2(0.0, 36.0 + 30.0 * k2)));
}
vec2 vor(vec2 q) {
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 gg = vec2(float(i), float(j)), o = 0.1 + 0.8 * hash22(ip + gg); float d = length(gg + o - fp);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return vec2(f1, f2);
}
void main() {
  if (uHole.z > 0.0) { vec2 dd = vW.xz - uHole.xy; float cy = cos(uHoleYaw), sy = sin(uHoleYaw); vec2 l = vec2(dd.x * cy - dd.y * sy, dd.x * sy + dd.y * cy); if (abs(l.x) < uHole.w && abs(l.y) < uHole.z) discard; }
  vec2 sc = floor(cameraPosition.xz / 0.5 + 0.5) * 0.5;
${outer ? "  if (abs(vW.x - sc.x) < 40.0 && abs(vW.z - sc.y) < 40.0) discard;" : ""}
  float d = distance(vW, cameraPosition), fwm = fwidth(vW.x) + fwidth(vW.z);
  float sd = shoreDepth(vW.xz), amp = clamp(sd / 3.0, 0.0, 1.0);
  vec4 fade = vec4(1.0 - smoothstep(80.0, 150.0, d), 1.0 - smoothstep(45.0, 90.0, d), 1.0 - smoothstep(22.0, 45.0, d), 1.0 - smoothstep(12.0, 25.0, d));
  vec3 w = wavesAt(vW.xz, uTime, fade * amp);
  vec3 N = normalize(vec3(-w.y, 1.0, -w.z));
  // rain: one ring per 1.2 m cell every 0.9 s (its centre inset so the ring stays in its cell)
  vec2 ci = floor(vW.xz / 1.2), ctr = (ci + 0.21 + 0.58 * hash22(ci)) * 1.2;
  float age = mod(uTime + hash12(ci + 3.3) * 0.9, 0.9), rd = length(vW.xz - ctr);
  vec3 c;
  if (underK() > 0.5) {
    // the bright rippled ceiling: a window above the camera (1.5 m toward the key), a dark mirror round it
    vec2 wc = cameraPosition.xz + 1.5 * normalize(KEY.xz);
    float r = distance(vW.xz, wc), mir = smoothstep(8.0, 9.5, r);
    c = mix(mix(${V3("#e9f7e4")}, ${V3("#7fc09a")}, smoothstep(3.0, 8.0, r)), ${V3("#1f4a3c")}, mir);
    vec2 q = (vW.xz - vec2(0.6 * uTime, 0.0) + w.yz * 0.8) / 0.85;
    vec2 f = vor(q); float e = (f.y - f.x) * 0.5 * 0.85, lw = mix(0.03, 0.05, vnoise(q * 0.7));
    float line = (1.0 - smoothstep(lw, lw + fwm, e)) * (1.0 - smoothstep(0.03, 0.08, fwm));
    c = mix(c, mix(${V3("#f4fbf0")}, ${V3("#2f6b54")}, mir), line);
    c = mix(c, ${V3("#f4fbf0")}, step(age, 0.1) * (1.0 - smoothstep(0.03, 0.03 + fwm, rd)) * (1.0 - smoothstep(8.0, 15.0, d)));
    c = finish(c, vW, 0.5);
  } else {
    float H = 0.48 * amp + 1e-3, h = w.x, s = dot(N, KEY) - KEY.y;
    float trough = max(1.0 - smoothstep(-0.075, -0.045, s), 1.0 - smoothstep(-0.16 * H, -0.1 * H, h));
    float crest = smoothstep(0.03, 0.05, s) * smoothstep(0.0, 0.04 * H, h);
    c = mix(${V3("#4a5d57")}, ${V3("#2f403d")}, trough);
    c = mix(c, ${V3("#7d8f88")}, crest * (1.0 - trough));
    c = mix(c, ${V3("#6c7b7a")}, smoothstep(60.0, 140.0, d));
    // a broken ink line on the crests of the two big waves, within 15 m
    float ink = 0.0;
    for (int i = 0; i < 2; i++) {
      float ph = wavePhase(i, vW.xz, uTime), ep = mod(ph - 1.5708 + 3.14159, 6.28318) - 3.14159;
      ink = max(ink, (1.0 - smoothstep(0.6, 1.4, abs(ep) / max(fwidth(ph), 1e-4))) * step(0.42, vnoise(vec2(dot(vW.xz, vec2(0.35, -0.94)) * 0.6, float(i) * 9.0))));
    }
    c = mix(c, ${V3("#1c2a28")}, ink * amp * (1.0 - smoothstep(10.0, 15.0, d)));
    // whitecap streaks along the wind on the highest crests, foam collars round the piers and along the waterline
    vec2 fq = (vW.xz - vec2(3.477, 1.265) * uTime) / vec2(1.2, 0.4), fc = floor(fq), ff = fract(fq);
    float len = mix(0.25, 0.9, hash12(fc + 7.1)), cx = 0.5 + (0.5 - 0.5 * len) * (2.0 * hash12(fc + 4.4) - 1.0), wy = mix(0.1, 0.19, hash12(fc + 2.3)), cy = 0.3 + 0.4 * hash12(fc + 5.9);
    float streak = step(hash12(fc), 0.55) * (1.0 - smoothstep(len * 0.5 - 0.06, len * 0.5, abs(ff.x - cx))) * (1.0 - smoothstep(wy - 0.05, wy, abs(ff.y - cy)));
    float foam = smoothstep(0.62 * H, 0.7 * H, h) * streak * (1.0 - smoothstep(25.0, 60.0, d));
    float wob = 0.04 * sin(vW.x * 3.1 + vW.z * 2.3 + uTime * 2.4);
    foam = max(foam, 1.0 - smoothstep(0.22, 0.32, pierD(vW.xz) + wob));
    foam = max(foam, 1.0 - smoothstep(0.06, 0.09, sd + 0.25 * wob));
    c = mix(c, ${V3("#dfe8e4")}, foam);
    float ring = step(age, 0.45) * (1.0 - smoothstep(0.01, 0.01 + fwm, abs(rd - 0.25 * age / 0.45)));
    c = mix(c, ${V3("#c9d6d3")}, ring * 0.5 * (1.0 - age / 0.45) * (1.0 - smoothstep(20.0, 25.0, d)));
    c = finish(c, vW, 1.0);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function buildWater(g) {
  const inner = shader({
    side: THREE.DoubleSide,
    vs: `${COMMON}\nvarying vec3 vW;
void main() {
  vec2 sc = floor(cameraPosition.xz / 0.5 + 0.5) * 0.5;
  vec3 p = vec3(position.x + sc.x, 0.0, position.z + sc.y);
  float taper = 1.0 - smoothstep(30.0, 40.0, max(abs(position.x), abs(position.z)));
  float amp = clamp(shoreDepth(p.xz) / 3.0, 0.0, 1.0) * taper;
  p.y = wavesAt(p.xz, uTime, vec4(amp)).x;
  vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,
    fs: WATER_FS(false),
  });
  const outer = shader({
    side: THREE.DoubleSide,
    vs: `${COMMON}\nvarying vec3 vW;\nvoid main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fs: WATER_FS(true),
  });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 160, 160).rotateX(-Math.PI / 2), inner); a.frustumCulled = false; a.name = "set-stormlake-water";
  const b = new THREE.Mesh(new THREE.PlaneGeometry(560, 560, 8, 8).rotateX(-Math.PI / 2), outer); b.frustumCulled = false; b.name = "set-stormlake-water-far";
  g.add(mark(a, true, 902), mark(b, true, 902));
}

// ---------- underwater: bed stones, light shafts, silt, the grade quad; the foam wipe ----------
const SHAFT_AWAY = Math.atan2(-KEY.x, -KEY.z);   // the azimuth (from +z toward +x) pointing away from the key light
function buildUnder(g) {
  const R = stream(727);
  // 20 dark stones on the bed round the car, 3-13 m from the origin (ONE instanced mesh, no ink)
  const stones = new THREE.InstancedMesh(lumpGeo(1, 4.2), lakeMat({ lit: "#16231c", shade: "#0e1813" }), 20), M = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 20; i++) {
    const a = R() * 6.28, r = 3 + 10 * R(), x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.2 + 0.6 * R() ** 2;
    q.setFromEuler(new THREE.Euler(R() * 0.5, R() * 6.28, R() * 0.5)); M.compose(new THREE.Vector3(x, heightAt(x, z) + 0.05 * s, z), q, new THREE.Vector3(s, s * 0.6, s * 0.8)); stones.setMatrixAt(i, M);
  }
  stones.instanceMatrix.needsUpdate = true; stones.name = "set-stormlake-bedstones"; g.add(mark(stones));
  // 7 light shafts (2 crossed cards each) in a 10 x 10 m patch, at least 1.5 m apart
  const SH = [];
  for (let tries = 0; SH.length < 7 && tries < 500; tries++) {
    const x = (R() - 0.5) * 10, z = (R() - 0.5) * 10;
    if (SH.some((p) => Math.hypot(p.x - x, p.z - z) < 1.5)) continue;
    SH.push({ x, z, w: 0.5 + 0.9 * R(), lean: 10 + 8 * R(), az: (-10 + 35 * R()) * D2R, yaw: R() * Math.PI, sway: R() * 6.28, ph: R() * 6.28 });
  }
  const geo = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), aPh = new Float32Array(SH.length * 2);
  SH.forEach((s, i) => { aPh[i * 2] = s.ph; aPh[i * 2 + 1] = s.ph; });
  geo.setAttribute("aPh", new THREE.InstancedBufferAttribute(aPh, 1));
  const sm = shader({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vs: `${COMMON}\nattribute float aPh; varying vec2 vUv; varying vec3 vW; varying float vPh;
void main() { if (underK() < 0.5) { ${KILL} }
  vec3 pos = position; float v = -pos.y; pos.x *= mix(1.0, 1.3, v);
  vec4 w = modelMatrix * instanceMatrix * vec4(pos, 1.0); vW = w.xyz; vUv = vec2(uv.x, v); vPh = aPh;
  gl_Position = projectionMatrix * viewMatrix * w; }`,
    fs: `${COMMON}\nvarying vec2 vUv; varying vec3 vW; varying float vPh;
void main() {
  float u = abs(vUv.x - 0.5) * 2.0, a = u < 0.769 ? 0.16 : 0.08;
  a *= clamp(1.0 + vW.y / 6.0, 0.0, 1.0) * (1.0 + 0.25 * sin(6.2832 * uTime / 2.3 + vPh)) * (1.0 - 0.5 * fogF(distance(vW, cameraPosition)));   // light: half the fog, as the ceiling
  gl_FragColor = vec4(${V3("#bfe8cf")}, a);
  #include <colorspace_fragment>
}`,
  });
  const shafts = new THREE.InstancedMesh(geo, sm, SH.length * 2); shafts.frustumCulled = false; shafts.name = "set-stormlake-shafts"; g.add(mark(shafts, true, 30));
  const qa = new THREE.Quaternion(), qy = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), Sc = new THREE.Vector3(), A = new THREE.Vector3();
  const placeShafts = (cx, cz, t) => {
    SH.forEach((s, i) => {
      const lam = (s.lean + 3 * Math.sin((2 * Math.PI * t) / 7 + s.sway)) * D2R, az = SHAFT_AWAY + s.az;
      const lx = Math.sin(az), lz = Math.cos(az); A.set(-lz, 0, lx).normalize(); qa.setFromAxisAngle(A, lam);
      for (let k = 0; k < 2; k++) { qy.setFromAxisAngle(Y, s.yaw + (k * Math.PI) / 2); P.set(cx + s.x, 0, cz + s.z); Sc.set(s.w * 1.3, 6 / Math.cos(lam), 1); M.compose(P, qa.clone().multiply(qy), Sc); shafts.setMatrixAt(i * 2 + k, M); }
    });
    shafts.instanceMatrix.needsUpdate = true;
  };
  // 1500 silt specks in an 8 x 7.5 x 10 m box that wraps round the camera
  const N = 1500, sp = new Float32Array(N * 3), size = new Float32Array(N), kind = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) { sp.set([R(), R(), R()], i * 3); const fl = R() < 0.1; kind[i] = fl ? 1 : 0; size[i] = fl ? 0.015 : 0.003 + 0.005 * R(); ph[i] = R() * 6.28; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); pg.setAttribute("aSize", new THREE.BufferAttribute(size, 1)); pg.setAttribute("aKind", new THREE.BufferAttribute(kind, 1)); pg.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  const pm = shader({
    transparent: true, depthWrite: false,
    vs: `${COMMON}\nattribute float aSize, aKind, aPh; varying float vA;
void main() {
  if (underK() < 0.5) { gl_PointSize = 0.0; ${KILL} }
  vec3 box = vec3(8.0, 7.5, 10.0), c = cameraPosition, wob = 0.02 * vec3(sin(1.5708 * uTime + aPh), sin(1.5708 * uTime + aPh * 1.7), 0.0);
  vec3 p = position * box + vec3(0.03 * uTime, 0.0, 0.0) + wob;
  p = c + mod(p - c + box * 0.5, box) - box * 0.5;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  if (p.y > -0.03 || -mv.z < 0.05) { gl_PointSize = 0.0; ${KILL} }
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(2.0 * uPx, aSize * projectionMatrix[1][1] * uViewH * 0.5 / -mv.z);
  vA = (aKind > 0.5 ? 0.2 : 0.35) * (1.0 - fogF(length(mv.xyz)));
}`,
    fs: `${COMMON}\nvarying float vA;\nvoid main() { vec2 q = gl_PointCoord - 0.5; if (dot(q, q) > 0.25) discard; gl_FragColor = vec4(${V3("#a9c9a8")}, vA);\n  #include <colorspace_fragment>\n}`,
  });
  const silt = new THREE.Points(pg, pm); silt.frustumCulled = false; silt.name = "set-stormlake-silt"; g.add(mark(silt, true, 31));
  // the green grade on the cast and props: one full-screen multiply, after them and before the set's own surfaces,
  // only where something was drawn (depth test GREATER at the far end: the cleared background is left alone)
  const gm = shader({
    depthWrite: false, blending: THREE.CustomBlending,
    vs: `${COMMON}\nvoid main() { if (underK() < 0.5) { ${KILL} } gl_Position = vec4(position.xy, 0.99999, 1.0); }`,
    fs: `${COMMON}\nvoid main() { float s = mix(${F(FOG.gradeK[0])}, ${F(FOG.gradeK[1])}, clamp(-cameraPosition.y / 6.0, 0.0, 1.0)); gl_FragColor = vec4(mix(vec3(1.0), ${V3(FOG.grade)}, s), 1.0); }`,
  });
  Object.assign(gm, { depthFunc: THREE.GreaterDepth, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  const grade = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gm); grade.frustumCulled = false; grade.name = "set-stormlake-grade"; g.add(mark(grade, true, 900));
  // the foam wipe (spec wipe 0..1): #dfeee6 over the whole frame with 14 round bubble blobs 60-220 px; on top of all,
  // writing the nearest depth so no ink line draws over it
  const wm = shader({
    transparent: true, depthWrite: true,
    vs: `varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, -1.0, 1.0); }`,
    fs: `uniform float uWipe; varying vec2 vUv;
float h1(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec2 px = vec2(vUv.x * 1080.0, vUv.y * 1920.0); vec3 c = ${V3("#dfeee6")};
  for (int i = 0; i < 14; i++) {
    float fi = float(i); vec2 ctr = vec2(h1(vec2(fi, 3.7)) * 1080.0, h1(vec2(fi, 9.1)) * 1920.0); float r = mix(30.0, 110.0, h1(vec2(fi, 5.3)));
    float d = length(px - ctr), inside = 1.0 - smoothstep(r - 1.5, r, d), rim = 1.0 - smoothstep(1.5, 3.5, abs(d - r));
    float hl = (1.0 - smoothstep(r * 0.16, r * 0.24, length(px - ctr - vec2(-0.38, 0.38) * r))) * inside;
    c = mix(c, ${V3("#bfd9cc")}, inside * 0.4); c = mix(c, ${V3("#9fc4b4")}, rim * 0.85); c = mix(c, vec3(1.0), hl * 0.9);
  }
  gl_FragColor = vec4(c, uWipe);
  #include <colorspace_fragment>
}`,
  });
  wm.depthFunc = THREE.AlwaysDepth;
  const wipe = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), wm); wipe.frustumCulled = false; wipe.name = "set-stormlake-wipe"; g.add(mark(wipe, true, 5000));
  return { placeShafts, wipe, silt, shafts: SH.length };
}

// ---------- keys ----------
// a key list [[t, v, ease?], ...] (v a number, an array or null) at time t; a plain value is a constant
function keyAt(K, t, def = null, list = false) {
  if (K == null) return def;
  if (!list || !Array.isArray(K) || !Array.isArray(K[0])) return K;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i + 1 < K.length; i++) {
    const [t0, v0, e] = K[i], [t1, v1] = K[i + 1];
    if (t >= t0 && t < t1) {
      if (v0 == null || v1 == null) return v0;
      const u = (t - t0) / (t1 - t0), k = e === "linear" ? u : u * u * (3 - 2 * u);
      return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * k) : v0 + (v1 - v0) * k;
    }
  }
  return K[K.length - 1][1];
}
const numKey = (K, t, def) => { const v = keyAt(K, t, def, Array.isArray(K)); return typeof v === "number" ? v : def; };
const vecKey = (K, t, def) => keyAt(K, t, def, Array.isArray(K) && Array.isArray(K[0]));

// ---------- the set ----------
export function buildStormlake(scene, S = {}) {
  const g = new THREE.Group(); g.name = "set-stormlake"; scene.add(g);
  const BG = new THREE.Color("#7c878a"); scene.background = BG; scene.fog = null;
  const inkSet = S.ink ? (typeof S.ink === "object" ? S.ink.set ?? 1.1 : 1.1) : null;
  const inkPx = (k) => (inkSet ? inkSet * k : 0.0016 * k);
  U.uUnderMode.value = S.under === true ? 1 : S.under === false ? 0 : -1;
  U.uHatchK.value = S.hatch === false ? 0 : 1;
  buildSky(g);
  buildHills(g);
  buildWater(g);
  buildBridge(g, S, inkPx);
  buildGround(g);
  const rocks = buildShoreBits(g, inkPx);
  const reeds = buildReeds(g, rocks);
  const firs = buildFirs(g);
  const under = buildUnder(g);
  STORMLAKE.counts = { rocks: rocks.length, ...reeds, firs, shafts: under.shafts, silt: 1500 };

  const tick = (t) => {
    U.uTime.value = t;
    const h = vecKey(S.hole, t, null);
    if (Array.isArray(h) && h.length >= 2) { U.uHole.value.set(h[0], h[1], h[3] ?? HOLE_DEFAULT.halfL, h[4] ?? HOLE_DEFAULT.halfW); U.uHoleYaw.value = (h[2] ?? 0) * D2R; }
    else { U.uHole.value.set(0, 0, 0, 0); U.uHoleYaw.value = 0; }
    const c = vecKey(S.shafts, t, [0, 0]) || [0, 0];
    under.placeShafts(c[0], c[1], t);
    const w = clamp(numKey(S.wipe, t, 0)); U.uWipe.value = w; under.wipe.visible = w > 0.001;
    U.uDim.value = 1 - 0.45 * clamp(numKey(S.dark, t, 0));
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);

  // per-render state from the camera: the cast's fog and ink colour underwater, the pixel scale. Only the scene's own
  // passes (the main render: our background; the ink pass: background null) and never a mask pass (an override
  // material or another background); everything is put back after the render
  const FOGX = new THREE.FogExp2(FOG.color, FOG.density), FOGC = lin(FOG.color), INKC = lin(FOG.ink).toArray(), v2 = new THREE.Vector2();
  let mode = 0, inked = null;
  const restoreInk = () => { if (inked) for (const [op, c] of inked) op.color = c; inked = null; };
  const prevB = scene.onBeforeRender, prevA = scene.onAfterRender;
  scene.onBeforeRender = function (R, sc, cam, rt) {
    prevB.call(this, R, sc, cam, rt);
    mode = sc.overrideMaterial ? 0 : sc.background === BG ? 1 : sc.background === null ? 2 : 0;
    if (!mode) { under.silt.visible = false; return; }
    if (mode === 1) restoreInk();
    if (rt) v2.set(rt.width, rt.height); else R.getDrawingBufferSize(v2);
    U.uPx.value = v2.x / 1080; U.uViewH.value = v2.y;
    const camY = cam.matrixWorld.elements[13], isUnder = U.uUnderMode.value < -0.5 ? camY < 0 : U.uUnderMode.value > 0.5;
    if (isUnder && (sc.fog === null || sc.fog === FOGX)) { FOGX.color.copy(FOGC).multiplyScalar(Math.max(0.6, 1 - 0.06 * Math.max(0, -camY))); sc.fog = FOGX; }
    if (isUnder && mode === 1) {
      inked = []; const seen = new Set();
      sc.traverseVisible((o) => { if (!o.isMesh || !o.material) return; for (const m of [].concat(o.material)) { const op = m?.userData?.outlineParameters; if (!op || op.visible === false || !op.color || seen.has(op)) continue; seen.add(op); inked.push([op, op.color]); op.color = INKC; } });
    }
  };
  scene.onAfterRender = function (R, sc, cam) {
    prevA.call(this, R, sc, cam);
    under.silt.visible = true;
    if (!mode) return;
    if (sc.fog === FOGX) sc.fog = null;
    U.uPx.value = 1; U.uViewH.value = 1920;
    if (mode === 2) restoreInk();
    mode = 0;
  };
  return g;
}

export const STORMLAKE = {
  waveAt, heightAt, depthAt, shoreX, SHORE, LIP, DECK_Y, DECK, PIERS, WAVES: WAVES.map(({ a, len, head, speed, ph }) => ({ a, len, head, speed, ph })),
  KEY: KEY.toArray(), FOG, hole: { ...HOLE_DEFAULT }, waterline: { bay: "x = 30 + 5 sin(z / 19)", abutment: "z = -95 + 4 sin(x / 23)", far: "z = 200 + 6 sin(x / 31)" },
  hills: [{ r: 160, h: 22 }, { r: 210, h: 45 }, { r: 260, h: 70 }], counts: null,
};
