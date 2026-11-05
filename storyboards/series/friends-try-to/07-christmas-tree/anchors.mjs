// node anchors.mjs <layout.json>: where the hands, the hat, the staff and Viking's boots are (world metres, on the
// story clock), written to anchors.json for the generator's light-string shapes. Run it after a layout whenever the
// staging changes, then run the generator and the layout again (the cast doesn't depend on the string).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const L = JSON.parse(readFileSync(process.argv[2], "utf8"));
const r3 = (x) => Math.round(x * 1000) / 1000, v = (a) => a && a.map(r3), mm = (a) => a && a.map((x) => r3(x / 1000));
// the layout's clock is the video's: take the hit-stops back out (story t = video t minus the frames held before it)
const sb = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "christmas-tree.json"), "utf8"));
const stops = (sb.hitStop || []).map((h) => [h.at, (h.frames || 3) / (sb.fps || 30)]);
const story = (t) => { let s = t; for (const [at, d] of stops) if (t >= at + d) s -= d; else if (t > at) s = at; return r3(s); };
const byT = new Map(); for (const c of L.contacts || []) byT.set(r3(c.t), c);
const samples = (L.contacts || []).map((c) => {
  const s = L.samples.reduce((a, b) => (Math.abs(b.t - c.t) < Math.abs(a.t - c.t) ? b : a));
  const o = { t: story(c.t) };
  for (const a of c.actors) {
    const sa = s.actors.find((x) => x.id === a.id) || {};
    o[a.id] = { handR: mm(a.w?.hR), handL: mm(a.w?.hL), footR: mm(a.w?.fR), footL: mm(a.w?.fL), eyes: v(sa.eyes), hat: v(sa.hat), staffFist: mm(a.w?.hL), staffEnd: a.staff && a.w?.hL ? mm(a.w.hL).map((x, i) => r3(x + (i === 1 ? a.staff.end[1] - a.staff.fist[1] : 0))) : undefined };   // the staff stands up from the left fist
  }
  return o;
});
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "anchors.json"), JSON.stringify({ from: process.argv[2], samples }));
console.log(`anchors.json: ${samples.length} samples, t ${samples[0]?.t}..${samples[samples.length - 1]?.t}`);
