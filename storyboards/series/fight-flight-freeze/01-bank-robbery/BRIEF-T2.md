TASK T2: the set pieces for Fight, Flight or Freeze 01 "You just robbed a bank", in one props file with a bench.
WHY: the alley's market crates (the three hide behind them), the bin of living potatoes Reaper tips into with its
price tag (the clip's payoff), the police van Phoenix runs into, police lights, the rooftops he leaps between.
DESIGN: Jonny's brief /mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md
("Pilot", "Build notes"). No panels. Potato scale: the cast are about 1.05 m tall and 0.8 m wide. Night / dusk scenes
in painted envs (purple and orange): keep props mid-dark with clear shapes; lights are additive.
RULES: CLAUDE.md (determinism: anything that flashes or blinks is a function of a `clock` param the generator tweens
with the clip time, never the wall clock); "every potato is ALIVE" (Jonny): the bin's potatoes have eyes.
READ: CLAUDE.md; docs/VOCAB.md; engine/page/props-whatif.js (file layout, helpers, apply(ps)); engine/page/
props-energy.js lines 1-60 (`glowy`, additive, userData.steam = see-through for the checks); engine/page/props-city.js
lines 1-40 (citycar as a prop: buildHatchback from car-hatchback.js, to reuse for a police car); engine/page/
props-catch.js `sign` (lettered canvas texture); engine/page/props-hell.js `bobspud` (a small living potato drawn as
a prop: eyes). Nothing else unless blocked.
OWN: engine/page/props-heistset.js (replace the stub; keep the exports HEISTSET_KINDS, HEISTSET_GRIPS; props3d.js
already imports it); storyboards/series/fight-flight-freeze/01-bank-robbery/bench/make-heist-set.mjs and its JSON;
storyboards/lib/grips.mjs SIZE entry for producecrate only. Touch nothing else.
CONTRACT (metres; origin bottom centre and front +z unless said; colours hex):
1. `producecrate`: a slatted wooden market crate, spec.w (0.9) x spec.d (0.5) x spec.h (0.34): corner posts, three
   slats a side with gaps, weathered wood #a9794a / #8a5f38. spec.fill: null | "carrots" | "cabbages" | "apples": a
   heaped top of that produce reaching 0.06 over the rim (simple shapes, clear colours). Param `smash` 0..1: the
   slats burst apart outward and fall (at 1 a few planks lie within 0.6 m). Solid. A two-hand carry: HEISTSET_GRIPS
   .producecrate.sides (the short ends, mid height); grips.mjs SIZE.producecrate for spec.w 0.5, d 0.36, h 0.3 (the
   small one Viking lifts as a shield).
2. `spudbin`: a low wide market bin, spec.w (1.5) x spec.d (1.0), rim spec.h (0.28), the same wood, no lid, on two
   short runners; filled with raw potatoes (#c9a060-#b58a4a, 0.09-0.14 long, about 60, deterministic from spec.seed)
   heaped to 0.04 under the rim at the edges and spec.dip (0.14) lower in a trough along x in the middle (a body will
   lie there; nothing of the heap may stand above y 0.2 inside the middle 1.1 x 0.7). Six of the potatoes near the
   front right (x 0.2..0.65, toward +z) are ALIVE: two white eyes with dark pupils each, 0.035 wide, facing +z and up
   30 deg. Params: `blink` 0..1 (all six eyelids; 1 = shut), `look` -1..1 (pupils left/right), `shh` 0..1 (potato
   number 1, the nearest to the front right corner, purses a small round mouth and raises one tiny leaf-hand to it).
   A price tag: a cream card 0.3 x 0.18 on a short stake at the front edge, x spec.tagX (-0.35), its top 0.5 up,
   facing +z, hand-lettered "POTATOES" (dark) over "2.99" (red, bigger); param `crook` (deg, default 0: the card's
   lean about z; the director starts it at -18 and straightens it). Solid rim; the potato heap see-through for the
   checks (a body lies in it).
3. `policevan`: a dark navy #1c2440 box van seen from behind, its back at the origin plane facing +z: body 1.9 wide,
   1.9 tall, 3.2 long (toward -z), wheels r 0.3, a white stripe along each side and across the doors with POLICE in
   navy capitals on each door, two rear doors 0.9 wide x 1.45 tall hinged on the outer edges, a barred window in
   each, a step under them, the inside dark with a bench each side. Params: `open` 0..1 (1 = both doors swung 100
   deg out), `rock` (deg: the body rolls about z on its springs), `lights` 0..1 + `clock` (a roof light bar: blue
   #2f6bff left, red #ff3b30 right, alternating 2.5 times a second from `clock`, each with a soft additive glow r
   0.5). The door opening is 1.7 wide x 1.45 tall, floor at y 0.45: a potato fits inside. Body solid, doors solid.
4. `policecar`: the city hatchback (buildHatchback) in navy #1c2440 with a white door stripe and the same roof
   light bar (`lights`, `clock`); front +z. No letters needed.
5. `sirenwash`: police light on the world: a soft-edged additive colour patch spec.w (4) x spec.h (3), facing +z
   (spec.flat: true = lying on the ground facing up), alternating blue #2f6bff and red #ff3b30 2.5 times a second
   from `clock`, a radial falloff to nothing at its edges, strength `on` 0..1 (at 1 about 0.35 of full additive).
   See-through for the checks.
6. `lightpool`: a spotlight's pool: a soft-edged additive ellipse spec.w (1.2) x spec.d (0.8), warm white #fff1c2
   (spec.color), lying on the ground (spec.face "up", default) or facing +z (spec.face "z"), strength `on` 0..1,
   with a slightly brighter core. See-through for the checks.
7. `copshadow`: a long cast shadow lying on the ground from the origin toward -z: the silhouette of a potato in a
   peaked cap holding a torch out to one side, spec.len (2.6) long, spec.w (1.1) at its widest, soft edges, dark
   #0c0b1a at `on` 0..1 x 0.6 opacity (a normal-blended decal at y 0.006). See-through for the checks.
8. `roofblock`: the top of a city building for a rooftop leap: a box spec.w (2.8) x spec.d (2.0) x spec.h (1.0),
   dark brick #4a3550 front (+z) with two rows of small windows (some warm lit #ffcf7a, per spec.seed), a pale stone
   coping 0.08 tall overhanging 0.04, a flat tar roof on top (walkable: solid), and spec.extras: [] of "chimney" |
   "tank" | "antenna" | "vent" standing at the back edge as dark shapes against the sky.
MACHINE: stills only for the bench (`node engine/render.mjs <bench.json> --stills <t,t> --draft --out <dir>`). One job
at a time; another builder and the director share this 4-core box, so never a `--layout`, a draft or a full render,
never the farm. One exception: the in-hand proof command below.
DONE WHEN:
- the bench (set type "env", env "dusk-back-alley", so the props are seen in the clip's own light; cameras near
  pos [x, 0.9, 4.5] looking down -z, level): each kind about half the frame, the spudbin with the tag crooked and
  straight, blink 0 and 1, shh 1; the van open and shut with lights at two clock values; the policecar; sirenwash
  blue and red on a wall-sized patch; lightpool on the ground and on the bin's front; copshadow; two roofblocks
  with a 1.8 m gap; a producecrate whole, filled, and at smash 0.5 and 1. A potato (duo/viking) stands beside the van
  and the bin for scale. Contact sheet (half scale) at
  /tmp/claude-0/-home-user/c271a530-791c-51b4-9d4f-374e01504e2c/scratchpad/t2/sheet.jpg; look at it once yourself.
- every letter of POLICE and POTATOES 2.99 reads on a 360 px wide copy of its still.
- in-hand proof: `node storyboards/lookdev/make-grip-tests.mjs --prop producecrate --hold box` (the small crate, two
  gloves on its ends, held by vik at belly height); front and side stills named in the report.
- the file starts with a usage header: each kind, every spec key and param with its default, sizes, origin, where a
  hand holds it.
OUT OF SCOPE: the clip generator, cameras, acting, sounds, the worn and held props (BRIEF-T1), engine changes,
registry edits.
