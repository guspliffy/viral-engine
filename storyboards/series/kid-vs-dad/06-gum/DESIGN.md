# Kid vs Dad 06 "Swallowed gum glues your stomach": design of the new pieces

Creative director, 25 Nov 2026. Target: the approved 15-panel sheet v1 (`kid-vs-dad-06-panels-v1.png`, opened and read panel by panel), `OUTLINE.md` (H1 + E1) and `lines.mjs`. Every size is computed from the cast files (`dad.json` as merged in 20a8a48, `spud-kid.json`, `reporter.json`), `potato.js bodyPoint` and the kit headers, not rendered: check each piece on the bench (section 6). Metres, floor y 0, +z toward the camera, +x screen right, hex colours. **Body frame** = a worn prop's x, y, z on its wearer: y up from the FEET (so on a standing body it is the world height), +z out of the face. th = angle round a body from the front in radians, + toward its left. No letters or digits anywhere except "DAD 1995" on the X-ray and the news bar. In the new file: no alpha material, no light, no `Math.random`, no clock; every mark is drawn once from a fixed table; things appear by visibility or scale on cuts, never by opacity.  Two sheet misses are corrected here: the egg timer shows NO numbers (section 2.2) and the X-ray shows NO skeleton (section 2.7).

## 0. Reused unchanged (no builder)

| Need | Use | Numbers |
|---|---|---|
| Kitchen | set `kitchen` | `morning: true`, `time: 6.98` (dinner at seven), `lamp: 1`, stock fridge kept. Wall z -2.30, counter front z -1.58 (top y 0.95, x -3.83 to 3.83), fridge x -3.45 to -2.55 with its front at z -1.525, window x -0.88 to 0.88 and y 1.45 to 2.65, the hanging lamp at (0, 3.25, -0.40) |
| Dad | `potatobrawl/dad` | unchanged, read-only. Stands 1.18, leaves to 1.25 (x -0.13 to +0.24), brows up to 1.06 at `shocked`, eyes 0.835 (x +-0.116), moustache 0.56 to 0.69, mouth 0.63, arm roots (+-0.43, 0.54) in sleeves r 0.08, belt 0.36 to 0.41, shorts hem 0.175, resting hand (+-0.51, 0.465, 0.06), glove size 1.3 |
| Tato | `potatobrawl/spud-kid`, cast id `spud` | unchanged. Stands 0.69; mouth 0.39, eyes 0.48, skin front z 0.22 in his body frame |
| Reporter, mic | `potatobrawl/reporter`, `newsmic` | unchanged; stands 0.94 (helmet 0.985), eyes 0.64, mouth 0.50; mic in his right glove until the cut into panel 14 |
| Doorway | `doorway` (props-notyet.js) | at (4.75, 0, -2.29), w 1.3, h 1.9: the only free wall beside the counter |
| Table | `kitchentable` | centre (0.16, 0, 0.35), w 1.00, d 0.80, h 0.32, `runner: [0.01, 0.01]` (bare wood as drawn): x -0.34 to 0.66, z -0.05 to 0.75. Low on purpose: a lying Tato's belly is then at 0.76, under Dad's eyes |
| Chair | `chair` (props3d.js) | scale 0.6 at (0.16, 0, -0.32), facing +z: seat 0.252 |
| Wall dressing | `wallshelf` x 2 | on the back wall at (-1.75, y 1.35) and (3.30, y 1.35): the sheet's shelves, and the wall beside the door is not bare |
| Glass (06) | `waterglass` | scale 1.3 (r 0.049, h 0.13), `fill: 0`, upside down (tip 180) with its origin at y 0.89: it stands on Tato's belly |
| Tongs (08, 09) | `hptongs` | `len: 0.45`, open 0.25, "snip" = open 0 for 2 frames (pads stay 0.16 apart: they never touch the sweater). There are no wires to build: that is the joke |
| Bowl (10 to 13) | `soupbowl` | scale 0.75 at (0.16, 0.32, 0.20), `soupHi "#f6ebc6"`, `soup "#efdfa8"`, `soupLo "#dcc888"` (porridge; never named as potato) |
| Spoon (11) | `tablespoon` | scale 1 (0.30 long), `food: 1`, `fk: 0`; `food: 0` from the cut into 12 |
| Sweat (15) | `sweatbead` (props-foodhome.js) | `wear: "dad"`, from (-0.22, 1.00, 0.22) to (-0.245, 0.84, 0.285) in 1.1 s, then scale 0: a real bead on the skin, as episode 2 (story.md bans the symbol) |
| News bar | hud `news` | `{ label: "GUM EMERGENCY", tag: "LIVE", tagW: 150, count: false, show: [end of line 2 - 0.25, END] }` |
| Sounds | built in | `pop`, `gulp`, `bubbling` (the two gurgles), `ring` or `bell` (the timer). A burp and a tick are not in the kit: the director asks |

