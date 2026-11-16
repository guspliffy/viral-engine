import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scorehill": the hilltop of "I could see everyone's happiness score" (Happiness 03, panels 39-48), REAL 3D with hand-painted canvas
// textures (the paintings plates/painted/HT-W.webp, HT-W2.webp, HT-E.webp are the look targets and, beyond ~280 m, the far cards).
// A grassy ridge 10 m wide at y 0 with a dirt clearing, a dirt path, boulders, real swaying grass tufts, wildflowers; ONE lone old
// oak (3D buttressed trunk, roots, hollow, six limbs, ~20 000 painted oak-leaf cards in hanging clumps); autumn bushes and conifers
// on the slopes under both brinks; leaves falling from the tree; a flock of birds; and two painted far cards (west, east) cut from
// the paintings and aligned to the reference cameras, so a camera near them sees the painting. Sky: a painted dome, west gold / east lilac.
//
// COORDINATES (metres, y up). WEST is -z (the sun, the river, the town, the viaduct, the bench faces it), EAST is +z (the second valley
// and the station). A west camera looks down -z (screen right = +x); an east camera looks down +z (screen right = -x).
//   ridge top (y 0)        z -3.2 (west brink) .. +6.8 (east brink), 10 m; runs along x. Flat y 0 (+-5 mm) in the stage zone
//                          x -8.7..8.7, z -5.4..3.0; low lumps outside. West slope: steep (about 40 degrees) from the rounded lip.
//   the lone oak           trunk at x -2.6, z +0.8 (radius 0.62 at 1.2 m, root buttresses to 1.7), 3.3 m of trunk, then six limbs; the
//                          lowest leaves hang at y 1.9-2.4, the canopy reaches x +3.4, z -3.9 (over the bench and the brink), z +4.4
//                          (east), x -6.8; top about 8 m. A dark hollow on its -z and +z faces at y 1.9.
//   the bench              the `hillbench` prop (props-score-items.js) at (0, 0, -1.2), rot 180 (faces -z). The set leaves it alone.
//   dirt clearing          an irregular ellipse round (0.2, 0.5), 12 x 5 m, z -2.0 .. 3.0, with grass at the brink and round the trunk
//   dirt path              from the lip at (-2.0, -2.9) (bottom RIGHT of the east views) past the trunk's +x side, in an S over the ridge to the east brink and down it (3.4, 10.5)
//   boulders               (2.1, 2.3) r 0.5; (2.4, -1.7) r 0.38; (-3.9, -0.4) r 0.55 (mossy, at the trunk)
//   far west card          280 m down -z, golden = HT-W, sunset = HT-W2; far east card 280 m down +z = HT-E
// HILL (exported) has the numbers a storyboard needs: brink, seats, stand spots per panel, the reference cameras, the viaduct deck line.
//
// spec (every key optional):
//   time "golden"      "golden" (HT-W, 43) or "sunset" (HT-W2, 47; the east card and the sky take a pink-violet tint too)
//   view "both"        which far cards to build: "both", "west" or "east" (each loads one 1536 x 1024 painting from the repo root)
//   seed 7             the painted textures and the layout of grass, flowers, leaves, bushes
//   wind 1             grass bends, leaves shiver (0 off)
//   grass 1            density of the grass tufts (0 none); flowers 1 (0 none); fallen 1 (leaves on the ground, 0 none)
//   leaves 12          leaves falling from the tree (a closed form of the frame time, each loops every 9-14 s)
//   birds 5            a flock crossing the west sky right to left (0 none); birdAt 176 (clip seconds the flock enters), birdDur 14
//   shimmer true       gold glints on the painted river (golden only)
//   deckLevel true     sunset: the far card is rolled 2.7 degrees so the viaduct's deck line is level (the train runs along it)
//   backdrop true      the far cards (false: sky dome only)
// Light: set "light": "golden" and "windows": false (outdoors: no window-light patches). West views and east views (the sun is in the west: in front of a west camera, rim-lighting the sitters; behind an east camera, lighting faces): "key": [-1.2, 3.3, -4.2] (sun about 33 degrees up, so the canopy dapples the dirt), "shadowSize": 9.
// Sunset: lower, a little more to -x: [-2.2, 1.6, -4.6]. Nothing here is solid for the checks except the trunk, the boulders and the bench; the ground is
// the mesh "set-floor". About 150k triangles (the canopy 40 %); every part is merged by material.
//
// Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks) only.

export const HILL = {
  benchZ: -1.2, brinkZ: -3.2, eastBrinkZ: 6.8, tree: { x: -2.6, z: 0.8 }, cardDist: 280,
  // seat heights: the bench seat top 0.30; the brink's hidden seats 0.06 (kind "seatmark" at y 0, sit height 0.06)
  seatBench: 0.30, seatGround: 0.06,
  // stand/sit spots (x, z[, y]) per panel. West = the camera looks down -z.
  spots: {
    "39": { view: "east", mash: [-0.48, -1.23, "bench 0.30"], spud: [2.0, -1.6, 0], bike: [2.9, -1.5] },
    "40": { view: "west", mash: [-0.48, -1.23, "bench 0.30"] },
    "41": { view: "east", mash: [-0.48, -1.23, "bench 0.30"] },
    "42": { view: "east", spud: [0.47, -1.23, "bench 0.30"] },
    "43": { view: "west", mash: [-0.48, -1.23, "bench 0.30"], spud: [0.47, -1.23, "bench 0.30"] },
    "44": { view: "east", mash: [-0.48, -1.23, "bench 0.30"], spud: [0.47, -1.23, "bench 0.30"], chip: [1.5, -2.1, "grass 0.06"], wedge: [2.7, -2.15, "grass 0.06"] },
    "45": { view: "east", glasses: [-0.6, -1.23, 0.397] },
    "46": { view: "east", mash: [1.5, -1.9, 0], spud: [2.05, -1.9, 0] },
    "47": { view: "west", chip: [-1.0, -2.55, "brink 0.06"], spud: [0.0, -2.55, "brink 0.06"], wedge: [1.0, -2.55, "brink 0.06"] },
    "48": { view: "east", spud: [-1.5, -1.0, 0], walkTo: [-2.5, -2.6] },
  },
  // reference cameras of the paintings (pos, look, vfov): a camera here sees the painting
  cams: {
    "43": { pos: [0, 1.25, 5.2], look: [0, 0.2, -4.8], fov: 38 },
    "47": { pos: [0.6, 0.8, 0.4], look: [0.6, -0.6, -9.6], fov: 36 },
    east: { pos: [0, 1.1, -4.4], look: [0, 0.05, 5.6], fov: 38 },
  },
  // the viaduct deck line (the parapet top) of the SUNSET west card, a world line for the `scoretrain` prop: filled in below
  viaduct: null,
};

const DEG = Math.PI / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const hash2 = (i, j, s) => { let h = Math.imul(i * 374761393 + j * 668265263 + s * 1274126177, 1103515245) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, s = 1) {
  const i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
  const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x, y, s = 1) => 0.55 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.1 + 3, y * 2.1 + 7, s + 1) + 0.15 * vnoise(x * 4.3 + 9, y * 4.3 + 1, s + 2);
