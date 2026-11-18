# DESIGN: the balloon rig, the sandbag and the dawn valley (friends try to 11, hot air balloon)

Design only, for the builder of the new file `engine/page/props-balloon.js` (exports `BALLOON_KINDS`, `BALLOON_GRIPS`, a size table `BALLOON`; the director adds the
registry line). Target look: `panels-v1-codex.png` in this folder; colours are read off it. Conventions as props-buffet.js: `P.spec`, `P.whole`, `{ grip, apply(ps) }`;
metres, y up; toon look with the standard ink outline, 3-4 flat colours a part; every hand-drawn mark is placed once from a hash of `spec.seed` or an index (no
Math.random, no clock, no tiled texture); marks under 0.008 m, flames, glows, mist and sky are `noOutline`. No letters, no logos. Three kinds: `balloon` (the WHOLE
rig: envelope, burner, frame, basket, four tethers), `sandbag` (a loose rigid body), `dawnvalley` (sky, sun, far ridges, mist). Rig frame: origin = the grass under
the basket centre; +z = toward the main cameras, -z = the sunrise; az = degrees from +z toward +x; a point at az a, radius r is (r sin a, y, r cos a).
Heights: rim top 0.80, load ring 2.70, mouth hoop 2.92, widest 6.12, crown 8.12. Widths: basket 2.23, mouth 1.84, envelope 4.80.

## 1. `balloon`: envelope, frame, burner
- **Envelope**: a lathe from the mouth hoop (y 2.92) up, (height above the hoop, radius): (0, 0.92) (0.5, 1.20) (1.2, 1.62) (2.0, 2.07) (2.8, 2.34) (3.2, 2.40)
  (3.7, 2.33) (4.2, 2.10) (4.65, 1.70) (4.95, 1.10) (5.14, 0.50) (5.2, 0), smoothed. 18 gores of 20 deg, each bulging 0.035 between its seams, about 30 rows.
  Colours in the order red #c9432b, orange #ef8a2a, cream #f6e2b9, six times round; the gore centred on az 0 is red. Each gore 12 % darker over its lowest 20 %,
  6 % lighter on the shoulder (3.2-4.2 up). Seams: 18 ribbons #8f2f1f, 0.02 wide. Cross seams: one wavering stroke (the gore colour 18 % darker, 0.012 wide) on
  about 40 % of the panels (rows 0.55 apart), each drawn once. 12 wrinkle strokes fanning 0.3-0.6 up from the hoop. Crown cap: red disc r 0.5 in a #8f2f1f ring.
  Inside face: the gore colours x 0.55, lit #ff9a3a x 0.5 x `burn` at the hoop, fading to nothing 3 m up. The envelope casts no shadow.
