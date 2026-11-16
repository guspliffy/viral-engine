// props-at-d-hatch.js: Atlantis EP03 block D, panel 45 (the cost of the film): the hatch deck under the city-ship, the lit
// cream hall above it, the lift beam and the night sea round it. Real scale, metres (Spud 0.88). Brief: block-d/briefs/D4.md.
// Bench: storyboards/series/ancient-aliens/03-atlantis/block-d/bench/make-at-hatch.mjs (+ at-hatch-sheet.png).
// Registered through props-at-d.js as AT_D_HATCH_KINDS. Scenery: every mesh is lookOnly / surfaceOnly, nothing is held, no grips.
//
//   hatchhall   ONE kind. ORIGIN = deck level y 0 at the hatch axis (x 0, z 0). +y up, the deck is the plane y 0 (a character that
//               stands at y 0 stands on it), the sea is at y -9 (put the kit `sea`, grade "night", at the same x, z and y -9; see
//               the bench). The hull's underside is at y -1.2 (7.8 above the sea at this scale; the hatch tube is the hull's
//               thickness), graphite panels with seams, rivets and wet beads out to r 20 (40 m across), then the white ceramic hull
//               curling up and away with ONE orange band (r 34..37) at the edge of view, and three lit lenses r 1.2 on the
//               underside (r 10.5, bezel 1.5, glass lit by `lit`). The round hatch is 9 across (r 4.5): an orange lip on the collar
//               (collar 1.2 wide, r 4.5..5.7, hanging 0.5 under the hull), the hatch tube wall (graphite plates, rivets) up to the
//               deck. Above it the warm cream hall: wall r 14, ceiling y 10, 24 bays (door, vents, pipes, consoles), columns and
//               braces, ceiling girders and 36 lamp panels (#ffe2a8), a floor ring r 4.5..14.
//   LEFT HALF  (x < 0) is the lift: beam r 2.2 centred on x -2.2, z 0 (its axis), from the sea (y -9) up to y +1.6 above the deck
//               (soft fade in the last 1.5 m), a soft physical turquoise column drawn by the light a sight line crosses, with 70
//               bubbles rising in it, a turquoise pool and mist where it meets the sea, a ring of foam lace, lens light spots on
//               the water. The deck's left half is an open edge (no rail).
//   RIGHT HALF (x > 0) is the crew deck: a low rail (1.0 high, three bars, posts every 7.5 deg, r 4.7) round it, a curb at the
//               lip, and the crew seats. Seat origin = the floor under the seat; the seat top (sit height) is 0.45; the back is 1.15.
//   deck standable top: y 0, from r 4.5 (the hatch lip) to r 14 (the wall); keep bodies outside the rail (r 4.7), r > 5.0.
//   STANDING SPOTS (x, z on the deck; face = the actor's facing in degrees, 0 = +z, 90 = +x, toward the hatch axis from the spot):
//     seats, front row (r 5.15, facing the axis, sit height 0.45, a `sit` without a seat prop and with rot = face, height 0.45):
//       S1 (4.37, -2.73) face 302  crew A   S2 (4.95, -1.42) face 286  crew B   S3 (5.15, 0.00) face 270  THE EMPTY SEAT (cream, walnut arms)
//       S4 (4.95, 1.42) face 254  crew C
//     seats, back row (r 6.7): S5 (5.55, -3.75) face 304  crew D   S6 (5.80, 3.35) face 240  crew E
//     the foreman stands at (3.51, 4.50) face 218 (rail side, waving toward the beam at the camera); Spud's lift spot is the beam's axis
//     (-2.2, 0) face 90 (looks +x) or face 270 for the camera on the right. All bodies are >= 1.2 m apart.
//   CAMERAS (bench; keep the camera outside the beam, x < -4.4 or x > 0, or its column washes the picture): plate 45 = pos (-6.2, -7.8, 5.0)
//     look (3.0, 1.6, -0.6) fov 62, Spud in the beam at y -4 (face 321); Spud higher y -1.5 = pos (-3.4, -7.6, 6.4) look (-0.4, 0.4, -0.2) fov 50;
//     side (the sea to the hatch) = pos (-17, -6.5, 20) look (-1, -2, 0) fov 50; the empty seat and the foreman = pos (-0.2, 1.3, -0.9)
//     look (4.6, 0.8, 1.6) fov 50 (the camera floats over the open left half); tall (1080 x 1920) = pos (1.2, -8.2, 7.4) look (-1.3, 0.2, -0.4) fov 56.
//   spec: lit 1 (hall lamps and lenses), beam 1 (the lift column), swell: not used (the sea is the kit sea's). params (spec.<name> is the
//     start value; a dur-0 `set` seeds a param that is tweened): lit 0..1, beam 0..1.
//   Lights (the characters read warm against the blue night): PointLight #ffd49a in the hall middle (0, 6.5, 0), a warm one over
//     the seats (4.6, 2.6, 0), and a turquoise one in the beam (-2.2, -4, 0) for Spud.
// Look: hand-drawn Ghibli: every seam, rivet, scuff, bead and stain is its own mark from a hash of its index (no tiling texture,
// no Math.random, no wall clock: animation only from params and the clip clock t).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;

// ------------------------------------------------------------------------------------------------ the numbers
const HR = 4.5;            // hatch radius (9 across)
const U_Y = -1.2;          // hull underside
const C_R = 5.7;           // collar outer radius
const WALL = 14, CEIL = 10;
const SEA_Y = -9;
const BEAM = { x: -2.2, r: 2.2, top: 1.6 };
const SEAT_TOP = 0.45;
// seats: [r, deg, kind]; kind 0 normal, 1 the empty one (walnut arms)
const SEATS = [[5.15, -32, 0], [5.15, -16, 0], [5.15, 0, 1], [5.15, 16, 0], [6.7, -34, 0], [6.7, 30, 0]];
const seatYaw = (th) => Math.atan2(-Math.cos(th), -Math.sin(th));
const LENS = [[10.5, 205], [10.5, 332], [10.5, 95]];   // r, deg

// ------------------------------------------------------------------------------------------------ canvas helpers
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false;
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const CACHE = new Map();
const once = (k, f) => { if (!CACHE.has(k)) CACHE.set(k, f()); return CACHE.get(k); };

// a painter in metres: u across uLen, v down vLen. R = rect, E = ellipse, L = line
function pen(g, W, H, uLen, vLen) {
  g.save(); g.scale(W / uLen, H / vLen);
  return {
    R: (x, y, w, h, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, y, w, h); },
    E: (x, y, rx, ry, col, a = 1, rot = 0) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); },
    L: (x0, y0, x1, y1, col, w, a = 1) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); },
    S: (x, y, w, h, col, lw, a = 1, r = 0.05) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.roundRect(x, y, w, h, r); g.stroke(); },
    done: () => { g.restore(); g.globalAlpha = 1; },
  };
}

