// Counts a clip thread's ledger numbers from its Claude Code transcript, so a row is never counted by hand
// (docs/rules/workflow.md "The improvement loop", step 5).
//   node tools/ledger-count.mjs [transcript.jsonl] [--from <ISO time>] [--to <ISO time>]
// Without a file it takes the newest transcript under ~/.claude/projects. --from / --to cut one video out of a
// thread that made several (the time of Jonny's brief, the time of the delivery).
// Counted: steps (tool calls), lookups (Grep, Glob, and shell grep / rg / find that start a command and do not read
// out/ or /tmp/), layouts (render.mjs --layout: full and --from partial; preflight runs are listed beside them), stills,
// drafts, renders, waits (turns that only waited), minutes, machine minutes (foreground commands; background
// commands are counted, their minutes are in their own logs), tokens, and cost where the transcript recorded it.
// By hand, because only the director knows them: fix rounds, unseen, score, notes, test.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--from") opt.from = Date.parse(args[++i]);
  else if (args[i] === "--to") opt.to = Date.parse(args[++i]);
  else opt.file = args[i];
}
if (!opt.file) {
  const root = path.join(os.homedir(), ".claude", "projects");
  const all = fs.existsSync(root) ? fs.readdirSync(root).flatMap((d) => { const p = path.join(root, d); return fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(p, f)) : []; }) : [];
  opt.file = all.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}
if (!opt.file || !fs.existsSync(opt.file)) { console.error("ledger-count: no transcript found (pass the .jsonl file)"); process.exit(1); }
if ([opt.from, opt.to].some((t) => t !== undefined && Number.isNaN(t))) { console.error("ledger-count: --from and --to take an ISO time, e.g. 2026-11-11T10:14:00Z"); process.exit(1); }

// one shell command -> what it ran (a loop body counts once)
function classify(cmd) {
  const n = { lookups: 0, full: 0, partial: 0, preflights: 0, stills: 0, drafts: 0, renders: 0 };
  // quoted text goes first: a grep pattern like "fail\|warn" is not a pipe, and a quoted "render.mjs" is not a run
  const bare = String(cmd).replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');
  for (const seg of bare.split(/\n|;|&&|\|\|/)) {
    const s = seg.trim();
    if (/(^|\s)node\s+\S*render\.mjs/.test(s.split("|")[0])) {
      if (/--layout/.test(s)) n[/--from/.test(s) ? "partial" : "full"]++;
      else if (/--stills/.test(s)) n.stills++;
      else if (/--draft/.test(s)) n.drafts++;
      else n.renders++;
    }
    if (/qa\/preflight\.mjs/.test(s)) n.preflights++;
    const first = s.split("|")[0].replace(/^(do|then|else)\s+/, "").trim();
    if (/^(grep|rg|find)\b/.test(first) && !/(^|\s)(out\/|\/tmp\/)/.test(first)) n.lookups++;
  }
  return n;
}

const inRange = (t) => (opt.from === undefined || t >= opt.from) && (opt.to === undefined || t <= opt.to);
const sum = { steps: 0, lookups: 0, full: 0, partial: 0, preflights: 0, stills: 0, drafts: 0, renders: 0, waits: 0, background: 0, machineMs: 0, out: 0, cacheRead: 0 };
const calls = new Map(), seenMsg = new Set(), costs = [];
let first, last, clock = 0;
for await (const line of readline.createInterface({ input: fs.createReadStream(opt.file) })) {
  let o; try { o = JSON.parse(line); } catch { continue; }
  if (o.type === "cost-state" && typeof o.totalCostUSD === "number") { costs.push([clock, o.totalCostUSD]); continue; }   // it carries no time of its own: the line before it does
  const t = Date.parse(o.timestamp); if (Number.isNaN(t)) continue;
  clock = t;
  if (o.type === "user") for (const b of Array.isArray(o.message?.content) ? o.message.content : []) {
    const c = b.type === "tool_result" && calls.get(b.tool_use_id);
    if (c) { sum.machineMs += Math.max(0, t - c); calls.delete(b.tool_use_id); }
  }
  if (!inRange(t)) continue;
  first ??= t; last = t;
  if (o.type !== "assistant") continue;
  const u = o.message?.usage, id = o.message?.id;
  if (u && id && !seenMsg.has(id)) { seenMsg.add(id); sum.out += u.output_tokens || 0; sum.cacheRead += u.cache_read_input_tokens || 0; }
  for (const b of o.message?.content || []) {
    if (b.type !== "tool_use") continue;
    sum.steps++;
    if (b.name === "Grep" || b.name === "Glob") sum.lookups++;
    if (/no_reply_needed$|^ScheduleWakeup$/.test(b.name)) sum.waits++;
    if (b.name === "Bash") {
      const n = classify(b.input?.command);
      for (const k of Object.keys(n)) sum[k] += n[k];
      if (b.input?.run_in_background) sum.background++; else calls.set(b.id, t);
    }
  }
}
if (first === undefined) { console.error("ledger-count: nothing in that time range"); process.exit(1); }
// the cost recorded last before each end of the range (the transcript holds only a few cost records)
const costAt = (t) => { let v; for (const [ct, c] of costs) if (ct <= t) v = c; return v; };
const c0 = opt.from === undefined ? 0 : costAt(first), c1 = costAt(last);
const cost = c0 !== undefined && c1 !== undefined && c1 > c0 ? `at least ${(c1 - c0).toFixed(0)} (the thread recorded its cost ${costs.length} times: this is between the records nearest before each end)` : "?";
const min = (ms) => Math.round(ms / 60000);
const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n / 1000)}k`);
console.log(`ledger-count ${path.basename(opt.file)}: ${new Date(first).toISOString().slice(0, 16)}Z to ${new Date(last).toISOString().slice(0, 16)}Z`);
console.log(`  steps: ${sum.steps} · lookups: ${sum.lookups} · layouts: ${sum.full} full + ${sum.partial} partial (preflight runs: ${sum.preflights}) · stills: ${sum.stills} · drafts: ${sum.drafts} · renders: ${sum.renders} · waits: ${sum.waits}`);
console.log(`  min: ${min(last - first)} · machine: ${min(sum.machineMs)} in the foreground + ${sum.background} background commands · tokens: ${k(sum.out)} out, ${k(sum.cacheRead)} cache read · $: ${cost}`);
console.log("  by hand: fix rounds, unseen, score, notes, test");
