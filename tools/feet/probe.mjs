// Feet probe (quality plan item 10): lays out a storyboard's feet straight from the timeline (no browser, seconds),
// with the planted gait on ("motion": { "feet": 2 }) or as it is, and reports how far each standing foot slides.
//   node tools/feet/probe.mjs <storyboard.json> [--feet] [--fps 30]
// A stance: a foot within 3 mm of the floor for 2+ frames while its body travels (as stance-slide.py counts it).
// It reads only the timeline's foot targets (st.feet), so without --feet it reports nothing: compare layouts for that.
import fs from "node:fs";
import { actorState, feetOn } from "../../engine/page/timeline.js";
import { loadStoryboard, loadCharacters } from "../../engine/load.mjs";

const args = process.argv.slice(2), file = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
const sb = loadStoryboard(file), defs = loadCharacters(sb);
void fs;
if (args.includes("--feet")) sb.motion = { ...(typeof sb.motion === "object" ? sb.motion : {}), feet: 2 };
if (!feetOn(sb)) { console.log("planted gait off: run with --feet"); process.exit(0); }
const fps = Number(args[args.indexOf("--fps") + 1]) || sb.fps || 30, N = Math.round((sb.duration ?? 10) * fps);
let all = [];
for (const c of sb.cast || []) {
  const F = [];
  for (let i = 0; i <= N; i++) { const st = actorState(sb, c, defs[c.character] || {}, i / fps, true); F.push({ f: st.feet, b: st.plant }); }
  let steps = 0, far = 0, farT = 0;
  for (const s of ["R", "L"]) {
    let i = 1;
    const ok = (k) => F[k].f[s].w > 0.99 && F[k].f[s].y - F[k].b.y - 0.035 * (c.scale ?? defs[c.character]?.scale ?? 1) < 0.003;
    while (i <= N) {
      if (ok(i) && ok(i - 1)) {
        let j = i; while (j + 1 <= N && ok(j + 1)) j++;
        let body = 0, slide = 0;
        for (let q = i; q <= j; q++) {
          const db = Math.hypot(F[q].b.x - F[q - 1].b.x, F[q].b.z - F[q - 1].b.z); if (db > 0.25) continue;
          body += db; slide += Math.hypot(F[q].f[s].x - F[q - 1].f[s].x, F[q].f[s].z - F[q - 1].f[s].z);
        }
        if (body > 0.05) all.push({ t: (i - 1) / fps, id: c.id, s, slide, body });
        i = j + 1;
      } else i++;
    }
    for (let k = 0; k <= N; k++) { const fk = F[k].f[s]; if (fk.w > 0.99) { const b = F[k].b, sc = c.scale ?? defs[c.character]?.scale ?? 1, hx = (s === "R" ? -1 : 1) * 0.13 * sc, hz = 0.04 * sc, d = Math.hypot(fk.x - (b.x + hx * Math.cos(b.yaw) + hz * Math.sin(b.yaw)), fk.z - (b.z - hx * Math.sin(b.yaw) + hz * Math.cos(b.yaw))); if (d > far) { far = d; farT = k / fps; } } }
    { const base = 0.035 * (c.scale ?? defs[c.character]?.scale ?? 1) - 0.035, up = (k) => F[k].f[s].y - F[k].b.y - base > 0.04; for (let k = 1; k <= N; k++) if (up(k) && !up(k - 1)) steps++; }
  }
  console.log(`${c.id}: ${steps} lifts, foot at most ${(far * 100).toFixed(0)} cm from its home under the body (${farT.toFixed(2)} s)`);
}
const sl = all.map((o) => o.slide * 1000).sort((a, b) => a - b);
for (const o of all.filter((o) => o.slide > 0.01).sort((a, b) => b.slide - a.slide).slice(0, 3)) console.log(`    t ${o.t.toFixed(2)} ${o.id} ${o.s}: slide ${(o.slide * 1000).toFixed(0)} mm while the body went ${(o.body * 1000).toFixed(0)} mm`);
console.log(`${all.length} stances while travelling; slide median ${sl.length ? sl[sl.length >> 1].toFixed(1) : 0} mm, max ${sl.length ? sl[sl.length - 1].toFixed(1) : 0} mm`);
