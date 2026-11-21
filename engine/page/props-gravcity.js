import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// props-gravcity.js: fact what-if 02 "What if gravity got stronger every five seconds?" (19 Nov 2026): the city seen from the
// high-floor window. World coordinates in metres (the room's back wall and window are at z -2.65, its floor at y 0), +y up,
// -z out of the window. Place every kind with x 0, y 0, z 0: the world numbers are inside. Source: DESIGN.md section 2.
// All look-only: not solid, no shadows, flagged steam, no ink line (every material is unlit and has noOutline: the city is
// flat painted shapes, so no outline pass can make far buildings messy). Every frame is a pure function of the params (seeded
// hash, no Math.random, no clock). The camera far plane must be 6000 ("far": 6000 in the storyboard).
// Registry: GRAVCITY_KINDS is already in props3d.js (Object.assign(KINDS, GRAVROOM_KINDS, GRAVCITY_KINDS, GRAVSKY_KINDS)).
//
// Common spec keys (all kinds, all optional):
//   haze   "#7a5c76"  the dusk haze colour far things fade to (gcity, gstreet's ground and ghorizon's lower edge use the same)
//
//   gstreet   The street deck at y -60 (x -140..140, z -43..-15; carriageway centre z -29, 20 wide, 4 m sidewalks with paving
//             joints, curbs #6F6260, lane marks #897868, a few cars, lamp dots) and the city ground at y -60 round it, out to
//             x +-3500 and z -2300 (a block-and-street canvas that fades into the haze with distance). Params: none.
//   gtower    The near glass tower: footprint 14 x 13, centre (9.7, -49.5), base y -60, roof y 15.6, 27 floors of 2.8 m, ten bays
//             on the front (1.4 m) and the sides (1.3 m), 0.07 mullions that stand 0.10 m proud, glass #35455E / #526885, spandrels
//             #292D3B, slab bands #4C4A59, 33 % of the bays lit warm (#F5BD78 #E79754 #FFE1A9), a roof with plant room and a red
//             beacon. Floor slabs inside, so a cut shows floors.
//             fall 0..1 (propState default 0; tween it, DESIGN table: 0 intact; .5 top section 29.4 m tall tipped 17 deg / 8 deg
//               and dropped 11.5 m, cut exposed, 42 shards flying; 1 top section crumbled away, surviving shell 30 m high with
//               three bare slabs and zero lit bays, rubble field 25 x 19 m, 1-6 m high). The fracture is a diagonal jagged cut
//               from (2.7,-18.0) to (16.7,-9.6) on the front; a dark crack stroke (.06 -> .22 m) shows before the top lets go.
//               Piecewise linear at 0 / .5 / 1 as the table, the top crumbles flat from .8 and is hidden at 1.
//             dust 0..1 (default spec.dust 1; the first tween of it jumps: seed it at t 0): multiplies the dust opacity (the
//               director lowers it when the cloud sea comes). The dust is one soft 3D ellipsoid plus 18 billow sprites in
//               #B7A4A0 / #D3BDB1 / #776D76, centre and radii as the table (0 at fall 0, peak .78 at .5, .64 at 1).
//   gcity     The mid city, seeded (spec.seed 26031): about 250 boxy buildings (fewer than the design's 136 asked for would
//             leave holes in shots A and C; one merged mesh per facade style, canvas-texture facades with lit windows, 28 %),
//             z -85..-1950, in a wedge x +-(0.42 |z| + 70..100). Facades #39384B #4C4252 #5B4C57, lights #FFB874 #FFD29A #CD8D68,
//             haze toward spec.haze with distance, darker toward the ground. 12 towers 76..112 m far out. The 8 taller
//             buildings are fixed (x, z, height m): left (-45,-165,88) (-100,-225,95) (-65,-300,78) (-125,-385,92), right
//             (85,-180,80) (150,-255,96) (60,-335,70) (120,-395,88); every roof is below 12 deg from camera A, and all are over
//             27 m so their roofs stand out of a cloud sea capped at y -33. Params: none.
//   ghorizon  The far band at z -2200, x -1800..1800, y -60..70: silhouette #66506A, hills #806078, lights #C88968 (alpha .25),
//             the lower 0.8 deg blends into spec.haze. Alpha texture (transparent above the roofs), drawn behind everything
//             nearer. Params: none.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const cv = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, { repeat = false, aniso = 4, srgb = true } = {}) => {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const DAY = (o) => { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const flat = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.fog = false; return m; };
const HAZE = "#7a5c76";
const uni = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
const tri = (x) => Math.abs(x - Math.floor(x) - 0.5) * 2;
// the jagged edge of the fracture: the same function in the shader below (metres, about +-0.8)
const jag = (x, z) => (tri(x * 0.33 + z * 0.21) - 0.5) * 0.9 + (tri(x * 1.1 - z * 0.7 + 0.3) - 0.5) * 0.5 + (tri(x * 3.1 + z * 2.3) - 0.5) * 0.25;

