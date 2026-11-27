# Kid vs Dad 08 "Dad's jokes come true": design of the new pieces

Creative director, 27 Nov 2026. Target: the approved 15-panel sheet v1 (`kid-vs-dad-08-panels-v1.png`, opened and read panel by panel) and the starred options in `OPTIONS.md` (C1, jokes 1 to 5, H1, E1). Every size is computed from the cast files and the kit's header comments, not rendered: check each piece on a bench still. I had no shell: engine names were looked up by reading the code, so run `node tools/vocab.mjs --find <name>` once before building. Metres, floor y 0, +z toward the camera, +x screen right, hex colours. **K** = the `kitchenroom` origin = world (0, 0, 0). A potato's b = height above its underside. Tato (`spud-kid.json`): body 0.55 x 0.50 x 0.44, underside 0.14, stands 0.69, eyes y 0.445, mouth 0.39, arm roots y 0.33, face front z 0.216, a reach reads clean up to 0.65 from the arm root. Dad (`dad.json`): body 0.98 x 0.86 x 0.76, underside 0.20, stands 1.18 (leaves 1.25), eyes y 0.842, mouth 0.63, moustache y 0.56 to 0.69, arm roots y 0.74 at x +-0.40, belly front z 0.43, fist 0.105 across x 0.13 long, sock foot 0.155 wide x 0.086 high x 0.216 long. No letters or digits on anything; every hand is three fingers and a thumb; every "random" mark is placed once from a fixed table (no `Math.random`, no clock); no material opacity is ever tweened (keys change colour scale, size, draw length or visibility).

Sheet slips corrected, not copied: 04 has no sweat drops (steam and a flush only); 07 the sneakers are Tato's TINY red ones on Dad's big sock feet; 12 the room goes dim; 03 Dad's arm points AT the corner. A prop kind's name must not contain burst, puff, smoke, spark, glow, beam, zap, poof, steam, halo, rain, snow or ripple (`FX_KINDS` in `props3d.js` would make it air): the names below are clear of them.

## 0. Reused unchanged (no builder), and the kit switches