- **Hoop, skirt, load ring**: mouth hoop = steel tube r 0.02, radius 0.92, y 2.92. Skirt: cloth from the hoop down to radius 0.89 at y 2.76, gore colours 20 %
  darker, lower edge in 18 uneven scallops 0.03 deep. Load ring: stainless tube r 0.022 #c5c9cc (metal 0.6, rough 0.35), radius 0.88, y 2.70; 12 flying wires
  (r 0.004, #5a5f66) up to the hoop; one cross bar (r 0.018) along x through the ring's centre, carrying the burner.
- **Uprights**: 4 stainless tubes r 0.016 from brass sockets (#b98a3c, r 0.03, 0.05 high) on the rim's inner top (radius 1.02, az +-70 and +-110, y 0.80) to the
  load ring at the same az. A brass collar 0.5 and 1.4 up each, the lowest 0.30 wrapped in leather #7b3a22. From the front: two rods a side, clear of every face.
- **Burner**: can = steel cylinder r 0.085, y 2.70-2.86, on a brass collar (r 0.095, 0.03 high); a blast lever on -x with a red knob r 0.018; coil = 5 turns of
  steel tube r 0.012 on a helix of radius 0.12 narrowing to 0.10, y 2.86-3.08, its top turn heat-blued #7d8fb0 and glowing #ff7a1a x 0.6 x `burn`; two black
  hoses (r 0.012, #2e2a28) sagging 0.6 from the can to the back uprights and down them to the rim.
- **Flame** (unlit, see-through for the checks): a blue pilot cone 0.05 high, always on. Core: blue cone #3f8cff to #9fdcff, base r 0.07 at y 2.88, height 0.25 +
  0.45 x burn. Outer: three nested teardrops #ff7a1a, #ffb030, #ffe680, height 0.3 + 1.5 x burn (1.8 m at full blast, up inside the envelope), width 0.16 + 0.22 x
  burn. Flicker (t = clip seconds): height x (1 + 0.10 sin(69.1 t) + 0.06 sin(108.7 t + 1.7) + 0.05 sin(32.0 t + 0.4)), lean 4 deg x sin(20.7 t); five side tongues,
  tongue i rises 0.3 and fades on a loop of 0.23 + 0.035 i s. Glow: one additive disc r 0.5 + 0.9 x burn, #ffb060, opacity 0.35 x burn. No real light.

## 2. `balloon`: the basket
- **Rim**: padded leather roll, a torus of centreline radius 1.05, 0.13 wide, 0.116 high, top at y 0.80 (inner edge r 0.985, outer 1.115). 14 cushions of uneven
  length (+-12 %), a pinched groove 0.008 deep with cream stitches #e9cf9c at each joint, 1-2 crease strokes and one highlight stroke a cushion. Leather #7b3a22,
  highlight #a5552f, shadow #55250f. Under it a zigzag lacing cord #d9b877 (r 0.006) ties it to the wicker.
- **Wall**: a lathe, outer radius 0.88 at y 0, 0.91 at 0.10, 0.96 at 0.30, 1.005 at 0.55, 1.03 at 0.70; 0.035 thick; the foot sunk 0.02 into the turf. 26 weave
  rows as 0.006 ridges (a bumpy silhouette). Three braided bands (tube r 0.03) at y 0.03, 0.40, 0.69. The weave is ONE painting wrapped once round: 34 upright ribs
  and 26 rows of over-under strands, every strand its own stroke with hashed width and tone: #e0a04a, #c98432, shadow strands #9a5a22, gaps #6a3a16. Inside #8a5a26.
- **Floor, three levels** (no camera under y 1.9 sees them; they are what makes four faces show over the rim): deck y 0.50, radius 0.965, dark planks #6b4a2b.
  Front step, top y 0.67: x -0.34..0.24, z 0.42 to the wall (Chip). Back box, top y 0.85: x -0.20..0.26, z -0.13 back to the wall (Mash: the gas cylinder's
  wicker cover, one leather strap). All three are tops to stand on; the rim top is a seat and a grip.
- **Why** (legs are 0.14 for all four): the rim, 0.30 above the deck, cuts Spud and Wedge 0.16 above the body's bottom. Chip's step puts his hem band 0.04 ABOVE
  the rim: the lumpy belly (`hoodiestuff`, y 0.82-0.98) rests over the leather and the buffet falls outside. Mash's box lifts his mouth (1.42) over Chip's crown (1.34).
- **Places** (x, z, stand y; all face +z): Spud (-0.535, 0.10, 0.50) · Wedge (0.475, 0.10, 0.50) · Chip (-0.05, 0.68, 0.67) · Mash (0.0, -0.40, 0.85). Eyes at
  1.17 / 1.23 / 1.13 / 1.73, tops 1.52 / 1.62 / 1.34 / 2.23. A diamond: Chip front centre, Spud and Wedge beside and behind him, Mash at the back in the 0.2 gap
  between their shoulders. It reads from the front only: keep every camera within 12 deg of the z axis while more than two are aboard.
- **Hooks**: three wooden toggles (0.05 long) under the rim's outer face at y 0.70, az -84, -55, +55; a steel rope ring at y 0.72 on the outer face at each tether
  az. **Pressed grass**: a darker flattened ring (r 0.86-1.05, #5f8a36, opacity 0.5) under the foot; it stays on the grass when the rig lifts.

## 3. `balloon`: the four tethers (part of the rig, so a rope never leaves its ring)
- Stakes at radius 1.75, az +-70 and +-110: (+-1.64, 0.60) and (+-1.64, -0.60), two a side as on the sheet. Each a weathered post 0.07 x 0.07 with rounded edges,
  0.34 above the turf and 0.30 in it (pointed), leaning 12 deg away from the basket, the top split and mushroomed by the hammer. Wood #a9783f, grain #8a5c2c,
  cracks #5e3d1c, a damp dark band at the turf line. Rope: hemp r 0.014, #d9c08a with twist stripes #b89a5e, rim ring to a groove at y 0.24: 0.80 long, 37 deg.
- `taut` 0..1 (default 1): 1 = a straight line that hums (a standing wave of 0.004 m at 9 Hz, for panel 2); below 1 it sags 0.14 x (1 - taut)^2 at mid span,
  never under y 0.02. While a stake is in the ground and the rig lifts, the rope is the straight line from ring to groove.
- `free` 0..1 (default 0), the release. What reads best: the STAKES RIP OUT of the turf one after another and dangle under the climbing basket (the cause is in
  the picture). A pure function of `free`: front-left, back-right, front-right, back-left at f = 0.05, 0.20, 0.35, 0.50. Over the 0.05 before f the stake leans 12
  deg further and lifts 0.10; at f five turf clods (#6b4a2b, green tops) burst on fixed arcs over the next 0.15; from f to f + 0.5 it swings from its hole to under
  its ring, blend 1 - e^(-4u) cos(3 pi u), u = (free - f) / 0.5. A hole and two clods stay. Tween linear 0 -> 1 in 1.6 s from rise 0.1; rise over 0.6 by free 0.5.

## 4. `balloon`: the other keys (all in spec too)
- `burn` 0..1 (default 0.3): 0 pilot only, 0.3 idle (0.75 m flame), 1 full blast. `rise` metres (default 0): lifts everything except the stakes still in the
  ground, the pressed ring, the holes and clods. Panel 6: 0 -> 0.12 in 0.5 s (out), hold 0.3 s, -> 0 in 0.25 s (in), then a 0.02 settle.
- `strain` 0..1 (default 0): envelope, skirt and hoop lift 0.08 x strain and stretch (y x 1 + 0.035 strain, x and z x 1 - 0.012 strain), with a slow tug of +-30 %
  of that at 0.8 Hz; the flying wires go straight; the wrinkle strokes fade. Ring, uprights and basket do not move. Panels 1-11: 1 with burn 1, 0.5 at idle.
- `sway` 0..1 (default 0): the rig turns +-3 deg x sway on a 7 s period and the envelope alone rocks +-2 deg x sway about the hoop centre on 4.3 s. The basket
  floor stays level and in place, so a rider needs nothing extra. Sideways drift is the prop's own x and z.

## 5. `sandbag` (loose rigid body, origin bottom centre) and `dawnvalley`
- **sandbag**: a slumped sack 0.24 wide, 0.25 high, 0.18 deep, flat underneath; gathered neck at y 0.25-0.29 (r 0.035, 8 pleat creases); three wraps of twine
  #d9c08a and a bow; a frill r 0.05 above the tie; a rope loop to y 0.36. Hessian #c9ad7d, about 40 short cross-hatch strokes #a88a58 in two directions, one worn
  patch #dcc59b, underside #9c7f52, one dashed seam #8a6c42. `spec.seed`. Body: bounce 0.02, friction 0.95, density 1600: one thud, no roll.
  `BALLOON_GRIPS.sandbag.neck = [0, 0.27, 0]`. Hung: its centre at radius 1.14 on a toggle's az, y 0.36, 0.02 off the wall. Three of them, on from frame 0.
  Panel 3: lifted 0.10 by the neck, swung 0.15 out, `c.drop`; order -55, +55, -84. They stay where they land for the rest of the film.
- **dawnvalley** (scenery, never solid, origin at the rig's origin; a sky prop as `aasky` in props-aa-giza.js). Sky: the inside of a sphere r 250 (it hides the
  set's own dome, r 262), painted once: zenith #9aa3dc, 30 deg up #f4b49c, horizon #fde3a4 on the -z half; #8f9bd8, #c9b3dc, #f1cfc0 on the +z half.
  - Nine cumulus, each painted once from its own seed, 30-90 m wide, 200-245 m out, az -28..+30 from -z, 9-40 deg up: body #b9a6cf, middle #f4b6a0, the LOWER
    RIGHT edge lit #ffd9a8 (the sun is below them); three small gold ones #ffe2a8 near the horizon. Drift 0.4 m/s toward +x.
  - Sun: disc r 7.5 at rig frame (30.7, 24.7, -233) (7.5 deg right of -z, 6 deg up): core #fff3c4, rim #ffd76a, glow r 60 #ffd27a, nine uneven rays, opacity 0.12.
  - Three ridge cards, each its own painting (two sines and noise, a fringe of tree bumps), fading into mist over the lowest quarter: far z -230, 520 wide, top y 22,
    #8f86b8, a notch at the sun's az; middle z -170, 400 wide, top y 9, #7a76aa; near z -110, 280 wide, top y 1.5, #66709a with a fringe #4f5d86.
  - Four mist bands between them (z -90, -140, -200, -245; tops y -1.5, 3, 10, 19; down to y -60): 30-40 overlapping soft lobes each, top #fbeedd, underside
    #e3cfe0, opacity up to 0.85; band i slides (6 + 3 i) x sin(2 pi t / (40 + 7 i)) m along x.

## 6. The set: "scorehill" (set-score-hill.js)
- Why: it already is a grassy ridge with ONE old 3D oak, a valley dropping away to the west, wind, grass, flowers and birds, and it holds from any camera, also
  looking up. "hilltop" has no tree and no valley; "hills" is a flat noon meadow; no "env" painting is a hilltop, and an env camera cannot tilt up after the balloon.
- The rig stands at world (6.0, 0, -0.7): on grass (the dirt clearing ends near x 5), on the flat stage (+-5 mm), the envelope 0.2 clear of the oak's reach
  (x 3.4). Rig +z = world +z. Every camera stands on the +z side and looks down -z, so the gold side and the sun are behind the balloon; screen right = +x.
- Set spec: `time: "golden", view: "west", backdrop: false, light: "golden", windows: false, key: [0.6, 1.9, -4.4], shadowSize: 10, leaves: 4, birds: 5`, `birdAt`
  = panel 12's start; no bench. Near mist = the existing `fogveil`: box world [[-40, -9, -60], [50, -1.5, -8]], n 60, size 9, color "#f6e7dc", on 0.8. Sky, sun, mist: no set code.
- Needs code in the set: ONE switch, `season: "spring"`: oak and bush tones green (#6f9a3a, #8aa83a, #b9c84a, #d8d05a, one clump in eight sun-gold #f0d060),
  grass base #7fb245 with patches #5f9a3e, #9cc853, #b9d060, no fallen leaves. Without it the hill is autumn orange and the gores sink into it: layout rounds only.
- Limit: the oak's trunk is 8.6 m from the rig, never in frame with the basket; its outer branches and falling leaves enter the left edge of 1 and 12.

## 7. Climbing out (panels 6 and 8); no step outside
- Exits: Wedge and Mash over the front-right rim at az +40, Spud over the front-left at az -45 (between Chip's belly and the front uprights, clear of the ropes).
- The move, rim 0.30 above the deck: `turn` to the exit, both hands on the rim (`grip` shape `rim`), `hop` 0.32 up and forward into a `sit` on the rim (height
  0.80), the outer leg swings over, the second 0.25 s later (the sheet's frame: one leg over, leaning 10 deg out), then a push off: a 0.80 drop to the grass at
  radius 1.65, `land` with a 6 % squash. Mash first steps down from his box (`move` y 0.85 -> 0.50) and does it one-handed, eyes on the phone.
- No step outside or inside: the sheet's wicker is clean, the drop reads as a real hop, and a step would sit where bags, ropes and food land.
- Panel 10 (backs to camera): Spud (-0.86, 3.4), Wedge (0, 3.5), Mash (0.75, 3.4). During 11 they back away from the rolling food, for 12: Spud (-1.95, 3.3), Wedge
  (-1.10, 3.4), Mash (-0.35, 3.3). `buffetheap` at (0.15, 0, 1.6). Spill start: over the rim at x -0.2..0.1, 0.03 or more above the leather, 0.8-1.4 m/s forward.

## 8. Shot list (pos, look, fov; rig frame, add (6.0, 0, -0.7) for the set)
| panel | pos | look | fov | must read |
|---|---|---|---|---|
| 1 | (0.2, 0.5, 8.4) | (0, 3.6, 0) | 56 | whole rig, crown 235 px under the top; basket 43 % of the width; four colours over the rim; sun right of the uprights |
| 2 | (-2.6, 0.14, 2.1) | (-0.75, 1.15, 0.25) | 56 | front-left stake low left, the humming rope up to the rim, burner and flame top right |
| 3 | (0, 1.25, 6.6) | (0, 1.3, 0) | 44 | Spud left, Wedge right, bags at both edges, one in the grass; burner 20 %, rim 61 %, grass from 78 % |
| 4 | (0.3, 0.7, 6.4) | (0, 2.5, 0) | 50 | basket and all four stakes, envelope cut by the top; four look up |
| 5 | (0, 1.2, 4.6) | (0, 1.95, 0) | 42 | rim at 87 %, four faces 60-74 %, burner 20-31 %, skirt on top |
| 6, 7 | (0.15, 0.85, 5.9) | (0.15, 1.45, 0) | 44 | one camera for both: the basket's foot on the grass at 84 %, the 0.12 gap = 57 px; Wedge leaves frame right for 7 |
| 8 | (0.4, 0.9, 5.4) | (0.4, 1.4, 0) | 44 | Mash on the rim right of centre, his landing in frame; Spud and Chip left |
| 9 | (-0.3, 1.05, 3.1) | (-0.3, 1.62, 0) | 42 | two faces at 68 %, Spud's 315 px wide; Chip's lumps and the rim along the bottom; burner at the top edge |
| 10 | (-0.1, 2.0, 8.4) | (-0.1, 2.3, 0) | 44 | three backs along the bottom (tops at 70-79 %), Chip alone above Wedge's head at 65-73 %, envelope over the top 39 % |
| 11 | (-0.05, 0.5, 3.0) | (-0.05, 1.2, 0) | 52 | Chip's eyes at 44 %, hem and rim at 57 %, heap growing from 78 % down; the three are behind the camera |
| 12 | (-0.4, 0.75, 10.4) | (-0.9, 3.75, 0) | 50 | three backs lower left (71-94 %), heap lower right, sun at 84 % x, 69 % y, the balloon upper right |
- Panel 12, how high: with this camera the crown leaves the frame once rise > 0.87 L - 7.4 (L = 10.4 minus the rig's z), so straight up it is gone at 1.7 m.
  The rig must drift downwind as it climbs. End pose: x -0.15, z -14.3, rise 8.6, sway 1: envelope top at y 334 px (under the caption), basket at 47 %, Chip
  about 50 px tall, waving, four stakes dangling. Path: rise 1 -> 8.6 and z 0 -> -14.3 together in 2.2 s (out), then 0.5 m/s up and 0.8 m/s away to the end.
- Low wides 1, 4 and 10: Mash shows from the eyes up over Chip's leaves, his mouth is hidden; his whole face shows from every camera at y 1.2 or higher.

## 9. Sound (realistic only; the producer judges by ear)
- In the whitelist: burner `ai/ignite` (pilot), `hiss` (valve) then `flamejet` (each blast, 0.8 s); sandbag `thud`; climbing `grab`, `cloth`, landing
  `step-grass` + `thud-soft`; basket drop in 7 `thud` + `kenney/creak`; lift-off `windswell`; bed `ai/storm-wind` at 0.06; buffet as DESIGN-buffet section 5.
- Missing, in order of need: (1) a held propane burner roar of 2-4 s that loops (`flamejet` is one 0.8 s burst; `kenney/thruster-fire` is tagged sci-fi); (2) a
  taut hemp rope groaning; (3) a wicker creak (`creak` is a hinge squeak); (4) a stake tearing out of turf; (5) dawn birdsong; (6) the envelope's cloth billowing.

## 10. Stills the builder shows, open questions, risks
- Stills on scorehill at cameras 1, 2, 5, 9 and 12's end pose, each also as a 270 x 480 phone crop: burn 0, 0.3, 1; strain 0, 1; rise 0, 0.12; taut 0, 1; free 0,
  0.3, 0.6, 1 at rise 3; the sandbag hung and lying. Pass: gores, burner, four ropes and four stakes can be named in the crop; no weave mark repeats.
- Open, my default: (1) how the cast follows the lift: `ride` follows a prop's own x, y, z; default = the director moves the prop's y and feeds `rise` the same
  number so the ground-fixed parts stay down. (2) `season: "spring"`: yes, before the first draft. (3) Panel 3 shows all four (the sheet draws two). (4) Panel 11's
  text wants the friends' open mouths, its drawing has none: no extra shot (a reverse looks at the unbuilt east side); they gasp and jolt at the head of 12.
  (5) The sheet's shock marks are not built (story.md).
- Risks: tightest fits are Wedge's shoulder to the front-right upright (0.07) and Mash's box to Wedge's hip (0.02): run `qa/clear.mjs` first. Food falls 0.8 m,
  not 0.15: more scatter; the heap's solid core is at (0.15, 1.6) from frame 0, keep every landing spot 0.9 from it. First still: shadows must reach x 7.7 and
  no oak leaf may touch the envelope (else rig x 6.3). Scorehill is 150k triangles before 52 heap items and 22 bodies.
- If the brief is wrong somewhere: panel 6 draws the lift while Wedge still sits on the rim; it reads as cause only if `rise` starts on the frame he pushes off.
