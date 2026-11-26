#!/usr/bin/env node
// Is a format rising, crowded or dying? (Jonny 26 Nov: "see if the series/format already is saturated or not and if the
// format is just picking up ... if it's still rewarding to produce videos like this".) TikTok only, on trial.
// Method and limits: docs/research/small-big-scan.md, "Format trend".
//
//   node tools/format-trend.mjs --preset ours                     # our formats (in this town, what if, court, ...)
//   node tools/format-trend.mjs --format "In this town=in this (town|world)" --keywords "in this town,in this world"
//
// For each format: TikTok keyword pages find the accounts that post it, yt-dlp reads each account's latest --videos
// (150) with dates, captions that match the format's regex are its videos. Verdict (see verdict()): does it still pay
// the same accounts, are new accounts piling in, do new accounts still get hits. Options: --accounts 25 --videos 150
// --windows 6 --min-views 200000 --expand 3 --out <dir>  --from <dir>/rows.json (redo the analysis of a run, no fetching)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tiktokKeywordPages, tiktokVideos, tiktokProfile, median, writeCsv } from "./small-big-scan.mjs";

const DAY = 86400, WINDOW = 28; // days per window
const FRESH = 10; // videos younger than this are still gaining views: left out
export const PRESETS = { // our formats (26 Nov); regex runs on the caption
  "In this town (rule story)": [/\bin this (town|world|city|house|school)\b/i, ["in this town", "in this world story"]],
  "What if": [/\bwhat if\b/i, ["what if animation", "what if"]],
  "Court sketch": [/\b(court|judge|lawyer|guilty|your honou?r|objection)\b/i, ["court animation", "court skit"]],
  "Heaven / hell": [/\b(heaven|hell|angel|reaper|afterlife|devil)\b/i, ["heaven and hell animation", "grim reaper animation"]],
  "Kid vs dad": [/\b(dad|daddy|father|papa)\b/i, ["dad animation", "dad jokes animation", "dad and son animation"]],
  "Folklore / legend": [/\b(legend|folklore|folktale|myth|if you hear)\b/i, ["folklore animation", "scary legend story"]],
};

export function parseArgs(argv) {
  const o = { formats: [], keywords: null, accounts: 25, videos: 150, windows: 6, minViews: 200000, expand: 3,
    out: `out/format-trend-${new Date().toISOString().slice(0, 10)}` };
  const num = { "--accounts": "accounts", "--videos": "videos", "--windows": "windows", "--min-views": "minViews", "--expand": "expand" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (num[a]) o[num[a]] = Number(argv[++i]);
    else if (a === "--preset") { if (argv[++i] !== "ours") throw new Error("only --preset ours"); for (const [n, [re, kw]] of Object.entries(PRESETS)) o.formats.push({ name: n, re, keywords: kw }); }
    else if (a === "--format") { const [n, r] = argv[++i].split("="); o.formats.push({ name: n, re: new RegExp(r || n, "i"), keywords: null }); }
    else if (a === "--keywords") o.keywords = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--from") o.from = argv[++i];
    else throw new Error(`unknown option ${a}`);
  }
  for (const f of o.formats) f.keywords ||= o.keywords || [f.name];
  if (!o.formats.length) throw new Error('give --preset ours or --format "Name=regex"');
  return o;
}

// rows: one per format video {account, posted (unix s), views, created (account, unix s)}; now in unix s
export function trendTable(rows, o, now) {
  const end = now - FRESH * DAY;
  const wins = [];
  for (let w = o.windows - 1; w >= 0; w--) { // oldest first
    const to = end - w * WINDOW * DAY, from = to - WINDOW * DAY;
    const v = rows.filter((r) => r.posted >= from && r.posted < to);
    const byAcc = new Map(); for (const r of rows) if (!byAcc.has(r.account) || r.posted < byAcc.get(r.account)) byAcc.set(r.account, r.posted);
    wins.push({ from: new Date(from * 1000).toISOString().slice(0, 10), to: new Date(to * 1000).toISOString().slice(0, 10),
      videos: v.length, posters: new Set(v.map((r) => r.account)).size,
      // accounts born in this window that post the format (today's posters only: who is piling in, and when)
      newAccounts: new Set(rows.filter((r) => r.created >= from && r.created < to).map((r) => r.account)).size,
      medianViews: Math.round(median(v.map((r) => r.views))), hits: v.filter((r) => r.views >= o.minViews).length });
  }
  return wins;
}

