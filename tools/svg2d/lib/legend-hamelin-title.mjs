// Legend channel, The Pied Piper of Hamelin: the OPENING TITLE, four options for Jonny to pick from (trial, 27 Nov 2026).
//   titleSvg(style, t) -> an SVG fragment for video time t (s from the start); "" before 0 and from 2.9 s (the first cut).
//   "glass"      panes of the lost window in the piper's motley; the sun comes through pane by pane, then they go dark
//   "chronicle"  the town chronicle: pen-drawn textura on a parchment strip, red initial; the ink fades like old writing
//   "motley"     a red/yellow harlequin pennant with bells; flies in along the lane, is pulled off after the tune
//   "notes"      the letters hop onto a music staff on three notes; the pipe leaves and they march off after it in a line
// Layout (Jonny): above the speech subtitles. Everything stays inside x 60..1020, y 190..405; subtitles start at y ~420.
// Hand-made: all letters are our own drawn shapes (only the small tease on three styles is Inter); every wobble is
// seeded with hash(). A pure function of t: no Math.random, no clock. Ids are fixed and start with "ttl-".
import { n, lerp, clamp, hash, mix } from "./legend.mjs";
import { LEAD, PIED } from "./legend-hamelin.mjs";

const END = 2.9, TAU = Math.PI * 2;
const NAME = "THE PIED PIPER", TEASE = "...the town that didn't pay";
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3), ei = (u) => Math.pow(clamp(u), 3);
const back = (u) => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const P2 = (a) => "M" + a.map((p) => `${n(p[0])},${n(p[1])}`).join(" L") + " Z";
const op = (v) => Math.round(clamp(v) * 100) / 100;
const cen = (a) => { let x = 0, y = 0; for (const p of a) { x += p[0]; y += p[1]; } return [x / a.length, y / a.length]; };

// ---------------------------------------------------------------- our block capitals, cut into panes (units: 100 tall)
const STEM = (x, cuts) => { const ys = [0, ...cuts, 100], out = []; for (let i = 0; i < ys.length - 1; i++) { const a = ys[i], b = ys[i + 1], sa = i ? 4 : 0, sb = i < ys.length - 2 ? 4 : 0; out.push([[x, a + sa], [x + 22, a - sa], [x + 22, b - sb], [x, b + sb]]); } return out; };
const BOWL = [[[22, 0], [48, 0], [44, 22], [22, 22]], [[48, 0], [60, 5], [67, 16], [68, 30], [46, 30], [44, 22]], [[68, 30], [67, 44], [60, 55], [48, 60], [44, 38], [46, 30]], [[48, 60], [22, 60], [22, 38], [44, 38]]];
const CAPS = {
  T: { w: 70, p: [[[0, 0], [25, 0], [23, 22], [0, 22]], [[25, 0], [47, 0], [46, 22], [23, 22]], [[47, 0], [70, 0], [70, 22], [46, 22]], [[24, 22], [46, 22], [46, 56], [24, 64]], [[24, 64], [46, 56], [46, 100], [24, 100]]] },
  H: { w: 72, p: [...STEM(0, [44]), ...STEM(50, [60]), [[22, 39], [50, 39], [50, 61], [22, 61]]] },
  E: { w: 60, p: [...STEM(0, [31, 69]), [[22, 0], [60, 0], [60, 22], [22, 22]], [[22, 39], [50, 39], [50, 61], [22, 61]], [[22, 78], [60, 78], [60, 100], [22, 100]]] },
  P: { w: 68, p: [...STEM(0, [52]), ...BOWL] },
  I: { w: 22, p: STEM(0, [34, 68]) },
  D: { w: 72, p: [...STEM(0, [48]), [[22, 0], [44, 0], [42, 22], [22, 22]], [[44, 0], [58, 6], [68, 20], [72, 38], [50, 40], [48, 30], [42, 22]], [[72, 38], [72, 62], [50, 60], [50, 40]], [[72, 62], [68, 80], [58, 94], [44, 100], [42, 78], [48, 70], [50, 60]], [[44, 100], [22, 100], [22, 78], [42, 78]]] },
  R: { w: 76, p: [...STEM(0, [52]), ...BOWL, [[34, 60], [55, 58], [76, 100], [53, 100]]] },
};
// the name laid out: letters [{ li, wi (word), x, w, panes [[x, y] px] }], total width; corners wobble by hand, shared corners together
function layName(sc, cx, top, gap = 10, space = 36, amp = 1.3) {
  let x = 0, li = 0, wi = 0; const out = [];
  for (const ch of NAME) {
    if (ch === " ") { x += space - gap; wi++; continue; }
    const g = CAPS[ch];
    out.push({ li, wi, ch, x, w: g.w, p: g.p });
    x += g.w + gap; li++;
  }
  const tot = x - gap, x0 = cx - tot * sc / 2;
  for (const L of out) {
    L.x0 = x0 + L.x * sc; L.w *= sc; L.cx = L.x0 + L.w / 2;
    L.panes = L.p.map((pane) => pane.map(([px, py]) => { const s = px * 7.3 + py * 13.7 + L.li * 101; return [x0 + (L.x + px) * sc + jit(s, amp), top + py * sc + jit(s + 0.5, amp)]; }));
  }
  return { letters: out, x0, w: tot * sc };
}
// a letter as one flat shape: every pane stroked wide in the outline colour, then all filled (the union gets one outline)
function solid(panes, fill, line, lw, tf = (p) => p) {
  const d = panes.map((a) => P2(a.map(tf))).join(" ");
  return `<path d="${d}" fill="${line}" stroke="${line}" stroke-width="${lw * 2}" stroke-linejoin="round"/><path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="1.6" stroke-linejoin="round"/>`;
}
const teaseText = (x, y, size, fill, line, lw, o = 1, extra = "") => o <= 0 ? "" : `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${size}" fill="${fill}" stroke="${line}" stroke-width="${lw}" stroke-linejoin="round" paint-order="stroke" letter-spacing="1.2" opacity="${op(o)}" ${extra}>${TEASE}</text>`;

