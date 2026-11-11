# Ledger: one row per finished video

The record behind "The improvement loop" in `docs/rules/workflow.md`. `node tools/ledger.mjs` prints the fix on test
and the last three rows; `node tools/ledger.mjs add ...` writes a row (it lists its flags when one is missing).
Unknown is `?`, never a guess. Cost is recorded, it is not a budget: videos differ in length and in new things, so a
video is compared with the earlier one closest in both, by its counts.

Columns: `s` length in seconds · `new` props, effects, sets or a format built for this video · `lookups` engine
searches for a name · `layouts` layout runs · `fix rounds` check-fix rounds · `unseen` of those, rounds on a fail
nobody could see in the frames · `renders` full renders · `waits` steps that only waited · `steps` model steps of the
clip's thread · `min` minutes from brief to delivery · `machine` of those, minutes a command ran · `director` model
and effort · `$` the thread's cost · `score` Jonny's, out of 10 · `notes` what Jonny said about the video · `test`
the verdict on the fix that was on test (kept, out, open, none).

## Fix on test

Three changes went in on 10 Nov 2026, before the loop started. From the next fix on there is one at a time.

- Vocabulary sheet, clip notes and `qa/peek.mjs` (#190): should lower `lookups` (Survive it EP1: about 230 of 853 steps).
- Layout reuse and frame-cache keys (#189): should lower `machine` minutes per draft.
- The eight rules (#195): should lower `layouts`, `fix rounds` and `waits`.

First test: There's a catch EP04 copy money. The director's model is on test too (Fable 5.2 on high since 10 Nov,
Opus 5.5 on xhigh before); the line to compare with is the first row.

## Rows

| date | video | s | new | lookups | layouts | fix rounds | unseen | renders | waits | steps | min | machine | director | $ | score | notes | test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-08 | never-has-money-04-your-birthday (director writes) | ? | ? | ? | ? | ? | ? | ? | ? | ? | 323 | ? | Opus 5.5 xhigh | 73 | ? | better cuts and scenes; hands less clean than the old cut; Gunslinger turns from the camera in the hug | none |
| 2026-11-10 | share-or-steal-01 | 24.7 | series, set | ? | ? | 20 | ? | 1 | ? | ? | ? | ? | ? | 59 | ? | ? | none |
| 2026-11-10 | survive-it-ep1-snowed-in | 20.8 | room, mountain, built to panels from scratch | ~230 | 40 | 3 | 0 | 4 | ~100 | 853 | 560 | ? | ? | ? | ? | format: just different scenes, not one story | none |

Records before 8 Nov and the other clips of 8 to 10 Nov are the "Trial" lines in `docs/STATE.md`, as written then.
