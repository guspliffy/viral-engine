# Country vs Country 01 — Paying at the supermarket, Germany vs America: design (Fable 5.2, 26 Nov 2026)

Target: the approved 12-panel sheet `checkout-sheet-1.png` beside this file (square panels: framing is a guide, the film is 9:16), the panel
texts in `/mnt/project-files/videos/country-vs-country/01-checkout/checkout-sheet-prompt.txt`, the 24 lines in `lines.mjs`. New pieces only.
Axes +x right, +y up, +z toward the camera, metres; positions are foot roots (x, z) or mesh centres (x, y, z). Yaw 0 faces the camera,
negative turns toward -x. 1080 x 1920, 30 fps, fov = vertical. Captions rows 470-640. **Every pixel number below is worked out by hand from
the cast files and the positions here, nothing is rendered: fit all cameras in one `qa/camfit.mjs` batch before the first layout.**

Heights (legs 0.14, eyes at 0.60 of the body, mouth at 0.45):

| Who | File | Stands | Eyes | Mouth | Note |
|---|---|---|---|---|---|
| Spud (both lanes) | `spud.json` | 1.02 | 0.67 | 0.54 | unchanged |
| Wedge, cashier | `wedge.json` | 1.32 | 0.93 | 0.78 | on a 0.20 platform behind the counter (section 2), shades top 1.36 |
| Mash, bagger | `mash.json` + worn apron (section 6) | 1.38 | 0.88 | 0.70 | on the floor |
| Retiree | NEW `retiree.json` (section 5) | 0.83, cap top 0.90 | 0.55 | 0.45 | Chip's ball x 1.30 |
| Shoppers | prop `streetpotato` | 0.85-1.10 | | | potatoes only, never humans (sheet slip, panel 11) |

## 0. Cameras (one per panel + 3 the lines need; all sharp; every one a slow linear push from `pos` to `push to`)

