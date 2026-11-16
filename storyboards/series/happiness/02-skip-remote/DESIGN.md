# Design: happiness EP02 "skip the boring parts" (16 Nov 2026)

Look target: `skip-remote-sheet-1.png` (01-10), `skip-remote-sheet-2.png` (11-20), both in this folder. Beats and
narrator: `OUTLINE.md`. Rules: `docs/rules/story.md` 1, 5, 6 and `docs/rules/images.md`.

Frame 1080x1920, 30 fps, target 45-50 s (20 panels, average 2.3 s; nothing over 1.8 s before panel 08 unless it
moves). Safe zone x 60-920, y 210-1360. Metres in world units, hex for paint, px at 1080x1920. Every mark drawn
once: each crease, scuff, rust patch, dust clump, knit row is placed by index, no tiled texture, no `Math.random`,
no wall clock.

Panel -> place, one line: 01 02 16 17 18 avenue (`sunny-city-avenue`, jam) | 03 cottage doorstep | 04 lane wet /
05 lane dry (new painted pair) | 06 bakery street (new painted) | 07 08 office | 09 autumn sidewalk | 10-15 living
room, lamp-lit night | 19 20 avenue at sunset (graded twin).

Five places are reused as-is, four are dressed, three paintings are new. Count of new props: 5 (remote, box TV,
dash-with-glove-box, umbrella, bread loaf) plus two costume pieces (cardigan, glasses) and one HUD part.

## Reused pieces: how they are dressed

| Piece | Where | Dressing |
| --- | --- | --- |
| `spud.json` | all | unchanged for 01-08; `spud-mid` 09-10, `spud-old` 11-15 (section 2) |
| `chip.json` | 01-07, 18-20 | unchanged; hood stays down (open question 8) |
| `wedge.json`, `mash.json` | 06 queue, 09 far friends | unchanged, backs to camera, 7-11 m away |
| `streetpotato` (props-neonstreet.js) | 06 queue, 09 far friends | dress "coat", 4 greys/browns, hat 0/1/2, rot 180 |
| `carseat` (props-road.js) | 01-03, 16-20 | cream #e8dcc4, trim #c9b893, `head: 1`, width 0.52 |
| `steer` (props-road.js) | 01, 02, 16, 18 | rim #2a2520, tip 34 |
| `carglass`, `headrest`, `dashglow` (props-sinkcar.js) | cabin shots | glass tint 0.06 (clear, daylight), dashglow off |
| `couch` (props3d.js) | 10-15 | color #7e6a74 with a floral cover piece (T8), doily, two cushions |
| `officedesk` (props3d.js) | 07, 08 | color #b9a98f, panel #6f6a63, w 1.5, d 0.75 |
| `cocoacup` (props-winter.js) | 07 | two cups, sleeve #a8805a, white lid, `steam` 0.35 |
| `teamug` | 10 | `steam` 0.3 |
| `parkbench` (props-whatif.js) | 09 | w 2.0, slats #8a6a42, iron ends #2f3330 |
| `wetpuddle` (props-guard.js) | 04 | r 0.85, `splash` on the jump frame, `ring` 0.4 |
| `rainbox` (props-timewatch.js) | 04, 07 window | n 1500, box [8, 6, 8], streak 0.55 |
| `ripples`, `wetstreet` | 04 | ripples 0.5 on the cobbles |
| `walkingstick` (props-race.js) | 11, 15 | style "crook", 0.5 long, #6b4a2b |
| `tear` (props-guard.js) | 14 | worn, `fill` 0.8, `on` 1, stream 1, left cheek |
| `floorlamp`, `sidelamp`, `wallart`, `rug`, `dustmotes` | 10-15 | warm bulb #ffd9a0, lamp at x 1.15 |
| `leaves` / `windleaves` | 09 | 40 leaves, fall 0.25 m/s, no swirl |
| `citycar` (props-city.js) | 01, 16, 19 | jam traffic, section 4 |
| `phone` (props3d.js) | - | not used; the remote is its own prop |

