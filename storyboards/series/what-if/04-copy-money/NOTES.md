# NOTES: copy-money (the director's working memory)

Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (v2 text wins over the v1
panel sheet where they differ). Series: There's a catch, EP04. Trial of the new workflow (PR #189 + #190 merged in).

## Where the build stands

- Step: acting written, review A applied, packs money / flood / twist built and on; night pack (T4) building
- Next: layout clean, preflight, draft, contact strips, review B, ONE farm render
- Renders so far: drafts 0, farm renders 0; fix rounds used: 0 of 3
- Generator: `--no-vo` writes copy-money-no-vo.json (no opening slow motion, no narrator); default = with narrator.
  `READY=money,flood,twist,night` names the packs that exist (a missing pack gets stand-ins); `TIMES=1` prints the
  story-to-video clock for every beat
- Trial counters: engine grep/sed lookups so far 15; thread start 06:07Z 10 Nov

## Cast (a potato is 0.9 m wide, 1.1 m tall; Gunslinger's brim 1.3 m; body-width apart = 1.0-1.2 m)

| id | at x,z (story s) | faces | holds (prop, hold, hand) |
|---|---|---|---|
| gsl | -0.65,0.2 (0); -0.45,0.1 (2.0); off-frame 1.3,1.7 (8.3); -0.36,0.2 (9.85); throne -1.7,0.55 (10.85); -1.5,0.1 (14.0); 40,0.5 (15.1) | 30 / 35 / 80 / 90 / 60 / -50 then 15 | wallet R (WGRIP) 0-0.82, again 4.0-4.55; coin1 L pinch at its bottom rim (given to sam 2.95), coin2 R from 1.2; brick R flat on top 9.85-10.6; barrow handles (world points) 14.0; bundle R 15.1-16.0; cup L (mug) from 19.2 |
| sam | 1.15,-0.95 (0); 0.45,-0.76 (2.0); glass -1.75,-0.8 (8.3); bow -1.6,-0.95 (9.4); under the board 0.7,-1.1 (12.4); till 0.62,-0.78 (14.0) | -25 / -30 / -90 / 53 / 10-165-15 / -25 | palm out L at 0; coin1 R (thin, top rim) 2.95-4.0; milkshake R (mug) 14.0 on |
| rea | 0.95,2.4 (0); glass -1.9,1.25 (8.3); -1.95,1.8 (11.3); 42.9 to 41.05,0.6 (16.9-17.9) | -14 / -90 / 105 / -40 | rwal R 0-7.3; iou L (thin) 5.85-7.5; cup R (mug) 15.1-19.2 |
| wiz | off -1.95,-1.3 (0); glass -1.85,0.25 (8.3); -1.95,-0.7 (11.3); off (14.0) | -90 / 75 | - |

## Props (sizes and origins: the usage header of each pack file)

| id | kind (file) | place | note |
|---|---|---|---|
| counter | dinercounter | x 0.1..3.3, z -0.3..0.3, top 0.38 | |
| coin1, coin2 | coin (props-money) r 0.085, origin centre | gloves | SIZE len is negative: `from` 0.53 = bottom rim, -0.5 = top rim |
| heap | walletheap | 0.42 in front of him, y 0.34, rot 30 | n, spill, wobble |
| brick / bundle | cashbrick scale 1.5 / 0.8 | glove flat on top (grip [0, 0.11 x scale, 0]) | squash at the slap |
| throne | cashthrone scale 1.25 | -1.7,0.55 rot 90 | build; `sit` seat |
| wall | windowwall h 8, cy 1.61, tiles 2 | x -2.4 (the LEFT wall), rot 90 | panes 0.25 to 3.3 m |
| wave / spill / ious / snow | moneywave, noteflood, noterain (props-flood) | wave 2.2 m behind the wall | front, level, clock, grow, amount |
| dsign | dinersign | outside, x -2.85, y 1.6, z -0.45 | flip at the slap |
| board | flipboard (props-twist) | 0.7,1.72,-1.6 | stage 0..5, blow |
| barrow | wheelbarrow scale 0.85 | -0.5,0.1 pointing +x | dump stepped by hand so the gloves stay on the handles |
| pile | cashheap | counter end 0.33,0.38,0.05 | grow |
| barrel, front | oilbarrel scale 0.75, dinerfront (props-nightdiner) | 39.15,0.5; 40.3,-1.9 | fire, feed, clock |

