# Bonfire Night: PANELS.md (read from Jonny's board, 4 Nov 16:16)

Camera always on the rooftop, looking out over the parapet toward the Thames (north-west): skyline plate = Houses of
Parliament + Elizabeth Tower (warm gold, screen centre-right), lit purple London Eye (screen right), a bridge with a
crowd silhouette row, a dark barge in the river. Night, deep blue sky; warm string lights along the parapet top.
Props: brick parapet (waist high to Phoenix standing on it), string lights, 2 striped folding deck chairs, tartan
blanket on Reaper, white mug with steam, red sand bucket with handle, toffee apple on a stick, Wizard's staff.

| # | t | Shot / side | Who, where, facing | Light / colour | Details |
|---|---|---|---|---|---|
| 1 | 0-1 | Wide-medium, eye level, slightly high | Phoenix ON the parapet centre-left, pointing up-right at empty sky, wings half open; Reaper seated low-left in deck chair with blanket + mug, facing camera-right; Wizard standing right, toffee apple, staff | Blue night, warm bulbs | Bucket on floor between them; barge dark |
| 2 | 1-2.4 | Medium, closer | Phoenix on parapet turns to Reaper, angry-impatient brows, crest taller; Reaper points at barge, sipping; Wizard bites apple, eyes up | same | "!" impatience marks |
| 3 | 2.4-3.6 | Medium | Phoenix crouched on parapet, wings swept back, crest tip white-hot; Reaper hand up "no", mug on parapet; Wizard frozen | crest glow | |
| 4 | 3.6-4.6 | Low angle up | Phoenix high top-right in sky, spiral gold spark trail; Reaper + Wizard faces up, Reaper's tea splashing | orange on faces | Big Ben left, Eye right |
| 5 | 4.6-5.8 | Wide over skyline, from behind them | Giant gold/orange feather-shaped burst + red sparks; crowd arms up; Reaper back to us in chair, Wizard back to us, toffee apple dropped on floor | burst lights everything | reflection in river |
| 6 | 5.8-7 | Medium | Reaper standing holding the bucket at chest height, ember falling in, smoke trail in sky; Wizard right | ember glow | mug on parapet |
| 7 | 7-8.5 | Close two-shot over the bucket | Ash pile with Phoenix's eyes + thumb up; Reaper deadpan left, Wizard grimace right | warm | bucket fills the lower half |
| 8 | 8.5-10 | Wide | Small weak official fireworks far behind; Reaper + Wizard standing, unimpressed; bucket on floor between them glowing orange; dropped toffee apple | | final hold on the glow |

Engine needs: London night skyline plate (paint.py), parapet + string lights + deck chair + bucket + mug + toffee apple
props, a firework burst fx (feather shape), ember + ash-in-bucket (reuse TME ashpile). Phoenix flying (fly), spark trail.

Continuity from Jonny's generation review (start-here-pack/GENERATION-REVIEW.md): keep the mug's contact and path
consistent through the launch reaction, and show it parked (on the parapet) before Reaper grips the bucket in 6.
The source brief (01-bonfire-night-SOURCE-PROMPT.txt) and IMAGE-PROMPT stay the authority for exact prop moves.

Set plan (painted layered env, main PR #92, `"set": { "type": "env", "env": "london-rooftop-night" }`): one painting
covers every panel, since all eight look the same way (out over the parapet to the Thames). Draft spec:
env-specs/london-rooftop-night.spec.json (paint 4 seeds, pick the one closest to panel 5). The painted roof deck is the
3D floor; parapet, string lights, deck chairs, bucket, mug and toffee apple are 3D props on it. Risk: panel 4's low angle
looking up may tilt past the env's safe range (meadow-path allowed about ±8°); check with `node qa/env.mjs --range`,
and if it fails, frame panel 4 as a slight up-angle with Phoenix high in the painted sky rather than a steep tilt.