| Cam | Panel | pos -> look, fov | push to | Sees (start frame) |
|---|---|---|---|---|
| 01 DE-WIDE | 1 | (-2.85, 1.15, 7.2) -> (-2.45, 1.05, 0), 34 | (-2.82, 1.14, 6.6) | 506 px/m at Spud (mark H): x 432, eyes row 1159, top 985, floor 1498. Retiree (R1) x 135, eyes 1168, cap top 1021, left edge cut. Wedge's face x 953, eyes 1012, top 843, body cut by the right edge. Flag x 739-827, rows 1011-1067, left of his face. Belt runs from (x 538-707, row 1125) down to the shelf end (x 647-924, row 1257): goods come at the lens and leave toward Spud |
| 02 WEDGE-LOW | 2 | (-2.45, 0.62, 2.55) -> (-1.40, 1.12, 0), 40 | (-2.38, 0.63, 2.38) | Lens 0.31 under his eyes, tilted up 10 deg; Wedge turned to yaw -40. About 1010 px/m: face x 525, eyes row 1120, top 725, shades 684, leaf tip 590. Pointing hand at (-1.95, 0.72, +0.75): x 300, row 1297, 183 px. Counter edge along the bottom; strip lights in rows 0-450 |
| 03 US-MED | 3 | (1.60, 1.05, 5.4) -> (2.00, 0.98, 0.4), 32 | (1.63, 1.05, 5.0) | Spud (HU) a profile slice x 0-331, eye x 257, row 1193. Mash 672 px/m: face x 810 (682-938), eyes 1027, top 691. Bag 1 x 601, rows 1149-1335, 172 px wide. Grape x 630, row 1017, 58 px. Flag x 938-1080 (cut by the edge), rows 1015-1121. Candy back wall above row 700 |
| 04 EGGS | 4 | (-2.80, 1.00, 5.2) -> (-2.10, 0.92, 0), 34 | (-2.76, 1.00, 4.8) | Spud 748 px/m, body cut by the left edge, face x 381, eyes 1158. Egg carton on his palm at (-2.32, 0.62, +1.20): x 496, row 1210, 204 px wide. Wedge's face x 915 (780-1050), eyes 954, top 715. Flag x 592-711, rows 957-1033. Belt from (x 455-664, row 1225) to the shelf end (x 493-897, row 1301) |
| 05 SIGH-OTS | 5 | (-2.90, 0.80, 4.9) -> (-2.94, 0.72, 0.3), 24 | (-2.90, 0.80, 4.5) | Retiree (R5) 1022 px/m: face x 426, eyes 1137, cap top 779, body x 48-804. Watch x 268, row 1276, 79 px. Spud's back (H5) fills x 729-1080, his crown at row 605 (no face) |
| 06 TEN-BAGS | 6 | (2.02, 2.20, 3.30) -> (2.04, 0.46, -0.60), 36 | (2.02, 2.05, 2.9) | Down the row from above its near end, 24 deg down. Bags stack up the middle, x 455-655: bag 1 rows 1260-1479 (209 px wide), bag 10 top row 567 (130 px wide), about 70 px of each bag's open top and its one thing showing. Spud (H6) left, face x 218, eyes 959. Mash (M) right, face x 857, eyes 992. Counter end row 1582, floor below |
| 07 DE-PEAK | 7 | (-2.65, 1.25, 7.0) -> (-2.40, 0.95, 0.2), 36 | (-2.63, 1.22, 6.5) | Spud x 397, eyes 1149, floor 1445. Retiree (R7) x 112, eyes 1136. Wedge's face x 923 (829-1017), eyes 966. Sparks x 742, row 1165, 212 px. Tote x 565, rows 1338-1498. Flying goods peak at row 700 |
| 08 US-PEAK | 8 | (1.85, 1.35, 7.6) -> (1.70, 1.35, 0), 34 | (1.83, 1.33, 7.0) | Level. Spud (H8) x 319, eyes 1281, top 1116, loose bags up to row 1361. Mash (M8) x 781, eyes 1200, top 945. Heap top row 264 under the ceiling line at 228; pendants rows 300-450. Flag x 901-1005, rows 1166-1233. Candy rack a strip at the left edge |
| 09 CARD | 9 | (-2.45, 0.95, 5.0) -> (-1.80, 1.05, 0), 22 | (-2.41, 0.95, 4.65) | Spud's back (H9) x 0-397, crown row 966. Card at (-1.92, 0.70, +0.75): x 513, row 1359, 140 x 222 px, its face to him and the lens. Wedge 1020 px/m: face x 847 (602-1080), eyes 1079, top 682, shades 641. Flag x 364-557, rows 1089-1212 |
| 10 CASH | 10 | (1.50, 0.95, 5.2) -> (2.10, 1.08, 0.3), 22 | (1.54, 0.95, 4.85) | Spud's back (H10) x 0-353, crown row 1002. Cash roll at (1.98, 0.70, +0.95): x 493, row 1382, 146 x 179 px. Mash 1051 px/m: face x 881 (681-1080), eyes 1207, top 692. The heap fills the background |
| 11 SPLIT | 11 | (0, 2.15, 8.2) -> (0, 0.95, 2.4), 24 | (0, 2.08, 7.8) | 11.7 deg down, on the seam. Spud (S11) 912 px/m, body 693 px wide, eyes row 1404, crown 1032, leaf tip 930, armful to row 1611. Fin 15 px wide from row 0 to his leaf at x 540. Five shoppers each side in three rising rows, eyes rows 918-1197 (section 4). Racks and candy to the top edge, no ceiling |
| 12 COINS | 12 | (-2.05, 1.75, 4.9) -> (-2.02, 1.05, 0.45), 28 | (-2.05, 1.68, 4.5) | 9 deg down, lens 15 deg above the retiree's eyes (over 20 the cap peak hides his brows). Retiree (R12) face x 285 (109-461), eyes 1431, cap top 1115. Wedge (W12) face x 880 (671-1080), eyes 1100, top 761. Shelf top rows 1417-1554; pay tray x 364-716, centre row 1480; a coin 49 x 26 px; purse left of the tray. Flag behind Wedge's shoulder, x 616-670 |
| 13 HERO-DE | lines 2, 11 | (-2.20, 0.72, 5.6) -> (-2.60, 0.90, 1.3), 24 | (-2.23, 0.73, 5.25) | Spud (H, turned to yaw +25) 1045 px/m: face x 560, eyes 1200, card in his teeth row 1336, top 835, armful below row 1380 |
| 14 RETIREE | lines 5, 11, 13, the gasp | (-3.45, 0.74, 3.6) -> (-3.40, 0.80, -0.3), 28 | (-3.45, 0.74, 3.3) | Retiree (R1) 1075 px/m: face x 648, eyes 1223, cap top 847. With Spud at H a 70 px teal sliver at the right edge |
| 15 HERO-US | line 9 | (1.40, 0.72, 4.6) -> (1.60, 0.76, -0.2), 24 | (1.42, 0.72, 4.25) | Spud (H6, face turned to yaw +25) 1003 px/m: face x 452, eyes 1078, top 717. Bag 4 at the right edge, x 1011, rows 998-1258 |

No eye is above row 900 (lowest margins: the back-row shoppers in 11, row 918; Wedge in 04, row 954; Spud in 06, row 959). In the caption band and nothing else: Wedge's leaf tip (02, 09), Mash's crown
and leaf (06), the back of Spud's head (05), bags 9-10 (06), the heap (08, 10), racks and lamps. Lenses 22-36 except 02 (40, the one low angle).

