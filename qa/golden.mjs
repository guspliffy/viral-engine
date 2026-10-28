#!/usr/bin/env node
// Golden stills: a dozen approved frames (qa/golden/golden.json) drawn again after every engine change and compared
// pixel by pixel with the approved copies, so a change to a model, a material, the light or the camera can't alter
// the look of finished clips without anyone noticing.
//
//   node qa/golden.mjs                         -> renders all stills, compares, writes out/golden/sheet.png; exit 1 on a change
//   node qa/golden.mjs --only space-cover,wizard-teacup
//   node qa/golden.mjs --update                -> the new renders become the approved stills (only after Jonny OK'd the look)
//   node qa/golden.mjs --update space-cover    -> refresh only these
//   node qa/golden.mjs --tol 24 --area 0.002   -> a pixel counts as changed when a channel moves more than 24 of 255;
//                                                 a still fails when more than 0.002 % of its pixels changed (10 px
//                                                 at half size: a catch light 20 % smaller in every eye is 0.008 %)
//
// The stills are kept at half size (540 x 960) to keep the repo small; the full frame is drawn and scaled down, so a
// change of a few pixels on a glint still shows. Renders are deterministic, so on one machine an unchanged engine gives
// 0 changed pixels; the tolerance absorbs the small differences between machines and Chromium builds. Real speech is
// off for these renders (SPEECH=off), so a line's length doesn't depend on whether the voice model is set up.
// The sheet shows each changed still as approved | new | difference (changed pixels in red over a grey copy), then
// approved | new zoomed in on the box around the changes.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRGB, writePNG, grid } from "./pixels.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "qa", "golden"), W = 540, H = 960;

function args() {
  const a = process.argv.slice(2), o = { only: null, update: null, tol: 24, area: 0.002, out: path.join(ROOT, "out", "golden") };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--only") o.only = a[++i].split(",");
    else if (a[i] === "--update") { o.update = true; if (a[i + 1] && !a[i + 1].startsWith("--")) o.only = a[++i].split(","); }
    else if (a[i] === "--tol") o.tol = Number(a[++i]);
    else if (a[i] === "--area") o.area = Number(a[++i]);
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else { console.error("usage: node qa/golden.mjs [--only a,b] [--update [a,b]] [--tol 24] [--area 0.1] [--out dir]"); process.exit(2); }
  }
  return o;
}

