TASK T2: thought bubbles and glowing eyes (engine/page/props-mind.js, MIND_KINDS)
WHY: the whole power is these bubbles: one clear bubble over a head with one small object inside = "I can see what
you think". The viewer must read the object inside at 360 px, and later hundreds of them must fill the casino and
the sky without the render slowing to a crawl.
DESIGN: BRIEF-COMMON.md, board.png panels 03, 05, 07-12 (this folder)
READ: BRIEF-COMMON.md; engine/page/props-nightdiner.js 1-70, 307-330; engine/page/props-band.js chatbubble (a pop
param with a back-ease overshoot, a halo); engine/page/props-shark.js `bubbles` (how it batches many small things);
characters/potatobrawl/spud.json (the face) for eyeglow
OWN: engine/page/props-mind.js; storyboards/series/what-if/06-read-minds/bench/make-mind-props.mjs (+ JSON, sheet)
CONTRACT (ghost = see-through + not solid for the checks; every kind here is ghost except where said):
- thoughtbubble: one soap bubble, origin at its centre, spec.r 0.2. A clear, perfectly round film: almost transparent
  in the middle, an iridescent rim (soft pink, teal, gold, shifting slowly with t), one bright window highlight top
  left and a small one bottom right, no tail, no outline line. Inside, ONE small SOLID-LOOKING object spec.obj, about
  0.6 r across, facing +z, turning slowly (param spin, degrees; default a slow 20 deg/s from t when spin is absent).
  Objects (chunky, simple, coloured, readable at 360 px; no letters except card ranks): "cards27" (the 2 of hearts and
  the 7 of spades side by side, faces to +z), "aces" (four aces in a small fan), "pizza" (a slice), "phone" (a
  smartphone with a lit screen), "shoe", "fish", "clock" (a red alarm clock), "heart", "sandwich", "football" (a round
  black-and-white ball), "coin", "crown", "gift", "book", "car" (a red car), "guitar", "camera", "watch", "burger",
  "cat", "bag" (handbag), "cake", "plane". Params: pop 0..1 (0 = nothing, a tiny dot at 0.05, 1 = full size; scale
  follows pop^0.7 so the generator's "back" ease gives the overshoot), glow 0..1 (night: the rim and the object get a
  soft self-light so they read in the dark), dim 0..1 (the object fades to a faint shape: a thought too far away to read).
- bubblefield: MANY bubbles in a box: spec.w, spec.h, spec.d (4, 3, 4), the box's bottom centre at the origin; spec.n
  (120, up to 600), spec.r [0.08, 0.22] radius range, spec.objs 0.7 (the share with an object inside, picked seeded
  from the object list above), spec.seed. Each bubble has a seeded home point, radius, phase. Params: fill 0..1 (how
  many show, in a seeded order, each one popping in over 0.15 of fill), rise (metres, all drift up; each also bobs 4 cm
  from t), pull 0..1 + spec.to [x, y, z] in the prop's own frame (every bubble moves on a straight line from home toward
  spec.to and shrinks to 0.3 at pull 1: the stream through a window), glow 0..1 and dim 0..1 as above. Must stay fast:
  instance the films (InstancedMesh) and batch the objects (one InstancedMesh per object type), no per-bubble material.
  Measure: a bench still with n 600 must draw in under 2x the time of the same still with n 0 (report both).
- eyeglow: two glowing eyes worn on a character's face (the director sets `wear: "<id>"` and the offset): origin
  between the eyes, facing +z; two soft blue-white ellipses spec.ew 0.07 x spec.eh 0.085 at x +/- spec.gap/2 (gap
  0.19), a bright core and a soft halo 2.5x the size; param on 0..1 (fade), pulse (0..1, a gentle 4 Hz shimmer when on).
  Additive, no tone mapping. Find Spud's eye centres in a bench still (Spud from the front, close) and report the wear
  offset [x, y, z] that puts the glows exactly on his eyes, plus the same for a 3/4 view (yaw 30).
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN:
- bench/mind-sheet.png shows: every object in its own bubble in a grid on a dark-red casino-like background (a box
  wall) at 360 px, each object readable; one bubble at pop 0.05, 0.5, 1; a bubblefield n 150 fill 1 in daylight and
  glow 1 in the dark; a bubblefield n 600 with pull 0.6 toward a point; Spud with eyeglow on 1 from the front and at
  yaw 30. The timing numbers (n 0 vs n 600) are in your report.
OUT OF SCOPE: casino pieces, the city, the room (T1, T3), the generator, sounds.