**Lines to cameras** (cut every 2-4 s; lanes alternate): 0 -> 01 · 1 -> 02 · 2 -> 13 · 3, 4 -> 03 · 5 -> 14 · 6 -> 02 · 7 -> 04 · 8 -> 06 ·
9 -> 15 · 10 -> 05 · 11 -> 13 (0.6 s, the card) then 14 · 12 -> 07 · 13 -> 14 · 14 -> 08 · 15 -> 10 · 16 -> 09 · 17 -> 08 · 18 -> 09, then
14 for the gasp (0.7 s) · 19 -> 10 · 20 -> 11 · 21 -> 01 (the retiree walks R1 -> R12 and shoulders Spud aside) · 22, 23 -> 12, hold 1.5 s.

## 1. One world: two halls and a seam

One `plain` set, everything built from props, one light rig, all inside x -4.4..+4.4 (the key light's shadow map is 8 m wide: ask for
`shadow.size 5`). **German hall x -4.4..0, American hall x 0..+4.4**, split by one board wall at x 0, 0.02 thick, z -4.2..+2.6, 3.4 high.
No camera crosses x 0, so no camera sees the other lane. Both lanes have the same hand as the sheet: customer aisle on the left of the
counter, staff on the right, counter LENGTH along z, goods travelling toward the camera.

