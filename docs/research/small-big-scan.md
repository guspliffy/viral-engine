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
- YouTube dates: the Shorts tab has none, so each channel's public Shorts feed (RSS) dates its 15 latest Shorts
  (Jonny 26 Nov: when a YouTube video was posted shows what is picking up). Older Shorts stay undated and are not
  limited to `--days`. YouTube search now shows Shorts without their channel: oEmbed gives the @handle, its page the id.
- Instagram Reels: not scanned. There is no public page to read without logging in; Meta's free API only covers our own
  account, and a scripted login breaks Meta's terms and risks the account.
- It finds leads, it does not predict our views (the predictor pilot scored 55%, 19 Nov). Watch the best and worst
  videos of the top repeat breakers and write down the format, then test it in our style.

First run and findings: the 26 Nov tab of the channel analysis doc (memory `small-accounts-scan-2026-11-26`).

## Format trend (`node tools/format-trend.mjs --preset ours`)

Jonny 26 Nov: is a format already saturated, just picking up, or dying, so we know if it still pays to make it. Only
the last 2 weeks count ("trends 4 weeks ago are probably out today"): more accounts in a short frame, week by week and
day by day. TikTok and YouTube Shorts, each judged
on its own (`--no-youtube` skips YouTube). For each format (a name + a caption regex; `--preset ours` = in this town, what if, court, heaven/hell,
kid vs dad, country vs country, folklore, plus four new to us since 26 Nov: absurd fix machine, invention origin, how X really works (POV), guess the right one), keyword pages find the accounts that post it and their latest 150 videos are
read with dates (40 accounts, their latest 60 videos). Per week (last 2): accounts posting it, accounts born, median views, videos over 200K. Per day (last 14):
videos, accounts, median views and views per day since posting (young videos are still growing).
Verdict, last week vs the week before: reward = the SAME accounts' views with the format (so a sample of today's active
accounts can't fake it; pooled median when fewer than 3 accounts have both sides), supply = accounts posting per week and
accounts born. RISING (more accounts, still pays), CROWDED (more accounts, each video gets less), FADING, HEATING UP,
STEADY, NEW. Newcomer odds: of the accounts NEW TO THE FORMAT (first format video in the last 7 days, with 14+ days of
history before it that has none), how many beat their own usual views 2x ("5 of 7"): if newcomers still win, the door is
open (Jonny 26 Nov: trends move fast, a 2-week-old hit can be over today). Their videos are listed fastest first.
Fast signal: share of sampled accounts posting it, last 3 days vs the 3 before, S = (C + 0.5) / (N + 1); HEATING UP at
x1.5 with 3+ accounts, COOLING at x0.65. A rise that disappears without its biggest account is shown as a lead (fragile).
Look check (Jonny 26 Nov: "does the engine actually check the video?"): `tools/look-check.py` runs a free CLIP model
(ONNX, CPU, model cached on the runner) on 3 frames from inside each shown video (25/50/75%; Jonny 26 Nov: covers
mislead): YouTube's own frame thumbnails, TikTok frames from a low-quality download that is deleted right after (~3 s a
video, 200 videos at most). It tags 3D cartoon, 2D cartoon, stick figures (our kind) or real people, selfie, game
footage, anime, text. The page hides videos under 0.25 "ours" by default (a toggle shows them). LOOK_FRAMES=0 = covers only.
Channel by channel (Jonny 26 Nov: are several channels on the topic rising at once?): each account's format videos last
week vs the week before; RISING x1.3+, FALLING x0.7 or less (2+ videos a side), NEW = first format video in 14 days.
DEVELOPING = 3+ channels rising and at least twice as many rising as falling; COOLING the other way round.
Stages on the page: Animate (just rising), Storyboard (early lead: 2+ accounts posted it in 3 days and a first-timer beat
their usual views within 3 days; cheap action = premise + rough board), lead, room on the other platform (a gap, not a rise), steady, crowded, dying. Every day the scout
saves its picks with the date our video could go live (`SCOUT_LEAD_DAYS`, 2); after a few weeks, score each pick by
whether first-timers posting around that date still beat their usual views 2x at 48 h, against the most-viewed list.
The Formats tab also shows 10 random small-account clips the finder missed, to watch muted and note setup + reversal.
These came from a ChatGPT research read and its review (26 Nov); its other ideas (age-matched 48 h views from the daily snapshots,
a fixed account panel, weekly replay scoring) wait for a few weeks of history. Videos under 2 days are left out of the
weeks. `--from <dir>/rows.json` re-judges a run without fetching. Limits: only accounts that are active now are found.
YouTube side: Shorts search (this week + month) finds the channels, their feeds give the 15 latest Shorts with dates
(about 2 weeks for a daily poster), enough for the same week-vs-week read; when most channels' 15 don't
reach back 2 weeks the verdict says SHORT HISTORY. **Platform gap**
(Jonny 26 Nov: hyped on one platform, thin on the other = a content gap we can fill): last 2 weeks per platform, accounts
posting, median views, hits. ROOM ON YOUTUBE / ROOM ON TIKTOK = it pays on one (median 50K+ or 3+ hits) while under a
third as many accounts (or under 3) post it on the other. Both samples are capped at `--accounts`: read the numbers too.

## Daily scout (`tools/daily-scout.mjs`, `.github/workflows/scout.yml`)

Jonny 26 Nov: scan every day and show new viral videos and formats for our niche, with references, on a page or in
Telegram. Every morning (06:30 Berlin) a free GitHub runner runs the scan (under 10K followers, niche keywords),
compares it with the history on the branch `scout-data` and lists: early breakouts (under 4 days old, already 10x
followers), fastest risers since the last run (the 24/48 h signal), new breakouts, repeat breakers, and the format trend
(last 2 weeks, week by week and day by day). It publishes the page to GitHub Pages (public, like the repo) and sends the top 6 finds to Telegram.
One-time setup by Jonny: Settings > Pages > Source "GitHub Actions"; a Telegram bot from @BotFather, its token as the
repo secret `TELEGRAM_BOT_TOKEN`, then one message to the bot (or the secret `TELEGRAM_CHAT_ID`). Zero tokens: no
Claude in the loop. Pull requests that touch the scout run a 2-minute smoke scan instead.
The page (Jonny 26 Nov: a clear overview with reference videos) has 4 tabs: Today (early breakouts, risers, new
breakouts), Formats (found by `tools/format-finder.mjs`: caption phrases and hashtags that 3+ different small accounts
use, ranked by breakouts, best 3 videos each; fandom ones shown apart), Trends (our formats, TikTok and YouTube, the gap)
and Accounts (repeat breakers, best and worst video). Every video plays in place on a click. The finder reads caption
text only, so it finds title templates and topics, not jokes: watch the examples to learn the mechanism.
Flags: "franchise" (someone else's characters: Sprunki, Roblox, TADC ...) and "borrowed audio" mark the part of a hit
we can't make our own. The shortlist is saved daily (`shortlist-<date>.json` on `scout-data`) before the results exist.
