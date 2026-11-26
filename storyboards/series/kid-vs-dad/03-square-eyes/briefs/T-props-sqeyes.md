# TASK: props-sqeyes.js — wall clock, eye chart, ruler for Kid vs Dad 03 "Square eyes" (rough draft)

GOAL: three simple props in the toon look of the gravroom living room, for a rough draft (story check). Plain and readable at phone size beats detail.
OWN: engine/page/props-sqeyes.js (new), the 2 registry lines in engine/page/props3d.js (one import, add SQEYES_KINDS to an Object.assign),
     the SIZE entries for "eyechart" and "smallruler" in storyboards/lib/grips.mjs (append only),
     storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-sqeyes.mjs (+ its json).
READ: CLAUDE.md, engine/page/props-gravroom.js header (lines 1-80, style + colours: ink #1B1530), engine/page/props-skipremote.js (a small held prop file
     to copy the shape of), storyboards/lib/grips.mjs (SIZE + placeFor), docs/rules/movement.md only if needed.

KINDS
1. wallclock — round wall clock hung on the back wall. Diameter 0.34, depth 0.05. ORIGIN: the centre of the back face (put it ON the wall, facing +z).
   Cream face #F4EBD6, dark wooden rim #5A3A22 0.025 wide, 12 bold hour ticks (no numerals needed; 12/3/6/9 ticks longer), black hour hand 0.09 long, minute hand 0.14,
   red second hand optional off. Params (tweenable, NOT propState-seeded unless you say so in the header): time 0..24 hours (default 20 = 8 pm); hands from time
   (hour hand = time%12, minute hand = fractional hour). Large steps (8 -> 11 -> 3) will be cuts, a fast spin is a tween of time from 23 to 27.
2. eyechart — a hand-held Snellen-style eye chart board: 0.30 wide x 0.42 tall x 0.01, white #FAFAF4 with a thin black border; rows of black letters getting
   smaller top to bottom: a big "E" on top, then rows "F P", "T O Z", "L P E D", "P E C F D", "E D F C Z P" (canvas texture). ORIGIN: the middle of the bottom edge;
   the face looks +z. Held by one hand at the bottom edge (grip size entry so grips.placeFor / mug-style holds work; say which hold in the header).
3. smallruler — a 30 cm wooden school ruler: 0.30 x 0.035 x 0.004, pale wood #E8C88A, black cm ticks + a few numbers, ORIGIN at one end (the held end), along +x.
   Held at the origin end; grip SIZE entry.

CHECKS (the machine is yours for layout + stills; no draft render):
- bench-sqeyes.mjs: the three props in the gravroom set (copy the set block from storyboards/series/kid-vs-dad/03-square-eyes/make-openings.mjs), clock on the back
  wall at (0.20, 1.55, -2.62), clock time tween 20 -> 23 -> 27 over the bench; eyechart and smallruler each held by "potatobrawl/reporter" (one at a time is fine).
- node engine/render.mjs <bench> --stills beats --draft --safe; contact sheet to /mnt/project-files/videos/kid-vs-dad/03-parent-lies/bench/bench-sqeyes-sheet.png
- the in-hand proof for eyechart and smallruler (make-grip-tests.mjs), look at front + side.
- node qa/golden.mjs must stay unchanged.
Don't commit. Report per the builder format.
