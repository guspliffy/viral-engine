# Potato Desk 08 — His suitcase fit too well: design

Creative director (Fable 5.2), 18 Nov 2026, from `suitcase-panels-v3.png` (P1–P12) and BEATS.md; replaces 07-suitcase/PROP-DESIGN.md. Metres: x right, y up, z toward camera, floor y 0; (x, z) pairs are foot roots. Rows and columns (1080 × 1920) are hand-projected: confirm with `qa/camfit.mjs`. New kinds go in one file, `props-gate.js`.

## 1. Gate set (P1)

| Piece | Build |
|---|---|
| Carpet | reuse `courtfloor`: 5.6 × 6.0, centre z −0.2, tile 0.50, `#46629E` / `#415C96` |
| Wall, left | reuse `officewall`: x −2.80..+0.05, z −3.00, h 3.30, all bands `#CFCBC2`, rails `#C2BEB5` |
| Window, door, ceiling | NEW `gatehall`. Window x +0.05..+1.28, y 0.35..2.85, bars 0.06 `#5B6470` every 0.41 and at y 1.80. Jet-bridge door x +1.38..+2.18, 2.10 high, casing `#5B6470`, corridor `#2E3238`. Ceiling y 3.30 `#E6E3DC`, 4 downlights r 0.11 `#FFF4D6` (x −1.0 / +0.6, z −1.9 / +0.2). Apron `#A9B0B3` to z −420, hangar strip 5 high `#8C99A2` |
| Far view | reuse `airliner` + `biminisky`, NEW `jetgear`. Daylight, as drawn. Jet centre x +22.5, z −150, belly y 1.5, nose toward −x, `lit` 0 (nose column 620, rows 660–740). Nose gear x +9: strut 1.5 `#C9CDD2`, 2 wheels r 0.45 `#24262B` |
| Desk | reuse `woodcounter`: x −1.95..−0.65, z −1.05..−0.60, top **0.60**, body `#C9CDD2`, top `#E8EAEC`. Mash shows y 0.60..1.48, rows 894–1250 |
| Monitor | NEW `flatmonitor`: 0.28 × 0.20 × 0.03 `#23262B`, neck 0.10, at (−0.80, 0.60, −0.85), back to camera |
| Board | NEW `gateboard`: 1.42 × 0.79 × 0.09, centre (−0.75, 1.925, −2.955): rows 610–861, columns 78–528. Case `#2B2F36`, face `#14161A`, amber LED `#FFB52E`: GATE 7 cap 0.085, GATE CLOSES 0.12, time 0.24. States 3:00, 2:00, 1:30, 1:00, then FINAL CALL alone under GATE 7, cap 0.16, `#FF3B30`, pulsing 100 / 55 % at 1 Hz. `flip` as on `sentenceboard`; a change refreshes the rows top-down in 4 frames |
| Cast | Agent: Mash + reuse `policecap`, `badge` false. Queue: `rosti`'s plain look × 3, shirts `#6E7350`, `#7A5F4A`, `#6A6E78`, body heights 0.92 (Q1), 1.02, 0.84. Reuse `stanchions`: posts (+1.42, −1.30), (+1.42, −2.80) |

## 2. Props

**`bagsizer` (NEW, one unit; P2, P3, P7).** Local z = plate side. Origin = grip centre (jammed, handle up): soles y −0.99, unit axis z +0.11. Heights above the soles:
- Frame 0.60 × 0.62 × 0.40 (y 0.03..0.65): tubes Ø 0.045 `#D92B2B`, shade `#A81E1E`; 4 posts, 2 rings, mid bars y 0.34 on sides and back, front open. Feet Ø 0.05 × 0.03 `#1E1E22`. Hazard sleeve 0.50 × 0.05 on the front bottom rail, `#F2C230` / `#1E1E22`.
- Plate on the front top rail (y 0.64..0.90): 0.60 × 0.26 × 0.012, leaning back 8°, `#F7F1E3`, both faces printed `#1F2A44`: BAG CHECK cap 0.078, IF IT FITS, IT FLIES cap 0.048.
- Bag (`suitcase` recipe × 1.45): 0.52 × 0.66 × 0.32 (y 0.05..0.71), `#1FA6A0`, ribs and zip band `#157F7A`; handle tubes Ø 0.014 `#C9CDD2`, grip 0.18 × 0.035 `#26242B`. Sticker Ø 0.15 `#F5C518` with shades `#57463A` at y 0.36. Tag 0.07 × 0.10 `#F2E6C8`, W cap 0.055, over the front top rail at x +0.19.
- Jam: pillows +0.03 front, +0.04 above and below each side bar, 0.06 muffin top.
- `insert` 0..1: at 0 the bag is 0.48 higher, tilted 14°, no pillows (they grow over 0.75..1). `handle` 0..1: grip 0.04 + 0.24 × handle above the bag. Grip = origin + (0, 0.48 × (1 − insert) − 0.24 × (1 − handle), 0). Roll about z through the origin; negative = top toward +x.

