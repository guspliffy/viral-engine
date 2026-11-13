import * as THREE from "three";
import { clamp } from "./util.js";

// Survive it "How to survive a zombie apocalypse" (11 Nov 2026), task T3: the corner shop's inside, the food tin, the
// jute bag that gets too heavy. Metres; world x right, y up, z toward the camera; rot 0 faces +z. Everything is hashed
// from an index and spec.seed (no Math.random, no clock) and every texture is painted once, nothing tiled. A kind's
// state keys read as ps.<key> ?? spec.<key> ?? default (ZSHOP_STATE at the bottom lists them for "prop" tweens).
//
//   zshop    a small corner shop, open toward the camera (NO front wall, so the camera stands in the street side).
//            Origin: floor centre, y 0 = the floor top. Not held, every mesh userData.solid = false (the cast stands in it).
//            spec  w 5.5 (x), d 4.2 (z), h 2.8, seed 1,
//                  doorX 1.4, doorW 1.0, doorH 2.1 (the glass shop door in the back wall, x of its middle),
//                  winX -0.9, winW 2.2, winH 1.4, winSill 0.8 (the shop window, x of its middle, sill height)
//            Back wall: inner face at z -d/2 (-2.1), side walls at x +-w/2, ceiling at y h with two dead strip lamps.
//            Through the door and the window: a painted card 0.6 m behind the wall (z -d/2 - 0.6): the grey street with
//            the zombies standing packed, 4 rows of 9-11, their BACKS to the shop (heads, shoulders, long pale sprouts;
//            nothing faces the glass). The glass is a faint dusty pane; no readable text anywhere.
//            Floor: cream and grey tiles 0.3 m painted one by one (a few cracked, dirt, scuffs).
//            Left shelf unit: against x -w/2, 0.4 deep, 2.0 high, z -1.8 .. 1.2, faces +x. Right unit: against x +w/2,
//            z -1.8 .. 0.2, faces -x. Boards (y 0.2 / 0.7 / 1.2 / 1.7, plus a cap at 2.0) hold about 40 tins in loose
//            groups, a few fallen over, some boards empty; torn blank price strips on the board lips. Tins on the
//            shelves are the 400 g tin below, closed, with mixed label colours.
//            Counter at the right front: x 1.15 .. 2.65, z 0.85 .. 1.55, 0.95 high (its till on it at x 1.9, z 1.2).
//            Floor clutter: a bucket and mop at the back left corner, two tins on the floor, a squashed carton.
//            state dim 0..1 (default 0.25): 0 = the shop evenly lit; 1 = dark inside, only dull daylight from the window
//                  (every surface dims, a cool light pool lies on the floor under the window). 0.25 is the story's day.
//            At 0.25 the inside reads about 14 % darker than the street card.
//
//   tin      a 400 g food tin: 7.5 cm across (r 0.0375), 11 cm high, ribbed steel, a red-orange paper label (#d9481c) with a
//            pale bean shape and two small ones (no text). Origin: bottom centre. Solid.
//            spec  scale 1 (the engine's own: a hand-held tin reads at phone size from scale ~1.4; the grips library follows it),
//                  seed 1 (the paint of the label, the beans), open 0 (see state)
//            state open 0..1: 0 closed (a flat lid with a ring-pull); 1 the lid peeled up about the BACK edge (-z), bent back
//                  over itself (it leans 110 deg back, its front half curls on to 165 deg), beans in red sauce inside.
//            hold  one hand round the side: grips.mjs SIZE.tin {r 0.0375, h 0.11} with the mug hold (`grips.mug`, height
//                  0.66 default = the label's lower middle). ZSHOP_GRIPS.tin.side = [0.0375, 0.073, 0] for an arm pose.
//
//   tinbag   a big jute sack with a drawstring. Origin: bottom centre. Solid. Front (+z) is the broad side; the two seams are on
//            the sides (+-x). spec  size 0.75 (the height when full, scales every part), seed 1
//            state fill 0..1 (default 1): 0 an empty limp sack, a low heap 0.2 high with its mouth flopped to +x; 0.5 half full,
//                  slumped about 0.46 high; 1 bulging: 0.75 high, 0.62 wide at 0.28 up, 0.53 deep, about a dozen tin shapes
//                  pressing through the cloth (they come in one after the other between fill 0.25 and 0.8), the seams dark
//                  and straining at the sides, a faded blue stencil patch on the front, three tin tops standing in the open
//                  mouth (from fill 0.85), a loose drawstring round the neck with two ends hanging.
//                  hang 0..1 (default 0): 0 the sack rests on the floor (slumps by fill); 1 it HANGS from its neck: the
//                  bulk sinks to the bottom, the cloth above is a narrow gathered neck, the neck stays at y 0.95 x height.
//                  A held bag hangs by itself: while a hand holds it (a grab with a grip) hang eases to 1 over 0.5 s from the
//                  grab, and eases back to 0 over 0.4 s after the let-go; set hang yourself for a sack hung on a hook or a
//                  shoulder.
//            hold  ONE hand at the neck, the sack hanging under the fist. The neck is at local (0, 0.7125, 0) for size 0.75
//                  (0.95 x height; ZSHOP_GRIPS.tinbag.neck; the neck ring is 0.085 in radius, the rim above it 0.125). Use
//                  `grips.mug(c, who, BAG, { height: 0.95 })` (SIZE.tinbag r 0.085, h 0.75): the grip follows spec.scale, NOT
//                  spec.size, so resize a held bag with `scale` and leave `size` at 0.75.
//
// Solid / see-through: the shop's meshes are all userData.solid false; its floor light pool is userData.steam (see-through
// for the checks, noOutline). The tin and the bag are solid; their glows: none.

const rad = (d) => (d * Math.PI) / 180;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
// every mark is hashed from an index and the seed: H(i, seed) in [0, 1)
const H = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerpHex = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return `rgb(${Math.round(mix(A[0], B[0], t))},${Math.round(mix(A[1], B[1], t))},${Math.round(mix(A[2], B[2], t))})`; };

function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// a material registry for the shop's dim state: [material, its base colour]
function kit(solid) {
  const reg = [];
  const M = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }); reg.push([m, m.color.clone()]); return m; };
  const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = !(geo.type === "PlaneGeometry" || geo.type === "CircleGeometry" || geo.type === "ShapeGeometry"); o.receiveShadow = true; if (!solid) o.userData.solid = false; parent.add(o); return o; };
  const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
  return { reg, M, mesh, box };
}

// ---------------------------------------------------------------------------------------------- the tin
const TIN = { r: 0.0375, h: 0.11 };
const LABEL_COLORS = [["#d9481c", "#f2e3b4"], ["#4f8a3c", "#efe6b8"], ["#e0a526", "#fbf1cf"], ["#3d6b9a", "#f0e6c4"]];

// a hand-painted label (circumference 0.2356 x height 0.066: canvas 512 x 144): the bean art faces +z
function labelTex(variant, seed) {
  const [base, pale] = LABEL_COLORS[variant % LABEL_COLORS.length];
  return canvasTex(512, 144, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {   // brush strokes in the paper
      const x = H(i, seed + variant) * w, y = H(i + 400, seed + variant) * h, len = 14 + H(i + 800, seed) * 40;
      g.strokeStyle = H(i + 1200, seed) < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"; g.lineWidth = 1 + H(i + 1600, seed) * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (H(i + 2000, seed) - 0.5) * 3); g.stroke();
    }
    g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7);   // dark top and bottom bands
    g.fillStyle = pale; g.fillRect(0, 7, w, 3); g.fillRect(0, h - 10, w, 3);              // a cream pin stripe each
    const bean = (cx, cy, s, rot) => {   // a kidney bean: pale fill, dark ink outline, a highlight, drawn once
      g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(s, s);
      g.beginPath(); g.moveTo(-34, 2); g.bezierCurveTo(-36, -22, -8, -30, 14, -22); g.bezierCurveTo(40, -14, 40, 16, 20, 22); g.bezierCurveTo(8, 26, 4, 10, -8, 12); g.bezierCurveTo(-22, 16, -33, 18, -34, 2); g.closePath();
      g.fillStyle = pale; g.fill(); g.lineWidth = 3 / s; g.strokeStyle = "rgba(60,25,10,0.75)"; g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 3 / s; g.beginPath(); g.moveTo(-22, -12); g.quadraticCurveTo(-4, -22, 12, -14); g.stroke();
      g.restore();
    };
    for (const off of [0, 1]) {   // the front art at u 0.5 (+z); a lesser copy on the back at u 0 and 1
      const cx = off ? w * 0.5 : 0, sc = off ? 1 : 0.62;
      bean(cx + (off ? 0 : 20), h * 0.5, 1.05 * sc, -0.18 + H(3, seed) * 0.1);
      bean(cx - 62 * sc + (off ? 0 : 20), h * 0.62, 0.55 * sc, 0.5);
      bean(cx + 66 * sc + (off ? 0 : 20), h * 0.36, 0.5 * sc, -0.6);
      g.strokeStyle = "rgba(60,25,10,0.5)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 80 * sc, h * 0.84); g.quadraticCurveTo(cx, h * 0.76, cx + 90 * sc, h * 0.86); g.stroke();   // a sauce swoosh
    }
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(w * 0.985, 0, w * 0.015, h);   // the paper's glued seam
    for (let i = 0; i < 12; i++) { g.fillStyle = "rgba(40,20,10,0.18)"; g.beginPath(); g.ellipse(H(i + 5, seed) * w, H(i + 50, seed) * h, 2 + H(i + 90, seed) * 5, 1 + H(i + 130, seed) * 2, 0, 0, 7); g.fill(); }   // scuffs
  });
}