// ================================================================= A  glass
const BLUES = ["#141c66", "#1a2478", "#20308c", "#2a1c66", "#182a80", "#101650"];
function glassPane(a, col, seed, lit, flash, lwd) {
  const c0 = mix(col, hash(seed * 1.37 + 5) < 0.5 ? "#fff6e0" : "#120a2a", 0.14 * Math.abs(hash(seed * 1.37 + 5) - 0.5) * 2);
  const c = mix(mix(c0, "#0c0916", 0.86 * (1 - lit)), "#fff8d8", 0.55 * flash);
  let s = `<path d="${P2(a)}" fill="${c}" stroke="${LEAD}" stroke-width="${n(lwd * (0.8 + 0.4 * hash(seed * 3.1 + 1)))}" stroke-linejoin="round"/>`;
  if (lit > 0.05 && hash(seed + 2.5) > 0.15) {   // light through the middle of the pane, hand-cut
    const [mx, my] = cen(a), k = 0.52 + 0.14 * hash(seed + 2);
    s += `<path d="${P2(a.map((p, i) => [lerp(mx, p[0], k * (0.8 + 0.4 * hash(seed * 3 + i))), lerp(my, p[1], k * (0.8 + 0.4 * hash(seed * 5 + i)))]))}" fill="${mix(c, "#fffbe8", 0.3)}" opacity="${op(0.5 * lit)}"/>`;
  }
  return s;
}
function glass(t) {
  const X0 = 62, X1 = 1018, Y0 = 198, Y1 = 334, RIM = 11;
  const all = clamp(t / 0.07) * (1 - clamp((t - 2.72) / 0.1));
  const sweep = lerp(-160, 1240, (t - 0.55) / 1.7);   // the sun wanders across during the hold
  const light = (x, y, seed, late = 0) => {
    const on = clamp((t - (0.02 + 0.16 * (x - X0) / (X1 - X0) + 0.05 * hash(seed + 71))) / 0.07);
    const off = clamp((t - (2.2 + late + 0.36 * hash(seed + 33))) / 0.05);
    const fl = Math.max(0, 1 - Math.abs(on - 0.6) / 0.4) * (on < 1 ? 1 : 0) + 0.3 * Math.max(0, 1 - Math.abs(x + (y - 266) * 0.6 - sweep) / 70);
    return [on * (1 - off), fl * (1 - off)];
  };
  let s = `<g opacity="${op(all)}"><rect x="${X0 - 3}" y="${Y0 - 3}" width="${X1 - X0 + 6}" height="${Y1 - Y0 + 6}" fill="${LEAD}" rx="3"/>`;
  // rim: small jewel squares top and bottom
  const NR = 44, rw = (X1 - X0) / NR;
  for (let r = 0; r < 2; r++) for (let i = 0; i < NR; i++) {
    const x = X0 + i * rw, y = r ? Y1 - RIM : Y0, sd = 500 + r * 97 + i, [lit, fl] = light(x, y, sd, -0.06);
    s += glassPane([[x + jit(sd, 0.8), y], [x + rw + jit(sd + 1, 0.8), y], [x + rw + jit(sd + 1 + 0.3, 0.8), y + RIM], [x + jit(sd + 0.3, 0.8), y + RIM]], (i + r) % 4 === 0 ? PIED.yellow : (i + r) % 2 ? "#2a4ab0" : PIED.crimson, sd, lit, fl, 2.6);
  }
  // ground: two courses of cut blue panes
  const gy0 = Y0 + RIM, gy1 = Y1 - RIM, mid = (gy0 + gy1) / 2;
  for (let r = 0; r < 2; r++) {
    const cuts = [X0]; let x = X0 + (r ? 34 : 62);
    while (x < X1 - 30) { cuts.push(x); x += 58 + 30 * hash(x * 0.37 + r * 9); }
    cuts.push(X1);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1], sd = 900 + r * 131 + i, ya = mid + jit(Math.round(a) + 3, 7), yb = mid + jit(Math.round(b) + 3, 7), [lit, fl] = light((a + b) / 2, r ? gy1 : gy0, sd, -0.1);
      const ta = a + jit(sd * 3, 5) * (i ? 1 : 0), tb = b + jit(sd * 3 + 3, 5) * (i < cuts.length - 2 ? 1 : 0);
      s += glassPane(r ? [[a, ya], [b, yb], [tb, gy1], [ta, gy1]] : [[ta, gy0], [tb, gy0], [b, yb], [a, ya]], BLUES[Math.floor(hash(sd + 7) * BLUES.length)], sd, lit * 0.92, fl * 0.5, 3.4);
    }
  }
  // the name: every stroke of a letter is cut into panes, red and yellow by turns (motley)
  const { letters } = layName(0.98, 540, 219, 10, 36, 1.2);
  for (const L of letters) s += `<path d="${L.panes.map(P2).join(" ")}" fill="${LEAD}" stroke="${LEAD}" stroke-width="8.5" stroke-linejoin="round"/>`;
  for (const L of letters) L.panes.forEach((a, i) => {
    const sd = 40 + L.li * 23 + i, [mx, my] = cen(a), [lit, fl] = light(mx, my, sd, 0.1);
    const warm = (i + L.li) % 2 ? (hash(sd + 4) > 0.3 ? PIED.yellow : "#ffb01a") : (hash(sd + 4) > 0.35 ? "#f4262c" : "#d4142e");
    s += glassPane(a, warm, sd, lit, fl, 3.1);
  });
  // tease: pale glass letters between two lozenges
  const to = clamp((t - 0.2) / 0.1) * (1 - clamp((t - 2.5) / 0.14));
  const tl = clamp((t - 0.2) / 0.16);
  s += teaseText(540, 386, 37, mix("#3a3048", "#ffe9a0", tl), LEAD, 9, to);
  for (const k of [-1, 1]) { const x = 540 + k * 352, y = 374; s += `<g opacity="${op(to)}">` + glassPane([[x, y - 13], [x + 10, y], [x, y + 13], [x - 10, y]], k < 0 ? PIED.red : PIED.yellow, 7 + k, tl, 0, 4) + `</g>`; }
  return s + `</g>`;
}

