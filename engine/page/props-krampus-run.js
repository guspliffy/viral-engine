// props-krampus-run.js - Krampus myth 01 "One night a year he checks your boots": look F, the KRAMPUS RUN town square (DESIGN.md section F; panel 19, 46.5-51.0 s)
// USAGE
//   kind        krampusrun   (one prop: the whole square; nothing in it is held in a hand, KRAMPUS_RUN_GRIPS is empty)
//   ORIGIN      the middle of the parade lane on the snow (y 0). Metres, x right, y up, +z toward the default camera. The parade walks toward +z, at the camera.
//               It brings its own ground, sky (dome, 420 stars, the painted moon up the lane, the hero peak ring), haze and lights; stand it 300 m or more from the lane
//               (e.g. x 400) and set `far` of the storyboard to 420 or more (the bench stands it at 0). The sky follows the camera. Hidden (scale 0) = no light, no cost.
//   MARKS       lane x -2.75..+2.75, z -90..+8, then the street on to z -330 (5.5 m wide, 140 torch points up it); ropes at x +-2.75, z -18..+8, 11 larch posts a side 2.6 apart;
//               near runners (8) at z 3 - 2.4 i, x -1.2 / +1.2 by turns, shifted up to 0.5 by hash; mid (16) at z -17 - 2.4 i; far (72) in 6 rows at z -36 - 8.8 r;
//               front onlookers 7 a side at |x| 3.3..3.9, z -8..+6, face the lane; back rows 2 x 30 behind them to |x| 7; church (+9, -46) with its tower's lit round window facing +z;
//               9 house fronts (x -12 left 5, +12 right 4; fronts face the lane, z -8..-45); the fir 7 m at (-8, -30). Camera (start): (0.4, 1.15, 7.8) -> (0, 1.35, -4), fov 46.
//   SPEC KEYS   (all optional; read at build time)    seed 0  varies the onlookers' colours (integer)     backRows true  false = leave out the 2 x 30 `visitorcrowd` figures
//   STATE       march 0    gait cycles: every runner advances 1.10 m a cycle toward +z (z = z0 + 1.10 march), phases hashed, about 1.3 cycles a second in the clip
//               torch 1    all flames, glows, pools, sparks, smoke and the 4 real lights;   ring 0.8  every runner's bells (the beast's `ring`)
//               cheer 0.5  onlookers bob 2 cm at 1.1 Hz, phases hashed (0.04 x cheer); from 0.6 a third of them raise both arms, all the way up at 1
//   COUNTS      KRAMPUS_RUN_COUNTS / krampusRunCounts() (DESIGN section 9 row F): 8 + 16 + 72 runners, 140 torch points, 22 posts, 14 front onlookers (5 phones, 12 hats, 3 kids),
//               38 lit windows on the 9 fronts (the church's 5 lit windows are extra), 300 hoof prints.
//   RUNNERS     copies of the `krampus` look of props-krampus-beast.js, called not edited: spec {runner: true, lod: near | mid | far, seed 1..96}; fur (seed*3)%5, mask seed%4,
//               horns seed%3, so no two neighbours share fur or horns. Real lights: the 4 nearest torches (#ffb060, range 7); every other flame is painted with a baked pool r 1.8.
//   LANE KIT    the lane's house kit is not exported (props-krampus-lane.js exports its kinds only), so the 9 fronts are built here from the same palette and plan: plaster ground
//               floors (or timber), sun-burnt upper boards with 3 repair boards, framed lit windows with shutters, a balcony, rafter tails, a snow-capped roof, icicles, a lantern.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { KRAMPUS_BEAST_KINDS, krampusPoints } from "./props-krampus-beast.js";
import { SH_FAR_KINDS } from "./props-sh-far.js";
import { WINTER_KINDS } from "./props-winter.js";
import { firGeometry } from "./set-snowslope.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const frac = (x) => x - Math.floor(x);
const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const rgba = (c, a) => { const A = hexA(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

// the shared palette (DESIGN, top) + the square's own
const K = {
  sky0: "#0e1630", sky1: "#24376b", star: "#e9eefc", snow: "#cfdcf2", snowS: "#7f95c4", snowD: "#4a5f96", snowL: "#ffffff", snowW: "#ffd9a0",
  lane: "#b9c4d6", rut: "#8f9ab0", streak: "#ffb060", torch: "#ff9a3a",
  wood: "#6a4528", woodB: "#3a2a1e", woodS: "#3c2616", woodBS: "#1f1610", woodLit: "#a87242", repair: "#b98a52", larch: "#6a4528",
  stone: "#8a8d96", stoneS: "#565a66", stoneL: "#b9bcc6", flame: "#ffb45a", win: "#ffc766", flameS: "#ff9a3a", core: "#fff0c0", pool: "#ffcf8a",
  iron: "#1f2126", ironS: "#101114", ironL: "#5a6270", hemp: "#b89a62", cream: "#d9d2c0", lime: "#cfc5ae", line: "#1a120c",
  fir: "#2f6a52", firS: "#1d4636", ice: "#d7eefb", copper: "#4f8a7a", copperS: "#2f5a50", copperL: "#8fc4b0", plaster: "#ece6d4", shingle: "#4a3a34",
  skin: "#e2a95c", limb: "#6b4a2b", leaf: "#6cbf3a", red: "#c8322e",
};
const COATS = ["#6a3a5a", "#2f5a44", "#2a3f6a", "#a8502a", "#c9962e", "#6a6e78", "#e6dcc6"];   // plum, forest, navy, rust, mustard, grey, cream
const SCARF = ["#c8322e", "#f2e8d0", "#2f8f8a", "#f2b824", "#2a3f6a", "#a8502a", "#6a3a5a"];
const HATS = ["#c23b3b", "#2f6fb0", "#e0b030", "#2f8f8a", "#f2e8d0", "#7a3f5f", "#4f7a44", "#d9774a", "#4a5a9a", "#c8322e", "#e8c4a0", "#3a6a5a"];
const SHUT = ["#3f6a4a", "#4a6078", "#7a2a22", "#b98a2e", "#2f5a44", "#4a6078", "#3f6a4a", "#7a2a22", "#b98a2e"];

// ---------------------------------------------------------------- the plan (frozen: DESIGN section F)
const PL = {
  laneHalf: 2.75, laneZ0: 8, laneZ1: -90, streetZ: -330, posts: 11, postStep: 2.6, postZ0: 8,
  near: 8, mid: 16, far: 72, farRows: 6, torchPts: 140, hoofPrints: 300, stride: 1.10,
  churchX: 9, churchZ: -46, firX: -8, firZ: -30, firH: 7, bulbs: 90,
  houses: [[-1, -8], [-1, -15.2], [-1, -22.4], [-1, -37.6], [-1, -44.8], [1, -8], [1, -15.2], [1, -22.4], [1, -29.6]],   // [side, z]: left (-x) 5, right (+x) 4
  lit: [4, 4, 5, 4, 4, 4, 4, 5, 4],   // lit windows a front: 38
  houseX: 12,
};
const FRONT = (() => {   // the 14 front onlookers: 11 adults + 3 kids; right (+x) 6 adults + the peeking child, left (-x) 4 adults + the carrier + the covering child + the child riding the carrier's shoulders = 7 a side
  const L = [], roles = { 1: ["adult", "adult", "adult", "adult", "adult", "adult"], [-1]: ["adult", "cover", "adult", "carrier", "adult", "adult"] };
  for (const side of [1, -1]) roles[side].forEach((role, i, a) => {
    const n = L.length, h = (k) => H2(n + 40, k), z = -8 + (14 * i) / (a.length - 1) + (side < 0 ? 0.5 * (h(1) - 0.5) : 0.25 * (h(1) - 0.5)), x = role === "cover" ? 3.02 + 0.05 * h(2) : 3.3 + 0.6 * h(2);
    L.push({ n, side, role, x: side * x, z, H: role === "cover" ? 0.40 : role === "carrier" ? 0.92 : 0.62 + 0.30 * h(3) });
  });
  // the peeking child: at the rope, tucked against the 4th adult's coat on the right
  const rAd = L.filter((f) => f.side > 0); const par = rAd[3]; L.push({ n: L.length, side: 1, role: "peek", x: 3.02, z: par.z - 0.34, H: 0.43 });
  const carrier = L.find((f) => f.role === "carrier"); L.push({ n: L.length, side: -1, role: "rider", x: carrier.x, z: carrier.z, H: 0.50 });
  const adults = L.filter((f) => f.role === "adult" || f.role === "carrier"), phoneIdx = [0, 2, 4, 6, 9], hatless = [3, 8], flaps = [1, 5, 10];
  adults.forEach((f, i) => { f.phone = phoneIdx.includes(i); f.cup = i === 7; f.hatless = hatless.includes(i); f.flaps = flaps.includes(i); });
  L.forEach((f, i) => { f.n = i; f.coat = COATS[(i * 3 + 1) % 7]; f.scarf = i % 7; f.hat = f.hatless ? null : HATS[i % 12]; f.up = i % 3 === 1; });
  return L;
})();
// runners: near 8, mid 16 (seeds 9-24), far 72 (seeds 25-96)
const RUNNERS = (() => {
  const R = [];
  for (let i = 0; i < PL.near; i++) R.push({ lod: "near", seed: i + 1, x: (i % 2 ? 1.2 : -1.2) + 0.5 * (2 * H2(i, 7) - 1), z0: 3 - 2.4 * i });
  for (let i = 0; i < PL.mid; i++) R.push({ lod: "mid", seed: 9 + i, x: (i % 2 ? 1.2 : -1.2) + 0.5 * (2 * H2(i, 17) - 1), z0: -17 - 2.4 * Math.floor(i / 2) - 0.0 });
  for (let r = 0; r < PL.farRows; r++) for (let j = 0; j < 12; j++) { const i = r * 12 + j; R.push({ lod: "far", seed: 25 + i, x: -2.35 + (4.7 * (j + 0.6 * H2(i, 27))) / 11.4, z0: -36 - 8.8 * r - 1.6 * H2(i, 37) }); }
  R.forEach((q, i) => { q.ph = 0.2 + 0.8 * H2(i, 47); q.yaw = (H2(i, 57) - 0.5) * 8; q.stoop = 0.15 * H2(i, 67); q.tongue = 0.1 + 0.5 * H2(i, 77); q.breath = H2(i, 87); });
  return R;
})();
const TORCH_PTS = Array.from({ length: PL.torchPts }, (_, i) => ({ x: (H2(i, 97) - 0.5) * 4.8 * (1 + i / 140), z: -84 - 1.75 * i - 1.2 * H2(i, 107), ph: H2(i, 117) }));

// ---------------------------------------------------------------- the counts of DESIGN section 9 row F, from the plan (importable in Node)
export function krampusRunCounts() {
  const adults = FRONT.filter((f) => f.role === "adult" || f.role === "carrier");
  return {
    runners: { near: RUNNERS.filter((r) => r.lod === "near").length, mid: RUNNERS.filter((r) => r.lod === "mid").length, far: RUNNERS.filter((r) => r.lod === "far").length },
    torchPoints: TORCH_PTS.length, posts: 2 * PL.posts, hoofPrints: PL.hoofPrints,
    front: { total: FRONT.length, phones: FRONT.filter((f) => f.phone).length, hats: FRONT.filter((f) => f.hat).length, hatless: FRONT.filter((f) => !f.hat).length, kids: FRONT.filter((f) => f.H < 0.52).length, flaps: FRONT.filter((f) => f.flaps).length, cups: FRONT.filter((f) => f.cup).length, adults: adults.length, coats: new Set(FRONT.map((f) => f.coat)).size },
    windows: PL.lit.reduce((a, b) => a + b, 0), churchWindows: 5, bulbs: PL.bulbs, firHeight: PL.firH, nearNeighbours: RUNNERS.slice(0, PL.near).every((r, i, a) => !i || (((r.seed * 3) % 5) !== ((a[i - 1].seed * 3) % 5) && r.seed % 3 !== a[i - 1].seed % 3)),
  };
}
export const KRAMPUS_RUN_COUNTS = krampusRunCounts();

// ---------------------------------------------------------------- canvases, materials, baked geometry
function cvs(w, h, draw, name = "", aniso = 8) {
  const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); draw(c.getContext("2d"), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name; return t;
}
// a texture painted in METRES: wm x hm at ppm pixels a metre, y up, origin lower left
const mtex = (wm, hm, ppm, fn, name = "", aniso = 8) => cvs(wm * ppm, hm * ppm, (g, w, h) => { g.setTransform(w / wm, 0, 0, -h / hm, 0, h); g.lineJoin = "round"; g.lineCap = "round"; fn(g, wm, hm); }, name, aniso);
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.88, ...o }); m.userData.noHatch = true; return m; };
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const spriteMat = (map, color, opacity, add) => { const m = new THREE.SpriteMaterial({ map, color, opacity, transparent: true, depthWrite: false, toneMapped: false, fog: false, ...(add && { blending: THREE.AdditiveBlending }) }); m.userData.noOutline = true; return m; };
const glowMat = (map, color, opacity = 1) => softMat({ map, color, opacity, blending: THREE.AdditiveBlending });
const steamy = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };
const radial = (stops, n = 128) => cvs(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);
const GLOW = () => once("krGlow", () => radial([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,255,255,0.55)"], [0.65, "rgba(255,255,255,0.15)"], [1, "rgba(255,255,255,0)"]]));
const POOL = () => once("krPool", () => radial([[0, "rgba(255,255,255,0.95)"], [0.35, "rgba(255,255,255,0.5)"], [0.7, "rgba(255,255,255,0.14)"], [1, "rgba(255,255,255,0)"]]));
const SMOKE = () => once("krSmoke", () => radial([[0, "rgba(255,255,255,0.9)"], [0.55, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]], 64));
const mx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const _c = new THREE.Color();
class Bake {   // plain geometry with vertex colours, merged into one mesh: add(geo, colour | (x,y,z,nx,ny,nz) => colour, matrix)
  constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, M) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (M) g.applyMatrix4(M);
    const P = g.attributes.position.array, N = g.attributes.normal.array, n = P.length / 3; let fixed = null;
    if (typeof col === "string") { _c.set(col); fixed = [_c.r, _c.g, _c.b]; }
    for (let i = 0; i < n; i++) {
      this.p.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); this.n.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
      if (fixed) this.c.push(...fixed); else { _c.set(col(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2])); this.c.push(_c.r, _c.g, _c.b); }
    }
    return this;
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); return g; }
}
const boxG = (w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => new THREE.BoxGeometry(w, h, d).applyMatrix4(mx(x, y, z, rx, ry, rz));
const unitSph = () => once("krSph", () => new THREE.SphereGeometry(1, 12, 9));
// a snow slab: a lump of depth `d` over a w x L top, rounded lip overhanging 15 % of d at the low edge, shade line under it; a pure function of its arguments (grid height field)
function snowSlab(w, L, d, seed = 0, lip = 0.15) {
  const nx = Math.max(6, Math.round(w / 0.25)), ns = 14, pos = [], idx = [];
  for (let j = 0; j <= ns; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, s = j / ns, ex = Math.min(1, Math.min(u, 1 - u) * 14), es = Math.min(1, Math.min(s, 1 - s) * 5) ** 0.6, wob = 1 + 0.12 * Math.sin(u * 17 + seed) + 0.08 * Math.sin(u * 41 + seed * 2.3 + s * 5);
    const h = d * Math.sqrt(Math.max(0, 1 - (1 - 2 * s) ** 6)) * Math.sqrt(ex) * wob * (0.55 + 0.45 * es);
    let x = (u - 0.5) * w, y = h, z = s * L; if (s > 0.96) { const q = (s - 0.96) / 0.04; z += lip * d * q; y -= 0.25 * d * q; }
    pos.push(x, y, z);
  }
  for (let j = 0; j < ns; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, e = c + 1; idx.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const snowCol = (x, y, z, nx, ny, nz) => cmix(K.snowS, ny > 0.5 ? K.snowL : K.snow, clamp(0.35 + ny * 0.7 + 0.06 * Math.sin(x * 7 + z * 5)));

// ---------------------------------------------------------------- the painted lane: trampled snow, slush ruts, 300 hoof prints drawn once from their index
function paintLane() {
  return mtex(5.5, 98, 60, (g, W, H) => {
    g.fillStyle = K.lane; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) { const x = H2(i, 1) * W, y = H2(i, 2) * H, r = 0.08 + 0.35 * H2(i, 3), q = g.createRadialGradient(x, y, 0, x, y, r); const c = i % 3 ? "#cfdcf2" : "#9eaac0"; q.addColorStop(0, rgba(c, 0.28)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (const cx of [1.55, 3.95]) {   // two slush ruts the full length, wandering
      for (const [wd, col, a] of [[0.46, "#a6b1c6", 0.5], [0.34, K.rut, 0.9], [0.1, "#7a86a0", 0.6]]) { g.beginPath(); for (let y = 0; y <= H; y += 0.5) { const x = cx + 0.08 * Math.sin(y * 0.7 + cx * 3) + 0.05 * Math.sin(y * 2.3); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = rgba(col, a); g.lineWidth = wd; g.stroke(); }
      g.beginPath(); for (let y = 0; y <= H; y += 0.5) { const x = cx + 0.2 + 0.08 * Math.sin(y * 0.7 + cx * 3) + 0.05 * Math.sin(y * 2.3); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = rgba("#dce6f5", 0.55); g.lineWidth = 0.025; g.stroke();   // the lit lip of the rut
    }
    for (let i = 0; i < PL.hoofPrints; i++) {   // 300 cloven prints, down the lane in pairs, toes toward the camera (y 0 is the near end)
      const y = 0.5 + (H - 1.0) * (i / (PL.hoofPrints - 1)) + 0.12 * (H2(i, 4) - 0.5), x = 0.8 + 3.9 * H2(i, 5), rot = (H2(i, 6) - 0.5) * 0.5;
      g.save(); g.translate(x, y); g.rotate(rot);
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 0.03, 0, 0.026, 0.05, 0.12 * s, 0, TAU); g.fillStyle = rgba("#6a7690", 0.8); g.fill(); g.beginPath(); g.ellipse(s * 0.03 - 0.006, 0.012, 0.014, 0.03, 0.12 * s, 0, TAU); g.fillStyle = rgba("#dce6f5", 0.35); g.fill(); }
      g.restore();
    }
    for (const sx of [0, 1]) { const q = g.createLinearGradient(sx ? W - 0.6 : 0, 0, sx ? W : 0.6, 0); q.addColorStop(sx ? 1 : 0, rgba("#cfdcf2", 0.9)); q.addColorStop(sx ? 0 : 1, rgba("#cfdcf2", 0)); g.fillStyle = q; g.fillRect(sx ? W - 0.6 : 0, 0, 0.6, H); }   // the banked edge
  }, "krLane");
}
function paintStreet() {   // the street beyond the lane: 5.5 x 240 m at 12 ppm, ruts and prints, every mark from its index
  return mtex(5.5, 240, 12, (g, W, H) => {
    g.fillStyle = "#aeb9cc"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 500; i++) { const x = H2(i, 8) * W, y = H2(i, 9) * H, r = 0.3 + 1.2 * H2(i, 10), q = g.createRadialGradient(x, y, 0, x, y, r); const c = i % 3 ? "#c4d0e4" : "#8f9ab0"; q.addColorStop(0, rgba(c, 0.3)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (const cx of [1.55, 3.95]) { g.beginPath(); for (let y = 0; y <= H; y += 1) { const x = cx + 0.1 * Math.sin(y * 0.4 + cx); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = rgba(K.rut, 0.85); g.lineWidth = 0.4; g.stroke(); }
  }, "krStreet", 4);
}
function paintGround() {   // the wide moonlit snow: drifts as soft blotches, one canvas 128 x 340 m at 4 ppm
  return mtex(128, 340, 4, (g, W, H) => {
    g.fillStyle = K.snow; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1800; i++) { const x = H2(i, 11) * W, y = H2(i, 12) * H, rx = 1.5 + 7 * H2(i, 13), ry = rx * (0.3 + 0.5 * H2(i, 14)), c = i % 2 ? "#e6efff" : "#a9bbdc"; g.save(); g.translate(x, y); g.rotate(H2(i, 15) * 3); const q = g.createRadialGradient(0, 0, 0, 0, 0, rx); q.addColorStop(0, rgba(c, 0.3)); q.addColorStop(1, rgba(c, 0)); g.scale(1, ry / rx); g.fillStyle = q; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); }
  }, "krGround", 4);
}

// ---------------------------------------------------------------- the ropes: 22 larch posts (pyramid tops, snow caps, a 1-2 cm blown crust uphill) and 3-strand hemp rope, 9 twists a metre
function buildRopes(root) {
  const B = new Bake(), RB = new Bake(), pyr = new THREE.ConeGeometry(0.0707, 0.1, 4, 1).applyMatrix4(mx(0, 0, 0, 0, Math.PI / 4, 0));
  const larch = (seed) => (x, y, z, nx, ny, nz) => cmul(K.larch, 0.8 + 0.3 * Math.abs(Math.sin(y * 31 + seed * 3 + x * 90)) * (0.6 + 0.4 * hh(Math.floor(y * 12) + seed)) + (y > 0.9 ? 0.1 : 0));
  let count = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < PL.posts; i++, count++) {
    const x = sx * PL.laneHalf, z = PL.postZ0 - PL.postStep * i, s = count + 1;
    B.add(boxG(0.10, 0.95, 0.10, x, 0.475, z), larch(s));
    B.add(boxG(0.106, 0.012, 0.106, x, 0.12 + 0.004, z), K.woodS);   // the chamfer line at the foot
    B.add(pyr, larch(s + 9), mx(x, 0.95 + 0.05, z));
    B.add(new THREE.SphereGeometry(1, 10, 7).applyMatrix4(mx(0, 0, 0, 0, 0, 0, 0.072, 0.03, 0.072)), snowCol, mx(x, 0.995, z));   // the cap, a rounded lip over the pyramid
    B.add(boxG(0.1, 0.55, 0.014, x, 0.66, z - 0.057), K.snowL);   // the crust on the uphill face
    B.add(boxG(0.115, 0.01, 0.115, x, 0.55, z), K.woodBS);   // an iron band
    for (const yy of [0.85]) B.add(new THREE.TorusGeometry(0.0125, 0.0045, 5, 10).applyMatrix4(mx(0, 0, 0, 0, Math.PI / 2, 0)), K.ironL, mx(x - sx * 0.052, yy, z));   // the rope's eye bolt
    // the snow banked round the foot
    B.add(new THREE.SphereGeometry(1, 8, 6).applyMatrix4(mx(0, 0, 0, 0, 0, 0, 0.2, 0.07, 0.2)), snowCol, mx(x, 0.02, z));
    if (i < PL.posts - 1) {   // the rope to the next post: a parabola sagging 0.10, 3 strands twisting 9 times a metre
      const z1 = z - PL.postStep, curve = { getPoint(t) { return new THREE.Vector3(x - sx * 0.052, 0.85 - 0.10 * 4 * t * (1 - t), lerp(z, z1, t)); } };
      for (let k = 0; k < 3; k++) {
        const L = PL.postStep, nseg = 190, pts = [];
        for (let j = 0; j <= nseg; j++) { const t = j / nseg, c = curve.getPoint(t), a = (t * L * 9 + k / 3) * TAU, r = 0.0105; pts.push(new THREE.Vector3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z)); }
        const cv = new THREE.CatmullRomCurve3(pts); RB.add(new THREE.TubeGeometry(cv, nseg, 0.0108, 5, false), cmix(K.hemp, k === 1 ? "#d8bc84" : "#8f7646", 0.35 + 0.2 * k));
      }
    }
  }
  const post = new THREE.Mesh(B.geo(), stdMat({ vertexColors: true })); post.castShadow = post.receiveShadow = true; post.userData.solid = false; root.add(post);
  const rope = new THREE.Mesh(RB.geo(), stdMat({ vertexColors: true, roughness: 0.95 })); rope.userData.solid = false; root.add(rope);
  return count;
}

// ---------------------------------------------------------------- the 9 house fronts (+ plaster/timber ground floors, lit framed windows), built facing +z with the front wall at z 0, x -3.3..3.3
function paintFacade(k) {
  const plaster = [0, 3, 5, 7].includes(k % 9) && k % 2 === 0 || k % 3 === 0;   // plaster ground floors on 3 of 9 and on the odd ones in turn
  return mtex(6.6, 4.0, 110, (g, W, Hm) => {
    // ground storey y 0.4..2.4
    if (plaster) {
      g.fillStyle = K.cream; g.fillRect(0, 0, W, 2.4);
      for (let i = 0; i < 90; i++) { const x = H2(k, i) * W, y = 0.4 + 2.0 * H2(k + 30, i), r = 0.05 + 0.2 * H2(k + 60, i), q = g.createRadialGradient(x, y, 0, x, y, r); const c = i % 3 ? "#b9b29c" : "#ece6d4"; q.addColorStop(0, rgba(c, 0.3)); q.addColorStop(1, rgba(c, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
      for (let i = 0; i < 4; i++) { const x = 0.3 + 6 * H2(k, i + 100), y = 0.7 + 1.5 * H2(k, i + 110); g.beginPath(); g.moveTo(x, y); let px = x, py = y; for (let s = 0; s < 6; s++) { px += (H2(i, s + k) - 0.5) * 0.1; py -= 0.06 + 0.07 * H2(s, i + k); g.lineTo(px, py); } g.strokeStyle = rgba("#8a7f6a", 0.5); g.lineWidth = 0.008; g.stroke(); }
    } else {
      for (let c = 0; c < 10; c++) { const y0 = c * 0.2 + 0.4, base = cmul(K.wood, 0.88 + 0.28 * H2(k, c)); g.fillStyle = base; g.fillRect(0, y0, W, 0.2);
        for (let i = 0; i < 12; i++) { const gy = y0 + 0.02 + 0.16 * H2(k * 7 + c, i + 5), x0 = W * H2(k + c, i + 15); g.beginPath(); g.moveTo(x0, gy); g.quadraticCurveTo(x0 + 0.5, gy + 0.01, x0 + 1.0 + 1.2 * H2(c, i), gy - 0.004); g.strokeStyle = rgba(cmul(base, 0.7), 0.6); g.lineWidth = 0.004; g.stroke(); }
        for (let i = 0; i < 8; i++) { const kx = (i + 0.15 + 0.7 * H2(k * 7 + c, i)) * 0.8, ky = y0 + 0.04 + 0.12 * H2(k + c, i + 20); g.beginPath(); g.ellipse(kx, ky, 0.02, 0.011, 0, 0, TAU); g.fillStyle = rgba(cmul(base, 0.55), 0.8); g.fill(); }
        g.fillStyle = rgba(K.lime, 0.9); g.fillRect(0, y0 - 0.004, W, 0.008); g.fillStyle = rgba("#1a0e06", 0.45); g.fillRect(0, y0 - 0.012, W, 0.008); }
    }
    // the plinth, rubble stone 0..0.4
    g.fillStyle = K.stoneS; g.fillRect(0, 0, W, 0.4);
    for (let r = 0; r < 3; r++) { let x = -0.1 * r; while (x < W) { const w = 0.2 + 0.25 * H2(k * 5 + r, Math.floor(x * 10)); g.fillStyle = cmul(cmix(K.stone, K.stoneL, H2(r, Math.floor(x * 7) + k) * 0.6), 0.9); g.beginPath(); g.roundRect ? g.roundRect(x + 0.01, r * 0.133 + 0.01, w - 0.02, 0.113, 0.03) : g.rect(x + 0.01, r * 0.133 + 0.01, w - 0.02, 0.113); g.fill(); x += w; } }
    g.fillStyle = rgba("#000", 0.25); g.fillRect(0, 0.4, W, 0.04);
    // the upper storey y 2.4..4.0: boards 0.18 wide, sun-burnt, 3 pale repair boards
    const nb = Math.ceil(W / 0.18), rep = [3 + Math.floor(H2(k, 1) * 9), 14 + Math.floor(H2(k, 2) * 9), 26 + Math.floor(H2(k, 3) * 9)];
    for (let b = 0; b < nb; b++) { const x0 = b * 0.18, r = rep.indexOf(b), base = r >= 0 ? cmul(K.repair, 0.92 + 0.15 * H2(k, b)) : cmul(K.woodB, 0.85 + 0.5 * H2(k, b + 9)), y0 = r > 0 ? 2.4 + 0.2 + 0.4 * H2(k, b + 4) : 2.4, y1 = r > 0 ? y0 + 0.7 + 0.5 * H2(k, b + 5) : 4.0;
      g.fillStyle = cmul(K.woodB, 0.85 + 0.5 * H2(k, b + 9)); g.fillRect(x0, 2.4, 0.18, 1.6); g.fillStyle = base; g.fillRect(x0, y0, 0.18, Math.min(4.0, y1) - y0);
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0 + 0.03 + 0.04 * i, y0); g.lineTo(x0 + 0.03 + 0.04 * i + (H2(b, i) - 0.5) * 0.01, Math.min(4.0, y1)); g.strokeStyle = rgba(cmul(base, 0.6), 0.5); g.lineWidth = 0.004; g.stroke(); }
      g.fillStyle = rgba("#0a0604", 0.85); g.fillRect(x0 - 0.003, 2.4, 0.006, 1.6); g.fillStyle = rgba("#f0c890", 0.08); g.fillRect(x0 + 0.01, 2.4, 0.02, 1.6); }
    g.fillStyle = K.woodS; g.fillRect(0, 2.38, W, 0.06);   // the storey beam
    // the door: arch 0.95 x 1.7 at x 3.3 (planks), a pine tree / heart cut in the lintel
    g.fillStyle = "#2a1a0e"; g.fillRect(2.78, 0.4, 1.04, 1.9); g.fillStyle = cmul(K.wood, 0.75 + 0.2 * H2(k, 55)); g.fillRect(2.83, 0.4, 0.94, 1.7);
    for (let p = 1; p < 5; p++) { g.fillStyle = rgba("#1a0e06", 0.7); g.fillRect(2.83 + p * 0.188 - 0.004, 0.4, 0.008, 1.7); }
    g.fillStyle = K.woodS; g.fillRect(2.78, 2.1, 1.04, 0.2);
    g.fillStyle = cmix(K.snowW, "#ffd9a0", 0.5); g.beginPath(); const c0 = 3.3, cy = 2.2; if (k % 3 === 0) { for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, x = c0 + 0.07 * 16 * Math.sin(a) ** 3 / 16 * 2.2 * 0.9, y = cy + 0.065 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 13 * 2.4; i ? g.lineTo(x, y) : g.moveTo(x, y); } } else { g.moveTo(c0, cy + 0.08); g.lineTo(c0 + 0.07, cy - 0.05); g.lineTo(c0 - 0.07, cy - 0.05); } g.closePath(); g.fillStyle = rgba(K.flame, 0.85); g.fill();
    // lantern bracket mark and a boot scraper
    g.fillStyle = K.iron; g.fillRect(2.45, 0.6, 0.26, 0.05);
    // the balcony door in the upper boards (closed, dark wood)
    g.fillStyle = "#2a1a0e"; g.fillRect(2.88, 2.5, 0.84, 1.45); g.fillStyle = cmul(K.wood, 0.7); g.fillRect(2.93, 2.55, 0.74, 1.35); g.fillStyle = rgba("#0a0604", 0.7); g.fillRect(3.3 - 0.004, 2.55, 0.008, 1.35);
  }, `facade${k}`, 8);
}
function windowParts(B, SN, x, y, w, h, shut, k, upper) {   // one window at (x, y) centre on the front wall: frame, mullions, shutters, sill with snow; the glass into G
  const wd = 0.09;
  B.add(boxG(w + 2 * wd, wd, 0.1, x, y + h / 2 + wd / 2, 0.05), K.wood); B.add(boxG(wd, h, 0.1, x - w / 2 - wd / 2, y, 0.05), K.wood); B.add(boxG(wd, h, 0.1, x + w / 2 + wd / 2, y, 0.05), K.wood);
  B.add(boxG(w + 2 * wd + 0.12, 0.05, 0.16, x, y - h / 2 - 0.025, 0.08), (px, py, pz, nx, ny) => cmix(K.woodS, K.woodLit, clamp(ny) * 0.6));
  B.add(boxG(0.025, h, 0.04, x, y, 0.03), K.woodS); B.add(boxG(w, 0.025, 0.04, x, y, 0.03), K.woodS);
  for (const s of [-1, 1]) { const sx = x + s * (w / 2 + wd + 0.2); B.add(boxG(0.4, h + 0.1, 0.04, sx, y, 0.03), shut);   // the shutters folded back flat on the wall
    for (let r = 0; r < 5; r++) B.add(boxG(0.34, 0.012, 0.012, sx, y - h / 2 + 0.12 + r * (h - 0.1) / 4.4, 0.055), cmul(shut, 0.6)); }
  SN.add(snowSlab(w + 0.3, 0.2, upper ? 0.05 : 0.06, k * 7 + Math.round(x * 3)), snowCol, mx(x, y - h / 2 + 0.0, 0.0));
}
function buildHouse(k, parent, c) {
  const B = new Bake(), SN = new Bake(), root = new THREE.Group(); parent.add(root);
  const lit = PL.lit[k], shut = SHUT[k];
  const fm = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.0, 6.4).translate(0, 2.0, -3.2), [stdMat({ color: K.woodB }), stdMat({ color: K.woodB }), stdMat({ color: "#ffffff" }), stdMat({ color: K.woodB }), stdMat({ map: paintFacade(k), roughness: 0.92 }), stdMat({ color: K.woodB })]);
  fm.material[2].color.set(K.snow); fm.castShadow = fm.receiveShadow = true; fm.userData.solid = false; root.add(fm);
  // the roof: ridge along x at y 5.16 (z -3.2), slope 20 degrees, overhang to z +0.9; the front slab, its boards, rafter tails, fascia, snow 0.45
  const th = 20 * DEG, ridgeY = 5.16, ridgeZ = -3.2, L = (0.95 - ridgeZ) / Math.cos(th), slabQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(th, 0, 0));   // the slab runs down the slope toward +z
  const roofM = new THREE.Matrix4().compose(new THREE.Vector3(0, ridgeY, ridgeZ), slabQ, new THREE.Vector3(1, 1, 1));
  { const rt = cvs(512, 256, (g, w, h) => { g.fillStyle = "#3a2c28"; g.fillRect(0, 0, w, h); for (let r = 0; r < 12; r++) for (let i = 0; i < 28; i++) { const x = (i + (r % 2) * 0.5) * (w / 27), y = r * (h / 12); g.fillStyle = cmul(K.shingle, 0.7 + 0.5 * H2(k * 9 + r, i)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 27, y); g.lineTo(x + w / 27, y + h / 12 - 2); g.quadraticCurveTo(x + w / 54, y + h / 12 + 4, x, y + h / 12 - 2); g.closePath(); g.fill(); g.strokeStyle = "#1a120c"; g.lineWidth = 1.2; g.stroke(); } }, `roof${k}`);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.09, L).applyMatrix4(mx(0, -0.045, L / 2).premultiply(roofM)), [stdMat({ color: K.woodS }), stdMat({ color: K.woodS }), stdMat({ map: rt, roughness: 0.9 }), stdMat({ color: K.woodS }), stdMat({ color: K.woodS }), stdMat({ color: K.woodS })]); slab.castShadow = true; slab.userData.solid = false; root.add(slab); }
  SN.add(snowSlab(7.5, L * 0.93, 0.45, k * 3.3), snowCol, roofM.clone().multiply(mx(0, 0.0, L * 0.05)));
  SN.add(snowSlab(7.5, 0.7, 0.2, k + 11), snowCol, mx(0, ridgeY + 0.05, ridgeZ - 0.35));   // the ridge cap
  B.add(boxG(7.8, 0.14, 0.14, 0, ridgeY, ridgeZ), K.woodS);
  { const ez = 0.95, ey = ridgeY - (ez - ridgeZ) * Math.tan(th); B.add(boxG(7.8, 0.2, 0.05, 0, ey - 0.12, ez + 0.0, th, 0, 0), K.woodB); for (let i = 0; i < 11; i++) B.add(boxG(0.08, 0.1, 0.45, -3.6 + i * 0.72, ey - 0.2, ez - 0.3, th, 0, 0), K.woodS);   // the fascia and 11 rafter tails
    const ic = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6, 1).rotateX(Math.PI).translate(0, -0.5, 0), noLine(stdMat({ color: K.ice, roughness: 0.25, emissive: new THREE.Color("#7fb6dc"), emissiveIntensity: 0.28 })), 26), d = new THREE.Object3D();
    for (let i = 0; i < 26; i++) { const Li = 0.1 + 0.3 * H2(k * 31 + i, 5) ** 1.5; d.position.set(-3.75 + 7.5 * (i + 0.5 * H2(k, i)) / 26, ey - 0.3, ez + 0.0); d.scale.set(0.014 + 0.012 * H2(k + i, 6), Li, 0.014 + 0.012 * H2(k + i, 6)); d.updateMatrix(); ic.setMatrixAt(i, d.matrix); } ic.userData.solid = false; ic.frustumCulled = false; root.add(ic); c.icicles += 26; }
  // the balcony: floor at y 2.4 (1.0 deep), 20 balusters, a top rail with 0.10 of snow
  B.add(boxG(6.6, 0.09, 0.9, 0, 2.38, 0.45), K.wood); B.add(boxG(6.6, 0.06, 0.06, 0, 3.25, 0.85), K.wood); B.add(boxG(6.6, 0.05, 0.05, 0, 2.52, 0.85), K.wood);
  for (let i = 0; i < 20; i++) B.add(boxG(0.03, 0.7, 0.03, -3.15 + i * 0.3316, 2.9, 0.85), K.woodLit);
  for (const x of [-3.25, 3.25]) B.add(boxG(0.1, 0.9, 0.1, x, 2.85, 0.85), K.woodS);
  SN.add(snowSlab(6.5, 0.14, 0.10, k * 5), snowCol, mx(0, 3.28, 0.78));
  // the windows: 2 on the ground floor, 2 upstairs, and a 5th (a dormer) on 2 houses; `lit` of them are lit
  const wins = [[-1.9, 1.62, 0.8, 0.9, 0], [1.9, 1.62, 0.8, 0.9, 0], [-2.0, 3.3, 0.7, 0.8, 1], [1.9, 3.3, 0.7, 0.8, 1]]; if (lit === 5) wins.push([-1.02, 1.95, 0.34, 0.5, 0]);
  wins.forEach(([x, y, w, h, up], i) => { const isLit = i < lit; windowParts(B, SN, x, y, w, h, shut, k, up === 1); c.windows++; if (isLit) c.litWindows++; });
  // glass: one baked mesh a house, lit panes warm
  { const GB = new Bake(); const mk = (x, y, w, h) => GB.add(new THREE.PlaneGeometry(w, h), (px, py) => cmix(K.core, K.flameS, clamp(Math.hypot(px - x, (py - y) * 0.7) * 1.4)), mx(x, y, 0.02));
    wins.forEach(([x, y, w, h], i) => { if (i < lit) mk(x, y, w, h); else GB.add(new THREE.PlaneGeometry(w, h), "#1a2038", mx(x, y, 0.02)); });
    const gm = new THREE.Mesh(GB.geo(), noLine(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false }))); gm.userData.solid = false; root.add(gm);
    // the glow spilling from each lit window onto the wall and the snow: an additive card, warm
    wins.forEach(([x, y, w, h], i) => { if (i >= lit) return; const gl = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, h * 2.2), glowMat(GLOW(), K.flameS, 0.22)), 2); gl.position.set(x, y, 0.09); root.add(gl); }); }
  // the lantern at the door: iron bracket, glass box, a painted flame and its glow; a pool on the apron
  { const lx = k % 2 ? -0.8 : 0.8; B.add(boxG(0.24, 0.03, 0.03, 3.3 + lx * 0.35 - 0.0, 1.92, 0.14), K.ironL); B.add(boxG(0.14, 0.2, 0.14, 3.3 + lx, 1.72, 0.18), K.iron); }
  const fl = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.3), softMat({ map: once("krFlame", () => cvs(64, 96, (g, w, h) => { const q = g.createRadialGradient(w / 2, h * 0.65, 2, w / 2, h * 0.65, h * 0.5); q.addColorStop(0, K.core); q.addColorStop(0.4, K.flame); q.addColorStop(1, "rgba(255,154,58,0)"); g.fillStyle = q; g.beginPath(); g.moveTo(w / 2, 4); g.quadraticCurveTo(w * 0.95, h * 0.6, w / 2, h * 0.92); g.quadraticCurveTo(w * 0.05, h * 0.6, w / 2, 4); g.fill(); }, "flame", 1)), blending: THREE.AdditiveBlending })), 4); fl.position.set(3.3 + (k % 2 ? -0.8 : 0.8), 1.74, 0.27); root.add(fl);
  const glw = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), glowMat(GLOW(), K.flameS, 0.4)), 2); glw.position.set(3.3 + (k % 2 ? -0.8 : 0.8), 1.74, 0.3); root.add(glw);
  const pool = steamy(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), glowMat(POOL(), K.pool, 0.35)), 1); pool.rotation.x = -Math.PI / 2; pool.position.set(3.3 + (k % 2 ? -0.8 : 0.8), 0.03, 1.8); root.add(pool);
  // snow banked on the plinth, chimney
  SN.add(snowSlab(6.6, 0.55, 0.25, k * 2.1), snowCol, mx(0, 0.0, 0.0, 0, 0, 0));
  B.add(boxG(0.8, 1.4, 0.8, -1.8, ridgeY + 0.5, ridgeZ - 0.6), cmix(K.stone, K.stoneS, 0.3)); SN.add(snowSlab(0.9, 0.9, 0.12, k), snowCol, mx(-1.8, ridgeY + 1.2, ridgeZ - 1.05));
  const hm = new THREE.Mesh(B.geo(), stdMat({ vertexColors: true })); hm.castShadow = true; hm.userData.solid = false; root.add(hm);
  const sm_ = new THREE.Mesh(SN.geo(), noLine(stdMat({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }))); sm_.userData.solid = false; root.add(sm_);
  return root;
}

