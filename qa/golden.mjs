#!/usr/bin/env node
// Golden stills: a dozen approved frames (qa/golden/golden.json: clip, time, look) drawn with the engine as it is now
// and with the engine on main, on the same machine, and compared pixel by pixel. A change to a model, a material, the
// light or the camera can't alter the look of finished clips without anyone noticing.
//
//   node qa/golden.mjs                         -> compares with origin/main, writes out/golden/sheet.png; exit 1 on a change
//   node qa/golden.mjs --base main             -> compares with another commit or branch
//   node qa/golden.mjs --only space-cover,wizard-teacup
//   node qa/golden.mjs --no-motion             -> the stills only, without the motion strips
//   node qa/golden.mjs --ssim 0.995            -> a motion strip fails when a frame's SSIM to main is under this
//   node qa/golden.mjs --tol 24 --area 0.002   -> a pixel counts as changed when a channel moves more than 24 of 255;
//                                                 a still fails when more than 0.002 % of its pixels changed (10 px
//                                                 at half size: a catch light 20 % smaller in every eye is 0.008 %)
//
// Why main and not stored pictures: SwiftShader draws a few highlights a hair differently on different CPUs (a GitHub
// runner against this container: a belt light, a glint), as big as the changes worth catching. On one machine renders
// are exact, so main and the change are both drawn here: an unchanged engine gives 0 changed pixels. What is merged to
// main is what Jonny approved. Main's stills are kept in out/golden/base-<commit>/, so only the first run per commit
// draws them twice (about 2.5 minutes each). The working tree is drawn as it is, uncommitted changes included.
// Real speech is off for these renders (SPEECH=off), so a line's length doesn't depend on the voice model.
// The sheet shows each changed still as main | now | difference (changed pixels in red over a grey copy), then
// main | now zoomed in on the box around the changes.
//
// Motion goldens (quality plan item 15 (b), 5 Nov 2026): golden.json's "motion" list draws 12 frames in a row of a
// regress fixture's key move (a walk, a turn, a pick-up, a hug, a blink), cropped to its box, with main and now, and
// compares them frame by frame by SSIM (8 x 8 blocks on the grey picture). A change in timing, an arc or a one-frame pop
// shows there even when each still alone would pass. A changed strip is drawn as out/golden/<name>.png: main,
// now and the difference, frame by frame.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRGB, writePNG, grid } from "./pixels.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "qa", "golden"), W = 540, H = 960;

function args() {
  const a = process.argv.slice(2), o = { only: null, base: "origin/main", tol: 24, area: 0.002, ssim: 0.995, motion: true, out: path.join(ROOT, "out", "golden") };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--only") o.only = a[++i].split(",");
    else if (a[i] === "--base") o.base = a[++i];
    else if (a[i] === "--tol") o.tol = Number(a[++i]);
    else if (a[i] === "--area") o.area = Number(a[++i]);
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--ssim") o.ssim = Number(a[++i]);
    else if (a[i] === "--no-motion") o.motion = false;
    else { console.error("usage: node qa/golden.mjs [--base origin/main] [--only a,b] [--tol 24] [--area 0.002] [--ssim 0.995] [--no-motion] [--out dir]"); process.exit(2); }
  }
  return o;
}

const git = (...argv) => { const r = spawnSync("git", argv, { cwd: ROOT, encoding: "utf8" }); if (r.status !== 0) throw new Error(`git ${argv.join(" ")}: ${r.stderr.trim()}`); return r.stdout.trim(); };