// ================================================================= B  chronicle
// A broad pen held at 40 degrees: a glyph is a few pen paths; each stretch is the nib swept along it (thick and thin come by themselves).
const NIB = 17, NA = 40 * Math.PI / 180, NX = Math.cos(NA) * NIB / 2, NY = -Math.sin(NA) * NIB / 2;
const MIN = [[-5, 4], [0, 9], [0, 50], [6, 57]];
const TEX = {
  h: { w: 40, s: [[[-5, -40], [0, -35], [0, 50], [6, 57]], [[2, 13], [10, 5], [20, 13], [20, 46], [15, 61], [9, 69]]] },
  e: { w: 34, s: [[[2, 6], [0, 10], [0, 50], [7, 57], [17, 51]], [[1, 8], [9, 2], [19, 11], [19, 23], [3, 35]]] },
  i: { w: 21, s: [MIN, [[-2, -17], [3, -12]]] },
  d: { w: 40, s: [[[9, 4], [0, 12], [0, 48], [8, 57], [19, 50]], [[-7, -27], [19, 10], [19, 50]]] },
  p: { w: 40, s: [[[-5, 4], [0, 9], [0, 76], [-6, 80]], [[0, 76], [6, 80]], [[0, 13], [9, 4], [19, 12], [19, 46], [8, 58], [0, 50]]] },
  r: { w: 31, s: [MIN, [[5, 7], [12, 3], [20, 10]]] },
};
// Lombardic capitals, drawn as shapes (cap box x 0..62, top -40, base 60)
const CAP_T = "M0,-39 C12,-34 52,-34 64,-39 L65,-16 C60,-25 51,-27 42,-27 C40,0 41,30 45,51 L52,57 L52,60 L12,60 L12,57 L19,51 C23,30 24,0 22,-27 C13,-27 4,-25 -1,-16 Z";
const CAP_P = "M-1,-40 L30,-40 C52,-40 61,-28 61,-13 C61,4 51,14 31,14 L27,14 L27,50 L33,57 L33,60 L-3,60 L-3,57 L4,50 L4,-31 L-1,-37 Z M27,-30 C39,-30 43,-22 43,-13 C43,-3 39,4 27,4 Z";
const TEXT_B = "The Pied Piper";
function nibPath(strokes, x, sd) {
  let d = "";
  for (const st of strokes) for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1], ja = [jit(sd + a[0] * 3.1 + a[1] * 1.7, 0.5), jit(sd + a[0] * 1.3 + a[1] * 2.9, 0.5)], jb = [jit(sd + b[0] * 3.1 + b[1] * 1.7, 0.5), jit(sd + b[0] * 1.3 + b[1] * 2.9, 0.5)];
    const ax = x + a[0] + ja[0], ay = a[1] + ja[1], bx = x + b[0] + jb[0], by = b[1] + jb[1];
    d += `M${n(ax - NX)},${n(ay - NY)} L${n(ax + NX)},${n(ay + NY)} L${n(bx + NX)},${n(by + NY)} L${n(bx - NX)},${n(by - NY)} Z `;
  }
  return d;
}
// small hand script for the tease (x-height 10 units, baseline 0), one pen line
const SCR = {
  t: [8, "M3,-16 L3,-2.5 Q3,0 6.5,-0.5 M0,-10 L7,-10.4"], h: [10, "M1,-17.5 L1,0 M1,-6 C3,-10 7,-11.5 7,-7 L7,-1.5 Q7,0 8.5,-0.6"],
  e: [9, "M1.2,-5 L7,-5.4 C7,-11.5 1,-11.5 1,-5 C1,1 5,1 7.4,-1.8"], o: [9.5, "M4,-10 C0,-10 0,0 4,0 C8,0 8,-10 4,-10 Z"],
  w: [12.5, "M0,-10 L2.6,0 L5.2,-8 L7.8,0 L10.4,-10.4"], n: [10, "M1,-10 L1,0 M1,-6 C3,-10 7,-11.5 7,-7 L7,-1.5 Q7,0 8.5,-0.6"],
  a: [10, "M7,-10 L7,-1.5 Q7,0 8.6,-0.6 M7,-6 C6,-11.5 1,-11.5 1,-5 C1,1 6,1 7,-4"], d: [10, "M7,-18 L7,-1.5 Q7,0 8.6,-0.6 M7,-6 C6,-11.5 1,-11.5 1,-5 C1,1 6,1 7,-4"],
  i: [4.6, "M1,-10 L1,-1.5 Q1,0 2.6,-0.6 M1,-14.6 L1.3,-14"], p: [10, "M1,-10 L1,7 M1,-5 C2,-11.5 7.4,-11.5 7.4,-5 C7.4,1 2,1 1,-4"],
  y: [8.5, "M0,-10 L3.6,-0.4 M7.2,-10 L3,2.4 Q1.4,7 -1.4,5.8"], "'": [3.4, "M1.4,-17.5 L0.8,-13.6"], ".": [4.2, "M1,-0.9 L1.2,-0.3"], " ": [6, ""],
};
function chronicle(t) {
  const X0 = 150, X1 = 930, Y0 = 197, Y1 = 405;
  const unroll = eo(t / 0.16), gone = clamp((t - 2.68) / 0.14), W1 = lerp(X0 + 40, X1 + 12, unroll);
  // the strip: hand-torn edge, lighter inside, stains, pricked and ruled like the page it was cut from
  const edge = [];
  for (let x = X0; x <= X1; x += 39) edge.push([x + jit(x, 3), Y0 + jit(x + 5, 3.2)]);
  for (let y = Y0 + 30; y < Y1 - 10; y += 34) edge.push([X1 + jit(y + 1, 4.5), y]);
  for (let x = X1; x >= X0; x -= 39) edge.push([x + jit(x + 9, 3), Y1 - 2 + jit(x + 14, 2.6)]);
  for (let y = Y1 - 32; y > Y0 + 10; y -= 34) edge.push([X0 + jit(y + 2, 4.5), y]);
  let s = `<clipPath id="ttl-chron-clip"><rect x="0" y="150" width="${n(W1)}" height="300"/></clipPath><g opacity="${op(1 - gone)}"><g clip-path="url(#ttl-chron-clip)">`;
  s += `<path d="${P2(edge.map(([x, y]) => [x + 5, y + 7]))}" fill="#150c18" opacity="0.4"/><path d="${P2(edge)}" fill="#d9bd84" stroke="#8a6238" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<path d="${P2(edge.map(([x, y]) => [lerp(x, 540, 0.022), lerp(y, 301, 0.1)]))}" fill="#f0dfb2"/>`;
  for (let i = 0; i < 9; i++) { const x = X0 + 40 + hash(i + 5) * (X1 - X0 - 80), y = Y0 + 30 + hash(i + 9) * (Y1 - Y0 - 60), r = 12 + 34 * hash(i + 2); s += `<path d="${P2(Array.from({ length: 9 }, (_, j) => [x + Math.cos(j / 9 * TAU) * r * (0.6 + 0.6 * hash(i * 7 + j)), y + Math.sin(j / 9 * TAU) * r * 0.6 * (0.6 + 0.6 * hash(i * 3 + j))]))}" fill="${i % 3 ? "#d9bd84" : "#b88a5a"}" opacity="${op(0.16 + 0.16 * hash(i))}"/>`; }
  const SC = 1.12, BASE = 319, tw = [...TEXT_B].reduce((a, c) => a + (c === " " ? 24 : c === "T" ? 72 : c === "P" ? 68 : TEX[c].w), 0) - 6, TX = 540 - tw * SC / 2 + 2;
  for (const y of [BASE - 100 * SC, BASE - 60 * SC, BASE, 387]) s += `<path d="M${X0 + 16},${n(y + jit(y, 1))} L${X1 - 16},${n(y + jit(y + 3, 1))}" stroke="#a87a4a" stroke-width="1.3" opacity="0.5"/>`;
  for (const y of [BASE - 100 * SC, BASE - 60 * SC, BASE, 387]) s += `<circle cx="${X0 + 11}" cy="${n(y)}" r="1.7" fill="#6a4426" opacity="0.7"/><circle cx="${X1 - 11}" cy="${n(y)}" r="1.7" fill="#6a4426" opacity="0.7"/>`;
  // the line of textura, glyph by glyph as the pen wrote it; on the way out each glyph pales at its own pace
  const INKC = "#2a1a12", RED = "#a8201c", OLD = "#b9a074";
  const ink = (k, seed, late = 0) => { const w = clamp((t - (0.04 + 0.014 * k)) / 0.07), f = clamp((t - (2.18 + late + 0.26 * hash(seed + 3))) / 0.36); return [w * (1 - f * f), f]; };
  let x = 0, k = 0, body = "";
  for (const ch of TEXT_B) {
    if (ch === " ") { x += 24; continue; }
    const [o, f] = ink(k, k * 7 + 1, ch === "T" ? 0.14 : 0), tr = `translate(${n(TX + x * SC)},${n(BASE - 60 * SC + jit(k + 60, 0.9))}) scale(${SC})`;
    if (ch === "T") {
      body += `<g transform="${tr}" opacity="${op(o)}"><path d="${CAP_T}" fill="${mix(RED, OLD, f * 0.7)}" stroke="${mix("#5a120e", OLD, f * 0.7)}" stroke-width="1.4" stroke-linejoin="round"/><path d="M32,-21 C31,5 31,28 32,46 M8,-31 C24,-29 42,-29 57,-31" stroke="#f0dfb2" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      body += `<path d="M-6,-12 C-18,-6 -18,10 -8,12 C-2,13 0,6 -5,4 M-8,12 C-16,26 -12,44 -2,52 M-11,30 C-17,30 -19,36 -15,39 M66,-12 C72,-2 70,8 64,12" stroke="${mix("#2f5a8a", OLD, f * 0.8)}" stroke-width="1.9" fill="none" stroke-linecap="round"/><circle cx="-13" cy="-16" r="2.4" fill="${mix("#2f5a8a", OLD, f * 0.8)}"/><circle cx="69" cy="16" r="2.2" fill="${mix("#2f5a8a", OLD, f * 0.8)}"/></g>`;
      x += 72;
    } else if (ch === "P") {
      body += `<g transform="${tr}" opacity="${op(o)}"><path d="${CAP_P}" fill-rule="evenodd" fill="${mix(INKC, OLD, f * 0.75)}" stroke="${mix(INKC, OLD, f * 0.75)}" stroke-width="1.2" stroke-linejoin="round"/><path d="M15.5,-30 C15,0 15,26 15.5,48" stroke="#f0dfb2" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M35,-21 L40,-13 L35,-5 L30,-13 Z" fill="${mix(RED, OLD, f * 0.7)}"/></g>`;
      x += 68;
    } else {
      const g = TEX[ch], c = mix(INKC, OLD, f * 0.75);
      body += `<path transform="${tr}" d="${nibPath(g.s, 0, k * 13 + 2)}" fill="${c}" stroke="${c}" stroke-width="1.1" stroke-linejoin="round" opacity="${op(o * (0.9 + 0.1 * hash(k + 4)))}"/>`;
      x += g.w;
    }
    k++;
  }
  s += body;
  // tease in the scribe's small hand, red-brown, written after the name
  const U = 2.36, tsw = [...TEASE].reduce((a, c) => a + SCR[c][0], 0) * U; let sx = 540 - tsw / 2 + 4, j = 0;
  for (const ch of TEASE) {
    const [adv, d] = SCR[ch];
    if (d) {
      const w = clamp((t - (0.2 + 0.008 * j)) / 0.06), f = clamp((t - (2.14 + 0.3 * hash(j * 3 + 11))) / 0.34);
      s += `<path transform="translate(${n(sx)},${n(387 + jit(j + 90, 0.8))}) scale(${U}) skewX(-9) rotate(${n(jit(j + 40, 1.6))})" d="${d}" fill="none" stroke="${mix("#7a2416", OLD, f * 0.8)}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" opacity="${op(w * (1 - f * f))}"/>`;
    }
    sx += adv * U; j++;
  }
  return s + `</g></g>`;
}

