# "Does money make you happy?": DESIGN of the new looks (14 Nov 2026)

Target: Jonny's board.png panels 01-10 and OUTLINE.md. This file gives the numbers; builders build exactly these.
Metres, hex colours, 30 fps, 1080x1920. Everything is a function of story time and keys (no Math.random, no clock;
"hashed" = a hash of the item's index). Glass, water, light, glow, rain, smoke, fur tips and flying notes are
`userData.steam` (see-through for the contact checks) and cast no shadow. House look on every item: 2 cel tones +
highlight, ink line on hard edges, hatching on shade faces only, the whole frame sharp. No word, letter, numeral,
logo or badge on anything. Assumed numbers that a builder must measure in the code are marked (measure).

Reused as they are, with these dressings only:
- `moneybag`: new spec `mark: false` (the board's sacks are plain: no "$"). `banknote` / `cashbrick`: if the note
  face carries a numeral or letter, new spec `plain: true` (border, an oval, two leaf scrolls, green #3f9b5a).
- `policecap`: new spec `badge: false` (no star). `policecar` as it is (stripe, no word). `policevan` is NOT used
  as police (its doors carry a word). Police = cast-rig potatoes, skin #d9a55a, cap only.
- City (panel 02): env `sunny-city-avenue` (cream buildings, blue sky, trees: nearer panel 02 than the brown-brick
  `golden-city-crossing`, whose painting also holds painted cars). Its sun is low, so add a cool-white fill
  #dfe8f0 at 0.35 to read as noon. Dress: 2 `streetlamp`, 6 flower boxes (prop `flowerbox`, 0.9 x 0.2 x 0.2,
  pinks #e86a9a / #f2a3c0 on #4f8a3c), a yacht poster (prop `poster`, 1.2 x 1.8, white yacht on #3f8fd0 sea, no
  text), 4 walkers (`streetpotato`), Spud's two pocket linings (`pocketlining`, white ears 0.09 x 0.07 pinched out
  at the hem's sides).
- Night street + bank front: FFF 01 street env `dusk-bus-stop`, `sirenwash`, `lightpool`.

Panel -> place: 01 coast (grey) + coupé cabin · 02 city env · 03 vault · 04 mansion-day env · 05, 06 mansionhall ·
07 mansion-gate env · 08, 09, 10 coast.

## 1. SPUD'S RICH OUTFIT (panels 01, 04-10)
Build as: costume option on the existing `spud` costume (`costume.rich: true` in a copy `spud-rich.json`), in
engine/page/costumes-art-cast.js. The teal sweater stays under it, unchanged. Budget 16k triangles in all.

Body frame: y up from the floor, z forward. Spud is 0.88 tall, 0.76 wide, 0.66 deep.
- **Coat body**: open-front long coat, 0.045 off the sweater, 0.02 thick. Hem at y 0.10 (just over the boots).
  Front opening: 0.30 wide at the chest, 0.44 at the hem, so the sweater, chain and both arms are free.
  Shawl collar 0.11 wide, rolled 0.05 thick, its top at y 0.56 at the back and sides, dropping to 0.40 at the
  front: the whole face (eyes, brows, mouth, cheeks) and the head dome above y 0.58 stay bare.
- **Sleeves**: over the knit sleeves, radius 0.105 at the shoulder to 0.085, ending 0.11 before the hand's centre
  (the sweater's own cuff ends 0.062 before it), so 5 cm of teal cuff and the whole 3-finger glove are free.
  Same single no-twist frame as the knit sleeve.
- **Fur, drawn by hand**: no texture tile. One instanced mesh of 900 locks (body 620, sleeves 2 x 90, collar 100):
  flat tapered leaf shapes 5-9 cm long, 2-3.5 cm wide, tip curled 20 degrees out, pointing down the cloth with
  +-25 degrees of hashed turn, laid in 14 rows like roof tiles (each row covers 40 % of the one below). Colours:
  lit #f4e8cb, half #dcc79d, shade #b59c70, deep fold #8e7650; ink strokes #5c4731, 1.5 px, on one lock in three
  (hashed). Every edge of the coat (hem, front edges, cuffs, collar) is a scalloped line of lock tips, 3-5 cm
  teeth. Locks lag the body by 2 frames with 6 degrees of swing at most; in wind (coast) all lean 10 degrees.
- **The back must read as a coat** (panel 09): a centre seam from collar to hem (a 1.2 cm dark groove #8e7650), a
  yoke line across the shoulders at y 0.50, a half-belt at y 0.30 (0.34 wide, 0.06 tall, smooth cream leather
  #e6d3a6, one gold button r 0.018 at each end), a 0.22 vent in the hem. Collar roll above, bare head and leaf
  above that.
- **Keys**: `spread` 0..1: the two fronts swing 0..35 degrees outward (1 in panel 04's open arms, 0.3 when he hugs
  bags: the fronts sit BEHIND the bags, never between bag and belly). `sit` 0..1: everything below y 0.30 lies out
  on the ground as a half ring r 0.55 behind and beside him (scalloped edge, 4 soft folds), the two fronts fall
  outside the thighs; knees, boots and lap stay bare (panel 10).
- **Gold chain**: 24 oval links, each 0.046 x 0.032, wire r 0.009, alternate links turned 90 degrees. It leaves
  the collar at x +-0.16, y 0.40 and hangs in a U whose lowest point is y 0.26, z = sweater + 0.012. Lit
  #f6c832, shade #b5801c, a white-gold glint #fff3b0 on every third link. Rigid; with key `swing` it swings
  +-4 degrees, period 0.8 s.
- **Sunglasses on top of the head**: aviators. Two lenses 0.13 x 0.095, corners rounded 0.03, 0.03 apart, gold
  rim wire r 0.007, a double bridge, temples 0.14 long running back. Centre at y 0.86, z +0.13, tipped back 60
  degrees from upright, 2 mm off the skin; the sprout stands free 0.10 behind them. Lens #6b5326 with one pale
  streak #d9c27a at 35 degrees. Their lowest edge stays 0.05 above the brows at their highest pose (`shocked`)
  (measure). They never move down.
- **Check with the bench**: arms `hold`, `hips`, `up`, `lap`, the box hold of two `moneybag`, `sit` on the
  ground and on `carseat`: no limb-through-costume, face-covered or costume-in-prop.

**Balaclava** (panel 03; `eyemask` is only a domino band). Build as: new worn kind `balaclava` in props-heist.js
(fit table as the eyemask, new row "spud", measure). Black knit #1b1a20, rib lines #33303c every 1.2 cm running
up to the crown, 5 mm off the skin, from the crown down to y 0.36 where it tucks under the sweater collar. Three
real openings with a rolled rim 1.2 cm #26242c: two eye holes 0.17 across and one mouth hole 0.21 x 0.11, 0.03
apart (panel 03's "face window" in three parts); a 0.05 hole on top that the leaf passes through. All steam.
Budget 3k.

## 2. GOLD COUPÉ (panels 01, 04, 07, 08)
Build as: new rig model `coupe` in a new file engine/page/car-coupe.js, copied from the roadster's slice body
(same wheels, chrome, `carseat`, `steer`); `carglass` for its panes. Budget 30k. Frame: front +z, driver at +x.

| Thing | Number (roadster's in brackets) |
|---|---|
| Body length | z -2.05..+2.55 = 4.60 (3.84): bonnet 0.57 longer |
| Wheels | front z +1.55, rear -1.25, radius 0.358 (same), same track |
| Sill (body bottom between the axles) | y 0.17 (0.27): low-slung; cabin floor y 0.21 |
| Belt line | y 0.95; bonnet top 0.88 at the cowl falling to 0.62 at the nose |
| Cabin | z -1.45..+0.55; front seats z -0.15, x +-0.42; rear bench centre z -1.05, 1.5 wide, cushion top y 0.55 |
| Hard roof | top y 1.68 at z -0.30, inner 1.62; 1.50 wide (the sides lean in 14 degrees) |
| Windscreen | from (y 0.95, z +0.55) to (y 1.62, z +0.05); frame 4 cm chrome |
| Fastback | one curve from the roof at z -0.60 to the tail lip (y 0.80, z -2.05); rear window in it, 1.2 x 0.55 |
| Side glass | one long teardrop pane per side, no centre post |

- Roof inner = the seated leaf tip + 0.03 (measure with Spud on `carseat`); if the leaf still touches, raise roof
  and belt together, never squash the leaf.
- Shape: rounded classic (panel 04): round headlamps r 0.13 in the fender tips, an oval grille 0.60 x 0.22 with 9
  upright chrome bars, chrome bumper blades, wire-spoke look on the 5-spoke wheels, two small round tail lamps
  #c8302a. No plate, no badge.
- Paint: gold lit #e9b93a, half #c9942a, shade #8f6418, sky reflection band #fff0b0 6 cm wide along the shoulder
  and one along the roof. Chrome #e8edf0 / #7d868c. Glass tint #a9c3c9 at 0.14. Wet (01, 07, 08): 40 drops per
  pane and a second white band 3 cm.
- Inside: cream leather lit #f1e4c6, shade #cdb98f, piping #c9a55a; dash walnut #6a4426; `steer` rim #3a2a1e.
- **Back seat load** (key `load` 0..1 hides it for panel 04): 7 plain `moneybag` on the bench and shelf at
  (x, y, z, turn) = (-0.50, 0.55, -1.05, 10), (0.0, 0.55, -1.10, -15), (0.50, 0.55, -1.00, 30), (-0.25, 0.86,
  -1.15, 80), (0.28, 0.86, -1.20, -40), (-0.05, 1.12, -1.25, 20), and the split one lying on its side at
  (-0.45, 0.55, -0.70), `open: true`, 9 loose `banknote` fanned out of it over the cushion and 3 on the floor.
  None above y 1.46 (the rear window stays half clear), none nearer than 0.12 to the driver's seat back.
- **Panel 01 camera**: outside, 0.30 in front of the windscreen over the bonnet, looking BACK through the glass
  at Spud: pos (-0.25, 1.32, +0.75) -> look (0.20, 1.05, -0.60), fov 50 (car frame). In frame: gold roof edge
  across the top, gold cowl across the bottom, Spud right of centre, the bags left, the rear window and the wet
  coast road running away behind (top third: only grey sky and rain through glass). Windscreen rain: the wiper
  has just cleared a fan (pivot at the cowl's middle, r 0.75, 110 degrees); inside the fan 12 fresh drops, outside
  it 60 drops and 14 runs (`carglass` drop numbers); a 4 mm water bead along the fan's edge. Streaks outside:
  the sinking-car numbers (160 in frame, 0.35 long, 9 m/s, 12 degrees with the wind).
- **Out of fuel, without words (panel 08)**, both, in this order:
  1. Dash insert 0.8 s: one round gauge 0.11 across on the walnut dash, an amber #ffb347 arc of 100 degrees that
     is thick at one end and a thin red #e0362c wedge at the other, a white needle. Key `fuel` 1..0: the needle
     falls into the red wedge in 0.4 s, quivers +-3 degrees for 4 frames, a red lamp r 0.008 under it lights.
     No pump icon, no letters.
  2. Wide: the car loses speed from 9 to 0 m/s over 2.2 s, two jerks (pitch 2 degrees, 3 frames each) at 0.8 and
     1.5 s, three exhaust puffs at those jerks and at the stop (grey #b9b4ac, r 0.15 -> 0.45 in 0.6 s, gone by
     0.9 s), the headlamps dim from 1 to 0.3 over the last 0.5 s. It stops 0.4 from the rail at CARSTOP (6.2).

## 3. BANK VAULT (panel 03) and the bank's front
Build as: room set `vault`, new file engine/page/set-vault.js; the front as prop `bankfront` in a new file
engine/page/props-happy.js. Budget: set 25k, front 4k.

Frame: the steel wall with the round opening is the plane z 0; the strongroom is behind it (z < 0), the
ante-room where the camera stands in front (z > 0). Floor y 0.
- Ante-room 6.0 (x) x 4.5 (z) x 3.4 tall. Strongroom 3.2 x 2.6 x 2.5.
- Steel wall 0.40 thick, riveted plates 1.0 x 0.8, rivets r 0.02 every 0.20. Opening: a circle of diameter 2.00,
  centre (0, 1.15, 0), with a flat sill cut at y 0.15 (a 2-tread step up, each 0.075), a ribbed collar ring 0.18
  wide.
- Door: a disc of diameter 2.36, 0.36 thick, hinged on a 0.14 pillar at x +1.30; key `open` 0..1 = 0..115
  degrees toward +z (panel 03: open, in the right foreground). Its inner face: 3 stepped rings, 12 locking bolts
  r 0.045 round the rim; its outer face: a ship's-wheel handle of diameter 0.90 with 8 spokes and knobs, a hub r
  0.12. The door swings in 1.4 s, ease `settle`.
- Shelves in the strongroom on the back and both side walls: 4 boards each at y 0.35, 0.85, 1.35, 1.85, 0.40
  deep. One instanced mesh of 150 banded bricks in the `cashbrick` look (0.34 x 0.20 x 0.11) stacked 2-3 high,
  hashed gaps of 0-3 cm and turns of +-4 degrees; green #3f9b5a, paper bands #efe6c8. 6 `moneybag` on the floor.
- Base colours (white light): steel lit #8a9299, shade #555d66, rivet tops #aab2b8; floor tiles #5a5f66.
- **Alarm beacon**: a caged red lamp (dome r 0.11, 5 cage bars) on the steel wall at (-1.55, 2.60, 0.06). Key
  `alarm` 0..1, `clock`. It turns 1.5 times a second. Light: a red key #ff3b30 whose direction turns with it,
  plus a wall wash (additive, steam) 2.5 wide that sweeps the walls; between sweeps the room falls to a dim red
  fill #5a1f22 at 0.5, never to black. Under the red the steel reads lit #b5503f, shade #5a1f22 (panel 03).
  The strongroom has its own steady warm lamp #ffd9a0 so the money stays green.
- Panel 03 camera: (-0.5, 0.75, 3.0) -> (0.1, 0.80, 0), fov 45. Spud at (0, 0, 0.9) facing +z. Top third: the
  red wall and the lamp.
- `bankfront` (night street): a pale stone front 9.0 wide x 7.5 tall x 0.6 deep: 5 steps, 4 columns r 0.30 x 4.2
  tall, a plain triangle pediment, bronze double doors 2.2 x 2.8 standing open with the beacon's red pulse inside
  (same clock), two barred windows. Stone lit #cfc6b4 under the street light, shade #6f6a78.

## 4. MANSION
### 4a. Exterior day (panel 04). Build as: painted env `mansion-day` + 3D prop `fountain` (props-happy.js, 6k)
- spec: size 896x1344, upscale 2, refine 0, eye height 1.1, vfov 46, eye pos (0, 1.1, 9), surface "road",
  groundMax 45, light key (-3, 5, 4) "high late-morning sun from the front left", shadow 0.3.
- prompt: "anime film background painting, gouache, soft brush strokes, low ground level view across a wide pale
  paved forecourt that fills the bottom half, a grand white classical mansion in the distance, tall columns,
  triangle pediment, slate roof, a curved double stone staircase with balustrades up to the front door, trimmed
  cypress trees and pink flower beds on both sides, bright late morning sun, blue sky with small white clouds"
- no: "people, car, vehicle, fountain, statue, text, letters, flag, aerial view, night, rain, tree in foreground"
- `fountain` at z -11: three bowls (r 1.6 / 0.9 / 0.45 at y 0.5 / 1.3 / 1.9), stone #e4dccb / #a9a493, water
  #bfe3ee. Water: 16 falling ribbons per rim, their streak texture running 2.2 m/s; a top jet 0.5 tall; rings in
  the basin every 0.4 s (hashed). Coupé at (2.6, 0, -4.5) turned -60 degrees, `load` 0. Top third: sky and roof.

### 4b. Gate at night (panel 07). Build as: painted env `mansion-gate-night` + prop `irongate` (props-happy.js, 5k)
- spec as 4a but eye height 1.0, eye pos (0, 1.0, 8), groundMax 35, light "cold moonlight from behind, warm
  window glow", shadow 0.2.
- prompt: "anime film background painting, gouache, night after rain, low ground level view along a wide wet
  cobbled driveway that fills the bottom half and reflects light, in the distance a grand classical mansion with
  warm lit windows behind dark trees, deep blue cloudy night sky, puddles"
- no: "people, car, vehicle, gate, fence, lamp in foreground, text, letters, day, sun, aerial view"
- `irongate` at z -7 (in front of the painted house): two stone pillars 0.7 x 0.7 x 3.2 at x +-2.4 with a ball
  cap and a lantern each (warm #ffcf7a, a `lightpool` under it), two iron leaves 2.4 x 2.8 (bars r 0.02 every
  0.16, a scrolled arch top, spear tips, #1d2027), 1.5 m of railing each side. Key `open` 0..1 (0..80 degrees).
- Police: 3 `policecar` behind the gate line at (-3.4, -9.5), (0.2, -11), (3.6, -9.5), turned 20, 0, -20; 4
  officers on foot in front of it; `sirenwash` flat 8 x 6 at z -6 and one upright on the pillars. The coupé in
  the right foreground at (1.9, 0, 0.5), its nose to +x. The wet look: every light source has a stretched
  reflection decal on the ground (as long as 2.5 x its height, opacity 0.35, broken into 5-8 dashes).

### 4c + 4d. Hall with the front door (panels 05, 06). Build as: ONE room set `mansionhall`, new file
engine/page/set-mansionhall.js. Budget 45k.
Frame: floor y 0, the hall's long axis is z; the front door is in the wall z +11, the stairs at z -11.
- Hall 14 (x) x 22 (z) x 9 tall. Floor: marble tiles 1.0 x 1.0 set diagonally, #cfd4dc / #9aa3b2, veins
  #6f7a8c, a soft mirror sheen (a darker upside-down copy of windows and candle only, opacity 0.25; no real
  reflection). Walls #7f8aa0 lit by the moon, shade #3a4258; 8 round columns r 0.35 x 7.5 at x +-5, z -9, -3,
  +3, +9.
- **Double staircase** at the far end: a landing 6 x 2 at y 3.0 against the wall z -11; two curved flights 1.8
  wide sweep down from its ends to the floor at (x +-5.5, z -5), 20 steps each (rise 0.15), stone balusters
  every 0.3, rail top 0.75 above the steps. Two urns on plinths at the feet.
- **Windows**: two arched windows 2.2 wide x 5.5 tall in the far wall above the landing at x +-1.7, sills y
  3.6; 3 x 7 panes, bars #2a3044. Outside: a night card #1b2a4a to #33466e, a moon disc (1.6 across at 60 m,
  #e8eefc) in the upper part of the +x window, dark tree shapes. Moonlight: key TO the light (0.15, 0.55, -0.82),
  #a9bde8; two long window-shaped light patches on the floor reaching z -2 (steam decals, opacity 0.30).
- **Table**: 12.0 long x 1.3 wide, top y 0.62 (potato chairs seat at 0.42), along z from -6.5 to +5.5, x 0;
  polished dark stone #3c4458 with veins, a sheen band. 20 chairs (`chair` look in dark wood #5a3524 with a tall
  carved back 0.95, seat pad #7a2f2a): 9 a side every 1.25 from z -5.6, one at each end. Spud sits at the far
  end (0, 0, -7.1) facing +z.
- On the table at his end: one white plate r 0.13 with a gold rim (`dinnerplate`), one brass candlestick 0.22
  with a candle 0.14; flame 0.035 tall #ffd27a / core #fff3c4, swaying +-6 degrees, period 1.3 s; its light
  #ffb866 reaches 1.6 m (the only warm thing in the hall: his face and the fur). Nothing else on 12 m of table.
- **Chandelier, unlit**: at (0, 6.4, -1.5), 3 brass rings r 1.2 / 0.8 / 0.4, 16 dead candles, 72 crystal drops
  (one instanced mesh, 4-7 cm, #cfd8ea at 0.6, each with one white glint from the moon); it hangs still.
- **Clock**: reuse `longclock` if its face is free of numerals (measure), else a new face: 12 plain ticks. It
  stands at (-6.3, 0, -2). Key `hands` [hour, minute] = [3, 0]; pendulum +-5 degrees, period 2 s.
- **Front door** (wall z +11, centre x 0): 1.6 wide x 3.3 tall, 0.09 thick, walnut lit #7a4a2a, shade #46291a,
  6 raised panels, hinges at x -0.8, a brass handle at y 0.95. **Lock column** on the latch side at x +0.62:
  10 units from y 0.50 to 2.30, one every 0.20. Unit = a brass hasp plate 0.24 x 0.07 across door and frame + a
  padlock (body 0.085 x 0.10 x 0.03, shackle r 0.03) hanging under it + a chain loop of 7 links (wire r 0.006)
  down to the next unit. Brass lit #e2b84a, shade #9a7424. Key `locks` 0..10 (whole numbers; unit k is drawn
  when locks >= k, bottom first; a unit arriving drops 3 cm and settles in 4 frames).
- **Side window** to the doorstep: 1.3 wide x 2.7 tall in the same wall at x +1.9, sill y 0.45, 3 x 6 panes,
  rain drops and runs on the outside (`carglass` numbers). Outside: a stone step 2.4 x 1.2 at y -0.15, a lantern
  on the wall (#ffcf7a, r 2 m of glow), a night garden card, rain streaks. Chip stands at (1.9, -0.15, 12.1)
  with the `gift` (yellow box #f4e7c0, red ribbon), fully seen through the window.
- Panel 05 camera: (-1.4, 0.85, 8.6) -> (0.9, 1.0, 11), fov 42 (Spud at the door, the lock column up the middle
  of the frame, Chip in the window lower right; top third: dark door wood). Panel 06 camera: (0, 1.15, 6.6) ->
  (0, 1.9, -8), fov 55 (the table runs away from the lens, Spud small at its end, stairs and windows behind;
  top third: the dark ceiling and the chandelier, no bright thing).
- Hiding places for outline step 5: a loose floor tile 1.0 x 1.0 at (4, 0, -1) (key `hatch` 0..1 lifts it 70
  degrees over a hole 0.5 deep that takes 2 bags). No fridge and no bedroom are designed (question 3).

## 5. WHITE LIMOUSINE (panel 02) and WHITE AMBULANCE (panel 08)
Build as: prop kinds `limo` and `ambulance` in props-happy.js, from `buildHatchback` and the `policevan` body.
- `limo`: the hatchback stretched to L 6.6 (3.3 added between the doors: three more side windows 0.9 long),
  roof lowered to 1.75, white lit #f6f3ec, shade #b9bcc6, a chrome strip 3 cm at y 0.80, dark glass #1c222c,
  white wheel discs. The rear side window on the kerb side is open (spec `open: "L" | "R"`): two passengers
  (cast rig) on a bench at cushion y 0.50: a wide sun hat with pink flowers and a pearl string; a black bow tie.
  3 paper bags held out of the window (`shopbag`, 0.26 x 0.30 x 0.10 with a rope handle: #f29bb5, #f2c75a,
  #c9a6e8). Params `len`, `bend` as `citycar`. Budget 14k.
- `ambulance`: the van box 1.9 x 1.9 x 3.2 plus a FRONT (the van is only built from behind): a cab nose 0.9
  long, a raked windscreen 1.5 x 0.7, two round headlamps (lit #fff6c8, a 6 m beam cone as `headbeams`), a
  plain grille. White #f2f0ea, shade #b4b8c4, ONE orange-red stripe #e2572b 0.22 tall at y 1.10 round sides and
  back. No cross, no star, no word. Roof bar as the van's (blue #2f6bff / red #ff3b30, 2.5 a second) + its
  `sirenwash` on the road. Params `lights`, `clock`, `len`, `bend`. It passes at 14 m/s and does not slow.
  Budget 8k.

## 6. COAST ROAD, CLIFF TOP, SUNSET (panels 01, 08, 09, 10). The most care of all.
Build as: ONE 3D set `coast`, new file engine/page/set-coast.js (like `stormlake` and `hilltop`), with two
painted sky plates. Why not a painted env: one world must be seen in five directions (back through the car, down
on the road, up the slope, out to sea, and back at Spud's face with the sky behind him), must change its whole
light on screen in 3 s, and its grass and sea must move; an env is one view with one light. Why plates: brush
work no shader gives. Budget: set 120k (grass 50k of it), at most 4 see-through layers over any pixel.

### 6.1 Layout
Frame: SEAT (where Spud sits) is the origin, y 0 = the grass there. The sea is toward -z, the land toward +z, the
coast runs along x. Sea surface y -55. Nothing farther than 280 m; sky dome r 270.
| Thing | Where | Size |
|---|---|---|
| Cliff brink | z = -6 + 1.5 sin(x / 7) | 6 m in front of SEAT; rock face down to the sea, 3 ledges |
| Knoll (cliff top) | centre SEAT | level within r 2.5, then falling 1:6 |
| Climb slope | from SEAT toward (+0.8, +0.6) in x, z | drops 9 m in 24 m, 5 rock steps 0.4-0.9 tall, tufts between |
| Road | centre line through (-60, -12, 34) (-20, -10, 24) (26, -9, 18) (70, -11, 30) (120, -14, 12) (180, -16, 40) as x, y, z | 6.0 wide, smooth curve, two lanes |
| CARSTOP | (26, -9, 16.2), nose toward +x | the coupé's stop, 28 m from SEAT |
| Rail | the road's sea side, 0.3 outside the edge | posts 0.7 tall every 2.5, two steel bands #9aa3a8 |
| Road lamps | the land side, every 30 m from x -40 to 170 | 4.5 tall, warm #ffcf7a, lit in the grey state only |
| Headlands | 3, at x +85, +150, +225, each reaching to z -30, -50, -40 | 50, 60, 70 tall; the 2nd carries a white lighthouse 10 tall, r 1.4 |
| Inland hills | z +60..+200 | 3 soft ridges, a painted ring beyond |
- Road: asphalt #4a4f55, wet band #7d8a92 down the middle (grey state), centre dashes 3.0 x 0.15 every 9 m
  #d9d4c0. Rock: lit #8f8a7c, shade #5a5a60, deep #3c3f4a, moss #5f7a3e on tops; hatching on shade faces.
- Sea: one plane; 4 sine waves as STORMLAKE 1.4 (amplitudes 0.22 / 0.14 / 0.08 / 0.04), times key `calm`
  (1.0 -> 0.35). Foam collar 1.5 wide at the cliff foot, surging +-0.8 with a 5 s period.

### 6.2 Grass and flowers (within 14 m of SEAT and 4 m each side of the climb; a painted ground beyond)
- 4,200 tufts, one instanced mesh, 6 blades each (a blade = a bent strip of 2 triangles, 0.25-0.45 tall, 1.2 cm
  wide; 0.55 tall within 2 m of the lens line of panel 10). Hashed place, turn, height. Three greens per state
  (6.4). None inside r 0.45 of SEAT or under the bag (a pressed patch, darker).
- Wind: toward WIND = (0.94, 0, -0.34) (along the cliff, a little out to sea). Rest lean 12 degrees toward
  WIND; gusts = a wave travelling along WIND at 4 m/s, 6 m long, adding 0..22 degrees; a 3 % flutter at 3 Hz
  hashed per tuft. Grey state: gusts x 1.4.
- 260 flowers, instanced: daisies (white #fbf7ea, centre #f2c230, 4 cm), pinks #e87aa8, violets #9a7ad0,
  buttercups #f6d23a, on stems 0.2-0.35; the thickest within 4 m in front of the panel 09 lens. They nod with
  the grass at half its angle. 6 seed heads of taller grass (0.7) on the skyline of panel 09, left third.

### 6.3 Sky: two states on one dome, key `break` 0..1 and key `sink` 0..1
SUN direction (TO the sun): azimuth 7 degrees toward +x from -z, so (0.12, e, -0.99). Disc 2.4 degrees across
(11 m on the dome). Elevation of its centre: +0.6 degrees at sink 0 (the lower limb on the horizon), -0.4 at
sink 1 (more than half set, panel 09). `sink` runs slowly over the whole final hold.
- **Grey deck** (state G, break 0): a low cloud sheet over the whole dome: zenith #3a424c, 40 degrees up
  #56606a, horizon #7f8a90; 6 darker bands #2c333b with brush hatch strokes, sliding along WIND at 0.4
  degrees/s. Rain: the streak numbers of section 2, veil cards at 20 / 40 / 80 m. Mist band on the sea, 8 tall.
  Key `slit` 0..1 (panel 08, before the break): a peach band #f0b58a, 1.5 degrees tall, on the sea horizon
  within +-25 degrees of SUN, and the rain thins to 30 %.
- **Sunset** (state S, break 1), the gradient under the plates: at SUN on the horizon #fff3c0, 5 degrees up
  #ffc24a, 12 degrees #ff8a3c, 25 degrees #f0617a, 45 degrees #a0569e, zenith #4a4f96; away from SUN in azimuth
  the same bands cool: at 90 degrees the horizon is #f4a08a, opposite SUN (behind Spud, panel 10) horizon
  #f2a7b8, 30 degrees #8f86c8, zenith #4a4f96. Sun disc #fff6d0 with a soft halo of 9 degrees #ffd27a at 0.5.
- **Plate 1 `coast-sunset-sky`** (the clouds round the sun, panel 09): painted with engine/plates/paint.py, size
  1344x896, upscale 2, clouds only; laid on the dome from azimuth -75 to +75 degrees round SUN, elevation 3 to
  62 degrees; its black-to-alpha is taken from brightness against the gradient, edges feathered 8 degrees.
  prompt: "anime film background painting, gouache, soft brush strokes, sky only, huge sunset sky seen from a
  cliff, rows of small cumulus and long cloud bars lit from below, glowing orange gold and pink undersides,
  violet tops, clear gold band along the bottom edge, deep blue violet at the top, no ground". no: "sun, sea,
  horizon line, land, tree, bird, people, text, photo, 3d render".
- **Plate 2 `coast-afterglow-sky`** (opposite the sun, behind Spud in panel 10): same size and mapping, centred
  on the anti-sun azimuth. prompt: "anime film background painting, gouache, soft brush strokes, sky only,
  evening sky opposite the sunset, scattered soft pink and peach cumulus clouds on a violet blue sky, calm, wide
  empty areas of sky". no: as plate 1. The top third of panel 10 must fall on an empty area: turn the plate.
- Fallback if a plate fails the look: 40 drawn cloud bars per side (ellipses 8-30 degrees long, 1-3 tall,
  underside #ffb056, body #e86a7c, top #7a5aa0, ink-free, a hatch of 5 brush strokes each), same mapping.
- **The break, 3.0 s (90 frames), `break` linear 0 -> 1.** u = break.
  - u 0-0.15: the slit swells to 4 degrees and turns gold #ffd27a; a first ray fan (5 rays, 1-3 degrees wide,
    #ffe6a8 at 0.25, additive) stands up from SUN behind the deck's edge.
  - u 0.15-0.70: the deck PARTS. It is one layer whose opacity = step(noise(azimuth, elevation) + reach(u));
    the hole opens at SUN and grows as a ragged ellipse to 150 degrees wide x 70 tall; its edge is a lit rim 1.5
    degrees wide #ffd9a0 on the grey; torn cloud scraps (24, hashed) drift off along WIND at 2 degrees/s, lit
    pink below. The plates and the gradient show through the hole. Rain 30 % -> 0 by u 0.4.
  - u 0.30-0.85: the LIGHT SWEEPS IN: a lit front runs over the sea from the horizon to the cliff foot (u 0.30-
    0.55; the gold road appears behind it), climbs the cliff face (0.55-0.62), then crosses the grass from the
    brink over SEAT to z +14 at 7 m/s (0.62-0.85). Behind the front everything takes its S colours; ahead of it
    its G colours; the front is a 1.2 m soft edge, 10 % brighter. Spud is reached at u 0.66: rim light first.
  - u 0.70-1.0: the rest of the deck thins to nothing overhead (never a pop: opacity ramps); `calm` 1 -> 0.35;
    lamps and lighthouse fade off; mist gone.
- **Gold road on the sea**: from the horizon under SUN toward the viewer, 5 degrees wide at the horizon, 16 at
  the cliff foot: 220 hashed dashes (0.6-3 m long near, thinner far), core #fff3c0, edge #ffb84a, each
  twinkling on a 0.7-1.3 s period; the sea beside it #c46a6a near the sun to #5a5f96 at the frame's sides.
- **Seabirds**: reuse `gulls`: 5, dark #3a3046 against the sky, wingspan 1.1, at 60-110 m, between 8 and 20
  degrees of elevation (the middle of the frame, under the caption), slow circles of r 12 m, period 14 s,
  flapping 2.2 Hz for 1 s then gliding 3 s (hashed phases). Present from u 0.5.
- Light. G: key TO (-0.30, 0.85, -0.40) #aeb9c2, fill sky #5c6872 / ground #3f4a44, shadows 30 %. S: key TO
  (0.12, 0.14, -0.98) (drawn 8 degrees up so the grass tips catch it) #ffb866, fill sky #8a6aa8 / ground
  #6a5a3a, key : fill 2.5 : 1, long shadows toward +z at 45 % and tinted #4a3a6a, a rim #ffe0a0 on every edge
  that faces SUN (Spud's leaf, glasses, fur tips, each blade).

### 6.4 State colours
| Thing | Grey (G) | Sunset (S) |
|---|---|---|
| Grass lit / half / shade | #6f8f4f / #4f6f3f / #36503a | #d9c24a / #8fa63c / #3f5a3a (back-lit tips #ffe98a) |
| Sea trough / body / crest | #36464c / #52666c / #8a9a9c | #5a4f86 / #b0607a / #ffb070 |
| Rock lit / shade | #8f8a7c / #5a5a60 | #e0986a / #5a4668 |
| Fur coat lit / shade | #cfc8b4 / #8a8676 | #ffe2b0 / #a8748a |
| Spud's skin lit | #c9a060 | #f6b860 |

### 6.5 Spud, the bag, the notes (panels 09, 10)
- Spud sits at SEAT facing -z (coat `sit` 1). The `moneybag` lies at (+0.62, 0, +0.05), tipped 55 degrees with
  its mouth toward +x and up, `open: true`; mouth centre M = (0.80, 0.24, 0.05). (The bag is on his right, as
  panel 09; panel 10 is therefore mirrored, question 1.)
- **Notes on the wind**: 7 `banknote`, leaving at t0 + 0.0, 0.5, 0.8, 1.5, 1.9, 2.8, 3.6 s (t0 = the bag
  falling open). For note i with age a: along WIND s(a) = 3.2 (a - 0.8 (1 - exp(-a / 0.8))) m (0 -> 3.2 m/s in
  about 0.8 s); height y = 0.24 + 0.55 a + 0.30 sin(2 pi (0.9 a + h1)); sideways (across WIND) 0.25 sin(2 pi
  (0.6 a + h2)) + 0.4 (h3 - 0.5) a; position = M + WIND s + those. It tumbles 1.2 turns a second about its long
  axis and 0.4 about the vertical (hashed signs); it bends +-15 degrees. h1..h3 = hashes of i. It first peels
  from the mouth over 6 frames (one corner lifts). Each lives 5.0 s: by then it is 13 m away and under 6 px in
  panel 09, where it fades over 10 frames. Lit side #bfe0a0, back-lit against the sun #4a5a3a with a gold rim.
  3 more notes stay in the mouth, their corners fluttering +-12 degrees at 4 Hz. Spud never turns to them.
  No note passes within 0.35 of his face in either camera (they leave toward +x).

### 6.6 Cameras (starting points; fit with qa/camfit.mjs)
| Shot | pos -> look, fov | In frame; top third |
|---|---|---|
| 01 cold open | car frame, section 2; the car at (60, -11, 28) heading -x | road and lamps behind; grey sky through glass |
| 08 fuel stop, wide | (-6, -2.5, 6) -> (26, -9, 17), fov 40 | the coupé stops at CARSTOP, sea left; grey sky, the slit |
| 08 the climb (panel) | (4.5, -2.6, 2.2) -> (11, -5.2, 9), fov 50 | Spud with one bag on the rocks, the road, the coupé and then the ambulance below; sky |
| 09 the break and the hold | (-0.9, 1.15, 5.2) -> (0.6, 0.9, -40), fov 40 | Spud's back and the bag low left of centre (22 % of the height), flowers in front, horizon at 52 % down, the sun right of centre; sky plate 1 |
| 10 the smile | (0.25, 0.55, -2.3) -> (0.05, 0.62, 0), fov 38 | his face and chain, the bag screen left, grass below; sky plate 2, an empty area |
| last hold | camera 09 pushing 0.6 m forward over 4 s | `sink` 0.4 -> 1 |

## 7. COLOUR SCRIPT (key / fill / dominant)
| Scene | Key | Fill | Dominant; the one accent |
|---|---|---|---|
| 01 cold open | #aeb9c2 | #5c6872 | storm grey-blue #56606a; gold car and fur, dulled |
| 02 city noon | env sun + #dfe8f0 | env | cream, sky blue, pink flowers; Spud's teal |
| 03 vault | red #ff3b30, turning | #5a1f22 | red-brown steel; green money |
| escape street | env dusk + siren blue / red | env | navy night; blue-red wash |
| 04 mansion day | env sun | env | white stone, blue sky; gold #e9b93a at its brightest |
| 05 door, night | lantern #ffcf7a through the window | #2a3350 | walnut brown, brass; Chip's yellow outside |
| 06 hall | moon #a9bde8 | #3a4258 | cold blue marble #7f8aa0; one candle #ffb866 |
| 07 gate | siren blue #2f6bff / red #ff3b30 | #1b2a4a | wet navy; warm windows far off |
| 08 coast road | #aeb9c2, slit #f0b58a | #5c6872 | grey-green; ambulance red-blue passing |
| 09-10 sunset | #ffb866 | #8a6aa8 | orange, pink, gold over violet; green grass comes alive |
Gold is the thread: bright at 04, cold and dull from 05 to 08, and at 09 the sky is gold and the car is gone.
The fur follows it: cream at 04, blue-grey at 06, rose-gold at 10.

## 8. BUILDER TASKS (one owner per file)
- T1 costumes-art-cast.js: rich outfit (section 1) + `spud-rich.json`. props-heist.js: `balaclava`, `mark`,
  `badge`. Proof: bench stills front / side / back, standing, sitting on the ground, hugging two bags, in the car.
- T2 car-coupe.js: the coupé, load, wiper fan, fuel gauge, the stop. Proof: panels 01, 04, 08 stills + 360 px.
- T3 set-vault.js, set-mansionhall.js: sections 3 and 4c/d. Proof: panels 03, 05 (locks 1 and 10), 06.
- T4 props-happy.js: `bankfront`, `fountain`, `irongate`, `limo`, `shopbag`, `ambulance`, `flowerbox`,
  `poster`, `pocketlining`; envs `mansion-day`, `mansion-gate-night` (review.png each). Proof: panels 02, 04, 07.
- T5 set-coast.js + the two sky plates: section 6. Proof: stills at G, at u 0.15, 0.4, 0.66, 0.85, 1.0 from
  camera 09; panel 08 and 10 stills; a 10 fps strip of the break; render time per frame (target under 2x the
  stormlake's above-water frame). Every proof also at 360 px wide.
All: VOCAB lines for new kinds and keys; seed every new param with a dur-0 set at time 0 (propState's rule).

## 9. OPEN QUESTIONS (my default in brackets)
1. Panels 09 and 10 disagree on the bag's side (right of him from behind, yet screen right from the front).
   [Bag on his right as in 09; panel 10 mirrored, so the notes fly away from his face.]
2. Panel 07 puts the coupé OUTSIDE the gate with the police between it and the house. [Follow the panel.]
3. Outline step 5 names a fridge and a bedroom; the brief lists neither. [One floor hatch in the hall, 3:00 on
   the hall clock; no fridge, no bedroom.]
4. Panel 07's caps show a badge; the brief says none. [None.]
5. Painted sky plates may not match the drawn gradient. [Use them; the drawn cloud bars are the fallback.]
