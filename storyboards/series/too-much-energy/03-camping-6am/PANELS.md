# Too Much Energy 03: camping at 6 am (Jonny's eight panels, 5 Nov 2026)

Board: `/mnt/project-files/video-scripts/2026-11-05-too-much-energy/storyboards/03-camping-6am/storyboard-eight-panels.png`
(4x2 grid). The panels are the target; the brief (`03-camping-6am-ENGINE-PROMPT.md`) sets the mechanics.

Every panel looks from the meadow toward the lake, slightly low, the khaki ridge tent centre-back with its door to us,
forested hills and the still lake behind it. Light: deep blue dawn sky with the last stars, a pale peach band low on
the horizon, cool blue-green grass, the warm lantern in the tent and Phoenix's orange flames the warmest light (01-06).
The sun clears the hills centre-right at 8.8 s and turns the sky, the lake and every face gold (07-08).

| # | Time | Camera | Who is where, what they face | Light and colour | Details | Build |
|---|------|--------|------------------------------|------------------|---------|-------|
| 01 | 0-1.5 | Wide from the front, slightly low; the tent fills the upper half, its apex near the top | Reaper (left, dark bag, hood) and Wizard (right, blue bag, hat on) asleep in the open door, faces to us; Phoenix in front doing a star jump, wings out | Blue dawn, lantern glowing at the apex, his flames warm | Clock on a little wooden stool front-left reads 05:59; guy ropes and pegs; grass, stones, wildflowers | WIDE master. Ridge tent (props-camp.js ridgetent), door open, both bags inside, clock on the stool |
| 02 | 1.5-3.3 | Closer on the door from the front-left | Phoenix on the left with a glove on the zip slider, zipping up and down the middle seam; Reaper in front, Wizard behind, both glaring | Lantern warm on faces | Zip arrows; a tin mug by the door | A cut in from the same side (ZIP shot); zip slider is a prop part the glove holds |
| 03 | 3.3-5.3 | Wide-ish, the door | Phoenix standing in the door facing us, wings blazing like a sunrise; the Wizard's arm throws the pillow, which flies at his crest; Reaper's bag pulled up | Gold glow flooding the tent from his wings | Pillow in the air, light rays | Glow sprite at his wings; physics throw of the pillow; Reaper's bag `cover` 1 |
| 04 | 5.3-6.3 | Wide | Phoenix drags both bags by their foot ends across the grass; the cord tied round the Wizard's bag runs to the lantern; tent still standing | Blue dawn | Drag marks in the grass | Bags tween with their riders; cord from the bag to the lantern |
| 05 | 6.3-7.3 | Wide | The tent lies flat behind, the lantern on the grass, pegs out; the two bags in front with the friends' faces to us, Phoenix with them, laughing | Blue dawn | Pegs lying loose, folds in the cloth | Tent `fall` 1 at 6.3 (hit-stop); pegs knocked out |
| 06 | 7.3-8.5 | THE GRIN close (series block): Phoenix three-quarters, thumb up, hand behind his head; the bags and the flat tent behind him | Sky turning pink | Sparkle on the eye | Series grin framing |
| 07 | 8.5-9.5 | Wide | The sun rising over the lake centre-right; Phoenix points at it beaming; Reaper and Wizard in their bags, faces out, lit gold | Gold sunrise, sun path on the water | Clock reads 06:00 on the stool in the foreground | Plate swap to the sunrise plate on the cut; gold flash ramp |
| 08 | 9.5-10 | Wide | "Again tomorrow?": both friends asleep again in their bags (zzz), Phoenix bright between and behind them | Gold | The lantern on the grass, the collapsed tent | Heads drop, "zzz" pops |

## Departures (with reasons)

- **The set is the `lakeside-campsite` painting relit twice (blue dawn, then sunrise), hung as a plate, not the env.**
  The env can't change its light, and the panels' whole story is the light going from blue to gold. The same meadow,
  lake and hills are colour-graded by `engine/plates/grade-camp.py` (assets/plates/camp-dawn.png, camp-sunrise.png
  with the sun centre-right); the sunrise picture swaps in on the cut to the wide at 8.5 s.
- **The wides are higher than the panels' eye level.** From eye level Phoenix in front covered both sleepers' faces;
  from above, his crest sits under their faces in the door (panel 01's picture).
- **The clock's stool stands right of the door, not left.** Phoenix ends on the left of the bags (so the series grin
  from his front-left has the bags and the flat tent behind him), and the sunrise wide keeps him, both faces, the clock
  and the sun in one picture.
- **Panel 02's zip shot is from the front-right** (Phoenix on the left of the seam, the faces right of it, as drawn).
- **Phoenix tows the bags toward the camera**, his back to the tent, a foot end in each glove behind him, instead of
  running backwards toward the lake. Running backwards turned his face away for the whole break; towing keeps all three
  faces to us, and panels 05 and 06 show the bags in front of the tent with the friends' faces to the camera.
- The tent is bigger than a real two-person ridge tent so the Wizard's hat clears the roof while he sits up in his bag.
- The friends sit reclined in their bags (the bag props ride with them), not lying flat: a lying potato's face points at
  the sky.
- **The pillow lies on the Wizard's lap, not under his head.** Thrown from the floor beside him it hit the tent wall
  and never left the tent; from under his head it would have gone through his own hat. From his lap it flies out of the
  door and bonks off Phoenix's wing by his crest.
- **Panel 03 is the zip shot's set-up**, front-right, with Phoenix stepping into the door: the same side and size as the
  panel, no cut.
- **The tow (panels 04-05) is filmed from 4.3 m up, pushing in to 3.5 m** on the collapse: lower, his crest covers
  both faces as he tows them toward us.
- **At the sunrise Phoenix points with his outer arm**, so most of the point is off the left edge: the near arm crossed
  Reaper's face. A medium from his side for the nod put Phoenix in front of both friends, so the sunrise stays one wide.
