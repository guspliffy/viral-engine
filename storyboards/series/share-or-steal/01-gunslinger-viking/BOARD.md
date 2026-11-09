# BOARD: share-or-steal-01 (Share or Steal, season 1, episode 1: Gunslinger vs Viking)

Brief: `/mnt/project-files/video-scripts/2026-11-09-share-or-steal/00-SERIES-FORMAT.md` (Jonny 9 Nov 13:01 + 13:14).
No panels from Jonny: the brief's beat grid is the target. New series + new set: the draft (animatic) and two style
frames go to Jonny before the polish (workflow.md gates).

## §1 Brief

- Joke: a trust game over a deep fryer. Gunslinger (never has money, owes Viking) begs Viking to trust him, three
  stair-stepped pleas; Viking melts and shares; Gunslinger steals. Viking's chair tips back through a trapdoor.
- Wants: Gunslinger wants the whole pile; Viking wants his friend to be honest.
- Consequence: Viking goes down the trapdoor (off screen: splash, sizzle, a column of steam over his empty chair).
- Ending: Gunslinger hugs the whole pile. Host: "Gunslinger spent it all by Friday." Then "Share... or steal?", hard cut.
- Callback: frame 0 his eyes are already on the gold; the moth from his empty wallet (never has money) comes back.
- Rules (Jonny): share + share = split; steal + share = the sharer fries. Steal + steal = both fry is a proposal
  (said in the rules; Jonny confirms on review).
- Length 20-24 s (brief), 9:16, loop: no, profile short.

## §2 Look

- Cast: gsl (never-has-money/gunslinger, mitten hands, the holster wallet), vik (always-orders-potatoes/viking).
  castLook "sheet", cel 0.25, ink, satsuei, anime timing, no DoF.
- Host: narrator voice 5 (voices.json `narrator-trailer`), style "deep, dark game-show host, fast and clipped,
  tense" (measured: the recipe's own slow epic read made the rules 7.7 s; this read 5.1 s). Never on screen.
- Set: a dark game-show studio, original look (no golden balls, no show name, no host): a black cyclorama, a ring of
  small warm bulbs on the floor, purple light strips, an overhead truss with spot cans, ONE hard white spotlight cone
  on the round table, dark glossy floor. The deep fryer stands behind the table between the players, bubbling, steam
  rising, its orange light on the faces (castLight). Palette: black #0c0b11, floor #141219, gold #f2c23a, oil
  #f29a2a, SHARE green #2fae58, STEAL red #e0283c, card back navy #16203a + gold.
- Departure from the brief: the fryer stands BEHIND the table between the players, not beside it. In 9:16 the frame is
  tall and narrow; beside the table it would squeeze the two players or fall out of the mediums. Behind them it is in
  every wide and the threat sits between the two faces.

## §3 Set and props (world metres, x right, z toward the camera, y up)

| What | Kind (file) | Where | Size / API |
| --- | --- | --- | --- |
| round table | `sostable` (props-sos.js) | centre (0, 0) | r 0.46, top 0.62, pedestal |
| gold pile | `goldpile` (props-sos.js) | on the table, (0, 0.62, -0.15) | 0.42 w x 0.34 d x 0.18 h, one rigid prop |
| cards x4 | `sscard` (props-sos.js) | on the table | 0.2 x 0.28 x 0.012; face share/steal; flip 0..1 |
| chairs x2 | `sschair` (props-sos.js) | G (-0.68, -0.52) rot 52; V (0.68, -0.52) rot -52 | seat top 0.42; tip (deg back) |
| trapdoors x2 | `sstrap` (props-sos.js) | 0.75 m behind each chair, same rot | 0.9 square; open, warn, steam, rise |
| deep fryer | `ssfryer` (props-sos-set.js) | (0, -1.55) | 1.3 w x 0.75 d, rim 1.0; churn; castLight |
| oil | `fryoil` (props-hell.js) | in the fryer, y 0.92 | w 1.18, d 0.62 |
| studio | `ssstudio` (props-sos-set.js) | origin (0, 0) | cyc, bulbs, strips, truss, beam, floor |

The trapdoor is a black square on the floor; the set floor (y 0) hides whatever goes below it, so a body falling
through the black square reads as falling through a hole.
