# Small account, big views scan (on trial since 26 Nov 2026)

`node tools/small-big-scan.mjs` finds TikTok and YouTube Shorts accounts with few followers whose videos get far more
views than their following. A video at 10x-1000x its account's followers went viral on the format itself, which is
the part we can learn from; a big account's hit can ride its followers. Jonny 26 Nov: "scan accounts that fit our niche
or would fit our characters with a relatively low following ... which make really high view counts ... so we can
identify viral formats we could use in our own style". Lessons, not copies.

## How it works

1. **Find.** TikTok keyword pages (`tiktok.com/discover/<keyword>`, about 16 videos each, with views and the author's
   follower count) and YouTube Shorts search (this month + this year, sorted by views). `--expand N` also opens N
   related TikTok keyword pages per keyword that stay in animation/sketch land. `--seed <file>` adds TikTok handles.
2. **Filter.** Accounts under `--max-followers` (100K) with a video at `--min-ratio` (10x) followers and `--min-views`
   (300K).
3. **Open.** The latest `--videos` (30) videos of the best `--deep` (40) accounts: TikTok through `yt-dlp`, YouTube
   from the channel's Shorts tab.
4. **Rank.** Breakouts (videos over both bars within `--days` 180) first, then the usual video's views / followers.
   A **repeat breaker** has 3+ breakouts, or 2 with a usual video above 3x its following: that is a format. One breakout alone
   may be luck. Each account lists its best and its worst video (worst = what fails).

Output in `--out` (default `out/small-big-<date>/`): `report.md` (ranked, links to account, best and worst video),
`accounts.csv`, `videos-found.csv`. Runs from the cloud container in ~10-15 min; needs `pip install yt-dlp` there.

## What it can and cannot see

- **Can:** public views, likes, shares, comments (TikTok), followers, post age, length, captions.
- **Cannot:** retention, watch time, finish rate, where viewers came from. Those are private to each creator.
- Keyword pages show what TikTok picks for a US visitor, about 16 videos each: a sample, not a census.
- Views can be bought or ad-boosted: likes under 0.3% of views on a 100K+ video is flagged (`boostFlag`).
- YouTube Shorts tabs give no post dates, so YouTube breakouts are not limited to `--days`.
- It finds leads, it does not predict our views (the predictor pilot scored 55%, 19 Nov). Watch the best and worst
  videos of the top repeat breakers and write down the format, then test it in our style.

First run and findings: the 26 Nov tab of the channel analysis doc (memory `small-accounts-scan-2026-11-26`).