// panels with seams, rivets, scuffs and beads (the underside and the hull). pal: { base [a, b], seam, hi, rivet, wet, stain }
function paintPlates(W, H, uLen, vLen, seed, pal, o = {}) {
  const [cv, g] = canvas(W, H), r = (k) => rnd(seed * 1000 + k);
  g.fillStyle = pal.base[0]; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, uLen, vLen);
  const rowH = o.rowH ?? 2.4, nRow = Math.max(1, Math.round(vLen / rowH)), pw = o.pw ?? 2.6;
  const nU = Math.max(2, Math.round(uLen / pw)), cw = uLen / nU;
  for (let j = 0; j < nRow; j++) {
    const v0 = (j / nRow) * vLen, v1 = ((j + 1) / nRow) * vLen, st = (j % 2) * 0.5, jit = (i) => 0.12 * cw * (r(j * 97 + i * 3) - 0.5);
    for (let i = -1; i <= nU; i++) {
      const u0 = (i + st) * cw + jit(i), u1 = (i + 1 + st) * cw + jit(i + 1), tone = r(j * 131 + i * 7);
      // each panel its own tone, darker toward the seams (a flat gradient drawn as stacked insets)
      p.R(u0, v0, u1 - u0, v1 - v0, tone < 0.5 ? pal.base[0] : pal.base[1], 0.55 + 0.4 * r(j * 29 + i));
      for (let k = 0; k < 4; k++) p.S(u0 + 0.03 + 0.05 * k, v0 + 0.03 + 0.05 * k, u1 - u0 - 0.06 - 0.1 * k, v1 - v0 - 0.06 - 0.1 * k, pal.hi, 0.05, 0.05 * (4 - k) / 4, 0.02);
      // seam: a dark groove and a light lip beside it
      p.R(u0 - 0.02, v0, 0.04 + 0.02 * r(j * 53 + i), v1 - v0, pal.seam, 0.9);
      p.R(u0 + 0.03, v0, 0.018, v1 - v0, pal.hi, 0.35);
      // rivets both sides of the seam; some missing, some rusty
      for (let y = v0 + 0.12 + 0.12 * r(j * 71 + i); y < v1 - 0.08; y += 0.34 + 0.1 * r(j * 73 + i + y * 11)) {
        if (r(j * 83 + i * 19 + y * 31) < 0.1) continue;
        for (const dx of [-0.075, 0.095]) { const rr = 0.026 + 0.008 * r(j * 5 + i + y * 7); p.E(u0 + dx + 0.012, y + 0.014, rr, rr, "#000", 0.35); p.E(u0 + dx, y, rr, rr, pal.rivet, 0.95); p.E(u0 + dx - 0.007, y - 0.008, rr * 0.4, rr * 0.4, "#fff", 0.35); }
        if (r(j * 91 + i * 13 + y * 17) < 0.07) p.L(u0 + 0.1, y, u0 + 0.1 + 0.02, y + 0.35 + 0.5 * r(i + y), "#7a4a2a", 0.03, 0.3);   // a rust run
      }
      // an access hatch in some panels: outlined, four rivets, a recessed handle
      if (tone > 0.84 || r(j * 41 + i * 5) > 0.9) {
        const hw = 0.3 + 0.18 * r(j * 11 + i), hh = 0.18 + 0.1 * r(j * 13 + i), cx = (u0 + u1) / 2 + 0.1 * (r(i + j) - 0.5), cy = (v0 + v1) / 2;
        p.R(cx - hw, cy - hh, 2 * hw, 2 * hh, "#000", 0.14); p.S(cx - hw, cy - hh, 2 * hw, 2 * hh, pal.seam, 0.03, 0.9, 0.03); p.S(cx - hw + 0.02, cy - hh + 0.02, 2 * hw - 0.04, 2 * hh - 0.04, pal.hi, 0.012, 0.4, 0.03);
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.E(cx + dx * (hw - 0.07), cy + dy * (hh - 0.06), 0.02, 0.02, pal.rivet, 0.95);
        p.R(cx - 0.1, cy - 0.015, 0.2, 0.03, pal.seam, 0.9);
      }
      // wet: water beads on the underside, bright specks along the seam and a few on the panel
      for (let b = 0; b < 16; b++) { const bx = u0 + (u1 - u0) * r(j * 300 + i * 17 + b), by = v0 + (v1 - v0) * r(j * 301 + i * 19 + b), rr = 0.012 + 0.03 * r(j * 302 + i * 23 + b) ** 2; p.E(bx, by, rr, rr * 1.2, pal.wet, 0.12 + 0.2 * r(b + i)); p.E(bx - rr * 0.3, by - rr * 0.35, rr * 0.3, rr * 0.3, "#fff", 0.3); }
    }
  }
  // the ring seams between rows
  for (let j = 0; j <= nRow; j++) { const v = (j / nRow) * vLen; p.R(0, v - 0.025, uLen, 0.05, pal.seam, 0.95); p.R(0, v + 0.03, uLen, 0.02, pal.hi, 0.4); }
  // stains, scuffs, streaks
  for (let i = 0; i < (o.stains ?? 60); i++) { const x = r(600 + i) * uLen, y = r(620 + i) * vLen; p.E(x, y, 0.1 + 0.6 * r(640 + i), 0.05 + 0.3 * r(660 + i), pal.stain, 0.06 + 0.09 * r(680 + i), r(700 + i) * 3); }
  for (let i = 0; i < (o.streaks ?? 90); i++) { const x = r(2000 + i) * uLen, y = r(2100 + i) * vLen, len = 0.3 + 1.6 * r(2200 + i) ** 2; p.L(x, y, x + 0.04 * (r(i) - 0.5), y + len, pal.stain, 0.015 + 0.04 * r(2300 + i), 0.12 + 0.2 * r(2400 + i)); }
  for (let i = 0; i < (o.scuffs ?? 260); i++) { const x = r(3000 + i * 3) * uLen, y = r(3001 + i * 3) * vLen, len = 0.06 + 0.35 * r(3002 + i * 3) ** 2, a = (r(3003 + i * 3) - 0.5) * 0.7, dark = r(3004 + i * 3) < 0.5; p.L(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len * 0.5, dark ? pal.seam : pal.hi, 0.008 + 0.02 * r(3005 + i), dark ? 0.35 : 0.3); }
  if (o.band) { const [v0, v1, col, seam] = o.band; p.R(0, v0 * vLen, uLen, (v1 - v0) * vLen, col, 1); p.R(0, v0 * vLen - 0.03, uLen, 0.06, seam, 0.9); p.R(0, v1 * vLen - 0.03, uLen, 0.06, seam, 0.9); for (let i = 0; i < nU * 2; i++) p.R(i * cw / 2, v0 * vLen, 0.04, (v1 - v0) * vLen, seam, 0.55); }
  p.done();
  return cv;
}

