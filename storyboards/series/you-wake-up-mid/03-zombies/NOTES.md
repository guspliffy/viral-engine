# NOTES: You wake up mid EP03 "mid zombie apocalypse"

Read this first after a compaction. Jonny's go on the panels 12 Nov 2026 21:47 Berlin ("looks good" on the Codex sheet
wake-up-zombies-14-panels-v1.png; the sheet is on his PC, not here yet). Outline v3 (OUTLINE.md) is the target where the
sheet departs (departures listed in /mnt/project-files/video-scripts/2026-11-11-you-wake-up-mid/panels-03-mid-zombie-apocalypse/PANEL-NOTES.md).
Model-split trial video: Opus directs and writes the generator; the new looks (zroof, zstairs, zwait) were designed by a
Fable 5.2 subagent (DESIGN.md); Sonnet builders build them.

Branch you-wake-up-mid-03-zombies is cut from survive-it-04-zombies (unmerged, PR #213 held) because it reuses that
branch's zombie props (zstreet, zhorde, zshot, zrevolver, zstreetdoor, zroom) and the approved sounds (ai/zombie-groan,
ai/zombie-horde, ai/revolver-shot). The PR must say so; merge after #213 or carry its commits.

## Rules in force (Jonny)
Stake-first line at 0.0 + 2-4 word text upper third; no two voices at once (picture placed on MEASURED line lengths);
one shot per panel; realistic sounds only (no blings, whooshes that only mark motion, signature sounds off); captions
upper third; recorded orchestra from 0.0; hold the ending; no gore; feet on something, props on the right body part.

## Build state
- [x] Outline v3, sheet (Jonny "looks good")
- [ ] DESIGN.md (Fable) -> briefs T1 zroof, T2 zstairs, T3 zwait -> builders
- [ ] Narrator lines measured (measure-lines.mjs, VoxCPM2 set up in this container)
- [ ] Generator make-wake-zombies.mjs, staging stills, rough draft to Jonny, STOP
- [x] Narrator lines measured 12 Nov ~22:20 Berlin (DUR in the generator); "stopped" misread as "You've stopped" (try take 2 in polish)
- [x] Generator v1 written (43.9 s story, ~46 s video with the two slow ramps). Preflight: 11 fails, all staging (bodies apart, captions behind bodies) -> fix after the staging stills
- Names looked up: vote(c,t,dur,question,options) overlay for the choice card; ramp(c,t,len,rate) slow motion; pov action hides his head; zshot walks +z only (the P01 drag moves the prop's z).
- npm ci was needed in this clone (three missing).
