# SET tasks: one place of the happiness score film in REAL 3D (common brief)

Jonny 16 Nov: projected painted plates look unnatural; every place is real 3D geometry with hand-painted canvas textures,
the way Stonehenge/pyramids worked. He approved the street (engine/page/set-score-street.js, sheet
storyboards/series/happiness/03-happiness-score/bench/st/st-sheet-v3.png) as THE QUALITY BAR. Read that file first: copy
its helpers and approach (canvas textures, ivy clusters, maple clumps, leaf piles, the painted far backdrop card).

## Look targets
- The painting(s): storyboards/series/happiness/03-happiness-score/plates/painted/<ID>.webp (1536x1024).
- The approved panel crops plates/ref/panel-NN.png (sheets happy-score-sheet-1..4.png); DESIGN.md section 8 (your row),
  section 10 (pose risks), the beauty-shot numbers. Panels win for framing and blocking; the painting wins for look.

## Rules learned on the street (do not repeat its rounds)
- Everything within ~30-40 m of the camera is 3D. Beyond that a painted far backdrop card cut from the painting (sky keyed
  out, feathered, aligned to the painting's camera) is allowed and looks best (street v3: hill at 165 m).
- Material scale from the painting: count courses, planks, tiles against a door (2.1 m) or a potato (eye ~0.95 m). Too big
  reads as LEGO. Warm hand-painted colour variation per block/plank, soft rough edges, thin dark joints.
- Foliage and creepers in dense grouped clusters, never confetti sprinkled over a wall; fallen leaves in drifts at walls
  and kerbs. Trees: several overlapping clumps, darker core, lit tops, branches in the gaps.
- Glass dark with a sky/room reflection + curtain, never flat colour blobs.
- Deterministic (util.js rng, no Math.random, no clock). Characters stand on y 0 tops; give seats/steps real heights.
- Engine's weave overlay flattens big plain panels: give them painted variation.

## Own only
engine/page/set-score-<name>.js (one type, export build fn + a constants object with stand spots) and bench files under
storyboards/series/happiness/03-happiness-score/bench/<name>/. Hook the type into engine/page/sets.js only temporarily for
the bench and remove it after (the director adds the real line). Do not edit any other shared file. Do not commit.
Renders: wrap each render in `flock /tmp/claude-render.lock`. Stills only (`--stills ... --draft`), never a video.

## Bench and done
Scratch storyboard (frame "wide") with Spud (characters/potatobrawl/spud) and whoever the panels show, placed as the panels.
Sheet: painting | render from the painting's camera, then each panel crop | render, plus one overview. It must read as the
same place as the painting, rich and hand-painted, characters standing IN it. At most 3 rounds.
Report: STATUS, FILES, sheet path, spec keys, stand spots (x, z, y) per panel, light recommendation, what differs and why.
