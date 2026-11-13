# EP09 "What if you could teleport?" (wedding rings): DESIGN of the new looks (13 Nov 2026)

Target: STORY.md (Jonny, 13 Nov), board.png (16 panels) and the director's amendment: the board's flower arch at the
FAR end stays as the ENTRANCE arch Mash walks through; a second, matching ALTAR arch stands at the front. Board
misses the build fixes: Chip is LEFT and Spud RIGHT in every altar shot (04, 07, 09, 13 swap them); ONE shelf (05
draws two). This file gives the numbers; builders build exactly these. Nothing here is a camera or an acting note.
Rules: pure functions of params and clip time (no Math.random, no clock); no letters or numerals on any prop;
realistic (no glow, sparkle, glint fx, impact star, speed line). Dust, veil, petals, spines, guests, chairs, runner
and rug are ghost (`userData.steam`, `solid: false`); dust has no ink outline and no shadow.
Reused, not designed here: Spud, Chip, Mash (files unchanged) · `hpbowtie` + one spec (3.3) · fx `flash`, fx `photo`
style "print" (6) · hud.js chip look (7) · recipes only: `hedge` (props-busstop.js), `casinoguest` face and skin,
creamTex / boardTex (set-hallway.js), `frontdoor` panels, `wallart` frame, the sprout leaf (costumes.js).
Checked, NOT reusable: `wallshelf` (books + pot built in) · `doorway` (daylight + point light; ours is shut) ·
`plankfloor` (not solid) · `selfieframe` (letters) · `ravenphoto` (pattern only) · `bowl` (sweets) · `carkeys` (a
car fob) · `coatstand` (the board has wall hooks).

Cast (a body starts 0.14 above the floor): Spud 0.76 w x 0.66 d, body top 1.02, leaf tip 1.20 · Chip 0.57 x 0.52,
top 0.67, leaves to 0.87 · Mash 0.54 x 0.50, top 1.38. Facing +z, a character's right hand is at -x.
Frame A (garden): `gardenaltar` at [0, 0, 0]. x right as the camera sees it (the camera stands on +z), y up, z
toward the camera. LAWN y 0, ALTAR LINE z 0, AISLE CENTRELINE x 0 running away to -z.
Frame B (hall): `ringhall` at [0, 0, 60] (cuts hide the distance); local numbers: origin on the floor at the middle
of the front door's threshold, the door wall is the plane z 0, the corridor runs to +z (the camera).

## 1. GARDEN (`gardenaltar`, `flowerarch` x 2, `weddingguest`; panels 01-04, 07-09, 13-15)

| Thing | Where (frame A) | Size |
|---|---|---|
| Lawn (solid ground) | x -20..20, z -26..14, y 0 | mown stripes 1.0 wide along z |
| ENTRANCE ARCH (`flowerarch`) | (0, 0, -10.95) | Mash at step 20 stands 0.30 in front of it |
| ALTAR ARCH (`flowerarch`) | (0, 0, 1.55), `on` 0 in every shot but the photo | hidden, it is "behind the camera" |
| Aisle runner | x -0.65..0.65, z -0.40..-11.9 | 0.006 thick, a fringed hem at z -0.40 |
| Chair rows k 1..6 | z = -2.15 - 1.5 (k - 1): -2.15 ... -9.65 | 4 a row, 24 in all, facing +z |
| Chair columns | x +-1.25 (aisle seat, c 1), x +-2.00 (c 2) | seat top y 0.30 |
| Back hedge + garden gate | z -13.5, x -9..-1.3 and 1.3..9 | h 1.10, d 0.7, gap 2.6 |
| Beyond the gate | path x -1.3..1.3, a meadow rising to y 2.0 at z -30 | pale, sunlit: it backs the far bride |
| Side hedges | x +-6.0, z -13.5..10 | h 1.25, d 0.7 |
| Trees (7) | (+-8.5, -16), (+-9, -9.5), (+-8.5, -3.5), (-8, 3) | trunk 3.0, crown r 2.2; NONE in x -4.5..4.5 |
| Sky dome | r 70, centre origin | zenith #6fb3e6, 40 degrees #a9d6f0, horizon #f6e7c4, 3 cumulus at the sides |

### 1.1 Anchors and the STEP SCALE
CHIP_SPOT (-0.48, 0, 0) · SPUD_SPOT (0.50, 0, 0): bodies 0.31 apart (a hand-off needs no step), both on lawn.
BRIDE(n) = (0, 0, -0.65 - 0.50 n), n = steps left: straight down the centreline, as on the board.

