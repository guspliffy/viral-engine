# EP09b "Every jump, someone forgets you" (teleport): DESIGN of the new looks (13 Nov 2026)

Target: Jonny's 16-panel board (BOARD-PROMPT.md; the PNG is not in the repo) and STORY.md. This file gives the
numbers; a builder builds exactly these. The director stages, frames and acts; camera and acting lines here are
only checks that the set works, marked "director".
Look: hand-drawn Ghibli anime, late-afternoon warm light, dramatic but bright, everything sharp (haze is a flat
colour mix, never a blur). Realistic: no glow, no sparkles, no flash, no speed lines, no letters or numerals.
Everything is a pure function of params and the clip time (no Math.random, no clock; "hashed" = an integer hash of
an index or a lattice cell).
Reused, not designed here: Spud, Chip, Wedge, Mash; set `livingroom`; props `couch`, `sidelamp`, `wallart`,
`clutter`, `phone`; fx `poof` and `photo`.

WORLD FRAME (fixed by the director): x along the gorge (right as seen from the near ledge), y up, z toward the near
ledge. Near ledge: flat ground y 0 for z > 0, its lip at z 0. Gap z 0 .. -9. Far cliff top y 0.4 for z < -9. River
at y -70. Origin: on the near lip, in the middle of the old bridge.

## 1. THE GORGE (prop `gorge`, the whole world; panels 01-04, 07-15 and the photo)

### 1.1 Layout (metres)
| Thing | Where | Size / note |
|---|---|---|
| Near ledge, stage | x -8..8, z 0..10, y 0 | flat rock slab, dead level (characters stand anywhere) |
| Near ledge beyond the stage | x -150..150, z 0..12 | bumps up to +-0.25 m outside the stage |
| Near hinterland | z 12..45 | rises from y 0 to y 7 at z 32, pines on it, then a ridge (1.4) |
| Crumbling lip | x -1.5..1.5, z 0..0.7 | see 1.3 |
| Near wall face | mean plane z +0.25, y -1.5..-30 | under a lip slab 0.45 thick that overhangs 0.25..0.35 |
| Near wall lower | z +0.25 at y -30, -0.6 at -40, -2.2 at -55, -3.2 at -70 | straight between, +-0.3 relief |
| Far lip | z -9, y 0.4 | slab 0.45 thick, overhang 0.2..0.3 |
| Far wall face | mean plane z -9.25, y -0.1..-30 | |
| Far wall lower | z -9.25 at y -30, -8.4 at -40, -6.8 at -55, -5.8 at -70 | |
| Far top | z -9..-45, y 0.4, rising to y 5 at z -45 | pines from z -10.5 back |
| River | y -70, z -5.8..-3.2 (2.6 wide), all of x | see 1.4 |
| Gorge length | x -150..150 | spurs close the view: from the far wall at x +-70 (out to z -3.5, top to bottom), from the near wall at x +-120 (out to z -6) |
| Sky dome | r 280, centre (0, 0, -4.5) | all the way round and below the horizon (1.4) |

Everything lies inside the cameras' 300 m far plane: NO far compression is needed (unlike the snow slope).
Walls, lip slabs and their undersides are closed surfaces: a camera at y -35 looking straight up, and one at
y +1 looking straight down, must never see through anything or see a missing back.

FALL CORRIDORS, kept free of every rock, ledge, root, plant and bridge remain (the cameras and the cast fall here):
- A (the pair): x -1.2..1.2, z -5.6..-3.4, y 0..-40.
- B (Spud alone): x -1.2..1.2, z -1.6..-0.15, y -0.5..-40.
Inside x -1.5..1.5 the near wall's relief stays at z >= 0.0 below the lip slab (nothing sticks out past the lip).

### 1.2 The two wall faces (seen from 1-3 m by falling cameras, y 0..-40)
Aim: at 13 m/s (0.43 m a frame) the wall must read as rushing past. So the big shapes carry it: there is a hard
ledge, a tone change or a plant at least every 1.5 m of drop in the columns x -2.5..2.5, and never more than
2.0 m of plain face.
- Beds (strata), top to bottom, repeating three times to y -40.2. Thickness m / tone / step (+ = proud into the gap):
  1.8 A 0 · 0.6 D +0.12 · 2.6 C -0.10 · 0.9 B +0.18 · 3.4 A 0 · 0.5 D +0.15 · 2.2 C -0.08 · 1.4 B +0.10.
  The beds dip 3 degrees (lower toward +x). The far wall uses the same list shifted 0.7 m down, so the beds match
  across the gap. The thin beds (0.5-0.9) are hard ledges: a lit top edge 4 cm #e0cba6, a dark line 4 cm under
  them #3d3640.
