import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scoreriver": the river path and the old stone bridge of Happiness 03 ("I could see everyone's happiness score"), a morning
// in autumn. REAL 3D geometry with hand-painted canvas textures (plates/painted/RV.webp and RV2.webp are the look targets).
// One world, two views (spec.view): "path" = panels 07 / 08 (the beauty walk along the river), "bridge" = panel 10 (the deck).
//
// COORDINATES (metres, y up). The path runs along -z (away from the beauty camera at [0, 0.95, 6.0], pitch -2, vfov 34) and
// bends gently LEFT (-x) into the distance; the river lies to the RIGHT (+x), the old two-arch bridge crosses it at z -34.
//   path centre x   RIVER.pathX(z): 0.4 for z >= -1, then 0.4 - 0.1 d - 0.0045 d^2 with d = -1 - z (x -0.69 at z -9, -6.3 at z -30).
//                   Walkable flagstones x_c-2.2 .. x_c+2.4 at y 0, from z +10 to z -33, then the plaza (x -24..-3.1, z -44..-30).
//   left side       a 1.1 m ashlar wall (face at x_c-2.2, coping top y 1.2), the garden above it (ground y 1.1, falling to 0 by z -30):
//                   flowers, shrubs, big red / orange maples whose boughs hang over the path (canopy from y 3.2 up).
//   the bench       RIVER.bench: against the wall at x -1.55, z 1.8, faces +x (seat top y 0.45, 1.7 m long along z).
//   right side      granite posts (1.0 m, every 2.4 m) and beams at x_c+2.3, a strip of grass and daisies to x_c+3.2, then the
//                   revetment drops to the calm river (water y -1.5, x -3.1 .. 20.5 at the bridge). The water shimmers, reflects
//                   the bridge and the far-bank trees (real mirrored geometry), and carries 5 morning mist cards.
//   the bridge      axis z -34 (deck 3.4 m between solid parapets, 0.55 thick, 0.95 tall, lichen granite), deck x -3 .. 41,
//                   RIVER.deckY(x): y 0.1 at x -3 rising to 4.2 over the big arch (centre x 16.5), down to 0.2 at x 41. Arch 1 x -1.2..6,
//                   pier x 6..9 with cutwaters, arch 2 x 9..24. Two iron lamp posts on the parapets at x 16.5 (z -34 +- 1.95).
//   the town        a flagged plaza at the bridge's west end (x -24..-3.1), the gate house (arch 3 m wide, x -23..-17, z -38.5..-29.5),
//                   houses climbing a hill to the west, a church tower at x -62; far away the PAINTED backdrop card cut from RV.webp
//                   (town, church tower, wooded hills) 110 m ahead, hung so the painting's camera sees it as painted.
//
// spec (every key optional):
//   view "path"        "path" | "bridge": which view the extras are placed for (falling leaves over the path or over the deck)
//   seed 5             textures, layout of leaves, flowers, tufts
//   wind 1             leaves shiver (0 off)
//   leaves 14          falling leaves (#d9772b #c4472a #e2a53a, 0.5 m/s, hashed sway)
//   fallen 1           multiplier of the fallen leaves on path and wall foot (0 none)
//   mist 1             multiplier of the mist cards' alpha (0 none); drift 0.05 m/s
//   trees true         the maples (false: bare set, for layout work)
//   town true          the 3D town beyond the bridge
//   backdrop true      the painted far card (needs plates/painted/RV.webp served from the repo root)
// Light: "light": "golden", a key like [3.5, 5.0, 4.5] and "shadowSize": 12 (see the bench). Water, mist, sky, far land and the town are
// scenery (userData.solid false); the wall, fence, path, bench, bridge body, parapets, lamps and gate house are solid.
// Triangles: ~250k (leaf cards 70 %). Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks).

const WATER_Y = -1.5, HW = 2.9, Z_NEAR = 10, Z_FAR = -45, BZ = -34, BRW = 4.5, PARA = 1.7, BANK_Q = 3.5;
const xcF = (z) => { const d = Math.max(0, -z - 1); return -0.4 - 0.1 * d - 0.0039 * d * d; };
const kcF = (z) => (z < -1 ? 0.1 + 0.0078 * (-z - 1) : 0);
const DECK = [[-3, 0.1], [0, 0.9], [3, 1.9], [6.5, 2.9], [11, 3.7], [16.5, 4.2], [22, 3.8], [27, 2.7], [33, 1.2], [41, 0.2]];
function deckYF(x) {
  if (x <= DECK[0][0]) return 0;
  if (x >= DECK[DECK.length - 1][0]) return DECK[DECK.length - 1][1];
  let i = 0; while (DECK[i + 1][0] < x) i++;
  const n = DECK.length, m = (k) => (k <= 0 ? (DECK[1][1] - DECK[0][1]) / (DECK[1][0] - DECK[0][0]) : k >= n - 1 ? (DECK[n - 1][1] - DECK[n - 2][1]) / (DECK[n - 1][0] - DECK[n - 2][0]) : (DECK[k + 1][1] - DECK[k - 1][1]) / (DECK[k + 1][0] - DECK[k - 1][0]));
  const [x0, y0] = DECK[i], [x1, y1] = DECK[i + 1], h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
  const base = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m(i + 1);
  return base;
}
export const RIVER = {
  // the beauty camera of 07 / 08 (the painter's camera) and the bridge-deck camera of 10 (a guess: the director sets it)
  camera: { pos: [0, 0.95, 6.0], pitch: -2, vfov: 34 },
  waterY: WATER_Y, pathHalf: HW, pathX: xcF, deckY: deckYF,
  bench: { x: -2.85, z: -0.85, seatY: 0.45, length: 1.7, faces: "+x" },
  bridge: { z: BZ, x0: -3, x1: 41, deckHalf: PARA, parapetH: 0.95, lamps: [[16.5, BZ - 1.95], [16.5, BZ + 1.95]] },
  // Mash walks x 0.9 from z -1.5 to +0.6 (facing +z); Spud 7.5 m behind (07) / 3.5 m behind (08) on the path's centre line x_c(z) (+-1.2 free)
  stand: {
    mash07: { x: 0.9, zFrom: -1.5, zTo: 0.6, y: 0 },
    spud07: { x: xcF(-9.0) + 0.3, z: -9.0, y: 0 }, spud08: { x: xcF(-5.0) + 0.3, z: -5.0, y: 0 },
    // panel 10: on the deck looking west (-x) along the axis z -34; deckY(x) is the walking height
    deckCamera: { pos: [25, deckYF(25) + 1.5, BZ], look: [8, 4.6, BZ], fov: 36 }, mash10From: { x: 20, z: BZ, y: deckYF(20) }, mash10To: { x: 15, z: BZ, y: deckYF(15) },
  },
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
const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }); m.userData.noOutline = true; return m; };
const lam = (color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };

// ================================================================================================================ painters
// All tile exactly (rows and blocks are scaled to fit the canvas), so a repeat only shows as a repeat of hand-laid stone.
function fitRun(rnd, total, lo, hi) {   // random lengths between lo and hi that add up to exactly `total`
  const a = []; let s = 0;
  while (s < total - hi) { const v = lo + rnd() * (hi - lo); a.push(v); s += v; }
  a.push(total - s); if (a[a.length - 1] < lo * 0.6 && a.length > 1) { const l = a.pop(); a[a.length - 1] += l; }
  return a;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); const o = { r: Math.round(c.r ** (1 / 2.2) * 255 * k), g: Math.round(c.g ** (1 / 2.2) * 255 * k), b: Math.round(c.b ** (1 / 2.2) * 255 * k) }; return `rgb(${Math.min(255, o.r)},${Math.min(255, o.g)},${Math.min(255, o.b)})`; };

