#!/usr/bin/env node
// Is a format rising, crowded or dying? (Jonny 26 Nov: "see if the series/format already is saturated or not and if the
// format is just picking up ... if it's still rewarding to produce videos like this".) TikTok and YouTube Shorts side by
// side, and the gap between them (Jonny 26 Nov: hyped on one platform, thin on the other = room for us). On trial.
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
import { tiktokKeywordPages, tiktokVideos, tiktokProfile, ytShortsSearch, ytChannelOf, ytFeed, median, writeCsv } from "./small-big-scan.mjs";

const DAY = 86400, WINDOW = 7; // one window = one week (Jonny 26 Nov: the last 1-2 weeks show how a format is doing now)
const FRESH = 2; // videos younger than this are still gaining views: left out of the weeks (shown day by day instead)
// Frame: the last 2 weeks only, last week vs the week before (Jonny 26 Nov: "trends 4 weeks ago are probably out today";
// more accounts in a short frame beat a long frame).
export const PRESETS = { // our formats (26 Nov); regex runs on the caption
  "In this town (rule story)": [/\bin this (town|world|city|house|school)\b/i, ["in this town", "in this world story"]],
  "What if": [/\bwhat if\b/i, ["what if animation", "what if"]],
  "Court sketch": [/\b(court|judge|lawyer|guilty|your honou?r|objection)\b/i, ["court animation", "court skit"]],
  "Heaven / hell": [/\b(heaven|hell|angel|reaper|afterlife|devil)\b/i, ["heaven and hell animation", "grim reaper animation"]],
  "Kid vs dad": [/\b(dad|daddy|father|papa)\b/i, ["dad animation", "dad jokes animation", "dad and son animation"]],
  "Country vs country": [/\b(germany|german|america|american|usa|us|europe|european|british|uk|japan|france|india)\b[\s\S]*\bvs\.?\b|\bvs\.?\b[\s\S]*\b(germany|german|america|american|usa|europe|european|british|uk|japan|france|india)\b|\bin (germany|america|the usa|europe|the uk|japan)\b/i, ["germany vs usa", "america vs europe", "usa vs uk comedy"]],
  "Folklore / legend": [/\b(legend|folklore|folktale|myth|if you hear)\b/i, ["folklore animation", "scary legend story"]],
};

