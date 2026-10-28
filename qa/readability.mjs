#!/usr/bin/env node
// Readability: does each character stand out from what is behind it, and do the key poses read as silhouettes?
// On a phone, in a feed, a character that melts into the wall or into the next character is a blur, however nice the
// frame looks full size.
//
//   node qa/readability.mjs storyboards/x.json                 -> one still per beat, measures, out/readability/<id>.png + .json
//   node qa/readability.mjs storyboards/x.json --at 2,4.5,9    -> these times instead of the beats
//   node qa/readability.mjs storyboards/x.json --look anime-pro (or any other render.mjs still flag: --style, --draft)
//
// How: render.mjs draws each still and, beside it (--ids), a map of which character covers each pixel. Along each
// character's outline the colour a few pixels inside is compared with the colour a few pixels outside (CIE Delta E, at
// half size: 4 px there is 8 px of the full frame, past a thin ink line, so it measures the fills, not the outline).
//   edge  share of a character's outline against the background where the two sides differ clearly at phone size
//         (Delta E >= 20), and how much of it differs in brightness alone (L* >= 15: what still reads in a dim feed or
//         in greyscale). Under 60 % at a beat: the shape melts into the set (warn, once per character, listing the
//         beats). A lit rim, a lighter or darker wall or a colour change behind the character fixes it.
//   blend two characters whose shared edge is mostly the same colour (they read as one shape; warn).
//   merge two silhouettes that share more than 20 % of the smaller one's outline: in black they are one blob. A note
//         (one per pair, listing the beats), since someone standing behind is normal; give them a gap where a pose
//         has to read on its own.
// These are diagnostics, like the creative checks: they warn or note, never fail. The sheet shows each beat twice: the frame
// with the lost outline in red (yellow where two characters blend), and all characters as black silhouettes.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRGB, writePNG, grid, lab } from "./pixels.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 540, H = 960, D = 4, CLEAR = 20, VALUE = 15, EDGE_WARN = 60, BLEND_WARN = 60, MERGE_SHARE = 20, MIN_AREA = 0.004;

function args() {
  const a = process.argv.slice(2), o = { sb: null, at: "beats", pass: [], out: path.join(ROOT, "out", "readability"), json: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--at") o.at = a[++i];
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--json") o.json = true;
    else if (["--look", "--style"].includes(a[i])) o.pass.push(a[i], a[++i]);
    else if (a[i] === "--draft") o.pass.push(a[i]);
    else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
    else { console.error(`unknown option ${a[i]}`); process.exit(2); }
  }
  if (!o.sb) { console.error("usage: node qa/readability.mjs <storyboard.json> [--at t,t | beats] [--look l] [--style s] [--draft] [--out dir] [--json]"); process.exit(2); }
  return o;
}