// dressed ashlar in warm gold-grey sandstone: ~8 courses to a door height (0.22-0.30 m), blocks 0.3-0.95 m long, every joint
// staggered against the course below, each block its own tone (gold, ochre, brown, grey), softly rough edges, mottled and
// pitted, a soft lit top and shaded foot, a thin mortar joint. M metres square (the facades use 3.2).
function stoneCanvas(rnd, S = 2048, mortar = "#6b5a42", pal = null, M = 4.8) {
  const [c, g] = canvas(S, S), ppm = S / M, m = Math.max(1.5, S / 700), j = (a) => (rnd() - 0.5) * a;
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  pal = pal || ["#c9aa72", "#bf9d66", "#d0b583", "#b79c78", "#c4ae88", "#a8957c", "#cdb07a", "#b4966a", "#c7a47c", "#aa9a80", "#d4bb8c", "#b8a07c", "#bb9a60"];
  let y = 0, prev = [];
  for (const rh of fitRun(rnd, S, 0.22 * ppm, 0.3 * ppm)) {
    let run = null;
    for (let t = 0; t < 10; t++) {   // stagger: no joint within 0.12 m of one in the course below
      const r = fitRun(rnd, S, 0.3 * ppm, 0.95 * ppm); let x = 0, ok = true;
      for (const w of r) { x += w; for (const q of prev) { const dd = Math.abs(x - q); if (Math.min(dd, S - dd) < 0.12 * ppm) ok = false; } }
      run = r; if (ok) break;
    }
    let x = 0; prev = [];
    for (const w of run) {
      prev.push(x + w);
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.88 + rnd() * 0.22, x0 = x + m, y0 = y + m, bw = w - 2 * m, bh = rh - 2 * m;
      const gr = g.createLinearGradient(0, y0, 0, y0 + bh); gr.addColorStop(0, shade(base, k * 1.08)); gr.addColorStop(1, shade(base, k * 0.9));
      g.fillStyle = gr; g.beginPath();   // a softly irregular block outline
      g.moveTo(x0 + j(m), y0 + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + j(m * 0.6)); g.lineTo(x0 + bw + j(m), y0 + j(m));
      g.lineTo(x0 + bw + j(m), y0 + bh * 0.5 + j(m)); g.lineTo(x0 + bw + j(m), y0 + bh + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + bh + j(m * 0.6));
      g.lineTo(x0 + j(m), y0 + bh + j(m)); g.lineTo(x0 + j(m), y0 + bh * 0.5 + j(m)); g.closePath(); g.fill();
      g.save(); g.beginPath(); g.rect(x0, y0, bw, bh); g.clip();
      for (let i = 0; i < 9; i++) {   // soft mottling: ochre, brown, grey, pale
        const tc = [[150, 112, 62], [120, 98, 76], [150, 144, 132], [255, 240, 200], [196, 150, 84]][Math.floor(rnd() * 5)], cx = x0 + rnd() * bw, cy = y0 + rnd() * bh, rr = (0.12 + rnd() * 0.3) * Math.min(bw, bh * 2.2);
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr), al = 0.1 + rnd() * 0.14; rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${al})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
      }
      for (let i = 0; i < Math.round(bw * bh / 380); i++) { g.fillStyle = rnd() < 0.7 ? `rgba(76,58,38,${0.14 + rnd() * 0.22})` : `rgba(255,246,220,${0.12 + rnd() * 0.16})`; g.fillRect(x0 + rnd() * bw, y0 + rnd() * bh, 1 + rnd() * 2.2, 1 + rnd() * 2.2); }   // pitting and grain
      if (rnd() < 0.35) { g.strokeStyle = `rgba(74,58,40,${0.14 + rnd() * 0.1})`; g.lineWidth = 1.2; const yy = y0 + rnd() * bh, xx = x0 + rnd() * bw * 0.5; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + bw * (0.15 + rnd() * 0.3), yy + j(5)); g.stroke(); }   // a chisel mark
      const lt = g.createLinearGradient(0, y0, 0, y0 + Math.min(bh * 0.35, 9)); lt.addColorStop(0, "rgba(255,246,218,0.42)"); lt.addColorStop(1, "rgba(255,246,218,0)"); g.fillStyle = lt; g.fillRect(x0, y0, bw, Math.min(bh * 0.35, 9));   // soft lit top
      const bt = g.createLinearGradient(0, y0 + bh, 0, y0 + bh - Math.min(bh * 0.3, 9)); bt.addColorStop(0, "rgba(52,38,24,0.4)"); bt.addColorStop(1, "rgba(52,38,24,0)"); g.fillStyle = bt; g.fillRect(x0, y0 + bh - Math.min(bh * 0.3, 9), bw, Math.min(bh * 0.3, 9));   // shaded foot
      g.fillStyle = "rgba(255,244,214,0.16)"; g.fillRect(x0, y0, 2, bh); g.fillStyle = "rgba(52,38,24,0.2)"; g.fillRect(x0 + bw - 2, y0, 2, bh);
      g.restore();
      x += w;
    }
    y += rh;
  }
  return c;
}
// pale stone flags, laid in an irregular bond, a bevel on each, moss in the joints, pits and cracks. 6 m square.
function flagCanvas(rnd, S = 2048, pal = ["#c9ad94", "#bea48e", "#d1b69c", "#b5a090", "#c4ae9c", "#cfb8a0", "#b9a294"], mortar = "#6d6157", hs = [0.42, 0.85], ws = [0.8, 1.8]) {
  const [c, g] = canvas(S, S), ppm = S / 6;
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  let y = 0;
  for (const rh of fitRun(rnd, S, hs[0] * ppm, hs[1] * ppm)) {
    let x = 0;
    for (const w of fitRun(rnd, S, ws[0] * ppm, ws[1] * ppm)) {
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.95 + rnd() * 0.1;
      g.fillStyle = shade(base, k); g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, rh - 8, 14); g.fill();
      for (let i = 0; i < 18; i++) { g.fillStyle = rnd() < 0.55 ? `rgba(90,70,60,${0.03 + rnd() * 0.05})` : `rgba(255,236,214,${0.02 + rnd() * 0.04})`; g.beginPath(); g.ellipse(x + rnd() * w, y + rnd() * rh, 10 + rnd() * w * 0.08, 6 + rnd() * rh * 0.1, rnd() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(80,64,54,${0.12 + rnd() * 0.18})`; g.beginPath(); g.arc(x + 8 + rnd() * (w - 16), y + 8 + rnd() * (rh - 16), 1 + rnd() * 2.2, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,240,222,0.32)"; g.fillRect(x + 8, y + 5, w - 16, 3); g.fillRect(x + 5, y + 8, 3, rh - 16);
      g.fillStyle = "rgba(52,40,34,0.34)"; g.fillRect(x + 8, y + rh - 8, w - 16, 3); g.fillRect(x + w - 8, y + 8, 3, rh - 16);
      if (rnd() < 0.3) { g.strokeStyle = "rgba(60,48,40,0.35)"; g.lineWidth = 1.5; g.beginPath(); let px = x + rnd() * w, py = y + 6; g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * 40; py += rh / 4.5; g.lineTo(px, py); } g.stroke(); }
      if (rnd() < 0.9) for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(96,134,50,${0.4 + rnd() * 0.35})`; g.beginPath(); g.ellipse(x + rnd() * w, y + 1 + rnd() * 5, 6 + rnd() * 16, 2.5 + rnd() * 4, 0, 0, 7); g.fill(); }
      x += w;
    }
    y += rh;
  }
  return c;
}
function grassCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S);
  g.fillStyle = "#88a84a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const cx = rnd() * S, cy = rnd() * S, r = 40 + rnd() ** 2 * 170, col = ["#6f9a3e", "#a6b84c", "#c2b04a", "#5d8a3a"][i % 4];
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, col + "70"); gr.addColorStop(1, col + "00"); g.fillStyle = gr; g.fillRect(cx + ox - r, cy + oy - r, 2 * r, 2 * r); }
  }
  for (let i = 0; i < 12000; i++) {
    const x = rnd() * S, y = rnd() * S, l = 6 + rnd() * 12, a = -Math.PI / 2 + (rnd() - 0.5) * 0.9, u = rnd();
    g.strokeStyle = u < 0.4 ? "rgba(52,100,44,0.4)" : u < 0.8 ? "rgba(214,232,130,0.38)" : "rgba(222,176,70,0.3)"; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
function slateCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S), N = 10, h = S / N;
  g.fillStyle = "#2c2a36"; g.fillRect(0, 0, S, S);
  for (let r = 0; r < N; r++) for (let q = -1; q < 8; q++) {
    const w = S / 8, x = q * w + (r % 2) * w / 2, k = 0.85 + rnd() * 0.3;
    g.fillStyle = shade(["#5b5668", "#4d4a5c", "#68627a", "#56526a"][Math.floor(rnd() * 4)], k); g.fillRect(x + 2, r * h + 1, w - 4, h - 2);
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + 2, r * h + h - 5, w - 4, 4);
    g.fillStyle = "rgba(210,205,230,0.12)"; g.fillRect(x + 2, r * h + 1, w - 4, 3);
  }
  return c;
}
// a five-lobed maple leaf: near-white with soft darker veins, cut out by its alpha (tinted by vertex colour)
function mapleCanvas() {
  const S = 128, [c, g] = canvas(S, S), cx = 64, cy = 66;
  const gr = g.createLinearGradient(20, 20, 108, 108); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#cfcfcf");
  g.fillStyle = gr; g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) {
    const t = a - Math.PI / 2, lobe = Math.abs(Math.cos(2.5 * t)) ** 0.75, tooth = 1 + 0.07 * Math.sin(a * 22), r = 55 * (0.34 + 0.66 * lobe) * tooth;
    const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * 0.98; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fill();
  g.strokeStyle = "rgba(90,90,90,0.5)"; g.lineWidth = 2.2;
  for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + k * (Math.PI * 2 / 5); g.beginPath(); g.moveTo(cx, cy + 10); g.lineTo(cx + Math.cos(t) * 42, cy + Math.sin(t) * 42); g.stroke(); }
  g.strokeStyle = "rgba(90,90,90,0.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx, 126); g.stroke();
  return c;
}
function daisyCanvas() {
  const S = 64, [c, g] = canvas(S, S);
  g.fillStyle = "#ffffff";
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 13, 5.5, a, 0, 7); g.fill(); }
  g.fillStyle = "#6a6a6a"; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill();
  g.fillStyle = "#bdbdbd"; g.beginPath(); g.arc(30, 30, 3.5, 0, 7); g.fill();
  return c;
}
// ================================================================================================================ geometry builders
// A growing buffer of quads / boxes with position, normal, uv and vertex colour: one mesh per material.
function Buf() { return { p: [], n: [], uv: [], c: [], i: [] }; }
function bufMesh(B, mat, cast = true, recv = true) {
  if (!B.p.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(B.c, 3)); g.setIndex(B.i);
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; return m;
}
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _n = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
const WHITE = new THREE.Color(1, 1, 1);
// a box centred at (x,y,z), size w,h,d, turned ry about y then rz about z; uv = world metres / uvK on each face
function addBox(B, x, y, z, w, h, d, col = WHITE, ry = 0, rz = 0, uvK = 1.2) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, rz, "YXZ")), _one);
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const faces = [   // normal, then 4 corners (ccw seen from outside), uv axes
    [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], 2, 1], [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], 2, 1],
    [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], 0, 2], [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], 0, 2],
    [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], 0, 1], [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], 0, 1],
  ];
  for (const [nm, cs, ua, va] of faces) {
    const b = B.p.length / 3; _n.set(...nm).transformDirection(_m);
    for (const cc of cs) { _v.set(...cc).applyMatrix4(_m); B.p.push(_v.x, _v.y, _v.z); B.n.push(_n.x, _n.y, _n.z); B.uv.push((cc[ua] + (ua === 0 ? x : ua === 2 ? z : y)) / uvK, (cc[va] + (va === 1 ? y : va === 2 ? z : x)) / uvK); B.c.push(col.r, col.g, col.b); }
    B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
}
// a flat card: centre, two edge axes (unit), size, a normal (for shading), colour, uv rect
const UVFULL = [0, 0, 1, 1];
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, col, uv = UVFULL) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2;
  const c4 = [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]];
  for (const [a, d, u, v] of c4) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(col.r, col.g, col.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
// leaf card frame: a normal and a random spin about it
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _alt = new THREE.Vector3(1, 0, 0);
function frameOf(n, spin) {
  _t1.crossVectors(Math.abs(n.y) > 0.95 ? _alt : _up, n).normalize(); _t2.crossVectors(n, _t1).normalize();
  const c = Math.cos(spin), s = Math.sin(spin), a = _t1.clone().multiplyScalar(c).addScaledVector(_t2, s), b = _t2.clone().multiplyScalar(c).addScaledVector(_t1, -s);
  return [a, b];
}
const tint = (hex, rnd, dh = 0.012, ds = 0.06, dl = 0.07) => new THREE.Color(hex).offsetHSL((rnd() - 0.5) * dh * 2, (rnd() - 0.5) * ds * 2, (rnd() - 0.5) * dl * 2);
function mergedGeo(parts, mat, cast = true) {
  if (!parts.length) return null;
  const geo = mergeGeometries(parts.map(([g, M]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(M); for (const k of Object.keys(q.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") q.deleteAttribute(k); return q; }));
  const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = true; return o;
}
const M4 = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const Yaxis = new THREE.Vector3(0, 1, 0);
function segMat(a, b, r0, r1) {   // [geometry, matrix] of a tapered cylinder from a to b
  const d = b.clone().sub(a), L = d.length();
  return [new THREE.CylinderGeometry(r1, r0, L, 7), new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Yaxis, d.normalize()), new THREE.Vector3(1, 1, 1))];
}

// ================================================================================================================ painters (river)
// soft lichen rosettes (yellow-green, pale grey, orange) wrapped over a tile's edges so the repeat stays clean
function lichenOn(g, rnd, S, n, tones, r0 = 0.006, r1 = 0.02) {
  for (let i = 0; i < n; i++) {
    const cx = rnd() * S, cy = rnd() * S, r = S * (r0 + rnd() * (r1 - r0)), tc = tones[Math.floor(rnd() * tones.length)], asp = 0.6 + rnd() * 0.4, rot = rnd() * 3, a0 = 0.3 + rnd() * 0.3;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const x = cx + ox, y = cy + oy; if (x < -r || x > S + r || y < -r || y > S + r) continue;
      const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${tc},${a0})`); rg.addColorStop(0.7, `rgba(${tc},${a0 * 0.6})`); rg.addColorStop(1, `rgba(${tc},0)`);
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, asp); g.translate(-x, -y); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore();
    }
  }
}
const LICH = ["190,180,60", "230,228,212", "214,148,52", "140,160,70", "190,180,60"];
// grey ashlar like the painting's wall and parapets: courses 0.22-0.30 m, blocks of cool grey with warm ones, lichen blotches
function greyStoneCanvas(rnd, S = 2048, M = 3.2, nl = 260, warm = 0.2) {
  const c = stoneCanvas(rnd, S, "#57534e", ["#a9a59d", "#9d9992", "#b4afa5", "#908c87", "#aba69b", "#a29b92", "#b9b4a7", "#989288", "#a7a094", "#bdb7a8", "#9b9d99", "#ab9f8e", "#948f8c"], M);
  const g = c.getContext("2d"); g.fillStyle = `rgba(112,124,150,${warm})`; g.fillRect(0, 0, S, S);
  lichenOn(g, rnd, S, nl, LICH, 0.004, 0.02);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(40,36,34,${0.15 + rnd() * 0.2})`; g.lineWidth = 1 + rnd() * 1.5; const x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 60, y + rnd() * 40); g.stroke(); } return c;
}
// the granite of posts, beams and parapet coping: pale grey, big mottles, speckle, yellow and orange lichen rosettes
function graniteCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S); g.fillStyle = "#8d8a84"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { const cx = rnd() * S, cy = rnd() * S, r = 30 + rnd() * 90, tc = rnd() < 0.5 ? "120,116,108" : "214,210,196", rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(${tc},${0.12 + rnd() * 0.12})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = rnd() < 0.55 ? `rgba(70,66,60,${0.18 + rnd() * 0.25})` : `rgba(240,236,224,${0.2 + rnd() * 0.25})`; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.8, 1 + rnd() * 1.8); }
  lichenOn(g, rnd, S, 90, LICH, 0.004, 0.015); return c;
}
function barkCanvas(rnd) {
  const W = 256, H = 512, [c, g] = canvas(W, H); g.fillStyle = "#6a5645"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const x0 = rnd() * W, w = 3 + rnd() * 9; g.strokeStyle = rnd() < 0.7 ? `rgba(36,26,20,${0.35 + rnd() * 0.3})` : `rgba(180,160,134,${0.15 + rnd() * 0.2})`; g.lineWidth = w * 0.3 + 1; g.beginPath(); let x = x0; g.moveTo(x, 0); for (let y = 0; y <= H; y += 24) { x += (rnd() - 0.5) * 5; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 26; i++) { const cx = rnd() * W, cy = rnd() * H, r = 8 + rnd() * 22, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r), tc = rnd() < 0.5 ? "150,160,120" : "205,200,180"; rg.addColorStop(0, `rgba(${tc},0.35)`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  return c;
}
function woodCanvas(rnd) {
  const [c, g] = canvas(256, 256); g.fillStyle = "#8c6b5c"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.strokeStyle = rnd() < 0.6 ? `rgba(60,38,32,${0.12 + rnd() * 0.2})` : `rgba(210,176,160,${0.1 + rnd() * 0.15})`; g.lineWidth = 0.8 + rnd() * 1.6; const y = rnd() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (rnd() - 0.5) * 8, 170, y + (rnd() - 0.5) * 8, 256, y + (rnd() - 0.5) * 6); g.stroke(); }
  return c;
}
// grass with fallen leaves sprinkled into it (the garden, the strips, the banks)
function litterCanvas(rnd, S = 1024) {
  const c = grassCanvas(rnd, S), g = c.getContext("2d"), cols = ["#d9772b", "#c4472a", "#e2a53a", "#b8551f", "#f0c43a", "#a8321a"];
  for (let i = 0; i < 900; i++) { const x = rnd() * S, y = rnd() * S, r = 4 + rnd() * 6; g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.globalAlpha = 0.55 + rnd() * 0.4; g.beginPath(); g.ellipse(x, y, r, r * 0.65, rnd() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1; return c;
}
// a tuft of grass blades, grey-white so vertex colours tint it
function tuftCanvas(rnd) {
  const S = 128, [c, g] = canvas(S, S);
  for (let b = 0; b < 9; b++) {
    const x0 = 64 + (rnd() - 0.5) * 44, lean = (rnd() - 0.5) * 70, hh = 70 + rnd() * 50, w = 3 + rnd() * 3, gr = g.createLinearGradient(0, S, 0, S - hh);
    gr.addColorStop(0, "#8a8a8a"); gr.addColorStop(1, "#ffffff"); g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w, S); g.quadraticCurveTo(x0 + lean * 0.2, S - hh * 0.6, x0 + lean, S - hh); g.quadraticCurveTo(x0 + lean * 0.3 + w, S - hh * 0.5, x0 + w, S); g.fill();
  }
  return c;
}
// the sky all round (equirect, u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z): the painting's morning (lilac blue to a warm peach horizon), soft cumulus lit
// cream on top and lilac underneath, never pure white (the look's glow would flare it); far blue woods
function skyCanvas(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#6f95d6"); gr.addColorStop(0.45, "#9db8e6"); gr.addColorStop(0.8, "#cdc9e0"); gr.addColorStop(0.95, "#e8d2cc"); gr.addColorStop(1, "#ecd6c4");
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2); g.fillStyle = "#9aa27e"; g.fillRect(0, hz, W, hz);
  const lobe = (cx, cy, r) => { for (const ox of [-W, 0, W]) { const q = g.createRadialGradient(cx + ox - r * 0.2, cy - r * 0.35, r * 0.05, cx + ox, cy, r); q.addColorStop(0, "rgba(238,228,222,0.5)"); q.addColorStop(0.5, "rgba(226,216,226,0.38)"); q.addColorStop(0.8, "rgba(200,196,220,0.14)"); q.addColorStop(1, "rgba(190,186,216,0)"); g.fillStyle = q; g.beginPath(); g.arc(cx + ox, cy, r, 0, 7); g.fill(); } };
  for (let k = 0; k < 14; k++) { const u = (k + rnd() * 0.8) / 14 * W, base = hz - (60 + rnd() * 200), n = 14 + Math.floor(rnd() * 12), big = 0.6 + rnd() * 0.9; for (let i = 0; i < n; i++) lobe(u + (rnd() - 0.5) * 220 * big, base - rnd() * 22 * big - Math.abs(i - n / 2) * -3, (12 + rnd() * 24) * big); }
  [["#b3b4cc", 40, 0.7], ["#9fb0b6", 28, 1.2], ["#83a08c", 16, 2.0]].forEach(([col, hgt, f], li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 4) { const h = hgt * (0.55 + 0.45 * Math.sin(x * 0.006 * f + li * 2) * Math.sin(x * 0.0023 + li)) + (hash2(Math.floor(x / 5), li, 3) - 0.5) * 7 * (li + 1) * 0.5; g.lineTo(x, hz - Math.max(2, h)); }
    g.lineTo(W, hz + 4); g.fill();
  });
  const hg = g.createLinearGradient(0, hz - 20, 0, hz + 10); hg.addColorStop(0, "rgba(232,214,200,0)"); hg.addColorStop(0.7, "rgba(232,214,200,0.35)"); hg.addColorStop(1, "rgba(232,214,200,0)"); g.fillStyle = hg; g.fillRect(0, hz - 20, W, 30);
  return c;
}
// calm river water: sky-blue lilac with long soft horizontal strokes (tileable)
function waterCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S); const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#7f9ab8"); gr.addColorStop(0.5, "#8aa3be"); gr.addColorStop(1, "#7a95b2"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 1100; i++) {
    const y = rnd() * S, x = rnd() * S, l = 40 + rnd() ** 2 * 260, th = 1.5 + rnd() * 3.5, light = rnd() < 0.55;
    g.fillStyle = light ? `rgba(236,240,250,${0.1 + rnd() * 0.22})` : `rgba(58,84,112,${0.08 + rnd() * 0.16})`;
    for (const ox of [-S, 0, S]) { g.beginPath(); g.ellipse(x + ox, y, l / 2, th, 0, 0, 7); g.fill(); }
  }
  return c;
}
function glintCanvas(rnd, S = 512) {   // sparse bright dashes (added over the water, drifting)
  const [c, g] = canvas(S, S);
  for (let i = 0; i < 260; i++) { const x = rnd() * S, y = rnd() * S, l = 6 + rnd() * 34; g.fillStyle = `rgba(255,248,236,${0.35 + rnd() * 0.6})`; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.ellipse(x + ox, y + oy, l / 2, 0.9 + rnd() * 0.7, 0, 0, 7); g.fill(); } }
  return c;
}
function mistCanvas(rnd) {
  const W = 512, H = 128, [c, g] = canvas(W, H);
  for (let i = 0; i < 90; i++) { const cx = rnd() * W, cy = H * (0.3 + rnd() * 0.45), r = 30 + rnd() * 70, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(250,246,244,${0.1 + rnd() * 0.16})`); rg.addColorStop(1, "rgba(250,246,244,0)"); g.fillStyle = rg; g.save(); g.translate(cx, cy); g.scale(1.8, 0.7); g.translate(-cx, -cy); g.fillRect(cx - r, cy - r, 2 * r, 2 * r); g.restore(); }
  g.globalCompositeOperation = "destination-in";
  const mk = g.createLinearGradient(0, 0, W, 0); mk.addColorStop(0, "rgba(0,0,0,0)"); mk.addColorStop(0.2, "rgba(0,0,0,1)"); mk.addColorStop(0.8, "rgba(0,0,0,1)"); mk.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = mk; g.fillRect(0, 0, W, H);
  const mv = g.createLinearGradient(0, 0, 0, H); mv.addColorStop(0, "rgba(0,0,0,0)"); mv.addColorStop(0.45, "rgba(0,0,0,1)"); mv.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = mv; g.fillRect(0, 0, W, H);
  return c;
}
// one bay (2.4 m square) of a town house front: a plaster wall, a sash window with white frame, shutters, a sill
function bayCanvas(rnd, wall, shut) {
  const S = 256, [c, g] = canvas(S, S), k = S / 2.4; g.fillStyle = wall; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(120,96,70,${0.03 + rnd() * 0.05})` : `rgba(255,250,236,${0.05 + rnd() * 0.07})`; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 10 + rnd() * 40, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
  const wx = S / 2 - 0.45 * k, wy = 0.45 * k, ww = 0.9 * k, wh = 1.4 * k;
  g.fillStyle = shut; g.fillRect(wx - 0.3 * k, wy, 0.28 * k, wh); g.fillRect(wx + ww + 0.02 * k, wy, 0.28 * k, wh);
  const gl = g.createLinearGradient(0, wy, 0, wy + wh); gl.addColorStop(0, "#5a7fa8"); gl.addColorStop(0.5, "#2d3b52"); gl.addColorStop(1, "#1a1d26"); g.fillStyle = gl; g.fillRect(wx, wy, ww, wh);
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww * 0.5, wy); g.lineTo(wx, wy + wh * 0.7); g.fill();
  g.strokeStyle = "#f1ece0"; g.lineWidth = 4; g.strokeRect(wx, wy, ww, wh); g.lineWidth = 2.5; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * 0.35); g.lineTo(wx + ww, wy + wh * 0.35); g.moveTo(wx, wy + wh * 0.68); g.lineTo(wx + ww, wy + wh * 0.68); g.stroke();
  g.fillStyle = "#c9b99c"; g.fillRect(wx - 0.06 * k, wy + wh, ww + 0.12 * k, 0.07 * k); g.fillRect(wx - 0.05 * k, wy - 0.08 * k, ww + 0.1 * k, 0.07 * k);
  g.fillStyle = "rgba(60,44,30,0.14)"; g.fillRect(wx, wy + wh + 0.07 * k, ww, 0.45 * k);
  return c;
}

