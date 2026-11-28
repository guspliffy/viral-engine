// Legend channel, "Pandora's jar": the opening story banner, three styles for Jonny to pick from.
// Same contract as legend-greece-title.mjs:
//   titleCard(t, { style, teaser, appear, crumble }) -> SVG (screen space; draw it over the picture, UNDER the subtitle)
//     style   "jar" (A, default, the starred one) | "frieze" (B) | "seal" (C)      (registry: TITLE_STYLES)
//     teaser  "T1" (default) | "T2" | "T3" (TEASERS) | any text in the letters the alphabet has | "" for none
//     With no appear / crumble the card runs its own clock from t (seconds from the video's start): frame 0 is the clean
//     jar shot, the card is fully in by 0.28 s, starts to go at ~2.0 and is gone by 2.6 (TITLE_STYLES[style].time).
//     appear 0..1 = the way in, crumble 0..1 = the way out (1 = nothing left).
// Where it lives: y 193..492 only (below TikTok's top bar, above the subtitle row at y 520..640, far above the jar's
// crack at y ~1000). Everything is clipped to y <= 504, so nothing that drifts or falls can reach the subtitle. What
// leaves in style A leaves UPWARD.
// Colours: our own, not the terracotta-and-gold of the other channel. A = the pithos in cold moonlight (pale blue clay,
// ink-black letters, silver edge: the colours of frame 0). B = black figures on saffron yellow with white and violet
// added. C = red-brown wax on the pale lid.
// Lettering: the chisel alphabet of legend-greece-title.mjs (LETTERING), plus the six capitals and the apostrophe this
// title needs. Every wobble, chip and crack is seeded: no boil.
import { W, INK, n, lerp, clamp, hash, ease } from "./legend.mjs";
import { LETTERING } from "./legend-greece-title.mjs";
import { evil } from "./legend-pandora.mjs";
const { GLYPH, TH, TN, s_, arcP, capsLine, capsWidth, teaserFit, rough, lump, pd, meander } = LETTERING;

