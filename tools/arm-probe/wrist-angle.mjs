// the angle between two layouts' forearms (dbg.a: hand minus the arm's pull point), per hand and frame, for free hands
// (no fist, palm or frame weight): how far the wrist would bend if the hand kept one forearm and the arm drew the other
// node tools/arm-probe/wrist-angle.mjs <layoutA> <layoutB>
import fs from "node:fs";
const [A, B] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")).contacts);
const ang = (u, v) => { const d = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / Math.hypot(...u) / Math.hypot(...v); return (Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI; };
const all = [];
for (let i = 0; i < Math.min(A.length, B.length); i++) for (const a of A[i].actors) { const b = B[i].actors.find((x) => x.id === a.id); if (!b) continue;
  for (const s of ["R", "L"]) { const p = a.dbg?.[s], q = b.dbg?.[s]; if (!p?.a || !q?.a || p.w || p.pal || p.fr) continue; all.push([ang(p.a, q.a), A[i].t, a.id, s]); } }
all.sort((x, y) => x[0] - y[0]);
const pc = (k) => all[Math.floor((all.length - 1) * k)]?.[0].toFixed(0);
console.log(`n ${all.length}  median ${pc(0.5)}  p90 ${pc(0.9)}  p99 ${pc(0.99)}  max ${pc(1)}  over 45: ${all.filter((x) => x[0] > 45).length}`);
for (const x of all.slice(-5)) console.log(`  ${x[0].toFixed(0)} deg ${x[2]} ${x[3]} @${x[1].toFixed(2)}`);
