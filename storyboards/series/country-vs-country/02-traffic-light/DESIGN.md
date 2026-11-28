# Country vs Country 02 — Waiting at a red light, Germany vs America: design (Fable 5.2, 27 Nov 2026)

Target: the approved 12-panel sheet `traffic-sheet-1.png` beside this file (square panels: framing is a guide, the film is 9:16), the panel
texts in `sheet-prompt.txt`, the 26 lines in `lines.mjs`. New pieces only; everything else is reused and named in section 9.
Axes +x right, +y up, +z toward the camera, metres; positions are foot roots (x, z) or mesh centres (x, y, z). Yaw 0 faces +z, yaw +90
faces +x, yaw -90 faces -x. 1080 x 1920, 30 fps, fov = vertical. Captions rows 470-640, no eye above row 900. **Every pixel number below
is worked out by hand (pinhole, small-pitch) from the cast files and the positions here, nothing is rendered: fit all 19 cameras in one
`qa/camfit.mjs` batch before the first layout and move the camera, not the rule, where a number is off.**

Ground: roads at y 0, pavements and the bus island at y **0.10** (a real kerb: the toe gag needs the drop). Heights are above the feet
(legs 0.14, eyes at 0.60 of the body, mouth at 0.45); add 0.10 on a pavement.

| Who | File | Stands | Eyes | Mouth | Note |
|---|---|---|---|---|---|
| Spud, German street | `spud.json`, id `spud` | 1.02 | 0.67 | 0.54 | unchanged |
| Spud, American street | `spud.json`, id `spudus` | 1.02 | 0.67 | 0.54 | the same file under a second id, as ep 01 did; parked while the other lane plays |
| Retiree | `retiree.json` + worn `tweedcap` | 0.83, cap top 0.90 | 0.55 | 0.45 | stands on the room floor y 1.45 behind window W1, leaning 22 deg out: eyes at world y 1.96 |
| Wedge, bus driver | `wedge.json` | seated, crown 1.64 | 1.25 | 1.10 | on the bus seat (top y 0.66). No driver's cap: the wheel and the windscreen say driver, and a cap would sit on his shades |
| Mash, pickup driver | `mash.json` | seated, crown 1.66 | 1.16 | 0.98 | on the pickup seat (top y 0.42). No apron |
| Chip, jaywalker | `chip.json` | 0.67 | 0.46 | 0.38 | yellow hoodie as built |
| The kid | NEW `tot-kid.json` + NEW costume `raincoat` (section 6) | 0.60, hood top 0.64 | 0.42 | 0.35 | `tot.json` itself stands 0.94 (0.92 of Spud): not a tiny child |
| Window crowd | prop `streetpotato` with 6 opt-in keys (section 5) | 0.85-0.95 | 0.55 | | ghosts, potatoes only |

## 0. Cameras (one per panel + 7 the lines need; all sharp; every one a slow linear push from `pos` to `push to`)

German cameras look along x inside the German street; every American camera has card W, N or E behind its frame: no camera crosses the
seam or sees over it (section 1). Looking -x, frame right is -z; looking +z, frame right is -x.