// the hall's wall bays (3.67 m x 10 m), five variants: plain, door, vents, pipes, panel
function paintBay(kind, seed) {
  const W = 512, H = 1024, uLen = 3.67, vLen = 10, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 777 + k);
  g.fillStyle = "#e9d8ad"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, uLen, vLen);
  const plate = (x, y, w, h, tone, a = 0.5) => { p.R(x, y, w, h, tone, a); p.S(x + 0.02, y + 0.02, w - 0.04, h - 0.04, "#fff3d0", 0.02, 0.5, 0.03); p.S(x, y, w, h, "#8d7648", 0.028, 0.75, 0.03); };
  const rivets = (x, y, w, h, n) => { for (let i = 0; i <= n; i++) for (const yy of [y + 0.07, y + h - 0.07]) { const xx = x + 0.07 + (w - 0.14) * i / n; p.E(xx + 0.01, yy + 0.012, 0.022, 0.022, "#000", 0.3); p.E(xx, yy, 0.022, 0.022, "#bda776", 1); p.E(xx - 0.006, yy - 0.006, 0.008, 0.008, "#fff", 0.5); } };
  // wainscot (0..1.3), plate rows above, a dado rail, a cornice at the top
  p.R(0, 8.7, uLen, 1.3, "#d9c48f", 1); p.R(0, 8.7, uLen, 0.06, "#8d7648", 0.9);   // the wainscot is at the bottom of the painted wall: canvas y grows DOWN (top = ceiling)
  const rows = [[0.0, 0.5], [0.5, 2.9], [2.9, 5.6], [5.6, 8.7]];
  for (const [a, b] of rows) for (let i = 0; i < 3; i++) { const w = uLen / 3, x = i * w; plate(x + 0.03, a + 0.03, w - 0.06, b - a - 0.06, r(a * 31 + i) < 0.5 ? "#f6e9c4" : "#dfcb9a", 0.35 + 0.3 * r(a * 17 + i * 5)); rivets(x + 0.03, a + 0.03, w - 0.06, b - a - 0.06, 5); }
  for (const [a, b] of [[8.7, 10]]) for (let i = 0; i < 3; i++) { const w = uLen / 3, x = i * w; plate(x + 0.03, a + 0.03, w - 0.06, b - a - 0.06, "#c9b27f", 0.45); rivets(x + 0.03, a + 0.03, w - 0.06, b - a - 0.06, 5); }
  p.R(0, 8.64, uLen, 0.1, "#b9a06a", 0.9); p.R(0, 5.54, uLen, 0.08, "#b9a06a", 0.8);   // a dado rail and a band
  if (kind === 1) {   // the door: a round-cornered steel door with a porthole and a wheel handle (right of centre), warm light in the glass
    const x = 1.15, y = 6.6, w = 1.3, h = 2.1;
    p.S(x - 0.18, y - 0.18, w + 0.36, h + 0.18, "#8d7648", 0.07, 1, 0.22); p.R(x, y, w, h, "#d8c996", 1); p.S(x, y, w, h, "#5d4e30", 0.04, 1, 0.14);
    p.R(x + 0.1, y + 0.1, w - 0.2, h - 0.2, "#e6d8ad", 0.8); p.E(x + w / 2, y + 0.65, 0.3, 0.3, "#8d7648", 1); p.E(x + w / 2, y + 0.65, 0.23, 0.23, "#ffe9b3", 1); p.E(x + w / 2, y + 0.65, 0.23, 0.23, "#fff", 0.2); p.L(x + w / 2 - 0.23, y + 0.65, x + w / 2 + 0.23, y + 0.65, "#8d7648", 0.02, 0.6);
    p.E(x + w * 0.8, y + 1.25, 0.15, 0.15, "#8d7648", 1); p.E(x + w * 0.8, y + 1.25, 0.1, 0.1, "#cdbb86", 1); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; p.L(x + w * 0.8 - Math.cos(a) * 0.17, y + 1.25 - Math.sin(a) * 0.17, x + w * 0.8 + Math.cos(a) * 0.17, y + 1.25 + Math.sin(a) * 0.17, "#8d7648", 0.03, 1); }
    p.R(x + 0.1, y + h - 0.35, w - 0.2, 0.25, "#bda776", 0.8);
  }
  if (kind === 2) {   // two louvred vents and a duct
    for (const [x, y] of [[0.35, 6.3], [2.0, 6.3]]) { p.R(x, y, 1.3, 0.9, "#6e5b36", 1); for (let k = 0; k < 11; k++) p.R(x + 0.06, y + 0.07 + k * 0.073, 1.18, 0.04, "#2e2514", 0.9); p.S(x, y, 1.3, 0.9, "#b9a06a", 0.06, 1, 0.04); }
    p.R(0, 4.6, uLen, 0.5, "#cdb982", 0.9); p.S(0, 4.6, uLen, 0.5, "#8d7648", 0.04, 1, 0.06); for (let i = 0; i < 9; i++) p.R(i * 0.42, 4.6, 0.05, 0.5, "#8d7648", 0.8);
  }
  if (kind === 3) {   // vertical pipes with clamps and a junction box
    for (const [x, rr, col] of [[0.5, 0.11, "#b8c0b4"], [0.82, 0.07, "#c9a56a"], [3.0, 0.13, "#b8c0b4"]]) { p.R(x - rr, 0, rr * 2, 8.7, col, 1); p.R(x - rr * 0.4, 0, rr * 0.5, 8.7, "#fff", 0.35); p.R(x + rr * 0.55, 0, rr * 0.45, 8.7, "#3a3220", 0.3); for (let y = 0.7; y < 8.5; y += 1.55) { p.R(x - rr - 0.03, y, rr * 2 + 0.06, 0.12, "#8d7648", 1); p.E(x, y + 0.06, 0.02, 0.02, "#fff", 0.6); } }
    p.R(1.4, 6.0, 0.9, 1.1, "#c2b585", 1); p.S(1.4, 6.0, 0.9, 1.1, "#5d4e30", 0.04, 1, 0.05); p.E(1.62, 6.25, 0.07, 0.07, "#d0502e", 1); p.E(1.62, 6.5, 0.07, 0.07, "#6fc67a", 1); p.R(1.85, 6.15, 0.3, 0.7, "#2e2514", 0.85);
  }
  if (kind === 4) {   // a wall panel of dials and a map plate
    p.R(0.5, 6.0, 2.6, 1.6, "#cdb982", 1); p.S(0.5, 6.0, 2.6, 1.6, "#5d4e30", 0.05, 1, 0.06);
    for (let i = 0; i < 4; i++) { p.E(0.95 + i * 0.62, 6.5, 0.22, 0.22, "#2e2514", 1); p.E(0.95 + i * 0.62, 6.5, 0.18, 0.18, "#f0e3be", 1); p.L(0.95 + i * 0.62, 6.5, 0.95 + i * 0.62 + 0.13 * Math.cos(i + 1), 6.5 + 0.13 * Math.sin(i + 1), "#7a2e1c", 0.02, 1); }
    for (let i = 0; i < 6; i++) p.R(0.75 + i * 0.4, 7.05, 0.25, 0.3, i % 3 === 0 ? "#d0502e" : "#a8d6c8", 0.9);
  }
  // wear: scuffs low, grime at the top, a few stains
  for (let i = 0; i < 120; i++) { const x = r(10 + i) * uLen, y = 8.7 + 1.3 * r(200 + i) ** 1.5 - 0.1, len = 0.05 + 0.3 * r(400 + i) ** 2; p.L(x, y, x + len, y + 0.04 * (r(i) - 0.5), r(i + 3) < 0.5 ? "#7d6a3e" : "#fff3d0", 0.012 + 0.02 * r(600 + i), 0.25); }
  for (let i = 0; i < 24; i++) p.E(r(900 + i) * uLen, r(950 + i) * 8, 0.12 + 0.4 * r(990 + i), 0.5 + 1.6 * r(1010 + i), "#8d7648", 0.04 + 0.05 * r(1030 + i));
  p.R(0, 0, uLen, 0.6, "#8d7648", 0.18);
  p.done();
  return cv;
}

function paintCeiling(seed) {
  const W = 2048, H = 2048, uLen = 28, vLen = 28, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 555 + k);
  g.fillStyle = "#efdfb6"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, uLen, vLen);
  for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
    const x = i * 28 / 24, y = j * 28 / 24;
    p.R(x + 0.02, y + 0.02, 28 / 24 - 0.04, 28 / 24 - 0.04, r(i * 30 + j) < 0.5 ? "#f8ecc9" : "#e2cf9d", 0.4);
    p.S(x, y, 28 / 24, 28 / 24, "#8d7648", 0.03, 0.7, 0.02);
    for (const [dx, dy] of [[0.07, 0.07], [1.1, 0.07], [0.07, 1.1], [1.1, 1.1]]) { p.E(x + dx + 0.008, y + dy + 0.01, 0.02, 0.02, "#000", 0.3); p.E(x + dx, y + dy, 0.02, 0.02, "#bda776", 1); }
  }
  for (let i = 0; i < 70; i++) p.E(r(100 + i) * uLen, r(200 + i) * vLen, 0.3 + 1.2 * r(300 + i), 0.15 + 0.5 * r(400 + i), "#8d7648", 0.04 + 0.05 * r(500 + i), r(600 + i) * 3);
  p.done();
  return cv;
}

