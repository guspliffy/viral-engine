// Legend channel, Hansel and Gretel: the OPENING STORY BANNER, three options for Jonny to pick from (27 Nov 2026).
//   titleSvg(style, t, { teaser = "T1", end = 3.0 }) -> an SVG fragment for video time t (s from the start);
//   "" before 0 and from `end` (the first cut). Fades in over 0.25 s, out over the last 0.2 s.
//   "grimm"           A  the 1812 book's title page: aged paper, double rule, broken-pen black-letter capitals, red teaser
//   "lebkuchen"       B  a Lebkuchen fair heart on its ribbon, the title piped in white royal icing, teaser on a red ribbon
//   "scherenschnitt"  C  a black paper-cut: firs, the house (two red eyes in its window), the title cut out of the black
//   teaser: "T1" ...the house that smells you back · "T2" ...don't eat the windows · "T3" ...the first version was darker
//   (or any string of your own).
// Layout: the upper area only, everything inside x 80..1000, y 140..504; speech subtitles sit below at y ~580.
// Hand-made: the letters are our own pen strokes (one skeleton, three tools: broad nib, icing bag, knife); only the small
// teaser line is a system font. Every wobble is seeded with hash(). A pure function of t. Ids start with "hgt-".
import { n, lerp, clamp, hash, mix } from "./legend.mjs";

const NAME = "HANSEL & GRETEL";
export const TEASERS = { T1: "...the house that smells you back", T2: "...don't eat the windows", T3: "...the first version was darker" };
const TAU = Math.PI * 2, jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp, op = (v) => Math.round(clamp(v) * 100) / 100;
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);

// ---------------------------------------------------------------- our capitals as pen skeletons (100 tall)
const GL = {
  H: { w: 50, s: [[[0, 0], [0, 100]], [[50, 0], [50, 100]], [[0, 53], [50, 45]]] },
  A: { w: 56, s: [[[0, 100], [26, 0], [56, 100]], [[11, 64], [46, 60]]] },
  N: { w: 52, s: [[[0, 100], [0, 0], [52, 100], [52, 0]]] },
  S: { w: 50, s: [[[50, 15], [37, 0], [13, 0], [0, 14], [0, 34], [13, 48], [37, 52], [50, 66], [50, 86], [37, 100], [13, 100], [0, 85]]] },
  E: { w: 46, s: [[[46, 0], [0, 0], [0, 100], [46, 100]], [[0, 51], [36, 47]]] },
  L: { w: 44, s: [[[0, 0], [0, 100], [44, 100]]] },
  G: { w: 52, s: [[[52, 16], [38, 0], [14, 0], [0, 16], [0, 84], [14, 100], [38, 100], [52, 84], [52, 54], [28, 54]]] },
  R: { w: 52, s: [[[0, 100], [0, 0], [36, 0], [50, 12], [50, 38], [36, 50], [0, 52]], [[24, 51], [52, 100]]] },
  T: { w: 56, s: [[[0, 0], [56, 0]], [[28, 0], [28, 100]]] },
  "&": { w: 58, s: [[[56, 100], [12, 28], [12, 12], [23, 0], [34, 0], [44, 12], [44, 24], [0, 66], [0, 86], [14, 100], [30, 100], [56, 60]]] },
};
// lay a text out: -> [{ ch, strokes [[x, y] px] }], centred on cx; h = cap height px, shrunk to fit maxW; tall stretches the caps
function lay(text, h, cx, top, gap = 16, space = 34, amp = 1.2, seed = 0, maxW = 1e9, tall = 1) {
  let x = 0; const out = [];
  [...text].forEach((ch, li) => { if (ch === " ") { x += space; return; } const g = GL[ch]; out.push({ ch, li, x, g }); x += g.w + gap; });
  const tot = x - gap, sc = Math.min(h / 100, maxW / tot), x0 = cx - tot * sc / 2;
  for (const L of out) L.strokes = L.g.s.map((st) => st.map(([px, py]) => { const sd = px * 7.3 + py * 13.7 + L.li * 101 + seed; return [x0 + (L.x + px) * sc + jit(sd, amp), top + py * sc * tall + jit(sd + 0.5, amp)]; }));
  return { letters: out, w: tot * sc, x0 };
}
// broad nib: every segment is the nib's edge swept along it; a small diamond closes each stroke end
function nib(strokes, nw, ang = 35) {
  const a = ang * Math.PI / 180, vx = Math.cos(a) * nw / 2, vy = -Math.sin(a) * nw / 2; let d = "";
  for (const st of strokes) {
    for (let i = 0; i < st.length - 1; i++) { const [ax, ay] = st[i], [bx, by] = st[i + 1]; d += `M${n(ax + vx)},${n(ay + vy)} L${n(bx + vx)},${n(by + vy)} L${n(bx - vx)},${n(by - vy)} L${n(ax - vx)},${n(ay - vy)} Z `; }
    for (const [ex, ey] of [st[0], st[st.length - 1]]) { const r = nw * 0.62; d += `M${n(ex)},${n(ey - r)} L${n(ex + r)},${n(ey)} L${n(ex)},${n(ey + r)} L${n(ex - r)},${n(ey)} Z `; }
  }
  return d;
}
const round = (strokes) => strokes.map((st) => "M" + st.map(([x, y]) => `${n(x)},${n(y)}`).join(" L")).join(" ");
const teaserOf = (o) => TEASERS[o.teaser] || o.teaser || TEASERS.T1;
const txt = (s, x, y, size, fill, extra = "") => `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" font-size="${size}" fill="${fill}" ${extra}>${s.replace(/&/g, "&amp;")}</text>`;

