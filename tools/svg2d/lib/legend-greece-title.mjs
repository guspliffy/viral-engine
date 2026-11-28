// Legend channel, "The Boy Who Cried Wolf": the opening title card, three styles for Jonny to pick from.
//   titleCard(t, { style, teaser, appear, crumble }) -> SVG (screen space; draw it over the picture, UNDER the subtitle)
//     style   "vase" (A, default) | "marble" (B) | "shepherd" (C)        (registry: TITLE_STYLES, add a style there)
//     teaser  "T1" (default) | "T2" | "T3" (TEASERS) | any text in the letters the alphabet has | "" for none
//     With no appear / crumble the card runs its own clock from t (seconds from the video's start): in at 0.25, gone by
//     2.6 (TITLE_STYLES[style].time). appear 0..1 = the way in, crumble 0..1 = the way out (1 = nothing left).
// Where it lives: y 193..483 only (below TikTok's top bar, above the subtitle row at y 520..640, far above the wolf's
// eyes at y 850..1050). Everything is clipped to y <= 504, so nothing that falls or wipes can reach the subtitle.
// Colours follow legend-greece.mjs (the village blue #1c50d8, wall white #c2d2ff, roof red #c8502a, eye yellow #ffe21a).
// Lettering: our own alphabet, drawn here. Each capital is a few chisel strokes on a 100-high box (thick stems, thin
// arms, flared ends, a small floating O as on archaic Greek inscriptions): Latin letters, not fake Greek. The same
// skeletons drawn as a thin line are the scratched hand of the teaser. Every wobble and chip is seeded: no boil.
import { W, INK, n, lerp, clamp, hash, mix, ease, blinkAmt } from "./legend.mjs";

