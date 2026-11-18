import * as THREE from "three";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// "scoreroom": Mash's room for "I could see everyone's happiness score" (Happiness 03), ONE room in two states.
// REAL 3D geometry with hand-painted canvas textures (the paintings plates/painted/RM-N.webp, RM-D.webp, RM-D2.webp are only
// the look targets). A timber room: weathered painted boards, wide dark oak floor, dark ceiling with beams and one post.
//   state "party"   Saturday night: gold light on the left two thirds (strings of lights are the director's props), a cool blue
//                   third on the right, a soft clear light edge on the floor and walls at x 1.35 (the post stands on it), a
//                   worn red rug, a full bookcase, a wall of books and plants, box stacks, pictures, a dark window on the town.
//   state "sunday"  the same room the morning after: cold grey-blue light, nearly empty (bare bookcase and ladder shelf, pale
//                   ghosts where the pictures hung, the rug rolled up in a corner), a radiator, tape scraps, two closed boxes
//                   as seats, autumn roofs in the window, the open cream door of the door wall.
//
// COORDINATES (metres, y up). Room 6.4 x 5.0 x 2.6. A character's front is +z.
//   floor y 0, x -3.2 .. 3.2, z -2.5 .. 2.5; ceiling y 2.6 (beams hang to 2.38)
//   BACK wall   z -2.5 (faces +z): bookcase x 0.0..1.25 (2.05 tall, 0.3 deep), pictures, box stacks at the left corner
//   RIGHT wall  x +3.2 (faces -x): the WINDOW z -2.1..-0.3, y 1.0..2.4 (sill 1.0), radiator under it, the ladder shelf z 0.25..1.45
//   LEFT wall   x -3.2 (faces +x): box pillar at the front corner (party)
//   FRONT wall  z +2.5 (faces -z): the DOOR opening x 1.9..2.9, 2.0 tall (hinge on the +x side, so the leaf swings into the room
//               along the right wall). Beyond it a dim hall. The cream `frontdoor` prop goes in ROOM.door.frontdoor.
//   the post    (1.35, z -2.38) 0.14 square, and a ceiling beam along z on x 1.35: the light edge of the party
//   hooks for the string lights: nails along the beams y 2.25..2.38 (strings hang over x -3.0 .. +0.8)
// ROOM (exported) has these numbers, the light edge, the seats, the stand spots per panel group and the cameras the bench used.
//
// spec (every key optional):
//   state "party"|"sunday"   the room's state (default "party")
//   seed 5                   the painted textures and the layout of books, leaves, scraps
//   door                     "shut" (party default: a closed cream door leaf in the opening) | "open" (a cream leaf swung 80 deg,
//                            hinged at x 2.9) | "none" (sunday default: the open doorway on the dim hall, for the `frontdoor` prop)
//   stacks true              party: the box stacks (back-left corner, left front corner, right front corner); false: leave the room
//                            for the director's own `cardbox` props
//   seats true               sunday: the two closed boxes (0.42 high) as seats, centres 0.95 apart (ROOM.seats); false: use props
//   scraps true              sunday: the tape scraps on the floor (ROOM.scraps)
//   plants true              pots and trailing pothos
//   view true                the painted far view card behind the window (night town / morning roofs and autumn trees)
// Light: the party's gold / blue and the cold morning are BAKED into the surfaces (vertex colours), because the drawn look
// ignores point lights. The key light only gives the toon shadow band. Recommend (set block of the storyboard):
//   party   "light": "golden", "key": [-1.5, 2.2, 4.0], "shadowSize": 5, "windows": false
//   sunday  (no "light"),      "key": [-1.5, 2.2, 4.0], "shadowSize": 5   (a frontal key: no diagonal shadow bands on the walls)
// Nothing here is solid for the checks. Triangles: about 60k. Deterministic: util.js rng only, no clock.

export const ROOM = {
  x: [-3.2, 3.2], z: [-2.5, 2.5], h: 2.6, edgeX: 1.35,
  window: { z: [-2.1, -0.3], y: [1.0, 2.4], wallX: 3.2 },
  door: { x: [1.9, 2.9], h: 2.0, frontdoor: { kind: "frontdoor", x: 2.9, hinge: "right", y: 0, z: 2.46, w: 1.0, h: 2.0, color: "#d8c4a4", angle: 80 } },
  post: { x: 1.35, z: -2.38 },
  radiator: { x: 3.1, z: -0.8, w: 1.0, h: 0.62 },
  seatH: 0.42,
  seats: [{ x: 2.15, z: -1.7, w: 0.5, h: 0.42, d: 0.58 }, { x: 2.15, z: -0.75, w: 0.5, h: 0.42, d: 0.58 }],
  rug: { x: -1.1, z: -0.3, w: 2.8, d: 1.9, rotDeg: 3 },
  scraps: [[0.9, -1.0], [1.5, 0.5], [0.0, 1.0], [1.9, -2.1]],
  stacks: [{ name: "back-left", x: [-3.2, -2.1], z: [-2.5, -1.75], top: 1.25 }, { name: "left-front pillar", x: [-3.2, -2.6], z: [0.3, 1.0], top: 1.55 }, { name: "right-front", x: [2.55, 3.2], z: [1.75, 2.5], top: 0.95 }],
  // stand spots (x, z, y) per panel group; y is the surface under the feet. The camera of each is the bench's.
  spots: {
    "16-17 dance (party)": { chip: [-2.0, -0.7, 0], wedge: [-1.0, -0.75, 0], mash: [0.1, -0.7, 0], speaker: "a closed box at x -2.75, z -0.5, top y 0.5 (director's prop)" },
    "18, 22 Spud at the window (party)": { spud: [2.3, -1.3, 0] },
    "19 Chip + Spud (party)": { chip: [1.0, 0.5, 0], spud: [1.6, 0.4, 0] },
    "20 party wide": { spud: [2.3, -1.3, 0], chip: [-2.0, -0.7, 0], wedge: [-1.0, -0.75, 0], mash: [0.1, -0.7, 0] },
    "24 Spud among boxes (party)": { spud: [1.0, 0.9, 0] },
    "25-28 Spud searching (sunday)": { spud: [1.3, -0.2, 0], box: "a `cardbox` at x 1.0, z 0.3" },
    "31 door wall (sunday)": { mash: [1.3, 1.5, 0], door: "frontdoor leaf at x 2.9 hinge right, z 2.46" },
    "32-33 seats (sunday)": { spud: [2.15, -1.7, 0.42], mash: [2.15, -0.75, 0.42] },
    "34 taping (sunday)": { mash: [-0.2, -1.2, 0], spud: [2.15, -1.7, 0.42] },
    "35 window gaze (sunday)": { spud: [2.2, -1.2, 0] },
  },
};

