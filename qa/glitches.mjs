#!/usr/bin/env node
// Glitches that live only in the picture (quality plan item 15 (a), 5 Nov 2026): runs qa/flow.py (dense optical flow on
// the final video) with what the storyboard and layout know, so a cut, a hit-stop, a flash or a caption popping in is
// never taken for a glitch:
//
//   skip   the storyboard's shot starts, its hit-stops, and its flash, shake, impact, slash and speed-lines effects
//   soft   particles (poof, sparkle, confetti, zzz...): only findings over a large area count there
//   masks  every caption and text pop, from the layout's boxes (every 0.1 s), from a frame before it shows to a frame
//          after it goes
//
// Every time is on the video clock (the storyboard's story times moved by its hit-stops). Prints one line per finding,
// warnings first; --json prints the flow result with the plan; --all also lists the notes (one small cell: a fast
// hand, a flying sock).
//
//   node qa/glitches.mjs <clip.mp4> [--sb <storyboard>] [--layout <layout.json>] [--json] [--all]
//
// Needs python3 with opencv-python-headless and numpy; without them it says "not measured" and passes.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { holdsOf, renderTime } from "../engine/shared/holds.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// effects that change much of the picture at once on purpose (skipped), and particle effects (soft)
const LOUD = new Set(["flash", "shake", "impact", "slash", "speedlines", "shade", "photo"]);
const SOFT = new Set(["poof", "sparkle", "notes", "zzz", "sweat", "alert", "glint", "confetti", "stars", "dust", "debris", "sparks"]);

// the plan for flow.py: { skip: [[a, b]], soft: [[a, b]], masks: [{ from, to, box }] }, video seconds and 1080x1920 px
export function pixelPlan(sb, layout) {
  const plan = { skip: [], soft: [], masks: [] };
  if (sb) {
    const holds = sb.holds || holdsOf(sb), R = (s) => renderTime(holds, s);
    // a directed camera keeps its shots in sb.shots; a camera path (sb.camera) has no cuts
    for (const s of sb.shots || []) if (s.at > 0) plan.skip.push([R(s.at), R(s.at)]);
    for (const h of holds) plan.skip.push([R(h.at), R(h.at) + h.dur + 1 / (sb.fps ?? 30)]);
    for (const f of sb.fx || []) {
      const a = R(f.at ?? 0), b = R((f.at ?? 0) + (f.dur ?? 0.4));
      if (LOUD.has(f.do)) plan.skip.push([a, b]);
      else if (SOFT.has(f.do)) plan.soft.push([a, b]);
    }
  }
  if (layout) {
    // one mask per caption: the union of its boxes, padded, from its first sample to its last (+- a sample)
    const byText = new Map(), dt = 0.1;
    for (const s of layout.samples || []) {
      for (const [i, c] of (s.captions || []).entries()) {
        const box = Array.isArray(c) ? c : c.box;
        if (!box) continue;
        const k = c.text ?? `#${i}`, m = byText.get(k);
        // a caption that comes back later is a new mask
        if (m && s.t - m.to <= dt * 1.5) {
          const x0 = Math.min(m.box[0], box[0]), y0 = Math.min(m.box[1], box[1]);
          m.box = [x0, y0, Math.max(m.box[0] + m.box[2], box[0] + box[2]) - x0, Math.max(m.box[1] + m.box[3], box[1] + box[3]) - y0];
          m.to = s.t;
        } else {
          if (m) plan.masks.push(done(m));
          byText.set(k, { from: s.t, to: s.t, box: [...box] });
        }
      }
    }
    for (const m of byText.values()) plan.masks.push(done(m));
    function done(m) {
      const p = 24;
      return { from: Math.max(0, m.from - dt), to: m.to + dt, box: [m.box[0] - p, m.box[1] - p, m.box[2] + 2 * p, m.box[3] + 2 * p] };
    }
  } else if (sb) {
    // no layout: a full-width band at each caption's height
    const holds = sb.holds || holdsOf(sb), R = (s) => renderTime(holds, s);
    for (const c of sb.captions || []) plan.masks.push({ from: R(c.from), to: R(c.to ?? sb.duration), box: [0, (c.pos ?? 1180) - 80, 1080, 260] });
  }
  return plan;
}

export function pixelGlitches(clip, { sb = null, layout = null } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "glitches-")), file = path.join(tmp, "plan.json");
  const plan = pixelPlan(sb, layout);
  fs.writeFileSync(file, JSON.stringify(plan));
  const r = spawnSync("python3", [path.join(HERE, "flow.py"), clip, "--plan", file], { encoding: "utf8", maxBuffer: 64 << 20 });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) return { error: (r.stderr || "flow.py failed").trim().split("\n").pop(), findings: [], plan };
  try {
    return { ...JSON.parse(r.stdout), plan };
  } catch {
    return { error: "flow.py printed no JSON", findings: [], plan };
  }
}

const SAY = {
  "frame0-jump": "the picture jumps out of the first frame",
  pop: "a part moves out and back in one frame",
  jump: "a part snaps in one frame while everything around it is calm",
  against: "a part moves against its neighbours for one frame",
  flicker: "the brightness flashes and comes back with nothing moving",
  strobe: "a large area moves over 80 px a frame (unblurred: reads as a jump on a phone)",
};
export const describe = (f) => `${f.t.toFixed(2)}s ${f.kind} (${f.score} ${f.kind === "flicker" ? "levels" : "px at 270 wide"}, ${f.cells} cell${f.cells > 1 ? "s" : ""}, ${f.where}): ${SAY[f.kind] || f.kind}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), o = { clip: null, sb: null, layout: null, json: false, all: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--json") o.json = true;
    else if (a[i] === "--all") o.all = true;
    else o.clip = a[i];
  }
  if (!o.clip) { console.error("usage: node qa/glitches.mjs <clip.mp4> [--sb <storyboard>] [--layout <layout.json>] [--json] [--all]"); process.exit(2); }
  const sb = o.sb ? await (await import("../engine/load.mjs")).loadStoryboard(o.sb) : null;
  const layout = o.layout ? JSON.parse(fs.readFileSync(o.layout, "utf8")) : null;
  const res = pixelGlitches(o.clip, { sb, layout });
  if (o.json) { console.log(JSON.stringify(res, null, 1)); process.exit(0); }
  if (res.error) { console.log(`not measured: ${res.error}`); process.exit(0); }
  const warn = res.findings.filter((f) => f.level === "warn"), note = res.findings.filter((f) => f.level !== "warn");
  console.log(`${path.basename(o.clip)}: ${res.frames} frames, ${warn.length} to look at, ${note.length} notes (${res.plan.skip.length} skips, ${res.plan.masks.length} caption masks)`);
  for (const f of warn) console.log(`  WARN  ${describe(f)}`);
  if (o.all) for (const f of note) console.log(`  note  ${describe(f)}`);
}
