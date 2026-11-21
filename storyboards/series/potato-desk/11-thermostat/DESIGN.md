# Potato Desk 11 — Thermostat war: design

Creative director, 20 Nov 2026. Target look: `/mnt/project-files/videos/potato-desk/11-office/sheets/thermostat-sheet-1.png` (panels 01–12, drawn from outline v1). Beats: `/mnt/project-files/videos/potato-desk/11-office/STORY.md` "Beat outline v2 (~60 s)". Projected pixels and reaches below are computed, not rendered: fit every camera with `qa/camfit.mjs` and bench every reach in section 8 before staging.

Build for 1080 × 1920 at 30 fps. World axes are +x right, +y up, +z toward camera. Dimensions are W × H × D in metres; positions are mesh centres unless marked feet, top, base, hinge or back face. Bodies (H × W × D): Chip 0.53 × 0.57 × 0.52, Spud 0.88 × 0.76 × 0.66, Mash 1.24 × 0.54 × 0.50, Wedge 0.98 × 0.88 × 0.67. Crowns standing on the floor (0.14 m legs): Chip 0.67, Spud 1.02, Wedge 1.12, Mash 1.38. Same office as episode 10: wall, carpet, ceiling, lanyards and their colours are reused. Whole frame sharp.

**Colour rule.** Saturated orange `#FF7A1A` is heat only: the heater's grille, its light pools, the warm side of Spud. Ice blue `#BFE0FF` is cold only: the window's sky, snow shadows, the cold pools, the cold side of Spud. No other set piece, note, pin or mug is orange or ice blue. Chip's layers are maroon `#8E2F3A` and cream `#EFE3CC`; Mash's are blue-grey `#9FB4C6` (fans) and `#4F7FD0` (ice bag). Cast colours stay; nobody's skin is tinted, frosted or reddened.

**Lettering rule.** The only readable marks in the film are the thermostat's two LCD digits (12–30) and its degree ring. Notes, memos, ID cards, monitor screens, fan, heater and lock carry bars, scribbles and pictograms: no letters, no other digits, no "C".

## 0. What is fixed against the sheet

| # | Sheet | Design |
| --- | --- | --- |
| 1 | Everyone sits in an office chair | Nobody sits. They stand behind desks closed to the floor; the chairs are dressing (section 1, "Seated or standing"). |
| 2 | Heads level at the desks (09) | Mash stands 0.36 above Spud; Chip stands on a 0.26 box at his desk (crown 0.93) and on a 0.74 step at the wall (crown 1.41). |
| 3 | The thermostat hangs above whoever the panel shows (05–08) | One thermostat, back wall, x 0, over Spud. Panels 05–08 are shot from the side so it stays in frame (section 7). |
| 4 | Window on the back wall in 01–08, on a right wall in 09 | Back wall, x +1.35..+1.95. No right wall. |
| 5 | Sweat drops (02, 06, 08–12), shiver lines (01) | Not built: the standing rule bans reaction symbols. Mash fans himself and sags; Chip trembles ±0.008 m at 10 Hz. |
| 6 | Wedge passes behind Spud (04) | He passes in front of Mash's desk, z +1.05: the lane at the wall holds the step and a chair. Same picture: Wedge big on the right, Spud left, thermostat above. |
| 7 | Wedge left of the cover (11), his sleeve on the right (12) | Wedge on the right of it in both (wall slot R1b); Chip's step fills the left. |
| 8 | Chip and Mash cheek to cheek under the cover (12) | Chip's face beside the bare plate (S28), Mash's face in its own punch-in (S29): they stand 2.2 m apart with the boss between. |
| 9 | Blanket on Chip in 07 | Blanket from the peak (S19) on, as v2 says; 07 has scarf and hat only. |
| 10 | The popped cover sits in Wedge's hand (11, 12) | It hangs from its top right clip, face and blank LCD to camera as drawn, propped on his fingertip: nothing is held. No battery, no wires, no board behind it. |

## 1. Stage and marks

Back wall face z −1.30, x −2.30..+2.30, ceiling y 2.60. No side walls. The wall above y 1.82 is bare between x −1.90 and +1.25: every medium's caption (rows 210–410) lands there.

**Seated or standing: standing (default).** The desks are closed to the floor and stand 0.50 high, so every camera in section 7 sees the same head and chest over a desk top whether a body sits or stands. `sit` would add a seat-height still per character, sinking bodies and holds measured from the seat (the skip-remote lesson in `docs/rules/output.md`), and about 14 sit/stand changes, because each of the three leaves his desk in every act. Standing, every move between marks is a `place` on a cut. Chairs stay as look-only dressing.