// ---------------------------------------------------------------- the church: white plaster, the tower 26 m with a copper-green onion dome under snow, no clock, a lit round window with 8 spokes
function buildChurch(root, c) {
  const g = new THREE.Group(); g.position.set(PL.churchX, 0, PL.churchZ); root.add(g);
  const B = new Bake(), SN = new Bake();
  const plasterTex = (w, h, seed) => mtex(w, h, 40, (q, W, Hm) => { q.fillStyle = K.plaster; q.fillRect(0, 0, W, Hm); for (let i = 0; i < 160; i++) { const x = H2(seed, i) * W, y = H2(seed + 9, i) * Hm, r = 0.2 + 0.8 * H2(seed + 19, i), gr = q.createRadialGradient(x, y, 0, x, y, r); const cc = i % 3 ? "#bdb6a2" : "#ffffff"; gr.addColorStop(0, rgba(cc, 0.22)); gr.addColorStop(1, rgba(cc, 0)); q.fillStyle = gr; q.fillRect(x - r, y - r, 2 * r, 2 * r); }
    q.fillStyle = rgba("#8a7f6a", 0.5); q.fillRect(0, 0, W, 0.5); for (let s = 0; s < 6; s++) { q.fillStyle = rgba(K.stoneL, 0.8); q.fillRect(0, 0, 0.5, Hm); q.fillRect(W - 0.5, 0, 0.5, Hm); } }, `plaster${seed}`, 4);
  const sideM = stdMat({ map: plasterTex(5, 17, 1), roughness: 0.95 });
  // the tower: 5 x 5 shaft to y 17; the lit round window on +z at y 11, 2 louvred openings in the belfry (y 17..21.5), a cornice, a short hip, the onion dome to 26.3
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(5, 17, 5).translate(0, 8.5, 0), [sideM, sideM, sideM, sideM, stdMat({ map: plasterTex(5, 17, 2), roughness: 0.95 }), sideM]); shaft.castShadow = true; shaft.userData.solid = false; g.add(shaft);
  const belf = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.5, 4.4).translate(0, 19.25, 0), stdMat({ map: plasterTex(4.4, 4.5, 3), roughness: 0.95 })); belf.userData.solid = false; g.add(belf);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let q = 0; q < 31; q++) B.add(boxG(q % 2 ? 0.5 : 0.75, 0.5, q % 2 ? 0.75 : 0.5, sx * 2.5, 0.55 + q * 0.55, sz * 2.5), cmix(K.stoneL, K.stone, H2(q, sx * 3 + sz) * 0.5));   // 124 quoin stones up the 4 corners
  for (const y of [5.5, 13.2, 15.5]) B.add(boxG(5.2, 0.14, 5.2, 0, y, 0), K.stoneL);   // string courses
  B.add(boxG(5.4, 0.3, 5.4, 0, 17.05, 0), K.stoneL); B.add(boxG(5.0, 0.2, 5.0, 0, 21.6, 0), K.stoneL); B.add(boxG(5.0, 0.3, 5.0, 0, 0.15, 0), K.stoneS);
  SN.add(snowSlab(5.4, 1.0, 0.18, 3), snowCol, mx(0, 17.2, 2.2)); SN.add(snowSlab(5.0, 0.7, 0.12, 4), snowCol, mx(0, 21.7, 2.1));
  // the round window: a stone ring, 8 spokes, lit, with a glow card
  const wy = 11, wr = 1.0;
  B.add(new THREE.TorusGeometry(wr + 0.12, 0.12, 8, 40), K.stoneL, mx(0, wy, 2.52)); for (let i = 0; i < 4; i++) B.add(boxG(0.07, 2 * wr, 0.07), K.stoneL, mx(0, wy, 2.52, 0, 0, (i / 4) * Math.PI)); B.add(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12).rotateX(Math.PI / 2), K.stoneL, mx(0, wy, 2.53));   // 8 spokes: 4 diameters and a hub
  const disk = new THREE.Mesh(new THREE.CircleGeometry(wr, 40), noLine(new THREE.MeshBasicMaterial({ map: once("krRose", () => radial([[0, K.core], [0.5, K.win], [1, K.flameS]], 128)), toneMapped: false, fog: false }))); disk.position.set(0, wy, 2.505); g.add(disk);
  const gl = steamy(new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMat(GLOW(), K.flameS, 0.35)), 2); gl.position.set(0, wy, 2.7); g.add(gl); c.churchWin++;
  // the louvred openings: two arches 1.0 x 2.0 side by side on +z of the belfry, 9 slats each
  for (const x of [-1.1, 1.1]) { const op = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), noLine(new THREE.MeshBasicMaterial({ color: "#0c0f1e", toneMapped: false }))); op.position.set(x, 19.2, 2.21); g.add(op);
    B.add(new THREE.TorusGeometry(0.5, 0.07, 6, 14, Math.PI), K.stoneL, mx(x, 19.9, 2.24)); B.add(boxG(0.14, 2.0, 0.1, x - 0.57, 19.2, 2.22), K.stoneL); B.add(boxG(0.14, 2.0, 0.1, x + 0.57, 19.2, 2.22), K.stoneL);
    for (let s = 0; s < 9; s++) B.add(boxG(0.94, 0.06, 0.18, x, 18.3 + s * 0.2, 2.18, -0.5, 0, 0), K.woodS); SN.add(snowSlab(1.2, 0.2, 0.05, x), snowCol, mx(x, 18.15, 2.2)); }
  // the pyramid hip and the onion dome (a lathe, copper green with 16 seams, snow on the shoulder and a ring on the base)
  B.add(new THREE.ConeGeometry(3.1, 0.8, 4, 1).applyMatrix4(mx(0, 0.4, 0, 0, Math.PI / 4, 0)), K.copperS, mx(0, 21.7, 0));
  const prof = [[0, 0], [2.3, 0], [2.7, 0.35], [3.05, 0.95], [3.0, 1.5], [2.5, 2.05], [1.7, 2.6], [0.95, 3.05], [0.5, 3.45], [0.22, 3.85], [0.12, 4.15], [0, 4.4]].map(([r, y]) => new THREE.Vector2(r * 0.85, y * 0.8));
  const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), stdMat({ map: once("krDome", () => mtex(4, 4.4, 80, (q, W, Hm) => { const gr = q.createLinearGradient(0, 0, 0, Hm); gr.addColorStop(0, K.copperS); gr.addColorStop(0.5, K.copper); gr.addColorStop(1, K.copperL); q.fillStyle = gr; q.fillRect(0, 0, W, Hm); for (let i = 0; i < 16; i++) { q.fillStyle = rgba(K.copperS, 0.8); q.fillRect(i * (W / 16) - 0.01, 0, 0.02, Hm); } for (let i = 0; i < 300; i++) { q.fillStyle = rgba(i % 2 ? "#a8d8c4" : "#2f5a50", 0.18); q.fillRect(H2(i, 5) * W, H2(i, 6) * Hm, 0.04, 0.08); } }, "dome", 4)), roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide })); dome.position.y = 22.3; dome.castShadow = true; dome.userData.solid = false; g.add(dome);
  B.add(new THREE.SphereGeometry(0.16, 10, 8), "#e9c868", mx(0, 25.95, 0)); B.add(new THREE.ConeGeometry(0.06, 0.8, 6), "#e9c868", mx(0, 26.35, 0));   // the finial ball and spike
  SN.add(new THREE.TorusGeometry(2.0, 0.13, 7, 24).applyMatrix4(mx(0, 0, 0, Math.PI / 2, 0, 0)), snowCol, mx(0, 22.55, 0));
  // the nave behind the tower: x 2.5..14.5, 8 wide, 7 high, a ridge roof along x at 11; 4 arched lit windows on +z, a porch buttress each end
  const nave = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 8).translate(8.5, 3.5, -0.5), [sideM, sideM, sideM, sideM, stdMat({ map: plasterTex(12, 7, 5), roughness: 0.95 }), sideM]); nave.castShadow = true; nave.userData.solid = false; g.add(nave);
  const rise = 3.4, ra = Math.atan2(rise, 4.6);
  for (const s of [1, -1]) { const sl = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.14, Math.hypot(4.6, rise) + 0.5).translate(0, 0, 0), stdMat({ color: K.shingle })); sl.position.set(8.5, 7 + rise / 2 + 0.1, -0.5 + s * 2.4); sl.rotation.x = -s * ra * -1; sl.castShadow = true; sl.userData.solid = false; g.add(sl);
    if (s > 0) SN.add(snowSlab(12.4, 4.7, 0.4, 7), snowCol, new THREE.Matrix4().compose(new THREE.Vector3(8.5, 7 + rise, -0.5 + 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(ra, 0, 0)), new THREE.Vector3(1, 1, 1))); }
  for (let i = 0; i < 4; i++) { const x = 5.6 + i * 2.9, y = 3.6; const arch = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape().moveTo(-0.5, -1.2).lineTo(0.5, -1.2).lineTo(0.5, 0.7).absarc(0, 0.7, 0.5, 0, Math.PI, false).lineTo(-0.5, -1.2)), noLine(new THREE.MeshBasicMaterial({ color: K.win, toneMapped: false })));
    arch.position.set(x, y, 3.52); g.add(arch); B.add(boxG(0.06, 2.6, 0.04, x, y - 0.1, 3.53), K.woodS); B.add(boxG(1.0, 0.06, 0.04, x, y + 0.2, 3.53), K.woodS); B.add(boxG(1.3, 0.12, 0.2, x, y - 1.28, 3.58), K.stoneL);
    const gw = steamy(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), glowMat(GLOW(), K.flameS, 0.22)), 2); gw.position.set(x, y, 3.8); g.add(gw); c.churchWin++; }
  const bm = new THREE.Mesh(B.geo(), stdMat({ vertexColors: true })); bm.castShadow = true; bm.userData.solid = false; g.add(bm);
  const sn = new THREE.Mesh(SN.geo(), noLine(stdMat({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }))); sn.userData.solid = false; g.add(sn);
  return g;
}

