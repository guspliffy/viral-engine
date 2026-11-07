// Re-measures where the right palm closes in the pick-up shot of reel v3, on the rendered rig (run after any rig change):
//   DIAG=1 node tools/human/make-reel-v3.mjs && node engine/render.mjs storyboards/human/human-reel-v3.json --layout --out <dir> > log
//   node tools/human/measure-palm.mjs <log> <t0> <t1>   -> writes storyboards/human/human-reel-v3.palm.json, prints knees/feet
import fs from "node:fs";
const [log, t0, t1] = process.argv.slice(2);
const rows = fs.readFileSync(log, "utf8").split("\n").filter((l) => l.startsWith("diag:palm")).map((l) => {
  const v = l.split(/\s+/); const t = +v[1].slice(2), S = v[2];
  return { t, S, p: v.slice(3, 6).map(Number), foot: v.slice(7, 10).map(Number), knee: v.slice(11, 14).map(Number) };
}).filter((r) => r.t >= +t0 && r.t <= +t1);
const R = rows.filter((r) => r.S === "R"), lo = R.reduce((a, r) => (r.p[1] < a.p[1] ? r : a));
console.log("lowest right palm", lo.t, lo.p.join(" "));
const near = rows.filter((r) => Math.abs(r.t - lo.t) < 0.6);
console.log("knees min y", Math.min(...near.map((r) => r.knee[1])).toFixed(3), "knee x", [Math.min(...near.map((r) => r.knee[0])), Math.max(...near.map((r) => r.knee[0]))].map((x) => x.toFixed(3)).join(".."), "knee z", [Math.min(...near.map((r) => r.knee[2])), Math.max(...near.map((r) => r.knee[2]))].map((x) => x.toFixed(3)).join(".."));
console.log("feet x", [Math.min(...near.map((r) => r.foot[0])), Math.max(...near.map((r) => r.foot[0]))].map((x) => x.toFixed(3)).join(".."), "feet z", [Math.min(...near.map((r) => r.foot[2])), Math.max(...near.map((r) => r.foot[2]))].map((x) => x.toFixed(3)).join(".."));
fs.writeFileSync("storyboards/human/human-reel-v3.palm.json", JSON.stringify({ t: +lo.t.toFixed(3), at: lo.p.map((x) => +x.toFixed(3)) }));
