# Hot Potato 01 (pilot): notes

Brief: Jonny's 10-panel sheet (`panels-sheet.png`), his go 11 Nov 2026 12:23 Berlin. Panel notes: `PANELS.md`.
Status: rough draft 2 sent to Jonny 11 Nov (13.6 s); polish, checks on the draft and the full render wait for his OK.

## Numbers the set and the clip stand on

- Stage top y 1.2, four tiles 0.95 apart (Viking, Spud, Dragon, host), stage front z 1.45, wall z -2.7, sun y 5.05,
  card y 3.95, sign y 3.4, vat on the kitchen floor in front of and under the stage.
- A glove at arm pose height `up` is at y 1.2 + LEG + up; LEG: Viking 0.18, Spud 0.09, Dragon 0.125, host 0.1 (peek).
- The coal is held at the belly (UPS in the generator): at 0.3 and up it covered mouths and eyes.
- Cameras: wide `frame([0, 2.5, 0], h 6.9)`; mediums level at y 2.3 from z 4.1; closes from y 2.2 looking down a
  little. From those the strip between the sign and the heads is free for a subtitle (y 672; 800 on the wides).

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

Layout runs 9, draft-still rounds 4, draft renders 2, builders 2 (set 266k tokens, hand props 370k tokens), fix rounds
on the staging 2.
