// sort each hand pop (world turn > 60 deg in a frame) by its cause, from the layout's dbg record of the hand frame
import fs from "node:fs";
import { loadStoryboard } from "../../engine/load.mjs";
import { cutIn } from "../../qa/rig.mjs";
import { storyTime } from "../../engine/shared/holds.js";
const turn = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return (2 * Math.acos(Math.min(1, d)) * 180) / Math.PI; };
const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;
const eff = (d) => (d?.pal ? d.pal[2] : 0), tot = {}, rows = [];
for (let k = 2; k < process.argv.length; k += 2) {
  const L = JSON.parse(fs.readFileSync(process.argv[k], "utf8")), sb = loadStoryboard(process.argv[k + 1]), fps = L.fps || 30, C = L.contacts;
  for (let i = 1; i < C.length; i++) for (const b of C[i].actors) {
    const a = C[i - 1].actors.find((x) => x.id === b.id); if (!a || cutIn(sb, storyTime(sb.holds, (i - 1) / fps), storyTime(sb.holds, i / fps))) continue;
    for (const s of ["R", "L"]) {
      const d = turn(a.q[s], b.q[s]); if (d <= 60) continue;
      const p = a.dbg?.[s], q = b.dbg?.[s]; if (!p || !q) continue;
      const dy = ang(p.y, q.y), why = [];
      if (i === 1) why.push("first frame");
      if (Math.abs(eff(p) - eff(q)) > 0.3) why.push("palm turn switches");
      if (Math.abs((p.w || 0) - (q.w || 0)) > 0.3) why.push("fist turn switches");
      if (Math.abs((p.up || 0) - (q.up || 0)) > 0.3 || Math.abs((p.dn || 0) - (q.dn || 0)) > 0.3 || Math.abs((p.fr || 0) - (q.fr || 0)) > 0.3) why.push("cupped/paw/locked turn switches");
      if (dy > 25 && Math.min(p.yl, q.yl) < 0.14) why.push("forearm collapses");
      else if (dy > 25) why.push("forearm jumps");
      if (Math.min(p.cond, q.cond) < 0.15 && dy <= 25) why.push("look-at spin");
      if (!why.length) why.push("other (body turn, smaller causes)");
      rows.push(`${process.argv[k + 1].split("/").pop()} ${b.id} ${s} ${Math.round(d)}° @${(i / fps).toFixed(2)}: ${why.join(" + ")} (forearm ${Math.round(Math.min(p.yl, q.yl) * 100)} cm, turns ${Math.round(dy)}°)`);
      const main = why[0]; tot[main] = (tot[main] || 0) + 1;
    }
  }
}
console.log(rows.join("\n")); console.log("\nMAIN CAUSE", JSON.stringify(tot, null, 1), "of", rows.length);
