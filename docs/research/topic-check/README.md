# Topic check: which topics tend to hop or flop (on trial from 19 Nov 2026)

Producer's go 19 Nov 2026: use the channel research to flag topics that tend to hit or flop, before any work on an
idea. It is a **warning, not a score**. Run `python3 tools/topic-check.py "<the idea as one title line>"`.

## What it is built on

- `titles.csv.gz`: 10,447 titles with views divided by that channel's median (1.0 = the channel's usual video).
  9,496 come from the full upload lists of 377 English channel tabs (young animated channels + fact channels,
  read 19 Nov 2026, newest 6 Shorts and long videos under 14 days left out); the rest from the earlier studies (the
  TikTok saves, fact-channel reads). Platform column says which.
- The patterns in the tool. "Measured" ones are average effects inside a channel over those uploads. "Read" ones
  come from a few dozen named videos and are hunches until our own posts confirm them.

## What it can't do (tested 19 Nov 2026, all blind)

- Title tags as a predictor on channels it never saw: 50.3 % pair accuracy, a coin flip.
- A 3-point script picker on 40 transcripts (first 25 s + ending) from 4 channels: 55 %, below the 60 % bar.
- A 1-100 rating: rank correlation 0.37 on our own videos, 0.15 on other channels (bar 0.6).

So the check never says "this will do 8x" and never decides between two ideas the producer likes. It flags a
known flop pattern early (history topic, one stranger's true story, two-part premise) and shows the closest real
videos so the producer can judge.

## The trial

1. Every new idea gets the check before the outline. The outline carries one line: `TOPIC CHECK: HOP / FLOP /
   UNCLEAR, <why>` and the 3 closest real videos that fit.
2. A FLOP verdict goes to the producer with the evidence; he decides. It never drops an idea by itself.
3. At the 24 h read, add the post to `experiments/topic-check-log.md` with its verdict and numbers.
4. After 30 logged posts, compare: did HOP videos finish better and get more views than FLOP/UNCLEAR ones? Only if
   they did does the check get any weight in picking ideas. If not, drop it.

Full research: the channel analysis doc (Claude Doc "Channel analysis: everything so far"), project files
`research/channel-analysis-all/`, `research/picker-pilot-2026-11-19/`, `research/rating-backtest-2026-11-19/`.