**Marks (P11):** reuse `floormarks`, strip 0: four 0.12 squares `#26386A` at x −0.52 / +0.02, z −0.42 / −0.08.
**Backpack (P11, P12):** reuse `backpack` × 0.53 (0.16 × 0.20 × 0.10), `#4E79A7`, trim `#2F4257`, on Chip's back, centre y 0.34; 64 px wide in the wide.
**`tapemeasure` (NEW, P12):** case 0.065 × 0.065 × 0.032 `#F2C230`, button `#1E1E22`, blade 0.019 `#F7E06A`, ticks every 0.01; `pull` 0..1 = 0..0.30 along +y.
**`sunglasses` (NEW, P5):** Wedge's worn `shades` loose: 0.27 wide, lens `#57463A`, frame `#2B1B0F`. Physics from (0.30, 1.20, −0.55) at 15.5 s; worn pair hidden 15.5–18.4.

## 3. Cameras and marks

- **Wide, P1–P11, locked:** pos (0, 1.94, 7.0), look (0, 1.43, 0), fov 34. At z 0: 441 px/m, x ±1.22, floor row 1589. Back wall: 310 px/m, floor row 1335. Captions rows 486–608.
- **Close-up, P12:** pos (−0.43, 1.37, 3.75), look (−0.43, 0.95, −1.05), fov 28, 800 px/m. Agent's eyes row 840, backpack rows 1368–1528, desk bottom-left, FINAL CALL rows 386–479.
- **Marks.** Agent A0 (−1.10, −1.50), A12 (−0.80, −1.50). Wedge W0 (+0.30, −0.78), W5 (+0.30, −0.70), W7 (+0.62, −0.10). Chip C0 (+0.94, −0.30) = queue mark, C5 (−0.80, +0.30), C7 (−0.48, +0.25), C11 (−0.25, −1.10). Queue Q1 (+0.85, −1.45), Q2 (+0.62, −2.10), Q3 (+1.12, −2.55). Unit centre HOME (−0.25, −0.25), T1 (+0.02, +0.05). Exit X1 (+1.30, −0.55), X2 (+1.85, −1.60), door (+1.85, −3.00); out of frame past x +1.3.

## 4. Staging

Blank = as the row above. u = the unit's x in the tug.

| P (s), board | Wedge | Chip, queue | Agent | Unit |
|---|---|---|---|---|
| 1 (0.0) 3:00 | W0, turned 35° to the unit, both hands pushing the grip down | C0; Q1–Q3 | A0, pointing at the unit | HOME, `insert` 0.35 to 1 by 2.6 |
| 2 (3.0) | to camera, arms wide | | arm down | pillows full |
| 3 (6.5) | one hand on the grip, two from 8.0 | | | rocks ±2° |
| 4 (10.0) 2:00 | foot on the front bottom rail, heave 11.0 | arms up; 12.8–13.8 Chip runs round the front to C5 | | centre (−0.15, −0.40), soles y 0.30, roll −15° |
| 5 (14.0) 1:30 at 16.5 | W5, hands on the ring ends, y 1.36; shades fall 15.5 | C5 | | origin (+0.30, 1.02, −0.81), roll 180°, `handle` 0.2; soles y 2.01, row 702; 4 shakes ±0.06 |
| 6 (18.5) 1:00 at 21.0 | (u + 0.60, −0.10), on the grip, leaning back 25°; shades back on | Chip (u − 0.50, +0.25), Q1 (u − 0.62, −0.25), on the left posts | | centre (u, +0.05), roll −12°; u −0.30 to +0.02, 19.5–22.0 |
| 7 (23.0) | W7 | C7; Q1 walks back | tilt 15° over the desk | T1, upright |
| 8 (27.5) FINAL CALL at 28.5 | points at (+0.02, 0.72, +0.26) by 29.0 | | | |
| 9 (31.0) | | | tilt 18°, eyes on the plate to 33.0, upright, waves toward +x 33.8 | |
| 10 (34.5) | hugs the unit, W7 to X1 to X2, gone by 37.0 | | to A12 | 0.30 ahead of Wedge, soles y 0.30, roll −8° |
| 11 (38.0) | | C7 to C11 by 38.9, to camera; eyes on the marks 39.0, on the agent 39.8 | | gone; four marks, rows 1535–1586 |
| 12 (40.5) | | yaw 120°, pack toward camera-left | tilt 18° toward Chip; tape case at (−0.59, 0.24, −0.87), `pull` 0 to 0.8, 40.9–42.5 | |

## Open questions (default)

1. DECIDED by the director (18 Nov): slogan on two lines "IF IT FITS" / "IT FLIES" at cap 0.085 (~37 px on the master), BAG CHECK above as a 0.045 header; the plate grows to 0.34 tall (y 0.64..0.98). The turn (P8) must read on a phone.
2. Board under the caption band (court day's order); the sheet draws it at rows 130–490. Default: under.
3. Window: 3D jet in daylight as drawn. `airport-apron-sunrise` (orange sunrise, jet at three-quarters) changes the time of day: fallback only.
