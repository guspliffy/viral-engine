#!/usr/bin/env node
// Camera inside a body (25 Nov 2026, Heaven Terms draft 2): the "hide" shot's camera stood 0.5 m from the Angel, inside
// its wing, and the whole frame was flat orange for 2 s. Preflight gave no warning and camfit named only the other
// face; it cost a full draft render (11 min) to find by eye. A body that fills the frame is always visible, so this FAILS.
//
// Body model: an upright elliptic cylinder at the actor's place (engine/page/timeline.js actorState: x, z, yaw, feet y),
// turned by its yaw, with the body's own half width and half depth (def.body, times the cast scale) plus MARGIN on each
// side, from the feet to the layout's `top` (hat, hair, halo) plus MARGIN. A cylinder, not the potato's ellipsoid, so a
// costume that is wider than the body (wings 0.7 m out from the spine, a robe's flare) is inside it too. The camera is
// the one the renderer draws (cameraState, then worldCamera for a rig's frame). Skipped: a rider in a rig (its place is
// in the rig's frame), a first-person actor (st.pov: its head is the camera on purpose), an actor not shown.
// A window ("allowClip" with "checks": ["camera-inside"] and a reason, on the story clock like the others) waives it.
//
//   node qa/camin.mjs <storyboard> [--layout file]     the same check on its own, from a layout (seconds); SPEECH=off
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";
import { worldCamera } from "../engine/page/vehicle.js";
import { storyTime } from "../engine/shared/holds.js";
import { windowFor } from "./gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MARGIN = 0.15;  // m: the camera this near a body's surface counts as inside it

// how deep a world point sits in the actor's body cylinder: 0 on its axis, 1 on its surface (inflated by MARGIN); null when outside
export function bodyDepth(def, c, st, top, p, margin = MARGIN) {
  const B = def.body || {}, k = c.scale ?? def.scale ?? 1, y0 = st.y ?? 0, tp = top ?? y0 + (B.height ?? 1) * k;
  if (p[1] < y0 - margin || p[1] > tp + margin) return null;
  const dx = p[0] - st.x, dz = p[2] - st.z, cy = Math.cos(st.yaw ?? 0), sy = Math.sin(st.yaw ?? 0), lx = dx * cy - dz * sy, lz = dx * sy + dz * cy;
  const a = ((B.width ?? 0.8) / 2) * k + margin, d = ((B.depth ?? 0.7) / 2) * k + margin, n = Math.hypot(lx / a, lz / d);
  return n <= 1 ? n : null;
}

// the actors whose body holds the camera `pos` at story time s (layout sample smp gives the head top): [{ id, depth }]
export function insideAt(sb, chars, smp, s, pos) {
  const out = [];
  for (const c of sb.cast || []) {
    if (c.rig) continue;
    const L = (smp.actors || []).find((a) => a.id === c.id);
    if (!L?.eyes || Math.hypot(pos[0] - L.eyes[0], pos[1] - L.eyes[1], pos[2] - L.eyes[2]) > 4) continue;   // far away: no state needed
    const def = chars[c.character] || {}, st = actorState(sb, c, def, s);
    if (st.visible === false || st.pov) continue;
    const dep = bodyDepth(def, c, st, L.top, pos);
    if (dep != null) out.push({ id: c.id, depth: dep });
  }
  return out;
}

// every layout sample's camera against every body; one FAIL per actor and run of samples
export function cameraInsideResults(sb, lay, chars = loadCharacters(sb)) {
  const runs = new Map(), done = [];
  const step = lay.samples.length > 1 ? lay.samples[1].t - lay.samples[0].t : 0.1;
  const close = (id) => { const r = runs.get(id); if (r) { done.push(r); runs.delete(id); } };
  for (const smp of lay.samples) {
    const s = storyTime(sb.holds, smp.t), pos = worldCamera(sb, cameraState(sb, s), s).pos;
    const hit = insideAt(sb, chars, smp, s, pos).filter((h) => !windowFor(sb, "camera-inside", h.id, smp.t));
    for (const h of hit) {
      const r = runs.get(h.id);
      if (r && Math.abs(smp.t - r.to - step) < step * 0.5) { r.to = smp.t; r.deep = Math.min(r.deep, h.depth); }
      else { close(h.id); runs.set(h.id, { id: h.id, from: smp.t, to: smp.t, deep: h.depth }); }
    }
    for (const id of [...runs.keys()]) if (!hit.some((h) => h.id === id)) close(id);
  }
  for (const id of [...runs.keys()]) close(id);
  const res = done.sort((a, b) => a.from - b.from).map((r) => ({ level: "fail", check: "camera-inside", msg: `the camera is inside ${r.id}'s body at ${r.from.toFixed(1)}-${(r.to + step).toFixed(1)} s (${Math.round(r.deep * 100)} % of the way from its axis to its surface, ${MARGIN * 100} cm margin): move the camera or the character` }));
  return res.length ? res : [{ level: "pass", check: "camera-inside", msg: "the camera never enters a body" }];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = { sb: null, layout: null };
  for (let i = 0; i < a.length; i++) { if (a[i] === "--layout") o.layout = a[++i]; else if (!o.sb) o.sb = a[i]; }
  if (!o.sb) { console.error("usage: node qa/camin.mjs <storyboard.json> [--layout file]"); process.exit(2); }
  const sb = loadStoryboard(o.sb), file = o.layout || [`${sb.id}-${sb.look || "anime-pro"}.layout.json`, `${sb.id}.layout.json`].map((f) => path.join(ROOT, "out", f)).find((f) => fs.existsSync(f));
  if (!file) { console.error(`no layout for ${sb.id} in out/: pass --layout <file>`); process.exit(2); }
  const t0 = Date.now(), res = cameraInsideResults(sb, JSON.parse(fs.readFileSync(file, "utf8")));
  for (const r of res) console.log(`${r.level === "fail" ? "FAIL" : "ok  "}  ${r.check}: ${r.msg}`);
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  process.exitCode = res.some((r) => r.level === "fail") ? 1 : 0;
}
