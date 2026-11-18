import * as THREE from "three";
import { clamp } from "./util.js";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P2: the STROKE WRITER and the two notebooks (twist 3: "MASH = 41. WHY?").
// Design: storyboards/series/happiness/03-happiness-score/DESIGN.md section 6 (notebooks), section 1 + open question 6 (the DON'T KEEP lettering). Panels 05, 06, 22, 26, 27, 28.
// Metres, y up, front +z. Nothing random: every wobble is a hash of (seed, glyph index, stroke, position), so a text with the same keys draws the same strokes on every frame, machine and shard.
// Handwriting is drawn by the engine, not a font. Exports PAPER_KINDS, PAPER_GRIPS and the writer (below). Registry line for props3d.js (the director adds it):
//   import { PAPER_KINDS, PAPER_GRIPS } from "./props-score-paper.js"; Object.assign(KINDS, PAPER_KINDS); Object.assign(GRIPS, PAPER_GRIPS);
//
// ---------------------------------------------------------------------------------------------------------------- the stroke writer (pure functions)
// Glyph table (capitals only; lowercase is read as capital; an unknown character THROWS, so a typo is loud): A-Z, 0-9, = . ? ' - > , ! : + / space,
// "#" a hand-drawn box (0.7 high) and the tick "✓" (draw it over the box at the same origin: the ticked box). 1-5 strokes a glyph, drawn in a unit cell (cap height 1).
//   layoutText(text, o) -> { strokes, w, h, height }   strokes: [[ [x, y], ... ], ...] in METRES, origin = the baseline's left end, x right, y up. o (all optional):
//     height 0.025   cap height (m)                      slant 4        degrees the letters lean right (negative: left)
//     jitter 0.02    wobble amplitude, fraction of height (a smooth along-stroke wobble, plus a small turn of each letter; the design's "jitter %")
//     wander 0       baseline drift, fraction of height  (a slow wave along the line; the child's hand: 0.03)
//     hvar 0         letter height +-fraction (child: 0.12)    gap 0.12  letter gap (fraction of height)    seed 1   (any number: another hand)
//     fitW           a max width in metres: the height shrinks to fit (returned in `height`; the layout is exactly proportional, so a smaller height is the same writing)
//   wobble(points, {seed, key, amp, step}) -> points      the same shaky-pencil resample + displacement for any polyline (the drawing uses it)
//   underline(w, o) -> strokes   twice-underline (o.count 2, o.height, o.seed)       crossOut(w, h, o) -> strokes   a zigzag strike through a line w x h
//   scribbleLine(w, h, o) -> strokes   an unreadable line of "handwriting" w wide, letters h tall (a child's rows 4-9)
//   strokeLength(strokes), takeLength(strokes, L) -> the first L metres of ink (the last stroke cut), for writing a line in time
// Canvas (the browser; ppm = pixels per metre, (x0, y0) = the baseline's left end in pixels, y grows down):
//   drawStrokes(ctx, strokes, { x0, y0, ppm, color, width, alpha 1, mode "pencil" | "brush" })   pencil = a soft wide pass plus a thin dark core; brush = a solid pass
//     plus 5 bristle streaks (light and dark), for the DON'T KEEP lettering. width in metres.
//   inkText(ctx, text, { x0, y0, ppm, color, width, mode, ...layout keys })   layoutText + drawStrokes in one call; returns the layout.
//   brushText(ctx, lines, { cx, cy, ppm, fitW, fitH, height, color "#f4efe4", ... })   the DON'T KEEP lettering, for props-score.js keepbox's kraftFront (its canvas is 1024 px
//     across 0.62 m, so ppm = 1024 / 0.62 = 1651.6; the patch is 0.34 x 0.13, its middle is cx = W/2 + (-0.10) * ppm, cy = H - 0.15 * ppm): lines = ["DON'T", "KEEP"] (two lines,
//     centred on (cx, cy), each line's cap height fitted so the block fits fitW x fitH, e.g. 0.30 x 0.105; line pitch 1.35 x height; stroke width 0.15 x height; brushed capitals,
//     slant -2, jitter 0.035, wander 0.03, hvar 0.06). Call it after the red patch is painted: `brushText(x, ["DON'T", "KEEP"], { cx, cy, ppm: pm, fitW: 0.30, fitH: 0.105 })`.
//     (props-score.js is P1's file: this module changes nothing there; the director or P1 imports brushText and adds the one call.)
//
// ---------------------------------------------------------------------------------------------------------------- kinds
//   spudpad     Spud's detective pad (05, 06, 22). A top-spiral reporter's pad 0.19 (x) x 0.26 (y) x 0.018 (z), standing upright, the PAGE on +z (it faces the holder; the
//               over-the-shoulder camera of 05 sees the page from behind him). Origin: the middle of the BOTTOM edge, z the middle of the thickness (the same frame as a phone:
//               grips.phone hold on the side edge, SIZE.spudpad = { w 0.19, h 0.26, t 0.018 }; the design's L hand "by its lower edge": call grips.phone(c, "spud", PAD,
//               { side: "L", height: 0.2 }) = the glove on the left edge, 5 cm up from the bottom). 14 wire loops #8c8c8c over the top edge (they stand 6.5 mm above it, so the
//               pad is 0.267 tall with them), kraft back #b59a6c (the cover folded back, 0.006), cream pages #f4ecd8 0.012 thick, 9 faint rules #c9d3dc every 0.0235 from 0.045 below
//               the top. Writing: pencil #3b3b3b, capitals, stroke 0.004, jitter 2 %, slant 4. Triangles about 0.9k (the 14 loops are 0.84k of it; the design said 0.5k).
//     spec: lines   (state 1) array of strings, default ["MASH = 88. WHY?"]; line 1 is written on the first rule, as tall as fits the page width (0.026 would be wider than the
//                   0.19 page: MASH = 88. WHY? comes out about 0.022 tall), underlined twice. More strings go on the next rules (0.017 tall).
//           lines2  (state 2, from 22) array of strings, default ["MASH = 86", "SHE SAID 91", "MASH = 88 ??"]: each written on rules 3, 4, 5 and CROSSED OUT with a zigzag,
//                   then "88 -> 84 ?" (spec.note, 0.024 tall) on rule 7.
//           write   (a standard key) THE INK: 0 = the blank page (the default! set write: 1 in the spec for the finished state 1), 0..1 writes state 1 in pencil order (the
//                   words, then the two underlines), 1..2 writes state 2 on top of it (so a dur-0 set of 2 = the 22 page, a tween 1 -> 2 over 1.5 s writes it). Redrawn in
//                   1/60 steps, so a tween is smooth. seed (default 3) is the hand.
//   mashbook    Mash's old school exercise book (26-28, 30). 0.20 (x) x 0.27 (y) x 0.022 (z) closed; open 0..1 (a standard key; start spec.open, default 0) swings the
//               front cover and its half of the pages 180 degrees about the spine, to 0.40 wide x 0.27 x 0.011 flat. Frame: closed, the book is centred on x 0, front cover +z;
//               open, the spine is x 0 (the book slides 0.10 as it opens, so the middle stays put), the pages face +z, and the left page is -0.2..0. Origin: the middle of the
//               BOTTOM edge, z the middle of the thickness (closed or open). Lying open on the floor boards for 27: tip -90 (top toward -z, pages up), y = floor + 0.0055 (the back
//               cover's underside touches). Held open at the chest (28): grips.box(c, "spud", BOOK) = both gloves on the outer edges, 0.245 each side of the origin
//               (SIZE.mashbook = { w 0.40, h 0.27, d 0.011 }: valid for open = 1; a closed book carried in one hand is grips.phone's problem, its w 0.2). Cover navy-grey
//               #3d4654 worn to #6e7683 at 4 corners and the spine edge, a BLANK paper label 0.10 x 0.05 #d9cfb8 (front), 5 scratches, a cloth spine strip; pages #efe6cf, foxed
//               edges #d8c9a4, rules #bcc6cf. LEFT page: a pencil drawing, about 50 strokes of the same writer: a potato with one leaf on a bicycle, on a grass line, 3 clouds.
//               RIGHT page: "MASH = 41. WHY?" at the top (0.022 tall, the design) and 9 ruled rows, each with a ticked box on the right: the first 3 read "SPUD'S JUMPER",
//               "SPUD'S BIKE", "SPUD'S JOKES" (0.016 tall), the other 6 are scribble. A child's hand: pencil #55504a, stroke 0.005, jitter 6 %, baseline wander 3 %, letters +-12 %.
//               The cover and pages are drawn once; the page textures are 1024 x 1382 (5120 px/m: the title is 112 px tall, the row text 82 px).
//     spec: lines   array of strings: [title, row 1, row 2, row 3], default ["MASH = 41. WHY?", "SPUD'S JUMPER", "SPUD'S BIKE", "SPUD'S JOKES"]; seed (default 7) is the hand.
// Both are solid and light, never fixed. Hold names (PAPER_GRIPS, in the prop's own frame): spudpad.edgeL = [-0.0975, 0.05, -0.01], .edgeR = [0.0975, 0.05, -0.01], .top = [0, 0.26, 0];
// mashbook.edgeL = [-0.2, 0.135, 0], .edgeR = [0.2, 0.135, 0] (open = 1), .middle = [0, 0.135, 0].

