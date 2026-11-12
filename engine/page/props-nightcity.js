import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp } from "./util.js";

// "There's a catch" EP06 "read minds" (storyboards/series/what-if/06-read-minds, panels 08 and 12): the neon city at night
// seen from above, a painted night skyline for a window, a small dark hotel room and the pillow a potato holds on his head.
// Metres, x right, y up, z toward the main camera; everything faces +z at rot 0. No params and nothing moves: every frame
// is a pure function of the spec (hand-drawn canvas textures from a seeded hash, no Math.random, no clock). A prop's own
// `scale` scales all of it. No letters or words anywhere (signs are shapes and card suits).
//   neoncity     a night city, self-lit (unlit materials, it needs no scene light), ghost (see-through and not solid for the
//                checks: the cast never touches it). Origin: the ground at the middle of the city, the casino at spec.casino.
//                Spec: w 120, d 120 (the blocks: a 10 m grid of towers 5.5-7.8 m wide and 8-60 m high (lower near the
//                casino), streets between with glowing centre lines and car lights as dots (white head lamps, red tail
//                lamps), so each side is round(w / 10) and round(d / 10) cells); casino [0, 0] (x, z of the casino's
//                middle; the cells round it are left empty as a plaza: x +-20, z -10..+20 for the default [0, 0]).
//                - every tower has its own lit-window facades (warm yellow, some white, a few teal and pink), neon trims on the
//                  roof edge in pink, violet and teal, some with a rooftop unit or an antenna with a red light, and a third
//                  stepped back; seven big glowing billboard shapes (heart, star, spade, lightning bolt, crown, ring, club:
//                  no text) stand on roofs and face the casino;
//                - the casino: 30 (x) x 20 (z) x 14 high, its front on +z: a gold arcade of seven lit arched windows (an
//                  entrance arch with a red carpet in the middle), a frieze of glowing suits and a big diamond, a gold
//                  canopy on two columns, a lit drum and a big glowing golden dome (r 7, top at y 22.2) with a lantern
//                  and spire (top at y 26), four small domes at the roof corners and a warm halo;
//                - round it: a dark blue night sky dome (r 250, a few stars, a soft violet glow at the horizon), a dark
//                  ground to r 245 and a far painted skyline ring (r 170) so a low camera never sees a flat horizon.
//                Cameras that fit: [0, 40, 25] at [0, 10, -40] fov 55; straight down from y 50. The camera far plane is 300.
//   nightskyline a curved backdrop for a window: spec.w 30 (arc length), spec.h 14, spec.r 18 (an arc of that radius about
//                the origin, facing the origin, the +z side open, its middle at z -18). Origin: the ground at the arc's
//                centre (stand it so the window is inside the arc). A painted night skyline in three layers with lit
//                windows, neon trims, billboard glows, a golden dome and a violet horizon glow, in the neoncity's colours.
//                Self-lit, ghost.
//   hotelroom    a small dark hotel room for a potato, ghost walls and floor: floor 4 (x) x 4 (z) with its middle at the
//                origin, walls 3 high on the left (x -2), right (x +2) and back (z -2), the front (+z) open, no ceiling.
//                In the back wall one window 2.6 w x 2.1 h, bottom at 0.7, centre x +0.5, dark frames, the glass a ghost. Stand a
//                nightskyline behind it: spec.r 18 at x 0, z +13, y -1 (its arc's middle then lies 5 m behind the window and
//                the towers' lit tops fill it; raise y to see less city), heavy blue curtains drawn to both sides,
//                dark blue hand-drawn wallpaper, dark wood floor, a rug (x -2..+1.4, z -0.6..+1.2), a bedside table
//                (0.45 x 0.45 x 0.5, SOLID) at x -1.3, z -1.4 with a small lamp, switched OFF (no light), and the bed.
//                Spec: bed 1 (0 hides the bed: use it when a separate hotelbed prop is the seat). Light: a dim blue point
//                light near the ceiling and a violet one in the window (from the city); the bubbles light the rest.
//   hotelbed     the double bed on its own, so "sit" works: origin on the floor at the SITTER's spot (x 0 the bed's middle,
//                z the spot against the pillows), grip 0.5: `sit` with seat = its id seats the body on the prop's x,z at SEAT_Y
//                0.42 unless told, so pass height 0.5 (the mattress top) in the sit. The bed is 1.5 wide
//                (x -0.75..+0.75), the mattress top at y 0.5 from z -0.62 (the head) to z +1.28 (the foot), the
//                headboard behind it at z -0.67 (0.9 high at the back, top y 1.1), two white pillows at z -0.43 (x -0.38,
//                +0.38), a blue checked duvet (top y 0.58) over the lower two thirds from z -0.12 to the foot, with a turned-down
//                white sheet edge. Solid. In the room it stands at x -0.2, z -1.25 (HOTEL.bed) with the room's bed 0.
//                The room's own bed (spec.bed 1) is the same bed at that place.
//   hotelpillow  one white pillow 0.5 (x) x 0.12 (y) x 0.3 (z), soft and rounded, origin its bottom centre. A potato holds
//                it pressed on his head with both gloves at its two ends (box hold): grips "L" at x -0.25 and "R" at
//                x +0.25, height 0.066 (55 % of the thickness), SIZE in storyboards/lib/grips.mjs. Not solid.
export const HOTEL = { bed: [-0.2, -1.25], table: [-1.3, -1.4], window: { w: 2.6, h: 2.1, y0: 0.7, cx: 0.5 }, seat: 0.5 };
export const NIGHTCITY_GRIPS = {};

// ------------------------------------------------------------------------------------------------ helpers
const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, { wrap = false, aniso = 4 } = {}) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// an unlit material with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
// not solid, out of the shadows and the light box (props-sos-set.js ghost)
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
function put(parent, geo, m, x = 0, y = 0, z = 0, { solid = false, ghosted = true, order = 0 } = {}) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
  if (ghosted) ghost(o, order); else { o.castShadow = o.receiveShadow = false; o.userData.solid = solid; }
  parent.add(o); return o;
}
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const addm = (map, opacity = 1) => bas({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });

// the neon palette shared by the city, the skyline and the billboards
const PINK = "#ff3fa4", VIOLET = "#9b5bff", TEAL = "#28e6d2", NEONS = [PINK, VIOLET, TEAL];
const WIN = ["#ffd36b", "#ffc552", "#ffe08a"], WHITE = "#fff4d8";
const winColor = (r1, r2) => (r1 < 0.72 ? WIN[Math.floor(r2 * 3)] : r1 < 0.87 ? WHITE : r1 < 0.94 ? TEAL : "#ff6fb0");