// ================================================================================================================ the set
const gh = (z) => 1.1 * (1 - smooth((-z - 22) / 8));                                  // the garden above the wall: 1.1 m, falling to 0 by z -30
const townRise = (x, z) => 0.12 * Math.max(0, -x - 24) * smooth((-z - 26) / 8) + 0.06 * Math.max(0, -z - 80) * smooth((-x - 8) / 20);
const westY = (x, z) => townRise(x, z) + 0.4 * (fbm(x * 0.045, z * 0.045, 3) - 0.5) * smooth((-x - 34) / 24);
const eastY = (x, z) => { const t = smooth((x - 25.5) / 4.5); return -2.4 + 2.4 * t + 0.7 * (fbm(x * 0.04, z * 0.04, 8) - 0.4) * smooth((x - 32) / 10); };

export function buildScoreRiver(scene, S = {}) {
  const seed = S.seed ?? 5, view = S.view === "bridge" ? "bridge" : "path", rnd = rng(seed * 7919 + 13), wind = S.wind ?? 1;
  const set = new THREE.Group(); set.name = "set-scoreriver"; scene.add(set);
  scene.background = new THREE.Color("#b9cde6"); scene.fog = null;
  const add = (o) => { if (o) set.add(o); return o; };
  const scen = (o) => { if (o) o.userData.solid = false; return o; };
  const rT = rng(seed * 57 + 2), rF = rng(seed * 91 + 3), rG = rng(seed * 113 + 4), rI = rng(seed * 211 + 9), rH = rng(seed * 401 + 12);
  const refl = [];   // meshes mirrored in the water
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), UPV = V3(0, 1, 0), FLAT = V3(0, 1, 0);

  // ---------------------------------------------------------------- the path's line: P(z, q) = centre + q * right-hand normal
  const arcTab = []; { let a = 0; for (let z = Z_NEAR; z >= Z_FAR - 0.5; z -= 0.25) { arcTab.push(a); a += 0.25 * Math.hypot(1, kcF(z - 0.125)); } }
  const arcAt = (z) => { const f = Math.max(0, Math.min(arcTab.length - 1.001, (Z_NEAR - z) / 0.25)), i = Math.floor(f); return arcTab[i] + (arcTab[i + 1] - arcTab[i]) * (f - i); };
  const PP = (z, q) => { const k = kcF(z), L = Math.hypot(1, k); return [xcF(z) + q / L, z - q * k / L]; };
  const hd = (z) => Math.atan2(1, -kcF(z));   // yaw of a box lying along the path (local x = the way north)
  function strip(zs, qs, yFn, uvK, colFn) {
    const B = Buf(), nq = qs.length;
    zs.forEach((z, zi) => {
      qs.forEach((q) => { const [x, zz] = PP(z, q); B.p.push(x, yFn(z, q, x, zz), zz); B.n.push(0, 1, 0); B.uv.push(arcAt(z) / uvK, q / uvK); const k = colFn ? colFn(z, q, x, zz) : 1; if (Array.isArray(k)) B.c.push(...k); else B.c.push(k, k, k); });
      if (zi) for (let j = 0; j < nq - 1; j++) { const a = (zi - 1) * nq + j, b = a + 1, c = zi * nq + j, d = c + 1; B.i.push(a, b, c, b, d, c); }
    });
    return B;
  }
  function grid(x0, x1, z0, z1, cs, yFn, colFn, uvK) {
    const nx = Math.round((x1 - x0) / cs), nz = Math.round((z1 - z0) / cs), B = Buf();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * cs, z = z0 + j * cs; B.p.push(x, yFn(x, z), z); B.n.push(0, 1, 0); B.uv.push(x / uvK, z / uvK); const k = colFn ? colFn(x, z) : 1; if (Array.isArray(k)) B.c.push(...k); else B.c.push(k, k, k); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; B.i.push(a, c, b, b, c, d); }
    return B;
  }
  const zRun = (z0, z1, near, far, zSplit) => { const r = []; for (let z = z0; z > z1; z -= z > zSplit ? near : far) r.push(z); r.push(z1); return r; };

  // ---------------------------------------------------------------- materials and painted textures
  const WARM = new THREE.Color("#1c1c22");
  const stoneT = ctex(greyStoneCanvas(rnd, 2048, 3.2)), wallT = ctex(greyStoneCanvas(rnd, 2048, 3.2, 640, 0.08)), graniteT = ctex(graniteCanvas(rnd)), barkT = ctex(barkCanvas(rnd), 1, 1, true);
  const pathT = ctex(flagCanvas(rnd, 2048, ["#b3a199", "#a8968f", "#bcab9f", "#9d8c88", "#b5a39e", "#c0ae9e", "#a99590", "#b8a595"], "#52483f", [0.34, 0.6], [0.6, 1.3]));
  const deckT = ctex(flagCanvas(rnd, 2048, ["#9b9ca2", "#8e8f96", "#a3a3a6", "#868890", "#9fa0a2", "#a8a6a2", "#92939a"], "#55565c", [0.3, 0.46], [0.8, 1.5]));
  const grassT = ctex(litterCanvas(rnd)), woodT = ctex(woodCanvas(rnd));
  const mapleT = ctex(mapleCanvas(), 1, 1, false), daisyT = ctex(daisyCanvas(), 1, 1, false), tuftT = ctex(tuftCanvas(rnd), 1, 1, false);
  const gloss = (c, o = {}) => std("#ffffff", { map: c, vertexColors: true, emissive: new THREE.Color("#2a2420"), ...o });
  const stoneM = gloss(stoneT), graniteM = gloss(graniteT, { emissive: new THREE.Color("#302c28") }), slateM = std("#ffffff", { map: ctex(slateCanvas(rnd)), roughness: 0.7 });
  const iron = std("#1d1f24", { roughness: 0.45, metalness: 0.35 }), ironV = std("#1d1f24", { roughness: 0.45, metalness: 0.35, vertexColors: true });
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#4a2308") });
  if (wind) leafMat.userData.wind = { amp: 0.045 * wind, h: 0, flutter: 1.7 };
  const ivyMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const daisyMat = lam("#ffffff", { map: daisyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#202018") });
  const tuftMat = lam("#ffffff", { map: tuftT, vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, emissive: new THREE.Color("#262a10") });
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color("#4a2208") });
  const barkM = std("#ffffff", { map: barkT, roughness: 0.95 });

  // ---------------------------------------------------------------- sky, far land
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), basic({ map: ctex(skyCanvas(rnd), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sky.position.set(10, 0, -20); sky.renderOrder = -1000; sky.frustumCulled = false; sky.name = "set-scoreriver-sky"; add(scen(sky));
  const landCol = (x, z) => { const n = fbm(x * 0.08, z * 0.08, 3), au = fbm(x * 0.04 + 5, z * 0.04, 5), c = new THREE.Color("#e4d89c").lerp(new THREE.Color("#d8a850"), smooth((au - 0.4) * 3) * 0.6).multiplyScalar(0.75 + n * 0.3); return [c.r, c.g, c.b]; };
  const landMat = std("#ffffff", { map: grassT, vertexColors: true, roughness: 1, emissive: new THREE.Color("#3e3412") });
  const addLand = (B, name, shadow = false) => { const m = bufMesh(B, landMat, false, true); m.geometry.computeVertexNormals(); m.name = name; add(scen(m)); return m; };
  addLand(grid(-3.0 - 3.5 * 28, -3.0, -126, -30, 3.5, westY, landCol, 11), "set-land-west");
  addLand(grid(18.5, 18.5 + 3.5 * 30, -126, 28, 3.5, eastY, (x, z) => { const l = landCol(x, z), w = 1 - smooth((x - 25) / 3) * 0.6; return [l[0] * (x < 27 ? 0.5 : 1) * w + 0, l[1] * (x < 27 ? 0.6 : 1), l[2] * (x < 27 ? 0.55 : 1)]; }, 11), "set-land-east");

  // ---------------------------------------------------------------- the path, the strips, the plaza
  const flagK = (z, q, x, zz) => (0.9 + 0.2 * fbm(x * 0.5, zz * 0.5, 11)) * (1 - 0.1 * smooth((Math.abs(q) - 1.6) / 0.6));
  const pathM = std("#ffffff", { map: pathT, vertexColors: true, emissive: new THREE.Color("#34262a") });
  const path = bufMesh(strip(zRun(Z_NEAR, -33, 0.75, 1.5, -14), [-HW, -1.5, 0, 1.5, HW], () => 0, 6, flagK), pathM, false, true); path.name = "set-floor"; add(path);
  const strip2 = bufMesh(strip(zRun(Z_NEAR, -33, 1.5, 3, -14), [HW, 3.2, BANK_Q], () => 0, 6, (z, q, x, zz) => 0.9 + 0.3 * fbm(x * 0.2, zz * 0.2, 4)), landMat, false, true); strip2.name = "set-strip"; add(scen(strip2));
  { // the plaza at the bridge's west end
    const g = new THREE.PlaneGeometry(20.9, 14), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 20.9 / 6, uv.getY(i) * 14 / 6);
    const m = new THREE.Mesh(g, std("#ffffff", { map: pathT, emissive: new THREE.Color("#34262a"), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.rotation.x = -Math.PI / 2; m.position.set(-13.55, 0.004, -37); m.receiveShadow = true; m.name = "set-floor-plaza"; add(m);
  }
  // the garden above the wall: grass and leaf litter, falling to the plaza's level
  addLand(strip(zRun(Z_NEAR, -33, 0.75, 1.5, -14), [-48, -34, -22, -14, -9, -6, -4, -3.4, -HW], (z, q, x, zz) => gh(z) + townRise(x, zz) + 0.02, 11, (z, q, x, zz) => landCol(x, zz)), "set-garden");

  // ---------------------------------------------------------------- the left wall: ashlar face, coping, flowers and shrubs on top
  const WB = Buf();
  for (let z = Z_NEAR, k = 0; z > -31; z -= z > -14 ? 0.75 : 1.5, k++) {
    const [x, zz] = PP(z, -HW), top = gh(z), L = Math.hypot(1, kcF(z));
    for (const y of [-0.1, top]) { WB.p.push(x, y, zz); WB.n.push(1 / L, 0, -kcF(z) / L); WB.uv.push(arcAt(z) / 3.2, y / 3.2); if (y < 0) WB.c.push(0.62, 0.8, 0.5); else WB.c.push(1, 0.98, 0.94); }
    if (k) { const a = 2 * (k - 1); WB.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  { const m = bufMesh(WB, std("#ffffff", { map: wallT, vertexColors: true, emissive: WARM, side: THREE.DoubleSide }), true, true); m.name = "set-wall"; add(m); }
  {
    const CB = Buf(), rK = rng(seed * 3 + 5); let z = Z_NEAR;
    while (z > -30) {
      const Lb = 0.8 + rK() * 0.7, z2 = z - Lb, y0 = gh(z), y1 = gh(z2);
      if (y1 > 0.2) { const [xa, za] = PP(z, -HW - 0.2), [xb, zb] = PP(z2, -HW - 0.2), dx = xb - xa, dz = zb - za, L = Math.hypot(dx, dz), tilt = Math.atan2(y1 - y0, L), col = new THREE.Color().setScalar(0.92 + rK() * 0.14); addBox(CB, (xa + xb) / 2, (y0 + y1) / 2 + 0.07, (za + zb) / 2, L - 0.015, 0.17 + rK() * 0.03, 0.6, col, Math.atan2(-dz, dx), tilt, 1.2); }
      z = z2;
    }
    const m = bufMesh(CB, graniteM); m.name = "set-wall-coping"; add(m);
  }
  // wild garden things on the wall top: flowers (cream, yellow), red berries, shrubs
  { const FQ = Buf(), BQ = Buf(), LQ = Buf(); const cr = ["#f4ecd0", "#f6e08a", "#f2d24a", "#fff6e0", "#f4e4b0"];
    const gc = ["#5f8a38", "#7ea23a", "#9aa832", "#b9962a", "#c96b1e", "#6a9a3e"], bc = ["#c8301c", "#d9461c", "#a8221a", "#e2601e"];
    const patch = (z0, z1, q0, q1, n, flowers) => {
      for (let i = 0; i < n; i++) {
        const z = z0 + rF() * (z1 - z0), q = q0 + rF() * (q1 - q0), [x, zz] = PP(z, q), y = gh(z) + 0.05 + rF() * 0.5 * (1 - 0.4 * Math.abs((q - (q0 + q1) / 2) / (q1 - q0 + 0.01)));
        const nrm = V3((rF() - 0.5) * 0.8, 0.4 + rF() * 0.6, 0.5 + rF() * 0.6).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
        addCard(LQ, x, y, zz, a, b, 0.12 + rF() * 0.08, 0.12 + rF() * 0.08, nrm, tint(gc[Math.floor(rF() * gc.length)], rF));
        if (flowers && rF() < 0.7) { const n2 = V3((rF() - 0.5) * 0.4, 0.3 + rF() * 0.4, 1).normalize(), [a2, b2] = frameOf(n2, rF() * 6.28); addCard(FQ, x + (rF() - 0.5) * 0.1, y + 0.1 + rF() * 0.25, zz + 0.1, a2, b2, 0.075 + rF() * 0.05, 0.075 + rF() * 0.05, n2, tint(cr[Math.floor(rF() * cr.length)], rF, 0.01, 0.05, 0.04)); }
        if (flowers && rF() < 0.35) { const n3 = V3(0, 0.6, 1).normalize(), [a3, b3] = frameOf(n3, rF() * 6.28); addCard(BQ, x + (rF() - 0.5) * 0.2, y + rF() * 0.4, zz + 0.12, a3, b3, 0.05, 0.05, n3, tint(bc[Math.floor(rF() * bc.length)], rF)); }
      }
    };
    patch(4.5, 0.5, -2.6, -3.7, 520, true); patch(0.5, -5, -2.5, -3.5, 380, true); patch(-5, -12, -2.5, -3.5, 260, true); patch(-12, -24, -2.5, -3.4, 150, false);
    add(bufMesh(LQ, ivyMat, true, false)); add(bufMesh(FQ, daisyMat, true, false)); add(bufMesh(BQ, daisyMat, false, false));
  }

  // ---------------------------------------------------------------- the river side: granite posts and beams, the grass strip, the revetment
  {
    const GB = Buf(), rK = rng(seed * 9 + 1), col = () => new THREE.Color().setScalar(0.9 + rK() * 0.16);
    const post = (x, z, ry) => {
      const h = 0.72 + (rK() - 0.5) * 0.05; addBox(GB, x, h / 2, z, 0.38, h, 0.38, col(), ry + (rK() - 0.5) * 0.04, 0, 1.2);
      addBox(GB, x, h + 0.04, z, 0.46, 0.08, 0.46, col(), ry, 0, 1.2); addBox(GB, x, h + 0.13, z, 0.38, 0.07, 0.38, col(), ry, 0, 1.2);
    };
    const run = (pts, ryOf) => {
      pts.forEach(([x, z, hr], i) => {
        post(x, z, hr);
        if (i) { const [x0, z0] = pts[i - 1], dx = x - x0, dz = z - z0, L = Math.hypot(dx, dz) - 0.3; addBox(GB, (x + x0) / 2, 0.5, (z + z0) / 2, L, 0.2 + rK() * 0.03, 0.24, col(), Math.atan2(-dz, dx), 0, 1.2); }
      });
    };
    const A = []; for (let z = 9; z > -30.5; z -= 3.2) { const [x, zz] = PP(z, 2.7); A.push([x, zz, hd(z)]); }
    run(A);
    const Bq = []; for (let z = -38.4; z > -76; z -= 2.4) Bq.push([-3.5, z, Math.PI / 2]);
    run(Bq);
    const m = bufMesh(GB, graniteM); m.name = "set-fence"; add(m);
    // revetment: a stone face from the strip down into the water, along the path and then straight north along the quay
    const RB = Buf(); let k = 0; const pts = [];
    for (let z = Z_NEAR; z >= -30; z -= 1.5) { const [x, zz] = PP(z, BANK_Q); pts.push([x, zz, arcAt(z)]); }
    for (let z = -30; z >= -126; z -= 6) pts.push([-3.0, z, arcAt(-30) + (-30 - z)]);
    pts.forEach(([x, zz, s]) => { for (const y of [WATER_Y - 0.8, 0]) { RB.p.push(x, y, zz); RB.n.push(1, 0, 0); RB.uv.push(s / 3.2, y / 3.2); RB.c.push(0.9, 0.9, 0.9); } if (k) { const a = 2 * (k - 1); RB.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } k++; });
    const rm = bufMesh(RB, std("#ffffff", { map: stoneT, vertexColors: true, emissive: WARM, side: THREE.DoubleSide }), false, true); rm.name = "set-revetment"; add(rm);
    // grass tufts and daisies in the strip, and wild grass along the wall's foot
    const TQ = Buf(), DQ = Buf(), tc = ["#7e9a3a", "#a6b04a", "#c9b24a", "#6e8f3c", "#d3a23c", "#8fa843"];
    const tuft = (x, y, z, w, h, col) => { for (let c = 0; c < 2; c++) { const a = rF() * 3.14, t1 = V3(Math.cos(a), 0, -Math.sin(a)), n = V3(Math.sin(a), 0, Math.cos(a)); addCard(TQ, x, y + h / 2, z, t1, UPV, w, h, n, col); } };
    for (let i = 0; i < 120; i++) { const z = 9 - rF() * 39, q = 3.0 + rF() * 0.45, [x, zz] = PP(z, q), h = 0.2 + rF() * 0.3; tuft(x, 0, zz, 0.45 + rF() * 0.25, h * 0.6, tint(tc[Math.floor(rF() * tc.length)], rF)); }
    for (let i = 0; i < 70; i++) { const z = 9 - rF() * 39, q = 2.95 + rF() * 0.5, [x, zz] = PP(z, q), n3 = V3(0, 0.3, 1).normalize(), [a3, b3] = frameOf(n3, rF() * 6.28); addCard(DQ, x, 0.15 + rF() * 0.3, zz, a3, b3, 0.11, 0.11, n3, tint(rF() < 0.7 ? "#fbf6ea" : "#f4d24a", rF, 0.01, 0.04, 0.03)); }
    for (let i = 0; i < 90; i++) { const z = 9 - rF() * 38, [x, zz] = PP(z, -HW + 0.18 + rF() * 0.2), h = 0.25 + rF() * 0.35; tuft(x, 0, zz, 0.4, h, tint(tc[Math.floor(rF() * tc.length)], rF)); }
    add(bufMesh(TQ, tuftMat, false, false)); add(bufMesh(DQ, daisyMat, false, false));
  }

  // ---------------------------------------------------------------- trees: 3D trunks and boughs, thousands of painted maple-leaf cards
  const TONES = {
    red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e", "#a8221a"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"],
    gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e", "#f2c038"], mix: ["#d9461c", "#e8751e", "#f0b21e", "#c8301c", "#f6cc3a", "#e08c1e"], green: ["#6f9a3a", "#8aa83a", "#b9b02a", "#5a8a3a", "#d8a82a"],
  };
  let TR = null, DET = 1; const newTR = () => ({ wood: [], leaf: Buf(), core: Buf() });
  function clump(c, r, tone, scaleY = 0.78, cards = null, cardSz = 0.27) {
    const pal = TONES[tone].map((h) => new THREE.Color(h)), n = cards ?? Math.round((80 + 240 * r) * DET), dark = pal[0].clone().lerp(pal[1], 0.5).multiplyScalar(0.5), kc = 0.72 + rT() * 0.5, cs = cardSz * (DET < 1 ? 1.3 : 1);
    const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = TR.core.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); TR.core.p.push(c.x + x * r * 0.5, c.y + y * r * 0.5 * scaleY, c.z + z * r * 0.5); _n.set(x, y, z).normalize(); TR.core.n.push(_n.x, _n.y, _n.z); TR.core.uv.push(0, 0); TR.core.c.push(dark.r, dark.g, dark.b); TR.core.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = V3(rr * Math.cos(th), u * scaleY, rr * Math.sin(th));
      const rad = r * (0.7 + rT() * 0.32), p = V3(c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad);
      const nrm = V3(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = cs * (0.75 + rT() * 0.5);
      addCard(TR.leaf, p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
    }
  }
  // o: y0 ground, lean [dx, dz] of the trunk top, bias [bx, bz] pushed into every bough (so a crown can hang over the path), R crown radius, r trunk radius
  function maple(x, z, h, tone, o = {}) {
    const y0 = o.y0 ?? 0, [lx, lz] = o.lean ?? [(rT() - 0.5) * 0.4, (rT() - 0.5) * 0.2], [bx, bz] = o.bias ?? [0, 0], R = o.R ?? h * 0.36;
    const trunkH = h * (o.trunk ?? 0.5), r0 = o.r ?? 0.09 + h * 0.014, pts = [0, 0.25, 0.5, 0.75, 1].map((k) => V3(x + lx * k * k + Math.sin(k * 3 + x) * 0.05, y0 + k * trunkH, z + lz * k * k));
    pts.forEach((p, i) => { if (i) TR.wood.push(segMat(pts[i - 1], p, r0 * (1 - (i - 1) * 0.15), r0 * (1 - i * 0.15))); });
    TR.wood.push([new THREE.ConeGeometry(r0 * 1.9, 0.5, 8), M4(x, y0 + 0.2, z)]);
    const top = pts[4], nb = (o.branches ?? 6) + 1, tn = () => (o.tones ? o.tones[Math.floor(rT() * o.tones.length)] : tone);
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * 6.28 + rT() * 0.7, el = 0.45 + rT() * 0.5, f = 0.35 + (b % 3) * 0.2, st = pts[Math.min(4, Math.round(f * 4))].clone(), L = R * (0.75 + rT() * 0.45);
      st.y = y0 + trunkH * (0.55 + 0.45 * f);
      const dir = V3(Math.cos(a) * Math.cos(el) + bx, Math.sin(el), Math.sin(a) * Math.cos(el) + bz).normalize(), mid = st.clone().addScaledVector(dir, L * 0.5), tip = st.clone().addScaledVector(dir, L).add(V3(0, L * 0.18, 0)), rb = r0 * (0.5 - b * 0.02);
      TR.wood.push(segMat(st, mid, rb, rb * 0.62)); TR.wood.push(segMat(mid, tip, rb * 0.62, 0.025));
      if (rT() < 0.85) { const f2 = mid.clone(), d2 = dir.clone().applyAxisAngle(Yaxis, (rT() < 0.5 ? -1 : 1) * (0.6 + rT() * 0.5)), e2 = f2.clone().addScaledVector(d2, L * 0.55).add(V3(0, L * 0.12, 0)); TR.wood.push(segMat(f2, e2, rb * 0.4, 0.02)); clump(e2, R * (0.3 + rT() * 0.14), tn()); }
      clump(tip, R * (0.34 + rT() * 0.16), tn());
      clump(tip.clone().add(V3((rT() - 0.5) * R * 0.5, R * (0.2 + rT() * 0.2), (rT() - 0.5) * R * 0.5)), R * (0.26 + rT() * 0.12), tn());
      clump(mid.clone().addScaledVector(dir, L * 0.18).add(V3(0, 0.2, 0)), R * (0.26 + rT() * 0.1), tn());
    }
    clump(top.clone().add(V3(bx * R * 0.4, R * 0.55, bz * R * 0.4)), R * 0.42, tone);
    clump(top.clone().add(V3(R * 0.3, R * 0.2, -R * 0.2)), R * 0.36, tone);
  }
  function shrub(x, y, z, r, tone) { clump(V3(x, y + r * 0.55, z), r, tone, 0.72, Math.round(70 + 170 * r), 0.17); }
  function finishTrees(name, o = {}) {
    const cast = o.cast !== false, wm = mergedGeo(TR.wood, barkM, cast), lm = bufMesh(TR.leaf, leafMat, cast, true), cm = bufMesh(TR.core, coreMat, false, true);
    for (const [m, n] of [[wm, "trunks"], [lm, "leaves"], [cm, "core"]]) if (m) { m.name = `${name}-${n}`; m.frustumCulled = false; add(scen(m)); if (o.reflect) refl.push(m); }
    TR = null;
  }
  const pathTree = (z, q, h, tone, o = {}) => { const [x, zz] = PP(z, q); maple(x, zz, h, tone, { y0: gh(z) + townRise(x, zz) + 0.05, lean: [0.9, 0], bias: [0.35, 0], trunk: 0.46, R: h * 0.34, r: 0.12 + h * 0.012, branches: 5, ...o }); };
  if (S.trees !== false) {
    // the garden's maples above the wall: a big red one whose boughs sweep over the path (panel 07's top left), an orange one near the bench, then a row down the path
    TR = newTR(); DET = 1;
    maple(-4.3, -3.4, 11, "red", { y0: 1.1, lean: [2.0, -0.2], bias: [0.65, 0], trunk: 0.42, R: 4.5, r: 0.3, branches: 7, tones: ["red", "orange", "gold", "red", "red"] });
    maple(-3.6, 1.3, 7.8, "orange", { y0: 1.1, lean: [1.3, 0], bias: [0.5, 0], trunk: 0.62, R: 3.2, r: 0.15, tones: ["orange", "gold", "orange", "red"] });
    maple(-5.2, -8.5, 10, "gold", { y0: 1.1, lean: [1.4, 0], bias: [0.45, 0], trunk: 0.46, R: 3.6, r: 0.2, tones: ["gold", "orange", "gold"] });
    [[-13.5, -5.2, 10, "orange"], [-19, -5.6, 10.5, "red"], [-24.5, -5.4, 9, "gold"], [-30, -5.5, 8.5, "orange"]].forEach(([z, q, h, t]) => pathTree(z, q, h, t, { tones: [t, "mix", t] }));
    shrub(-3.4, 1.15, 4.2, 0.8, "gold"); shrub(-3.9, 1.15, -0.8, 0.7, "red"); shrub(-3.3, 1.15, -7.4, 0.75, "orange"); shrub(-3.6, 1.1, -11.5, 0.8, "green");
    for (let z = -9; z > -31; z -= 2.6) { const [sx, sz] = PP(z, -4.3); shrub(sx, gh(z) + 0.02, sz, 0.7 + rT() * 0.6, ["gold", "red", "orange", "mix", "green"][Math.floor(rT() * 5)]); }
    { // boughs of the big red maple reaching across the path, hung with low clumps (the canopy across the top of panels 07/08)
      const base = V3(-3.0, 4.1, -3.4);
      [[-2.2, 4.3, -4.4, 1.7, "red"], [1.4, 4.2, -6.6, 1.9, "orange"], [2.4, 4.4, -9.5, 1.8, "gold"], [-1.9, 4.4, -8.2, 1.6, "red"], [0.8, 4.3, -2.2, 1.5, "orange"], [-2.0, 4.0, -6.0, 1.6, "gold"], [2.0, 4.6, -12.5, 1.7, "red"]].forEach(([x, y, z, r, t], i) => {
        const e = V3(x, y, z); TR.wood.push(segMat(base, e, 0.13, 0.04)); clump(e, r, t); clump(e.clone().add(V3(0.7, 0.5, -1.1)), r * 0.8, i % 2 ? "red" : "orange");
      });
    }
    finishTrees("set-trees-left");
    TR = newTR(); DET = 0.6;   // a second rank behind the garden and the far plaza trees
    [[-6, -12], [-14, -14], [-22, -13], [-30, -15], [-10, -19], [-27, -21]].forEach(([z, q], i) => pathTree(z, q, 11 + (i % 3), ["gold", "orange", "red"][i % 3], { R: 4, tones: ["mix", "gold", "orange", "red"] }));
    [[-8.5, -46, 9.5, "orange"], [-12, -56, 10.5, "gold"], [-6, -60, 9, "red"], [-15, -68, 11, "orange"], [-9, -76, 11, "gold"], [-18, -49, 9, "red"], [-5.6, -42.6, 6.5, "gold"], [-5.8, -29.0, 6, "orange"]].forEach(([x, z, h, t]) => maple(x, z, h, t, { y0: westY(x, z) + 0.05, trunk: 0.46, R: h * 0.36, r: 0.1 + h * 0.012, branches: 5, tones: [t, "mix", t] }));
    finishTrees("set-trees-west", { cast: false, reflect: true });
    TR = newTR(); DET = 0.55;   // the far bank
    [[23.5, 7, 10, "orange"], [24.5, -3, 12, "gold"], [25, -14, 11, "red"], [23.5, -22, 10, "mix"], [26.5, -29, 13, "orange"], [29, -41, 14, "gold"], [24.5, -50, 12, "red"], [27, -63, 12, "orange"], [33, -17, 14, "gold"], [34, -6, 12, "orange"], [31, 5, 12, "red"], [38, -28, 15, "mix"], [35, -48, 14, "gold"], [42, -12, 14, "orange"], [22.5, -75, 12, "gold"], [30, -85, 13, "orange"]]
      .forEach(([x0, z, h, t]) => { const x = x0 < 40 ? x0 + 6 : x0; maple(x, z, h, t, { y0: eastY(x, z) + 0.05, trunk: 0.5, R: h * 0.36, r: 0.1 + h * 0.014, branches: 5, tones: [t, "mix", t] }); });
    for (let z = 10; z > -90; z -= 3.2) { const x = 28.4 + rT() * 3; shrub(x, eastY(x, z) + 0.05, z, 0.9 + rT() * 1.1, ["gold", "red", "orange", "mix", "green", "orange"][Math.floor(rT() * 6)]); }
    for (let k = 0; k < 18; k++) { const x = 44 + rT() * 40, z = 20 - rT() * 120; maple(x, z, 14 + rT() * 5, ["orange", "gold", "red", "mix"][k % 4], { y0: eastY(x, z) + 0.05, trunk: 0.5, R: 5.5, r: 0.2, branches: 5 }); }
    finishTrees("set-trees-east", { cast: false, reflect: true });
  }

  // ---------------------------------------------------------------- the bench: grey-brown slats on black cast-iron ends, against the wall, facing the path
  {
    const BB = Buf(), IB = Buf(), bx = RIVER.bench.x, bz = RIVER.bench.z, Lb = RIVER.bench.length, rK = rng(seed * 5 + 3), wc = () => new THREE.Color().setScalar(0.88 + rK() * 0.2), P = [];
    for (let i = 0; i < 5; i++) addBox(BB, bx - 0.18 + i * 0.09, 0.43, bz, 0.078, 0.04, Lb, wc(), 0, 0, 0.8);
    for (let i = 0; i < 3; i++) { const y = 0.6 + i * 0.14; addBox(BB, bx - 0.25 - (y - 0.45) * 0.18, y, bz, 0.035, 0.115, Lb, wc(), 0, 0.18, 0.8); }
    for (const sd of [-1, 1]) {
      const z = bz + sd * (Lb / 2 - 0.08);
      addBox(IB, bx + 0.2, 0.22, z, 0.05, 0.44, 0.06, WHITE); addBox(IB, bx - 0.25 - 0.05, 0.43, z, 0.05, 0.9, 0.06, WHITE, 0, 0.18);
      addBox(IB, bx - 0.02, 0.395, z, 0.5, 0.04, 0.06, WHITE); addBox(IB, bx - 0.02, 0.64, z, 0.5, 0.04, 0.07, WHITE); addBox(IB, bx + 0.2, 0.52, z, 0.04, 0.26, 0.05, WHITE);
      P.push([new THREE.TorusGeometry(0.1, 0.014, 6, 16), M4(bx + 0.06, 0.2, z + sd * 0.03, 1, 1, 1, 0, Math.PI / 2, 0)], [new THREE.TorusGeometry(0.07, 0.012, 6, 14), M4(bx + 0.18, 0.08, z + sd * 0.03, 1, 1, 1, 0, Math.PI / 2, 0)]);
    }
    const bm = bufMesh(BB, std("#ffffff", { map: woodT, vertexColors: true, roughness: 0.8 })); bm.name = "set-bench"; add(bm);
    add(bufMesh(IB, ironV)); add(mergedGeo(P, iron));
  }

  // ---------------------------------------------------------------- the river: calm water (painted strokes, drifting glints), mirrored banks, mist
  const WW = 46, WD = 200, WX = 14, WZ = -45;
  const waterM = new THREE.MeshBasicMaterial({ map: ctex(waterCanvas(rnd), WW / 14, WD / 14), transparent: true, opacity: 0.42, depthWrite: false, fog: false, toneMapped: false }); waterM.userData.noOutline = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WW, WD), waterM); water.rotation.x = -Math.PI / 2; water.position.set(WX, WATER_Y, WZ); water.renderOrder = 1; water.name = "set-water"; add(scen(water));
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(WW, WD), basic({ color: "#5d7c8f", toneMapped: false })); bed.rotation.x = -Math.PI / 2; bed.position.set(WX, -16, WZ); bed.frustumCulled = false; add(scen(bed));
  const glints = [[WW / 8, 0.011, 0.006, "#fff2d6", 0.55], [WW / 13, -0.007, 0.012, "#e9f0ff", 0.4]].map(([rep, vx, vy, col, op], i) => {
    const t = ctex(glintCanvas(rnd), rep, WD / WW * rep), m = new THREE.MeshBasicMaterial({ map: t, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }); m.userData.noOutline = true;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(WW, WD), m); p.rotation.x = -Math.PI / 2; p.position.set(WX, WATER_Y + 0.004 + i * 0.002, WZ); p.renderOrder = 2; add(scen(p)); return { t, vx, vy, m, op, i };
  });
  { const flow = (t) => { for (const g of glints) { g.t.offset.set((g.vx * t) % 1, (g.vy * t) % 1); g.m.opacity = g.op * (0.8 + 0.2 * Math.sin(t * (1.3 + g.i * 0.7))); } }; flow(0); (globalThis.__setTicks ||= []).push(flow); }
  // morning mist: soft cards over the water (z -14 / -26 / -40 at alpha 0.12 / 0.18 / 0.22, the panels' numbers), drifting 0.05 m/s, and low banks round the arches
  const mistT = ctex(mistCanvas(rnd), 1, 1, false), mistK = S.mist ?? 1, mists = [];
  if (mistK > 0) {
    [[-14, 0.12, 26, 3.0, -0.2, 12], [-26, 0.18, 30, 3.0, -0.2, 14], [-40, 0.22, 34, 3.2, 0, 15], [-31.3, 0.26, 24, 1.7, -0.7, 12], [-36.8, 0.26, 24, 1.7, -0.7, 11]].forEach(([z, a, w, h, y, x0], i) => {
      const m = new THREE.MeshBasicMaterial({ map: mistT, transparent: true, opacity: a * mistK, depthWrite: false, fog: false, toneMapped: false }); m.userData.noOutline = true;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x0, y, z); p.renderOrder = 5 + i; add(scen(p)); mists.push({ p, x0 });
    });
    const drift = (t) => { for (const m of mists) m.p.position.x = m.x0 + 0.05 * t; }; drift(0); (globalThis.__setTicks ||= []).push(drift);
  }

  // ---------------------------------------------------------------- the old stone bridge: two arches, a pier with cutwaters, deck, parapets, voussoir rings
  const stoneP = std("#ffffff", { map: stoneT, emissive: WARM });
  const ARCHES = [{ x0: -1.2, x1: 6.0, crown: 0.8 }, { x0: 9.0, x1: 24.0, crown: 2.4 }], YS = -1.1, BOT = WATER_Y - 0.05, BX0 = -3, BX1 = 41;
  ARCHES.forEach((a) => { a.half = (a.x1 - a.x0) / 2; const f = a.crown - YS; a.R = (a.half * a.half + f * f) / (2 * f); a.cx = (a.x0 + a.x1) / 2; a.cy = a.crown - a.R; a.phi = Math.asin(a.half / a.R); });
  const planarUV = (g) => {
    const n = g.attributes.normal, p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) / 3.2, p.getY(i) / 3.2); else if (ay >= ax) uv.setXY(i, p.getX(i) / 3.2, p.getZ(i) / 3.2); else uv.setXY(i, p.getZ(i) / 3.2, p.getY(i) / 3.2); }
  };
  { // body: one outline (water line, up into each arch, the deck's hump), extruded across the deck
    const sh = new THREE.Shape(); sh.moveTo(BX0, BOT);
    for (const a of ARCHES) { sh.lineTo(a.x0, BOT); sh.lineTo(a.x0, YS); for (let i = 1; i <= 32; i++) { const ph = -a.phi + 2 * a.phi * i / 32; sh.lineTo(a.cx + a.R * Math.sin(ph), a.cy + a.R * Math.cos(ph)); } sh.lineTo(a.x1, BOT); }
    sh.lineTo(BX1, BOT); for (let x = BX1; x >= BX0 - 1e-6; x -= 0.5) sh.lineTo(x, deckYF(x)); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: BRW, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, BZ - BRW / 2); planarUV(g);
    const m = new THREE.Mesh(g, stoneP); m.castShadow = m.receiveShadow = true; m.name = "set-bridge"; add(m); refl.push(m);
    // the pier's cutwaters: six-sided in plan, up to just under the deck
    const ps = new THREE.Shape(); [[6.0, -2.25], [7.5, -3.8], [9.0, -2.25], [9.0, 2.25], [7.5, 3.8], [6.0, 2.25]].forEach(([x, y], i) => (i ? ps.lineTo(x, y) : ps.moveTo(x, y)));
    const pg = new THREE.ExtrudeGeometry(ps, { depth: 2.6, bevelEnabled: false }); pg.rotateX(-Math.PI / 2); pg.translate(0, BOT, BZ); planarUV(pg);
    const pm = new THREE.Mesh(pg, stoneP); pm.castShadow = pm.receiveShadow = true; pm.name = "set-bridge-pier"; add(pm); refl.push(pm);
  }
  { // deck paving, parapets (solid), coping, voussoir rings
    const xs = []; for (let x = BX0; x < BX1; x += 0.5) xs.push(x); xs.push(BX1);
    const DB = Buf(); xs.forEach((x, i) => { for (const sd of [-1, 1]) { DB.p.push(x, deckYF(x) + 0.012, BZ + sd * PARA); DB.n.push(0, 1, 0); DB.uv.push(x / 6, sd * PARA / 6); const k = 0.92 + 0.14 * fbm(x * 0.3, sd * 3, 2); DB.c.push(k, k, k); } if (i) { const a = 2 * (i - 1); DB.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const dm = bufMesh(DB, std("#ffffff", { map: deckT, vertexColors: true, emissive: new THREE.Color("#2c2c32"), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); dm.name = "set-floor-deck"; add(dm);
    const PB = Buf(), CB2 = Buf(), rK = rng(seed * 13 + 2);
    for (const sd of [-1, 1]) {
      let x = BX0; const zc = BZ + sd * (PARA + 0.275);
      while (x < BX1 - 0.3) {
        const L = Math.min(0.85 + rK() * 0.5, BX1 - x), y0 = deckYF(x), y1 = deckYF(x + L), tilt = Math.atan2(y1 - y0, L), ym = (y0 + y1) / 2, c = 0.88 + rK() * 0.2;
        addBox(PB, x + L / 2, ym + 0.6, zc + (rK() - 0.5) * 0.05, L + 0.03, 1.4 + (rK() - 0.5) * 0.08, 0.56 + rK() * 0.08, new THREE.Color().setScalar(c * (0.85 + rK() * 0.25)), (rK() - 0.5) * 0.03, tilt, 3.2);
        addBox(CB2, x + L / 2, ym + 1.35, zc, L + 0.05, 0.16, 0.72, new THREE.Color().setScalar(c * 1.06), 0, tilt, 1.2);
        x += L;
      }
    }
    const pm = bufMesh(PB, gloss(stoneT)); pm.name = "set-bridge-parapet"; add(pm); refl.push(pm); const cp = bufMesh(CB2, graniteM); cp.name = "set-bridge-coping"; add(cp); refl.push(cp);
    const VB = Buf();
    for (const a of ARCHES) { const N = Math.round(a.half * 2.4); for (const sd of [-1, 1]) for (let i = 0; i < N; i++) {
      const ph = -a.phi + 2 * a.phi * (i + 0.5) / N, rr = a.R + 0.27, arcL = 2 * a.phi * rr / N, c = 0.8 + rK() * 0.3;
      addBox(VB, a.cx + rr * Math.sin(ph), a.cy + rr * Math.cos(ph), BZ + sd * (BRW / 2 + 0.02), 0.5, arcL * 0.96, 0.14, new THREE.Color().setScalar(c), 0, Math.PI / 2 - ph, 1.2);
    } }
    const vm = bufMesh(VB, graniteM); vm.name = "set-bridge-voussoirs"; add(vm); refl.push(vm);
  }
  // the two iron lamp posts on the parapets (panel 10), ornate cast iron after the street's lamp
  {
    const lampIron = std("#1b2a25", { roughness: 0.45, metalness: 0.4 });
    const lamp = (lx, ly, lz, sc = 1) => {
      const P = [], T = (r, tube, y, rx = Math.PI / 2) => [new THREE.TorusGeometry(r, tube, 6, 14), M4(lx, ly + y * sc, lz, sc, sc, sc, rx)];
      P.push([new THREE.BoxGeometry(0.4, 0.14, 0.4), M4(lx, ly + 0.07 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.17, 0.24, 0.36, 12), M4(lx, ly + 0.32 * sc, lz, sc, sc, sc)], [new THREE.SphereGeometry(0.15, 12, 8), M4(lx, ly + 0.72 * sc, lz, sc, 1.3 * sc, sc)],
        [new THREE.CylinderGeometry(0.07, 0.11, 0.5, 10), M4(lx, ly + 0.55 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.05, 0.07, 2.35, 10), M4(lx, ly + 2.05 * sc, lz, sc, sc, sc)], T(0.11, 0.02, 0.45), T(0.09, 0.018, 1.0), T(0.085, 0.018, 1.3), T(0.075, 0.016, 2.6), T(0.1, 0.02, 3.2),
        [new THREE.CylinderGeometry(0.1, 0.06, 0.14, 8), M4(lx, ly + 3.28 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.2, 0.17, 0.05, 6), M4(lx, ly + 3.38 * sc, lz, sc, sc, sc)],
        [new THREE.CylinderGeometry(0.075, 0.2, 0.1, 6), M4(lx, ly + 3.95 * sc, lz, sc, sc, sc)], [new THREE.ConeGeometry(0.24, 0.3, 6), M4(lx, ly + 4.12 * sc, lz, sc, sc, sc)], [new THREE.SphereGeometry(0.05, 8, 6), M4(lx, ly + 4.32 * sc, lz, sc, sc, sc)], T(0.07, 0.014, 4.0));
      for (const sd of [-1, 1]) P.push([new THREE.TorusGeometry(0.16, 0.014, 6, 12, Math.PI * 1.3), M4(lx + sd * 0.16 * sc, ly + 3.1 * sc, lz, sc, sc, sc, 0, Math.PI / 2, sd > 0 ? 0 : Math.PI)]);   // scroll brackets
      add(mergedGeo(P, lampIron));
      const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * sc, 0.12 * sc, 0.5 * sc, 6), basic({ color: new THREE.Color(1.0, 0.92, 0.66) })); lan.position.set(lx, ly + 3.67 * sc, lz); add(lan);
      for (let k = 0; k < 6; k++) { const an = (k / 6) * 6.28 + 0.52; const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.52 * sc, 0.025), lampIron); bar.position.set(lx + Math.cos(an) * 0.17 * sc, ly + 3.67 * sc, lz + Math.sin(an) * 0.17 * sc); bar.rotation.z = Math.cos(an) * 0.14; bar.rotation.x = -Math.sin(an) * 0.14; bar.castShadow = false; add(bar); }
    };
    for (const [lx, lz] of RIVER.bridge.lamps) { const ly = deckYF(lx) + 1.45; lamp(lx, ly, lz, 0.8); }
  }

  // ---------------------------------------------------------------- the town at the bridge's west end: plaza, gate house, houses climbing the hill, the church
  const landH = (x, z) => gh(z) + townRise(x, z);
  if (S.town !== false) {
    const bays = [["#e8d6a8", "#6f8f72"], ["#dcc0a2", "#8a5a4a"], ["#cfd0c2", "#5f7f9a"], ["#e5c9a6", "#7a8f62"], ["#d8b8a4", "#6a7a8c"]].map(([w, s]) => std("#ffffff", { map: ctex(bayCanvas(rH, w, s)), emissive: new THREE.Color("#3a3028") }));
    const gableM = std("#b9a98f", { side: THREE.DoubleSide }), doorM = std("#4a3a30", { roughness: 0.6 });
    const roofOf = (g, w, d, y, rise, chim = true) => {
      const half = d / 2, ang = Math.atan2(rise, half), L = Math.hypot(half, rise) + 0.3;
      for (const sd of [-1, 1]) { const geo = new THREE.BoxGeometry(w + 0.5, 0.14, L), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2.2, uv.getY(i) * L / 2.2); const m = new THREE.Mesh(geo, slateM); m.position.set(0, y + rise / 2 + 0.04, sd * half / 2); m.rotation.x = sd * ang; g.add(m); }
      for (const sx of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-half, 0); tri.lineTo(half, 0); tri.lineTo(0, rise); const tg = new THREE.ShapeGeometry(tri); tg.rotateY(Math.PI / 2); const m = new THREE.Mesh(tg, gableM); m.position.set(sx * (w / 2 - 0.02), y, 0); g.add(m); }
      if (chim) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), stoneP); c.position.set(w * 0.28, y + rise + 0.2, d * 0.12); g.add(c); }
    };
    const house = (x, z, w, d, h, yaw, ti) => {
      const y0 = landH(x, z), g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = yaw; set.add(g);
      const hh = h + 0.25, geo = new THREE.BoxGeometry(w, hh, d), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4), ext = f < 2 ? d : f < 4 ? 0.6 : w; uv.setXY(i, uv.getX(i) * ext / 2.4, uv.getY(i) * (f < 4 && f > 1 ? 0.25 : hh / 2.4)); }
      geo.translate(0, h / 2 - 0.125, 0); const m = new THREE.Mesh(geo, bays[ti % bays.length]); m.receiveShadow = true; g.add(m);
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.14), doorM); door.position.set(-w / 2 + 1.2, 1.0, d / 2 + 0.04); g.add(door);
      roofOf(g, w, d, h, d * 0.34); g.traverse((o) => { o.userData.solid = false; });
    };
    [[-29, -24, 7.2, 7.2, 7.2, 1], [-28, -45, 7.2, 6, 9.6, 1], [-37, -32, 4.8, 7.2, 7.2, 2], [-39, -43, 7.2, 7.2, 7.2, 3], [-47, -25, 7.2, 7.2, 9.6, 4], [-50, -38, 7.2, 7.2, 9.6, 1], [-31, -14, 7.2, 7.2, 7.2, 0], [-44, -16, 7.2, 6, 7.2, 3]].forEach(([x, z, w, d, h, ti]) => house(x, z, w, d, h, Math.PI / 2, ti));
    [[-22, -51, 9.6, 6, 7.2, 0], [-34, -55, 9.6, 6, 7.2, 2], [-48, -53, 7.2, 6, 7.2, 3], [-12, -66, 7.2, 6, 7.2, 1]].forEach(([x, z, w, d, h, ti]) => house(x, z, w, d, h, 0, ti));
    // the street through the gate and on up the hill: flagstones
    { const sg = grid(-72, -23, -37, -31, 3, (x, z) => townRise(x, z) + 0.012, (x, z) => 0.9 + 0.2 * fbm(x * 0.4, z * 0.4, 6), 6); const m = bufMesh(sg, std("#ffffff", { map: pathT, vertexColors: true, emissive: new THREE.Color("#34262a"), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); m.geometry.computeVertexNormals(); m.name = "set-floor-street"; add(scen(m)); }
    // the gate house: a stone front with a round arch 3 m wide (the street runs through it), a slate roof; solid
    { const g = new THREE.Group(); g.position.set(-20, 0, BZ); g.rotation.y = Math.PI / 2; set.add(g);
      const w = 9, d = 6, h = 8, sh = new THREE.Shape(); sh.moveTo(-w / 2, -0.3); sh.lineTo(w / 2, -0.3); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
      const ho = new THREE.Path(); ho.moveTo(-1.5, 0); ho.lineTo(-1.5, 2.2); ho.absarc(0, 2.2, 1.5, Math.PI, 0, true); ho.lineTo(1.5, 0); ho.closePath(); sh.holes.push(ho);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 14 }); geo.translate(0, 0, -d / 2); planarUV(geo);
      const m = new THREE.Mesh(geo, stoneP); m.castShadow = m.receiveShadow = true; m.name = "set-gatehouse"; g.add(m);
      roofOf(g, w, d, h, 2.6); const GB = Buf();
      for (let i = 0; i <= 14; i++) { const a = Math.PI - (i / 14) * Math.PI, r0 = 1.5, r1 = 2.0 + (i % 2) * 0.06; addBox(GB, Math.cos(a) * (r0 + r1) / 2, 2.2 + Math.sin(a) * (r0 + r1) / 2, d / 2 + 0.03, r1 - r0, 0.36, 0.1, new THREE.Color().setScalar(0.85 + (i % 3) * 0.08), 0, a, 1.2); }
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) addBox(GB, sx * 2.15, 0.4 + k * 0.6, d / 2 + 0.02, 0.6 + (k % 2) * 0.2, 0.55, 0.08, new THREE.Color().setScalar(0.9), 0, 0, 1.2);
      const gm = bufMesh(GB, graniteM); g.add(gm);
      for (const sx of [-1, 1]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.1), basic({ color: "#33415a" })); win.position.set(sx * 2.6, 5.4, d / 2 + 0.03); g.add(win); const fr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.06), std("#f1ece0")); fr.position.set(sx * 2.6, 5.4, d / 2 + 0.01); g.add(fr); }
      const back = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.7), basic({ color: "#6a5a4a" })); back.position.set(0, 1.85, -d / 2 + 0.05); g.add(back);
    }
    // the church: a square tower with a belfry and a slate spire, and the nave's roof, up the hill
    { const x = -62, z = -36, g = new THREE.Group(); g.position.set(x, landH(x, z) - 0.3, z); set.add(g);
      const tg = new THREE.BoxGeometry(5, 14, 5); tg.translate(0, 7, 0); planarUV(tg); const tm = new THREE.Mesh(tg, stoneP); g.add(tm);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(3.7, 8.5, 4), slateM); sp.rotation.y = Math.PI / 4; sp.position.y = 14 + 4.25; g.add(sp);
      const cr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), iron); cr.position.y = 14 + 8.5 + 0.5; g.add(cr); const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), iron); cr2.position.y = 14 + 8.5 + 0.8; g.add(cr2);
      for (const [dx, dz, ry] of [[0, 2.53, 0], [0, -2.53, 0], [2.53, 0, Math.PI / 2], [-2.53, 0, Math.PI / 2]]) for (const k of [-1, 1]) { const o = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.08), basic({ color: "#2a2630" })); o.position.set(dx + (ry ? 0 : k * 0.85), 11.4, dz + (ry ? k * 0.85 : 0)); o.rotation.y = ry; g.add(o); }
      const nv = new THREE.BoxGeometry(7, 7.5, 15); nv.translate(0, 3.75, 0); planarUV(nv); const nm = new THREE.Mesh(nv, stoneP); nm.position.set(0, 0, 10); g.add(nm);
      const rg = new THREE.Group(); rg.position.set(0, 0, 10); rg.rotation.y = Math.PI / 2; g.add(rg); roofOf(rg, 15, 7, 7.5, 2.8, false); g.traverse((o) => { o.userData.solid = false; });
    }
  }

  // ---------------------------------------------------------------- the painted far card (the town, the church tower, the wooded hills) cut from RV.webp, 110 m ahead
  if (S.backdrop !== false) {
    const DC = 110, K = 0.000597, P0 = V3(0, 0.95, 6.0), pit = -2 * DEG, f = V3(0, Math.sin(pit), -Math.cos(pit)).normalize(), r = V3(1, 0, 0), u = new THREE.Vector3().crossVectors(r, f).normalize();
    const SX = 395, SY = 85, SW = 375, SH = 360, EXT = 34, cx = SX + SW / 2, cy = SY + (SH + EXT) / 2, Wm = DC * K * SW, Hm = DC * K * (SH + EXT);
    const ctr = P0.clone().addScaledVector(f, DC).addScaledVector(r, DC * (cx - 768) * K).addScaledVector(u, DC * (512 - cy) * K);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: "#ece0d4" }); mat.userData.noOutline = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Wm, Hm), mat); mesh.name = "set-backdrop"; mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())); mesh.position.copy(ctr); add(scen(mesh));
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/RV.webp").then((img) => {
      const Z = 2, W = SW * Z, H = (SH + EXT) * Z, [c, g] = canvas(W, H); g.imageSmoothingQuality = "high";
      g.drawImage(img, 395, 215, 305, 230, 0, (215 - SY) * Z, 305 * Z, 230 * Z); g.drawImage(img, 700, SY, 68, 233, 305 * Z, 0, 68 * Z, 233 * Z);
      g.save(); g.translate(373 * Z, 0); g.scale(-1, 1); g.drawImage(img, 632, 318, 68, 127, 0, (318 - SY) * Z, 68 * Z, 127 * Z); g.restore();   // the town and trees; the tower's top (the bridge's end below it stays out)
      g.drawImage(c, 0, SH * Z - 3, W, 2, 0, SH * Z, W, EXT * Z);                                                                  // the foot: the last row, carried down to the horizon
      const id = g.getImageData(0, 0, W, H), d = id.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2], blue = B - R, bright = (R + G + B) / 3;
        let a = d[i + 3] / 255 * (1 - Math.min(1, Math.max(0, (blue - 16) / 26)));
        if (bright > 205 && blue > -8) a = Math.min(a, 1 - Math.min(1, (bright - 205) / 25));
        const e = Math.min(1, Math.min(x, W - 1 - x) / 70), tp = x < 305 * Z ? Math.min(1, Math.max(0, (y - (215 - SY) * Z) / 50)) : Math.min(1, Math.max(0, (233 * Z - y) / 20)); a *= e * e * (3 - 2 * e) * (x >= 305 * Z && y > 233 * Z ? 1 : tp);
        d[i + 3] = Math.round(a * 255);
      }
      g.putImageData(id, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true;
    }).catch(() => {}));
  }

  // ---------------------------------------------------------------- fallen leaves (decals) and leaves drifting down
  {
    const LD = Buf(), cols = ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a"], g2 = () => (rG() + rG() + rG() - 1.5) / 1.5, fm = S.fallen ?? 1;
    const leaf = (x, y, z, s) => { const [a, b] = frameOf(FLAT, rG() * 6.28); addCard(LD, x, y, z, a, b, s, s, FLAT, tint(cols[Math.floor(rG() * cols.length)], rG, 0.014, 0.08, 0.08)); };
    for (let i = 0; i < Math.round(1700 * fm); i++) {   // drifts at the wall foot and the fence foot, thinner across the stones, thicker near the lens
      const z = 9 - Math.abs(g2()) ** 1.4 * 40, kind = rG(), q = kind < 0.4 ? -HW + 0.1 + Math.abs(g2()) * 0.8 : kind < 0.65 ? 2.7 - Math.abs(g2()) * 0.8 : -HW + rG() * (2 * HW + 0.2);
      if (z < -32 || (q > -0.5 && q < 2.0 && rG() < 0.45)) continue;
      const [x, zz] = PP(z, q); leaf(x, 0.006 + rG() * 0.004, zz, 0.12 + rG() * 0.1);
    }
    for (let i = 0; i < Math.round(900 * fm); i++) { const z = 9 - Math.abs(g2()) * 26, [x, zz] = PP(z, -HW + 0.08 + Math.abs(g2()) * 0.55); leaf(x, 0.007 + rG() * 0.012, zz, 0.14 + rG() * 0.12); }   // the drift against the wall foot
    for (let i = 0; i < Math.round(700 * fm); i++) { const z = 9 - rG() * 32, q = -HW - 0.2 - Math.abs(g2()) * 3.2, [x, zz] = PP(z, q); leaf(x, gh(z) + 0.02, zz, 0.12 + rG() * 0.1); }   // under the garden trees
    for (let i = 0; i < Math.round(160 * fm); i++) { const x = BX0 + 1 + rG() * 34, z = BZ + (rG() - 0.5) * 3.2; leaf(x, deckYF(x) + 0.03, z, 0.12 + rG() * 0.08); }   // on the bridge
    for (let i = 0; i < Math.round(160 * fm); i++) leaf(-4 - rG() * 18, 0.008, -29.5 - rG() * 13, 0.12 + rG() * 0.1);   // in the plaza
    const lm = bufMesh(LD, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); if (lm) { lm.userData.solid = false; lm.frustumCulled = false; add(lm); }
    // drifting: 14 leaves, a closed-form path per leaf (a pure function of the frame time), 0.5 m/s
    const nD = S.leaves ?? 14, lc = ["#d9772b", "#c4472a", "#e2a53a"], geo = new THREE.PlaneGeometry(0.15, 0.15), dm = lc.map((c) => lam(new THREE.Color(c), { map: mapleT, alphaTest: 0.5, side: THREE.DoubleSide })), drift = [];
    for (let i = 0; i < nD; i++) {
      const o = new THREE.Mesh(geo, dm[i % 3]); o.castShadow = true; o.userData.solid = false; set.add(o);
      const fx = (i * 0.381966) % 1, fz = (i * 0.7548776) % 1, x0 = view === "bridge" ? 5 + 12 * fx : -2.2 + 4.8 * fx, z0 = view === "bridge" ? BZ - 1.4 + 2.8 * fz : 4.5 - 9 * fz;
      drift.push({ o, T: 9.2 + (i % 4) * 0.7, ph: (i * 0.6180339) % 1, x0, z0, g0: view === "bridge" ? deckYF(x0) : 0, sw: 0.45 + (i % 4) * 0.25, sp: 1.2 + (i % 5) * 0.5 });
    }
    const tick = (t) => { for (const d of drift) { const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28; d.o.position.set(d.x0 + 1.4 * u + d.sw * Math.sin(ang), d.g0 + 4.6 * (1 - u) + 0.04, d.z0 + 0.5 * Math.cos(ang * 0.8)); d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8); } };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }

  // ---------------------------------------------------------------- the mirror: the bridge, the pier, the far banks' trees, upside down under the water
  for (const m of refl) { const r = new THREE.Mesh(m.geometry, m.material); r.scale.y = -1; r.position.y = 2 * WATER_Y; r.frustumCulled = false; r.castShadow = r.receiveShadow = false; r.userData.solid = false; r.name = (m.name || "part") + "-mirror"; add(r); }
  return set;
}
