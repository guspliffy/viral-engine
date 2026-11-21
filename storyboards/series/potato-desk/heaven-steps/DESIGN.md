# Potato Desk — Heaven Steps: design (Fable 5.2, 20 Nov 2026)

From `STORY.md` (outline v1, 8 beats, ~34 s) and the three drawn sheets in `ref/` (concept v1 = Angel A/B/C + props, set v1 = the
stairway, panels v1 = 15 panels). New pieces only; canon cast, look and units as `../DESIGN.md`, `../05-court-day/DESIGN.md` and
`../09-hell-reviews/DESIGN.md`. Axes +x right, +y up, +z toward the camera = DOWNHILL, metres. 1080 x 1920, 30 fps. Flat toon colours,
one-off canvas art for every mark. Standing heights: Chip 0.67, Spud 1.02, Devil 1.06 (horns 1.20), small demon 0.44, Angel 1.34.

**Four stations, one stair.** Every mark and camera below is in a STATION frame (same axes as the world, no yaw):

| Station | Origin in the world (x, y, z) | What the origin is |
|---|---|---|
| **T** top | (0, 22.00, -55.30) | top edge of riser 100, centre of the top flight; y 0 = the terrace |
| **N** ninety | (-0.70, 19.80, -49.60) | front edge of landing 90, under Chip's mark |
| **M** sixty-one | (1.20, 13.42, -33.70) | nose of tread 61, under the soapbox |
| **B** bottom | (0, 0, 0) | foot of riser 2 on the stair's centre line; y 0 = hell's floor |

Lens: focal px = 960 / tan(fov / 2): fov 24 = 4516, 26 = 4158, 30 = 3583, 34 = 3140, 40 = 2638; px per metre = focal px / distance.
Captions rows 486-608. Eyes, brows and mouths stay below row 640 in every shot; only sprouts, the halo, the gate's pearls and sky may
enter rows 200-640. Whole frame sharp, no roll. Every camera is a first fit: run all of them through `qa/camfit.mjs` in one batch.

## 0. Cameras (33 shots, each moves; times are targets, the measured lines win)

