// Motion layer probe (quality plan items 8, 9, 12): lays out a storyboard's motion straight from the timeline (no
// browser, seconds) with flags added on top, and prints what the layer does: the largest hand lag and body overlap,
// the synchrony number (the share of starts and stops where an actor's body and both hands start or stop within one
// frame of each other: lower is less robotic), and the frozen share (frames where nothing on an actor moves more than
// 2 mm or 0.3 degrees, as qa/pace.py reads stillness).
// Hands are measured in the body's own frame for the synchrony and frozen numbers.
//   node tools/motion/probe.mjs <storyboard.json> [--overlap] [--timing] [--solve] [--fps 30] [--csv out.csv]
import fs from "node:fs";
import { actorState } from "../../engine/page/timeline.js";
import { handTarget } from "../../engine/page/potato.js";
import { loadStoryboard, loadCharacters } from "../../engine/load.mjs";

const args = process.argv.slice(2), file = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
const sb = loadStoryboard(file), defs = loadCharacters(sb);
const add = {};
for (const k of ["overlap", "timing", "solve"]) if (args.includes(`--${k}`)) add[k] = true;
if (Object.keys(add).length) sb.motion = { ...(typeof sb.motion === "object" ? sb.motion : sb.motion ? {} : { gait: false, arcs: false, lead: false, turn: false, sit: false, jiggle: false }), ...add };
const fps = Number(args[args.indexOf("--fps") + 1]) || sb.fps || 30, N = Math.round((sb.storyDuration ?? sb.duration ?? 10) * fps);
const rows = [];
let lagMax = 0, lagAt = "", sync = 0, events = 0, frozen = 0, frames = 0;
for (const c of sb.cast || []) {
  const def = defs[c.character]; if (!def?.body) continue;
  const rx = def.body.width / 2, H = def.body.height, F = [];
  for (let i = 0; i <= N; i++) {
    const t = i / fps, st = actorState(sb, c, def, t), cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), sc = st.scale ?? 1;
    // each hand in the world: its target in the body's frame (plus the layer's nudge), turned by the body's yaw only
    const loc = {}, hand = (s, sx) => { const a = st.arms[s], f = handTarget(a.from, sx, rx, H, t), g = handTarget(a.pose, sx, rx, H, t), n = a.nudge || [0, 0, 0]; const l = f.map((v, j) => v + (g[j] - v) * a.p + n[j]); loc[s] = l; return [st.x + sc * (l[0] * cy + l[2] * sy), st.y + sc * l[1], st.z + sc * (-l[0] * sy + l[2] * cy)]; };
    const R = hand("R", -1), L = hand("L", 1);
    for (const s of ["R", "L"]) { const n = st.arms[s].nudge; if (n) { const m = Math.hypot(...n); if (m > lagMax) { lagMax = m; lagAt = `${c.id} ${s} ${t.toFixed(2)} s`; } } }
    F.push({ t, b: [st.x, st.y, st.z], r: [st.yaw, st.pitch || 0, st.lean || 0], R, L, lR: loc.R, lL: loc.L });
    rows.push([c.id, t.toFixed(3), st.x.toFixed(4), st.z.toFixed(4), st.yaw.toFixed(4), (st.pitch || 0).toFixed(4), (st.lean || 0).toFixed(4), ...R.map((v) => v.toFixed(4)), ...L.map((v) => v.toFixed(4))].join(","));
  }
  // motion per frame for three parts: the body (position + turn), each hand
  const sp = (k) => F.map((f, i) => (i ? (k === "b" ? Math.hypot(...f.b.map((v, j) => v - F[i - 1].b[j])) + 0.3 * Math.hypot(...f.r.map((v, j) => v - F[i - 1].r[j])) : Math.hypot(...f[k].map((v, j) => v - F[i - 1][k][j]))) : 0));
  const parts = { b: sp("b"), R: sp("lR"), L: sp("lL") };   // hands in the body's own frame: how the arm moves, not where the body carries it
  // starts and stops: speed crossing 3 mm/frame
  const edges = Object.fromEntries(Object.entries(parts).map(([k, v]) => { const e = []; for (let i = 1; i < v.length; i++) { const m0 = v[i - 1] > 0.003, m1 = v[i] > 0.003; if (m0 !== m1) e.push({ i, on: m1 }); } return [k, e]; }));
  if (args.includes("--edges")) for (const [k, list] of Object.entries(edges)) console.log(c.id, k, list.map((e) => `${e.on ? "+" : "-"}${(e.i / fps).toFixed(2)}`).join(" "));
  for (const [k, list] of Object.entries(edges)) for (const e of list) {
    events++;
    const others = Object.entries(edges).filter(([kk]) => kk !== k);
    if (others.some(([, l]) => l.some((o) => o.on === e.on && Math.abs(o.i - e.i) <= 1))) sync++;
  }
  for (let i = 1; i < F.length; i++) { frames++; if (parts.b[i] < 0.002 && parts.R[i] < 0.002 && parts.L[i] < 0.002 && Math.abs(F[i].r[0] - F[i - 1].r[0]) < 0.005) frozen++; }
}
console.log(`${sb.id}: hand lag max ${(lagMax * 100).toFixed(1)} cm (${lagAt}); synchrony ${events ? ((100 * sync) / events).toFixed(0) : 0} % of ${events} starts and stops; frozen ${frames ? ((100 * frozen) / frames).toFixed(1) : 0} %`);
const ci = args.indexOf("--csv");
if (ci >= 0) fs.writeFileSync(args[ci + 1], "id,t,x,z,yaw,pitch,lean,rx,ry,rz,lx,ly,lz\n" + rows.join("\n") + "\n");
