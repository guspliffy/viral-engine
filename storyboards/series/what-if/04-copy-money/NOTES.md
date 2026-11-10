# NOTES: copy-money (the director's working memory)

Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (v2 text wins over the v1
panel sheet where they differ). Series: There's a catch, EP04. Trial of the new workflow (PR #189 + #190 merged in).

## Where the build stands

- Step: draft 1 passed the checks (round 1 of 3), review B applied (wave notes, slap camera, barrow shot, throne
  push in), main merged in; next: ONE farm render. Drafts 1, farm renders 0; full layouts 10, partial about 30
- Generator: `--no-vo` writes copy-money-no-vo.json (no opening slow motion, no narrator); default = with narrator.
  `READY=money,flood,twist,night` names the packs that exist; `TIMES=1` prints story = video seconds for every beat;
  `AT=14.6,...` maps video seconds to story seconds. Windows (allowClip, see) are written in story s, converted by VT()
- Trial counters: engine grep/sed lookups so far 27; thread start 06:07Z 10 Nov

## Cast (a potato is 0.9 m wide, 1.1 m tall; Gunslinger's brim 1.3 m; body-width apart = 1.0-1.2 m)

| id | at x,z (story s) | faces | holds (prop, hold, hand) |
|---|---|---|---|
| gsl | -0.65,0.2 (0); -0.45,0.1 (2.0); behind the camera 3.0,1.7 (8.3); -0.36,0.2 (9.85); throne -0.7,0.55 then seat -1.7,0.55 (10.6); -1.5,0.1 (12.9); 40,0.5 (15.1) | 30 / 35 / 80 / 90 / 22 / -40 then 15 | wallet R 0-0.82, again 4.0-4.55; coin1 L pinch (given to sam 2.75), coin2 R; brick R flat on top 8.6-10.6; far fist on a barrow handle (world point) 14.0; bundle R 15.1-16.0; cup on L palm (from below) from 19.0 |
| sam | 1.15,-0.95 (0); 0.45,-0.76 (1.85); glass -1.75,-0.8 (8.3); bow -1.6,-0.95 (9.4); under the board 0.7,-1.1 (12.4); till 0.85,-0.78 (14.0) | -25 / -30 / -90 / 53 / 10-165-15 / -25 | palm out L at 0; coin1 R (thin, top rim) 2.75-4.0; full milkshake on his open R palm (from below) 14.0 on |
| rea | 0.95,2.4 (0); glass -1.9,2.0 (8.3); throne side -1.7,1.97 (11.3); 43 to 41.15,0.6 (16.9-17.9) | -14 / -90 / 105 / -50 | rwal R 0-7.3; iou L (thin) 5.85-8.27; coffee R from above (glove on the lid) 15.1-19.15 |
| wiz | off (0); glass -1.85,0.95 (8.3); throne side -1.7,-0.87 (11.3); off (12.9) | -90 / 75 | - |

## Props (sizes and origins: the usage header of each pack file)

| id | kind (file) | place | note |
|---|---|---|---|
| coin1, coin2 | coin (props-money) r 0.085, origin centre | gloves | SIZE len is negative: `from` 0.53 = bottom rim, -0.5 = top rim |
| heap | walletheap | 0.42 in front of him, y 0.34, rot 30 | parked under the floor until COPY2 (it stood in the cast) |
| brick / bundle | cashbrick scale 1.5 / 0.8 | glove flat on top (grip [0, 0.11 x scale, 0]) | squash at the slap |
| throne | cashthrone scale 1.1 | -1.7,0.55 rot 90 | build; `sit` seat; friends 1.42 m to each side |
| wall | windowwall h 8, cy 1.61, tiles 2 | x -2.4 (the LEFT wall), rot 90 | panes 0.25 to 3.3 m |
| wave / spill / ious / snow | moneywave len 7, noteflood, noterain (props-flood) | wave 2.2 m behind the wall | front, level, clock, grow, amount |
| dsign / board | dinersign, flipboard (props-twist) | outside x -2.85; 0.7,1.72,-1.6 | flip at the slap; stage 0..5, blow |
| barrow, pile | wheelbarrow scale 0.85, cashheap | -0.5,0.1 pointing +x; counter end | dump in 5 hand-eased steps, gloves follow |
| barrel, front | oilbarrel scale 0.75, dinerfront (props-nightdiner) | 39.15,0.5; 40.3,-1.9 | fire, feed, clock, flicker |
| cupw / cup | coffeecup scale 1.3, worn / held | Reaper's local -0.24,0.42,0.55 | worn on the walk, held from ARRIVE+0.22 (same spot) |

