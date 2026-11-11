# Hot Potato 01 (pilot): notes

Brief now: version 2, Jonny's go on the 12-panel sheet and the clown sheet, 11 Nov 2026 20:22 Berlin (`PANELS.md`).
Status: version 2 rough draft sent to Jonny 11 Nov; polish, checks on the draft and the full render wait for his OK.

## Why version 2 (Jonny on draft 3, 11 Nov 19:52 Berlin)

"there are lettering overlaying, as such i like the video but to me i dont really understand it. its really weird ...
how can we make the game more clear? also i dont think wizard should be fried. and i dont think dragon should be
fireproof because this makes the game even more unlogical to me. we should stage it differently. the characters
should stand in a triangle, wizard should look evil. or we use a new character, maybe a evil clown, then we make
dramatic close ups of the characters faces, shocked and with fear of getting fried".
So: ONE rule, said once and shown by 1.5 s; nobody has a special power; the host never loses; players in a triangle;
face close-ups carry the fear; one text on screen at a time. His earlier notes stay: commentator voice, the danger
shown (fire out of the hole), a creepy music box tune.

## Version 2: numbers and lessons

- Stage top y 1.2, round, radius 2.5. Tiles (x, z): Viking [0, 1.15] front, Dragon [-1.2, 0], Gunslinger [1.2, 0],
  Spud [0, -1.15] back; the two at the sides stand at yaw +-50. Balcony floor y 2.6 on the wall (z -2.7), the clown
  at z -2.27, lever on the parapet at x 0.45.
- The clock is `hpclock`, pinned to the screen top right: every wide keeps the sign left of it (camera x 0.3).
- A face close-up has no free strip for a subtitle (qa/camfit.mjs says so): shouts are text pops beside the head,
  and the commentator's subtitle waits for the next wide. Captions lie under the caption-overlap check whatever
  their `pop` flag.
- A release's `arc` is not a parabola: it peaks two thirds of the way at 0.59 x arc. A high throw that must hang
  under a top camera = a release straight up to a point (ease out), then the prop's own tween down (set its x, y, z
  at the apex first: a tween starts from the prop's own numbers), then the catch. A grab with a `dur` snaps.
- The same holds after a `carry` ends: set the prop's place, then tween.
- hptile `hot` glows over an open hole: switch it off as the tile opens.
- A camera at [0.12, 1.7, 4.25] rendered black (unknown why); 3.75 is fine.
- The commentator's "coal" is heard as "cold" or "call" by Whisper in both takes: Jonny judges it by ear.
- A text pop sits right of the head by default, which is where the clock card lives: `dx: -0.6` puts it left.
- Opener (Jonny's test, 11 Nov): type A, the contest already runs at frame 0 (coal in Viking's gloves, clock at 1,
  the narrator at 0.0). Not met, by his panel 01: it is a close shot of one character, and the first subtitle
  waits for the wide at 1.3 s. Name the type in the delivery.
- The evil laugh (Jonny 21:41 Berlin on the rough draft: "make the clown laugh evil the rest is good to go"): a talk
  `pattern` in his own voice (two low chuckles, a climb, a long falling last one). The FACE makes it evil, not the
  head: thrown back 7 degrees the brows read raised and jolly from the balcony camera; 14 degrees forward the mouth
  sinks behind the parapet; upright with brows low, lids half down and the mouth wide open reads evil. Three still
  rounds to learn that. Leaning 9 degrees his collar frill pokes through the parapet in the close shot.
- From straight above a hat brim hides the whole face: the `hat` verb slides it back for the look up.
- The top-down shot saw the dark floor past the vat: the vat's front edge is 2 m nearer now (d 7.4, z 1.2).
- Counts for version 2: layout runs 9, draft-still rounds 5, draft renders 2, builders 2 (stage 153k tokens,
  clown 243k tokens), narrator reads 2. Review A skipped again (weekly limit; Jonny looks at the draft first).

## Version 1 (row of four, rejected): numbers the set and the clip stood on

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
