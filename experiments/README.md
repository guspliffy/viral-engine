# Experiments

A clip's checks say whether it is technically sound and publishable. Whether people want to watch it is a question
for experiments. This folder keeps one record per experiment, written **before** the clips are made, and the
numbers collected after they are posted. It is deliberately small: a JSON record, a CSV of results, and
`node qa/results.mjs experiments/<id>` for the summary. No dashboard.

## 1. Before making anything: `experiments/<id>/experiment.json`

Copy `example-opening/experiment.json` and fill it in. The fields that matter most:

| Field | What goes in it |
|---|---|
| `question` | One creative question, e.g. "Does an opening centred on the visible problem beat the wider setup?" |
| `treatment`, `comparison` | What each variant does, in a sentence each (`variants` names them A, B, ...) |
| `audience` | Who it is for, e.g. "viewers of absurd character comedy who don't know the cast" |
| `fixed` | Everything kept the same: cast, renderer, music seed, sound strategy, length band, caption style |
| `primaryOutcome` | The one number that decides, chosen now, e.g. "views at 7 days, per platform" |
| `diagnostics` | The numbers that explain it: watch time, completion, shares, follows, Shorts viewed vs swiped away |
| `observeDays` | When to compare (the 24 h and 72 h snapshots are observations, not decisions) |
| `threshold`, `decisionRule` | How big a difference is worth the extra work, and that it must repeat on new premises |
| `costGuardrail` | Active minutes per episode that the result has to justify |

## 2. Making the clips

Every storyboard in the experiment carries the same block, with its own variant:

```json
"experiment": { "id": "opening-2026-11", "variant": "A" }
```

Music, voices and timing must only change where the experiment changes them:

- **Music** is seeded by the experiment's id (`seed` in the storyboard overrides it), so renaming a clip or a variant
  does not change its music. Pin `music` options when the experiment is not about music.
- **Voices**: a line said with the `say` macro is seeded by speaker + line, so moving or retiming it keeps the same
  gibberish and lip sync.
- **Timing**: `"voice+0.2"` places an item 0.2 s after the previous line's voice ends. `"+0.2"` waits for its caption,
  which stays up 0.5 s longer. Pick one on purpose.

`qa/check.mjs` prints the experiment, variant and seed of each clip.

## 3. After posting: `experiments/<id>/results.csv`

One row per post, platform and snapshot age (about 1, 3, 7 and optionally 28 days). Copy the numbers from the
platform's analytics by hand. **Leave a cell empty when the platform doesn't give it**: an empty cell is unknown,
not zero.

```
post_id,platform,clip,variant,family,published,age_days,views,avg_watch_s,completion,shares,comments,likes,follows,minutes_spent
```

`family` groups similar premises (assign variants within a family, so the strongest ideas don't all land in one
arm). `minutes_spent` is the active writing and editing time for the episode.

## 4. Reading the results

```
node qa/results.mjs experiments/opening-2026-11            # at the record's observeDays
node qa/results.mjs experiments/opening-2026-11 --age 3
```

It prints, per platform and variant: the number of posts, the median and spread of views, the mean of
log(1 + views) (so one breakout doesn't decide), median completion and watch time, shares per 1,000 views, and
every post. Platforms are never pooled, because their view definitions differ. With fewer than about a dozen posts
per variant it says so: that is a pilot, and the result is a direction to confirm on new premises, not a finding.
