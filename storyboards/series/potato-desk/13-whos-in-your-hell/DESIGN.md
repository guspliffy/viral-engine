# Potato Desk 13 — Who's in your hell?: design (Fable 5.2, 25 Nov 2026)

From the panel sheet `/mnt/project-files/videos/potato-desk/heaven-hell-4/codex/whos-hell-sheet-v1.png` (15 panels, the target) and
`OUTLINE-A-v3.md` beside it (beats 1-8). New pieces only; cast, look and units as `../09-hell-reviews/DESIGN.md`. Axes +x right, +y up,
+z toward camera, metres; positions are foot roots (x, z) or mesh centres (x, y, z). Yaw 0 faces the camera, negative turns toward -x
(as `face: -35` in `make-hooks.mjs`). 1080 x 1920, 30 fps, fov = vertical. Captions rows 470-640. Sizes read off the sheet by the hero's body (0.76 wide).

Heights used below (legs 0.14; eyes taken at 0.59 of the body, re-check each with `qa/camfit.mjs`): seated on the 0.32 seat the body bottom is 0.34,
so tops are Spud 1.22 (eyes 0.86), Chip 0.87 (eyes 0.66), Wedge 1.32 (eyes 0.92). Standing: Devil top 1.06, horn tips 1.20, eyes 0.69; Spud top 1.02,
eyes 0.66; Mash top 1.38, eyes 0.91; Wizard on the 0.40 step top 1.54, eyes 1.08, hat tip 2.00.

## 0. Cameras (one per panel, all sharp, every one with a slow linear push from `pos` to `push to`)

