import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

// Props for Never Has Money 04 "your birthday" (8 Nov 2026). BOARD §2.1:
// storyboards/series/never-has-money/04-your-birthday/BOARD.md. Built by task T1; bench: storyboards/lookdev/make-birthday-bench.mjs.
//   coupon    Gunslinger's hand-made FREE HUG coupon: a cream sheet 0.36 (x) x 0.26 (y), origin at its centre, one torn
//             (deckled) left edge, a wobbly red marker border, "FREE" over "HUG" in thick dark-brown marker (letters 0.07
//             tall), two small red hearts either side of HUG, and under it a doodle of two potatoes hugging. Printed on
//             its BACK (-z), like props-coffee.js iounote, and mirrored onto the front (+z) so the phone hold shows it
//             to whoever it is held out to. `ink` 0..1 draws it in order border, FREE, HUG, hearts, doodle (12 steps);
//             spec.seed varies the hand. No hatching on the paper (noHatch): the lettering must stay clean at phone size.
//   partyhat  a glossy card cone (base r 0.065, 0.19 tall, origin at the middle of its base, tip up) with a yellow
//             fuzzy pompom (r 0.03). Worn: spec.wear = a cast id, x/y/z in the wearer's body frame, `tilt` degrees about
//             z (+ leans the tip toward +x, the props3d root), `pitch` degrees about x (+ leans the tip toward +z, the
//             front). spec.pattern "stripes" (#e2423b / #f4c430 spiral, pompom #f6d24a) or "dots" (#3f6fd8 with #f4d23c
//             dots 0.012 across, pompom #f6d24a).
//   rosette   a birthday rosette: a pleated gold ring (r 0.055, #e9b93c with #c99520 pleats), a centre disc (r 0.03,
//             #f6d36b) and two ribbon tails 0.09 long, cut in a V. Worn (spec.wear); origin at the disc's centre,
//             facing +z (out of the chest), its back on the plane z = 0. spec.color the ring (#e9b93c).
export const BIRTHDAY = { coupon: { w: 0.36, h: 0.26 }, hat: { r: 0.065, h: 0.19, pom: 0.03 }, rosette: { r: 0.055, disc: 0.03, tail: 0.09 } };

// deterministic hand noise: the same numbers every frame, any order
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const wob = (i, seed) => hash(i * 1.37 + seed * 17.3) - 0.5;
const smooth = (k) => k * k * (3 - 2 * k);

// ---------------------------------------------------------------- the coupon
const CW = 768, CH = 554, STEPS = 12;                 // 768 px across 0.36 m (2133 px/m)
const PXM = CW / BIRTHDAY.coupon.w;                    // px per metre
const INK_BROWN = "#4a2a17", RED = "#d8433a", HEART = "#e0485a", PAPER = "#fbf3dc";

// block capitals as marker strokes: points in a unit cell (x 0..1 across, y 0..1 up from the baseline); each letter is
// a list of strokes, drawn one after the other
const GLYPH = {
  F: [[[0.12, 0], [0.1, 0.5], [0.12, 1]], [[0.1, 1], [0.55, 1.02], [0.95, 0.98]], [[0.1, 0.55], [0.45, 0.56], [0.78, 0.54]]],
  R: [[[0.12, 0], [0.1, 0.5], [0.12, 1]], [[0.1, 1], [0.6, 1.02], [0.92, 0.88], [0.9, 0.7], [0.6, 0.55], [0.12, 0.52]], [[0.5, 0.54], [0.72, 0.28], [0.94, 0]]],
  E: [[[0.12, 0], [0.1, 0.5], [0.12, 1]], [[0.1, 1], [0.55, 1.02], [0.95, 0.98]], [[0.1, 0.52], [0.45, 0.53], [0.8, 0.5]], [[0.12, 0], [0.55, 0.02], [0.95, -0.01]]],
  H: [[[0.1, 0], [0.08, 0.5], [0.1, 1]], [[0.92, 1], [0.94, 0.5], [0.92, 0]], [[0.08, 0.52], [0.5, 0.5], [0.94, 0.52]]],
  U: [[[0.1, 1], [0.1, 0.4], [0.2, 0.08], [0.5, -0.02], [0.8, 0.08], [0.9, 0.4], [0.9, 1]]],
  G: [[[0.92, 0.82], [0.7, 1.0], [0.45, 1.02], [0.2, 0.86], [0.1, 0.5], [0.2, 0.14], [0.45, -0.02], [0.75, 0.04], [0.92, 0.25], [0.9, 0.46], [0.55, 0.47]]],
};
const GW = { F: 0.8, R: 0.9, E: 0.8, H: 0.95, U: 0.95, G: 1 };   // advance (cell widths)

