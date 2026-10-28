#!/usr/bin/env node
// Framing report: where each shot actually puts the faces, measured from the render layout (render.mjs --layout),
// so a directed camera (engine/direct.mjs) can be checked against its rules without drawing a frame.
//
//   node qa/framing.mjs <storyboard> <layout.json>
//
// Per shot, at its middle: the eye line of each face in frame (share of the frame from the top; the rule is about a
// third, never under half), the top of each character (headroom: above 0 means the hat or head is cropped), and the
// lowest point (the app's caption bar covers below ~0.71). Notes only: framing is judged on the contact sheet.
import fs from "node:fs";
import { loadStoryboard } from "../engine/load.mjs";

export function framing(sb, lay) {
  const H = lay.height || 1920, shots = [...(sb.shots || [])].sort((a, b) => a.at - b.at), out = [];
  shots.forEach((s, i) => {
    const t1 = shots[i + 1]?.at ?? sb.duration, tm = s.to ? Math.min(t1 - 0.05, s.at + (s.dur ?? 1) + (t1 - s.at - (s.dur ?? 1)) / 2) : (s.at + t1) / 2;
    const smp = lay.samples.reduce((b, q) => (Math.abs(q.t - tm) < Math.abs(b.t - tm) ? q : b), lay.samples[0]);
    const d = (sb.directed || []).find((q) => Math.abs(q.at - s.at) < 1e-3);
    const faces = (smp.actors || []).filter((a) => a.eyesPx && a.eyesPx[0] >= 0 && a.eyesPx[0] <= (lay.width || 1080) && a.eyesPx[1] >= 0 && a.eyesPx[1] <= H)
      .map((a) => ({ id: a.id, eye: +(a.eyesPx[1] / H).toFixed(2), top: +(a.box[1] / H).toFixed(2), bottom: +((a.box[1] + a.box[3]) / H).toFixed(2) }));
    out.push({ at: s.at, until: +t1.toFixed(2), t: smp.t, ...(d && { size: d.size, kind: d.kind, why: d.why }), faces });
  });
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const [sbFile, layFile] = process.argv.slice(2);
  if (!sbFile || !layFile) { console.error("usage: node qa/framing.mjs <storyboard> <layout.json>"); process.exit(2); }
  const sb = loadStoryboard(sbFile), lay = JSON.parse(fs.readFileSync(layFile, "utf8"));
  for (const r of framing(sb, lay)) {
    const f = r.faces.map((q) => `${q.id} eyes ${q.eye} top ${q.top} low ${q.bottom}`).join(" | ") || "no face in frame";
    console.log(`${r.at.toFixed(2)}-${r.until.toFixed(2)} s ${r.size ?? "set by hand"}${r.kind ? ` (${r.kind})` : ""}: ${f}${r.why ? `  [${r.why}]` : ""}`);
  }
}