// Reward: the SAME account's format videos, last 2 windows vs before (median of per-account ratios, accounts with 3+
// videos on each side), so a sample of today's active accounts can't fake it. Entry: new accounts born in the last
// 2 windows vs the average 2 windows before. Newcomer hits: accounts under 150 days with a hit in the last 60 days.
export function verdict(rows, wins, o, now) {
  const cut = now - FRESH * DAY - 2 * WINDOW * DAY, start = now - FRESH * DAY - o.windows * WINDOW * DAY;
  const ratios = [];
  for (const a of new Set(rows.map((r) => r.account))) {
    const mine = rows.filter((r) => r.account === a && r.posted < now - FRESH * DAY && r.posted >= start);
    const rec = mine.filter((r) => r.posted >= cut).map((r) => r.views), old = mine.filter((r) => r.posted < cut).map((r) => r.views);
    if (rec.length >= 3 && old.length >= 3) ratios.push(median(rec) / Math.max(median(old), 1));
  }
  const reward = ratios.length >= 3 ? +median(ratios).toFixed(2) : null;
  const recentNew = wins.slice(-2).reduce((s, w) => s + w.newAccounts, 0);
  const olderNew = wins.slice(0, -2).reduce((s, w) => s + w.newAccounts, 0) / Math.max((wins.length - 2) / 2, 1);
  const entry = +(recentNew / Math.max(olderNew, 0.5)).toFixed(2);
  const young = rows.filter((r) => r.created && now - r.created < 150 * DAY && now - r.posted < 60 * DAY);
  const newPosters = new Set(young.map((r) => r.account)).size;
  const newHits = new Set(young.filter((r) => r.views >= o.minViews).map((r) => r.account)).size;
  const newShare = newPosters >= 3 ? +(newHits / newPosters).toFixed(2) : null; // room for one more? (under 3 = unknown)
  const word = reward == null ? "too little data (fewer than 3 accounts with history on both sides)"
    : reward >= 1.3 ? "HEATING UP: the same accounts get more views with it now"
    : reward >= 0.8 && entry >= 1.5 ? "RISING: still pays, and new accounts are piling in (get in now)"
    : reward >= 0.8 ? "STEADY: still pays as before"
    : entry >= 1.5 ? "CROWDED: new accounts pile in, each video gets less"
    : "FADING: the same accounts get fewer views with it";
  return { word, reward, accountsCompared: ratios.length, entry, newHits, newPosters, newShare };
}

