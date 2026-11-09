#!/usr/bin/env node
// Jonny's panels by number (9 Nov 2026, from the "measure it, don't eyeball it" idea): PANELS.md's "Numbers" table
// gives, per panel, where the subject stands in the frame, read off his image before the first line of code; this
// compares them with our layout at the panel's time and grades each line yes, partial or no. qa/panels.mjs puts the
// pictures side by side, and a side-by-side gets read from memory: in Never Has Money 04 the panels' hug fills the frame
// (panels 06-07) while the director's cut showed the pair small and wide at 6.6 and 8.0 s, and it went to delivery.
//
//   node qa/panelfit.mjs <storyboard> --panels <PANELS.md> [--layout out/<id>-<look>.layout.json] [--json]
//
// The table (docs/templates/PANELS.md), one row per panel; every number is a share of the frame, 0 at the top or left:
//   | Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera |
//   | 06 | 6.6 | vik | 0.11 | 0.19 | 0.79 | 0.33 | vik, gsl | level |
//   At: the video second to compare. Top: the subject's silhouette top, hat included. Eyes: its eye line. Bottom: its
//   lowest point in frame (1 when the frame cuts it). X: its eyes across the frame. Faces: the faces that must show
//   (in frame and turned to us). Camera: above, level or below the subject's eyes. "-" skips a cell.
//   Departure: optional; the reason the clip leaves the panel there (review A agreed). A row with one is reported, not graded.
// Grades (tuned on the EP04 cuts, 9 Nov): size (Bottom - Top) under 0.75 or over 1.33 of the panel's is a no (0.75-0.9 or
// 1.1-1.33 partial); a face not showing is a no; the eye line more than 0.25 off or X more than 0.3 off is a no (0.12 and
// 0.15 partial); another camera height is partial. Exit 1 when any line is a no. preflight runs it when the storyboard names its PANELS.md ("panels": { "md": path }).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";
import { storyTime } from "../engine/shared/holds.js";
import { VISIBLE } from "./framing.mjs";
import { lens } from "./camfit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920;