NEW `shophall` (one kind, two looks; floor, back wall z -4.2, two side walls, ceiling y 3.4, lamps; nothing solid, nothing casts a shadow
except the lamps' housings):

| | `look: "de"` at x -4.4..0 | `look: "us"` at x 0..+4.4 |
|---|---|---|
| Floor to z +10 | vinyl tiles 0.60, `#b7bec3` / `#adb5ba`, seams `#9aa3a8` | tiles 0.45, `#ead9b8` / `#e1cba3`, seams `#cdb68c` |
| Walls | `#dfe5e8`, skirting 0.10 `#8d969c` | `#f5e3bd`, a plain band `#c8452e` at y 2.50-2.90 (no letters) |
| Ceiling | `#7f888e`, bare | `#f1e6cf` |
| Lamps | 8 strip lights 1.20 x 0.06, emissive `#f2f8ff` x 1.6, housing `#c9ced6`, at y 3.00, long side along z, at x -3.0 and -1.4, z -3.4, -1.8, -0.2, +1.4 | 6 `pendant` (reused, len 0.8, r 0.16) at y 2.60, x 1.1 and 2.7, z -2.8, -1.2, +0.4; a `lightpool` `#ffd9a0`, 1.2 x 0.8, on 0.45 under each |
| Seam wall | the hall's +x wall | the hall's -x wall |

The seam wall's end at z +2.6 is a white fin `#f7f4ea`, x -0.01..+0.01, unlit: the thin line of panel 11.

**How each lane reads with one light rig** (key `#fff6ea`, shade `#93a0b5`, the same all film):
1. Set colours: German = greys, steel and kraft only, no colour over 35 % saturation; American = cream, red and six candy colours.
2. Lamps: cold emissive strips against warm copper pendants with warm floor pools.
3. The engine's keyed colour grade (`grade`, looks.js colour arc), jumping on every lane cut, no `dur`: German shots
   `{ s: 0.98, w: -0.45, c: 1.06 }`, American shots `{ s: 1.16, w: 0.50, c: 1.00 }`. Skin moves under 2 % (cast colours stay).

**Panel 11 is ONE camera, no compositing.** The lens stands on x 0 and looks straight down the seam wall (cam 11): German hall left of the
fin, American hall right. The grade's `split: { x: 540, soft: 6, s: 0.98, w: -0.45 }` cools the left half while the keyed grade holds the
American values for the right half. The camera pushes along x 0 only (no sway: 0.02 m off axis shows the wall's face as a wedge).

## 2. GERMAN LANE (x < 0): bare, grey, fast

NEW `discountlane`, origin (-2.00, 0, 0) = the floor under the scanner; 0.56 wide (x -2.28..-1.72), 4.05 long, top **0.46** everywhere.
Customer side -x, cashier side +x, belt runs toward +z.

| Part | Where (world) | Numbers, colours |
|---|---|---|
| Body | x -2.28..-1.72, z -3.20..+0.85 | panels `#8d969c`, kick plate 0.08 `#3a3d42`, steel rails 0.02 high `#aab2ba` both sides of the belt |
| Belt | x -2.22..-1.86, z -3.20..-0.20 | rubber `#1d1f24`. 14 seams `#2c3038` at uneven gaps 0.18-0.42 and 22 pale scuffs `#3a3f48`, each drawn once, scroll with `len` (metres rolled). `speed` in m/s: 0.5 (opening), 1.2 after "Faster.", 2.4 at the peak. Above 1.5 m/s every mark is drawn 3 x longer along z with hard edges: this is the "blur" of panels 1 and 4, the frame stays sharp. At 2.4 m/s a mark moves 0.08 m a frame, under the smallest gap, so it never runs backward |
| Divider bar | lying on the belt, rides with it | prism 0.30 x 0.04 x 0.04, plain `#c8352b`, no letters |
| Scanner | plate x -2.28..-1.72, z -0.20..+0.30; glass centre (-1.92, 0.46, +0.05) | steel `#c9ced6`; glass 0.18 x 0.22 `#16263a` with a red cross of two lines `#ff3b2a`. `glow` 0..1.6: the lines and a halo 0.30 across `#ff3b2a` at 0.5. Peak (panel 7): glow 1.6 and 3 spark bursts 6 frames apart (fx `cel`, kind hit, palette `spark`, 0.45 m across) rising from the glass, a 2-frame camera `shake` 0.03 on each |
| Packing shelf | x -2.28..-1.72, z +0.30..+0.85 | steel `#c9ced6`, a 0.03 lip at the end: 0.55 long, the joke is that it is too short |
| Platform | x -1.70..-0.80, z -0.75..+0.65, top 0.20 | `#6f777d`. Wedge stands on it; no camera sees his legs |
| Till | a post at (-1.60, -0.62), top 0.46; box 0.26 x 0.20 x 0.24 | box `#2b2d33`, screen 0.20 x 0.14 `#16263a` toward Wedge with 3 pale bars (no glyphs) |
| Flag | NEW `miniflag`, `flag: "de"`, pole at (-1.70, -0.62), y 0.66-0.92 | pole r 0.004 `#c9ced6`; cloth 0.22 x 0.14 in the x-y plane (always faces +z), hanging toward -x (x -1.92..-1.70, y 0.775-0.915): three bands `#1d1c22` / `#d8262b` / `#f2c230` |
| Pay tray | on the shelf at (-2.02, 0.46, +0.62), shown from "Move." on | part of `centrow` (section 7) |

**Dressing**: NEW `stockrack` (1.35 wide, 0.50 deep, 3.00 tall; uprights 0.05 `#7c868c`, 4 beams at y 0.12 / 0.95 / 1.75 / 2.50 `#9aa3a8`;
2-3 cardboard boxes per level, 0.40-0.60 wide and 0.30-0.55 high, kraft `#b98d5a` / `#a67c4c` / `#c79f6e`, tape `#d9c08a`, a BLANK white label
0.10 x 0.06 on one box in three; one box in four is cut open and shows 6 plain tops `#7f93a8` / `#e6dcc3` / `#a8504a`; one gap per unit; every box
placed once from a table). 3 units on the back wall (x -4.35..-0.30, front at z -3.70), 4 along the left wall (z -4.0..+1.4, front at x -3.80),
3 against the seam wall (z -4.10..-0.05, front at x -0.54). No signs, no price labels.

**Marks** (root x, z, yaw):

| Mark | Where | Use |
|---|---|---|
| H | (-2.72, +1.00), yaw +55 | Spud at the shelf end, body to the counter, face 3/4 to the lens (panels 1, 4, 7) |
| H5 | (-2.40, +1.30), yaw 200 | Spud's back for the over-shoulder (panel 5); placed on the cut |
| H9 | (-2.45, +1.25), yaw 135 | Spud's back, card out to Wedge (panel 9) |
| W | (-1.30, y 0.20, -0.05), yaw -65 | Wedge, scanning. Right hand sweeps x -1.95..-1.85 over the glass at 4 Hz (panels 1, 4), 6 Hz (panel 7); it never grabs an item |
| W12 | (-1.42, y 0.20, +0.35), yaw -40, leaning 10 deg | Wedge at the tray, both hands folded on the counter edge, smile curve 0.7 (panel 12) |
| R1 | (-3.40, -0.30), yaw +20 | Retiree in the queue, arms crossed |
| R5 | (-3.05, +0.15), yaw +10, leaning 12 deg | Retiree leaning in (panel 5) |
| R7 | (-3.38, +0.25), yaw +30 | Retiree at the peak, head shaking 3 x, 12 deg each way |
| R12 | (-2.60, +0.50), yaw +55, upright | Retiree at the shelf; Spud has been shouldered out to (-3.30, +1.60) |
| Q2, Q3 | (-3.30, -1.55), (-3.15, -2.75) | 2 `streetpotato` behind the retiree: coat `#5f6b78` h 0.95 hat 1; coat `#6b6257` h 1.05 |
| Tote | floor (-2.40, 0, +1.48) | Spud's own bag (section 7); panel 7: his right boot pushes a tin into it while both hands stuff the armful |

Goods ride the belt as props tweened in step with `len`, along x -1.95. At the glass each one is thrown (physics, never tweened) from
(-1.95, 0.50, +0.55) to Spud's arms at (-2.30, 0.48, +1.05), flight 0.30 s at speed 1.2, 0.18 s at 2.4; on arrival it is hidden and the armful's
`n` goes up one with a 3-frame bounce (section 7). Nobody catches a flying prop in a hand except the egg carton of panel 4. At the peak 5
goods overshoot on arcs to y 1.5 and land on the floor at z +1.6..+2.4.

## 3. AMERICAN LANE (x > 0): warm, bright, slow

NEW `baglane`, origin (+2.00, 0, 0); 0.56 wide (x 1.72..2.28), z -3.00..+0.90, top **0.46**. Customer side -x, bagger side +x.

| Part | Where (world) | Numbers, colours |
|---|---|---|
| Body | x 1.72..2.28, z -3.00..+0.90 | laminate top `#e6dcc8`, body `#c2a878`, a bumper strip 0.05 `#c8452e` at y 0.30, kick plate `#6b4a2b` |
| Belt stub | z -3.00..-1.90 | `#2b2d33`, `speed` 0.08 m/s all film (it barely moves) |
| Bagging top | z -1.90..+0.90 | plain; the bag row stands on it |
| Till | a pedestal at (2.60, +0.98), 0.26 x 0.46 x 0.24, the same till box on it | pedestal `#c2a878`, box `#2b2d33` |
| Flag | `miniflag`, `flag: "us"`, pole at (2.70, +0.98), cloth toward -x (x 2.48..2.70, y 0.775-0.915) | 7 red `#c8312f` and 6 white `#f7f4ea` stripes, canton 0.088 x 0.075 `#2b3f8a` with 9 white dots r 0.004 (3 x 3) |

**Dressing**: NEW `candyrack` (1.20 wide, 0.36 deep, 1.60 tall; white wire `#e9e4d8`; 5 tiers at y 0.25 / 0.55 / 0.85 / 1.15 / 1.42 tipped 12 deg; 6-8
facings a tier, each a row of plain blocks 0.10 x 0.035 x 0.16 in ONE colour with one lighter band, from `#e0473a`, `#ffcf2e`, `#3f8fd0`, `#6cbf3a`,
`#f29bb5`, `#8c5a86`; a plain header strip `#c8452e`; no letters, no price tags). 4 units on the seam wall (z -4.0..+0.8, front at x 0.40); 3
units with `tiers: 8, h: 2.40` across the back wall (x 0.45..4.05, front at z -3.84); one at `scale: 0.6` (gum) against the counter's customer
side at z -2.6..-1.9.

**Marks**:

| Mark | Where | Use |
|---|---|---|
| HU | (1.30, +0.85), yaw +80 | Spud in profile at the counter, cash roll in his counter-side hand at y 0.52 (panel 3) |
| H6 | (1.36, -0.20), yaw +75, leaning 8 deg | Spud, both forearms folded on the counter edge, lids 0.5 (panel 6) |
| H8 | (1.25, +0.95), yaw +10 | Spud in the heap's pocket (panel 8) |
| H10 | (1.45, +1.30), yaw 140 | Spud's back, cash roll out to Mash (panel 10) |
| M | (2.62, +0.30), yaw -60 | Mash. Panel 3: grape in his right hand at (2.12, 0.90, +0.55), beside his face on the lens's left, then down into bag 1. Panel 6: leaning 25 deg on the counter, cheek in his left hand. Panel 10: yaw -35, leaning 10 deg to the roll, brows up |
| M8 | (2.20, +1.45), yaw -35 | Mash in front of the heap, left arm out to Spud, open hand (panel 8) |
| U1, U2 | (0.85, -0.70), (0.90, -1.90) | 2 `streetpotato` in the queue: hoodie `#e0473a` h 0.90; dress `#3f8fd0` h 1.00 bag 1. They stand left of x 0.95 so cam 06 does not see them |

**The number that keeps growing: the bags.** One (panel 3), ten (panel 6), a mountain (panel 8).

- **Bag**: `shopbag` reused, `w: 0.24, h: 0.26, d: 0.15, color: "#b98d5a", rope: "#8a6a3c"`, plus one opt-in key `open: true`: a dark inset `#5e4526`
  0.012 inside the top rim so the top reads as an opening. Top at y 0.72 on the counter.
- **Row of ten** (panel 6): at x 2.06, z = +0.72 - 0.27 i (i = 0..9, last at -1.71), each turned a different -8..+8 deg. One thing stands in each,
  its top 0.08-0.12 over the rim, nearest first: `grape` (not seen: the joke), `apple`, `loaf` (upright), `egg`, `milkcarton`, `cheesewedge`, `tin`
  (scale 1.4), `yogurtcup`, `cinnabun`, `candy` (scale 2). Bag i appears on the cut after Mash's hand leaves it; nothing is carried in a hand
  except the grape.
- **Mountain** (panel 8): NEW `bagheap` at (1.86, 0, -1.22), front +z: 2.88 wide (x 0.42..3.30), 2.15 deep (z -2.30..-0.15), **3.30** tall
  against a 3.40 ceiling. About 240 instanced bags of the row's size, +-8 %, each leaning under 12 deg with a hashed turn, tint +-5 %; rows
  laid as `bagmountain` lays its sacks, scaled to this footprint. `grow` 0..1: rows appear from the floor up (0.25 on the cut after panel 6,
  0.6 by "how's your mom", 1 on the cut to panel 8). `pocket: { x: 1.25, z: 0.95, r: 0.50, h: 0.50 }`: 16 loose bags ring that spot, tops at
  y 0.50 (under Spud's mouth at 0.54, his arms on top), none inside r 0.50. The row of ten is hidden while `grow` is 1.
- **`bagmountain` does not fit**: it is 230 cream money sacks with tied necks and rope (`#d9c9a3`), 4.4 wide, and sheds banknotes; panels 6 and 8
  must show the same square paper bag. Its row layout is the right pile and is what `bagheap` copies.

## 4. THE SEAM (panel 11): who stands where

The exit zone in front of both lanes (z +0.9..+3.5) is empty all film; the ten starers are shown on the cut to 11 and hidden after it.
Spud at **S11 (0, +3.15)**, yaw 0, in front of the fin, armful `n` 6, leaf drooping 40 deg, eyes down then up at the lens.

| Row | German side (x < 0) | American side (x > 0) |
|---|---|---|
| A, z +2.10 | the retiree at (-0.58), arms crossed, yaw +8 | `streetpotato` (0.58), h 0.85, hoodie `#e0473a`, hat 1 |
| B, z +1.55 | (-0.24) h 1.05 coat `#5f6b78`; (-0.84) h 0.95 coat `#6b6257` hat 1 | (0.24) h 1.05 dress `#3f8fd0`; (0.84) h 0.95 hoodie `#ffcf2e` |
| C, z +1.00 | (-0.50) h 1.10 suit `#4f5a52`; (-0.86) h 1.00 coat `#7a6f66` bag 1 | (0.50) h 1.10 suit `#2b3f8a`; (0.86) h 1.00 dress `#f29bb5` bag 1 |

All `streetpotato`, `skin: "#f9b75c"`, turned to face S11, `angry` 0.45 on the German side (brows in, flat mouth, no raised arm: stay under
0.5) and 0.30 on the American side. Each row is 0.55 m behind the last and reads one head higher in the frame (eyes rows 1197, about 1090,
about 930). Behind them: stock racks left of the fin, candy racks right of it.

## 5. THE RETIREE: `characters/potatobrawl/retiree.json`

A variant file like `chip-old.json`, not the cast `scale` key (scale would shrink the gloves). Copy `chip-old.json`; change only these.

| Key | `chip-old.json` | Retiree |
|---|---|---|
| body | 0.53 x 0.57 x 0.52, lump 0.03 | **0.69 x 0.74 x 0.68** (Chip's ball x 1.30), lump 0.045, seed 41, taper 0.02. Stands 0.83 = 0.81 of Spud, a ball beside Spud's egg. At Chip's 0.67 his eyes (0.45) are under the 0.46 counter and he cannot reach the tray |
| skin | `#e2a95c` | unchanged; age lines `#6e5236` and spots `#c79a63` as built |
| limbs | `#734d2e` | `#5a4030` (brown trousers and shoes, as drawn; no white trainers) |
| face | brow `#f1eee6` | brow `#b9b4aa` (grey), browShape thick 1.1; resting lids 0.35 |
| sprout | two leaves, size 1.25 | placement "none": the cap covers them (sheet: no leaf) |
| costume type | `chip` (yellow hoodie) | `spud` with `age: "old"`: its sweater, cardigan and round wire glasses are already built for that type |
| sweater | - | `#6f6457` (the dark layer under the cardigan) |
| cardigan | none | `#d6c39c` beige; opt-in `knit: "cable"`: 6 cable columns per front panel, each 0.035 wide crossing every 0.05, shade `#bfa97f`, drawn once. Buttons `#7a5a34`. If cable is late: the built rib knit in the same beige |
| glasses | false | on (the built gold wire `#8a6a2a`), all film |
| brows, oldBeard, dust | 1, 1, 1 | all off |
| watch | - | opt-in `watch: "L"`: strap `#6b4423` 0.022 wide round the LEFT wrist between cuff and glove, steel case r 0.038 x 0.012 `#c9ced6`, dial `#f7f4ea`, 12 ticks, two hands `#2b2f3a`, no numerals |
| tts | chip | `retiree` |

- **Cap**: the tweed eight-panel cap of `props-score-small.js` (stiff peak 0.24 wide, 0.105 long), worn, `color: "#75695a"`,
  `fit: { H: 0.69, W: 0.74, D: 0.68, taper: 0.02, legH: 0.14 }`. The name `flatcap` draws the soft black cap of `props-spree.js` today, with no
  colour key, so the tweed one needs its own name: **`tweedcap`**. Two grey temple tufts `#b9b4aa` (3 locks each, 0.05 long) under the band; cut
  these first if time is short.
- **Acting**: lean 8 deg, walk 0.6; sigh = body up 0.03 over 10 frames, down over 20, lids to 0.6, pupils up; the watch tap = right index on the
  dial 3 x at 3 Hz, left wrist at (0.42 high, in front of his chest, under his mouth).

## 6. Mash and Wedge (cast files unchanged)

- **Mash**: `mash.json` + the worn prop `apron` with three opt-in keys: `color: "#3f8a3a"` (plain, no stripes), `bib: { top: 0.60, w: 0.24 }`
  (the bib stops 0.10 under his mouth at 0.70: it never covers the face), `straps: true` (two 0.03 straps from the bib's corners over the
  shoulders to y 0.98, under the headphone cups). Waistband y 0.46, hem 0.20, rx 0.29, rz 0.27, arc 140, one pocket 0.16 x 0.10 `#35762f` at
  y 0.36. Headphones stay round his neck. Smile curve 0.6 all film; he blinks slowly (12 frames).
- **Wedge**: stands on the lane's platform. Lids 0, no blink until "Take your time." (then one slow blink and smile curve 0.7). Shades on top of
  his head as always.

## 7. Hand props (sizes are the size used on screen)

| Prop | Kind | Numbers |
|---|---|---|
| Bank card, in the hand | `paycard` reused, `scale: 2.2` (0.119 x 0.189) | opt-in `color: "#2f62c4"` (the sheet's blue; black stays the default). Panel 9: Spud's right hand at (-1.92, 0.70, +0.75), the card's face to him and to the lens behind him (story.md: cards face the holder): turn the library hold 180 deg |
| Bank card, in his teeth | a second `paycard`, `scale: 1.6` (0.086 x 0.138), worn on Spud | lying flat, long side across the mouth at y 0.54, 0.05 of it in front of the lips. Tips +-6 deg on each syllable of "Survives... WHAT?"; mouth `open` at most 0.1 while it is centred. In 04 it sits in his left mouth corner, tipped 20 deg, so the mouth opens to 0.5 for "My EGGS!" (the sheet leaves it out of panel 4; it stays for continuity). Panels 1, 4, 7, cam 13; hidden on the cut to 09, where the hand card shows |
| Cash roll | NEW `cashroll`, `scale: 1.4` (dia 0.126, 0.154 tall) | built r 0.045 x 0.11: the money props' note green `#7fae6a`, edge `#4f7f4a`, one rubber band `#c8372f` 0.008 wide, a drawn 5-turn spiral on top, the free edge lifted 0.01. Mug hold. Fallback: one `banknote` at scale 1.3 in the thin pinch |
| Egg carton | NEW `eggcarton`, 0.26 x 0.11 x 0.075 | 2 x 5 cups, pulp `#b9b3a6`, shade `#8f897c`. `rattle` 0..1: the lid lifts 20 deg, two eggs `#f6ead6` hop 0.02 and settle. Lands on Spud's flat left palm (shape `carry`) at chest height beside his face, never in front of it |
| Milk carton | NEW `milkcarton`, 0.10 x 0.10 x 0.24 | gable from 0.19; white `#f7f4ea`, band and gable `#3f8fd0`, three cow blotches `#2b2f3a`; no letters |
| Bread | `loaf` reused as built (0.34 x 0.11 x 0.095) | |
| Grape | NEW `grape`, 0.084 x 0.10 | `#9fc24a`, highlight `#dff0a8`, stem 0.015 `#6b4a2b`. Pinch. Drawn large on the sheet; a real 0.02 grape is 14 px |
| Cheese | NEW `cheesewedge`, 0.13 x 0.09 x 0.07 | `#f2c230`, rind `#e09a2a`, 5 holes `#d9a51e` (`cheese` in the engine is the pizza cheese string) |
| Tomatoes | inside the armful only | clear tub 0.16 x 0.11 x 0.07, four tomatoes r 0.035 `#d8452e`, green stars `#4f8a3c` |
| Armful | NEW `groceryarmful`, 0.52 x 0.36 x 0.24 at `n` 6 | one rigid cluster in both arms (the box hold, as `kindlingarmful`), bottom at y 0.13, top 0.49 (under his mouth), the loaf's tip to 0.62 beside his face. `n` 0..6 pops in: lettuce (r 0.09 `#8fc24a`, frills `#6fb23a`), tomato tub, milk carton, cheese, loaf, tin + yogurt. `n` 2 at frame 0, 4 by panel 4, 6 from panel 7 on. Hidden in 05 and 09 (his back hides it; both hands are free for the card) |
| Belt goods | `tin` (scale 1.4), `yogurtcup`, `loaf`, `milkcarton`, `cheesewedge` | 9 on the belt at a time, 0.30-0.45 apart |
| Spud's tote | `shopbag` reused: `w 0.34, h 0.30, d 0.16, color "#e6dcc3", rope "#e6dcc3", open: true` | opt-in `mark: "leaf"`: one drawn leaf `#5aa334`, 0.09, on the front. German side only: he brought his own bag |
| Copper coins | NEW `centrow` | a rubber pay tray 0.40 x 0.22 `#1d1c22`, tipped 15 deg toward the lens. `count` 0..12: coin i (r 0.028 x 0.004, copper `#b5673a`, rim `#8a4a26`, glint `#e8a878`) appears under his fingertip as it lifts, pitch 0.06, a wavy row, scale 1.3 -> 1 in 3 frames. No coin travels in a hand. 0 -> 3 on "One cent. Two cent. Three cent...", 4 under "Take your time." (`coin` and `coins` are gold, r 0.085) |
| Coin purse | NEW `clasppurse`, 0.13 x 0.10 x 0.06 | leather `#7a4a26`, brass frame `#b08a3a`, two ball clasps r 0.008, lining `#4e2c14`, 6 coin rims inside. `open` 0..1 (the frame parts 50 deg). Planted from line 5: tucked in his crossed left arm (worn, no hand hold); on the shelf at (-2.20, 0.46, +0.42), open, in panel 12. Fallback: `pouch` reused |

Through hands: card, cash roll, egg carton, armful, grape = 5. Everything else is worn, thrown or already lying there.

## 8. New, reused, opt-in keys

- **New kinds (16)**: `shophall`, `discountlane`, `baglane`, `stockrack`, `candyrack`, `miniflag`, `bagheap`, `cashroll`, `eggcarton`, `milkcarton`,
  `grape`, `cheesewedge`, `groceryarmful`, `centrow`, `clasppurse`, `tweedcap` (existing code, new name). One new cast file: `retiree.json`.
- **Reused as built**: `shopbag`, `paycard`, `loaf`, `tin`, `yogurtcup`, `apple`, `egg`, `cinnabun`, `candy`, `pendant`, `lightpool`, `streetpotato`
  (13: 4 in the queues, 9 at the seam), `apron`; fx `cel` hit with the `spark` palette; `grade` and `split`; `spud.json`, `wedge.json`, `mash.json`.
- **One opt-in key each, defaults unchanged**: `shopbag` `open`, `mark`; `paycard` `color`; `apron` `color`, `bib`, `straps`; the `spud`
  costume's cardigan `knit`; `watch` on the aged costume.
- **Cut first if the build runs late**, in this order: temple tufts, tote leaf, cable knit (rib stays), `clasppurse` (use `pouch`), `cashroll`
  (use `banknote`), the gum rack, queue shoppers Q3 and U2.

## 9. Departures from the sheet, each with its reason

1. **No sweat drops, shock lines or spiral** (panels 1, 3, 4, 6, 7, 9): story.md bans reaction symbols; faces and acting carry it.
2. **No blurred belt or hand** (1, 4, 7): the whole frame stays sharp; speed reads from stretched belt marks, goods and the 4-6 Hz sweep.
3. **Panel 11**: the shoppers are potatoes (9 `streetpotato` and the retiree). They stand in the exit zone in front of the lanes, not in
   the aisles: the German aisle is 2.3 m left of the seam and a 9:16 frame is 1.6 m wide there.
4. **Panel 9**: the retiree is not in the two-shot. The aisle is 1.4 m left of Wedge's face, and the frame that holds his face and the
   card is 1.1 m wide there. His gasp is its own 0.7 s shot (cam 14), both hands on his cheeks.
5. **Panel 6**: seen down the row from above, bags stacked up the frame, Spud and Mash either side; the drawn diagonal needs a frame
   2 m wide.
6. **Panel 12**: camera 9 deg down so the coins read; a tipped pay tray is added (flat coins are 6 px slivers from the drawn height); the
   flag is behind Wedge's shoulder; the retiree stays upright so his cap does not hide his eyes.
7. **Panel 5**: he wears his glasses (drawn only in panel 12).
8. **The retiree is 0.83 tall**, as drawn, not Chip's 0.67.
9. **Wedge stands on a 0.20 platform**: on the floor the till and flag (to y 0.92) cover his eyes (0.73).
10. **Flags** are 0.22 x 0.14, about twice true scale, so they read at 80-190 px.
11. **Panel 3**: the grape is beside Mash's face, not over the bag, until he lowers it (held props stay off faces).

## Open questions (the default is built)

1. Retiree 0.83 tall (as drawn) or Chip's canon 0.67 on a step? **Default: 0.83.**
2. Wedge standing on a platform, or seated on a stool (German cashiers sit)? **Default: platform**; his legs are never in frame.
3. Panel 9 without the retiree, his gasp as a separate shot? **Default: yes.**
4. Panel 11 as one camera on a real seam wall with a grade split, shoppers in the exit zone? **Default: yes.**
5. Clasp purse as drawn (new) or the built drawstring `pouch`? **Default: clasp purse.**
6. Card blue as drawn or the built black? **Default: blue.**
7. Glasses all film or only for counting? **Default: all film** (no hand prop).
8. Pay tray under the coins (not on the sheet)? **Default: yes.**
9. Spud's own tote on the German side (panel 7 draws it; the brief's prop list does not)? **Default: yes.**