## Cameras (story s; kitchen wall z -2.7, window wall x -2.4; at a +x camera looking -x, +z is image left)

| shot | at | pos | look | fov | must show |
|---|---|---|---|---|---|
| wide | 0 | 0.9,2.3,6.3 | 0.2,0.78,0 | 40 | panel 01 |
| coins | 0.9 | -0.15,0.95,4.0 | -0.58,0.7,0.2 | 28 | panel 02 |
| victim / read | 1.55 / 5.9 | 0.8,0.95,6.3 / 1.1,1.0,6.2 | 0.92,0.66,2.4 / 0.95,0.7,2.4 | 28 | Reaper |
| pay | 2.5 | 0.3,1.05,5.3 | 0.05,0.7,-0.3 | 36 | the coin changes hands, the bite |
| heap | 4.0 | 0.9,2.2,6.1 | 0.2,0.8,0.3 | 40 | 100 wallets, IOU rain |
| all | 7.5 | 0.3,1.0,4.6 | -0.45,0.82,0.1 | 32 | COPY x3 |
| wave | 8.3 | 1.9,1.3,0.25 | -2.4,1.7,0.25 | 56 | straight at the window wall, friends' backs low |
| slap | 9.85 | 2.8,2.2,0.3 | -0.8,0.6,-0.1 | 44 | the cover |
| throne | 10.6 | 4.25,1.35,0.55 | -1.7,1.05,0.55 | 52 | |
| board | 12.4 | 0.6,1.0,2.7 | 0.7,1.4,-1.6 | 36 | the board over the counter man |
| barrow | 14.0 | -0.45,1.55,5.5 | -0.45,0.95,0 | 54 | barrow, pile, milkshake in his glove |
| night, push in | 15.1, 18.4 | 40.1,1.7,6.6 to 40.45,1.15,4.6 | 40.1,1.25,0.5 to 40.45,0.85,0.5 | 48 to 46 | |

## Decisions, with the reason

- The window wall is the room's LEFT wall (panel 01): wave, slap and throne are shot from the right looking left.
- Wizard is not in frame 0 (v2 frame 0 names three). Cast stands, no stools (they hid wallets and blocked +x shots).
- A 9:16 frame holds two potatoes abreast; three abreast are 20 % tall (the barrow wide). Stack in depth instead.
- Gunslinger is not in the wave shot (review A: windows clear above the hats); he is back at the slap cut.
- Demo 1: the counter man takes the coin from his glove and bites it (the right glove can't reach the counter).
- The milkshake is in the counter man's glove (on the counter the heap hid it): he pulls it back on the head shake.
- Barrel 0.75 x and beside him, not in front: at full size it hid him and his warming gloves crossed his face.
- Night ending at x 40. Bread price checked 10 Nov: 200 billion marks, November 1923 (three sources, PANELS.md).
- About 25 s with the spoken title (EP03: 22.3 s), not the script's 19.0 s.

## Tried and dropped

- Wave camera behind the counter (1.0,1.2,-2.4): the price board's back filled the top left.
- Slap shot at eye level; window wall opposite the kitchen wall; staging at a guessed cast size.
- `grips.thin()` for a coin held from frame 0: it only writes a take. `pinch0()` does the frame-0 pinch.
- Sound "nature/wind-1": not on the whitelist; "ridewind" at 0.06 + "crinkle" for the fire.

## Names looked up that `docs/VOCAB.md` didn't answer

- plates[] entry with `turn`: a flat card at (center[0], center[1], z) turned about y (90 faces +x).
- `c.arm`: "rest" lowers; `{ prop, grip, point, at }` carries a held prop; `{ world }` / `{ o }` move a free hand.
- `sky: [[t, level, dur?]]`; `set.nightSet` darkens floor and backdrop. `qa/camfit.mjs` reads the LAST layout.
- A pack param with no engine default jumps on its first tween: seed it with a dur-0 set at 0 (`SEEDS`).
- `engine/sfx/whitelist.mjs <word>` finds an allowed sound by what it sounds like.