`seasonswirl` is a magic swirl: not used (story.md, no magic). `car` (props3d.js) is an open 0.84 m toy tub: not
Spud's car, see section 4. `screen` (props-trend.js) is a phone with fixed drawn screens: not the TV, see section 5.

## 1. THE REMOTE

Panels 01, 02, 08, 12, 15, 17 and every press (03, 05, 06, 07, 09, 10, 11 off-camera presses are covered by the
cut; the remote is on screen in the frame before each).

Size 0.130 wide x 0.250 long x 0.030 thick, corner radius 0.022, long axis vertical in the hand. (Precedent: the
sinking-car phone is 0.078 x 0.155 x 0.012; this is that at 1.6, which is what the sheet draws against his 0.88 m
body.) Origin: the middle of the back face. Front is +z when held, the FF button toward the lens.

Paint: body lit #2e2d33, shade #1d1c21, edge highlight #6a6870 along the top-left arris 1.5 mm wide. Never pure
black (images.md). 6 scuff strokes 4-9 mm, each placed by index, and one thumb-shine patch 0.030 x 0.022 at 38 %
down the front.

Front: one white disc #f4efe6, diameter 0.082 (63 % of the width), raised 0.004, ink ring #1b1a20 1.5 mm, centre
41 % from the top end so the thumb pad lands on its lower third and the symbol stays readable. Two black triangles
pointing +x (right), each 0.020 wide, gap 0.004, hand-inked edges. This is the ⏩ of the hook text: the glyph is the
button, no overlay glyph.

Back: red disc #c8382e, shade #96261f, diameter 0.050, raised 0.003, two white triangles pointing -x, centre 34 %
from the top end (upper half). A battery-cover seam 1 mm with a thumb notch 0.018 across the lower third: that seam
is what tells a viewer which face is the back in 12. Top end: a dark red IR lens 0.016 x 0.006, #5a1a18, so it reads
TV remote and not phone.

Triangles: 600 clean, 950 with dust.

