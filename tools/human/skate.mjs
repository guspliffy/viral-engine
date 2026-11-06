// Foot sliding, measured: reads the "diag:feet" lines a render or layout pass prints (cast "diagFeet": true) and, for
// each foot, finds the frames its heel (ankle) or ball (toe joint) is down (under 6 mm over its lowest height) in two
// frames running, and adds up how far it moved across the floor between them. A planted foot should not move at all.
//   node engine/render.mjs <sb> --layout --skip-gate | node tools/human/skate.mjs [--json out.json] [--cuts 1.2,3.4]
import fs from "node:fs";
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null; };
const cuts = (opt("cuts") || "").split(",").filter(Boolean).map(Number);
const rows = fs.readFileSync(0, "utf8").split("\n").filter((l) => l.startsWith("diag:feet")).map((l) => {
  const p = l.split(/\s+/), t = +p[1].slice(2), n = (i) => [+p[i], +p[i + 1], +p[i + 2]];
  return { t, L: { a: n(3), b: n(6) }, R: { a: n(10), b: n(13) } };
}).sort((x, y) => x.t - y.t).filter((r, i, A) => i === 0 || r.t !== A[i - 1].t);
const shot = (t) => cuts.filter((c) => c <= t + 1e-6).length;
const out = {};
for (const S of ["L", "R"]) for (const k of ["a", "b"]) {
  const ys = rows.map((r) => r[S][k][1]).sort((x, y) => x - y), base = ys[Math.floor(ys.length * 0.03)] ?? 0;
  let slide = 0, frames = 0, worst = 0, run = 0, under = 0;
  for (let i = 1; i < rows.length; i++) {
    const p = rows[i - 1][S][k], q = rows[i][S][k];
    under = Math.min(under, q[1]);
    if (p[1] < base + 0.006 && q[1] < base + 0.006 && shot(rows[i - 1].t) === shot(rows[i].t)) { const d = Math.hypot(q[0] - p[0], q[2] - p[2]); slide += d; frames++; run += d; worst = Math.max(worst, run); }
    else run = 0;
  }
  const dt = rows.length > 1 ? (rows[rows.length - 1].t - rows[0].t) / (rows.length - 1) : 1 / 30;
  out[`${S}.${k === "a" ? "heel" : "ball"}`] = { downS: +(frames * dt).toFixed(2), slideCm: +(slide * 100).toFixed(1), cmPerS: frames ? +((slide * 100) / (frames * dt)).toFixed(1) : 0, worstSpanCm: +(worst * 100).toFixed(1), lowestY: +ys[0].toFixed(3), floorY: +base.toFixed(3) };
}
console.log(JSON.stringify(out, null, 1));
if (opt("json")) fs.writeFileSync(opt("json"), JSON.stringify(out, null, 1));
