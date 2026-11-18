# SET-ST: Mash's street on moving day, built in REAL 3D (no projected plate)

Jonny 16 Nov: the Atlantis method (a painting projected on 3D, kinds cplate/splate) looks unnatural; the cast must stand IN a
real place, the way the Stonehenge and pyramids episodes worked. So this place is built from geometry with hand-painted canvas
textures and the house look of the engine. The painting is the LOOK TARGET, not the surface.

Look target: storyboards/series/happiness/03-happiness-score/plates/painted/ST.webp (1536x1024) and the approved panel crops
plates/ref/panel-01.png, -05, -36, -37 (sheets happy-score-sheet-1..4.png). DESIGN.md section 8 row ST + the "Hilltop geography".

## Build (new file engine/page/set-score-street.js, type "scorestreet"; you own only it + bench files)
- Mash's house front left: warm grey-gold rubble stone (painted canvas texture with mortar, not a repeat you can see), a green
  panel door in a stone frame with ONE stone step (step top a real stand height), a window or two with white frames and
  curtains, a little ivy; room for the 3D `frontdoor` prop (engine/page/props-package.js) if the door must open (panel 04).
- Pavement (stone flags) at y 0 along the house; a real kerb; a cobbled road lower by the kerb height, wide enough for the
  `boxvan` (engine/page/props-score-van.js, ~5.4 m long, 2.3 m wide) parked at the kerb plus a lane.
- Red and gold autumn trees along the street (3D trunks + leaf clusters, like the best tree in the existing sets), a
  streetlamp, a low wall or railing where the painting has one, fallen leaves on the pavement (decals), leaves drifting.
- Far: the grassy hill with its winding road far right, other houses down the street, the sky: these may be a painted
  far backdrop (cut from the top of ST.webp or painted on canvas) beyond ~40 m. Everything within ~30 m of the camera is 3D.
- Morning sun from the right like the painting: warm key, long soft shadows, cool sky fill. Deterministic (util.js rng, no
  Math.random, no clock).
Reuse first: read engine/page/set-cottage.js (stone front, cobbles, cards), set-street.js (kerb, road), set-porch.js
(canvas/tex helpers), set-doorstep.js, set-hilltop.js (sky dome + far land); copy and adapt helpers into your file
rather than editing those files. Register in engine/page/sets.js only in a scratch copy for the bench; the director adds
the real import line. Do not commit.

## Bench and done
- Scratch storyboard(s) under storyboards/series/happiness/03-happiness-score/bench/st/ (frame "wide"), Spud
  (characters/potatobrawl/spud) and Mash (characters/.../mash, find it) on the pavement by the step, the boxvan at the kerb.
- Stills (`--stills ... --draft`, never a video) from (a) the painting's camera (low, 0.95 m, oblique along the pavement),
  (b) panel 05 (door), (c) panel 37 (pavement with the van). Make a side-by-side sheet: painting | render (a), panel crop |
  render (b), (c). It must read as the same street as the painting, rich and hand-painted, and the characters must look like
  they stand IN it: contact shadows, the step and kerb under feet, trees overlapping.
- At most 2 fix rounds. Report: STATUS, FILES, sheet path, the set spec keys, where characters stand (x, z) per panel,
  what differs from the painting and why.