// the ribbed steel body of a tin as a lathe (outer wall, bottom chime, two ribs, rolled rim and the inside wall)
function tinLathe() {
  const p = [[0, 0], [0.031, 0], [0.0362, 0.0025], [0.0375, 0.006], [0.0375, 0.012], [0.0345, 0.0135], [0.0345, 0.0165], [0.0375, 0.018], [0.0375, 0.022],
    [0.0375, 0.088], [0.0375, 0.092], [0.0345, 0.0935], [0.0345, 0.0965], [0.0375, 0.098], [0.0375, 0.104], [0.0365, 0.1085], [0.0386, 0.1095], [0.0384, 0.1108], [0.0366, 0.1108], [0.0362, 0.109], [0.0362, 0.09], [0.0345, 0.0195], [0, 0.0195]];
  return new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 40);
}

// the lid's two halves as thin plates (hinge line on z = 0, the disc centre at z = R): A is the half at the hinge, B the far half
function lidHalf(which) {
  const R = 0.0345, pts = [];
  const [a0, a1] = which === "A" ? [-Math.PI / 2, Math.PI / 2] : [Math.PI / 2, (3 * Math.PI) / 2];
  for (let i = 0; i <= 14; i++) { const a = mix(a0, a1, i / 14); pts.push([R * Math.sin(a), R - R * Math.cos(a) - (which === "B" ? R : 0)]); }
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.0012, bevelEnabled: false }); g.rotateX(Math.PI / 2);   // shape y -> +z, the plate under y 0
  return g;
}

// one tin standing on y 0: body, label, the closed lid with a ring-pull; returns the parts
function buildTin(parent, { M, mesh, seed = 1, label = 0, lidOpenable = false }) {
  const steel = M("#c3c8cb", { roughness: 0.4, metalness: 0.12, side: THREE.DoubleSide });
  const lab = M("#ffffff", { map: labelTex(label, seed), roughness: 0.85 });
  mesh(tinLathe(), steel, parent);
  mesh(new THREE.CylinderGeometry(0.0379, 0.0379, 0.066, 40, 1, true, Math.PI), lab, parent, 0, 0.055, 0);
  const lidM = M("#b2b8bc", { roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide });
  const hinge = new THREE.Group(); hinge.position.set(0, 0.1088, -0.0345); parent.add(hinge);
  const A = new THREE.Group(), B = new THREE.Group(); hinge.add(A); A.add(B); B.position.z = 0.0345;
  mesh(lidHalf("A"), lidM, A); mesh(lidHalf("B"), lidM, B);
  // a stamped ring and the ring-pull (on the far half)
  const ring = mesh(new THREE.TorusGeometry(0.026, 0.0008, 6, 36), steel, B, 0, 0.0004, 0); ring.rotation.x = Math.PI / 2; ring.position.z = 0.0;
  const pull = mesh(new THREE.TorusGeometry(0.0085, 0.0016, 6, 16), steel, B, 0, 0.002, 0.0125); pull.rotation.x = Math.PI / 2; pull.scale.set(1, 1.25, 1);
  mesh(new THREE.BoxGeometry(0.007, 0.0012, 0.014), steel, B, 0, 0.0012, 0.0225);
  mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.0016, 10), steel, B, 0, 0.001, 0.0045);
  let beans = null;
  if (lidOpenable) {   // the inside: red sauce, a heap of beans, drawn once
    beans = new THREE.Group(); parent.add(beans);
    const sauceTex = canvasTex(128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, "#b8421f"); gr.addColorStop(1, "#8f2c14"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = H(i, seed + 7) < 0.5 ? "rgba(255,150,80,0.22)" : "rgba(60,10,5,0.22)"; g.beginPath(); g.ellipse(H(i + 3, seed + 7) * w, H(i + 99, seed + 7) * h, 3 + H(i + 9, seed) * 9, 2 + H(i + 19, seed) * 5, H(i + 29, seed) * 3, 0, 7); g.fill(); }
    });
    const sauce = mesh(new THREE.CircleGeometry(0.0356, 32), M("#ffffff", { map: sauceTex, roughness: 0.35 }), beans, 0, 0.0975, 0); sauce.rotation.x = -Math.PI / 2;
    const beanM = [M("#a9582a", { roughness: 0.3 }), M("#bf7036", { roughness: 0.3 }), M("#8e4521", { roughness: 0.3 })];
    for (let i = 0; i < 17; i++) {
      const a = H(i, seed + 21) * 6.283, rr = Math.sqrt(H(i + 40, seed + 21)) * 0.027, b = mesh(new THREE.SphereGeometry(0.0072, 10, 8), beanM[i % 3], beans, Math.cos(a) * rr, 0.0985 + H(i + 80, seed) * 0.003 + (rr < 0.012 ? 0.003 : 0), Math.sin(a) * rr);
      b.scale.set(1.45, 0.82, 0.95); b.rotation.set(H(i + 3, seed) * 0.5, H(i + 6, seed) * 6.283, H(i + 9, seed) * 0.5);
    }
  }
  return { A, B, beans, steel, hinge };
}

