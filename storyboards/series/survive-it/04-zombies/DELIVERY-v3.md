# Survive it 04: "How to survive a zombie apocalypse" v3, gun fight version (FINAL, 12 Nov 2026, 22:15 Berlin)

- Video: `how-to-survive-a-zombie-apocalypse-v3-FINAL.mp4` (64.6 s, 1080x1920, 30 fps). Cover without text:
  `zombies-v3-cover.png` (43.6 s: the Gunslinger aims at the three zombies, the Wizard crouched in front).
- Branch `survive-it-04-zombies` (PR #213, held for "merge it"), farm run 43301032520.
- Jonny's words: 16:40 "ok" on the 14-panel sheet `panels-sheet-v3.png`; 18:15 "i lilke all the sounds"; 19:18 on
  rough draft 2 "his head is in the tv / he is running through the boxes / his head is in the wall / ... cut faster
  away"; 20:43 "ok" on rough draft 3.

## What changed since rough draft 2

- P01 the Gunslinger stands clear of the TV; P09/P13 no street litter on the paths they run (`props-zstreet.js`
  `clear` rectangles, golden unchanged); P14 hats clear of the facade and the railing.
- Faster cuts in the slow scenes: second angles in P03, P04, P05 and P11, slow push-ins in P06 and P14, the ending
  1.4 s tighter (score re-cut to 64.6 s).
- Polish after "ok": shorter crouched steps in the street, ~0.5 m strides in the chase, the Gunslinger's eyes up out
  of the hat brim in the last shot, a slower turn in P07 (visible-glitch warnings 30 -> 21, 0 fails).
- Farm: the check job's limit is now 45 min (a 65 s clip ran past 20).

## Departures from the sheet (staging limits)

- P02: the street is 15 m below, so the heads sit at the top corners and the phone screens are not readable.
- P03: seen from behind them, no zombie hands over the wardrobe.
- P04: only Spud on the narrow balcony (the two foreground friends covered him).
- P08: the Wizard's hat is big at the bottom of the frame.
- Panel order kept as on the sheet (the cold-open question is still open).

## Check

`qa/check.mjs` PASS, 0 fails (60 notes); -14.0 LUFS, no pops, no audio dropout. Left as warnings: feet still slide a
little in the crouched street walk (37-40 s, feet mostly below the frame), the sack sits a little off the Gunslinger's
glove in the fight and the turn, a quick hand turn as Spud goes through the door (53.5 s).

## Hook trial

Opener **B** (cold open on the TV news, narrator title at 0.0).

## Listen at

0:05.8 the door knocks, 0:09.9 the siren, 0:17.5 the grab, 0:29.6 the horde, 0:55.7 the sunrise turn.

## Post pack

- **TITLE (in-app text):** How to survive a zombie apocalypse (no hero needed)
- **CAPTION:**
  Day 6. No water. One run to the shop.
  Which one are you: the one who shoots, or the one who says "drop it"?
- **TAGS:** #funnyanimation #animation #zombieapocalypse
- **COMMENT POLL (pin it):** Who do you take on the water run? A Gunslinger 🤠 / B Wizard 🧙
- **PLAYLIST:** Survive it · label AI content.