| # | Cam | St. | Position -> look, fov | Move | Sees | s | Panel |
|---|---|---|---|---|---|---|---|
| 1 | T-LOOP | T | (0.45, 0.89, 9.60) -> (0.45, 0.89, 0), 26 | push to z 8.70, ease-in from rest | Pose A, the loop frame: audit below. 445 px/m at Chip | 0.0-1.7 | 01 |
| 2 | T-CHIP | T | (-0.15, 0.22, 5.90) -> (-0.15, 0.22, 0.25), 24 | drift x +0.10 | Chip alone, right of centre (cols 513-967), 799 px/m, eyes row 936, sprout top 640; "99" 142 px high at row 1420; gate behind him; the Angel is off screen right (eye line up-right) | 1.7-3.0 | 02 top |
| 3 | T-TRIP | T | (-0.40, -0.05, 8.40) -> (-0.40, -0.05, 0.50), 26 | push 5 % | 526 px/m. Spud sprawled on 98 at left (cols 170-584), the case, Chip on 99 leaning to it (cols 650-940); "99" row 1107, "98" row 1241 | 3.0-4.6 | 02 |
| 4 | T-HUNDRED | T | (0.20, 0.80, 10.60) -> (0.20, 0.80, 0), 26 | crane +0.22 with the lift | 392 px/m, all three in frame. The gold tread carries Chip + case from "99" (row 1426) to "100" (row 1317, 67 px high); Spud looks up from 98; the Angel does not look up | 4.6-5.8 | 03 |
| 5 | T-GATE | T | (-0.40, 0.75, 6.60) -> (-0.40, 0.75, -1.00), 26 | push 6 % | 607 px/m at Chip (cols 670-1016, eyes row 1130); Spud lower left looking up at him (eyes row 1318); behind them the leaves swing in (rows 554-1310), light pours over the terrace. Angel off screen | 5.8-7.0 | 03 |
| 6 | T-BRAG | T | (0.55, 0.72, 7.00) -> (0.55, 0.72, -0.25), 26 | drift x -0.15 | 573 px/m. Chip arms up (col 282, eyes row 1103); Angel col 832, eyes row 869, head top 648; Spud and case walk into the light at the left | 7.0-8.3 | 04 |
| 7 | T-MINUS | T | (0.85, 0.72, 5.20) -> (1.15, 0.72, -1.10), 26 | push 4 % | The Angel alone, 644 px/m: eyes row 844, mouth 1012, the quill writes one stroke on the ledger (rows 1085-1150) | 8.3-9.1 | 04 |
| 8 | T-FOLD | T | (2.10, 1.30, 4.80) -> (0.15, 0.15, 0.30), 30 | tilt down 4 deg | 711 px/m, from above the right parapet: treads 100, 99, 98 tip one after another, "100" "99" "98" vanish under them, Chip drops on his seat | 9.1-9.6 | 05 (fold) |
| 9 | T-SLIDE | T | (0.30, -1.45, 5.90) -> (-0.30, 0.45, -1.00), 32 | tilt down 6 deg in the last 8 frames | From landing 90 up the slide: Chip slides at the lens (col ~320, face row ~1160); above him the gate leaves (cols 364-892, top row 661) SWING SHUT in 5 frames | 9.6-10.4 | 05 + 04 (gate) |
| 10 | N-LAND | N | (2.50, 0.75, 5.60) -> (-0.30, 0.38, -0.75), 26 | drift x -0.20 | 598 px/m. He bumps down on landing 90 over the gold "90"; wilted flower and gold can at the open edge, grey cloud behind | 10.4-11.2 | 06 |
| 11 | N-FLOWER | N | (2.00, 0.60, 4.30) -> (-0.38, 0.42, -0.80), 26 | push 5 %, crane +0.22 with the lift | 739 px/m. Can in the screen-left glove, phone raised screen-right; bloom; the gold tread lifts him to "91". Eyes row 923, sprout top 660, "90" row 1390 (135 px high) | 11.2-13.1 | 06 |
| 12 | T-PAGE | T | (1.60, 2.45, -0.25) -> (1.05, 0.46, -0.80), 40 | push 3 % | Insert from over the Angel's shoulder: the quill writes "-30" on the right page, 105 px high | 13.1-13.7 | new |
| 13 | N-FOLD | N | (1.90, 1.75, 2.40) -> (0, 0.35, -1.30), 30 | tilt down 5 deg | 816 px/m. Tread 91 tips, the phone pops out of his glove (150 px long here) and drops over the open edge | 13.7-14.2 | 07 (phone) |
| 14 | N-LONG | N | (6.70, -2.80, 20.60) -> (0.70, -3.20, 7.60), 40 | pan right 10 deg, crane -0.50 | The long slide: flights 81-90, 71-80, 61-70 step down toward the lens with their arches; Chip 70 px growing to 210 px; cloud turns from grey to orange | 14.2-15.4 | 07 |
| 15 | M-LAND | M | (-1.60, 0.90, 5.20) -> (-0.10, 0.40, -0.30), 26 | drift x +0.20 | 727 px/m. He skids to a stop seated on tread 61 beside the soapbox (megaphone on it) and the jar; balustrade, post and orange cloud at the left | 15.4-16.1 | 08 |
| 16 | M-DONATE | M | (-1.45, 0.80, 5.35) -> (0.25, 0.55, -0.30), 26 | push 4 %, crane +0.22 with the lift | 704 px/m. On the box: coin held up, dropped in the jar, gold tread lifts box + Chip from "61" (row 1440) to "62"; megaphone. Eyes row 861 | 16.1-17.9 | 08 |
| 17 | T-EYES | T | (0.75, 0.90, 3.60) -> (1.10, 0.90, -1.15), 24 | push 3 % | 950 px/m. The Angel's eyes over the gold rims (row 960), mouth row 1131; the quill tip scratches at the lower left | 17.9-18.6 | new |
| 18 | M-FOLD | M | (1.90, 1.90, 2.60) -> (0.05, 0.70, -0.80), 30 | tilt down 6 deg | 874 px/m. Tread 62 tips: box, megaphone and Chip pitch forward | 18.6-19.1 | new |
| 19 | M-TUMBLE | M | (0.90, 2.10, -1.20) -> (-0.40, -3.60, 9.50), 34 | tilt down 8 deg | Looking DOWN the folded stair: he rolls away from the lens into orange smoke, the red glow far below | 19.1-19.8 | new |
| 20 | B-ARRIVE | B | (0.50, 3.00, 7.80) -> (-0.10, 0.50, 0.60), 30 | crane -0.40 | 468 px/m. He rolls in from the top down the red slide and stops seated on step 2 (row 869); the treads snap back; hatch at row 1316, glowing | 19.8-20.7 | 09 |
| 21 | B-WIDE | B | (0.10, 1.60, 8.20) -> (0.05, 0.62, 0), 26 | push 5 % | 495 px/m. Chip cols 102-384, eyes row 876; Devil cols 540-1000, eyes row 836 (horn tips 553); "2" 85 px high at col 490, row 1105, in the gap between them; hatch rows 1350-1490; the Devil waves, the lid lifts | 20.7-21.7 | 09 |
| 22 | B-SLUMP | B | (-0.95, 0.95, 4.60) -> (-0.50, 0.72, -0.20), 24 | push 6 % | 935 px/m. Chip alone, slumped, eyes row 913, sprout drooped to row 651; orange light from below | 21.7-23.1 | 09 |
| 23 | T-SLIP | T | (-0.70, 0.75, 4.40) -> (0.75, 0.62, -0.60), 26 | drift x +0.15 | Angel 693 px/m, eyes row 821: pushes the glasses up with the quill hand, the quill slips, bounces off tread 100, 99, 98 out of frame bottom left | 23.1-23.8 | new |
| 24 | B-QUILL | B | (-0.90, 1.20, 1.20) -> (-0.35, 3.10, -6.00), 34 | tilt down 6 deg with the quill | Up the red flights: the gate is a gold spark at row ~650; a glint comes down the zig-zag, becomes the quill, bounces down the last 8 red steps at the lens | 23.8-25.0 | 10 |
| 25 | B-PICK | B | (0.10, 1.05, 7.20) -> (0.05, 0.95, 0), 26 | push 4 % | 558 px/m, level. Chip stands on step 2 (cols 46-364), eyes row 982, quill held UP, vane tip row 530 (no caption: silent beat); Devil cols 540-1072 lowers his shades, eyes row 967 | 25.0-26.6 | 11 |
| 26 | T-SOFT | T | (0.70, 0.88, 4.30) -> (1.06, 0.88, -1.10), 24 | push 3 % | 835 px/m. The Angel, `soft` face, looks down over the rims: "...Humility." | 26.6-27.4 | new |
| 27 | B-GOLD | B | (1.30, 1.10, 6.40) -> (-0.20, 1.20, -0.80), 30 | tilt up 12 deg | 487 px/m. Every red step turns gold from under his feet upward; the gold tread carries him off; the Devil LUNGES out of the chair and grabs air; the chair tips | 27.4-28.3 | 12 |
| 28 | X-RIDE | - | rides 4.60 uphill of his feet, 3.00 above them, x +0.60 -> his chest, 28 | camera path with him | 726 px/m. His face from above-front, quill held up; behind him the gold stair drops away, cloud goes red, orange, grey, white | 28.3-29.3 | 12 |
| 29 | T-ARRIVE | T | (0.90, 0.95, 7.60) -> (0.45, 0.75, -0.50), 26 | push 5 % | 513 px/m. He rises onto "100" (col 351); the gate swings open behind him (cols 42-588); Angel col 882; the gold drains from the steps | 29.3-30.3 | 13 |
| 30 | T-QUILL | T | (0.20, 0.62, 6.40) -> (0.62, 0.62, -0.50), 26 | drift x +0.10 | Chip 625 px/m (cols 42-398) holds the quill out across the podium; Angel cols 554-1020, eyes row 808 | 30.3-31.4 | 13 |
| 31 | T-HUMBLE | T | (-0.10, 0.60, 4.30) -> (0.05, 0.60, -0.30), 24 | push 4 % | Chip alone, 988 px/m, three-quarter, thumb at himself, eyes row 1088, sprout top 723; only the Angel's wing tip at the right edge | 31.4-32.6 | 14 |
| 32 | T-MINUS1 | T | (0.85, 0.74, 5.20) -> (1.15, 0.74, -1.10), 26 | push 3 % | Shot 7's framing again on purpose: the Angel alone, 644 px/m, eyes row 857, writes one stroke without looking up | 32.6-33.3 | 14 |
| 33 | T-LOOP-END | T | (0.15, 0.89, 9.60) -> (0.15, 0.89, 0), 26 | drift x to 0.45, ease-out, arrives on pose A at the LAST frame | Tread 100 tips, he skids to 99 and lands standing; the gate SLAMS (5 frames, 3-frame shake); last frame = frame 0 | 33.3-34.8 | 15 |

