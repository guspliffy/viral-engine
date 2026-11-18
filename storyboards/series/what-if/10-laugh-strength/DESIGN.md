# There's a catch 10 — Laugh strength: design

Written by the creative director (Fable, 18 Nov 2026) from the brief
/mnt/project-files/videos/what-if/10-laugh-strength/sol/prompt.md and OUTLINE.md, on the director's ask. Projections
are computed from the rig (leg 0.14 m, eyes 0.126 × half body height above the body centre), not rendered: run
`qa/camfit.mjs` on the three cameras before staging.

Build for 1080 × 1920 at 30 fps, about 21.1 s (frames 0–633). World axes are +x right, +y up, +z toward camera.
Dimensions are W × H × D in metres, positions are mesh centres unless marked as feet, tops or grips. The platform top
is y 0.03: every mark with |x| ≤ 1.0 and z −1.6 to −0.4 has feet at y 0.03, everything else y 0. `set-gym.js` is not
changed. All new pieces are prop kinds in `engine/page/props-gymlaugh.js`. Times follow the brief; voice lengths move
them, the frame offsets after each tick stay.

## 1. Gym upgrade (5 new kinds)

| Kind | Geometry, position and finish |
| --- | --- |
| `strengthboard` | Section 2. |
| `gymmarks` | One prop at the origin holding four one-off canvas decals, all `noOutline`, no repeats. **Mirror glaze** 3.0 × 1.6 at (0, 1.55, −1.974): a hazy painted reflection of the room behind the camera, three tall window shapes #F6ECD2 at 18 % alpha, four ceiling-lamp ovals #FFFFFF at 12 %, a treadmill silhouette #9FB2C0 at 20 % on the left third, two diagonal sheen strokes 0.05 m wide at 10 %, five glove smudges below y 1.2. Nothing sharper than 0.03 m, so nobody looks for the cast in it. **Upper wall wash** 3.9 × 2.3 at (0.06, 3.60, −1.992): brush mottling #D6DEE5 on the wall's #DFE6EC, two hairline cracks #C9D2DA, one faded 0.9 × 0.5 rectangle where a banner hung. Keep every mark within 5 % of the wall's value: this is the caption background. **Platform marks** 1.7 × 0.9 at (0, 0.0345, −1.0), flat: chalk boot prints #E9E6DA at 35 % around (0.76, −1.02), three scuffs #2C2F36, a worn patch #454952 0.5 × 0.3. **Floor tape** 3.4 × 2.2 at (0.06, 0.002, +1.75), flat: one diagonal lane tape #F2C14E 0.05 m wide with two torn gaps, chalk dust near the mats, four uneven tile-edge highlights #3A3E47. |
| `crashmat` | 1.25 × 0.08 × 0.85 folding mat, 0.02 m rounded edges, vinyl #2F6FD1 top, #2859A8 sides, three fold seams #1F4686 drawn at uneven spacing, one cream #F3EAD2 carry strap 0.04 m wide on the front side, four crease strokes. Mat A at (−0.90, 0.04, +0.12) yaw +4°. Mat B at (+0.40, 0.04, +0.16) yaw −3°; its back edge (z −0.27) also chocks the dropped bar. |
| `towelshelf` | Steel unit 0.34 × 1.90 × 0.30 at (1.73, 0.95, −1.80), frame #9AA3AD 0.03 m tube, four shelves #C4CAD3 at y 0.25, 0.70, 1.15, 1.60. Eleven rolled towels Ø0.11 × 0.26 in #F3EAD2, #2FA59A and #F2C14E, each with its own spiral end stroke #B9B4A4; one towel unrolled over the y 1.15 shelf edge, hanging 0.22 m. It hides the poster's sliver at the right frame edge. |
| `gymbag` | Duffel 0.52 × 0.26 × 0.26 at (1.12, 0.13, +0.95) yaw −18°, canvas #2F6FD1, cream #F3EAD2 straps 0.035 m, zip #1F2937 half open, a #F3EAD2 towel draped over the left end. Steel bottle Ø0.07 × 0.24 #C4CAD3 with a #E8402F cap at (0.80, 0.12, +1.02). Foreground corner only (rows 1540–1620). |

Existing props: `weightbench` at feet (−0.57, 0.03, −1.00), long axis on x, legs on the platform at x −0.97 / −0.17.
`barbell` in Spud's gloves at frame 0 (section 4). The upper third stays the wall wash only: nothing new above y 2.40.

## 2. STRENGTH board (`strengthboard`)

