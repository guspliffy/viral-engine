# Never has money EP04 "your birthday": Jonny's eight panels vs ours

Board: `/mnt/project-files/video-scripts/2026-11-05-never-has-money/storyboards/04-your-birthday/storyboard-eight-panels.png`
(the target). Story times are the storyboard clock; the video adds 0.1 s per hit-stop (4.2 and 6.0).

Look for every panel: a cosy wooden room in warm daylight (arched window at the back left, stone fireplace with fire,
bookcase, plants, bunting with purple/red/yellow flags under the beam, patterned red rug). Party hats on everyone
(red/yellow stripes on Gunslinger, blue dots on Viking), the yellow birthday rosette on Viking, the moth on
Gunslinger's hat brim. Purple present with a gold ribbon and a smiling bow; Reaper's small black box with a silver
ribbon. Set: `xmasroom` with `party: true` (bunting, no Christmas tree), `light: golden`.

| # | Board time | Ours (story) | Camera, size | Who is where, facing | Details |
|---|---|---|---|---|---|
| 1 | 0-1.5 | 0-1.5 wide | front, a little left and high, medium-wide | Wizard front left pushing the purple present at Viking (centre right, rosette); Gunslinger back left grinning; Reaper right with the black box | cake with lit candles; "Happy birthday!" then "And yours?" |
| 2 | 1.5-2.8 | 1.5-2.8 | front left, chest up | Gunslinger big at left, open empty wallet, the moth flutters out; Viking behind his right with the presents | the pocket pat first, then the wallet |
| 3 | 2.8-4.1 | 2.8-4.1 | front, a bit wider and higher | Gunslinger sitting on a crate, coupon on his knee, writing with a pen, tongue out; Viking behind right frowning | "Wait!" |
| 4 | 4.1-4.6 | 4.1-4.5 close | straight on, chest up | Gunslinger holds FREE HUG up at chest height, big grin | hearts and two hugging potatoes on the coupon |
| 5 | 4.6-6 | 4.5-5.9 close | front, Viking chest up | Viking crying happy tears, the coupon in one hand, the presents in the other arm; Wizard behind left snickering into his mitten, Reaper behind right rolling his eyes | "Best… gift… EVER!" |
| 6 | 6-7 | 5.9-6.8 | front, medium | Viking lifts Gunslinger into a big hug, both happy, tears; the presents dropped on the rug in front | coupon in Viking's hand |
| 7 | 7-8.8 | 6.8-8.6 | from the right, lower, slow push | the hug in the middle; Wizard bottom left, jaw dropped by the purple present; Reaper bottom right, deadpan, dusting off his box | |
| 8 | 8.8-10 | 8.6-9.8 close | on Gunslinger's face, a little from below | Gunslinger still lifted, two fingers to the brim, winks; Viking's head at the right; Wizard bottom left with a twitching eye and a sweat drop | "Next year's on me!" |

## Departures (and why)

- **3D room, not a painted plate.** The painted plates I tried came out as perspective rooms that don't match eight
  different cameras; the `xmasroom` set with the party variant gives every panel's camera a real room (window,
  fireplace, bookcase, bunting, rug).
- **Cake at the back, not front left** (panel 1). In front it hid Gunslinger in every shot of him (panels 2, 3, 6);
  at the back between Viking and Reaper the wide still sees the lit cake.
- **"Happy birthday!" at 0.34 s, not 0.0**: the Wizard has the party horn in his mouth at frame 0 (the hook sound),
  the line comes as it drops.
- **No tongue** in panel 3: the face rig has no tongue; a pucker/smirk stands in.
- **No paper tear** on the coupon: it is a folded card that unfolds on his knee and the ink is drawn in steps as he
  writes.
- **Pen and coupon come out of his bandana**, not the hat band (the hat band is out of reach of the arm rig).
- **The hug is side by side, Viking at Gunslinger's left (screen right)**, both faces to us, not Viking's back to
  camera: it keeps Viking on the same side as panels 2-5 and shows both faces in panel 6. Gunslinger is lifted off the
  floor as in the board.
- **Reaper's box goes on the stack off screen** (the brief has him set it on top in panel 1): stepping in to stack it
  put his arms into Viking's face and through the purple present at frame 0. In panel 1 he holds it out at the right
  (as drawn); from the cut to panel 2 Viking carries both, stacked.
- **Viking takes the present from below** (palms up under it), so no hand comes between it and the Wizard, and the
  Wizard stands side-on to him: they are a body-width apart. His face shows from "And yours?" (1.1 s).
- **Gunslinger stands up for FREE HUG** (panel 4): sitting, his arms can't bring the coupon below his face; standing
  he holds it by its top corners, at his chest, his grin over it.
- **The coupon in the hug is pressed to Viking's heart** (in his right mitten, drawing out), not against Gunslinger's
  back: the two of them stand touching, and no path takes a 31 cm card round behind Gunslinger without passing through
  one of them. Viking's left arm scoops Gunslinger up round the front of his tummy; Gunslinger's left arm is round
  Viking's shoulders.
- **The presents drop, not fling**: let go, they fall in front of Viking (the black one off the purple one). Thrown,
  the bake's hand balls knocked them across the room.
- **Cut cheats**: on the cut to panel 2 (1.47 s) Viking is moved just off the right of the shot and steps in behind
  Gunslinger (so the cheat is never on screen); the Wizard leaves the shots of panels 2-4; the Wizard and Reaper step
  behind Viking on the cut to panel 5 (4.48 s) and in front of the hug on the cut to panel 7 (6.78 s). Each cheat sits
  on a cut and is in the storyboard's `allowClip` list.
- **No sniff or sob sounds** (not on the whitelist): a gasp and the music dropping out carry the crying.
- **Music**: a bouncy bell/ukulele-like bed in C at 120 bpm (the "pop" style asked for isn't in the music styles),
  hush under the tears (5.2), back on the hug, a music box under the wink.
