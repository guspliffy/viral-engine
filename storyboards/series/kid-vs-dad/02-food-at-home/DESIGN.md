# Kid vs Dad 02 "We have food at home": design of the new pieces

Creative director, 22 Nov 2026. Target: the approved 15-panel sheet v2 (`kid-vs-dad-02-panels-v2.png`, opened and read panel by panel) and `OUTLINE.md` v2. Every size is computed from the cast files and the kit's header comments, not rendered: check each piece on a bench still. Metres, floor y 0, +z toward the camera, +x screen right, hex colours. Hh / Wd / Dp = a body's own height, width, depth. A potato stands Hh + 0.14 tall; its eyes sit 0.62 Hh above its underside, its mouth 0.45 Hh. **Car frame** (rig `hatchback`): front +z, origin on the ground under its middle, +x = the car's left = the driver's side. The kit car is big for potatoes (window line 0.90, roof 2.06, 2.2 wide): nobody standing on the ground shows over a door (the reporter's eyes are at 0.64). That is why the seats are raised and why this film has 0.50-high concrete to stand on. No letters or digits on anything in this file; every hand is three fingers and a thumb; every "random" mark is placed once from a fixed table (no `Math.random`, no clock).

## 0. Reused unchanged (no builder), and four small kit switches

| Need | Use | Numbers |
|---|---|---|
| Car | rig `hatchback` | color `#6fa596` (the sheet's sage teal), blank plates kept. Its side windows are open holes: the kit has glass only in the windscreen and the hatch (opacity 0.1), so the fog pane is new (section 7) |
| Front seats | `carseat` x 2 | width 0.60, color `#3b3a44`, trim `#55525e`. Driver (0.55, y 0.24, z 0.20), headrest on: cushion top 0.66. Passenger (-0.55, y 0.12, z 0.20), `head: false` |
| Wheel | `steer` | (0.55, 0.88, 0.63), tip 34, grips L / R (parallel-park's numbers). Hidden (scale 0.001) on the cut into panel 15: the burger sits where its rim is |
| Dad | `wedge.json` | unchanged: red bomber, shades on top of his head. Seated: mouth 1.10, eyes 1.27, shades top 1.75 (roof lining 1.96) |
| Reporter, mic | `reporter.json`, `newsmic` | unchanged; mic in his right hand all film |
| Coin | `coin` | scale 0.7 = r 0.06; the library's coin pinch |
| Mash's cap | `paperhat`, worn | scale 0.8, its rim 0.13 below his crown, tipped 8 degrees back; his leaf comes out between the two ridge flaps |
| Kitchen | set `kitchen` (night) | `lamp: 0.2`, plus one switch (below) |
| Wall dressing, panel 08 | `wallshelf` | at (-4.25, y 1.35) on the back wall, left of the fridge |
| Helmet | `costume.helm` | on Chip (section 2) |
| Not used | `pickle`, `streetlamp` | the kit pickle stands on end with its origin 0.115 under its middle; the fridge draws its own lying one. Street lamps are painted into the place (a real light each is too many lights) |

| Kit switch | File | What it does (default = today's look) |
|---|---|---|
| news `count: false`, `tagW` | `engine/page/hud.js` | Needed: today the bar needs `keys` and always draws "label: number". With `count: false` the strip draws the label only (no colon, no number), `keys` not required, `show` gives the window. `tagW` = the red block's width (default 258). This film: tag "LIVE", `tagW` 150, label "STANDOFF AT THE DRIVE-THRU" (26 characters) in a 638 px strip: my estimate is cap height 33 px; with today's 258 px block it would shrink to about 27 px |
| carseat `back` | `engine/page/props-road.js` | the backrest's height above the cushion line (default 0.86, top 0.83 above it); bolsters and piping follow; under 0.7 no headrest |
| set `fridge: false` | `engine/page/set-kitchen.js` | leaves out the stock fridge box, its handle, its line and the note (4 meshes) |
| `helm` on Chip; `phones: false`, `headset` on Mash | `engine/page/costumes-everyday.js` | today only the `teller` type reads `helm`, and `phones` is only a colour (false falls back to blue) |

## 1. Tato = Spud at seven: `characters/potatobrawl/spud-kid.json` (panels 01, 04, 06, 13, 15)

A variant file as `spud-old.json`, not the cast `scale` key: scale shrinks gloves and limbs with the body (the coin pinch and the tally finger need full-size gloves), and Chip proves the rig sits, holds and points at this body size. Copy `spud.json`; change only these.

| Key | Value |
|---|---|
| body | height 0.55, width 0.50, depth 0.44, lump 0.02, seed 29 (Spud's own shape, 6 % rounder, as drawn) |
| size check | body 0.56 of the dad's 0.98, width 0.57 of his 0.88; stands 0.69 = 0.62 of his 1.12. Never in a shot with Chip (0.53 x 0.57, a ball) |
| limbs | width 0.030; color and shoulder as Spud |
| face | Spud's block + size 0.66 (Mash's proven face-to-width share); neutral eye 1.08 (wider open: a child) |
| hands | size 1.05, 3 fingers, seamless |
| sprout | Spud's: ONE leaf, real size about 0.16 long (on the small body it reads as the sheet's big leaf). If the engine scales the sprout with the body, size 1.6 |
| costume | type `spud`, sweater `#2f8f8a`, patch `#9a6a3c`. No yellow anywhere (sheet slip, panel 01) |

Faces: asking (01) = eye 1.15, browY 0.03, curve 0.35. Hungry at the glass (04) = eye 0.9, tilt 0.3, curve -0.3. Coin (06) = eye 1.15, curve 0.4. Flat stare (13, 15) = the dad's own look: eye 0.6, tilt -0.05, browY -0.02, curve -0.05, pupils on the dad; no blink in the last 1.5 s.

Seated on the rear row (section 7), cushion top 0.82. Two marks, switched on cuts only:

| Mark | Car x, z | Body | Face |
|---|---|---|---|
| Middle (01, 06, 13, 15) | (-0.08, -0.95), sitting, underside 0.82 | faces +z | mouth 1.07, eyes 1.16, top 1.37: between the two front seat backs (tops 1.37 and 1.49), 0.08 over the low rear back |
| Window (04, every tally) | (-0.70, -0.95), STANDING on the cushion, underside 0.96 | faces the glass (-x), leaning 6 degrees to it; face 0.055 from the pane | mouth 1.21, eyes 1.30, top 1.51 |

## 2. Chip, the correspondent at the house: `characters/potatobrawl/chip-reporter.json` (panel 08)

Copy `chip.json`; change only these. He keeps his yellow hoodie; no vest.

| Key | Value |
|---|---|
| sprout | placement "none": both leaves gone under the helmet (sheet slip: two leaves poke through it) |
| costume | + `helm: true`: the reporter's shell in its stock `#3f72b8` (one news team), built by shares of Chip's body (k = 0.53 / 0.80 = 0.66) |
| face | + layout { browV 0.74 }, so the rim (front edge 0.90 Hh) stays 0.03 above his brows |
| helmet, all scene | `hat`: roll 8 degrees to his left, yaw 5: askew, so the strap is undone (two ends hang, 0.086 and 0.059 long) and nothing crosses his small talking mouth |
| mic | `newsmic` scale 0.8: 0.256 long (0.38 of his 0.67), cube 0.06, ball r 0.052. Mug hold, RIGHT hand, fist at his chest (y 0.33), ball beside his cheek, never in front of his face. If the grip test (`--prop newsmic --hold mug`, CHAR this file) shows the fist sliding at 0.8, use scale 1 |

Faces: shaken = eye 1.1, pupil 0.75, tilt 0.25, curve -0.2; he says every line to the lens, glancing back at the fridge between lines. No sweat drop (sheet, panel 08: story.md bans reaction symbols).

## 3. Mash, the drive-thru worker: `characters/potatobrawl/mash-crew.json` (panels 12, 14)

Copy `mash.json`; costume + `phones: false` (the blue neck headphones are gone), + `headset: true`. The headset is a costume piece on the `mash` type (new file `engine/page/costumes-crew.js`, called from `costumes-everyday.js`); it hugs his skin, so build it as shares of his body (Hh 1.24, Wd 0.54).

| Part | Numbers |
|---|---|
| Ear cups, both sides | disc r 0.060, 0.035 thick, shell `#2b2d33`, pad ring `#3b3d44`; centre 0.79 above his underside (0.64 Hh), on the side of the body, 0.012 off the skin |
| Band | `#2b2d33`, 0.018 wide, 0.008 thick, 0.006 off the skin, from cup to cup over the crown (the cap hides it from 1.10 above his underside up) |
| Boom | tube r 0.006 `#2b2d33` from the bottom front of his RIGHT cup round the cheek, 0.02 off the skin |
| Mic end | foam ball r 0.016 `#1d1e22`, centre 0.08 to his right of the face's middle line and 0.02 below the mouth line: 0.02 outside the mouth corner, never in front of the lips |
| Cap | kit `paperhat` (section 0): white with the red stripe |

He stands inside the booth on a floor at y 0.50: mouth 1.20, eyes 1.41, cap top 1.95, in a window from 1.00 to 2.10. Both gloves rest on the sill (rest pins) in panel 12. Faces: "Welcome!" = his neutral; "...Then why are you here?" = eye 1.05, tilt 0.15, curve -0.1, one blink.

## 4. The drive-thru: props on `set: plain`, file `engine/page/props-drivethru.js` (panels 03, 10, 11, 12, 14)

Not a stock set: `road` is a sunny coastal treadmill and `street` a sunny bus stop, neither has a junction. As `neonstreet` and `dinerfront`: self-lit prop kinds, deterministic. `drivethru` is placed at world (0, 0, 0), rot 0, and draws in the world frame of section 8 (origin = the car's red-light mark; "lane s, d" = metres along the lane from its start and to the LEFT of its middle line).

`drivethru` (the place):

| Part | Numbers |
|---|---|
| Ground | 80 x 80, asphalt `#2d3142`, warm pools `#5d5048` (r 2.2, soft) under the five lamps, 6 oil stains and 4 patched cracks, each once |
| Road | runs along z, car lane x -1.35 to +1.40, straight on to z -40; right kerb at x 1.40, pavement `#555a6e` to x 3.2; oncoming lane x -5.1 to -2.15, west kerb beyond. Stop line z -2.3 (0.30 thick), cream `#e8e2cf`; one curved arrow 1.6 long at (0.5, -4.6) pointing into the lane (panel 10) |
| Median planter | concrete box x -2.15 to -1.35, z -3.6 to +3.0, 0.50 high, rounded north nose, soil and 3 low shrubs on top south of z 1.2. Concrete `#8d9199`, top `#a3a7ae`, shade `#70747c` |
| Fork and lane | middle line: straight to (0, -4.0), then a right arc r 5.0 about (5.0, -4.0) for 45 degrees to (1.46, -7.54), then straight: P(s) = (1.46 + 0.707 s, -7.54 - 0.707 s). Lane 2.8 wide, d -1.4 to +1.4. The building stands in the fork, on the lane's LEFT |
| Kerbs | 0.15 high, 0.18 wide, concrete, along every edge above; the right kerb turns into the lane on r 3.6 |
| Building | cream `#f0e2c4`, 2.75 high, flat roof, red fascia `#c0392b` 0.30 tall. Main block lane s 6.6 to 10.6, d 2.22 to 5.22 |
| Booth | sticks out to d 1.52 between s 7.95 and 9.25. Window 0.95 wide (centre s 8.6) x 1.10 tall (y 1.00 to 2.10), frame `#e9e6dc` 0.06, sill ledge to d 1.40 at y 0.96 to 1.00. Inside floor y 0.50; 0.9 behind the window one drawn warm card 1.6 x 1.4 (steel shelves, two stacks of blank cups, a fryer hood), average `#ffe0a0` |
| Plinth | concrete, 0.50 high, d 1.40 to 2.22, both sides of the booth (s 6.6 to 7.95, s 9.25 to 10.6) |
| Awning | red `#c8352c`, valance `#a82a22`, s 7.75 to 9.45, from d 1.52 out to d 0.62; front edge y 2.25 (the car roof is 2.16), wall edge 2.55; a warm strip `#ffe9b8` under it |
| Roof badge | the sign's burger picture on a round lit disc r 0.55, centre y 3.45 on the roof over the booth (the far sign in panel 10) |
| Planting, uneven | 9 bush clumps r 0.5 to 0.9, 1.2 to 3.5 apart, along the lane's right side and the pavement: `#1f4a3a`, lit side `#2c6148`, 20 to 40 yellow blossoms `#f2c230` each; 5 trees behind them, crowns 3 to 4.5 across `#1b3f38`, rims `#3f7a5a` toward the nearest lamp. Each drawn once |
| Lamps, painted | 5 poles 3.4 high with a 0.9 arm, head `#ffc46a` + a fixed halo: at (2.3, 4.4), (-5.5, -6.5), (5.6, -8.2), (9.6, -12.4), (0.9, -21) |
| Sky, far town | dome r 90: top `#1a2a66`, middle `#3a55a8`, horizon `#8fa6dc`, 30 dim stars in the upper half; a ring at r 45 of roofs in two layers with 14 small warm windows `#ffcf7a` |
| Real lights, key `light` 0 to 1.5 | three: lamp over the red-light mark (2.3, 3.4, -1.0) `#ffc77a` range 9; booth (lane s 8.6, d 1.2, y 1.9) `#ffe2b0` range 6; menu (lane s 4.4, d 1.9, y 1.6) `#ffe9b8` range 4 |
| Solid for `qa/clear.mjs` | building, booth, plinth, median planter, lamp poles. Everything else is ghost |

`burgersign` (panels 03, 01): origin the ground under the pole.

| Part | Numbers |
|---|---|
| Base | concrete block 0.80 high, 1.00 x 0.60 at the ground, 0.80 x 0.45 on top; 2 hairline cracks, 3 chipped corners, a dark stain at the foot. Solid |
| Pole | square 0.14, `#4a3f47`, y 0.80 to 1.60 |
| Panel | 1.60 wide x 1.30 tall x 0.22 deep, corner radius 0.12, y 1.60 to 2.90. Top at 2.90 on purpose: any higher and the car's roof hides it in the opening shot. Frame 0.07 `#e8622c`, bevel `#b8431f`. BOTH faces (+z and -z) lit `#ffe9a8` and carry the picture |
| Picture, 1.10 x 0.90 | a burger and nothing else: bun `#d9933a` with 12 seeds `#f6e6b8`, lettuce `#6fb23a`, tomato `#d8452e`, cheese `#ffc933`, patty `#5a3220`, bun base `#e09a3a`, 0.03 dark outline `#5a2f1c` |
| Glow | halo card r 1.6 `#ffb347` at FIXED opacity 0.35; one real light at the panel's middle `#ffb060`, range 8. Key `lit` 0..1 scales the colours, never an opacity |

`trafficlight` (03, 10; origin: the foot of its post):

| Part | Numbers |
|---|---|
| Post | r 0.06, `#2f3238`, 1.75 high |
| Head | 0.42 wide x 1.04 tall x 0.26 deep, `#23252b`, corner radius 0.05, centre 2.05 above the foot; its face toward +z |
| Lenses | r 0.13 at +0.33, 0, -0.33 from the head's middle, each under a 0.10 visor. Off: `#4a1d1b`, `#4a3a14`, `#143d22`. On: `#ff3b2f`, `#ffb52e`, `#35e06a`, with a halo r 0.34 shown by visibility (fixed opacity 0.5) |
| Key `go` | under 0.33 red, 0.33 to 0.66 amber, over 0.66 green. Steps, no blend |

`trafficcone` (10): cone 0.75 tall, r 0.17 at the bottom to 0.04 at the rounded tip, `#f26a1b`; two white bands `#f4f1ea` at y 0.30 to 0.40 and 0.50 to 0.57; base 0.46 square, 0.04 thick, corner radius 0.05, `#d9541a`; one scuff, one tyre mark. Solid. It stands IN the straight road (section 8), not at the kerb (sheet slip).

`speakerpost` (11; origin: the ground under it):

| Part | Numbers |
|---|---|
| Body | 0.30 wide x 0.22 deep x 1.45 high, top corners r 0.06, `#3d4047`, face plate `#4a4d55`; footing 0.40 x 0.32 x 0.12 concrete. Solid |
| Grille | disc r 0.085 at y 1.12 (the dad's mouth is at 1.10): 37 holes r 0.006 `#1d1e22` in a hex grid |
| Lamp | lens r 0.018 at y 1.28. Key `talk` 0..1: off `#5a5f66`, on `#7dff8a` with a halo r 0.05 (by visibility). The director keys it on Mash's two speaker lines: it is how the picture shows who speaks. No sound-wave arcs |

`menuboard` (11; origin: the ground under its middle): face 1.30 wide x 1.50 tall, y 0.75 to 2.25, 0.14 deep, frame 0.06 `#3d4047`, two legs 0.08 square, lit `#fff3cf`, a light bar on top. Four tiles 0.54 x 0.62, 0.04 apart, each a picture on `#fff7dc`: top left the sign's burger; top right a double burger (two patties); bottom left fries (9 fries in a blank red carton `#d8452e`); bottom right a drink (blank red cup, white lid, straw). No prices, no dots. Legs solid.

## 5. The open fridge: `openfridge`, file `engine/page/props-fridge.js` (panels 08, 09)

It replaces the stock fridge (set switch `fridge: false`) at the same place, (-3.0, 0, -1.90), rot 0. Own frame: front +z, origin the floor under its middle. The cavity is 0.80 x 1.42: exactly a 9:16 frame, so panel 09 is the whole inside and nothing else.

| Part | Numbers |
|---|---|
| Body | 0.90 wide x 2.00 high x 0.69 deep (z -0.375 to +0.315), corner radius 0.03, `#e9e6dc`, shade `#cfcabb`. Drawer front y 0.05 to 0.45 with a bar handle 0.40 long `#9aa0a8` |
| Door | 0.86 x 1.48 (y 0.48 to 1.96), 0.06 thick. Hinge on the +x edge; opens toward +z. Handle: bar r 0.014, y 0.55 to 1.15 (Chip reaches 0.75), 0.05 proud, 0.09 from the free edge. The kit's blank yellow note 0.16 square at (0.12, 1.55) on the outside |
| `open` 0..1 | 0 shut, 1 = 105 degrees |
| Cavity | x -0.40 to +0.40, y 0.50 to 1.92, 0.62 deep. Self-lit: back `#eaf4fa`, sides `#d7e6f0`, ceiling `#e2eef6`, floor `#d2e1ec`, corner lines `#b9cbd9` 0.006 |
| Shelves | 3, tops at y 0.86, 1.20, 1.56: plate `#f4f9fc` 0.008 thick with 9 rail lines `#cddbe6`, a white front lip 0.022 tall. All bare but the middle one |
| Light | bar 0.36 x 0.035 x 0.10 `#ffffff` under the ceiling at the front; one real light at (0, 1.80, 0.10) `#dff2ff`, range 3.2 (it lights the food and Chip). Key `lit` 0..1 scales the cavity colours and the light (0 = 25 % and no light); the director keys the flicker: on, off for 2 frames at +0.20 s and at +0.37 s. A pale floor patch `#bfe6ff` 0.9 x 0.7 in front at fixed opacity 0.30, shown while `open` is over 0.05 |
| Pickle (drawn here) | lying along x on the middle shelf, centre (-0.19, 1.245, +0.10), turned 12 degrees: 0.23 long x 0.09 thick, `#4c8a2c`, 14 warts r 0.0085 `#7cb64a` (the kit pickle's recipe) |
| Rice bowl (drawn here) | centre (+0.17, 1.20, +0.06): white `#f4f1ea`, rim r 0.135, foot r 0.06, 0.105 tall, shade `#d9d6cc`. Rice: a low mound `#e7dfc6`, 0.025 over the rim, 60 grain dashes `#cfc6a8` and `#f6f1df` 0.012 long, 5 dried grains `#b9a877` at the edge |
| Cling film | a disc 0.006 over the rim, sagging 0.008, `#eaf6ff` at FIXED opacity 0.25; 4 white streaks 0.006 wide, 0.05 to 0.11 long; a solid crinkled skirt `#eef6fb` 0.035 down the outside with 16 folds and 2 loose corners 0.03 out. If the disc sorts badly, drop it: streaks and skirt carry it |

In panel 09 the pickle is 310 x 122 px and the bowl 365 px across (103 x 41 and 122 px on a 360 px phone). The caption band falls on the empty top bay, the news bar on the empty bottom bay.

| When | Door | Why |
|---|---|---|
| Panel 08, first frame | `open` 0, `lit` 0 | he pulls it to 0.25 (26 degrees) in 0.5 s: the door's outside faces the lens and hides the food; the cold strip falls on his face |
| Cut to 09 | `open` 1 on the cut | the reveal: nothing of the food shows before this |
| Back on Chip | stays 1 | the pickle now shows above his helmet; his left glove is off the handle (the door is 1.4 away) and hangs at rest |

## 6. The burger and the hand pass: `wrapburger`, file `engine/page/props-foodhome.js` (panels 14, 15)

Origin: bottom centre. 0.24 across, 0.155 tall: 27 % of the dad's width, so ONE burger reads on a phone.

| Part | Numbers |
|---|---|
| Stack (y) | bun base 0 to 0.032 `#e09a3a`; patty to 0.062, r 0.118, `#5a3220`; cheese to 0.070 `#ffc933`, a square whose 4 corners droop 0.02; tomato to 0.082 `#d8452e`; lettuce to 0.094 `#6fb23a`, a wavy frill 0.012 past the bun; bun top to 0.155, dome r 0.115 `#d9933a`, 16 seeds `#f6e6b8` 0.012 x 0.006 |
| Paper | `#f6f3ea`, 8 creases `#d9d5c8`, a faint diamond grid `#e3dfd2` 0.004. Blank |
| Spec `wrap` | 1 = a paper cup up to y 0.085 in front and 0.115 behind, 6 points up to 0.15 at the back: tomato, lettuce and bun top show, so it already reads as a burger (panel 14). 0.35 = paper down to 0.045 all round, the points splayed 40 degrees out (panel 15). Fixed per prop, not tweened: the unwrapping is the cut |
| Hold | box hold, both palms on the paper at y 0.05, gap 0.03; `storyboards/lib/grips.mjs` SIZE `wrapburger: { w: 0.24, h: 0.155, d: 0.24 }` |

Two copies, no hand-to-hand (clip-lessons: a prop handed to a new hand blends for 0.15 s even across a cut).

| Copy | Who | On screen |
|---|---|---|
| `burgerM`, wrap 1 | Mash, both palms, already in his hands at the cut into 14 | held out of the window, centre at lane d 1.22, y 1.08 to 1.235, in the 0.30 gap over the door top. The dad's LEFT glove, palm up, is at d 1.06, y 1.04: under it and 0.04 short. The shot ends before any touch |
| `burgerD`, wrap 0.35 | the dad, both palms, already in his hands at the cut into 15 | base at y 0.875, top at 1.03: under his open mouth (1.10), covering chin, never mouth or eyes. `burgerM` hidden |

## 7. In the car: the rear row, the fog tally, the cabin lamp (panels 04, 01)

Rear row: three `carseat`, width 0.62, `head: false`, `back: 0.50`, y 0.40, z -0.98, at x -0.70, -0.08, +0.54: cushion top 0.82, back top 1.29. The low backs open the rear window above them (the sign shows there).

`fogglass` (file `engine/page/props-foodhome.js`; placed at the car's origin with `rig`, draws in car space): a pane in the rear side opening on the car's RIGHT (the kerb side, away from the driver).

| Part | Numbers |
|---|---|
| Pane | x -0.985, z -1.10 to -0.42 (0.68), y 0.92 to 1.97 (1.05); the kit's glass (`#d8eef8`, opacity 0.1) |
| Fog: a texture, not an effect | ONE canvas 512 x 790, drawn once, on a second plane 0.002 outside the pane: milky `#e6eef2`, alpha 0.62, feathering to 0.25 inside 0.08 of the edges along 7 uneven lobes. The material's opacity is fixed at 1; all the see-through is in the texture |
| Porthole | where he rubbed it with his sleeve: an oval 0.34 wide x 0.38 tall, centre z -0.95, y 1.30, alpha 0.15, feather 0.06: his face reads at full contrast |
| Drops | 26 beads `#f4fbff` r 0.004 to 0.009, 6 with a run 0.03 to 0.07 long below |
| Marks | 4 strokes, each its own mesh 0.0015 outside the fog, `#27313f` (the dark cabin through wiped glass): 0.020 wide, round ends. Centres z -0.640, -0.585, -0.530, -0.475; tops y 1.47, 1.46, 1.475, 1.455; lengths 0.20, 0.19, 0.21, 0.185; leans -4, +3, -2, +5 degrees; each bends up to 0.006. A bead r 0.008 and a 0.04 run at each lower end |
| Key `marks` 0..4 | stroke i is drawn from its top down, length x clamp(marks - (i - 1)): 0.35 s a stroke. Scale and visibility only |
| Point `tip` | the growing end of the stroke being drawn, on the inner face: his LEFT index tip is pinned there (hand shape `point`) |
| Fallback | if the alpha texture fails in the toon pass: an opaque pane `#cfdbe2` with the porthole cut out as a real hole |

In the close-up (camera in section 8) a stroke is 24 x 238 px, 65 px apart (8 x 79 px on a phone). Marks: 1 at 0 to 3 s, 2 at 9 to 14 s, 3 at 14 to 25 s, 4 at 40 to 55 s.

`cablight` (same file, rides the rig): the dome lamp, lens 0.10 x 0.06 `#fff1cf` on the lining at car (0, 1.94, -0.10), one real light `#ffe6c0`, range 2.4. Key `lit` 0..1. On all film: faces under a roof at dusk.

## 8. Floor plan (starting marks: run `qa/clear.mjs`)

Car frame (x + = driver's side):

| Who / what | Car x, z | Notes |
|---|---|---|
| Dad | (0.55, 0.20), sitting, underside 0.66 | both gloves on the wheel |
| Tato | section 1 | two marks |
| Rear-view mirror | (0, y 1.86, 0.50) | the dad's tell at 14 to 25 s: his pupils go to it for 0.5 s (the sign is behind him) |

World (the car's red-light mark is the origin; there it points to -z, so its driver's side is world -x):

| Who / what | World x, z | Notes |
|---|---|---|
| Car, red light | (0, 0), front to -z | 0.25 from the median, 0.30 from the right kerb |
| Traffic light | (-1.75, -3.0), foot at y 0.50 | on the median's nose |
| Sign | (2.05, 13.6) | 13.6 behind the car; its panel hangs 0.15 over the kerb line |
| Reporter, in cover (03) | (1.95, 14.75) | on the camera's side of the base, 0.5 from it, crouched 0.14 (only his crown, 0.845, tops the 0.80 base as the car sees it); faces the lens |
| Reporter, at the dad's window (05) | (-1.80, -0.50), y 0.50 | ON the median: mouth 1.00, eyes 1.14. Faces 40 degrees off the lens; fist at y 1.00, `lean` 40, body leaning 10 degrees: the ball is at 1.15, 0.04 inside the window. Reached on a cut |
| Cone | (0.1, -9.6) | in the straight lane, 1.1 clear of the turning car |
| Car, speaker stop | lane s 3.6 = (4.01, -10.08) | heading 45 degrees right of -z |
| Speaker post | lane s 4.6, d 1.50 = (3.66, -11.85) | 0.8 ahead of his window, so he leans out and forward to it |
| Menu board | lane s 4.3, d 2.5 = (2.74, -12.34) | faces the lane |
| Car, window stop | lane s 8.4 = (7.40, -13.48) | flank 0.30 from the sill ledge |
| Mash | lane s 8.6, d 1.92 = (6.19, -14.97), y 0.50 | faces the lane |
| Reporter, at the handover (14) | lane s 7.25, d 1.80 = (5.32, -13.93), y 0.50 | on the plinth beside the booth; mic lowered to y 0.85 |
| Reporter, running (10) | 1.9 to the left of the car's middle line | on the asphalt, left glove on his helmet (arm pose `hat`) |

Kitchen: fridge as section 5; Chip (-3.72, -1.02), 25 degrees toward the fridge; his left glove rests on the door handle (rest pin), the mic in his right.

Cameras to start from (then `qa/camfit.mjs`):

| Shot | Camera | What it must give |
|---|---|---|
| Car two-shot (01, 13, 15), through the windscreen | rig: pos (-0.15, 1.45, 3.20), look (0.08, 1.03, 0), fov 50 | dad on screen RIGHT, his whole face in frame, mouth near y 960 px, hands near 1115 (above the bar); Tato in the gap between the seat backs; the sign 5.4 degrees wide (about 210 px) in the rear window over the passenger seat, y 485 to 655 px; the caption on the roof lining above it, y 260 to 410 px. Keep the camera between car x -0.3 and 0, or the dad hides the kid |
| Tally (04) | rig: pos (-3.58, 1.34, -0.74), look (-0.98, 1.34, -0.74), fov 35 | frame 0.91 wide: his face left, the marks right of it at 647 to 867 px, mouth 120 px above the bar |
| Fridge (09) | pos (-3.0, 1.21, 1.08), look (-3.0, 1.21, -1.9), fov 31 | the cavity fills the frame |
| Fridge (08) | pos (-3.40, 0.80, 2.60), look (-3.45, 0.85, -1.5), fov 40 | check on a still that no food shows through the door gap |
| Cover (03) | pos (1.60, 0.45, 19.4), look (0.75, 1.77, 0), fov 44 | low: the sign towers at top right, his mouth clears the bar, the car and the red light sit left above the bar |
| Handover (14), through the windscreen from the passenger side | rig: pos (-0.75, 1.40, 1.75), look (1.45, 1.15, -0.15), fov 46 | the dad's sleeve left, burger middle, Mash right, the reporter behind |

## 9. Props through hands: 6 holds, no release and no take on screen

| Hold | Who | On screen |
|---|---|---|
| Wheel | dad, both | from frame 0; his hands leave it only across cuts (07 palm up, 13 hand beside his mouth, 14 arm out, 15 burger) |
| Mic | reporter, right | all film |
| Small mic | Chip, right | all of the kitchen |
| Coin | Tato, right, pinch | in his raised hand at the cut into 06, 0.10 outside his body at eye height (beside the face, as drawn); gone on the cut out |
| `burgerM` | Mash, both | section 6 |
| `burgerD` | dad, both | section 6 |

Rest pins, no grip: Chip's left glove on the fridge handle; Tato's fingertip on the glass; Mash's gloves on the sill; the reporter's glove on his helmet.

Cut already: (1) seat belts (sheet 01, 06, 13, 15): a strap across two talking bodies, and Tato moves seats. (2) Chip's sweat drop. (3) The sheet's five-finger hand (07). (4) An unwrapping in the dad's hands. (5) Glass in the other side windows. Cut next, if one fix round does not clean it: the cling-film disc, then the roof badge, then Chip's mic back to scale 1, then the reporter out of panel 14 (Q5).

## 10. Changed from the drawing; open questions (my default); risks

- The sheet seats the dad on screen left in 01 and 05 and on screen right in 13 and 15. One car is one way: left-hand drive as the kit, so through the windscreen he is on screen RIGHT in every shot. 03, 10, 11, 12, 13, 14, 15 are as drawn; 01 and 05 are mirrored; 04 is mirrored (marks right of his face) because his window is the kerb side, toward the burgers.
- The sign in 01 shows through the REAR window, over the empty passenger seat, 13.6 m behind the car: a side window can't show a tall sign to a windscreen camera. The sign near the building in 10 is the roof badge.
- The lane forks 45 degrees right and the building stands in the fork: the pickup window is on the driver's side and car, cone, light and building stack in one tall frame.
- The cone blocks the straight lane. The fridge door hides the food until 09. The burger is half wrapped in 14. The dad wears his bomber. Tato: teal, one leaf. Chip: bald under an askew helmet.
- Q1 Steering side: left-hand drive (default). Right-hand drive would keep 01 as drawn, but then the sign is behind the dad's head in every car shot, and 11, 13, 15 mirror.
- Q2 The sign in the opening: its true place, about 210 px wide, 70 px on a phone (default). Or a second copy 9 m behind on the car's own line for car shots only: 320 px, hidden in every outside shot.
- Q3 Seat belts: none (default), or a belt on both (a new costume strap).
- Q4 The dad's sweat at "...That's a meal.": the outline asks for a drop, story.md bans the symbol. Default: one real bead on his skin, `sweatbead` (worn prop, `props-foodhome.js`): a teardrop 0.03 tall x 0.02 wide `#d4ecff` with a 0.006 highlight, from his right temple (0.80 Hh, outside the brow) 0.16 down the skin in 1.1 s, then hidden. Position only. Or acting alone.
- Q5 The reporter in 14: on the plinth behind the handover (default). If one camfit round can't show his face and the burger together, he gets his own 0.8 s shot before it.
- Q6 Tato's size: body 0.55 = 0.56 of the dad (default), or 0.50 for "half".
- Risks to scope: 10 new prop kinds (11 with the sweat bead), 3 cast files, 1 costume piece and 4 kit switches, about twice episode 1. To the picture: the fog texture in the toon pass (fallback in section 7); the sign is only 0.6 degrees inside the rear window's edge in the opening; the dad's hands on the wheel sit just above the news bar; five real lights in the street scenes on a CPU render; the rig's paint is self-lit and may glow at dusk (then `#5f9488`); the headset boom beside a talking mouth; panel 14's three bodies in a 0.30 gap; all seat heights are unrendered.
