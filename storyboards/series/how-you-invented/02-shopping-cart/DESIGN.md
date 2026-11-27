# How you invented 02 "The shopping cart": design of the new pieces

Creative director, 27 Nov 2026. Target: the approved 15-panel sheet `shopping-cart-panels-v1.png` (opened and read panel by panel), `OUTLINE.md` (M1 H1 E1 L2), `panels-prompt.txt`, `lines.mjs` and the measured lengths in `lines.json` (voices x1.15, 30.48 s of speech). Cast sizes are read from `characters/potatobrawl/spud.json`, `mash.json` and `characters/always-orders-potatoes/viking.json` (episode 1's boss: copper locks and fur mantle, no horned helmet), legs 0.14 under every body; kit sizes from the kit headers. **Nothing here is rendered**: every reach, clearance and pixel is hand-worked, so the director fits all cameras in ONE `qa/camfit.mjs` batch and the builders prove each piece on a bench (section 6). Metres, +z toward the camera, +x screen right, yaw 0 = facing +z and + = toward +x, hex colours, px at 1080 x 1920. No letter and no digit anywhere in the picture, no impact marks, motion lines, sparks or sweat drops (the sheet draws them in 05, 09, 14: left out). In the three new files: no `Math.random`, no clock, every mark drawn once from a fixed table, things appear by visibility or scale, never by a tweened opacity. No shell in this run, so `tools/vocab.mjs` was not run: reuse was checked against `docs/VOCAB.md` and the kit headers; the director runs `--find` on the twelve new names before step 0.

**Caption band assumed**: `captionBand [210, 640]`, subtitle box top at y 300, two lines to about y 480. Every eye and mouth in section 0 sits at y 700 or lower; only sky, roofs, the awning, leaves, a crown, the tower, raised legs and the coin may stand in the band.

**The three facts that shape everything**
1. A 9:16 frame is only 2.2 to 2.7 m wide at 4.5 m. So the street does NOT run across the picture: it falls straight away from the lens (toward -z) beside the shop, and fills the frame's height.
2. A potato's face is on its body. A push or a ride is only readable when the heading is within about 55 degrees of the lens, and after a forward flip the face points BACK. So the brake ride (10) goes away from the lens toward the hill and Spud lands upside down facing us; Mash rides the stolen cart sitting backwards, face to us, while it rolls front first downhill.
3. All feet stay on y 0. The hill is ONE street kind used twice: instance 1 with the shop's forecourt at y 0 (the top), instance 2 turned 180 degrees and lifted so the yard at the foot is at y 0 (the bottom, parked at x +60). Nobody ever walks on the slope: on it, bodies only ride a cart.

## 0. Cameras (tries: one camfit batch, then one layout run)

Every shot has a push (the `to` column) or a move of its own. `f` = fov. Px are estimates within about 60 px (80 px in C08b).

| Shot (panel) | pos -> look, f | push to (over the shot) | What it sees (px) |
|---|---|---|---|
| C01 (01) | (-3.35, 1.35, 5.60) -> (-3.50, 0.62, 1.20), 40 | pos (-3.33, 1.25, 5.10) | Spud in the door, armful to his chin: eyes (337, 987), leaf y 680, body x 40 to 560. Mash leaning on the door post: eyes (794, 829), crown y 513. The orange is caught at (640, 1250). Door top y 306, awning above |
| C02 (02) | (-3.05, 1.20, 4.60) -> (-3.15, 0.78, 1.30), 44 | pos (-3.07, 1.15, 4.15) | Mash: eyes (606, 906), mouth and orange (606, 1023), the orange 66 px, crown y 533. Spud low left over his armful: eyes (240, 1184). Peel on the bench's left end (1002, 1260) |
| C03 (03) | (-3.10, 0.45, 5.60) -> (-3.15, 1.25, 2.20), 50 | pos (-3.10, 0.42, 5.20) | low. Spud: eyes (252, 1241); the tower over him to y 100, leaning to x 420 before the cut (it crosses the band: no face). Mash standing behind right: eyes (594, 1234). Peel pile (868, 1490) |
| C04 (04) | (-3.20, 1.55, 6.30) -> (-3.45, 1.00, 2.70), 44 | pos (-3.25, 1.45, 5.80) | the heap fills the width, top y 1206, foot y 1660. Mash sitting on it, sunk 0.12: eyes (520, 831), crown y 485 (caption `pos` 250 here). Spud's leaf (664, 1277) and one waving glove (896, 1370) |
| C05 (05, restaged) | (-3.25, 1.05, 5.70) -> (-3.40, 0.60, 2.70), 42 | f 38 | Spud three quarters: eyes (598, 893). The basket beside him, 0.36 nearer: its handle top and both gloves at (833, 970), lifted to y 857, 235 px right of his eyes. The snap is at (833, 857) |
| C06 (06) | (-2.75, 1.45, 6.60) -> (-2.95, 0.55, 2.30), 48 | pos (-2.80, 1.35, 6.10) | Spud hopping: eyes (219, 947), 879 at the top of a hop. Basket on its side (465, 1265). Mash crouched, scooping: eyes (578, 915). Bench pile behind right (936, 885), 240 px wide |
| C07a (07, insert) | (-2.20, 0.40, 4.70) -> (-3.02, 0.24, 2.45), 34 | f 31 | the wheeled chair fills 810 px of width, wheels 157 px across at y 1195, the seat at y 960; the basket settles onto the seat. No face |
| C07b (07) | (-0.45, 1.45, 5.80) -> (-2.10, 0.85, 2.30), 44 | look (-1.85, 0.85, 2.40) | Spud pushes toward the lens side: eyes from (160, 1008) to (729, 1125). Pile on the bench (649, 1017). Mash sitting on the bench's right half: eyes (963, 818), a quarter cropped |
| C08a (08) | (2.35, 3.60, 4.20) -> (1.85, -2.20, -9.00), 50 | none (the cart is the move) | high, down the street. The lip y 1582 (the street 1008 px wide there), the foot of the hill y 800 (198 px wide), the hay cart far below (636, 634 to 725), 140 px wide. The cart with Spud trailing shrinks from 388 px/m at the lip to about 150 px/m at the cut (8.7 m down, near y 1060). Sky from y 450 up |
| C08b (08, reverse) | tracks 2.6 m ahead of the cart, 0.55 over the cobbles: (60.25, 2.82, -11.12) -> (60.00, 3.65, -13.64), 46 | pos (60.25, 0.89, -3.36), look (60.00, 1.72, -5.88), linear | low, looking up the hill; houses stream past. Basket (560, 1130), Spud's eyes about (500, 760), mouth (500, 850). Food rises out through the band |
| C09 (09) | (60.25, 1.30, 6.40) -> (60.05, 1.15, 1.10), 50 | pos (60.22, 1.28, 5.90) | hay cart left, cropped: bed top y 1162, hay top y 922. Spud's legs up out of it (350, 712). Mash: eyes (827, 1090), the hood sack held out to his side, mouth (650, 1230). The street climbs behind them from y 1242 to the shop at y 625 |
| C10a (10, insert) | (2.60, 0.50, 5.95) -> (1.47, 0.16, 4.50), 36 | f 33 | the brake: wheel (560, 1120), 190 px across; block (560, 1010); pedal (333, 786). No face |
| C10b (10) | (0.80, 1.35, 6.40) -> (1.25, 0.70, 3.60), 44 | follows for 1.4 s to pos (0.85, 1.25, 3.40), look (1.25, 0.75, 0.55), then holds | from behind: Spud rides away toward the lip. After the flip he is upside down in the basket facing us: eyes (587, 1026), mouth (587, 885), legs up to y 375, thumb (945, 960). Brake at the near wheel (801, 1581). Valley and roofs behind |
| C11 (11) | (0.95, 1.60, 5.15) -> (-0.14, 0.97, -0.72), 56 | f 52 | three columns. The Viking behind his counter: eyes (248, 1172), locks top y 818. Spud's back: x 344 to 787, y 1115 to 1686. Mash rolling away: eyes (950, 1004) to (917, 1096) to (899, 1147), 367 px tall down to 120 |
| C12a (12, wide) | (2.05, 1.50, 6.60) -> (-2.20, 0.60, 1.20), 46 | a pan: look to (0.45, 0.40, 2.20) in 1.0 s, then pos (1.95, 1.45, 6.20) | opens on the bench pile at its biggest (about 190 x 310 px at the centre), pans right to the chained row: it runs runs from the first chair (614, 1150) back right to the last (908, 900). Spud left at the first chair: eyes (126, 1080), a quarter cropped |
| C12b (12) | (1.55, 1.05, 5.60) -> (0.62, 0.55, 3.50), 34 | f 31 | the lock box (720, 1030), 134 px; the coin 134 px; the chain hangs away to (900, 1150). Spud: eyes (240, 806) |
| C13 (13) | (2.30, 1.30, 1.20) -> (1.05, 0.72, 3.00), 42 | pos (2.20, 1.28, 1.40) | from the hill side, looking back. Mash behind the chair: eyes (458, 797), crown y 223 (no line in this shot), gloves on the rail (661, 1222), pocket (470, 1160). The taut chain leaves lower right. Spud grinning behind right: eyes (880, 830) |
| C14 (14) | (-0.25, 0.88, 6.45) -> (-0.50, 0.88, 4.10), 34 | f 32 | close. Spud: eyes (331, 1254), mouth (331, 1486). The coin over his raised left glove (861, 610), 146 px, its top at y 537; it falls down the right side and is still in frame at the cut |
| C15a (15) | (0.05, 0.40, 6.55) -> (0.05, 0.70, 4.30), 40 | pos (0.05, 0.40, 6.25) | low, the mirror of C01. The catch (264, 1631). Mash crouched: eyes (775, 1059), mouth (775, 1257), crown y 502. Spud's side at the left edge |
| C15b (15, insert) | (1.45, 0.95, 4.60) -> (0.78, 0.52, 2.90), 32 | none (0.4 s) | lock box at (540, 960), 178 px; coin in, chain out. No face |
| C15c (15) | (-0.75, 1.70, 7.30) -> (1.00, 0.60, -2.00), 50 | none (0.6 s) | Spud low left, cropped as drawn: eyes (210, 1438). Mash rolling away with the coin up: eyes (812, 967) to (626, 1045), the lip at y 1172 (he sinks behind it). Row tops at y 1120 to 1167 |

## 1. The sets: set `plain`, `color "#9fd0ef"`, `floor "none"`, built from section 2

Bright morning, one grade for the whole film `{ tint: "#fff1d6", s: 1.05 }`, sky `#9fd0ef` to `#dff0fa` at the horizon, 6 cloud cards.

**The top (instance 1 of `hillstreet`, at the world origin)**

| Part | Numbers |
|---|---|
| Forecourt | flat cobbles y 0, x -7.5 to 6.5, z 0 to 9.5 (and z 0 to 0.90 left of the street) |
| Street | 2.6 wide, x 0.55 to 3.15, centre line x 1.85. The lip is the line z 0. From there it falls 14 degrees toward -z: y = 0.2493 z. 22 m long on the slope: its foot at z -21.35, y -5.32 |
| Yard at the foot | flat at y -5.32, z -21.35 to -30.85, x -2.5 to 6.2. Hay cart at (2.65, -5.32, -24.35) |
| Shop front (`grocerfront`) | wall plane z 0.90, facing +z. Wooden shop x -5.80 to -2.60; stone annex x -2.60 to 0.30; corner at x 0.30, side wall along x 0.30 back to z -4.0 on a stone footing that grows as the ground falls |
| Door | opening x -4.45 to -3.35 (centre -3.90), 1.72 high, leaf open inward |
| Bench | x -2.66 to -1.36, seat top 0.30, z 0.96 to 1.36. Left half = the stolen pile, right half = Mash's seat (centre x -1.72) |
| Stall at the corner | REUSE `woodcounter` at (0.05, 0, 1.70), `rot 40`; a small awning over it |
| Houses | east row from x 3.15, west side closed by a house at x -7.5, south row at z 9.5 (seen in C13 only) |

Marks on the top: door D (-3.85, 1.55) · Mash's lean ML (-2.95, 1.22) · bench seat MB (-1.72, 1.19) · tower T (-3.55, 2.75) · heap H (-3.45, 2.70) · basket lift B (-3.60, 2.55), basket at (-3.09, 2.91) · scoop MS (-2.75, 2.25) · cart lanes: push from (-2.75, 2.25) to (-1.45, 2.72); brake ride x 1.25 from z 4.60 to 0.55; theft x 1.20; last ride x 2.30 · Viking V (-0.53, 1.40), yaw 40 · paying S11 (0.44, 2.17), yaw -140 · chained row x 0.95, z 0.75, 1.37, 1.99, 2.61, 3.23 (chairs 1 to 5, backs toward +z) · Spud's last mark SP (-0.60, 4.10).

**The bottom (instance 2: `rot 180`, at (61.85, 5.32, -23.35))**: a top point (x, y, z) lands at (61.85 - x, y + 5.32, -23.35 - z). The foot of the hill is then at (60, 0, -2.0), the yard z -2.0 to 7.5, the street climbs toward -z to the shop at (60, 5.32, -23.35). Hay cart at (59.20, 0, 1.00), long side along x; Mash's mark (60.85, 0, 1.45). Hidden (scale 0) outside C08b and C09.

Heights against the cast (standing = 0.14 legs + body): Spud 1.02 (leaf 1.14, eyes 0.69, mouth 0.54, arm root 0.54, 0.76 wide); Mash 1.38 (eyes 0.87, mouth 0.71, 0.54 wide); the Viking 1.16, 1.50 with his locks, 1.06 across the mantle.

- The cart is built for Spud: top rail 0.50 (under his arm root), basket rim 0.44, heap 0.54. From a lens at y 1.25 or higher, 3.8 m away, his mouth clears the heap by 0.06 or more. The kit `woodchair` (back 0.90) would hide his face: not used.
- Tallest moments: Mash on the heap, crown 1.72, 0.75 in front of the awning's edge (z 1.95, y 2.05); Mash in the cart, crown 1.56; Spud upside down in the basket, boots at 1.42. Nothing is over any of them.
- The Viking has 0.13 between his back and the wall and 0.30 to the bench's end; he is hidden inside the shop except in C11.
- Uprights for `engine/shared/obstacles.js`: the two door jambs (-4.45 and -3.35, z 0.90), the two awning posts (-5.60 and -2.70, z 1.95), the corner post (0.30, 0.90).

## 2. Props: reuse first, then twelve new kinds in three files

### 2.0 REUSE (no builder)

| Need | Kind | Numbers |
|---|---|---|
| The grocer (11) | cast `always-orders-potatoes/viking` | episode 1's boss as he is. `kind` face, no line |
| His counter (11, dressing after) | REUSE `woodcounter` (props-winter.js) | `w 1.10, h 0.62, d 0.40`, no garland, at (0.05, 0, 1.70), `rot 40` |
| Apple crates left of the door | REUSE `producecrate` x 2 (props-heistset.js) | `w 0.5, d 0.36, h 0.3, fill "apples"` at (-5.05, 0, 1.25) and (-4.85, 0.30, 1.22) stacked, `rot 8` and `-6`. Dressing, never held |
| The shiny coin in a glove (11, 12, 14, 15) | REUSE `coin` (props-money.js) | `scale 0.6`: 0.10 across, `shine 0` (its star would be a spark). Thin pinch on the rim (`grips.thin`, SIZE coin). Two props: "coinS" (Spud) and "coinM" (Mash), never passed. The director proves on a bench that the pinch follows `scale`; if not, key `r` in a copy |
| Mash's empty pocket (13) | REUSE `pocketlining` (props-happy.js) | `wear: "mash"`, `color "#f4f0e6"`, at his pouch's left end, body frame (-0.19, 0.50, 0.24); scale 0 to 1 in 3 frames on the third pat |
| Trees | REUSE `tree` (props3d.js) x 2 | at (-6.6, 0, 3.2) and in the yard at (63.4, 0, -0.6) |
| Window boxes | REUSE `flowerbox` (props-happy.js) x 3 | under the annex window and two east-row windows |
| Sounds in the kit | built in | `plank-rattle` + `freewheel` (wheels), `creak` (handle), `crumble` (tower), `impact`, `screech` (brake block), `tink` (coin in the slot), `latch` (lock), `slap`, `pat`, `gulp`, `step`, `leafrustle` (hay). NOT in the kit: a wicker snap, tins clattering on cobbles: the director looks in `assets/sfx` or asks |

Looked at and not reused: `cart` and `corral` (a modern wire trolley; the bay carries lettering), `woodchair` (0.90 back: see section 1; `chaircart` copies its wood and joinery at 0.55 size), `marketstall` (snow, string lights, a lettered menu board), `townsquare` (a flat 40 m city square), `hillneck`, `streetcracks`, `street` + `kerb` of props-parking.js (evening glow, slopes along x, no houses), `cobbles` (dusky, maple leaves), `hillbench` / `parkbench` (1.9 long), `groceryarmful` (milk carton, plastic tub, yogurt: not long ago), `tin` (a printed red label), `wheelbarrow` (red metal), `basketarmour` (a white laundry basket), `apple` (no grip size).

### 2.1 NEW `hillstreet`: forecourt, street, yard and houses (file A). Origin: the world origin of section 1

| Part | Numbers |
|---|---|
| Ground | ONE cobble skin over forecourt, slope and yard, so the lip is a soft fold 0.25 long, not a crack. Stones 0.11 to 0.16, drawn once in world metres on three canvases 2048 x 2048: warm grey `#b5aa9a`, light `#cfc5b4`, joints `#6f665c`, a worn lighter wheel track 0.5 wide down x 1.85, 30 moss joints `#7f9a5a`, 12 straw wisps near the yard. A sharper layer over x -5 to 3, z 0 to 6 for the low lenses |
| How the slope is built | a plane from (z 0, y 0) to (z -21.35, y -5.32), 2.6 wide, with a stone gutter 0.25 each side. The houses do NOT tilt: each stands level on its own stone footing, so every doorstep, sill and eave steps down 0.75 to 1.1 from its uphill neighbour. The steps are what reads as steep |
| East row | 6 crooked houses from z 9.5 down to -22, fronts on x 3.15 facing -x, 3.2 to 4.4 wide, eaves 2.9 to 3.8 over their own footing, each leaning 1 to 3 degrees a different way. Plaster `#efe2c4 #e6d3ac #f2e9d6 #dcc9a0`, timber `#6b4a2c`, roofs `#b5533c #a8492f #c2674a` with a sagging ridge, 2 or 3 windows each with shutters `#5f7f8a` or `#7a8f5a`, a door, a chimney, one lantern bracket |
| West row below the shop | 4 houses from z -4.0 down, fronts on x 0.30 facing +x, the same family |
| West and south closers | one house at x -7.5 facing +x; a row of 3 fronts on z 9.5 facing -z |
| Valley | beyond the yard: 9 roof cards z -34 to -60 stepping down to y -9, two green hills `#8fb26a`, `#a9c57f` to y -2 at z -90, sky above. No lens sees an end |
| Yard | packed earth `#b89a6a` with cobbles fading in, a stone trough at (5.2, -5.32, -23.2), a fence run along z -30.8 |
| Solid | ground and house fronts solid; cards steam. Budget 22 000 triangles; instance 2 shares the geometry |

### 2.2 NEW `grocerfront` (file A). Origin: the foot of the front wall at its middle, facing +z; placed at (-2.75, 0, 0.90)

| Part | Numbers |
|---|---|
| Wooden shop | local x -3.05 to 0.15, 2.55 to the eave, gable to 3.6. Vertical boards 0.22 to 0.30 `#8b6240 #7d5636 #93694a`, joints `#4a3220`, shingle roof `#6f5a4a` |
| Door | local x -1.70 to -0.60, 1.10 x 1.72, casing 0.09 `#4f3521`; leaf of 5 planks with a Z brace, fixed open 100 degrees into the shop. Inside: a dark warm room `#3a2a1c` 1.6 deep, a shelf wall with 14 jars and 9 tins, a hanging ham, a floor of boards. No key |
| Awning | over local x -2.85 to 0.05: cloth from y 2.45 at the wall to y 2.05 at z +1.05, 7 red `#c8372d` and 6 cream `#f3ead2` stripes 0.22 wide, a scalloped valance 0.14, 2 posts 0.07 square, a sag of 0.05 |
| Orange crates | 2 slatted crates 0.5 x 0.36 x 0.3 of the `producecrate` look heaped with oranges `#f08a24`, left of the kit apple crates |
| Stone annex | local x 0.15 to 3.05, 2.35 to the eave: rubble stone `#cfc3a8`, shade `#a89c84`, 40 stones outlined once, a window 0.60 x 0.70 at y 1.00 to 1.70, local x 0.45 to 1.05, shutters open `#5f7f8a`, a red roof |
| Bench | local x 0.09 to 1.39: 3 seat planks, top 0.30, 0.40 deep, 4 square legs, no back (the wall is the back). Wood `#8a7358`, one split end. Solid |
| Stall awning | a small one over local x 1.9 to 3.05, y 1.95 to 2.25, 0.9 deep, the same stripes; a wall shelf under it with 6 jars at y 1.25 |
| Iron ring | r 0.05 on the corner post at world (0.42, 0.40, 0.95): the row's anchor |
| Budget | 9 000 triangles |

### 2.3 NEW `haycart` (file A). Origin: the ground under its middle, long side along x

Bed 1.90 x 1.10, floor at y 0.62, slatted sides to 0.92 (5 slats `#9a6f42`, posts `#6b4a2c`), 2 spoked wheels r 0.42 (10 spokes, iron tyre `#3a3a40`) on one axle, a shaft pair 1.2 long resting on a prop stick. Hay: a lumpy mound to y 1.25 over the bed, hanging 0.15 over the sides, 260 drawn straws `#e6c75a`, `#d4b040`, `#f2dc8a`; NOT solid (a body lies in it).

| Key | Numbers |
|---|---|
| `dent` 0..1 | a crater 0.80 across and 0.45 deep at local (0.35, 0), its rim pushed up 0.10: Spud's body stands in it upside down |
| `burst` = seconds since the hit (tween linearly) | 40 straw tufts fly up to 1.2 m on ballistic paths and are down by 1.1 s; 12 stay lying on the cobbles |
| `rock` 0..1 | the cart rocks 3 degrees about its axle, damped, 2 Hz |

5 000 triangles. Two props: one on each instance.

### 2.4 NEW `foodtower`: armful, tower and heap in one (file B). Origin: the middle of its base

Items, each drawn once: tin (r 0.045 x 0.09, plain steel `#b9c0c6`, 2 ribs, lid ring `#8d959c`), orange (r 0.045 `#f08a24`), apple (r 0.04 `#d8342c`, green cheek), bread (0.20 x 0.08 `#c98f4e`). One fixed table of 64 items gives each its place in the stack and its place in the heap.

| Key | Numbers |
|---|---|
| `n` 0..64 | items shown from the bottom up. 14 = the armful of 01 and 02: 0.46 wide, 0.36 tall. 64 = the tower of 03: 0.46 wide at the base, 2.05 tall, 3 items a layer, each layer turned and 0.01 to 0.03 off centre |
| `sway` degrees | bends the stack like a rod, the top most: 0 to 14 |
| `fall` = seconds since it went (tween linearly) | every item leaves on its own ballistic path (g 9.8) toward +x and +z and ends at its heap place: a mound r 0.80, 0.62 high, centred 0.10 in front of the base; all lying at 0.9 s, three roll on to 1.4 s. The mound is solid, with a hollow r 0.40 under its middle (Spud crouches in it) |
| Held | `grips.box`, SIZE `foodtower { w: 0.46, h: 0.36, d: 0.30 }`: both gloves on the two ends of the bottom layer, base at y 0.26 |

Budget 6 000 triangles (instanced).

### 2.5 NEW `foodpile`, `snackfruit`, `catchdrop`, `foodrain`, `hoodsack` (file B)

`foodpile`, the counter on the bench: origin bottom centre, at (-2.38, 0.30, 1.16). Key `grow` 0..5 (steps on cuts, each new step pops in over 4 frames): 1 = orange peel, 6 curls; 2 = + 9 tins and fruit, 0.22 high; 3 = + 12 apples, 0.34 high, 0.50 wide; 4 = a heap 0.55 wide and 0.62 high with the whole basket on top; 5 = 0.60 wide, 0.95 high, a wheel of cheese and a ham on it. It never passes 0.60 wide (Mash sits 0.35 to its right). Solid. 3 000 triangles.

`snackfruit`: one fruit to eat, origin its centre, r 0.045, spec `fruit "orange" | "apple"`. Key `bite` 0..1: a bitten hollow 0.05 across with pale flesh (by scale). Held with the mug hold, SIZE `snackfruit { r: 0.045, h: 0.09 }`. 200 triangles.

`catchdrop`: the thing that falls into a waiting glove. Spec `item "orange" | "coin"` (the coin = the kit coin's look at r 0.05), `from [x, y, z]`, `to [x, y, z]`, `hop` (m, default 0). Key `drop` = seconds since it left (tween linearly): a ballistic path (g 9.8) from `from` to `to`, the coin turning 2.5 times about a level axis, the orange rolling; it stops AT `to` and stays. The glove is pinned at `to` by an arm pose 4 frames before it lands, hand shape `cup`, then `hold`; nothing moves after the catch until the cut. Two props: the orange from (-3.70, 0.72, 1.95) to (-3.22, 0.38, 1.70), `hop 0.06`, 0.40 s; the coin from (-0.25, 1.12, 4.30) to (-0.18, 0.14, 4.35), 0.447 s. 150 triangles.

`foodrain`: 26 items of the `foodtower` family. Spec `mode "up"` (C08a, C08b): rides the cart (`on: "<cart id>"`); key `fly` = seconds: item i leaves the basket at 0.12 i s, rises 0.8 to 1.6 m and falls behind, gone at 1.2 s each. `mode "down"` (C09): spec `to [x, y, z]`, `r 0.10`; key `rain` = seconds: item i enters at y 4.2 above `to` at 0.085 i s and falls straight (g 9.8, tumbling) into the disc, hidden once 0.03 under it; the last is in at 3.2 s. 2 000 triangles.

`hoodsack`: Mash's hood held out like a sack (the rig's hood cannot move). `wear: "mash"`. A cloth funnel in his hoodie's `#7a716c` (inside `#5c5450`) from his collar's back, over his right shoulder, to a mouth ring r 0.17 with a rolled edge at body frame (-0.55, 0.41, 0.12), tipped 15 degrees toward the sky; two drawstring ends `#f2d8bd`. His two gloves are pinned on the ring's near and far points (arm poses, no grip). Key `fill` 0..1: the belly under the ring sags from 0.10 to 0.34 and 3 item shapes press through. Not solid. 1 200 triangles.

### 2.6 NEW `wickerbasket` (file B). Origin: the middle of its bottom

An oval hand basket 0.52 x 0.40 at the rim, 0.42 x 0.32 at the foot, 0.20 tall, a plaited rim roll 0.03. Weave drawn once: 22 stakes, 9 rows, willow `#c79a55`, shade `#9a7238`, light `#e0bb7a`. Arch handle of two twisted rods 0.022 thick from the two long-side rim points up to 0.42 over the bottom. 3 500 triangles.

| Key | Numbers |
|---|---|
| `fill` 0..1 | a heap of 18 `foodtower` items to 0.10 over the rim; 0 = empty |
| `snap` 0, then seconds since it broke (tween linearly) | 0 to 0.08 s: 5 willow fibres fray at the top of the arch. At 0.08 s it parts: the two halves spring apart to stubs 0.12 long leaning 25 degrees out, quivering 3 degrees at 9 Hz for 0.3 s. No flash, no mark |
| `stub` 0 or 1 | 1 = built with the two stubs from the start (every basket after round 2: no arch ever crosses a face again) |
| `spill` = seconds | the basket lies on its side (set its `tilt` 90 on the cut); 9 apples roll out along +x over 1.5 m on fixed tracks, slowing, the last stopping at 1.6 s. Spec `spillTo [x, z]` = where the first three stop |
| Lifted (05) | both gloves pinned on the arch's top, 0.05 apart (arm poses, shape `hold`); the basket rises by its own `y` tween. No grip: nothing can slip when it snaps |

### 2.7 NEW `chaircart` (file C). Origin: the ground under the seat's middle, front toward +z

The first shopping cart: a small plank chair on four wooden wheels with the basket on its seat. Wood of the kit `woodchair`: `#a2703f`, dark `#7d5230`.

| Part | Numbers |
|---|---|
| Chair | seat 0.44 x 0.40, top y 0.24, 0.03 thick. 4 legs 0.04 square. Back posts at z -0.20 up to 0.52, top rail 0.44 x 0.05 with its top at 0.50, one slat at 0.38. Rail grip points RL (-0.17, 0.475, -0.20) and RR (+0.17, 0.475, -0.20) |
| Wheels | 4 discs r 0.06, 0.035 thick, of 3 boards with 2 cross battens and an iron nail hub `#3a3a40`, at (±0.24, 0.06, ±0.17), each on a block nailed under a leg with 2 bent nails showing. Track 0.48, total length 0.50 |
| Basket | the `wickerbasket` with `stub 1`, built in, on the seat: rim at 0.44. Key `fill` 0..1 as above; `basket` 0 or 1 hides it |
| Step | a board 0.40 x 0.10 between the back legs at y 0.10: both boots stand on it when a body rides behind the rail |
| Brake (spec `brake: true`) | a stick 0.36 long, 0.03 thick, pivoted on the back right leg at (0.24, 0.15, -0.20); a wooden block 0.06 x 0.05 x 0.04 on its short end over the back right wheel's tread, 0.012 clear; a flat pedal 0.08 x 0.06 on its long end at (0.24, 0.27, -0.50); a leather strap hinge `#5a3a22`. Pale new wood `#d9b77a`, so it reads as added |
| Lock (spec `lock: true`) | a box 0.10 x 0.08 x 0.06 of dull iron `#8d959c`, shade `#5f666c`, 4 rivets, on the rail's local +x end, centre (0.17, 0.47, -0.25), its face toward -z (the pusher's side): a coin slot 0.11 x 0.014 in its top, a keyhole-shaped tab hole in its outer side. An iron eye on top of the back post at (0.20, 0.53, -0.20) holds the next chair's chain |
| Keys | `spin` (turns of the wheels: tween it with the travel, distance / 0.377 per turn), `brake` 0..1 (pedal down 0.07, block onto the tread; from 0.9 the back right wheel no longer turns), `jolt` 0..1 (basket items hop 0.03 once), `fill` |
| Riding | behind the rail (Spud): `ride` off [0, 0.10, -0.42], boots on the step. In the basket, backwards (Mash): off [0, 0.32, 0.02], sitting, facing -z. On the slope the director sets the prop's `tip` to 14 and moves it down the line of section 1 |

