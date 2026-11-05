# Pitch a tent: Jonny's eight panels

Source: `/mnt/project-files/video-scripts/2026-11-04-friends-try-to/storyboards/02-pitch-a-tent/storyboard-eight-panels.png`
(2x4 grid). One front view across a lakeside meadow for the whole board: the lake and a jetty behind on the left,
birches on the right, wind blowing right to left. The set is the layered environment `lakeside-campsite`, built for
that one camera side.

| Panel | Camera, shot | Who is where, facing | Light, colours | Details | In the clip |
|---|---|---|---|---|---|
| 1 | front, medium wide | Wizard left hanging on to the flapping tent's pole, Viking front centre kneeling at a peg, Phoenix behind on his phone, Reaper right with his scythe | bright midday, blue sky, green meadow, cream and red tent | poles on the grass, backpack front left, fire ring, leaves blowing | 0-1.5 s WIDE |
| 2 | front, medium wide | the Wizard casting with his staff up; the tent puffed into a balloon above, Viking grabbing its rope; Phoenix big in the front left reading out "Pole A into sleeve B!"; Reaper right | gold spell glow on the cloth | fire ring | 1.5-3.3 s WIDE, sail -> ball, rope up |
| 3 | front, medium | Viking lifted off his feet on the rope, the balloon drifting; the Wizard and Phoenix look up, Reaper watches | same | wind lines | 3.3-4.5 s WIDE, yank hit-stop |
| 4 | front, medium | the cloth flat over them, the Wizard and Viking crawl out of its ends pointing at each other; Phoenix front left with the phone, Reaper front right | same | | 4.5-5.5 s WIDE, "You let go!" / "YOU floated it!" |
| 5 | front, medium | Reaper plants the scythe through the cloth's middle and it snaps up into a dome; the others gape | same | | 5.5-7.0 s WIDE, THUNK hit-stop |
| 6 | front, close group | all four cheer in a group hug in front of the dome | same | the backpack | 7.0-7.8 s WIDE, the series cheer |
| 7 | front, medium | Viking pulls the scythe out to hand it back, "You forgot this."; the tent folds | same | | 7.8-8.8 s, the payoff |
| 8 | front, medium | the heap with the Wizard's hat tip poking out (anger mark), Viking holding the scythe out to Reaper, the glare | same | | 8.8-9.8 s |

Departures, with reasons:
- One front camera for the whole clip (the panels push in for 3, 6 and 8): the painted environment allows the camera to
  move in but only 0.3 m down and 8 degrees of tilt (qa/env.mjs --range), so the shot sits close in, a little above
  their heads, and the stage stands 2.2 m further from the painting's own eye.
- Phoenix stands close to the lens in the front left from frame 0 (panels 2-5) and stays there with his phone: from
  there his head sits below the Wizard's face on screen. In panel 1 he is behind Viking.
- Viking hammers the peg with his fist, not a rock: a rock is a new hold, and new holds need your approval first.
- A cheer instead of the group hug in panel 6: the hug would press four bodies and a phone together (the hug checks).
- The dome is a two-potato tent (1.15 m) and the balloon a little smaller than drawn (1.6 m across), so it clears
  the Wizard's hat and Reaper's hood as it puffs up.
- The environment's lake has no jetty and the birches stand further back; the painter kept adding boardwalks across
  the meadow, so the prompt leaves the jetty out.
- Music: the brief asks for a folk tune; beat.mjs has no folk style, so the "warm" style.
- No burned-in title (you type it in-app), so the top of frame 0 stays clear.
