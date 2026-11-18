# There's a catch 10 — Laugh strength: the STREET part (beats 4-end to 11)

Designed by Fable (creative director, 18 Nov 2026) from OUTLINE-v2.md and the director's fixed decisions. It adds to
DESIGN.md (the gym), it does not replace it. Projections are computed by hand from the rig (Spud 1.02 m to the crown,
eyes 0.635 above his feet; Wedge 1.12 / 0.69; Chip 0.67 / 0.44), not rendered: run `qa/camfit.mjs` on every camera
before staging. Axes: +x right, +y up, +z toward the near pavement. Pavement y 0, road y −0.12, kerb z −1.15.
Marks are foot roots (x, z). Times are shares of each beat; the seconds are my estimate, the measured lines decide.

## 1. Place map (set `street`, default variant with the bus stop, `parking` off)

The gym is on the near side, behind the camera, and is never seen (no facade to build). All cameras stand on the
near side or in the road and look toward the shop fronts, except the hero cameras, which stand in the near lane and
look back down the street (−x).

| Thing | Position and size |
| --- | --- |
| Bus (`bus`, scale **1.8**) | 7.02 long × 1.8 deep × 2.93 high, underside 0.34 above the road, door 1.04 × 2.12 (sill 0.47). Near side on z −1.45, facing +x. **Parked** with its origin (door) at x −4.6, y −0.12: front face at x −3.61. **Stopped** (after beat 6) origin x −0.55: front face x +0.44, the door 0.9 m right of the set's stop pole. Door `open` 1 from its first frame to the last (it is parked with the door open, and it never closes). |
| Bus shelter (`busshelter`, w 2.4, d 0.8, h 2.2) | Floor centre (−4.6, 0, −0.55): the parked bus waits at it. `streetlamp` h 3.2 at (−2.6, 0, −0.75), `recyclebin` at (−6.2, 0, −0.6). These also dress the left edge of the hero frame. |
| Car (`citycar`, scale **0.75**, colour #3F7FD0, yaw 90 so its front is +x) | 2.48 long × 1.65 wide × 1.55 high. Parked on the far kerb at **A** (4.6, −0.12, −5.6). After the lift it lands one bay along at **B** (6.7, −0.12, −5.6). Both are outside the hero cameras' view. |
| Bar (`barbell`, `plates` 3, `bend` 0.55) | Falls from (5.0, 9.0, −4.4) onto the car's near roof edge, ends lying in the road at (3.3, −0.10, −4.3), yaw 20°, and stays there. |
| Spud | 5b (3.3, −2.4) · under the car at A · lands the leap at **(0.99, −2.35)** · under the bus at **(−2.53, −2.35)** facing +x. |
| Chip | In the near lane, the bus's lane, at **(2.05, −2.35)** from 5b to the end of beat 7. |
| Wedge | On the pavement at (1.4, −0.75) in 5b · steps back to (3.6, −0.6) during the car lift (out of the bus-stop frame) · into the road at (3.25, −2.3) for beat 7. |

Scale ladder, each feat bigger: bar 1.5 m, car 2.5 m and 1.5 × Spud's height, bus 7 m and 2.9 × his height.
The bus should be far bigger than Spud: the cover is a 1.02 m potato under a 7 m bus.

**Why the bus rolls (world logic, my addition to beat 6).** No driver, nobody inside: the bus is parked at the
shelter, empty, door open. Spud drops the car back on its wheels, the thump shakes the street, the bus's brake lets go
(`hiss`) and it rolls down the lane at Chip. So his own show-off causes the danger, as the tossed bar caused the car,
and an empty bus is safe to climb into, lift and drop. Cost: shot 6a, 0.9 s.

**Light for the whole street part.** One low sun from the near side, toward the hero camera: light direction from
(0.72, 0.34, 0.60), 20° high, warm #FFE2B0. At 20° it reaches under the lifted bus from the door side and lights
Spud's face (lit up to y 0.64, his eyes are at 0.52). If his face under the bus measures under 60 % of its sunlit
value in the still, lower the sun to 15° before touching anything else.

## 2. HUD chip

Top-left is right. Box left-anchored at x 48, **y 214–310** (the engine's day-chip slot), 96 px high, plate #171A1F at
85 %, arm glyph 72 px #F2C14E, digits 60 px high (20 px at phone size). It grows to the right: "x1" 190 px wide,
"x1,000,000" 470 px (ends at x 518). Tick: the 6-frame kick of the wall board (scale 1.00 → 1.18 → 1.00), amber
#FFC65A → red #E8402F on the drain. It is on from the first street frame, already reading x1,000 (no pop-in).
Street captions keep their centre at row **430 or lower** (two lines: rows 366–560) so the chip never touches them.
No face comes above row 640 in any street shot except crowns and sprouts (table in section 3). The chip may stay on
the cover frame: a flexed arm and "x1,000,000" read without English.

## 3. Shot list

F = focal length in px for the row maths. "Cap" = where the caption sits. Counter ticks are in bold.

| # | Beat, share, ≈ s | One action | Camera: pos / look / fov | Framing, faces, caption |
| --- | --- | --- | --- | --- |
| 4z | Beat 4, last 1.6 s (gym) | After the x1,000 pump Spud dips (crouch 0.5, bar to y 1.05, 5 frames) and heaves: the bar leaves his gloves straight up (`c.throw`, 9 m/s) and is out of the top of frame in 8 frames. Frame +10: glass smash, `shake` 0.04 for 0.2 s, a plaster-dust `poof` falls in from the top edge. All three look up; Spud `worried`, gloves still up and open. Cut on the look, 12 frames after the smash. | TOSS (1.9, 0.4, 2.6) / (0.35, 1.45, −1.0) / 52 | Low three-quarter: Spud large at right, Chip on the bench behind him at left, Wedge may crop. The top 40 % is wall: the bar's exit path. Cap row 430. |
| 5a | Beat 5, 0–17 %, 1.3 s | Hard cut to the street, already mid-fall: the bar is 2.5 m above the car on the first frame, hits the near roof edge at frame 5, the car rolls 180° away from us onto its roof (physics `knock`; if it does not settle wheels-up within 0.3 m of A, key it: 0.5 s, centre up 0.35 m then down). Wheels spin on. `shake` 0.05. | CAR-SIDE (4.6, 1.5, 1.2) / (4.6, 1.3, −5.6) / 40 | Side-on, the car 962 px wide, shops behind. HUD **x1,000** from frame 1. No caption. |
| 5b | 17–57 %, 3.0 s | Spud runs in from the bottom right, stops at (3.3, −2.4), looks at the car (back to us 0.4 s). Chip and Wedge skid in at left, pointing at him: "HA HA! You broke a car!" Spud turns to them, `worried` → **x10,000** → power look → `cocky`. He turns and strides at the car. Cut on the stride. | STREET-B (2.2, 1.45, 6.6) / (2.2, 1.0, −2.4) / 36 | Wedge left (eyes row 1117), Chip centre (1182), Spud right (1118), the upturned car behind Spud top right. Faces three-quarter to camera, as in the gym. Cap row 430 over the shops. |
| 5c | 57–84 %, 2.0 s | On the cut he is under the upturned car, gloves flat under its roof, car 0.3 m up. He presses it overhead in 0.4 s (roof underside 1.33 above his feet), holds 0.5 s, then pushes it up and right: `c.throw` to B, in 0.6 s, half a roll, it lands on its wheels and bounces once. Thump, `shake` 0.06 for 0.25 s, a car-lock chirp. | CAR-LOW (4.6, 0.3, 0.4) / (4.6, 1.5, −5.6) / 44 | Low and frontal: Spud 404 px, eyes row 1347, the car over him to row 498. No caption (no line in this shot). |
| 5d | 84–100 %, 1.2 s | Hero pose in the same shot: arms `hips`, chest up (the power look's 2° held), leaf and sweater hem blown toward −x, a dust `poof` drifting through. | same, push in to fov 38 over 1.2 s | Spud alone, the car's nose at the right edge. |
| 6a | Beat 6, 0–20 %, 0.9 s | The same thump, seen at the stop: the parked bus rocks (`roll` ±1.5°, 2 swings), `hiss`, its wheels start to turn, it creeps 0.4 m. | STOP (−1.2, 1.3, 3.4) / (−4.2, 1.4, −2.0) / 40 | Three-quarter on the bus's front and open door, the shelter behind it. Nobody at the windscreen. |
| 6b | 20–50 %, 1.3 s | Chip in the lane, doubled over laughing at Spud's pose, eyes shut. Behind him the bus front slides into the left of frame, growing. **x100,000** on his laugh. | BUS-STOP (1.25, 1.3, 6.4) / (1.25, 1.2, −2.35) / 36 | Side-on, frame x −0.35 to 2.85. Chip at right of centre, eyes row 1190. Cap none (the laugh is a sound). |
| 6c | 50–100 %, 2.2 s | Same shot. Spud's leap comes in from the upper right as one side-on arc (4.9 m, 0.45 s, full speed), lands at (0.99, −2.35) with his body three-quarter to camera (turned 50° toward the bus, never in profile), the bus-side arm straight out to his side. The bus front meets the palm at x 0.44 and stops dead in 3 frames: the body rocks forward 2° and back, `shake` 0.05, tyre screech, dust at the front wheel. Hold 0.8 s: palm flat on the bumper, other glove on his hip, he has not even looked at the bus; his eyes go to Chip, who opens his. | same, locked | Left to right: 0.79 m of bus, Spud, 0.45 m of air, Chip. Spud teal on the yellow bus front. |
| 7a | Beat 7, 0–35 %, 2.3 s | Chip jumps, Wedge steps into the road: "HA HA! You're a SUPERHERO!" Spud turns to them, palm still on the bus, `delighted`. | STREET-B again | Spud left, Chip centre, Wedge right. Cap row 430. |
| 7b | 35–80 %, 3.0 s | Wedge points past Spud at the bus: "Trust me... he can't lift the bus with US in it!" On "US" both walk left along the pavement. | same | Same frame; Spud's eyes follow them. |
| 7c | 80–100 %, 1.4 s | At the door: backs to us, a hop each (Wedge first, 0.3 s apart) into the open doorway. | DOOR (−0.2, 1.4, 5.2) / (−0.55, 1.3, −1.45) / 36 | The door centred, the stop pole and its sign at the left edge, the route sign above. No caption: Chip's laugh from inside. |
| 8a | Beat 8, 0–25 %, 0.9 s | Spud at the bus front, the friends' laughs from inside: **x1,000,000**, power look, he strides under the bus. Cut on the stride. | LINE-A (5.4, 0.3, −1.5) / (0.99, 0.85, −2.35) / 36 | Low on Spud (670 px), the bus front behind him filling the frame, the friends small at the windscreen above. No caption. |
| 8b | 25–100 %, 2.7 s | On the cut the bus is 0.3 m up, Spud crouched under it. Up in 0.5 s to underside **1.33 above his feet** (overshoot 0.03, settle), wheels hanging and still turning, dust falling off them. Both friends at the windscreen, laughing until 60 %, then they look down. **Cover frame at 45 %.** | HERO (11.0, 0.35, −1.45) / (−1.0, 1.93, −2.35) / 27 | Section 4. No caption, no line: the picture and the music. |
| 9a | Beat 9, 0–24 %, 1.3 s | "But there's a catch." over the held lift. The friends' faces fall. | HERO, locked | Cap row 320, one line (rows 256–384, on the roof and the top of the windscreen; the friends' brows start at row 630). |
| 9b | 24–54 %, 1.6 s | Chip: "...Whoa." Both look down past us, mouths shut. **x100,000**, red creeping in: the whole bus drops 0.10 m and both faces drop 66 px with it. | WINDOW (5.6, 2.75, −2.3) / (0.3, 2.70, −2.35) / 30 | Head-on at their height: the windscreen 1002 px wide, Chip left and Wedge right, eyes rows 970–990, crowns below row 690. Cap row 430 on the roof and route sign. |
| 9c | 54–100 %, 2.5 s | Wedge: "Put us down?" **x10,000, x1,000, x100** at 0.45 s spacing: underside 1.15, 1.07, 0.99; Spud's knees go a step each time, arms shaking (±0.006 m, 9 Hz), the bus rocks ±1°. | HERO, locked | The locked frame makes each drop readable against the shops. |
| 10a | Beat 10, 0–72 %, 2.6 s | Spud, crushed down under the floor: "No, no, no... LAUGH AT ME!" eyes up at the floor above him. **x10** on the second "no": underside 0.93. | LINE-B (1.6, 0.25, −1.7) / (−2.53, 0.75, −2.35) / 34 | Spud 570 px wide, eyes row ≈ 1300 (crouched), framed between the two front wheels, the dark underside across the top. Cap row 430 on the underside. |
| 10b | 72–100 %, 1.0 s | The friends look at each other (heads turn 20°), `worried`. Nobody laughs. | WINDOW | Silence in the picture: no motion but the two head turns. |
| 11 | Beat 11, 1.5 s | **x1** on the first frame. Frame +6 his arms give. Section 5. | CRASH (10.5, 0.5, 0.6) / (−0.6, 1.70, −2.0) / 30 | Section 5. |

Street total ≈ 34 s (toss 1.6, beats 5–11: 7.5, 4.4, 6.7, 3.6, 5.4, 3.6, 1.5). With the gym at ≈ 12 s the film runs
≈ 46 s; it may grow to 50 with measured lines. I would not pad it to 55.

## 4. The bus overhead (shots 8b, 9a, 9c)

**Why head-on.** Side-on, a 7 m bus in a 1080 px frame leaves Spud 160 px tall. Seen from the front the stack is
1.8 m wide and 3.9 m tall (road to roof), which is the shape of a tall frame. So the bus points at the camera, the
camera is low in its lane, and both friends stand at the windscreen. The camera sits 0.9 m to the door side, so a
150 px sliver of the long side (door, wheels, windows) shows at screen left and it reads as a bus, not a van.

**The hold.** Spud stands under the floor at bus-local (−1.1, −0.5), which is world (−2.53, −2.35): 2.97 m behind
the front face, 0.54 m ahead of the body's middle, between the axles, facing +x. Both gloves flat, palms up, under
the floor at bus-local z −0.5 ± 0.145 (0.26 m each side of him), 0.005 under the underside: the bench's `underpad`
hold on a bigger pad. Full lift: underside 1.33 above his feet (world y 1.21), so the bus's own ground line is at
world y 0.87, the wheels hang 0.99 above the road, the roof is at y 3.80. His sprout tip is 0.16 under the floor.
The bus stays level while they ride it (rock of ±1° at most): nothing in the story needs a tilt before the crash.

**The friends inside** ride the bus prop, standing on a front deck behind the windscreen, side by side, facing +x,
pitched 10° forward when they look down. Offsets in bus-local metres (multiply by 1.8 for world): **Chip
[0.38, 0.75, −0.27]** on the dash ledge at the door side, belly near the glass; **Wedge [0.30, 0.62, −0.66]** on the
deck. Their eyes are level, 1.80 above the bus's ground line (world y 2.67 at full lift), in the middle of a
windscreen that is 1.51 m wide: Chip 0.57 + Wedge 0.88 fit with 0.03 m between them. Chip is always seen against
glass, the dark doorway or the road, never against the bus's yellow paint (his hoodie is the same yellow).

**HERO frame, rows at 1080 × 1920** (F 3999, front face 10.6 m away at 379 px per metre, Spud 13.5 m at 296):

| In HERO at full lift | x px | Row |
| --- | --- | --- |
| Roof | 241–923 (side sliver to 95) | 214 |
| Windscreen top / bottom | | 366 / 768 |
| Chip's eyes / Wedge's eyes | 419 / 676 | 663 / 677 |
| Bus front lower edge | | 1159 |
| Spud's gloves on the floor | 430 and 582 | 1230 |
| Spud's crown / eyes / feet | 394–619 wide | 1322 / 1438 / 1630 |

Spud is 302 px tall (100 px at phone size) under a face 680 px wide and 950 px tall: small on purpose, and still a
clear teal shape on grey road. 57 px of underside show between the front edge and his gloves, so the contact reads.
The right 157 px show the street and shops; the left edge shows the shelter and lamp. The drop of 9b puts the roof at row
252, the three steps of 9c at rows 282, 313 and 343: 30 px each, readable against the locked background.

## 5. The crash and the last frame (beat 11, CRASH camera, frames after the x1 tick)

| Frame | What happens |
| --- | --- |
| 0 | HUD **x1**, full red. Cut to CRASH on this frame. |
| 6–12 | His arms give. He holds a little ahead of the bus's middle, so the tail goes first: the hold point falls from 0.93 to **0.70** above the road while the bus pitches nose-up 0 → 9° about it. Spud: crouch 1.6, squash 0.3 (draft 1's approved crash), `dizzy`, gloves still flat on the floor. |
| 10 | The friends leave the ride through the open door on keyed arcs of 0.4 s: Chip to the pavement at (1.4, 0, −0.60), Wedge round the front corner to the road at (2.6, −0.12, −1.9), passing over (0.9, 0.9, −1.0). |
| 12 | The rear wheels hit the road: thud, `shake` 0.07 for 0.3 s, dust `poof` at both rear wheels and under Spud. Pitch bounces 9 → 7.5 → 9° by frame 18. |
| 22, 24 | Chip, then Wedge, land seated (crouch 0.6), facing the camera, `dizzy`. |
| 33–39 | Chip's eyes go to Spud and his mouth opens into the first grin of a laugh. |
| **39** | **Last frame** (0.9 s after the impact). Hard cut. |

**Last frame.** The bus sits on its rear wheels, nose 9° up, front lower edge 1.08 above the road (row 1172), roof
row 244. Under the raised nose, between the two hanging front wheels: Spud, flattened, palms on the floor, dizzy eyes
at (513, 1396), in the low sun. Chip sits on the kerb at screen left, eyes (174, 1396); Wedge on the road at right,
eyes (827, 1368). HUD x1 in red, top left. The bus is whole (no dent), nobody is under a wheel, all three faces
show: nobody is hurt and no word is needed.

**Loop (soft).** Frame 0 of the gym is: x1, Spud under a level load he cannot lift, Chip at his left, laughing. The
last frame is the same sentence at 100 times the size, and Chip's starting grin is the laugh frame 0 opens on.
Do not add a beat for it.

## 6. Builder tasks (only these)

1. **Bus with a cabin** (the `bus` kind with `cabin: true`, or a new kind; paint #F2B51F, stripe, lamps, side route
   sign and wheel look stay). Sizes in bus-local metres at scale 1:
   - Hollow shell, walls 0.03. Floor top y 0.26, #4B4650. Ceiling #F7F4EC.
   - All glass clear: opacity 0.18, tint #CFE6F2, no outline. Side windows on both sides (the same band, y 0.87–1.37).
     Windscreen deeper: y 0.70–1.42, z −0.06 to −0.94.
   - The door is a real opening, 0.60 wide × 1.18 high when `open` is 1 (1.08 m at scale 1.8; Wedge is 0.88).
   - Four wheels (add the far-side pair), an axle bar between each pair.
   - Underside at y 0.19: panel #2B2830, two rails #3A3640 0.06 wide along x at z −0.3 and −0.7, one exhaust pipe
     #9AA3AD Ø0.04 along the far rail. A flat clear patch 0.8 × 0.6 round (−1.1, −0.5) for the gloves.
   - Front deck x 0.12–0.53, full width, top y 0.62, #3A3640, one step 0.2 high at its door end. Dash ledge on the
     door half: x 0.36–0.53, z −0.05 to −0.50, top y 0.75.
   - Front face: a second "10 CITY" sign 0.70 × 0.14 centred at y 1.50, two wing mirrors on 0.12 stalks at the top
     corners, #2D3340.
   - Six seat backs along the far wall, 0.30 × 0.45, #2F6FD1, tops at y 1.05 (seen through the side windows).
   - Not needed: a dent or crumple, passengers (`full`), `bulge`.
2. **HUD chip**: the numbers in section 2 (slot, sizes, growth to the right, tick, drain colours).
3. **Nothing else.** The car needs no change: on its roof it rests on the roof pad with four wheels up, its glass is
   already dark, and from our low cameras the plain underside is not seen. Shelter, lamp, bin and bar exist.

## 7. The gym part in the longer cut

- **Tighter wide.** WIDE-2: camera (0.12, 1.42, 6.9), look (0.12, 1.42, −1.0), fov 36. 374 px per metre at z −1
  (was 334): Spud 381 px, floor row 1491, mirror rail row 643, board rows 653–887, frame x −1.32 to 1.56. The top
  third is now only the caption wall. The stage is 2.8 m wide, so a frontal wide cannot go much tighter than this.
- **Punch-ins**, because one locked shot for 11 s is too long: PUNCH (0.76, 1.0, 3.2) / (0.76, 0.95, −1.0) / 36,
  Spud 717 px, for 0.6 s on the power looks at x10 and x1,000, cutting in 8 frames after the tick starts so the
  tick is read in the wide first. The plates at x100 stay in the wide.
- **Shot 4z** (TOSS) replaces "one glove lets go" at x1,000.
- **The bench is never lifted**: drop `bench2` and the hero and close cameras; Chip stays standing on the bench to
  the end of the gym. The mats stay as dressing. The board only counts up to x1,000 here; its drain colours move to
  the HUD chip.

## 8. Glitch risks

- **Riders and tilt.** The friends leave the ride at frame 10 of the crash, before the pitch passes 6°. Check that
  riders follow a pitched prop at all; if not, start the arcs at frame 6.
- **Spud and the front wheels.** In LINE-B and CRASH he is seen between the front wheels: gap 0.96 m, his squashed
  body 0.87. Keep him on the centre line (z −2.35 ± 0.02).
- **The leap** is one side-on arc at full speed (clip-lessons: a jump seen from behind reads as hanging).
- **Wedge in the bus's lane.** He is on the pavement or right of Chip whenever the bus moves; never left of x 2.8
  in the road before the stop.
- **Boarding.** Wedge 0.88 through a 1.08 m opening: 0.10 each side. Walk him in on the door's centre, yaw 180.
- **The car's flip and landing** are physics first; key them if the rest pose is more than 0.3 m or 10° off.
- **Fog** starts 14 m from the camera: HERO is 10.6 m from the bus front on purpose. Do not pull it back.
- **Caption over the windscreen.** In HERO only one-line captions at row 320; two lines would reach the brows.

## Open questions, with my default

1. The driverless parked bus set rolling by the car's thump (section 1): default yes; without it the bus needs a
   driver, who would then be lifted and dropped.
2. The series line "Sounds perfect, right?" over 8b: default no, outline v2 leaves the cover to the music.
3. The car on the far kerb, not the near one: default far, so it never blocks the hero camera's lane.