// ================================================================= A  grimm: the 1812 title page
function grimm(t, o) {
  const x0 = 104, x1 = 976, y0 = 148, y1 = 500, paper = "#e9dcba", ink = "#1c1410", red = "#9a2418";
  const edge = (xa, ya, xb, yb, k, sd) => Array.from({ length: k }, (_, i) => `${n(lerp(xa, xb, (i + 1) / k) + jit(sd + i, 3))},${n(lerp(ya, yb, (i + 1) / k) + jit(sd + i + 50, 3))}`).join(" L");
  let s = `<path d="M${x0},${y0} L${edge(x0, y0, x1, y0, 14, 1)} L${edge(x1, y0, x1, y1, 7, 2)} L${edge(x1, y1, x0, y1, 14, 3)} L${edge(x0, y1, x0, y0, 7, 4)} Z" fill="#0a0608" opacity="0.5" transform="translate(7,9)"/>`;
  s += `<path d="M${x0},${y0} L${edge(x0, y0, x1, y0, 14, 1)} L${edge(x1, y0, x1, y1, 7, 2)} L${edge(x1, y1, x0, y1, 14, 3)} L${edge(x0, y1, x0, y0, 7, 4)} Z" fill="${paper}" stroke="#8a744a" stroke-width="2"/>`;
  for (let i = 0; i < 16; i++) { const fx = lerp(x0 + 20, x1 - 20, hash(i + 20)), fy = lerp(y0 + 14, y1 - 14, hash(i + 40)), r = 5 + hash(i + 60) * 16; s += `<path d="M${n(fx - r)},${n(fy)} Q${n(fx - r * 0.6)},${n(fy - r * 0.8)} ${n(fx + r * 0.2)},${n(fy - r * 0.7)} Q${n(fx + r)},${n(fy - r * 0.3)} ${n(fx + r * 0.8)},${n(fy + r * 0.5)} Q${n(fx)},${n(fy + r)} ${n(fx - r)},${n(fy)} Z" fill="#b8905a" opacity="${op(0.1 + hash(i + 80) * 0.14)}"/>`; }
  s += `<path d="M${x0},${y0 + 60} L${x0 + 46},${y0} L${x0},${y0} Z M${x1},${y1 - 50} L${x1 - 40},${y1} L${x1},${y1} Z" fill="#b8905a" opacity="0.28"/>`;
  s += `<rect x="${x0 + 18}" y="${y0 + 16}" width="${x1 - x0 - 36}" height="${y1 - y0 - 32}" fill="none" stroke="${ink}" stroke-width="4.5"/><rect x="${x0 + 27}" y="${y0 + 25}" width="${x1 - x0 - 54}" height="${y1 - y0 - 50}" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
  s += txt("KINDER- UND HAUSMÄRCHEN · N° 15", 540, 214, 25, ink, `font-family="'Liberation Serif','DejaVu Serif',serif" letter-spacing="5"`);
  const L = lay(NAME, 104, 540, 246, 26, 40, 1.0, 3, 760, 1.25);
  const d = L.letters.map((q) => nib(q.strokes, 15)).join("");
  s += `<path d="${d}" fill="#7a6a4a" opacity="0.35" transform="translate(2.5,3)"/><path d="${d}" fill="${ink}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // a tapered rule with a diamond
  s += `<path d="M300,376 L520,373 L520,379 Z M780,376 L560,373 L560,379 Z M540,366 L550,376 L540,386 L530,376 Z" fill="${ink}"/>`;
  s += txt(teaserOf(o), 540, 428, 41, red, `font-family="'Liberation Serif','DejaVu Serif',serif" font-style="italic" font-weight="700"`);
  s += txt("KASSEL · 1812", 540, 468, 22, ink, `font-family="'Liberation Serif','DejaVu Serif',serif" letter-spacing="7"`);
  return s;
}