const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const pd = (a, close = true) => "M" + a.map(([x, y]) => `${n(x)},${n(y)}`).join(" L") + (close ? " Z" : "");
const area = (a) => a.reduce((s, p, i) => { const q = a[(i + 1) % a.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const wind = (a, pos = true) => ((area(a) > 0) === pos ? a : [...a].reverse());
// a straight-edged polygon with hand-wobbled edges: extra points every `per` px, each pushed a little
function rough(a, seed, amp = 2, per = 26, close = true) {
  const out = [], N = close ? a.length : a.length - 1;
  for (let i = 0; i < N; i++) { const p = a[i], q = a[(i + 1) % a.length], k = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / per));
    for (let j = 0; j < k; j++) { const u = j / k, id = seed * 37 + i * 11 + j * 1.7; out.push([lerp(p[0], q[0], u) + (j ? jit(id, amp) : jit(id, amp * 0.4)), lerp(p[1], q[1], u) + (j ? jit(id + 0.5, amp) : jit(id + 0.5, amp * 0.4))]); } }
  if (!close) out.push(a[a.length - 1]);
  return out;
}
const lump = (x, y, rx, ry, seed, k = 9, irr = 0.25) => Array.from({ length: k }, (_, i) => { const an = (i + jit(seed + i * 1.7, 0.3)) / k * Math.PI * 2, r = 1 + jit(seed + i * 3.1, irr); return [x + Math.cos(an) * rx * r, y + Math.sin(an) * ry * r]; });

// ================================================================ the alphabet
const TH = 23, TN = 15;
const s_ = (p, w = TH, f = [0, 0]) => ({ p, w, f });           // f per end: 0 plain, 1 flared terminal, 2 joint (round)
const arcP = (cx, cy, rx, ry, a0, a1, k) => Array.from({ length: k + 1 }, (_, i) => { const a = lerp(a0, a1, i / k) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const C_ARC = arcP(44, 50, 37, 44, -48, -312, 12);
const GLYPH = {
  T: [78, s_([[2, 9], [76, 9]], TN, [1, 1]), s_([[39, 3], [39, 100]], TH, [0, 1])],
  H: [84, s_([[13, 0], [13, 100]], TH, [1, 1]), s_([[71, 0], [71, 100]], TH, [1, 1]), s_([[13, 50], [71, 50]], TN)],
  E: [68, s_([[13, 0], [13, 100]]), s_([[3, 8], [64, 8]], TN, [0, 1]), s_([[13, 50], [50, 50]], TN, [0, 1]), s_([[3, 92], [66, 92]], TN, [0, 1])],
  F: [64, s_([[13, 0], [13, 100]], TH, [0, 1]), s_([[3, 8], [62, 8]], TN, [0, 1]), s_([[13, 50], [48, 50]], TN, [0, 1])],
  L: [64, s_([[13, 0], [13, 100]], TH, [1, 0]), s_([[3, 92], [62, 92]], TN, [0, 1])],
  I: [28, s_([[14, 0], [14, 100]], TH, [1, 1])],
  B: [72, s_([[13, 0], [13, 100]]), s_([[9, 8], [36, 8], [52, 14], [58, 28], [52, 42], [38, 49], [13, 49]], TN), s_([[13, 51], [42, 51], [58, 58], [64, 71], [58, 85], [42, 92], [9, 92]], [15, 15, 18, 21, 18, 15, 15])],
  R: [78, s_([[13, 0], [13, 100]], TH, [0, 1]), s_([[9, 8], [38, 8], [54, 15], [60, 29], [54, 43], [38, 50], [13, 50]], [15, 15, 18, 20, 18, 15, 15]), s_([[35, 50], [69, 100]], TH, [0, 1])],
  D: [80, s_([[13, 0], [13, 100]]), s_([[9, 8], [34, 8], [56, 20], [66, 50], [56, 80], [34, 92], [9, 92]], [15, 15, 20, 24, 20, 15, 15])],
  C: [80, s_(C_ARC, C_ARC.map((_, i) => lerp(14, 24, Math.sin(i / 12 * Math.PI) ** 1.2)), [1, 1])],
  Y: [80, s_([[7, 0], [40, 54]], TH, [1, 0]), s_([[73, 0], [40, 54]], TN, [1, 0]), s_([[40, 48], [40, 100]], TH, [0, 1])],
  W: [112, s_([[7, 0], [31, 93]], TH, [1, 2]), s_([[31, 93], [56, 24]], TN, [2, 2]), s_([[56, 24], [81, 93]], TH, [2, 2]), s_([[81, 93], [105, 0]], TN, [2, 1])],
  A: [80, s_([[40, 6], [9, 100]], TN, [2, 1]), s_([[40, 6], [71, 100]], TH, [2, 1]), s_([[21, 66], [59, 66]], 13)],
  M: [104, s_([[12, 100], [15, 7]], TN, [1, 2]), s_([[15, 7], [52, 72]], TH, [2, 2]), s_([[52, 72], [89, 7]], TN, [2, 2]), s_([[89, 7], [92, 100]], TH, [2, 1])],
  N: [84, s_([[13, 100], [13, 6]], TN, [1, 2]), s_([[13, 6], [71, 94]], TH, [2, 2]), s_([[71, 94], [71, 0]], TN, [2, 1])],
  U: [80, s_([[13, 0], [13, 64], [21, 84], [40, 93], [59, 84], [67, 64], [67, 0]], [23, 23, 20, 16, 16, 15, 15], [1, 1])],
  S: [70, s_([[60, 18], [47, 8], [30, 6], [15, 14], [11, 28], [18, 41], [35, 50], [52, 59], [60, 72], [56, 86], [41, 94], [24, 94], [9, 83]], [14, 15, 15, 17, 20, 22, 23, 22, 20, 17, 15, 15, 14], [1, 1])],
  O: [80, { ring: [40, 51, 40, 43, 20, 27] }],
  "@": [92, { ring: [46, 50, 46, 47, 27, 29] }],              // the wide O of the shepherd board (a knothole fits in it)
  "…": [58, { dots: [[8, 92], [29, 92], [50, 92]] }],
};
// one stroke -> its outline: a ribbon along the centre line, wider at flared ends
function ribbon(s, tf, seed, amp, flare) {
  const P0 = s.p, ws = Array.isArray(s.w) ? s.w : P0.map(() => s.w), seg = [], pts = []; let tot = 0, acc = 0;
  for (let i = 0; i < P0.length - 1; i++) { seg[i] = Math.hypot(P0[i + 1][0] - P0[i][0], P0[i + 1][1] - P0[i][1]); tot += seg[i]; }
  for (let i = 0; i < P0.length - 1; i++) { const k = Math.max(1, Math.round(seg[i] / 10)); for (let j = 0; j < k; j++) { const u = j / k; pts.push([lerp(P0[i][0], P0[i + 1][0], u), lerp(P0[i][1], P0[i + 1][1], u), lerp(ws[i], ws[i + 1], u), acc + seg[i] * u]); } acc += seg[i]; }
  pts.push([...P0[P0.length - 1], ws[ws.length - 1], tot]);
  const FL = 20, L = [], R = [], out = [];
  pts.forEach(([x, y, w, d], i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
    const h = w / 2 * (1 + (s.f[0] === 1 ? flare * Math.max(0, 1 - d / FL) ** 1.6 : 0) + (s.f[1] === 1 ? flare * Math.max(0, 1 - (tot - d) / FL) ** 1.6 : 0));
    L.push([x + nx * h, y + ny * h]); R.push([x - nx * h, y - ny * h]); });
  const wob = (a, sd) => a.map(tf).map(([x, y], i) => [x + jit(sd + i * 2.3, amp), y + jit(sd + i * 2.3 + 0.6, amp)]);
  out.push(wind(wob([...L, ...R.reverse()], seed)));
  [0, 1].forEach((e) => { if (s.f[e] !== 2) return; const q = e ? pts[pts.length - 1] : pts[0]; out.push(wind(wob(lump(q[0], q[1], q[2] / 2, q[2] / 2, 1, 9, 0), seed + 40 + e))); });
  return out;
}
// lay out a line of capitals: returns { g: [{ ch, d, x, y, w, h, i, cx, cy, hole }], w }.  o: track, space, seed, amp
// (edge wobble px), jy, jr (per-letter jitter), flare (0..0.6), sub: { O: "@" } swaps a glyph.
function capsLine(text, x, y, cap, o = {}) {
  const k = cap / 100, tr = (o.track ?? 10) * k, out = []; let cx = x, i = 0;
  for (let ch of text) {
    if (ch === " ") { cx += (o.space ?? 44) * k; continue; }
    if (o.sub?.[ch] && (o.subAt == null || o.subAt === i)) ch = o.sub[ch];
    const [w, ...strokes] = GLYPH[ch], sd = (o.seed ?? 1) * 17 + i * 5, jy = jit(sd + 1, o.jy ?? 0), rot = jit(sd + 2, o.jr ?? 0) * Math.PI / 180, amp = o.amp ?? 1.4;
    const tf = ([px, py]) => { const lx = (px - w / 2) * k, ly = (py - 50) * k; return [cx + w * k / 2 + lx * Math.cos(rot) - ly * Math.sin(rot), y + cap / 2 + jy + lx * Math.sin(rot) + ly * Math.cos(rot)]; };
    let d = "", hole = null;
    strokes.forEach((s, si) => {
      if (s.ring) { const [ox, oy, rx, ry, ix, iy] = s.ring, wb = (a, q) => a.map(tf).map(([px, py], j) => [px + jit(sd + q + j, amp), py + jit(sd + q + j + 0.5, amp)]); hole = { c: tf([ox, oy]), rx: ix * k, ry: iy * k };
        d += pd(wind(wb(lump(ox, oy, rx, ry, sd, 18, 0.025), 60))) + pd(wind(wb(lump(ox, oy, ix, iy, sd + 9, 14, 0.04), 80), false)); }
      else if (s.dots) s.dots.forEach(([dx, dy], j) => { d += pd(wind(lump(...tf([dx, dy]), 8 * k, 8 * k, sd + j, 7, 0.2))); });
      else ribbon(s, tf, sd + si * 13, amp, o.flare ?? 0.42).forEach((q) => { d += pd(q); });
    });
    out.push({ ch, d, x: cx, y, w: w * k, h: cap, i, cx: cx + w * k / 2, cy: y + cap / 2, hole }); cx += w * k + tr; i++;
  }
  return { g: out, w: cx - tr - x };
}
const capsWidth = (text, cap, o = {}) => capsLine(text, 0, 0, cap, o).w;
// the same skeletons as one scratched line (the teaser hand); returns { d, w }
function scratchLine(text, x, y, cap, o = {}) {
  const k = cap / 100, tr = (o.track ?? 16) * k; let cx = x, i = 0, d = "";
  for (const ch of text) {
    if (ch === " ") { cx += (o.space ?? 46) * k; continue; }
    const [w, ...strokes] = GLYPH[ch], sd = (o.seed ?? 1) * 23 + i * 7, jy = jit(sd + 1, o.jy ?? 1.6), rot = jit(sd + 2, o.jr ?? 3) * Math.PI / 180;
    const tf = ([px, py]) => { const lx = (px - w / 2) * k, ly = (py - 50) * k; return [cx + w * k / 2 + lx * Math.cos(rot) - ly * Math.sin(rot) + jit(sd + px + py * 3, 0.7), y + cap / 2 + jy + lx * Math.sin(rot) + ly * Math.cos(rot) + jit(sd + px * 3 + py, 0.7)]; };
    strokes.forEach((s) => {
      if (s.ring) d += pd(lump(s.ring[0], s.ring[1], (s.ring[2] + s.ring[4]) / 2, (s.ring[3] + s.ring[5]) / 2, sd, 10, 0.05).map(tf));
      else if (s.dots) s.dots.forEach((q) => { const [a, b] = tf(q); d += `M${n(a)},${n(b)} l${n(1.5 * k)},${n(-2 * k)}`; });
      else d += pd(s.p.map(tf), false);
    });
    cx += w * k + tr; i++;
  }
  return { d, w: cx - tr - x };
}
const scratchWidth = (text, cap, o = {}) => scratchLine(text, 0, 0, cap, o).w;
// a teaser that fits: the scratched line centred on cx, shrunk to maxW if it must
function teaserFit(text, cx, y, cap, maxW, o = {}) { const w0 = scratchWidth(text, cap, o), c = w0 > maxW ? cap * maxW / w0 : cap, w = scratchWidth(text, c, o); return { ...scratchLine(text, cx - w / 2, y + (cap - c) / 2, c, o), cap: c }; }

export const TEASERS = { T1: "…THE THIRD TIME WAS REAL", T2: "…NOBODY CAME", T3: "…SHOUT ONLY WHEN YOU SEE ITS TEETH" };
const teaserText = (o) => { const v = o.teaser; if (v === "" || v === 0 || v === false) return ""; if (v == null || v === 1 || v === true) return TEASERS.T1; return TEASERS[v] || [...String(v).toUpperCase().replace(/\.\.\./g, "…")].filter((ch) => ch === " " || GLYPH[ch]).join(""); };

// a Greek key: one hooked cell every 9 units on a base line, brushed by hand. Returns a path d (stroke it, miter joins)
function meander(x0, x1, y, h, seed, up = true) {
  const u = h / 6, cells = Math.floor((x1 - x0) / (9 * u)), off = (x1 - x0 - cells * 9 * u + 3 * u) / 2; let d = "";
  const Y = (v) => (up ? y - v * u : y + v * u);
  for (let i = 0; i < cells; i++) { const bx = x0 + off + i * 9 * u, q = [[0, 0], [0, 6], [6, 6], [6, 2], [3, 2], [3, 4]].map(([a, b], j) => [bx + a * u + jit(seed + i * 7 + j, u * 0.13), Y(b) + jit(seed + i * 7 + j + 0.5, u * 0.13)]); d += pd(q, false); }
  return d + pd(rough([[x0, Y(0)], [x1, Y(0)]], seed + 5, u * 0.12, 40, false), false);
}
// a running wolf, cut as one black shape (200 x 100 box, faces right, feet near y 96)
const WOLF_SIL = [[0, 37], [28, 31], [52, 29], [90, 25], [118, 24], [129, 17], [139, 11], [145, -5], [152, 9], [158, -1], [163, 12], [177, 17], [197, 22], [193, 28], [173, 29], [164, 31], [186, 37], [190, 43], [170, 43], [156, 41], [149, 50], [176, 60], [199, 64], [199, 71], [172, 71], [146, 63], [152, 77], [169, 89], [165, 95], [143, 85], [130, 63], [100, 55], [79, 57], [73, 72], [53, 90], [34, 95], [33, 88], [48, 81], [56, 65], [41, 62], [17, 75], [4, 73], [6, 66], [22, 61], [40, 47], [29, 41], [0, 44]];
function wolfSil(x, y, k, col, cut, seed = 1, flip = false) {
  const body = WOLF_SIL.map(([a, b], i) => [a + jit(seed + i * 1.3, 0.9), b + jit(seed + i * 1.3 + 0.5, 0.9)]);
  return `<g transform="translate(${n(x)},${n(y)}) scale(${flip ? -k : k},${k})"><path d="${pd(body)}" fill="${col}" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/><g fill="none" stroke="${cut}" stroke-width="2.2" stroke-linecap="round"><path d="M168,19 l6,1.5 l-5,2.6 Z" fill="${cut}" stroke="none"/><path d="M128,26 Q138,40 132,58 M112,30 Q118,42 114,54 M98,32 Q102,42 99,52 M84,33 Q87,42 85,53 M58,34 Q52,46 58,60 M10,39 L34,35 M150,14 L156,22"/></g></g>`;
}
// the shepherd boy, black-figure: short tunic, crook, a hand cupped at his mouth (100 x 150 box, faces left)
function boySil(x, y, k, col, cut, flip = false) {
  const st = (d, w) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g transform="translate(${n(x)},${n(y)}) scale(${flip ? -k : k},${k})">${st("M86,150 L84,26 Q84,6 70,6 Q60,7 61,17", 5)}${st("M42,94 L33,146 L18,149 M58,94 L66,146 L52,150", 11)}<path d="M35,42 L63,40 L74,98 L26,100 Z" fill="${col}" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>${st("M40,50 L22,60 L31,37", 9)}${st("M60,48 L76,64 L85,60", 9)}<path d="M33,18 L27,25 L33,27 L31,33 L42,39 L58,37 L65,24 L60,8 L44,4 L35,10 Z" fill="${col}" stroke="${col}" stroke-width="2" stroke-linejoin="round"/><g fill="none" stroke="${cut}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M38,19 l5,-1.6" stroke-width="3.4"/><path d="M36,11 Q48,13 55,7 M56,12 Q60,22 54,34"/><path d="M34,64 L67,62 M28,92 l6,-7 l6,7 l6,-7 l6,7 l6,-7 l6,7 l6,-7"/></g></g>`;
}

// ================================================================ A "vase": a potsherd of a black-figure frieze
// Terracotta band, a Greek key along the top, the wolf running at the boy across the upper row, the title in black
// glaze, the teaser reserved in orange on a black band (red-figure). In: the shards jump together. Out: it cracks.
const VA = { clay: "#e2652a", lit: "#f08a3c", dark: "#b8431c", pale: "#f7b877", glaze: "#120a10", glaze2: "#2a1218", red: "#8a1f1a", white: "#f6ead2" };
function titleVase(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const x0 = 46, x1 = 1034, y0 = 194, y1 = 474, C = VA;
  // the sherd: straight wheel-thrown top and bottom, broken ends
  const out = rough([[x0 + 16, y0], [x1 - 34, y0 + 3], [x1 - 6, y0 + 40], [x1 - 22, y0 + 86], [x1, y0 + 150], [x1 - 14, y0 + 214], [x1 - 40, y1 - 4], [x0 + 30, y1], [x0 + 2, y1 - 54], [x0 + 20, y1 - 120], [x0, y0 + 96], [x0 + 22, y0 + 44]], 3, 2.2, 38), od = pd(out);
  let art = `<path d="${od}" fill="${C.pale}" transform="translate(3,9)"/><path d="${od}" fill="${C.dark}" transform="translate(1,4)"/><path d="${od}" fill="${C.clay}"/><clipPath id="tVs"><path d="${od}"/></clipPath><g clip-path="url(#tVs)">`;
  // wheel streaks and a misfired patch: the slip was brushed on while the pot turned
  for (let i = 0; i < 16; i++) { const y = y0 + 34 + hash(i + 3) * 190, x = x0 + hash(i + 13) * 700, l = 120 + hash(i + 23) * 320; art += `<path d="M${n(x)},${n(y)} q${n(l / 2)},${n(jit(i + 33, 3))} ${n(l)},${n(jit(i + 43, 2))}" stroke="${i % 3 ? C.lit : C.dark}" stroke-width="${n(2 + hash(i + 53) * 5)}" stroke-linecap="round" fill="none" opacity="${i % 3 ? 0.55 : 0.4}"/>`; }
  art += `<path d="${pd(lump(x1 - 150, y0 + 150, 120, 60, 7, 11, 0.3))}" fill="${C.dark}" opacity="0.3"/>`;
  // the key band along the top: two thin lines and the key between them
  const kY = y0 + 42;
  art += `<path d="${pd(rough([[x0 - 10, y0 + 9], [x1 + 10, y0 + 10]], 11, 0.9, 50, false), false)}" stroke="${C.glaze}" stroke-width="3.2" fill="none"/><path d="${meander(x0 - 12, x1 + 12, kY - 4, 22, 21)}" stroke="${C.glaze}" stroke-width="4.4" fill="none" stroke-linejoin="miter" stroke-linecap="square"/><path d="${pd(rough([[x0 - 10, kY + 3], [x1 + 10, kY + 2]], 12, 0.9, 50, false), false)}" stroke="${C.glaze}" stroke-width="3" fill="none"/>`;
  // row 1: the boy (left, shouting), THE BOY WHO, the wolf (right, running at him)
  const c1 = 46, r1 = y0 + 58, w1 = capsWidth("THE BOY WHO", c1, { track: 12 }), g1 = capsLine("THE BOY WHO", 540 - w1 / 2 + 6, r1 + 6, c1, { track: 12, seed: 3, amp: 1.1, jy: 1.2, jr: 1.2 }).g;
  art += boySil(x0 + 86, r1 - 7, 0.6, C.glaze, C.clay, true) + wolfSil(x1 - 62, r1 - 4, 0.76, C.glaze, C.clay, 5, true);
  art += `<path d="M${x0 + 100},${r1 + 4} l16,-6 M${x0 + 103},${r1 + 15} l18,0 M${x0 + 100},${r1 + 26} l16,6" stroke="${C.red}" stroke-width="3.4" stroke-linecap="round"/>`;
  // row 2: CRIED WOLF, black glaze, a thin incised line inside each stem, WOLF with added red
  const c2 = 106, r2 = y0 + 115, w2 = capsWidth("CRIED WOLF", c2, { track: 10 }), g2 = capsLine("CRIED WOLF", 540 - w2 / 2, r2, c2, { track: 10, seed: 6, amp: 1.7, jy: 1.6, jr: 0.9 }).g;
  [...g1, ...g2].forEach((g, i) => { const big = g.h > 100, wolf = big && g.i >= 5;
    if (wolf) art += `<path d="${g.d}" fill="${C.glaze}" stroke="${C.glaze}" stroke-width="9" stroke-linejoin="round" transform="translate(3,4)"/><path d="${g.d}" fill="${C.glaze}" stroke="${C.glaze}" stroke-width="6" stroke-linejoin="round"/><path d="${g.d}" fill="${C.white}"/>`;
    else art += `<path d="${g.d}" fill="${C.glaze}" stroke="${C.glaze}" stroke-width="${big ? 2.4 : 1.4}" stroke-linejoin="round"/>`;
    if (big) art += `<clipPath id="tVg${i}"><path d="${g.d}"/></clipPath><g clip-path="url(#tVg${i})"><path d="M${n(g.x + g.w * 0.1)},${n(g.y + g.h * (0.24 + 0.5 * hash(i + 71)))} l${n(g.w * 0.8)},${n(jit(i + 81, 5))} M${n(g.x + g.w * 0.2)},${n(g.y + g.h * (0.2 + 0.6 * hash(i + 91)))} l${n(g.w * 0.5)},${n(jit(i + 95, 4))}" stroke="${wolf ? C.pale : C.clay}" stroke-width="1.8" opacity="0.8"/></g>`; });
  // the black band under it, the teaser reserved in clay colour
  const bY = y1 - 52, tz = teaserText(o);
  art += `<path d="${pd(rough([[x0 - 10, bY], [x1 + 10, bY + 2], [x1 + 10, y1 - 10], [x0 - 10, y1 - 11]], 14, 1.3, 46))}" fill="${C.glaze}"/><path d="${pd(rough([[x0 - 10, bY - 7], [x1 + 10, bY - 6]], 15, 0.9, 50, false), false)}" stroke="${C.glaze}" stroke-width="2.6" fill="none"/>`;
  if (tz) { const ts = teaserFit(tz, 540, bY + 8, 28, x1 - x0 - 110, { seed: 4 }); art += `<path d="${ts.d}" fill="none" stroke="${C.lit}" stroke-width="${n(4.2 * ts.cap / 28)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  // wear: chips to the pale clay, flaked glaze, a hairline
  for (const [cx, cy, r, sd] of [[x0 + 40, y0 + 6, 13, 1], [x1 - 70, y1 - 8, 15, 2], [x0 + 300, y1 - 4, 9, 3], [x1 - 300, y0 + 4, 8, 4], [x0 + 12, y0 + 150, 10, 5]]) art += `<path d="${pd(lump(cx, cy, r, r * 0.7, sd + 30, 7, 0.35))}" fill="${C.pale}"/>`;
  for (let i = 0; i < 22; i++) art += `<path d="${pd(lump(x0 + 20 + hash(i + 90) * (x1 - x0 - 40), y0 + 14 + hash(i + 100) * (y1 - y0 - 28), 1.6 + hash(i + 110) * 3.2, 1.4 + hash(i + 120) * 2, i + 130, 5, 0.3))}" fill="${i % 2 ? C.lit : C.dark}"/>`;
  art += `<path d="M${x0 + 196},${y0} l10,26 l-8,20 l14,24" fill="none" stroke="${C.dark}" stroke-width="1.8" stroke-linejoin="round"/></g><path d="${od}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
  // the shards: one drawing behind seeded clip pieces. In: they fly together. Out: cracks, then they tip apart and go.
  const NX = 6, NY = 2, e = ease(clamp(ap), "out"), vx = (i, j) => [x0 - 20 + (x1 - x0 + 40) * i / NX + (i && i < NX ? jit(i * 7 + j * 13, 38) : 0), y0 - 20 + (y1 - y0 + 44) * j / NY + (j && j < NY ? jit(i * 11 + j * 5 + 3, 26) : 0)];
  if (ap >= 1 && cr <= 0) return art;
  let s = `<defs><g id="tVart">${art}</g></defs>`, cracks = "";
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const q = [vx(i, j), vx(i + 1, j), vx(i + 1, j + 1), vx(i, j + 1)], mid = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], id = `tVc${i}_${j}`, pth = pd(q), sd = i * 5 + j * 9;
    const away = [(mid[0] - 540) / 494, j ? 0.5 : -1];
    let tx, ty, rot, op;
    if (cr <= 0) { const d0 = hash(sd + 2) * 0.35, u = 1 - ease(clamp((ap - d0) / 0.65), "out"); tx = away[0] * 150 * u + jit(sd, 30) * u; ty = away[1] * 70 * u; rot = jit(sd + 1, 34) * u; op = clamp((1 - u) * 3); }
    else { const d0 = 0.16 + hash(sd + 4) * 0.3, u = clamp((cr - d0) / 0.5); if (u >= 1) continue; tx = away[0] * 60 * u + jit(sd + 5, 20) * u; ty = (j ? 34 : 60) * u * u + 6 * u; rot = jit(sd + 6, 26) * u; op = clamp((1 - u) * 1.7); cracks += pth; }
    s += `<clipPath id="${id}"><path d="${pth}"/></clipPath><g transform="translate(${n(tx)},${n(ty)}) rotate(${n(rot)} ${n(mid[0])} ${n(mid[1])})" opacity="${n(op)}"><g clip-path="url(#${id})"><use href="#tVart"/></g></g>`;
  }
  if (cr > 0) { s += `<path d="${cracks}" fill="none" stroke="${C.glaze}" stroke-width="${n(1.4 + cr * 3)}" stroke-linejoin="round" opacity="${n(clamp(cr * 10) * clamp(1.5 - cr * 3.4))}" clip-path="url(#tVs)"/>`;
    for (let i = 0; i < 26; i++) { const d0 = 0.1 + hash(i + 300) * 0.4, u = clamp((cr - d0) / 0.45); if (u <= 0 || u >= 1) continue; const x = x0 + hash(i + 310) * (x1 - x0) + jit(i + 320, 30) * u, y = y0 + 40 + hash(i + 330) * (y1 - y0 - 60) + 70 * u * u, r = 3 + hash(i + 340) * 7; s += `<path d="${pd(lump(x, y, r, r * 0.8, i + 350, 5, 0.3))}" fill="${i % 3 ? C.clay : i % 2 ? C.pale : C.glaze}" opacity="${n(1 - u)}"/>`; } }
  return s;
}

// ================================================================ B "marble": a chipped lintel, the letters cut in
// White marble against the night, a key cut along the top, V-cut letters (WOLF still holds its red paint), a paw print
// and three claw lines scratched in. In: it drops into place. Out: dust runs off it and it sinks into the dark.
const MB = { base: "#e9edf8", lit: "#ffffff", shade: "#b4c1e6", deep: "#7f90c8", vein: "#9fb0de", cut: "#141c50", cut2: "#4a5a9c", red: "#b3241b", redD: "#5e0f12", night: "#030714" };
function titleMarble(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const x0 = 62, x1 = 1018, y0 = 198, y1 = 462, C = MB;
  const out = rough([[x0 + 4, y0 + 6], [x0 + 300, y0], [x0 + 316, y0 + 7], [x0 + 338, y0 + 1], [x1 - 60, y0 + 2], [x1 - 34, y0 + 22], [x1 - 2, y0 + 30], [x1, y1 - 80], [x1 - 14, y1 - 62], [x1 - 6, y1 - 2], [x0 + 420, y1], [x0 + 400, y1 - 9], [x0 + 372, y1 + 1], [x0 + 44, y1 - 1], [x0 + 22, y1 - 26], [x0, y1 - 36], [x0 + 2, y0 + 130], [x0 + 12, y0 + 112], [x0 + 1, y0 + 92]], 5, 1.6, 44), od = pd(out);
  let a = `<path d="${od}" fill="${C.deep}" transform="translate(2,13)"/><path d="${od}" fill="${C.base}"/><clipPath id="tMs"><path d="${od}"/></clipPath><g clip-path="url(#tMs)">`;
  // the stone: broad cool patches, veins, pits
  for (const [bx, by, rx, ry, col, sd] of [[250, 290, 190, 60, C.lit, 1], [800, 400, 240, 50, C.lit, 2], [640, 240, 160, 30, C.shade, 3], [150, 420, 130, 40, C.shade, 4], [930, 290, 90, 80, C.shade, 5]]) a += `<path d="${pd(lump(bx, by, rx, ry, sd + 20, 12, 0.25))}" fill="${col}" opacity="${col === C.lit ? 0.75 : 0.42}"/>`;
  for (const [vx, vy, sd] of [[x0 - 10, y0 + 150, 1], [x0 + 420, y0 - 10, 2], [x1 - 330, y1 + 10, 3]]) { let p = [[vx, vy]]; for (let i = 1; i < 9; i++) p.push([vx + i * 46 + jit(sd * 9 + i, 14), vy + (sd === 1 ? -1 : sd === 2 ? 1.6 : -1.2) * i * 17 + jit(sd * 9 + i + 0.5, 12)]); a += `<path d="${pd(p, false)}" fill="none" stroke="${C.vein}" stroke-width="${3.4 - sd * 0.6}" stroke-linejoin="round" opacity="0.7"/><path d="${pd(p.slice(2, 6).map(([q, r]) => [q + 12, r + 22]), false)}" fill="none" stroke="${C.vein}" stroke-width="1.4" opacity="0.6"/>`; }
  for (let i = 0; i < 34; i++) a += `<circle cx="${n(x0 + hash(i + 60) * (x1 - x0))}" cy="${n(y0 + hash(i + 70) * (y1 - y0))}" r="${n(1 + hash(i + 80) * 2)}" fill="${i % 3 ? C.shade : C.deep}" opacity="0.8"/>`;
  // the top fascia: a ledge line and the key, cut (dark line, a lit lip under it)
  const kY = y0 + 44, key = meander(x0 + 26, x1 - 44, kY - 6, 21, 31);
  a += `<path d="${key}" fill="none" stroke="${C.lit}" stroke-width="5" stroke-linejoin="miter" stroke-linecap="square" transform="translate(1.6,2.2)"/><path d="${key}" fill="none" stroke="${C.cut2}" stroke-width="4.4" stroke-linejoin="miter" stroke-linecap="square"/><path d="${pd(rough([[x0 - 6, kY + 5], [x1 + 6, kY + 4]], 33, 1, 60, false), false)}" stroke="${C.deep}" stroke-width="3" fill="none"/><path d="${pd(rough([[x0 - 6, kY + 8.5], [x1 + 6, kY + 7.5]], 33, 1, 60, false), false)}" stroke="${C.lit}" stroke-width="2.4" fill="none"/>`;
  // the letters: a V-cut. Lit lip down-right, the cut dark, its far wall a shade lighter
  const c1 = 40, r1 = y0 + 62, w1 = capsWidth("THE BOY WHO", c1, { track: 16, space: 52 }), g1 = capsLine("THE BOY WHO", 540 - w1 / 2, r1, c1, { track: 16, space: 52, seed: 8, amp: 0.9, jy: 0.8 }).g;
  const c2 = 104, r2 = y0 + 109, w2 = capsWidth("CRIED WOLF", c2, { track: 12 }), g2 = capsLine("CRIED WOLF", 540 - w2 / 2, r2, c2, { track: 12, seed: 12, amp: 1.5, jy: 1.2, jr: 0.5 }).g;
  [...g1, ...g2].forEach((g, i) => { const big = g.h > 100, wolf = big && g.i >= 5, d = big ? 7 : 3.4, id = `tMg${i}`;
    a += `<path d="${g.d}" fill="${C.lit}" transform="translate(${n(d * 0.42)},${n(d * 0.5)})"/><clipPath id="${id}"><path d="${g.d}"/></clipPath><path d="${g.d}" fill="${wolf ? C.redD : C.cut}"/><g clip-path="url(#${id})"><path d="${g.d}" fill="${wolf ? C.red : C.cut2}" transform="translate(${d},${d})"/>${wolf ? `<path d="${pd(lump(g.x + g.w * hash(i + 3), g.y + g.h * (0.2 + 0.6 * hash(i + 5)), 11, 8, i + 7, 7, 0.35))}" fill="${C.cut}"/><path d="${pd(lump(g.x + g.w * hash(i + 13), g.y + g.h * (0.2 + 0.6 * hash(i + 15)), 6, 9, i + 17, 6, 0.35))}" fill="${C.cut2}"/>` : ""}</g>`; });
  // scratched in: the paw (right of the small line), three claw lines (left of it), the teaser along the foot
  const px = x1 - 150, py = r1 + 22, pad = (dx, dy, rx, ry, rot, sd) => `<path d="${pd(lump(0, 0, rx, ry, sd, 8, 0.16))}" transform="translate(${n(px + dx)},${n(py + dy)}) rotate(${rot})"/>`;
  const paw = pad(0, 9, 15, 11.5, -8, 1) + pad(-20, -7, 6.2, 8.6, -30, 2) + pad(-8, -17, 6.4, 9.4, -10, 3) + pad(7, -17.5, 6.4, 9.4, 8, 4) + pad(19, -8, 6.2, 8.6, 28, 5) + `<path d="M${px - 26},${py - 20} l-4,-8 M${px - 11},${py - 31} l-2,-9 M${px + 9},${py - 31.5} l2,-9 M${px + 25},${py - 21} l5,-8" fill="none" stroke-width="2.6" stroke-linecap="round"/>`;
  a += `<g fill="${C.lit}" stroke="${C.lit}" transform="translate(1.6,2)">${paw}</g><g fill="${C.cut2}" stroke="${C.cut}">${paw}</g>`;
  const claws = [0, 1, 2].map((i) => pd(rough([[x0 + 96 + i * 22, r1 - 6 + i * 3], [x0 + 80 + i * 22, r1 + 22], [x0 + 70 + i * 22, r1 + 52 - i * 4]], 40 + i, 1.4, 14, false), false)).join("");
  a += `<path d="${claws}" fill="none" stroke="${C.lit}" stroke-width="3.4" stroke-linecap="round" transform="translate(1.8,1.6)"/><path d="${claws}" fill="none" stroke="${C.cut2}" stroke-width="3.6" stroke-linecap="round"/>`;
  const tz = teaserText(o);
  if (tz) { const ts = teaserFit(tz, 540, y1 - 37, 25, x1 - x0 - 150, { seed: 9, track: 20 }); a += `<path d="${ts.d}" fill="none" stroke="${C.lit}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.4,1.8)"/><path d="${ts.d}" fill="none" stroke="${C.cut}" stroke-width="${n(3.3 * ts.cap / 25)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  // breaks: chipped corners (a shaded facet with a lit rim), one crack down from the top
  for (const [cx, cy, r, sd] of [[x1 - 40, y0 + 12, 30, 1], [x0 + 12, y1 - 18, 26, 2], [x0 + 326, y0, 16, 3], [x1 - 6, y1 - 74, 18, 4], [x0 + 396, y1, 18, 5], [x0 + 4, y0 + 112, 14, 6]]) a += `<path d="${pd(lump(cx, cy, r, r * 0.72, sd + 50, 7, 0.3))}" fill="${C.shade}"/><path d="${pd(lump(cx + 2, cy + 3, r * 0.6, r * 0.42, sd + 56, 6, 0.3))}" fill="${C.deep}" opacity="0.8"/>`;
  a += `<path d="M${x1 - 236},${y0} l10,22 l-9,16 l13,22 l-5,13 M${x1 - 232},${y0 + 38} l-16,9" fill="none" stroke="${C.cut2}" stroke-width="2.2" stroke-linejoin="round"/></g><path d="${od}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // in: a short drop and two puffs of dust at its ends. out: dust first, then down and dark
  const e = ease(clamp(ap), "out"), land = clamp((ap - 0.55) / 0.45), sink = ease(clamp((cr - 0.25) / 0.75), "in"), dk = clamp(cr / 0.75);
  let s = `<g transform="translate(0,${n(-46 * (1 - e) + 34 * sink)})" opacity="${n(clamp(ap * 5) * (1 - clamp((cr - 0.55) / 0.45)))}">${a}${dk > 0 ? `<path d="${od}" fill="${C.night}" opacity="${n(dk * 0.94)}" stroke="${C.night}" stroke-width="3"/>` : ""}</g>`;
  if (cr <= 0 && land > 0 && land < 1) for (const [bx, dir] of [[x0 + 40, -1], [x1 - 40, 1], [x0 + 300, -0.3], [x1 - 320, 0.3]]) s += `<path d="${pd(lump(bx + dir * 46 * land, y1 + 4 - 10 * land, 26 + 30 * land, 9 + 8 * land, bx, 9, 0.25))}" fill="${C.shade}" opacity="${n(0.5 * (1 - land))}"/>`;
  if (cr > 0) for (let i = 0; i < 38; i++) { const d0 = hash(i + 400) * 0.55, u = clamp((cr - d0) / 0.42); if (u <= 0 || u >= 1) continue; const x = x0 + 20 + hash(i + 410) * (x1 - x0 - 40) + jit(i + 420, 14) * u, y = y0 + 150 + hash(i + 430) * (y1 - y0 - 150) + 80 * u * u + 10 * u, r = 2 + hash(i + 440) * 5; s += i % 4 ? `<path d="M${n(x)},${n(y)} l${n(jit(i + 450, 2))},${n(-8 - 22 * u)}" stroke="${C.shade}" stroke-width="${n(r * 0.7)}" stroke-linecap="round" opacity="${n(0.75 * (1 - u))}"/>` : `<path d="${pd(lump(x, y, r * 1.5, r, i + 460, 5, 0.3))}" fill="${C.base}" opacity="${n(1 - u)}"/>`; }
  return s;
}

// ================================================================ C "shepherd": a painted board in the village colours
// Three weathered planks in the village blue, the title brushed on in whitewash, a crook painted beside the small line.
// The O of WOLF is painted round a knothole: near the end two yellow eyes open in it and blink. Out: one brush wipe.
const SH = { blue: "#1c50d8", blueL: "#3f76f2", blueS: "#12349a", gap: "#06184a", wood: "#8a5230", woodL: "#c08a4a", woodS: "#4a2a20", white: "#f4f7ff", whiteS: "#b9c8f4", hole: "#02040c", eye: "#ffe21a", eyeHot: "#fffbd0", iron: "#1a1830" };
function eyesPair(cx, cy, w, open, blink, look = 0) {
  const k = clamp(open) * (1 - clamp(blink)); if (open <= 0) return "";
  const one = (x, dir) => { const h = w * 0.6 * k + 0.6, rot = dir * 13; return `<g transform="translate(${n(x)},${n(cy)}) rotate(${rot})"><path d="M${n(-w)},${n(h * 0.25)} Q${n(-w * 0.1)},${n(-h * 1.5)} ${n(w)},${n(-h * 0.25)} Q${n(w * 0.1)},${n(h * 1.2)} ${n(-w)},${n(h * 0.25)} Z" fill="${SH.eye}" stroke="#1a0c00" stroke-width="1.2"/>${k > 0.35 ? `<path d="M${n(-w * 0.5)},${n(-h * 0.1)} Q0,${n(-h * 0.9)} ${n(w * 0.6)},${n(-h * 0.3)} Q0,${n(h * 0.2)} ${n(-w * 0.5)},${n(-h * 0.1)} Z" fill="${SH.eyeHot}"/><ellipse cx="${n(look * w * 0.3)}" cy="${n(-h * 0.1)}" rx="${n(w * 0.17)}" ry="${n(h * 0.62)}" fill="#150900"/>` : ""}</g>`; };
  return one(cx - w * 1.18, 1) + one(cx + w * 1.18, -1);
}
function titleShepherd(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const x0 = 58, x1 = 1022, y0 = 196, y1 = 474, C = SH, T_ = TITLE_STYLES.shepherd.time;
  // three planks, sawn by eye: uneven ends, a dark gap between them
  const rows = [[y0, y0 + 82, -6, 8], [y0 + 86, y0 + 202, 10, -4], [y0 + 206, y1, -2, 12]];
  const planks = rows.map(([a, b, dl, dr], i) => rough([[x0 + dl, a + (i ? 0 : 3)], [x1 + dr, a + (i ? 2 : 0)], [x1 + dr - 5, b - 1], [x0 + dl + 4, b + (i === 2 ? -3 : 1)]], 50 + i, 1.5, 60));
  const od = planks.map((p) => pd(p)).join("");
  let a = `<path d="${od}" fill="${C.gap}" stroke="${C.gap}" stroke-width="9" stroke-linejoin="round" transform="translate(0,3)"/><clipPath id="tSb"><path d="${od}"/></clipPath>`;
  planks.forEach((p, i) => { a += `<path d="${pd(p)}" fill="${C.woodS}" transform="translate(0,6)"/><path d="${pd(p)}" fill="${C.blue}"/>`; });
  a += `<g clip-path="url(#tSb)">`;
  // paint laid along the grain: long strokes lighter and darker, grain lines, bare wood where it has flaked
  for (let i = 0; i < 30; i++) { const y = y0 + 6 + hash(i + 3) * (y1 - y0 - 12), x = x0 - 20 + hash(i + 13) * 760, l = 160 + hash(i + 23) * 420; a += `<path d="M${n(x)},${n(y)} q${n(l / 2)},${n(jit(i + 33, 5))} ${n(l)},${n(jit(i + 43, 3))}" stroke="${i % 3 ? C.blueL : C.blueS}" stroke-width="${n(3 + hash(i + 53) * 9)}" stroke-linecap="round" fill="none" opacity="${i % 3 ? 0.42 : 0.55}"/>`; }
  for (let i = 0; i < 16; i++) { const y = y0 + 8 + hash(i + 63) * (y1 - y0 - 16), x = x0 + hash(i + 73) * 800; a += `<path d="M${n(x)},${n(y)} q60,${n(jit(i + 83, 6))} ${n(110 + hash(i + 93) * 90)},${n(jit(i + 103, 4))}" stroke="${C.gap}" stroke-width="1.5" fill="none" opacity="0.5"/>`; }
  for (const [cx, cy, rx, ry, sd] of [[x0 + 24, y0 + 30, 34, 13, 1], [x1 - 30, y0 + 150, 40, 15, 2], [x0 + 60, y1 - 12, 56, 11, 3], [x1 - 190, y0 + 6, 46, 9, 4], [x0 + 470, y0 + 86, 60, 7, 5], [x1 - 60, y1 - 22, 30, 13, 6]]) a += `<path d="${pd(lump(cx, cy, rx, ry, sd + 20, 10, 0.32))}" fill="${C.wood}"/><path d="${pd(lump(cx + 3, cy - 1, rx * 0.55, ry * 0.42, sd + 26, 8, 0.3))}" fill="${C.woodL}"/>`;
  // a hand-run white border line and four forged nails
  a += `<path d="${pd(rough([[x0 + 22, y0 + 16], [x1 - 20, y0 + 14], [x1 - 22, y1 - 15], [x0 + 20, y1 - 17]], 60, 1.6, 44))}" fill="none" stroke="${C.white}" stroke-width="4.6" stroke-linejoin="round" opacity="0.92" stroke-dasharray="230 5 310 8 190 4"/>`;
  for (const [nx, ny, sd] of [[x0 + 44, y0 + 44, 1], [x1 - 42, y0 + 42, 2], [x0 + 46, y1 - 44, 3], [x1 - 40, y1 - 46, 4]]) a += `<path d="${pd(lump(nx, ny, 8, 8, sd + 70, 6, 0.2))}" fill="${C.iron}"/><path d="M${nx - 4},${ny - 3} l5,-2" stroke="${C.whiteS}" stroke-width="2" stroke-linecap="round"/><path d="M${nx},${ny + 8} l${n(jit(sd, 2))},${n(10 + sd * 3)}" stroke="${C.woodS}" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>`;
  a += `</g>`;
  // the lettering, brushed: THE BOY WHO small with a painted crook, CRIED WOLF big, the O of WOLF round the knothole
  const c1 = 44, r1 = y0 + 30, o1 = { track: 13, seed: 14, amp: 1.5, jy: 1.6, jr: 2, flare: 0.22 }, w1 = capsWidth("THE BOY WHO", c1, o1), g1 = capsLine("THE BOY WHO", 540 - w1 / 2 + 22, r1, c1, o1).g;
  const c2 = 108, r2 = y0 + 90, o2 = { track: 9, seed: 17, amp: 2.3, jy: 2.6, jr: 1.6, flare: 0.25, sub: { O: "@" }, subAt: 6 }, w2 = capsWidth("CRIED WOLF", c2, o2), g2 = capsLine("CRIED WOLF", 540 - w2 / 2, r2, c2, o2).g, O = g2[6].hole;
  let ink = "";
  const crX = 540 - w1 / 2 - 22;
  ink += `<path d="M${n(crX)},${r1 + c1 + 4} L${n(crX + 3)},${r1 + 8} Q${n(crX + 3)},${r1 - 8} ${n(crX - 12)},${r1 - 6} Q${n(crX - 22)},${r1 - 3} ${n(crX - 19)},${r1 + 9}" fill="none" stroke="${C.white}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  [...g1, ...g2].forEach((g, i) => { const big = g.h > 100, id = `tSg${i}`;
    ink += `<path d="${g.d}" fill="${C.gap}" opacity="0.55" transform="translate(${big ? 4 : 2},${big ? 5 : 3})"/><path d="${g.d}" fill="${C.white}" stroke="${C.white}" stroke-width="${big ? 2.6 : 1.6}" stroke-linejoin="round"/><clipPath id="${id}"><path d="${g.d}"/></clipPath><g clip-path="url(#${id})">`;
    for (let k = 0; k < (big ? 5 : 2); k++) { const yy = g.y + g.h * (0.12 + 0.76 * hash(i * 9 + k + 200)), xx = g.x + g.w * hash(i * 9 + k + 210) * 0.7; ink += `<path d="M${n(xx)},${n(yy)} l${n(g.w * (0.3 + 0.5 * hash(i * 9 + k + 220)))},${n(jit(i * 9 + k + 230, 3))}" stroke="${k % 2 ? C.whiteS : C.blueL}" stroke-width="${n(1.4 + hash(i * 9 + k + 240) * 2.2)}" stroke-linecap="round" opacity="0.8"/>`; }
    ink += `</g>`;
    if (big && i % 3 === 1) { const dx = g.x + g.w * (0.2 + 0.2 * hash(i + 250)); ink += `<path d="M${n(dx)},${n(g.y + g.h - 3)} l${n(jit(i + 260, 1.5))},${n(10 + hash(i + 270) * 12)}" stroke="${C.white}" stroke-width="3.4" stroke-linecap="round"/>`; } });
  const tz = teaserText(o);
  if (tz) { const ts = teaserFit(tz, 540, y1 - 57, 26, x1 - x0 - 130, { seed: 11, track: 20, jr: 4, jy: 2 }); ink += `<path d="${ts.d}" fill="none" stroke="${C.white}" stroke-width="${n(4.6 * ts.cap / 26)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  // the knothole (always there, dark) and the eyes in it
  const hole = `<path d="${pd(lump(O.c[0], O.c[1], O.rx * 0.95, O.ry * 0.95, 91, 11, 0.07))}" fill="${C.hole}" stroke="${C.woodS}" stroke-width="3"/>`;
  const eyeT = o.eyes ?? clamp((t - T_.eyes) / 0.14), eyes = eyesPair(O.c[0], O.c[1] + 1, O.rx * 0.46, eyeT, blinkAmt(t, [T_.eyes + 0.32]), Math.sin(t * 5) * 0.4);
  // in: the board swings down on its top edge, the whitewash goes on left to right. out: the wipe
  const e = ease(clamp(ap / 0.5), "back"), pu = clamp((ap - 0.18) / 0.82), pxE = lerp(x0 - 60, x1 + 80, pu), wu = ease(clamp(cr / 0.86)), wx = lerp(x0 - 90, x1 + 90, wu), BANDS = 13, bh = (y1 - y0 + 40) / BANDS;
  const ragged = (xe, sd, amp, right) => { const p = []; for (let i = 0; i <= BANDS; i++) { const q = xe + jit(sd + i, amp); p.push([q, y0 - 20 + i * bh], [q, y0 - 20 + (i + 1) * bh]); } return pd(right ? [...p, [W + 40, y1 + 40], [W + 40, y0 - 40]] : [...p, [-40, y1 + 40], [-40, y0 - 40]]); };
  let s = `<g transform="rotate(${n(-7 * (1 - e))} 540 ${y0 - 40})" opacity="${n(clamp(ap * 6))}">${a}${hole}`;
  s += pu < 1 ? `<clipPath id="tSp"><path d="${ragged(pxE, 300, 26, false)}"/></clipPath><g clip-path="url(#tSp)">${ink}</g>` : ink;
  s += eyes + `</g>`;
  if (cr <= 0) return s;
  let wipe = `<clipPath id="tSw"><path d="${ragged(wx, 500, 34, true)}"/></clipPath><g clip-path="url(#tSw)">${s}</g>`;
  for (let i = 0; i < BANDS * 3; i++) { const yy = y0 - 16 + (i + 0.5) * bh / 3 + jit(i + 520, 2.5), xe = wx + jit(500 + Math.floor(i / 3), 34), len = (40 + hash(i + 530) ** 2 * 380) * clamp(wu * 4) * (1 - wu * 0.5); if (yy > y1 + 10) continue; wipe += `<path d="M${n(xe - len)},${n(yy + jit(i + 540, 3))} L${n(xe + 4)},${n(yy)}" stroke="${i % 5 === 2 ? C.whiteS : C.white}" stroke-width="${n(2 + 7 * hash(i + 550))}" stroke-linecap="round" opacity="${n((0.5 + 0.5 * hash(i + 560)) * clamp(1.25 - wu * 1.25) * clamp(cr * 14))}"/>`; }
  return wipe;
}

// the registry: add a style here ({ fn(t, appear, crumble, opts), time: { in: [a, b], out: [a, b] }, y: [top, bottom] })
export const TITLE_STYLES = {
  vase: { fn: titleVase, time: { in: [0.25, 0.52], out: [2.12, 2.6] }, y: [194, 483] },
  marble: { fn: titleMarble, time: { in: [0.25, 0.47], out: [2.15, 2.6] }, y: [198, 475] },
  shepherd: { fn: titleShepherd, time: { in: [0.25, 0.72], out: [2.26, 2.6], eyes: 1.62 }, y: [193, 480] },
};
export const TITLE_ZONE = { top: 190, bottom: 504 };
export function titleCard(t, o = {}) {
  const S = TITLE_STYLES[o.style || "vase"] || TITLE_STYLES.vase, T_ = S.time;
  const ap = o.appear ?? clamp((t - T_.in[0]) / (T_.in[1] - T_.in[0])), cr = o.crumble ?? clamp((t - T_.out[0]) / (T_.out[1] - T_.out[0]));
  const s = S.fn(t, ap, cr, o);
  return s ? `<clipPath id="tZone"><rect x="0" y="0" width="${W}" height="${TITLE_ZONE.bottom}"/></clipPath><g clip-path="url(#tZone)">${s}</g>` : "";
}
// the alphabet and its tools, for the next Greek title card (legend-pandora-title.mjs adds the glyphs it needs to GLYPH)
export const LETTERING = { GLYPH, TH, TN, s_, arcP, capsLine, capsWidth, scratchLine, scratchWidth, teaserFit, rough, lump, pd, wind, meander };
