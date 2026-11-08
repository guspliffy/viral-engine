import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex, smooth } from "./props-trend.js";

// Never has money, episode 4, at your birthday (8 Nov 2026): the props of Viking's birthday in their own file, so clips
// made in parallel never edit the same one (props3d.js merges BIRTHDAY_KINDS in). Built by task T2 (builder brief).
// Jonny's eight panels: /mnt/project-files/video-scripts/2026-11-05-never-has-money/storyboards/04-your-birthday/.
//
//   coupon     the hero prop: the hand-drawn FREE HUG coupon, a sheet torn from a notebook (0.30 x 0.24, 2 mm), cream
//              paper, one ragged (torn) top edge. Origin: the middle of the sheet (the iounote frame, so grips.phone
//              holds it: it needs a SIZE row { w: 0.30, h: 0.24, t: 0.002 } there). The drawing is on the FRONT (+z): a
//              wobbly red-brown marker border, tiny hearts, "FREE" over "HUG" in chunky lettering, two potatoes
//              hugging. The BACK (-z) is plain paper with the ink faintly showing through. spec.flip: true swaps them
//              (the drawing on -z, the way grips.phone turns a held picture away from the holder: rot = yaw + 180).
//                ink 0..1    writes it, stroke by stroke: the border, F R E E, H U G, the hearts, the two potatoes, the
//                            arms and the rays (12 strokes, drawn once per level the first time it is shown)
//                fold 0..1   1 = folded into the little 0.075 x 0.06 x 0.008 square it comes out of his bandana as; 0 flat.
//                            Not a real fold: the sheet shrinks and crimps, then swaps for the folded square at 0.5.
//              (ink and fold are tweened by propState only from the second c.prop that names them: set them once at
//              their first time with dur 0, or the first c.prop jumps.)
//   partyhat   a paper cone, spec { r: 0.075 base radius, h: 0.2, color, accent, pattern: "stripes" | "dots", pom }, a
//              fluffy pompom r 0.022 on the tip and a thin rim at the foot. Origin: the middle of the base, the tip up.
//              Worn with spec.wear (stage.js): the numbers are in the header of this file's bench report.
//   rosette    a gold ribbon rosette (r 0.055: pleated ring, a button, two short tails), front +z, origin its middle;
//              worn on a chest with spec.wear.
//   bowgift    props3d.js gift (spec w, h, color, ribbon, hinge; `lid` 0..1 lifts the lid off) with a GIANT bow: two big
//              loops (0.45 x w across) and two smaller ones above, two tails over the lid's front, and a round medallion
//              with a smile in the knot (spec.medal; default on from w 0.3). Slightly glossy paper. Solid.
//   bunting    a string of triangular paper flags across the room, spec { w: 3.4, sag: 0.22, count: 15, colors, faces }.
//              Origin: the middle of the string, its lowest point; its ends hang at +-w/2, sag higher. A slow sway
//              from the clock. Not solid.
export const BIRTHDAY = { coupon: { w: 0.30, h: 0.24, t: 0.002 }, folded: { w: 0.075, h: 0.06, t: 0.008 }, hat: { r: 0.075, h: 0.2, pom: 0.022 }, rosette: 0.055 };

const PAPER = "#f6ead2", BROWN = "#4a2a18", BORDER = "#b4493d", HEART = "#d9535f";
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k);
const solid = (root, v) => root.traverse((o) => { if (o.isMesh) o.userData.solid = v; });

// ---------------------------------------------------------------------------------------------- the coupon's drawing
const CW = 640, CH = 512;   // 2133 px per metre: the letters are 128 px = 0.06 m tall, FREE 512 px = 80 % of the width

