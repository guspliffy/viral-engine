import * as THREE from "three";
import { clamp } from "./util.js";

// There's a catch EP07 "Only you remember" (DESIGN storyboards/series/what-if/07-fire-rewind/DESIGN.md, section 3): fire, glass
// and smoke that run BACKWARD. One rule for all four kinds: every position, size, flicker and alpha is a pure function of the
// param `time` and the other params. NOTHING reads the clip time (the second argument of apply, the world clock, is ignored,
// so a pause window can't freeze it: a prop tween runs on clip time, checked 13 Nov 2026). Tween `time` forward at 1 s/s to
// burn, backward at 3 s/s to rewind, hold it to freeze it. Periodic motion is sin(2 pi (time * f + phase)): no start, runs
// either way. No Math.random, no wall clock.
//
// SEEDING. propState (props3d.js) defaults: time = spec.time else 2.75, grow = spec.grow else 0, curl 0, level = spec.level else 1
// (NOT 0: floorsmoke wants spec.level 0 or a seed). low, spread, front, drift are unknown to propState: until a tween sets them
// they read spec.<name> else the default below, and the first tween of such a key JUMPS to its end: seed every param with a
// dur-0 `set` at clip time 0 (c.prop(0, id, { time: 9.9, grow: 0, low: 0 }, 0)).
//
// COMMON. All kinds are see-through (userData.steam), solid false, no shadow, no ink outline (noOutline). Frame A / B and the
// origins are DESIGN's: A = the street (x right, y up, z toward the street, facade face z 0, pavement y 0), B = inside (the
// stair). Palette: tongues #ff5a1f #ff8a2a #ffc23d #ffe27a, core #fff3c4; smoke body #5a5560, shade #3b3742, lit underside
// #a8623a; embers #ffb23d to #ff5a1f. A flame tongue is a flat tapered leaf facing the camera (opacity 0.88), bent by two
// travelling sine waves (2.2 and 3.7 cycles per second of `time`, 12 % and 6 % of its length), its length breathing +-18 % at
// 1.3-2.1 Hz (hashed per tongue). One instanced mesh per family (tongues, puffs, embers, glows, shards, cracks).
//
//   facadefire   Origin: frame A (0, 1.15, 0) = the middle of the fire window's sill, facing +z (the window is x -0.75..0.75, its
//                transom y 1.02..1.30 local, two lights x +-0.03..0.72, y 0.04..1.00 local, glass planes at z -0.10).
//                Spec: burstAt 10.8 (s, in `time` units). Params:
//                  time (s; default spec.time else 2.75: SEED IT),
//                  grow 0..1 (default 0): 0 nothing, glass whole and clean, room dark; 0..0.15 the room glow rises and 8 tongues
//                    burn behind the glass; 0.15..0.5 6 tongues out of the open transom (0.25 -> 0.7 m), thin smoke, soot starts;
//                    0.5..0.85 transom tongues to 0.9 m (soft-capped, see NOTES), 9 lick tongues climb the arch, the smoke band
//                    is full, embers on; 0.85..1 lick tips reach local y 1.73 (frame A y 2.88), never higher; light full,
//                  curl 0..1 (default 0): the tag's one pale wisp from the transom's open edge (5 puffs, 0.06 -> 0.22 m,
//                    rises 0.9 m, bends +x, #b9b6c4 at 0.7 x curl); use it with grow 0,
//                  low 0..1 (default spec.low else 0): the smoke band's underside from local y 3.25 (A 4.40) down to 2.80
//                    (A 3.95), never lower: it then crosses Chip's upper sash only.
//                Glass: before burstAt two whole panes (soot veil #2a2024 at 0.45 x grow, a faint glass tint with one reflection
//                band); from burstAt - 0.10 three white cracks (+ a branch each) grow across each pane; from burstAt each pane is
//                18 shards cut from a fixed jittered 3 x 6 grid (36 in all, so at tau 0 they tile the pane exactly),
//                #cfe6ee at 0.55 with a white edge, thrown out +z (2.4-5.2 m/s), under gravity -9.8, spinning 3-9 rad/s, landing
//                on the pavement (y 0.006 in A) inside x -1.4..1.4, z 0.4..2.7, flat, frozen, none later than tau 1.1. Backward
//                they lift off, fly in, re-seat, the cracks close. For tau 0..0.45 the mouth widens from the transom to the
//                whole opening (14 more tongues) and every tongue is x (1 + 0.35 bump(tau / 0.45)); the wide mouth then stays.
//                Chip's box (x -0.80..0.80, y 2.90..4.35 in A, z > -0.1) stays free of tongues, puffs and embers while low = 0.
//                Parts: room glow plane (z -1.70, behind the sofa, replaces "emissive back wall"), tongues (41), smoke puffs
//                (16, 2 streams), embers (40), soot fan on the brick (z 0.02), ONE point light at (0, 0.9, 0.9) #ff8a2a range 7
//                x grow x (0.8 + 0.2 flicker(time)). Draw order: glow, glass, soot, tongues, smoke, cracks, shards, embers.
//   blockfire    Origin: frame A origin. Params: time, spread 0..1 (default 0). Eight window fires switch on in DESIGN's order
//                (G/-2.1, 1st/-2.1, 1st/2.3, 2nd/0, 2nd/-2.1, G/-4.2, 2nd/2.3, 3rd/0), each over 0.15 of spread: an inside glow
//                plane, 6 tongues out of the top third (42 in all) and 2 smoke puffs each. Never Chip's window. The two beside
//                him keep their tongues inside the frame and lean away; 2nd/0 burns inside only (glow, nothing out, no puffs).
//                12 roof puffs (1.2-2.2 m) along y 9.5..13 drifting +x, 30 embers, ONE point light (0, 4, 2.5) #ff7a2a x spread.
//   stairfire    Origin: frame B (1.7, 0, -2.4), the middle of the stair's foot, +z down the stair. Spec: at 10 (time units, the
//                moment it bursts), steps 16, rise 0.14, tread 0.30, w 1.6. Params: time, grow 0..1 (default 0), front 0..1
//                (default 0: how far DOWN the flight the fire has rolled; burning steps are n >= 15 - 14 x front, so 0 = the
//                landing and the top 2 steps, 1 = to the foot). Before `at` nothing. tau 0..0.35: every tongue x (1 + 0.6
//                bump(tau / 0.35)), a core flash #fff3c4 1.4 m across at the hall mouth (local (0, 2.94, -4.8)) fading over
//                the 0.35 s, 14 embers thrown out and down the stair (ballistic, rest on the treads, fade by tau 1.8).
//                Body: 3 tongues per burning step (0.5-1.1 m x grow), 8 on the landing (to 1.5 m), the rolling head (4 wide tongues
//                0.7-1.0 m leaning 25 degrees downstairs + a low flame lip 0.15 m tall across the tread): 61 at most. A glow
//                strip on each burning tread (#ff8a2a additive 0.5). 12 smoke puffs from the landing to y 5.0 then +x (none at
//                B x < 0.2 above y 3.0), ONE point light 0.8 m above the front step, #ff8a2a, range 8. Keep Spud 1 m below the front.
//   floorsmoke   Origin: the middle of spec.box [w, d] on the floor (default [1.6, 8], the hallway; [5, 7.2] the lobby), the box
//                runs along z. Spec: box, n (default ceil(w d 2), cap 40). Params: time, level 0..1 (propState default 1: seed it;
//                the layer's top is 0.36 m x level, ankle 0.3, waist 1), drift (default spec.drift else 0.25: m/s along +z, in
//                `time` units, negative runs it back). A flat base sheet (alpha 0.7, soft edges 0.3 m in) at 0.6 x the top,
//                and n billow puffs (0.35-0.6 m wide, 0.20-0.34 m tall at level 1, cumulus tops) sliding along the drift, looping
//                over the box length, bobbing 3 cm, shrinking away over the last 0.5 m at each end; within 0.25 m of a side wall
//                they stand 25 % taller; none tops 0.45 m. Colours top #b9b6bd, body #8d8a94, underside #5f5c68. It takes the
//                room's light (lit material, no light of its own). Spud's mouth is at 0.42 m: keep level <= 0.8 with a face low.
//
// Nothing here is held by a hand: FIREREWIND_GRIPS is empty. Kind names facadefire, blockfire and stairfire are not in props3d.js
// FX_KINDS (floorsmoke is: it matches /smoke/): only matters for attach.js "support" of a prop that is let go, which these never are.

