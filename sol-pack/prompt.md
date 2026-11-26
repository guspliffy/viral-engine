# Sol round 2 (final check): glitches, logic and last timing notes — "La Lechuza" (folklore legend ep 2, draft 3)

You checked draft 2 in round 1 (VERDICT FIX 26: 15 timing edits + 11 glitch/logic items). Draft 3 applies all of them and is now 60.4 s (vertical 1080x1920, 30 fps). You get NO video, only images in this folder:
- `beats.txt`: every shot (start-end s, what it shows; this is your round-1 beat list, built) and every voice line with its times.
- `sheet-1fps-00-31s.jpg`, `sheet-1fps-31-end.jpg`: one frame per second (12 per row, left to right, top to bottom; the second sheet starts at 31 s).
- `strip-5fps-00s.jpg` ... `strip-5fps-60s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

The video: real folklore of northern Mexico/South Texas, La Lechuza (a witch who becomes a giant owl and cries like a baby so children open the window). Hosts: stern grandmother (indigo cloak, white bun, staff lamp = fear meter) and a curious 12-year-old boy (red quilted jacket). Story (approved, keep): cry + latch + slam "Don't open it. That's not a baby." -> who La Lechuza is -> "Real babies don't cry from the roof." -> roof steps -> silence -> GRANDMA'S OWN VOICE outside "Open the window, sweetheart." -> "Grandma... that's you." "I know." -> barn owls scream (fact) -> salt jar empty, "It was movie night!" (popcorn) -> eye in the shutter gap -> "We insult her." -> grandma's insults, voice cracks -> "Your turn." polite boy -> "Real babies BREATHE between crying!" -> owl flies off -> "Not bad." hard cut. Drawn fully in code (flat 2D, 2.5D sets, moving camera); colour follows threat (warm = safe, violet/teal = owl close, warm returns at the end). Known engine limits: the owl rig has no per-foot lift (the roof step is a hop-and-sway); no on-screen text except subtitles.

## Part A — VERIFY round-1 items
For each of your 26 round-1 items, one line: DONE / PARTLY (what is missing) / NOT DONE, judged from the images.

## Part B — NEW glitches and logic
Every visible glitch (pops, flicker, limb through a body, prop in the air, face cut off by the frame, subtitles over a face or touching the side edges, size jumps between shots, colour/mood jumping wrongly) and logic issue (effect before cause, prop or shutter state jumping, reaction to something not shown, character in the wrong place between cuts), each with its time and a concrete fix. Only real problems a viewer would notice on a phone.

## Part C — at most 3 last timing notes
Only if something still plays too slow or too fast. The producer said 2 Sol rounds are enough; after this round the fixes go straight to the final render, so be precise.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of PARTLY/NOT DONE in Part A + Part B items + Part C notes).
Write your full answer to `answer.md` in this folder.
