# PANELS: back-to-life (There's a catch, episode 5)

Next to the generator. Jonny's panels are the target, and this file is how the clip is held to them by line and by
number, not from memory.
Board: board.png here (4x3 grid, 9:16 panels; `qa/panels.mjs --grid 4x3`), Jonny's go 11 Nov 2026 21:38 Berlin.
Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/09-back-to-life-trex-V2-COLD-OPEN.md (lower half, v3 EXTREME).
Opener type B (cold open): 0-1.5 s is panel 01, a piece of the street burst (panels 10/01), then a clean cut to 02.

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | Frame 0 (01): the three run AT us screaming, Spud front centre with the fish, Reaper left with the scythe, Phoenix right; the living T. rex fills the top half right behind them, jaws open, in the broken museum wall, stones in the air; never a whole wall at frame 0 | places yes (boxes); wall + stones wait for T4 | |
| 2 | The hall (02-09) is bright: cream stone, glass roof with blue sky, red rope on brass posts, skeletons on the right; never dark, never an empty room | waits for T1, T3 | |
| 3 | The plant (02): wilted and brown before the touch, green with pink flowers after, in the same shot, beside Reaper | place yes; bloom waits for T1 | |
| 4 | The fish (03): it comes OUT of the glass case with a green flash and water, and Spud holds it in both arms from then to the last frame (01, 07-11) | path yes; case + fish wait for T1 | |
| 5 | The run (04): Reaper front and big, face to us, scythe dragging behind him along the rope; behind him each skeleton glows green; never his back to us | yes after the turn fix (box stills) | |
| 6 | The crash (05): he hits the T. rex's foot, the scythe on the claw, green light up the leg; Spud and Phoenix small behind | place yes | |
| 7 | Everything alive (06): low and wide from behind the three (small, bottom), T. rex top centre, mammoth right, sabre-tooth left, pterosaurs under the roof: four kinds in one frame | yes (boxes) | |
| 8 | The calm (07): the T. rex's snout down at Spud's leaf, eyes soft; Spud smiles, Phoenix cheers, Reaper stiff; all three faces to us | yes (snout 1.5 m, boxes) | |
| 9 | The catch (08): from below, three terrified faces at the bottom, above them the T. rex (teeth, drool), mammoth and sabre-tooth all looking DOWN at them with narrowed eyes | faces yes; drool + animal faces wait for T2, T5 | |
| 10 | The chase (09) and the street (10, 01): the three run at us in the lower half with the whole pack behind, T. rex centre; the wall bursts with flying stone | yes (boxes) | |
| 11 | The lamp (11): the three cling to the top of one street lamp in the top quarter, the T. rex snapping just under them, mammoth and ONE sabre-tooth below; the scythe falls from Reaper's glove | yes (boxes) | |
| 12 | The end (12): the scythe stands blade-down in the cobbles in the foreground, green cracks round it; behind the museum a long neck as big as a hill, earth falling off; the lamp with the three small at the left | yes (boxes); neck waits for T4 | |
| 13 | The scythe is a real scythe (long curved blade), never the pickaxe of the sheet; Phoenix is the potato in the phoenix suit, never a bird; every potato alive and unhurt | yes | |

## Numbers: read off each panel before any code

At = seconds of the cut without the narrator (`back-to-life-no-vo`); the narrated cut has the same times.

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.3 | spud | 0.62 | 0.69 | 0.97 | 0.48 | spud, rea, phx | below | |
| 02 | 2.2 | rea | 0.62 | 0.71 | 1 | 0.33 | rea, spud, phx | level | Phoenix reaches for the nearest skeleton (sabre-tooth), not the T. rex toe: the T. rex stands at the far end so it is the LAST thing the run wakes |
| 03 | 4.4 | rea | 0.51 | 0.62 | 1 | 0.39 | rea, spud | level | |
| 04 | 7.0 | rea | 0.61 | 0.68 | 0.97 | 0.26 | rea | level | mirrored: one skeleton row on the right of the hall is on screen left when we look back along the run |
| 05 | 8.5 | rea | 0.69 | 0.74 | - | 0.48 | rea | below | |
| 06 | 10.0 | spud | 0.80 | - | 1 | 0.50 | - | below | |
| 07 | 11.6 | spud | 0.60 | 0.69 | 1 | 0.36 | spud, phx, rea | level | Phoenix cheers with his arm up instead of petting the trunk (no contact to solve on a moving trunk in a 1.8 s beat) |
| 08 | 13.4 | spud | 0.77 | 0.86 | 1 | 0.43 | spud, rea, phx | below | |
| 09 | 14.8 | spud | 0.53 | 0.63 | 0.97 | 0.52 | spud, rea, phx | below | |
| 10 | 16.0 | spud | 0.54 | 0.60 | - | 0.45 | spud, rea, phx | level | no steps under the breach: the cast never run stairs (feet slide); the entrance with its steps is 10 m to the left |
| 11 | 18.0 | spud | 0.12 | 0.18 | - | 0.43 | spud, rea, phx | below | ONE sabre-tooth (the sheet drew two) |
| 12 | 21.0 | spud | - | - | - | 0.20 | - | below | |

## Story chain

1. Cold open: a living T. rex comes through the museum wall behind three screaming friends -> the trouble at frame 0 -> coldCam (dolly back, low).
2. Phoenix reaches for the bones, Reaper flinches, the scythe dips into the dead plant -> it blooms -> hall wide, plant front right.
3. So Phoenix shoves the scythe at the fossil fish -> it flops out alive into Spud's arms -> the case close-up.
4. So Reaper shrieks and bolts along the rope, scythe dragging -> every skeleton he passes glows -> tracking shot, his face to us.
5. He runs into the T. rex's foot -> the biggest one wakes -> crash shot, then the low wide: the whole museum alive.
6. Fake-out: it only sniffs Spud ("He's friendly!") -> narrator "But there's a catch." -> the calm shot.
7. The catch, shown: stomachs growl, every animal looks down at them hungry ("...We're potatoes.") -> from below.
8. So they run, the pack behind, and out through the front wall (the cold open's moment, from the side and the front).
9. So they climb the lamp; Reaper shakes and drops the scythe -> lamp shot.
10. So the scythe sticks in the street, the ground glows, something hill-sized rises -> "Would you still want it?".

## Departures (and why)

- 02 / 04 / 07 / 10 / 11: see the rows above.
- Panel 10's side view is cut in two: 0.9 s from the side (the wall breaks), then the front view of panel 01 (the cold
  open's own shot), so the viewer recognises frame 0 when the story reaches it.
- The giant rises behind the museum (panel 12 shows a town row there): one building row less to build, and the
  museum they just broke stays in the last frame.
