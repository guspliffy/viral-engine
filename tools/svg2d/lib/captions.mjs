// Subtitles for code-drawn (svg2d) legend clips. Two parts, moved out of night-marchers/nm.mjs (Night Marchers draft 1:
// Jonny saw "the lettering for the speech is a bit messed" when the written line and the heard words differed).
//   align(sub, heard): written words -> [word, start, end] using Whisper's heard words ([word, start, end]); matching words
//     keep their own time, a run that differs (a spoken spelling from the "say" map, a split hyphen, a missed word) spreads
//     over the heard run's span.
//   captionSvg(words, u, opts): the chunk being said at u seconds into the line, word by word; 2 rows planned on the whole
//     chunk when it is longer than `wrapAt` characters, so nothing shrinks or jumps while words appear.
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
export function captionSvg(words, u, { key = null, y = 560, x = 540, maxFs = 74, width = 940, wrapAt = 19, perChunk = 4, keyColor = "#ffc04a", stroke = "#120c24" } = {}) {
  if (!words.length) return "";
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => { cur.push(w); if (/[.,?!]$/.test(w[0]) || cur.length >= perChunk || i === words.length - 1) { chunks.push(cur); cur = []; } });
  const ch = chunks.find((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] : 1e9)) || chunks[chunks.length - 1];
  const shown = ch.filter((w) => u >= w[1] - 0.04);
  if (!shown.length) return "";
  const col = (w) => (key && key.test(w[0].replace(/[^a-zʻō0-9]/gi, "")) ? keyColor : "#ffffff");
  const span = (ws) => ws.map((w) => `<tspan fill="${col(w)}">${w[0].replace(/&/g, "&amp;").replace(/</g, "&lt;")}</tspan>`).join(" ");
  const len = (ws) => ws.reduce((a, w) => a + w[0].length + 1, -1);
  let k = ch.length;
  if (len(ch) > wrapAt && ch.length > 1) { let best = 1e9; for (let i = 1; i < ch.length; i++) { const d = Math.abs(len(ch.slice(0, i)) - len(ch.slice(i))); if (d < best) { best = d; k = i; } } }
  const plan = k < ch.length ? [ch.slice(0, k), ch.slice(k)] : [ch];
  const fs = Math.min(maxFs, Math.round(width / Math.max(1, Math.max(...plan.map(len)) * 0.6)));
  return [shown.slice(0, k), shown.slice(k)].map((r, i) => (r.length ? `<text x="${x}" y="${r2(y + (i - (plan.length - 1) / 2) * fs * 1.08)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fs}" stroke="${stroke}" stroke-width="${Math.round(fs * 0.19)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${span(r)}</text>` : "")).join("");
}