const DEG = Math.PI / 180;
const hash = (a, b = 0, c = 0, d = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + d * 191.3 + 17.9) * 43758.5453; return x - Math.floor(x); };
// smooth 1-D noise in -1..1: knot values hashed from (seed, k, integer u), cosine-eased between
const snoise = (seed, k, u) => { const i = Math.floor(u), f = u - i, s = (1 - Math.cos(f * Math.PI)) / 2; return (hash(seed, k, i) * (1 - s) + hash(seed, k, i + 1) * s) * 2 - 1; };
const arc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / n) * DEG; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const dot = (x, y, r = 0.045) => [[x, y + r], [x + r, y], [x, y - r], [x - r, y], [x, y + r]];

// ------------------------------------------------------------------------------------------------ the glyph table: strokes in a cell, x 0..w, y 0..1
const GLYPHS = {
  A: { w: 0.6, s: [[[0, 0], [0.3, 1], [0.6, 0]], [[0.11, 0.36], [0.49, 0.36]]] },
  B: { w: 0.5, s: [[[0, 0], [0, 1]], [[0, 1], ...arc(0.26, 0.76, 0.22, 0.24, 90, -90, 5), [0, 0.52]], [[0, 0.52], [0.28, 0.52], ...arc(0.28, 0.26, 0.22, 0.26, 90, -90, 5), [0, 0]]] },
  C: { w: 0.5, s: [arc(0.26, 0.5, 0.25, 0.5, 40, 320, 10)] },
  D: { w: 0.52, s: [[[0, 0], [0, 1]], [[0, 1], [0.18, 1], ...arc(0.18, 0.5, 0.34, 0.5, 90, -90, 8), [0, 0]]] },
  E: { w: 0.45, s: [[[0.45, 1], [0, 1], [0, 0], [0.45, 0]], [[0, 0.52], [0.36, 0.52]]] },
  F: { w: 0.42, s: [[[0, 0], [0, 1], [0.42, 1]], [[0, 0.52], [0.34, 0.52]]] },
  G: { w: 0.54, s: [[...arc(0.27, 0.5, 0.27, 0.5, 45, 360, 11), [0.3, 0.5]]] },
  H: { w: 0.5, s: [[[0, 0], [0, 1]], [[0.5, 0], [0.5, 1]], [[0, 0.5], [0.5, 0.5]]] },
  I: { w: 0.22, s: [[[0.11, 0], [0.11, 1]], [[0.02, 1], [0.2, 1]], [[0.02, 0], [0.2, 0]]] },
  J: { w: 0.4, s: [[[0.4, 1], [0.4, 0.25], ...arc(0.2, 0.25, 0.2, 0.25, 0, -180, 6)]] },
  K: { w: 0.5, s: [[[0, 0], [0, 1]], [[0.5, 1], [0, 0.4]], [[0.12, 0.55], [0.52, 0]]] },
  L: { w: 0.42, s: [[[0, 1], [0, 0], [0.42, 0]]] },
  M: { w: 0.72, s: [[[0, 0], [0, 1], [0.36, 0.38], [0.72, 1], [0.72, 0]]] },
  N: { w: 0.55, s: [[[0, 0], [0, 1], [0.55, 0], [0.55, 1]]] },
  O: { w: 0.55, s: [arc(0.275, 0.5, 0.275, 0.5, 90, 450, 14)] },
  P: { w: 0.48, s: [[[0, 0], [0, 1]], [[0, 1], [0.26, 1], ...arc(0.26, 0.74, 0.22, 0.26, 90, -90, 6), [0, 0.48]]] },
  Q: { w: 0.55, s: [arc(0.275, 0.5, 0.275, 0.5, 90, 450, 14), [[0.34, 0.2], [0.58, -0.06]]] },
  R: { w: 0.5, s: [[[0, 0], [0, 1]], [[0, 1], [0.26, 1], ...arc(0.26, 0.74, 0.22, 0.26, 90, -90, 6), [0, 0.48]], [[0.24, 0.48], [0.5, 0]]] },
  S: { w: 0.46, s: [[[0.44, 0.86], [0.34, 0.99], [0.18, 1], [0.05, 0.9], [0.04, 0.72], [0.14, 0.58], [0.3, 0.5], [0.42, 0.38], [0.43, 0.2], [0.34, 0.04], [0.2, 0], [0.06, 0.04], [0.01, 0.14]]] },
  T: { w: 0.5, s: [[[0, 1], [0.5, 1]], [[0.25, 1], [0.25, 0]]] },
  U: { w: 0.52, s: [[[0, 1], [0, 0.28], ...arc(0.26, 0.28, 0.26, 0.28, 180, 360, 8), [0.52, 1]]] },
  V: { w: 0.56, s: [[[0, 1], [0.28, 0], [0.56, 1]]] },
  W: { w: 0.82, s: [[[0, 1], [0.2, 0], [0.41, 0.65], [0.62, 0], [0.82, 1]]] },
  X: { w: 0.52, s: [[[0, 1], [0.52, 0]], [[0.52, 1], [0, 0]]] },
  Y: { w: 0.54, s: [[[0, 1], [0.27, 0.5], [0.54, 1]], [[0.27, 0.5], [0.27, 0]]] },
  Z: { w: 0.48, s: [[[0, 1], [0.48, 1], [0, 0], [0.48, 0]]] },
  0: { w: 0.44, s: [arc(0.22, 0.5, 0.22, 0.5, 90, 450, 12)] },
  1: { w: 0.3, s: [[[0, 0.76], [0.2, 1], [0.2, 0]]] },
  2: { w: 0.44, s: [[[0.01, 0.78], [0.1, 0.95], [0.24, 1], [0.38, 0.94], [0.43, 0.78], [0.34, 0.58], [0, 0], [0.44, 0]]] },
  3: { w: 0.44, s: [[[0.02, 0.9], [0.16, 1], [0.34, 0.98], [0.42, 0.82], [0.34, 0.62], [0.16, 0.54], [0.36, 0.48], [0.44, 0.3], [0.38, 0.08], [0.2, 0], [0.03, 0.1]]] },
  4: { w: 0.46, s: [[[0.34, 1], [0, 0.32], [0.46, 0.32]], [[0.34, 0.64], [0.34, 0]]] },
  5: { w: 0.44, s: [[[0.42, 1], [0.06, 1], [0.02, 0.56], [0.2, 0.62], [0.36, 0.56], [0.43, 0.36], [0.38, 0.12], [0.22, 0], [0.04, 0.08]]] },
  6: { w: 0.44, s: [[[0.38, 0.96], [0.22, 1], [0.08, 0.84], [0.01, 0.5], [0.03, 0.22], [0.14, 0.02], [0.3, 0.02], [0.42, 0.2], [0.38, 0.46], [0.22, 0.54], [0.07, 0.42]]] },
  7: { w: 0.44, s: [[[0, 1], [0.44, 1], [0.16, 0]]] },
  8: { w: 0.44, s: [[...arc(0.22, 0.77, 0.17, 0.24, -90, 270, 10), ...arc(0.22, 0.26, 0.21, 0.26, 90, -270, 12)]] },
  9: { w: 0.44, s: [[[0.42, 0.58], [0.3, 0.48], [0.14, 0.5], [0.04, 0.64], [0.05, 0.88], [0.22, 1], [0.38, 0.9], [0.43, 0.62], [0.4, 0.28], [0.28, 0.06], [0.08, 0.02]]] },
  "=": { w: 0.44, s: [[[0, 0.64], [0.44, 0.64]], [[0, 0.34], [0.44, 0.34]]] },
  ".": { w: 0.12, s: [dot(0.06, 0.04)] },
  "?": { w: 0.44, s: [[[0.01, 0.8], [0.08, 0.96], [0.24, 1], [0.38, 0.92], [0.4, 0.74], [0.22, 0.56], [0.22, 0.36]], dot(0.22, 0.04)] },
  "'": { w: 0.1, s: [[[0.06, 1], [0.04, 0.7]]] },
  "-": { w: 0.34, s: [[[0, 0.5], [0.34, 0.5]]] },
  ">": { w: 0.44, s: [[[0, 0.82], [0.44, 0.5], [0, 0.18]]] },
  ",": { w: 0.12, s: [[[0.07, 0.08], [0.02, -0.14]]] },
  "!": { w: 0.1, s: [[[0.05, 1], [0.05, 0.3]], dot(0.05, 0.04)] },
  ":": { w: 0.1, s: [dot(0.05, 0.7), dot(0.05, 0.1)] },
  "+": { w: 0.44, s: [[[0, 0.5], [0.44, 0.5]], [[0.22, 0.28], [0.22, 0.72]]] },
  "/": { w: 0.36, s: [[[0, 0], [0.36, 1]]] },
  "#": { w: 0.7, s: [[[0, 0], [0.7, 0], [0.7, 0.7], [0, 0.7], [0, 0.03]]] },
  "✓": { w: 0.8, s: [[[0, 0.45], [0.22, 0.12], [0.78, 1.0]]] },
  " ": { w: 0.28, s: [] },
};