const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const G_ARC = arcP(44, 50, 37, 44, -44, -312, 12);
Object.assign(GLYPH, {
  P: [72, s_([[13, 0], [13, 100]], TH, [0, 1]), s_([[9, 8], [38, 8], [54, 15], [60, 30], [54, 45], [38, 52], [13, 52]], [15, 15, 18, 21, 18, 15, 15])],
  J: [64, s_([[46, 0], [46, 68], [40, 85], [27, 93], [11, 85]], [23, 23, 20, 16, 15], [1, 1])],
  G: [86, s_(G_ARC, G_ARC.map((_, i) => lerp(14, 24, Math.sin(i / 12 * Math.PI) ** 1.2)), [1, 0]), s_([[48, 57], [80, 57]], TN, [1, 0]), s_([[72, 57], [72, 90]], TH, [0, 0])],
  K: [80, s_([[13, 0], [13, 100]], TH, [1, 1]), s_([[67, 0], [15, 58]], TN, [1, 0]), s_([[33, 42], [71, 100]], TH, [0, 1])],
  V: [80, s_([[7, 0], [40, 95]], TH, [1, 2]), s_([[40, 95], [73, 0]], TN, [2, 1])],
  Z: [74, s_([[8, 9], [66, 9]], TN, [1, 0]), s_([[64, 9], [10, 91]], TH, [2, 2]), s_([[8, 91], [68, 91]], TN, [0, 1])],
  "'": [24, s_([[14, 0], [9, 28]], [17, 8], [1, 0])],
});
export const TEASERS = { T1: "…THE GIFT THAT MADE NO SOUND", T2: "…ONE THING STAYED INSIDE", T3: "…NEVER TAKE A GIFT FROM ZEUS" };
const teaserText = (o) => { const v = o.teaser; if (v === "" || v === 0 || v === false) return ""; if (v == null || v === 1 || v === true) return TEASERS.T1; return TEASERS[v] || [...String(v).toUpperCase().replace(/\.\.\./g, "…")].filter((ch) => ch === " " || GLYPH[ch]).join(""); };
const TITLE = "PANDORA'S JAR";
const cx0 = W / 2;
// a rope band moulded in clay between two curves yA(x) < yB(x): every twist its own stroke
function ropeBand(x0, x1, yOf, h, seed, C) {
  const N = Math.round((x1 - x0) / 15), top = [], bot = [];
  for (let i = 0; i <= 24; i++) { const x = lerp(x0, x1, i / 24); top.push([x, yOf(x) - h / 2 + jit(seed + i, 0.8)]); bot.push([x, yOf(x) + h / 2 + jit(seed + i + 40, 0.8)]); }
  let s = `<path d="${pd([...top, ...bot.reverse()])}" fill="${C.base}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  for (let i = 0; i < N; i++) { const x = lerp(x0 + 8, x1 - 8, (i + 0.5 + jit(seed + i * 3, 0.2)) / N), y = yOf(x); s += `<path d="M${n(x + 5)},${n(y - h * 0.42)} Q${n(x + jit(seed + i, 1.5))},${n(y)} ${n(x - 5)},${n(y + h * 0.42)}" stroke="${i % 7 === 3 ? C.deep : C.shade}" stroke-width="${n(3 + hash(seed + i * 5) * 1.6)}" fill="none" stroke-linecap="round"/>`; if (i % 3 === 1) s += `<path d="M${n(x + 7)},${n(y - h * 0.3)} l-3,${n(h * 0.3)}" stroke="${C.lit}" stroke-width="1.6" stroke-linecap="round"/>`; }
  return s;
}

// ================================================================ A "jar": the title painted round the pithos shoulder
// The neck, the rim and the lid of the jar stand in the middle of the band, the shoulder runs out to both sides, a rope
// band under the letters, the teaser scratched into the clay below it. In: the letters are brushed on one by one.
// Out: the lid tips up, a blade of cold light shows, and the letters come off the clay as black wisps and drift up and
// out: the evils, before the story has said what they are. Then the shoulder sinks into the dark.
const JA = { base: "#c9d0f8", lit: "#eef1ff", shade: "#8088dc", deep: "#3f459e", ink: "#0b0920", night: "#04061a", silver: "#dfe6ff", wax: "#b8281a", waxD: "#6a1218", cord: "#e9e2c0", cold: "#9fc2ff" };
function titleJar(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const C = JA, bow = (x) => 13 * (1 - ((x - cx0) / 480) ** 2);
  // the shoulder: neck at the top centre, out to the sides, cut off below by the edge of the band (a rough, torn edge)
  const sh = rough([[cx0 - 172, 282], [cx0 - 180, 300], [cx0 - 300, 308], [cx0 - 420, 328], [cx0 - 482, 366], [cx0 - 500, 420], [cx0 - 494, 488], [cx0 - 300, 494], [cx0 - 286, 487], [cx0 - 240, 493], [cx0 + 180, 492], [cx0 + 204, 484], [cx0 + 236, 493], [cx0 + 492, 487], [cx0 + 502, 420], [cx0 + 480, 362], [cx0 + 424, 330], [cx0 + 300, 308], [cx0 + 178, 300], [cx0 + 172, 282]], 7, 1.7, 40), od = pd(sh);
  let a = `<path d="${od}" fill="${C.base}"/><clipPath id="tJs"><path d="${od}"/></clipPath><g clip-path="url(#tJs)">`;
  a += `<path d="${pd(rough([[cx0 + 250, 290], [cx0 + 520, 330], [cx0 + 520, 500], [cx0 + 330, 500], [cx0 + 370, 420], [cx0 + 300, 340]], 9, 5, 30))}" fill="${C.shade}"/>`;
  a += `<path d="${pd(rough([[cx0 - 440, 344], [cx0 - 300, 318], [cx0 - 200, 312], [cx0 - 330, 336], [cx0 - 452, 384], [cx0 - 470, 440]], 11, 3, 30))}" fill="${C.lit}"/>`;
  for (let i = 0; i < 9; i++) a += `<path d="${pd(lump(cx0 - 440 + hash(i + 0.8) * 880, 320 + hash(i + 3.8) * 150, 20 + hash(i) * 34, 7 + hash(i + 2) * 9, i + 20, 8, 0.3))}" fill="${i % 2 ? C.lit : C.shade}" opacity="0.35"/>`;
  // coil lines from the building of it, a wavy line scratched under the neck, cracks
  for (let i = 0; i < 6; i++) { const x = cx0 - 430 + hash(i + 5.5) * 760, y = 322 + hash(i + 7.5) * 150; a += `<path d="M${n(x)},${n(y + bow(x))} q60,${n(5 + jit(i, 3))} 120,1" stroke="${C.shade}" stroke-width="2" fill="none" opacity="0.6"/>`; }
  { let d = ""; for (let i = 0; i <= 44; i++) { const x = cx0 - 280 + i / 44 * 560; d += `${i ? "L" : "M"}${n(x)},${n(316 + bow(x) * 0.5 + Math.sin(i * 1.5 + jit(i, 0.4)) * 4.4)} `; } a += `<path d="${d}" stroke="${C.deep}" stroke-width="2.4" fill="none" stroke-linejoin="round" opacity="0.85"/>`; }
  a += `<path d="M${cx0 + 388},322 l-9,24 l10,15 l-12,30 l6,12 M${cx0 + 389},361 l16,10 M${cx0 - 462},402 l14,20 l-8,22 l10,26" fill="none" stroke="${C.deep}" stroke-width="2.2" stroke-linejoin="round"/>`;
  a += ropeBand(cx0 - 520, cx0 + 520, (x) => 440 + bow(x), 17, 31, C);
  const tz = teaserText(o);
  if (tz) { const ts = teaserFit(tz, cx0, 459, 25, 820, { seed: 9, track: 20 }); a += `<path d="${ts.d}" fill="none" stroke="${C.lit}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.2,1.6)"/><path d="${ts.d}" fill="none" stroke="${C.ink}" stroke-width="${n(3.5 * ts.cap / 25)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  a += `</g><path d="${od}" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  // chips out of the shoulder's edge
  for (const [x, y, r, sd] of [[cx0 - 492, 432, 15, 1], [cx0 + 470, 352, 13, 2], [cx0 - 380, 316, 10, 3]]) a += `<path d="${pd(lump(x, y, r, r * 0.7, sd + 50, 7, 0.3))}" fill="${C.deep}" stroke="${C.ink}" stroke-width="1.6"/>`;
  // rim (chipped) under the lid
  a += `<path d="${pd(rough([[cx0 - 198, 262], [cx0 + 198, 261], [cx0 + 194, 283], [cx0 - 194, 284]], 13, 1.2, 30))}" fill="${C.lit}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="${pd([[cx0 + 110, 263], [cx0 + 197, 262], [cx0 + 193, 283], [cx0 + 96, 283]])}" fill="${C.shade}"/><path d="${pd([[cx0 - 120, 261], [cx0 - 111, 273], [cx0 - 99, 269], [cx0 - 92, 277], [cx0 - 80, 261]])}" fill="${C.deep}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // the lid: tips up on the left as the card goes
  const tip = ease(clamp(cr / 0.3)), gapA = tip * 9;
  const lidD = pd(rough([[cx0 - 214, 262], [cx0 - 216, 242], [cx0 - 150, 222], [cx0 - 40, 211], [cx0 - 34, 201], [cx0 - 40, 194], [cx0 + 42, 193], [cx0 + 36, 201], [cx0 + 42, 211], [cx0 + 150, 222], [cx0 + 216, 241], [cx0 + 214, 262]], 15, 1.2, 36));
  let lid = `<path d="${lidD}" fill="${C.base}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="${pd([[cx0 + 60, 213], [cx0 + 150, 223], [cx0 + 215, 242], [cx0 + 213, 261], [cx0 + 90, 261], [cx0 + 120, 236]])}" fill="${C.shade}"/><path d="M${cx0 - 190},240 Q${cx0 - 120},222 ${cx0 - 56},217" stroke="${C.lit}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${cx0 - 205},250 L${cx0 + 205},249" stroke="${C.deep}" stroke-width="1.8" opacity="0.7"/><path d="M${cx0 + 30},213 l8,16 l-6,12 l8,18" stroke="${C.deep}" stroke-width="1.8" fill="none"/>`;
  // wax seal with Zeus' bolt, the cord over the lid: both break when it tips
  const waxAll = `<path d="${pd(lump(cx0 - 24, 262, 26, 19, 61, 10, 0.16))}" fill="${C.wax}" stroke="${C.ink}" stroke-width="2"/><path d="M${cx0 - 20},251 l-7,10 l8,0 l-6,11" stroke="${C.waxD}" stroke-width="3" fill="none"/><path d="M${cx0 - 40},252 q8,-7 20,-5" stroke="#f0603a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const cord = (d) => `<path d="${d}" stroke="${C.ink}" stroke-width="7.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${C.cord}" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-dasharray="7 2.4"/>`;
  if (tip <= 0.02) lid += cord(`M${cx0 - 196},300 Q${cx0 - 170},236 ${cx0 - 42},204`) + cord(`M${cx0 + 196},300 Q${cx0 + 170},236 ${cx0 + 42},204`) + waxAll;
  else a += cord(`M${cx0 - 196},300 q${n(-8 - tip * 6)},22 ${n(-4)},${n(40 + tip * 10)}`) + cord(`M${cx0 + 196},300 q8,18 2,36`) + `<clipPath id="tJw"><rect x="0" y="262" width="${W}" height="60"/></clipPath><g clip-path="url(#tJw)">${waxAll}</g>`;
  // the gap: black, with one blade of cold light
  if (tip > 0.02) a += `<path d="${pd([[cx0 - 214, 262], [cx0 + 214, 262], [cx0 - 214, 262 - gapA * 7.4]])}" fill="${C.night}"/><path d="${pd([[cx0 - 216, 261], [cx0 + 120, 262], [cx0 - 216, 262 - gapA * 5]])}" fill="${C.silver}"/><path d="${pd([[cx0 - 220, 258 - gapA * 2], [cx0 - 520, 232 - gapA * 5], [cx0 - 520, 262 - gapA * 2], [cx0 - 220, 263]])}" fill="${C.cold}" opacity="${n(0.35 * tip)}"/>`;
  a += `<g transform="rotate(${n(gapA)} ${cx0 + 214} 262)">${lid}</g>`;
  // the letters: black slip, a thin silver edge down-right (as if the jar's own light caught them)
  const cap = 82, o1 = { track: 9, space: 40, seed: 5, amp: 1.5, jy: 1.2, jr: 0.6 }, tw = capsWidth(TITLE, cap, o1), gs = capsLine(TITLE, cx0 - tw / 2, 340, cap, o1).g;
  let letters = "", wisps = "";
  gs.forEach((g, i) => {
    const dy = bow(g.cx), rotL = -(g.cx - cx0) / 480 * 2.2, inU = ease(clamp((ap * 1.5 - i / gs.length * 0.5) / 0.5), "back");
    // out: each letter lets go in its own time, stretches into a wisp, and drifts up and away from the jar's mouth
    const d0 = 0.22 + hash(i * 3.1 + 0.7) * 0.3, u = clamp((cr - d0) / 0.46), e = ease(u, "in"), side = g.cx < cx0 ? -1 : 1, away = side * (60 + 150 * hash(i + 9.3)), up = 120 + 150 * hash(i + 4.4);
    if (u >= 1) return;
    const tx = away * e + Math.sin(u * 5 + i) * 14 * u, ty = dy - up * e, sk = e * side * 28, sx = 1 - 0.45 * e, sy = 1 - 0.7 * e;
    letters += `<g transform="translate(${n(g.cx + tx)},${n(g.cy + ty)}) rotate(${n(rotL + e * side * 34)}) skewX(${n(sk)}) scale(${n(inU * sx)},${n(inU * sy)}) translate(${n(-g.cx)},${n(-g.cy)})">${u < 0.05 ? `<path d="${g.d}" fill="${C.silver}" transform="translate(2.2,2.6)"/>` : ""}<path d="${g.d}" fill="${C.ink}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/></g>`;
    if (u > 0.12) wisps += evil(null, { at: { x: g.cx + tx, y: g.cy + ty }, s: 100, kind: i % 3 === 1 ? "moth" : "smoke", size: (0.7 + 0.7 * hash(i + 2.2)) * Math.min(1, (u - 0.12) * 3) * (1 - e * 0.5), dir: -90 + side * (26 + 30 * hash(i + 6.1)) + Math.sin(u * 4 + i) * 12, seed: i + 3, edge: 0.9 }, t);
  });
  const sink = ease(clamp((cr - 0.5) / 0.5), "in"), fade = clamp(ap * 4) * (1 - clamp((cr - 0.62) / 0.38));
  return `<g transform="translate(0,${n(16 * (1 - ease(clamp(ap * 1.6), "out")) + 26 * sink)})" opacity="${n(fade)}">${a}</g>` + letters + wisps;
}

