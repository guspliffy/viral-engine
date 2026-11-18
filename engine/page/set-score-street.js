import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scorestreet": Mash's street on moving day, an autumn morning, for "I could see everyone's happiness score" (Happiness 03).
// REAL 3D geometry with hand-painted canvas textures (the painting plates/painted/ST.webp is only the look target):
// a 15 m stone house front (Mash's house: arched green door in a dressed-stone frame, ONE stone step, sash windows with
// white frames, curtains and flower boxes, a balcony, a drainpipe, ivy), its neighbours, a flagstone pavement, a granite
// kerb, a cobbled road, autumn maples (3D trunks and branches, thousands of painted maple-leaf cards), shrubs, a
// streetlamp, an iron railing, fallen leaves, leaves drifting, a terrace of houses across the road, and where the street
// bends right: grass banks, a low 3D foothill with the road, fence and round maples, and behind it the painted far hill (pines, two farmhouses) as one card cut from plates/painted/ST.webp. Sky: a painted dome.
//
// COORDINATES (metres, y up). The street runs along +x; the camera of a normal shot looks from +z (the road side) at the
// house, or from the left along the pavement (the painting's view). The stage is the pavement in front of the step.
//   house front plane      z -0.95 (faces +z), door centre x 0 (opening 1.0 wide, 1.95 tall + a round fanlight)
//   the step               x -0.85..0.85, z -0.95..-0.40, TOP y 0.22 (one stone step; a potato sits on it, feet on the pavement)
//   pavement (stone flags) z -0.95 .. 2.35 at y 0 (3.3 m wide), runs x -40 .. 52 (bends right after x 13)
//   kerb                   z 2.35 .. 2.57, top y 0.01; its face drops 0.15 to the road
//   road (cobbles)         z 2.57 .. 9.17 at y -0.15 (6.6 m wide: the boxvan parked at the kerb + a lane)
//   far kerb / pavement    z 9.17 .. 9.39 / 9.39 .. 12.1; the terrace across the road: front plane z 12.1, 9-10.5 m tall
//   lamp                   iron streetlamp at x 3.2, z 2.0 (3.5 m);  street maple at x 6.0, z 1.95 (crown 4..9.5 m: its
//                          leaf shadows dapple the wall and pavement when the key light comes from +x, +z)
//   Mash's house x -8..7.6 (balcony at x -1.9..1.9, y 3.55; drainpipe x 7.55); neighbour x 7.6..11.2 (set back); annex 11.2..14.6.
// STREET (exported) has the numbers a storyboard needs: stepTop, the door and the frontdoor prop's place, the van's place.
//
// spec (every key optional):
//   seed 5            the painted textures and the layout of leaves, flowers and ivy
//   door true         draw the closed green panel door (set geometry). false: leave the doorway open on a dim warm hall
//                     (floor at the step top) so the 3D `frontdoor` prop (props-package.js) can be placed in it:
//                     { kind "frontdoor", x -0.5 (its hinge: left edge), y STEP_TOP 0.22, z -1.08, w 1.0, h 1.9, color "#2f5d3a" }
//   wind 1            leaves shiver (0 off)
//   leaves 32         how many leaves drift down past the camera (0 none)
//   hill true         the bend, the foothill, its road, fence and maples, and the painted far hill (false: the street just ends in a bank)
//   backdrop true     the painted far-hill card (false: leave it out); it needs plates/painted/ST.webp served from the repo root
//   trees true        the maples, shrubs and ivy
//   fallen 1          fallen leaves on pavement and road, a multiplier (0 none)
// Light: set "light": "golden", a key like [6.5, 3.4, 3.0] (morning sun from the right, long soft shadows) and
// "shadowSize": 9 (looks.js: half the shadow map in metres, centred on the origin). Nothing here is solid for the checks
// except the house fronts, the step, the kerb, the pavement and the trunks; the sky, hill and far trees are scenery.
// Triangles: about 160k (leaf cards 70 %); every part is merged by material, so a draft still takes a few seconds.
//
// Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks) only.

