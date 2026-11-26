# Potato Desk — Heaven's terms and conditions: design (Fable 5.2, 25 Nov 2026)

From `OUTLINE.md` (hook H1, ending E1, 9 beats, ~80 s spoken = ~68 s rendered at voices 1.2x) and the approved sheet
`sheets/heaven-terms-panels-v1.png` (16 panels). New pieces only. The stairway, terrace, gate, podium, hatch, deck chair, sky, zone
clouds, Angel A and the Devil with shades are `../heaven-steps/DESIGN.md` as built; its axes, units and stations stay: +x right, +y up,
+z toward the camera = DOWNHILL, metres, 1080 x 1920, 30 fps. Standing heights: Spud 1.02 (eyes 0.68, mouth 0.50, leaf top 1.18),
the ex 0.98 (bun top 1.12), Devil 1.06 (horns 1.20), Angel 1.34 (mouth 0.64, eyes 0.90, halo top 1.63).

**Stations** (same axes as the world, no yaw). T and B are heaven-steps'; E, F and H are new places on the same world.

| Station | Origin in the world (x, y, z) | What the origin is |
|---|---|---|
| **T** top | (0, 22.00, -55.30) | top edge of riser 100; y 0 = the terrace |
| **E** eighty | (0, 17.60, -43.90) | nose of landing 80 at the gold "80" (landing: x -2.50..+1.20, z -1.20..0) |
| **F** forty | (0, 8.80, -21.10) | nose of landing 40 at the gold "40" (same shape as landing 80) |
| **B** bottom | (0, 0, 0) | foot of riser 2; y 0 = hell's floor |
| **H** home | (10.50, 26.00, 15.00) | centre of the cloud island's top; 4 m above the gate, out over hell's front yard |

Lens: focal px = 960 / tan(fov / 2): fov 24 = 4516, 26 = 4158, 30 = 3583, 34 = 3140, 40 = 2638, 44 = 2376, 46 = 2262.
Captions rows 486-608 (pos 300 in the T shots that hold the Angel: his halo ring enters rows 480-560). Eyes, brows and mouths below
row 640 in EVERY shot; the sheet's cells are square and put faces in the top third: every camera below is re-framed for portrait.
Whole frame sharp, no roll. Every camera is a first fit: one `qa/camfit.mjs` batch, then one layout run.

## 0. Cameras (23 shots, each moves; lengths are targets, the measured lines win; they sum to 60 s and the lines stretch it to ~68)