// a polyline resampled every `step` (units of the cell) with its along-stroke parameter u (units)
function resample(pts, step) {
  const out = []; let u = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / step));
    for (let j = 0; j < n; j++) out.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, u + (len * j) / n]);
    u += len;
  }
  const l = pts[pts.length - 1]; out.push([l[0], l[1], u]);
  return out;
}

// the shaky pencil for any polyline (metres): resample every `step`, then displace by smooth noise of amplitude `amp` (a wobble, not a fizz: a knot every ~0.4 cm)
export function wobble(points, { seed = 1, key = 0, amp = 0.0005, step = 0.002, knot = 0.004 } = {}) {
  if (points.length === 1) return [points[0].slice(0, 2)];
  return resample(points, step).map(([x, y, u]) => [x + snoise(seed * 3 + 1, key, u / knot) * amp, y + snoise(seed * 3 + 2, key, u / knot) * amp]);
}

export function layoutText(text, o = {}) {
  const { height = 0.025, slant = 4, jitter = 0.02, wander = 0, hvar = 0, gap = 0.12, seed = 1, fitW = null } = o;
  const chars = [...String(text).toUpperCase()];
  const run = (H) => {
    const strokes = [], tan = Math.tan(slant * DEG); let x = 0;
    chars.forEach((ch, ci) => {
      const g = GLYPHS[ch]; if (!g) throw new Error(`stroke writer: no glyph for "${ch}" in "${text}"`);
      const hs = H * (1 + hvar * (2 * hash(seed, ci, 1) - 1)), by = wander * H * snoise(seed, 7, ci * 0.6), rot = (2 * hash(seed, ci, 2) - 1) * jitter * 0.9;
      const cr = Math.cos(rot), sr = Math.sin(rot);
      g.s.forEach((st, si) => {
        // wobble in the unit cell (amplitude jitter, since a cell is `height` tall), then scale, turn about the cell's foot, slant, place
        const pts = wobble(st, { seed: seed + 11, key: ci * 7 + si, amp: jitter, step: 0.1, knot: 0.45 });
        strokes.push(pts.map(([px, py]) => { const sx = px * hs, sy = py * hs, rx = sx * cr - sy * sr, ry = sx * sr + sy * cr; return [x + rx + ry * tan, by + ry]; }));
      });
      x += g.w * hs + gap * H;
    });
    return { strokes, w: Math.max(0, x - gap * H) };
  };
  let H = height, r = run(H);
  if (fitW && r.w > fitW) { H = (height * fitW) / r.w; r = run(H); }
  return { strokes: r.strokes, w: r.w, h: H, height: H };
}

