// A CMU motion-capture take -> a clip the human rig plays (engine/page/rigs/human.js): every bone's turn relative to
// its parent as a quaternion, plus the root's position, resampled to `fps`. The rig's skeleton has the take's own
// rest directions (the database's T pose), so a turn plays on it as it is: no retargeting by intent, the person's
// real motion. Pure and deterministic.
//   node tools/human/clip.mjs <take.asf> <take.amc> <out.json> --from 0 --to 4.5 [--fps 60] [--source "CMU 143_32"]
// Data: http://mocap.cs.cmu.edu/ ("free for all uses"). Credit: "The data used in this project was obtained from
// mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217."
import fs from "node:fs";
import { readAsf, readAmc, pose } from "../mocap/asf-amc.mjs";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const [asf, amc, out] = args;
const sk = readAsf(fs.readFileSync(asf, "utf8")), frames = readAmc(fs.readFileSync(amc, "utf8"));
const SRC = 120, fps = Number(opt("fps", 60)), from = Number(opt("from", 0)), to = Math.min(Number(opt("to", frames.length / SRC)), (frames.length - 1) / SRC);

// row-major 3x3 -> quaternion [x, y, z, w]
function quat(m) {
  const [a, b, c, d, e, f, g, h, i] = m, tr = a + e + i;
  let x, y, z, w;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (h - f) * s; y = (c - g) * s; z = (d - b) * s; }
  else if (a > e && a > i) { const s = 2 * Math.sqrt(1 + a - e - i); w = (h - f) / s; x = 0.25 * s; y = (b + d) / s; z = (c + g) / s; }
  else if (e > i) { const s = 2 * Math.sqrt(1 + e - a - i); w = (c - g) / s; x = (b + d) / s; y = 0.25 * s; z = (f + h) / s; }
  else { const s = 2 * Math.sqrt(1 + i - a - e); w = (d - b) / s; x = (c + g) / s; y = (f + h) / s; z = 0.25 * s; }
  return [x, y, z, w];
}
const tr = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const mul = (a, b) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; };
const parent = {}; for (const [p, cs] of Object.entries(sk.children)) for (const c of cs) parent[c] = p;
const bones = ["root", ...Object.keys(sk.bones).filter((b) => sk.bones[b].dof.length)];
const r4 = (v) => Math.round(v * 1e4) / 1e4;
// a frame between two recorded ones: the joint values interpolated (the angles are small steps at 120 fps)
const at = (s) => { const f = s * SRC, i = Math.min(frames.length - 2, Math.floor(f)), k = f - i, A = frames[i], B = frames[i + 1], o = {}; for (const n in A) o[n] = A[n].map((v, j) => v + (B[n][j] - v) * k); return o; };
const n = Math.floor((to - from) * fps) + 1, root = [], q = Object.fromEntries(bones.map((b) => [b, []]));
let prev = {};
for (let i = 0; i < n; i++) {
  const { pos, rot } = pose(sk, at(from + i / fps));
  root.push(pos.root.map(r4));
  for (const b of bones) {
    const local = b === "root" ? rot.root : mul(tr(rot[parent[b]]), rot[b]);
    let v = quat(local);
    // keep each track on one hemisphere so a slerp between frames never takes the long way round
    if (prev[b] && v[0] * prev[b][0] + v[1] * prev[b][1] + v[2] * prev[b][2] + v[3] * prev[b][3] < 0) v = v.map((x) => -x);
    prev[b] = v; q[b].push(...v.map(r4));
  }
}
const lens = Object.fromEntries(Object.entries(sk.bones).map(([k, b]) => [k, r4(b.lenM)]));
fs.writeFileSync(out, JSON.stringify({ name: opt("name", out.replace(/.*\//, "").replace(/\.json$/, "")), source: opt("source", amc.replace(/.*\//, "")),
  credit: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.",
  fps, len: r4((n - 1) / fps), lens, bones, root, q }));
console.log(`${out}: ${n} frames, ${((n - 1) / fps).toFixed(2)} s, ${bones.length} bones`);