| # | Cam | St. | Position -> look, fov | Move | Sees | s | Panel |
|---|---|---|---|---|---|---|---|
| 1 | T-RULE | T | (0.20, 0.50, 8.60) -> (0.42, 0.62, 0), 26 | push to z 7.90 | Low wide, frame 0 = trouble in motion: Spud wipes his feet on the gold mat on tread 99 (col 284, eyes row 1038, leaf top 789, "99" row 1446, 87 px), gate behind him (col 281, crest row 488), the Angel over the podium with the FAT roll on it (col 817, eyes row 779, mouth 886) | 3.4 | 01 |
| 2 | T-DROP | T | (-1.30, 0.55, 3.60) -> (0.80, 0.20, -0.30), 30 | tilt down 5 deg with the roll | His glove pushes; the roll leaves the podium, THUD on tread 100 (3-frame shake), bumps to 99, 98, paper laid behind it | 0.8 | 01-02 |
| 3 | T-DOWN | T | (1.00, 6.00, -5.00) -> (-0.04, -7.40, 14.90), 46 | push 8 %, tilt down 3 deg | From above and behind him (back of his head col 190, row 1339, 232 px wide): the ribbon runs down ALL the steps in a lazy S through white, grey, orange into the red glow; hatch row ~580; the roll reaches it at the shot's last third | 1.8 | 02 |
| 4 | T-STAMP | T | (0.15, 0.80, 4.40) -> (0.45, 0.70, -0.80), 30 | push 5 % | "Who reads these?" Stamp raised on the cut, SLAM (2-frame shake), lift: the red tick mark. Spud col 438, eyes row ~965; Angel col 928 (wings cropped right, as drawn), eyes row ~740; behind Spud the gate swings open (cols 0-170), light pours out; he turns to it. Cut. | 2.4 | 03 |
| 5 | H-WAKE | H | (1.10, 0.95, 4.60) -> (-0.55, 0.80, -0.60), 30 | push 6 % | Dawn. All harp strings shake; the duvet lump bursts, he bolts upright (eyes row 853). Pillow left, harp right of the bed head | 1.6 | 04 |
| 6 | H-HARP | H | (0.30, 0.90, 5.20) -> (0.05, 0.75, -1.00), 28 | drift x +0.15 | The Angel rises on his small cloud behind the rim (eyes row 1012, halo top 659), roll in both gloves. Spud, sleepy, plucks ONE string with one finger: it swings 0.03 | 4.2 | 05 |
| 7 | H-SOCKS | H | (0.85, 0.14, 3.70) -> (0.50, 0.52, 0.55), 34 | push 5 %, tilt up 2 deg | Low: both white socks step out of bed and sink 0.05; water wells up round them (rows 1400-1480); his face above, disgusted (eyes row 799) | 2.2 | 06 |
| 8 | H-CLAUSE | H | (0.65, 0.75, 2.45) -> (0.95, 0.55, -2.75), 26 | push 3 % | The Angel alone on his cloud, deadpan over the rims: eyes row 928, mouth 1136, halo top 344, roll at row 1330. "Clause 8. Clouds are wet." | 1.8 | 06 (his line) |
| 9 | H-DOCK | H | (-0.40, 1.05, 6.20) -> (1.30, 0.75, -0.90), 34 | pan right 6 deg with the island, settles on the bump | The neighbour island drifts in from the right and docks (both rock 1.5 deg); the ex waves with both gloves BELOW her chin. Spud freezes at the harp | 3.2 | 07 |
| 10 | H-HIDE | H | (-0.55, 0.80, 2.60) -> (-0.10, 0.70, -1.00), 26 | push 4 % | He ducks behind the harp: eyes and leaf between the strings (eyes row ~930), strings quiver 0.004 from his breath | 1.6 | 07 (his half) |
| 11 | H-CLAUSE | H | shot 8's framing again, on purpose | push 3 % | "Clause 15. Your ex lives next door." | 2.2 | 07 (his line) |
| 12 | H-BRIGHT | H | (0.90, 0.85, 3.30) -> (1.15, 0.70, 0.35), 26 | push 4 % | Spud alone: "Free hugs" lands, his face lifts to `eager`... a lilac sleeve comes in from the right edge at row ~1200 | 2.6 | new (beat 5) |
| 13 | H-HUG | H | (1.20, 0.90, 5.60) -> (1.50, 0.72, 0.10), 30 | push 8 % over the whole hug | The hug, long: section 4. Spud eyes row ~1000, the ex right of him, the Angel behind them (eyes row ~855, halo top ~460) | 3.4 | 08 |
| 14 | H-PHONE | H | (0.60, 0.70, 4.80) -> (-0.80, 1.25, -0.12), 30 | crane +0.25, tilt up 5 deg | On tiptoe on the cloud bed, phone at full arm above his head (phone top row ~460, his eyes row 1058): no bars. Silent beat or caption pos 240 | 2.4 | 09 |
| 15 | H-EDGE | H | (0.60, 4.30, 0.95) -> (-10.20, -19.20, -14.30), 30 | push 10 % toward the Devil | Looking DOWN 51 deg past him on his belly at the rim (back of his head row ~650, 630 px/m): the real stairway 26 m below, hatch and deck chair at rows ~1380, the Devil ~100 px tall waving a lit phone; red steps climb to the top right into orange cloud | 4.4 | 10 |
| 16 | H-CLAUSE | H | (-0.45, 0.75, 2.10) -> (-0.60, 0.55, -3.05), 26 | push 3 % | The Angel beside the rim: "Clause 22. Wifi is downstairs." | 2.0 | 10 (his line) |
| 17 | T-READ | T | (0.15, 0.80, 4.40) -> (0.45, 0.70, -0.80), 30 | drift x -0.15 | Shot 4's framing: he storms to the podium and points LOW at the hanging sheet (glove y 0.45): "I want to READ it." | 2.6 | 11 |
| 18 | T-NOBODY | T | (0.75, 1.05, 3.60) -> (1.10, 1.05, -1.15), 24 | push 3 % | The Angel's eyes come up over the rims (row ~960): "Nobody gets to the end." | 2.2 | 11 (his line) |
| 19 | E-READ | E | (0.45, -0.40, 4.20) -> (-0.45, 0.80, -0.45), 44 | crane -0.22, dolly z +0.30 (backs down ahead of him) | Grey zone. He walks toward the lens across landing 80, sheet in both gloves, face starting to worry (eyes row 1014, leaf top 782); "80" at col 739, row 1392, 96 px; the gate small and bright upper right (col 908, rows 698-925) | 3.4 | 12 |
| 20 | F-READ | F | (0.45, -0.40, 4.20) -> (-0.45, 0.70, -0.45), 40 | crane -0.22, dolly z +0.30 | Orange zone, the same walk on landing 40, tighter: face worried; "40" lower right; the ribbon runs on down ahead of him | 3.0 | 13 |
| 21 | B-ARRIVE | B | (0.35, 1.25, 6.60) -> (0, 0.55, 0.80), 30 | push 5 % | He steps down onto tread 1, reading (eyes row 727); the end roller lies on the hatch lid (hatch rows 1305-1427); "1" row 1197, 100 px; the Devil sits up in the chair, shades on, sips (eyes row ~850) | 3.6 | 14 |
| 22 | B-CLAUSE | B | (-0.50, 0.25, 4.25) -> (-0.65, 0.78, 1.66), 30 | push 8 % | From below, he stands ON the lid with the very end of the scroll: reads clause 100, then eyes huge (eyes row 960, mouth 1208, sheet top 1346, gloves 1456); red glow on the SET, not his skin | 4.2 | 15 |
| 23 | B-DROP | B | (0.55, 3.60, 4.70) -> (-0.50, 0, 0.95), 34 | 3-frame shake on the lid, tilt down 4 deg | The lid swings down under him at frame 4; he drops, arms up; the scroll whips after him; the Devil raises his glass (eyes row ~675). CUT 0.6 s after the lid | 1.0 | 16 |

Optional 20b (only if the lines need a third "Clause..." cut): the same recipe on landing 60, origin (0, 13.20, -32.50); the landing is
mirrored (x -1.20..+2.50), ribbon at x +0.36, so he walks at x +0.36 and the camera is x -0.45 looking to x +0.45.

## 1. THE SCROLL (panels 01-03, 05, 08, 11-16)