// ---------------------------------------------------------------- the fir 7 m with 90 warm bulbs
function buildFir(root) {
  const fg = firGeometry(), cp = fg.attributes.aCol; fg.setAttribute("color", new THREE.BufferAttribute(cp.array.slice(), 3)); fg.deleteAttribute("aCol");
  const fir = new THREE.Mesh(fg, stdMat({ vertexColors: true, roughness: 0.95 })); fir.position.set(PL.firX, 0, PL.firZ); fir.scale.set(PL.firH * 0.34, PL.firH, PL.firH * 0.34); fir.castShadow = true; fir.userData.solid = false; root.add(fir);
  const bulbs = [], N = PL.bulbs;
  for (let i = 0; i < N; i++) { const u = i / (N - 1), y = 1.5 + u * 4.9, rr = Math.max(0.12, 2.2 * (1 - (y - 1.3) / 5.9) * (0.85 + 0.15 * Math.cos(y * 3.8))) + 0.12, a = u * 7 * TAU; bulbs.push([PL.firX + Math.cos(a) * rr, y, PL.firZ + Math.sin(a) * rr]); }
  const core = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), noLine(new THREE.MeshBasicMaterial({ color: "#ffe0a0", toneMapped: false, fog: false })), N), d = new THREE.Object3D();
  bulbs.forEach((b, i) => { d.position.set(...b); d.updateMatrix(); core.setMatrixAt(i, d.matrix); }); core.userData.solid = false; core.frustumCulled = false; root.add(core);
  const pos = new Float32Array(N * 3); bulbs.forEach((b, i) => pos.set(b, i * 3)); const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, noLine(new THREE.PointsMaterial({ map: GLOW(), size: 0.55, color: K.flame, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.8 }))); pts.frustumCulled = false; steamy(pts, 4); root.add(pts);
  const pool = steamy(new THREE.Mesh(new THREE.PlaneGeometry(9, 9), glowMat(POOL(), K.pool, 0.22)), 1); pool.rotation.x = -Math.PI / 2; pool.position.set(PL.firX, 0.03, PL.firZ); root.add(pool);
  return { N };
}

