#!/usr/bin/env node
// Floor-plan clearance: bodies in each other or in a floor prop, from the storyboard alone, in 1-2 s (9 Nov
// 2026). A layout pass takes about 2 min and a clip ran about 28 of them (Never Has Money 04); most of the staging
// fails in its first rounds were bodies placed into each other or into the furniture, which a floor plan shows
// without drawing anything. The Fable build of that episode found its overlaps this way (a script for that clip),
// against about 9.5 min for a layout pass at the time. Run it after every staging edit, before --layout.
//
//   node qa/clear.mjs <storyboard> [--from s --to s] [--gap 0.03] [--prop id=w,d ...] [--json]
//
// Each character stands on an ellipse its body's width by its depth (the character file, times its scale), turned
// with its yaw, where timeline.js actorState puts it (the state the renderer draws) at every frame on the video's clock.
// A pair whose ellipses overlap by more than --gap metres (default 0.03) is reported, unless an allowClip window that
// waives character-overlap names the pair at that time (a hug), or they are more than half a metre apart in height
// (a carried or lifted body). A floor prop counts when the storyboard gives its footprint ("w" and "d" in metres, or
// "r" for a round one) and a height "h" of 10 cm or more (a floor or a rug is walked on), or --prop does; it stays
// where the storyboard puts it (a prop carried or pushed later isn't followed), and isn't checked against whoever sits
// on it. Clearance is a staging guide: the layout's contact checks (render.mjs --layout) stay the gate.
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState } from "../engine/page/timeline.js";
import { storyTime } from "../engine/shared/holds.js";
import { windowFor } from "./gate.mjs";
import { pathToFileURL } from "node:url";

function args() {
  const a = process.argv.slice(2), o = { sb: null, from: 0, to: null, gap: 0.03, props: {}, json: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--from") o.from = Number(a[++i]);
    else if (a[i] === "--to") o.to = Number(a[++i]);
    else if (a[i] === "--gap") o.gap = Number(a[++i]);
    else if (a[i] === "--prop") { const [id, wd] = a[++i].split("="), [w, d] = wd.split(",").map(Number); o.props[id] = { w, d: d ?? w }; }
    else if (a[i] === "--json") o.json = true;
    else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
    else { console.error(`unknown option ${a[i]}`); process.exit(2); }
  }
  if (!o.sb) { console.error("usage: node qa/clear.mjs <storyboard.json> [--from s --to s] [--gap m] [--prop id=w,d] [--json]"); process.exit(2); }
  return o;
}

// how far an ellipse (half-width a across its facing, half-depth b along it, turned yaw) reaches in world direction (dx, dz)
function reach(a, b, yaw, dx, dz) {
  const n = Math.hypot(dx, dz) || 1, ux = dx / n, uz = dz / n;
  // the body faces +z at yaw 0 (timeline.js): along the facing is the depth, across it the width
  const along = ux * Math.sin(yaw) + uz * Math.cos(yaw), across = ux * Math.cos(yaw) - uz * Math.sin(yaw);
  return 1 / Math.sqrt((across * across) / (a * a) + (along * along) / (b * b));
}

