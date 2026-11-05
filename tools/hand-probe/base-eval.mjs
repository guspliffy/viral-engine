// offline: hand base frame turn per frame (forearm = hand - pull point), look-at vs swing variants, frames with no turn on
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { loadStoryboard } from "../../engine/load.mjs";
import { cutIn } from "../../qa/rig.mjs";
import { storyTime } from "../../engine/shared/holds.js";
const basis = (y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
const lookat = (y, sx) => { const z = new THREE.Vector3(-sx, 0, 0.35).normalize(); z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); return basis(y, z.normalize()); };
const swing = (y0) => (y, sx) => { const Y0 = y0(sx), z0 = new THREE.Vector3(-sx, 0, 0.35).normalize(); z0.addScaledVector(Y0, -z0.dot(Y0)).normalize(); return basis(Y0, z0).premultiply(new THREE.Quaternion().setFromUnitVectors(Y0, y)); };
const fam = (deg) => swing((sx) => { const f = new THREE.Vector3(0.35 * sx, 0, 1).normalize(), t = (deg * Math.PI) / 180; return f.multiplyScalar(Math.cos(t)).add(new THREE.Vector3(0, -Math.sin(t), 0)).normalize(); });
const F = { lookat, swing0: fam(0), swingUp45: fam(-45) };
const ang = (a, b) => (2 * Math.acos(Math.min(1, Math.abs(a.dot(b)))) * 180) / Math.PI;
const [dir, ...sbs] = process.argv.slice(2), tot = {};
for (const sbf of sbs) {
  const n = path.basename(sbf, ".json"), d = path.join(dir, n), f = fs.readdirSync(d).find((x) => x.endsWith(".layout.json"));
  const L = JSON.parse(fs.readFileSync(path.join(d, f), "utf8")), sb = loadStoryboard(sbf), fps = L.fps || 30, C = L.contacts, row = {};
  for (let i = 1; i < C.length; i++) {
    if (cutIn(sb, storyTime(sb.holds, (i - 1) / fps), storyTime(sb.holds, i / fps))) continue;
    for (const b of C[i].actors) { const p = C[i - 1].actors.find((x) => x.id === b.id); if (!p) continue;
      for (const s of ["R", "L"]) { const P = p.dbg?.[s], Q = b.dbg?.[s]; if (!P?.a || !Q?.a) continue;
        const free = !["w", "pal", "fr", "up", "dn"].some((k) => P[k] > 0 || Q[k] > 0), sx = s === "R" ? -1 : 1;
        const ya = new THREE.Vector3(...P.a).normalize(), yb = new THREE.Vector3(...Q.a).normalize();
        for (const [k, fn] of Object.entries(F)) { const d = ang(fn(ya, sx), fn(yb, sx)); row[k] ??= [0, 0, 0]; if (d > 60) { row[k][0]++; if (free) row[k][1]++; } if (d > 90) row[k][2]++; } } } }
  console.log(n.padEnd(24), Object.entries(row).map(([k, v]) => `${k} ${v.join("/")}`).join("  "));
  for (const [k, v] of Object.entries(row)) { tot[k] ??= [0, 0, 0]; v.forEach((x, j) => (tot[k][j] += x)); }
}
console.log("TOTAL >60 / >60 free / >90".padEnd(24), Object.entries(tot).map(([k, v]) => `${k} ${v.join("/")}`).join("  "));
