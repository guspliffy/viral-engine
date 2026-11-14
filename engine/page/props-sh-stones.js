// Ancient aliens EP02 Stonehenge kit (stones, 14 Nov 2026): the stones of Stonehenge, new (2500 BC) and as today's ruin, plus the
// single real-scale stones for close shots. Design: storyboards/series/ancient-aliens/02-stonehenge/kit/BOARD.md (axes and sun
// section 1, palette 2, sizes 3). Bench: storyboards/series/ancient-aliens/02-stonehenge/kit/bench (make-sh-stones.mjs,
// sh-stones-sheet.png). Metres. World axes: the monument's axis is z, +z north-east (entrance, Heel Stone, the default camera
// side), -z south-west (the sunset), +x screen right from the default camera, up +y. Origin of a piece = bottom centre unless said;
// a stone's front is its local +z. Everything is hand-drawn: the stone faces come from hand-drawn sheets (every ripple, pit, crack,
// lichen patch and mica fleck is its own mark from a hash of its index; each face takes its own random window of the sheet, so
// there is no tiling), the edges are chipped and rounded as geometry. No Math.random, no wall clock. Nothing here is lit by the scene's
// light: like the pilot's pyramids the stones are UNLIT materials with the sun baked into their vertex colours (spec.sunAz, spec.sunEl,
// spec.sunColor: faces toward the sun warm and bright, the others cool shade), and each stone's long soft shadow is a ground decal
// (canvas, away from the sun, length height / tan(sunEl), capped at 40 m) 4 cm over y 0. Nothing casts a shadow-map shadow. Every mesh is
// userData.lookOnly (no contact oval, no hand ray); only the standable tops say userData.solid true.
//
// COMMON spec keys of every kind (default): sunAz 14, sunEl 6.5 (degrees as BOARD section 1: az degrees left of the axis toward -x, el
//   above the horizon), sunColor "#ffc66a", seed 1, shadow true (single kinds; the ground decal, drawn at world y 0 whatever the
//   prop's y: lift a prop and its shadow stays on the ground, away from it), dusk 0..1 (a PARAM, tween it: dims and cools the stone and
//   fades the decal).  The decal covers +-42 m round the prop (singles) or +-64 m (stonehenge) and turns against the prop's `rot`, so
//   the shadows always point away from the sun in the world.
//
//   stonehenge  the whole monument at real scale, origin the circle's centre on the ground, laid out as BOARD section 3.
//               spec.era "new" (default): pale freshly dressed sarsen, all 30 uprights (2.1 x 4.1 x 1.1, two knobs each) + 30 top stones
//                 (curved, ring top 4.9, holes + ridge + groove), five giant pairs, 60 outer + 19 inner bluestones, the Altar Stone;
//                 fine parallel tool-dressing ripples on every face, crisp edges. | "today": the ruin of BOARD section 3 (17 uprights stand,
//                 8 lie sunk in the turf with a grass fringe, 5 are gone; six top stones; pairs 51-52, 53-54, 57-58 complete, Stone 56 alone
//                 leaning 3 deg with one knob, 55 broken in two across the Altar Stone (buried 0.6) with the pair's top stone beside it,
//                 60 alone, 59 in three pieces; bluestone stumps and pillars, 6 inner pillars; the Slaughter Stone flat at (0, 44)).
//                 Stone 11 is the half-width 2.4 m one. Weathered grey, lichen, pitting, rounded edges.
//               built 0..1 (PARAM, spec.built is its start value, default 1): puts the monument up in story order: the Altar Stone, then the
//                 giant pairs (0-0.2: each pair upright, upright, top stone), circle uprights 1..30 clockwise (0.2-0.7), top stones 1..30
//                 (0.7-0.95), bluestones (0.95-1; outer ring, then inner oval); a stone not yet built is absent (and so is its shadow).
//                 Item k of N in a stage appears when built >= start + span * k / N. Each stone is built whole: lower a single
//                 `sarsen` / `toplintel` into the gap yourself.
//               spec.gap [n...] leaves top stones off (n 1..30: the one resting on uprights n and n+1; 30 rests on 30 and 1),
//               spec.gapUprights [n...] leaves uprights off. spec.slope (0): the ground falls by this many metres from x -15.5 to
//               +15.5 (linear in x, 0 at x -15.5); uprights, giants and bluestones reach down to it, every top stays at its level height;
//               the shadow decal follows it. spec.sunAz / sunEl / sunColor / dusk as above (dusk is a param).
//               Standable (solid, lookOnly): the ring's top stones (top y 4.9) and the giant pairs' top stones (top y h + 1.0: 6.0, 6.5,
//               7.7, 6.5, 6.0). Nothing else is solid. Triangles: about 150k.
//               Export SH_STONES_PARTS (below) for the director's helpers.
//   sarsen      ONE upright for close work, origin bottom centre, facing +z. spec.size [2.1, 4.1, 1.1] (w, h, d), spec.look "new" (default)
//               | "today", spec.knobs 2 (0 | 1 | 2 round knobs r 0.16, 0.16 high, x +-0.5 on its top; 1 puts one at x 0),
//               spec.under 0 (metres of extra stone below y 0: a stone sinking into a pit shows its buried part), spec.seed.
//               SOLID, top standable at y h (plus the knob). Sides gently swelling, faces flat.
//   toplintel   ONE top stone, origin bottom centre (y 0 = its underside), front +z: spec.size [3.25, 0.8, 1.0] (L, H, W), spec.curve true
//               (bent to the r 15.5 ring: the ring centre is 15.5 m on +z; false = straight), two round holes r 0.17, 0.18 deep in its
//               underside at x +-1.125 (spec.holeX; they meet the knobs of the two neighbouring uprights: the lintel sits from the middle of
//               one upright to the middle of the next, so each upright's knobs are x +-0.5 from its middle), a vertical ridge on the -x end
//               and a matching groove on the +x end (0.12 wide, 0.08 proud / deep, the whole height; the ridge is outside spec.size L, so the
//               piece is 3.33 long; spec.ridge / spec.groove false drop them). spec.look, spec.seed. SOLID, top standable at y H.
//               Lintel n of the ring slides its ridge into the groove of lintel n+1 (+x is clockwise).
//   giantpair   one giant pair as one piece, origin the middle of its foot line, facing +z: two uprights 2.4 wide x 1.2 thick at x +-(1.2 +
//               slit / 2), spec.h 6.7 (their height above ground), spec.slit 0.5, a top stone 4.8 x 1.3 x 1.0 on them (y h..h+1.0);
//               spec.lintel false leaves the top stone off. spec.look. 2.4 m of the stone is underground (spec.under shows it). SOLID, the top
//               stone standable at y h + 1.0.
//   bluestone   ONE bluestone: spec.look "rough" (natural pillar, default) | "dressed" (squared pillar), spec.size [0.9, 1.8, 0.5] (w, h, d;
//               dressed default [0.6, 2.2, 0.6]), spec.era "new" | "today" (mossier, worn top), spec.seed. Spotted dolerite: dark blue-grey
//               with pale flecks drawn one by one. SOLID.
//   altarstone  the flat slab 4.9 x 0.5 x 1.0 (x long, size [4.9, 0.5, 1.0]), grey-green with tiny drawn mica flecks; spec.buried 0..1
//               (default 0; 0.6 for today: sunk by buried x 0.5 m into the turf, with a grass fringe), spec.look "new" | "today" (rounder
//               edges; today by itself once buried > 0.3). SOLID, top standable at y 0.5 (1 - buried).
//   heelstone   the rough leaning boulder of BOARD section 3, origin its bottom centre (the lean is in the stone: the top leans spec.lean
//               20 deg toward -z, toward the circle; place the prop at (1.6, 77)), 2.4 wide, about 4.7 along its axis, spec.era "new" | "today"
//               (lichen). SOLID.
//   fallensarsen a lying broken stone, long axis x, origin the middle of its length on the ground: spec.size [l, w, t] (4.7, 2.1, 1.1: lies on
//               its broad face, t high), spec.pieces 1 | 2 | 3 (broken across with jagged oblique ends, a few cm to 25 cm apart, slightly
//               turned), spec.sink 0.2 (fraction of t sunk in the turf, with a grass fringe), spec.look "today" (default) | "new", spec.seed.
//               SOLID, the top at t.
// PARAMS (seed with a dur-0 set at 0 when a clip animates them; each also reads spec.<name> as its start value): built, dusk. The
//   decals are redrawn only when what they show changes (a stone appears, dusk or the prop's rot / y moves).
// Colour on screen: lit faces take the stone colour times the warm sun, shade faces the BOARD shade times a cool blue: new #e6e0d2 / shade
//   #bdb6a6, today #8e8c86 / #63615d, bluestone #4f6170 (today #586a66), Altar Stone #9aa392.
// Look (fix round 1): no stone is a box. New: taper 93-97 %, entasis, arrises r 0.07, a 1-2 cm undulating surface, width +-8 % (ring stones). Today: taper
//   80-92 %, sides wandering 4-12 cm, arrises r 0.15-0.3, uneven tops (dome / slant / notch), a third with a hollow or broken corner, sagging top
//   stones, lumpy fallen stones, the Slaughter Stone 0.35 proud. The sun is painted on: lit faces and lit arrises glow warm (a rim as wide as the
//   arris), camera-side faces are cool blue-violet; contrast scales with sunEl (full below 7 deg, 0.35 at 16). Knobs r 0.16 (BOARD said 0.11, director's fix).
//   Sizes to know: The set's own floor / dome z-fights with itself in the bench (the plain set, not these stones).
// GRIPS: none (SH_STONES_GRIPS is empty: nothing here is held in a hand).
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180, RING = 15.5, TOP = 4.9;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${clamp(a).toFixed(3)})`; };
const runOf = (seed) => { let n = 0; return () => rnd(seed + (n++) * 1.6180339); };
function vnoise(x, y, z, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => rnd(a * 12.9898 + b * 78.233 + c * 37.719 + s * 4.581);
  const x00 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u), x10 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u);
  const x01 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), x11 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }

// ---------------------------------------------------------------------------------------------------------------
// the hand-drawn stone sheets: seamless (marks wrap round the border), 512 px per metre (the sarsen sheets 4 m across, the bluestone
// and Altar Stone sheets 2 m). Each stone face takes its own random window (offset, mirror) of the sheet.
const SHEETS = {}, SHEET_M = { new: 4, newrough: 4, today: 4, blue: 2, blueToday: 2, altar: 2 };
function stamp(W, x, y, r, fn) {   // run fn(ox, oy) at the mark's place and at every wrapped copy that its radius r reaches
  const xs = [0], ys = [0];
  if (x - r < 0) xs.push(W); if (x + r > W) xs.push(-W);
  if (y - r < 0) ys.push(W); if (y + r > W) ys.push(-W);
  for (const a of xs) for (const b of ys) fn(a, b);
}
function paintCommon(g, W, R, o) {   // washes, pits, cracks, specks shared by the sheets
  for (let i = 0; i < o.washes; i++) {
    const x = R() * W, y = R() * W, r = o.wr[0] + R() * o.wr[1], a = o.wa[0] + R() * o.wa[1], col = R() < o.darkP ? o.dark : o.light;
    stamp(W, x, y, r, (ox, oy) => { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); });
  }
  for (let i = 0; i < o.pits; i++) {   // a pit: a dark hollow with a pale lip on its lower side
    const x = R() * W, y = R() * W, r = o.pr[0] + R() * R() * o.pr[1], a = o.pa[0] + R() * o.pa[1], sq = 0.7 + 0.3 * R(), rot = R() * Math.PI;
    stamp(W, x, y, r + 2, (ox, oy) => {
      g.fillStyle = rgba(o.lip, a * 0.8); g.beginPath(); g.ellipse(x + ox + r * 0.35, y + oy + r * 0.55, r * 1.05, r * 0.8 * sq, rot, 0, TAU); g.fill();
      g.fillStyle = rgba(o.pit, a); g.beginPath(); g.ellipse(x + ox, y + oy, r, r * sq, rot, 0, TAU); g.fill();
    });
  }
  for (let i = 0; i < o.cracks; i++) {   // hairline cracks: a wandering line with a pale lip and a short branch
    let x = R() * W, y = R() * W, a = R() * TAU; const pts = [[x, y]], n = 10 + Math.floor(R() * 22), br = [];
    for (let k = 0; k < n; k++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * (7 + R() * 14); y += Math.sin(a) * (7 + R() * 14); pts.push([x, y]); if (R() < 0.14) br.push([k, a + (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.6), 20 + R() * 40]); }
    const wd = 0.9 + R() * 1.1, al = o.ca[0] + R() * o.ca[1];
    const draw = (ox, oy) => {
      g.lineCap = "round"; g.lineJoin = "round";
      for (const [col, dx, dy, w2, aa] of [[o.lip, 1.3, 1.3, wd * 0.8, al * 0.55], [o.crack, 0, 0, wd, al]]) { g.strokeStyle = rgba(col, aa); g.lineWidth = w2; g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px + ox + dx, py + oy + dy) : g.moveTo(px + ox + dx, py + oy + dy))); g.stroke(); }
      for (const [k, ba, bl] of br) { const [px, py] = pts[k]; g.strokeStyle = rgba(o.crack, al * 0.8); g.lineWidth = wd * 0.7; g.beginPath(); g.moveTo(px + ox, py + oy); g.lineTo(px + ox + Math.cos(ba) * bl, py + oy + Math.sin(ba) * bl * (0.8 + 0.4 * Math.sin(ba * 3))); g.stroke(); }
    };
    stamp(W, pts[0][0], pts[0][1], 460, draw);
  }
}
function paintStone(key) {
  const today = key === "today", rough = key === "newrough", W = 2048, [c, g] = canvas(W, W), R = runOf(today ? 211 : rough ? 151 : 101);
  g.fillStyle = today ? "#8e8c86" : rough ? "#d3cdbd" : "#ece4d0"; g.fillRect(0, 0, W, W);
  paintCommon(g, W, R, today
    ? { washes: 120, wr: [90, 330], wa: [0.07, 0.13], darkP: 0.55, dark: "#34322e", light: "#b0ac9f", pits: 1500, pr: [1.2, 9], pa: [0.3, 0.4], pit: "#46443f", lip: "#bcb8ab", cracks: 24, ca: [0.5, 0.35], crack: "#2e2c28" }
    : { washes: 70, wr: [90, 330], wa: [0.045, 0.07], darkP: 0.45, dark: "#cfc9c4", light: "#f8eedb", pits: rough ? 900 : 380, pr: [1.2, 3.6], pa: [0.25, 0.3], pit: "#ac9f88", lip: "#faf7ee", cracks: rough ? 22 : 14, ca: [0.5, 0.3], crack: "#8a806c" });
  for (let i = 0; i < (today ? 9 : 7); i++) {   // bedding: a few wavy, broken bands (never a ruled grid)
    const y0 = R() * W, x0 = R() * W, len = 180 + R() * 520, th = 4 + R() * 14, a = (today ? 0.05 : 0.035) + R() * 0.05, ph = R() * 6, am = 3 + R() * 9, br = [R() * 0.5 + 0.2, R() * 0.2 + 0.05];
    stamp(W, x0, y0, len / 2 + 30, (ox, oy) => {
      g.strokeStyle = rgba(today ? "#3c3a36" : "#b8b09c", a); g.lineWidth = th; g.lineCap = "round"; g.beginPath();
      for (let k = 0; k <= 24; k++) { const u = k / 24; const gap = u > br[0] && u < br[0] + br[1]; const px = x0 + ox + u * len, py = y0 + oy + Math.sin(u * 7 + ph) * am; if (k === 0 || gap) { g.moveTo(px, py); if (gap) continue; } else g.lineTo(px, py); }
      g.stroke();
    });
  }
  if (!today && !rough) {   // 2-3 large soft warm and cool patches per face, then a few broad short tool strokes whose direction wanders from patch to patch
    for (let i = 0; i < 34; i++) {
      const x = R() * W, y = R() * W, r = 200 + R() * 420, warm = R() < 0.5, col = warm ? "#f0cc92" : "#aeb4d8", a = 0.22 + R() * 0.14;
      stamp(W, x, y, r, (ox, oy) => { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.6, rgba(col, a * 0.5)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); });
    }
    for (let i = 0; i < 46; i++) {
      const x = R() * W, y = R() * W, n = 3 + Math.floor(R() * 4), gap = 15 + R() * 10, len = 90 + R() * 150, ang = (R() - 0.5) * 0.9, a0 = 0.13 + R() * 0.1, wd = 6 + R() * 5, ca = Math.cos(ang), sa = Math.sin(ang);
      stamp(W, x, y, len / 2 + n * gap, (ox, oy) => { for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * gap + (R() - 0.5) * 4, px = x + ox - sa * off, py = y + oy + ca * off, l = len * (0.6 + 0.4 * R());
        g.lineCap = "round"; g.strokeStyle = rgba("#b3a78f", a0); g.lineWidth = wd; g.beginPath(); g.moveTo(px - ca * l / 2, py - sa * l / 2); g.lineTo(px + ca * l / 2, py + sa * l / 2); g.stroke();
        g.strokeStyle = rgba("#fffbef", a0 * 0.9); g.lineWidth = wd * 0.35; g.beginPath(); g.moveTo(px - ca * l / 2 - sa * wd * 0.6, py - sa * l / 2 + ca * wd * 0.6); g.lineTo(px + ca * l / 2 - sa * wd * 0.6, py + sa * l / 2 + ca * wd * 0.6); g.stroke();
      } });
    }
  }
  const patches = today ? 60 : 0;
  for (let i = 0; i < patches; i++) {   // tool-dressing ripples: bundles of fine parallel strokes
    const x = R() * W, y = R() * W, horiz = today ? R() < 0.7 : true, ang = (horiz ? 0 : Math.PI / 2) + (R() - 0.5) * 0.3, n = 6 + Math.floor(R() * 13), gap = 4.5 + R() * 3.5, len = 70 + R() * 230;
    const bow = (R() - 0.5) * 16, a0 = today ? 0.16 + R() * 0.14 : 0.4 + R() * 0.4, wd = 1.1 + R() * 1.4, lines = [];
    for (let k = 0; k < n; k++) lines.push({ off: (k - (n - 1) / 2) * gap + (R() - 0.5) * 1.4, l0: -len / 2 * (0.7 + 0.3 * R()), l1: len / 2 * (0.7 + 0.3 * R()), a: a0 * (0.6 + 0.4 * R()), b: bow * (0.7 + 0.6 * R()) });
    const ca = Math.cos(ang), sa = Math.sin(ang);
    stamp(W, x, y, len / 2 + (n * gap) / 2 + 14, (ox, oy) => {
      for (const L of lines) {
        const px = -sa * L.off, py = ca * L.off, x0 = x + ox + px + ca * L.l0, y0 = y + oy + py + sa * L.l0, x1 = x + ox + px + ca * L.l1, y1 = y + oy + py + sa * L.l1, mx = (x0 + x1) / 2 - sa * L.b, my = (y0 + y1) / 2 + ca * L.b;
        g.lineCap = "round"; g.lineWidth = wd; g.strokeStyle = today ? rgba("#3a3834", L.a * 0.6) : rgba("#b9b09a", L.a); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
        g.lineWidth = wd * 0.8; g.strokeStyle = rgba(today ? "#bdb9ad" : "#fffcf2", L.a * 0.5); g.beginPath(); g.moveTo(x0 - sa * 1.8, y0 + ca * 1.8); g.quadraticCurveTo(mx - sa * 1.8, my + ca * 1.8, x1 - sa * 1.8, y1 + ca * 1.8); g.stroke();
      }
    });
  }
  if (!today) {   // hammer-pecked patches: clusters of tiny dots
    for (let i = 0; i < 22; i++) {
      const x = R() * W, y = R() * W, r = 25 + R() * 55, n = 35 + Math.floor(R() * 60), d = [];
      for (let k = 0; k < n; k++) { const a = R() * TAU, q = r * Math.sqrt(R()); d.push([Math.cos(a) * q, Math.sin(a) * q * 0.8, 0.8 + R() * 1.4, 0.15 + R() * 0.25]); }
      stamp(W, x, y, r + 4, (ox, oy) => { for (const [dx, dy, rr, a] of d) { g.fillStyle = rgba("#a39a86", a); g.beginPath(); g.arc(x + ox + dx, y + oy + dy, rr, 0, TAU); g.fill(); } });
    }
  }
  for (let i = 0; i < (today ? 26 : 16); i++) {   // chips: a flaked-off bite, darker, a pale lip along its lower edge
    const x = R() * W, y = R() * W, s = 6 + R() * 15, n = 6 + Math.floor(R() * 3), pts = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU, f = 0.55 + 0.45 * R(); pts.push([Math.cos(a) * s * f * 1.3, Math.sin(a) * s * f * 0.8]); }
    stamp(W, x, y, s * 2, (ox, oy) => {
      g.fillStyle = rgba(today ? "#2e2c28" : "#a9a08c", 0.26); g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(x + ox + px, y + oy + py) : g.moveTo(x + ox + px, y + oy + py))); g.closePath(); g.fill();
      g.strokeStyle = rgba(today ? "#c9c5b8" : "#fffaf0", 0.45); g.lineWidth = 1.6; g.beginPath(); pts.slice(1, 4).forEach(([px, py], k) => (k ? g.lineTo(x + ox + px + 1.5, y + oy + py + 2) : g.moveTo(x + ox + px + 1.5, y + oy + py + 2))); g.stroke();
    });
  }
  for (let i = 0; i < (today ? 420 : 300); i++) {   // specks: pale quartz glints and dark grains
    const x = R() * W, y = R() * W, r = 0.7 + R() * 1.4, pale = R() < 0.55; g.fillStyle = rgba(pale ? (today ? "#d8d4c6" : "#fffcf0") : (today ? "#3a3834" : "#a49b88"), 0.35 + R() * 0.4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  if (today) {
    for (let i = 0; i < 90; i++) {   // rain streaks: thin dark runs of different length, a little off the vertical
      const x = R() * W, y = R() * W, len = 90 + R() * R() * 620, w = 2 + R() * 7, a = 0.06 + R() * 0.14, lean = (R() - 0.5) * 0.12;
      stamp(W, x, y, len, (ox, oy) => { const gr = g.createLinearGradient(0, y + oy, 0, y + oy + len); gr.addColorStop(0, rgba("#2c2a26", a)); gr.addColorStop(0.7, rgba("#2c2a26", a * 0.5)); gr.addColorStop(1, rgba("#2c2a26", 0)); g.fillStyle = gr; g.save(); g.translate(x + ox, y + oy); g.transform(1, 0, lean, 1, 0, 0); g.fillRect(-w / 2, 0, w, len); g.restore(); });
    }
    const clusters = Array.from({ length: 11 }, () => [R() * W, R() * W, 120 + R() * 220]);
    const spot = () => { if (R() < 0.22) return [R() * W, R() * W]; const [cx, cy, cr] = clusters[Math.floor(R() * clusters.length)], a = R() * TAU, d = cr * Math.sqrt(-2 * Math.log(Math.max(1e-6, R()))) * 0.5; return [(((cx + Math.cos(a) * d) % W) + W) % W, (((cy + Math.sin(a) * d * 0.8) % W) + W) % W]; };
    const lichen = (cx, cy, rad, col, rim, n, dotR) => {   // an irregular patch: a few overlapping sub-clusters of small rosettes, thinning toward the rim
      const dots = [], subs = [], ns = 2 + Math.floor(R() * 3);
      for (let k = 0; k < ns; k++) { const a = R() * TAU, d = k ? rad * 0.55 * R() : 0; subs.push([Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.8, rad * (k ? 0.35 + 0.4 * R() : 0.7 + 0.3 * R()), 0.6 + 0.4 * R()]); }
      for (let i = 0; i < n; i++) {
        const [sx, sy, sr, asp] = subs[Math.floor(R() * subs.length)], a = R() * TAU, d = sr * Math.pow(R(), 0.7);
        dots.push([sx + Math.cos(a) * d * 1.25, sy + Math.sin(a) * d * asp, dotR[0] + R() * dotR[1], (0.3 + R() * 0.5) * (1 - 0.5 * d / sr), R() < 0.3]);
      }
      stamp(W, cx, cy, rad * 1.8 + 10, (ox, oy) => {
        for (const [sx, sy, sr, asp] of subs) { g.fillStyle = rgba(col, 0.1); g.beginPath(); g.ellipse(cx + ox + sx, cy + oy + sy, sr * 1.1, sr * asp, 0.3, 0, TAU); g.fill(); }
        for (const [dx, dy, r, a, ring] of dots) { g.fillStyle = rgba(col, a); g.beginPath(); g.arc(cx + ox + dx, cy + oy + dy, r, 0, TAU); g.fill(); if (ring) { g.strokeStyle = rgba(rim, 0.3); g.lineWidth = 0.8; g.stroke(); } }
      });
    };
    for (let i = 0; i < 40; i++) lichen(...spot(), 16 + R() * 90, "#b9c2a0", "#5c6644", 120 + Math.floor(R() * 160), [1.6, 4.4]);
    for (let i = 0; i < 16; i++) lichen(...spot(), 10 + R() * 50, "#c98b4e", "#6e4220", 70 + Math.floor(R() * 110), [1.2, 3.4]);
    for (let i = 0; i < 32; i++) lichen(...spot(), 8 + R() * 44, "#e9e6d8", "#8a8676", 80 + Math.floor(R() * 120), [0.9, 2.6]);
    for (let i = 0; i < 10; i++) lichen(...spot(), 12 + R() * 44, "#4a5038", "#262a1c", 70 + Math.floor(R() * 90), [1.2, 3]);
  }
  return finishSheet(c, "stone");
}
function paintBlue(today) {
  const W = 1024, [c, g] = canvas(W, W), R = runOf(today ? 331 : 301);
  g.fillStyle = today ? "#586a66" : "#4f6170"; g.fillRect(0, 0, W, W);
  paintCommon(g, W, R, { washes: 50, wr: [50, 200], wa: [0.06, 0.12], darkP: 0.6, dark: "#36434f", light: "#6f8497", pits: 260, pr: [1, 3], pa: [0.3, 0.3], pit: "#2c3640", lip: "#86a0ae", cracks: 8, ca: [0.35, 0.3], crack: "#232c34" });
  for (let i = 0; i < 46; i++) {   // wet streaks
    const x = R() * W, y = R() * W, len = 80 + R() * 260, w = 2 + R() * 7, a = 0.1 + R() * 0.18;
    stamp(W, x, y, len, (ox, oy) => { const gr = g.createLinearGradient(0, y + oy, 0, y + oy + len); gr.addColorStop(0, rgba("#36434f", a)); gr.addColorStop(1, rgba("#36434f", 0)); g.fillStyle = gr; g.fillRect(x + ox - w / 2, y + oy, w, len); });
  }
  for (let i = 0; i < 6; i++) {   // quartz veins
    let x = R() * W, y = R() * W, a = R() * TAU; const pts = [[x, y]];
    for (let k = 0; k < 18; k++) { a += (R() - 0.5) * 0.7; x += Math.cos(a) * 12; y += Math.sin(a) * 12; pts.push([x, y]); }
    stamp(W, pts[0][0], pts[0][1], 260, (ox, oy) => { g.strokeStyle = rgba("#a9b7bb", 0.35); g.lineWidth = 1.4; g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy))); g.stroke(); });
  }
  for (let i = 0; i < 1250; i++) {   // the pale feldspar spots, one by one: a dark halo, the spot, a bright core
    const x = R() * W, y = R() * W, r = 1.2 + R() * R() * 4.6, sq = 0.55 + 0.45 * R(), rot = R() * Math.PI, a = 0.6 + 0.4 * R(), n = R() < 0.25 ? 2 + Math.floor(R() * 2) : 1, offs = [];
    for (let k = 0; k < n; k++) offs.push([(R() - 0.5) * r * 2.4, (R() - 0.5) * r * 2.4, r * (0.55 + 0.45 * R())]);
    stamp(W, x, y, r * 4, (ox, oy) => { for (const [dx, dy, rr] of offs) {
      g.fillStyle = rgba("#222d38", 0.35 * a); g.beginPath(); g.ellipse(x + ox + dx, y + oy + dy, rr + 1.3, rr * sq + 1.3, rot, 0, TAU); g.fill();
      g.fillStyle = rgba("#c9d2d0", a); g.beginPath(); g.ellipse(x + ox + dx, y + oy + dy, rr, rr * sq, rot, 0, TAU); g.fill();
      if (rr > 2.2) { g.fillStyle = rgba("#eef3f1", 0.5 * a); g.beginPath(); g.ellipse(x + ox + dx - rr * 0.15, y + oy + dy - rr * 0.15, rr * 0.5, rr * sq * 0.5, rot, 0, TAU); g.fill(); }
    } });
  }
  for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * W, r = 0.6 + R() * 1.2; g.fillStyle = rgba("#1f2831", 0.4 + R() * 0.4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  if (today) {   // a little moss and pale lichen
    for (let i = 0; i < 34; i++) {
      const cx = R() * W, cy = R() * W, rad = 8 + R() * 34, col = R() < 0.7 ? "#6f8157" : "#a9b48f", dots = [];
      for (let k = 0; k < 40 + Math.floor(R() * 70); k++) { const a = R() * TAU, d = rad * Math.sqrt(R()); dots.push([Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.8, 1.2 + R() * 3, 0.4 + R() * 0.5]); }
      stamp(W, cx, cy, rad * 1.5 + 6, (ox, oy) => { for (const [dx, dy, r, a] of dots) { g.fillStyle = rgba(col, a); g.beginPath(); g.arc(cx + ox + dx, cy + oy + dy, r, 0, TAU); g.fill(); } });
    }
  }
  return finishSheet(c, "blue");
}
function paintAltar() {
  const W = 1024, [c, g] = canvas(W, W), R = runOf(401);
  g.fillStyle = "#9aa392"; g.fillRect(0, 0, W, W);
  paintCommon(g, W, R, { washes: 50, wr: [60, 220], wa: [0.05, 0.1], darkP: 0.5, dark: "#7c8574", light: "#b9c1ad", pits: 160, pr: [1, 3], pa: [0.25, 0.3], pit: "#6a7362", lip: "#c4cbb8", cracks: 8, ca: [0.3, 0.3], crack: "#5d6657" });
  for (let i = 0; i < 70; i++) {   // thin strata lines (a sandstone)
    const y = R() * W, a = 0.1 + R() * 0.22, dark = R() < 0.6, th = 1 + R() * 2.4, wob = R() * 6;
    stamp(W, 0, y, 12, (ox, oy) => { g.strokeStyle = rgba(dark ? "#78816f" : "#b6bea9", a); g.lineWidth = th; g.beginPath(); for (let x = 0; x <= W; x += 32) { const yy = y + oy + Math.sin(x * 0.012 + i) * wob; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); });
  }
  for (let i = 0; i < 2000; i++) {   // mica flecks: tiny, drawn, never glowing
    const x = R() * W, y = R() * W, l = 1 + R() * 2.4, a = R() * Math.PI, al = 0.5 + R() * 0.5; g.strokeStyle = rgba("#e8ead9", al); g.lineWidth = 0.9 + R() * 0.7; g.beginPath(); g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 700; i++) { const x = R() * W, y = R() * W, r = 0.6 + R() * 1.3; g.fillStyle = rgba("#6f7868", 0.3 + R() * 0.4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  return finishSheet(c, "altar");
}
function finishSheet(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function sheet(key) {
  return (SHEETS[key] ??= key === "blue" || key === "blueToday" ? paintBlue(key === "blueToday") : key === "altar" ? paintAltar() : paintStone(key));
}

// ---------------------------------------------------------------------------------------------------------------
// geometry: a soup of triangles (3 vertices each, flat xyz), built from rings (lofts) and capped with earcut; outward winding is fixed
// from a reference point inside each piece; vertex normals are crease-smoothed; UVs come from a per-axis window of the sheet.
const newSoup = () => ({ p: [], ao: [], cur: 1 });
function tri(S, a, b, c, ref, inward) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * nx + ny * ny + nz * nz < 1e-13) return;
  const d = nx * ((a[0] + b[0] + c[0]) / 3 - ref[0]) + ny * ((a[1] + b[1] + c[1]) / 3 - ref[1]) + nz * ((a[2] + b[2] + c[2]) / 3 - ref[2]);
  if (inward ? d > 0 : d < 0) { const t = b; b = c; c = t; }
  S.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); S.ao.push(S.cur);
}
const avg3 = (r) => { const o = [0, 0, 0]; for (const q of r) { o[0] += q[0]; o[1] += q[1]; o[2] += q[2]; } return o.map((v) => v / r.length); };
function loft(S, rings, inward = false) {
  const M = rings[0].length, cen = rings.map(avg3);
  for (let i = 0; i + 1 < rings.length; i++) {
    const ref = [(cen[i][0] + cen[i + 1][0]) / 2, (cen[i][1] + cen[i + 1][1]) / 2, (cen[i][2] + cen[i + 1][2]) / 2];
    for (let j = 0; j < M; j++) { const k = (j + 1) % M, a = rings[i][j], b = rings[i][k], c = rings[i + 1][k], d = rings[i + 1][j]; tri(S, a, b, c, ref, inward); tri(S, a, c, d, ref, inward); }
  }
}
function cap(S, ring, holes, axis, ref, inward = false) {
  const dedupe = (r) => r.filter((q, i) => { const n = r[(i + 1) % r.length]; return Math.abs(q[0] - n[0]) + Math.abs(q[1] - n[1]) + Math.abs(q[2] - n[2]) > 1e-5; });
  ring = dedupe(ring); holes = holes.map(dedupe);
  const pr = axis === "y" ? (q) => new THREE.Vector2(q[0], q[2]) : axis === "x" ? (q) => new THREE.Vector2(q[1], q[2]) : (q) => new THREE.Vector2(q[0], q[1]);
  const pts = [...ring, ...holes.flat()], faces = THREE.ShapeUtils.triangulateShape(ring.map(pr), holes.map((h) => h.map(pr)));
  for (const f of faces) tri(S, pts[f[0]], pts[f[1]], pts[f[2]], ref, inward);
}
// a polygon of corners [x, z, radius] with rounded corners (quadratic arcs) and straight edges cut into pieces of about `seg`
function roundedPoly(corners, seg = 0.2, arcN = 3) {
  const n = corners.length, arcs = corners.map(([x, z, rc], i) => {
    const [px, pz] = corners[(i + n - 1) % n], [qx, qz] = corners[(i + 1) % n], l1 = Math.hypot(x - px, z - pz), l2 = Math.hypot(qx - x, qz - z), r = Math.min(rc || 0, l1 / 2.2, l2 / 2.2);
    if (r < 1e-4) return [[x, z]];
    const a = [x + ((px - x) / l1) * r, z + ((pz - z) / l1) * r], b = [x + ((qx - x) / l2) * r, z + ((qz - z) / l2) * r], out = [];
    for (let k = 0; k <= arcN; k++) { const t = k / arcN, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * x + t * t * b[0], u * u * a[1] + 2 * u * t * z + t * t * b[1]]); }
    return out;
  }), out = [];
  for (let i = 0; i < n; i++) {
    out.push(...arcs[i]);
    const a = arcs[i][arcs[i].length - 1], b = arcs[(i + 1) % n][0], len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(0, Math.ceil(len / seg) - 1);
    for (let k = 1; k <= m; k++) out.push([lerp(a[0], b[0], k / (m + 1)), lerp(a[1], b[1], k / (m + 1))]);
  }
  return out;
}
const rectCorners = (w, d, rc) => [[-w / 2, -d / 2, rc], [w / 2, -d / 2, rc], [w / 2, d / 2, rc], [-w / 2, d / 2, rc]];
function outlineNormals(pts) {
  const n = pts.length; let A = 0; for (let i = 0; i < n; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % n]; A += x1 * z2 - x2 * z1; }
  const s = A > 0 ? 1 : -1;
  return pts.map((p, i) => { const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; return [s * tz, -s * tx]; });
}
// the rows of a rounded prism: y0 (bottom, rounded by rb) to y1 (top, rounded by rt); each row {y, e (inset)}
function rowsOf(y0, y1, rb, rt, step) {
  const rows = [], yb = y0 + rb, yt = y1 - rt;
  if (rb) for (const th of [90, 72, 54, 36, 18]) rows.push({ y: y0 + rb * (1 - Math.sin(th * DEG)), e: rb * (1 - Math.cos(th * DEG)) });
  const n = Math.max(1, Math.round((yt - yb) / step)); for (let k = 0; k <= n; k++) rows.push({ y: yb + ((yt - yb) * k) / n, e: 0 });
  if (rt) for (const th of [18, 36, 54, 72, 90]) rows.push({ y: yt + rt * Math.sin(th * DEG), e: rt * (1 - Math.cos(th * DEG)) });
  return rows;
}
function ringsOf(pts, nrm, rows, disp) {
  return rows.map((rw) => pts.map((p, j) => {
    let x = p[0] * (rw.sx ?? 1) + (rw.dx || 0), z = p[1] * (rw.sz ?? 1) + (rw.dz || 0);
    const dd = (disp ? disp(x, rw.y, z) : 0) - (rw.e || 0); x += nrm[j][0] * dd; z += nrm[j][1] * dd;
    return [x, rw.y + (rw.ty ? rw.ty(x, z) : 0), z];
  }));
}
// a surface displacement: two octaves of noise plus a few chips (a dent of radius r and depth d at a point of the outline)
function dispOf(seed, pts, h, o) {
  const f1 = o.f1 ?? 1.3, chips = Array.from({ length: o.chips }, (_, i) => { const j = Math.floor(rnd(seed * 5.1 + i * 2.3) * pts.length); return { x: pts[j][0], z: pts[j][1], y: h * (1 - Math.pow(rnd(seed * 3.3 + i * 4.1), 2) * 0.95), r: o.cr[0] + o.cr[1] * rnd(seed * 7.7 + i * 1.9), d: o.cd[0] + o.cd[1] * rnd(seed * 9.1 + i * 6.3) }; }).concat(o.bigs || []);
  return (x, y, z) => {
    let v = o.a1 * (vnoise(x * f1, y * f1, z * f1, seed) - 0.5) * 2 + o.a2 * (vnoise(x * 5.1, y * 5.1, z * 5.1, seed + 9) - 0.5) * 2;
    for (const c of chips) { const dd = Math.hypot(x - c.x, y - c.y, z - c.z); if (dd < c.r) v -= c.d * smooth(1 - dd / c.r); }
    return v;
  };
}
const NEWD = { chips: 4, cr: [0.08, 0.12], cd: [0.01, 0.02], a1: 0.02, a2: 0.006, f1: 0.7 }, TODD = { chips: 16, cr: [0.1, 0.22], cd: [0.04, 0.09], a1: 0.04, a2: 0.014, f1: 0.8 };

function knobSoup(S, cx, y0, cz, r, hgt, today, seed) {
  const n = 12, prof = today ? [[-0.05, 1], [hgt * 0.5, 1], [hgt * 0.85, 0.88], [hgt, 0.62]] : [[-0.05, 1], [hgt - 0.03, 1], [hgt - 0.014, 0.9], [hgt, 0.72]], rings = [];
  for (const [yy, f] of prof) { const ring = []; for (let j = 0; j < n; j++) { const a = (j / n) * TAU, rr = r * f * (today ? 1 + (rnd(seed * 3.1 + j) - 0.5) * 0.14 : 1); ring.push([cx + Math.cos(a) * rr, y0 + yy, cz + Math.sin(a) * rr]); } rings.push(ring); }
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [cx, y0 - 0.3, cz]);
}
// one upright, origin bottom centre of its standing ground, front +z, rising to h; o: { w, d, h, look, seed, under, knobs (0|1|2), tilt, vary }
// new: dressed by hand (taper 93-97 %, entasis, soft arrises r 0.07, a surface that undulates 1-2 cm, width +-8 % when o.vary).
// today: taper 80-92 %, sides that bulge and wander 4-12 cm, arrises r 0.15-0.3, an uneven top (domed, slanted or notched), one in three
// with a big hollow or a broken corner.
function uprightSoup(o) {
  const S = newSoup(), { d, h, seed } = o, today = o.look === "today", under = (o.under || 0) + 0.4;
  const w = o.w * (o.vary && !today ? 0.92 + 0.16 * rnd(seed * 6.1) : 1), hw = w / 2, hd = d / 2;
  const rc = today ? 0.15 + 0.15 * rnd(seed * 2.2) : 0.09, rt = today ? 0.12 + 0.13 * rnd(seed * 2.6) : 0.09;
  const pts = roundedPoly(rectCorners(w, d, rc), today ? 0.13 : 0.12, today ? 4 : 3), nrm = outlineNormals(pts);
  const tp = today ? 0.8 + 0.12 * rnd(seed * 3.9) : 0.93 + 0.04 * rnd(seed * 3.9), sw = today ? 0.025 : 0.04;
  // the top: 0 dome, 1 slant, 2 notch (10-25 cm)
  const kind = Math.floor(rnd(seed * 8.3) * 3), amp = 0.1 + 0.15 * rnd(seed * 9.7), sgn = rnd(seed * 1.3) < 0.5 ? -1 : 1, sgz = rnd(seed * 1.9) < 0.5 ? -1 : 1, slant = (o.tilt ?? 0.25) * (0.4 + 0.6 * rnd(seed * 1.7)) * sgn;
  const tyTop = (x, z) => (!today ? 0 : kind === 0 ? amp * (1 - clamp((x / hw) ** 2 + (z / hd) ** 2)) : kind === 1 ? slant * (x / hw) : -amp * smooth(1 - Math.hypot(x - sgn * hw, z - sgz * hd) / 0.7));
  const rows = rowsOf(-under, h, 0, rt, 0.16).map((rw) => { const f = clamp(rw.y / h), fy = smooth((rw.y - (h - 0.7)) / 0.7); return { ...rw, sx: (1 - (1 - tp) * f) * (1 + sw * Math.sin(Math.PI * f)), sz: (1 - (1 - tp) * 0.5 * f) * (1 + (today ? 0.03 : 0.045) * Math.sin(Math.PI * f)), ty: today ? (x, z) => tyTop(x, z) * fy : null }; });
  const bigs = [], r3 = rnd(seed * 4.7);
  if (today && r3 < 0.17) { const j = Math.floor(rnd(seed * 5.9) * pts.length); bigs.push({ x: pts[j][0], z: pts[j][1], y: h * (0.3 + 0.4 * rnd(seed * 6.7)), r: 0.6 + 0.3 * rnd(seed * 7.1), d: 0.12 + 0.08 * rnd(seed * 7.9) }); }
  else if (today && r3 < 0.34) bigs.push({ x: sgn * hw, z: sgz * hd, y: h - 0.1, r: 0.8 + 0.3 * rnd(seed * 7.1), d: 0.3 + 0.1 * rnd(seed * 7.9) });
  const rings = ringsOf(pts, nrm, rows, dispOf(seed, pts, h, today ? { ...TODD, chips: 10, a1: 0.06 + 0.06 * rnd(seed * 3.1), bigs } : { ...NEWD, bigs }));
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [0, h / 2, 0]);
  const kn = o.knobs ?? 2, xs = kn === 2 ? [-0.5, 0.5] : kn === 1 ? [o.knobX ?? 0] : [];
  for (const [i, kx] of xs.entries()) { if (today && o.worn && i === 1 && rnd(seed * 4.4) < 0.25) continue; knobSoup(S, kx, h + tyTop(kx * (1 - (1 - tp)), o.knobZ ?? 0) - 0.02, o.knobZ ?? 0, 0.16, 0.16, today, seed + i * 3); }
  return S;
}
// one top stone, origin bottom centre, front +z. o: { L, W, H, look, seed, curve, holes, holeX, ridge, groove }
// today: sags a little (4-9 cm), worn rounded ends and arrises; new: dead level, arrises r 0.05
function lintelSoup(o) {
  const S = newSoup(), L = o.L ?? 3.25, W = o.W ?? 1.0, H = o.H ?? 0.8, today = o.look === "today", rc = today ? 0.2 : 0.05, rb = today ? 0.08 : 0.05, rt = today ? 0.1 : 0.05, seed = o.seed ?? 1;
  const rw = 0.12, rp = 0.08, c = [[-L / 2, -W / 2, rc], [L / 2, -W / 2, rc]], sag = today ? 0.04 + 0.05 * rnd(seed * 2.3) : 0, sagAt = (x) => -sag * (1 - clamp(x / (L / 2), -1, 1) ** 2);
  if (o.groove !== false) c.push([L / 2, -rw / 2, 0], [L / 2 - rp, -rw / 2, 0], [L / 2 - rp, rw / 2, 0], [L / 2, rw / 2, 0]);
  c.push([L / 2, W / 2, rc], [-L / 2, W / 2, rc]);
  if (o.ridge !== false) c.push([-L / 2, rw / 2, 0], [-L / 2 - rp, rw / 2, 0], [-L / 2 - rp, -rw / 2, 0], [-L / 2, -rw / 2, 0]);
  const pts = roundedPoly(c, 0.12, 3), nrm = outlineNormals(pts), rows = rowsOf(0, H, rb, rt, 0.16).map((rw2) => ({ ...rw2, ty: sag ? (x) => sagAt(x) : null }));
  const rings = ringsOf(pts, nrm, rows, dispOf(seed, pts, H, today ? { ...TODD, chips: 7, a1: 0.015, f1: 1.1 } : { ...NEWD, chips: 3 }));
  const holes = [];
  if (o.holes !== false) {
    const hx = o.holeX ?? 1.125, rr = 0.17, dep = 0.18;
    for (const sx of [-1, 1]) {
      const ring0 = [], ring1 = [], yo = sagAt(sx * hx); for (let j = 0; j < 20; j++) { const a = (j / 20) * TAU; ring0.push([sx * hx + Math.cos(a) * rr, yo, Math.sin(a) * rr]); ring1.push([sx * hx + Math.cos(a) * rr, yo + dep, Math.sin(a) * rr]); }
      holes.push(ring0); S.cur = 0.45; loft(S, [ring0, ring1], true); S.cur = 0.3; cap(S, ring1, [], "y", [sx * hx, yo + dep + 0.3, 0]); S.cur = 1;
    }
  }
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [0, H / 2, 0]); cap(S, rings[0], holes, "y", [0, H / 2, 0]);
  if (o.curve !== false) { const P = S.p; for (let i = 0; i < P.length; i += 3) { const ph = P[i] / RING, r2 = RING - P[i + 2]; P[i] = r2 * Math.sin(ph); P[i + 2] = RING - r2 * Math.cos(ph); } }
  return S;
}
// a pillar of irregular cross-section (bluestones, the Heel Stone); o: { w, h, d, seed, today, rows, rough, taper }
function pillarSoup(o) {
  const S = newSoup(), { w, h, d, seed } = o, n = 11, nr = o.rows ?? 8, rough = o.rough ?? 0.14, rings = [], base = [];
  for (let j = 0; j < n; j++) { const a = (j / n) * TAU; base.push([Math.cos(a), Math.sin(a), 0.82 + 0.36 * rnd(seed * 3.7 + j * 1.3)]); }
  const tiltX = (rnd(seed * 1.9) - 0.5) * 0.5, tiltZ = (rnd(seed * 2.3) - 0.5) * 0.5;
  for (let i = 0; i <= nr; i++) {
    const f = i / nr, y = -0.3 + (h + 0.3) * f, fy = clamp(y / h), taper = lerp(1, o.taper ?? 0.74, smooth(fy)) * (fy > 0.9 ? lerp(1, 0.78, (fy - 0.9) * 10) : 1);
    const ring = base.map(([cx, cz, k], j) => {
      const nz = 1 + rough * 2 * (vnoise(cx * 1.6 + i * 0.37, y * 1.1, cz * 1.6, seed) - 0.5) + rough * (vnoise(cx * 3.9 + i * 0.9, y * 3.1, cz * 3.9, seed + 4) - 0.5) + (o.today ? 0.04 : 0) * Math.sin(j * 2.3 + i);
      const topCut = fy > 0.9 ? (tiltX * cx + tiltZ * cz) * (fy - 0.9) * h * 3 : 0;
      return [cx * (w / 2) * k * taper * nz + 0.06 * Math.sin(y * 1.3 + seed), Math.min(y, h) + topCut, cz * (d / 2) * k * taper * nz + 0.05 * Math.cos(y * 1.1 + seed)];
    });
    rings.push(ring);
  }
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [0, h / 2, 0]); return S;
}
// the squared (dressed) bluestone pillar
function dressedSoup(o) {
  const S = newSoup(), { w, h, d, seed } = o, pts = roundedPoly(rectCorners(w, d, 0.035), 0.2, 1), nrm = outlineNormals(pts);
  const rows = rowsOf(-0.3, h, 0, 0.03, 0.4).map((rw) => ({ ...rw, sx: 1 - 0.03 * clamp(rw.y / h), sz: 1 - 0.03 * clamp(rw.y / h) })), rings = ringsOf(pts, nrm, rows, dispOf(seed, pts, h, { ...NEWD, chips: 3, a1: o.today ? 0.012 : 0.005 }));
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [0, h / 2, 0]); return S;
}
// a slab (the Altar Stone, a giant's top stone): rounded prism, size w x h x d, bottom 0.3 below y 0 unless o.flat
function slabSoup(o) {
  const S = newSoup(), { w, h, d, seed } = o, today = o.look === "today", pts = roundedPoly(rectCorners(w, d, today ? 0.2 : 0.06), 0.14, 3), nrm = outlineNormals(pts);
  const rows = rowsOf(-0.3, h, 0, today ? 0.12 : 0.06, 0.16), rings = ringsOf(pts, nrm, rows, dispOf(seed, pts, h, today ? { ...TODD, chips: 8, a1: 0.03 } : { ...NEWD, chips: 3 }));
  loft(S, rings); cap(S, rings[rings.length - 1], [], "y", [0, h / 2, 0]); return S;
}
// a lying stone, long axis x, middle of its length at x 0, on the ground (y 0 = its underside before the sink); returns { S, foot: [[x, z]...] }
function fallenSoup(o) {
  const S = newSoup(), { l, w, t, seed } = o, today = o.look !== "new", np = clamp(o.pieces ?? 1, 1, 3), sink = (o.sink ?? 0.2) * t, rc = today ? Math.min(0.22, t * 0.25) : 0.05;
  const cs = roundedPoly([[-w / 2, 0, rc], [w / 2, 0, rc], [w / 2, t, rc], [-w / 2, t, rc]], 0.16, 3), nrm = outlineNormals(cs);
  const gaps = np === 1 ? [] : Array.from({ length: np - 1 }, (_, i) => 0.14 + 0.12 * rnd(seed * 4.1 + i)), room = l - gaps.reduce((a, b) => a + b, 0);
  const wts = Array.from({ length: np }, (_, i) => 0.7 + 0.6 * rnd(seed * 2.9 + i * 3.3)), wsum = wts.reduce((a, b) => a + b, 0);
  let x0 = -l / 2;
  for (let p = 0; p < np; p++) {
    const len = (room * wts[p]) / wsum, x1 = x0 + len, nx = Math.max(2, Math.round(len / 0.3)), rings = [];
    const yaw = np > 1 ? (rnd(seed * 6.1 + p) - 0.5) * 0.08 : 0, dy = np > 1 ? -0.05 * rnd(seed * 8.3 + p) : 0, dz = np > 1 ? (rnd(seed * 3.3 + p * 2) - 0.5) * 0.16 : 0, xm = (x0 + x1) / 2;
    const slant = [(rnd(seed * 1.1 + p) - 0.5) * 0.5, (rnd(seed * 1.7 + p) - 0.5) * 0.5], slant2 = [(rnd(seed * 2.1 + p) - 0.5) * 0.5, (rnd(seed * 2.7 + p) - 0.5) * 0.5];
    const dsp = dispOf(seed + p * 17, cs.map(([a, b]) => [a, b]), t, today ? { ...TODD, chips: 7, a1: 0.07, f1: 0.7 } : NEWD);
    for (let i = 0; i <= nx; i++) {
      const fx = i / nx, x = lerp(x0, x1, fx), end = i === 0 ? 0 : i === nx ? 1 : -1, taper = (1 - 0.03 * Math.sin(fx * Math.PI)) * (today ? 1 + 0.14 * (vnoise(x * 0.6, seed, p, 3) - 0.5) : 1), tz = today ? 1 + 0.18 * (vnoise(x * 0.7, seed, p + 5, 4) - 0.5) : 1;
      const ring = cs.map(([a, b], j) => {
        const dd = dsp(x, b, a); let aa = a * taper + nrm[j][0] * dd, bb = b * tz + nrm[j][1] * dd, xx = x;
        const jag = np > 1 ? ((p === 0 && end === 0) || (p === np - 1 && end === 1) ? 0 : 1) : 0, br = o.broken?.[end] || jag;   // the far ends of the whole stone are the old ends; the cuts are broken
        if (end >= 0 && br) { const sl = end === 0 ? slant : slant2; xx += (end === 0 ? 1 : -1) * (sl[0] * (bb - t / 2) + sl[1] * aa) * 0.5 + (rnd(seed * 9.7 + j * 1.3 + p * 7 + end) - 0.3) * 0.16; }
        else if (end >= 0 && today) xx += (rnd(seed * 5.7 + j + end * 9) - 0.5) * 0.06;
        // the piece's own small turn and settling about its middle
        const rx = xx - xm, rz = aa + dz; return [xm + rx * Math.cos(yaw) - rz * Math.sin(yaw), bb + dy - sink, rx * Math.sin(yaw) + rz * Math.cos(yaw)];
      });
      rings.push(ring);
    }
    loft(S, rings); cap(S, rings[0], [], "x", avg3(rings[1]), false); cap(S, rings[rings.length - 1], [], "x", avg3(rings[rings.length - 2]), false);
    x0 = x1 + (gaps[p] ?? 0);
  }
  const foot = [], per = [[-l / 2, -w / 2 * 0.92], [l / 2, -w / 2 * 0.92], [l / 2, w / 2 * 0.92], [-l / 2, w / 2 * 0.92]];
  for (let k = 0; k < 4; k++) { const a = per[k], b = per[(k + 1) % 4], m = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.3); for (let i = 0; i < m; i++) foot.push([lerp(a[0], b[0], i / m), lerp(a[1], b[1], i / m)]); }
  return { S, foot };
}

// ---------------------------------------------------------------------------------------------------------------
// light and shade baked into the vertex colours; the sun is up and left of the default view (BOARD section 1)
function cfgOf(S) {
  const az = (S.sunAz ?? 14) * DEG, elD = S.sunEl ?? 6.5, el = elD * DEG, sc = rgb(S.sunColor ?? "#ffc66a").map((v) => v / 255), mx = Math.max(...sc), today = S.era === "today" || S.look === "today";
  const k = clamp((16 - elD) / 9, 0.35, 1);   // how hard the low sun paints: strongest below 7 deg
  const kf = (k - 0.35) / 0.65, nrm = sc.map((v) => v / mx);
  // one light model for both eras: colour = albedo x mix(SHADE, LIT, lit). LIT is the sun colour lifted toward white (nearly white at el 12, redder as the sun falls),
  // SHADE a cool lavender that deepens toward violet as the sun falls. The albedo is the painted sheet.
  const wh = clamp(0.35 + 0.45 * (elD / 12), 0.35, 0.8), litN = nrm.map((v) => lerp(v, 1, wh));
  const LIT = today ? [litN[0], litN[1] * 0.95, litN[2] * 0.86] : litN;
  const SHADE = today ? [lerp(0.77, 0.63, kf), lerp(0.79, 0.6, kf), lerp(0.85, 0.82, kf)] : [lerp(0.81, 0.69, kf), lerp(0.8, 0.64, kf), lerp(0.86, 0.78, kf)];   // by day a neutral cool grey (never purple), violet only as the sun falls
  return {
    az: S.sunAz ?? 14, el: elD, seed: S.seed ?? 1, slope: S.slope ?? 0, today, k,
    L: [-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)],
    lit: LIT, shade: SHADE, rim: LIT.map((v) => v * 1.1),
    ground: (x) => -(S.slope ?? 0) * (x + RING) / 31,
  };
}
const gAcc = () => ({ p: [], n: [], u: [], c: [], count: 0 });
// one vertex: lit = smoothstep(-0.1, 0.35, n . L); colour = mix(SHADE, LIT, lit); sky light on tops and the upper third, ground bounce at the foot, the dark band under a top
// stone and inside narrow gaps, the glowing edge (glow 0..1: close to an edge that borders a face the sun reaches, on a shade face it blends to LIT x 1.1),
// the hand-drawn dark line along arrises (ed 0..1), lichen, rain streaks, chalk dust at the feet of new stones
function bakeAt(cfg, wx, wy, wz, nx, ny, nz, ao, tint, nv, gy, ed, glow, top, band, gapD) {
  const d = nx * cfg.L[0] + ny * cfg.L[1] + nz * cfg.L[2], today = cfg.today;
  let t = smooth((d + 0.1) / 0.45); t = Math.max(t, clamp(ny, 0, 1) * 0.92);
  let m = [0, 1, 2].map((k) => lerp(cfg.shade[k], cfg.lit[k], t));
  if (ny < -0.3) m = m.map((v) => v * 0.7);
  const gh = wy - gy, hf = clamp(gh / Math.max(1, top - gy)), nn = 1 + nv * (vnoise(wx * 0.8, wy * 0.8, wz * 0.8, 5) - 0.5) * 2 + nv * 0.5 * (vnoise(wx * 3.3, wy * 3.3, wz * 3.3, 11) - 0.5) * 2;
  const sky = Math.max(clamp(ny), smooth((hf - 0.62) / 0.3) * 0.9);   // sky light: tops and the upper third a touch lighter and cooler
  m = [m[0] * (1 + 0.06 * sky), m[1] * (1 + 0.075 * sky), m[2] * (1 + 0.11 * sky)];
  const bn = (1 - smooth(gh / 0.6)) * (1 - clamp(ny));   // ground bounce: the foot a little warmer
  m = [m[0] * (1 + 0.07 * bn), m[1] * (1 + 0.02 * bn), m[2] * (1 - 0.07 * bn)];
  if (glow > 0.01) { const gw = glow * (1 - t) * 0.92; m = m.map((v, k) => lerp(v, cfg.rim[k], gw)); }
  if (ed > 0.02) {
    const line = ed * (1 - glow) * (0.4 + 0.5 * vnoise(wx * 4, wy * 2.5, wz * 4, 17));
    m = m.map((v) => v * (1 - line * (today ? 0.55 : 0.2)));
    if (!today) { const chip = ed * smooth((vnoise(wx * 9, wy * 9, wz * 9, 19) - 0.64) * 9); m = m.map((v) => v * (1 - 0.3 * chip)); }
  }
  if (band > 0 && ny < 0.5) m = m.map((v) => v * lerp(0.7, 1, smooth((top - wy) / band)));   // the dark contact band under a top stone
  if (gapD > 0) m = m.map((v) => v * (1 - 0.3 * gapD));   // inside the narrow gaps
  let g = gh < 1.4 ? (today ? 0.76 : 0.92) + (today ? 0.24 : 0.08) * smooth(gh / 1.3) : 1;
  if (today) {
    const lich = smooth((vnoise(wx * 1.1 + 3, wy * 0.9, wz * 1.1, 21) - 0.56) * 7) * (0.3 + 0.7 * Math.max(clamp(ny), clamp(nz) * 0.8));
    m = [m[0] * (1 + lich * 0.12), m[1] * (1 + lich * 0.2), m[2] * (1 + lich * 0.0)];
  }
  const sr = smooth((vnoise(wx * 5.5, 0.5, wz * 5.5, 8) - 0.6) * 6) * clamp(1 - (top - wy) / 3.5) * (1 - clamp(ny));
  m = m.map((v) => v * (1 - sr * (today ? 0.3 : 0.1)));
  if (!today && gh < 0.3) { const ch = smooth(1 - gh / 0.3) * (0.45 + 0.55 * smooth((vnoise(wx * 3, wy * 3, wz * 3, 13) - 0.35) * 4)) * (1 - clamp(ny)); m = m.map((v, k) => lerp(v, [1.04, 1.0, 0.92][k], ch * 0.7)); }
  return m.map((v, k) => Math.pow(clamp(v * tint[k] * g * ao * nn, 0, 1.3), 2.2));
}
// o: { seed, crease, cfg, sm (sheet metres), nv, tv }
function emit(A, S, M, o) {
  const P = S.p, T = P.length / 9, cfg = o.cfg, e = M.elements, sm = o.sm ?? 4, seed = o.seed ?? 1;
  const fn = new Float32Array(T * 3), fu = new Float32Array(T * 3), fd = new Float32Array(T);   // fd: the face's own n . L in the world
  for (let t = 0; t < T; t++) {
    const i = t * 9, ux = P[i + 3] - P[i], uy = P[i + 4] - P[i + 1], uz = P[i + 5] - P[i + 2], vx = P[i + 6] - P[i], vy = P[i + 7] - P[i + 1], vz = P[i + 8] - P[i + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    fn[t * 3] = nx; fn[t * 3 + 1] = ny; fn[t * 3 + 2] = nz; fu[t * 3] = nx / l; fu[t * 3 + 1] = ny / l; fu[t * 3 + 2] = nz / l;
    const ax = (e[0] * nx + e[4] * ny + e[8] * nz) / l, ay = (e[1] * nx + e[5] * ny + e[9] * nz) / l, az = (e[2] * nx + e[6] * ny + e[10] * nz) / l;
    fd[t] = ax * cfg.L[0] + ay * cfg.L[1] + az * cfg.L[2];
  }
  let top = -1e9; for (let i = 0; i < P.length; i += 3) top = Math.max(top, e[1] * P[i] + e[5] * P[i + 1] + e[9] * P[i + 2] + e[13]);
  const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { bb[a] = Math.min(bb[a], P[i + a]); bb[a + 3] = Math.max(bb[a + 3], P[i + a]); }
  const LL = [e[0] * cfg.L[0] + e[1] * cfg.L[1] + e[2] * cfg.L[2], e[4] * cfg.L[0] + e[5] * cfg.L[1] + e[6] * cfg.L[2], e[8] * cfg.L[0] + e[9] * cfg.L[1] + e[10] * cfg.L[2]];   // the sun in the stone's own axes
  const gW = o.glowW ?? 0.5, band = o.band ?? 0;
  const key = (x, y, z) => (Math.round(x * 1000) + 8192) * 268435456 + (Math.round(y * 1000) + 8192) * 16384 + (Math.round(z * 1000) + 8192), map = new Map();
  for (let t = 0; t < T; t++) for (let v = 0; v < 3; v++) { const k = key(P[t * 9 + v * 3], P[t * 9 + v * 3 + 1], P[t * 9 + v * 3 + 2]); const a = map.get(k); if (a) a.push(t); else map.set(k, [t]); }
  const cosT = Math.cos((o.crease ?? 40) * DEG), tv = o.tv ?? (cfg.today ? 0.14 : 0.12), warm = (rnd(seed * 5.7 + 2) - 0.5) * 2, tn = 1 + (rnd(seed * 3.3 + 1) - 0.5) * tv, dark = rnd(seed * 8.1 + 5) < 0.2 ? 0.93 : 1;
  const tint = [tn * dark * (1 + warm * 0.045), tn * dark, tn * dark * (1 - warm * 0.06)];
  const oU = [0, 1, 2].map((k) => rnd(seed * 7.31 + k * 3.17)), oV = [0, 1, 2].map((k) => rnd(seed * 4.13 + k * 5.91)), mir = [0, 1, 2].map((k) => (rnd(seed * 2.91 + k * 5.3) < 0.5 ? -1 : 1));
  for (let t = 0; t < T; t++) {
    const fx = fu[t * 3], fy = fu[t * 3 + 1], fz = fu[t * 3 + 2], ax = Math.abs(fx) > Math.abs(fy) && Math.abs(fx) > Math.abs(fz) ? 0 : Math.abs(fy) > Math.abs(fz) ? 1 : 2;
    for (let v = 0; v < 3; v++) {
      const i = t * 9 + v * 3, x = P[i], y = P[i + 1], z = P[i + 2];
      let sx = 0, sy = 0, sz = 0, minDot = 1;
      for (const u of map.get(key(x, y, z))) {
        const dt = fu[u * 3] * fx + fu[u * 3 + 1] * fy + fu[u * 3 + 2] * fz;
        if (dt > cosT) { sx += fn[u * 3]; sy += fn[u * 3 + 1]; sz += fn[u * 3 + 2]; }
        if (dt < minDot) minDot = dt;
      }
      let l = Math.hypot(sx, sy, sz); if (l < 1e-9) { sx = fx; sy = fy; sz = fz; l = 1; } sx /= l; sy /= l; sz /= l;
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wy = e[1] * x + e[5] * y + e[9] * z + e[13], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const wnx = e[0] * sx + e[4] * sy + e[8] * sz, wny = e[1] * sx + e[5] * sy + e[9] * sz, wnz = e[2] * sx + e[6] * sy + e[10] * sz;
      let glow = 0; const lp = [x, y, z];
      for (const a of [0, 2]) for (const sg of [-1, 1]) { const fl = sg * LL[a]; if (fl > 0.1) glow = Math.max(glow, smooth(1 - (sg > 0 ? bb[a + 3] - lp[a] : lp[a] - bb[a]) / gW) * smooth((fl - 0.1) / 0.3)); }
      if (!band && LL[1] > 0.04) glow = Math.max(glow, smooth(1 - (bb[4] - y) / (gW * 0.7)) * smooth((LL[1] - 0.04) / 0.2));
      const gapD = o.gaps === 2 ? smooth((Math.abs(sx) - 0.5) / 0.3) : o.gaps ? smooth((sx * o.gaps - 0.5) / 0.3) : 0;
      const a = ax === 0 ? z : x, b = ax === 1 ? z : y;
      A.p.push(wx, wy, wz); A.n.push(wnx, wny, wnz); A.u.push((a * mir[ax]) / sm + oU[ax], b / sm + oV[ax]);
      A.c.push(...bakeAt(cfg, wx, wy, wz, wnx, wny, wnz, S.ao[t], tint, o.nv ?? (cfg.today ? 0.11 : 0.1), cfg.ground(wx), clamp((1 - minDot) * 10), glow, top, band, gapD));
    }
  }
  A.count += T * 3;
}
function geoOf(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(A.p), 3)); g.setAttribute("normal", new THREE.BufferAttribute(Float32Array.from(A.n), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(Float32Array.from(A.u), 2)); g.setAttribute("color", new THREE.BufferAttribute(Float32Array.from(A.c), 3));
  g.computeBoundingSphere(); return g;
}
const mkMat = (key) => { const m = new THREE.MeshBasicMaterial({ color: "#ffffff", map: sheet(key), vertexColors: true, toneMapped: false, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; };
const place = (parent, geo, m, solid) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = false; o.frustumCulled = false; o.userData.lookOnly = true; o.userData.solid = !!solid; o.userData.surfaceOnly = true; parent.add(o); return o; };
const mat4 = (x, y, z, yawDeg = 0, tipDeg = 0, tiltDeg = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tipDeg * DEG, yawDeg * DEG, tiltDeg * DEG, "YXZ")), new THREE.Vector3(1, 1, 1));
// grass tufts along a ring of ground points [[x, z]] (world), y from the ground function
function tufts(G, pts, cfg, seed, y0 = 0) {
  const lit = cfg.lit.map((v, k) => lerp(cfg.shade[k], v, 0.45));
  pts.forEach(([x, z], i) => {
    const n = 3 + Math.floor(rnd(seed * 3.1 + i) * 3), gy = cfg.ground(x) + y0;
    for (let b = 0; b < n; b++) {
      const r = (k) => rnd(seed * 17.3 + i * 5.1 + b * 2.7 + k), a = r(1) * TAU, hh = 0.09 + 0.2 * r(2), lean = 0.03 + 0.1 * r(3), la = r(4) * TAU, bx = x + (r(5) - 0.5) * 0.1, bz = z + (r(6) - 0.5) * 0.1, w = 0.012 + 0.01 * r(7);
      const tip = [bx + Math.cos(la) * lean, gy + hh, bz + Math.sin(la) * lean], mid = [bx + Math.cos(la) * lean * 0.3, gy + hh * 0.55, bz + Math.sin(la) * lean * 0.3];
      const pa = [bx - Math.cos(a) * w, gy - 0.02, bz - Math.sin(a) * w], pb = [bx + Math.cos(a) * w, gy - 0.02, bz + Math.sin(a) * w];
      const ma = [mid[0] - Math.cos(a) * w * 0.6, mid[1], mid[2] - Math.sin(a) * w * 0.6], mb = [mid[0] + Math.cos(a) * w * 0.6, mid[1], mid[2] + Math.sin(a) * w * 0.6];
      const tone = 0.8 + 0.3 * r(8), cb = [0.35 * tone, 0.45 * tone, 0.26 * tone], ct = [0.64 * tone, 0.74 * tone, 0.44 * tone], cm = cb.map((v, k) => (v + ct[k]) / 2);
      const col = (c) => c.map((v, k) => Math.pow(clamp(v * lit[k]), 2.2));
      for (const [p, c] of [[pa, cb], [pb, cb], [mb, cm], [pa, cb], [mb, cm], [ma, cm], [ma, cm], [mb, cm], [tip, ct]]) { G.p.push(...p); G.n.push(0, 1, 0); G.u.push(0, 0); G.c.push(...col(c)); }
      G.count += 9;
    }
  });
}
const grassMat = () => { const m = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, toneMapped: false, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; };

// ---------------------------------------------------------------------------------------------------------------
// the shadow decal: every caster {pts: [[x, z] x4] (local footprint), yb, yt (heights of its underside and top)} sweeps its footprint
// away from the sun by height / tan(sunEl) (capped at 40 m); the hull of the two ends is one flat shadow. All are drawn opaque into a mask,
// then coloured, then blurred twice (a tight core and a wide penumbra) into the decal: overlaps never darken twice.
function convexHull(p) {
  const s = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...s].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}
function shadowLayer(parent, ext, size, cfg) {
  const [c, g] = canvas(size, size), [mc, mg] = canvas(size, size), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); m.userData.noOutline = true;
  const geo = new THREE.PlaneGeometry(ext * 2, ext * 2); geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 2; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false; mesh.userData.lookOnly = true; mesh.userData.solid = false; parent.add(mesh);
  const k = 1 / Math.tan(clamp(cfg.el, 0.4, 80) * DEG), away = [Math.sin(cfg.az * DEG), Math.cos(cfg.az * DEG)], ppm = size / (2 * ext);
  return {
    mesh,
    place(rotDeg, y, slope) { mesh.rotation.set(0, -rotDeg * DEG, -Math.atan(slope / 31), "YXZ"); mesh.position.y = 0.04 - y - slope / 2; },
    draw(casters, rotDeg, dusk) {
      const cr = Math.cos(rotDeg * DEG), sr = Math.sin(rotDeg * DEG), P = (x, z) => [(x / ext * 0.5 + 0.5) * size, (z / ext * 0.5 + 0.5) * size];
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = "source-over"; mg.clearRect(0, 0, size, size); mg.fillStyle = "#000";
      for (const cs of casters) {
        const db = Math.min(Math.max(cs.yb, 0) * k, 40), dt = Math.min(Math.max(cs.yt, 0) * k, 40), pts = [];
        for (const [x, z] of cs.pts) { const wx = x * cr + z * sr, wz = -x * sr + z * cr; pts.push([wx + away[0] * db, wz + away[1] * db], [wx + away[0] * dt, wz + away[1] * dt]); }
        const hull = convexHull(pts); mg.beginPath(); hull.forEach(([x, z], i) => { const [px, py] = P(x, z); i ? mg.lineTo(px, py) : mg.moveTo(px, py); }); mg.closePath(); mg.fill();
      }
      mg.globalCompositeOperation = "source-in"; mg.fillStyle = dusk > 0 ? `rgb(${Math.round(lerp(58, 40, dusk))},${Math.round(lerp(72, 52, dusk))},${Math.round(lerp(112, 96, dusk))})` : "rgb(44,54,98)"; mg.fillRect(0, 0, size, size); mg.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, size, size); g.globalAlpha = 0.44; g.filter = `blur(${Math.max(0.8, 0.12 * ppm)}px)`; g.drawImage(mc, 0, 0);
      g.globalAlpha = 0.16; g.filter = `blur(${Math.max(2, 0.42 * ppm)}px)`; g.drawImage(mc, 0, 0); g.filter = "none"; g.globalAlpha = 1; t.needsUpdate = true;
    },
  };
}
const rectCast = (cx, cz, hw, hd, yawDeg, yb, yt) => {
  const c = Math.cos(yawDeg * DEG), s = Math.sin(yawDeg * DEG);
  return { pts: [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]), yb, yt };
};
const duskMul = (d) => [lerp(1, 0.5, d), lerp(1, 0.55, d), lerp(1, 0.74, d)].map((v) => Math.pow(v, 2.2));

// ---------------------------------------------------------------------------------------------------------------
// the monument
export const SH_STONES_PARTS = {
  ring: { r: RING, top: TOP },
  stone: (n) => { const a = 6 + 12 * (n - 1); return [-RING * Math.sin(a * DEG), RING * Math.cos(a * DEG), 180 - a]; },   // [x, z, yaw deg] (front toward the centre)
  pair: { "51-52": [-5.6, 4.0, 5.0], "53-54": [-6.3, -2.2, 5.5], "55-56": [0, -6.3, 6.7], "57-58": [6.3, -2.2, 5.5], "59-60": [5.6, 4.0, 5.0] },   // [x, z, h]
  altar: [0, -4.2], heel: [1.6, 77],
};
const PAIRS = Object.entries(SH_STONES_PARTS.pair).map(([id, [x, z, h]]) => ({ id, x, z, h, yaw: Math.atan2(-x, -z) / DEG }));
function buildMonument(P, S, cfg) {
  const today = S.era === "today", look = today ? "today" : "new", seed = S.seed ?? 1, yg = cfg.ground;
  const body = gAcc(), tops = gAcc(), grass = gAcc(), blue = gAcc(), altar = gAcc(), items = [], gapT = new Set(S.gap ?? []), gapU = new Set(S.gapUprights ?? []), casters = [];
  const add = (A, soup, M, o, thr, cast) => { emit(A, soup, M, { ...o, cfg }); items.push({ A, end: A.count, thr, cast }); };
  const nowThr = (a, b, k, n) => (today ? 0 : a + ((b - a) * (k + 1)) / n);
  const sk = (k) => seed * 131 + k;
  const upC = (x, z, yaw, w, d, h) => [rectCast(x, z, w / 2, d / 2, yaw, 0, h)];
  const bm = (x, z, yaw, lift = 0) => mat4(x, yg(x) + lift, z, yaw);
  // ---- the Altar Stone
  {
    const buried = S.altarBuried ?? (today ? 0.6 : 0), sinkY = yg(0) - buried * 0.5;
    add(altar, slabSoup({ w: 4.9, h: 0.5, d: 1.0, seed: sk(1), look }), mat4(0, sinkY, -4.2, 0), { seed: sk(1), sm: 2, crease: 50 }, 0.001, [rectCast(0, -4.2, 2.45, 0.5, 0, 0, 0.5 - buried * 0.5)]);
    if (buried > 0) tufts(grass, [[-2.5, -4.2 + 0.52], [2.5, -4.2 + 0.52], ...Array.from({ length: 16 }, (_, i) => [-2.4 + i * 0.32, -4.2 + 0.54 + 0.02 * rnd(i)]), ...Array.from({ length: 16 }, (_, i) => [-2.4 + i * 0.32, -4.2 - 0.54 - 0.02 * rnd(i + 9)]), ...Array.from({ length: 4 }, (_, i) => [-2.52 - 0.02 * i, -4.2 - 0.4 + i * 0.27]), ...Array.from({ length: 4 }, (_, i) => [2.52 + 0.02 * i, -4.2 - 0.4 + i * 0.27])], cfg, seed + 3, yg(0));
  }
  // ---- the giant pairs
  const slit = 0.45, ux = 1.2 + slit / 2;
  const pairUp = (p, side, thr, o = {}) => {
    const sx = side * ux, M = mat4(p.x, yg(p.x), p.z, p.yaw).multiply(mat4(sx, 0, 0, 0, o.tip ?? 0, o.tilt ?? 0)), hh = p.h - yg(p.x), cx = p.x + sx * Math.cos(p.yaw * DEG), cz = p.z - sx * Math.sin(p.yaw * DEG);
    add(body, uprightSoup({ w: 2.4, d: 1.2, h: hh, look, seed: sk(p.x * 7 + side + 20), knobs: o.knobs ?? 0, knobX: o.knobX ?? 0, knobZ: o.knobZ ?? 0, tilt: 0.3 }), M, { seed: sk(p.x * 7 + side + 20), crease: today ? 62 : 40, gaps: -side, band: today && p.id === "55-56" ? 0 : 0.4 }, thr, upC(cx, cz, p.yaw, 2.4, 1.2, p.h));
  };
  const pairTop = (p, thr) => {
    add(tops, slabSoup({ w: 4.8, h: 1.0, d: 1.3, seed: sk(p.z * 3 + 41), look }), mat4(p.x, p.h, p.z, p.yaw), { seed: sk(p.z * 3 + 41), crease: today ? 62 : 40 }, thr, [rectCast(p.x, p.z, 2.4, 0.65, p.yaw, p.h, p.h + 1.0)]);
  };
  const flatSlab = (cx, cz, yaw, sz, k, pieces, extra = {}) => {   // a lying stone at (cx, cz), long axis along yaw
    const { S: fs, foot } = fallenSoup({ l: sz[0], w: sz[1], t: sz[2], pieces, seed: sk(k), look: "today", sink: extra.sink ?? 0.18, broken: extra.broken }), M = mat4(cx, yg(cx) + (extra.lift ?? 0), cz, yaw, extra.tip ?? 0, extra.tilt ?? 0);
    add(body, fs, M, { seed: sk(k), crease: 62 }, 0, [rectCast(cx, cz, sz[0] / 2, sz[1] / 2, yaw, 0, sz[2])]);
    const e = M.elements; tufts(grass, foot.map(([x, z]) => [e[0] * x + e[8] * z + e[12], e[2] * x + e[10] * z + e[14]]), cfg, sk(k) + 5, extra.lift ?? 0);
  };
  PAIRS.forEach((p, i) => {
    if (!today) { const base = (0.2 * i) / 5, st = 0.2 / 15; pairUp(p, -1, base + st, { knobs: 0 }); pairUp(p, 1, base + 2 * st); pairTop(p, base + 3 * st); return; }
    if (p.id === "55-56") {
      pairUp(p, 1, 0, { knobs: 1, knobX: 0.2, knobZ: 0.3, tilt: 3, tip: 1.5 });
      const dir = 8, dx = Math.sin(dir * DEG), dz = Math.cos(dir * DEG), b0 = [-ux, -6.9];   // 55 fell from its foot toward +z, across the Altar Stone, and broke in two
      flatSlab(b0[0] + dx * 2.8, b0[1] + dz * 2.8, dir - 90, [5.6, 2.4, 1.2], 55, 1, { sink: 0.1, lift: 0.34, tip: -3, broken: [false, true] });
      flatSlab(b0[0] + dx * 7.475, b0[1] + dz * 7.475, dir - 90 - 3, [3.25, 2.4, 1.2], 56, 1, { sink: 0.2, broken: [true, false] });
      flatSlab(3.4, -0.9, 98, [4.8, 1.3, 1.0], 57, 1, { sink: 0.15 });
      return;
    }
    if (p.id === "59-60") {
      pairUp(p, 1, 0, { knobs: 0, tilt: 1.2 });
      const lx = Math.cos(p.yaw * DEG) * -ux, lz = -Math.sin(p.yaw * DEG) * -ux, dir = p.yaw + 14, ex = Math.sin(dir * DEG), ez = Math.cos(dir * DEG);
      flatSlab(p.x + lx + ex * 2.9, p.z + lz + ez * 2.9, dir - 90, [5.6, 2.4, 1.2], 59, 3, { sink: 0.15 });
      return;
    }
    pairUp(p, -1, 0); pairUp(p, 1, 0); pairTop(p, 0);
  });
  // ---- the circle
  const STAND = new Set([1, 2, 3, 4, 5, 6, 7, 10, 11, 16, 21, 22, 23, 27, 28, 29, 30]), FALL = [8, 9, 12, 14, 15, 19, 25, 26], TOPS = new Set([30, 1, 2, 4, 6, 21]);
  for (let n = 1; n <= 30; n++) {
    if (gapU.has(n) || (today && !STAND.has(n) && !FALL.includes(n))) continue;
    const [x, z, yaw] = SH_STONES_PARTS.stone(n), thr = nowThr(0.2, 0.7, n - 1, 30);
    if (today && !STAND.has(n)) {   // lying where it fell: outward or inward, a little off the radius, sunk
      const a = 6 + 12 * (n - 1), out = rnd(sk(n) * 1.3) < 0.55 ? 1 : -1, dir = (a + (rnd(sk(n) * 2.1) - 0.5) * 60) * DEG, dx = -Math.sin(dir) * out, dz = Math.cos(dir) * out, len = 4.5;
      flatSlab(x + dx * len * 0.52, z + dz * len * 0.52, Math.atan2(-dz, dx) / DEG, [len, 2.1, 1.1], 200 + n, n === 12 || n === 25 ? 2 : 1, { sink: 0.2 });
      continue;
    }
    const half = today && n === 11, w = half ? 1.05 : 2.1, h = half ? 2.4 : 4.1, lean = today ? (rnd(sk(n) * 3.7) - 0.5) * 2.4 : 0, hh = h - (half ? 0 : yg(x));
    add(body, uprightSoup({ w, d: 1.1, h: hh, look, seed: sk(n), knobs: half ? 0 : 2, worn: true, tilt: half ? 0.7 : 0.25, vary: true }), mat4(x, yg(x), z, yaw, lean * 0.6, lean), { seed: sk(n), crease: today ? 62 : 40, gaps: 2, band: !half && (!today || TOPS.has(n)) ? 0.4 : 0 }, thr, upC(x, z, yaw, w, 1.1, h));
  }
  for (let n = 1; n <= 30; n++) {
    if (gapT.has(n) || (today && !TOPS.has(n))) continue;
    const a = 12 * n, x = -RING * Math.sin(a * DEG), z = RING * Math.cos(a * DEG);
    add(tops, lintelSoup({ look, seed: sk(300 + n), curve: true }), mat4(x, 4.1, z, 180 - a), { seed: sk(300 + n), crease: today ? 62 : 38 }, nowThr(0.7, 0.95, n - 1, 30), [rectCast(x, z, 1.625, 0.5, 180 - a, 4.1, TOP)]);
  }
  // ---- the bluestones: an outer ring of 60 rough pillars at r 11.8, an inner oval of 19 dressed ones inside the horseshoe
  const nb = 60 + 19, thrB = (k) => (today ? 0 : 0.95 + (0.05 * (k + 1)) / nb);
  for (let k = 0; k < 60; k++) {
    const a = k * 6 + 3, x = -11.8 * Math.sin(a * DEG), z = 11.8 * Math.cos(a * DEG), yaw = 180 - a + (rnd(sk(500 + k)) - 0.5) * 24, hb = 1.6 + 0.4 * rnd(sk(520 + k));
    let w = 0.9 * (0.9 + 0.2 * rnd(sk(540 + k))), h = hb, d = 0.5 * (0.9 + 0.2 * rnd(sk(560 + k)));
    if (today) { if (rnd(sk(580 + k)) > 0.34) continue; if (rnd(sk(600 + k)) < 0.42) h = 0.3 + 0.5 * rnd(sk(620 + k)); }
    add(blue, pillarSoup({ w, h, d, seed: sk(500 + k), today, rows: 8 }), mat4(x, yg(x), z, yaw, (rnd(sk(640 + k)) - 0.5) * 8.5, (rnd(sk(660 + k)) - 0.5) * 8.5), { seed: sk(500 + k), sm: 2, crease: 60 }, thrB(k), [rectCast(x, z, w / 2, d / 2, yaw, 0, h)]);
  }
  for (let k = 0; k < 19; k++) {
    const ph = (-150 + (300 * (k + 0.5)) / 19) * DEG, x = 4.9 * Math.sin(ph), z = 0.3 - 5.0 * Math.cos(ph), yaw = Math.atan2(-x, -z) / DEG;
    if (Math.abs(x) < 2.9 && Math.abs(z + 4.2) < 1.3) continue;
    if (today && ![1, 4, 7, 11, 14, 17].includes(k)) continue;
    const h = 2.0 + 0.4 * rnd(sk(700 + k));
    add(blue, dressedSoup({ w: 0.6, d: 0.6, h, seed: sk(700 + k), today }), mat4(x, yg(x), z, yaw, 0, 0), { seed: sk(700 + k), sm: 2, crease: 50 }, thrB(60 + k), [rectCast(x, z, 0.3, 0.3, yaw, 0, h)]);
  }
  if (today) flatSlab(0, 44, 90 + 8, [6.4, 2.1, 0.9], 900, 1, { sink: 0.61 });
  return { body, tops, grass, blue, altar, items };
}

// ---------------------------------------------------------------------------------------------------------------
// shared finish of every kind: groups [{ key (sheet), A (accumulator), solid }], the decal's casters (a function of the prop's y), grass
function finish(P, S, cfg, groups, castFn, grassA, o = {}) {
  const mats = [], metas = groups.filter((g) => g.A.count).map((g) => { const m = mkMat(g.key); mats.push(m); const mesh = place(P.whole, geoOf(g.A), m, g.solid); return { g, mesh }; });
  const grass = grassA && grassA.count ? place(P.whole, geoOf(grassA), grassMat(), false) : null;
  if (grass) mats.push(grass.material);
  const dec = S.shadow === false ? null : shadowLayer(P.whole, o.ext ?? 42, o.size ?? 512, cfg);
  let last = "";
  const upd = (ps) => {
    const dusk = clamp(num(ps, S, "dusk", 0)), rot = ps.rot || 0, y = ps.y ?? S.y ?? 0, dm = duskMul(dusk);
    for (const m of mats) m.color.setRGB(dm[0], dm[1], dm[2]);
    const vis = o.visible ? o.visible(ps) : null; if (o.onVisible) o.onVisible(vis, metas);
    if (dec) {
      const k = `${vis ? vis.key : ""}|${rot}|${y.toFixed(3)}|${dusk.toFixed(2)}`;
      if (k !== last) { last = k; dec.draw(castFn(y, vis), rot, dusk); dec.mesh.material.opacity = 1 - 0.35 * dusk; }
      dec.place(rot, y, cfg.slope);
    }
  };
  upd({});
  return { grip: o.grip ?? 0, apply: upd, meshes: metas.map((m) => m.mesh) };
}
const single = (kind, key, solid = true) => (P) => {
  const S = P.spec, cfg = cfgOf(S), A = gAcc(), G = gAcc(), r = kind(P, S, cfg, A, G);
  return finish(P, S, cfg, [{ key: r.key ?? key(S), A, solid }], r.cast, G, { grip: r.top });
};
const eraOf = (S) => (S.look === "today" || S.era === "today" ? "today" : "new");

export const SH_STONES_KINDS = {
  stonehenge(P) {
    const S = P.spec, cfg = cfgOf(S), today = S.era === "today", M = buildMonument(P, S, cfg), key = today ? "today" : "new", seedBase = S.seed ?? 1;
    void seedBase;
    const groups = [{ key, A: M.body, solid: false }, { key, A: M.tops, solid: true }, { key: today ? "blueToday" : "blue", A: M.blue, solid: false }, { key: "altar", A: M.altar, solid: false }];
    const allItems = M.items;
    const r = finish(P, S, cfg, groups, (y, vis) => vis.items.flatMap((it) => it.cast), M.grass, {
      ext: 64, size: 2048,
      visible: (ps) => { const built = clamp(num(ps, S, "built", 1)), items = allItems.filter((it) => built >= it.thr - 1e-6); return { items, key: items.length }; },
      onVisible: (vis, metas) => { for (const { g, mesh } of metas) { const end = vis.items.reduce((m, it) => (it.A === g.A ? Math.max(m, it.end) : m), 0); mesh.geometry.setDrawRange(0, end); mesh.visible = end > 0; } },
    });
    P.whole.userData.triangles = (M.body.count + M.tops.count + M.blue.count + M.altar.count + M.grass.count) / 3;
    return r;
  },

  sarsen: single((P, S, cfg, A) => {
    const [w, h, d] = S.size ?? [2.1, 4.1, 1.1], look = S.look === "today" ? "today" : "new", seed = S.seed ?? 1;
    emit(A, uprightSoup({ w, d, h, look, seed, under: S.under ?? 0, knobs: S.knobs ?? 2, worn: false }), new THREE.Matrix4(), { seed, cfg: { ...cfg, today: look === "today" }, crease: look === "today" ? 62 : 40 });
    return { key: look, top: h, cast: (y) => [rectCast(0, 0, w / 2, d / 2, 0, y, y + h)] };
  }, (S) => (S.look === "today" ? "today" : "new")),

  toplintel: single((P, S, cfg, A) => {
    const [L, H, W] = S.size ?? [3.25, 0.8, 1.0], look = S.look === "today" ? "today" : "new", seed = S.seed ?? 1;
    emit(A, lintelSoup({ L, H, W, look, seed, curve: S.curve !== false, holeX: S.holeX, ridge: S.ridge, groove: S.groove }), new THREE.Matrix4(), { seed, cfg: { ...cfg, today: look === "today" }, crease: look === "today" ? 62 : 38 });
    return { key: look, top: H, cast: (y) => [rectCast(0, 0, L / 2, W / 2, 0, y, y + H)] };
  }, (S) => (S.look === "today" ? "today" : "new")),

  giantpair: single((P, S, cfg, A) => {
    const h = S.h ?? 6.7, slit = S.slit ?? 0.5, look = S.look === "today" ? "today" : "new", seed = S.seed ?? 1, ux = 1.2 + slit / 2, cf = { ...cfg, today: look === "today" }, c = [];
    for (const side of [-1, 1]) { emit(A, uprightSoup({ w: 2.4, d: 1.2, h, look, seed: seed * 7 + side, under: S.under ?? 0, knobs: 0 }), mat4(side * ux, 0, 0), { seed: seed * 7 + side, cfg: cf, crease: look === "today" ? 62 : 40 }); c.push((y) => rectCast(side * ux, 0, 1.2, 0.6, 0, y, y + h)); }
    if (S.lintel !== false) { emit(A, slabSoup({ w: 4.8, h: 1.0, d: 1.3, seed: seed * 3 + 1, look }), mat4(0, h, 0), { seed: seed * 3 + 1, cfg: cf, crease: look === "today" ? 62 : 40 }); c.push((y) => rectCast(0, 0, 2.4, 0.65, 0, y + h, y + h + 1)); }
    return { key: look, top: h + (S.lintel !== false ? 1 : 0), cast: (y) => c.map((f) => f(y)) };
  }, (S) => (S.look === "today" ? "today" : "new")),

  bluestone: single((P, S, cfg, A) => {
    const dressed = S.look === "dressed", today = S.era === "today", [w, h, d] = S.size ?? (dressed ? [0.6, 2.2, 0.6] : [0.9, 1.8, 0.5]), seed = S.seed ?? 1;
    emit(A, dressed ? dressedSoup({ w, h, d, seed, today }) : pillarSoup({ w, h, d, seed, today, rows: 11 }), dressed ? new THREE.Matrix4() : mat4(0, 0, 0, 0, (rnd(seed * 1.3) - 0.5) * 8.5, (rnd(seed * 1.7) - 0.5) * 8.5), { seed, sm: 2, cfg: { ...cfg, today }, crease: 55 });
    return { key: today ? "blueToday" : "blue", top: h, cast: (y) => [rectCast(0, 0, w / 2, d / 2, 0, y, y + h)] };
  }, () => "blue"),

  altarstone: single((P, S, cfg, A, G) => {
    const [w, h, d] = S.size ?? [4.9, 0.5, 1.0], look = S.look === "today" || (S.buried ?? 0) > 0.3 ? "today" : "new", seed = S.seed ?? 1, buried = clamp(S.buried ?? 0), top = h * (1 - buried);
    emit(A, slabSoup({ w, h, d, seed, look }), mat4(0, -buried * h, 0), { seed, sm: 2, cfg: { ...cfg, today: look === "today" }, crease: 50 });
    if (buried > 0) { const pts = []; for (let i = 0; i <= Math.round(w / 0.3); i++) { const x = -w / 2 + (i * w) / Math.round(w / 0.3); pts.push([x, d / 2 + 0.03], [x, -d / 2 - 0.03]); } for (let i = 0; i < 4; i++) pts.push([-w / 2 - 0.03, -d / 2 + (i + 0.5) * d / 4], [w / 2 + 0.03, -d / 2 + (i + 0.5) * d / 4]); tufts(G, pts, cfg, seed + 3); }
    return { key: "altar", top, cast: (y) => [rectCast(0, 0, w / 2, d / 2, 0, y, y + top)] };
  }, () => "altar"),

  heelstone: single((P, S, cfg, A) => {
    const today = S.era === "today", seed = S.seed ?? 1, lean = S.lean ?? 20, h = 4.7;
    emit(A, pillarSoup({ w: 2.4, h, d: 1.9, seed: seed + 11, today, rows: 17, rough: 0.3, taper: 0.5 }), mat4(0, 0, 0, 0, -lean), { seed: seed + 11, cfg: { ...cfg, today }, crease: 66, sm: 4 });
    const dz = -h * Math.sin(lean * DEG);
    return { key: today ? "today" : "newrough", top: h * Math.cos(lean * DEG), cast: (y) => [rectCast(0, 0, 1.2, 0.95, 0, y, y + 2.2 * Math.cos(lean * DEG)), rectCast(0, dz * 0.55, 0.9, 0.7, 0, y + 2.2, y + h * Math.cos(lean * DEG))] };
  }, (S) => (S.era === "today" ? "today" : "newrough")),

  fallensarsen: single((P, S, cfg, A, G) => {
    const [l, w, t] = S.size ?? [4.7, 2.1, 1.1], look = S.look === "new" ? "new" : "today", seed = S.seed ?? 1, { S: soup, foot } = fallenSoup({ l, w, t, pieces: S.pieces ?? 1, seed, look, sink: S.sink ?? 0.2 });
    emit(A, soup, new THREE.Matrix4(), { seed, cfg: { ...cfg, today: look === "today" }, crease: 62 });
    tufts(G, foot, cfg, seed + 5);
    return { key: look, top: t, cast: (y) => [rectCast(0, 0, l / 2, w / 2, 0, y, y + t)] };
  }, (S) => (S.look === "new" ? "new" : "today")),
};
export const SH_STONES_GRIPS = {};
