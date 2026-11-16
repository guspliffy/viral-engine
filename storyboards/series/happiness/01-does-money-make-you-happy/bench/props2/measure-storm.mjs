// Measures the notestorm against DESIGN 11.6's rules with the engine's own pure function (no render): per-second share of camera 09's pixels,
// the highest note on screen (% down; captions own the top 27 %), the nearest note to the sun's centre inside 40 m (disc radii), the notes in
// camera 10's frame and the nearest to his face. Run: node bench/props2/measure-storm.mjs  (from the repo root; prints a table)
import { stormTable, stormPose } from "../../../../../../engine/page/props-happy.js";
import { COAST } from "../../../../../../engine/page/set-coast.js";

const W = 1080, H = 1920, tb = stormTable({}), out = new Float32Array(8);
const look = (cam) => {   // a camera basis: right, up, forward
  const f = cam.look.map((v, i) => v - cam.pos[i]), fl = Math.hypot(...f), F = f.map((v) => v / fl);
  const R0 = [-F[2], 0, F[0]], rl = Math.hypot(...R0), R = R0.map((v) => v / rl), U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { F, R, U, pos: cam.pos, fpx: (H / 2) / Math.tan((cam.fov * Math.PI) / 360) };
};
const proj = (c, p) => { const v = p.map((x, i) => x - c.pos[i]), z = v[0] * c.F[0] + v[1] * c.F[1] + v[2] * c.F[2]; if (z < 0.05) return null; const x = (v[0] * c.R[0] + v[1] * c.R[1] + v[2] * c.R[2]) / z * c.fpx, y = (v[0] * c.U[0] + v[1] * c.U[1] + v[2] * c.U[2]) / z * c.fpx; return { x: W / 2 + x, y: H / 2 - y, z, d: Math.hypot(...v) }; };
const CLOSE = { pos: [0.55, 0.62, -3.4], look: [0.32, 0.55, 0], fov: 40 };   // DESIGN 11.6 shots: the close (not COAST.CAM.c10)
const C9 = look(COAST.CAM.c09), C10 = look(CLOSE), sun = COAST.SUN, DISC = 1.9;
const rows = [], GW = 270, GH = 480;
for (let tau = 0.2; tau <= 9.7; tau += 0.1) {
  const grid = new Uint8Array(GW * GH); const xs = []; let live = 0, area9 = 0, top9 = 1, minSun = 99, n10 = 0, minFace = 99, on9 = 0;
  for (let i = 0; i < tb.n; i++) {
    if (!stormPose(tb, i, tau, out)) continue; live++;
    const p = [out[0], out[1], out[2]], q = proj(C9, p);
    if (q && q.x > 0 && q.x < W && q.y > 0 && q.y < H) { on9++; xs.push(q.x); const ar = 0.02 * out[6] * out[6] * (C9.fpx / q.d) ** 2 * 0.62; area9 += ar; const rr = Math.sqrt(ar / Math.PI) / 4, cx = q.x / 4, cy = q.y / 4; for (let gy = Math.max(0, Math.floor(cy - rr)); gy <= Math.min(GH - 1, Math.ceil(cy + rr)); gy++) for (let gx = Math.max(0, Math.floor(cx - rr)); gx <= Math.min(GW - 1, Math.ceil(cx + rr)); gx++) if ((gx + 0.5 - cx) ** 2 + (gy + 0.5 - cy) ** 2 <= Math.max(rr * rr, 0.3)) grid[gy * GW + gx] = 1; top9 = Math.min(top9, q.y / H); }
    if (q && q.d < 40) { const v = p.map((x, k) => x - COAST.CAM.c09.pos[k]), ang = (Math.acos(Math.min(1, (v[0] * sun[0] + v[1] * sun[1] + v[2] * sun[2]) / q.d)) * 180) / Math.PI; minSun = Math.min(minSun, ang / DISC); }
    const r = proj(C10, p); if (r && r.x > 0 && r.x < W && r.y > 0 && r.y < H) n10++;
    minFace = Math.min(minFace, Math.hypot(p[0], p[1] - 0.62, p[2]));
  }
  xs.sort((a, b) => a - b); const wid = xs.length > 20 ? (xs[Math.floor(xs.length * 0.95)] - xs[Math.floor(xs.length * 0.05)]) / W * 100 : 0;
  rows.push({ wid: +wid.toFixed(0), tau: +tau.toFixed(1), live, on9, pct9: +(100 * grid.reduce((a, b) => a + b, 0) / (GW * GH)).toFixed(1), top9: +(100 * top9).toFixed(1), minSun: +minSun.toFixed(2), n10, minFace: +minFace.toFixed(2) });
}
console.log("tau  wid%  live on09  %cover09  topY%  sunRadii(<40m)  n10  minFace");
for (const r of rows) if (Math.round(r.tau * 10) % 5 === 0) console.log(String(r.tau).padStart(4), String(r.wid).padStart(5), String(r.live).padStart(4), String(r.on9).padStart(5), String(r.pct9).padStart(6), String(r.top9).padStart(6), String(r.minSun).padStart(10), String(r.n10).padStart(8), String(r.minFace).padStart(8));
const mx = (k) => Math.max(...rows.map((r) => r[k])), mn = (k) => Math.min(...rows.map((r) => r[k]));
console.log(`widest ${mx('wid')} % of the width (5-95 percentile); max live ${mx("live")}  max cover09  ${mx("pct9")} %  highest note ${mn("top9")} % down  nearest to sun (<40 m) ${mn("minSun")} radii (rule >= 1.5)`);
const c10 = rows.filter((r) => r.tau >= 3.3 && r.tau <= 6.5); console.log(`camera 10 window tau 3.3-6.5: max notes in frame ${Math.max(...c10.map((r) => r.n10))}, nearest to his face ${Math.min(...c10.map((r) => r.minFace))} m`);
