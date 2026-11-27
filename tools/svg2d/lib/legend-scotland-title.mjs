// Legend channel, "The Kelpie" (Loch Sunart, Scotland): the opening story banner, three styles for Jonny to pick from.
//   titleCard(t, { style, teaser, appear, out }) -> SVG fragment (1080x1920 screen space; draw it over the picture,
//   the subtitle goes on top of / below it).
//     style   "stone" (A, default) | "weed" (B) | "bridle" (C)      ("A" / "B" / "C" work too; registry: TITLE_STYLES)
//     teaser  "T1" (default) | "T2" | "T3" (TEASERS) | any text in the letters the alphabet has | "" for none
//     With no appear / out the card runs its own clock from t (seconds from the video's start): built by 0.25 s,
//     holds, gone by 2.5 s (TITLE_STYLES[style].time). appear 0..1 = the way in, out 0..1 = the way out (1 = nothing).
//   A "stone"   carved into a mossy Highland standing stone, a Celtic plait along the edges; it sinks into the loch mist
//   B "weed"    woven from dark wet water weed with a moonlit rim; it drips while it holds, then slides back under
//   C "bridle"  silver bridle rings joined by braided weed, a rein under the name; the braid lets go and the rings fall
// Where it lives: y 190..440 only (below TikTok's top bar, above the subtitle row at y 480..580, far above the
// kelpie's eye at y ~1160). Everything is clipped to y <= 440, so nothing that drips or sinks reaches the subtitle.
// Lettering: our own alphabet, drawn here as skeleton strokes on a 100-high box; each style clothes the strokes its
// own way and the same skeletons drawn thin are the teaser hand. Every wobble is seeded with hash(): no Math.random,
// no clock, no fonts, no filters. Ids are fixed and start with "kt".
import { W, n, lerp, clamp, hash, mix } from "./legend.mjs";