// ---------------------------------------------------------------- the sky: dome, 420 stars, the painted moon up the lane, the hero peak ring; all follow the camera
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent; if (!s.isScene) return false;
  if (!s.userData.krRunHooks) { const list = (s.userData.krRunHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function () { if (prev) prev.apply(this, arguments); const cam = arguments[2]; for (const f of list) f(cam); }; }
  s.userData.krRunHooks.add(fn); return true;
}
function buildSky(root) {
  const sk = new THREE.Group(); root.add(sk); const R = 250;
  { const g = new THREE.SphereGeometry(R, 40, 24), p = g.attributes.position, col = new Float32Array(p.count * 3), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const e = Math.asin(clamp(p.getY(i) / R, -1, 1)) / (Math.PI / 2); t.set(cmix(K.sky1, K.sky0, sm(e * 1.6))); col.set([t.r, t.g, t.b], i * 3); }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); const m = new THREE.Mesh(g, noLine(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false, depthWrite: false }))); m.renderOrder = -10; m.frustumCulled = false; m.userData.solid = false; sk.add(m); }
  // the ring of peaks: three ridges and the hero peak, snow caught by the moon on their up-lane faces
  { const tex = cvs(2048, 256, (g, w, h) => { g.clearRect(0, 0, w, h);
      const ridge = (seed, base, amp, col, snow) => { g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) { const u = x / w; let y = base + amp * (0.55 * Math.sin(u * 23 + seed) + 0.3 * Math.sin(u * 61 + seed * 2) + 0.2 * Math.sin(u * 137 + seed * 3)); const hero = Math.exp(-(((u - 0.46) / 0.05) ** 2)); y -= hero * 120 * (seed < 2 ? 1 : 0); g.lineTo(x, h - y); } g.lineTo(w, h); g.closePath(); g.fillStyle = col; g.fill(); if (snow) { g.strokeStyle = snow; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= w; x += 4) { const u = x / w; let y = base + amp * (0.55 * Math.sin(u * 23 + seed) + 0.3 * Math.sin(u * 61 + seed * 2) + 0.2 * Math.sin(u * 137 + seed * 3)); y -= Math.exp(-(((u - 0.46) / 0.05) ** 2)) * 120 * (seed < 2 ? 1 : 0); x ? g.lineTo(x, h - y) : g.moveTo(x, h - y); } g.stroke(); } };
      ridge(1, 150, 40, "#34457d", "#8fa6d8"); ridge(2, 95, 30, "#283566", "#6f86be"); ridge(3, 55, 20, "#1b2650", null); }, "krPeaks", 4);
    const R2 = 240, hgt = 60, arc = 150 * DEG, geo = new THREE.CylinderGeometry(R2, R2, hgt, 64, 1, true, Math.PI - arc / 2, arc);   // centred on -z
    const m = new THREE.Mesh(geo, noLine(new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, toneMapped: false, fog: false, depthWrite: false }))); m.position.y = 20; m.renderOrder = -9; m.frustumCulled = false; m.userData.solid = false; m.scale.x = -1; sk.add(m); sk.userData.ring = m; }
  // 420 stars (260 of 1 px, 110 of 1.5, 50 of 2.5), weighted up the lane
  { const dot = radial([[0, "rgba(255,255,255,1)"], [0.5, "rgba(255,255,255,0.8)"], [1, "rgba(255,255,255,0)"]], 16); let n0 = 0;
    for (const [n, px] of [[260, 1], [110, 1.5], [50, 2.5]]) { const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const s = n0 + i, az = (H2(s, 3) < 0.6 ? 180 + (H2(s, 4) - 0.5) * 120 : H2(s, 4) * 360) * DEG, el = (5 + 75 * Math.pow(H2(s, 5), 0.8)) * DEG, r = R - 3, b = 0.55 + 0.45 * H2(s, 6); pos.set([Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r], i * 3); col.set([b, b, b], i * 3); }
      n0 += n; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const pt = new THREE.Points(g, noLine(new THREE.PointsMaterial({ map: dot, size: px * 1.5, sizeAttenuation: false, vertexColors: true, color: K.star, transparent: true, depthWrite: false, toneMapped: false, fog: false }))); pt.frustumCulled = false; pt.renderOrder = -8; steamy(pt, -8); sk.add(pt); } }
  // the moon: 14 degrees left of up the lane, 27 up (up the lane is -z)
  { const az = (180 + 14) * DEG, el = 27 * DEG, d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], sz = 2 * 245 * Math.tan(4.5 * DEG);
    const tex = cvs(256, 256, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); q.addColorStop(0, "rgba(233,238,252,0.55)"); q.addColorStop(0.4, "rgba(185,205,245,0.25)"); q.addColorStop(1, "rgba(185,205,245,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h);
      g.beginPath(); g.arc(w / 2, h / 2, 54, 0, TAU); g.fillStyle = "#f3f0e2"; g.fill(); for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(w / 2 + (H2(i, 8) - 0.5) * 70, h / 2 + (H2(i, 9) - 0.5) * 70, 4 + 8 * H2(i, 10), 0, TAU); g.fillStyle = "rgba(190,196,214,0.5)"; g.fill(); } g.beginPath(); g.arc(w / 2 + 10, h / 2 + 6, 54, 0, TAU); g.fillStyle = "rgba(14,22,48,0.0)"; g.fill(); }, "moon", 4);
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), softMat({ map: tex })); mm.position.set(d[0] * 245, d[1] * 245, d[2] * 245); mm.lookAt(0, 0, 0); mm.renderOrder = -7; mm.userData.solid = false; mm.frustumCulled = false; sk.add(mm); }
  return sk;
}