function ctex(c, rx = 1, ry = 1, repeat = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); return t;
}
const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...o }); m.userData.noOutline = true; return m; };
const lam = (color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const shade = (hex, k) => { const c = new THREE.Color(hex); return `rgb(${Math.min(255, Math.round(c.r ** (1 / 2.2) * 255 * k))},${Math.min(255, Math.round(c.g ** (1 / 2.2) * 255 * k))},${Math.min(255, Math.round(c.b ** (1 / 2.2) * 255 * k))})`; };
const tint = (hex, rnd, dh = 0.012, ds = 0.06, dl = 0.07) => new THREE.Color(hex).offsetHSL((rnd() - 0.5) * dh * 2, (rnd() - 0.5) * ds * 2, (rnd() - 0.5) * dl * 2);

// ================================================================================================================ the ground
const BRINK = HILL.brinkZ, EAST = HILL.eastBrinkZ, TX = HILL.tree.x, TZ = HILL.tree.z;
const wob = (x) => smooth((Math.abs(x) - 3) / 5) * (0.55 * Math.sin(x * 0.27 + 1.3) + 0.35 * Math.sin(x * 0.61 + 0.2));
const lipW = (x) => BRINK + wob(x), lipE = (x) => EAST + 0.8 * wob(x * 0.8 + 3);
const dropW = (d) => (d <= 0 ? 0 : d < 36 ? 0.95 * d * d / (d + 0.9) : 0.95 * 36 * 36 / 36.9 + (d - 36) * 0.32);
const dropE = (d) => (d <= 0 ? 0 : d < 30 ? 0.7 * d * d / (d + 1.4) : 0.7 * 900 / 31.4 + (d - 30) * 0.25);
export function groundY(x, z) {
  const dW = lipW(x) - z, dE = z - lipE(x);
  if (dW > 0) return -dropW(dW) + 0.0;
  if (dE > 0) return -dropE(dE);
  const edge = smooth(Math.min(-dW, -dE) / 1.0), sz = Math.hypot((x - 0.2) / 8.5, (z + 1.2) / 4.2), amp = smooth((sz - 1) / 1.2) * 0.3 + 0.012;
  const r = Math.hypot(x - TX, z - TZ);
  return edge * ((fbm(x * 0.21 + 3, z * 0.21, 5) - 0.5) * amp * 2 + 0.1 * Math.exp(-r * r / 3.0));
}
const PATH = [[-2.0, -2.9], [-2.0, -1.5], [-1.2, -0.2], [-0.2, 1.1], [0.5, 2.7], [0.4, 4.6], [1.2, 6.2], [2.2, 7.8], [3.4, 10.5], [4.6, 13.5]];
function distPath(x, z) {
  let m = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1], dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return m;
}
// 1 on bare dirt (the clearing and the path), 0 on grass
export function dirtMask(x, z) {
  const n = fbm(x * 0.9 + 7, z * 0.9, 21), n2 = fbm(x * 0.25, z * 0.25 + 4, 23);
  const e = Math.hypot((x - 0.2) / 4.5, (z - 0.3) / 2.3);
  let m = 1 - smooth((e - 0.85 + (n - 0.5) * 0.4) / 0.22);
  const wp = 0.8 - 0.1 * clamp01((z - 4) / 8);
  m = Math.max(m, 1 - smooth((distPath(x, z) - wp + (n - 0.5) * 0.5) / 0.3));
  m *= smooth((Math.hypot(x - TX, z - TZ) - 1.5 - (n2 - 0.5) * 0.8) / 0.7);
  m *= smooth((z + 2.3 - (n - 0.5) * 0.5) / 0.35);
  return m;
}