One parchment, four props. No lettering anywhere: every "line of text" is a grey bar. Paper `#f3e7c6`, shade `#dccb9f`, edge line
`#b89f6a`, bars `#8f8a80` (0.012 high, pitch 0.034, lengths 55-92 % of the width, each row its own length from a fixed seed, a
gap after every 6-9 rows = a clause, a short bar 0.05 at each clause start), back of the paper `#e6d6ae` with no bars. Rollers: turned
wood `#8a5a34`, shade `#6b4324`, a gold ring `#e8b93a` at each end, knob r 0.035. Width **0.40** (roller 0.52 knob to knob).

**A. `termsscroll`: the podium piece + the ribbon down all 100 steps + the travelling roll + the end roller. ONE prop at the world origin.**
`longbill` (props-bistro.js) is the precedent and the same key: `unroll` 0..1 lays the paper along a fixed path behind a rolling roll.

| | |
|---|---|
| At `unroll` 0 (frame 0) | On the podium top (y 0.42): the top roller lies at T (1.02, 0.46, -1.02), 0.30 of flat sheet runs forward, the FAT roll (r 0.12, axis along x) sits at T (0.95, 0.54, -0.62). It replaces the ledger this episode. |
| Path (centre line) | Top roller -> across the podium top -> over the front rim at T (0.95, 0.42, -0.47) -> hangs to tread 100 at T (0.90, 0, -0.42) (the podium's collar has no puff in its front 38 deg) -> nose 100 at T x +0.62 -> down the stair -> hell's floor -> up the hatch ring (0.10) -> over the lid and its handwheel (a 0.07 bump) -> end roller at B (-0.65, 0.15, 1.62), on the front half of the lid. Length ~81 m. |
| On a tread | Flat, 0.004 above the top. It does NOT hug the risers: off each nose (bend r 0.03) the paper spans the corner as a straight slant to a touch line 0.18 in front of the riser on the tread below, 0.02 of sag. Hugging every riser reads as a painted stripe. |
| Lane, world x | Steps 100-93 **+0.62**; 89-73 **-0.36**; 69-53 **+0.36**; 49-33 **-0.36**; 29-13 **+0.36**; 9-1 and the floor **-0.65** (the hatch's x). It stays 0.06+ inside every tread edge (tightest on the offset flights) and beside, never over, a gold number (tens at their flight centre, 98-100 at T x +0.10, "90" at world -0.70, 61/62 at +1.20, "2" at 0). |
| Zig-zag | Five lazy swerves, at landings 90, 70, 50, 30, 10. Each starts on the nose of the SECOND tread above the landing (92, 72, 52, 32, 12: always a centre flight, so the paper has room) and ends at the landing's front edge: 2.20 m of run, x by smoothstep, the paper's width kept square to its path. Landings 80, 60, 40, 20 are crossed straight. That is panel 02's S. |
| The roll | Rides the front of the paper, radius sqrt(0.035^2 + (0.12^2 - 0.035^2)(1 - unroll)), turning by distance / radius. It hops 0.03-0.06 off every nose and squashes 5 % for 1 frame on each tread. At `unroll` 1 it is the bare end roller (r 0.035): it rocks +-12 deg twice over 8 frames on the lid and lies still. |
| Unroll wave | Distance laid = 81 m x (t / 2.8 s)^1.6: 0.42 s after the push it THUDS on tread 100 (shot 2), 3 treads in the next 0.4 s, then the cut; shot 3 sees it from about step 94 to the hatch in 1.5 s. The paper already laid never moves again, except a 0.01 ripple that runs 6 treads behind the roll. |
| Other keys | `count` 0/1: the stamp mark (section 2) on the podium sheet. `pull` 0/1 (steps, set on the cut into shot 22): the last 1.7 m (floor, lid, end roller) is gone: it is in his gloves. Not solid, see-through for every check, no shadow below tread 90. |

**B. `scrollroll`: the Angel's roll (held, Set B only; panels 05, 08).** Roller 0.52 knob to knob, paper roll r 0.055 x 0.40, a tongue of sheet
0.16 hanging from it (bars on it). BOTH gloves on the two knobs, `grips.box` (as `hotelpillow`), centre 0.40 over his feet, 0.30 in front of his
middle: its top is 0.46, his mouth 0.64. Taken on cuts only, never passed, never raised. At the gate he holds nothing: his gloves REST on
`termsscroll`'s top roller on the podium (`grips.rest`).

**C. `scrollsheet`: the piece the hero reads (held; panels 12-15).** A stiff curved sheet 0.40 wide: 0.34 of upright page between his gloves
(leaning 20 deg back toward him, bars on the side he reads; the lens sees the plain back, as panels 12-13 draw it), then a tail that falls from
the page's bottom edge, forward and down, to end 0.03 above the tread 0.35 in front of his feet, where it meets the ribbon he walks on. Both
gloves on the page's side edges (`grips.box`), page top at 0.50 above his feet = at his mouth's lower edge, so the lens (below him in shots
19-21) sees both eyes and the mouth over it; never higher. `end` 1 (shot 22 only): the tail is 0.22 long and ends in the end roller, hanging at
his shins. Two-handed from the cut into shot 19 to the fall: never released, never one hand.
Marks: shots 19 and 20, he walks ON the ribbon from (-0.38, 0, -0.70) to (-0.38, 0, -0.20) in E and in F: 0.50 m of flat landing in the shot,
0.45 off the newel at the landing's back, the gold number 0.38 to his screen-right. Shot 21: one step down, from tread 2 to tread 1 at
B (-0.65, 0.22, 0.25), as its own move; 1.15 from the Devil's chair.

**D. `scrolltail`: the scroll flying after him (not held; panel 16).** 2.40 m of ribbon + the end roller at its lower end. `fall` 0..1 over 14
frames: it leaves his gloves at the lid's level, whips into an S (two bends, 0.25 amplitude) and follows him down the shaft 4 frames behind,
its top end still snaking in from tread 1.

## 2. THE STAMP and THE DOORMAT

| Kind | Size (m) | Build, colours, staging |
|---|---|---|
| `goldstamp` | base 0.20 x 0.045 x 0.14, 0.24 high | A big desk stamp, all gold: base `#e8b93a` (shade `#b8862a`, light band `#ffe89a`), a red rubber pad 0.19 x 0.012 x 0.13 `#b3261e` under it, a turned neck r 0.030 to 0.022, 0.11 high, a ball knob r 0.05 with one sheen stroke. No engraving. Origin: the middle of the pad's face. Held round the neck with the mug hold (as `rubberstamp`; fist at y 0.16). From frame 0 it stands on the podium top at T (0.78, 0.42, -0.98) (a plant in shot 1). In shot 4 it is in his screen-right glove ON THE CUT, 0.20 over the sheet; down in 3 frames onto T (0.86, 0.42, -0.74), squash 8 % for 2 frames, held 4 frames, lifted 0.15 and out to the right. One hold, one shot. |
| stamp mark | 0.19 x 0.13 | `termsscroll` `count` 1, on at the frame the pad lifts: a rectangle frame 0.012 thick with a tick inside, ink `#b3261e`, 12 % of it missing in specks (a real stamp). A tick, not a word: it reads without English. ~130 px wide in shot 4. |
| `goldmat` | 0.72 x 0.02 x 0.34 | Plain gold doormat on tread 99, centre T (-0.10, -0.22, 0.25): pile `#e8b93a`, 14 short weave strokes `#c9972e` each drawn once, a border 0.03 `#b8862a`, corners rounded 0.02. NO lettering. See-through for the checks (feet stand on it). |
| `risernum` (cut first) | cap 0.17 | A gold "1" on riser 1 at B (0, 0.11, 0.501), built as the stair's own numbers (face `#f2c230`, highlight `#ffe89a`, outline 0.008 `#8a5a12`, 10 % emissive): panel 14 draws it and the stair has none. A separate decal, so the stair file is not touched. |

**Marks at the gate (station T).** Spud, shot 1: tread 99 at (-0.10, +0.25), y -0.22, on the mat, turned +25 deg to the Angel, wiping one
foot then the other (0.3 s each). Shot 4: on the terrace at (0.30, -0.74), turned +70 deg to the podium, leaning 8 deg to it, the other glove on
his hip; 0.05 clear of the podium drum (the collar puffs are soft). Shot 17: (0.20, -0.45), +60 deg. The Angel: heaven-steps' mark (1.13, -1.50),
turned -20 deg, standing on a cloud step **0.14** high this episode (a `cloudpuff` r 0.30 round a hidden solid plate, as heaven-steps' invisible
sled): with the fat roll on the podium his mouth (0.78) clears its top (0.66) by 0.11 from shot 1's low lens, and he towers as the sheet draws him.

## 3. SET B, HEAVEN HOME (station H; panels 04-10)

**Where.** A cloud island in heaven's sky, 4 m above the gate's level and out over hell's front yard: centre of its top at world
(10.50, 26.00, 15.00). Its back-left rim, at H (-1.60, 0, -2.05), looks straight down on the foot of the stairway: the hatch is 30 m away, 58 deg
down. Shot 15 shows the REAL stair, hatch, chair and Devil; nothing is faked. Every Set B piece is hidden outside shots 5-16 (shown on the cut
into 5, hidden on the cut into 17), so no stair, gate or hell camera can ever see the island or its sky.

| Piece | Geometry, position (H frame), colours |
|---|---|
| `homeisland` (NEW) | Round, r 2.60, top y 0: a walkable disc r 2.25 (solid for feet) with a rim of 16 lobes r 0.35-0.60, tops y 0.05-0.25, each its own size; a body of 22 puffs 1.5 thick under it. Two rim gaps with a FLAT top: the lie spot at azimuth (-0.62, -0.79), 1.0 wide, and the dock on the +x side at (2.55, -0.75), 1.4 wide. Top `#fbfdff`, shade `#d9d6ee` (lilac, not grey), dawn edge light `#ffe2c4`, underside `#f6c9d4`. Wet: a soft sheen card on the top at 10 % and 9 small glints, each placed once. `tilt` rocks it +-1.5 deg (the dock bump). |
| `cloudbed` (NEW) | Built on `bed`'s interface so `sit` works: origin where the sleeper sits up, mattress top y 0.42, `cover` 0..1, `over` 0..1 (the lump). A cloud mattress 1.15 x 0.42 x 1.90 of 9 merged puffs (`#f7f9fd`, shade `#dcdcf0`), a fluffy duvet (same white, 5 soft folds drawn once), one real pillow 0.62 x 0.16 x 0.34 `#ffffff`, shade `#e6e4f0`, two crease strokes. No frame, no legs. Sit origin H (-1.25, 0, -0.60), rot +40 (the foot points front-right). Its top is flat and solid over 0.9 x 1.2: he stands on it in shot 14 at H (-0.85, 0.42, -0.12). |
| `goldharp` (NEW) | 1.45 high, 0.80 wide, 0.30 deep at the base, standing at H (-0.10, 0, -0.75), the strings' plane facing the lens. Straight fluted pillar r 0.04 on the right, an S-curved neck ending in a volute r 0.09 at the top left, a slanted soundbox 0.16 wide, a stepped base 0.30 x 0.08 x 0.30. Gold `#e8b93a`, shade `#b8862a`, light `#ffe89a`, 6 engraved leaf strokes `#b8862a` each drawn once. 11 strings `#fff6d6`, diameter 0.004, pitch 0.045, lengths 0.42-1.05. `on` 0..1: ALL strings vibrate, amplitude 0.012 x on, drawn as a spindle (two offset copies and a 30 % fill between them), fixed phases, no blur. `puff` 0..1: ONLY string 4 swings 0.03 x puff (his pluck; the director tweens 1 -> 0 over 0.5 s). Solid: pillar and base. |
| `cloudhouse` (NEW) | The neighbour: an island r 1.50 (built as `homeisland`, 9 rim lobes, no bed) with a round cloud house r 0.85, 1.25 high, of 12 merged puffs: a round-topped door 0.46 x 0.70 `#d9a25a` with a gold knob, one round window r 0.16 lit `#ffd76a` with a cross bar, a stub chimney with one puff of white smoke that bobs. It DRIFTS: from H (9.00, -0.30, -4.00) to the dock H (3.75, -0.05, -1.10) in 2.0 s, ease out, bobbing 0.03; on contact both islands tilt 1.5 deg for 6 frames and the touching lobes squash 10 %. The ex rides it at its local (-0.75, 0, 0.55) (`ride`), in front of her door. |
| `dawnsky` (NEW) | No existing sky fits: `stairsky` is blue at this height, `sunsetsky` is a 12 x 6 plane, `biminisky` and `aasky` are blue noon domes. An unlit drum r 30 round H, y -5..+40 with a top cap, one vertical gradient by height over H: -5 `#ffd9a8`, 0 `#ffcfa6`, +4 `#f6b7c4`, +10 `#d7b3e6`, +18 `#b3a6e8`, +30 `#9fb0ee`. A soft sun glow (no disc) `#fff1c2` at 45 %, 30 deg wide, low at the back right. A cloud sea: 60 opaque two-tone puffs (zoneclouds' build, `#fbeef0` / `#e7c9dc`, gold tops `#ffe9c4`) in a ring r 9..30 at y -3.5..-2, NONE within 28 deg of the bearing from H to the hatch out to r 22: that gap is shot 15's window. 7 far islands 0.8-2.0 wide on the drum at y -1..+6, one with a tiny house. Drift 0.02 m/s. See-through for every check. |
| `sockwell` (NEW) | The wet cloud under one foot, two instances. `on` 0..1 over 8 frames as the sock lands: a dimple r 0.16 sinks 0.05 (`#cfd9e6` in its hollow); a film of clear water wells up round the sock from r 0.10 to r 0.19 (`#bfe6f2`, FIXED 55 % opacity, grown by scale, never faded); 5 beads r 0.008-0.014 squeeze out at the sock's edge, rise 0.03 and run back into the film; one slow ring. Nothing leaves the surface by more than 0.05: no crown, no flying drops, no marks. At H (0.36, 0, 0.55) and (0.64, 0, 0.55). |

**The Angel in Set B.** He rides his own small cloud (`cloudpuff` r 0.34 on the hidden plate): feet on something, always. Shots 6, 8, 11: beyond
the back rim at H (0.95, -0.30, -2.75), rising from y -1.60 in 10 frames (head and halo come up behind the rim, as panel 05). Shot 16: at
H (-0.60, -0.30, -3.05), beside the lie spot. Shot 13: he stands ON the island at H (1.55, 0, -0.95), behind the two of them.

**Marks (H).** Bed: seated at the sit origin, facing +40. Shot 6: he leans to the harp and plucks string 4 with the screen-right index finger
at y 0.80 (the glove stays right of his face). Shot 7: he stands at (0.50, 0.55), the bed behind him to the left. Shots 9-10: behind the harp at
(-0.10, -1.25). Shots 12-13: (1.15, 0.35). Shot 14: on the bed. Shot 15: on his belly at the lie spot, `pitch` 80 deg, head at the rim,
H (-1.75, 0.10, -1.96), the body sunk 0.06 in the soft top, both feet on the cloud; the screen-right arm straight down over the edge, phone in it.

## 4. THE EX (new character, file `characters/potatobrawl/ex.json`, costume type `ex`; panels 07-08)

No existing JSON fits. `duchess.json` is the only woman in the cast and her whole costume is wrong (raspberry bell dress, fur stole, sun hat,
19 pearls); story.md: side characters are designed for the scene. Taken over from the duchess: the rig, lash build, face size 0.92, glove
size 1.2, cream legs. Everything else is new. No name on screen ("your ex").

| | |
|---|---|
| **Body** | 0.84 high, 0.72 wide, 0.62 deep, lump 0.03, taper 0.12, seed 41. Standing 0.98 (the hero's size). |
| **Skin** | Light rosy-tan `#ecb787`, shade `#d49a6c` (lighter and pinker than the cast's `#e2a95c`, as the sheet). Cheeks `#ff9aa8`, strong. 5 freckles `#f6cda6`, each placed once. |
| **Eyes, brows, mouth** | Spud's eye build, iris `#5a3418`, lash 1.4 with 3 long lashes per eye, each drawn once. Brows thin: thick 0.55, arch 0.10. Default face `happy` with curve 1.0: a sweet, much too friendly smile that never drops. |
| **Hair** | No leaf (as drawn). A small scalp cap r 0.12 on the crown, `#9a6a42`, and a HIGH BUN r 0.085 on it (shade `#7a4f2e`, 5 hair strokes each drawn once, 2 loose wisps 0.04). A scrunchie round the bun's foot: torus r 0.05, tube 0.018, `#f2c94c`, 6 gather strokes `#d9a93a`. Bun top 1.12. It bobs 0.01 one frame behind her head. |
| **Cardigan** | Lilac `#b79fe0`, shade `#9a82c8`, the hand-drawn knit of Spud's sweater (every stitch its own stroke, nothing tiled). Open at the front over a white top `#fbf8f0`: a V strip 0.16 wide at the hem, narrowing to the collar. Rolled collar edge, ribbed hem and cuffs, 3 buttons `#f3ead2` on her left panel, each a little different. Shoulder line body-local y 0.50 (under the mouth), hem 0.08. Sleeves end 0.05 before the wrist. A cream skirt band `#e9dcc6` 0.06 below the hem. |
| **Limbs, feet, hands** | Legs `#f4efe6`, width 0.032. Lilac flats `#9a82c8` with a paler sole line. Glove hands as the cast's (3 fingers + thumb), size 1.2. |
| **Habit** | Waves with BOTH gloves at shoulder height, outside her own outline (x +-0.42, y 0.55), never in front of her face; hugs before anyone has answered; her eyes close when she smiles. |
| **Faces** | `happy` (wave, "Hiii."); hug: `serene` with curve 1.0 (eyes shut, beaming). Never any other. |
| **Voice** | Bright, sing-song, one long word. Proposal until Jonny has heard it: pitch 178, rate 3.0, formant 1.04, range 6, breath 0.08, seed 93. |

**The hug (shot 13, panel 08; H frame).** She arrives ON THE CUT, already holding him: no walk-in, no reach to time.
- Spud at (1.15, 0.35), facing the lens, leaning 8 deg to screen-left (away). The ex at (1.80, 0.45), turned -40 deg to him, leaning 12 deg
  into him, 0.10 nearer the lens so her arm passes in front of him. Centres 0.65 apart: the bodies press 0.09 into each other at the widest and
  her cheek is on his. That overlap is the squish: it needs one named check window (clipping, shell) for the pair, shots 12-13.
- Her screen-left arm crosses his FRONT: glove flat on his belly at (1.10, 0.34, 0.69). Her other arm comes round her own front: glove on his
  near side at (1.42, 0.30, 0.70). Both gloves and both sleeves stay at or under y 0.40; his mouth is at 0.50, hers at 0.48.
- His arms hang straight down, pinned: gloves at y 0.24, the near one hidden between them. Nothing of his moves but his face.
- No glove in the shot is above 0.40: the Angel's two are on his roll at 0.40, 1.30 behind them.
- Acting: two squeezes 0.5 s apart, each a `squash` of 6 % on him for 4 frames and 4 more deg of her lean. His face: `annoyed` with eye 0.45
  and curve -0.5, one eye shut on her side. Hers never changes. The camera only pushes; the length is the joke.

## 5. SPUD IN SOCKS and THE PHONES

**Feet.** A clip copy `heaven-terms/spud-ht.json` of `potatobrawl/spud` with one costume key by time, `feet`: `sneakers` for shots 1-4 and
17-23, `socks` for shots 5-16. The canon JSON, the sweater and the legs' brown `#6b4a2b` are not touched. No patch on his back (panel 02
draws one: the canon costume's only patch is the small one on the left elbow).
- `sneakers` (as the sheet): the foot in `#f6f3ec` with a sole rim `#d9d4c8` and one grey lace stroke `#bdb8ac`: Chip's `shoes` build
  (costumes-everyday.js), which the `spud` costume does not read yet.
- `socks`: the foot at 0.92 size in `#f8f6f0`, no sole rim, grey heel and toe caps `#e4e2dc`, a ribbed cuff 0.05 up the leg (r 0.027, 4 rib
  lines `#dcd8cc`, each drawn once), one fold stroke at the instep. `sockWet` 0..1 (0 -> 1 over 8 frames in shot 7, then 1 to shot 16):
  the lower 45 % turns `#c9d3dc` under an uneven tide line `#aab8c6`. Wet socks stay wet: that is the running gag's proof in shots 9-15.
- His two sneakers stand beside the bed at H (-0.55, 0, 0.30) and (-0.38, 0, 0.36): `sneaker` (props-plane.js, reuse), scale 0.6, stripe `#d9d4c8`.

**His phone.** `phone` (reuse; heaven-steps' spec: scale 1.3, case `#d3261e`, halo 0.22). One hold, `grips.phone`, screen-right glove, taken
on the cut into shot 14 and kept to the end of shot 15. Shot 14: arm straight up, the phone's foot 0.25 over his leaf, `glow` 0.3; the other arm
out for balance. Shot 15: the same arm straight down over the rim; `glow` 0.3 -> 1 with a 2-frame flash when the one bar comes.
**The Devil's phone** (shot 15 only): `phone`, scale 2.0, case `#f2c94c`, halo 0.50, `glow` 1. NOT a grip: it is placed at his raised glove and
moved with the arm (it is 12 x 25 px; the halo, 50 px, is what waves). **His glass** (shots 21, 23): `drinkglass` (reuse), mug hold, screen-left
glove; the first hold to cut.

## 6. THE HATCH DROP (shots 22-23, panels 15-16)

- **`hellhatch` gets one new key, `fall` 0..1** (tweens). Its `open` lifts the lid UP 35 deg on the back hinge: that would tip him backward,
  not drop him. `fall` swings the lid DOWN 85 deg about the same back hinge into the shaft (lid r 0.55, shaft 1.40 deep: it hangs against the
  back wall), 3 frames, ease in, a 1-frame 4 deg rebound. With it: a glow disc r 0.55 at y -1.30 in the shaft (`#ffb21c`, core `#ffe46a`,
  unlit), the existing orange light fan, and `glow` 1 -> 1.4 for 6 frames.
- **Where he stands.** On the cut into shot 22 he is ON the lid's front half, B (-0.65, 0.10, 1.66), facing the lens, clear of the handwheel
  (r 0.20 round the centre), with `scrollsheet` `end` 1 in both gloves; `termsscroll` `pull` 1 on the same cut. The front edge is the edge that
  drops furthest. He reads clause 100 with the mouth at open 0.1, and only after the last word goes `terrified` (an open face freezes the talk).
- **The fall (shot 23, frames).** 0: he stands, eyes huge. 4: `fall` 0 -> 1, shake 3 frames. 5: the engine's `drop` on him to y -1.60 over
  0.42 s (it speeds up like a stone; never a tweened move), both arms to `up` in 3 frames; on this frame `scrollsheet` is hidden and
  `scrolltail` shown in its place (two props swapped on one frame: no blend from the glove). 12: his leaf passes the ring (inner r 0.585; he
  is 0.76 wide). 8-14: the Devil lifts his glass 0.15, `happy`. 22-24: CUT, the tail still snaking in. He is never seen landing.
- The Devil sits in the chair at B (0.50, 0, 0.95) as built, shades on throughout (mouth and brows carry him).

## 7. NEW kinds and the builder tasks (one props file per set)

| Task | File | Kinds |
|---|---|---|
| **A: the gate and the stair** | `engine/page/props-heaventerms.js` | `termsscroll` (0.40 wide, ~81 m), `scrollroll` (0.52 x r 0.055), `scrollsheet` (0.40 x 0.34 page + tail), `scrolltail` (2.40 m), `goldstamp` (0.20 x 0.24 x 0.14), `goldmat` (0.72 x 0.02 x 0.34), `risernum`. Grip rows: `scrollroll` and `scrollsheet` box, `goldstamp` mug. |
| **B: heaven home** | `engine/page/props-heavenhome.js` | `homeisland` (r 2.60), `cloudbed` (1.15 x 0.42 x 1.90), `goldharp` (0.80 x 1.45 x 0.30), `cloudhouse` (island r 1.50, house r 0.85 x 1.25), `dawnsky` (drum r 30 + cloud sea + 7 far islands), `sockwell` (r 0.19). Nothing held. |
| **C: cast and the hatch** | `characters/potatobrawl/ex.json` + costume `ex`; the `spud` costume's `feet` and `sockWet`; `hellhatch` `fall` in props-heavensky.js (its owner's file: one small key) | then `node qa/golden.mjs` and `node qa/regress.mjs`. |

**Reuse as they are:** `heavenstairs`, `heaventerrace`, `pearlgate` (`open` in shot 4), `cloudpodium`, `gaterays`, `stairsky`, `zoneclouds`,
`hellfloor`, `hellhatch`, `deckchair`, `parasol`, `smokewisp`, `embers`, `fogveil`, `cloudpuff` (terrace edge, the Angel's step and his riding
cloud), `phone` x2, `drinkglass`, `sneaker` x2, Angel A (`angel.json`), the Devil with shades (`devil.json`), the hidden `ridetread` carrier.
**Not used this episode:** `ledger`, `goldquill`, the fold, lift and escalator states, the small demon. **Checked and not usable:**
`longbill` (0.11 wide receipt, 120 segments, one straight path: the mechanism is copied, not the kind), `scroll` (a 0.55 papyrus map),
`rubberstamp` + `stampmarks` (0.10 wooden office stamp; its mark is the word APPROVED), `bed` and `hotelbed` (wooden frames, dotted
blanket), `pillow` (a cabin pillow, too small), `sunsetsky`, `biminisky`, `aasky` (section 3), `splash`, `wetpuddle`, `ripples` (crowns and
rain rings: the cartoon splash the brief rules out), `heavenisland` (a 0.90 flat backdrop card with dancing potatoes).

## 8. Phone read at 1080 x 1920 (what is too small, and the fix designed in)

- The grey bars are 0.012 high: under 8 px wider than 650 px/m. They read as texture in shots 4, 17, 19-22 and as plain cream in 1 and 3. Right:
  nobody reads it. The ribbon itself is 18-30 px wide in the far half of shot 3: its cream on red stone and the moving roll carry it.
- The stamp mark is ~130 px in shot 4 and seen for 10 frames only: the slam, the shake and the gate carry "he agreed".
- The Devil is ~100 px in shot 15 on purpose. What reads: the glowing hatch (150 px), the striped chair, a red body, a waving light. His line
  is captioned in his colour; shot 21 pays him off at full size.
- "No bars / one bar" cannot be drawn on a 64 x 127 px screen without lettering: the screen's glow (dim, then bright with a flash) and the
  two lines carry it.
- Wet cloud: the well is 0.38 wide = 380 px in shot 7 and gets the lower sixth of the frame to itself; the wet tide line on the socks is the
  proof that stays in every later Set B shot.
- The ex's lashes and scrunchie read only in shots 12-13 (690 px/m); in shot 9 she is a lilac shape with a bun, waving: enough.
- White socks on white cloud: the socks are warm white `#f8f6f0` with grey caps and brown legs above them; the cloud is cool `#fbfdff` with a
  lilac shade. Judge it in the first Set B still.
- Shot 1 is the only shot that must read with no sound: mat, gate, tall Angel, fat scroll. The stamp is a 60 px gold plant there, no more.

## Departures from the sheet (each with its reason)

1. Every panel: re-framed from a square cell to 1080 x 1920 with every face under row 640 (the caption band).
2. Panel 01: the scroll starts as a fat roll lying ON the podium, not held up beside the Angel's face (a fat roll in two gloves has no place
   that clears his mouth while he says the rule); he stands 0.14 higher on a cloud step. The stamp already stands on the podium.
3. Panel 02: real riser numbers in their real places; the ribbon runs BESIDE them in five lazy swerves; no patch on Spud's back; the lens is
   6 m up and 5 m behind him, so the stair fills the frame (a low over-the-shoulder view shows the stair edge-on).
4. Panel 03: the stamp leaves a tick in a frame, no word; the stamp is in his glove on the cut (no pick-up on screen).
5. Panels 05, 08: the Angel rides his own small cloud at the rim (nobody floats); his roll is thin (the rest lies on the stairs).
6. Panel 06: water wells up and runs back, no drops in the air (the brief's "realistic"); his line gets its own shot of the Angel (8), reused
   as 11 and matched by 16 and 18.
7. Panel 07: split in two (the docking wide, then his eyes behind the strings); the ex's leaf is left out, as drawn.
8. Panel 08: both her gloves on his belly and side, under y 0.40 (the sheet's arm across his chest would cross his mouth); beat 5's
   "he brightens" gets a short shot of its own before it (12).
9. Panel 09: one glove on the phone, not two (one hold from shot 14 to 15); the harp is at the frame's right, not left (one layout for Set B).
10. Panel 10: the Devil is ~100 px, not a quarter of the frame (the director's correction); the phone is in one glove.
11. Panels 12, 13: he walks on the flat landings 80 and 40 (a walk keeps one floor height; the real "80" and "40" are on those risers), and the
    lens sees the back of his sheet.
12. Panel 14: the Devil's chair and the hatch stay where heaven-steps built them; a gold "1" is added on riser 1 as a separate decal.
13. Panels 15-16: he stands on the lid for clause 100 (the hatch has to open under him); the lid swings DOWN, a new state.

## Open questions (my default)

1. The outline says the stamp reads "I AGREE"; the sheet and the brief say no words. Default: a tick in a frame, no word.
2. Spud's canon feet are brown (spud.json); the approved sheet draws white sneakers. Default: white sneakers in this clip only, so the socks
   read as "shoes off".
3. The Angel on a 0.14 cloud step at the podium. Default yes; without it the fat roll must be thinner than r 0.08 in shot 1.
4. The ex: no leaf, lighter skin than the cast, as drawn. Default as drawn.
5. A 0.8 s close insert of the Devil for "Five bars!". Default no: the sheet keeps him tiny and shot 21 is his reveal.
6. A third stair cut on landing 60 (20b). Default no; add it only if the "Clause..." lines need the picture.
7. The gold "1" on riser 1. Default yes; first thing to cut.
8. Shots 8, 11, 16, 18 repeat one deadpan framing of the Angel on purpose (the viewer learns to expect him). Default yes.

## Risks

- **`termsscroll` is the big build**: 81 m, about 1 400 segments, a wave that crosses nine landings and five swerves. Bench it alone first
  (stills at unroll 0, 0.02, 0.3, 1 from shots 1, 3, 19, 21) and prove the roll passing the lens in shot 2 with a one-second
  `--draft --from --to`. If it runs late: drop the bridged risers (flat chords only), never the swerves.
- **Five things pass through hands** (stamp, sheet, his phone, the Angel's roll, the glass). Cut order if a hold fails a fix round: the glass;
  then the Angel's roll rests on the rim lobe in front of him with his gloves on it; then the stamp stands and he slaps its knob.
- **Shot 15's sight line** from world (11.10, 30.30, 15.95) to the hatch must be free of zone clouds, smoke and crags: check it in the first
  bench still. Fallback: move H up to 2 m in x; the camera numbers move with it.
- **The hug** needs a named check window and reads as clipping if the overlap grows past 0.12: judge a close still, both bodies.
- **Lying at the rim** (`pitch` 80) is seen only from above and behind; check feet and belly ON the cloud in a side still anyway.
- **The fall**: a `drop`, a lid tween and a two-prop swap inside 2 frames. A one-second window draft before any full render.
- **Set B show / hide on cuts** (6 props + the cast): one-frame pops. The draft's pops line must be empty at the cuts into shots 5 and 17 (8.4 s and 40.0 s on the targets).
- **Fixed-opacity rule**: `sockwell`'s water and the stamp mark grow by scale or visibility; judge both from a sequential draft.
- **Timing**: 23 shots. Beat 4 (shots 9-11) and beat 8 (19-20) are the tightest; the Angel singles are where to trim or stretch.
