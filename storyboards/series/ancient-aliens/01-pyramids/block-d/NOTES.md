# Block D notes (ancient aliens EP01, story 2:18-2:55, panels 26-36)

Generator: `make-aa01-block-d.mjs` -> `aa01-block-d.json` (37.0 s, one storyboard in SET_NIGHT). Line lengths:
`measure-lines.mjs` (VoxCPM2 "reaper"): belt 1.36, star 2.51, pyr 1.76, shaft 2.44, years 2.29, us 1.97, home 2.51,
closed 1.21, nobody 1.45.

## Places (1000 m apart) and cameras
| Place | Origin | What | Camera |
|---|---|---|---|
| night | [0, 0] | kit nightOver, Belt only (deg 12, roll 148: Mintaka left over Menkaure, the Belt about level over the three tips), moon [352, 26] out of frame | todayWide low (1.2 m), one move tilting down to the pyramids on "So does the smallest pyramid" |
| room | [1000, 0] | kingschamber lamps false (the headlamp is the light); Spud under the south shaft (x 2.735, sill 0.92) | from the east, his side |
| shaft | [2000, 0] | starshaft len 18 (opening 3.2 deg), aasky night + starfield, Belt (rot 180 to face the camera, deg 1.2, size 3.2) 80 m up the axis | at the lower end, a slow push up |
| home | [3000, 0] | giza2560 finished at night, ring ship (shipK 2.5) over the tip, Belt (deg 8) at about 17 deg, crowds of workers and aliens, worker-b + crew + lifter beside Spud | behind them, low; payoff: in front of Spud, pyramid upper right |
| tag | [4000, 0] | relievingchamber, gangmarks at y 0.62 (lower than the kit's 0.75 so Spud's 0.88 m body covers the cartouche), oillamp, paintbowl, reed brush in worker-a's LEFT hand | from the south inside; close-up for the last line |

## Decisions
- One light (SET_NIGHT) for the whole block: night outside, dark rooms.
- The ship ends as a "point of light" by a cut: the big ring rises toward the Belt in the wide; in the payoff a second
  ringship at s 0.05 ("dot") glides into line with the Belt (Alnitak -> Alnilam line, 1.7 steps past Alnilam).
- c.say is never voiced in a beat storyboard: every host line uses kit hostSay (say macro, subtitle y 400); trimSubs()
  ends each subtitle where the next starts.
- Face angles: 0 faces +z (the camera), positive turns toward -x (135 faced north-west); turns go 330 -> 360, not to 0.
- Music false (the join lays one bed). Sounds: ai/storm-wind 0.06, rumble for the ship's hum, step-concrete, pat, crinkle.

## Open for polish (after Jonny's OK on the animatic)
- worker's brush strokes and hand on the wall; Spud's arm-spread hands; deadpan face at the end (Spud has no lids).
- next round: merge ancient-aliens-kit (6c2339d+) and replace the CLUE 5/5 cap with the kit's clueTag(c, 0, 17, 5) (one style for all blocks).
- v2 DONE 13 Nov: score(138), clueTag, How we explain restage, kit 3d1a66b (gold-capped pyramid); sent as animatic v2.
  pilot score: swell under the ship going home, out before the tag, small pizzicato under the tag); apply kit/BLOCKS.md
  "How we explain" (Jonny on block A: "we need some background music ... right now it's pretty plain and boring"): show
  the fact happening, Spud never a talking statue, start on the evidence, a change every 3 s, numbers move.