| Cam | Panel | pos -> look, fov | push to | Sees (start frame) |
|---|---|---|---|---|
| 01 WIDE | 01 | (0.55, 1.30, 12.4) -> (0.55, 1.52, 0), 32 | (0.55, 1.30, 11.5) | 277 px/m, x -1.40..+2.50: seat 1 whole, left arm cut. Spud x 291, eyes row 1141; Devil x 912, eyes 1194, horn tips 1048, feet 1392; back star x 672, row 1214, 79 px; clock rows 773-899; door top 924; wall above row 751 plain. |
| 02 HERO-CU | 02 | (0.30, 0.95, 5.0) -> (-0.35, 1.05, 0.2), 20 | (0.24, 0.96, 4.6) | 1134 px/m, body 862 px. Eyes row 1176, mouth 1336, head top 763, leaf tip 534, lap 1774. Pen at his chin, row 1250. |
| 03 DEVIL-LOW | 03 | (1.30, 0.50, 7.0) -> (1.62, 1.02, 0.7), 28 | (1.33, 0.52, 6.5) | 611 px/m, lens 0.19 under his eyes. Eyes row 1160, horn tips 850, sandals 1587; pointing hand reaches x 160; star seat at the left edge; the black door behind his horns (top row 728). |
| 04 STAR-HIGH | 04 | (2.60, 1.50, 0.10) -> (0.20, 0.87, 0.03), 54 | (2.50, 1.47, 0.10) | Down the couch from above its right end. Seat star 328 px wide, rows 1635-1871; right arm top on the bottom edge; hero turned to the lens, eyes row 900, head top 652, face 390 px. Lava glow on the floor beyond him. |
| 05 DOOR-DIAG | 05 | (-2.20, 1.20, 8.5) -> (0.85, 1.45, -0.3), 32 | (-2.02, 1.21, 7.97) | Hero x 148, 390 px/m, eyes row 1182; doorway x 700-980, casing top 896; Chip x 943, eyes 1325, feet 1498; clock x 487, row 773. Devil (D3) out of frame. |
| 06 TWO-SHOT | 06 | (0.45, 1.15, 6.8) -> (-0.02, 1.00, 0.15), 24 | (0.41, 1.14, 6.3) | 677 px/m, x -0.82..+0.78. Spud eyes row 1057, leaf 673; Chip eyes 1193; bucket (side pose) to x 0.74; floor line 1650, feet in frame. |
| 07 THREE-LOW | 07 | (-0.75, 0.80, 8.0) -> (-0.36, 1.25, 0.1), 30 | (-0.72, 0.83, 7.5) | 453 px/m, x -1.57..+0.81: left arm to Chip's bucket. Eyes: Wedge row 1110, Spud 1137, Chip 1228; Wedge leaf 847; floor 1538, runner below. |
| 08 PHONE-CU | 08 | (-0.05, 0.92, 4.9) -> (-0.12, 1.12, 0.2), 20 | (-0.06, 0.93, 4.55) | 1158 px/m. Hero eyes row 1192, head top 717; phone x 782, rows 1170-1508, 170 x 338 px, a bubble 126 x 41 px; Wedge and Chip cut by both edges. |
| 09 WIZ-LEAN | 09 | (0.55, 1.15, 6.6) -> (0.12, 1.30, -0.1), 24 | (0.50, 1.16, 6.1) | Hero x 288, eyes row 1238; Wizard x 602, eyes 1113, hat brim 894, hat tip 543; ball x 940, row 1158, 128 px across; Chip x 713, eyes 1408. |
| 10 CHAOS-HIGH | 10 | (0, 1.90, 9.6) -> (0, 1.30, 0), 34 | (0, 1.84, 9.0) | 327 px/m, x -1.63..+1.63: the whole couch. Eyes: Spud row 1093, Chip 1172, Wizard 1025; hat tip 733; back star x 872, 95 px; clock top 644; floor 1396. |
| 11 DEVIL-DOOR | 11 | (2.60, 0.85, 5.6) -> (1.89, 0.92, 1.36), 30 | (2.56, 0.85, 5.3) | Devil 847 px/m at x 233 (left shoulder cut), eyes row 1150, horn tips 718, clipboard bottom 1494; door x 696-1080, its foot glow and the two feet shadows row 1457; clock x 315, rows 280-538. |
| 12 FLINCH | 12 | (-0.20, 0.70, 7.2) -> (-0.18, 1.12, 0.05), 28 | (-0.20, 0.72, 6.8) | 538 px/m, x -1.18..+0.82. Eyes: Spud row 1078, Wedge 1068, Chip 1208, Wizard 998; pen in both hands row 1229; hat tip 564; floor 1567. |
| 13 FLIP | 13 | (3.00, 0.90, 7.2) -> (1.07, 1.09, 1.52), 30 | (2.89, 0.91, 6.86) | Devil x 822, 609 px/m, facing the lens, eyes row 1200, clipboard bottom 1435; hero behind at x 201, eyes 1075; Chip x 446; Wizard above him, hat tip 613. |
| 14 VERDICT | 14 | (-0.90, 0.95, 9.3) -> (0.89, 1.43, 0.17), 32 | (-0.79, 0.98, 8.75) | Hero x 135, eyes row 1150; Chip x 350; empty star seat dead centre x 581 under the clock (x 487, rows 711-870); Devil x 904, eyes 1231; door behind him, top 907; hat tip 789. Wedge cut by the left edge. |
| 15 PEN-LOW | 15 | (0.35, 0.50, 6.3) -> (1.28, 1.20, 1.44), 32 | (0.41, 0.55, 5.96) | Lens 0.16 under the hero's eyes, tilted up 8 deg. Hero standing, x 284, 831 px/m (body 632 px), eyes row 1296, feet 1861; pen x 647 on the orange doorway (x 600-943); Mash x 795, 417 px/m, eyes 1263, top 1046; door top 907; clock rows 643-860. |

No eye is above row 900. In the caption band, and nothing else: the hero's leaf tip (02, 04, 08), the Wizard's hat tip (09, 12, 13), the clock (03, 11), the door top (11). Lenses 20-34
except 04 (54, the one wide-angle shot). `lobbyroom` needs `front: 9.5` so the floor reaches the bottom edge of 01, 10 and 14.

## 1. THE HELL WAITING ROOM (the 09 lobby shell, one couch, one door, one clock)