const TAU = Math.PI * 2;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3), ei = (u) => Math.pow(clamp(u), 2.4);
const back = (u) => { u = clamp(u); const c = 2.2; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const op = (v) => Math.round(clamp(v) * 100) / 100;
const pl = (a, close = false) => (a.length < 2 ? "" : "M" + a.map((p) => `${n(p[0])},${n(p[1])}`).join(" L") + (close ? " Z" : ""));
const arc = (cx, cy, rx, ry, a0, a1, k) => Array.from({ length: k + 1 }, (_, i) => { const a = lerp(a0, a1, i / k) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const lump = (x, y, rx, ry, seed, k = 10, irr = 0.25) => Array.from({ length: k }, (_, i) => { const an = (i + jit(seed + i * 1.7, 0.3)) / k * TAU, r = 1 + jit(seed + i * 3.1, irr); return [x + Math.cos(an) * rx * r, y + Math.sin(an) * ry * r]; });
function rough(a, seed, amp = 2, per = 40) {
  const out = [];
  for (let i = 0; i < a.length; i++) { const p = a[i], q = a[(i + 1) % a.length], k = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / per));
    for (let j = 0; j < k; j++) { const u = j / k, id = seed * 37 + i * 11 + j * 1.7; out.push([lerp(p[0], q[0], u) + jit(id, j ? amp : amp * 0.4), lerp(p[1], q[1], u) + jit(id + 0.5, j ? amp : amp * 0.4)]); } }
  return out;
}

// ================================================================ the alphabet: [width, ...skeleton strokes]
const BOWL = [[0, 0], ...arc(34, 27, 28, 27, -90, 90, 8), [0, 54]];
const GLYPH = {
  T: [70, [[0, 0], [70, 0]], [[35, 0], [35, 100]]],
  H: [72, [[0, 0], [0, 100]], [[72, 0], [72, 100]], [[0, 50], [72, 50]]],
  E: [58, [[58, 0], [0, 0], [0, 100], [58, 100]], [[0, 50], [46, 50]]],
  F: [56, [[56, 0], [0, 0], [0, 100]], [[0, 50], [44, 50]]],
  K: [68, [[0, 0], [0, 100]], [[66, 0], [0, 58]], [[24, 38], [68, 100]]],
  L: [56, [[0, 0], [0, 100], [56, 100]]],
  I: [6, [[3, 0], [3, 100]]],
  P: [62, [[0, 100], [0, 0]], BOWL],
  R: [66, [[0, 100], [0, 0]], BOWL, [[28, 54], [66, 100]]],
  B: [64, [[0, 0], [0, 100]], [[0, 0], ...arc(30, 25, 26, 25, -90, 90, 7), [0, 50]], [[0, 50], ...arc(32, 75, 30, 25, -90, 90, 7), [0, 100]]],
  D: [72, [[0, 0], [0, 100]], [[0, 0], ...arc(28, 50, 42, 50, -90, 90, 10), [0, 100]]],
  O: [76, arc(38, 50, 38, 50, -90, 270, 18)],
  C: [70, arc(40, 50, 40, 50, -50, -310, 12)],
  G: [72, arc(40, 50, 40, 50, -50, -330, 13), [[44, 56], [74, 56]]],
  S: [62, [[60, 14], [44, 2], [24, 0], [8, 10], [4, 26], [14, 42], [32, 50], [50, 58], [60, 74], [56, 90], [40, 100], [20, 100], [2, 86]]],
  N: [72, [[0, 100], [0, 0], [72, 100], [72, 0]]],
  M: [88, [[0, 100], [0, 0], [44, 70], [88, 0], [88, 100]]],
  A: [76, [[0, 100], [38, 0], [76, 100]], [[14, 64], [62, 64]]],
  U: [70, [[0, 0], [0, 64], ...arc(35, 64, 35, 36, 180, 0, 8), [70, 0]]],
  V: [70, [[0, 0], [35, 100], [70, 0]]],
  W: [96, [[0, 0], [24, 100], [48, 30], [72, 100], [96, 0]]],
  Y: [70, [[0, 0], [35, 52], [70, 0]], [[35, 52], [35, 100]]],
  "…": [92, { dots: [[6, 94], [46, 94], [86, 94]] }],
};
// lay out a line, centred on cx, shrunk to maxW if it must: { L: [{ ch, i, x, w, cx, strokes: [{ p (screen), raw }], dots }], w, x0, cap }
function layout(text, cx, top, cap0, o = {}) {
  const chars = [...text], meas = (cap) => { let x = 0; for (const ch of chars) x += ch === " " ? (o.space ?? 46) * cap / 100 : GLYPH[ch][0] * cap / 100 + (o.track ?? 26) * cap / 100; return x - (o.track ?? 26) * cap / 100; };
  let cap = cap0; const w0 = meas(cap); if (o.maxW && w0 > o.maxW) cap = cap0 * o.maxW / w0;
  const k = cap / 100, tot = meas(cap), x0 = cx - tot / 2, y0 = top + (cap0 - cap) / 2, L = []; let x = x0, i = 0;
  for (const ch of chars) {
    if (ch === " ") { x += (o.space ?? 46) * k; continue; }
    const [gw, ...st] = GLYPH[ch], sd = (o.seed ?? 1) * 17 + i * 5.3, jy = jit(sd + 1, o.jy ?? 0), rot = jit(sd + 2, o.jr ?? 0) * Math.PI / 180, amp = o.amp ?? 1;
    const tf = ([px, py]) => { const lx = (px - gw / 2) * k, ly = (py - 50) * k, s = sd * 3 + px * 7.3 + py * 13.7; return [x + gw * k / 2 + lx * Math.cos(rot) - ly * Math.sin(rot) + jit(s, amp), y0 + cap / 2 + jy + lx * Math.sin(rot) + ly * Math.cos(rot) + jit(s + 0.5, amp)]; };
    const strokes = [], dots = [];
    for (const s of st) { if (s.dots) s.dots.forEach((q) => dots.push(tf(q))); else strokes.push({ p: s.map(tf), raw: s }); }
    L.push({ ch, i, x, w: gw * k, cx: x + gw * k / 2, strokes, dots }); x += gw * k + (o.track ?? 26) * k; i++;
  }
  return { L, w: tot, x0, cap, top: y0 };
}
// points every `step` px along a polyline, each with its travelled length and unit normal: [x, y, s, nx, ny]
function resample(a, step = 5) {
  const out = []; let s = 0, dx = 1, dy = 0;
  for (let i = 0; i < a.length - 1; i++) { const p = a[i], q = a[i + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1e-6, k = Math.max(1, Math.round(len / step)); dx = (q[0] - p[0]) / len; dy = (q[1] - p[1]) / len;
    for (let j = 0; j < k; j++) { const u = j / k; out.push([lerp(p[0], q[0], u), lerp(p[1], q[1], u), s + len * u, -dy, dx]); } s += len; }
  const e = a[a.length - 1]; out.push([e[0], e[1], s, -dy, dx]);
  return out;
}
const side = (pts, fn) => pts.map((p) => { const d = fn(p[2]); return [p[0] + p[3] * d, p[1] + p[4] * d]; });
const cut = (pts, g) => (g >= 1 ? pts : pts.slice(0, Math.max(0, Math.ceil(pts.length * g))));
const stroke = (d, col, w, extra = "") => (d ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>` : "");
// a two-strand plait along resampled points: [strand a, strand b, the bits of a that pass over b]
function plait(pts, amp, per, ph = 0) {
  const f = TAU / per, a = side(pts, (s) => amp * Math.sin(s * f + ph)), b = side(pts, (s) => -amp * Math.sin(s * f + ph)), over = []; let run = null;
  pts.forEach((p, i) => { const v = ((p[2] * f + ph) % TAU + TAU) % TAU, on = Math.abs(v - Math.PI) < 0.75; if (on) (run ||= []).push(a[i]); else if (run) { over.push(run); run = null; } });
  if (run) over.push(run);
  return [a, b, over];
}

export const TEASERS = { T1: "…IT KNEELS FOR CHILDREN", T2: "…HOLD THE BRIDLE", T3: "…NINE CLIMBED ON" };
const NAME = "THE KELPIE";
const teaserText = (v) => { if (v === "" || v === 0 || v === false) return ""; if (v == null || v === 1 || v === true) return TEASERS.T1; return TEASERS[v] || [...String(v).toUpperCase().replace(/\.\.\./g, "…")].filter((ch) => ch === " " || GLYPH[ch]).join(""); };
// the teaser as thin skeleton strokes: { d, dots, w, x0, cap }
function thin(text, cx, top, cap, maxW, seed = 7) {
  if (!text) return { d: "", dots: [], w: 0, x0: cx, cap };
  const lay = layout(text, cx, top, cap, { maxW, track: 30, space: 56, seed, amp: 0.5, jy: 1, jr: 2 });
  return { d: lay.L.map((g) => g.strokes.map((s) => pl(s.p)).join(" ")).join(" "), dots: lay.L.flatMap((g) => g.dots), w: lay.w, x0: lay.x0, cap: lay.cap };
}
const dotsSvg = (dots, r, col, line, lw) => dots.map(([x, y]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${col}"${line ? ` stroke="${line}" stroke-width="${lw}"` : ""}/>`).join("");

// ================================================================ A "stone": a standing stone, carved by moonlight
const ST = { base: "#77879a", lit: "#a9bace", pale: "#d6e4f4", dark: "#46546a", deep: "#273246", cut: "#0d1422", cut2: "#1f2b40", moss: "#1f5a32", mossL: "#3f9a4c", mossP: "#8fd070", lichen: "#c9d6a0" };
function titleStone(t, ap, cr, o) {
  const C = ST, x0 = 44, x1 = 1036, y0 = 196, y1 = 436;
  const ty = -30 * (1 - eo(ap / 0.55)) + ei(cr) * 262, al = clamp(ap / 0.3) * (1 - clamp((cr - 0.8) / 0.2)), rot = 1.6 * ei(cr);
  const out = rough([[x0 + 24, y0 + 9], [300, y0 + 1], [640, y0 + 6], [x1 - 96, y0], [x1 - 16, y0 + 18], [x1, y0 + 74], [x1 - 9, y1 - 42], [x1 - 34, y1 - 5], [600, y1], [x0 + 44, y1 - 2], [x0 + 7, y1 - 38], [x0, y0 + 62]], 3, 2.6, 44), od = pl(out, true);
  let s = `<clipPath id="ktSt"><path d="${od}"/></clipPath><g transform="translate(0,${n(ty)}) rotate(${n(rot)} 540 320)" opacity="${op(al)}">`;
  s += `<path d="${od}" fill="#050912" opacity="0.55" transform="translate(4,9)"/><path d="${od}" fill="${C.base}" stroke="${C.cut}" stroke-width="3.5" stroke-linejoin="round"/><g clip-path="url(#ktSt)">`;
  // moonlight along the top, shade at the foot, the grain of the rock
  s += `<path d="${pl(rough([[x0 - 10, y0 - 10], [x1 + 10, y0 - 10], [x1 + 10, y0 + 30], [700, y0 + 22], [360, y0 + 34], [x0 - 10, y0 + 24]], 5, 3, 60), true)}" fill="${C.lit}"/>`;
  s += `<path d="${pl(rough([[x0 - 10, y1 - 34], [330, y1 - 22], [720, y1 - 36], [x1 + 10, y1 - 26], [x1 + 10, y1 + 10], [x0 - 10, y1 + 10]], 6, 3, 60), true)}" fill="${C.dark}"/>`;
  for (let i = 0; i < 22; i++) { const x = x0 + hash(i + 3) * 920, y = y0 + 20 + hash(i + 13) * 200, l = 60 + hash(i + 23) * 200; s += `<path d="M${n(x)},${n(y)} q${n(l / 2)},${n(jit(i + 33, 5))} ${n(l)},${n(jit(i + 43, 4))}" stroke="${i % 3 ? C.lit : C.dark}" stroke-width="${n(2 + hash(i + 53) * 5)}" stroke-linecap="round" fill="none" opacity="${i % 3 ? 0.4 : 0.45}"/>`; }
  for (let i = 0; i < 70; i++) s += `<circle cx="${n(x0 + hash(i * 1.3 + 61) * 990)}" cy="${n(y0 + hash(i * 1.7 + 71) * 232)}" r="${n(1 + hash(i + 81) * 2.4)}" fill="${i % 2 ? C.deep : C.pale}" opacity="0.5"/>`;
  s += stroke(pl([[x1 - 150, y0 - 4], [x1 - 132, y0 + 34], [x1 - 146, y0 + 62], [x1 - 120, y0 + 96]]), C.deep, 2.6) + stroke(pl([[x0 + 96, y1 + 4], [x0 + 110, y1 - 30], [x0 + 92, y1 - 52]]), C.deep, 2.4);
  // the plait: one long band under the top edge, two short ones flanking the teaser
  const tz = thin(teaserText(o.teaser), 540, 384, 34, 760, 7), kY = y0 + 24, bY = 402;
  const band = (xa, xb, y, sd) => { if (xb - xa < 50) return ""; const per = 46, len = Math.floor((xb - xa) / (per / 2)) * (per / 2), xs = (xa + xb - len) / 2, [a, b, ov] = plait(resample([[xs, y + jit(sd, 1.5)], [xs + len / 2, y + jit(sd + 1, 1.5)], [xs + len, y + jit(sd + 2, 1.5)]], 4), 7.5, per);
    const A = pl(a), B = pl(b), O = ov.map((q) => pl(q)).join(" ");
    return stroke(A + " " + B, C.pale, 9.5, `transform="translate(1.5,2.5)" opacity="0.7"`) + stroke(B, C.cut, 9.5) + stroke(B, C.dark, 4.6) + stroke(A, C.cut, 9.5) + stroke(A, C.dark, 4.6) + stroke(O, C.cut, 9.5) + stroke(O, C.dark, 4.6) + `<circle cx="${n(xs - 9)}" cy="${n(y)}" r="5" fill="${C.cut}"/><circle cx="${n(xs + len + 9)}" cy="${n(y)}" r="5" fill="${C.cut}"/>`; };
  s += band(x0 + 50, x1 - 50, kY, 1);
  if (tz.d) s += band(x0 + 50, tz.x0 - 34, bY, 2) + band(tz.x0 + tz.w + 34, x1 - 50, bY, 3); else s += band(x0 + 50, x1 - 50, bY, 2);
  // the name: deep V cuts, dark on the shadow side, a moonlit lip on the lower right
  const lay = layout(NAME, 540, 257, 94, { maxW: 880, track: 30, space: 56, seed: 1, amp: 1.1, jy: 2, jr: 1.2 }), N = lay.L.length, w = lay.cap * 0.215;
  for (const g of lay.L) {
    const la = clamp((ap - 0.3 - 0.5 * g.i / N) / 0.2); if (la <= 0) continue;
    const d = g.strokes.map((q) => pl(q.p)).join(" "), sq = `stroke-linecap="square" stroke-linejoin="miter"`;
    s += `<g opacity="${op(la * 1.4)}"><path d="${d}" fill="none" stroke="${C.pale}" stroke-width="${n(w)}" ${sq} transform="translate(3.5,4.5)"/><path d="${d}" fill="none" stroke="${mix(C.cut, "#ffffff", 0.9 * (1 - la))}" stroke-width="${n(w)}" ${sq}/><path d="${d}" fill="none" stroke="${C.cut2}" stroke-width="${n(w * 0.34)}" ${sq} transform="translate(${n(w * 0.17)},${n(w * 0.2)})" opacity="${op(la)}"/></g>`;
  }
  // the teaser: scratched thinner by a later hand
  const ta = clamp((ap - 0.75) / 0.25);
  if (tz.d && ta > 0) s += `<g opacity="${op(ta)}">${stroke(tz.d, C.pale, 7, `transform="translate(1.8,2.4)"`)}${stroke(tz.d, C.cut, 7)}${dotsSvg(tz.dots, 4.4, C.cut)}</g>`;
  s += `</g>`;
  // moss creeping over the top and up from the foot; lichen
  for (const [mx, my, rx, ry, sd] of [[x0 + 70, y0 + 8, 74, 17, 1], [x0 + 6, y0 + 96, 16, 46, 2], [430, y0 + 2, 52, 11, 3], [x1 - 250, y0 + 2, 92, 15, 4], [x1 - 14, y0 + 116, 15, 52, 5], [x0 + 150, y1 - 3, 96, 13, 6], [x1 - 160, y1 - 4, 70, 12, 7], [700, y1 - 1, 44, 9, 8]]) {
    s += `<path d="${pl(lump(mx, my, rx, ry, sd + 30, 13, 0.22), true)}" fill="${C.moss}" stroke="${C.cut}" stroke-width="2.4" stroke-linejoin="round"/><path d="${pl(lump(mx - rx * 0.12, my - ry * 0.22, rx * 0.62, ry * 0.48, sd + 40, 10, 0.26), true)}" fill="${C.mossL}"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${n(mx + jit(sd * 9 + i, rx * 0.6))}" cy="${n(my + jit(sd * 11 + i, ry * 0.5))}" r="${n(1.6 + hash(sd + i) * 1.6)}" fill="${C.mossP}"/>`;
  }
  for (let i = 0; i < 9; i++) s += `<path d="${pl(lump(x0 + 60 + hash(i + 201) * 940, y0 + 54 + hash(i + 211) * 160, 5 + hash(i + 221) * 7, 4 + hash(i + 231) * 5, i + 240, 7, 0.3), true)}" fill="${C.lichen}" opacity="0.55"/>`;
  s += `</g>`;
  // the way out: the stone goes down into the loch mist (bright bars, like the moon's road on the water)
  const m = Math.sin(Math.PI * clamp(cr / 0.95));
  if (m > 0.01) for (let i = 0; i < 6; i++) { const y = 400 + i * 7.5 + jit(i + 301, 2), hw = (300 + hash(i + 311) * 240) * (0.6 + 0.4 * m), mx = 540 + jit(i + 321, 90); s += `<path d="M${n(mx - hw)},${n(y)} Q${n(mx)},${n(y - 5)} ${n(mx + hw)},${n(y)} Q${n(mx)},${n(y + 5)} ${n(mx - hw)},${n(y)} Z" fill="#cfe0ff" opacity="${op(m * (0.25 + 0.5 * i / 5))}"/>`; }
  return s;
}

// ================================================================ B "weed": woven wet water weed, moonlit, dripping
const WD = { rim: "#c4f2e0", base: "#03130c", s: ["#0f4428", "#1c6a3c", "#2c8a4e"], wet: "#a4f0c4", drop: "#d8fff0", mist: "#9cc4ee" };
function titleWeed(t, ap, cr, o) {
  const C = WD, lay = layout(NAME, 540, 216, 128, { maxW: 930, track: 31, space: 58, seed: 2, amp: 1.6, jy: 4, jr: 2 }), N = lay.L.length, w = lay.cap * 0.2;
  const all = 1 - clamp((cr - 0.85) / 0.15);
  let s = `<g opacity="${op(all)}">`;
  // a breath of loch mist behind the name
  const ma = clamp(ap / 0.5) * (1 - clamp(cr / 0.6));
  s += `<path d="${pl(lump(540, 300, 520, 96, 11, 16, 0.12), true)}" fill="${C.mist}" opacity="${op(0.13 * ma)}"/><path d="${pl(lump(540, 296, 420, 62, 12, 14, 0.14), true)}" fill="${C.mist}" opacity="${op(0.12 * ma)}"/>`;
  let drips = "";
  for (const g of lay.L) {
    const gr = eo(clamp((ap - 0.42 * g.i / N) / 0.58)), u = clamp((cr - 0.45 * g.i / N) / 0.55), dy = ei(u) * 240, la = clamp(gr * 4) * (1 - clamp((u - 0.55) / 0.45));
    if (la <= 0) continue;
    let rim = "", base = "", weave = "", tails = "";
    g.strokes.forEach((q, si) => {
      const sd = g.i * 31 + si * 7 + 5, pts = cut(resample(q.p, 5), gr), d = pl(pts); if (pts.length < 2) return;
      rim += stroke(d, C.rim, w + 13); base += stroke(d, C.base, w + 4);
      for (let j = 0; j < 3; j++) { const ph = j * TAU / 3 + hash(sd + j) * 2, sp = side(pts, (a) => w * 0.3 * Math.sin(a * 0.085 + ph)); weave += stroke(pl(sp), C.s[(j + g.i + si) % 3], w * 0.46);
        if (j === 2) weave += stroke(pl(sp), C.wet, 2.6, `stroke-dasharray="${n(9 + hash(sd) * 6)} ${n(22 + hash(sd + 1) * 12)}" opacity="0.9"`); }
      // loose ends: a frond hangs off every foot, and off some arms; each lets a drop go in its own time
      [[q.raw[0], q.p[0]], [q.raw[q.raw.length - 1], q.p[q.p.length - 1]]].forEach(([r, p], e) => {
        const foot = r[1] >= 95, hs = hash(sd * 3 + e); if ((!foot && hs < 0.45) || gr < 0.98) return;
        const len = (foot ? 20 : 12) + hs * (foot ? 34 : 22), sw = Math.sin(t * 2.2 + hs * 9) * 5, bx = p[0], by = p[1] + (foot ? w * 0.3 : w * 0.4), tx = bx + sw + jit(sd + e, 6), tyy = by + len;
        const fd = `M${n(bx)},${n(by)} Q${n(bx - sw)},${n(by + len * 0.55)} ${n(tx)},${n(tyy)}`;
        tails += stroke(fd, C.rim, 12) + stroke(fd, C.base, 8.5) + stroke(fd, C.s[1 + e], 4.6);
        const f = ((t * (0.7 + hs * 0.5) + hash(sd + e * 5 + 9)) % 1 + 1) % 1, hang = clamp(f / 0.45), fall = clamp((f - 0.45) / 0.55), r0 = 2.4 + 3.4 * hang, yy = tyy + 3 + fall * fall * (110 + hs * 40);
        drips += `<g transform="translate(0,${n(dy)})" opacity="${op(la * (1 - fall * 0.85))}"><path d="M${n(tx)},${n(yy - r0 * 2.1)} Q${n(tx + r0 * 1.15)},${n(yy)} ${n(tx)},${n(yy + r0)} Q${n(tx - r0 * 1.15)},${n(yy)} ${n(tx)},${n(yy - r0 * 2.1)} Z" fill="${C.drop}" stroke="${C.base}" stroke-width="1.6"/></g>`;
      });
    });
    s += `<g transform="translate(${n(jit(g.i + 70, 14) * ei(u))},${n(dy)})" opacity="${op(la)}">${rim}${tails}${base}${weave}</g>`;
  }
  s += drips;
  // the teaser: pale as wet moonlight, inked round so it holds on any sky
  const tz = thin(teaserText(o.teaser), 540, 380, 42, 900, 8), ta = clamp((ap - 0.6) / 0.4) * (1 - clamp(cr / 0.5));
  if (tz.d && ta > 0) s += `<g opacity="${op(ta)}" transform="translate(0,${n(ei(cr) * 60)})">${stroke(tz.d, C.base, 14)}${dotsSvg(tz.dots, 8.4, C.base)}${stroke(tz.d, C.drop, 7)}${dotsSvg(tz.dots, 4.8, C.drop)}</g>`;
  return s + `</g>`;
}

// ================================================================ C "bridle": silver rings, braided weed, a rein
const BR = { ink: "#030a16", silver: "#eaf2ff", shade: "#8ea2c8", a: "#46b874", b: "#2a8a52", bead: "#c8ffd8", glow: "#0a1630" };
function ring(x, y, r, k, C, lw = 6) {
  if (k <= 0) return "";
  return `<g transform="translate(${n(x)},${n(y)}) scale(${n(k)})"><circle r="${n(r)}" fill="${C.ink}" fill-opacity="0.85" stroke="${C.ink}" stroke-width="${n(lw + 5)}"/><circle r="${n(r)}" fill="none" stroke="${C.shade}" stroke-width="${n(lw)}"/><path d="M${n(-r * 0.98)},${n(r * 0.2)} A${n(r)},${n(r)} 0 0 1 ${n(r * 0.6)},${n(-r * 0.8)}" fill="none" stroke="${C.silver}" stroke-width="${n(lw)}" stroke-linecap="round"/><path d="M${n(-r * 0.62)},${n(-r * 0.6)} A${n(r)},${n(r)} 0 0 1 ${n(r * 0.05)},${n(-r)}" fill="none" stroke="#ffffff" stroke-width="${n(lw * 0.42)}" stroke-linecap="round"/></g>`;
}
function braid(pts, w, C, sd) {
  if (pts.length < 2) return "";
  const [a, b, ov] = plait(pts, w * 0.3, w * 1.9, hash(sd) * 3), A = pl(a), B = pl(b), O = ov.map((q) => pl(q)).join(" "), sw = w * 0.5;
  return stroke(pl(pts), C.ink, w + 8) + stroke(B, C.ink, sw + 4) + stroke(B, C.b, sw) + stroke(A, C.ink, sw + 4) + stroke(A, C.a, sw) + stroke(O, C.ink, sw + 4) + stroke(O, C.a, sw) + stroke(pl(pts), C.bead, 3.4, `stroke-dasharray="0.1 ${n(w * 0.95)}" opacity="0.95"`);
}
function titleBridle(t, ap, cr, o) {
  const C = BR, lay = layout(NAME, 540, 214, 122, { maxW: 900, track: 36, space: 62, seed: 3, amp: 1, jy: 2.5, jr: 1.4 }), N = lay.L.length, w = lay.cap * 0.22, R = lay.cap * 0.09;
  const all = 1 - clamp((cr - 0.9) / 0.1), ba = 1 - clamp(cr / 0.28);
  let s = `<g opacity="${op(all)}">`, braids = "", rings = "";
  // the rein: one long braid sagging under the name, a bit ring at each end
  const rx0 = lay.x0 - 18, rx1 = lay.x0 + lay.w + 18, rY = 358, rein = Array.from({ length: 25 }, (_, i) => { const u = i / 24; return [lerp(rx0, rx1, u), rY + 10 * Math.sin(u * Math.PI) + Math.sin(t * 1.6 + u * 5) * 1.2]; });
  const rg = eo(clamp((ap - 0.35) / 0.65));
  braids += `<g opacity="${op(ba)}">${braid(cut(resample(rein, 5), rg), w * 0.5, C, 77)}</g>`;
  const fall = (seed) => { const u = clamp((cr - 0.12 - 0.42 * hash(seed)) / 0.46); return [ei(u) * 250, 1 - clamp((u - 0.7) / 0.3)]; };
  [[rx0, 0], [rx1, 1]].forEach(([x, e]) => { const [dy, fo] = fall(900 + e); rings += `<g transform="translate(0,${n(dy)})" opacity="${op(fo)}">${ring(x, rY, R * 1.25, back(clamp((ap - 0.2 - e * 0.3) / 0.4)), C, 6.5)}</g>`; });
  for (const g of lay.L) {
    const st = 0.5 * g.i / N, seen = [];
    g.strokes.forEach((q, si) => {
      const gr = eo(clamp((ap - st - 0.12) / 0.38));
      braids += `<g opacity="${op(ba)}">${braid(cut(resample(q.p, 5), gr), w, C, g.i * 13 + si)}</g>`;
      const ends = q.raw.length <= 5 ? q.p : [q.p[0], q.p[q.p.length - 1]];
      ends.forEach((p) => { if (!seen.some((z) => Math.hypot(z[0] - p[0], z[1] - p[1]) < R * 1.2)) seen.push(p); });
    });
    seen.forEach((p, ri) => { const sd = g.i * 17 + ri * 3 + 1, [dy, fo] = fall(sd); rings += `<g transform="translate(${n(jit(sd + 5, 16) * (dy / 250))},${n(dy)})" opacity="${op(fo)}">${ring(p[0], p[1], R, back(clamp((ap - st * 0.9 - 0.05 * hash(sd)) / 0.3)), C, 5)}</g>`; });
  }
  s += braids + rings;
  // the teaser: thin silver wire
  const tz = thin(teaserText(o.teaser), 540, 388, 40, 880, 9), ta = clamp((ap - 0.6) / 0.4) * (1 - clamp(cr / 0.4));
  if (tz.d && ta > 0) s += `<g opacity="${op(ta)}">${stroke(tz.d, C.ink, 13.5)}${dotsSvg(tz.dots, 8.2, C.ink)}${stroke(tz.d, C.silver, 6.6)}${dotsSvg(tz.dots, 4.6, C.silver)}</g>`;
  return s + `</g>`;
}

// ================================================================ the card
export const TITLE_STYLES = {
  stone: { fn: titleStone, time: { in: [0, 0.25], out: [2.05, 2.5] }, y: [194, 440] },
  weed: { fn: titleWeed, time: { in: [0, 0.25], out: [2.05, 2.5] }, y: [196, 440] },
  bridle: { fn: titleBridle, time: { in: [0, 0.25], out: [2.05, 2.5] }, y: [196, 440] },
};
const ALIAS = { A: "stone", B: "weed", C: "bridle" };
export const TITLE_ZONE = { top: 190, bottom: 440 };
export function titleCard(t, o = {}) {
  const S = TITLE_STYLES[ALIAS[o.style] || o.style] || TITLE_STYLES.stone, T_ = S.time;
  const ap = o.appear ?? clamp((t - T_.in[0]) / (T_.in[1] - T_.in[0])), cr = o.out ?? clamp((t - T_.out[0]) / (T_.out[1] - T_.out[0]));
  if (t < 0 || ap <= 0 || cr >= 1) return "";
  return `<clipPath id="ktZone"><rect x="0" y="0" width="${W}" height="${TITLE_ZONE.bottom}"/></clipPath><g clip-path="url(#ktZone)">${S.fn(t, ap, cr, o)}</g>`;
}
