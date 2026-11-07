// Seated reference from several real people (CMU mocap): how real sitters put their thighs, shins and feet, at each
// take's settled seated moment (the hips at their lowest and still for 0.3 s).
//   node tools/human/sit-ref.mjs <dir> <take> [<take> ...]      (take = "75_17" or "75_17:2.0:6.0" for a time window)
// Prints knee flexion, thigh slope (+ = knee above the hip joint), shin tilt from vertical (+ = ankle in front of the
// knee), hip over knee in cm, trunk lean, the shin's share of the leg, and the "fit": seat height (hips minus the
// sitting-bone depth) over the sitter's popliteal height (ankle height + shin). --json for machine output.
// (7 Nov 2026, human motion v5: the anime body sat with its knees 8 cm over its hips)
import fs from "node:fs";
import { readAsf, readAmc, pose } from "../mocap/asf-amc.mjs";
const sub = (a, b) => a.map((v, i) => v - b[i]), len = (a) => Math.hypot(...a), horiz = (v) => Math.hypot(v[0], v[2]);
const deg = (r) => (r * 180) / Math.PI;

// seated angles from named joints (CMU names: <s>hipjoint = hip joint end, <s>femur = knee, <s>tibia = ankle, thorax)
export function sitMetrics(J) {
  const side = (s) => {
    const hip = J[`${s}hipjoint`], knee = J[`${s}femur`], ank = J[`${s}tibia`];
    const th = sub(knee, hip), sh = sub(knee, ank);
    // forward = the thigh's horizontal direction
    const f = [th[0], 0, th[2]], fl = horiz(th) || 1;
    return {
      thighSlope: deg(Math.atan2(th[1], horiz(th))),
      shinTilt: deg(Math.atan2((-sh[0] * f[0] - sh[2] * f[2]) / fl, sh[1])),
      kneeFlex: 180 - deg(Math.acos(Math.max(-1, Math.min(1, -(th[0] * -sh[0] + th[1] * -sh[1] + th[2] * -sh[2]) / len(th) / len(sh))))),
      hipOverKnee: hip[1] - knee[1], ankY: ank[1], kneeY: knee[1], hipY: hip[1], shin: len(sh), thigh: len(th),
    };
  };
  const L = side("l"), R = side("r"), m = (k) => (L[k] + R[k]) / 2;
  const hipMid = J.lhipjoint.map((v, i) => (v + J.rhipjoint[i]) / 2), trunk = sub(J.thorax, hipMid);
  return { thighSlope: m("thighSlope"), shinTilt: m("shinTilt"), kneeFlex: m("kneeFlex"), hipOverKnee: m("hipOverKnee"), hipY: m("hipY"), kneeY: m("kneeY"), ankY: m("ankY"),
    shin: m("shin"), thigh: m("thigh"), trunkLean: deg(Math.acos(trunk[1] / len(trunk))), L, R };
}

if (process.argv[1].endsWith("sit-ref.mjs")) {
  const args = process.argv.slice(2), json = args.includes("--json"), [dir, ...takes] = args.filter((a) => a !== "--json");
  const out = [];
  for (const tk of takes) {
    const [id, a, b] = tk.split(":"), s = id.split("_")[0];
    const sk = readAsf(fs.readFileSync(`${dir}/${s}.asf`, "utf8")), fr = readAmc(fs.readFileSync(`${dir}/${id}.amc`, "utf8"));
    const i0 = a ? Math.round(+a * 120) : 0, i1 = b ? Math.min(fr.length, Math.round(+b * 120)) : fr.length;
    const M = []; for (let i = i0; i < i1; i += 4) M.push({ i, m: sitMetrics(pose(sk, fr[i]).pos), J: pose(sk, fr[i]).pos });
    const stand = M.reduce((x, y) => (y.m.hipY > x.m.hipY ? y : x));
    // settled seated: the lowest hips that stay within 1 cm for 0.3 s
    let best = null;
    for (let k = 0; k + 9 < M.length; k++) {
      const w = M.slice(k, k + 9), lo = Math.min(...w.map((x) => x.m.hipY)), hi = Math.max(...w.map((x) => x.m.hipY));
      if (hi - lo < 0.01 && (!best || w[4].m.hipY < best.m.hipY)) best = w[4];
    }
    if (!best) continue;
    const m = best.m, r = (x) => +x.toFixed(1), stature = stand.J.head[1] - Math.min(stand.J.ltoes?.[1] ?? 0, stand.J.lfoot[1]) + 0.1;
    // popliteal height ~ ankle height + shin - 3 cm (knee joint centre to the back of the knee); seat ~ hip joint - 7 cm
    const popl = m.ankY + m.shin - 0.03 - (stand.m.ankY - 0.075), seat = m.hipY - 0.07 - (stand.m.ankY - 0.075);
    out.push({ take: id, t: r(best.i / 120), kneeFlex: r(m.kneeFlex), thighSlope: r(m.thighSlope), shinTilt: r(m.shinTilt), hipOverKnee_cm: r(m.hipOverKnee * 100),
      trunkLean: r(m.trunkLean), shinShare: +(m.shin / (m.shin + m.thigh)).toFixed(3), seat_cm: r(seat * 100), popl_cm: r(popl * 100), fit: +(seat / popl).toFixed(2), stature_m: +stature.toFixed(2) });
  }
  if (json) console.log(JSON.stringify(out, null, 1)); else console.table(out);
}