- **Case.** 1.06 × 0.70 × 0.07 at (0.95, 1.99, −1.945), face at z −1.91, hung in front of the mirror's upper right. Powder-coated steel #23272E, 0.035 m bezel #2E343C, four screw discs Ø0.016 #9AA3AD 0.04 m in from the corners, two steel straps 0.03 × 0.09 × 0.006 #9AA3AD at x 0.60 / 1.30 hooked over the mirror's top rail (y 2.37).
- **Face** (board-local u right, v up, origin at the centre; inner area 0.99 × 0.63). Header strip v +0.175 to +0.315: **STRENGTH** centred at (0, +0.245), hand-lettered caps 0.085 m, #F3EAD2, minimum stroke 0.012; a brass rule #B08A3C 0.008 m at v +0.17.
- **Pictogram.** Flexed arm centred at (−0.345, −0.075), box 0.27 × 0.36, fill #F2C14E, outline #14161A 0.016 m. Outline in box-local metres: shoulder (+0.135, −0.16), elbow underside (−0.02, −0.16), elbow corner (−0.075, −0.10), forearm up to (−0.075, +0.07), fist through (−0.10, +0.08), (−0.105, +0.165), (−0.02, +0.18), (+0.005, +0.10), inner forearm down to (0, 0), bicep arc peaking at (+0.07, +0.055), back to (+0.135, −0.02), close. About 82 × 109 px in the wide, 27 × 36 px at 360 px width.
- **Number bay.** 0.69 × 0.40 at (+0.14, −0.075), face #171A1F, recessed 0.006. States `["x1","x10","x100","x1,000","x10,000"]` hand-lettered once each on one strip canvas 1024 × 2970 (594 px per state, state 0 at the bottom), white ink on transparent so the material colour tints it. Digits 0.205 m high, 0.10 wide, minimum stroke 0.030; the "x" 0.12 high; comma 0.03 wide; "x10,000" is 0.655 m of ink, right-aligned 0.017 from the bay edge. Digits are 62 px high in the wide (21 px at 360 px width), 66 px in the hero shot.
- **`step`** (number 0–4). The bay plane shows a 1/5 window of the strip, texture offset v = step / 5: integer i shows state i, a fraction shows the two neighbours mid-roll, like a pump counter drum. No stored state, any frame renders alone. Five level pips 0.05 × 0.03 at v −0.245, u −0.14 to +0.14 (pitch 0.07): pip k is lit when k ≤ round(step); lit is the ink colour as a flat unlit material, unlit #3A3F47.
- **`drain`** (0–1). Ink and lit pips lerp #FFC65A → #E8402F, bay face #171A1F → #2A1516. No bloom, no halo.
- **Tick up** (6 frames, storyboard keys `step` from i): +0.10, +0.38, +0.72, +0.98, +1.06, +1.00. The 6 % overshoot is the kick. Sound on the first frame: `kenney/interface/switch_002` (a scoreboard relay clack).
- **Tick down** (6 frames): −0.12, −0.45, −0.80, −1.00, −0.97, −1.00. Sound `kenney/interface/switch_005`. `drain` keys with the steps: 0 at x10,000, 0.25 at x1,000, 0.5 at x100, 1 at x10 and x1.

| Tick | Start (s / frame) | After it |
| --- | --- | --- |
| x10 | 3.50 / 105 | one-hand lift |
| x100 | 5.70 / 171 | plates, bend, press |
| x1,000 | 8.80 / 264 | one-hand hold of the loaded bar |
| x10,000 | 11.20 / 336 | bench lift |
| down to x1,000 | 15.95 / 478 | bench 1.02 → 0.96 |
| x100 | 17.00 / 510 | 0.96 → 0.90 |
| x10 | 17.80 / 534 | 0.90 → 0.84 |
| x1 | 20.20 / 606 | arms give at frame 612 |

Each up-tick starts 4 frames after the laugh's first "ha", never before it.

## 3. The power look

Same on all four up-ticks, starting 2 frames after the tick's first frame, nothing drawn around him:

- Frames +2 to +6: chest up. Body pitches back 5°, stretches to 1.05 in y and 0.98 in x and z about the feet, eyes open 15 % wider, brows up 0.02 m. Use `breath(c, t, "spud", { big: 1, hold: 0.2 })` plus one scale key.
- Frames +6 to +12: hold. Frames +12 to +18: settle to pitch back 2° and scale 1.00. He keeps the 2° until the next tick, so he stands a little taller each time without growing.
- Sound: one short nose inhale, 0.25 s. No glow, no symbols.
- Drain is the reverse, smaller: each down-tick pitches him forward 3° and adds an arm tremble of ±0.006 m at 9 Hz.

## 4. Staging

Marks are foot roots (x, z). Bar line means the barbell's axis.

