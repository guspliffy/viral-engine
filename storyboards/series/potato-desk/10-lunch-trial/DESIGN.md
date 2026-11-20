# Potato Desk 10 — Lunch Trial: design

Creative director, 20 Nov 2026. Target look: `/mnt/project-files/videos/potato-desk/10-lunch-trial/sheets/lunch-trial-sheet-1.png` (panels 01–12). Beats: STORY.md "Beat outline v1". Projected pixels below are computed, not rendered: fit every camera with `qa/camfit.mjs`.

Build for 1080 × 1920 at 30 fps. World axes are +x right, +y up, +z toward camera. Dimensions are W × H × D in metres; positions are mesh centres unless marked feet, top, base, hinge or grip. Crown heights standing (0.14 m legs): Chip 0.67, Spud 1.02, Wedge 1.12, Mash 1.38. Furniture is human-size as drawn: the worktop is at Spud's mouth, the fridge towers. Whole frame sharp.

**Colour rule.** Saturated red belongs to the sauce only, `#D8321F` (box smears, collar stain, BOSS pasta): no red ink, pins, mugs or phone cases. **Lettering:** the two box labels only; notes, flyers, ID cards, clock, microwave carry scribbles, bars and pictograms.

## 0. What is fixed against the sheet

| # | Sheet | Design |
| --- | --- | --- |
| 1 | Clock hands read neither 8:55 nor 8:59 | 8:55 for 0–16.0 s, 8:59 from the cut at 16.0 s (section 4). |
| 2 | Mug held low, the clean collar in view above it (02–09) | One big mug pressed on the collar's V in his right hand for 0–21.0 s; the splash is sized to its shadow (5.3, 6). |
| 3 | Panel 11: pizza sliding down the jacket | A tomato-sauce splash 0.12 × 0.125 on the cream collar (5.3). |
| 4 | Panel 10: bare hands | Lemon-yellow rubber gloves on Spud from 19.0 s to the end (5.2). |
| 5 | Notes stay in view above an open fridge (01, 09–12) | Two-door fridge: the freezer door on top stays shut with its notes; only the lower door opens (3). |
| 6 | Right edge is blinds in 01–11, a door in 12 | Window sliver on the back wall; a door leaf hinged at the right wall that swings into frame only when the boss leaves (2). |
| 7 | Mug changes hand between 02 and 09 | Mug stays in his right hand (screen-left); his left points at the clock, at Spud, and presses the pocket. |
| 8 | Panel 01: Chip cut at the waist | Chip whole, 2.4 m downstage, at 1.45 × the back row's scale. |

## 1. Stage and cameras

Stage x −1.80..+1.80, back wall face z −1.30, ceiling y 2.60. No left wall, no right wall (both planes are outside every frame); the front is open except the panel-03 flat.

- **Wide A (panels 01, 05, 08, 09, 11 start, 12).** Camera (0.00, 2.05, 7.60), look at (0.00, 0.90, 0.00), vertical FOV 34°. About 401 px/m at z 0, 350 px/m at the back wall; frame half-width 1.33 m at z 0, 1.44 at z −0.65, 1.54 at the wall. Rows: ceiling join 285, clock 421–621, cork board 539–738, fridge top 601, worktop 906–936, floor join 1245. Captions: rows 210–410 over the ceiling join and plain wall, nothing else lives there. Lock it for every wide.
- **Wide A2 (panel 10).** Same camera slid to x −0.30: (−0.30, 2.05, 7.60), look at (−0.30, 0.90, 0.00). Whole fridge in, Wedge out, clock still in and touching the right edge.
- **Panel 02 medium.** Camera (1.65, 1.30, 3.40), look at (0.85, 1.17, −0.52), FOV 30°. Wedge's eyes near (452, 1318), body cut by the left edge as drawn; clock centre near (728, 338), Ø about 420 px (39 % of the width, as drawn); his left fingertip near (612, 841). Caption left of the clock (x 40–500, rows 220–430) or under it (rows 570–700).
- **Panel 03, inside the fridge.** Camera (−1.30, 0.70, −1.17) on the lower shelf, look at (−0.92, 0.87, +0.79), FOV 58°. Chip low centre, Spud cut by the left edge, Mash high right and cut by the right edge; mould boxes M1 and M2 rise into the bottom corners, the upper shelf's chrome lip crosses near row 190, window W2 behind them.
- Until 21.0 s every camera sees Wedge from between 5° on his right and 30° on his left, from above mug height (camera y ≥ 0.9), and his body never turns toward screen-right (section 6).