// one beat: frame colours (half size) and the character map -> per-character edge results and the two sheet cells
function measure(stillFile, idsFile, cast) {
  const rgb = readRGB(stillFile, W, H), idRGB = readRGB(idsFile, W, H), N = W * H;
  const id = new Uint8Array(N), L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N);
  for (let p = 0; p < N; p++) { id[p] = idRGB[p * 3]; const c = lab(rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]); L[p] = c[0]; A[p] = c[1]; B[p] = c[2]; }
  const dE = (p, q) => Math.hypot(L[p] - L[q], A[p] - A[q], B[p] - B[q]);
  const stats = cast.map(() => ({ area: 0, bg: 0, bgClear: 0, bgValue: 0, bgDE: [], pairs: {} }));
  const lost = new Uint8Array(N); // 1 = outline lost against the set, 2 = two characters blend
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, k = id[p]; if (!k || k > cast.length) continue;
    const s = stats[k - 1]; s.area++;
    for (const [dx, dy] of dirs) {
      const qx = x + dx, qy = y + dy; if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
      const q = qy * W + qx, m = id[q]; if (m === k) continue;
      // a few pixels into each side, still on the same side (thin parts like a staff are skipped: no fill to measure)
      const ix = x - dx * D, iy = y - dy * D, ox = qx + dx * (D - 1), oy = qy + dy * (D - 1);
      if (ix < 0 || iy < 0 || ix >= W || iy >= H || ox < 0 || oy < 0 || ox >= W || oy >= H) continue;
      const pi = iy * W + ix, po = oy * W + ox; if (id[pi] !== k || id[po] !== m) continue;
      const e = dE(pi, po);
      if (m === 0) { s.bg++; s.bgDE.push(e); if (Math.abs(L[pi] - L[po]) >= VALUE) s.bgValue++; if (e >= CLEAR) s.bgClear++; else lost[p] = 1; }
      else if (m > k) { const pr = (s.pairs[m] ??= { n: 0, clear: 0 }); pr.n++; if (e >= CLEAR) pr.clear++; else lost[p] = 2; }
    }
  }
  // sheet cells at a quarter of full size: the frame with the lost outline marked, and the silhouettes
  const w = W / 2, h = H / 2, frame = Buffer.alloc(w * h * 3), sil = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3, ps = [(2 * y) * W + 2 * x, (2 * y) * W + 2 * x + 1, (2 * y + 1) * W + 2 * x, (2 * y + 1) * W + 2 * x + 1];
    for (let c = 0; c < 3; c++) frame[o + c] = (ps.reduce((t, p) => t + rgb[p * 3 + c], 0) / 4) | 0;
    const covered = ps.filter((p) => id[p] > 0).length;
    sil[o] = sil[o + 1] = sil[o + 2] = 255 - Math.round((covered / 4) * 255);
  }
  // lost outline marks, thick enough to see on the small sheet
  for (let p = 0; p < N; p++) if (lost[p]) {
    const x = ((p % W) / 2) | 0, y = ((p / W) / 2) | 0, col = lost[p] === 1 ? [255, 30, 30] : [255, 210, 0];
    for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) frame.set(col, (yy * w + xx) * 3);
  }
  const res = stats.map((s, i) => {
    if (s.area < MIN_AREA * N || s.bg < 20) return { id: cast[i], visible: s.area >= MIN_AREA * N, edge: null };
    s.bgDE.sort((a, b) => a - b);
    const pairs = Object.entries(s.pairs).map(([m, pr]) => ({ with: cast[m - 1], n: pr.n, blend: Math.round(100 * (1 - pr.clear / pr.n)) }));
    return { id: cast[i], visible: true, area: Math.round((1000 * s.area) / N) / 10, outline: s.bg + Object.values(s.pairs).reduce((t, pr) => t + pr.n, 0), edge: Math.round((100 * s.bgClear) / s.bg), value: Math.round((100 * s.bgValue) / s.bg), medianDE: Math.round(s.bgDE[s.bgDE.length >> 1] * 10) / 10, pairs };
  });
  // touching silhouettes: the shared outline as a share of the smaller character's whole outline (both directions counted)
  const touch = new Map();
  for (const r of res) for (const pr of r.pairs || []) touch.set(`${r.id}|${pr.with}`, pr);
  return { res, touch, cells: [frame, sil], w, h };
}