// ================================================================= B  lebkuchen: the fair heart
function lebkuchen(t, o) {
  const cx = 540, top = 168, wv = 372, bot = 500, sw = Math.sin(t * 2.2) * 1.6 * Math.exp(-t * 0.6);
  const heart = (k, dy = 0) => { const w = wv * k, a = top + dy + (1 - k) * 150, b = bot - (1 - k) * 190; return `M${cx},${n(a + 62 * k)} C${n(cx - w * 0.2)},${n(a - 34 * k)} ${n(cx - w * 0.98)},${n(a - 30 * k)} ${n(cx - w)},${n(a + 96 * k)} C${n(cx - w * 1.02)},${n(a + 190 * k)} ${n(cx - w * 0.42)},${n(b - 62 * k)} ${cx},${n(b)} C${n(cx + w * 0.42)},${n(b - 62 * k)} ${n(cx + w * 1.02)},${n(a + 190 * k)} ${n(cx + w)},${n(a + 96 * k)} C${n(cx + w * 0.98)},${n(a - 30 * k)} ${n(cx + w * 0.2)},${n(a - 34 * k)} ${cx},${n(a + 62 * k)} Z`; };
  let s = `<g transform="rotate(${n(sw)} ${cx} 0)">`;
  s += `<path d="M${cx - 150},${top + 18} L${cx - 40},-10 M${cx + 150},${top + 18} L${cx + 40},-10" stroke="#7a0f1c" stroke-width="20" stroke-linecap="round"/><path d="M${cx - 150},${top + 18} L${cx - 40},-10 M${cx + 150},${top + 18} L${cx + 40},-10" stroke="#d8263a" stroke-width="13" stroke-linecap="round"/>`;
  s += `<path d="${heart(1)}" fill="#1a0c08" opacity="0.55" transform="translate(8,10)"/><path d="${heart(1)}" fill="#8f4f24" stroke="#2a1408" stroke-width="5" stroke-linejoin="round"/>`;
  s += `<path d="${heart(0.955)}" fill="#a35f2c"/>`;
  for (let i = 0; i < 46; i++) { const a = hash(i + 5) * TAU, r = Math.sqrt(hash(i + 9)), x = cx + Math.cos(a) * r * 300, y = 330 + Math.sin(a) * r * 130; s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1.4 + hash(i) * 1.8)}" fill="#7a4018" opacity="0.5"/>`; }
  // piped border: a row of icing shells along the heart, sugar flowers at the shoulders
  s += `<path d="${heart(0.9)}" fill="none" stroke="#fffaf0" stroke-width="13" stroke-linecap="round" stroke-dasharray="1 23"/><path d="${heart(0.9)}" fill="none" stroke="#ffb8cc" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 23" stroke-dashoffset="12"/>`;
  // the title, piped
  const pipe = (L, w) => { const d = L.letters.map((q) => round(q.strokes)).join(" "); return `<path d="${d}" fill="none" stroke="#5a2c10" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round" transform="translate(2,4)"/><path d="${d}" fill="none" stroke="#fffaf0" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="${n(w * 0.3)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1.5,-2)" opacity="0.9"/>`; };
  s += pipe(lay("HANSEL", 76, cx, 226, 20, 30, 1.8, 11), 12.5) + pipe(lay("& GRETEL", 76, cx, 324, 20, 30, 1.8, 23), 12.5);
  for (const [fx, fy] of [[cx - 268, 262], [cx + 268, 262]]) { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; s += `<circle cx="${n(fx + Math.cos(a) * 11)}" cy="${n(fy + Math.sin(a) * 11)}" r="8" fill="#ff9ab8" stroke="#5a2c10" stroke-width="1.5"/>`; } s += `<circle cx="${fx}" cy="${fy}" r="6" fill="#ffe26a" stroke="#5a2c10" stroke-width="1.5"/>`; }
  // the teaser on a red ribbon across the point of the heart
  const ry = 428, rh = 62, rx0 = 150, rx1 = 930;
  s += `<path d="M${rx0 - 46},${ry + 14} L${rx0 + 30},${ry + 8} L${rx0 + 30},${ry + rh + 8} L${rx0 - 46},${ry + rh + 14} L${rx0 - 22},${ry + rh / 2 + 14} Z M${rx1 + 46},${ry + 14} L${rx1 - 30},${ry + 8} L${rx1 - 30},${ry + rh + 8} L${rx1 + 46},${ry + rh + 14} L${rx1 + 22},${ry + rh / 2 + 14} Z" fill="#8a1220" stroke="#2a0608" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${rx0},${ry} Q${cx},${ry - 12} ${rx1},${ry} L${rx1},${ry + rh} Q${cx},${ry + rh - 12} ${rx0},${ry + rh} Z" fill="#d8263a" stroke="#2a0608" stroke-width="3" stroke-linejoin="round"/><path d="M${rx0 + 6},${ry + 8} Q${cx},${ry - 4} ${rx1 - 6},${ry + 8}" stroke="#ff7a8a" stroke-width="2.5" fill="none"/>`;
  s += `<path id="hgt-rib" d="M${rx0 + 20},${ry + 43} Q${cx},${ry + 31} ${rx1 - 20},${ry + 43}" fill="none"/><text font-family="Inter" font-weight="900" font-size="38" fill="#fffaf0" stroke="#5a0a14" stroke-width="5" stroke-linejoin="round" paint-order="stroke" text-anchor="middle"><textPath href="#hgt-rib" startOffset="50%">${teaserOf(o).replace(/&/g, "&amp;")}</textPath></text>`;
  return s + `</g>`;
}