// ================================================================= C  motley
function motley(t) {
  const X0 = 70, X1 = 1010, Y0 = 206, Y1 = 320, HW = 30, HH = 19;
  const inU = clamp(t / 0.3), outU = clamp((t - 2.3) / 0.52);
  const dx = lerp(-1150, 0, back(inU)) + 1250 * ei(outU) + 60 * outU;
  const move = Math.max(1 - inU, outU > 0 ? 0.35 + outU : 0, 0) + Math.max(0, 1 - (t - 0.3) / 0.35) * (inU >= 1 ? 0.6 : 0);
  const amp = 3.2 + 11 * clamp(move);
  // cloth: a wave runs down it from the leading (right) end; the trailing end flaps most
  const tf = ([x, y]) => { const trail = 0.45 + 0.75 * (1 - (x - X0) / (X1 - X0)); return [x + dx - (y - 263) * 0.1 * clamp(move) + Math.cos(x / 150 - t * 8.5) * amp * 0.25, y + Math.sin(x / 150 - t * 8.5) * amp * trail + Math.sin(x / 61 - t * 13 + 1) * amp * 0.16]; };
  const out = [];
  for (let x = X0; x <= X1; x += HW) out.push([x, Y0]);
  out.push([X1 - 38, (Y0 + Y1) / 2]);
  const tips = [];
  for (let x = X1; x >= X0; x -= HW) { const tip = Math.round((x - X0) / HW) % 2 === 1; out.push([x, tip ? Y1 + 17 : Y1]); if (tip) tips.push([x, Y1 + 17]); }
  const od = P2(out.map(tf));
  let s = `<clipPath id="ttl-motley-clip"><path d="${od}"/></clipPath>`;
  s += `<path d="${P2(out.map((p) => { const q = tf(p); return [q[0] + 5, q[1] + 8]; }))}" fill="#150c18" opacity="0.4"/>`;
  s += `<g clip-path="url(#ttl-motley-clip)"><path d="${od}" fill="${PIED.yellow}"/>`;
  for (let i = -1; i <= (X1 - X0) / HW + 1; i++) for (let j = -1; j <= (Y1 + 20 - Y0) / HH + 1; j++) {
    if ((i + j) % 2) continue;
    const cx = X0 + i * HW, cy = Y0 + j * HH, sd = i * 31 + j * 17 + 400, red = ((i % 2) + 2) % 2 === 0;
    const base = red ? (hash(sd) > 0.25 ? PIED.red : PIED.crimson) : (hash(sd) > 0.2 ? PIED.yellow : PIED.orange);
    const c = mix(base, hash(sd + 1) < 0.5 ? "#fff6e0" : "#3a0a1a", 0.12 * hash(sd + 2));
    s += `<path d="${P2([[cx, cy - HH], [cx + HW, cy], [cx, cy + HH], [cx - HW, cy]].map(tf))}" fill="${c}" stroke="#4a0a18" stroke-width="1.6" stroke-linejoin="round"/>`;
    // a stitch of light thread across every diamond, as on the piper's coat
    const a = tf([cx - HW * 0.45, cy + HH * 0.1]), b = tf([cx + HW * 0.4, cy - HH * 0.2]);
    s += `<path d="M${n(a[0])},${n(a[1])} L${n(b[0])},${n(b[1])}" stroke="${red ? "#ff8a6a" : "#fff6b0"}" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>`;
  }
  // the woven field the name sits on, with a gold thread above and below
  const band = (y0, y1) => { const a = []; for (let x = X0 - 20; x <= X1 + 20; x += HW) a.push([x, y0]); for (let x = X1 + 20; x >= X0 - 20; x -= HW) a.push([x, y1]); return P2(a.map(tf)); };
  s += `<path d="${band(221, 311)}" fill="#4a0818" opacity="0.5"/><path d="${band(219, 222.5)}" fill="#ffd24a"/><path d="${band(309.5, 313)}" fill="#ffd24a"/>`;
  s += `<path d="${band(Y0 - 4, Y0 + 5)}" fill="#3c0616"/></g>`;
  s += `<path d="${od}" fill="none" stroke="${LEAD}" stroke-width="4.5" stroke-linejoin="round"/>`;
  // bells on the dagged hem: they swing a little behind the cloth
  for (const [bx, by] of tips) { const p = tf([bx, by]), sw = Math.sin(t * 9 - bx / 90) * amp * 0.28; s += `<g transform="translate(${n(p[0] + sw)},${n(p[1] + 5)})"><circle r="6.4" fill="#ffc83a" stroke="${LEAD}" stroke-width="2.6"/><path d="M-3.4,1.6 L3.4,1.6 M0,1.6 L0,5" stroke="${LEAD}" stroke-width="1.7" stroke-linecap="round"/><circle cx="-1.8" cy="-2.2" r="1.5" fill="#fff6c8"/></g>`; }
  // the name, sewn on in cream
  const { letters } = layName(0.78, 540, 227, 11, 36, 1.1);
  for (const L of letters) s += `<path d="${L.panes.map((a) => P2(a.map(([x, y]) => tf([x + 4, y + 5])))).join(" ")}" fill="#1a0810" stroke="#1a0810" stroke-width="13" stroke-linejoin="round" opacity="0.55"/>`;
  for (const L of letters) s += solid(L.panes, L.li % 2 ? "#fff3c4" : "#ffe9a0", "#1a0c16", 5.5, tf);
  // tease: runs after the pennant, a beat behind
  const tIn = clamp((t - 0.1) / 0.3), tOut = clamp((t - 2.4) / 0.44);
  s += teaseText(540 + lerp(-1100, 0, back(tIn)) + 1250 * ei(tOut), 388 + Math.sin(t * 6) * 1.5, 37, "#fff0c0", "#1a0c16", 9, 1);
  return s;
}

