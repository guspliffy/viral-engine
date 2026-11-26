# Kid vs Dad 05 "Carrots help you see in the dark": design of the new pieces

Creative director, 25 Nov 2026. Target: `OUTLINE.md` (hook H1, ending E1), the 15-panel sheet `sheets/kid-vs-dad-05-panels-v1.png` (opened and read panel by panel) and `lines.mjs`. Every size is computed from the cast files and the kit's header comments, not rendered: check each piece on a bench still. Metres, floor y 0, +z toward the camera, +x screen right, hex colours. A potato's b = height above its underside. Tato (`spud-kid.json`): body 0.55 x 0.50 x 0.44, underside 0.14, stands 0.69, eyes y 0.48, mouth 0.39, arm roots about 0.33. Dad (`dad.json`, DAD-DESIGN.md section 2): body 0.98 x 0.86 x 0.76, underside 0.20, stands 1.18 (leaves 1.25), eye centres x +-0.116, b 0.635 = y 0.835, each eye 0.143 x 0.203, moustache b 0.358 to 0.492, mouth y 0.63, arm roots y 0.54 at x +-0.40. (The coordinator's "eyes at 0.99" is `face.final.size`; if the bench prints another eye height, every Dad y below moves with it.) Reporter: stands 0.94, eyes 0.64. No letters or digits on any prop; every hand is three fingers and a thumb; every "random" mark is placed once from a fixed table (no `Math.random`, no clock); no material opacity is ever tweened.

Fixed by the brief, three sheet slips corrected: 01 Dad points two fingers at his OWN EYES; 05 Tato WALKS face first into the closed door; 14 Dad's hand is IN the jar, the jar stays on the shelf.

## 0. Reused unchanged (no builder), and the kit switches

| Need | Use | Numbers |
|---|---|---|
| Storyboard base | set `plain`, `night: true`, `floor: "none"`, `lighting: 2` (episode 2's block) | two places held as props 200 m apart; states by cuts (section 9) |
| Kitchen | prop `kitchenroom` at world (0, 0, 0) = frame K | `fridge: false`, `lamp: 1`, `morning: false`, time 2.75. Back wall z -2.3, counter x -3.9 to +3.9 with its front at z -1.58, window (0, 2.05), set lamp (0, 3.0, -0.3) |
| Fridge | `openfridge` at K (-3.0, 0, -1.90), rot 0 | as episode 2: `open` 0, `lit` 0 until panel 14; then `open` 1 in 0.35 s (ease out), `lit` 1, flicker off for 2 frames at +0.20 s. Handle rest pin at K (-3.34, 0.75, -1.47). Its pickle and rice bowl stay (Dad's fridge is the same sad fridge) |
| Table | `kitchentable` at K (0, 0, 0.35) | w 1.30, d 0.60, h 0.30: the top is under Tato's mouth (0.39) and under Dad's belt (0.36), so the buckle shows as in panel 07. Nobody sits: both stand at it |
| Lamp over the table | `pendant` (props-diner) | bulb at K (0, 1.75, 0.35), shown in 01, 04, 09 only; check its origin on a still |
| Plate | `plate` (props3d: r 0.17, white with a blue rim) | on the table top y 0.30; the carrots on it are new (section 2) |
| Dad's coffee (07) | `teamug`, the library's `mug` hold | scale 1, steam 0.6, his LEFT hand |
| The one cookie (15) | `chunkcookie` | r 0.06, `cut` 1 (bitten), biteAt toward his mouth; in his LEFT glove at the cut into 15, 0.10 left of and 0.04 below his mouth, never over it |
| Tato's bed (06) | `bed` (props3d: 1.1 x 1.95, headboard, pillow, sleeper facing its +z) | `blanket: "#4a67b5"`, `dots: "#6f8ad0"` (tone on tone: reads as the sheet's blue check). Place in section 8 |
| Sun shaft (07) | `lightbeam` | from K (0, 2.05, -2.2) down to the table, len 3.0, w 1.2, color `#fff0c8`, glow 0.5 |
| Reporter, mic | `reporter.json`, `newsmic` | unchanged, mic in his right hand, helmet level and buckled all film |
| News bar | hud `news` | `{ label: "NIGHT MISSION", tag: "LIVE", tagW: 150, count: false, show: [his first line - 0.25, END] }`: 13 characters, cap height 40 px (the bar's maximum). One window, as episode 2 (Q4) |
| Tato's orange | action `skin` (timeline.js, exists) | section 1. No variant files |
| Climb | action `climb` (`to`, `steps`) | section 5 |
| Not used | `wallshelf`, `jokejar`, `eyeglow`, `plaidbed`, `torchbeam`, `cookie`, `doorway`, set `nighthall` | wallshelf is 0.72 wide and unclimbable; jokejar is full of coins and its glass is marked solid; eyeglow is fixed blue-white; nighthall is a set type (a second place needs a prop) and its door is in the wrong wall |

| Kit switch (default = today's picture) | File | What it does |
|---|---|---|
| grade key `tint: "#hex"` | `engine/page/looks.js` (COLOUR ARC, GradeShader) | Today a `grade` key has s, w, c, lift (one number for all three channels): nothing can colour the picture. New uniform `arcTint` (vec3, default 1, 1, 1), applied as `c *= arcTint` right after the lift line, inside `#ifdef ARC`. A key without `tint` keeps the previous key's; the first key's default is white, so every storyboard that has no `tint` is bit-identical |
| grade key `"nv": true` | same | a preset as `"glasses": true`: s 0, c 1.25, lift 0.07, w 0, tint `#52ff7a`. Night vision = luminance through green: black stays near `#05160a`, mid grey gives `#2f9447`, white `#52ff7a`. Keys jump (no dur) on the cut into and out of 02 and 11 |

Check on the first NV still: the news bar is drawn after the grade and stays red and navy (as the sheet). If the HUD goes green too, keep it (a real NV feed would) and say so in the delivery.

## 1. Tato's three colours and the eye glow (07 to 15)

`{ do: "skin", color, to: 1, dur }` on actor `spud` (the body and eyelids; his sleeves, gloves, leaf and blush do not change).

| Step | Colour | From | How |
|---|---|---|---|
| 0 golden | his own (file `#e2a95c`, drawn by castLook as the family skin) | 0 s | `to: 0` |
| 1 slightly orange | `#f39a45` | the cut into 07; holds through 08 | dur 0.01 on the cut |
| 2 bright orange | `#f07a1c` | panel 09 | a visible fade over 0.8 s while he chews (0.5 s after the first handful): the counter turns on screen. Holds to the end |

Bench rule: step 2 must differ from the carrot colour (`#f2801f` sticks have pale lines and a darker `#d9651a` side; Tato is smooth) and his brows and pupils must still read on a 360 px phone still. Fallback if the look's materials do not follow the action: two variant files `spud-kid-orange1.json` / `-orange2.json` (only `body.color`), switched by hiding one actor and showing the other on the cut; then 09's fade becomes a cut inside the shot's first blink.

Eye glow: new worn prop `eyeshine` (section 6), `wear: "spud"`, between his eyes (b 0.341, z = his face front + 0.012; read both from the bench layout), gap 0.15, ew 0.050, eh 0.066, core `#fff3c4`, body `#ffb02e`, halo `#ff7a1a`.

| When | `on` | Why |
|---|---|---|
| end of 09 (last 0.4 s) | 0 to 0.5 in 0.4 s | the glow is born with step 2 |
| 10, 12 | 0.7, `pulse` 0 | wide shots: two orange lamps on a dark body, 30 px wide each at fov 40 from 3 m |
| 13 | 0.5 | his eye is seen from the side: the halo rims his cheek; the green pair answers it |
| 14, 15 | 0 on the cut into 14 | the fridge light kills it; in 15 his flat stare must be his real eyes |

## 2. Carrots: `engine/page/props-carrots.js` (01, 04, 07, 09)

One stick recipe, used by all four kinds: a baton 0.11 long, section 0.022 x 0.020 at one end to 0.016 x 0.014 at the other, corners r 0.004, `#f2801f`, shade side `#d9651a`, 3 pale length lines `#f7a54a` 0.003 wide, cut ends `#f59a3c`.

| Kind | Numbers |
|---|---|
| `carrotstick` (held, 04) | one stick, origin its middle, along x. Pinch hold at its thick end (grip point 0.035 from that end). Key `eaten` 0..1: the thin end shortens toward the grip, length x (1 - 0.65 x eaten); at 1 it hides. Tween 0 to 0.5 on the frame the tip is in his mouth (one bite, 2 frames), then to 1 behind the face. SIZE `carrotstick: { w: 0.11, h: 0.02, d: 0.02 }` |
| `carrotpile` (01, 04) | 14 sticks from a fixed table lying criss-cross in 3 layers, footprint r 0.12, 0.055 high, origin bottom centre: it sits on the `plate` at y 0.319. Spec `n` (default 14) draws the first n of the table; 04 uses n 13 (the held one is the 14th). The plate and pile slide together: both props get the same x tween, K x -0.28 to +0.26 in 0.45 s, ease out (01) |
| `carrotbowl` (07) | white bowl `#f4f1ea`, shade `#d9d6cc`, rim r 0.16, foot r 0.07, 0.12 tall, wall 0.008; 30 sticks: 18 standing and leaning out up to 35 degrees round the rim, 12 lying as a mound 0.05 over the rim. Top of the heap y 0.19 above its base = 0.49 on the table: 0.10 above Tato's mouth, so it stands 0.20 to his side of the table's middle, never in front of his face. Key `fill` 1..0 hides sticks from the top of the table down (07 ends at 0.6) |
| `carrotbag` (09) | brown paper bag 0.22 wide x 0.30 tall x 0.14 deep, `#b98a5a`, shade `#94693f`, light edge `#d2a877`; a rolled open top 0.02 thick, 8 crease lines 0.004 wide, 2 dented corners; blank. 9 stick tips stand 0.03 to 0.06 out of the top. Box hold, both palms on its sides at y 0.12; SIZE `carrotbag: { w: 0.22, h: 0.30, d: 0.14 }`. Keys: `fill` 1..0 (tips sink and hide one by one), `crush` 0..1 (height x (1 - 0.35 x crush), sides bulge 0.015: the last squeeze). In 09 its top is at his chin (0.36), tipped 25 degrees to his mouth; it never covers his eyes |
| `crumbs` (worn, 07, 15) | 9 specks on Dad's moustache: boxes 0.008 to 0.014, 5 `#d9a55c` and 4 `#8a5a2e`, on its front face between b 0.39 and 0.47, x -0.17 to +0.15, 0.004 proud of the hair (hair stands up to 0.034 off the skin: read the surface from the bench). `wear: "dad"`. Key `on` by visibility. In 07's two-shot a speck is 9 to 13 px: the tease is the cut to a head shot at "Dad, you have crumbs." (fov 30 from 2.0 m: 26 to 45 px) |

Stuffed cheeks (09 Tato, 14 and 15 Dad): no face key exists. Default: acting only, `squash` 0.05 held (the body goes wide and low), mouth shut, a chew of `open` 0 to 0.12 at 3 Hz that STOPS when caught (Q2).

## 3. The shelf, the jar, the stool: `engine/page/props-carrots-jar.js` (03, 12, 13, 14, 15)

`pantryshelf`: own frame front +z, origin the floor under its middle. Placed at K (-4.66, 0, -1.30), rot 90 (its front faces +x; its length runs along K z from -1.80 to -0.80).

| Part | Numbers |
|---|---|
| Carcass | 1.00 long x 0.44 deep x 0.98 high. Side panels 0.03 thick, back panel 0.012 `#8a5c36`, wood `#a8703f`, shade `#7d5230`, edge highlight `#c48a52` 0.004 |
| Planks | 4, 0.03 thick, tops at y 0.05, 0.35, 0.65, 0.95. Each sticks 0.035 out past BOTH end panels (the rungs he climbs) and 0.015 past the front |
| Dressing, each once | plank 0.05: two blank cardboard boxes `#c9a57a` (0.26 x 0.18 x 0.20 and 0.20 cube). Plank 0.35: 3 tins `#8f97a3` (r 0.05, 0.12 tall) and a stack of 2 bowls. Plank 0.65: a pot `#b0683f` with a plant trailing 0.25 down the front (12 leaves `#4f8a3c`), one glass jar of pale pasta. Nothing on the top plank but the cookie jar. Nothing within 0.22 of the camera-side end (K z -0.80) on any plank: his hands and feet go there |
| Spec `wall` (default 0 = none; this film 3.6) | a side wall behind it: a slab 0.10 thick, 2.9 high, its face 0.03 behind the back panel (K x -4.91), from K z -2.30 to +1.30, tile teal `#4c8f8c` with a grout grid `#7fb5b0` every 0.20 (the kitchen wall's own look). It closes the room's left side for every camera of 03 and 12 to 15 |
| Solid for `qa/clear.mjs` | carcass and wall. The rungs are rest-pin points: named points `rungL1..3`, `rungR1..3` (plank ends at y 0.35, 0.65, 0.95) |

`cookiejar`: origin the middle of its underside. It stands on the top plank at K (-4.66, 0.95, -1.42).

| Part | Numbers |
|---|---|
| Glass | body r 0.17 from y 0.02 to 0.19, shoulder in to the neck r 0.128 at y 0.235, rim roll (tube 0.012 `#bcd9d6`) at y 0.26: rim top y 0.266 = K 1.216. Tint `#dff1ec` at FIXED opacity 0.28, base ring 0.015 solid, two solid white streaks on the side facing the lens (jokejar's recipe) |
| Mouth | clear opening r 0.116 (0.232 across): Dad's glove (hands.size 1.3) must pass with 0.02 to spare; the builder measures the fist on the bench and widens neck and body together if not |
| Cookies | 22 discs r 0.055 x 0.018, `#c98a45`, edge `#a86a2e`, 5 chips `#4a2c18` each, leaning against the glass and each other from a fixed table. Key `fill` (default spec.fill): 1 = 22 (to the shoulder), 0.7 = 15, 0.45 = 10, 0.25 = 5. Visibility only |
| Lid | glass dome r 0.135, 0.05 high, a ball knob r 0.03, top at y 0.345. Key `lid` 1 on, 0 = lying upside down on the plank 0.24 toward the wall end |
| Hands | the wall is marked glass (solid); the mouth disc is not. The director writes one check window for Dad's right hand in 14 and 15 |

| When | `fill` | `lid` |
|---|---|---|
| 03 (evening 1) | 1 | 1 |
| 09's cutaway or 12 (tease 3: "lighter every night") | 0.45 | 1 |
| 13 | 0.45 | 0: his hand comes for an open jar and a second hand is already at it |
| 14, 15 | 0.25 | 0 |

`stepstool`: a plain wooden step 0.50 wide x 0.34 deep x 0.24 high, `#b07a48`, top `#c48a52`, two side boards with a hand slot 0.10 x 0.03, 4 screw dots. Solid. At K (-3.94, 0, -1.15), hidden until the cut into 12. Why: the jar must be far out of Tato's reach (rim 1.22 = 1.76 of his height; his reach ends about 0.80) AND Dad's goggles must glow "right next to the jar" in 13 AND his hand must go in from above. On the stool his eyes are at 1.075 (the jar's middle is 1.08) and his arm root at 0.78: the rim is 0.44 above it and 0.30 to his right.

## 4. Night-vision goggles: `nvgoggles`, file `engine/page/props-carrots-wear.js` (13, 14, 15)

Worn, `wear: "dad"`, origin between his eyes on the skin (x 0, b 0.635; z from the bench layout). Built to Dad's body, rigid on it. Nothing glows by opacity: lenses are unlit colours.

| Part | Numbers |
|---|---|
| Face plate | 0.40 wide x 0.21 tall (b 0.530 to 0.740: both eyes hidden, the brows at b 0.77 stay visible above it and act), corners r 0.05, 0.02 thick, curved to the face, 0.008 off the skin, `#1e2024`, edge roll `#33363c` r 0.006 |
| Tubes | two, centres x +-0.116, outer r 0.056, 0.075 long toward +z, `#26282d`; a grip ring r 0.060 x 0.012 `#3a3d44` at the front; a bridge block 0.05 x 0.04 between them with one dial r 0.012 `#8a8f98` |
| Lenses | disc r 0.044 at each tube's mouth: `#39ff6a`, an inner glow disc r 0.022 `#c8ffd6` set 0.008 up and to his left, a rim line `#0f7a32` 0.004. Key `lit` 0..1 scales the colours (0 = `#0d3a1c`) |
| Strap | band 0.035 wide x 0.006 thick `#2a2c31` round the head at the plate's mid height, 0.006 off the skin, a steel buckle 0.03 x 0.02 `#9aa0a8` at the back. No strap over the crown (the leaves) |
| Key `up` (0 or 1, a step; switched only on a cut) | 0 = over the eyes. 1 = pushed up: the whole piece rides up the skin and tips back 58 degrees, plate middle at b 0.935, the strap ring tilted with it. Lowest point of any part for abs(x) under 0.25: b 0.872 or higher, 0.012 above the eye zone's top (b 0.86, DAD-DESIGN section 3) with the brows at `shocked`. Its rear edge stops 0.02 short of the leaf nub (crown, x -0.11, z +0.02); the leaves stand behind and over it as in panel 15. At `up` 1: `lit` 0.6 |
| Green halo | not part of this kind: a second `eyeshine` (section 6), `wear: "dad"`, at the lens fronts, gap 0.232, ew 0.050, eh 0.050, core `#eafff0`, body `#39ff6a`, halo `#12b84a`. On 1 in 13, 0.6 in 14, 0 in 15 |

Sizes on screen: 13 (fov 30 from 1.8 m) each lens 176 px across, 96 px apart; 14 (fov 40 from 3.3 m) each lens 70 px (23 on a phone), the plate 320 px wide.

| When | Dad wears | Reads as |
|---|---|---|
| 01, 07 | nothing (eye zone empty) | |
| 13 | `up` 0, `lit` 1, halo 1; the body unlit against black | only two green discs beside the jar |
| 14 | `up` 0, `lit` 1 | goggles over the eyes, brows up above the plate |
| 15 | `up` 1 on the cut | his own guilty eyes, goggles on the forehead |

## 5. Tato on the shelf (12, 13, 15)

He climbs the camera-side END of the unit (K z -0.80), not its front: his back is to the lens as drawn in 12 and nobody stands between him and the jar.

| Beat | Numbers |
|---|---|
| Start | stands at K (-4.63, 0, -0.50), facing -z (rot 180), 0.265 from the end panel |
| `climb` | to y 0.65 in 3 steps, 1.6 s: feet on rungs 0.05, 0.35, 0.65; hands rest-pinned on `rungL/R` one plank above the feet, alternating. End: underside 0.79, eyes 1.13, crown 1.34 |
| Reach (13) | RIGHT hand, shape `open`, from his arm root (K -4.38, 0.98, -0.53) to 0.03 short of the jar's rim at K (-4.66, 1.24, -1.27): 0.83, most of it along the shelf top. If the arm reads stretched, he leans (`lean` 18 toward -z) to bring it to 0.65. It never touches: the cut to 14 comes first |
| 15 | on the cut he is turned to face K +x (rot 90), feet on the same rung, left hand on rung 0.95 |

## 6. The glow kind and two lights: `engine/page/props-carrots-wear.js`

| Kind | Numbers |
|---|---|
| `eyeshine` | `eyeglow`'s recipe (two additive ellipses at x +-gap/2, core, body, a halo 2.5x the ellipse, no tone mapping) with spec colours `core`, `body`, `halo` and `ew`, `eh`, `gap`, `k` (default 0.8). Keys `on` 0..1, `pulse` 0..1 (both read `ps.<name> ?? spec.<name>`: the director seeds them with a dur-0 set at 0). `eyeglow` itself is not touched |
| `moonlamp` | nothing to see: one real point light `#9db8ff`, spec `range` (default 8), key `on` 0..1.5. It is the "dark blue, not black" of every night shot |
| `daywindow` | the morning (07): an unlit card 1.60 x 1.15 placed 0.012 in front of the kitchen's own window glass at K (0, 2.05, -2.278): sky `#7cc4f2` to `#ffe3b0`, a low sun disc `#fff4c2` r 0.14, 3 round clouds, 5 leaf shapes `#6fae4a` at the lower left; an opaque sun patch on the table and floor (a parallelogram 1.1 x 1.6, `#f6d9a0`, 0.002 above the surface, drawn in two pieces so the table top gets its own); one real light `#fff0c8` at (-0.9, 2.3, -1.4) from the card, range 9. Key `on` 0 or 1 shows card, patch and light together |

## 7. The hall and Tato's room: `kidhall`, file `engine/page/props-carrots-hall.js` (02, 05, 06, 08, 10, 11)

One prop, placed at world (200, 0, 0) = frame H. Unlit painted materials (as the fridge cavity), so the night look cannot sink it to black; three walls and a floor, open toward +z and above.

| Part | Numbers |
|---|---|
| Floor | x -5.6 to +3.4, z -1.4 to +1.8. Boards along x, 0.16 wide, `#3b4470`, joints `#2c3359`, 14 knots, each once |
| Back wall | z -1.4, 2.6 high: `#44558f`, a skirting 0.10 `#2f3a68`, a picture rail line at y 1.9. 3 small frames (0.22 x 0.28, dark `#2a325c`, a plain lighter field) at x -0.6, -0.1, +2.2, y 1.35 |
| End wall | x +3.4: the same blue, with a dark arch 1.0 wide x 2.0 high `#161d3c` (the way to the kitchen) |
| Partition | x -2.0, 0.10 thick, full depth: the hall is x -2.0 to +3.4, Tato's room x -5.6 to -2.0 |
| Door | in the partition, centre z +0.10: leaf 0.86 x 1.90, 0.05 thick, six raised panels, `#36437a`, lit panel edges `#5a6db0` 0.006, casing 0.08 `#2b3560`, a brass ball knob r 0.035 `#b9975a` at y 0.80 on both faces (0.11 above Tato's crown: he could never have missed it by day). Key `open` 0..1 = 100 degrees into the hall, hinge on the -z edge. Shut in 05, 06; `open` 1 from 08 on |
| Light strip, key `strip` 0..1 | the gap under the leaf on the ROOM side: a bar 0.80 x 0.022 `#ffd58a` at y 0.011 and an opaque floor fan 0.80 wide at the door to 1.10 wide, 0.45 long, `#b98f5a` to `#6f6a78` in 3 bands. Colours scale with the key; 0 hides both. On only in 06 |
| Windows | two, on the back wall, each 0.90 x 1.00, centre y 1.45, frame 0.07 `#27305a`, a cross bar: W1 at x +0.9 (hall), W2 at x -3.4 (room). Sky `#1d2f6e` to `#3a55a8`, a crescent `#f3ecc8` r 0.09, 12 stars, 2 tree shapes `#16224f` |
| Moon patches | under each window, on the floor: an opaque window-shaped parallelogram 0.9 wide at the wall to 1.2 wide, 1.7 long toward +z, `#6177bd`, its cross-bar shadow `#3b4470` |
| Room dressing | a wall shelf at x -4.6, y 1.45 with 4 blank book spines and a toy rocket 0.22 tall (red nose, grey body, no marks) |
| Solid | back wall, end wall, partition, the door leaf while `open` is under 0.5 |

`floortoys` (same file): spec.items [[x, z, type, rotDeg]], static, each solid. Types: `block` (cube 0.09, corners r 0.008, spec colour), `car` (0.22 x 0.10 x 0.09, body `#4f7fc8`, cabin `#bcd7f2`, 4 dark wheels r 0.028), `ball` (r 0.11, 6 gores `#d8452e` / `#f4f1ea` / `#4f7fc8`), `dino` (0.26 tall, 0.28 long, `#4f9a5a`, 5 back plates `#3b7a46`, a dot eye). `toyblock` (same file): one red cube 0.09 `#d8452e`, the one he steps on: keys `tip` and position as any prop.

| Toy (H x, z) | Type |
|---|---|
| (0.20, 0.25) | `toyblock`, red: the step |
| (-0.70, -0.50), (2.10, 0.20) | block `#e8b93a` |
| (-0.20, 1.10) | block `#d8452e` |
| (-0.90, 0.75) | car, rot 25 |
| (1.50, 0.95) | ball |
| (1.30, -0.80) | dino, rot -30, facing the lens |

Two `moonlamp`: hall at H (0.9, 1.9, 0.3), on 0.9; room at H (-3.4, 1.9, 0.3), on 0.9. Kitchen nights: one at K (-2.4, 2.4, 1.2), on 0.8.

## 8. Floor plans (starting marks: run `qa/clear.mjs`) and cameras (then `qa/camfit.mjs`)

Kitchen (K). Dad is screen LEFT of Tato in every table shot.

| Who / what | K x, z | Notes |
|---|---|---|
| Table | (0, 0.35) | x -0.65 to +0.65, z 0.05 to 0.65 |
| Dad at the table (01, 07) | (-0.55, -0.42), rot 20 toward Tato | belly front 0.03 behind the table edge |
| Tato at the table (01, 04, 07, 09) | (0.55, -0.20), rot -25 | body front 0.03 behind the edge |
| Plate (01) | x -0.28 to +0.26, z 0.28 | Dad's right glove flat on its rim (rest pin) for the push |
| Bowl (07), mug | bowl (0.30, 0.28); mug in Dad's left hand | |
| Tato looking up (03) | (-3.95, -0.30), rot 60 toward the unit, `look` [-0.5, 0.8] | the jar's rim is 0.74 above his eyes |
| Shelf unit, jar, wall | section 3 | |
| Stool, Dad on it (13, 14, 15) | (-3.94, y 0.24, -1.15), rot 0 | 0.09 clear of the unit, 0.07 of the fridge side, his back 0.04 in front of the counter. RIGHT hand in the jar (to y 1.10, 0.11 under the rim); LEFT glove on the fridge handle, 0.38 from its arm root: his flinch pulls the door (if that reach reads badly, the hand rests on his belt and the door swings on its own) |
| Tato on the unit | section 5 | 0.93 from Dad's middle: clear |

Hall (H).

| Who / what | H x, z | Notes |
|---|---|---|
| Bed (06) | middle (-4.55, 0.95), its headboard toward +x | Tato as its sleeper, propped on the pillow, facing -x, eyes about y 0.75 |
| Tato's walk (05) | from (-3.50, 0.10) to (-2.31, 0.10), facing +x | 5 tiptoe steps, stride 0.24, 0.5 s each, both arms out front (`{ o: [0.10, 0.22, 0.42] }`, hands `open`) but 0.06 apart either side of the knob line and 0.20 too low: the hands pass beside nothing and his FACE meets the leaf first. On contact: `squash` 0.12 for 3 frames, the leaf shakes 0.006 for 0.2 s, he tips back 8 degrees and holds |
| Tato on the block (08) | (0.20, 0.25), facing +z | right foot on the block, left leg up, both gloves flat over his mouth (`cheeks` pose pulled in to the mouth line: the eyes stay clear), the block tips 10 degrees |
| Spy roll (10) | from (-1.40, 0.15) to (2.60, 0.10) | a tucked roll, 2 turns in 1.5 s, passing 0.25 clear of block, car and ball; ends in a crouch (`crouch` 0.14) |
| Reporter (02, 11) | (2.30, 0.45), rot -35, `crouch` 0.14 | the hall and the door run away behind him to screen left |

| Shot | Camera (pos, look, fov) | Must give |
|---|---|---|
| 01 two-shot | K (0.15, 0.75, 3.30), (0, 0.52, -0.10), 34 | 923 px a metre: plate 314 px, a stick 100 px; Dad's hand at his eyes above y 700 px, the bar clear |
| 03 | K (-2.90, 0.35, 1.20), (-4.45, 0.80, -1.10), 42 | low: the unit towers, the jar in the top fifth under the label band, the fridge at frame right |
| 04, 09 close | K (0.55, 0.50, 1.40), (0.55, 0.44, -0.20), 30 | his face 600 px wide; the stick 250 px |
| 07 | K (-0.20, 0.80, 3.10), (0, 0.55, -0.10), 34 | the sunny window's lower half over their heads; head shot of Dad for the crumbs: K (-0.45, 0.85, 1.60), (-0.55, 0.80, -0.42), 30 |
| 12 | K (-2.50, 0.90, 2.30), (-4.35, 0.75, -0.95), 40 | Tato's back on the unit's end, the jar above him, the closed fridge right |
| 13 | K (-4.15, 1.30, 0.55), (-4.50, 1.10, -1.25), 30 | his shoulder and arm frame left, the jar middle, the two lenses right of it |
| 14 | K (-4.40, 1.05, 2.00), (-3.80, 0.95, -1.30), 40 | jar left, Dad middle, the lit cavity behind his left side; all of him above the bar |
| 15 | K (-3.20, 1.20, 0.20), (-4.20, 1.10, -0.90), 30 | Tato's face frame left and near, Dad right; the goggles on his forehead under the caption band |
| 02, 11 | H (3.25, 0.62, 1.55), (1.60, 0.58, 0.20), 40; 11: fov 28 | his mouth 150 px above the bar; W1 and the door behind him |
| 05 | H (-3.30, 0.70, 2.70), (-2.50, 0.45, 0.10), 38 | the leaf seen at 3/4 on frame right, W2 behind him on the left |
| 06 | H (-5.50, 1.05, -0.40), (-2.00, 0.50, 0.40), 36 | the door and its strip on the left, his face on the pillow right |
| 08, 10 | H (0.60, 0.60, 3.00), (0.30, 0.42, 0), 36; 10: (0.80, 0.45, 2.90), (0.60, 0.30, 0), 40 | W1 over him, 3 toys in frame |

## 9. Light states (all switched on cuts), faces, sounds

| State | Panels | `lights` fx (to / lamp) | `grade` key | Props |
|---|---|---|---|---|
| Evening | 01, 03, 04, 09 | 1 / 1 | s 1.12, w 0.5, lift 0.03 | pendant on |
| Night vision | 02, 11 | 0.15 / 0 | `nv: true` | hall moonlamp |
| Night hall, room | 05, 06, 08, 10 | 0.15 / 0 | s 0.95, w -0.5, lift 0.03 | moonlamps; `strip` 1 in 06 |
| Morning | 07 | 1 / 0 | s 1.15, w 0.8, lift 0.07 | `daywindow` on, `lightbeam` |
| Night kitchen | 12, 13 | 0.12 / 0.12 | s 0.95, w -0.5, lift 0.02 | kitchen moonlamp 0.8; in 13 the moonlamp 0.35 and Dad's light share is the lenses |
| Fridge | 14, 15 | 0.12 / 0.12 | s 1.05, w -0.2, lift 0.06 | `openfridge` open 1, lit 1 |

Readability rule for every night still: the darkest part of a character's body is `#2a3050` or lighter and its face differs from the wall behind by 25 or more in luminance (0 to 255); else raise that state's lift by 0.02, once.

Faces (`expr` `set`, face.js keys):

| Beat | Values |
|---|---|
| Tato disgusted (01) | eye 0.55, tilt -0.2, browY -0.02, curve -0.7, open 0.35, smirk 0.2; `lean` 12 back, both palms up between him and the plate |
| Tato scrunched (04) | eye 0.06, tilt -0.45, browY -0.04, curve -0.6; chew `open` 0 to 0.15 |
| Tato listening (06) | eye 1.2, pupil 0.8, tilt 0.2, curve -0.1, `look` to the door |
| Tato at "Dad, you have crumbs." (07) | eye 0.7, tilt -0.15, raise 0.03, curve -0.05, pupils on the moustache |
| Tato frozen (08) | eye 1.3, pupil 0.6, tilt 0.35, browY 0.05, `noblink` for the hold |
| Tato, the bag (09) | eye 0.08, tilt -0.3, curve 0 |
| Tato spy (10, 12) | `focused` with eye 0.75 |
| Tato flat (15) | eye 0.6, tilt -0.05, browY -0.02, curve -0.05, pupils on Dad, no blink in the last 1.5 s |
| Dad, the law (01) | eye 0.9, tilt -0.3, browY -0.01. RIGHT glove on the plate; LEFT hand: `grip` shape `point` with `set` opening the second finger too if the glove allows a two-finger fork (else `point`), fingertips 0.04 from his own left eye's outer lower edge (x +0.20, b 0.58: beside the eye, never over the iris), held 0.5 s, then turned to point at Tato on "you see" |
| Dad innocent (07) | eye 0.1 (shut over the mug), tilt 0.2, browY 0.02, curve 0.5; at "...Carrot crumbs.": eye 1.05, tilt 0.12, `look` [0.5, 0.1] away from Tato |
| Dad caught (14) | eyes hidden: brows tilt 0.4, browY 0.05, mouth shut, the chew stops, `squash` 0.05 held, no move for 0.8 s |
| Dad guilty (15) | eye 1.1, pupil 0.75, tilt 0.35, browY 0.03, `look` [-0.7, 0.05] (away from Tato), `noblink`; one swallow (`squash` 0.03) before "...Carrots." |
| Reporter | whisper = his neutral with eye 0.8; amazed (11) = eye 1.2, pupil 0.7, tilt 0.3, open 0.6, mic 0.15 forward |

| Sound | Existing name | New? |
|---|---|---|
| Bonk on the door (05) | `thud` + `hit-wood` on the same frame | no (`pan-bonk` is a metal pan: wrong) |
| Crunching from the kitchen (06) | `ai/crunch` x 3, 0.5 s apart, gain 0.15 | no |
| Carrot bite, the bag (04, 09) | `ai/crunch`; bag `crinkle` | no |
| Toy block (08) | `hit-wood`, gain 0.3 | optional new: a short rubber toy squeak |
| Tiptoe steps | `ai/step-wood`, gain 0.2 | no |
| Plate slide (01) | `ai/bowl-scrape` | no |
| Coffee (07) | `ai/sip` | no |
| Fridge opens (14) | `door-open` (as episode 2) + `lampbuzz` 0.3 s | optional new: a fridge seal pop and hum |
| Cookie crunch (14, before the light) | `ai/crunch`, gain 0.3; jar `put-down-glass` | no |
| Night vision on (02, 11) | `radio` | no |

## 10. Changed from the drawing; open questions (my default); risks

- The three brief corrections above. Dad stands on a step stool in 13 to 15 (section 3: reach and the lens height). The room is mirrored against 03 and 12: the unit is LEFT of the fridge on its own side wall, because the kitchen's counter fills the back wall and the fridge door hinges on the right. Dad is screen left in 07 as in 01 (the sheet swaps them).
- 05's door is Tato's own room door, hit from inside; 06's light strip is under that same door (the sheet says the kitchen door): one door carries night 1, and "past the door" on night 2 is true. Toys lie in the hall beyond it.
- Nobody sits at the table. No cheek bulge. 12's jar keeps its lid; 13's has none. The reporter's helmet stays blue under the green grade (it reads green on screen).
- Q1 The stool: yes (default). Without it Dad's arm stretches 0.71 from its root and his lenses sit 0.24 under the jar's middle, beside the plank.
- Q2 Stuffed cheeks: acting only (default), or two skin domes as a worn prop (they would have to follow the `skin` tint on Tato: one more task, risky).
- Q3 Night-vision look: flat green (default). A scan-line or grain pass is more code in `looks.js` and shimmers on a phone.
- Q4 News bar: one window from the reporter's first line to the end (default, as episode 2), or only inside 02 and 11 as drawn (then two `show` windows: check that `show` takes a list).
- Q5 Tato's orange by the `skin` action (default) or by two variant files (section 1).
- Risks: the night look is global, so evening and morning are made by lights, a grade key and one real light each: 07 may read as a lit night kitchen (then `daywindow`'s light to 1.5x and lift 0.10). Additive `eyeshine` over a pale orange face may wash out (then k 1.1 and the halo `#ff5a00`). Glass at fixed opacity with a hand inside on the CPU renderer (fallback: an opaque pale jar with a cut-out front, as episode 2's fog pane). Dad's hand, the stool and the handle in one pose: three contacts. The `skin` action finds materials by colour: check Tato's lids follow. Up to 4 real lights in the kitchen at the end (set lamp, moonlamp, fridge, pendant off).
- Cut first, if one fix round does not clean it: the handle hold, the plant on the unit, the jar's lid on the plank, the sun patch on the table, `pendant`, the toy dino. Never cut: the jar on top, the two green lenses, the three skin steps, the light strip, the bonk.

## 11. Builder tasks (disjoint files; generator staging, marks, cameras and check windows are the director's)

Each builder writes its own bench `storyboards/series/kid-vs-dad/05-carrots/bench/bench-<task>.mjs` (set `plain`, look `anime-pro`, castLook `sheet`) and hands back the still sheet. T1 goes first with step 0: the four new prop files as stubs exporting an empty kinds object, and their four import lines in `props3d.js`, so T2 to T4 never touch the registry.

| Task | Files (owner) | DONE = a bench still showing | Size (lines) |
|---|---|---|---|
| T1 Carrots | `engine/page/props-carrots.js`; `engine/page/props3d.js` (4 import lines, step 0); `storyboards/lib/grips.mjs` (2 SIZE entries) | Tato at the table: plate + pile n 14 and n 13, the stick pinched at his mouth at `eaten` 0, 0.5; the bowl at fill 1 and 0.6; the bag in both palms at fill 1 / crush 0 and fill 0 / crush 1; Dad's head with `crumbs` on, fov 30 | 180 |
| T2 Shelf, jar, stool | `engine/page/props-carrots-jar.js` | the unit with `wall` 3.6 beside `openfridge` from camera 03; the jar at fill 1, 0.45, 0.25, lid 1 and 0; Dad on the stool with his right fist inside the mouth (print the fist's width and the clearance); Tato pinned on rungs 0.65 / 0.95 | 200 |
| T3 Goggles and glows | `engine/page/props-carrots-wear.js` | Dad's head, HEAD camera of his bench: `up` 0 lit 1, `up` 1 lit 0.6 (print the lowest point b: 0.872 or more), `shocked` under `up` 1 with the eye zone empty, a profile; `eyeshine` orange on Tato at on 0.5 and 0.7 against `#2a3050`, green on the lenses in the dark; `moonlamp` and `daywindow` on / off over the kitchen window | 190 |
| T4 Hall | `engine/page/props-carrots-hall.js` | cameras 02, 05, 06, 08 of section 8 with Tato and the reporter standing in: door shut and `open` 1, `strip` 0 and 1, the seven toys, every body lighter than `#2a3050` | 200 |
| T5 Green grade | `engine/page/looks.js` | the same hall still three times: no grade, `nv: true`, `tint: "#ffd0a0"`; plus `node qa/golden.mjs` with no difference | 30 |
