// Deep-squat reference from several real people (CMU mocap): joint angles at each take's deepest frame.
//   node tools/human/squat-ref.mjs <dir> <take> [<take> ...]      (take = "69_75" or "69_75:2.0:6.0" for a time window)
// Prints knee flexion, hip flexion (thigh vs trunk), ankle dorsiflexion (shin vs foot), trunk lean from vertical,
// heel lift, knee spread vs ankle spread, hip height in leg lengths, clavicle slope. --json for machine output.
import fs from "node:fs";
import { readAsf, readAmc, pose } from "../mocap/asf-amc.mjs";
const args = process.argv.slice(2), json = args.includes("--json"), [dir, ...takes] = args.filter((a) => a !== "--json");
const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), len = (a) => Math.hypot(...a);
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / len(a) / len(b)))) * 180 / Math.PI;
export function squatMetrics(J) {
  const side = (s) => {
    const hip = J[`${s}hipjoint`], knee = J[`${s}femur`], ank = J[`${s}tibia`], ball = J[`${s}foot`];
    return { hip, knee, ank, ball, kneeFlex: 180 - ang(sub(hip, knee), sub(ank, knee)), dorsi: ang(sub(knee, ank), sub(ball, ank)) };
  };
  const L = side("l"), R = side("r");
  const hipMid = L.hip.map((v, i) => (v + R.hip[i]) / 2), neck = J.thorax, trunk = sub(neck, hipMid);
  const hipFlex = (S) => 180 - ang(trunk, sub(S.knee, S.hip));
  const horiz = (v) => Math.hypot(v[0], v[2]);
  return {
    kneeFlex: (L.kneeFlex + R.kneeFlex) / 2, hipFlex: (hipFlex(L) + hipFlex(R)) / 2, dorsi: 90 - (L.dorsi + R.dorsi) / 2 + 90 - 90,
    ankleShin: (L.dorsi + R.dorsi) / 2, trunkLean: ang(trunk, [0, 1, 0]),
    kneeSpread: horiz(sub(L.knee, R.knee)) / Math.max(0.01, horiz(sub(L.ank, R.ank))),
    hipY: hipMid[1], kneeY: (L.knee[1] + R.knee[1]) / 2, ankY: (L.ank[1] + R.ank[1]) / 2, ballY: (L.ball[1] + R.ball[1]) / 2,
    clav: ["l", "r"].map((s) => { const v = sub(J[`${s}clavicle`], J.thorax); return Math.atan2(v[1], horiz(v)) * 180 / Math.PI; }),
  };
}
if (process.argv[1].endsWith("squat-ref.mjs")) {
  const out = [];
  for (const tk of takes) {
    const [id, a, b] = tk.split(":"), s = id.split("_")[0];
    const sk = readAsf(fs.readFileSync(`${dir}/${s}.asf`, "utf8")), fr = readAmc(fs.readFileSync(`${dir}/${id}.amc`, "utf8"));
    const i0 = a ? Math.round(+a * 120) : 0, i1 = b ? Math.round(+b * 120) : fr.length;
    const J0 = pose(sk, fr[i0]).pos, leg = len(sub(J0.lhipjoint, J0.lfemur)) + len(sub(J0.lfemur, J0.ltibia));
    let best = null, stand = null;
    for (let i = i0; i < i1; i += 2) {
      const m = squatMetrics(pose(sk, fr[i]).pos);
      if (!stand || m.hipY > stand.hipY) stand = m;
      if (!best || m.hipY < best.m.hipY) best = { i, m };
    }
    const m = best.m, r = (x) => +x.toFixed(1);
    const row = { take: id, t: r(best.i / 120), kneeFlex: r(m.kneeFlex), hipFlex: r(m.hipFlex), shinFoot: r(m.ankleShin), trunkLean: r(m.trunkLean),
      kneeSpread: +m.kneeSpread.toFixed(2), hipOverKnee_cm: r((m.hipY - m.kneeY) * 100), heelLift_cm: r((m.ankY - stand.ankY) * 100), hipH_leg: +((m.hipY - m.ballY) / leg).toFixed(2),
      clavStand: stand.clav.map(r), leg: +leg.toFixed(3) };
    out.push(row);
  }
  if (json) console.log(JSON.stringify(out, null, 1)); else console.table(out);
}
