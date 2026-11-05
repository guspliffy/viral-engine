// count the layout-time check results per clip, before and after (hand-frame prototype); run from the worktree root
import fs from "node:fs";
import path from "node:path";
import { loadStoryboard } from "../../engine/load.mjs";
import { contactResults } from "../../qa/check.mjs";
const S = process.argv[2], sbs = process.argv.slice(3);
const tot = { before: {}, after: {} }, pops = { before: [], after: [] };
for (const sb of sbs) {
  const n = path.basename(sb, ".json"), story = loadStoryboard(sb), row = [n];
  for (const v of ["before", "after"]) {
    const dir = path.join(S, "lay", v, n);
    const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => x.endsWith(".layout.json"));
    if (!f) { row.push(`${v}: -`); continue; }
    const res = contactResults(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), story);
    const c = {}; for (const r of res) if (r.level !== "pass") { const k = `${r.level} ${r.check}`; c[k] = (c[k] || 0) + 1; tot[v][k] = (tot[v][k] || 0) + 1; }
    for (const r of res) if (r.check === "hand-pop") { const m = r.msg.match(/turns (\d+)° .* at ([\d.]+)s/); pops[v].push(`${n} ${r.msg.split(":")[0]} ${r.msg.match(/hand [RL]/)} ${m[1]}° @${m[2]}`); }
    row.push(`${v}: hand-pop ${c["warn hand-pop"] || 0}, fails ${Object.entries(c).filter(([k]) => k.startsWith("fail")).reduce((a, [, x]) => a + x, 0)}, warns ${Object.entries(c).filter(([k]) => k.startsWith("warn")).reduce((a, [, x]) => a + x, 0)}`);
  }
  console.log(row.join(" | "));
}
console.log("\nTOTALS");
for (const k of [...new Set([...Object.keys(tot.before), ...Object.keys(tot.after)])].sort()) console.log(`  ${k}: ${tot.before[k] || 0} -> ${tot.after[k] || 0}`);
fs.writeFileSync(path.join(S, "lay", "pops.json"), JSON.stringify(pops, null, 1));
