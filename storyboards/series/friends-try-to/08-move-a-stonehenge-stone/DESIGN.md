# Friends try to 08 "How could 4 friends move a Stonehenge stone?": prop set DESIGN (14 Nov 2026)

One props file, `engine/page/props-ftt-haul.js` (exports `FTT_HAUL_KINDS`, `FTT_HAUL_GRIPS = {}`: nothing is held), SIX kinds: `haulsledge`,
`haullash` (the lashings, split off the sledge because they must ride the stone), `haulrails`, `haulrope`, `haullever`, `pivotstone`.
Look target: Jonny's sheet `/mnt/project-files/videos/friends-try-to/08-move-a-stonehenge-stone/sheets/friends-08-stonehenge-sheet-1.png`
(timber: panels 04-07, 09; NOT copied: the round boulder stone of 01-03, the unlifted end of 06). Numbers here win over the sheet. House rules:
`storyboards/series/ancient-aliens/kit/briefs/COMMON.md` (hand-drawn Ghibli, every mark drawn once from a hash, no tiling, no Math.random, metres).

## 1. Set frame, place, sun
- **Set frame (every number below):** `s` = metres forward along the travel line, `r` = metres to the RIGHT of travel, `y` up; origin G =
  the ground under the middle of the stone. Kinds are built with local +x = s, +z = r and placed with `rot: 180`:
  **world x = o.x + 124 - s, z = o.z - r** (o = the plain's origin = the centre of the stone circle). Travel = world -x.
- **Land and light:** sh-kit `plain(id, o, { era: "new", T: 25 })` with light `SH_A` and `far: 700` (sun az 20.5, el 11), the ground with
  `trees: false`, `ditch: false`, and without the `-henge` and `-avenue` entries: an oak's 41 m shadow would cross the rails at s 9,
  another oak would stand 14 m behind every side view, and the chalk bank is three times as wide as the ring.
- **Monument:** `stones(id, o, { era: "new", T: 25, built: 0.5 })` (five giant pairs with top stones, about 18 of 30 uprights, no ring
  lintels) with `scale: 0.4` (open question 1). It stands 124 m straight ahead on the rail line.
- **Sun in the set frame:** right of travel (+r), 20.5 degrees ahead, 11 up. Looking back at the friends (panel 01) it is on screen LEFT,
  110 degrees off the lens: faces lit from front left. Shadows fall to -r and 20.5 degrees back, 5.1 times the height. Side shots stand
  on the +r side with the sun behind the camera; forward is then screen right.

## 2. The stone (reused, not rebuilt)
`fallensarsen`, `size: [4.25, 2.1, 1.1]` (long, wide, thick: the ring uprights' own 2.1 x 1.1 section), `look: "new"`, `pieces: 1`, `sink: 0`,
`seed: 3`, sunAz 20.5, sunEl 11, sunColor "#fff3c4", at set (0, 0.84, 0) = world (o.x + 124, 0.84, o.z), `rot: 0`. Box 9.82 m3, less 2 % for
its waist and rounded edges = 9.62 m3 x 2.6 = **25.0 t**. It fills s +-2.125, r +-1.05, y 0.84..1.94 (Spud reaches half of that, Chip a third).
- NEEDS ONE KIT LINE (owner of `engine/page/props-sh-stones.js`): a spec key `fringe: false` that skips the `tufts(...)` call in
  `fallensarsen` (it always plants grass round the stone's foot; on a sledge that grass floats). Default unchanged, so golden is unchanged.
- Why not `sarsen` + `tip: 90` as briefed: its foot is an open tube (`uprightSoup` caps only the top; the foot hangs 0.4 m below the
  origin), its sun is baked in its own frame (tipped, the wrong faces are lit) and its shadow decal is an upright's. `fallensarsen` has
  both ends, the right light, and a lying shadow that stays on the ground when the stone rises. Fallback if the kit line is refused: `sarsen`
  size [2.1, 3.85, 1.1], knobs 0, shadow false, tip 90, rot -90, world (o.x + 125.725, 1.39, o.z), sunAz 78, sunEl 20; open foot = BACK end.
- **Pry (with the lever's `pump` p):** `tilt: -1.62 * p` and `y: 0.84 + 0.060 * p` in one tween: the BACK end rises 12 cm, the front
  lower edge stays on the deck. Check the sign on one still. `haullash` always gets the stone's x, y, z, rot and tilt.

## 3. Palette (the Stonehenge kit's BOARD section 2 where it has the colour)

| Thing | Hex |
|---|---|
| Oak of runners, beams and bar (weathered) | `#8a6238`, shade `#5e4126`, adze-facet light `#b08a58`, end grain `#c9a877`, rings `#7a5a36` |
| Rails (peeled) / sleepers (bark on) | `#a57a4a` / bark `#5d4630`, cut ends `#caa878` |
| Lever (freshly peeled pole) | `#dcc79a`, knots `#8a6238`, bark strips `#5d4630` |
| Pull rope and lashings (lime-bast fibre) / thin binding cord | `#a8875a`, shade `#7a5f3c`, light `#cdb07e` / `#c9b48a` |
| Pivot boulder (darker and cooler than the sarsen) | `#8f9499`, shade `#5f6670`, flecks `#b9bec2` |
| Frost / its shade / winter grass / trodden earth | `#e4ecea` / `#9fb5cf` / `#7a8852` / `#6a5a44` |
| Bare runner footprint on a rail (damp wood) / skid: torn turf, frost crumbs | `#6f4e2c` / `#55683a`, `#f2f6f4` |

## 4. Kinds
Timber, rope and boulder are scene-lit toon materials that cast and receive shadow-map shadows (they stand among the cast); only the
stone is the kit's unlit kind. Every mesh is `lookOnly` + `surfaceOnly` unless SOLID is said. `slack`, `pump`, `creep`, `skid` are not in
propState: each reads spec.<name> as its start value; seed it with a dur-0 set at 0. Sleepers instanced; all six under 70k triangles.
### haulsledge (origin G on the ground, front +s; no params)
- `haulteam`'s sledge (props-sh-far.js: two runners with upturned noses, five cross pieces) seen close, its deck lower (0.84 against
  the far one's 1.33, drawn big for the far read). It rides the rail tops: runner soles at y `spec.ride` 0.32.
- 2 runners at r +-0.52: 0.24 wide x 0.36 high (y 0.32..0.68), sole flat from s -1.95 to +2.50, then the nose sweeps up on an arc
  (centre-line radius 0.80, 60 degrees) to s 3.20, tapering to 0.24 x 0.26, tip top at y 1.02, end rounded r 0.05. Each is one hewn
  trunk: ~140 adze facets (0.10-0.16 long), 9 drying cracks, 12 knots, end-grain rings on tail and nose, a pale scuffed sole.
- 4 deck beams at s -1.70, -0.57, +0.57, +1.70: 0.22 (s) x 0.16 (y) x 1.90 long (r +-0.95), y 0.68..0.84. **Deck top = stone underside = y 0.84.**
  Each is bound to each runner with cord (5 turns of 0.035 cord and a cross: 8 bindings); pale rub marks on top where the stone lay.
- Front bar (the fifth cross piece): a round peeled log, diameter 0.18, 2.20 long (r +-1.10), centre s 2.40, y 0.77, bound to both
  runners. On it two collars of pull rope (4 turns of 0.08 rope, a knot in front) at r +-0.88: a `haulrope` starts at each collar's
  front, (2.50, 0.77, +-0.88).
- Whole: 5.15 long (s -1.95..3.20), 2.20 wide. The stone overhangs the runner tails by 0.175, the last beam by 0.315, the beam ends by 0.10.
- SOLID. Sittable: the four beam tops at y 0.84 (panel 10 seats at r +0.52: s -1.70 Wedge, -0.57 Chip, +0.57 Spud, +1.70 Mash).
### haullash (the stone's frame: origin = the middle of its underside, long axis x; placed exactly as the stone; no params)
- spec.size [4.25, 2.1, 1.1]. Three closed girdles of 0.07 rope round the stone at x -1.135, 0, +1.135 (the gaps between the deck beams),
  each two turns 0.075 apart with a reef knot (0.16) on the top face at z +0.35. Centre line 0.03 outside the stone (the rope sinks 5 mm,
  never floats): half-width at x = 1.05 * (1 - 0.03 * sin(pi * (x / 4.25 + 0.5))), height 1.1, corner radius 0.05 (fallenSoup's numbers).
- One ridge rope along the top centre from x -1.135 to +1.135, hitched to each girdle (3 knots, 0.12), two frayed ends 0.35 long lying
  on the top. The strands under the stone are modelled: panel 09 looks up at them.
### haulrails (origin G, +s forward)
- 2 rails at r +-0.52: 0.20 wide x 0.15 high, top y 0.32, from s -2.20 to +33.0; each is 6 trunks (5.5-6.5 m) butted over a sleeper,
  wandering +-0.02 sideways and +-0.01 in height, flat adzed top, rounded sides with a few bark strips.
- 58 sleepers: round logs with bark, diameter 0.24 (+-10 %), 1.50 long (+-6 %; r +-0.75), yaw +-3 degrees, sunk 0.05 (top y 0.19), one
  every 0.60 from s -1.80 to +32.4 (haulteam's log pitch). Cut ends pale and faceted. No sleeper and no rail behind s -2.20.
- Frost: rime on every rail and sleeper top (drawn crystals, ~40 per metre, thicker on the shade side). On each rail top a frost-free
  footprint of the runner sole, bare damp wood with a crisp broken edge 2 cm wide, from s -1.95 - creep to +2.50 - creep.
- param `creep` (METRES, 0..0.10, spec.creep 0): how far the sledge has moved on. At 0 the footprints hide under the runners; at 0.05 a
  5 cm bare band shows behind each runner tail with 20 cm of frosted rail behind it (panel 07).
- Ground apron: one decal 20 x 9 m (s -9.5..+10.5, r +-4.5) at y 0.012, canvas 2560 x 1152 (the plain's own paint is 3.5 px/m out here), its
  outer 1.2 m fading out: frosted winter grass as the kit's, ~2600 frost feathers, ~900 grass ticks, trodden earth under the track (r +-0.9).
- param `skid` 0..1 (spec.skid 0) at spec.skidAt [6.35, -1.04] (Chip's feet): two scraped lines 0.12 apart, 0.06 wide, growing from 0 to
  0.55 m toward -s, torn turf with a ridge of frost crumbs at the trailing end (panel 02).
### haulrope (origin G; one prop per rope)
- 0.08 thick three-strand rope: three helical ridges as geometry (pitch 0.24), ~7 stray fibres per metre, a whipped end with a 0.12 frayed tuft; 96 segments along, 8 round. No contact oval: gloves go on it by world points.
- spec.from A, spec.grip H, spec.end E (each [s, y, r]), spec.side +1 | -1 (outward). **Rope A (sun side):** A (2.50, 0.77, +0.88),
  H (6.50, 0.56, +1.58), E (7.45, 0.04, +2.13), side +1. **Rope B:** A (2.50, 0.77, -0.88), H (6.50, 0.38, -1.46), E (7.45, 0.04, -2.01), side -1.
- **Taut line (the director's function):** P(q) = A + q (H - A), q 0..1. Rope A = (2.50 + 4.00 q, 0.77 - 0.21 q, 0.88 + 0.70 q);
  rope B = (2.50 + 4.00 q, 0.77 - 0.39 q, -0.88 - 0.58 q). 0.01 of q is 4.1 cm of rope.
- Tail (the same at every slack): from H it drops to the ground at (H.s + 0.25, 0.04, H.r + side * 0.30), makes 1.25 turns of a loop r 0.26
  round (H.s + 0.45, H.r + side * 0.72), the upper strand 0.08 up where it crosses, and ends at E: coiled beside the front man, never ahead.
- param `slack` 0..1 (spec.slack 0). Free span = q 0..0.80, grip stretch = q 0.80..1.
  - 0..0.5 (k = slack / 0.5): the free span sags, y = max(0.04, yTaut - 1.1 k * 4u(1 - u)), u = q / 0.80; where it lies on the ground it
    snakes, r += side * 0.10 k sin(3 pi u). The grip stretch stays on the taut line, so gloves stay valid (panel 09 = 0.5).
  - 0.5..1 (k2 = (slack - 0.5) / 0.5, eased): the grip stretch sinks to y 0.04 and snakes, r += side * 0.08 k2 sin(10 pi (q - 0.8)).
    At 1 the whole rope lies on the frost, still tied at A (panels 03, 04, 10). Hands let go before 0.5.
### haullever (origin Q = the pole's centre line over the boulder, local +x toward the tip) and pivotstone (origin bottom centre)
- Pole 4.40 long (4.3 x Spud with his boots): far end at local x -3.60, tip end at +0.80; diameter 0.09 at the far end, 0.12 at Q; the
  last 0.30 is cut to a flat chisel 0.05 thick at its end. 9 knots, 6 drying cracks, 4 bark strips, a 0.03 natural bow sideways.
- Placed at set (-2.64, 0.986, 0), rot 180: on the centre line, the tip 0.25 under the stone's back end between the runner tails (not the corner).
- param `pump` 0..1 (spec.pump 0) turns the pole about Q in the s-y plane: angle above level **th = 20.9 - 12.9 * pump** degrees. A
  point d metres from Q toward the far end is at set **(-2.64 - d cos th, 0.986 + d sin th, 0)**; the stone's edge rests 0.55 from Q
  on the tip side. pump 0: far end (d 3.60) at y 2.27, stone on the deck. pump 1: far end at y 1.49 (0.78 lower), the stone's back end
  up 12 cm and pushed 3 cm forward (the creep is real).
- `pivotstone`: a lumpy round boulder 1.05 (s) x 0.93 high x 1.00 (r), sunk 0.05, its top exactly at local (0, 0.93, 0) with a worn saddle 0.12 wide
  for the pole; lumps +-0.04, ~260 flecks, frost on its upper shade side, 24 grass tufts at its foot. Set (-2.64, 0, 0). SOLID; 0.22 behind the rail ends.

## 5. Hands
**Rope (panels 01, 02): beside the belly, not over the shoulder.** A potato's shoulder is its cheek: a rope over it puts rope and gloves at
0.75-0.9 of the body, eye height, across the face from the front camera. Beside the belly the gloves stay under the eyes, the rope reads as one
straight bar, and the 25 degree forward lean does the acting. Each rope runs BETWEEN its two friends, 0.12 from each body's side.

| Who | Rope, side of it | Gloves at q (front, rear) | Body centre (s, r), facing +s | Glove height |
|---|---|---|---|---|
| Wedge | A, outer | 0.87, 0.82 | (5.83, +2.03) | 0.59 = 46 % of his body |
| Spud | A, inner | 1.00, 0.95 | (6.35, +1.06) | 0.57 = 48 % |
| Chip | B, inner, the front man | 1.00, 0.95 | (6.35, -1.04) | 0.39 = 47 % |
| Mash | B, outer | 0.87, 0.82 | (5.83, -1.76) | 0.44 = 24 % (arms straight down) |

Screen order in panel 01 from the left: Wedge, Spud, Chip, Mash (the sheet's). The row is 4.5 m wide. Inner bodies clear the rails by
0.13 (centre to rail 0.42-0.44). Free frost for a fallen friend (panel 03): s 7.8..9.5, |r| 0.95..3.0.

**Lever (panel 06): the pole at the chest, arms hooked over it, face ABOVE the pole** (the sheet; gloves stay under the chin). Bodies hang
on the shade side of the pole facing +r (camera and sun), centres at r -0.40 (Chip and Mash -0.36). Each glove pair sits on top of
the pole (pole point + 0.05 up) at d +-0.13 (Chip +-0.10).

| Who | d from Q | Pole y at pump 1 / 0 | Gloves above own soles (0.14 + 0.60 x body) | Soles above the ground at pump 1 / 0 |
|---|---|---|---|---|
| Mash | 1.00 | 1.13 / 1.34 | 0.88 | 0.29 / 0.51 |
| Chip | 1.66 | 1.22 / 1.58 | 0.46 | 0.81 / 1.17 |
| Spud | 2.42 | 1.32 / 1.85 | 0.67 | 0.70 / 1.23 |
| Wedge | 3.34 | 1.45 / 2.18 | 0.73 | 0.77 / 1.50 |

Order from the stone outward as on the sheet. Bodies are 0.09 apart, Mash 0.20 off the boulder, and Wedge's body overhangs the pole's
end by 0.19. Panel 05: Wedge stands under the pole at d 1.16 (pump 0, pole y 1.40), one glove up on it, 0.28 over his head.

## 6. Beats the set carries
- **Creep (07):** on the cut, `creep: 0.05` on haulrails with dur 0; nothing else moves. If it must happen in shot, move sledge, stone
  and lash 0.05 forward instead (world x -0.05, 6 frames) and leave `creep` at 0.
- **Beam lift (09):** the lashings STAY ON THE STONE (the sheet shows them): tween the stone's and the lash's `y` together from 0.84 to 8.84 or
  more. Nothing snaps or falls; the sledge stays on the rails, deck bare with its rub marks, collars on the bar. `ringship` s 0.35 (10.5 m across)
  at set (0, 15, 0), beamR 7.1 (2.5 m; the stone's half diagonal is 2.37), beamLen 43, beam 0 -> 1. The stone's shadow decal slides away by itself.
- **Tag (10):** `haulteam` at world (o.x + 134, 0, o.z + 26), rot 180, track 40: it passes 26 m behind the sledge toward the ring.

## 7. Cameras (set frame, convert as section 1; 1080 x 1920, fov vertical; starting points for `qa/camfit.mjs`)

| Panel | pos (s, y, r) | look (s, y, r) | fov | Note |
|---|---|---|---|---|
| 01 | (22, 0.35, 0) | (4, 2.4, 0) | 29 | long lens on the rail line; the frame is 4.5 m wide at the row, Wedge cropped 0.2 at the left, the stone's top above every head |
| 02 | (9.2, 0.42, -0.5) | (6.35, 0.42, -1.15) | 32 | Chip 40 % of the height, the rope a bar at screen right, the sledge behind; `skid` 0 -> 1 |
| 03 | (11.4, 1.5, -2.6) | (6.0, 0.45, -0.6) | 44 | Chip on his back at (8.0, -1.6); slack 1; the sledge unmoved behind |
| 04 | (-21, 9.5, 5.5) | (14, 2.0, -0.5) | 52 | from behind and above; friends at s 0.5..3.2, r 2.3..3.3; the rails run on to the ring |
| 05 | (-5.4, 1.05, 5.6) | (-3.4, 0.95, 0) | 40 | the three watchers behind the pole at s -4.6..-6.0, r -1.4, facing the camera |
| 06 | (-9.2, 0.6, 5.0) | (-3.9, 1.2, -0.1) | 48 | three-quarter from the far end, low: daylight shows under the lifted end. Square-on needs 9.6 m back and leaves Spud 220 px |
| 07 | (-0.5, 0.26, 1.9) | (-2.5, 0.42, 0.75) | 44 | the sun-side runner tail; Chip slumped against the boulder at (-2.9, +0.95) |
| 08 | (-4.9, 1.2, 6.4) | (-4.9, 1.3, 1.9) | 32 | Mash at (-4.9, +1.9); open plain behind him for the sliding shadow |
| 09 | (16, 0.4, 0) | (0, 8.2, 0) | 60 | the friends' heads in the bottom 14 %, the whole ring ship in the top third |
| 10 | (-5.2, 1.7, 6.4) | (0.6, 1.2, -4) | 44 | friends on the sun-side beam ends; the team crosses behind them, left to right |

## 8. Proof stills, open questions (with my default), risks
- Proof stills (tall frame, Spud 1.2 m clear for scale; `bench/make-ftt-haul.mjs` + `bench/ftt-haul-sheet.png` in this folder): A whole set, cameras
  01 and 04; B ropes at slack 0, 0.5, 1 from above; C pump 0 and 1 with the stone pried, camera 06; D creep 0 and 0.05, camera 07; E skid 1,
  camera 02; F the bare sledge and the lashed stone at y 8.84, camera 09.
- Q1 Ring size. Default `scale: 0.4` on the far `stonehenge`: 16 % of the frame's width in panel 04 (sheet 14 %; the kit's real scale gives 40 % and says "nearly there"). Back to 1 if a still looks like a toy.
- Q2 The ring is ahead on the rail line, so only panel 04 shows it (01, 03, 09 look back; 05-08 and 10 look across). Default: accept.
- Q3 Hang style. Default: pole at the chest as the sheet, not arms straight up (faces under the pole, gloves over the heads).
- Q4 Panel 08's sliding ship shadow is not in this set (a ground shade plus a dim on the cast). Default: the director's own effect.
- Risk: four real potatoes abreast are 4.5 m wide, so in a 9:16 frame nobody is taller than 17 % of it in a frontal 01 or a square-on
  06 (the sheet draws them at 35 %). Cameras 01 and 06 are chosen for that; no layout with the track between them makes them bigger.
- Risk: the plain scatters scrub and molehills by hash: if a top-down still shows any within 4 m of the track or lever, move G along world z
  by up to 15 m. The stone takes and throws no shadow-map shadow (kit): keep the cast out of r -1..-11 beside the sledge.