// ---------------------------------------------------------------------------------------------- the zombie street card
// A painted card, 6.8 x 3.6 m (x -3.4..3.4, y 0..3.6), 200 px a metre: the grey street, the packed crowd seen from BEHIND.
function paintZombie(g, X, Y, cx, topY, s, id, seed) {
  const ppm = 200, bw = 0.7 * s, bh = 0.95 * s, bcy = topY - bh / 2 + 0.03;
  const tilt = (H(id, seed + 1) - 0.5) * 0.22;
  g.save(); g.translate(X(cx), Y(bcy)); g.rotate(tilt); g.translate(-X(cx), -Y(bcy));
  // thin dark stiff arms, mostly hidden: from the shoulders, a little out and down
  for (const sx of [-1, 1]) {
    g.strokeStyle = "#2b2f2e"; g.lineWidth = 0.05 * ppm; g.lineCap = "round";
    g.beginPath(); g.moveTo(X(cx + sx * bw * 0.46), Y(topY - bh * 0.34)); g.lineTo(X(cx + sx * (bw * 0.56 + 0.06)), Y(topY - bh * 0.78)); g.stroke();
  }
  // the lumpy back of the potato: an egg with a hashed radius
  const N = 26, pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.283, l = 1 + 0.05 * Math.sin(3 * a + id) + 0.035 * Math.sin(5 * a + id * 2) + (H(i + id * 13, seed) - 0.5) * 0.04;
    pts.push([X(cx + Math.sin(a) * (bw / 2) * l * (1 - 0.1 * Math.cos(a))), Y(bcy + Math.cos(a) * (bh / 2) * l)]);
  }
  const path = () => { g.beginPath(); const m = (i) => [(pts[i][0] + pts[(i + 1) % N][0]) / 2, (pts[i][1] + pts[(i + 1) % N][1]) / 2]; let m0 = m(N - 1); g.moveTo(m0[0], m0[1]); for (let i = 0; i < N; i++) { const mm = m(i); g.quadraticCurveTo(pts[i][0], pts[i][1], mm[0], mm[1]); } g.closePath(); };
  const k = H(id + 40, seed + 2), top = lerpHex("#98a583", "#7a8868", k), low = lerpHex("#7d8a69", "#667559", k);
  const gr = g.createLinearGradient(0, Y(topY), 0, Y(topY - bh)); gr.addColorStop(0, top); gr.addColorStop(1, low);
  path(); g.fillStyle = gr; g.fill();
  g.save(); path(); g.clip();
  for (let i = 0; i < 46; i++) {   // mottled blotches and pale scuffs
    const x = X(cx + (H(i + id * 7, seed + 3) - 0.5) * bw), y = Y(bcy + (H(i + 60 + id * 7, seed + 3) - 0.5) * bh), r = (0.012 + H(i + 120 + id, seed) * 0.03) * ppm;
    g.fillStyle = H(i + 200, seed + id) < 0.62 ? "rgba(60,72,50,0.22)" : "rgba(205,212,180,0.17)"; g.beginPath(); g.ellipse(x, y, r, r * 0.7, H(i + 300, seed + id) * 3, 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(50,60,42,0.55)"; g.lineWidth = 1.6;   // wrinkles
  for (let i = 0; i < 16; i++) {
    const x = X(cx + (H(i + id * 5, seed + 4) - 0.5) * bw * 0.8), y = Y(bcy + (H(i + 70 + id * 5, seed + 4) - 0.5) * bh * 0.85), l = (0.05 + H(i + 140, seed + id) * 0.1) * ppm;
    g.beginPath(); g.moveTo(x - l / 2, y); g.quadraticCurveTo(x, y + (H(i + 210, seed + id) - 0.3) * 10, x + l / 2, y + 1); g.stroke();
  }
  g.strokeStyle = "rgba(45,55,38,0.5)"; g.lineWidth = 2.4;   // the line down the back
  g.beginPath(); g.moveTo(X(cx), Y(topY - 0.12 * s)); g.quadraticCurveTo(X(cx + 0.05), Y(bcy), X(cx - 0.02), Y(topY - bh * 0.9)); g.stroke();
  g.restore();
  g.lineJoin = "round"; g.strokeStyle = "rgba(38,46,34,0.9)"; g.lineWidth = 2.4; path(); g.stroke();
  g.strokeStyle = "rgba(38,46,34,0.35)"; g.lineWidth = 1.2; g.save(); g.translate(1.2, -1); path(); g.stroke(); g.restore();   // a second, looser line
  // long pale sprouts out of the head and the shoulders, some tipped mauve
  const ns = 5 + Math.floor(H(id + 90, seed) * 4);
  for (let i = 0; i < ns; i++) {
    const head = i < ns * 0.7, a = head ? (H(i + id * 3, seed + 5) - 0.5) * 2.1 : (H(i + id * 3, seed + 5) < 0.5 ? -1 : 1) * (1.3 + H(i + 30, seed + id) * 0.5);
    const sx = cx + Math.sin(a) * (bw / 2) * 0.9, sy = bcy + Math.cos(a) * (bh / 2) * 0.93;
    const dir = a + (H(i + 50, seed + id) - 0.5) * 0.7, len = (head ? 0.16 : 0.12) + H(i + 70, seed + id) * (head ? 0.26 : 0.12) * s;
    const ex = sx + Math.sin(dir) * len, ey = sy + Math.cos(dir) * len * (head ? 1 : 0.55), cxp = sx + Math.sin(dir) * len * 0.5 + (H(i + 110, seed + id) - 0.5) * 0.14, cyp = sy + Math.cos(dir) * len * 0.5;
    g.lineCap = "round";
    g.strokeStyle = "rgba(90,86,60,0.8)"; g.lineWidth = 3.4; g.beginPath(); g.moveTo(X(sx), Y(sy)); g.quadraticCurveTo(X(cxp), Y(cyp), X(ex), Y(ey)); g.stroke();
    g.strokeStyle = "#e9e2c8"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(sx), Y(sy)); g.quadraticCurveTo(X(cxp), Y(cyp), X(ex), Y(ey)); g.stroke();
    if (H(i + 150, seed + id) > 0.55) { g.strokeStyle = "#b394b8"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(cxp) + (X(ex) - X(cxp)) * 0.78, Y(cyp) + (Y(ey) - Y(cyp)) * 0.78); g.lineTo(X(ex), Y(ey)); g.stroke(); }
  }
  g.restore();
}

function crowdTex(seed) {
  const W = 1360, Hh = 720, ppm = 200, X = (x) => (x + 3.4) * ppm, Y = (y) => Hh - y * ppm;
  return canvasTex(W, Hh, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, "#a3abad"); sky.addColorStop(0.6, "#8c9395"); sky.addColorStop(1, "#6d7274"); g.fillStyle = sky; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 9; i++) {   // the far side of the street: facades in muted greys with dark windows
      const x0 = -3.5 + i * 0.82 + (H(i, seed + 8) - 0.5) * 0.2, w = 0.8 + H(i + 20, seed + 8) * 0.3, top = 3.3 + H(i + 40, seed + 8) * 0.5;
      g.fillStyle = lerpHex("#848a8c", "#9a9a92", H(i + 60, seed + 8)); g.fillRect(X(x0), Y(top), w * ppm, (top - 0.2) * ppm);
      for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) { g.fillStyle = H(r * 5 + c + i * 11, seed + 9) < 0.18 ? "rgba(190,175,120,0.5)" : "rgba(45,52,56,0.65)"; g.fillRect(X(x0 + 0.1 + c * (w - 0.1) / 3), Y(3.0 - r * 0.38 + (top - 3.4)), (w / 3 - 0.14) * ppm, 0.24 * ppm); }
    }
    g.fillStyle = "rgba(60,64,66,0.5)"; g.fillRect(0, Y(0.5), W, 0.5 * ppm);   // the road
    const rows = [{ top: 1.8, s: 0.88, n: 11, haze: 0.24 }, { top: 1.6, s: 0.96, n: 10, haze: 0.15 }, { top: 1.4, s: 1.04, n: 10, haze: 0.07 }, { top: 1.14, s: 1.12, n: 9, haze: 0 }, { top: 0.88, s: 1.16, n: 9, haze: 0 }];
    let id = 0;
    rows.forEach((row, r) => {
      const sp = 6.8 / row.n;
      for (let i = 0; i < row.n; i++) { const cx = -3.4 + (i + 0.5 + (r % 2 ? 0.5 : 0)) * sp + (H(id, seed + 11) - 0.5) * 0.16; paintZombie(g, X, Y, cx, row.top + (H(id + 5, seed + 11) - 0.5) * 0.14, row.s, id, seed); id++; }
      if (row.haze) { g.fillStyle = `rgba(138,145,147,${row.haze})`; g.fillRect(0, Y(row.top + 0.7), W, (row.top + 0.7) * ppm); }
    });
    const dark = g.createLinearGradient(0, Y(0.9), 0, Hh); dark.addColorStop(0, "rgba(40,45,44,0)"); dark.addColorStop(1, "rgba(40,45,44,0.85)"); g.fillStyle = dark; g.fillRect(0, Y(0.9), W, 0.9 * ppm);
  });
}