function paintDeck(seed) {
  const W = 3072, H = 768, uLen = 2 * Math.PI * 9, vLen = WALL - HR, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 321 + k);
  g.fillStyle = "#c4a874"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, uLen, vLen);
  const nU = 40, cw = uLen / nU;
  for (let j = 0; j < 8; j++) for (let i = 0; i < nU; i++) {
    const x = i * cw + (j % 2) * cw / 2, y = j * vLen / 8;
    p.R(x + 0.02, y + 0.02, cw - 0.04, vLen / 8 - 0.04, r(j * 99 + i) < 0.5 ? "#d8c08a" : "#bfa56f", 0.6);
    p.S(x, y, cw, vLen / 8, "#7d6a3e", 0.04, 0.8, 0.03);
    for (let k = 0; k < 14; k++) { const ax = x + 0.08 + (cw - 0.16) * r(j * 500 + i * 13 + k), ay = y + 0.06 + (vLen / 8 - 0.12) * r(j * 600 + i * 17 + k); p.E(ax, ay, 0.018, 0.018, "#8d7648", 0.55); }   // anti-slip dots
  }
  for (let i = 0; i < 160; i++) { const x = r(5 + i) * uLen, y = r(205 + i) * vLen; p.L(x, y, x + 0.1 + 0.5 * r(405 + i), y + 0.05 * (r(i) - 0.5), "#5d4e30", 0.012 + 0.03 * r(605 + i), 0.3); }
  p.R(0, 0, uLen, 0.28, "#d0502e", 1); for (let i = 0; i < uLen / 0.5; i++) p.R(i * 0.5, 0, 0.25, 0.28, "#2e2514", 0.9);   // a hazard band at the lip (r 4.5..4.78)
  p.done();
  return cv;
}

function paintTube(seed) {
  const W = 2048, H = 256, uLen = TAU * HR, vLen = 1.7, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 91 + k);
  g.fillStyle = "#3a434b"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, uLen, vLen);
  const nU = 12, cw = uLen / nU;
  for (let i = 0; i < nU; i++) {
    p.R(i * cw + 0.03, 0.03, cw - 0.06, vLen - 0.06, r(i) < 0.5 ? "#4a545e" : "#3f4851", 0.9); p.S(i * cw, 0, cw, vLen, "#1d2329", 0.05, 0.95, 0.02);
    for (let y = 0.1; y < vLen - 0.05; y += 0.3) for (const dx of [0.1, cw - 0.1]) { p.E(i * cw + dx + 0.01, y + 0.012, 0.025, 0.025, "#000", 0.35); p.E(i * cw + dx, y, 0.025, 0.025, "#8b97a3", 1); p.E(i * cw + dx - 0.007, y - 0.007, 0.009, 0.009, "#fff", 0.5); }
    for (let b = 0; b < 12; b++) { const bx = i * cw + cw * r(300 + i * 13 + b), by = vLen * r(400 + i * 17 + b), rr = 0.012 + 0.025 * r(500 + b + i) ** 2; p.E(bx, by, rr, rr * 1.3, "#a8c8d8", 0.4); p.E(bx - rr * 0.3, by - rr * 0.4, rr * 0.35, rr * 0.35, "#fff", 0.55); }
  }
  p.R(0, 0.55, uLen, 0.05, "#1d2329", 0.9); p.R(0, 1.15, uLen, 0.05, "#1d2329", 0.9);
  for (let i = 0; i < 80; i++) p.L(r(700 + i) * uLen, r(800 + i) * vLen, r(700 + i) * uLen + 0.03, r(800 + i) * vLen + 0.2 + 0.7 * r(900 + i), "#24351f", 0.02 + 0.03 * r(1000 + i), 0.18);
  p.done();
  return cv;
}

function paintLeather(empty, seed) {
  const W = 256, H = 256, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 13 + k);
  g.fillStyle = "#f1e6c6"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, 1, 1);
  for (let i = 1; i < 4; i++) { p.R(i / 4 - 0.004, 0.02, 0.008, 0.96, "#8d7648", 0.45); p.R(0.02, i / 4 - 0.004, 0.96, 0.008, "#8d7648", 0.45); }
  p.S(0.02, 0.02, 0.96, 0.96, "#8d7648", 0.012, 0.8, 0.08);
  for (let i = 0; i < 40; i++) p.L(r(i) , r(i + 50), r(i) + 0.05 * r(i + 80), r(i + 50) + 0.01, r(i + 7) < 0.5 ? "#a8915f" : "#fffaf0", 0.004, 0.35);
  if (empty) { p.E(0.5, 0.52, 0.28, 0.2, "#8d7648", 0.12); p.E(0.5, 0.52, 0.18, 0.12, "#8d7648", 0.1); }   // worn where someone sat
  p.done();
  return cv;
}

function paintScreen(seed) {
  const W = 256, H = 128, [cv, g] = canvas(W, H), r = (k) => rnd(seed * 17 + k);
  g.fillStyle = "#12302f"; g.fillRect(0, 0, W, H);
  const p = pen(g, W, H, 2, 1);
  for (let i = 0; i < 9; i++) { p.R(0.1, 0.1 + i * 0.1, 0.3 + 1.3 * r(i), 0.04, i % 4 === 0 ? "#ffd27a" : "#7fe6d4", 0.9); }
  p.E(1.6, 0.5, 0.28, 0.28, "#7fe6d4", 0.25); p.S(1.32, 0.22, 0.56, 0.56, "#7fe6d4", 0.02, 0.9, 0.28);
  p.done();
  return cv;
}