**Loop frame audit (pose A, frames 0 and last).** Chip on tread 99 at T (0.10, +0.25), body yawed +30 deg toward the Angel, head up 20 deg
(panels 01 and 15 draw his back: changed). Cols 257-511, sprout top row 1080, eyes 1245, feet 1454. "99" under his feet: col 380,
row 1517, 78 px high. Gate behind him: leaves cols 86-540, pearls' tops row 611, base 1271; his head sits in front of the white kick
panels (rows 1114-1271), not the gold bars. Podium cols 640-920, top row 1148; ledger back edge row 1107. Angel cols 635-965 (wing tips
563-1037): halo top row 676, head top 788, eyes 956, mouth 1056 (51 px clear of the ledger). Rows 200-610: sky and rays only.
Idle cycles (halo bob, wing flutter, cloud drift, toe bounce, quill hand) return to phase 0 on the last frame.

## 1. THE ANGEL — VARIANT A (new character, file `characters/potatobrawl/angel.json`, costume type `angel`; concept sheet top-left pair, back views and the five faces)

Jonny is still choosing A / B / C. A switch replaces THIS section only: height, marks, glasses, halo, quill hand and the acting states stay.

| | |
|---|---|
| **Body** | 1.20 high, 0.86 wide, 0.74 deep; an egg, widest at 0.38 of its height, taper 0.20, lump 0.02, seed 77. Standing 1.34 = 2.0 x Chip; sprout tip 1.50, halo top 1.63. |
| **Skin** | Canon `#e2a95c`, shade `#c98d47`; 7 potato-eye specks `#c98d47` and 6 freckles `#eec07e`, each placed once. Cheeks `#ff9f8f`. |
| **Eyes, mouth** | Spud's eye build, iris `#4a2a14`, lash 0.9. Standing heights: eyes 0.90, mouth 0.64 (must clear the ledger's back edge at 0.52 by 0.10). Brows short, thick 1.0, arch 0. Mouth small and flat. |
| **Glasses** | The signature. Round gold wire, rim `#e8b93a` 0.012 thick, lens diameter 0.17, centres 0.23 apart, bridge 0.05, worn LOW at 0.75 standing so the rims cross the eyes' lower third and he looks over them. Lens: one sheen stroke at 8 %. `slip` 0..1 slides them 0.03 down the nose. Reuse the teller's round-glasses piece (it has `slip`), gold, larger. |
| **Sprout** | One sprout, two small leaves in a V, `#6cbf3a`, size 1.0 (small on this body). |
| **Halo** | Gold ring, outer diameter 0.44, tube 0.022, `#f6c744`, emissive `#fff3b0` at 0.6, a soft glow card r 0.30 at 25 %. Floats 0.10 above the sprout tip, tipped 12 deg toward the lens (reads as an ellipse 0.44 x 0.12). Bobs 0.01 at 0.5 Hz, follows head turns 3 frames late. `tilt` 0..20 deg knocks it askew. |
| **Wings** | Two, small: each 0.46 high, 0.32 wide, 0.06 thick, a curved shell, not a card. Roots at body-local (+-0.30, 0.56, -0.30), the wing spanning body-local y 0.40..0.86 (shoulder to eye height); tip to tip 1.24. 5 primaries 0.20-0.26, 5 secondaries, 6 coverts per wing, `#fbf8f0`, shade `#e3dccb`, feather lines `#cfc6b0`, each wing drawn on its own canvas (not mirrored). Idle flutter 6 deg at 0.4 Hz; `flap` 0..1 pops them open 25 deg. |
| **Robe** | ONE white wrap robe `#f8f5ec`, shade `#e2dccd`, stand-off 0.02. It covers the body BELOW the face: shoulder line at body-local y 0.52, left panel over right in a V down to y 0.36 (the mouth at body-local 0.50 stays clear); gold trim band 0.035 `#e8b93a` on the collar edge, cuffs and hem; hem at body-local y 0.06 with a 0.04 flare and 4 fold strokes `#d9d2c0`, each drawn once. Short bell sleeves, diameter 0.24 to 0.20, 0.16 long, ending well before the wrist. |
| **Rope belt** | Twisted rope diameter 0.035, `#d9a93a`, twist marks `#b3831f`, round the body at body-local y 0.26; a bow at the front, two ends 0.20 and 0.16 with tassels 0.05 `#e8b93a`. |
| **Limbs, feet, hands** | Limbs `#6b4a2b`, width 0.034. White slippers `#f8f5ec` with a gold sole band `#e8b93a`. Glove hands as the cast's (3 fingers + thumb), size 1.7. |
| **Object** | The golden quill (section 4), in the screen-LEFT glove, beside the body edge, never in front of the face. |
| **Default face** | Neutral and open. Clip look `deadpan`: lids 0.45, mouth curve 0, brows flat, eyes on the ledger. |
| **Habit** | Writes the minus BEFORE he says it: one stroke, then the line. Pushes the glasses up with the quill hand before each "Minus" (beat 6: that is how the quill slips). The eyes come up over the rims only on the number. |
| **Acting states** | The sheet's five faces: `deadpan` (beats 1, 8); `sideeye` (beat 3: pupils to Chip, one brow down 0.02); `write` (eyes down, brows knit, each penalty); `oops` (beat 6: lids 0, small pupils, mouth an o 0.04, `slip` 1, `flap` 1, halo `tilt` 20, 6 frames in); `soft` (beat 7: curve 0.25, lids 0.3, eyes aside and down). |
| **Voice** | Dry, slow, low-mid registry clerk, no rise on a question, a half-second of nothing before each number. Proposal until Jonny has heard it: pitch 104, rate 2.8, formant 0.94, range 2, breath 0.05, seed 88. |

