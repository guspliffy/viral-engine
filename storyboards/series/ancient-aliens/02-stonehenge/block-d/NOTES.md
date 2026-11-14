# Block D notes (ancient aliens EP02 Stonehenge, story 2:36-3:28, panels 37-48, sheet 4)

Generator: `make-aa02-block-d.mjs` -> two storyboards per frame shape, cut on the change of light and place:
`aa02-d-sun-<frame>.json` (SH_D, 31.0 s = 2:36-3:07) and `aa02-d-dusk-<frame>.json` (SH_DUSK, 21.0 s = 3:07-3:28).
`--tall` also writes the tall pair (only after Jonny's OK on the wide animatic). Lines: `lines.mjs` (STORY.md word for word,
tones), spoken lengths `lines.json` from `measure-lines.mjs` (VoxCPM2 "reaper"): ago 4.36, giants 5.54 (excited),
picture 3.59, low 5.29 (sad), across 4.17, parking 1.39, closed 1.21, nobody 1.45.

## Shots (block time) and the score (kit score.py)
| t | Shot | Place | Score |
|---|---|---|---|
| 0.0 | parchment drawing 1, year counter 2026 -> 1136 | PLACE(7) pages 10 m apart | calm-landscape-09 (156) |
| 5.0 / 8.0 | drawing 2, the giants wade the sea (pan, then push) | | |
| 10.8 | drawing 3, the giant sets the top stone, the wizard | | |
| 12.6 | MATCH CUT 2500 BC: the lifter, gloves up, top stone 1 settles on its knobs (clack 14.45), Spud beside him | PLACE(1) | |
| 15.0 | THE LOW today: Spud sits on a fallen stone (own `fallensarsen` seatL, top 0.42), sheep lying, sun left of Stone 56 | PLACE(2) | calm-landscape-06 (171), out by 21 |
| 21.0 | today: he crouches at the Altar Stone's exposed east end, palm on it; sun at Stone 56's left edge; 0:03-0:01 no voice, no music | PLACE(3) | silent |
| 24.0 | same frame 2500 BC: the sun in the slit, `sunshaft` show 0 -> 1 | PLACE(4) | sos-warm (180) |
| 27.0 | the ring ship comes out of the sunset down the line | PLACE(5) | swell (183) |
| 31.0 | dusk: the ship settles ring on ring, clunk 34.5, frost poofs round the rim | dusk PLACE(0) | swell peak 190.5 |
| 35.0 | the crew up on the hull (stretch, yawn, foreman nods); "30 m" counts | | suspense (191) |
| 38.0 | Spud turns to us, points up | | |
| 40.4 | "It's a parking space." close, a "P" sign | | silent |
| 42.4 | "Case closed." | | swell rings out (198.3) |
| 44.6 | tag: the haul team (`haulteam` along 0.18 -> 0.62) behind him; he looks back, turns, walks to the lens | dusk PLACE(1) | sneaky (200.6) |

## Decisions
- The camera must stand ON the axis (x 0.15) for the sun to touch Stone 56's left edge today and sit in the slit in 2500 BC;
  above y 2.4 so it is not inside the `sunshaft`. The low (panel 41) is mirrored: the sun comes from the left (BOARD wins).
- Panel 40's real scale: the trilithon is 4.9 m, so the lifter and Spud stand 2 m out from the ring, camera low (y 0.85).
- The tag is 2500 BC with the ship parked (continuity from the payoff), dusk 0.8.
- Each actor is hidden outside its own shots (`only()`): a body at another place then never enters a check's projection.

## Engine lessons (for the next block)
- A place at the world origin WITHOUT `salisburyplain` (the parchment desk) leaves the plain set's floor mask visible, and
  the caption-cover silhouette paints it white: every caption "hidden behind characters". Never use PLACE(0) for an insert.
- No arm pose "spread": use `{ o: [0.45, 0.55, 0.2] }` on both sides. Expressions: "shocked" (not "shock"/"surprised").
  "nod" is a macro (`c.macro(t, who, "nod")`).

## Finals v1 (14 Nov, commit 4b06c09, farm runs 315-320)
- Wide 52.0 s = sun-wide 31.0 + dusk-wide 21.0; tall 55.0 s = sun-tall 34.0 (3 s hook) + dusk-tall 21.0; files in
  /mnt/project-files/videos/ancient-aliens/02-stonehenge/block-d/ (block-d-wide-FINAL-v1.mp4, block-d-tall-part4-FINAL-v1.mp4).
- The frost poofs at the landing are `sound: false` (realistic-sounds warn).
- The farm's dusk-wide had ONE flashing frame (a white glow over the stones at 17.97 s, "pops" warn) that a local
  `--stills 17.9667` does not show: a farm-shard glitch, not the storyboard. Patched by overlaying that local still on the
  frame (ffmpeg overlay, enable eq(n,540): the filter's n is one more than select's n here). Re-render = check pops again.
- Warns left (named in the delivery): shell on the headlamps, hand-jump / palm-turn on the tag turn, blink-on-line,
  the "...Nobody saw that." subtitle over his forehead in the last 2 s (panel 48: the face fills the frame).

## Finals v2 (14 Nov, commit 62295d9) = APPROVED ("well done merge it", 18:41 Berlin)
- Jonny: "the lettering are overlaying" (both shapes). The year and metre counters now sit UNDER the subtitle: `NUM_Y` 330 wide /
  660 tall (top of the text), captionBand widened to [30, 490] / [200, 820]. The kit's F.NUM sits inside a 2-3 line subtitle.
- The farm flashed at dusk-wide 17.97 s again (every farm run, never locally): patched the same way. One sun-tall farm shard
  hung in setup for 20+ min: cancel the run and dispatch a fresh one.
- Files: block-d-wide-FINAL-v2.mp4 (52.0 s), block-d-tall-part4-FINAL-v2.mp4 (55.0 s). The kit thread merges this branch at the join.

## Open for polish (after Jonny's notes on block A, applied to all four)
- hand-jump warns (lifter's arms down 14.6, Spud's arm on the palm, the point, the tag's spread arms), blinks on lines.
- the subtitle over his face in the last 2 s (the face fills the frame, panel 48).
- the tall cut: its own 3 s hook (kit BLOCKS.md "The vertical parts open on their own hook"), tall cameras.
