# Put up one Christmas tree: Jonny's eight panels (4 Nov 2026)

Board: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/storyboards/07-christmas-tree/storyboard-eight-panels.png
(with IMAGE-CORRECTION.md: one cat only, on the shelf in 01-05, in its basket in 06, by the star in 08).
A warm wood-panelled living room on a snowy evening (set `xmasroom`, engine/page/set-xmasroom.js): the snowy window
with red curtains back left, the bare fir in the middle on a green rotating stand with the gold star on top, a stone
fireplace with a fire, candles, a garland and three stockings back right, a shelf of books above the mantel, a
bookcase beside it with the grey tabby on top, a big red patterned rug, presents under the tree and in the front left
corner, a wall socket low on the back wall. Warm fire light from the right, cool blue at the window.

| Panel | Time | Camera | Who / where | Light, details |
|---|---|---|---|---|
| 01 | 0.0-1.5 | one front view, high (all panels) | Wizard left-back tangled, a loop round his hat; Reaper right-back; Phoenix front-left with his phone; Viking front-right, the lead looped round his boot | the knot glows, the cat on the bookcase |
| 02 | 1.5-3.3 | same | the knot floats up and winds round the Wizard's staff; Viking and Phoenix exchange a look | "Easy.", gold sparkles |
| 03 | 3.3-4.5 | same | Viking steps in, grabs two strands, steps back: the string snaps taut in a zigzag, the carton tips over | hit-stop at 3.70 |
| 04 | 4.5-5.5 | same | draped over the Wizard's hat and Viking's shoulders; they glare at each other; Phoenix points at his tutorial; Reaper sighs | |
| 05 | 5.5-7.2 | same | Reaper takes the loose end, lifts it off them, sets the tree spinning: a perfect spiral to the star; the cat hops down and pads to its basket | hit-stop at 6.80 |
| 06 | 7.2-8.0 | same | the cheer at the glowing tree; the cat curled in its basket; the lead still round Viking's boot | |
| 07 | 8.0-9.0 | same | "Perfect.": Viking steps back, brushing his hands; the lead peels the spiral off from the top, the star drops | dö-döm |
| 08 | 9.0-10.0 | same | the heap at Viking's boot, the bare tree, the star on the rug, the cat sits by it; three glares, his sheepish grin | cover at 9.6 s |

## Departures (with reasons)

- **A 3D room, not a layered painted environment** (the brief allows the fallback): the lights, the turning tree and
  the heap need real geometry, and every panel uses the same front camera.
- **The camera is higher than the panels'**: in a vertical frame the back row (Wizard, Reaper) hides behind the
  front row's heads at eye level; from above, all four faces show (the contact gate checks it).
- **Reaper sets the tree spinning with a push on its lowest branch tips**, not a hand on the stand: the branches
  stick out further than a potato's arm can reach under them. The arrow on the green stand shows it turning.
- **The basket stands on the rug at the front right**, not by the fire: the cat needs to reach the star in about
  half a second at the end.
- **The heap, the star and the cat land in front of Viking** (on our side): from the high camera his body would
  hide anything at his heels.
- **No "mrrp"**: there is no cat sound in the whitelist yet (a new sound needs measuring and describing first).
- **The music is the "bounce" style with a bell lead** (swung, plucked chords): there is no sleigh-bell or upright
  bass style in puppet/beat.mjs.
- **The light string is drawn see-through for the contact checks** (a just-translucent wire and glowing bulbs): it
  wraps the hat, the staff and the shoulders, and the checks would read every touch as a body in a prop. Its paths
  were checked by eye in the stills and strips.