| Need | Use | Numbers |
|---|---|---|
| Storyboard base | episode 5's block: set `plain`, `night: true`, `floor: "none"`, `lighting: 2`, `physics: true` | one place, states by `lights` fx and `grade` keys (section 9) |
| Kitchen | prop `kitchenroom` at K | `fridge: false`, `lamp: 1`, time 2.75. Back wall z -2.30, tiles 0.50 pitch `#2f5e5c`, grout `#8fa8a2` (kept: one kitchen across episodes 2, 5, 6, 8; the sheet's bluer tile is not copied). Counter x -3.9 to +3.9, front z -1.58, top y 0.95. Window (0, 2.05), 1.60 x 1.15. No side walls, no ceiling: the wall ends at y 5.2 |
| Fridge | `openfridge` at K (1.35, 0, -1.78), rot 0, `scale: 0.75`, `open` 0, `lit` 0 all film | 0.675 wide (x 1.0125 to 1.6875) x 1.50 high. Door 0.645 x 1.11: x 1.0275 to 1.6725, y 0.36 to 1.47, front plane z -1.499. Why this kind: one door over a low drawer front with the handle on the left, as the sheet; the stock set fridge is split at y 1.32, has its handle on the right and no door to build on. Why 0.75: the sheet's fridge is 1.3 Dad crowns and 2.2 Tatos (1.50 = 1.27 and 2.17), and the top spot must be inside Dad's reach. Why x 1.35: beside the window (0.04 clear of its sill), so the moon and the top spot share one frame; the two counter jars at x 1.28 and 1.44 are swallowed inside it |
| Table, chair | `kitchentable` at K (-1.25, 0, 0.15), w 1.10, d 0.60, h 0.42; `chair` at K (-1.25, 0, 0.78), rot 180 | left of the stage, out of the master wide, in the moon wide |
| Plates, cups | 3 `plate` at table y 0.42: (-1.62, 0.02), (-1.25, 0.02), (-0.88, 0.02); 3 `teacup` `saucer: false`: (-1.50, 0.33), (-1.12, 0.33), (-0.84, 0.33) | the things that float (section 9) |
| Tato's step | `stepstool`, `h: 0.30` (0.50 x 0.34), at K (1.95, 0, -1.36) from frame 0 | against the cabinets right of the fridge; used only in panel 15 (section 2) |
| Steam, joke 1 | 3 `smokewisp`, `wear: "spud"`, `rgb: "255,250,240"`, alpha 0.5, h 0.42, size 0.045, n 7 | at his body frame (-0.19, 0.47, 0.04), (0.19, 0.47, 0.04), (0.05, 0.40, -0.16); `on` 0 to 1 in 0.5 s |
| Heat flush, joke 1 | 2 `blotch`, `wear: "spud"`, color `#ff5a3c`, size 0.07, alpha 0.5 | on his cheeks (+-0.115, 0.40, skin + 0.004), scale 0 to 1. Skin colour, not a symbol |
| Poof | fx `{ do: "poof", who, dur: 0.7, puffs: 26, sparks: 0, color: "#fff4dc" }` | `sparks: 0` (the sparkles are comic marks). Never the `zap` macro (it adds an impact frame and sparks). The swap lands 3 frames in |
| Camera flash | fx `flash`, dur 0.1, peak 0.5, with the camera's own `flash` key | a real flash, not a mark |
| Night fill | `moonlamp` at K (0.3, 2.4, 1.0), range 8 | `on` 0, 0.9 in the moon |
| Lights, grade | fx `lights`, `grade` keys | section 9 |
| Not used | `costume.beard` (`addBeard`), `gmoon`, `gmoonfall`, `gsky`, kit `sneaker`, `steamjet`, `steamhaze`, `pantryshelf` `wall` | the costume beard is static and ends at the belly; the gravity film's Moon is a sphere 2500 m away in a dusk palette and needs `far: 6000`; the kit sneaker is white with a stripe; the pantry wall comes with a shelf unit |

| Kit switch (default = today's picture) | File | What it does |
|---|---|---|
| `openfridge` `note: false` | `engine/page/props-fridge.js` | leaves out the blank yellow note (it sits in the top spot) |
| `openfridge` `handleY: [1.00, 1.50]` | same | the door bar's span in the kind's own metres (default [0.55, 1.15]), stand-offs 0.03 inside each end. At scale 0.75: K x 1.095, y 0.75 to 1.125, so the photo row runs the whole door width under it, as drawn |
| costume `shoes: "kidsneakers"` | `engine/page/costumes-dad.js` | section 6: sneakers instead of sandals; socks and rings stay |
| costume `toast: true`, `armSkin` | same | section 10: no polo, collar, sleeves, shorts, belt, holster; crust and browning instead; moustache, leaves, socks, sandals stay |

## 1. Floor plan, light, the master wide

| Who / what | K x, z | Notes |
|---|---|---|
| Fridge door | x 1.0275 to 1.6725, z -1.499 | section 0 |
| Dad, master mark | (0.25, -0.60), rot 10 | screen left, nearest the lens |
| Tato, master mark | (0.95, -0.95), rot -15 | in front of the door's left edge; no photos behind him yet in 01 |
| Dad, top-spot mark (05, 12) | (0.80, -1.02), rot 60 | side on: his LEFT shoulder to the door, LEFT palm flat on the photo, reach 0.62; the camera in his right hand at his chest |
| Tato, row mark for slot i | slot x - 0.45, z -1.08, rot 35 | RIGHT palm on the photo; his body covers only empty slots (section 2) |
| Hot corner | corner point K (-5.50, -2.30) | section 5; Tato at K (-5.00, -1.82), rot 20. Far left, reached by a cut after he walks out of frame; the counter ends 1.1 m right of him and stays out of the close-up |
| Dad pointing (03) | master mark | RIGHT arm `{ o: [-0.55, 0.62, 0.10] }`, hand `point`, fingertip on the line to K (-5.5, 1.0, -2.3); eyes follow |
| Beard (08) | Dad (0.0, -0.85), rot 55; Tato (1.80, 0.41) | 2.2 apart along Dad's facing (section 7) |
| Step, panel 15 | stool to K (1.10, 0, -1.22) on the cut | Tato on it side on, y 0.30, 0.03 clear of the door: arm root y 0.63, RIGHT palm on the top photo's lower third (y 1.19), reach 0.62. He stands in front of the two left slots; `b1` and `b2` show right of him, as drawn |

Lamp: `kitchenroom` `lamp: 1`; the evening state of section 9 (warm, as the sheet).

| Shot | Camera (pos, look, fov) | Must give (px at 1080 x 1920, computed) |
|---|---|---|
| Master wide (01, 13) | K (0.65, 1.05, 3.60), (0.80, 0.80, -1.20), 46 | Dad x 24 to 488, y 734 to 1404; Tato x 494 to 740, y 1020 to 1359; fridge x 629 to 925, top y 644; gold magnet at (779, 700), 58 px across (19 on a 360 px phone); the window's right two thirds at x 0 to 412, y 220 to 682 behind the caption band; no face above y 640 |
| Top spot insert (05) | K (0.95, 1.25, -0.20), (1.38, 1.27, -1.50), 34 | frame 0.47 wide at the door: photo 332 px, magnet 298 px, his palm, the handle's top at frame left |
| Ladder insert (09) | K (1.35, 0.875, 1.20), (1.35, 0.875, -1.50), 30 | frame y 0.15 to 1.60: the whole door, a photo 190 px wide (63 on a phone), the row at y 1182 to 1413 (above the app's bottom bar), the magnet at y 220 to 390, the caption under it on the blank door |
| Corner close (04) | K (-4.30, 0.62, -0.03), (-5.08, 0.42, -1.98), 40 | Tato 683 px wide, the corner line just left of him, both walls and no counter |
| Sneakers, low (07) | K (1.10, 0.22, 1.35), (0.45, 0.55, -0.80), 44 | Dad at (0.25, -0.55), a sneaker about 250 px long; Tato at (1.25, -1.35) small behind |
| Moon wide (12) | K (0.45, 1.55, 3.90), (0.45, 1.75, -2.00), 56 | frame 3.7 wide at the wall: window 466 px wide at x 176 to 642, y 707 to 1043; magnet at (841, 1080); the top edge at wall y 5.1 (under the wall's end) |

## 2. The ladder on the fridge door: `jokeladder`, file `engine/page/props-jokes-fridge.js` (01, 05, 06, 09, 11 to 13, 15)

One look-only prop placed at K (1.35, 0.36, -1.499), rot 0, scale 1. Own frame: origin the door's bottom centre on its front plane, x right, y up, +z out of the door; the door is x +-0.3225, y 0 to 1.11. The door never opens in this film, so nothing is parented: every slot is a fixed point.

| Part | Numbers |
|---|---|
| Gold magnet = the top spot | centre (0, 1.01): dome r 0.065, 0.028 high, on a base ring r 0.068 x 0.006 `#b8891f` whose underside floats 0.005 off the door (the top photo's upper 0.015 tucks under it). Gold `#f2c230`, metalness 0.75, roughness 0.3; one painted highlight disc r 0.016 `#fff3c4` at 0.35 r up and left, a lower crescent `#c9971f`. No sparkle |
| Small magnets, decor | 3 domes r 0.018, 0.010 high: red `#d8452e` (0.18, 0.62), blue `#3d7fd8` (0.13, 0.53), green `#4caf50` (0.22, 0.51). They hold nothing; photos stick where they are slapped |
| Named points | `top`, `b1` to `b4` (table below), 0.0025 off the door |

| Slot | Ladder x, y | K x, y | Lean | Joke |
|---|---|---|---|---|
| `top` | (0, 0.8725) | (1.35, 1.2325) | -2 | each new one; in the end the toast (+3) |
| `b1` | (0.236, 0.26) | (1.586, 0.62) | +4 | 1 corner |
| `b2` | (0.079, 0.26) | (1.429, 0.62) | -3 | 2 sneakers |
| `b3` | (-0.078, 0.26) | (1.272, 0.62) | +2 | 3 beard |
| `b4` | (-0.235, 0.26) | (1.115, 0.62) | -5 | 4 sandwich |

Why one row: Tato reaches y 0.45 to 0.85 only, and the sheet shows one row. It fills from the hinge side toward the handle, so the newest photo is always the one nearest Tato and his body never stands in front of a photo (section 12). The row's top (y 0.7075) is 0.04 under the handle; 0.44 of blank door separates it from the top photo.

| When | Photo | Hand |
|---|---|---|
| Dad ranks it (05) | at `top` from the first frame of the shot | his LEFT palm flat on it (rest pin, shape `flat`), off after 0.4 s |
| Tato moves it down (06, 11) | on the cut it is 0.12 above its row slot, leaning 9; it slides into the slot in 0.2 s and settles to its lean | his RIGHT palm on it from the first frame (rest pin), a push of `lean` 6. The pull-down itself is the cut, as drawn |
| Moon (12) | the moon photo at `top` | Dad's palm, head down (section 9); it drops with the crash, so `top` is empty in 13 |
| End (15) | the toast photo at `top` | Tato's RIGHT palm, from the step |

## 3. The photos: `jokephoto`, same file

Origin its centre, front +z. 0.145 wide x 0.175 tall x 0.003. Border `#f6f3ea`: 0.012 at the top and sides, 0.042 at the bottom; a shade line `#d9d5c8` 0.002 along its lower and right edges; picture 0.121 square; back `#2b2d33` with a paler frame `#44474f`. Dad's palm is 0.9 of its width, Tato's 0.7. Spec `pic` picks one 256 x 256 canvas, drawn once. Spec `loose: true` makes it a physics body (collider 0.012 thick); without it the photo is look-only and never a body (the door photos must not float).

| `pic` | Painted miniature (flat shapes, outline `#3a2418` 5 px, no letters) |
|---|---|
| `corner` | two wall halves split at x 118: `#e8552a` left, `#f0702e` right, a floor wedge `#b5371c` below y 200, grout `#a8321a` 3 px in a 3 x 3 grid; Tato: a golden egg `#f9b75c` 70 x 78 at (128, 150), teal lower half `#2f8f8a`, one leaf `#6cbf3a`, dot eyes, flat mouth; 2 pale squiggles `#fff1e0` rising |
| `sneakers` | wall `#2f5e5c`, floor `#6e7180` below y 180; two white sock legs 34 wide with 2 navy rings `#34507f` from the top edge, each ending in a red sneaker `#d8322b` 60 x 34 with a white cap and sole, the sock heel bulging behind |
| `beard` | wall above y 90; a chestnut mass `#6a3f24` over the rest with 6 wavy strokes (`#8a5a36`, `#4a2c18`); a golden half head r 46 at the top with dot eyes and the moustache running into the mass; Tato's head r 20 with its leaf poking out lower right |
| `sandwich` | ground `#4a5f6a`; two cream slices 46 x 150 `#f0d9a0`, crust `#b8742e` 6 px; Tato's egg between them, lettuce squiggle `#7cc142` on top, a tomato disc `#d8452e` r 30 at the bottom middle |
| `moon` | `#05070d`, 12 white dots; a grey arc `#9a9da6` with 3 craters along the bottom; a white plate ellipse, a cup, a chair `#a8693a` tipped 30; Tato upside down (teal half up, leaf down) |
| `toast` | wall `#2f5e5c`; a golden-brown rounded square `#d99a45` 150 x 160, crust `#8a4f1e` 9 px; wide white eyes with pupils, a wide brown moustache, 3 leaf strokes on top |
| `blank` | undeveloped: flat `#9aa6b4` with one pale diagonal sheen |

None reuses a render: a picture in a picture needs a second camera pass, goes stale with every restaging, and at 21 px on a phone a painted icon reads better than a shrunk frame. Six film photos (never carried on screen: always on the door under a palm) and 5 `blank` `loose` prints fanned 12 degrees apart on the table at K (-1.31, 0.43, 0.34) from frame 0 (Dad's test shots): the photos that float.

## 4. The instant camera: `instacam`, same file (01, 05, 10, 14)

Origin bottom centre, lens toward +z. 0.26 wide x 0.155 tall x 0.15 deep: 2.5 Dad fists wide, 52 % of Tato's width, 140 px in the master wide.

| Part | Numbers |
|---|---|
| Lower block | 0.26 x 0.07 x 0.15, y 0 to 0.07, cream `#efe3c8`, corner radius 0.012; a leather band `#7a4f2e` round its sides and back, not its front |
| Slot | on the lower front: a slit 0.165 x 0.012 `#2a211b` at y 0.028, a lip 0.006 `#7a4f2e` under it |
| Upper block | 0.24 x 0.085 x 0.12, y 0.07 to 0.155, set 0.015 back from the lower front, cream; top plate `#7a4f2e` 0.006 |
| Lens | centre (0, 0.112) on the upper front: barrel r 0.045, 0.035 proud, `#3a2c22`; chrome ring r 0.048 x 0.008 `#c9ced6`; glass r 0.034 `#1d1e22` with one fixed highlight r 0.008 `#8fb8d8` up and left |
| Flash | a box 0.085 x 0.05 x 0.03 on top at x -0.065, cream with a brown back; reflector face 0.07 x 0.038, unlit. Key `flash` 0..1: the face from `#d9cfae` to `#fffbe8`, one real light `#fff6dc` at the face, range 4, intensity 14 x flash. Director: 1 for 2 frames, then down to 0.25 in 0.25 s and held through the insert (05: "still glows") |
| Finder, button | finder block 0.04 x 0.03 x 0.03 on top at x +0.07 with a dark window; shutter button r 0.012 x 0.008 `#d8452e` on top at (0.105, +0.04) |
| Grip bar | on the +x side: a brown bar r 0.018 x 0.10 `#7a4f2e`, 0.012 off the body, upright: the library `mug` hold closes on it |
| Key `eject` 0..1 | its own `blank` print lies in the slot plane: 0 = inside and hidden; 1 = 0.15 out toward +z (0.025 still held), drooped 12 degrees, wide border first. 0.45 s, linear. Position and visibility only |
| Holds | one hand: `mug` on the grip bar (01 raised, 05 at the chest). Two hands: box hold, SIZE `instacam: { w: 0.26, h: 0.155, d: 0.15 }` (10 Dad aims; 14 Tato, sitting, the camera in front of his belly). No new hold |

Two copies, no hand-to-hand: `camD` (Dad, already in his hand at each cut it is drawn in, hidden otherwise) and `camT` (Tato, already in both palms at the cut into 14, `eject` 0 to 1 from +0.2 s).

## 5. Joke 1, the hot corner: `hotcorner`, file `engine/page/props-jokes-real.js` (04)

Own frame: origin the corner point on the floor, +x along the back wall into the room, +z along the side wall toward the lens. Placed at K (-5.50, 0, -2.30), rot 0. Both tile grids line up with the back wall's (edges every 0.50 from the origin and from the floor).

| Part | Numbers |
|---|---|
| Side wall, always there | a slab x -0.10 to 0, z 0 to 3.2, 5.2 high, lit as the back wall: tiles 0.453 on a 0.50 pitch `#2f5e5c`, each x 0.92 to 1.04 from a fixed table, grout `#8fa8a2`. Solid |
| Glow sheets, key `heat` | two unlit planes 0.004 in front of the walls, each 2.0 along its wall x 2.5 high (4 columns x 5 rows of tiles), one canvas each. Tile colour by column from the corner: `#ff8a34`, `#e85a26`, `#a83a1e`, `#5a3a32`; rows above y 1.5 x 0.8, above y 2.0 x 0.55; grout `#a8321a`; a brighter line `#ffb45a` 0.03 wide in the corner itself |
| Floor sheet | an unlit quarter disc r 1.5 at y 0.004, 3 opaque bands from the corner: `#b5371c`, `#8a2c1a`, `#5a2418` |
| Key `heat` 0..1 | 0 = sheets hidden. Above 0.02 they show, their colour x lerp(`#3a1810`, `#ffffff`, heat) x spec `bright` (default 0.8). Director: 0.3 on the cut into 04, 1 at +0.6 s, so the switch is hidden by the cut |
| Two real lights | glow `#ff7a2a` at (0.20, 0.55, 0.20), range 3.2, intensity 9 x heat; face fill `#ffb070` at (1.35, 1.05, 1.95), range 4, intensity 5 x (0.4 + 0.6 heat): his face must stay brighter than `#b07a40` |

Tato stands at (0.50, 0.48) in this frame, back 0.24 from each wall. The three wisps and the flush come on with `heat`. Face: eye 0.7, tilt 0.35, curve -0.5, open 0.15; body `squash` 0.05 held, both arms hanging, one slow blink. No drop anywhere.

## 6. Joke 2: Tato's sneakers on Dad, Tato in socks (07)

`characters/potatobrawl/dad-sneakers.json`: `dad.json` + `costume.shoes: "kidsneakers"`. A second actor on Dad's mark, swapped on the cut (`c.visible`); the socks, rings and foot size stay. Each sneaker is a child of the foot, as the sandal is (foot frame: +z the toes, floor y 0, the sock foot runs z -0.108 to +0.108 and x +-0.078).

| Part | Numbers |
|---|---|
| Sole | 0.092 wide x 0.150 long x 0.016, white `#f4f1ea`, under the FRONT of the foot: z -0.035 to +0.115. The sock bulges 0.03 past it on each side and the heel hangs 0.073 out behind |
| Upper | red canvas `#d8322b`, 0.004 outside the sock, from z 0 to +0.108, only where abs(x) is under 0.056 at the sole: a cap far too small. A foxing line `#b8241f` 0.004 round the sole's top edge |
| Toe cap, bulging toes | white rubber over z 0.08 to 0.115; 3 bumps r 0.016, y scale 0.6, at x -0.03, 0, +0.03, z 0.085 pushing it up |
| Split seams | 2 slits a shoe, 0.03 x 0.008, at x +-0.05, z 0.04: the white sock shows |
| Tongue, eyelets | tongue 0.04 x 0.05 standing 55 degrees up and back from z 0.01, white underside; 3 eyelets a side r 0.004 at z 0.015, 0.035, 0.055, x +-0.022 |
| Laces, burst | tube r 0.003 `#f4f1ea`: ONE crossing left at the front eyelets; 4 free ends a shoe (2 a side), 0.05 to 0.07 long, springing out and up from the other eyelets on 4 fixed curves, a knot r 0.006 on each tip |
| Crushed heel | a red flap 0.07 x 0.03 flat on the floor behind the sole, under his heel |

Waddle: steps of 0.08, 2 a second, body roll +-7 degrees, both arms out `{ o: [0.62, 0.50, 0.05] }`, hands `open`; face eye 1.15, pupil 0.8, tilt 0.2, open 0.3.

`kidsocks` (same props file), `wear: "spud"`: over each of Tato's feet a cover 0.004 outside his foot ball and a leg sleeve up to his underside (y 0.14), teal `#2f8f8a`, 3 rib lines `#267a76` in the top 0.03, toe and heel patch `#3aa39d`. The builder reads his foot centres from the bench layout. On from the cut into his line "can you put my shoes on?", off on the cut out of 07; while they are on he stands (`still`, idle 0.1): no step, hop or squash. Face: the flat stare, eye 0.6, tilt -0.05, pupils on the sneakers.

`kidsneakers` (same props file; `lines.mjs` has him "holding out his small red sneakers"): the same pair, whole. Origin bottom centre of the pair, toes +z. Two shoes 0.012 apart, toes 10 degrees apart, each 0.092 wide x 0.150 long x 0.075 high: the costume's sole, red upper `#d8322b` closed over the heel, white toe cap, tongue lying flat, 3 eyelets a side, the lace crossed 3 times and tied in a bow (2 loops r 0.012, 2 ends 0.03), a white heel tab 0.012 x 0.02. Box hold, both palms, SIZE `kidsneakers: { w: 0.20, h: 0.075, d: 0.15 }`: already in his hands at the cut, held out at y 0.36 and 0.30 in front of his belly, under his mouth; hidden on the cut into 07 (then they are on Dad).

## 7. Joke 3, the beard: `beardflood`, same props file (08)

Own frame: origin the floor under Dad's axis, +z the way he faces; placed at his mark with his rot. Look-only (not solid: Tato stands in it). Spec `reach` 2.2 (distance to the tangled body), `waist` 0.36. Hair `#6a3f24`, every third lock `#5a3520`, 2 strand lines `#4a2c18` and 1 light stroke `#8a5a36` (0.004 wide) a lock: the moustache's own colours. A lock is a flat-oval tube on a fixed wavy path.

| Part | Numbers |
|---|---|
| Root | a U under the moustache: y 0.565 at x 0 rising to 0.615 at x +-0.20, 0.012 off the skin, behind the moustache's lower points. His mouth (y 0.63) stays clear: he talks |
| Chin fall | 9 locks, half width 0.035 to 0.05, half thickness 0.022, down over collar and belly 0.03 off the polo (z 0.46 at y 0.465) to the floor at z 0.62. The fall is 0.42 wide at the root, 0.62 at y 0.30, 0.80 at the floor: polo front, buckle and shorts front are covered |
| Carpet | from z 0.55 to `reach` + 0.55. Half width 0.45 at z 0.6, 0.80 at z 1.4, 0.70 at `reach`, a rounded end. 14 long locks 0.14 wide x 0.10 high in 2 layers (top y 0.09 to 0.15), waves 0.06 high every 0.5 to 0.8; 7 curled tips r 0.05 on the leading edge |
| Mound | round (0, `reach`): 8 ring locks from r 0.26 (on his body) to r 0.60; top y `waist` at r 0.27 to 0.33, down to 0.14 at r 0.60; 2 locks cross his belly on the lens side at y 0.32 to 0.38. His legs and feet are inside; his hem is the tide line |
| Key `grow` 0..1, 1.5 s | each lock is drawn up to a fraction of its path: fall 0 to 0.20; carpet front 0.15 to 0.80 (it runs 2.6 m in 0.98 s, ease out), the tips ride the front; mound 0.75 to 1 (y scale 0.05 to 1 from the floor); belly locks 0.90 to 1. Prime it: `c.prop(0, id, { grow: 0 }, 0)`. Scale 0.001 on the cut out |
| Named point `stroke` | (0.08, 0.50, 0.50): Dad's RIGHT palm rests there and slides 0.12 down and back, twice |

Faces: Dad eye 0.2 (shut, proud), curve 0.6. Tato as the wave arrives: eye 1.2, pupil 0.7, tilt 0.3; then flat. His arms go up `{ o: [0.30, 0.55, 0.10] }` both sides as the mound rises, and stay.

## 8. Joke 4, Tato as a sandwich: `tatosandwich`, same props file (10, 11)

Worn, `wear: "spud"`, built in his body frame (x his left, y from the floor, +z his front), rigid on him: it turns and leans with him, so he shuffles (steps of 0.10, 3 a second, roll +-3). Scale 0.001 to 1 three frames into the poof; off on the cut out of 11.

| Part | Numbers |
|---|---|
| Two slices | one each side: 0.09 thick, 0.50 deep (z -0.26 to +0.24), 0.84 tall (y 0.04 to 0.88: 0.19 over his crown), edge radius 0.02, top corners r 0.14, bottom corners r 0.04, a waist dent 0.012 at 68 % height. Inner face at x +-0.30 at z 0, each turned 12 degrees so the FRONT edges stand apart, and leaning 4 degrees out at the top: from the front both crumb faces show. 0.91 wide over all |
| Bread colours | crumb `#f0d9a0`, 34 pores a face r 0.006 to 0.016 `#dcc184`, crust `#b8742e` on the rim and 0.03 onto each face, crust shade `#96591f` |
| Lettuce | a frilled sheet on his crown, 0.012 off the skin: half width 0.27, 0.24 to the front, 0.30 to the back, 14 rim waves 0.02 high, hanging to y 0.52 at the sides and back; front edge never under y 0.60 (his brows are free). `#7cc142`, rim `#a5d86a`, 7 veins `#4f9a2e`. A hole r 0.035 at the crown: his own leaf stands through it |
| Tomato | a slice r 0.115, 0.03 thick, on its edge against his belly, centre (0, 0.245, 0.235), tipped 12 degrees back: top y 0.36, 0.03 under his mouth. Skin rim `#b8321f`, flesh `#d8452e`, lighter core `#e8604a`, 3 seed chambers of 5 seeds `#f3d9a0` |
| Named points | `gripL`, `gripR` (+-0.385, 0.36, 0.24): his palms on the front edges (rest pins); the arms run inside, between body and bread |

Face, hands and feet show; keep the lens within 20 degrees of his facing in 10 or a slice crosses his cheek. In 11 his RIGHT hand leaves `gripR` for the photo at `b4`. Face: eye 0.6, tilt -0.15, curve -0.2.

## 9. Joke 5, the moon and the crash: file `engine/page/props-jokes-moon.js` (12, 13)

`moonview`: origin K; an unlit card 1.60 x 1.15 at K (0, 2.05, -2.278), 0.012 in front of the window glass (episode 5's `daywindow` place). One 1024 x 736 canvas.

| Part | Numbers |
|---|---|
| Sky | `#05070d` at the top to `#0b1020` at the horizon; 70 stars from a fixed table, 54 of 2 px and 16 of 4 px, white at 0.5 to 1.0 brightness |
| Moon surface | the lower 42 %: a limb arc of radius 2.4 card widths, highest at x 0.55; lit `#c9ccd3`, mid `#9a9da6`, shade `#63666f` toward the lower left, a rim line `#eef0f4` 6 px on the limb |
| Craters | 9 ellipses flattened to 0.45, radius 0.04 to 0.16 card widths: floor `#7e818a`, a shadow crescent `#55575f` on the upper left inside, a lit rim arc `#e3e5ea` on the lower right; 14 small ones r 0.01 to 0.03; 3 boulders with a shadow |
| Key `on` 0 or 1 | visibility of the card and of an opaque floor patch (a window-shaped parallelogram 1.2 x 1.8 `#56628f` at y 0.003 under the window). Switched on the cut into 12 |

| State | `lights` fx (to / lamp) | `grade` key | Props |
|---|---|---|---|
| Evening (all else) | 1 / 1 | s 1.12, w 0.5, c 1, lift 0.03 | |
| Moon (12) | 0.15 / 0.08, dur 0.4 on "no atmosphere" | s 0.85, w -0.6, c 1.05, lift -0.02, tint `#c8d4ff` | `moonview` on, `moonlamp` 0.9. No body darker than `#2a3050` |
| Crash (13 on) | 1 / 1 in 0.15 s on the slam | evening | `moonview` off on the cut into 13 |

Floaters: `c.float(t, 0, { dur: 0.15, damp: 0.5 })`, then one `c.knock` each (up 0.3 to 0.6 m/s, spin under 1.5 rad/s) for 3 plates, 3 cups, the chair and the 5 blank prints; knock them clear of both faces and the top spot. Dad: head down, body centre y 1.75 over K (0.80, -1.02), crown 1.26, sandals 2.44, LEFT palm on the moon photo (reach 0.47). Tato: upside down, body centre y 1.25 at K (-0.20, 0.20), turning 40 degrees a second, arms out. The slam: `c.float(t2, -16)`; the two bodies drop on a gravity curve (0.45 s from 1.2 m) with `squash` 0.14 and a dust poof (size 0.6, lift 0.1, sparks 0) each.

`plateshards`: origin the floor. 16 china shards from a fixed table inside r 0.32: 0.03 to 0.09 long, 0.006 thick, `#f7f5ef`, 5 with a curved blue rim strip `#3d8fb0` 0.012 wide, lying 0 to 12 degrees tipped. Spec `v` 0 or 1 (two tables). On the impact frame 2 of the 3 plates hide and a `plateshards` shows where each landed (read the bake), under the dust poof. The third plate and the cups stay whole. The chair is knocked with spin [0, 0, 2.2] to come down on its side; if the bake stands it up, re-place it on its side on the cut into 13.

13: Tato flat on his belly, face down, at K (0.55, 0.10), `camT`'s spot 0.35 from his right hand (hidden until 14); Dad on the master mark, fists on his belt (the belt-hitch pose).

## 10. The ending, Dad as toast: `characters/potatobrawl/dad-toast.json` + costume `toast: true` (14, 15)

Not a prop: the same rig with a slab body, so his face, moustache, brows, leaves, arms, socks and sandals are his own parts and carry over. Copy `dad.json`; change only these. A third actor on Dad's mark, swapped 3 frames into the poof (`who: "dad"`, size 1.5, lift 0.6; a `shake` of amp 0.03 allowed).

| Key | Value |
|---|---|
| body | height 0.98, width 0.86, depth 0.20, square 6, taper -0.06 (the top 6 % wider), lump 0, seed 71, color `#e3a857`, `keepSkin: true` (the sheet look leaves this colour alone). Same height and width as Dad: eye height, arm roots and every mark stay |
| costume | type `dad` (so the face is `types.dad`), `toast: true`, `armSkin: "#f9b75c"` (the arms stay his skin; without it they take the body's colour), socks, rings, sandal, strap, moustache, leaf as `dad.json` |
| tts, hands, face, legs | unchanged |

| Toast part (costume, on the body's surface) | Numbers |
|---|---|
| Crust | a band `#8a4f1e` 0.006 off the skin over the whole thin rim (top, sides, underside) and 0.035 onto the front and back faces, its inner edge wavering +-0.004; shade `#6f3d16` on the underside |
| Browning | on both faces, drawn marks only (no shell over the face): a ring 0.08 wide inside the crust from `#c07a2e` to the body's `#e3a857` in 3 steps; 60 pores a face r 0.003 to 0.009 (`#b46f2a` dark, `#f0c27a` light) and 5 flecks `#6b3a16` from a fixed table |
| Kept clear | no mark inside the eye zone (b 0.496 to 0.86, abs(x) under 0.25) or the mouth and moustache zone (b 0.33 to 0.50, abs(x) under 0.25) |
| Kept | moustache, 3 leaves on the crown (nub x -0.11, z +0.02: inside the 0.20 depth), sock legs with rings, sandals. Left out: polo, collar, placket, sleeves, shorts, belt, buckle, holster |

Face: eye 1.25, pupil 0.6, tilt 0.3, browY 0.05, open 0.25, no blink for 1 s; arms hanging, hands `open`. In 15 his pupils go to the top spot. Tato in 14: sitting, `camT` in both palms, flat face with curve 0.15; in 15 on the step, eye 0.55, curve 0.35, smirk 0.3, pupils to the lens for the last 1.5 s.

## 11. Props through hands: 4 holds, no release and no take on screen

| Hold | Who | On screen |
|---|---|---|
| `kidsneakers`, box | Tato, both | his joke 2 line only (section 6) |
| `camD`, `mug` on the grip bar | Dad, right | 01 raised beside his head (never over his face), 05 at his chest |
| `camD`, box | Dad, both | 10, aimed at Tato, under his eye line |
| `camT`, box | Tato, both | 14 |

Rest pins, no grip: every palm on a photo; Dad's palm on `stroke`; Tato's palms on `gripL` / `gripR`; Dad's fists on his belt. Check windows the director writes: Tato in `beardflood` and on `stepstool`, the worn pieces on their wearers, palms on the door.

Cut first, if one fix round does not clean it: the cheek flush, the moon floor patch, the hot floor sheet, the burst lace ends (keep the split seams), the lettuce frill (a plain sheet), `plateshards` `v` 1. Never cut: the gold magnet, the row of four, the steam, the tiny sneakers, Tato in the mound, bread and tomato, the moon in the window, the toast's face.

## 12. Changed from the drawing; open questions (my default); risks

- The row fills right to left, so 09, 13 and 15 show it mirrored; 06 and 11 are as drawn. The handle sits higher than drawn (the kit's bar, moved up).
- The fridge is the kit's one door over a drawer front at 0.75. The hot corner is the room's far left corner with a new side wall: the counter fills the back wall everywhere else.
- 12: the room has no ceiling; Dad floats head down with his sandals at 2.44 and his palm on the top spot. 15: Tato stands on his step. Jokes reset on cuts: beard, sneakers and bread are gone in the next shot, as the sheet.
- Tato's own leaf shows through the lettuce. The toast has no polo sleeves. A photo slides out blank and is developed by the next shot.
- Q1 Fridge size: scale 0.75 (default). Full size puts the top spot 0.5 under the door's top or out of Dad's reach.
- Q2 Row order: right to left (default), or left to right as 09: then Tato stands in front of the older photos.
- Q3 The end: the step, in the room from frame 0 (default), or a hop and slap with no prop: his hand is then off the photo in the last frame.
- Q4 Tato's sneakers before the joke: a loose pair in his hands, as `lines.mjs` asks (default, kind `kidsneakers`). Or not shown: his socks and "my shoes" carry it, one kind less.
- Q5 The row during the moon: stays on the door as 13 and 15 (default). Or it floats off and ends on the floor under the toast.
- Q6 The pull-down: the cut plus a 0.12 slide (default), or Tato on the step every time (about 1 s more a joke).
- Risks to scope: 10 new prop kinds, 2 cast files, 2 costume branches, 2 kit switches, 3 Dad actors. Biggest: toast Dad (a slab body under a costume written for an egg: moustache and leaf placement must be proven on the bench), then `beardflood` (40 locks with a growth key), then the sneakers. To the picture: unlit glow sheets under the night look (spec `bright`); up to 4 real lights at once (set lamp, 2 in the corner, the flash); 12 loose bodies in zero-g, 5 of them thin cards; Tato's foot ball is nearly Dad's size, so "tiny" rests on the bulge and the heel; the worn sandwich does not squash with him; `lights` at 0.15 may sink the faces (then `moonlamp` 1.2).

The brief in one line: nothing I would change; the only rule it bends is "nobody floats", and that is the joke.

## 13. Builder tasks (disjoint files; staging, marks, cameras and check windows are the director's)

Each builder writes a bench in `storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/` (set `plain`, look `anime-pro`, castLook `sheet`) and hands back its still sheet. T1 goes first with step 0: the three new prop files as stubs and their import lines in `props3d.js`.

| Task | Files (owner) | DONE = a bench still showing |
|---|---|---|
| T1 Fridge, photos, camera | `engine/page/props-jokes-fridge.js`; `engine/page/props-fridge.js` (2 switches); `engine/page/props3d.js` (imports); `storyboards/lib/grips.mjs` (2 SIZE: `instacam`, `kidsneakers`) | cameras 05 and 09 with all 6 photos in their slots; the 7 pictures side by side at 240 px and at 64 px; `instacam` in Dad's `mug` hold and Tato's box hold at `eject` 0, 0.5, 1 and `flash` 0, 1 |
| T2 Corner, beard, sandwich, socks | `engine/page/props-jokes-real.js` | camera 04 at `heat` 0, 0.3, 1 with the wisps; `beardflood` at `grow` 0.2, 0.5, 0.8, 1 with both bodies; `tatosandwich` front, 20 degrees and side, and at `b4`; `kidsocks` with `kidsneakers` in his box hold |
| T3 Moon | `engine/page/props-jokes-moon.js` | camera 12 in the moon state with `moonview` on and off; both `plateshards` |
| T4 Dad's two variants | `engine/page/costumes-dad.js`; `characters/potatobrawl/dad-sneakers.json`, `dad-toast.json` | camera 07 on the sneakers, both feet, standing and mid step; toast Dad front, 3/4, side and back beside `dad.json`, with `shocked`, talking and both arms up; `node qa/golden.mjs` with no difference for `dad.json` |
