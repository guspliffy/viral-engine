# PANELS: read-minds (There's a catch, episode 6)

Next to the generator. Jonny's panels are the target, and this file is how the clip is held to them by line and by
number, not from memory.
Board: board.png here (4x3 grid, 9:16 panels; `qa/panels.mjs --grid 4x3`), Jonny's go 12 Nov 2026 11:28 Berlin.
Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/06-read-minds-V2-POKER-12-PANEL-IMAGE-PROMPT.md (v3 CASINO).
Opener type A (contest running at frame 0): Wedge is already shoving his chips into the pot.
Not to copy from the sheet (image-model slips): dark-suited human guests in 02/03 (all guests are potatoes), panel 05
numbered "03", bubble tails (bubbles float free), Wedge drawn no bigger than Spud (Wedge 0.98 m, Spud 0.88 m), two aces
of hearts in 11 (four different aces).

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | Frame 0 (01): the four at the green oval table under a brass lamp in a red-and-gold casino; Wedge shoves two tall stacks into the pot, Spud with his cards to his chest, Chip cheering, Mash on his phone; slots, roulette, chandelier behind | | |
| 2 | The stare (02): Wedge smug, "Trust me."; Spud sweating, gulps, his cards in his gloves | | |
| 3 | The read (03): Spud's eyes glow blue-white; a soap bubble over Wedge's head with a 2 and a 7 inside; Wedge still grins | | |
| 4 | The call (04): Spud slaps his two cards face up and rakes the pot; Chip cheers, Wedge's jaw drops | | |
| 5 | Every head (05): a bubble over Wedge (2-7), Chip (pizza), Mash (phone); Spud grins behind his stacks, eyes still glowing | | |
| 6 | The mountain (06): over the others' backs at Spud, arms up, a chip mountain towering over him under the chandelier | | |
| 7 | The spread (07): Spud alone, face to us, smile gone, one glove at his temple; a bubble with a thing in it over every guest behind him, more popping in | | |
| 8 | The city (08): night, neon city round the casino's gold dome; a glowing bubble over every roof, thousands | | |
| 9 | The flood (09): the casino crammed wall to wall with bubbles; Spud's gloves on his head, eyes squeezed, "Too loud!"; the others stare | | |
| 10 | The keys (10): Wedge slams his car keys on the felt, "Car keys. All in."; Spud on his feet swatting through hundreds of bubbles, can't find Wedge's, pushes the mountain in | | |
| 11 | Four aces (11): Wedge fans four different aces at us, sweeps the mountain to his side; Spud slumps, empty | | |
| 12 | The end (12): night, hotel room high above the neon city; Spud awake in bed, pillow pressed on his head, eyes open; the thoughts stream in through the window; "Would you still want it?" | | |
| 13 | Every guest is a potato (no humans); Spud's eyes glow from 03 to the last frame; the bubbles are round soap bubbles with one small object inside, no text | | |

## Numbers: read off each panel before any code

At = seconds in `read-minds-no-vo`. Filled from `qa/panelfit.mjs` after the staging proof.

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.3 | wdg | | | | | wdg, spud, chip, mash | above | all four in an arc on the far side, Chip small at the front left (a tall frame is narrow) |
| 02 | 1.7 / 2.4 | wdg, spud | | | | | wdg, spud / spud | level | the two-shot, then a close single on Spud's gulp |
| 03 | 3.1 / 3.8 | spud, wdg | | | | | spud / wdg | level | the reveal is Spud's point of view on Wedge and his bubble |
| 04 | 4.8 | spud | | | | | spud, wdg, chip | level | |
| 05 | 6.6 | spud | | | | | all four | above | |
| 06 | 8.2 | spud | | | | | spud | below | low and close on Spud instead of over three backs: the tower stands beside him on the felt |
| 07 | 10.0 | spud | | | | | spud | level | |
| 08 | 12.0 | city | | | | | - | above | |
| 09 | 13.4 | spud | | | | | spud | level | |
| 10 | 15.0 | wdg | | | | | wdg, spud | level | Spud swats the bubbles from his chair, not standing (standing put him into the table); Wedge beside him, not in front |
| 11 | 17.0 | wdg | | | | | wdg, spud | level | |
| 12 | 19.0 | spud | | | | | spud | level | Spud sits up in bed with the pillow pressed on his head, not lying under the blanket (a lying rig pose is not built) |