Grip: Spud's LEFT hand (screen right in the sheet) in every shot, through `grips.mjs` `phone(c, who, spec, { side:
"left", gap: 0.035, height: 0.42 })`, hand shape `hold`, edge hold, thumb on the front over the disc's lower third,
prop tilted back 25° from vertical so the front faces the lens. Chest height or below, never between the lens and a
face (clip-lessons). Needs a `grips.mjs` SIZE row: director's file.

Press, 0.30 s (9 frames): eyes drop to the button 4 frames before f0; thumb lifts 0.020 over frames f0-f2 (shape
`scroll`, thumb raised); down over f3-f4; key `press` 0 -> 1 on f4 sinks the disc 0.003, a dark ring 1 mm appears
and the disc dims to #d9d3c8; the hand jabs 0.04 forward with the forearm 4° (anticSettle); the click lands on f4;
hard cut on f6. No whoosh, no glow, no light flash (section 7).

Read sizes: the FF disc is >= 56 px across in every press shot. 02 (close-up): remote 410 px wide, disc 260 px,
scuffs and seam visible. 08 (remote toward camera): disc >= 130 px, disc centre y 1230-1280 (above the 1360 safe
line), eyes y 840-880, leaf tip y >= 450 so the "YES or NO" row stays clear. 12 (back close-up): remote 430 px, red
disc 165 px, dust rim legible. 15: remote at 190 px, held high.

Dusty variant for 11-12, key `dust` 0..1 (at 0.45 in 11, 0.45 -> 0.1 in 12 if the wipe is used): film #b9ae9c over
the body at 0.45 opacity, 14 edge clumps #cfc4b0 about 3 mm each placed by index, the white disc greyed to #b8b0a2,
5 cobweb threads #d8d0c0 running 0.09-0.16 to the armrest, and a dust-halo decal 0.34 x 0.20 on the fabric where it
has lain. It lies FRONT UP on the far armrest in 11, so turning it over in 12 is the discovery.

12, the turn-over: the remote lies on two flat palms (both hands shape `flat`, gap 0.035) and the PROP rolls 180°
about its long axis over 8 frames with a 0.02 hop. No regrip, no hand turn, so `hand-turn` and `palm-turn` cannot
trip. Fallback after one failed round: cut 12a front 0.5 s / 12b back. Optional key `wipe` 0..1: the thumb clears
the red button, #8a4a44 -> #c8382e.

Separate prop instances, never a hand-off: clean-in-hand (01-10), dusty-on-armrest (11), dusty-in-hands (12-15),
in-the-glove-box (17). Hide the one that is not in shot (clip-lessons: a handed prop blends 0.15 s even over a cut).

15: the arm goes out to the side, fist >= 0.25 m outside the head outline, back to the lens, thumb on the red disc,
so `character-overlap` and `face-hidden` stay clean while the HUD rolls back.

Panel 08 draws the right hand. Default: keep the left everywhere for continuity (open question 5).

## 2. SPUD AGED

Two data files, `characters/potatobrawl/spud-mid.json` (09-10) and `spud-old.json` (11-15), same seed 29 and the
same face kind as `spud.json` so it is one potato at three ages. Precedent: `characters/what-if/viking-old.json`.

DATA (no builder):

| | spud (25) | spud-mid (38-61) | spud-old (82) |
| --- | --- | --- | --- |
| skin | #e2a95c | #dfa85e | #ddb077 |
| lump | 0.03 | 0.035 | 0.055 |
| height | 0.88 | 0.88 | 0.82 |
| sprout colour | #6cbf3a | #4f8f34 | #a9ad8a |
| leaf bend | 0 | 0.35 | 1.0 (`droop`) |
| lid | 0 | 0.20 | 0.35 |
| brow | #3a2a18 0.85 | #4a3a22 0.8 | #6f665c 0.70 |
| cheeks | #ff8f8f | #f59a95 | #e7a8a2 |
| sweater | #2f8f8a | #2f8f8a | #5f9a94 (faded) |
| body lean | 0° | 4° | 14° |
| walk | 1.0 | 0.85 | 0.55 |

BUILDER (3 pieces):

- Creases, as drawn ink strips on the skin, method as the old face in `engine/page/costumes-plato.js` (strips placed
  by `ch.face.place(u, v)`, polygonOffset, each stroke drawn once). mid: 3 crow's-feet per eye, 14 mm, line 1.2 px
  at the atlas scale, plus 1 under-eye line per eye 22 mm. old: 5 forehead lines 40-58 mm, 4 crow's-feet per eye,
  under-eye lines, 2 mouth lines 18 mm, and 22 skin spots #c79a63. Ink #8a6a46 at 0.55 opacity, not black.
- Round glasses, thin gold: a worn prop shared by both ages. Lens r 0.052, rim 2 mm #c8a23c, bridge 0.022, arms to
  the sides ending 0.01 before the head's silhouette. Lenses at 0.12 opacity white sheen, see-through for
  `eyes-readable`. 400 triangles.
- The grey cardigan, OLD ONLY (the brief is right: panel 10 puts it on mid Spud by mistake; mid wears the plain
  teal sweater). Costume code beside the spud sweater: body #9a958c, knit rows drawn once (14 ribs per 0.1), open
  front showing the teal collar, 4 buttons #7a5a34 at y 0.62, 0.50, 0.38, 0.26, ribbed cuffs and hem 0.03, sleeves
  end 0.11 before the hand centre (story.md), one stitched tan patch #9a6a3c 0.09 x 0.07 on the LEFT elbow, which
  is where his sweater patch already is and what 14 draws (11 and 15 draw it right; left wins, open question 7).

Cane is the existing `walkingstick`, both hands, static. Tear is the existing `tear`. One line on a rule: story.md
says cast colours stay, and the sheet pales the old skin; the sheet wins here because the ageing is the story.

## 3. THE AGE COUNTER HUD + "YES or NO"

New opt-in part `age` in `engine/page/hud.js`, exposed in `storyboards/lib/overlay.mjs`. House chip exactly as the
money redo section 10: fill rgba(18,16,24,0.66), edge rgba(255,255,255,0.16), radius 20, text #fff8ec.

Chip x 72-372 (300 wide), y 214-332 (118 tall). No English: a birthday-cake icon 64 px (x 94-158, centre y 262, 3
candle flames at 25-38, 1 at 61+) then the number in CapBlack 84 px in fixed 50 px cells from x 176. A life bar at
the chip's foot: track x 94-350 (256 wide), y 308-320, fill = (90 - age)/90, so 25 -> 72 %, 31 -> 66 %, 38 -> 58 %,
61 -> 32 %, 79 -> 12 %, 82 -> 9 %; green #8fd14f above 50 %, amber #ffb23d 25-50 %, red #ff4d4d below 25 %; the lost
chunk flashes #fff8ec for 0.35 s.

A jump starts on the cut frame: the number counts over 0.4 s, the chip kicks 6 px in 0.18 s, the number flashes
#ffd25a for 0.4 s and scales 1.18 -> 1. A "+N" tag, CapBlack 40 px amber, sits right of the chip at x 388 for 0.9 s:
+6, +7, +23, +18, +3. The bar is what carries the meaning with no words.

Keys v0: `age` 25 at t 0; 31, 38, 61, 79, 82 on the press cuts; 25 on the rewind. Roll-back lives inside panel 15
while he holds the red button: 82 -> 25 over 1.5 s eased in, digits sliding down, the bar refilling red -> amber ->
green; when it reads 25 the click lands and the hard cut to 16 follows 2 frames later (cause on screen first). The
"+N" tag reads "-57" in green #8fd14f for 1.0 s.

Layout with the captions: HUD on top (y 214-332), captions below it in y 350-640, default `pos` 470, two 62 px
lines land about y 395-545. This inverts the money redo (captions 210-330, HUD 344-462); whichever ships first
should set it for the series (open question 2). Nothing sits over the eyes at any panel: eyes are y 780-980 in the
mid shots and y 840-880 in 08.

Leaving: the chip fades over 1.0 s starting on the word "forget" in "you forget all your worries", inside 19, so 20
is only the sunset. A sun disc never sits behind the chip (19's sun is centred at x 540, y 1000).

"YES or NO" at 08, 2.0 s: two pills in the row to the right of the chip, x 420-900, y 214-332, radius 20, YES fill
rgba(143,209,79,0.85), NO fill rgba(255,77,77,0.85), CapBlack 88 px #fff8ec, a small "or" 40 px between them at x
660. Caption "Would you press it?" on one line at `pos` 400. The pills fade in 0.2 s, hold 1.6 s, out 0.2 s.

## 4. SPUD'S CAR

The `car` prop is not enough: it is an open-top toy tub 0.84 wide with a tiny windscreen. Build on the
`hatchback` vehicle rig (`engine/page/car-hatchback.js`, L 3.3, W 1.1, belt 0.9, roof 2.06, wheel 0.34, cabin
[-1.42, 0.8], body 120 x 72 quads, about 17k triangles) recoloured, plus one new episode file of pieces that ride
the rig. The rig is `sb.rigs`, kind "hatchback".

Paint: teal #3f7f7b, shade #2d5f5c, chalky fade band along the roof and bonnet tops at 0.25 white, 9 rust patches
0.04-0.18 across placed by index on the sills, wheel arches and lower doors, each drawn once (precedent: roadster
`spec.rust`). Chrome #c9ccce.

New pieces (one file, all parented to the rig):
- Grille 0.74 x 0.22 at z 1.60, y 0.60: 7 horizontal chrome bars 0.018 thick, 0.014 gaps.
- Two round headlamps, cream #f2e6c8, r 0.11, at (±0.66, 0.78, 1.58), chrome bezel 8 mm. (The rig already lights
  these positions, so they sit on top of its lamps.)
- Two wipers, #262523, 0.52 long, parked at 14° from the screen foot, at x ±0.30.
- Bonnet crease: one raised line down the middle, 4 mm, from z 1.55 to the screen foot.
- Dash fascia in body colour, 1.9 wide x 0.26 tall, top edge y 0.98, with the GLOVE BOX on the passenger side:
  lid 0.34 x 0.20, hinged at the bottom edge, key `glove` 0 -> 1 opens it 80° down into a tray; cavity 0.34 wide x
  0.14 tall x 0.22 deep, so the 0.25 remote lies in it with 0.09 to spare; chrome latch 0.05, and a 5-slot vent
  0.18 x 0.05 at the far side. Interior colour #4b4650 is hard-coded in the rig, so the tray lines up with it.
- Rear-view mirror is already in the rig; the sheet's mirror reads at the top middle of the windscreen shots.

Seats (`carseat`, cream): driver at x -0.55, z 0.06, y 0.12 (cushion top 0.545); passenger at x +0.55, z 0.06. Chip
is 0.53 tall, so his seat is raised to y 0.345 (cushion 0.77) to lift his face clear of the 0.90 belt line; see
section 8 for where it moves in 20. `steer` at x -0.55, y 0.88, z 0.63, tip 34.

Handedness: the sheet draws the driver on screen left from the front in 01, 02, 16, 18, 20 (right-hand drive) and
on the other side in 03 and 17. Default RHD: driver at -x, wheel at -0.55, Chip at +0.55. 03 and 17 are then
mirrored against the sheet; that also puts the remote hand (left) on the centre side, where it can reach the glove
box in 17 without crossing his body (open question 1).

Camera starts (rig-relative, from the sinking-car and ep6b precedents): cabin two-shot `pos [0.05, 2.15, 3.3], look
[0.05, 1.0, -0.2], fov 58`; driver face `pos [-0.55, 1.8, 2.95], look [-0.55, 1.25, 0.2], fov 40`; through the
windscreen `pos [-1.0, 1.8, 3.4], look [-0.95, 0.9, -0.3], fov 40`; glove box in 17 `pos [0.25, 1.35, 1.25], look
[0.55, 0.78, 0.35], fov 44`; high jam shot 19 `pos [0.2, 7.5, 8.0], look [-0.4, 0.6, -14.5], fov 27`.

The jam: `citycar` props in sheet colours (#8a3f3a, #d8c88a, #39414a, #6f7a84, #b9b2a4). 01 and 16: 6 cars, three
lanes, 4-14 m ahead, fronts toward us. 19 from above: 11 cars in 3 lanes out to 26 m, all facing -z with tail lamps
lit toward a low sun, Spud's teal car in the middle lane nearest us. Each `citycar` is about 17k triangles, so 11 of
them is 190k: if that costs a round, drop the 4 farthest to flat painted cars in the env instead. (The sheet draws
the teal car facing the camera in 19; that is a sheet slip, since the jam has to face the sun it drives into. One
line: follow the panel for the sun sliver in 20, follow the direction for 19.)

## 5. THE OLD BOX TV

New prop: a walnut cabinet TV standing on the sideboard, panels 11 (dark) and 13-14 (playing). Cabinet 0.78 wide x
0.54 tall x 0.42 deep, walnut #6b4a32 with 2 drawn grain runs per face, origin the middle of its base. Screen a
bulged 4:3 face 0.52 x 0.39, corner radius 0.06, bulge 0.025 at the centre, surround #4a3a2c. Two brass knobs
#b08a3c r 0.028 at (0.30, 0.16) and (0.30, 0.07) from the centre, and 9 speaker slats 0.14 x 0.006 under them.
1.8k triangles.

The screen plays an atlas, the same way the iphone screen does (`spec.screen { src, cols, rows }` plus a `feed`
param stepping tiles): not a second live camera. The two pictures (the car joke; both jumping in the puddle) never
happen in the main timeline, so they are rendered as two short side scenes and baked:
- "car joke": panel 18's staging through panel 01's lens, 2.0 s.
- "puddle jump": the lane from 05 with the puddle of 04, 2.0 s.
Each at 12 drawings a second, 24 tiles, 512 x 384 per tile, 6 cols x 4 rows (3072 x 1536 per atlas).

CRT read with no repeating pattern: the bulge itself, a corner vignette at 0.35, one diagonal reflection streak 0.18
opacity drawn once, a 0.04 blue lift on the whites. For the rewind, 2 tracking bars drift up the screen over 1.4 s.
No scanline tile.

Glow: one point light at the screen centre, 0.06 in front of the glass, colour = that tile's average (stored beside
the atlas as 24 hex values), intensity 0.55, range 2.2, stepping 12 times a second with the tiles. Old Spud sits
1.35 m away at screen left of it, so the light does the face; his key drops to 0.35 while the TV is on.

Screen width on frame: 540 px in 13 (50 % of the frame, as the panel draws it), 300 px in 14 behind the tear, dark
and 210 px in the foreground right of 11.

## 6. PLACES per panel

| Panels | Place | Dressing |
| --- | --- | --- |
| 01, 02 | env `sunny-city-avenue` (eye 4.5 at z 20, groundMax 90, key [-3, 4, -7]) | car nose +z toward the painting camera, 6 `citycar`, stopped |
| 03 | set `cottage` | `archdoor` recoloured red #a7382e, lantern lit 0.5, ivy, hydrangeas; the three hard-coded pumpkins need an off switch (T11) |
| 04 | NEW painted env "old-lane-rain" | cobbles, wall lantern, hydrangeas, `rainbox`, `wetpuddle`, `ripples`, `wetstreet` |
| 05 | its dry twin "old-lane-sun" (`env.py` "from", reached with `set.swap`) | same lane, sun, no puddle, no rain |
| 06 | NEW painted env "bakery-street" | striped awning, 5 `streetpotato` in coats from behind + Wedge and Mash, 7-11 m |
| 07, 08 | set `office` (sets.js) | wall #8e8d8a, floor #6e6a66, the existing window plane at (-1.25, 1.75, -2.385) carrying a rain card, `officedesk`, two `cocoacup` |
| 09 | painted `autumn-sidewalk` (896 x 1344, orange tree left, iron lamps) | `parkbench` at x 0.1, 40 falling leaves, Chip + Wedge + Mash walking away 9 m off |
| 10-15 | plate `livingroom-golden.night` + `livingroom-golden-side` on a plain set | `couch` with floral cover and doily, `sidelamp` + `floorlamp` warm #ffd9a0, `wallart`, `rug`, `dustmotes`, the box TV; 10 needs snow in the pane (T12) |
| 16, 17, 18 | env `sunny-city-avenue` again | identical staging to 01, so the cut back reads as the same minute |
| 19, 20 | NEW graded twin "sunset-city-avenue" (same tool as `twilight-city-crossing` from golden) | low sun at x 540 / y 1000, tail lamps, faces get a warm front fill #ffd9a0 at 0.6 |

Why painted rather than the flat sets the brief lists: `storefront` is the DUO phone store with its own logo and
lettering, so it cannot be a bakery; `london-palace-forecourt-rain` has a palace and a red bus and no dry twin, so
it cannot be the lane in 04-05; `street` and `park` are flat and bright and would not sit beside the painted avenue.
Fallback if the paintings cost a round: 06 on `street` with a `marketstall` dressed as the bakery, 04-05 on
`street` wet and dry, 09 on `park`. Nine places in all, five of them reused and three of them the same avenue.

New small props for the panels: an umbrella (open 0.92 canopy #22201f, 8 ribs, and a folded state with a brown
crook handle; 04 and 05) and a long loaf #c98f4e 0.34 x 0.11 for Chip's head in 06. Chip's hood is drawn UP in 04;
his data has it as a rolled cowl, so the default is hood down with the umbrella doing the rain (open question 8).

## 7. How a SKIP reads with realistic sound only

The click and the hard cut carry it; nothing else. On the frame of the cut, five things change at once, and no two
of them need English:
1. The place and the light flip: cottage daylight -> wet lane lantern -> dry lane sun -> bakery street -> grey
   office rain -> autumn -> snow window -> lamp-lit night. Weather and key colour move with it.
2. Chip is gone mid-moment, and so is what he held: he is mid-word with his mouth open and one hand up in the frame
   before 04's cut, then the umbrella is on the ground and he is not there. Nothing of him dissolves; he is simply
   not in the next frame.
3. The counter jumps with its "+N" and the life bar loses a chunk (section 3).
4. Spud stays in the same screen position and the remote stays in the same place in the frame, within 20 px, so the
   cut is a match cut on the remote: the frame is the same, the world is not.
5. Spud's own state changes: in 09 he is middle-aged, in 11 old. His posture and the remote's dust do the rest.

Spud's eyes stay on the button through the cut for 4 frames, then lift to the new place: that is what reads as "it
worked". No whoosh, no glow, no light flash, no symbols. In 03 Chip blinks into the passenger seat at the start of
that panel (he is simply there when the shot opens, not fading in). In 05 it is the same lane from the same lens,
dry and sunny, and the puddle is gone: that comparison is the clearest single read in the clip, so hold 05 for
1.6 s with only the leaf moving.

## 8. The ending pose (20)

Money redo section 11 applies in full. Car-specific risks:
- The seats at x ±0.55 leave about 0.435 m between the two bodies (0.38 + 0.285 half widths), so a 12° lean cannot
  reach. Chip's seat must shift to x +0.30 for 18-20, or the pair sit on one bench seat. Default: shift the seat on
  the cut into 18, so no seat slides while on screen.
- A potato has no shoulder: Chip's crown lands on Spud's flank at y 0.46-0.58, measured from Spud's seat cushion,
  which with the raised passenger seat (y 0.345) is where Chip's head already is. If the raise and the lean fight,
  lower the seat to 0.30 and lean 14°.
- Spud's centre-side arm is exactly where the head lands: his hands go to the wheel at x -0.55 (shape `cup`), not
  into his lap, so the arm is out of the way and his elbow does not meet Chip's head.
- Overlap will be about 13 %, which needs an `allowClip` window: director's file.
- Chip's inner leaf must stay 0.15 clear of Spud's skin at eye height or `face-hidden` trips; rotate Chip 8° toward
  the lens first.
- Half-closed eyes at lid 0.45 trip `eyes-readable`: keep both at 0.3.
- The lean pivot slides the stance, so Chip gets +0.06 toward Spud (`stance-slide`).
- The hold is 1.8 s (story.md: hold the last shot 1.5-2 s), which is long enough to look dead: 2 blinks, one breath
  each, one leaf twitch at 1.1 s.
- Bench the seated pair in the car before anything else is built: the pose decides Chip's seat height, and the seat
  height decides the dash and the glove box.

## Builder tasks

One owner file each. Minutes are build time, lines are the new code in that file.

| # | Task | Owner file (new unless noted) | Min | Lines | Triangles | Proof still |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | Bench the seated pair: Chip seat height + lean, nothing else built | `storyboards/series/happiness/02-skip-remote/probe-carpose.mjs` | 40 | 90 | - | two-shot at 18's lens, overlap and leaf gap printed |
| T2 | The remote: clean, `press`, `dust`, `wipe` | `engine/page/props-skipremote.js` | 90 | 300 | 950 | front at 410 px, back at 430 px, dusty on the armrest |
| T3 | `spud-mid` + `spud-old` data | `characters/potatobrawl/spud-mid.json`, `spud-old.json` | 25 | 120 | - | three ages side by side at the same lens |
| T4 | Creases (mid + old) and the round glasses | `engine/page/costumes-skipage.js` | 80 | 260 | 400 | old face at 500 px, eyes readable through the lenses |
| T5 | The grey cardigan, old only | same file as T4 | 50 | 170 | 2.2k | 11's pose, patch and cuffs at 400 px |
| T6 | The `age` HUD part: chip, cake, life bar, "+N", roll-back | `engine/page/hud.js` (existing) + `storyboards/lib/overlay.mjs` (existing) | 70 | 190 | - | 25, 61, 82 and mid-roll-back frames |
| T7 | Car pieces on the rig: grille, lamps, wipers, crease, dash + glove box | `engine/page/props-skipcar.js` | 100 | 340 | 6k | glove box shut and open with the remote inside |
| T8 | Living-room dressing: floral couch cover, doily, sideboard | `engine/page/props-skiproom.js` | 45 | 150 | 3k | 11's wide shot |
| T9 | The box TV: cabinet, bulged screen, knobs, glow light | same file as T8 | 80 | 250 | 1.8k | 13 with a tile up, 11 dark |
| T10 | The two TV side scenes rendered to atlases | `storyboards/series/happiness/02-skip-remote/make-tv-feed.mjs` | 70 | 180 | - | both atlas sheets, 24 tiles each |
| T11 | `cottage` pumpkin off switch (3 hard-coded calls) | `engine/page/set-cottage.js` (existing) | 15 | 20 | - | 03 with no pumpkins |
| T12 | Snow behind the window pane for 10 (pane-clipped) | `engine/page/props-skiproom.js` | 35 | 110 | - | 10's window at 300 px |
| T13 | Umbrella (open + folded) and the loaf | `engine/page/props-skipremote.js` | 45 | 160 | 2.6k | 04 open in hand, 05 folded, 06 loaf on the head |
| T14 | Three paintings: old-lane rain + dry twin, bakery street, sunset avenue grade | `assets/environments/*` via `engine/plates/env.py` and the grade tool | 120 | - | - | one camera test per env, inside the safe range |
| T15 | The episode storyboard: 20 panels, cameras, cuts, keys | `storyboards/series/happiness/02-skip-remote/make-skip-remote.mjs` | 180 | 900 | - | all 20 panels as stills, then the clip |

Shared files that stay the director's: `grips.mjs` SIZE rows (remote, umbrella, loaf, cane), `props3d.js` registry
entries, `sets.js`, and every `allowClip` window.

## Open questions, with my default

1. Car handedness, since the sheet is both. [RHD: driver at -x, Chip at +x; 03 and 17 mirrored against the sheet.]
2. HUD above the captions, or the money redo's order. [HUD y 214-332, captions y 350-640; whichever episode ships
   first sets it for the series.]
3. The word "AGE" on the chip. [No word: cake icon, number, life bar. The first 3 s must read with no English.]
4. Painted new places vs the flat sets the brief lists. [Painted lane pair, bakery street and sunset avenue;
   `street` and `park` as the fallback if the paintings cost a round.]
5. The remote hand in 08, which the sheet draws as the right. [Left, as everywhere else.]
6. The turn-over in 12. [The prop rolls 180° on two flat palms; a cut 12a/12b if that fails one round.]
7. Cardigan patch side, which 11 and 15 draw right and 14 draws left. [Left elbow, matching his sweater.]
8. Chip's hood up in 04. [Hood down, umbrella does the rain; build hood-up only if T13 comes in under budget.]
9. The cane in 11. [Held in both hands, static; leaning on the sofa arm if the hold costs a round.]
10. The sun sliver above the roof in 20 against the car's direction in 19. [Follow the panel in 20, follow the
    direction in 19.]
11. The TV pictures. [Two baked side scenes as 24-tile atlases, not a live second camera.]
12. Chip's seat for the lean. [Raised to y 0.345 and shifted to x +0.30 on the cut into 18.]
13. The jam's cost at 11 `citycar` in 19. [Build 11; drop the 4 farthest to painted cars if the frame budget bites.]
