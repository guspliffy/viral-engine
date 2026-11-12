TASK T3: the neon city at night and the hotel room (engine/page/props-nightcity.js, NIGHTCITY_KINDS)
WHY: panel 08 is the "10x" moment: the power reaches the whole city, a thought bubble over every roof. Panel 12 is the
catch: Spud alone in a dark hotel room high above that city, never quiet again. Both must read as NIGHT and NEON.
DESIGN: BRIEF-COMMON.md, board.png panels 08 and 12 (this folder)
READ: BRIEF-COMMON.md; engine/page/props-nightdiner.js 1-70, 307-330; engine/page/props3d.js `bed` and `curtains`
(grep "  bed(" and "  curtains(" for their sizes) and engine/page/props-plane.js `pillow`
OWN: engine/page/props-nightcity.js; storyboards/series/what-if/06-read-minds/bench/make-nightcity-props.mjs (+ JSON,
sheet); storyboards/lib/grips.mjs: ONLY a SIZE entry for hotelpillow
CONTRACT (origin bottom centre unless said; ghost = see-through + not solid):
- neoncity: a night city seen from above and around: spec.w 120 x spec.d 120 of blocks: towers 8-60 m high in a seeded
  grid with streets between (glowing street lines, tiny car light dots), every tower with lit windows (warm yellow,
  some white, a few teal and pink), neon trims on roof edges in pink, violet and teal, a few big glowing billboard
  SHAPES (no text); in the middle at spec.casino [0, 0] a grand casino building 30 x 20 x 14 with a big glowing golden
  dome (r 7) and lit arched windows. A dark blue night sky dome with a few stars and a soft violet glow at the horizon.
  Self-lit enough to read with no scene light (it is night). Ghost (the cast never touches it). Keep it fast: merge the
  towers into few meshes, windows as a texture per facade (drawn once per tower from rnd, not tiled).
- nightskyline: a curved backdrop for windows: spec.w 30, spec.h 14, spec.r 18 (an arc of that radius about the
  origin, facing the origin, +z side open), a painted night skyline (towers with lit windows, neon tints, sky) that
  matches neoncity's colours. Self-lit. Ghost.
- hotelroom: a small dark hotel room, potato scale: floor 4 (x) x 4 (z), walls 3 high on the left, right and back
  (z -2), the front (+z) open; in the BACK wall one big window 2.6 w x 2.1 h, bottom at 0.7, centre x +0.5, with dark
  frames and its glass a ghost (the director stands a nightskyline behind it); heavy blue curtains drawn to the sides;
  dark blue wallpaper (hand-drawn, not tiled), a dark wood floor with a rug; a bedside table (0.45 x 0.45 x 0.5) at
  x -1.3, z -1.4 with a small lamp, switched OFF (no light). A double bed against the back wall at x -0.2: mattress top
  at 0.5, 1.5 wide x 1.9 long along z (headboard at z -1.9), a blue checked duvet over the lower two thirds, two white
  pillows at the head. The bed must work as a seat for the engine's "sit" (spec: the bed's own id as the seat; read
  how `bed` in props3d.js gives its seat height) so a potato sits up in it under the duvet. Room light: dim, blue; the
  window and the bubbles light it. Walls ghost, bed + table solid.
- hotelpillow: a single white pillow 0.5 x 0.3 x 0.12, soft rounded, a potato holds it pressed on top of his head with
  both gloves at its two ends (grips "L" and "R" at the short ends, report them); add its SIZE in grips.mjs.
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN:
- bench/nightcity-sheet.png shows: (a) the neoncity from 40 m above the casino roof looking out over the city (camera
  [0, 40, 25] at [0, 10, -40], fov 55), and (b) from straight above the dome; (c) the hotel room from the front
  (camera [0, 1.4, 4.5] at [0, 1, -1], fov 50) with a nightskyline behind the window and a Spud sitting up in the bed
  holding the hotelpillow on his head; (d) the hotelpillow in-hand proof (front + side). Night reads at 270 px: never
  a flat black frame, never a daytime look.
OUT OF SCOPE: bubbles (T2), casino pieces (T1), the generator, sounds.
