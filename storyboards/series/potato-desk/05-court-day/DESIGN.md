# Potato Desk 05 — Court Day: design

Written by GPT-6.2 Sol (xhigh, Codex CLI on Jonny's PC, 18 Nov 2026, 819 s) from the brief
/mnt/project-files/05-COURT-DAY-mash-ENGINE-BRIEF.md, on Jonny's ask ("ask codex gpt6.2 sol for help with the design").
Copied word for word; the director's build notes are in NOTES.md.

Build for 1080 × 1920 at 30 fps. World axes are +x right, +y up, +z toward camera. Dimensions are W × H × D in metres and positions are mesh centres unless marked as feet, tops or grip points. Use solid 3D geometry, flat toon colours and one-off canvas artwork for lettering and marks. Keep both cameras sharp throughout.

## 1. Courtroom set

| Piece | Geometry, position and finish |
| --- | --- |
| Floor | `checkerfloor`, 3.80 × 0.04 × 6.80 at (0, −0.02, +2.10). Use 0.52 m squares in #949E9D and #A2AAA8, starting at the back-left corner. |
| Back wall | `officewall`, 3.80 × 4.24 × 0.12 at (0, 2.12, −1.36), front at z −1.30. Dado y 0–0.80 #5F7A85, main band y 0.80–2.15 #C3CCD0, upper band y 2.15–4.24 #AAB6BC. Rail 3.80 × 0.055 × 0.028 at (0, 0.80, −1.286), #E6E2D6. Baseboard 3.80 × 0.10 × 0.022 at (0, 0.05, −1.289), #526975. |
| Dado panels | Five 0.65 × 0.53 × 0.010 bevelled boxes at x −1.50, −0.75, 0, +0.75, +1.50, all y 0.43 and z −1.295. Faces #68818B, with 0.012 m wide × 0.003 m deep bevels #506A75. |
| Judge's bench | `woodcounter` at x −0.69, z +0.145. Body 1.08 × 1.12 × 0.73, bottom y 0, #58463B. Cap 1.12 × 0.06 × 0.77, top y **1.18**, #745B49. Deck edges x −1.25/−0.13 and z −0.24/+0.53. Two front boxes 0.46 × 0.64 × 0.008 at x −0.95/−0.43, y 0.51, z +0.514, #624E41, with 0.012 m wide × 0.003 m deep bevels #46382F. |
| Judge's seat | Riser 1.08 × 0.52 × 0.89 at (−0.69, 0.26, −0.665), #596469. `chair` centred on x −0.69, z −0.66, footprint 0.56 × 0.49, seat top y 1.00, back top y 1.39, frame #3B332F, seat #594842. Footrest box 0.52 × 0.34 × 0.20 at (−0.69, 0.69, −0.32), #4C4037, top y 0.86. |
| Nameplate | `officesign`, 0.58 × 0.10 × 0.020 at (−0.50, 1.068, +0.520), #24323F plate and 0.009 m #B08A3C border. Centre **JUDGE VIKING** in #F3EAD2 with 0.043 m caps. The nameplate, raised bench and sound block are the court cues. |
| Floor marks | Defendant bar 0.34 × 0.09 at x +0.16, z +1.10, #D8CCAA. Queue bars 0.24 × 0.06 at (+0.34, +0.02) and (+1.05, −0.81) in (x,z), #B9B697. Two 0.022 m wide #B9B697 strips join the three centres, clipped at the edges of the bars. Use 0.002 m tall paint meshes, centred at y 0.001. |

Set Viking's seated body base to y 1.00, centre x −0.69, z −0.48, and idle eyes near y 1.76. The deck hides 0.18 m of his body and puts his eyes about 0.60 m above Mash's. Leave the deck's right end clear for the bowl.

## 2. SENTENCE board

- Mount a 1.30 × 0.70 × 0.09 box at (+0.66, 2.01, −1.255). Use #24323F on the case, #202C38 on the face and #B08A3C on four 0.023 m border bars inset flush with the front edges. Add four untinted brass screw discs Ø0.015 × 0.005, 0.035 m in from each corner. The face at z −1.21 projects to about x 544–1009 and rows 634–885 in the wide.
- Centre **SENTENCE** at (x +0.66, y 2.205) in #F3EAD2 with 0.107 m caps. Centre **YEARS** at (x +0.90, y 1.875) in the same cream with 0.125 m caps. Use hand-lettered block capitals with 0.015 m minimum strokes. The fixed labels are about 38 px and 45 px high in the master.
- Centre the number bay at (x +0.35, y 1.875), 0.50 × 0.33 m, face #263543. Draw **0**, **3**, **10** and **?** in #FFC65A with 0.245 m glyph height, 0.038 m minimum stroke and a 0.36 m total ink width for **10**. The number is about 88 px high in the master and 29 px at 360 px viewing width. The full states read **0 YEARS**, **3 YEARS**, **10 YEARS** and **? YEARS**.
- Make the bay a split-flap with two backing faces at z −1.19 and a 0.50 × 0.165 × 0.006 leaf hinged along x at y 1.875, z −1.18. Leave a 0.004 m dark seam. Start with the old upper half on the upright leaf and the old lower half visible below. Swing the leaf 180° toward camera and down in 6 frames (0.20 s). The swing exposes the new upper half behind it, then shows the new lower half on its reverse. Match the backing art to the landed state and park the leaf until the next turn. Header and **YEARS** stay still.
- Start with **0 YEARS**. Start the turns at 2.60, 9.50 and 18.50 s on the approved tok, tok and poke beats. For **?**, match the settled ink to a 0.20 × 0.30 × 0.008 dark card on a vertical axle at (+0.35, 1.875, −1.07). Use #263543 on both sides, with a correctly oriented amber question mark on each side. Use Ø0.008 × 0.030 m vertical pins at x +0.35, z −1.07, y 1.711/2.039. Support the pins with #263543 blocks 0.025 × 0.012 × 0.15 at x +0.35, z −1.14, y 1.696/2.054, beyond the flap's sweep. Hide the printed glyph when the card takes over at 18.70 s. Hold front for 0.30 s and turn 360° in 0.70 s, 7 cycles. Hold front at 25.70 s. Hand back to the printed glyph for the 25.80–26.00 s reset turn so **0 YEARS** is settled at the soft tok.

## 3. Viking's judge costume

Take costume heights below from the base of Viking's existing 1.02 m body. Keep the skin #E2A95C, cartoon face, sprout, black stick limbs and existing body silhouette.

- **Robe.** A #202227 shell down to y 0.02 on the body with a 0.79 m hem and 0.018 m stand-off from the belly. Shoulder coverage reaches y 0.71, with a 0.34 m wide front neck opening that drops to y 0.54 behind the beard. Put the closure seam down the centre in #343840, 0.010 m wide, and paint 3 separate 0.10–0.23 m fold strokes in #2C3036. Use one unique canvas for these marks.
- **Sleeves.** Taper from Ø0.18 m at the shoulder to Ø0.09 m at the wrist with a 0.028 m #30343B cuff. Bend the sleeves with the existing arms. End each cuff at the wrist joint and leave the black hands clear to grasp props.
- **Wig.** Off-white #F1EFE4 crown dome, 0.55 × 0.19 × 0.43, centred at body-local (0, 1.00, 0). Add 3 curls per side along the z axis at body-local |x| 0.265/0.284/0.265 and y 0.962/0.870/0.778. Use Ø0.108 m bevelled cylinders, 0.19 m deep, with front discs at local z +0.225 or 0.020 m ahead of the skin if it curves farther forward. Use #D0D0CD sides and paint a separate 1¼-turn #9B9DA1 spiral on each front disc, 0.009 m stroke and 0.038 m outer radius. Each curl reads about 41 px wide in the master. Leave a 0.055 m crown notch for the original sprout and tuck its stem so roughly 0.05 m shows above the cap. Keep the costumed silhouette at or below world y 2.17.
- **Normal pieces.** Helmet offstage. Put the existing belt under the shell at body-local y 0.27, a 0.065 m #5C3B2B band with its buckle hidden. Keep the ginger beard outside the collar, with its two approximately 0.24 × 0.065 m braids in #874B2E, #B46B43 strand accents and #50372B ties. Keep the lip line clear above the beard.

## 4. Props and grips

| Prop | Build and handling |
| --- | --- |
| Axe gavel | Solid wood. Oval tapered #815E45 handle, local y 0–0.29, 0.035 × 0.030 m section. Set the head centre at handle y 0.26. In head-local (x,y), run the outline from (−0.045, −0.044) to (−0.045, +0.044), (+0.037, +0.044), (+0.123, +0.0675), around an arc through (+0.145, 0) to (+0.123, −0.0675), then (+0.037, −0.044) and close. Extrude 0.055 m in #B38758 with a 0.012 m blunt bevel #C39A6E and 3 #8D694C grain strokes. Grip the lower third one-handed with Viking's screen-left hand. Turn the flat poll down onto the block at 2.60 and 9.50 s. |
| Sound block | 0.24 × 0.06 × 0.19 at (−0.96, 1.21, +0.20). Oak top #A37A56, sides #704F3B, bevel 0.008 m. Strike at (−0.96, 1.24, +0.20). Keep the gavel at this end of the desk between beats. |
| Spoon | Reuse `spoon`, length 0.30 m, oval scoop 0.082 × 0.056 m and 0.016 m deep, handle max width 0.021 m. Use #B6C0C5 on top and #88969E underneath. Preset on deck around (−0.62, 1.19, +0.28), handle toward −z. Viking uses the screen-right hand and reaches the scoop to about (−0.35, 1.445, +0.28). At 24.5 s set the scoop on the mound's near flank and the handle across the right rim, with 0.09 m projecting for Mash to take. |
| Chip's 3 fries | Three `fry` props, each 0.039 × 0.24 × 0.035, #ECB348 with #CC8735 sides and a #F5C662 top. One hand at x about 0.26 m to screen-right of Chip's root. Set base offsets in that grip to −0.023/0/+0.023 m and splay −13°/0°/+13° from vertical. Keep all three tips in separate silhouettes. |
| Wedge's chip bag | A closed 0.28 × 0.33 × 0.10 pouch. Bevel and puff the middle to 0.10 m deep, taper to 0.025 m at each end, and add 0.020 m crimp bands in #D2A45D. Face #9A542F with 3 overlapping #F2C873 chip ovals around a #F3EAD2 **CHIPS** label with 0.047 m caps. Paint 4 uneven fold strokes in #784328. One hand under the lower side, centre at y 0.62, x about 0.18 m to screen-right of Wedge's root. |
| Mash's bowl | `soupbowl`, Ø0.41 m × 0.16 m high, foot Ø0.23 m, 0.012 m rounded lip. Outer ceramic #66828C, inside #B9CDD0. Fill to the rim with #F3DBA1 and join to one smooth 0.375 × 0.11 × 0.37 dome above the rim, same colour with #DFC385 on its lower slope. The top is one uninterrupted curved surface. Carry and lift with 2 hands under the near half of the rim. After the bowl is supported, guide the last slide with the nearer hand. On exit put 1 palm under the foot and take the spoon in the other hand. A 0.047 × 0.020 × 0.029 scoop of the same mash rides in the spoon, leaving one shallow scoop impression. |

## 5. Cameras and staging

- **Wide.** Camera (0, 1.45, 10.40), look at (0, 1.45, 0), vertical FOV 26°. Lock it for all wide beats. Reserve rows 0–469 for TikTok's title area. Keep caption glyphs inside x 80–1000 and rows 486–608, including at 0.0 s. The wig tops out near row 667 in the wide, and the board starts near row 634. Bench deck front projects to about row 1074, with idle Viking eyes near row 837.
- **Cut-in only, 22.0 to 24.5 s.** Camera (−0.60, 1.93, 3.55), look at (−0.60, 1.93, +0.10), vertical FOV 24°. Hold Viking's lean with his face centred at x −0.60 and eyes near y 1.74. Put the spoon scoop at (−0.35, 1.63, +0.36) with the handle down and his gaze on the scoop. Approximate master rows are 644 for wig top, 1216 for eyes and 1385 for scoop. Return to the same wide at 24.5 s.
- Standing marks below are foot roots in (x,z), at y 0. Start feet for Viking are (−0.69, −0.32) on the footrest at y 0.86. Keep the existing Chip, Wedge and Mash rigs and clothes. Use 0–15° face turns in the queue and up to 25° at the defendant mark, with eye aim toward the judge. Turn the final pair directly to the lens.

| Script beat (s) | Marks, action clearance and wide framing |
| --- | --- |
| 0.0–4.0 | Chip at defendant mark (+0.16, +1.10), Wedge at (+0.34, +0.02) and Mash at (+1.05, −0.81). Approximate eye pixels (x,row) are Chip (613,1375), Wedge (680,1182), Mash (939,1070). The diagonal puts Mash's face to Wedge's right and Chip's face below both. Chip's raised fry fan is screen-right of his face. At 4.0 keep Mash's giggle on his queue mark with his face turned no more than 10° toward Viking. Viking turns his eyes across without raising his crown. |
| 6.5–9.5 | Chip peels left via (+0.16, +1.54) to side mark (−0.23, +1.72). Wedge goes via (+0.36, +0.57) to the defendant mark by 8.0. Keep Wedge at x ≥ +0.34 until Chip clears x −0.10. Hold the bag below Wedge's mouth at 8.0 and through his 9.5 reaction. |
| 11.5–13.5 | Wedge exits left at z +1.10 to side mark (−0.72, +1.08), behind Chip's depth. Mash comes via (+0.66, +0.45) to the defendant mark by 13.1. Keep Mash at x ≥ +0.58 until Wedge has cleared x −0.22. At 13.5 lift the bowl at x −0.15, z +1.19, bowl base y 0.81. It sits screen-left of Mash's face. |
| 15.5–18.5 | Viking shifts his upper body about +0.09 m in x and +0.18 m in z to lean over the bench. Mash steps to (+0.23, +0.70) at the right corner. At 17.0 take the bowl base via (−0.21, 1.20, +0.76) so it clears the front edge before moving back. Set its foot down at (−0.28, 1.18, +0.40), then slide to (−0.345, 1.18, +0.28). At the high lift the rim's right edge projects near x 538 and Mash's face starts near x 564. Keep the bowl below Viking's mouth. At 18.5 hold the poke over the right deck, clear of the board and both faces. |
| 22.0–26.0 | Use the face insert above. In the returning wide, Mash holds beside the corner while Viking parks the spoon on the bowl at 24.5. At 26.0 Mash retrieves both and walks via (+0.90, +0.57) toward (+1.78, +0.57), taking the spoonful as he goes. Keep the spoon on the camera-right side of his chin until the bite. His route stays to the right of the final pair. |
| 26.0–28.0 | Chip and Wedge stare from their left-side marks. Their eyes project near (427,1407) and (208,1204), clear of one another and Viking. Keep the defendant and queue marks empty. By frame 839 Mash and the bowl are off right. End on that wide with **0 YEARS** and the empty spot, then loop to frame 0 with Chip back on the mark. |

## Open questions

- Add a wall seal? Default is the 0.58 m **JUDGE VIKING** plate as the only court insignia.
- Existing Viking seated face pivot differs? Default is to fit the chair pose to eyes near y 1.76 and crown at or below y 2.17, keeping the 1.18 m deck fixed.