// ---------------------------------------------------------------------------------------------- the shop's painted surfaces
function floorTex(W, D, seed) {
  const ppm = 160, T = 0.3, ts = T * ppm;
  return canvasTex(Math.round(W * ppm), Math.round(D * ppm), (g, w, h) => {
    g.fillStyle = "#8d8a7e"; g.fillRect(0, 0, w, h);
    const nx = Math.ceil(W / T), nz = Math.ceil(D / T);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const id = j * 60 + i, cream = (i + j) % 2 === 0, x = i * ts, y = j * ts;
      const base = cream ? lerpHex("#e2d9bf", "#d2c8a8", H(id, seed)) : lerpHex("#a9aba6", "#92948f", H(id, seed));
      g.fillStyle = base; g.beginPath(); g.moveTo(x + 1, y + 1); g.lineTo(x + ts - 1 + (H(id + 1, seed) - 0.5) * 1.5, y + 1); g.lineTo(x + ts - 1, y + ts - 1 + (H(id + 2, seed) - 0.5) * 1.5); g.lineTo(x + 1, y + ts - 1); g.closePath(); g.fill();
      for (let k = 0; k < 7; k++) { g.fillStyle = H(id * 9 + k, seed + 2) < 0.5 ? "rgba(0,0,0,0.045)" : "rgba(255,255,255,0.07)"; g.fillRect(x + H(id * 9 + k + 300, seed) * ts * 0.8, y + H(id * 9 + k + 600, seed) * ts * 0.8, 6 + H(id + k, seed) * 20, 2 + H(id + k + 9, seed) * 6); }   // brush marks
      g.strokeStyle = "rgba(96,92,78,0.7)"; g.lineWidth = 1.6; g.beginPath();   // grout, each edge drawn on its own
      g.moveTo(x + (H(id + 3, seed) - 0.5) * 1.5, y + (H(id + 4, seed) - 0.5) * 1.2); g.lineTo(x + ts, y + (H(id + 5, seed) - 0.5) * 1.5);
      g.moveTo(x + (H(id + 6, seed) - 0.5) * 1.5, y); g.lineTo(x + (H(id + 7, seed) - 0.5) * 1.5, y + ts); g.stroke();
      if (H(id + 8, seed) > 0.96) {   // a cracked tile: a jagged line, a pale edge beside it
        let cx = x + H(id + 11, seed) * ts, cy = y; const pts = [[cx, cy]];
        for (let k = 1; k <= 6; k++) { cx += (H(id + 20 + k, seed) - 0.5) * ts * 0.34; cy = y + (k / 6) * ts; pts.push([cx, cy]); }
        for (const [col, off, lw] of [["rgba(255,255,255,0.35)", 1.5, 1.2], ["rgba(35,32,26,0.85)", 0, 1.6]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px + off, py) : g.moveTo(px + off, py))); g.stroke(); }
      }
      if (H(id + 12, seed) > 0.93) { g.fillStyle = "rgba(40,36,28,0.5)"; g.beginPath(); g.moveTo(x + 1, y + 1); g.lineTo(x + 7 + H(id + 13, seed) * 6, y + 1); g.lineTo(x + 1, y + 6 + H(id + 14, seed) * 6); g.closePath(); g.fill(); }   // a chipped corner
    }
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${H(i + 5, seed) < 0.5 ? "70,58,40" : "40,40,38"},${0.05 + H(i + 6, seed) * 0.08})`; g.beginPath(); g.ellipse(H(i, seed + 4) * w, H(i + 50, seed + 4) * h, 20 + H(i + 90, seed) * 70, 8 + H(i + 130, seed) * 24, H(i + 170, seed) * 3, 0, 7); g.fill(); }   // dirt and scuffs
    g.strokeStyle = "rgba(60,50,38,0.2)"; g.lineWidth = 7; g.lineCap = "round";   // the drag marks of trolleys and boots
    for (let i = 0; i < 5; i++) { const x = H(i, seed + 12) * w, y = H(i + 20, seed + 12) * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 60, y + (H(i + 4, seed) - 0.5) * 60, x + 140 + H(i + 8, seed) * 120, y + (H(i + 9, seed) - 0.5) * 80); g.stroke(); }
    const dust = g.createLinearGradient(0, 0, 0, h); dust.addColorStop(0, "rgba(120,115,100,0.28)"); dust.addColorStop(1, "rgba(120,115,100,0)"); g.fillStyle = dust; g.fillRect(0, 0, w, h);
  });
}

function plasterTex(w, h, seed, dado, bright = 0) {   // a painted wall of w x h m at 100 px a metre
  const ppm = 100;
  return canvasTex(Math.round(w * ppm), Math.round(h * ppm), (g, cw, ch) => {
    g.fillStyle = lerpHex("#c6c9b6", "#d6d6c4", bright); g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 160; i++) { g.fillStyle = H(i, seed) < 0.5 ? "rgba(255,255,240,0.05)" : "rgba(60,60,40,0.045)"; g.fillRect(H(i + 200, seed) * cw, H(i + 400, seed) * ch, 25 + H(i + 600, seed) * 90, 5 + H(i + 800, seed) * 14); }
    if (dado) {
      const dy = ch - dado * ppm; g.fillStyle = "#6f7d74"; g.fillRect(0, dy, cw, ch - dy);
      for (let i = 0; i < 120; i++) { g.fillStyle = H(i, seed + 3) < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"; g.fillRect(H(i + 40, seed + 3) * cw, dy + H(i + 80, seed + 3) * (ch - dy), 20 + H(i + 120, seed) * 60, 3 + H(i + 160, seed) * 8); }
      g.fillStyle = "#3d4a44"; g.fillRect(0, dy - 2, cw, 3); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, dy - 4, cw, 2);
    }
    for (let i = 0; i < 9; i++) {   // damp drips and stains running down
      const x = H(i, seed + 6) * cw, y = H(i + 20, seed + 6) * ch * 0.5, l = 30 + H(i + 40, seed + 6) * ch * 0.5;
      const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, "rgba(90,80,50,0.16)"); gr.addColorStop(1, "rgba(90,80,50,0)"); g.fillStyle = gr; g.fillRect(x, y, 5 + H(i + 60, seed) * 14, l);
    }
    g.strokeStyle = "rgba(40,36,28,0.45)"; g.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { let x = H(i + 7, seed + 8) * cw, y = H(i + 17, seed + 8) * ch * 0.4; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (H(i * 9 + k, seed + 9) - 0.5) * 22; y += 10 + H(i * 9 + k + 50, seed + 9) * 18; g.lineTo(x, y); } g.stroke(); }
  });
}

function glassTex(seed) {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = "rgba(175,195,196,0.10)"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(235,240,235,${0.05 + H(i + 4, seed) * 0.1})`; g.fillRect(H(i, seed + 31) * w, H(i + 30, seed + 31) * h * 0.4, 6 + H(i + 60, seed) * 30, 40 + H(i + 90, seed) * h * 0.6); }   // dusty streaks
    g.strokeStyle = "rgba(240,245,240,0.4)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(w * 0.7, h * 0.1); g.lineTo(w * 0.62, h * 0.27); g.lineTo(w * 0.66, h * 0.33); g.lineTo(w * 0.55, h * 0.5); g.stroke();
  });
}

function glowTex() {
  return canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(215,228,240,1)"); gr.addColorStop(0.5, "rgba(190,205,222,0.5)"); gr.addColorStop(1, "rgba(160,180,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

function counterFrontTex(seed) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#566a5c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = 8 + i * 62; g.fillStyle = "#4a5d51"; g.fillRect(x, 10, 54, h - 20); g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 2; g.strokeRect(x, 10, 54, h - 20); g.strokeStyle = "rgba(0,0,0,0.3)"; g.strokeRect(x + 4, 14, 46, h - 28); }
    for (let i = 0; i < 40; i++) { g.fillStyle = H(i, seed + 5) < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"; g.fillRect(H(i + 40, seed + 5) * w, H(i + 80, seed + 5) * h, 10 + H(i + 120, seed) * 30, 2 + H(i + 160, seed) * 4); }
    g.fillStyle = "rgba(20,20,15,0.3)"; g.fillRect(0, h - 10, w, 10);   // kick scuffs
  });
}

// a torn, blank paper strip: a long thin shape with a jagged end
function tornStrip(len, hgt, seed) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(len, 0);
  const n = 5; for (let i = 0; i <= n; i++) s.lineTo(len - (i % 2 ? 0.012 : 0) - H(i, seed) * 0.014, (i / n) * hgt);
  s.lineTo(0, hgt); s.closePath();
  return new THREE.ShapeGeometry(s);
}

