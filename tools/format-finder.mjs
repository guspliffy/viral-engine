#!/usr/bin/env node
// Finds formats nobody named yet (Jonny 26 Nov: make the scout find new trends by itself). A "format" here is a caption
// pattern (2-4 words in a row, or a hashtag) that several DIFFERENT accounts use: "in this town", "germany vs usa",
// "pov you", "#inthistown". For each: accounts using it, views against followers, breakouts, how much of it is from the
// last 7 days, and its best videos. No AI: caption text only, so it finds title templates, not jokes. On trial.
//
//   node tools/format-finder.mjs <videos-found.csv> [--min-accounts 3] [--top 25]
// The daily scout calls findFormats() on each day's videos.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { median, FRANCHISE } from "./small-big-scan.mjs";

// words that say nothing about a format, and hashtags every animation video carries
const STOP = new Set("a an the and or but of to in on at for with is are was be it this that my your our his her their i you he she we they me him us them so just when what who how why not no yes do does did have has had will can its it's im i'm if would like make back get got one all out up about from into then than there here by as be all".split(" "));
const FAN = /#?(dandy|dandysworld|pomni|jax|funnybunny|theamazingdigitalcircus|robloxanimation|tsundere|anime|mha|naruto|ersatz)/i; // fandom tags beyond FRANCHISE
const GENERIC_TAGS = /^#(fyp|fypシ|foryou|foryoupage|viral|trending|funny|comedy|animation|animated|cartoon|shorts|short|meme|memes|explore|xyzbca|capcut|tiktok|funnyvideo|funnyvideos|lol|humor|3danimation|2danimation|animationmeme|funnyanimation|cartoons|fy|parati|viralvideo|edit|story|storytime|relatable|fun|ai|aivideo|aivideos|animator|animations|cute|kids|family|foryourpage|reels|youtubeshorts|art|artist|oc|animatic|stickman|stickmananimation|comedyvideo|comedyvideos|skit|skits|sketch|sketchcomedy|pov|entertainment|funnytiktok|funnyreels|tiktokcomedy|funnymoments|funnycartoon|cartooncomedy|comedyskits|drawing|funnyshorts|shortsfeed|trend|trendingvideo)$/i;
// grams made only of genre words say nothing about the format
const GENERIC_GRAM = /^((funny|cartoons?|comedy|animations?|animated|sketch|skits?|kids|3d|2d|moments|characters|videos?|for|the|of|best|story|stories|short|shorts|new|ai|cute)( |$))+$/;

export function patternsOf(caption) {
  const text = String(caption || "").toLowerCase();
  const tags = [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).filter((t) => !GENERIC_TAGS.test(t)))];
  const words = text.replace(/#[\p{L}\p{N}_]+/gu, " ").replace(/@\S+/g, " ").replace(/[^\p{L}\p{N}' ]+/gu, " ").split(/\s+/).filter(Boolean).slice(0, 25);
  const grams = new Set();
  const content = (w) => !STOP.has(w) && w.length >= 3;
  for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= words.length; i++) {
    const g = words.slice(i, i + n), c = g.filter(content).length;
    if (g.some((w) => /^\d+$/.test(w) && w.length > 4)) continue;
    // a template opens the caption ("what if", "in this town", "would you"); anywhere else it needs 2 real words
    if ((i === 0 ? c >= 1 || n >= 3 : c >= 2) && !GENERIC_GRAM.test(g.join(" "))) grams.add(g.join(" "));
  }
  return [...grams, ...tags];
}

// videos: {account, followers, views, ageDays, title|desc, url}. A pattern counts once per account (its best video).
// Fandom patterns (someone else's characters) are kept but marked `franchise`, so the page can show them apart.
export function findFormats(videos, { minAccounts = 3, top = 25 } = {}) {
  const by = new Map();
  for (const v of videos) {
    if (!v.account) continue;
    for (const p of patternsOf(v.desc || v.title)) {
      const m = by.get(p) || new Map();
      const cur = m.get(v.account);
      if (!cur || v.views > cur.views) m.set(v.account, v);
      by.set(p, m);
    }
  }
  let out = [];
  for (const [p, m] of by) {
    if (m.size < minAccounts) continue;
    const vs = [...m.values()];
    const ratio = (v) => v.views / Math.max(v.followers || 0, 1);
    out.push({ pattern: p, franchise: FRANCHISE.test(p) || FAN.test(p), accounts: vs.length, medianViews: Math.round(median(vs.map((v) => v.views))),
      medianRatio: +median(vs.filter((v) => v.followers != null).map(ratio)).toFixed(1),
      breakouts: vs.filter((v) => v.followers != null && ratio(v) >= 10 && v.views >= 100000).length,
      recentShare: +(vs.filter((v) => v.ageDays != null && v.ageDays <= 7).length / vs.length).toFixed(2),
      examples: vs.sort((a, b) => ratio(b) - ratio(a)).slice(0, 3).map((v) => ({ url: v.url, account: v.account, views: v.views, followers: v.followers, title: v.title, cover: v.cover, duration: v.duration, flags: v.flags })) });
  }
  // a longer pattern used by the same accounts says more than its parts: drop a pattern contained in a longer one with
  // at least 80% of its accounts
  out.sort((a, b) => b.pattern.length - a.pattern.length);
  const kept = [];
  for (const f of out) if (!kept.some((k) => k.pattern.includes(f.pattern) && k.accounts >= 0.8 * f.accounts)) kept.push(f);
  // rank: breakouts, then how far the usual video of the pattern beats its account's following
  return kept.sort((a, b) => b.breakouts - a.breakouts || b.medianRatio - a.medianRatio).slice(0, top);
}

function readCsv(file) {
  const [head, ...lines] = fs.readFileSync(file, "utf8").trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => {
    const cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    const o = Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    for (const k of ["followers", "views", "ageDays"]) o[k] = o[k] === "" || o[k] == null ? null : +o[k];
    return o;
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: node tools/format-finder.mjs <videos-found.csv> [--min-accounts 3] [--top 25]");
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
  const fmt = (n) => (n == null ? "?" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
  for (const f of findFormats(readCsv(file), { minAccounts: arg("--min-accounts", 3), top: arg("--top", 25) }))
    console.log(`${f.franchise ? "[franchise] " : ""}${f.pattern} | ${f.accounts} accounts | usual ${f.medianRatio}x followers | ${f.breakouts} breakouts | ${Math.round(f.recentShare * 100)}% last 7 d | ` +
      f.examples.map((e) => `${e.account} ${fmt(e.views)}`).join(", "));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e.message); process.exit(1); });
