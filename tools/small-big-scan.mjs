#!/usr/bin/env node
// Small account, big views: finds TikTok + YouTube Shorts accounts with few followers whose videos get far more views
// than their following, then ranks the accounts that do it AGAIN AND AGAIN (a repeat = a format, a one-off = maybe luck).
// On trial since 26 Nov 2026. What it reads and what it cannot see: docs/research/small-big-scan.md.
//
//   node tools/small-big-scan.mjs                                  # default keywords, both platforms
//   node tools/small-big-scan.mjs --keywords "court animation,kid vs dad" --expand 2 --out out/small-big
//   node tools/small-big-scan.mjs --seed handles.txt --no-youtube   # also score these TikTok handles (one per line)
//
// Options: --max-followers 10000  --min-ratio 10 (views / followers)  --min-views 200000  --days 180
//          --deep 40 (accounts to open, best first)  --videos 30 (latest videos per account)  --expand 0 (related
//          TikTok keyword pages per keyword)  --no-tiktok  --no-youtube  --out <dir>
// Needs: curl, yt-dlp (pip install yt-dlp) for TikTok account lists, Chromium (playwright-core) for TikTok keyword
// pages. Public pages only: no login, no paid API. Runs from the cloud container (US results).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Our niche (Jonny 26 Nov): animation, funny animation, comedy, comedy sketches. Topic keywords go in --keywords.
const DEFAULT_KEYWORDS = [
  "animation", "funny animation", "comedy", "comedy sketch", "comedy skit", "animated comedy", "animated skit",
  "cartoon comedy", "funny cartoon", "comedy animation", "animation meme", "sketch comedy", "animated sketch",
  "3d animation funny", "2d animation funny", "funny animation story",
];

export function parseArgs(argv) {
  const o = { keywords: DEFAULT_KEYWORDS, maxFollowers: 10000, minRatio: 10, minViews: 200000, days: 180, deep: 40,
    videos: 30, expand: 0, tiktok: true, youtube: true, seed: null, out: `out/small-big-${new Date().toISOString().slice(0, 10)}` };
  const num = { "--max-followers": "maxFollowers", "--min-ratio": "minRatio", "--min-views": "minViews", "--days": "days",
    "--deep": "deep", "--videos": "videos", "--expand": "expand" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (num[a]) o[num[a]] = Number(argv[++i]);
    else if (a === "--keywords") o.keywords = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--seed") o.seed = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--no-tiktok") o.tiktok = false;
    else if (a === "--no-youtube") o.youtube = false;
    else throw new Error(`unknown option ${a}`);
  }
  return o;
}

// ---------- small helpers ----------
const CACHE = path.join(os.tmpdir(), "small-big-cache");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function curl(url, lang = "en-US,en;q=0.9") {
  fs.mkdirSync(CACHE, { recursive: true });
  const f = path.join(CACHE, crypto.createHash("md5").update(url).digest("hex"));
  if (!fs.existsSync(f) || Date.now() - fs.statSync(f).mtimeMs > 20 * 3600e3) {
    spawnSync("curl", ["-sS", "-L", "--max-time", "30", "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      "-H", `Accept-Language: ${lang}`, "-b", "CONSENT=YES+1; PREF=hl=en&gl=US", url, "-o", f]);
  }
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
}
export function shortNum(t) { // "1.2M views" -> 1200000, "12,345" -> 12345
  if (t == null) return null;
  const m = String(t).replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  return m ? Math.round(parseFloat(m[1]) * ({ "": 1, K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()])) : null;
}
export function agoDays(t) { // "3 weeks ago" -> 21
  const m = String(t || "").match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
  if (!m) return null;
  return +m[1] * { second: 0, minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 }[m[2]];
}
export const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
function walk(o, key, acc = []) {
  if (Array.isArray(o)) o.forEach((v) => walk(v, key, acc));
  else if (o && typeof o === "object") { if (key in o) acc.push(o[key]); Object.values(o).forEach((v) => walk(v, key, acc)); }
  return acc;
}
const txt = (o) => (o ? o.simpleText ?? (o.runs || []).map((r) => r.text).join("") ?? o.content : null);
function initData(html) {
  const m = html.match(/var ytInitialData\s*=\s*(\{.*?\});<\/script>/s);
  try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; }
}

// ---------- YouTube Shorts ----------
function ytSp(date) { // sort by views, upload date (4 = this month, 5 = this year), type = Shorts
  const f = Buffer.from([0x08, date, 0x10, 0x09]);
  return encodeURIComponent(Buffer.concat([Buffer.from([0x08, 0x03, 0x12, f.length]), f]).toString("base64"));
}
export function ytSearchVideos(data) {
  const out = [];
  for (const v of walk(data, "videoRenderer")) {
    const run = v.ownerText?.runs?.[0];
    const id = run?.navigationEndpoint?.browseEndpoint?.browseId;
    if (!id) continue;
    out.push({ platform: "youtube", account: id, name: run.text, id: v.videoId, url: `https://www.youtube.com/shorts/${v.videoId}`,
      title: txt(v.title), views: shortNum(txt(v.viewCountText)), ageDays: agoDays(txt(v.publishedTimeText)), followers: null });
  }
  return out;
}
export function ytChannel(html) {
  const subs = html.match(/"([\d.,]+[KMB]?) subscribers"/);
  const handle = html.match(/"canonicalBaseUrl":"\/(@[^"]+)"/);
  const shorts = walk(initData(html), "shortsLockupViewModel").map((x) => ({
    id: walk(x, "videoId")[0], title: x.overlayMetadata?.primaryText?.content,
    views: (() => { const s = x.overlayMetadata?.secondaryText?.content || ""; return s.startsWith("No") ? 0 : shortNum(s); })(),
  })).filter((x) => x.id && x.views != null);
  return { followers: subs ? shortNum(subs[1]) : null, handle: handle?.[1] ?? null, videos: shorts };
}

