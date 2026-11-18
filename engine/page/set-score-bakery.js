import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scorebakery": the corner bakery street, sun and rain, for "I could see everyone's happiness score" (Happiness 03).
// Panels 06, 09, 11 (sun) and 12, 15 (rain). REAL 3D geometry with hand-painted canvas textures; the paintings
// plates/painted/BK.webp (sun) and BK-R.webp (rain, same place) are the look targets (BK-R is also the far street card).
// Built the way set-score-street.js is built (its stone, setts, kerb, maples, ivy and lamp are copied here, it exports none).
//
// COORDINATES (metres, y up). The street runs along x; a normal camera looks from +z (the road side) at the bakery.
//   bakery front plane       z -1.0 (faces +z), x -2.2 .. 6.0
//     planked side wall      x -2.2 .. -0.5 (grey boards in the rain painting)
//     display window         x -0.5 .. 1.4, glass z -0.93, sill = the counter top
//     open serving counter   x 1.4 .. 6.0, opening y 0.55 .. 2.1, TOP y 0.55 (slab z -1.3 .. -0.78, overhangs the street 0.22)
//     interior               floor y 0, back wall z -4.0, shelves with bread, two pendant lamps; the baker stands behind
//     awning                 x -2.45 .. 6.0, rises from y 2.75 at the wall to its front edge y 2.05 at z 0.75, scallops hang to 1.77
//     sign board / upper wall above 2.75; roof ridge about 9 m
//   stone wall (ivy)         x -9 .. -2.2 on the same plane, and a stone terrace on to x -34; a terrace of stone/plaster x 6 .. 34
//   pavement (setts)         z -1.0 .. 2.35 at y 0;  kerb z 2.35 .. 2.57 (top y 0.01);  road z 2.57 .. 9.17 at y -0.15
//   far kerb / pavement      z 9.17 .. 9.39 / 9.39 .. 12.1; the terrace across the road: front plane z 12.1
//   lamp (Spud hides)        x -2.9, z 0.2, post r 0.17 at the shaft, plinth 0.5 wide, 4.3 m
//   flower tub               x -2.35, z -0.5, 0.42 m high, flowers to 0.95
//   maple in a tree pit      x -7.6, z 1.8 (kerb ring r 0.95), crown 5 .. 11 m
// BAKERY (exported) has the numbers a storyboard needs: counterTop, the stand spots, the dry box under the awning, puddles.
//
// spec (every key optional):
//   rain false     true: grey sky, wet shining setts (glossy darker material + warm reflections of the lit window and the
//                  lamps), lit warm window, thin brown maples, the BK-R street card at the end of the street, mist.
//                  The rain particles are not here (the director's `rainfall`; none under the awning: BAKERY.dry)
//   seed 5         painted textures and the layout of leaves, flowers and ivy
//   trees true     the maples (false: none)
//   ivy true       the ivy on the stone wall
//   wind 1         leaves shiver (0 off)
//   leaves 24      leaves drifting down past the camera (sun only; rain default 0)
//   fallen 1       fallen leaves on setts, a multiplier
//   backdrop true  the far street card (rain only) from plates/painted/BK-R.webp, served from the repo root
// Light: sun: "light": "golden", "key": [-5.5, 3.6, 4.5] (low morning sun from the left front: the awning and the lamp
// cast long shadows over the setts), "shadowSize": 9. Rain: "light": "dusk-rain" (cold grey light, warm window), "shadowSize": 9.
// Nothing here is solid for the checks except the house fronts, the counter, the kerb and pavement; the sky and card are scenery.
// Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks) only.

export const BAKERY = {
  frontZ: -1.0, counterTop: 0.55, counterX: [-0.5, 6.0], counterZ: [-1.3, -0.78],
  pavementZ: [-1.0, 2.35], kerbZ: [2.35, 2.57], roadY: -0.15, roadZ: [2.57, 9.17],
  awning: { x: [-2.45, 6.0], wallY: 2.75, edgeY: 2.05, edgeZ: 0.75, flapY: 1.77 },
  dry: { x: [-2.45, 6.0], z: [-1.0, 0.75] },   // no rain under the awning
  lamp: { x: -2.9, z: 0.2 }, tub: { x: -2.35, z: -0.5 }, tree: { x: -7.6, z: 1.8 },
  // stand spots [x, z], y 0 on the pavement (the baker on the interior floor, y 0)
  spots: {
    baker: { x: 3.0, z: -1.7, y: 0, face: 0 },           // behind the counter (panel 06, 11 over his counter); counter top y 0.55
    spud06: { x: 3.0, z: -0.3, y: 0, face: 180 },        // at the counter, bun handed over (06); 11: same spot, camera high
    mash06: { x: -1.9, z: 1.6, y: 0, face: 160 },        // foreground left, back to camera (06); the lamp stands behind him
    mash09: { x: -4.4, z: 1.4, y: 0, face: 20 },         // left of the pair, stone wall and ivy behind (09)
    spud09: { x: -3.4, z: 1.7, y: 0, face: -20 },
    spud12: { x: -1.3, z: -0.55, y: 0, face: 0 },        // sits against the planks, right of the tub (12), dry under the awning
    spud15: { x: 0.2, z: 2.0, y: 0, face: -90 },         // on the pavement edge, walking along it (15)
  },
  puddles: [   // flat, level spots; the setts are flat everywhere. [x, z, y of the surface, diameter]
    { x: 1.4, z: 3.2, y: -0.15, d: 1.4 },    // the face puddle of 15 (road, beside the kerb)
    { x: -3.3, z: 1.5, y: 0, d: 1.0 },       // pavement
    { x: -1.6, z: 4.6, y: -0.15, d: 1.1 },   // road
  ],
};

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
function fitRun(rnd, total, lo, hi) {
  const a = []; let s = 0;
  while (s < total - hi) { const v = lo + rnd() * (hi - lo); a.push(v); s += v; }
  a.push(total - s); if (a[a.length - 1] < lo * 0.6 && a.length > 1) { const l = a.pop(); a[a.length - 1] += l; }
  return a;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); const o = { r: Math.round(c.r ** (1 / 2.2) * 255 * k), g: Math.round(c.g ** (1 / 2.2) * 255 * k), b: Math.round(c.b ** (1 / 2.2) * 255 * k) }; return `rgb(${Math.min(255, o.r)},${Math.min(255, o.g)},${Math.min(255, o.b)})`; };

