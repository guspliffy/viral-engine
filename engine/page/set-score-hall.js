import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scorehall": Mash's old flat's hallway on moving day, a sunny autumn morning, for "I could see everyone's happiness score"
// (Happiness 03, place HA, panels 02 03 04). REAL 3D geometry with hand-painted canvas textures (plates/painted/HA.webp is the look target).
// A 7 x 8.6 m hall: warm plaster over dark panelled wainscot, a plank floor with a braided oval rug, a wooden staircase on the LEFT
// (closed panelled string, newels with ball tops, balusters, handrail, a landing), a tall sash window with a 3 x 5 glazing grid in the BACK
// wall (its bars cast a real window-light grid on the floor), the front door opening in the back wall to the right of it, a brass wall lantern,
// closed taped moving boxes stacked at the back and by the stair foot, potted plants, a planter pedestal, an interior door with a coat and a
// picture on the right wall. Through the window and the door: a front garden (flagged path, low stone wall, gate pillars, shrubs), autumn
// maples, the street (pavement, kerb, cobbles) and a terrace of houses across it, a painted sky dome. Dust motes drift in the light shafts.
//
// COORDINATES (metres, y up). The camera of the normal shots stands in the room looking toward -z (the back wall).
//   floor y 0 (planks along x, the rug on it at y 0.014); room x -3.40 .. 3.60, z -3.00 (back wall's inner face) .. 5.60 (front wall), ceiling y 3.40
//   back wall z -3.00 .. -3.42 (stone outside); window x -0.10..1.00, y 1.10..2.90 (centre 0.45), glazing bars cast shadows
//   front door opening x 1.97..3.01, y 0..2.05; the `frontdoor` prop hinges on the RIGHT jamb: see HALL.frontdoor (rot 180: its outside face looks
//     out to -z; open it by its `open` param and it swings INTO the hall, lying along the right wall at z -3.1..-2.1)
//   stoop (outside) x 1.35..3.65, z -3.42..-4.35, top y 0 (level with the floor); one step down (0.2) to the garden path y -0.2, z -4.35 .. -7.0;
//   garden wall z -7.0 (gate gap x 1.7..3.4 between two pillars); pavement z -7.35..-9.9; kerb; cobbled road y -0.35, z -10.1 .. -16.5 (a parked
//   boxvan: HALL.van); far kerb and pavement; the terrace faces +z at z -19.5.
//   stairs: x -3.40..-2.35 along the left wall, first riser at z 0.90, 10 treads (0.27 deep, 0.20 high) then a landing z -1.8..-3.0 at y 2.20;
//   handrail line x -2.325; the planter pedestal at (-3.10, 1.60); boxes by the stair foot at (-2.95, 2.45).
//
// spec (every key optional):
//   seed 5        the painted textures and the layout of leaves, plants and boxes
//   key           the sun's position (ONLY for the shafts and motes; set "key" on the set for the light too): default [-3.4, 4.6, -7.6]
//   wind 1        leaves shiver (0 off)
//   motes 70      dust motes in the light (0 none)
//   shafts true   the soft additive light shafts from the window
//   garden true   the 3D outdoors (false: just a sky behind the window and door)
//   trees true    the maples outside
//   boxes true    the moving boxes and plants
// Light: set "light": "golden", "key": [-3.4, 4.6, -7.6] (low sun BEHIND the window: the window grid lands on the floor, skewed to the right),
// "shadowSize": 6 (the shadow map is centred on the origin), "windows": false (looks.js must not paint its own sun patches).
// Nothing is solid for the checks except the walls, floor, stair, boxes, pedestal and furniture; rug, plants, glass, light and leaves are scenery.
// Triangles: about 120k (leaf cards 60 %); every part is merged by material.
//
// Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks) only.

export const HALL = {
  x: [-3.4, 3.6], z: [-3.0, 5.6], ceilY: 3.4, window: { x: 0.45, w: 1.1, y0: 1.1, y1: 2.9 },
  door: { x0: 1.97, x1: 3.01, h: 2.05 },
  frontdoor: { kind: "frontdoor", x: 3.0, y: 0, z: -3.12, rot: 180, w: 1.0, h: 2.0, color: "#2f5d3a" },   // x = the hinge (right jamb); open > 0 swings it into the hall
  stoop: { x: [1.35, 3.65], z: [-3.42, -4.35], y: 0 }, pathY: -0.2, roadY: -0.35,
  van: { x: 3.5, y: -0.35, z: -13.3, rotPlusX: 90, rotMinusX: -90 },
  keepbox: { x: 0.05, y: 0, z: 1.65 }, rug: { x: 0.25, z: 1.75, w: 2.6, d: 1.7 },
  stand: {
    spudKneel: [-0.65, 1.45], mashWalk: [[0.2, -0.3], [2.2, -1.9]], mashDoor: [2.5, -3.3], mashStoop: [2.5, -3.85],
  },
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
function ctex(c, rx = 1, ry = 1, repeat = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); return t;
}
const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }); m.userData.noOutline = true; return m; };
const lam = (color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function fitRun(rnd, total, lo, hi) {
  const a = []; let s = 0;
  while (s < total - hi) { const v = lo + rnd() * (hi - lo); a.push(v); s += v; }
  a.push(total - s); if (a[a.length - 1] < lo * 0.6 && a.length > 1) { const l = a.pop(); a[a.length - 1] += l; }
  return a;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); const o = { r: Math.round(c.r ** (1 / 2.2) * 255 * k), g: Math.round(c.g ** (1 / 2.2) * 255 * k), b: Math.round(c.b ** (1 / 2.2) * 255 * k) }; return `rgb(${Math.min(255, o.r)},${Math.min(255, o.g)},${Math.min(255, o.b)})`; };