export function parseArgs(argv) {
  const o = { formats: [], keywords: null, youtube: true, accounts: 40, videos: 60, windows: 2, minViews: 200000, expand: 5,
    out: `out/format-trend-${new Date().toISOString().slice(0, 10)}` };
  const num = { "--accounts": "accounts", "--videos": "videos", "--windows": "windows", "--min-views": "minViews", "--expand": "expand" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (num[a]) o[num[a]] = Number(argv[++i]);
    else if (a === "--preset") { if (argv[++i] !== "ours") throw new Error("only --preset ours"); for (const [n, [re, kw]] of Object.entries(PRESETS)) o.formats.push({ name: n, re, keywords: kw }); }
    else if (a === "--format") { const [n, r] = argv[++i].split("="); o.formats.push({ name: n, re: new RegExp(r || n, "i"), keywords: null }); }
    else if (a === "--no-youtube") o.youtube = false;
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
// Newcomer = NEW TO THE FORMAT (ChatGPT research 26 Nov: a 150-day-old account can be a format regular): the account's
// first format video in its read history is 1-7 days old, and its history reaches at least 14 days further back, so we
// know it didn't post the format before. Rows without `reach` (older saved runs): accounts under 150 days instead.
export function newcomerRows(rows, now) {
  const first = new Map();
  for (const r of rows) if (!first.has(r.account) || r.posted < first.get(r.account)) first.set(r.account, r.posted);
  return rows.filter((r) => now - r.posted < 7 * DAY && now - r.posted >= DAY && (r.reach != null
    ? now - first.get(r.account) < 7 * DAY && r.reach <= first.get(r.account) - 14 * DAY
    : r.created && now - r.created < 150 * DAY));
}
// Fast 3-day signal (ChatGPT research 26 Nov): share of the sampled accounts that posted the format, last 3 days vs the 3
// before. C = accounts posting the format, N = sampled accounts posting anything; S = (C + 0.5) / (N + 1). Counts posts,
// not views, so even today's videos count.
export function fastSignal(rows, activity, now) {
  if (!activity) return null;
  const win = (a, b) => { const from = now - a * DAY, to = now - b * DAY;
    const C = new Set(rows.filter((r) => r.posted >= from && r.posted < to).map((r) => r.account)).size;
    const N = Object.values(activity).filter((ts) => ts.some((t) => t >= from && t < to)).length;
    return { C, N, S: (C + 0.5) / (N + 1) }; };
  const last = win(3, 0), prev = win(6, 3), growth = +(last.S / prev.S).toFixed(2);
  const word = last.C >= 3 && growth >= 1.5 ? "HEATING UP" : prev.C >= 3 && growth <= 0.65 ? "COOLING" : "no change";
  return { last: { C: last.C, N: last.N }, prev: { C: prev.C, N: prev.N }, growth, word };
}
// Robustness (ChatGPT research 26 Nov): a rise that disappears without its biggest account is one account's run, not a trend.
function fragileCheck(rows, ver, o, now, recentWeeks) {
  if (!/^(RISING|HEATING|NEW)/.test(ver.word)) return null;
  const n = new Map(); for (const r of rows) if (now - r.posted < 2 * WINDOW * DAY) n.set(r.account, (n.get(r.account) || 0) + 1);
  const top = [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!top) return null;
  const rest = rows.filter((r) => r.account !== top), v2 = verdict(rest, trendTable(rest, o, now), o, now, recentWeeks);
  return /^(RISING|HEATING|NEW)/.test(v2.word) ? null : top;
}
// newcomer hits, newest and fastest first: views per day since posting, 2x+ the account's usual video
export const newcomerHits = (rows, o, now) => newcomerRows(rows, now)
  .filter((r) => (r.usual != null ? r.views >= 2 * Math.max(r.usual, 1) && r.views >= 20000 : r.views >= o.minViews))
  .map((r) => ({ ...r, perDay: Math.round(r.views / Math.max((now - r.posted) / DAY, 1)) })).sort((a, b) => b.perDay - a.perDay);

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

// Reward: the SAME account's format videos, last week vs the week before (median of per-account ratios, accounts with 2+
// videos on each side), so a sample of today's active accounts can't fake it. Entry: new accounts born in the last
// 2 windows vs the average 2 windows before. Newcomer hits: accounts under 150 days with a hit in the last 60 days.
// Day by day for the last 14 days (Jonny 26 Nov): posts, accounts, median views, and views per day since posting, since a
// 1-day-old video has had less time than a 6-day-old one. The daily scout's snapshots will replace this with views at
// the same age.
export function dailyTable(rows, now, days = 14) {
  const out = [];
  for (let d = days; d >= 1; d--) {
    const from = now - d * DAY, to = from + DAY, v = rows.filter((r) => r.posted >= from && r.posted < to);
    out.push({ day: new Date(from * 1000).toISOString().slice(0, 10), videos: v.length, posters: new Set(v.map((r) => r.account)).size,
      medianViews: Math.round(median(v.map((r) => r.views))), perDay: Math.round(median(v.map((r) => r.views / Math.max((now - r.posted) / DAY, 0.5)))) });
  }
  return out;
}

// recentWeeks: how many of the latest weeks count as "now" (TikTok 2; YouTube 1, since a channel's feed holds only its
// 15 latest Shorts, about 2 weeks for a daily poster)
export function verdict(rows, wins, o, now, recentWeeks = 2) {
  const cut = now - FRESH * DAY - recentWeeks * WINDOW * DAY, start = now - FRESH * DAY - o.windows * WINDOW * DAY;
  const ratios = [];
  for (const a of new Set(rows.map((r) => r.account))) {
    const mine = rows.filter((r) => r.account === a && r.posted < now - FRESH * DAY && r.posted >= start);
    const rec = mine.filter((r) => r.posted >= cut).map((r) => r.views), old = mine.filter((r) => r.posted < cut).map((r) => r.views);
    if (rec.length >= 2 && old.length >= 2) ratios.push(median(rec) / Math.max(median(old), 1));
  }
  const reward = ratios.length >= 3 ? +median(ratios).toFixed(2) : null;
  const inRange = rows.filter((r) => r.posted < now - FRESH * DAY && r.posted >= start);
  const recV = inRange.filter((r) => r.posted >= cut).map((r) => r.views), oldV = inRange.filter((r) => r.posted < cut).map((r) => r.views);
  const recentNew = wins.slice(-recentWeeks).reduce((s, w) => s + w.newAccounts, 0);
  const olderNew = wins.slice(0, -recentWeeks).reduce((s, w) => s + w.newAccounts, 0) / Math.max((wins.length - recentWeeks) / recentWeeks, 1);
  const entry = +(recentNew / Math.max(olderNew, 0.5)).toFixed(2);
  // Newcomer odds: accounts under 150 days that tried it in the LAST 7 DAYS (Jonny 26 Nov: trends move fast, a hit from 2
  // weeks ago can be over today), and how many of them got a format video at 2x+ their own usual views (older saved runs
  // without `usual`: the --min-views bar instead). Videos under 1 day are too young to judge.
  const young = newcomerRows(rows, now);
  const newPosters = new Set(young.map((r) => r.account)).size;
  const beat = (r) => (r.usual != null ? r.views >= 2 * Math.max(r.usual, 1) && r.views >= 20000 : r.views >= o.minViews);
  const newHits = new Set(young.filter(beat).map((r) => r.account)).size;
  const newShare = newPosters >= 3 ? +(newHits / newPosters).toFixed(2) : null; // room for one more? (under 3 = unknown)
  // pooled read when too few accounts can be compared with themselves: the recent week(s) vs the ones before, accounts
  // posting per week and median views of all their format videos (more accounts but a lower median = crowding)
  const lastW = wins.slice(-recentWeeks), prevW = wins.slice(0, -recentWeeks);
  const pv = (ws) => rows.filter((r) => ws.some((w) => r.posted >= Date.parse(w.from) / 1000 && r.posted < Date.parse(w.to) / 1000)).map((r) => r.views);
  const lastV = pv(lastW), prevV = pv(prevW);
  const short = lastV.length >= 8 && prevV.length >= 8 ? { posters: (lastW.reduce((s, w) => s + w.posters, 0) / recentWeeks) / Math.max(prevW.reduce((s, w) => s + w.posters, 0) / prevW.length, 0.5),
    views: median(lastV) / Math.max(median(prevV), 1) } : null;
  const shortWord = !short ? null : short.posters >= 1.2 && short.views < 0.7 ? "CROWDING: more accounts per week, lower median views"
    : short.posters >= 1.2 ? "RISING: more accounts per week and views hold"
    : short.views < 0.7 ? "FADING: lower median views" : short.views > 1.4 ? "HEATING UP: higher median views" : "STEADY";
  const word = reward == null && shortWord ? shortWord
    : reward == null && recV.length >= 20 && oldV.length < 6 ? `NEW: nearly all of it was posted in the last ${recentWeeks === 1 ? "week" : recentWeeks + " weeks"}`
    : reward == null ? "too little data (fewer than 3 accounts with history on both sides)"
    : reward >= 1.3 ? "HEATING UP: the same accounts get more views with it now"
    : reward >= 0.8 && (entry >= 1.5 || (short && short.posters >= 1.3)) ? "RISING: still pays, and more accounts are piling in (get in now)"
    : reward >= 0.8 ? "STEADY: still pays as before"
    : entry >= 1.5 || (short && short.posters >= 1.3) ? "CROWDED: more accounts pile in, each video gets less"
    : "FADING: the same accounts get fewer views with it";
  return { word, reward, postersPerWeek: short ? +short.posters.toFixed(2) : null, accountsCompared: ratios.length, entry, newHits, newPosters, newShare };
}

// YouTube Shorts side: Shorts search (this week + this month) finds the channels whose titles match, and each
// channel's Shorts feed gives its 15 latest Shorts with exact dates (followers unknown: the newcomer read uses the
// channel's own usual views and the date its Shorts began).
export function ytRows(f, o) {
  const count = new Map();
  const seen = new Set();
  for (const k of f.keywords) for (const date of [3, 4]) for (const v of ytShortsSearch(k, date)) {
    if (seen.has(v.id) || !f.re.test(v.title)) continue;
    seen.add(v.id);
    const ch = ytChannelOf(v.id);
    if (ch) count.set(ch, (count.get(ch) || 0) + 1);
  }
  const accounts = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, o.accounts).map(([a]) => a), rows = [], activity = {};
  for (const a of accounts) {
    const feed = ytFeed(a);
    activity[a] = feed.videos.map((v) => v.posted).filter(Boolean);
    const usual = median(feed.videos.map((v) => v.views)), reach = Math.min(...feed.videos.map((v) => v.posted || Infinity));
    for (const v of feed.videos) if (v.posted && f.re.test(v.desc))
      rows.push({ platform: "youtube", format: f.name, account: a, followers: null, created: feed.created, usual, reach, posted: v.posted, views: v.views, url: v.url, title: v.title });
  }
  return { rows, accounts: accounts.length, activity };
}

// Gap between the platforms, last 2 weeks (videos under 2 days left out): accounts posting, median views, hits. Hot =
// median 50K+ or 3+ hits; thin = under a third of the other platform's posting accounts, or under 3. Hot on one and thin
// on the other = the format works there and few make it here yet. Both samples are capped at --accounts, so read the
// numbers, not only the word.
export function platformGap(tt, yt, o, now) {
  const side = (rows) => { const v = rows.filter((r) => r.posted >= now - (FRESH + 2 * WINDOW) * DAY && r.posted < now - FRESH * DAY);
    return { posters: new Set(v.map((r) => r.account)).size, videos: v.length, medianViews: Math.round(median(v.map((r) => r.views))), hits: v.filter((r) => r.views >= o.minViews).length }; };
  const a = side(tt), b = side(yt);
  const hot = (x) => x.videos >= 2 && (x.medianViews >= 50000 || x.hits >= 3), thin = (x, y) => x.posters < 3 || x.posters * 3 <= y.posters;
  const word = hot(a) && thin(b, a) ? (b.posters && b.medianViews >= 50000 ? "ROOM ON YOUTUBE: hot on TikTok, few make it on YouTube, and those few do well" : "ROOM ON YOUTUBE: hot on TikTok, thin on YouTube")
    : hot(b) && thin(a, b) ? (a.posters && a.medianViews >= 50000 ? "ROOM ON TIKTOK: hot on YouTube, few make it on TikTok, and those few do well" : "ROOM ON TIKTOK: hot on YouTube, thin on TikTok")
    : hot(a) && hot(b) ? "BOTH: works on both" : !a.videos && !b.videos ? "QUIET on both" : "NO GAP";
  return { word, tiktok: a, youtube: b };
}

// Fetch (or read --from) and judge every format. Returns {now, all rows, report: [{f, wins, ver, rows, newWin, accounts}]}.
export async function runTrend(o) {
  let now = Math.floor(Date.now() / 1000);
  const cache = new Map(); // account -> {videos, profile}, shared between formats
  const all = [], report = [], activities = {};
  const saved = o.from ? JSON.parse(fs.readFileSync(o.from, "utf8")) : null; // --from: rows.json of an earlier run, no fetching
  if (saved) now = saved.now;
  const ytReport = (rows, accounts, activity) => { const wins = trendTable(rows, o, now);
    const ver = verdict(rows, wins.slice(-2), { ...o, windows: 2 }, now, 1); ver.fragile = fragileCheck(rows, ver, { ...o, windows: 2 }, now, 1);
    const start = now - (FRESH + 2 * WINDOW) * DAY;
    // a channel's feed holds its 15 latest Shorts: a daily poster's don't reach the older weeks, which then look empty
    const chans = new Map(rows.map((r) => [r.account, r.reach])), deep = [...chans.values()].filter((t) => t != null && t <= start).length;
    if (ver.reward == null && chans.size && deep < chans.size / 2)
      ver.word = `SHORT HISTORY: the latest 15 Shorts of only ${deep} of ${chans.size} channels reach back 2 weeks; read the gap`;
    return { rows, accounts, wins, ver, days: dailyTable(rows, now), newWin: newcomerHits(rows, o, now), fast: fastSignal(rows, activity, now) }; };
  for (const f of o.formats) {
    if (saved) {
      const mine = saved.rows.filter((r) => r.format === f.name), rows = mine.filter((r) => r.platform !== "youtube"), yrows = mine.filter((r) => r.platform === "youtube");
      const wins = trendTable(rows, o, now), ver = verdict(rows, wins, o, now, 1), act = saved.activities?.[f.name] || {};
      ver.fragile = fragileCheck(rows, ver, o, now, 1);
      const newWin = newcomerHits(rows, o, now);
      report.push({ f, wins, ver, rows, newWin, accounts: new Set(rows.map((r) => r.account)).size, fast: fastSignal(rows, act.tiktok, now),
        yt: ytReport(yrows, new Set(yrows.map((r) => r.account)).size, act.youtube) }); all.push(...mine);
      continue;
    }
    console.error(`${f.name}: keyword pages ${f.keywords.join(", ")}`);
    const words = f.keywords.join(" ").toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const found = await tiktokKeywordPages(f.keywords, o.expand, new RegExp(words.join("|") || ".", "i"));
    const count = new Map();
    for (const v of found) if (v.account && f.re.test(v.desc || v.title)) count.set(v.account, (count.get(v.account) || 0) + 1);
    const accounts = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, o.accounts).map(([a]) => a);
    console.error(`  ${found.length} videos, ${count.size} accounts post it; reading ${accounts.length}`);
    const rows = [], activity = {};
    for (const a of accounts) {
      if (!cache.has(a)) cache.set(a, { videos: tiktokVideos(a, o.videos), profile: tiktokProfile(a) });
      const { videos, profile } = cache.get(a);
      const usual = median(videos.map((v) => v.views || 0)); // the account's usual video, format or not
      const times = videos.map((v) => v.posted).filter(Boolean), reach = times.length ? Math.min(...times) : null;
      activity[a] = times;
      for (const v of videos) if (v.posted && f.re.test(v.desc || v.title))
        rows.push({ platform: "tiktok", format: f.name, account: a, followers: profile.followers, created: profile.created, usual, reach, posted: v.posted, views: v.views, url: v.url, title: v.title, flags: v.flags });
    }
    const wins = trendTable(rows, o, now), ver = verdict(rows, wins, o, now, 1);
    ver.fragile = fragileCheck(rows, ver, o, now, 1);
    const newWin = newcomerHits(rows, o, now);
    const y = o.youtube ? ytRows(f, o) : { rows: [], accounts: 0, activity: {} };
    if (o.youtube) console.error(`  YouTube: ${y.accounts} channels, ${y.rows.length} dated format Shorts`);
    activities[f.name] = { tiktok: activity, youtube: y.activity };
    report.push({ f, wins, ver, rows, newWin, accounts: accounts.length, fast: fastSignal(rows, activity, now), yt: ytReport(y.rows, y.accounts, y.activity) });
    all.push(...rows, ...y.rows);
  }
  for (const r of report) r.gap = platformGap(r.rows, r.yt.rows, o, now);
  return { now, all, report, activities, saved: !!saved };
}

