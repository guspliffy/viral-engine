# Potato Desk 11 — the fries carton (`friescarton`) and the loose fry: design

Creative director, 20 Nov 2026. Target look: `/mnt/project-files/videos/potato-desk/11-court-day-new/sheets/kid-dad-sheet-1.png`, panels 01–04 (empty, Chip) and 10–12 (full, Wedge hands it to Chip; the judge lifts one fry out in 12). Jonny's choice: plain fries, not alive, no faces. No lettering and no mark anywhere. Sizes are computed, not rendered.

## 1. Shape and size (metres, outer sizes)

Origin: the middle of the underside of the base. +y up. The low scooped FRONT panel faces −z, the tall BACK panel faces +z. The holder always stands on the +z side (the grip library's hold frame), so the scoop and the inside face whoever he faces.

| Part | Numbers |
| --- | --- |
| Base, y 0 | 0.17 wide (x) × 0.07 deep (z), bottom edge radius 0.012. It stands by itself. |
| Top at the two side seams, y 0.24 | 0.28 wide × 0.11 deep. Straight flare from the base: half-width 0.085 → 0.14, half-depth 0.035 → 0.055. |
| Cross-section | A stadium at every height: flat front and back panels, half-round ends. |
| Back panel's top edge | Shallow arch: 0.24 at the seams, 0.26 at x 0. |
| Front panel's top edge | U-shaped scoop: 0.24 at the seams, 0.18 at x 0, within 0.005 of 0.18 for x −0.05..+0.05. |
| Wall and floor | Wall 0.004 with a real outer and inner surface; inside floor at y 0.010. |

Against the cast: half of Chip's width (0.57); with its base at y 0.10 the back rim is at 0.36, 0.11 under his eyes (0.47), as panel 01 draws it (base just over his shoes). A third of Wedge's width (0.88): behind the broad upper half of his back with its base at y 0.45 or higher, the full carton (0.42 high, 0.30 across the fan) stays 0.25 under his crown and 0.29 inside each flank. In the series wide (400 px per metre): 112 × 104 px empty, 168 px high when full; 37 px wide on a 360 px phone.

## 2. Colours and material

| Surface | Colour |
| --- | --- |
| Outside, front and back panels | `#e3261d` |
| Outside, the two round ends / the underside | `#c41e1b` / `#a81a18` |
| Cut paper edge all along the rim, 0.005 wide | `#f6ead2` |
| Inside walls / inside below y 0.10 / inside floor | `#ead9b8` / `#c9b08a` / `#b89c72` |
| Inside fold line at each seam, 0.003 wide | `#b89c72` |

Matte paper, roughness 0.85. One flat colour per surface: the two reds carry the form, no gradient, no texture. No pencil hatching on any surface (`noHatch`, as `fryfan`). Keep the ink line on the outer silhouette and the rim. Every fry is its own shape so each gets its own ink line.

## 3. Two states (`spec.fill`, fixed per carton: Chip's is "empty", Wedge's is "full"; never tweened)

**empty.** Nothing above the rim. From the front the cream inside of the back panel shows over the scoop, 0.08 high at x 0 and closing to 0 at the seams: this is what says "empty". On it, two grease blots `#cdb07c`, each drawn once: 0.034 × 0.024 at (x −0.045, y 0.215) and 0.022 × 0.018 at (x +0.06, y 0.20). Three crumbs 0.010 × 0.006 × 0.007 (two `#ecb348`, one `#cc8735`) wedged in the floor seam at x, z (−0.05, +0.012), (+0.02, −0.015), (+0.06, +0.018); they stay put when it is turned over (panel 04). Cut the crumbs first if they read as a glitch.

**full.** 10 fixed fries and one slot for the loose fry. Every fry is one `fryfan` fry: 0.039 (x) × 0.24 × 0.035 (z), bevel 0.004, `#ecb348` broad faces, `#cc8735` sides, `#f5c662` top. Each passes through its x at the rim line (y 0.24), leans outward (tip away from x 0) by its angle and ends at its tip height. Cut every fixed fry off below y 0.13 (hidden). A bed fills the inside up to y 0.17 in `#cc8735`, so the gaps show fries, not paper.

| Row | x at the rim line | Lean outward | Tip y |
| --- | --- | --- | --- |
| Back, z +0.020, each also 3° toward +z | −0.1075, −0.0645, **−0.0215 (loose)**, +0.0215, +0.0645, +0.1075 | 14°, 5°, **0°**, 2°, 8°, 15° | 0.325, 0.340, **0.420**, 0.335, 0.365, 0.320 |
| Front, z −0.018, each also 6° toward −z | −0.092, −0.046, 0, +0.046, +0.092 | 12°, 4°, 1°, 6°, 13° | 0.290, 0.315, 0.300, 0.320, 0.285 |

Result: tips span x −0.15..+0.15 (0.01 past the rim each side), 0.045–0.125 above the seams, no two tips level, no fry crossing another above the rim.

## 4. The loose fry (the judge's, panel 12)

A separate prop showing one fry alone: the same build, 0.039 × 0.24 × 0.035, origin its bottom centre, standing along +y. Its slot in the carton's frame: base at (−0.0215, 0.18, +0.020), upright, tip at y 0.42. That is 0.08 above both neighbours (0.340, 0.335), so a mitten closes on its top 0.07 without touching another fry, and it lifts straight up. Hold: the thin pinch at 0.85 of its length (y 0.204 on the fry), size `{ len: 0.24, r: 0.018 }`; 0.17 of fry hangs below the hand, as drawn.

Carton state `taken` 0 or 1 (it steps): at 0 the carton draws this fry in the slot itself, so it rides every move of the carton; at 1 the slot is empty. On the frame the judge's pinch closes, set `taken` 1 and show the separate fry in the same pose. Optional on the loose fry, `bite` 0 or 1: the bottom 0.09 gone, cut face `#f8dc8c`.

## 5. Holds

| Who | Hold | Numbers |
| --- | --- | --- |
| Chip, both hands (panels 01, 03, 04, 11, 12) | Box hold: palms flat on the two round ends. Unchanged through the 180° tip of panel 04. | y 0.10, where the carton is 0.216 wide and 0.087 deep. |
| Wedge, one hand (hidden, then panel 10); Chip, one hand held high (panel 02) | Mug hold round one end, low. | Fist at y 0.06, where the half-width is 0.099. |

Size entry `{ w: 0.216, h: 0.182, d: 0.087, r: 0.099 }`: the box hold's default height (0.55 × 0.182) lands on y 0.10; the mug hold needs `{ height: 0.33 }` for y 0.06. Glove gap about 0.03 for Chip (hands 1.1) and 0.038 for Wedge (1.3); the library's defaults are for 1.7 gloves. The prop's own `grip`: 0.10. Hand-over in panel 10: Wedge keeps one end, Chip takes the other end, then both.

## 6. Changed from the sheet (reason)

1. One size, 0.28 × 0.26. The sheet draws about 0.30 wide in panels 01 and 03 and about 0.37 in 11 and 12; at 0.28 the back rim clears Chip's mouth at chest height.
2. Inside cream `#ead9b8`, not the drawn kraft tan (about `#c8a57d`): the tan sits between Chip's skin `#e2a95c` and the fries' `#cc8735`, and the hollow is 37 px wide on a phone.
3. A cream rim edge and a cleaner red than Wedge's jacket `#c34732`: the scoop has to read when the carton crosses his jacket in panel 10.
4. 11 thick fries (0.039) instead of about 12 thin ones: it is the Court Day fry, 16 px wide in the wide.
5. One fry stands 0.055 above the next tallest (the drawn bunch is even): the pinch needs the room, and it shows which fry is going.
6. The front is the low panel, as on the sheet and a real carton. The task note's "lower back" would hide the hollow from the lens.

## Open questions (my default) and risks

- Mark on the front? Default none, as drawn: a yellow mark on a red carton reads as a real brand.
- Gold fries in front of Chip's hoodie `#ffcf2e` (panels 11, 12) separate by ink line only: check it on the phone sheet.
- A thin open shell under the outline pass: if the rim line breaks, the cream rim edge carries the scoop alone.
