# PANELS: copy-money (There's a catch, episode 4)

Next to the generator. Jonny's panels are the target, and this file is how the clip is held to them by line and by
number, not from memory.
Board: /mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/03-copy-money/storyboard-eight-panels.png
(4x2 grid, 9:16 panels; `qa/panels.mjs --grid 4x2`). It was drawn for the v1 script.
Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (the newer, "way more extreme"
script Jonny asked for; where the two differ the v2 text wins and the row is a departure).

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | Frame 0 (01): the camera is on the customers' side looking at the kitchen wall; Gunslinger small at the left (x 0.18, eyes 0.53 down), the counter man behind the counter at the right with his palm out, Reaper low in front at the right, his wallet already out | yes (review A: partial, Reaper moved back to z 2.4) | |
| 2 | Frame 0 (01): Gunslinger's wallet is open and empty in his glove, one coin, exactly one moth flying out of it; never a second moth | yes (coins now pinched at the bottom rim, above the fingers) | |
| 3 | The price board (01, 03, 04, 07) hangs top right on the kitchen wall: one row of three food pictures over one row of flip digits, in frame in every wide of the main direction | yes | |
| 4 | The copy (02): a close-up, his hat top near 0.14 and his eyes near 0.48 down, a coin in each glove held at chest height beside each other, both coins clear of his face, gold shimmer | yes | |
| 5 | Paying (03): he holds the coins out over the counter to the counter man's open palm; both faces show; never his back to us | yes after the restage: one coin handed over the counter's corner, both faces 3/4 | |
| 6 | The slap (06, the cover): he is big and front, 3/4 to us (eyes about 0.58 down, x 0.44), his glove flat on a brick of cash on the counter in the foreground; a hit burst is NOT copied (no reaction marks) | yes (camera above, see Departures) | |
| 7 | The friends cheer behind or beside him with both faces to us (05, 06); never backs to camera on the throne beat | yes | |
| 8 | The price board fills the top of the frame when it runs away (07), the counter man under it looking up at it | yes: the board over the counter man, who turns to look up at it | |
| 9 | The diner is bright, red and chrome, window to a sunny street at the left (01-08) until the hard cut to night | yes | |
| 10 | Money is green notes with the potato emblem and gold coins with the potato emblem (02, 05-08); never real currency | yes (props-money.js: potato emblem, no text or numbers) | |
| 11 | No gun, in any frame; every potato alive and unhurt | yes | |

## Numbers: read off each panel before any code

At = seconds of the cut WITHOUT the narrator (`copy-money-no-vo`); the narrated cut starts each beat later by the
opening slow motion (TITLE_LEN - 0.6 s).

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.3 | gsl | 0.42 | 0.53 | 0.72 | 0.18 | gsl, sam, rea | above | Wizard is not in frame 0: the v2 script's frame 0 names three (Gunslinger, the counter man, Reaper) and the frame reads faster with the victim alone in front |
| 02 | 1.3 | gsl | 0.14 | 0.48 | 1 | 0.44 | gsl | level | |
| 03 | 3.0 | gsl | 0.40 | 0.50 | - | 0.22 | gsl, sam | above | v2 demo 1: he pays with ONE coin, handed over the counter's corner, and the counter man bites it (his right glove can't reach the counter, and a coin in a glove reads better than one lying flat); Wizard and Reaper are not in this shot |
| 04 | - | gsl | - | - | - | - | - | - | v2 demo 2 replaces the coin stacks: a hundred wallets in his arms and a rain of IOU notes on Reaper |
| 05 | - | gsl | - | - | - | - | - | - | v2 demo 3 replaces the money pit: a wave of banknotes outside the windows, then the throne of cash |
| 06 | 10.6 | gsl | 0.42 | 0.58 | 1 | 0.44 | gsl | level | the background is the window wall with the wave at its peak and the sign (v2 cover), not the kitchen wall; the friends are at the glass; the camera is above him (2.2 m) so the counter man's bow and the windows stack behind him |
| 07 | 13.9 | sam | - | - | - | - | - | below | v2: the board runs to 4.5 BILLION and the flaps blow off; Gunslinger is on his throne, not at the counter with a brick, so the shot is the board with the counter man under it |
| 08 | - | gsl | - | - | - | - | - | - | v2 ending: hard cut to night, snow, the dark diner, a barrel fire of banknotes, Reaper hands him a coffee, then the wink |

## Story chain

1. He can't pay again -> empty wallet, one coin, the palm out, Reaper sighing with his wallet out -> wide (panel 01)
2. COPY!: one coin becomes two -> a coin in each glove, his eyes wide -> close-up (panel 02)
3. The friend who always pays freezes -> Reaper, wallet half out -> Reaper close
4. He pays, for once -> two coins on the counter, the counter man bites one -> counter two-shot (panel 03)
5. He pays everyone back at once -> a hundred wallets in his arms, IOUs raining on Reaper -> wide, then Reaper reads one and puts his wallet away
6. He wants it all -> COPY x3, a wave of banknotes rolls down the street past the windows -> reverse wide on the window wall
7. He owns the place -> the slap of cash on the counter in slow motion, the sign flips to his hat, the counter man bows -> the cover shot (panel 06)
8. The promise -> on a throne of cash, "Everything's on me. Forever.", the friends cheer -> throne shot
9. The catch starts -> the price board runs from 4.50 to 4.5 BILLION, the flaps blow off -> board insert (panel 07)
10. Money is worth nothing -> a wheelbarrow of cash for one milkshake, the counter man shakes his head and slides it back -> wheelbarrow wide
11. The fact -> night, snow, the dark diner, he burns bundles in a barrel to keep warm, the fact caption -> night wide
12. The friend still pays -> Reaper hands him a coffee, the wink, "Next time's on me." -> closer two-shot

## Departures (and why)

- Panels 04, 05, 08 and the backgrounds of 06 and 07: the v2 script (Jonny, 10 Nov: "way more extreme") rewrote
  demos 2 and 3, the 10x moment and the ending. The v1 sheet is followed for the room, the cast's look, frame 0, the
  copy close-up, the paying beat and the slap's framing.
- No stools under the cast (01, 03, 04 show stools): everyone stands, so the wallets and hands stay in view and the
  cast can move between beats without stand-up frames. No stools in the room: they stood in the reverse shots' foreground.
- Reaction marks and hit bursts in 03, 04, 06, 07 are not copied (house rule: no reaction signs).
- The wave shot (v2 panel 04) has the three friends at the glass and not Gunslinger: with him in it the hats covered
  the windows (review A). He is at the counter in the next shot, the slap.
- The milkshake of v2 panel 07 is in the counter man's glove, not on the counter: the heap of cash hid it there.
- Length: about 25 s with the spoken title at 0.0 (series rule since EP02), not the script's 19.0 s.
