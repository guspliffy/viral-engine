// the layout-time check results of one or more layouts: node tools/arm-probe/checks.mjs <sb> <layout> [<layout> ...]
// (prints every warning and fail per layout, then the counts side by side)
import fs from "node:fs";
import { loadStoryboard } from "../../engine/load.mjs";
import { contactResults } from "../../qa/check.mjs";
const [sb, ...lays] = process.argv.slice(2), story = loadStoryboard(sb), counts = [];
for (const f of lays) {
  const res = contactResults(JSON.parse(fs.readFileSync(f, "utf8")), story).filter((r) => r.level !== "pass"), c = {};
  console.log(`\n${f}`);
  for (const r of res) { c[`${r.level} ${r.check}`] = (c[`${r.level} ${r.check}`] || 0) + 1; if (!process.env.QUIET) console.log(`  ${r.level} ${r.check}: ${r.msg.slice(0, 200)}`); }
  counts.push(c);
}
console.log("\nCOUNTS");
for (const k of [...new Set(counts.flatMap((c) => Object.keys(c)))].sort()) console.log(`  ${k}: ${counts.map((c) => c[k] || 0).join(" -> ")}`);