export function underline(w, { height = 0.025, count = 2, seed = 1, drop = 0.18 } = {}) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const y = -height * (drop + 0.3 * i), x0 = (hash(seed, i, 5) - 0.5) * height * 0.3, x1 = w + (hash(seed, i, 6) - 0.3) * height * 0.4, tilt = (hash(seed, i, 7) - 0.5) * height * 0.12;
    out.push(wobble(i % 2 ? [[x1, y + tilt], [x0, y - tilt * 0.5]] : [[x0, y], [x1, y + tilt]], { seed: seed + 5, key: 90 + i, amp: height * 0.025, step: 0.003, knot: 0.012 }));
  }
  return out;
}

export function crossOut(w, h, { seed = 1 } = {}) {
  // a loose pencil strike: back and forth through the line's middle band, about one pass per 1.3 line heights, ends a little past the text
  const n = Math.max(2, Math.round(w / (h * 1.3))), pts = [[-0.12 * h, 0.4 * h + 0.1 * h * hash(seed, 0, 2)]];
  for (let i = 0; i <= n; i++) pts.push([(w * i) / n + (hash(seed, i, 3) - 0.5) * h * 0.4, (i % 2 ? 0.2 + 0.12 * hash(seed, i, 4) : 0.68 + 0.12 * hash(seed, i, 4)) * h]);
  pts.push([w + 0.12 * h, 0.5 * h]);
  return [wobble(pts, { seed: seed + 9, key: 120, amp: h * 0.03, step: 0.003, knot: 0.012 })];
}

export function scribbleLine(w, h, { seed = 1 } = {}) {
  const out = []; let x = 0, k = 0, pts = [[0, 0.1 * h]];
  const flush = () => { if (pts.length > 1) out.push(wobble(pts, { seed: seed + 3, key: 130 + out.length, amp: h * 0.03, step: 0.002, knot: 0.008 })); pts = []; };
  while (x < w) {
    const wl = (0.2 + 0.22 * hash(seed, k, 21)) * h, tall = hash(seed, k, 22) > 0.72;   // one "letter": an up-stroke and a rounded down-stroke; now and then a tall loop
    const top = (tall ? 0.95 : 0.35 + 0.3 * hash(seed, k, 23)) * h, bot = (hash(seed, k, 25) > 0.9 ? -0.25 : 0.04) * h;
    pts.push([x + wl * 0.3, top], [x + wl * 0.62, top * 0.8], [x + wl * 0.8, bot + 0.12 * h], [x + wl, bot]);
    x += wl; k++;
    if (hash(seed, k, 24) > 0.82 && x < w) { flush(); x += 0.4 * h; pts = [[x, 0.1 * h]]; }   // a word gap: the pencil lifts
  }
  flush();
  return out;
}

