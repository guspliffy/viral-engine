# Hot Potato 01 (pilot): notes

Brief: Jonny's 10-panel sheet (`panels-sheet.png`), his go 11 Nov 2026 12:23 Berlin. Panel notes: `PANELS.md`.
Status: rough draft 3 sent to Jonny 11 Nov (15.0 s, from his notes on draft 2); polish, checks on the draft and the full
render wait for his OK.

## Numbers the set and the clip stand on

- Stage top y 1.2, four tiles 0.95 apart (Viking, Spud, Dragon, host), stage front z 1.45, wall z -2.7, sun y 5.05,
  card y 3.95, sign y 3.4, vat on the kitchen floor in front of and under the stage.
- A glove at arm pose height `up` is at y 1.2 + LEG + up; LEG: Viking 0.18, Spud 0.09, Dragon 0.125, host 0.1 (peek).
- The coal is held at the belly (UPS in the generator): at 0.3 and up it covered mouths and eyes.
- Cameras: wide `frame([0, 2.5, 0], h 6.9)`; mediums level at y 2.3 from z 4.1; closes from y 2.2 looking down a
  little. From those the strip between the sign and the heads is free for a subtitle (y 672; 800 on the wides).

## Jonny's notes on draft 2 (11 Nov 14:03 Berlin) = the format from here on

"we need a commentary voice for this format, wizard as the evil game master must be more clear and evil - make him
look evil / the danger of the situation isnt really clear here. it should be something like hot potato drop or fry
maybe with a bit psychic children music". Built into draft 3:
- Commentator (voice `narrator`, on by default, `--no-vo` for the plain cut): the tagline "Hot Potato. Drop it, or
  fry." at 0.0, then "Dragon is fireproof.", "One second!", "Rules are rules.". Reads run 2.5 / 2.0 / 0.9 / 2.2 s: the
  storyteller is slow, so three or four words per line and no character line under one.
- Danger shown: a fire column shoots out of the hole after each drop, and the fried Viking comes back up in a fry
  basket in the first 2.5 s and stays on stage as the warning.
- Evil game master: cast `hot-potato/wizard-gamemaster` (red eyes, low brows, black hat, blood-red cape; the
  sheet-look robe takes `costume.sheetFelt` / `sheetCape` / `sheetSash` / `hakama`, not `accent`), rubs his gloves.
- Music: `sneaky` style with the `musicbox` part alone (a slow minor music box tune).

## What cost rounds (for the next episode)

- Storyboard `physics: true` turns every `release` with `to` into a rigid body that bounces off the thrower: the coal
  never reached the catcher. This clip has no physics bodies; throws are glides with `arc`.
- A catch is a grab with a grip a hair AFTER the flight ends (the same instant can still read as in flight, and the
  grab then blends from the thrower's hand: a 1 m pop).
- A `carry` rides the carrier's own tween, never a hand: the tongs move on tweens and the host's hand follows them.
- Checks read the video clock: windows after the slow motion start from the story time and end at END + 3.
- Spud's legs need `noOutline` with ink lines on (brown wall across the frame; line added in costumes-art-cast.js,
  the same line the Doomscroll thread adds).
- Potato arms are dark: a resting pose across the belly reads as a moustache from the wide. Idle arms go to the sides.

## Departures from the panels (with reasons)

- Wide shots: four potatoes on four separate trapdoor tiles need the full frame width, so each is smaller than drawn.
- Panel 03: the host steps along the front of the stage to Spud (Dragon stands between them on the sheet).
- Panel 08: the clock card stays on the sun and shows 1 (the sheet drops it for that one panel).
- Panel 07: no subtitle on Dragon's close shot (no free strip beside his wings); the "ah" there is a breath sound.
- Review A was skipped for the rough draft (Jonny's weekly limit, 11 Nov); his own look at the draft comes first.

## Counts so far (for the ledger row)

Layout runs 13, draft-still rounds 6, draft renders 4, builders 2 (set 266k tokens, hand props 370k tokens), fix rounds
on the staging 3. Voice install (VoxCPM2) about 12 min on a fresh container; 5 narrator reads.
