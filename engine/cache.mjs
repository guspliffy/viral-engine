// Fingerprints for renders: what a picture depends on, so a shard from another render (other code, other storyboard,
// other flags) is refused at the stitch instead of being joined into the clip.
//
// engineHash(): the content of every file the page draws with (engine/page, engine/shared, characters, assets, the
// lockfile pinning three.js) and of render.mjs itself. Read from disk, not from git, so a dirty working tree, an
// untracked asset and a Windows checkout without git all count.
// renderFingerprint(): engineHash + the compiled storyboard (after style, music lock and speech) + every flag that
// changes pixels. Two renders with the same fingerprint draw the same frames.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".venv", "models", "__pycache__", ".git"]);
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
  const flags = Object.fromEntries(PIXEL_FLAGS.map((k) => [k, o[k] ?? null]));
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