const segLen = (s) => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return l; };
export const strokeLength = (strokes) => strokes.reduce((a, s) => a + segLen(s), 0);
export function takeLength(strokes, L) {
  const out = [];
  for (const s of strokes) {
    const l = segLen(s);
    if (L >= l) { out.push(s); L -= l; if (L <= 0) break; continue; }
    if (L <= 0) break;
    const cut = [s[0]];
    for (let i = 1; i < s.length && L > 0; i++) { const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); if (d <= L) { cut.push(s[i]); L -= d; } else { const f = L / d; cut.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * f, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * f]); L = 0; } }
    if (cut.length > 1) out.push(cut);
    break;
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ canvas drawing
function pathOf(ctx, s, x0, y0, ppm, dx = 0, dy = 0) {
  const P = s.map(([x, y]) => [x0 + x * ppm + dx, y0 - y * ppm + dy]);
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  if (P.length === 1) { ctx.lineTo(P[0][0] + 0.01, P[0][1]); return; }
  for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
  ctx.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
}
export function drawStrokes(ctx, strokes, { x0 = 0, y0 = 0, ppm = 1000, color = "#3b3b3b", width = 0.004, alpha = 1, mode = "pencil" } = {}) {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = color;
  const wpx = width * ppm;
  for (const s of strokes) {
    if (!s.length) continue;
    if (mode === "brush") {
      ctx.globalAlpha = alpha; ctx.lineWidth = wpx; pathOf(ctx, s, x0, y0, ppm); ctx.stroke();
      // bristle streaks: five thin passes across the stroke, alternately lighter and darker, fixed offsets
      for (let k = -2; k <= 2; k++) { ctx.strokeStyle = k % 2 ? "rgba(255,255,255,0.55)" : "rgba(150,120,100,0.28)"; ctx.globalAlpha = alpha; ctx.lineWidth = wpx * 0.12; pathOf(ctx, s, x0, y0, ppm, 0, k * wpx * 0.2); ctx.stroke(); }
      ctx.strokeStyle = color;
    } else {
      ctx.globalAlpha = alpha * 0.72; ctx.lineWidth = wpx; pathOf(ctx, s, x0, y0, ppm); ctx.stroke();                       // the soft body of the line
      ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = wpx * 0.5; pathOf(ctx, s, x0, y0, ppm, wpx * 0.08, -wpx * 0.06); ctx.stroke();   // the dark core, a hair off
    }
  }
  ctx.restore();
}
export function inkText(ctx, text, o = {}) {
  const L = layoutText(text, o); drawStrokes(ctx, L.strokes, o); return L;
}
export function brushText(ctx, lines, { cx, cy, ppm, fitW = 0.3, fitH = 0.105, height = 0.05, color = "#f4efe4", seed = 31, pitch = 1.35 } = {}) {
  const o = { slant: -2, jitter: 0.035, wander: 0.03, hvar: 0.06, gap: 0.14, seed };
  // the tallest height at which every line fits the width and the block fits the height
  let H = Math.min(height, fitH / (1 + (lines.length - 1) * pitch));
  for (const t of lines) H = Math.min(H, layoutText(t, { ...o, height: H, fitW }).height);
  const block = H * (1 + (lines.length - 1) * pitch);
  lines.forEach((t, i) => {
    const L = layoutText(t, { ...o, height: H, seed: seed + i * 5 });
    const bx = cx - (L.w * ppm) / 2, by = cy - (block * ppm) / 2 + (H + i * pitch * H) * ppm;
    drawStrokes(ctx, L.strokes, { x0: bx, y0: by, ppm, color, width: 0.15 * H, mode: "brush" });
  });
}

// ------------------------------------------------------------------------------------------------ shared bits (house helpers)
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { tex: t, ctx: c.getContext("2d"), canvas: c }; }
const ink = (tex) => { tex.needsUpdate = true; };

export const PAPER_GRIPS = {
  spudpad: { edgeL: [-0.0975, 0.05, -0.01], edgeR: [0.0975, 0.05, -0.01], top: [0, 0.26, 0] },
  mashbook: { edgeL: [-0.2, 0.135, 0], edgeR: [0.2, 0.135, 0], middle: [0, 0.135, 0] },
};

// ------------------------------------------------------------------------------------------------ Spud's pad
const PAD = { w: 0.19, h: 0.26, t: 0.018, ppm: 5000, rule0: 0.045, pitch: 0.0235, x: 0.012, stroke: 0.004 };
const PAD_LINES = ["MASH = 88. WHY?"], PAD_LINES2 = ["MASH = 86", "SHE SAID 91", "MASH = 88 ??"];
// every stroke of both states, in pencil order: [{ strokes, set: 1|2 }...] in page metres from the page's top-left, y DOWN (converted to y-up baseline strokes by the caller)
function padInk(spec) {
  const seed = spec.seed ?? 3, lines = spec.lines || PAD_LINES, lines2 = spec.lines2 || PAD_LINES2, note = spec.note || "88 -> 84 ?";
  const rule = (i) => PAD.rule0 + PAD.pitch * i;
  const hand = { slant: 4, jitter: 0.02, gap: 0.12 };
  const set1 = [], set2 = [];
  const put = (set, text, i, o = {}, dx = 0) => {   // a line on rule i: strokes in page space, y down
    const L = layoutText(text, { ...hand, seed, ...o }), bx = PAD.x + dx, by = rule(i);
    const strokes = L.strokes.map((s) => s.map(([x, y]) => [bx + x, by - y]));
    set.push(...strokes.map((s) => ({ s })));
    return { L, bx, by };
  };
  lines.forEach((t, i) => {
    const first = i === 0, r = put(set1, t, i + 1, first ? { height: 0.026, fitW: PAD.w - 2 * PAD.x } : { height: 0.017, seed: seed + i }, 0);
    if (first) for (const s of underline(r.L.w, { height: r.L.h, seed })) set1.push({ s: s.map(([x, y]) => [r.bx + x, r.by - y]) });
  });
  lines2.forEach((t, i) => {
    const r = put(set2, t, 3 + i, { height: 0.017, seed: seed + 10 + i, fitW: PAD.w - 2 * PAD.x - 0.01 });
    for (const s of crossOut(r.L.w, r.L.h, { seed: seed + 20 + i })) set2.push({ s: s.map(([x, y]) => [r.bx + x, r.by - y]) });
  });
  put(set2, note, 7, { height: 0.024, seed: seed + 40, fitW: 0.15 }, 0.008);
  return [set1, set2];
}