| Cam | Panel | pos -> look, fov | push to | Sees (start frame) |
|---|---|---|---|---|
| 01 DE-WIDE | 1 | (-2.2, 0.60, +0.10) -> (-9.25, 1.33, +0.10), 34 | (-2.5, 0.60, +0.10) | 5.9 deg up, across the road at the block. Spud (K) 445 px/m: body x 460-798, eyes row 1209, leaf top 985, boots 1508. Retiree in W1 272 px/m: face x 384 (283-485), eyes 915, cap top 809, flower box to row 1038. Red man x 88, lens row 761, hood top 688. Flag x 667-835, rows 815-915. The white bars lie across the frame, rows 1560-1920 |
| 02 WINDOW-LOW | 2 | (-11.0, 0.70, -0.5) -> (-13.9, 2.05, +0.675), 34 | (-11.15, 0.70, -0.45) | 25 deg up from the forecourt. Retiree about 960 px/m: face x 540, eyes 1040, cap top 735. Pointing hand at (-13.3, 1.78, +0.45): x 690, row 1290, 230 px, under and beside the mouth. Lace panel blowing in rows 250-700 on the right; flower box rows 1500-1750 |
| 03 US-BUTTON | 3 | (19.8, 0.95, -2.8) -> (12.5, 1.51, +1.4), 32 | (19.5, 0.95, -2.65) | Spud (HU) a back slice x 0-142, eye x 110, row 1332. Pole x 159; button box 148 px wide, button 96 px across at row 1365; orange hand rows 646-900. The pickup passes 5-6.5 m out, 558 px/m: roof row 706, Mash's face 300 px, eyes 1063. Flag F1 x 300-480, rows 337-455. Bus stop sign x 743. Hanging heads rows 0-266 at x 450 |
| 04 KERB-TWO | 4 | (-3.6, 0.60, +0.25) -> (-9.25, 1.26, +0.25), 34 | (-3.9, 0.60, +0.25) | Spud 556 px/m: x 735 (524-946), eyes 1235, crown 1041. Kid 549 px/m: x 337 (216-458), eyes 1374, hood top 1231. Retiree watching from W1: x 412 (300-524), eyes 919. Pole x 59, red lens row 673 |
| 05 WEDGE | 5 | (-5.9, 1.30, +1.6) -> (-3.78, 1.38, -2.15), 34 | (-5.75, 1.30, +1.35) | Through the windscreen from the island. Wedge 741 px/m: face x 540 (214-866), eyes 1060, crown 771, shades 740. Watch tap at chest, row 1330. Windscreen top row 655; the blank route display fills rows 480-620 |
| 06 US-JAYWALK | 6 | (19.8, 0.95, -2.8) -> (12.3, 1.45, +1.2), 32 | (19.5, 0.95, -2.65) | Cam 03's place. Spud's slice x 0-142, his right arm up at the orange hand. Chip (CJ) 403 px/m: 230 px wide, x 560, eyes 1377, burger at his chest on the lens's right. Diner and gas station (card W) rows 700-1150 |
| 07 BINOCULARS | 7 | (-6.6, 0.95, +2.6) -> (-0.6, 2.08, +2.025), 28 | (-6.2, 0.95, +2.55) | Up 10 deg at window BW of the far block. Window 597 px wide, the lace gap 188 px, potato top 377 px, binoculars 150 px wide at x 540, row 1010 |
| 08 US-FISTS | 8 | (17.5, 0.72, -3.6) -> (16.5, 0.89, -0.10), 30 | (17.45, 0.72, -3.3) | Spud (yaw -110) 1005 px/m: face x 269, eyes 1077, crown 725. Box x 727-924: button 128 px across at row 1127, grille 89 px at row 1029. Fists on the button, 0.5 m from his face. Orange hand x 700-1040, rows 192-526 |
| 09 DE-PEAK | 9 | (-1.0, 0.25, -0.10) -> (-9.25, 2.66, -0.10), 38 | (-1.3, 0.25, -0.10) | 16 deg up from the far pavement. Spud 338 px/m: x 540 (412-668), eyes 1598, boots 1825. Kid x 298, eyes 1683. Red man x 130, lens row 1258. Four window columns at x 85, 374, 663, 952: peeking eyes rows 1399 (floor 1), 1153 (floor 2), **907** (floor 3). Retiree x 374, eyes 1405, open hand up. Eaves row 779, ridge 608, sky above |
| 10 US-WIDE | 10 | (10.6, 1.05, -10.5) -> (10.6, 0.92, 0), 44 | (10.6, 1.05, -9.9) | Down the road toward +z, 0.7 deg down. Pickup (P2) 205 px/m: x -8-350, Mash x 253, eyes 907, his arm out of the window toward Spud. Spud (yaw -135) crosses x 472 -> 836, 228 px/m, 173 px wide, eyes 1017, then goes behind the bus's nose (x 811). The bus's road side x 811-1080. Hanging heads x 162, 464, 767, rows 317-465. Flag F1 x 914-1047, rows 344-428. Card N rows 640-930 |
| 11 GREEN | 11, first half | (-3.2, 0.60, +0.28) -> (-9.25, 1.31, +0.28), 34 | (-3.5, 0.60, +0.28) | Lamp x 110: green lens row 868, red 721, hood top 637. Spud 519 px/m: x 737 (536-930), eyes 1242, then 1294 as he steps down. Kid x 330. Retiree x 425, eyes 934 |
| 12 PAYOFF | 12 | (-1.0, 0.25, -0.10) -> (-7.36, 2.13, -0.10), 38 | (-1.0, 0.32, -0.10) | 16.5 deg up. Spud (S12) 438 px/m: x 540 (374-706), eyes 1600, crown 1447 (the floor-1 sill line is row 1463: nobody behind his head), boots 1894. Kid x 299, eyes 1694. Twelve windows in frame, columns x 79, 372, 665, 958, 217 px/m: crowd eyes rows 1404, 1155, **905**; a clapper 130 px wide, the retiree 161. Eaves 794, ridge 640, sky above |
| 13 HERO-DE | lines 1, 7, 13, 23 | (-5.2, 0.72, +1.2) -> (-9.25, 1.00, -0.10), 26 | (-4.95, 0.72, +1.12) | Spud 978 px/m: face x 540 (168-912), eyes 1190, crown 848, leaf tip 700. Flag behind his shoulder x 100-260, rows 480-600. W1, pole and kid are out of frame |
| 14 RETIREE | lines 6, 19, 25 | (-8.9, 1.55, -1.3) -> (-13.9, 2.07, +0.675), 24 | (-9.2, 1.55, -1.18) | Over Spud's leaf (not in frame), 6 deg up. Retiree 862 px/m: face x 540 (221-859), eyes 1040, cap top 730. Open hand at (-13.5, 2.15, +0.25): x 720, row 960, beside the face. Window frame and lace round him |
| 15 HERO-US | lines 4, 10, 17 | (14.0, 0.72, -3.4) -> (16.78, 1.00, -0.10), 26 | (14.2, 0.72, -3.15) | Spud (yaw -150) 967 px/m: face x 540, eyes 1190, crown 850. Pole and orange hand at the right edge, x 990-1080, rows 230-590. Card E behind |
| 16 BUS-ACROSS | line 3; 11, second half | (-13.0, 1.05, +0.6) -> (-5.31, 1.46, -1.61), 34 | (-12.7, 1.05, +0.5) | From the forecourt over Spud's back. Line 3 (Spud at K): back slice x 527-1080. Panel 11 (Spud at S11): back x 658-1080, crown row 1141. Bus door x 98-378, open then shut. Wedge through the corner glass x 540, 327 px/m, eyes 1055. Bus roof row 745; the far block's closed lace above it. The bus pulls out to frame right behind Spud |
| 17 CHIP | line 11 | (15.6, 0.60, -1.9) -> (12.2, 0.72, +1.5), 26 | (15.35, 0.60, -1.65) | Chip 866 px/m: 494 px wide, eyes 1130, leaf tips 760, burger at chest height on the lens's right, never over the mouth |
| 18 BOARD | line 21 | (5.9, 1.00, -5.4) -> (7.1, 1.00, -1.2), 32 | (5.95, 1.00, -5.1) | Along the far pavement toward +z. Bus door side fills x 0-330. Spud walks at the lens z -0.5 -> -2.2: 680 -> 1046 px/m, eyes 1150 -> 1180, then turns into the door. Bus stop sign x 760, pictogram rows 420-560 (no letters). Hanging heads small at the top right |
| 19 MASH-STOP | line 20 | (11.2, 1.00, -2.6) -> (12.45, 1.20, +2.4), 30 | (11.3, 1.00, -2.3) | Through the pickup's windscreen. Mash 696 px/m: face x 540, eyes 1090, crown 742. His left arm out of his window at x 760-900, waving toward frame right (Spud's way) |

Lowest eye margins: floor-3 crowd in 12 (row 905) and 09 (907), Mash in 10 (907), the retiree in 01 (915) and 04 (919). In the caption
band and nothing else: the retiree's upper sash and lace (02, 14), the bus's blank route display (05), Spud's leaf (13), the flag (13),
roof and sky (09, 12), the orange hand's lower edge (08, 15), the far block's wall (16). Lenses 24-38 except 10 (44, the one
wide that must hold a 5 m road). **09 and 12 put Spud's eyes at rows 1598 and 1600**: that is the price of every window eye under row 900
(open question 2).

**Lines to cameras** (cut every 2-4 s; lanes alternate): 0 -> 01 · 1 -> 13 · 2 -> 02 · 3 -> 16 (0.9 s, the open doors across the bars)
then 05 · 4 -> 03 · 5 -> 03 (the pickup crosses the frame) · 6 -> 14 · 7 -> 13 (arms spread; the kid is placed out of frame on this cut)
· 8 -> 04 · 9 -> 06 · 10 -> 15 · 11 -> 17 · 12 -> 05 · 13 -> 13 · 14 -> 07 (glint on "SEE") · 15 -> 08 · 16 -> 08 (grille pulses) ·
17 -> 15 · 18 -> 08 · 19 -> 09 (0.9 s: the toe slides, every lace parts) then 14 (open hand) · 20 -> 19 then 10 (he walks) · 21 -> 18 ·
22 -> 05 · 23 -> 13 (a push to 1100 px/m, eyes up at the lamp beside the lens) · 24 -> 05 (0.7 s) then 11 (the lamp turns green, he
steps down) then 16 (doors shut on the cut, the bus pulls out behind his back) · 25 -> 14 ("Good.", one clap) then 12, hold 1.8 s.