| Piece | Kind, position, numbers |
|---|---|
| Room | `lobbyroom` at (0, 0, 0), `w: 6.4` (walls x -3.20 / +3.20), `front: 9.5`, colours as built (dado `#5a2a24`, rail `#d9a93a` at 0.80, band `#3a2a2e` to 2.40, above `#2a2024`, tiles `#4a2226` / `#57292b`, runner `#8f1f1c` at x -0.50..+0.50). Back wall z -1.30. |
| Window hole | Gone. `lobbyroom` gets ONE opt-in key `holes: [[x0, x1, y0, y1], ...]` (default: today's window hole); this clip sets `[[1.75, 2.75, 0, 1.58]]` = the doorway, so the wall is solid where the window was and the gold rail stops at the door casing. |
| HELL door | `reviewdoor`, `side: "hell"`, `scale: 1.3`, at (2.25, 0, -1.30): leaf 1.04 x 1.61 `#1d1a20`, casing 0.078 `#b3261e` (top y 1.69), scorch marks, round red knob, `inside: true` (hot box 1.3 deep behind the wall, z -1.33..-2.63), `smoke: true`, `mat: false`. Hinge x 2.77; open 110 deg puts the leaf tip at (3.13, -0.29), 0.07 inside the wall. Leak pool `#ff7a1c` 1.17 x 1.30 on the floor in front. |
| Clock | `wallclock` at (1.00, 2.05, -1.28), `r: 0.26`, dial `#ead9c4`, bold ticks, NO hands (opt-in key, section 5), rim `#8a5a34`. Above the star seat; whole inside the band (y 1.79..2.31). |
| Lava glow | `lightpool` at (-2.40, 0.008, 1.20), w 2.6, d 1.8, `#ff7a1c`, on 0.55: the warmth from off screen, lower left of 01, behind the hero in 04. |
| Feet under the door | 2 `shadowpool`, each 0.16 x 0.10, at (2.10, 0.006, -1.14) and (2.40, 0.006, -1.14), shown from beat 6. |
| Couch | `hellcouch` (section 2) at (0, 0, 0), rot 0: x -1.56..+1.56, z -0.50..+0.26. 0.80 of floor behind it for the Wizard. |

Light as 09 set B (warm key `#ffe2c4`). Door swing clears the couch: at z -0.50 the leaf sweeps x 2.07 and up, the couch ends at 1.56.

## 2. `hellcouch` (NEW): 3.12 wide, 0.84 high, 0.76 deep, four seats

Origin: the floor under the sitters' line at the couch's middle, facing +z (`sit` lands a body at z +0.03). Local = world in this clip.

| Part | Geometry (local) | Colours |
|---|---|---|
| Feet, plinth | 6 bun feet dia 0.07 x 0.05 at x -1.40 / 0 / +1.40, z +0.16 and -0.42. Rail 3.08 x 0.06 x 0.70, y 0.05..0.11. | Feet `#3a2418`, rail `#5a3520`, a gold bead 0.012 `#d9a93a` on its top front edge. |
| Base | 2.80 x 0.08, y 0.11..0.19, z -0.36..+0.20. | Velvet `#8a1c27`. |
| Seat cushions x 4 | Each 0.68 x 0.13 x 0.56: y 0.19..0.32, z -0.32..+0.24, front edge rolled r 0.07, crown under 0.01. Centres x -1.05, -0.35, +0.35, +1.05 (pitch 0.70, seams at -0.70, 0, +0.70). **Seat top 0.32.** | `#a3202e`, piping 0.012 `#7a1822`, seams 0.02 `#5c121b`; velvet sheen as `cinemaseat` (1.18 at the top to 0.82). |
| Back | Frame 2.80 x 0.67 x 0.14, y 0.11..0.78, z -0.50..-0.36; top roll dia 0.12 at y 0.78 (**back top 0.84**). 4 back cushions 0.68 x 0.46 x 0.12, y 0.32..0.78, face at z -0.30 leaning back 8 deg, top corners r 0.10 (four soft arches), 2 stitched grooves each. | Frame `#8a1c27`, cushions `#a3202e`, grooves `#6f1620` 0.012 wide, every groove drawn once. |
| Arms x 2 | 0.16 wide (inner faces x -1.40 / +1.40), y 0.11..0.56, z -0.50..+0.26, half-round top r 0.08, front a scroll disc dia 0.16 with one drawn spiral (two different drawings). | `#8a1c27`, spiral `#6f1620`. |
| Star A (seat 4) | 5 points, 0.34 across, centre (1.05, 0.321, -0.04), one point toward -z. Reads in 04 only (a 17 px sliver from the front). | Fill `#c8352b`, satin hatching `#a82a22`, border 0.035 `#f2c94c` with 22 stitch dashes `#c79a2a`; own canvas. |
| Star B (back 4) | 0.30 across, centre (1.05, 0.56) on back cushion 4's face, one point up. The one the front cameras read (79-95 px in the wides). | Same colours, drawn separately (not a copy of A). |
| `glow` 0..1 | Both stars' gold goes emissive `#ffd23f` x 1.6 and a soft halo 0.55 across `#ff7a1c` at 0.35 x glow sits over each. Beat 2 (0 -> 1 in 12 frames, back to 0.3), beat 6 (pulses with the door). | |
| Step (`step: true`) | 1.70 x 0.40 x 0.36, centre (0.65, 0.20, -0.87): x -0.20..+1.50, top y 0.40. The Wizard stands on it. Hidden by the back from cams 01-10, 14, 15; its right end shows a little in 11-13, so it is a real piece. | Wood `#3a2418`, top felt `#6f1620`. |

**Sitting.** Every `sit` takes `seat: couch`, `height: 0.32`, `feet: [0.32, 0]` (boots about 0.15 past the front edge, soles about 0.20 above the floor: they dangle, as drawn in 01, 07, 10; tune at the layout gate so the legs clear the rolled edge).
The couch returns grip 0.32. `along` (metres from the middle):

| Who | Alone (beats 1-3) | Squeezed (beats 4-7) | After the hero leaves (beat 8) |
|---|---|---|---|
| Wedge, seat 1 | not there | -0.96 (x -1.40..-0.52, his side on the left arm) | -0.80 |
| Spud, seat 2 | -0.35 | -0.22, squash x 0.84 = 0.64 wide (x -0.54..+0.10); beats 5-6 squash x 0.74, y 1.20 | off the couch |
| Chip, seat 3 | +0.28 from beat 3 (touches the hero's side) | +0.38 (x +0.10..+0.67) | +0.20 |
| Seat 4, the star | empty | empty: Chip stops 0.03 short of the seam at +0.70 | empty |

Three seats are 2.10 wide; the three bodies are 2.21, so the hero gives 0.12. In beats 5-6 Wedge rolls 8 deg and Chip 10 deg toward him.

## 3. Small props

| Prop | Kind | Numbers |
|---|---|---|
| Click pen | `feltpen` reused, `scale: 1.5` (0.195 long, dia 0.027) | `color: "#2b2f3a"`, `cap: "#c9ced6"` (the silver end is the clicker), `felt: "#1d1a20"`. Fist round the barrel, cap end up, thumb pad on the cap. A click = thumb down 0.012 and back in 4 frames, the fist dips 0.006. Own R hand in beats 1-5, both hands in beat 6 (panel 12), own L hand from then on, so in 15 it is on the door side. The only pen in the film. |
| Popcorn bucket | `cinemabucket` reused, `scale: 0.75` (0.33 high, rim dia 0.315) | `fill: 1`, `puff` on every crunch. SIDE pose (05, 06, 09): hugged in his own L arm at his +x side-front, centre 0.30 right of him, y 0.50, tilted 20-25 deg to +x, face clear, in the air in front of the 3/4 seam. LAP pose (07, 10, 12): foot on his shins at y 0.26, heap top 0.63, his eyes over the heap. |
| Crumbs | `popcornrain`, `popcornpile`, `kernel` reused | Per crunch one `popcornrain` of 8-12 pieces from his mouth (y 0.55) to the hero's shoulder and lap, rise 0.10, flight 0.35 s. `popcornpile` r 0.07, n 7, h 0.02 on the hero's screen-right shoulder, fill 0 -> 1 over beat 3. A second pile r 0.14, n 9 on the floor at (0.38, 0, 0.55), fill 0 -> 1 over beats 3-6: the number that keeps growing. |
| Wedge's phone | `phone` reused, `scale: 1.8` (0.140 x 0.279) | `case: "#1d1a20"`, `glow: 1`, `halo: 0.26`. Two thumbs, screen to him; the lens sees the back and the glow on his face. |
| Hero's phone | `pingphone` NEW | The `phone` body (0.078 x 0.155 x 0.012, used at `scale: 1.8`), screen `#16263a`, lit. `count` 0..5: bubble i pops from scale 1.4 to 1 in 4 frames, older ones slide down one pitch. A bubble is a rounded bar 0.058 x 0.019 `#f3ead2`, pitch 0.024, first at y 0.128, with a dot r 0.006 (`#e0261c`, `#ff8a1c`, `#3f8fb0`, `#6cbf3a`, `#c9a0e8` in turn) and two grey lines `#8a8f96` 0.026 and 0.016 long: no letters. Halo `#a9dcff` 0.30 across, +30 % for 3 frames on each pop. Own L hand, edge hold, screen to the lens, centre (0.08, 0.80, 0.45) in 08. Count 0 -> 3 on the three "Thanks!". |
| Clipboard | `clipboard` reused, `face: 1` | Paper to the Devil, brown back `#8a6a3c` and steel clip to the lens in every shot. Own L hand; both hands in 11 and 13. Opt-in `flip` 0..1 (section 5): one sheet 0.21 x 0.30 `#f7f4ea` swings over the clip and hangs down the back, 12 frames (panel 13). |
| Crystal ball | `crystalball` NEW | r 0.10. Glass `#b9c8ff`, 3 drawn swirl strokes `#7f6bff` and `#e9f1ff` turning 0.3 turn/s on the clip clock, rim `#5b4bd6`, one highlight `#ffffff`; halo 0.42 across `#9fb4ff` at 0.55. `glow` 0..1.4: 1 at rest, 1.4 for 6 frames on each spoiler. On his cupped own L mitten (grip `cup`) at (0.72, 1.00, -0.42), over the back top, right of his face. Not `orb`: its halo and rim are fixed green. |

## 4. Marks per beat (root x, z, yaw)

Devil spots: **D1** (1.85, 0.70) by the couch's right end; **D3** (2.55, 1.60) front right, out of every couch shot; **D4** (1.55, 1.50) left of the door line;
**D6** (2.75, 1.60) aside. Walk lanes in front of the couch: Chip z 0.66, Wedge z 0.82. Everyone not listed is hidden.

| Beat | Panels | Marks and the one visible change |
|---|---|---|
| 1 welcome, rule | 01-03 | Spud sits along -0.35, yaw 0, pen in his R hand, eyes to the Devil. Devil D1, yaw -30, both arms wide, clipboard in his L hand. Door shut, star glow 0. Chip waits in the door box at (2.25, -2.00). |
| 2 the seats | 03, 04 | Devil D1, yaw -55, R arm points at seat 1, seat 3, then the star (glow 0 -> 1). Spud turns his head 50 deg to the star and gulps. During 04 the Devil, off screen, walks to D3, yaw -40. |
| 3 the chewer | 05, 06 | Door open 0 -> 1 in 5 frames. Chip: (2.25, -2.00) -> (2.25, -0.90) -> (2.05, 0.10) -> (1.75, 0.66) -> (0.28, 0.66), turns, sits along +0.28, leans 10 deg to the hero, bucket SIDE. Door shuts in 8 frames. Devil D3. |
| 4 reply all | 07, 08 | Door bangs again. Wedge, eyes on his phone: (2.25, -2.00) -> (2.25, -0.90) -> (2.10, 0.20) -> (1.85, 0.82) -> (-0.96, 0.82), crossing the front of 06 as a 0.4 s wipe, turns, sits along -0.96. Spud slides to -0.22, Chip to +0.38, bucket LAP. Hero's phone up in his L hand, count 0 -> 3. At the cut to 08 the Wizard is shown on the step at (1.30, -0.87), y 0.40; in the last 0.6 s he walks to (0.28, -0.87) and his hat slides into 08's right edge. |
| 5 spoilers, chaos | 09, 10 | Wizard (0.28, -0.87), y 0.40, yaw -8, leaning 18 deg over the back top, roll 6 deg to the hero: face at (0.20, 1.07, -0.35), above Chip (top 0.87), beside the hero's ear; R forearm on the back top, ball in his L hand. Spud squash x 0.74. Bucket SIDE in 09, LAP in 10. Devil D3, off screen. |
| 6 the worst one | 11, 12 | At the cut to 11 the Devil is at D4, yaw +12, reading, both hands on the clipboard. Door: open 0 -> 0.03 -> 0 at 8 Hz for 0.6 s (rattle), glow 0 -> 1, the two feet shadows slide in over 6 frames. Mash waits in the box at (2.45, -2.00). Spud: pen in both hands at y 0.62, 3 clicks; on each one Wedge, Chip and the Wizard flinch 0.03 away from him, eyes shut, in the same frame. |
| 7 wrong page | 13, 14 | Devil D4. 13: yaw +14, frowns, `flip` 0 -> 1. 14: yaw -25, grin, R arm points at the hero, then his L thumb goes back at the door and he takes two steps to D6, yaw -60, which uncovers the door. Spud seated, pen in his L hand, hope, then his face falls. |
| 8 the friend | 14 tail, 15 | Door opens softly, 10 frames, no bang. Mash steps to (2.45, -1.45), yaw -15, smiling, one hand up. Spud slides off the couch across the cut and stands at **S15** (0.78, 2.30), yaw +5, back to the door, shoulders up, pen in his L hand at (1.20, 0.80, 2.42). He clicks once. Mash: both hands on his cheeks, knees bent 0.08, leaning back 6 deg. Wedge to -0.80, Chip to +0.20 (they sag into his gap). Devil D6. Cut 0.5 s after the scream. |

Why the hero stands in 15: seated, the door is 2.5 m to his right and Wedge sits on the only line that puts the hero in front of it. Why he faces us: he does not dare
look at the door (beat 6: "please be another chewer"), so the nervous click and the innocent smile both play to the lens.

## 5. New, reused, engine keys

- **New kinds (3):** `hellcouch` 3.12 x 0.84 x 0.76; `pingphone` 0.078 x 0.155 x 0.012 (used at 1.8); `crystalball` r 0.10.
- **Reused as built:** `reviewdoor` (hell, scale 1.3), `cinemabucket` (0.75), `popcornrain`, `popcornpile`, `kernel`, `phone` (1.8), `feltpen` (1.5, recoloured), `lightpool`, `shadowpool`; cast files of Spud, Chip, Wedge, Mash, Devil, Wizard.
- **Reused with one opt-in key each (defaults unchanged, so older clips render the same):** `lobbyroom` `holes`; `wallclock` no hands and no centre cap (plus `rim` colour); `clipboard` `flip`.
- **If `holes` is not done in an hour:** keep the window hole and fill it with `curtainwindow` at `open: 0` (in frame at the left of 01, 07, 10, 12); stand the door 0.11 proud of the solid wall; Chip, Wedge and Mash are shown on a cut one step into the room with the door already open, and Mash stands at (2.45, -0.95) in front of the frame.

## 6. Departures from the sheet, each with its reason

1. **07, 10: Chip and Wedge swap sides** (built order left to right: Wedge, Spud, Chip, star). The sheet disagrees with itself (06 has Chip on the door side, 07 and 10 on the far side); the built order follows 05-06 and the outline ("on his other side"), and Chip at 0.87 high lets the Wizard's face clear him; Wedge at 1.32 would hide it.
2. **12:** drawn as Spud, Chip, Wedge, Wizard in a row; built in seat order from the front.
3. **04:** the door is not in frame (79 deg off the lens once the star and the hero are stacked). Built from above, as drawn, not the "low angle" of the prompt text.
4. **13:** no door behind the Devil (16 deg outside the frame); the couch and the Wizard's hat are behind him.
5. **13-15:** Wedge, Chip and the Wizard stay on the couch (the sheet leaves them out of 13 and 14); in 15 the hero stands.
6. **Clock:** 0.95 m right of the drawn spot and lower (rows 773-899 in 01, drawn near row 540), so captions and the Wizard's hat never cover it; ticks kept, because a blank disc at 150 px reads as a plate.
7. **Heights:** a seated potato is taller than a standing one (legs 0.14). The seat is 0.32, not the engine's 0.42, so the hero's top (1.22) meets the Devil's horn tips (1.20); in 02 he looks across at the Devil, not up.
8. **Star twice:** on the seat (as briefed) and on the back cushion (as drawn in 01, 10); the seat one alone is a 17 px sliver from the front.
9. **03:** the Devil points with an open hand (as drawn); the prompt's pen is dropped so the hero's is the only pen. **09:** the ball is on the far side of the Wizard's face (as drawn), not at the hero's ear.
10. **11:** the "shadow of feet" is two soft ovals in the light pool; the door leaf has no gap.
11. **Outline, not sheet:** popcorn bucket (as drawn), not a bag of chips.

## Open questions (the default is built)

1. Seat order Wedge, Spud, Chip, star, or the mirror as drawn in 07 and 10? **Default: Wedge, Spud, Chip, star.**
2. The hero stands in the foreground for 15? **Default: yes.** The other way is cam 05's diagonal with both faces near 200 px and the pen 76 px.
3. Two stars (seat and back)? **Default: both.**
4. Clock with ticks and no hands, or the blank dial as drawn? **Default: ticks.**
5. The Devil's "...Hell." in beat 4 has no panel. **Default: off screen over the last 0.8 s of 08.**
6. Wall band plum as drawn (`#3f2838`) or the lobby as built (`#3a2a2e`)? **Default: as built** (the outline lists the lobby colours as reused).
7. The friend's door opens softly, the three before it bang. **Default: soft**, so the last arrival feels different before the scream.