| n | 20 | 18 | 15 | 12 | 9 | 6 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|
| z | -10.65 | -9.65 | -8.15 | -6.65 | -5.15 | -3.65 | -2.15 | -1.65 | -1.15 | -0.65 |
| abreast of | entrance arch | row 6 | row 5 | row 4 | row 3 | row 2 | row 1 | | | behind the gap between Chip and Spud |

- The ruler: a chair row every 3 steps (row k = step 3k). Step 0 is panel 15's triangle: Mash centre and behind,
  Chip front-left, Spud front-right (0.18 clear of both). TIE_HANG (0.50, 0.47, 0.335); the box hangs at about
  (0.50, 0.50, 0.42) (section 5).
- Far end at phone size: lens 4.5 m in front of the altar line, Spud 500 px tall: Mash at step 20 is about 230 px
  tall at 1080 (77 px on a 360 px phone), dark with a white veil, inside the 520 px arch, the bright gate behind.
- PHOTO spots (panel 15, after the insert): Chip (-0.48, 0, 2.20), Spud (0.50, 0, 2.20), Mash (0, 0, 1.55) under
  the altar arch, `on` 1: the arch behind the group, guests and aisle behind it, the sun on the faces.
- SEAT(side, k, c) = (side x (1.25 + 0.75 (c - 1)), 0, -2.15 - 1.5 (k - 1)), the floor under the chair; side -1 =
  camera-left. Hero seats (turn + gasp): R1a (1.25, -2.15), L1a (-1.25, -2.15), R1b (2.00, -2.15). Straight down
  the aisle only the aisle shows between the two leads: pick hero seats by the lens.
- SIGHT LINES the set is built for: from 7 to 15 degrees to Chip's side of the aisle axis (lens x about -0.12 z to
  -0.27 z), height <= 0.9, the bride and the entrance arch stand over little Chip, she never crosses Spud's crown,
  and the 0.4 m over his body top is sky only (guests top out at 1.00, the back hedge at 1.10). Straight on, the
  entrance arch's right leg sits behind his crown: leaf and bald dome both read worse.

### 1.2 `flowerarch` (one build, placed twice)
Origin: the ground under the middle of its front frame; faces +z, the rear frame 0.45 behind. Opening 2.00 wide;
each side a lattice panel 0.35 wide between posts 0.07 square at |x| 1.00 and 1.35; spring line y 1.60; two round
hoops r 1.00 and 1.35 joined by 9 rungs (crown 2.60 inside, 2.95 outside); 7 slats join front and rear. Paint
#f7f3ea, shade #cfd6e2. Posts solid, the rest ghost. Param on 1 (0 hides it and its shadow).
Flowers on both faces: a 0.40 band along the outer hoop from spring to spring (38 clusters of 4 blossoms r
0.05-0.08 + 3 leaves), 3 small clusters down each side panel at y 0.9, 1.2, 1.5; bare white below 0.8. Blossoms
55 % white #fdfbf5 (shade #e6dfd2), 25 % blush #f3b6c4, 12 % rose #e58fb0, 8 % cream #f6e3a1; foliage #3f7a3c,
#5d9a4a. ONE instanced mesh. With flowers 3.15 tall: 2.3 x the bride, as on the board.

### 1.3 Dressing and guests
- Chairs: white wooden folding chair, seat 0.40 x 0.36 at y 0.30, slat back to 0.70, X legs; #f6f2ea, shade
  #c9cfdb; ONE merged mesh. Aisle posy: 2 white + 1 blush blossom, two blush ribbon tails 0.15.
- Runner: woven off-white #f1e6cf, shade #d9cbb0, edge band 0.06 #e3cfa8, 7 drawn cross wrinkles #cdbb9a, fringe
  0.05, 40 petals 0.03 (white, blush) densest at z > -3. Lawn #8fc65a, shade #5f9a45, stripes +-6 %, seeded tufts
  #a9d76a, 30 white clover dots at z > -1.5, no tiling. Path #efe2c4, meadow #b9d77e.