## 2. Set

| Piece | Kind | Geometry, position and finish |
| --- | --- | --- |
| Back wall | `officewall` | 4.40 × 2.60 at (0, 0, −1.30). Dado, wall and top band all `#B7C4B8`, rails `#AEBBAF` (pale green-grey, one flat colour as drawn). |
| Floor | `checkerfloor` if it takes two colours (today fixed black and cream), else new `carpettiles` | 4.40 × 0.004 × 5.10, x −2.20..+2.20, z −1.30..+3.80. Tiles 0.50, `#6E7680` / `#666E78`, seams 0.006 `#5A616A`, matte, short-pile speckle drawn once. |
| Ceiling | new `ceilingtiles` | 4.40 × 5.60 at y 2.60, z −1.30..+4.30. Tiles 0.60 `#E3E6DE`, T-bars 0.02 `#CDD1C8`. One light panel 0.60 × 1.20 `#FDFDF4` emissive at x 0, z +1.80..+3.00 (wide rows 94–176, above the captions). Not solid. |
| Counter | `kitchencounter` | w 2.58, d 0.55, h 0.86 at (+0.51, 0, −1.025): x −0.78..+1.80, 6 doors. Changes: worktop `#A4A9AB`, carcass `#6C747B`, door panels `#78818A`, pulls `#C9CED2`, plinth 0.10 `#4A5056`; no moka pot, radio or spoon jar. |
| Sink | new `kitchensink` | Steel basin 0.42 × 0.30, rim 0.012 proud `#C5CAD0`, floor 0.11 below the worktop, at (−0.41, 0.86, −1.02); if the worktop can't be cut, a 0.012 tray. Gooseneck tap `#D8DDE3` Ø0.022, 0.24 high at (−0.41, 0.86, −1.21), spout 0.14 toward +z, lever on its right. Five `teamug`: three stacked in the basin (rims 0.03–0.07 above the worktop: `#F4F1EA`, `#8FB1C5`, `#F4F1EA`), one on its side on the rim, one `#9DB7A0` upright at (−0.12, 0.86, −0.98) with a brown ring inside. Sponge 0.09 × 0.03 × 0.06 `#F2D94A` on `#4E9A5A` at the tap's foot. |
| Microwave | new `microwave` | 0.46 × 0.27 × 0.34, base on the worktop at (+0.24, 0.86, −1.07). Body `#D9DCDD`, door glass 0.27 × 0.19 `#2A2F33` with a dot mesh, bar handle `#B9BEC4`, control strip 0.10 wide `#C5C9CB`: dial r 0.022, 3 buttons, dark display `#1D2A22` with one green dot `#7CE08A`. |
| Coffee machine | new `beanmachine` | 0.34 × 0.50 × 0.42, base at (+0.79, 0.86, −1.05). Brushed steel `#B9BEC4`; black front 0.26 × 0.18 `#24262B` with 4 round buttons r 0.014 (two lit `#7FD0FF`) and a blank screen bar; two chrome spouts over a 0.20 × 0.17 bay; drip-tray grille 0.26 × 0.03 × 0.14 `#2B2D31`, 0.05 proud; smoked bean hopper 0.20 × 0.11 × 0.18 `#5A4A3C` at 60 % with beans `#3B2418` and a black lid, top y 1.47 (shows over Wedge's head). One white `teamug` under the spouts. |
| Cork board | new `corkboard` | 0.80 × 0.56 × 0.03 at (−0.40, 1.62, −1.285). Frame 0.03 `#C9A878`, cork `#B98A56` speckled once. Pinned: escape plan (grey floor plan, green running figure and arrow) 0.21 × 0.30; rota grid 5 × 4 with cells `#8FB1C5`, `#F2C94C`, `#A9CFA4` 0.24 × 0.18; flyer `#F6E27A` with a cake drawing and 6 tear-off tabs, 2 gone, 0.16 × 0.24; memo with a blue header and 6 grey bars `#B5B0A4`, 6° crooked, 0.15 × 0.21; team photo of 4 potato silhouettes 0.14 × 0.10; 5 sticky notes (3 `#FDF3A6`, 2 `#F9C9D6`) over the sheets; 9 pins r 0.009 in `#2F6FB5`, `#F2C94C`, `#4E9A5A`; one corner curled 0.03. |
| Window | new `blindwindow`, two instances | W1 opening 0.50 × 1.05, x +1.30..+1.80, y 1.10..2.15 on the back wall: a 0.24 m sliver in the wide, as drawn. W2 1.40 × 1.05 centred (−0.90, 1.625) on the flat. Frame 0.045 `#E9EBE6`, sill 0.06. Emissive sky behind, `#FFF3CF` down to `#FFE2A6`. Slats `#F4F4EF` every 0.035, 0.03 deep, tilted 35° (0.012 bright gaps), full height; bottom rail 0.015 lower at its left end, one slat kinked 8° over 0.12, pull cord 0.50 with a bead. |
| Panel-03 flat | `officewall` | 3.40 × 2.60 at (−0.25, 0, +3.80), facing −z, same colours, carrying W2. Shown 3.0–5.0 s only. |
| Kitchen door | `frontdoor` | Leaf 0.85 × 1.95, hinge at (1.80, 0, −0.55), spec.angle 90. Shut, it lies along +z in the right wall's plane: edge-on and off frame. Open, the leaf stands along −x with its face to camera, x 0.95..1.80; 0.95..1.45 is in the wide (about 175 × 680 px). Wood `#9A6A3E`, flush if the panels can go, steel lever at y 0.70 and 0.07 from the free edge, closer box 0.24 × 0.05 × 0.045 `#7D8389` at the top hinge corner, kick plate 0.20 `#AAB0B5`. `open` 0 → 1 at 25.2–25.6 s, hold to 25.9, 1 → 0 by 27.6 with a slow last 15°, `latch` at 27.6. Wedge is past x 1.45 before he touches it: no hand-on-door contact on screen. |
| Light | — | Key `#FFF1D6` from upper right front, fill `#DCE6EE` from the left. Optional: 8 warm bars `#FFF0C2` at 22 % on the floor at (+1.25, 0.002, −0.35), 0.55 × 0.90, skewed 20°. |

Not used: `stickynote` (it writes spec.text as letters) and `iounote` (it writes IOU); every note here is drawn on the fridge or the board.

## 3. Fridge (`ioufridge`, panels 01, 03, 05–12)

Origin (−1.30, 0, −0.975), front to +z: x −1.80..−0.80, front face z −0.65. The wide shows x −1.44..−0.80 of it (cols 0–234).

- **Spec numbers that change:** w 1.00 (Spud is 0.76 wide and must fit the 0.90 opening), h 1.75, color `#F2F3EF`, handle [0.42, 0.82] (Chip reaches it). `fall`, `drop` and the paper heap stay at 0.
- **New on the prop:** corner radius 0.04 (was 0.11), no chrome badge. A split at y 1.22: the freezer door above it never opens and has its own handle [1.30, 1.52]; `open` swings only the lower door. Use `open` 0.86 = 90°: the leaf then stands along +z at x −1.79, z −0.65..+0.33, off frame in wide A and a 0.15 m white sliver in A2. Its sweep is 0.98 m round (−1.79, −0.65): nobody stands inside it while it moves.
- **Notes:** scattered, not feathered: 34 on the lower door, densest at y 0.25–1.05 and round the handle, 12 on the freezer door, 8 on the right side; about 45 % of the white shows. Size 0.15. Paper 55 % `#FDF3A6`, 30 % `#F9C9D6`, 15 % aged `#EFE2A0`; one in five curls; tilt ±12°, freezer notes ±20°. Eight scribble hands, each drawn once: three wavy lines; two lines and a double underline; a frowning face and one line; a down arrow and a scribble; a crossed-out fork; an angry zigzag; one short line; a lunch box with a cross. Ink 60 % `#2C4A9A`, 40 % `#1F1F22`, stroke 0.006. No letters, digits or punctuation.
- **Inside** (replaces eggs, lettuce and jars): compartment x −1.75..−0.85, y 0.18..1.16, z −1.235..−0.73, lining `#EEF3E6`, cold light strip as built. Two glass shelves with tops at y 0.50 and 0.86, only 0.30 deep at the back (z ≤ −0.935), so Spud's front fits in the mouth.

| Item | Base at | Build |
| --- | --- | --- |
| M1 | (−1.55, 0.50, −1.05) | Clear box 0.30 × 0.14 × 0.20, lid lifted 12° by a mould dome 0.04 high, 70 % furred. |
| M2 | (−1.02, 0.50, −1.05) | Open tub 0.22 × 0.12 × 0.20, old curry `#B5702C`, 3 blue-green islands `#6F9C8C`, white bloom. |
| M5 | (−1.28, 0.50, −1.02) | A `yogurtcup` with its foil domed 0.012 and one green spot: the brand Spud is eating. |
| M3 | (−1.58, 0.86, −1.06) | Glass jar Ø0.11 × 0.17, lid `#B9BEC4`, murky `#B9762E` with 3 pale lumps. |
| M6 | (−1.08, 0.86, −1.06) | Plate Ø0.20 with one furry lump 0.14 × 0.09 × 0.12. |
| M4 | (−1.56, 0.18, −1.05) | Foil parcel 0.16 × 0.09 × 0.12 `#B9BEC4`, one corner open on `#3F4F3A`. |
| BOSS box | (−1.07, 0.18, −1.06) | Lid on, label to +z: the one clean thing, in view from frame 0 (wide rows about 1130–1189), at Chip's belly height. |

- **Mould:** base `#8FA07A`, fuzz tufts 0.012–0.03 `#B9C7A6` with 0.008 fibre cards so the outline is hairy, dark spots `#4F6B4A`, white bloom `#E8EADF`; every patch placed once.
- **Haze:** four `gas`, color `#B7D36A`, n 3, len 0.35, w 0.04, `puff` 0.6, `fade` 0.45, at the tops of M1, M2, M6 and at (−1.30, 0.20, −0.75); `puff` 0 → 0.6 over 0.5 s as the door opens, 0 when shut. Panel 03 adds one at (−1.30, 0.55, −0.90).
- **Door by beat** (panels 01–04 open, 05–08 shut, 09–12 open): open 0.0–4.7 s; Spud pushes it shut 4.7–5.0 as they recoil; Chip pulls the handle 15.6–16.0; open to the end.

## 4. Wall clock (`wallclock`, panels 01, 02, 04–12)

Centre (+0.95, 1.96, −1.28), spec.r 0.28: above the coffee machine and straight over Wedge's mark. Wide: cols 779–979, rows 421–621, Ø200 px (67 px at 360 px viewing width), 170 px clear above his leaf.

| | Hour hand | Minute hand |
| --- | --- | --- |
| 8:55 (0–16.0 s) | 267.5° | 330° (on the 11 tick) |
| 8:59 (from 16.0 s) | 269.5° | 354° (6° short of straight up) |

Angles run clockwise from 12. Today the hands are fixed at about 4:55: the prop needs a time. Hour hand 0.154 long × 0.034 wide, minute hand 0.218 × 0.024 (today 0.014 and 0.009, 1 px on a phone), centre cap r 0.02. Quarter ticks 0.020 × 0.060, the others 0.012 × 0.036. Dial `#F7F5EE`, rim and ink as built. The change happens on the cut at 16.0 s; the minute tip travels 32 px in the wide.

## 5. Worn pieces

**5.1 Lanyard + ID card, all four, 0.0 s to the end (every panel).** Flat ribbon 0.018 wide `#2F6FB5`, out from under the collar or cowl on both sides of the neck, meeting in a V at a steel clip 0.018 × 0.022 `#B9BEC4`. Card 0.085 × 0.115 × 0.004 `#FBF6EA`, 0.006 off the cloth: blue header band 0.022, photo box 0.034 × 0.042 `#D9D2C0` holding the wearer's silhouette in their own garment colour, two grey bars `#B5B0A4` 0.030 and 0.022 long. Rigid with the body.

| | Ribbon leaves the neck at | Card centre above the body's base | Tilt |
| --- | --- | --- | --- |
| Spud | ±0.11 | 0.30 | +4° |
| Chip | ±0.08 | 0.14, over the pouch | −7° |
| Mash | ±0.09, under the headphone cups | 0.50 | +2° |
| Wedge | ±0.12, under the collar rolls | 0.22: card top 0.07 below the mug | −3° |

**5.2 Rubber gloves, Spud, from the cut at 19.0 s (panels 10–12).** Lemon `#F2E12A`, glossy (Chip's hoodie is the warmer `#FFCF2E`). Each follows his three-finger glove 0.006 fatter all round; gauntlet 0.10 up the forearm over the sweater cuff, flaring to Ø0.085 with a rolled bead `#E3BB12`; one pale shine stripe along the back. At 19.0 s both gloves brace on the cabinet's front edges at (−1.77, 0.80, −0.70) and (−0.83, 0.80, −0.70): two yellow hands either side of a teal back.

**5.3 Collar stain, Wedge, there from 0.0 s, seen from 21.0 s (panel 11).** Measured from the collar's V point, the top of the zip (world y about 0.53 standing).
- Splash: centre 0.045 above the V point and 0.03 toward his right (screen-left). Footprint 0.12 wide × 0.125 high: −0.09..+0.03 across, V −0.015..V +0.11. One blot with a 7-lobed edge; three runs down, 0.015, 0.035 and 0.020 long × 0.008–0.012 wide, each ending in a bead; five satellite drops Ø0.008–0.016 within 0.02 of its upper right edge.
- Colours: body `#D8321F`, wet rim 0.004 `#A3221A`, three glints `#F0624A`, grease halo 0.008 wide `#F1B58A` at 45 % on the cream, `#8F1F17` where a run reaches red cloth, two basil flecks `#3F6B2A` 0.006 × 0.003. It lies on the rib rolls (ribs show as `#B3271B` lines), 0.0015 proud, roughness 0.25.
- Speck (the frame-0 clue, outline 1.3 s): one drop Ø0.016 with a 0.02 run, on his right collar roll 0.115 from the zip line and 0.025 above the mug's rim. 6 px in the wide, 14 px in panel 02.
- Reveal: the mug rises 0.20 to his mouth in 0.4 s; the splash is clear once the mug's base passes V +0.12. In a frame 1.3 m wide it is about 100 px across.

**5.4 Pocket glow, Wedge (panel 08).** Behind the cloth of his left flap pocket (screen-right): a rounded light 0.075 × 0.13 `#CFE9FF` at 60 % and a 0.16 halo. Two pulses at 13.4 and 13.8 s; off when his left palm lands flat on it at 14.1 s.

## 6. Hand props

| Prop | Kind | Build | Hold |
| --- | --- | --- | --- |
| Lunch box, "MINE! DO NOT EAT" (panels 01, 06, 11) | new `lunchbox` | Body 0.44 × 0.13 × 0.28, wall 0.004, corner radius 0.03, base 4 % smaller; clear `#E6F0F2` at 22 %, edges `#F4FBFC` at 60 %. Lid 0.45 × 0.03 × 0.29, milky rim band 0.012 `#DFE9EC`, a snap flap 0.10 × 0.035 on each short end; lid stays on: 0.16 high in all. Paper tape `#F6F3EA`, torn ends, blank `#E7E3D8` on its sticky side (seen through the box). Long sides: tape 0.36 × 0.105, **MINE!** caps 0.050 over **DO NOT EAT** caps 0.034, slants −3° and +4°. Short ends: tape 0.22 × 0.10, caps 0.036 and 0.022. Lid: tape 0.38 × 0.12 laid 6° off square, caps 0.055 and 0.036, MINE underlined twice. Marker `#1C1C20`, block capitals, stroke 0.009 / 0.006. Inside, empty: one swipe 0.20 × 0.07 with three clean fork-tine lines through it, two blobs Ø0.03–0.05, two smears 0.06–0.09 up one long wall and one end, `#D8321F` with dried edges `#A3221A`; one penne `#F0CF85` 0.035 × 0.012 stuck in a corner. | Both hands, one on each short-end flap at mid height. Panel 01: overhead, centre y 1.00 if his arms reach, else 0.86 in front of his sprout, tipped 25° to camera. Wide: 261 × 95 px, caps 30 and 20 px (10 and 7 px at 360 px). |
| Lunch box, "BOSS" (panel 12) | `lunchbox`, label boss, fill pasta, `lid` 1 → 0 | Same box. Tape 0.30 × 0.105 on both long sides and the lid, **BOSS** caps 0.075, stroke 0.014. Filled 0.085 deep: about 26 penne `#F2CF82`, each r 0.007 × 0.04 and placed once, in sauce `#D8321F`, heaped 0.02 in the middle, 3 basil leaves `#3F7A2E`, cheese flecks `#F6ECC4`. | Left palm under the base, a long side against his belly. Its lid stays on the fridge floor. |
| Boss mug (panels 01–11) | `teamug`, spec.scale 2.0, color `#F6F4EE`, steam 0 | Ø0.18 × 0.17. Plain white. | His right fist through the handle, handle to his right (screen-left) and 20° forward; axis upright, wall touching the collar rolls, centred on the splash: base V −0.04, rim V +0.13, below his mouth. Body yaw 0..60° toward screen-left only. |
| Yogurt (panels 01, 03, 05) | new `yogurtcup` | Top r 0.045, base r 0.035, h 0.095. White `#FBFAF4`, pink band 0.04 `#F29BB0` with 3 strawberry dots `#D8455F`, rolled rim, foil flap `#C9CED2` folded back 0.05, yogurt `#F8C9D4` 0.012 under the rim with one spoon dent. | Round its side, as `papercup`. |
| Spoon | `spoon` | Teaspoon as built; `fill` 1 tinted `#F8C9D4` if it takes a colour, else `fill` 0. | As built. |
| Takeaway cup (panels 01, 03–05) | `coffeecup`, spec.scale 1.4 | As built (potato logo, no letters): Ø0.126 × 0.16. | Round the sleeve, Mash's right hand, chest y 0.70. |
| Phones (panel 08) | `phone`, spec.scale 1.5, spec.halo 0.22 | 0.117 × 0.233. Cases: Chip `#3B3F47`, Mash `#8FB1C5`, Spud `#F1EDE2`. `glow` 0 → 1 at each ping, 0.15 s apart. | Chip: edge hold, screen to the room. Mash and Spud: low, screens to themselves. |
| Fork (panel 12) | `fork` | As built. `food`: two penne and sauce if it can; otherwise `food` 0. Never the roast potato. | Thin pinch, Chip's right hand, from his hoodie pouch at 26.3 s. |

## 7. Marks and hands

Opening marks, feet (x, z), wide A:

| | Feet | Facing | Eyes (x, row) | Holds |
| --- | --- | --- | --- | --- |
| Chip | (+0.15, +2.40) | camera | (628, 1424), feet row 1680 | Box overhead: cols 498–759, rows 1067–1161, under every back-row face and cup. |
| Spud | (−0.42, +0.25) | 15° toward Chip | (363, 1055) | Yogurt in his right hand, spoon in his left. He hides only the fridge's right 0.08 m: the lit compartment shows at cols 22–203, rows 826–1189. |
| Mash | (+0.14, −0.42) | camera | (594, 913) | Cup in his right hand. |
| Wedge | (+0.88, 0.00) | 15° toward screen-left | (899, 996) | Mug near (907, 1118), left arm down. |

Centre distances: Spud–Mash 0.87, Mash–Wedge 0.85. Other fixed spots:
- Panel 03 (3.0–4.7 s): Chip (−1.10, −0.10), Spud (−1.34, +0.60), Mash (−0.66, +0.45); all step back 0.30 at 3.6 s, clear of the door's sweep.
- Panel 10: Spud's feet (−1.30, −0.58), back to camera, leaning 12° into the mouth; Chip (−0.30, +0.55), Mash (+0.35, +0.25).
- Panel 11: Spud turns out of the mouth over his screen-right shoulder (the door is off frame left, so he peeks out of the fridge).
- 24.0 s: Wedge walks +x along z 0 and is out of frame by 24.9 s; the leaf swings in behind him.

| Prop | In hand | Rests |
| --- | --- | --- |
| MINE box | Chip 0–13.0 s and 21.0–26.0 s | Floor (−0.05, 0, +1.10), long label to camera, 13.0–21.0 s and from 26.0 s. |
| Yogurt + spoon | Spud 0–8.5 s | Worktop edge (−0.68, 0.86, −0.83), spoon standing in the cup. |
| Takeaway cup | Mash 0–13.0 s | Worktop edge (+0.02, 0.86, −0.83). |
| Phones | 13.0–16.0 s | Pockets. |
| Mug | Wedge 0–24.9 s | Leaves with him. |
| BOSS box, fork | Chip 26.0 s to the end | Fridge floor until 26.0 s. |

Every pick-up and put-down above happens on a cut.

## 8. Build order

- A, the story needs it: fridge changes and contents, clock time and hands, both lunch boxes, mug hold, stain and speck, gloves, lanyards, door leaf, phones, pocket glow, haze, panel-03 flat with W2.
- B, the panels' look: counter colours, sink and mugs, microwave, coffee machine, cork board, carpet tiles, ceiling, W1.
- C, cut first if late: floor light bars, fridge corner radius, flush door, pasta on the fork, basil flecks.

## Open questions (my default)

1. One sauce speck above the mug rim from frame 0? Default yes: the outline's 1.3 s says the stain just peeks out; the splash itself stays fully hidden.
2. Splash no bigger than the mug hides (0.12 × 0.125 behind a Ø0.18 mug)? Default yes; panel 11's size would show from frame 0.
3. Two-door fridge, 1.00 m wide? Default yes; a single door loses every door note whenever it is open (panels 01, 09–12), and at 0.70 wide Spud can't get in.
4. Fridge shut 5.0–15.6 s as panels 05–08 draw it? Default yes: Spud shuts it, Chip reopens it.
5. Empty box on the floor for 13.0–21.0 s? Default yes: Chip's hands are free for the phone and no hand-off shows.
6. Wide FOV 34° (the series used 26°)? Default 34°: it gives panel 01's big foreground Chip with his feet in frame.

Outline line to correct: at 21 s he "lowers the mug to sip"; the mug has to rise to his mouth, and rising is what uncovers the collar.

## Risks

- Clear plastic in the toon look: if the box turns muddy, use frosted `#EEF3F3` at 45 %.
- The mug hides the splash only inside the camera limits in section 1: check a still of Wedge at every beat before 21.0 s for red outside the speck.
- Panel 03 puts the lens 0.10–0.25 m from the mould boxes inside a 0.51 m deep cabinet.
- Spud in the fridge mouth has 0.07 m clearance each side of a solid shell.
- Nine hand props; three phones in one beat. Cut order if holds glitch: Spud's spoon, then Spud's phone.
- The fridge, clock and counter changes touch props other clips use.
