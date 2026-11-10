// Fingerprints for renders: what a picture depends on, so a shard from another render (other code, other storyboard,
// other flags) is refused at the stitch instead of being joined into the clip.
//
// engineHash(): the content of every file the page draws with (engine/page, engine/shared, characters, assets, the
// lockfile pinning three.js) and of render.mjs itself. Read from disk, not from git, so a dirty working tree, an
// untracked asset and a Windows checkout without git all count.
// renderFingerprint(): engineHash + the compiled storyboard (after style, music lock and speech) + every flag that
// changes pixels. Two renders with the same fingerprint draw the same frames.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// (until 5 Nov 2026 "models" was skipped too, which left assets/models, 119 glTF props and sets, out of the shard
// fingerprint: a shard drawn before a model edit would still join one drawn after it. Quality plan item 19.)
const SKIP = new Set(["node_modules", ".venv", "__pycache__", ".git"]);
export const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out); else if (e.isFile()) out.push(f);
  }
  return out;
}

let engineMemo = null;
export function engineHash() {
  if (engineMemo) return engineMemo;
  const files = ["engine/page", "engine/shared", "characters", "assets"].flatMap((d) => walk(path.join(ROOT, d), []));
  files.push(path.join(ROOT, "package-lock.json"), path.join(ROOT, "engine/render.mjs"));
  const h = crypto.createHash("sha256");
  for (const f of files) if (fs.existsSync(f)) h.update(path.relative(ROOT, f).replace(/\\/g, "/") + "\0" + sha(fs.readFileSync(f)) + "\n");
  return (engineMemo = h.digest("hex").slice(0, 20));
}

// the flags that change the picture (--out, --shard, --stitch, --timing-json and the like do not)
export const PIXEL_FLAGS = ["draft", "look", "style", "safe", "png", "blur", "blurSet", "gl", "from", "to"];
export function renderFingerprint(sb, o) {
  // the encoder's settings (render.mjs ENCODES) aren't in a frame's pixels, but shards joined into one clip must share them
  const flags = { ...Object.fromEntries(PIXEL_FLAGS.map((k) => [k, o[k] ?? null])), ...(o.encode ? { encode: o.encode } : {}) };
  return sha(JSON.stringify({ engine: engineHash(), sb, flags })).slice(0, 20);
}

// a shard's receipt, next to its video: which render it belongs to, which frames it holds, and the file's checksum
export const metaFile = (part) => part.replace(/\.video\.mp4$/, ".json");
export function writePartMeta(part, m) {
  fs.writeFileSync(metaFile(part), JSON.stringify({ ...m, bytes: fs.statSync(part).size, sha256: sha(fs.readFileSync(part)) }, null, 1));
}

// before the join: every shard belongs to this render, the ranges tile the clip without a gap or an overlap, each file
// is the one its shard wrote (checksum) and holds as many frames as its range. Returns the problems, [] when clean.
export function checkParts(parts, { fingerprint, frameA, frameB, countFrames }) {
  const bad = [], metas = [];
  for (const p of parts) {
    const mf = metaFile(p);
    if (!fs.existsSync(mf)) { bad.push(`${path.basename(p)}: no receipt (${path.basename(mf)}); it was drawn by an older render.mjs, draw it again`); continue; }
    const m = JSON.parse(fs.readFileSync(mf, "utf8"));
    if (m.fingerprint !== fingerprint) bad.push(`${path.basename(p)}: drawn for another render (fingerprint ${m.fingerprint}, this one ${fingerprint}): other code, storyboard or flags`);
    const buf = fs.readFileSync(p);
    if (sha(buf) !== m.sha256) bad.push(`${path.basename(p)}: the file changed after its shard wrote it (checksum differs)`);
    const n = countFrames(p);
    if (n !== m.b - m.a) bad.push(`${path.basename(p)}: holds ${n} frames, its range ${m.a}-${m.b - 1} needs ${m.b - m.a}`);
    metas.push(m);
  }
  if (!bad.length) {
    let at = frameA;
    for (const m of metas) { if (m.a !== at) bad.push(`shard ${m.shard}: starts at frame ${m.a}, the clip needs frame ${at} next (a gap or an overlap)`); at = m.b; }
    if (at !== frameB) bad.push(`the shards end at frame ${at}, the clip at ${frameB}`);
    const rs = [...new Set(metas.map((m) => m.renderer))];
    if (rs.length > 1) console.log(`note: the shards were drawn by ${rs.length} different renderers: ${rs.join(" | ")}`);
  }
  return bad;
}