// a basic material with a few lines of shader added (shared uniforms objects, so apply() just sets .value)
function patch(mat, key, { u = {}, vhead = "", vbody = "", head = "", pre = "", frag = "" }) {
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = `varying vec3 vObj; varying float vHz;\n${vhead}\n` + sh.vertexShader.replace("#include <project_vertex>", `#include <project_vertex>\n vObj = position; vHz = -mvPosition.z;\n${vbody}`);
    sh.fragmentShader = `varying vec3 vObj; varying float vHz;\n${head}\n` + sh.fragmentShader.replace("#include <map_fragment>", `${pre}\n#include <map_fragment>`).replace("#include <opaque_fragment>", `${frag}\n#include <opaque_fragment>`);
  };
  return mat;
}
const HAZE_HEAD = "uniform vec3 uHazeCol; uniform float uHzK; uniform float uHzMax;";
const HAZE_FRAG = "{ float glw = smoothstep(0.2, 0.6, max(outgoingLight.r, outgoingLight.g)); float hz = uHzMax * (1.0 - exp(-vHz * uHzK)); outgoingLight = mix(outgoingLight, uHazeCol, hz * (1.0 - 0.6 * glw)); }";
const hazeU = (haze, k, max) => ({ uHazeCol: { value: new THREE.Color(haze) }, uHzK: { value: k }, uHzMax: { value: max } });
function hazeMat(opts, { haze = HAZE, k = 0.0007, max = 0.88, key = "city" } = {}) {
  const m = flat(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, ...opts }));
  return patch(m, `gc-haze-${key}`, { u: hazeU(haze, k, max), head: HAZE_HEAD, frag: HAZE_FRAG });
}

// a merged soup of quads: positions, uvs, per-vertex linear colours
class Soup {
  constructor() { this.p = []; this.uv = []; this.c = []; this.i = []; }
  quad(a, b, c, d, uv, cols) {
    const n = this.p.length / 3; this.p.push(...a, ...b, ...c, ...d); this.uv.push(...uv);
    const cc = cols.length === 3 ? [cols, cols, cols, cols] : cols; for (const k of cc) this.c.push(...k);
    this.i.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  // an axis box, five faces, colour per face set shaded the way the tower is (sides darker than the front)
  box(x0, x1, y0, y1, z0, z1, col, topCol = col) {
    const u = [0, 0, 1, 0, 1, 1, 0, 1], sh = (k) => col.map((v) => v * k);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], u, topCol);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], u, col);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], u, sh(0.8));
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], u, sh(0.7));
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], u, sh(0.7));
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); return g;
  }
}
const mesh = (parent, geo, mat, order = 0) => { const o = DAY(new THREE.Mesh(geo, mat)); o.renderOrder = order; parent.add(o); return o; };

