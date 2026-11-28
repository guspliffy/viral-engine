// Legend "The Fisherman and his Wife": the opening story banner, three styles for Jonny to pick from.
//   titleCard(t, { style, teaser, appear, leave }) -> SVG (screen space; draw it over the picture, UNDER the subtitle)
//     style   "A" driftwood planks tied with rope, the letters carved (default) | "B" cork floats on a fishing net |
//             "C" a woodcut chapbook strip, the 1812 printed look              (registry: TITLE_STYLES)
//     teaser  "T1" (default) | "T2" (TEASERS) | any text in the letters the alphabet has | "" for none
//     With no appear / leave the card runs its own clock from t (seconds from the video's start): frame 0 stays clean,
//     in 0.2..0.45, held to 2.95, gone by 3.45 (TITLE_STYLES[style].time). appear 0..1 = the way in, leave 0..1 = the way out.
//     A is hoisted up on its ropes, B is hauled off sideways like a net coming in, C is pulled away like a page.
// Where it lives: y 190..500 only, above the subtitle row (about y 580). Everything is clipped to y <= 504 (TITLE_ZONE).
// Title: the full "THE FISHERMAN AND HIS WIFE" fits on two lines in all three styles.
// Lettering: our own alphabet drawn here as stroke skeletons on a 100-high box (no font file, no <text>); every style
// strokes the same skeletons its own way. All wobble is seeded: no boil, no Math.random, any frame in any order.
import { W, INK, n, lerp, clamp, hash, ease } from "./legend.mjs";