- Tones, lit / shade: A #c2a585 / #7f7180 · B #a98f78 / #6f6474 · C #d6bf98 / #8e8088 · D #8f7c70 / #5c5364.
  Three flat steps (lit, half #9d8a7e-like mix of the two, shade), hard edges, ink line on silhouettes and ledges.
- Joints: vertical cracks every 1.6..3.8 m of x (hashed), 2..9 m tall, 3..8 cm wide, #3d3640, each stepping
  sideways 0.1..0.3 m where it crosses a thin bed. The blocks between them are turned +-6 degrees so the cel
  shade breaks into facets.
- Paint on top: brush hatch (strokes 0.25 m, 30 degrees, #6f6068) on 25 % of the shaded facets; pale lichen
  #a9a66a patches 0.3..0.8 m on 6 % of the facets above y -12 only; 5 dark water streaks per wall under ledges
  (#6a5d5c, 0.3 wide, 3..7 m long).
- Roots (near wall, y 0..-2.5): 8 roots #5a4332, 3..5 cm thick, hanging 0.4..1.8 m out of the lip slab's
  underside at x -4.1, -2.6, -1.4, -0.7, 0.9, 1.5, 2.3, 3.4; flat against the rock (0.08 proud at most).
- Grass ledges (a tuft of dry grass #c8a64e / #a8873f, 0.3 m, on a ledge 0.2..0.4 deep; outside the corridors
  they may be 0.8 deep): near wall (x, y): (-2.1, -3.0) (1.9, -6.2) (-0.4, -8.9) (2.4, -13.1) (-1.8, -16.4)
  (0.6, -20.7) (-2.6, -24.3) (1.6, -28.8) (-0.9, -34.0); far wall: (1.2, -2.2) (-2.4, -5.6) (0.3, -10.4)
  (2.7, -12.8) (-1.5, -17.9) (2.0, -22.6) (-0.2, -26.1) (-2.8, -31.5) (1.1, -36.5).
- Clinging pines (trunk leaning out 35 degrees then turning up, the pine of 1.4 at the height given; a root knot
  where it leaves the rock): near wall (x, y, height): (-2.6, -4.5, 2.2) (3.1, -11.0, 1.8) (-3.8, -19.0, 2.5)
  (2.2, -27.0, 1.6), all outside x -1.5..1.5 and at most 1.3 m out; far wall: (-2.2, -2.8, 2.4) (1.6, -8.5, 2.0)
  (3.9, -15.0, 2.6) (-0.6, -21.5, 1.8) (-3.3, -30.0, 2.2), at most 1.5 m out (to z -7.7).
- Shrubs: 10 per wall, round, 0.4..0.7 m, #5d7f4a lit #86a35a, three of them dry #b99a55; hashed places on
  ledges, none in x -1.5..1.5 on the near wall.
- Outside x -8..8 and below y -40: the same beds and joints, no hand-placed items; 1 clinging pine and 2 shrubs
  per 12 m of wall (hashed).

### 1.3 The near ledge, the lip, `lipbreak`, `crumble`
- Slab: rock #cdb893 lit / #8e8088 shade, joints every 1.2..2.6 m (#6b5f62, 2 cm), brush hatch on 15 %.
- Worn path to the bridge: x -0.6..0.6, z 0.5..10, paler dirt #d4bd94, soft-edged by 0.15 m, no grass on it.
- Dry grass: 70 tufts (blades 0.12..0.25 m, #c8a64e, #a8873f, 10 % green #8fa257) in x -8..8, z 0.7..10, none on
  the path, none in x -1.5..1.5, z < 1.2. Six flat painted grass mats 0.8..1.6 m #b99a4d.
- Pebbles: 60 (2..6 cm; #8d8377, #a59a8a, #6f665f) in x -3..3, z 0.05..3, two thirds of them within 1 m of the lip.
- Lip edge: z = 0 with a hashed jag of +-0.03 everywhere; inside x -1.5..1.5 the jag is +-0.06 with three
  notches 0.10..0.15 deep at x -1.1, -0.75 and 1.05, and two cracks along the lip at z 0.35 and z 0.80
  (2 cm, #3d3640, broken lines). Far lip: jag +-0.08, no special zone.
- THE CHUNK: plan outline (x, z): (-0.20, 0) (-0.17, 0.36) (-0.02, 0.58) (0.20, 0.64) (0.42, 0.50)
  (0.56, 0.36) (0.60, 0), front edge on the lip line. 0.45 thick at the back, 0.30 at the front, rough
  underside #7f7180. Its top is the ledge's own surface (at `lipbreak` 0 no seam shows beyond a 1 cm hairline).
  Fresh break faces, on the chunk and on the notch it leaves, are paler: #dcc9a6. The notch's back face slopes
  from that outline at y 0 down to the wall plane (z 0.35) at y -0.5; its top edge is the jagged outline above
  (5 teeth). The chunk holds the bridge's centre stake (section 2) at (0, 0, 0.5).
- `lipbreak` p 0..1. The break's clock is c = p x 2.44 s (tween p linearly over 2.44 s for real gravity):
  | p | What |
  |---|---|
  | 0..0.10 | the hairline opens to a 3 cm dark crack along the outline; the chunk sinks 2 cm; 4 pebbles roll off its front |
  | 0.10..0.18 | the chunk tips forward 0..14 degrees about its back bottom edge and sinks to 6 cm |
  | 0.18..1 | free, T = c - 0.44 (0..2.0 s): y = -0.06 - 4.9 T^2 (to -19.7), z moves -0.45 T, x +0.15 T, it tumbles 150 deg/s forward and 40 deg/s sideways; hidden at p 1 |
  Pebble spray: 16 pebbles (2..5 cm) and 6 clods (6..10 cm, #a08a70) leave the break line at c 0.24..0.50
  (staggered by index), each ballistic: speed out (-z) 0.3..1.4 m/s, up 0.2..1.2, sideways +-0.6, g 9.8,
  spinning; hashed by index. A thin dust wisp: 6 flat cel puffs 0.15..0.30 m, #cdbfa6 at 50 %, along the break
  line from c 0.24, rising 0.2 m, gone by c 0.95. Hard-edged shapes, no blur.
  The ledge is not solid over the chunk's outline once p > 0.10.
- `crumble` q 0..1 (panel 12, Spud's glove slipping; clock q x 1.5 s): at the notch grip point NOTCH_GRIP
  (0.20, -0.02, 0.62) a 12 cm flake #dcc9a6 breaks off and 8 pebbles fall with it, ballistic as above
  (out 0.1..0.5 m/s), a 0.15 m wisp. Before `lipbreak` 1 it does nothing.

### 1.4 Pines, river, sky, light, haze
- Pine (Ghibli): straight trunk #5b4636 (shade #3e3038), 5..7 drooping tiers, foliage #3f6b4a, sunlit side
  #7f9f52, shade #2c4a3f, each tier one flat shape with a scalloped lower edge; no single needles.
- Far top: 60 pines 4..9 m, z -10.5..-45, x -30..30 (hashed; 3 at the rim: x -5.2, -2.6, 3.0 at z -10.6..-11.5),
  low juniper shrubs along the rim. A CLEARING for the photo (section 6): x 4.0..8.0, z -9..-20 holds only two
  pines of 3.0 m at (3.4, 0.4, -14) and (8.4, 0.4, -14) and dry grass.
- Near top: no pine inside x -8..8, z 0..11. 40 pines 4..9 m on the hinterland (z 12..45) and 8 near the rim at
  |x| 9..30, z 1.5..8.
- Ridges (flat hazy silhouettes with 2 tones): beyond the far top at z -90, x -50..50 and beyond, top y 10..16,
  #8fa3a8 / #a9b9ba; at z -160, top y 20..38, #b9c6c6. The same pair behind the near hinterland at z 80 and 150.
- River: a white-green ribbon, base #cfe9dc, deep channel #7fb8a4 (30 % of the width, wandering), foam streaks
  #f4fbf5 0.2 x 1.5 m sliding toward +x at 3 m/s (clip time). It meanders 0.8 m with a 40 m period. Pale
  gravel banks 0.8 m #b9b3a4, 12 boulders 0.6..1.6 m #6d6a6a per 60 m.
- Sky dome (unlit paint): zenith #5f9fd6, 40 degrees up #9cc6e4, horizon #ffe2b0; below the horizon #cfd6d2.
  7 cumulus banks between 8 and 32 degrees up (4 over the far side), hard-edged, three tones: tops #fff3d6,
  body #ffd9a8, undersides #c9a0a8. Static. No sun disc (the sun is behind the near-ledge cameras).
- Light, painted in the gorge's own cel shader and the same numbers suggested to the director for the cast:
  sun from (-0.55, 0.45, 0.70), colour #ffd9a0; sky fill #9db4d8; key : fill 1.6 : 1; shadows 40 %.
  The near rim's shadow lies on the far wall below y -5.8 (a painted line with a +-0.4 jag following the
  blocks): above it the far wall is in warm sun, below it both walls are in open shade (the shade tones of 1.2;
  never darker than #5c5364).
- Depth haze, a flat mix toward #b9cbd0 by depth: 0 % at y >= -6, 18 % at -25, 40 % at -45, 62 % at -70
  (the river is drawn after the mix, at full strength). Distance haze along the gorge toward #cfd6d2: 0 % at
  30 m from the camera, 70 % at 150 m. Pines and ridges take the distance haze too.

### 1.5 Camera-safe extents and anchors
For the briefed wide, fov 56 (vertical) from (0, 1.2, 4) looking at (0, -1, -4.5), 9:16: the frame's half-width is
0.30 x the distance. It sees x +-1.25 at the lip, +-4.0 at the far rim, +-13 at z -40, +-28 at the z -90 ridge,
+-49 at the z -160 ridge; the horizon sits 493 px from the top. The set of 1.1 covers twice that everywhere
(detail zone x -8..8, far pines x -30..30, ridges and dome all round), and any camera inside x -4..4, y 0.4..6,
z -1..9, any camera in the gap between y +2 and y -40, at any heading, with fov up to 60.
Two things the director must know about that wide (not set faults):
- The near lip hides everything under the line from the camera over the lip: at z -4.5 that is y -1.35, on the
  far wall y -2.7. Chip (glove at y -0.9, feet near y -1.65) loses his legs, the falling planks and the river are
  out of sight. Suggested instead: from (0, 3.4, 3.2) looking at (0, -2.2, -4.5): the far wall shows to y -12.5.
  The river only shows to a camera over the gap (panels 09, 13).
- The frame is 1.4 m wide at z 1.5: Spud and Wedge side by side fit at z 0.6..1.0, not further back.
Anchors (exported as GORGE): LIP z 0 · FAR_RIM (z -9, y 0.4) · STAGE x -8..8, z 0..10 · SPUD_LIP (0.20, 0, 0.15)
on the chunk and CHIP_LIP (-0.75, 0, 0.20) for jump 2 · NOTCH_GRIP (0.20, -0.02, 0.62) · PHOTO_SPOT (section 6) ·
corridors A and B · wall planes z 0.25 and z -9.25.
Solid for the checks: both tops, both walls, the chunk until p 0.10. Not solid: plants, pebbles, dust, river.

## 2. THE BROKEN ROPE BRIDGE (prop `bridgerope`, placed at the origin; panels 01, 02, 07, 08)
What the bridge was: a three-rope bridge. One thick keel rope down the middle carried the planks (lashed at their
middles), and two hand ropes at x +-0.9 held the plank ends by cords. Both hand ropes have gone; the keel rope is
the ONE rope left.
- Posts: 4 round posts 0.16 thick, 1.30 tall, at (+-0.9, 0, 0.5) and (+-0.9, 0.4, -9.5), leaning 5 degrees
  toward the gap, a split down one side; wood #7a6048, shade #4f3f3a, end grain #a58a66; three turns of old rope
  #9a7a52 at 1.05..1.20 up.
- Centre stakes: 0.14 thick, 0.45 tall, leaning 12 degrees away from the gap, at (0, 0, 0.5) and (0, 0.4, -9.5);
  the keel rope is wound 4 turns and knotted at 0.30 up.
- Remains (static, hand ropes 4 cm #9a7a52 with tie cords 1.5 cm every 0.6 m, planks as in section 3): each runs
  from its post top over the lip and hangs plumb, flat to the wall (never past z -0.15 on the near side, z -8.85
  on the far side):
  | Post | Hanging length under the lip | Planks tangled in it (depth under the lip, tilt in the wall plane) |
  |---|---|---|
  | near x -0.9 | 5.2 m | 1.6 (-12 deg), 2.9 (20 deg), 4.6 (-35 deg) |
  | near x +0.9 | 1.2 m, frayed end | none (keeps the wall behind Spud at the lip clean) |
  | far x -0.9 | 2.4 m | 1.8 (15 deg) |
  | far x +0.9 | 6.0 m | 1.2 (-8 deg), 2.5 (25 deg), 3.9 (-18 deg), 5.4 (40 deg) |
- THE ROPE: 6 cm thick, three-strand twisted hemp #b08a5a, shade #7d5f3c, highlight #d4b382, the twist drawn as
  dark diagonal lines every 9 cm at 35 degrees; a few 1 cm hairs along it. From (0, 0.30, 0.5) to (0, 0.70, -9.5).
  THE CURVE, with s = (0.5 - z) / 10 (0 at the near stake, 1 at the far one):
  g(s) = 0.5 x 4 s (1 - s) + 0.5 x (1 - |2 s - 1|)   (half slack rope, half a V from Chip's weight)
  y = 0.30 + 0.40 s - 1.40 g(s),   x = `sway` x g(s).
  Checks: middle (z -4.5) y -0.90; it clears the near lip by 0.12 and the far lip by 0.08.
- GLOVE POINTS, world [x, y, z] (exported as BRIDGE.ropeAt(z, sway)):
  Chip, z -4.5: [sway, -0.900, -4.5] · Spud, z -4.75: [0.974 sway, -0.853, -4.75] ·
  the fray, z -4.25: [0.974 sway, -0.853, -4.25] · alternative Spud point, z -4.0 (open question 2):
  [0.945 sway, -0.803, -4.0].
- `sway` (m): as the formula; keep within +-0.15. No motion of its own.
- Two hanger planks tied under the rope by a 0.25 m cord at one end, hanging within 12 degrees of plumb: at
  z -2.6 (plank centre y -1.31) and z -6.4 (centre y -1.16); they move with `sway` x 0.74. They are drawn while
  `snap` < 0.06 and `hangers` is 1; `planks` 5 and 6 take over from exactly these places (section 3).
- THE FRAY, z -4.37..-4.13 (0.24 m): either side the rope tapers from 6 cm to 4 cm over 5 cm, with broken yarn
  ends curled back. Between: strands of 1.4 cm, 1.2 cm apart, each a paler #c9a877. Round them 14 broken fibres
  3 mm thick, 5..11 cm long, #d9c08f, standing out 30..70 degrees from both stumps.
  `strands` 3..0 (tween each step over 0.4 s, linear; f = the fraction already gone from the strand that is going):
  | f | The going strand |
  |---|---|
  | 0..0.3 | pulls thin (1.4 -> 0.8 cm) and pales to #e8d6ae, 3 of its fibres lift |
  | 0.3 | parts at its middle |
  | 0.3..0.6 | its two halves (0.12 m each) spring back and curl 120 degrees outward |
  | 0.6..1 | they drop and hang limp from the stumps, a 10 degree swing dying out |
  Order: the top strand first (3 -> 2), then the one nearest the camera side +x (2 -> 1), then the last.
  At 2, 1 the strands left sit 0.5 cm further apart each (the gap looks hungrier); the curve does not change.
- `snap` 0..1 (tween linearly over 1.0 s; it parts every strand still whole in its first 0.08):
  the rope becomes two halves. Near half: pivots on the lip at (0, 0.03, 0), 4.40 m long, ends hanging plumb at
  z -0.03 down to y -4.37. Far half: pivots at (0, 0.43, -9), 4.97 m long, ends plumb at z -8.97 down to y -4.54.
  Each point at fraction u along its half (0 pivot, 1 frayed end) turns about the pivot from its direction on
  the curve to straight down by E(k), k = clamp(1.3 `snap` - 0.3 u), E(k) = k^2 (3 - 2k): the root goes first, the
  tip lags (the whip). The last 15 % of each half also curls up to 50 degrees outward, x sin(pi k). No overshoot
  into the rock. Both frayed ends carry 12 loose fibres. At `snap` 1 each half hangs with a +-2 degree swing at
  0.4 Hz (clip time). The 0.5 m between stake and lip goes slack onto the ground.
- `nearfall` 0..1 (default 0; open question 3): the near stake stands on the chunk of 1.3. Tweened together with
  `gorge.lipbreak` (same clock, same motion as the chunk), the stake goes down with the chunk and drags the near
  half off the lip after it; hidden at 1. With it at 0 the stake and rope stay in the air when the chunk goes:
  never run `lipbreak` without it.

## 3. THE FALLING PLANKS (prop `planks`, at the origin; panels 01, 09)
Six planks 0.9 x 0.18 x 0.04, weathered #8d6b48, shade #5d4838, end grain #a98a63, two dark lash marks 0.12 from
each end, one knot, split corners (each plank a different hashed pair of chips). Spec `starts`: six clip times,
default [-1.6, -1.1, -0.7, -0.3, 10.9, 11.0] (four are already in the air on frame 0; 5 and 6 are the hangers of
section 2: set their starts to the snap's start + 0.06 s).
For plank i, t = clip time - starts[i]. t < 0: planks 1-4 hidden, 5-6 not drawn (the rope draws its hangers).
- Drop d(t) = 14 x (t - 1.4 x (1 - e^(-t/1.4))) m (air drag, top speed 14 m/s); y = y0 - d.
- x = x0 + xd x (1 - e^(-t/0.8)) + 0.25 min(1, t) sin(2 pi 0.7 t + ph).
- z = z0 while y > -30, then straight to zc at y -70; plus 0.2 min(1, t) sin(2 pi 0.55 t + 2 ph).
- Spin: w1 about its long axis, w2 about the vertical (deg/s), from a start angle of 40 i degrees on both.
- At y -69.9 (t about 6.4 s) it goes, leaving a white fleck 0.8 m #f4fbf5 on the river for 0.4 s.
| i | x0 | y0 | z0 | xd | zc | ph | w1 | w2 |
|---|---|---|---|---|---|---|---|---|
| 1 | -1.9 | -1.0 | -3.7 | -0.4 | -4.2 | 0.0 | 310 | 70 |
| 2 | 1.6 | -1.0 | -5.3 | 0.5 | -4.9 | 1.7 | -260 | 110 |
| 3 | -1.4 | -1.0 | -5.0 | -0.3 | -4.7 | 3.1 | 220 | -90 |
| 4 | 2.1 | -1.0 | -3.9 | 0.4 | -4.3 | 4.4 | -340 | 60 |
| 5 | 0 | -1.31 | -2.6 | -1.6 | -4.0 | 0.9 | 190 | -120 |
| 6 | 0 | -1.16 | -6.4 | 1.7 | -5.0 | 2.6 | -230 | 80 |
Planks 1-4 stay at |x| >= 1.3, 5-6 leave x 0 outside corridor A's z range: none crosses a corridor. Not solid.

## 4. THE JUMP (dust): NO NEW PROP
fx `poof` (engine/page/stage.js, buildPoof) with `sparks: 0` already is this: soft tinted puffs, no light, a pure
function of time. Use it; nothing glows, nothing flashes, no ring.
| Use | fx line |
|---|---|
| He leaves, on the ground | `{ do: "poof", at, pos: [x, 0, z], sparks: 0, puffs: 20, size: 0.85, lift: 0.5, dur: 1.0, color: "#b8ab98" }` |
| He leaves, in the air (jumps 2 and 3 start in a fall) | the same with `pos` at his body's middle, `lift: 0`, `size: 0.75` |
| He arrives | `{ do: "poof", at, who: "spud", sparks: 0, puffs: 12, size: 0.5, lift: 0.35, dur: 0.7, color: "#b8ab98" }` |
| The pair arrive on the lip (panel 10) | `pos: [-0.25, 0, 0.2]`, `puffs: 16`, `size: 0.7`, `lift: 0.4`, `dur: 0.8` |
The leaving puff takes `pos`, never `who` (a `who` puff would travel with him). Leaving puff at the cut frame he
vanishes; arriving puff starts 0.03 s before he shows.

## 5. MASH'S LIVING ROOM (panel 05; no new build)
Set `{ type: "livingroom" }` as built (floor lamp at x 1.2, lit; evening window x 1.08..1.82; plant at x -1.5;
a framed sunset at x 0.2, y 1.6).
- `couch` at [-0.45, 0, -1.3], color "#5f9a6a", color2 "#7db487" (the soft green sofa). Not at the header's
  x 0.2: Mash is 1.35 tall and seated his head would sit on the framed sunset; at x -0.45 the picture hangs
  clear to the right of his head.
- `sidelamp` at [0.78, 0, -1.68], lit, never smashed: the "lamp on" inside a portrait frame, 1.2 m from Mash.
- `wallart` at [-1.12, 1.58, -1.97], w 0.36, h 0.48, scene "forest", frame "#6b4428".
- `clutter` items [[-1.25, -1.2, "basket", 10], [0.55, -0.55, "books", 25], [0.3, -0.5, "mug", 0]].
- `phone` in both gloves (director).
- Director: a straight-on portrait medium (fov 50 from 3 m) is 1.9 m wide at the wall, x -0.97..0.97 when aimed
  at x 0: Mash, the sunset picture and the side lamp are in, the window is not. A camera 20..25 degrees round to
  the left brings the window's left half and the floor lamp in at frame right. Grade: warm, calm, no dust motes.

## 6. THE PHOTO ON MASH'S PHONE (panels 06, 16; fx `photo`, a snapshot of the real cast in the gorge)
- PHOTO_SPOT: the four stand in a row on the near ledge at z 1.5, facing +z (backs to the gorge), 6 m to the
  right of the bridge so no post, rope or remain is in the picture. Feet (x, 0, 1.5):
  | Left to right | Wedge | Spud | Chip | Mash |
  |---|---|---|---|---|
  | x | 5.05 | 5.85 | 6.48 | 7.10 |
  | tall | 1.1 | 1.0 | 0.65 | 1.35 |
  Spacing 0.80 / 0.63 / 0.62: shoulders just overlap (arm in arm). With Spud hidden, 0.63 m of clear
  background stands between Wedge and Chip (19 % of the photo's width, about 137 of its 720 px) while Chip and
  Mash still touch: the gap reads at a glance. Nobody shuffles between the two photos.
- Camera: `cam: { pos: [6.0, 1.0, 7.8], look: [6.0, 1.05, 1.5], fov: 50 }`, look "normal". The photo is the
  middle square: 3.3 m wide and tall at the row, y -0.6..2.7.
- What is behind them, bottom to top of the photo (heights as they fall at the row): ledge rock and dry grass to
  0.19 (the lip) · the far wall's sunlit top band 0.19..0.78 · the far rim with juniper at 0.78 · the two small
  clearing pines to 1.7, at the photo's left and right edges (they stand at x 3.4 and 8.4, so the background in
  Spud's gap is plain cliff and ridge) · the hazy ridge to about 1.95 · sky with one warm cloud bank 1.95..2.7.
- The ledge is flat and dressed (grass tufts, 8 pebbles) over x 3.5..8.5, z 0..8.5; no tuft taller than 0.15 m
  in front of the row.
- Panel 16: the same fx with `hide: ["spud"]`, same cam, same `shot`. Panel 06 (Spud half see-through): open
  question 5.

## 7. BUILDER TASK LIST (one file: engine/page/props-gorge.js; VOCAB.md lines; no other engine file changes)
Kinds and keys (param default, range):
1. `gorge`, origin: the world origin of this file (near lip, bridge middle); placed at [0, 0, 0], rot 0, not
   scaled. Params: `lipbreak` 0 (0..1), `crumble` 0 (0..1). Spec: `seed` 9, `sky` true, `river` true,
   `clearing` [4.0, 8.0] (the far-top photo clearing's x range). Builds everything in section 1 with its own cel
   shader (sun, shade line, depth and distance haze as 1.4), no far compression. Exports GORGE (anchors of 1.5,
   the chunk outline, a function for the chunk's place at a given p).
2. `bridgerope`, origin: the world origin. Params: `strands` 3 (0..3), `snap` 0 (0..1), `sway` 0 (m, -0.15..0.15),
   `nearfall` 0 (0..1), `hangers` 1 (0 | 1). Spec: `sag` 1.40, `fray` -4.25. Exports BRIDGE.ropeAt(z, sway) and
   the hanger places.
3. `planks`, origin: the world origin. Spec: `starts` [-1.6, -1.1, -0.7, -0.3, 10.9, 11.0], `n` 6. No params
   (clip time only).
4. No dust prop (section 4). No living-room build (section 5).
Rules: no Math.random or clocks; dust, pebbles, fibres, river foam are not solid and cast no shadow; no letters.

DONE WHEN (proof stills at 1080x1920, with grey stand-in boxes: Spud 0.8 x 1.0, Chip 0.6 x 0.65, Wedge 1.0 x 1.1,
Mash 0.7 x 1.35):
a. The briefed wide (fov 56 from (0, 1.2, 4) at (0, -1, -4.5)) and the raised one ((0, 3.4, 3.2) at
   (0, -2.2, -4.5)), Chip box hanging under [0, -0.9, -4.5]: no edge of the world, no void, sky with clouds over
   pines; in the raised one the far wall's sun line and four planks show.
b. Straight down from (0, 1, -4.5): both walls, haze steps, the river ribbon with moving foam at two clip times.
c. Straight up from (0.2, -30, -0.8) and from (0, -30, -4.5): both rims, lip undersides, roots, sky; nothing
   see-through.
d. A fall strip: camera 2 m from the near wall and from the far wall, dropping y -1 to -25 at 13 m/s, 12 frames:
   every frame differs clearly from the one before (a ledge, bed edge or plant enters each frame); nothing in
   corridors A and B.
e. `lipbreak` 0, 0.08, 0.16, 0.3, 0.6, 1 from (1.6, 0.9, 1.6) looking at (0.2, 0, 0.2), `nearfall` tweened with
   it: crack, tip, fall, pebble spray, the pale jagged notch; the stake rides the chunk. `crumble` 0.3, 0.7.
f. The fray from 0.6 m at `strands` 3, 2.5, 2, 1.4, 1, 0.5, 0: the count reads at 360 px wide.
g. `snap` 0, 0.1, 0.3, 0.6, 1 from the raised wide: the whip, both halves ending plumb on their faces, no rope
   inside rock. `sway` -0.15 and 0.15 with boxes at the three glove points (they stay on the rope).
h. `planks` at clip 0.0, 0.5, 1.5 and 11.2, 11.8, 12.6: the tumble reads, 5 and 6 leave from the hanger places.
i. The photo camera of section 6 with the four boxes, and with the Spud box hidden: layers as listed, the gap
   at least 120 px of a 720 px square.
j. Any still rendered twice in a different order is pixel-identical.

## 8. OPEN QUESTIONS (the default holds unless the director says otherwise)
1. The briefed wide hides Chip's legs, the planks and the river behind the near lip (1.5). Default: the set is
   built as fixed; the director raises the camera to about (0, 3.4, 3.2).
2. Panel 08 shows the last strand snapping BETWEEN their gloves; the brief puts the fray at z -4.25 with Chip at
   -4.5 and Spud at -4.75 (both on the far side of it). Default: as briefed. To match the panel move Spud's
   glove to z -4.0 (point given in section 2); nothing to rebuild.
3. After the snap the near rope half hangs down the wall at x 0, an arm's length from Spud at the lip
   (panels 10-12): it reads as a rescue line he ignores. Default: it hangs, as briefed, until the lip breaks;
   then `nearfall` runs with `lipbreak` and the stake and rope go down with the chunk.
4. Living room: the window is outside a straight-on portrait medium. Default: the camera comes 20..25 degrees
   round to the left; no second window is built.
5. Panel 06, Spud half see-through in the photo: fx `photo` shows one fixed snapshot. Default: two photo fx (with
   and without `hide: ["spud"]`) cross-faded over 1.2 s; if the fx cannot fade, that is a small fx change for the
   director to order, not part of these tasks.
