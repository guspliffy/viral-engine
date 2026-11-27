# How you invented 01 "The alarm clock": design of the new pieces

Creative director, 26 Nov 2026. Target: the approved 15-panel sheet `alarm-clock-panels-v2.png` (opened and read panel by panel), `OUTLINE.md` (H1 + E1), the panel texts in `sheets/panels-prompt.txt`, `lines.mjs` and the measured lengths in `lines.json` (narrator x1.15). Cast sizes are read from `spud.json`, `mash.json`, `viking.json`, `potato.js` (legs 0.14 under every body) and the Viking's sheet costume (`costumes-art-cast.js vikingSheet`); kit sizes from the kit headers. **Nothing here is rendered**: every reach, clearance and pixel is hand-worked, so the director fits all cameras in ONE `qa/camfit.mjs` batch and the builders prove each piece on a bench (section 6). Metres, floor y 0, +z toward the camera, +x screen right, hex colours, px at 1080 x 1920. **Body frame** = along a body from its FEET (y) and out of its face (z). No letter and no digit anywhere in the picture. In the three new files: no `Math.random`, no clock, every mark drawn once from a fixed table, things appear by visibility or scale, never by a tweened opacity (clip-lessons: a tweened opacity keeps its first frame's value in a sequential render); glows go through the kit's `flameMesh` / `glowMesh` uniforms as `pillarcandle` does.

The format example named in the task (`FETCH_HEAD:storyboards/series/country-vs-country/01-checkout/DESIGN.md`) could not be opened in this run (no shell, so no `git show`). Depth and number style follow the newest design on disk instead, `storyboards/series/kid-vs-dad/06-gum/DESIGN.md`.

**Caption band assumed**: `captionBand [210, 640]`, subtitle box top at y 300, two lines down to about y 480. Every eye and mouth in section 0 sits at y 700 or lower; only leaves, hair, the beam, the bucket, the hanging anvil and the window may stand in the band. Reuse was checked against `docs/VOCAB.md` and the kit files' own headers (no shell here, so `tools/vocab.mjs` was not run: the director runs `--find` on the twelve new names before step 0).

**The one fact that shapes everything**: a potato's face is on its body, so a sleeper lying flat looks at the ceiling. Mash therefore sleeps half propped on a 30 degree straw ramp (pose SLEEP, section 3), and no camera looks back toward +z (the room has no front wall).

## 0. Cameras (tries: one camfit batch, then one layout run)

Every shot has a push (the `to` column) or a move of its own; cut after each action. `f` = fov. Px are estimates within about 60 px.