// ---------- TikTok ----------
export async function tiktokKeywordPages(keywords, expand, keep = /anima|cartoon|skit|sketch|comed|funny|3d|comic/i) {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({ executablePath: findChrome(), args: ["--no-sandbox"] });
  const page = await browser.newPage({ locale: "en-US", viewport: { width: 1280, height: 900 } });
  const found = [], seen = new Set(), queue = keywords.map((k) => ({ k, depth: 0 }));
  let related = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (!/\/api\/seo\/kap\/(video_list|related_keywords)/.test(u)) return;
    const j = await r.json().catch(() => ({}));
    for (const it of j.videoList || []) found.push(tiktokItem(it));
    related.push(...(j.relatedKeywords || []).map((x) => x.formattedWord));
  });
  while (queue.length) {
    const { k, depth } = queue.shift();
    const slug = k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (seen.has(slug)) continue;
    seen.add(slug); related = [];
    try {
      await page.goto(`https://www.tiktok.com/discover/${slug}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(6000);
      await page.mouse.wheel(0, 5000); await page.waitForTimeout(2000);
    } catch (e) { console.error(`  tiktok ${slug}: ${e.message.split("\n")[0]}`); }
    if (depth === 0 && expand > 0) // related pages, only those that stay on topic
      related.filter((w) => keep.test(w)).slice(0, expand).forEach((w) => queue.push({ k: w, depth: 1 }));
    console.error(`  tiktok ${slug}: ${found.length} videos so far`);
  }
  await browser.close();
  return found;
}
export function tiktokItem(it) {
  return { platform: "tiktok", account: it.author?.uniqueId, name: it.author?.nickname, id: it.id,
    url: `https://www.tiktok.com/@${it.author?.uniqueId}/video/${it.id}`, title: (it.desc || "").slice(0, 140),
    desc: it.desc || "", posted: +it.createTime || null, views: +it.stats?.playCount || 0, likes: +it.stats?.diggCount || 0, shares: +it.stats?.shareCount || 0,
    ageDays: Math.floor((Date.now() / 1000 - +it.createTime) / 86400), duration: it.video?.duration ?? null,
    followers: it.authorStats?.followerCount ?? null };
}
export function tiktokProfile(handle) { // followers + account creation day (unix s)
  const h = curl(`https://www.tiktok.com/@${handle}`);
  const m = h.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
  try {
    const u = JSON.parse(m[1]).__DEFAULT_SCOPE__["webapp.user-detail"].userInfo;
    return { followers: u.stats.followerCount, created: +u.user.createTime || null };
  } catch { return { followers: null, created: null }; }
}
const tiktokFollowers = (handle) => tiktokProfile(handle).followers;
export function tiktokVideos(handle, n) {
  const r = spawnSync("yt-dlp", ["-J", "--flat-playlist", "--playlist-end", String(n), `https://www.tiktok.com/@${handle}`], { encoding: "utf8", maxBuffer: 64e6, timeout: 180e3 });
  if (r.error) throw new Error("yt-dlp not found: pip install yt-dlp");
  try {
    return (JSON.parse(r.stdout).entries || []).map((e) => ({ id: e.id, url: e.url, title: (e.title || e.description || "").slice(0, 140),
      desc: e.description || e.title || "", posted: e.timestamp || null, views: e.view_count ?? 0, likes: e.like_count ?? 0, shares: e.repost_count ?? 0, duration: e.duration,
      ageDays: e.timestamp ? Math.floor((Date.now() / 1000 - e.timestamp) / 86400) : null }));
  } catch { return []; }
}
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const base of ["/opt/pw-browsers", path.join(os.homedir(), ".cache/ms-playwright"), path.join(process.env.LOCALAPPDATA || "", "ms-playwright")]) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter((x) => x.startsWith("chromium-")).sort().reverse())
      for (const [dir, exe] of [["chrome-linux64", "chrome"], ["chrome-linux", "chrome"], ["chrome-win64", "chrome.exe"], ["chrome-win", "chrome.exe"]]) {
        const f = path.join(base, d, dir, exe); if (fs.existsSync(f)) return f;
      }
  }
  return undefined;
}

