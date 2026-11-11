# Doomscroll to survive, pilot "Sprout Man": notes

Jonny, 11 Nov 2026: a pilot of "Look up and you die" with our own potato monster leaned on Slender Man, then "i would
like to see both episodes as pilot and see how they compare". One generator builds both:

```bash
node storyboards/series/doomscroll/make-ep1-sprout-man.mjs             # cut A -> doomscroll-01-sprout-man.json
node storyboards/series/doomscroll/make-ep1-sprout-man.mjs --extreme   # cut B -> doomscroll-01-sprout-man-extreme.json
FINAL=1 node ...                                                       # the narrator in Jonny's voice 5 (needs VoxCPM2: the farm)
```

Outline, image prompts and his two sheets: `/mnt/project-files/video-scripts/2026-11-11-doomscroll-to-survive/`
(`01-sprout-man-CHAIN-OUTLINE.md`, `panels-01-sprout-man/sheet-A-as-written.png`, `sheet-B-extreme.png`, `PANEL-NOTES.md`).

## The chain (both cuts, 19 s of story, about 19.7 s of video with the slow motion)

| s | battery | what happens, so |
|---|---|---|
| 0 | 5 % | three on the log, Spud on his phone, Sprout Man behind them. Viking looks up, so he is taken (helmet stays) |
| 2 | 4 % | the Wizard looks up at him, so he is taken too. Spud: "shh", eyes on the phone |
| 4.5 | 3 % | Spud will not look, so the long fingers wave between his face and the screen; he leans round them |
| 7 | 2 % | still nothing, so he lifts Spud upside down, the friends wrapped beside him ("DON'T LOOK!"). Cover at 8.5 |
| 10 | 1 % | still scrolling, so he jabs the phone: the screen goes black, Spud's head starts to lift |
| 12 | 1 % | the jab opened the selfie camera: a puppy filter gives the blank head a face, so he wants the phone |
| 14 | 1 % | both his hands take the phone, so all three drop, alive |
| 16 | 0 % | the battery dies, so the face is gone and his head turns to them; the Wizard charges it |
| 17.4 | 100 % | nobody looks up |

## Places and files

- Sprout Man is a prop: `engine/page/props-sprout.js` (kind `sproutman`, plus `selfieframe`), skeleton and state keys in
  `engine/shared/sprout-rig.js`. The generator aims his arms and coils in world points (`armTo`, `coilTo`, `carry`).
  The giant of cut B is the same prop at scale 4 to 6.
- Cut A set: `pine-forest-night` (painted level, eye 1.5 m). Shots look level along -z.
- Cut B sets: `storm-pine-clearing` (painted looking up 12 degrees, so its shots tilt up 11 to 12 and the potatoes sit
  along the bottom), swapped at 7.0 to `moon-above-storm` (env.json written by hand: one sky card and a floor of cloud
  tops; the camera is 5.2 m up), back at 14.0, and at 17.4 to `flattened-forest-dawn` (painted looking up 3 degrees).
  The camera gate reads only the first env, so it is off for B (`--gate` turns it on to check the storm shots).
- Storm in B: `rainstreaks`, three `skybolt`s, the prop's `flash`; thunder is the `firework` sound (no thunder in the
  library).

## Departures from the sheets (tell Jonny)

1. Spud's eyes stay on the phone in 04 and 06 (the rule would break otherwise).
2. The monster is a pale potato in a suit with sprout arms, not a human body with a fingernail.
3. Spud is turned the right way up for the jab and the selfie (05 keeps him upside down).
4. Hats and helmet are back on while the friends hang (simpler than a second helmet prop).
5. The Wizard's staff is a staged prop at his hand. In B the storm's lightning charges the phone when he raises it
   (no bolt from the staff to the phone yet).
6. B-02: no burning debris when Viking is taken. B-04: no mud thrown up by the fingers.

## Known weak spots in the rough drafts

- B, the jab: the giant fingertip lands on Spud's head, not cleanly on the glass (two fix rounds used).
- B, cloud shot: the sky is one plate drawn 1.5x (soft), a few stretched columns at the bottom corners.
- Spud's legs and boots have no ink line (see the comment at the end of `spud()` in costumes-art-cast.js).
- No `.life` masks on the three new sets (nothing sways).
