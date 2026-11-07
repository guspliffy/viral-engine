// Where the fire leaves the body, measured on the drawn person (not the recording): the palms and toes of every frame
// from a layout pass with the cast's diagPalms and diagFeet on, written for tools/human/make-firebend.mjs.
//   DIAG=1 node tools/human/make-firebend.mjs && node engine/render.mjs storyboards/human/fire/firebend-01.json --layout --skip-gate --out <dir> > log
//   node tools/human/firebend-src.mjs <log>     -> storyboards/human/fire/firebend-01.src.json, then run make-firebend again
import fs from "node:fs";
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n");
const out = { L: [], R: [], LF: [], RF: [] };
for (const l of lines) {
  let i = l.indexOf("diag:palm ");
  if (i >= 0) { const v = l.slice(i).split(/\s+/); out[v[2]].push({ t: +v[1].slice(2), p: v.slice(3, 6).map(Number) }); continue; }
  i = l.indexOf("diag:feet ");
  if (i >= 0) { const v = l.slice(i).split(/\s+/), t = +v[1].slice(2); out.LF.push({ t, p: v.slice(6, 9).map(Number) }); out.RF.push({ t, p: v.slice(13, 16).map(Number) }); }
}
// one sample per frame (the layout may log a frame twice)
for (const k of Object.keys(out)) { const m = new Map(); for (const s of out[k]) m.set(s.t.toFixed(3), s); out[k] = [...m.values()].sort((a, b) => a.t - b.t); }
fs.writeFileSync("storyboards/human/fire/firebend-01.src.json", JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k} ${v.length}`).join("  "));