| Beat (s) | Marks and action |
| --- | --- |
| 1, 0.0–2.6 | **Spud** (0.76, −1.02) facing camera. Empty bar (`plates` 0) level in both gloves at bar-local ±0.30, bar centre (0.76, 0.52, −0.60): he has it at hip height and cannot get it higher. Frame 0 is mid-heave, body 6° back; heaves at 0.4 and 1.6 s lift it 0.05 m and it sinks back. **Wedge** (−0.80, −0.48), turned 30° toward Spud, eyes on him, screen-right glove pointing, ending at (−0.06, 0.74, −0.18). **Chip** stands on the bench at (−0.19, −1.00), feet y 0.45, bouncing 0.03 m at 4 Hz, pointing with the glove ending at (0.05, 0.92, −0.45). Board step 0. |
| 2, 2.6–4.5 | Chip's line. Tick at 3.50, power look, then Spud's screen-left glove lets go and the other takes the bar's centre: bar to (0.76, 1.35, −1.02) by frame 129, level, held. |
| 3, 4.5–7.5 | Wedge's line while Spud brings the bar back to hip in both gloves by 5.0 s. Tick at 5.70, power look. Plates: `plates` 0 → 3 linear over frames 183–195 (red, blue, yellow, 4 frames each, `kenney/impact/impactMetal_heavy_000`, `_001`, `_002` on frames 183, 187, 191), `bend` 0 → 0.55 and a 0.06 m dip of bar and knees over the same frames. Press to y 1.35 over frames 198–213, `bend` 0.55 held. |
| 4, 7.5–9.5 | Chip's line, both howl from 8.5. Tick at 8.80, power look, then one glove lets go: loaded bar overhead in one hand from frame 276. |
| 5, 9.5–13.5 | Wedge's line. Spud lowers the bar to hip with arms forward, bar line z −0.50, and lets go at frame 297: physics drop of 0.29 m onto the platform (rest centre (0.76, 0.23, −0.50), `bounce` 0.1, `friction` 1.0, `impactMetal_heavy_003`). Wedge sits back onto the bench 10.2–10.7 (ride `weightbench`, offset [−0.33, 0.42, 0]); Chip drops to sit 10.4–10.8 (offset [+0.40, 0.42, 0]); both turned 8° toward each other. Laugh, tick at 11.20, power look, Spud strides left to (0.30, −1.02) by 11.90. **Cut on the stride** to the hero camera. |
| Hero, 11.9–15.0 | Spud at (−0.57, −1.00) under the bench, gloves flat under the pad frame at bench-local x ±0.30 (0.015 m inside the legs). First frame: bench feet y 0.80, Spud crouched 0.10, gloves y 1.115. Frames 357–372: bench feet to **1.02** with a 0.02 overshoot, crouch to 0. Full lift: gloves y 1.335, pad underside 1.36, pad top 1.44; Wedge at x −0.90, eyes y 1.99, crown 2.42, sprout 2.50; Chip at x −0.17, eyes 1.74, sprout tip 2.12; Spud's sprout tip 1.17, 0.19 under the pad. The friends' laughs stop by 13.2. Cover frame at 12.9 s. Narrator over the hold. |
| 7, 15.0–18.0 | Close 15.0–16.4: Chip's line, tick down at 15.95, bench to 0.96 over 8 frames, both faces drop with it. Wide from 16.4: Wedge's line; x100 at 17.00, bench 0.90, Spud crouch 0.05 and a 0.08 m shuffle right; x10 at 17.80, bench 0.84, crouch 0.10, shuffle 0.08. Bench rolls ±2° at 3 Hz from 17.0. |
| 8, 18.0–20.0 | Spud's line, eyes up at the pad. Third shuffle: bench centre ends at x −0.33. Friends lean 10° forward to look down at him, then turn their eyes to each other at 19.6 (heads turn 20°). |
| 9, 20.2–21.1 | x1 at 20.20. Frame 612: the bench tips 20° toward camera and is released; the friends leave the ride on keyed arcs. Spud tips back onto his back, crown toward the wall, boots toward camera, body centre (−0.33, 0.36, −1.00). The bench lands across his belly at frame 621 (feet y 0.35, pad top 0.77, one 0.03 bounce, belly squash 8 %): it rests on him, its legs straddle his sides. Wedge lands seated on mat A at (−0.84, 0.08, +0.10), Chip on mat B at (+0.50, 0.08, +0.15), both facing camera, at frame 626 (`impactGeneric_light_00x`). **Last frame 633:** board x1 in red, loaded bar at rest on the right, Spud's two boot soles toes-up, round belly under the pad, both gloves flopped palms-up either side, sprout tip above the pad; Wedge and Chip sitting dazed on the mats, eyes on each other. Hard cut to frame 0. |

The crash stays safe because only the empty bench lands on Spud, onto the roundest part of him, and both friends
land on their bottoms on mats.