| Shot (panel) | pos -> look, f | push to (over the shot) | What it sees (px) |
|---|---|---|---|
| C01 (01) | (-0.30, 2.25, 4.40) -> (-0.35, 0.85, -0.60), 56 | pos (-0.55, 2.05, 3.30), f 50 in 1.4 s | high wide. Boss in the door: eyes (478, 945), hair tip y 723, feet y 1188, about 480 tall; door top y 623. Spud in his bed, low left: eyes (150, 1163). Candle flame (806, 982). Pot P1 at the bottom (740, 1617). Mash right edge: eyes (951, 839). Window half in frame at (1007, 660). After the push Mash leaves the frame: boss and Spud only |
| C02 (02) | (0.55, 2.00, 0.55) -> (0.90, 1.08, -0.86), 36 | pos (0.62, 1.90, 0.30) | from above his feet, 31 degrees off his face normal. Mash's body fills the width (about 900). Eyes y 826, 270 apart; mouth y 1041; leaf up to y 230. The fly about 38 px |
| C03 (03) | (-0.55, 1.75, 2.60) -> (0.50, 0.98, -0.90), 40 | pos (-0.40, 1.65, 2.10) | Spud at the bedside: eyes (378, 1139), the candle flame between the two at his eye height. Mash: eyes (795, 842). Window (803, 455), 353 across. Dust falls from the beam (y 150 to 700) |
| C04a (04, carry) | (0.90, 1.25, 2.90) -> (-0.45, 0.62, -0.90), 38 | look follows Spud to (-0.10, 0.62, -0.95) | Spud walks 0.65 m from the door, about 520 wide, eyes near y 1010, the rooster in both gloves near y 1150. The shut door behind him |
| C04b (04) | (-0.35, 1.62, 2.75) -> (0.95, 1.22, -1.10), 40 | pos (-0.20, 1.58, 2.25) | as drawn. Window (574, 678), 341 across: its lower half (the roofs, the waking village) under the band. Rooster on the sleeper's forehead, in front of the window's lower left: feet y 950, comb y 683, x 496. Mash's eyes (543, 1035). Spud low left, half cropped as drawn: eyes (130, 1333); the candle stands about 70 px right of his near eye: nudge in camfit if it touches |
| C05 (05) | (-0.70, 1.85, 2.70) -> (0.60, 1.00, -0.70), 38 | pos (-0.55, 1.75, 2.30) | Spud: eyes (256, 1132). Mash: eyes (675, 825), mouth (714, 887). Rooster asleep on his belly at (832, 986), about 185 across, 25 px clear of the mouth |
| C06 (06) | (-0.15, 1.35, 3.60) -> (0.20, 1.20, -0.75), 46 | pos (-0.10, 1.35, 3.20) | Spud: eyes (308, 1222), gloves on the rope (308, 1302). Bucket at rest over Mash (905, 750); at its left apex (693, 670), the water arcs down left onto him. Beam underside y 521. Mash: eyes (876, 995) |
| C07 (07) | (0.10, 1.30, 3.30) -> (0.30, 0.95, -0.60), 42 | pos (0.12, 1.25, 2.80) | Spud sits low left: eyes (196, 1449). Candle flame (602, 1096), the knot 45 px over it, the rope up to the beam at (582, 258). Mash: eyes (881, 839). Window (975, 558) |
| C08a (08, insert) | (-0.20, 0.98, 0.85) -> (0.37, 0.86, -0.25), 30 | f 27 | the knot at the centre, about 136 across; flame under it near y 1090. No face |
| C08b (08) | (-0.45, 1.55, 2.90) -> (0.70, 1.25, -0.75), 42 | pos (-0.35, 1.50, 2.55) | bucket upside down (674, 681). Mash's mouth (650, 1058), eyes y 1008 (a flat face from here: the fountain is the picture), jet top y 837. Spud at the left edge, eyes near (190, 1230) |
| C09 (09) | (0.25, 1.30, 3.50) -> (0.18, 0.62, -0.70), 50 | pos (0.25, 1.28, 3.20) | Spud behind pot P1, low left: eyes (232, 1497), only his eyes and leaf over the rim (rim y 1540 to 1640; keep his eyes above y 1500, the app's lower edge). Anvil hanging (258, 550), about 279 wide; its rope up to the beam, along it, down to the knot over the flame (641, 942). Mash: eyes (877, 708). Window (966, 480), 251 across: first light |
| C10 (10) | (-0.20, 2.10, 2.60) -> (0.30, 0.75, -0.75), 50 | pos (-0.15, 2.00, 2.30) | high. Hole low left (168, 1375), about 385 wide, the anvil's top in it. Rooster at its rim (492, 1220). Mash on his side: eyes (631, 770). Window (941, 344): first light |
| C11 (11, restaged) | (2.00, 1.75, 0.60) -> (1.25, 1.66, -1.80), 26 | f 23 | THROUGH the window: its opening x 52 to 1028, y 447 to 1474, shutters at both edges, the sill under it. The boss strides up the lane: 540 tall, eyes (631, 1158) at the start; 840 tall, eyes (551, 1352) at the end, his boots gone under the sill for the last second. Orange sky and the sun's rim behind him |
| C12a (12) | (-0.30, 1.15, 2.90) -> (0.30, 0.80, -0.40), 44 | pos (-0.25, 1.10, 2.50) | Spud slumped: eyes (307, 1380). Candle stub, flame (611, 1083). Tin plate on the floor in front of the stool (499, 1620): the nail falls about 500 px onto it. Mash: eyes (836, 733). Window orange at (872, 475) |
| C12b (12, insert) | (0.35, 1.95, 0.35) -> (0.90, 1.10, -0.88), 30 | f 27 | Mash's face: eyes near y 880, about 330 apart; his right eye opens to 0.25 |
| C12c (12) | (0.85, 0.80, 1.90) -> (-0.10, 0.50, 0.55), 34 | pos (0.72, 0.76, 1.65) | Spud's face, eyes near (540, 900); pupils go down right (the nail), then up (the candle) |
| C13 (13, insert) | (1.05, 0.66, 0.30) -> (0.32, 0.55, -0.19), 30 | pos (0.95, 0.65, 0.23) | side on to the nail, from the bed's foot, as drawn: the candle stub right at x 861 (y 733 to 1495, 247 wide, flame to y 560), the bell on its plate low left at (292, 1276), 414 across; the nail level at y 880 from x 350 to 800; Spud's glove comes in from screen LEFT. Spud's bed and the door wall behind |
| C14a (14) | (1.20, 0.95, 3.60) -> (0.38, 1.15, -0.62), 46 | pos (1.10, 0.95, 3.25) | low, from the right. Window (1000, 770), 272 across, just under the band, the sun in it; the ray runs down left to the candle, flame (493, 1258). Mash under the window: eyes (826, 980). Spud waits left: eyes (162, 1254), his body 160 px clear of the candle |
| C14b (14, insert) | the C13 camera, f 28 | none (0.9 s) | the nail tips, falls 0.06 m, strikes the dome |
| C14c (14) | (0.60, 1.35, 3.90) -> (0.32, 1.05, -0.09), 54 | pos (0.57, 1.33, 3.40) | Mash bolt upright: eyes (815, 980), crown y 739. Spud: eyes (245, 1165), fists near y 924. Bell (527, 1218), 76 px clear of Spud; flame (560, 1155). Window (889, 715) |
| C15 (15) | (0.70, 2.00, 3.30) -> (0.18, 0.63, -0.64), 54 | pos (0.66, 1.92, 3.00) | high. Mash: eyes (903, 871). Bell under his glove (560, 1115). Spud: eyes (204, 1188), leaf top y 917. At the end the door flies open: the boss in it, eyes (329, 772), mouth y 832, hair tip y 508, door top y 430, his shadow across the floor toward Spud. The tightest frame of the film: camfit it first |

## 1. The room: set `plain`, `color "#0b1026"`, `floor "none"`, built from the props of section 2

`floor "none"` because the anvil needs a real hole: the hut brings its own plank floor (top at y 0) and nothing lies under it but the pit. Origin of the hut = the world origin.

| Part | Numbers |
|---|---|
| Inside | x -2.30 to 2.30, z -1.80 (back wall) to an open front; the floor and both side walls run on to z +4.60 so no camera sees an end. Wall top 2.50 |
| Ceiling beam (the ropes run over it) | along x, the whole width, centred z -0.70: 0.22 x 0.22, underside y 2.05, top 2.27. Plank ceiling above at y 2.50 |
| Door | back wall, opening x -1.125 to 0.025 (1.15 wide), y 0 to 1.70. Leaf hinged at x -1.125, swings INTO the room |
| Window (the clock) | back wall, 0.62 x 0.62, centre (1.25, 1.66): x 0.94 to 1.56, y 1.35 to 1.97. No glass. Two shutters fixed open flat on the inside wall |
| Mash's bed | x 0.55 to 1.65, z -1.78 to 0.10, mattress top y 0.28, straw ramp from z -0.435 up to y 1.05 at the wall |
| Spud's bed | x -1.70 to -0.60, z -0.20 to 1.50, mattress top 0.28. Used in panel 01 only, then dressing in the low left corner |
| Stool | centre (0.32, -0.20), top y 0.42, r 0.17: 0.06 off Mash's bed, beside where he sits up |
| On the stool | candle axis (0.37, -0.25). From the cut into C13 the tin plate and the bell at (0.286, -0.138): 0.14 from the candle toward the open floor, the plate's edge flush with the stool's rim |
| Hole (from panel 10) | centre (-0.40, -0.70), ragged r 0.30 to 0.38, pit 0.55 deep: 0.33 clear of the stool, 0.14 of Spud's bed, straight under the beam |
| Lane outside | level ground y 0 from the wall out to z -16 (the boss walks on it) |

Heights against the cast (standing = 0.14 legs + body): Spud 1.02 (leaf about 1.14, eyes 0.69, mouth 0.54, arm root 0.54); Mash 1.38 (eyes about 0.87 and mouth 0.71 along his body: face size 0.72 pulls them to the middle); the Viking 1.16, about 1.50 with his copper locks (the longest is 0.42), 0.86 wide, about 1.06 across the fur mantle, eyes 0.77, mouth 0.60.

- Tallest in the room is Mash sitting bolt upright in bed (panel 14): 0.14 + 1.38 = 1.52 at the crown, leaf about 1.60, at z -0.30: 0.45 under the beam's underside, his back 0.04 in front of its near edge. Nothing hangs there in panel 14.
- The Viking under the lintel: 0.20 free over his hair, 0.045 a side past the mantle (he "fills the doorway"); he stands 0.50 inside the wall (panel 01) or 0.30 outside it (panel 15), never in the casing.
- The full bucket's underside hangs at 1.42 over Mash (his blanket top there is about 0.97: 0.45 free) and never swings lower; at its left apex its centre is at (0.49, 1.76), 0.74 short of Spud: only the water reaches him.
- No free-standing post in the room: nothing to add to `engine/shared/obstacles.js` except the two door jambs at x -1.125 and 0.025, z -1.80.

## 2. Props: reuse first, then twelve new kinds in three files

### 2.0 REUSE (no builder)

| Need | Kind | Numbers |
|---|---|---|
| Candle stool | REUSE `stool` (props-home.js) | `r: 0.17` at (0.32, 0, -0.20), top 0.42. Four legs, the sheet draws three (Q3) |
| The tiny brass bell (13 to 15) | REUSE `callbell` (props-desk.js) | scale 1.15: 0.104 across, 0.079 high, base `#3b2a20`, dome `#c9a23c`. On the tin plate at (0.286, 0.432, -0.138) from the cut into C13, top at 0.511. `press` 0 to 1 under the slap. The slap is the kind's own proven hold: `grips.rest(c, "mash", "R", spec, [0, 0], t, { top: 0.079 })` |
| Sunbeam (14) | REUSE `lightbeam` (props-notyet.js) | from the window (1.25, 1.66, -1.74) to the candle (0.37, 0.64, -0.25): `len 2.01`, `w 0.45`, `color "#ffd9a0"`, `glow` 0 to 0.8 over 1.5 s in C14a. The builder of task B finds the rot and tip on the bench |
| Dust off the beam (03, 10) | REUSE `dustmotes` x 2 | "beamdust": `n 60`, `box [1.8, 1.5, 0.5]` about (0.50, 1.30, -0.70), `burst` 0 to 1 in 0.3 s on each shake, then `puff` to 1 over 2.5 s. "holedust": `n 40`, `box [1.2, 0.9, 1.0]` about (-0.40, 0.45, -0.70), burst on the impact frame |
| Loose shards round the hole (10 on) | REUSE `debris` | items [x, z, type, rot, size]: (-0.86, -0.50, plank, 35, 0.22), (-0.10, -1.12, plank, -60, 0.18), (-0.72, -1.05, chip, 10, 0.08), (0.02, -0.30, chip, 80, 0.07), (-0.55, -0.22, plank, -15, 0.16), (-0.90, -0.85, chip, 45, 0.06); `puff` 0 until the impact frame, then 1 |
| Water hits | REUSE `splash` (props-shark.js) x 2 | on Spud's crown (-0.25, 1.05, -1.13) in C06, on Mash's belly (0.90, 1.00, -0.60) in C08b; `puff` 0 to 1 in 0.5 s |
| Spud dripping (06) | REUSE `drips` (props-okilied.js) | `wear: "spud"`, 6 beads, drops from his leaf tip, both elbows and the hem; `on` 1 from the dump to the cut into C07 |
| Sounds in the kit | built in | `slam` (door), `slap`, `tink` (nail on tin), `ding` (the bell), `splash`, `creak` (rope), `sizzle` (flame on hemp), `impact` + `rumble` (anvil), `step` (boots). NOT in the kit: a rooster's crow, a snore, a dog's bark, shutters clattering, a fly: the director looks in the `assets/sfx` packs or asks |

Looked at and not reused: `pillarcandle` (0.085 tall on a brass dish: it cannot melt or carry a nail; its flame build IS reused), `dinnerplate` (white china with a blue band, no colour key), `bucket` and `sandbucket` (a trick-or-treat pail, red metal with sand), `bedframe` / `tipmattress` / `plaidbed` / `bed` (modern, built for a sitter or a cat: a lying sleeper needs his own blanket shape, clip-lessons "build the right prop first"), `norserope` / `ropeline` / `bridgerope` (each is one fixed rope scene), `crow` (black, 0.24 tall; its keys are the model for the rooster's), `door` / `doorway` (a modern casing with daylight), `krampuslane` (snow, and house numbers = lettering), `sunbeam` (a 0.06 sliver through a board gap).

### 2.1 NEW `alarmhut`: the whole shell (file A). Origin: the world origin

| Part | Numbers |
|---|---|
| Floor | 20 boards along z, each 0.23 wide, x -2.30 to 2.30, z -1.80 to 4.60, 0.03 thick, top y 0. Five browns from a fixed table: `#7a5636 #6e4c2f #84603d #5f4128 #8a6844`, gaps 0.006 `#2a1a10`; grain, two nail heads at each board end and 9 knots painted once (one canvas 2048 x 2048). 14 straw wisps `#c9a85a`, 0.06 to 0.14 long, lying on it |
| Key `hole` 0 or 1 (switch at 0.5) | the four boards under x -0.78 to -0.02 are built in three pieces each, so the middle pieces inside the ragged 11-point outline (r 0.30 to 0.38 about (-0.40, -0.70)) can go. At 1 they are hidden, 9 splintered stubs 0.10 to 0.26 long stand up from the rim at 20 to 55 degrees (pale broken ends `#b89468`), and the pit shows: an open box 0.90 x 0.90 x 0.55 deep, walls `#1c120b`, earth `#2a1d12` |
| Walls | vertical planks 0.24 to 0.30 wide (17 on the back wall, uneven), 2.50 high: `#8b6240 #7d5636 #93694a #74502f`, joints `#4a3220`, one rail 0.10 tall at y 1.05 `#5c3f27`, corner posts 0.14 square `#4f3521`. Back wall one canvas 2048 x 1024, each side wall 1024 x 1024, each painted once. Side walls run to z 4.60 |
| Ceiling and beam | planks at y 2.50 `#3c291a`; 5 rafters 0.08 x 0.10 along z at x -1.8, -0.9, 0, 0.9, 1.8 `#33221a`. Beam (section 1) `#3a2616`, 40 adze strokes `#2a1a0f`, 2 long cracks, rope-worn grooves at x 0.32 and x 0.90 |
| Door | casing 0.09 `#4f3521`, lintel 0.12. Leaf 1.13 x 1.68 x 0.05: 5 planks `#6b4a2c`, a Z brace, 2 iron strap hinges 0.34 long `#2b2b30`, a wooden latch. Key `door` 0..1 = 0 to 105 degrees into the room (its free edge ends near (-1.42, -0.71)); up to 1.08 for the bang's overshoot |
| Keys `doorlight` 0..1, `shadow` 0 or 1 | an opaque patch 0.002 over the boards from the threshold: 1.15 wide at the door, 1.90 wide 2.40 into the room, growing along its length with the key; colour by `dawn`: `#6f80b8` at 0 (the moonlight behind the boss), `#ffb86b` at 1. `shadow` 1 puts the boss's outline in it in `#3a2a1c`: an egg 0.86 wide with his three locks, stretched to 2.0 long, its head end at (-0.30, 0, 0.05) |
| Key `dawn` 0..1 | also tints the lane ground outside (section 4) |
| Window | frame 0.07 `#4f3521`; sill 0.74 x 0.06 x 0.16, 0.10 of it into the room; 2 shutters 0.31 x 0.62 x 0.03 (3 planks, 2 battens) flat on the wall at x 0.63 to 0.94 and 1.56 to 1.87 |
| Outside | level ground y 0, x -10 to 10, z -1.86 to -16: grass `#4d6a3f`, a dirt lane 2.4 wide `#7a644a` from the door to (-1.2, -16), 9 stones, 12 tufts |
| Dressing, so no wall is bare | a shelf plank x 0.05 to 0.60 at y 1.30 on the back wall with 2 small jars and a wooden bowl; a coil of spare rope on a peg at (-1.55, 1.45) (the rope's plant); a hay fork leaning in the corner (2.10, -1.65); a rush mat 0.9 x 0.6 at (1.35, 0, 1.00) |
| Budget | 9 000 triangles. Solid for the checks except the light patch |

### 2.2 NEW `alarmview`: the painted sky and village, unlit (file A)

The sky is the clock, so it must sit in the window from every lens. A real village outside would slide out of a 0.62 window with each camera change; a painted card that the director re-centres on every cut does not.

| Part | Numbers |
|---|---|
| `mode "window"` | card 1.6 x 1.6, origin its centre, faces +z, parked at (1.25, 1.66, -2.60). On every cut the director sets its x and y to: window centre + k x (window centre - lens), k = 0.80 / (lens z + 1.80). Lens (0, 1.5, 3.0) gives (1.46, 1.69) |
| Painting (from the card's centre) | sky gradient; a ridge of 5 thatched roofs, tops between y -0.14 and -0.02, walls down to -0.80, 0.22 to 0.34 wide; 7 window squares 0.035, each with 2 shutter leaves; a crescent moon r 0.055 at (-0.16, +0.15), 14 stars; the sun, a disc r 0.07 at x +0.05. The window shows about 0.72 of it: roofs in the lower 40 %, the moon upper left, as drawn |
| Keys | `dawn` 0..1 (three palettes at 0, 0.5, 1, mixed linearly: section 4). `sun` 0..1: disc centre from y -0.22 to +0.03 (hidden behind the ridge to 0.4, its rim over it at 0.5, clear at 1). `woke` 0..1: window i of 7 lights and its shutters swap from shut to open when woke passes (i + 1) / 8; at 0 only window 3 is lit |
| `mode "lane"` | card 20 x 12, origin bottom centre, at (-1.2, 0, -16): the same palettes; 2 huts left and 2 right (walls 2.0, ridges 3.2 to 3.6), a 6 m gap of open sky down to low hills (y 0.4) between them; the sun rises in the gap at x +0.8. Seen through the door (C01, C15) and through the window in C11 (the director hides the "window" card for that shot) |
| Budget | 2 000 triangles, canvases 1024 x 1024. Steam for the checks |

### 2.3 NEW `strawbed` x 2 and `claypot` x 3 (file A)

`strawbed`: origin the floor under its middle, long side along z, head toward -z. 1.10 wide, `len` 1.88 (Mash) or 1.70 (Spud). Frame `#6b4a2c` with peg ends: 4 posts 0.09 square (head 0.62 tall, foot 0.42), side rails 0.07 x 0.12 with their top at 0.16, head board 0.50, foot board 0.26. Mattress: a straw sack `#b9a06a` 0.12 thick, top y 0.28, 22 straw ends `#d9bd6a` out of 3 seams. Blanket: patched wool, ground `#6f6a8a`, 9 patches drawn once (`#8a4a3c`, `#b98a4a`, `#4f6a7a`, `#7a5a7a`, `#9a8a6a`, sizes 0.14 to 0.30, none square), stitches `#e7dcc0`. 5 000 triangles each.

| Key / spec | Numbers |
|---|---|
| `shape "lie"` (Mash's, centre (1.10, 0, -0.84)) | a straw ramp from local z +0.405 rising 30 degrees to y 1.05 at the head board, a bolster roll r 0.11 across it at local z -0.72. Blanket at `tuck` 1: a shell 0.025 off a body 0.54 wide and 0.50 deep lying up the ramp with its feet at local (-0.20, +0.54), from the feet to 0.60 along the body (his mouth is at 0.71), its top edge a rolled fold |
| `shape "sit"` (Spud's, centre (-1.15, 0, 0.65)) | no ramp, a flat pillow sack at the head. Blanket at `tuck` 1: flat over the foot half and a ring of folds round a sitter 0.76 x 0.66 at local (0, -0.20), its top at y 0.52 |
| `tuck` 1 to 0 | two blanket meshes, swapped by scale in 3 frames. At 0 it lies thrown onto the foot third in 3 fat folds, top y 0.42 |
| `wet` 0..1 | blanket colours x 0.72, 6 glossy runs and 5 drops hanging off the near edge (by scale) |

`claypot`: one lathe, origin bottom centre, `s` scales it. At s 1: 0.62 tall, belly r 0.30 at y 0.30, neck r 0.17, rolled rim r 0.20; `#9a5a3a`, shade `#6e3d28`, 2 incised lines at y 0.42, one chip in the rim, soot at the foot. P1 s 0.85 (0.53 tall, r 0.255) at (-0.06, 0, 2.02): Spud's cover in panel 09 (it stands on the line from the C09 lens to him); under the frame of every other front lens, and at the bottom edge of C01. P2 s 0.7 at (2.00, 0, -1.30). P3 s 0.5 at (1.80, 0, -1.00). 600 triangles each.

### 2.4 NEW `beamrope` x 3: one per round, shown on the cuts (file B)

Hemp `#b9975a`, shade `#7d6236`, 0.024 thick, a strand mark every 0.012. Origin: the world origin (its points are absolute). 2 500 triangles each.

| Spec / key | Numbers |
|---|---|
| Shape | a straight load leg from `load` up to the beam's underside at (`xa`, 2.05, -0.70); one wrap round the beam; a run along the beam's top to `xb` sagging 0.03 between 3 contact points; a wrap; a straight tail leg down to `tail`. With a `bridle`: the tail ends in a knot r 0.03 at `knot` and two strands 0.014 thick go from the knot to two iron staples on the stool's top at (0.27, 0.425, -0.25) and (0.47, 0.425, -0.25), so the flame stands under the knot, between them. The tail leg slants 0.45 toward the lens on its way down from the beam: straight on screen from the front |
| `pull` 0 to 0.30 m | the tail end goes down by it, the load end up |
| `slack` 0..1 | the load leg hangs in a curve (the trip line before the pull) |
| `burn` 0..1 | 0 to 0.5: the knot darkens to `#3a2a1c`, 3 fibres curl. 0.5 to 0.9: an ember ring `#ff8a2a` creeps round it and a thread of smoke rises 0.25. At 1 it parts |
| `snap` = seconds since it parted (tween linearly) | the upper part whips up and over the beam under the load's weight, gone from the tail side in 0.25 s, its free end swinging 0.3 m at 2 Hz, damped; the two strands drop onto the stool |
| R2 (06) | load = the bucket's rim ring, xa 0.55, xb -0.25, tail end (-0.25, 0.30, -0.70), no bridle: Spud's gloves hold it at y 0.55 and 0.47 |
| R3 (07, 08) | load = the bucket's rim ring (the trip line), xa 0.62, xb 0.37, knot at (0.37, 0.85, -0.25): 0.04 over the flame tip at burn 0.25 |
| R4 (09) | load = the anvil's ring (-0.40, 1.65, -0.70), xa -0.40, xb 0.37, knot at (0.37, 0.80, -0.25) |

### 2.5 NEW `waterbucket` and `mouthjet` (file B)

`waterbucket`: origin = its top pivot on the beam's underside, so `swing` turns the whole thing about it. At (0.90, 2.05, -0.70) in rounds 2 and 3. `hang 0.25` (a rope from the pivot to the bail's apex): apex 1.80, rim 1.68, underside 1.42. Bucket: 12 staves, r 0.16 at the rim and 0.13 at the bottom, 0.26 tall, `#8a6238` and `#6b4a2c`, 2 iron hoops `#3a3a40` 0.02 wide at 0.05 and 0.20; a rope bail from two ear pins only 0.09 above the bottom (under the full bucket's weight: that is why it flips when the trip line goes) to the apex 0.12 over the rim; a ring on the rim's -x side for the trip line. 2 500 triangles.

| Key | Numbers |
|---|---|
| `fill` 0..1 | a water disc `#8fc4dc` with 2 highlight arcs `#dff1f8`, 0.03 under the rim at 1, staying level up to 25 degrees of swing; scale 0 at 0 |
| `swing` degrees | about the pivot, along x. Round 2: 0, -30, +40 (over Mash, nothing spills), -55 (centre then at (0.49, 1.76)), then damped |
| `tip` 0 to 180 degrees | about the ear pins, mouth toward -x. Round 2: to 115 at the left apex. Round 3: 0 to 180 in 0.35 s when the line parts; then it hangs upside down, swinging 6 degrees each way, damped |
| `pour` = seconds since the water left (tween linearly) | 24 cel blobs r 0.02 to 0.05 and one ribbon leave the rim over 0.35 s at 1.6 m/s along the mouth's axis, on ballistic paths (g 9.8), ending on `hitY` (1.02 = Spud's crown; 0.97 = Mash's blanket) in a crown of 10 drops; all gone at 1.1 s. From the left apex the water lands at x -0.11 to -0.30: on Spud |

`mouthjet`: `wear: "mash"`; the kind places itself at his mouth (body frame (0, 0.71, 0.235)) and builds the jet along WORLD up, whatever his pitch. A column r 0.016 to 0.028, 0.35 x `h` tall, a crown of 9 arcs falling 0.10 to 0.16 out and 0.12 down, 14 drops; `#8fc4dc`, light `#dff1f8`. Keys `on` 0 or 1, `h` 0..1; its height breathes with the snore: x (0.75 + 0.25 sin(2 pi 0.45 t)). Steam for the checks. 800 triangles.

### 2.6 NEW `anvil` (file B)

Origin: the centre of its base. Black iron `#2b2b30`, top face and horn edge `#55565e`, one painted highlight streak `#8a8c96`, 11 rust flecks `#5a3a2a` drawn once. 0.56 long (the horn 0.20 toward -x, the heel 0.10 toward +x), top face 0.30 x 0.13, waist 0.11, base 0.26 x 0.20, 0.34 tall, an iron ring r 0.03 on the top's middle. At (-0.40, y, -0.70). 900 triangles.

| Key | Numbers |
|---|---|
| hanging | base at y 1.28, ring at 1.65, 0.40 of rope to the beam; a sway of 1 degree from t. It hangs over the bare floor, 0.95 from the sleeper: never over anyone |
| `fall` = seconds since release (tween linearly) | base y = 1.28 - 4.9 t squared: the floor at 0.51 s, on through it to rest at 0.59 s with its base at y -0.44 (its top 0.10 under the boards), tipped 14 degrees, two frames of 0.01 bounce |
| the frame `fall` passes 0.51 | the director sets hut `hole` 1, debris `puff` 1, holedust `burst` 1 and a camera shake of 0.05 for 8 frames |

### 2.7 NEW `nailcandle` and `tinplate` (file B)

`nailcandle`: origin bottom centre, at (0.37, 0.42, -0.25) on the stool. Tallow `#f3ead2`, shade `#d9cba6`, r 0.03, height = 0.40 - 0.26 x `burn`. A melted lip and a pool dip on top, a wick 0.012, 7 wax runs down the side growing with `burn` from 0.02 to 0.12, a foot of spilled wax growing from r 0.035 to r 0.045 (the bell's plate comes within 0.04 of the axis). Both nails point along D = (-0.6, 0, +0.8): toward the open floor and the lens, where your hand can reach. The flame is the kit's `flameMesh` + `glowMesh` riding the top (as `pillarcandle`, flame 0.045 tall). 1 800 triangles.

| Key | Numbers |
|---|---|
| `lit` 0..1, `bend` -1..1, `flare` 0..1 | the kit flame's own; `bend` 1 to 0 over 1 s at frame 0 (the door's gust) |
| `burn` 0..1, the second counter | 0 at frame 0 (0.40 tall); 0.25 in C07 (0.335); 0.45 in C09 (0.283); 0.72 to 0.80 inside C12a (0.213 to 0.192); 0.82 in C13 (0.187); 0.955 at the DING (0.152). It only moves inside C12a and C14a; otherwise it steps on cuts |
| nail A (the plant): `nailA` = seconds since it let go, 0 = stuck | iron `#3a3a40`, head `#55565e`, 0.13 long, shaft r 0.004, head r 0.011. In the side from frame 0, 0.162 above the base, pointing along D, 0.035 of it in the wax. Let go when `burn` passes 0.80: it droops 20 degrees for 0.12 s, slides out at 0.5 m/s and falls on a ballistic path (g 9.8) clear of the stool's rim (0.24 from the candle's axis that way), 0.58 m down onto the floor plate at (0.17, 0.012, 0.03) at about 0.47 s, one hop of 0.02, then lies still |
| nail B (yours): `nailB` -1 absent, 0..1 pushed in, above 1 = 1 + seconds since it let go | 0.152 above the base, pointing along D. At 0 only its tip touches the wax, at 1 it is 0.035 deep, its head 0.125 from the axis: over the bell's dome, 0.015 short of its centre. Let go when `burn` passes 0.955: it tips for 0.10 s, falls 0.06 m straight down, its head strikes the dome near its top at 0.21 s, skips once and lies on the plate. No hold: Spud's glove only rests on its head while the key goes 0 to 1 |

`tinplate`: one lathe, origin bottom centre, r 0.10, rim 0.012 high, flat middle r 0.07; dull tin `#9aa3a8` (metalness 0.5, roughness 0.45), a darker ring `#7d868b`, 3 dents. ONE prop: on the floor in front of the stool at (0.17, 0, 0.03) to the end of C12c, on the stool at (0.286, 0.42, -0.138) from the cut into C13 (moved off screen, like the hoists). 300 triangles.

### 2.8 NEW `rooster` and `fly` (file C)

`rooster`: origin the floor between its feet, facing +z. 0.42 tall to the comb, 0.17 wide, body 0.30 long, tail sickles 0.22 behind and up to 0.40. A real bird (story.md: real proportions, small real eyes, one continuous skin): head 0.06, eye r 0.006 `#1a1208` in an amber ring `#d98a1e` with a lid; a 5-point comb and wattles `#c8372d`; beak `#e6b84a`; about 120 pointed hackle locks `#e08a2e` to `#f0b24a` at the tips; breast and body `#8a4a22`; wing coverts `#6b3518` barred `#3a2414`; 7 tail sickles `#1f5a44` with a sheen line `#2f8a6a`; scaled legs and toes `#d9a53a`. Locks merged into one feathered skin. 6 000 triangles.

| Key | Numbers |
|---|---|
| `crow` 0..1 | neck up 0.05, head back 35 degrees, beak open 28 degrees with a red tongue, chest +8 %, tail fanned 20 degrees; at 1 a shiver of 0.004 at 4 Hz from t |
| `sleep` 0..1 | legs fold, body sinks 0.11, the head turns back onto its shoulder, lids shut, a breath swell of 0.01 at 0.4 Hz from t |
| `flap` 0..1 | wings spread, beating at 9 Hz from t while above 0 |
| `peek` 0..1 | neck 40 degrees forward and down, head cocked 20 degrees |
| `walk` 0..1, `headY` -1..1, `lid` 0..1 | legs step and the head bobs; 75 degrees each way; the lid alone |
| Carried once (C04a) | `grips.box`, both gloves on its flanks, SIZE `rooster { w: 0.17, h: 0.20, d: 0.30 }`, `sleep` 0.35 (legs half tucked), its centre at y 0.30: the comb tops out at 0.54, 0.3 in front of Spud and 0.05 under his mouth from the C04a lens |

`fly`: body 0.022 long `#141418`, a head with 2 dark red eyes `#5a1a1a`, 2 wings 0.014 `#cfd8e6`. Key `buzz` 0..1: the wings flip between two poses every frame while above 0. Twice life size on purpose (38 px in C02). Moved by x, y, z tweens: it is alive, not thrown. 120 triangles.

## 3. Cast marks per panel (starting marks: run `qa/clear.mjs`)

Mash's three poses (he rides his bed the `lyingbag` way: `ride` with an `off`, then the angles; eyes shut = `face { lid: 1 }`):

| Pose | Numbers | Gives |
|---|---|---|
| SLEEP (01 to 09, 11 to 13, and again after the slap) | feet point (0.90, 0.50, -0.30), yaw -12, pitch -60; lids 1; mouth open 0.35 to 0.60 at 0.45 Hz (the snore); both arms under the blanket `{ o: [-0.02, 0.30, -0.12] }`; headphones stay on | eyes near (0.90, 1.13, -0.94), mouth (0.90, 1.06, -0.80), crown about 1.30 at z -1.55: 0.23 off the wall, 0.05 under the sill |
| SIDE (10 only) | feet point (0.72, 0.50, -0.30), yaw -90, lean +60, pitch 0; lids 1, curve 0.4 | on his side at the bed's edge, face to the room: eyes near (0.50, 0.94, -1.05). A pose swap on the cut into C10, never tweened from SLEEP (the path between the two wobbles) |
| UP (14, 15) | feet point (0.90, 0.14, -0.30), pitch 0, yaw -12 | eyes 1.01, mouth 0.85, crown 1.52. The sit-up: pitch -60 to 0 and y 0.50 to 0.14 in 6 frames, ease `back`, bed `tuck` 1 to 0 in the same frames: his head swings 1.3 m toward the lens |

Spud's marks: BED (-1.15, 0.14, 0.45) · D (-0.55, 0, -1.40) inside the door · S1 (0.12, 0, -1.20) at the bedside · S2 (-0.25, 0, -1.13) behind the rope · S6 (-0.20, 0, 0.42) on the floor by the stool · S5 (-0.10, 0, 1.38) behind pot P1, 0.055 off its belly · S7 (0.02, 0, 0.36) at the candle. The boss: B1 (-0.55, 0, -1.30) · B3 (-0.55, 0, -2.10).

| Panel | Spud (you) | Mash | Boss, rooster, fly |
|---|---|---|---|
| 01 | BED, sitting bolt upright in the blanket's ring, yaw +10, `shocked` (open 0.1 while nobody talks), one squash 0.05 at frame 0 | SLEEP | boss at B1, yaw +10, `angry` with `set { curve: -0.4, open: 0.1 }` (his own resting grin must not show), right arm `point` into the room, a 0.03 lean on "BOTH"; steps back to B3 and the door slams at 3.55 s. Door `door` 0.6 at frame 0, 1.06 at frame 3, 1 at frame 8 |
| 02 | out of frame (he gets up across the cut) | SLEEP. At 6.6 s his RIGHT glove comes out over the blanket's fold and slaps flat between eyes and mouth (body frame (0, 0.79, 0.26)), holds 12 frames, sinks back. The director writes the `face-covered` window with this reason | fly: circles 0.25 over his face from 4.1 s, lands at (0.90, 1.105, -0.865) at 4.9 s, walks 0.03, gone under the glove |
| 03 | S1, yaw +55, lean +8. Yells (open to 0.9 on "UP"), then both gloves on the blanket over his flank at (0.62, 0.80, -0.95): rest pins, no grip, 5 shoves in 1.6 s | SLEEP, rocking: lean 4 degrees each way at 3 Hz for 1.6 s, curve 0.5 (smiling, as drawn) | camera shake 0.02, beamdust `burst` |
| 04 (carry) | walks D to (-0.15, 0, -1.05), yaw +70, the rooster in both gloves (`grips.box`), its centre at y 0.30. THE one carry: in his gloves at the cut in, the shot cuts before he lets go | SLEEP | rooster `sleep` 0.35, `headY` moving |
| 04 | S1, yaw +55, gloves clasped at his chest `{ o: [0.05, 0.42, 0.24] }`, `eager`; flinches at the crow | SLEEP, unmoved | rooster on his forehead: feet (0.90, 1.23, -1.17), yaw -25. `crow` 0 to 1 in 0.2 s, held 1.3 s. Street `woke` 0 to 1 over 1.2 s behind it |
| 05 | S1, the `sigh` macro: deadpan, sprout drooped, squash 0.04 | SLEEP. His LEFT glove swats at the bird's feet (body frame (0.10, 1.02, 0.24)), `slap`, sinks back | rooster `flap` 1, flutters 0.8 s on its own to his belly: feet (0.90, 0.90, -0.43), yaw -40, then `sleep` 0 to 1 in 0.8 s; it stays there through 06 and 07 |
| 06 | S2, yaw +20, both gloves already on the R2 tail at (-0.25, 0.55, -0.70) and (-0.25, 0.47, -0.70). THE one pull: 0.25 down in 0.2 s (`pull` on the rope). At the dump: `shocked`, squash 0.08, `splash`, then `drips`; he lets the rope hang (re-grab rule: both gloves leave on the cut out, never one alone) | SLEEP; one drop on his brow at the right apex, nothing else | bucket: `swing` and `tip` as section 2.5 |
| 07 | S6, sitting on the floor, yaw +30, both arms `cheeks` (chin on his fists), `eager` at 0.6, pupils up right on the flame; at 36.0 s his lids sink to 0.4, at 36.9 s they snap open | SLEEP | rope R3 `burn` 0 to 0.6 |
| 08 | S2, yaw +45: `shocked`, then a slow blink at the fountain | SLEEP, soaked: bed `wet` 0 to 1 in 0.3 s. `mouthjet` on from 39.5 s, his mouth open 0.7 | rooster on the floor at (1.95, 0, 0.55) from the cut in (out of frame) |
| 09 | S5, crouch about 0.2 so only his eyes and leaf show over P1's rim; gloves down behind the pot (the rim is 0.58 from his shoulders: no hands on it, unlike the sheet); `terrified` at 0.5 with `set { open: 0.1 }`, pupils up on the anvil, a duck of 0.05 when the knot glows | SLEEP | anvil hanging; rope R4 `burn` 0.5 to 1 |
| 10 | out of frame, still at S5 | SIDE, settling with one squash 0.04 on the impact frame | rooster walks 0.5 m from (0.30, 0, -1.30) to the rim at (0.22, 0, -0.80), yaw -90 (profile), `peek` 0 to 1. Hidden from the cut into 11 |
| 11 | nobody inside in frame (Mash's leaf at most) | SLEEP from this cut | boss walks the lane from (-1.2, 0, -10.5) to (-0.2, 0, -6.5) in 2.8 s (1.47 m/s, about 6 heavy steps), `stern`, level ground only |
| 12 | S6, slumped: yaw +30, squash 0.08, lean -6, sprout drooped, eye 0.45. At the TINK: eyes 1.2, pupils down right on the plate; then up at the candle; `acting.idea` on the line | SLEEP; in C12b his right eye opens to 0.25 for 0.8 s (`face { lid: 0.75 }` on that eye), then shuts | |
| 13 | S7, pitch +10, his LEFT glove in a `pinch` on nail B's head: a rest pin that follows `nailB` 0 to 1 over 1.4 s. No prop is held | out of frame | |
| 14 | C14a: at S7, the glove comes back, fists at his chest, he does not blink. From the cut into C14c: S6, both arms `up` at 66.5 s, one hop 0.12, `delighted` | SLEEP until the DING; UP at 66.0 s: lids 0, eye 1.3, pupil 0.7, open 0.5 | callbell `press` 0; the nail rattles on the dome (three small dings) |
| 15 | S6: arms come down in 0.4 s, `shocked` to `deadpan`, pupils on the bell, then on the door | UP, lids sinking to 1 by 69.9 s. At 70.1 s he leans 20 degrees toward the stool and his RIGHT glove slaps flat on the bell (`grips.rest`, top 0.079; bell `press` 1), holds 8 frames. Then the flop: back to SLEEP in 9 frames, `tuck` stays 0, one squash, snore | door `door` 0 to 1.06 to 1 from 73.2 s, `doorlight` 1 and `shadow` 1 with it; boss at B3, `stern`, arms at his sides |

Hands that touch a prop: 3 (the rooster carry, the rope pull, the glove on the nail's head) plus 2 palm slaps on rest pins (fly, bell). Hoisting the bucket and the anvil, setting the rooster down, moving the plate and bringing the bell all happen between shots.

## 4. Sky and light per panel

One number, `dawn`, drives the painted card (both modes), the lane ground and the door's light patch; it steps on cuts except where a time is given. The candle is `lit` 1 from frame 0 to the last frame and is the only warm thing at night.

| `dawn` | Sky top / middle / over the ridge | Roofs / walls / lit windows | Moon, stars, sun | Lane ground x | Grade key (try) |
|---|---|---|---|---|---|
| 0 night | `#0b1026` / `#16204a` / `#243368` | `#0e1430` / `#141a38` / `#ffc96b` | crescent `#f4f1dc`, 14 stars `#cfd8ff` | `#5c6ea8` | `{ tint: "#9aa8dc", s: 0.85 }` |
| 0.5 first light | `#1b2a5e` / `#3d4f8f` / a band 0.10 tall `#e8c9b0` fading up into `#8f8fb5` | `#1a2044` / `#232a52` / `#ffd27a` | moon gone (scale 0 from 0.3), 4 stars | `#8f94b8` | `{ tint: "#b3b9de", s: 0.9 }` |
| 1 sunrise | `#6f5b8f` / `#f08a4b` / `#ffc15a` | `#4a2f33` / `#6b4638`, thatch rim `#ffb060` / none lit | no stars; sun `#ffe08a`, halo `#ffd27a` | `#ffd2a6` | `{ tint: "#ffd9b3", s: 1.0 }` |

| Panels | `dawn` | `sun` | `woke` | Other light |
|---|---|---|---|---|
| 01 | 0 | 0 | 0 (one lit window) | `doorlight` 1 while the door is open: the moonlit patch `#6f80b8` round the boss; candle `bend` 1 to 0 in 1 s |
| 02, 03 | 0 | 0 | 0 | |
| 04 | 0 | 0 | 0 to 1 over 1.2 s from 17.2 s: seven windows light, shutters fly open | |
| 05 | 0 | 0 | 0.6 | |
| 06 to 08 | 0 | 0 | 0.25 (they went back to bed) | rope ember `#ff8a2a` in C08a |
| 09, 10 | 0.5 | 0 | 0.25 | the first-light grade from the cut into C09 |
| 11 | 1 | 0.35 to 0.5 over the shot | 0 | the sunrise grade from the cut into C11; the "lane" card behind the boss, the "window" card hidden |
| 12, 13 | 1 | 0.5 (a rim over the roofs) | 0 | |
| 14 | 1 | 0.5 to 1 over 1.5 s in C14a | 0 | `lightbeam` `glow` 0 to 0.8 in the same 1.5 s; grade to `{ tint: "#ffe6c4", s: 1.05 }` over it |
| 15 | 1 | 1 | 0 | at 73.2 s `doorlight` 1 in `#ffb86b` with the boss's `shadow` |

## 5. Lines to cameras: the cut list (seconds; the measured lengths decide)

35.88 s of speech in 73.9 s. No two voices overlap; Spud's yell starts 0.51 s after the narrator ends and the narrator comes back 0.31 s after him. Every line starts inside the shot it belongs to.

| Shot | From to | Line (start to end) | Action, on its frame |
|---|---|---|---|
| C01 | 0.00 to 3.90 | boss "Sunrise. Not one minute later. Or you're BOTH fired." 0.05 to 3.06 | frame 0: the door is already swinging, `slam`; flame bends; the push ends at 1.4 s on boss and Spud; door slams shut at 3.55 |
| C02 | 3.90 to 8.00 | narr "One problem. Mash never wakes up." 4.10 to 7.64 | fly lands 4.9; `slap` 6.6; snore under it all |
| C03 | 8.00 to 13.30 | Spud "Mash! Wake UP!" 8.15 to 9.49; narr "You yell. You shake. Nothing." 9.80 to 13.02 | shoves 9.8 to 11.4; dust 9.9 on; a snore answers at 12.4 |
| C04a | 13.30 to 16.20 | narr "So you borrow the loudest thing in the village." 13.45 to 16.09 | the carry; cut on his last step |
| C04b | 16.20 to 21.80 | narr "Now the whole village is awake. Except Mash." 18.65 to 21.62 | crow 16.45 to 17.95; `woke` 17.2 to 18.4; a dog barks 18.2 |
| C05 | 21.80 to 25.00 | none | `slap` 22.10; the bird lands 22.9; asleep 23.9; Spud's sigh 24.0 |
| C06 | 25.00 to 32.60 | narr "Water. Nobody sleeps through water." 25.20 to 27.84; "Wrong side." 30.60 to 31.67 | pull 28.00; swing left 28.25, right over Mash 28.95, left apex and tip 29.75; water lands 30.10 |
| C07 | 32.60 to 37.40 | narr "But you can't stay up all night. So the candle pulls the rope for you." 32.80 to 36.61 | `sizzle` from 35.0; lids sink 36.0, snap open 36.9 |
| C08a | 37.40 to 38.40 | none | `burn` 0.6 to 1; the rope parts at 38.25 |
| C08b | 38.40 to 43.00 | narr "He's not awake. He's a fountain." 40.00 to 42.12 | flip 38.45 to 38.80; water lands 38.95; fountain from 39.5 |
| C09 | 43.00 to 46.50 | narr "Fine. Something heavier." 43.20 to 44.99 | `creak`; ember at the knot from 45.0; it parts at 46.37; cut 4 frames into the fall |
| C10 | 46.50 to 50.60 | narr "...Too heavy." 49.00 to 49.97 | the anvil crosses the frame, floor at 46.88: `hole`, shake, dust; silence to 48.0; one snore; the rooster walks in 48.1 to 48.9 and peeks |
| C11 | 50.60 to 53.60 | narr "And the sun is coming up." 50.90 to 51.95 | boots on the lane, about 6 steps; `sun` 0.35 to 0.5 |
| C12a | 53.60 to 56.90 | none (the low point) | wax runs; nail A lets go 56.00; `tink` 56.47 |
| C12b | 56.90 to 58.00 | none | one eye opens 57.0 to 57.8, shuts |
| C12c | 58.00 to 60.40 | narr "So you stop going bigger." 58.40 to 60.12 | eyes to the nail, to the candle; the idea |
| C13 | 60.40 to 62.80 | none | `nailB` 0 to 1 from 60.7 to 62.1 |
| C14a | 62.80 to 65.40 | none | `sun` and the ray 62.8 to 64.3; `burn` 0.82 to 0.955 by 65.3 |
| C14b | 65.40 to 65.95 | none | nail B lets go 65.45; `ding` 65.66 |
| C14c | 65.95 to 69.60 | narr "You've invented the alarm clock." 67.00 to 68.92 | sit-up 66.00 to 66.20; arms up 66.5; his lids start to sink 69.0 |
| C15 | 69.60 to 73.90 | narr "...and he just invented snooze." 71.50 to 73.57 | `slap` on the bell 70.10; flop 70.60 to 70.90; snore 71.3; door bangs open 73.20; CUT 0.33 s after the last word |

The outline's 76 s had a longer silence after the anvil; add time only where something moves (the fountain, the rooster's peek, the ray crossing the room). Sound the director must ask Jonny to judge by ear: crow 16.45, the dump 30.10, the anvil 46.88, `tink` 56.47, `ding` 65.66, the bell slap 70.10.

## 6. Who builds what: three tasks, three files, nothing shared

Step 0, the director, before the builders start (so the three never meet in a shared file): three stub files with empty exports `ALARM_HUT_KINDS`, `ALARM_GAGS_KINDS`, `ALARM_ROOSTER_KINDS`, their six registry lines in `engine/page/props3d.js`, the SIZE row `rooster` in `storyboards/lib/grips.mjs`, the two door jambs in `engine/shared/obstacles.js`. After that no builder touches `props3d.js`, `grips.mjs`, `obstacles.js`, a cast JSON, a costume file, `potato.js`, `timeline.js` or another props file. The three run in parallel; each at most 3 fix rounds, then stop and report.

Every bench: `"frame"` tall, set `plain` with `floor "none"`, look `anime-pro`, castLook `sheet`, no music, no captions; one still per state plus one sequential `--draft` tail with 15 fps strips.

| Task | Files (disjoint) | Builds |
|---|---|---|
| A, the hut | `engine/page/props-alarm-hut.js`, `storyboards/series/how-you-invented/01-alarm-clock/bench/bench-hut.mjs` and its JSON | 2.1 `alarmhut`, 2.2 `alarmview`, 2.3 `strawbed`, `claypot` |
| B, the gags | `engine/page/props-alarm-gags.js`, `.../bench/bench-gags.mjs` and its JSON | 2.4 `beamrope`, 2.5 `waterbucket`, `mouthjet`, 2.6 `anvil`, 2.7 `nailcandle`, `tinplate` |
| C, the creatures | `engine/page/props-alarm-rooster.js`, `.../bench/bench-rooster.mjs` and its JSON | 2.8 `rooster`, `fly` |

DONE WHEN, task A:
1. Stills through the lenses C01, C04b, C10, C11 and C15 with the hut alone: no lens sees an end of floor, wall or ceiling, no wall is bare, no letter or digit anywhere.
2. Stills of `hole` 0 and 1 (the pit is dark, real depth, 9 stubs), `door` 0, 0.5, 1, `doorlight` with and without `shadow`.
3. Nine stills of the window card: `dawn` 0, 0.5, 1, each with its `sun` and `woke` steps; re-centred by the section 2.2 rule it stays in the window from the C04b, C09 and C14a lenses, roofs in the lower 40 %. The "lane" card fills the open door and the C11 window with no edge showing.
4. Mash on the bench in SLEEP, SIDE and UP in his bed, Spud in BED: no body through blanket, ramp, rail or boards; Mash's eyes and mouth free of the blanket from the C02 and C04b lenses; the Viking under the lintel with 0.20 over his hair.
5. The draft tail (`tuck` 1 to 0, `wet` 0 to 1, the door bang, `woke` 0 to 1) looks the same as the single stills.
6. `qa/preflight.mjs`, `qa/clear.mjs` and the layout give no FAIL; `qa/golden.mjs` and `qa/regress.mjs` no difference; the diff holds only this task's files. Budgets of section 2.

DONE WHEN, task B (bench: a 0.22 box at the beam's place, a kit `stool` at (0.32, 0, -0.20), a kit `callbell`, Mash lying at pitch -60 on a ramp box):
1. Stills of the three ropes R2, R3, R4; `burn` 0, 0.5, 0.9, 1; a strip of `snap`: the upper part leaves over the beam, nothing pops.
2. Strips of the bucket: round 2's swing and tip, round 3's flip; the water stays level while it swings, leaves only past 90 degrees of tip, and lands on `hitY`; nothing of the bucket passes the beam.
3. A strip of the anvil's `fall`: the floor at 0.51 s, rest at 0.59 s, no ease.
4. Stills of the candle at `burn` 0, 0.25, 0.45, 0.80, 0.955 with flame riding the top; strips of both nails: A clears the stool's rim and lies ON the floor plate; B's head meets the dome and never passes through it.
5. The jet rises along world up on a lying Mash and breathes; the `lightbeam` from the window point to the candle: its rot and tip written into the bench header for the director.
6. As A.6. Full-size crops of the knot, the nail in the wax and the bell under the nail: each reads at 360 px wide.

DONE WHEN, task C (bench: Spud at (0, 0), the bird beside him):
1. A four-view turnaround beside Spud: 0.42 tall, a real bird (small head, real eye with a lid, one feathered skin), no ball-and-toy-eye look.
2. Each key at 0 and 1 as stills; strips of `crow` (0.2 s in, 1.3 s held), `sleep` settling on a 30 degree slope, `flap`, `walk`, `peek`.
3. Carried by Spud with `grips.box` through a 1 m walk: no glove through the bird, the comb under his mouth from a lens at y 1.25.
4. The fly at 1.7 m with fov 36: it reads as a fly on a face crop.
5. As A.6.

## 7. Changed from the sheet, open questions (my default), risks

Changed from the sheet, each for a reason the engine gives:
- 11 is restaged THROUGH the window (Q1): the boss walks up the dawn lane inside the open window frame. The sheet's boot close-up needs an outside set for 3 s and boots he does not have (his own are plain black; the fur boots and the horned helmet are the sheet's, his look is the copper locks and fur mantle).
- Mash sleeps half propped at 30 degrees in every shot; a flat sleeper would show only his chin.
- 03: Spud stands at the bedside, gloves on the blanket; the 1.10 bed has no room to kneel beside Mash.
- 04: the rooster stands on the sleeper's forehead, not on the pillow (the pillow beside a lying potato's face is 0.5 m lower than the face); the outline's poke is cut.
- 06: the bucket hangs on its own short rope over Mash and Spud's rope is its trip line; he yanks, it swings and tips toward the puller.
- 09, 10: the anvil hangs over bare floor, 0.95 from the sleeper; his roll is a pose swap on the cut; no hands on the pot.
- 12, 13: the plate lies in front of the stool; 13 is the same short candle (the sheet draws a fresh tall one).
- 15: he slaps the bell while still sitting, then flops; the boss himself stands in the open door with his shadow on the floor (not a horned silhouette).
- The door is in the back wall (the sheet's text says left); Spud's bed is the left foreground; the stool has four legs.

Open questions:
- Q1 Panel 11: through the window (default), or the boots outside as drawn (a fourth builder task: an outside set and boots).
- Q2 Why is a nail in the candle: it is there from frame 0, a silent plant you can spot in 07 and 09 (default), or the anvil's crash shakes it off the beam into the wax (one 0.5 s insert, a stronger chain of cause).
- Q3 The stool: the kit's four legs (default), or a new three-legged one.
- Q4 The boss's axe: none (default: a boss at a door), or low in his left glove as on his own sheet.
- Q5 The last second: the door flies open with the boss in it on the last word (default), or only his shadow under a shut door.
- Q6 Mash is named twice (Spud's yell and the narrator) against story.md's no-names rule: as approved (default).

Risks:
- Everything is unrendered. First stills to make: Mash in SLEEP on the ramp (new for this body: tall, hoodie, headphones, pitched -60 while riding a prop) and his sit-up; if SLEEP fails after one round, fall back to pitch -45 on a steeper ramp.
- From the eye-level wides Mash's face is seen about 50 degrees off its normal (eyes and mouth only 50 to 60 px apart in C05 and C08b). The close shots C02 and C12b carry his face; if the wides read as a blob, raise those lenses 0.3.
- Portrait frame against a room 1.5 to 2.6 m wide: C01 and C15 hold three and four subjects at fov 54 to 56 (the boss about 480 px tall). C01 loses Mash after its push by design.
- The window card is re-centred by hand on every cut: a missed cut shows roofs sliding or the card's edge. A push inside a shot moves it by under 3 % of the window.
- The slap on the bell needs Mash's 20 degree lean (0.35 from shoulder to bell); without it the reach is 0.52.
- Four props carry their own designed falls (water, anvil, two nails) as ballistic paths inside the kind, not engine physics: each needs its strip judged, and the nails are 0.13 long (about 40 px in the wides: the inserts C13 and C14b carry them).
- Sounds missing from the kit (crow, snore, bark, shutters, fly) are the loudest beats of rounds 1 and 2.
- story.md asks for a 1.5 to 2 s hold after the last line; the brief cuts on the line (0.33 s). The brief wins; said here once.

