TASK T2: the street world: canyon with balcony and shop roof (zstreet), the zombie horde (zhorde), the ladder (zladder)
WHY: the danger of the whole video is one picture: a thin ladder five floors above a street packed with hundreds of
  zombies. The viewer must feel the height, see that the crowd fills the street wall to wall, and get the shock
  when every face turns straight up.
DESIGN: storyboards/series/survive-it/04-zombies/BRIEF-COMMON.md (read first), panels 02, 07, 09, 10, 11, 12 in
  /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-B-10X-IMAGE-PROMPT.txt (text).
RULES: CLAUDE.md "Rules that apply to every task"; docs/rules/fast-cheap.md only its section on instancing/frame cost
  if you need it.
READ: `engine/page/props-heistset.js` lines 1-80 (header style, helpers), `engine/page/props-bonfire.js` `crowd`
  (instanced figures) and its header lines, `engine/page/props-zombie.js` header (see-through helpers),
  `storyboards/lookdev/make-hotpotato-set-bench.mjs` (bench pattern).
OWN: `engine/page/props-zstreet.js` (stub exists: replace, keep the three export names),
  `storyboards/lookdev/make-zstreet-bench.mjs` + its json. Touch nothing else.
CONTRACT (every size a spec key with this default; origin of zstreet = the world origin):
  zstreet   one prop holding the whole place. The street runs along z. `depth` 15: the street floor is at y -15.
    - OUR HOUSE on the left: its facade plane at x -4.3, from y -15 up to y 6, z -22..14: an old plastered town
      house, storeys 3 m, tall windows (dark, some broken, a few curtains), a cornice at the top.
    - THE BALCONY (y 0 is its floor top): slab x -4.3..-3.0, z -1.6..1.6, 0.18 thick, an iron railing 1.0 high on
      its three free sides (posts every 0.4, a flat handrail 0.06 wide; the handrail's top is y 1.0), a glass
      balcony door 1.6 x 2.1 in the facade at z 0 with a dark room behind it. Other storeys have the same balcony
      without anything on it (at y -3, -6, ... and y 3).
    - THE SHOP BUILDING on the right: its facade plane at x 3.0 from y -15 up to y 0 only. Flat roof at y 0 from
      x 3.0 to 11, z -6..6: grey gravel, a low kerb 0.15 round it, a street-side parapet 0.25 thick and 1.0 high
      (x 3.0..3.25, its top y 1.0) but ONLY from z -1.2 to 1.2 open as a 0.5 m high wall, i.e. between z -0.5 and
      0.5 the parapet is 1.0 high and solid so a ladder can rest on it; two vents, an aerial, a roof hatch
      (0.9 x 0.9, lid open) at (6.5, 0, -2.5). At street level a shopfront: awning, a glass door, a window.
      Behind the roof (x > 11) taller dull buildings as a painted backdrop.
    - THE STREET at y -15: asphalt 6 m wide between pavements (kerbs at x -2.6 and 1.6), litter, six parked cars
      (plain, dull colours) along both kerbs, and ONE more car at `car` [0.6, 1.5] (x, z; default) parked askew.
      State `alarm` 0..1: that car's four indicator lights and headlights flash (2 Hz from `t`), strong enough to
      read from y 2. State `dent` 0..1: a dent in its roof.
    - Far end closed by cross-street house fronts at z -22 and soft fog; the +z end is open (the camera's side).
    State `dawn` 0..1: 0 flat grey overcast daylight, 1 early dawn (a warm low light from +x on the roof and the
      upper facade, the street still blue-grey).
    All of it solid = false.
  zhorde    a crowd of zombies standing on a flat ground. Origin: the centre of its ground rectangle (y 0 = ground).
    `n` 300, `box` [5.2, 30] (x, z size), `seed` 1, `avoid` [[x, z, w, d], ...] rectangles nobody stands in (cars),
    `size` 0.95 (body height, each hashed +-15 %). Instanced: one draw call per part (body, face, sprouts, arms,
    legs), 300 must not cost more than about 0.3 s per frame.
    Each zombie: see BRIEF-COMMON. The FACE must read from 12 m straight above at phone size: big pale eyes and
    the dark open mouth take half the body front.
    State: `gx`, `gz` (default 0, 0): a goal point in local metres; every zombie faces it. `adv` (default 0): metres
    each one has shuffled from its hashed home toward the goal (it stops 0.6 m short, later ones pack round it; the
    walk bob comes from `adv`, an idle sway from `t`). `up` 0..1: the body tips back so the face looks straight up
    and both arms rise overhead, reaching (0.3 s stagger hashed per zombie between 0 and 1). `reach` 0..1: the arms
    stretch forward toward the goal.
  zladder   an aluminium extension ladder lying flat as a bridge. Origin: the centre of one end; it runs along +x
    for `len` 6.7, `w` 0.42 wide, rails 0.06 x 0.025, rungs every 0.28. State `sag` 0..1: the middle dips up to
    0.35 m in a smooth curve (ends fixed). `crack` 0..1: both rails snap at the middle: 1 = a V whose point hangs
    1.3 m below the ends, bent torn metal at the break, the ends still resting. `drop` 0..1: the whole ladder
    falls away (1 = 16 m down, tumbling). `half` (spec, default false): only one broken half (3.3 m, a torn end),
    lying flat. Write in the header the formula y(u) of the rail's height at fraction u for sag and crack, so the
    director can put a crawling character on it.
MACHINE: stills only (see BRIEF-COMMON).
DONE WHEN:
- bench (`storyboards/lookdev/zstreet-bench-sheet.png`): zstreet + zhorde (y -15, n 300, avoid the cars) + zladder
  from (-3.3, 1.03, 0): (1) camera (0, 4.5, 10) looking at (0, -4, 0), fov 50: the ladder across, both buildings,
  the street far below full of zombies; (2) camera (0, 1.6, 0.6) looking straight down at (0, -15, 0.4): horde at
  up 0; (3) the same at up 1 with alarm 1 and dent 1; (4) camera (-3.6, 1.6, 1.2) looking at (0.6, -15, 1.5):
  horde with adv 6 toward the car, alarm 1; (5) ladder close from (0, 2.2, 2.6) at sag 1, and (6) at crack 1;
  (7) the roof from (9.5, 1.6, 3) looking at (-4, 1, 0) at dawn 1 with a 12-zombie zhorde (box [1.0, 2.8]) on the
  balcony.
- in still 3 the faces read as faces at 360 px wide; in still 1 the street reads as full, wall to wall.
- usage header complete with the ladder formula; `ZSTREET_STATE` lists every state key.
OUT OF SCOPE: rooms, the shop's inside, the cast, tins, the clip generator, physics.
