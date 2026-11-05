// for each hand pop (world hand turn > 60 deg between two frames), print what the hand frame did on both frames
import fs from "node:fs";
import { loadStoryboard } from "../../engine/load.mjs";
import { cutIn } from "../../qa/rig.mjs";
import { storyTime } from "../../engine/shared/holds.js";
const [lay, sbf] = process.argv.slice(2), L = JSON.parse(fs.readFileSync(lay, "utf8")), sb = loadStoryboard(sbf), fps = L.fps || 30;
const turn = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return (2 * Math.acos(Math.min(1, d)) * 180) / Math.PI; };
const rows = L.contacts;
for (let i = 1; i < rows.length; i++) for (const b of rows[i].actors) {
  const a = rows[i - 1].actors.find((x) => x.id === b.id); if (!a || cutIn(sb, storyTime(sb.holds, (i - 1) / fps), storyTime(sb.holds, i / fps))) continue;
  for (const s of ["R", "L"]) {
    const d = turn(a.q[s], b.q[s]); if (d <= 60) continue;
    console.log(`${b.id} ${s} ${Math.round(d)}deg @${(i / fps).toFixed(2)}s`);
    console.log(`   prev ${JSON.stringify(a.dbg?.[s])}`);
    console.log(`   this ${JSON.stringify(b.dbg?.[s])}`);
  }
}