// draws the stills, one render.mjs run per storyboard and look (a browser start costs more than a still)
function render(stills, out) {
  const groups = new Map();
  for (const s of stills) { const k = `${s.sb}|${s.look || ""}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
  let n = 0;
  for (const [k, list] of groups) {
    const [sb, look] = k.split("|"), dir = path.join(out, "render", String(n++));
    fs.rmSync(dir, { recursive: true, force: true });
    const argv = [path.join(ROOT, "engine", "render.mjs"), sb, "--stills", list.map((s) => s.t).join(","), "--out", dir, ...(look ? ["--look", look] : [])];
    // speech off: the gibberish voice's timing, the same on every machine, voice model or not
    const r = spawnSync(process.execPath, argv, { cwd: ROOT, encoding: "utf8", env: { ...process.env, SPEECH: "off" } });
    if (r.status !== 0) throw new Error(`render failed for ${sb}:\n${(r.stderr || r.stdout).slice(-2000)}`);
    const files = fs.readdirSync(dir);
    for (const s of list) {
      const f = files.find((x) => x.endsWith(`-t${s.t.toFixed(2)}.png`));
      if (!f) throw new Error(`no still at ${s.t} s from ${sb}`);
      s.file = path.join(dir, f);
    }
  }
}

function compare(a, b, tol) {
  const diff = Buffer.alloc(W * H * 3);
  let changed = 0, sum = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0, p = 0; p < W * H; p++, i += 3) {
    const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
    sum += d;
    const g = Math.round((b[i] * 0.3 + b[i + 1] * 0.59 + b[i + 2] * 0.11) * 0.45);
    if (d > tol) {
      changed++; diff[i] = 255; diff[i + 1] = 40; diff[i + 2] = 40;
      const x = p % W, y = (p / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    } else diff[i] = diff[i + 1] = diff[i + 2] = g;
  }
  // the box around the changes, in full-size output pixels, so it can be found in a 1080 x 1920 frame
  const box = changed ? [x0 * 2, y0 * 2, (x1 - x0 + 1) * 2, (y1 - y0 + 1) * 2] : null;
  return { pct: (changed / (W * H)) * 100, mean: sum / (W * H), box, half: changed ? [x0, y0, x1, y1] : null, diff };
}

// a w x h cell from the region around box [x0, y0, x1, y1] (half-size pixels), same aspect, nearest pixel
function zoom(img, box, w, h) {
  const pad = 16, bw = box[2] - box[0] + 1 + 2 * pad, bh = box[3] - box[1] + 1 + 2 * pad;
  let cw = Math.max(bw, (bh * w) / h, 60), ch = (cw * h) / w;
  cw = Math.min(cw, W); ch = Math.min(ch, H);
  const cx = Math.min(Math.max((box[0] + box[2]) / 2 - cw / 2, 0), W - cw), cy = Math.min(Math.max((box[1] + box[3]) / 2 - ch / 2, 0), H - ch);
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.floor(cx + (x * cw) / w), sy = Math.floor(cy + (y * ch) / h), i = (sy * W + sx) * 3; out[(y * w + x) * 3] = img[i]; out[(y * w + x) * 3 + 1] = img[i + 1]; out[(y * w + x) * 3 + 2] = img[i + 2]; }
  return out;
}

function main() {
  const o = args(), list = JSON.parse(fs.readFileSync(path.join(DIR, "golden.json"), "utf8")).stills;
  const stills = o.only ? list.filter((s) => o.only.includes(s.name)) : list;
  if (o.only && stills.length !== o.only.length) throw new Error(`unknown still: ${o.only.filter((n) => !list.some((s) => s.name === n)).join(", ")}`);
  fs.mkdirSync(o.out, { recursive: true });
  const t0 = Date.now();
  render(stills, o.out);
  console.log(`golden: drew ${stills.length} stills in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  if (o.update) {
    for (const s of stills) writePNG(path.join(DIR, `${s.name}.png`), readRGB(s.file, W, H), W, H);
    console.log(`golden: updated ${stills.map((s) => s.name).join(", ")} in qa/golden/`);
    return;
  }
  const rows = [], res = [];
  for (const s of stills) {
    const ref = path.join(DIR, `${s.name}.png`), now = readRGB(s.file, W, H);
    if (!fs.existsSync(ref)) { res.push({ name: s.name, level: "fail", msg: "no approved still yet (node qa/golden.mjs --update " + s.name + ")" }); continue; }
    const old = readRGB(ref, W, H), c = compare(old, now, o.tol);
    const level = c.pct > o.area ? "fail" : "pass";
    res.push({ name: s.name, level, pct: c.pct, mean: c.mean, box: c.box, msg: `${c.pct.toFixed(3)} % of pixels changed (mean ${c.mean.toFixed(2)})${c.box ? `, inside x ${c.box[0]} y ${c.box[1]} w ${c.box[2]} h ${c.box[3]}` : ""}` });
    if (level === "fail") rows.push({ cells: [old, now, c.diff], old, now, half: c.half });
  }
  for (const r of res) console.log(`  ${r.level === "pass" ? "same   " : "CHANGED"} ${r.name}: ${r.msg}`);
  fs.writeFileSync(path.join(o.out, "golden.json"), JSON.stringify(res.map(({ name, level, pct, mean, box, msg }) => ({ name, level, pct, mean, box, msg })), null, 1));
  const sheet = path.join(o.out, "sheet.png");
  fs.rmSync(sheet, { force: true });
  if (rows.length) {
    // each changed still: approved | new | difference, at a third of full size so the sheet stays small
    const s = (img) => { const k = 3, w = W * 2 / k, h = H * 2 / k, out = Buffer.alloc(w * h * 3); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img.copy(out, (y * w + x) * 3, (Math.floor(y * H / h) * W + Math.floor(x * W / w)) * 3, (Math.floor(y * H / h) * W + Math.floor(x * W / w)) * 3 + 3); return out; };
    const cw = W * 2 / 3, ch = H * 2 / 3;
    const g = grid(rows.map((r) => [...r.cells.map(s), zoom(r.old, r.half, cw, ch), zoom(r.now, r.half, cw, ch)]), cw, ch);
    writePNG(sheet, g.rgb, g.w, g.h);
    console.log(`golden: ${rows.length} of ${stills.length} stills changed: approved | new | difference | zoomed approved | zoomed new in ${path.relative(ROOT, sheet)}`);
    console.log("golden: if Jonny approves the new look, run node qa/golden.mjs --update <names> and commit qa/golden/");
    process.exitCode = 1;
  } else console.log(`golden: all ${stills.length} stills unchanged`);
}

try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
