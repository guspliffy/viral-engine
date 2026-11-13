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

## Lessons (13 Nov, after Jonny's "well done merge it and add the lessons learned")
- Jonny's notes on draft 1: open on the danger ("Your best friend is in danger!"), then the power ("But you can
  rewind time."); the last frame must show the house burn (the smoke curl was too small a proof); a glitch in Chip's
  window; neighbours walking through each other. Draft 2 took them all.
- Window: a character behind a sash window keeps his front behind the sash planes (here z -0.13); the window seat is
  the floor (y 2.9) and the meeting rail (3.61) then sits at the top of his head. With the sash up from frame 0 his
  face is in the open gap, no glazing bar over it. An allowClip window with the facade waived the real fault: name
  only the part you mean (the sill), never the whole facade.
- Crowd: props that walk were invisible to every body check. qa/clear.mjs now follows them (this PR); draft 1's
  staging shows 24 overlaps, the first draft 2 11, the delivered one none. Walkers leaving one door need >= 0.45 s
  between them at 1.4 m/s, and an exit order where no path crosses a spot already taken.
- A `release` with `to` is an aimed throw that then bounces on: the watch ended under the stair smoke. A staged
  second watch (`wdown`) lies in the clear for the crack insert.
- An insert camera near a potato lands inside his body: aim from in front of him and check with --stills.
- The farm voice runs longer than `dur`: a narrator caption can run into the next line. Leave 1 s after a narrator
  line before anyone speaks.
- Payoff fire behind two characters reads as their heads burning from a low camera: raise the camera (y 1.25) so the
  window stands over their heads. Same for the fall: film it side-on.
