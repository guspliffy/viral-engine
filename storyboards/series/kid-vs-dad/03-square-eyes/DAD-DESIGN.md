# Kid vs Dad: the new Dad (Dad B), build spec

Creative director, 25 Nov 2026. Jonny picked DAD B (25 Nov, 12:10 Berlin). Target: `references/cast/dad-reference-sheet-2026-11-25.png` (4 panels: front hitching his belt, neutral head, the phone-eye reveal, Dad beside Tato), read panel by panel. Where the sheet and `DAD-OPTIONS.md` differ, the sheet wins. He is "Dad" in every file, caption and note, never named. No hat, no glasses, no letters or logos, no teal. Every number here is computed from the engine files, not rendered: the bench in section 5 proves each one. The phone-shaped eyes of the ending are NOT in this file (`DESIGN.md` in this folder, another designer): here the eyes stay rig-standard and clear.

Conventions. Metres. **b** = height above the body's underside (world y = b + 0.20 when he stands). **th** = angle round the body from the front in radians: + toward HIS left (+x, screen right when he faces the lens), - toward his right. Hh = 0.98. Face places are `face.place(u, v)`. Every mark is drawn once from a fixed table: no `Math.random`, no clock, no see-through material, no light, no glow.

## 0. Files and reuse

| File | The builder |
|---|---|
| `characters/potatobrawl/dad.json` | new (section 1) |
| `characters/sheet-cast.json` | adds `types.dad` (section 1), nothing else |
| `engine/page/costumes-dad.js` | new: every piece of section 4, with a USAGE header like `costumes-devil.js` |
| `engine/page/costumes-everyday.js` | one import and one `KIT` line `dad` (as `devil`). Its shared hands step paints the arm tube cream: Dad's must end skin-coloured (section 4, Arms) |
| `storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-dad.mjs` | new (section 5); it writes `bench-dad.json` beside it |
| Not the builder's | `DESIGN.md` in this folder, `docs/character-bible.md`, `engine/voice/voices.json`, Tato's file |

