# Small account, big views scan (on trial since 26 Nov 2026)

`node tools/small-big-scan.mjs` finds TikTok and YouTube Shorts accounts with few followers whose videos get far more
views than their following. A video at 10x-1000x its account's followers went viral on the format itself, which is
the part we can learn from; a big account's hit can ride its followers. Jonny 26 Nov: "scan accounts that fit our niche
or would fit our characters with a relatively low following ... which make really high view counts ... so we can
identify viral formats we could use in our own style". Lessons, not copies.

## How it works

1. **Find.** TikTok keyword pages (`tiktok.com/discover/<keyword>`, about 16 videos each, with views and the author's
   follower count) and YouTube Shorts search (this month + this year, sorted by views). `--expand N` also opens N
   related TikTok keyword pages per keyword that stay in animation/comedy land. `--seed <file>` adds TikTok handles.
2. **Filter.** Accounts under `--max-followers` (10K, Jonny 26 Nov: 100K is already big) with a video at `--min-ratio`
   (10x) followers and `--min-views` (200K). Videos under `--min-seconds` (20) don't count (Jonny 26 Nov: our target stays
   80 s; a 20-50 s hit is a theme we can stretch to 80 s, and the page marks it so). Default keywords = our niche: animation, funny animation, comedy, comedy
   sketches; add topic keywords with `--keywords`.
3. **Open.** The latest `--videos` (30) videos of the best `--deep` (40) accounts: TikTok through `yt-dlp`, YouTube
   from the channel's Shorts tab.
4. **Rank.** Breakouts (videos over both bars within `--days` 180) first, then the usual video's views / followers.
   A **repeat breaker** has 3+ breakouts, or 2 with a usual video above 3x its following: that is a format. One breakout alone
   may be luck. Each account lists its best and its worst video (worst = what fails).

Output in `--out` (default `out/small-big-<date>/`): `report.md` (ranked, links to account, best and worst video),
`accounts.csv`, `videos-found.csv`. Runs from the cloud container in ~10-15 min; needs `pip install yt-dlp` there.

## What it can and cannot see

- **Can:** public views, likes, shares, comments (TikTok), followers, post age, length, captions.
- **Not needed:** retention and watch time are private, but a video only reaches 10x+ its followers when people watch it
  through (Jonny 26 Nov), so the view count stands in for them.
- Keyword pages show what TikTok picks for a US visitor, about 16 videos each: a sample, not a census.
- Views can be bought or ad-boosted: likes under 0.3% of views on a 100K+ video is flagged (`boostFlag`).
- YouTube Shorts tabs give no post dates, so YouTube breakouts are not limited to `--days`.
- It finds leads, it does not predict our views (the predictor pilot scored 55%, 19 Nov). Watch the best and worst
  videos of the top repeat breakers and write down the format, then test it in our style.

First run and findings: the 26 Nov tab of the channel analysis doc (memory `small-accounts-scan-2026-11-26`).

## Format trend (`node tools/format-trend.mjs --preset ours`)

Jonny 26 Nov: is a format already saturated, just picking up, or dying, so we know if it still pays to make it.
TikTok only (YouTube Shorts tabs have no dates). For each format (a name + a caption regex; `--preset ours` = in this
town, what if, court, heaven/hell, kid vs dad, folklore), keyword pages find the accounts that post it and their latest
60 videos are read with dates. Per 4-week window: accounts posting it (supply), median views of its videos (reward),
videos over 200K (hits), posters that are new accounts. Last 2 windows vs the ones before:
RISING (supply up, reward holds), CROWDED (supply up, reward down), DYING (both down), FADING (reward down),
HEATING UP (reward up), STEADY. Newcomer odds: of the new accounts (under 150 days) that tried the format in the last 60 days, how many got a
format video at 2x+ their own usual views ("8 of 30"): if new accounts still win, the door is open. Videos under 10 days old are left out (still gaining views).
When too few accounts have history on both sides (most posters are new; daily posters' 150 videos cover ~2 months),
it falls back to a 4-week read: last 4 weeks vs the 4 before (more accounts + lower median = CROWDING), or NEW.
The daily scout's own history makes this sharper week by week. `--from <dir>/rows.json` re-judges a run without fetching.
Limits: only accounts that are active now are found.

## Daily scout (`tools/daily-scout.mjs`, `.github/workflows/scout.yml`)

Jonny 26 Nov: scan every day and show new viral videos and formats for our niche, with references, on a page or in
Telegram. Every morning (06:30 Berlin) a free GitHub runner runs the scan (under 10K followers, niche keywords),
compares it with the history on the branch `scout-data` and lists: early breakouts (under 4 days old, already 10x
followers), fastest risers since the last run (the 24/48 h signal), new breakouts, repeat breakers, and on Mondays the
format trend. It publishes the page to GitHub Pages (public, like the repo) and sends the top 6 finds to Telegram.
One-time setup by Jonny: Settings > Pages > Source "GitHub Actions"; a Telegram bot from @BotFather, its token as the
repo secret `TELEGRAM_BOT_TOKEN`, then one message to the bot (or the secret `TELEGRAM_CHAT_ID`). Zero tokens: no
Claude in the loop. Pull requests that touch the scout run a 2-minute smoke scan instead.
Flags: "franchise" (someone else's characters: Sprunki, Roblox, TADC ...) and "borrowed audio" mark the part of a hit
we can't make our own. Every Monday the shortlist is saved (`shortlist-<date>.json` on `scout-data`) before the next
week's results exist; after 4+ weeks, check whether its picks found the next breakouts better than the most-viewed list.