If B is picked: the long wings (to the knees) need the marks rechecked against the gate's right pillar and the frame's right edge in pose A.
If C: the cloud hair replaces the sprout under the halo and the moustache covers the mouth (acting moves to brows and lids).

## 2. SET — THE STAIRWAY OF 100 STEPS (set sheet, all five pictures; panels 01-15)

One step = one point. Tread n is n points; riser n is the face under its front edge and carries the gold number.

**The kit**
| | |
|---|---|
| Step | rise 0.22, going 0.50, width 2.40. Slope 23.7 deg, 0.546 along the slope per step. One box per step: 2.40 x 0.22 x 0.50. |
| Where | Riser n (n 1..100) at world z = -0.50 (n - 2) - 0.70 x floor((n - 1) / 10); tread n top at y = 0.22 n. Hell's floor y 0 from z +0.50 forward. Check values: riser 2 z 0; 61 z -33.70; 90 z -49.60; 91 z -50.80; 99 z -54.80; 100 z -55.30. Rise 22.0, run 55.8. |
| Landings | Every tenth tread (10..90) is a landing 1.20 deep. Tread 100 is a normal 0.50 strip in front of the terrace (it must fold). |
| Zig-zag | All flights run parallel (every riser faces +z, every number reads from the front). The zig-zag is a SIDEWAYS OFFSET of the flight centre: steps 1-20 x 0; 21-30 +1.30; 31-40 0; 41-50 -1.30; 51-60 0; 61-70 +1.30; 71-80 0; 81-90 -1.30; 91-100 0. A landing is as wide as both its flights together (3.70; landing 10 is 2.40), so each offset landing has an open half with cloud behind it: left at 90 and at 60, as in panels 06 and 08. |
| Parapets | Solid marble wall 0.14 thick, top 0.45 over the nosing line, gold cap 0.05 x 0.18; one sheared box + cap per flight side from step 11 up (18 walls), short level pieces on landing edges (about 22). None on steps 1-10 (rock instead). |
| Posts | Newel 0.16 x 0.16 x 0.62 with a pearl ball r 0.09 (top 0.80) where a parapet starts or ends (about 34, instanced). The top pair at T (+-1.27, 0) is 0.40 high in all, so it stays under the podium top in pose A. |
| Balusters | Turned, 0.38 high, pitch 0.22, ONLY where a medium shot sees them: terrace right side and back-right (25), landing 60's open edge (5). Landing 90's open edge is BROKEN: a 1.13 gap, 2 stumps, 3 marble chips (set sheet, picture 2). |
| Arches | The sheet's arcades only on the +x side of flights 61-70, 71-80, 81-90 (camera 14): a wall 4.5 long, 3.2 deep, 0.20 thick with 2 round arches 1.50 x 1.90 and piers 0.50, feet lost in cloud. Elsewhere the flights' sides end in cloud. Cut first if the build runs late. |

**Modelled vs implied.** All 100 steps are real: 91 instanced tread boxes in four draws (one material per zone) + 9 landing boxes, about 1 200
triangles; nothing is faked by a cloud cut, so the slides and the escalator are honest shots. 21 HERO steps (96-100, 88-92, 59-63, 1-6) carry the
one-off marks; the other 79 are bare boxes, seen only at speed or from over 8 m. Long descents are told by cuts (cameras 9, 14, 19, 20), not by
showing 100 steps. Physics bodies only on hero steps, the terrace and hell's floor (quill, coin, megaphone, phone, soapbox).

