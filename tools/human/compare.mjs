// Actor vs character, frame by frame: reads diag:joints lines (cast "diagJoints") and prints, per shot, the angles
// that make a body read as human: knee and hip flexion, trunk lean, knees-out spread, shoulder slope (neck base to the
// shoulder joint, + = shoulder above the neck base), shoulder height under the head.
//   node tools/human/compare.mjs <joints.jsonl> <storyboard.json> [--json]
import fs from "node:fs";
import { squatMetrics } from "./squat-ref.mjs";
const [file, sbFile] = process.argv.slice(2), asJson = process.argv.includes("--json");
const rows = new Map();
for (const l of fs.readFileSync(file, "utf8").split("\n")) { if (!l.trim()) continue; const o = JSON.parse(l); rows.set(o.t, o); }
const sb = JSON.parse(fs.readFileSync(sbFile, "utf8"));
const shots = (sb.beats || []).map((b) => ({ name: b.name, a: b.at, b: b.at + b.len }));
const sub = (a, b) => a.map((v, i) => v - b[i]), horiz = (v) => Math.hypot(v[0], v[2]);
const shoulder = (J) => ["l", "r"].map((s) => { const v = sub(J[`${s}clavicle`], J.thorax); return Math.atan2(v[1], horiz(v)) * 180 / Math.PI; });
const drop = (J) => { const hn = J.head[1] - J.thorax[1]; return ["l", "r"].map((s) => (J.head[1] - J[`${s}clavicle`][1]) / Math.max(0.01, hn)); };
const out = [];
for (const sh of shots) {
  const R = [...rows.values()].filter((o) => o.t >= sh.a && o.t < sh.b && o.A.thorax);
  if (!R.length) continue;
  const agg = (who) => {
    const M = R.map((o) => ({ m: squatMetrics(o[who]), s: shoulder(o[who]), d: drop(o[who]), t: o.t }));
    const mean = (f) => M.reduce((a, x) => a + f(x), 0) / M.length;
    const deep = M.reduce((a, x) => (x.m.hipY < a.m.hipY ? x : a));
    return { slope: +mean((x) => (x.s[0] + x.s[1]) / 2).toFixed(1), headToShoulder: +mean((x) => (x.d[0] + x.d[1]) / 2).toFixed(2),
      deepT: deep.t, deepKnee: +deep.m.kneeFlex.toFixed(0), deepHip: +deep.m.hipFlex.toFixed(0), deepTrunk: +deep.m.trunkLean.toFixed(0), deepSpread: +deep.m.kneeSpread.toFixed(2), deepHipOverKnee: +((deep.m.hipY - deep.m.kneeY) * 100).toFixed(0) };
  };
  out.push({ shot: sh.name, actor: agg("A"), char: agg("C") });
}
if (asJson) console.log(JSON.stringify(out, null, 1));
else for (const o of out) { console.log(o.shot); console.table({ actor: o.actor, char: o.char }); }
