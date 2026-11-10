#!/usr/bin/env node
// The check windows ("allowClip") of a storyboard, counted: how many, how long each is in frame, and what they waive
// (10 Nov 2026). In the Never Has Money 04 trial the cut Jonny called "cleaner, less glitchy hands" had 7 windows in
// frame, the two others 30 and 31, and nobody saw those numbers until the comparison was written by hand: a window
// takes a finding out of the verdict, so a clip can read PASS with thirty waived contacts on screen. Preflight prints
// the one-line total; this prints the table for DELIVERY.md.
//
//   node qa/waivers.mjs <storyboard> [--layout file]    -> every window: who / with, seconds, checks, seconds in frame, reason
//   node qa/waivers.mjs <storyboard> --md               -> the same as a markdown table (DELIVERY.md)
//
// "In frame": at a layout sample (10 a second) inside the window, who is on screen, and so is what it is with when the
// layout knows it (a character: a sixth of its box inside the frame; a prop: drawn and its point inside the frame).
// That is the camera's frame, not a promise that nothing stands in front, so it counts a little high, never low.
// "Waives": the findings that fail or count as visible glitches when the storyboard has no windows at all, less the
// ones it has with them, by check. Over GATE.waiverBudget windows in frame, preflight asks for a 15 fps strip of each.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GATE, gateOf, storyAt } from "./gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// every window with a reason (one without waives nothing), and the seconds it is in frame
export function windowRows(sb, lay) {
  const W = lay?.width || 1080, H = lay?.height || 1920, S = lay?.samples || [], step = S.length > 1 ? S[1].t - S[0].t : 0.1;
  const clock = (t) => (gateOf(sb) >= 2 ? storyAt(sb, t) : t);   // windows are on the story's clock from gate 2 (qa/gate.mjs windowFor)
  const actorIn = (a) => {
    if (!a?.box) return false;
    const [x, y, w, h] = a.box, iw = Math.max(0, Math.min(W, x + w) - Math.max(0, x)), ih = Math.max(0, Math.min(H, y + h) - Math.max(0, y));
    return w * h > 0 && (iw * ih) / (w * h) >= 1 / 6;
  };
  const propIn = (p) => !!p && p.visible !== false && !!p.px && p.px[0] >= 0 && p.px[0] <= W && p.px[1] >= 0 && p.px[1] <= H;
  // true / false when the layout knows the id at this sample, null when it doesn't (a surface, a part of the set)
  const seen = (smp, id) => {
    const a = (smp.actors || []).find((x) => x.id === id); if (a) return actorIn(a);
    const p = (smp.props || []).find((x) => x.id === id); if (p) return propIn(p);
    return null;
  };
  return (sb?.allowClip || []).filter((w) => w.reason).map((w) => {
    let n = 0, all = 0;
    for (const smp of S) {
      const t = clock(smp.t); if (t < w.from - 1e-6 || t > w.to + 1e-6) continue;
      all++;
      const a = seen(smp, w.who), b = w.with ? seen(smp, w.with) : null;
      if (a !== false && b !== false && (a === true || b === true)) n++;
    }
    return { who: w.who, with: w.with || null, from: w.from, to: w.to, checks: Array.isArray(w.checks) ? w.checks : null, reason: w.reason, seconds: Math.round(all * step * 10) / 10, inFrame: Math.round(n * step * 10) / 10 };
  });
}

// what the windows take out of the verdict: results with every window gone, less the results as they are, by check
// (only what fails or counts as a visible glitch: res rows carry preflight's kind)
export function waived(resWith, resWithout) {
  const count = (res) => { const m = new Map(); for (const r of res) if (r.kind === "fail" || r.kind === "visible") m.set(r.check, (m.get(r.check) || 0) + 1); return m; };
  const a = count(resWith), b = count(resWithout), out = [];
  for (const [check, n] of b) { const d = n - (a.get(check) || 0); if (d > 0) out.push({ check, n: d }); }
  return out.sort((x, y) => y.n - x.n || x.check.localeCompare(y.check));
}

export function waiverSummary(sb, lay, resWith = null, resWithout = null) {
  const rows = windowRows(sb, lay), on = rows.filter((r) => r.inFrame > 0);
  const hid = resWith && resWithout ? waived(resWith, resWithout) : null;
  return { windows: rows.length, inFrame: on.length, inFrameSeconds: Math.round(on.reduce((m, r) => m + r.inFrame, 0) * 10) / 10, budget: GATE.waiverBudget, over: on.length > GATE.waiverBudget, waives: hid, rows };
}

// preflight's line (and the note when the clip is over the budget)
export function waiverLines(s, sbFile = null) {
  if (!s.windows) return [" check windows: none"];
  const hid = s.waives ? (s.waives.length ? `; they waive ${s.waives.reduce((m, x) => m + x.n, 0)} finding${s.waives.reduce((m, x) => m + x.n, 0) === 1 ? "" : "s"} that would fail or show (${s.waives.map((x) => `${x.check}${x.n > 1 ? " x" + x.n : ""}`).join(", ")})` : "; none of them changes the verdict") : "";
  const out = [` check windows: ${s.windows}, ${s.inFrame} in frame for ${s.inFrameSeconds} s in all${hid}${sbFile ? ` (table: node qa/waivers.mjs ${sbFile})` : ""}`];
  if (s.over) out.push(`  over the budget of ${s.budget} windows in frame: look at a 15 fps strip of each before a full render, and put the table in the delivery (docs/rules/workflow.md "Check windows")`);
  return out;
}

export function waiverTable(s, md = false) {
  const head = ["Who / with", "Window (s)", "Checks", "In frame (s)", "Reason"];
  const body = s.rows.map((r) => [`${r.who}${r.with ? " / " + r.with : ""}`, `${r.from}-${r.to}`, r.checks ? r.checks.join(", ") : "contact", r.inFrame > 0 ? String(r.inFrame) : "no", r.reason]);
  if (md) return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((b) => `| ${b.map((c) => String(c).replace(/\|/g, "/")).join(" | ")} |`)].join("\n");
  const w = head.map((h, i) => Math.min(i === 4 ? 70 : 28, Math.max(h.length, ...body.map((b) => String(b[i]).length))));
  const line = (b) => b.map((c, i) => (i === 4 ? String(c) : String(c).slice(0, w[i]).padEnd(w[i]))).join("  ");
  return [line(head), ...body.map(line)].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = { sb: null, layout: null, md: false, out: path.join(ROOT, "out") };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--md") o.md = true;
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
    else { console.error(`unknown option ${a[i]}`); process.exit(2); }
  }
  if (!o.sb) { console.error("usage: node qa/waivers.mjs <storyboard.json> [--layout file] [--md] [--out dir]"); process.exit(2); }
  const { loadStoryboard } = await import("../engine/load.mjs");
  const { layoutFor, preflight } = await import("./preflight.mjs");
  const sb = loadStoryboard(o.sb), L = layoutFor(o.sb, sb, { layout: o.layout, out: o.out, log: (m) => console.error(m) });
  const res = await preflight(sb, L.lay, { quick: true, sbFile: o.sb }), bare = await preflight({ ...sb, allowClip: [] }, L.lay, { quick: true, sbFile: o.sb });
  const s = waiverSummary(sb, L.lay, res, bare);
  if (s.rows.length) console.log(waiverTable(s, o.md));
  for (const l of waiverLines(s)) console.log(o.md ? `\n${l.trim()}` : l);
}