// a smooth line through points (Catmull-Rom), as a polyline of `n` steps a segment
function smoothPts(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a polyline drawn up to the fraction k of its length (a pen going along it)
function pen(g, pts, k) {
  if (k <= 0 || pts.length < 2) return;
  const len = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); len.push(d); total += d; }
  let left = total * Math.min(1, k);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    if (left >= len[i - 1]) { g.lineTo(pts[i][0], pts[i][1]); left -= len[i - 1]; }
    else { const f = left / len[i - 1]; g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); left = 0; }
  }
  g.stroke();
}
// the letters, in a unit box (y down): [smooth?, points], each stroke in the order a hand writes it
const GLYPH = {
  F: [[0, [[0.2, 1], [0.2, 0.02], [0.9, 0.02]]], [0, [[0.2, 0.5], [0.74, 0.5]]]],
  R: [[0, [[0.2, 1], [0.2, 0.02]]], [1, [[0.2, 0.02], [0.62, 0.02], [0.84, 0.12], [0.88, 0.28], [0.74, 0.46], [0.5, 0.52], [0.2, 0.52]]], [0, [[0.5, 0.52], [0.88, 1]]]],
  E: [[0, [[0.9, 0.02], [0.2, 0.02], [0.2, 1], [0.9, 1]]], [0, [[0.2, 0.5], [0.72, 0.5]]]],
  H: [[0, [[0.2, 0.02], [0.2, 1]]], [0, [[0.84, 0.02], [0.84, 1]]], [0, [[0.2, 0.5], [0.84, 0.5]]]],
  U: [[1, [[0.2, 0.02], [0.2, 0.7], [0.34, 0.96], [0.52, 1], [0.7, 0.96], [0.84, 0.7], [0.84, 0.02]]]],
  G: [[1, [[0.88, 0.18], [0.7, 0.03], [0.46, 0.0], [0.24, 0.12], [0.14, 0.45], [0.22, 0.82], [0.46, 1], [0.72, 0.97], [0.88, 0.8], [0.88, 0.54], [0.56, 0.54]]]],
};
// a heart outline by its parameter, progressive
function heart(g, cx, cy, s, k) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([cx + s * 16 * Math.sin(t) ** 3, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
  pen(g, pts, k);
}
// a lumpy round potato outline, a closed loop (starts top, goes clockwise)
function blob(cx, cy, rx, ry, r, lump = 0.05) {
  const pts = [], ph = r() * 6;
  for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2 - Math.PI / 2, w = 1 + lump * Math.sin(a * 3 + ph) + (i === 28 ? 0 : (r() - 0.5) * 0.02); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
  pts[28] = pts[0];
  return pts;
}

// The whole coupon at ink level k (0..1): paper, creases, then the strokes. strong false draws only a faint ghost of
// the ink, the way it shows through the back of the sheet; mirror flips the canvas (the sheet's other face).
function drawCoupon(g, ink, { strong = true, mirror = false, seed = 5 } = {}) {
  const w = CW, h = CH, r = rng(seed);
  g.save();
  if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
  // paper: cream, a soft age at the edges, fibres, and the creases of the two folds it was stuffed in his bandana with
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  const vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); vg.addColorStop(0, "rgba(255,248,225,0)"); vg.addColorStop(1, "rgba(190,150,80,0.20)");
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(150,110,50,${0.03 + r() * 0.05})`; const x = r() * w, y = r() * h, l = 4 + r() * 12, a = r() * Math.PI; g.fillRect(x, y, Math.cos(a) * l + 1, Math.sin(a) * l + 1); }
  for (const [cx, hz] of [[0.5, true], [0.25, true], [0.75, true], [0.5, false], [0.25, false], [0.75, false]]) {
    const q = hz ? w * cx : h * cx;
    g.fillStyle = "rgba(120,85,40,0.07)"; if (hz) g.fillRect(q - 1.5, 0, 3, h); else g.fillRect(0, q - 1.5, w, 3);
    g.fillStyle = "rgba(255,255,245,0.35)"; if (hz) g.fillRect(q + 1.5, 0, 2, h); else g.fillRect(0, q + 1.5, w, 2);
  }
  g.fillStyle = "rgba(255,250,235,0.55)"; g.fillRect(0, 0, w, 9);   // the torn edge's pale fibres, along the top
  g.globalAlpha = strong ? 1 : 0.11;
  g.lineCap = "round"; g.lineJoin = "round";
  const J = (x, y, a = 3) => [x + (r() - 0.5) * a, y + (r() - 0.5) * a];   // a hand-wobbled point
  // the letters' boxes: FREE fills 80 % of the width, HUG centred under it; a letter is 128 wide, 128 tall
  const row = (txt, y0) => [...txt].map((c, i) => [c, (w - txt.length * 128) / 2 + i * 128, y0]);
  const letters = [...row("FREE", 52), ...row("HUG", 186)];
  const strokes = [];
  // 0 the border: a wobbly zigzag marker line all round
  {
    const m = 30, pts = [], zig = (x0, y0, x1, y1, nx, ny) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 15); for (let i = 0; i < n; i++) { const t = i / n, d = (i % 2 ? 4.2 : -4.2) + (r() - 0.5) * 2.4; pts.push([x0 + (x1 - x0) * t + nx * d + (r() - 0.5) * 1.5, y0 + (y1 - y0) * t + ny * d + (r() - 0.5) * 1.5]); } };
    zig(m, m, w - m, m + 3, 0, 1); zig(w - m, m + 3, w - m - 4, h - m, 1, 0); zig(w - m - 4, h - m, m + 2, h - m - 3, 0, 1); zig(m + 2, h - m - 3, m, m, 1, 0); pts.push(pts[0]);
    strokes.push((k) => { g.strokeStyle = BORDER; g.lineWidth = 6.5; pen(g, pts, k); });
  }
  // 1-7 the letters: each stroke of each glyph is its own wobbly line; one letter is one step of the ink
  const LH = 108, letterSteps = letters.map(([c, x0, y0]) => {
    const parts = GLYPH[c].map(([sm, pts]) => { const p = pts.map(([x, y]) => J(x0 + 64 + (x - 0.55) * 120, y0 + y * LH, 4)); return sm ? smoothPts(p, 7) : p; });
    return (k) => {
      g.strokeStyle = BROWN; g.lineWidth = 24;
      const tot = parts.reduce((s, p) => s + p.length, 0); let done = k * tot;
      for (const p of parts) { if (done <= 0) break; pen(g, p, Math.min(1, done / (p.length - 1))); done -= p.length - 1; }
    };
  });
  strokes.push(...letterSteps);
  // 8 two tiny hearts beside HUG
  strokes.push((k) => { g.strokeStyle = HEART; g.lineWidth = 6; heart(g, 84, 240, 1.5, Math.min(1, k * 2)); heart(g, w - 84, 240, 1.5, Math.max(0, k * 2 - 1)); });
  // 9, 10 the two potatoes: a lumpy outline filled cream-tan, a freckled skin, two leaf sprouts, closed happy eyes, a smile
  const potatoes = [[256, 398, -1], [384, 398, 1]].map(([cx, cy, s]) => {
    const body = blob(cx, cy, 64, 56, r), freck = Array.from({ length: 9 }, () => [cx + (r() - 0.5) * 70, cy + (r() - 0.3) * 56]);
    return (k) => {
      if (k > 0.3) { g.save(); g.beginPath(); body.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = "#f2d9a6"; g.globalAlpha *= Math.min(1, (k - 0.3) / 0.3); g.fill(); g.restore(); }
      g.strokeStyle = "#6b4426"; g.lineWidth = 6; pen(g, body, Math.min(1, k / 0.5));
      if (k > 0.55) {
        g.fillStyle = "rgba(107,68,38,0.7)"; for (const [x, y] of freck) { g.beginPath(); g.arc(x, y, 2.3, 0, 7); g.fill(); }
        g.fillStyle = "rgba(230,110,110,0.55)"; for (const dx of [-30, 30]) { g.beginPath(); g.ellipse(cx + dx * 0.9, cy + 8, 9, 6, 0, 0, 7); g.fill(); }
        g.strokeStyle = "#5a3416"; g.lineWidth = 4.5;
        for (const dx of [-17, 17]) { g.beginPath(); g.arc(cx + dx, cy - 4, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }   // happy closed eyes
        g.beginPath(); g.arc(cx, cy + 6, 11, Math.PI * 0.15, Math.PI * 0.85); g.stroke();   // the smile
      }
      if (k > 0.8) for (const [dx, a] of [[-4, -0.6], [8, 0.5]]) {   // two leaf sprouts, green
        g.save(); g.translate(cx + dx + s * 4, cy - 54); g.rotate(a + s * 0.15); g.fillStyle = "#67b43e"; g.strokeStyle = "#3d6b22"; g.lineWidth = 4.5;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-16, -14, 0, -32); g.quadraticCurveTo(18, -14, 0, 0); g.fill(); g.stroke(); g.restore();
      }
    };
  });
  strokes.push(potatoes[0], potatoes[1]);
  // 11 the hug: an arm round each back, crossing over in front, the little rays and two small hearts above
  strokes.push((k) => {
    g.strokeStyle = "#6b4426"; g.lineWidth = 6;
    if (k > 0) { g.fillStyle = "#f2d9a6"; g.beginPath(); g.roundRect(274, 408, 112, 24, 12); g.fill(); pen(g, smoothPts([[286, 408], [330, 403], [374, 408]], 4), Math.min(1, k * 2)); pen(g, smoothPts([[286, 432], [330, 436], [374, 432]], 4), Math.min(1, k * 2)); }
    g.strokeStyle = "#5a3416"; g.lineWidth = 5;
    if (k > 0.3) for (const s of [-1, 1]) for (const [dx, dy, ex, ey] of [[140, 360, 164, 346], [148, 398, 176, 398], [140, 436, 164, 450]]) pen(g, [[w / 2 + s * dx, dy], [w / 2 + s * ex, ey]], Math.min(1, (k - 0.3) * 3));
    g.strokeStyle = HEART; g.lineWidth = 4.5;
    if (k > 0.6) { heart(g, 316, 344, 0.85, Math.min(1, (k - 0.6) * 5)); heart(g, 346, 330, 0.6, Math.min(1, (k - 0.7) * 5)); }
  });
  const n = strokes.length, done = clamp(ink) * n;
  for (let i = 0; i < n; i++) if (done > i) strokes[i](Math.min(1, done - i));
  g.restore();
}

// the folded square: crease cross, the paper's layers, a hint of the border and the ink on the faces
function drawFolded(g, w, h) {
  g.fillStyle = "#efe0c0"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(140,100,50,0.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  g.strokeStyle = BORDER; g.lineWidth = 3; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(w * 0.5, 4); g.lineTo(w - 4, 4); g.lineTo(w - 4, h * 0.5); g.stroke(); g.setLineDash([]);
  g.fillStyle = BROWN; for (const [x, y, rr] of [[w * 0.2, h * 0.7, 6], [w * 0.3, h * 0.8, 4], [w * 0.65, h * 0.72, 5]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
}
const edgeTex = () => canvasTex(64, 16, (g, w, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#e8d6b0" : "#f6ead2"; g.fillRect(0, (i * h) / 4, w, h / 4); g.fillStyle = "rgba(120,85,40,0.35)"; g.fillRect(0, (i * h) / 4, w, 1); } });

// a sheet W x H with its top edge torn (a ragged line, 0 to 9 mm deep), a gentle curl toward -z at the bottom
function tornSheet(W, H, seed) {
  const SX = 56, SY = 8, g = new THREE.PlaneGeometry(W, H, SX, SY), p = g.attributes.position, uv = g.attributes.uv, r = rng(seed), jag = [];
  for (let i = 0; i <= SX; i++) jag.push(0.002 + 0.005 * r() + 0.0045 * Math.abs(Math.sin(i * 0.55 + seed)) + (i % 9 === 4 ? 0.002 * r() : 0));
  for (let iy = 0; iy <= SY; iy++) for (let ix = 0; ix <= SX; ix++) {
    const i = iy * (SX + 1) + ix, top = H / 2 - jag[ix], y = top - (top + H / 2) * (iy / SY), v = (y + H / 2) / H;
    p.setY(i, y); uv.setY(i, v); p.setZ(i, -0.004 * (1 - v) * (1 - v));
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------- party hats
// A cone from flat card: the pattern is drawn on the unrolled sector, parallel stripes or a staggered dot grid, so on the
// cone the stripes curve like a real hat's and the dots keep their roundness up to the tip; the seam is at the back.
function coneGeo(R, H, seg = 48) {
  const L = Math.hypot(R, H), Th = (2 * Math.PI * R) / L, pos = [], uv = [], idx = [];
  const put = (th, t) => {   // th 0..1 round, t 0 at the foot .. 1 at the tip
    const d = (1 - t) * L, ph = th * Th - Th / 2;
    pos.push(Math.sin(th * Math.PI * 2 + Math.PI) * R * (1 - t), t * H, Math.cos(th * Math.PI * 2 + Math.PI) * R * (1 - t));
    uv.push(0.5 + (Math.cos(ph) * d) / (2 * L) * 1.0, 0.5 + (Math.sin(ph) * d) / (2 * L));
  };
  const rings = 6;
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= seg; i++) put(i / seg, j / rings);
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, L, Th };
}
function hatTex(R, H, color, accent, pattern, L) {
  return canvasTex(768, 768, (g, w, h) => {
    const px = (w / 2) / L;   // pixels per metre on the sector (the apex at the middle, the foot 0.5 away)
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    if (pattern === "stripes") {
      // diagonal bands across the unrolled card, 3.1 cm wide, every 6.2 cm
      g.rotate(-0.62); g.fillStyle = accent;
      for (let x = -1.2 * L; x < 1.2 * L; x += 0.062) g.fillRect(x * px, -L * px * 1.4, 0.031 * px, 2.8 * L * px);
    } else {
      g.fillStyle = accent;
      for (let j = -12; j < 12; j++) for (let i = -12; i < 12; i++) { const x = (i + (j % 2 ? 0.5 : 0)) * 0.034, y = j * 0.03; g.beginPath(); g.arc(x * px, y * px, 0.0085 * px, 0, 7); g.fill(); }
    }
  });
}
const fuzz = (rad, seed) => {
  const g = new THREE.IcosahedronGeometry(rad, 2), p = g.attributes.position, q = rng(seed);
  for (let i = 0; i < p.count; i++) { const k = 1 + (q() - 0.5) * 0.28; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  g.computeVertexNormals();
  return g;
};

// ---------------------------------------------------------------------------------------------- the big bow
// a loop of ribbon seen from the front: a pointed petal with a hole, from the knot at the origin out along +x
function petalGeo(L, hw, ringK, depth) {
  const path = (s, sy, cx) => (sh) => {
    const X = (x) => cx + (x - L * 0.5) * s, Y = (y) => y * sy;
    sh.moveTo(X(0), 0);
    sh.bezierCurveTo(X(0.1 * L), Y(0.9 * hw), X(0.55 * L), Y(1.25 * hw), X(0.82 * L), Y(0.9 * hw));
    sh.bezierCurveTo(X(1.04 * L), Y(0.55 * hw), X(1.04 * L), Y(-0.55 * hw), X(0.82 * L), Y(-0.9 * hw));
    sh.bezierCurveTo(X(0.55 * L), Y(-1.25 * hw), X(0.1 * L), Y(-0.9 * hw), X(0), 0);
  };
  const s = new THREE.Shape(); path(1, 1, L * 0.5)(s);
  const hole = new THREE.Path(); path(0.56, 1 - ringK, L * 0.56)(hole); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.45, bevelSize: depth * 0.4, bevelSegments: 2, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}
// a tail: a flat ribbon with a swallow-tail end, `len` long, `wd` wide, hanging down -y from the origin
function tailGeo(len, wd, depth) {
  const s = new THREE.Shape(); s.moveTo(-wd / 2, 0); s.lineTo(wd / 2, 0); s.lineTo(wd / 2, -len); s.lineTo(0, -len + wd * 0.55); s.lineTo(-wd / 2, -len); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: depth * 0.4, bevelSegments: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}
const smileTex = (gold, ink) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = gold; g.fillRect(0, 0, w, h);
  g.strokeStyle = shade(gold, 0.62).getStyle(); g.lineWidth = 7; g.beginPath(); g.arc(w / 2, h / 2, 54, 0, 7); g.stroke();   // the medallion's rim
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = "round";
  for (const dx of [-18, 18]) { g.beginPath(); g.ellipse(w / 2 + dx, h * 0.42, 5, 7.5, 0, 0, 7); g.fill(); }
  g.lineWidth = 7; g.beginPath(); g.arc(w / 2, h * 0.5, 26, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
});

// ---------------------------------------------------------------------------------------------- bunting
const flagTex = (color, face) => canvasTex(128, 160, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(0, 0, w, 14);   // the folded hem over the string
  g.fillStyle = "rgba(0,0,0,0.10)"; g.fillRect(0, 14, w, 3);
  if (face) {
    g.fillStyle = "#6b4a1c"; g.strokeStyle = "#6b4a1c"; g.lineCap = "round";
    for (const dx of [-17, 17]) { g.beginPath(); g.ellipse(w / 2 + dx, 56, 6, 8.5, 0, 0, 7); g.fill(); }
    g.lineWidth = 7; g.beginPath(); g.arc(w / 2, 62, 26, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
    g.fillStyle = "rgba(235,110,110,0.55)"; for (const dx of [-36, 36]) { g.beginPath(); g.ellipse(w / 2 + dx, 74, 9, 6, 0, 0, 7); g.fill(); }
  }
});

export const BIRTHDAY_KINDS = {
  coupon(P) {
    const S = P.spec, { w: W, h: H } = BIRTHDAY.coupon, FW = BIRTHDAY.folded.w, FH = BIRTHDAY.folded.h, FT = BIRTHDAY.folded.t;
    const steps = 36, flip = !!S.flip, cache = new Map();
    // one texture per (level, side), drawn the first time it is shown; the drawing depends on nothing but its inputs
    const tex = (k, strong, mirror) => {
      const key = `${k}|${strong ? 1 : 0}|${mirror ? 1 : 0}`;
      if (!cache.has(key)) cache.set(key, canvasTex(CW, CH, (g) => drawCoupon(g, k / steps, { strong, mirror, seed: S.seed ?? 5 })));
      return cache.get(key);
    };
    const mA = mat("#ffffff", { map: tex(steps, !flip, flip), roughness: 0.9, side: THREE.FrontSide }), mB = mat("#ffffff", { map: tex(steps, flip, flip), roughness: 0.9, side: THREE.BackSide });
    mA.userData.noHatch = mB.userData.noHatch = true; mA.userData.lineColor = mB.userData.lineColor = "#7a5a38";
    const flat = new THREE.Group(); P.whole.add(flat);
    const geo = tornSheet(W, H, S.tear ?? 3);
    const A = mesh(geo, mA, flat, 0, 0, 0.0008), B = mesh(geo, mB, flat, 0, 0, -0.0008); A.castShadow = B.castShadow = false;
    // the folded square, centred (two folds each way: 4 layers)
    const block = new THREE.Group(); P.whole.add(block); block.visible = false;
    const faceM = mat("#ffffff", { map: canvasTex(150, 120, drawFolded), roughness: 0.9 }), edgeM = mat("#ffffff", { map: edgeTex(), roughness: 0.9 });
    faceM.userData.noHatch = edgeM.userData.noHatch = true; faceM.userData.lineColor = edgeM.userData.lineColor = "#7a5a38";
    mesh(new THREE.BoxGeometry(FW, FH, FT), [edgeM, edgeM, edgeM, edgeM, faceM, faceM], block);
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const k = Math.round(clamp(ps.ink ?? S.ink ?? 1) * steps), f = clamp(ps.fold ?? S.fold ?? 0);
        if (k !== last) { mA.map = tex(k, !flip, flip); mB.map = tex(k, flip, flip); mA.needsUpdate = mB.needsUpdate = true; last = k; }
        const a = clamp(f * 2), b = clamp(f * 2 - 1);
        flat.visible = f < 0.5; block.visible = f >= 0.5;
        // folding: the sheet crimps (a bend about its middle) and shrinks toward the square, then swaps for it
        const sc = 1 - 0.48 * smooth(a), crimp = Math.sin(Math.PI * a);
        flat.scale.set(sc * (1 - 0.1 * crimp), sc * (1 + 0.04 * crimp), 1); flat.rotation.set(0.35 * crimp, 0, 0.12 * crimp);
        const bs = 2 - smooth(b), pop = Math.sin(Math.PI * b) * 0.12;
        block.scale.set(bs * (1 + pop), bs * (1 - pop), bs); block.rotation.set(0, 0, 0.08 * (1 - b));
      },
    };
  },

  partyhat(P) {
    const S = P.spec, R = S.r ?? BIRTHDAY.hat.r, H = S.h ?? BIRTHDAY.hat.h, color = S.color ?? "#d8392b", accent = S.accent ?? "#f2c14e", pomC = S.pom ?? accent;
    const { geo, L } = coneGeo(R, H);
    const m = mat("#ffffff", { map: hatTex(R, H, color, accent, S.pattern ?? "stripes", L), roughness: 0.62, side: THREE.DoubleSide }); m.userData.noHatch = true; m.userData.lineColor = shade(color, 0.45).getStyle();
    mesh(geo, m, P.whole);
    // the foot: a thin rolled rim (dark, so the outline pass has an edge to draw), and the pompom on the tip
    const rimM = mat(shade(color, 0.62).getStyle(), { roughness: 0.6 });
    const rim = mesh(new THREE.TorusGeometry(R, 0.0035, 6, 48), rimM, P.whole, 0, 0.001, 0); rim.rotation.x = Math.PI / 2;
    const pom = mesh(fuzz(S.pomR ?? BIRTHDAY.hat.pom, 7), mat(pomC, { roughness: 0.95 }), P.whole, 0, H + (S.pomR ?? BIRTHDAY.hat.pom) * 0.6, 0);
    pom.scale.set(1, 0.95, 1);
    solid(P.whole, false);
    return { grip: 0 };
  },

  rosette(P) {
    const S = P.spec, R = S.r ?? BIRTHDAY.rosette, gold = S.color ?? "#e7b43a";
    const gm = mat(gold, { roughness: 0.4, metalness: 0.2, flatShading: true, side: THREE.DoubleSide }), dark = mat(shade(gold, 0.7).getStyle(), { roughness: 0.45, metalness: 0.2 });
    // the pleated ring: 16 folds round, two rings of rim, the folds' height alternating, a little dome
    const N = 16, SEG = N * 2, rings = [0.3, 0.62, 1], pos = [], idx = [];
    for (let j = 0; j < rings.length; j++) for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2, rr = R * rings[j] * (i % 2 ? 0.94 : 1);
      pos.push(Math.cos(a) * rr, Math.sin(a) * rr, 0.004 + 0.006 * (1 - rings[j]) + (i % 2 ? 0.004 : -0.002) * rings[j]);
    }
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < SEG; i++) { const a = j * SEG + i, b = j * SEG + ((i + 1) % SEG), c = (j + 1) * SEG + i, d = (j + 1) * SEG + ((i + 1) % SEG); idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    mesh(g, gm, P.whole);
    const back = mesh(new THREE.CircleGeometry(R * 0.98, 32), dark, P.whole, 0, 0, 0.0005); back.rotation.y = Math.PI;
    // the button: a domed disc with a rim
    const btn = mesh(new THREE.SphereGeometry(R * 0.36, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(shade(gold, 1.08).getStyle(), { roughness: 0.3, metalness: 0.3 }), P.whole, 0, 0, 0.007); btn.rotation.x = Math.PI / 2; btn.scale.set(1, 0.5, 1);
    const ring = mesh(new THREE.TorusGeometry(R * 0.36, 0.0028, 6, 28), dark, P.whole, 0, 0, 0.0075);
    // two short tails hanging from behind, a swallow-tail notch each, splayed
    for (const [s, ang] of [[-1, 0.2], [1, -0.2]]) {
      const t = mesh(tailGeo(R * 1.35, R * 0.46, 0.003), mat(s < 0 ? shade(gold, 0.92).getStyle() : gold, { roughness: 0.45, metalness: 0.15 }), P.whole, s * R * 0.22, -R * 0.4, -0.004);
      t.rotation.z = ang; t.castShadow = true;
    }
    solid(P.whole, false);
    return { grip: 0 };
  },

  bowgift(P) {
    const S = P.spec, w = S.w ?? 0.24, hgt = S.h ?? 0.18, T = 0.008, rw = clamp(w * 0.125, 0.022, 0.07);
    const paper = mat(S.color || "#7d3fb8", { roughness: 0.26, metalness: 0.08 }), rc = S.ribbon || "#e7b43a";
    const band = mat(rc, { roughness: 0.3, metalness: 0.25 }), bandDk = mat(shade(rc, 0.84).getStyle(), { roughness: 0.32, metalness: 0.25 });
    const inside = mat("#f2e6cf", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(w, T, w), paper, P.whole, 0, T / 2, 0);
    for (const [x, z, bw, bd] of [[0, w / 2 - T / 2, w, T], [0, -w / 2 + T / 2, w, T], [w / 2 - T / 2, 0, T, w], [-w / 2 + T / 2, 0, T, w]]) {
      mesh(new THREE.BoxGeometry(bw, hgt, bd), paper, P.whole, x, hgt / 2, z);
      mesh(new THREE.BoxGeometry(bw > T ? rw : T + 0.003, hgt, bd > T ? rw : T + 0.003), band, P.whole, x, hgt / 2, z);
      mesh(new THREE.BoxGeometry(bw > T ? bw - 2 * T : 0.002, hgt - T, bd > T ? bd - 2 * T : 0.002), inside, P.whole, x - Math.sign(x) * (T / 2 + 0.001), hgt / 2 + T / 2, z - Math.sign(z) * (T / 2 + 0.001)).castShadow = false;
    }
    const LW = w + 0.02, LH = 0.05, hinge = !!S.hinge;
    const lid = new THREE.Group(), top = new THREE.Group(); P.whole.add(lid); lid.add(top);
    if (hinge) { lid.position.set(0, hgt - LH * 0.4, -LW / 2); top.position.z = LW / 2; }
    mesh(new THREE.BoxGeometry(LW, LH, LW), paper, top, 0, LH / 2, 0);
    mesh(new THREE.BoxGeometry(rw, LH + 0.003, LW + 0.003), band, top, 0, LH / 2, 0);
    mesh(new THREE.BoxGeometry(LW + 0.003, LH + 0.003, rw), band, top, 0, LH / 2, 0);
    // THE BOW: loops about 0.45 x w across, a medallion in the knot, two tails over the front of the lid
    const B = w * 0.5, ky = LH + B * 0.14, bow = new THREE.Group(); bow.position.set(0, ky, 0); top.add(bow);
    const Lm = (B / 2) / Math.cos(0.45), hw = Lm * 0.46, dep = Math.max(0.012, B * 0.09);
    const loop = (L, ang, lean, z, hwk, m) => {
      const o = mesh(petalGeo(L, hw * hwk, 0.5, dep), m, bow); o.rotation.set(lean, 0, ang); o.position.z = z; return o;
    };
    for (const s of [-1, 1]) {
      const big = loop(Lm, s > 0 ? 0.45 : Math.PI - 0.45, -0.28, -B * 0.02, 1, band);   // the two big loops, leaning back
      if (s < 0) big.scale.y = -1;
      const hi = loop(Lm * 0.8, s > 0 ? 1.0 : Math.PI - 1.0, -0.22, -B * 0.1, 0.9, bandDk);   // the smaller ones above, a shade darker
      if (s < 0) hi.scale.y = -1;
    }
    const knot = mesh(new THREE.SphereGeometry(B * 0.15, 16, 10), band, bow, 0, -B * 0.01, B * 0.02); knot.scale.set(1.1, 0.85, 0.8);
    const medal = S.medal ?? w >= 0.3, mr = B * 0.17;
    if (medal) {
      const disc = mesh(new THREE.CylinderGeometry(mr, mr, B * 0.05, 28), mat("#f0c445", { roughness: 0.25, metalness: 0.35 }), bow, 0, -B * 0.01, B * 0.17); disc.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(mr * 0.96, 28), (() => { const fm = mat("#ffffff", { map: smileTex("#f0c445", "#7a4a12"), roughness: 0.3, metalness: 0.2 }); fm.userData.noHatch = true; fm.userData.lineColor = "#7a4a12"; return fm; })());
      face.position.set(0, -B * 0.01, B * 0.17 + B * 0.032); face.castShadow = false; bow.add(face);
    } else mesh(new THREE.SphereGeometry(B * 0.1, 14, 8), bandDk, bow, 0, -B * 0.01, B * 0.07);
    const tw = rw * 0.86, hang = Math.max(0.05, hgt * 0.4);   // tails: from the knot to the lid front edge, then down
    for (const s of [-1, 1]) {
      const fan = 0.3, run = LW / 2 - 0.004, len = run / Math.cos(fan);
      const on = mesh(new THREE.BoxGeometry(tw, 0.004, len), bandDk, top, s * Math.sin(fan) * len * 0.5, LH + 0.0035, Math.cos(fan) * len * 0.5);
      on.rotation.y = s * fan;
      const down = mesh(tailGeo(hang, tw, 0.004), bandDk, top, s * Math.tan(fan) * run, LH + 0.002, run + 0.004);
      down.rotation.set(0.07, 0, s * 0.12);
    }
    solid(P.whole, true);
    return {
      grip: hgt * 0.5,
      apply(ps) {
        const l = clamp(ps.lid);
        if (hinge) { lid.rotation.x = -1.95 * l; return; }
        lid.position.set((w / 2 + LW / 2 + 0.03) * l, (hgt - LH * 0.4) * (1 - l) + 0.2 * Math.sin(l * Math.PI), 0.02 * l);
        lid.rotation.set(0, 0.3 * l, -0.5 * Math.sin(l * Math.PI));
      },
    };
  },

  bunting(P) {
    const S = P.spec, W = S.w ?? 3.4, SAG = S.sag ?? 0.22, N = S.count ?? 15, cols = S.colors ?? ["#8a4fc4", "#f2c14e", "#e97a9a"], faces = S.faces ?? true;
    const yAt = (x) => SAG * ((2 * x) / W) ** 2, slope = (x) => (8 * SAG * x) / (W * W);
    const root = new THREE.Group(); P.whole.add(root);
    // the string: a thin dark cord along the sag
    const pts = []; for (let i = 0; i <= 40; i++) { const x = -W / 2 + (W * i) / 40; pts.push(new THREE.Vector3(x, yAt(x), 0)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0045, 5, false), mat("#6b5133", { roughness: 0.9 }), root);
    const fw = (W / N) * 0.84, fh = fw * 1.18, flags = [], tex = new Map();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-fw / 2, 0, 0, fw / 2, 0, 0, 0, -fh, 0], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0], 2));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); geo.setIndex([0, 2, 1]);
    for (let i = 0; i < N; i++) {
      const ci = i % cols.length, c = cols[ci], face = faces && ci === 1;
      const key = c + (face ? "f" : "");
      if (!tex.has(key)) { const m = mat("#ffffff", { map: flagTex(c, face), roughness: 0.8, side: THREE.DoubleSide }); m.userData.noHatch = true; m.userData.lineColor = shade(c, 0.5).getStyle(); tex.set(key, m); }
      const x = -W / 2 + (i + 0.5) * (W / N), pivot = new THREE.Group(); pivot.position.set(x, yAt(x), 0.004); root.add(pivot);
      const fl = new THREE.Mesh(geo, tex.get(key)); fl.castShadow = true; pivot.add(fl);
      flags.push({ pivot, ph: i * 0.83 + (i % 3) * 0.4, base: Math.atan(slope(x)) * 0.5 });
    }
    solid(P.whole, false);
    return {
      grip: 0,
      apply(ps, t = 0) {
        // a slow sway, a pure function of the clock: each flag swings about its hem and billows a little
        for (const f of flags) {
          f.pivot.rotation.set(0.06 * Math.sin(t * 0.9 + f.ph * 1.3), 0, f.base + 0.045 * Math.sin(t * 1.1 + f.ph));
        }
        root.rotation.y = 0.012 * Math.sin(t * 0.35);
      },
    };
  },
};