// a merged mesh of quads and boxes with vertex colours and uvs
class Mesher {
  constructor() { this.p = []; this.uv = []; this.c = []; this.i = []; }
  quad(a, b, c, d, uvs, col = [1, 1, 1]) {
    const n = this.p.length / 3;
    this.p.push(...a, ...b, ...c, ...d); this.uv.push(...uvs); for (let k = 0; k < 4; k++) this.c.push(...col);
    this.i.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  box(cx, cy, cz, w, h, d, col) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2, u = [0, 0, 1, 0, 1, 1, 0, 1];
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], u, col);                       // top
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], u, col.map((v) => v * 0.8));   // +z
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], u, col.map((v) => v * 0.8));   // -z
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], u, col.map((v) => v * 0.65));  // +x
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], u, col.map((v) => v * 0.65));  // -x
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); return g;
  }
}
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// ------------------------------------------------------------------------------------------------ painted things
// A glowing shape (billboards, the casino frieze): kind 0 heart, 1 star, 2 spade, 3 bolt, 4 crown, 5 ring, 6 club, 7 diamond.
function shapePath(g, kind, cx, cy, s) {
  g.beginPath();
  if (kind === 0) { g.moveTo(cx, cy + s * 0.9); g.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.8, cy - s * 1.1, cx, cy - s * 0.4); g.bezierCurveTo(cx + s * 0.8, cy - s * 1.1, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9); }
  else if (kind === 1) { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? s * 0.42 : s; g[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }
  else if (kind === 2) { g.moveTo(cx, cy - s); g.bezierCurveTo(cx + s * 1.5, cy - s * 0.1, cx + s * 0.9, cy + s * 0.8, cx, cy + s * 0.35); g.bezierCurveTo(cx - s * 0.9, cy + s * 0.8, cx - s * 1.5, cy - s * 0.1, cx, cy - s); g.moveTo(cx, cy + s * 0.2); g.lineTo(cx + s * 0.28, cy + s); g.lineTo(cx - s * 0.28, cy + s); g.closePath(); }
  else if (kind === 3) { g.moveTo(cx + s * 0.2, cy - s); g.lineTo(cx - s * 0.65, cy + s * 0.15); g.lineTo(cx - s * 0.05, cy + s * 0.15); g.lineTo(cx - s * 0.3, cy + s); g.lineTo(cx + s * 0.7, cy - s * 0.2); g.lineTo(cx + s * 0.1, cy - s * 0.2); g.closePath(); }
  else if (kind === 4) { g.moveTo(cx - s, cy + s * 0.65); g.lineTo(cx - s * 1.05, cy - s * 0.55); g.lineTo(cx - s * 0.5, cy + s * 0.05); g.lineTo(cx, cy - s * 0.85); g.lineTo(cx + s * 0.5, cy + s * 0.05); g.lineTo(cx + s * 1.05, cy - s * 0.55); g.lineTo(cx + s, cy + s * 0.65); g.closePath(); }
  else if (kind === 5) { g.arc(cx, cy, s * 0.95, 0, 7); g.moveTo(cx + s * 0.55, cy); g.arc(cx, cy, s * 0.55, 0, 7, true); }
  else if (kind === 6) { g.arc(cx, cy - s * 0.5, s * 0.46, 0, 7); g.moveTo(cx - s * 0.2 + s * 0.46, cy + s * 0.3); g.arc(cx - s * 0.5, cy + s * 0.25, s * 0.46, 0, 7); g.moveTo(cx + s * 0.96, cy + s * 0.25); g.arc(cx + s * 0.5, cy + s * 0.25, s * 0.46, 0, 7); g.moveTo(cx, cy); g.lineTo(cx + s * 0.25, cy + s); g.lineTo(cx - s * 0.25, cy + s); g.closePath(); }
  else { g.moveTo(cx, cy - s); g.lineTo(cx + s * 0.7, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s * 0.7, cy); g.closePath(); }
}
function glowShape(g, kind, cx, cy, s, col, core = "#ffffff") {
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  shapePath(g, kind, cx, cy, s); g.shadowColor = col; g.shadowBlur = s * 0.55; g.fillStyle = col; g.globalAlpha = 0.55; g.fill("evenodd");
  g.globalAlpha = 1; g.lineWidth = Math.max(2, s * 0.13); g.strokeStyle = col; g.stroke();
  g.shadowBlur = 0; shapePath(g, kind, cx, cy, s * 0.97); g.lineWidth = Math.max(1, s * 0.05); g.strokeStyle = core; g.globalAlpha = 0.9; g.stroke();
  g.restore();
}