// ---------------------------------------------------------------- the front onlookers: potato people with Spud's skin (#e2a95c), eggs 0.62-0.92 tall, coats in 7 colours with 2 toggles, 5-stripe scarves, bobble hats, mittens
const ik3 = (h, f, L1, L2, pole) => {
  const d = [f[0] - h[0], f[1] - h[1], f[2] - h[2]], dl = Math.hypot(...d) || 1e-6, u = d.map((v) => v / dl), dd = clamp(dl, Math.abs(L1 - L2) + 0.005, (L1 + L2) * 0.999), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), hh_ = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2]; let p = [pole[0] - pd * u[0], pole[1] - pd * u[1], pole[2] - pd * u[2]]; const pl = Math.hypot(...p) || 1; p = p.map((v) => v / pl);
  return { E: [h[0] + u[0] * a + p[0] * hh_, h[1] + u[1] * a + p[1] * hh_, h[2] + u[2] * a + p[2] * hh_], F: [h[0] + u[0] * dd, h[1] + u[1] * dd, h[2] + u[2] * dd] };
};
const Y_UP = new THREE.Vector3(0, 1, 0);
function limbPlace(o, a, b) { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length() || 1e-6; o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(Y_UP, d.normalize()); o.scale.y = L; }
function paintPhone() { return once("krPhone", () => cvs(64, 128, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "#3a2a24"); q.addColorStop(1, "#1a1418"); g.fillStyle = q; g.fillRect(0, 0, w, h); const gl = g.createRadialGradient(w / 2, h * 0.5, 2, w / 2, h * 0.5, w); gl.addColorStop(0, "#ffb060"); gl.addColorStop(1, "#5a2a14"); g.fillStyle = gl; g.fillRect(3, 3, w - 6, h - 6);
  g.fillStyle = "#1a0e0a"; g.beginPath(); g.arc(w / 2, h * 0.5, 9, 0, TAU); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 5, h * 0.5 - 7); g.quadraticCurveTo(w / 2 + s * 12, h * 0.5 - 15, w / 2 + s * 9, h * 0.5 - 22); g.quadraticCurveTo(w / 2 + s * 5, h * 0.5 - 14, w / 2 + s * 2, h * 0.5 - 8); g.fill(); }   // a horned dot
  g.fillStyle = "#ffd890"; for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * 3.5, h * 0.5 - 2, 1.6, 0, TAU); g.fill(); } }, "phone", 2)); }