// draws the stills with the engine in tree, one render.mjs run per storyboard and look (a browser start costs more
// than a still), and keeps each at half size as dir/<name>.png
function render(tree, stills, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const groups = new Map();
  for (const s of stills) { const k = `${s.sb}|${s.look || ""}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
  let n = 0;
  for (const [k, list] of groups) {
    const [sb, look] = k.split("|"), tmp = path.join(dir, "render", String(n++));
    if (!fs.existsSync(path.join(tree, sb))) { for (const s of list) s.missing = true; continue; }
    fs.rmSync(tmp, { recursive: true, force: true });
    const argv = [path.join(tree, "engine", "render.mjs"), sb, "--stills", list.map((s) => s.t).join(","), "--out", tmp, ...(look ? ["--look", look] : [])];
    const r = spawnSync(process.execPath, argv, { cwd: tree, encoding: "utf8", env: { ...process.env, SPEECH: "off" } });
    if (r.status !== 0) throw new Error(`render failed for ${sb} in ${tree}:\n${(r.stderr || r.stdout).slice(-2000)}`);
    const files = fs.readdirSync(tmp);
    for (const s of list) {
      const f = files.find((x) => x.endsWith(`-t${s.t.toFixed(2)}.png`));
      if (!f) throw new Error(`no still at ${s.t} s from ${sb}`);
      writePNG(path.join(dir, `${s.name}.png`), readRGB(path.join(tmp, f), W, H), W, H);
    }
  }
  fs.rmSync(path.join(dir, "render"), { recursive: true, force: true });
}

// main's stills, from a temporary worktree of that commit (sharing this checkout's node_modules); kept per commit
function renderBase(sha, stills, out) {
  const dir = path.join(out, `base-${sha.slice(0, 12)}`), todo = stills.filter((s) => !fs.existsSync(path.join(dir, `${s.name}.png`)));
  if (!todo.length) return dir;
  const tree = path.join(out, `tree-${sha.slice(0, 12)}`);
  if (!fs.existsSync(tree)) git("worktree", "add", "--detach", "--force", tree, sha);
  try {
    if (!fs.existsSync(path.join(tree, "node_modules"))) fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(tree, "node_modules"), "junction");
    render(tree, todo, dir);
  } finally {
    git("worktree", "remove", "--force", tree);
  }
  return dir;
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

// SSIM of two grey crops (Wang et al. 2004) over 8 x 8 blocks, 1 = the same picture
function ssim(a, b, w, h) {
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  let sum = 0, n = 0;
  for (let by = 0; by + 8 <= h; by += 8) for (let bx = 0; bx + 8 <= w; bx += 8) {
    let ma = 0, mb = 0;
    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) { ma += a[y * w + x]; mb += b[y * w + x]; }
    ma /= 64; mb /= 64;
    let va = 0, vb = 0, cv = 0;
    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) { const da = a[y * w + x] - ma, db = b[y * w + x] - mb; va += da * da; vb += db * db; cv += da * db; }
    va /= 63; vb /= 63; cv /= 63;
    sum += ((2 * ma * mb + C1) * (2 * cv + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2)); n++;
  }
  return n ? sum / n : 1;
}

// the half-size picture's crop of box (full-size px) as RGB and as grey
function crop(img, box) {
  const x0 = Math.max(0, Math.round(box[0] / 2)), y0 = Math.max(0, Math.round(box[1] / 2));
  const w = Math.min(W - x0, Math.round(box[2] / 2)), h = Math.min(H - y0, Math.round(box[3] / 2));
  const rgb = Buffer.alloc(w * h * 3), grey = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y0 + y) * W + x0 + x) * 3, j = y * w + x;
    rgb[j * 3] = img[i]; rgb[j * 3 + 1] = img[i + 1]; rgb[j * 3 + 2] = img[i + 2];
    grey[j] = img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114;
  }
  return { rgb, grey, w, h };
}

function main() {
  const o = args(), G = JSON.parse(fs.readFileSync(path.join(DIR, "golden.json"), "utf8")), list = G.stills, mlist = o.motion ? G.motion || [] : [];
  const stills = o.only ? list.filter((s) => o.only.includes(s.name)) : list, motion = o.only ? mlist.filter((m) => o.only.includes(m.name)) : mlist;
  if (o.only && stills.length + motion.length !== o.only.length) throw new Error(`unknown still: ${o.only.filter((n) => !list.some((s) => s.name === n) && !mlist.some((m) => m.name === n)).join(", ")}`);
  // every frame of a motion strip is a still of its own: <name>~00 .. ~11, one frame (1/30 s) apart
  const frames = motion.flatMap((m) => Array.from({ length: m.frames ?? 12 }, (_, k) => ({ name: `${m.name}~${String(k).padStart(2, "0")}`, sb: m.sb, look: m.look, t: Math.round((m.from + k / 30) * 1e4) / 1e4 })));
  const sha = git("rev-parse", `${o.base}^{commit}`), label = `${o.base} (${sha.slice(0, 7)})`;
  fs.mkdirSync(o.out, { recursive: true });
  const t0 = Date.now();
  const baseDir = renderBase(sha, [...stills, ...frames].map((s) => ({ ...s })), o.out), nowDir = path.join(o.out, "now");
  fs.rmSync(nowDir, { recursive: true, force: true });
  render(ROOT, [...stills, ...frames], nowDir);
  console.log(`golden: drew ${stills.length} stills and ${motion.length} motion strips (${frames.length} frames) against ${label} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  const rows = [], res = [];
  for (const s of stills) {
    const ref = path.join(baseDir, `${s.name}.png`), cur = path.join(nowDir, `${s.name}.png`);
    if (!fs.existsSync(cur)) throw new Error(`${s.name}: ${s.sb} not found`);
    if (!fs.existsSync(ref)) { res.push({ name: s.name, level: "new", msg: `not on ${o.base} yet (new storyboard): nothing to compare` }); continue; }
    const old = readRGB(ref, W, H), now = readRGB(cur, W, H), c = compare(old, now, o.tol);
    const level = c.pct > o.area ? "fail" : "pass";
    res.push({ name: s.name, level, pct: c.pct, mean: c.mean, box: c.box, msg: `${c.pct.toFixed(3)} % of pixels changed (mean ${c.mean.toFixed(2)})${c.box ? `, inside x ${c.box[0]} y ${c.box[1]} w ${c.box[2]} h ${c.box[3]}` : ""}` });
    if (level === "fail") rows.push({ cells: [old, now, c.diff], old, now, half: c.half });
  }
  // motion strips: SSIM frame by frame against main
  for (const m of motion) {
    const fr = frames.filter((f) => f.name.startsWith(`${m.name}~`)), at = (d, f) => path.join(d, `${f.name}.png`);
    if (fr.some((f) => !fs.existsSync(at(baseDir, f)))) { res.push({ name: m.name, level: "new", msg: `not on ${o.base} yet (new fixture): nothing to compare` }); continue; }
    const pairs = fr.map((f) => [crop(readRGB(at(baseDir, f), W, H), m.box), crop(readRGB(at(nowDir, f), W, H), m.box)]);
    const sc = pairs.map(([a, b]) => ssim(a.grey, b.grey, a.w, a.h)), worst = Math.min(...sc), k = sc.indexOf(worst);
    const level = worst < o.ssim ? "fail" : "pass";
    res.push({ name: m.name, level, ssim: worst, msg: `lowest SSIM ${worst.toFixed(4)} (frame ${k}, ${fr[k].t.toFixed(3)} s) over ${fr.length} frames` });
    if (level === "fail") {
      // main, now and the difference (changed pixels bright), each frame at 120 px wide
      const { w, h } = pairs[0][0], cw = 120, ch = Math.round((h * cw) / w), fit = (rgb) => { const out = Buffer.alloc(cw * ch * 3); for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = (Math.floor((y * h) / ch) * w + Math.floor((x * w) / cw)) * 3; out[(y * cw + x) * 3] = rgb[i]; out[(y * cw + x) * 3 + 1] = rgb[i + 1]; out[(y * cw + x) * 3 + 2] = rgb[i + 2]; } return out; };
      const diff = ([a, b]) => { const d = Buffer.alloc(a.rgb.length); for (let i = 0; i < d.length; i += 3) { const v = Math.max(Math.abs(a.rgb[i] - b.rgb[i]), Math.abs(a.rgb[i + 1] - b.rgb[i + 1]), Math.abs(a.rgb[i + 2] - b.rgb[i + 2])); d[i] = v > o.tol ? 255 : a.grey[i / 3] * 0.4; d[i + 1] = v > o.tol ? 40 : a.grey[i / 3] * 0.4; d[i + 2] = v > o.tol ? 40 : a.grey[i / 3] * 0.4; } return d; };
      const g = grid([pairs.map((p) => fit(p[0].rgb)), pairs.map((p) => fit(p[1].rgb)), pairs.map((p) => fit(diff(p)))], cw, ch, 4);
      const file = path.join(o.out, `${m.name}.png`);
      writePNG(file, g.rgb, g.w, g.h);
      console.log(`golden: ${m.name} changed: main | now | difference, frame by frame, in ${path.relative(ROOT, file)}`);
      process.exitCode = 1;
    }
  }
  for (const r of res) console.log(`  ${r.level === "pass" ? "same   " : r.level === "new" ? "new    " : "CHANGED"} ${r.name}: ${r.msg}`);
  fs.writeFileSync(path.join(o.out, "golden.json"), JSON.stringify({ base: label, stills: res.map(({ name, level, pct, mean, box, ssim, msg }) => ({ name, level, pct, mean, box, ssim, msg })) }, null, 1));
  const sheet = path.join(o.out, "sheet.png");
  fs.rmSync(sheet, { force: true });
  if (rows.length) {
    // each changed still: main | now | difference, at a third of full size so the sheet stays small, then zoomed
    const s = (img) => { const k = 3, w = W * 2 / k, h = H * 2 / k, out = Buffer.alloc(w * h * 3); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img.copy(out, (y * w + x) * 3, (Math.floor(y * H / h) * W + Math.floor(x * W / w)) * 3, (Math.floor(y * H / h) * W + Math.floor(x * W / w)) * 3 + 3); return out; };
    const cw = W * 2 / 3, ch = H * 2 / 3;
    const g = grid(rows.map((r) => [...r.cells.map(s), zoom(r.old, r.half, cw, ch), zoom(r.now, r.half, cw, ch)]), cw, ch);
    writePNG(sheet, g.rgb, g.w, g.h);
    console.log(`golden: ${rows.length} of ${stills.length} stills changed against ${label}: main | now | difference | zoomed main | zoomed now in ${path.relative(ROOT, sheet)}`);
    console.log("golden: a change you meant goes to Jonny with this sheet; merging it to main makes it the new golden look");
    process.exitCode = 1;
  } else if (!process.exitCode) console.log(`golden: all ${stills.length} stills${motion.length ? ` and ${motion.length} motion strips` : ""} unchanged against ${label}`);
}

try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