// the night skyline: sky gradient, stars, three layers of towers with lit windows, neon trims, billboards, a golden dome.
// sky false = transparent behind the towers (the far ring round the city); u scales the sizes to the canvas height
function paintSkyline(w, h, seed, { sky = true, towers = [0.04, 0.16], dome = true } = {}) {
  return cvs(w, h, (g) => {
    const u = h / 840, R = (i, k = 0) => rnd(seed * 131 + i, k);
    if (sky) {
      const gr = g.createLinearGradient(0, 0, 0, h);
      [[0, "#060a22"], [0.4, "#0d1a52"], [0.66, "#34267c"], [0.84, "#7a3a9c"], [1, "#43205f"]].forEach(([o, c]) => gr.addColorStop(o, c));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < Math.round(w / 14); i++) {
        const x = R(i, 1) * w, y = R(i, 2) * h * 0.5, s = (0.6 + 1.6 * R(i, 3) ** 2) * u * 1.4;
        g.fillStyle = `rgba(255,${230 + Math.floor(R(i, 4) * 25)},${200 + Math.floor(R(i, 5) * 55)},${0.35 + 0.6 * R(i, 6)})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
      }
    }
    const layers = [
      { col: "#222363", edge: "#3a3a8f", win: 0.4, cell: 8, lo: 0.2, hi: 0.52, wmin: 24, wmax: 62, haze: 0.4, neon: 0.16 },
      { col: "#14174a", edge: "#272a73", win: 0.5, cell: 10, lo: 0.12, hi: 0.42, wmin: 28, wmax: 74, haze: 0.2, neon: 0.28 },
      { col: "#0a0c2c", edge: "#171a52", win: 0.6, cell: 13, lo: 0.05, hi: 0.3, wmin: 34, wmax: 92, haze: 0, neon: 0.34 },
    ];
    layers.forEach((L, li) => {
      let x = -R(li, 7) * 40 * u;
      const cell = L.cell * u;
      for (let t = 0; x < w; t++) {
        const tw = (L.wmin + (L.wmax - L.wmin) * R(li * 500 + t, 8)) * u, th = (L.lo + (L.hi - L.lo) * R(li * 500 + t, 9) ** 1.4) * h * (0.6 + 0.4 * towers[1] / 0.16), y0 = h - th;
        g.fillStyle = L.col; g.fillRect(x, y0, tw, th + 2);
        g.fillStyle = L.edge; g.fillRect(x, y0, Math.max(1, 2 * u), th);
        const cols = Math.max(2, Math.floor(tw / cell)), rows = Math.floor(th / (cell * 1.35));
        const bias = R(li * 500 + t, 10);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const k = li * 100000 + t * 400 + r * 20 + c, rr = R(k, 11) * 0.7 + bias * 0.3;
          if (rr > L.win) continue;
          g.fillStyle = winColor(R(k, 12), R(k, 13)); g.globalAlpha = 0.55 + 0.45 * R(k, 14);
          g.fillRect(x + (c + 0.2) * (tw / cols), y0 + (r + 0.3) * cell * 1.35 + cell * 0.5, (tw / cols) * 0.58, cell * 0.78);
        }
        g.globalAlpha = 1;
        if (R(li * 500 + t, 15) < L.neon) {
          const nc = NEONS[Math.floor(R(li * 500 + t, 16) * 3)]; g.save(); g.shadowColor = nc; g.shadowBlur = 10 * u; g.fillStyle = nc; g.fillRect(x - u, y0 - 3 * u, tw + 2 * u, 4 * u); g.restore();
        }
        if (R(li * 500 + t, 17) < 0.14) { g.fillStyle = L.edge; g.fillRect(x + tw * 0.48, y0 - 46 * u, 2 * u, 46 * u); g.fillStyle = "#ff4040"; g.beginPath(); g.arc(x + tw * 0.48 + u, y0 - 46 * u, 2.5 * u, 0, 7); g.fill(); }
        if (L.haze) { const hz = g.createLinearGradient(0, y0, 0, h); hz.addColorStop(0, `rgba(130,70,190,${L.haze * 0.55})`); hz.addColorStop(1, "rgba(130,70,190,0)"); g.fillStyle = hz; g.fillRect(x, y0, tw, th); }
        x += tw + (R(li * 500 + t, 18) < 0.3 ? 6 * u : 1 * u);
      }
      // billboards among the middle layer: a dark panel with a neon outline and a glowing shape
      if (li === 1) for (let b = 0; b < Math.max(2, Math.round(w / 520)); b++) {
        const bx = (0.12 + 0.76 * R(b, 21)) * w, bw = 54 * u, bh = 74 * u, by = h - (0.3 + 0.2 * R(b, 22)) * h, nc = NEONS[b % 3];
        g.save(); g.fillStyle = "#1a0f3a"; g.fillRect(bx, by, bw, bh); g.strokeStyle = nc; g.lineWidth = 2.5 * u; g.shadowColor = nc; g.shadowBlur = 12 * u; g.strokeRect(bx, by, bw, bh); g.restore();
        glowShape(g, (b * 3 + 1) % 8, bx + bw / 2, by + bh / 2, 17 * u, nc);
      }
    });
    if (dome && sky) {
      const dx = w * 0.34, base = h - 0.2 * h, r = 50 * u;
      const halo = g.createRadialGradient(dx, base - r * 0.4, 0, dx, base - r * 0.4, r * 3.2); halo.addColorStop(0, "rgba(255,200,110,0.55)"); halo.addColorStop(1, "rgba(255,170,80,0)");
      g.fillStyle = halo; g.fillRect(dx - r * 3.2, base - r * 3.6, r * 6.4, r * 6.4);
      g.fillStyle = "#6e4a1c"; g.fillRect(dx - r * 1.3, base, r * 2.6, h - base);
      const dg = g.createRadialGradient(dx, base - r * 0.8, r * 0.1, dx, base - r * 0.3, r); dg.addColorStop(0, "#fff0b0"); dg.addColorStop(0.6, "#ffcc58"); dg.addColorStop(1, "#c8892c");
      g.fillStyle = dg; g.beginPath(); g.arc(dx, base, r, Math.PI, 0); g.fill();
      g.fillStyle = "#ffd070"; g.fillRect(dx - r * 1.3, base - r * 0.08, r * 2.6, r * 0.18); g.fillRect(dx - 1.5 * u, base - r * 1.5, 3 * u, r * 0.5);
      for (let k = 0; k < 7; k++) { g.fillStyle = "#fff2b8"; g.fillRect(dx - r * 1.1 + k * r * 0.37, base + r * 0.25, r * 0.16, r * 0.38); }
    }
    const hz = g.createLinearGradient(0, h * 0.7, 0, h);
    hz.addColorStop(0, "rgba(150,70,190,0)"); hz.addColorStop(1, "rgba(150,70,190,0.18)"); g.fillStyle = hz; g.fillRect(0, h * 0.7, w, h * 0.3);
  });
}

// ------------------------------------------------------------------------------------------------ neoncity pieces
const ATLAS = { tw: 168, th: 336, cols: 12, rows: 12, ppmH: 10, ppmV: 5.6 };   // one tile per tower, two facades side by side

function groundCanvas(W, D, cx, cz, casino, seed) {
  const ppm = 16;
  return cvs(Math.round(W * ppm), Math.round(D * ppm), (g, w, h) => {
    const X = (x) => (x + W / 2) * ppm, Z = (z) => (z + D / 2) * ppm, R = (i, k = 0) => rnd(seed + i, k);
    g.fillStyle = "#0b0e26"; g.fillRect(0, 0, w, h);
    // sidewalk glow under the blocks and the asphalt of the streets
    const sw = 3.4;
    for (let k = 0; k <= cx; k++) { const x = -W / 2 + 10 * k; g.fillStyle = "#1a1838"; g.fillRect(X(x - sw / 2), 0, sw * ppm, h); g.fillStyle = "rgba(255,150,90,0.14)"; g.fillRect(X(x - sw / 2 - 0.5), 0, 0.5 * ppm, h); g.fillRect(X(x + sw / 2), 0, 0.5 * ppm, h); }
    for (let k = 0; k <= cz; k++) { const z = -D / 2 + 10 * k; g.fillStyle = "#1a1838"; g.fillRect(0, Z(z - sw / 2), w, sw * ppm); g.fillStyle = "rgba(255,150,90,0.14)"; g.fillRect(0, Z(z - sw / 2 - 0.5), w, 0.5 * ppm); g.fillRect(0, Z(z + sw / 2), w, 0.5 * ppm); }
    // the casino plaza: warm stone with drawn rings, a red carpet to the front door
    const px0 = casino[0] - 20, px1 = casino[0] + 20, pz0 = casino[1] - 10, pz1 = casino[1] + 20;
    const pg = g.createRadialGradient(X(casino[0]), Z(casino[1] + 10), 2 * ppm, X(casino[0]), Z(casino[1] + 10), 28 * ppm); pg.addColorStop(0, "#8a6a3a"); pg.addColorStop(0.6, "#5a4630"); pg.addColorStop(1, "#2a2438");
    g.fillStyle = pg; g.fillRect(X(px0), Z(pz0), (px1 - px0) * ppm, (pz1 - pz0) * ppm);
    g.strokeStyle = "rgba(255,214,130,0.5)"; g.lineWidth = 1.3;
    for (let r = 4; r <= 16; r += 3) { g.beginPath(); g.ellipse(X(casino[0]), Z(casino[1] + 14), r * ppm * 1.2, r * ppm * 0.7, 0, 0, 7); g.stroke(); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,220,150,${0.07 + 0.1 * R(i, 1)})`; g.fillRect(X(px0) + R(i, 2) * (px1 - px0) * ppm, Z(pz0) + R(i, 3) * (pz1 - pz0) * ppm, (0.4 + R(i, 4)) * ppm, (0.2 + 0.4 * R(i, 5)) * ppm); }
    g.fillStyle = "#a01c2c"; g.fillRect(X(casino[0] - 2.6), Z(casino[1] + 10), 5.2 * ppm, 9 * ppm);
    g.strokeStyle = "#ffd070"; g.lineWidth = 2; g.strokeRect(X(casino[0] - 2.6), Z(casino[1] + 10), 5.2 * ppm, 9 * ppm);
    // glowing centre lines: a dashed neon line down every street, in a neon colour per street
    const line = (x0, z0, x1, z1, col) => {
      g.save(); g.shadowColor = col; g.shadowBlur = 8; g.strokeStyle = col; g.lineWidth = 2.2; g.setLineDash([2.2 * ppm, 1.2 * ppm]);
      g.beginPath(); g.moveTo(X(x0), Z(z0)); g.lineTo(X(x1), Z(z1)); g.stroke(); g.restore();
    };
    const sCol = ["#ffb347", PINK, TEAL, "#ffd36b", VIOLET];
    for (let k = 0; k <= cx; k++) { const x = -W / 2 + 10 * k; if (Math.abs(x - casino[0]) < 20 && k > 0 && k < cx) continue; line(x, -D / 2, x, D / 2, sCol[k % 5]); }
    for (let k = 0; k <= cz; k++) { const z = -D / 2 + 10 * k; line(-W / 2, z, W / 2, z, sCol[(k + 2) % 5]); }
    // car lights: a pair per car, white head lamps going one way, red tail lamps the other
    g.globalCompositeOperation = "lighter";
    const lamp = (x, z, col, big = 1) => { const r = 0.55 * ppm * big, gr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(X(x) - r, Z(z) - r, r * 2, r * 2); };
    let n = 0;
    for (let k = 0; k <= cx; k++) for (let s = 0; s < 12; s++) for (let q = 0; q < 2; q++) {
      const x = -W / 2 + 10 * k + (q ? 0.8 : -0.8), z = -D / 2 + 10 * s + 1 + 8 * R(k * 99 + s * 7 + q, 20 + q), c = q ? "rgba(255,70,60,0.95)" : "rgba(255,245,210,0.95)";
      if (R(k * 99 + s * 7 + q, 25) < 0.45 || (Math.abs(x - casino[0]) < 20 && z > casino[1] - 10 && z < casino[1] + 20)) continue;
      lamp(x - 0.3, z, c); lamp(x + 0.3, z, c); n++;
    }
    for (let k = 0; k <= cz; k++) for (let s = 0; s < 12; s++) for (let q = 0; q < 2; q++) {
      const z = -D / 2 + 10 * k + (q ? 0.8 : -0.8), x = -W / 2 + 10 * s + 1 + 8 * R(k * 77 + s * 5 + q, 30 + q), c = q ? "rgba(255,70,60,0.95)" : "rgba(255,245,210,0.95)";
      if (R(k * 77 + s * 5 + q, 35) < 0.45 || (x > casino[0] - 20 && x < casino[0] + 20 && Math.abs(z - casino[1]) < 22 && z > casino[1] - 10 && z < casino[1] + 20)) continue;
      lamp(x, z - 0.3, c); lamp(x, z + 0.3, c); n++;
    }
    // street lamps' warm pools at the crossings
    for (let a = 0; a <= cx; a++) for (let b = 0; b <= cz; b++) { if (R(a * 31 + b, 40) < 0.5) lamp(-W / 2 + 10 * a, -D / 2 + 10 * b, "rgba(255,170,90,0.5)", 3.2); }
    g.globalCompositeOperation = "source-over";
  });
}

function towerTile(g, tx, ty, H, w, d, i) {
  const { tw, th, ppmH, ppmV } = ATLAS, R = (k, j = 0) => rnd(i * 53 + k, j);
  const wall = ["#171c4a", "#1f1a4d", "#14214f", "#231a45", "#1a2456"][Math.floor(R(1) * 5)];
  const gr = g.createLinearGradient(tx, ty, tx + tw, ty); gr.addColorStop(0, wall); gr.addColorStop(0.5, "#1c2060"); gr.addColorStop(1, wall);
  g.fillStyle = gr; g.fillRect(tx, ty, tw, th);
  const floors = Math.max(2, Math.floor(H / 3)), bottom = ty + th;
  [w, d].forEach((fw, half) => {
    const x0 = tx + half * 84, cols = Math.max(2, Math.floor(fw / 1.7)), cw = (fw * ppmH) / cols;
    // a lit shopfront band at the foot, then the floors
    g.fillStyle = R(5 + half) < 0.5 ? "#ffb347" : "#ff6fb0"; g.globalAlpha = 0.5; g.fillRect(x0 + 1, bottom - 1.4 * ppmV, fw * ppmH - 2, 1.4 * ppmV); g.globalAlpha = 1;
    for (let f = 1; f < floors; f++) {
      const bias = R(10 + f, half), y = bottom - (f * 3 + 0.9) * ppmV;
      for (let c = 0; c < cols; c++) {
        const k = i * 1000 + half * 500 + f * 20 + c, lit = R(k, 3) * 0.6 + bias * 0.4 < 0.62;
        g.fillStyle = lit ? winColor(R(k, 4), R(k, 5)) : "#0f1338"; g.globalAlpha = lit ? 0.6 + 0.4 * R(k, 6) : 1;
        g.fillRect(x0 + c * cw + cw * 0.2, y, cw * 0.6, 1.6 * ppmV);
      }
    }
    g.globalAlpha = 1;
    const edge = NEONS[Math.floor(R(7) * 3)]; g.fillStyle = edge; g.globalAlpha = 0.28; g.fillRect(x0, ty, 1.5, th); g.globalAlpha = 1;
  });
}