4 500 triangles. Solid except the basket's items.

### 2.8 NEW `lockchain` (file C). Origin: the world origin (its points are absolute)

A chain of 20 oval links 0.035 long (0.70 m), wire 0.006, iron `#7d858c`, from `a` (the wall ring, or the top of the back right post of the chair standing downhill) to `b` (the tab hole of this chair's lock box), hanging in a catenary 0.06 deep; at the `b` end a flat tab 0.05 long with a round head. In the row every chair has `rot 180` (front downhill), so its box, built on the rail's local +x end, sits at world x 0.78, y 0.47, 0.25 behind its centre: chair 5's at (0.78, 0.47, 3.48), chair 4's at (0.78, 0.47, 2.86).

| Key | Numbers |
|---|---|
| `pop` 0, then seconds since it let go (tween linearly) | the tab jumps 0.03 out of the hole in 2 frames, the chain swings down about `a` and hangs straight in 0.35 s, 2 damped swings of 8 degrees |
| `taut` 0..1 | the catenary pulls straight and the links stand in line: Mash's tugs |

Five props: ring to chair 1, then 1 to 2, 2 to 3, 3 to 4, 4 to 5. 800 triangles each.

## 3. Cast marks per panel (starting marks: run `qa/clear.mjs`)

Hands that touch a prop are kept to four holds, none passed on: the armful and tower (`grips.box`, one prop from 01 to the collapse), Mash's fruit (mug hold, in his glove at each cut in), Spud's coin and Mash's coin (thin pinch, two props). Everything else is a glove pinned on a prop by an arm pose (the handle, the rail, the hood ring, the lock) or a ride. Mash changes place only on cuts.

| Panel | Spud (you) | Mash | Others |
|---|---|---|---|
| 01 | frame 0: mid step out of the door at (-3.90, 1.45), to D by 0.5 s, yaw +15, `foodtower` `n 14` in both arms (base y 0.26, top at his chin 0.62), a stagger: lean 5 degrees each way at 2 Hz. `shocked` at 0.45 s with `set { open: 0.1 }` | ML, yaw -35, `smug`. Crouch 0.15, lean 15: his RIGHT glove waits at the catch point from frame 0, shape `cup`, closes to `hold` at 0.40 s. Says the line | `catchdrop` orange `drop` 0 to 0.40 from frame 0 |
| 02 | (-3.62, 2.05), yaw +40, armful as 01, `annoyed`, brows down, pupils on Mash | ML, upright, yaw -25. `snackfruit` orange in his right glove at the cut in: to his mouth at 3.0 s (`gulp`), `bite` 1, cheeks: squash 0.03 twice a second while he chews; lids half shut. At 5.0 s his left glove flicks toward the bench | `foodpile` `grow` 0 to 1 at 5.2 s (the peel lands) |
| 03 | T, yaw +10, `n` 14 to 64 over 1.2 s from 7.5 s (the stack grows out of the top of frame), up on his toes (squash -0.05), `focused`; `sway` 0, +6, -8, +14 from 8.6 to 10.4 s; `shocked` at 10.5 s | ML, chewing, pupils follow the tower's top | `fall` starts 10.70 |
| 04 | under the heap: crouch 0.35 in its hollow at (-3.40, 2.95), yaw 0; the mound covers all of him but his leaf (`droop` 0.3, springing up at 11.6 s) and his LEFT glove on a straight arm out of its side, 3 waves from 12.0 s. If his body shows through the items, `hide` him and the director asks task B for a leaf and a glove on the heap | sitting on the heap at (-3.50, 2.60), sunk 0.12, yaw +8, `serene`; `snackfruit` apple in his right glove, a bite at 12.3 s. He is there at the cut in | `foodtower` `fall` runs on from 0.30 to 1.4; `foodpile` 2 from the cut in |
| 05 | (-3.60, 2.55), yaw +55. Both gloves on the basket's arch at (-3.09, 0.42, 2.91). The heave from 16.6 s: basket `y` 0 to 0.12 in 1.2 s, he leans back 12 degrees, squash -0.06, a shake of 0.01 at 8 Hz, eyes squeezed to 0.3, `set { open: 0.2 }` | out of frame | basket `fill 1`; `snap` from 19.10; the basket's `y` 0.12 to 0 in 3 frames from 19.18 |
| 06 | (-3.60, 2.55), yaw +20. Cut in on the landing frame: squash 0.10, `shocked` with `set { open: 0.1 }`; then 5 hops (`hop` count 5, height 0.12) on his left boot, both gloves on his right boot held up in front (`{ o: [0.10, 0.30, 0.30] }`), eyes squeezed 0.25, cheeks puffed (squash 0.04) | MS, yaw -30, `delighted`. Crouch 0.30 from 20.4 s, both gloves down flat round the three apples at (-2.95, 0.05, 2.55), shape `cup` | basket on its side at (-3.05, 0, 2.95), `spill` from 19.45, `spillTo [-2.95, 2.55]`; `foodpile` 2, then 3 at 23.2 s |
| 07a | only his two gloves, pinned on the basket's two stubs, leaving upward after it lands | out of frame | cart at (-2.75, 0, 2.25), `rot 70`; basket `y` +0.10 to 0, ease `settle`, 5 frames from 24.4 s; one wheel `spin` 0 to 1.5 from 24.9 s (his glove flicks it) |
| 07b | walks 0.52 behind the cart from (-3.24, 2.07) to (-1.94, 2.54), yaw +70, 0.5 m/s, `move` linear; both gloves pinned on RL and RR; `smug`, lids 1 from 26.4 s (nose in the air: lean -6) | MB, sitting, yaw +20, `annoyed` at 0.5, chewing nothing, pupils follow the cart | cart moves on its own linear tween at the same speed, `spin` with the travel, `jolt` once at 27.6 s; `foodpile` 3 |
| 08a | rides the cart from the cut in: off [0, 0.10, -0.42] to [0, 0.42, -0.80] and pitch 0 to 50 in 6 frames from 29.25 s (the yank: boots leave the cobbles), gloves stay on RL and RR, legs trail | out of frame | cart at (1.85, 0, 0.45) at the cut, `rot 180`: 0.5 m/s over the lip, `tip` 0 to 14 from 29.1 to 29.3 s, then down the centre line with a = 2.4 m/s2 (g sin 14): s = 1.2 t2 (8.7 m down at 32.0 s, 6.4 m/s). `foodrain` "up" from 29.6 s |
| 08b | as 08a, pitch 50, `terrified` with `set { open: 0.6 }`, pupils on the lens, the leaf blown back | out of frame | on instance 2: the cart from 12 m to 4 m above the foot in 1.1 s; the lens keeps 2.6 m ahead |
| 09 | upside down in the hay at (59.55, 0.72, 1.00): pitch 180, crown at y 0.72, boots at 1.74; legs kick 4 times from the cut in, then hang | (60.85, 1.45), yaw -30, `delighted`, pupils up at the sky; both gloves on the `hoodsack` ring from the cut in; knees give 0.03 at each of the first 5 catches. He is there at the cut in | `haycart` `dent` 1, `burst` from 0 at the cut, `rock` 1 to 0; the wheeled chair on its side against the cart's wheel at (58.6, 0, 2.2), one wheel `spin` slowing to 34.5 s; `foodrain` "down" from 33.8 s to `to` (60.32, 0.55, 1.59); `fill` 0 to 1 |
| 10a | only his right glove: presses the pedal at 38.6 s (a rest pin following `brake` 0 to 1 in 3 frames), lets go at 39.1 s | out of frame | cart at (1.25, 0, 4.20), `rot 180`, wheel `spin` 2 turns a second until `brake` passes 0.9 |
| 10b | rides behind the rail, boots on the step, back to the lens, lean -5 (proud). 40.90 s: his right boot onto the pedal. 40.93 to 41.25 s the flip: off [0, 0.10, -0.42] over [0, 0.95, -0.05] to [0, 0.40, 0.03], pitch 0 to 180, linear then `settle`; gloves leave the rail at 41.00 s, arms `up`. Then: `dizzy`, pupils circling once, one squash 0.06; at 42.3 s his left arm out to `{ o: [0.38, 0.80, 0.10] }`, shape `thumb` | out of frame | cart from z 4.60 to 0.55 at 2.9 m/s; `brake` 0 to 1 at 40.90 in 2 frames; it stops within 2 frames, rocks forward 6 degrees and back; `jolt` 1; basket `fill` 0.8 |
| 11 | S11, yaw -140, back to the lens. "coinS" in his right glove at the cut in: lifted over the counter at 45.0 s, held there to 46.6 s. At 49.9 s he turns to yaw +10 in 6 frames: `shocked`, arms drop | in the cart from the cut in (ride, backwards), `happy`, waving his right arm (`wave`) from 45.4 s. Cart at (1.20, 0, 0.45) at the cut, over the lip at 45.2 s, s = 0.45 t2: 1 m down at 46.7 s, 6 m at 48.9 s, 14 m at 50.8 s | Viking at V, `kind`, his right glove open over the counter under the coin; at 47.6 s his brows go up and his left arm goes to `point` past Spud; `foodpile` 4 (off frame) |
| 12a | (0.22, 3.50), yaw +30, `eager`, "coinS" in his right glove at chest height; a pat of his left glove on chair 5's rail | out of frame | 5 `chaircart` with `lock: true`, `brake: true`, `fill 0`, at the row marks, `rot 180`; 5 `lockchain` |
| 12b | the same mark; his right glove carries the coin to the slot of chair 5's box (0.78, 0.53, 3.48): its lower third goes in at 55.2 to 55.6 s (`tink`), out again at 56.2 s, still pinched. `happy`, a grin at 56.3 s | out of frame | chain 4-5 `pop` from 55.75 s (`latch`) |
| 13 | SP, yaw +150, `smug`, arms `hips`; chair 5 parked at (-1.25, 0, 4.20) from the cut in | (0.95, 3.28), yaw 180, both gloves pinned on chair 4's RL and RR. Three tugs from 57.2 s: lean -14 for 5 frames, back for 7, `angry` with eyes squeezed. Lets go at 59.0 s, `annoyed`; 59.4 s: his left glove pats his pouch three times (`tap` count 3, every 0.3); on the third the lining comes out; he looks down at it, `deadpan` | chain 3-4 `taut` 0 to 1 with each tug; chair 4 shifts 0.03 toward +z and back; chairs 3, 2, 1 rock 1 degree |
| 14 | SP, yaw 0, `delighted`; his LEFT arm up and out, glove at (-0.25, 1.02, 4.30), "coinS" pinched over it; the right arm `hips`. No blink. 63.80 s: the pinch opens (shape `open`), eyes 1.2, pupils follow the coin down | out of frame (he comes over behind the lens) | "coinS" hidden and `catchdrop` coin shown on the same frame, 63.80 s; `drop` from 0 |
| 15a | his side only, still | crouched at (0.38, 4.20), crouch 0.35, lean 20, yaw -35, the `smug` of 01 (same lid 0.42, same curve); right glove at the catch point from the cut in, `cup` to `hold` at 64.25 s. Says the line | `catchdrop` goes on from 0.30 to 0.447 |
| 15b | out of frame | only his right glove with "coinM": into chair 4's slot at 65.15 s, out at 65.40 s | chain 3-4 `pop` from 65.22 s |
| 15c | SP, yaw -15, `shocked` to `deadpan` in 0.3 s, mouth open 0.3, pupils hard right; arms hang | in chair 4 (a sixth `chaircart`, shown on the cut; the row's chair 4 hidden), backwards, `smug`, "coinM" held up in his right glove, his left waving. Cart on x 2.30 from 2 m to 6 m below the lip | the cut is the end |

## 4. The counter and the light

The stolen pile is the film's number (never a digit): `foodpile` `grow` 1 (peel, C02), 2 (C03's cut out, seen in C04's right edge and C06), 3 (C06 at 23.2 s, seen again in C07b), 4 (set on the cut into C10a; the bench is behind the lens in 09 to 11, so it is not seen), 5 (set on the cut into C12a, which opens on it for 1.0 s before the pan). One light for the whole film: sun from the upper left front, key `#fff1d6`, soft shadows toward +x and -z; under the awning the wall is 15 % darker. The bottom instance uses the same sun.

## 5. Lines to cameras: the cut list (seconds; the measured lengths decide)

30.48 s of speech in 66.1 s, 21 shots. No two voices overlap. Every line starts inside the shot it belongs to. The last line is cut across three pictures on its own pause.

| Shot | From to | Line (start to end) | Action, on its frame |
|---|---|---|---|
| C01 | 0.00 to 2.40 | Mash "Drop it... and it's MINE." 0.05 to 1.49 | frame 0: Spud mid step, the orange already off the stack; caught 0.40; Mash's grin; Spud's stare 0.45 |
| C02 | 2.40 to 7.40 | narr "Mash is the WORST friend in the village. How do you beat him?" 2.60 to 6.72 | bite 3.0, chewing; peel flicked 5.0, lands 5.2; Spud's glare from 5.4 |
| C03 | 7.40 to 11.00 | narr "You carry more." 7.60 to 8.82 | the stack grows 7.5 to 8.7; sways 8.6 to 10.4; goes 10.70; cut 9 frames into the fall |
| C04 | 11.00 to 15.20 | narr "...You carry nothing." 12.60 to 13.97 | the last items roll to 11.8; leaf springs up 11.6; glove waves 12.0; Mash bites the apple 12.3; pile 2 |
| C05 | 15.20 to 19.30 | narr "A basket. Everything in one place." 15.40 to 18.22 | he pats the full basket 15.6; the heave 16.6 to 19.1; `creak` from 18.3; `snap` 19.10; cut 4 frames into the drop |
| C06 | 19.30 to 24.00 | narr "Including your foot." 20.80 to 22.05 | lands on his boot on the cut frame; 5 hops to 21.6; apples roll 19.45 to 21.0; Mash scoops 20.4 to 21.2; pile 3 at 23.2 |
| C07a | 24.00 to 25.60 | none | the basket settles on the seat 24.4; a glove flicks a wheel 24.9, it spins |
| C07b | 25.60 to 29.00 | narr "So you give it wheels." 25.80 to 27.49 | the push; eyes shut from 26.4; Mash's eyes follow |
| C08a | 29.00 to 32.00 | narr "The village is on a hill." 29.60 to 30.95 | over the lip 29.1; the yank 29.25; food starts to fly 29.6; 8.7 m down at the cut |
| C08b | 32.00 to 33.20 | none | his face, the scream, houses streaming; cut on the frame before the hay cart |
| C09 | 33.20 to 37.60 | none | hay bursts on the cut frame; legs kick to 34.4; the first item drops into the hood 34.6, the last 37.0; Mash's grin; camera shake 0.03 for 6 frames at 33.2 |
| C10a | 37.60 to 39.50 | narr "Wheels need a brake." 37.75 to 39.42 | the pedal goes down 38.6, the block bites, the wheel stops |
| C10b | 39.50 to 44.20 | narr "...It works." 42.80 to 43.53 | coasting at the lip from 39.5; boot on the pedal 40.90 (`screech`); dead stop; the flip 40.93 to 41.25; thumb 42.3 |
| C11 | 44.20 to 50.80 | narr "Mash doesn't steal snacks anymore." 44.40 to 46.85; "He steals the whole cart." 47.40 to 49.53 | the coin over the counter 45.0; Mash rolls over the lip 45.2, waving 45.4; the Viking points 47.6; Spud turns 49.9 |
| C12a | 50.80 to 53.20 | narr "So you lock them up. Only a coin opens one." 51.00 to 55.92 | the huge pile, pan 50.9 to 51.9 to the row and its chains; he pats the rail 52.2 |
| C12b | 53.20 to 57.00 | (the line runs on) | coin in 55.2 (on "coin"), the chain pops 55.75, coin out 56.2, grin 56.3 |
| C13 | 57.00 to 61.40 | none | three tugs 57.2 to 58.8, the chain snaps straight each time; pocket pats 59.4 to 60.2, the lining 60.2; his look down 60.6 |
| C14 | 61.40 to 64.10 | narr "You've invented the shopping cart." 61.70 to 63.57 | coin up from the cut in; it slips 63.80; cut 9 frames into the fall |
| C15a | 64.10 to 65.10 | Mash "Drop it... and it's MINE." 64.35 to 65.79 | caught 64.25; "Drop it..." on his face |
| C15b | 65.10 to 65.50 | (the line runs on) | coin into the slot 65.15, the chain pops 65.22 |
| C15c | 65.50 to 66.10 | (the line ends 65.79) | Mash rolling away with the coin up; Spud's face drops; CUT 0.31 s after the last word |

Mash's line is about 0.45 s of "Drop it", a pause to 0.75 s, then "and it's MINE": the director moves the two cuts at 65.10 and 65.50 onto the measured word times. Sound the director must ask Jonny to judge by ear: the catch 0.40, the collapse 10.70, the snap 19.10, the hay 33.20, the brake 40.90, the lock 55.75, the last catch 64.25.

## 6. Who builds what: three tasks, three files, nothing shared

Step 0, the director, before the builders start: three stub files with empty exports `CART_STREET_KINDS`, `CART_GOODS_KINDS`, `CART_CHAIR_KINDS`, their registry lines in `engine/page/props3d.js`, the SIZE rows `foodtower` and `snackfruit` in `storyboards/lib/grips.mjs`, the five uprights in `engine/shared/obstacles.js`. After that no builder touches `props3d.js`, `grips.mjs`, `obstacles.js`, a cast JSON, a costume file, `potato.js`, `timeline.js` or another props file. The three run in parallel; each at most 3 fix rounds, then stop and report.

Every bench: `"frame"` tall, set `plain` with `floor "none"`, look and castLook as episode 1, no music, no captions; one still per state plus one sequential `--draft` tail with 15 fps strips.

| Task | Files (disjoint) | Builds |
|---|---|---|
| A, the hill | `engine/page/props-cart-street.js`, `storyboards/series/how-you-invented/02-shopping-cart/bench/bench-street.mjs` and its JSON | 2.1 `hillstreet`, 2.2 `grocerfront`, 2.3 `haycart` |
| B, the food | `engine/page/props-cart-goods.js`, `.../bench/bench-goods.mjs` and its JSON | 2.4 `foodtower`, 2.5 `foodpile`, `snackfruit`, `catchdrop`, `foodrain`, `hoodsack`, 2.6 `wickerbasket` |
| C, the cart | `engine/page/props-cart-chair.js`, `.../bench/bench-chair.mjs` and its JSON | 2.7 `chaircart`, 2.8 `lockchain` |

DONE WHEN, task A:
1. Stills through the lenses C01, C06, C08a, C11, C13 and C15c on instance 1 and C08b, C09 on instance 2 (`rot 180` at (61.85, 5.32, -23.35)): no lens sees an end of ground, wall or sky, no wall is bare, no letter or digit.
2. From C08a the street is a strip from y 1582 up to y 800 with the hay cart at its end; from C09 it climbs behind the yard to the shop.
3. The houses stand level and step down; the lip has no crack; a 0.44 wide box moved down the centre line at `tip 14` keeps its four corners on the cobbles from z 0.45 to -21.
4. Spud at D under the lintel, Mash at ML and on the bench, the Viking at V behind the kit counter: no body in wall, post, bench or awning.
5. `haycart`: stills of `dent` 0 and 1, a strip of `burst`; Spud at pitch 180 in the dent, legs clear of the slats.
6. `qa/preflight.mjs`, `qa/clear.mjs` and the layout give no FAIL; `qa/golden.mjs` and `qa/regress.mjs` no difference; the diff holds only this task's files. Budgets of section 2.

DONE WHEN, task B (bench: Spud and Mash 1.2 m apart):
1. `foodtower`: stills at `n` 14 and 64 in Spud's arms (box hold, no glove through an item, the top of 14 under his mouth); strips of `sway` and of `fall`: every item ends ON the cobbles or on another item, nothing through his leaf.
2. `catchdrop`: both drops end in a cupped glove pinned at `to`, no gap over 1 cm, no pop on the catch frame.
3. `wickerbasket`: a strip of `snap` at 30 fps (frays, parts, quivers; no mark), `spill` with the first three apples stopping at `spillTo`; a full-size crop of the weave reads at 360 px.
4. `foodrain` "down" into the `hoodsack` worn by Mash at yaw -30: no item crosses his face from the C09 lens; `fill` 0 and 1; the funnel reads as his hood from the front and the side.
5. `foodpile` `grow` 0 to 5 as six stills beside a sitting Mash: 0.35 free.
6. As A.6.

DONE WHEN, task C (bench: flat ground and a 14 degree ramp box):
1. A four-view turnaround beside Spud: rail at 0.50, his mouth over the heap from a lens at y 1.25; full-size crops of a wheel, the brake and the lock box, each reading at 360 px.
2. Strips: `spin` with travel (no sliding wheel), `brake` 0 to 1 (block on the tread, the wheel stops), `jolt`.
3. Spud riding behind the rail and through the flip offsets of panel 10 (pitch 0 to 180): no body through rail or basket, no rig jump; Mash sitting backwards in the basket at `tip 0` and `tip 14`: eyes and mouth over the rail.
4. A row of five with five chains: `pop` (tab out, chain swings and hangs), `taut`; no link through a chair.
5. As A.6.

## 7. Changed from the sheet, open questions (my default), risks

Changed from the sheet, each for a reason the engine or the frame gives:
- Decided by the producer: no impact marks, motion lines or sparks (05, 09, 14); 13 is one Mash in one shot; the grocer is the Viking without a horned helmet.
- 05: he lifts the basket by its handle beside him, three quarters to the lens, not over his head (a load over the crown reads as stuck to the head, and the handle would cross his face).
- 07: the push goes toward the lens side so his face shows; the turn into the street happens across the cut into 08.
- 08 is two shots: the drawn high view, then a low reverse for his face.
- 10: he rides the cart like a scooter away from the lens and lands facing us; the sheet draws it side on.
- 11: the grocer stands outside at a corner counter (the kit `woodcounter`), not inside the door, so the Viking, Spud's back and the street fit one 9:16 frame; Mash rides backwards, waving.
- 12 to 15: the coin is a key (it goes in, the chain pops, it comes out again), so it never leaves a glove until it slips, and Mash can hold it up in 15 as drawn.
- 13 is seen from the hill side so Mash's face shows; Spud grins behind him.
- The bench has no back and stands right of the door; the pile is its left half.

Open questions:
- Q1 The coin: a key that comes back out (default), or it stays in the lock as on real carts (then Mash waves an empty glove in 15 and Spud needs a second coin in 14).
- Q2 Mash at the foot of the hill in 09 with no walk shown: as drawn, he is simply there (default), or he slides down a handrail in the background of 08a (one more ride).
- Q3 The flip in 10: shown in one shot, 10 frames (default), or cut on the stop to him already in the basket if the bench strip is not clean after one round.
- Q4 The tins: plain steel as drawn, long ago or not (default), or clay jars.
- Q5 Spud's hands on the basket in 05: on the handle, basket beside him (default), or overhead as drawn.
- Q6 Length: 66.1 s as timed from the lines (default), or held to 70 s with a 2 s walk of Mash to the pile after 09.
- Q7 The narrator names Mash once (line 2) against story.md's no-names rule: as approved (default).

Risks:
- Everything is unrendered. First stills to make: C11 (three columns in a 56 degree lens; the Viking's right eye is 44 px from Spud's edge), C08a (the street as a strip) and Spud upside down in the basket.
- Two rides carry the film (Spud dragged at pitch 50, the flip to pitch 180). If `ride` cannot tween offset and pitch together, the flip falls back to Q3 and the drag to a fixed pose from the cut in.
- The pushed cart in 07b moves on its own tween beside a walking body: both linear at 0.5 m/s, or the gloves stretch. Only 1.4 m of it.
- From lenses under about y 1.9 the street's surface is hidden behind the lip (C15c, partly C11): Mash sinks behind the brow. It reads as downhill, but only C08a shows the cobbled drop.
- Instance 2 doubles the street's triangles: keep it at scale 0 outside C08b and C09.
- Six designed falls (orange, tower, apples, food up, food down, coin) are paths inside the kinds, not engine physics: each needs its strip judged. The two catches need the glove pinned to 1 cm.
- The tower crosses the caption band in C03 and Mash's crown reaches y 485 in C04 and y 502 in C15a: captions there go to `pos` 250.
- story.md asks for a 1.5 to 2 s hold after the last line and for about 80 s; the brief cuts on the line at about 66 s. The brief wins; said here once.
