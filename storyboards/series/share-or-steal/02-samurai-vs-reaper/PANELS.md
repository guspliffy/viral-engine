# PANELS: samurai-vs-reaper (Share or Steal, season 1 episode 2)

Board: `/mnt/project-files/video-scripts/2026-11-09-share-or-steal/panels-02-samurai-vs-reaper/sheet.png` (4x2 grid,
9:16 panels; `qa/panels.mjs --grid 4x2`). Jonny, 11 Nov 2026: "here is the 8 panel, go with the video". Brief:
`/mnt/project-files/video-scripts/2026-11-09-share-or-steal/00-SERIES-FORMAT.md` (format v2) and
`02-samurai-vs-reaper-IMAGE-PROMPT.md` next to it (beats and sound).

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | Every wide (01, 02, 07, 08): the grate across the middle, glowing oil across the bottom fifth of the frame, the riveted vat rim along the bottom edge, orange haze behind, truss and two lit cans at the top; never a plain dark floor | | |
| 2 | Each chair stands on its own square hatch with a light rim: grey at rest, red when that player would fry (02: both; 05: Reaper's only; 06: both) | | |
| 3 | Frame 0 (01): the title, both seated dead calm, each holding up a green SHARE and a red STEAL card in the hand nearer the table, the gold between them | | |
| 4 | 02: three cream picture cards in a row across the top, pictures only (2 green + 2 gold; red + green + gold + flame; 2 red + 2 flames); all three up by 2.2 s, gone by 3.0 s | | |
| 5 | 03: a two-shot with both faces 3/4 to us, a bead of sweat on Samurai, each with one glove flat on one face-down card with a red back, the timer's 4 top right | | |
| 6 | 04: the handshake over the gold with the timer's 1 top right, both faces serious, eyes locked; nobody speaks in the whole clip | | |
| 7 | 05: Samurai's card face up, red, STEAL; the word STEAL big and red at the top; his smirk; his other glove on the gold; the rim under Reaper red, his own still grey; Reaper looks down, unbothered | | |
| 8 | 06: Reaper's card face up too (red, STEAL), his glove still on it; Samurai's smirk gone, eyes wide, mouth open; both rims red | | |
| 9 | 07: both go down at once, upright in their chairs: Samurai with his arms thrown up and his mouth open, Reaper with his arms folded and the same bored face; the cards fly; the gold stays on the table | | |
| 10 | The camera never looks down into the oil while someone is in it (series rule 8): the splash is droplets and steam out of the hatches | | |
| 11 | 08: Samurai's chair empty in a column of steam; Reaper back in his chair fried golden-brown and smoking, both gloves on the gold, the same bored face; "You can't fry Death." at the top | | |
| 12 | About 15 s; the countdown is 4 to 0 only; the end is "Share... or steal?" and a hard cut | | |

## Numbers: read off each panel before any code

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.5 | sam | 0.36 | 0.44 | - | 0.21 | sam, rpr | above | |
| 02 | 2.3 | rpr | 0.38 | 0.45 | - | 0.78 | sam, rpr | above | |
| 03 | 3.4 | sam | 0.20 | 0.42 | - | 0.24 | sam, rpr | level | |
| 04 | 5.6 | rpr | 0.24 | 0.41 | - | 0.74 | sam, rpr | level | |
| 05 | 8.2 | sam | 0.26 | 0.42 | - | 0.24 | sam, rpr | above | |
| 06 | 9.5 | sam | 0.28 | 0.45 | - | 0.20 | sam, rpr | above | |
| 07 | 10.1 | sam | 0.38 | 0.45 | - | 0.16 | sam, rpr | above | |
| 08 | 13.6 | rprF | 0.35 | 0.46 | - | 0.75 | rprF | above | |

## Story chain

1. Two calm players over boiling oil, each with a SHARE and a STEAL card -> the vat, the grate, the hatches, the fans of cards, the title -> WIDE (0-1.0).
2. So the rules: -> three picture cards pop one by one; the rim under a chair blinks red with the flame cards -> WIDE (1.0-3.0).
3. So each picks one card and lays it face down, and the clock starts -> gloves on red backs, the stare, a bead of sweat, 4 and 3 -> CLOSE two-shot (3.0-4.6).
4. So Samurai offers a deal without a word -> his glove out over the gold, Reaper takes it, they shake on 1 -> SHAKE (4.6-6.2).
5. So at 0 Samurai turns his card: STEAL -> the red word, his smirk, his glove on the gold, the rim under Reaper goes red -> MED (6.2-8.5).
6. But Reaper turns his: STEAL too -> the smirk drops, the rim under Samurai goes red as well -> MED (8.5-9.7).
7. So both hatches drop -> both go down upright, arms up against arms folded, splash and steam out of both holes -> WIDE (9.7-11.3).
8. So the lifts come back up: one chair empty and steaming, one with Reaper on it, fried and bored -> WIDE, then the END shot (11.3-12.5).
9. So he takes the gold -> both gloves pull the pile to him; "You can't fry Death."; "Share... or steal?" -> END (12.5-16.0).

## Departures (and why)

- Both hatches are dunk lifts (the plate goes straight down with the chair and comes back up), not flaps swung aside
  as drawn in 07: it is what puts an empty chair and a seated, fried Reaper back in 08 without a cut or a climb, and
  the players drop upright exactly as drawn.
- No oily glove print on the grate (08): he rides the lift back up, he does not climb out.
- The players sit 1.41 m apart round EP01's table (proven reaches), so the close two-shots (03, 04) show them further
  apart and smaller than drawn: a 9:16 frame is 1.6 m wide at their distance.

## Notes

- Rough draft 1 (11 Nov) rendered with `--force`: the gate's 8 fails are all gloves and a robe hem 3-5 cm into the
  table or a card (2.6-3.0 s, 7.8 s, 13.1-16.0 s). None hides a beat; they are polished after Jonny's OK on the draft
  (workflow.md rule 2: decide first, polish last).