// ------------------------------------------------------------------------------------------------ street and ground
function streetDeckCanvas() {
  const R = mulberry(26031 + 7);
  return cv(2048, 224, (g, W, H) => {
    const X = (m) => ((m + 140) / 280) * W, Z = (z) => ((z + 43) / 28) * H;
    g.fillStyle = "#5a5662"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#4a4654"; for (let m = -140; m < 140; m += 2) { g.fillRect(X(m), Z(-43), 1, Z(-39) - Z(-43)); g.fillRect(X(m), Z(-19), 1, Z(-15) - Z(-19)); }
    g.fillStyle = "#373743"; g.fillRect(0, Z(-39), W, Z(-19) - Z(-39));
    g.fillStyle = "#6F6260"; g.fillRect(0, Z(-39), W, Z(-38.7) - Z(-39)); g.fillRect(0, Z(-19.3), W, Z(-19) - Z(-19.3));
    g.fillStyle = "#897868";
    for (let m = -140; m < 140; m += 9) g.fillRect(X(m), Z(-29.1), X(m + 3) - X(m), Z(-28.9) - Z(-29.1));
    g.fillRect(0, Z(-37.9), W, Z(-37.75) - Z(-37.9)); g.fillRect(0, Z(-20.25), W, Z(-20.1) - Z(-20.25));
    for (const x0 of [-60, 40]) for (let k = 0; k < 10; k++) g.fillRect(X(x0 + k * 0.9), Z(-39), X(x0 + k * 0.9 + 0.5) - X(x0 + k * 0.9), Z(-19) - Z(-39));
    // cars: dark bodies with warm head lamps and red tail lamps
    for (let i = 0; i < 16; i++) {
      const x = -130 + 260 * R(), z = (R() < 0.5 ? -34 : -24) + (R() - 0.5) * 1.2, dir = z < -29 ? 1 : -1, L = 4.4 + R() * 1.4;
      g.fillStyle = ["#1d1d28", "#2a2430", "#23303a", "#34262c"][Math.floor(R() * 4)]; g.fillRect(X(x), Z(z - 0.95), X(x + L) - X(x), Z(z + 0.95) - Z(z - 0.95));
      g.fillStyle = "#ffd9a0"; g.fillRect(dir > 0 ? X(x + L) - 3 : X(x), Z(z - 0.7), 3, Z(z + 0.7) - Z(z - 0.7));
      g.fillStyle = "#e0402e"; g.fillRect(dir > 0 ? X(x) : X(x + L) - 2, Z(z - 0.7), 2, Z(z + 0.7) - Z(z - 0.7));
    }
    for (let m = -135; m < 140; m += 22) for (const z of [-41, -17]) { const gr = g.createRadialGradient(X(m), Z(z), 0, X(m), Z(z), 9); gr.addColorStop(0, "rgba(255,214,150,0.95)"); gr.addColorStop(1, "rgba(255,214,150,0)"); g.fillStyle = gr; g.fillRect(X(m) - 9, Z(z) - 9, 18, 18); }
  });
}
function groundCanvas() {
  return cv(512, 512, (g, W, H) => {
    const R = mulberry(26031 + 11);
    g.fillStyle = "#1f1d2b"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#2d2a3a"; g.fillRect(0, H / 2 - 21, W, 42); g.fillRect(W / 2 - 21, 0, 42, H);
    g.fillStyle = "#3a3544"; g.fillRect(0, H / 2 - 2, W, 4); g.fillRect(W / 2 - 2, 0, 4, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${170 + Math.floor(R() * 60)},${100 + Math.floor(R() * 60)},${0.5 + R() * 0.4})`; const k = R() * W; g.fillRect(k, H / 2 - 22, 2, 2); g.fillRect(k, H / 2 + 20, 2, 2); g.fillRect(W / 2 - 22, k, 2, 2); g.fillRect(W / 2 + 20, k, 2, 2); }
  });
}
function buildStreet(P) {
  const S = P.spec, haze = S.haze || HAZE, g = P.whole, Y = -60, white = [1, 1, 1];
  const deck = new Soup(); deck.quad([-140, Y, -15], [140, Y, -15], [140, Y, -43], [-140, Y, -43], [0, 0, 1, 0, 1, 1, 0, 1], white);
  mesh(g, deck.geo(), hazeMat({ map: tex(streetDeckCanvas(), { aniso: 8 }), vertexColors: true }, { haze, key: "deck" }), 1);
  // the city ground: four pieces round the deck, no overlap (no z-fighting at 2 km)
  const gr = new Soup(), T = 100, E = 3500, Q = (x0, x1, z0, z1) => gr.quad([x0, Y, z1], [x1, Y, z1], [x1, Y, z0], [x0, Y, z0], [x0 / T, z1 / T, x1 / T, z1 / T, x1 / T, z0 / T, x0 / T, z0 / T], white);
  Q(-E, E, -2300, -43); Q(-E, -140, -43, -15); Q(140, E, -43, -15); Q(-E, E, -15, 30);
  const gm = hazeMat({ map: tex(groundCanvas(), { repeat: true, aniso: 8 }), vertexColors: true }, { haze, k: 0.0009, max: 0.92, key: "ground" });
  mesh(g, gr.geo(), gm, 0);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the near tower
const TW = { x0: 2.7, x1: 16.7, z0: -56, z1: -43, y0: -60, y1: 15.6, FL: 27, FH: 2.8, PIV: [9.7, -13.8, -49.5] };
function towerSkin(seed) {
  const BAYS = 10, FL = TW.FL, W = 640, H = 2160, cw = W / BAYS, fh = H / FL, R = mulberry(seed);
  const base = document.createElement("canvas"), emit = document.createElement("canvas");
  base.width = emit.width = W; base.height = emit.height = H;
  const g = base.getContext("2d"), e = emit.getContext("2d");
  g.fillStyle = "#292D3B"; g.fillRect(0, 0, W, H); e.fillStyle = "#000"; e.fillRect(0, 0, W, H);
  const mix = (hex, k) => { const c = new THREE.Color(hex).multiplyScalar(k); return "#" + c.getHexString(THREE.SRGBColorSpace); };
  const LIT = ["#F5BD78", "#E79754", "#FFE1A9"];
  for (let f = 0; f < FL; f++) {
    const floorLit = R() < 0.55, y = f * fh, sp = fh * 0.24, sl = fh * 0.07;
    for (let b = 0; b < BAYS; b++) {
      const x = b * cw, key = R() < 0.3, alt = (b + f) % 2 ? 1.08 : 0.93, lit = floorLit && R() < 0.6, pick = LIT[Math.floor(R() * 3)], gh = fh - sp;
      const c0 = key ? "#526885" : "#35455E", gg = g.createLinearGradient(0, y, 0, y + gh);
      gg.addColorStop(0, mix(c0, alt * 1.18)); gg.addColorStop(1, mix(c0, alt * 0.9));
      g.fillStyle = gg; g.fillRect(x, y, cw, gh);
      g.fillStyle = "#292D3B"; g.fillRect(x, y + gh, cw, sp);
      g.fillStyle = "#4C4A59"; g.fillRect(x, y + fh - sl, cw, sl);
      if (lit) {
        const eg = e.createLinearGradient(0, y, 0, y + gh); eg.addColorStop(0, "#FFE1A9"); eg.addColorStop(0.25, pick); eg.addColorStop(1, mix(pick, 0.8));
        e.fillStyle = eg; e.fillRect(x + 3, y + 3, cw - 6, gh - 4);
        e.fillStyle = "#000";
        if (R() < 0.75) e.fillRect(x + cw * (0.08 + 0.3 * R()), y + gh * 0.66, cw * (0.3 + 0.25 * R()), gh * 0.34);
        if (R() < 0.35) { e.beginPath(); e.ellipse(x + cw * (0.6 + 0.3 * R()), y + gh * 0.78, cw * 0.1, gh * 0.22, 0, 0, 7); e.fill(); }
        if (R() < 0.5) e.fillRect(x + cw * 0.5, y + gh * 0.3, cw * 0.04, gh * 0.4);
        e.fillStyle = "#FFE1A9"; e.fillRect(x + cw * 0.15, y + 4, cw * 0.7, 2);
      }
    }
  }
  g.fillStyle = "#1b1e2b"; for (let b = 0; b <= BAYS; b++) g.fillRect(b * cw - 1.5, 0, 3, H);
  return { base: tex(base, { aniso: 8 }), emit: tex(emit, { aniso: 8 }) };
}
const TOWER_HEAD = "uniform sampler2D tEmit; uniform float uKeep, uCut0, uSlope, uDrop, uFlat, uLift, uLit, uGain; float tri(float x){ return abs(fract(x)-0.5)*2.0; } float jag(vec2 p){ return (tri(p.x*0.33+p.y*0.21)-0.5)*0.9 + (tri(p.x*1.1-p.y*0.7+0.3)-0.5)*0.5 + (tri(p.x*3.1+p.y*2.3)-0.5)*0.25; }";
const TOWER_PRE = "if (uKeep != 0.0) { float cy = mix(uCut0 + uSlope * (vObj.x - 9.7) - uDrop, -30.0, uFlat) + jag(vObj.xz); if (uKeep < 0.0) { if (vObj.y > cy + uLift) discard; } else if (vObj.y < cy) discard; }";
const TOWER_FRAG = "{ float fs = gl_FrontFacing ? 1.0 : 0.0; vec3 em = texture2D(tEmit, vMapUv).rgb; outgoingLight = outgoingLight * mix(0.4, 1.0, fs) + em * uLit * uGain * mix(0.3, 1.0, fs); } " + HAZE_FRAG;

function buildTower(P) {
  const S = P.spec, g = P.whole, haze = S.haze || HAZE, { x0, x1, z0, z1, y0, y1, FL, FH, PIV } = TW, [px, py, pz] = PIV, white = [1, 1, 1];
  const F = towerSkin(26031 + 1), Sd = towerSkin(26031 + 2);
  const blank = (c) => { const t = new THREE.CanvasTexture(cv(2, 2, (q) => { q.fillStyle = c; q.fillRect(0, 0, 2, 2); })); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const WHITE = blank("#fff"), BLACK = blank("#000");
  const sh = (k) => [k, k, k], cb = (k) => [sh(0.62 * k), sh(0.62 * k), sh(k), sh(k)];
  // geometry (world numbers): front/back and side skins, solid pieces (fins, slabs, roof)
  const fb = new Soup(), sd = new Soup(), so = new Soup(), sl = new Soup();
  fb.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1, 0, 1, 1, 0, 1], cb(1));
  fb.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, 1, 0, 1, 1, 0, 1], cb(0.8));
  sd.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [0, 0, 1, 0, 1, 1, 0, 1], cb(0.85));
  sd.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [0, 0, 1, 0, 1, 1, 0, 1], cb(0.7));
  const fin = lin("#1b1f2e");
  for (let k = 0; k <= 10; k++) { const x = x0 + k * 1.4; so.box(x - 0.035, x + 0.035, y0, y1, z1, z1 + 0.1, fin); }
  for (let k = 0; k <= 10; k++) { const z = z0 + k * 1.3; so.box(x0 - 0.1, x0, y0, y1, z - 0.035, z + 0.035, fin); }
  for (let k = 1; k < FL; k++) { const y = y0 + k * FH; sl.box(x0 + 0.1, x1 - 0.1, y - 0.15, y + 0.15, z0 + 0.1, z1 - 0.1, lin("#3d3b49"), lin("#5a5766")); }
  const roofC = lin("#2a2c3a");
  so.box(x0 - 0.1, x1 + 0.1, y1, y1 + 0.5, z0 - 0.1, z1 + 0.1, roofC, lin("#34364a"));
  so.box(x0 + 4, x0 + 9, y1 + 0.5, y1 + 3.2, z0 + 3, z0 + 7, lin("#30323f"));
  so.box(x1 - 4.6, x1 - 2.2, y1 + 0.5, y1 + 2.1, z1 - 5, z1 - 2, lin("#3a3c4a"));
  so.box(x0 + 6.5, x0 + 6.8, y1 + 3.2, y1 + 17, z0 + 4.9, z0 + 5.2, lin("#3a3c4a"));
  so.box(x0 + 6.25, x0 + 7.05, y1 + 16.6, y1 + 17.4, z0 + 4.65, z0 + 5.45, [1, 0.12, 0.08]);
  const geoF = fb.geo(), geoS = sd.geo(), geoO = so.geo(), geoL = sl.geo();

  const sections = [-1, 1].map((keep) => {
    const U = uni({ uKeep: keep, uCut0: -13.8, uSlope: 0.6, uDrop: 0, uFlat: 0, uLift: 0, uLit: 1, uGain: 0.95 });
    const make = (map, emit, lift) => {
      const u = { ...U, ...(lift ? { uLift: { value: 0 } } : {}), tEmit: { value: emit }, ...hazeU(haze, 0.0003, 0.5) };
      const m = flat(new THREE.MeshBasicMaterial({ map, vertexColors: true, side: THREE.DoubleSide }));
      return [patch(m, "gc-tower", { u, head: TOWER_HEAD + HAZE_HEAD, pre: TOWER_PRE, frag: TOWER_FRAG }), u];
    };
    const mF = make(F.base, F.emit), mS = make(Sd.base, Sd.emit), mO = make(WHITE, BLACK), mL = make(WHITE, BLACK, true);
    // skins share one set of cut uniforms; the solid pieces (slabs) get their own lift
    const grp = new THREE.Group(); g.add(grp);
    const holder = new THREE.Group(); holder.position.set(-px, -py, -pz); grp.add(holder);
    const meshes = [mesh(holder, geoF, mF[0]), mesh(holder, geoS, mS[0]), mesh(holder, geoO, mO[0]), mesh(holder, geoL, mL[0])];
    // the lower section lives in world numbers directly (grp at the pivot, holder moves the geometry back)
    grp.position.set(px, py, pz);
    return { keep, grp, uF: mF[1], uS: mS[1], uO: mO[1], uL: mL[1], meshes };
  });
  const [low, up] = sections;
  // sync the three materials of a section (skins and solids read the same cut numbers)
  const setCut = (s, { drop, flatK, lift, lit }) => { for (const u of [s.uF, s.uS, s.uO, s.uL]) { u.uDrop.value = drop; u.uFlat.value = flatK; u.uLit.value = lit; } s.uL.uLift.value = lift; };

  // the crack: thin dark boxes along the cut, front and left side
  const crackM = flat(new THREE.MeshBasicMaterial({ color: "#24212A", transparent: true, opacity: 0, depthWrite: false }));
  const crack = new THREE.Group(); g.add(crack); const segs = [];
  const seg = (ax, ay, az, bx, by, bz, side) => {
    const m = DAY(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.04), crackM)); m.renderOrder = 3; m.rotation.order = "YXZ";
    const dx = side ? az - bz : bx - ax, dy = by - ay; m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    m.userData.len = Math.hypot(dx, dy); crack.add(m); segs.push(m);
    m.rotation.set(0, side ? Math.PI / 2 : 0, Math.atan2(dy, dx));
  };
  { const N = 40; let prev = null;
    for (let i = 0; i <= N; i++) { const x = 2.7 + (14 * i) / N, y = -13.8 + 0.6 * (x - 9.7) + jag(x, -43), p = [x, y, -42.86]; if (prev) seg(...prev, ...p, false); prev = p; }
    prev = null; for (let i = 0; i <= 26; i++) { const z = -43 - (13 * i) / 26, y = -18 + jag(2.7, z), p = [2.6, y, z]; if (prev) seg(...prev, ...p, true); prev = p; } }

  // shards: 42 boxes seeded along the cut, tumbling out
  const R = mulberry(26031 + 3), shardGeo = (() => {
    const b = new THREE.BoxGeometry(1, 1, 1), n = b.attributes.normal, cc = []; const L = new THREE.Vector3(-0.4, 0.8, 0.45).normalize();
    for (let i = 0; i < n.count; i++) { const k = 0.6 + 0.4 * Math.max(0, n.getX(i) * L.x + n.getY(i) * L.y + n.getZ(i) * L.z); cc.push(k, k, k); }
    b.setAttribute("color", new THREE.Float32BufferAttribute(cc, 3)); return b;
  })();
  const shardCols = ["#35455E", "#35455E", "#526885", "#4C4A59", "#8a7f84", "#F5BD78", "#292D3B"];
  const shards = []; const shardG = new THREE.Group(); g.add(shardG);
  for (let i = 0; i < 42; i++) {
    const w = 0.25 + 1.95 * R() ** 2.2, x = 2.9 + 13.8 * R(), z = z0 + 0.3 + 12.4 * R(), y = -13.8 + 0.6 * (x - 9.7) + jag(x, z) + 0.15;
    const m = flat(new THREE.MeshBasicMaterial({ color: shardCols[Math.floor(R() * shardCols.length)], vertexColors: true }));
    const o = mesh(shardG, shardGeo, m, 2); o.scale.set(w, w * (0.25 + 0.4 * R()), w * (0.4 + 0.6 * R()));
    const a = R() * Math.PI * 2, d = 2 + 8 * R();
    shards.push({ o, r0: new THREE.Vector3(x, y, z), out: new THREE.Vector3(Math.cos(a) * d, (R() - 0.3) * 3, Math.sin(a) * d * 0.8), spin: new THREE.Vector3(R() * 6 - 3, R() * 6 - 3, R() * 6 - 3), land: new THREE.Vector3(9.7 + (R() - 0.5) * 24, -59 + 5 * R(), -49.5 + (R() - 0.5) * 18), w });
  }

  // rubble: a lumpy mound 25 x 19 m with chunks on it, grown from the street by `fall`
  const rub = new THREE.Group(); g.add(rub); rub.position.set(9.7, -60, -49.5);
  { const RR = mulberry(26031 + 5), NX = 26, NZ = 20, parts = [];
    const hgt = (x, z) => { const u = x / 12.5, v = z / 9.5, rr = Math.hypot(u, v); const fall = clamp(1 - rr * rr) ** 0.7; return 0.1 + fall * (1.2 + 4.8 * (0.5 + 0.5 * Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.9 + 0.4)) ** 1.4) + 0.2 * Math.sin(x * 2.9 + z * 3.7); };
    const pos = [], col = [], idx = [], lightV = new THREE.Vector3(-0.4, 0.8, 0.45).normalize();
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const x = -12.5 + (25 * i) / NX, z = -9.5 + (19 * j) / NZ, h = hgt(x, z), hx = hgt(x + 0.4, z) - h, hz = hgt(x, z + 0.4) - h;
      const nn = new THREE.Vector3(-hx, 0.4, -hz).normalize(), k = 0.55 + 0.45 * Math.max(0, nn.dot(lightV)), t = RR();
      const c = new THREE.Color(t < 0.2 ? "#5d5560" : t < 0.6 ? "#7a6f72" : "#8a7f84"); pos.push(x, h, z); col.push(c.r * k, c.g * k, c.b * k);
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const hf = new THREE.BufferGeometry(); hf.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hf.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); hf.setIndex(idx); parts.push(hf);
    for (let c = 0; c < 70; c++) {
      const w = 0.5 + 2.4 * RR() ** 1.8, x = (RR() - 0.5) * 22, z = (RR() - 0.5) * 16.5, ell = (x / 12.5) ** 2 + (z / 9.5) ** 2; if (ell > 0.95) { c--; continue; }
      const b = new THREE.BoxGeometry(w, w * (0.3 + 0.5 * RR()), w * (0.4 + 0.6 * RR())); b.rotateY(RR() * 3.1); b.rotateZ((RR() - 0.5) * 0.9); b.rotateX((RR() - 0.5) * 0.9); b.translate(x, hgt(x, z) + w * 0.15, z);
      const n = b.attributes.normal, base = new THREE.Color(["#35455E", "#4C4A59", "#8a7f84", "#6e6470", "#526885"][Math.floor(RR() * 5)]), cc = [];
      for (let i = 0; i < n.count; i++) { const k = 0.55 + 0.45 * Math.max(0, n.getX(i) * lightV.x + n.getY(i) * lightV.y + n.getZ(i) * lightV.z); cc.push(base.r * k, base.g * k, base.b * k); }
      b.setAttribute("color", new THREE.Float32BufferAttribute(cc, 3)); b.deleteAttribute("normal"); b.deleteAttribute("uv"); parts.push(b);
    }
    mesh(rub, mergeGeometries(parts), hazeMat({ vertexColors: true }, { haze, k: 0.0003, max: 0.5, key: "rubble" }), 1);
  }

  // dust: one soft ellipsoid and 18 billow sprites
  const noiseT = tex(cv(256, 256, (q, W, H) => {
    const RN = mulberry(26031 + 9); q.fillStyle = "#808080"; q.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = RN() * W, y = RN() * H, r = 14 + 40 * RN(), v = RN() < 0.5 ? 255 : 0, a = 0.18 + 0.3 * RN();
      for (const [ox, oy] of [[0, 0], [-W, 0], [W, 0], [0, -H], [0, H]]) { const gr = q.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); q.fillStyle = gr; q.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); }
    }
  }), { repeat: true, srgb: false });
  const DB = new THREE.Color("#B7A4A0"), DL = new THREE.Color("#D3BDB1"), DS = new THREE.Color("#776D76");
  const dustU = uni({ uOp: 0, uBase: DB, uLight: DL, uShadow: DS });
  const dm = flat(new THREE.MeshBasicMaterial({ map: noiseT, transparent: true, depthWrite: false }));
  patch(dm, "gc-dust", {
    u: dustU, vhead: "varying vec3 vNo; varying vec3 vNv; varying vec3 vVw;", vbody: "vNo = normal; vNv = normalize(normalMatrix * normal); vVw = normalize(-mvPosition.xyz);",
    head: "varying vec3 vNo; varying vec3 vNv; varying vec3 vVw; uniform float uOp; uniform vec3 uBase, uLight, uShadow;",
    frag: "{ float n = diffuseColor.r; float ny = normalize(vNo).y; float fr = abs(dot(normalize(vNv), normalize(vVw))); vec3 c = mix(uShadow, uBase, smoothstep(-0.9, 0.1, ny)); c = mix(c, uLight, smoothstep(0.1, 0.95, ny)); outgoingLight = c * (0.8 + 0.4 * n); diffuseColor.a = clamp(uOp * smoothstep(0.0, 0.55, fr) * (0.4 + 0.8 * n), 0.0, 1.0); }",
  });
  const dustE = mesh(g, new THREE.SphereGeometry(1, 28, 18), dm, 6);
  const puffT = tex(cv(128, 128, (q, W) => {
    const RP = mulberry(26031 + 13), blobs = [[64, 64, 52]]; for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + RP(), d = 26 + 8 * RP(); blobs.push([64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 24 + 10 * RP()]); }
    for (const [x, y, r] of blobs) { const s = Math.round(255 * (0.62 + 0.38 * (1 - y / W))), gr = q.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${s},${s},${s},0.95)`); gr.addColorStop(0.6, `rgba(${s},${s},${s},0.55)`); gr.addColorStop(1, `rgba(${s},${s},${s},0)`); q.fillStyle = gr; q.fillRect(x - r, y - r, 2 * r, 2 * r); }
  }));
  const RB = mulberry(26031 + 17), billows = [];
  for (let i = 0; i < 18; i++) {
    const a = RB() * 6.283, ny = -0.15 + 1.1 * RB(), rr = Math.sqrt(1 - ny * ny), m = new THREE.SpriteMaterial({ map: puffT, transparent: true, depthWrite: false, color: "#B7A4A0" });
    m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.fog = false;
    const s = DAY(new THREE.Sprite(m)); s.renderOrder = 7; g.add(s);
    billows.push({ s, u: new THREE.Vector3(Math.cos(a) * rr, ny, Math.sin(a) * rr), k: 0.85 + 0.3 * RB(), size: 0.3 + 0.22 * RB(), ny });
  }

  // the fall table at fall 0, .5, 1
  const TAB = {
    t: [[0, 0, 0], [-3.2, -11.5, 2.6], [-10, -45, 7]], rz: [0, 17, 48], rx: [0, 8, 24],
    c: [[9.7, -58, -49.5], [8, -26, -46], [6, -38, -45]], r: [[0, 0, 0], [20, 29, 15], [37, 24, 29]], op: [0, 0.78, 0.64],
  };
  const pw = (arr, f) => { const k = f < 0.5 ? 0 : 1, t = f < 0.5 ? f / 0.5 : (f - 0.5) / 0.5, a = arr[k], b = arr[k + 1]; return Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : lerp(a, b, t); };
  const V = new THREE.Vector3(), Eu = new THREE.Euler(0, 0, 0, "ZXY"), M = new THREE.Matrix4(), Pv = new THREE.Vector3(px, py, pz);
  const upPose = (f) => { const t = pw(TAB.t, f), z = (pw(TAB.rz, f) * Math.PI) / 180, x = (pw(TAB.rx, f) * Math.PI) / 180; Eu.set(x, 0, z, "ZXY"); return { t, e: Eu.clone() }; };

  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fall || S.fall || 0), dustK = clamp(ps.dust ?? S.dust ?? 1);
      // lower shell: skin top .8 m down by .5, then to -30 at 1; slabs stand 3 floors proud of it at 1
      const e1 = clamp(f / 0.5), e2 = sstep(0.5, 1, f);
      setCut(low, { drop: 0.8 * e1, flatK: e2, lift: 8.4 * e2, lit: 1 - clamp((f - 0.45) / 0.55) });
      // upper section
      const { t, e } = upPose(f), crumble = sstep(0.8, 1, f);
      up.grp.position.set(px + t[0], py + t[1], pz + t[2]); up.grp.rotation.copy(e); up.grp.scale.set(1, 1 - 0.97 * crumble, 1); up.grp.visible = f < 0.995;
      setCut(up, { drop: 0, flatK: 0, lift: 0, lit: 1 - 0.4 * crumble });
      // crack: dark stroke before the top lets go, gone when the cut is open
      const cw = 0.06 + 0.16 * clamp(f * 2); crackM.opacity = sstep(0, 0.06, f) * (1 - sstep(0.3, 0.55, f)); crack.visible = crackM.opacity > 0.01;
      for (const m of segs) m.scale.set(m.userData.len * 1.15, cw, 1);
      // shards ride the top until .25, fly to 2-10 m at .5, land on the rubble at 1
      shardG.visible = f > 0.004;
      if (shardG.visible) {
        const q = new THREE.Quaternion().setFromEuler(e);
        for (const s of shards) {
          const rigid = V.copy(s.r0).sub(Pv).applyEuler(e).add(Pv).add(new THREE.Vector3(t[0], t[1], t[2]));
          const a = sstep(0.25, 0.5, f), p2 = sstep(0.5, 1, f);
          const fly = rigid.clone().addScaledVector(s.out, a); fly.y -= 3 * a * a;
          const at = new THREE.Vector3().lerpVectors(fly, s.land, 1 - (1 - p2) ** 2); at.y = lerp(fly.y, s.land.y, p2 * p2);
          s.o.position.copy(at);
          s.o.quaternion.setFromEuler(new THREE.Euler(s.spin.x * Math.max(0, f - 0.25), s.spin.y * Math.max(0, f - 0.25), s.spin.z * Math.max(0, f - 0.25))).premultiply(q);
          s.o.visible = true;
        }
      }
      // rubble grows from the street from .55
      const rg = sstep(0.55, 1, f); rub.visible = rg > 0.002; rub.scale.set(1, Math.max(rg, 0.001), 1);
      // dust
      const c = pw(TAB.c, f), r = pw(TAB.r, f), op = pw(TAB.op, f) * dustK;
      dustE.visible = r[0] > 0.01 && op > 0.002; dustE.position.set(...c); dustE.scale.set(Math.max(r[0], 1e-3), Math.max(r[1], 1e-3), Math.max(r[2], 1e-3)); dustE.rotation.y = f * 0.9; dustU.uOp.value = op;
      const avg = (r[0] + r[1] + r[2]) / 3, tmp = new THREE.Color();
      for (const b of billows) {
        b.s.visible = dustE.visible; if (!b.s.visible) continue;
        const grow = 1 + 0.12 * Math.sin(f * 6 + b.ny * 5);
        b.s.position.set(c[0] + b.u.x * r[0] * b.k, c[1] + b.u.y * r[1] * b.k, c[2] + b.u.z * r[2] * b.k);
        b.s.scale.setScalar(avg * b.size * 2.2 * grow);
        tmp.copy(DS).lerp(DB, sstep(-0.2, 0.4, b.u.y)).lerp(DL, sstep(0.4, 1, b.u.y)); b.s.material.color.copy(tmp); b.s.material.opacity = clamp(op * 0.85);
      }
    },
  };
}

