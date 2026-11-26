#!/usr/bin/env node
// Daily scout (Jonny 26 Nov: "scan actively every day for new videos and formats for our niche that go viral and send
// a Telegram notification or ... a website which shows this clearly with references"). Runs every morning on GitHub
// (.github/workflows/scout.yml): small-big scan of our niche, compared with yesterday's history, plus the format trend
// check every day (last 2 weeks: last week vs the week before, and day by day). Writes a web page and sends the top finds to Telegram. On trial.
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
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { parseArgs as scanArgs, runScan, isRepeat } from "./small-big-scan.mjs";
import { parseArgs as trendArgs, runTrend, dailyTable, channelTable, channelSummary } from "./format-trend.mjs";
import { findFormats } from "./format-finder.mjs";

const today = new Date().toISOString().slice(0, 10);
const fmt = (n) => (n == null ? "?" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
const esc = (t) => String(t ?? "").replace(/[\uD800-\uDFFF]/g, (c, i, str) => (/[\uD800-\uDBFF]/.test(c) ? /[\uDC00-\uDFFF]/.test(str[i + 1] || "") : /[\uD800-\uDBFF]/.test(str[i - 1] || "")) ? c : "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const key = (v) => `${v.platform || "tiktok"}:${v.id}`;
// days from spotting a format to our video going live (Jonny's clip threads: about 2 days); picks are judged at that date
const LEAD_DAYS = +(process.env.SCOUT_LEAD_DAYS || 2);

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
    // posted (unix s) lets later runs compare views at the same age (48 h, 7 days) from these daily snapshots
    h.videos[k] = { platform: v.platform, id: v.id, account: v.account, followers: v.followers, title: v.title, url: v.url, posted: v.posted || old?.posted || null,
      first: old?.first || date, last: date, snaps };
  }
  const cutoff = new Date(Date.parse(date) - 45 * 86400e3).toISOString().slice(0, 10);
  for (const [k, v] of Object.entries(h.videos)) if (v.last < cutoff) delete h.videos[k];
  risers.sort((a, b) => b.gain - a.gain);
  return { hist: h, fresh, risers };
}

// Storyboard lead (Astra review 26 Nov): 2+ accounts posted it in the last 3 days and a first-timer beat their usual
// views within 3 days. Cheap action: premise + rough board. Animate needs the full rising read.
const storyboard = (t) => [t, t.yt].some((x) => x && (x.fast?.last.C || 0) >= 2 && (x.newcomers || []).some((h) => h.ageDays != null && h.ageDays <= 3));
// Stage of a format, rising first (Jonny 26 Nov: get into trends that are just rising, never onto dying ones)
export const stage = (t) => { const w = [t.word, t.yt?.word || "", t.gap?.word || "", /^DEVELOPING/.test(t.channels?.word || "") || /^DEVELOPING/.test(t.yt?.channels?.word || "") ? "HEATING" : "", t.fast?.word === "HEATING UP" ? "HEATING" : "", t.yt?.fast?.word === "HEATING UP" ? "HEATING" : ""].join(" ");
  const cooling = t.fast?.word === "COOLING";
  return /RISING|HEATING|NEW|ROOM/.test(w) && !/CROWD|FADING/.test(t.word) && !cooling && !t.fragile ? [0, "up", "Animate: just rising, get in now"]
    : storyboard(t) && !/CROWD|FADING/.test(t.word) && !cooling ? [1, "up", "Storyboard: early lead, 2+ accounts in 3 days and a first-timer hit"]
    : /RISING|HEATING|NEW|ROOM/.test(w) && t.fragile && !/CROWD|FADING/.test(t.word) ? [1, "flat", `Lead: the rise depends on one account (@${t.fragile})`]
    : /RISING|HEATING|NEW|ROOM/.test(w) ? [1, "flat", "Rising on one side, crowded on the other"]
    : /CROWD/.test(w) ? [3, "down", "Crowded: late, skip unless we have a new angle"]
    : /FADING/.test(w) ? [4, "down", "Dying: skip"] : [2, "flat", "Steady"]; };
const stageWord = (t) => stage(t)[2];

