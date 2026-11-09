# PANELS: faster-than-sound (What if, episode 2)

Next to the generator. Written at the staging proof (docs/rules/workflow.md), before the first line of the generator.
Board: `/mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/01-faster-than-sound-library/storyboard-eight-panels.png`
(4x2 grid, 9:16 panels; `qa/panels.mjs --grid 4x2`). Brief: `/mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md`
(series format `00-SERIES-FORMAT.md`, sheet notes `storyboards/PANEL-NOTES.md`). Jonny said go on 9 Nov 08:08 UTC.

The one test this episode carries (told to Jonny, 9 Nov): **a ticking clock**. In the calm before the boom (11.0-13.5)
the library's longcase clock ticks louder and louder (tick... tick... BOOM). The two late puffs have already told the
viewer a boom is coming, so they wait for it. Read the retention drop at 11-13.5 s against EP01.

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | One camera side all clip: tall arched windows full of daylight on the left 0-0.4 of the frame, the issue desk at the back under the hanging finger-to-lips sign, shelves with a gallery behind it, the rolling ladder at the right (01-04, 06-08). Never the windows behind the desk | partial (9 Nov): one side all clip, desk at the back, ladder right; the left windows come with the daylight plate (builder) | |
| 2 | Bright cool daylight: sky and green trees in the windows, sunbeams slanting from the left, window-pane light patches on a pale tiled floor, faces at full key light. Never the warm dim hall of Too Much Energy 01 | no: stand-in plate and light are warm and dim; daylight plate + cool key are builder work | |
| 3 | Frame 0 (01): Phoenix mid-hop at the front left (eyes 0.20 across), the tower on the table between him and Reaper wobbling, Reaper reading deadpan at the right, the Sorcerer behind the desk with his finger to his lips and the green orb lit at his left; three faces to us | partial: all of it but the hanging sign (builder) | |
| 4 | Reaper's tower: 12-16 books, its top above Reaper's hood (0.50 of the frame in 01), standing until 13.5 and bursting at 13.5 (07) | yes: 15 books, top over Reaper's hood, bursts at 13.5 | |
| 5 | The power's look every trip: an orange flame streak with three fading after-images and loose pages fluttering (02). Never Phoenix's body drawn mid-trip | no: stand-in (a poof); flame streak + after-images are builder work | |
| 6 | 03: Phoenix back with a big red book with a gold emblem held up in both gloves, face to us, grinning; Reaper's page flips and his hood edge lifts with the late puff | partial: book held up, grin, face to us; the page flip and hood lift are too small to read in the long-lens two-shot | |
| 7 | 04: the back shelves full, the empty cart spinning on the floor at the right (0.6-0.8 across), Phoenix posing at the left, the two hanging lamps swinging, the Sorcerer blown sideways | partial: pose, spin, thump lean read; cart and lamps are stand-ins | |
| 8 | 05: a high wide over the reading room: a glowing ring of flame round Reaper's table, two flame after-images on it, papers spiralling up, Reaper in the middle, the desk near the top, 3+ more reading tables with green lamps | partial: ring (stand-in cels), Reaper in the middle, desk top right; after-images, papers, more tables to come | |
| 9 | 06: Phoenix seated beside Reaper at the table, finger to his lips, smug; Reaper and the Sorcerer eyes shut, nodding; nothing moves | yes: seated, finger to lips, smug; both nod with eyes shut; the librarian shows between tower and Reaper | |
| 10 | 07: every book leaves every shelf at once, 100+ books in the air, the sign swings up on its chains, the tower bursts; three faces to us all through it | partial: tower bursts, three faces to us; shelf books and the sign are builder work | |
| 11 | 08: Phoenix and Reaper sitting in a pile of books up to Reaper's hood, a page stuck over half of Reaper's face (one eye showing), the shelves behind bare, the Sorcerer glaring, pages still falling | partial: page over half of Reaper's face (one eye), librarian glaring; the pile, bare shelves and falling pages are builder work | |
| 12 | No drawn reaction marks (the panels' "!" ticks, motion arcs, the sweat drop in 08): act them in faces and bodies | yes | |

## Numbers: read off each panel before any code

Read at 2x off the sheet (each panel 332 x 591 px). Cast ids: `phx` Phoenix, `rea` Reaper, `sor` the Sorcerer.

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.5 | phx | 0.53 | 0.66 | 0.86 | 0.20 | phx, rea, sor | above | |
| 02 | 1.2 | rea | 0.61 | 0.72 | - | 0.80 | rea, sor | above | |
| 03 | 3.0 | phx | 0.48 | 0.60 | - | 0.24 | phx, rea | above | |
| 04 | 6.0 | phx | 0.55 | 0.67 | 0.81 | 0.20 | phx, sor | level | |
| 05 | 9.6 | rea | 0.47 | 0.53 | - | 0.58 | rea | above | |
| 06 | 12.2 | phx | 0.48 | 0.63 | - | 0.33 | phx, rea, sor | level | |
| 07 | 14.0 | rea | 0.57 | 0.65 | - | 0.70 | phx, rea, sor | above | |
| 08 | 17.8 | rea | 0.56 | 0.68 | - | 0.73 | phx, rea, sor | above | |

Other reads per panel (not graded by panelfit, checked on the stills):
- 01/02/03/06: the Sorcerer's eyes 0.39-0.40 down, 0.57-0.66 across; the desk top 0.45; the sign 0.13-0.28 down over him; the orb 0.40 down, 0.79 across.
- 03: Phoenix's body runs on behind the table's near edge (no feet in the panel), so the size is graded on top and eyes.
- 01: the tower 0.51 across, top 0.50; the table's green top across the bottom 0.82-0.95.
- 02: the streak runs from the left edge at 0.62 down to 0.68 across at 0.48 down, its three after-images at 0.35, 0.47 and 0.62 across.
- 04: the cart 0.64-0.83 down, 0.55-0.88 across; the lamps 0.20-0.28 down at 0.45 and 0.85 across; the Sorcerer's eyes 0.44 down, 0.56 across.
- 05: the ring an ellipse across the whole width, 0.37-0.75 down; after-images at (0.12, 0.43) and (0.85, 0.66); the Sorcerer at the desk (0.75, 0.29).
- 07: the sign tilted up 0.10-0.18; Phoenix's eyes 0.64 down, 0.20 across, arms up.
- 08: Phoenix's eyes 0.71 down, 0.24 across, sitting in the books.

## Story chain

- The librarian shushes Phoenix -> his "SHHH!" with a finger to his lips, Phoenix bouncing beside the shaking table -> the front wide (01).
- Phoenix promises to be quiet and is gone -> "I'll be quiet!", "Zoom!", the streak leaving frame, the sound dropping out -> the same wide (02).
- Reaper notices, his tower trembles (the stakes by 1.5 s) -> Reaper's eyes on the empty spot, the tower beside him -> close on Reaper and the tower.
- Phoenix fetched a book from the top shelf -> he is back with a big book the instant the sound returns ("fwip") -> the two-shot (03).
- The rule, planted once: his sound arrives late -> 0.7 s later a puff flips Reaper's page and lifts his hood, Reaper looks at Phoenix -> the two-shot.
- The cart is overloaded and the shelves have gaps -> the Sorcerer points at the cart, the gaps in the back shelves -> the wall wide (04).
- Phoenix shelves the lot -> the streak between the cart and the shelves, then the shelves full and the cart spinning empty -> the wall wide.
- The rule, planted twice and bigger -> the late thump: lamps swing, the Sorcerer blown sideways, the sparrow on the sill flinches -> the wall wide.
- Phoenix wants more: 100 laps -> his grin to camera, "100 laps!" -> a medium on Phoenix.
- 100 laps in silence -> the ring round the reading room, papers spiralling, robes blowing -> the high wide (05), the title card on it.
- He stops dead in his seat, perfectly quiet; everyone relaxes -> "Shhh.", the nods -> the table medium (06).
- The ticking clock: the calm has a fuse -> the longcase clock's pendulum and face, its tick louder each time, a low rumble under it -> an insert on the clock, then back on the three.
- All the sound he outran arrives at once -> BOOM: the shockwave, every book off every shelf, the tower bursting, the sign swinging up -> the wide (07).
- The aftermath -> Reaper surfacing buried to his hood with a page on his face, Phoenix sheepish "...sorry.", the Sorcerer's glare, bare shelves -> the medium-wide (08).

Payoff faces (13.5 to the end): Phoenix, Reaper and the Sorcerer keep their faces to us (0-30 degrees off camera)
through the blast and the aftermath; nobody turns. The page on Reaper's face covers his left half only.

## Departures (and why)

- **A longcase clock** stands against the back wall left of the desk (not in the panels): the ticking-clock test needs a
  clock the viewer sees before they hear it tick. It sits where panel 01 has the small cart, below the windows' sill line,
  clear of every face.
- **Panel 02 is graded at 1.2 s**, not 1.0: the streak leaves at 0.9-1.0; at 1.2 the after-images trail behind it.
- **Panel 05 is graded at 9.6 s**: the title card covers 10.0-11.0.
- **The tower is about 0.75 m** (15 books), as the panels draw it, not the brief's 2 m.
- **Panel 01 Phoenix at 89 % of the panel's size**: the front wide also has to hold Reaper's tower and the desk; panelfit partial, accepted.
- **Panel 04 from above (+2.3 m) and 123 % size**: no level camera sees Phoenix in front of the desk past the reading table, so the wall shot looks down from over the table (Reaper just under the frame).
- **Panel 06 0.44 m above the eyes**: just high enough that the librarian shows over the table between the tower and Reaper.
- **The after-images are drawn flame silhouettes**, not copies of Phoenix's body: the engine draws one of each character.
