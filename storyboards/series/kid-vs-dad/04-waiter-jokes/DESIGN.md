# Kid vs Dad 04 "Dad jokes at the waiter": design of the new pieces

Creative director, 25 Nov 2026. Target: the approved 15-panel sheet v1 (`sheets/kid-vs-dad-04-panels-v1.png`, opened and read panel by panel) and `OUTLINE.md` (hook H1, ending E1, about 80 s). Every size is computed from the cast files and the kit's header comments, not rendered: check each piece on a bench still. Metres, floor y 0, +z toward the main camera, +x screen right, hex colours. Hh / Wd / Dp = a body's own height, width, depth. A potato stands Hh + 0.14 tall; its eyes sit 0.62 Hh above its underside, its mouth 0.45 Hh; seated, its underside is on the seat top. **World frame**: origin = the floor under the middle of the main table. **Dad** is `characters/potatobrawl/dad.json`, merged into this branch and read directly: body 0.98 x 0.86 x 0.76 (real outline 0.874 wide, belly 0.028 more), legs 0.20, hands 1.3. He does not follow the rule above: `03-square-eyes/DAD-DESIGN.md` section 2 gives, standing, eye centres 0.835, brow bars 0.97, moustache 0.56 to 0.69, mouth 0.63, belt 0.36 to 0.41, crown 1.18, leaf tops 1.25. He is not designed or changed here, and nothing here needs an edit to `potato.js`, `timeline.js`, `costumes-dad.js`, `costumes-everyday.js`, `squareeyes.js`, `props-gravroom.js` or `voices.json`. Letters exist in three places only: the news bar, "DO NOT SERVE" on the photo, "TIP: STOP." on the bill. Every hand is three fingers and a thumb; every "random" mark is placed once from a fixed table (no `Math.random`, no clock).

**Potato furniture is low.** A dad seated on the kit's 0.42 chair has his eyes at 1.06 and his crown at 1.40, over the standing waiter's (0.91, 1.38), and a 0.62 table hides a standing Tato to his crown. So this film's seats are 0.24 and its table top 0.386 (the kit's `bistrotable` is 0.38 for the same reason): the waiter is 0.16 taller than the seated dad, and a standing Tato's mouth is level with the cloth.

| Who | Underside | Mouth | Eyes | Top |
|---|---|---|---|---|
| Waiter (Mash, 1.24), standing | 0.14 | 0.70 | 0.91 | 1.38 |
| Dad, seated / standing | 0.24 / 0.20 | 0.67 / 0.63 | 0.875 / 0.835 | 1.22 / 1.18, leaves 1.29 / 1.25 |
| Reporter (0.80), seated | 0.24 | 0.60 | 0.74 | 1.085 (helmet) |
| Tato (0.55), seated | 0.24 | 0.49 | 0.58 | 0.79 |
| Cook (0.46), on a 0.52 crate | 0.66 | 0.87 | 0.945 | 1.12, hat 1.29 |

## Director's decisions (25 Nov, override the sections below where they differ)

- Q1 default (dad right, kitchen left). Q3 no diners. Q5 news bar one window as designed. Q6 one bead. Q7 praying. Q8 upright for the lens.
- Q2 + the steak line: panel 06 is DRINKS, not food. The waiter carries two water glasses on `servetray` (box hold, both palms), late, "Sorry for the wait." No plate on a palm anywhere. The steak is only ordered (46 s), never served. So `mealplate` is built with `food: "none"` only (laid tables); the "steak" and "burger" foods are NOT built.
- Q4: the director prints the dad's eye height from a layout and fixes cameras 04/15 if needed.

## 0. Reused unchanged (no builder), and one kit switch

The three restaurant clips (Never Has Money 01, Always Orders Potatoes 01, Friends Try To 04) all use set `plain` + one painted plate (`diner-sunny`, `burger-bar-day`, `cosy-bistro`) + furniture props. Same recipe here, with a new daytime plate (section 1). Set `restaurant` (a pizzeria: one small window, brick oven, red checks) is not used.

