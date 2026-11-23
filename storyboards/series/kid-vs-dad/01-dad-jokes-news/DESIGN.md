# Kid vs Dad 01 "BREAKING: Dad has told 4,000 dad jokes": design of the new pieces

Creative director, 22 Nov 2026. Target: `sheets/reporter-prompt.txt`, `sheets/panels-prompt.txt` and `OUTLINE.md` in `/mnt/project-files/videos/kid-vs-dad/01-dad-jokes-news/`. The PNGs could not be opened, so every size is computed from the cast files and the set's numbers, not rendered: check each piece on a bench still. Metres, floor y 0, +z toward the camera, +x screen right, hex colours. Hh / Wd / Dp = a body's own height, width, depth. A potato stands Hh + 0.14 tall; its eyes sit 0.62 Hh above its underside, its mouth about 0.45 Hh. Not in this file (already handled): the news bar, the rimshot and coin sounds.

## 0. Reused unchanged (no builder)

| Need | Use | Numbers |
|---|---|---|
| Garden | set `backyard`, seed 3 | plus one switch that leaves its stock shed out (section 6) |
| Closed fence | prop `fence` | x 0.3, z -2.6, width 1.6: fills the set's gap; never smashed |
| Bench | `parkbench` | seat 0.18 (not 0.30), len 1.9: backrest top at 0.593, so the reporter's eyes (0.64) show over it |
| Spud's step | `crate` | size 0.44: he stands at y 0.45, mouth 0.99 and eyes 1.14, over the 0.85 fence |
| Mug | `teamug` | scale 1, steam 0.6 |
| Coin | `coin` (props-money) | scale 0.5 = r 0.0425, 0.008 thick; the library's coin pinch |
| Cymbal | `cymbal` | on the snare stand's arm (section 4); `ring` is the "tss" |
| Dad, neighbour | `wedge.json`, `spud.json` | unchanged: red bomber, shades on top of his head all film |

## 1. The reporter: `characters/potatobrawl/reporter.json`, costume, helmet

Copy `agent.json`; change only these.