// ================================================================ B "frieze": a black-figure band, the gods walk her to the jar
// Saffron ground (not terracotta), black figures with incised lines, white and violet added the way the old painters
// added them. Top: a Greek key. Middle: Hephaestus, Athena, Aphrodite, Hermes and Pandora in a row, the jar waiting at
// the right. Below: the title in black glaze, the teaser reserved in yellow on a black foot band. In: the band unrolls
// from the left. Out: the black runs out of it from the left and the band goes dark.
const FR = { ground: "#f4b62c", lit: "#ffd766", dark: "#c9801a", glaze: "#120a14", white: "#fff6e0", violet: "#7a3fd0", red: "#a8281c" };
// tiny figures in a 60 x 100 box, walking right, feet at y 100. All black; `cut` = incised lines, `add` = added colour.
function godSil(kind, x, y, k, C) {
  const blk = (d, w = 0) => `<path d="${d}" fill="${C.glaze}" stroke="${C.glaze}" stroke-width="${w || 1.5}" stroke-linejoin="round"/>`, ln = (d, w = 1.6, col = C.ground) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`, st = (d, w, col = C.glaze) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const head = (hx = 30, hy = 14) => blk(`M${hx - 8},${hy - 6} L${hx - 3},${hy - 11} L${hx + 6},${hy - 10} L${hx + 9},${hy - 3} L${hx + 13},${hy + 1} L${hx + 9},${hy + 3} L${hx + 8},${hy + 9} L${hx - 2},${hy + 10} L${hx - 8},${hy + 4} Z`) + ln(`M${hx + 3},${hy - 3} l4,-0.6`, 2);
  let s = `<g transform="translate(${n(x)},${n(y)}) scale(${k})">`;
  if (kind === "heph") s += st("M22,62 L14,98 L4,100 M34,62 L40,82 L36,99 L46,100", 8) + blk("M16,26 L42,24 L46,64 L14,66 Z") + head(30, 13) + st("M40,32 L52,22 L46,6", 7) + st("M46,8 L42,-12", 4) + blk("M30,-22 L56,-18 L54,-6 L28,-10 Z") + ln("M18,46 L44,44 M22,58 l5,-5 l5,5 l5,-5 l5,5") + blk("M22,20 L30,26 L38,20 L36,30 L24,30 Z");
  else if (kind === "athena") s += blk("M14,26 L42,24 L50,98 L8,100 Z") + head(30, 13) + blk("M20,2 Q30,-14 44,0 L46,8 L38,2 L24,6 Z") + st("M30,-8 Q44,-22 58,-8", 5, C.violet) + st("M56,-30 L54,100", 3) + blk("M52,-40 L56,-52 L60,-40 Z") + st("M40,34 L54,40", 7) + ln("M16,44 L46,42 M14,84 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 M24,30 Q30,36 38,30") + `<path d="M4,40 L22,36 L24,66 L6,70 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.5"/>` + ln("M8,48 L20,45 M9,58 L21,55", 1.4, C.violet);
  else if (kind === "aphro") s += blk("M16,26 L42,24 L52,98 L10,100 Z") + head(30, 13) + blk("M18,6 Q26,-8 40,2 L44,16 L38,6 L22,10 L16,22 Z") + st("M40,32 L56,26", 6) + `<path d="M54,24 q8,-10 16,-2 q-6,0 -8,4 q4,6 -2,6 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.5" stroke-linejoin="round"/>` + ln("M18,44 L46,42 M22,50 Q26,76 20,96 M32,50 Q34,76 32,96 M42,50 Q44,76 46,96") + ln("M14,88 L50,86", 2.4, C.violet);
  else if (kind === "hermes") s += st("M22,60 L12,96 L2,98 M34,60 L44,80 L38,97 L50,98", 7) + blk("M16,26 L42,24 L44,62 L16,64 Z") + blk("M14,26 L6,60 L20,54 Z") + head(30, 13) + blk("M12,4 Q30,-8 52,2 L50,7 L14,9 Z") + blk("M24,2 Q30,-9 38,1 Z") + `<path d="M14,2 l-10,-9 l2,10 Z M4,92 l-12,-8 l2,10 Z M40,92 l-12,-9 l3,10 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.3" stroke-linejoin="round"/>` + st("M40,32 L56,40", 6) + st("M58,14 L58,70", 3) + st("M52,20 q6,-8 12,0 q-6,6 -12,0", 2.4) + ln("M18,44 L42,42") + ln("M17,58 L43,56", 2.4, C.violet);
  else if (kind === "pandora") s += blk("M16,26 L42,24 L50,98 L10,100 Z") + `<path d="M22,3 L27,-2 L36,-1 L39,6 L43,10 L39,12 L38,18 L28,19 L22,13 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.5" stroke-linejoin="round"/>` + blk("M18,8 Q22,-10 38,-4 L36,2 L26,2 L22,14 L16,26 Z") + st("M40,34 L52,44", 7, C.glaze) + st("M41,34 L52,44", 4, C.white) + ln("M18,44 L46,42 M22,50 Q24,76 20,96 M32,50 L32,96 M42,50 Q44,76 46,96") + ln("M12,90 L50,88", 3.4, C.lit) + `<circle cx="34" cy="6" r="1.5" fill="${C.glaze}"/>`;
  else s += blk("M10,100 Q-6,60 12,34 Q18,24 20,16 L18,10 L46,9 L44,16 Q46,24 52,34 Q70,60 54,100 Z") + `<path d="M12,9 Q32,-9 52,8 L52,13 L12,14 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.5" stroke-linejoin="round"/><path d="M26,0 L28,-8 L38,-8 L40,0 Z" fill="${C.white}" stroke="${C.glaze}" stroke-width="1.5"/>` + ln("M8,44 L56,43 M5,48 L59,47 M4,70 L60,69 M4,74 L60,73") + ln("M10,46 l3,0 M16,46 l3,0 M22,46 l3,0 M28,46 l3,0 M34,46 l3,0 M40,46 l3,0 M46,46 l3,0 M52,46 l3,0", 2.6, C.violet) + `<path d="M28,8 l-4,10 l6,0 l-4,10" fill="none" stroke="${C.red}" stroke-width="2.6"/>`;
  return s + `</g>`;
}
function titleFrieze(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const x0 = 44, x1 = 1036, y0 = 196, y1 = 490, C = FR;
  const out = rough([[x0 + 4, y0 + 5], [x0 + 380, y0], [x1 - 30, y0 + 3], [x1, y0 + 24], [x1 - 4, y1 - 70], [x1 - 16, y1 - 54], [x1 - 6, y1 - 2], [x0 + 500, y1], [x0 + 30, y1 - 2], [x0 + 12, y1 - 22], [x0, y1 - 30], [x0 + 3, y0 + 120]], 5, 1.8, 46), od = pd(out);
  let a = `<path d="${od}" fill="${C.dark}" transform="translate(2,11)"/><path d="${od}" fill="${C.ground}"/><clipPath id="tFs"><path d="${od}"/></clipPath><g clip-path="url(#tFs)">`;
  for (const [bx, by, rx, ry, col, sd] of [[260, 300, 200, 50, C.lit, 1], [820, 380, 240, 44, C.lit, 2], [600, 250, 170, 26, C.dark, 3], [140, 430, 120, 30, C.dark, 4]]) a += `<path d="${pd(lump(bx, by, rx, ry, sd + 20, 12, 0.25))}" fill="${col}" opacity="0.4"/>`;
  for (let i = 0; i < 26; i++) a += `<circle cx="${n(x0 + hash(i + 60) * (x1 - x0))}" cy="${n(y0 + hash(i + 70) * (y1 - y0))}" r="${n(1 + hash(i + 80) * 1.8)}" fill="${C.dark}" opacity="0.7"/>`;
  // key along the top, ground lines for the procession
  a += `<path d="${meander(x0 + 14, x1 - 14, y0 + 30, 18, 31)}" fill="none" stroke="${C.glaze}" stroke-width="3.6" stroke-linejoin="miter" stroke-linecap="square"/>`;
  const gy = y0 + 142;
  a += `<path d="${pd(rough([[x0 - 6, gy], [x1 + 6, gy - 1]], 33, 1, 60, false), false)}" stroke="${C.glaze}" stroke-width="4" fill="none"/><path d="${pd(rough([[x0 - 6, gy + 7], [x1 + 6, gy + 6]], 35, 1, 60, false), false)}" stroke="${C.violet}" stroke-width="3" fill="none"/>`;
  // the procession: each god a step further in the walk; out: they run dry from the left
  const who = ["heph", "athena", "aphro", "hermes", "pandora"], drain = clamp(cr / 0.6);
  who.forEach((kind, i) => { const gx = x0 + 120 + i * 148, gone = clamp((drain * 1.3 - i / 6) / 0.3); if (gone < 1) a += `<g opacity="${n(1 - gone)}" transform="translate(0,${n(gone * 10)})">${godSil(kind, gx + jit(i + 3, 5), gy - 100 * 0.98, 0.98, C)}</g>`; });
  a += godSil("jar", x1 - 150, gy - 100 * 1.06, 1.06, C);
  for (let i = 0; i < 4; i++) a += `<path d="M${x0 + 30 + i * 22},${gy - 26 - (i % 2) * 14} q8,-8 16,0 q-8,8 -16,0" fill="${C.glaze}"/>`;   // ivy leaves filling the space behind them
  // the title in black glaze, the teaser reserved on the black foot band
  const cap = 82, o1 = { track: 9, space: 40, seed: 12, amp: 1.5, jy: 1.2, jr: 0.5 }, tw = capsWidth(TITLE, cap, o1), gs = capsLine(TITLE, cx0 - tw / 2, gy + 20, cap, o1).g;
  gs.forEach((g, i) => { const gone = clamp((drain * 1.4 - g.cx / W) / 0.3); if (gone < 1) a += `<path d="${g.d}" fill="${C.glaze}" opacity="${n(1 - gone)}"/>` + (g.ch === "J" || g.ch === "P" ? `<path d="${pd(lump(g.x + g.w * 0.4, g.y + g.h * 0.76, 7, 5, i + 7, 6, 0.3))}" fill="${C.ground}"/>` : ""); });
  a += `<path d="${pd(rough([[x0 - 6, y1 - 46], [x1 + 6, y1 - 48], [x1 + 6, y1 + 6], [x0 - 6, y1 + 6]], 37, 1.2, 50))}" fill="${C.glaze}"/>`;
  const tz = teaserText(o);
  if (tz) { const ts = teaserFit(tz, cx0, y1 - 35, 22, x1 - x0 - 120, { seed: 9, track: 20 }); a += `<path d="${ts.d}" fill="none" stroke="${C.lit}" stroke-width="${n(3.3 * ts.cap / 22)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  for (const [cxp, cy, r, sd] of [[x1 - 36, y0 + 10, 26, 1], [x0 + 10, y1 - 16, 22, 2], [x0 + 386, y0, 14, 3], [x1 - 6, y1 - 62, 16, 4]]) a += `<path d="${pd(lump(cxp, cy, r, r * 0.72, sd + 50, 7, 0.3))}" fill="${C.dark}"/>`;
  a += `<path d="M${x1 - 250},${y0} l8,20 l-8,14 l12,20 l-4,12" fill="none" stroke="${C.dark}" stroke-width="2.4" stroke-linejoin="round"/></g><path d="${od}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // in: unrolls from the left. out: goes dark, sinks
  const e = ease(clamp(ap), "out"), dk = clamp((cr - 0.35) / 0.5), sink = ease(clamp((cr - 0.4) / 0.6), "in");
  return `<clipPath id="tFr"><rect x="0" y="0" width="${n(W * e + 4)}" height="${W}"/></clipPath><g clip-path="url(#tFr)" opacity="${n(1 - clamp((cr - 0.7) / 0.3))}" transform="translate(0,${n(30 * sink)})">${a}${dk > 0 ? `<path d="${od}" fill="#04061a" opacity="${n(dk * 0.95)}" stroke="#04061a" stroke-width="3"/>` : ""}</g>`;
}

// ================================================================ C "seal": the title stamped in the wax on the lid
// The lid of the jar from the front, pale clay. A long slab of red-brown wax lies across it over the cord, the title
// pressed into it (dark in the cut, a lit lip on the lower edge), Zeus' bolt at each end. In: it is pressed on, a ring of
// wax squeezes out. Out: one crack runs through the wax, the two halves pull apart and drop.
const SE = { clay: "#c9d0f8", clayL: "#eef1ff", clayS: "#8088dc", clayD: "#3f459e", wax: "#b3301c", waxL: "#ee6238", waxS: "#7c1a16", waxD: "#4a0d12", cord: "#e9e2c0", cordS: "#9a8a4a", night: "#04061a" };
function titleSeal(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const C = SE, y0 = 196, y1 = 490;
  // the lid: knob at the top centre, the dome, the thick edge at the bottom of the band
  const lidO = rough([[cx0 - 58, 214], [cx0 - 66, 204], [cx0 - 60, 195], [cx0 + 62, 194], [cx0 + 68, 204], [cx0 + 58, 214], [cx0 + 250, 226], [cx0 + 420, 262], [cx0 + 500, 330], [cx0 + 506, 440], [cx0 + 498, 488], [cx0 - 500, 490], [cx0 - 506, 440], [cx0 - 500, 330], [cx0 - 420, 262], [cx0 - 250, 226]], 3, 1.6, 44), od = pd(lidO);
  let a = `<path d="${od}" fill="${C.clay}"/><clipPath id="tSs"><path d="${od}"/></clipPath><g clip-path="url(#tSs)"><path d="${pd(rough([[cx0 + 200, 222], [cx0 + 520, 300], [cx0 + 520, 500], [cx0 + 380, 500], [cx0 + 400, 330]], 5, 5, 30))}" fill="${C.clayS}"/><path d="${pd(rough([[cx0 - 430, 280], [cx0 - 250, 236], [cx0 - 90, 222], [cx0 - 280, 258], [cx0 - 470, 340]], 7, 3, 30))}" fill="${C.clayL}"/>`;
  a += `<path d="M${cx0 - 520},452 Q${cx0},470 ${cx0 + 520},450" stroke="${C.clayD}" stroke-width="3" fill="none"/><path d="M${cx0 - 520},458 Q${cx0},476 ${cx0 + 520},456" stroke="${C.clayL}" stroke-width="2.4" fill="none"/>`;
  a += `<path d="M${cx0 - 330},240 l10,22 l-8,18 M${cx0 + 444},300 l-14,18 l6,22" fill="none" stroke="${C.clayD}" stroke-width="2.2" stroke-linejoin="round"/><path d="${pd(lump(cx0 - 470, 468, 22, 14, 9, 7, 0.3))}" fill="${C.clayD}"/>`;
  const tz = teaserText(o);
  if (tz) { const ts = teaserFit(tz, cx0, 462, 20, 700, { seed: 9, track: 20 }); a += `<path d="${ts.d}" fill="none" stroke="${C.clayL}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.2,1.6)"/><path d="${ts.d}" fill="none" stroke="${C.clayD}" stroke-width="${n(3 * ts.cap / 20)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  a += `</g><path d="${od}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
  // the cord under the wax
  const cordD = `M-10,${352} Q${cx0 - 300},${330} ${cx0},${346} Q${cx0 + 300},${362} ${W + 10},${338}`;
  a += `<path d="${cordD}" stroke="${INK}" stroke-width="15" fill="none"/><path d="${cordD}" stroke="${C.cord}" stroke-width="11" fill="none"/><path d="${cordD}" stroke="${C.cordS}" stroke-width="11" fill="none" stroke-dasharray="3 9"/>`;
  // the wax
  const wx0 = 96, wx1 = 984, wy0 = 276, wy1 = 430, press = ease(clamp(ap * 1.3), "back");
  const wo = []; for (let i = 0; i <= 26; i++) { const x = lerp(wx0, wx1, i / 26); wo.push([x + jit(i + 0.4, 6), wy0 + jit(i + 3.4, 7) - Math.sin(i / 26 * Math.PI) * 10]); } wo.push([wx1 + 22, 330], [wx1 + 6, 392]); for (let i = 26; i >= 0; i--) { const x = lerp(wx0, wx1, i / 26); wo.push([x + jit(i + 7.4, 6), wy1 + jit(i + 9.4, 8) + (i % 6 === 2 ? 18 + hash(i) * 16 : 0)]); } wo.push([wx0 - 20, 380], [wx0 - 8, 318]);
  const wd = pd(wo);
  let wax = `<path d="${wd}" fill="${C.waxD}" transform="translate(2,7)"/><path d="${wd}" fill="${C.wax}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><clipPath id="tSw"><path d="${wd}"/></clipPath><g clip-path="url(#tSw)">`;
  wax += `<path d="${pd(rough([[wx0 - 20, wy1 - 40], [cx0, wy1 - 22], [wx1 + 20, wy1 - 46], [wx1 + 20, wy1 + 50], [wx0 - 20, wy1 + 50]], 21, 4, 40))}" fill="${C.waxS}"/><path d="${pd(rough([[wx0, wy0 + 12], [cx0 - 100, wy0 + 2], [cx0 + 200, wy0 + 8], [cx0 - 60, wy0 + 16], [wx0 + 20, wy0 + 30]], 23, 3, 40))}" fill="${C.waxL}" opacity="0.8"/>`;
  for (let i = 0; i < 12; i++) wax += `<path d="${pd(lump(wx0 + 30 + hash(i + 1.2) * (wx1 - wx0 - 60), wy0 + 14 + hash(i + 4.2) * (wy1 - wy0 - 28), 4 + hash(i) * 7, 3 + hash(i + 2) * 4, i + 30, 6, 0.3))}" fill="${i % 2 ? C.waxS : C.waxL}" opacity="0.5"/>`;
  wax += `</g>`;
  const cap = 76, o1 = { track: 9, space: 38, seed: 21, amp: 1.3, jy: 1, jr: 0.5 }, tw = capsWidth(TITLE, cap, o1), gs = capsLine(TITLE, cx0 - tw / 2, 316, cap, o1).g;
  gs.forEach((g) => { wax += `<path d="${g.d}" fill="${C.waxL}" transform="translate(2.4,3)"/><path d="${g.d}" fill="${C.waxD}"/><path d="${g.d}" fill="${C.waxS}" transform="translate(-1.6,-2) scale(1)" opacity="0.55"/><path d="${g.d}" fill="${C.waxD}" opacity="0.55"/>`; });
  for (const bx of [wx0 + 34, wx1 - 40]) wax += `<path d="M${bx + 6},312 l-14,28 l14,-1 l-12,32" fill="none" stroke="${C.waxL}" stroke-width="5" stroke-linejoin="miter" transform="translate(2,2.6)"/><path d="M${bx + 6},312 l-14,28 l14,-1 l-12,32" fill="none" stroke="${C.waxD}" stroke-width="5" stroke-linejoin="miter"/>`;
  // the crack: one seeded zigzag from the top edge to the bottom, a little right of the middle
  const kx = cx0 + 34, crk = [[kx + 10, wy0 - 30]]; for (let i = 1; i < 9; i++) crk.push([kx + jit(i * 2.3 + 0.7, 22) + (i % 2 ? 9 : -9), lerp(wy0 - 30, wy1 + 50, i / 9)]); crk.push([kx - 6, wy1 + 60]);
  const grow = clamp(cr / 0.32), part = ease(clamp((cr - 0.3) / 0.7), "in");
  const half = (sd) => { const clip = sd < 0 ? [[-40, 100], ...crk, [-40, 620]] : [[W + 40, 100], ...crk, [W + 40, 620]], id = `tSh${sd < 0 ? "a" : "b"}`; return `<clipPath id="${id}"><path d="${pd(clip)}"/></clipPath><g transform="translate(${n(sd * part * 120)},${n(part * part * 150)}) rotate(${n(sd * part * 9)} ${cx0 + sd * 300} 360)" opacity="${n(1 - clamp((part - 0.6) / 0.4))}"><g clip-path="url(#${id})">${wax}</g></g>`; };
  let s2 = cr <= 0 ? `<g transform="translate(${cx0},350) scale(${n(lerp(1.22, 1, press))},${n(lerp(0.8, 1, press))}) translate(${-cx0},-350)" opacity="${n(clamp(ap * 5))}">${wax}</g>` : half(-1) + half(1);
  if (cr > 0 && part < 0.5) { const k = Math.max(2, Math.round(grow * (crk.length - 1)) + 1); s2 += `<path d="${pd(crk.slice(0, k), false)}" fill="none" stroke="${C.night}" stroke-width="${n(3 + grow * 3)}" stroke-linejoin="round" opacity="${n(1 - part * 2)}"/>`; for (let i = 0; i < 7; i++) if (i / 7 < grow) s2 += `<path d="${pd(lump(crk[1 + i][0] + jit(i, 16), crk[1 + i][1] + 10 + grow * 20 * hash(i + 2), 5, 4, i + 60, 5, 0.3))}" fill="${C.wax}" stroke="${INK}" stroke-width="1.2" opacity="${n(1 - part * 2)}"/>`; }
  // squeezed-out beads as it is pressed on
  if (cr <= 0 && ap < 1) for (let i = 0; i < 10; i++) { const an = i / 10 * 6.283, r = 1 + ap * 0.2; s2 += `<path d="${pd(lump(cx0 + Math.cos(an) * 470 * r, 352 + Math.sin(an) * 96 * r, 8 * (1 - ap), 6 * (1 - ap), i + 70, 6, 0.3))}" fill="${C.wax}"/>`; }
  const sink = ease(clamp((cr - 0.45) / 0.55), "in");
  return `<g transform="translate(0,${n(-30 * (1 - ease(clamp(ap * 1.5), "out")) + 30 * sink)})" opacity="${n(clamp(ap * 4) * (1 - clamp((cr - 0.6) / 0.4)))}">${a}</g>` + s2;
}

export const TITLE_STYLES = {
  jar: { fn: titleJar, time: { in: [0.06, 0.28], out: [1.95, 2.6] }, y: [193, 492] },
  frieze: { fn: titleFrieze, time: { in: [0.06, 0.28], out: [2.1, 2.6] }, y: [196, 492] },
  seal: { fn: titleSeal, time: { in: [0.06, 0.28], out: [2.05, 2.6] }, y: [194, 492] },
};
export const TITLE_ZONE = { top: 190, bottom: 504 };
export function titleCard(t, o = {}) {
  const S = TITLE_STYLES[o.style || "jar"] || TITLE_STYLES.jar, T_ = S.time;
  const ap = o.appear ?? clamp((t - T_.in[0]) / (T_.in[1] - T_.in[0])), cr = o.crumble ?? clamp((t - T_.out[0]) / (T_.out[1] - T_.out[0]));
  const s = S.fn(t, ap, cr, o);
  return s ? `<clipPath id="tZone"><rect x="0" y="0" width="${W}" height="${TITLE_ZONE.bottom}"/></clipPath><g clip-path="url(#tZone)">${s}</g>` : "";
}
