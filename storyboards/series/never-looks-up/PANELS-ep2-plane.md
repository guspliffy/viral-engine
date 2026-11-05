# Never Looks Up, episode 2: Turbulence — Jonny's eight panels

Board: `/mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip` → `02-plane-turbulence/storyboard-eight-panels.png` (4 x 2, read the
top row then the bottom). Brief: `video-scripts/2026-11-04-never-looks-up/02-plane-turbulence-ENGINE-PROMPT.md`.
The panels are the target (CLAUDE.md "Writing clips"). Generator: `make-ep2-plane.mjs`.

World: x right, z toward the camera (the plane's nose). The camera sits in the row in front, looking back at the row
from the front-left. Set: a painted plate of the cabin (`assets/plates/storm-cabin.png`, painted by the env painter,
`assets/environments/storm-cabin/spec.json`) behind a real 3D row: three seats with lap belts, the left wall with its
oval windows (lightning lights the panes), the overhead bins and passenger panel with the seatbelt sign (an icon, no
words) and the mask doors. Light: warm dim cabin light, cool blue lightning flashes, the phone glow on Phoenix.

| Panel | Time | Camera | Who is where, what they face | Light, details |
|---|---|---|---|---|
| 01 | 0-1.5 | wide, eye level, front-left | Phoenix in the window seat (left), on his phone. Wizard in the middle, yelping, the juice jumping out of his cup. Reaper on the aisle, calm, tea. Samurai standing in the aisle behind Reaper's shoulder with a level tray (juice, cup). | Lightning in the window, seatbelt sign lit, warm ceiling lights. |
| 02 | 1.5-3.2 | same wide | Wizard grabs Phoenix's arm and yells; Phoenix scrolling, unbothered; Reaper side-eye. | Lightning. |
| 03 | 3.2-5 | medium-wide | Masks down on their hoses. Wizard's mask over his hat, belt open. Reaper's mask on, calm. Phoenix's phone hangs from his mask, he scrolls. | Belt hanging open on the Wizard's seat. |
| 04 | 5-6.3 | medium-wide | Zero-g: Wizard floating up, tangled in his hose; Reaper's tea a floating blob over his cup; a pillow and a magazine float; Samurai horizontal, tray level. | |
| 05 | 6.3-7 | medium | Wizard upside down in front of the row; tea blob; Samurai still horizontal. | |
| 06 | 7-8 | medium close | PEAK: the upside-down Wizard's face right by the hanging phone. | |
| 07 | 8-9 | the series' LOOK-UP framing | Phoenix's eyes up at the Wizard, "huh." in the lower third. | |
| 08 | 9-10 | wide | Back in the seats: Wizard glaring through his mask, Reaper sipping, Samurai on his feet with the tray level, Phoenix scrolling. | Hard cut at 10.0. |

## Departures (with reasons)

- **The set:** the brief asks for the layered env system first. It is built for outdoor places (a painted sky, ground
  and objects cut into layers), so this uses the brief's fallback: a painted plate behind a real 3D foreground row, as
  Bonfire Night did. The painting looks forward down the aisle (seat backs); behind the row only its ceiling, bins,
  windows and far seats show.
- **Phoenix's mask (03-08):** the panels put the mask over his mouth as well as the phone on its hose. He keeps his
  face clear for the series' "huh." and the phone hangs right under the mask cup, as the brief says.
- **The Samurai's attendant vest:** a new costume is a new drawing (Jonny's call), so he wears his own look with the
  katana put away (`busy/samurai-worker`), tray in both gloves.
- **Reaper's tea:** a white china mug (`teamug`), which the grip library holds; the teacup and saucer have no grip yet.
- **The Samurai's height:** a standing potato is shorter than one in a seat, so he stands beside Reaper's shoulder in
  the aisle, not above the row. In the zero-g (04-05) he floats up upright behind Reaper's shoulder, tray level,
  instead of lying flat along the aisle: flat, his body went through the aisle seat and Reaper.
- **The Wizard's mask (03):** held to his ear instead of pulled over the hat: an arm reaching over the brim goes
  through it. He clamps it over his mouth when he lands (08).
- **Phoenix's phone (03-08):** hung on the mask's elastic at chest height, the mask cup beside it, so his face stays
  clear; he scrolls with one finger. The hoses run beside the faces, not across them.
- **The seats:** 1.06 m apart, wider than real seats, because a seated potato is wider than a seat; the row in front
  is lowered so it doesn't cover the faces.
- **The peak (06-07):** the Wizard floats upside down beside Phoenix, a little in front of him, not straight over the
  phone, so both faces read in one frame at the LOOK-UP.
- **Music:** there is no bossa style in `puppet/beat.mjs`; it uses the soft "warm" style at 96 bpm, and no tape
  warble on the bumps (the engine has none).
- **The landing hit-stop** sits on the frame they land (9.42), not 9.25: a drop from upside down to the seat in
  0.05 s would pop.
- **Gibberish gets captions** (Jonny, 4 Nov), placed clear of faces and below the top 20 % kept free for his in-app
  title.
- **The window (01-02, 08):** a 9:16 frame can't hold the window, the three seats and the Samurai in the aisle at
  once; the window stays just off the left edge and the lightning flashes the whole picture instead.
- **The phone (all):** a bright cyan case and a lit screen whose glow washes Phoenix's face (Jonny, 5 Nov: the phone
  must read). The same phone setting as episode 5.
- **"huh." (07):** over Phoenix's head, not in the lower third: at the LOOK-UP the lower third is all bodies (Phoenix,
  the Wizard's hat and robe), and a caption over a character fails the check.
- **The landing (08):** the Wizard flips back upright facing the row behind and spins round in his seat to glare:
  flipping the other way swings his hat through Phoenix.

## v2 (Jonny 5 Nov: more drama, phone always in hand)

- The phone stays in both of Phoenix's gloves for the whole clip (no hang on the mask's elastic); his mask drops on the
  window side and dangles there, ignored.
- More is going on than in the panels: the bins burst one by one and drop a holdall, a backpack and two suitcases. In the zero-g
  they float with a trainer, magazines and pillows, and they crash back down on the landing. Reaper and the Samurai panic.