const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const arc = (cx, cy, rx, ry, a0, a1, k) => Array.from({ length: k + 1 }, (_, i) => { const a = lerp(a0, a1, i / k) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const BOWL = [[10, 100], [10, 0], [38, 0], [54, 10], [58, 27], [54, 44], [38, 54], [10, 54]];
const GL = {
  A: [76, [[4, 100], [38, 0], [72, 100]], [[18, 64], [58, 64]]], C: [70, arc(40, 50, 33, 50, -48, -312, 12)],
  D: [72, [[10, 100], [10, 0], [36, 0], [56, 14], [64, 50], [56, 86], [36, 100], [10, 100]]], E: [60, [[54, 0], [10, 0], [10, 100], [56, 100]], [[10, 50], [44, 50]]],
  F: [58, [[54, 0], [10, 0], [10, 100]], [[10, 50], [42, 50]]], H: [72, [[10, 0], [10, 100]], [[62, 0], [62, 100]], [[10, 50], [62, 50]]], I: [24, [[12, 0], [12, 100]]],
  K: [68, [[10, 0], [10, 100]], [[60, 0], [10, 58]], [[27, 40], [62, 100]]], M: [90, [[10, 100], [12, 0], [45, 72], [78, 0], [80, 100]]], N: [74, [[10, 100], [10, 0], [64, 100], [64, 0]]],
  O: [78, arc(39, 50, 31, 50, -90, 270, 16)], P: [62, BOWL], R: [66, BOWL, [[34, 54], [60, 100]]],
  S: [60, [[52, 14], [40, 2], [24, 0], [10, 10], [8, 26], [16, 40], [30, 49], [44, 58], [53, 72], [51, 88], [38, 99], [22, 100], [7, 88]]],
  T: [64, [[2, 0], [62, 0]], [[32, 0], [32, 100]]], U: [72, [[10, 0], [10, 66], [18, 90], [36, 100], [54, 90], [62, 66], [62, 0]]],
  W: [100, [[4, 0], [26, 100], [50, 26], [74, 100], [96, 0]]], Y: [68, [[4, 0], [34, 52], [64, 0]], [[34, 52], [34, 100]]],
  "…": [70, [[10, 95], [10, 96]], [[32, 95], [32, 96]], [[54, 95], [54, 96]]], " ": [42],
};
export const TITLE = ["THE FISHERMAN", "AND HIS WIFE"];
export const TEASERS = { T1: "…THE SEA KEPT COUNT", T2: "…ONE WISH TOO MANY" };
// one letter's skeleton as a path (x = left edge, y = baseline), each point nudged by a seeded hand
const glyph = (ch, x, y, cap, seed = 1, amp = 0) => (GL[ch] || [0]).slice(1).map((pl, j) => "M" + pl.map(([px, py], i) => `${n(x + px * cap / 100 + jit(seed + j * 7 + i * 1.3, amp))},${n(y - (100 - py) * cap / 100 + jit(seed + j * 7 + i * 1.3 + 0.5, amp))}`).join(" L")).join(" ");
// a line of text centred on cx: { d, w, x0, letters: [{ ch, x, w, d }] }; shrinks cap to fit maxW
function line(str, cx, y, cap, o = {}) {
  const gap = o.gap ?? 0.11, adv = (ch) => ((GL[ch] || GL[" "])[0] / 100 + gap);
  let w = [...str].reduce((s, ch) => s + adv(ch), 0) - gap; if (o.maxW && w * cap > o.maxW) cap = o.maxW / w;
  let x = cx - w * cap / 2; const letters = [];
  [...str].forEach((ch, i) => { const sd = (o.seed || 1) * 53 + i * 3.1; letters.push({ ch, x, w: (GL[ch] || GL[" "])[0] * cap / 100, d: glyph(ch, x, y + jit(sd, o.dance || 0), cap, sd, o.amp || 0) }); x += adv(ch) * cap; });
  return { d: letters.map((l) => l.d).join(" "), w: w * cap, x0: cx - w * cap / 2, cap, letters };
}
const ink = (d, col, w, extra = "") => d ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>` : "";
const poly = (a, fill, extra = "") => `<path d="M${a.map(([x, y]) => `${n(x)},${n(y)}`).join(" L")} Z" fill="${fill}" ${extra}/>`;
function rough(a, seed, amp = 2, per = 30) { const out = []; a.forEach((p, i) => { const q = a[(i + 1) % a.length], k = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / per)); for (let j = 0; j < k; j++) { const u = j / k, id = seed * 37 + i * 11 + j * 1.7; out.push([lerp(p[0], q[0], u) + jit(id, j ? amp : amp * 0.4), lerp(p[1], q[1], u) + jit(id + 0.5, j ? amp : amp * 0.4)]); } }); return out; }
const rope = (d, w = 13) => ink(d, INK, w + 3) + ink(d, "#d2a45c", w) + ink(d, "#8a5c2a", w * 0.8, `stroke-dasharray="3 ${n(w * 0.75)}" stroke-linecap="butt"`) + ink(d, "#f2d08a", w * 0.22, `stroke-dasharray="${n(w * 0.5)} ${n(w * 0.6)}" transform="translate(-2,-1)"`);
const teaserText = (o) => o.teaser === "" ? "" : (TEASERS[o.teaser || "T1"] || o.teaser).toUpperCase().replace("...", "…");

// ---------------------------------------------------------------- A: driftwood planks, rope, carved letters
function plank(x0, x1, y0, y1, seed) {
  const a = rough([[x0 + 14, y0 + 3], [x1 - 30, y0 - 2], [x1 - 6, y0 + 12], [x1, (y0 + y1) / 2 - 8], [x1 - 22, (y0 + y1) / 2 + 6], [x1 - 4, y1 - 10], [x1 - 34, y1 + 2], [x0 + 30, y1 - 2], [x0 + 6, y1 - 16], [x0 + 18, (y0 + y1) / 2], [x0, y0 + 20]], seed, 2.4, 34);
  let s = poly(a, "#ecd49c", `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`) + poly(rough([[x0 + 16, y1 - 20], [x1 - 14, y1 - 22], [x1 - 34, y1 - 1], [x0 + 30, y1 - 4]], seed + 1, 2, 40), "#c69a58", `opacity="0.8"`) + poly(rough([[x0 + 20, y0 + 6], [x1 - 34, y0 + 2], [x1 - 40, y0 + 14], [x0 + 26, y0 + 17]], seed + 2, 1.6, 40), "#fff0c4", `opacity="0.75"`);
  for (let i = 0; i < 7; i++) { const y = lerp(y0 + 14, y1 - 12, (i + 0.5) / 7), xa = x0 + 30 + 160 * hash(seed + i), xb = x1 - 40 - 200 * hash(seed + i + 9); let d = `M${n(xa)},${n(y)}`; for (let x = xa + 60; x < xb; x += 60) d += ` Q${n(x - 30)},${n(y + jit(seed + i * 7 + x, 4))} ${n(x)},${n(y + jit(seed + i * 3 + x, 2.5))}`; s += ink(d, "#b4884c", 1.8, `opacity="0.8"`); }
  [[0.2, 0.6], [0.83, 0.34]].forEach(([u, v], i) => { const kx = lerp(x0, x1, u + jit(seed + i + 20, 0.05)), ky = lerp(y0, y1, v); s += `<ellipse cx="${n(kx)}" cy="${n(ky)}" rx="13" ry="7" fill="#9a6c38" stroke="#7a4e24" stroke-width="2"/><ellipse cx="${n(kx)}" cy="${n(ky)}" rx="5" ry="2.6" fill="#5a3418"/>` + ink(`M${n(kx - 34)},${n(ky - 3)} Q${n(kx)},${n(ky - 17)} ${n(kx + 34)},${n(ky - 2)} M${n(kx - 32)},${n(ky + 4)} Q${n(kx)},${n(ky + 17)} ${n(kx + 34)},${n(ky + 4)}`, "#b4884c", 1.8); });
  s += ink(`M${n(x1 - 8)},${n((y0 + y1) / 2)} l-70,${n(jit(seed + 30, 6))} M${n(x0 + 10)},${n(y0 + 34)} l56,${n(4 + jit(seed + 31, 5))}`, "#5a3418", 2.2);
  return s;
}
const carve = (d, w) => ink(d, "#fff4cc", w, `transform="translate(2.6,2.8)"`) + ink(d, "#3c2412", w) + ink(d, "#1c0e06", w * 0.36, `transform="translate(-1.6,-1.6)"`);
function titleA(t, ap, lv, o) {
  const sway = Math.sin(t * 2.1) * 0.5 + (1 - ease(ap, "out")) * 3, y = -ease(lv, "in") * 560 - (1 - ease(ap, "out")) * 46, tz = teaserText(o);
  const l1 = line(TITLE[0], 540, 296, 76, { maxW: 860, seed: 2, amp: 0.8, dance: 2.5 }), l2 = line(TITLE[1], 548, 404, 76, { maxW: 860, seed: 3, amp: 0.8, dance: 2.5 });
  let s = "";
  // ropes: down from above the frame, lashed round both planks, on to the teaser slat
  const rp = [164, 918].map((x, i) => rope(`M${x + (i ? 14 : -10)},-40 Q${x + (i ? 6 : -4)},90 ${x},200 L${x + 3},430` + (tz ? ` L${x + (i ? -60 : 150)},462` : "")));
  s += rp.join("") + plank(46, 1036, 204, 314, 5) + plank(72, 1010, 320, 426, 9);
  [164, 918].forEach((x, i) => { [[200, 316], [318, 430]].forEach(([ya, yb], j) => { [-11, 0, 11].forEach((dx, m) => { s += rope(`M${x + dx - 4},${ya - 4 + m} L${x + dx + 5},${yb + 3 - m}`, 9); }); }); s += `<path d="M${x - 20},312 q20,14 42,2 q-6,16 -22,14 q-16,0 -20,-16 Z" fill="#d2a45c" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`; });
  s += carve(l1.d, 12.5) + carve(l2.d, 12.5);
  if (tz) { const lt = line(tz, 548, 487, 31, { maxW: 560, seed: 4, amp: 0.7, dance: 1.2 }); s += plank(232, 864, 444, 500, 13) + ink(lt.d, "#fff4cc", 4.6, `transform="translate(1.4,1.5)"`) + ink(lt.d, "#3c2412", 4.6); }
  return `<g opacity="${n(clamp(ap * 1.6))}" transform="translate(0,${n(y)}) rotate(${n(sway)} 540 -200)">${s}</g>`;
}

// ---------------------------------------------------------------- B: cork floats on a fishing net
function titleB(t, ap, lv, o) {
  const tz = teaserText(o), cork = ["#e0a25a", "#d4904a", "#eab26c"], rowsY = [262, 372], slot = 73;
  let net = "", s = "";
  for (let i = -6; i < 24; i++) { net += `M${i * 62 + 12},176 L${i * 62 + 12 + 330},506 M${i * 62 + 300},176 L${i * 62 - 30},506 `; }
  s += ink(net, "#e6d6a6", 2.2, `opacity="${n(0.55 * ap)}"`);
  const haul = (u) => ease(clamp(lv * 1.5 - (1 - u) * 0.5), "in") * 1400;
  TITLE.forEach((str, r) => {
    const N = str.length, x0 = 540 - (N - 1) * slot / 2, yAt = (i) => rowsY[r] + 12 * Math.sin((i + 0.5) / N * Math.PI) + Math.sin(t * 2.2 + i * 0.9 + r * 2) * 3;
    const pts = Array.from({ length: N + 4 }, (_, i) => [x0 + (i - 2) * slot + haul(clamp((i - 2) / N)), yAt(i - 2)]);
    s += `<g opacity="${n(clamp(ap * 2))}">${rope("M" + pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" L"), 8)}</g>`;
    [...str].forEach((ch, i) => {
      const u = i / (N - 1), pop = ease(clamp(ap * 2.2 - u * 0.9 - r * 0.15), "back"), x = x0 + i * slot + haul(u), y = yAt(i), sd = r * 40 + i, rot = jit(sd + 5, 7) + Math.sin(t * 2.2 + i) * 2 + haul(u) * 0.02;
      if (pop <= 0.01) return;
      let f = "";
      if (ch === " ") f = `<ellipse rx="17" ry="20" fill="#e4223a" stroke="${INK}" stroke-width="2.6"/><path d="M-16,-3 Q0,3 16,-3 L16.5,5 Q0,11 -16.5,5 Z" fill="#fff6dc"/><path d="M-9,-12 q4,-5 10,-5" stroke="#ff8a7a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      else { const g = glyph(ch, -GL[ch][0] * 0.23, 23, 46, sd, 0.7);
        f = poly(rough([[-30, -34], [29, -36], [34, -6], [31, 35], [-28, 37], [-34, 4]], sd, 3, 22), cork[sd % 3], `stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"`) + poly(rough([[10, -33], [29, -34], [33, -6], [30, 34], [6, 35], [14, 0]], sd + 3, 2, 26), "#b06c30", `opacity="0.5"`);
        for (let j = 0; j < 7; j++) f += `<ellipse cx="${n(jit(sd * 5 + j, 24))}" cy="${n(jit(sd * 7 + j, 28))}" rx="${n(1.4 + 1.6 * hash(sd + j))}" ry="1.2" fill="#8a4e20" opacity="0.7"/>`;
        f += ink(g, "#fff0c0", 7.5, `transform="translate(1.6,1.8)" opacity="0.7"`) + ink(g, "#2a140a", 7.5); }
      s += `<g transform="translate(${n(x)},${n(y)}) rotate(${n(rot)}) scale(${n(pop * 100) / 100})">${f}</g>`;
    });
  });
  if (tz) { const lt = line(tz, 540, 483, 28, { maxW: 520, seed: 6, amp: 0.6, dance: 1 }), hx = haul(0.5), tw = lt.w / 2 + 34;
    s += `<g opacity="${n(clamp(ap * 2 - 0.6))}" transform="translate(${n(hx)},0) rotate(${n(Math.sin(t * 1.7) * 0.6 - 0.8)} 540 440)">${ink(`M${540 - tw + 20},446 L${540 - tw + 44},400 M${540 + tw - 20},446 L${540 + tw - 50},404`, "#d2a45c", 4)}${poly(rough([[540 - tw, 444], [540 + tw, 441], [540 + tw + 8, 470], [540 + tw - 4, 499], [540 - tw + 6, 501], [540 - tw - 8, 474]], 71, 2.4, 40), "#f4ecd4", `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`)}${ink(`M${540 - tw + 10},449 l${n(tw * 2 - 20)},-3`, "#c8bc9c", 2, `stroke-dasharray="7 6"`)}${ink(lt.d, "#1a2c9c", 4.8)}</g>`; }
  return s;
}