| Mark | Feet (x, z) | Stands on | Use |
| --- | --- | --- | --- |
| Chip desk | (−1.00, −0.36) | box, top 0.26 | Body 0.40..0.93, desk hides the lowest 0.10. |
| Chip wall | (−0.56, −0.98) | step, top 0.74 | Body 0.88..1.41, x −0.845..−0.275; eyes about 1.12. Left hand (screen-right) presses UP. |
| Spud | (0.00, −0.36) | floor | Never leaves. Eyes about 0.58; leaf top about 1.14, 0.94 m in front of the thermostat. |
| Mash desk | (+1.00, −0.36) | floor | Eyes about 0.80. |
| R1 | (+0.64, −0.95) | floor | Mash at the thermostat (right hand, screen-left, presses DOWN); Wedge for the lock box (S21–S22). |
| R1b | (+0.86, −0.95) | floor | Wedge for the reveal (S27–S31): clear of the hanging cover, his right fingertip under its low corner. |
| W | (+1.00, −0.85) | floor | Mash opens the window: turned 20° toward +x, left palm on the sash's free edge. |
| R2 | (+1.62, −0.95) | floor | Mash from the rip (S26) to the end: in front of the open window, in the snow. In S21–S23 he is back at his desk. |
| Wedge pass | (+0.55 → +1.60, +1.05) | floor | S04 only; he enters and leaves frame right. |

Chip is never on the bare floor behind the desks (crown 0.67 under a 0.78 monitor). Centre distances at the desks 1.00; at the wall Chip–R1 1.20, R1–R2 0.98, R1b–R2 0.76. Wedge (shoulder about 0.73) touches nothing above y 1.15.

## 2. Set

| Piece | Kind | Geometry, position and finish |
| --- | --- | --- |
| Back wall | REUSE `officewall` | 4.60 × 2.60 at (0, 0, −1.30). Dado, wall, top `#B7C4B8`, rails `#AEBBAF`. |
| Floor | REUSE `carpettiles` | w 5.0, d 12.0 at (0, 0, +4.6), colours as built. |
| Ceiling | REUSE `ceilingtiles` | 4.60 × 5.60 at (0, 2.60, +1.50), light panel at [0, 0.9]. |
| Desks × 3 | NEW `officedesk` | 0.90 × 0.50 × 0.55, bases at (−1.00 / 0.00 / +1.00, 0, +0.255): z −0.02..+0.53, gaps 0.10. Top 0.03 `#B58E63` with a 0.004 edge band `#8C6B48`; front and side panels to the floor `#6C6660`; plinth 0.05 `#4A4642`. Top is solid and takes props. |
| Monitors × 3 | REUSE `crtmonitor` | Bases on the tops at (−0.67, 0.50, +0.16), (+0.33, 0.50, +0.16), (+1.33, 0.50, +0.16); screens turned to their owners (we see the beige backs). Top y 0.78. |
| Keyboards × 3 | REUSE `keyboard` | (−1.02 / −0.05 / +0.98, 0.50, +0.24). |
| Paper stacks | NEW `paperstack` | 0.22 × 0.09 × 0.30 of 40 sheets `#F6F3EA`, edges drawn once, top sheet with 4 grey bars `#B5B0A4`. `amount` 1..0.3 lowers it. Spud's at (−0.31, 0.50, +0.25), Chip's (−1.33, 0.50, +0.22), Mash's two (+0.82 and +1.05, 0.50, +0.36). |
| Desk bits | REUSE `taperoll` (lie), `coffeecup`, `teamug` | Tape on Chip's desk (−1.12, 0.50, +0.40) from frame 0. Spud's takeaway cup, scale 1.4, at (+0.08, 0.50, +0.40), `steam` 1. Chip's mug (section 6) at (−0.86, 0.50, +0.40) when not in his hand. |
| Step and box | NEW `stepstool` | Wood `#B98A56`, treads 0.03 `#C9A878`. spec.h 0.74: three treads at 0.25, 0.50, 0.74, footprint 0.38 × 0.36, base at (−0.56, 0, −0.98), treads toward −x. spec.h 0.26: one box 0.40 × 0.26 × 0.36 at (−1.00, 0, −0.36). Tops solid and standable. |
| Chairs × 3 | NEW `officechair` (look-only) | Back 0.40 × 0.42 × 0.06 `#4A5560`, top y 0.90, gas stem, seat 0.42 × 0.06 × 0.30 at y 0.44, five-star base `#2E3338`. Bases: Chip's (−1.05, 0, −0.88), Spud's (0.00, 0, −0.88) with a patch 0.10 × 0.12 `#A9794A` and 6 stitches on the back's upper left (panel 01), Mash's (+1.62, 0, −0.30) turned 25°. |
| Window | REUSE `blindwindow` + NEW `lift`, `open`, spec.view "snow" | Opening 0.60 × 0.90, centre (+1.65, 1.40, −1.30): y 0.95..1.85, head box to 1.90. View: sky `#C9DDF2` down to `#9FB9D8`, three fir shapes `#7C93AE`, flakes falling behind the glass from frame 0. `lift` 0..1 stacks the slats into 0.10 at the head (0.25 s). `open` 0..1 swings the one sash OUTWARD on its right jamb to 80° (0.3 s): nothing sweeps the room. Open, the hole is the view with no glass glint. |
| Wall notes | NEW `wallnotes` | 7 notes with the fridge's scribble hands: at (−1.55, 1.50), (−1.42, 1.22), (−0.78, 1.66), (−0.70, 0.98), (+0.52, 1.02), (+0.80, 1.55), (+1.10, 1.20); 0.13–0.17 square or 0.15 × 0.21 pinned memos; paper `#FDF3A6`, `#EFE2A0`, `#F6F3EA`; pins `#2F6FB5`, `#F2C94C`, `#4E9A5A`. None above y 1.80, none within 0.35 of the thermostat's centre in x. |
| Plant | REUSE `wiltplant`, spec.scale 0.5 | Floor (−0.47, 0, +0.70), in the heater's light: top 0.68 at `bloom` 1, 0.48 at 0. |
| Light | — | Key `#FFF1D6` from upper right front, fill `#DCE6EE` from the left, as episode 10. The split is painted with pools (section 4). |