// the "Numbers" table of a PANELS.md: rows of { panel, at, subject, top, eyes, bottom, x, faces, camera }
export function readNumbers(md) {
  const lines = md.split("\n"), start = lines.findIndex((l) => /^#+\s*Numbers\b/i.test(l));
  if (start < 0) return [];
  const rows = [], num = (s) => (s == null || /^\s*-?\s*$/.test(s) || /^\s*-\s*$/.test(s) ? null : Number(s));
  let head = null;
  for (const l of lines.slice(start + 1)) {
    if (/^#/.test(l)) break;
    if (!/^\s*\|/.test(l)) continue;
    const cells = l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (!head) { head = cells.map((c) => c.toLowerCase()); continue; }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const g = (k) => cells[head.indexOf(k)];
    const r = { panel: g("panel"), at: num(g("at")), subject: g("subject"), top: num(g("top")), eyes: num(g("eyes")), bottom: num(g("bottom")), x: num(g("x")),
      faces: (g("faces") || "").split(/[,\s]+/).filter((f) => f && f !== "-"), camera: (g("camera") || "").toLowerCase().replace(/^-$/, ""),
      departure: (g("departure") || "").replace(/^-$/, "") };
    if (r.at != null && !Number.isNaN(r.at)) rows.push(r);
  }
  return rows;
}

const grade = (d, ok, part) => (d == null ? null : Math.abs(d) <= ok ? "yes" : Math.abs(d) <= part ? "partial" : "no");
const worst = (gs) => (gs.includes("no") ? "no" : gs.includes("partial") ? "partial" : "yes");

export function panelFit(sb, lay, rows, chars = loadCharacters(sb)) {
  const cast = Object.fromEntries((sb.cast || []).map((c) => [c.id, c])), out = [];
  for (const r of rows) {
    const smp = lay.samples.reduce((b, s) => (Math.abs(s.t - r.at) < Math.abs(b.t - r.at) ? s : b), lay.samples[0]);
    const a = (smp.actors || []).find((q) => q.id === r.subject), notes = [], g = {};
    if (!a || !a.box || !a.eyesPx) { out.push({ ...r, grade: "no", ours: null, notes: [`${r.subject} isn't in the frame at ${r.at} s`] }); continue; }
    // the silhouette top (the layout's "top", hat included) and the feet, straight above and below the eyes, through the
    // shot's lens (the layout's box is a projected bounding box, a good deal bigger than the silhouette)
    const s = storyTime(sb.holds, r.at), cam = cameraState(sb, s), P = lens({ pos: cam.pos, look: cam.look, fov: cam.fov ?? 32 });
    const c = cast[r.subject], st = chars?.[c?.character] ? actorState(sb, c, chars[c.character], s) : null;
    const base = a.eyes ? [a.eyes[0], st?.y ?? 0, a.eyes[2]] : null, head = a.eyes && a.top != null ? P([a.eyes[0], a.top, a.eyes[2]]) : null, feet = base ? P(base) : null;
    const clip = (v) => Math.max(0, Math.min(1, v));
    const ours = { top: head ? clip(head[1] / H) : null, bottom: feet ? clip(feet[1] / H) : 1, eyes: a.eyesPx[1] / H, x: a.eyesPx[0] / W };
    if (r.top != null && r.bottom != null && ours.top != null) {
      const k = (ours.bottom - ours.top) / Math.max(0.01, r.bottom - r.top);
      g.size = k < 0.75 || k > 1.33 ? "no" : k < 0.9 || k > 1.1 ? "partial" : "yes";
      if (g.size !== "yes") notes.push(`size ${Math.round(k * 100)} % of the panel's (${(ours.bottom - ours.top).toFixed(2)} of the frame against ${(r.bottom - r.top).toFixed(2)})`);
    }
    if (r.eyes != null) { const d = ours.eyes - r.eyes; g.eyes = grade(d, 0.12, 0.25); if (g.eyes !== "yes") notes.push(`eye line ${ours.eyes.toFixed(2)} against ${r.eyes.toFixed(2)}`); }
    if (r.x != null) { const d = ours.x - r.x; g.x = grade(d, 0.15, 0.3); if (g.x !== "yes") notes.push(`eyes across ${ours.x.toFixed(2)} against ${r.x.toFixed(2)}`); }
    // faces: in frame and turned to us (the body's yaw, as the "visible" check reads it)
    const missing = r.faces.filter((id) => {
      const q = (smp.actors || []).find((x) => x.id === id), c = cast[id], def = chars?.[c?.character];
      if (!q?.eyesPx || q.eyesPx[0] < 0 || q.eyesPx[0] > W || q.eyesPx[1] < 0 || q.eyesPx[1] > H) return true;
      if (!def) return false;
      const st = actorState(sb, c, def, s), d = [cam.pos[0] - st.x, cam.pos[2] - st.z], n = Math.hypot(d[0], d[1]) || 1;
      return Math.sin(st.yaw ?? 0) * d[0] / n + Math.cos(st.yaw ?? 0) * d[1] / n < VISIBLE.facing;
    });
    if (r.faces.length) { g.faces = missing.length ? "no" : "yes"; if (missing.length) notes.push(`faces not showing: ${missing.join(", ")}`); }
    if (r.camera && a.eyes) {
      const dy = cam.pos[1] - a.eyes[1], ourCam = dy > 0.3 ? "above" : dy < -0.3 ? "below" : "level";
      g.camera = ourCam === r.camera ? "yes" : "partial"; if (g.camera !== "yes") notes.push(`camera ${ourCam} (${dy >= 0 ? "+" : ""}${dy.toFixed(2)} m from the eyes), the panel's ${r.camera}`);
    }
    const gr = worst(Object.values(g).filter(Boolean));
    out.push({ ...r, grade: r.departure && gr !== "yes" ? "departed" : gr, grades: g, ours, notes: r.departure && gr !== "yes" ? [...notes, `departure: ${r.departure}`] : notes });
  }
  return out;
}

// check results for qa/preflight.mjs: one warning per panel graded no, a note per partial
export function panelResults(sb, lay, file, chars = null) {
  if (!file || !fs.existsSync(file)) return file ? [{ level: "warn", check: "panel-fit", msg: `the storyboard names ${file} for its panels, and it isn't there` }] : [];
  const rows = readNumbers(fs.readFileSync(file, "utf8"));
  if (!rows.length) return [{ level: "warn", check: "panel-fit", msg: `${path.relative(ROOT, file)} has no "Numbers" table: read the subject's Top, Eyes, Bottom and X off each panel before staging (docs/templates/PANELS.md)` }];
  const fit = panelFit(sb, lay, rows, chars || loadCharacters(sb)), out = [];
  for (const f of fit.filter((x) => x.grade !== "yes")) out.push({ level: f.grade === "no" ? "warn" : "note", check: "panel-fit", msg: `panel ${f.panel} (${f.at} s, ${f.subject}): ${f.notes.join("; ")}: re-stage toward the panel, or write the departure and its reason in PANELS.md` });
  if (!out.length) out.push({ level: "pass", check: "panel-fit", msg: `${fit.length} panels match by number (size, eye line, x, faces, camera)` });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), opt = (k) => { const i = a.indexOf(`--${k}`); return i >= 0 ? a[i + 1] : null; };
  const sbFile = a.find((x, i) => !x.startsWith("--") && !(i > 0 && a[i - 1].startsWith("--") && a[i - 1] !== "--json"));
  if (!sbFile || !opt("panels")) { console.error("usage: node qa/panelfit.mjs <storyboard> --panels <PANELS.md> [--layout file] [--json]"); process.exit(2); }
  const sb = loadStoryboard(sbFile);
  const file = opt("layout") || [`${sb.id}-${sb.look || "anime-pro"}.layout.json`, `${sb.id}.layout.json`].map((f) => path.join(ROOT, "out", f)).find((f) => fs.existsSync(f));
  if (!file) { console.error(`no layout for ${sb.id} in out/: run node engine/render.mjs ${sbFile} --layout once`); process.exit(2); }
  const rows = readNumbers(fs.readFileSync(opt("panels"), "utf8"));
  if (!rows.length) { console.error(`no "Numbers" table in ${opt("panels")} (docs/templates/PANELS.md)`); process.exit(2); }
  const fit = panelFit(sb, JSON.parse(fs.readFileSync(file, "utf8")), rows);
  if (a.includes("--json")) console.log(JSON.stringify(fit, null, 1));
  else {
    console.log(`panelfit ${sb.id}: ${fit.length} panels against ${path.relative(process.cwd(), file)}`);
    for (const f of fit) console.log(`  ${String(f.panel).padEnd(3)} ${String(f.at).padEnd(5)} ${f.subject.padEnd(4)} ${f.grade.toUpperCase().padEnd(8)}${f.notes.length ? f.notes.join("; ") : "matches"}`);
    const n = (k) => fit.filter((f) => f.grade === k).length;
    console.log(`${n("yes")} yes, ${n("partial")} partial, ${n("no")} no`);
  }
  process.exit(fit.some((f) => f.grade === "no") ? 1 : 0);
}
