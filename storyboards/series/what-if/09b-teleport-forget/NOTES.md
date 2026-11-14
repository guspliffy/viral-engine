# NOTES: teleport-forget (There's a catch EP09b, the director's working memory)

## Where the build stands
- 13 Nov ~19:00 Berlin: Jonny "go for it, dont forget to add music fitting the situation" on the 16-panel board.
- DESIGN.md (Fable 5.2 subagent). Builder T1 (Sonnet): engine/page/props-gorge.js (gorge, bridgerope, planks) + bench/.
- Score: assets/music/teleport-forget/ (four library takes on the beats, README there).
- Engine change (director): fx photo style "screen" + `fade: { hide, at, dur }` (engine/page/stage.js screenCard): the
  phone insert where Spud fades out of the photo. Needs qa/golden.mjs before the PR.
- Generator first pass on stand-ins (READY="" = boxes): layout contacts down to a handful.

## Places (world, DESIGN 1.5)
- Rope x 0, near stake z 0.5, far z -9.5, lowest y -0.9 at z -4.5. Chip's L glove z -4.55, Spud's L glove z -5.15;
  HANG (glove y - root y): Chip 0.86, Spud 1.12 (layout 13 Nov: gloves land on the rope).
- Ledge: Spud (-0.5, 0.8), Wedge (0.55, 0.88) at frame 0. Lip: SPUD_LIP (0.2, 0.15) on the chunk, CHIP_LIP (-0.75, 0.2).
- Hood pull: Wedge from (-0.75, 1.08), fists at Chip's back (+0.36 z, y 0.45); Chip to (-0.75, 0.75).
- After the break Spud hangs at (0.2, y -1.0, 0.0), gloves on the rock either side of the notch (-0.12 / 0.52, 0, 0.25).
- Fall alone in corridor B (z -0.55). Jump 3: KNEEL3 (0.55, 0.75) yaw -140; Chip (-0.3, 0.7) 140; Wedge (-0.95, 1.15) 155.
- Mash's flat: zroom (dress living) at z -260, couch at z -261; phone placed at (0.1, 0.78, sofa + 0.38), rot 180.
- Photo doubles (pwedge, pspud, pchip, pmash) at x 4.85..7.28, z 1.5; PHOTO_CAM DESIGN 6. Never on screen.

## Decisions
- Frame of 10-15: the camera hangs over the gorge looking back at the ledge, so faces turned to the drop read.
- Panel 13 (from below) is shot from ABOVE the lip: Spud falls away face up to the two at the edge (his face carries it).
- Narrator lines from fire rewind's pattern: stake, "But you can teleport.", "But there's a catch.", the rule,
  "Would you still jump?" after Chip's line.

## Names looked up
- grips.phone(c, who, PHONE, { side }) + c.arm(prop grip) + grab (pause-time pattern); grips.placeFor("phone", at, rot).
- Sounds on the whitelist: ai/storm-wind (gorge wind), windswell (air on a fall), creak, crumble, scrape,
  ai/branch-snap (rope strand), plank-rattle, crinkle. `nature/*` and `tap` are not whitelisted.
- set plain floor "none" = sky dome, no ground.