const DEG = Math.PI / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;
const hash2 = (i, j, s) => { let h = Math.imul(i * 374761393 + j * 668265263 + s * 1274126177, 1103515245) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, s = 1) {
  const i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
  const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function ctex(c, rx = 1, ry = 1, repeat = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); return t;
}
const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...o }); m.userData.noOutline = true; return m; };
const lam = (color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const shade = (hex, k) => { const c = new THREE.Color(hex); const o = { r: Math.round(c.r ** (1 / 2.2) * 255 * k), g: Math.round(c.g ** (1 / 2.2) * 255 * k), b: Math.round(c.b ** (1 / 2.2) * 255 * k) }; return `rgb(${Math.min(255, o.r)},${Math.min(255, o.g)},${Math.min(255, o.b)})`; };
function fitRun(rnd, total, lo, hi) {
  const a = []; let s = 0;
  while (s < total - hi) { const v = lo + rnd() * (hi - lo); a.push(v); s += v; }
  a.push(total - s); if (a[a.length - 1] < lo * 0.6 && a.length > 1) { const l = a.pop(); a[a.length - 1] += l; }
  return a;
}
const tint = (hex, rnd, dh = 0.012, ds = 0.06, dl = 0.07) => new THREE.Color(hex).offsetHSL((rnd() - 0.5) * dh * 2, (rnd() - 0.5) * ds * 2, (rnd() - 0.5) * dl * 2);

// ================================================================================================================ painters
// weathered painted timber boards, 9 boards to 2.6 m (0.29 each): pale greige paint worn through to brown wood, knots, nails
function wallCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), nb = 9, bw = S / nb;
  g.fillStyle = "#3a2c20"; g.fillRect(0, 0, S, S);
  const pal = ["#b9ab91", "#b0a386", "#bdb097", "#a99c81", "#b4a78c", "#c1b59d", "#a59a7e"];
  for (let i = 0; i < nb; i++) {
    const x = i * bw, base = pal[Math.floor(rnd() * pal.length)], k = 0.9 + rnd() * 0.2;
    const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, shade(base, k * 1.05)); gr.addColorStop(1, shade(base, k * 0.9));
    g.fillStyle = gr; g.fillRect(x + 3, 0, bw - 6, S);
    for (let n = 0; n < 50; n++) {   // grain
      const gx = x + 6 + rnd() * (bw - 12); g.strokeStyle = rnd() < 0.6 ? `rgba(70,56,40,${0.05 + rnd() * 0.1})` : `rgba(255,246,226,${0.06 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 1.6;
      g.beginPath(); let y = 0; g.moveTo(gx, 0); while (y < S) { y += 30 + rnd() * 50; g.lineTo(gx + (vnoise(gx * 0.05, y * 0.01, i) - 0.5) * 9, y); } g.stroke();
    }
    for (let n = 0; n < 4; n++) {   // paint worn through to the brown wood, mostly along the edges and low down
      const px = rnd() < 0.5 ? x + 4 + rnd() * 14 : x + bw - 18 - rnd() * 14, py = (rnd() ** 0.7) * S, ph = 60 + rnd() * 340, pw = 8 + rnd() * 26;
      g.fillStyle = `rgba(${[132, 98, 64][0]},${98},${64},${0.35 + rnd() * 0.3})`; g.beginPath();
      g.moveTo(px, py); for (let t = 1; t <= 6; t++) g.lineTo(px + (rnd() - 0.3) * pw, py + (t / 6) * ph); for (let t = 6; t >= 0; t--) g.lineTo(px + pw * (0.4 + rnd() * 0.6), py + (t / 6) * ph); g.fill();
    }
    for (let n = 0; n < Math.floor(rnd() * 2.4); n++) {   // knots
      const kx = x + bw * (0.25 + rnd() * 0.5), ky = rnd() * S, r = 9 + rnd() * 12;
      const kg = g.createRadialGradient(kx, ky, 1, kx, ky, r * 2.4); kg.addColorStop(0, "rgba(60,42,28,0.8)"); kg.addColorStop(0.45, "rgba(90,66,44,0.45)"); kg.addColorStop(1, "rgba(90,66,44,0)");
      g.fillStyle = kg; g.beginPath(); g.ellipse(kx, ky, r * 1.1, r * 2.4, 0, 0, 7); g.fill();
    }
    for (const ny of [0.1, 0.5, 0.9]) for (const dx of [0.28, 0.72]) {   // nails
      const nx = x + bw * dx, nyy = S * ny + (rnd() - 0.5) * 6; g.fillStyle = "rgba(50,40,34,0.75)"; g.beginPath(); g.arc(nx, nyy, 3.2, 0, 7); g.fill(); g.fillStyle = "rgba(255,244,222,0.3)"; g.fillRect(nx - 1, nyy - 4.4, 2, 1.4);
    }
    g.fillStyle = "rgba(34,26,20,0.85)"; g.fillRect(x, 0, 3.4, S); g.fillStyle = "rgba(255,246,226,0.2)"; g.fillRect(x + 4, 0, 2, S); g.fillStyle = "rgba(34,26,20,0.3)"; g.fillRect(x + bw - 7, 0, 3, S);
  }
  for (let n = 0; n < 40; n++) { const cx = rnd() * S, cy = rnd() * S, r = 60 + rnd() * 220, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); const dk = rnd() < 0.55; rg.addColorStop(0, dk ? "rgba(70,54,38,0.1)" : "rgba(255,248,230,0.1)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  return c;
}
// wide dark oak boards running along the canvas y (the room's z), butt joints staggered, nail heads, scuffs, a soft sheen. 2.2 m square.
function floorCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), nb = 10, bw = S / nb, ppm = S / 2.2;
  g.fillStyle = "#1f1710"; g.fillRect(0, 0, S, S);
  const pal = ["#5d4635", "#523f2f", "#684e3a", "#4c3a2c", "#5f4a3b", "#6d5440", "#57402f"];
  for (let i = 0; i < nb; i++) {
    const x = i * bw; let y = -rnd() * 0.8 * ppm;
    for (const L of fitRun(rnd, S + 0.8 * ppm, 0.9 * ppm, 1.5 * ppm)) {
      const y0 = Math.max(0, y), y1 = Math.min(S, y + L), base = pal[Math.floor(rnd() * pal.length)], k = 0.88 + rnd() * 0.26;
      if (y1 > y0) {
        g.fillStyle = shade(base, k); g.fillRect(x + 2, y0 + 2, bw - 4, y1 - y0 - 4);
        for (let n = 0; n < 34; n++) { const gx = x + 5 + rnd() * (bw - 10), a = rnd() * (y1 - y0), l = 40 + rnd() * 220; g.strokeStyle = rnd() < 0.6 ? `rgba(24,16,10,${0.1 + rnd() * 0.16})` : `rgba(210,176,138,${0.05 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); g.moveTo(gx, y0 + a); g.lineTo(gx + (rnd() - 0.5) * 6, Math.min(y1, y0 + a + l)); g.stroke(); }
        for (let n = 0; n < 4; n++) { g.strokeStyle = `rgba(222,190,150,${0.05 + rnd() * 0.08})`; g.lineWidth = 1.2; const sx = x + 6 + rnd() * (bw - 12), sy = y0 + rnd() * (y1 - y0); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (rnd() - 0.5) * 70, sy + (rnd() - 0.5) * 20); g.stroke(); }   // scuffs
        for (const ey of [y0 + 18, y1 - 18]) for (const dx of [0.25, 0.75]) { g.fillStyle = "rgba(20,14,10,0.8)"; g.beginPath(); g.arc(x + bw * dx, ey, 3.4, 0, 7); g.fill(); g.fillStyle = "rgba(255,230,190,0.28)"; g.fillRect(x + bw * dx - 1, ey - 4.6, 2, 1.4); }
        g.fillStyle = "rgba(14,10,6,0.9)"; g.fillRect(x + 2, y1 - 4, bw - 4, 3.6); g.fillStyle = "rgba(255,236,200,0.14)"; g.fillRect(x + 2, y0, bw - 4, 2);
      }
      y += L;
    }
    g.fillStyle = "rgba(12,8,5,0.9)"; g.fillRect(x, 0, 3.4, S); g.fillStyle = "rgba(255,236,200,0.12)"; g.fillRect(x + 4, 0, 2, S);
  }
  for (let n = 0; n < 30; n++) { const cx = rnd() * S, cy = rnd() * S, r = 80 + rnd() * 260, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rnd() < 0.5 ? "rgba(235,205,170,0.09)" : "rgba(20,12,6,0.1)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  return c;
}
function ceilCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S), nb = 9, bw = S / nb;
  g.fillStyle = "#1e150e"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < nb; i++) { const k = 0.8 + rnd() * 0.4; g.fillStyle = shade("#4a3727", k); g.fillRect(i * bw + 2, 0, bw - 4, S); for (let n = 0; n < 16; n++) { g.strokeStyle = `rgba(20,12,6,${0.1 + rnd() * 0.15})`; g.lineWidth = 1.2; const gx = i * bw + 4 + rnd() * (bw - 8); g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx + (rnd() - 0.5) * 6, S); g.stroke(); } }
  return c;
}
function kraftCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S);
  g.fillStyle = "#c79a62"; g.fillRect(0, 0, S, S);
  for (let n = 0; n < 40; n++) { const cx = rnd() * S, cy = rnd() * S, r = 30 + rnd() * 120, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rnd() < 0.5 ? "rgba(120,80,40,0.12)" : "rgba(240,210,160,0.14)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let n = 0; n < 520; n++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? "120,82,40" : "236,206,160"},${0.08 + rnd() * 0.12})`; g.lineWidth = 1; g.beginPath(); const x = rnd() * S, y = rnd() * S; g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 36, y + (rnd() - 0.5) * 6); g.stroke(); }
  for (let n = 0; n < 6; n++) { g.strokeStyle = "rgba(90,58,26,0.22)"; g.lineWidth = 2; g.beginPath(); const y = rnd() * S; g.moveTo(0, y); g.lineTo(S, y + (rnd() - 0.5) * 8); g.stroke(); }
  return c;
}
// a worn Persian rug: red field and border, navy bands, a cream medallion, fringe (alpha) at both short ends
function rugCanvas(rnd, W = 1024, H = 720) {
  const [c, g] = canvas(W, H), F = 34;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = "#e9dcc0"; g.lineWidth = 3;
  for (let y = 6; y < H - 6; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(F + 4, y + (rnd() - 0.5) * 4); g.moveTo(W, y); g.lineTo(W - F - 4, y + (rnd() - 0.5) * 4); g.stroke(); }
  const x0 = F, w = W - 2 * F;
  g.fillStyle = "#8f2a1e"; g.fillRect(x0, 0, w, H);
  const band = (inset, wd, col) => { g.fillStyle = col; g.fillRect(x0 + inset, inset, w - 2 * inset, H - 2 * inset); };
  band(0, 0, "#8f2a1e"); band(14, 0, "#e3d3ac"); band(22, 0, "#7a2018"); band(46, 0, "#20345f"); band(78, 0, "#b3382a"); band(88, 0, "#e3d3ac"); band(94, 0, "#2a3f6a");
  const fx = x0 + 100, fy = 100, fw = w - 200, fh = H - 200;
  g.fillStyle = "#8f2a1e"; g.fillRect(fx, fy, fw, fh);
  for (let y = fy + 18; y < fy + fh - 10; y += 38) for (let x = fx + 18 + ((y / 38) % 2) * 19; x < fx + fw - 10; x += 38) { g.fillStyle = `rgba(222,190,130,${0.45 + rnd() * 0.25})`; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 7, y); g.lineTo(x, y + 8); g.lineTo(x - 7, y); g.fill(); }
  const cx = W / 2, cy = H / 2;
  for (const [rx, ry, col] of [[250, 140, "#2a3f6a"], [215, 118, "#e3d3ac"], [180, 98, "#2a3f6a"], [140, 76, "#b3382a"], [95, 52, "#e3d3ac"]]) { g.fillStyle = col; g.beginPath(); g.moveTo(cx - rx, cy); g.lineTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.fill(); }
  for (let a = 0; a < 8; a++) { g.fillStyle = a % 2 ? "#d9a441" : "#7a2018"; g.beginPath(); g.ellipse(cx + Math.cos(a * 0.785) * 40, cy + Math.sin(a * 0.785) * 22, 14, 6, a * 0.785, 0, 7); g.fill(); }
  for (let x = x0 + 56; x < x0 + w - 50; x += 30) for (const y of [56, H - 56]) { g.fillStyle = "#e3d3ac"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = "#8f2a1e"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  for (let y = 56; y < H - 50; y += 30) for (const x of [x0 + 56, x0 + w - 56]) { g.fillStyle = "#e3d3ac"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = "#8f2a1e"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  for (let n = 0; n < 70; n++) { const px = x0 + rnd() * w, py = rnd() * H, r = 20 + rnd() * 70, rg = g.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, rnd() < 0.6 ? "rgba(240,224,190,0.16)" : "rgba(30,14,10,0.14)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip(); g.fillStyle = rg; g.fillRect(px - r, py - r, 2 * r, 2 * r); g.restore(); }
  return c;
}
// a pothos leaf: heart-shaped, near-white with a soft rib (tinted by vertex colour)
function leafCanvas() {
  const S = 96, [c, g] = canvas(S, S);
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(48, 92);
  g.bezierCurveTo(10, 66, 4, 30, 30, 14); g.bezierCurveTo(40, 8, 46, 14, 48, 22); g.bezierCurveTo(50, 14, 56, 8, 66, 14); g.bezierCurveTo(92, 30, 86, 66, 48, 92); g.fill();
  g.strokeStyle = "rgba(120,130,110,0.55)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(48, 90); g.lineTo(48, 26); g.stroke();
  g.lineWidth = 1.4; for (const s of [-1, 1]) for (const y of [70, 54, 40]) { g.beginPath(); g.moveTo(48, y); g.lineTo(48 + s * 24, y - 14); g.stroke(); }
  return c;
}
function picCanvas(kind, rnd) {
  const W = 256, H = 320, [c, g] = canvas(W, H);
  if (kind === "church") {   // a pencil sketch of a cathedral on cream paper
    g.fillStyle = "#e8ddc2"; g.fillRect(0, 0, W, H); g.strokeStyle = "rgba(60,48,36,0.8)"; g.lineWidth = 1.6;
    g.strokeRect(70, 130, 116, 120); g.strokeRect(40, 160, 36, 90); g.strokeRect(180, 160, 36, 90);
    for (const x of [90, 128, 166]) { g.beginPath(); g.moveTo(x - 12, 250); g.lineTo(x - 12, 200); g.arc(x, 200, 12, Math.PI, 0); g.lineTo(x + 12, 250); g.stroke(); }
    g.beginPath(); g.moveTo(80, 130); g.lineTo(98, 70); g.lineTo(116, 130); g.moveTo(140, 130); g.lineTo(158, 70); g.lineTo(176, 130); g.stroke();
    for (let n = 0; n < 60; n++) { g.beginPath(); const y = 130 + rnd() * 120, x = 72 + rnd() * 110; g.moveTo(x, y); g.lineTo(x + 8 + rnd() * 14, y + (rnd() - 0.5) * 3); g.stroke(); }
  } else if (kind === "village") {   // a little watercolour: green hills, a spire, red roofs
    const sk = g.createLinearGradient(0, 0, 0, 170); sk.addColorStop(0, "#9fc3dd"); sk.addColorStop(1, "#e8ead0"); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    g.fillStyle = "#7fa05a"; g.beginPath(); g.moveTo(0, 170); g.quadraticCurveTo(70, 120, 140, 160); g.quadraticCurveTo(200, 130, 256, 165); g.lineTo(256, H); g.lineTo(0, H); g.fill();
    g.fillStyle = "#5f8444"; g.beginPath(); g.moveTo(0, 230); g.quadraticCurveTo(100, 190, 256, 240); g.lineTo(256, H); g.lineTo(0, H); g.fill();
    g.fillStyle = "#e8e0c8"; g.fillRect(112, 120, 22, 60); g.fillStyle = "#6a4a3a"; g.beginPath(); g.moveTo(108, 120); g.lineTo(123, 64); g.lineTo(138, 120); g.fill();
    for (const [x, y] of [[60, 180], [90, 188], [160, 184], [190, 176], [144, 196]]) { g.fillStyle = "#e6d9b8"; g.fillRect(x, y, 22, 16); g.fillStyle = "#b8452c"; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 11, y - 12); g.lineTo(x + 25, y); g.fill(); }
  } else {   // flowers: three stems on cream paper
    g.fillStyle = "#ece4cc"; g.fillRect(0, 0, W, H); g.lineWidth = 3;
    for (const [x, hh, col] of [[80, 150, "#b6402e"], [128, 100, "#d8873a"], [176, 140, "#a8384e"]]) {
      g.strokeStyle = "#4f7a3a"; g.beginPath(); g.moveTo(x, 290); g.quadraticCurveTo(x + 14, 230, x, hh + 30); g.stroke();
      for (let a = 0; a < 6; a++) { g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a * 1.05) * 14, hh + 22 + Math.sin(a * 1.05) * 14, 12, 7, a * 1.05, 0, 7); g.fill(); }
      g.fillStyle = "#e8c860"; g.beginPath(); g.arc(x, hh + 22, 6, 0, 7); g.fill();
      g.fillStyle = "#6a9a48"; g.beginPath(); g.ellipse(x + 20, 240, 22, 7, -0.5, 0, 7); g.fill();
    }
  }
  return c;
}
// the cream door: peeling paint down to blue-grey and brown wood, two panels
function doorCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S * 2);
  g.fillStyle = "#d9c7a6"; g.fillRect(0, 0, S, 2 * S);
  for (let n = 0; n < 60; n++) { const cx = rnd() * S, cy = rnd() * S * 2, r = 20 + rnd() * 80, rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rnd() < 0.5 ? "rgba(255,246,226,0.12)" : "rgba(110,86,60,0.1)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let n = 0; n < 16; n++) {   // peeled patches, more at the edges and the foot
    const px = rnd() < 0.6 ? (rnd() < 0.5 ? rnd() * 70 : S - rnd() * 70) : rnd() * S, py = rnd() ** 0.8 * S * 2, w = 20 + rnd() * 70, h = 30 + rnd() * 110;
    g.fillStyle = rnd() < 0.5 ? "rgba(122,134,152,0.8)" : "rgba(124,92,60,0.75)"; g.beginPath(); g.moveTo(px, py); for (let t = 1; t <= 7; t++) g.lineTo(px + (rnd() - 0.2) * w, py + (t / 7) * h); for (let t = 7; t >= 0; t--) g.lineTo(px - rnd() * w * 0.6, py + (t / 7) * h); g.fill();
    g.strokeStyle = "rgba(255,246,226,0.5)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + w * 0.4, py + h); g.stroke();
  }
  for (const [y0, y1] of [[0.1, 0.46], [0.54, 0.9]]) { g.strokeStyle = "rgba(90,70,50,0.55)"; g.lineWidth = 5; g.strokeRect(S * 0.16, S * 2 * y0, S * 0.68, S * 2 * (y1 - y0)); g.strokeStyle = "rgba(255,246,226,0.35)"; g.lineWidth = 2; g.strokeRect(S * 0.16 + 5, S * 2 * y0 + 5, S * 0.68 - 10, S * 2 * (y1 - y0) - 10); }
  return c;
}
function glassCanvas(party) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  g.clearRect(0, 0, W, H);
  g.fillStyle = party ? "rgba(90,120,190,0.10)" : "rgba(255,255,255,0.08)"; g.fillRect(0, party ? H * 0.5 : 0, W, party ? H * 0.5 : H);
  g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.moveTo(30, 0); g.lineTo(90, 0); g.lineTo(20, H); g.lineTo(0, H); g.lineTo(0, 150); g.fill();
  g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.moveTo(120, 0); g.lineTo(140, 0); g.lineTo(70, H); g.lineTo(50, H); g.fill();
  return c;
}
// the view through the window, painted in METRES on a card 32 m wide (z -16..16) and 15 m tall (y -3..12) standing at x 16
function viewCanvas(rnd, night) {
  const W = 4096, H = 1920, [c, g] = canvas(W, H);
  g.setTransform(128, 0, 0, -128, 2048, 1536);
  const sk = g.createLinearGradient(0, 12, 0, -3);
  if (night) { sk.addColorStop(0, "#02040e"); sk.addColorStop(0.55, "#07102b"); sk.addColorStop(0.78, "#0f1c46"); sk.addColorStop(1, "#142450"); }
  else { sk.addColorStop(0, "#9db3cf"); sk.addColorStop(0.5, "#c2cfdf"); sk.addColorStop(0.74, "#dfe3e6"); sk.addColorStop(1, "#e6e0d2"); }
  g.fillStyle = sk; g.fillRect(-17, -4, 34, 17);
  if (night) for (let n = 0; n < 220; n++) { g.fillStyle = `rgba(255,248,230,${0.3 + rnd() * 0.6})`; const s = 0.025 + rnd() * 0.03; g.fillRect(-16 + rnd() * 32, 3.6 + rnd() * 8, s, s); }
  else for (let n = 0; n < 26; n++) { const z = -16 + rnd() * 32, y = 3 + rnd() * 7, rx = 2 + rnd() * 4; for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.16 + rnd() * 0.16})`; g.beginPath(); g.ellipse(z + (rnd() - 0.5) * rx, y + (rnd() - 0.5) * 0.4, rx, 0.35 + rnd() * 0.5, 0, 0, 7); g.fill(); } }
  g.fillStyle = night ? "#050a1c" : "#9eaec2"; g.beginPath(); g.moveTo(-17, -4); for (let z = -17; z <= 17; z += 0.5) g.lineTo(z, 1.8 + 1.1 * Math.sin(z * 0.22) + 0.6 * Math.sin(z * 0.61 + 1)); g.lineTo(17, -4); g.fill();
  const house = (z, base, w, h, rh, wall, roof) => {
    g.fillStyle = wall; g.fillRect(z - w / 2, base, w, h);
    g.fillStyle = roof; g.beginPath(); g.moveTo(z - w / 2 - 0.25, base + h); g.lineTo(z, base + h + rh); g.lineTo(z + w / 2 + 0.25, base + h); g.fill();
    if (!night) { g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.moveTo(z - w / 2 - 0.25, base + h); g.lineTo(z, base + h + rh); g.lineTo(z, base + h); g.fill(); g.fillStyle = "#8c4a36"; g.fillRect(z + w * 0.22, base + h + rh * 0.35, 0.35, rh * 0.6); }
    const cols = Math.max(1, Math.floor(w / 1.3)), rows = Math.max(1, Math.floor(h / 1.6));
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      const wx = z - w / 2 + (a + 0.5) * (w / cols) - 0.22, wy = base + 0.45 + b * 1.5;
      if (night) { const lit = rnd() < 0.6; if (lit) { const rg = g.createRadialGradient(wx + 0.22, wy + 0.35, 0, wx + 0.22, wy + 0.35, 0.9); rg.addColorStop(0, "rgba(255,200,100,0.45)"); rg.addColorStop(1, "rgba(255,200,100,0)"); g.fillStyle = rg; g.fillRect(wx - 0.7, wy - 0.5, 1.8, 1.8); } g.fillStyle = lit ? "#ffd070" : "#101a38"; }
      else g.fillStyle = "#56677f";
      g.fillRect(wx, wy, 0.44, 0.7);
    }
  };
  const NU = night ? 1.1 : 0;
  const rowsDef = night
    ? [[0.5, 0.8, 32, 3.4, 1.8, ["#0f1838", "#131d40", "#0c1530"], "#0a1128"], [-0.6, 1.0, 26, 3.8, 2.0, ["#111a3a", "#172244", "#0e1734"], "#0b122a"], [-1.8, 1.2, 20, 4.2, 2.2, ["#131d40", "#18244a", "#101a38"], "#0c142c"], [-3.0, 1.4, 16, 4.6, 2.4, ["#161f44", "#1c284e", "#121b3c"], "#0d152e"]]
    : [[0.5, 0.8, 32, 3.4, 1.8, ["#c9c5bd", "#bdb8b0", "#d0c8b8"], "#5d6679"], [-0.6, 1.0, 26, 3.8, 2.0, ["#d9cfb8", "#cdbfa4", "#dfd6c0"], "#4d566a"], [-1.8, 1.2, 20, 4.2, 2.2, ["#dccdb0", "#e2d6bd", "#cfc0a2"], "#46506a"], [-3.0, 1.4, 16, 4.6, 2.4, ["#e1d2b4", "#d5c5a6", "#e6d9c0"], "#3f4962"]];
  for (const [base0, sc, n, w0, rh, walls, roof] of rowsDef) {
    const base = base0 + NU;
    for (let k = 0; k < n; k++) { const z = -16 + (k + 0.3 + rnd() * 0.5) * (32 / n), w = (w0 * (0.8 + rnd() * 0.5)) * sc * 0.8, h = (2.2 + rnd() * 1.2) * sc; house(z, base - rnd() * 0.5, w, h, rh * sc * (0.8 + rnd() * 0.4), walls[Math.floor(rnd() * walls.length)], roof); }
  }
  // the church: a tower and a spire, centre right of the window
  const tz = -0.2 + 0 * NU; g.fillStyle = night ? "#161f44" : "#d6cdb6"; g.fillRect(tz - 0.7, -1.0, 1.4, 5.6);
  g.fillStyle = night ? "#0c1530" : "#4a5468"; g.beginPath(); g.moveTo(tz - 0.85, 4.6); g.lineTo(tz, 8.8); g.lineTo(tz + 0.85, 4.6); g.fill();
  g.fillStyle = night ? "#ffd070" : "#f2ecd8"; g.beginPath(); g.arc(tz, 3.6, 0.34, 0, 7); g.fill(); g.fillStyle = night ? "#202c58" : "#8a8f98"; g.fillRect(tz - 0.25, 2.0, 0.5, 1.0);
  // autumn trees: dark trunks, crowns of many warm clumps with lit tops (day) or dark orange glow (night)
  const tree = (z, base, top, rad) => {
    g.strokeStyle = night ? "#10122a" : "#4a3a30"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(z, base); g.lineTo(z + 0.1, top - rad * 0.5); g.stroke();
    g.lineWidth = 0.12; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(z + 0.1, top - rad * 0.6); g.lineTo(z + (rnd() - 0.5) * rad * 1.6, top + (rnd() - 0.3) * rad * 0.6); g.stroke(); }
    for (let n = 0; n < 40; n++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * rad * 0.8; g.fillStyle = night ? "#140f20" : ["#9a4a22", "#a83a1e", "#b8651f"][n % 3]; g.beginPath(); g.arc(z + Math.cos(a) * r * 1.1, top + Math.sin(a) * r * 0.7, 0.45 + rnd() * 0.4, 0, 7); g.fill(); }
    const pal = night ? ["#1a1426", "#241a2c", "#2a1c26", "#201624", "#3a2022"] : ["#d9702a", "#e8a02a", "#c4361e", "#b8551f", "#f0c43a", "#d98a2a"];
    for (let n = 0; n < 640; n++) {
      const a = rnd() * 6.28, r = Math.sqrt(rnd()) * rad, cz = z + Math.cos(a) * r * 1.15, cy = top + Math.sin(a) * r * 0.75, rr = 0.1 + rnd() * 0.2, lit = clamp01((cy - top) / rad * 0.7 + 0.5);
      g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.globalAlpha = 0.95; g.beginPath(); g.arc(cz, cy, rr, 0, 7); g.fill();
      if (!night && lit > 0.55 && rnd() < 0.6) { g.fillStyle = "rgba(255,230,140,0.35)"; g.beginPath(); g.arc(cz + 0.04, cy + 0.05, rr * 0.6, 0, 7); g.fill(); }
      if (rnd() < 0.15) { g.fillStyle = night ? "rgba(0,0,10,0.4)" : "rgba(90,30,16,0.35)"; g.beginPath(); g.arc(cz - 0.05, cy - 0.06, rr * 0.55, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  };
  for (const [z, base, top, rad] of [[-10.5, -3, 2.6, 2.0], [-6.2, -3, 2.0, 1.4], [3.2, -3, 2.0, 1.5], [8.5, -3, 2.8, 2.2], [-14, -3, 3.0, 2.2], [13, -3, 2.8, 2.2]]) tree(z, base, top, rad);
  if (night) for (let n = 0; n < 30; n++) { const z = -16 + rnd() * 32, y = -1.5 + rnd() * 3; const rg = g.createRadialGradient(z, y, 0, z, y, 0.4); rg.addColorStop(0, "rgba(255,210,120,0.8)"); rg.addColorStop(1, "rgba(255,210,120,0)"); g.fillStyle = rg; g.fillRect(z - 0.4, y - 0.4, 0.8, 0.8); }
  return c;
}

// ================================================================================================================ buffers
function Buf() { return { p: [], n: [], uv: [], c: [], i: [] }; }
function bufMesh(B, mat, cast = false, recv = true) {
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
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, col) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2;
  for (const [a, d, u, v] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(col.r, col.g, col.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
const _up = new THREE.Vector3(0, 1, 0), _alt = new THREE.Vector3(1, 0, 0), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3();
function frameOf(n, spin) {
  _t1.crossVectors(Math.abs(n.y) > 0.95 ? _alt : _up, n).normalize(); _t2.crossVectors(n, _t1).normalize();
  const c = Math.cos(spin), s = Math.sin(spin);
  return [_t1.clone().multiplyScalar(c).addScaledVector(_t2, s), _t2.clone().multiplyScalar(c).addScaledVector(_t1, -s)];
}
// a subdivided plane: org + i/nu U + j/nv V, normal nrm (= U x V), per-vertex colour (the baked light), holes by cell centre
function gridPanel(B, org, U, V, nrm, step, colFn, uvFn, hole) {
  const lu = U.length(), lv = V.length(), nu = Math.max(1, Math.round(lu / step)), nv = Math.max(1, Math.round(lv / step)), b0 = B.p.length / 3, p = new THREE.Vector3(), pc = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    p.copy(org).addScaledVector(U, i / nu).addScaledVector(V, j / nv);
    B.p.push(p.x, p.y, p.z); B.n.push(nrm.x, nrm.y, nrm.z);
    const uv = uvFn(p, (i / nu) * lu, (j / nv) * lv); B.uv.push(uv[0], uv[1]);
    const c = colFn(p); B.c.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    if (hole) { pc.copy(org).addScaledVector(U, (i + 0.5) / nu).addScaledVector(V, (j + 0.5) / nv); if (hole(pc)) continue; }
    const a = b0 + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; B.i.push(a, b, c, b, d, c);
  }
}

// ================================================================================================================ the baked light
// returns (x, y, z, ax) -> [r, g, b] multipliers; ax = the axis of the plane the point lies on (-1: a thing in the room)
function makeLight(party) {
  const [X0, X1] = ROOM.x, [Z0, Z1] = ROOM.z, H = ROOM.h;
  const ao = (x, y, z, ax) => {
    const ds = []; if (ax !== 0) ds.push(x - X0, X1 - x); if (ax !== 2) ds.push(z - Z0, Z1 - z); if (ax !== 1) ds.push(y, H - y);
    const m = Math.max(0, Math.min(...ds)); return 1 - 0.32 * Math.exp(-m / 0.3);
  };
  if (party) {
    // NIGHT: the room is dark and cool blue-grey; the string lights overhead make a deep gold pool on the left two thirds
    // (hot over the rug), which ends in a soft clear edge at x 1.35. Warm = #ffb85a-ish, cool = #3a4a66-ish.
    const warm = [1.2, 0.62, 0.15], cool = [0.17, 0.25, 0.46], lamps = [[-2.4, 2.2, -0.3], [-1.2, 2.2, -0.3], [0.0, 2.2, -0.3]];
    return (x, y, z, ax = -1) => {
      const e = smooth((x - (ROOM.edgeX - 0.14)) / 0.28);
      let pool = 0; for (const [lx, ly, lz] of lamps) pool += Math.exp(-((x - lx) ** 2 + (y - ly) ** 2 * 0.6 + (z - lz) ** 2 * 0.8) / 5.0);
      pool = Math.min(1.35, pool);
      const hot = Math.exp(-(((x + 1.1) / 1.9) ** 2 + ((z + 0.3) / 1.5) ** 2) * (ax === 1 ? 1 : 0.5)) * (ax === 1 ? 0.3 : 0.18);
      const kw = 0.34 + 0.78 * pool + hot, kc = 0.62 + 0.45 * Math.exp(-((z + 1.2) ** 2 / 1.4 + (x - 3.2) ** 2 / 2.4));
      let a = ao(x, y, z, ax) * (y > 2.2 ? 0.62 : 1);
      return [mix(warm[0] * kw, cool[0] * kc, e) * a, mix(warm[1] * kw, cool[1] * kc, e) * a, mix(warm[2] * kw, cool[2] * kc, e) * a];
    };
  }
  return (x, y, z, ax = -1) => {
    const win = Math.exp(-((z + 1.2) ** 2 / 2.6 + (x - 3.2) ** 2 / 6));
    let k = 0.62 + 0.3 * win; const a = ao(x, y, z, ax);
    let r = 0.62, g = 0.76, b = 1.0;
    if (ax === 1 && y < 0.05) {   // the window's pale light lies on the boards in slanted streaks
      const u = clamp01((3.1 - x) / 3.3), zc = -1.2 - 0.2 * (3.1 - x), inside = 1 - smooth((Math.abs(z - zc) - 0.75) / 0.35), streak = 0.75 + 0.25 * Math.sin((z - zc) * 9 + x * 1.3);
      const f = 0.5 * inside * (1 - u) * streak; r += f * 0.5; g += f * 0.52; b += f * 0.5;
    }
    return [r * k * a, g * k * a, b * k * a];
  };
}

// ================================================================================================================ the set
export function buildScoreRoom(scene, S = {}) {
  const party = S.state !== "sunday", seed = S.seed ?? 5;
  const rnd = rng(seed * 7919 + 13), rD = rng(seed * 31 + 7), rP = rng(seed * 57 + 3), rB = rng(seed * 91 + 5);
  const set = new THREE.Group(); set.name = "set-scoreroom"; scene.add(set);
  scene.background = new THREE.Color(party ? "#0b1230" : "#b4c0d0"); scene.fog = null;
  const add = (o, cast = false) => { if (o) { o.userData.solid = false; o.castShadow = cast; set.add(o); } return o; };
  const light = makeLight(party);
  const lc = (x, y, z, ax = -1) => { const v = light(x, y, z, ax); return new THREE.Color(v[0], v[1], v[2]); };
  const C = (hex, x, y, z, k = 1) => new THREE.Color(hex).multiply(lc(x, y, z)).multiplyScalar(k);
  const [X0, X1] = ROOM.x, [Z0, Z1] = ROOM.z, H = ROOM.h, WIN = ROOM.window, DOOR = ROOM.door;
  const doorMode = S.door ?? (party ? "shut" : "none");

  // ---------------------------------------------------------------- textures and materials
  const wallT = ctex(wallCanvas(rnd)), floorT = ctex(floorCanvas(rnd)), ceilT = ctex(ceilCanvas(rnd)), kraftT = ctex(kraftCanvas(rnd));
  const wallM = std("#ffffff", { map: wallT, vertexColors: true }), floorM = std("#ffffff", { map: floorT, vertexColors: true, roughness: 0.6 });
  const ceilM = std("#ffffff", { map: ceilT, vertexColors: true }), kraftM = std("#ffffff", { map: kraftT, vertexColors: true });
  const vcM = std("#ffffff", { vertexColors: true });
  const leafT = ctex(leafCanvas(), 1, 1, false), leafM = lam("#ffffff", { map: leafT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const rugT = ctex(rugCanvas(rnd), 1, 1, false);

  // ---------------------------------------------------------------- the shell
  const WB = Buf(), FB = Buf(), CB = Buf(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wallUV = (off, axis) => (p) => [(p[axis] + off) / 2.6, p.y / 2.6];
  const wcol = (ax) => (p) => lc(p.x, p.y, p.z, ax);
  const inWin = (p) => p.z > WIN.z[0] && p.z < WIN.z[1] && p.y > WIN.y[0] && p.y < WIN.y[1];
  const inDoor = (p) => p.x > DOOR.x[0] && p.x < DOOR.x[1] && p.y < DOOR.h;
  gridPanel(WB, V(X0, 0, Z0), V(6.4, 0, 0), V(0, H, 0), V(0, 0, 1), 0.1, wcol(2), wallUV(0.3, "x"));                       // back
  gridPanel(WB, V(X1, 0, Z1), V(-6.4, 0, 0), V(0, H, 0), V(0, 0, -1), 0.1, wcol(2), (p) => [(-p.x + 1.1) / 2.6, p.y / 2.6], inDoor);   // front
  gridPanel(WB, V(X1, 0, Z0), V(0, 0, 5), V(0, H, 0), V(-1, 0, 0), 0.1, wcol(0), wallUV(0.9, "z"), inWin);                  // right
  gridPanel(WB, V(X0, 0, Z1), V(0, 0, -5), V(0, H, 0), V(1, 0, 0), 0.1, wcol(0), (p) => [(-p.z + 0.2) / 2.6, p.y / 2.6]);   // left
  gridPanel(FB, V(X0, 0, Z1), V(6.4, 0, 0), V(0, 0, -5), V(0, 1, 0), 0.1, wcol(1), (p) => [p.x / 2.2, p.z / 2.2]);
  gridPanel(CB, V(X0, H, Z0), V(6.4, 0, 0), V(0, 0, 5), V(0, -1, 0), 0.2, wcol(1), (p) => [p.x / 2.6, p.z / 2.6]);
  add(bufMesh(WB, wallM, false, true)); add(bufMesh(FB, floorM, false, true)); add(bufMesh(CB, ceilM, false, false));
  const vc = Buf(), vcN = Buf(); let tgt = vcN;   // vcN: the shell's trim and beams (cast no shadow); vc: furniture (casts)
  const bx = (x, y, z, w, h, d, hex, ry = 0, rz = 0, k = 1) => addBox(tgt, x, y, z, w, h, d, C(hex, x, y, z, k), ry, rz);
  // skirting, window and door reveals, beams, the post
  const SK = "#4a392b";
  bx(0, 0.06, Z0 + 0.015, 6.4, 0.12, 0.03, SK); bx(X0 + 0.015, 0.06, 0, 0.03, 0.12, 5, SK);
  bx(X1 - 0.015, 0.06, -0.6, 0.03, 0.12, 3.8, SK); bx(X1 - 0.015, 0.06, 2.1, 0.03, 0.12, 0.8, SK);
  bx(mix(X0, DOOR.x[0], 0.5), 0.06, Z1 - 0.015, DOOR.x[0] - X0, 0.12, 0.03, SK); bx((DOOR.x[1] + X1) / 2, 0.06, Z1 - 0.015, X1 - DOOR.x[1], 0.12, 0.03, SK);
  const wd = 0.3, wcx = X1 + wd / 2, wzc = (WIN.z[0] + WIN.z[1]) / 2, wyc = (WIN.y[0] + WIN.y[1]) / 2, wwz = WIN.z[1] - WIN.z[0], wwy = WIN.y[1] - WIN.y[0];
  const WR = "#9a9486";   // window reveals: the same boards, painted
  bx(wcx, WIN.y[0] - 0.01, wzc, wd, 0.02, wwz, WR); bx(wcx, WIN.y[1] + 0.01, wzc, wd, 0.02, wwz, WR, 0, 0, 0.7);
  bx(wcx, wyc, WIN.z[0] - 0.01, wd, wwy, 0.02, WR, 0, 0, 0.85); bx(wcx, wyc, WIN.z[1] + 0.01, wd, wwy, 0.02, WR, 0, 0, 0.85);
  const dcz = Z1 + wd / 2, dcx = (DOOR.x[0] + DOOR.x[1]) / 2;
  bx(dcx, DOOR.h + 0.01, dcz, DOOR.x[1] - DOOR.x[0], 0.02, wd, "#6a604f"); bx(DOOR.x[0] - 0.01, DOOR.h / 2, dcz, 0.02, DOOR.h, wd, "#6a604f"); bx(DOOR.x[1] + 0.01, DOOR.h / 2, dcz, 0.02, DOOR.h, wd, "#6a604f");
  // ceiling beams (across the room, hanging 0.2), the main beam along z on the light edge, the corner post
  const BM = "#3c2c1f";
  for (const z of [-1.6, 0.0, 1.6]) bx(0, H - 0.1, z, 6.4, 0.2, 0.14, BM);
  bx(ROOM.edgeX, H - 0.12, 0, 0.2, 0.24, 5, "#33261a"); bx(ROOM.post.x, H / 2, ROOM.post.z, 0.14, H, 0.14, "#4a3828"); bx(ROOM.post.x, 0.1, ROOM.post.z, 0.2, 0.2, 0.2, "#3c2c1f"); bx(ROOM.post.x, H - 0.26, ROOM.post.z, 0.22, 0.12, 0.22, "#3c2c1f");
  for (const [x, z] of [[-2.9, -1.6], [-1.3, 0.0], [0.4, -1.6], [0.8, 1.6], [-2.2, 1.6]]) bx(x, H - 0.22, z, 0.03, 0.05, 0.03, "#16110c");   // nails for the strings

  // ---------------------------------------------------------------- the window: frame, muntins, glass, the far view
  const FR = party ? "#4c5666" : "#8f98a2", fz = (z) => z, mullions = [WIN.z[0] + wwz / 3, WIN.z[0] + 2 * wwz / 3];
  const fx = X1 + 0.12;
  bx(fx, WIN.y[0] + 0.03, wzc, 0.1, 0.06, wwz + 0.12, FR); bx(fx, WIN.y[1] - 0.03, wzc, 0.1, 0.06, wwz + 0.12, FR);
  bx(fx, wyc, WIN.z[0] + 0.03, 0.1, wwy, 0.06, FR); bx(fx, wyc, WIN.z[1] - 0.03, 0.1, wwy, 0.06, FR);
  for (const z of mullions) bx(fx, wyc, fz(z), 0.1, wwy, 0.07, FR);
  bx(fx, 1.78, wzc, 0.09, 0.05, wwz, FR);   // the transom
  for (const z0 of [WIN.z[0], mullions[0], mullions[1]]) { const zc = z0 + wwz / 6; bx(fx, wyc, zc, 0.07, wwy, 0.025, FR, 0, 0, 0.9); for (const y of [1.4, 2.05]) bx(fx, y, zc, 0.07, 0.025, wwz / 3, FR, 0, 0, 0.9); }
  bx(X1 - 0.02, WIN.y[0] - 0.02, wzc, 0.34, 0.04, wwz + 0.3, "#8a8272");   // the sill board
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(wwz, wwy), basic({ map: ctex(glassCanvas(party), 1, 1, false), transparent: true, depthWrite: false, toneMapped: false }));
  glass.rotation.y = -Math.PI / 2; glass.position.set(X1 + 0.16, wyc, wzc); glass.renderOrder = 3; add(glass);
  if (S.view !== false) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(32, 15), basic({ map: ctex(viewCanvas(rD, party), 1, 1, false), toneMapped: false }));
    card.rotation.y = -Math.PI / 2; card.position.set(16, 4.5, 0); card.renderOrder = -10; card.name = "set-scoreroom-view"; add(card);
  }

  // ---------------------------------------------------------------- the radiator (cast iron sections) and its pipes
  tgt = vc;
  { const R = ROOM.radiator, n = 12, sw = R.w / n, rx = R.x;
    for (let i = 0; i < n; i++) { const z = R.z - R.w / 2 + sw * (i + 0.5); bx(rx, 0.1 + R.h / 2, z, 0.1, R.h, sw * 0.62, "#a9adb3"); bx(rx, 0.1 + R.h / 2, z, 0.11, R.h * 0.9, sw * 0.28, "#979ba2"); }
    bx(rx, 0.14, R.z, 0.12, 0.05, R.w, "#a2a6ac"); bx(rx, 0.1 + R.h - 0.03, R.z, 0.12, 0.05, R.w, "#a2a6ac");
    for (const s of [-1, 1]) { bx(rx, 0.06, R.z + s * (R.w / 2 + 0.03), 0.05, 0.12, 0.05, "#8a8d93"); bx(rx, 0.22, R.z + s * (R.w / 2 + 0.03), 0.05, 0.05, 0.08, "#7d8086"); }
    bx(X1 - 0.03, 0.72, R.z - R.w / 2 + 0.2, 0.04, 0.04, 0.04, "#6e7076");
  }

  // ---------------------------------------------------------------- books, shelves, pictures, plants
  const BOOKS = ["#2f6b6b", "#b8892f", "#9c3b2a", "#2c3f6a", "#4a6b3a", "#d6cba8", "#5e3a58", "#8a5a30", "#3a4f58"];
  const books = (x0, x1, y, z, depth, h0, facing) => {   // spines toward +z (facing 0) or -x (facing 1): a row from x0 to x1 (z0 to z1 for the right wall)
    let t = x0 + 0.02;
    while (t < x1 - 0.06) {
      const w = 0.022 + rB() * 0.03, h = h0 * (0.7 + rB() * 0.38), hex = BOOKS[Math.floor(rB() * BOOKS.length)], gap = rB() < 0.12 ? 0.02 + rB() * 0.05 : 0.002, lean = rB() < 0.07 ? 0.18 : 0;
      if (facing === 0) { const x = t + w / 2, zc = z + depth * 0.5 - 0.02; bx(x, y + h / 2, zc, w, h, depth * 0.78, hex, 0, lean); if (rB() < 0.18) bx(x, y + h * 0.62, zc + depth * 0.39, w * 1.02, 0.025, 0.004, "#cfc19a"); }
      else { const z2 = t + w / 2, xc = X1 - depth * 0.5 - 0.0; bx(xc, y + h / 2, z2, depth * 0.78, h, w, hex, 0, 0, 1); if (rB() < 0.18) bx(xc - depth * 0.39, y + h * 0.62, z2, 0.004, 0.025, w * 1.02, "#cfc19a"); }
      t += w + gap + (lean ? 0.06 : 0);
    }
  };
  const kbox = (K, x, y, z, w, h, d, ry = 0, tape = true) => {   // a kraft box: y = its floor, with a tape seam on top and a fold line
    const k = 0.9 + rB() * 0.2; addBox(K, x, y + h / 2, z, w, h, d, C("#ffffff", x, y + h / 2, z, k), ry, 0, 0.9);
    if (tape) { addBox(K, x, y + h + 0.002, z, w * 0.1, 0.004, d * 0.98, C("#d9c79a", x, y + h, z, 1.05), ry, 0, 4); addBox(K, x, y + h * 0.6, z, w * 1.004, 0.012, d * 1.004, C("#8a6a40", x, y + h * 0.6, z, 0.9), ry, 0, 4); }
  };
  // the bookcase on the back wall
  { const bx0 = 0.0, bx1 = 1.25, bz = Z0, bd = 0.3, bh = 2.05, WOOD = "#5a4030";
    bx(bx0 + 0.015, bh / 2, bz + bd / 2, 0.03, bh, bd, WOOD); bx(bx1 - 0.015, bh / 2, bz + bd / 2, 0.03, bh, bd, WOOD); bx((bx0 + bx1) / 2, bh / 2, bz + 0.01, bx1 - bx0, bh, 0.02, "#3a2a1e");
    bx((bx0 + bx1) / 2, 0.06, bz + bd / 2 + 0.01, bx1 - bx0, 0.12, bd, "#4a3626");
    const ys = [0.55, 0.95, 1.35, 1.75, bh];
    for (const y of ys) bx((bx0 + bx1) / 2, y, bz + bd / 2 + 0.01, bx1 - bx0 + 0.04, 0.03, bd + 0.02, WOOD);
    if (party) {
      for (const y of [0.97, 1.37, 1.77]) books(bx0 + 0.03, bx1 - 0.03, y + 0.015, bz, bd, 0.3, 0);
      books(bx0 + 0.03, bx1 - 0.55, 0.57, bz, bd, 0.3, 0);
      const BK = Buf(); kbox(BK, 0.2, 0.12, bz + 0.17, 0.34, 0.2, 0.26); kbox(BK, 0.78, 0.12, bz + 0.17, 0.4, 0.28, 0.26); add(bufMesh(BK, kraftM, true), true);
      for (const [x, y] of [[0.9, 0.57]]) { const b = Buf(); kbox(b, x, y, bz + 0.17, 0.26, 0.16, 0.2, 0.2); add(bufMesh(b, kraftM, true), true); }
    } else {
      books(bx0 + 0.1, bx0 + 0.25, 0.97, bz, bd, 0.28, 0);   // a few left on a shelf
      bx(0.6, 0.575, bz + 0.16, 0.2, 0.04, 0.15, "#4a6b3a", 0.2); bx(0.6, 0.6, bz + 0.16, 0.19, 0.03, 0.14, "#9c3b2a", -0.1);   // two books lying on the lowest shelf
      bx((bx0 + bx1) / 2, 0.3, bz + bd / 2, 0.6, 0.012, 0.2, "#d8d0bc");   // dust cloth left on the plinth shelf? (a pale rag)
    }
  }
  // the ladder shelf on the right wall (z 0.25..1.45)
  { const z0 = 0.25, z1 = 1.45, zc = (z0 + z1) / 2, dp = 0.24, xc = X1 - dp / 2, WOOD = "#5a4030";
    for (const z of [z0 + 0.025, z1 - 0.025]) bx(xc, 1.18, z, dp, 2.36, 0.05, WOOD);
    const ys = [0.3, 0.8, 1.3, 1.8, 2.3];
    for (const y of ys) bx(xc, y, zc, dp + 0.02, 0.03, z1 - z0 + 0.04, WOOD);
    if (party) {
      books(z0 + 0.06, z1 - 0.06, 0.82, 0, dp, 0.28, 1); books(z0 + 0.06, z0 + 0.6, 1.32, 0, dp, 0.26, 1);
      const KB = Buf(); kbox(KB, X1 - 0.13, 0.32, z1 - 0.3, 0.22, 0.2, 0.34, Math.PI / 2); kbox(KB, X1 - 0.13, 1.82, z0 + 0.3, 0.2, 0.24, 0.34, Math.PI / 2); add(bufMesh(KB, kraftM, true), true);
    } else bx(X1 - 0.12, 0.8 + 0.03, z0 + 0.3, 0.14, 0.04, 0.2, "#d8d0bc", 0.3);
  }
  // pictures (party) and their pale ghosts (sunday)
  const PICS = [{ k: "church", x: -2.45, y: 1.75, w: 0.46, h: 0.58 }, { k: "village", x: -1.45, y: 1.6, w: 0.9, h: 0.72 }, { k: "flowers", x: -0.55, y: 1.65, w: 0.42, h: 0.56 }];
  for (const P of PICS) {
    if (party) {
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(P.w - 0.08, P.h - 0.08), std(lc(P.x, P.y, Z0).getHex(), { map: ctex(picCanvas(P.k, rD), 1, 1, false) })); pm.position.set(P.x, P.y, Z0 + 0.03); add(pm);
      for (const [dx, dy, w, h] of [[0, P.h / 2 - 0.02, P.w, 0.04], [0, -P.h / 2 + 0.02, P.w, 0.04], [-P.w / 2 + 0.02, 0, 0.04, P.h], [P.w / 2 - 0.02, 0, 0.04, P.h]]) bx(P.x + dx, P.y + dy, Z0 + 0.025, w, h, 0.05, "#6b4a2a");
      bx(P.x, P.y + P.h / 2 + 0.1, Z0 + 0.012, 0.005, 0.2, 0.005, "#222");
    } else {
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(P.w, P.h), basic({ color: "#eef2ff", transparent: true, opacity: 0.08, depthWrite: false })); gm.position.set(P.x, P.y, Z0 + 0.004); add(gm);
      const gb = new THREE.Mesh(new THREE.PlaneGeometry(P.w + 0.02, P.h + 0.02), basic({ color: "#2a2018", transparent: true, opacity: 0.08, depthWrite: false })); gb.position.set(P.x, P.y, Z0 + 0.0025); add(gb);
      bx(P.x, P.y + P.h / 2 + 0.1, Z0 + 0.012, 0.02, 0.02, 0.015, "#2b2b30");
    }
  }
  if (party) {   // a botanical print on the right wall, over the ladder shelf's end
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), std(lc(X1, 1.0, 1.8).getHex(), { map: ctex(picCanvas("flowers", rD), 1, 1, false) })); pm.rotation.y = -Math.PI / 2; pm.position.set(X1 - 0.03, 1.0, 1.95); add(pm);
    bx(X1 - 0.025, 1.0, 1.95, 0.05, 0.46, 0.38, "#6b4a2a", 0, 0, 1);
  }
  // pothos: pot + a dome of heart leaves + trailing vines
  const LB = Buf(), GREEN = ["#4f8a3a", "#6aa044", "#3d7432", "#86b04a", "#5a9440"];
  const plant = (x, y, z, o = {}) => {
    const s = o.s ?? 1, pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.075 * s, 0.17 * s, 14), std(C(o.pot ?? "#b8643c", x, y + 0.1, z).getHex())); pot.position.set(x, y + 0.085 * s, z); add(pot, true);
    const n = o.n ?? 60, top = y + 0.16 * s;
    for (let i = 0; i < n; i++) {
      const a = rP() * 6.28, el = 0.15 + rP() * 1.2, l = (0.08 + rP() * 0.26) * s, dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el);
      const p = V(x + dx * l, top + dy * l * 0.9, z + dz * l), nr = V(dx * 0.6, 0.7 + dy * 0.4, dz * 0.6).normalize(), [t1, t2] = frameOf(nr, rP() * 6.28), sz = (0.09 + rP() * 0.07) * s;
      addCard(LB, p.x, p.y, p.z, t1, t2, sz, sz, nr, tint(GREEN[i % 5], rP, 0.01, 0.06, 0.06).multiply(lc(p.x, p.y, p.z)));
    }
    for (let v = 0; v < (o.trail ?? 3); v++) {
      const a = rP() * 6.28, L = (o.drop ?? 0.7) * (0.6 + rP() * 0.6); let px = x + Math.cos(a) * 0.1 * s, pz = z + Math.sin(a) * 0.1 * s;
      for (let k = 0; k < 14; k++) {
        const u = k / 14; px += Math.cos(a) * 0.014 + (rP() - 0.5) * 0.05; pz += Math.sin(a) * 0.014 + (rP() - 0.5) * 0.05; const py = top - u * L + (rP() - 0.5) * 0.03;
        const nr = V(Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.5).normalize(), [t1, t2] = frameOf(nr, rP() * 6.28);
        addCard(LB, px, py, pz, t1, t2, 0.085 * s, 0.085 * s, nr, tint(GREEN[k % 5], rP, 0.01, 0.06, 0.06).multiply(lc(px, py, pz)));
      }
    }
  };
  if (party && S.plants !== false) {
    plant(0.55, 2.05, Z0 + 0.17, { s: 1.1, n: 70, trail: 4, drop: 0.9 });          // on the bookcase
    plant(-2.7, 1.25, -2.0, { s: 1.1, n: 70, trail: 2, drop: 0.5 });               // on the back-left stack
    plant(X1 - 0.12, 1.83, 1.0, { s: 1.0, n: 60, trail: 3, drop: 0.8 });           // on the ladder shelf
    plant(X1 - 0.17, 1.02, -0.55, { s: 0.9, n: 50, trail: 1, drop: 0.3, pot: "#a85a38" });   // on the window sill
  }

  // ---------------------------------------------------------------- box stacks (party), seats and scraps (sunday), the rug
  if (party && S.stacks !== false) {
    const KB = Buf();
    kbox(KB, -2.65, 0, -2.18, 1.05, 0.5, 0.62, 0.05); kbox(KB, -2.7, 0.5, -2.2, 0.85, 0.42, 0.55, -0.06); kbox(KB, -2.75, 0.92, -2.2, 0.6, 0.33, 0.45, 0.04);
    kbox(KB, -3.05, 0, -1.62, 0.5, 0.36, 0.5, 0.0); kbox(KB, -2.25, 0, -1.78, 0.36, 0.3, 0.34, 0.2);
    kbox(KB, -2.93, 0, 0.62, 0.56, 0.5, 0.66, 0.0); kbox(KB, -2.93, 0.5, 0.64, 0.5, 0.42, 0.6, 0.05); kbox(KB, -2.95, 0.92, 0.62, 0.4, 0.34, 0.5, -0.04); kbox(KB, -2.9, 1.26, 0.64, 0.3, 0.28, 0.4, 0.1);
    kbox(KB, -2.9, 0, 1.55, 0.5, 0.34, 0.46, 0.05);
    kbox(KB, 2.85, 0, 2.15, 0.62, 0.48, 0.66, 0.0); kbox(KB, 2.88, 0.48, 2.12, 0.5, 0.4, 0.55, 0.06);
    add(bufMesh(KB, kraftM, true, true), true);
  }
  if (!party && S.seats !== false) {
    const KB = Buf(); for (const s of ROOM.seats) kbox(KB, s.x, 0, s.z, s.w, s.h, s.d, 0.05); add(bufMesh(KB, kraftM, true, true), true);
  }
  if (party) {
    const R = ROOM.rug, RB = Buf(), rw = R.w + 0.12, rd = R.d, cs = Math.cos(R.rotDeg * DEG), sn = Math.sin(R.rotDeg * DEG);
    const U = V(cs * rw, 0, -sn * rw), Vv = V(-sn * rd, 0, -cs * rd), org = V(R.x - U.x / 2 - Vv.x / 2, 0.012, R.z - U.z / 2 - Vv.z / 2);
    gridPanel(RB, org, U, Vv, V(0, 1, 0), 0.1, (p) => lc(p.x, 0.012, p.z, 1), (p, u, v) => [u / rw, v / rd]);
    const rm = bufMesh(RB, std("#ffffff", { map: rugT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), false, true); if (rm) add(rm);
  } else {   // the rug rolled up and leaned in the back-left of the room (panel 34)
    const rt = ctex(rugCanvas(rnd), 1, 1, false), rl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.9, 24), [std(lc(-1.7, 1, -2.3).getHex(), { map: rt }), std("#6a2a22"), std("#6a2a22")]);
    rl.position.set(-1.75, 0.95, -2.3); rl.rotation.z = 0.04; add(rl, true);
  }
  if (!party && S.scraps !== false) {   // tape scraps: curling strips of gold-cream tape lying on the boards
    const TB = Buf();
    ROOM.scraps.forEach(([sx, sz], k) => {
      const len = 0.32 + 0.22 * ((k * 0.37) % 1), ang = k * 1.7, dir = V(Math.cos(ang), 0, Math.sin(ang)), perp = V(-dir.z, 0, dir.x), N = 16, wd2 = 0.024;
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const u = i / N, c = V(sx, 0.004 + 0.022 * Math.abs(Math.sin(u * Math.PI * 1.6 + k)), sz).addScaledVector(dir, (u - 0.5) * len), roll = Math.sin(u * 5 + k) * 0.9, wv = perp.clone().multiplyScalar(Math.cos(roll)).addScaledVector(_up, Math.sin(roll)).multiplyScalar(wd2);
        const b = TB.p.length / 3, col = C(i % 2 ? "#e8d28a" : "#d9bc62", c.x, 0.01, c.z);
        for (const s of [-1, 1]) { TB.p.push(c.x + wv.x * s, c.y + wv.y * s, c.z + wv.z * s); TB.n.push(0, 1, 0); TB.uv.push(u, s); TB.c.push(col.r, col.g, col.b); }
        if (prev !== null) TB.i.push(prev, prev + 1, b, prev + 1, b + 1, b);
        prev = b;
      }
    });
    const tm = bufMesh(TB, std("#ffffff", { vertexColors: true, side: THREE.DoubleSide, roughness: 0.5 }), false, true); if (tm) add(tm);
  }

  // warm glints on the rug and the boards under the pool: soft additive streaks, brightest over the rug
  if (party) {
    const gc = canvas(64, 64), gg = gc[1], gr = gg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,210,130,1)"); gr.addColorStop(0.35, "rgba(255,170,70,0.5)"); gr.addColorStop(1, "rgba(255,150,40,0)"); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
    const GB = Buf(), up = V(0, 1, 0), rG = rng(seed * 211 + 9);
    for (let i = 0; i < 100; i++) {
      const x = -3.0 + rG() * 4.2, z = -2.0 + rG() * 3.6, d2 = ((x + 1.1) / 1.9) ** 2 + ((z + 0.3) / 1.5) ** 2, p = Math.exp(-d2 * 0.7);
      if (rG() > 0.25 + p) continue;
      const [t1, t2] = frameOf(up, rG() * 0.5 - 0.25), w = 0.18 + rG() * 0.5, h = 0.03 + rG() * 0.06, k = 0.7 * (0.3 + 0.7 * p) * (0.5 + rG() * 0.5);
      addCard(GB, x, 0.02, z, t1, t2, w, h, up, new THREE.Color(k, k * 0.82, k * 0.5));
    }
    const gm = bufMesh(GB, new THREE.MeshBasicMaterial({ map: ctex(gc[0], 1, 1, false), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), false, false);
    if (gm) { gm.renderOrder = 2; gm.material.userData.noOutline = true; add(gm); }
  }

  // ---------------------------------------------------------------- the door wall: hall beyond, the cream leaf
  { const HB = Buf(), hx0 = 0.9, hx1 = 4.0, hz0 = Z1 + 0.3, hz1 = 4.9, dim = (x, y, z, k) => new THREE.Color(0.34 * k, 0.4 * k, 0.55 * k);
    const hc = (k) => (p) => dim(p.x, p.y, p.z, k);
    gridPanel(HB, V(hx0, 0, hz1), V(hx1 - hx0, 0, 0), V(0, 0, hz0 - hz1), V(0, 1, 0), 0.5, hc(0.7), (p) => [p.x / 2.2, p.z / 2.2]);
    add(bufMesh(HB, std("#ffffff", { map: floorT, vertexColors: true }), false, true));
    const WB2 = Buf();
    gridPanel(WB2, V(hx1, 0, hz1), V(hx0 - hx1, 0, 0), V(0, 2.5, 0), V(0, 0, -1), 0.5, hc(0.9), (p) => [p.x / 2.6, p.y / 2.6]);
    gridPanel(WB2, V(hx0, 0, hz1), V(0, 0, hz0 - hz1), V(0, 2.5, 0), V(1, 0, 0), 0.5, hc(0.6), (p) => [p.z / 2.6, p.y / 2.6]);
    gridPanel(WB2, V(hx1, 0, hz0), V(0, 0, hz1 - hz0), V(0, 2.5, 0), V(-1, 0, 0), 0.5, hc(0.6), (p) => [p.z / 2.6, p.y / 2.6]);
    gridPanel(WB2, V(hx0, 2.5, hz0), V(hx1 - hx0, 0, 0), V(0, 0, hz1 - hz0), V(0, -1, 0), 0.5, hc(0.4), (p) => [p.x / 2.6, p.z / 2.6]);
    add(bufMesh(WB2, wallM, false, true));
  }
  if (doorMode !== "none") {
    const leafT2 = ctex(doorCanvas(rD), 1, 1, false), g = new THREE.Group(), open = doorMode === "open", hinge = DOOR.x[1] - 0.02, W = DOOR.x[1] - DOOR.x[0] - 0.04;
    const mt = std(lc(2.4, 1.0, 2.4).getHex(), { map: leafT2 }); const leaf = new THREE.Mesh(new THREE.BoxGeometry(W, DOOR.h - 0.02, 0.045), mt); leaf.position.set(-W / 2, (DOOR.h - 0.02) / 2, 0); leaf.castShadow = true; g.add(leaf);
    for (const zs of [1, -1]) { const kn = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), std("#d9a640", { metalness: 0.8, roughness: 0.3 })); kn.position.set(-W + 0.09, 1.0, zs * 0.06); g.add(kn); }
    g.position.set(open ? hinge : (DOOR.x[0] + DOOR.x[1]) / 2 + W / 2, 0, open ? Z1 - 0.05 : Z1 + 0.15); g.rotation.y = open ? 80 * DEG : 0; add(g, true);
  }
  // door architrave (cream, worn)
  { const AB = Buf(), cx = "#c9b898"; const a = (x, y, z, w, h, d) => addBox(AB, x, y, z, w, h, d, C(cx, x, y, z), 0, 0, 1);
    a(DOOR.x[0] - 0.05, DOOR.h / 2, Z1 - 0.02, 0.1, DOOR.h + 0.1, 0.04); a(DOOR.x[1] + 0.05, DOOR.h / 2, Z1 - 0.02, 0.1, DOOR.h + 0.1, 0.04); a((DOOR.x[0] + DOOR.x[1]) / 2, DOOR.h + 0.05, Z1 - 0.02, DOOR.x[1] - DOOR.x[0] + 0.2, 0.1, 0.04);
    add(bufMesh(AB, vcM, true, true)); }

  add(bufMesh(vc, vcM, true, true), true); add(bufMesh(vcN, vcM, false, true));
  add(bufMesh(LB, leafM, false, true));
  return set;
}
