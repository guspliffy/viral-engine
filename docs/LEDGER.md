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
- From Fight, Flight or Freeze 01 (11 Nov): captions can't stand on each other (`c.say` gives way to the next
  caption, `caption-collide` fails in preflight) and a new series sends its six-line chain to Jonny before the first
  build: should keep `renders` at 1 and lower the drafts that rebuild a story.
- `tools/ledger-count.mjs` (11 Nov, from Share or Steal EP02; waits for Jonny's word): counts a row from the thread's
  transcript in under a second. Should end `?` in the count columns (Share or Steal 01 had 7 unknown, filled below by
  the script; copy money's verdict was "open: the comparison row has no counts").

- From Hot Potato 01 (11 Nov; waits for Jonny's word): a NaN guard pass in the full look (`engine/page/looks.js`).
  One prop shader's NaN pixel turned every full-look frame with that prop black, and no draft showed it (drafts
  have no anti-aliasing): one full render lost (9 min) and a still round to find it. Should keep `renders` at 1
  for clips with new shaders. Proof: the faulty shader with the guard draws three full stills that were black
  before; golden unchanged.
- Every draft prints its own `pops` line (11 Nov, from Doomscroll 01; waits for Jonny's word): three videos lost
  farm renders to single frames their drafts already showed. Should keep `renders` at 1.
- Recorded orchestra beds for danger scenes, named in the clip template (12 Nov, from There's a catch 05, #210; waits
  for Jonny's word): three of his rounds went on synthesised chase music he heard as game music. Should bring the
  music rounds by his ear to 0 in the next danger clip.
- `air-walk` (12 Nov, from You wake up mid 01; waits for Jonny's word): a character let go by a carrier keeps its
  height, so its next move runs in mid-air; Jonny found it on a final cut that passed every check. A preflight warning
  (visible-glitch) names the move and the height. Should keep the glitches Jonny finds on final cuts at 0. Proof: it
  flags all three runners on the old storyboard and none on the fixed one.

First test: There's a catch EP04 copy money. The director's model is on test too (Fable 5.2 on high since 10 Nov,
Opus 5.5 on xhigh before); the line to compare with is the first row.

## Rows

| date | video | s | new | lookups | layouts | fix rounds | unseen | renders | waits | steps | min | machine | director | $ | score | notes | test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-08 | never-has-money-04-your-birthday (director writes) | ? | ? | ? | ? | ? | ? | ? | ? | ? | 323 | ? | Opus 5.5 xhigh | 73 | ? | better cuts and scenes; hands less clean than the old cut; Gunslinger turns from the camera in the hug | none |
| 2026-11-10 | share-or-steal-01 | 24.7 | series, set | 223 | 3 partial + 24 preflight runs | 20 | ? | 1 | 10 | 532 | 1094 (overnight stop on the usage limit) | 103 foreground + 11 background commands | Opus 5.5 xhigh | 59 | ? | ? | none |
| 2026-11-10 | survive-it-ep1-snowed-in | 20.8 | room, mountain, built to panels from scratch | ~230 | 40 | 3 | 0 | 4 | ~100 | 853 | 560 | ? | ? | ? | ? | format: just different scenes, not one story | none |
| 2026-11-11 | fff-01-bank-robbery | 29.7 | series, built hall inside an env set (room swap + window), painted airport env, heist props, 8 sounds | ~90 | 27 full + 6 partial | 1 | ? | 2 | ? | ~600 | ~450 (1775 on the clock, weekly limit hit for about 22 h) | ? | Fable 5.2 high | 91 | ? | 5 drafts: draft 2 causes unclear; draft 3 forced jokes, wants serious cause chain; draft 4 window, door, 10x extreme, airport; draft 5 go. Render 2 for two subtitles on each other for 3 frames (no check sees it) | lookups fell (~90 vs ~230 Survive it EP1), fix rounds 1 vs 3; layouts not lower (27 vs 40 on 5 drafts) |
| 2026-11-11 | theres-a-catch-04-copy-money (2 rounds) | 21.6 | format, 5 prop packs, night set; round 2 rebuilt two thirds from Jonny's notes | 51 | 20 full + 35 partial | 4 | 1 | 2 | 18 | 725 | 435 | ? | Fable 5.2 high | 118 | ? | round 1: catch was a fact caption, not shown; slow opening; copied wallets not money; cup and wallet holds wrong; music too quiet; opening line not catchy. Round 2 draft: OK | open: the comparison row has no counts |
| 2026-11-11 | share-or-steal-02 | 17.3 | vat set, dunk lifts, card fans, picture rule cards, fried double, host commentary | 77 | 12 full + 5 partial + 10 preflight runs | 12 after the go (earlier rounds not noted) | 4 | 1 (drawn 3 times: a one-frame fix, then the merged branch) | 12 | 247 | 176 | 54 foreground + 8 background commands (3 full renders 34, 3 drafts 14) | Fable 5.2 high | ? | ? | draft 1: "kind of yes", rules clearer and a game-show moderator voice; draft 2: "go" | against Share or Steal 01: lookups 223 to 77 (part of it is EP01's table and seats reused): keep; layout and preflight runs 27 to 27, waits 10 to 12: no drop yet (video 1 of 2); frame cache reused 0 frames in 3 renders: open. Score open. Counts by `tools/ledger-count.mjs` (#202) |
| 2026-11-11 | hot-potato-01 (2 versions) | 13.4 | series, felt studio set (row, then diamond + balcony, lever, screen clock), coal + tongs, new cast character (clown costume type, sharp teeth), commentator, laugh pattern; version 1 thrown away after draft 3 | 184 | 20 full + 16 preflight runs | 3 on version 2 (layout fails, caption fails, black frames); version 1 not noted | 1 | 2 (render 1 black wherever a tile glowed: a shader NaN that only shows with anti-aliasing) | 13 | 460 | 631 on the clock (two builds, waits for Jonny between) | 85 foreground + 7 background commands (2 full renders 18, 6 drafts ~32, golden 3 x 4.5) | Fable 5.2 high | at least 63 (+ 4 builders, 1.03 M tokens) | ? | draft 2: wants a commentator, an evil host, the danger clear, creepy children's music; draft 3: lettering on lettering, game not understood, no fried host, no fireproof Dragon, triangle, evil clown, face close-ups; version 2 rough draft: 'make the clown laugh evil the rest is good to go' | caption-collide + chain first (#203, #194): open, this build began before both; version 1 is the case they are for (a story built twice, 3 drafts lost). ledger-count: keep, no count column is unknown |
| 2026-11-11 | doomscroll-01-sprout-man (4 cuts: A, B, H, S) | 29.2 | series, monster as a prop with his own rig, selfie screen with filter row, 4 painted envs, music style dread, sound thunder | 144 | 0 full + 0 partial + 28 preflight runs | 4 on the picked cut after his pick (3 preflight, 1 on the farm render); earlier rounds not noted | 0 | 2 (render 1 failed its check: two single frames at cuts) | 20 | 503 | 647 on the clock (four cuts, the waits for his picks inside) | 71 foreground + 12 background commands (11 drafts, 38 stills) | Fable 5.2 high | at least 61 | ? | cuts A+B: keeps the extreme one, wants a horror build-up, scared faces, horror music, panels first (as images). Panel sheet: monster smaller, more evil, very fast, a creepy shadow, but show the giant too. Draft H: likes it a lot, filter moment seems random, hook die too hard (now get haunted). Picked S (small shadow) | against fff-01 (29.7 s pilot): preflight runs 28 for four cuts = 7 per cut (27 + 6 for one clip there): keep #195; lookups 144 vs ~90 with a new rig and four cuts: no drop; machine 71 min for 11 drafts. Second video in a row with a farm render lost to a single frame (share-or-steal-02): next fix = the draft prints its own pops line |
| 2026-11-12 | you-wake-up-mid-01-plane-crash (2 endings) | 35.8 | series pilot, two endings from one build, cabin with tearing tail, falling jet, wreck on a cliff, slide, eyelid POV, music style danger; rebuilt once from 16 panels after v3 was rejected | 174 | 3 full + 1 partial + 14 preflight runs | 3 before the render + 2 on farm renders + 2 for Jonny's notes | 0 | 4 per cut (1: pop and strobe; 2: next strobe window; 3: Jonny's five notes; 4: his four notes of round 3: hat still cut by the bins, neck mask read as a ring, explosion sound, orchestral music) | 6 | 535 | 1275 on the clock (a night's wait inside) | 119 foreground + 14 background commands | Fable 5.2 high | at least 77 | ? | v3: boring explainer, wants panic, action, 10x, panels first; v4 drafts: go i like both; final cut 1: wizard in the ceiling, mask on Viking's eye, two run in the air, slide sound, cut B must show he does not survive; round 3: wizard still glitching (hat in the bins), what is this ring (neck mask), needs an explosion sound, more dramatic music; then: keep the music, no change at 0:20; better merge it (MERGED #208) | open: three glitches reached Jonny that were visible on the director's own sheet; the picture check (pops, strobe) never ran on a draft and names only its worst strobe window (2 farm renders). Next fix candidate: qa/pops.mjs lists every strobe window + a per-character sheet question. Pops line on its drafts: printed, no pop failed a farm render after it (renders 3 and 4 were Jonny's notes, not pops): kept. |
| 2026-11-12 | theres-a-catch-05-back-to-life | 22.5 | opener B cold open, museum hall + street sets, 5 prop packs, real-anatomy animals as one skin (makeLoft: rex with rig, mammoth, sabretooth, pterosaur, hillneck), lifesparks, narrator, recorded-sounding orchestra score laid on the beats (make-score.py) | 187 | 7 full + 2 partial + 15 preflight runs | 1 after the go on the final (farm render 1: pops); before it by Jonny's notes: 1 animal rework, 3 music rounds | 1 | 2 (render 1 failed pops: light rings crossing the lens in one frame at 7.77 and 8.87 s) | 12 | 509 | 811 wall clock, a night's pause inside | 86 foreground + 15 background commands | Fable 5.2 high; builders Sonnet (3 animal packs, 5 prop packs) | ? (472k tokens out, 91.7 M cache read) | ? | draft 1: no ringing sound on the touch, commentator missing, chase music not dangerous, T. rex and animals must look real not like bowls fitted together, two float beside the lamp; draft 2: everything good except no dramatic orchestra music; draft 3 (synthesised orchestra): sounds like game music, wants piano trumpets timpani; drafts 4A/4B: picks A, music a bit louder | draft pops line: NOT a fair test, the branch was cut before #207 so no draft printed it; run on the old draft afterwards it names both failing frames (37, 36), so it would have kept renders at 1. Stays on test for the next video. |
| 2026-11-12 | survive-it-04-zombies | 28.2 | flat, street canyon, shop, horde, ladder props (3 builders); orchestral score in 3 parts (soundgen + new score.py); captions in the upper third | 184 | 10 full + 1 partial (preflight 8) | 1 | 1 | 1 | 12 | 362 | 849 | 98 | Fable 5.2 high, Opus 5.5 from the polish | 57+ | ? | draft 1: lettering in the upper third, dramatic music after research; draft 2: way better i like it | sync: true on instant cut cheats (new: rig-jumps two frames into each shot came from timing offsets) |

Records before 8 Nov and the other clips of 8 to 10 Nov are the "Trial" lines in `docs/STATE.md`, as written then.