function buildFigure(f, parent, c) {
  const s = f.H / 0.85, g = new THREE.Group(); g.position.set(f.x, 0, f.z); g.rotation.y = f.side > 0 ? -Math.PI / 2 : Math.PI / 2; if (f.role === "rider") g.position.y = 0; parent.add(g);
  const B = new Bake(), warm = [1.22, 1.0, 0.8], cool = [0.7, 0.8, 1.08], tint = (hex, nz) => { const k = sm((nz + 0.3) / 1.0), A = hexA(hex); return toHex([0, 1, 2].map((i) => A[i] * lerp(cool[i], warm[i], k))); };
  const vc = (hex, f2 = 1) => (x, y, z, nx, ny, nz) => tint(cmul(hex, f2 * (0.92 + 0.16 * clamp(ny * 0.5 + 0.5))), nz);
  const put = (geo, hex, M, f2) => B.add(geo, vc(hex, f2), M);
  const rx = 0.34 * s, ry = 0.40 * s, rz = 0.31 * s, cy = 0.44 * s;
  // the potato: lumpy egg
  { const e = new THREE.SphereGeometry(1, 20, 14), p = e.attributes.position; for (let i = 0; i < p.count; i++) { const kk = 1 + 0.06 * (H2(Math.round(p.getX(i) * 30) + f.n * 7, Math.round(p.getY(i) * 30) * 3 + Math.round(p.getZ(i) * 30)) - 0.5); p.setXYZ(i, p.getX(i) * kk, p.getY(i) * kk, p.getZ(i) * kk); } e.computeVertexNormals(); put(e, K.skin, mx(0, cy, 0, 0, 0, 0, rx, ry, rz), 1.0); }
  // the coat: a shell over the lower 60 %, a hem band, 2 toggles on 2 loops, a collar roll
  put(new THREE.SphereGeometry(1.07, 20, 11, 0, TAU, 1.45, Math.PI - 1.45), f.coat, mx(0, cy, 0, 0, 0, 0, rx, ry, rz));
  { const hy = 0.16 * s, k = Math.sqrt(Math.max(0.05, 1 - ((hy - cy) / (1.07 * ry)) ** 2)); put(new THREE.TorusGeometry(1, 0.02 * s, 6, 24), cmul(f.coat, 0.7), mx(0, hy, 0, Math.PI / 2, 0, 0, 1.07 * rx * k, 1.07 * rz * k, 1)); }   // the hem band hugs the coat
  for (const ty of [0.34, 0.2]) { put(new THREE.CylinderGeometry(0.014 * s, 0.014 * s, 0.05 * s, 7), "#e8d8b0", mx(0, ty * s, rz * 1.02 + 0.012 * s, 0, 0, Math.PI / 2)); put(new THREE.TorusGeometry(0.02 * s, 0.004 * s, 4, 8), "#4a2a14", mx(0, ty * s, rz * 1.04, 0, 0, 0)); }
  // the scarf: 5 stripes (5 rings), and a hanging tail of 5 stripes
  const sc = Array.from({ length: 5 }, (_, i) => SCARF[(f.scarf + i * 2) % 7]);
  sc.forEach((col, i) => put(new THREE.TorusGeometry(0.335 * s, 0.03 * s, 6, 18), col, mx(0, (0.5 - 0.012 * i) * s, 0.0, Math.PI / 2, 0, 0, 1 + 0.012 * i, 0.92 + 0.012 * i, 1)));
  sc.forEach((col, i) => put(new THREE.BoxGeometry(0.085 * s, 0.05 * s, 0.035 * s), col, mx(-0.1 * s, (0.43 - 0.05 * i) * s, 0.3 * s)));
  // the face: sclera, iris, pupil, glint, brow, cheeks, mouth (open for the 3 cheering); every feature sits on the egg's surface at its own x, y
  const zS = (x, y) => rz * Math.sqrt(Math.max(0.05, 1 - (x / rx) ** 2 - ((y - cy) / ry) ** 2));
  for (const sx of [-1, 1]) { const ex = sx * 0.115 * s, ey = 0.675 * s, zE = zS(ex, ey);
    put(new THREE.SphereGeometry(1, 10, 8), "#fbf6ea", mx(ex, ey, zE - 0.006 * s, 0, 0, 0, 0.05 * s, 0.062 * s, 0.03 * s)); put(new THREE.SphereGeometry(1, 8, 6), "#4a2a14", mx(ex, ey - 0.004 * s, zE + 0.016 * s, 0, 0, 0, 0.032 * s, 0.043 * s, 0.014 * s)); put(new THREE.SphereGeometry(1, 6, 5), "#14100c", mx(ex, ey - 0.006 * s, zE + 0.027 * s, 0, 0, 0, 0.018 * s, 0.024 * s, 0.008 * s)); put(new THREE.SphereGeometry(1, 6, 5), "#ffffff", mx(ex - 0.01 * s, ey + 0.012 * s, zE + 0.033 * s, 0, 0, 0, 0.008 * s, 0.01 * s, 0.006 * s));
    put(new THREE.BoxGeometry(0.075 * s, 0.014 * s, 0.014 * s), "#5a3a1c", mx(ex, 0.745 * s, zS(ex, 0.745 * s) + 0.004 * s, 0.2, 0, -sx * 0.12)); put(new THREE.SphereGeometry(1, 8, 6), "#ff8f8f", mx(sx * 0.2 * s, 0.6 * s, zS(sx * 0.2 * s, 0.6 * s) - 0.004 * s, 0, 0, 0, 0.055 * s, 0.035 * s, 0.02 * s)); }
  put(new THREE.SphereGeometry(1, 8, 6), "#7a2e22", mx(0, 0.585 * s, zS(0, 0.585 * s) + 0.002 * s, 0, 0, 0, 0.05 * s, (f.up ? 0.034 : 0.02) * s, 0.02 * s));
  // boots
  for (const sx of [-1, 1]) put(new THREE.SphereGeometry(1, 10, 8), "#3a2a22", mx(sx * 0.13 * s, 0.03 * s, 0.05 * s, 0, 0, 0, 0.085 * s, 0.05 * s, 0.13 * s));
  // the hat: dome, band, 3 ear flaps on 3, pompom r 0.04; or two leaves (hatless)
  if (f.hat) { put(new THREE.SphereGeometry(0.19 * s, 14, 8, 0, TAU, 0, Math.PI / 2), f.hat, mx(0, 0.76 * s, 0, 0, 0, 0, 1, 0.82, 1)); put(new THREE.CylinderGeometry(0.2 * s, 0.205 * s, 0.075 * s, 14, 1, true), cmul(f.hat, 0.78), mx(0, 0.775 * s, 0)); put(new THREE.TorusGeometry(0.2 * s, 0.018 * s, 5, 14), cmul(f.hat, 0.62), mx(0, 0.74 * s, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; put(new THREE.BoxGeometry(0.012 * s, 0.1 * s, 0.01 * s), cmul(f.hat, 0.85), mx(Math.sin(a) * 0.1 * s, 0.84 * s, Math.cos(a) * 0.1 * s, 0.4 * Math.cos(a), a, 0)); }   // knit ribs
    put(new THREE.SphereGeometry(0.04, 9, 7), cmix(f.hat, "#ffffff", 0.45), mx(0, 0.925 * s + 0.0, 0)); if (f.flaps) for (const sx of [-1, 1]) { put(new THREE.BoxGeometry(0.05 * s, 0.13 * s, 0.03 * s), f.hat, mx(sx * 0.2 * s, 0.67 * s, 0.0)); put(new THREE.CylinderGeometry(0.004, 0.004, 0.08 * s, 4), cmul(f.hat, 0.7), mx(sx * 0.2 * s, 0.57 * s, 0.015)); put(new THREE.SphereGeometry(0.014, 6, 5), cmix(f.hat, "#ffffff", 0.3), mx(sx * 0.2 * s, 0.52 * s, 0.015)); } }
  else for (const [r, a] of [[0.2, -0.4], [0.17, 0.5]]) put(new THREE.SphereGeometry(1, 8, 6), K.leaf, mx(Math.sin(a) * 0.08 * s, 0.86 * s + 0.07 * s, 0.0, 0, 0, a * 0.8, 0.028 * s, 0.1 * s * r / 0.2, 0.012 * s));
  const mat = stdMat({ vertexColors: true, roughness: 0.9 }); const body = new THREE.Mesh(B.geo(), mat); body.castShadow = true; body.userData.solid = false; g.add(body);
  // the arms: 2 segments with a mitten; targets in the figure's frame, solved each frame only while they change
  const armMat = stdMat({ color: f.coat, roughness: 0.9 }), mitM = stdMat({ color: cmul(SCARF[(f.scarf + 3) % 7], 0.9), roughness: 0.95 });
  const cyl = () => once("krCyl", () => new THREE.CylinderGeometry(1, 1, 1, 8));
  const arms = [-1, 1].map((sx) => { const grp = new THREE.Group(); g.add(grp); const u = new THREE.Mesh(cyl(), armMat), l = new THREE.Mesh(cyl(), armMat), j = new THREE.Mesh(unitSph(), armMat), m = new THREE.Mesh(unitSph(), mitM), th = new THREE.Mesh(unitSph(), mitM);
    [u, l, j, m, th].forEach((o) => { o.castShadow = true; o.userData.solid = false; grp.add(o); }); u.scale.set(0.036 * s, 1, 0.036 * s); l.scale.set(0.032 * s, 1, 0.032 * s); j.scale.setScalar(0.038 * s); m.scale.set(0.052 * s, 0.056 * s, 0.05 * s); th.scale.set(0.02 * s, 0.03 * s, 0.02 * s);
    return { sx, u, l, j, m, th, rest: null }; });
  const shoulder = (sx) => [sx * 0.30 * s, 0.5 * s, 0.03 * s];
  const setArm = (A, target, pole) => { const sh = shoulder(A.sx), k = ik3(sh, target, 0.21 * s, 0.2 * s, pole); limbPlace(A.u, sh, k.E); limbPlace(A.l, k.E, k.F); A.j.position.set(...k.E); A.m.position.set(...k.F); A.th.position.set(k.F[0] - A.sx * 0.04 * s, k.F[1] + 0.012 * s, k.F[2] + 0.02 * s); };
  const hang = (sx) => [sx * 0.37 * s, 0.17 * s, 0.07 * s], up = (sx) => [sx * 0.46 * s, 1.0 * s, 0.05 * s];
  const pose = { adult: (A) => [hang(A.sx), [A.sx * 0.5, -0.4, -0.2]], phone: (A) => (A.sx > 0 ? [[0.12 * s, 0.82 * s, 0.34 * s], [0.5, -0.3, 0]] : [hang(A.sx), [-0.5, -0.4, -0.2]]), cup: (A) => (A.sx > 0 ? [[0.17 * s, 0.4 * s, 0.34 * s], [0.5, -0.4, 0]] : [hang(A.sx), [-0.5, -0.4, -0.2]]),
    cover: (A) => [[A.sx * 0.12 * s, 0.57 * s, 0.33 * s], [A.sx * 0.5, -0.1, 0.3]], point: (A) => (A.sx > 0 ? [[0.26 * s, 0.7 * s, 0.62 * s], [0.4, 0.2, 0]] : [hang(A.sx), [-0.5, -0.4, -0.2]]), peek: (A) => (A.sx > 0 ? [[0.30 * s, 0.35 * s, 0.14 * s], [0.5, -0.3, 0]] : [hang(A.sx), [-0.5, -0.4, -0.2]]) };
  const kind = f.role === "cover" ? "cover" : f.role === "rider" ? "point" : f.role === "peek" ? "peek" : f.phone ? "phone" : f.cup ? "cup" : "adult";
  const set0 = () => arms.forEach((A) => { const [t, p] = pose[kind](A); setArm(A, t, p); }); set0();
  const extras = [];
  if (kind === "phone") { const pg = new THREE.Group(); const ph = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.14, 0.014), stdMat({ color: "#1e2228", roughness: 0.4 })); ph.userData.solid = false; pg.add(ph);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.128), noLine(new THREE.MeshBasicMaterial({ map: paintPhone(), toneMapped: false, fog: false }))); scr.position.z = 0.0075; scr.userData.solid = false; pg.add(scr);   // the lit screen is turned to the parade (it reads from the lane's side; the holder films past its edge)
    const spill = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), glowMat(GLOW(), "#ff9a3a", 0.5)), 3); spill.position.z = 0.03; pg.add(spill);
    pg.position.set(0.12 * s, 0.9 * s, 0.36 * s); pg.rotation.set(-0.15, 0.0, 0.0); g.add(pg); c.phones++; extras.push(pg); }
  if (kind === "cup") { const cg = new THREE.Group(); WINTER_KINDS.cocoacup({ whole: cg, root: cg, halves: [], spec: {} }); cg.position.set(0.17 * s, 0.4 * s - 0.0, 0.34 * s); g.add(cg); extras.push(cg); c.cups++; }
  if (f.role === "peek") { g.position.x += 0.0; body.rotation.z = f.side > 0 ? 0.28 : -0.28; body.position.set(f.side > 0 ? 0.0 : 0.0, 0.0, 0.0); }
  if (f.role === "rider") { g.rotation.y = f.side > 0 ? -Math.PI / 2 : Math.PI / 2; }
  c.front++; if (f.hat) c.hats++; if (f.H < 0.52) c.kids++;
  return { g, f, arms, setArm, hang, up, pose, kind, set0, s, baseY: f.role === "rider" ? 0.0 : 0 };
}