// ------------------------------------------------------------------------------------------------ the mid city
function facadeTex(base, seed) {
  return tex(cv(256, 256, (g, W, H) => {
    const R = mulberry(seed), LIGHTS = ["#FFB874", "#FFD29A", "#CD8D68"], cell = 32;
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
      const lit = R() < 0.28, k = R();
      g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(x, y + cell - 3, cell, 3);
      g.fillStyle = lit ? LIGHTS[Math.floor(R() * 3)] : `rgb(${30 + k * 14},${32 + k * 14},${50 + k * 16})`;
      g.fillRect(x + 6, y + 8, cell - 12, cell - 14);
    }
  }), { repeat: true, aniso: 4 });
}
// fixed 8 taller buildings (x, z, w, d, height m), 4 each side of x 0, roofs above the cloud sea cap y -33 and under 12 deg from A
export const GRAVCITY_TALL = [[-45, -165, 22, 26, 88], [-100, -225, 28, 24, 95], [-65, -300, 20, 30, 78], [-125, -385, 30, 28, 92], [85, -180, 24, 24, 80], [150, -255, 26, 32, 96], [60, -335, 22, 22, 70], [120, -395, 28, 26, 88]];
function buildCity(P) {
  const S = P.spec, g = P.whole, haze = S.haze || HAZE, R = mulberry(S.seed ?? 26031), Y0 = -60;
  const rects = [], fits = (x, z, w, d, m = 5) => !rects.some((r) => Math.abs(r.x - x) < (r.w + w) / 2 + m && Math.abs(r.z - z) < (r.d + d) / 2 + m);
  const list = [];
  const add = (x, z, w, d, h, tall) => { rects.push({ x, z, w, d }); list.push({ x, z, w, d, h, tall }); };
  for (const [x, z, w, d, h] of GRAVCITY_TALL) add(x, z, w, d, h, true);
  const cap = (z, h) => Math.min(h, 61.5 + Math.tan((12 * Math.PI) / 180) * (Math.abs(z) + 3.2));
  const place = (n, zA, zB, geo, spread, towers) => {
    let tries = 0, got = 0;
    while (got < n && tries++ < n * 60) {
      const u = R(), z = geo ? -zA * Math.pow(zB / zA, u) : -(zA + (zB - zA) * u), x = (R() * 2 - 1) * (0.42 * Math.abs(z) + spread);
      const w = 9 + 25 * R(), d = 10 + 30 * R(); if (!fits(x, z, w, d)) continue;
      const h = towers ? 76 + 36 * R() : 16 + 47 * Math.pow(R(), 0.9);
      add(x, z, w, d, cap(z, h), false); got++;
    }
  };
  place(110, 85, 320, false, 70, false);
  place(12, 450, 1900, true, 100, true);
  place(130, 320, 1950, true, 100, false);
  const styles = ["#39384B", "#4C4252", "#5B4C57"].map((c, i) => ({ s: new Soup(), tex: facadeTex(c, 26031 + 30 + i) })), roofs = new Soup();
  for (const b of list) {
    const st = styles[Math.floor(R() * 3)].s, fh = 2.8 + 0.7 * R(), vs = 1 / (8 * fh), uo = Math.floor(R() * 8) / 8, x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, y0 = Y0, y1 = Y0 + b.h;
    const t = 0.9 + 0.2 * R(), cl = (k) => [k * t, k * t, k * t], face = (a, bb, c, d, wd, k) => st.quad(a, bb, c, d, [uo, 0, uo + wd / 25.6, 0, uo + wd / 25.6, b.h * vs, uo, b.h * vs], [cl(0.45 * k), cl(0.45 * k), cl(k), cl(k)]);
    face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], b.w, 1);
    face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], b.w, 0.8);
    face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], b.d, 0.65);
    face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], b.d, 0.75);
    roofs.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 0, 1, 0, 1, 1, 0, 1], lin("#2e2d3d"));
    if (R() < 0.6) roofs.box(b.x - b.w * 0.2, b.x + b.w * 0.05, y1, y1 + 2 + 2 * R(), b.z - b.d * 0.15, b.z + b.d * 0.15, lin("#3a394b"));
    if (b.h > 75 || b.tall) { roofs.box(b.x - 0.2, b.x + 0.2, y1, y1 + 8, b.z - 0.2, b.z + 0.2, lin("#3a394b")); roofs.box(b.x - 0.5, b.x + 0.5, y1 + 8, y1 + 9, b.z - 0.5, b.z + 0.5, [1, 0.15, 0.1]); }
  }
  for (const { s, tex: map } of styles) mesh(g, s.geo(), hazeMat({ map, vertexColors: true }, { haze, key: "facade" }), 1);
  mesh(g, roofs.geo(), hazeMat({ vertexColors: true }, { haze, key: "roof" }), 1);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the far band