- Hedges: the `hedge` recipe at 10 clumps a metre (r 0.10-0.20), #2f5a2c / #3f7236 / tips #5d8f45, ONE merged
  mesh. Trees: trunk #7a5a3c, crown 5 clustered spheres #4f8f45, shade #3b7a3c, sunlit #7fb65a, rim #c9d76a.
  Suggested look: late sun from (-0.5, 0.7, 0.5) #ffe2b0, fill #bcd9f2, ground #cfe3a0, 1.6 : 1, shadows 40 %.
- `weddingguest`, a seated potato. Origin: the floor under its chair. Body 0.56 w x 0.56 h x 0.50 d on the seat
  (top y 0.86, hat or leaf to 1.00), skin #e2a95c, `casinoguest`'s face on +z, nothing on the back. Spec: size 1
  (0.9-1.1), stand false (true: on its feet, for the photo), dress "jacket" (lapels, a straight tie, NEVER a bow
  tie) | "dress" (round collar, 3 buttons), color, hat 0 (one leaf) | 1 (fedora #7a5536, band #3a2a20) | 2 (flat
  cap #8a8580) | 3 (straw #e9d7a0, brim 0.44), glasses false (round wire rims). Params: turn 0 (degrees; 0 faces
  the altar, +-150 looks back up the aisle, the whole guest swivels), gasp 0 (0..1: mouth an O 0.05 across, eyes
  x 1.3, brows up 0.012, gloves to the cheeks above 0.5, 6 degrees back), cheer 0 (0..1: arms up, wide smile),
  sway 0 (0..1: 3 degrees, phase from the id).
- 14 guests in the board's smart darks: rows 1-2 full, then R3a, L3a, L3b, R4b, L4a, R5a. Jackets #34466b,
  #6b4a36, #6f7044, #5d3f5f, #5f6f86, ONE #7a2f3a (L1b, away from the red box); dresses #c98a8f, #a892c0, #9fb78a;
  hats mixed, two with glasses. R1a: jacket #34466b, leaf, glasses. Nobody in teal, yellow, charcoal grey, white,
  black or bright red; nobody without a leaf or a hat.

## 2. HALLWAY (`ringhall`, panels 05, 06, 10-12, 16): a corridor, the front door at its end