// ================================================================================================================ painters
// warm plaster: trowel mottling, soft stains, a few hairline cracks. Tiles (every blob drawn wrapped).
function plasterCanvas(rnd, base, S = 1024, k = 1) {
  const [c, g] = canvas(S, S); g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 200; i++) {
    const cx = rnd() * S, cy = rnd() * S, rx = 30 + rnd() * 130, ry = 18 + rnd() * 70, a = (0.012 + rnd() * 0.03) * k, warm = rnd() < 0.5, rot = rnd() * 3;
    g.fillStyle = warm ? `rgba(150,108,70,${a})` : `rgba(255,248,230,${a * 1.3})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.ellipse(cx + ox, cy + oy, rx, ry, rot, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 26; i++) { const x = rnd() * S, y = rnd() * S, L = 80 + rnd() * 240, a = (rnd() - 0.5) * 0.5; g.strokeStyle = `rgba(255,248,232,${0.05 + rnd() * 0.06})`; g.lineWidth = 5 + rnd() * 9; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2 + 10, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,66,44,${0.05 + rnd() * 0.1})`; g.fillRect(rnd() * S, rnd() * S, 1.4, 1.4); }
  for (let k = 0; k < 3; k++) { let x = rnd() * S, y = rnd() * S * 0.5; g.strokeStyle = "rgba(96,70,48,0.2)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 7; j++) { x += (rnd() - 0.5) * 26; y += 18 + rnd() * 26; g.lineTo(x, y); } g.stroke(); }
  return c;
}
function grain(g, x, y, w, h, vertical, rnd, n, dark = "52,28,12", light = "200,140,88") {
  for (let i = 0; i < n; i++) {
    const len = (0.25 + rnd() * 0.75) * (vertical ? h : w), off = rnd() * (vertical ? w : h), st = rnd() * ((vertical ? h : w) - len);
    g.strokeStyle = `rgba(${rnd() < 0.62 ? dark : light},${0.05 + rnd() * 0.13})`; g.lineWidth = 0.7 + rnd() * 1.8; g.beginPath();
    if (vertical) { g.moveTo(x + off, y + st); g.quadraticCurveTo(x + off + (rnd() - 0.5) * 6, y + st + len / 2, x + off + (rnd() - 0.5) * 3, y + st + len); }
    else { g.moveTo(x + st, y + off); g.quadraticCurveTo(x + st + len / 2, y + off + (rnd() - 0.5) * 6, x + st + len, y + off + (rnd() - 0.5) * 3); }
    g.stroke();
  }
}
// dark walnut wainscot: stiles, rails and bevelled recessed panels. The canvas is 2.4 m wide x 1.2 m tall (4 panels of 0.6 m).
function wainscotCanvas(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), ppm = W / 2.4, Y = (m) => H - m * ppm;
  g.fillStyle = "#5a3820"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) {
    const x0 = i * 0.6 * ppm, k = 0.92 + rnd() * 0.16, base = ["#6c4529", "#64402a", "#704a2c", "#5f3c24"][i];
    const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, shade(base, k * 1.1)); lg.addColorStop(1, shade(base, k * 0.85)); g.fillStyle = lg; g.fillRect(x0, 0, 0.6 * ppm, H);
    grain(g, x0, 0, 0.07 * ppm, H, true, rnd, 14); grain(g, x0 + 0.53 * ppm, 0, 0.07 * ppm, H, true, rnd, 14);
    grain(g, x0, Y(0.17), 0.6 * ppm, 0.17 * ppm, false, rnd, 16); grain(g, x0, 0, 0.6 * ppm, Y(0.92), false, rnd, 18);
    const rx0 = x0 + 0.07 * ppm, rx1 = x0 + 0.53 * ppm, ry0 = Y(0.91), ry1 = Y(0.17), bv = 0.032 * ppm;
    const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
    poly([[rx0, ry0], [rx1, ry0], [rx1 - bv, ry0 + bv], [rx0 + bv, ry0 + bv]], "rgba(28,14,6,0.6)");
    poly([[rx0, ry0], [rx0 + bv, ry0 + bv], [rx0 + bv, ry1 - bv], [rx0, ry1]], "rgba(28,14,6,0.4)");
    poly([[rx0, ry1], [rx1, ry1], [rx1 - bv, ry1 - bv], [rx0 + bv, ry1 - bv]], "rgba(236,176,112,0.4)");
    poly([[rx1, ry0], [rx1, ry1], [rx1 - bv, ry1 - bv], [rx1 - bv, ry0 + bv]], "rgba(236,176,112,0.22)");
    const fg = g.createLinearGradient(0, ry0, 0, ry1); fg.addColorStop(0, shade(base, k * 0.78)); fg.addColorStop(1, shade(base, k * 0.95));
    g.fillStyle = fg; g.fillRect(rx0 + bv, ry0 + bv, rx1 - rx0 - 2 * bv, ry1 - ry0 - 2 * bv);
    grain(g, rx0 + bv, ry0 + bv, rx1 - rx0 - 2 * bv, ry1 - ry0 - 2 * bv, true, rnd, 22);
    const sh = g.createLinearGradient(0, ry0 + bv, 0, ry0 + bv + 0.05 * ppm); sh.addColorStop(0, "rgba(20,8,2,0.35)"); sh.addColorStop(1, "rgba(20,8,2,0)"); g.fillStyle = sh; g.fillRect(rx0 + bv, ry0 + bv, rx1 - rx0 - 2 * bv, 0.05 * ppm);
    g.fillStyle = "rgba(240,190,130,0.22)"; g.fillRect(x0, 0, 2, H); g.fillStyle = "rgba(20,8,2,0.4)"; g.fillRect(x0 + 0.6 * ppm - 2, 0, 2, H);
  }
  g.fillStyle = "rgba(20,8,2,0.28)"; g.fillRect(0, Y(0.17) - 2, W, 4); g.fillRect(0, Y(0.92) - 2, W, 4);
  return c;
}
// glossy walnut-brown planks along u (0.19 m wide, butt joints staggered), grain, knots, nail heads, a sheen band. 4 m square.
function floorCanvas(rnd) {
  const S = 2048, [c, g] = canvas(S, S), ppm = S / 4, rows = Math.round(0.19 * 0 + 4 / 0.19), rh = S / rows;
  const pal = ["#8c5a34", "#7a4a2a", "#966238", "#835230", "#6f4326", "#9c6a3e", "#7d4e2c"];
  g.fillStyle = "#2c180c"; g.fillRect(0, 0, S, S);
  for (let r = 0; r < rows; r++) {
    const y = r * rh; let x = 0;
    for (const len of fitRun(rnd, S, 0.9 * ppm, 2.4 * ppm)) {
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.93 + rnd() * 0.14;
      const lg = g.createLinearGradient(0, y, 0, y + rh); lg.addColorStop(0, shade(base, k * 1.12)); lg.addColorStop(0.5, shade(base, k)); lg.addColorStop(1, shade(base, k * 0.86));
      g.fillStyle = lg; g.fillRect(x + 2, y + 2, len - 4, rh - 4);
      g.save(); g.beginPath(); g.rect(x + 2, y + 2, len - 4, rh - 4); g.clip(); grain(g, x, y, len, rh, false, rnd, 26);
      if (rnd() < 0.4) { const kx = x + rnd() * len, ky = y + rh * (0.25 + rnd() * 0.5); g.fillStyle = "rgba(40,20,8,0.3)"; g.beginPath(); g.ellipse(kx, ky, 10 + rnd() * 12, 5 + rnd() * 4, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(40,20,8,0.18)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(kx, ky, 22, 10, 0, 0, 7); g.stroke(); }
      const sh = g.createLinearGradient(x, 0, x + len, 0); sh.addColorStop(0, "rgba(255,226,180,0)"); sh.addColorStop(0.5, `rgba(255,226,180,${0.04 + rnd() * 0.07})`); sh.addColorStop(1, "rgba(255,226,180,0)"); g.fillStyle = sh; g.fillRect(x, y + rh * 0.15, len, rh * 0.4);
      g.restore();
      g.fillStyle = "rgba(255,226,186,0.3)"; g.fillRect(x + 2, y + 2, len - 4, 2);
      for (const nx of [x + 12, x + len - 12]) { g.fillStyle = "rgba(30,16,8,0.55)"; g.beginPath(); g.arc(nx, y + rh * 0.3, 2.2, 0, 7); g.arc(nx, y + rh * 0.7, 2.2, 0, 7); g.fill(); }
      x += len;
    }
  }
  return c;
}
// warm stair / post wood (grain along u), 1 m tile
function woodCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S); const lg = g.createLinearGradient(0, 0, 0, S); lg.addColorStop(0, "#b06e3a"); lg.addColorStop(1, "#9a5c30"); g.fillStyle = lg; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "60,30,12" : "230,170,110"},${0.05 + rnd() * 0.06})`; g.fillRect(0, rnd() * S, S, 10 + rnd() * 50); }
  grain(g, 0, 0, S, S, false, rnd, 190); g.fillStyle = "rgba(255,226,190,0.1)"; g.fillRect(0, 0, S, 3);
  return c;
}
// kraft cardboard atlas: 4 x 2 cells of 256 px. Row 0 = sides (plain, label, marker scribbles, red stripes); row 1 = tops (seam across the middle).
function boxAtlas(rnd) {
  const S = 1024, [c, g] = canvas(S, S / 2), N = 256;
  for (let ci = 0; ci < 8; ci++) {
    const x0 = (ci % 4) * N, y0 = Math.floor(ci / 4) * N, top = ci >= 4, kr = 0.94 + rnd() * 0.1;
    g.save(); g.beginPath(); g.rect(x0, y0, N, N); g.clip();
    g.fillStyle = shade(["#c79c64", "#c0955d", "#cca36c", "#b98f5a"][ci % 4], kr); g.fillRect(x0, y0, N, N);
    for (let i = 0; i < 120; i++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? "110,74,36" : "238,208,160"},${0.07 + rnd() * 0.1})`; g.lineWidth = 1; g.beginPath(); const x = x0 + rnd() * N, y = y0 + rnd() * N; g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 36, y + (rnd() - 0.5) * 5); g.stroke(); }
    if (!top) for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(120,80,40,0.07)"; g.fillRect(x0, y0 + i * 26, N, 6); }
    if (top) { g.fillStyle = "rgba(70,44,20,0.75)"; g.fillRect(x0, y0 + N / 2 - 1.5, N, 3); g.fillStyle = "rgba(255,230,190,0.3)"; g.fillRect(x0, y0 + N / 2 + 1.5, N, 2); g.fillStyle = "rgba(90,58,26,0.15)"; g.fillRect(x0, y0, N, 8); g.fillRect(x0, y0 + N - 8, N, 8); }
    else if (ci % 4 === 1) { g.fillStyle = "#efe6d2"; g.fillRect(x0 + 60, y0 + 110, 130, 84); g.fillStyle = "rgba(40,36,34,0.8)"; for (let i = 0; i < 18; i++) g.fillRect(x0 + 70 + i * 5.4, y0 + 168, 1.5 + (i % 3), 18); g.fillStyle = "rgba(40,36,34,0.55)"; g.fillRect(x0 + 70, y0 + 122, 90, 4); g.fillRect(x0 + 70, y0 + 134, 60, 4); g.fillStyle = "#b23a2e"; g.fillRect(x0 + 74, y0 + 148, 70, 5); }
    else if (ci % 4 === 2) { g.strokeStyle = "rgba(30,28,30,0.82)"; g.lineWidth = 6; g.lineCap = "round"; for (let l = 0; l < 2; l++) { g.beginPath(); let x = x0 + 38, y = y0 + 90 + l * 58; g.moveTo(x, y); for (let j = 0; j < 7; j++) { x += 20; y += (rnd() - 0.5) * 30; g.lineTo(x, y + (j % 2 ? 14 : -14)); } g.stroke(); } g.lineWidth = 7; g.beginPath(); g.moveTo(x0 + 200, y0 + 210); g.lineTo(x0 + 200, y0 + 160); g.moveTo(x0 + 184, y0 + 176); g.lineTo(x0 + 200, y0 + 158); g.lineTo(x0 + 216, y0 + 176); g.stroke(); }
    else if (ci % 4 === 3) { g.fillStyle = "rgba(178,58,46,0.78)"; for (let i = 0; i < 3; i++) g.fillRect(x0 + 40, y0 + 90 + i * 30, 176, 12); }
    const eg = g.createLinearGradient(x0, 0, x0 + 18, 0); eg.addColorStop(0, "rgba(80,50,22,0.28)"); eg.addColorStop(1, "rgba(80,50,22,0)"); g.fillStyle = eg; g.fillRect(x0, y0, 18, N);
    const eg2 = g.createLinearGradient(x0 + N, 0, x0 + N - 18, 0); eg2.addColorStop(0, "rgba(80,50,22,0.28)"); eg2.addColorStop(1, "rgba(80,50,22,0)"); g.fillStyle = eg2; g.fillRect(x0 + N - 18, y0, 18, N);
    g.restore();
  }
  return c;
}
// a braid: chevron strands, near-white (tinted by vertex colour), dark gaps. 8 stitches across the tile
function braidCanvas() {
  const [c, g] = canvas(256, 128); g.fillStyle = "#4a4640"; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 8; i++) for (const [cy, rot] of [[36, 0.62], [92, -0.62]]) {
    const cx = i * 32 + (cy > 64 ? 16 : 0) + 8, gr = g.createLinearGradient(cx - 14, cy - 28, cx + 14, cy + 28); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#b9b4aa");
    for (const ox of [0, -256, 256]) { g.fillStyle = gr; g.beginPath(); g.ellipse(cx + ox, cy, 15, 33, rot, 0, 7); g.fill(); g.strokeStyle = "rgba(40,36,30,0.55)"; g.lineWidth = 3; g.stroke(); g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(cx + ox - 2, cy - 2, 8, 24, rot, 0, 7); g.stroke(); }
  }
  return c;
}
function leafCanvas() {   // an ovate green leaf with a midrib (tinted by vertex colour)
  const [c, g] = canvas(64, 128); const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, "#d8d8d8"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(1, "#cfcfcf");
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(70, 34, 60, 90, 32, 124); g.bezierCurveTo(4, 90, -6, 34, 32, 2); g.fill();
  g.strokeStyle = "rgba(90,90,90,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 120); g.lineTo(32, 10); g.stroke();
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(32, 100 - i * 18); g.lineTo(14, 86 - i * 18); g.moveTo(32, 100 - i * 18); g.lineTo(50, 86 - i * 18); g.stroke(); }
  return c;
}
function mapleCanvas() {
  const S = 128, [c, g] = canvas(S, S), cx = 64, cy = 66;
  const gr = g.createLinearGradient(20, 20, 108, 108); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#cfcfcf"); g.fillStyle = gr; g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) { const t = a - Math.PI / 2, lobe = Math.abs(Math.cos(2.5 * t)) ** 0.75, r = 55 * (0.34 + 0.66 * lobe) * (1 + 0.07 * Math.sin(a * 22)); const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * 0.98; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.closePath(); g.fill(); g.strokeStyle = "rgba(90,90,90,0.5)"; g.lineWidth = 2.2;
  for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + k * (Math.PI * 2 / 5); g.beginPath(); g.moveTo(cx, cy + 10); g.lineTo(cx + Math.cos(t) * 42, cy + Math.sin(t) * 42); g.stroke(); }
  g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx, 126); g.stroke(); return c;
}
function daisyCanvas() {
  const [c, g] = canvas(64, 64); g.fillStyle = "#ffffff";
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 13, 5.5, a, 0, 7); g.fill(); }
  g.fillStyle = "#6a6a6a"; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill(); return c;
}
function moteCanvas() { const [c, g] = canvas(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; }
function shaftCanvas() {   // soft across (u), fades along the beam (v: window 0 -> floor 1)
  const [c, g] = canvas(64, 128), id = g.createImageData(64, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { const u = Math.sin((x / 63) * Math.PI) ** 0.8, v = y / 127, a = smooth(v / 0.08) * (1 - smooth((v - 0.35) / 0.65)) * u, i = (y * 64 + x) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; id.data[i + 3] = Math.round(a * 255); }
  g.putImageData(id, 0, 0); return c;
}
function stoneCanvas(rnd, S = 1024, M = 3.2, mortar = "#6b5a42", pal = ["#c9aa72", "#bf9d66", "#d0b583", "#b79c78", "#c4ae88", "#a8957c", "#cdb07a", "#b4966a"]) {
  const [c, g] = canvas(S, S), ppm = S / M, m = Math.max(1.5, S / 700);
  g.fillStyle = mortar; g.fillRect(0, 0, S, S); let y = 0;
  for (const rh of fitRun(rnd, S, 0.22 * ppm, 0.3 * ppm)) {
    let x = 0;
    for (const w of fitRun(rnd, S, 0.3 * ppm, 0.95 * ppm)) {
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.88 + rnd() * 0.22, gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, shade(base, k * 1.08)); gr.addColorStop(1, shade(base, k * 0.9));
      g.fillStyle = gr; g.beginPath(); g.roundRect(x + m, y + m, w - 2 * m, rh - 2 * m, 3); g.fill();
      for (let i = 0; i < 7; i++) { const cx = x + rnd() * w, cy = y + rnd() * rh, rr = (0.12 + rnd() * 0.3) * Math.min(w, rh * 2.2), tc = [[150, 112, 62], [120, 98, 76], [255, 240, 200]][i % 3], rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr), al = 0.1 + rnd() * 0.12; rg.addColorStop(0, `rgba(${tc},${al})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
      for (let i = 0; i < Math.round(w * rh / 420); i++) { g.fillStyle = rnd() < 0.7 ? `rgba(76,58,38,${0.14 + rnd() * 0.2})` : `rgba(255,246,220,${0.12 + rnd() * 0.14})`; g.fillRect(x + rnd() * w, y + rnd() * rh, 1 + rnd() * 2, 1 + rnd() * 2); }
      g.fillStyle = "rgba(255,246,218,0.35)"; g.fillRect(x + m, y + m, w - 2 * m, Math.min(rh * 0.3, 7));
      x += w;
    }
    y += rh;
  }
  return c;
}
function flagCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S), ppm = S / 6; g.fillStyle = "#6d6157"; g.fillRect(0, 0, S, S);
  const pal = ["#c9ad94", "#bea48e", "#d1b69c", "#b5a090", "#c4ae9c", "#cfb8a0"]; let y = 0;
  for (const rh of fitRun(rnd, S, 0.42 * ppm, 0.85 * ppm)) {
    let x = 0;
    for (const w of fitRun(rnd, S, 0.8 * ppm, 1.8 * ppm)) {
      g.fillStyle = shade(pal[Math.floor(rnd() * pal.length)], 0.95 + rnd() * 0.1); g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, rh - 6, 8); g.fill();
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,64,54,${0.1 + rnd() * 0.16})`; g.beginPath(); g.arc(x + 6 + rnd() * (w - 12), y + 6 + rnd() * (rh - 12), 1 + rnd() * 1.8, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,240,222,0.3)"; g.fillRect(x + 6, y + 4, w - 12, 2);
      if (rnd() < 0.5) for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(104,138,56,${0.35 + rnd() * 0.3})`; g.beginPath(); g.ellipse(x + rnd() * w, y + 2 + rnd() * 3, 4 + rnd() * 9, 2 + rnd() * 2, 0, 0, 7); g.fill(); }
      x += w;
    }
    y += rh;
  }
  return c;
}
function cobbleCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S), NR = 14, NC = 12, rh = S / NR, cw = S / NC; g.fillStyle = "#4e4856"; g.fillRect(0, 0, S, S);
  const pal = ["#a39aa6", "#948c9c", "#b2a8aa", "#857f90", "#bcaea6", "#9a929a"];
  for (let r = 0; r < NR; r++) for (let q = -1; q <= NC; q++) {
    const off = (r % 2) * cw / 2, x = q * cw + off + (rnd() - 0.5) * 5, y = r * rh + (rnd() - 0.5) * 4, w = cw * 0.88, h = rh * 0.88, base = pal[Math.floor(rnd() * pal.length)], k = 0.92 + rnd() * 0.16;
    for (const ox of [0, -S, S]) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(base, k * 1.12)); gr.addColorStop(1, shade(base, k * 0.86)); g.fillStyle = gr; g.beginPath(); g.roundRect(x + ox + 3, y + 3, w - 3, h - 3, 12); g.fill(); }
  }
  return c;
}
function grassCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S); g.fillStyle = "#88a84a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) { const cx = rnd() * S, cy = rnd() * S, r = 30 + rnd() ** 2 * 120, col = ["#6f9a3e", "#a6b84c", "#c2b04a", "#5d8a3a"][i % 4]; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, col + "70"); gr.addColorStop(1, col + "00"); g.fillStyle = gr; g.fillRect(cx + ox - r, cy + oy - r, 2 * r, 2 * r); } }
  for (let i = 0; i < 3000; i++) { const x = rnd() * S, y = rnd() * S, l = 5 + rnd() * 9; g.strokeStyle = rnd() < 0.5 ? "rgba(52,100,44,0.4)" : "rgba(214,232,130,0.35)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - l); g.stroke(); }
  return c;
}
function skyCanvas(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#4f93d6"); gr.addColorStop(0.5, "#86bce6"); gr.addColorStop(0.9, "#cfe4ee"); gr.addColorStop(1, "#f1ead2"); g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2);
  g.fillStyle = "#8a9a62"; g.fillRect(0, hz, W, hz);
  for (let k = 0; k < 11; k++) { const u = (k + rnd() * 0.8) / 11 * W, base = hz - (60 + rnd() * 240), n = 8 + Math.floor(rnd() * 10); for (let i = 0; i < n; i++) { const cx = u + (rnd() - 0.5) * 150, cy = base - rnd() * 24, r = 14 + rnd() * 26; for (const ox of [-W, 0, W]) { const q = g.createRadialGradient(cx + ox - r * 0.25, cy - r * 0.3, r * 0.1, cx + ox, cy, r); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.7, "rgba(246,248,252,0.9)"); q.addColorStop(1, "rgba(236,242,250,0)"); g.fillStyle = q; g.beginPath(); g.ellipse(cx + ox, cy, r * 1.5, r, 0, 0, 7); g.fill(); } } }
  const hg = g.createLinearGradient(0, hz - 24, 0, hz + 10); hg.addColorStop(0, "rgba(241,234,210,0)"); hg.addColorStop(0.7, "rgba(241,234,210,0.55)"); hg.addColorStop(1, "rgba(241,234,210,0)"); g.fillStyle = hg; g.fillRect(0, hz - 24, W, 34);
  return c;
}
function pictureCanvas(rnd) {   // a small autumn landscape in a frame
  const [c, g] = canvas(256, 192), sk = g.createLinearGradient(0, 0, 0, 100); sk.addColorStop(0, "#8fb6d8"); sk.addColorStop(1, "#f0dcb0"); g.fillStyle = sk; g.fillRect(0, 0, 256, 192);
  g.fillStyle = "#8a9a62"; g.beginPath(); g.moveTo(0, 100); g.quadraticCurveTo(70, 70, 140, 96); g.quadraticCurveTo(200, 112, 256, 84); g.lineTo(256, 192); g.lineTo(0, 192); g.fill();
  g.fillStyle = "#c9a14a"; g.beginPath(); g.moveTo(0, 130); g.quadraticCurveTo(120, 104, 256, 138); g.lineTo(256, 192); g.lineTo(0, 192); g.fill();
  for (let i = 0; i < 7; i++) { const x = 20 + i * 34 + rnd() * 10, y = 112 + rnd() * 30; g.fillStyle = "#5a3a22"; g.fillRect(x - 2, y, 4, 22); g.fillStyle = ["#d9631c", "#e8a21f", "#b8321a"][i % 3]; g.beginPath(); g.arc(x, y - 4, 14 + rnd() * 6, 0, 7); g.fill(); }
  return c;
}
function glassSheenCanvas() { const [c, g] = canvas(128, 256); g.fillStyle = "rgba(255,255,255,0.1)"; g.fillRect(0, 0, 128, 256); g.fillStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.moveTo(10, 0); g.lineTo(48, 0); g.lineTo(0, 150); g.lineTo(0, 60); g.fill(); g.fillStyle = "rgba(255,255,255,0.09)"; g.beginPath(); g.moveTo(70, 0); g.lineTo(84, 0); g.lineTo(20, 256); g.lineTo(6, 256); g.fill(); return c; }

// ================================================================================================================ geometry builders
function Buf() { return { p: [], n: [], uv: [], c: [], i: [] }; }
function bufMesh(B, mat, cast = true, recv = true) {
  if (!B.p.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(B.c, 3)); g.setIndex(B.i); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; return m;
}
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _n = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
const WHITE = new THREE.Color(1, 1, 1), V = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (hex) => new THREE.Color(hex);
// a box with matrix M (position + rotation), size w,h,d; uv = (local corner + centre) / uvK on each face (continuous in world metres when unrotated)
function addBoxM(B, M, w, h, d, c = WHITE, uvK = 1.2) {
  const px = M.elements[12], py = M.elements[13], pz = M.elements[14], hx = w / 2, hy = h / 2, hz = d / 2;
  const faces = [
    [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], 2, 1], [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], 2, 1],
    [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], 0, 2], [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], 0, 2],
    [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], 0, 1], [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], 0, 1],
  ];
  for (const [nm, cs, ua, va] of faces) {
    const b = B.p.length / 3; _n.set(...nm).transformDirection(M);
    for (const cc of cs) { _v.set(...cc).applyMatrix4(M); B.p.push(_v.x, _v.y, _v.z); B.n.push(_n.x, _n.y, _n.z); B.uv.push((cc[ua] + (ua === 0 ? px : ua === 2 ? pz : py)) / uvK, (cc[va] + (va === 1 ? py : va === 2 ? pz : px)) / uvK); B.c.push(c.r, c.g, c.b); }
    B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
}
function addBox(B, x, y, z, w, h, d, c = WHITE, ry = 0, rz = 0, uvK = 1.2) { addBoxM(B, new THREE.Matrix4().compose(V(x, y, z), _q.clone().setFromEuler(_e.set(0, ry, rz, "YXZ")), _one), w, h, d, c, uvK); }
function addBeam(B, a, b, w, h, c = WHITE, uvK = 1.2) {   // a box from a to b (length along its z), w wide (x), h tall (y)
  const z = b.clone().sub(a), L = z.length(); z.normalize();
  const x = new THREE.Vector3().crossVectors(Math.abs(z.y) > 0.98 ? V(1, 0, 0) : V(0, 1, 0), z).normalize(), y = new THREE.Vector3().crossVectors(z, x);
  const M = new THREE.Matrix4().makeBasis(x, y, z); M.setPosition(a.clone().add(b).multiplyScalar(0.5)); addBoxM(B, M, w, h, L, c, uvK);
}
const UVFULL = [0, 0, 1, 1];
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, c, uv = UVFULL) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2, c4 = [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]];
  for (const [a, d, u, v] of c4) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(c.r, c.g, c.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _up = V(0, 1, 0), _alt = V(1, 0, 0);
function frameOf(n, spin) {
  _t1.crossVectors(Math.abs(n.y) > 0.95 ? _alt : _up, n).normalize(); _t2.crossVectors(n, _t1).normalize();
  const c = Math.cos(spin), s = Math.sin(spin); return [_t1.clone().multiplyScalar(c).addScaledVector(_t2, s), _t2.clone().multiplyScalar(c).addScaledVector(_t1, -s)];
}
const tint = (hex, rnd, dh = 0.012, ds = 0.06, dl = 0.07) => new THREE.Color(hex).offsetHSL((rnd() - 0.5) * dh * 2, (rnd() - 0.5) * ds * 2, (rnd() - 0.5) * dl * 2);
function mergedGeo(parts, mat, cast = true) {
  if (!parts.length) return null;
  const geo = mergeGeometries(parts.map(([g, M]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(M); for (const k of Object.keys(q.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") q.deleteAttribute(k); return q; }));
  const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = true; return o;
}
const M4 = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
const Yaxis = V(0, 1, 0);
function segMat(a, b, r0, r1) { const d = b.clone().sub(a), L = d.length(); return [new THREE.CylinderGeometry(r1, r0, L, 7), new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Yaxis, d.normalize()), _one.clone())]; }

// ================================================================================================================ the set
export function buildScoreHall(scene, S = {}) {
  const seed = S.seed ?? 5, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scorehall"; scene.add(set);
  scene.background = new THREE.Color("#a8cfe8"); scene.fog = null;
  const add = (o, solid = true) => { if (o) { if (!solid) o.userData.solid = false; set.add(o); } return o; };
  const rT = rng(seed * 57 + 2), rF = rng(seed * 91 + 3), rB = rng(seed * 113 + 4), rW = rng(seed * 31 + 1);
  const wind = S.wind ?? 1, KEY = (S.key || [-3.4, 4.6, -7.6]), HX = HALL.x, HZ = HALL.z, CY = HALL.ceilY, WIN = HALL.window, DR = HALL.door;
  const EM = (h) => new THREE.Color(h);

  // ---------------------------------------------------------------- materials
  const plasterT = ctex(plasterCanvas(rnd, "#dccbae", 1024, 0.8)), plasterM = std("#ffffff", { map: plasterT, vertexColors: true, emissive: EM("#3a2a1a") });
  const whiteM = std("#ffffff", { map: ctex(plasterCanvas(rnd, "#efe8d8", 512, 0.3)), vertexColors: true, roughness: 0.55, emissive: EM("#3a3226") });
  const wainBase = wainscotCanvas(rnd);
  const wainM = std("#ffffff", { map: ctex(wainBase), vertexColors: true, roughness: 0.5, side: THREE.DoubleSide, emissive: EM("#3a2010") });
  const stringM = std("#ffffff", { map: ctex(wainBase), roughness: 0.5, side: THREE.DoubleSide, emissive: EM("#4a2810") });
  const woodT = ctex(woodCanvas(rnd)), woodM = std("#ffffff", { map: woodT, vertexColors: true, roughness: 0.55, emissive: EM("#4a2810") }), woodPlain = std("#ffffff", { map: woodT, roughness: 0.5, emissive: EM("#2a160a") });
  const floorM = std("#ffffff", { map: ctex(floorCanvas(rnd)), vertexColors: true, roughness: 0.5, emissive: EM("#2a1608") });
  const stoneT = ctex(stoneCanvas(rnd, 1024, 3.2)), stoneM = std("#ffffff", { map: stoneT, vertexColors: true, emissive: EM("#3a2a18") });
  const flagM = std("#ffffff", { map: ctex(flagCanvas(rnd)), vertexColors: true, emissive: EM("#3a2614") });
  const cobM = std("#ffffff", { map: ctex(cobbleCanvas(rnd)), vertexColors: true, emissive: EM("#2e2428") });
  const boxT = ctex(boxAtlas(rnd), 1, 1, false), boxM = std("#ffffff", { map: boxT, vertexColors: true, roughness: 0.9, side: THREE.DoubleSide, emissive: EM("#3a2a14") });
  const tapeM = std("#d6b782", { roughness: 0.3, emissive: EM("#3a2c18"), side: THREE.DoubleSide });
  const braidM = std("#ffffff", { map: ctex(braidCanvas()), vertexColors: true, roughness: 1, emissive: EM("#2a1a12"), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mapleT = ctex(mapleCanvas(), 1, 1, false), daisyT = ctex(daisyCanvas(), 1, 1, false), leafT = ctex(leafCanvas(), 1, 1, false);
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: EM("#6a3208") });
  if (wind) leafMat.userData.wind = { amp: 0.045 * wind, h: 0, flutter: 1.7 };
  const plantMat = lam("#ffffff", { map: leafT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: EM("#1c3a10") });
  const flowerMat = lam("#ffffff", { map: daisyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: EM("#3a2a24") });
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: EM("#4a2208") });
  const brass = std("#c9a04a", { roughness: 0.3, metalness: 0.6 }), clay = std("#b8683c", { roughness: 0.9, emissive: EM("#2a1208") }), soil = std("#3a2a1c");
  const coat = std("#ffffff", { vertexColors: true, roughness: 0.95 });

  // ---------------------------------------------------------------- sky and the ground outside
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 48, 24), basic({ map: ctex(skyCanvas(rnd), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sky.position.set(0, 0, -20); sky.renderOrder = -1000; sky.frustumCulled = false; sky.name = "set-scorehall-sky"; add(sky, false);
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), std("#7f9a4a", { map: ctex(grassCanvas(rnd), 100, 100), roughness: 1, emissive: EM("#3a3010") }));
  gm.rotation.x = -Math.PI / 2; gm.position.set(0, -0.23, -150); gm.receiveShadow = true; add(gm, false);

  // ---------------------------------------------------------------- the room's shell
  const PL = Buf(), WH = Buf(), ST = Buf(), FL = Buf(), WD = Buf(), BX = Buf();
  const pc = (r = 0.04) => { const k = 1 + (rW() - 0.5) * r * 2; return new THREE.Color(k, k, k); };
  // floor slab and the sill / stoop (stone, top y 0)
  addBox(FL, (HX[0] + HX[1]) / 2, -0.05, (HZ[0] + HZ[1]) / 2, HX[1] - HX[0], 0.1, HZ[1] - HZ[0], WHITE, 0, 0, 4);
  // back wall around the window and the door: [x0, x1, y0, y1]
  for (const [x0, x1, y0, y1] of [[-3.7, -0.1, -0.4, 4.55], [-0.1, 1.0, -0.4, WIN.y0], [-0.1, 1.0, WIN.y1, 4.55], [1.0, DR.x0, -0.4, 4.55], [DR.x0, DR.x1, DR.h, 4.55], [DR.x1, 3.9, -0.4, 4.55]]) {
    addBox(PL, (x0 + x1) / 2, (y0 + y1) / 2, -3.21, x1 - x0, y1 - y0, 0.42, pc(), 0, 0, 2);
    addBox(ST, (x0 + x1) / 2, (y0 + y1) / 2, -3.43, x1 - x0, y1 - y0, 0.02, pc(0.06), 0, 0, 3.2);
  }
  addBox(PL, -3.55, 2.075, 1.3, 0.3, 4.95, 8.8, pc(), 0, 0, 2);                               // left wall
  addBox(PL, 3.75, 2.075, 1.3, 0.3, 4.95, 8.8, pc(), 0, 0, 2);                                // right wall
  addBox(PL, 0.1, 2.075, 5.75, 7.6, 4.95, 0.3, pc(), 0, 0, 2);                                // front wall
  addBox(WH, 0.8, 3.475, 1.25, 6.2, 0.15, 8.84, pc(), 0, 0, 2); addBox(WH, -3.0, 3.475, 3.0, 1.4, 0.15, 5.7, pc(), 0, 0, 2);   // ceiling (the stairwell stays open)
  addBox(PL, -3.0, 4.475, -1.3, 1.4, 0.15, 4.2, pc(), 0, 0, 2);                               // the floor above the stairwell
  addBox(ST, 2.5, -0.1, -3.2, DR.x1 - DR.x0, 0.2, 0.42, WHITE, 0, 0, 3.2);                    // the door sill
  addBox(ST, (HALL.stoop.x[0] + HALL.stoop.x[1]) / 2, -0.11, (HALL.stoop.z[0] + HALL.stoop.z[1]) / 2, HALL.stoop.x[1] - HALL.stoop.x[0], 0.22, HALL.stoop.z[0] - HALL.stoop.z[1], WHITE, 0, 0, 3.2);
  // cornice (cream) and the baseboard / wainscot cap (walnut)
  const cornice = (x, z, w, d) => addBox(WH, x, CY - 0.06, z, w, 0.12, d, WHITE, 0, 0, 2);
  cornice(0.1, -2.96, 7.0, 0.1); cornice(3.55, 1.3, 0.1, 8.6); cornice(0.1, 5.55, 7.0, 0.1); cornice(-3.35, 3.0, 0.1, 5.2);
  const wcol = col("#4a2c18");
  const trim = (x, z, w, d) => { addBox(WD, x, 0.07, z, w, 0.14, d, wcol, 0, 0, 1); addBox(WD, x, 1.05 + 0.02, z, w + (w > d ? 0 : 0.03), 0.045, d + (w > d ? 0.03 : 0), wcol, 0, 0, 1); };
  // wainscot runs (cards): back wall in three pieces (the door gap and the window below keep it), right wall (a gap for the interior door), front, left
  const wain = (a, b, wall) => {
    const hh = 1.05, mid = (a + b) / 2, len = b - a, g = col("#ffffff");
    if (wall === "back") { addCard(WH.__w ||= Buf(), mid, hh / 2, -2.99, V(1, 0, 0), V(0, 1, 0), len, hh, V(0, 0, 1), g, [a / 2.4, 0, b / 2.4, hh / 1.2]); trim(mid, -2.975, len, 0.05); }
    if (wall === "front") { addCard(WH.__w ||= Buf(), mid, hh / 2, 5.59, V(-1, 0, 0), V(0, 1, 0), len, hh, V(0, 0, -1), g, [-b / 2.4, 0, -a / 2.4, hh / 1.2]); trim(mid, 5.575, len, 0.05); }
    if (wall === "right") { addCard(WH.__w ||= Buf(), 3.59, hh / 2, mid, V(0, 0, 1), V(0, 1, 0), len, hh, V(-1, 0, 0), g, [a / 2.4, 0, b / 2.4, hh / 1.2]); trim(3.575, mid, 0.05, len); }
    if (wall === "left") { addCard(WH.__w ||= Buf(), -3.39, hh / 2, mid, V(0, 0, -1), V(0, 1, 0), len, hh, V(1, 0, 0), g, [-b / 2.4, 0, -a / 2.4, hh / 1.2]); trim(-3.375, mid, 0.05, len); }
  };
  wain(-2.35, -0.1, "back"); wain(-0.1, 1.0, "back"); wain(1.0, DR.x0 - 0.1, "back"); wain(DR.x1 + 0.1, 3.6, "back");
  wain(-3.0, 0.5, "right"); wain(1.5, 5.6, "right"); wain(-3.4, 3.6, "front"); wain(0.9, 5.6, "left");
  // ---------------------------------------------------------------- window: casing, sill, sash, glazing grid (the bars cast the floor's light grid), glass
  {
    const wx0 = WIN.x - WIN.w / 2, wx1 = WIN.x + WIN.w / 2, cw = col("#ece2cc");
    addBox(WH, WIN.x, WIN.y1 + 0.05, -2.985, WIN.w + 0.28, 0.1, 0.035, cw, 0, 0, 1); addBox(WH, wx0 - 0.07, (WIN.y0 + WIN.y1) / 2, -2.985, 0.1, WIN.y1 - WIN.y0 + 0.2, 0.035, cw, 0, 0, 1); addBox(WH, wx1 + 0.07, (WIN.y0 + WIN.y1) / 2, -2.985, 0.1, WIN.y1 - WIN.y0 + 0.2, 0.035, cw, 0, 0, 1);
    addBox(WH, WIN.x, WIN.y0 - 0.02, -2.9, WIN.w + 0.34, 0.045, 0.2, cw, 0, 0, 1);   // the stool
    addBox(WH, WIN.x, WIN.y0 - 0.12, -2.985, WIN.w + 0.12, 0.14, 0.035, cw, 0, 0, 1);
    const zf = -3.2, fw = 0.06;   // sash frame in the reveal
    addBox(WH, wx0 + fw / 2, (WIN.y0 + WIN.y1) / 2, zf, fw, WIN.y1 - WIN.y0, 0.07, cw, 0, 0, 1); addBox(WH, wx1 - fw / 2, (WIN.y0 + WIN.y1) / 2, zf, fw, WIN.y1 - WIN.y0, 0.07, cw, 0, 0, 1);
    addBox(WH, WIN.x, WIN.y0 + fw / 2, zf, WIN.w, fw, 0.07, cw, 0, 0, 1); addBox(WH, WIN.x, WIN.y1 - fw / 2, zf, WIN.w, fw, 0.07, cw, 0, 0, 1);
    for (let i = 1; i < 3; i++) addBox(WH, wx0 + (WIN.w * i) / 3, (WIN.y0 + WIN.y1) / 2, zf, 0.035, WIN.y1 - WIN.y0, 0.06, cw, 0, 0, 1);
    for (let j = 1; j < 5; j++) addBox(WH, WIN.x, WIN.y0 + ((WIN.y1 - WIN.y0) * j) / 5, zf, WIN.w, 0.035, 0.06, cw, 0, 0, 1);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ map: ctex(glassSheenCanvas(), 1, 1, false), transparent: true, opacity: 0.9, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    gl.material.userData.noOutline = true; gl.position.set(WIN.x, (WIN.y0 + WIN.y1) / 2, zf + 0.04); gl.castShadow = false; gl.renderOrder = 3; add(gl, false);
  }
  // the front door's casing (the door itself is the `frontdoor` prop)
  {
    const cc = col("#8e8186"), wz = -2.985; addBox(WH, DR.x0 - 0.05, DR.h / 2, wz, 0.1, DR.h + 0.1, 0.035, cc, 0, 0, 1); addBox(WH, DR.x1 + 0.05, DR.h / 2, wz, 0.1, DR.h + 0.1, 0.035, cc, 0, 0, 1); addBox(WH, (DR.x0 + DR.x1) / 2, DR.h + 0.06, wz, DR.x1 - DR.x0 + 0.3, 0.12, 0.04, cc, 0, 0, 1);
    addBox(WH, (DR.x0 + DR.x1) / 2, DR.h + 0.01, -3.2, DR.x1 - DR.x0, 0.05, 0.4, cc, 0, 0, 1);   // the head lining
    addBox(WD, 2.5, 0.012, -3.2, DR.x1 - DR.x0, 0.025, 0.42, col("#7a5a3a"), 0, 0, 1);            // the worn threshold board
  }
  // wall lantern between window and door: brass frame, warm glass
  {
    const lx = 1.5, ly = 2.0, lz = -2.93; addBox(WD, lx, ly + 0.1, lz - 0.02, 0.05, 0.28, 0.02, col("#b08a3a"), 0, 0, 1);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.2, 6), basic({ color: "#ffe2a0" })); lb.position.set(lx, ly, lz + 0.03); lb.userData.glow = true; add(lb, false);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.09, 6), brass); cap.position.set(lx, ly + 0.145, lz + 0.03); add(cap);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; addBox(WD, lx + Math.cos(a) * 0.066, ly, lz + 0.03 + Math.sin(a) * 0.066, 0.012, 0.21, 0.012, col("#a07c34"), 0, 0, 1); }
  }

  // ---------------------------------------------------------------- the staircase (left): solid blocks, treads, closed panelled string, newels, balusters, handrail
  {
    const RH = 0.2, TD = 0.27, Z0 = 0.9, XL = -3.4, XR = -2.35, RX = -2.325, nose = (z) => 0.2 + (Z0 - z) * (RH / TD);
    for (let n = 0; n < 11; n++) {
      const zf = Z0 - n * TD, top = (n + 1) * RH, land = n === 10, zb = land ? -3.0 : zf - TD, d = zf - zb, zc = (zf + zb) / 2, k = 0.9 + rB() * 0.15;
      addBox(WD, (XL + XR) / 2, top / 2 - 0.02, zc, XR - XL, top - 0.04, d, col("#6a3f22"), 0, 0, 1);
      addBox(WD, (XL + XR + 0.06) / 2, top - 0.0175, zc + (land ? 0 : -0.0), XR - XL + 0.06, 0.035, d + 0.07, new THREE.Color(k, k * 0.98, k * 0.96), 0, 0, 1);
    }
    // closed string on the open side: panelled, rising with the stair
    const sh = new THREE.Shape(); sh.moveTo(-0.95, 0); sh.lineTo(3.0, 0); sh.lineTo(3.0, 2.25); sh.lineTo(1.8, 2.25); sh.lineTo(-0.95, nose(0.95) + 0.05); sh.closePath();
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); sg.rotateY(Math.PI / 2); sg.translate(XR, 0, 0);
    { const pp = sg.attributes.position, uu = sg.attributes.uv; for (let i = 0; i < pp.count; i++) uu.setXY(i, -pp.getZ(i) / 2.4, pp.getY(i) / 1.2); }
    const sm = new THREE.Mesh(sg, stringM); sm.castShadow = sm.receiveShadow = true; sm.name = "set-stairstring"; add(sm);
    addBeam(WD, V(XR + 0.025, nose(0.95) + 0.07, 0.95), V(XR + 0.025, 2.27, -1.8), 0.09, 0.045, col("#5a3520"), 1);   // string cap
    addBox(WD, XR + 0.025, 2.27, -2.4, 0.09, 0.045, 1.2, col("#5a3520"), 0, 0, 1);
    // newels (bottom, landing) with ball tops; balusters; handrail
    const balls = [], newel = (z, y0, h) => { addBox(WD, RX, y0 + h / 2, z, 0.11, h, 0.11, col("#7a4526"), 0, 0, 1); addBox(WD, RX, y0 + h - 0.04, z, 0.15, 0.05, 0.15, col("#6a3a20"), 0, 0, 1); addBox(WD, RX, y0 + 0.14, z, 0.15, 0.08, 0.15, col("#6a3a20"), 0, 0, 1); balls.push([new THREE.SphereGeometry(0.07, 14, 10), M4(RX, y0 + h + 0.045, z)]); };
    newel(1.0, 0, 1.22); newel(-1.8, 2.2, 1.0); newel(-2.95, 2.2, 1.0);
    for (let z = 0.8; z > -1.75; z -= 0.135) addBox(WD, RX, (nose(z) + 0.07 + nose(z) + 0.9 - 0.03) / 2, z, 0.028, 0.9 - 0.1, 0.028, col("#7c4a2a"), 0, 0, 1);
    for (let z = -1.95; z > -2.9; z -= 0.135) addBox(WD, RX, (2.2 + 3.1 - 0.03) / 2, z, 0.028, 0.87, 0.028, col("#7c4a2a"), 0, 0, 1);
    addBeam(WD, V(RX, nose(1.0) + 0.9, 1.0), V(RX, 3.1, -1.8), 0.075, 0.06, col("#8a5430"), 1); addBox(WD, RX, 3.1, -2.4, 0.075, 0.06, 1.2, col("#8a5430"), 0, 0, 1);
    const bm = mergedGeo(balls, woodPlain); if (bm) { bm.name = "set-newelballs"; add(bm); }
    addBox(WD, -3.37, 0.1, 0.3, 0.05, 0.2, 2.2, col("#4a2c18"), 0, 0, 1);   // skirting along the stair's wall
  }

  // ---------------------------------------------------------------- interior door, coat, picture on the right wall; a picture on the back wall
  {
    const dz = 1.0, dc = col("#7a4c30"), cc = col("#5a3520");
    addBox(WD, 3.57, 1.025, dz, 0.04, 2.05, 0.9, dc, 0, 0, 1);
    for (const [py, ph] of [[0.55, 0.62], [1.4, 0.7], [1.88, 0.2]]) for (const pz of [-0.19, 0.19]) { addBox(WD, 3.545, py, dz + pz, 0.012, ph, 0.28, col("#6a3f26"), 0, 0, 1); }
    addBox(WD, 3.565, 2.1, dz, 0.05, 0.1, 1.08, cc, 0, 0, 1); addBox(WD, 3.565, 1.05, dz - 0.52, 0.05, 2.1, 0.08, cc, 0, 0, 1); addBox(WD, 3.565, 1.05, dz + 0.52, 0.05, 2.1, 0.08, cc, 0, 0, 1);
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), brass); kn.position.set(3.51, 1.0, dz - 0.34); add(kn);
    // coat hooks on a board, a navy coat
    addBox(WD, 3.57, 1.78, 2.35, 0.03, 0.09, 1.1, col("#4a2c18"), 0, 0, 1);
    for (const z of [1.95, 2.35, 2.75]) { const pg = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), brass); pg.position.set(3.5, 1.78, z); add(pg); }
    const CB = Buf(), nv = col("#34455c"), nv2 = col("#2a394e");
    addBox(CB, 3.5, 1.3, 2.35, 0.1, 0.9, 0.42, nv, 0, 0, 1); addBox(CB, 3.5, 1.05, 2.35, 0.11, 0.5, 0.5, nv2, 0, 0, 1);
    for (const s of [-1, 1]) addBox(CB, 3.5, 1.15, 2.35 + s * 0.25, 0.09, 0.75, 0.13, nv2, 0, 0.04 * s, 1);
    addBox(CB, 3.49, 1.75, 2.35, 0.14, 0.12, 0.32, nv2, 0, 0, 1);
    add(bufMesh(CB, coat));
    // picture (right wall)
    const fr = col("#6a4226"); addBox(WD, 3.58, 1.85, -0.9, 0.04, 0.62, 0.82, fr, 0, 0, 1);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), std("#ffffff", { map: ctex(pictureCanvas(rnd), 1, 1, false), roughness: 0.6 })); pm.rotation.y = -Math.PI / 2; pm.position.set(3.555, 1.85, -0.9); add(pm);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), pm.material); p2.position.set(-1.45, 1.75, -2.985); addBox(WD, -1.45, 1.75, -2.99, 0.54, 0.42, 0.03, fr, 0, 0, 1); p2.position.z = -2.97; add(p2);
  }

  // ---------------------------------------------------------------- moving boxes (closed, taped) and plants
  const wallStuff = [];
  function cardBox(x, y, z, w, h, d, ry, ci = null) {
    const c = Math.cos(ry), s = Math.sin(ry), ex = V(c, 0, -s), ez = V(s, 0, c), up = V(0, 1, 0), P = V(x, y, z), side = () => { const k = Math.floor(rB() * 4); return [(k % 4) / 4, 0, (k % 4) / 4 + 0.25, 0.5]; }, tp = () => { const k = Math.floor(rB() * 4); return [k / 4, 0.5, k / 4 + 0.25, 1]; };
    const g = new THREE.Color(0.94 + rB() * 0.12, 0.94 + rB() * 0.12, 0.94 + rB() * 0.12);
    const face = (cen, t1, t2, fw, fh, nrm, uv) => addCard(BX, cen.x, cen.y, cen.z, t1, t2, fw, fh, nrm, g, uv);
    face(P.clone().addScaledVector(ez, d / 2).addScaledVector(up, h / 2), ex, up, w, h, ez, side()); face(P.clone().addScaledVector(ez, -d / 2).addScaledVector(up, h / 2), ex.clone().negate(), up, w, h, ez.clone().negate(), side());
    face(P.clone().addScaledVector(ex, w / 2).addScaledVector(up, h / 2), ez.clone().negate(), up, d, h, ex, side()); face(P.clone().addScaledVector(ex, -w / 2).addScaledVector(up, h / 2), ez, up, d, h, ex.clone().negate(), side());
    face(P.clone().addScaledVector(up, h), ex, ez.clone().negate(), w, d, up, tp());
    // lower edge shadow strip is in the atlas edges; tape: across the top seam and down both long sides
    const tw = 0.05; addCard(WH.__t ||= Buf(), P.x + up.x * (h + 0.003), P.y + h + 0.003, P.z, ex, ez.clone().negate(), w + 0.004, tw, up, WHITE);
    for (const sg of [1, -1]) { const cen = P.clone().addScaledVector(ez, sg * (d / 2 + 0.003)).addScaledVector(up, h - 0.11); addCard(WH.__t, cen.x, cen.y, cen.z, sg > 0 ? ex : ex.clone().negate(), up, tw, 0.22, ez.clone().multiplyScalar(sg), WHITE); }
  }
  if (S.boxes !== false) {
    // behind the window: a box with the plant on top, and a stack of two (the painting's group)
    cardBox(-0.6, 0, -2.68, 0.62, 0.52, 0.5, 0.04); cardBox(0.62, 0, -2.66, 0.66, 0.5, 0.52, -0.03); cardBox(0.66, 0.5, -2.68, 0.52, 0.44, 0.44, 0.08);
    cardBox(-1.4, 0, -2.7, 0.56, 0.42, 0.5, -0.05);
    // right wall, by the door's swing: a stack of three
    cardBox(3.25, 0, -1.2, 0.5, 0.46, 0.6, 1.5 + 0.03); cardBox(3.25, 0.46, -1.18, 0.46, 0.4, 0.55, 1.5 - 0.05); cardBox(3.28, 0.86, -1.2, 0.4, 0.34, 0.48, 1.5 + 0.08);
    // by the stair foot (left foreground)
    cardBox(-2.9, 0, 2.5, 0.6, 0.5, 0.52, 0.06); cardBox(-2.88, 0.5, 2.48, 0.52, 0.44, 0.46, -0.07); cardBox(-2.85, 0, 3.15, 0.5, 0.4, 0.44, 0.1);
    // along the front wall (behind the camera)
    cardBox(-1.2, 0, 5.28, 0.64, 0.5, 0.5, 3.17); cardBox(-0.5, 0, 5.3, 0.5, 0.42, 0.44, 3.1); cardBox(-1.15, 0.5, 5.28, 0.5, 0.4, 0.44, 3.2);
    cardBox(2.4, 0, 5.28, 0.64, 0.5, 0.5, 3.1); cardBox(2.45, 0.5, 5.3, 0.52, 0.4, 0.46, 3.18);
  }
  const bm = bufMesh(BX, boxM); if (bm) { bm.name = "set-boxes"; add(bm); }
  const tm = bufMesh(WH.__t || Buf(), tapeM, false, true); if (tm) { tm.userData.solid = false; add(tm); }

  // leaf + flower clusters for the plants
  const PLB = Buf(), FLB = Buf();
  function plant(cx, cy, cz, R, nL, nF, leaves, flowers, lean = 0) {
    for (let i = 0; i < nL; i++) {
      const a = rF() * 6.283, rad = R * Math.sqrt(rF()), h = (0.15 + 0.85 * rF()) * R * 1.3, dir = V(Math.cos(a) * (0.5 + rad / R), 0.6 + rF() * 0.5, Math.sin(a) * (0.5 + rad / R)).normalize();
      const nrm = dir.clone(), [t1, t2] = frameOf(nrm, rF() * 6.283), s = 0.17 + rF() * 0.14;
      addCard(PLB, cx + Math.cos(a) * rad + lean * h, cy + h, cz + Math.sin(a) * rad, t1, t2, s * 0.6, s, nrm, tint(leaves[Math.floor(rF() * leaves.length)], rF, 0.02, 0.1, 0.1).multiplyScalar(0.7 + 0.5 * (h / (R * 1.3))));
    }
    for (let i = 0; i < nF; i++) {
      const a = rF() * 6.283, rad = R * (0.4 + 0.6 * Math.sqrt(rF())), h = (0.35 + 0.65 * rF()) * R * 1.3, nrm = V(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5).normalize(), [t1, t2] = frameOf(nrm, rF() * 6.283), s = 0.07 + rF() * 0.04;
      addCard(FLB, cx + Math.cos(a) * rad, cy + h + 0.03, cz + Math.sin(a) * rad, t1, t2, s, s, nrm, tint(flowers[Math.floor(rF() * flowers.length)], rF, 0.015, 0.06, 0.06));
    }
  }
  const pot = (x, y, z, r, h) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.72, h, 18), clay); p.position.set(x, y + h / 2, z); p.castShadow = p.receiveShadow = true; add(p); const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.02, 0.035, 18), clay); rim.position.set(x, y + h, z); add(rim); const so = new THREE.Mesh(new THREE.CircleGeometry(r * 1.0, 16), soil); so.rotation.x = -Math.PI / 2; so.position.set(x, y + h + 0.01, z); add(so, false); };
  if (S.boxes !== false) {
    // pedestal planter at the stair foot (left): a panelled walnut stand with a flowering plant
    addBox(WD, -3.1, 0.43, 1.6, 0.52, 0.86, 0.52, col("#5a3520"), 0, 0, 1); addBox(WD, -3.1, 0.88, 1.6, 0.6, 0.06, 0.6, col("#4a2c18"), 0, 0, 1); addBox(WD, -3.1, 0.05, 1.6, 0.6, 0.1, 0.6, col("#4a2c18"), 0, 0, 1);
    for (const [dx, dz, w, d] of [[0.265, 0, 0.012, 0.36], [-0.265, 0, 0.012, 0.36], [0, 0.265, 0.36, 0.012], [0, -0.265, 0.36, 0.012]]) addBox(WD, -3.1 + dx, 0.45, 1.6 + dz, w || 0.01, 0.6, d || 0.01, col("#6a4026"), 0, 0, 1);
    plant(-3.1, 0.92, 1.6, 0.34, 150, 70, ["#3f7a32", "#4f8a3a", "#6a9a3c", "#2f6a30"], ["#e8607a", "#f08aa0", "#e0485f", "#f4b0b8", "#f4d34a"]);
    // the white-flowered plant on the box behind the window; a yellow-flowered pot by the door; a fern by the stair
    pot(-0.6, 0.52, -2.68, 0.14, 0.2); plant(-0.6, 0.74, -2.68, 0.26, 110, 50, ["#4a8a3a", "#5f9a40", "#3a7a34"], ["#ffffff", "#f6f0e0", "#fff3c8"]);
    pot(3.15, 0, -1.9, 0.2, 0.34); plant(3.15, 0.36, -1.9, 0.3, 120, 55, ["#4a8a38", "#6a9a3a", "#8aa83a"], ["#f4c82a", "#f0b21e", "#f8d84a"]);
  }

  // ---------------------------------------------------------------- the braided rug
  {
    const R0 = HALL.rug, A = R0.w / 2, B = R0.d / 2, RB = Buf(), NS = 96, bands = ["#b5483a", "#e8dcc0", "#5d7aa0", "#e8dcc0", "#c9a066", "#a8403a", "#e8dcc0", "#5d7aa0"], t0 = 1.0, dt = 0.108;
    const ring = (ta, tb, hex, k) => {
      const per = Math.PI * (3 * (A + B) - Math.sqrt((3 * A + B) * (A + 3 * B))) * (ta + tb) / 2, nst = Math.max(8, Math.round(per / 0.075 / 8) * 8), b0 = RB.p.length / 3;
      for (let j = 0; j <= NS; j++) for (const [t, v] of [[ta, 0], [tb, 1]]) {
        const a = (j / NS) * Math.PI * 2, c0 = tint(hex, rnd, 0.01, 0.05, 0.05 + 0.02); RB.p.push(R0.x + Math.cos(a) * A * t, 0.014, R0.z + Math.sin(a) * B * t); RB.n.push(0, 1, 0); RB.uv.push((j / NS) * (nst / 8), v); const f = 0.94 + 0.1 * Math.sin(j * 1.7 + k); RB.c.push(c0.r * f, c0.g * f, c0.b * f);
      }
      for (let j = 0; j < NS; j++) { const a = b0 + j * 2; RB.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    bands.forEach((hex, i) => ring(t0 - i * dt, t0 - (i + 1) * dt + 0.004, hex, i));
    const tl = t0 - bands.length * dt, b0 = RB.p.length / 3, cc = tint("#c9a066", rnd);   // the centre: a flat woven oval
    RB.p.push(R0.x, 0.014, R0.z); RB.n.push(0, 1, 0); RB.uv.push(0, 0); RB.c.push(cc.r, cc.g, cc.b);
    for (let j = 0; j <= NS; j++) { const a = (j / NS) * Math.PI * 2; RB.p.push(R0.x + Math.cos(a) * A * tl, 0.014, R0.z + Math.sin(a) * B * tl); RB.n.push(0, 1, 0); RB.uv.push(Math.cos(a) * A * tl / 0.6, Math.sin(a) * B * tl / 0.6); RB.c.push(cc.r, cc.g, cc.b); }
    for (let j = 0; j < NS; j++) RB.i.push(b0, b0 + 2 + j, b0 + 1 + j);
    const rm = bufMesh(RB, braidM, false, true); rm.name = "set-rug"; add(rm, false);
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.012, 64), std("#3a2a22")); sk.scale.set(A * 1.005, 1, B * 1.005); sk.position.set(R0.x, 0.006, R0.z); sk.receiveShadow = true; add(sk, false);
  }
  add(bufMesh(PL, plasterM)); add(bufMesh(WH, whiteM)); { const w = WH.__w && bufMesh(WH.__w, wainM, false, true); if (w) { w.name = "set-wainscot"; add(w); } }
  add(bufMesh(ST, stoneM)); add(bufMesh(WD, woodM)); { const f = bufMesh(FL, floorM, false, true); f.name = "set-floor"; add(f); }

  // ---------------------------------------------------------------- the light: soft shafts from the window, and dust motes in them
  const kd = V(-KEY[0], -KEY[1], -KEY[2]).normalize();
  const onFloor = (p) => p.clone().addScaledVector(kd, (p.y - 0.02) / -kd.y);
  if (S.shafts !== false) {
    const stx = new THREE.CanvasTexture(shaftCanvas()); const SM = basic({ map: stx, color: "#ffd49a", transparent: true, opacity: 0.17, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    const SB = Buf(), wz = -3.02, ys = [WIN.y0 + 0.02, WIN.y1 - 0.02], xs = [WIN.x - WIN.w / 2 + 0.07, WIN.x + WIN.w / 2 - 0.07];
    const corners = [[xs[0], ys[0]], [xs[1], ys[0]], [xs[1], ys[1]], [xs[0], ys[1]]].map(([x, y]) => V(x, y, wz));
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4], fa = onFloor(a), fb = onFloor(b), base = SB.p.length / 3;
      for (const [p, u, v] of [[a, 0, 0], [b, 1, 0], [fb, 1, 1], [fa, 0, 1]]) { SB.p.push(p.x, p.y, p.z); SB.n.push(0, 1, 0); SB.uv.push(u, v); SB.c.push(1, 1, 1); }
      SB.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    for (let k = 1; k < 4; k++) {   // slices through the beam so it reads as a volume
      const x = xs[0] + ((xs[1] - xs[0]) * k) / 4, a = V(x, ys[0], wz), b = V(x, ys[1], wz), fa = onFloor(a), fb = onFloor(b), base = SB.p.length / 3;
      for (const [p, u, v] of [[a, 0, 0], [b, 1, 0], [fb, 1, 1], [fa, 0, 1]]) { SB.p.push(p.x, p.y, p.z); SB.n.push(0, 1, 0); SB.uv.push(u, v); SB.c.push(1, 1, 1); }
      SB.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const sm = bufMesh(SB, SM, false, false); sm.renderOrder = 6; sm.frustumCulled = false; sm.name = "set-shafts"; add(sm, false);
  }
  if (S.patch !== false) {   // the window's light on the floor, brightened: the 15 panes projected along the sun (the real shadow grid is too faint under the set ramp)
    const PB = Buf(), g0 = [WIN.x - WIN.w / 2 + 0.06, WIN.x + WIN.w / 2 - 0.06], g1 = [WIN.y0 + 0.05, WIN.y1 - 0.05], wz = -3.0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) {
      const xa = g0[0] + ((g0[1] - g0[0]) * i) / 3 + 0.02, xb = g0[0] + ((g0[1] - g0[0]) * (i + 1)) / 3 - 0.02, ya = g1[0] + ((g1[1] - g1[0]) * j) / 5 + 0.02, yb = g1[0] + ((g1[1] - g1[0]) * (j + 1)) / 5 - 0.02, base = PB.p.length / 3;
      for (const [x, y, u, v] of [[xa, ya, 0, 0], [xb, ya, 1, 0], [xb, yb, 1, 1], [xa, yb, 0, 1]]) { const f = V(x, y, wz).addScaledVector(kd, y / -kd.y); PB.p.push(f.x, 0.016, f.z); PB.n.push(0, 1, 0); PB.uv.push(u, v); PB.c.push(1, 1, 1); }
      PB.i.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
    const [pc2, pg] = canvas(64, 64), id = pg.createImageData(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const e = Math.min(smooth(Math.min(x, 63 - x) / 14), smooth(Math.min(y, 63 - y) / 14)), i = (y * 64 + x) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; id.data[i + 3] = Math.round(e * 255); } pg.putImageData(id, 0, 0);
    const pm2 = bufMesh(PB, basic({ map: ctex(pc2, 1, 1, false), color: "#ffb860", transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), false, false);
    pm2.name = "set-sunpatch"; pm2.renderOrder = 2; add(pm2, false);
  }
  const nM = S.motes ?? 70;
  if (nM > 0) {
    const pos = new Float32Array(nM * 3), colr = new Float32Array(nM * 3), P = [];
    for (let i = 0; i < nM; i++) P.push({ wx: WIN.x - WIN.w / 2 + 1.1 * rW() * 0.95, wy: WIN.y0 + 0.2 + (WIN.y1 - WIN.y0 - 0.3) * rW(), u: rW(), sp: 0.006 + rW() * 0.012, ph: rW() * 6.283, ph2: rW() * 6.283 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(colr, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: ctex(moteCanvas(), 1, 1, false), size: 0.05, sizeAttenuation: true, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pts.frustumCulled = false; pts.name = "set-motes"; pts.userData.solid = false; set.add(pts);
    const tick = (t) => {
      P.forEach((m, i) => {
        const u = (m.u + t * m.sp) % 1, smax = (m.wy - 0.1) / -kd.y, s = u * smax;
        pos[i * 3] = m.wx + kd.x * s + 0.14 * Math.sin(t * 0.5 + m.ph); pos[i * 3 + 1] = m.wy + kd.y * s + 0.08 * Math.sin(t * 0.37 + m.ph2); pos[i * 3 + 2] = -3.05 + kd.z * s + 0.12 * Math.cos(t * 0.43 + m.ph);
        const f = smooth(u / 0.1) * (1 - smooth((u - 0.7) / 0.3)) * (0.55 + 0.45 * Math.sin(t * 1.3 + m.ph * 3)); colr[i * 3] = 0.95 * f; colr[i * 3 + 1] = 0.78 * f; colr[i * 3 + 2] = 0.5 * f;
      });
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }

  // ---------------------------------------------------------------- outside: the garden, the street, the terrace across it, maples (seen through the window and the door)
  if (S.garden !== false) {
    const OS = Buf(), OF = Buf(), OC = Buf(), OW = Buf(), PLA = [], houses = Buf(), WIN2 = Buf(), TR = [], LQ = Buf(), CQ = Buf();
    const wflag = (x0, x1, z0, z1, y) => addBox(OF, (x0 + x1) / 2, y - 0.02, (z0 + z1) / 2, x1 - x0, 0.04, z1 - z0, new THREE.Color(0.92 + rT() * 0.1, 0.92 + rT() * 0.1, 0.92 + rT() * 0.1), 0, 0, 6);
    wflag(1.7, 3.4, -4.35, -7.0, HALL.pathY); wflag(-40, 40, -7.0, -9.9, HALL.pathY);
    for (let x = -40; x < 40; x += 1.2) addBox(OS, x + 0.6, -0.27, -10.0, 1.2 - 0.02, 0.2, 0.22, new THREE.Color(0.9 + rT() * 0.16, 0.9 + rT() * 0.16, 0.9 + rT() * 0.16), 0, 0, 3.2);
    addBox(OC, 0, HALL.roadY - 0.02, -13.3, 80, 0.04, 6.4, WHITE, 0, 0, 3);
    for (let x = -40; x < 40; x += 1.2) addBox(OS, x + 0.6, -0.27, -16.6, 1.2 - 0.02, 0.2, 0.22, new THREE.Color(0.9 + rT() * 0.16, 0.9 + rT() * 0.16, 0.9 + rT() * 0.16), 0, 0, 3.2);
    wflag(-40, 40, -16.7, -19.5, HALL.pathY);
    // the low garden wall with a gate gap and two pillars
    addBox(OS, -19.0, 0.15, -7.0, 41.4, 0.75, 0.35, WHITE, 0, 0, 3.2); addBox(OS, 21.7, 0.15, -7.0, 36.6, 0.75, 0.35, WHITE, 0, 0, 3.2);
    for (const px of [1.5, 3.6]) { addBox(OS, px, 0.4, -7.0, 0.5, 1.25, 0.5, WHITE, 0, 0, 3.2); addBox(OS, px, 1.06, -7.0, 0.62, 0.1, 0.62, new THREE.Color(1.05, 1.05, 1.05), 0, 0, 3.2); addBox(OS, px, 1.15, -7.0, 0.4, 0.1, 0.4, WHITE, 0, 0, 3.2); }
    // the terrace across the road: rendered houses with sash windows, doors and slate roofs
    const hp = ["#d4b48a", "#cfa98a", "#c7b89a", "#b9a58a", "#d9c09a", "#c9a890"], PLC = ctex(plasterCanvas(rnd, "#e6d4b6", 512));
    const slate = std("#4a4658", { roughness: 0.8 }), houseM = std("#ffffff", { map: PLC, vertexColors: true, emissive: EM("#4a3a28") }), winM = std("#2a3a52", { roughness: 0.3, emissive: EM("#16202e") }), frameM = std("#f0e8d6", { emissive: EM("#3a3830") });
    let hx = -44; const roofs = Buf(), frames = Buf(), glass = Buf(), doors = Buf();
    while (hx < 44) {
      const w = 4.6 + rT() * 2, H = 8.6 + rT() * 1.8, hc = tint(hp[Math.floor(rT() * hp.length)], rT, 0.01, 0.06, 0.05);
      addBox(houses, hx + w / 2, H / 2 - 0.2, -20.3, w - 0.04, H + 0.4, 1.6, hc, 0, 0, 3); addBox(roofs, hx + w / 2, H + 0.35, -20.3, w + 0.2, 0.7, 2.0, WHITE, 0, 0, 2);
      for (const fy of [1.5, 4.5, 7.0]) for (const fx of [0.28, 0.72]) {
        if (fy === 1.5 && fx === 0.28) { addBox(doors, hx + w * fx, 1.05, -19.48, 1.0, 2.1, 0.05, tint(["#2f5d3a", "#6a2a2a", "#2a3f6a"][Math.floor(rT() * 3)], rT, 0, 0.1, 0.05), 0, 0, 1); continue; }
        const wx = hx + w * fx, wy = fy + (fy > 3 ? 0.5 : 0.7); addBox(frames, wx, wy, -19.5, 1.08, 1.78, 0.06, WHITE, 0, 0, 1); addBox(glass, wx, wy, -19.47, 0.9, 1.6, 0.02, WHITE, 0, 0, 1); addBox(frames, wx, wy, -19.45, 0.9, 0.05, 0.03, WHITE, 0, 0, 1); addBox(frames, wx, wy, -19.45, 0.05, 1.6, 0.03, WHITE, 0, 0, 1);
      }
      hx += w;
    }
    add(bufMesh(houses, houseM, false, true), false); add(bufMesh(roofs, slate, false, true), false); add(bufMesh(frames, frameM, false, true), false); add(bufMesh(glass, winM, false, true), false); add(bufMesh(doors, std("#ffffff", { vertexColors: true, roughness: 0.6 }), false, true), false);
    // fallen leaves on the stoop, path and pavement (decals)
    const cols = ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a"], flat = V(0, 1, 0);
    for (let i = 0; i < 260; i++) {
      const onS = i < 80, x = onS ? 1.4 + rT() * 2.2 : -3 + rT() * 8, z = onS ? -3.45 - rT() * 0.9 : -4.4 - rT() * 5.4, y = (onS ? 0 : HALL.pathY) + 0.007; if (!onS && z > -4.35 && z < -4.3) continue;
      if (!onS && Math.abs(z + 7.0) < 0.2) continue;
      const [a, b] = frameOf(flat, rT() * 6.28), s = 0.1 + rT() * 0.08; addCard(LQ, x, y, z, a, b, s, s, flat, tint(cols[Math.floor(rT() * cols.length)], rT, 0.014, 0.08, 0.08));
    }
    add(bufMesh(OS, stoneM), false); add(bufMesh(OF, flagM, false, true), false); add(bufMesh(OC, cobM, false, true), false);
    const lm = bufMesh(LQ, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); if (lm) add(lm, false);
    // autumn foliage: maples (tapered trunk, limbs, painted maple-leaf clumps with a dark core), shrubs along the garden wall, ivy on the outer wall
    const TONES = { red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"], gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e"], mix: ["#d9461c", "#e8751e", "#f0b21e", "#f6cc3a"], green: ["#6f9a3a", "#8aa83a", "#b9b02a", "#5a8a3a"] };
    function clump(c, r, tone, scaleY = 0.78, cards = null, sz = 0.5) {
      const pal = TONES[tone].map((h) => new THREE.Color(h)), n = cards ?? Math.round(60 + 90 * r), dark = pal[0].clone().lerp(pal[1], 0.5).multiplyScalar(0.5), kc = 0.75 + rT() * 0.45;
      const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = CQ.p.length / 3;
      for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); CQ.p.push(c.x + x * r * 0.55, c.y + y * r * 0.55 * scaleY, c.z + z * r * 0.55); _n.set(x, y, z).normalize(); CQ.n.push(_n.x, _n.y, _n.z); CQ.uv.push(0, 0); CQ.c.push(dark.r, dark.g, dark.b); CQ.i.push(b0 + i); } ico.dispose();
      for (let i = 0; i < n; i++) {
        const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = V(rr * Math.cos(th), u * scaleY, rr * Math.sin(th)), rad = r * (0.7 + rT() * 0.32), p = c.clone().addScaledVector(d, rad);
        const nrm = V(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = sz * (0.75 + rT() * 0.5);
        addCard(TR.__l ||= Buf(), p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
      }
    }
    function maple(x, z, H, tone, o = {}) {
      const y0 = o.y0 ?? -0.2, R = o.R ?? H * 0.36, trunkH = H * (o.trunk ?? 0.5), r0 = o.r ?? 0.2, lean = (rT() - 0.5) * 0.1;
      const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => V(x + lean * k * k * trunkH, y0 + k * trunkH, z)); pts.forEach((p, i) => { if (i) PLA.push(segMat(pts[i - 1], p, r0 * (1 - (i - 1) * 0.15), r0 * (1 - i * 0.15))); });
      const nb = (o.branches ?? 6) + 1, tops = [];
      for (let b = 0; b < nb; b++) {
        const a = (b / nb) * 6.28 + rT() * 0.7, el = 0.45 + rT() * 0.5, st = pts[3 + (b % 2)].clone(), L = R * (0.75 + rT() * 0.45), dir = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), tip = st.clone().addScaledVector(dir, L).add(V(0, L * 0.18, 0)), mid = st.clone().addScaledVector(dir, L * 0.5);
        PLA.push(segMat(st, mid, r0 * 0.4, r0 * 0.25), segMat(mid, tip, r0 * 0.25, 0.03)); clump(tip, R * (0.34 + rT() * 0.16), tone, 0.78, null, 0.55); clump(tip.clone().add(V((rT() - 0.5) * R * 0.5, R * 0.3, (rT() - 0.5) * R * 0.5)), R * (0.26 + rT() * 0.12), o.tones ? o.tones[b % o.tones.length] : tone, 0.78, null, 0.5);
      }
      clump(pts[4].clone().add(V(0, R * 0.55, 0)), R * 0.42, tone, 0.78, null, 0.55);
    }
    function shrub(x, z, r, tone) { clump(V(x, HALL.pathY + r * 0.5, z), r, tone, 0.7, Math.round(60 + 170 * r), 0.2); }
    if (S.trees !== false) {
      maple(-0.4, -9.4, 7.0, "orange", { tones: ["orange", "gold", "red", "orange"], trunk: 0.36, R: 2.5, r: 0.2, y0: -0.2 });      // behind the window, over the garden wall
      maple(-2.6, -8.6, 7.0, "gold", { tones: ["gold", "orange", "gold", "mix"], trunk: 0.38, R: 2.4, r: 0.18 }); maple(2.4, -9.6, 7.0, "red", { tones: ["red", "orange", "gold"], trunk: 0.36, R: 2.4, r: 0.18 });
      maple(5.6, -8.6, 8, "red", { tones: ["red", "orange", "gold", "red"], trunk: 0.4, R: 2.6, r: 0.18 });                    // across from the door, on the pavement
      maple(9.5, -8.8, 9, "gold", { tones: ["gold", "orange"], trunk: 0.5, R: 2.8, r: 0.16 }); maple(-9, -8.8, 9, "orange", { tones: ["orange", "gold", "red"], trunk: 0.5, R: 2.8, r: 0.16 });
      for (const [fx, fy, fz, tn] of [[-0.9, 2.6, -8.0, "orange"], [0.8, 3.1, -8.1, "gold"], [0.0, 2.0, -7.9, "red"], [1.6, 2.3, -8.0, "orange"], [-0.3, 3.5, -8.0, "gold"], [-1.6, 2.1, -8.0, "gold"]]) clump(V(fx, fy, fz), 1.1, tn, 0.8, 120, 0.5);
      for (let i = 0; i < 14; i++) shrub(-4.4 + i * 0.95 + (rT() - 0.5) * 0.4, -6.5 + (rT() - 0.5) * 0.6, 0.5 + rT() * 0.35, ["green", "gold", "orange", "mix"][i % 4]);
      for (let i = 0; i < 6; i++) shrub(4.1 + i * 1.1, -6.5 + (rT() - 0.5) * 0.6, 0.5 + rT() * 0.3, ["gold", "orange", "mix"][i % 3]);
      shrub(1.45, -5.6, 0.45, "green"); shrub(3.65, -5.7, 0.5, "gold");
    }
    // ivy on the outer wall right of the door and a potted plant on the stoop (in sight in panel 04)
    for (let i = 0; i < 160; i++) { const x = 3.3 + rT() * 0.5, y = 0.3 + Math.sqrt(rT()) * 2.3, z = -3.45 - rT() * 0.05, nrm = V(0, 0.2, -1).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = 0.2 + rT() * 0.1; addCard(TR.__l ||= Buf(), x, y, z, a, b, s, s, nrm, tint(["#c8301c", "#e8751e", "#6f9a3a", "#d9461c", "#8aa83a"][i % 5], rT, 0.02, 0.08, 0.08)); }
    pot(1.65, 0, -3.85, 0.22, 0.38); plant(1.65, 0.4, -3.85, 0.34, 130, 40, ["#4a8a38", "#5f9a40", "#8aa83a", "#d9a02a"], ["#f4c82a", "#e8751e"]);
    const tw = mergedGeo(PLA, std("#4a3326", { roughness: 0.95 }), false); if (tw) add(tw, false);
    const lq = bufMesh(TR.__l || Buf(), leafMat, false, true); if (lq) { lq.name = "set-leaves"; add(lq, false); }
    const cq = bufMesh(CQ, coreMat, false, true); if (cq) add(cq, false);
  }
  { const pq = bufMesh(PLB, plantMat, true, true); if (pq) add(pq, false); const fq = bufMesh(FLB, flowerMat, false, true); if (fq) add(fq, false); }
  return set;
}