// every overlap in the storyboard: [{ a, b, from, to, worst, at }] on the video's clock
export function clearance(sb, chars, { from = 0, to = null, gap = 0.03, props = {} } = {}) {
  const fps = sb.fps ?? 30, end = to ?? sb.duration, hits = new Map();
  const cast = (sb.cast || []).map((c) => {
    const def = chars[c.character] || {}, B = def.body || {}, k = c.scale ?? def.scale ?? 1;
    return { c, def, a: ((B.width ?? 0.8) / 2) * k, b: ((B.depth ?? B.width ?? 0.7) / 2) * k };
  });
  const floor = (sb.props || []).map((p) => {
    // a footprint, and a height that stands up off the floor (a floor or a rug has none: it is walked on)
    const o = props[p.id] || ((p.h ?? 0) >= 0.1 ? (p.r != null ? { r: p.r } : p.w != null && p.d != null ? { w: p.w, d: p.d } : null) : null);
    if (!o || (p.y ?? 0) > 0.3) return null;
    const k = p.scale ?? 1;
    return { id: p.id, x: p.x ?? 0, z: p.z ?? 0, yaw: ((p.rot ?? 0) * Math.PI) / 180, a: (o.r ?? o.w / 2) * k, b: (o.r ?? o.d / 2) * k };
  }).filter(Boolean);
  const mark = (key, t, pen) => {
    const runs = hits.get(key) || hits.set(key, []).get(key), r = runs[runs.length - 1];
    if (r && t - r.to < 1.5 / fps) { r.to = t; if (pen > r.worst) { r.worst = pen; r.at = t; } } else runs.push({ from: t, to: t, worst: pen, at: t });
  };
  for (let i = Math.round(from * fps); i <= Math.round(end * fps); i++) {
    const t = i / fps, s = storyTime(sb.holds, t);
    const st = cast.map((q) => ({ ...q, s: actorState(sb, q.c, q.def, s) })).filter((q) => q.s.visible !== false);
    for (let x = 0; x < st.length; x++) for (let y = x + 1; y < st.length; y++) {
      const A = st[x], B = st[y], dx = B.s.x - A.s.x, dz = B.s.z - A.s.z, d = Math.hypot(dx, dz);
      if (Math.abs((A.s.y ?? 0) - (B.s.y ?? 0)) > 0.5) continue;
      const pen = reach(A.a, A.b, A.s.yaw, dx, dz) + reach(B.a, B.b, B.s.yaw, -dx, -dz) - d;
      if (pen <= gap) continue;
      if (windowFor(sb, "character-overlap", A.c.id, t, B.c.id) || windowFor(sb, "character-overlap", B.c.id, t, A.c.id)) continue;
      mark(`${A.c.id} / ${B.c.id}`, t, pen);
    }
    for (const A of st) for (const P of floor) {
      if (A.s.seat === P.id || (A.s.y ?? 0) > 0.3) continue;
      const dx = P.x - A.s.x, dz = P.z - A.s.z, d = Math.hypot(dx, dz);
      const pen = reach(A.a, A.b, A.s.yaw, dx, dz) + reach(P.a, P.b, P.yaw, -dx, -dz) - d;
      if (pen > gap && !windowFor(sb, "character-overlap", A.c.id, t, P.id) && !windowFor(sb, "clipping", A.c.id, t, P.id)) mark(`${A.c.id} / ${P.id}`, t, pen);
    }
  }
  const out = [];
  for (const [key, runs] of hits) for (const r of runs) out.push({ pair: key, from: +r.from.toFixed(2), to: +r.to.toFixed(2), worst: +r.worst.toFixed(2), at: +r.at.toFixed(2) });
  return out.sort((p, q) => p.from - q.from);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args(), t0 = Date.now(), sb = loadStoryboard(o.sb), chars = loadCharacters(sb);
  const res = clearance(sb, chars, o), checked = (sb.props || []).filter((p) => o.props[p.id] || ((p.h ?? 0) >= 0.1 && (p.y ?? 0) <= 0.3 && (p.r != null || (p.w != null && p.d != null)))).map((p) => p.id);
  if (o.json) { console.log(JSON.stringify(res, null, 2)); process.exit(0); }
  for (const r of res) console.log(`  ${r.pair}: ${Math.round(r.worst * 100)} cm into each other at ${r.from.toFixed(2)}-${r.to.toFixed(2)} s (worst at ${r.at.toFixed(2)} s)`);
  console.log(`${res.length ? `${res.length} overlap${res.length === 1 ? "" : "s"}` : "clear"} on the floor plan (bodies${checked.length ? `, floor props ${checked.join(", ")}` : ", no floor prop has a footprint: give one with --prop id=w,d"}) in ${Date.now() - t0} ms`);
}