export const STREET = {
  wallZ: -0.95, wallT: 0.42, doorX: 0, doorW: 1.0, doorH: 1.95, fanR: 0.5,
  stepTop: 0.22, stepX: [-0.85, 0.85], stepZ: [-0.95, -0.4],
  pavementZ: [-0.95, 2.35], kerbZ: [2.35, 2.57], roadZ: [2.57, 9.17], roadY: -0.15, farKerbZ: [9.17, 9.39], farPavZ: [9.39, 12.1], farFrontZ: 12.1,
  frontdoor: { kind: "frontdoor", x: -0.5, y: 0.22, z: -1.08, w: 1.0, h: 1.9, color: "#2f5d3a" },
  // a boxvan parked at the kerb facing +x (rot 90) or -x (rot -90): its side 0.07 m from the kerb face
  van: { x: 1.5, y: STREET_ROAD_Y(), z: 3.7, rotPlusX: 90, rotMinusX: -90 },
  lamp: { x: 3.2, z: 2.0 }, tree: { x: 6.0, z: 1.95 },
};
function STREET_ROAD_Y() { return -0.15; }

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
function flagCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), ppm = S / 6;
  g.fillStyle = "#6d6157"; g.fillRect(0, 0, S, S);
  const pal = ["#c9ad94", "#bea48e", "#d1b69c", "#b5a090", "#c4ae9c", "#cfb8a0", "#b9a294"];
  let y = 0;
  for (const rh of fitRun(rnd, S, 0.42 * ppm, 0.85 * ppm)) {
    let x = 0;
    for (const w of fitRun(rnd, S, 0.8 * ppm, 1.8 * ppm)) {
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.95 + rnd() * 0.1;
      g.fillStyle = shade(base, k); g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, rh - 8, 14); g.fill();
      for (let i = 0; i < 18; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(90,70,60,${0.05 + rnd() * 0.08})` : `rgba(255,236,214,${0.06 + rnd() * 0.1})`; g.beginPath(); g.ellipse(x + rnd() * w, y + rnd() * rh, 16 + rnd() * w * 0.16, 8 + rnd() * rh * 0.2, rnd() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(80,64,54,${0.12 + rnd() * 0.18})`; g.beginPath(); g.arc(x + 8 + rnd() * (w - 16), y + 8 + rnd() * (rh - 16), 1 + rnd() * 2.2, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,240,222,0.32)"; g.fillRect(x + 8, y + 5, w - 16, 3); g.fillRect(x + 5, y + 8, 3, rh - 16);
      g.fillStyle = "rgba(52,40,34,0.34)"; g.fillRect(x + 8, y + rh - 8, w - 16, 3); g.fillRect(x + w - 8, y + 8, 3, rh - 16);
      if (rnd() < 0.3) { g.strokeStyle = "rgba(60,48,40,0.35)"; g.lineWidth = 1.5; g.beginPath(); let px = x + rnd() * w, py = y + 6; g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * 40; py += rh / 4.5; g.lineTo(px, py); } g.stroke(); }
      if (rnd() < 0.5) for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(104,138,56,${0.35 + rnd() * 0.3})`; g.beginPath(); g.ellipse(x + rnd() * w, y + 1 + rnd() * 3, 5 + rnd() * 12, 2 + rnd() * 3, 0, 0, 7); g.fill(); }
      x += w;
    }
    y += rh;
  }
  return c;
}
// purple-grey setts in staggered courses, a dark joint, a lit top. 3 m square.
function cobbleCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), NR = 28, NC = 24, rh = S / NR, cw = S / NC;
  g.fillStyle = "#4e4856"; g.fillRect(0, 0, S, S);
  const pal = ["#a39aa6", "#948c9c", "#b2a8aa", "#857f90", "#bcaea6", "#9a929a", "#c4b4a8", "#8f8898"];
  for (let r = 0; r < NR; r++) for (let q = -1; q <= NC; q++) {
    const off = (r % 2) * cw / 2, x = q * cw + off + (rnd() - 0.5) * 6, y = r * rh + (rnd() - 0.5) * 5, w = cw * (0.84 + rnd() * 0.1), h = rh * (0.84 + rnd() * 0.1);
    const base = pal[Math.floor(rnd() * pal.length)], k = 0.92 + rnd() * 0.16;
    for (const ox of [0, -S, S]) {
      const gx = x + ox; if (gx < -w || gx > S + w) continue;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(base, k * 1.12)); gr.addColorStop(1, shade(base, k * 0.86));
      g.fillStyle = gr; g.beginPath(); g.roundRect(gx + 4, y + 4, w - 4, h - 4, 18); g.fill();
      g.fillStyle = "rgba(255,246,236,0.18)"; g.beginPath(); g.ellipse(gx + w * 0.42, y + h * 0.3, w * 0.28, h * 0.16, 0, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(40,36,52,${0.1 + rnd() * 0.14})`; g.beginPath(); g.arc(gx + 10 + rnd() * (w - 16), y + 10 + rnd() * (h - 16), 1 + rnd() * 2.4, 0, 7); g.fill(); }
    }
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
// smooth rendered walls for the terrace across the road: a warm pastel, trowel mottling, damp stains low down
function plasterCanvas(rnd, base, S = 512) {
  const [c, g] = canvas(S, S);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 140; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(120,96,70,${0.03 + rnd() * 0.05})` : `rgba(255,250,236,${0.05 + rnd() * 0.07})`; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 14 + rnd() * 50, 8 + rnd() * 24, rnd() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,50,${0.06 + rnd() * 0.1})`; g.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  return c;
}
function dressedCanvas(rnd, S = 512) {   // the smooth warm sandstone of quoins, lintels and sills: a touch lighter than the walls
  const [c, g] = canvas(S, S);
  g.fillStyle = "#c2a370"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 30 + rnd() * 90, tc = rnd() < 0.5 ? "140,104,60" : "255,244,212", rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc},${0.08 + rnd() * 0.1})`); rg.addColorStop(1, `rgba(${tc},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(80,60,40,${0.1 + rnd() * 0.18})`; g.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
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
// a sash window's glass: the autumn trees across the road reflected, sky above, a dim room below
function glassCanvas(rnd, k) {
  const W = 128, H = 192, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#4f7fae"); gr.addColorStop(0.4, "#2a3b52"); gr.addColorStop(1, "#171a22"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(190,220,245,0.32)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 30); g.lineTo(0, 60); g.fill();   // sky in the top
  for (let i = 0; i < 7; i++) { g.fillStyle = ["#e0701f", "#d9a21f", "#c43a1c"][i % 3]; g.globalAlpha = 0.3 + rnd() * 0.25; g.beginPath(); g.arc(8 + rnd() * (W - 16), 24 + rnd() * 70, 5 + rnd() * 9, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  if (k % 2) { g.fillStyle = "rgba(255,200,130,0.16)"; g.fillRect(0, H * 0.62, W, H * 0.38); }   // a lamp-lit room behind
  g.fillStyle = "rgba(255,255,255,0.2)"; g.beginPath(); g.moveTo(14, 0); g.lineTo(52, 0); g.lineTo(8, H); g.lineTo(0, H); g.lineTo(0, 120); g.fill();
  g.fillStyle = "rgba(255,255,255,0.1)"; g.beginPath(); g.moveTo(70, 0); g.lineTo(84, 0); g.lineTo(36, H); g.lineTo(22, H); g.fill();
  return c;
}
function curtainCanvas(rnd, col) {
  const [c, g] = canvas(64, 128);
  g.fillStyle = col; g.fillRect(0, 0, 64, 128);
  for (let x = 0; x < 64; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.22)"); g.fillStyle = gr; g.fillRect(x, 0, 8, 128); }
  return c;
}
// the sky all round: equirect, u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z (three's sphere). Morning blue to a pale warm
// horizon, soft cumulus, and layers of far blue-green woods and hills along the horizon.
function skyCanvas(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#4f93d6"); gr.addColorStop(0.5, "#86bce6"); gr.addColorStop(0.9, "#cfe4ee"); gr.addColorStop(1, "#f1ead2");
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2);
  g.fillStyle = "#8a9a62"; g.fillRect(0, hz, W, hz);
  const puff = (cx, cy, r, sx) => {
    for (const ox of [-W, 0, W]) { const q = g.createRadialGradient(cx + ox - r * 0.25, cy - r * 0.3, r * 0.1, cx + ox, cy, r); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.7, "rgba(246,248,252,0.9)"); q.addColorStop(1, "rgba(236,242,250,0)"); g.fillStyle = q; g.beginPath(); g.ellipse(cx + ox, cy, r * sx, r, 0, 0, 7); g.fill(); }
  };
  for (let k = 0; k < 11; k++) {
    const u = (k + rnd() * 0.8) / 11 * W, base = hz - (30 + rnd() * 150), n = 8 + Math.floor(rnd() * 12), big = 0.5 + rnd();
    for (let i = 0; i < n; i++) puff(u + (rnd() - 0.5) * 150 * big, base - rnd() * 26 * big, (14 + rnd() * 26) * big, 1.5);
  }
  // far woods and hills just over the horizon, three layers, bluer and paler with distance
  const layers = [["#aebfa4", 34, 0.7], ["#8fa88c", 24, 1.2], ["#6f9168", 14, 2.0]];
  layers.forEach(([col, hgt, f], li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 4) {
      const h = hgt * (0.55 + 0.45 * Math.sin(x * 0.006 * f + li * 2) * Math.sin(x * 0.0023 + li)) + (hash2(Math.floor(x / 5), li, 3) - 0.5) * 7 * (li + 1) * 0.5;
      g.lineTo(x, hz - Math.max(2, h));
    }
    g.lineTo(W, hz + 4); g.fill();
  });
  const hg = g.createLinearGradient(0, hz - 24, 0, hz + 10); hg.addColorStop(0, "rgba(241,234,210,0)"); hg.addColorStop(0.7, "rgba(241,234,210,0.55)"); hg.addColorStop(1, "rgba(241,234,210,0)"); g.fillStyle = hg; g.fillRect(0, hz - 24, W, 34);
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

// a ribbon along the street's centreline: s samples x lateral offsets q, y from yFn, vertex colour from colFn
function ribbon(F, ss, qs, yFn, uvK, colFn) {
  const B = Buf(), nq = qs.length;
  ss.forEach((s, si) => {
    const f = F.at(s);
    qs.forEach((q) => {
      B.p.push(f.x + q * f.nx, yFn(s, q), f.z + q * f.nz); B.n.push(0, 1, 0); B.uv.push(s / uvK, q / uvK);
      const k = colFn ? colFn(s, q) : 1; B.c.push(k, k, k);
    });
    if (si) for (let j = 0; j < nq - 1; j++) { const a = (si - 1) * nq + j, b = a + 1, c = si * nq + j, d = c + 1; B.i.push(a, b, c, b, d, c); }
  });
  return B;
}
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

// ================================================================================================================ the street's line
// The centreline runs along the house front (q 0 = the wall line): straight along +x to S0, then it bends right (toward +z)
// and winds up the hill. P(s, q) = C(s) + q * n(s), n the right-hand normal (+z on the straight).
const S0 = 13, BEND_R = 13, S_MIN = -42, S_MAX = 170;
// the big rounded hill ahead (the painting's top right): height above the street's level at a world point
const HILL_C = [92, 2], HILL_R = 54, HILL_AMP = 10;   // a low foothill: the painted hill rises behind it (the backdrop card)
const hillShape = (x, z) => { const d = Math.hypot(x - HILL_C[0], (z - HILL_C[1]) * 0.85) / HILL_R; return d >= 1 ? 0 : HILL_AMP * smooth(1 - d) ** 1.1; };
function makeFrame(hill = true) {
  const N = Math.round((S_MAX - S_MIN) / 0.25) + 1, xs = new Float64Array(N), zs = new Float64Array(N), th = new Float64Array(N);
  const S1 = S0 + BEND_R * 0.3;
  const theta = (s) => (s <= S0 ? 0 : s <= S1 ? (s - S0) / BEND_R : 0.3 - 0.3 * smooth((s - S1) / 15) + 0.5 * Math.sin((s - S1) / 12) * smooth((s - S1) / 30));
  let x = S_MIN, z = STREET.wallZ;
  for (let i = 0; i < N; i++) { const s = S_MIN + i * 0.25, t = theta(s); xs[i] = x; zs[i] = z; th[i] = t; x += Math.cos(t) * 0.25; z += Math.sin(t) * 0.25; }
  const posAt = (s) => { const k = Math.min(N - 1.001, Math.max(0, (s - S_MIN) / 0.25)), i = Math.floor(k), f = k - i; return [xs[i] + (xs[i + 1] - xs[i]) * f, zs[i] + (zs[i + 1] - zs[i]) * f, i, f]; };
  const yRef = (s) => { if (!hill) return 0; const [x, z] = posAt(s); return hillShape(x, z); };   // the road climbs the hill it winds up
  const at = (s) => {
    const [x, z, i, f] = posAt(s), t = th[i] + (th[i + 1] - th[i]) * f;
    return { x, z, th: t, nx: -Math.sin(t), nz: Math.cos(t), tx: Math.cos(t), tz: Math.sin(t), y: yRef(s) };
  };
  // nearest sample: s and the lateral offset q of a world point
  const step = 8, nS = Math.floor(N / step);
  const near = (px, pz) => {
    let best = 1e9, bi = 0;
    for (let k = 0; k < nS; k++) { const i = k * step, d = (xs[i] - px) ** 2 + (zs[i] - pz) ** 2; if (d < best) { best = d; bi = i; } }
    for (let i = Math.max(0, bi - step); i <= Math.min(N - 1, bi + step); i++) { const d = (xs[i] - px) ** 2 + (zs[i] - pz) ** 2; if (d < best) { best = d; bi = i; } }
    const t = th[bi], s = S_MIN + bi * 0.25, dx = px - xs[bi], dz = pz - zs[bi];
    return { s: s + dx * Math.cos(t) + dz * Math.sin(t), q: -dx * Math.sin(t) + dz * Math.cos(t) };
  };
  return { at, near, yRef, theta, S1 };
}

// ================================================================================================================ the set
export function buildScoreStreet(scene, S = {}) {
  const seed = S.seed ?? 5, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scorestreet"; scene.add(set);
  const A = STREET, F = makeFrame(S.hill !== false), wind = S.wind ?? 1;
  scene.background = new THREE.Color("#a8cfe8"); scene.fog = null;
  const add = (o) => { if (o) set.add(o); return o; };
  const rW = rng(seed * 31 + 1), rT = rng(seed * 57 + 2), rF = rng(seed * 91 + 3), rG = rng(seed * 113 + 4);

  // ---------------------------------------------------------------- materials and painted textures
  const WARM = new THREE.Color("#2c1d0e");
  const stoneT = ctex(stoneCanvas(rnd, 2048, "#6b5a42", null, 3.2)), stoneT2 = ctex(stoneCanvas(rnd, 2048, "#62523c", null, 3.2));   // the facades set their own uv (metres / 3.2)
  const flagT = ctex(flagCanvas(rnd)), cobT = ctex(cobbleCanvas(rnd)), grassT = ctex(grassCanvas(rnd));
  const slateM = std("#ffffff", { map: ctex(slateCanvas(rnd)), roughness: 0.7 }), dressedT = ctex(dressedCanvas(rnd));
  const dressedM = std("#ffffff", { map: dressedT, vertexColors: true, emissive: new THREE.Color("#4a3a22") }), white = std("#f3efe4", { roughness: 0.55, vertexColors: true });
  const stoneBoxM = std("#ffffff", { map: stoneT, vertexColors: true });
  const iron = std("#25262d", { roughness: 0.5, metalness: 0.35 }), woodM = std("#5a4034", { roughness: 0.9, vertexColors: true });
  const mapleT = ctex(mapleCanvas(), 1, 1, false), daisyT = ctex(daisyCanvas(), 1, 1, false);
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#4a2308") });
  if (wind) leafMat.userData.wind = { amp: 0.045 * wind, h: 0, flutter: 1.7 };
  const ivyMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const flowerMat = lam("#ffffff", { map: daisyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color("#4a2208") });

  // ---------------------------------------------------------------- far things first: sky dome, ground, terrain
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), basic({ map: ctex(skyCanvas(rnd), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sky.position.set(20, 0, 20); sky.renderOrder = -1000; sky.frustumCulled = false; sky.userData.solid = false; sky.name = "set-scorestreet-sky"; add(sky);
  const farGround = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), std("#7f9a4a", { map: grassT, roughness: 1 }));
  farGround.material.map = ctex(grassCanvas(rnd), 90, 90); farGround.rotation.x = -Math.PI / 2; farGround.position.set(20, -0.4, 20); farGround.receiveShadow = true; farGround.userData.solid = false; add(farGround);

  const HILL = S.hill !== false;
  const hillC = HILL_C;
  const bankAmp = (s) => smooth((s - S0 - 2) / 16);
  const terrainY = (x, z) => {
    const { s, q } = F.near(x, z), sc = Math.min(Math.max(s, S_MIN), S_MAX);
    const off = 0.36 - 0.3 * smooth((sc - S0 - 8) / 16), base = F.yRef(sc) - off;
    const cor = smooth((Math.abs(q - 6) - 7.5) / 9);
    if (!HILL) return base + cor * smooth((q < 0 ? -q : q - 12) / 6) * 0.8 * (sc > S0 ? 1 : 0);
    const gh = hillShape(x, z) - F.yRef(sc);   // the hill's flank beside the road, relative to the road's own height
    const bank = bankAmp(sc) * (2.0 + 2.6 * fbm(x * 0.05, z * 0.05, 7) + 0.5 * Math.max(0, Math.abs(q - 6) - 8) * 0.28) * (1 - smooth(hillShape(x, z) / 6));
    return base + cor * (bank + gh + 0.9 * fbm(x * 0.12, z * 0.12, 9) * bankAmp(sc));
  };
  // the terrain: a 2 m grid over the streets' surroundings, grass texture and vertex tints
  {
    const X0 = -64, X1 = 190, Z0 = -62, Z1 = 100, CS = 1.5, nx = Math.round((X1 - X0) / CS), nz = Math.round((Z1 - Z0) / CS);
    const B = Buf(), col = new THREE.Color();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + i * CS, z = Z0 + j * CS, edge = Math.min(i, nx - i, j, nz - j), y = terrainY(x, z) * smooth(edge / 6) + (-0.38) * (1 - smooth(edge / 6));
      B.p.push(x, y, z); B.n.push(0, 1, 0); B.uv.push(x / 11, z / 11);
      const n = fbm(x * 0.08, z * 0.08, 3), au = fbm(x * 0.04 + 5, z * 0.04, 5);
      const hh = Math.max(0, y), band = 0.5 + 0.5 * Math.sin(hh * 0.9 + fbm(x * 0.05, z * 0.05, 15) * 9);   // light and shade bands up the slope
      col.set("#ffffff").lerp(new THREE.Color("#e8d070"), smooth((au - 0.5) * 3) * 0.55).lerp(new THREE.Color("#f2c660"), smooth(hh / 12) * 0.7).multiplyScalar((0.8 + n * 0.28) * (0.8 + 0.4 * band));
      B.c.push(col.r, col.g, col.b);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; B.i.push(a, c, b, b, c, d); }
    const m = bufMesh(B, std("#ffffff", { map: grassT, vertexColors: true, roughness: 1, emissive: new THREE.Color("#4a3a14") }), false, true); m.geometry.computeVertexNormals(); m.name = "set-scorestreet-terrain"; m.userData.solid = false; add(m);
  }

  // ---------------------------------------------------------------- ground surfaces: pavement, kerb, road
  const ssA = [], ssB = [];
  for (let s = S_MIN; s < S0 - 2; s += 3) ssA.push(s);
  for (let s = S0 - 2; s < S0 + 18; s += 0.75) ssA.push(s);
  for (let s = S0 + 18; s <= 132; s += 1.5) ssA.push(s);
  for (let s = 132; s <= S_MAX; s += 4) ssA.push(s);
  const pavEnd = S0 + 34, roadEnd = HILL ? 99 : S0 + 12;
  const ssP = ssA.filter((s) => s <= pavEnd), ssR = ssA.filter((s) => s <= roadEnd);
  const qline = (a, b, st) => { const r = []; for (let q = a; q < b - 1e-6; q += st) r.push(q); r.push(b); return r; };
  const gut = (s, q) => 1 - 0.06 * smooth((q - 3.2) / 0.3) * 0;
  const flagK = (s, q) => (0.9 + 0.2 * fbm(s * 0.5, q * 0.5, 11)) * (1 - 0.18 * smooth((0.5 - q) / 0.5));
  const pav = bufMesh(ribbon(F, ssP, qline(0, 3.4, 0.85), (s) => F.yRef(s), 6, flagK), std("#ffffff", { map: flagT, vertexColors: true, emissive: new THREE.Color("#3a2614") }), false, true);
  pav.name = "set-floor"; add(pav);
  const cobK = (s, q) => (0.88 + 0.26 * fbm(s * 0.35 + 4, q * 0.35, 13)) * (1 - 0.2 * smooth((4.6 - q) / 1.1) * 0.8);
  const road = bufMesh(ribbon(F, ssR, qline(3.5, 10.2, 0.85), (s) => F.yRef(s) + STREET.roadY, 3, cobK), std("#ffffff", { map: cobT, vertexColors: true, emissive: new THREE.Color("#2e2428") }), false, true);
  road.name = "set-floor-road"; add(road);
  // far pavement (the terrace's side): to the end of the terrace, then the bank
  const ssF = ssA.filter((s) => s <= S0 + 4);
  add(bufMesh(ribbon(F, ssF, [10.2, 10.38, 13.0], (s, q) => F.yRef(s) + (q < 10.3 ? STREET.roadY : 0), 6, flagK), std("#ffffff", { map: flagT, vertexColors: true }), false, true));
  // kerb blocks (both sides) and the near step
  {
    const KB = Buf(), rK = rng(seed * 3 + 5);
    const kerb = (q0, ss, send) => {
      let s = S_MIN;
      while (s < send) {
        const L = 0.75 + rK() * 0.75, f = F.at(s + L / 2), yy = F.yRef(s + L / 2), col = new THREE.Color().setScalar(0.9 + rK() * 0.16);
        addBox(KB, f.x + f.nx * (q0 + 0.11), yy - 0.07, f.z + f.nz * (q0 + 0.11), L - 0.012, 0.16, 0.22, col, -f.th + (rK() - 0.5) * 0.01, 0, 1.0);
        s += L;
      }
    };
    kerb(A.kerbZ[0] - A.wallZ, 0, S0 + 34); kerb(A.farKerbZ[0] - A.wallZ, 0, S0 + 4);
    const km = bufMesh(KB, std("#ffffff", { map: ctex(stoneCanvas(rnd, 1024, "#6b6258", ["#c6baa8", "#b8ad9d", "#d0c4b0", "#aaa396", "#bfb4a2"]), 1 / 4.8, 1 / 4.8), vertexColors: true, emissive: new THREE.Color("#30241a") })); km.name = "set-kerb"; add(km);
    // the step: one block of stone in front of the door
    const SB = Buf(); addBox(SB, 0, A.stepTop / 2, (A.stepZ[0] + A.stepZ[1]) / 2, A.stepX[1] - A.stepX[0], A.stepTop, A.stepZ[1] - A.stepZ[0], WHITE, 0, 0, 1.2);
    // a worn lip and a stone below it
    const sm = bufMesh(SB, std("#ffffff", { map: ctex(stoneCanvas(rnd, 1024, "#7a6c58", ["#d2c3a6", "#c4b698", "#dccdb0", "#bdae94"]), 1 / 2.4, 1 / 2.4), vertexColors: true })); sm.name = "set-step"; add(sm);
  }
  // road gutter dirt and tyre-worn lanes: soft dark strips (decals)
  {
    const dm = new THREE.MeshBasicMaterial({ color: "#3a3446", transparent: true, opacity: 0.2, depthWrite: false, fog: false }); dm.userData.noOutline = true;
    const D = ribbon(F, ssR.filter((s) => s < S0 + 4), [3.55, 3.75, 4.2], (s) => F.yRef(s) + STREET.roadY + 0.004, 1, null);
    D.c = D.c.map(() => 1); const m = bufMesh(D, dm, false, false); m.renderOrder = 1; add(m);
  }

  // ---------------------------------------------------------------- facades (real extruded walls with real openings)
  const solids = [];
  const streakQ = Buf(), dressed = Buf(), whiteB = Buf(), ironB = Buf(), glassBufs = [Buf(), Buf(), Buf(), Buf()], curtB = {}, boxB = Buf();
  const pale = (k = 0) => { const v = 0.9 + rW() * 0.16 + k, w = rW() - 0.5; return new THREE.Color(v * (1 + 0.06 * w), v * (1 - 0.01 * w), v * (1 - 0.1 * w)); };
  const glassMats = glassBufs.map((_, k) => basic({ map: ctex(glassCanvas(rW, k), 1, 1, false), color: "#f4f4f4" }));
  const curtCols = ["#f1e6d2", "#e9dcc4", "#c9a8a0", "#9db39a", "#efe9dc"];
  const curtMats = curtCols.map((c) => lam("#ffffff", { map: ctex(curtainCanvas(rW, c), 1, 1, false), side: THREE.DoubleSide }));
  curtCols.forEach((_, k) => (curtB[k] = Buf()));
  // one wall: x0..x1, from y 0 (or baseY) to h, front plane z, thickness t; holes: [{x, y, w, h, arch}]
  function facade(o) {
    const { x0, x1, h, z, t = A.wallT, holes = [], map, baseY = 0, tone } = o;
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
    const m = new THREE.Mesh(g, map); m.castShadow = m.receiveShadow = true; add(m); solids.push(m); return m;
  }
  // a sash window in an opening: dressed surround (lintel, sill, jamb blocks), white frame with glazing bars, glass, curtains, an optional flower box
  function windowFor(x, y, w, h, z, o = {}) {
    const gk = Math.floor(rW() * 4), ck = Math.floor(rW() * 5), fz = z - 0.17;
    if (o.surround !== false) {
      addBox(dressed, x, y + h + 0.13, z + 0.04, w + 0.55, 0.26, 0.16, pale(), 0, 0, 1.2);   // lintel
      addBox(dressed, x, y - 0.05, z + 0.13, w + 0.4, 0.12, 0.36, pale(), 0, 0, 1.2);        // sill
      for (let k = 0; k < Math.floor(h / 0.26); k++) for (const sd of [-1, 1]) { const ww = k % 2 ? 0.17 : 0.3; addBox(dressed, x + sd * (w / 2 + ww / 2 - 0.02), y + 0.13 + k * 0.26, z + 0.025, ww, 0.245, 0.04, pale(), 0, 0, 1.2); }
      addBox(dressed, x, y + h + 0.3, z + 0.045, 0.26, 0.2, 0.17, pale(), 0, 0, 1.2);        // keystone
    }
    // frame, meeting rail, bars
    const T = 0.06, fw = w - 0.04, fh = h - 0.02;
    addBox(whiteB, x, y + 0.03, fz, fw, T, 0.08, WHITE); addBox(whiteB, x, y + h - 0.02, fz, fw, T, 0.08, WHITE);
    addBox(whiteB, x - fw / 2 + T / 2, y + h / 2, fz, T, fh, 0.08, WHITE); addBox(whiteB, x + fw / 2 - T / 2, y + h / 2, fz, T, fh, 0.08, WHITE);
    addBox(whiteB, x, y + h * 0.5, fz + 0.015, fw, 0.06, 0.1, WHITE);
    for (let c = 1; c < 3; c++) addBox(whiteB, x - fw / 2 + (fw * c) / 3, y + h / 2, fz, 0.025, fh, 0.05, WHITE);
    for (const r of [0.2, 0.35, 0.65, 0.8]) addBox(whiteB, x, y + h * r, fz, fw, 0.022, 0.05, WHITE);
    // glass
    addCard(glassBufs[gk], x, y + h / 2, z - 0.22, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), w - 0.06, h - 0.06, new THREE.Vector3(0, 0, 1), WHITE);
    // curtains: a gathered panel each side, a pelmet
    const cw = (w - 0.1) * (0.24 + rW() * 0.1);
    for (const sd of [-1, 1]) addCard(curtB[ck], x + sd * (w / 2 - cw / 2 - 0.04), y + h / 2 - 0.02, z - 0.205, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), cw, h - 0.14, new THREE.Vector3(0, 0, 1), WHITE);
    if (o.surround !== false && y > 0.5) { const sk = new THREE.Vector3(1, 0, 0), sv = new THREE.Vector3(0, 1, 0), n0 = new THREE.Vector3(0, 0, 1), sh = 0.7 + rW() * 0.8; addCard(streakQ, x - w * 0.1 + (rW() - 0.5) * 0.2, y - 0.2 - sh / 2, z + 0.006, sk, sv, w * 0.85, sh, n0, WHITE); }   // weathering under the sill
    if (o.box) flowerBox(x, y - 0.04, w, z + 0.28);
  }
  // a window box: white timber, soil, green leaves, daisies in red, orange and yellow, some trailing down
  const flowerQ = Buf(), boxLeafQ = Buf();
  function flowerBox(x, y, w, z) {
    addBox(whiteB, x, y - 0.07, z, w * 0.96, 0.18, 0.22, WHITE);
    const fl = ["#e9561c", "#f2a21f", "#f6d13a", "#d9331f", "#f4ecd8", "#f08a2a"], gl = ["#4f8a3a", "#6a9a3e", "#b9a32a", "#c96b1e", "#7aa43e"], n = Math.round(w * 130);
    for (let i = 0; i < n; i++) {
      const px = x + (rF() - 0.5) * w * 0.98, py = y + 0.04 + rF() * 0.34 * (1 - Math.abs((px - x) / w) * 0.5), pz = z + (rF() - 0.5) * 0.14 + 0.02;
      const nrm = new THREE.Vector3((rF() - 0.5) * 0.7, 0.5 + rF() * 0.5, 0.8).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
      addCard(boxLeafQ, px, py, pz, a, b, 0.11 + rF() * 0.08, 0.11 + rF() * 0.08, nrm, tint(gl[Math.floor(rF() * gl.length)], rF));
    }
    for (let i = 0; i < n * 0.6; i++) {
      const px = x + (rF() - 0.5) * w * 0.96, py = y + 0.12 + rF() * 0.3, pz = z + 0.08 + rF() * 0.07, nrm = new THREE.Vector3((rF() - 0.5) * 0.5, 0.2 + rF() * 0.3, 1).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
      addCard(flowerQ, px, py, pz, a, b, 0.11 + rF() * 0.07, 0.11 + rF() * 0.07, nrm, tint(fl[Math.floor(rF() * fl.length)], rF, 0.01, 0.05, 0.04));
    }
    for (let i = 0; i < Math.round(w * 9); i++) {   // a few leaves trailing over the front
      const px = x + (rF() - 0.5) * w * 0.9, nrm = new THREE.Vector3(0, 0.1, 1).normalize(), [a, b] = frameOf(nrm, rF() * 6.28);
      addCard(boxLeafQ, px, y - 0.12 - rF() * 0.3, z + 0.12, a, b, 0.13, 0.13, nrm, tint(rF() < 0.5 ? "#c96b1e" : "#8aa43a", rF));
    }
  }
  // the arched door opening: a dressed-stone frame with voussoirs and a keystone, the fanlight, the door
  function doorFor(z) {
    const r = A.fanR, H0 = A.stepTop + A.doorH, dz = z;
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI - (i / 12) * Math.PI, r0 = r + 0.01, r1 = r + 0.2 + (i % 2) * 0.04;
      addBox(dressed, A.doorX + Math.cos(a) * (r0 + r1) / 2, H0 + Math.sin(a) * (r0 + r1) / 2, dz + 0.03, r1 - r0, 0.17, 0.08, pale(), 0, a, 1.2);
    }
    addBox(dressed, A.doorX, H0 + r + 0.34, dz + 0.07, 0.34, 0.44, 0.18, pale(), 0, 0, 1.2);   // keystone
    for (let i = 0; i <= 16; i++) { const a = Math.PI - (i / 16) * Math.PI, r0 = r + 0.26, r1 = r0 + 0.2 + (i % 2) * 0.05; if (i === 8) continue; addBox(dressed, A.doorX + Math.cos(a) * (r0 + r1) / 2, H0 + Math.sin(a) * (r0 + r1) / 2, dz + 0.02, r1 - r0, 0.19, 0.05, pale(-0.03), 0, a, 1.2); }   // a second ring
    for (const sd of [-1, 1]) for (let k = 0; k < 8; k++) addBox(dressed, A.doorX + sd * (r + 0.36), A.stepTop + 0.14 + k * 0.26, dz + 0.017, k % 2 ? 0.2 : 0.32, 0.245, 0.024, pale(-0.03), 0, 0, 1.2);
    addBox(dressed, A.doorX, H0 + r + 0.74, dz + 0.1, 1.9, 0.12, 0.3, pale(), 0, 0, 1.2);   // a cornice over the arch
    for (const sd of [-1, 1]) for (let k = 0; k < 8; k++) { const w = k % 2 ? 0.17 : 0.3; addBox(dressed, A.doorX + sd * (r + 0.01 + w / 2), A.stepTop + 0.13 + k * 0.26, dz + 0.022, w, 0.245, 0.036, pale(), 0, 0, 1.2); }
    // the door and its fanlight
    if (S.door !== false) {
      const green = std("#2f5d3a", { roughness: 0.5 }), green2 = std("#264d31", { roughness: 0.55 }), brass = std("#d4a13c", { roughness: 0.25, metalness: 0.85 });
      const W = A.doorW - 0.02, Hh = A.doorH - 0.02, T = 0.05, dzz = z - 0.2, DB = Buf(), DR = Buf(), gc = new THREE.Color("#2f5d3a"), gc2 = new THREE.Color("#244a2e");
      addBox(DB, A.doorX, A.stepTop + Hh / 2, dzz, W, Hh, T, gc, 0, 0, 1);
      for (const [px, py, pw, ph] of [[0.27, 0.2, 0.34, 0.28], [0.73, 0.2, 0.34, 0.28], [0.27, 0.55, 0.34, 0.3], [0.73, 0.55, 0.34, 0.3], [0.27, 0.86, 0.34, 0.16], [0.73, 0.86, 0.34, 0.16]]) {
        addBox(DR, A.doorX - W / 2 + px * W, A.stepTop + py * Hh * 1.03, dzz + T / 2 + 0.008, pw * W + 0.03, ph * Hh + 0.03, 0.008, gc2, 0, 0, 1);
        addBox(DB, A.doorX - W / 2 + px * W, A.stepTop + py * Hh * 1.03, dzz + T / 2 + 0.014, pw * W, ph * Hh, 0.016, gc, 0, 0, 1);
      }
      const dm = bufMesh(DB, std("#ffffff", { roughness: 0.5, vertexColors: true })); add(dm); const dr = bufMesh(DR, std("#ffffff", { roughness: 0.6, vertexColors: true }), false); add(dr);
      // brass ring knocker, letterbox, knob
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 8, 22), brass); ring.position.set(A.doorX, A.stepTop + Hh * 0.62, dzz + T / 2 + 0.05); ring.castShadow = true; add(ring);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.016), brass); plate.position.set(A.doorX, A.stepTop + Hh * 0.46, dzz + T / 2 + 0.03); add(plate);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), brass); knob.position.set(A.doorX + W / 2 - 0.09, A.stepTop + Hh * 0.4, dzz + T / 2 + 0.05); add(knob);
      // fanlight: a half disc of dark glass with fan bars, a dressed rim
      const fan = new THREE.Mesh(new THREE.CircleGeometry(r - 0.02, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: "#6f94b8", fog: false })); fan.material.userData.noOutline = true; fan.position.set(A.doorX, H0, dzz - 0.02); add(fan);
      const spokes = Buf(); for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI; addBox(spokes, A.doorX + Math.cos(a) * (r / 2), H0 + Math.sin(a) * (r / 2), dzz, r, 0.022, 0.03, WHITE, 0, a); }
      addBox(spokes, A.doorX, H0 + 0.02, dzz, A.doorW, 0.05, 0.05, WHITE);
      add(bufMesh(spokes, green));
    } else {
      // an open doorway: a dim warm hall behind (floor at the step top) for the frontdoor prop
      const hd = 2.6, hm = basic({ color: "#8a6a50" }), hz = z - A.wallT - hd / 2;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6), basic({ color: "#7a5a46" })); back.position.set(0, 1.3, z - A.wallT - hd); add(back);
      for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(hd, 2.6), basic({ color: "#9a7a60", side: THREE.DoubleSide })); w.rotation.y = -sd * Math.PI / 2; w.position.set(sd * 0.95, 1.3, hz); add(w); }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.9, hd), basic({ color: "#6a4a36" })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, A.stepTop + 0.002, hz); add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(1.9, hd), basic({ color: "#b8905e", side: THREE.DoubleSide })); ce.rotation.x = Math.PI / 2; ce.position.set(0, 2.6, hz); add(ce);
    }
  }

  // ---- Mash's house: x -8..7.6, 9 m, ground floor 0..3.3 (windows 0.95..2.9), floor 1 (3.9..5.9), floor 2 (7.1..8.6)
  const WZ = A.wallZ, FX0 = -8, FX1 = 7.6, HH = 9.0;
  {
    const holes = [{ x: A.doorX, y: A.stepTop, w: A.doorW, h: A.doorH + 0.5, arch: true }];
    const win = [];   // [x, y, w, h, box]
    for (const x of [-6.6, -4.2, -2.55, 2.3, 4.45, 6.45]) win.push([x, 0.95, 1.05, 1.95, true]);
    for (const x of [-6.6, -4.2, -2.55, 2.3, 4.45, 6.45]) win.push([x, 4.0, 1.0, 1.9, true]);
    win.push([0, 3.75, 1.0, 2.15, false]);   // the balcony door
    for (const x of [-6.6, -4.2, -2.1, 0, 2.1, 4.3, 6.4]) win.push([x, 7.3, 0.95, 1.5, false]);
    for (const [x, y, w, h] of win) holes.push({ x, y, w, h });
    facade({ x0: FX0, x1: FX1, h: HH, z: WZ, holes, map: std("#ffffff", { map: stoneT, emissive: WARM }), baseY: -0.3 });
    for (const [x, y, w, h, bx] of win) windowFor(x, y, w, h, WZ, { box: bx });
    doorFor(WZ);
    // string courses and the cornice
    for (const y of [3.45, 6.65]) addBox(dressed, (FX0 + FX1) / 2, y, WZ + 0.05, FX1 - FX0 + 0.1, 0.2, 0.14, pale(), 0, 0, 1.2);
    addBox(dressed, (FX0 + FX1) / 2, HH + 0.05, WZ + 0.2, FX1 - FX0 + 0.5, 0.3, 0.5, pale(), 0, 0, 1.2);
    for (const sd of [FX0 + 0.12, FX1 - 0.12]) for (let k = 0; k < 35; k++) addBox(dressed, sd, 0.14 + k * 0.26, WZ + 0.03, k % 2 ? 0.3 : 0.55, 0.245, 0.05, pale(), 0, 0, 1.2);   // quoins
    // balcony over the door: a slab on corbels, an iron railing with scroll bars
    const by = 3.55, bz = WZ + 0.55;
    addBox(dressed, 0, by - 0.06, WZ + 0.4, 3.9, 0.14, 0.9, pale(), 0, 0, 1.2);
    for (const cx of [-1.5, -0.5, 0.5, 1.5]) addBox(dressed, cx, by - 0.38, WZ + 0.15, 0.2, 0.5, 0.3, pale(), 0, 0, 1.2);
    const rail = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0); addBox(ironB, (x0 + x1) / 2, by + 0.98, (z0 + z1) / 2, L, 0.045, 0.045, WHITE, ry); addBox(ironB, (x0 + x1) / 2, by + 0.1, (z0 + z1) / 2, L, 0.04, 0.04, WHITE, ry);
      for (let k = 0; k <= Math.round(L / 0.13); k++) { const f = k / Math.round(L / 0.13); addBox(ironB, x0 + (x1 - x0) * f, by + 0.54, z0 + (z1 - z0) * f, 0.02, 0.88, 0.02, WHITE, 0); if (k % 4 === 2) { const sc = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14), iron); sc.position.set(x0 + (x1 - x0) * f, by + 0.5, z0 + (z1 - z0) * f); sc.rotation.y = ry; add(sc); } } };
    rail(-1.85, bz + 0.35, 1.85, bz + 0.35); rail(-1.85, WZ + 0.02, -1.85, bz + 0.35); rail(1.85, WZ + 0.02, 1.85, bz + 0.35);
    // the roof: slate gable sloping back, two stacks
    gableRoof(FX0 - 0.3, FX1 + 0.3, HH + 0.2, WZ + 0.55, 8.5, 3.2, -1);
    for (const cx of [-3.5, 3.2]) { addBox(dressed, cx, HH + 2.4, WZ - 4.3, 0.9, 2.6, 0.7, pale(), 0, 0, 1.2); for (const px of [-0.2, 0.2]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.42, 10), std("#a85a38")); pot.position.set(cx + px, HH + 3.9, WZ - 4.3); add(pot); } }
    // a drainpipe with brackets and a hopper
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, HH + 0.3, 10), iron); pipe.position.set(7.52, (HH - 0.3) / 2, WZ + 0.1); pipe.castShadow = true; add(pipe);
    for (let k = 0; k < 6; k++) addBox(ironB, 7.52, 0.6 + k * 1.5, WZ + 0.05, 0.14, 0.05, 0.1, WHITE);
    addBox(ironB, 7.52, HH - 0.5, WZ + 0.12, 0.3, 0.3, 0.26, WHITE);
  }
  // roof helper: two slate slabs and two stone gable ends; `dir` -1 slopes back toward -z, +1 toward +z
  function gableRoof(x0, x1, y0, zf, depth, rise, dir) {
    const half = depth / 2, ang = Math.atan2(rise, half), L = Math.hypot(half, rise) + 0.3, W = x1 - x0;
    for (const sd of [0, 1]) {
      const g = new THREE.BoxGeometry(W, 0.12, L), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W / 2.2, uv.getY(i) * L / 2.2);
      const m = new THREE.Mesh(g, slateM); m.position.set((x0 + x1) / 2, y0 + rise / 2 + 0.04, zf + dir * (half / 2 + sd * half));
      m.rotation.x = dir * (sd ? ang : -ang); m.castShadow = m.receiveShadow = true; add(m);
    }
    for (const x of [x0 + 0.05, x1 - 0.05]) { const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(depth / 2, rise); tri.lineTo(depth, 0); const tg = new THREE.ShapeGeometry(tri); tg.rotateY(dir > 0 ? -Math.PI / 2 : Math.PI / 2); const tm = new THREE.Mesh(tg, std("#a89a86", { side: THREE.DoubleSide })); tm.position.set(x, y0, zf); add(tm); }
  }

  // ---- the neighbour (set back) and the annex with its slate roof
  {
    const nz = WZ - 0.55, holes = [], wins = [[8.75, 0.95, 0.95, 1.9], [10.5, 0.95, 0.95, 1.9], [8.75, 4.0, 0.95, 1.8], [10.5, 4.0, 0.95, 1.8]];
    for (const [x, y, w, h] of wins) holes.push({ x, y, w, h });
    facade({ x0: 7.6, x1: 11.4, h: 7.2, z: nz, holes, map: std("#ffffff", { map: stoneT2, emissive: WARM }), baseY: -0.3, uvX: 3.1 });
    for (const [x, y, w, h] of wins) windowFor(x, y, w, h, nz, { box: y < 2 });
    addBox(dressed, 9.5, 7.3, nz + 0.2, 3.9, 0.26, 0.5, pale(), 0, 0, 1.2);
    gableRoof(7.5, 11.5, 7.35, nz + 0.3, 6.5, 2.2, -1);
    // the annex: one storey, a slate roof sloping down toward the street
    const az = WZ - 0.4, ah = 3.2, aw = [{ x: 12.3, y: 0.95, w: 0.9, h: 1.5 }, { x: 13.7, y: 0.95, w: 0.9, h: 1.5 }];
    facade({ x0: 11.4, x1: 14.8, h: ah, z: az, holes: aw, map: std("#ffffff", { map: stoneT, emissive: WARM }), baseY: -0.3, uvX: 7.7 });
    for (const q of aw) windowFor(q.x, q.y, q.w, q.h, az, { box: false });
    const sl = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.12, 4.0), slateM); sl.position.set(13.1, ah + 0.55, az - 1.7); sl.rotation.x = 0.28; sl.castShadow = sl.receiveShadow = true; add(sl);
  }
  // ---- the terrace across the road: pastel renders and stone, 3 floors, each house its own height and tint
  {
    const zF = A.farFrontZ, tones = ["#e8d6a8", "#dcc0a2", "#cfd0c2", "#e5c9a6", "#d8b8a4", "#e9dcc0", "#c9c5b0"], rH = rng(seed * 17 + 8);
    let x = -34, k = 0;
    while (x < 9.5) {
      const w = 5 + rH() * 2.4, h = 8.6 + rH() * 2.2, stone = k % 3 === 1, holes = [], wins = [];
      const nW = Math.max(2, Math.round(w / 2.0)), gap = w / nW;
      for (let c = 0; c < nW; c++) for (const [y, hh] of [[0.95, 1.95], [4.2, 1.85], [7.2, 1.55]]) if (!(c === 1 && y < 1)) wins.push([x + gap * (c + 0.5), y, 1.0, hh]);
      wins.push([x + gap * 1.5, A.stepTop * 0, 1.0, 2.1, "door"]);
      for (const wn of wins) holes.push({ x: wn[0], y: wn[4] ? 0 : wn[1], w: wn[2], h: wn[3], arch: wn[4] === "door" });
      const map = std("#ffffff", { map: stone ? stoneT2 : ctex(plasterCanvas(rH, tones[k % tones.length])), emissive: WARM });
      facade({ x0: x, x1: x + w, h, z: zF, holes, map, baseY: -0.3, uvK: stone ? 3.2 : 3.6, uvX: x * 3.1 });
      for (const wn of wins) {
        if (wn[4] === "door") { const d = new THREE.Mesh(new THREE.BoxGeometry(wn[2] - 0.06, wn[3] - 0.25, 0.06), std(["#35567a", "#7a2f2a", "#2f5d3a", "#5a4a3a"][k % 4], { roughness: 0.55 })); d.position.set(wn[0], (wn[3] - 0.25) / 2, zF - 0.2); d.castShadow = true; add(d); addBox(dressed, wn[0], wn[3] + 0.1, zF + 0.06, wn[2] + 0.5, 0.22, 0.14, pale(), 0, 0, 1.2); continue; }
        windowFor(wn[0], wn[1], wn[2], wn[3], zF, { surround: true, box: wn[1] > 0.5 && wn[1] < 5 && rH() < 0.7 });
      }
      addBox(dressed, x + w / 2, h + 0.05, zF + 0.2, w + 0.3, 0.28, 0.5, pale(), 0, 0, 1.2);
      for (const yy of [3.45, 6.65]) addBox(dressed, x + w / 2, yy, zF + 0.05, w + 0.04, 0.2, 0.12, pale(), 0, 0, 1.2);   // string courses
      addBox(dressed, x + w / 2, 0.2, zF + 0.04, w, 0.5, 0.1, pale(-0.12), 0, 0, 1.2);   // a plinth
      if (k % 2 === 0) { const by = 4.1, bw = Math.min(w - 1, 3.4), bx = x + w / 2; addBox(dressed, bx, by - 0.05, zF + 0.4, bw, 0.12, 0.8, pale(), 0, 0, 1.2); for (let n = 0; n <= Math.round(bw / 0.14); n++) addBox(ironB, bx - bw / 2 + n * (bw / Math.round(bw / 0.14)), by + 0.5, zF + 0.76, 0.02, 0.86, 0.02, WHITE); addBox(ironB, bx, by + 0.94, zF + 0.76, bw, 0.04, 0.04, WHITE); }
      gableRoof(x - 0.15, x + w + 0.15, h + 0.2, zF + 0.5, 8, 2.6 + rH(), 1);
      if (k % 2) { addBox(dressed, x + w * 0.3, h + 2.7, zF + 3.5, 0.9, 2.4, 0.7, pale(), 0, 0, 1.2); }
      x += w + 0.04; k++;
    }
  }
  // ---- finish the merged wall parts
  {
    const dm = bufMesh(dressed, dressedM); if (dm) { dm.name = "set-dressed"; add(dm); }
    add(bufMesh(whiteB, white, true, true)); add(bufMesh(ironB, iron));
    glassBufs.forEach((B, k) => { const m = bufMesh(B, glassMats[k], false, false); if (m) add(m); });
    Object.keys(curtB).forEach((k) => { const m = bufMesh(curtB[k], curtMats[k], false, false); if (m) add(m); });
    { const [sc, sg] = canvas(64, 128); for (let x = 0; x < 64; x++) { const a = (0.5 + 0.5 * Math.sin(x * 0.9 + (x * x) % 7)) * 0.4 + 0.05, e = Math.min(1, Math.min(x, 63 - x) / 10); const gr = sg.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, `rgba(60,44,30,${a * e})`); gr.addColorStop(1, "rgba(60,44,30,0)"); sg.fillStyle = gr; sg.fillRect(x, 0, 1, 128); }
      const stm = new THREE.MeshBasicMaterial({ map: ctex(sc, 1, 1, false), transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); stm.userData.noOutline = true; const sm2 = bufMesh(streakQ, stm, false, false); if (sm2) { sm2.renderOrder = 1; add(sm2); } }
    add(bufMesh(flowerQ, flowerMat, true, false)); add(bufMesh(boxLeafQ, ivyMat, true, false));
  }

  // ---------------------------------------------------------------- foliage: maples, shrubs, ivy
  const treeWood = [], leafQ = Buf(), coreQ = Buf(), farBlobs = [];
  const TONES = {
    red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e", "#a8221a"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"],
    gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e", "#f2c038"], mix: ["#d9461c", "#e8751e", "#f0b21e", "#c8301c", "#f6cc3a", "#e08c1e"], green: ["#6f9a3a", "#8aa83a", "#b9b02a", "#5a8a3a", "#d8a82a"],
  };
  function clump(c, r, tone, scaleY = 0.78, cards = null, cardSz = 0.27) {
    const pal = TONES[tone].map((h) => new THREE.Color(h)), n = cards ?? Math.round(80 + 240 * r), dark = pal[0].clone().lerp(pal[1], 0.5).multiplyScalar(0.5), kc = 0.72 + rT() * 0.5;
    // the dark core (so the clump has an inside)
    const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = coreQ.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); coreQ.p.push(c.x + x * r * 0.5, c.y + y * r * 0.5 * scaleY, c.z + z * r * 0.5); _n.set(x, y, z).normalize(); coreQ.n.push(_n.x, _n.y, _n.z); coreQ.uv.push(0, 0); coreQ.c.push(dark.r, dark.g, dark.b); coreQ.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = new THREE.Vector3(rr * Math.cos(th), u * scaleY, rr * Math.sin(th));
      const rad = r * (0.7 + rT() * 0.32), p = new THREE.Vector3(c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad);
      const nrm = new THREE.Vector3(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = cardSz * (0.75 + rT() * 0.5);
      addCard(leafQ, p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
    }
  }
  function maple(x, z, h, tone, o = {}) {
    const y0 = o.y0 ?? terrainY(x, z) + 0.05, lean = (rT() - 0.5) * 0.12, base = new THREE.Vector3(x, y0, z), R = o.R ?? h * 0.36;
    const trunkH = h * (o.trunk ?? 0.5), pts = [0, 0.25, 0.5, 0.75, 1].map((k) => new THREE.Vector3(x + lean * k * k * trunkH + Math.sin(k * 3 + x) * 0.05, y0 + k * trunkH, z + lean * 0.5 * k * k * trunkH));
    const r0 = o.r ?? 0.09 + h * 0.014;
    pts.forEach((p, i) => { if (i) treeWood.push(segMat(pts[i - 1], p, r0 * (1 - (i - 1) * 0.15), r0 * (1 - i * 0.15))); });
    treeWood.push([new THREE.ConeGeometry(r0 * 1.9, 0.5, 8), M4(x, y0 + 0.2, z)]);
    const top = pts[4], nb = (o.branches ?? 6) + 1;
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * 6.28 + rT() * 0.7, el = 0.45 + rT() * 0.5, f = 0.35 + (b % 3) * 0.2, st = pts[Math.min(4, Math.round(f * 4))].clone(), L = R * (0.75 + rT() * 0.45);
      st.y = y0 + trunkH * (0.55 + 0.45 * f);
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), mid = st.clone().addScaledVector(dir, L * 0.5), tip = st.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, L * 0.18, 0));
      const rb = r0 * (0.5 - b * 0.02);
      treeWood.push(segMat(st, mid, rb, rb * 0.62)); treeWood.push(segMat(mid, tip, rb * 0.62, 0.025));
      if (rT() < 0.85) { const f2 = mid.clone(), d2 = dir.clone().applyAxisAngle(Yaxis, (rT() < 0.5 ? -1 : 1) * (0.6 + rT() * 0.5)), e2 = f2.clone().addScaledVector(d2, L * 0.55).add(new THREE.Vector3(0, L * 0.12, 0)); treeWood.push(segMat(f2, e2, rb * 0.4, 0.02)); clump(e2, R * (0.3 + rT() * 0.14), o.tones ? o.tones[Math.floor(rT() * o.tones.length)] : tone); }
      const tn = () => (o.tones ? o.tones[Math.floor(rT() * o.tones.length)] : tone);
      clump(tip, R * (0.34 + rT() * 0.16), tn());
      clump(tip.clone().add(new THREE.Vector3((rT() - 0.5) * R * 0.5, R * (0.2 + rT() * 0.2), (rT() - 0.5) * R * 0.5)), R * (0.26 + rT() * 0.12), tn());
      clump(mid.clone().addScaledVector(dir, L * 0.18).add(new THREE.Vector3(0, 0.2, 0)), R * (0.26 + rT() * 0.1), tn());
    }
    clump(top.clone().add(new THREE.Vector3(0, R * 0.55, 0)), R * 0.42, tone);
    clump(top.clone().add(new THREE.Vector3(R * 0.3, R * 0.2, -R * 0.2)), R * 0.36, tone);
  }
  function shrub(x, z, r, tone, y0 = null) { const y = (y0 ?? terrainY(x, z)) + r * 0.55; clump(new THREE.Vector3(x, y, z), r, tone, 0.72, Math.round(70 + 170 * r), 0.17); }
  if (S.trees !== false) {
    // the street maple at the kerb (its shadow dapples the wall and the pavement), a red crown
    maple(A.tree.x, A.tree.z, 11, "red", { tones: ["red", "orange", "gold", "red"], trunk: 0.72, R: 3.0, r: 0.2 });
    // the tall orange maple behind the second house, on the pavement at the corner
    maple(9.6, 0.9, 11, "orange", { tones: ["orange", "gold", "orange", "red"], trunk: 0.7, R: 3.0, r: 0.18 });
    // the terrace's side: street trees on the far pavement
    const ft = [[-24, "gold"], [-17, "orange"], [-10.5, "red"], [-4, "gold"], [2.5, "orange"], [8.5, "red"]];
    for (const [fx, tn] of ft) maple(fx + (rT() - 0.5) * 2, 10.2 + rT() * 0.4, 8 + rT() * 3, tn, { tones: [tn, "mix", tn], trunk: 0.5, R: 3.0 + rT() * 0.7, r: 0.14, branches: 5, y0: 0.05 });
    // the near side beyond the annex and behind the camera
    maple(-13, 1.7, 9, "gold", { tones: ["gold", "orange"], trunk: 0.45, R: 3.2, r: 0.15, branches: 5, y0: 0.05 });
    maple(-22, 1.5, 9.5, "orange", { tones: ["orange", "red"], trunk: 0.45, R: 3.3, r: 0.15, branches: 5, y0: 0.05 });
    if (HILL) {
      for (const [s, q, h, tn] of [[19, -3.5, 9, "red"], [23, -6, 7.5, "gold"], [28, -2.5, 8.5, "orange"], [26, 14, 9, "gold"], [34, 17, 8, "red"], [30, -9, 8, "mix"], [40, -6, 7, "orange"], [36, 21, 9, "orange"]]) {
        const f = F.at(s), px = f.x + f.nx * q, pz = f.z + f.nz * q; maple(px, pz, h, tn, { tones: [tn, "mix"], trunk: 0.46, R: h * 0.36, r: 0.12, branches: 5, solid: false });
      }
      // shrubs along the near bank (reds and golds) and the climbing vine on the pipe at the corner
      for (let k = 0; k < 18; k++) { const s = 14 + k * 2.1 + rT() * 1.2, q = -1.2 - rT() * 4, f = F.at(s); shrub(f.x + f.nx * q, f.z + f.nz * q, 0.7 + rT() * 0.8, ["red", "gold", "orange", "mix", "green"][k % 5]); }
      for (let k = 0; k < 12; k++) { const s = 16 + k * 2.7 + rT(), q = 11.2 + rT() * 3, f = F.at(s); shrub(f.x + f.nx * q, f.z + f.nz * q, 0.8 + rT() * 0.9, ["gold", "orange", "red", "mix"][k % 4]); }
    }
    for (const [x, z, r, tn] of [[8.3, -0.4, 0.8, "red"], [11.9, -0.1, 0.9, "mix"], [13.8, 0.2, 0.75, "gold"], [-9.4, 0.0, 0.9, "red"], [-10.6, 1.0, 0.8, "gold"]]) shrub(x, z, r, tn, 0);
    // along the terrace's far pavement, low hedges and flower pots
    // ivy and the red vine: flat leaf cards climbing the wall (own buffer, no wind)
    const IV = Buf(), iv = ["#c8301c", "#d9461c", "#e8751e", "#f0b21e", "#a8221a", "#f6cc3a", "#6f9a3a"], rI = rng(seed * 211 + 9);
    const g3 = () => (rI() + rI() + rI() - 1.5) / 1.5;   // roughly gaussian, -1..1
    const cluster = (cx, cy, rx, ry, n, z = WZ, size = 1) => {
      for (let i = 0; i < n; i++) {
        const x = cx + g3() * rx, y = Math.max(0.08, cy + g3() * ry), nrm = new THREE.Vector3((rI() - 0.5) * 0.5, (rI() - 0.5) * 0.4, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = (0.09 + rI() * 0.07) * size;
        addCard(IV, x, y, z + 0.03 + rI() * 0.1, a, b, sz, sz, nrm, tint(iv[Math.floor(rI() * iv.length)], rI, 0.012, 0.07, 0.08));
      }
    };
    // dense clumps that climb from the ground, hang from the window boxes and frame the door arch; most of the stone stays bare
    cluster(-7.5, 3.2, 0.7, 3.0, 650); cluster(-7.2, 7.2, 1.3, 1.0, 420); cluster(-6.0, 5.6, 0.6, 1.4, 200); cluster(-5.4, 0.7, 0.8, 0.6, 140);
    cluster(-3.2, 0.5, 0.45, 0.45, 70); cluster(1.35, 0.8, 0.3, 0.8, 110);
    cluster(-1.05, 2.5, 0.2, 0.95, 140); cluster(1.05, 2.2, 0.2, 0.8, 90); cluster(-0.5, 3.25, 0.5, 0.16, 80);
    cluster(-1.9, 3.7, 0.25, 0.45, 80); cluster(1.9, 3.5, 0.2, 0.4, 50);
    cluster(7.5, 3.0, 0.22, 3.0, 300); cluster(7.4, 6.5, 0.5, 0.8, 110); cluster(3.3, 5.7, 0.7, 0.4, 70);
    for (const [wx, wy] of [[-6.6, 0.95], [-4.2, 0.95], [-2.55, 0.95], [2.3, 0.95], [4.45, 0.95], [6.45, 0.95], [-6.6, 4.0], [-4.2, 4.0], [2.3, 4.0], [4.45, 4.0], [6.45, 4.0]]) cluster(wx + g3() * 0.2, wy - 0.45, 0.4, 0.3, 55);
    for (let i = 0; i < 110; i++) { const x = -1.9 + rI() * 3.8, y = 3.0 + rI() * 0.4; const nrm = new THREE.Vector3(0, -0.3, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28); addCard(IV, x, y - rI() * 0.5, WZ + 0.5 + rI() * 0.4, a, b, 0.12, 0.12, nrm, tint(iv[Math.floor(rI() * iv.length)], rI)); }
    add(bufMesh(IV, ivyMat, true, false));
  }
  // merge and add the trees
  {
    const wm = mergedGeo(treeWood, std("#5a4034", { roughness: 0.95 })); if (wm) { wm.name = "set-trunks"; add(wm); }
    const lm = bufMesh(leafQ, leafMat, true, true); if (lm) { lm.frustumCulled = false; lm.name = "set-leaves"; add(lm); }
    const cm = bufMesh(coreQ, coreMat, false, true); if (cm) { cm.frustumCulled = false; add(cm); }
  }
  // ---------------------------------------------------------------- the lamp, railings, bollards, bench of leaves
  {
    // an ornate cast-iron lamp, green-black: a square plinth, a fluted foot with an urn, rings up the post, a scroll bracket,
    // a six-sided glass lantern in an iron frame under a little roof and finial
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
    lamp(A.lamp.x, 0, A.lamp.z);
    for (const [qx, qz] of [[-4.5, 9.7], [17.5, 0]]) { const f = qx > 12 ? F.at(qx - 1) : null; lamp(f ? f.x + f.nx * 1.9 : qx, f ? f.y : 0, f ? f.z + f.nz * 1.9 : qz, 0.95); }
    // the iron railing along the road's far edge where the terrace ends (posts with round caps, two rails), and bollards
    const RB = Buf(), rail = (q, s0, s1, y, H) => { for (let s = s0; s <= s1; s += 1.8) { const f = F.at(s), yy = F.yRef(s) + y; addBox(RB, f.x + f.nx * q, yy + H / 2, f.z + f.nz * q, 0.07, H, 0.07, WHITE); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), iron); cap.position.set(f.x + f.nx * q, yy + H + 0.03, f.z + f.nz * q); add(cap);
        const g = F.at(s + 1.8), yy2 = F.yRef(s + 1.8) + y; for (const hh of [H * 0.9, H * 0.45]) { const L = Math.hypot(g.x - f.x, g.z - f.z, yy2 - yy); const mx = (f.x + g.x) / 2 + f.nx * q, mz = (f.z + g.z) / 2 + f.nz * q; addBox(RB, mx, (yy + yy2) / 2 + hh, mz, L, 0.04, 0.04, WHITE, -(f.th + g.th) / 2, Math.atan2(yy2 - yy, L)); } } };
    if (HILL) { rail(10.7, 10, 96, -0.1, 1.0); rail(-0.9, 24, 60, 0, 0.9); }
    add(bufMesh(RB, iron));
    // a fence on the hill road's verge
  }

  // ---------------------------------------------------------------- the painted far hill (beyond ~150 m): one card cut from the painting
  // plates/painted/ST.webp (the hill, its pines, the two farmhouses, the fence and road; the sky is keyed out so the dome's sky shows),
  // hung at 165 m square-on to camera (a) so that camera sees it as the painting does. Feathered on its left edge; its foot is
  // hidden by the 3D foothill. Loaded before the first frame (globalThis.__loads).
  function addBackdrop() {
    const CAM = { p: new THREE.Vector3(-5, 0.95, 3.3), l: new THREE.Vector3(3.9, 1.0, -1.2), fov: 42, asp: 16 / 9 }, DC = 165;
    const SX = 1230, SY = 0, SW = 306, SH = 330;   // the crop of the 1536 x 1024 painting
    const f = CAM.l.clone().sub(CAM.p).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f).normalize();
    const tV = Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2)), tH = tV * CAM.asp;
    const hN = 1.534, wN = hN * (SW / SH) / CAM.asp * 1, xl = 0.25, yt = 1.04;   // the card's size and corner in camera (a)'s screen (-1..1)
    const Wm = DC * tH * wN, Hm = DC * tV * hN, xc = xl + wN / 2, yc = yt - hN / 2;
    const ctr = CAM.p.clone().addScaledVector(f, DC).addScaledVector(r, DC * tH * xc).addScaledVector(u, DC * tV * yc);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: "#fff4e4" }); mat.userData.noOutline = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 2, Hm), mat);   // the painting's crop and its mirror, so the hill carries on past the picture's edge mesh.name = "set-backdrop"; mesh.renderOrder = -1; mesh.userData.solid = false; mesh.frustumCulled = false;
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())); mesh.position.copy(ctr).addScaledVector(r, Wm / 2); add(mesh);
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/ST.webp").then((img) => {
      const [c, g] = canvas(SW * 4, SH * 2); g.imageSmoothingQuality = "high"; g.drawImage(img, SX, SY, SW, SH, 0, 0, SW * 2, SH * 2);
      g.save(); g.translate(SW * 4, 0); g.scale(-1, 1); g.drawImage(img, SX, SY, SW, SH, 0, 0, SW * 2, SH * 2); g.restore();
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2], blue = B - R, bright = (R + G + B) / 3;
        let a = 1 - Math.min(1, Math.max(0, (blue - 14) / 26));                         // blue sky
        if (bright > 205 && blue > -8) a = Math.min(a, 1 - Math.min(1, (bright - 205) / 25));   // white cloud
        const e = Math.min(1, Math.min(x, c.width - 1 - x) / 90); a *= e * e * (3 - 2 * e);   // feather both ends
        d[i + 3] = Math.round(a * 255);
      }
      g.putImageData(id, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true;
    }));
  }
  // ---------------------------------------------------------------- the hill: a winding road, fence, pines, round trees, two far houses
  if (HILL) {
    const TB = [], PB = Buf(), RB2 = Buf(), rH = rng(seed * 401 + 12), rr = rng(seed * 4 + 77);
    // the hill road: a spiral from the main road's bank up round the hill to its top, draped on the ground
    const hn = F.at(82), a0 = Math.atan2(-hn.nz, -hn.nx), hr = [];
    for (let i = 0; i <= -1; i++) { const t = i / 150, rad = 40 * (1 - t) + 4, an = a0 + t * 4.9 + 0.35 * Math.sin(t * 17), px = hillC[0] + Math.cos(an) * rad, pz = hillC[1] + Math.sin(an) * rad; hr.push([px, terrainY(px, pz) + 0.07, pz]); }
    const nearRoad = (x, z) => { let m = 1e9; for (const p of hr) m = Math.min(m, Math.hypot(p[0] - x, p[2] - z)); return m; };
    // round autumn trees and pines scattered on the banks and the hill, clear of the road
    let nHT = 0;
    for (let k = 0; k < 1100; k++) {
      const x = 14 + rH() * 170, z = -46 + rH() * 100, { s, q } = F.near(x, z), cq = Math.abs(q - 6);
      const d = Math.hypot(x - hillC[0], z - hillC[1]);
      if (s < S0 + 14 || cq < 7 || x < 8 || d < 10) continue;
      const clump = fbm(x * 0.07 + 11, z * 0.07, 31), pine = clump > 0.5;
      if (pine) continue;   // the pines are in the painted backdrop
      if (!pine && (rH() < 0.6 || d > 70)) continue;
      if (pine && rH() < 0.25) continue;
      const y = terrainY(x, z), sz = 1.7 + rH() * 2.3;
      if (pine) { const c = tint(["#2f6a3e", "#3d7a45", "#2a5c3a"][k % 3], rH, 0.01, 0.05, 0.05); for (let l = 0; l < 3; l++) { const g = new THREE.ConeGeometry(sz * (1 - l * 0.22) * 0.7, sz * 1.1, 7).toNonIndexed(), p = g.attributes.position; g.applyMatrix4(M4(x, y + sz * (0.8 + l * 0.7), z)); const b0 = PB.p.length / 3; for (let i = 0; i < p.count; i++) { PB.p.push(p.getX(i), p.getY(i), p.getZ(i)); PB.n.push(0, 1, 0); PB.uv.push(0, 0); PB.c.push(c.r, c.g, c.b); PB.i.push(b0 + i); } g.dispose(); } }
      else if (nHT < 9 && d < 66) { nHT++; const tn = ["orange", "gold", "red", "mix", "gold", "orange"][nHT % 6]; maple(x, z, 6.5 + rH() * 2.5, tn, { tones: [tn, "mix", tn], trunk: 0.4, R: 2.5 + rH() * 0.6, r: 0.11, branches: 5, y0: y, solid: false }); }
    }
    const pm = bufMesh(PB, lam("#ffffff", { vertexColors: true }), true, true); if (pm) { pm.frustumCulled = false; pm.userData.solid = false; add(pm); }
    const tm = bufMesh(RB2, lam("#ffffff", { vertexColors: true }), false, false); if (tm) { tm.userData.solid = false; add(tm); }
    // the road's surface and a wooden fence along its outer edge
    const HB = Buf(), FB = Buf(), fcol = new THREE.Color("#4a3a30");
    hr.forEach((p, i) => {
      const q = hr[Math.min(hr.length - 1, i + 1)], o = hr[Math.max(0, i - 1)], tx = q[0] - o[0], tz = q[2] - o[2], L = Math.hypot(tx, tz), nx = -tz / L, nz = tx / L, w = 1.7, b0 = HB.p.length / 3;
      for (const sd of [-1, 1]) { HB.p.push(p[0] + nx * w * sd, p[1], p[2] + nz * w * sd); HB.n.push(0, 1, 0); HB.uv.push(i * 0.8 / 3, sd * w / 3); const k = 1.15 - 0.2 * Math.abs(sd) * 0; HB.c.push(k, k, k); }
      if (i) HB.i.push(b0 - 2, b0 - 1, b0, b0 - 1, b0 + 1, b0);
      if (i % 3 === 0) { const fx = p[0] + nx * 2.3, fz = p[2] + nz * 2.3, fy = terrainY(fx, fz); addBox(FB, fx, fy + 0.45, fz, 0.09, 0.9, 0.09, fcol);
        const j = Math.min(hr.length - 1, i + 3), pj = hr[j], gx = pj[0] + (-(hr[Math.min(hr.length - 1, j + 1)][2] - hr[Math.max(0, j - 1)][2])) / 1 * 0; if (i + 3 < hr.length) { const lx = pj[0], lz = pj[2]; const jx = lx + (hr[Math.min(hr.length - 1, j + 1)][0] - hr[Math.max(0, j - 1)][0]) * 0; void jx; void gx; const ex = pj[0] + nx * 2.3, ez = pj[2] + nz * 2.3, ey = terrainY(ex, ez), Lr = Math.hypot(ex - fx, ez - fz, ey - fy); for (const hh of [0.78, 0.42]) addBox(FB, (fx + ex) / 2, (fy + ey) / 2 + hh, (fz + ez) / 2, Lr, 0.05, 0.05, fcol, Math.atan2(-(ez - fz), ex - fx), Math.atan2(ey - fy, Math.hypot(ex - fx, ez - fz))); } }
    });
    const hm0 = bufMesh(HB, std("#ffffff", { map: cobT, vertexColors: true, emissive: new THREE.Color("#2a2024") }), false, true); if (hm0) { hm0.userData.solid = false; hm0.name = "set-hillroad"; add(hm0); }
    const fm = bufMesh(FB, lam("#ffffff", { vertexColors: true }), false, false); if (fm) { fm.userData.solid = false; add(fm); }
    // the far hill itself, with its two farmhouses, pines and winding road, is the painted backdrop below
    if (S.backdrop !== false) addBackdrop();
  }

  // ---------------------------------------------------------------- fallen leaves (decals) and leaves drifting down
  {
    const LD = Buf(), nF = Math.round(900 * (S.fallen ?? 1)), cols = ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a"], flat = new THREE.Vector3(0, 1, 0);
    const g2 = () => (rG() + rG() + rG() - 1.5) / 1.5;
    const piles = [];
    for (let k = 0; k < 16; k++) piles.push([-9 + rG() * 24, A.wallZ + 0.05 + rG() * 0.35, 0, 0.9]);   // the wall foot
    for (let k = 0; k < 18; k++) piles.push([-9 + rG() * 24, A.pavementZ[1] - 0.15 - rG() * 0.4, 0, 1.0]);   // the kerb
    for (let k = 0; k < 8; k++) piles.push([-9 + rG() * 24, A.roadZ[0] + 0.1 + rG() * 0.4, 1, 0.9]);   // the gutter
    for (let i = 0; i < nF * 0.55; i++) {
      const pl = i < nF * 0.5 ? piles[Math.floor(rG() * piles.length)] : null, onRoad = pl ? pl[2] === 1 : rG() > 0.9;
      const x = pl ? pl[0] + g2() * 1.1 * pl[3] : -10 + rG() * 26, z = pl ? pl[1] + g2() * 0.28 : onRoad ? A.roadZ[0] + 0.1 + rG() * 2 : A.wallZ + 0.1 + rG() * 3.1;
      const y = (onRoad ? STREET.roadY : 0) + 0.006 + rG() * 0.004;
      if (!onRoad && z > A.pavementZ[1] - 0.02) continue;
      if (!onRoad && x > -0.95 && x < 0.95 && z < -0.38) continue;
      const [a, b] = frameOf(flat, rG() * 6.28), s = 0.1 + rG() * 0.08, tn = tint(cols[Math.floor(rG() * cols.length)], rG, 0.014, 0.08, 0.08);
      addCard(LD, x, y, z, a, b, s, s, flat, tn);
    }
    const lm = bufMesh(LD, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); if (lm) { lm.userData.solid = false; add(lm); }
    // drifting: a closed-form path per leaf (a pure function of the frame time)
    const nD = S.leaves ?? 32, geo = new THREE.PlaneGeometry(0.15, 0.15), drift = [], dm = cols.map((c) => lam(new THREE.Color(c), { map: mapleT, alphaTest: 0.5, side: THREE.DoubleSide }));
    for (let i = 0; i < nD; i++) {
      const o = new THREE.Mesh(geo, dm[i % dm.length]); o.castShadow = true; o.userData.solid = false; set.add(o);
      drift.push({ o, T: 8 + (i * 7 % 6) + (i % 3), ph: (i * 0.6180339) % 1, x0: -4 + 17 * ((i * 0.381966) % 1), z0: -0.2 + 6.5 * ((i * 0.7548776) % 1), sw: 0.7 + (i % 4) * 0.35, sp: 1.2 + (i % 5) * 0.5 });
    }
    const tick = (t) => {
      for (const d of drift) {
        const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28;
        d.o.position.set(d.x0 + 2.2 * u + d.sw * Math.sin(ang), 7.4 * (1 - u) + 0.04, d.z0 + 0.6 * Math.cos(ang * 0.8));
        d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8);
      }
    };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }
  return set;
}