// ================================================================= D  notes
function note(x, y, sc, col, line) {
  return `<g transform="translate(${n(x)},${n(y)}) scale(${sc})"><path d="M6,-2 L7,-30 C13,-26 17,-21 15,-13" stroke="${line}" stroke-width="7.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="0" cy="0" rx="8.5" ry="6" transform="rotate(-22)" fill="${line}" stroke="${line}" stroke-width="5"/><path d="M6,-2 L7,-30 C13,-26 17,-21 15,-13" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="0" cy="0" rx="8.5" ry="6" transform="rotate(-22)" fill="${col}"/></g>`;
}
function notes(t) {
  const X0 = 64, X1 = 1016, LY = [228, 252, 276, 300, 324], CREAM = "#fff3d0", DARK = "#1a0f22";
  const lineIn = eo(t / 0.14), lineOut = clamp((t - 2.7) / 0.12);
  let s = "";
  // the staff: five pen lines, drawn left to right; each letter makes its line dip a little where it sits
  const xr = lerp(X0, X1, lineIn);
  for (let k = 0; k < 5; k++) {
    let d = "";
    for (let x = X0; x <= xr + 0.1; x += 34) d += `${x === X0 ? "M" : " L"}${n(Math.min(x, xr))},${n(LY[k] + jit(k * 53 + x * 0.21, 1.5) + Math.sin(x / 140 + k + t * 2.2) * 1.1)}`;
    s += `<path d="${d}" stroke="${DARK}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op(0.6 * (1 - lineOut))}"/><path d="${d}" stroke="${CREAM}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op(0.95 * (1 - lineOut))}"/>`;
  }
  s += `<path d="M${X0},${LY[0] - 1} L${X0 + jit(3, 2)},${LY[4] + 1}" stroke="${DARK}" stroke-width="9" stroke-linecap="round" opacity="${op(0.6 * lineIn * (1 - lineOut))}"/><path d="M${X0},${LY[0] - 1} L${X0 + jit(3, 2)},${LY[4] + 1}" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" opacity="${op(lineIn * (1 - lineOut))}"/>`;
  // the pipe leads: it sits at the head of the line and is the first to go
  const march = (ts, x) => { const u = Math.max(0, t - ts); return [3300 * (u - 0.05 * (1 - Math.exp(-u / 0.05))), u > 0 ? -15 * Math.abs(Math.sin(u * 30 + x * 0.01)) : 0, clamp(u / 0.06)]; };
  const pIn = clamp((t - 0.0) / 0.12), [pdx, pdy] = march(2.14, 0);
  s += `<g transform="translate(${n(948 + pdx + lerp(90, 0, back(pIn)))},${n(282 + pdy + Math.sin(t * 5) * 2.5)}) rotate(${n(-27 + Math.sin(t * 5 + 1) * 3)})" opacity="${op(pIn * 2)}">`
    + `<path d="M-58,-4.5 L34,-7 L52,-13 L56,-12 L56,12 L52,13 L34,7 L-58,4.5 Z" fill="${DARK}" stroke="${DARK}" stroke-width="7" stroke-linejoin="round"/><path d="M-58,-4.5 L34,-7 L52,-13 L56,-12 L56,12 L52,13 L34,7 L-58,4.5 Z" fill="#c8843a"/><path d="M-58,0.5 L34,1.5 L52,5 L56,12 L52,13 L34,7 L-58,4.5 Z" fill="#8a4a22"/>`
    + `<path d="M-66,-3.4 L-56,-5.4 L-56,5.4 L-66,3.4 Z" fill="#f0dfb2" stroke="${DARK}" stroke-width="2.4" stroke-linejoin="round"/>`
    + [-34, -19, -4, 11, 25].map((x) => `<ellipse cx="${x}" cy="-0.8" rx="3" ry="2.3" fill="${DARK}"/>`).join("")
    + `<path d="M38,-8.5 L38,8.5 M-46,-5.2 L-46,5.2" stroke="${PIED.red}" stroke-width="4"/><path d="M42.5,-10 L42.5,10" stroke="${PIED.yellow}" stroke-width="3.4"/>`
    + `<path d="M-44,6 C-48,20 -38,26 -44,40 M-44,6 C-36,18 -30,24 -32,36" stroke="${PIED.red}" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>`;
  // the name: one word per note of the tune, each word at its own height on the staff
  const { letters } = layName(0.84, 458, 2, 11, 48, 1.1), WY = [240, 226, 233], WT = [0.01, 0.085, 0.16];
  const N = letters.length;
  let sh = "", top = "";
  for (const L of letters) {
    const first = letters.find((q) => q.wi === L.wi), kin = L.li - first.li;
    const u = (t - WT[L.wi] - kin * 0.013) / 0.11;
    if (u <= 0) continue;
    const land = clamp(u), boun = clamp((u - 1) / 0.9);
    let dy = -74 * (1 - land) * (1 - land) - 9 * Math.sin(boun * Math.PI) * (boun < 1 ? 1 : 0);
    const sq = u >= 1 && boun < 0.35 ? 1 - 0.1 * Math.sin(boun / 0.35 * Math.PI) : 1;   // a little squash on landing
    const hold = t > 0.5 && t < 2.2 ? -4.5 * Math.pow(Math.max(0, Math.sin(t * 4.2 - L.li * 0.55)), 6) : 0;   // the tune runs through them
    const [mdx, mdy, lean] = march(2.2 + (N - 1 - L.li) * 0.022, L.cx);
    const x = mdx, y = WY[L.wi] + dy + hold + mdy, rot = jit(L.li + 70, 2.2) + lean * 9;
    const tr = `translate(${n(L.cx + x)},${n(y + 86)}) rotate(${n(rot)}) scale(1,${n(sq * 100) / 100}) translate(${n(-L.cx)},-86)`;
    const d = L.panes.map(P2).join(" ");
    sh += `<path transform="${tr}" d="${d}" fill="${DARK}" stroke="${DARK}" stroke-width="13" stroke-linejoin="round" opacity="${op(land * 3)}"/><path transform="translate(5,6) ${tr}" d="${d}" fill="${PIED.red}" stroke="${PIED.red}" stroke-width="2" stroke-linejoin="round" opacity="${op(land * 3)}"/>`;
    top += `<path transform="${tr}" d="${d}" fill="${L.wi === 1 ? "#ffe9a0" : CREAM}" stroke="${L.wi === 1 ? "#ffe9a0" : CREAM}" stroke-width="1.6" stroke-linejoin="round" opacity="${op(land * 3)}"/>`;
  }
  s += sh + top;
  // tease between two little notes; it trails off after the letters
  const tIn = clamp((t - 0.22) / 0.12), [tdx, tdy] = march(2.47, 0);
  s += `<g transform="translate(${n(tdx)},${n(tdy * 0.5 + (1 - eo(tIn)) * 14)})" opacity="${op(tIn)}">` + teaseText(540, 388, 37, CREAM, DARK, 9, 1) + note(196, 384, 0.8, "#ffe9a0", DARK) + note(884, 384, 0.8, "#ffe9a0", DARK) + `</g>`;
  return s;
}

const STYLES = { glass, chronicle, motley, notes };
export function titleSvg(style, t) {
  if (!(t >= 0) || t >= END || !STYLES[style]) return "";
  return `<g id="ttl-${style}">${STYLES[style](t)}</g>`;
}