function glowTex(rgb) {
  return once("glow" + rgb, () => { const [c, x] = canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.3, `rgba(${rgb},0.55)`); g.addColorStop(0.65, `rgba(${rgb},0.14)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return tex(c); });
}
const bubbleTex = () => once("bub", () => {
  const [c, x] = canvas(64, 64); x.strokeStyle = "rgba(230,255,250,0.95)"; x.lineWidth = 3.2; x.beginPath(); x.arc(32, 32, 26, 0, TAU); x.stroke();
  x.fillStyle = "rgba(190,250,240,0.16)"; x.beginPath(); x.arc(32, 32, 26, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,0.95)"; x.beginPath(); x.ellipse(24, 22, 7, 4, -0.6, 0, TAU); x.fill();
  x.fillStyle = "rgba(255,255,255,0.4)"; x.beginPath(); x.ellipse(41, 43, 5, 2.5, -0.6, 0, TAU); x.fill(); return tex(c);
});
const foamTex = () => once("foam", () => {
  const W = 512, [c, g] = canvas(W, W), p = pen(g, W, W, 1, 1);
  const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); gr.addColorStop(0, "rgba(190,255,240,0.5)"); gr.addColorStop(0.55, "rgba(190,255,240,0.25)"); gr.addColorStop(1, "rgba(190,255,240,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 520; i++) { const a = rnd(i * 3) * TAU, d = 0.12 + 0.36 * Math.sqrt(rnd(i * 3 + 1)), rr = 0.004 + 0.016 * rnd(i * 3 + 2) ** 2, x = 0.5 + Math.cos(a) * d, y = 0.5 + Math.sin(a) * d, edge = 1 - Math.abs(d - 0.34) * 3; p.E(x, y, rr * 1.6, rr, "#f2fffb", clamp(0.25 + 0.7 * edge) * (0.5 + 0.5 * rnd(i))); }
  for (let k = 0; k < 7; k++) { const rr = 0.2 + 0.035 * k; g.strokeStyle = "rgba(240,255,252,0.35)"; g.lineWidth = 2 + k % 3; g.beginPath(); for (let a = 0; a <= 64; a++) { const th = (a / 64) * TAU, rj = rr + 0.012 * Math.sin(th * 7 + k * 2) + 0.01 * Math.sin(th * 13 + k); const x = (0.5 + Math.cos(th) * rj) * W, y = (0.5 + Math.sin(th) * rj) * W; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  p.done(); return tex(c);
});

// ------------------------------------------------------------------------------------------------ geometry helpers
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), E = new THREE.Euler(), S1 = new THREE.Vector3(1, 1, 1);
function xf(x, y, z, ry = 0, rx = 0, rz = 0) { E.set(rx, ry, rz, "YXZ"); Q.setFromEuler(E); return new THREE.Matrix4().compose(V.set(x, y, z), Q, S1); }
function clean(geo) { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k); return g; }
class Bin {
  constructor() { this.m = new Map(); }
  add(key, geo, mtx) { const g = clean(geo.clone ? geo.clone() : geo); if (mtx) g.applyMatrix4(mtx); if (!this.m.has(key)) this.m.set(key, []); this.m.get(key).push(g); }
  box(key, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { this.add(key, new THREE.BoxGeometry(w, h, d), xf(x, y, z, ry, rx, rz)); }
  rbox(key, w, h, d, rad, x, y, z, ry = 0, rx = 0, rz = 0) { this.add(key, new RoundedBoxGeometry(w, h, d, 2, rad), xf(x, y, z, ry, rx, rz)); }
  cyl(key, r0, r1, h, x, y, z, ry = 0, rx = 0, rz = 0, n = 12) { this.add(key, new THREE.CylinderGeometry(r0, r1, h, n), xf(x, y, z, ry, rx, rz)); }
  // a rod between two points
  rod(key, a, b, r, n = 8) { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)); this.add(key, new THREE.CylinderGeometry(r, r, L, n), new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, S1)); }
  merged(key) { const l = this.m.get(key); return l && l.length ? mergeGeometries(l) : null; }
}
// a polar patch r0..r1 x angle 0..2pi, y(r) the surface height, u = angle, v = (r - r0) / (r1 - r0)
function polarGeo(r0, r1, nr, na, yAt, rAt = (i) => i) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nr; i++) { const k = rAt(i / nr), r = lerp(r0, r1, k); for (let j = 0; j <= na; j++) { const a = (j / na) * TAU; pos.push(Math.cos(a) * r, yAt(r), Math.sin(a) * r); uv.push(j / na, k); } }
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j, b = a + na + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a cylinder wall of radius r from y0 to y1 (u = angle, v = 0 at the top), a0..a1
function wallGeo(r, y0, y1, na, a0 = 0, a1 = TAU, nv = 1) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nv; i++) { const y = lerp(y1, y0, i / nv); for (let j = 0; j <= na; j++) { const a = lerp(a0, a1, j / na); pos.push(Math.cos(a) * r, y, Math.sin(a) * r); uv.push(j / na, i / nv); } }
  for (let i = 0; i < nv; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j, b = a + na + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const yUnder = (r) => (r <= 20 ? U_Y : U_Y + 11 * ((r - 20) / 20) ** 1.6);

const mkMat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, side: THREE.DoubleSide, ...o });
const lookOnly = (m, o = {}) => { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.userData.solid = false; m.userData.lookOnly = true; m.userData.surfaceOnly = true; if (o.steam) m.userData.steam = true; if (o.order != null) m.renderOrder = o.order; return m; };

// ------------------------------------------------------------------------------------------------ the lift beam (a soft physical column), after props-aa-ship.js
function beamMaterial(density, top, bot, len) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uD: { value: -Math.log(1 - density) }, uTop: { value: top }, uBot: { value: bot }, uL: { value: len }, uC0: { value: new THREE.Color(0.18, 0.78, 0.74) }, uC1: { value: new THREE.Color(0.5, 0.98, 0.9) } },
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    vertexShader: "varying vec3 vW; varying vec3 vC; varying float vY; void main() { vY = position.y; vW = (modelMatrix * vec4(position, 1.0)).xyz; vC = (modelMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }",
    fragmentShader: "uniform float uA, uD, uTop, uBot, uL; uniform vec3 uC0, uC1; varying vec3 vW; varying vec3 vC; varying float vY;\n" +
      "void main() { vec3 D = normalize(vW - cameraPosition); vec2 ph = vW.xz - vC.xz, Dh = D.xz; float R = max(length(ph), 1e-4), dh2 = dot(Dh, Dh);\n" +
      "float chord = dh2 < 1e-5 ? 10.0 * R : min(-2.0 * dot(ph, Dh) / dh2, 10.0 * R); if (chord <= 0.0) discard;\n" +
      "float a = 1.0 - exp(-uD * chord / (2.0 * R)); float e = clamp(chord * sqrt(dh2) / (2.0 * R), 0.0, 1.0);\n" +
      "float d = -vY; a *= uA * smoothstep(0.0, uTop, d) * (1.0 - 0.45 * smoothstep(uL - uBot, uL, d));\n" +
      "float streak = 0.88 + 0.12 * sin(atan(ph.y, ph.x) * 17.0 + vY * 0.9) * sin(atan(ph.y, ph.x) * 5.0 - vY * 0.35); a *= streak; if (a < 0.002) discard;\n" +
      "gl_FragColor = vec4(mix(uC0, uC1, e * e * e * 0.8), a); }",
  });
  m.userData.noOutline = true; return m;
}

// ================================================================================================================ the kind
export const AT_D_HATCH_KINDS = {
  hatchhall(P) {
    const S = P.spec, root = new THREE.Group(); P.whole.add(root);
    const seed = 1;
    // ---------- materials
    const hullPal = { base: ["#39424b", "#434e59"], seam: "#171c21", hi: "#7d8c9a", rivet: "#9aa7b3", wet: "#a8cde0", stain: "#16201c" };
    const whitePal = { base: ["#8fa0b2", "#7f91a5"], seam: "#47566a", hi: "#c5d4e2", rivet: "#b4c3d2", wet: "#a8c8e0", stain: "#3a4a44" };
    const BANDS = [[5.7, 8.2, 3072, 256], [8.2, 11.5, 3072, 320], [11.5, 15.5, 3072, 360], [15.5, 20, 3072, 300], [20, 28, 3072, 480], [28, 38, 3072, 560], [38, 52, 2048, 560]];
    const bandMats = BANDS.map(([r0, r1, W, H], i) => {
      const rm = (r0 + r1) / 2, white = r0 >= 20, map = once(`hh-band${i}`, () => tex(paintPlates(W, H, TAU * rm, r1 - r0, 10 + i, white ? whitePal : hullPal, { pw: white ? 3.4 : 2.7, rowH: (r1 - r0) / Math.max(1, Math.round((r1 - r0) / (white ? 3.4 : 2.6))), stains: white ? 90 : 60, band: r0 === 28 ? [0.3, 0.52, "#d9682a", "#7a3a14"] : null })));
      return mkMat("#ffffff", { map, emissive: new THREE.Color(white ? "#26364a" : "#1e2c3c"), emissiveMap: map, emissiveIntensity: white ? 0.42 : 0.6, roughness: 0.65, metalness: 0.15 });
    });
    const tubeMap = once("hh-tube", () => tex(paintTube(3)));
    const tubeM = mkMat("#ffffff", { map: tubeMap, emissive: new THREE.Color("#3a3a30"), emissiveMap: tubeMap, emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.2 });
    const orangeM = mkMat("#d9682a", { emissive: new THREE.Color("#7a3010"), emissiveIntensity: 0.55, roughness: 0.55 });
    const steelM = mkMat("#aab4b6", { emissive: new THREE.Color("#b8b090"), emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.5 });
    const darkM = mkMat("#34383d", { emissive: new THREE.Color("#222a30"), emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.2 });
    const creamM = mkMat("#efe0b8", { emissive: new THREE.Color("#c8a468"), emissiveIntensity: 0.55, roughness: 0.75 });
    const ribM = mkMat("#d8c18b", { emissive: new THREE.Color("#b08a4a"), emissiveIntensity: 0.5, roughness: 0.7 });
    const woodM = mkMat("#8a5a30", { emissive: new THREE.Color("#7a4a1c"), emissiveIntensity: 0.55, roughness: 0.5 });
    const bayMats = [0, 1, 2, 3, 4].map((k) => { const map = once(`hh-bay${k}`, () => tex(paintBay(k, 5 + k))); return mkMat("#ffffff", { map, emissive: new THREE.Color("#e0b878"), emissiveMap: map, emissiveIntensity: 0.62, roughness: 0.8 }); });
    const ceilMap = once("hh-ceil", () => tex(paintCeiling(2)));
    const ceilM = mkMat("#ffffff", { map: ceilMap, emissive: new THREE.Color("#e8c07e"), emissiveMap: ceilMap, emissiveIntensity: 0.62, roughness: 0.8 });
    const deckMap = once("hh-deck", () => tex(paintDeck(4)));
    const deckM = mkMat("#ffffff", { map: deckMap, emissive: new THREE.Color("#d0a868"), emissiveMap: deckMap, emissiveIntensity: 0.38, roughness: 0.8 });
    const leatherMap = once("hh-leather", () => tex(paintLeather(false, 2))), leatherMapE = once("hh-leatherE", () => tex(paintLeather(true, 3)));
    const seatM = mkMat("#ffffff", { map: leatherMap, emissive: new THREE.Color("#d8b070"), emissiveMap: leatherMap, emissiveIntensity: 0.6, roughness: 0.55 });
    const seatME = mkMat("#ffffff", { map: leatherMapE, emissive: new THREE.Color("#e0b070"), emissiveMap: leatherMapE, emissiveIntensity: 0.72, roughness: 0.55 });
    const lampM = new THREE.MeshBasicMaterial({ color: "#ffe2a8", toneMapped: false }); lampM.userData.noOutline = true;
    const lensM = new THREE.MeshBasicMaterial({ color: "#9fded6", toneMapped: false }); lensM.userData.noOutline = true;
    const scrMap = once("hh-scr", () => tex(paintScreen(1))), scrM = new THREE.MeshBasicMaterial({ map: scrMap, toneMapped: false }); scrM.userData.noOutline = true;
    const add = (geo, m, order) => { const me = lookOnly(new THREE.Mesh(geo, m), { order }); root.add(me); return me; };

    // ---------- the hull underside, band by band, and the collar
    BANDS.forEach(([r0, r1], i) => add(polarGeo(r0, r1, Math.max(2, Math.round((r1 - r0) / 1.5)), 144, yUnder), bandMats[i]));
    const B = new Bin();
    // the hull's far edge: a rounded lip at r 52 so the hull ends cleanly
    // collar: outer wall (r 5.7, 0.5 down), its bottom ring with the orange lip, the tube wall inside
    add(wallGeo(C_R, U_Y - 0.5, U_Y, 96), bandMats[0]);
    add(polarGeo(HR + 0.2, C_R, 3, 96, () => U_Y - 0.5), bandMats[0]);
    add(polarGeo(HR, HR + 0.2, 2, 96, () => U_Y - 0.5), orangeM);
    add(wallGeo(HR, U_Y - 0.5, 0, 96, 0, TAU, 2), tubeM);
    // raised ring ribs on the underside (real 3D seams), thin flat tori
    for (const rr of [6.4, 8.2, 10.0, 12.2, 14.4, 16.7, 19.2]) B.add("dark", new THREE.TorusGeometry(rr, 0.045, 5, 128), xf(0, U_Y - 0.03, 0, 0, Math.PI / 2));
    // the orange lip's step: a bolted ring of heads around the collar's bottom
    for (let k = 0; k < 72; k++) { const a = (k / 72) * TAU, r = HR + 0.1; B.add("steel", new THREE.CylinderGeometry(0.03, 0.035, 0.04, 8), xf(Math.cos(a) * r, U_Y - 0.52, Math.sin(a) * r)); }
    for (let k = 0; k < 24; k++) { const a = ((k + 0.5) / 24) * TAU; B.box("dark", 0.5, 0.06, 0.18, Math.cos(a) * 5.15, U_Y - 0.53, Math.sin(a) * 5.15, -(a + Math.PI / 2)); }   // brackets on the collar's face
    // ---------- the three lit lenses r 1.2
    const lensGlass = [];
    for (const [r, d] of LENS) {
      const a = d * DEG, x = Math.cos(a) * r, z = Math.sin(a) * r;
      B.add("dark", new THREE.CylinderGeometry(1.5, 1.6, 0.3, 32), xf(x, U_Y - 0.15, z));
      B.add("steel", new THREE.TorusGeometry(1.32, 0.09, 8, 32), xf(x, U_Y - 0.32, z, 0, Math.PI / 2));
      for (let k = 0; k < 16; k++) { const b = (k / 16) * TAU; B.add("steel", new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8), xf(x + Math.cos(b) * 1.45, U_Y - 0.31, z + Math.sin(b) * 1.45)); }
      const gg = new THREE.CircleGeometry(1.2, 40); gg.rotateX(Math.PI / 2); gg.translate(x, U_Y - 0.325, z); add(gg, lensM);
      for (let k = 1; k <= 3; k++) { const ring = new THREE.Mesh(new THREE.RingGeometry(0.34 * k - 0.025, 0.34 * k, 40), new THREE.MeshBasicMaterial({ color: "#2e6a66", toneMapped: false, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); ring.material.userData.noOutline = true; ring.rotation.x = Math.PI / 2; ring.position.set(x, U_Y - 0.33, z); lookOnly(ring); root.add(ring); }
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("150,235,225"), transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false, blending: THREE.AdditiveBlending })); halo.material.userData.noOutline = true; halo.scale.setScalar(6.4); halo.position.set(x, U_Y - 0.9, z); lookOnly(halo, { order: 7 }); halo.userData.lens = true; root.add(halo); lensGlass.push(halo);
    }
    const weeds = [];
    // ---------- the deck, the wall bays, the columns, the ceiling
    add(polarGeo(HR, WALL, 4, 128, () => 0), deckM);
    add(polarGeo(HR - 0.3, HR, 1, 96, () => -0.28), darkM);   // never seen: the deck's thick edge is the tube wall; harmless
    const bayGeos = [[], [], [], [], []], nBay = 24;
    const kindOfBay = (i) => (i === 1 ? 1 : i === 5 || i === 17 ? 2 : i % 4 === 3 ? 3 : i % 6 === 2 ? 4 : 0);
    for (let i = 0; i < nBay; i++) { const k = kindOfBay(i), a0 = (i / nBay) * TAU, a1 = ((i + 1) / nBay) * TAU; bayGeos[k].push(clean(wallGeo(WALL, 0, CEIL, 6, a0, a1, 1))); }
    bayGeos.forEach((l, k) => { if (l.length) add(mergeGeometries(l), bayMats[k]); });
    add(polarGeo(0.01, WALL, 6, 128, () => CEIL), ceilM);
    // columns, gussets, girders, ring girders, ceiling lamps
    for (let i = 0; i < nBay; i++) {
      const a = (i / nBay) * TAU, x = Math.cos(a) * (WALL - 0.3), z = Math.sin(a) * (WALL - 0.3), ry = -(a + Math.PI / 2);
      B.box("rib", 0.6, CEIL, 0.5, x, CEIL / 2, z, ry); B.box("steel", 0.72, 0.12, 0.62, x, 1.3, z, ry); B.box("steel", 0.72, 0.12, 0.62, x, 5.5, z, ry); B.box("steel", 0.72, 0.18, 0.62, x, CEIL - 0.1, z, ry);
      for (const y of [0.6, 2.4, 4.2, 6.0, 7.8]) for (const s of [-1, 1]) B.cyl("steel", 0.026, 0.026, 0.05, x + Math.cos(a + Math.PI / 2) * 0.24 * s * 0 - Math.cos(a) * 0.26, y, z - Math.sin(a) * 0.26, 0, Math.PI / 2, 0, 6);   // bolt heads (small)
      const gx = Math.cos(a) * (WALL - 1.5), gz = Math.sin(a) * (WALL - 1.5);   // a diagonal brace from the column up to the ceiling girder (curved look)
      B.rod("rib", [x, CEIL - 3.0, z], [Math.cos(a) * (WALL - 2.8), CEIL - 0.3, Math.sin(a) * (WALL - 2.8)], 0.17, 8);
      B.rod("rib", [x, CEIL - 1.6, z], [Math.cos(a) * (WALL - 1.9), CEIL - 0.3, Math.sin(a) * (WALL - 1.9)], 0.12, 8); void gx; void gz;
    }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.13, rm = 8.4, ry = -(a + Math.PI / 2) + Math.PI / 2; B.box("rib", 11.2, 0.55, 0.55, Math.cos(a) * rm, CEIL - 0.28, Math.sin(a) * rm, a === 0 ? 0 : -a); void ry; }
    for (const rr of [4.6, 8.2, 11.4]) { const n = 48; for (let k = 0; k < n; k++) { const a = ((k + 0.5) / n) * TAU, len = (TAU * rr) / n + 0.06; B.box("rib", len, 0.42, 0.45, Math.cos(a) * rr, CEIL - 0.22, Math.sin(a) * rr, -(a + Math.PI / 2)); } }
    const lamps = [];
    [[5.6, 8, 0.0], [9.8, 12, 0.13], [12.6, 16, 0.07]].forEach(([rr, n, o], q) => { for (let k = 0; k < n; k++) { const a = (k / n) * TAU + o, x = Math.cos(a) * rr, z = Math.sin(a) * rr, ry = -(a + Math.PI / 2); B.box("rib", 2.3, 0.1, 0.9, x, CEIL - 0.06, z, ry); lamps.push([x, z, ry, q]); } });
    // pipes: two ring runs at the wall, with clamps
    for (const y of [2.6, 6.7]) for (let k = 0; k < 96; k++) { const a0 = (k / 96) * TAU, a1 = ((k + 1) / 96) * TAU, r = WALL - 0.12; B.rod("pipe", [Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r], y > 5 ? 0.1 : 0.07, 6); if (k % 4 === 0) B.box("steel", 0.16, 0.26, 0.16, Math.cos(a0) * (r + 0.02), y, Math.sin(a0) * (r + 0.02), -(a0 + Math.PI / 2)); }
    // consoles along the wall: a sloped desk, a screen, a stool-less panel; and wall lamps on the columns
    const consoles = [[118, 0], [146, 1], [-112, 0], [-146, 1], [-176, 0], [176, 1]];
    consoles.forEach(([d, v], q) => {
      const a = d * DEG, r = WALL - 0.95, x = Math.cos(a) * r, z = Math.sin(a) * r, ry = seatYaw(a);
      B.add("cream", new RoundedBoxGeometry(1.7, 0.95, 0.8, 2, 0.05), xf(x, 0.48, z, ry)); B.add("steel", new THREE.BoxGeometry(1.74, 0.06, 0.84), xf(x, 0.97, z, ry));
      const sx = x - Math.cos(a) * 0.22, sz = z - Math.sin(a) * 0.22; B.add("dark", new THREE.BoxGeometry(1.2, 0.72, 0.07), xf(sx, 1.38, sz, ry, -0.18)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.62), scrM); sc.position.set(sx + Math.cos(a) * 0.045, 1.38 + 0.008, sz + Math.sin(a) * 0.045); sc.rotation.set(-0.18, ry, 0, "YXZ"); lookOnly(sc); root.add(sc);
      for (let k = 0; k < 6; k++) B.box(k % 3 === 0 ? "orange" : "dark", 0.1, 0.03, 0.08, x + Math.cos(a + Math.PI / 2) * (-0.5 + k * 0.2) * 1 + Math.cos(a) * 0.14, 0.99, z + Math.sin(a + Math.PI / 2) * (-0.5 + k * 0.2) + Math.sin(a) * 0.14, ry); void v; void q;
    });
    // ---------- the rail round the right half (x > 0), the curb, the posts
    const RR = HR + 0.2;
    for (let k = 0; k <= 24; k++) {
      const th = (-90 + (k * 180) / 24) * DEG, x = Math.cos(th) * RR, z = Math.sin(th) * RR;
      B.cyl("steel", 0.035, 0.04, 1.0, x, 0.5, z, 0, 0, 0, 8); B.add("steel", new THREE.SphereGeometry(0.05, 8, 6), xf(x, 1.02, z)); B.cyl("dark", 0.09, 0.1, 0.05, x, 0.03, z, 0, 0, 0, 10);
      if (k < 24) { const t2 = (-90 + ((k + 1) * 180) / 24) * DEG, x2 = Math.cos(t2) * RR, z2 = Math.sin(t2) * RR; B.rod("steel", [x, 1.0, z], [x2, 1.0, z2], 0.03, 6); B.rod("steel", [x, 0.52, z], [x2, 0.52, z2], 0.024, 6); B.rod("steel", [x, 0.25, z], [x2, 0.25, z2], 0.018, 6); }
    }
    for (let k = 0; k < 60; k++) { const th = (k / 60) * TAU, t0 = th * 1; void t0; B.box("orange", (TAU * (HR + 0.1)) / 60 + 0.02, 0.16, 0.2, Math.cos(th) * (HR + 0.07), 0.08, Math.sin(th) * (HR + 0.07), -(th + Math.PI / 2)); }   // the curb at the lip
    // ---------- seats
    const seatPos = [];
    SEATS.forEach(([r, d, kind], i) => {
      const th = d * DEG, x = Math.cos(th) * r, z = Math.sin(th) * r, ry = seatYaw(th), key = kind ? "seatE" : "seat", arm = kind ? "wood" : "rib";
      seatPos.push([x, z, ry, kind]);
      const L = (lx, ly, lz) => { const c = Math.cos(ry), s = Math.sin(ry); return [x + lx * c + lz * s, ly, z - lx * s + lz * c]; };   // local (x right, z front) to world
      B.add("steel", new THREE.CylinderGeometry(0.3, 0.34, 0.04, 20), xf(x, 0.02, z)); B.cyl("steel", 0.06, 0.08, 0.34, x, 0.2, z, 0, 0, 0, 10); B.cyl("dark", 0.14, 0.1, 0.06, x, 0.36, z, 0, 0, 0, 12);
      let [px, , pz] = L(0, 0, 0.0); B.add(key, new RoundedBoxGeometry(0.64, 0.13, 0.6, 3, 0.05), xf(px, SEAT_TOP - 0.065, pz, ry));
      [px, , pz] = L(0, 0, -0.27); B.add(key, new RoundedBoxGeometry(0.62, 0.6, 0.12, 3, 0.05), xf(px, SEAT_TOP + 0.37, pz, ry, -0.12));
      [px, , pz] = L(0, 0, -0.31); B.add(key, new RoundedBoxGeometry(0.5, 0.2, 0.1, 3, 0.04), xf(px, SEAT_TOP + 0.74, pz, ry, -0.12));
      for (const s of [-1, 1]) { [px, , pz] = L(s * 0.37, 0, 0.02); B.add(arm, new RoundedBoxGeometry(0.08, 0.06, 0.5, 2, 0.02), xf(px, SEAT_TOP + 0.24, pz, ry)); [px, , pz] = L(s * 0.37, 0, 0.2); B.cyl("steel", 0.02, 0.02, 0.22, px, SEAT_TOP + 0.12, pz, 0, 0, 0, 6); [px, , pz] = L(s * 0.37, 0, -0.18); B.cyl("steel", 0.02, 0.02, 0.22, px, SEAT_TOP + 0.12, pz, 0, 0, 0, 6); }
    });
    // ---------- merge the bins into meshes
    const BINM = { dark: darkM, steel: steelM, rib: ribM, cream: creamM, orange: orangeM, pipe: mkMat("#c0b896", { emissive: new THREE.Color("#a08a5a"), emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.3 }), seat: seatM, seatE: seatME, wood: woodM };
    for (const key of B.m.keys()) { const g = B.merged(key); if (g) add(g, BINM[key]); }
    // ---------- lamp panels (unlit emissive) and wall lamps
    const LP = []; for (const [x, z, ry] of lamps) { const g = new THREE.PlaneGeometry(1.9, 0.62); g.rotateX(Math.PI / 2); g.applyMatrix4(xf(x, CEIL - 0.13, z, ry)); LP.push(clean(g)); }
    const lampMesh = add(mergeGeometries(LP), lampM);
    // ---------- the beam, bubbles, pool, mist, foam
    const bLen = BEAM.top - SEA_Y;
    const bGeo = new THREE.CylinderGeometry(BEAM.r, BEAM.r, bLen, 48, 1, true); bGeo.translate(0, -bLen / 2, 0);
    const bm = beamMaterial(0.62, 1.8, 1.2, bLen); const beamMesh = lookOnly(new THREE.Mesh(bGeo, bm), { steam: true, order: 5 }); beamMesh.position.set(BEAM.x, BEAM.top, 0); root.add(beamMesh);
    const bubs = [];
    for (let k = 0; k < 80; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(), transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); sp.material.userData.noOutline = true; lookOnly(sp, { steam: true, order: 6 }); root.add(sp);
      const r = (q) => rnd(k * 17 + q); bubs.push({ sp, rr: (BEAM.r - 0.25) * Math.sqrt(r(1)), a0: r(2) * TAU, y0: r(3) * bLen, v: 0.7 + 1.2 * r(4), sz: 0.07 + 0.2 * r(5) ** 2, ph: r(6) * TAU, w: 0.6 + 0.7 * r(7) });
    }
    const poolM = new THREE.MeshBasicMaterial({ map: glowTex("150,245,230"), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, blending: THREE.AdditiveBlending }); poolM.userData.noOutline = true;
    poolM.side = THREE.DoubleSide; const pool = lookOnly(new THREE.Mesh(new THREE.PlaneGeometry(9, 9), poolM), { order: 4 }); pool.rotation.x = -Math.PI / 2; pool.position.set(BEAM.x, SEA_Y + 0.3, 0); root.add(pool);
    const foamM = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); foamM.userData.noOutline = true; foamM.side = THREE.DoubleSide;
    const foam = lookOnly(new THREE.Mesh(new THREE.PlaneGeometry(7.6, 7.6), foamM), { order: 5 }); foam.rotation.x = -Math.PI / 2; foam.position.set(BEAM.x, SEA_Y + 0.34, 0); root.add(foam);
    const mist = [];
    for (let k = 0; k < 16; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("200,238,235"), transparent: true, depthWrite: false, opacity: 0.2, toneMapped: false })); sp.material.userData.noOutline = true; lookOnly(sp, { steam: true, order: 6 }); root.add(sp); mist.push({ sp, a0: rnd(k + 70) * TAU, rr: 1.2 + 2.6 * rnd(k + 71), y: SEA_Y + 0.7 + 1.1 * rnd(k + 72), sz: 3 + 3 * rnd(k + 73), w: 0.05 + 0.08 * rnd(k + 74), ph: rnd(k + 75) * TAU }); }
    // lens light spots on the water
    const spots = [];
    for (const [r, d] of LENS) { const a = d * DEG, m = new THREE.MeshBasicMaterial({ map: glowTex("120,230,215"), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, blending: THREE.AdditiveBlending }); m.userData.noOutline = true; m.side = THREE.DoubleSide; const sp = lookOnly(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), { order: 4 }); sp.rotation.x = -Math.PI / 2; sp.scale.set(11, 11, 1); sp.position.set(Math.cos(a) * r, SEA_Y + 0.16, Math.sin(a) * r); root.add(sp); spots.push(sp); }
    // falling drips off the collar and lenses: short bright strokes that fall on the clip clock
    const DR = 60, dPos = new Float32Array(DR * 6), dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const drips = []; for (let k = 0; k < DR; k++) { const a = rnd(k + 800) * TAU, r = k % 3 === 0 ? 1.6 * Math.sqrt(rnd(k + 801)) : C_R + 4 * rnd(k + 801); const lc = LENS[k % 3], cx = k % 3 === 0 ? Math.cos(lc[1] * DEG) * lc[0] : 0, cz = k % 3 === 0 ? Math.sin(lc[1] * DEG) * lc[0] : 0; drips.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y0: rnd(k + 802) * 8, v: 4 + 3 * rnd(k + 803), len: 0.35 + 0.5 * rnd(k + 804) }); }
    const dripM = new THREE.LineBasicMaterial({ color: "#b8d8ea", transparent: true, opacity: 0.7, toneMapped: false }); dripM.userData.noOutline = true; const dripL = lookOnly(new THREE.LineSegments(dGeo, dripM), { order: 7 }); root.add(dripL);
    // ---------- the lights: warm hall, warm over the seats, turquoise in the beam
    const hallL = new THREE.PointLight("#ffd49a", 0, 30, 1.2); hallL.position.set(0, 6.5, 0); root.add(hallL);
    const deckL = new THREE.PointLight("#ffc98a", 0, 12, 1.3); deckL.position.set(4.4, 2.8, 0); root.add(deckL);
    const beamL = new THREE.PointLight("#6fe6d6", 0, 10, 1.3); beamL.position.set(BEAM.x, -4.2, 0.6); root.add(beamL);
    const warmUp = new THREE.PointLight("#ffd9a8", 0, 8, 1.4); warmUp.position.set(-1.5, 0.6, 0); root.add(warmUp);   // warm light from the hall onto whoever rides up the beam
    void seatPos; void lensGlass;
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, lit = clamp(ps.lit > 0 ? ps.lit : (S.lit ?? 1)), bmA = smooth(num(ps, S, "beam", 1));
        lampM.color.setRGB(1, 0.885, 0.66).multiplyScalar(0.25 + 0.75 * lit);
        lensM.color.set("#2e4846").lerp(new THREE.Color("#9fded6"), clamp(lit / 0.6)).lerp(new THREE.Color("#c4f4ec"), clamp((lit - 0.6) / 0.4));
        lensGlass.forEach((o) => { if (o.userData.lens) o.material.opacity = 0.5 * lit; });
        hallL.intensity = 26 * lit; deckL.intensity = 14 * lit; warmUp.intensity = 8 * lit; beamL.intensity = 16 * bmA;
        bm.uniforms.uA.value = bmA; beamMesh.visible = bmA > 0.003; pool.visible = foam.visible = bmA > 0.003; poolM.opacity = 0.85 * bmA; foamM.opacity = 0.95 * bmA; beamL.visible = bmA > 0.003;
        for (const b of bubs) {
          b.sp.visible = bmA > 0.003; const d = (((b.y0 + b.v * tt) % bLen) + bLen) % bLen, y = SEA_Y + d, edge = smooth(Math.min(d, bLen - d) / 1.5), ang = b.a0 + 0.2 * tt * b.w;
          b.sp.position.set(BEAM.x + Math.cos(ang) * b.rr + 0.12 * Math.sin(tt * b.w * 2 + b.ph), y, Math.sin(ang) * b.rr); b.sp.scale.setScalar(b.sz); b.sp.material.opacity = bmA * edge * 0.9;
        }
        for (const m of mist) { const a = m.a0 + m.w * tt; m.sp.position.set(BEAM.x + Math.cos(a) * m.rr, m.y + 0.12 * Math.sin(tt * 0.5 + m.ph), Math.sin(a) * m.rr); m.sp.scale.setScalar(m.sz); m.sp.material.opacity = 0.16 * bmA; }
        spots.forEach((sp, i) => { sp.material.opacity = 0.5 * lit * (0.9 + 0.1 * Math.sin(tt * 0.9 + i * 2)); });
        weeds.forEach((w) => { w.m.rotation.x = 0.1 * Math.sin(tt * 0.8 + w.ph); w.m.rotation.z = 0.08 * Math.sin(tt * 0.6 + w.ph * 2); });
        for (let k = 0; k < DR; k++) { const d = drips[k], fall = ((d.y0 + d.v * tt) % 8.2 + 8.2) % 8.2, y = U_Y - 0.6 - fall; dPos.set([d.x, y, d.z, d.x, y - d.len, d.z], k * 6); }
        dGeo.attributes.position.needsUpdate = true; void lampMesh;
      },
    };
  },
};
