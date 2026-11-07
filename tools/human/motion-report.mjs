// The human character against the real actor and the research numbers, per shot, from one layout pass:
//   node engine/render.mjs <diag sb> --layout --skip-gate > log        (cast "diagJoints" and "diagFeet" on)
//   node tools/human/motion-report.mjs <log> <storyboard.json> [--json]
// Per shot: pelvis bob (cm, actor | character), step width (ankle centres across the hips, min and mean, cm), the
// smallest elbow bend (deg), hip pops (frames where the character's hips move over 2 cm more in one frame than the
// actor's), the planted heel and ball slide (cm, under 6 mm over the floor in two frames running, skate.mjs's rule),
// and once seated the knee over the hip joint (cm) and the thigh slope (deg). Targets (research report
// /mnt/project-files/research/human-character-02/): walk bob 4-5.5 cm (actor's own is the reference here), step width
// 10-11 +-3 cm with the feet never crossing (min over 5 cm), elbows never straight (min about 10), seated thigh within
// +-5 degrees of level on an ordinary chair, planted feet still (1 cm or less per plant). (human motion v5, 7 Nov 2026)
import fs from "node:fs";
const [logF, sbF] = process.argv.slice(2), asJson = process.argv.includes("--json");
const lines = fs.readFileSync(logF, "utf8").split("\n");
const J = new Map(), Fe = new Map();
for (const l of lines) {
  const i = l.indexOf("diag:joints "); if (i >= 0) { const o = JSON.parse(l.slice(i + 12)); J.set(+o.t.toFixed(4), o); continue; }
  const k = l.indexOf("diag:feet "); if (k >= 0) { const p = l.slice(k).split(/\s+/), t = +(+p[1].slice(2)).toFixed(4), n = (j) => [+p[j], +p[j + 1], +p[j + 2]]; Fe.set(t, { L: { a: n(3), b: n(6) }, R: { a: n(10), b: n(13) } }); }
}
const sb = JSON.parse(fs.readFileSync(sbF, "utf8")), shots = (sb.beats || []).map((b) => ({ name: b.name, a: b.at, b: b.at + b.len }));
const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), len = (a) => Math.hypot(...a);
const deg = (r) => (r * 180) / Math.PI, ang = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(a, b) / len(a) / len(b)))));
const hipY = (P) => (P.lhipjoint[1] + P.rhipjoint[1]) / 2;
const width = (P) => { const ax = [P.lhipjoint[0] - P.rhipjoint[0], P.lhipjoint[2] - P.rhipjoint[2]], n = Math.hypot(...ax); return Math.abs(((P.ltibia[0] - P.rtibia[0]) * ax[0] + (P.ltibia[2] - P.rtibia[2]) * ax[1]) / n); };
const elbow = (P) => Math.min(...["l", "r"].map((s) => 180 - ang(sub(P[`${s}clavicle`], P[`${s}humerus`]), sub(P[`${s}radius`], P[`${s}humerus`]))));
const r1 = (x) => +x.toFixed(1);
const ts = [...J.keys()].sort((a, b) => a - b), ft = [...Fe.keys()].sort((a, b) => a - b);
const floor = {}; for (const S of ["L", "R"]) for (const k of ["a", "b"]) { const ys = ft.map((t) => Fe.get(t)[S][k][1]).sort((x, y) => x - y); floor[S + k] = ys[Math.floor(ys.length * 0.03)] ?? 0; }
const out = [];
for (const sh of shots) {
  const T = ts.filter((t) => t >= sh.a && t < sh.b - 1e-6); if (!T.length) continue;
  const row = { shot: sh.name };
  for (const [w, k] of [["A", "actor"], ["C", "char"]]) {
    const H = T.map((t) => hipY(J.get(t)[w])), W = T.map((t) => width(J.get(t)[w]));
    row[`bob_${k}`] = r1((Math.max(...H) - Math.min(...H)) * 100);
    row[`widthMin_${k}`] = r1(Math.min(...W) * 100); row[`widthMean_${k}`] = r1((W.reduce((a, b) => a + b, 0) / W.length) * 100);
    row[`elbowMin_${k}`] = r1(Math.min(...T.map((t) => elbow(J.get(t)[w]))));
  }
  let pops = 0, worst = 0;
  for (let i = 1; i < T.length; i++) {
    if (Math.abs(T[i] - T[i - 1] - 1 / 30) > 0.005) continue;
    const d = Math.abs(hipY(J.get(T[i]).C) - hipY(J.get(T[i - 1]).C)) - Math.abs(hipY(J.get(T[i]).A) - hipY(J.get(T[i - 1]).A));
    if (d > 0.02) pops++; worst = Math.max(worst, d);
  }
  row.hipPops = pops; row.hipPopWorst = r1(worst * 100);
  const F = ft.filter((t) => t >= sh.a && t < sh.b - 1e-6);
  for (const S of ["L", "R"]) for (const k of ["a", "b"]) {
    let s = 0, run = 0, wr = 0; const base = floor[S + k];
    for (let i = 1; i < F.length; i++) { const p = Fe.get(F[i - 1])[S][k], q = Fe.get(F[i])[S][k]; if (p[1] < base + 0.006 && q[1] < base + 0.006) { const d = Math.hypot(q[0] - p[0], q[2] - p[2]); s += d; run += d; wr = Math.max(wr, run); } else run = 0; }
    row[`slide_${S}${k === "a" ? "heel" : "ball"}`] = r1(s * 100); row[`slideWorst_${S}${k === "a" ? "heel" : "ball"}`] = r1(wr * 100);
  }
  // seated: the last frame of the shot
  const P = J.get(T[T.length - 1]).C, kh = ["l", "r"].map((s) => (P[`${s}femur`][1] - P[`${s}hipjoint`][1]) * 100), sl = ["l", "r"].map((s) => { const v = sub(P[`${s}femur`], P[`${s}hipjoint`]); return deg(Math.atan2(v[1], Math.hypot(v[0], v[2]))); });
  if (hipY(P) < 0.65) { row.seatedKneeOverHip = r1(Math.max(...kh)); row.seatedThigh = r1(Math.max(...sl)); }
  out.push(row);
}
if (asJson) console.log(JSON.stringify(out, null, 1)); else for (const o of out) { const { shot, ...rest } = o; console.log(shot, JSON.stringify(rest)); }