function billboardTex(kind, col, seed) {
  return tex(cvs(320, 200, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#241250"); bg.addColorStop(1, "#120a30"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.08 * rnd(seed + i, 1)})`; g.beginPath(); g.arc(rnd(seed + i, 2) * w, rnd(seed + i, 3) * h, 1 + 2 * rnd(seed + i, 4), 0, 7); g.fill(); }
    g.save(); g.strokeStyle = col; g.lineWidth = 9; g.shadowColor = col; g.shadowBlur = 16; g.strokeRect(12, 12, w - 24, h - 24); g.restore();
    glowShape(g, kind, w / 2, h / 2 + 4, 66, col);
  }));
}

function domeTex() {
  return tex(cvs(1024, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); [[0, "#fff4c0"], [0.25, "#ffdc78"], [0.7, "#f0b040"], [1, "#b8802c"]].forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 24; k++) { const x = (k / 24) * w; g.fillStyle = "rgba(120,70,10,0.45)"; g.fillRect(x - 3, 0, 6, h); g.fillStyle = "rgba(255,250,200,0.5)"; g.fillRect(x + 6, 0, 8, h); }
    for (const y of [0.42, 0.7, 0.9]) { g.fillStyle = "rgba(120,70,10,0.5)"; g.fillRect(0, y * h - 3, w, 6); g.fillStyle = "rgba(255,250,200,0.55)"; g.fillRect(0, y * h + 3, w, 3); }
    for (let k = 0; k < 24; k++) { g.fillStyle = "#fff6c8"; const x = ((k + 0.5) / 24) * w; g.beginPath(); g.moveTo(x - 9, h * 0.9 - 14); g.lineTo(x - 9, h * 0.9 - 28); g.arc(x, h * 0.9 - 28, 9, Math.PI, 0); g.lineTo(x + 9, h * 0.9 - 14); g.fill(); }
  }));
}
function drumTex() {
  return tex(cvs(1024, 64, (g, w, h) => {
    g.fillStyle = "#c9953a"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffe08a"; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    for (let k = 0; k < 24; k++) { const x = (k + 0.5) * (w / 24) + (rnd(k, 1) - 0.5) * 2; g.fillStyle = "#fff0b0"; g.beginPath(); g.moveTo(x - 10, h - 9); g.lineTo(x - 10, 26); g.arc(x, 26, 10, Math.PI, 0); g.lineTo(x + 10, h - 9); g.fill(); g.fillStyle = "#b8782a"; g.fillRect(x - 1, 14, 2, h - 22); }
  }));
}
function goldTex() {
  return tex(cvs(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); [[0, "#9a6a20"], [0.35, "#ffe08a"], [0.6, "#e0a838"], [1, "#8a5a18"]].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,240,170,${0.1 + 0.2 * rnd(i, 1)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(rnd(i, 2) * w, 0); g.lineTo(rnd(i, 2) * w + (rnd(i, 3) - 0.5) * 8, h); g.stroke(); }
  }));
}
function roofTex() {
  return tex(cvs(512, 340, (g, w, h) => {
    g.fillStyle = "#3d3358"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rnd(i, 1) < 0.5 ? "255,220,150" : "20,10,40"},${0.05 + 0.08 * rnd(i, 2)})`; g.fillRect(rnd(i, 3) * w, rnd(i, 4) * h, 2 + 14 * rnd(i, 5), 1 + 3 * rnd(i, 6)); }
    g.strokeStyle = "#ffd070"; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
    for (const [x, y] of [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]]) { g.fillStyle = "#ffd070"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(255,210,120,0.5)"; g.fillRect(70 + k * 62 + (rnd(k, 8) - 0.5) * 3, 70, 4, h - 140); }
  }));
}

// a casino facade: wm x hm metres, 51.2 px per metre; front true = the entrance arch, the suit frieze and the big diamond
function facadeTex(wm, hm, front, seed) {
  const ppm = 51.2;
  return tex(cvs(Math.round(wm * ppm), Math.round(hm * ppm), (g, w, h) => {
    const X = (m) => m * ppm, Y = (m) => h - m * ppm, R = (i, k = 0) => rnd(seed + i, k);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e0b564"); gr.addColorStop(1, "#b07c36"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // hand-set stone courses: every joint a little off
    g.strokeStyle = "rgba(90,50,10,0.28)"; g.lineWidth = 1.4;
    for (let r = 0; r < hm / 0.9; r++) {
      const y = Y(r * 0.9 + (R(r, 1) - 0.5) * 0.04); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (R(r, 2) - 0.5) * 3); g.stroke();
      for (let c = 0; c < wm / 2.2; c++) { const x = X(c * 2.2 + (r % 2) * 1.1 + (R(r * 40 + c, 3) - 0.5) * 0.3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R(r * 40 + c, 4) - 0.5) * 2, Y(r * 0.9 + 0.9)); g.stroke(); }
    }
    g.fillStyle = "rgba(255,240,180,0.1)"; for (let i = 0; i < 150; i++) g.fillRect(R(i, 5) * w, R(i, 6) * h, 3 + 20 * R(i, 7), 2);
    // lit arched window: a warm glow from the sill to the arch, gold frame, mullion
    const arch = (cx, wm2, hm2, y0m) => {
      const x0 = X(cx - wm2 / 2), ww = X(wm2), yTop = Y(y0m + hm2), yb = Y(y0m);
      g.fillStyle = "#7a4a14"; g.beginPath(); g.moveTo(x0 - 6, yb); g.lineTo(x0 - 6, yTop + ww / 2); g.arc(x0 + ww / 2, yTop + ww / 2, ww / 2 + 6, Math.PI, 0); g.lineTo(x0 + ww + 6, yb); g.fill();
      const wg = g.createLinearGradient(0, yTop, 0, yb); wg.addColorStop(0, "#fff0b8"); wg.addColorStop(0.5, "#ffcf6a"); wg.addColorStop(1, "#ff9a3a");
      g.fillStyle = wg; g.beginPath(); g.moveTo(x0, yb); g.lineTo(x0, yTop + ww / 2); g.arc(x0 + ww / 2, yTop + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x0 + ww, yb); g.fill();
      g.fillStyle = "#b8782a"; g.fillRect(x0 + ww / 2 - 2, yTop, 4, yb - yTop); g.fillRect(x0, yb - (yb - yTop) * 0.45, ww, 4);
    };
    const nWin = front ? 3 : Math.floor(wm / 4.4);
    if (front) {
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) arch(wm / 2 + s * (6 + 3.5 * k), 2.6, 5.6, 1.2);
      // the entrance: a tall arch, glowing orange, a red carpet and two doors
      const cx = wm / 2, x0 = X(cx - 2.6), ww = X(5.2), yTop = Y(7.4);
      g.fillStyle = "#7a4a14"; g.beginPath(); g.moveTo(x0 - 8, h); g.lineTo(x0 - 8, yTop + ww / 2); g.arc(x0 + ww / 2, yTop + ww / 2, ww / 2 + 8, Math.PI, 0); g.lineTo(x0 + ww + 8, h); g.fill();
      const eg = g.createRadialGradient(x0 + ww / 2, Y(2.5), 10, x0 + ww / 2, Y(3.5), ww); eg.addColorStop(0, "#fff0b8"); eg.addColorStop(0.5, "#ffb040"); eg.addColorStop(1, "#d86a20");
      g.fillStyle = eg; g.beginPath(); g.moveTo(x0, h); g.lineTo(x0, yTop + ww / 2); g.arc(x0 + ww / 2, yTop + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x0 + ww, h); g.fill();
      g.fillStyle = "#9a1c2c"; g.beginPath(); g.moveTo(X(cx - 1.1), Y(0)); g.lineTo(X(cx + 1.1), Y(0)); g.lineTo(X(cx + 0.7), Y(2.6)); g.lineTo(X(cx - 0.7), Y(2.6)); g.fill();
      g.fillStyle = "#7a4a14"; g.fillRect(X(cx) - 2, Y(5.2), 4, Y(0) - Y(5.2)); g.fillRect(X(cx - 2.6), Y(2.7), X(5.2), 4);
      // the frieze: a row of glowing suits either side of a big pink diamond with a teal one inside
      const fy = Y(11.2);
      glowShape(g, 7, X(cx), fy, X(1.9), PINK); glowShape(g, 7, X(cx), fy, X(1.0), TEAL);
      [[-5.2, 0, "#ff4060"], [-8.6, 2, VIOLET], [-12, 1, "#ffd36b"], [5.2, 6, TEAL], [8.6, 0, "#ff4060"], [12, 2, VIOLET]].forEach(([dx, kd, col]) => glowShape(g, kd, X(cx + dx), fy, X(0.95), col));
    } else {
      for (let k = 0; k < nWin; k++) { const cx = ((k + 0.5) * wm) / nWin; arch(cx, 2.2, 4.2, 1.4); arch(cx, 2.2, 2.6, 7.6); }
    }
    // gold cornice with a row of bulbs
    const cg = g.createLinearGradient(0, 0, 0, X(1.1)); cg.addColorStop(0, "#fff0b0"); cg.addColorStop(1, "#c8902c"); g.fillStyle = cg; g.fillRect(0, 0, w, X(1.1));
    for (let k = 0; k < wm / 0.55; k++) { const x = X(0.3 + k * 0.55), y = X(0.55); const bg = g.createRadialGradient(x, y, 0, x, y, 9); bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.4, "#ffe9a0"); bg.addColorStop(1, "rgba(255,200,90,0)"); g.fillStyle = bg; g.fillRect(x - 9, y - 9, 18, 18); }
    // pilasters: pale gold columns at the corners with a base
    for (const x of [0, wm - 0.9]) { const pg = g.createLinearGradient(X(x), 0, X(x + 0.9), 0); pg.addColorStop(0, "#c8902c"); pg.addColorStop(0.45, "#fff0b0"); pg.addColorStop(1, "#a8701c"); g.fillStyle = pg; g.fillRect(X(x), X(1.1), X(0.9), h); }
  }), { aniso: 8 });
}

// ------------------------------------------------------------------------------------------------ the city
function buildCity(P) {
  const S = P.spec, W = S.w ?? 120, D = S.d ?? 120, casino = S.casino ?? [0, 0], g = P.whole, seed = S.seed ?? 6;
  const cx = Math.round(W / 10), cz = Math.round(D / 10);
  // -- sky, ground, far ring
  const sky = put(g, new THREE.SphereGeometry(250, 48, 24), bas({ map: tex(cvs(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); [[0, "#05081e"], [0.28, "#0a1240"], [0.44, "#1c1f66"], [0.5, "#6a3398"], [0.54, "#3a1d62"], [1, "#0a0a24"]].forEach(([o, col]) => gr.addColorStop(o, col));
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const y = rnd(i, 2) ** 1.5 * h * 0.42, s = 0.6 + 1.5 * rnd(i, 3) ** 2; c.fillStyle = `rgba(255,240,215,${0.4 + 0.6 * rnd(i, 4)})`; c.beginPath(); c.arc(rnd(i, 1) * w, y + 4, s, 0, 7); c.fill(); }
    const hg = c.createLinearGradient(0, h * 0.4, 0, h * 0.54); hg.addColorStop(0, "rgba(190,90,200,0)"); hg.addColorStop(1, "rgba(190,90,200,0.35)"); c.fillStyle = hg; c.fillRect(0, h * 0.4, w, h * 0.14);
  })), side: THREE.BackSide, depthWrite: false }), 0, 0, 0, { order: -10 });
  sky.material.userData.noOutline = true;
  const ground = put(g, new THREE.CircleGeometry(245, 48), bas({ color: "#0a0d26" }), 0, -0.06, 0, { order: -5 }); ground.rotation.x = -Math.PI / 2;
  const ringM = bas({ map: tex(paintSkyline(4096, 420, seed + 3, { sky: false, towers: [0.04, 0.16], dome: false })), side: THREE.BackSide, transparent: true, depthWrite: false });
  put(g, new THREE.CylinderGeometry(170, 170, 46, 96, 1, true), ringM, 0, 22, 0, { order: -4 });

  // -- the street plane
  const gt = tex(groundCanvas(W, D, cx, cz, casino, seed), { aniso: 8 });
  const floor = put(g, new THREE.PlaneGeometry(W, D), bas({ map: gt }), 0, 0, 0, { order: -3 }); floor.rotation.x = -Math.PI / 2;

  // -- the towers, merged: facades share one atlas, roofs and neon are vertex-coloured
  const atlas = cvs(ATLAS.tw * ATLAS.cols, ATLAS.th * ATLAS.rows, () => {});
  const ag = atlas.getContext("2d"); ag.fillStyle = "#14183f"; ag.fillRect(0, 0, atlas.width, atlas.height);
  const AW = atlas.width, AH = atlas.height;
  const fac = new Mesher(), roofs = new Mesher(), neon = new Mesher();
  const list = []; let slot = 0;
  for (let a = 0; a < cx; a++) for (let b = 0; b < cz; b++) {
    const x = -W / 2 + 5 + 10 * a, z = -D / 2 + 5 + 10 * b;
    if (Math.abs(x - casino[0]) <= 15 && z - casino[1] >= -5 && z - casino[1] <= 15) continue;
    const i = a * 40 + b, dist = Math.hypot(x - casino[0], z - casino[1]);
    let H = 8 + 52 * rnd(i, 1) ** 1.8; if (dist < 60) H = Math.min(H, 10 + 0.6 * dist); H = Math.max(8, Math.min(56, H));
    list.push({ i, x: x + (rnd(i, 2) - 0.5) * 1.0, z: z + (rnd(i, 3) - 0.5) * 1.0, w: 5.5 + 2.3 * rnd(i, 4), d: 5.5 + 2.3 * rnd(i, 5), H, dist });
  }
  const face = (m, tx, ty, half, fw, y0, y1, a, b, c2, d2) => {
    const u0 = (tx + half * 84) / AW, u1 = u0 + (fw * ATLAS.ppmH) / AW, vb = 1 - (ty + ATLAS.th - y0 * ATLAS.ppmV) / AH, vt = 1 - (ty + ATLAS.th - y1 * ATLAS.ppmV) / AH;
    m.quad(a, b, c2, d2, [u0, vb, u1, vb, u1, vt, u0, vt]);
  };
  list.forEach((T, n) => {
    const tx = (n % ATLAS.cols) * ATLAS.tw, ty = Math.floor(n / ATLAS.cols) * ATLAS.th;
    towerTile(ag, tx, ty, T.H, T.w, T.d, T.i);
    const step = rnd(T.i, 6) < 0.3, H1 = step ? T.H * 0.66 : T.H, parts = [[T.w, T.d, 0, H1]];
    if (step) parts.push([T.w * 0.62, T.d * 0.62, H1, T.H]);
    parts.forEach(([w, d, y0, y1], pi) => {
      const x0 = T.x - w / 2, x1 = T.x + w / 2, z0 = T.z - d / 2, z1 = T.z + d / 2, fw = pi ? T.w : T.w;
      void fw;
      face(fac, tx, ty, 0, w, y0, y1, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      face(fac, tx, ty, 0, w, y0, y1, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      face(fac, tx, ty, 1, d, y0, y1, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      face(fac, tx, ty, 1, d, y0, y1, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      roofs.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 0, 1, 0, 1, 1, 0, 1], rgb("#14123a"));
    });
    const top = parts[parts.length - 1], tw = top[0], td = top[1];
    if (rnd(T.i, 7) < 0.6) roofs.box(T.x + (rnd(T.i, 8) - 0.5) * tw * 0.4, T.H + 0.6, T.z + (rnd(T.i, 9) - 0.5) * td * 0.4, 1.4 + rnd(T.i, 10), 1.2, 1.4 + rnd(T.i, 11), rgb("#2a2a5c"));
    if (rnd(T.i, 12) < 0.3) { roofs.box(T.x, T.H + 3, T.z, 0.18, 6, 0.18, rgb("#3a3a6a")); neon.box(T.x, T.H + 6.1, T.z, 0.5, 0.5, 0.5, rgb("#ff3030")); }
    if (rnd(T.i, 13) < 0.62) {
      const col = rgb(NEONS[Math.floor(rnd(T.i, 14) * 3)]), hw = tw / 2 + 0.1, hd = td / 2 + 0.1, t = 0.28, yy = T.H + 0.15;
      neon.box(T.x, yy, T.z + hd, tw + 0.4, t, t, col); neon.box(T.x, yy, T.z - hd, tw + 0.4, t, t, col); neon.box(T.x + hw, yy, T.z, t, t, td + 0.4, col); neon.box(T.x - hw, yy, T.z, t, t, td + 0.4, col);
      if (rnd(T.i, 15) < 0.35) { const c2 = rgb(NEONS[Math.floor(rnd(T.i, 16) * 3)]), ys = T.H * 0.5; neon.box(T.x + hw, ys, T.z + hd, 0.22, T.H, 0.22, c2); neon.box(T.x - hw, ys, T.z - hd, 0.22, T.H, 0.22, c2); }
    }
  });
  const facM = bas({ map: tex(atlas, { aniso: 8 }), side: THREE.DoubleSide });
  put(g, fac.geo(), facM, 0, 0, 0, { order: 1 }); put(g, roofs.geo(), bas({ vertexColors: true, side: THREE.DoubleSide }), 0, 0, 0, { order: 1 });
  put(g, neon.geo(), bas({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }), 0, 0, 0, { order: 2 });

  // -- billboards: the seven tallest-looking roofs far enough out
  const cand = list.filter((T) => T.dist > 28 && T.H > 22).sort((p, q) => rnd(p.i, 40) - rnd(q.i, 40)).slice(0, 7);
  const glowT = radial([[0, "rgba(255,255,255,0.6)"], [0.5, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]]);
  cand.forEach((T, k) => {
    const col = NEONS[k % 3], b = new THREE.Group(); b.position.set(T.x, T.H, T.z); b.rotation.y = Math.atan2(casino[0] - T.x, casino[1] - T.z); g.add(b);
    put(b, new THREE.PlaneGeometry(9, 5.6), bas({ map: billboardTex(k, col, k * 17 + 3), side: THREE.DoubleSide, toneMapped: false }), 0, 4.8, 0, { order: 3 });
    put(b, new THREE.BoxGeometry(0.3, 2.6, 0.3), bas({ color: "#2a2a5c" }), -3, 1.3, -0.1, { order: 2 }); put(b, new THREE.BoxGeometry(0.3, 2.6, 0.3), bas({ color: "#2a2a5c" }), 3, 1.3, -0.1, { order: 2 });
    const h = put(b, new THREE.PlaneGeometry(17, 12), addm(glowT, 0.5), 0, 4.8, -0.3, { order: 4 }); h.material.color.set(col);
  });

  // -- the casino
  const C = new THREE.Group(); C.position.set(casino[0], 0, casino[1]); g.add(C);
  const fr = facadeTex(30, 14, true, 11), sd = facadeTex(20, 14, false, 12), bk = facadeTex(30, 14, false, 13);
  const bodyM = [bas({ map: sd }), bas({ map: sd }), bas({ map: roofTex() }), bas({ color: "#3a2a18" }), bas({ map: fr }), bas({ map: bk })];
  put(C, new THREE.BoxGeometry(30, 14, 20), bodyM, 0, 7, 0, { order: 1 });
  const gold = bas({ map: goldTex() }), domeM = bas({ map: domeTex(), toneMapped: false }), drumM = bas({ map: drumTex(), toneMapped: false });
  for (const sz of [-1, 1]) put(C, new THREE.BoxGeometry(31, 0.7, 0.8), gold, 0, 14.15, sz * 10.3, { order: 2 });
  for (const sx of [-1, 1]) put(C, new THREE.BoxGeometry(0.8, 0.7, 20), gold, sx * 15.3, 14.15, 0, { order: 2 });
  put(C, new THREE.CylinderGeometry(7.2, 7.4, 1.6, 48), drumM, 0, 14.8, 0, { order: 2 });
  put(C, new THREE.SphereGeometry(7, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), domeM, 0, 15.2, 0, { order: 2 });
  put(C, new THREE.CylinderGeometry(1.1, 1.3, 1.6, 16), drumM, 0, 22.6, 0, { order: 2 }); put(C, new THREE.SphereGeometry(1.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeM, 0, 23.4, 0, { order: 2 });
  put(C, new THREE.ConeGeometry(0.22, 2.6, 8), gold, 0, 25.0, 0, { order: 2 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    put(C, new THREE.CylinderGeometry(1.6, 1.7, 3, 20), drumM, sx * 14, 15.5, sz * 9, { order: 2 }); put(C, new THREE.SphereGeometry(1.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeM, sx * 14, 17, sz * 9, { order: 2 });
    put(C, new THREE.ConeGeometry(0.12, 1.4, 6), gold, sx * 14, 19.3, sz * 9, { order: 2 });
  }
  // the entrance canopy on two columns
  put(C, new THREE.BoxGeometry(8.6, 0.5, 4), gold, 0, 5.4, 12, { order: 2 });
  for (const sx of [-1, 1]) put(C, new THREE.CylinderGeometry(0.34, 0.4, 5.4, 16), gold, sx * 3.8, 2.7, 13.6, { order: 2 });
  const bulbT = radial([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,230,160,0.8)"], [1, "rgba(255,200,100,0)"]], 64);
  for (let k = 0; k < 15; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bulbT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false })); s.material.userData.noOutline = true; s.scale.set(0.6, 0.6, 1); s.position.set(-4 + k * 0.57, 5.1, 14.05); ghost(s, 5); C.add(s); }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, "rgba(255,210,120,0.8)"], [0.35, "rgba(255,170,70,0.35)"], [1, "rgba(255,140,50,0)"]], 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.4 }));
  halo.material.userData.noOutline = true; halo.scale.set(46, 46, 1); halo.position.set(0, 17, 0); ghost(halo, 6); C.add(halo);
  const pool = put(C, new THREE.PlaneGeometry(44, 34), addm(radial([[0, "rgba(255,200,110,0.55)"], [0.5, "rgba(255,160,70,0.2)"], [1, "rgba(255,140,50,0)"]], 128), 1), 0, 0.05, 6, { order: 3 }); pool.rotation.x = -Math.PI / 2;
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ nightskyline
function buildSkyline(P) {
  const S = P.spec, w = S.w ?? 30, h = S.h ?? 14, r = S.r ?? 18, a = w / r;
  const geo = new THREE.CylinderGeometry(r, r, h, 64, 1, true, Math.PI - a / 2, a);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));   // seen from inside, u runs left to right
  const m = bas({ map: tex(paintSkyline(1800, Math.round(1800 * h / w), 5), { aniso: 8 }), side: THREE.BackSide, toneMapped: false });
  put(P.whole, geo, m, 0, h / 2, 0, { order: -2 });
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the hotel
function pillowGeo(w, h, d) {
  const g = new THREE.SphereGeometry(1, 40, 24), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i), e = 0.5;
    const nx = Math.sign(sx) * Math.abs(sx) ** e, nz = Math.sign(sz) * Math.abs(sz) ** e, edge = Math.max(Math.abs(nx), Math.abs(nz));
    p.setXYZ(i, nx * w / 2, sy * h / 2 * (1 - 0.5 * edge ** 3) + h / 2, nz * d / 2);
  }
  g.computeVertexNormals(); return g;
}
function weaveTex(seed, tint = "#f4f4fa") {
  return tex(cvs(256, 256, (g, w, h) => {
    g.fillStyle = tint; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,130,170,${0.05 + 0.08 * rnd(seed + i, 1)})`; g.fillRect(rnd(seed + i, 2) * w, rnd(seed + i, 3) * h, 10 + 30 * rnd(seed + i, 4), 1); }
    g.strokeStyle = "rgba(120,130,170,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2 + 2); g.stroke();   // the seam round the rim
  }));
}
function wallpaper(seed, wm, hm) {
  const ppm = 256;
  return tex(cvs(wm * ppm, Math.round(hm * ppm), (g, w, h) => {
    const R = (i, k = 0) => rnd(seed + i, k);
    g.fillStyle = "#1b2a5a"; g.fillRect(0, 0, w, h);
    // hand-drawn stripes, each a little wobbly and a little different
    for (let s = 0; s < wm * 9; s++) {
      const x = (s + R(s, 1) * 0.3) * (w / (wm * 9)); g.strokeStyle = `rgba(${R(s, 2) < 0.5 ? "70,100,190" : "10,16,48"},${0.18 + 0.2 * R(s, 3)})`; g.lineWidth = 6 + 10 * R(s, 4);
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 64) g.lineTo(x + (R(s * 30 + y, 5) - 0.5) * 3, y); g.stroke();
    }
    // flower-like dabs placed by hand: each its own size and turn
    for (let i = 0; i < wm * 40; i++) {
      const x = R(i, 6) * w, y = (0.12 + 0.62 * R(i, 7)) * h, s = 8 + 12 * R(i, 8), a = R(i, 9) * 6.28;
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `rgba(110,150,230,${0.12 + 0.16 * R(i, 10)})`;
      for (let k = 0; k < 4; k++) { g.rotate(1.5708); g.beginPath(); g.ellipse(0, s * 0.6, s * 0.28, s * 0.6, 0, 0, 7); g.fill(); }
      g.restore();
    }
    // stains, dado rail and panel below, shade at top
    for (let i = 0; i < 14; i++) { const gr = g.createRadialGradient(R(i, 11) * w, R(i, 12) * h * 0.7, 2, R(i, 11) * w, R(i, 12) * h * 0.7, 60 + 90 * R(i, 13)); gr.addColorStop(0, "rgba(5,8,30,0.22)"); gr.addColorStop(1, "rgba(5,8,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    const dado = h * 0.72; g.fillStyle = "#141c42"; g.fillRect(0, dado, w, h - dado);
    g.fillStyle = "#3a2a1e"; g.fillRect(0, dado - 7, w, 14); g.fillStyle = "rgba(255,230,190,0.18)"; g.fillRect(0, dado - 7, w, 3);
    for (let k = 0; k < wm * 2; k++) { g.strokeStyle = "rgba(90,120,210,0.4)"; g.lineWidth = 3; g.strokeRect(k * w / (wm * 2) + 18, dado + 26, w / (wm * 2) - 36, h - dado - 52); }
    const top = g.createLinearGradient(0, 0, 0, h * 0.25); top.addColorStop(0, "rgba(0,0,10,0.5)"); top.addColorStop(1, "rgba(0,0,10,0)"); g.fillStyle = top; g.fillRect(0, 0, w, h * 0.25);
  }));
}
function woodFloor() {
  return tex(cvs(1024, 1024, (g, w, h) => {
    const R = (i, k = 0) => rnd(300 + i, k), pl = 51;
    for (let r = 0; r < Math.ceil(h / pl); r++) {
      let x = -R(r, 1) * 300;
      while (x < w) {
        const len = 200 + 300 * R(r * 50 + x, 2), tone = R(r * 50 + x, 3); g.fillStyle = `rgb(${52 + tone * 22},${30 + tone * 14},${18 + tone * 8})`; g.fillRect(x, r * pl, len, pl - 2);
        for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(20,8,2,${0.18 + 0.2 * R(r * 99 + k + x, 4)})`; g.lineWidth = 1; g.beginPath(); const y = r * pl + 4 + k * 4.6; g.moveTo(x, y); g.bezierCurveTo(x + len * 0.3, y + (R(k + x, 5) - 0.5) * 3, x + len * 0.7, y + (R(k + x, 6) - 0.5) * 3, x + len, y); g.stroke(); }
        if (R(r * 50 + x, 7) < 0.15) { g.fillStyle = "rgba(15,5,0,0.5)"; g.beginPath(); g.ellipse(x + len * R(r + x, 8), r * pl + pl / 2, 5, 3, 0, 0, 7); g.fill(); }
        g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x, r * pl, 2, pl); x += len;
      }
      g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(0, r * pl + pl - 2, w, 2);
    }
  }));
}
function rugTex() {
  return tex(cvs(512, 352, (g, w, h) => {
    g.fillStyle = "#5a1830"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#d8a860"; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
    g.fillStyle = "#1c4a6a"; g.fillRect(44, 44, w - 88, h - 88);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { const x = 70 + i * 62 + (rnd(i * 9 + j, 1) - 0.5) * 4, y = 80 + j * 62 + (rnd(i * 9 + j, 2) - 0.5) * 4; g.fillStyle = (i + j) % 2 ? "#d8a860" : "#a0405a"; g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x + 24, y); g.lineTo(x, y + 24); g.lineTo(x - 24, y); g.closePath(); g.fill(); g.strokeStyle = "rgba(255,240,200,0.4)"; g.lineWidth = 1.5; g.stroke(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,230,200,${0.04 + 0.05 * rnd(i, 3)})`; g.fillRect(rnd(i, 4) * w, rnd(i, 5) * h, 6, 1); }
  }));
}
function duvetTex() {
  return tex(cvs(512, 512, (g, w, h) => {
    g.fillStyle = "#2f4f9a"; g.fillRect(0, 0, w, h);
    const n = 8, cell = w / n;
    for (let i = 0; i < n; i++) { g.fillStyle = `rgba(190,210,255,${0.25 + 0.05 * rnd(i, 1)})`; g.fillRect(i * cell + (rnd(i, 2) - 0.5) * 3, 0, cell / 2, h); }
    for (let j = 0; j < n; j++) { g.fillStyle = `rgba(190,210,255,${0.3 + 0.05 * rnd(j, 3)})`; g.fillRect(0, j * cell + (rnd(j, 4) - 0.5) * 3, w, cell / 2); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(5,10,40,${0.05 + 0.08 * rnd(i, 5)})`; g.fillRect(rnd(i, 6) * w, rnd(i, 7) * h, 3 + 20 * rnd(i, 8), 1 + rnd(i, 9) * 2); }
  }));
}
function curtainTex(seed) {
  return tex(cvs(256, 512, (g, w, h) => {
    g.fillStyle = "#26469a"; g.fillRect(0, 0, w, h);
    const f = 7;
    for (let k = 0; k < f; k++) { const x0 = (k / f) * w; const gr = g.createLinearGradient(x0, 0, x0 + w / f, 0); gr.addColorStop(0, "rgba(4,10,50,0.55)"); gr.addColorStop(0.5, "rgba(120,160,255,0.28)"); gr.addColorStop(1, "rgba(4,10,50,0.55)"); g.fillStyle = gr; g.fillRect(x0, 0, w / f, h); }
    for (let i = 0; i < 80; i++) { g.strokeStyle = `rgba(150,180,255,${0.06 + 0.08 * rnd(seed + i, 1)})`; g.beginPath(); const x = rnd(seed + i, 2) * w; g.moveTo(x, 0); g.lineTo(x + (rnd(seed + i, 3) - 0.5) * 6, h); g.stroke(); }
    g.fillStyle = "#16286a"; g.fillRect(0, h - 28, w, 28); g.fillStyle = "#c8a050"; g.fillRect(0, h - 28, w, 3);
    const tp = g.createLinearGradient(0, 0, 0, 90); tp.addColorStop(0, "rgba(0,0,10,0.45)"); tp.addColorStop(1, "rgba(0,0,10,0)"); g.fillStyle = tp; g.fillRect(0, 0, w, 90);
  }));
}
function glassTex() {
  return tex(cvs(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (const [x, wd, a] of [[40, 22, 0.1], [90, 8, 0.07], [170, 30, 0.08]]) { g.fillStyle = `rgba(190,210,255,${a})`; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + wd, 0); g.lineTo(x + wd - 70, h); g.lineTo(x - 70, h); g.closePath(); g.fill(); }
  }));
}

function bedInto(parent, ox, oz, solid) {
  const g = new THREE.Group(); g.position.set(ox, 0, oz); parent.add(g);
  const wood = std({ color: "#34200f", roughness: 0.6, emissive: "#0d0804" }), sheet = std({ map: weaveTex(1, "#e8ecf4"), color: "#ffffff", emissive: "#15182a", emissiveMap: null }), pillM = std({ map: weaveTex(2), color: "#ffffff", emissive: "#202436" });
  const duvetM = std({ map: duvetTex(), color: "#ffffff", emissive: "#0c1840" }), padM = std({ color: "#1c2e66", roughness: 0.9, emissive: "#080e26" });
  const part = (geo, m, x, y, z) => put(g, geo, m, x, y, z, { solid, ghosted: false });
  // frame, mattress, legs
  part(new THREE.BoxGeometry(1.56, 0.16, 1.96), wood, 0, 0.3, 0.33);
  part(new RoundedBoxGeometry(1.5, 0.2, 1.9, 3, 0.05), sheet, 0, 0.4, 0.33);
  for (const sx of [-1, 1]) for (const z of [-0.6, 1.24]) part(new THREE.BoxGeometry(0.09, 0.22, 0.09), wood, sx * 0.72, 0.11, z);
  // headboard: dark wood with a padded blue panel
  part(new THREE.BoxGeometry(1.7, 1.1, 0.08), wood, 0, 0.55, -0.67); part(new RoundedBoxGeometry(1.4, 0.55, 0.1, 3, 0.05), padM, 0, 0.78, -0.62);
  // two pillows against it
  for (const sx of [-1, 1]) { const p = part(pillowGeo(0.58, 0.16, 0.4), pillM, sx * 0.38, 0.5, -0.43); p.rotation.x = -0.35; p.position.y = 0.5; }
  // the duvet over the lower two thirds, a white fold at its top edge, draped at the foot
  part(new RoundedBoxGeometry(1.62, 0.1, 1.45, 4, 0.04), duvetM, 0, 0.55, 0.6 + 0.0);
  part(new RoundedBoxGeometry(1.62, 0.34, 0.1, 3, 0.04), duvetM, 0, 0.42, 1.31);
  const fold = part(new RoundedBoxGeometry(1.6, 0.07, 0.22, 3, 0.03), sheet, 0, 0.607, -0.1); void fold;
  return g;
}

function buildHotelRoom(P) {
  const S = P.spec, g = P.whole, WIN = HOTEL.window, wx0 = WIN.cx - WIN.w / 2, wx1 = WIN.cx + WIN.w / 2, wy1 = WIN.y0 + WIN.h;
  const wpBack = wallpaper(1, 4, 3), wpL = wallpaper(2, 4, 3), wpR = wallpaper(3, 4, 3);
  const wm = (map) => std({ map, color: "#ffffff", emissive: "#223a80", emissiveMap: map, emissiveIntensity: 0.35, side: THREE.DoubleSide });
  const mB = wm(wpBack), mL = wm(wpL), mR = wm(wpR);
  // the floor and baseboards
  const fl = put(g, new THREE.PlaneGeometry(4, 4), std({ map: woodFloor(), color: "#ffffff", emissive: "#2a1a10", emissiveMap: null, roughness: 0.55 }), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = false;
  const rug = put(g, new THREE.PlaneGeometry(3.4, 1.8), std({ map: rugTex(), color: "#ffffff", emissive: "#2a1020" }), -0.3, 0.012, 0.3); rug.rotation.x = -Math.PI / 2;
  // a wall made of rectangles (the back wall has the window cut out); uv from the whole wall so the paper runs on
  const wallPiece = (m, ax, x0, x1, y0, y1) => {
    const geo = new THREE.PlaneGeometry(x1 - x0, y1 - y0), uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (x0 + pos.getX(i) + (x1 - x0) / 2 + 2) / 4, (y0 + pos.getY(i) + (y1 - y0) / 2) / 3);
    const o = put(g, geo, m, 0, 0, 0); ax(o, (x0 + x1) / 2, (y0 + y1) / 2); return o;
  };
  const onBack = (o, x, y) => o.position.set(x, y, -2), onLeft = (o, x, y) => { o.rotation.y = Math.PI / 2; o.position.set(-2, y, x); }, onRight = (o, x, y) => { o.rotation.y = -Math.PI / 2; o.position.set(2, y, -x); };
  wallPiece(mB, onBack, -2, wx0, 0, 3); wallPiece(mB, onBack, wx1, 2, 0, 3); wallPiece(mB, onBack, wx0, wx1, 0, WIN.y0); wallPiece(mB, onBack, wx0, wx1, wy1, 3);
  // side walls: x runs along z for them (left: from -2 to 2 seen from inside, right mirrored)
  { const geo = new THREE.PlaneGeometry(4, 3); const a = put(g, geo, mL, -2, 1.5, 0); a.rotation.y = Math.PI / 2; const b = put(g, geo.clone(), mR, 2, 1.5, 0); b.rotation.y = -Math.PI / 2; }
  const trim = std({ color: "#120c08", roughness: 0.5, emissive: "#050302" });
  const tb = (w, h, d, x, y, z) => put(g, new THREE.BoxGeometry(w, h, d), trim, x, y, z);
  tb(4, 0.12, 0.05, 0, 0.06, -1.975); tb(0.05, 0.12, 4, -1.975, 0.06, 0); tb(0.05, 0.12, 4, 1.975, 0.06, 0);
  // the window: dark frames, a mullion cross, a sill, ghost glass (a faint reflection of the room)
  tb(WIN.w + 0.2, 0.1, 0.12, WIN.cx, wy1 + 0.05, -1.94); tb(WIN.w + 0.2, 0.1, 0.12, WIN.cx, WIN.y0 - 0.05, -1.94); tb(0.1, WIN.h, 0.12, wx0 - 0.05, WIN.y0 + WIN.h / 2, -1.94); tb(0.1, WIN.h, 0.12, wx1 + 0.05, WIN.y0 + WIN.h / 2, -1.94);
  tb(0.05, WIN.h, 0.06, WIN.cx, WIN.y0 + WIN.h / 2, -1.97); tb(WIN.w, 0.05, 0.06, WIN.cx, WIN.y0 + WIN.h * 0.55, -1.97); tb(WIN.w + 0.3, 0.05, 0.2, WIN.cx, WIN.y0 - 0.1, -1.88);
  put(g, new THREE.PlaneGeometry(WIN.w, WIN.h), bas({ map: glassTex(), transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }), WIN.cx, WIN.y0 + WIN.h / 2, -1.985, { order: 3 });
  // heavy curtains drawn aside: a wavy panel with its folds painted to match, on a brass rod
  const curtain = (x0, x1, seed) => {
    const wd = x1 - x0, nSeg = 24, geo = new THREE.PlaneGeometry(wd, 2.9, nSeg, 8), pos = geo.attributes.position, folds = Math.max(3, Math.round(wd / 0.16));
    for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.06 * Math.sin(((pos.getX(i) / wd + 0.5) * folds * 2 - 0.5) * Math.PI) * (0.6 + 0.4 * (pos.getY(i) / 2.9 + 0.5)));
    geo.computeVertexNormals();
    put(g, geo, std({ map: curtainTex(seed), color: "#ffffff", emissive: "#0a1850", emissiveMap: null, side: THREE.DoubleSide, roughness: 0.95 }), (x0 + x1) / 2, 1.5, -1.84);
  };
  curtain(-1.92, -0.7, 5); curtain(1.5, 1.97, 6);
  const brass = std({ color: "#8a6a30", roughness: 0.4, metalness: 0.4, emissive: "#1a1206" });
  const rod = put(g, new THREE.CylinderGeometry(0.025, 0.025, 4, 10), brass, 0, 2.97, -1.82); rod.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) put(g, new THREE.SphereGeometry(0.05, 10, 8), brass, sx * 1.98, 2.97, -1.82);
  // bedside table with a lamp that is OFF
  const [tx, tz] = HOTEL.table, woodM = std({ color: "#3a2412", roughness: 0.6, emissive: "#0c0703" });
  const tp = (geo, m, x, y, z) => put(g, geo, m, tx + x, y, tz + z, { solid: true, ghosted: false });
  tp(new THREE.BoxGeometry(0.45, 0.04, 0.45), woodM, 0, 0.48, 0); tp(new THREE.BoxGeometry(0.4, 0.22, 0.4), woodM, 0, 0.35, 0);
  tp(new THREE.BoxGeometry(0.34, 0.12, 0.02), std({ color: "#4a2e16", emissive: "#0c0703" }), 0, 0.36, 0.205); tp(new THREE.SphereGeometry(0.018, 8, 6), brass, 0, 0.36, 0.225);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tp(new THREE.BoxGeometry(0.04, 0.24, 0.04), woodM, sx * 0.19, 0.12, sz * 0.19);
  tp(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 14), brass, 0, 0.52, 0); tp(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), brass, 0, 0.62, 0);
  tp(new THREE.CylinderGeometry(0.09, 0.15, 0.17, 18, 1, true), std({ color: "#8a8478", side: THREE.DoubleSide, emissive: "#0a0a10" }), 0, 0.74, 0);
  // the bed
  if ((S.bed ?? 1) > 0) bedInto(g, HOTEL.bed[0], HOTEL.bed[1], true);
  // dim light: a blue point light under the ceiling and a violet glow from the city at the window
  const room = new THREE.PointLight("#6f8cff", 4.5, 9, 1.3); room.position.set(0, 2.5, 0.2); g.add(room);
  const city = new THREE.PointLight("#b070ff", 3.2, 6, 1.4); city.position.set(WIN.cx, 1.7, -1.4); g.add(city);
  return { grip: HOTEL.seat };
}
function buildHotelBed(P) { bedInto(P.whole, 0, 0, true); return { grip: HOTEL.seat }; }
function buildHotelPillow(P) {
  const m = std({ map: weaveTex(9), color: "#ffffff", emissive: "#20243a", roughness: 0.9 });
  put(P.whole, pillowGeo(0.5, 0.12, 0.3), m, 0, 0, 0, { ghosted: false });
  return { grip: 0.066 };
}

export const NIGHTCITY_KINDS = {
  neoncity: buildCity,
  nightskyline: buildSkyline,
  hotelroom: buildHotelRoom,
  hotelbed: buildHotelBed,
  hotelpillow: buildHotelPillow,
};
