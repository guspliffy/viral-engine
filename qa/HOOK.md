# Hook lab: trends, premises, openings, cold read, retention

Still Scrolling (TikTok, 28 Oct) was shown to strangers (91% of its views came from For You) but lost most of them at
0:02: 5.4 s average watch of 14 s, 11.4% to the end. The polish is ahead of the opening, so every new clip goes
through this loop before the full render, and every post feeds back into it. Jonny's rules (28 Oct): clips are 7-20 s,
in English but readable on mute, the same MP4 goes to TikTok and Instagram on the same day, trend research comes
before each video day, and each post tests one thing.

```
trend screenshots -> 10 premises, scored -> top 3 -> 3 openings (qa/hook.mjs) -> cold read -> Jonny picks
-> draft, reviews, full render (CLAUDE.md workflow) -> post on both platforms -> day 3: curve + qa/retention.mjs
```

## 1. Trend input (each video day, from Jonny)

Creator Search Insights lives in the TikTok app and the Creative Center needs a login; neither can be read from a
cloud session (the data API answers "no permission"; don't try to get around it). So Jonny sends two screenshots:

1. **Creator Search Insights** (TikTok app, search "Creator Search Insights"): trending searches and content gaps for
   *funny animation* or *cartoon*.
2. **Creative Center** (ads.tiktok.com, Trends): trending songs and hashtags, US + UK, last 7 days.

Read them for topics and situations, not for formats. The trend sets the topic; the cast, look C, the length band
and the loop stay fixed, so posts stay comparable. Note the date and what was trending in the premise file.

## 2. Premise filter (about 20 minutes)

Write 10 one-line premises in `storyboards/<topic>/premises.md`, each as *who wants what, what goes wrong*. Score each
question 0, 1 or 2 and keep the top 3 (ties: the one that's cheaper to make).

| Question | 2 means |
|---|---|
| **Send test**: who exactly would you send it to? | You can name the friend ("the one who never looks up") |
| **Mute test**: does it work with the sound off? | The want, the problem and the payoff are all visible |
| **Twist late**: is the payoff in the last 2-3 s, after one escalation? | Yes, and it can loop back to frame 1 |
| **Only them**: could only this character do it? | It comes from their bible trait (Reaper literal, Phoenix shortcut, Wizard overcomplicates, ...) |

Also check variety against the last three posts (setting, cast, structure) and avoid the one-fighter-after-another
repetition format (Jonny, 25 Oct).

## 3. Three openings (`qa/hook.mjs`)

Write the clip once, from the template, with the opening as a parameter, and write three storyboards that differ only
in the first 2-3 s: for example *in the middle of the problem*, *the want shown big in close-up*, *the caption asks the
question over the action*. Same music seed, same rest of the clip (`"experiment": { "id": "hook-2026-11", "episode":
"<clip>", "variant": "A" }`).

```bash
node qa/hook.mjs storyboards/<topic>/<clip>-a.json <clip>-b.json <clip>-c.json            # ~3 min per opening, full quality
node qa/hook.mjs ... --draft                                                              # ~1 min each, half-res
node qa/hook.mjs ... --rules                                                              # the rules only
```

It writes to `out/hook/<episode>/`: `openings-3up.mp4` (the three side by side, mute: the R2 test),
`openings-sound.mp4` (one after another, with sound), `cold-read-A.png`... (six frames from 0 to 2.8 s) and
`hook-report.md`.

**Opening rules** (notes, never failures; thresholds live in `OPENING` in qa/hook.mjs, change them with a reason):

| Rule | Measure | Why |
|---|---|---|
| face-size | biggest character ≥ 35% of the frame height at frame 0 | a face reads on a phone; a wide set shot reads as wallpaper |
| motion-0 | a body, limb, wing, prop or the camera moves by 0.25 s | a held pose looks like a still image in the feed |
| sound-0 | a sound effect or a line by 0.25 s (music alone doesn't count) | sound says something is happening; Still Scrolling had none |
| caption | first caption up by 0.3 s, 6 words or fewer, raises a question | read in one glance; "That friend who…" beats a description |
| setup-by | the hook beat hands over by 2.5 s | the situation is clear and moving before the 2 s exit point |
| two-shot-0 | every name in `hook.show` (default: whoever acts in the hook and payoff beats) has its eyes in frame at 0 s; a prop named there is in frame too | four cold reads in a row (Alien Makeup, Chef, Package, Charger) needed a second round because frame 0 lacked a face or the thing the joke is about |
| hint-by | `hook.hint` (the second trouble first shows, with `what`) is 2.0 s or earlier | 33-52 % of viewers are gone by 0:02 while our twists land at 3.9-8.9 s: the twist can wait, the hint can't |

Measured on 28 Oct: Still Scrolling misses motion-0 and sound-0 (it opens on a held pose in silence), Nothing Scares
Reaper misses setup-by (its first beat runs 3.4 s), and the clip template misses motion-0, sound-0 and the caption length.

## 4. Cold read (one fresh reviewer per opening, about a minute)

The reviewer must not know the premise, so spawn **one Agent per opening** (model `fable`, run them in parallel) and give
each only its `cold-read-<X>.png` path and this prompt. No storyboard, no brief, no other sheet.

> These are six frames from the first three seconds of a short vertical comedy video, labelled with their time.
> You are scrolling a feed with the sound off. Answer in plain words, one line each:
> 1. Who is on screen, and what does one of them want?
> 2. What is wrong or about to go wrong?
> 3. From which frame did you understand that? (or "not yet")
> 4. What do you expect to happen next?
> 5. Would you keep watching? 1 (swipe) to 5 (must see), and the reason in five words.
> 6. Does the caption or the picture already tell you how it ends? (yes / no)
> 7. One change to the first frame that would make it clearer.
> Don't guess the premise if you can't see it; "not clear" is a useful answer.

Score each opening against the brief's *Joke* and *Wants* lines: **understood** (1 and 2 match the brief by 1.3 s),
**late** (they match, but only by 2.8 s), or **missed**. Paste the answers into `hook-report.md`. An opening that's
missed doesn't go to Jonny; replace it.

**Pick by curiosity, not only clarity.** Understanding the situation isn't enough: Alien Makeup was understood at 0 s
and still held only 45 % at 2 s, the lowest of seven posts, because its caption told the whole joke. Recommend the
opening that is understood (or late) with the highest "keep watching" (question 5), and only if it is 4 or 5 and
question 6 is "no". If none gets there, change the opening once (show the hint earlier, make the caption a question,
pull back to a two-shot) and read it again; after that round, send the best one with its score.

## 5. Jonny picks

Send `openings-3up.mp4` and `openings-sound.mp4` with one line per opening (rules passed, cold read, "keep watching"
score) and a recommendation. His pick and its reason go into `hook-report.md`. Then the normal workflow (CLAUDE.md)
takes the picked storyboard to the full render.

## 6. Post, then the retention loop

The same clean MP4 goes to TikTok and Instagram on the same day (no TikTok watermark on the Instagram one), in the
19-21 slot. At about 3 days Jonny sends screenshots of each platform's retention graph and overview. Then:

1. Add one row per platform to `experiments/hook-2026-11/results.csv` (`held_2s` = % still watching at 2 s; leave
   unknown cells empty).
2. Copy the curve, one point a second, into `experiments/hook-2026-11/curves/<post_id>-<platform>.csv` (`t,pct`).
3. `node qa/retention.mjs <clip.mp4> <curve.csv> --title "<clip> · <platform> · 3 d"` makes the clip with its curve
   underneath and a sheet of the frames at the steepest drops.
4. Tell Jonny in two lines: where people left, and what was on screen. Then `node qa/results.mjs experiments/hook-2026-11`.

A drop shows *where* people leave, not *why*. Use it to choose the next thing to test, one change at a time.