## 1. Faces per beat (the rig's face keys; a blank cell = that character's own neutral)

| Beat (panel) | Dad | Tato | Reporter |
|---|---|---|---|
| Bubble and pop (01) | | eye 1.15, pupils down on the bubble; at the pop eye 0.06 for 0.25 s, tilt 0.2, one squash 0.05 | |
| Gulp, frozen (02) | eye 1.25, pupil 0.7, tilt 0.1, browY 0.04, curve -0.15; no blink until his line ends | eye 1.3, pupil 0.7, browY 0.05, curve -0.1, open 0.5 then 0 on the gulp | |
| Cover and live lines (03) | | | crouch 0.14; eye 1.1, pupil 0.75, tilt 0.2, curve -0.2; a glance at the table between lines |
| Table, timer, "Mitts.", "Helmet." (04, 05) | eye 0.8, tilt -0.22, browY -0.03, curve -0.25 | lying: eye 0.06, curve 0.1 (patient, as drawn) | |
| Listening, "It's sticking." (06) | eye 0.5 (a squint), tilt -0.15, curve -0.2; on the line eye 1.2, pupil 0.75, tilt 0.2, browY 0.03, curve -0.3 | eye 0.06 | |
| "Mine is fine." (07) | eye 1.15, pupil 0.8, tilt 0.05, browY 0.05, curve 0; pupils away from the mic; one blink | | eye 0.7, tilt -0.18, curve -0.1 |
| Wires (08) | eye 0.75, tilt -0.25, browY -0.03, curve -0.3; pupils on the tong tips | on "It's my sweater.": eye 0.6, tilt -0.05, browY -0.02, curve -0.05, pupils on Dad | |
| Gum offered (09) | eye 1.3, pupil 0.6, tilt 0.3, browY 0.06, curve -0.4, open 0.8 | eye 1.2, browY 0.04, curve 0.45 | aside: eye 0.8, tilt -0.1, curve 0.05, smirk 0.25 |
| Full armour, spoon (10, 11) | eye 0.7, tilt -0.2, curve -0.3; on "slowly" tilt 0.1 and a 0.01 tremble | eye 1.2, pupil 0.8, pupils on the spoon, open 0.7 | |
| Chew, burp (12) | over the lid: eye 1.1, pupil 0.75, tilt 0.25, browY 0.03 | eye 0.06, curve 0.2, 3 squashes of 0.03 in 1 s; burp: open 0.5 for 0.2 s | peek: eye 1.15, pupil 0.75, tilt 0.15 |
| "Still works." / "Impossible." (13) | eye 1.2, pupil 0.8, tilt 0.1, browY 0.05, curve -0.1, open 0.3; after the ring eye 0.06, curve 0.6 | eye 0.6, tilt -0.05, browY -0.02, curve -0.05; after the ring eye 0.06, curve 0.4 | |
| X-ray (14, 15) | eye 1.0, pupil 0.75, tilt 0.3, browY 0.02, curve -0.15; pupils off the film, down and away; two fast blinks, then none for the last 1.5 s | flat stare at Dad as in 13 | eye 0.85, tilt -0.25, browY -0.03, curve -0.15; no blink for the last 1.5 s |

Dad's arm poses (`o: [out, up, fwd]`): surgeon on "Mitts." `[0.02, 0.62, 0.30]` (mitts beside his face, outside x +-0.35); mitts on his belly (07) `[-0.20, 0.27, 0.51]`; flinch (09) `[0.10, 0.70, 0.30]`; GUARD (section 3) `[0.19, 0.31, 0.08]`, elbow 0.12; mitt on his chest (15) `x: [-0.10, 0.31, 0.50]`, under the moustache, never on the mouth.

## 2. The eight new kinds: `engine/page/props-gum.js`

Exports `GUM_KINDS` (registered in `props3d.js` with one import line and one `Object.assign` line, as `FOODHOME_KINDS`), `GUM_GRIPS = { potlid: { back: [0, 0, -0.04] } }` and `GUM_FIT.dad = { rx 0.43, rz 0.38, cy 0.69, ry 0.49, taper 0.14, square 2.3 }` (a local copy of `potato.js bodyPoint` without lumps, as the fit object in props-heist.js). A USAGE header as props-foodhome.js. Worn kinds copy `potatoRoots` and `wearSquash` from props-spree.js and mark every mesh `userData.steam` (the checks see through them).

### 2.1 `gumbubble` (worn by Tato, panel 01) and `gumstick` (panel 09)

Colours: gum `#f58fb5`, shade `#e0709c`, highlight `#ffd3e3`. `gumbubble`: `wear: "spud"`, x 0, y 0, z 0; it places itself from the numbers below (his body frame).

