# State (<= 40 lines; with CLAUDE.md and `git log` it is all a fresh session needs)

Updated 9 Nov 2026 (main c0a90c7 + workflow v2 PR #179).

## On main
- Template turns on: castLook "sheet", physics, holds 2, motion layer (overlap/timing/solve), feet 2, lighting 2,
  living worlds `"life": "auto"`, anime look (`cel` + `animeTiming`, #168; `ink` + `satsuei`, #174), sound guard, music bed, every line
  subtitled, DoF off.
- Checks: preflight one verdict, contact gate, rig, glitches (optical flow), prop-in-self, colour, lines (phone
  line + loop seam), golden + regress on every PR.
- Rigs: potato cast, VRM humans (vrm-v1), VFX via Effekseer (`tools/vfx/fetch-effects.sh` first) or its seven effects redrawn as drawn cels (`"do": "cel"`, #174).

## Open PRs (awaiting "merge it" unless noted)
- #193 Survive it EP1 snowed in (also pins CI to ubuntu-24.04: farm renders fail on ubuntu-latest until it is merged)
- #172 How to 02 seesaw · #163 v3 openings alien/zombies/zombie too · #143 Pebble correction · #136 friends rig · #128 hand-pop causes · #109 too-much-energy briefs · #86 reposts

## Next
- Trial workflow v2 (staging proof, director writes the clip) on the next episode.

## Trial (one line per clip: clip, minutes brief->delivery, thread tokens, subagent tokens, fix rounds)
- NHM EP03 old way: 465 min, Opus out 943k, Fable 0.31 M, 4 drafts, 32 warn. Jonny: better quality and logic. New way v1: 362 min, Opus 691k out, Sonnet 1.32 M + Fable 0.34 M, 2 rounds, 8 warn. Logic issues -> the director writes.
- NHM EP04: old 338 min $64 subagents 0.32 M; v2 director writes 323 min $73 0.61 M; v2 Fable writes 527 min $169
  2.27 M. Jonny 9 Nov: Fable writer out; old has cleaner hands, director's cut better cut + scenes except the hug turn.
- What if EP01 pause time (format B, 8 Nov): ~410 min brief->delivery (incl. new engine pause feature + animatic gate + a main merge), thread 906k in+out tokens (178 M cache read, $73), subagents 275k (Fable reviews A + B), 4 check-fix rounds + 1 round on Jonny's note (the cup beside the hand); 1 draft + 5 full local renders, ~25 min each; the farm has no VoxCPM2 voice.
- Survive it 01 island (format A, new format with animatic gate, PR #181): 449 min brief->delivery (about 170 of them waiting
  for Jonny's go on the animatic), thread 203k context tokens at delivery (after one compaction), subagents 286k (Fable
  review A 145k + B 141k), 3 quick contact-fix rounds after review B, 2 farm renders.
- What if EP03 race (9 Nov, v2 + savers): ~290 min brief->delivery, thread 0.91 M out ($74), subagents 0.62 M (Sonnet
  builder 0.29, Fable A 0.17 + B 0.16), 2 drafts, 5 farm renders (3 fix rounds after review B) + 1 sound-only remix.
- NLU S2 EP01 text him (9 Nov, no ref images, new set): ~265 min (30 waiting on Jonny), thread $50, 652k out, subagents
  0.67 M (Sonnet builders 0.33 M, Fable A 160k + B 182k), 2 drafts + 3 check-fix rounds on his 2 glitch notes, 2 full renders.
- Share or Steal 01 (9-10 Nov, new series + set, animatic gate): thread $59, 733k out; 2 drafts, 1 full render, no review B (Jonny approved the draft).
- There's a catch EP04 copy money (10 Nov, new workflow #189 + #190, director Fable 5.2 on high): ~315 min brief->delivery (no waiting on Jonny), thread $92, 1.28 M out, 128 M cache read; subagents 1.09 M (Sonnet builders 0.88 M for four prop packs, Fable A 124k + B 87k); 1 draft, 1 check-fix round (0 fails), 1 farm render after review B, 10 windows in frame, 30 engine lookups, 15 full + 26 partial layouts, 14 waiting steps.
- Survive it EP1 snowed in (9-10 Nov, from scratch to Jonny's panels, new room + mountain): ~560 min, 4 Sonnet builders + Fable A + B, 1 draft, 4 farm renders (3 fix rounds), sound redone locally; ~70 min lost to the farm on Ubuntu 26.04.

## Decisions (one line each, with the reason)
- 8 Nov: workflow from Jonny's motion studio kit adopted on our own engine, not Remotion (keeps 3D cast, physics,
  checks; Remotion needs a company licence). Builders on Sonnet at high, Fable reviews at xhigh (Jonny).
- 8 Nov: animatic gate only for new series or formats (Jonny).
- 9 Nov: the director (Opus 5.5 xhigh) writes every clip; Fable 5.1 as clip writer dropped, cost 2.3x for no clear gain (Jonny).
