# PANELS: fire-rewind (There's a catch, episode 7, "Only you remember")

Board: storyboards/series/what-if/07-fire-rewind/board.png (4x4 grid, 9:16 panels; `qa/panels.mjs --grid 4x4`).
Brief: STORY.md here (Jonny "sounds good create the whole story and panels" 13 Nov 06:04 Berlin; "looks good create it"
on this board 06:21). Design of the new looks: DESIGN.md here (Fable).

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | 01/03/04/16 are ONE low camera on the pavement looking up: Chip's window in the upper third (his eyes 0.2-0.3 down), Spud in the lower third (eyes 0.7-0.85); both faces turned to us | | |
| 2 | 01: the fire is the brightest thing in frame: flames out of the ground-floor window up to Chip's sill, smoke band over his window; never touching Chip, never over his face | | |
| 3 | 03: the same frame running backward: flames shrinking into the window, glass shards rising; world grey-blue, Spud alone in colour | | |
| 4 | 04: no fire at all, warm lit windows; Chip leaning OUT of the open sash with a mug, waving; Spud below, staring up | | |
| 5 | The red alarm box beside the front door at Spud's shoulder height is in frame >= 0.6 s in 05, sharp in the foreground in 12, his glove on its lever in 14 | | |
| 6 | 06/07: the lobby clock (no numerals) above the burning stairs; Spud's eyes go from the flames up to the clock | | |
| 7 | 08: grey smoke rolls along the hallway floor (ankle to knee); Spud bangs on a door with both gloves | | |
| 8 | 09: grumpy old neighbour (striped bathrobe, pink curlers) in the door crack, waving him off; Spud's face 3/4 to us | | |
| 9 | 10: Spud falls back down the steps, the watch on the tiles with a crack across its glass | | |
| 10 | 11: Spud small on his knees on the pavement, the whole block ablaze; Chip's silhouette in his window untouched by flames | | |
| 11 | 15: neighbours in pyjamas/bathrobes pour out of the door, the curler neighbour points at Spud, Chip comes out LAST with his mug | | |
| 12 | 16: the frame-0 camera again, building dark and whole; Chip beside Spud with his mug, Spud smiling; a thin curl of smoke from the GROUND-floor window behind them | | |

## Numbers: read off each panel before any code

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.4 | spud | 0.62 | 0.74 | 0.9 | 0.3 | spud, chip | below | |
| 02 | 2.0 | - | - | - | - | - | - | - | insert of the watch |
| 03 | 2.7 | spud | 0.62 | 0.74 | 0.9 | 0.3 | spud | below | |
| 04 | 4.0 | chip | 0.12 | 0.22 | - | 0.72 | spud, chip | below | |
| 05 | 5.8 | spud | 0.42 | 0.52 | 0.95 | 0.45 | - | level | back to us, running in |
| 06 | 7.8 | spud | 0.62 | 0.72 | 1 | 0.35 | - | level | back to us, facing the fire |
| 07 | 10.2 | spud | 0.2 | 0.38 | 1 | 0.45 | spud | level | |
| 08 | 13.2 | spud | 0.35 | 0.45 | 0.92 | 0.5 | - | level | |
| 09 | 15.2 | spud | 0.3 | 0.48 | 1 | 0.22 | spud | level | |
| 10 | 17.6 | spud | 0.28 | 0.42 | 0.75 | 0.5 | spud | level | |
| 11 | 20.5 | spud | 0.76 | 0.83 | 0.9 | 0.5 | - | below | |
| 12 | 24.6 | spud | 0.18 | 0.4 | 1 | 0.25 | spud | level | |
| 13 | 26.6 | - | - | - | - | - | - | - | insert of the watch |
| 14 | 28.6 | spud | 0.42 | 0.55 | 0.95 | 0.5 | - | level | |
| 15 | 31.0 | chip | 0.52 | 0.62 | 0.8 | 0.82 | chip | level | |
| 16 | 35.0 | spud | 0.75 | 0.84 | 1 | 0.38 | spud, chip | below | |

## Story chain

1. Loop 1 peak: fire under Chip's window, Chip trapped, Spud thrown back with the watch -> viewer must see friend + fire + watch by 1 s -> 01 low wide.
2. Click -> the fire runs backward -> 02 insert, 03 same frame in reverse; grey world, Spud in colour = only he remembers.
3. Calm: Chip with a mug knows nothing -> 04 same frame, warm.
4. Loop 2: Spud runs in PAST the alarm box (the seed) -> 05.
5. The stairs burst earlier than last time (the catch) -> 06 lobby wide with the clock; 07 his eyes to the clock, click.
6. Loop 3: even earlier, smoke already inside; he warns a neighbour -> 08, 09 "Go home, kid." (nobody believes him).
7. Fire rolls down the stairs, he falls, the watch cracks (one rewind left) -> 10.
8. The low: he cannot outrun it -> 11 the block ablaze, him small.
9. Turn: so he must stop running to Chip and raise the alarm -> 12 eyes on the box (seen in 05); 13 last click.
10. Final loop: he lands at the door and pulls at once, no fire yet -> 14.
11. Everyone out before the fire shows, so they think he's crazy -> 15.
12. Chip alive beside him, "You're crazy." -> 16 the frame-0 camera, building whole; the smoke curl proves him right.

## Departures (and why)

- 16: the board draws a closer camera and lit windows; the story wants frame 0's camera again (the loop) and a dark,
  calm building, so the smoke curl from the ground-floor window reads as the fire that would have been.
- 11: the board puts Chip two floors up and the flames close to him; his window stays on the floor above the street
  (same as 01) and the flames stay below his sill.
- 13: the board's shake marks are left out (no marks rule); the shake is the watch's own `shake` param.
- 15: Chip comes out last with his mug (the story), not in the middle of the crowd.