Departures from the brief, the director's call: Chip starts on the bench instead of beside the platform (the frame is
3.2 m wide and the bar is 1.52 m); Spud holds the empty bar at hip height instead of pulling it from the floor (no
gloves at floor level); the plates arrive by the barbell's own grow-in, as in the October gym clip.

## 5. Cameras

**Wide (locked, 0–11.9 s and 16.4–21.1 s).** Camera (0.06, 1.62, 7.85), look at (0.06, 1.62, −1.00), vertical FOV 36°.
Scale is 334 px per metre at z −1.0, 302 at the board. The mirror's top rail is at row 735, so rows 0–735 are the
wall wash only.

| In the wide | x px | Row |
| --- | --- | --- |
| Board face | 649–970 | 742–954 |
| Spud's eyes at the bar mark | 782 | 1290 |
| Bar at hip / overhead | 519–1051 / 520–1026 | 1345 / 1050 |
| Loaded plate tops overhead | | 983 (29 px under the board) |
| Wedge's eyes, standing | 222 | 1292 |
| Chip's eyes, standing on the bench | 454 | 1212 |
| Wedge / Chip eyes, seated on the floor-level bench | 207 / 461 | 1175 / 1259 |
| Full lift: Wedge's eyes / crown / sprout | 207 | 832 / 693 / 666 |
| Full lift: Chip's eyes | 461 | 919 |
| Full lift: Spud's eyes / gloves | 322 / 230 and 430 | 1291 / 1055 |
| Full lift: body edges, Wedge left / Chip right | 73 / 558 | |
| At x1 (bench centre −0.33, feet 0.84): Wedge / Chip eyes | 291 / 543 | 894 / 981 |
| Last frame: Wedge / Chip eyes on the mats | 183 / 710 | 1353 / 1452 |
| Spud's feet / mat A front edge | | 1490 / 1615 |

The highest face in the wide is at row 832 and the highest sprout at 666: rows 200–640 hold no face in any beat.
Chip's body stays 10 px or more left of the board at the end of the shuffle.

**Hero, low angle (11.9–15.0 s).** Camera (−1.25, 0.36, 3.45), look at (−0.20, 1.75, −1.00), vertical FOV 52°, 17° up.
Wedge's sprout 649, crown 679, eyes (268, 796). Chip's eyes (577, 934). Pad's lower front edge from (171, 1084)
to (610, 1107). Spud's gloves (255, 1114) and (511, 1126), crown row 1243, eyes (401, 1405), feet row 1720. Board face
x 673–1003, rows 885–1108, reading x10,000 beside Chip. The dropped bar lies lower right, cropped by the frame edge.
Spud is 477 px tall under a 458 px load that is 600 px wide.

**Close (15.0–16.4 s).** Camera (−0.62, 1.95, 4.65), look at (−0.62, 1.95, −1.00), vertical FOV 30°. Wedge's eyes
(352, 933), brows row 839, crown 662. Chip's eyes (839, 1099). Pad top row 1292. Spud's gloves (381, 1350) and
(762, 1350), sprout tip row 1455. The board is out of frame: the tick is heard and seen as the 40 px drop.

## 6. Glitch risks

- **Bar through Chip.** The bar's left tip is at x 0.00 and Chip's right side at 0.095, 0.14 m behind the bar line. Keep Chip's pointing glove forward of z −0.50 and Spud's lift path in the plane from z −0.60 to −1.02.
- **Plates popping on.** The grow-in is a scale. Keep it inside the 12 frames with the dip and the three clanks; never hold a frame with a half-grown plate.
- **Dropped bar rolling.** If it travels more than 0.10 m after landing, key the rest pose from frame 306. Its plates' back rims pass 0.09 m in front of Spud's body on his stride.
- **Sprout through the pad.** Clearance is 0.07 m on the hero shot's first frame and 0.11 at x10. Never lower the bench without the matching crouch.
- **Gloves and bench legs.** Glove centres at ±0.30, legs' inner faces at ±0.375: check both hands in the hero shot at half speed. Palms stay 0.005 under the frame so nothing floats.
- **Friends inside each other.** Seated bodies clear by 0.005 m at x −0.46. Keep the ride offsets exact and yaw at most 8°.
- **Wedge's frame edge.** His lifted body starts at x px 73 in the wide and 63 in the hero shot; his landing at 29. No lean to screen left.
- **Crash cover.** Wedge on mat A covers Spud's left 70 px. If he lands right of x −0.84, Spud's belly disappears.
- **Bench on the belly.** If props cannot collide with a lying body, key the fall as y = 0.84 − 4.9 t² to feet y 0.35.
- **Poster and punching bag.** The camera's x 0.06 keeps the bag out on the left; the towel shelf covers the poster on the right. Recheck both edges if the camera moves. In the hero shot the poster starts 3 px outside the frame.
- **Mirror.** No cast reflections: keep the glaze hazy and never brighter than the wall.