function buildHorizon(P) {
  const S = P.spec, g = P.whole, haze = S.haze || HAZE, W = 4096, H = 148, mpp = 3600 / W, Yt = 70;
  const c = cv(W, H, (q) => {
    const R = mulberry(26031 + 21), py = (y) => (Yt - y) / mpp;
    q.fillStyle = "#806078"; q.beginPath(); q.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) q.lineTo(x, py(-8 + 22 * (0.5 + 0.5 * Math.sin(x * 0.0031 + 1)) * (0.6 + 0.4 * Math.sin(x * 0.011 + 2)) + 6 * Math.sin(x * 0.027)));
    q.lineTo(W, H); q.fill();
    q.fillStyle = "#66506A";
    for (let x = 0; x < W;) {
      const w = 5 + 22 * R() ** 1.5, cluster = 0.5 + 0.5 * Math.sin(x * 0.0021 + 0.8), roof = -44 + (R() ** 2.6) * (30 + 79 * cluster), top = py(Math.min(65, roof));
      q.fillRect(x, top, w, H - top); x += w * (0.6 + 0.6 * R());
    }
    for (let i = 0; i < 1500; i++) { const x = R() * W, y = py(-44 + 100 * R() ** 2.2); q.fillStyle = `rgba(200,137,104,${0.25 + 0.25 * R()})`; q.fillRect(x, y, 1 + (R() < 0.3 ? 1 : 0), 1 + (R() < 0.2 ? 1 : 0)); }
    const gr = q.createLinearGradient(0, H - 35, 0, H); gr.addColorStop(0, "rgba(122,92,118,0)"); gr.addColorStop(0.55, "rgba(122,92,118,0.8)"); gr.addColorStop(1, "rgba(122,92,118,1)");
    q.fillStyle = gr; q.fillRect(0, H - 35, W, 35);
  });
  const t = tex(c, { aniso: 4 }); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  const m = flat(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.toneMapped = true;
  const o = mesh(g, new THREE.PlaneGeometry(3600, 130), m, -3); o.position.set(0, 5, -2200);
  return { grip: 0 };
}

export const GRAVCITY_KINDS = { gstreet: buildStreet, gtower: buildTower, gcity: buildCity, ghorizon: buildHorizon };