// ---------- scoring ----------
// A breakout = views >= minRatio x followers AND >= minViews AND posted within `days`.
export function scoreAccount(acc, videos, o) {
  const F = Math.max(acc.followers || 0, 1);
  const vs = videos.filter((v) => v.views != null);
  const med = median(vs.map((v) => v.views));
  const isBreak = (v) => v.views >= o.minRatio * F && v.views >= o.minViews && (v.ageDays == null || v.ageDays <= o.days);
  const breaks = vs.filter(isBreak).sort((a, b) => b.views - a.views);
  const settled = vs.filter((v) => v.ageDays == null || v.ageDays >= 3).sort((a, b) => a.views - b.views);
  const boosted = vs.filter((v) => v.likes != null && v.views >= 100000 && v.likes / v.views < 0.003).length;
  const shareRate = vs.some((v) => v.shares) ? median(vs.filter((v) => v.views > 0).map((v) => (1000 * (v.shares || 0)) / v.views)) : null;
  return { ...acc, n: vs.length, median: Math.round(med), medianRatio: +(med / F).toFixed(2), breakouts: breaks.length,
    bestRatio: vs.length ? +(Math.max(...vs.map((v) => v.views)) / F).toFixed(1) : 0, best: breaks[0] || [...vs].sort((a, b) => b.views - a.views)[0],
    second: breaks[1] || null, worst: settled[0] || null, breakVideos: breaks, sharesPer1000: shareRate == null ? null : +shareRate.toFixed(2),
    medianSeconds: median(vs.map((v) => v.duration).filter(Boolean)) || null, boostFlag: boosted > 0 ? boosted : 0 };
}
export const rankAccounts = (rows) => [...rows].sort((a, b) => b.breakouts - a.breakouts || b.medianRatio - a.medianRatio || b.bestRatio - a.bestRatio);
// "repeat breaker" = 3+ breakouts, or 2 with its usual video already above 3x its following: it has a format, not one lucky hit.
export const isRepeat = (a) => a.breakouts >= 3 || (a.breakouts >= 2 && a.medianRatio >= 3);

