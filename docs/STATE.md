# State (<= 40 lines; with CLAUDE.md and `git log` it is all a fresh session needs)

Updated 8 Nov 2026 (main ad03ca5 + the motion studio workflow PR #171).

## On main
- Template turns on: castLook "sheet", physics, holds 2, motion layer (overlap/timing/solve), feet 2, lighting 2,
  living worlds `"life": "auto"`, anime look (`cel` + `animeTiming`, #168), sound guard, music bed, every line
  subtitled, DoF off.
- Checks: preflight one verdict, contact gate, rig, glitches (optical flow), prop-in-self, colour, lines (phone
  line + loop seam), golden + regress on every PR.
- Rigs: potato cast, VRM humans (vrm-v1), VFX via Effekseer (`tools/vfx/fetch-effects.sh` first).

## Open PRs (awaiting "merge it" unless noted)
- #172 How to 02 seesaw · #163 v3 openings alien/zombies/zombie too · #143 Pebble correction · #136 friends rig
- #128 hand-pop causes · #109 too-much-energy briefs · #86 reposts

## Next
- Trial workflow v2 (staging proof, director writes the clip) on the next episode.

## Trial (one line per clip: clip, minutes brief->delivery, thread tokens, subagent tokens, fix rounds)
- NHM EP03 old way: 465 min, Opus out 943k, Fable 0.31 M, 4 drafts, 32 warn. Jonny: better quality and logic.
- NHM EP03 new way v1: 362 min, Opus out 691k, Sonnet 1.32 M + Fable 0.34 M, 2 rounds, 8 warn. Logic issues
  (builder wrote the clip, staging frozen unseen) -> staging proof + director writes the clip (8 Nov).

## Decisions (one line each, with the reason)
- 8 Nov: workflow from Jonny's motion studio kit adopted on our own engine, not Remotion (keeps 3D cast, physics,
  checks; Remotion needs a company licence). Builders on Sonnet at high, Fable reviews at xhigh (Jonny).
- 8 Nov: animatic gate only for new series or formats (Jonny).