**Zones** (one step material each; a 3-step colour blend at each border by per-step tint, no texture on the steps)
| Zone | Steps | Tread / riser / trim | Cloud top / shade | Sky at that height |
|---|---|---|---|---|
| 1 gold-white | 91-100, terrace | `#f7f2e6` / `#ebe3d0` / gold nosing strip 0.03 `#e8b93a`, parapet cap `#e8b93a` | `#fbfdff` / `#dbe7ef`, sunlit edge `#fff1c2` | `#9fd0f0` up to `#d9eefb` |
| 2 grey cloud | 71-90 | `#e6e6ea` / `#cfd0d8` / nosing `#b9bcc6`, cap `#c9a45a` | `#8b8fa3` / `#5f6378`, pale tops `#a9adbf` | `#7f8399` |
| 3 scorched | 21-70 | `#e9d2b8` at 70 darkening to `#b98a6a` at 21 / riser 12 % darker / cap `#9a6a3a` | `#f0935a` / `#b9502e`, deep `#7a2f24` | `#d9652e` |
| 4 red stone | 1-20 | `#8a332a` / `#6b241f` / a glowing seam 0.02 `#ff7a1c` (core `#ffd23f`) under every nosing | rock `#3a1f22`, lit edge `#8f2f22`, smoke `#5a2a24` | `#2b1418` |

Hero marks, each drawn once: zone 1: 4 marble veins `#e3dccb`; zone 2 (88-92): 4 hairline cracks `#9a9ca8`, 3 chips; zone 3 (59-63): 6 soot smears
`#6b4a3a`, 4 cracks; zone 4 (1-6): 8 cracks with a glowing core.

**Gold numbers** (16 decals; the only lettering on the set). Cap 0.17 on the 0.22 riser, min stroke 0.03, face `#f2c230`, highlight `#ffe89a`, outline
0.008 `#8a5a12`, 10 % emissive. Tens (10..90) at their flight's centre, EXCEPT the columns under his marks: 98, 99, 100 at T x +0.10; 90 and 91 at N x 0;
61 and 62 at M x 0; 2 at B x 0. Adjacent pairs (99/100, 90/91, 61/62) are how a +1 is read.

**Top terrace (station T; set sheet top right, panels 01-04, 13-15)**
| Piece | Geometry, position, colours |
|---|---|
| Terrace | Slab x -2.60..+2.60, z -0.50..-4.30, top y 0, 0.30 thick, `#f7f2e6`; one gold inlay ring r 1.05, 0.04 wide, centre (-0.20, -1.40). `fogveil` 0.08 deep `#f7fafc` at 50 % (reuse). 9 `cloudpuff` (reuse) round the left and back edges, tops under y 1.6. |
| Gate | NEW `pearlgate`, threshold centre (-0.20, 0, -2.30), section 4. |
| Podium + ledger | NEW `cloudpodium` centre (1.05, 0, -0.80), top y 0.42; NEW `ledger` on it. |
| Rays | NEW `gaterays` card 6 x 5 behind the gate at (-0.20, 2.2, -6.0): 9 soft rays `#fff1c2` at 35 % on the sky, unlit. |

**Hell's floor (station B; set sheet bottom, panels 09, 11, 12)**
| Piece | Geometry, position, colours |
|---|---|
| Floor | Rock slab x -4.5..+4.5, z +0.5..+6.5, y 0, `#5a2320`; 9 glowing cracks `#ff7a1c` (core `#ffd23f`), each drawn once. 7 crags `#3a1f22` with lit edges `#8f2f22`, 1.2-3.4 high, at x beyond +-2.4. 6 `smokewisp` and one `embers` box (reuse). |
| Hatch | NEW `hellhatch` centre (-0.65, 0, 1.30), in front of step 1, 0.6 in front of Chip's hanging feet. |
| Chair | `deckchair` (reuse, `#c8362f` / `#f2ebe0`) at (0.50, 0, 0.95), turned 25 deg toward -x. Close to the stair on purpose: further out the Devil leaves the two-shots. |
| Parasol | NEW `parasol`, base (1.60, 0, 0.60): only its pole and a sliver of canopy show at the right edge of cameras 21 and 25. It is never whole in frame: its canopy would sit in the caption band over the Devil's horns. Set sheet only; no panel shows it. |

**Sky and cloud**
- NEW `stairsky`: an unlit drum r 90 round (0, -28), y -10..+45, one vertical gradient by world height: -6 `#1f0f12`, 2 `#8f2f22`, 7 `#d9652e`,
  12 `#b9806a`, 16 `#7f8399`, 20 `#9fb9d6`, 23 `#9fd0f0`, 30 `#d9eefb`, 40 `#eef8ff`. Looking down from the top the world goes grey, orange, red:
  that is "hell's glow at the bottom". No sun disc, no lettering.
- NEW `zoneclouds`: 108 opaque two-tone puffs (no alpha), three instanced draws by zone colour: 26 white r 0.8-2.2 (y 19.5-24), 34 grey r 1.2-3.0
  (y 15-20), 40 orange r 1.2-3.2 (y 4.5-15), 8 dark smoke low. Each its own size and turn; drift 0.03 m/s toward -x, bob 0.02 at 0.2 Hz, phases by
  index. All at least 0.9 outside the parapets; 3 of each colour interleave at a zone border. Keep the sight cone of every camera in section 0 free.
- Light: ONE warm key `#fff0dc` from upper left for the whole clip; the cast's colours never change by zone. Mood comes from steps, cloud, sky and
  unlit glow cards (gate light, hatch seam, gold steps).

