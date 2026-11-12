# PANELS: zombies (Survive it, "How to survive a zombie apocalypse", version B)

Next to the generator. Jonny's panels are the target ("i like zombie b- the extreme version. create the video",
11 Nov 2026 22:59 Berlin); his rule from the rejected lift draft: the video must match the panels shot for shot.
Board: storyboards/series/survive-it/04-zombies/panels-sheet.png (6x2 grid, 9:16 panels; `qa/panels.mjs --grid 6x2`).
Brief: /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-CHAIN-OUTLINE.md (Version B).

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | 01: the splintered door stands at the frame's LEFT edge, a grey-green arm through the broken plank holds the Samurai (front, centre); Spud at the right front pushes a brown sofa (its back to us); three faces peer over the sofa | yes | |
| 2 | 02: the camera is above and behind the group and looks DOWN the street: Spud at the railing (left, a finger on his lips), three backs or hats along the bottom, the street packed wall to wall, a police car with its lights on in the upper half | yes | |
| 3 | 03: the cistern is in the front with its lid lifted by Spud (left), the Samurai (right) dips a glass, three wait in a doorway BEHIND with empty glasses, candlelight | yes | |
| 4 | 04: on the balcony, the Gunslinger big in the left foreground (hands on his belt, eyes half shut), Phoenix waiting behind him with eyes closed, Spud at the right looking up, a blanket on a line top left, the city beyond | partial | |
| 5 | 05: candle and open tin on the floor in the front, all five sit in a half circle behind them (faces to us), the barricade (wardrobe and sofa) against the door behind them | yes | |
| 6 | 06: Phoenix close in the right foreground, eyes wide, hands on his belly; four BACKS against the wardrobe behind him; the door's pane full of silhouettes | partial | |
| 7 | 07: steep high angle, the ladder a diagonal from the balcony (upper left, three hold its end) to the roof (lower right), two crawl on it head first, the street full of zombies under them, never a level side view | yes | |
| 8 | 08: both low at the big sack in the shop, the Gunslinger left with a tin, Spud right with ONE tin and a raised flat hand, the window full of zombie backs behind them | yes | |
| 9 | 09: the Gunslinger crawls TOWARD us in front, the huge sack on his back, Spud behind him, a tin falling under the ladder, the street far below | partial | |
| 10 | 10: straight down: the police car in the middle with its lights on, hundreds of zombies round it with faces and arms up, ladder and boots at the bottom edge | partial | |
| 11 | 11: the ladder hangs in a V, Spud lies on it at the top centre holding the Gunslinger's raised hand, the Gunslinger hangs under him with the sack in his other hand, the street far below | yes | |
| 12 | 12: dawn on the roof, the five sit together with one open tin, the broken ladder half lies by them, zombies on two balconies of the old house across the street | yes | |
| 13 | The cast keeps its usual colours in every shot; nothing absurd happens (no magic, no impossible physics) | yes | |

## Numbers: read off each panel before any code

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.6 | sam | 0.42 | 0.52 | 0.85 | 0.45 | sam, wiz, phx, gun | above | |
| 02 | 3.6 | spud | 0.24 | 0.38 | - | 0.28 | spud | above | |
| 03 | 5.9 | spud | 0.27 | 0.38 | - | 0.32 | spud, sam, wiz, gun | above | |
| 04 | 7.5 | gun | 0.30 | 0.47 | 0.98 | 0.20 | gun, phx, spud | level | |
| 05 | 9.3 | wiz | 0.28 | 0.44 | 0.62 | 0.50 | spud, wiz, sam, phx, gun | above | |
| 06 | 12.0 | phx | 0.50 | 0.68 | 1 | 0.75 | phx | level | |
| 07 | 13.8 | gun | 0.31 | - | 0.45 | 0.65 | - | above | |
| 08 | 15.8 | gun | 0.36 | 0.50 | 0.85 | 0.30 | gun, spud | level | |
| 09 | 17.5 | gun | 0.15 | 0.30 | 0.50 | 0.30 | gun, spud | above | |
| 10 | 19.9 | gun | - | - | - | - | - | above | no face in this panel: the street seen straight down |
| 11 | 21.3 | gun | 0.35 | 0.44 | 0.70 | 0.40 | gun, spud | above | |
| 12 | 26.5 | spud | 0.52 | 0.60 | 0.80 | 0.30 | spud, wiz, sam, phx, gun | above | |

## Story chain

1. Zombies force the flat door, an arm has the Samurai -> the arm, the hands in the gap, Spud and the sofa -> P01.
2. A police siren starts in the street, SO the zombies let go and leave: they follow sound -> the street flowing to the flashing car -> P02.
3. Locked in, SO day 3 the taps are dry: the last water is in the toilet cistern -> lid off, a glass dipped -> P03.
4. No water, SO no toilet either: a queue on the balcony -> the Gunslinger, "Nobody talks about this." -> P04.
5. Day 5 the food is down to one tin for five -> candle, tin, five tired faces, the barricade -> P05.
6. Hunger, SO a stomach growls; they follow sound, SO the door fills with silhouettes: "It won't hold." -> P06.
7. Staying is over, SO a ladder from the balcony to the shop roof, five floors over the horde -> P07.
8. The shop is full of tins, SO the Gunslinger takes far too many: "It's free!" -> P08.
9. The sack is too heavy on the way back, SO a tin slips out -> P09.
10. The tin hits the police car, its siren starts, SO every face turns up: "...Don't move." -> P10.
11. The weight cracks the ladder, the Gunslinger hangs from Spud's hand with the sack: "Drop it!" He lets it go -> P11.
12. The flat door bursts, SO all five scramble over the cracked ladder and it falls behind them -> P11b (added shot).
13. Day 7: alive on the roof with one tin. "Tomorrow we take less." A stomach growls -> P12.

## Departures (and why)

- P11b (between panels 11 and 12) is NOT on the sheet: the panels do not show how the Samurai, Wizard and Phoenix get
  from the balcony to the roof, and Jonny's note on the lift draft was "the ending dosnt make sense". Two short cuts:
  the door gives way, all five cross the V. Named to Jonny in the draft message.
- 04: the blanket on the line is a flat board stand-in, the toilet roll is not placed, Phoenix sits higher than in
  the panel. 06: the wardrobe is half hidden behind the four backs. 09: Spud is half hidden behind the Gunslinger's
  hat. 10: boots and a sleeve at the bottom edge are whole bodies on the ladder, kept just out of frame. All four are
  rough-draft states, fixed in the polish after Jonny's OK (workflow rule 2).
- The police car has no dent yet (panel 10 shows one), the sky has no pink at dawn (panel 12): polish.
- Captions sit in the engine's caption band (TikTok's buttons cover the strip where the sheet draws them).