// a polyline's points, resampled finely (Catmull-Rom through the glyph points, with the hand's wobble), with lengths
function strokePts(pts, ox, oy, sx, sy, seed, salt) {
  const P = pts.map(([x, y], i) => [ox + (x + 0.06 * wob(i + salt, seed)) * sx, oy - (y + 0.05 * wob(i + salt + 50, seed)) * sy]);
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 8; k++) {
      const t = k / 8, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
const polyLen = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
// draw the first `frac` (0..1) of a polyline
function drawPoly(g, p, frac) {
  if (frac <= 0 || p.length < 2) return;
  const total = polyLen(p) * frac;
  g.beginPath(); g.moveTo(p[0][0], p[0][1]);
  let run = 0;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (run + d >= total) { const k = d ? (total - run) / d : 0; g.lineTo(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k); break; }
    g.lineTo(p[i][0], p[i][1]); run += d;
  }
  g.stroke();
}
// a group of strokes drawn one after the other: `frac` of their total length
function drawStrokes(g, strokes, frac) {
  const lens = strokes.map(polyLen), total = lens.reduce((a, b) => a + b, 0);
  let left = clamp(frac) * total;
  for (let i = 0; i < strokes.length && left > 0; i++) { drawPoly(g, strokes[i], Math.min(1, left / lens[i])); left -= lens[i]; }
}

// the word as strokes: letters 0.07 m tall, centred on cx (px), the baseline at yb (px)
function wordStrokes(word, cx, yb, seed, salt) {
  const H = 0.07 * PXM, gap = 0.011 * PXM, cell = H * 0.82;
  const adv = [...word].map((ch) => GW[ch] * cell);
  const total = adv.reduce((a, b) => a + b, 0) + gap * (word.length - 1);
  let x = cx - total / 2;
  const out = [];
  [...word].forEach((ch, i) => { GLYPH[ch].forEach((s, j) => out.push(strokePts(s, x, yb, GW[ch] * cell, H, seed, salt + i * 9 + j * 3))); x += adv[i] + gap; });
  return out;
}

const heartPath = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.8, y - s * 1.1, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9); g.closePath(); };

// the deckled paper: its left edge torn (a ragged line), the rest straight with a hint of wear
function paperEdge(seed) {
  const L = [];
  for (let j = 0; j <= 60; j++) { const y = (j / 60) * CH; L.push([0.006 * PXM * (0.55 + 0.75 * Math.sin(j * 0.9 + seed) * Math.sin(j * 2.3) + 0.9 * wob(j, seed) + 0.5), y]); }
  return L;
}