// ================================================================= C  scherenschnitt: black paper on white
function scherenschnitt(t, o) {
  const x0 = 92, x1 = 988, y0 = 150, y1 = 502, paper = "#f2ead8", blk = "#0e0b10";
  const fir = (x, base, h, w, sd) => { let d = `M${n(x - w * 0.09)},${n(base)} L${n(x - w * 0.09)},${n(base - h * 0.16)}`; const k = 5; for (let i = 0; i < k; i++) { const u = i / k, yy = base - h * (0.16 + 0.84 * u), ww = w * (1 - u * 0.86) * (1 + jit(sd + i, 0.1)); d += ` L${n(x - ww)},${n(yy + jit(sd + i + 9, 3))} L${n(x - ww * 0.42)},${n(yy - h * 0.13)}`; } d += ` L${n(x)},${n(base - h)}`; for (let i = k - 1; i >= 0; i--) { const u = i / k, yy = base - h * (0.16 + 0.84 * u), ww = w * (1 - u * 0.86) * (1 + jit(sd + i + 20, 0.1)); d += ` L${n(x + ww * 0.42)},${n(yy - h * 0.13)} L${n(x + ww)},${n(yy + jit(sd + i + 29, 3))}`; } return d + ` L${n(x + w * 0.09)},${n(base - h * 0.16)} L${n(x + w * 0.09)},${n(base)} Z`; };
  let s = `<rect x="${x0 + 7}" y="${y0 + 9}" width="${x1 - x0}" height="${y1 - y0}" rx="10" fill="#050308" opacity="0.5"/><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="10" fill="${paper}"/>`;
  s += `<circle cx="770" cy="352" r="46" fill="#fffdf4" stroke="#d9cdb0" stroke-width="2"/>`;
  // one sheet of black: frame, the title band, firs, ground, the house
  const band0 = y0 + 30, band1 = y0 + 148, gy = 448;
  let d = `M${x0},${y0} H${x1} V${y1} H${x0} Z M${x0 + 16},${band1} V${y1 - 16} H${x1 - 16} V${band1} Z`;
  s += `<path d="${d}" fill="${blk}" fill-rule="evenodd"/>`;
  // scalloped lower edge of the band (paper lace)
  let sc = `M${x0 + 16},${band1}`; for (let x = x0 + 16; x < x1 - 17; x += 36.2) sc += ` q18.1,20 36.2,0`; s += `<path d="${sc} Z" fill="${blk}"/>`;
  for (let x = x0 + 34; x < x1 - 20; x += 36.2) s += `<circle cx="${n(x)}" cy="${band1 - 9}" r="3.6" fill="${paper}"/>`;
  s += `<rect x="${x0 + 16}" y="${y0 + 14}" width="${x1 - x0 - 32}" height="5" fill="${paper}"/>`;
  // ground + firs + house + children
  let g = `M${x0 + 16},${gy + 6} Q300,${gy - 10} 540,${gy} T${x1 - 16},${gy - 4} V${y1 - 16} H${x0 + 16} Z `;
  [[150, 150, 44, 1], [222, 118, 36, 2], [290, 96, 30, 3], [356, 70, 24, 4], [930, 152, 44, 5], [862, 116, 36, 6], [690, 84, 28, 7], [634, 60, 22, 8]].forEach(([x, h, w, sd]) => { g += fir(x, gy + 4, h, w, sd * 7) + " "; });
  const hx = 500, hb = gy + 2;
  g += `M${hx - 44},${hb} V${hb - 44} L${hx - 56},${hb - 44} L${hx},${hb - 92} L${hx + 22},${hb - 73} V${hb - 92} H${hx + 36} V${hb - 61} L${hx + 56},${hb - 44} L${hx + 44},${hb - 44} V${hb} Z `;
  s += `<path d="${g}" fill="${blk}"/>`;
  s += `<rect x="${hx - 30}" y="${hb - 36}" width="24" height="20" fill="${paper}"/><circle cx="${hx - 23}" cy="${hb - 26}" r="3.3" fill="#e0201a"/><circle cx="${hx - 13}" cy="${hb - 26}" r="3.3" fill="#e0201a"/>`;
  s += `<path d="M${hx + 8},${hb} V${hb - 30} Q${hx + 20},${hb - 42} ${hx + 32},${hb - 30} V${hb} Z" fill="${paper}"/><path d="M${hx + 29},${hb - 96} q10,-10 0,-20 q-10,-10 2,-22" stroke="${blk}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // two children, hand in hand
  const kid = (x, h, girl) => `<circle cx="${x}" cy="${n(gy - h)}" r="${n(h * 0.2)}" fill="${blk}"/>` + (girl ? `<path d="M${x - h * 0.12},${n(gy - h * 0.8)} L${x + h * 0.12},${n(gy - h * 0.8)} L${x + h * 0.34},${n(gy - h * 0.2)} L${x - h * 0.34},${n(gy - h * 0.2)} Z M${x - h * 0.12},${n(gy - h * 0.25)} h${n(h * 0.09)} V${gy + 4} h${n(-h * 0.09)} Z M${x + h * 0.03},${n(gy - h * 0.25)} h${n(h * 0.09)} V${gy + 4} h${n(-h * 0.09)} Z" fill="${blk}"/><path d="M${x - h * 0.2},${n(gy - h * 1.0)} l${n(-h * 0.1)},${n(h * 0.28)} M${x + h * 0.2},${n(gy - h * 1.0)} l${n(h * 0.1)},${n(h * 0.28)}" stroke="${blk}" stroke-width="5" stroke-linecap="round"/>` : `<path d="M${x - h * 0.17},${n(gy - h * 0.8)} h${n(h * 0.34)} V${n(gy - h * 0.36)} h${n(-h * 0.34)} Z M${x - h * 0.15},${n(gy - h * 0.38)} h${n(h * 0.12)} V${gy + 4} h${n(-h * 0.12)} Z M${x + h * 0.03},${n(gy - h * 0.38)} h${n(h * 0.12)} V${gy + 4} h${n(-h * 0.12)} Z" fill="${blk}"/>`);
  s += kid(408, 50, false) + kid(440, 40, true) + `<path d="M416,${gy - 30} L432,${gy - 24}" stroke="${blk}" stroke-width="5" stroke-linecap="round"/>`;
  // a bird
  s += `<path d="M596,330 q10,-12 20,0 q10,-12 20,0 q-10,-4 -20,6 q-10,-10 -20,-6 Z" fill="${blk}"/>`;
  // the title, cut out of the band
  const L = lay(NAME, 80, 540, band0 + 14, 26, 40, 0.9, 5, 800, 1.2);
  const td = L.letters.map((q) => nib(q.strokes, 14, 28)).join("");
  s += `<path d="${td}" fill="${paper}" stroke="${paper}" stroke-width="1.5" stroke-linejoin="round"/>`;
  // the teaser, cut out of the ground
  s += txt(teaserOf(o), 540, y1 - 24, 31, paper, `font-family="Inter" font-weight="900" letter-spacing="0.6"`);
  return s;
}

const STYLES = { grimm, lebkuchen, scherenschnitt };
export function titleSvg(style, t, o = {}) {
  const end = o.end ?? 3.0;
  if (!(t >= 0) || t >= end || !STYLES[style]) return "";
  const a = Math.min(clamp(t / 0.25), clamp((end - t) / 0.2)), e = eo(t / 0.25);
  return `<g id="hgt-${style}" opacity="${op(a)}" transform="translate(0,${n((1 - e) * -14)})">${STYLES[style](t, o)}</g>`;
}
