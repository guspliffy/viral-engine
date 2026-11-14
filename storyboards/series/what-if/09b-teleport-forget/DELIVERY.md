# There's a catch EP09: teleport, "Every jump, someone forgets you" (delivery, 13-14 Nov 2026)

Final: /mnt/project-files/videos/what-if/09b-teleport-forget/teleport-forget-FINAL.mp4 (28.6 s, 1080x1920, 30 fps),
farm run 43573367991 (14 Nov fix), qa/check PASS (28 creative notes, CHECK-FINAL.txt beside it). Opener A (the stake at frame 0).
Post pack: POST-PACK.md beside the video.

## Rounds
- Rough draft 1 -> Jonny: cliff not recognizable, no drama on the rope, Spud never really fell at 0:16.
- Draft 2: gorge v2 (DESIGN-GORGE-V2.md, Fable design, builder), opening from above down the drop, rope swing +
  scream + shake, the fall fixed (a `move` with `y` started with a `drop` held him at the lip) + chase camera. Jonny: "polish".
- Polish: 0 contact fails (Spud hangs on -x of the rope so his rope glove is on his left side; Wedge comes in
  from Chip's side and pulls the hood beside Spud, where his blank look is in view), the catch line starts with the
  phone shot (a caption ends with its beat in compile.mjs), sky camera under the phone inserts (the caption check
  measures the 3D frame under the card), the last close-up reframed.

## Jonny's notes on the final (14 Nov 07:34 Berlin), fixed
- 0:14 "he gets pulled through the wood": Chip stood and was pulled through the near bridge post (x -0.9). Chip now
  stands at x -0.56 and is pulled to x -0.52, 0.4 m off the post; his arms stay in.
- 0:05 "phone hold": Mash now holds the phone the way he did in EP06 read-minds (left hand on the edge, chest height,
  screen toward him); the right glove rests in his lap.

## Departures from the board (with reasons)
- 01: from above the two, straight down the drop (Jonny's note: the cliff must read; from behind them the lip hides the walls).
- 11: Wedge pulls Chip from beside Spud, not from behind Chip (behind, Chip hid Wedge's face, which is the beat).
- 13: Spud falls alone seen from above with the camera chasing him (from below the edge and friends were too small).
- The strands fray beside Chip's glove, not between the two gloves.
- Opening line "Your best friend is falling." (the longer line ran into the next one).

## Sound (Claude can't hear: Jonny, with headphones)
0:02.0 rope strand pop (quiet under the music) · 0:04.4 dust scuff where Spud vanishes · 0:08.9 / 0:10.0 creak
and strand pops on the rope · 0:21.0 "...who are you?" (does it land, with a breath before it).
Music: assets/music/teleport-forget/teleport-forget-score.ogg (orchestra from 0.0, hush on Mash, hard back on the
snap, sad cue from "...who are you?").

## Engine changes on this branch
- engine/page/props-gorge.js (new kinds gorge, bridgerope, planks; v2 relief, 230k triangles, 0.95 s/frame).
- engine/page/stage.js: photo fx style "screen" with a cross-fade (`fade`), snapshot camera lent to the styler.
- engine/render.mjs: `--layout` honours `--force` (the farm could not make a forced rough draft).
- qa/golden.mjs after the gorge v2 build: all 12 stills and 5 strips unchanged.