function drawCoupon(g, w, h, { seed = 5, ink = 1 }) {
  g.clearRect(0, 0, w, h);
  // the sheet (cream, a soft vignette), cut by the torn left edge
  g.save(); g.beginPath();
  const edge = paperEdge(seed);
  g.moveTo(edge[0][0], 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(edge[edge.length - 1][0], h);
  for (let j = edge.length - 1; j >= 0; j--) g.lineTo(edge[j][0], edge[j][1]);
  g.closePath(); g.clip();
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  const vg = g.createRadialGradient(w * 0.5, h * 0.5, h * 0.3, w * 0.5, h * 0.5, w * 0.62); vg.addColorStop(0, "rgba(255,255,255,0)"); vg.addColorStop(1, "rgba(190,160,110,0.28)");
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  // paper grain (a fixed pattern)
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,120,70,${0.03 + 0.04 * hash(i * 5 + 1)})`; g.fillRect(hash(i * 3) * w, hash(i * 3 + 1) * h, 1 + 2 * hash(i + 9), 1 + hash(i + 17)); }
  g.restore();

  g.lineCap = "round"; g.lineJoin = "round";
  const stage = (a, b) => clamp((ink - a) / (b - a));
  // 1 the border (0 .. 0.2): a wobbly red marker rectangle 0.012 in from the edge, drawn clockwise from the top left
  {
    const m = 0.014 * PXM, x0 = m + 0.004 * PXM, y0 = m, x1 = w - m, y1 = h - m, pts = [];
    const side = (a, b, n, salt) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t + 2.2 * wob(i + salt, seed) * 2, a[1] + (b[1] - a[1]) * t + 2.2 * wob(i + salt + 77, seed) * 2]); } };
    side([x0, y0], [x1, y0], 28, 0); side([x1, y0], [x1, y1], 20, 100); side([x1, y1], [x0, y1], 28, 200); side([x0, y1], [x0, y0], 20, 300); pts.push(pts[0]);
    g.strokeStyle = RED; g.lineWidth = 0.0058 * PXM; drawPoly(g, pts, stage(0, 0.2));
  }
  // 2 FREE (0.2 .. 0.45), 3 HUG (0.45 .. 0.7): thick dark-brown marker
  g.strokeStyle = INK_BROWN; g.lineWidth = 0.0125 * PXM;
  const yFree = 0.026 + 0.07, yHug = 0.104 + 0.07;   // baselines, metres from the top
  drawStrokes(g, wordStrokes("FREE", w / 2 + 0.002 * PXM, yFree * PXM, seed, 0), stage(0.2, 0.45));
  drawStrokes(g, wordStrokes("HUG", w / 2 + 0.002 * PXM, yHug * PXM, seed, 40), stage(0.45, 0.7));
  // 4 the two little hearts either side of HUG (0.7 .. 0.8)
  {
    const k = smooth(stage(0.7, 0.8)), cy = (yHug - 0.035) * PXM;
    for (const [sx, rot] of [[-1, -0.2], [1, 0.2]]) {
      if (k <= 0) break;
      g.save(); g.translate(w / 2 + sx * 0.138 * PXM, cy); g.rotate(rot); g.scale(k, k);
      g.fillStyle = HEART; heartPath(g, 0, 0, 0.0145 * PXM); g.fill();
      g.strokeStyle = "#a82a38"; g.lineWidth = 0.0024 * PXM; g.stroke();
      g.restore();
    }
  }
  // 5 the doodle (0.8 .. 1): two potatoes hugging, brown outline, #f2b44a fill, two green sprouts
  {
    const k = stage(0.8, 1);
    if (k > 0) {
      const cx = w / 2, cy = (0.2155) * PXM, rx = 0.027 * PXM, ry = 0.0295 * PXM, off = 0.0185 * PXM;
      const body = (sx, i) => {
        const bx = cx + sx * off, by = cy + 0.002 * PXM * sx, pts = [];
        for (let n = 0; n <= 28; n++) { const a = (n / 28) * Math.PI * 2 + (sx < 0 ? Math.PI * 0.5 : -Math.PI * 0.5); pts.push([bx + Math.cos(a) * rx * (1 + 0.05 * wob(n + i, seed)), by + Math.sin(a) * ry * (1 + 0.05 * wob(n + i + 30, seed))]); }
        return { bx, by, pts };
      };
      const A = body(-1, 0), B = body(1, 10);
      g.lineWidth = 0.0035 * PXM; g.strokeStyle = "#5a3418";
      // the outlines (swept round, 0 .. 0.55 of the stage), then the fill and the details
      const fillK = smooth(clamp((k - 0.45) / 0.35)), detK = clamp((k - 0.7) / 0.3);
      for (const S of [A, B]) {
        if (fillK > 0) { g.globalAlpha = fillK; g.fillStyle = "#f2b44a"; g.beginPath(); S.pts.forEach(([x, y], n) => (n ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.globalAlpha = 1; }
        drawPoly(g, S.pts, clamp(k / 0.5));
      }
      if (detK > 0) {
        // sprouts: a short stem and a leaf each, green
        for (const [S, sx] of [[A, -1], [B, 1]]) {
          const x = S.bx - sx * 0.004 * PXM, y = S.by - ry * 0.95;
          g.strokeStyle = "#3f7d2a"; g.lineWidth = 0.0032 * PXM; drawPoly(g, [[x, y], [x + sx * 0.002 * PXM, y - 0.006 * PXM], [x + sx * 0.0045 * PXM, y - 0.0105 * PXM]], detK);
          g.fillStyle = "#6cbf3a"; g.save(); g.translate(x + sx * 0.0045 * PXM, y - 0.0105 * PXM); g.rotate(sx * 0.7); g.scale(detK, detK);
          g.beginPath(); g.ellipse(sx * 0.0045 * PXM, -0.0005 * PXM, 0.0072 * PXM, 0.0036 * PXM, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#3f7d2a"; g.lineWidth = 0.0015 * PXM; g.stroke(); g.restore();
        }
        // eyes and smiles (dots), and the arms round each other's backs (two arcs across the middle)
        g.fillStyle = "#4a2a17";
        for (const [S, sx] of [[A, -1], [B, 1]]) for (const e of [-1, 1]) { g.beginPath(); g.arc(S.bx + sx * 0.003 * PXM + e * 0.0085 * PXM * 0.7, S.by - 0.004 * PXM, 0.0017 * PXM * detK, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = "#5a3418"; g.lineWidth = 0.0032 * PXM;
        drawPoly(g, [[cx - 0.021 * PXM, cy + 0.006 * PXM], [cx - 0.002 * PXM, cy + 0.014 * PXM], [cx + 0.022 * PXM, cy + 0.004 * PXM]], detK);
        drawPoly(g, [[cx - 0.022 * PXM, cy - 0.004 * PXM], [cx, cy + 0.0025 * PXM], [cx + 0.02 * PXM, cy - 0.006 * PXM]], detK);
        // a few "hug" sparks either side
        g.lineWidth = 0.0028 * PXM;
        for (const sx of [-1, 1]) for (const a of [-0.5, 0.15, 0.8]) drawPoly(g, [[cx + sx * 0.062 * PXM * Math.cos(a), cy - 0.02 * PXM + 0.05 * PXM * Math.sin(a)], [cx + sx * 0.074 * PXM * Math.cos(a), cy - 0.02 * PXM + 0.06 * PXM * Math.sin(a)]], detK);
      }
    }
  }
}

// ---------------------------------------------------------------- the party hat
// A cone unrolls flat into a circular sector (radius L = the slant height, angle 2 pi R / L): the pattern is painted
// on that sector, so dots stay round and stripes keep their width all the way up. The seam (the sector's two straight
// edges) is at the back of the cone (-z).
function hatTexture(pattern) {
  const { r: R, h: H } = BIRTHDAY.hat, L = Math.hypot(R, H), theta = (2 * Math.PI * R) / L, N = 512, SS = 2;
  return canvasTex(N, N, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    const col = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const A = col(pattern === "dots" ? "#3f6fd8" : "#e2423b"), B = col(pattern === "dots" ? "#f4d23c" : "#f4c430");
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let mix = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const X = ((px + (sx + 0.5) / SS) / w - 0.5) * 2 * L, Y = (0.5 - (py + (sy + 0.5) / SS) / h) * 2 * L;   // metres on the unrolled sector
        const s = Math.hypot(X, Y), phi = Math.atan2(Y, X) + theta / 2;                                          // distance from the tip, angle round
        if (pattern === "dots") {
          // staggered rows of dots 0.012 across, 0.024 apart
          const pitch = 0.024, row = Math.round(Y / (pitch * 0.866)), cx = (Math.round(X / pitch - (row & 1) * 0.5) + (row & 1) * 0.5) * pitch, cy = row * pitch * 0.866;
          if (Math.hypot(X - cx, Y - cy) < 0.006) mix++;
        } else {
          // a spiral: bands run up and round (6 bands round the cone, a full twist over the height)
          const band = Math.floor((phi / theta) * 6 + (s / L) * 4.5);
          if (((band % 2) + 2) % 2 === 1) mix++;
        }
      }
      mix /= SS * SS;
      const o = (py * w + px) * 4;
      for (let c = 0; c < 3; c++) d[o + c] = A[c] + (B[c] - A[c]) * mix;
      d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0); 
  });
}

// the cone: rows from the tip (s = 0) to the base (s = L), seam at the back; normals set by hand (a smooth cone)
function coneGeometry() {
  const { r: R, h: H } = BIRTHDAY.hat, L = Math.hypot(R, H), theta = (2 * Math.PI * R) / L, NA = 72, NS = 10, pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NA; j++) {
    const s = (i / NS) * L, phi = (j / NA) * theta - theta / 2, az = (j / NA) * Math.PI * 2 + Math.PI;   // az 0 = +z; the seam (j 0 and NA) at -z
    const r = R * (s / L);
    pos.push(Math.sin(az) * r, H * (1 - s / L), Math.cos(az) * r);
    const nl = Math.hypot(H, R); nor.push((Math.sin(az) * H) / nl, R / nl, (Math.cos(az) * H) / nl);
    uv.push(0.5 + (s / L) * Math.cos(phi) * 0.5, 0.5 + (s / L) * Math.sin(phi) * 0.5);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// a fuzzy ball: an icosphere with its points nudged by a fixed hash (so the pompom reads as wool, not a bead)
function pompomGeometry(r) {
  const g = new THREE.IcosahedronGeometry(r, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + 0.07 * (hash(Math.round(p.getX(i) * 4000) + Math.round(p.getY(i) * 3000) * 7 + Math.round(p.getZ(i) * 5000) * 13) - 0.5); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the rosette
// the pleated ring: N pleats, each two facets (a ridge down the middle) cut flat, lit differently
function ringGeometry(r0, r1, N, hh) {
  const pos = [], col = [], lit = new THREE.Color("#e9b93c"), dark = new THREE.Color("#c99520");
  const P = (r, a, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
  const tri = (a, b, c, color) => { pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) col.push(color.r, color.g, color.b); };
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, am = ((i + 0.5) / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, ro = r1 - 0.0035 * (i % 2);
    // the left facet rises from the valley (z 0.001) to the ridge (z hh), the right falls back: valley edges at a0 and a1
    tri(P(r0, a0, 0.001), P(ro, a0, 0.001), P(ro, am, hh), lit); tri(P(r0, a0, 0.001), P(ro, am, hh), P(r0, am, hh * 1.1), lit);
    tri(P(r0, am, hh * 1.1), P(ro, am, hh), P(ro, a1, 0.001), dark); tri(P(r0, am, hh * 1.1), P(ro, a1, 0.001), P(r0, a1, 0.001), dark);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
// a ribbon tail hanging down: 0.026 wide at the top, flaring to 0.032, the end cut in a V (notch 0.02 deep)
function tailGeometry(len) {
  const s = new THREE.Shape(), w0 = 0.013, w1 = 0.017, n = 0.02;
  s.moveTo(-w0, 0); s.lineTo(w0, 0); s.lineTo(w1, -len); s.lineTo(0, -len + n); s.lineTo(-w1, -len); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false });
}

export const BIRTHDAY_KINDS = {
  coupon(P) {
    const S = P.spec, W = BIRTHDAY.coupon.w, Hh = BIRTHDAY.coupon.h, seed = S.seed ?? 5;
    // one canvas per ink step, drawn when first needed (the same pixels whenever it is drawn). The two faces keep ONE
    // texture each for the whole clip and only its image changes: the drawn look (looks.js) copies a material's map
    // once into its toon material, so swapping material.map later never reaches the screen. The back shows the same
    // canvas mirrored (its texture's u runs backwards).
    const pages = [];
    const page = (i) => pages[i] || (pages[i] = (() => { const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; drawCoupon(cv.getContext("2d"), CW, CH, { seed, ink: i / STEPS }); return cv; })());
    const tex = (mirror) => { const t = new THREE.CanvasTexture(page(STEPS)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (mirror) { t.repeat.x = -1; t.offset.x = 1; } return t; };
    const tf = tex(false), tb = tex(true);
    const mf = mat("#ffffff", { map: tf, roughness: 0.9, side: THREE.FrontSide, alphaTest: 0.5 }), mb = mat("#ffffff", { map: tb, roughness: 0.9, side: THREE.BackSide, alphaTest: 0.5 });
    mf.userData.noHatch = mb.userData.noHatch = true;
    // the sheet, centred on the origin, a faint curl along its top edge (it was folded in his bandana)
    const g = new THREE.PlaneGeometry(W, Hh, 8, 4), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (W / 2), v = (p.getY(i) + Hh / 2) / Hh; p.setZ(i, -0.004 * u * u * 0.6 - 0.004 * v * v * 0.5); }
    g.computeVertexNormals();
    const of = mesh(g, mf, P.whole), ob = mesh(g, mb, P.whole); of.castShadow = ob.castShadow = false;
    let last = STEPS;
    return {
      grip: 0,
      apply(ps) {
        const k = Math.round(clamp(ps.ink ?? S.ink ?? 1) * STEPS);
        if (k !== last) { tf.image = tb.image = page(k); tf.needsUpdate = tb.needsUpdate = true; last = k; }
      },
    };
  },

  partyhat(P) {
    const S = P.spec, { h: H, pom } = BIRTHDAY.hat, pattern = S.pattern === "dots" ? "dots" : "stripes";
    const tex = hatTexture(pattern), m = mat("#ffffff", { map: tex, roughness: 0.38, side: THREE.DoubleSide });
    m.userData.noHatch = true;
    const g = new THREE.Group(); P.whole.add(g);
    g.rotation.x = ((S.pitch ?? 0) * Math.PI) / 180;
    const cone = mesh(coneGeometry(), m, g); cone.castShadow = true;
    const pomM = mat("#f6d24a", { roughness: 1 });
    mesh(pompomGeometry(pom), pomM, g, 0, H + pom * 0.45, 0);
    // a thin darker rim at the base, as the card's folded edge
    const rim = mesh(new THREE.TorusGeometry(BIRTHDAY.hat.r, 0.0016, 6, 48), mat(pattern === "dots" ? "#2f55b0" : "#b8302c", { roughness: 0.5 }), g, 0, 0.001, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    return { grip: 0 };
  },

  rosette(P) {
    const S = P.spec, { r, disc, tail } = BIRTHDAY.rosette, gold = S.color ?? "#e9b93c";
    const g = new THREE.Group(); P.whole.add(g);
    // the tails first (under the ring), splayed a little, each with its V
    const tailM = mat("#d9a52c", { roughness: 0.55, side: THREE.DoubleSide }), tailD = mat("#c99520", { roughness: 0.55 });
    for (const s of [-1, 1]) {
      const t = mesh(tailGeometry(tail), s < 0 ? tailD : tailM, g, s * 0.012, -0.02, 0.0005); t.rotation.z = s * 0.2;
      // a darker centre fold down each tail
      const f = mesh(new THREE.BoxGeometry(0.0022, tail * 0.82, 0.0012), mat("#a97c12", { roughness: 0.6 }), t, 0, -tail * 0.5, 0.0026); f.castShadow = false;
    }
    const ring = mesh(ringGeometry(disc * 0.8, r, 18, 0.007), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide }), g, 0, 0, 0.0015);
    ring.material.userData.noHatch = true;
    if (gold !== "#e9b93c") ring.material.color.set(gold);
    const d = mesh(new THREE.CylinderGeometry(disc, disc * 1.04, 0.007, 28), mat("#f6d36b", { roughness: 0.3, metalness: 0.2 }), g, 0, 0, 0.0095); d.rotation.x = Math.PI / 2;
    const dr = mesh(new THREE.TorusGeometry(disc * 0.97, 0.0022, 6, 32), mat("#d9a52c", { roughness: 0.4, metalness: 0.2 }), g, 0, 0, 0.0128);
    dr.castShadow = false;
    return { grip: 0 };
  },
};