const TAU = Math.PI * 2;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ramp = (a, b, x) => clamp((x - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const fr = (x) => x - Math.floor(x);
const bump = (x) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
const flicker = (T) => 0.5 + 0.25 * Math.sin(TAU * 7.3 * T) + 0.25 * Math.sin(TAU * 11.9 * T + 1.3);
const num = (v, d) => (typeof v === "number" ? v : d);
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const flag = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const C = (hex) => new THREE.Color(hex);
const PAL = ["#ff5a1f", "#ff8a2a", "#ffc23d", "#ffe27a", "#fff3c4"].map(C);
const EMB_A = C("#ffb23d"), EMB_B = C("#ff5a1f"), SMOKE = C("#5a5560"), LITCOL = C("#a8623a"), PALE = C("#b9b6c4");
const PAVE = 0.006;   // the pavement in frame A (y 0.006 over the cobbles)

// a length that never passes `cap` (a soft knee from 80 %, so a clamped tongue doesn't flatten into a ruler)
const softCap = (len, cap) => (len <= cap * 0.8 ? len : cap * (0.8 + 0.2 * Math.tanh((len / cap - 0.8) / 0.2)));

// ------------------------------------------------------------------------------------------------ shared instanced families
function instFamily(base, n, attrs) {
  const g = new THREE.InstancedBufferGeometry(); g.copy(base); g.instanceCount = n;
  const A = {};
  for (const [k, size] of Object.entries(attrs)) { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); A[k] = a; }
  return { g, A };
}
const shaderMat = (U, vs, fs, o = {}) => flag(new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, ...o }));

// flame tongues: a flat tapered leaf, camera-facing about its own axis (the rain streak's trick), bent in the vertex shader
const TONGUE_VS = `
uniform float uT;
attribute vec3 aBase; attribute vec4 aDim; attribute vec4 aPh; attribute vec3 aCol;
varying vec3 vCol; varying float vA;
void main() {
  float v = position.y;
  vec4 vp = viewMatrix * modelMatrix * vec4(aBase, 1.0);
  float sc = length(modelMatrix[0].xyz);
  vec3 vd = normalize(mat3(viewMatrix) * (mat3(modelMatrix) * normalize(vec3(aDim.z, 1.0, aDim.w))));
  float pl = length(vd.xy);
  vec2 t2 = pl < 0.02 ? vec2(0.0, 1.0) : vd.xy / pl;
  vec2 n2 = vec2(-t2.y, t2.x);
  float L = aDim.x;
  float bend = L * aPh.w * (0.12 * sin(6.2831853 * (v * 0.9 - 2.2 * uT + aPh.x)) + 0.06 * sin(6.2831853 * (v * 1.5 - 3.7 * uT + aPh.y))) * v;
  vp.xy += (t2 * (v * L * pl) + n2 * (position.x * aDim.y + bend)) * sc;
  vCol = aCol; vA = aPh.z;
  gl_Position = projectionMatrix * vp;
}`;
const TONGUE_FS = `
varying vec3 vCol; varying float vA;
void main() { if (vA < 0.01) discard; gl_FragColor = vec4(vCol, 0.88 * vA);
  #include <colorspace_fragment>
}`;
function tongues(parent, n, U, order = 5) {
  const seg = 10, pos = [], idx = [];
  for (let j = 0; j <= seg; j++) {
    const v = j / seg, hw = 0.5 * Math.pow(1 - v, 0.8) * (0.45 + 0.55 * Math.sin(Math.min(1, v / 0.3) * Math.PI / 2));
    pos.push(-hw, v, 0, hw, v, 0);
    if (j < seg) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const base = new THREE.BufferGeometry(); base.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); base.setIndex(idx);
  const { g, A } = instFamily(base, n, { aBase: 3, aDim: 4, aPh: 4, aCol: 3 });
  const mesh = ghost(new THREE.Mesh(g, shaderMat(U, TONGUE_VS, TONGUE_FS)), order); parent.add(mesh);
  const F = {
    mesh,
    // slot s (see slot()) at length L (before breathing), alpha; T is the param time
    put(i, s, L, T, alpha = 1) {
      let len = L * (1 + 0.18 * Math.sin(TAU * (T * s.f + s.pb)));
      if (s.cap !== undefined) len = softCap(len, Math.max(0.001, (s.cap - s.y) * Math.hypot(s.lx, 1, s.lz)));
      if (len < 0.004 || alpha < 0.01) return F.hide(i);
      const c = PAL[s.col], W = s.W * (0.55 + 0.45 * clamp(len / 0.8));
      A.aBase.setXYZ(i, s.x, s.y, s.z); A.aDim.setXYZW(i, len, W, s.lx, s.lz); A.aPh.setXYZW(i, s.p1, s.p2, alpha, s.bs); A.aCol.setXYZ(i, c.r, c.g, c.b);
    },
    hide(i) { A.aDim.setXYZW(i, 0, 0, 0, 0); A.aPh.setXYZW(i, 0, 0, 0, 1); },
    done() { for (const k in A) A[k].needsUpdate = true; },
  };
  for (let i = 0; i < n; i++) F.hide(i);
  return F;
}
// a tongue's fixed numbers: base (x, y, z), lean (lx, lz: the direction is (lx, 1, lz)), width W, palette index, bend scale,
// optional cap (the highest local y its tip may reach), hashed breathing frequency f (Hz) and phases
function slot(i, o) {
  return { x: 0, y: 0, z: 0, lx: 0, lz: 0, W: 0.16, col: 1, bs: 1, cap: undefined, f: 1.3 + 0.8 * hs(i, 5), pb: hs(i, 6), p1: hs(i, 7), p2: hs(i, 8), ...o };
}
// colour tier by distance from the middle: inner tongues are paler (and the caller makes them taller)
const tier = (d) => (d < 0.15 ? 3 : d < 0.38 ? 2 : d < 0.68 ? 1 : 0);

