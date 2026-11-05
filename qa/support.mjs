#!/usr/bin/env node
// Holds 2 (quality plan item 7 (d)): every prop on every frame is held, riding something, in flight after a release or
// throw, resting on a surface (within 1 cm), or staged with a reason (hung, stuck or floating on purpose). The layout
// records each prop's state when the storyboard has "rig": { "hold": 2 } (engine/page/attach.js support()); this reads
// it:
//   prop-support  a prop in the air with nothing under it (gap over 1 cm) for 0.2 s or more: fail (sunk into the ground
//                 is left alone: rocks and plants sit in it on purpose). A prop hung or floating on purpose names it in its spec: "staged": "<why>"
//                 (or a release with keep: "air" and a reason).
//   hold-owner    a held prop that a "prop" tween also moves (two writers: the hand and the tween): fail. Move the
//                 hand (arm poses on the prop) and let the prop follow, or let go first.
//
//   node qa/support.mjs <layout.json> [<storyboard>]
import fs from "node:fs";

export const SUPPORT = { gap: 10, hold: 0.2 };

export function supportResults(layout, sb = null) {
  const S = layout.samples || [], out = [];
  if (!S.some((s) => (s.props || []).some((p) => p.support))) return out;
  const step = S.length > 1 ? S[1].t - S[0].t : 0.1;
  const runs = new Map();   // prop -> [{ from, to, gap, kind }]
  const add = (id, kind, t, gap) => {
    const r = runs.get(`${id}|${kind}`) || []; const last = r.at(-1);
    if (last && t - last.to <= step * 1.5) { last.to = t; last.gap = kind === "sunk" ? Math.min(last.gap, gap) : Math.max(last.gap, gap); }
    else r.push({ id, kind, from: t, to: t, gap });
    runs.set(`${id}|${kind}`, r);
  };
  for (const s of S) for (const p of s.props || []) {
    const u = p.support; if (!u || p.visible === false) continue;
    if (u.state === "unsupported" && u.gap > SUPPORT.gap) add(p.id, "air", s.t, u.gap);
    if (u.writers === 2) add(p.id, "writers", s.t, 0);
  }
  for (const r of [...runs.values()].flat()) {
    const len = r.to - r.from + step;
    if (r.kind === "writers") { out.push({ level: "fail", check: "hold-owner", msg: `${r.id} is held while a "prop" tween moves it at ${r.from.toFixed(2)}-${(r.to + step).toFixed(2)}s: two writers; move the hand and let the prop follow, or let go first` }); continue; }
    if (len < SUPPORT.hold - 1e-6) continue;
    out.push(r.kind === "air"
      ? { level: "fail", check: "prop-support", msg: `${r.id} hangs in the air ${Math.round(r.gap / 10)} cm over what is under it at ${r.from.toFixed(2)}-${(r.to + step).toFixed(2)}s: put it on something, hold it, or stage it with a reason ("staged": "...")` }
      : { level: "fail", check: "prop-support", msg: `${r.id} sinks ${Math.round(-r.gap / 10)} cm into what is under it at ${r.from.toFixed(2)}-${(r.to + step).toFixed(2)}s` });
  }
  if (!out.length) out.push({ level: "pass", check: "prop-support", msg: "every prop is held, riding, in flight, resting or staged with a reason" });
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const L = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const res = supportResults(L);
  for (const r of res) console.log(`${r.level.padEnd(4)} ${r.check}: ${r.msg}`);
  if (res.some((r) => r.level === "fail")) process.exitCode = 1;
}