// ---------------------------------------------------------------------------------------------- the kinds
export const ZSHOP_KINDS = {
  // -------------------------------------------------------------------------------------------- the shop
  zshop(P) {
    const S = P.spec, seed = S.seed ?? 1, W = S.w ?? 5.5, D = S.d ?? 4.2, HT = S.h ?? 2.8;
    const dX = S.doorX ?? 1.4, dW = S.doorW ?? 1.0, dH = S.doorH ?? 2.1, wX = S.winX ?? -0.9, wW = S.winW ?? 2.2, wH = S.winH ?? 1.4, sill = S.winSill ?? 0.8;
    const { reg, M, mesh, box } = kit(false);
    const zb = -D / 2, whole = P.whole;
    const metal = M("#8a9096", { roughness: 0.5, metalness: 0.15 }), dark = M("#32363a", { roughness: 0.7 }), alu = M("#a7adb1", { roughness: 0.45, metalness: 0.2 });
    // floor
    const floor = mesh(new THREE.PlaneGeometry(W, D), M("#ffffff", { map: floorTex(W, D, seed), roughness: 0.55 }), whole, 0, 0, 0); floor.rotation.x = -Math.PI / 2;
    // walls: the back wall in pieces round the door and the window, one painted canvas over all of it
    const backT = plasterTex(W, HT, seed + 1, 0.95, 0.2), backM = M("#ffffff", { map: backT, side: THREE.DoubleSide }), edgeM = M("#aab0a0");
    const piece = (x0, x1, y0, y1) => {
      const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0), pa = g.attributes.position, uv = g.attributes.uv, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (let i = 0; i < pa.count; i++) uv.setXY(i, (cx + pa.getX(i) + W / 2) / W, (cy + pa.getY(i)) / HT);
      mesh(g, backM, whole, cx, cy, zb); box(x1 - x0, y1 - y0, 0.16, edgeM, whole, cx, cy, zb - 0.081);
    };
    const wx0 = wX - wW / 2, wx1 = wX + wW / 2, dx0 = dX - dW / 2, dx1 = dX + dW / 2;
    piece(-W / 2, wx0, 0, HT); piece(wx1, dx0, 0, HT); piece(dx1, W / 2, 0, HT);
    piece(wx0, wx1, 0, sill); piece(wx0, wx1, sill + wH, HT); piece(dx0, dx1, dH, HT);
    // the reveals (thin returns round the openings)
    for (const [x0, x1, y0, y1] of [[wx0, wx1, sill, sill + wH], [dx0, dx1, 0, dH]]) {
      box(0.04, y1 - y0, 0.16, edgeM, whole, x0, (y0 + y1) / 2, zb - 0.08); box(0.04, y1 - y0, 0.16, edgeM, whole, x1, (y0 + y1) / 2, zb - 0.08); box(x1 - x0, 0.04, 0.16, edgeM, whole, (x0 + x1) / 2, y1, zb - 0.08);
    }
    box(W, 0.08, 0.16, edgeM, whole, 0, sill - 0.04, zb - 0.08);
    const wallL = plasterTex(D, HT, seed + 2, 0.95, 0.1), wallR = plasterTex(D, HT, seed + 3, 0.95, 0.1);
    const sideL = mesh(new THREE.PlaneGeometry(D, HT), M("#ffffff", { map: wallL, side: THREE.DoubleSide }), whole, -W / 2, HT / 2, 0); sideL.rotation.y = Math.PI / 2;
    const sideR = mesh(new THREE.PlaneGeometry(D, HT), M("#ffffff", { map: wallR, side: THREE.DoubleSide }), whole, W / 2, HT / 2, 0); sideR.rotation.y = -Math.PI / 2;
    const ceil = mesh(new THREE.PlaneGeometry(W, D), M("#ffffff", { map: plasterTex(W, D, seed + 4, 0, 0.5), side: THREE.DoubleSide }), whole, 0, HT, 0); ceil.rotation.x = Math.PI / 2;
    // two dead strip lamps hung on chains, along x; one tube cracked and grey
    [[-1.15, -0.35, 1], [1.05, 0.6, 2]].forEach(([x, z, k]) => {
      const lg = new THREE.Group(); lg.position.set(x, HT - 0.2, z); lg.rotation.y = (H(k, seed) - 0.5) * 0.06; whole.add(lg);
      box(1.25, 0.05, 0.14, metal, lg, 0, 0.0, 0); box(1.19, 0.03, 0.1, M("#cdd0c6", { roughness: 0.9 }), lg, 0, -0.037, 0);
      for (const sx of [-0.5, 0.5]) { mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 5), dark, lg, sx, 0.1, 0); }
      for (const sx of [-0.62, 0.62]) box(0.03, 0.06, 0.14, dark, lg, sx, -0.01, 0);
    });
    // the shop door and the window in the back wall: aluminium frames, dusty glass, the street card behind
    const crowd = mesh(new THREE.PlaneGeometry(6.8, 3.6), new THREE.MeshBasicMaterial({ map: crowdTex(seed) }), whole, 0, 1.8, zb - 0.6);
    crowd.castShadow = false; crowd.receiveShadow = false; crowd.userData.noOutline = true; crowd.material.userData.noOutline = true;
    const glassM = (k) => { const m = new THREE.MeshBasicMaterial({ map: glassTex(seed + k), transparent: true, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; };
    const dz = zb - 0.03;
    const door = new THREE.Group(); door.position.set(dX, 0, dz); whole.add(door);
    box(0.05, dH, 0.05, alu, door, -dW / 2 + 0.025, dH / 2, 0); box(0.05, dH, 0.05, alu, door, dW / 2 - 0.025, dH / 2, 0);
    box(dW, 0.06, 0.05, alu, door, 0, dH - 0.03, 0); box(dW, 0.2, 0.05, alu, door, 0, 0.1, 0);
    const dg = mesh(new THREE.PlaneGeometry(dW - 0.1, dH - 0.26), glassM(1), door, 0, 0.2 + (dH - 0.26) / 2, 0); dg.renderOrder = 3; dg.userData.solid = false;
    box(0.55, 0.025, 0.03, metal, door, 0.0, 1.0, 0.05); for (const sx of [-0.25, 0.25]) box(0.02, 0.02, 0.05, metal, door, sx, 1.0, 0.03);   // the push bar
    box(0.3, 0.2, 0.01, M("#d8d2bb"), door, -0.2, 1.45, 0.03).rotation.z = 0.05;   // a blank taped paper
    const win = new THREE.Group(); win.position.set(wX, sill, dz); whole.add(win);
    for (const [bx, by, bw, bh] of [[0, 0.03, wW, 0.06], [0, wH - 0.03, wW, 0.06], [-wW / 2 + 0.03, wH / 2, 0.06, wH], [wW / 2 - 0.03, wH / 2, 0.06, wH], [0, wH / 2, 0.05, wH]]) box(bw, bh, 0.05, alu, win, bx, by, 0);
    const wg = mesh(new THREE.PlaneGeometry(wW - 0.1, wH - 0.1), glassM(2), win, 0, wH / 2, 0); wg.renderOrder = 3; wg.userData.solid = false;
    box(wW + 0.12, 0.05, 0.14, M("#8b8f86"), whole, wX, sill - 0.02, zb + 0.03);   // the sill board
    [[-0.6, 0.55, 0.38, 0.24, 0.06], [0.45, 0.8, 0.3, 0.2, -0.1], [0.62, 0.35, 0.5, 0.03, 0.02]].forEach(([px, py, pw, ph, rz]) => { const p = box(pw, ph, 0.004, M("#d9d3bd"), win, px, py, 0.03); p.rotation.z = rz; });   // blank bills stuck on the inside
    // the dull light the window lets in: a pool on the floor, additive
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(wW * 1.1, 1.9), new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(wX, 0.01, zb + 1.2); pool.renderOrder = 4; pool.frustumCulled = false; pool.userData.steam = true; pool.userData.solid = false; pool.material.userData.noOutline = true; whole.add(pool);
    // shelf units
    const shelfM = M("#7d858a", { roughness: 0.55, metalness: 0.1 }), boardM = M("#9ca2a4", { roughness: 0.6 }), backM2 = M("#8b948f", { roughness: 0.8 }), stripM = M("#d9d3bb", { roughness: 0.9, side: THREE.DoubleSide });
    const tinMats = M("#c3c8cb", { roughness: 0.4, metalness: 0.12 });
    const labs = LABEL_COLORS.map((_, i) => M("#ffffff", { map: labelTex(i, seed + i * 3), roughness: 0.85 }));
    const lidD = M("#d0d4d6", { roughness: 0.35 });
    const tinGeo = new THREE.CylinderGeometry(TIN.r, TIN.r, 0.11, 20), labGeo = new THREE.CylinderGeometry(0.0379, 0.0379, 0.066, 20, 1, true, Math.PI), rimGeo = new THREE.TorusGeometry(0.0372, 0.0022, 5, 20), lidGeo = new THREE.CircleGeometry(0.0346, 20);
    const emptyBoards = [];
    // one shelf tin placed by its bottom centre; lying = along an axis
    let tn = 0;
    const shelfTin = (x, y, z, o = {}) => {
      const n = tn++, g = new THREE.Group(), lab = o.label ?? Math.floor(H(n, seed + 41) * 2.4 + (n % 3 === 0 ? 1 : 0)) % 4;
      mesh(tinGeo, tinMats, g, 0, 0.055, 0); const l = mesh(labGeo, labs[lab], g, 0, 0.055, 0); l.rotation.y = H(n + 7, seed) * 6.283;
      const rm = mesh(rimGeo, tinMats, g, 0, 0.1105, 0); rm.rotation.x = Math.PI / 2; mesh(rimGeo, tinMats, g, 0, 0.0015, 0).rotation.x = Math.PI / 2;
      const ld = mesh(lidGeo, lidD, g, 0, 0.1105, 0); ld.rotation.x = -Math.PI / 2;
      if (o.lie) { const out = new THREE.Group(); g.position.set(0, -0.055, 0); out.add(g); out.position.set(x, y + TIN.r, z); out.rotation.set(0, o.yaw ?? 0, Math.PI / 2); whole.add(out); }
      else { g.position.set(x, y, z); g.rotation.y = o.yaw ?? H(n + 3, seed) * 6.283; if (o.lean) g.rotation.z = o.lean; whole.add(g); }
    };
    const unit = (name, xWall, dir, z0, len, plan) => {
      // dir +1: the unit stands on the left wall and opens toward +x; -1: on the right wall
      const dep = 0.4, xf = xWall + dir * dep, xm = xWall + dir * dep / 2, bys = [0.2, 0.7, 1.2, 1.7];
      box(0.02, 2.0, len, backM2, whole, xWall + dir * 0.01, 1.0, z0 + len / 2);
      const posts = Math.ceil(len) + 1;
      for (let i = 0; i < posts; i++) { const z = z0 + 0.02 + (i / (posts - 1)) * (len - 0.04); box(0.04, 2.0, 0.04, shelfM, whole, xf - dir * 0.02, 1.0, z); box(0.04, 2.0, 0.04, shelfM, whole, xWall + dir * 0.03, 1.0, z); }
      for (const y of [...bys, 2.0]) box(dep, 0.03, len, boardM, whole, xm, y, z0 + len / 2);
      for (const y of bys) box(0.012, 0.05, len, shelfM, whole, xf - dir * 0.006, y + 0.04, z0 + len / 2);   // the front lip
      // torn blank price strips on the lips
      let k = 0; for (let b = 0; b < 4; b++) for (let i = 0; i < 3; i++) {
        if (H(b * 7 + i + (dir > 0 ? 0 : 100), seed + 51) < 0.35) continue;
        const sg = mesh(tornStrip(0.34 + H(k, seed) * 0.3, 0.032, k), stripM, whole, xf + dir * 0.008, bys[b] + 0.0 + 0.027 + (H(k + 1, seed) - 0.5) * 0.004, z0 + 0.1 + (i + H(k + 2, seed) * 0.6) * (len - 0.5) / 3);
        sg.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; sg.rotation.z = (H(k + 3, seed) - 0.5) * 0.06; k++;
        if (H(k + 5, seed) > 0.5) { const m = mesh(new THREE.PlaneGeometry(0.05 + H(k, seed) * 0.05, 0.007), M("#6c5a4a"), whole, sg.position.x + dir * 0.002, sg.position.y + 0.012, sg.position.z + 0.1 + H(k, seed) * 0.1); m.rotation.y = sg.rotation.y; }   // a scribble bar, no letters
      }
      // the tins: per board a list of groups { z (from the unit's start), n, mode: row | pyr | lie | one, deep: 0..1 from the wall }
      plan.forEach((groups, b) => {
        const y = bys[b] + 0.015;
        if (!groups.length) { emptyBoards.push(b); const lid = mesh(lidGeo, lidD, whole, xm + dir * (H(b, seed + 62) - 0.5) * 0.1, y + 0.002, z0 + len * (0.3 + H(b + 3, seed + 62) * 0.4)); lid.rotation.x = -Math.PI / 2; return; }
        for (const gr of groups) {
          const zc = z0 + gr.z, depth = xWall + dir * (0.12 + (gr.deep ?? 0.3) * 0.22);
          if (gr.mode === "pyr") { [-0.0425, 0.0425, -0.0425, 0.0425].forEach((dz2, i) => i < 2 && shelfTin(depth, y, zc + dz2 * 1.02, { label: gr.label })); shelfTin(depth, y + 0.11, zc, { label: gr.label }); }
          else if (gr.mode === "lie") for (let i = 0; i < gr.n; i++) shelfTin(depth + dir * (i % 2) * 0.01, y, zc + i * 0.08, { lie: true, yaw: (H(i + b, seed + 70) - 0.5) * 0.8 + (gr.yaw ?? 0), label: gr.label });
          else for (let i = 0; i < gr.n; i++) shelfTin(depth + (H(i + b * 5, seed + 71) - 0.5) * 0.03, y, zc + i * (0.078 + H(i + b, seed + 72) * 0.012), { label: gr.label, lean: i === gr.n - 1 && gr.lean ? gr.lean : 0 });
        }
      });
    };
    // left unit z -1.8 .. 1.2 (bottom board first): about 22 tins; the top board empty
    unit("L", -W / 2, 1, zb + 0.3, 3.0, [
      [{ z: 0.2, n: 4, mode: "row" }, { z: 1.4, n: 2, mode: "row", deep: 0.7 }, { z: 2.2, n: 1, mode: "lie", yaw: 1.2 }],
      [{ z: 0.6, n: 3, mode: "row", lean: 0.35 }, { z: 1.6, n: 4, mode: "row" }, { z: 2.55, n: 2, mode: "lie", yaw: -0.5 }],
      [{ z: 0.25, n: 2, mode: "row" }, { z: 1.1, n: 1, mode: "pyr" }, { z: 2.4, n: 2, mode: "row", deep: 0.1 }],
      [],
    ]);
    // right unit z -1.8 .. 0.2: about 16 tins, one board bare
    unit("R", W / 2, -1, zb + 0.3, 2.0, [
      [{ z: 0.15, n: 3, mode: "row" }, { z: 1.1, n: 2, mode: "row", deep: 0.7 }, { z: 1.6, n: 1, mode: "lie", yaw: 0.3 }],
      [{ z: 0.9, n: 1, mode: "lie", yaw: 1.9 }, { z: 1.5, n: 2, mode: "row", deep: 0.6 }],
      [{ z: 0.1, n: 3, mode: "row" }, { z: 1.0, n: 1, mode: "pyr", label: 1 }],
      [{ z: 0.5, n: 2, mode: "row", deep: 0.5 }],
    ]);
    // two tins on the floor and a squashed carton
    shelfTin(-0.55, 0, 0.45, { lie: true, yaw: 0.5, label: 0 }); shelfTin(0.2, 0, -0.95, { lie: true, yaw: 2.2, label: 2 });
    const carton = box(0.45, 0.03, 0.32, M("#a98c62"), whole, 0.85, 0.016, 0.05); carton.rotation.y = 0.4; box(0.4, 0.05, 0.3, M("#9b7f58"), whole, 0.88, 0.04, 0.04).rotation.set(0, 0.45, 0.08);
    // a bucket and a mop in the back left corner
    const bucket = mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 18, 1, true), M("#6d7b86", { side: THREE.DoubleSide }), whole, -1.95, 0.15, zb + 0.35);
    mesh(new THREE.CircleGeometry(0.13, 18), M("#505a62"), whole, -1.95, 0.01, zb + 0.35).rotation.x = -Math.PI / 2;
    const mop = new THREE.Group(); mop.position.set(-1.95, 0.0, zb + 0.35); mop.rotation.set(-0.12, 0, 0.18); whole.add(mop); mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 6), M("#8a6b45"), mop, 0, 0.65, 0); mesh(new THREE.SphereGeometry(0.1, 8, 6), M("#aca58f"), mop, 0, 0.18, 0).scale.set(1, 1.4, 1);
    // the counter at the right front and its old till
    const cx = (1.15 + 2.65) / 2, cz = 1.2;
    mesh(new THREE.PlaneGeometry(1.5, 0.95), M("#ffffff", { map: counterFrontTex(seed), side: THREE.DoubleSide }), whole, cx, 0.475, cz + 0.351);
    box(1.5, 0.95, 0.7, M("#4a5d51"), whole, cx, 0.475, cz);
    box(1.58, 0.045, 0.78, M("#cdc6b0", { roughness: 0.5 }), whole, cx, 0.9725, cz);
    const till = new THREE.Group(); till.position.set(1.9, 0.995, cz); till.rotation.y = -0.18; whole.add(till);
    const cream = M("#cbc3a6", { roughness: 0.6 });
    box(0.42, 0.14, 0.38, cream, till, 0, 0.07, 0);
    const keys = box(0.4, 0.05, 0.22, M("#b9b196"), till, 0, 0.165, 0.06); keys.rotation.x = -0.32;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const k = box(0.045, 0.012, 0.03, M(H(r * 6 + c, seed) < 0.18 ? "#c9652f" : "#3b3a36"), till, -0.15 + c * 0.06, 0.19 + r * 0.012 - 0.002, 0.15 - r * 0.045); k.rotation.x = -0.32; }
    box(0.34, 0.12, 0.06, cream, till, 0, 0.23, -0.14); box(0.28, 0.06, 0.01, M("#2e3a34", { roughness: 0.4 }), till, 0, 0.245, -0.108);
    box(0.4, 0.05, 0.3, M("#8d877a"), till, 0.0, 0.03, 0.2);   // the drawer, a little open
    box(0.5, 0.04, 0.36, M("#b5ad92"), whole, 1.45, 0.995 + 0.02, cz + 0.12).rotation.y = 0.15;   // a wooden tray with a few coins' worth of dust
    // dim: the look converts every material to its own toon copy when the scene is built, so a later change of material.color
    // is not seen; the dim goes through a vertex colour on every mesh instead (read live), plus the floor pool's opacity
    const regM = new Set(reg.map(([m]) => m)), dimAttrs = new Set();
    for (const m of regM) m.vertexColors = true;
    whole.traverse((o) => {
      if (!o.isMesh || !regM.has(o.material)) return;
      const g = o.geometry; if (!g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      dimAttrs.add(g.attributes.color);
    });
    let key = "";
    const dimTo = (d) => { const k = d.toFixed(3); if (k === key) return; key = k; const f = 1 - 0.65 * d; for (const a of dimAttrs) { a.array.fill(f); a.needsUpdate = true; } pool.material.opacity = 0.12 + 0.55 * d; };
    return { grip: 0, apply(ps) { dimTo(clamp(ps.dim ?? S.dim ?? 0.25)); } };
  },

  // -------------------------------------------------------------------------------------------- the food tin
  tin(P) {
    const S = P.spec, seed = S.seed ?? 1, { M, mesh } = kit(true);
    const parts = buildTin(P.whole, { M, mesh, seed, label: 0, lidOpenable: true });
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open ?? 0), e = o * o * (3 - 2 * o);
        parts.A.rotation.x = -rad(105) * e; parts.B.rotation.x = -rad(50) * sm(0.35, 1, o);
        parts.beans.visible = o > 0.001;
      },
    };
  },

  // -------------------------------------------------------------------------------------------- the bag
  tinbag(P) {
    const S = P.spec, seed = S.seed ?? 1, k = (S.size ?? 0.75) / 0.75, { M, mesh } = kit(true);
    const root = new THREE.Group(); root.scale.setScalar(k); P.whole.add(root);
    // control rings (y, r) from the bottom pole to the rim: floor (resting) and hung states at fill 0, 0.5, 1
    const FLOOR = [
      [[0, 0], [0, 0.14], [0.012, 0.23], [0.05, 0.275], [0.1, 0.24], [0.15, 0.15], [0.185, 0.105], [0.2, 0.1], [0.205, 0.125]],
      [[0, 0], [0, 0.17], [0.02, 0.27], [0.14, 0.31], [0.26, 0.27], [0.36, 0.17], [0.43, 0.105], [0.46, 0.1], [0.47, 0.125]],
      [[0, 0], [0, 0.2], [0.03, 0.28], [0.28, 0.31], [0.5, 0.27], [0.63, 0.16], [0.7, 0.1], [0.7125, 0.085], [0.75, 0.125]],
    ];
    const HUNG = [
      [[0, 0], [0, 0.06], [0.02, 0.11], [0.2, 0.13], [0.4, 0.12], [0.55, 0.1], [0.65, 0.08], [0.7125, 0.07], [0.75, 0.11]],
      [[0, 0], [0, 0.1], [0.03, 0.2], [0.13, 0.27], [0.27, 0.235], [0.43, 0.15], [0.6, 0.085], [0.7125, 0.075], [0.75, 0.105]],
      [[0, 0], [0, 0.2], [0.03, 0.28], [0.28, 0.31], [0.5, 0.27], [0.63, 0.16], [0.7, 0.1], [0.7125, 0.085], [0.75, 0.125]],
    ];
    const KZ_FLOOR = [0.9, 0.88, 0.86], KZ_HUNG = [0.4, 0.66, 0.86], LEAN = [0.1, 0.09, 0], NECK = 7;
    const states = (f, hang) => {   // the control rings, depth ratio and lean for (fill, hang)
      const a = f < 0.5 ? 0 : 1, t = f < 0.5 ? f / 0.5 : (f - 0.5) / 0.5;
      const at = (T) => T[a].map((p, i) => [mix(p[0], T[a + 1][i][0], t), mix(p[1], T[a + 1][i][1], t)]);
      const fl = at(FLOOR), hu = at(HUNG), kzF = mix(KZ_FLOOR[a], KZ_FLOOR[a + 1], t), kzH = mix(KZ_HUNG[a], KZ_HUNG[a + 1], t);
      return { pts: fl.map((p, i) => [mix(p[0], hu[i][0], hang), mix(p[1], hu[i][1], hang)]), kz: mix(kzF, kzH, hang), lean: mix(mix(LEAN[a], LEAN[a + 1], t), 0, hang) };
    };
    const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return [0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)); };
    const NU = 168, SEG = 6, NV = 8 * SEG;
    // tins pressing through the cloth: each a rounded rectangle (0.075 x 0.11) on the surface at an angle and a height
    const bumps = [];
    for (let n = 0; n < 14; n++) {
      const row = n % 4, col = Math.floor(n / 4);
      bumps.push({ th: rad(-80 + col * 55 + (row % 2) * 27 + (H(n, seed + 61) - 0.5) * 18), y: 0.11 + row * 0.15 + (H(n + 20, seed + 61) - 0.5) * 0.04, tilt: (H(n + 40, seed + 61) - 0.5) * 1.1 + (n % 5 === 2 ? 1.45 : 0), on: 0.22 + H(n + 60, seed + 61) * 0.5, amp: 0.022 + H(n + 80, seed + 61) * 0.01 });
    }
    // seams on the sides (theta +-90 deg): short gaps that open where the stitching is strained
    const gaps = []; for (let n = 0; n < 8; n++) gaps.push({ side: n % 2 ? 1 : -1, y: 0.1 + (Math.floor(n / 2) * 0.16) + H(n, seed + 66) * 0.05, len: 0.045 + H(n + 9, seed + 66) * 0.03 });
    const N = (NU + 1) * (NV + 1), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), uv = new Float32Array(N * 2), idx = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { uv[(j * (NU + 1) + i) * 2] = i / NU; uv[(j * (NU + 1) + i) * 2 + 1] = j / NV; }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, d, a, d, b); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const jute = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = "#a99568"; g.fillRect(0, 0, w, h);
      const dash = (x, y, l, lw, vertical, c) => { g.strokeStyle = c; g.lineWidth = lw; for (const ox of [-w, 0, w]) { g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox + (vertical ? 0 : l), y + (vertical ? l : 0)); g.stroke(); } };
      for (let i = 0; i < 5200; i++) dash(H(i, seed) * w, H(i + 6000, seed) * h, 5 + H(i + 12000, seed) * 14, 1 + H(i + 18000, seed) * 0.8, false, lerpHex("#9a8660", "#bba97c", H(i + 24000, seed)));
      for (let i = 0; i < 5200; i++) dash(H(i + 30000, seed) * w, H(i + 36000, seed) * h, 5 + H(i + 42000, seed) * 14, 1 + H(i + 48000, seed) * 0.8, true, lerpHex("#9a8660", "#bba97c", H(i + 54000, seed)));
      for (let i = 0; i < 380; i++) dash(H(i + 60000, seed) * w, H(i + 66000, seed) * h, 4 + H(i + 72000, seed) * 12, 1.2, H(i + 78000, seed) < 0.5, "rgba(88,64,34,0.4)");   // dark slubs
      for (let i = 0; i < 28; i++) { g.fillStyle = `rgba(70,50,28,${0.04 + H(i + 4, seed) * 0.05})`; g.beginPath(); g.ellipse(H(i, seed + 5) * w, H(i + 40, seed + 5) * h, 30 + H(i + 80, seed) * 110, 18 + H(i + 120, seed) * 60, H(i + 160, seed) * 3, 0, 7); g.fill(); }   // stains
      for (const u of [0.25, 0.75]) {   // the seams: a dark folded edge and stitches across it
        g.fillStyle = "rgba(70,50,28,0.5)"; g.fillRect(w * u - 5, 0, 10, h);
        for (let y = 6; y < h; y += 14) { g.strokeStyle = "#e6d3a2"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(w * u - 10, y + (H(y, seed) - 0.5) * 2); g.lineTo(w * u + 10, y + 4 + (H(y + 1, seed) - 0.5) * 2); g.stroke(); }
      }
      // a faded blue stencil patch on the front (the seam of the canvas, u 0): an oval with a bar, no letters
      for (const ox of [0, w]) { g.save(); g.translate(ox, h * 0.46); g.strokeStyle = "rgba(66,90,126,0.38)"; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 0, 76, 56, 0, 0, 7); g.stroke(); g.fillStyle = "rgba(66,90,126,0.32)"; g.fillRect(-46, 66, 92, 9); g.fillRect(-30, 82, 60, 6); g.restore(); }
      for (let i = 0; i < 160; i++) { const x = (((H(i, seed + 8) - 0.5) * 220) % w + w) % w, y = h * 0.46 + (H(i + 160, seed + 8) - 0.5) * 190; g.fillStyle = "rgba(190,160,108,0.5)"; g.fillRect(x, y, 3 + H(i + 320, seed) * 12, 1.5); }   // worn off
    });
    const clothM = M("#ffffff", { map: jute, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
    const cloth = mesh(geo, clothM, root);
    const dark = M("#241c14", { roughness: 1 }), cord = M("#5a4630", { roughness: 0.9 }), steel = M("#c3c8cb", { roughness: 0.4, metalness: 0.12, side: THREE.DoubleSide }), lid = M("#d2d6d8", { roughness: 0.35 });
    // the inside of the mouth and three tin tops standing in it
    const hole = mesh(new THREE.CircleGeometry(0.1, 24), dark, root); hole.rotation.x = -Math.PI / 2;
    const tops = []; for (let n = 0; n < 3; n++) {
      const g = new THREE.Group(); root.add(g);
      mesh(new THREE.CylinderGeometry(0.0375, 0.0375, 0.07, 20, 1, true), steel, g, 0, -0.035, 0);
      const rim = mesh(new THREE.TorusGeometry(0.0378, 0.0028, 6, 22), steel, g, 0, 0, 0); rim.rotation.x = Math.PI / 2;
      mesh(new THREE.CircleGeometry(0.0346, 22), lid, g, 0, -0.0012, 0).rotation.x = -Math.PI / 2;
      const rp = mesh(new THREE.TorusGeometry(0.0085, 0.0016, 6, 14), steel, g, 0.006 * (n - 1), 0.0008, 0.003); rp.rotation.x = Math.PI / 2;
      tops.push(g);
    }
    const ring = mesh(new THREE.TorusGeometry(1, 0.0095, 8, 40), cord, root); ring.rotation.x = Math.PI / 2;
    const knot = mesh(new THREE.SphereGeometry(0.016, 10, 8), cord, root); knot.scale.set(1.3, 1, 0.9);
    const ends = [0, 1].map((n) => { const e = new THREE.Group(); root.add(e); mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.1, 6), cord, e, 0, -0.05, 0); mesh(new THREE.SphereGeometry(0.01, 8, 6), cord, e, 0, -0.1, 0); return e; });
    let key = "";
    const build = (f, hang) => {
      const key2 = f.toFixed(4) + "|" + hang.toFixed(4); if (key2 === key) return; key = key2;
      const st = states(f, hang), P9 = st.pts, ringAt = [];
      const yMax = P9[8][0];
      for (let j = 0; j <= NV; j++) {
        const sg = Math.min(Math.floor(j / SEG), 7), tt = j === NV ? 1 : (j % SEG) / SEG, [y0, r0] = cr(P9[Math.max(sg - 1, 0)], P9[sg], P9[sg + 1], P9[Math.min(sg + 2, 8)], tt);
        const y = Math.max(0, y0), r = Math.max(0, r0), hn = y / yMax, ox = st.lean * hn * hn, kz = j >= NECK * SEG - 3 * SEG ? mix(st.kz, 1, sm(0.55, 0.9, y / P9[NECK][0])) : st.kz;
        ringAt.push({ y, r, ox, kz });
      }
      for (let j = 0; j <= NV; j++) {
        const { y, r, ox, kz } = ringAt[j], neckZone = sm(0.82, 0.97, y / P9[NECK][0]);
        for (let i = 0; i <= NU; i++) {
          const th = (i / NU) * 6.283185, sn = Math.sin(th), cs = Math.cos(th), p = (j * (NU + 1) + i) * 3;
          let rr = r;
          // folds in the limp cloth and the ruffle at the neck
          rr += (0.011 * (1 - f * 0.85) * Math.sin(th * 7 + y * 9 + seed) + 0.006 * neckZone * Math.sin(th * 11 + seed * 2)) * sm(0.03, 0.2, y) * (r > 0.02 ? 1 : 0);
          let dep = 0, shade = 1;
          if (f > 0.2 && y > 0.04 && y < P9[NECK][0] - 0.04) {
            for (const b of bumps) {
              let da = th - b.th; da = Math.atan2(Math.sin(da), Math.cos(da));
              const a = da * rr, bb = y - b.y, ca = Math.cos(b.tilt), sa = Math.sin(b.tilt), a2 = a * ca + bb * sa, b2 = -a * sa + bb * ca;
              const qx = Math.abs(a2) - 0.0375, qy = Math.abs(b2) - 0.055, d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 0.009;
              if (d > 0.03) continue;
              const on = sm(b.on, b.on + 0.3, f);
              dep += b.amp * on * (1 - sm(-0.004, 0.012, d)); shade += on * (0.07 * (1 - sm(-0.012, 0, d)) - 0.42 * Math.exp(-(((d - 0.014) / 0.011) ** 2)));
            }
          }
          const nl = Math.hypot(sn, cs / Math.max(kz, 0.05)) || 1;   // the outward normal of the ellipse ring
          pos[p] = rr * sn + (dep * sn) / nl + ox; pos[p + 1] = y; pos[p + 2] = rr * kz * cs + (dep * cs) / Math.max(kz, 0.05) / nl;
          // vertex colour: the creases round each tin, the strained seams, a lighter worn rim
          let c = shade;
          const sd = Math.abs(Math.abs(sn) - 1) * Math.PI / 2 * rr;   // metres from the seam line along the cloth
          if (f > 0.7 && sd < 0.02) { for (const gp of gaps) if (Math.sign(sn) === gp.side && Math.abs(y - gp.y) < gp.len / 2) c *= 1 - 0.55 * sm(0.7, 1, f) * (1 - sd / 0.02); }
          if (j === NV) c *= 1.08;
          col[p] = col[p + 1] = col[p + 2] = clamp(c, 0.3, 1.1);
        }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
      const ny = P9[NECK][0], nr = ringAt[NECK * SEG].r, nk = ringAt[NECK * SEG].kz, nox = ringAt[NECK * SEG].ox;
      hole.position.set(nox, ny - 0.012, 0); hole.scale.set(nr / 0.1 * 0.97, nr / 0.1 * nk * 0.97, 1);
      ring.position.set(nox, ny - 0.004, 0); ring.scale.set(nr * 0.98, nr * nk * 0.98, 1);
      knot.position.set(nox + 0.02, ny - 0.004, nr * nk + 0.006);
      const bj = (NECK - 1) * SEG + 3, bl = ringAt[bj];
      ends.forEach((e, n) => { const a = rad(n ? 20 : 38); e.position.set(nox + Math.sin(a) * nr * 0.9 + 0.016, ny - 0.008, Math.cos(a) * nr * nk + 0.01); e.rotation.set(0.2, 0, (n ? -0.25 : 0.3) + (bl.r - nr) * 2); });
      const ft = sm(0.82, 1, f);
      tops.forEach((g, n) => { const a = rad(90 + n * 120); g.position.set(nox + Math.cos(a) * 0.043, ny - 0.05 + ft * (0.062 + (n === 1 ? 0.012 : n === 2 ? -0.008 : 0)), Math.sin(a) * 0.043 * 0.8); g.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12 + (n - 1) * 0.05); g.visible = ft > 0.02; });
    };
    return {
      grip: 0,
      apply(ps, t) {
        let hang = clamp(ps.hang ?? 0);
        if (ps.hold) hang = Math.max(hang, sm(0, 0.5, t - (ps.hold.at ?? t)));
        else if (ps.left) hang = Math.max(hang, 1 - sm(0, 0.4, t - (ps.left.at ?? t)));
        build(clamp(ps.fill ?? 1), hang);
      },
    };
  },
};

export const ZSHOP_GRIPS = {
  tin: { side: [0.0375, 0.073, 0] },          // the middle of the label on the +x side, for an arm pose; the mug hold finds its own
  tinbag: { neck: [0, 0.7125, 0] },           // 0.95 x height for size 0.75: the gathered neck, one fist round it
};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZSHOP_STATE = {
  zshop: { dim: 0.25 },
  tin: { open: 0 },
  tinbag: { fill: 1, hang: 0 },
};