**Set states**
| State | What it does |
|---|---|
| **Fold** (beats 3, 4, 5, 8; panels 05, 07; camera 8 shows it) | A penalty of N folds the N treads from the one under his feet downward. Each tread turns 23.7 deg about its nose (back edge up 0.22) and stretches to 0.546 in 4 frames with 8 % overshoot: the flight becomes one flat marble slide, every riser and number in it is covered. A sheen strip 0.30 wide `#ffffff` at 15 % runs down the middle while folded. The first three treads go 3 frames apart (the visible fold), then the wave runs 3 treads per frame. Landings stay flat: a bump at each. The unfold wave follows 12 frames behind him. Ranges: 100..91 (he lands on landing 90, 0.7 s), 91..62 (lands on tread 61, 1.6 s), 62..3 (lands on tread 2, 1.6 s over two shots), 100 alone (he skids to 99, 6 frames, lands STANDING). |
| **Lift** (each good deed; beats 2, 4, 5) | NEW `ridetread`: a gold plate 0.80 x 0.035 x 0.46 `#ffd76a`, emissive, glow card under it. It grows under his feet in 3 frames as treads n and n+1 flash `#ffd76a` for 6, carries him 0.50 back and 0.22 up in 8 frames, sinks flush and fades in 4. It carries what he holds or stands on (the case, the soapbox). 99->100, 90->91, 61->62. |
| **Escalator** (beat 7; panel 12) | The gold climbs: every step at or below the wave is top `#ffd76a`, riser `#f2b63a`, nosing `#fff3b0`, numbers white-hot `#fffbe0`; an additive strip `#ffd76a` at 45 % lies on each lit flight. The wave goes from step 2 to 100 in 60 frames, 8 steps ahead of him; the same `ridetread` carries him the whole way along the nosing line (about 64 m in 2.0 s, a camera path through the offsets). After the gate opens the gold drains bottom-up in 9 frames. |
| **Gate** | `open` 0 -> 1 in 14 frames, eased, with 4 deg of settle (beats 2, 7); 1 -> 0 in 5 frames + a 2-frame 3 deg rebound (beats 3, 8). |

## 3. Marks (station frames; foot roots x, z; y is the tread)

| St. | Beats | Marks and the one visible change |
|---|---|---|
| T | 1, 8 end | Chip on tread 99 at (0.10, +0.25), y -0.22, turned 30 deg to the Angel, bouncing on his toes 0.02. Angel at (1.13, -1.25), turned 20 deg to Chip, behind the podium for the whole clip, writing. |
| T | 2 | Spud's lane is x -0.70: he trips on tread 98 at (-0.70, +0.75); the case drops on 98 at (-0.05, +0.78). Chip takes the handle and holds the case at his screen-left hip; treads 99 and 100 flash, the `ridetread` takes Chip + case to tread 100 at (0.10, -0.25), y 0. Gate `open` from 5.8 s. |
| T | 3 | Chip sets the case down at (-0.55, -0.25), turns to the Angel, both arms up. Spud climbs 99 and 100 on his lane, takes the case and walks straight through the gate: gone by 8.3 s, before the fold (he never crosses Chip or the podium). Fold 100..91 at 9.1 s; Chip slides from x 0.10 to station N's column; gate shut at 9.7 s. |
| N | 4 | Chip lands on landing 90 at (0, -0.75), turned 25 deg to the flower. Flower pot at (-0.80, 0, -0.85) at the broken open edge, the post at (-0.57, -1.20) between them. `goldcan` waits at (-0.55, -0.45). Can in the screen-left glove, phone at arm's length screen-right, centre (0.42, 0.62, -0.70), never across his face. Bloom, then the lift to tread 91 at (0, -1.45), y 0.22. Fold 91..62; the phone leaves his glove on the first tilt. |
| M | 5 | He stops seated on tread 61 at (-0.60, -0.25). Soapbox centre (0, 0, -0.25) with the megaphone lying on it; jar at (0.62, 0, -0.25), its lid leaning at (0.78, -0.12). On the box: megaphone at his mouth, bell to screen-right and 25 deg up, both eyes clear above it; coin pinched in the other glove, held up 6 frames, dropped from 0.12 over the jar. The lift takes box + Chip to tread 62 (box at y 0.22, z -0.75); the jar stays on 61. Fold 62..3: box and megaphone go over the parapet. |
| B | 5, 6 | Chip lands seated on the nose of tread 2 at (-0.50, -0.20), y 0.44, feet hanging over riser 2 beside the "2". Devil in the chair at (0.50, 0.95), shades on, one arm waving; 1.5 between their centres. The small demon stands on a rung inside the hatch at (-0.65, -0.36, 1.62) and holds the lid up. The quill lands on tread 1 at (-1.05, +0.25); Chip picks it up with the screen-left glove, stands, raises it (glove y 1.25, vane tip 1.72). |
| B | 7 | The gold climbs from step 2. Lunge: the Devil goes from the chair to (-0.05, 0.35), both gloves closing 0.25 short of Chip's feet; the chair tips back (physics knock); the demon lets the lid drop (5 frames). |
| T | 8 | The ride ends on tread 100 at (0.10, -0.25). Chip stays there and holds the quill OUT across the 0.32 gap to the podium, vane first; the Angel has it after the cut. Line. Tread 100 folds alone: he skids to tread 99 at (0.10, +0.25) and lands standing, knees dipping 0.05 for 4 frames; the gate slams; pose A. |

## 4. NEW props / kinds to build