## Cameras (story s; kitchen wall z -2.7, window wall x -2.4; at a +x camera looking -x, +z is image left)

| shot | at | pos | look | fov | must show |
|---|---|---|---|---|---|
| wide | 0 | 0.9,2.3,6.3 | 0.2,0.78,0 | 40 | panel 01 |
| coins | 0.9 | -0.15,0.95,4.0 | -0.58,0.7,0.2 | 28 | panel 02 |
| victim / read | 1.55 / 5.9 | 0.8,0.95,6.3 / 1.1,1.0,6.2 | 0.92,0.66,2.4 / 0.95,0.7,2.4 | 28 | Reaper |
| pay | 2.5 | 0.3,1.05,5.3 | 0.05,0.7,-0.3 | 36 | the coin changes hands, the bite |
| heap / all | 4.0 / 7.5 | 0.9,2.2,6.1 / 0.3,1.0,4.6 | 0.2,0.8,0.3 / -0.45,0.82,0.1 | 40 / 32 | 100 wallets, IOU rain / COPY x3 |
| wave | 8.3 | 1.9,1.3,0.25 | -2.4,1.7,0.25 | 56 | straight at the window wall, friends' backs low |
| slap | 9.85, 10.0 | 2.8,2.2,0.3 | -0.8,0.82,0.42 to -0.8,0.6,-0.1 | 44 | the raised brick, then the cover |
| throne | 10.6 | 4.25 to 3.95,1.35,0.55 | -1.7,1.05,0.55 | 58 to 57.5 | both friends' faces stay in |
| board | 12.4 | 0.6,1.0,2.7 | 0.7,1.4,-1.6 | 36 | the board over the counter man |
| barrow | 14.0 | -2.1,1.35,3.9 | -0.42,0.85,-0.2 | 54 | him near, barrow, pile, the milkshake beside the counter man's head |
| night, push in | 15.1, 18.4 | 40.1,1.7,6.6 to 40.45,1.15,4.6 | 40.1,1.25,0.5 to 40.45,0.85,0.5 | 48 to 46 | his right side is cut by the frame at the end |

## Decisions, with the reason

- The window wall is the room's LEFT wall (panel 01): wave, slap and throne are shot from the right looking left.
- Wizard is not in frame 0 (v2 names three). Cast stands, no stools. Two potatoes abreast per 9:16 frame, else stack in depth.
- Placing someone on a cut (move + turn + lean, dur 0.01): name `ease: "linear", sync: true`, or the timing layer's
  settle plays out after the cut (the throne cut: a 4 cm body hop three frames in, a rig-jump). Poses on a cut: t - 0.02.
- Demo 1: the counter man takes the coin from his glove and bites it. The milkshake is `fullshake` 1.6 x on his open palm
  (kind `milkshake` is the EMPTY glass; in a mug hold before his forehead the arm crossed his face and nothing read).
- Barrel 0.75 x and beside him, not in front: at full size it hid him and his warming gloves crossed his face.
- The coffee: Reaper carries it from above (glove on the lid) and Gunslinger takes it on his open palm from below.
  A side (mug) hold for either sat on the cup's far side: arms crossed, gloves in the other's body, palms flipped.
- The wink has no hat tip (his right glove is out of the last frame): he lifts the coffee like a toast instead.
- Bread price checked 10 Nov: 200 billion marks, November 1923 (three sources, PANELS.md). About 25 s, not 19.0 s.

## Tried and dropped

- Named "up" arms: through Gunslinger's and Wizard's hat brims. `UP_WIDE = { o: [0.8, 0.95, 0.2] }` clears them.
- A glove on his belly (`out` < 0): the arm lies across his mouth, and a reach across the shoulder line jumps.
- `act.shock` on a prop holder (moves the arms). Character moves in a slow-motion ramp (3-5 drawings a second): move a prop, an effect or the camera.

## Names looked up that `docs/VOCAB.md` didn't answer

- `c.arm`: "rest"; `{ prop, grip, at }` carries a held prop; `{ world }` / `{ o: [out, up, fwd] }` (out from the shoulder).
- A pack param with no engine default jumps on its first tween: seed it with a dur-0 set at 0 (`SEEDS`).
- `engine/sfx/whitelist.mjs <word>` finds an allowed sound ("ridewind" for wind). camfit and peek read the LAST layout.
- Hand shapes with a palm direction: `cup` (up), `clasp` / `hover` / `paw` (down). A wrap palm's side flips when hand, prop and body line up.
