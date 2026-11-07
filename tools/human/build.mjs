// Builds a human character's body for rig "human-v1": meshes every part of the design (tools/human/design-*.mjs) once
// with surface nets in the skeleton's rest pose, weights every vertex to the bones of the shapes it lies on (a soft
// share by distance, at most 4 bones), and writes assets/models/characters/<name>.json for the page
// (engine/page/rigs/human.js). Pure and deterministic: the same design gives the same file.
//   node tools/human/build.mjs design-01 human-01
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { partField, partBounds, mesh, prep, sd } from "../../engine/page/rigs/human-sdf.js";
import { skeleton } from "../../engine/page/rigs/human-skel.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [designName = "design-01", outName = "human-01"] = process.argv.slice(2);
const D = await import(`./${designName}.mjs`);
const BONE = skeleton().map((b) => b.name), BI = Object.fromEntries(BONE.map((n, i) => [n, i]));
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString("base64");
const parts = [];
let tris = 0;
for (const part of D.PARTS) {
  const t0 = Date.now(), f = partField(part), m = mesh(f, partBounds(part, part.h * 3), part.h);
  const nv = m.pos.length / 3, skinI = new Uint16Array(nv * 4), skinW = new Float32Array(nv * 4);
  const S = part.shapes.map(prep).filter((s) => s.bone && (!s.op || s.op === "add"));
  const soft = part.soft ?? 0.012;
  for (let v = 0; v < nv; v++) {
    const x = m.pos[3 * v], y = m.pos[3 * v + 1], z = m.pos[3 * v + 2], acc = {};
    const ds = S.map((s) => sd(s, x, y, z)), dmin = Math.min(...ds);
    S.forEach((s, i) => { const w = Math.exp(-(ds[i] - dmin) / soft); if (w > 1e-3) acc[s.bone] = (acc[s.bone] || 0) + w; });
    const top = Object.entries(acc).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 4), sum = top.reduce((a, [, w]) => a + w, 0);
    top.forEach(([b, w], k) => { if (!(b in BI)) throw new Error(`unknown bone ${b}`); skinI[4 * v + k] = BI[b]; skinW[4 * v + k] = w / sum; });
  }
  const idx = nv > 65535 ? new Uint32Array(m.idx) : new Uint16Array(m.idx);
  tris += m.idx.length / 3;
  parts.push({ name: part.name, role: part.role, color: part.color, n: nv, wide: nv > 65535,
    pos: b64(new Float32Array(m.pos)), nrm: b64(new Float32Array(m.nrm)), idx: b64(idx), skinI: b64(skinI), skinW: b64(skinW) });
  console.log(`${part.name}: ${nv} verts, ${m.idx.length / 3} tris, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
const out = path.join(ROOT, "assets/models/characters", `${outName}.json`);
fs.writeFileSync(out, JSON.stringify({ name: outName, design: designName, bones: BONE, faceShapes: D.FACE_SHAPES, headCentre: D.HEAD_CENTRE, colors: D.COLORS, parts }));
console.log(`${out}: ${tris} triangles, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