| Key | Value |
|---|---|
| body | color `#e2a95c` (cast skin, not the sheet's orange), height 0.80, width 0.84, depth 0.68, lump 0.03, seed 131, taper 0.10 |
| size check | stands 0.94 (helmet top 0.985) = 1.40 x Chip's 0.67; Spud 1.02, Wedge 1.12. Wider than tall. Width is under the 0.88 limit noted in `wedge.json` |
| limbs | color `#3b3f48` (the prompt's dark grey, not the drawn golden forearms), width 0.032, shoulder -0.32 |
| hands | glove, size 1.2, 3 fingers, seamless |
| face | default "deadpan" + neutral { tilt -0.08, browY -0.02, curve -0.05, smirk 0, eye 0.95 }; layout { browV 0.74 }; browShape { arch 0, thick 1.05 }; size 0.95. The cast entry sets no `expr`, or the neutral is dropped |
| sprout | placement "none": bald under the helmet |
| tts | "reaper" |

Faces: reporting = his neutral. Duck = eye 0.06, tilt 0.3, browY -0.03, curve -0.3. Haunted look after each joke = eye 1.15, pupil 0.7, tilt 0.1, curve -0.1, open 0, into the lens, then one blink of 9 frames each way.

Costume = `teller` (Tot has the same body height, so its vest heights fit): shirt `#c4def2`, vest `#263a66`, tie false, glasses false, garters false, shoes `#4a3323`, sole `#33231a`. New keys, all off by default so Tot, Rosti and the agent do not change:

| New key | Numbers |
|---|---|
| padded | the vest stands 0.06 off the shirt (teller: 0.042); a navy roll r 0.016 along its neckline |
| quilt | 3 seams `#18274a`, 0.006 wide, round the vest at y 0.19, 0.25, 0.31; each drawn once, wandering up to 0.004 |
| zip (replaces the 3 brass buttons) | one line `#18274a`, 0.008 wide, from the V point (y 0.34) to the hem |
| patch | blank `#f4f1ea` rectangle 0.11 x 0.07, corner radius 0.008, centre x +0.17 (his left), y 0.40; one stitch line `#c9c6bd` 0.004 inside its edge, broken twice. No letters |

Helmet (new; it sits on the engine's hat mount, so the existing `hat` action tilts and hides it):

| Part | Numbers (for this body; build them as shares of Hh / Wd / Dp) |
|---|---|
| Shell | a round dome over the whole top of the head, about 0.63 wide, 0.49 deep, 0.225 tall; 0.018 off the skin at its edge, 0.045 at the crown (top at y 0.985). Hollow, inside `#2b2f38` |
| Lower edge | y 0.86 at the front (0.90 Hh, and never less than 0.03 above the brows), 0.80 at the sides, 0.76 at the back, one smooth curve |
| Rim | rolled edge r 0.008 `#2f5a96`; flares 0.012 all round and 0.02 across the front 100 degrees. No wider: a brim hides the brows |
| Colour | `#3f72b8` mid blue (as drawn; the prompt's pale blue is the sky's `#5aa9f0` to `#d6ecfb`), shade side `#335f9c` |
| Marks, each drawn once | highlight streak `#8fb3e0` 0.09 x 0.018, upper front, viewer's left; dent line `#2f5a96` 0.05 long on his right side; two scuffs `#a9c4e6`, 0.03 and 0.018 long, by the front rim |
| Chin strap | `#2b2f38`, 0.016 wide: from the rim 74 degrees each side of the front, down behind the cheek blush, under the mouth (centre 0.045 below the mouth line, never nearer than 0.03); steel buckle 0.022 x 0.016 `#9aa0a8` on his left |
| Strap undone | whenever the helmet's roll is 6 degrees or more: the under-mouth part is hidden and two ends hang straight down from the rim, 0.13 long (with the buckle) on his left, 0.09 on his right |

| When | Helmet |
|---|---|
| 0-52 s | level, strap buckled |
| each duck | his left glove on the dome (arm pose `hat`); helmet pushed 0.012 down for 0.15 s |
| from 52 s (panel 12) | `hat`: roll 12 degrees toward his left, yaw 8, slid 0.015 the same way; strap undone. Check the low-side brow still shows |
| panel 13 | `hat` on false, on the cut; the prop `rephelmet` instead |

`rephelmet` (new prop): the same shell, rim, marks and two hanging strap ends; origin the middle of its open underside. It stands dome up on the grass over his outstretched legs (they are inside the hollow), its back rim 0.02 from his vest; both gloves rest on the dome (rest pins, no grip).

## 2. `newsmic` (new prop)

Origin: the butt end; the mic runs up +y; 0.32 long = 0.34 of his height.

| Part | Numbers |
|---|---|
| Handle | y 0 to 0.20, r 0.016, `#1d1e22`; butt cap r 0.019, 0.012 tall |
| Station cube | 0.075 cube round the handle, y 0.1125 to 0.1875, `#e3262e` (brighter than the dad's `#c34732`), bevel 0.006 in `#f0646a`. Blank on every face |
| Collar | y 0.19 to 0.20, r 0.022, `#9aa0a8` |
| Foam ball | centre y 0.255, r 0.065, `#4a4d55`; 40 pores `#3a3d44` r 0.004, each placed once |
| `lean` 0 to 45 degrees | the head tips away from the holder about the grip point (y 0.056), so the fist never slides. Use the engine's prop `tip` instead only if it already pivots a held prop at its grip |

Hold: the mug hold, his RIGHT hand, all film, never put down. Size entry `{ r: 0.016, h: 0.085 }` puts the fist at y 0.056, between the butt cap and the cube; glove gap 0.035. The ball's centre is 0.20 above the fist.

| Use | Fist y | lean | Ball centre y | Note |
|---|---|---|---|---|
| In cover (panels 01, 03) | 0.72, over the backrest, 0.45 toward the shed | 30 | 0.89 | stays there through the duck |
| To camera (line 3, panel 12) | 0.38, 0.06 outside his body edge, 0.26 forward | 0 | 0.58 | beside the cheek, never in front of the face |
| Down to the kid (seated, mouth 0.42) | 0.21 | 40 | 0.36 | ball 0.15 short of the mouth; he crouches |
| To the dad standing (mouth 0.58) | 0.37 | 40 | 0.52 | level: potato mouths are low |
| Up to the dad on the bench (mouth 0.76) | 0.55 | 40 | 0.70 | arm stretched (panel 05) |

How it reads: seated kid to dad-on-bench is 0.34 m of ball height = 100 px in the wide, 34 px on a 360 px phone. The dad standing is only 0.16 above the kid, so "down / up" is carried by panel 05 and by the reporter's crouch, not by the dad on the grass. On screen: ball 39 px and cube 22 px in the 300 px/m wide, 125 and 72 px in a medium.

## 3. `jokejar` (new prop) and the two coin beats

Origin: bottom centre. Squat on purpose: 0.30 across, 0.23 tall (half the kid's width, 0.43 of his body). Held low in front of the bench (base y 0.12) its rim is at 0.35, 0.07 under his mouth; a taller jar hides his face for his three lines.

| Part | Numbers |
|---|---|
| Glass body | r 0.15 from y 0.015 to 0.155, shoulder in to r 0.115 at y 0.195, open top. No lid, no label |
| Rim, base ring | solid `#bcd9d6`: rim roll (tube 0.011) at y 0.215 on radius 0.122; base ring 0.015 tall |
| Glass | tint `#dff1ec`, FIXED opacity 0.28 as `tipjar`, never tweened; two solid white streaks 0.012 wide, y 0.04 to 0.15, front left. If the shell sorts badly against gloves, drop it: rim, base ring and streaks carry the jar |
| Coin heap | a solid mass `#c98f1a` plus about 60 plain coins r 0.04, 0.008 thick, `#f0b92e`, edge line `#9a6a10`, lying on its outside and its domed top, each placed once, tilted up to 35 degrees. No relief, no faces (deeper gold than his `#ffcf2e` hoodie) |
| `fill` 0..1 | heap level y = 0.02 + 0.135 x fill, the dome 0.035 higher in the middle. Coins above the level are hidden and the mass is scaled: scale and visibility only (clip-lessons: tweened opacity freezes) |
| `plink` 0..1 | the heap jolts 0.004 for 3 frames; from 0.5 one more coin lies on the peak |

This film: fill 0.82; `plink` at the dad's coin. Hold: Chip, box hold, both palms on the sides 0.127 up the jar (size entry `{ w: 0.30, h: 0.23, d: 0.30 }`, gap 0.03), the jar against his belly. In his hands across the cut into panel 08; the lift is 0.10 for at most 0.8 s (rim 0.45, under his eyes), then back down for his lines; put down across a cut. From frame 0 to 25 s it stands on the bench seat (section 7): a plant.

Dad's coin (panel 09): `coin`, pinch, 0.10 above the rim; released it falls 0.16 m in 5 frames (ease in), is hidden at the heap, `plink` fires. Flicked coin (panel 11): never gripped. It appears on his thumb (hand shape `thumb`, the hand still for 0.3 s), flies a ballistic arc of 26 frames with its top at y 1.9 and 4 turns, and is hidden on the frame Spud's right glove closes (shape `fist`).

## 4. `snaredrum` and `drumsticks` (new props): Spud's kit behind the fence

The fence is 0.85 tall with 0.06 gaps and Spud's eyes on the ground are at 0.69, so he stands on the crate and the drum head is at 0.93.

| Part | Numbers |
|---|---|
| Drum | origin: the ground under the stand. Shell 0.36 across, 0.13 deep, `#c2272d`; 2 chrome hoops r 0.006 and 8 lugs 0.012 x 0.05 `#c9ced6`; head `#f3efe4` with one worn smudge `#d9d4c6` 0.09 across. Head centre at y 0.93, tipped 12 degrees toward the yard so it shows as an ellipse over the pickets |
| Stand | chrome tripod: tube r 0.012, legs out to r 0.26. Plain: it is seen only through the pickets |
| Cymbal arm | tube r 0.008 from the stand at y 0.55 to the named point "cymbal" (0.26, 1.20, -0.18); the `cymbal` sits there dome up, tipped 15 degrees toward the yard |
| `hit` 0..1 | as `bassdrum`: the head dips 0.008 and the drum bobs 0.006, decaying inside 0.25 s a strike. Named point "beat" = the head's centre |
| Sticks | ONE prop, both sticks: each 0.30 long, r 0.008 down to 0.005, acorn tip r 0.009, `#e3c08a`, splayed 10 degrees. Origin = the grip point, 0.07 from the butts; they point away from the holder, tips raised 20 degrees |
| `strike` 0..1 | the pair tips 38 degrees down about the grip and back (lowest at 0.35) in 0.2 s: the tips drop 0.14 |

Hold: Spud's LEFT fist (screen right, the drum side), the mug hold with the fist on the origin (the megaphone's size-entry precedent), already closed at the reveal cut, never released. His right hand stays free for the catch. Grip at y 1.01, 0.20 from the head's centre. Ba-dum-tss = `strike`, `strike` 0.18 s apart with the drum's `hit`, the arm 0.3 up and out, `strike` with the cymbal's `ring`.

## 5. Shock blanket: a costume piece on Chip, not a prop

Not `huddleblanket`: it is a fixed cape for adult bodies (0.86 x 0.74, hem at 0.14) that takes place only; on Chip (0.57 wide, seated at 0.18, turning to speak) it stands 0.15 off him and does not turn. Put it on a Chip variant file (as `chip-old.json`), costume key `blanket`, one state `slip` driven like the teller's `slip`.

| Part | Numbers (Chip: Hh 0.53; heights above his underside) |
|---|---|
| Cloth | wool `#8b9098`, fold shade `#6c717a`, lit `#a9aeb5`; 160 short fleck strokes, each once; 0.016 thick |
| Stripe | two lines `#59606b`, 0.012 wide, 0.012 apart, 0.05 above the hem, breaking at each fold |
| Top edge | a roll r 0.022 lying on the hoodie's cowl: 0.66 Hh at the back, 0.57 at the sides, ending 42 degrees each side of the front at 0.47 Hh. The yellow V and both drawstrings stay in view |
| Hang | a bell: 0.022 off the hoodie at the roll, 0.05 halfway, 0.075 at the hem; 5 soft folds 0.014 deep, uneven |
| Hem | 0.05 Hh at the back and sides (0.03 above the seat); 0.20 Hh across the front 120 degrees, so both gloves and the mug sit under it in the `lap` pose |
| Arm bulge | 0.11 off the body over each arm root (side, 0.33 Hh): at slip 0 his arms rest inside |

| slip | Shape | Used |
|---|---|---|
| 0 | wrapped: the front edges fall from the roll's ends to the hem 30 degrees each side of the front; the gap is 0.30 wide | 0-25 s (panels 01, 04) |
| 0.4 | both front panels swung back to 100 degrees each side, roll ends at 60 degrees, the whole cape 0.03 lower and his right side 0.02 lower again; no arm bulge | set on the cut into panel 08, kept to 66 s |
| 0.4 to 1 | slides down his back in 0.6 s (18 frames), hem first, stacking; never a fade | panel 14, starting 0.2 s after he lands on his stand mark |
| 1 | a heap 0.50 x 0.34 x 0.09 on the grass, centre 0.32 behind him, 5 ridges, one corner showing the stripe. From here it keeps its place: none of his squash, lean or hop | to the end |

Rules: while slip is under 0.3 his arms use only rest and `lap`. He sits 0.09 further forward than without it (the cape meets the backrest 0.20 behind the seat's middle). He does not walk after slip passes 0.7.

## 6. The dad's shed: `gardenshed` (new prop), the stock shed switched off

The stock shed cannot do panels 01-02: its door is a painted panel 0.42 x 0.85 (Chip is 0.57 wide; the dad is 0.88 x 1.23 with his shades), nothing opens, and it stands at z -3.7, 1.1 m behind the fence, which in this film is the neighbour's side. Smallest change: one set switch that leaves it out, and this prop in the yard.

| Part | Numbers |
|---|---|
| Box | 1.90 wide (x), 1.30 deep (z), eaves 1.50, ridge 1.90 running front to back (a front gable), roof overhang 0.10. Origin: the floor under its middle; the door wall is +z |
| Colours | the stock shed's: walls `#8fb7c9`, plank lines `#6f98ab` every 0.15, roof `#5b4a52`, door `#f2efe8`, window `#bfe3f5` (solid, not see-through) |
| Doorway | 1.20 wide x 1.40 tall, from x -0.75 to +0.45 (the dad's resting gloves span 1.14) |
| Inside | every inner face and a floor plane `#2b2630`; nothing else in it |
| Wall beside the door | 0.50 wide on +x: one window 0.26 x 0.22, centre y 1.00, frame `#f2efe8` 0.03 wide |
| Door leaf | 1.20 x 1.35 x 0.035, bottom edge at y 0.05; 5 plank lines `#cfc9bd`; a Z brace of 0.08 boards `#e4dfd4` on the inside face; ring handle `#2b2630` at y 0.70 on the free edge, both faces; 2 strap hinges 0.22 long at y 0.25 and 1.15 |
| Hinge | on the doorway's -x jamb (camera-near; the dad's right as he comes out); opens outward |
| `open` 0..1 | 0 shut, 1 = 105 degrees. Frame 0 at 0.25, 1.0 by 0.8 s (ease settle); shut again (0) on the cut after he has left it |

At 105 degrees the section 7 camera sees the leaf edge-on at the doorway's left: it covers 0.14 of his right flank (he peeks round it) and nothing between him and the bench. He stays inside until `open` passes 0.7 (the leaf sweeps his threshold mark), then steps out: right glove on the leaf's edge, left on his chest (panel 02). Its four walls count as obstacles for `qa/clear.mjs`.

## 7. Floor plan (starting marks: run `qa/clear.mjs`)

Bench centre (0.40, 0.30), its front turned 15 degrees toward -x. The "bench" column is along the seat (+ = screen right), then forward of the seat's middle.

| Who / what | World x, z | Bench | Notes |
|---|---|---|---|
| Shed | (-1.62, -0.72) | | front turned 40 degrees toward +x; hinge at (-1.77, 0.26) |
| Dad, frame 0 | (-1.57, -0.43) | | inside, facing out |
| Dad, threshold (panels 01-02) | (-1.25, -0.05) | | faces 30 degrees right of the lens (he plays to the TV camera), leaning toward the bench |
| Chip, seated, 0-66 s | (-0.07, 0.31), y 0.18 | -0.45, +0.13 | faces as the bench; mug in both gloves at his lap |
| Jar, 0-25 s | (0.57, 0.35), y 0.18 | +0.18, 0 | on the seat |
| Reporter, in cover (panels 01, 03) | (1.12, -0.25) | +0.55, -0.72 | 0.10 behind the backrest, faces 30 degrees left of the lens, eyes on the dad. The line from the dad to him crosses the backrest: real cover |
| Spud, from frame 0 | (3.30, -3.30), y 0.45 | | on the crate, 0.37 behind the fence |
| Drum / cymbal | (3.95, -3.15) / (4.21, 1.20, -3.33) | | |
| Reporter, out of cover (panels 06, 08, 13) | (-1.17, 0.35) | -1.50, +0.45 | reached on a cut; needs the door shut |
| Dad on the bench (panel 05) | (0.92, 0.50), y 0.18 | +0.55, +0.06 | 1.01 from Chip |
| Dad at the jar (panel 09) | (0.41, 1.13) | +0.22, +0.80 | 0.72 from the jar |
| Dad at the fence (panel 11) | (2.40, -1.75) | | 1.8 from Spud |
| Chip standing (panel 14) / dad, ending | (-0.24, 0.96) / (0.85, 1.05) | -0.45, +0.80 | 1.09 apart; the heap lands 0.05 clear of the bench |

Side by side in panel 01: dad to Chip 1.18, Chip to reporter 1.19. Camera to start from: pos (0.3, 1.5, 9.0), look (-0.04, 0.75, -0.2), fov 40 = 3.6 m across at the bench, 300 px per metre: dad 355 px tall, Chip 195, the reporter's helmet and eyes 190 x 118 over the backrest; 60 px of margin left, 85 right. Ducking, he drops 0.14: only the dome (0.25) and the mic stay over the backrest. Spud's edge is 0.55 m outside the right frame edge; the tree's trunk is on it. Before 40 s no frame may show the fence right of x 2.6; if one must, hide Spud, crate, drum and cymbal until 39.5 s.

## 8. Props through hands: 5 holds, 1 release on screen, no take on screen

| Hold | Who | On screen |
|---|---|---|
| Mic | reporter, right | all film, never changes |
| Mug | Chip: right = mug hold, left cupped beside it (no grip), at his lap | 0-25 s, never lifted; after the cut it stands on the grass at bench (-0.80, +0.38) |
| Jar | Chip, both palms | taken and put down across cuts |
| Coin | dad, pinch | the one release |
| Stick pair | Spud, left | never changes |

Cut already: (1) sunglasses in the dad's hand (panel 14): they stay on his head, as drawn in every panel and as his cast file fixes them; sincerity = his brows and a glove on his chest. (2) Helmet in the reporter's hands: it comes off on a cut. (3) A stick in each of Spud's hands. (4) A grip on the flicked coin, at either end. (5) A jar lid; a mug that is lifted or put down. (6) Sweat drops (sheet; panel 12): story.md bans reaction symbols; the crooked helmet and the undone strap carry it. Cut next, if one fix round does not clean it: the mug (it stands by the bench leg from frame 0), then the cymbal, then the buckled strap (undone all film).

## 9. Changed from the prompts or the drawing; open questions (my default); risks

- Adopted from the drawing: mid-blue helmet; shades on the dad's head. Kept from the prompts and the cast: skin `#e2a95c`, dark grey limbs, the dad's red bomber (his cast file), not the reference sheet's knit sweater. Bench seat 0.18 and Spud on a crate: potato faces sit low (eyes at 0.62 Hh), so a 0.30 bench and a 0.85 fence hide them.
- Q1 Sunglasses in the ending: stay on his head (default), or a take-off beat (a new hand prop and a costume switch)?
- Q2 Opening wide: the bench back hides the reporter's mouth; helmet, eyes and mic show (default). Or stand him at the bench's end with his whole face clear?
- Q3 The kid's mug: held at his lap (default), first piece to go if the hold glitches.
- Q4 Chin strap: buckled until 52 s, undone when he cracks (default), or loose all film?
- Risks: the strap under a talking mouth (check a still of "Sir. We are live."); glass over gloves (the fallback is in section 3); the blanket against the backrest; the dad's gloves in the 1.20 doorway; Spud showing early.