| Need | Use | Numbers |
|---|---|---|
| Tato | `spud-kid.json` | unchanged |
| Reporter, mic | `reporter.json`, `newsmic` | unchanged; mug hold, RIGHT hand, all film |
| Dad | `dad.json` | unchanged |
| Notepad | `spudpad` | scale 0.85 = 0.16 x 0.22; `write: 0` (its default: a blank page, no letters); `grips.phone(..., { side: "L", height: 0.2 })`, SIZE exists. The lens sees its kraft back and wire loops, as drawn |
| Pen | `feltpen` | color and cap `#26262b`; `grips.thin`, RIGHT hand, SIZE exists |
| Napkin | `napkin`, worn on Tato | w 0.19, h 0.16, at (0, 0.34, 0.235) in his frame |
| Apron | `waiterapron`, worn on the waiter | y0 0.33, y1 0.04, rx 0.255, rz 0.24, arc 150 + the switch below |
| Chef hat | `toque`, worn on the cook | `fit: { H: 0.46, W: 0.50, D: 0.46, taper: 0.02, legH: 0.14 }`, `h: 0.20` |
| Cook's step | `crate` | size 0.51 (top 0.52), at (-2.6, -4.0) |
| Water glass | `waterglass` | `fill` 0.8; stands on the tray, then flies. Never held |
| Lamps | `pendant` x 3 | dome rim at y 1.62 over the main table, the reporter's table and table B1 |
| Plants | `bistroplant` x 2 | (-1.45, -2.7), (3.4, -2.5) |
| Sweat | `sweatbead`, worn on the waiter | his right temple (-0.165, 1.13, 0.13), 0.16 down in 1.1 s, then scale 0. One bead in the hook: the outline wants "a sweating waiter by 3 s", story.md bans the symbol (ep 2's answer) |
| Spotlight | `lightbeam` + `lightpool` | section 8 |
| News bar | `hud.news` | `{ label: "WAITER IN DANGER", tag: "LIVE", tagW: 150, count: false, show: [0.2, <cut into 15>], alarm: [...] }`. 16 characters fit the 638 px strip at the full 40 px cap height. One window: on in 01 and 14 and between, off for the bill. `alarm` windows on the three punchlines (1.2 s, 1.2 s, 3 s). While it is on it covers 31 to 36 % of the frame's height from the bottom: every camera in section 9 keeps its key prop above 38 % |
| Not used | `billtray` + `receipt`, `cardreader`, `dinnerplate`, `bistrotable`, `chair`, `table`, `mashbook` | the receipt prints "TOTAL 1249" and the reader "PAY" (letters); the plate has a blue rim and crumbs; the table has red stripes; kit chair and table are 0.42 / 0.62 high; the book is navy with writing inside |

| Kit switch | File | What it does (default = today's look) |
|---|---|---|
| `band`, `bandArc`, `bow` on `waiterapron` | `engine/page/props-bistro.js` | `band`: the tie band's colour (default `#2b2b33`; here `#f4f1ea`, a dark band vanishes on the black waistcoat). `bandArc`: degrees the band runs round (default arc x 1.3; here 360). `bow: true`: at the back middle, 0.01 under y0: two loops 0.07 x 0.045 tipped 20 degrees down, a knot 0.025, two tails 0.11 and 0.14 long, 0.028 wide, white `#f4f1ea` (panels 07, 12, 14) |

**Background diners: none.** Two more tables stand laid and empty. Why: the kit's extras (`casinoguest`, `streetpotato`) have dot eyes and read as dummies beside full-face cast in a medium shot; each body is one more thing to check in every shot; the 9:16 frame already holds four cast; and empty tables round this dad are the joke ("He's been here before").

## 1. The room: set `plain` + one new plate, hung twice

| Part | Numbers |
|---|---|
| Set block | `{ type: "plain", color: "#efe2c8", floor: "#7b4650", light: "golden", para: 0, aperture: 0, lighting: 2, bloom: "emissive" }` + the plate keys below |
| Back wall | `plate: { src: "assets/plates/eatery-day.png", z: -3.0, center: [1.0, 2.0], height: 5.2, depth: false, motion: false, dust: 8 }`: 7.8 wide, x -2.9 to +4.9 |
| West wall | `plates: [{ src: the same file, center: [-3.3, 2.0], z: 0.4, height: 5.2, turn: 90 }]`: windows behind the waiter in panel 10, as drawn. The two copies never share a frame: the door wall (section 3) stands in the corner between them |
| The picture | landscape 1344 x 896, then 2x Lanczos + unsharp to 2688 x 1792 (close shots stand 2 m from it). Paint as `library-hall-day` was (`storyboards/series/what-if/02-library/plate-day.py`): "anime film background painting, gouache, Studio Ghibli style, inside a cosy small family restaurant at lunchtime, eye level view straight at the back wall, warm cream plaster wall, dark wooden ceiling beams, a dark wooden wainscot, a row of three big multi-pane windows with white frames showing sunlit green trees and blue sky, bright warm daylight, small lemon trees in terracotta pots on the window sills, two small framed landscape paintings between the windows, brass wall lamps, lived-in, painterly, hand-painted, highly detailed"; `--no "table, chair, bench, stool, booth, counter, furniture in foreground, people, text, letters, words, writing, sign, numbers, menu, perspective, corridor, food, photo, photorealistic, 3d render, cgi, floor, door, night, sunset, golden hour"`. Seeds 23, 11, 52, 7 |
| Accept when | no letter, no person, no furniture; windows across at least 80 % of the width, sills on one level; a calm wall band above the windows (captions sit there); the wainscot dark (near `#9a6238`): the dad's pale blue polo vanishes on a pale wall (`DAD-DESIGN.md`, risks). Hung as above, the sills land at y 0.55 to 0.75: tune `center` and `height` on the bench and write both in the README row |
| Dark picture | `python engine/plates/night.py assets/plates/eatery-day.png` -> `eatery-day.night.png` (panes `#1c2440`, no moon, no lit windows): panel 11 only |

`dinecarpet` (new, `props-eatery.js`): a thin sheet at y 0.002, `w` 8.3 x `d` 7.4, centre (0.85, 0.7): burgundy `#7b4650`, a diamond lattice 0.36 x 0.36 of lines `#8f5a66` 0.012 wide, a four-petal mark `#9a6672` r 0.03 at every second crossing, 14 worn patches `#6c3d47`, each once. Spec `dim` 0..1 multiplies every colour by 1 - 0.7 dim (panel 11: a second copy with `dim: 1`, swapped by scale on the cut). Ghost. White cloths, white socks, pale blue polo and golden skin all stand off it.

## 2. Table and chair: `roundtable`, `hoopchair`, file `engine/page/props-eatery.js`

`roundtable` (origin: the floor under its middle):

| Part | Numbers |
|---|---|
| Spec keys | `r` 0.45, `h` 0.38 (the wood top's upper face), `drape` 0.22, `legs` true, `dress` false or [x, z]. Returns `grip` h + 0.006 |
| Wood | top disc r - 0.02, 0.035 thick, `#8a5a36`, its underside drawn (seen from below); 4 round legs r 0.02 at (+-0.6 r, +-0.6 r), `#7a4a28` |
| Cloth | white `#f7f4ec`, 0.006 thick, top at h + 0.006 = 0.386; a skirt from the rim down `drape` (hem 0.166), flaring 0.02, double-sided, inside `#cfc8bd`. 14 soft folds at 6, 31, 58, 79, 104, 133, 151, 178, 203, 229, 247, 276, 301, 334 degrees, depths 14, 9, 20, 11, 17, 8, 22, 12, 16, 10, 19, 13, 21, 9 mm, fold shade `#dcd6ca`; hem wave +-0.008; one stitch line `#e6e0d4` 0.012 above the hem. No stripes, no checks |
| `dress` | at [x, z] on the cloth: a bud vase (solid pale glass `#d9eef0`, no see-through: foot r 0.022, belly 0.030, neck 0.014, 0.085 tall) with 5 flowers (3 pink `#f08fb0`, 1 `#f6b3c8`, 1 white `#fbf3ee`, centres `#f2c230`) on stems `#5f9a45` and 3 leaves, 0.15 tall in all; 0.09 to its +x side a salt shaker (`#eef2f2`, steel cap, r 0.014, 0.05 tall) and a pepper shaker (`#5a4a3a`). Low on purpose: a taller vase covers a seated face |
| Solid | top and legs. The cloth is ghost |

Instances: main (0, 0) `dress: [0.28, 0.12]` (from the wide camera its top lands on the dad's belly at y 0.48, under his moustache at 0.60); reporter's (-0.85, -1.75) `dress: [0.30, 0.10]`; B1 (2.05, -1.85) and B2 (-2.4, 0.9), `dress: [0.05, 0]`, each with two white plates drawn by `mealplate` `food: "none"`; the under-table cheat (section 7).

`hoopchair` (origin: the floor under the seat's middle; faces +z, back toward -z; returns `grip` 0.24, the director sits with `height: 0.24`):

| Part | Numbers |
|---|---|
| Seat | wood ring r 0.21 `#8a5a36`, pad r 0.17, 0.02 thick, `#7d3a44` (spec `pad`), top at 0.24 |
| Legs | 4, r 0.016, from the ring to the floor at (+-0.19, +-0.19), splayed 6 degrees; a stretcher ring r 0.15 at y 0.09 |
| Back | a bent hoop (tube r 0.014) from (+-0.17, 0.22, -0.20) to its top at (0, 0.64, -0.26); a second hoop 0.06 inside it (top 0.56); one highlight line `#b07a4c` |
| Solid | yes. 0.42 wide: the dad overhangs it, as drawn in 11 |

A sitter's back touches the hoop: his middle is 0.5 Dp - 0.20 in front of the seat's middle (Tato 0.02, the reporter 0.14, the dad 0.18). Section 9 gives body marks and chair marks apart. The dad's legs are 0.20: on a 0.24 seat his sandals hang 0.04 over the carpet; start the sit's `feet` from the Dad bench (still 12.5). Chairs: the dad's, Tato's, the reporter's, two each at B1 and B2.

## 3. The kitchen door, the nook and the photo: `kitchendoor`, file `engine/page/props-eatery-door.js` (panels 08, 09, 12, 14)

Placed at world (-2.6, 0, -2.97), rot 0: 0.03 in front of the back plate, covering its left end. Own frame: front +z (the dining room), origin the floor under the middle of the doorway, +x screen right.

| Part | Numbers |
|---|---|
| Wall piece | x -0.70 to +1.00, y 0 to 3.4, plaster `#f1e3c6`; wainscot `#9a6238` to y 0.62 with 9 plank lines and a cap rail 0.04 `#7d4c2a`; a wooden post 0.14 wide, full height, centred on x +1.00 (it hides the seam to the painted wall) and a half post at x -0.70. Solid, but for the doorway |
| Doorway | x -0.45 to +0.45, y 0 to 1.60; casing 0.09 wide `#7d4c2a` |
| Leaf | 0.88 x 1.57 x 0.035, bottom at y 0.015, brushed steel `#b9c0c6`, shade `#8f979e`, edge light `#dfe5e9`; kick plate `#8c949b` to y 0.28; push plate 0.10 x 0.26 `#d5dbe0`, centre y 0.80, 0.12 from the free edge; two spring hinges 0.03 x 0.10 at y 0.25 and 1.33. Both faces alike. Hinge on the +x jamb. Ghost (the waiter walks through it) |
| Porthole | a real hole r 0.15, centre (0, 1.02) on the leaf; ring r 0.15 to 0.19, 0.012 proud, `#9aa3aa`, 12 rivets r 0.008 `#c9d0d6` on r 0.17, both faces; glass `#cfe6ee` at FIXED opacity 0.18. If the disc sorts badly, drop it: the ring carries the window |
| Key `open` -1..+1 | the standard key; angle = open x 85 degrees; + swings the free edge into the dining room. A pass-through: 0 -> 0.9 in 0.18 s, -0.4 in 0.35 s, 0.18 in 0.3 s, 0 in 0.3 s. For 08: 0 -> 0.9 in 0.18 s, then 0.7 and held |
| Nook | behind the wall: x -1.2 to +1.2, z -0.03 to -1.53, floor `#8c8f94`. Self-lit (unlit materials): walls of 0.12 tiles `#e3ecec`, grout `#c3d0d2`, a dado of 0.24 tiles `#bcd3da` below y 0.55. On the back wall: a steel shelf unit `#aeb6bd`, x -1.15 to -0.60, boards at y 0.62, 0.98, 1.34, with 3 plate stacks (6, 4, 7 plates, r 0.11, `#f7f5ef`) and a steel pot r 0.10 x 0.14; a small dark pendant with a warm bulb at (-0.20, 1.80, -1.20) |
| The photo (function `banPhoto`, spec `photo: true`) | on the nook's back wall, centre (-0.20, 1.00, -1.52). Frame 0.56 x 0.74, wood `#a8642e` 0.04 wide with a dark inner line `#6e3d1a`. Picture 0.48 x 0.66 on ONE canvas 960 x 1320, drawn once. Top 0.39: the dad's head and shoulders at 0.54 of life, from `dad.json` and his section 2 marks, on pale `#cfe3ea`: skin `#f9b75c` (his skin under castLook `sheet`; `#e2a95c` without it) with 9 spots `#e0a04c`; two flat brow bars `#4e2f1a` 0.068 x 0.022; tall oval eyes 0.077 x 0.110, irises `#4a2a14`, at the lens; blush `#ff8f8f`; the walrus moustache `#6a3f24` 0.25 x 0.072 with drooping ends and 10 hair strokes `#8a5a36`; a wide open grin under it (`#7a2a1c`, one white bar of teeth, 0.10 x 0.035); three leaves `#8fb03a` combed to one side; polo `#a9c8e8`, collar `#b9d3ee`, one button `#f3ead6`; outline `#4a2f1c` 0.004. Bottom 0.25, cream `#f8ecd2`: "DO NOT" over "SERVE", red `#c9281f`, brushed capitals (the `brushText` recipe of `props-score-paper.js`: slant -2, jitter 0.035), cap height 0.085, line pitch 0.11, centred |

In panel 08 (camera in section 9) the picture is about 390 px wide and a capital 69 px tall (23 px on a 360 px phone); the words sit at 42 to 53 % of the height, over the news bar.

| When | Door | Why |
|---|---|---|
| Frame 0 to joke 2 | `open` 0 | the waiter glances back at it (tease 1) |
| 08 | swung to 0.9, held at 0.7 | the waiter went through it on the cut before. He, the cook and the crate are hidden for the shot: all three stand on the photo's sight line |
| 09, on a cut | `open` 0; cook on his crate at (-2.6, -4.0) | his face fills the glass: the visible circle at his depth is 0.54 across, y 0.75 to 1.29 |
| 14 | a pass-through as the waiter reaches it | the shot may cut before |

## 4. The waiter: `characters/potatobrawl/mash-waiter.json` (all panels but 02, 08, 09, 13, 15)

Copy `mash.json`; change only these. No costume code: the `teller` type already draws a shirt and a waistcoat on any body.

| Key | Value |
|---|---|
| limbs | color `#2b2b33` (black trousers); the rest as Mash |
| costume | `{ type: "teller", shirt: "#f6f3ea", vest: "#26262b", tie: false, glasses: false, garters: false, shoes: "#26262b", sole: "#15151a" }` |
| what it gives on his body | collar 0.58 (0.12 under his mouth); the waistcoat's V runs from the collar down to y 0.34, 0.43 wide at the top; three brass buttons at 0.27, 0.22, 0.17, hidden by the apron |
| apron (section 0) | band at 0.33, just under the V's point; hem 0.04, over the legs to the shoes: long, as drawn; bow at the back |
| sprout, face, hands, tts | Mash's |

Faces: polite (04) = his neutral. Frozen (05) = eye 1.1, curve -0.1, then his right lid to 0.6 and back twice, 6 frames each way (a twitch; faster trips the strobe check). Bowing (06) = lids 0.9, lean 12 degrees. Shield (10) = eye 1.15, tilt 0.2, curve -0.25, body leaning 12 degrees away from the dad. Shock (12) = eye 1.3, open 0.5.

Pad and pen: pad bottom at y 0.40, 0.33 in front of his middle, tipped 20 degrees back, its top at 0.61 (0.09 under his mouth); the pen's tip on the page's upper third. Trembling (07) = the pad's `rot` +-3 degrees at 9 Hz. Shield (10) = pad bottom 0.43, top 0.64, both arms in. Both are hidden (scale 0.001) on the cuts into 06, 12 and 14.

Fallback, only if the bench shows the built-in V reads as braces on his tall body: `vest: false` and a worn `waistcoat` prop in `props-waiter.js`, built by shares of his body (V point 0.30 Hh, hem 0.16 Hh, 0.03 off the shirt). A worn prop, so the costume files stay as they are.

## 5. The cook: `characters/potatobrawl/cook.json` (panel 09 only)

Copy `chip.json`; change only these.

| Key | Value |
|---|---|
| body | height 0.46, width 0.50, depth 0.46, lump 0.02, seed 113, taper 0.02 (a ball; never in a shot with Tato or Chip) |
| limbs | color `#3b3f48`, width 0.030 |
| face | size 0.70 |
| sprout | placement "none" (under the hat) |
| hands | size 1.05, 3 fingers, seamless |
| costume | `{ type: "teller", shirt: "#fbf8f1", vest: false, tie: false, glasses: false, garters: false }`: the white jacket, collar roll included |
| hat | `toque` (section 0) |

One pose: on the crate, facing the glass, both gloves palm to palm at y 0.79 to 0.86 (hand shape `clasp`), under the mouth. Face: lids shut, tilt 0.3, curve -0.15; one eye opens to 0.5 for 0.4 s to peek, then shuts. The outline's "crosses himself" is the sheet's praying hands, held: a hand path across face and chest is a contact risk for a 1.5 s shot.

## 6. Hand props: `tallmenu`, `servetray`, `mealplate`, `tipbill`, file `engine/page/props-waiter.js`

`tallmenu` (02, 12): stands on the table by itself, an open V. Origin: the cloth under the spine's foot; the spine toward +z (the lens), the leaves trailing back to the reader.

| Part | Numbers |
|---|---|
| Leaves | two, 0.24 x 0.30 x 0.012; spec `angle` 115 between them: 0.405 across, 0.13 deep, top edge at 0.686 on a 0.386 table |
| Outside | burgundy `#7a2233` (spec `cover`), edge wear `#96404d`, spine band 0.02 `#5e1826`; on each leaf a gold line `#d9b24a` 0.005 wide, 0.022 in from the edge, and 4 corner dots r 0.006. Nothing else |
| Inside | cream `#f3e7cf`, 7 grey rules `#d8cbb0` 0.14 x 0.004 on each leaf. No letters |
| Hand | none. The reporter's LEFT glove rests on the left leaf's top edge (`WAITER_GRIPS.tallmenu.topL = [-0.10, 0.30, -0.06]`, a rest pin) |

At (-0.85, 0.386, -1.92): 0.24 in front of his face. Seen from 1 m and more his eyes' lower edge (0.69) clears the top edge, his mouth (0.60) is hidden. Duck (12) = he sinks 0.05 (eyes half hidden) or 0.12 (dome only). The mic's ball shows at 0.80 beside the menu's screen-left edge.

`servetray` (12): round, r 0.19, base 0.008, rim 0.014 high, charcoal `#2f3138` (spec `color`), rim light `#4a4d57`, inner disc `#3a3c44`. Origin: bottom centre. Hold: box hold, both palms on the rim (`SIZE servetray: { w: 0.38, h: 0.022, d: 0.38 }`, gap 0.03). Carried at y 0.48: the glass on it tops out at 0.60, under his mouth.

`mealplate` (06, and the laid tables): origin bottom centre; plate r 0.125, rim 0.018 high, plain white china `#f7f5ef`, shade `#dcd9cf`.

| `food` | Numbers |
|---|---|
| "steak" | a rounded slab 0.13 x 0.085 x 0.022 `#7a4226`, edge `#5a2e1a`, 4 grill lines `#3e2114` 0.006 wide at 30 degrees, a fat rim `#e8c9a0` 0.008 on one long side; a butter pat `#f6de8a` 0.022 square on top; 6 green beans `#5f9a3a` 0.075 long, r 0.005, in a loose bundle; a smear of jus `#8a4a22`. 0.05 tall in all |
| "burger" | ep 2's stack at 0.46 scale, no paper: r 0.055, 0.085 tall (bun base `#e09a3a`, patty `#5a3220`, cheese `#ffc933` with 4 drooping corners, tomato `#d8452e`, lettuce frill `#6fb23a`, bun top `#d9933a` with 9 seeds `#f6e6b8`); beside it 9 fries `#f2c14e`, 0.06 to 0.08 long, 0.009 square, ends `#d99a2e`, each once. 0.105 tall in all |
| "none" | the bare plate |
| Hand | one plate on each of the waiter's palms, as drawn: the glove UNDER the plate, palm up, shape `carry`, at `WAITER_GRIPS.mealplate.under = [0, -0.012, 0.03]`; plates at y 0.52, 0.30 in front of him, 0.30 apart. In his hands at the cut into 06; standing on the table from the cut out |

`tipbill` (14, 15): the bill tray and the slip as ONE prop. Own frame as `clipboard`: standing on its bottom edge, origin that edge's middle, the slip on the -z face (away from the holder, toward the lens).

| Part | Numbers |
|---|---|
| Tray | 0.17 x 0.25 x 0.012, corner radius 0.02, wood `#7a4a2a`; a rim 0.010 wide, 0.008 proud, `#5e3719`, on the -z face |
| Slip | 0.125 x 0.20, paper `#fbf8ef`, turned 3 degrees inside the rim, a grey edge line |
| Print | top 0.06: one bar 0.07 x 0.006 and three rows (a left bar 0.03 to 0.05, a right bar 0.015), `#b9b6ad`, then a rule. Blurs, nothing readable |
| Writing | spec `lines` ["TIP:", "STOP."], ballpoint `#27324a` (spec `ink`), handwritten capitals with the stroke writer of `props-score-paper.js` (stroke 0.0045, jitter 4 %, slant 6, wander 3 %, spec `seed` 5), cap height 0.030, the second line 0.012 lower on the right and underlined with one fast stroke |
| Hand | two copies (a prop given to a new hand blends 0.15 s even across a cut). Copy A, 14: no hand, flat on the cloth at (0.21, 0.392, -0.07), slip up, a long side toward the dad. Copy B, 15: the dad's RIGHT glove on its side edge, `grips.phone(..., { side: "R", height: 0.40 })`, `SIZE tipbill: { w: 0.17, h: 0.25, t: 0.012 }` |

Panel 15: he holds it as a tray, nearly flat, tipped 20 degrees up toward the lens (70 degrees back from upright): bottom edge at (0.57, 0.47, 0.37) toward the lens, top edge at y 0.555, 0.43 in front of his middle (his belly ends at 0.41), its middle 0.55 out. Lens and dad both see the slip about 35 to 40 degrees off square, and it stays under his moustache from the lens. At the start of the shot the slip is about 290 px wide and a capital 62 px (21 px on a phone); after the 1.0 s push it is 460 px wide and a capital 99 px (33 px on a phone). In 14 a capital is under 4 px: nobody reads the twist early.

## 7. Tato lower each joke, and the under-table cheat (panels 01, 03, 05, 07, 13)

His body mark is (-0.12, -0.74), his front 0.07 behind the cloth's rim. From any camera south of the table the far rim hides everything of him below y 0.38. The chair's hoop (top 0.64) stays behind him as a ruler.

| Level | When | Body | What shows over the cloth |
|---|---|---|---|
| L0 | 0 to joke 1 (01, 03) | seated, underside 0.24, top 0.79 | from the waist up: napkin, both hands, whole face; crown 0.15 over the hoop |
| L1 | after joke 1 (05) | off the chair, standing on the floor, underside 0.14, top 0.69; the chair moved back to (-0.14, -1.19) on a cut | from the mouth up: his chin is on the cloth. If the mouth is cut, raise him 0.02 |
| L2 | after joke 2 (07) | crouched 0.07, underside 0.07, top 0.62 | eyes, crown and leaf only; his crown is now under the hoop's top |
| L3 | after joke 3 (13) | the cheat below; in 14 and 15 he is hidden | nothing |

The steps are small (0.10, 0.07): each level needs its own shot, as the sheet has them. The slide from L0 to L1 may play in a front shot, 0.10 down in 0.5 s: the cloth hides his underside in the seat (a check window from the director); the chair moves on the next cut. Faces: pleading (03) = eye 1.2, tilt 0.3, curve -0.2, open 0.3, gloves palm to palm (`clasp`) under his mouth, turned 50 degrees to the dad. L1, L2 = eye 1.15, pupils up at the dad, no blink for 1 s.

**Panel 13 is a cheat stage.** A 0.55 body does not fit under a 0.386 table, so nobody sees him go under: cut from L2 to this. On the cut the real main table and its chairs are hidden and one more `roundtable` stands at (0, 0): `{ r: 0.80, h: 1.30, drape: 0.68, legs: false }`, hem at 0.62. Tato sits on the floor at (-0.10, 0.05), underside 0.01, feet forward, both gloves over his eyes, the mouth left showing (curve -0.4): his leaf just reaches the hem. The dad STANDS (he stood up for joke 3) at (0.77, -0.05), yaw -20, whole under the cheat top (his leaves 1.25, the top's underside 1.265). The near skirt hides him above about 0.67. Under it, in the right third of the frame: one sandal and its sock with the two navy rings, the shorts, the belt with the holster and the underside of the belly. His other leg is outside the frame, where he also crosses the skirt. That is more of him than the sheet's socks: his legs are 0.20 and the belly overhangs them 0.28. The covered face needs a `face-covered` window from the director. On the cut out the cheat table is hidden and the real ones are back; he is seated again by 14.

## 8. The spotlight (panel 11): no new piece

One shot between two hard cuts. No `lights` effect and no night grade: both would dim the dad too.

| Part | Numbers |
|---|---|
| Room | `plate.swaps: [{ at: <cut in>, src: "assets/plates/eatery-day.night.png" }, { at: <cut out>, src: "assets/plates/eatery-day.png" }]` |
| Floor | the `dim: 1` copy of `dinecarpet` (section 1), swapped by scale on both cuts |
| Cone | `lightbeam` at (1.05, 3.0, 0.35), turned to point straight down, `len` 3.0, `w` 1.2, color `#ffe2a8`, `glow` 0.55 |
| Pool | `lightpool` at (1.05, 0.008, 0.35), `w` 1.5, `d` 1.1, color `#ffe6b0`, `on` 1 |
| In frame | the dad on his stand mark, one arm out and up (his arm roots are at 0.54: the glove reaches about his crown, 1.2), his chair half behind him at screen left (lit, as drawn), the dark wall. Hidden on the cut (scale 0.001): table B1 and its chairs, the plant at (3.4, -2.5), the pendants, the waiter, Tato. The main table and the door wall are outside the frame |
| Prove | a one-second draft of the cut in and the cut out before staging (clip-lessons): the swap lands on the cut frame, the cone does not pop |

## 9. Floor plan (starting marks: run `qa/clear.mjs`)

| Who / what | World x, z | Notes |
|---|---|---|
| Main table | (0, 0) | |
| Dad seated; his chair | body (0.80, -0.26), yaw -40; chair (0.92, -0.40), rot -40 | three quarters to the lens, toward the waiter; 0.84 from the table's middle, his belly 0.03 from the cloth. Yaw -20 in 14 and 15 |
| Dad standing (11, 12) | (1.05, 0.35), yaw -25 | reached on the cut; 0.16 clear of his chair, 0.23 of the table |
| Tato; his chair | body (-0.12, -0.74), yaw 9; chair (-0.12, -0.76), rot 9 | section 7; 1.04 from the dad |
| Waiter, order mark | (-0.95, 0.15), yaw 55 | frame 0: at (-1.30, -0.50), mid-step, there by 0.9 s. Yaw 15 for the freeze in 05 |
| Waiter, beside the kid (07, 14) | (-0.80, -0.65), yaw 30 | he serves Tato's plate there; in 14 he leaves from it |
| Waiter's way to the door | by (-1.5, -1.0) | 0.21 clear of the reporter's table; the straight line clips it |
| Reporter's table, menu | (-0.85, -1.75); menu (-0.85, y 0.386, -1.92) | |
| Reporter seated; his chair | body (-0.85, -2.50), yaw 0; chair (-0.85, -2.64) | 0.16 off the wall. In the wide his helmet shows in the gap between the waiter and Tato |
| Kitchen door | (-2.6, -2.97) | |
| Cook, crate | (-2.6, -4.0), y 0.52 | shown for 09 only |
| Table B1, chairs | (2.05, -1.85); (2.05, -2.60) rot 0, (2.80, -1.85) rot -90 | behind the dad |
| Table B2, chairs | (-2.4, 0.9); (-2.4, 1.65) rot 180, (-1.65, 0.9) rot -90 | dresses the left of 10; outside the wide |

Cameras to start from (then `qa/camfit.mjs`, all in one batch). A 9:16 frame is 2.1 m wide where it holds waiter and dad together, about 500 px per metre: the wide and the two-shots cannot be closer. Heights are from the bottom of the frame.

| Shot | Camera | What it must give |
|---|---|---|
| 01 wide | pos (-0.1, 1.15, 4.7), look (-0.1, 0.72, -0.4), fov 45 | waiter left (704 px tall), reporter behind the menu, Tato, dad right (cropped 0.17 at the edge, his face in); the cast between 30 and 66 %; the bar on the cloth's hem and the table legs; captions on the wall band over the windows |
| 02 | pos (-0.85, 0.82, -0.55), look (-0.85, 0.70, -2.3), fov 44 | helmet and eyes over the menu, mic ball at screen left, a window behind |
| 03 | pos (1.0, 0.95, 1.6), look (-0.12, 0.56, -0.74), fov 30 | Tato 39 % of the height, his hands at 39 to 43 %, over the bar; the dad's side on the right 15 % |
| 04, 06 | pos (-0.08, 0.95, 4.5), look (-0.08, 0.78, 0), fov 45 | waiter left (cropped 0.13), Tato between, dad right (cropped 0.19), all three faces in; plates at 42 % |
| 05 | pos (-1.2, 0.95, 2.7), look (-0.66, 0.70, 0), fov 34 | a medium shot, not a close-up (he is 1.38 tall and Tato must fit): the waiter at the left, his eyes at 62 %, the pen at 40 %; Tato's head over the far rim 12 degrees to his right, his mouth at 39 %. Raise the look 0.03 if the bar touches his chin |
| 07 | pos (-0.40, 0.44, 1.5), look (-0.40, 0.52, -0.5), fov 40 | 0.05 over the cloth: the far rim at 40 %, Tato's eyes at 42 % on the right, the pad at 41 to 57 % on the left, the waiter's face above it |
| 08 | pos (-2.85, 0.98, 0.60), look (-2.45, 0.85, -4.5), fov 26, door `open` 0.7 | the doorway as wide as the frame, the photo left of centre, the leaf on the right with its porthole as an ellipse |
| 09 | pos (-2.6, 1.02, -1.7), look (-2.6, 0.94, -3.0), fov 36 | the ring 82 % of the width, its bottom at 37 %; his hands at 44 to 49 % |
| 10 | pos (1.75, 1.0, 0.38), look (-0.95, 0.66, 0.15), fov 36 | the dad's back on the right 15 %, windows behind the waiter, the pad's bottom 1 % over the bar |
| 11 | pos (-0.55, 0.85, 3.3), look (1.05, 0.72, 0.35), fov 36 | frame 2.18 m tall: the dad whole, moustache at 43 to 49 %, eyes 55 %, leaves 74 %, the pool at his feet, the caption above |
| 12 | pos (0.15, 0.95, 2.6), look (-0.9, 0.60, -0.6), fov 40 | the tray at 40 %; the waiter's eyes at 62 %; the reporter 13 degrees to his right; the kitchen door behind him |
| 13 | pos (0.15, 0.30, 2.5), look (0.15, 0.25, 0), fov 44 | frame 1.11 m wide at Tato: floor line 38 %, Tato 38 to 66 % (533 px tall) left of centre, near hem 76 %, the dad's sandal 0.04 inside the right edge. The bar lies on bare carpet |
| 14 | pos (1.6, 1.0, 3.2), look (0.0, 0.62, -0.47), fov 50 | dad right, 80 % in frame, eyes at 57 %; the tray on the cloth at 41 %; the reporter at the centre back; the waiter's back and bow going to the door 10 degrees left |
| 15 | start pos (0.27, 1.45, 1.20), look (0.65, 0.68, 0.15), fov 34; after a 1.0 s push pos (0.39, 1.05, 0.86), look (0.63, 0.57, 0.20) | start: the tray at 11 to 38 %, moustache 45 to 58 %, eyes 75 %, brows 93 %. End: the tray at 10 to 52 %, the moustache at the top. His moustache is costume and does not move: the droop is his lids to 0.4, pupils down, curve 0.4 to -0.3 and the body sinking 0.03 in 0.5 s, before the push |

## 10. Props through hands: 6 holds, 1 release on screen, no take on screen

| Hold | Who | On screen |
|---|---|---|
| Mic | reporter, right | all film |
| Pad | waiter, left | in his hand at frame 0; hidden across cuts |
| Pen | waiter, right | the same |
| Two plates | waiter, a palm under each | section 6 |
| Tray | waiter, both | in his hands at the cut into 12. The ONE release: both hands open at once, the tray falls as a physics body; the glass is thrown (top of its arc y 1.35, 0.9 toward +x, 1.5 turns), `fill` 0.8 to 0.1 as it turns |
| Bill, copy B | dad, right | in his hand at the cut into 15, still for the shot |

Rest pins, no grip: the reporter's left glove on the menu; the dad's gloves on his belly (06: his belly is 0.76 deep, start the hands' forward number at 0.50 as his bench does); the dad's right glove 0.04 short of copy A in 14 (the shot ends before a touch).

Cut already: (1) diners. (2) The water in the air (sheet 12): the glass empties by `fill`. (3) The sheet's five-finger hands (04, 11). (4) The cook's crossing gesture. (5) Any take or put-down on screen: the bill is on the table at the cut into 14. (6) The pad and pen in an apron pocket: they are hidden while his hands are full. Cut next, if one fix round does not clean it: both plates onto the tray (box hold, the same as 12); then the porthole glass; then the apron bow; then the flying glass (the tray alone tips); then the reporter's glove on the menu; then the dad in 13 (cloth and kid carry it).

## 11. Changed from the drawing; risks

- The sheet puts the dad on the left in 01 and 14 and on the right in 04, 06 and 10. One room is one way: dad on the right, waiter on the left, kitchen door back left. As drawn: 02, 03, 04, 05, 06, 08, 09, 10, 11, 12, 13, 15. Mirrored: 01, 07, 14.
- Furniture is potato-low and the chairs are 0.42 wide. Panel 13 is a cheat table and shows the dad to his belt. The cook stands on a crate. The menu stands by itself. The two-shots are as wide as the wide; 05 is a medium shot; 07 keeps the waiter's face.
- Panel 15: the bill is held as a tray, nearly flat, and reads upright for the lens, as drawn.
- Risks to the picture: the dad's arm reach round a 0.76-deep belly (06, 14, 15: the bill's middle is 0.55 out); the fixed V of the `teller` waistcoat on a 1.24 body; the plate is one paint run away from letters or painted chairs, and it is seen at an angle in 03, 10 and 14; the same picture on two walls; pale blue polo on a pale wall; Tato's small steps; the news bar 2 to 4 % under the key prop in 05, 07, 10 and 12; a palm-up plate carry no clip has used; the tray's physics landing; the leaf sweeping the waiter's way.
- Risks to scope: 8 new prop kinds, 2 cast files, 1 plate with its dark copy, 1 kit switch: under ep 2. `props3d.js` gets three registry lines: merge main first.

## 12. Builder tasks (one file set and one bench each), then the director's own

| Task | Owns | Bench (in `bench/`) and done when |
|---|---|---|
| T1 furniture | `engine/page/props-eatery.js` (`EATERY_KINDS`: `roundtable`, `hoopchair`, `dinecarpet`) | `bench-eatery.mjs`: the table from y 1.0, 0.44 and 0.20; dressed; the cheat instance from camera 13; a chair alone; `spud-kid` and `dad` seated at 0.24, backs on the hoop; the carpet at `dim` 0 and 1. Sections 1, 2, 7 numbers hold on the stills |
| T2 door | `engine/page/props-eatery-door.js` (`EATERYDOOR_KINDS`: `kitchendoor`) | `bench-door.mjs`: closed, front; `open` 0.7 from camera 08; `open` -0.4; the photo at full size beside `dad` (every letter clean, cap height 0.085, his colours); camera 09 with a stand-in ball at (0, 0.66 to 1.12, -1.0) |
| T3 hand props | `engine/page/props-waiter.js` (`WAITER_KINDS`: `tallmenu`, `servetray`, `mealplate`, `tipbill`; `WAITER_GRIPS`) | `bench-waiter.mjs`: each kind close; both foods; the slip at camera 15's two sizes. Grip bench (`storyboards/lookdev/make-grip-tests.mjs`): `--prop servetray --hold box` and the palm-up plate on `CHAR=potatobrawl/mash-waiter`; `--prop tipbill --hold phone` on `CHAR=potatobrawl/dad`, tipped 70 degrees back, 0.55 out |
| T4 cast | `characters/potatobrawl/mash-waiter.json`, `characters/potatobrawl/cook.json`, the three `waiterapron` keys in `engine/page/props-bistro.js` | `bench-cast.mjs`: the waiter front, side and back with apron and bow, pad and pen in his hands; the cook with the toque on the crate; casts 1.2 m apart. `node qa/golden.mjs` unchanged (the keys default off) |
| T5 plate | `assets/plates/eatery-day.png`, `eatery-day.night.png` (+ `.night.json`), one README row | `bench-plate.mjs`: both pictures behind a `roundtable` and a seated `dad` from camera 01, and the turned copy from camera 10. Section 1's accept list |

The director's own: the three registry lines in `props3d.js`; `SIZE` entries `servetray` and `tipbill` in `storyboards/lib/grips.mjs`; the solids for `qa/clear.mjs` (tables, chairs, crate, door wall, plants); the generator, cameras, acting, check windows (worn apron, napkin, toque, bead; Tato in his seat during the slide; `face-covered` in 13).

## 13. Open questions for the director (my default)

- Q1 Which way round: dad right, kitchen left (default: 3 panels mirrored). The other way mirrors 7.
- Q2 The plates in 06: one on each palm, as drawn (default), or both on the tray from the start (one hold fewer, and the safer one).
- Q3 Diners: none (default), or two `casinoguest` at B1, backs to the lens.
- Q4 The dad's eye line. Your note says eyes at 0.99; the file's own spec (`DAD-DESIGN.md` section 2, named in `dad.json`) says eye centres 0.835 and brow bars 0.97. I used 0.835 (default). Print `eyes` from a layout once. If it is 0.99: seated he looks 0.12 down on the waiter in 04, and camera 15 starts at fov 38. Nothing else moves.
- Q5 The news bar: one window from 0.2 s to the cut into 15 (default; every camera is framed for it). The sheet has it in 01 and 14 only: that needs `show` as a list of windows in `hud.js`, and frees 05, 07, 12 and 13 to sit lower.
- Q6 The waiter's sweat: one bead in the hook (default), or none as the sheet draws him.
- Q7 The cook: praying hands held (default, the sheet), or the outline's crossing.
- Q8 The bill in 15 reads upright for the lens, so upside down for the dad, as the approved panel draws it (default). story.md's "cards face the holder" would want an over-the-shoulder shot, and then his face is not in it.
- One line on the brief: the sheet serves a steak in 06, and at 46 s the waiter asks "How would you like your steak?". Default: keep both; if it bothers Jonny, `mealplate` can carry another dish for the dad.