// Dashboard (Jonny 26 Nov): tabs Today / Formats / Trends / Accounts; reference videos play in place on click.
export function page({ early, fresh, risers, repeats, trend, found, firstRun, stats, watch }) {
  const tt = (u) => (String(u || "").match(/tiktok\.com\/@[^/]+\/video\/(\d+)/) || [])[1];
  const yt = (u) => (String(u || "").match(/youtube\.com\/shorts\/([\w-]{6,})/) || [])[1];
  const play = (u) => tt(u) ? `data-play="https://www.tiktok.com/player/v1/${tt(u)}?loop=1&rel=0"` : yt(u) ? `data-play="https://www.youtube.com/embed/${yt(u)}"` : "";
  // covers: YouTube's are stable; TikTok's signed links (from the scan) expire after some days, then the black frame shows
  const thumb = (v) => yt(v.url) ? `https://i.ytimg.com/vi/${yt(v.url)}/oar2.jpg` : v.cover;
  const lookCls = (v) => v.fit == null ? "" : v.fit >= 0.5 ? " ours" : v.fit < 0.25 ? " other" : "";
  const card = (v, note) => `<article class="card${lookCls(v)}"><div class=frame ${play(v.url)}>${thumb(v) ? `<img src="${esc(thumb(v))}" alt="" loading=lazy referrerpolicy=no-referrer onerror="this.remove()">` : ""}<button class=go aria-label="Play">&#9654;</button></div>
<div class=meta><b>${fmt(v.views)}</b> views · <b>${v.followers ? Math.round(v.views / Math.max(v.followers, 1)) + "x" : "?"}</b> followers · ${esc(v.name && !/^UC[\w-]{22}$/.test(v.name) ? v.name : v.account)} (${fmt(v.followers)})${note ? ` · ${note}` : ""}
<p>${esc((v.title || "").replace(/\s+/g, " ").slice(0, 110))}</p>${v.look ? `<span class="tag look">${esc(v.look)}${v.fit >= 0.5 ? " · our look" : ""}</span>` : ""}${v.flags ? `<span class=tag>${esc(v.flags)}</span>` : ""}${v.duration && v.duration < 50 ? `<span class=tag>${v.duration} s: stretch to 80 s</span>` : ""}
<a href="${esc(v.url)}" target=_blank rel=noopener>open</a></div></article>`;
  const grid = (vs, note) => vs.length ? `<div class=grid>${vs.map((v) => card(v, note && note(v))).join("")}</div>` : `<p class=muted>None today.</p>`;
  const spark = (xs) => { const m = Math.max(...xs, 1); return `<svg class=spark viewBox="0 0 ${xs.length * 8} 24" aria-hidden=true>${xs.map((x, i) => `<rect x="${i * 8 + 1}" y="${24 - Math.max(1, (22 * x) / m)}" width=6 height="${Math.max(1, (22 * x) / m)}"/>`).join("")}</svg>`; };
  const chTxt = (c) => c && c.judged ? ` · channels: <b class=${/^DEVELOPING/.test(c.word) ? "up" : /^COOLING/.test(c.word) ? "down" : "flat"}>${c.rising} rising, ${c.falling} falling</b>${c.fresh ? `, ${c.fresh} new` : ""}` : "";
  const fastTxt = (x) => x ? ` · last 3 days: <b class=${x.word === "HEATING UP" ? "up" : x.word === "COOLING" ? "down" : "flat"}>${x.word === "no change" ? "no change" : x.word.toLowerCase()}</b> (${x.prev.C} → ${x.last.C} accounts)` : "";
  const hits = (hs) => hs?.length ? `<ul class=hits>${hs.map((h) => `<li><a href="${esc(h.url)}" target=_blank rel=noopener>${esc((h.title || h.account || "video").replace(/\s+/g, " ").slice(0, 60))}</a> <span class=muted>${fmt(h.perDay)}/day · ${fmt(h.views)}</span></li>`).join("")}</ul>` : "";
  const verdictClass = (w) => /RISING|HEATING/.test(w) ? "up" : /CROWD|FADING/.test(w) ? "down" : "flat";
  const fmtRows = (fs) => fs.map((f) => `<details class=fmt><summary>${risingNow(f) ? '<span class="pill up">rising now</span> ' : ''}<b>${esc(f.pattern)}</b> <span class=muted>${f.accounts} accounts · usual video ${f.medianRatio}x followers · ${f.breakouts} breakout${f.breakouts === 1 ? "" : "s"} · ${Math.round(f.recentShare * 100)}% from the last 7 days</span></summary>${grid(f.examples)}</details>`).join("");
  // Jonny 26 Nov: get into trends that are just rising, never onto dying ones. Rising first everywhere.
  const firstTimers = (x) => x?.newPosters == null ? "" : x.newPosters < 3 ? `<p class=first>First-timers: too little evidence (${x.newHits} of ${x.newPosters})</p>`
    : `<p class=first><b>${x.newHits} of ${x.newPosters}</b> first-timers beat their usual views 2x (last 7 days)</p>`;
  const risingNow = (f) => f.recentShare >= 0.5 && f.breakouts >= 1;
  const byRise = (fs) => [...fs].sort((a, b) => risingNow(b) - risingNow(a));
  const ours = byRise((found || []).filter((f) => !f.franchise)), fan = byRise((found || []).filter((f) => f.franchise));
  return `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Trend scout</title><style>
:root{--bg:#fbfaf7;--card:#fff;--fg:#1d1c1a;--muted:#6b6862;--line:#e4e1da;--accent:#b4541a;--up:#2f7d4f;--down:#b23a3a}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#161513;--card:#1f1e1b;--fg:#ecebe7;--muted:#9b978f;--line:#2e2c28;--accent:#e58a4b;--up:#6cc28f;--down:#e07a7a;color-scheme:dark}}
:root[data-theme=dark]{--bg:#161513;--card:#1f1e1b;--fg:#ecebe7;--muted:#9b978f;--line:#2e2c28;--accent:#e58a4b;--up:#6cc28f;--down:#e07a7a;color-scheme:dark}
*{box-sizing:border-box}body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:1200px;padding-block:16px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font-size:22px;margin:4px 0}h2{font-size:17px;margin:24px 0 4px}p{margin:4px 0}.muted{color:var(--muted)}a{color:var(--accent)}
nav{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0;position:sticky;top:0;background:var(--bg);padding:6px 0;z-index:2}
nav button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:20px;padding:6px 14px;cursor:pointer}
nav button[aria-selected=true]{background:var(--fg);color:var(--bg)}section{display:none}section.on{display:block}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin:8px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.frame{aspect-ratio:9/16;background:#000;display:grid;place-items:center;position:relative;overflow:hidden}.frame iframe{border:0;width:100%;height:100%}.frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.go{position:relative}
.go{font-size:28px;width:64px;height:64px;border-radius:50%;border:0;background:#ffffffd0;cursor:pointer}
.meta{padding:8px 10px;font-size:13px}.meta p{margin:4px 0 6px}.tag{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:10px;padding:0 6px;margin-right:4px;color:var(--muted)}
table{border-collapse:collapse;width:100%;display:block;overflow-x:auto}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;font-size:14px;vertical-align:middle}
th{color:var(--muted);font-weight:500}td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.up{color:var(--up)}.down{color:var(--down)}.spark{width:64px;height:24px;fill:var(--accent)}h3{font-size:16px;margin:0 0 6px}.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin:8px 0}.tcard{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}.plat{display:flex;align-items:center;gap:8px;margin-top:6px}.plat .spark{margin-left:auto}.only{display:flex;gap:8px;align-items:center;margin:8px 0;font-size:14px}body.hide .card.other{display:none}.tag.look{border-color:var(--accent);color:var(--accent)}.pill{display:inline-block;font-size:12px;font-weight:600;border:1px solid currentColor;border-radius:10px;padding:0 8px;margin:0 0 6px}.first{font-size:15px;margin:0 0 4px}.hits{margin:4px 0 6px;padding-left:18px;font-size:13px}.hits li{margin:2px 0}.gap{border-top:1px solid var(--line);margin-top:8px;padding-top:8px}details.fmt{border-bottom:1px solid var(--line);padding:8px 0}summary{cursor:pointer}
</style></head><body>
<h1>Trend scout</h1><p class=muted>${today} · small accounts (under ${fmt(stats.maxFollowers)} followers) in animation, funny animation, comedy and comedy sketches on TikTok and YouTube Shorts · ${stats.videos} videos read, ${stats.accounts} small accounts opened. Lessons, not copies.${firstRun ? " First run: \"new\" and \"risers\" fill in from tomorrow." : ""}</p>
<label class=only><input type=checkbox id=only checked> Only videos that look animated, like ours (cover check)</label>
<nav role=tablist>${["Today", "Formats", "Trends", "Accounts"].map((t, i) => `<button role=tab aria-selected=${i === 0} data-tab=${t}>${t}</button>`).join("")}</nav>
<section id=Today class=on><h2>Early breakouts</h2><p class=muted>Under 4 days old and already 10x the account's followers. Act on these first.</p>${grid(early, (v) => `${v.ageDays} d old`)}
<h2>Fastest risers since the last run</h2><p class=muted>Views gained since the last scan: the 24 and 48 hour signal.</p>${grid(risers, (v) => `+${fmt(v.gain)}`)}
<h2>New breakouts</h2><p class=muted>Over 10x followers and the views bar, not seen in an earlier run.</p>${grid(fresh)}</section>
<section id=Formats><h2>Formats found today</h2><p class=muted>Caption patterns that 3+ different small accounts use. "Rising now" = most of its videos are from the last 7 days and it already has a breakout: those come first. Open one to watch its best examples.</p>${fmtRows(ours) || "<p class=muted>None today.</p>"}
${fan.length ? `<h2>Fandom trends (someone else's characters)</h2><p class=muted>Big on reach, but not ours to make.</p>${fmtRows(fan)}` : ""}
${watch?.length ? `<h2>10 random clips to watch muted</h2><p class=muted>Small-account clips the caption finder did not flag. Watch each with the sound off and write one sentence: the setup and the reversal (e.g. "a referee shows a forbidden move and gets penalized for it"). That finds joke mechanisms captions can't show.</p>${grid(watch)}` : ""}</section>
<section id=Trends><h2>Our formats${trend ? ` (${trend.date})` : ""}</h2>${trend ? `<p class=muted>Last 2 weeks only, TikTok and YouTube Shorts each judged on its own: last week vs the week before. Reward = the same accounts' views with the format (1.0 = no change). Newcomers = accounts that posted it for the first time in the last 7 days and beat their own usual views 2x: room for one more creator. "Channels" = each channel's views with it, last week vs the week before (x1.3 up = rising, x0.7 = falling): several rising at once = a trend developing. "Last 3 days" = how many sampled accounts posted it in the last 3 days vs the 3 before. A rise that disappears without its biggest account is shown as a lead, not a trend. Their videos are listed fastest first (views per day). Bars = views per day of the videos posted on each of the last 14 days.</p>
<div class=tgrid>${[...trend.formats].sort((a, b) => stage(a)[0] - stage(b)[0]).map((t) => `<article class=tcard><h3>${esc(t.name)}</h3><p class="pill ${stage(t)[1]}">${stage(t)[2]}</p>
${firstTimers(t)}<div class=plat><span class=muted>TikTok</span> <b class=${verdictClass(t.word)}>${esc(t.word.split(":")[0])}</b>${spark(t.days || [])}</div>
<p class=muted>Reward ${t.reward ?? "?"} · accounts/week ${t.postersPerWeek ?? "?"}${chTxt(t.channels)}${fastTxt(t.fast)}</p>${hits(t.newcomers)}
<div class=plat><span class=muted>YouTube</span> ${t.yt ? `<b class=${verdictClass(t.yt.word)}>${esc(t.yt.word.split(":")[0])}</b>${spark(t.yt.days || [])}` : "?"}</div>${t.yt?.newPosters != null ? `<p class=muted>First-timers ${t.yt.newHits} of ${t.yt.newPosters}${chTxt(t.yt.channels)}${fastTxt(t.yt.fast)}</p>` : ""}${hits(t.yt?.newcomers)}
${t.gap ? `<p class="gap ${/^ROOM/.test(t.gap.word) ? "up" : ""}"><b>${esc(t.gap.word.split(":")[0])}</b> <span class=muted>last 2 weeks: TikTok ${t.gap.tiktok.posters} accounts, median ${fmt(t.gap.tiktok.medianViews)}, ${t.gap.tiktok.hits} hits · YouTube ${t.gap.youtube.posters} channels, median ${fmt(t.gap.youtube.medianViews)}, ${t.gap.youtube.hits} hits</span></p>` : ""}</article>`).join("")}</div>
<p class=muted>Gap: ROOM ON YOUTUBE / ROOM ON TIKTOK = the format pays on one platform (median 50K+ or 3+ hits in 2 weeks) while few accounts make it on the other. That is where we can be early.</p>` : "<p class=muted>Not run yet.</p>"}</section>
<section id=Accounts><h2>Repeat breakers (formats, not luck)</h2><p class=muted>Small accounts that beat their following again and again. Best and worst video side by side: the worst shows what fails.</p>
${repeats.map((a) => `<h2>${esc(a.name)} <span class=muted>${a.platform} · ${fmt(a.followers)} followers · ${a.breakouts} breakouts · usual video ${a.medianRatio}x · <a href="${esc(a.url)}" target=_blank rel=noopener>account</a></span></h2>${grid([a.best && { ...a.best, account: a.account, followers: a.followers }, a.worst && { ...a.worst, account: a.account, followers: a.followers }].filter(Boolean), (v) => v === a.best || v.url === a.best?.url ? "best" : "worst")}`).join("") || "<p class=muted>None today.</p>"}</section>
<script>
document.querySelectorAll("nav button").forEach((b) => b.onclick = () => {
  document.querySelectorAll("nav button").forEach((x) => x.setAttribute("aria-selected", x === b));
  document.querySelectorAll("section").forEach((s) => s.classList.toggle("on", s.id === b.dataset.tab));
  try { localStorage.setItem("tab", b.dataset.tab); } catch (e) {}
});
try { const t = localStorage.getItem("tab"); if (t) document.querySelector('nav button[data-tab="' + t + '"]')?.click(); } catch (e) {}
const only = document.getElementById("only"), setOnly = () => document.body.classList.toggle("hide", only.checked);
try { const k = localStorage.getItem("only"); if (k != null) only.checked = k === "1"; } catch (e) {}
only.onchange = () => { setOnly(); try { localStorage.setItem("only", only.checked ? "1" : "0"); } catch (e) {} }; setOnly();
document.addEventListener("click", (e) => { const f = e.target.closest(".frame[data-play]"); if (!f || f.querySelector("iframe")) return;
  f.innerHTML = '<iframe src="' + f.dataset.play + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading=lazy></iframe>'; });
</script></body></html>`;
}

// Look check (tools/look-check.py, free CLIP on the cover): marks each shown video animated (our look) or not, in place.
// Skipped when python or its packages are missing (LOOK_PYTHON picks the interpreter).
const LOOK_NAMES = { "3d": "3D cartoon", "2d": "2D cartoon", stick: "stick figures", real: "real people", selfie: "selfie video", game: "game footage", anime: "anime", text: "text" };
function lookCheck(vs) {
  const ytId = (u) => (String(u).match(/youtube\.com\/shorts\/([\w-]{6,})/) || [])[1];
  const todo = [...new Map(vs.filter(Boolean).map((v) => [v.url, ytId(v.url) ? `https://i.ytimg.com/vi/${ytId(v.url)}/hqdefault.jpg` : v.cover]).filter(([, c]) => c)).entries()];
  if (!todo.length) return;
  const r = spawnSync(process.env.LOOK_PYTHON || "python3", [path.join(path.dirname(new URL(import.meta.url).pathname), "look-check.py"), ...(process.env.LOOK_MODEL_DIR ? [process.env.LOOK_MODEL_DIR] : [])],
    { input: todo.map(([u, c]) => `${u}\t${c}`).join("\n") + "\n", encoding: "utf8", maxBuffer: 16e6, timeout: 900e3 });
  let res = {};
  try { res = JSON.parse(r.stdout); } catch { console.error(`look check skipped: ${(r.stderr || r.error?.message || "").split("\n").filter(Boolean).pop() || "no output"}`); return; }
  for (const v of vs) if (v && res[v.url]) { v.fit = res[v.url].fit; v.look = LOOK_NAMES[res[v.url].look] || res[v.url].look; }
  console.error(`look check: ${Object.values(res).filter((x) => x && x.fit >= 0.5).length} of ${todo.length} covers look animated`);
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
    const t = await runTrend(trendArgs(["node", "trend", "--preset", "ours"]));
    h2.trend = { date: today, formats: t.report.map(({ f, ver, newWin, rows, yt, gap, fast }) => ({ name: f.name, ...ver, fast, channels: channelSummary(channelTable(rows, t.now)), days: dailyTable(rows, t.now).map((d) => d.perDay),
      best: newWin[0] ? { url: newWin[0].url, views: newWin[0].views, perDay: newWin[0].perDay } : null,
      newcomers: newWin.slice(0, 3).map((r) => ({ url: r.url, views: r.views, perDay: r.perDay, ageDays: Math.floor((t.now - r.posted) / 86400), title: r.title, account: r.account, platform: "tiktok" })),
      yt: { word: yt.ver.word, fragile: yt.ver.fragile, fast: yt.fast, channels: channelSummary(channelTable(yt.rows, t.now)), days: yt.days.map((d) => d.perDay), channels: yt.accounts, newHits: yt.ver.newHits, newPosters: yt.ver.newPosters,
        newcomers: yt.newWin.slice(0, 3).map((r) => ({ url: r.url, views: r.views, perDay: r.perDay, ageDays: Math.floor((t.now - r.posted) / 86400), title: r.title, account: r.account, platform: "youtube" })) }, gap })) };
  }
  const repeats = ranked.filter(isRepeat);
  const found = findFormats(vids.filter(small), { minAccounts: 3, top: 30 });
  // 10 random small-account clips (20 s+) the finder didn't use, the same pick all day (seeded by date)
  const used = new Set(found.flatMap((f) => f.examples.map((e) => e.url)));
  const watch = vids.filter((v) => small(v) && !used.has(v.url) && (v.duration == null || v.duration >= so.minSeconds))
    .sort((a, b) => crypto.createHash("md5").update(today + a.url).digest("hex").localeCompare(crypto.createHash("md5").update(today + b.url).digest("hex"))).slice(0, 10);
  lookCheck([...early, ...freshBreaks, ...risers.slice(0, 15), ...repeats.flatMap((a) => [a.best, a.worst]), ...found.flatMap((f) => f.examples), ...watch]);
  const html = page({ watch, found, early, fresh: freshBreaks, risers: risers.filter((r) => r.gain > 0).slice(0, 15), repeats, trend: h2.trend, firstRun,
    stats: { videos: vids.length, accounts: cands.length, maxFollowers: so.maxFollowers } });
  fs.writeFileSync(path.join(o.site, "index.html"), html);
  if (!o.smoke) fs.writeFileSync(histFile, JSON.stringify(h2));
  // the week's picks, saved before the next week's results exist: after 4+ weeks, check whether they found the next
  // breakouts better than a plain most-viewed list (Jonny 26 Nov)
  // Every day (Astra review 26 Nov): each pick carries the date our video could go live (today + LEAD_DAYS); a pick counts
  // as good only if first-timers posting it around that date still beat their usual views 2x at 48 h. The most-viewed list
  // from the same scan is the baseline to beat.
  const publishBy = new Date(Date.now() + LEAD_DAYS * 86400e3).toISOString().slice(0, 10);
  if (!o.smoke && o.trend) fs.writeFileSync(path.join(o.data, `shortlist-${today}.json`), JSON.stringify({
    date: today, publishBy, picks: (h2.trend?.formats || []).map((t) => ({ name: t.name, stage: stageWord(t) })).filter((p) => /^(Animate|Storyboard)/.test(p.stage)),
    repeats: repeats.map((a) => ({ platform: a.platform, account: a.account, followers: a.followers, best: a.best?.url })),
    early: early.map((v) => v.url), mostViewed: [...vids].sort((a, b) => b.views - a.views).slice(0, 20).map((v) => v.url),
    trend: h2.trend?.formats.map((t) => ({ name: t.name, word: t.word.split(":")[0], reward: t.reward, entry: t.entry, newShare: t.newShare })) }));
  const top = [...early.slice(0, 3), ...freshBreaks.slice(0, 3)];
  const msg = `Trend scout ${today}: ${early.length} early breakouts, ${freshBreaks.length} new breakouts, ${repeats.length} repeat breakers.\n\n` +
    top.map((v, i) => `${i + 1}. @${v.account} (${fmt(v.followers)} followers): ${fmt(v.views)} views. ${(v.title || "").replace(/\s+/g, " ").slice(0, 80)}\n${v.url}`).join("\n\n") +
    (h2.trend && o.trend ? `\n\nFormats: ${h2.trend.formats.map((t) => `${t.name} ${t.word.split(":")[0]}`).join(", ")}` : "") +
    (h2.trend && o.trend && h2.trend.formats.some((t) => /^ROOM/.test(t.gap?.word || "")) ? `\nPlatform gaps: ${h2.trend.formats.filter((t) => /^ROOM/.test(t.gap?.word || "")).map((t) => `${t.name}: ${t.gap.word.split(":")[0].toLowerCase()}`).join(", ")}` : "") +
    (process.env.PAGE_URL ? `\n\nAll finds: ${process.env.PAGE_URL}` : "");
  console.log(msg);
  if (o.telegram && !o.smoke) telegram(msg);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
