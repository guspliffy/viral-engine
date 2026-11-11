TASK T3: the twist props for There's a catch EP04 "copy money": the flip-digit price board, the wheelbarrow, the diner sign. One props file + bench.
WHY: the catch is hyperinflation in fast-forward. The viewer must SEE money become worthless: the diner's price board
flips 4.50, 450, 45,000, 4,500,000, 4.5 BILLION until it runs out of digits and its flaps blow off, then a
wheelbarrow of cash is tipped out for ONE milkshake. Earlier, at the 10x moment, the diner's sign outside flips from
a milkshake to a cowboy hat (he bought the place).
DESIGN: Jonny's sheet /mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/03-copy-money/storyboard-eight-panels.png
(4x2 panels, read it: the board is in 01, 03, 04, 07, 08: a dark frame, one row of three food pictures (pie slice,
burger, milkshake) over one row of white-on-black flip digits; match it); script
/mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (panels 05 and 07, timing 6 and 8).
Cast scale: a potato is 0.9 m wide and 1.1 m tall, a glove about 0.2 m wide, hands rest about 0.45 m up.
RULES: determinism rules in CLAUDE.md; docs/rules/characters-grips.md only for the in-hand proof.
READ: CLAUDE.md; engine/page/props-bistro.js lines 1-60 (file layout, canvas textures, `KINDS` with `apply(ps)`);
engine/page/props-race.js for a GRIPS export and how a tweened param reaches apply();
engine/page/props-whatif.js `parkclock` (digits drawn on a canvas from a param);
storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs (a bench generator); nothing else unless blocked.
OWN: engine/page/props-twist.js (replace the stub; export TWIST_KINDS and TWIST_GRIPS),
storyboards/series/what-if/04-copy-money/bench/make-twist-props.mjs and the JSON it writes, and ONE line in
storyboards/lib/grips.mjs SIZE (wheelbarrow). Touch nothing else (props3d.js already imports the file).
CONTRACT (metres; colours hex; front +z):
1. `flipboard`: the wall price board. Origin its CENTRE; it hangs flat on a wall facing +z. spec.w 1.3, spec.h 0.62,
   0.05 deep: a dark chrome-edged frame (#2b2e33, edge #c9ced6); the top 55 %: three cream picture tiles side by
   side with a drawn pie slice with a cherry, a burger and a pink milkshake with a straw (canvas, cel style, bold
   shapes); the bottom 45 %: one row of 13 split-flap cells (black #15171a flaps with a hinge line across the middle,
   white digits, the cells right-aligned like a price). Params:
   `stage` 0..5 (a float the generator tweens): 0 shows "4.50", 1 "450.00", 2 "45,000.00", 3 "4,500,000.00",
   4 "4,500,000,000" (all 13 cells full: it has run out of digits); from 4 to 5 every cell keeps flipping faster
   and faster without settling (a different digit per cell per frame from a hash of the cell and floor(stage * 60)). Between whole stages the
   cells flip: each cell's top flap falls forward about its hinge (a real 3D flap per cell, not a texture swap)
   through intermediate digits, the right-hand cells first, 3 to 5 flips per cell per stage, timed from `stage`
   alone (so any frame can be drawn on its own); a new leading digit or comma appears by flipping in from blank.
   `clock` (seconds): above stage 4.2 the whole board rattles (up to 1.5 degrees, 1 cm) from the clock.
   `blow` 0..1: the flaps tear off: about 40 light black cards fly out toward +z and to the sides on their own
   arcs (from a hash), tumbling, drifting down like paper to the floor about spec.drop (1.7) below the board, and stay
   there; the cells behind are left empty dark holes with bare hinges; at 1 every flap is gone and settled.
   The frame is solid for the checks, flying flaps see-through.
2. `wheelbarrow`: a builder's wheelbarrow, 1.15 long. Origin on the floor under the tray's middle; it points +x (the
   wheel at +x, the handles toward -x). A red metal tray (#c8443a, 0.62 long x 0.5 wide at the top, 0.24 deep, its
   rim 0.52 above the floor), one wheel (r 0.15, dark tyre) at x +0.42, two legs under the back of the tray, two
   wooden handles (#a9773f, r 0.016) reaching to x -0.72 at y 0.5, 0.42 apart. spec.load 1: heaped high with cash
   bundles and loose notes (green #7fae6a with cream bands, the heap's top 0.9 above the floor); `load` 0..1 scales
   the heap down to empty. Params: `dump` 0..1: the barrow tips forward about its wheel axle (the handles rise to
   y 1.0 at 1, the tray tilts 55 degrees) and the heap slides out over the front: at 1 the tray is empty and the
   heap's notes are gone from the barrow (the generator grows a `cashheap` where they land); `roll` (degrees: the
   wheel turns). TWIST_GRIPS.wheelbarrow.handleL / handleR = points 0.06 before the handles' ends (the gloves close
   round them from above), given for dump 0, and a function or table for dump 0..1 (say which in the header).
   Tray, legs and wheel solid for the checks; the notes see-through.
3. `dinersign`: the diner's roadside sign seen through a window: a rounded board spec.w 1.0 x spec.h 0.7, 0.08
   thick, on a pole going down 2.2 from its bottom edge (origin: the board's centre), cream face #f6ecd4 with a red
   neon-style border #e23b33 and a row of small bulbs. Front face: a pink milkshake with a straw; back face: a brown
   cowboy hat with a green two-leaf sprout (Gunslinger's hat: curved brim, tall dented crown, a darker band). Param
   `flip` 0..1: the board turns 180 degrees about its vertical axis like a rotating sign, so the hat faces front at
   1 (ease is the generator's); `lit` 0..1: the border and bulbs glow (0 for the dead sign at night, where the faces
   go grey-blue and a little snow lies on the top edge when spec.snow is true).
MACHINE: yours for bench stills only (`node engine/render.mjs <bench json> --stills ... --draft`, one job at a time);
no layout of the clip, no draft or full render, never the farm.
DONE WHEN:
- the bench (plain set, cast `never-has-money/gunslinger`): the board on a wall at stage 0, 1, 2, 3, 4, 5 and three
  in-between values (flaps mid-fall), then blow 0.3, 0.7, 1; the wheelbarrow at rest with Gunslinger's gloves on both
  handles, at dump 0.5 and 1 beside a 0.38 m high counter box, load 0 and 1; the sign at flip 0, 0.5, 1, and
  lit 0 with snow
- a contact sheet at storyboards/series/what-if/04-copy-money/bench/twist-sheet.png; look at it once: at 270 px wide
  each price is readable, the food pictures read as pie, burger, milkshake, the hat reads as his hat
- in-hand proof for the wheelbarrow handles (`node storyboards/lookdev/make-grip-tests.mjs --prop wheelbarrow --hold
  <the hold that closes a fist round a 3 cm bar, e.g. the staff or mug hold; say which>`): the two stills it names,
  the hands closed round the handles, nothing through the gloves
- the file starts with a usage header: the kinds, every spec key and param with its default, sizes, origins, grips
- deterministic: no Math.random, no clock; every frame drawable from the params alone
OUT OF SCOPE: the clip generator, cameras, acting, the cash heap on the counter, the night diner, sounds, engine changes.