// dressed ashlar (the street's): ~8 courses to a door, staggered joints, each block its own tone, soft edges, thin mortar. M metres square.
function stoneCanvas(rnd, S = 2048, mortar = "#6b5a42", pal = null, M = 4.8) {
  const [c, g] = canvas(S, S), ppm = S / M, m = Math.max(1.5, S / 700), j = (a) => (rnd() - 0.5) * a;
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  pal = pal || ["#bfb7a8", "#b4ac9e", "#c8bfae", "#a9a396", "#c2b8a4", "#9f9a8e", "#c4b79e", "#b0a58f", "#bbb09c", "#a4a090", "#cdc3ae", "#b2aa98"];
  let y = 0, prev = [];
  for (const rh of fitRun(rnd, S, 0.22 * ppm, 0.3 * ppm)) {
    let run = null;
    for (let t = 0; t < 10; t++) {
      const r = fitRun(rnd, S, 0.3 * ppm, 0.95 * ppm); let x = 0, ok = true;
      for (const w of r) { x += w; for (const q of prev) { const dd = Math.abs(x - q); if (Math.min(dd, S - dd) < 0.12 * ppm) ok = false; } }
      run = r; if (ok) break;
    }
    let x = 0; prev = [];
    for (const w of run) {
      prev.push(x + w);
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.88 + rnd() * 0.22, x0 = x + m, y0 = y + m, bw = w - 2 * m, bh = rh - 2 * m;
      const gr = g.createLinearGradient(0, y0, 0, y0 + bh); gr.addColorStop(0, shade(base, k * 1.08)); gr.addColorStop(1, shade(base, k * 0.9));
      g.fillStyle = gr; g.beginPath();
      g.moveTo(x0 + j(m), y0 + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + j(m * 0.6)); g.lineTo(x0 + bw + j(m), y0 + j(m));
      g.lineTo(x0 + bw + j(m), y0 + bh * 0.5 + j(m)); g.lineTo(x0 + bw + j(m), y0 + bh + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + bh + j(m * 0.6));
      g.lineTo(x0 + j(m), y0 + bh + j(m)); g.lineTo(x0 + j(m), y0 + bh * 0.5 + j(m)); g.closePath(); g.fill();
      g.save(); g.beginPath(); g.rect(x0, y0, bw, bh); g.clip();
      for (let i = 0; i < 9; i++) {
        const tc = [[150, 120, 80], [120, 108, 92], [150, 148, 140], [255, 244, 214], [176, 140, 96]][Math.floor(rnd() * 5)], cx = x0 + rnd() * bw, cy = y0 + rnd() * bh, rr = (0.12 + rnd() * 0.3) * Math.min(bw, bh * 2.2);
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr), al = 0.1 + rnd() * 0.14; rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${al})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
      }
      for (let i = 0; i < Math.round(bw * bh / 380); i++) { g.fillStyle = rnd() < 0.7 ? `rgba(76,62,46,${0.14 + rnd() * 0.22})` : `rgba(255,248,230,${0.12 + rnd() * 0.16})`; g.fillRect(x0 + rnd() * bw, y0 + rnd() * bh, 1 + rnd() * 2.2, 1 + rnd() * 2.2); }
      const lt = g.createLinearGradient(0, y0, 0, y0 + Math.min(bh * 0.35, 9)); lt.addColorStop(0, "rgba(255,248,226,0.42)"); lt.addColorStop(1, "rgba(255,248,226,0)"); g.fillStyle = lt; g.fillRect(x0, y0, bw, Math.min(bh * 0.35, 9));
      const bt = g.createLinearGradient(0, y0 + bh, 0, y0 + bh - Math.min(bh * 0.3, 9)); bt.addColorStop(0, "rgba(52,42,30,0.4)"); bt.addColorStop(1, "rgba(52,42,30,0)"); g.fillStyle = bt; g.fillRect(x0, y0 + bh - Math.min(bh * 0.3, 9), bw, Math.min(bh * 0.3, 9));
      g.fillStyle = "rgba(255,246,222,0.16)"; g.fillRect(x0, y0, 2, bh); g.fillStyle = "rgba(52,40,28,0.2)"; g.fillRect(x0 + bw - 2, y0, 2, bh);
      g.restore();
      x += w;
    }
    y += rh;
  }
  return c;
}
// setts: small rounded irregular cobbles in staggered courses, warm and cool stones mixed, dark gaps, a soft lit top and a dark rim.
// NC setts across a 3 m square (NR rows). wet: darker blue-greys with glossy sky highlights and warm glints in the gaps.
function settCanvas(rnd, NC, NR, wet, S = 2048) {
  const [c, g] = canvas(S, S), rh = S / NR, cw = S / NC;
  g.fillStyle = wet ? "#1c1e28" : "#34303a"; g.fillRect(0, 0, S, S);
  const warm = wet ? ["#6c6670", "#766a72", "#605c68", "#72666c", "#7a7078"] : ["#b9a798", "#c6af99", "#a99b92", "#c1a995", "#b29d8e", "#cbb9a2", "#a8968a"];
  const cool = wet ? ["#515a70", "#485168", "#5d6882", "#535b72", "#4c556c"] : ["#8d92a6", "#7f869b", "#9aa0b2", "#8a8ca2", "#a39cab", "#7d8498"];
  const stones = [];
  for (let r = 0; r < NR; r++) for (let q = -1; q <= NC; q++) {
    const cx = q * cw + cw / 2 + (r % 2) * cw / 2 + (rnd() - 0.5) * cw * 0.2, cy = r * rh + rh / 2 + (rnd() - 0.5) * rh * 0.22;
    const rx = cw * (0.4 + rnd() * 0.07), ry = rh * (0.4 + rnd() * 0.07), pal = rnd() < 0.5 ? warm : cool, base = pal[Math.floor(rnd() * pal.length)], k = 0.9 + rnd() * 0.2;
    const pts = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), f = 1 + (rnd() - 0.5) * 0.16; pts.push([cx + Math.sign(ca) * Math.abs(ca) ** 0.62 * rx * f, cy + Math.sign(sa) * Math.abs(sa) ** 0.62 * ry * f]); }
    stones.push({ cx, cy, rx, ry, base, k, pts, pits: [rnd(), rnd(), rnd(), rnd(), rnd(), rnd()], moss: rnd() < 0.18, tilt: rnd() });
  }
  for (const st of stones) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
    if (st.cx + ox + st.rx < -4 || st.cx + ox - st.rx > S + 4 || st.cy + oy + st.ry < -4 || st.cy + oy - st.ry > S + 4) continue;
    const gr = g.createLinearGradient(0, st.cy + oy - st.ry, 0, st.cy + oy + st.ry); gr.addColorStop(0, shade(st.base, st.k * 1.16)); gr.addColorStop(1, shade(st.base, st.k * 0.8));
    g.fillStyle = gr; g.beginPath(); st.pts.forEach(([x, y], i) => (i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy))); g.closePath(); g.fill();
    g.strokeStyle = wet ? "rgba(10,12,20,0.55)" : "rgba(28,22,36,0.4)"; g.lineWidth = 4; g.stroke();
    g.fillStyle = wet ? "rgba(214,228,248,0.2)" : "rgba(255,246,232,0.2)"; g.beginPath(); g.ellipse(st.cx + ox - st.rx * 0.1, st.cy + oy - st.ry * 0.3, st.rx * 0.5, st.ry * 0.22, 0, 0, 7); g.fill();
    for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(36,30,44,${0.12 + st.pits[i] * 0.16})`; g.beginPath(); g.arc(st.cx + ox + (st.pits[i + 3] - 0.5) * st.rx * 1.3, st.cy + oy + (st.pits[(i + 1) % 3 + 3] - 0.5) * st.ry * 1.2, 1.2 + st.pits[i] * 2.2, 0, 7); g.fill(); }
    if (wet) { g.fillStyle = "rgba(255,190,110,0.2)"; g.beginPath(); g.ellipse(st.cx + ox + st.rx * 0.2, st.cy + oy + st.ry * 0.62, st.rx * 0.34, st.ry * 0.07, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(200,216,240,0.42)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(st.cx + ox - st.rx * 0.6, st.cy + oy - st.ry * 0.55); g.lineTo(st.cx + ox + st.rx * 0.5, st.cy + oy - st.ry * 0.6); g.stroke(); }
    else if (st.moss) { g.fillStyle = "rgba(100,136,56,0.5)"; g.beginPath(); g.ellipse(st.cx + ox + (st.tilt - 0.5) * st.rx, st.cy + oy + st.ry * 0.95, st.rx * 0.3, 3.5, 0, 0, 7); g.fill(); }
  }
  return c;
}
// vertical boards of a wooden front: M metres square, boards pw wide, knots, grain, dark joints, nail heads.
function plankCanvas(rnd, base, pw = 0.14, M = 2.0, S = 1024, grey = 0) {
  const [c, g] = canvas(S, S), ppm = S / M, n = Math.max(1, Math.round(M / pw)), w = S / n;
  g.fillStyle = "#2c1e14"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const k = 0.84 + rnd() * 0.3, x = i * w, col = new THREE.Color(base).lerp(new THREE.Color("#7c7f86"), grey);
    const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, shade(col, k * 1.06)); gr.addColorStop(0.5, shade(col, k)); gr.addColorStop(1, shade(col, k * 0.9));
    g.fillStyle = gr; g.fillRect(x + 2, 0, w - 4, S);
    for (let q = 0; q < 14; q++) { const gx = x + 3 + rnd() * (w - 6), y0 = rnd() * S, L = 60 + rnd() * 420; g.strokeStyle = rnd() < 0.6 ? `rgba(46,28,14,${0.07 + rnd() * 0.12})` : `rgba(255,236,200,${0.05 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 1.6; g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx + (rnd() - 0.5) * 6, y0 + L); g.stroke(); }
    if (rnd() < 0.55) { const kx = x + w * (0.3 + rnd() * 0.4), ky = rnd() * S, r = 5 + rnd() * 8; for (let ring = 3; ring >= 1; ring--) { g.strokeStyle = `rgba(40,24,10,${0.18 + 0.1 * ring})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(kx, ky, r * ring * 0.5, r * ring * 0.9, 0, 0, 7); g.stroke(); } g.fillStyle = "rgba(38,22,10,0.5)"; g.beginPath(); g.ellipse(kx, ky, r * 0.4, r * 0.7, 0, 0, 7); g.fill(); }
    g.fillStyle = "rgba(255,238,206,0.16)"; g.fillRect(x + 2, 0, 2, S); g.fillStyle = "rgba(30,18,8,0.3)"; g.fillRect(x + w - 4, 0, 2, S);
    for (const ny of [S * 0.04, S * 0.5, S * 0.96]) { g.fillStyle = "rgba(30,26,24,0.5)"; g.beginPath(); g.arc(x + w * 0.5, ny, 2.2, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 26; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 40 + rnd() * 120, tc = rnd() < 0.5 ? "60,36,16" : "255,230,190", rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc},${0.06 + rnd() * 0.08})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  void ppm; return c;
}
function fabricCanvas(rnd, wet) {
  const S = 256, [c, g] = canvas(S, S);
  g.fillStyle = "#f2f0ec"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 4) { g.fillStyle = "rgba(120,110,100,0.08)"; g.fillRect(i, 0, 1, S); g.fillRect(0, i, S, 1); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,80,70,${0.04 + rnd() * 0.06})`; g.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  for (let x = 0; x < S; x += 64) { const gr = g.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(0.55, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.14)"); g.fillStyle = gr; g.fillRect(x, 0, 64, S); }
  if (wet) for (let i = 0; i < 14; i++) { const x = rnd() * S, gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "rgba(40,50,70,0)"); gr.addColorStop(0.6, `rgba(40,50,70,${0.08 + rnd() * 0.1})`); gr.addColorStop(1, "rgba(40,50,70,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2 + rnd() * 5, S); }
  return c;
}
// a loaf / roll / baguette skin: golden crust, flour dust, scoring slashes around the crown
function breadCanvas(rnd) {
  const S = 256, [c, g] = canvas(S, S);
  const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#d99a4c"); gr.addColorStop(0.45, "#c98638"); gr.addColorStop(1, "#8e5424"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 10 + rnd() * 30, tc = rnd() < 0.5 ? "120,64,22" : "246,200,120", rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc},${0.18 + rnd() * 0.2})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  for (let i = 0; i < 6; i++) { const x = 20 + i * 42 + rnd() * 10; g.strokeStyle = "rgba(250,226,170,0.85)"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(x, S * 0.16); g.quadraticCurveTo(x + 14, S * 0.26, x + 6, S * 0.4); g.stroke(); g.strokeStyle = "rgba(104,56,18,0.55)"; g.lineWidth = 2; g.stroke(); }
  for (let i = 0; i < 700; i++) { g.fillStyle = rnd() < 0.6 ? `rgba(255,248,232,${0.2 + rnd() * 0.3})` : `rgba(90,48,16,${0.2 + rnd() * 0.2})`; g.fillRect(rnd() * S, rnd() * S * 0.8, 1 + rnd() * 2, 1 + rnd() * 2); }
  return c;
}
function wickerCanvas() {
  const S = 128, [c, g] = canvas(S, S); g.fillStyle = "#a8763c"; g.fillRect(0, 0, S, S);
  for (let i = -S; i < S * 2; i += 12) { g.strokeStyle = "rgba(60,34,12,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); g.strokeStyle = "rgba(240,200,130,0.35)"; g.beginPath(); g.moveTo(i + 12, 0); g.lineTo(i + 12 - S, S); g.stroke(); }
  return c;
}
function grassDummy() { const [c, g] = canvas(8, 8); g.fillStyle = "#7f9a4a"; g.fillRect(0, 0, 8, 8); return c; }
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
  const S = 64, [c, g] = canvas(S, S); g.fillStyle = "#ffffff";
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 13, 5.5, a, 0, 7); g.fill(); }
  g.fillStyle = "#6a6a6a"; g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill(); g.fillStyle = "#bdbdbd"; g.beginPath(); g.arc(30, 30, 3.5, 0, 7); g.fill();
  return c;
}
function glowCanvas() {
  const S = 128, [c, g] = canvas(S, S), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,236,170,1)"); gr.addColorStop(0.25, "rgba(255,206,120,0.55)"); gr.addColorStop(1, "rgba(255,180,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, S, S); return c;
}
// reflection streak along v (u across): bright at v 0, fading, broken by short dark gaps (setts)
function streakCanvas(rnd) {   // a soft smear: bright at v 0 (the source), fading, broken by rows of setts and their gaps
  const W = 64, H = 256, [c, g] = canvas(W, H);
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y++) { const f = (1 - y / H) ** 1.1, row = Math.floor(y / 11), gap = y % 11 < 2 ? 0.2 : 1; for (let x = 0; x < W; x++) { const e = Math.cos((x / (W - 1) - 0.5) * Math.PI) ** 1.3, seg = Math.floor((x + (row % 2) * 7) / 14), st = 0.5 + 0.5 * hash2(row, seg, 17), edge = (x + (row % 2) * 7) % 14 < 2 ? 0.3 : 1, q = Math.round(255 * Math.min(1, f * e * gap * st * edge * 1.15)); g.fillStyle = `rgb(${q},${q},${q})`; g.fillRect(x, y, 1, 1); } }
  return c;
}
// a puddle that mirrors the street: the far side's lit windows and lamp at the top (the mirrored base of the houses),
// then dark wall, grey sky at the near side, a warm lamp streak and rings of falling drops
function puddleCanvas(rnd) {
  const S = 256, [c, g] = canvas(S, S), t = document.createElement("canvas"); t.width = t.height = S; const m = t.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#1c2029"); gr.addColorStop(0.35, "#2a303d"); gr.addColorStop(0.7, "#444c5c"); gr.addColorStop(1, "#6a7386"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 6; i++) { const x = 20 + i * 40 + rnd() * 10; g.fillStyle = `rgba(255,${180 + Math.round(rnd() * 40)},96,${0.7 + rnd() * 0.25})`; g.fillRect(x, 10 + rnd() * 40, 16 + rnd() * 12, 40 + rnd() * 40); }
  const lg = g.createLinearGradient(0, 0, 0, S); lg.addColorStop(0, "rgba(255,206,120,0.9)"); lg.addColorStop(1, "rgba(255,206,120,0)"); g.fillStyle = lg; g.fillRect(S * 0.62, 0, 12, S * 0.9);
  g.strokeStyle = "rgba(220,232,250,0.5)"; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const cx = 40 + rnd() * 180, cy = 40 + rnd() * 180; for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy, k * 7, k * 3.6, 0, 0, 7); g.stroke(); } }
  m.fillStyle = "#000"; m.fillRect(0, 0, S, S); m.fillStyle = "#fff"; m.beginPath();
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.2832, r = 0.42 + 0.06 * Math.sin(a * 3 + 1) + 0.04 * Math.sin(a * 5 + 2) + (hash2(i, 3, 5) - 0.5) * 0.03; const x = S / 2 + Math.cos(a) * r * S * 1.0, y = S / 2 + Math.sin(a) * r * S * 0.86; if (i) m.lineTo(x, y); else m.moveTo(x, y); }
  m.closePath(); m.fill();
  const id = g.getImageData(0, 0, S, S), md = m.getImageData(0, 0, S, S);
  for (let i = 0; i < S * S; i++) { const x = i % S, y = (i / S) | 0, e = Math.min(1, Math.min(x, S - 1 - x, y, S - 1 - y) / 26); id.data[i * 4 + 3] = Math.round(md.data[i * 4] * 0.92 * e); }
  g.putImageData(id, 0, 0); return c;
}
function sheenCanvas(rnd) {
  const S = 512, [c, g] = canvas(S, S); g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 30 + rnd() * 110, v = Math.round(60 + rnd() * 90); for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rr); gr.addColorStop(0, `rgba(${v},${v + 8},${v + 22},0.9)`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(cx + ox - rr, cy + oy - rr, 2 * rr, 2 * rr); } }
  return c;
}
// the bakery's glass: a pale reflection (sun: blue sky; rain: grey with warm glints and drips), drawn over the lit shelves
function shopGlassCanvas(rnd, rain) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rain ? "rgba(120,130,150,0.10)" : "rgba(170,206,240,0.08)"); gr.addColorStop(0.4, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = rain ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.24)"; g.beginPath(); g.moveTo(150, 0); g.lineTo(190, 0); g.lineTo(100, H); g.lineTo(60, H); g.fill();   // the one diagonal glint
  if (rain) for (let i = 0; i < 18; i++) { const x = rnd() * W; g.strokeStyle = `rgba(230,240,255,${0.12 + rnd() * 0.2})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, rnd() * 80); g.lineTo(x + (rnd() - 0.5) * 3, 90 + rnd() * 150); g.stroke(); }
  return c;
}
// a terrace window's glass: sun = sky and autumn trees reflected, rain = a warm lit room (most), dim grey (some)
function glassCanvas(rnd, k, rain) {
  const W = 128, H = 192, [c, g] = canvas(W, H);
  if (rain) {
    const lit = k % 3 !== 0, gr = g.createLinearGradient(0, 0, 0, H);
    if (lit) { gr.addColorStop(0, "#ffd48a"); gr.addColorStop(0.6, "#e8a24c"); gr.addColorStop(1, "#b8742e"); } else { gr.addColorStop(0, "#5b6474"); gr.addColorStop(1, "#2a2e3a"); }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (lit) { g.fillStyle = "rgba(255,240,200,0.35)"; g.fillRect(20, 30, 36, 60); g.fillStyle = "rgba(120,60,24,0.35)"; g.fillRect(70, 80, 40, 90); }
    for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(220,232,250,${0.12 + rnd() * 0.2})`; g.lineWidth = 1; const x = rnd() * W; g.beginPath(); g.moveTo(x, rnd() * 60); g.lineTo(x + 1, 80 + rnd() * 110); g.stroke(); }
    return c;
  }
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#4f7fae"); gr.addColorStop(0.4, "#2a3b52"); gr.addColorStop(1, "#171a22"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(190,220,245,0.32)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 30); g.lineTo(0, 60); g.fill();
  for (let i = 0; i < 7; i++) { g.fillStyle = ["#e0701f", "#d9a21f", "#c43a1c"][i % 3]; g.globalAlpha = 0.3 + rnd() * 0.25; g.beginPath(); g.arc(8 + rnd() * (W - 16), 24 + rnd() * 70, 5 + rnd() * 9, 0, 7); g.fill(); }
  g.globalAlpha = 1; if (k % 2) { g.fillStyle = "rgba(255,200,130,0.16)"; g.fillRect(0, H * 0.62, W, H * 0.38); }
  g.fillStyle = "rgba(255,255,255,0.2)"; g.beginPath(); g.moveTo(14, 0); g.lineTo(52, 0); g.lineTo(8, H); g.lineTo(0, H); g.lineTo(0, 120); g.fill();
  return c;
}
function plasterCanvas(rnd, base, S = 512) {
  const [c, g] = canvas(S, S); g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 140; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(120,96,70,${0.03 + rnd() * 0.05})` : `rgba(255,250,236,${0.05 + rnd() * 0.07})`; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 14 + rnd() * 50, 8 + rnd() * 24, rnd() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,50,${0.06 + rnd() * 0.1})`; g.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  return c;
}
function dressedCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S); g.fillStyle = "#c9b894"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 30 + rnd() * 90, tc = rnd() < 0.5 ? "140,110,70" : "255,246,222", rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc},${0.08 + rnd() * 0.1})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(80,64,44,${0.1 + rnd() * 0.18})`; g.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  return c;
}
function slateCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S), N = 10, h = S / N; g.fillStyle = "#2c2a36"; g.fillRect(0, 0, S, S);
  for (let r = 0; r < N; r++) for (let q = -1; q < 8; q++) { const w = S / 8, x = q * w + (r % 2) * w / 2, k = 0.85 + rnd() * 0.3; g.fillStyle = shade(["#5b5668", "#4d4a5c", "#68627a", "#56526a"][Math.floor(rnd() * 4)], k); g.fillRect(x + 2, r * h + 1, w - 4, h - 2); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + 2, r * h + h - 5, w - 4, 4); g.fillStyle = "rgba(210,205,230,0.12)"; g.fillRect(x + 2, r * h + 1, w - 4, 3); }
  return c;
}
// the sky all round (equirect, u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z). Sun: autumn blue with small clouds and pale hills.
// Rain: a low grey lid with darker cloud masses, a lighter band at the horizon.
function skyCanvas(rnd, rain) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz);
  if (rain) { gr.addColorStop(0, "#2f343f"); gr.addColorStop(0.5, "#4a515e"); gr.addColorStop(0.9, "#646c79"); gr.addColorStop(1, "#727a87"); } else { gr.addColorStop(0, "#4f93d6"); gr.addColorStop(0.5, "#86bce6"); gr.addColorStop(0.9, "#cfe4ee"); gr.addColorStop(1, "#f1ead2"); }
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2); g.fillStyle = rain ? "#434a56" : "#8a9a62"; g.fillRect(0, hz, W, hz);
  const puff = (cx, cy, r, sx, col) => { for (const ox of [-W, 0, W]) { const q = g.createRadialGradient(cx + ox, cy, r * 0.1, cx + ox, cy, r); q.addColorStop(0, col + "e6"); q.addColorStop(1, col + "00"); g.fillStyle = q; g.beginPath(); g.ellipse(cx + ox, cy, r * sx, r, 0, 0, 7); g.fill(); } };
  if (rain) { for (let k = 0; k < 90; k++) puff(rnd() * W, 20 + rnd() * (hz - 60), 40 + rnd() * 90, 2.2, rnd() < 0.6 ? "#2c313c" : "#5d6573"); }
  else for (let k = 0; k < 11; k++) { const u = (k + rnd() * 0.8) / 11 * W, base = hz - (30 + rnd() * 150), n = 8 + Math.floor(rnd() * 12), big = 0.5 + rnd(); for (let i = 0; i < n; i++) puff(u + (rnd() - 0.5) * 150 * big, base - rnd() * 26 * big, (14 + rnd() * 26) * big, 1.5, "#f6f8fc"); }
  const layers = rain ? [["#586070", 30, 0.7], ["#4a5262", 20, 1.2]] : [["#aebfa4", 34, 0.7], ["#8fa88c", 24, 1.2], ["#6f9168", 14, 2.0]];
  layers.forEach(([col, hgt, f], li) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 4); for (let x = 0; x <= W; x += 4) { const h = hgt * (0.55 + 0.45 * Math.sin(x * 0.006 * f + li * 2) * Math.sin(x * 0.0023 + li)) + (hash2(Math.floor(x / 5), li, 3) - 0.5) * 7 * (li + 1) * 0.5; g.lineTo(x, hz - Math.max(2, h)); } g.lineTo(W, hz + 4); g.fill(); });
  return c;
}

// ================================================================================================================ geometry builders
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
function addBox(B, x, y, z, w, h, d, col = WHITE, ry = 0, rz = 0, uvK = 1.2) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, rz, "YXZ")), _one);
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const faces = [
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
const UVFULL = [0, 0, 1, 1];
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, col, uv = UVFULL) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2;
  const c4 = [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]];
  for (const [a, d, u, v] of c4) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(col.r, col.g, col.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
// append any three.js geometry, transformed by M, with one vertex colour
function addGeo(B, geo, M, col = WHITE) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(M);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, b0 = B.p.length / 3;
  for (let i = 0; i < p.count; i++) { B.p.push(p.getX(i), p.getY(i), p.getZ(i)); if (n) B.n.push(n.getX(i), n.getY(i), n.getZ(i)); else B.n.push(0, 1, 0); B.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0); B.c.push(col.r, col.g, col.b); B.i.push(b0 + i); }
  g.dispose();
}
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
function segMat(a, b, r0, r1) {
  const d = b.clone().sub(a), L = d.length();
  return [new THREE.CylinderGeometry(r1, r0, L, 7), new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Yaxis, d.normalize()), new THREE.Vector3(1, 1, 1))];
}
// a flat grid of quads with vertex colour: x0..x1, z0..z1 at height y, uv = metres / uvK
function groundBuf(x0, x1, z0, z1, y, uvK, cell, colFn) {
  const B = Buf(), nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx, z = z0 + (z1 - z0) * j / nz, k = colFn ? colFn(x, z) : 1; B.p.push(x, y, z); B.n.push(0, 1, 0); B.uv.push(x / uvK, z / uvK); B.c.push(k, k, k); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; B.i.push(a, c, b, b, c, d); }
  return B;
}

// ================================================================================================================ the set
export function buildScoreBakery(scene, S = {}) {
  const seed = S.seed ?? 5, RAIN = !!S.rain, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scorebakery"; scene.add(set);
  const A = BAKERY, wind = S.wind ?? 1, WZ = A.frontZ;
  scene.background = new THREE.Color(RAIN ? "#4f5664" : "#a8cfe8"); scene.fog = RAIN ? new THREE.Fog("#5f6674", 25, 115) : null;
  const add = (o) => { if (o) set.add(o); return o; };
  const rW = rng(seed * 31 + 1), rT = rng(seed * 57 + 2), rF = rng(seed * 91 + 3), rG = rng(seed * 113 + 4), rB = rng(seed * 71 + 6);
  const W = RAIN ? new THREE.Color("#7a8398") : new THREE.Color("#ffffff");   // the rain's cool darkening of the set's colours
  const WARM = new THREE.Color(RAIN ? "#0e1014" : "#2c1d0e");

  // ---------------------------------------------------------------- materials and painted textures
  const stoneT = ctex(stoneCanvas(rnd, 2048, "#6b6254", null, 3.2)), stoneT2 = ctex(stoneCanvas(rnd, 2048, "#625a4c", ["#c8bba2", "#bcae95", "#d1c5ac", "#aea48f", "#c5b99f", "#a89f8c"], 3.2));
  const settRoadT = ctex(settCanvas(rnd, 15, 22, RAIN)), settPavT = ctex(settCanvas(rnd, 11, 15, RAIN));
  const slateM = std("#ffffff", { map: ctex(slateCanvas(rnd)), roughness: 0.7 }), dressedT = ctex(dressedCanvas(rnd));
  const dressedM = std("#ffffff", { map: dressedT, vertexColors: true, color: W, emissive: new THREE.Color(RAIN ? "#1a1812" : "#4a3e2a") }), white = std("#f3efe4", { roughness: 0.55, vertexColors: true, color: new THREE.Color("#f3efe4").multiply(W) });
  const iron = std("#25262d", { roughness: 0.5, metalness: 0.35 });
  const mapleT = ctex(mapleCanvas(), 1, 1, false), daisyT = ctex(daisyCanvas(), 1, 1, false);
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(RAIN ? "#2a1a0c" : "#4a2308") });
  if (wind) leafMat.userData.wind = { amp: 0.045 * wind, h: 0, flutter: 1.7 };
  const ivyMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const flowerMat = lam("#ffffff", { map: daisyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color(RAIN ? "#241a10" : "#4a2208") });
  const woodTone = RAIN ? "#7a5a42" : "#8a5a36";
  const woodM = std("#ffffff", { map: ctex(plankCanvas(rnd, woodTone, 0.13, 2.0, 1024, RAIN ? 0.35 : 0)), vertexColors: true, color: W, emissive: new THREE.Color(RAIN ? "#1e1612" : "#3a2210") });
  const boardM = std("#ffffff", { map: ctex(plankCanvas(rnd, RAIN ? "#9a8e80" : "#a8683e", 0.3, 2.4, 1024, RAIN ? 0.45 : 0)), vertexColors: true, color: W, emissive: new THREE.Color(RAIN ? "#1c1a1a" : "#3a2210") });
  const trimM = std("#ffffff", { roughness: 0.7, vertexColors: true }), TRIMC = new THREE.Color(RAIN ? "#3a3e4a" : "#5a3a22");
  const innerWoodM = std("#ffffff", { map: ctex(plankCanvas(rnd, "#c08a52", 0.16, 2.0, 1024, 0)), vertexColors: true, emissive: new THREE.Color(RAIN ? "#34200c" : "#2e1c0c") });
  const floorM = std("#ffffff", { map: ctex(plankCanvas(rnd, "#8a6038", 0.2, 2.0, 512, 0)), emissive: new THREE.Color(RAIN ? "#44301a" : "#2c1c10") });
  const breadT = ctex(breadCanvas(rnd), 1, 1, false), breadM = lam("#ffffff", { map: breadT, vertexColors: true, emissive: new THREE.Color(RAIN ? "#7a4818" : "#6a3c14") });
  const wickerM = lam("#ffffff", { map: ctex(wickerCanvas()), side: THREE.DoubleSide, vertexColors: true, emissive: new THREE.Color("#2c1c0c") });
  const fabricT = ctex(fabricCanvas(rnd, RAIN)), fabricM = lam("#ffffff", { map: fabricT, vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color(RAIN ? "#1c1416" : "#3a2420") });
  const solids = [];

  // ---------------------------------------------------------------- sky, far ground
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), basic({ map: ctex(skyCanvas(rnd, RAIN), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false, fog: false }));
  sky.position.set(0, 0, 4); sky.renderOrder = -1000; sky.frustumCulled = false; sky.userData.solid = false; sky.name = "set-scorebakery-sky"; add(sky);
  const farGround = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), std(RAIN ? "#5d6670" : "#7f9a4a", { roughness: 1 }));
  farGround.rotation.x = -Math.PI / 2; farGround.position.set(0, -0.4, 4); farGround.receiveShadow = true; farGround.userData.solid = false; add(farGround);

  // ---------------------------------------------------------------- ground: pavement, kerb, road (setts)
  const X0 = -92, X1 = 72;
  const pavK = (x, z) => (0.9 + 0.2 * fbm(x * 0.5, z * 0.5, 11)) * (1 - 0.14 * smooth((0.4 - (z + 1)) / 0.4));
  const roadK = (x, z) => (0.88 + 0.26 * fbm(x * 0.35 + 4, z * 0.35, 13)) * (1 - 0.2 * smooth((3.6 - z) / 1.0) * 0.8);
  const settMat = (map, tintHex) => std("#ffffff", { map, vertexColors: true, color: RAIN ? new THREE.Color("#98a2bc") : new THREE.Color("#e0d9e0"), roughness: RAIN ? 0.28 : 0.85, metalness: RAIN ? 0.12 : 0, emissive: new THREE.Color(RAIN ? "#10131c" : tintHex) });
  const pav = bufMesh(groundBuf(X0, X1, WZ, A.pavementZ[1], 0, 3, 1.2, pavK), settMat(settPavT, "#2a2018"), false, true); pav.name = "set-floor"; add(pav);
  const road = bufMesh(groundBuf(X0, X1, A.roadZ[0], A.roadZ[1], A.roadY, 3, 1.2, roadK), settMat(settRoadT, "#241c20"), false, true); road.name = "set-floor-road"; add(road);
  add(bufMesh(groundBuf(X0, X1, A.roadZ[1] + 0.22, 12.1, 0, 3, 1.5, pavK), settMat(settPavT, "#2a2018"), false, true));
  add(bufMesh(groundBuf(X0, X1, A.roadZ[1] - 0.02, A.roadZ[1] + 0.22, A.roadY + 0.001, 3, 3, null), settMat(settPavT, "#2a2018"), false, true));
  // kerb: granite blocks on both sides of the road
  {
    const KB = Buf(), rK = rng(seed * 3 + 5);
    const kerb = (zc) => { let x = X0; while (x < X1) { const L = 0.75 + rK() * 0.75, col = new THREE.Color().setScalar(0.9 + rK() * 0.16); addBox(KB, x + L / 2, -0.07, zc, L - 0.012, 0.16, 0.22, col, (rK() - 0.5) * 0.01, 0, 1.0); x += L; } };
    kerb(A.kerbZ[0] + 0.11); kerb(A.roadZ[1] + 0.11);
    const km = bufMesh(KB, std("#ffffff", { map: ctex(stoneCanvas(rnd, 1024, "#6b6258", ["#c6baa8", "#b8ad9d", "#d0c4b0", "#aaa396", "#bfb4a2"]), 1 / 4.8, 1 / 4.8), vertexColors: true, color: W, emissive: new THREE.Color("#30241a") })); km.name = "set-kerb"; add(km);
  }

  // ---------------------------------------------------------------- facades (real extruded walls with real openings)
  const dressed = Buf(), whiteB = Buf(), ironB = Buf(), glassBufs = [Buf(), Buf(), Buf(), Buf()], boxB = Buf(), flowerQ = Buf(), boxLeafQ = Buf();
  const pale = (k = 0) => { const v = 0.9 + rW() * 0.16 + k, w = rW() - 0.5; return new THREE.Color(v * (1 + 0.06 * w), v * (1 - 0.01 * w), v * (1 - 0.1 * w)); };
  const glassMats = glassBufs.map((_, k) => basic({ map: ctex(glassCanvas(rW, k, RAIN), 1, 1, false), color: "#f4f4f4", fog: true }));
  function facade(o) {
    const { x0, x1, h, z, t = 0.42, holes = [], map, baseY = 0, flipFront = false } = o;
    const wall = new THREE.Shape(); wall.moveTo(x0, baseY); wall.lineTo(x1, baseY); wall.lineTo(x1, h); wall.lineTo(x0, h); wall.closePath();
    for (const q of holes) {
      const p = new THREE.Path();
      if (q.arch) { const r = q.w / 2, H0 = q.y + q.h - r; p.moveTo(q.x - r, q.y); p.lineTo(q.x - r, H0); p.absarc(q.x, H0, r, Math.PI, 0, true); p.lineTo(q.x + r, q.y); p.closePath(); }
      else { p.moveTo(q.x - q.w / 2, q.y); p.lineTo(q.x - q.w / 2, q.y + q.h); p.lineTo(q.x + q.w / 2, q.y + q.h); p.lineTo(q.x + q.w / 2, q.y); p.closePath(); }
      wall.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(wall, { depth: t, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, z - t);
    const uv = g.attributes.uv, ps = g.attributes.position, K = o.uvK ?? 3.2, ox = o.uvX ?? 0;
    for (let j = 0; j < uv.count; j++) { const front = Math.abs(ps.getZ(j) - z) < 1e-4 || Math.abs(ps.getZ(j) - (z - t)) < 1e-4; uv.setXY(j, ((front ? ps.getX(j) : ps.getX(j) + ps.getZ(j)) + ox) / K, ps.getY(j) / K); }
    const m = new THREE.Mesh(g, map); m.castShadow = m.receiveShadow = true; add(m); solids.push(m); void flipFront; return m;
  }
  const flowerCols = RAIN ? ["#b8503a", "#c98a2a", "#c8a03a", "#9c3a30", "#d8d0c0", "#c06a2a"] : ["#e9561c", "#f2a21f", "#f6d13a", "#d9331f", "#f4ecd8", "#f08a2a"];
  function flowerBox(x, y, w, z) {
    addBox(whiteB, x, y - 0.07, z, w * 0.96, 0.18, 0.22, WHITE);
    const gl = ["#4f8a3a", "#6a9a3e", "#b9a32a", "#c96b1e", "#7aa43e"], n = Math.round(w * (RAIN ? 80 : 130));
    for (let i = 0; i < n; i++) {
      const px = x + (rF() - 0.5) * w * 0.98, py = y + 0.04 + rF() * 0.34 * (1 - Math.abs((px - x) / w) * 0.5), pz = z + (rF() - 0.5) * 0.14 + 0.02;
      const nrm = new THREE.Vector3((rF() - 0.5) * 0.7, 0.5 + rF() * 0.5, 0.8).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
      addCard(boxLeafQ, px, py, pz, a, b, 0.11 + rF() * 0.08, 0.11 + rF() * 0.08, nrm, tint(gl[Math.floor(rF() * gl.length)], rF));
    }
    for (let i = 0; i < n * 0.6; i++) {
      const px = x + (rF() - 0.5) * w * 0.96, py = y + 0.12 + rF() * 0.3, pz = z + 0.08 + rF() * 0.07, nrm = new THREE.Vector3((rF() - 0.5) * 0.5, 0.2 + rF() * 0.3, 1).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
      addCard(flowerQ, px, py, pz, a, b, 0.11 + rF() * 0.07, 0.11 + rF() * 0.07, nrm, tint(flowerCols[Math.floor(rF() * flowerCols.length)], rF, 0.01, 0.05, 0.04));
    }
  }
  // a sash window in an opening: dressed surround, white frame with glazing bars, glass (curtain and room painted in it), optional flower box
  function windowFor(x, y, w, h, z, o = {}) {
    const gk = Math.floor(rW() * 4), fz = z - 0.17;
    addBox(dressed, x, y + h + 0.13, z + 0.04, w + 0.55, 0.26, 0.16, pale(), 0, 0, 1.2);
    addBox(dressed, x, y - 0.05, z + 0.13, w + 0.4, 0.12, 0.36, pale(), 0, 0, 1.2);
    for (let k = 0; k < Math.floor(h / 0.26); k++) for (const sd of [-1, 1]) { const ww = k % 2 ? 0.17 : 0.3; addBox(dressed, x + sd * (w / 2 + ww / 2 - 0.02), y + 0.13 + k * 0.26, z + 0.025, ww, 0.245, 0.04, pale(), 0, 0, 1.2); }
    addBox(dressed, x, y + h + 0.3, z + 0.045, 0.26, 0.2, 0.17, pale(), 0, 0, 1.2);
    const T = 0.06, fw = w - 0.04, fh = h - 0.02;
    addBox(whiteB, x, y + 0.03, fz, fw, T, 0.08, WHITE); addBox(whiteB, x, y + h - 0.02, fz, fw, T, 0.08, WHITE);
    addBox(whiteB, x - fw / 2 + T / 2, y + h / 2, fz, T, fh, 0.08, WHITE); addBox(whiteB, x + fw / 2 - T / 2, y + h / 2, fz, T, fh, 0.08, WHITE);
    addBox(whiteB, x, y + h * 0.5, fz + 0.015, fw, 0.06, 0.1, WHITE);
    for (let c = 1; c < 3; c++) addBox(whiteB, x - fw / 2 + (fw * c) / 3, y + h / 2, fz, 0.025, fh, 0.05, WHITE);
    addCard(glassBufs[gk], x, y + h / 2, z - 0.22, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), w - 0.06, h - 0.06, new THREE.Vector3(0, 0, 1), WHITE);
    if (o.box) flowerBox(x, y - 0.04, w, z + 0.28);
  }
  // a house front: stone or plaster, regular windows, a door opening for the plaster ones, string courses, cornice, a slate gable behind
  function gableRoof(x0, x1, y0, zf, depth, rise, dir) {
    const half = depth / 2, ang = Math.atan2(rise, half), L = Math.hypot(half, rise) + 0.3, Wd = x1 - x0;
    for (const sd of [0, 1]) {
      const g = new THREE.BoxGeometry(Wd, 0.12, L), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Wd / 2.2, uv.getY(i) * L / 2.2);
      const m = new THREE.Mesh(g, slateM); m.position.set((x0 + x1) / 2, y0 + rise / 2 + 0.04, zf + dir * (half / 2 + sd * half));
      m.rotation.x = dir * (sd ? ang : -ang); m.castShadow = m.receiveShadow = true; add(m);
    }
    for (const x of [x0 + 0.05, x1 - 0.05]) { const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(depth / 2, rise); tri.lineTo(depth, 0); const tg = new THREE.ShapeGeometry(tri); tg.rotateY(dir > 0 ? -Math.PI / 2 : Math.PI / 2); const tm = new THREE.Mesh(tg, std("#a89a86", { side: THREE.DoubleSide, color: new THREE.Color("#a89a86").multiply(W) })); tm.position.set(x, y0, zf); add(tm); }
  }
  const tones = ["#e8d6a8", "#dcc0a2", "#cfd0c2", "#e5c9a6", "#d8b8a4", "#e9dcc0", "#c9c5b0"];
  function house(x, w, h, z, k, dir, o = {}) {
    const stone = o.stone ?? (k % 3 === 1), holes = [], wins = [], nW = Math.max(2, Math.round(w / 2.0)), gap = w / nW;
    for (let c = 0; c < nW; c++) for (const [y, hh] of [[0.95, 1.95], [4.2, 1.85], [7.2, 1.55]]) if (y + hh < h - 0.4 && !(o.door && c === 1 && y < 1)) wins.push([x + gap * (c + 0.5), y, 1.0, hh]);
    if (o.door) wins.push([x + gap * 1.5, 0, 1.0, 2.1, "door"]);
    for (const wn of wins) holes.push({ x: wn[0], y: wn[4] ? 0 : wn[1], w: wn[2], h: wn[3], arch: wn[4] === "door" });
    const map = std("#ffffff", { map: stone ? (k % 2 ? stoneT2 : stoneT) : ctex(plasterCanvas(rW, tones[k % tones.length])), color: W, emissive: WARM });
    facade({ x0: x, x1: x + w, h, z, holes, map, baseY: -0.3, uvK: stone ? 3.2 : 3.6, uvX: x * 3.1 });
    for (const wn of wins) {
      if (wn[4] === "door") { const d = new THREE.Mesh(new THREE.BoxGeometry(wn[2] - 0.06, wn[3] - 0.25, 0.06), std(["#35567a", "#7a2f2a", "#2f5d3a", "#5a4a3a"][k % 4], { roughness: 0.55 })); d.position.set(wn[0], (wn[3] - 0.25) / 2, z - 0.2); d.castShadow = true; add(d); addBox(dressed, wn[0], wn[3] + 0.1, z + 0.06, wn[2] + 0.5, 0.22, 0.14, pale(), 0, 0, 1.2); continue; }
      windowFor(wn[0], wn[1], wn[2], wn[3], z, { box: o.boxes !== false && wn[1] > 0.5 && wn[1] < 5 && rW() < 0.7 });
    }
    addBox(dressed, x + w / 2, h + 0.05, z + 0.2, w + 0.3, 0.28, 0.5, pale(), 0, 0, 1.2);
    for (const yy of [3.45, 6.65]) if (yy < h - 0.5) addBox(dressed, x + w / 2, yy, z + 0.05, w + 0.04, 0.2, 0.12, pale(), 0, 0, 1.2);
    gableRoof(x - 0.15, x + w + 0.15, h + 0.2, z + 0.5, 8, 2.6 + rW(), dir);
  }
  // ---- the bakery's own building (above the shop front) and its neighbours
  const BX0 = -2.2, BX1 = 6.0, BH = 7.4;
  {
    const wins = [[-0.3, 4.4, 1.0, 1.9], [2.0, 4.4, 1.0, 1.9], [4.3, 4.4, 1.0, 1.9], [0.85, 6.5, 0.9, 0.7]];
    const holes = wins.slice(0, 3).map(([x, y, w, h]) => ({ x, y, w, h }));
    facade({ x0: BX0, x1: BX1, h: BH, z: WZ, holes, map: std("#ffffff", { map: ctex(plasterCanvas(rW, "#e5d2ae")), color: W, emissive: WARM }), baseY: 2.78, uvK: 3.6, uvX: 7 });
    for (const [x, y, w, h] of wins.slice(0, 3)) windowFor(x, y, w, h, WZ, { box: x > 0 });
    addBox(dressed, (BX0 + BX1) / 2, BH + 0.05, WZ + 0.2, BX1 - BX0 + 0.4, 0.3, 0.5, pale(), 0, 0, 1.2);
    gableRoof(BX0 - 0.15, BX1 + 0.15, BH + 0.2, WZ - 0.2, 8, 2.8, -1);
    for (const cx of [0.4, 4.6]) { addBox(dressed, cx, BH + 2.4, WZ - 3.4, 0.9, 2.6, 0.7, pale(), 0, 0, 1.2); }
  }
  // near side: the stone terrace to the left (ivy on its first house), then to the far end of the street; and to the right
  {
    let x = BX0, k = 1;
    while (x > -34) { const w = 5.6 + rW() * 2.2, h = 8.4 + rW() * 2.2; house(x - w, w, h, WZ - (k % 2 ? 0.12 : 0), k, -1, { stone: k % 2 === 1, boxes: true }); x -= w + 0.04; k++; }
    x = BX1 + 0.04; k = 4;
    while (x < 34) { const w = 5.4 + rW() * 2.2, h = 8.2 + rW() * 2.2; house(x, w, h, WZ - (k % 3 ? 0.1 : 0), k, -1, { stone: k % 2 === 0, boxes: true }); x += w + 0.04; k++; }
    // across the road
    x = -34; k = 0;
    while (x < 34) { const w = 5 + rW() * 2.4, h = 8.6 + rW() * 2.2; house(x, w, h, 12.1, k, 1, { door: true }); x += w + 0.04; k++; }
  }

  // ---------------------------------------------------------------- the shop front (all boxes; the window and the counter are open to the interior)
  const woodB = Buf(), boardB = Buf(), trimB = Buf(), innerB = Buf(), floorB = Buf(), shelfB = Buf(), breadB = Buf(), wickB = Buf(), fabB = Buf(), glowB = Buf();
  const wc = (k) => new THREE.Color().setScalar(k);
  const cnt = A.counterTop, sx0 = BX0, sx1 = BX1, topY = 2.75, backZ = -4.0, depth = -WZ + backZ * -1;   // depth 3.0
  void depth;
  {
    // the planked side wall (x -2.2 .. -0.5), two wide boards and dark pilasters; the base panels under the counter
    addBox(boardB, -1.35, topY / 2, WZ - 0.06, 1.7, topY, 0.12, WHITE, 0, 0, 2.4);
    for (const bx of [-2.15, -0.55]) addBox(trimB, bx, topY / 2, WZ + 0.0, 0.16, topY, 0.2, TRIMC);
    addBox(trimB, -1.35, 0.14, WZ + 0.02, 1.7, 0.28, 0.16, TRIMC); addBox(trimB, -1.35, 1.9, WZ + 0.0, 1.7, 0.08, 0.14, TRIMC);   // a plinth and a rail
    addBox(woodB, (-0.5 + sx1) / 2, cnt / 2 - 0.02, WZ - 0.04, sx1 + 0.5, cnt - 0.04, 0.1, WHITE, 0, 0, 2.0);
    // framed counter-front panels: stiles every 1.1 m, a top rail under the slab, a bottom rail
    for (let x = -0.5; x <= sx1 + 0.01; x += 1.1) addBox(trimB, x, cnt / 2, WZ + 0.03, 0.12, cnt - 0.02, 0.07, TRIMC);
    for (let x = 0.05; x < sx1; x += 1.1) {   // raised panels: a darker field with a thin moulding round it
      addBox(woodB, x, 0.3, WZ + 0.06, 0.86, 0.3, 0.03, wc(0.82 + rB() * 0.12), 0, 0, 2.0);
      for (const [dx, dy, w, h] of [[0, 0.165, 0.92, 0.035], [0, -0.165, 0.92, 0.035], [-0.455, 0, 0.035, 0.36], [0.455, 0, 0.035, 0.36]]) addBox(trimB, x + dx, 0.3 + dy, WZ + 0.085, w, h, 0.03, TRIMC);
    }
    addBox(trimB, (-0.5 + sx1) / 2, cnt - 0.08, WZ + 0.03, sx1 + 0.5, 0.1, 0.07, TRIMC); addBox(trimB, (-0.5 + sx1) / 2, 0.06, WZ + 0.03, sx1 + 0.5, 0.12, 0.07, TRIMC);
    // the counter top: one slab, x -0.5 .. 6.0, overhanging the street, top y 0.55
    addBox(woodB, (-0.5 + sx1) / 2 + 0.05, cnt - 0.03, (A.counterZ[0] + A.counterZ[1]) / 2, sx1 + 0.6, 0.06, A.counterZ[1] - A.counterZ[0], WHITE, 0, 0, 1.0);
    addBox(trimB, (-0.5 + sx1) / 2 + 0.05, cnt - 0.07, A.counterZ[1] - 0.005, sx1 + 0.6, 0.05, 0.03, TRIMC);
    // posts, the header board above the opening, the awning rail, the sign board and beam
    for (const px of [-0.5, 1.4, sx1 - 0.07]) addBox(trimB, px, (cnt + 2.1) / 2, WZ - 0.02, 0.14, 2.1 - cnt + 0.4, 0.16, TRIMC);
    addBox(woodB, (-0.5 + sx1) / 2, 2.4, WZ - 0.02, sx1 + 0.5, 0.62, 0.12, WHITE, 0, 0, 2.0);
    addBox(trimB, (-0.5 + sx1) / 2, 2.1, WZ + 0.03, sx1 + 0.5, 0.1, 0.14, TRIMC); addBox(trimB, (sx0 + sx1) / 2, topY + 0.02, WZ + 0.04, sx1 - sx0 + 0.1, 0.14, 0.2, TRIMC);
    // display window: frame, mullions, sill shelf; the glass is a separate transparent card
    addBox(trimB, 0.45, 0.7, WZ - 0.0, 1.9, 0.1, 0.12, TRIMC); addBox(trimB, 0.45, 1.98, WZ - 0.0, 1.9, 0.1, 0.12, TRIMC);
    addBox(trimB, 0.45, 1.34, WZ - 0.02, 0.07, 1.3, 0.08, TRIMC); addBox(trimB, 0.45, 1.3, WZ - 0.02, 1.9, 0.05, 0.06, TRIMC);
    // the interior: floor, back wall, ceiling, two side walls
    const ic = 0.5;
    addBox(innerB, 0.45, 1.35, WZ - 0.78, 1.8, 1.5, 0.05, wc(0.45), 0, 0, 2.0);   // a dark backing behind the window shelves, so the loaves read
    addBox(floorB, (-0.5 + sx1) / 2, -0.02, (WZ + backZ) / 2, sx1 + 0.5, 0.04, backZ * -1 + WZ, wc(0.9), 0, 0, 2.0);
    addBox(innerB, (-0.5 + sx1) / 2, topY / 2, backZ, sx1 + 0.5, topY, 0.1, wc(ic), 0, 0, 2.0);
    addBox(innerB, (-0.5 + sx1) / 2, topY + 0.04, (WZ + backZ) / 2, sx1 + 0.5, 0.08, backZ * -1 + WZ, wc(0.65), 0, 0, 2.0);
    addBox(innerB, -0.47, topY / 2, (WZ + backZ) / 2, 0.08, topY, backZ * -1 + WZ, wc(0.75), 0, 0, 2.0); addBox(innerB, sx1 + 0.02, topY / 2, (WZ + backZ) / 2, 0.08, topY, backZ * -1 + WZ, wc(0.75), 0, 0, 2.0);
    // back shelves (x 1.6 .. 5.6) with bread and baskets; a plank door at x 5.2; a high shelf with tins; window-side shelves (x -0.4 .. 1.3)
    const loaf = (kind, x, y, z, ry = 0, sc = 1) => {
      const col = new THREE.Color().setScalar(0.84 + rB() * 0.3).multiply(new THREE.Color(1, 0.95 + rB() * 0.07, 0.9 + rB() * 0.12));
      if (kind === "boule") addGeo(breadB, new THREE.SphereGeometry(1, 14, 10), M4(x, y + 0.115 * sc, z, 0.19 * sc, 0.13 * sc, 0.19 * sc, 0, ry), col);
      else if (kind === "batard") addGeo(breadB, new THREE.SphereGeometry(1, 14, 10), M4(x, y + 0.095 * sc, z, 0.3 * sc, 0.1 * sc, 0.115 * sc, 0, ry), col);
      else if (kind === "bun") addGeo(breadB, new THREE.SphereGeometry(1, 10, 8), M4(x, y + 0.06 * sc, z, 0.095 * sc, 0.065 * sc, 0.095 * sc, 0, ry), col);
      else if (kind === "croissant") addGeo(breadB, new THREE.TorusGeometry(0.06, 0.03, 8, 12, 4.3), M4(x, y + 0.04, z, sc, sc, sc * 1.1, -Math.PI / 2, ry), col);
      else if (kind === "bag") addGeo(breadB, new THREE.CapsuleGeometry(0.036, 0.52, 4, 8), M4(x, y, z, 1, 1, 1, 0.14 * Math.sin(ry * 3), 0, 0.14 * Math.cos(ry * 5)), col);   // standing baguette, base at y
      else if (kind === "bagL") addGeo(breadB, new THREE.CapsuleGeometry(0.036, 0.5, 4, 8), M4(x, y + 0.04, z, 1, 1, 1, 0, 0, Math.PI / 2 + (rB() - 0.5) * 0.12), col);   // baguette lying
    };
    const shelf = (x0, x1, y, z, d) => { addBox(shelfB, (x0 + x1) / 2, y - 0.02, z, x1 - x0, 0.04, d, WHITE, 0, 0, 1.2); addBox(shelfB, (x0 + x1) / 2, y + 0.03, z + d / 2 - 0.01, x1 - x0, 0.06, 0.02, WHITE, 0, 0, 1.2); };
    const row = (x0, x1, y, z, kinds, step, sc = 1) => { let x = x0, i = 0; while (x < x1) { const kd = kinds[i % kinds.length]; loaf(kd, x + (rB() - 0.5) * 0.03, y, z + (rB() - 0.5) * 0.04, rB() * 6.28, sc * (0.92 + rB() * 0.2)); x += kd === "batard" ? step * 1.4 : kd === "bagL" ? 0.1 : step; i++; } };
    const tray = (x, y, z, nx, nz, kind = "bun", sc = 0.9) => {   // a metal tray of buns, nx by nz
      addBox(trimB, x, y + 0.012, z, nx * 0.19 + 0.06, 0.024, nz * 0.19 + 0.06, new THREE.Color("#c4bfb2"));
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) loaf(kind, x + (i - (nx - 1) / 2) * 0.19, y + 0.024, z + (j - (nz - 1) / 2) * 0.19, rB() * 6.28, sc);
    };
    const basket = (x, y, z, r, h) => { addGeo(wickB, new THREE.CylinderGeometry(r, r * 0.82, h, 14, 1, true), M4(x, y + h / 2, z), WHITE); addGeo(wickB, new THREE.CircleGeometry(r * 0.82, 12), M4(x, y + 0.01, z, 1, 1, 1, -Math.PI / 2), WHITE); };
    // the display window: four shelves, two rows deep, packed
    const WK = [[0.86, ["boule", "boule", "batard", "boule"], 0.38, 0.95], [1.18, ["bun", "bun", "croissant", "bun", "bun"], 0.22, 1.05], [1.5, ["batard", "boule", "boule"], 0.38, 0.95], [1.82, ["bun", "croissant", "bun", "bun"], 0.22, 1.05]];
    for (const [y, kinds, st, sc] of WK) { shelf(-0.42, 1.34, y, WZ - 0.38, 0.54); row(-0.3, 1.25, y, WZ - 0.22, kinds, st, sc); row(-0.15, 1.25, y, WZ - 0.5, kinds.slice().reverse(), st, sc); }
    tray(0.3, cnt, WZ - 0.34, 4, 2); tray(-0.12, cnt, WZ - 0.34, 2, 2, "bun", 0.8);   // trays on the counter inside the window
    // the back shelves (x 1.65 .. 5.7): five rows, two deep, baskets of rolls, a high shelf of tins
    const BK2 = [[0.8, ["boule", "boule", "batard"], 0.4, 0.95], [1.14, ["bun", "bun", "bun", "croissant"], 0.22, 1.05], [1.48, ["batard", "boule", "boule", "boule"], 0.38, 0.95], [1.82, ["bagL", "bagL", "bagL", "bun", "bun"], 0.22, 1.05], [2.16, ["boule", "bun", "boule"], 0.38, 0.95]];
    for (const [y, kinds, st, sc] of BK2) { shelf(1.65, 5.7, y, backZ + 0.34, 0.6); row(1.75, 5.55, y, backZ + 0.2, kinds, st, sc); row(1.85, 5.55, y, backZ + 0.46, kinds.slice().reverse(), st, sc); }
    for (const [bx, by] of [[2.4, 0.0], [3.2, 0.0]]) addBox(innerB, bx, 0.38, backZ + 0.34, 0.7, 0.76, 0.5, wc(0.7), 0, 0, 1.0);
    addBox(trimB, 5.1, 1.0, backZ + 0.07, 0.9, 2.0, 0.08, new THREE.Color("#5a3a22")); addBox(trimB, 5.1, 2.02, backZ + 0.07, 1.0, 0.08, 0.1, TRIMC);   // the back door
    // baguettes standing in floor baskets behind the counter, rolls in baskets on the shelves
    for (const [bx, bz] of [[5.45, -2.3], [1.85, -2.6]]) { basket(bx, 0, bz, 0.22, 0.4); for (let i = 0; i < 9; i++) loaf("bag", bx + Math.cos(i * 2.4) * 0.11, 0.42, bz + Math.sin(i * 2.4) * 0.11, i * 1.7); }
    // on the counter (the open part): a tray of buns, a board of round loaves, the baguette basket, a stack of boxes, a till
    tray(1.95, cnt, -1.05, 4, 2); tray(2.85, cnt, -1.1, 3, 2, "bun", 0.9);
    addBox(trimB, 4.4, cnt + 0.015, -1.08, 0.9, 0.03, 0.4, new THREE.Color("#a8783e")); for (const [dx, k] of [[-0.28, "boule"], [0.0, "boule"], [0.28, "batard"]]) loaf(k, 4.4 + dx, cnt + 0.03, -1.08, rB() * 3, 0.85);
    basket(5.3, cnt, -1.05, 0.17, 0.3); for (let i = 0; i < 7; i++) loaf("bag", 5.3 + (i - 3) * 0.04, cnt + 0.32, -1.05 + ((i * 7) % 3 - 1) * 0.04, i * 1.3);
    basket(3.65, cnt, -1.08, 0.17, 0.14); for (let i = 0; i < 6; i++) loaf("bun", 3.65 + Math.cos(i * 1.047) * 0.08, cnt + 0.14, -1.08 + Math.sin(i * 1.047) * 0.08, i, 0.9);
    addBox(trimB, 5.75, cnt + 0.11, -1.05, 0.26, 0.2, 0.2, new THREE.Color("#3a3a36"));
    // pendant lamps: a glowing cone shade on a cord, bulb and shade lit
    for (const [lx, lz] of [[0.45, WZ - 0.6], [2.2, -1.9], [3.8, -1.9], [5.2, -1.9]]) {
      addGeo(glowB, new THREE.ConeGeometry(0.2, 0.15, 14, 1, true), M4(lx, 2.3, lz), new THREE.Color("#ffe0a0")); addGeo(glowB, new THREE.SphereGeometry(0.06, 8, 6), M4(lx, 2.24, lz), new THREE.Color("#fff6d0"));
      addBox(trimB, lx, 2.52, lz, 0.015, 0.45, 0.015, new THREE.Color("#1c1c1c"));
    }
    // the window's cake stand with rolls
    addBox(trimB, -0.05, 1.52, WZ - 0.34, 0.26, 0.03, 0.26, new THREE.Color("#f4efe4"));
    // a hand-lettered chalk board on the plank wall; the lamp bracket; an awning rod
    addBox(trimB, -1.3, 1.25, WZ + 0.045, 0.75, 0.55, 0.05, new THREE.Color("#2a2e2c")); addBox(trimB, -1.3, 1.25, WZ + 0.075, 0.65, 0.45, 0.01, new THREE.Color(RAIN ? "#4a5450" : "#3a4440"));
  }
  add(bufMesh(woodB, woodM)); add(bufMesh(boardB, boardM)); add(bufMesh(trimB, trimM)); add(bufMesh(innerB, innerWoodM, false, true)); add(bufMesh(floorB, floorM, false, true));
  add(bufMesh(shelfB, std("#7a5230", { vertexColors: true, emissive: new THREE.Color("#5a3818") }), false, true)); add(bufMesh(breadB, breadM, false, true)); add(bufMesh(wickB, wickerM, false, true));
  add(bufMesh(glowB, basic({ vertexColors: true, side: THREE.DoubleSide, fog: false })));
  // warm light spilling out of the opening (a soft card on the floor and the counter's front edge)
  {
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), new THREE.MeshBasicMaterial({ color: RAIN ? "#ffc66e" : "#ffd89a", transparent: true, opacity: RAIN ? 0.05 : 0.04, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    warm.userData.noOutline = true; warm.position.set(2.7, 1.3, -1.5); warm.renderOrder = 2; warm.userData.solid = false; add(warm);
  }
  // the shop glass: a faint reflection over the display shelves
  {
    const gm = new THREE.MeshBasicMaterial({ map: ctex(shopGlassCanvas(rW, RAIN), 1, 1, false), transparent: true, depthWrite: false, fog: false }); gm.userData.noOutline = true;
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.36), gm); gl.position.set(0.45, 1.34, WZ + 0.07); gl.renderOrder = 3; gl.userData.solid = false; add(gl);
  }

  // ---------------------------------------------------------------- the awning: striped canopy, scalloped valance, iron arms
  {
    const [x0, x1] = A.awning.x, n = Math.round((x1 - x0) / 0.225), sw = (x1 - x0) / n, y0 = A.awning.wallY, y1 = A.awning.edgeY, z1 = A.awning.edgeZ, FL = 0.28;
    const red = RAIN ? new THREE.Color("#8c3040") : new THREE.Color("#b83450"), cream = RAIN ? new THREE.Color("#b9b6b0") : new THREE.Color("#f2e4cc");
    for (let i = 0; i < n; i++) {
      const col = (i % 2 ? cream : red).clone().multiplyScalar(0.94 + rW() * 0.1), xa = x0 + i * sw, xb = xa + sw, b = fabB.p.length / 3;
      const sa = Math.atan2(y0 - y1, z1 - WZ), nz = new THREE.Vector3(0, Math.cos(sa), Math.sin(sa));
      for (const [x, y, z, u, v] of [[xa, y0, WZ + 0.02, 0, 0], [xb, y0, WZ + 0.02, 1, 0], [xb, y1, z1, 1, 1], [xa, y1, z1, 0, 1]]) { fabB.p.push(x, y, z); fabB.n.push(nz.x, nz.y, nz.z); fabB.uv.push(u, v); fabB.c.push(col.r, col.g, col.b); }
      fabB.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
      // the valance: a hanging flap with a round scalloped bottom
      const sh = new THREE.Shape(); sh.moveTo(-sw / 2 + 0.003, 0); sh.lineTo(sw / 2 - 0.003, 0); sh.lineTo(sw / 2 - 0.003, -(FL - sw / 2)); sh.absarc(0, -(FL - sw / 2), sw / 2 - 0.003, 0, -Math.PI, true); sh.lineTo(-sw / 2 + 0.003, 0);
      const fg = new THREE.ShapeGeometry(sh, 8); addGeo(fabB, fg, M4((xa + xb) / 2, y1 + 0.01, z1 + 0.012, 1, 1, 1, 0.1, 0, 0), col.clone().multiplyScalar(1.02));
    }
    // fix flap uvs (ShapeGeometry uses world units): scale into 0..1
    const fu = fabB.uv; for (let i = 0; i < fu.length; i++) fu[i] = ((fu[i] % 1) + 1) % 1;
    addBox(trimB, (x0 + x1) / 2, y1 + 0.015, z1 + 0.02, x1 - x0, 0.03, 0.03, new THREE.Color("#3a2a24"));   // the front rod
    for (const ax of [x0 + 0.05, x1 - 0.05, 2.0, 4.2]) { const a = new THREE.Vector3(ax, y0 - 0.25, WZ + 0.06), b2 = new THREE.Vector3(ax, y1 - 0.02, z1 - 0.05); const [gg, MM] = segMat(a, b2, 0.016, 0.016); addGeo(ironB, gg, MM, WHITE); }
    const am = bufMesh(fabB, fabricM, !RAIN, true); am.name = "set-awning"; am.userData.solid = false; add(am);
    // the underside (seen from below): a dim warm cloth
    const under = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, Math.hypot(z1 - WZ, y0 - y1)), std(RAIN ? "#6a4650" : "#a06a58", { side: THREE.DoubleSide, emissive: new THREE.Color(RAIN ? "#2a1c20" : "#3a2420") }));
    under.position.set((x0 + x1) / 2, (y0 + y1) / 2 - 0.012, (WZ + z1) / 2 + 0.01); under.rotation.x = Math.PI / 2 + Math.atan2(y0 - y1, z1 - WZ); under.userData.solid = false; under.castShadow = false; add(under);
  }
  add(bufMesh(ironB, iron));

  // ---------------------------------------------------------------- the flower tub, the lamp, the tree pit
  const flowerQ2 = Buf(), leaf2Q = Buf(), tubB = Buf();
  {
    const tx = A.tub.x, tz = A.tub.z, tr = 0.3, th = 0.42, nStave = 16;
    for (let i = 0; i < nStave; i++) { const a = (i / nStave) * Math.PI * 2, a2 = ((i + 1) / nStave) * Math.PI * 2, col = new THREE.Color(RAIN ? "#9a6a44" : "#c89a62").multiplyScalar(0.88 + rF() * 0.2);
      const rb = tr * 0.84, rt = tr; const p = [[Math.cos(a) * rb, 0, Math.sin(a) * rb], [Math.cos(a2) * rb, 0, Math.sin(a2) * rb], [Math.cos(a2) * rt, th, Math.sin(a2) * rt], [Math.cos(a) * rt, th, Math.sin(a) * rt]], b = tubB.p.length / 3, am = (a + a2) / 2;
      for (const [px, py, pz] of p) { tubB.p.push(tx + px, py, tz + pz); tubB.n.push(Math.cos(am), 0.1, Math.sin(am)); tubB.uv.push(0, 0); tubB.c.push(col.r, col.g, col.b); }
      tubB.i.push(b, b + 2, b + 1, b, b + 3, b + 2); }
    for (const hy of [0.07, 0.34]) addGeo(tubB, new THREE.TorusGeometry(tr * (0.84 + 0.16 * hy / th) + 0.004, 0.012, 6, 24), M4(tx, hy, tz, 1, 1, 1, Math.PI / 2), new THREE.Color("#3a3d46"));
    addGeo(tubB, new THREE.CircleGeometry(tr * 0.98, 20), M4(tx, th - 0.03, tz, 1, 1, 1, -Math.PI / 2), new THREE.Color("#3a2a1a"));
    const tm = bufMesh(tubB, lam("#ffffff", { vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color("#2a1a0c") })); tm.name = "set-tub"; add(tm);
    const sunF = ["#f6c21c", "#f8d63a", "#eeb016", "#ffd84a"], rainF = ["#d9607a", "#e87a8c", "#e8a03a", "#c8506a", "#f0906a"], gl = RAIN ? ["#3f6a38", "#4a7a40", "#7a8a30"] : ["#4f8a3a", "#6a9a3e", "#7aa43e"];
    for (let i = 0; i < 110; i++) {   // leaves, a low green dome
      const a = rF() * 6.28, r = Math.sqrt(rF()) * 0.3, nrm = new THREE.Vector3((rF() - 0.5) * 0.8, 0.7, (rF() - 0.5) * 0.8).normalize(), [fa, fb] = frameOf(nrm, rF() * 6.28);
      addCard(leaf2Q, tx + Math.cos(a) * r, th + 0.04 + rF() * 0.3 * (1 - r / 0.4), tz + Math.sin(a) * r, fa, fb, 0.13 + rF() * 0.08, 0.13 + rF() * 0.08, nrm, tint(gl[Math.floor(rF() * gl.length)], rF));
    }
    for (let i = 0; i < 70; i++) {   // flower heads, a dome up to ~0.95
      const a = rF() * 6.28, r = Math.sqrt(rF()) * 0.32, hgt = th + 0.18 + (1 - (r / 0.32) ** 2) * 0.38 + rF() * 0.1, nrm = new THREE.Vector3(Math.cos(a) * 0.4 * (r / 0.32), 0.6, Math.sin(a) * 0.4 * (r / 0.32) + 0.5).normalize(), [fa, fb] = frameOf(nrm, rF() * 6.28);
      addCard(flowerQ2, tx + Math.cos(a) * r, hgt, tz + Math.sin(a) * r, fa, fb, 0.15 + rF() * 0.06, 0.15 + rF() * 0.06, nrm, tint((RAIN ? rainF : sunF)[Math.floor(rF() * 4)], rF, 0.01, 0.05, 0.05));
    }
    add(bufMesh(leaf2Q, ivyMat, true, false)); add(bufMesh(flowerQ2, flowerMat, true, false));
  }
  add(bufMesh(whiteB, white, true, true)); add(bufMesh(dressed, dressedM));
  glassBufs.forEach((B, k) => { const m = bufMesh(B, glassMats[k], false, false); if (m) add(m); });
  add(bufMesh(flowerQ, flowerMat, true, false)); add(bufMesh(boxLeafQ, ivyMat, true, false));
  const lampIron = std(RAIN ? "#15171c" : "#1b3a30", { roughness: 0.45, metalness: 0.4 });
  const glowTex = ctex(glowCanvas(), 1, 1, false);
  const glows = [];
  function lamp(lx, ly, lz, sc = 1, fat = 1) {
    const P = [], T = (r, tube, y, rx = Math.PI / 2) => [new THREE.TorusGeometry(r * fat, tube, 6, 14), M4(lx, ly + y * sc, lz, sc, sc, sc, rx)];
    P.push([new THREE.BoxGeometry(0.4 * fat, 0.14, 0.4 * fat), M4(lx, ly + 0.07 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.17 * fat, 0.24 * fat, 0.36, 12), M4(lx, ly + 0.32 * sc, lz, sc, sc, sc)], [new THREE.SphereGeometry(0.15 * fat, 12, 8), M4(lx, ly + 0.72 * sc, lz, sc, 1.3 * sc, sc)],
      [new THREE.CylinderGeometry(0.07 * fat, 0.11 * fat, 0.5, 10), M4(lx, ly + 0.55 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.05 * fat, 0.07 * fat, 2.35, 10), M4(lx, ly + 2.05 * sc, lz, sc, sc, sc)], T(0.11, 0.02, 0.45), T(0.09, 0.018, 1.0), T(0.085, 0.018, 1.3), T(0.075, 0.016, 2.6), T(0.1, 0.02, 3.2),
      [new THREE.CylinderGeometry(0.1, 0.06, 0.14, 8), M4(lx, ly + 3.28 * sc, lz, sc, sc, sc)], [new THREE.CylinderGeometry(0.2, 0.17, 0.05, 6), M4(lx, ly + 3.38 * sc, lz, sc, sc, sc)],
      [new THREE.CylinderGeometry(0.075, 0.2, 0.1, 6), M4(lx, ly + 3.95 * sc, lz, sc, sc, sc)], [new THREE.ConeGeometry(0.24, 0.3, 6), M4(lx, ly + 4.12 * sc, lz, sc, sc, sc)], [new THREE.SphereGeometry(0.05, 8, 6), M4(lx, ly + 4.32 * sc, lz, sc, sc, sc)]);
    add(mergedGeo(P, lampIron));
    const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * sc, 0.12 * sc, 0.5 * sc, 6), basic({ color: RAIN ? new THREE.Color(1.0, 0.82, 0.46) : new THREE.Color(1.0, 0.92, 0.66) })); lan.position.set(lx, ly + 3.67 * sc, lz); add(lan);
    for (let k = 0; k < 6; k++) { const an = (k / 6) * 6.28 + 0.52; const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.52 * sc, 0.025), lampIron); bar.position.set(lx + Math.cos(an) * 0.17 * sc, ly + 3.67 * sc, lz + Math.sin(an) * 0.17 * sc); bar.castShadow = false; add(bar); }
    if (RAIN) glows.push([lx, ly + 3.67 * sc, lz, sc]);
  }
  lamp(A.lamp.x, 0, A.lamp.z, 1.0, 1.7);
  if (RAIN) for (const [qx, qz, s2] of [[-12, 2.0, 0.9], [-22, 2.0, 0.85], [-33, 2.0, 0.8], [-10, 9.7, 0.9], [-19, 9.7, 0.85], [-29, 9.7, 0.8], [11, 2.0, 0.9], [20, 9.7, 0.85]]) lamp(qx, 0, qz, s2, 1);
  else for (const [qx, qz] of [[-14, 2.0], [-12, 9.7], [14, 2.0]]) lamp(qx, 0, qz, 0.95, 1);
  if (RAIN) {   // the lanterns' glow: additive sprites
    for (const [gx, gy, gz, s2] of glows) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 1 })); sp.position.set(gx, gy, gz); sp.scale.setScalar(3.2 * s2); sp.userData.solid = false; sp.userData.noOutline = true; add(sp); }
    const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.45 })); sp2.position.set(2.0, 1.3, WZ + 1.0); sp2.scale.set(6, 2.6, 1); sp2.userData.solid = false; add(sp2);   // the window's halo
  }

  // ---------------------------------------------------------------- wet reflections (rain): warm streaks of the window and the lamps on the setts
  if (RAIN) {
    const st = new THREE.Texture(); void st;
    const stT = ctex(streakCanvas(rnd), 1, 1, false), sheenT = ctex(sheenCanvas(rnd), 1, 1, true);
    const sm = new THREE.MeshBasicMaterial({ map: stT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); sm.userData.noOutline = true;
    const SB = Buf();
    // a streak runs from z0 (bright) to z1 (faded), x0..x1 wide, at height y; uv v 0 = bright end
    const streak = (xc, w, z0, z1, y, r, g2, b2) => { const b = SB.p.length / 3; for (const [x, z, u, v] of [[xc - w / 2, z0, 0, 0], [xc + w / 2, z0, 1, 0], [xc + w / 2, z1, 1, 1], [xc - w / 2, z1, 0, 1]]) { SB.p.push(x, y, z); SB.n.push(0, 1, 0); SB.uv.push(u, 1 - v); SB.c.push(r, g2, b2); } SB.i.push(b, b + 2, b + 1, b, b + 3, b + 2); };
    // reflections fall toward the camera: short soft smears under each light, broken by the setts
    for (const [xc, w, k] of [[-0.1, 0.55, 0.8], [0.45, 0.6, 1.0], [1.0, 0.55, 0.8], [2.2, 0.7, 0.8], [3.0, 0.7, 0.7], [3.8, 0.7, 0.8], [4.6, 0.7, 0.7], [5.4, 0.6, 0.7]]) streak(xc, w, -0.7, 1.6, 0.011, 0.95 * k, 0.62 * k, 0.28 * k);
    for (const xc of [0.45, 3.2]) streak(xc, 0.9, 2.57, 3.9, A.roadY + 0.011, 0.55, 0.36, 0.16);   // a faint carry-over onto the road
    // the lamps: the near ones from their feet over the kerb and the road, the far row from across the road
    for (const lx of [A.lamp.x, -12, -22, -33, 11]) { streak(lx, 0.5, 2.0, 2.34, 0.011, 1.3, 0.9, 0.42); streak(lx, 0.65, 2.57, 4.9, A.roadY + 0.011, 1.2, 0.8, 0.36); }
    for (const lx of [-10, -19, -29, 20]) streak(lx, 0.7, 9.6, 6.6, A.roadY + 0.011, 1.15, 0.76, 0.34);
    for (let x = -30; x < 30; x += 5.3) streak(x + ((x * 7) % 3) * 0.4, 0.55, 9.2, 7.3, A.roadY + 0.011, 0.55, 0.36, 0.14);   // the terrace's lit windows
    const shm = bufMesh(SB, sm, false, false); shm.renderOrder = 2; shm.userData.solid = false; add(shm);
    // sky sheen: pale puddly patches on the whole street
    const hm = new THREE.MeshBasicMaterial({ map: sheenT, color: "#7f8ba0", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); hm.userData.noOutline = true;
    const sheenB = groundBuf(-60, 40, A.roadZ[0], A.roadZ[1], A.roadY + 0.008, 5, 5, null); sheenB.uv = sheenB.uv.map((q) => q * 0.4);
    const shp = bufMesh(sheenB, hm, false, false); shp.renderOrder = 2; shp.userData.solid = false; add(shp);
    const sheenB2 = groundBuf(-60, 40, WZ, A.pavementZ[1], 0.008, 5, 5, null); sheenB2.uv = sheenB2.uv.map((q) => q * 0.4);
    const shp2 = bufMesh(sheenB2, hm, false, false); shp2.renderOrder = 2; shp2.userData.solid = false; add(shp2);
    // the three puddles (spec puddles: false to leave them to the director's `puddle` props): a mirror of the lit street
    if (S.puddles !== false) {
      const pm = new THREE.MeshBasicMaterial({ map: ctex(puddleCanvas(rnd), 1, 1, false), transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); pm.userData.noOutline = true;
      A.puddles.forEach((p, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(p.d * 1.5, p.d * 1.5), pm); m.rotation.x = -Math.PI / 2; m.rotation.z = i * 0.7; m.position.set(p.x, p.y + 0.006, p.z); m.renderOrder = 3; m.userData.solid = false; m.name = "set-puddle"; add(m); });
    }
  } else {   // sun: the shop's warm light on the pavement in front of the opening
    const stT = ctex(streakCanvas(rnd), 1, 1, false), sm = new THREE.MeshBasicMaterial({ map: stT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); sm.userData.noOutline = true;
    const SB = Buf(), b = 0; void b;
    for (const [xc, w] of [[0.45, 1.6], [3.2, 3.4]]) { const i0 = SB.p.length / 3; for (const [x, z, u, v] of [[xc - w / 2, -0.78, 0, 1], [xc + w / 2, -0.78, 1, 1], [xc + w / 2, 1.2, 1, 0], [xc - w / 2, 1.2, 0, 0]]) { SB.p.push(x, 0.011, z); SB.n.push(0, 1, 0); SB.uv.push(u, v); SB.c.push(0.26, 0.17, 0.06); } SB.i.push(i0, i0 + 2, i0 + 1, i0, i0 + 3, i0 + 2); }
    const shm = bufMesh(SB, sm, false, false); shm.renderOrder = 2; shm.userData.solid = false; add(shm);
  }

  // ---------------------------------------------------------------- foliage: maples (sun: full crowns, rain: thin and brown), shrubs, ivy
  const treeWood = [], leafQ = Buf(), coreQ = Buf();
  const TONES = RAIN
    ? { red: ["#8a4a30", "#9a5a30", "#7a4a2c"], orange: ["#a8682e", "#b87a34", "#946030", "#c08a3e"], gold: ["#b88a3a", "#a87a34", "#c49a44"], mix: ["#a8682e", "#8a4a30", "#b88a3a", "#946030"], green: ["#5a7a40", "#6a8a46"] }
    : { red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e", "#a8221a"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"], gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e", "#f2c038"], mix: ["#d9461c", "#e8751e", "#f0b21e", "#c8301c", "#f6cc3a", "#e08c1e"], green: ["#6f9a3a", "#8aa83a", "#b9b02a", "#5a8a3a", "#d8a82a"] };
  const dens = RAIN ? 0.8 : 1, coreK = RAIN ? 0.3 : 0.5;
  function clump(c, r, tone, scaleY = 0.78, cards = null, cardSz = 0.27) {
    const pal = TONES[tone].map((h) => new THREE.Color(h)), n = Math.round((cards ?? Math.round(80 + 240 * r)) * dens), dark = pal[0].clone().lerp(pal[1 % pal.length], 0.5).multiplyScalar(0.5), kc = 0.72 + rT() * 0.5;
    const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = coreQ.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); coreQ.p.push(c.x + x * r * coreK, c.y + y * r * coreK * scaleY, c.z + z * r * coreK); _n.set(x, y, z).normalize(); coreQ.n.push(_n.x, _n.y, _n.z); coreQ.uv.push(0, 0); coreQ.c.push(dark.r, dark.g, dark.b); coreQ.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = new THREE.Vector3(rr * Math.cos(th), u * scaleY, rr * Math.sin(th));
      const rad = r * (0.7 + rT() * 0.32), p = new THREE.Vector3(c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad);
      const nrm = new THREE.Vector3(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = cardSz * (0.75 + rT() * 0.5);
      addCard(leafQ, p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
    }
  }
  function maple(x, z, h, tone, o = {}) {
    const y0 = o.y0 ?? 0.05, lean = (rT() - 0.5) * 0.12, R = o.R ?? h * 0.36, trunkH = h * (o.trunk ?? 0.5);
    const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => new THREE.Vector3(x + lean * k * k * trunkH + Math.sin(k * 3 + x) * 0.05, y0 + k * trunkH, z + lean * 0.5 * k * k * trunkH)), r0 = o.r ?? 0.09 + h * 0.014;
    pts.forEach((p, i) => { if (i) treeWood.push(segMat(pts[i - 1], p, r0 * (1 - (i - 1) * 0.15), r0 * (1 - i * 0.15))); });
    treeWood.push([new THREE.ConeGeometry(r0 * 1.9, 0.5, 8), M4(x, y0 + 0.2, z)]);
    const top = pts[4], nb = (o.branches ?? 6) + 1;
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * 6.28 + rT() * 0.7, el = 0.45 + rT() * 0.5, f = 0.35 + (b % 3) * 0.2, st = pts[Math.min(4, Math.round(f * 4))].clone(), L = R * (0.75 + rT() * 0.45);
      st.y = y0 + trunkH * (0.55 + 0.45 * f);
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), mid = st.clone().addScaledVector(dir, L * 0.5), tip = st.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, L * 0.18, 0));
      const rb = r0 * (0.5 - b * 0.02), tn = () => (o.tones ? o.tones[Math.floor(rT() * o.tones.length)] : tone);
      treeWood.push(segMat(st, mid, rb, rb * 0.62)); treeWood.push(segMat(mid, tip, rb * 0.62, 0.025));
      if (rT() < 0.85) { const d2 = dir.clone().applyAxisAngle(Yaxis, (rT() < 0.5 ? -1 : 1) * (0.6 + rT() * 0.5)), e2 = mid.clone().addScaledVector(d2, L * 0.55).add(new THREE.Vector3(0, L * 0.12, 0)); treeWood.push(segMat(mid.clone(), e2, rb * 0.4, 0.02)); clump(e2, R * (0.3 + rT() * 0.14), tn()); }
      clump(tip, R * (0.34 + rT() * 0.16), tn());
      clump(tip.clone().add(new THREE.Vector3((rT() - 0.5) * R * 0.5, R * (0.2 + rT() * 0.2), (rT() - 0.5) * R * 0.5)), R * (0.26 + rT() * 0.12), tn());
      clump(mid.clone().addScaledVector(dir, L * 0.18).add(new THREE.Vector3(0, 0.2, 0)), R * (0.26 + rT() * 0.1), tn());
    }
    clump(top.clone().add(new THREE.Vector3(0, R * 0.55, 0)), R * 0.42, tone);
    clump(top.clone().add(new THREE.Vector3(R * 0.3, R * 0.2, -R * 0.2)), R * 0.36, tone);
  }
  if (S.trees !== false) {
    // the tree-pit maple (panel 06's trunk, the left of the painting): big trunk, thick crown over the lamp
    maple(A.tree.x, A.tree.z, 11, RAIN ? "orange" : "gold", { tones: RAIN ? ["orange", "gold", "red"] : ["gold", "orange", "gold", "red"], trunk: 0.7, R: 3.1, r: 0.3, y0: 0.0 });
    // the pit's ring of kerb stones and its earth
    {
      const RB = Buf(), rr = rng(seed * 9 + 4), tp = A.tree;
      for (let i = 0; i < 14; i++) { const a0 = (i / 14) * 6.2832, a1 = ((i + 1) / 14) * 6.2832, am = (a0 + a1) / 2, rad = 0.95, w = 0.5; addBox(RB, tp.x + Math.cos(am) * rad, 0.07, tp.z + Math.sin(am) * rad, w, 0.16, 0.22, new THREE.Color().setScalar(0.9 + rr() * 0.15), -am - Math.PI / 2, 0, 1.0); }
      const rm = bufMesh(RB, std("#ffffff", { map: ctex(stoneCanvas(rnd, 1024, "#6b6258", ["#c6baa8", "#b8ad9d", "#d0c4b0", "#aaa396", "#bfb4a2"]), 1 / 4.8, 1 / 4.8), vertexColors: true, color: W, emissive: new THREE.Color("#30241a") })); rm.name = "set-treepit"; add(rm);
      const earth = new THREE.Mesh(new THREE.CircleGeometry(0.88, 24), std(RAIN ? "#3a3026" : "#5a4630", { roughness: 1 })); earth.rotation.x = -Math.PI / 2; earth.position.set(tp.x, 0.025, tp.z); earth.receiveShadow = true; earth.userData.solid = false; add(earth);
    }
    // the street's trees along the far pavement and down the near side beyond the terrace
    const ft = [[-26, "gold"], [-19, "orange"], [-11, "red"], [-4, "gold"], [3.5, "orange"], [12, "red"], [20, "gold"]];
    for (const [fx, tn] of ft) maple(fx + (rT() - 0.5) * 2, 10.3 + rT() * 0.3, 8 + rT() * 3, tn, { tones: [tn, "mix", tn], trunk: 0.5, R: 3.0 + rT() * 0.7, r: 0.14, branches: 5, y0: 0.05 });
    maple(-16, 1.7, 9, "gold", { tones: ["gold", "orange"], trunk: 0.45, R: 3.2, r: 0.15, branches: 5, y0: 0.05 });
    maple(9.5, 1.7, 9.5, "orange", { tones: ["orange", "red"], trunk: 0.45, R: 3.2, r: 0.15, branches: 5, y0: 0.05 });
    // ivy: dense clusters climbing the stone terrace's first house (left of the bakery), hanging at the corner, and a thin vine on the planks
    if (S.ivy !== false) {
      const IV = Buf(), iv = RAIN ? ["#6a6a3a", "#8a5a30", "#5a7a3a", "#7a4a2c", "#4a6a38"] : ["#c8301c", "#d9461c", "#e8751e", "#f0b21e", "#a8221a", "#f6cc3a", "#6f9a3a"], rI = rng(seed * 211 + 9), kI = RAIN ? 0.5 : 1.3;
      const g3 = () => (rI() + rI() + rI() - 1.5) / 1.5;
      const cluster = (cx, cy, rx, ry, n, z = WZ, size = 1) => {
        for (let i = 0; i < Math.round(n * kI); i++) {
          const x = cx + g3() * rx, y = Math.max(0.08, cy + g3() * ry), nrm = new THREE.Vector3((rI() - 0.5) * 0.5, (rI() - 0.5) * 0.4, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = (0.14 + rI() * 0.1) * size;
          addCard(IV, x, y, z + 0.03 + rI() * 0.1, a, b, sz, sz, nrm, tint(iv[Math.floor(rI() * iv.length)], rI, 0.012, 0.07, 0.08));
        }
      };
      cluster(-2.75, 2.2, 0.45, 1.6, 520, WZ - 0.12); cluster(-3.2, 3.8, 0.7, 1.2, 320, WZ - 0.12); cluster(-2.55, 0.5, 0.3, 0.5, 120, WZ - 0.12); cluster(-3.5, 1.2, 0.5, 0.9, 180, WZ - 0.12);
      cluster(-4.3, 5.0, 0.8, 1.0, 160, WZ - 0.12); cluster(-6.2, 4.6, 0.5, 0.9, 70, WZ - 0.12);
      cluster(-2.3, 1.9, 0.14, 1.9, 380, WZ + 0.05); cluster(-2.55, 3.4, 0.45, 0.7, 240, WZ + 0.05); cluster(-2.9, 5.6, 0.45, 1.5, 320, WZ - 0.12); cluster(-2.45, 0.55, 0.4, 0.5, 200, WZ - 0.1);   // up the column beside the shop and round the tub
      if (RAIN) for (let i = 0; i < 70; i++) { const y = 0.9 + (i / 70) * 1.6, x = -1.45 + Math.sin(i * 0.5) * 0.12 + g3() * 0.07, nrm = new THREE.Vector3(0.1, 0, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28); addCard(IV, x, y, WZ + 0.08, a, b, 0.11, 0.11, nrm, tint("#4a6a38", rI)); }
      add(bufMesh(IV, ivyMat, true, false));
    }
  }
  {
    const wm = mergedGeo(treeWood, std(RAIN ? "#4a4048" : "#5a4034", { roughness: 0.95 }), !RAIN); if (wm) { wm.name = "set-trunks"; add(wm); }
    const lm = bufMesh(leafQ, leafMat, !RAIN, true); if (lm) { lm.frustumCulled = false; lm.name = "set-leaves"; add(lm); }
    const cm = bufMesh(coreQ, coreMat, false, true); if (cm) { cm.frustumCulled = false; add(cm); }
  }

  // ---------------------------------------------------------------- the far street card (rain): plates/painted/BK-R.webp, the street, its lamps and houses
  if (RAIN && S.backdrop !== false) {
    const SX = 0, SY = 0, SW = 590, SH = 520, CWm = 24, CHm = CWm * SH / SW, xC = -47, zC = 5;
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: "#d8dce6" }); mat.userData.noOutline = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CWm, CHm), mat); mesh.name = "set-backdrop"; mesh.userData.solid = false; mesh.frustumCulled = false; mesh.renderOrder = -1;
    mesh.position.set(xC, CHm * 0.46, zC); mesh.rotation.y = Math.PI / 2; add(mesh);   // the painting's horizon (row ~500 of 520) sits at y 0
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/BK-R.webp").then((img) => {
      const [c, g] = canvas(SW * 2, SH * 2); g.imageSmoothingQuality = "high"; g.drawImage(img, SX, SY, SW, SH, 0, 0, SW * 2, SH * 2);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4, ex = Math.min(1, Math.min(x, c.width - 1 - x) / 120), ey = Math.min(1, y / 260), eb = Math.min(1, (c.height - 1 - y) / 8);
        d[i + 3] = Math.round(255 * ex * ex * (3 - 2 * ex) * ey * ey * (3 - 2 * ey) * eb);
      }
      g.putImageData(id, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true;
    }));
  }

  // ---------------------------------------------------------------- fallen leaves (decals) and leaves drifting down
  {
    const LD = Buf(), nF = Math.round((RAIN ? 380 : 900) * (S.fallen ?? 1)), cols = RAIN ? ["#a8682e", "#8a4a30", "#b8883a", "#7a4a2c"] : ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a"], flat = new THREE.Vector3(0, 1, 0);
    const g2 = () => (rG() + rG() + rG() - 1.5) / 1.5, piles = [];
    for (let k = 0; k < 14; k++) piles.push([-12 + rG() * 20, WZ + 0.05 + rG() * 0.35, 0, 0.9]);
    for (let k = 0; k < 16; k++) piles.push([-12 + rG() * 22, A.pavementZ[1] - 0.15 - rG() * 0.4, 0, 1.0]);
    for (let k = 0; k < 8; k++) piles.push([-12 + rG() * 22, A.roadZ[0] + 0.1 + rG() * 0.4, 1, 0.9]);
    piles.push([A.tub.x + 0.2, A.tub.z + 0.6, 0, 0.5], [A.tub.x + 0.1, A.tub.z + 0.7, 0, 0.4], [A.tree.x, A.tree.z, 0, 0.55], [A.tree.x + 0.4, A.tree.z + 0.4, 0, 0.5]);
    for (let i = 0; i < nF; i++) {
      const pl = i < nF * 0.78 ? piles[Math.floor(rG() * piles.length)] : null, onRoad = pl ? pl[2] === 1 : rG() > 0.85;
      const x = pl ? pl[0] + g2() * 1.1 * pl[3] : -12 + rG() * 26, z = pl ? pl[1] + g2() * 0.28 : onRoad ? A.roadZ[0] + 0.1 + rG() * 2.4 : WZ + 0.1 + rG() * 3.1;
      const y = (onRoad ? A.roadY : 0) + 0.006 + rG() * 0.004;
      if (!onRoad && z > A.pavementZ[1] - 0.02) continue; if (!onRoad && z < WZ + 0.03) continue;
      const [a, b] = frameOf(flat, rG() * 6.28), s = 0.1 + rG() * 0.08;
      addCard(LD, x, y, z, a, b, s, s, flat, tint(cols[Math.floor(rG() * cols.length)], rG, 0.014, 0.08, 0.08));
    }
    const lm = bufMesh(LD, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); if (lm) { lm.userData.solid = false; add(lm); }
    const nD = S.leaves ?? (RAIN ? 0 : 24), geo = new THREE.PlaneGeometry(0.15, 0.15), drift = [], dm = cols.map((c) => lam(new THREE.Color(c), { map: mapleT, alphaTest: 0.5, side: THREE.DoubleSide }));
    for (let i = 0; i < nD; i++) {
      const o = new THREE.Mesh(geo, dm[i % dm.length]); o.castShadow = true; o.userData.solid = false; set.add(o);
      drift.push({ o, T: 8 + (i * 7 % 6) + (i % 3), ph: (i * 0.6180339) % 1, x0: -8 + 14 * ((i * 0.381966) % 1), z0: -0.2 + 6.5 * ((i * 0.7548776) % 1), sw: 0.7 + (i % 4) * 0.35, sp: 1.2 + (i % 5) * 0.5 });
    }
    const tick = (t) => { for (const d of drift) { const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28; d.o.position.set(d.x0 + 2.2 * u + d.sw * Math.sin(ang), 7.4 * (1 - u) + 0.04, d.z0 + 0.6 * Math.cos(ang * 0.8)); d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8); } };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }
  void grassDummy; void solids;
  return set;
}