function pad(P) {
  const spec = P.spec, { w, h, t, ppm } = PAD;
  const kraft = mat("#b59a6c", { roughness: 0.9 }), paper = mat("#f4ecd8", { roughness: 0.92 }), wire = mat("#8c8c8c", { roughness: 0.35, metalness: 0.6 });
  mesh(new THREE.BoxGeometry(w, h, 0.006), kraft, P.whole, 0, h / 2, -0.006);   // the cover folded back: z -0.009 .. -0.003
  mesh(new THREE.BoxGeometry(w - 0.002, h - 0.002, 0.012), paper, P.whole, 0, h / 2, 0.003);   // the sheets: z -0.003 .. 0.009
  // 14 wire loops through the top edge: rings in the y-z plane, 6.5 mm of each above the top
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0012, 3, 10), wire); r.rotation.y = Math.PI / 2 - 0.55; r.position.set(-0.0845 + (0.169 * i) / 13, h - 0.0035, 0); r.castShadow = true; P.whole.add(r); }
  const W = Math.round(w * ppm), H = Math.round(h * ppm), [set1, set2] = padInk(spec);
  const L1 = strokeLength(set1.map((q) => q.s)), L2 = strokeLength(set2.map((q) => q.s));
  const { tex, ctx } = canvasTex(W, H, () => {});
  const face = mesh(new THREE.PlaneGeometry(w - 0.002, h - 0.002), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92, map: tex }), P.whole, 0, h / 2, 0.0091); face.castShadow = false;
  let drawn = null;
  const paint = (q) => {   // q: the ink 0..2 (in 1/60 steps)
    ctx.fillStyle = "#f4ecd8"; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = i % 2 ? "rgba(200,180,140,0.10)" : "rgba(255,250,235,0.18)"; ctx.fillRect(hash(i, 1, 41) * W, hash(i, 2, 41) * H, 2 + hash(i, 3, 41) * 5, 1 + hash(i, 4, 41) * 2); }
    ctx.strokeStyle = "#c9d3dc"; ctx.lineWidth = 0.0007 * ppm;
    for (let i = 0; i < 9; i++) { const y = (PAD.rule0 + PAD.pitch * i) * ppm; ctx.beginPath(); ctx.moveTo(0, y + (i % 2) * 0.6); ctx.lineTo(W, y); ctx.stroke(); }
    const draw = (set, L) => { const sl = takeLength(set.map((s) => s.s), L); drawStrokes(ctx, sl.map((s) => s.map(([x, y]) => [x, -y])), { x0: 0, y0: 0, ppm, color: "#3b3b3b", width: PAD.stroke }); };
    draw(set1, Math.min(q, 1) * L1);
    if (q > 1) draw(set2, (q - 1) * L2);
    ink(tex);
  };
  paint(0); drawn = 0;
  return { grip: 0.13, apply(ps) { const q = Math.round(clamp(ps.write, 0, 2) * 60) / 60; if (q !== drawn) { drawn = q; paint(q); } } };
}

// ------------------------------------------------------------------------------------------------ Mash's book
const BOOK = { w: 0.2, h: 0.27, ppm: 5120, cover: 0.002, block: 0.009 };

