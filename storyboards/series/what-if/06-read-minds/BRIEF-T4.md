TASK T4: the neon street at night, potato passers-by, Wedge's gold watch, the 8-3 thought (v5 sheet)
WHY: Jonny's v5 sheet (board.png here, 5 x 3, panels 01-15) adds panel 13: at night Spud walks alone down a busy neon
street toward us, gloves over his head, overwhelmed; a soap bubble with a small object floats over every potato
passer-by, over the cars and in lit windows. Panel 01: Wedge shoves a huge heap of chips AND a gold watch into the pot.
Panel 05: the bubble over Wedge shows his real cards, an 8 of clubs and a 3 of hearts (a bluff).
DESIGN: BRIEF-COMMON.md (read it first: look, scale, rules, file layout, bench, machine); board.png panels 01, 05, 13
(the sheet is 5 columns x 3 rows now). Not to copy: letter-like squiggles on signs (signs are glowing SHAPES only).
READ: BRIEF-COMMON.md; engine/page/props-nightcity.js header 1-50 and its colours (match its neon palette);
engine/page/props-casino.js header + casinoguest (the passer-by is its walking cousin); engine/page/props-mind.js
SHAPES.cards27 and how thoughtbubble resolves spec.obj.
OWN: engine/page/props-neonstreet.js (new, export NEONSTREET_KINDS); the registry line for it in
engine/page/props3d.js (one import + add NEONSTREET_KINDS to an Object.assign, nothing else there);
engine/page/props-casino.js: ONLY a new kind `goldwatch` + its header lines; engine/page/props-mind.js: ONLY a new
SHAPES entry `cards83` (do NOT append it to MIND_OBJECTS: that would reshuffle every bubblefield); grips.mjs: ONLY a
SIZE entry for goldwatch if a hand will touch it; storyboards/series/what-if/06-read-minds/bench/make-street-props.mjs
(+ JSON, sheet).
CONTRACT (metres, origin bottom centre unless said, ghost = see-through + not solid):
- neonstreet: a night shopping street at potato scale, seen from pavement height, running along z (the far end at
  -z). Spec len 36 (z from +6 to -30), road 5 wide (x -2.5..+2.5, wet dark asphalt with painted neon reflections and a
  dashed centre line), kerbs, pavements 2.2 wide each side, then shopfronts on both sides (facades at x +-4.7): 2-4
  storeys (5-11 m), every ground floor a lit display window or cafe front with an awning, glowing neon SIGN SHAPES
  (heart, star, spade, crown, lightning bolt, cup, fish, ring: no letters), lit windows above (warm yellow, some white,
  a few teal and pink), drawn once per facade from rnd, not tiled; streetlamps every 6 m on both kerbs with warm light
  pools on the pavement; 4-6 parked rounded toy-like cars along both kerbs (bright colours, lit tail lamps); at the far
  end (-z) the night sky, a far skyline and the casino's glowing golden dome (as in neoncity) so the street reads as
  that city. Dark blue night sky above. Self-lit materials for neon, windows and lamps; add at most 3 real point lights.
  Ghost for everything except the ground (the cast walks on y 0; nothing else is touched). Night must read at 270 px.
  Cameras that fit: a walking shot [0, 1.25, 3.5] at [0, 1.1, -8] fov 50 (Spud walks from z -6 toward z +1 down the
  middle of the road); a higher shot [0, 4, 6] at [0, 1, -12] fov 55.
- streetpotato: a potato passer-by, the casinoguest's walking cousin (same golden skin #e2a95c, dot eyes, blush, leaf
  sprout, little rounded arms) WITH two small dark feet. Spec h 0.85 (0.6-1.1 allowed), dress "coat" | "hoodie" |
  "dress" | "suit", color (the clothes), hat 0|1 (a small beanie), bag 0|1 (a shoulder bag). Params: walk (metres
  walked: drives the feet stepping, an arm swing and a small bob, stride about 0.28 m, so the director tweens x/z and
  walk together and the feet do not slide), sway 0..1 (idle, as casinoguest). Faces +z at rot 0. Ghost (the cast
  never touches passers-by).
- goldwatch (props-casino.js): a chunky gold wristwatch lying flat on the felt, face up: case 0.07 across, a gold link
  band opened out to about 0.16 long, a white face with 12 tick marks and two hands (no numerals), a little crown.
  Origin: bottom centre on the felt. Solid. Readable at 270 px in a medium-wide shot (exaggerate the gold, a glint).
- cards83 (props-mind.js SHAPES): exactly like cards27 but an 8 of clubs ("8c") and a 3 of hearts ("3h").
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN: bench/street-sheet.png shows (a) the walking shot with Spud (cast potatobrawl/spud) standing in the road at
z -2 and six streetpotatoes on the pavements and road around him at different walk phases, (b) the higher shot,
(c) a close of a streetpotato mid-step from the side (feet clearly apart), (d) the goldwatch on a pokertable felt next to
a chippile, (e) a thoughtbubble with obj "cards83". Report every spec key, the cameras and anything the director must
know (e.g. how to walk a passer-by).
OUT OF SCOPE: the clip generator, cameras of the clip, acting, sounds, commits, other kinds.
