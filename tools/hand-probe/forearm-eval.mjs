// offline: how often the forearm direction turns > 40 / 60 deg in one frame, for candidate forearm formulas
// node forearm-eval.mjs <tagdir> <sb...>   (run from the repo root)
import fs from "node:fs";
import path from "node:path";
import { loadStoryboard } from "../../engine/load.mjs";
import { cutIn } from "../../qa/rig.mjs";
import { storyTime } from "../../engine/shared/holds.js";
const V = { add: (a, b, k = 1) => a.map((v, i) => v + k * b[i]), len: (a) => Math.hypot(...a), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] };
const ss = (v) => { const w = Math.min(1, Math.max(0, v)); return w * w * (3 - 2 * w); };
const unit = (a) => { const l = V.len(a); return l > 1e-9 ? a.map((v) => v / l) : [0, -1, 0]; };
const F = {
  today: (a, s) => a,
  plan14: (a, s) => V.add(a, unit(s), 0.15 * ss((0.14 - V.len(a)) / 0.1)),
  chord3: (a, s) => V.add(a, s, 1 / 3),
  chord6: (a, s) => V.add(a, s, 1 / 6),
  chord10: (a, s) => V.add(a, s, 1 / 10),
  unitmix: (a, s) => { const k = ss((0.16 - V.len(a)) / 0.12); return V.add(unit(a).map((v) => v * (1 - k)), unit(s), k); },
  floor8: (a, s) => V.add(a, unit(s), Math.max(0, 0.08 - V.len(a))),
};
const [dir, ...sbs] = process.argv.slice(2), tot = {};
for (const sbf of sbs) {
  const n = path.basename(sbf, ".json"), d = path.join(dir, n), f = fs.readdirSync(d).find((x) => x.endsWith(".layout.json"));
  const L = JSON.parse(fs.readFileSync(path.join(d, f), "utf8")), sb = loadStoryboard(sbf), fps = L.fps || 30, C = L.contacts, row = {};
  for (let i = 1; i < C.length; i++) {
    if (cutIn(sb, storyTime(sb.holds, (i - 1) / fps), storyTime(sb.holds, i / fps))) continue;
    for (const b of C[i].actors) { const p = C[i - 1].actors.find((x) => x.id === b.id); if (!p) continue;
      for (const s of ["R", "L"]) { const P = p.dbg?.[s], Q = b.dbg?.[s]; if (!P?.a || !Q?.a || !P.s || !Q.s) continue;
        for (const [k, fn] of Object.entries(F)) { const y0 = unit(fn(P.a, P.s)), y1 = unit(fn(Q.a, Q.s)), ang = (Math.acos(Math.max(-1, Math.min(1, V.dot(y0, y1)))) * 180) / Math.PI;
          row[k] ??= [0, 0]; if (ang > 40) row[k][0]++; if (ang > 60) row[k][1]++; } } } }
  console.log(n.padEnd(24), Object.entries(row).map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join("  "));
  for (const [k, v] of Object.entries(row)) { tot[k] ??= [0, 0]; tot[k][0] += v[0]; tot[k][1] += v[1]; }
}
console.log("TOTAL (>40 / >60 deg)".padEnd(24), Object.entries(tot).map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join("  "));
