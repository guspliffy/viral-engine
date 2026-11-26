# Potato Desk 14 — Heaven reads your search history: design (Fable 5.2, 25 Nov 2026)

From OUTLINE-B v2 (H1 + E1), `lines.mjs` (19 lines) and the 16 panel TEXTS (`b-search/sheets/panels-prompt.txt`). The drawn sheet could not be
fetched: known from it only "tall cells, the trapdoor's glow is a RING round it (06 dimmer, 07 brighter), no readable text". New pieces only; set,
Angel A, look, light and units as `../heaven-steps/DESIGN.md`. Station T = heaven-steps' T: origin top edge of riser 100, y 0 = the terrace,
+x right, +z downhill, metres. Facing: 0 = +z (downhill), +90 = +x, 180 = uphill. 1080 x 1920, 30 fps.

Lens: focal px = 960 / tan(fov / 2): 28 = 3850, 30 = 3583, 31 = 3462, 34 = 3140, 38 = 2788, 40 = 2638, 48 = 2156. Captions rows 486-608. Eyes,
brows, mouths below row 640. The app's text covers rows 1500+: the trapdoor counter stays above 1500. Whole frame sharp, no roll.
Every camera is a FIRST FIT worked out by hand: run all through `qa/camfit.mjs` in one batch; the queue marks are the least settled numbers.