// puffs (soft cel discs) and embers (additive sparks), camera-facing quads
const BB_VS = `
attribute vec3 aPos; attribute vec2 aSize; attribute vec3 aCol; attribute vec3 aA;
varying vec2 vQ; varying vec3 vCol; varying vec3 vA;
void main() {
  vQ = position.xy * 2.0; vCol = aCol; vA = aA;
  vec4 vp = viewMatrix * modelMatrix * vec4(aPos, 1.0);
  vp.xy += position.xy * 2.0 * aSize * length(modelMatrix[0].xyz);
  gl_Position = projectionMatrix * vp;
}`;
const PUFF_FS = `
uniform vec3 uLit;
varying vec2 vQ; varying vec3 vCol; varying vec3 vA;
float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
void main() {
  float a = atan(vQ.y, vQ.x), r = length(vQ);
  float edge = 0.86 + 0.07 * sin(a * 5.0 + vA.z * 6.2831853) + 0.05 * sin(a * 8.0 - vA.z * 17.0);
  float w = fwidth(r) * 1.1 + 0.01;
  float m = 1.0 - smoothstep(edge - w, edge, r);
  if (m * vA.x < 0.01) discard;
  float top = bandStep(0.30, vQ.y * 0.8 + vQ.x * 0.45 + 0.05 * sin(a * 3.0 + vA.z * 9.0));
  float bot = 1.0 - bandStep(-0.58, vQ.y - vQ.x * 0.2);
  vec3 c = mix(vCol, vCol * vec3(0.66, 0.69, 0.72), top);
  c = mix(c, uLit, bot * vA.y);
  gl_FragColor = vec4(c, m * vA.x);
  #include <colorspace_fragment>
}`;
const EMBER_FS = `
varying vec2 vQ; varying vec3 vCol; varying vec3 vA;
void main() {
  float r = length(vQ); if (r > 1.0) discard;
  float core = 1.0 - smoothstep(0.0, 0.55, r);
  vec3 c = mix(vCol, vec3(1.0, 0.95, 0.72), core * 0.7);
  gl_FragColor = vec4(c, (1.0 - smoothstep(0.3, 1.0, r)) * vA.x);
  #include <colorspace_fragment>
}`;
function billboards(parent, n, kind, order, U = {}) {
  const base = new THREE.PlaneGeometry(1, 1), { g, A } = instFamily(base, n, { aPos: 3, aSize: 2, aCol: 3, aA: 3 });
  const add = kind === "ember";
  const mat = shaderMat({ uLit: { value: LITCOL }, ...U }, BB_VS, add ? EMBER_FS : PUFF_FS, add ? { blending: THREE.AdditiveBlending } : {});
  const mesh = ghost(new THREE.Mesh(g, mat), order); parent.add(mesh);
  const F = {
    mesh,
    // centre, radius (x, y), colour, alpha, lit (the fire-lit underside 0..1), seed (0..1: the disc's edge)
    put(i, x, y, z, rx, ry, col, alpha, lit = 0, seed = 0) {
      if (alpha < 0.01 || rx < 0.001) return F.hide(i);
      A.aPos.setXYZ(i, x, y, z); A.aSize.setXY(i, rx, ry); A.aCol.setXYZ(i, col.r, col.g, col.b); A.aA.setXYZ(i, alpha, lit, seed);
    },
    hide(i) { A.aSize.setXY(i, 0, 0); A.aA.setXYZ(i, 0, 0, 0); },
    done() { for (const k in A) A[k].needsUpdate = true; },
  };
  for (let i = 0; i < n; i++) F.hide(i);
  return F;
}

// glow planes: world-fixed quads (vertical facing +z, or lying flat), centre + half size; modes 0 radial glow, 1 soot fan, 2 soft rectangle, 3 filled rectangle (a window lit from inside)
const PL_VS = `
uniform float uFlat;
attribute vec3 aPos; attribute vec2 aSize; attribute vec3 aCol; attribute vec2 aA;
varying vec2 vQ; varying vec3 vCol; varying vec2 vA;
void main() {
  vQ = position.xy * 2.0; vCol = aCol; vA = aA;
  vec2 o = position.xy * 2.0 * aSize;
  vec3 p = aPos + (uFlat > 0.5 ? vec3(o.x, 0.0, -o.y) : vec3(o, 0.0));
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
}`;
const PL_FS = `
uniform float uMode; uniform vec3 uHot;
varying vec2 vQ; varying vec3 vCol; varying vec2 vA;
void main() {
  vec3 c = vCol; float a;
  if (uMode < 0.5) { float r = length(vQ); a = pow(max(0.0, 1.0 - r), 1.15); c = mix(vCol, uHot, pow(max(0.0, 1.0 - r), 2.4)); }
  else if (uMode < 1.5) { vec2 p = vec2(vQ.x, (vQ.y + 1.0) * 0.5); float r = length(p); a = 1.0 - smoothstep(0.30, 1.0, r); a *= 0.8 + 0.2 * sin(vQ.x * 11.0 + 1.3); }
  else if (uMode < 2.5) { float e = max(abs(vQ.x), abs(vQ.y)); a = 1.0 - smoothstep(0.55, 1.0, e); }
  else { float e = max(abs(vQ.x), abs(vQ.y)); a = 1.0 - smoothstep(0.92, 1.0, e); c = mix(vCol, uHot, pow(max(0.0, 1.0 - length(vQ)), 1.5)); }
  if (a * vA.x < 0.01) discard;
  gl_FragColor = vec4(c, a * vA.x);
  #include <colorspace_fragment>
}`;
function planes(parent, n, mode, order, { flat = false, add = false, hot = "#ffc23d", z = 0 } = {}) {
  const base = new THREE.PlaneGeometry(1, 1), { g, A } = instFamily(base, n, { aPos: 3, aSize: 2, aCol: 3, aA: 2 });
  const mat = shaderMat({ uFlat: { value: flat ? 1 : 0 }, uMode: { value: mode }, uHot: { value: C(hot) } }, PL_VS, PL_FS, add ? { blending: THREE.AdditiveBlending } : {});
  if (mode === 1) { mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -4; }
  const mesh = ghost(new THREE.Mesh(g, mat), order); parent.add(mesh);
  const F = {
    mesh,
    put(i, x, y, zz, hx, hy, col, alpha) { if (alpha < 0.01) return F.hide(i); A.aPos.setXYZ(i, x, y, zz); A.aSize.setXY(i, hx, hy); A.aCol.setXYZ(i, col.r, col.g, col.b); A.aA.setXY(i, alpha, 0); },
    hide(i) { A.aSize.setXY(i, 0, 0); A.aA.setXY(i, 0, 0); },
    done() { for (const k in A) A[k].needsUpdate = true; },
  };
  for (let i = 0; i < n; i++) F.hide(i);
  return F;
}

// ------------------------------------------------------------------------------------------------ facadefire
const FW = { x0: [-0.72, 0.03], x1: [-0.03, 0.72], y0: 0.04, y1: 1.00, z: -0.098 };   // the two lights, local to the sill's middle
const CHIP_TOP = 1.73;   // local y a tongue near Chip's window may reach (frame A 2.88: 7 cm under his sill top)
const BAND0 = 3.25;      // local y of the smoke band's underside (frame A 4.40)

// the glass: 3 x 6 jittered grid per pane (shared corners, so the shards tile the pane exactly)
function paneShards() {
  const out = [];
  for (let p = 0; p < 2; p++) {
    const xa = p ? FW.x1[0] : FW.x0[0], xb = p ? FW.x1[1] : FW.x0[1], cols = 3, rows = 6, dx = (xb - xa) / cols, dy = (FW.y1 - FW.y0) / rows;
    const V = (i, j) => {   // the corner's place: inner corners jitter both ways, edge corners only along the edge
      let x = xa + i * dx, y = FW.y0 + j * dy;
      const jx = (hs(p * 50 + i * 7 + j, 1) - 0.5) * 0.56 * dx, jy = (hs(p * 50 + i * 7 + j, 2) - 0.5) * 0.56 * dy;
      if (i > 0 && i < cols) x += jx; if (j > 0 && j < rows) y += jy;
      return [x, y];
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ pane: p, i, j, c: [V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)] });
  }
  return out.map((s, k) => {
    const cx = s.c.reduce((a, q) => a + q[0], 0) / 4, cy = s.c.reduce((a, q) => a + q[1], 0) / 4, z0 = FW.z + 0.0015;
    const rel = s.c.map(([x, y]) => [x - cx, y - cy]);
    // throw: out +z 2.4-5.2, sideways +-1.6, up 0.2-2.2, then clamped so it lands inside x -1.4..1.4, z 0.4..2.7 (frame A) and is down by tau 1.1
    let vz = 2.4 + 2.8 * hs(k, 11), vx = (hs(k, 12) - 0.5) * 3.2, vy = 0.2 + 2.0 * hs(k, 13);
    const yl = PAVE - 1.15, tl = (vy + Math.sqrt(vy * vy + 19.6 * (cy - yl))) / 9.8;
    vz = clamp(vz, (0.45 - z0) / tl, (2.65 - z0) / tl); vx = clamp(vx, (-1.35 - cx) / tl, (1.35 - cx) / tl);
    const ax = [hs(k, 14) - 0.5, hs(k, 15) - 0.5, hs(k, 16) - 0.5], al = Math.hypot(...ax) || 1;
    return { rel, p0: [cx, cy, z0], v: [vx, vy, vz], tl, yl, axis: new THREE.Vector3(ax[0] / al, ax[1] / al, ax[2] / al), w: 3 + 6 * hs(k, 17), yaw: hs(k, 18) * TAU };
  });
}