## 3. Thermostat and lock box

**NEW `thermostat`.** Origin: centre of its back face on the wall at (0, 1.36, −1.30); faces +z. Sized as drawn (0.63 of Spud's width) so the number reads in the wide.

- Wall plate 0.42 × 0.38 × 0.012 `#D9D0B8`: four screw bosses Ø0.035 at (±0.15, ±0.13), a dust outline, nothing else.
- Cover 0.48 × 0.44 × 0.075, corner radius 0.05, `#E4DCC6`, lower edge shade `#CFC6AD`: x −0.24..+0.24, y 1.14..1.58, front face z −1.225. Hollow behind (wall 0.006, inside `#D2C9B0`).
- LCD window 0.34 × 0.20, centre 0.065 above the origin, sunk 0.006 behind a bezel `#BDB49C`. Ground `#B9C4A8`, unlit segments `#AAB69B`, lit `#1E2A22`. Two seven-segment digits 0.165 high × 0.095 wide, 0.04 apart, stroke 0.026, slanted 6°; degree ring Ø0.03, stroke 0.008, top right.
- Buttons Ø0.09, 0.012 proud, `#BFB7A2` with a 0.004 rim `#8E8775`, centres 0.135 below the origin at x −0.105 (UP, triangle up) and +0.105 (DOWN, triangle down); triangles 0.04 `#5E5A50`. World y 1.225.

| State | Range | What it does |
| --- | --- | --- |
| `temp` | 12..30, or "blank" | The number. A tween steps through whole numbers; a string jumps. |
| `up`, `down` | 0..1 | Dips that button 0.006; the LCD ground flashes to `#C9D4B8` for 2 frames at 1. |
| `tape` | 0..1 | Two strips of cream masking tape `#EDE2C4`, 0.17 × 0.034, torn ends, crossed at ±42° over DOWN: the first lands by 0.5, the second by 1. |
| `shake` | 0..1 | Rocks the cover ±5° and ±0.012 at 9 Hz on the clip clock (the tug). |
| `pop` | 0..1 | 0..0.2: the cover jumps 0.03 off the plate, LCD blank. 0.2..1: it swings in the wall's plane about its top right clip at (+0.24, 1.58), to 105° and back to 95°: its centre ends near (+0.48, 1.36), face to camera, tilted, the plate bare (x −0.21..+0.21). Grip point `coverLow`: its lowest corner at `pop` 1, about (+0.45, 1.10), where Wedge's fingertip props it. |

**NEW `thermobox`** (panel-less: v2 only). A clear case over the thermostat; same origin. 0.58 × 0.54 × 0.13, wall 0.006, `#DCEBEE` at 20 %, edges `#F4FBFC` at 60 %, no edge or glint across the LCD window from any camera within 30° of square. Four steel tabs 0.05 × 0.05 `#B9BEC4` at the corners, one screw Ø0.018 `#8E959B` each. Lock barrel Ø0.05 `#C9CED2`, 0.02 proud, centred on the bottom rail, a 0.004 slot.

| State | Range | What it does |
| --- | --- | --- |
| `on` | 0..1 | 0 hidden; slides in along the wall from x +0.60, tipped 20°, and seats at 1 with a 0.008 bounce. |
| `key` | 0..1 | A brass key `#C9A23C` 0.07 long in the barrel; 0..0.5 it turns 90°, 0.5..1 it is drawn out and gone. |
| `tug` | −1..1 | Slides ±0.035 in x and tips ±7°; follows whoever pulls. |
| `rip` | 0..1 | Screws walk out 0.03 by 0.6 (plaster dust, 6 specks each), the lower pair let go at 0.8, at 1 the box is free: it then becomes a physics body and falls behind Spud. |
| Grip points | — | `sideL`, `sideR`: face centres at x ∓0.29; `railR`: the bottom rail's right end, (+0.22, −0.27) from the origin, world y 1.09. Palms lie on these; nobody grabs it. |

## 4. The room's two climates

| Piece | Kind | Build and place |
| --- | --- | --- |
| Desk fan (panel 06) | NEW `deskfan`, style "desk" | 0.36 high: cage Ø0.26 × 0.10 `#9FB4C6` with 16 wires and a hub cap, stem, base Ø0.18 with one button Ø0.03 `#D8452F`. Base on Mash's desk at (+0.66, 0.50, +0.38), aimed at −x and turned 15° to camera. `on` 0..1: three blades blur into a disc `#DDE6EE` at 35 %, spin from the clip clock, cage shivers 0.002. |
| Twin fan (panel 09) | `deskfan`, style "twin" | Box 0.62 × 0.36 × 0.16 `#9FB4C6`, two Ø0.26 rotors, two feet. Floor (+1.00, 0, +0.80), turned 30° toward −x. Same `on`. A cable `#2E3338` runs from it up to the desk fan's base: one button starts both. Hidden until the S19 cut. |
| Heater (panels 07, 09) | NEW `spaceheater` | 0.30 × 0.34 × 0.18, shell `#B9BEC4`, handle slot, grille 0.22 × 0.20 with 5 bars and a wire guard. Floor (−0.80, 0, +0.74), turned 40° toward +x. `on` 0..1: bars `#3A3D42` to `#FF7A1A`, core `#FFD27A`, halo 0.12. |
| Warm light | REUSE `lightpool` × 2 | Floor: w 1.8, d 1.2, `#FF8A2A`, at (−0.70, 0, +0.95). Wall (face "z"): 1.5 × 1.3, `#FFB36B`, at (−1.15, 0.95, −1.285), `on` capped at 0.35. Both follow the heater. |
| Cold light | REUSE `lightpool` × 2 | Floor: w 1.8, d 1.3, `#BFE0FF`, at (+1.20, 0, +0.85). Wall: 1.3 × 1.4 at (+1.50, 1.10, −1.285), capped at 0.35. Both follow the window. |
| Spud's two sides | REUSE `lightpool` × 2, face "z" | 0.55 × 0.90 at (−0.26, 0.72, +0.56) `#FF8A2A` and (+0.26, 0.72, +0.56) `#BFE0FF`, capped at 0.30: a painted tint in front of him, frontal cameras only (S09, S19). |
| Snow in | REUSE `snowspray`, `noterain` (look "snow") | Spray: w 0.60, h 0.90, base (+1.65, 0.95, −1.28), gaps [0.20, 0.45, 0.70]. Flakes: n 200, r 0.9, top 2.0, disc at (+1.35, 0, −0.30). |
| Snow down | REUSE `snowdrift` × 2, `iciclerow` × 2 | Under the window: w 1.0, d 0.5 at (+1.65, 0, −1.30). Across the carpet: origin (+2.05, 0, +0.70), turned so the snow runs toward −x, w 1.6, d 1.1. `depth` to 0.35. Icicles under the sill (len 0.60, count 6) and under the right front edge of Spud's desk (len 0.30, count 4, at (+0.30, 0.50, +0.53)). |
| Flying papers (panels 06, 09) | NEW `paperflurry` | 14 sheets 0.16 × 0.22 `#F6F3EA`, three grey bars each, each with its own tumble. They leave Spud's stack and cross to x −1.75 in 1.1 s, staggered, looping. Band y 1.00..1.80, z −0.25..+0.45. No sheet within 0.10 of the LCD window as seen from z +3..+9, none below y 1.05 at \|x\| < 0.45. `amount` 0..1 is the share in the air; Spud's stack drops to `amount` 0.3 with it. |
| Frozen coffee | REUSE `snowlump` (r 0.05), `icicle` (len 0.09) | On Spud's cup: the lump on the lid, the icicle off the rim's +x side. Both scale 0 → 1 in S20; the cup's `steam` is 0 from S08. |

State by shot (a change is a tween inside the shot unless marked cut; each has its cause in the same shot):

| Shot | `temp` | Fans | Heater, warm pools | Window, snow, cold pools | Papers | Other |
| --- | --- | --- | --- | --- | --- | --- |
| S01–S04 | 19, 21 at 2.9, 19 at 3.5 | off | off | shut | 0 | plant `bloom` 1 |
| S05 | 23 (cut) | off | off | shut | 0 | scarf (cut) |
| S06 | 17 (cut) | desk 0 → 1 at 7.4 | off | shut | 0 → 0.5 | |
| S07 | 25 (cut) | desk 1 | 0 → 1 at 9.2 | shut | 0.5 | hat (cut); `bloom` starts down |
| S08 | 15 (cut) | desk 1 | 1 | `lift`, `open` 0 → 1 at 11.0–11.4; spray 1, flakes 0.6 | 0.5 | ice bag (cut); cup `steam` 0 |
| S09 | 15 | desk 1 | 1 | open; drift `depth` 0.12 | 0.5 | `bloom` 0.6 |
| S10–S11 | 17, 19, 21 at 15.6, 15.8, 16.0 | desk 1 | 1 | open | 0.5 | |
| S12 | 21 | 1 → 0 in 0.8 s | 1 → 0 in 0.8 s | `open`, `lift` 1 → 0 by 18.6; spray, flakes 0 | 0.5 → 0, sheets land | the deal undoes it on screen |
| S13–S15 | 22, 20, then 23, 19, 24, 18 | off | off | shut | 0 | |
| S16–S18 | 26; `tape` 0 → 1; 26 → 12 in 1.2 s; 12 → 30 in 1.0 s; 30/12 at 4 Hz | off | off | shut | 0 | |
| S19 | 30/12 | both 0 → 1 at 29.5 (Mash's finger on the one button) | 0 → 1 at 29.6 (Chip points) | Mash steps 0.5 m to W; open at 30.4, all snow 1 | 0 → 1 | blanket `cover` 0 → 1 at 29.9; drift to 0.35 by the end |
| S20 | — | on | on | open | 1 | `bloom` → 0, cup ices, icicles `grow` 1 |
| S21–S23 | 21 as the box seats | on | on | open | 1 | `thermobox` `on`, `key` |
| S24–S26 | a fixed list of 14 numbers, one every 4 frames | on | on | open | 1 | `tug`, `shake`, `rip`; 21 once the box is off |
| S27–S32 | blank from the pop | on | on | open | 0.6 | `pop` 0 → 1 in 0.35 s |

## 5. Worn pieces

| Piece | Kind | Fit and timing |
| --- | --- | --- |
| Lanyards, all four | REUSE `lanyard` | Episode 10's fits, frame 0 to the end. |
| Scarf, Chip, from S05 | REUSE `scarf`, wear chip | `#8E2F3A`, no stripe, width 0.11 (chunky as drawn). Ends hang on his left (screen-right). |
| Bobble hat, Chip, from S07 | REUSE `bobblehat`, wear chip + NEW spec.cuffColor | Knit and pom `#8E2F3A`, cuff `#EFE3CC` with one zigzag row `#8E2F3A`. Both leaves through the slit. |
| Blanket, Chip, from S19 | REUSE `huddleblanket` + NEW spec.pattern "tartan" | `#8E2F3A` on `#EFE3CC`, checks 0.09, fringe 0.03. Two copies, one per mark: desk (prop y 0.26) and wall (prop y 0.74), spec.over [[x, z, 0.67]]; the copy at the mark he is on has `cover` 1, swapped on cuts. |
| Ice bag, Mash, from S08 | NEW `icebag`, part "worn", wear mash | Slumped pleated bag Ø0.26 × 0.11 `#4F7FD0`, 12 pleats into a screw cap Ø0.075 × 0.03 `#F1F1EC`, on the crown on the screen-left side of his sprout, built on the skin like `bobblehat`. Hidden in S17–S18 while the loose one is on the thermostat. |

## 6. Hand props

Four grabs in the whole film, none longer than two shots; everything else is a palm or a fingertip on a prop that moves by its own state.

| Prop | Kind | Hold | Shots |
| --- | --- | --- | --- |
| Folder (panel 02) | NEW `manilafolder`: 0.24 × 0.32 × 0.008 `#E2C48A`, cut tab, two scribble bars | `grips.phone` (SIZE as `clipboard`), Mash's right hand (screen-left). Lower edge at y ≤ 0.75, 0.24 to the side of his face centre, never across it; the fanning is the prop's tilt, ±18° at 4 Hz. | S02. On the S03 cut it lies on his desk. |
| Boss mug (panel 04) | REUSE `teamug`, scale 2.0, `#F6F4EE`, `steam` 0 | `grips.mug`, Wedge's right hand, episode 10's hold. | S04. From S27 a second one stands on Spud's desk at (−0.02, 0.50, +0.42) (panel 11); his hands are free in S21–S22 and S27–S31. |
| Phone | REUSE `phone`, scale 1.5, case `#8FB1C5` | `grips.phone`, Mash's left hand (screen-right), low, screen to himself: episode 10's hold mirrored. His right index presses DOWN without a look. | S14. |
| Hot mug | REUSE `teamug`, scale 1.6, `#9DB7A0`, `steam` 1 | `grips.mug`, Chip's left hand; the mug's wall on the cover's lower left corner, centre (−0.31, 1.10, −1.17), under his eye line (1.12). | S18. Otherwise on his desk. |

| Touch, not a hold | How |
| --- | --- |
| Buttons | `point` fingertip on the cap; the cap's `up` / `down` dip is the proof. |
| Tape X | State `tape`. Chip's flat palm pats DOWN twice, 0.15 s apart; the roll stays on his desk. |
| Ice on the thermostat (S17–S18) | `icebag` part "loose" (0.24 × 0.20 × 0.09, flat back) wrapped on the cover's right edge, centre (+0.29, 1.34, −1.20), there on the cut; Mash's right palm flat on it. |
| Fan button, heater | `point` at the button; Chip points down at the heater over his desk's front edge (no touch). |
| Sash | Mash's flat left palm on the free edge at (+1.37, 1.15, −1.26) for 0.2 s; the sash leaves his hand. |
| Lock box | Wedge's right palm under `railR` while `on` runs; his fingertip at the barrel for `key`; then his left palm pats his left pocket (episode 10's pat). In the tug Chip's two palms lie on `sideL`, Mash's two on `sideR`, and follow `tug`. |
| Cover | Wedge's right fingertip flicks the cover's low right corner at (+0.24, 1.14), follows it out and ends under `coverLow`. |
| Handshake (S11) | Chip's left and Mash's right glove, palm to palm at (0, 1.05, −0.92), two pumps of 0.03 in step. Spud ducks 0.10 under it. |

Cut from v2: the tape roll in a hand, the carried lock box, the key in a hand, Mash's cup (he reads his phone), the unlock before the pop (the box is already torn off).

## 7. Cameras

One camera per beat, 32 shots. Every shot moves from its first frame to its last (push = toward its look point by the share given; drift = sideways in x). Cut 0.1–0.2 s after the action or beep that ends a beat. Captions: rows 210–410, full width, on the bare wall above y 1.82 or on the ceiling in the wides, unless the row says otherwise; in the closes the thermostat's top stays at row 470 or lower. "Digit" is the LCD digit's height in px at 1080 wide (a third of it on a 360 px phone): nothing under 50.

| # | s | Panel | Camera pos; look; FOV | Move | Shows | Digit |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | 0.0 | 01 | (−0.35, 1.45, 3.85); (−0.25, 1.10, −1.30); 30° | push 6 % | Chip on the step, trembling, finger at UP; 19; Spud under it | 115 |
| S02 | 1.5 | 02 | (1.55, 1.25, 3.30); (1.00, 0.85, −0.36); 32° | drift −0.10 | Mash fans himself with the folder. Caption x 40–640 | — |
| S03 | 2.7 | 03 | (0.00, 1.38, 0.55); (0.00, 1.36, −1.30); 30° | push 8 % | Thermostat 930 px wide; yellow cuff: 21; charcoal cuff: 19; Spud's leaf tip at the bottom edge | 320 |
| S04 | 4.1 | 04 | (−0.55, 1.20, 4.60); (0.30, 0.90, 0.00); 34° | drift +0.12 | Wedge crosses right with his mug, glance, smirk; Spud's eyes follow him | 87 |
| S05 | 5.3 | 05 | (−1.90, 1.25, 3.40); (−0.50, 1.02, −1.00); 34° | push 5 % | Chip at his desk in the scarf; 23 upper right | 103 |
| S06 | 7.1 | 06 | (1.75, 1.25, 3.60); (0.45, 0.98, −0.90); 36° | drift −0.12 | Mash's finger on the fan; papers cross Spud; 17 | 94 |
| S07 | 8.9 | 07 | (−1.55, 1.55, 3.60); (−0.62, 0.72, −0.50); 38° | push 6 % | Chip in the hat points at the heater; it lights; 25 top right | 89 |
| S08 | 10.7 | 08 | (2.20, 1.40, 3.10); (0.78, 1.18, −1.20); 42° | drift −0.15 | Mash at W, ice bag, sash out, snow in; 15 at left. Caption x 40–700 | 85 |
| S09 | 12.7 | 09 | (0.17, 1.75, 8.60); (0.17, 0.95, 0.00); 34° | push 4 % | The whole room, half orange, half blue; Spud types | 52 |
| S10 | 14.6 | — | (0.00, 0.95, 3.20); (0.00, 0.95, −0.50); 32° | push 8 % | Spud, a palm out to each side; Chip clicks 17, 19, 21 above him | 123 |
| S11 | 16.4 | — | (0.00, 1.55, 2.60); (0.00, 1.12, −0.95); 34° | push 6 % | The handshake under the 21; Spud's eyes up at it | 133 |
| S12 | 18.0 | — | (−1.90, 1.70, 6.60); (0.00, 0.85, −0.30); 32° | drift +0.15 | Three at their desks; fan runs down, glow dies, blind drops | 68 |
| S13 | 19.6 | — | (−1.45, 1.35, 2.90); (−0.30, 1.15, −1.00); 34° | drift +0.10 | Chip on the step, eyes on the ceiling, hand creeps: 22 | 118 |
| S14 | 21.0 | — | (1.50, 1.40, 2.90); (0.32, 1.12, −1.00); 34° | drift −0.10 | Mash at R1, eyes on his phone, finger: 20 | 118 |
| S15 | 22.4 | 03 | (0.00, 1.50, 0.90); (0.00, 1.33, −1.30); 34° | push 10 % | Two fingers, a beep every 0.3 s; Spud's leaf flicks to each | 235 |
| S16 | 23.8 | — | (−0.75, 1.45, 1.60); (−0.05, 1.30, −1.25); 36° | push 6 % | Chip sets 26, two tape slaps; Mash's finger jabs the X twice: nothing | 166 |
| S17 | 25.8 | — | (0.80, 1.45, 1.70); (0.08, 1.30, −1.25); 36° | push 6 % | Mash's palm holds the ice bag on it; the number runs down to 12 | 160 |
| S18 | 27.6 | 10 | (0.00, 1.40, 2.90); (0.00, 1.22, −1.00); 36° | push 10 %, shake 0.006 | Mug left, ice right; 30, then 30/12 | 116 |
| S19 | 29.4 | 09 | (−0.25, 1.55, 8.40); (0.15, 0.95, 0.00); 35° | drift +0.20 | Fans, heater, blanket, window, one after another in 1.0 s; then snow and paper build | 50 |
| S20 | 31.8 | — | (−0.75, 0.75, 2.40) to (+0.35, 0.80, 2.40); look (−0.45, 0.40, 0.60) to (+0.12, 0.62, 0.35); 30° | travel 1.6 s | Plant folds in the orange; Spud's gloves type; his cup ices over | — |
| S21 | 33.6 | — | (0.55, 1.45, 1.50); (0.02, 1.36, −1.25); 34° | push 10 % | The clear box drops over it, key turns, out; 21 | 185 |
| S22 | 35.6 | — | (−0.70, 2.20, 3.20); (0.45, 0.95, −0.90); 36° | drift +0.12 | Wedge at R1 pats his pocket and leaves right along the wall, behind Mash (back at his desk); boxed 21 above. Camera y ≥ 2.0 so his face clears Spud | 105 |
| S23 | 36.8 | — | (0.30, 1.05, 6.20); (0.00, 0.80, 0.00); 32° | push 14 % in 2.2 s | Sulking at their desks; at 38.0 their eyes meet across Spud; his go left, right, up | 74 |
| S24 | 39.0 | 10 | (0.00, 1.35, 3.00); (0.00, 1.15, −1.00); 38° | push 8 %, shake 0.010 | Four palms on the box; Spud's palms at the sides of his head, eyes shut | 107 |
| S25 | 41.6 | — | (−0.35, 1.25, 0.60); (0.02, 1.38, −1.28); 36°, roll 6° | push 6 % | Screws walk out of the plaster; the number flips | 254 |
| S26 | 43.2 | — | (0.00, 1.50, 3.60); (0.00, 1.05, −0.80); 38° | push 5 %, shake 0.014 | The box tears free and drops; Chip rocks back on the step, Mash staggers out of frame right to R2; "Enough." off screen at 45.3 | 94 |
| S27 | 45.5 | 11 | (0.85, 2.00, 3.40); (0.25, 1.05, −1.00); 46° | push 6 % | Wedge at R1b, one fingertip: the cover swings off; Chip left, Spud below, Mash cut by the right edge; mug on the desk | plate 210 |
| S28 | 48.0 | 12 | (−0.45, 1.40, 1.60); (−0.12, 1.30, −1.25); 44° | push 14 % in 0.5 s, then drift +0.05 | The bare plate, the hanging cover, Chip's face beside it | plate 360 |
| S29 | 49.6 | 12 | (2.10, 1.15, 1.60); (1.62, 0.92, −0.95); 34° | push 15 % in 0.8 s | Mash at R2, ice bag, snow past his head | — |
| S30 | 50.5 | — | (−0.95, 1.30, 1.30); (−0.56, 1.14, −0.98); 34° | drift +0.08 | Chip in hat, scarf and blanket; the plate's left half at the frame's right edge | — |
| S31 | 52.6 | — | (0.35, 1.45, 2.60) to (0.90, 1.45, 2.60); look (0.86, 0.95, −0.95) to (1.50, 1.05, −1.00); 40° | pan 0.9 s from 52.9 | Wedge tips his sunglasses at the window; Mash in the snow stream looks away | — |
| S32 | 54.2 | — | (−1.30, 1.20, 2.20); (−0.15, 0.95, −0.60); 42° | push 6 % to 57.0 | Chip and Spud turned to screen-right, the bare plate above Spud; hold 1.5 s after the last line | plate 200 |

Frame 0 is S01 (frontal, the 19); the film ends on S32 (three-quarter from the left, the bare plate): never the same picture. If 32 is too many, merge S15 into S14, S25 into S24, S29 into S28.

## 8. Build order

- Bench first, one still each, before any staging (all four touch a wall prop near the top of their reach): Chip on the step, left fingertip on UP and the mug at the cover's corner; Mash at R1, right fingertip on DOWN and his palm on the ice bag at y 1.34; Wedge at R1 under `railR` (y 1.09) and at R1b under `coverLow` (y 1.10); the handshake at (0, 1.05, −0.92) with Spud ducked. If any reach fails, lower the thermostat's origin to y 1.30 (not the hold), and re-fit S09 and S19 so Spud's leaf clears its bottom edge.
- A, the story needs it: `thermostat` and every state, `thermobox`, `stepstool` (both heights), `officedesk`, the window's `lift` / `open` / snow view, `deskfan` (both styles), `spaceheater`, the four floor and wall pools, snow spray and flakes, scarf, hat, `icebag` (both parts), blanket.
- B, the panels' look: `paperflurry` and `paperstack`, snow drifts and icicles, plant, frozen cup, monitors and keyboards, `wallnotes`, `manilafolder`, chairs, hat cuff, tartan.
- C, cut first if late: Spud's two side tints, the chair patch, plaster dust in `rip`, the tape roll on the desk, the icicles under Spud's desk.

## Open questions (my default)

1. Stand them, chairs as dressing? Default yes (section 1). Seating costs a new chair that takes `sit`, three seat fits and about 14 changes.
2. Thermostat 0.48 × 0.44, digits 0.165 high? Default yes: it is the sheet's size, and the digit is 50 px in the wides. At a real 0.14 m it would be 15 px.
3. Wedge's pass in front of Mash's desk (S04), not behind Spud? Default yes: the wall lane is full.
4. Mash reads his phone for the sneaky click instead of sipping? Default yes: his own habit, a hold episode 10 proved, no cup at his mouth.
5. The tug tears the lock box off, so the boss pops the cover with no unlock? Default yes: one cause, one finger, 1.5 s saved; the key stays in his pocket.
6. The deal switches everything off on screen (S12) and the peak switches it all back on in one cascade (S19)? Default yes: act 2 needs a quiet room to climb from.
7. No sweat drops, no shiver lines? Default yes, per the standing rule; say if the sheet's drops should win.
8. 32 shots for about 57 s? Default yes (1.8 s a shot); three merges are named under the table.

Outline line to check: v2 has Chip "stretch behind Spud" from his desk for the 22; the thermostat is 1.1 m from his desk mark, so he does it from the step (S13).

## Risks

- Reach: the buttons are at y 1.225. Chip needs the 0.74 step and Wedge works only on the lower edge. The bench above decides the thermostat's height before anything else is staged.
- Wedge is 1.12 tall behind a row of desks and taller bodies: S21, S22 and S27 need the camera at y 1.9 or more, and his face checked in a still for each.
- The handshake is glove on glove above Spud's head: two frames of sink show. If one fix round does not clean it, they each slap a palm on the cover's side instead (no hand contact).
- Four palms on a rocking box for 6 s (S24–S26): the palms must follow `tug`; a 15 fps strip of all of it.
- Chip's mug sits within 0.02 of his eye line: a `held-high` window for S18 only, or drop it.
- Clear plastic over the number: if `thermobox` muddies the LCD in the toon look, cut a 0.36 × 0.22 open window in its front.
- Additive pools tint everything behind them; the two in front of Spud are tuned for frontal cameras only.
- New kinds: 12 (`thermostat`, `thermobox`, `officedesk`, `stepstool`, `officechair`, `deskfan`, `spaceheater`, `paperflurry`, `paperstack`, `icebag`, `manilafolder`, `wallnotes`) and four changed ones (`blindwindow`, `bobblehat`, `huddleblanket`, `snowdrift` turned). `blindwindow` and `huddleblanket` are used by other clips.
- Timing: the shot times are nominal; the lines' measured lengths move them. v2 adds about six lines that `lines.mjs` does not have yet.