| Thing | Where (frame B) | Size, colour |
|---|---|---|
| Door wall, side walls | z 0; x +-1.2, z 0..5.2; y 0..2.4 | cream #f3e4c6 mottled (creamTex), wooden skirting 0.10 #8a5a34; camera side open; walls and ceiling cast no shadow |
| Ceiling | y 2.4, #f6ecd8 | one beam 0.12 x 0.14 #8a5a34 across at z 2.9 |
| Floor (solid slab) | x -1.2..1.2, z 0..5.2, top y 0 | boards 0.20 wide running along z, honey #c48c54 (boardTex) |
| FRONT DOOR (built in, shut) | x -0.45..0.45, y 0..1.85 | 4 raised panels #a8703c, casing 0.09 #8a5a34, brass knob (0.33, 0.92); transom 0.90 x 0.28, 2 x 4 panes #dff0f4 emissive 0.6; unlit brass lantern (0.78, 1.62) |
| RUG | x -0.55..0.55, z 0.25..1.05 | woven, field #8fa3ad, border #c9a26a with two lines #6b4a36, 0.008 thick |
| COAT HOOKS | LEFT wall, rail z 0.40..1.10 at y 1.15 | 3 brass hooks: a navy coat #34466b (0.60 long), a brown scarf #6b4a36, one empty |
| SHELF | RIGHT wall: x 0.90..1.20, z 1.22..2.50, top y 0.50 | plank 0.04, wood #9a6236, edge #7a4a28, corbels at z 1.45 and 2.27 |
| On it, door side to camera side | KEY BOWL (1.07, 0.50, 1.38) · CACTUS (1.06, 0.50, 1.68) · FREE SPOT (1.05, 0.50, 1.97) · PHOTO (1.11, 0.50, 2.30) | |
| Window light (painted, additive #ffe6b0 at 0.35, a skewed 2 x 3 pane shape) | right wall z 1.3..2.7, y 0.75..1.65; floor x -0.3..0.8, z 2.8..4.0 | never on the ring spin spot |

Anchors: SPUD_SHELF (0.40, 0, 1.80): facing the camera the shelf is at his left glove, chest height; the glove tops
out at x 1.12, past the nearest spine tip (0.935, 0.66, 1.68) · RING_SHELF = LEAF_LAND = the FREE SPOT (free area
x 0.92..1.18, z 1.83..2.11) · LEAF_FROM (0.40, 1.02, 1.80) · RING_SPIN on the floor: A (0.20, 0, 2.15), B (0.52,
0, 2.30) · CLEAR FLOOR x -1.0..0.85, z 1.2..5.2 · BARE WALL: nothing on the door wall in x 0.55..1.2 below y 1.5
(seen down the corridor it is behind his head: the leaf reads green on cream).
- Cactus (board 11): terracotta pot #c9673e, rim #d98458, 0.11 across, 0.085 tall, soil #5a3d2a. Body an egg 0.15
  across x 0.17 tall, centre y 0.66; #4f9a4a, 10 ribs (grooves #3a7a3c, ridges #6fb85a). 50 spines, one per
  areole (10 ribs x 5): 0.050 long, 0.006 at the base, cream #fff1c9 to a tip #c98a3a, along the normal +-10
  degrees (hashed). Spines ghost; body and pot solid.
- Key bowl: dark walnut #5a3f2a, rim #8a6238, 0.14 across x 0.05; 3 SILVER keys #c7ccd3 on a steel ring over the
  rim. Nothing gold in the hall but the rings.
- Photo: a frame 0.30 x 0.38 (wood 0.035 #8a5a34, bevel #a8703c) standing on the shelf, leaning back 10 degrees,
  its face turned 40 degrees from the corridor toward the camera. Picture 0.23 x 0.31: a flat plane 0.012 in
  front of the backing, ONE 480 x 640 canvas, no shadow, no glare: ground #bfe0e2 to #dcefe0; Spud's bust: golden
  body #e2a95c (shade #c98a45) from 42 % down, teal rolled collar #2f8f8a across the bottom 22 %, round eyes
  #2a1608 with a catch light, blush #ff8f8f, a wide smile, ink #5a3a22 at 5 px. THE LEAF #6cbf3a (rib #4b8629, ink
  #2f6a22) on top, 24 % of the picture's height, 6 % of clear ground round it: the sharpest shape in the picture.

## 3. SMALL PROPS (usage header per kind; +z is a prop's front)

### 3.1 `ringbox` (board 02, 08)
Origin: bottom centre. Front (+z) = the side it opens to; hinge = the base's top back edge (y 0.070, z -0.075).
Base 0.18 x 0.070 x 0.15, lid 0.18 x 0.065 x 0.15 crowned 0.015, corners r 0.022: 0.135 tall shut. Velvet #8e1b2b,
shade #5e0f1c, a lighter 0.01 band #b33a4c on every outside edge; a gold line 0.004 #e3b23c on both rims, a clasp
0.016 x 0.012 in front. Inside all velvet, as the board: lid lining #6a1220, cushion top y 0.055 #7a1626, ONE
valley 0.12 x 0.035 #3a0710 (the empty slot of the insert). Solid; body = a box.
Params: lid 0 (0..1 = 0..105 degrees), rings 0 (0 | 1 | 2 rings of 3.2 standing in the valley at x +-0.028,
z +-0.012, left first, leaning back 35 degrees, lowest point y 0.022, top y 0.118: 9 mm under the shut lid).
Grip: SIZE ringbox { w: 0.18, h: 0.07, d: 0.15, r: 0.08 }: box hold on the BASE's two short ends (never the lid);
one hand = mug hold from behind at half the base's height; presented = a flat palm under it.

### 3.2 `goldring` (a wide plain band, board 06, 14)
Origin: its centre. Outer radius 0.048 (0.096 across, as big as a glove), wall 0.012 (hole 0.072), 0.030 wide,
edges rounded 0.004. At rest it lies flat (axis +y, centre 0.015 above the surface); spec.up builds it standing.
spec.n 2 = the pair as ONE prop (origin the surface under its middle), spec.pose "lean" (shelf, palm: ring A flat
at (-0.022, 0.015, 0), ring B leaning on it at 60 degrees, centre (0.030, 0.049, -0.005)) | "link" (in a glove,
board 10: both standing, holes to +z, centres (-0.026, 0.048, 0.016) and (0.026, 0.048, -0.016)).
Gold #f6c21c, shade #c98a12, a fixed painted pale band #fff3b0 on the upper outer quarter, emissive #7a5200 at
0.25, ink #7a4a00 (brown: the loop never closes into a black blob at 360 px).
Param spin -1 (seconds since touchdown; below 0 = at rest). Spec T 2.2, a0 38, turns 9, seed (0.13 and 0.61 for
the two). With u = clamp(spin / T): tilt from the floor = a0 x min(1, spin / 0.10) x (1 - u)^0.6 degrees (one edge
kicks up in 3 frames, then sinks); the tilt's direction turns by 360 x (seed + turns x (1 - (1 - u)^0.5)) degrees
(2 turns a second at first, faster as it flattens: a ring rattling flat on wood); the rim's lowest point stays on
the floor: centre y = 0.015 cos(tilt) + 0.048 sin(tilt), circling 0.048 (1 - cos(tilt)) off its rest spot.
Drop body { shape: "box", bounce: 0.2, friction: 0.9 }: it lands flat near where it hung; the director starts
`spin` on the landing frame. Grip: SIZE goldring { len: -0.08, r: 0.015 } (thin pinch at the rim, as `coin`).

### 3.3 Bow tie: `hpbowtie` reused with ONE new spec
New: spec.color (and spec.sheen). With color set: no stripe map, no emissive map; lobes #201e26, a satin streak
#585466 along each lobe's upper third, knot #17151c, ink #0e0d12. Without it the rainbow tie draws exactly as now.
Ours: scale 0.56 = 0.20 wide x 0.095 tall (the board's small tie), lobes 0.025 thick, knot 0.039 x 0.053 x 0.055.
Two props: `tieWorn` { wear: "spud", x 0, y 0.47, z 0.335 } (knot on the collar roll, top edge at least 0.03 under
the mouth; nudge on the bench) and `tieLoose` (no wear; body = a box 0.20 x 0.095 x 0.05). Grip: new SIZE
hpbowtie for scale 0.56: a fist behind the knot, lobes out both sides (mug hold, r 0.028, h 0.053; the origin is
the knot's centre, so heights run -0.027..0.027). Proof: make-grip-tests.mjs.

### 3.4 `flowerpin` (worn: wear "chip"), `bouquet`, `bridalveil` (worn: wear "mash")
- Pin: a five-petal daisy 0.09 across, 0.02 thick: round petals #fdfbf5 (shade #e6dfd2), centre #f2b632 0.024,
  one leaf #5d9a4a 0.05 behind it, ink #6a5a48. On the yellow of his LEFT chest (+x), about (0.14, 0.33, 0.235) in
  his frame: left of the left drawstring, 0.02 under the cowl roll, clear of the face.
- Bouquet. Origin: the handle's bottom. Handle 0.09 long, r 0.016, white ribbon wrap; on top a round dome 0.20
  across x 0.13: 12 daisies r 0.028 (#fdfbf5, centres #f2b632), a ring of leaves #3f7a3c / #5d9a4a. 0.22 tall.
  Grip: SIZE bouquet { r: 0.016, h: 0.09 } (one fist on the handle, the other glove under it).
- Veil (x 0, y 0, z 0; numbers in her frame, spec.body [0.54, 1.24, 0.50]): from the crown (0, 1.37, -0.03),
  behind her leaf (unchanged), one sheet falls over both sides and down the back, 0.03 off the body. Half-width
  0.10 at y 1.37, then the body's half-width + 0.03 at y 1.10 growing to + 0.16 at the hem (0.43 at y 0.28): from
  the front a white edge beside the head widening to the knees (board 09, 15). Its front edges never pass the
  plane z -0.02: face, leaf and headphone cups stay clear. 6 soft folds; a lace band 0.035 along both front
  edges and the hem (scallops 0.03, one row of dot holes #d9dfe8). Opaque cel cloth #fbf7ef, shade #d9dfe8, ink
  #9aa3b5 (it stays white at 77 px). Hem flutter 1.5 degrees at 0.9 Hz; param swing 0 (-1..1 = +-6 degrees).

### 3.5 `spudleaf`
spud.json's sprout as a loose prop: stem 0.07 (r 0.012-0.016) + ONE leaf 0.15 long, 0.11 wide, 0.014 thick
(costumes.js leafGeometry(0.056, 0.15, 0.014) with its midrib), #6cbf3a, rib #4b8629. Origin: the stem's base.
Spec from, to (world; default LEAF_FROM, LEAF_LAND), staged "a leaf on the air". Param fall 0 (0..1, linear over
1.6 s after the 3-frame hang). At 0 it stands exactly as on his head (leaf turn -0.15, 0.25, -0.5 rad): no pop.
place = lerp(from, to, fall) + 0.07 sin(2 pi 2.5 fall)(1 - fall) across its path + 0.10 sin(pi fall) toward the
camera; height = from.y + (to.y - from.y)(fall - 0.028 sin(4 pi 2.5 fall)(1 - fall)) (it stalls at each swing's
end, never rises); it rolls 35 sin(2 pi 2.5 fall)(1 - fall) degrees into each slide and turns 200 x fall degrees;
over the last 15 % it lays over. At 1 it lies flat on the shelf 0.007 up, rib up, tip toward the photo (board 16).

## 4. BALD SPUD
New file characters/what-if/spud-bald.json = spud.json with `"sprout": { "color": "#6cbf3a", "placement": "none" }`.
costumes.js already hides the sprout for placement "none": no field to add, no engine change; body seed 29 and the
sweater are untouched, so the outline under the crown is identical. Both are cast; the swap hides in the
hall-to-altar cut (in the hall `spudleaf` takes over on the vanish frame). Check on a side-by-side still of spud
and spud-bald at 360 px wide, before any staging: 1. same potato at a glance: teal #2f8f8a over at least half of
what shows, the collar roll under the face; 2. his figure ends at 1.02, not 1.20: at least 60 px (at 1080) of
plain sky over the dome (the sight lines of 1.1), never arch flowers or a tree crown; 3. the dome never cropped,
no caption or chip within 40 px; 4. Chip's and Mash's leaves in the same frame (everyone has one but him).

## 5. THE JUMP (the same look four times; frames at 30 fps, frame 0 = gone)
Leaving: frames -2, -1 squash 0.22, feet on the ground · frame 0 Spud hidden (no fade, no scale, no flash, no
shake), the left-behind prop in the air at its exact last pose, `dustring` starts · frames 0..2 the prop hangs
(one blink) · from frame 3 it falls from rest under gravity (physics): 0.47 m takes 0.31 s, straight down unless
the director aims it. Arriving: frame 0 Spud is there, already squashed 0.16, back to 0 over 6 frames (settle),
feet down, a small `dustring`. Never two Spuds in one frame.
Left behind: jump 1 altar `tieLoose` at TIE_HANG · jump 2 hall two `goldring` at the box's slots, about
(0.45, 0.55, 2.20) (`ringbox.rings` 2 -> 0 on that frame) · jump 3 altar `ringbox` shut · jump 4 hall `spudleaf`.
`dustring` (new: the board's ring of round puffs on the ground; poof can't stay flat, its puffs rise to 0.6 m and
would veil the thing hanging at 0.47). Origin: the ground under his feet. n soft round sprites on a ring (angle
i / n x 360 + hash x 8 degrees, radius x 0.92-1.08). Param puff 0 (0..1, linear): radius r0 -> r1 as
(1 - e^(-4 puff)) / (1 - e^-4), size s0 -> s1, centre height 0.04 -> 0.09, alpha a x min(1, puff x 8) x
(1 - puff)^1.5; nothing above y 0.20. Leaving: n 14, r 0.30 -> 0.60, size 0.12 -> 0.22, a 0.70, 0.50 s.
Arriving: n 10, r 0.20 -> 0.42, size 0.09 -> 0.16, a 0.50, 0.35 s. Lawn: cream #efe3c6, shade #d9cba8; boards
#f3eada. Fallback if it is not built in time: `{ fx: "poof", pos: [x, 0.02, z], dur: 0.45, color, puffs: 10,
sparks: 0, size: 0.28, lift: 0.04 }` (landDust's call, smaller; landDust itself for arrivals with puffs 6).

## 6. THE WEDDING PHOTO (41.0 s): reused, no engine addition
`{ fx: "flash", at: 41.0, dur: 0.2, peak: 0.8, color: "#ffffff" }` (1 frame at 0.8, gone in 6; never full white) +
`{ fx: "photo", style: "print", at: 41.0, shot: 41.0, dur: 2.0, aspect: 1.25, w: 980, pos: [540, 950], tilt: -2.5,
dim: 0.6, develop: 0.2, push: 0.03, cam: <the director's photo camera> }`: a print with a white border drops in
over the dimmed scene; its picture is the middle 1080 x 1350 of that camera's frame, frozen at 41.0. Card y
300..1600, picture x 94..986, y 344..1459, no letters. Keep Spud's dome left of x 920 and above y 1000 in the
print; the cast holds still under it; guests `cheer` 1.

## 7. THE COUNTER (new opt-in HUD part `steps`, engine/page/hud.js)
`"hud": { "steps": { "keys": [[t, n, dur?], ...], "pulse": [24, 31] }, "show": [0, 41] }`; it shows round(value),
and the generator puts Mash on BRIDE(value) from the SAME keys, so number and bride can't drift apart.
- Box [704, 214, 204, 96] px: x 704..908, y 214..310, top right of the safe zone, radius 26, fill
  rgba(18,16,24,0.66), edge rgba(255,255,255,0.16) 2 px (the HUD chip, 26 px taller).
- Icon: two shoe prints (each a sole 16 x 30 + a heel 14 x 12, turned +-12 degrees, 14 px apart in height) in a
  58 px box at x 728..786. Number: 900 68px "CapBlack" (23 px on a 360 px phone), right-aligned in two fixed
  digit cells ending at x 884, so 9 never jiggles.
- Colour of icon + number: #fff8ec; n <= 6 #ffb02e; n <= 3 #ff4d4d. Each drop: the chip kicks up 5 px for 0.20 s.
- Pulse (24-31 s), k = fract((t - 24) / 0.5): scale 1 + 0.14 sin(pi min(1, k / 0.36)) about (806, 262); a ring
  #ff4d4d 6 px wide round the chip growing 16 px x k, alpha 0.85 (1 - k); fill rgba(60,14,18,0.78).
- Captions and the NO RINGS text: centred, top edge at y >= 342, bottom at y <= 640. No face inside the box.

## 8. BUILD TASKS (disjoint files; the director wires props3d.js; every proof still also 360 px wide)
T1, the two places: new engine/page/props-wedding-set.js (`gardenaltar`, `flowerarch`, `weddingguest`,
`ringhall`; exports the anchors, BRIDE(n), SEAT). Reuses the recipes named at the top, changes none of those
files. Proof, grey boxes at the cast sizes: the altar from (-0.8, 0.8, 5.5) with a Mash box at steps 20, 12, 6, 3,
1, 0; the photo spots with the altar arch on; guests turn 0 / 150, gasp 0 / 1, cheer 1; the corridor with a Spud
box at SPUD_SHELF; the shelf close (spines and the photo's leaf read at 360 px).
T2, hand props and wearables: new engine/page/props-wedding.js (`ringbox`, `goldring`, `flowerpin`, `bouquet`,
`bridalveil`, `spudleaf`, `dustring`), new characters/what-if/spud-bald.json, SIZE entries in
storyboards/lib/grips.mjs (ringbox, goldring, bouquet, hpbowtie). Proof: box lid 0 / 1 x rings 0 / 2 (empty vs two
rings told apart at 360 px); 12 fps strips of `spin`, `fall` and `dustring` (a tie hanging at 0.47 over it); both
pair poses in a Spud glove; the veil front, 3/4, back and at 77 px tall; spud beside spud-bald.
T3, engine (senior builder; qa/golden.mjs unchanged): `steps` in engine/page/hud.js + its pass-through in
storyboards/lib/overlay.mjs; spec.color in engine/page/props-hotpotato.js (if that file has another owner today,
T2 copies the lobes into props-wedding.js as `bowtie`). Proof: the chip at 20, 6, 3 (mid-pulse), 0; the black tie
on Spud beside the untouched rainbow one.

## 9. OPEN QUESTIONS (defaults in force unless the director says otherwise)
1. The altar arch in the photo. Default: it sits 1.55 m on the camera side of the altar line, hidden (`on` 0) in
   the wides; for panel 15 the trio stands at the PHOTO spots in front of it, the lens still on +z (Chip left,
   Spud right, guests behind, sun on the faces). A reverse angle from the aisle would mirror Chip and Spud.
2. One counted step = 0.50 m of aisle (10 m in all). Mash's feet take about 4 small footfalls for each (the
   gait's cycle tops out at 0.44 m), so the counter measures distance, not footfalls. Default: accept.
3. Photo as a print card (section 6) or a full-frame `freeze` (it lengthens the video clock). Default: print.
4. Bald dome: plain, as the board. If check 2 of section 4 fails at 360 px, add a stem scar (a dot r 0.012,
   #b9843f) on the crown. Default: plain.
5. Catching the tie and the box: both fall straight down 0.45 m beyond Chip's reach (his glove ends at x 0.05).
   Default: Chip takes one 0.40 m step toward Spud's spot; the fall stays vertical.
