// each hand pop with how far the hand moved (relative to its shoulder) in the frames around it: a hand that jumps
// 15 cm or more in a frame is the storyboard's move, not the rig's turn. node tools/arm-probe/pop-speed.mjs <sb> <layout>
import fs from "node:fs";
import { loadStoryboard } from "../../engine/load.mjs";
import { contactResults } from "../../qa/check.mjs";
const [sb, lay] = process.argv.slice(2), L = JSON.parse(fs.readFileSync(lay, "utf8")), C = L.contacts;
for (const r of contactResults(L, loadStoryboard(sb))) {
  if (r.check !== "hand-pop") continue;
  const m = r.msg.match(/^(\w+): hand ([RL]) turns (\d+)° .* at ([\d.]+)s/); if (!m) continue;
  const [, who, s, deg, t] = m, i = C.findIndex((x) => Math.abs(x.t - +t) < 0.005);
  const sp = (j) => { const a = C[j]?.actors.find((x) => x.id === who)?.dbg?.[s]?.s, b = C[j - 1]?.actors.find((x) => x.id === who)?.dbg?.[s]?.s; return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100 : NaN; };
  const d = C[i]?.actors.find((x) => x.id === who)?.dbg?.[s] || {};
  console.log(`${who} ${s} ${deg}° @${t}: hand moved ${[sp(i - 1), sp(i), sp(i + 1)].map((v) => v.toFixed(0)).join(" / ")} cm per frame${d.lim ? `, wrist ${d.lim}` : ""}${d.pal ? `, palm ${d.pal}` : ""}${d.w ? `, fist ${d.w}` : ""}`);
}