async function main() {
  const o = parseArgs(process.argv);
  fs.mkdirSync(o.out, { recursive: true });
  const { now, all, report, activities, saved } = await runTrend(o);
  if (!saved) fs.writeFileSync(path.join(o.out, "rows.json"), JSON.stringify({ now, rows: all, activities }));
  writeCsv(path.join(o.out, "format-videos.csv"), all.map((r) => ({ ...r, posted: new Date(r.posted * 1000).toISOString().slice(0, 10) })),
    ["format", "account", "followers", "posted", "views", "title", "url"]);
  const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
  let md = `# Format trend (${new Date().toISOString().slice(0, 10)}, TikTok + YouTube Shorts)\n\nWindows of ${WINDOW} days, videos younger than ${FRESH} days left out. ` +
    `Reward = the same accounts' format videos, last week vs the week before (x1.00 = no change). Entry = accounts born last week ` +
    `that post it vs the week before. Without enough accounts to compare with themselves: last week vs the week before, pooled. Hit = ${fmt(o.minViews)}+ views.\n`;
  const fastLine = (x) => x ? `Last 3 days vs the 3 before: ${x.word} (accounts posting it ${x.prev.C} of ${x.prev.N} -> ${x.last.C} of ${x.last.N}, x${x.growth}). ` : "";
  for (const { f, wins, ver, rows, newWin, accounts, yt, gap, fast } of report) {
    md += `\n## ${f.name}: ${ver.word}\n\nReward x${ver.reward ?? "?"} (${ver.accountsCompared} accounts compared), entry x${ver.entry}. ` +
      `${rows.length} format videos from ${accounts} accounts. Newcomer odds: ${ver.newHits} of ${ver.newPosters} accounts new to the format that tried it in the last 7 days beat their own usual views 2x` +
      `${ver.newShare == null ? " (too few to judge room)" : ` (${Math.round(ver.newShare * 100)}%)`}` +
      `${newWin.length ? ` (fastest: ${newWin[0].url} ${fmt(newWin[0].views)}, ${fmt(newWin[0].perDay)} a day)` : ""}. ` +
      fastLine(fast) + (ver.fragile ? `FRAGILE: without @${ver.fragile} the rise disappears. ` : "") + "\n\n" +
      `| Window | Videos | Accounts posting | Accounts born | Median views | Hits |\n|---|---|---|---|---|---|\n` +
      wins.map((w) => `| ${w.from} to ${w.to} | ${w.videos} | ${w.posters} | ${w.newAccounts} | ${fmt(w.medianViews)} | ${w.hits} |`).join("\n") + "\n" +
      `\nLast 14 days, day by day (views still growing: compare views per day):\n\n| Day | Videos | Accounts | Median views | Views per day |\n|---|---|---|---|---|\n` +
      dailyTable(rows, now).map((d) => `| ${d.day} | ${d.videos} | ${d.posters} | ${fmt(d.medianViews)} | ${fmt(d.perDay)} |`).join("\n") + "\n" +
      (yt.accounts ? `\n**YouTube Shorts: ${yt.ver.word}** (${yt.rows.length} dated format Shorts from ${yt.accounts} channels; newcomer odds ${yt.ver.newHits} of ${yt.ver.newPosters})\n\n` +
        `| Window | Videos | Channels posting | Median views | Hits |\n|---|---|---|---|---|\n` +
        yt.wins.map((w) => `| ${w.from} to ${w.to} | ${w.videos} | ${w.posters} | ${fmt(w.medianViews)} | ${w.hits} |`).join("\n") + "\n" : "") +
      `\n**Platform gap, last 2 weeks: ${gap.word}.** TikTok ${gap.tiktok.posters} accounts, ${gap.tiktok.videos} videos, median ${fmt(gap.tiktok.medianViews)}, ${gap.tiktok.hits} hits; ` +
      `YouTube ${gap.youtube.posters} channels, ${gap.youtube.videos} Shorts, median ${fmt(gap.youtube.medianViews)}, ${gap.youtube.hits} hits.\n`;
  }
  md += `\nLimits: only accounts that TikTok's keyword pages show today, so "accounts posting" always looks like it grows; the verdict uses ` +
    `the same-account reward and account birth dates instead. Daily posters' latest ${o.videos} videos may not reach the oldest windows.\n`;
  fs.writeFileSync(path.join(o.out, "trend.md"), md);
  console.error(`wrote ${o.out}/trend.md, format-videos.csv`);
  console.log(report.map((r) => `${r.f.name}: ${r.ver.word} (reward x${r.ver.reward}, entry x${r.ver.entry}, new-account hits ${r.ver.newHits})`).join("\n"));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
