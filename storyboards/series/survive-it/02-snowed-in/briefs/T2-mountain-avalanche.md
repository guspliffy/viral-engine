TASK T2: the outside: a snowy mountain world around the cottage, the cottage's outside that rides an avalanche down
the mountain, and the mountain's whole snow cap coming down on it
WHY: Survive it EP1's wow and payoff. Fail 3 (panel 06): the god's thunder sends the whole cottage down the mountain on
the front of an avalanche, firs flipping, moonlit. The payoff (panels 07-08): on DAY 100 the four step out of the door
onto green grass at the mountain's foot; the god thanks the sun with a thunderclap; the camera pulls back to the WHOLE
mountain as its snow cap breaks away and buries the cottage; only the chimney shows, Viking's crest rises out of it.
DESIGN: Jonny's panels /mnt/project-files/video-scripts/2026-11-08-survive-it/panels-01-snowed-in/01-snowed-in-sheet.png
(06 the ride, 07 the doorway in the sun with the cap above the roof, 08 the mound, the chimney, the bare grey mountain
with its avalanche track). Brief: /mnt/project-files/video-scripts/2026-11-08-survive-it/01-snowed-in-7-days-ENGINE-PROMPT.md
("Set" outside, "New props and designs": snowslope, cottagesled, snowfront, snowcap, snowmound, chimney cap; beats 5 and 7).
RULES: docs/rules/movement.md (living worlds, scenery, physics), docs/rules/fast-cheap.md (render cost, golden), CLAUDE.md
READ: engine/page/set-hilltop.js (a painted sky dome and big-scale world), engine/page/set-forest.js (the pointy firs:
reuse them), engine/page/sets.js (registering a set type), engine/page/props3d.js (how a props file registers KINDS and
how a prop's keyed values are set), one existing props file with keyed values (e.g. engine/page/props-steak.js),
engine/page/physics.js head (what a physics body costs); nothing else unless blocked.
OWN: a new engine/page/set-snowslope.js exporting `buildSnowWorld(scene, spec)` (the world, used later inside the
"snowcottage" set) and `SNOWSLOPE` (numbers + `slopeAt(x)` + `ridePath(u)`), plus ONE line in sets.js registering
`type: "snowslope"` (the world alone, for your bench; another builder adds a "snowcottage" line in the same file at the
same time: re-read it right before your edit, change nothing else); a new engine/page/props-avalanche.js (cottagesled,
chimneycap, snowfront, snowcap, snowmound) with its two registry lines in props3d.js (re-read before editing, same
reason); a bench storyboards/lookdev/make-avalanche-bench.mjs + JSON. Touch nothing else.
CONTRACT (x right, z toward the inside cameras, y up, metres; the room interior is another task and stands at the origin:
walls x -2.7..2.7, back wall z -2.3, door in the left wall at z -0.4, hearth on the back wall at x 1.05):
- World: the valley floor at y 0 around the origin, snow with soft drifts; the mountain toward +x: a 30-degree slope from
  x 30 to about x 400 along the fall line (down toward -x), then the rock face up to a peak about 900 m high and 1.5 km
  away; grey rock with a smooth white snow cap on the top third (the `snowcap` prop sits on it); white-capped firs
  (forest set's, instanced, a few hundred) on the slope and around the valley, none within 12 m of the origin; a sky dome
  with `spec.dark` keys [[t, 0..1]]: day = high sun, blue sky, a few clouds, blue snow shadows; night = moon over the
  ridge, stars, the snow glowing blue-white. From a camera at the door looking +x and up (panel 08: pos about
  [-12, 4, -0.4] looking at [60, 40, 0], fov 50) the whole mountain fills the frame above the cottage.
- `ridePath(u)` u 0..1 -> { at: [x, y, z], yaw, pitch }: down the fall line from x 140 (up the slope) to the origin,
  flattening over the last 20 m (the brief's "the slope flattens, then ploughs into the valley floor and STOPS").
- `cottagesled`: the cottage's whole outside: plank/log walls enclosing the room footprint just outside its walls
  (x -2.75..2.75, z -2.35..3.6), a gabled roof with 0.5 m of snow and icicles along the eaves (panel 07), a stone
  chimney over the hearth (x 1.05, back) rising 1.2 m above the ridge, the window (back wall, x -1.4, 1.4 x 1.4 m from
  sill 1.0 m) and the door (left wall, z -0.4, 1.0 x 2.0 m, hinge at z -0.9, `door` 0..1 swings it inward like the
  room's); one plank across the window and three across the door (`boards` 0/1); snow drifted to the sill. Walls and roof
  are seen from OUTSIDE only (one-sided outward: the inside cameras stand within the front wall's line and must see
  through it). Keys: `slide` 0..1 (along ridePath; at 1 the cottage stands exactly round the origin, yaw 0), `tilt`
  (degrees of rock, plus or minus 8), `sink` 0..1 (into the valley heap, 0.6 m at 1).
- `chimneycap`: a separate small stone slab on the chimney top (a physics body: it flies off and lands back on in the
  ride, pops off at the end).
- `snowfront`: a cel avalanche wall 40 m wide, 8 m tall, boiling rounded tops, spray, `run` 0..1 (rides ridePath just
  behind and above the cottage), `scale` (3 for the payoff's wave), 200 snow chunks spat ahead of it and 12 firs flipping
  end over end. Chunks and firs may be deterministic tumbling motion (functions of story time) instead of physics
  bodies if physics is too slow on CPU: measure and say which.
- `snowcap`: the slab on the mountain top, `break` 0..1 (a crack opens along one line across the cap), `run` 0..1 (the
  slab slides down the face and becomes a snowfront at scale 3 heading for the cottage); after it has gone the top third
  shows bare grey rock (panel 08) and a long avalanche track down the face.
- `snowmound`: `rise` 0..1 a smooth white mound over the whole cottage at the origin, the chimney's top 0.5 m still out
  (panel 08).
- Deterministic everywhere; cheap on CPU (instancing, no per-frame geometry rebuilds).
MACHINE: benches only: draft stills (`node engine/render.mjs <bench> --stills ... --draft --safe`, one at a time; other
builders share the box), `node qa/golden.mjs` once at the end. No clip layouts or renders, no farm.
DONE WHEN:
- bench stills, contact sheet at 360 px wide per still in /mnt/project-files/videos/survive-it/02-snowed-in/set-bench/
  avalanche.png (full stills beside it): (1) panel 06: moonlit, the cottage mid-ride (slide 0.5, tilt 6) on the front of
  the snowfront, firs flipping, from a tracking camera 25 m to its side and above; (2) panel 07: day, the cottage at
  slide 1, door open 1, a camera 3 m from the door at face height (eyes 0.71 m) looking +x, the cap white in the sky over
  the roof; (3) panel 08: snowmound rise 1, the cap gone (bare rock + track), the camera of the World line above;
  (4) the payoff wave mid-way: snowcap run 0.6, scale 3, from the same camera
- the ride still reads at 360 px: the cottage, its smoking chimney and the boiling wall behind it
- `node qa/golden.mjs`: no changed pixel (paste its last lines); one draft still renders in under 20 s (paste the time)
OUT OF SCOPE: the room interior (another task), cast acting, any clip generator, the green patch and flowers, the sound.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