| Need | Model to copy |
|---|---|
| A face set high over a moustache | `characters/ancient-aliens/plato.json` `face.final` (it wins over the look's shared numbers) |
| Short sleeves on the arm's own curve, hem ring | the sleeves in `costumes-devil.js` |
| Two-strap sandal | the sandals in `costumes-plato.js` (here on a sock foot) |
| Shirt body, collar roll, flat bands | `garment`, `band` in `costumes-art.js`; the bomber in `costumes-everyday.js` |
| Cloth that gets out of a seat | `st.sit` in `costumes-plato.js` |
| A part that lags the head | `softFollow` in `costumes-art.js` |

I had no shell in this role: run `node tools/vocab.mjs --find moustache` (then `belt`, `sandal`, `holster`) first. `docs/VOCAB.md` and the costume files show no moustache, polo, belt, holster or sock piece for a plain potato (Plato's moustache is one mass with his beard): all new.

## 1. `characters/potatobrawl/dad.json`

| Key | Value |
|---|---|
| id, name, franchise, rig | `potatobrawl/dad`, "Dad (Kid vs Dad)", PotatoBrawl, `potato` |
| source | this file and the sheet's path |
| body | color `#e2a95c`, height 0.98, width 0.86, depth 0.76, lump 0.02, seed 71, taper 0.14, square 2.3. A round egg, fuller below. Real silhouette: 0.874 wide at b 0.39, 0.773 deep. If a lump dents the forehead or the belly front on still 0.5: seed 73, then 79, then 83 |
| legs | height 0.20, width 0.046, hipX 0.13, footX 0.14 (keys `potato.js` already reads) |
| limbs | color `#f4f1e8` (the legs ARE the socks), width 0.034, shoulder -0.3 |
| face | default `kind`; iris `#4a2a14`; cheeks `#ff8f8f`; brow `#4e2f1a`; size 0.90; neutral { tilt 0.03, curve 0.4, smirk 0, eye 1 }; eye { flick 0, lash 0.9 }; browShape { arch 0.01, thick 1.0 } |
| face.final | size 0.99; eye { flick 0, lash 1.2 } (no lashes, only the lid line; oval, iris and catch light stay the look's); browShape { thick 1.0, arch 0.01, taper 0.4, tip 0.007, inner 0.14, outer 0.66, clear 0.012 }; layout { eyeU 0.39, eyeV 0.62, browV 1.14, mouthV -0.13, mouthW 0.20, cheekU 0.74, cheekV 0.22 } |
| sprout | color `#8fb03a`, placement `none`, leaves 3 (the costume draws them) |
| costume | type `dad`, plus the colour keys of section 4 at the defaults given there |
| hands | type glove, size 1.3, fingers 3, seamless true, cell 0.0035, blend { root 0.35 }: Wedge's, so every grip proven on the old Dad carries over. Cream mittens |
| tts, voice | `"tts": "wedge"` (placeholder: the voice of episodes 1 and 2, so measured takes stay valid). voice { pitch 96, rate 2.8, formant 0.98, range 4, breath 0.08, vibrato 0.008, seed 139 }. voiceNote: "placeholder. Jonny picks Dad's own voice by ear; first try `wizard`: warm, mid-low, calm, very sure" |
| personality | "Tato's dad, never named. States every house rule as a law of nature and breaks it himself. Habit (a proposal): he hitches his belt before a ruling." |
| notes | the sizes of section 2, the width rule, "no hat, no glasses, nothing over the eyes", a pointer to this file |

`sheet-cast.json` `types.dad`: rest { tilt 0.03, browY 0.012, curve 0.4, open 0, eye 1, pupil 1, smirk 0, raise 0.02 }, lids [0.06, 0.06]. No `skin`: he takes the family's `#f9b75c`.

The mouth offset: the mouth stays at the rig's height (mouthV -0.13, standard -0.12). The room for the moustache comes from the EYES going up (eyeV 0.62, standard 0.27) and getting smaller (0.99, Wedge 1.19).

## 2. Size check, standing

| Point | b | World y | Numbers |
|---|---|---|---|
| Crown; leaf tops | 0.98; 1.05 | 1.18; 1.25 | |
| Brow bars, middle | 0.77 | 0.97 | each 0.040 thick in the middle, 0.027 at the blunt ends, x 0.035 to 0.16 |
| Eye centres | 0.635 | 0.835 | x +-0.116; each eye 0.143 wide x 0.203 tall (b 0.534 to 0.736) = 1.36 of Tato's eye, as panel 4 |
| Moustache | 0.358 to 0.492 | 0.56 to 0.69 | 0.46 wide |
| Mouth line | 0.430 | 0.63 | Wedge-as-Dad had 0.44: episode staging numbers carry over |
| Collar button | 0.327 | 0.53 | |
| Arm roots | 0.34 | 0.54 | inside the polo |
| Belt | 0.155 to 0.205 | 0.36 to 0.41 | |
| Shorts hem | -0.025 | 0.175 | |
| Tato (`spud-kid.json`, unchanged) | | crown 0.69 | body 0.55 = 0.56 of 0.98; stands 0.585 of 1.18; his crown is level with the TOP of Dad's moustache (b 0.49), 0.16 above the collar button |

Tuning rule, before any costume work: lay out still 0.5 and read `eyes` and `mouth`. Eyes not at y 0.835 +-0.01: change eyeV by 0.038 per 0.01 m. Mouth not at 0.63 +-0.005: mouthV, same rate. The moustache hangs off `face.place`, so it follows.

## 3. The eye zone: eyes and brows only

- Keep clear: b 0.496 to 0.86, |x| up to 0.25, from the skin out 0.15. No costume mesh enters it in any pose: no moustache, collar, sleeve or leaf.
- Lower limit: a phone rectangle as wide as the eye (0.143) at 9:16 is 0.254 tall, b 0.508 to 0.762. The moustache top is at b 0.492 or lower.
- Upper limit: the brows at `shocked` reach b 0.86. The leaves stay above b 0.90 in front of the head's middle.
- For the eye designer: centres (+-0.116, b 0.635); the skin leans back about 14 degrees there and 28 at b 0.76. No lashes. The blush (b 0.46 to 0.59, x 0.13 to 0.32) lies partly behind each eye's outer lower edge.
- The costume never keys a face control and never reads the eyes.

## 4. The pieces: `engine/page/costumes-dad.js`

Rigid = fixed on the body (`potatoParts`), turning, leaning and squashing with it.

| Piece (key, default) | Shape and size | Moves |
|---|---|---|
| Polo (`polo #a9c8e8`, `poloShade #7fa3cc`) | cloth 0.018 off the skin. Neckline: front b 0.335, back b 0.56, rising as the kit's tops do with vee 0.6 (b 0.38 at th +-0.5, 0.43 at +-1.0, 0.48 at the sides). Lower edge b 0.20, behind the belt. Painted once: a pale wash (the light-cloth setting of Chip's hoodie) and 40 faint flecks; one yoke seam 0.004 wide across the back at b 0.47, th 2.0 round to -2.0 | rigid |
| Collar (`collar #b9d3ee`) | a band folded down along the neckline, 0.05 wide at the sides and back, a soft roll r 0.008 on its top edge, its free edge 0.006 off the shirt. In front two pointed leaves, each from th +-0.06 to +-0.42, point at x +-0.075, b 0.295; the gap between the points is 0.03, closed at the top button. A shade line 0.004 under its lower edge | rigid |
| Placket, buttons (`buttons #f3ead6`) | strip 0.030 wide, b 0.245 to 0.335, 0.003 proud, a stitch line each side. 2 buttons r 0.009, 0.004 thick, 2 holes: b 0.327 (closed, where the collar leaves meet) and b 0.282 | rigid |
| Belly (`belly 0.028`) | the polo's stand-off grows from 0.018 to 0.046 in a soft dome: peak at th 0, b 0.265; back to 0.018 by th +-0.70 and by b 0.33. Under the peak the cloth rolls under to the belt's top edge; its lowest point is b 0.200 between th -0.5 and +0.5, 0.005 below that edge (the overhang). One shadow line 0.005 wide under the roll, th -0.9 to +0.9; 2 pull creases 0.05 long from the second button, down and 30 degrees outward. `belly 0` = flat shirt | rigid |
| Tuck line | 6 gather creases `poloShade`, 0.004 wide, rising from the belt's top edge at th -2.5, -1.32, -0.86, +0.79, +1.27, +2.3; lengths 0.040, 0.045, 0.032, 0.038, 0.030, 0.035 | rigid |
| Sleeves | 0.13 long from the shoulder, r 0.080 to 0.060, starting 0.03 inside the body; hem band 0.014 wide `#9dbde0` | on each arm's curve, rebuilt every frame |
| Arms (`hands #f6dcae`) | below the sleeve the arm tube is bare: the body's own final skin colour, read from the body material at build (`#f9b75c` in castLook sheet), shaded as skin. The glove and its wrist stay cream | the rig's |
| Belt (`belt #6f4628`) | band 0.05 wide (b 0.155 to 0.205), 0.012 thick, 0.004 off the shorts, all round. A stitch line `#4e2f1a` 0.003 wide, 0.006 inside each edge. Free end 0.06 long, pointed, lying on the belt from th +0.16 to +0.31, 3 holes r 0.003 | rigid |
| Buckle (`buckle #dba935`) | frame 0.105 wide x 0.074 tall (b 0.143 to 0.217) at th 0, corner r 0.014, bar 0.014 wide x 0.012 thick, 0.006 proud of the belt; one prong 0.007 wide from the bar at his right to the middle; shade side `#b0811f`. Metal as the reporter's strap buckle | rigid |
| Belt loops | 5, in the shorts cloth, 0.016 wide x 0.062 tall, 0.004 proud of the belt: th -1.5, -0.42, +0.47, +1.35, 3.14 | rigid |
| Holster (`holster #7a4b2a`, `holsterOn true`) | pouch 0.078 wide x 0.110 tall x 0.036 deep, edges r 0.012, top at b 0.215, middle at th -0.95: HIS right hip, screen left when he faces us. Hangs 4 degrees out at the bottom; its lowest 0.02 lies over the right pocket's flap. Flap over its top 0.055 with a round lower edge `#643c20`; a brass snap r 0.007, 0.012 above that edge; a stitch line `#a06a3c` 0.005 inside the edges. Closed and empty: no phone shows | rigid |
| Shorts (`shorts #d3ba8c`, `shortsShade #a88e62`) | one drum from under the belt (b 0.205, 0.02 off the skin) to the hem at b -0.025. Section at the belt: the body's own + 0.02; at the hem an oval 0.70 wide x 0.46 deep, its middle 0.01 behind the body's axis; straight between. A notch in the hem front and back, 0.06 wide, 0.055 high, round top: it reads as two legs. Closed inside by a flat lining `#6f5a3c` at b -0.005; the legs pass through it. Lines in `shortsShade`, 0.004 wide: a fly 0.09 down from the buckle, a centre seam behind, a turn-up 0.02 above the hem, 2 welts 0.09 long at th +-2.45, b 0.11 | rigid; as `st.sit` goes 0 to 1 every point below b 0.005 rises to b 0.005 |
| Cargo pockets | one a side at th +-1.05: box 0.115 wide x 0.105 tall (b 0.02 to 0.125), 0.016 proud, lower corners r 0.015; a flap 0.125 x 0.04 over its top, 0.004 prouder, lower edge a shallow V; one button r 0.008 `#b98f3e`; a stitch line 0.006 inside the edge | with the drum |
| Socks (`socks #f4f1e8`, `rings #34507f`) | the legs and foot balls themselves. 2 rings a leg, 0.014 wide, 0.002 proud, middles 0.155 and 0.128 above the floor when he stands (the upper one 0.013 under the hem) | rings ride the leg's curve every frame at a fixed distance from the foot |
| Sandals (`sandal #5a3a22`, `strap #7a4b2a`) | foot ball x 1.15 (Mash's `shoeSize`). Sole 0.175 wide x 0.24 long x 0.02 thick, showing 0.01 all round. 2 straps 0.022 wide x 0.006 thick: 0.045 ahead of the foot's middle and 0.02 behind it; a brass buckle 0.014 x 0.012 on the outer end of each rear strap. No heel strap | with the foot |
| Moustache (`moustache #6a3f24`) | one mirrored piece, 0.46 wide. Top edge: b 0.486 at x 0 (a notch), 0.492 at +-0.055, 0.486 at +-0.115, 0.462 at +-0.17, 0.428 at +-0.215. Lower edge: b 0.436 at x 0, 0.424 at +-0.055, 0.404 at +-0.115, 0.374 at +-0.17. Tips: round, r 0.03, middle (+-0.215, b 0.385), lowest b 0.358, outer edge x +-0.23. Off the skin: 0.012 at the edges, 0.022 at the notch, 0.034 along the fattest line of each half; the tips hang free at 0.045, which is 0.012 in front of the collar. Lower edge cut in 6 blunt points a side, 0.008 deep. 5 strand lines a side `#4a2c18` (0.004 wide, 0.06 to 0.12 long, along the sweep) and 3 light strokes `#8a5a36` | rigid; placed from `face.place`: lower middle edge 0.006 above the mouth line, top 0.042 or more below both eye bottoms. Does not move with speech |
| Leaves (`leaf #8fb03a`) | 3 thin leaves from one nub (r 0.02 `#7d9a34`) on the crown at x -0.11, z +0.02, combed over the top to HIS left. Lengths 0.34, 0.31, 0.27; widest 0.062, 0.058, 0.052; 0.008 thick. The back one is highest; the middle one 0.022 in front with its tip 0.03 lower; the front one 0.045 in front and 0.06 lower. Each rises 25 degrees over its first third, runs flat, curls up 12 degrees over its last quarter. Highest point b 1.05 at x +0.03; tips x +0.19 to +0.24, b 0.96 to 1.02. Blades tipped 40 degrees toward the lens. Midrib `#6c8a2a` 0.004 wide over 85 % of each. Bald skin shows in front of and behind them | one group, `softFollow` 0.35; `droop` and `bloom` do nothing on him |

The mouth under the moustache: closed, its corners (x +-0.063) are hidden and the smile's middle shows 0.02 under the notch (panel 4). At open 0.6 the lower lip is at b 0.38, at open 1 at b 0.35, above the collar roll (b 0.343).

## 5. The bench: `bench/bench-dad.mjs`

Set `plain` (color `#f3d9a4`, floor `#d9b27a`, as `storyboards/characters/make-turnaround.mjs`), look `anime-pro`, castLook `sheet`, no music, no captions. Cast: `d` = Dad at (0, 0); `d2` = Dad at (-3.42, 0) with `tato` = `potatobrawl/spud-kid` at (-2.57, 0); `d3` = Dad seated on a kit `chair` at (3.0, 0) from frame 0. One still a second; cameras cut. FULL = pos (0, 0.80, 4.8), look (0, 0.62, 0), fov 30. HEAD = pos (0, 0.88, 2.0), look (0, 0.84, 0), fov 30.

| Still (s) | Pose | Camera | Must show |
|---|---|---|---|
| 0.5 | `d` front, at rest | FULL | moustache, belly over the belt, buckle, socks in sandals, holster on screen left |
| 1.5, 2.5, 3.5, 4.5 | `d` turned 45, 90, 180, 270 | FULL | the belly 0.05 beyond the belt in profile; pockets; collar band, yoke, welts and bald head behind; the holster's side on one of the two profiles |
| 5.5 | `d2` and `tato`, front | pos (-3.0, 0.75, 5.0), look (-3.0, 0.6, 0), fov 30 | panel 4. Print both crowns from the layout: 1.18 and 0.69 |
| 6.5 | `d` belt-hitch pose | FULL | panel 1 |
| 7.5 | the same from his right front | pos (-2.4, 0.75, 3.4), look (0, 0.5, 0), fov 30 | the right fist beside the holster, 0.02 clear of it |
| 8.5 | `d` neutral | HEAD | panel 2. The smile's middle under the notch; each eye about 256 x 363 px |
| 9.5 | `d` mouth open 0.6 | HEAD | the whole opening below the moustache |
| 10.5 | `d` `shocked` | HEAD | brows clear of the leaves; the eye zone empty |
| 11.5 | `d` eyes down (look [0, -0.6]), lids 0.4 | pos (0, 1.50, 1.9), look (0, 0.82, 0), fov 30 | the phone look from above: moustache and leaves off the eyes |
| 12.5 | `d3` seated | pos (4.9, 0.9, 3.2), look (3.0, 0.55, 0), fov 30 | no cloth in the seat; socks out of the leg openings, not through the cloth |

Belt-hitch pose, both arms: `{ o: [-0.16, 0.19, 0.335] }`, elbow 0.22, hand shape `fist`: the knuckles on the belt's front at th +-0.62 (x +-0.27). The belt is costume, not a prop: no pin, so tune `fwd` until each fist touches and sinks under 0.01. A thumb cannot hook the waistband on this rig: fists on the belt, as drawn.

Motion tail, camera FULL (the seat part: the 12.5 camera):

| At (s) | `d` does |
|---|---|
| 13.0 | a full turn at rest: 4 quarter turns of 0.75 s, 0.2 s apart |
| 17.0 | the same full turn holding the belt-hitch pose |
| 21.0 | the hitch: both fists up 0.04 (up 0.19 to 0.231) in 0.18 s, `squash` 0.06 once, down in 0.25 s |
| 22.0 | walks 1.2 m to +x and back |
| 25.5 | `d3` stands up and sits down again. End 28.0 |

## 6. Checks, in this order

1. `node storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-dad.mjs`, then `node qa/preflight.mjs <sb>` and `node qa/clear.mjs <sb>`.
2. `node engine/render.mjs <sb> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5 --draft --safe`, then `node qa/contact.mjs out/bench-dad-*.png --out out/bench-dad-sheet.png`.
3. `node engine/render.mjs <sb> --layout --from 13 --to 28`: the contact gate and the rig check. A hand `rig-jump` in either turn is the width test (section 7).
4. `node engine/render.mjs <sb> --draft`, then `node qa/check.mjs out/bench-dad.mp4 --sb <sb> --layout out/bench-dad.layout.json`. Cut 15 fps strips of 21.0 to 21.7 (the hitch) and 22 to 25 (the socks inside the shorts).
5. `node qa/golden.mjs; node qa/regress.mjs`: every still must come back with no difference. Dad only adds; a difference means a shared file changed by more than section 0 allows.
6. `node tools/vocab.mjs` to refresh the sheet.
7. Pass lines: the eye zone is empty on 8.5 to 11.5; on the contact sheet shrunk to 360 px wide the moustache, the buckle and the white socks still read on 0.5 and 5.5; no FAIL in steps 3 and 4.
8. Hand the director: the still sheet, three pairs against the drawing (0.5 with panel 1, 8.5 with panel 2, 5.5 with panel 4), the measured table of section 2, every verdict. At most 3 fix rounds, then stop and report.

## 7. Changed from the sheet; open questions (my default); risks

Changed, with the reason:
- The face is lower and larger. The sheet puts small eyes at 0.83 of his height; the rig's skin leans back too far up there and the family eye is a tall oval. Eye centres are at 0.71 of his height, so the polo front is 0.13 tall, not 0.23: the belly reads by the overhang and in profile.
- Eyes: the family's tall oval, not the sheet's rounder eye; size from panel 4 (1.36 of Tato's), which is smaller than Wedge's.
- Tato's crown is at the top of the moustache, 0.08 above panel 4 (the moustache tips). "0.56 of him" and "head at his chest" cannot both hold with a family-size face on this rig: I kept 0.56.
- Arms: the rig's thin arms from b 0.34, not thick arms from the collar line.
- Three leaves (drawn: three to four), two sock rings (drawn: two to three), no bare knee, a closed holster.
- Buckle 0.105 x 0.074, a little smaller than drawn. All hex colours are read by eye from the sheet.

Open questions:
- Q1 Leaf colour: the sheet's olive `#8fb03a` (default), or the family green `#6cbf3a`.
- Q2 The hitch: fists and a squash on a fixed belt (default). If it reads as hands sliding: belt, holster and shorts rise 0.035 on a costume key, one more builder task.
- Q3 Eye size: 0.99 (default). At Wedge's 1.19 the moustache and collar drop 0.02 and the polo front shrinks to 0.09.
- Q4 Voice: `wedge` as a placeholder (default) until Jonny picks by ear. Episodes 1 and 2 keep Wedge as Dad (default).

Risks:
- **Width.** 0.874 real is under Wedge's 0.88, but that limit was found on a top-heavy body. Dad is widest at b 0.39, right where his arms come out (b 0.34): the worst place. If a hand jumps in a turn: width 0.84, then 0.82, depth unchanged. At 0.82 stop and report.
- **Depth 0.76** is the deepest potato yet (Plato 0.70), and the belly dome adds 0.028 the arm solver does not know. A hand in front of the belly (the phone in episode 3) needs its own forward number: start at 0.50. Fallback: depth 0.72, `belly` 0.02.
- **Legs 0.20.** No plain potato has legs over 0.14. If still 12.5 is not clean with the sit action's `feet` (start [0.34, 0.06]) in one round: legs.height 0.14. Then he stands 1.12, Tato's crown is at his eye bottoms, and the rings shrink to 0.010 with a 0.008 gap.
- **The moustache hides the mouth corners.** Speech reads by the lower lip only. If 9.5 does not show the whole opening: mouthV -0.16. Check in the layout that the moustache is not counted as a hidden face.
- **CPU renderer (Mesa llvmpipe).** No alpha anywhere; no line under 0.004 wide; only 2 sleeves and 4 rings are rebuilt per frame; textures 1024 x 512 at most; the whole costume under 60 000 triangles; no new light. If the brass goes flat in the toon pass: one highlight line `#f3d27a`, 0.004 wide, on the buckle's top bar.
- **Pale blue on a pale wall** vanishes: the set designer keeps the wall behind him mid-tone.

Cut first, if one fix round does not clean a piece: moustache strand lines, pocket buttons and stitch lines, belt loops, tuck creases, yoke seam, sandal buckles. Never cut: the moustache, the belly overhang, the buckle, the holster, the sock rings, the three leaves.