const csvCell = (v) => { const s = v == null ? "" : typeof v === "object" ? v.url : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function writeCsv(file, rows, cols) { fs.writeFileSync(file, [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n"); }

// ---------- main ----------
// Find, filter, open, score. Returns every video found and the scored small accounts, best first.
export async function runScan(o) {
  let found = [];
  if (o.tiktok) { console.error("TikTok keyword pages..."); found.push(...await tiktokKeywordPages(o.keywords, o.expand)); }
  if (o.youtube) {
    console.error("YouTube Shorts search...");
    for (const k of o.keywords) for (const date of [4, 5]) {
      found.push(...ytSearchVideos(initData(curl(`https://www.youtube.com/results?search_query=${encodeURIComponent(k)}&sp=${ytSp(date)}`))));
      await sleep(300);
    }
  }
  // dedupe videos, then pick candidate accounts: any video already over the bar where followers are known
  const vids = [...new Map(found.filter((v) => v.account).map((v) => [`${v.platform}:${v.id}`, v])).values()];
  const accs = new Map();
  for (const v of vids) {
    const key = `${v.platform}:${v.account}`;
    const a = accs.get(key) || { platform: v.platform, account: v.account, name: v.name, followers: v.followers, seenViews: 0 };
    a.seenViews = Math.max(a.seenViews, v.views || 0); accs.set(key, a);
  }
  for (const line of o.seed ? fs.readFileSync(o.seed, "utf8").split(/\r?\n/) : []) {
    const h = line.trim().replace(/^@/, "");
    if (h && !accs.has(`tiktok:${h}`)) accs.set(`tiktok:${h}`, { platform: "tiktok", account: h, name: h, followers: null, seenViews: Infinity, seed: true });
  }
  for (const a of accs.values()) if (a.platform === "youtube" && a.seenViews >= o.minViews) { // subscriber count needs the channel page
    const ch = ytChannel(curl(`https://www.youtube.com/channel/${a.account}/shorts`));
    Object.assign(a, { followers: ch.followers, handle: ch.handle, _videos: ch.videos });
  }
  for (const a of accs.values()) if (a.platform === "tiktok" && a.seed) a.followers = tiktokFollowers(a.account);
  const cands = [...accs.values()].filter((a) => a.followers != null && a.followers <= o.maxFollowers &&
    (a.seed || a.seenViews >= Math.max(o.minViews, o.minRatio * Math.max(a.followers, 1))))
    .sort((a, b) => b.seenViews / Math.max(b.followers, 1) - a.seenViews / Math.max(a.followers, 1)).slice(0, o.deep);
  console.error(`${vids.length} videos, ${accs.size} accounts, ${cands.length} small accounts over the bar; opening their latest ${o.videos} videos...`);
  const scored = [];
  for (const a of cands) {
    const videos = a.platform === "youtube" ? (a._videos || []).slice(0, o.videos).map((v) => ({ ...v, url: `https://www.youtube.com/shorts/${v.id}` })) : tiktokVideos(a.account, o.videos);
    const url = a.platform === "youtube" ? `https://www.youtube.com/${a.handle || "channel/" + a.account}` : `https://www.tiktok.com/@${a.account}`;
    scored.push(scoreAccount({ platform: a.platform, account: a.handle || a.account, name: a.name, url, followers: a.followers }, videos, o));
  }
  return { vids, cands, ranked: rankAccounts(scored) };
}

async function main() {
  const o = parseArgs(process.argv);
  fs.mkdirSync(o.out, { recursive: true });
  const { vids, cands, ranked } = await runScan(o);
  writeCsv(path.join(o.out, "videos-found.csv"), vids, ["platform", "account", "followers", "views", "likes", "shares", "ageDays", "duration", "title", "url"]);
  writeCsv(path.join(o.out, "accounts.csv"), ranked, ["platform", "account", "name", "followers", "n", "median", "medianRatio", "breakouts", "bestRatio",
    "sharesPer1000", "medianSeconds", "boostFlag", "url", "best", "second", "worst"]);
  const fmt = (n) => (n == null ? "?" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
  const line = (a) => `- **${a.name}** (${a.platform}, ${fmt(a.followers)} followers): ${a.breakouts} breakouts, usual video ${a.medianRatio}x followers, best ${a.bestRatio}x` +
    `${a.boostFlag ? `, ${a.boostFlag} maybe boosted` : ""}. [account](${a.url}) · [best](${a.best?.url}) ${fmt(a.best?.views)}` +
    `${a.worst ? ` · [worst](${a.worst.url}) ${fmt(a.worst.views)}` : ""}\n  ${(a.best?.title || "").replace(/\s+/g, " ").slice(0, 110)}`;
  const rep = ranked.filter(isRepeat), one = ranked.filter((a) => !isRepeat(a) && a.breakouts > 0);
  fs.writeFileSync(path.join(o.out, "report.md"), `# Small accounts, big views (${new Date().toISOString().slice(0, 10)})\n\n` +
    `Bar: under ${fmt(o.maxFollowers)} followers; breakout = ${o.minRatio}x followers and ${fmt(o.minViews)}+ views within ${o.days} days. ` +
    `Keywords: ${o.keywords.join(", ")}.\n${vids.length} videos found, ${cands.length} small accounts opened.\n\n` +
    `## Repeat breakers (a format, not luck)\n\n${rep.map(line).join("\n") || "none"}\n\n## One-off breakouts (maybe luck)\n\n${one.map(line).join("\n") || "none"}\n\n` +
    `Views and followers are public counts. Lessons, not copies.\n`);
  console.error(`wrote ${o.out}/report.md, accounts.csv, videos-found.csv: ${rep.length} repeat breakers, ${one.length} one-off`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