function crackGeo() {
  const pos = [], aS = [], idx = [], HW = 0.0035;
  const seg = (a, b, s0, s1) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * HW, ny = dx / l * HW, k = pos.length / 3;
    pos.push(a[0] + nx, a[1] + ny, FW.z + 0.004, a[0] - nx, a[1] - ny, FW.z + 0.004, b[0] + nx, b[1] + ny, FW.z + 0.004, b[0] - nx, b[1] - ny, FW.z + 0.004);
    aS.push(s0, s0, s1, s1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  };
  for (let p = 0; p < 2; p++) {
    const xa = p ? FW.x1[0] : FW.x0[0], xb = p ? FW.x1[1] : FW.x0[1], cx = (xa + xb) / 2, cy = (FW.y0 + FW.y1) / 2;
    const P0 = [cx + (hs(p, 31) - 0.5) * 0.3, cy + (hs(p, 32) - 0.5) * 0.4];
    for (let k = 0; k < 3; k++) {
      const ang = k * 2.09 + hs(p * 3 + k, 33) * 0.8 + p * 1.1, d = [Math.cos(ang), Math.sin(ang)];
      // the ray's length to the pane's edge
      let tm = 9; for (const [o, lo, hi] of [[0, xa, xb], [1, FW.y0, FW.y1]]) { const t = d[o] > 0 ? (hi - P0[o]) / d[o] : d[o] < 0 ? (lo - P0[o]) / d[o] : 9; tm = Math.min(tm, t); }
      const N = 6, pts = [];
      for (let j = 0; j <= N; j++) { const t = (tm * j) / N, jt = j && j < N ? (hs(p * 9 + k * 3 + j, 34) - 0.5) * 0.05 : 0; pts.push([P0[0] + d[0] * t - d[1] * jt, P0[1] + d[1] * t + d[0] * jt]); }
      for (let j = 0; j < N; j++) seg(pts[j], pts[j + 1], j / N, (j + 1) / N);
      // one short branch from the middle
      const bm = pts[3], ba = ang + (k % 2 ? 0.6 : -0.6), bd = [Math.cos(ba), Math.sin(ba)], bl = Math.min(0.2, tm * 0.4);
      let prev = bm; for (let j = 1; j <= 3; j++) { const q = [bm[0] + bd[0] * bl * j / 3 + (hs(k + j, 35) - 0.5) * 0.02, bm[1] + bd[1] * bl * j / 3]; seg(prev, q, 0.5 + 0.5 * (j - 1) / 3, 0.5 + 0.5 * j / 3); prev = q; }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1)); g.setIndex(idx);
  return g;
}

