# NOTES: fire-rewind (the director's working memory)

## Where the build stands
- 13 Nov: Jonny "create it" on the 16-panel board. DESIGN.md (Fable) written; builders T1 props-fireblock.js
  (fireblock, firelobby, lobbyclock), T2 props-firerewind.js (facadefire, blockfire, stairfire, floorsmoke), T3
  neighbours (streetpotato pyjamas/bathrobe, characters/what-if/grumpy-neighbour.json).
- Generator first pass: 39.0 s, 22 cuts; floor plan clear with placeholders (READY= ...).
- Reused from the parked stadium branch: props-timewatch.js (pocketwatch), assets/music/time-travel score (draft music).

## Places (frame A street / frame B inside = firelobby at [0,0,-40])
- Spud kneels at KNEEL (1.05, 1.75) in loop 1; each rewind leaves him where he clicked (he is the keeper).
- Chip on his window seat CHIP_PERCH (0, 2.9, -0.42), leaning out at CHIP_LEAN (0, 2.9, -0.16) with sash 1.
- Lobby: in the door (0, -40.4), skid (1.0, -41.7), stair foot (1.7, -42.2); hallway y 2.24, knock (1.95, -49.9),
  neighbour (2.95, -49.75), watch lands (0.6, 0, -41.6).
- The low: LOWKNEEL (2.75, 1.45), 1.2 m from the box; lever stand (3.45, 0.58).

## Decisions
- Rewinds = pause windows (look grey, keep spud, props watch); prop tweens of `time` run the fire backward inside
  them (T2 checks this first). A pause ends 0.07 s before the calm cut so Chip can be placed (load.mjs refuses an
  action of a frozen actor inside a pause).
- Loop 3's fire comes from the far end of the hallway (`flames` prop) and rolls down the stair after him: he can't
  reach Chip's flat, so he falls back down the stair (panel 10).
- Clock: 10:10 / 10:00 / 9:50 (DESIGN 7.1).

## Gotchas
- Park spots differ per cast member (two parked at one spot = a floor-plan overlap).
