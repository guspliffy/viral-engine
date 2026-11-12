TASK T1: the night stadium in the rain, its crowd, floodlights, giant screen, barrier, start blocks, finish tape, Chip's sign
WHY: the whole video plays here; it must read at 270 px as a huge world final at night in rain (panels 01-10), and
the same place empty at grey dawn (panels 12, 14, 15).
DESIGN: BRIEF-COMMON.md (read it first: WORLD numbers, look, rules, file layout, bench, machine); board.png panels
01-10, 12, 14, 15.
READ: BRIEF-COMMON.md; engine/page/props-casino.js header + casinoguest (the spectator's look); engine/page/props-coaster.js
photoscreen (how a picture of the clip is shown on a screen: copy that mechanism); engine/page/props-race.js header.
OWN: engine/page/props-stadium.js (replace the stub, export STADIUM_KINDS and STADIUM_GRIPS);
storyboards/series/what-if/07-time-travel/bench/make-stadium-props.mjs (+ JSON, sheet).
CONTRACT (metres, origin as said, ghost = see-through + not solid):
- stadium: origin = the finish line's middle (x 0, z 0) on the ground. The WORLD numbers in BRIEF-COMMON: the red
  track (x -70..+30, six lanes, white lane lines, a white start line at x spec.start -20 and a white finish line at x
  0, lane number blocks painted on the track are NOT allowed: no numbers), the apron, the front wall, 28 concrete
  tiers with seats (bucket seats in rows, two colours in big blocks, drawn not tiled), the aisle stair at x +4, a roof
  canopy over the top 6 tiers, a green infield beyond lane 6 (z > 3.66) to z +40, and a lower far stand along z +45
  and both ends (x -75 and +45) as a backdrop ring (seats + a painted crowd texture there, cheap). Spec mood "night"
  (default) | "dawn": night = deep blue-black sky with rain haze, the track glossy and shining (painted wet
  reflections of the floodlights, a few puddles); dawn = overcast grey-blue sky, wet dark concrete, every seat empty,
  no lamps lit. Param wet 0..1 (default 1: the shine). The cast walks on y 0 and on the tiers/steps: tiers, steps and
  the front wall are solid; everything else ghost.
- stadiumcrowd: seated potato spectators filling the tiers of the stadium above (same tier numbers), spec x0 -50, x1
  50, rows 28, top 0 (how many top rows stay empty), gap [3.4, 4.6] (the aisle, empty), seed, umbrellas 0.35 (the
  share holding an umbrella: bright colours), ponchos 0.4 (clear/coloured rain ponchos), spacing 0.55; plus a
  standing front row: spec.front true adds one row standing on the apron behind the barrier at z -4.4. Each spectator
  about 0.7 tall seated (front row 0.85 standing), golden skin, dot eyes, blush, leaf, clothes in many colours.
  Params: cheer 0..1 (arms up, a small bounce, phases from rnd), boo 0..1 (one arm out toward spec.target [x, z]
  with a thumb down, the body leans that way), empty 0..1 (spectators vanish in a seeded order until none are left),
  flash 0..1 (camera flashes twinkle across the stands, driven by the clip time), sway 0..1 (idle). InstancedMesh.
  Ghost (the cast never touches the crowd except Chip in the front row: leave a 1.2 m gap at x spec.hole (null) if set).
- floodlight: a 35 m steel lattice tower with a tilted bank of 4 x 6 lamps at the top facing +z (rot turns it).
  Param lit 0..1 (1 = blazing white with a soft additive glow and a faint beam cone through the rain; 0 = dead grey
  lamps). Ghost.
- bigscreen: a 16 x 9 m video screen in a dark steel truss frame on two legs (its bottom at the origin's y + spec.bottom
  13), facing +z. spec.photo and spec.photo2 (pictures of the clip, paths as photoscreen takes them); params show 0..1
  (fades from a dark screen), pic 0|1 (which photo), glow 0..1 (screen light on the rain around it). Ghost.
- crowdbarrier: grey steel crowd-control barrier sections (1.0 high, vertical bars, feet) along x, spec.len 20, origin
  the middle of its foot line. Solid.
- startblock: a pair of starting blocks on a rail (0.6 long, low), origin its back end on the track. Solid, low.
- finishtape: a red tape across spec.w (2.6) on two thin white posts 1.0 high at x +- w/2 (origin the middle on the
  ground); params snap 0..1 (the tape breaks at x spec.cut 0 and both halves swing back), wave (ripple). Tape ghost,
  posts solid.
- cardsign: Chip's handmade cardboard sign: a brown cardboard rectangle 0.42 x 0.3 on a 0.35 wooden stick (origin the
  stick's bottom), hand-lettered in thick black marker "GO SPUD" on two lines (spec.text, default "GO\nSPUD"), a
  slightly wobbly hand-drawn look, readable at 270 px in a medium shot, rain-darkened edges. Params crush 0..1 (bent
  and crumpled). Grip "stick" (0.1 up the stick). Add its SIZE to storyboards/lib/grips.mjs (only that entry) and run
  the in-hand proof.
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN: bench/stadium-sheet.png shows (a) a camera at [6, 1.3, 4] looking at [0, 1.2, -3] fov 50 with Spud
(potatobrawl/spud) at [0, -1.83] and Wedge (potatobrawl/wedge) at [0.4, -3.05] at the finish tape, Chip
(potatobrawl/chip) at [-0.8, -4.4] behind the barrier holding the cardsign, crowd cheer 1; (b) a wide from [0, 4, 16] to
[0, 6, -15] fov 60: track, packed stands, bigscreen with any test photo, floodlights lit; (c) the same wide with boo 1
and target [0, 0]; (d) the dawn copy at x 1000 from the same wide: empty, lamps dead; (e) a low shot up the aisle stair
from [4, 1, -3] to [4, 5, -15] fov 55. Report the cameras, every spec key, and the triangle count of stadium + crowd.
OUT OF SCOPE: the clip generator, cameras of the clip, acting, sounds, commits, other kinds.