function main() {
  const o = args(), tmp = path.join(o.out, "stills");
  fs.rmSync(tmp, { recursive: true, force: true });
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, "engine", "render.mjs"), o.sb, "--stills", o.at, "--ids", "--out", tmp, ...o.pass], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) { console.error((r.stderr || r.stdout).slice(-2000)); process.exit(1); }
  const metas = fs.readdirSync(tmp).filter((f) => f.endsWith(".ids.json")).map((f) => ({ f, ...JSON.parse(fs.readFileSync(path.join(tmp, f), "utf8")) })).sort((a, b) => a.t - b.t);
  if (!metas.length) throw new Error("no stills were drawn");
  const sbId = JSON.parse(fs.readFileSync(path.resolve(ROOT, o.sb), "utf8")).id || path.basename(o.sb, ".json");
  const beats = [], warnings = [], cells = [], merges = {}, lows = {};
  for (const m of metas) {
    const still = path.join(tmp, m.f.replace(/\.ids\.json$/, ".png")), idsFile = path.join(tmp, m.f.replace(/\.json$/, ".png"));
    const b = measure(still, idsFile, m.cast);
    beats.push({ t: m.t, characters: b.res });
    cells.push(b.cells);
    for (const c of b.res) {
      if (c.edge != null && c.edge < EDGE_WARN) (lows[c.id] ??= []).push({ t: m.t, edge: c.edge, value: c.value });
      for (const pr of c.pairs || []) {
        const other = b.res.find((x) => x.id === pr.with), smaller = Math.min(c.outline || Infinity, other?.outline || Infinity);
        if (pr.n >= 30 && pr.blend >= BLEND_WARN) warnings.push({ t: m.t, check: "blend", msg: `${c.id} and ${pr.with} blend where they overlap at ${m.t.toFixed(2)} s (${pr.blend} % of the shared edge is the same colour)` });
        const share = Math.round((100 * pr.n) / smaller), key = `${c.id} and ${pr.with}`;
        if (share > MERGE_SHARE) (merges[key] ??= []).push({ t: m.t, share });
      }
    }
  }
  // one warning per character that melts into the set, with the beats where it does
  for (const [id, list] of Object.entries(lows)) {
    const worst = list.reduce((a, b) => (b.edge < a.edge ? b : a));
    warnings.unshift({ check: "edge", who: id, at: list.map((x) => x.t), msg: `${id} melts into the background at ${list.map((x) => x.t.toFixed(2)).join(", ")} s: at worst only ${worst.edge} % of its outline stands out, ${worst.value} % by brightness (${worst.t.toFixed(2)} s). A rim light, a lighter or darker wall behind it, or another colour there fixes it` });
  }
  // overlapping silhouettes are normal in a group shot, so one note per pair, with the beats where it happens
  const notes = Object.entries(merges).map(([pair, list]) => ({ check: "merge", pair, at: list.map((x) => x.t), msg: `${pair} are one silhouette at ${list.map((x) => x.t.toFixed(2)).join(", ")} s (up to ${Math.max(...list.map((x) => x.share))} % of the smaller outline shared): fine for a hug, a hide or someone behind; give them a gap where each pose must read` }));
  // per character: the worst beat (where it reads least)
  const ids = [...new Set(beats.flatMap((b) => b.characters.filter((c) => c.edge != null).map((c) => c.id)))];
  const summary = ids.map((id) => {
    const seen = beats.map((b) => ({ t: b.t, c: b.characters.find((c) => c.id === id) })).filter((x) => x.c && x.c.edge != null);
    const worst = seen.reduce((a, b) => (b.c.edge < a.c.edge ? b : a));
    return { id, beats: seen.length, meanEdge: Math.round(seen.reduce((t, x) => t + x.c.edge, 0) / seen.length), meanValue: Math.round(seen.reduce((t, x) => t + x.c.value, 0) / seen.length), worstEdge: worst.c.edge, worstAt: worst.t };
  });
  fs.mkdirSync(o.out, { recursive: true });
  const jsonFile = path.join(o.out, `${sbId}.json`), sheetFile = path.join(o.out, `${sbId}.png`);
  fs.writeFileSync(jsonFile, JSON.stringify({ storyboard: o.sb, summary, warnings, notes, beats }, null, 1));
  // the sheet: up to 6 beats a row, each as the marked frame above its silhouette
  const per = 6, rows = [];
  for (let i = 0; i < cells.length; i += per) { const chunk = cells.slice(i, i + per); rows.push(chunk.map((c) => c[0]), chunk.map((c) => c[1])); }
  const g = grid(rows, W / 2, H / 2);
  writePNG(sheetFile, g.rgb, g.w, g.h);
  if (o.json) { console.log(JSON.stringify({ summary, warnings, notes })); return; }
  console.log(`readability: ${metas.length} beats in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  for (const s of summary) console.log(`  ${s.id.padEnd(8)} outline stands out ${String(s.meanEdge).padStart(3)} % on average (${String(s.meanValue).padStart(3)} % by brightness alone), worst ${s.worstEdge} % at ${s.worstAt.toFixed(2)} s`);
  for (const w of warnings) console.log(`  warn ${w.check}: ${w.msg}`);
  for (const n of notes) console.log(`  note ${n.check}: ${n.msg}`);
  if (!warnings.length) console.log("  every character stands out from the set and from each other at every beat");
  console.log(`wrote ${path.relative(ROOT, sheetFile)} (red: outline lost against the set, yellow: two characters blend) and ${path.relative(ROOT, jsonFile)}`);
}

try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