// Fetch (or read --from) and judge every format. Returns {now, all rows, report: [{f, wins, ver, rows, newWin, accounts}]}.
export async function runTrend(o) {
  let now = Math.floor(Date.now() / 1000);
  const cache = new Map(); // account -> {videos, profile}, shared between formats
  const all = [], report = [];
  const saved = o.from ? JSON.parse(fs.readFileSync(o.from, "utf8")) : null; // --from: rows.json of an earlier run, no fetching
  if (saved) now = saved.now;
  for (const f of o.formats) {
    if (saved) {
      const rows = saved.rows.filter((r) => r.format === f.name), wins = trendTable(rows, o, now), ver = verdict(rows, wins, o, now);
      const newWin = rows.filter((r) => r.created && now - r.created < 150 * DAY && now - r.posted < 60 * DAY && r.views >= o.minViews).sort((a, b) => b.views - a.views);
      report.push({ f, wins, ver, rows, newWin, accounts: new Set(rows.map((r) => r.account)).size }); all.push(...rows);
      continue;
    }
    console.error(`${f.name}: keyword pages ${f.keywords.join(", ")}`);
    const words = f.keywords.join(" ").toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const found = await tiktokKeywordPages(f.keywords, o.expand, new RegExp(words.join("|") || ".", "i"));
    const count = new Map();
    for (const v of found) if (v.account && f.re.test(v.desc || v.title)) count.set(v.account, (count.get(v.account) || 0) + 1);
    const accounts = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, o.accounts).map(([a]) => a);
    console.error(`  ${found.length} videos, ${count.size} accounts post it; reading ${accounts.length}`);
    const rows = [];
    for (const a of accounts) {
      if (!cache.has(a)) cache.set(a, { videos: tiktokVideos(a, o.videos), profile: tiktokProfile(a) });
      const { videos, profile } = cache.get(a);
      for (const v of videos) if (v.posted && f.re.test(v.desc || v.title))
        rows.push({ format: f.name, account: a, followers: profile.followers, created: profile.created, posted: v.posted, views: v.views, url: v.url, title: v.title });
    }
    const wins = trendTable(rows, o, now), ver = verdict(rows, wins, o, now);
    const newWin = rows.filter((r) => r.created && now - r.created < 150 * DAY && now - r.posted < 60 * DAY && r.views >= o.minViews).sort((a, b) => b.views - a.views);
    report.push({ f, wins, ver, rows, newWin, accounts: accounts.length });
    all.push(...rows);
  }
  return { now, all, report, saved: !!saved };
}

async function main() {
  const o = parseArgs(process.argv);
  fs.mkdirSync(o.out, { recursive: true });
  const { now, all, report, saved } = await runTrend(o);
  if (!saved) fs.writeFileSync(path.join(o.out, "rows.json"), JSON.stringify({ now, rows: all }));
  writeCsv(path.join(o.out, "format-videos.csv"), all.map((r) => ({ ...r, posted: new Date(r.posted * 1000).toISOString().slice(0, 10) })),
    ["format", "account", "followers", "posted", "views", "title", "url"]);
  const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
  let md = `# Format trend (${new Date().toISOString().slice(0, 10)}, TikTok)\n\nWindows of ${WINDOW} days, videos younger than ${FRESH} days left out. ` +
    `Reward = the same accounts' format videos, last 2 windows vs before (x1.00 = no change). Entry = accounts born in the last 2 windows ` +
    `that post it vs 2 earlier windows. Hit = ${fmt(o.minViews)}+ views.\n`;
  for (const { f, wins, ver, rows, newWin, accounts } of report) {
    md += `\n## ${f.name}: ${ver.word}\n\nReward x${ver.reward ?? "?"} (${ver.accountsCompared} accounts compared), entry x${ver.entry}. ` +
      `${rows.length} format videos from ${accounts} accounts. New accounts (under 150 days) posting it in the last 60 days: ${ver.newPosters}, with a hit: ${ver.newHits}` +
      `${ver.newShare == null ? " (too few to judge room)" : ` = ${Math.round(ver.newShare * 100)}% break out`}` +
      `${newWin.length ? ` (best: ${newWin[0].url} ${fmt(newWin[0].views)})` : ""}.\n\n` +
      `| Window | Videos | Accounts posting | Accounts born | Median views | Hits |\n|---|---|---|---|---|---|\n` +
      wins.map((w) => `| ${w.from} to ${w.to} | ${w.videos} | ${w.posters} | ${w.newAccounts} | ${fmt(w.medianViews)} | ${w.hits} |`).join("\n") + "\n";
  }
  md += `\nLimits: only accounts that TikTok's keyword pages show today, so "accounts posting" always looks like it grows; the verdict uses ` +
    `the same-account reward and account birth dates instead. Daily posters' latest ${o.videos} videos may not reach the oldest windows.\n`;
  fs.writeFileSync(path.join(o.out, "trend.md"), md);
  console.error(`wrote ${o.out}/trend.md, format-videos.csv`);
  console.log(report.map((r) => `${r.f.name}: ${r.ver.word} (reward x${r.ver.reward}, entry x${r.ver.entry}, new-account hits ${r.ver.newHits})`).join("\n"));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