// ================================================================================================================ painters
function grassCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S);
  g.fillStyle = "#8aa83e"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const cx = rnd() * S, cy = rnd() * S, r = 40 + rnd() ** 2 * 170, col = ["#6f9a3e", "#b6b84a", "#d2b048", "#5d8a3a", "#c9a23c"][i % 5];
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, col + "70"); gr.addColorStop(1, col + "00"); g.fillStyle = gr; g.fillRect(cx + ox - r, cy + oy - r, 2 * r, 2 * r); }
  }
  for (let i = 0; i < 14000; i++) {
    const x = rnd() * S, y = rnd() * S, l = 6 + rnd() * 14, a = -Math.PI / 2 + (rnd() - 0.5) * 0.9, u = rnd();
    g.strokeStyle = u < 0.35 ? "rgba(52,100,44,0.4)" : u < 0.75 ? "rgba(224,236,130,0.4)" : "rgba(226,170,64,0.34)"; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
// the dirt clearing + path as one decal canvas over x -16..9, z -3.4..8.4 (50 px a metre); alpha from dirtMask with a dusty, darker rim
const DX0 = -8, DX1 = 9, DZ0 = -3.6, DZ1 = 14, DPPM = 50;
function dirtCanvas(rnd) {
  const W = (DX1 - DX0) * DPPM, H = (DZ1 - DZ0) * DPPM, [c, g] = canvas(W, H);
  g.fillStyle = "#92633a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) {   // soft mottling: warm brown, gold, pale dust, dark damp
    const cx = rnd() * W, cy = rnd() * H, r = 18 + rnd() ** 2 * 110, tc = [[132, 88, 48], [196, 150, 84], [214, 176, 112], [96, 66, 40], [170, 120, 66]][Math.floor(rnd() * 5)], al = 0.1 + rnd() * 0.16;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${al})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 150; i++) {   // dapple: clusters of sunlit leaf-shaped patches over shaded brown
    const cx = rnd() * W, cy = rnd() * H;
    for (let q = 0; q < 14; q++) { g.fillStyle = `rgba(255,204,120,${0.2 + rnd() * 0.2})`; g.beginPath(); g.ellipse(cx + (rnd() - 0.5) * 170, cy + (rnd() - 0.5) * 90, 7 + rnd() * 20, 5 + rnd() * 11, rnd() * 3, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 26000; i++) { g.fillStyle = rnd() < 0.55 ? `rgba(70,46,26,${0.14 + rnd() * 0.2})` : `rgba(240,204,150,${0.1 + rnd() * 0.18})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2.6, 1 + rnd() * 2); }
  for (let i = 0; i < 260; i++) {   // hairline cracks
    let x = rnd() * W, y = rnd() * H; g.strokeStyle = `rgba(58,38,22,${0.18 + rnd() * 0.18})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 34; y += (rnd() - 0.3) * 22; g.lineTo(x, y); } g.stroke();
  }
  for (let i = 0; i < 520; i++) {   // little painted stones
    const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 5; g.fillStyle = `rgba(${130 + rnd() * 60},${116 + rnd() * 50},${98 + rnd() * 40},0.8)`; g.beginPath(); g.ellipse(x, y, r, r * 0.65, rnd() * 3, 0, 7); g.fill();
    g.fillStyle = "rgba(255,238,200,0.35)"; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.28, 0, 0, 7); g.fill();
  }
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const m = dirtMask(DX0 + (i + 0.5) / DPPM, DZ0 + (j + 0.5) / DPPM), k = (j * W + i) * 4;
    if (m < 0.02) { d[k + 3] = 0; continue; }
    const rim = Math.exp(-(((m - 0.42) / 0.16) ** 2)), dust = smooth((0.7 - m) / 0.5);
    d[k] = d[k] * (1 - 0.3 * rim) * (1 - 0.1 * dust) + 22 * dust; d[k + 1] = d[k + 1] * (1 - 0.32 * rim) + 24 * dust; d[k + 2] = d[k + 2] * (1 - 0.34 * rim);
    d[k + 3] = Math.round(255 * smooth(m * 1.5));
  }
  g.putImageData(id, 0, 0);
  return c;
}
function barkCanvas(rnd) {
  const W = 512, H = 1024, [c, g] = canvas(W, H);
  g.fillStyle = "#6a5240"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {   // long furrows: dark cores with lit shoulders
    const x = rnd() * W, w = 5 + rnd() * 18, wob = (rnd() - 0.5) * 22;
    for (const ox of [-W, 0, W]) {
      const gr = g.createLinearGradient(x + ox - w, 0, x + ox + w, 0); gr.addColorStop(0, "rgba(40,28,20,0)"); gr.addColorStop(0.45, `rgba(28,18,12,${0.6 + rnd() * 0.3})`); gr.addColorStop(0.7, "rgba(196,150,98,0.4)"); gr.addColorStop(1, "rgba(150,112,72,0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + ox - w, 0); g.bezierCurveTo(x + ox + wob, H * 0.3, x + ox - wob, H * 0.65, x + ox + wob * 0.5 - w, H); g.lineTo(x + ox + wob * 0.5 + w, H); g.bezierCurveTo(x + ox - wob + w, H * 0.65, x + ox + wob + w, H * 0.3, x + ox + w, 0); g.fill();
    }
  }
  for (let i = 0; i < 90; i++) { const cx = rnd() * W, cy = rnd() * H, r = 14 + rnd() * 40, tc = rnd() < 0.5 ? "170,128,80" : "84,62,44", rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(${tc},${0.18 + rnd() * 0.2})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let i = 0; i < 26; i++) { const cx = rnd() * W, cy = H * (0.55 + rnd() * 0.45), r = 16 + rnd() * 46; for (const ox of [-W, 0, W]) { const rg = g.createRadialGradient(cx + ox, cy, 0, cx + ox, cy, r); rg.addColorStop(0, "rgba(108,128,52,0.5)"); rg.addColorStop(1, "rgba(108,128,52,0)"); g.fillStyle = rg; g.fillRect(cx + ox - r, cy - r, 2 * r, 2 * r); } }   // moss low down
  for (let i = 0; i < 5000; i++) { g.fillStyle = rnd() < 0.6 ? "rgba(34,22,14,0.3)" : "rgba(210,170,120,0.2)"; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 2 + rnd() * 7); }
  return c;
}
// an oak leaf: white with soft veins, rounded lobes along its length, stem at the bottom (tinted by vertex colour)
function oakCanvas() {
  const S = 128, [c, g] = canvas(S, S), cx = 64;
  const gr = g.createLinearGradient(30, 10, 100, 120); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#d4d4d4");
  g.fillStyle = gr; g.beginPath();
  const prof = (t) => 31 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.02)), 0.75) * (1 + 0.3 * Math.sin(t * 6.283 * 3.2 + 0.5)) * (0.8 + 0.5 * t);
  for (let t = 0; t <= 1.001; t += 0.02) g.lineTo(cx + prof(t), 110 - t * 96);
  for (let t = 1; t >= -0.001; t -= 0.02) g.lineTo(cx - prof(t), 110 - t * 96);
  g.closePath(); g.fill();
  g.strokeStyle = "rgba(90,90,90,0.55)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, 126); g.lineTo(cx, 20); g.stroke();
  g.lineWidth = 1.5; for (let k = 1; k <= 5; k++) for (const sd of [-1, 1]) { const y = 110 - k * 16; g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + sd * 20, y - 11); g.stroke(); }
  return c;
}
function daisyCanvas() {
  const S = 64, [c, g] = canvas(S, S);
  g.fillStyle = "#ffffff"; for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 13, 5.5, a, 0, 7); g.fill(); }
  g.fillStyle = "#8a8a8a"; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill(); g.fillStyle = "#c8c8c8"; g.beginPath(); g.arc(30, 30, 3.5, 0, 7); g.fill();
  return c;
}
function rockCanvas(rnd) {
  const S = 256, [c, g] = canvas(S, S); g.fillStyle = "#9a9486"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { const cx = rnd() * S, cy = rnd() * S, r = 10 + rnd() * 40, tc = [[120, 112, 100], [190, 176, 150], [150, 130, 104], [90, 86, 80]][i % 4], rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(${tc},0.3)`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let i = 0; i < 2400; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(50,44,38,0.3)" : "rgba(235,224,200,0.25)"; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); }
  return c;
}
// the sky all round (three's sphere: u 0.75 looks down -z = west, 0.25 down +z = east): palette per time of day
function skyCanvas(time) {
  const W = 1024, H = 512, [c, g] = canvas(W, H), hz = H / 2;
  const P = time === "sunset" ? { w: ["#6a4a96", "#e8587a", "#ffa050"], e: ["#5a5aa0", "#b57aa8", "#f0a890"] } : { w: ["#9a5a7a", "#e8803a", "#ffc060"], e: ["#8f86c0", "#d9a0b8", "#f6c8a0"] };
  const mixc = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  for (let x = 0; x < W; x++) {
    const aw = 0.5 + 0.5 * Math.cos(2 * Math.PI * (x / W - 0.75)), gr = g.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, "#" + mixc(P.e[0], P.w[0], aw).getHexString()); gr.addColorStop(0.55, "#" + mixc(P.e[1], P.w[1], aw).getHexString()); gr.addColorStop(1, "#" + mixc(P.e[2], P.w[2], aw).getHexString());
    g.fillStyle = gr; g.fillRect(x, 0, 1.5, hz + 1);
  }
  g.fillStyle = "#5a4630"; g.fillRect(0, hz, W, hz);
  return c;
}

// ================================================================================================================ geometry
function Buf() { return { p: [], n: [], uv: [], c: [], i: [] }; }
function bufMesh(B, mat, cast = true, recv = true) {
  if (!B.p.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(B.c, 3)); g.setIndex(B.i);
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; return m;
}
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, col, uv = [0, 0, 1, 1]) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2;
  for (const [a, d, u, v] of [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]]) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(col.r, col.g, col.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _alt = new THREE.Vector3(1, 0, 0);
function frameOf(n, spin) {
  _t1.crossVectors(Math.abs(n.y) > 0.95 ? _alt : _up, n).normalize(); _t2.crossVectors(n, _t1).normalize();
  const c = Math.cos(spin), s = Math.sin(spin);
  return [_t1.clone().multiplyScalar(c).addScaledVector(_t2, s), _t2.clone().multiplyScalar(c).addScaledVector(_t1, -s)];
}
// a tapered tube along a curve (indexed, position + normal + uv)
function taperTube(curve, r0, r1, nSeg, nRad, uvK = 1.4) {
  const fr = curve.computeFrenetFrames(nSeg, false), P = [], N = [], UV = [], I = [], len = curve.getLength();
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg, p = curve.getPoint(t), r = r0 + (r1 - r0) * Math.pow(t, 0.85);
    for (let j = 0; j <= nRad; j++) {
      const a = (j / nRad) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), nx = fr.normals[i].x * c + fr.binormals[i].x * s, ny = fr.normals[i].y * c + fr.binormals[i].y * s, nz = fr.normals[i].z * c + fr.binormals[i].z * s;
      P.push(p.x + nx * r, p.y + ny * r, p.z + nz * r); N.push(nx, ny, nz); UV.push((j / nRad) * 1.2, (t * len) / uvK);
      if (i && j) { const a0 = (i - 1) * (nRad + 1) + j - 1, b0 = a0 + 1, c0 = i * (nRad + 1) + j - 1, d0 = c0 + 1; I.push(a0, c0, b0, b0, c0, d0); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); return g;
}

// ================================================================================================================ the set
export function buildScoreHill(scene, S = {}) {
  const WARM = S.time === "sunset" ? new THREE.Color(1.1, 0.88, 0.66) : new THREE.Color(1.04, 0.97, 0.84);
  const seed = S.seed ?? 7, time = S.time === "sunset" ? "sunset" : "golden", wind = S.wind ?? 1, view = S.view ?? "both";
  const set = new THREE.Group(); set.name = "set-scorehill"; scene.add(set);
  const add = (o) => { if (o) set.add(o); return o; };
  const rnd = rng(seed * 7919 + 13), rT = rng(seed * 57 + 2), rG = rng(seed * 113 + 4), rF = rng(seed * 91 + 3), rS = rng(seed * 31 + 9), rL = rng(seed * 211 + 5);
  scene.background = new THREE.Color(time === "sunset" ? "#a05a7a" : "#d98a4a"); scene.fog = null;

  // ---------------------------------------------------------------- materials and textures
  const oakT = ctex(oakCanvas(), 1, 1, false), daisyT = ctex(daisyCanvas(), 1, 1, false);
  const leafMat = lam("#ffffff", { map: oakT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#4a2408") });
  if (wind) leafMat.userData.wind = { amp: 0.05 * wind, h: 0, flutter: 1.7 };
  const bushMat = lam("#ffffff", { map: oakT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#4a2408") });
  if (wind) bushMat.userData.wind = { amp: 0.03 * wind, h: 0, flutter: 1.4 };
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color("#3a1a08") });
  const flowerMat = lam("#ffffff", { map: daisyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#3a3020") });
  const grassT = ctex(grassCanvas(rnd), 1, 1);
  const barkT = ctex(barkCanvas(rnd), 1, 1), barkM = std("#ffffff", { map: barkT, roughness: 0.96, emissive: new THREE.Color("#2a1c10") });

  // ---------------------------------------------------------------- sky dome (west gold / east lilac)
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(262, 48, 24), basic({ map: ctex(skyCanvas(time), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
    sky.position.set(0, 0, 0); sky.renderOrder = -1000; sky.frustumCulled = false; sky.userData.solid = false; sky.name = "set-scorehill-sky"; add(sky); }

  // ---------------------------------------------------------------- the terrain (the ground: "set-floor")
  const axis = (segs) => { const a = []; for (const [lo, hi, st] of segs) for (let v = lo; v < hi - 1e-6; v += st) a.push(+v.toFixed(3)); a.push(segs[segs.length - 1][1]); return a; };
  {
    const xs = axis([[-90, -30, 4], [-30, -14, 1.5], [-14, 14, 0.5], [14, 30, 1.5], [30, 90, 4]]);
    const zs = axis([[-150, -60, 6], [-60, -24, 3], [-24, -8, 1.2], [-8, -4.4, 0.45], [-4.4, -2.0, 0.2], [-2.0, 5.0, 0.7], [5.0, 8.4, 0.3], [8.4, 14, 0.9], [14, 40, 2.5], [40, 100, 6]]);
    const B = Buf(), col = new THREE.Color(), nx = xs.length;
    zs.forEach((z) => xs.forEach((x) => {
      const y = groundY(x, z); B.p.push(x, y, z); B.n.push(0, 1, 0); B.uv.push(x / 5, z / 5);
      const n = fbm(x * 0.08, z * 0.08, 3), au = fbm(x * 0.05 + 5, z * 0.05, 5), slope = y < -0.3 ? smooth(-y / 6) : 0;
      col.set("#ffffff").lerp(new THREE.Color("#e8c860"), smooth((au - 0.45) * 3) * 0.5).lerp(new THREE.Color("#c9742a"), slope * 0.45).multiplyScalar((0.82 + n * 0.3) * (1 - 0.2 * slope));
      col.multiply(WARM); B.c.push(col.r, col.g, col.b);
    }));
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; B.i.push(a, c, b, b, c, d); }
    const m = bufMesh(B, std("#ffffff", { map: grassT, vertexColors: true, roughness: 1, emissive: new THREE.Color("#4a3a14") }), false, true); m.geometry.computeVertexNormals(); m.name = "set-floor"; add(m);
  }
  // the dirt clearing and path: a decal laid 1.2 cm over the grass
  {
    const nxd = Math.round((DX1 - DX0) / 0.35), nzd = Math.round((DZ1 - DZ0) / 0.35), B = Buf();
    for (let j = 0; j <= nzd; j++) for (let i = 0; i <= nxd; i++) { const x = DX0 + (DX1 - DX0) * i / nxd, z = DZ0 + (DZ1 - DZ0) * j / nzd; B.p.push(x, groundY(x, z) + 0.012, z); B.n.push(0, 1, 0); B.uv.push(i / nxd, 1 - j / nzd); B.c.push(1, 1, 1); }
    for (let j = 0; j < nzd; j++) for (let i = 0; i < nxd; i++) { const a = j * (nxd + 1) + i, b = a + 1, c = a + nxd + 1, d = c + 1; B.i.push(a, c, b, b, c, d); }
    const m = bufMesh(B, std("#ffffff", { map: ctex(dirtCanvas(rnd), 1, 1, false), vertexColors: true, transparent: true, depthWrite: false, roughness: 1, emissive: new THREE.Color("#4a3018"), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true);
    m.renderOrder = 1; m.name = "set-dirt"; m.userData.solid = false; m.geometry.computeVertexNormals(); add(m);
  }

  // ---------------------------------------------------------------- the lone oak
  const treeParts = [], leafQ = Buf(), coreQ = Buf();
  const OAK = { gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e", "#f2c038"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"], red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e", "#a8221a"], green: ["#8aa83a", "#b9b02a", "#6f9a3a", "#d8a82a"] };
  const MIXT = ["gold", "orange", "gold", "orange", "red", "gold"];
  function clump(B, C, c, r, tones, n, sz, flat = 0.72, kc = 1) {
    const dark = new THREE.Color(OAK.orange[1]).multiplyScalar(0.5), ico = new THREE.IcosahedronGeometry(1, 0).toNonIndexed(), ip = ico.attributes.position, b0 = C.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); C.p.push(c.x + x * r * 0.36, c.y + y * r * 0.36 * flat, c.z + z * r * 0.36); const q = new THREE.Vector3(x, y, z).normalize(); C.n.push(q.x, q.y, q.z); C.uv.push(0, 0); C.c.push(dark.r, dark.g, dark.b); C.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = new THREE.Vector3(rr * Math.cos(th), u * flat, rr * Math.sin(th)), rad = r * (0.7 + rT() * 0.32) * (rT() < 0.14 ? 1.25 : 1);
      const nrm = new THREE.Vector3(d.x, d.y / flat * 0.9 + 0.2, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = sz * (0.75 + rT() * 0.5), tn = tones[Math.floor(rT() * tones.length)];
      addCard(B, c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad, a, b, s, s * 1.15, nrm, tint(OAK[tn][Math.floor(rT() * OAK[tn].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.66 + 0.6 * (u * 0.5 + 0.5))));
    }
  }
  const TV = new THREE.Vector3(TX, 0, TZ);
  // trunk: a fluted lathe with root buttresses, the bark painted
  {
    const nY = 44, nA = 56, y0 = -0.35, y1 = 3.45, P = [], N = [], UV = [], I = [];
    const phi = 0.8, R = (y, a) => {
      const lob = Math.pow(0.5 + 0.5 * Math.cos(5 * a + phi), 4.5), base = 0.66 - 0.1 * smooth(y / 3.2) + 0.03 * Math.sin(a * 3 + y * 0.8), flare = 0.6 * Math.exp(-Math.max(0, y) / 0.34) * (0.3 + 0.7 * lob);
      return base + flare + 0.06 * Math.sin(a * 9 + y * 0.9) + 0.035 * Math.sin(a * 17 + y * 1.7) + 0.03 * (fbm(a * 2 + 3, y * 1.4, 41) - 0.5);
    };
    for (let j = 0; j <= nY; j++) for (let i = 0; i <= nA; i++) { const y = y0 + (y1 - y0) * (j / nY), a = (i / nA) * Math.PI * 2, r = R(y, a); P.push(TX + Math.cos(a) * r, y, TZ + Math.sin(a) * r); N.push(0, 1, 0); UV.push((i / nA) * 3, y / 1.7); if (j && i) { const q = (j - 1) * (nA + 1) + i - 1; I.push(q, q + nA + 1, q + 1, q + 1, q + nA + 1, q + nA + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let j = 0; j <= nY; j++) { const a = j * (nA + 1), b = a + nA; const x = (nr.getX(a) + nr.getX(b)) / 2, y = (nr.getY(a) + nr.getY(b)) / 2, z = (nr.getZ(a) + nr.getZ(b)) / 2; nr.setXYZ(a, x, y, z); nr.setXYZ(b, x, y, z); }
    treeParts.push(g);
    // root tubes running out along the buttresses and into the ground
    for (let k = 0; k < 5; k++) {
      const a = (2 * Math.PI * k - phi) / 5 + (rT() - 0.5) * 0.12, L = 0.9 + rT() * 0.8, r0 = R(0.3, a) - 0.1, pts = [[r0 - 0.05, 0.6], [r0 + 0.25 * L, 0.3], [r0 + 0.55 * L, 0.1], [r0 + 0.8 * L, 0.0], [r0 + L, -0.1]].map(([d, h], q) => new THREE.Vector3(TX + Math.cos(a + 0.3 * q * (k % 2 ? 1 : -1) * (0.6 + 0.4 * rT())) * d, h, TZ + Math.sin(a + 0.3 * q * (k % 2 ? 1 : -1)) * d));
      treeParts.push(taperTube(new THREE.CatmullRomCurve3(pts), 0.3, 0.04, 10, 8));
    }
    const top = new THREE.SphereGeometry(0.62, 16, 10); top.translate(TX, 3.3, TZ); const tp = top.attributes.uv; for (let i = 0; i < tp.count; i++) tp.setXY(i, tp.getX(i) * 2, tp.getY(i) * 1.5); treeParts.push(top);
  }
  // limbs (local to the trunk) with twigs and leaf clumps
  {
    const L = (pts, r0, r1) => ({ pts: pts.map(([x, y, z]) => new THREE.Vector3(TX + x, y, TZ + z)), r0, r1 });
    const limbs = [
      L([[0, 3.0, 0], [0.8, 3.3, -0.6], [1.7, 3.55, -1.5], [2.7, 3.85, -2.3], [3.6, 4.3, -3.1]], 0.36, 0.05),    // over the bench (the main limb of the painting; it stops short of the sun)
      L([[0, 3.2, 0], [-0.3, 3.65, -1.4], [-0.8, 4.05, -3.0], [-1.2, 4.6, -4.6], [-1.6, 5.2, -5.8]], 0.3, 0.05),   // over the brink
      L([[0, 3.0, 0], [-0.4, 3.55, 1.6], [0.2, 4.2, 3.4], [0.6, 4.9, 5.2], [0.9, 5.6, 6.8]], 0.3, 0.05),            // east
      L([[0, 3.3, 0], [-1.8, 4.2, 0.4], [-3.8, 5.2, 0.6], [-5.8, 6.2, 0.4]], 0.28, 0.05),                          // -x
      L([[0, 3.2, 0], [0.3, 5.0, 0.2], [0.6, 6.9, -0.2], [0.4, 8.4, -0.4]], 0.26, 0.05),                           // up
      L([[0, 2.7, 0], [1.4, 3.05, 1.2], [3.0, 3.5, 2.4], [4.6, 4.0, 3.2]], 0.26, 0.05),                           // low, +x +z
      L([[0, 3.1, 0], [-1.2, 3.5, -1.1], [-2.6, 4.0, -2.2], [-3.6, 4.6, -3.4]], 0.22, 0.05),                       // -x -z
    ];
    const tones = [MIXT, MIXT, ["gold", "orange", "gold", "red"], MIXT, ["orange", "red", "gold"], ["gold", "gold", "orange"], ["orange", "red", "orange", "gold"]];
    limbs.forEach((lb, li) => {
      const cv = new THREE.CatmullRomCurve3(lb.pts); treeParts.push(taperTube(cv, lb.r0, lb.r1, 16, 8)); const len = cv.getLength(), tn = tones[li];
      const nSt = Math.floor(len / 0.85);
      for (let s = 2; s <= nSt; s++) {
        const t = s / nSt, p = cv.getPoint(t), tg = cv.getTangent(t), out = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        const rr = 0.85 + 0.55 * rT() * (1 - 0.25 * t);
        // the leaf mass: a big clump on and over the limb, a hanging one below it
        clump(leafQ, coreQ, p.clone().add(new THREE.Vector3((rT() - 0.5) * 0.7, 0.45 + rT() * 0.5, (rT() - 0.5) * 0.7)), rr, tn, Math.round(110 + 110 * rr), 0.31, 0.68);
        if (rT() < 0.8) { const q = p.clone().addScaledVector(out, (rT() - 0.5) * 1.8); q.y -= 0.35 + rT() * 0.55; clump(leafQ, coreQ, q, 0.5 + rT() * 0.4, tn, 80, 0.3, 0.8); }
        // a twig off the limb, with a tuft at its end
        if (s % 2 === 0 && t < 0.97) {
          const sd = rT() < 0.5 ? -1 : 1, dir = tg.clone().addScaledVector(out, sd * (0.7 + rT() * 0.6)).add(new THREE.Vector3(0, 0.2 + rT() * 0.25, 0)).normalize(), tl = 1.0 + rT() * 1.1 * (1 - 0.4 * t), r0 = lb.r0 * (1 - 0.8 * t) * 0.55 + 0.03;
          const e = p.clone().addScaledVector(dir, tl); treeParts.push(taperTube(new THREE.CatmullRomCurve3([p.clone(), p.clone().addScaledVector(dir, tl * 0.5).add(new THREE.Vector3(0, 0.1, 0)), e]), Math.max(0.03, r0), 0.02, 6, 6));
          clump(leafQ, coreQ, e.clone().add(new THREE.Vector3(0, 0.25, 0)), 0.65 + rT() * 0.45, tn, 120, 0.3, 0.74);
        }
      }
      const tip = lb.pts[lb.pts.length - 1].clone(); clump(leafQ, coreQ, tip.clone().add(new THREE.Vector3(0, 0.3, 0)), 1.25, tn, 280, 0.33, 0.72); clump(leafQ, coreQ, tip.clone().add(new THREE.Vector3((rT() - 0.5), -0.6, (rT() - 0.5))), 0.7, tn, 110, 0.3, 0.8);
    });
    // the crown on top and a few low strands hanging from the first limbs (the lowest leaves in the paintings)
    for (const [x, y, z, r] of [[0.4, 8.2, -0.4, 1.7], [1.8, 7.6, -1.2, 1.5], [-1.2, 7.4, 0.8, 1.4], [0.8, 7.8, 1.4, 1.4], [-2.4, 6.6, 0.2, 1.3], [2.6, 6.2, -2.0, 1.4]]) clump(leafQ, coreQ, TV.clone().add(new THREE.Vector3(x, y, z)), r, MIXT, 330, 0.34, 0.7);
    for (const [x, y, z, r] of [[1.4, 2.35, -0.7, 0.55], [-0.7, 2.5, -1.5, 0.5], [-1.0, 2.6, -2.7, 0.55], [-1.2, 2.45, 1.9, 0.55], [0.1, 2.5, 3.0, 0.55], [-2.6, 2.8, 0.9, 0.55], [1.4, 2.3, 1.3, 0.5], [-3.4, 2.9, 0.2, 0.6], [-1.6, 2.4, -0.6, 0.5]]) clump(leafQ, coreQ, TV.clone().add(new THREE.Vector3(x, y, z)), r, ["gold", "orange", "red", "gold"], 90, 0.28, 0.82);
    // the hollows (dark ellipsoids set into the bark on the -z and +z faces)
    for (const sd of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), std("#2a190e", { roughness: 1 })); h.scale.set(0.1, 0.19, 0.1); h.position.set(TX + 0.12, 1.95, TZ + sd * 0.62); h.name = "set-hollow"; h.userData.solid = false; add(h); }
  }
  {
    const geos = treeParts.map((g) => { const q = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(q.attributes)) if (!["position", "normal", "uv"].includes(k)) q.deleteAttribute(k); return q; });
    const wm = new THREE.Mesh(mergeGeometries(geos), barkM); wm.castShadow = wm.receiveShadow = true; wm.name = "set-trunk"; add(wm);
    const lm = bufMesh(leafQ, leafMat, true, true); if (lm) { lm.frustumCulled = false; lm.name = "set-oak-leaves"; lm.userData.solid = false; add(lm); }
    const cm = bufMesh(coreQ, coreMat, false, true); if (cm) { cm.frustumCulled = false; cm.userData.solid = false; add(cm); }
  }

  // ---------------------------------------------------------------- shrubs and trees on the slopes and plateau flanks
  const bushLeaf = Buf(), bushCore = Buf(), pines = [];
  function crownAt(x, z, top, r, tones, sz = 0.3) {
    const k = r > 1.6 ? 3 : 2;
    for (let i = 0; i < k; i++) { const a = rS() * 6.28, d = i ? r * (0.35 + rS() * 0.3) : 0, rr = i ? r * (0.5 + rS() * 0.25) : r * 0.75; clump(bushLeaf, bushCore, new THREE.Vector3(x + Math.cos(a) * d, top - r * 0.6 - (i ? rS() * r * 0.25 : 0), z + Math.sin(a) * d), rr, tones, Math.round(34 + 52 * rr), sz * (r > 1.6 ? 1.2 : 1), 0.62); }
  }
  {
    const TB = ["gold", "orange", "red", "gold", "orange", "green"];
    // west slope: crowns whose tops stand above the sight line over the lip (the painted bushes under the brink)
    for (let k = 0; k < 140; k++) {
      const zb = 0.8 + Math.pow(rS(), 1.6) * 62, x = (rS() - 0.5) * 150 * (0.35 + zb / 70), z = lipW(x) - zb;
      const ray = -0.2 * zb, r = 0.7 + zb * 0.06 + rS() * 0.9, top = ray + 0.15 + rS() * (1.0 + zb * 0.05);
      if (Math.abs(x) < 1.2 && zb < 5) continue;
      if (rS() < 0.2 && zb > 6) { pines.push([x, z, top, 0.4 + rS() * 0.4]); continue; }
      crownAt(x, z, top, r, [TB[Math.floor(rS() * TB.length)], TB[Math.floor(rS() * TB.length)], TB[Math.floor(rS() * 3)]], 0.3 + zb * 0.012);
    }
    // east slope
    for (let k = 0; k < 90; k++) {
      const ze = 0.8 + Math.pow(rS(), 1.6) * 55, x = (rS() - 0.5) * 140 * (0.35 + ze / 60), z = lipE(x) + ze, ray = -0.1 * ze - 0.05 * ze * 0.0;
      const r = 0.7 + ze * 0.06 + rS() * 0.9, top = ray + 0.25 + rS() * (1.0 + ze * 0.05);
      if (rS() < 0.2 && ze > 6) { pines.push([x, z, top, 0.4 + rS() * 0.4]); continue; }
      crownAt(x, z, top, r, [TB[Math.floor(rS() * TB.length)], TB[Math.floor(rS() * TB.length)], TB[Math.floor(rS() * 3)]], 0.3 + ze * 0.012);
    }
    // plateau flanks and the lips: shrubs
    const shrub = (x, z, r, tone) => crownAt(x, z, groundY(x, z) + r * 1.35, r, [tone, tone, TB[Math.floor(rS() * 4)]], 0.27);
    const SH = [[-8.5, -2.4, 0.8], [-10.6, -1.4, 1.0], [-6.4, -2.9, 0.65], [5.6, -2.8, 0.7], [7.4, -2.5, 0.9], [9.6, -1.8, 1.1], [11.8, -1.0, 0.9], [-12.4, -0.6, 1.0], [8.6, 4.2, 1.0], [11.4, 3.6, 1.2], [-7.4, 5.0, 1.1], [-10.4, 5.6, 1.2], [9.8, 6.0, 0.9], [-7.4, 6.4, 0.9], [-9.8, 6.0, 0.8], [-5.8, 3.2, 0.8], [-13.4, 3.2, 1.0], [13.8, 1.4, 1.1], [3.8, 4.8, 0.7]];
    SH.forEach(([x, z, r], i) => shrub(x, z, r, ["red", "orange", "gold", "red", "orange"][i % 5]));
    // low autumn bushes right at the brick of the brink (the bright bushes under the lip in the west painting), clear of the seats
    for (let k = 0; k < 22; k++) { const x = -9 + k * 0.85 + (rS() - 0.5) * 0.5; if (Math.abs(x) < 1.7) continue; const z = lipW(x) - 0.2 - rS() * 0.9; crownAt(x, z, -0.1 + rS() * 0.35, 0.5 + rS() * 0.35, [["red", "orange", "gold"][k % 3], "gold"], 0.26); }
    const bl = bufMesh(bushLeaf, bushMat, true, false); if (bl) { bl.frustumCulled = false; bl.userData.solid = false; bl.name = "set-bushes"; add(bl); }
    const bc = bufMesh(bushCore, coreMat, false, true); if (bc) { bc.frustumCulled = false; bc.userData.solid = false; add(bc); }
    // a few dark conifers on the slopes
    const CB = Buf(), colr = new THREE.Color();
    for (const [x, z, y, r] of pines) {
      colr.set(["#2f5a3a", "#3a6a42", "#2a4e36"][Math.floor(rS() * 3)]);
      for (let l = 0; l < 4; l++) { const g = new THREE.ConeGeometry(r * (1 - l * 0.2) * 1.1, r * 1.8, 7).toNonIndexed(), b0 = CB.p.length / 3, p = g.attributes.position, nm = g.attributes.normal; for (let i = 0; i < p.count; i++) { CB.p.push(x + p.getX(i), y - r * 5.2 + r * (0.8 + l * 1.15) + p.getY(i), z + p.getZ(i)); CB.n.push(nm.getX(i), nm.getY(i), nm.getZ(i)); CB.uv.push(0, 0); CB.c.push(colr.r * (0.8 + 0.1 * l), colr.g * (0.8 + 0.1 * l), colr.b * (0.8 + 0.1 * l)); CB.i.push(b0 + i); } g.dispose(); }
    }
    const cm2 = bufMesh(CB, lam("#ffffff", { vertexColors: true }), false, false); if (cm2) { cm2.frustumCulled = false; cm2.userData.solid = false; add(cm2); }
  }

  // ---------------------------------------------------------------- boulders and pebbles
  {
    const rockT = ctex(rockCanvas(rnd), 1, 1), rM = std("#ffffff", { map: rockT, vertexColors: true, roughness: 0.95 });
    const rock = (x, z, r, sy, ry, mossK) => {
      const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, cl = [], col = new THREE.Color(), nv = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        nv.set(p.getX(i), p.getY(i), p.getZ(i)); const k = 1 + 0.2 * (fbm(nv.x * 1.6 + x, nv.y * 1.6 + z, 51) - 0.5) * 2 + 0.07 * Math.sin(nv.x * 6 + nv.z * 5);
        p.setXYZ(i, nv.x * k * r, Math.max(nv.y * k * sy * r, -0.15), nv.z * k * r);
        const top = clamp01((nv.y - 0.15) * 1.8) * mossK * (0.55 + 0.45 * fbm(nv.x * 3, nv.z * 3, 53)); col.set("#ffffff").lerp(new THREE.Color("#7f9a3e"), top).multiplyScalar(0.85 + 0.2 * fbm(nv.x * 4, nv.y * 4, 55)); cl.push(col.r, col.g, col.b);
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals(); g.rotateY(ry);
      const m = new THREE.Mesh(g, rM); m.position.set(x, groundY(x, z) + r * sy * 0.55 - 0.05, z); m.castShadow = m.receiveShadow = true; m.name = "set-rock"; add(m);
    };
    rock(2.1, 2.3, 0.5, 0.62, 0.4, 0.6); rock(2.4, -1.7, 0.38, 0.6, 1.9, 0.5); rock(-3.9, -0.4, 0.55, 0.7, 3.2, 0.9); rock(2.65, 2.0, 0.22, 0.6, 0.7, 0.5);
    const PB = Buf(), pc = new THREE.Color();
    for (let k = 0; k < 400 && PB.p.length < 3 * 4000; k++) {
      const x = -14 + rG() * 22, z = -2.2 + rG() * 8; if (dirtMask(x, z) < 0.75) continue;
      const g = new THREE.IcosahedronGeometry(1, 0).toNonIndexed(), s = 0.025 + rG() * 0.05, p = g.attributes.position, nm = g.attributes.normal, y = groundY(x, z) + 0.012, ry = rG() * 6, c = Math.cos(ry), sn = Math.sin(ry);
      pc.set(["#a89c88", "#8f8676", "#b8a88c", "#9a8e7c"][k % 4]).multiplyScalar(0.9 + rG() * 0.2); const b0 = PB.p.length / 3;
      for (let i = 0; i < p.count; i++) { const px = p.getX(i) * s * 1.3, pz = p.getZ(i) * s, py = p.getY(i) * s * 0.5; PB.p.push(x + px * c - pz * sn, y + py, z + px * sn + pz * c); PB.n.push(nm.getX(i), nm.getY(i), nm.getZ(i)); PB.uv.push(0, 0); PB.c.push(pc.r, pc.g, pc.b); PB.i.push(b0 + i); } g.dispose();
    }
    const pm = bufMesh(PB, lam("#ffffff", { vertexColors: true }), true, true); if (pm) { pm.userData.solid = false; add(pm); }
  }

  // ---------------------------------------------------------------- grass tufts (real blades that bend in the wind) and wildflowers
  const GB = Buf(), FQ = Buf();
  {
    const dens = S.grass ?? 1, blade = (x, y, z, h, w, lean, ang, c0, c1) => {
      const b0 = GB.p.length / 3, ca = Math.cos(ang), sa = Math.sin(ang), lx = ca * lean, lz = sa * lean, px = -sa, pz = ca;
      const pts = [[0, 0, w], [lx * 0.35, h * 0.55, w * 0.7], [lx, h, 0]];
      pts.forEach(([ox, oy, hw], i) => {
        const k = oy / h, cc = c0.clone().lerp(c1, k);
        const ox2 = i === 0 ? 0 : ox, oz2 = i === 0 ? 0 : lz * (i === 1 ? 0.35 : 1);
        for (const sd of i === 2 ? [0] : [-1, 1]) { GB.p.push(x + ox2 + px * hw * sd, y + oy, z + oz2 + pz * hw * sd); GB.n.push(0, 1, 0); GB.uv.push(0, 0); GB.c.push(cc.r, cc.g, cc.b); }
      });
      GB.i.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2, b0 + 2, b0 + 3, b0 + 4);
    };
    const greens = [["#4a6a24", "#a4b840"], ["#5a7a28", "#c8c450"], ["#6a8a2c", "#e0c858"], ["#8a7a2a", "#d8b040"], ["#556a22", "#98b038"], ["#7a6a24", "#cf9a3a"]];
    const tuft = (x, z, sc) => {
      const y = groundY(x, z), n = 6 + Math.floor(rG() * 4), g2 = greens[Math.floor(rG() * greens.length)];
      for (let i = 0; i < n; i++) { const a = rG() * 6.28, d = rG() * 0.06 * sc; blade(x + Math.cos(a) * d, y - 0.01, z + Math.sin(a) * d, (0.16 + rG() * 0.24) * sc, 0.009 + rG() * 0.007, (0.04 + rG() * 0.2) * sc, a + (rG() - 0.5) * 0.8, new THREE.Color(g2[0]).multiplyScalar(0.9 + rG() * 0.2).multiply(WARM), new THREE.Color(g2[1]).multiplyScalar(0.9 + rG() * 0.2).multiply(WARM)); }
    };
    const N = Math.round(7000 * dens);
    for (let k = 0; k < N; k++) {
      const x = -14 + rG() * 28, z = -3.3 + rG() * 11.2, dm = dirtMask(x, z);
      const edge = Math.exp(-Math.pow((z - lipW(x) - 0.3) / 1.1, 2)), tr = Math.exp(-Math.pow(Math.hypot(x - TX, z - TZ) - 2.0, 2) / 3.5), p = 0.5 + 0.45 * edge + 0.4 * tr + 0.15 * smooth((Math.abs(x) - 5) / 6);
      if (rG() > p * Math.pow(1 - dm, 1.4) + 0.05 * dm * dm) continue;
      if (z > lipE(x)) continue;
      tuft(x, z, 0.5 + 0.12 * edge + 0.22 * tr + (Math.abs(x) > 9 ? 0.25 : 0) + (z > 1.5 ? 0.2 : 0));
    }
    if (dens > 0) for (let k = 0; k < 500 * dens; k++) { const x = -12 + rG() * 24, zb = rG() * 1.6; tuft(x, lipW(x) - zb * 0.5, 0.55 + 0.25 * rG()); }   // the lip's fringe, over the edge
    const gm = bufMesh(GB, lam("#ffffff", { vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color("#2e3a10") }), false, true);
    if (gm) { if (wind) gm.material.userData.wind = { amp: 0.09 * wind, h: 0.34, flutter: 1.3 }; gm.frustumCulled = false; gm.userData.solid = false; gm.name = "set-grass"; add(gm); }
    // wildflowers in clusters: white daisies, yellow, a few pink spikes (card flowers on thin stems)
    const fl = S.flowers ?? 1, cols = [["#ffffff", 5], ["#fff7e0", 2], ["#f6d13a", 3], ["#f4a13a", 1], ["#f0f0ff", 1]];
    const cluster = (cx, cz, rad, n, sz = 1) => {
      for (let i = 0; i < n * fl; i++) {
        const a = rF() * 6.28, d = Math.sqrt(rF()) * rad, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (dirtMask(x, z) > 0.55) continue;
        const y = groundY(x, z), h = 0.1 + rF() * 0.2, pick = rF() * 12; let acc = 0, cc = "#ffffff"; for (const [c, w] of cols) { acc += w; if (pick < acc) { cc = c; break; } }
        const nrm = new THREE.Vector3((rF() - 0.5) * 0.4, 0.8, (rF() - 0.5) * 0.4).normalize(), [fa, fb] = frameOf(nrm, rF() * 6.28), s = (0.07 + rF() * 0.05) * sz;
        addCard(FQ, x, y + h, z, fa, fb, s, s, nrm, new THREE.Color(cc));
        blade(x, y - 0.01, z, h, 0.006, 0.01, rF() * 6, new THREE.Color("#4a6a24"), new THREE.Color("#7a9a3a"));
      }
      for (let i = 0; i < n * 0.12 * fl; i++) {   // pink spikes
        const a = rF() * 6.28, d = Math.sqrt(rF()) * rad, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (dirtMask(x, z) > 0.55) continue; const y = groundY(x, z), hh = 0.3 + rF() * 0.25;
        for (let q = 0; q < 7; q++) { const nrm = new THREE.Vector3((rF() - 0.5), 0.3, (rF() - 0.5)).normalize(), [fa, fb] = frameOf(nrm, rF() * 6.28); addCard(FQ, x + (rF() - 0.5) * 0.02, y + hh * (0.4 + 0.6 * q / 7), z + (rF() - 0.5) * 0.02, fa, fb, 0.05 * (1 - q * 0.08), 0.05, nrm, tint(["#d8508a", "#c4469a", "#e06aa0"][q % 3], rF)); }
        blade(x, y - 0.01, z, hh, 0.007, 0.02, rF() * 6, new THREE.Color("#4a6a24"), new THREE.Color("#6a8a30"));
      }
    };
    cluster(-1.3, 2.7, 0.9, 60, 1.1); cluster(2.0, 2.7, 0.9, 50, 1.1); cluster(-3.4, 0.2, 1.5, 70); cluster(-3.8, 2.0, 1.2, 55); cluster(2.4, -2.0, 0.9, 40); cluster(1.4, -2.7, 1.8, 50); cluster(-2.0, -2.6, 1.6, 45);
    cluster(0.4, -2.7, 1.2, 40); cluster(5.5, 1.0, 1.6, 55); cluster(-6.2, -1.8, 1.4, 40); cluster(4.8, -2.4, 1.3, 40); cluster(-0.2, 4.3, 2.0, 55); cluster(3.6, 3.8, 1.8, 45); cluster(-8.5, 2.4, 2, 45); cluster(2.2, 2.0, 0.8, 40);
    for (let k = 0; k < 6; k++) cluster(-11 + rF() * 22, -1 + rF() * 5, 1.5, 24);
    const fm = bufMesh(FQ, flowerMat, false, true); if (fm) { if (wind) fm.material.userData.wind = { amp: 0.035 * wind, h: 0.3, flutter: 1.4 }; fm.frustumCulled = false; fm.userData.solid = false; add(fm); }
  }

  // ---------------------------------------------------------------- fallen leaves (decals on the dirt and grass) and falling leaves
  const LCOL = ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a"], flatN = new THREE.Vector3(0, 1, 0);
  const ndrop = S.leaves ?? 12, drift = [];
  {
    const LD = Buf(), nF = Math.round(900 * (S.fallen ?? 1));
    for (let i = 0; i < nF; i++) {
      const trunkPile = rL() < 0.3, a = rL() * 6.28, d = 0.9 + rL() * rL() * 4.5;
      const x = trunkPile ? TX + Math.cos(a) * d * 1.3 : -13 + rL() * 24, z = trunkPile ? TZ + Math.sin(a) * d * 0.9 : -2.6 + rL() * 8.5;
      if (z > lipE(x) - 0.2 || z < lipW(x) - 0.6) continue;
      const [fa, fb] = frameOf(flatN, rL() * 6.28), s = 0.1 + rL() * 0.09;
      addCard(LD, x, groundY(x, z) + 0.02 + rL() * 0.01, z, fa, fb, s, s * 1.15, flatN, tint(LCOL[Math.floor(rL() * LCOL.length)], rL, 0.014, 0.08, 0.08));
    }
    const lm = bufMesh(LD, lam("#ffffff", { map: oakT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), false, true); if (lm) { lm.userData.solid = false; add(lm); }
    const geo = new THREE.PlaneGeometry(0.17, 0.2), dm = LCOL.map((c) => lam(new THREE.Color(c), { map: oakT, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#2a1204") }));
    for (let i = 0; i < ndrop; i++) {
      const o = new THREE.Mesh(geo, dm[i % dm.length]); o.castShadow = true; o.userData.solid = false; o.frustumCulled = false; set.add(o);
      drift.push({ o, T: 9 + (i * 5 % 6), ph: (i * 0.6180339) % 1, x0: -3.2 + 6.4 * ((i * 0.381966) % 1), z0: -3.0 + 4.6 * ((i * 0.7548776) % 1), h0: 4.6 + (i % 4) * 0.35, sw: 0.5 + (i % 4) * 0.28, sp: 1.2 + (i % 5) * 0.45 });
    }
  }
  // ---------------------------------------------------------------- birds (a flock crossing the west sky right to left)
  const nBirds = S.birds ?? 5, birds = [], birdAt = S.birdAt ?? 176, birdDur = S.birdDur ?? 14, birdMat = basic({ color: time === "sunset" ? "#3a2438" : "#4a3026", side: THREE.DoubleSide });
  {
    const wing = new THREE.BufferGeometry(); wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1.35, 0.42, 0, 1.0, -0.02, 0, 0, 0, 0, 1.0, -0.02, 0, 0.3, -0.3, 0], 3)); wing.computeVertexNormals();
    for (let i = 0; i < nBirds; i++) {
      const g = new THREE.Group(), wl = new THREE.Mesh(wing, birdMat), wr = new THREE.Mesh(wing, birdMat); wr.scale.x = -1; g.add(wl, wr); g.scale.setScalar(1.4 + (i % 3) * 0.25); g.visible = false; g.frustumCulled = false; wl.frustumCulled = wr.frustumCulled = false; g.userData.solid = false; set.add(g);
      birds.push({ g, wl, wr, dx: i * 5.5 + (i % 2) * 2, dy: ((i * 7) % 5) * 1.3 - 2.4, dz: (i % 3) * 4, ph: i * 1.3 });
    }
  }
  // ---------------------------------------------------------------- the painted far cards
  const cards = [];
  function farCard(name, file, ref, o = {}) {
    const DC = HILL.cardDist, tV = Math.tan(ref.fov * DEG / 2), Wp = 2 * DC * tV * (16 / 9), kpx = Wp / 1536, Hp = 1024 * kpx;
    const padL = 512, padT = 330, padB = 182, CW = 1536 + 2 * padL, CH = 1024 + padT + padB, dir = ref.dir;   // dir -1 = looks down -z
    const hor = o.horizon, lift = DC * Math.tan((o.lift ?? 0) * DEG);
    const yTop = ref.pos[1] + lift + hor * Hp;                       // world y of the painting's top row
    const cx = ref.pos[0], cz = ref.pos[2] + dir * DC;
    const yc = yTop - (CH / 2 - padT) * kpx - 0;                    // the padded canvas's centre row sits (CH/2 - padT) px under the painting's top
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: o.color ?? "#fff4e4" }); mat.userData.noOutline = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CW * kpx, CH * kpx), mat); mesh.name = "set-backdrop-" + name; mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.userData.solid = false;
    const grp = new THREE.Group(); grp.name = "set-backdrop-group-" + name; grp.userData.solid = false;
    const px = (u, v) => new THREE.Vector3(cx + (u - 768) * kpx * (dir < 0 ? 1 : -1), yTop - v * kpx, cz);   // world of painting pixel (u, v)
    mesh.position.set(cx, yc, cz); if (dir > 0) mesh.rotation.y = Math.PI; grp.add(mesh); add(grp);
    // roll about a painting pixel so a line in it becomes level (the viaduct deck)
    if (o.roll) { const pv = px(o.rollAt[0], o.rollAt[1]); grp.position.copy(pv); mesh.position.sub(pv); grp.rotation.z = o.roll; }
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/" + file).then((img) => {
      const [c, g] = canvas(CW, CH);
      for (const gx of [-1, 0, 1]) for (const gy of [-1, 0, 1]) {   // the painting, and mirrored copies round it so its edge carries on (no seam)
        g.save(); g.translate(padL + (gx > 0 ? 3072 : 0), padT + (gy > 0 ? 2048 : 0)); g.scale(gx ? -1 : 1, gy ? -1 : 1); g.drawImage(img, 0, 0); g.restore();
      }
      const id = g.getImageData(0, 0, CW, CH), d = id.data;   // feather the card's outer edge into the dome
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const e = Math.min(x, CW - 1 - x, y, CH - 1 - y) / 170, a = smooth(e); d[(y * CW + x) * 4 + 3] = Math.round(a * 255); }
      g.putImageData(id, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true;
    }));
    return { px, kpx, grp, mesh };
  }
  if (S.backdrop !== false) {
    const tintE = time === "sunset" ? "#ffc0c0" : "#fff4e4";
    if (view !== "east") {
      const ref = time === "sunset" ? { pos: HILL.cams["47"].pos, fov: 36, dir: -1 } : { pos: HILL.cams["43"].pos, fov: 38, dir: -1 };
      const sunset = time === "sunset", roll = sunset && S.deckLevel !== false ? -DECK.rollDeg * DEG : 0;   // clockwise on screen: the deck rises to the right in the painting
      const c = farCard("west", sunset ? "HT-W2.webp" : "HT-W.webp", ref, { horizon: sunset ? DECK.horizonRow : 0.358, lift: 0, roll, rollAt: DECK.mid });
      cards.push(c);
      if (!sunset && S.shimmer !== false) {   // gold glints on the painted river (golden card): flicker as a function of the frame time
        const river = [[700, 335], [790, 322], [870, 328], [920, 352], [945, 392], [968, 432], [968, 462]], gm = basic({ color: "#ffe9a0", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
        const rg = rng(seed * 5 + 3);
        for (let i = 0; i < 36; i++) {
          const f = rg() * (river.length - 1), k = Math.min(river.length - 2, Math.floor(f)), t = f - k, u = river[k][0] + (river[k + 1][0] - river[k][0]) * t + (rg() - 0.5) * 22, v = river[k][1] + (river[k + 1][1] - river[k][1]) * t + (rg() - 0.5) * 9;
          const m = new THREE.Mesh(new THREE.PlaneGeometry((6 + rg() * 16) * c.kpx, 1.8 * c.kpx), gm); m.position.copy(c.px(u, v)); m.position.z += 1.0; m.renderOrder = 0; m.frustumCulled = false; m.userData.solid = false; set.add(m);
          drift.push({ glint: m, ph: rg() * 6.28, sp: 1.1 + rg() * 1.6, base: m.scale.x });
        }
      }
    }
    if (view !== "west") cards.push(farCard("east", "HT-E.webp", { pos: HILL.cams.east.pos, fov: 38, dir: 1 }, { horizon: 0.358, lift: 0.8, color: tintE }));
  }

  // ---------------------------------------------------------------- the clock
  const tick = (t) => {
    for (const d of drift) {
      if (d.glint) { const s = 0.35 + 0.65 * Math.max(0, Math.sin(t * d.sp + d.ph) * Math.sin(t * d.sp * 0.53 + d.ph * 2)); d.glint.scale.set(s * 1.4, 0.5 + s * 0.5, 1); continue; }
      const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28, sc = smooth(u * 12) * smooth((1 - u) * 20);
      d.o.position.set(d.x0 + 1.4 * u + d.sw * Math.sin(ang), d.h0 * (1 - u) + 0.04, d.z0 + 0.5 * Math.cos(ang * 0.8)); d.o.scale.setScalar(sc + 1e-3);
      d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8);
    }
    birds.forEach((b, i) => {
      const u = (t - birdAt - b.dx * 0.12) / birdDur; b.g.visible = u > 0 && u < 1;
      if (!b.g.visible) return;
      b.g.position.set(60 - 120 * u + b.dx * 0.3, 9.5 + b.dy + 0.6 * Math.sin(u * 9 + b.ph), -62 - b.dz + b.dx * 0.5); 
      const fl = Math.sin(t * 7.5 + b.ph) * 0.55; b.wl.rotation.z = fl; b.wr.rotation.z = -fl; b.g.rotation.z = 0.05 * Math.sin(u * 7 + i);
    });
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  if (S.stats) { let n = 0; const by = {}; set.traverse((o) => { if (o.geometry) { const t = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; n += t; by[o.name || o.material.type] = (by[o.name || o.material.type] || 0) + Math.round(t); } }); console.log("diag: scorehill triangles", Math.round(n), JSON.stringify(by)); }
  return set;
}

// the sunset card's viaduct (painting pixels of plates/painted/HT-W2.webp, 1536 x 1024): the parapet's top line runs from (685, 442) to (1536, 402)
const DECK = { a: [685, 442], b: [1536, 402], mid: [1110, 422], horizonRow: 0.424, rollDeg: Math.atan2(442 - 402, 1536 - 685) / DEG };
HILL.deck = DECK;

// where the sunset card's viaduct deck (the parapet's top, painting pixels DECK.a .. DECK.b, leveled by deckLevel) lies in the world when the
// train runs at `depth` metres from the 47 camera (the `scoretrain` prop is 250 m away: its origin y is the parapet line, z the track's near face)
export function viaductLine(depth = 250) {
  const ref = HILL.cams["47"], DC = HILL.cardDist, k = (2 * DC * Math.tan(18 * DEG) * (16 / 9)) / 1536, yTop = ref.pos[1] + DECK.horizonRow * 1024 * k, s = depth / DC;
  const y = ref.pos[1] + (yTop - DECK.mid[1] * k - ref.pos[1]) * s, x = (u) => ref.pos[0] + (u - 768) * k * s;
  return { z: ref.pos[2] - depth, y, x0: x(DECK.a[0]), x1: x(DECK.b[0]), px: DECK };
}