**Two camera families.** F looks uphill (gate, Angel, screen; the queue's backs). R looks downhill from the gate side: every face, the trapdoor
at their feet, the stair falling into grey and red cloud behind. The terrace is 3.8 deep and the gate stands 0.9 behind the trapdoor, so in R
shots the `pearlgate` is hidden (it is behind the lens). R-POV is the screen's own point of view: everyone looks up into the lens.

## 0. Cameras (station T; each moves; times are targets, the measured lines win)

| # | Cam | Position -> look, fov | Move | Sees (first fit) | s | Panel |
|---|---|---|---|---|---|---|
| 1 | F-HELL | (1.70, 2.70, 6.80) -> (0.20, 0.91, -1.47), 38 | push 4 %, 3-frame 0.02 shake when the leaves hit | 315 px/m. Gunslinger on the trapdoor (rim cols 209-599, rows 1183-1303), eyes row 994, hat top 785; drop at ~1.5 s. Angel cols 707-991, eyes 970, halo top 732, finger ON the button (col 881, row 1153). Hero bottom left (cols 52-314, head top 967), Chip's edge at col 0. Pearls row 620. Screen above the frame | 0-2.0 | 01 |
| 2 | R-GULP | (-2.00, 1.15, -4.30) -> (-0.70, 0.70, -0.60), 30 | drift x +0.10 | ~900 px/m. Hero left, eyes row 835, staring down-left at the leaves snapping shut (frame foot, rows 1650+: the glow on his face dies); Chip right behind his shoulder, 80 % clear, waves, casserole. "Next." | 2.0-3.4 | 02 |
| 3 | F-STEP | (1.20, 1.90, 5.40) -> (0.42, 1.14, -1.45), 34 | crane -0.20 | 448 px/m. Hero walks H0 -> H1 (3 steps, back to the lens), turns to the Angel: col 260, eyes row 1088. Angel col 865, eyes 1069, halo top 739, looks down over the rims, finger on the tablet. Trapdoor rows 1386-1532, pearls 615 | 3.4-5.6 | 03 |
| 3b | T-TAB | (1.60, 2.45, -0.25) -> (1.00, 0.46, -0.80), 30 | push 3 % | Heaven-steps' page insert. ~1650 px/m: tablet 660 px wide, his finger slides to the LAST row, red, 27 px high (tease 1) | 5.6-6.2 | new |
| 4 | F-SCREEN | (0.30, -1.45, 5.90) -> (-0.05, 0.69, -2.09), 38 | tilt up 3 deg as it lights | Heaven-steps' T-SLIDE position. ~220 px/m at the screen: bar 900 px wide, screen rows 155-446, caption band free under it, pearls 615. Queue backs: Rosti cols 0-308, Tot 599-999; hero in the aisle, col 467, rows 763-1016 (the top riser hides him below y 0.31). "Hide nothing.": `on` 0 -> 1, empty bar, cursor | 6.2-8.6 | 04 |
| S | F-BAR | (-0.20, -1.00, 8.00) -> (-0.20, 3.82, -5.40), 31 | push 4 % | 238 px/m: bar cols 52-1028, screen rows 621-938, caption band on sky above it, gate top and halo below (rows 1210+). The search types in step with the Angel's voice. Reused for searches 1-5, 1.0-1.4 s each | x5 | new |
| 5 | R-POV | (0.10, 4.45, -4.90) -> (-0.35, 0.85, -0.70), 40 | drift x +0.15 | From the screen. Six faces looking up: queue eyes rows 645-800 (Dauphin col 276, Tot 373, Rosti 771, Duchess 912), Chip 1035 (col 907), hero 1195 (col 697, 524 px/m). Ring 580 px wide, slot row ~1480. Rows 200-640: stair, landing 90, cloud. Queue chuckles behind gloves, hero scratches by his leaf. "Fine." | 9.9-13.0 | 05 |
| 6 | R-TWO | (-1.20, 1.45, -4.90) -> (-0.39, 0.57, -1.19), 34 | push 5 % | 800 px/m. Hero cols 72-684, eyes row 760, stiff, eyes slide to screen-right; Chip cols 654-1070, eyes 930, stares at the back of his head; Rosti's face over Chip's head, row 757. Slot + ring at rows 1380-1480: first thin line. "...What?" | 14.4-18.0 | 06 |
| 7 | R-POV-B | as 5, look (-0.45, 0.60, -0.80), 34 | push 5 % | Chip lowers the dish (`lid` 0 -> 1), queue gloves over mouths, slot wider. "My casserole?" | 19.5-23.5 | 07 |
| 8a | R-POV | as 5 | drift x -0.15 | Gloves on hearts, Chip softens, hero's grin; the slot draws back. "Awww." | 24.6-26.6 | 08 |
| 8b | F-GAP | (0.60, 1.90, 5.20) -> (0.20, 1.12, -1.70), 34 | push 4 % | Gate `open` 0 -> 0.16: a strip of light between the leaves behind him; hero sidesteps to H2, leans, glove out to the tablet | 26.6-28.8 | 08 |
| 8c | T-TAB | as 3b | drift x -0.05 | His glove lies flat over the red last row (tease 2); the Angel's finger taps row 5 beside it | 28.8-30.0 | 08 |
| 9a | R-TWO | as 6, start 5 % in | push 3 % | "A NEW one?": Chip gasps, dish drops 0.12 and tips 30 deg; hero's eyes go wide, he has not turned yet. Gate slams (5 frames) on the first word, off screen; it is seen shut behind him in 9b | 31.2-33.2 | 09 |
| 9b | F-OTS | (0.30, 1.05, 2.60) -> (-0.45, 0.70, -1.00), 34 | drift x -0.10 | Over Chip's shoulder (the angle panel 06 names): Chip's back cols 0-530, hero spun round to him (face 20), both gloves up, eyes row 828; gold bars behind his head, glow at his heels. "That's out of context!" | 33.2-35.4 | 09 |
| 10 | R-LOW | (0.10, 0.45, -3.65) -> (-0.20, 0.59, -1.25), 48 | crane +0.10 | 860 px/m, low: the slot a glowing band across the frame at row ~1500, his toe tips on its far edge, light fan up his shins, eyes row 730, brows 645. `crack` 0.85 | 35.4-37.4 | 10 |
| 11 | F-ANGEL | (0.75, 1.18, 3.60) -> (1.10, 0.85, -1.15), 28 | push 3 % | Heaven-steps' T-EYES. 755 px/m: eyes row 900, brows up 0.03 over the rims, finger stopped on the tablet (rows 1300-1350). "Oh. The last one." (tease 3) | 37.4-40.0 | 11 |
| 12 | F-BEG | (1.10, 1.90, 4.90) -> (0.42, 1.10, -1.40), 34 | push 5 % | Hero down on K, gloves clasped, eyes row ~1190, looking up-right; Angel eyes ~1075 does not look up; slot row ~1480. "Not the last one. Please!" | 40.0-43.0 | 12 |
| 13 | F-LAST | (0.20, 0.80, 10.60) -> (-0.09, 1.30, -1.40), 34 | push 6 %, the whole line | Heaven-steps' T-HUNDRED position. Screen rows 205-480, 190 px/m: "how to delete / search history" typed one spoken word at a time, cap 49 px. Pearls 827, Angel eyes 1064. Hero small in the aisle (cols 411-611, rows 1090-1300), orange at his knees; queue backs rows 1100-1700 | 43.0-49.0 | 13 |
| 14 | R-CHIP | (-1.90, 1.05, -2.40) -> (-0.72, 0.45, -0.56), 34 | push 4 % | 1420 px/m. Chip alone, turned from his friend (face 195): eyes closed, slow head shake, dish hugged to his chest (row ~1130); eyes row 890 | 49.0-51.5 | 14 |
| 15 | F-BUTTON | (1.75, 1.25, 1.90) -> (1.20, 0.80, -1.00), 30 | tilt down 3 deg with the finger | 1190 px/m. Deadpan face (eyes row 778); the finger rises, comes down on the gold dome (200 px wide, row 1349) ON "Hell." | 51.5-54.0 | 15 |
| 16 | T-DROP | (3.30, 2.90, -0.45) -> (-0.35, 0.20, -1.10), 40 | crane +0.15, 2-frame 0.02 shake | NEW side and height (from above the Angel's side, 36 deg down): open trapdoor 700 x 445 px (rows 879-1324), hero faces the lens, arms up, drops through it; Chip top left (col 160, eyes 718) at the rim, looks down after him; the finger still on the button at the frame's foot. CUT 15 frames after the press | 54.0-55.0 | 16 |

## 1. Marks (station T; foot roots x, z; y 0 unless given)

| Who | Mark | Face | When |
|---|---|---|---|
| Angel | (1.13, -1.50), behind the podium (as built in heaven-steps) | -25 | whole clip |
| Gunslinger | drop axis (-0.20, -1.32) | 60 | frame 0 to the drop |
| Hero | H0 (-0.68, -0.72), 0.05 clear of the Gunslinger | 100, recoiling (165 in shot 2) | shots 1-2 |
| Hero | H1 (-0.20, -1.25): on the FRONT leaf, toe tips 0.05 short of the seam | 180 in R shots, 70 in F two-shots | from shot 3 |
| Hero | H2 (0.28, -1.12) on the rim, leaning 15 deg to the podium | 95 | 8b, 8c |
| Hero | K (-0.20, -1.28) crouched low, gloves clasped; he drops on (-0.20, -1.32) | 75 | 12-16 |
| Chip | CH0 (-1.05, -0.15) on tread 100 | 170 | shots 1-2 |
| Chip | C1 (-0.78, -0.56), dish 0.04 off the hero's back; 0.10 forward to the rim for 16 | 160 (195 in 14) | from shot 3 |
| Duchess | (-0.88, +0.75), tread 98, y -0.44 | 175 | whole clip |
| Tot | (+0.55, +0.80), tread 98, y -0.44 | 185 | whole clip |
| Dauphin | (+0.85, +1.30), tread 97, y -0.66 | 190 | whole clip |
| Rosti | (-0.60, +1.75), tread 96, y -0.88 | 175 | whole clip |

Queue = four existing glove-hand side cast (`potatobrawl/duchess`, `tot`, `dauphin`, `rosti`: strangers, no fighters, not Wedge or Mash). They stand
two and two with a centre aisle x -0.25..+0.18 (F-SCREEN and F-LAST see the hero through it; F-HELL sees the trapdoor over the short one). Tread 99
stays empty. Nobody in the queue walks. Only the hero (H0 -> H1) and Chip (CH0 -> C1) move up one place.

**States by line**
| Line | Screen | `crack` | Tablet `row` | Other |
|---|---|---|---|---|
| 0 poker, HELL | `on` 0 | 0; `open` 0 -> 1 at ~1.5 s, shut by 2.6 s | - | button `press` at "HELL." |
| 1-3 Next, Out loud, the rule | `on` 0 -> 1 on "Hide nothing." | 0 | 0, glance at row 6 | - |
| 4-5 plants, Fine | text 1 | 0 | 1 | - |
| 6-7 pay back | text 2 | 0.25 | 2 | - |
| 8-9 cooking | text 3 | 0.5 | 3 | dish `lid` 1 |
| 10-11 baby bird | text 4 | 0.35 (it draws back: false hope) | 4 | gate `open` 0.16 (light about 20 %; 0.25 if it does not read) |
| 12-14 new best friend | text 5 | 0.85 | 5 | gate shut in 5 frames |
| 15-16 the last one | bar empty, cursor | 1 | 6 (red) | - |
| 17 delete | text 6: `type` 0.11, 0.22, 0.48, 1 on the four spoken words; `alarm` 1 | 1 | 6 | - |
| 18 Hell. | - | `open` 1 | - | button `press` |

## 2. NEW pieces

**`searchscreen`** — origin the panel's centre; place at T (-0.20, 4.64, -5.40), pitched 15 deg forward (top toward +z), 0.6 in front of the rays card.
| | |
|---|---|
| Size | Panel 4.40 x 1.20, gold frame tube 0.12: outer 4.64 x 1.44 (y 3.92..5.36). The gate is 1.90 wide: 2.4 gates. |
| Frame | `#e8b93a`, shade `#b8862a`, light `#ffe89a`; 4 corner pearls r 0.09 `#fbf8f2`; the gate's crest (disc r 0.13, star, 7 rays) top centre; a white wing at each upper corner, 0.62 high, the Angel's wing build, each its own drawing, flutter 5 deg at 0.5 Hz. The screen bobs 0.03 at 0.25 Hz. Phases 0 at t 0. Back plain `#b8862a`. |
| Page, bar | Unlit paint like the reviewtablet's screen (no bloom). Page `#e9eef5`. Bar 4.10 x 0.92, corners r 0.22, `#ffffff`, outline 0.022 `#b9c4d0`. Magnifier 0.34 from the bar's left end: ring r 0.14, stroke 0.045, handle 0.16 at 45 deg, `#5a6b7a`. Nothing else: the sheet's grey lines stood in for this text. |
| Text | The one place with words in the picture. Lower case, DejaVu Sans Condensed 800 (the hell-reviews condensed face), `#1f2a36`, left-aligned in a box 3.30 x 0.72 that starts 0.66 from the bar's left end. The director passes `text` with one line break; at most 2 lines x 24 characters. Cap height = min(0.26, 3.30 / (0.76 x characters of the longer line)), fixed from the first letter; line pitch 1.55 cap. |
| `type` 0..1 | Letters shown = floor(type x letter count), tweened linear across the spoken line. Cursor 0.035 x 1.15 cap after the last letter: solid while `type` moves, else 12 frames on, 12 off from the frame number. |
| `on` 0..1 | 0: page `#3b4660`, bar at 25 %, no cursor. 1: lit, plus a glow card 5.6 x 2.4 `#fff6d0` at 30 % behind the frame. Lights with a flicker: 0.6, 0.2, 1 over 6 frames. |
| `alarm` 0..1 | Outline to `#d3261e`, 0.022 -> 0.05 (last search only; cut first). |
| The six texts | 1 `is it normal to talk / to my plants` cap 0.217. 2 `why does my best friend / never pay me back` 0.189. 3 `how to pretend i like my / best friend's cooking` 0.181. 4 `how to save / a baby bird` 0.26. 5 `how to get a new / best friend` 0.26. 6 `how to delete / search history` 0.26. |
| Readable cap | F-SCREEN (the wide, 220 px/m): 40-57 px. F-BAR (238 px/m): 43-62 px. F-LAST (190 px/m): 49 px for text 6. Under 40 px nowhere. |

**`gatetrap`** — origin the opening's centre on the terrace top; place at T (-0.20, 0, -1.40) = the centre of the terrace's inlay ring, which stays
as its outer border (r 1.05; the whole inlay cannot be the door: the podium and both gate pillars stand on it).
| | |
|---|---|
| Rim | Gold ring r 0.52..0.62, 0.015 proud, `#d9a93a`, inner bevel light `#ffe89a`, shade `#b8862a`; 6 flat rivets r 0.014 at uneven angles; a hinge knuckle 0.16 long at the front (+z) and at the back (-z). |
| Leaves | Two half-discs r 0.52, 0.04 thick, `#e8b93a`, one sheen stroke `#ffe89a` at 12 %, one engraved line 0.01 `#b8862a` 0.06 inside the edge. The seam runs LEFT-RIGHT (along x) so every camera sees it broadside: closed, a dark line 0.006 `#6b4a2b`. Drawn once: 3 sole scuffs `#c99a2e`, a soot crescent `#6b4a2b` at 25 % on the seam's middle 0.30, one dent. |
| `crack` 0..1 | The counter. Each leaf draws back crack x 0.05 under the rim lip: slot 0.006 -> 0.10 wide, core `#ffd23f`, edges `#ff7a1c`, unlit. The sheet's ring: a leak band inside the rim 0.004 -> 0.03 wide, plus an additive halo from r 0.45 to r 0.70 + 0.25 x crack at 12 % + 38 % x crack. A light fan standing in the slot (1.04 wide, 0.08 + 0.42 x crack high, `#ffb14a` fading up, 50 % x crack) and a floor pool r 0.8 + 0.6 x crack `#ff9a2e` at 30 % x crack. Flicker 8 % on 12 segments, fixed phases. The leaves stay flat: his feet never float. At crack 1 the front leaf's edge is under his toe tips (panel 10 by itself). |
| `open` 0..1 | Both leaves swing DOWN 86 deg on their rim hinges (range -0.05..1.10). Shaft r 0.52, 1.80 deep, drawn on its inside only (nothing shows from outside or under the slab): `#ffb14a` at the top, `#ff6a13` at 0.6, `#8f1f1c` at the bottom, floor disc `#ffd23f` to `#ff7a1c`. Fan 1.3 x 1.5 at 45 %, pool r 1.5 at 40 %, the existing `embers` box over it. Open: 0 -> 1.06 in 4 frames, ease-in, back to 1 in 3. Shut: 1 -> -0.04 in 5, 0 in 2. |
| Drop | Leaves solid under `open` 0.05 (stand, crouch). From 0.5 the opening is free, 1.04 across (Gunslinger 0.80, hero 0.76). The body hangs 2 frames on the axis, eyes to the lens, then falls by physics: head under the rim 11-12 frames after the press. |
| Bench | One still from 20 deg above the floor at 700 px/m with crack 0, 0.25, 0.5, 0.85, 1 side by side: each step must read at a glance. |

**Tablet.** A recolour of `reviewtablet` is NOT enough: its screen has "RATE YOUR STAY" and five stars baked in. A variant is (same slab build): gold
`#e8b93a` bezel and back, edge light `#ffe89a`, one raised halo ring r 0.06 on the back; LANDSCAPE 0.40 x 0.28 x 0.018; page `#fffbe8`, no words:
6 rows, pitch 0.038, each a magnifier dot r 0.009 `#8a8f96` and one line 0.016 high `#b9b2a0` of its own length (0.24, 0.30, 0.33, 0.19, 0.25);
row 6 is `#c8362f`, 0.27 long. `row` 0..6: a highlight bar `#ffd76a` 0.034 high on that row, earlier rows at 35 %. It lies where the ledger lay:
podium-local (-0.07, 0.42, +0.02), tilted 14 deg to the lens (back edge y 0.51, the ledger's proven clearance under his mouth).

**Casserole.** `cloche` does not carry it: a silver restaurant dome r 0.24 (Chip is 0.57 wide), silver with no colour key, and a dish under it would
be a new piece anyway. One small new kind `casserole`, origin bottom centre: dish r 0.12, 0.085 high, blue enamel `#3f7fb5` (shade `#2c5d8a`, so it
reads against his yellow hoodie and the gold set), cream rim band 0.012 `#f3ead2`, two ear handles 0.035 out, 0.06 wide at y 0.065; lid a low dome
0.04 with a cream knob r 0.018 (top 0.15). Drawn once: a red heart `#d3261e` 0.045 on the lid (R-POV sees the lid from above), one enamel chip on
the rim. `lid` 0..1: the lid slides 0.03 and tips 18 deg, showing a crust `#d9a441` with 4 darker spots `#a8752a`. ONE hold all clip, both gloves on
the ears: held out (y 0.34), lowered (0.16), tipped 30 deg, hugged to the hoodie (0.30). 0.31 across the ears = 54 % of Chip.

**Button: yes.** It is the cause on screen. His finger is on it at frame 0, so the viewer knows what it does; at the end the raised finger is the
picture for the beat before "Hell." (no freeze). `hellbutton`: base ring r 0.105 x 0.03 `#8f1f1c` with a gold lip `#e8b93a` (the dark red makes a
gold dome readable on a gold-rimmed podium), dome r 0.085, 0.05 high, `#f6c744`, light `#fff3b0`, shade `#b8862a`. `press` 0..1 sinks the dome 0.028
and lights a ring 0.012 `#ff3b22` round it. Place: podium-local (+0.21, 0.42, -0.08) = T (1.26, 0.42, -0.88), 0.62 in front of the Angel: the
ledger's writing reach, screen-right glove, index only.

**Reuse as they are:** `heavenstairs`, `stairsky`, `zoneclouds`, `heaventerrace`, `pearlgate`, `cloudpodium`, `gaterays`, `fogveil`, the 9 `cloudpuff`,
`embers`, Angel A (`heaven-steps/angel-hs`), Spud, Chip, Gunslinger. Not placed: `ledger`, `goldquill`. Angel faces: `deadpan`, `sideeye`, `soft`.

## 3. Phone read at 1080 x 1920

- Captions and the screen share the upper third. The screen hangs high and far on purpose: only cameras 4, 13 and S see it, at rows 155-480 or
  621-938, and the caption band is free in all three. No other shot has both.
- The slot is 0.10 wide at most: 8-35 px from R cameras. The fan and halo carry the count; the bench still above is the proof.
- The red last row is 4 px in any two-shot: it gets T-TAB twice (27 px).
- Yellow Chip on gold: in F shots he is a back; his face is only shot from R, against marble and cloud.
- Six faces in R-POV are 160-400 px wide. Queue reactions are whole-arm poses (gloves to mouth, to heart), not small face changes.

## Departures from the panels (ask Jonny before the build; reason after each)

1. 01: the screen is above this frame, on standby, and lights up in 04 (OUTLINE beat 2). A camera that sees into the trapdoor looks down 12 deg;
   the screen is 3.9-5.4 up; rows 215-608 carry the label and first caption. The hero is seen from his right rear: his face is shot 2.
2. 06: shot from the front, not over Chip's shoulder: the stare and the sliding eyes both need a face. The over-shoulder angle is 9b.
3. 08 in three shots, 09 in two: no camera on this set sees the queue's faces, the gate and the tablet at once; in 09 he turns his back to R.
4. The tablet lies on the podium (cast text: "always holding"): held up, it covers his mouth from every F camera.
5. 09: the dish tips and drops 0.12 in both gloves instead of slipping from one hand: one hold for the whole clip.
6. Queue two and two with an aisle, not single file: in single file faces 3 and 4 hide behind 1 and 2 from every camera.
7. The hero stands on the front leaf, not the centre; the gate is hidden in R shots.

## Open questions (my default)

1. Hide the gate in R shots (default yes; without it the queue has no faces).
2. Riser numbers 98-100 mean nothing here and compete with the screen: hide them if `heavenstairs` can (default), else leave them.
3. Search lines in shots 4, 13, S: caption AND typed screen (default, they never touch), or screen only.
4. Gunslinger's hat: lifts 0.30 on the hat mount and drops with him (default), no loose hat prop.
5. 16 "leaf flying": the sprout stays on, whipped straight up (default); a loose leaf is one more prop.
6. "On his knees": `crouch` with clasped gloves (default); a real kneel is a new pose.
7. Panel 10's orange on his face: the fan card plus one orange light for that shot if the look has one (default), never a recoloured skin.

## Risks to timing and scope

- R views look DOWN the stairway from the top, which heaven-steps never rendered (its clouds were placed off the old sight lines): render stills of
  R-POV, R-TWO, R-GULP and T-DROP first. R-GULP and R-CHIP sit 1.0-1.4 from two terrace puffs.
- 26 shots, 3 new props with states + 2 small ones. Cut order: screen wings, `alarm`, shot 3b (keep 8c), the gate light in 8b.
- New contacts: glove flat on the tablet (8c, a reach of 0.49 from H2), finger on the button, the crouch. Everything else is one hold or none.
- Two character drops by physics through a 1.04 hole with 0.12-0.14 to spare: bench the Gunslinger's first (he is the wide one, with a poncho).
- F-SCREEN sees the hero only from y 0.31 up, and Tot's back covers part of the Angel there: the screen and the queue are that shot's subject.
