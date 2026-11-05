// How readable the eyes are in a clip (quality plan item 4, measure d): from a layout (node engine/render.mjs <sb>
// --layout), every stretch of 0.3 s or more where a face on screen shows less than 60 % of a pupil (face.js
// face.shown, the layout's "pupils": [right eye, left eye], blinks included, so a blink alone never counts).
//   node tools/eye-sheet/count-pupils.mjs <layout.json> [...]   -> one line per clip, then each stretch
import fs from "node:fs";

const MIN = 0.6, HOLD = 0.3;
for (const f of process.argv.slice(2)) {
  const L = JSON.parse(fs.readFileSync(f, "utf8")), W = L.width || 1080, H = L.height || 1920, runs = [], open = new Map();
  let lowest = 1, n = 0;
  for (const s of L.samples) {
    const seen = new Set();
    for (const a of s.actors || []) {
      if (!a.pupils || !a.eyesPx) continue;
      const [x, y] = a.eyesPx; if (x < 0 || x > W || y < 0 || y > H) continue;
      const m = Math.min(...a.pupils); n++; lowest = Math.min(lowest, m);
      if (m < MIN) { seen.add(a.id); const r = open.get(a.id); if (r) { r.to = s.t; r.min = Math.min(r.min, m); } else open.set(a.id, { id: a.id, from: s.t, to: s.t, min: m }); }
    }
    for (const [id, r] of open) if (!seen.has(id)) { runs.push(r); open.delete(id); }
  }
  for (const r of open.values()) runs.push(r);
  const step = L.samples.length > 1 ? L.samples[1].t - L.samples[0].t : 0.1;
  const long = runs.filter((r) => r.to - r.from + step >= HOLD - 1e-6);
  console.log(`${f.split("/").pop()}: ${long.length} stretch(es) under ${MIN * 100} % for ${HOLD} s+, lowest ${Math.round(lowest * 100)} % (${n} face samples)`);
  for (const r of long) console.log(`  ${r.id} ${r.from.toFixed(2)}-${(r.to + step).toFixed(2)} s, down to ${Math.round(r.min * 100)} %`);
}
