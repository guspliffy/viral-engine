# State (<= 40 lines; with CLAUDE.md and `git log` it is all a fresh session needs)

Updated 8 Nov 2026 (main ad03ca5 + the motion studio workflow PR #171).

## On main
- Template turns on: castLook "sheet", physics, holds 2, motion layer (overlap/timing/solve), feet 2, lighting 2,
  living worlds `"life": "auto"`, anime look (`cel` + `animeTiming`, #168; `ink` + `satsuei`, #174), sound guard, music bed, every line
  subtitled, DoF off.
- Checks: preflight one verdict, contact gate, rig, glitches (optical flow), prop-in-self, colour, lines (phone
  line + loop seam), golden + regress on every PR.
- Rigs: potato cast, VRM humans (vrm-v1), VFX via Effekseer (`tools/vfx/fetch-effects.sh` first) or its seven effects redrawn as drawn cels (`"do": "cel"`, #174).

## Open PRs (awaiting "merge it" unless noted)
- #172 How to 02 seesaw · #163 v3 openings alien/zombies/zombie too · #143 Pebble correction · #136 friends rig
- #128 hand-pop causes · #109 too-much-energy briefs · #86 reposts

## Next
- Trial the motion studio workflow on the next episode (docs/rules/workflow.md "Measuring").

## Trial (one line per clip: clip, minutes brief->delivery, thread tokens, subagent tokens, fix rounds)
- Survive it 01 island (format A, new format with animatic gate, PR #181): 449 min brief->delivery (about 170 of them waiting
  for Jonny's go on the animatic), thread 203k context tokens at delivery (after one compaction), subagents 286k (Fable
  review A 145k + B 141k), 3 quick contact-fix rounds after review B, 2 farm renders.

## Decisions (one line each, with the reason)
- 8 Nov: workflow from Jonny's motion studio kit adopted on our own engine, not Remotion (keeps 3D cast, physics,
  checks; Remotion needs a company licence). Builders on Sonnet at high, Fable reviews at xhigh (Jonny).
- 8 Nov: animatic gate only for new series or formats (Jonny).
