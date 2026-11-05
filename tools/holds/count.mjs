// Holds 2 (quality plan item 7): count the held-prop checks on layout passes, before against after.
//   node tools/holds/count.mjs <beforeDir> <afterDir> <storyboard>...
// Each dir holds <id>*.layout.json from `node engine/render.mjs <sb> --layout --out <dir>` (the after pass of a copy with
// "rig": { "hold": 2 }). Prints per clip: hand-in-prop (warn/fail), prop-pop, and the layout's support states (after).
import fs from "node:fs";
import path from "node:path";
import { loadStoryboard } from "../../engine/load.mjs";
import { contactResults } from "../../qa/check.mjs";
const [B, A, ...sbs] = process.argv.slice(2);
const KEYS = ["hand-in-prop", "arm-in-prop", "prop-pop", "clipping", "reach", "rig-jump"];
const find = (dir, id) => { const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => x.startsWith(id) && x.endsWith(".layout.json")); return f ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : null; };
const tot = {};
for (const file of sbs) {
  const sb = loadStoryboard(file), id = sb.id, row = [id.padEnd(30)];
  for (const [v, dir] of [["before", B], ["after", A]]) {
    const L = find(dir, id) || find(dir, `${id}-h2`); if (!L) { row.push(`${v} -`); continue; }
    const res = contactResults(L, sb).filter((r) => r.level !== "pass");
    const c = {}; for (const r of res) { const k = `${r.level} ${r.check}`; c[k] = (c[k] || 0) + 1; tot[`${k}|${v}`] = (tot[`${k}|${v}`] || 0) + 1; }
    row.push(`${v}: ` + KEYS.map((k) => `${k} ${c[`fail ${k}`] || 0}/${c[`warn ${k}`] || 0}`).join(", "));
    if (v === "after") {
      const s = {}; for (const smp of L.samples) for (const p of smp.props) if (p.support) { const k = p.support.state; s[k] = (s[k] || 0) + 1; }
      const un = new Map(); for (const smp of L.samples) for (const p of smp.props) if (p.support?.state === "unsupported") un.set(p.id, Math.max(un.get(p.id) || 0, p.support.gap));
      row.push(`support ${JSON.stringify(s)}${un.size ? ` unsupported: ${[...un].map(([k, g]) => `${k} ${g}mm`).join(", ")}` : ""}`);
    }
  }
  console.log(row.join("\n   "));
}
console.log("\nTOTALS (fail/warn counts, before -> after)");
const ks = [...new Set(Object.keys(tot).map((k) => k.split("|")[0]))].sort();
for (const k of ks) console.log(`  ${k}: ${tot[`${k}|before`] || 0} -> ${tot[`${k}|after`] || 0}`);
