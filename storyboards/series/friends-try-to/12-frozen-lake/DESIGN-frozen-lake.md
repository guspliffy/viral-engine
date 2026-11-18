# DESIGN: the frozen lake (friends try to 12)

Design only, from `ref/ftt12-sheet-v3.png` (panels P1-P12). For the builders of the set `icelake` (suggested `engine/page/set-icelake.js`),
`engine/page/props-icelake.js` (kinds lakeice, icesplash, icerod, icebucket, icejetty) and `engine/page/props-icegear.js` (sinker, fishreel, tacklebox,
baittin, iceauger, anchor, gearheap, hoodiegear). The director adds the registry lines. Metres, y up; all variety hashed from spec.seed or an index (no
Math.random, no clock, no memory between frames). No lettering. No reaction symbols (the sheet's shock lines, sweat drop and auger sparks are not built).
Conventions for every prop kind: `ref/DESIGN-buffet-from-10.md` section 1 (ink outline, 3-4 flat colours, marks under 0.008 m `noOutline`, hull body).

Departures from the sheet: (1) clean ice at 0.0, the cracks grow by key (director); (2) the anchor lands in P10's beat (director); (3) the jetty deck is
0.20 m over the ice with a 0.10 m ledge (the sheet's is about 0.45 m: no potato can step that, legs are 0.14 m); (4) no rail in FRONT of the friends
(sheet P8/P11/P12): it would block the boarding of P3-P6 and cover hands; the rail is behind them; (5) the jetty stands 2.1 m behind the group, not far off as in P1.

## 1. World frame (the whole clip)
- x right, y up, z toward the main camera. Ice top y 0. Origin = Chip's mark; he never leaves it. Rot 0 faces +z.
- Cast sizes (body top = 0.14 legs + body): Chip 0.67 x 0.57 wide, Spud 1.02 x 0.76, Wedge 1.12 x 0.88, Mash 1.38 x 0.54. Walk foot lift 0.07.
- Marks at 0.0 (P1, a loose arc behind the hole, all facing the camera): Chip (0, 0) rot 0; Spud (-0.55, -0.85) rot 5; Wedge (-1.35, 0.10) rot 12;
  Mash (0.80, -0.60) rot -8. Centre distances: Chip-Spud 1.01, Chip-Mash 1.00, Chip-Wedge 1.35, Spud-Wedge 1.24.
- Fishing hole centre (-0.30, 0, 1.60), r 0.22. Rod stands (-0.80, 1.72) and (0.20, 1.78). Bucket (0.67, 0, 1.35) (it stands on the slab, section 3.5).
- Gear heap centre G (0.76, 0, 0.57): 0.95 m from Chip along u = (0.80, 0.60) (front right of him, never between his face and a lens at x <= 0.3).
- Jetty: straight, along x, behind the group. Deck z -3.40..-2.10, x -2.30 (its head) .. +8.60 (on the bank), top y 0.20. Ledge z -2.10..-1.82, x -1.90..+1.95,
  top y 0.10. Jetty marks (feet y 0.20, rot 0, sheet order P6): Wedge (-1.05, -2.60), Mash (0.10, -2.55), Spud (1.15, -2.60). Each walks straight to the
  ledge below his mark (Wedge 2.1 m, Mash 1.5 m, Spud 2.0 m on the ice), then two rises of 0.10.
- Shores from the origin: near (camera side) z +2.5..+3.3; right x +7.3 (the jetty's root); left x -8..-10; two headlands at (-4.2, -10.0) and (4.6, -11.5);
  far shore z -24..-26. Painted rings at 95, 150, 230 m.
- Cameras (starting values for `qa/camfit.mjs`; two directions only, both from the near bank side):
  | name | panels | pos | look | fov | what it must show |
  |---|---|---|---|---|---|
  | A-wide | P1, P2 | (-0.35, 1.35, 4.9) | (-0.35, 0.40, 0.3) | 58 | four faces, the hole and rods bottom left, bucket bottom right, jetty behind |
  | B | P3-P5 | (3.0, 1.0, 1.8) | (-0.6, 0.45, -1.6) | 46 | from the right, looking left and back: Chip left, the ledge centre, the jetty runs off screen right with the roped pile at x 1.95 |
  | A-mid | P6, P11, P12 | (0.55, 1.50, 4.5) | (0.45, 0.40, -0.5) | 54 | Chip left of centre, the three on the deck behind him, heap and slab right, splash bottom right |
  | A-close | P7, P9, P10 | (0.25, 0.75, 2.5) | (0.25, 0.38, 0) | 40 | Chip, his hem, the heap; forest behind (no jetty faces) |
  | OTS | P8 | (0.30, 0.95, 1.5) | (0.05, 0.75, -2.5) | 42 | over Chip's sprout to the three on the deck |
  Camera never under y 0.6 (the buffet rule). No reverse angle is designed: nothing is built to be seen from the far shore.

## 2. Set `icelake`
### 2.1 Reuse
- From `set-snowslope.js` (exported): `snowMaterial`, `farMesh`, `firGeometry`, `firMaterial`, `keyAt`, and the `SNOWLIGHT` uniforms set to the dusk values
  below (never call `setDark`). Its sky dome recipe with new colours (the dome is not exported). Its ground, peaks, ride and cliff: not used.
- From `set-stormlake.js` (nothing fitting is exported, copy the recipes): the three painted hill rings, the far-shore mist band, the cel water tones and
  the foam line along an edge (for the open water in 3.5, new colours), the bay's bank profile. Its storm surface, bridge, rain and underwater: not used.
- From `props-harbour.js` `pier`: planks, piles and rope at 0.6 scale (2.5). From `props-survive-snow.js`: `iciclerow`.
- New: lake outline and bank mesh, the near fir, dusk sky and light, jetty, reeds, spindrift. All of it 3D out to 95 m; only the three rings are painted.
### 2.2 Light and sky (sheet: every panel's top third)
- Set light: direction (-0.35, 0.80, 0.48); lit #dfe8fb, shade #8ea6dc, glow #000000, haze #b9c7ea, haze distance 260 m, haze max 0.6.
- Suggested cast light: hemisphere sky #b9cdf5 / ground #dfe8fb 0.9; key #fff1e0 1.0 from the set direction; rim #a9c8ff 0.4 from (0.5, 0.5, -0.7).
  Cast colours stay as they are (no blue grade on skin).
- Sky dome: zenith #4f77c2, elevation 30 #8fb0e6, 10 #cfd3ee, 0-6 a lilac band #c9c3e6 that turns pink #f3c6cf then peach #f8dcc2 within 25 degrees
  of the glow centre (bearing: from the origin toward (-1.5, -26)). Five flat cloud bands at elevation 6-22: lilac #a9a7d8 above, pink #f2b6c4 below
  near the glow, sliding 0.2 degrees a second. No sun disc, no stars.
- Rings (painted, allowed this far): r 95 m, 14 high, #3f5c8f with fir teeth, dipping to 3 high over the gap; r 150, 30 high, #6d86bb; r 230, 58 high,
  #a3b3d8 with snowfields #dfe6f6 on its top 30 % and a pink edge #f0cdd6 toward the glow. Mist band at the far shore: 2 m high, #b9c6e6 at 0.35.
### 2.3 Lake outline and bank
- Shoreline: a closed smooth curve through these (x, z) points, plus a +-0.4 m wobble (period 3 m): near (-6.5, 3.6) (-3.4, 2.7) (-1.5, 2.5) (-0.3, 3.3)
  (1.0, 2.5) (2.8, 2.8) (5.4, 1.8); right (7.0, -0.4) (7.3, -2.8) (6.8, -6.5) (4.6, -11.5) (6.5, -15.5) (7.5, -20); far (4.0, -24.5) (-1.5, -26)
  (-6.0, -23.5); left (-7.5, -17) (-4.2, -10.0) (-7.8, -6.0) (-9.8, -1.5) (-8.8, 1.6). Export it (the ice prop reads it).
- Bank, d = metres inland: a rounded drift lip to y 0.32 over d 0..0.7, then 1 in 7 to y 1.3 at d 7.5, then +-0.35 noise (period 9 m) rising to 3.5 at
  d 45 and 9 at d 90. On the near shore between x -4 and +4 the bank stays under y 0.45 out to z 6 (the cameras stand there).
- Snow #f4f8ff with hollows #dbe6fa (vertex colours, as snowslope). 16 snow mounds on the shoreline, r 0.35-1.1, 0.15-0.5 high, gaps 1-6 m, two of them
  at (-1.9, 2.6) and (1.7, 2.7) (the sheet's bottom corners). No mound, reed or rock on the near shore between x -1.6 and +1.5 (the lenses look over it).
- Dead reeds, 5 clumps of 14-30 blades 0.25-0.55 long, #b7964f lit / #8a6d38 shade, bent toward +x, a snow ring at the foot: (-2.3, 2.5), (2.1, 2.9),
  (6.6, -1.9), (-8.9, -0.5), (-4.6, -9.6). Four snow-capped boulders 0.4-0.9 (left headland, jetty root). One snowed-in log 2.4 m at (5.9, 2.4).
### 2.4 Forest
- Near fir (new), 46 of them, 6-13 m (two of 15 m): 6 tiers, each a skirt of 9-11 lobes drooping 15-25 degrees, #2b5a4c lit / #1d3f3a shade; a snow pad
  on 55-75 % of each tier's top, thicker toward the trunk, #f1f6ff / #b9cbee; trunk #5a4334 on the lowest 12 %; lean 0-4 degrees; 1 in 6 has a
  broken or missing bough. At most 900 triangles each. Count by place: far shore 18, right headland 5, left headland 4, left shore 9, jetty root 6, near bank 4.
- Clumps of 2-6, trunks 1.5-4 m apart, 5-12 m between clumps, the first trunk 1.5 m or more inland, young ones (2-4 m, 12 extra) at a clump's front.
  3 dead snags (grey #6f6a6a trunk 5-8 m, 4-6 snowed stubs). Far firs: 280 instances of `firGeometry`, 7-14 m, 10-95 m inland, denser with distance.
- The gap: no tree in a 4.5 m wide corridor from (-1.5, -26) heading (-0.1, -1) for 60 m (P7, P10: mountains and pink sky show through it).
- Life: fir tops sway +-0.6 degrees at 0.25 Hz (hashed phase); 8 spindrift wisps on the ice (1.5-3 m long, #eef4ff at 0.25, 1.2 m/s along the wind
  W = (0.94, 0.34), each on a hashed 6 s loop). No snowfall, no birds.
### 2.5 Jetty `icejetty` (P1-P6, P8, P11, P12; solid: the cast stands on it)
- Deck top y 0.20 = two rises of 0.10 (71 % of a leg, above the 0.07 walk lift: each rise is a step-up, not a walk). Deck 1.30 deep, 0.03 planks on
  two 0.05 stringers; planks run along z, 0.11 wide, gaps 0.012, ends uneven +-0.012, three weathered browns #7b6654 / #6a5746 / #8a7460 in hashed
  order (never the same twice in a row), two nail dots each. Snow on 55 % of the deck in wind drifts, deepest (0.05) along the -z edge and round posts.
- Ledge (new, the boat landing): two planks, 0.28 deep, top y 0.10, on 5 stub posts frozen in, snow on 30 % of it. No post or rail on the +z edge
  between x -1.90 and +1.95: the three board and stand there.
- Mooring piles r 0.06 to y 0.75 at (-1.90, -2.10), (1.95, -2.10) and both head corners, each with 3 turns of rope #d8d2c0 at y 0.50-0.58 and a 0.04
  snow cap; the pile at x 1.95 also carries a hanging coil (R 0.09, 4 loops): it is the foreground post of P3-P5.
- Rail on the -z edge only (both edges from x 1.95 to the bank): posts 0.06 square to y 0.70 every 1.15 m (x -2.25, -1.10, 0.05, 1.20, ...), one top
  beam 0.06 x 0.05 with its top at y 0.66, a 0.035 snow cap on every top face. The friends' backs clear the posts by 0.43.
- Piles under the deck r 0.055 every 1.5 m on both edges, each in an ice collar (r 0.10, #dbe8f7). `iciclerow` (0.03-0.09 long) under the deck edge
  where there is no ledge. The deck meets the bank at x 7.6 and ends at 8.6. List the mooring piles and rail posts for `qa/clear.mjs`.

## 3. `lakeice` (one prop at the origin: ice top, hole, cracks, slab, open water)
It draws the whole lake's ice top inside the set's shoreline, so cracks, hole, slab and water are one surface with no seam within 8 m of the origin.
spec { hole [-0.30, 1.60, 0.22], web [0, 0], marks { wedge [-1.35, 0.10], mash [0.80, -0.60], spud [-0.55, -0.85] }, slab [7 points], pivot [2 points],
tipDeg 18, seed }. Keys `crack`, `run`, `slab`, `churn`, each 0..1, default 0. Keys the engine's prop state does not know are primed with a dur-0 set
at t 0 (as props-sinkcar.js). `tip` and `tilt` are the engine's own keys: not used here.
### 3.1 Ice look (sheet: every panel's lower two thirds)
- Body #5a7fc0; darker blotches #3f5c96 over 30 % (soft, 1.5-4 m); frosted patches #93b2de over 20 %. Toward the horizon the ice lightens to #c9d3ee
  (up to 0.45 beyond 15 m from the camera). 30 bubble clusters (white dots 0.01-0.03 in groups 0.1 wide, 0.35 opacity).
- Snow dust: streaks along W, 0.6-3.5 m long, 0.04-0.18 wide, tapered at both ends, #eef4ff at 0.85, 0.5 per square metre, in clumps, each drawn once.
  A lee tail 0.5-0.9 m long behind the hole's rim, the bucket, each rod stand and each jetty pile. Snow covers at most 10 % inside r 1.6 m of the
  origin (cracks read on blue), rises to 60 % within 2 m of a shoreline and 100 % in the last 0.6 m.
- Every body and prop on the ice gets a soft contact shadow: #34508c at 0.4, an oval 1.1 x its footprint, shifted 0.06 toward (0.35, -0.48).
### 3.2 Hole (P1-P11)
- A round cut r 0.22, wall 0.14 deep: #d2eef2 at the top 0.03, #7fb6d4, #3f78a8 at the water. Water at y -0.02 (3.5), a skim-ice crescent on 15 % of it
  (#7fa6cc at 0.6). Slush rim r 0.22-0.34, 0.025 high, 12 uneven lumps, #dfe9f6 with wet patches #a9bfe0. Auger shavings: a mound 0.25 x 0.15 x 0.05,
  #f2f6ff, on the lee side (+W).
### 3.3 Crack lines (white with a dark core, sheet look, bolder than real so a 270 px phone crop reads them)
| class | white band | dark core #1b2c55 | halo #dce8fa | minimum drawn at 1080 wide |
|---|---|---|---|---|
| main (first line, arms, run) | 0.045 #f4f8ff | 0.012 | 0.11 wide at 0.35 | 3.0 px white, 1.0 px core |
| secondary (rings, forks, links) | 0.028 | 0.008 | 0.06 at 0.25 | 2.0 px |
| hairline (twigs) | 0.012 | none | none | 1.2 px |
- Paths are polylines: a kink every 0.12-0.30 m, +-12 degrees, hashed, never a curve and never an even zigzag. 3-5 white chips (0.01-0.03) at each kink.
  A growing end tapers to 40 % width over its last 0.15 m; the 0.25 m behind a tip is drawn 1.5 x wide (fresh ice is whiter).
- Growth is by length: inside its key range a line's tip runs from its start to its end, linear. Nothing fades in.
### 3.4 `crack` 0..1: the web, centred on Chip from the first frame (the rewatch clue), each accused friend gets a line to his feet first
| crack | what has grown by then | panel |
|---|---|---|
| 0.05 | first line from the hole's rim (-0.26, 1.38) via (-0.35, 1.10) to (-0.14, 0.85): 0.62 m. This is frame 0 | P1 |
| 0.10 | first line on via (-0.22, 0.42) to the web centre (0, 0): 1.53 m; two spurs of 0.15 | P1 |
| 0.20 | arm B from the centre to Wedge's feet, ends (-1.22, 0.09) | P2 |
| 0.30 | arm C to Mash's feet, ends (0.70, -0.52) | P3, P4 |
| 0.40 | arm D to Spud's feet, ends (-0.48, -0.74) | P4, P5 |
| 0.50 | arm E toward (-0.64, 0.64) 0.9 m and arm F toward (0.14, -0.79) 0.8 m; a Y fork of 0.3 on the ends of B, C, D | P6 |
| 0.65 | ring 1, r 0.40, closed round Chip's feet (secondary) | P6 |
| 0.80 | ring 2, r 0.85, only on bearings outside the slab sector; 6 links between rings 1 and 2; halo under Chip to r 0.45 | P7 |
| 1.00 | ring 3, r 1.35, in 3 pieces on 60 % of that arc; arms to full length (B 2.5, C 2.2, D 1.9, E 1.7, F 1.6 m); 14 twigs 0.1-0.25 | P10 |
- Rings are chords between arm crossings, one kink each, radius +-0.05. The slab sector (from Chip, between the directions to (0.74, -0.32) and to
  (-0.14, 0.85), through +x) stays uncracked beyond ring 1 until `run`: the heap lands on clean blue ice. No arm ends under the ledge (z > -1.75).
- Staging: each +0.1 (or +0.15) is one tween of 8-10 frames, ease out, its sound on the first frame, then a hold. Never one slow tween across beats.
### 3.5 `run`, `slab`, `churn`: the slab under the heap (P11, P12)
- Slab outline (x, z), each edge with 2-3 kinks of +-0.04: K1 (-0.14, 0.85), K2 (0.74, -0.32), K3 (1.41, -0.04), K4 (1.62, 0.59), K5 (1.29, 1.24),
  K6 (0.61, 1.65), K7 (0.04, 1.31). About 1.4 x 1.8 m. Its lip K1-K2 passes 0.40 from Chip's centre (0.18 past his foot). It holds the heap and the bucket.
- `run`: a main-class line, white 0.06, core 0.02. 0..0.25: from (0.32, 0.24) on ring 1 both ways along the lip to K1 and K2. 0.25..1: both tips race
  round the outline (K2-K3-K4 and K1-K7-K6-K5) and meet between K4 and K5. From 0.9 the core turns water colour and widens to 0.035.
- `slab`: the slab turns as one block, 0.14 thick, about the pivot line (-0.01, 1.18)-(1.07, -0.26), angle 18 degrees x slab, the K4 side down. At 1 the
  lip stands 0.09 over the ice and shows its side face (colours as the hole's wall, ink 1.2 px on its top edges); the K4 edge is 0.33 under.
- Under it: water at y -0.02, body #0a1322, glint facets #2b426e on 8 % (drifting 0.2 m/s), a foam line #dfeaf7 0.02 wide on every ice edge that
  touches water. Ice under less than 0.12 of water shows through (ice colour x 0.55, to black at 0.12). Visible only inside the hole and the slab outline.
- `churn`: 0 still. 1: three ripple lines #3d5b8f, 0.12 apart, running in from the edges at 0.5 m/s, 40 foam flecks, 12 ice chips 0.03-0.08 bobbing 0.01.
- Suggested: run 0-1 in 0.5 s; slab 0-1 in 0.5 s ease in; hold 0.5 s while the heap slides; slab to 0.3 in 0.8 s; churn 1 from the tip, 0.4 at the end.
### 3.6 `icesplash` (P12; real water, no stars, no white outline, no speed lines)
- spec.scale 1, spec.dur 1.2 s; key `puff` 0..1 tweened linear over dur (the key name of `splash` in props-shark.js). Origin: the entry point on the water.
- Crown: a ragged ring sheet with 14 uneven fingers, base r 0.30 to 0.70 over puff 0-0.35, 0.55 high at puff 0.22, down by 0.5. Body #223a66, lit rim
  #9fc0ea, foam tips #f2f7ff, opacity 0.9. Jet: a column r 0.07 to 0.03, 0.9 high at puff 0.42, pinching into 4 blobs r 0.03-0.06, down by 0.8.
- Drops: 110, r 0.008-0.035 (many small, few big), thrown at puff 0.02-0.2, 1.5-4.2 m/s, 35-80 degrees up, gravity 9.8, all down by 0.9. #2f4c80 with one
  white dot; under r 0.012 plain #dfeaf7. Mist: a white haze r 0.5 at 0.25 for puff 0.05-0.4.
- Wash on the ice: a wet sheet r 0.5 to 1.3 (ice x 0.72, edge line #dfeaf7), 60 % of it stays at puff 1. 30 wet dots where drops land. 3 rings on open water.
- Use: one at scale 1 at (1.42, -0.02, 0.94) when the heap's front reaches the water, two at scale 0.5 within 0.3 s, one at 0.4 for the bucket.

## 4. Props at the hole (P1-P11)
- **icerod** x 2: rod 0.42 long, blank #2e3440 r 0.006 to 0.002, tip 0.04 #e8542c, handle 0.10 #8a5f3a, reel r 0.02 #8e98a3; it rests at 35 degrees on an
  X stand (two 0.018 wood legs #7a5a3a, 0.16 high, 0.14 spread). Tip over the hole at y 0.30; a line (0.0015, #dfe6f2 at 0.8, `noOutline`) to the water,
  swaying 0.006 at 0.4 Hz. Stand at (-0.80, 1.72) pointing +x and at (0.20, 1.78) pointing -x. Not held. Both stay on firm ice.
- **icebucket**: galvanised, r 0.11 at the rim, 0.085 at the foot, 0.19 high, steel #aeb7c0, rim #d3dae1, inside #3b4048, two hoop ridges, 3 dents,
  a wire bail lying to one side, a frost ring at the foot. Empty. Body: bounce 0.1, friction 0.5. At (0.67, 0, 1.35).

## 5. Gear (each kind one rigid body; origin bottom centre in the resting pose, long axis x)
- **sinker** 0.07 long, r 0.022, lead pear, #8b929c, top #b4bbc5, underside #5c626c, a brass eye (ring R 0.006, #b9953f) at the thin end, 2 scuffs.
  spec.shape hashed: pear, ball (r 0.016 with a slot), coin (r 0.024 x 0.009, a hole). Body: density 6000, bounce 0.03, friction 0.6.
- **fishreel** 0.11 x 0.085 high x 0.07: a drum r 0.036 x 0.034 between two steel plates (r 0.04, #8e98a3, 5 dark holes #3a3f47 each), wound line
  #3f8f5a, a foot bar 0.06, a crank arm 0.045 with a black knob r 0.012 #23262b on +x. Body: density 1500, bounce 0.08, friction 0.5.
- **tacklebox** 0.20 x 0.11 high x 0.12, corners rounded 0.012: body #6b7f45, lid #7d9352, base #4f5f33, lid groove #3c4a28 at 62 % height, two steel
  latches #c5c9cc (0.018 x 0.022) on +z, a folding handle #2e3524 0.09 long on top, one scuff. Never opens. Body: box, density 700, bounce 0.03, friction 0.8.
- **baittin** r 0.055 x 0.035: lid #c8352b with a ring #f2e3c6 (no letters), rim #8f1f1a, base #aab1b8. Body: density 1200, bounce 0.06, friction 0.5
  (lands, rolls 0.3 m on its edge, spins down flat).
- **iceauger** 0.52 long: a spiral r 0.05, 3.5 turns over 0.30, #3f7fd0, edge #7fb0ec, underside #2a5aa0, on a shaft r 0.009 #3b4048; two steel blades
  #cfd6dd at the tip; a T handle 0.16 x r 0.012 #7a4a22 at the top. Body: density 2500, bounce 0.05, friction 0.7. It may bite and stand, then fall.
- **anchor** 0.24 high x 0.20 wide x 0.05: shank 0.19, ring R 0.022, a stock bar 0.12 under the ring at 90 degrees to the arms, two curved arms with
  flukes 0.05 x 0.04. Iron #2b2f36, lit edges #5a626e, 3 rust strokes #6b3f2a, a rope stub 0.12 #d8d2c0 on the ring. Body: density 7000, bounce 0,
  friction 0.9: one dead thud, no second bounce.
- Suggested spill, 13 bodies, small to big: fishreel 1 (P9, alone), sinker 6, fishreel 2, tacklebox, baittin, iceauger, anchor LAST.
- Staging (the buffet's section 5, turned to u): bodies leave at the hem (y 0.12-0.16), v.y at most 0.5 m/s, 0.6-1.4 m/s along u = (0.80, 0.60). Until
  the heap is at fill 1 they land 0.45-0.62 m from G and past the lip; the auger comes to rest on the heap's camera side with its spiral toward the
  lens; only the anchor lands on the heap, on its peak, with `jolt`.

## 6. `gearheap` (one prop, origin G on the ice; P10-P12)
- As `buffetheap` (ref section 3): spec.r 0.45, spec.h 0.42, seed, `fill` 0..1 with the same growth and landing rules, `jolt` 0..1 (hop 0.015).
  Peak 0.05 off centre toward Chip, a shoulder 0.28 high at 0.16 toward K6, toe 0.45 along u, 0.38 at the sides, 0.30 on Chip's side.
- Core: a lumpy dome 20 % inside, #3a4250, painted with 10 metal ovals #2f3642 / #4b5564, `noHatch`. No core patch over 0.05 shows from A-mid or A-close.
- 44 items at fill 1: sinker 16, fishreel 8, baittin 5, tacklebox 3, and heap-only ropecoil 4 (R 0.07, 3 turns, #d8d2c0), linespool 6 (r 0.025 x 0.03,
  line #e8742c), chain 2 (8 links #5a626e). No auger, no anchor: the film has one of each, the loose ones. Next to every grey item one coloured one.
- New for the dump: spec.pivot and spec.tipDeg as `lakeice`, and the SAME `slab` tween: the heap turns with the slab about that line. Key `slide` 0..1:
  items go down the slope along u, lowest first, item of rank k in the window [0.55 k / N, 0.55 k / N + 0.45], accelerating, turning up to 120
  degrees; once under y -0.02 it sinks 0.3 more and is hidden; a foam ring r 0.06-0.15 marks each entry. The core shrinks with what is left. At 1: nothing.
- spec.strays [[kind, x, y, z, rotY, seed], ...] up to 16: the loose bodies' rest poses from the layout (auger, anchor, bucket, sinkers). Drawn only
  while slide > 0, sliding last (the anchor at 0.7 x speed: its ring and stock go under last). The director hides the loose bodies on that frame.

## 7. `hoodiegear` (worn by Chip, never solid; P1-P12)
- Build exactly as `hoodiestuff` in ref section 4: frame, patch area, base, swell, limits, cloth, stitch, crescents, pull lines, `fill` 0..1. Only these change:
  | lump | az | el | footprint | extra height | shape | flattens over fill |
  |---|---|---|---|---|---|---|
  | anchor fluke | -20 | -36 | 0.12 x 0.05, an arc of radius 0.08 | 0.065 | a hooked ridge ending in ONE sharp point | slides to el -58 over 0.30 -> 0.14, gone 0.14 -> 0.03: LAST |
  | tackle box corner | +30 | -38 | r 0.055 | 0.050 | three flat faces meeting, turned 20 deg | 0.62 -> 0.48 |
  | auger handle | +14 to +52 | -27 | 0.15 x 0.028, tilted 14 deg | 0.030 | a straight bar with a round end r 0.02 | 0.44 -> 0.30 |
  | reel | -50 | -46 | r 0.04 | 0.034 | a flat-topped disc, sharp rim | 0.90 -> 0.80 |
  | sinkers | +60 | -52 | r 0.045 | 0.024 | four bumps r 0.014 | 0.98 -> 0.88: first |
- Pull lines run from the fluke's point toward the box corner, the hem and the pocket end.
- Hem hint, from frame 0 (P1, P7): the reel's crank arm, its black knob r 0.014 and a 120 degree arc of one steel plate with green line, at az +40 under
  the hem, pointing down and 30 degrees out, 0.06 showing below the hem line (y 0.167). Shown while fill > 0.9; slides 0.03 down and is gone by 0.86:
  the first loose fishreel drops from there (P9). At fill 0 the patch is hidden and the hoodie is its own flat shape (P12).
- While fill > 0.3 Chip's hands rest on his belly; the spill starts when he lifts the hem. Keep his squash under 5 % while fill > 0.

## 8. Sounds (names only; times on a 17.5 s default cut the director retimes from the measured lines)
| t (s) | name | what |
|---|---|---|
| 0.0 | ice-crack-first | one sharp dry crack with a short zing, 0.4 s; `winter-lake-air` loops far under the whole clip |
| 1.5, 4.7, 6.2 | ice-crack-run-short | arms B, C, D, 0.3 s each, three takes |
| 3.6, 4.0 / 5.4, 5.8 / 7.5, 7.9 | jetty-step-heavy / -mid / -light | Wedge, Mash, Spud: hollow boards, two each; `jetty-board-creak` at 4.1 |
| walks on ice | step-ice-snow | squeak and crunch; Spud's tiptoe is 4 soft taps |
| 8.3, 8.9, 9.5 | ice-crack-spread | arms E and F, ring 1, ring 2: rising, the last with a low boom |
| 8.2-13.9 | ice-creak-load | a low groan under Chip alone, cut dead at 13.9 |
| 11.2 | reel-clatter-ice | the reel: two bounces and a ratchet tick |
| 11.8-13.4 | lead-thuds, reel-clatter-ice, tacklebox-thud (12.6), tin-roll-settle (13.0), auger-clang (13.4) | the pour, thickening |
| 13.9 | anchor-thunk | a dead low iron thud; no ice sound for the next 0.3 s |
| 15.0 | ice-crack-run-long | a fast zip, 0.5 s (`run`) |
| 15.5 | ice-slab-break | a deep crack and a water gulp (`slab`) |
| 15.7 | gear-slide-scrape | metal on wet ice, 0.6 s (`slide`) |
| 16.1, 16.4, 16.6 | splash-heavy, splash-small x 2, bucket-plop | the dump |
| 16.3-17.5 | water-slosh-settle, ice-chunk-knock x 2 | under the laugh |

## 9. Stills the builder shows, open questions, risks
- Stills, each also as a 270 x 480 phone crop: the set from A-wide, B and A-mid; the four on their 0.0 marks; the three on the ledge and on the deck
  marks; `lakeice` at crack 0.05, 0.1, 0.3, 0.5, 0.8, 1 from A-wide and from above; run 0.5 and 1; slab 0.5 and 1 with churn 1; `icesplash` at puff
  0.15, 0.4, 0.8; each gear kind from 4 sides; the heap at fill 0.15, 0.4, 0.7, 1 and slide 0.3, 0.7; Chip with `hoodiegear` at fill 1, 0.6, 0.3, 0.
- Pass: the first line shows in the phone crop of frame 0; every crack stage differs from the last in the crop; each gear item can be named in the
  crop; no round tan lump (skin is #e2a95c) and no yellow item; no patch edge at any fill; no near surface is a flat picture.
- Open, with my default: (1) rail in front of the friends: no, behind them, they lean hands on knees; (2) deck 0.20 with a 0.10 ledge, not the sheet's
  tall jetty; (3) baked bodies do not follow a tipping slab: the heap's `slide` and `strays` do the dump; if they do follow, drop both and tip real
  bodies; (4) the bucket slides in last (P12 shows it); (5) `crack` reaches 1.0 at the anchor's thunk, not held at 0.8; (6) the auger is 0.52 m.
- Risks: three boardings of two rises each must fit 3.4-8.2 s. Lines that run across the view are foreshortened to a quarter: the pixel minimums in 3.3
  are what keeps them. The hem hint is about 25 px in A-wide: P7 is its first clear view. Rings must stop at the slab sector or the slab reads as
  already broken. 46 near firs, 280 far firs and the ice shader: time a draft frame before the layout round. The stray swap is one frame: check it in
  a one-second draft. `run`, `slab`, `churn`, `slide`, `jolt` need their dur-0 priming.
