// Subtitles for code-drawn (svg2d) legend clips. Two parts, moved out of night-marchers/nm.mjs (Night Marchers draft 1:
// Jonny saw "the lettering for the speech is a bit messed" when the written line and the heard words differed).
//   align(sub, heard): written words -> [word, start, end] using Whisper's heard words ([word, start, end]); matching words
//     keep their own time, a run that differs (a spoken spelling from the "say" map, a split hyphen, a missed word) spreads
//     over the heard run's span.
//   phrases(words, text, cap): hand-set subtitle phrases ("a|b|c", | splits; default the whole line) -> [{ ws, at }].
//   captionSvg(words, u, opts): the phrase being said at u seconds into the line, shown WHOLE from its first spoken word
//     (Jonny 27 Nov: word-by-word fill looked messy); 2 rows split evenly when longer than `wrapAt` characters.
// Word times must be heard on the FINAL voice files: re-run Whisper after any trim or tempo change (a 1.07 tempo on two
// voices after measuring made the Night Marchers captions drift up to 0.9 s).
const nz = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

export function align(sub, heard) {
  const A = sub.map(nz), B = heard.map((h) => nz(h[0])), n1 = A.length, n2 = B.length;
  const M = Array.from({ length: n1 + 1 }, () => new Array(n2 + 1).fill(0));
  for (let i = n1 - 1; i >= 0; i--) for (let j = n2 - 1; j >= 0; j--) M[i][j] = A[i] === B[j] ? M[i + 1][j + 1] + 1 : Math.max(M[i + 1][j], M[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < n1 && j < n2) { if (A[i] === B[j]) { pairs.push([i, j]); i++; j++; } else if (M[i + 1][j] >= M[i][j + 1]) i++; else j++; }
  const out = new Array(n1);
  let pi = 0, pj = 0;
  const fill = (i0, i1, j0, j1) => { // written i0..i1-1 over heard j0..j1-1
    if (i1 <= i0) return;
    const t0 = j1 > j0 ? heard[j0][1] : (heard[j0 - 1]?.[2] ?? 0);
    const t1 = j1 > j0 ? heard[j1 - 1][2] : (heard[j0]?.[1] ?? t0 + 0.3);
    const wt = sub.slice(i0, i1).map((w) => w.length + 2), tot = wt.reduce((x, y) => x + y, 0);
    let acc = 0;
    for (let k = i0; k < i1; k++) { const st = t0 + (t1 - t0) * acc / tot; acc += wt[k - i0]; out[k] = [sub[k], st, t0 + (t1 - t0) * acc / tot]; }
  };
  for (const [a2, b2] of [...pairs, [n1, n2]]) { fill(pi, a2, pj, b2); if (a2 < n1) out[a2] = [sub[a2], heard[b2][1], heard[b2][2]]; pi = a2 + 1; pj = b2 + 1; }
  return out;
}

const r2 = (v) => Math.round(v * 100) / 100;
export function phrases(words, text, cap) {
  let k = 0;
  return (cap ?? text).split("|").map((ph) => { const ws = words.slice(k, k + ph.trim().split(/\s+/).length); k += ws.length; return { ws, at: ws[0]?.[1] ?? 0 }; }).filter((p) => p.ws.length);
}
export function captionSvg(phr, u, { key = null, y = 560, x = 540, maxFs = 74, width = 940, wrapAt = 19, keyColor = "#ffc04a", stroke = "#120c24", reveal = false } = {}) {
  // reveal (Jonny 27 Nov, Urashima): each word appears as it is spoken, in the layout of the whole phrase (nothing moves)
  let pi = -1;
  for (let i = 0; i < phr.length; i++) if (u >= phr[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  const ch = phr[pi].ws;
  const col = (w) => (key && key.test(w[0].replace(/[^a-zʻō0-9]/gi, "")) ? keyColor : "#ffffff");
  const hid = (w) => (reveal && u < w[1] - 0.04 ? ` fill-opacity="0" stroke-opacity="0"` : "");
  const span = (ws) => ws.map((w) => `<tspan fill="${col(w)}"${hid(w)}>${w[0].replace(/&/g, "&amp;").replace(/</g, "&lt;")}</tspan>`).join(" ");
  const len = (ws) => ws.reduce((a, w) => a + w[0].length + 1, -1);
  let k = ch.length;
  if (len(ch) > wrapAt && ch.length > 1) { let best = 1e9; for (let i = 1; i < ch.length; i++) { const d = Math.abs(len(ch.slice(0, i)) - len(ch.slice(i))); if (d < best) { best = d; k = i; } } }
  const rows = k < ch.length ? [ch.slice(0, k), ch.slice(k)] : [ch];
  const fs = Math.min(maxFs, Math.round(width / Math.max(1, Math.max(...rows.map(len)) * 0.6)));
  return rows.map((r, i) => `<text x="${x}" y="${r2(y + (i - (rows.length - 1) / 2) * fs * 1.08)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fs}" stroke="${stroke}" stroke-width="${Math.round(fs * 0.19)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${span(r)}</text>`).join("");
}

// ---------------------------------------------------------------- opening titles (Jonny 27 Nov 2026, Golem title trial)
// An episode's opening title (name + teaser, 0.25-2.6 s) sits ABOVE the spoken subtitles ("the title of the video should be
// above the speech lettering") and below TikTok's top bar. titleSlot(box) takes the title's drawn bounding box at its own
// coordinates ({x, y, w, h}, e.g. from getBBox once) and returns the SVG transform that fits it into that slot: bottom 20 px
// above the top of a 2-row subtitle at `captionY`, top at or below `top`, centred on x 540, scaled down (never up) to fit.
export function captionTop({ captionY = 560, maxFs = 74, rows = 2 } = {}) {
  return captionY - (rows - 1) / 2 * maxFs * 1.08 - maxFs * 0.75;   // cap height of the first row's text
}
export function titleSlot(box, { captionY = 560, maxFs = 74, rows = 2, top = 190, gap = 20, x = 540, maxW = 960 } = {}) {
  const bottom = captionTop({ captionY, maxFs, rows }) - gap;
  const s = Math.min(1, (bottom - top) / box.h, maxW / box.w);
  const cx = box.x + box.w / 2, by = box.y + box.h;
  const r = (v) => Math.round(v * 1000) / 1000;
  return { transform: `translate(${r(x)},${r(bottom)}) scale(${r(s)}) translate(${r(-cx)},${r(-by)})`, scale: s,
    y0: r(bottom - box.h * s), y1: r(bottom) };
}