| Kind | Size (m) | Build and colours | Sheet |
|---|---|---|---|
| `heavenstairs` | 2.40 wide, 22.0 high, 55.8 long | Section 2: steps, landings, parapets, posts, balusters, arches, 16 numbers, hero marks; states fold, escalator. | set sheet |
| `ridetread` | 0.80 x 0.035 x 0.46 | Section 2, Lift. | panel 12 |
| `pearlgate` | 1.90 wide, 1.89 high | Two marble pillars 0.30 x 0.30 x 1.55 `#f6f1e4` (shade `#e3dccb`) at x +-0.80, gold base band 0.08 and capital 0.06 `#e8b93a`, a pearl r 0.15 `#fbf8f2` (shade `#d9d2e0`) on a gold collar: top 1.89. Two leaves 0.65 wide, 1.30 high at the hinge rising to 1.62 at the meeting stile: frame tube 0.04 `#e8b93a` (shade `#b8862a`, light `#ffe89a`); a SOLID pearl-white kick panel y 0..0.45 `#f8f5ec` with one gold 4-point star each; above it 6 bars per leaf, diameter 0.018, pitch 0.10, each strung with 5 pearls r 0.022; 2 S-scrolls per leaf, each its own curve. Crest on the left leaf's stile: disc r 0.09, a star, 7 rays, top 1.81. `open` 0..1: both leaves swing 100 deg INWARD (-z). Open: a light plane 1.30 x 1.70 behind the threshold `#fffbe8` to `#ffe9a8`, 3 puffs at its foot, a light pool 1.6 x 2.2 on the terrace `#fff6d0` at 60 %, 7 ray wedges 2.5 long at 30 %. Sheet's gate is taller: 1.89 keeps it under the captions in pose A. | concept bottom row; set top right; panels 01-04, 13-15 |
| `cloudpodium` | r 0.35, 0.42 high | Marble drum r 0.32 `#f6f1e4`, 5 drawn flutes, gold top rim 0.05 and base ring 0.06 `#e8b93a`; a collar of 5 cloud puffs r 0.14-0.20 at y 0.14-0.26. | concept bottom left; panels 01-04 |
| `ledger` | 0.56 x 0.07 x 0.36 | Open book, tilted 8 deg to the lens (back edge at 0.52). Pages `#fbf6ea`, 9 ruled lines each `#d9cfb8`, gold corner flourish, gold-edged cover, a red ribbon 0.04 x 0.22 `#b3261e` over the podium front. `count` 0..4: the right page takes "-10", "-30", "-60", "-1" in gold-brown ink `#8a5a12`, cap 0.085, stroke 0.014, written stroke by stroke over 8 frames; earlier entries stack small (cap 0.035) on the left page. Numerals only, no words, no names. | concept bottom left |
| `goldquill` | 0.42 long | Origin at the nib tip, vane up. Gold nib 0.05 with a dark point `#3b2a20`; bare gold shaft 0.12, diameter 0.014 `#e8b93a`; vane 0.30 x 0.09, `#fbf8f0` shading to `#ffd76a` at the tip, gold rachis, 9 notches each cut once, curved 12 deg. `glow` 0..1: a card r 0.10 `#fff3b0` at 25 % (on from beat 6, so it reads on red stone). It is GOLD and heavy: it tumbles end over end like a dropped pen, by physics, never a drifting feather. Thin hold, pinched 0.07 above the nib (as `orangefeather`). Three instances: the Angel's, the falling one, Chip's; hand-offs only on cuts. | concept bottom; panels 10, 11, 13 |
| `soulcase` | 0.50 x 0.34 x 0.17 | Brown leather `#7a4a2e`, shade `#5c3620`; 4 tan corner caps 0.07 `#c99a5b`; two straps 0.035 `#5c3620` with gold buckles; top handle 0.14 wide, 0.05 high `#4a2c1a` on gold rings. Three stickers on the lens side, each drawn once, no words: a white cloud 0.10, a gold wing 0.11, a gold star 0.06. One sock tip `#f8f3e1` sticks out of the seam (it is overpacked). Carried hanging from the handle (grip point 0.39 up), at the hip, never in front of a body. Two instances (Spud's, Chip's). | concept bottom right; panels 02, 03 |
| `cloudflower` | pot r 0.085 x 0.12; 0.49 high in bloom | Pot `#f3ead2` with one pale blue cloud emblem `#bcd9ee` 0.06, soil `#6b4a2b`. `wilt` 1: a snowdrop bent over 150 deg, closed bell 0.06 `#cfc8b6` hanging at y 0.20, stem `#7d9a4a`, 2 limp leaves `#8a9a5a`, one dropped petal. `wilt` 0: straight stem 0.30 `#5aa334`, a daisy 0.15 across with 9 white petals each its own length, centre r 0.028 `#f2c94c`, 2 leaves `#6cbf3a`. The stem rises first (1 -> 0.4), petals open with 8 % overshoot, one glow pulse r 0.15 `#fff6d0` for 6 frames. 111 px across in camera 11. | concept; panel 06; set picture 2 |
| `goldcan` | 0.33 long, 0.19 high | Body r 0.07 x 0.13 `#e8b93a` (shade `#b8862a`, light band `#ffe89a`), spout 0.15 rising 35 deg to a rose disc r 0.035 with 7 holes, back loop handle 0.10, one white cloud emblem 0.05. Held by the back handle. `on` 0..1: 8 drops `#bfe6f2` from the rose to the pot. | concept; panel 06 |
| `soapbox` | 0.50 x 0.22 x 0.34 | Plank crate: 3 planks per long side `#b07a45`, gaps `#7a4f2a`, corner battens, 8 nail heads `#4a3a30`, one knot and 2 grain strokes per plank. Solid top: he stands on it; it rides the `ridetread`. | concept; panel 08; set picture 3 |
| `donationjar` | r 0.10, 0.26 high | Glass `#dff1f5` at 28 %, gold thread band 0.03 `#e8b93a`, mouth OPEN (inner diameter 0.17); the gold lid r 0.095 leans on its foot. A paper tag 0.09 x 0.07 with one drawn red heart `#d3261e`, no words. Empty until the coin lands flat inside. | concept; panel 08 |
| `hellhatch` | ring r 0.72, lid r 0.55 | Iron ring 0.10 high `#3a2f30`, 8 rivets r 0.03 `#55484a`, 4 clamps; lid 0.06 thick, slightly domed `#4b3b3b` (edge `#6a5552`), a 4-spoke handwheel r 0.20 `#2b2228`, 5 rust smears `#7a3a22`. Glowing seam between lid and ring `#ff7a1c` (core `#ffd23f`), flicker 10 % on fixed phases; 6 lava cracks 0.4-0.9 long round it. `open` 0..1: the lid lifts 35 deg on its BACK hinge, orange light fans out, a rung 0.36 down for the small demon. `glow` 0..1: seam + a floor pool r 1.6 at 40 %. | set bottom; panels 09, 11, 12 |
| `parasol` | canopy r 0.65, pole 1.75 | 8 gores, red `#d3261e` / cream `#f2ebe0` (the chair's colours), scalloped rim 0.05, tilted 12 deg; pole diameter 0.03 `#f4f1e8`, round base r 0.18. | set bottom |
| `gaterays`, `stairsky`, `zoneclouds` | section 2 | Unlit backdrop pieces. | set sheet |

**Reuse as they are:** `deckchair`, `coin` (scale 0.6 = r 0.051, `shine` for the 6 held frames, `flat` in the jar), `phone` (scale 1.3, `case` `#d3261e`
so it reads on grey cloud and on his cream glove, `glow` 1, `halo` 0.22; a 2-frame flash at the selfie), `cloudpuff`, `fogveil`, `smokewisp`, `embers`.
**Reuse with a small change:** `megaphone` gets colours (bell `#d3261e`, rim `#f2c94c`, back cap `#8f1f1c`); the Devil's costume gets black shades
`#1d1a20` from Wedge's piece (on his eyes in beats 5-6, pushed up between the horns for the lunge). Checked and not usable: `suitcase` (a wheeled
hard-shell trolley), `tipjar` (0.14 high, coins baked in), `crate` (a 0.32 cube), `umbrella` (dark, crook handle), `wiltplant` (stool + big pot),
`feather` / `orangefeather` (wrong colour, no nib; the quill copies the orange one's hold).

## 5. Phone read at 1080 x 1920 (what is too small, and the fix designed in)

- Riser numbers are under 60 px in any shot wider than 400 px/m: the count is carried by cameras 2, 4, 11, 16, 21 (72-142 px) and by position.
- The Angel "far, small" (beat 7) would be 64 px at 60 m: he gets his own close shot 26; the distance is told by the cut and by shot 24.
- The quill falling all 98 steps is under 20 px for most of the way: three shots (slip 23, glint to quill 24, pick-up 25).
- The phone flying in the long slide (panel 07) is 29 px: he loses it in the close fold shot 13 instead.
- The ledger's writing cannot be read from a level camera: one top insert (12) for "-30"; the other three are carried by face and line.
- "Filming himself" shows only the phone's back: red case, arm's-length selfie pose, wink, a 2-frame flash.
- Yellow Chip on a gold gate: the gate's white kick panels sit behind his head in every T shot.
- The hatch sits at rows 1350-1490 in the two-shot (app text starts near 1500): camera 20 shows it clear at row 1316 first.
- The Devil's shades hide his eyes in beats 5-6: mouth, brows and the wave carry him; the eyes come back for the lunge.

## Departures from the sheets (ask Jonny before the build; reason after each)

1. Panels 01, 15: Chip three-quarter to the lens, not his back (director's ask; the face must read at frame 0).
2. Panels 02, 03: Spud and the case are on screen-LEFT and Spud stays on step 98 (his lane to the gate must not cross Chip or the podium; from 98 he
   still looks UP at Chip, as drawn).
3. Panel 04: the gate closes in shot 9 with the slide; panel 05: the fold gets its own shot 8 (director's asks).
4. Panel 08: the megaphone moment reads "62", the jar is one step below, lid off (the coin's +1 comes first; the coin must fall in).
5. Panel 10: the quill comes down RED steps (he is at step 2); the white-and-gold version is shot 23.
6. Panels 11, 12: quill held UP; the Devil lunges out of the chair (director's asks).
7. Set sheet: parallel flights with sideways offsets instead of diagonal flights; arches on three flights; balusters in two places.
8. Gate 1.89 high (sheet: about 2.5). Hatch directly in front of step 1 under Chip (as panels 09, 11; the set sheet has it further out).

## Open questions (my default)

1. Angel variant: A (default), B or C.
2. Show every deed's +1 as a gold lift, so the numbers add up (99+1, -10, +1, -30, +1, -60 = 2)? Default yes: 0.4 s each; cut the lift at 62 first.
3. Spud walks in through the open gate with his case while Chip brags (default). Without it he stands on the steps that fold.
4. The small demon is the hatch's doorman, peeking from under the lid (default; no panel shows him). Else he is cut and the hatch stays shut.
5. The ledger shows the four penalties as numerals (default). They and the riser numbers are the only lettering.
6. Last shot 1.5 s (default, story.md pace rule) or a hard cut 0.8 s after "Minus one."?

## Risks to timing and scope

- Seven props pass through hands (case, can, phone, megaphone, coin, quill x2 holders): clip-lessons names this as the cause of a cut video. If one
  hold fails a fix round: the can stands on the landing and he tips it with one glove; the megaphone goes first of all.
- The set is 22 m tall and 56 m deep: check the far plane (160 m), the shadow area at station T and the instanced fold in the FIRST bench still.
- Additive gold strips fill the frame in shots 27-28 (CPU cost): cut the strips first, keep the gold step colour.
- 33 shots in 34.8 s; beats 4 and 5 are the tightest (two lifts, two folds, two Angel cuts). The story chain does not change if shots 12 and 17 merge.

## Director's decisions (20 Nov 2026, 18:40 Berlin)

Jonny picked Angel A (card, 18:20). Departures 1-8 accepted (1, 3, 6 were the director's asks; the rest keep lanes and captions clear;
named in the delivery). Open questions: 2 yes (0.4 s gold lift per +1), 3 yes, 4 yes, 5 yes, 6 = HARD CUT 0.8 s after "Minus one."
(Jonny's 20 Nov cut-fast rule; the last frame matches frame 0 for the loop).