## 1. One world: two streets and a seam

One `plain` set, `floor: "none"`, everything built from props, one light rig. **German street x -15.2..0, American street x +1.2..+23**,
both running along z. The seam is two things back to back: the German far block `flatsR` (body x -0.6..0, 5.7 tall) and the American
painted card W (x +1.2, 9 tall). German cameras stand at x -13..-1 and look along x; American cameras stand at x +5.9..+19.8 with card W,
N or E (section 8) behind every frame. No camera crosses x 0 and none sees over the seam (from y 1 at x -13 the
block's ridge hides everything under y 9.7 at x +6).

- **Sky**: `shsky` reused, `time: "a"` (light blue, pale gold near the sun). Fallback if its winter streaks read cold: set colour `#a9d4f2`.
- **Sun** (sunny Sunday morning, the same all film): key `#fff1d6` from the direction (+0.55, +0.70, -0.45), 44 deg up; shade `#8fa3c4`.
  It lights everything that faces +x (the retiree's block, Spud's face in Germany, the pickup's kerb side) and -z (car fronts in 10,
  Spud's cheek in 08). In shade by design: the bus's door side and the far block in 16, the bus cab in 05 (lit by `cablight` reused,
  `#fff1cf`), Spud's face in 15 (yaw -150 turns his lit cheek to the lens: check on the first stills).
- **Shadows**: the two streets are 37 m across; ep 01's shadow map was 8 m. Ask for `shadow: { size: 10 }` and a shadow centre keyed per
  lane, (-8, 0) and (+12, 0). If the centre cannot be keyed: size 20 and accept soft contact shadows.
- **Grade**, jumping on every lane cut, no `dur`: German `{ s: 1.00, w: -0.15, c: 1.04 }` (pastel, a little cool), American
  `{ s: 1.16, w: 0.35, c: 1.00 }`. No split shot in this episode.
- **How each lane reads at once**: German = cobbles, pastel stucco, lace, nothing moving; American = black asphalt, yellow lines, chrome,
  red truck, things always moving. Flags: section 2 and 3.

## 2. GERMAN STREET (x < 0): narrow, cobbled, empty, watched

| x | What | Built from |
|---|---|---|
| -15.2..-14.0 | the retiree's block `flatsL`, face at x -14.0, front toward +x | NEW `altbau` (section 4), `look: "rose"` |
| -14.0..-9.0 | forecourt pavement, y 0.10, z -11..+11 | `flagway` reused, w 22, d 5.0, h 0.10 |
| x -9.0 | near kerb | `kerb` reused, h 0.10, seed 3 |
| -9.0..-6.4 | the road he must cross, 2.6 wide, y 0 | `street` reused (cobbles), w 2.6, d 22, slope 0 |
| -6.4..-5.2 | bus island, y 0.10 | `flagway` w 22, d 1.2 + `kerb` on both edges (seeds 5, 8) |
| -5.2..-3.0 | bus lane, y 0 | `street` w 2.2, d 22 |
| -3.0..-0.6 | far pavement, y 0.10 (the cameras of 01, 09, 12 stand here) | `flagway` w 22, d 2.4 + `kerb` |
| -0.6..0 | far block `flatsR`, face at x -0.6, front toward -x | `altbau`, `look: "butter"`, `back: "none"` |

The road is 2.6 m: narrow. The 5 m forecourt is what lets one frame hold Spud and a window "above him": seen across the road the block
stands 1.6 x farther than Spud, so its first floor lands just over his leaf. **Not one car anywhere.** Both blocks are 16.2 long,
z -8.1..+8.1, 12 window columns c0..c11 at z = 7.425 - 1.35 c (c5 = +0.675, c6 = -0.675).

**White crossing bars**: NEW `crossbars` (section 7), 4 bars across the road at z -1.1..+0.9: x -8.83..-8.49, -8.18..-7.84, -7.53..-7.19,
-6.88..-6.54. Seen from the far pavement they lie across the frame like rungs between the lens and Spud.

**Marks** (root x, y, z; yaw):

| Mark | Where | Use |
|---|---|---|
| K | (-9.25, 0.10, -0.10), yaw +90 | Spud at the kerb, face to the road and the main cameras. Panel 1: right boot lifted 0.12, its toe over x -8.95, frozen from frame 0. Line 13: pitch 14 deg over the kerb. Panel 9: the right toe slides 0.12 past the kerb edge (x -8.88), heel still on the stone |
| S11 | (-8.60, 0, -0.10), yaw +90 | on bar 1: the step down in 11, his back in 16, right arm half up after the bus |
| S12 | (-7.36, 0, -0.10), yaw +90 | on bar 3, arms hanging, leaf drooping 40 deg, eyes at the lens |
| T | (-9.32, 0.10, +0.62), yaw +100 | the kid, head tipped up 25 deg at Spud, no blink, no sway. Hidden until the cut into line 7; she is simply there in 04 |
| NP | (-9.15, 0.10, +1.10) | the pedestrian light (section 7), head toward +x. One pole only |
| RW | (-14.52, 1.45, +0.675), yaw +90, pitch 22 | the retiree on the room floor behind W1 (floor 1, c5), chest over the sill, face 0.04 outside the wall |
| WS | (-3.78, 0.66, -2.45), yaw 0 | Wedge on the driver's seat. Lids 0, `noblink` all film; left wrist up at chest, right index taps it 2 x per line at 3 Hz |
| BW | (-0.55, 1.45, +2.025), facing -x | the watcher with binoculars: floor 1, c4 of `flatsR` (in front of the bus's nose, so the bus roof does not hide it) |

**The bus**: NEW `citybus` (section 8), `look: "de"`, origin (-4.20, 0, -4.40), front toward +z: body x -5.15..-3.25, nose at z -1.6,
door on the island side at z -2.85..-2.05, `open: 1` from frame 0. German traffic keeps right, so a bus that shows its face to the street
has its doors on the far side of the lens: the island puts those doors toward Spud. At "Too late.": `open` 1 -> 0 over 10 frames on the
cut into 16, then z -4.4 -> +9 over 2.4 s (ease in), `len` the same metres; it leaves 16 by frame right and is hidden before 12.

**Dressing**: `busshelter` reused (w 1.8, d 0.8, h 1.9, `lit: 0`) on the island at (-5.80, 0.10, -4.70), rot 90, open side to the bus.
2 `streetlamp` reused (h 2.6, `lit: 0`) on the forecourt at (-10.2, 0.10, +3.6) and (-10.2, 0.10, -4.4). `hedge` reused (h 0.6, d 0.3)
at the far block's foot, z -8..-3 and +4..+8 (the gap is where the cameras stand). 2 `tree` reused (scale 1.3) on the far pavement at
(-1.8, 0.10, +6.2) and (-1.8, 0.10, -6.6). Nothing else: the emptiness is the joke.

**Flag**: `miniflag` reused, `flag: "de"`, `scale: 2.7` (cloth 0.60 x 0.38), on the balcony rail of `flatsL` (floor 1, c6), pole foot at
(-13.45, 2.05, -0.675), tipped 35 deg out over the forecourt, cloth toward the street. 168 x 101 px in 01, in frame in 01, 09, 11, 12, 13.

**What the block does** (keys in section 4): frame 0, W1 is already swinging open (60 -> 100 deg in 4 frames) and its lace blows. Line 14:
the lace of BW parts, binoculars glint. Line 19, in 09: every lace on `flatsL` parts in 4 frames and eye pairs come up in the gaps over
the next 6. On the cut into 12: every window swings open as a wave from W1 outward (8 frames each, 2 frames later per column), the crowd
leans out as its window passes half open, and the slow clap starts: 1 clap a second, everyone on the same frame.

## 3. AMERICAN STREET (x > 0): wide, loud, nobody cares

| x | What | Built from |
|---|---|---|
| +1.2 | card W: diner and gas station, 30 x 9, z -14..+16, facing +x | NEW `usbackdrop` (section 8), `view: "w"` |
| 1.2..5.0 | gas station apron, y 0 | part of `usroad` |
| 5.0..7.6 | far pavement, y 0.10: bus stop sign, flag F1 | part of `usroad` |
| 7.6..16.0 | road A, four lanes of 2.1, y 0: lane centres 8.65 and 10.75 (toward +z), 12.85 and 14.95 (toward -z) | NEW `usroad` (section 7) |
| 16.0..22.0 | corner plaza, y 0.10: Spud, the button pole, room for the cameras behind him | part of `usroad` |
| +23.0 | card E: a brick store row, 26 x 9, z -12..+14, facing -x | `usbackdrop`, `view: "e"` |

Along z: road A runs z -30..+24; cross street B (4.2 wide) crosses it at z +6.5..+10.7; card N (22 x 9, x 2..24, facing -z) closes the
road at z +26. Crossing bars (`crossbars`): 10 bars 0.42 wide across road A at z -1.1..+0.9, the first at x 7.81, pitch 0.84.

**Marks**:

| Mark | Where | Use |
|---|---|---|
| HU | (16.78, 0.10, -0.10), yaw -90 | Spud at the kerb, back to cams 03 and 06. Panel 3: right index on the button at (16.22, 0.72, -0.18). Panel 6: yaw -75, right arm up 40 deg at the orange hand. Panel 8: yaw -110, both fists on the button in turn at 5 Hz (action `tap`), brows down, mouth a tight line |
| UP | (16.14, 0.10, -0.10) | the button pole (section 7); box and head both face yaw 135 (toward +x and -z: at Spud and at cams 03, 08, 15) |
| CJ | (12.2, 0, +1.5), yaw +110 | Chip, 0.6 m outside the bars. He strolls in from (9.2, 0, +1.9) at 0.7 m/s (a walk the feet can carry), stops at CJ for lines 9-11, shrugs with the free hand, walks on to (16.6, 0.10, +1.9) |
| P1 | lane 14.95, z +4 -> -7 at 1.4 m/s, rot 180 | the pickup's right-on-red roll, 0.3 m from the kerb, "past the tip of his nose". It enters 03 still steering (`bend` 15 -> 0) and takes 1.8 s to cross the frame: line 5 fits. Mash leans to the kerb-side window, right hand waving in the opening |
| P2 | (12.40, 0, +3.25), rot 180 | the pickup stopped for line 20, nose at z +1.1, half a lane off its line. Mash's left arm out of his own window, palm up, sweeping toward -x twice |
| Q1-Q3 | (12.6, 0, +7.4), (14.95, 0, +2.6), (14.95, 0, +6.2) | `citycar` reused, `scale: 0.8` (2.64 long, 1.65 tall), colours `#9aa3a8`, `#3f8fd0`, `#e6dcc8`, stopped behind and beside the pickup from line 20. Before that Q2 and Q3 drive lane 14.95 past the lens once each (z +14 -> -20 at 4 m/s) in 06 and 15 |
| W10 | (16.78, 0.10) -> (7.10, 0.10, -0.10) along z -0.10, 1.0 m/s, yaw -135 in 10 | Spud's walk. 10 shows x 10.9 -> 9.3 (1.6 s); he goes out of sight behind the bus's nose and 18 picks him up |
| B18 | (7.10, 0.10, -0.50) -> (7.10, 0.10, -2.15) yaw 180, then yaw +90 and a step up to (7.90, 0.36, -2.15) | boarding: toward the lens, a look back over his shoulder ("...Huh."), then into the door ("Made it.") |

**The American bus**: `citybus`, `look: "us"`, origin (8.60, 0, -4.10), front toward +z: body x 7.65..9.55, nose at z -1.3 (it waits at the
bars), door on the pavement side at z -2.55..-1.75, `open: 1`. A `streetpotato` driver bust behind the wheel (h 0.9, suit `#2b3f8a`).

**Bus stop sign**: NEW `busstopsign` (section 7) at (7.30, 0.10, +3.4), plate toward +x. **Flag F1**: `miniflag` reused, `flag: "us"`,
`scale: 4` (cloth 0.88 x 0.56) with one opt-in key `poleH: 5.0`, foot at (7.25, 0.10, +5.2), cloth out over the road: 186 x 118 px at
x 300-480 in 03 and 06, 133 x 85 px at the right edge of 10. **Hanging signals**: section 7, wire across road A at z +2.1.
**Dressing**: 2 `tree` (scale 1.4) at (4.2, 0, -6.0) and (3.6, 0, +12.5); 2 `streetlamp` (h 3.4, `lit: 0`) on the plaza at (17.0, 0.10, +4.6)
and (20.5, 0.10, -6.0); 1 `trafficcone` reused on the plaza at (18.9, 0.10, +2.2).

## 4. The block of flats: NEW `altbau` (two instances)

No existing kind fits: `curtainwindow` is one indoor window (1.00 x 1.50, gold frame, velvet panels, a cord), so 36 of them would be 36
props in the wrong cloth; `bankfront`, `dinerfront` and the `neonstreet` shopfronts are other buildings at night.

ORIGIN the middle of the street face on the ground, front +z (`flatsL` at (-14.0, 0, 0) rot 90; `flatsR` at (-0.6, 0, 0) rot -90).
16.2 wide, `d` deep (1.2; `flatsR` 0.6), eaves 4.90, ridge 5.70. Potato scale: a storey is 1.15, so three rows of watchers fit under row 900.

| Part | Numbers, colours |
|---|---|
| Wall | `look: "rose"` `#e9b7a6`, `"butter"` `#ead9a4`; plinth y 0..0.25 `#b9a999` with 3 drawn grooves; string course 0.06 `#f4ecdf` at y 1.45, 2.60, 3.75; cornice 0.15 at 4.90, 0.12 proud |
| Roof | tiles `#a8553a` at 40 deg to the ridge, every eighth tile a shade darker from a table, 4 chimneys 0.30 x 0.50 `#8f4a36`. No dormers (the roof sits in the caption band) |
| Upper windows (floors 1-3, 36 a block) | opening 0.95 x 0.86, sill top 0.28 over the floor line (floor 1: y 1.73..2.59); stucco surround 0.08 `#f4ecdf`, sill slab 0.05 thick, 0.08 proud; two casement leaves 0.475 wide, frames `#f7f4ea` 0.04, one cross bar each, glass `#3d5566` with one sheen stroke; the room behind a dark box `#2a2a33` |
| Ground floor | windows 0.95 x 0.80 at y 0.50..1.30 with half-height lace, never open; one door at c8: 0.80 x 1.20 `#3f6b58`, 2 steps, a brass knob |
| Lace | two panels a window, 0.50 wide each, `#f6f1e4`, the holes are alpha in the texture (material opacity fixed at 1); 6 patterns (scallops, dots, daisies, diamonds, vines, hearts), each drawn once, one picked per window by hash; a scalloped hem |
| Flower boxes (`flatsL` only) | 0.90 x 0.14 x 0.14 terracotta `#c27a52`, mound `#4f8a3c`, 9-14 geraniums `#d8352b` / `#e85a4a` with `#f2c230` eyes, placed once from a table; 2 windows in 5 have none. W1's box is the real `flowerbox` (w 0.90) with one opt-in key `flower: "#d8352b"`: it is in close-up in 02 |
| Balcony (`flatsL`, floor 1, c6) | slab 1.15 x 0.50 x 0.08 at y 1.45; iron rail `#2c3038`, 9 bars and 2 scrolls, top y 2.05; a glazed door 0.80 x 1.05 behind it; 2 pots |

**Keys** (prime each with a dur-0 set at t 0):

| Key | Does |
|---|---|
| `part` 0..1, tweens | every lace pair parts to a centre gap 0.16 x part; each window starts up to 1 frame early or late by hash, so it twitches like a street, not a machine |
| `peek` 0..1, tweens | an eye pair rises 0.06 into each gap at floor + 0.55: whites 0.05 x 0.06 `#f7f4ea`, pupils r 0.018 `#2a1a12` aimed at `spec.watch` [x, y, z] (Spud), a grey brow stroke `#b9b4aa` over each, gold rims on one window in three, on a skin oval `#e2a95c` 0.30 x 0.26 in the dark |
| `open` 0..1, tweens | every upper casement swings OUT 0 -> 100 deg and lies on the wall like a shutter (it reads at 130 px; inward it would vanish), the lace slides to 0.10 a side. One key runs the wave: column c opens over open = 0.1 k .. 0.1 k + 0.4, k = its distance in columns from `spec.from` (5). Tween 0 -> 1 in 20 frames |
| `solo: "floor-column"` with `soloOpen`, `soloPart`, `soloBlow` 0..1 | one window on its own. `flatsL`: `solo: "1-5"` (W1), `soloOpen` 0.6 -> 1 in frames 0-4, `soloBlow` 0.6 (the lace streams out 25 deg and flaps at 2 Hz on clip time). `flatsR`: `solo: "1-4"` (BW), `soloPart` 0 -> 1 at line 14 |
| `skip: ["1-5", "1-6"]` | no painted eyes there (the retiree is real; the balcony has a door) |

**SOLID**: wall, plinth, sills, balcony slab and rail, door steps, and a room floor plate 0.95 deep behind the solo window at its floor
line (the retiree stands on it at y 1.45). Not solid: glass, lace, eyes, casement leaves, flowers. One merged static mesh of about 14k
triangles a block, plus instanced lace, leaves and eyes.

## 5. The window crowd: `streetpotato` + 6 opt-in keys (not 12 more rigs)

Twelve `retiree.json` rigs would mean twelve sets of gloves through the contact gate and twelve skinned bodies on a CPU renderer, for
figures that are 130 px wide: at that size a rig and the prop read the same. What reads at phone size is the outline (cap or bun), a
block of cardigan colour, grey brows, and twelve pairs of hands meeting on the same frame. The real retiree stays the only rig, in W1.

New keys on `streetpotato` (each off by default, today's passers-by unchanged):

| Key | Draws |
|---|---|
| `dress: "cardigan"` | an open knit cardigan in `color` over a cream shirt V `#f4ecdf`, 5 buttons `#7a5a34`, rib hem and cuffs |
| `hat: 3` | a flat cap in `capColor`: crown 0.9 of the head's width, stiff peak 0.10 long, a button on top; hides the leaf |
| `hair: "bun"` or `"tufts"` | a grey bun r 0.07 `#c9c4ba` on top, or two temple tufts; hides the leaf |
| `glasses: 1` | round gold wire `#8a6a2a`, r 0.05 |
| `brow: "#b9b4aa"` | bushy brows always drawn (1.4 x the angry stroke), apart from `angry` |
| `clapHz` + `clapFrom` (spec), `raise` 0..1, `lean` 0..1 | clap: both arms forward at the chest, hands 0.16 apart, meeting once every 1 / clapHz s from clip time `clapFrom` (a pure function of the clock); `raise`: both hands to the eye line; `lean`: the body tips 18 deg forward over a sill |

Eleven in `flatsL`, placed in the opening at x -14.05 (the balcony one at x -13.75), y = the floor line, rot 90, `skin: "#f9b75c"`,
hidden until the cut into 12, then `lean` 0 -> 1 as their window opens, `clapHz: 1`, `angry: 0` (they are proud, not cross):

| Window | Look |
|---|---|
| 1-4 | bun, glasses, cardigan `#b98aa0`, h 0.88 |
| 1-6 (balcony) | cap `#5f6b78`, glasses, cardigan `#7f8f6a`, h 0.92 |
| 1-7 | cap `#75695a`, cardigan `#9aa7b5`, h 0.90 |
| 2-4 | cap `#4f5a52`, cardigan `#c9a66b`, h 0.92 |
| 2-5 | bun, glasses, cardigan `#8c6f8a`, h 0.86 |
| 2-6 | cap `#6b6257`, glasses, cardigan `#d6c39c`, h 0.90 |
| 2-7 | tufts, glasses, cardigan `#7a8fa0`, h 0.88 |
| 3-4 | bun, cardigan `#a8504a`, h 0.86 |
| 3-5 | cap `#5a4030`, glasses, cardigan `#8fa08a`, h 0.92 |
| 3-6 | cap `#75695a`, cardigan `#b9b4aa`, h 0.90 |
| 3-7 | bun, glasses, cardigan `#c8a0a8`, h 0.88 |

With the retiree in 1-5 that is 12 clapping in the frame of 12, the kid the thirteenth. Columns outside c4-c7 only open their windows.
**The watcher** (BW, line 14): one more `streetpotato`, h 0.90, cap `#4f5a52`, cardigan `#6f6457`, `raise: 1`, the binoculars (section 8)
at its eye line; only the cap, the binoculars and two hands show in the 0.16 gap.

## 6. The kid: NEW `characters/potatobrawl/tot-kid.json` + NEW costume `raincoat`

`tot.json` is the bank cashier: 0.94 tall, shirt, vest, tie, brass glasses. A variant file as `spud-kid.json` was made; change only these.

| Key | `tot.json` | Kid |
|---|---|---|
| body | 0.80 x 0.70 x 0.62 | **0.46 x 0.44 x 0.40**, lump 0.02, seed 87, taper 0.04: stands 0.60 = 0.59 of Spud |
| face | size 0.9 | size 0.62, `neutral.eye` 1.10, brow thick 0.7 |
| hands | 1.15 | 1.0 |
| limbs | `#3b3f48` | `#8f2a22` (red rubber boots; boot = the limb's end, no new mesh) |
| sprout | two leaves on top | placement "none" (the hood is up) |
| costume | `teller` | `raincoat`, `coat: "#c8352b"`, `rim: "#d8453a"`, `toggle: "#f2c230"` |
| tts | - | none: she never speaks |

**`raincoat`** (hand-drawn look, every fold drawn once): a stiff A-line coat from the mouth line down to 0.12 of the body's height above
its bottom, flaring to 1.08 of the body's width at the hem; 7 fold strokes `#9f2a22`, each its own length and lean; 3 toggles r 0.012
down the front with a 0.02 loop each; 2 patch pockets 0.07 x 0.06; sleeves end 0.03 before the wrist in a rolled cuff. **Hood up**: a
shell over the crown and the back of the head from the brow line, a rolled rim 0.03 thick round the face, a soft point 0.04 at the back
(hood top 0.64); the rim never crosses the eyes. Two wet-shine strokes `#e8776c` on the hood, none on the face.

**Acting**: brows 12 deg down, mouth flat (curve 0), lids 0.25, `noblink`, `still` from the cut she appears on. She moves once: in 12
she claps with the street (the cast's hands meet at chest height once a second, lids to 0.6, curve 0.5).

## 7. Street furniture (origins are the foot on the ground unless said; no letter, number or arrow on any of it)

| Piece | Why new | Numbers, colours, keys, SOLID |
|---|---|---|
| NEW `pedlight` (German) | `trafficlight` has three round car lenses in a 0.42 x 1.04 head at 2.05: no figure, too high for the frame | Pole r 0.06, 2.30 tall, `#7c868c`, SOLID. Head 0.30 x 0.60 x 0.20, `#1d1f24`, centre 1.52 up, two visors 0.06; `spec.face` its yaw (90). Red lens r 0.105 at +0.14: a standing little man with a flat hat, arms straight out, `#ff3b2a`. Green lens at -0.14: the same man striding, `#3ddc6a`. The unlit one shows its figure at `#3a1512` / `#12301c`. Key `go` 0 or 1, a step, no blend; a halo r 0.22 at fixed opacity 0.5 takes the lit colour. `go` 0 all film, 1 on the first frame of 11 (prime it at t 0) |
| NEW `uspedpole` | `speakerpost` is a free-standing 1.45 ordering post with no button and no head; `trafficlight` has no hand | Pole r 0.055, 2.05 tall, `#5a5f66`, SOLID. `spec.face` (135) turns head and box. **Head** 0.34 x 0.34 x 0.16, centre 1.40 up, `#1d1f24`, a 0.05 visor: an open raised hand of 17 x 21 dots `#ff8a1c`; key `hand` 0..1.2 (1 all film; the dots brighten, a halo r 0.24 at fixed 0.45). **Box** 0.20 x 0.30 x 0.12, centre 0.62 up, `#8d969c`, 4 screw heads: a dome button r 0.065, 0.035 proud, `#f2b51f`, on a black ring; a speaker grille of 19 holes in a disc r 0.045, 0.10 above the button; one LED r 0.008 beside it. Key `press` 0..1 (the dome sinks 0.015; the director pairs it with each fist), key `talk` 0..1 (LED `#5a5f66` -> `#ff3b2a`, the holes lighten to `#c9ced6`, a halo r 0.03 over 0.5): 1 for the length of each "Wait.", 0 between |
| Hanging signals: `trafficlight` reused + 2 opt-in keys, on NEW `spanwire` | the head, lenses and `go` are right; only the post is wrong | `trafficlight` with `hang: true` (no post; a 0.19 hanger; ORIGIN the hanger's top) and `housing: "#e8b923"`, `scale: 0.75` (head 0.315 x 0.78 x 0.195), `go: 1` (green all film: his orange hand is the only thing saying stop). Three, hung at (12.6, 4.48, +2.1), (11.0, 4.44, +2.1), (9.4, 4.48, +2.1), rot 135. `spanwire`: two steel poles r 0.07 x 5.0 `#5a5f66` at (16.5, 0.10, +2.1) and (7.2, 0.10, +2.1), SOLID, and a cable r 0.012 `#2c3038` between their tops with 0.22 of sag; spec `a`, `b`, `sag` |
| NEW `crossbars` | `finishline` is chequered, `chalkline` one chalk stroke | spec `n`, `w` (bar width), `len`, `pitch`, `axis`; paint `#f2efe6`, 0.004 over the road; every bar has its own worn edge and 2-4 scuffs, drawn once. German: n 4, w 0.34, len 2.0, pitch 0.65. American: n 10, w 0.42, len 2.0, pitch 0.84. Ghost |
| NEW `usroad` | `street` is granite setts and `flagway` flagstones, both with an evening glow; neither has asphalt or lines | Place at (0, 0, 0), draws in world metres. Asphalt `#3d4047` (road A x 7.6..16.0, z -30..+24; street B z 6.5..10.7, x 5.0..22.0; apron x 1.2..5.0 `#8a8d93`) with 9 patches `#34373d`, 6 cracks, 5 oil stains, each once. Double yellow centre line at x 11.8 (two 0.06 lines 0.08 apart, `#e8b923`), open across B; white dashes at x 9.7 and 13.9 (0.06 x 1.2, gap 1.8); stop lines 0.30 at z +1.2 (x 11.8..16.0) and z -1.4 (x 7.6..11.8). Concrete far pavement (x 5.0..7.6) and plaza (x 16.0..22.0) at y 0.10, `#c9c4b8`, joints every 1.5 `#a8a294`, kerb face `#b4ae9f`. Not solid; nothing casts a shadow |
| NEW `busstopsign` | none in the library | Post r 0.03 x 2.20 `#9aa3a8`, SOLID. Plate 0.42 x 0.52 x 0.02, rounded, centre 1.85 up, blue `#2b63c4`, white border 0.025, a white bus pictogram 0.26 x 0.24 (front view: rounded box, two windows, two lamps, two wheels) on both faces |

## 8. Vehicles, backdrop, hand props

**NEW `citybus`** (two instances). `bus` does not fit: a 3.9 x 1.6 x 1.0 side-on toy with a solid body (no cab, nobody behind the glass),
a door on its +z side only and "10 CITY" lettered on it. ORIGIN on the ground under the middle, front +z, **doors on its right (-x)**.

| Part | Numbers |
|---|---|
| Body | 5.60 long (z -2.80..+2.80), 1.90 wide, roof 2.05, floor 0.36 (stand on it); skirt `#2d3340` to y 0.30; wheels r 0.30 at z +1.75 and -1.60, track 0.80 |
| `look: "de"` | paint `#f2c230`, roof `#f7f4ec`, a dark window band `#2d3340` y 1.00..1.75 |
| `look: "us"` | paint `#d9dde2`, a red band `#c8312f` y 0.80..0.92 and a blue band `#2b3f8a` y 0.92..1.04, roof white |
| Cab | windscreen y 0.85..1.80, the full width, wrapping 0.35 round the door-side corner (16 sees Wedge through it); driver's seat on the left: top (+0.42, 0.66, +1.95), back to y 1.20; steering wheel r 0.17 at (+0.42, 1.02, +2.42) tipped 35 deg; a dash `#2d3340` to y 0.85. `cablight` under the cab roof |
| Front door | z +1.55..+2.35, y 0.36..1.86, two glazed leaves; key `open` 0..1 slides them 0.38 apart; a lit step `#fff1cf` inside |
| Route display | 0.90 x 0.17 over the windscreen, `#15161c` with a row of 7 amber dots `#ffae2b`: no glyphs |
| Inside | 6 seat backs `#3f6b8a` behind the side windows, 2 grab poles `#f2c230`; nobody on board in Germany |
| Keys | `open`; `len` metres rolled; `blink` 0..1 (the left indicator flashes at 1.5 Hz as it pulls out); x / z move it |
| SOLID | body, floor, seat. Glass is steam. At most 12k triangles |

**NEW `pickup`** (one). `car` is a 0.8 m open-top toy; `citycar` and `limo` have a sealed dark cabin with nobody inside; the hatchback
is a rig. Mash must be seen in a cab with open windows. ORIGIN on the ground under the middle, front +z, driver on the left (+x).

| Part | Numbers |
|---|---|
| Body | 4.30 long (z -2.15..+2.15), 1.75 wide, cab roof 1.80; bonnet top 1.12 (z +0.95..+2.15); cab z -0.35..+0.95; bed z -2.15..-0.35, sides to 1.05, liner `#2b2d33`; wheels r 0.38 at z +1.35 and -1.35, track 0.80 |
| Colours | paint `#c8312f`, chrome bumpers and a 5-bar grille `#c9ced6`, round headlamps `#fff6c8`, tyres `#22232a`, a plain plate (no text) |
| Cab | seat top y 0.42 at (+0.40, 0.42, +0.20), `#6b4a2b`; wheel r 0.16 at (+0.40, 0.95, +0.62); BOTH side windows open, 0.72 x 0.66, y 0.96..1.62 (his mouth at 0.98 clears the sill); raked windscreen glass at fixed opacity 0.12 |
| Keys | `len`, `bend` (front wheels, degrees), `bump` 0..1 (the body rocks once as it stops) |
| SOLID | body and bed; the cab is open to the sitter, who sits by placement as in `coupe`. At most 10k triangles |

**NEW `usbackdrop`** (three cards). The diner and gas station are a **far painted backdrop behind 3D foreground**, not 3D: nothing in
the story touches them, every camera is 9-27 m away and pushes 0.6 m at most (no parallax to lose), and a 3D diner plus a gas station
is two more kinds. `dinerfront` does not fit: night, snow, a "CLOSED" notice, a padlock. One unlit canvas per card, the skyline cut by
alpha so the real sky shows over it (fallback: paint the sky `#a9d4f2`). Every mark drawn once, no letters, numerals or logos.

| `view` | Size, place | Painted |
|---|---|---|
| `"w"` | 30 x 9, x +1.2, z -14..+16, faces +x | diner at z -7..+1: chrome car body `#c9ced6`, red bands `#c8312f`, a rounded glass corner, a blank roof fin, 4 booths with potato heads; gas station at z +3..+11: a flat canopy `#f7f4ea` with a red edge on 2 posts, 2 pumps `#c8312f` with blank faces; 5 trees `#4f8a3c`; low hills |
| `"n"` | 22 x 9, z +26, x 2..24, faces -z | the road running on to a vanishing point at x 11.8, a second diner on the left, a water tower with a blank tank, power poles, trees |
| `"e"` | 26 x 9, x +23, z -12..+14, faces -x | a brick store row `#b5533c`: 3 fronts with striped awnings (`#c8312f` / `#f7f4ea`, `#2b3f8a` / `#f7f4ea`), dark windows, blank fascias |

**Hand props** (sizes as used on screen):

| Prop | Kind | Numbers |
|---|---|---|
| Binoculars | NEW `binoculars`, 0.24 x 0.10 x 0.17 | two barrels `#22242a` (eyepiece r 0.03, objective r 0.05), a bridge and a focus wheel, lenses `#5fa8c8` with one highlight stroke. Key `glint` 0..1: the left objective goes white and a soft disc r 0.09 (fixed opacity 0.6) scales with it; 0 -> 1 -> 0 over 8 frames on "SEE". A light, not a symbol. Not hand-held by a rig (the watcher is a prop): no grip |
| Burger | `wrapburger` reused, `wrap: 0.35`, `scale: 0.75` (0.18 across) | Chip's LEFT hand, one hand, at chest height 0.20 to his left so it never covers the mouth; one bite before line 9 (6 frames at the mouth, then cheeks chewing through "Morning!"). The library hold is two palms: if the one-hand hold fails the grip gate, both hands hold it and he nods instead of waving |
| Wedge's watch | the retiree's `watch: "L"` build, as one opt-in key on the `wedge` costume | strap `#2b2f3a`, steel case r 0.038, dial `#f7f4ea`, no numerals. Cut first: he then taps the bare cuff |
| Retiree's cap | `tweedcap` reused, `#75695a` | as ep 01. No watch tap, no purse: his hands point (02), wag (14), open (19), clap (25) |

Through hands: the burger only. The button is pressed, never held.

## 9. New, reused, opt-in keys

- **New kinds (11)**: `altbau`, `citybus`, `pickup`, `pedlight`, `uspedpole`, `spanwire`, `crossbars`, `usroad`, `busstopsign`, `usbackdrop`,
  `binoculars`. One new cast file `tot-kid.json`, one new costume `raincoat`.
- **Reused as built**: `street`, `kerb`, `flagway`, `busshelter`, `streetlamp`, `hedge`, `tree`, `trafficcone`, `citycar` (3, scale 0.8),
  `wrapburger`, `cablight`, `shsky`, `tweedcap`; `spud.json` (two ids), `retiree.json`, `wedge.json`, `mash.json`, `chip.json`; `grade`.
- **Reused with opt-in keys, defaults unchanged**: `streetpotato` (12: `dress: "cardigan"`, `hat: 3`, `hair`, `glasses`, `brow`, and
  `clapHz` / `raise` / `lean`), `trafficlight` (`hang`, `housing`), `miniflag` (`poleH`), `flowerbox` (`flower`), the `wedge` costume (`watch`).
- **Looked at and not used**: `bus`, `car`, `curtainwindow`, `dinerfront`, `speakerpost` (reasons above).
- **Cut first if the build runs late**, in this order: Wedge's watch, card E (aim 15 at card N), W1's real `flowerbox` (the block's own
  box stays), chimneys, the gold rims on the peeking eyes, lace patterns 6 -> 3, `citycar` Q3, the cone and the plaza lamps, the bus's
  seat backs. Never cut: the lace, the crossing bars, the two flags, the little man's hat.

## 10. Departures from the sheet, each with its reason

1. **The block stands 5 m back across a forecourt**, not at Spud's shoulder: only then does a 9:16 frame hold him and a window above him
   with both pairs of eyes under row 900, and three rows of watchers in 9 and 12.
2. **The German bus waits at an island with its doors toward Spud.** With traffic on the right, a bus at the far kerb turns its doors
   away from the road; the sheet shows face and doors, and so does the island.
3. **Panel 1 has no bus and no kid.** The frame is 2.4 m wide at Spud and the bus stands 5 m to the side: the open doors are the first
   image of line 3 (cam 16). The kid cannot stand there before "There ARE no children!": she appears on the cut at line 8.
4. **Panel 4**: the kid is on Spud's left as in 1, 9 and 12; no bus; the retiree is in frame above them.
5. **Panel 5**: no door edge in the foreground (it lies 1 m outside a 9:16 frame); the doors shut in 16.
6. **Panels 7, 10 and 11 are two cuts each** (13 + 07; 10 + 18; 11 + 16): Spud and a window 13 m away, a 8.4 m road and a bus door,
   a lamp and a bus 5 m apart do not share one 9:16 frame at a readable size.
7. **Panel 9**: the retiree's "five" is an open hand (the cast glove has three fingers); the wide holds 0.9 s, then his medium shot.
8. **Panel 3**: the pickup crosses left to right and Mash waves through the kerb-side window: a right turn in America shows the
   passenger side to the kerb. **Panel 6**: Chip crosses 0.6 m beside the bars, against the same orange hand.
9. **Panel 12**: camera 0.25 m off the cobbles, roof and sky in the top third, 12 windows in frame at 130 px a head.
10. **No sweat drops, shock lines or rays** (panels 3, 4, 6, 8, 9): story.md. **Wedge is Wedge**, not the Viking, with no cap.
11. **One German pole**, its little man facing the road and the lens; the American head and button are turned 45 deg to the kerb so
    Spud and the lens both see them. Storeys are 1.15 m, potato scale.

## Open questions (the default is built)

1. A 5 m forecourt between the block and the kerb? **Default: yes.** At the kerb the lens must be 60 deg and most window eyes sit
   above row 900.
2. Panels 9 and 12: Spud's eyes at rows 1598-1600 so that every window eye stays under row 900? **Default: yes.** Other way: pitch
   4 deg less, Spud's eyes at 1400, the top row of watchers at row 700 (clear of the caption, above 900).
3. Who holds the binoculars: a second old potato (**default**: the street is full of them, the retiree's voice over it) or the retiree
   himself?
4. The kid absent from panel 1? **Default: yes** (the lines need it).
5. The kid as a 0.60 variant of Tot (**default**) or `tot.json` as built, 0.94?
6. Diner and gas station painted (**default**, 3 canvases) or built in 3D (2 more kinds, nothing gained past 9 m)?
7. Wedge's wristwatch as a costume key (**default**) or a tap on the bare cuff?
8. American lights green all film while his hand is orange? **Default: yes**; cars stop for him anyway at line 20.

## Risks

- **Scope**: 11 new kinds; `altbau`, `citybus` and `pickup` are the three big ones and can be built in parallel.
- **Shadows** over a 37 m set (section 1). **Lace alpha** in the toon pass: fallback opaque lace with drawn holes `#d9d2c0`.
- **Contact gate**: the retiree leaning through W1 (wall 0.10 thick at the opening), Wedge and Mash seated by placement in new
  vehicles, the one-hand burger, Spud's toe over the kerb edge.
- **Hand-worked pixels**: the tight ones are the row-900 margins of 01, 04, 09, 10, 12 (5-19 px) and the hood of the German lamp
  against the caption band in 11 (row 637).
- **Timing**: 19 cameras for 26 lines; 10 shows Spud at 173 px wide for 1.6 s (the one true wide of the American lane).