const SHARD_VS = `
attribute vec4 aC01; attribute vec4 aC23;
varying vec2 vUv;
void main() {
  vUv = position.xy + 0.5;
  vec2 c = position.y < 0.0 ? (position.x < 0.0 ? aC01.xy : aC01.zw) : (position.x > 0.0 ? aC23.xy : aC23.zw);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(c, 0.0, 1.0);
}`;
const SHARD_FS = `
uniform vec3 uGlass, uEdge; varying vec2 vUv;
void main() {
  float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float edge = 1.0 - smoothstep(0.02, 0.07, e);
  gl_FragColor = vec4(mix(uGlass, uEdge, edge), mix(0.55, 0.95, edge));
  #include <colorspace_fragment>
}`;
const CRACK_VS = `attribute float aS; varying float vS; void main() { vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const CRACK_FS = `uniform float uGrow; uniform vec3 uCol; varying float vS;
void main() { if (vS > uGrow) discard; gl_FragColor = vec4(uCol, 0.92);
  #include <colorspace_fragment>
}`;

// a canvas for the panes: faint glass with one diagonal reflection band
function glassTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = "rgba(207,230,238,0.02)"; g.fillRect(0, 0, 64, 128);
  g.fillStyle = "rgba(235,246,250,0.07)"; g.beginPath(); g.moveTo(10, 128); g.lineTo(26, 128); g.lineTo(64, 36); g.lineTo(64, 14); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function facadefire(P) {
  const S = P.spec, BURST = num(S.burstAt, 10.8), U = { uT: { value: 0 } }, g = P.whole;
  // ---- room glow (behind the glass, in front of the dim back wall)
  const roomGlow = planes(g, 1, 0, 1, { hot: "#ffc23d" });
  // ---- the glass: whole panes (tint + soot veil), cracks, shards
  const paneG = new THREE.BufferGeometry(), pp = [], pu = [], pi = [];
  [FW.x0, FW.x1].forEach(([xa, xb], p) => { const k = p * 4; pp.push(xa, FW.y0, FW.z, xb, FW.y0, FW.z, xb, FW.y1, FW.z, xa, FW.y1, FW.z); pu.push(0, 0, 1, 0, 1, 1, 0, 1); pi.push(k, k + 1, k + 2, k, k + 2, k + 3); });
  paneG.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); paneG.setAttribute("uv", new THREE.Float32BufferAttribute(pu, 2)); paneG.setIndex(pi);
  const glass = ghost(new THREE.Mesh(paneG, flag(new THREE.MeshBasicMaterial({ map: glassTex(), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }))), 3); g.add(glass);
  const veilM = flag(new THREE.MeshBasicMaterial({ color: "#2a2024", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  const veil = ghost(new THREE.Mesh(paneG, veilM), 3); veil.position.z = 0.0008; g.add(veil);
  const CU = { uGrow: { value: 0 }, uCol: { value: C("#f2f6f8") } };
  const cracks = ghost(new THREE.Mesh(crackGeo(), shaderMat(CU, CRACK_VS, CRACK_FS)), 7); g.add(cracks);
  const shards = paneShards();
  const sg = new THREE.PlaneGeometry(1, 1), c01 = new Float32Array(36 * 4), c23 = new Float32Array(36 * 4);
  shards.forEach((s, k) => { const r = s.rel; c01.set([r[0][0], r[0][1], r[1][0], r[1][1]], k * 4); c23.set([r[2][0], r[2][1], r[3][0], r[3][1]], k * 4); });
  sg.setAttribute("aC01", new THREE.InstancedBufferAttribute(c01, 4)); sg.setAttribute("aC23", new THREE.InstancedBufferAttribute(c23, 4));
  const shardMesh = ghost(new THREE.InstancedMesh(sg, shaderMat({ uGlass: { value: C("#cfe6ee") }, uEdge: { value: C("#ffffff") } }, SHARD_VS, SHARD_FS), 36), 8); shardMesh.count = 36; g.add(shardMesh);
  const dummy = new THREE.Object3D(), qA = new THREE.Quaternion(), qF = new THREE.Quaternion(), qY = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  // ---- soot fan on the brick over the window
  const soot = planes(g, 1, 1, 4);
  // ---- tongues: 8 inside, 6 transom, 9 lick (7 + 2 outer), 14 mouth, 4 core
  const slots = [];
  const inside = Array.from({ length: 8 }, (_, i) => { const x = (hs(i, 40) - 0.5) * 1.2; return slot(i, { x, y: 0.05 + 0.25 * hs(i, 41), z: -0.35 - 0.65 * hs(i, 42), lx: x * 0.1, W: 0.15 + 0.07 * hs(i, 43), col: tier(Math.abs(x) / 0.6) + (Math.abs(x) < 0.2 ? 0 : 0), L0: (0.3 + 0.3 * hs(i, 44)) * (Math.abs(x) < 0.25 ? 1.12 : 1) }); });
  const transom = Array.from({ length: 6 }, (_, i) => { const x = -0.55 + 1.1 * (i + 0.5) / 6 + (hs(i, 45) - 0.5) * 0.06; return slot(i + 20, { x, y: 1.04 + 0.08 * hs(i, 46), z: 0.07, lx: x * 0.25, lz: 0.06, W: 0.13 + 0.05 * hs(i, 47), col: tier(Math.abs(x) / 0.6), cap: CHIP_TOP, k: 0.8 + 0.2 * hs(i, 48) }); });
  const lick = Array.from({ length: 9 }, (_, i) => {
    const outer = i >= 7, side = i === 7 ? -1 : 1, x = outer ? side * (1.0 + 0.04 * hs(i, 49)) : -0.68 + 1.36 * (i + 0.5) / 7 + (hs(i, 50) - 0.5) * 0.06;
    return slot(i + 40, { x, y: 1.24 + 0.05 * hs(i, 51), z: 0.08, lx: outer ? side * 0.1 : x * 0.2, W: outer ? 0.2 : 0.13 + 0.04 * hs(i, 52), col: outer ? 1 : tier(Math.abs(x) / 0.7), bs: outer ? 0.6 : 1, cap: outer ? 2.28 : CHIP_TOP, L0: outer ? 0.8 : 0.26 + 0.1 * hs(i, 53) });
  });
  const mouth = Array.from({ length: 14 }, (_, i) => {
    const kk = hs(i, 54), x = -0.66 + 1.32 * (i + 0.5) / 14 + (hs(i, 55) - 0.5) * 0.05, L0 = (0.6 + 0.7 * kk) * (Math.abs(x) < 0.25 ? 1.1 : 1);
    return slot(i + 60, { x, y: 0.05 + (1 - kk) * 0.8, z: 0.04, lx: x * 0.3, lz: 0.3, W: 0.15 + 0.07 * hs(i, 56), col: tier(Math.abs(x) / 0.72), cap: CHIP_TOP, L0 });
  });
  const core = Array.from({ length: 4 }, (_, i) => { const x = (i - 1.5) * 0.28 + (hs(i, 57) - 0.5) * 0.06; return slot(i + 80, { x, y: 0.1 + 0.3 * hs(i, 58), z: 0.05, lx: x * 0.2, lz: 0.25, W: 0.1, col: 4, cap: CHIP_TOP, L0: 1.0 + 0.2 * hs(i, 59) }); });
  slots.push(...inside, ...transom, ...lick, ...mouth, ...core);
  const T = tongues(g, slots.length, U);
  // ---- smoke: 16 puffs in two streams (left / right of Chip's window), wisp (5), embers (40)
  const smoke = billboards(g, 16 + 5, "puff", 6);
  const emb = billboards(g, 40, "ember", 9);
  // ---- light
  const light = new THREE.PointLight("#ff8a2a", 0, 7, 1.5); light.position.set(0, 0.9, 0.9); g.add(light);
  const tmpC = new THREE.Color();

  return {
    grip: 0,
    apply(ps) {   // (the second argument, the world clock, is ignored on purpose)
      const t = ps.time, gr = clamp(ps.grow), curl = clamp(ps.curl ?? 0), low = clamp(ps.low ?? S.low ?? 0), tau = t - BURST;
      U.uT.value = t;
      const fl = flicker(t);
      // room glow
      const rg = sm(0, 0.15, gr);
      roomGlow.put(0, 0, 0.2, -1.70, 1.25, 1.0, C("#ff8a2a"), 0.95 * rg * (0.88 + 0.12 * fl)); roomGlow.done();
      // glass
      const whole = tau < 0;
      glass.visible = whole; veil.visible = whole; veilM.opacity = 0.45 * gr;
      cracks.visible = whole && tau > -0.10; CU.uGrow.value = clamp((tau + 0.10) / 0.10);
      shardMesh.visible = !whole;
      if (!whole) {
        shards.forEach((s, k) => {
          const lt = Math.min(tau, s.tl), landed = tau >= s.tl;
          const px = s.p0[0] + s.v[0] * lt, py = landed ? s.yl : s.p0[1] + s.v[1] * lt - 4.9 * lt * lt, pz = s.p0[2] + s.v[2] * lt;
          qA.setFromAxisAngle(s.axis, s.w * lt);
          qF.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2); qY.setFromAxisAngle(Y, s.yaw); qF.premultiply(qY);
          const b = sm(s.tl - 0.18, s.tl, tau);   // the tumble settles to lying flat over its last 0.18 s
          if (qA.dot(qF) < 0) qA.set(-qA.x, -qA.y, -qA.z, -qA.w);
          qA.slerp(qF, b);
          dummy.position.set(px, py, pz); dummy.quaternion.copy(qA); dummy.scale.setScalar(1); dummy.updateMatrix(); shardMesh.setMatrixAt(k, dummy.matrix);
        });
        shardMesh.instanceMatrix.needsUpdate = true;
      }
      // soot
      soot.put(0, 0, 1.51, 0.02, 0.95, 0.21, C("#1e1719"), 0.55 * sm(0.15, 0.9, gr)); soot.done();
      // tongues
      const bulge = 1 + 0.35 * bump(tau / 0.45), open = sm(0, 0.45, tau);   // the mouth: 0 at the burst, 1 after 0.45 s
      const aIn = sm(0, 0.12, gr), trL = gr < 0.15 ? 0 : gr < 0.5 ? lerp(0.25, 0.7, (gr - 0.15) / 0.35) : lerp(0.7, 0.9, ramp(0.5, 0.85, gr)), trA = sm(0.15, 0.2, gr);
      const lkF = 0.75 * ramp(0.5, 0.85, gr) + 0.25 * ramp(0.85, 1, gr);
      let n = 0;
      for (const s of inside) T.put(n++, s, s.L0 * aIn, t, aIn);
      for (const s of transom) T.put(n++, s, trL * s.k * bulge, t, trA);
      for (const s of lick) T.put(n++, s, s.L0 * lkF * bulge, t, sm(0.5, 0.58, gr));
      for (const s of mouth) {
        const a = sm(0, 1, (open * 1.15 - Math.abs(s.x) / 0.72) * 4) * sm(0, 1, (open * 1.1 - (1.02 - s.y)) * 4 + 0.4) * sm(0, 0.12, gr);
        T.put(n++, s, s.L0 * bulge * a * sm(0, 1, gr), t, a);
      }
      for (const s of core) { const a = open * sm(0, 0.12, gr); T.put(n++, s, s.L0 * bulge * a * sm(0, 1, gr), t, a); }
      T.done();
      // smoke puffs: two streams, one up each side of Chip's window, then a band over his head drifting +x
      const smokeAmt = sm(0.15, 0.3, gr) * (0.4 + 0.6 * sm(0.5, 0.85, gr)), yb = BAND0 - 0.45 * low;
      for (let i = 0; i < 16; i++) {
        const sd = i % 2 ? 1 : -1, k = Math.floor(i / 2), Ti = 2.6 + hs(i, 60), u = fr(t / Ti + (k + 0.5 * hs(i, 61)) / 8);
        const d = 0.35 + 0.6 * Math.pow(u, 0.9), r = d / 2, u1 = 0.40;
        let x, y;
        if (u < u1) { const w = u / u1; x = sd * lerp(0.6, 1.0 + 0.2 * w, sm(0, 0.2, w)); y = lerp(1.1, yb + 0.3, Math.pow(w, 0.9)); }
        else { const v = (u - u1) / (1 - u1), y1 = yb + 0.3; x = sd < 0 ? lerp(-1.2, 1.8, v) : lerp(1.2, 2.6, v); y = y1 + (5.35 - y1) * Math.pow(v, 1.5); }
        const alpha = 0.8 * smokeAmt * sm(0, 0.1, u) * (1 - sm(0.75, 1, u)) * (hs(i, 62) < 0.45 + 0.55 * smokeAmt ? 1 : 0);
        const sh = 0.9 + 0.2 * hs(i, 63);
        smoke.put(i, x, y, 0.3 + 0.5 * r, r, r, tmpC.copy(SMOKE).multiplyScalar(sh), alpha, gr * (1 - sm(0.3, 1, u)), hs(i, 64));
      }
      // the tag's wisp: 5 small puffs from the transom's open edge, rising 0.9 m and bending +x
      for (let i = 0; i < 5; i++) {
        const u = fr(t / 3.2 + i / 5), d = 0.08 + 0.18 * u;
        smoke.put(16 + i, 0.1 + 0.35 * Math.pow(u, 1.6) + 0.04 * Math.sin(TAU * u * 1.2), 1.04 + 0.9 * u, 0.12, d / 2, d / 2, PALE, 0.7 * curl * sm(0, 0.12, u) * (1 - sm(0.6, 1, u)), 0, hs(i, 65));
      }
      smoke.done();
      // embers: 40, side lanes |x| 0.95-1.2 clear of Chip's box; the central ones die before y 1.6
      const eA = ramp(0.5, 0.85, gr);
      for (let i = 0; i < 40; i++) {
        const Li = 1.5 + hs(i, 70), sp = 0.8 + 0.8 * hs(i, 71), u = fr(t / Li + hs(i, 72)), central = i % 5 === 0;
        const x0 = central ? (hs(i, 73) - 0.5) * 1.3 : (i % 2 ? 1 : -1) * (0.95 + 0.25 * hs(i, 73));
        const y = 1.25 + (central ? 0.4 * Math.pow(u, 0.8) : sp * Li * u), x = x0 + 0.15 * Math.sin(TAU * (u * 1.3 + hs(i, 74)));
        const a = (hs(i, 75) < eA ? 1 : 0) * sm(0, 0.1, u) * (1 - sm(0.7, 1, u)) * (central ? 1 - sm(1.35, 1.6, y) : 1);
        emb.put(i, x, y, 0.2 + 0.2 * hs(i, 76), 0.011 + 0.006 * hs(i, 77), 0.011 + 0.006 * hs(i, 77), tmpC.copy(EMB_A).lerp(EMB_B, u), 0.9 * a, 0, 0);
      }
      emb.done();
      light.intensity = 4.5 * gr * (0.8 + 0.2 * fl);
    },
  };
}

// ------------------------------------------------------------------------------------------------ blockfire
const WCOL = { G: [1.15, 2.45, 1.5], F1: [2.95, 4.25, 1.2], F2: [5.55, 6.85, 1.2], F3: [8.15, 9.45, 1.2] };
const BWIN = [["G", -2.1], ["F1", -2.1], ["F1", 2.3], ["F2", 0], ["F2", -2.1], ["G", -4.2], ["F2", 2.3], ["F3", 0]];

function blockfire(P) {
  const g = P.whole, U = { uT: { value: 0 } };
  const wins = BWIN.map(([row, cx], k) => {
    const [sill, head, w] = WCOL[row], inOnly = row === "F2" && cx === 0, beside = row === "F1", dir = cx < 0 ? -1 : 1;
    const tl = inOnly ? [] : Array.from({ length: 6 }, (_, i) => {
      const id = k * 10 + i, x = cx + ((i + 0.5) / 6 - 0.5) * 0.8 * w + (hs(id, 80) - 0.5) * 0.05, d = Math.abs(x - cx) / (w / 2);
      return beside
        ? slot(id, { x: cx + ((i + 0.5) / 6 - 0.5) * 0.5 * w, y: head - 0.43 + 0.2 * hs(id, 81), z: 0.05, lx: dir * 0.45, W: 0.11, col: tier(d), bs: 0.7, cap: head - 0.02, L0: 0.22 + 0.16 * hs(id, 82) })
        : slot(id, { x, y: head - 0.12 - hs(id, 81) * (1.3 / 3 - 0.12), z: 0.05, lx: (x - cx) * 0.4, lz: 0.3, W: 0.15 + 0.06 * hs(id, 83), col: tier(d), L0: (0.8 + 0.7 * hs(id, 82)) * (d < 0.3 ? 1.1 : 1) });
    });
    return { row, cx, sill, head, w, inOnly, beside, dir, start: (k * 0.85) / 7, tl, k };
  });
  const glow = planes(g, 8, 3, 1, { hot: "#ffc23d" });
  const T = tongues(g, 42, U);
  const smoke = billboards(g, 14 + 12, "puff", 6), emb = billboards(g, 30, "ember", 9);
  const light = new THREE.PointLight("#ff7a2a", 0, 14, 1.5); light.position.set(0, 4, 2.5); g.add(light);
  const tmpC = new THREE.Color(), emit = wins.filter((w) => !w.inOnly);
  return {
    grip: 0,
    apply(ps) {
      const t = ps.time, sp = clamp(ps.spread ?? S0(P, "spread")), fl = flicker(t);
      U.uT.value = t;
      let nt = 0, np = 0;
      for (const w of wins) {
        const a = sm(0, 1, (sp - w.start) / 0.15);
        glow.put(w.k, w.cx, (w.sill + w.head) / 2, -0.07, w.w / 2, 0.65, C("#ff8a2a"), 0.95 * a * (0.88 + 0.12 * flicker(t + w.k * 0.37)));
        for (const s of w.tl) T.put(nt++, s, s.L0 * a, t, a);
        if (!w.inOnly) for (let p = 0; p < 2; p++) {
          const id = w.k * 4 + p, Ti = 2.4 + 0.8 * hs(id, 84), u = fr(t / Ti + p * 0.5 + 0.1 * hs(id, 85)), r = (0.5 + 0.9 * u) / 2, away = w.beside ? w.dir : w.cx < 0 ? -1 : 1;
          smoke.put(np++, w.cx + away * (0.15 + 0.25 * hs(id, 86)) * u + 0.05 * Math.sin(TAU * u), w.head + 0.1 + (0.9 + 0.5 * hs(id, 87)) * u, 0.35 + 0.4 * r, r, r, tmpC.copy(SMOKE).multiplyScalar(0.9 + 0.2 * hs(id, 88)), 0.8 * a * sm(0, 0.1, u) * (1 - sm(0.7, 1, u)), a * (1 - sm(0.3, 1, u)), hs(id, 89));
        }
      }
      glow.done(); T.done();
      // roof smoke: 12 big puffs along y 9.5..13 drifting +x
      for (let i = 0; i < 12; i++) {
        const Ti = 3.6 + 1.2 * hs(i, 90), u = fr(t / Ti + i / 12), r = (1.2 + 1.0 * u) / 2, x0 = -4.5 + 6.5 * hs(i, 91);
        smoke.put(np++, x0 + 2.5 * u, 9.5 + 3.5 * u, 0.6 + 0.5 * r, r, r, tmpC.copy(SMOKE).multiplyScalar(0.88 + 0.2 * hs(i, 92)), 0.8 * sm(0.25, 0.7, sp) * sm(0, 0.12, u) * (1 - sm(0.65, 1, u)), sm(0.25, 0.7, sp) * (1 - sm(0.3, 1, u)), hs(i, 93));
      }
      smoke.done();
      for (let i = 0; i < 30; i++) {
        const w = emit[i % emit.length], a = sm(0, 1, (sp - w.start) / 0.15), Li = 1.5 + hs(i, 94), spd = 0.8 + 0.8 * hs(i, 95), u = fr(t / Li + hs(i, 96));
        emb.put(i, w.cx + (hs(i, 97) - 0.5) * w.w * 0.8 + 0.15 * Math.sin(TAU * (u * 1.3 + hs(i, 98))), w.head - 0.2 + spd * Li * u * (w.beside ? 0.5 : 1), 0.2, 0.012, 0.012, tmpC.copy(EMB_A).lerp(EMB_B, u), 0.9 * a * sm(0, 0.1, u) * (1 - sm(0.7, 1, u)), 0, 0);
      }
      emb.done();
      light.intensity = 6 * sp * (0.8 + 0.2 * fl);
    },
  };
}
// a spec value for a param nothing has tweened (propState doesn't know it)
const S0 = (P, k) => P.spec[k] ?? 0;

// ------------------------------------------------------------------------------------------------ stairfire
function stairfire(P) {
  const S = P.spec, AT = num(S.at, 10), NS = S.steps ?? 16, RISE = S.rise ?? 0.14, TREAD = S.tread ?? 0.30, W = S.w ?? 1.6, g = P.whole, U = { uT: { value: 0 } };
  const topY = NS * RISE, zTop = -NS * TREAD;   // the landing's edge (local): y 2.24, z -4.8
  const stepZ = (n) => -TREAD * (n - 0.5), stepY = (n) => RISE * n;
  const stepSlots = Array.from({ length: NS }, (_, n0) => Array.from({ length: 3 }, (_, j) => {
    const id = n0 * 3 + j, n = n0 + 1, x = (j - 1) * (W * 0.34) + (hs(id, 100) - 0.5) * 0.1;
    return slot(id, { x, y: stepY(n) + 0.01, z: stepZ(n) + (hs(id, 101) - 0.5) * 0.1, lx: (hs(id, 102) - 0.5) * 0.15, lz: 0.2, W: 0.16 + 0.07 * hs(id, 103), col: tier(Math.abs(x) / (W / 2)), L0: 0.5 + 0.6 * hs(id, 104) });
  }));
  const land = Array.from({ length: 8 }, (_, i) => { const x = (i + 0.5) / 8 * (W - 0.2) - (W - 0.2) / 2 + (hs(i, 105) - 0.5) * 0.06; return slot(200 + i, { x, y: topY + 0.01, z: zTop - 0.25 - 1.0 * hs(i, 106), lx: (hs(i, 107) - 0.5) * 0.2, lz: 0.1, W: 0.2 + 0.1 * hs(i, 108), col: tier(Math.abs(x) / (W / 2)), L0: 0.8 + 0.7 * hs(i, 109) }); });
  const head = Array.from({ length: 4 }, (_, i) => { const x = (i - 1.5) * (W * 0.25) + (hs(i, 110) - 0.5) * 0.08; return slot(300 + i, { x, y: 0, z: 0, lx: 0, lz: Math.tan(25 * Math.PI / 180), W: 0.36, col: tier(Math.abs(x) / (W / 2)), L0: 0.7 + 0.3 * hs(i, 111) }); });
  const lip = slot(310, { W: 1.5, col: 1, lz: 0.2, L0: 0.15, bs: 0.3 });
  const T = tongues(g, NS * 3 + 8 + 4 + 1, U);
  const strips = planes(g, NS + 1, 2, 3, { flat: true, add: true });
  const smoke = billboards(g, 12, "puff", 6);
  const emb = billboards(g, 14 + 1, "ember", 9);
  const light = new THREE.PointLight("#ff8a2a", 0, 8, 1.5); g.add(light);
  const tmpC = new THREE.Color(), HOT = C("#ff8a2a"), CORE = C("#fff3c4");
  // the 14 thrown embers: ballistic from the hall mouth, resting on the treads (a fixed 1/240 s step up to tau)
  const surf = (z) => (z <= zTop ? topY : RISE * clamp(Math.ceil(-z / TREAD), 0, NS));
  const throwEmber = (i, tau) => {
    let x = (hs(i, 120) - 0.5) * 1.0, y = topY + 0.3 + 0.5 * hs(i, 121), z = zTop - 0.2;
    let vx = (hs(i, 122) - 0.5) * 2.4, vy = 1.5 + 1.8 * hs(i, 123), vz = 2.5 + 3.0 * hs(i, 124), rest = -1;
    const dt = 1 / 240;
    for (let s = 0; s * dt < tau; s++) {
      const h = Math.min(dt, tau - s * dt);
      vy -= 9.8 * h; x += vx * h; y += vy * h; z += vz * h;
      const f = surf(z) + 0.015;
      if (y <= f && vy < 0) { y = f; rest = tau - (s + 1) * dt; vx = vy = vz = 0; break; }
    }
    return { x: clamp(x, -W / 2, W / 2), y, z, rest: rest < 0 ? 0 : Math.max(0, rest) + 0, landed: rest >= 0 };
  };
  return {
    grip: 0,
    apply(ps) {
      const t = ps.time, gr = clamp(ps.grow), fr0 = clamp(ps.front ?? S.front ?? 0), tau = t - AT, fl = flicker(t);
      U.uT.value = t;
      const on = tau >= 0 ? 1 : 0, bulge = 1 + 0.6 * bump(tau / 0.35), nf = (NS - 1) - (NS - 2) * fr0;   // 15 - 14 front
      const A = gr * on;
      let n = 0;
      for (let n0 = 0; n0 < NS; n0++) { const sg = clamp(n0 + 1 - nf + 1) * A; for (const s of stepSlots[n0]) T.put(n++, s, s.L0 * sg * bulge, t, sg > 0 ? 1 : 0); }
      for (const s of land) T.put(n++, s, s.L0 * A * bulge, t, A > 0 ? 1 : 0);
      const hz = stepZ(nf), hy = RISE * nf;   // the rolling head sits on tread nf
      head.forEach((s) => { s.y = hy + 0.01; s.z = hz + 0.12; T.put(n++, s, s.L0 * A * bulge, t, A > 0 ? 1 : 0); });
      lip.x = 0; lip.y = hy + 0.02; lip.z = hz + 0.1; T.put(n++, lip, lip.L0 * A * bulge, t, A > 0 ? 1 : 0);
      T.done();
      // glow strips: one per burning tread + the landing
      for (let n0 = 0; n0 < NS; n0++) { const sg = clamp(n0 + 1 - nf + 1) * A; strips.put(n0, 0, stepY(n0 + 1) + 0.012, stepZ(n0 + 1), W / 2 * 0.95, TREAD / 2 * 0.9, HOT, 0.5 * sg * (0.85 + 0.15 * flicker(t + n0 * 0.31))); }
      strips.put(NS, 0, topY + 0.014, zTop - 0.7, W / 2 * 0.95, 0.7, HOT, 0.5 * A * (0.85 + 0.15 * fl)); strips.done();
      // smoke: 12 puffs from the landing up the stairwell to y 5.0, then +x along the ceiling (none at B x < 0.2 above y 3.0)
      for (let i = 0; i < 12; i++) {
        const Ti = 3.0 + hs(i, 130), off = (i / 12) * Ti, ag = tau - off, u = ag < 0 ? 0 : fr(ag / Ti), vis = ag >= 0 ? 1 : 0, d = 0.7 + 0.9 * u, r = d / 2;
        const x0 = (hs(i, 131) - 0.5) * 0.9, x = x0 + 0.5 * sm(0.5, 1, u), y = lerp(2.7, 5.0 - r * 0.6, sm(0, 0.65, u));
        smoke.put(i, x, y, zTop + 0.2 + 0.7 * u + 0.2 * hs(i, 132), r, r, tmpC.copy(SMOKE).multiplyScalar(0.88 + 0.2 * hs(i, 133)), 0.8 * A * vis * sm(0, 0.1, u) * (1 - sm(0.7, 1, u)), A * (1 - sm(0.2, 0.9, u)), hs(i, 134));
      }
      smoke.done();
      // embers + the core flash
      for (let i = 0; i < 14; i++) {
        if (tau < 0 || tau > 1.9) { emb.hide(i); continue; }
        const e = throwEmber(i, tau), a = e.landed ? 1 - sm(0.3, 1.0, e.rest) : 1;
        emb.put(i, e.x, e.y, e.z, 0.014, 0.014, tmpC.copy(EMB_A).lerp(EMB_B, clamp(tau / 1.5)), 0.95 * a * (gr > 0 ? 1 : 0), 0, 0);
      }
      if (tau >= 0 && tau < 0.35) emb.put(14, 0, topY + 0.7, zTop + 0.1, 0.7, 0.7, CORE, 0.9 * (1 - sm(0, 0.35, tau)), 0, 0); else emb.hide(14);
      emb.done();
      light.position.set(0, RISE * nf + 0.8, stepZ(nf));
      light.intensity = 5 * A * (0.8 + 0.2 * fl);
    },
  };
}

// ------------------------------------------------------------------------------------------------ floorsmoke
function cumulusGeo() {
  // a dome of one big and four small lobes (a cumulus top), flat-banded top / body / underside by face normal
  const lobes = [[0, 0, 0, 1, 1], [-0.55, 0, 0.1, 0.62, 0.7], [0.55, 0, -0.05, 0.6, 0.68], [0.1, 0, 0.5, 0.55, 0.62], [-0.1, 0, -0.5, 0.52, 0.6]];
  const parts = lobes.map(([x, y, z, r, h]) => { const s = new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2); s.scale(r, h, r); s.translate(x, y, z); const f = s.toNonIndexed(); f.computeVertexNormals(); return f; });
  const n = parts.reduce((a, p) => a + p.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0; const top = C("#b9b6bd"), body = C("#8d8a94"), under = C("#5f5c68");
  for (const p of parts) {
    const P = p.attributes.position.array, N = p.attributes.normal.array;
    for (let f = 0; f < p.attributes.position.count; f += 3) {
      const ay = [0, 1, 2].map((k) => [P[(f + k) * 3], P[(f + k) * 3 + 1], P[(f + k) * 3 + 2]]), e1 = ay[1].map((v, k) => v - ay[0][k]), e2 = ay[2].map((v, k) => v - ay[0][k]), nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], ny = Math.abs(nn[1]) / (Math.hypot(...nn) || 1), c = ny > 0.55 ? top : ny > 0.2 ? body : under;
      for (let k = 0; k < 3; k++) { pos.set(P.subarray((f + k) * 3, (f + k) * 3 + 3), (o + f + k) * 3); nor.set(N.subarray((f + k) * 3, (f + k) * 3 + 3), (o + f + k) * 3); col.set([c.r, c.g, c.b], (o + f + k) * 3); }
    }
    o += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function floorsmoke(P) {
  const S = P.spec, [BW, BD] = S.box || [1.6, 8], n = Math.min(40, S.n ?? Math.ceil(BW * BD * 2)), g = P.whole;
  // the base sheet: a lit translucent plane, soft edges 0.3 m in (an alpha map the box's shape)
  const cw = Math.max(16, Math.min(256, Math.round(BW * 32))), ch = Math.max(16, Math.min(256, Math.round(BD * 32))), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  { const c = cv.getContext("2d"), im = c.createImageData(cw, ch), ex = 0.3 / BW * cw, ey = 0.3 / BD * ch;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const a = Math.min(1, Math.min(x + 0.5, cw - x - 0.5) / ex, Math.min(y + 0.5, ch - y - 0.5) / ey), k = Math.round(255 * a * a * (3 - 2 * a)); im.data.set([k, k, k, 255], (y * cw + x) * 4); }
    c.putImageData(im, 0, 0); }
  const am = new THREE.CanvasTexture(cv);
  const sheetM = new THREE.MeshLambertMaterial({ color: "#8d8a94", transparent: true, opacity: 0.7, alphaMap: am, depthWrite: false, side: THREE.DoubleSide });
  flag(sheetM);
  const sheet = ghost(new THREE.Mesh(new THREE.PlaneGeometry(BW, BD).rotateX(-Math.PI / 2), sheetM), 2); g.add(sheet);
  const puffM = flag(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  const puffs = ghost(new THREE.InstancedMesh(cumulusGeo(), puffM, n), 3); puffs.count = n; g.add(puffs);
  const P0 = Array.from({ length: n }, (_, i) => ({ x: (hs(i, 140) - 0.5) * (BW - 0.3), z0: hs(i, 141), w: 0.35 + 0.25 * hs(i, 142), h: 0.2 + 0.136 * hs(i, 143), dz: 0.8 + 0.2 * hs(i, 144), pb: hs(i, 145), per: 2.0 + 1.5 * hs(i, 146), rot: (hs(i, 147) - 0.5) * 0.8 }));
  const dummy = new THREE.Object3D();
  return {
    grip: 0,
    apply(ps) {
      const t = ps.time, lv = clamp(ps.level ?? 1), dr = num(ps.drift, num(S.drift, 0.25)), top = 0.36 * lv;
      sheet.visible = puffs.visible = lv > 0.005;
      if (lv <= 0.005) return;
      sheet.position.y = 0.6 * top;
      P0.forEach((p, i) => {
        const zc = fr(p.z0 + (dr * t) / BD) * BD - BD / 2, fade = sm(0, 0.5, zc + BD / 2) * sm(0, 0.5, BD / 2 - zc);
        const wall = Math.abs(p.x) > BW / 2 - 0.25 ? 1.25 : 1, hp = p.h * lv * wall, bob = 0.015 * (1 + Math.sin(TAU * (t / p.per + p.pb))) * lv;
        const s = fade > 0.001 ? 1 : 0;
        dummy.position.set(p.x, bob - hp * 0.05, zc); dummy.rotation.set(0, p.rot, 0); dummy.scale.set((p.w / 2) * fade * s, hp * fade * s, (p.w / 2) * p.dz * fade * s); dummy.updateMatrix();
        puffs.setMatrixAt(i, dummy.matrix);
      });
      puffs.instanceMatrix.needsUpdate = true;
    },
  };
}

export const FIREREWIND_KINDS = { facadefire, blockfire, stairfire, floorsmoke };
export const FIREREWIND_GRIPS = {};