// Frame cache (render.mjs, on by default for whole renders; --no-cache turns it off): every frame a render draws is
// kept as the exact image it piped into the encoder, under a key of everything that frame depends on, so the next
// render of the same clip draws only the frames an edit reached and an interrupted render resumes where it stopped.
//   key = the page's files (every file the render's page loaded, by content) + render.mjs + Chromium and its renderer
//         + the pixel flags + the characters + the storyboard minus its timeline + the frame number
//         + the frame's state digest (stage.js stateHash: what the timeline set at that frame and its blur samples)
// The timeline (actions, say lines, captions, effects; sound-only keys too) stays out of the whole-storyboard part, so
// an edit to one beat re-draws only the frames whose state it changed, and a sound-only edit re-draws nothing. Anything
// else in the storyboard (set, camera, shots, cast, look, focus track) is part of every key: change it and every frame
// is drawn again. Files are content-addressed (<key>.jpg|png); the oldest go first when the folder passes its limit.
export const TIMELINE_KEYS = ["actions", "say", "captions", "fx", "sfx", "music", "sound", "beats", "notes", "creative", "title", "idea", "hook"];
// What only the checks read (qa/, the contact gate) is in no key: the must-see lists, the panels file, the caption band
// and the gate version draw nothing, so an edit to them re-draws nothing (10 Nov 2026: one added waiver window re-drew
// 315 of 315 frames). allowClip is a check key too, but the contact solver also reads it (page/solve.js: a push the
// beat needs is left alone), which moves a pose; a moved pose is in that frame's state digest, so allowClip stays out
// of the whole-storyboard part like the timeline does (STATE_KEYS), and in it with the drawn look's smear.
export const CHECK_KEYS = ["visible", "panels", "captionBand", "gate"];
export const STATE_KEYS = ["allowClip"];
export class FrameCache {
  constructor(dir, limitGB) { this.dir = dir; this.limit = limitGB * 1e9; fs.mkdirSync(dir, { recursive: true }); this.stored = []; }
  file(key, ext) { return path.join(this.dir, `${key}.${ext}`); }
  get(key, ext) { const f = this.file(key, ext); if (!fs.existsSync(f)) return null; const now = new Date(); try { fs.utimesSync(f, now, now); } catch {} return fs.readFileSync(f); }
  has(key, ext) { return fs.existsSync(this.file(key, ext)); }
  put(key, ext, buf) {
    const f = this.file(key, ext), tmp = `${f}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, buf); fs.renameSync(tmp, f); this.stored.push(f);   // whole files only: a killed render leaves no half frame
  }
  drop(key, ext) { fs.rmSync(this.file(key, ext), { force: true }); }
  forgetStored() { for (const f of this.stored) fs.rmSync(f, { force: true }); const n = this.stored.length; this.stored = []; return n; }
  // the oldest frames go until the folder is under its limit
  prune() {
    const all = fs.readdirSync(this.dir).filter((f) => /\.(jpg|png)$/.test(f)).map((f) => { const p = path.join(this.dir, f), s = fs.statSync(p); return { p, size: s.size, t: s.mtimeMs }; });
    let total = all.reduce((m, x) => m + x.size, 0), gone = 0;
    if (total > this.limit) for (const x of all.sort((a, b) => a.t - b.t)) { if (total <= this.limit * 0.8) break; fs.rmSync(x.p, { force: true }); total -= x.size; gone++; }
    return { total, files: all.length - gone, gone };
  }
}

// the page's own code (engine/page, engine/shared): part of every key whether or not the page has asked for a file
// yet (the glove-mesh workers, mesh-pool.js, load their scripts only when the first frame is drawn)
export const pageCode = () => ["engine/page", "engine/shared"].flatMap((d) => walk(path.join(ROOT, d), []));
// the page's files by content: the render's HTTP server records every file the page asked for
const fileMemo = new Map();
export function filesHash(files) {
  const h = crypto.createHash("sha256");
  for (const f of [...files].sort()) {
    const s = fs.statSync(f), k = `${f}|${s.size}|${s.mtimeMs}`;
    if (!fileMemo.has(k)) fileMemo.set(k, sha(fs.readFileSync(f)));
    h.update(path.relative(ROOT, f).replace(/\\/g, "/") + "\0" + fileMemo.get(k) + "\n");
  }
  return h.digest("hex").slice(0, 20);
}
export const frameKey = (base, i, state, samples) => sha(JSON.stringify([base, i, state, samples])).slice(0, 32);

// how far two frame images are apart: the largest channel difference and how many pixels differ at all (decoded with
// ffmpeg, so a JPEG and a PNG compare the same way). A frame drawn alone and the same frame drawn in sequence can differ by
// a few levels at a few hundred pixels (GPU state the page carries from frame to frame, e.g. a shared eye-shading uniform
// between two copies of a character); a reused frame that is really stale (another expression, caption or flash) differs
// by far more. SAME_FRAME is the line between the two.
export const SAME_FRAME = { max: 24, share: 0.002 };
const decode = (buf) => spawnSync("ffmpeg", ["-loglevel", "error", "-i", "-", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { input: buf, maxBuffer: 1 << 26 }).stdout;
export function frameDiff(a, b) {
  if (a.equals(b)) return { max: 0, n: 0, share: 0 };
  const A = decode(a), B = decode(b);
  if (!A || !B || A.length !== B.length || !A.length) return { max: 255, n: Infinity, share: 1 };
  let max = 0, n = 0;
  for (let i = 0; i < A.length; i += 3) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d) { n++; if (d > max) max = d; } }
  return { max, n, share: n / (A.length / 3) };
}
