#!/usr/bin/env node
// Daily scout (Jonny 26 Nov: "scan actively every day for new videos and formats for our niche that go viral and send
// a Telegram notification or ... a website which shows this clearly with references"). Runs every morning on GitHub
// (.github/workflows/scout.yml): small-big scan of our niche, compared with yesterday's history, plus the format trend
// check on Mondays. Writes a web page and sends the top finds to Telegram. On trial.
//
//   node tools/daily-scout.mjs --data <history dir> --site <page dir> [--trend] [--telegram] [--smoke]
//
// Early breakout = a video under 4 days old already at 10x its account's followers (and 50K+ views).
// New breakout = a small-account video over the scan's bar that no earlier run listed.
// Fastest risers = videos from earlier runs whose views grew most since the last run (the 24/48 h signal).
// Telegram: TELEGRAM_BOT_TOKEN (and TELEGRAM_CHAT_ID; without it the chat that last wrote to the bot is used).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseArgs as scanArgs, runScan, isRepeat } from "./small-big-scan.mjs";
import { parseArgs as trendArgs, runTrend } from "./format-trend.mjs";

const today = new Date().toISOString().slice(0, 10);
const fmt = (n) => (n == null ? "?" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const key = (v) => `${v.platform || "tiktok"}:${v.id}`;

export function parseArgs(argv) {
  const o = { data: "out/scout-data", site: "out/scout-site", trend: false, telegram: false, smoke: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--data") o.data = argv[++i];
    else if (a === "--site") o.site = argv[++i];
    else if (a === "--trend") o.trend = true;
    else if (a === "--telegram") o.telegram = true;
    else if (a === "--smoke") o.smoke = true;
    else throw new Error(`unknown option ${a}`);
  }
  return o;
}

// history = {videos: {key: {first, last, snaps: {date: views}, ...}}, trend: {date, formats}}; keeps 45 days
export function mergeHistory(hist, seen, date) {
  const h = { videos: { ...(hist.videos || {}) }, trend: hist.trend || null };
  const fresh = [], risers = [];
  for (const v of seen) {
    const k = key(v), old = h.videos[k];
    if (!old) fresh.push(v);
    const snaps = { ...(old?.snaps || {}), [date]: v.views };
    const dates = Object.keys(snaps).sort(), prev = dates.length > 1 ? dates[dates.length - 2] : null;
    if (prev && date !== prev) risers.push({ ...v, gain: v.views - snaps[prev], since: prev });
    h.videos[k] = { platform: v.platform, id: v.id, account: v.account, followers: v.followers, title: v.title, url: v.url,
      first: old?.first || date, last: date, snaps };
  }
  const cutoff = new Date(Date.parse(date) - 45 * 86400e3).toISOString().slice(0, 10);
  for (const [k, v] of Object.entries(h.videos)) if (v.last < cutoff) delete h.videos[k];
  risers.sort((a, b) => b.gain - a.gain);
  return { hist: h, fresh, risers };
}

function page({ early, fresh, risers, repeats, trend, firstRun, stats }) {
  const vrow = (v) => `<tr><td><a href="${esc(v.url)}">${esc((v.title || "(no caption)").slice(0, 90))}</a>${v.flags ? ` <span class=muted>(${esc(v.flags)})</span>` : ""}${v.duration && v.duration < 50 ? ` <span class=muted>(${v.duration} s: a theme to stretch to 80 s)</span>` : ""}</td><td>${esc(v.account)}</td>` +
    `<td class=n>${fmt(v.followers)}</td><td class=n>${fmt(v.views)}</td><td class=n>${v.followers ? Math.round(v.views / Math.max(v.followers, 1)) + "x" : "?"}</td>` +
    `${v.gain != null ? `<td class=n>+${fmt(v.gain)}</td>` : v.ageDays != null ? `<td class=n>${v.ageDays} d</td>` : "<td></td>"}</tr>`;
  const vtab = (rows, last) => rows.length ? `<table><tr><th>Video</th><th>Account</th><th>Followers</th><th>Views</th><th>vs followers</th><th>${last}</th></tr>${rows.map(vrow).join("")}</table>` : "<p class=muted>None today.</p>";
  const arow = (a) => `<tr><td><a href="${esc(a.url)}">${esc(a.name)}</a> <span class=muted>${a.platform}</span></td><td class=n>${fmt(a.followers)}</td>` +
    `<td class=n>${a.breakouts}</td><td class=n>${a.medianRatio}x</td><td><a href="${esc(a.best?.url)}">${esc((a.best?.title || "best").slice(0, 70))}</a> ${fmt(a.best?.views)}</td>` +
    `<td>${a.worst ? `<a href="${esc(a.worst.url)}">worst</a> ${fmt(a.worst.views)}` : ""}</td></tr>`;
  const trow = (t) => `<tr><td>${esc(t.name)}</td><td><b>${esc(t.word.split(":")[0])}</b>${esc(t.word.includes(":") ? ":" + t.word.split(":").slice(1).join(":") : "")}</td>` +
    `<td class=n>${t.reward ?? "?"}</td><td class=n>${t.entry ?? "?"}</td><td class=n>${t.newHits ?? "?"} of ${t.newPosters ?? "?"}</td>` +
    `<td>${t.best ? `<a href="${esc(t.best.url)}">newcomer hit</a> ${fmt(t.best.views)}` : ""}</td></tr>`;
  return `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Trend scout</title><style>
:root{--bg:#fbfaf7;--fg:#1d1c1a;--muted:#6b6862;--line:#e4e1da;--accent:#b4541a}
@media (prefers-color-scheme:dark){:root{--bg:#161513;--fg:#ecebe7;--muted:#9b978f;--line:#2e2c28;--accent:#e58a4b}}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:1100px;padding:16px}
h1{font-size:22px;margin:8px 0 2px}h2{font-size:17px;margin:28px 0 6px;color:var(--accent)}
p{margin:4px 0}.muted{color:var(--muted)}a{color:inherit}table{border-collapse:collapse;width:100%;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top;font-size:14px}th{color:var(--muted);font-weight:500}
td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}</style></head><body>
<h1>Trend scout, ${today}</h1>
<p class=muted>Small accounts (under ${fmt(stats.maxFollowers)} followers) in animation, funny animation, comedy and comedy sketches on TikTok and YouTube Shorts. ${stats.videos} videos read today, ${stats.accounts} small accounts opened. Lessons, not copies.${firstRun ? " First run: today's finds are the starting point, so \"new\" and \"risers\" fill in from tomorrow." : ""}</p>
<h2>Early breakouts</h2><p class=muted>Under 4 days old and already 10x the account's followers. Act on these first.</p>${vtab(early, "Age")}
<h2>Fastest risers since the last run</h2><p class=muted>The 24 and 48 hour signal: views gained since the last scan.</p>${vtab(risers, "Gained")}
<h2>New breakouts</h2><p class=muted>Over 10x followers and the views bar, not seen in an earlier run.</p>${vtab(fresh, "Age")}
<h2>Repeat breakers (formats, not luck)</h2><table><tr><th>Account</th><th>Followers</th><th>Breakouts</th><th>Usual video</th><th>Best</th><th>Worst</th></tr>${repeats.map(arow).join("") || "<tr><td colspan=6 class=muted>None today.</td></tr>"}</table>
<h2>Format trends${trend ? ` (${trend.date})` : ""}</h2>${trend ? `<p class=muted>Reward = the same accounts' views with the format, last 8 weeks vs before (1.0 = no change). Entry = new accounts piling in (1.0 = as before). Newcomers = new accounts that tried it lately and beat their own usual views 2x: the room for one more creator. Grey notes mark borrowed audio or someone else's characters, the part we can't make our own.</p><table><tr><th>Format</th><th>Verdict</th><th>Reward</th><th>Entry</th><th>Newcomers</th><th>Example</th></tr>${trend.formats.map(trow).join("")}</table>` : "<p class=muted>Runs on Mondays.</p>"}
</body></html>`;
}

function telegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.error("telegram: no TELEGRAM_BOT_TOKEN, skipped"); return; }
  const api = (m, args) => JSON.parse(spawnSync("curl", ["-sS", "--max-time", "30", `https://api.telegram.org/bot${token}/${m}`, ...args], { encoding: "utf8" }).stdout || "{}");
  let chat = process.env.TELEGRAM_CHAT_ID;
  if (!chat) { // no id set: the chat that last wrote to the bot (send the bot any message once)
    const u = api("getUpdates", []).result || [];
    chat = u.length ? (u[u.length - 1].message || u[u.length - 1].channel_post)?.chat?.id : null;
  }
  if (!chat) { console.error("telegram: no chat yet; send the bot a message once"); return; }
  const r = api("sendMessage", ["--data-urlencode", `chat_id=${chat}`, "--data-urlencode", `text=${text}`, "--data-urlencode", "disable_web_page_preview=true"]);
  console.error(`telegram: ${r.ok ? "sent" : "failed " + (r.description || "")}`);
}

async function main() {
  const o = parseArgs(process.argv);
  fs.mkdirSync(o.data, { recursive: true }); fs.mkdirSync(o.site, { recursive: true });
  const so = scanArgs(["node", "scan", ...(o.smoke ? ["--keywords", "funny animation", "--deep", "3", "--videos", "10"] : ["--expand", "3", "--deep", "60"])]);
  const { vids, cands, ranked } = await runScan(so);
  if (o.smoke && !vids.some((v) => v.platform === "tiktok")) throw new Error("smoke: TikTok keyword page gave no videos on this machine");
  const histFile = path.join(o.data, "history.json");
  const hist = fs.existsSync(histFile) ? JSON.parse(fs.readFileSync(histFile, "utf8")) : {};
  const firstRun = !hist.videos;
  const small = (v) => v.followers != null && v.followers <= so.maxFollowers;
  const breaks = ranked.flatMap((a) => (a.breakVideos || []).map((v) => ({ ...v, platform: a.platform, account: a.account, followers: a.followers })));
  const early = vids.filter((v) => small(v) && v.ageDays != null && v.ageDays <= 3 && v.views >= 50000 && v.views >= 10 * Math.max(v.followers, 1) &&
    (v.duration == null || v.duration >= so.minSeconds))
    .sort((a, b) => b.views / Math.max(b.followers, 1) - a.views / Math.max(a.followers, 1)).slice(0, 15);
  const track = [...new Map([...vids.filter(small), ...breaks].map((v) => [key(v), v])).values()];
  const { hist: h2, fresh, risers } = mergeHistory(hist, track, today);
  const freshBreaks = firstRun ? [] : breaks.filter((v) => fresh.some((f) => key(f) === key(v))).slice(0, 20);
  if (o.trend) {
    const t = await runTrend(trendArgs(["node", "trend", "--preset", "ours", "--accounts", "20"]));
    h2.trend = { date: today, formats: t.report.map(({ f, ver, newWin }) => ({ name: f.name, ...ver, best: newWin[0] ? { url: newWin[0].url, views: newWin[0].views } : null })) };
  }
  const repeats = ranked.filter(isRepeat);
  const html = page({ early, fresh: freshBreaks, risers: risers.filter((r) => r.gain > 0).slice(0, 15), repeats, trend: h2.trend, firstRun,
    stats: { videos: vids.length, accounts: cands.length, maxFollowers: so.maxFollowers } });
  fs.writeFileSync(path.join(o.site, "index.html"), html);
  if (!o.smoke) fs.writeFileSync(histFile, JSON.stringify(h2));
  // the week's picks, saved before the next week's results exist: after 4+ weeks, check whether they found the next
  // breakouts better than a plain most-viewed list (Jonny 26 Nov)
  if (!o.smoke && o.trend) fs.writeFileSync(path.join(o.data, `shortlist-${today}.json`), JSON.stringify({
    date: today, repeats: repeats.map((a) => ({ platform: a.platform, account: a.account, followers: a.followers, best: a.best?.url })),
    early: early.map((v) => v.url), mostViewed: [...vids].sort((a, b) => b.views - a.views).slice(0, 20).map((v) => v.url),
    trend: h2.trend?.formats.map((t) => ({ name: t.name, word: t.word.split(":")[0], reward: t.reward, entry: t.entry, newShare: t.newShare })) }));
  const top = [...early.slice(0, 3), ...freshBreaks.slice(0, 3)];
  const msg = `Trend scout ${today}: ${early.length} early breakouts, ${freshBreaks.length} new breakouts, ${repeats.length} repeat breakers.\n\n` +
    top.map((v, i) => `${i + 1}. @${v.account} (${fmt(v.followers)} followers): ${fmt(v.views)} views. ${(v.title || "").replace(/\s+/g, " ").slice(0, 80)}\n${v.url}`).join("\n\n") +
    (h2.trend && o.trend ? `\n\nFormats: ${h2.trend.formats.map((t) => `${t.name} ${t.word.split(":")[0]}`).join(", ")}` : "") +
    (process.env.PAGE_URL ? `\n\nAll finds: ${process.env.PAGE_URL}` : "");
  console.log(msg);
  if (o.telegram && !o.smoke) telegram(msg);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