function foxedPage(ctx, W, H, seed, spineRight) {
  ctx.fillStyle = "#efe6cf"; ctx.fillRect(0, 0, W, H);
  const e = 0.016 * BOOK.ppm;
  let g = ctx.createLinearGradient(0, 0, e, 0); g.addColorStop(0, "rgba(216,201,164,0.95)"); g.addColorStop(1, "rgba(216,201,164,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, e, H);
  g = ctx.createLinearGradient(W, 0, W - e, 0); g.addColorStop(0, "rgba(216,201,164,0.95)"); g.addColorStop(1, "rgba(216,201,164,0)"); ctx.fillStyle = g; ctx.fillRect(W - e, 0, e, H);
  g = ctx.createLinearGradient(0, 0, 0, e); g.addColorStop(0, "rgba(216,201,164,0.95)"); g.addColorStop(1, "rgba(216,201,164,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, e);
  g = ctx.createLinearGradient(0, H, 0, H - e); g.addColorStop(0, "rgba(216,201,164,0.95)"); g.addColorStop(1, "rgba(216,201,164,0)"); ctx.fillStyle = g; ctx.fillRect(0, H - e, W, e);
  // the gutter: a soft shade where the page curves into the spine
  const gx = spineRight ? W : 0, gd = spineRight ? -1 : 1;
  g = ctx.createLinearGradient(gx, 0, gx + gd * 0.03 * BOOK.ppm, 0); g.addColorStop(0, "rgba(120,100,70,0.30)"); g.addColorStop(1, "rgba(120,100,70,0)"); ctx.fillStyle = g; ctx.fillRect(spineRight ? W - 0.03 * BOOK.ppm : 0, 0, 0.03 * BOOK.ppm, H);
  // foxing: 70 hashed brown spots, most of them near the edges
  for (let i = 0; i < 70; i++) {
    const near = hash(seed, i, 51) < 0.7, x = near ? (hash(seed, i, 52) < 0.5 ? hash(seed, i, 53) * 0.05 : 1 - hash(seed, i, 53) * 0.05) * W : hash(seed, i, 54) * W, y = hash(seed, i, 55) * H, r = (0.0012 + 0.004 * hash(seed, i, 56)) * BOOK.ppm;
    ctx.fillStyle = `rgba(176,140,84,${0.07 + 0.12 * hash(seed, i, 57)})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.6 + 0.5 * hash(seed, i, 58)), hash(seed, i, 59) * 3, 0, 7); ctx.fill();
  }
}
function rules(ctx, W, y0, pitch, n) { ctx.strokeStyle = "#bcc6cf"; ctx.lineWidth = 0.0006 * BOOK.ppm; for (let i = 0; i < n; i++) { const y = (y0 + pitch * i) * BOOK.ppm; ctx.beginPath(); ctx.moveTo(0.008 * BOOK.ppm, y); ctx.lineTo(W - 0.008 * BOOK.ppm, y + (i % 2) * 0.5); ctx.stroke(); } }

// the pencil drawing on the left page: a potato with one leaf on a bicycle on a grass line, 3 clouds. Strokes in metres, y up from the page's bottom edge, x from its left edge
function bikeDrawing(seed) {
  const S = [], add = (pts, key, amp = 0.0006) => S.push(wobble(pts, { seed, key, amp, step: 0.002, knot: 0.007 }));
  const R = [0.058, 0.076], F = [0.15, 0.076], rw = 0.033, B = [0.102, 0.07], seat = [0.082, 0.126], head = [0.134, 0.12];
  const oval = (cx, cy, rx, ry, a0, a1, key, n = 14) => add(arc(cx, cy, rx, ry, a0, a1, n).map(([x, y], i) => [x, y]), key);
  oval(R[0], R[1], rw, rw, 100, 480, 1); oval(F[0], F[1], rw, rw, 70, 450, 2);                                   // wheels
  add([[R[0] - rw * 0.7, R[1] - rw * 0.7], [R[0] + rw * 0.7, R[1] + rw * 0.7]], 3); add([[R[0] + rw * 0.7, R[1] - rw * 0.7], [R[0] - rw * 0.7, R[1] + rw * 0.7]], 4);   // spokes
  add([[F[0] - rw * 0.7, F[1] - rw * 0.7], [F[0] + rw * 0.7, F[1] + rw * 0.7]], 5); add([[F[0] + rw * 0.7, F[1] - rw * 0.7], [F[0] - rw * 0.7, F[1] + rw * 0.7]], 6);
  add([R, B, seat, R], 7); add([seat, head], 8); add([B, head], 9); add([head, F], 10); add([head, [0.138, 0.14], [0.152, 0.145]], 11);   // frame, fork, handlebar
  add([[seat[0] - 0.014, seat[1] + 0.004], [seat[0] + 0.012, seat[1] + 0.005]], 12);                                                   // saddle
  oval(B[0], B[1], 0.007, 0.007, 0, 360, 13, 8); add([[B[0] - 0.01, B[1] - 0.012], [B[0] + 0.01, B[1] + 0.012]], 14);                 // crank
  // the potato: a lumpy oval above the saddle, one leaf, a face, two arms and two legs
  const body = Array.from({ length: 15 }, (_, i) => { const a = (i / 14) * 2 * Math.PI + 0.3, r = 1 + 0.07 * Math.sin(a * 2 + 1) + 0.04 * Math.sin(a * 3); return [0.099 + 0.036 * r * Math.cos(a), 0.176 + 0.043 * r * Math.sin(a)]; });
  add(body, 15, 0.0005);
  add([[0.101, 0.219], [0.108, 0.235], [0.126, 0.238], [0.121, 0.223], [0.103, 0.219]], 16); add([[0.103, 0.221], [0.119, 0.231]], 17);   // the leaf and its vein
  add(dot(0.088, 0.184, 0.0028).map(([x, y]) => [x, y]), 18, 0.0002); add(dot(0.109, 0.184, 0.0028), 19, 0.0002);                      // eyes
  add(arc(0.099, 0.176, 0.01, 0.007, 200, 340, 6), 20);                                                                                 // smile
  add([[0.128, 0.17], [0.136, 0.15], [head[0] + 0.003, 0.14]], 21); add([[0.07, 0.17], [0.06, 0.158]], 22);                              // arms
  add([[0.092, 0.134], [0.098, 0.108], [B[0] + 0.01, B[1] + 0.012]], 23); add([[0.108, 0.136], [0.114, 0.11], [B[0] + 0.006, B[1] - 0.012]], 24);   // legs
  // the grass line, two strokes, and eight tufts
  add([[0.012, 0.042], [0.05, 0.046], [0.09, 0.041], [0.13, 0.045], [0.188, 0.042]], 25, 0.0009); add([[0.03, 0.034], [0.08, 0.032], [0.12, 0.035], [0.17, 0.033]], 26, 0.0009);
  for (let i = 0; i < 8; i++) { const x = 0.02 + 0.023 * i + 0.006 * hash(seed, i, 61), y = 0.044 + 0.002 * hash(seed, i, 62); add([[x, y], [x - 0.004 + 0.002 * hash(seed, i, 63), y + 0.012 + 0.005 * hash(seed, i, 64)]], 30 + i, 0.0003); }
  // three clouds, each a few bumps on a flat base
  [[0.04, 0.245, 1], [0.152, 0.255, 0.85], [0.03, 0.2, 0.6]].forEach(([cx, cy, k], c) => {
    add([...arc(cx - 0.018 * k, cy, 0.012 * k, 0.01 * k, 150, 380, 6)], 40 + c * 4, 0.0005);
    add([...arc(cx, cy + 0.008 * k, 0.014 * k, 0.012 * k, 160, 20, 6)], 41 + c * 4, 0.0005);
    add([...arc(cx + 0.02 * k, cy, 0.012 * k, 0.01 * k, 180, -50, 6)], 42 + c * 4, 0.0005);
    add([[cx - 0.02 * k, cy - 0.01 * k], [cx + 0.026 * k, cy - 0.01 * k]], 43 + c * 4, 0.0005);
  });
  return S;
}

function mashbook(P) {
  const spec = P.spec, { w, h, ppm, cover: cv, block: bk } = BOOK, seed = spec.seed ?? 7;
  const hand = { slant: 4, jitter: 0.06, wander: 0.03, hvar: 0.12, gap: 0.2, seed };
  const [title, ...items] = spec.lines || ["MASH = 41. WHY?", "SPUD'S JUMPER", "SPUD'S BIKE", "SPUD'S JOKES"];
  const PW = Math.round(w * ppm), PH = Math.round(h * ppm);
  const PEN = "#55504a", PEN_W = 0.005;
  // ---- the pages
  const leftT = canvasTex(PW, PH, (x) => {
    foxedPage(x, PW, PH, seed + 1, true); rules(x, PW, 0.045, 0.0215, 11);
    drawStrokes(x, bikeDrawing(seed), { x0: -0.01 * ppm, y0: PH, ppm, color: PEN, width: 0.0035 });
  });
  const rightT = canvasTex(PW, PH, (x) => {
    foxedPage(x, PW, PH, seed + 2, false); rules(x, PW, 0.049, 0.0215, 10);
    const tl = layoutText(title, { ...hand, height: 0.022, fitW: w - 0.026 - 0.012 });
    drawStrokes(x, tl.strokes, { x0: 0.026 * ppm, y0: 0.047 * ppm, ppm, color: PEN, width: PEN_W });
    for (let i = 0; i < 9; i++) {
      const by = 0.07 + 0.0215 * i, bx = 0.026;
      if (i < 3 && items[i]) { const L = layoutText(items[i], { ...hand, height: 0.016, seed: seed + 3 + i, fitW: 0.12 }); drawStrokes(x, L.strokes, { x0: bx * ppm, y0: by * ppm, ppm, color: PEN, width: PEN_W * 0.9 }); }
      else drawStrokes(x, scribbleLine(0.085 + 0.03 * hash(seed, i, 71), 0.014, { seed: seed + 9 + i }), { x0: bx * ppm, y0: by * ppm, ppm, color: PEN, width: PEN_W * 0.8 });
      const box = layoutText("#", { ...hand, height: 0.0165, seed: seed + 20 + i, jitter: 0.04 }), tick = layoutText("✓", { ...hand, height: 0.0165, seed: seed + 30 + i, jitter: 0.04 });
      drawStrokes(x, box.strokes, { x0: 0.168 * ppm, y0: by * ppm, ppm, color: PEN, width: PEN_W * 0.8 });
      drawStrokes(x, tick.strokes, { x0: 0.169 * ppm, y0: by * ppm, ppm, color: PEN, width: PEN_W });
    }
  });
  // ---- the covers: navy-grey, worn at the corners and along the spine, 5 scratches; the front also carries the blank label
  const CW = Math.round(w * 2700), CH = Math.round(h * 2700), cp = 2700;
  const coverT = (front, spineRight) => canvasTex(CW, CH, (x) => {
    x.fillStyle = "#3d4654"; x.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 260; i++) { x.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.06)"; x.fillRect(hash(i, 1, 81 + +front) * CW, hash(i, 2, 81 + +front) * CH, 2 + hash(i, 3, 81) * 18, 1 + hash(i, 4, 81) * 3); }
    const worn = (cx, cy, r, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(110,118,131,${a})`); g.addColorStop(1, "rgba(110,118,131,0)"); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); };
    worn(0, 0, 0.05 * cp, 0.95); worn(CW, 0, 0.04 * cp, 0.8); worn(0, CH, 0.045 * cp, 0.9); worn(CW, CH, 0.05 * cp, 0.95);
    // the spine edge: a cloth strip, worn (the hinge side)
    const sx = spineRight ? CW - 0.014 * cp : 0; x.fillStyle = "#566071"; x.fillRect(sx, 0, 0.014 * cp, CH);
    for (let i = 0; i < 10; i++) worn(sx + 0.007 * cp, (0.01 + 0.027 * i + 0.01 * hash(i, 5, 82)) * cp, 0.02 * cp, 0.45);
    if (front) { x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(0.052 * cp + 3, 0.058 * cp + 4, 0.1 * cp, 0.05 * cp); x.fillStyle = "#d9cfb8"; x.fillRect(0.05 * cp, 0.055 * cp, 0.1 * cp, 0.05 * cp); x.fillStyle = "rgba(160,140,100,0.25)"; x.fillRect(0.05 * cp, 0.055 * cp, 0.1 * cp, 0.003 * cp); }   // the blank label: no writing
    x.lineCap = "round";
    for (let i = 0; i < 5; i++) { const sx0 = (0.03 + 0.14 * hash(i, 1, 83 + +front)) * cp, sy0 = (0.11 + 0.14 * hash(i, 2, 83 + +front)) * cp, l = (0.02 + 0.03 * hash(i, 3, 83)) * cp, a = (hash(i, 4, 83) - 0.5) * 2.4; x.strokeStyle = `rgba(150,160,175,${0.4 + 0.3 * hash(i, 5, 83)})`; x.lineWidth = 1.6 + hash(i, 6, 83) * 1.6; x.beginPath(); x.moveTo(sx0, sy0); x.lineTo(sx0 + Math.cos(a) * l, sy0 + Math.sin(a) * l); x.stroke(); }
  });
  const frontT = coverT(true, false), backT = coverT(false, true);
  const pm = (t) => mat("#ffffff", { roughness: 0.85, map: t.tex }), plain = (c) => mat(c, { roughness: 0.9 });
  const navy = plain("#3d4654"), edge = plain("#d8c9a4"), worn = plain("#566071");
  // ---- the book: a static half (back cover + the lower pages, z -0.011 .. 0) and a hinged half (front cover + the upper pages, z 0 .. 0.011) about the spine axis (x 0, z 0)
  const T = bk + cv, book = new THREE.Group(); P.whole.add(book);
  const hinge = new THREE.Group(); book.add(hinge);
  const half = (g, sgn) => {   // sgn -1: the static half (z below 0), +1: the hinged half (z above 0)
    mesh(new THREE.BoxGeometry(w, h, cv), navy, g, w / 2, h / 2, sgn * (bk + cv / 2));
    mesh(new THREE.BoxGeometry(w - 0.006, h - 0.006, bk), edge, g, w / 2 - 0.0005, h / 2, sgn * bk / 2);
    mesh(new THREE.BoxGeometry(0.006, h, T), worn, g, -0.003, h / 2, sgn * T / 2);   // the spine's half
  };
  half(book, -1); half(hinge, 1);
  const front = mesh(new THREE.PlaneGeometry(w, h), pm(frontT), hinge, w / 2, h / 2, T + 0.0003); front.castShadow = false;
  const back = mesh(new THREE.PlaneGeometry(w, h), pm(backT), book, w / 2, h / 2, -T - 0.0003); back.rotation.y = Math.PI; back.castShadow = false;
  const rp = mesh(new THREE.PlaneGeometry(w, h), pm(rightT), book, w / 2, h / 2, 0.0004); rp.castShadow = false;
  const lp = mesh(new THREE.PlaneGeometry(w, h), pm(leftT), hinge, w / 2, h / 2, -0.0004); lp.rotation.y = Math.PI; lp.castShadow = false;
  let last = null;
  return { grip: 0.135, apply(ps) {
    const o = clamp(ps.open); if (o === last) return; last = o;
    hinge.rotation.y = -o * Math.PI;                      // the front cover swings toward +z, then over to the left
    book.position.set(-0.1 * (1 - o), 0, (T / 2) * o);   // closed: centred; open: the spine on x 0 and the spread centred on z 0
  } };
}

export const PAPER_KINDS = { spudpad: pad, mashbook };