// ================================================================================================================ the kind
export const KRAMPUS_RUN_STATE = { krampusrun: { march: 0, torch: 1, ring: 0.8, cheer: 0.5, show: 1 } };
export const KRAMPUS_RUN_GRIPS = {};
export const KRAMPUS_RUN_KINDS = {
  krampusrun(P) {
    const spec = P.spec || {}, root = P.whole, c = { icicles: 0, windows: 0, litWindows: 0, churchWin: 0, phones: 0, cups: 0, hats: 0, kids: 0, front: 0, eaves: [] };
    const ground = new THREE.Group(); root.add(ground);
    // ---- ground: wide snow, the painted lane, the street
    { const gm = new THREE.Mesh(new THREE.PlaneGeometry(128, 340), stdMat({ map: paintGround(), roughness: 0.96 })); gm.rotation.x = -Math.PI / 2; gm.position.set(0, -0.005, 8 - 170 + 12); gm.receiveShadow = true; gm.userData.solid = false; ground.add(gm);
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 98), stdMat({ map: paintLane(), roughness: 0.93 })); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.004, 8 - 49); ln.receiveShadow = true; ln.userData.solid = false; ground.add(ln);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 240), stdMat({ map: paintStreet(), roughness: 0.95 })); st.rotation.x = -Math.PI / 2; st.position.set(0, 0.003, -90 - 120); st.userData.solid = false; ground.add(st); }
    const posts = buildRopes(root);
    const houses = PL.houses.map(([side, z], k) => { const hg = new THREE.Group(); hg.position.set(side * PL.houseX, 0, z); hg.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; root.add(hg); buildHouse(k, hg, c); return hg; });
    buildChurch(root, c); const fir = buildFir(root);
    const sky = buildSky(root);
    // ---- the far street: dark house blocks both sides (instanced), 140 torch points up the street
    { const nb = 52, bodyG = new THREE.BoxGeometry(7, 5, 6).translate(0, 2.5, 0), roofG = new THREE.CylinderGeometry(0, 1, 1, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 2);
      const bm = new THREE.InstancedMesh(bodyG, noLine(stdMat({ color: "#ffffff", roughness: 0.95 })), nb), rm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4), noLine(stdMat({ color: "#ffffff", roughness: 0.95 })), nb), d = new THREE.Object3D();
      for (let i = 0; i < nb; i++) { const side = i % 2 ? 1 : -1, z = -62 - Math.floor(i / 2) * 7.6 - 2 * H2(i, 3), x = side * (9.5 + 2.5 * H2(i, 4)), sc = 0.8 + 0.5 * H2(i, 5);
        d.position.set(x, 0, z); d.rotation.set(0, 0, 0); d.scale.set(sc, sc * (0.9 + 0.3 * H2(i, 6)), sc); d.updateMatrix(); bm.setMatrixAt(i, d.matrix); bm.setColorAt(i, new THREE.Color(cmix("#2a3350", "#3a3a52", H2(i, 7))));
        d.position.set(x, 5 * sc * (0.9 + 0.3 * H2(i, 6)), z); d.scale.set(5.6 * sc, 2.0 * sc, 5.6 * sc); d.updateMatrix(); rm.setMatrixAt(i, d.matrix); rm.setColorAt(i, new THREE.Color(cmix("#aab6d0", "#e6efff", H2(i, 8)))); }
      bm.userData.solid = rm.userData.solid = false; bm.frustumCulled = rm.frustumCulled = false; root.add(bm, rm); }
    const tpos = new Float32Array(PL.torchPts * 3), tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(tpos, 3));
    const tpts = new THREE.Points(tg, noLine(new THREE.PointsMaterial({ map: GLOW(), size: 1.9, color: "#ffb060", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 1 }))); tpts.frustumCulled = false; steamy(tpts, 5); root.add(tpts);
    const tcore = new THREE.Points(tg, noLine(new THREE.PointsMaterial({ map: GLOW(), size: 0.55, color: "#fff0c0", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 1 }))); tcore.frustumCulled = false; steamy(tcore, 6); root.add(tcore);
    // ---- the warm haze over the lane (3 sheets, 0.08 in all)
    const haze = [2.6, 3.6, 4.8].map((y) => { const hz = steamy(new THREE.Mesh(new THREE.PlaneGeometry(18, 100), glowMat(once("krHaze", () => cvs(64, 256, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.1, "rgba(255,255,255,0.9)"); q.addColorStop(0.7, "rgba(255,255,255,0.35)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); const e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(0.5, "rgba(0,0,0,0)"); e.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = e; g.fillRect(0, 0, w, h); }, "haze", 1)), K.torch, 0.027)), 1); hz.rotation.x = -Math.PI / 2; hz.position.set(0, y, 8 - 50); root.add(hz); return hz; });
    // ---- the runners: copies of the krampus look (called, not edited)
    const run = RUNNERS.map((r, i) => {
      const g = new THREE.Group(); root.add(g);
      const def = KRAMPUS_BEAST_KINDS.krampus({ root: g, whole: g, halves: [], spec: { runner: true, lod: r.lod, seed: r.seed } });
      const q = { ...r, g, def, h: 1.72 + 0.36 * ((x) => x - Math.floor(x))(Math.sin((r.seed * 7 + 1) * 127.1 + 311.7) * 43758.5453) };
      q.sc = q.h / 2.04; return q;
    });
    const nearR = run.filter((r) => r.lod === "near"), midR = run.filter((r) => r.lod === "mid"), farR = run.filter((r) => r.lod === "far");
    // torch extras on the 8 near runners: sparks (6-9), a smoke ribbon (8 puffs over 1.2 m), a glow card r 0.8 at 0.40, a streak on the snow; the 4 real lights
    const sparkList = []; nearR.forEach((r, i) => { const n = 6 + Math.floor(H2(i, 130) * 4); for (let s = 0; s < n; s++) sparkList.push({ r: i, rate: 0.8 + 0.7 * H2(i * 13 + s, 131), ph: H2(i * 17 + s, 132), dx: (H2(i * 19 + s, 133) - 0.5) * 0.3, dz: (H2(i * 23 + s, 134) - 0.5) * 0.3, sw: H2(i * 29 + s, 135) * TAU }); });
    const spPos = new Float32Array(sparkList.length * 3), spCol = new Float32Array(sparkList.length * 3), spG = new THREE.BufferGeometry(); spG.setAttribute("position", new THREE.BufferAttribute(spPos, 3)); spG.setAttribute("color", new THREE.BufferAttribute(spCol, 3));
    const sparks = new THREE.Points(spG, noLine(new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, map: GLOW() }))); sparks.frustumCulled = false; steamy(sparks, 5); root.add(sparks);
    nearR.forEach((r, i) => {
      r.smoke = Array.from({ length: 8 }, () => { const sp = new THREE.Sprite(spriteMat(SMOKE(), "#5a4a44", 0, false)); steamy(sp, 5); root.add(sp); return sp; });
      r.glow = new THREE.Sprite(spriteMat(GLOW(), K.torch, 0.4, true)); r.glow.scale.setScalar(1.6); steamy(r.glow, 4); root.add(r.glow);
      r.streak = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.0), glowMat(POOL(), K.streak, 0.3)), 1); r.streak.rotation.x = -Math.PI / 2; root.add(r.streak);
      if (i < 4) { r.light = new THREE.PointLight(K.streak, 0, 7, 2); r.light.castShadow = false; root.add(r.light); }
    });
    // pools r 1.8 under every mid and far flame (88, instanced, baked glow)
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), glowMat(POOL(), K.torch, 0.45), midR.length + farR.length); [...midR, ...farR].forEach((r, i) => { const k = r.lod === "mid" ? 0.7 : 0.3; pools.setColorAt(i, new THREE.Color(k, k, k)); }); pools.frustumCulled = false; pools.userData.solid = false; steamy(pools, 1); root.add(pools);
    // ---- the onlookers: 14 built figures, and the back rows (2 x 30, visitorcrowd)
    const figs = FRONT.map((f) => buildFigure(f, root, c)); const carrier = figs.find((q) => q.f.role === "carrier"), rider = figs.find((q) => q.f.role === "rider");
    if (rider && carrier) { rider.g.position.set(carrier.f.x, carrier.f.H * 0.8 + 0.08, carrier.f.z); rider.baseY = rider.g.position.y; }
    const backs = [];
    if (spec.backRows !== false) for (const side of [1, -1]) for (const [row, R, x0] of [[0, 120, 4.7], [1, 120, 6.2]]) {   // 2 rows x 15 a side = 2 x 30, on an arc so long it is a line; the arc faces its centre, which is across the lane
      const cg = new THREE.Group(); root.add(cg); SH_FAR_KINDS.visitorcrowd({ whole: cg, root: cg, halves: [], spec: { n: 15, arc: [R, -3.3 + 0.4 * row, 4.3 - 0.4 * row], seed: 3 + (side > 0 ? 0 : 10) + row * 5 + (spec.seed ?? 0), h: 0.85 } });
      cg.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; cg.position.x = side > 0 ? x0 - (R + 0.7) : (R + 0.7) - x0; backs.push(cg); }
    const hooked = hookScene(root, (cam) => { sky.position.copy(root.worldToLocal(cam.getWorldPosition(new THREE.Vector3()))); });
    // the counts the bench prints
    c.posts = posts; c.fir = fir.N; c.runners = { near: nearR.length, mid: midR.length, far: farR.length }; P.root.userData.counts = c;
    if (typeof console !== "undefined" && spec.log) console.log("krampusrun built", JSON.stringify({ ...c, eaves: undefined }));
    const tmp = new THREE.Object3D(), V = new THREE.Vector3();
    const tip = (r, g) => {   // the flame centre of a runner's torch, in the square's frame
      const p = krampusPoints({ runner: true, jam: 0.5, stoop: r.stoop, gait: g }, { x: r.x, y: 0, z: r.zNow, rot: r.yaw, scale: r.sc }), y = r.yaw * DEG, b = [0, 0.9903, 0.1392], t = [0, 0.985, 0.167];
      const fx = p.butts[0], fy = p.butts[1], fz = p.butts[2], k = r.sc, off = (v, f) => [v[0] * f, v[1] * f, v[2] * f], rot = (v) => [v[0] * Math.cos(y) + v[2] * Math.sin(y), v[1], -v[0] * Math.sin(y) + v[2] * Math.cos(y)];
      const bb = rot(off(b, 0.10 * k)), tt = rot(off(t, 0.64 * k)); return [fx + bb[0] + tt[0], fy + bb[1] + tt[1], fz + bb[2] + tt[2]];
    };
    return {
      grip: 0,
      apply(ps, tm) {
        // show 0: the whole square is off (hidden, nothing posed): a clip keeps it on only for its shot (posing 96 runners
        // each layout sample cost ~3 s a sample in Krampus myth 01's 68 s clip)
        const on = (ps.show ?? spec.show ?? 1) > 0.5; P.whole.visible = on; if (!on) return;
        const t = tm ?? 0, m = ps.march ?? spec.march ?? 0, tq = clamp(ps.torch ?? spec.torch ?? 1), rg = clamp(ps.ring ?? spec.ring ?? 0.8), ch = clamp(ps.cheer ?? spec.cheer ?? 0.5);
        // runners: advance 1.10 m a gait cycle; every beast is posed by its own apply
        for (const r of run) { r.zNow = r.z0 + PL.stride * m; r.g.position.set(r.x, 0, r.zNow); r.g.rotation.y = r.yaw * DEG;
          const gait = m + r.ph, base = { gait, jam: 0.5, torch: tq, ring: rg, stoop: r.stoop, tongue: r.tongue, breath: 0, glow: 0.7 };
          r.def.apply(r.lod === "far" ? { gait } : base, t); r.gait = gait; }
        nearR.forEach((r, i) => { const p = tip(r, r.gait), fl = 1 + 0.1 * Math.sin(TAU * 7 * t + i * 2.3) + 0.06 * Math.sin(TAU * 11 * t + i);
          r.glow.position.set(p[0], p[1], p[2]); r.glow.material.opacity = 0.4 * tq * fl; r.glow.visible = tq > 0.01;
          r.streak.position.set(p[0], 0.012, p[2] - 0.5); r.streak.material.opacity = 0.3 * tq * fl; r.streak.visible = tq > 0.01;
          if (r.light) { r.light.position.set(p[0], p[1] + 0.1, p[2] + 0.2); r.light.intensity = 14 * tq * fl; }
          r.smoke.forEach((sp, q) => { const s = frac(q / 8 + 0.55 * t * (0.9 + 0.2 * H2(i, 140)) + H2(i, 141)), a = TAU * 2.5 * s + i, sz = lerp(0.08, 0.36, s); sp.position.set(p[0] + 0.1 * Math.sin(a) * s + 0.25 * s, p[1] + 0.12 + 1.2 * s, p[2] + 0.1 * Math.cos(a) * s - 0.15 * s); sp.scale.setScalar(sz); sp.material.opacity = 0.32 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * tq; sp.visible = tq > 0.01; }); });
        sparkList.forEach((s, n) => { const r = nearR[s.r], p = tip(r, r.gait), ph = frac(t * s.rate + s.ph), rise = 0.6 * (1 - (1 - ph) * (1 - ph)), v = tq * Math.pow(1 - ph, 0.8);
          spPos.set([p[0] + s.dx * ph * 0.5 + 0.03 * Math.sin(s.sw + 5 * ph), p[1] + 0.1 + rise, p[2] + s.dz * ph * 0.5 + 0.03 * Math.cos(s.sw + 5 * ph)], n * 3); spCol.set([v, v * 0.82, v * 0.48], n * 3); });
        spG.attributes.position.needsUpdate = true; spG.attributes.color.needsUpdate = true;
        pools.material.opacity = 0.45 * tq; pools.visible = tq > 0.01;
        [...midR, ...farR].forEach((r, i) => { tmp.position.set(r.x + 0.2, 0.015, r.zNow - 0.3); tmp.scale.setScalar(1 + 0.06 * Math.sin(TAU * 6 * t + i * 1.7)); tmp.updateMatrix(); pools.setMatrixAt(i, tmp.matrix); }); pools.instanceMatrix.needsUpdate = true;
        // the street's 140 torch points flicker and advance with the parade
        TORCH_PTS.forEach((p, i) => tpos.set([p.x + 0.03 * Math.sin(TAU * 3 * t + p.ph * 9), 2.15 + 0.06 * Math.sin(TAU * 4 * t + p.ph * 7) + 0.0 * i, p.z + PL.stride * m], i * 3)); tg.attributes.position.needsUpdate = true; tpts.material.opacity = tq; tcore.material.opacity = tq; tpts.visible = tcore.visible = tq > 0.01;
        haze.forEach((h) => { h.material.opacity = 0.027 * tq; h.visible = tq > 0.01; });
        // the onlookers: a bob, and from cheer 0.6 a third raise both arms
        const rise = sm((ch - 0.6) / 0.4);
        for (const q of figs) { const ph = H2(q.f.n, 150) * TAU, bob = 0.04 * ch * (0.5 + 0.5 * Math.sin(TAU * 1.1 * t + ph)); q.g.position.y = q.baseY + bob;
          if (q.f.up && q.kind === "adult") q.arms.forEach((A) => { const [h0, pole] = q.pose.adult(A), u = q.up(A.sx); q.setArm(A, [lerp(h0[0], u[0], rise), lerp(h0[1], u[1], rise), lerp(h0[2], u[2], rise)], pole); }); }
        // the hidden square costs nothing: root.visible is the prop's own scale switch (buildProp)
      },
    };
  },
};