| Part | Numbers |
|---|---|
| Bubble | one opaque sphere, a highlight patch 0.35 r wide on its upper left. Key `blow` 0..1: r = 0.02 + 0.10 x blow, centre (0, 0.385 - 0.25 r, 0.215 + 0.92 r). At blow 1: 0.24 across (48 % of his width), top at 0.475: his eyes stay over it |
| Key `pop` 0..1 (tween it linearly over 0.3 s) | above 0 the sphere is hidden. 0 to 0.25: a burst star (flat, 9 uneven lobes, r 0.19, 0.01 thick, facing +z at the bubble's last centre, scale 0.6 to 1.15): the sheet's splat, 2 frames. 0 to 1: 8 bits (balls r 0.012 to 0.022) fly from the centre along 8 fixed directions, 0.22 to 0.40 m, dropping 0.10 x pop squared, scale to 0 from 0.7 |
| Stuck bits | 5 flat blobs on his skin (0.004 off, 0.012 thick; skin = an ellipsoid 0.25 x 0.275 x 0.22 about y 0.415): forehead (th 0.15, y 0.625, r 0.040), (th -0.50, y 0.61, r 0.026), his right cheek (th -0.85, y 0.40, r 0.050), left cheek (th 0.80, y 0.36, r 0.036), chin (th 0.10, y 0.315, r 0.040, a drip 0.05 long). None within th +-0.6 between y 0.40 and 0.58: eyes, brows and mouth stay clean. Shown while pop is over 0.15 and key `stuck` is 1 |
| When | frame 0: blow 0.5 (already 0.14 across); blow 1 at 0.37 s; pop 0 to 1 from 0.40 s; `stuck: 0` on the cut into panel 03 |

`gumstick`: origin bottom centre, standing. Stick 0.11 x 0.034 x 0.008 with 4 cross grooves `#e0709c`; its lower 0.062 in a foil sleeve `#dfe4ea` 0.036 x 0.010 with a torn top of 5 teeth 0.006 deep, and a paper band `#f4f1ea` 0.03 tall with one pink stripe 0.006. Blank. Twice life size on purpose (22 % of his width). Hold: thin pinch on the sleeve, `from: 0.25`; SIZE `gumstick: { len: 0.11, r: 0.005 }`.

### 2.2 `eggtimer` (panels 04, 05, 10, 13): the natural counter

Origin: bottom centre, the dial facing +z. 0.18 across, 0.17 tall with the stem: big on purpose.

| Part | Numbers |
|---|---|
| Body | sphere r 0.09 squashed to 0.144 tall on a flat foot r 0.045; `#d8322b`, under the seam `#b8242a`; seam line `#8f1f1c` 0.004 wide at y 0.074 |
| Top (turns) | the upper half is one group: 5 groove lines `#b8242a` 0.004 wide from the stem to the seam, 5 pointed sepals `#3f9a3a` 0.05 x 0.02 drooping 20 degrees, a stem r 0.008 x 0.022 `#2f7a2e` bent 15 degrees |
| Dial (fixed) | the front is cut flat at z 0.070: plate r 0.057 `#f4efe2`, bezel ring r 0.058, tube 0.005, `#fbf7ec`. 12 plain ticks `#11101c` from r 0.046 to 0.054, 0.003 wide (every third from r 0.042, 0.0045 wide). A red zero mark (triangle 0.012) on the bezel at 12 o'clock. NO digits |
| Wedge and needle | a red pie `#e0392b`, r 0.040, 0.001 proud, clockwise from 12 o'clock: 60 slices of 5 degrees, slice i shown while i < round(60 x left). A needle `#11101c` 0.040 x 0.004 on the wedge's moving edge, hub r 0.007 |
| Key `left` 0..1 | time left: the wedge spans 300 degrees x left, the needle follows, the top turns 300 degrees x left. Default `spec.left ?? 1` |
| Key `ring` 0..1 (tween linearly over 1.2 s) | everything above the foot shakes: x 0.004 sin(40 pi ring), roll 4 degrees x sin(40 pi ring + 1.3), hop 0.006 abs(sin(20 pi ring)), all x sin(pi ring). Still at 0 and at 1 |

It stands on the table's near left corner at (-0.24, 0.32, 0.56), beside Tato's feet when he lies. Dad winds it in panel 05: his left glove rests on its top (rest pin) while `left` goes 0 to 1 in 0.5 s. Then it runs down: about 0.75 at 25 s, 0.45 at 38 s, 0.10 at 50 s, 0.05 on "slowly" (the outline's 0:03), 0 and `ring` after "Impossible.". In a wide it is only about 105 px across: it gets a 0.6 s insert at each step (the panel 05 camera).

### 2.3 `ovenmitts` (Dad, from the cut after "Mitts." to the end)

Decision: ONE worn prop that follows both of his hands. Not a hand colour (the glove colour is `costume.hands` in his own file) and not a second cast file (a copy of `dad.json` would drift from the other thread's). `wear: "dad"`, x 0, y 0, z 0. Each frame, in the same hook as `wearSquash`: find his root (`potatoRoots`), take the two children whose `userData.side` is "L" / "R" (the rig's glove groups), `updateMatrixWorld(true)` on them, and give each mitt group that glove's world matrix x scale(1 / 1.3) (`matrixAutoUpdate = false`; the glove's own mirror puts both thumbs right). A pure function of the frame's pose. The real glove stays inside, unseen. Key `on` 0 / 1 = visibility (also off while the glove is hidden).

Sizes in the glove's own frame at Dad's size (+y to the fingertips, +z out of the palm, +x to the thumb). His open glove spans x -0.078 to 0.107, y -0.10 to 0.139, z -0.043 to 0.065: the shell is bigger in every direction, so no finger shape shows through.

| Part | Numbers |
|---|---|
| Shell | ellipsoid, centre (0, 0.025, 0.008), half axes 0.095 x 0.135 x 0.068 |
| Thumb | ellipsoid, centre (0.088, 0.015, 0.012), half axes 0.040 x 0.062 x 0.040, leaning 30 degrees out |
| Cuff | oval tube from y -0.095 (0.066 x 0.052) to y -0.175 (0.074 x 0.060), an edge band 0.024 tall `#a82a22`, a hanging loop r 0.012 on the little-finger side |
| Quilt | `#c8352c`; two families of 5 lines `#8f241d` 0.004 wide (diamonds 0.038 across) on back and palm, a paler dot `#d9483e` in each diamond: one canvas 256 x 256, mapped once |
| Size | 0.33 long, 0.22 wide with the thumb, 0.136 thick: a quarter of his width, as drawn. About 1 600 triangles each |

Holding in mitts: the shell does not close, so a held thing comes OUT of the mitt (as the spoon is drawn in panel 11). Rule for the director: put the grip point at the glove's centre for anything gripped in a fist (tongs, spoon), and use `gap: 0.085` where a palm lies on a surface (the shell's palm face is 0.076 from the glove's centre).

### 2.4 `colanderhat` (Dad, from the cut after "Helmet." to the end)

Origin: the centre of the rim circle; unworn it stands on its rim. Worn: `wear: "dad"`, (0, 1.07, 0), tip -5 (back), rot 6.

| Part | Numbers |
|---|---|
| Dome | a lathe, outer rim r 0.300, 0.24 high, wall 0.006, profile r(h) = 0.300 x (1 - (h / 0.24) cubed) to the power 1/3 (steep sides, a flat crown: it must hold his leaves). Rolled rim r 0.302, tube 0.009. A foot ring on top: r 0.095, tube 0.008. Total 0.25 high |
| Handles | 2 half loops r 0.045, tube 0.008, centres (+-0.300, 0.035, 0), tipped 25 degrees down, each on two rivet plates 0.020 x 0.014 |
| Holes | painted, not cut: 115 dark dots `#3d444d` r 0.008 on one canvas 1024 x 512 mapped once: rings at h 0.04, 0.08, 0.12, 0.16, 0.195 with 28, 26, 22, 18, 12 dots, each ring half a step off the last, and 1 + 8 on the crown |
| Steel | `#b9c2cc` (metalness 0.6, roughness 0.35), shade and inside `#8e98a4`, one painted highlight streak `#e6ecf2` 0.02 wide |
| Fit (his real numbers) | at y 1.07 his head is 0.270 half wide and 0.240 half deep: 0.024 free a side, 0.054 front and back. The rim is 0.01 over his highest brow pose (1.06); the front rises to 1.10 with the tip. His leaves reach y 1.26 at x 0.05 and 1.20 at x 0.24; the dome's inside is at 1.30 and 1.25 there. Top of the colander 1.32, handles out to x +-0.39. `wearSquash` |

### 2.5 `basketarmour` (Dad, from the cut into panel 10 to the end)

A white laundry basket with its bottom out, worn like a barrel. It sits LOWER than drawn: Dad B's arms leave his body at y 0.54, so the lip is at 0.44, under the sleeves; it covers belly, belt, buckle, holster and shorts. Origin: the centre of its lower edge. Worn: `wear: "dad"`, (0, 0.20, 0).

| Part | Numbers |
|---|---|
| Wall | an oval ring 0.24 high, 0.012 thick: outer half axes 0.455 x 0.425 at the bottom, 0.497 x 0.467 at the top. Lip: a rolled band 0.022 tall, 0.014 proud (0.511 x 0.481). A solid band 0.03 tall at the bottom. `#f1f2ee`, shade `#cfd3d0`, inside `#dfe2de`, 6 faint mould lines |
| Holes | painted: one canvas 1024 x 256 mapped once round: 3 rows of 28 rounded rectangles 0.030 x 0.044 (corner r 0.008) `#6c7f95` (his shirt in shade), rows at 0.055, 0.115, 0.175 up the wall. Two handle slots 0.11 x 0.03 at th +-1.571, 0.195 up, each in a raised frame 0.006, in place of the holes there |
| Fit | his cloth at lip height is 0.436 half wide and 0.416 half deep at the belly: 0.05 and 0.04 free. The holster (out to 0.46 at th -0.95) stays inside the wall |
| Straps, 2 | `#7a4b2a` (his own leather), 0.036 wide x 0.006 thick, a stitch line `#a06a3c` 0.004 wide near each edge, a brass rivet `#dba935` r 0.009 where it crosses the lip. Centre line = `GUM_FIT.dad` skin + 0.026 along the outward normal, through (th, y): (0.64, 0.44), (0.74, 0.50), (0.86, 0.57), (1.02, 0.625), (1.33, 0.69), (1.69, 0.72); mirrored for his right. Front only: they end behind his side and stay outside x +-0.25, off the eyes, cheeks and moustache |
| GUARD rule | his resting hands (x +-0.51) would hang in the wall. While it is worn no arm goes to `rest`: an idle arm takes GUARD `{ o: [0.19, 0.31, 0.08], elbow: 0.12 }` = the mitt at (+-0.62, 0.504, 0.08), 0.01 off the lip, arms out as drawn in panel 10. `wearSquash` |

### 2.6 `potlid` (the shield, panels 10 and 12)

Built facing +z: origin the centre of the rim plane, dome and knob toward +z. 0.44 across: a cap rising 0.045, rolled rim tube 0.007, two pressed ring lines `#8e98a4` at r 0.10 and 0.17, a black knob `#2b2d33` (stem r 0.012 x 0.022, cap r 0.030 x 0.018) on a steel washer r 0.02. Steel as the colander, underside `#8e98a4`. Solid. Rigid hold in his RIGHT mitt by `GUM_GRIPS.potlid.back` (the glove's centre 0.04 behind the rim plane): the mitt's palm lies on the underside's middle, hidden from the lens. SIZE `potlid: { w: 0.44, h: 0.44, d: 0.07 }`.

### 2.7 `xrayfilm` (panels 14, 15)

Origin: bottom centre. 0.34 wide x 0.46 tall x 0.008 thick, corner r 0.02. The picture is on the -z face (away from the holder, as `reviewtablet`); the +z face is plain `#14284a`. One canvas 680 x 920, self-lit (`MeshBasicMaterial`), so it glows by itself: no window is needed behind it. Positions below are on the film, x from its middle, y from its lower edge.

| Part | Numbers |
|---|---|
| Ground | `#0f2444`, a soft lighter field `#1c3f6e` r 0.26 about (0, 0.25); border 0.012 `#0a1830`; 3 faint scratches `#2a5488` |
| Potato | Dad's own outline and nothing inside it: an egg 0.235 wide x 0.262 tall, fuller below, from y 0.142 to 0.404; two leg stubs 0.022 wide down to sandal ovals 0.05 x 0.018 at y 0.102; two arm stubs r 0.012, 0.075 long, hanging 20 degrees out; his 3 combed leaves 0.09 long swept to the picture's right, up to y 0.435; his moustache as one soft lighter shape 0.12 x 0.032 about (0, 0.258): leaves and moustache say whose it is with no English. Line `#cfeaff` 0.004, outer glow `#6fb6e8` 0.012, inner rim glow `#2f6fa8` fading out over 0.03. NO eyes, ribs, spine or bones |
| Gum ball | one disc r 0.044 about (0, 0.193), 37 % of the body's width: `#ffd3e3` in the middle to `#f58fb5` at the edge, rim line `#ffe9f1` 0.003, a soft pink halo 0.012, 2 white highlight arcs. The only warm colour on the film (Q1) |
| Label | a white strip `#f4f1ea` 0.28 x 0.068, corner r 0.006, about (-0.02, 0.054), turned 2 degrees: "DAD 1995" in `#1a2233`, bold condensed sans capitals, cap height 0.042. Low on the film as drawn: shots 14 and 15 are framed low so the news bar does not cover it |

Hold: `grips.box` (both palms on the side edges at 0.253, the proven `reviewtablet` hold); SIZE `xrayfilm: { w: 0.34, h: 0.46, d: 0.02 }`.

## 3. The gear grows, on cuts only, and never comes off (the second natural counter)

| From | On Dad | Switch |
|---|---|---|
| frame 0 | nothing; bare cream gloves | |
| the cut after "Mitts." (about 13 s) | `ovenmitts` | `on` 1 |
| the cut after "Helmet." (about 25 s) | + `colanderhat` | scale 0.001 to 1 |
| the cut into panel 10 (about 38 s) | + `basketarmour`, + `potlid` in his right mitt; GUARD rule on | scale 0.001 to 1 |

## 4. Floor plan (starting marks: run `qa/clear.mjs`) and cameras

One kitchen, one way: the door is far right, the fridge far left, Dad works at the table's LEFT end.

| Who / what | x, z | Notes |
|---|---|---|
| Tato S: seated (01, 02, 10 to 15) | (0.16, -0.30) on the chair, `sit` height 0.252 from frame 0 | faces +z, gloves on the table. Mouth 0.50, eyes 0.59, crown 0.80; the table edge is 0.07 up his body |
| Tato L: lying (04 to 08) | on the table, on his back (pitch -90), feet toward Dad: underside at x -0.20, crown at x 0.35, centre line z 0.25 | belly top 0.76, face up. The glass stands at (-0.06, z 0.25) |
| Tato U: upright on the table (09) | (0.16, 0.25), feet at y 0.32, face +20 (to the lens), pupils on Dad | mouth 0.71, eyes 0.80 = Dad's eye level. The gum held out to his right, toward Dad, at (-0.22, 0.72, 0.40) |
| Dad, frame 0 | (4.75, -1.75), face -25 | in the doorway. Gloves empty and frozen at `[0.10, 0.45, 0.25]` |
| Dad O: operating (04 to 14) | (-0.89, 0.20), face +20 | 0.04 between the basket and the table's end. His left arm reaches the timer (0.42 from the shoulder) and the glass (0.38) |
| Dad, flinch (09) | hops from O to (-1.34, 0.20) in 0.3 s, back to O on the cut into 10 | tongs stay in his left mitt |
| Dad E: at the film (15) | (-1.05, -0.32), body turned -50 | reached during shot 14 |
| Reporter B: cover (03, his live lines, the aside, the peek) | (-4.25, -1.85), crouch 0.14, face +30 | left of the fridge and behind its front line: the fridge stands between him and the door |
| Reporter C (07, 14, 15) | (-2.15, -0.20), face +20 | reached on cuts; empty in 08 to 13 (Dad's flinch lands on its edge). 07: the mic ball at (-1.38, 0.55, 0.45). 14: the film's lower edge at (-1.73, 0.23, 0.24), 0.10 in front of his left flank: his gloves at y 0.48, under his eyes |

All tries; then `qa/camfit.mjs`. A two-shot of Dad and Tato is 1.8 m wide, so it is either a wide from 4.5 m or a diagonal from Tato's side.

| Panel (about) | Camera pos, look, fov | What it must give |
|---|---|---|
| 01 (0 to 0.9 s) | (0.16, 0.62, 2.10), (0.16, 0.50, -0.30), 30 | Tato S alone, the bubble about 360 px. Dad's line starts at 0.0 under it |
| 02 (to 3 s) | (-1.57, 0.70, 0.88), (1.90, 0.66, -1.10), 32 | Tato left in front (his left third cropped), Dad whole in the door at right, about 615 px tall, each eye about 70 px |
| 03 (to 5 s, and every cover shot) | (-2.90, 0.40, 0.55), (-4.10, 0.45, -1.85), 34 | the reporter left, the fridge right, as drawn; his mouth near y 1060 px, above the bar |
| 04 (about 8 s) | (1.80, 2.60, 1.20), (-0.40, 0.50, 0.25), 46 | from above Tato's head end: Tato L below, the timer by his feet, Dad O at the far end facing the lens. A lying Tato's face points at the ceiling: every shot of Tato L is from above |
| 05 and every timer insert | (0.30, 0.42, 1.70), (-0.62, 0.47, 0.30), 44 | the timer low right, about 350 px across, its dial (220 px) just above the bar; Dad's left glove on it, his face upper left |
| 06, 08 | (1.30, 1.95, 1.50), (-0.52, 0.62, 0.26), 44 | Tato L near right, his upturned face toward the lens, Dad behind left, mouths near y 900 and 1100 px. The colander's rim is no wider than his head, so his brows show from above |
| 09 | (1.95, 1.00, 2.10), (-0.45, 0.75, 0.20), 48 | the same axis at eye level: Tato U near right with the gum, Dad left behind, hopping away into the depth |
| 07 | (-0.95, 0.72, 2.90), (-0.95, 0.60, 0.20), 36 | Dad alone, both mitts on his belly near y 1150 px, above the bar; the mic comes in from the left edge |
| 10 | (-0.87, 0.50, 4.10), (-0.87, 0.50, 0.30), 40 | Dad from the colander's top to the basket's lower edge between y 200 and 1236 px (the bar hides his feet), the lid at his right flank, the timer at the right edge, about 125 px |
| 11 | (-1.75, 0.80, 1.45), (0.10, 0.52, -0.20), 36 | past Dad's left mitt and the spoon to Tato S; the shot ends 0.03 before the spoon touches |
| 12 | Tato S close: (0.16, 0.60, 2.30), (0.16, 0.52, -0.30), 30. Then Dad over the lid: the 07 camera | three singles, 0.7 to 1.2 s each: the chew, Dad's eyes over the lid (its top at 0.72), the reporter's peek (the 03 shot) |
| 13 | (-0.50, 0.62, 4.55), (-0.50, 0.62, 0), 40 | Dad left, Tato right, the timer ringing in front near y 1080 px, the window above them |
| 14 | (-1.95, 0.45, 2.35), (-1.95, 0.42, 0), 36 | his face left, the film right; the film's label ends near y 1205 px, above the bar |
| 15 | (-1.40, 0.45, 2.56), (-1.40, 0.42, 0.24), 42 | low, so the label clears the bar: the film left and whole (label about 300 px wide, cap height about 45 px, near y 1140), Dad E's face right, mouth near y 710. Hold 1.5 to 2 s after his line, then CUT |

## 5. Props through hands: 6 holds, no take and no release on screen

| Hold | Who | On screen |
|---|---|---|
| Mic | reporter, right | to the cut into 14, then hidden (the sheet shows none there) |
| Tongs | Dad, LEFT mitt, `HP_GRIPS.hptongs.hold` | in his mitt at the cut into 08: jaws toward +x and 20 degrees down, their tips at (0.06, 0.78, 0.25), 0.02 over the knit (the mitt is then near (-0.26, 0.95, 0.25)). Gone on the cut into 10 |
| Gum stick | Tato, right, thin pinch | in his hand at the cut into 09; gone on the cut out |
| Lid | Dad, RIGHT mitt, rigid | from the cut into 10: centre (-1.42, 0.62, 0.50), facing the lens. He ducks behind it in 12 (centre to (-0.95, 0.50, 0.62), its top at 0.72: eyes over it, mouth hidden only after his line), lowers it on "Impossible." |
| Spoon | Dad, LEFT mitt, a fist at the handle's end (grip `[0, 0.27, 0]`), rigid | in his mitt at the cut into 11, handle level, bowl open side up toward Tato; the fist goes from (-0.30, 0.52, 0.12) to (-0.12, 0.52, 0.02) in 3 s (the bowl's tip then 0.03 from his lips) |
| X-ray | reporter, both gloves, `grips.box` | in his gloves at the cut into 14 |

Rest pins, no grip: Dad's left glove on the timer (05); his left mitt against the glass (06: the mitt's centre 0.085 from the glass wall, at (-0.195, 0.825, 0.25), his body leaning 10 degrees to it); Tato's gloves on the table. `grips.mjs` SIZE gets three rows: `gumstick`, `potlid`, `xrayfilm`.

## 6. The bench: `storyboards/series/kid-vs-dad/06-gum/bench/bench-gum.mjs` (writes `bench-gum.json` beside it)

`"frame": "wide"`, set `plain` (color `#f3d9a4`, floor `#d9b27a`), look `anime-pro`, castLook `sheet`, no music, no captions. Cast: `spud` at (-1.55, 0), `rep` at (-0.70, 0), `dad` at (0.75, 0) in full gear with the lid in his right mitt and GUARD on his left arm. On the floor at z 0.7: `eggtimer` (left 0.6) at x -1.15, `gumstick` at x -0.95, `xrayfilm` at x -0.20 (rot 180, picture to the lens, staged), a second `colanderhat` on its rim at x 1.75.

| Still (s) | Shows | Camera |
|---|---|---|
| 0.5 | THE one still: every new piece at real size beside Tato, the reporter and Dad; the bubble on Tato at blow 1 | pos (0, 0.85, 5.6), look (0, 0.62, 0), fov 30 |
| 1.5 | Dad front, `shocked`: rim over the brows, no leaf through the dome, lip under the sleeves, straps off the face | pos (0.75, 0.90, 2.6), look (0.75, 0.75, 0), fov 30 |
| 2.5, 3.5 | Dad turned 90 and 180 | the same |
| 4.5 | mitts: his left arm `up` with the hand `flat`, his right in a fist on the lid: no finger outside a shell, each thumb lobe on its thumb | the same |
| 5.5 | four more timers at x 3.4, 3.7, 4.0, 4.3 (z 0), left 1, 0.5, 0.05, 0: no digit, four wedge sizes | pos (3.85, 0.30, 1.6), look (3.85, 0.09, 0), fov 30 |
| 6.5 | the film close: no bones, the ball, the label sharp | pos (-0.20, 0.25, 1.9), look (-0.20, 0.23, 0.7), fov 30 |
| 7.5, 8.5, 9.5, 10.5 | Tato close: blow 1; pop 0.1; pop 0.6; pop 1 with stuck 0 | pos (-1.55, 0.50, 1.6), look (-1.55, 0.40, 0), fov 30 |

Motion tail (a sequential `--draft` and 15 fps strips): 11 to 14 s Dad in full gear walks 1 m to +x and back, then one hop with a squash; 14 to 17.2 s the timer's `left` 1 to 0 in 2 s, then `ring` 0 to 1 in 1.2 s; 17.5 to 18.2 s the bubble: blow 0.4 to 1 in 0.4 s, pop 0 to 1 in 0.3 s.

## 7. DONE WHEN, and who builds what

1. Every still above renders, and the 0.5 still shows all eight kinds at once.
2. No digit and no letter on any piece except "DAD 1995"; nothing inside the potato's outline but the ball.
3. The mitts sit on both gloves in every frame of the tail (no lag, no glove through a shell) and look the same in a single still and in the sequential draft.
4. The colander and the basket follow the hop's squash; no leaf, holster or arm comes through a wall.
5. `qa/preflight.mjs`, `qa/clear.mjs` and the layout give no FAIL; `qa/golden.mjs` and `qa/regress.mjs` give no difference.
6. The diff touches only `props-gum.js`, 2 lines of `props3d.js`, 3 SIZE rows of `grips.mjs`, the bench files and the refreshed vocab sheet. Never `dad.json`, `costumes-dad.js`, `costumes-everyday.js`, `potato.js`, `timeline.js`, `squareeyes.js`, `props-gravroom.js`, `voices.json`.
7. On the contact sheet shrunk to 360 px wide the red wedge, the pink ball, the red mitts and the colander's dots still read.
8. Budgets: mitts 4 000 triangles together, colander 3 000, basket 4 000, every other kind 2 000; canvases 1024 x 512 at most. At most 3 fix rounds, then stop and report.

| Task | Files (disjoint) | Order |
|---|---|---|
| A, one builder | `engine/page/props-gum.js` (sections 2.1 to 2.7) and the 2 registry lines in `engine/page/props3d.js` | first |
| B, one builder | `storyboards/lib/grips.mjs` (3 SIZE rows), `bench/bench-gum.mjs` and its JSON (section 6), the checks of this section, `node tools/vocab.mjs` | written beside A, run when A lands |

## 8. Cut, changed from the drawing, open questions (my default), risks

Cut, to stay lean:
- The low lamp of panel 04 (at 1.7 m it would hang in every wide): the set's own lamp lights the table from 3.25, out of frame.
- Dad's coffee mug and spill in panel 02: a seventh hold and a liquid for a 2 s shot (Q2).
- The drawer: the set has none, and a take on screen is a new hold. The film is in his gloves at the cut.
- The ear ON the glass (06): a potato's face is its body. He leans 10 degrees and squints; the glass is the kit's and is never lifted.
- The gum puddle on the table and the drips on the sweater; real holes in colander and basket (painted dots); the basket's back straps; the reporter inside panel 12's frame (his own cutaway).
- Cut next, if one fix round does not clean it: the strap stitch lines, the quilt dots, the mitt loops, the colander handles' rivet plates, then the spoon moves to Tato's own right hand (Q3).

Changed from the drawing:
- One geography. Sides as drawn: 02, 03, 06, 08, 11, 14, 15. Mirrored: 09 and 13 (Dad is left of Tato) and the lid in 10. Tato lies feet toward Dad (as 08) and is filmed from above his head end (04, 06, 08). 12 is three singles. In 10 the timer is small at the frame's edge, not in front: its insert carries it.
- The basket covers his belly and shorts, not his chest (Dad B's arms). The lid is in his right mitt. The gum ball is pink. No mic in 14 and 15. The gear never comes off (the sheet draws 09 and 11 without the colander, 09 without mitts, 13 without the basket).

Open questions:
- Q1 The gum ball: pink (default: it reads as gum with no English), or the sheet's blue-white `#dff1ff`.
- Q2 Panel 02's mug: none (default), or the kit `teamug` dry in his right glove.
- Q3 The spoon: Dad feeds, as drawn (default), or Tato feeds himself while Dad stays behind the lid.
- Q4 Dad's sweat in 15: the kit bead (default), or acting only.
- Q5 The film: both gloves and no mic (default, as drawn), or his left glove alone on its near edge with the mic kept.

Risks:
- The mitts read the rig's glove groups from the scene (the `wearSquash` way). If they lag a frame or a check trips: fall back to a new cast file `dad-mitts.json` (Dad + `costume.hands "#c8352c"`, `hands.size 1.7`) swapped in on the cut, no shells.
- The leaves lag the head (`softFollow` 0.35): if a tip shows through the dome on the hop, the dome goes to 0.27 high.
- Three of the six holds are in mitts; the lid and the spoon are held at once in 11. The kit glass (alpha 0.3) may vanish on the teal sweater: judge a full-size crop; fallback a solid tumbler `#cfe8f5` with two white streaks in `props-gum.js`.
- Tato lying (pitch -90) in a sweater on a table is new for this body: check the first still before staging on it.
- Portrait frame against a 1.8 m wide pair: in the wides Dad's face is about 300 px and the timer about 105 px, so the inserts carry the counter. The label reads only in shot 15. All heights, reaches and clearances here are unrendered; Dad's 0.76 depth plus the basket is the deepest body `qa/clear.mjs` has seen.
