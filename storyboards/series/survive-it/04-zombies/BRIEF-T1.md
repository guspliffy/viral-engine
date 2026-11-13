TASK T1: the flat's inside: room shell (zroom), the front door that fails (zdoor), the toilet cistern (zcistern)
WHY: the viewer must believe a small real flat under siege: a plain hall whose front door is all that keeps the
  zombies out (it splinters, bulges and finally bursts), a living room, and a bathroom where the last clean water is
  in the toilet cistern.
DESIGN: storyboards/series/survive-it/04-zombies/BRIEF-COMMON.md (read first), panels 01, 03, 05, 06 in
  /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-B-10X-IMAGE-PROMPT.txt (text; the
  picture is not in the repo).
RULES: CLAUDE.md "Rules that apply to every task".
READ: `engine/page/props-heistset.js` lines 1-80 (header style, helpers, a KINDS entry), `engine/page/props-sneak.js`
  header + `nightdoor` (a door in a frame), `storyboards/lookdev/make-hotpotato-set-bench.mjs` (bench pattern).
OWN: `engine/page/props-zflat.js` (a stub exists: replace it, keep the three export names),
  `storyboards/lookdev/make-zflat-bench.mjs` + its json. Touch nothing else.
CONTRACT (every size a spec key with this default):
  zroom   a room open toward the camera. Origin: floor centre, y 0 = floor top. Floor `w` 5 x `d` 4, walls `h` 2.7:
    back wall at z -d/2, left wall x -w/2, right wall x +w/2, each 0.12 thick OUTSIDE the room, a ceiling, NO front
    wall. `wall` "#d8cfc0" (plaster, a little uneven, a darker skirting board 0.1), `floor` "boards" (warm oak) or
    "tiles" (white 0.2 m bathroom tiles with grey joints; then the walls are tiled up to 1.3 m too).
    `open`: [{ wall: "back"|"left"|"right", at: 0, w: 1.0, h: 2.1, y0: 0 }] rectangular holes cut through a wall (`at`
    = metres along the wall from its centre: along x for back, along z for the side walls).
    `dress` "none" | "hall" (a row of coat hooks with two coats on the left wall, a small mirror, a doormat in front
    of the back wall's opening) | "living" (in the back wall a 1.6 x 1.3 window at x -1.2, sill y 0.9, with a painted
    overcast town view and half-drawn dull green curtains; a radiator under it; one framed picture) | "bath" (a
    0.5 m basin with a dry chrome tap on the left wall at z 0, a mirror above it with a dark lamp bar).
    State `dim` 0..1 (default 0: flat overcast daylight; 1: night, candle only: every surface multiplied down to
    about 28 % with a warm tint) and `glowx`, `glowz` (default 0, 0): the centre of a soft warm light pool (radius
    1.6 m, painted on the floor and as a faint wash up the nearest walls), its strength = dim.
  zdoor   the flat's front door, WITHOUT a wall (it goes into a zroom opening 1.0 x 2.1). Origin: bottom centre of
    the opening; at rot 0 the INSIDE of the flat is +z. Frame 0.08 wide, 0.14 deep. Leaf 0.92 x 2.03, 0.05 thick,
    dark green painted wood with two sunk panels and scuffs, a frosted glass pane 0.44 x 0.6 (centre y 1.55), brass
    handle at the latch side (local x +0.36, y 1.02), hinges at x -0.46, a bolt (y 1.2) and a chain (y 1.4).
    State (all default 0):
    `ajar` 0..1: the leaf swings INTO the flat about the hinge, 1 = a 14 cm gap at the latch side.
    `hands` 0..6 (whole steps): that many grey-green zombie forearms (0.4 m, sprouts at the wrist, clawing fingers)
      reach through the gap at heights between 0.5 and 1.7; they claw (a slow open-close and reach, from `t`).
    `hole` 0..1 (step at 0.5): a broken plank hole 0.3 m across at local (0.1, 1.0), splinters bent inward.
    `arm` 0..1: one zombie arm through that hole, reaching 0.7 m into the room at 1, its hand closed as if gripping
      cloth at local (0.15, 1.0, 0.7). Give this point in the header.
    `bulge` 0..1: the leaf bows inward up to 0.12 m at its middle, cracks spread from the hole, the frame splits.
    `shadows` 0..12 (whole steps): dark head-and-sprout silhouettes pressed against the frosted pane, swaying a
      little from `t`; 12 fills the pane.
    `burst` 0..1: the leaf tears off its hinges and falls flat into the flat (hinge side last), 1 = lying on the
      floor at z 0.2..2.2, the opening empty.
  zcistern  a white toilet with its cistern. Origin: floor centre under the bowl, the bowl's front toward +z, the
    cistern at the back (z -0.3), its top at y 0.85, 0.42 wide. State `lid` 0..1: 0 the china lid on; 1 the lid
    lifted 0.25 m and held tilted (as if by a hand at its right end: give that point in the header). `water` 0..1:
    the clear water level inside the open cistern (1 = 12 cm deep, a soft highlight), visible from above.
MACHINE: stills only (see BRIEF-COMMON).
DONE WHEN:
- bench stills (contact sheet `storyboards/lookdev/zflat-bench-sheet.png`): a "hall" room (w 3.2, d 4, opening in
  the back wall) with the zdoor in it at four states: closed; ajar 1 + hands 4; hole 1 + arm 1 + bulge 0.3;
  bulge 1 + shadows 12; and burst 1. A "living" room at dim 0 and at dim 1 with the glow. A "bath" room (w 2.4,
  d 2.6, tiles) with the zcistern at lid 0 and at lid 1 + water 1 seen from 1.6 m up.
- at 360 px wide the hands, the hole with the arm, the bulge and the silhouettes each read at once.
- usage header complete; `ZFLAT_STATE` lists every state key.
OUT OF SCOPE: furniture (wardrobe, couch, candles, bucket exist), the balcony, any cast, the clip generator.