// ---------------------------------------------------------------- C: a woodcut chapbook strip (1812)
function titleC(t, ap, lv, o) {
  const tz = teaserText(o), paper = "#f1e2bc", blk = "#18120e", x0 = 44, x1 = 1036, y0 = 196, y1 = 500;
  let s = poly(rough([[x0, y0], [x1, y0 + 4], [x1 - 4, y1], [x0 + 6, y1 - 3]], 81, 3.2, 22), paper, `stroke="${blk}" stroke-width="1.5"`);
  for (let i = 0; i < 26; i++) s += `<ellipse cx="${n(x0 + 20 + hash(i + 90) * (x1 - x0 - 40))}" cy="${n(y0 + 12 + hash(i + 91) * (y1 - y0 - 24))}" rx="${n(3 + 9 * hash(i + 92))}" ry="${n(2 + 6 * hash(i + 93))}" fill="${i % 3 ? "#dcc48e" : "#c89a5a"}" opacity="${n(0.3 + 0.3 * hash(i + 94))}"/>`;
  s += ink("M" + rough([[x0 + 16, y0 + 15], [x1 - 16, y0 + 17], [x1 - 18, y1 - 15], [x0 + 20, y1 - 16]], 83, 1.4, 60).map(([x, y]) => `${n(x)},${n(y)}`).join(" L") + " Z", blk, 6, `stroke-linejoin="miter"`) + ink("M" + rough([[x0 + 27, y0 + 26], [x1 - 27, y0 + 28], [x1 - 29, y1 - 26], [x0 + 31, y1 - 27]], 85, 1, 60).map(([x, y]) => `${n(x)},${n(y)}`).join(" L") + " Z", blk, 1.8);
  // the block on the left: the crowned flounder over cut waves, black line only
  const bx = 150, by = 348; s += poly(rough([[70, 236], [232, 238], [230, 462], [72, 460]], 87, 1.6, 40), blk);
  for (let i = 0; i < 7; i++) { const y = 392 + i * 10; let d = `M80,${y}`; for (let x = 80; x < 220; x += 28) d += ` q7,${-6 - (i % 2) * 2} 14,0 q7,${6 + (i % 2) * 2} 14,0`; s += ink(d, paper, 2.4 - (i % 2) * 0.6); }
  for (let i = 0; i < 9; i++) s += ink(`M${86 + i * 16},246 l${n(8 + jit(i + 95, 3))},${n(24 + 14 * hash(i + 96))}`, paper, 1.6);
  s += `<g transform="translate(${bx},${by - 22}) rotate(-8)"><path d="M-62,2 Q-50,-36 -6,-38 Q38,-36 56,-6 L74,-22 L72,24 L56,8 Q36,38 -8,38 Q-50,34 -62,2 Z" fill="${paper}" stroke="${blk}" stroke-width="3" stroke-linejoin="round"/><path d="M-30,-30 q-8,30 2,60 M56,-6 L56,8" stroke="${blk}" stroke-width="2.4" fill="none"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-14 + i * 12},${-34 + Math.abs(i - 2) * 3} l3,-10 M${-14 + i * 12},${34 - Math.abs(i - 2) * 3} l3,10" stroke="${blk}" stroke-width="2"/>`).join("")}<circle cx="-46" cy="-6" r="6.5" fill="${blk}"/><circle cx="-36" cy="-18" r="6" fill="${blk}"/><circle cx="-47" cy="-7" r="2" fill="${paper}"/><circle cx="-37" cy="-19" r="2" fill="${paper}"/><path d="M-61,6 q9,7 17,3" stroke="${blk}" stroke-width="2.4" fill="none"/><path d="M-4,10 L-7,-8 L4,2 L13,-12 L22,2 L33,-8 L30,10 Z" fill="${blk}"/>${[[-12, 20], [8, 22], [30, 18], [40, 4], [-16, -22], [14, -24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${blk}"/>`).join("")}</g>`;
  // heavy black letters with worn nicks, a rule, the teaser in a lighter cut
  const cx = 640, l1 = line(TITLE[0], cx, 300, 70, { maxW: 740, seed: 7, amp: 0.9, dance: 1.6, gap: 0.13 }), l2 = line(TITLE[1], cx, 398, 70, { maxW: 740, seed: 8, amp: 0.9, dance: 1.6, gap: 0.13 });
  const cut = (d, w) => ink(d, blk, w, `stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="3"`);
  s += cut(l1.d, 14.5) + cut(l2.d, 14.5);
  [l1, l2].forEach((l, r) => l.letters.forEach((q, i) => { for (let j = 0; j < 2; j++) { const id = r * 300 + i * 7 + j; if (hash(id) < 0.5 || q.ch === " ") continue; const x = q.x + hash(id + 1) * q.w, y = (r ? 398 : 300) - hash(id + 2) * l.cap; s += ink(`M${n(x)},${n(y)} l${n(jit(id + 3, 9))},${n(jit(id + 4, 5))}`, paper, 1.4 + 1.6 * hash(id + 5)); } }));
  if (tz) { const lt = line(tz, cx, 468, 29, { maxW: 560, seed: 9, amp: 0.6, dance: 1 }); s += ink(`M${n(cx - 330)},424 L${n(lt.x0 + lt.w / 2 - 26)},425 M${n(lt.x0 + lt.w / 2 + 26)},425 L${n(cx + 330)},423`, blk, 2.6) + poly([[lt.x0 + lt.w / 2 - 12, 425], [lt.x0 + lt.w / 2, 418], [lt.x0 + lt.w / 2 + 12, 425], [lt.x0 + lt.w / 2, 432]], blk) + cut(lt.d, 5.4); }
  else s += ink(`M${n(cx - 330)},436 L${n(cx + 330)},435`, blk, 2.6);
  const e = ease(lv, "in"), sc = lerp(1.05, 1, ease(ap, "out"));
  return `<g opacity="${n(clamp(ap * 1.5))}" transform="translate(${n(-e * 1250)},${n(-e * 30)}) rotate(${n(-0.7 - e * 7)} 540 348) translate(540,348) scale(${n(sc * 1000) / 1000}) translate(-540,-348)">${s}</g>`;
}

// the registry: add a style here ({ fn(t, appear, leave, opts), time: { in: [a, b], out: [a, b] } })
export const TITLE_STYLES = {
  A: { fn: titleA, time: { in: [0.2, 0.45], out: [2.95, 3.45] } },
  B: { fn: titleB, time: { in: [0.2, 0.6], out: [2.95, 3.5] } },
  C: { fn: titleC, time: { in: [0.2, 0.45], out: [2.95, 3.4] } },
};
export const TITLE_ZONE = { top: 190, bottom: 504 };
export function titleCard(t, o = {}) {
  const S = TITLE_STYLES[o.style || "A"] || TITLE_STYLES.A, T_ = S.time;
  const ap = o.appear ?? clamp((t - T_.in[0]) / (T_.in[1] - T_.in[0])), lv = o.leave ?? clamp((t - T_.out[0]) / (T_.out[1] - T_.out[0]));
  if (ap <= 0 || lv >= 1) return "";
  return `<clipPath id="tZoneB"><rect x="0" y="0" width="${W}" height="${TITLE_ZONE.bottom}"/></clipPath><g clip-path="url(#tZoneB)">${S.fn(t, ap, lv, o)}</g>`;
}
