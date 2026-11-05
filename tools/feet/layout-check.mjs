// Checks a layout made with the planted gait against the plan (quality plan item 10): every frame where the plan says
// a foot stands (timeline.js footPhase) must show that foot still in the drawn rig, and every drawn foot that slides
// over 4 mm in a frame is listed with what the plan says it is doing (a low step, free with the body, or standing).
//   node tools/feet/layout-check.mjs <storyboard.json> <layout.json>
import fs from "node:fs";
import { footPhase } from "../../engine/page/timeline.js";
import { loadStoryboard } from "../../engine/load.mjs";
import { storyTime } from "../../engine/shared/holds.js";

const [file, lay] = process.argv.slice(2);
const sb = loadStoryboard(file), L = JSON.parse(fs.readFileSync(lay, "utf8")), C = L.contacts, fps = L.fps || 30;
const count = { stand: 0, step: 0, free: 0 }, worst = { stand: [], step: [], free: [] };
for (const c of sb.cast || []) for (let i = 1; i < C.length; i++) {
  const a = C[i - 1].actors.find((x) => x.id === c.id), b = C[i].actors.find((x) => x.id === c.id);
  if (!a?.w || !b?.w || a.on === 0 || b.on === 0) continue;
  const t0 = storyTime(sb.holds, (i - 1) / fps), t1 = storyTime(sb.holds, i / fps), p0 = footPhase(sb, c, t0), p1 = footPhase(sb, c, t1);
  for (const s of ["R", "L"]) {
    const k = `f${s}`; if (!a.w[k] || !b.w[k]) continue;
    const d = Math.hypot(b.w[k][0] - a.w[k][0], b.w[k][2] - a.w[k][2]);
    if (d <= 4) continue;
    const ph = p0[s] === "stand" && p1[s] === "stand" ? "stand" : p0[s] === "free" || p1[s] === "free" ? "free" : "step";
    count[ph]++; worst[ph].push([d, c.id, s, (i / fps).toFixed(2)]);
  }
}
for (const ph of ["stand", "step", "free"]) {
  const w = worst[ph].sort((x, y) => y[0] - x[0]).slice(0, 3).map(([d, id, s, t]) => `${id} ${s} ${t} s ${d.toFixed(0)} mm`).join(", ");
  console.log(`${ph}: ${count[ph]} frames with a foot moving over 4 mm${w ? ` (worst: ${w})` : ""}`);
}
