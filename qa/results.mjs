#!/usr/bin/env node
// Summary of an experiment's results (experiments/README.md): per platform and variant, the spread of views and the
// diagnostics, at one snapshot age. Platforms are never pooled (their view definitions differ), empty cells stay
// unknown (never zero), and every post is listed so one breakout can't hide behind an average.
//
//   node qa/results.mjs experiments/<id>              -> at the record's observeDays (default 7)
//   node qa/results.mjs experiments/<id> --age 3
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PILOT = 12; // posts per variant below which a comparison is a pilot: a direction, not a finding

export function readCSV(file) {
  const [head, ...rows] = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const cols = head.split(",").map((c) => c.trim());
  return rows.map((l) => {
    const cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

const num = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b), i = (s.length - 1) * q, lo = Math.floor(i); return s.length ? s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo) : null; };
const fmt = (x, d = 0) => (x == null ? "-" : x.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }));

export function summarise(rows, age) {
  const at = rows.filter((r) => num(r.age_days) != null && Math.round(num(r.age_days)) === age);
  const out = {};
  for (const r of at) {
    const k = `${r.platform}`, v = r.variant || "?";
    ((out[k] ||= {})[v] ||= []).push(r);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), dir = a.find((x) => !x.startsWith("--") && a[a.indexOf(x) - 1] !== "--age");
  if (!dir) { console.error("usage: node qa/results.mjs experiments/<id> [--age days]"); process.exit(2); }
  const rec = JSON.parse(fs.readFileSync(path.join(dir, "experiment.json"), "utf8"));
  const age = a.includes("--age") ? Number(a[a.indexOf("--age") + 1]) : rec.observeDays ?? 7;
  const rows = readCSV(path.join(dir, "results.csv"));
  console.log(`${rec.id}: ${rec.question}`);
  console.log(`snapshot at ${age} days; decides on: ${rec.primaryOutcome ?? "(no primary outcome recorded)"}`);
  const byPlatform = summarise(rows, age);
  if (!Object.keys(byPlatform).length) { console.log(`no rows with age_days = ${age} yet`); process.exit(0); }
  for (const [platform, variants] of Object.entries(byPlatform)) {
    console.log(`\n${platform}`);
    console.log("  variant  posts  views median (middle half)   mean log(1+views)  completion  watch s  shares/1k views");
    let small = false;
    for (const [v, rs] of Object.entries(variants).sort()) {
      const views = rs.map((r) => num(r.views)).filter((x) => x != null), comp = rs.map((r) => num(r.completion)).filter((x) => x != null);
      const watch = rs.map((r) => num(r.avg_watch_s)).filter((x) => x != null);
      const sh = rs.filter((r) => num(r.shares) != null && num(r.views)), shRate = sh.length ? (1000 * sh.reduce((s, r) => s + num(r.shares), 0)) / sh.reduce((s, r) => s + num(r.views), 0) : null;
      const logm = views.length ? views.reduce((s, x) => s + Math.log1p(x), 0) / views.length : null;
      if (rs.length < PILOT) small = true;
      console.log(`  ${v.padEnd(8)} ${String(rs.length).padStart(5)}  ${(fmt(quant(views, 0.5)) + " (" + fmt(quant(views, 0.25)) + "-" + fmt(quant(views, 0.75)) + ")").padEnd(27)} ${fmt(logm, 2).padStart(17)}  ${fmt(quant(comp, 0.5), 2).padStart(10)}  ${fmt(quant(watch, 0.5), 1).padStart(7)}  ${fmt(shRate, 1).padStart(15)}`);
    }
    for (const [v, rs] of Object.entries(variants).sort())
      console.log(`  ${v} posts: ${rs.map((r) => `${r.clip || r.post_id} ${r.views === "" ? "?" : fmt(num(r.views))}`).join(" · ")}`);
    if (small) console.log(`  pilot: under ${PILOT} posts in a variant, so read this as a direction to confirm on new premises`);
  }
}
