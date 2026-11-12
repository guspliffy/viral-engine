TASK T1: the casino and the poker game pieces (engine/page/props-casino.js, CASINO_KINDS)
WHY: panels 01-07 and 09-11 happen at one poker table on a grand casino floor at night. The viewer must read
"casino, high stakes" in one glance, and the chips must visibly move: a pot pushed in, raked away, a mountain.
DESIGN: BRIEF-COMMON.md, board.png panels 01-07, 09-11 (this folder)
READ: BRIEF-COMMON.md; engine/page/props-nightdiner.js 1-70, 307-330; engine/page/props-sos.js 1-60 (sostable, sscard
and sscardfan: a held card fan's grip and origin); storyboards/lib/grips.mjs SIZE (find "sscardfan")
OWN: engine/page/props-casino.js; storyboards/series/what-if/06-read-minds/bench/make-casino-props.mjs (+ its JSON,
sheet); storyboards/lib/grips.mjs: ONLY new SIZE entries for cardfan, playcard, carkeys
CONTRACT (kinds; origin bottom centre on the floor unless said; ghost = see-through + not solid):
- casinohall: the room shell. spec.w 20 (x), spec.d 24 (z), spec.h 7.5; floor from z -spec.d+6 to +6 relative to
  origin (the open side toward +z, no front wall). Deep red carpet with a large gold-and-black hand-drawn motif
  (painted once over a big canvas, not tiled). Dark wood + gold panelled side walls and back wall; gold fluted
  columns every 4 m along both side walls and in a row 3 m in front of the back wall. In the BACK wall two tall arched
  windows (2.4 w x 4.5 h, centres x -4 and +4, bottom at 1.2) showing a night neon city painted inside them (lit
  windows, pink/violet/teal neon blocks, dark blue sky, no text). Two banks of 5 slot machines each (machine 0.7 w x
  1.6 h x 0.6 d, a glowing screen of fruit/bell/seven SHAPES, a lit top light), left bank along x -6.5 from z -3 to -11
  facing +x, right bank along x +6.5 facing -x. A roulette table (1.8 x 1.0, wheel at one end) at x +3.2, z -8. A big
  crystal chandelier hanging at x 0, y 6.4, z -7 (warm, self-lit). The shell, carpet, windows and chandelier are ghost;
  the slot machines and roulette are solid. spec.dim 0..1 (0): darkens the whole room a little for the end shots.
- pokerlamp: a big brass dome lamp hanging over the poker table: dome r 0.55 at spec.y (2.3) with a cord to 7.5, a warm
  self-lit underside and a soft warm light pool on whatever is under it (an additive disc r 1.4 at y 0.63). Ghost.
- pokertable: oval, spec.w 2.4 (x) x spec.d 1.4 (z), top at spec.h 0.62; padded dark-brown leather rail 0.11 wide x 0.06
  high round the edge; green felt with a soft hand-drawn texture and one thin gold oval line 0.18 in from the rail;
  two dark wood pedestals on round bases. Solid. Grip height = h (the felt).
- casinoguest: a background guest = a PLAIN GOLDEN POTATO (the cast's own skin colour: read characters/potatobrawl/
  spud.json) in evening clothes, never human: spec.h 0.9; spec.dress "tux" (black jacket, white shirt front, bow tie)
  | "gown" (spec.color, default "#7a1f3d"); two dot eyes + blush like the cast (from the front), a leaf sprout, small
  rounded arms down. Params: sway 0..1 (an idle sway of 3 degrees, from t), cheer 0..1 (both arms up). Solid.
  The top of the head is at y = spec.h (the director puts a thought bubble 0.25 above it).
- chipstack: one stack of poker chips, chip r 0.045, 0.012 thick, spec.n 12, spec.color (one of "#c62828" red,
  "#1e4fb5" blue, "#2e7d32" green, "#222" black, "#f2f2f2" white with a coloured edge), each chip with 6 edge
  stripes; param n (0..spec.n, default spec.n): how many show (bottom first). Origin under the stack's centre. Solid.
- chippile: the pot in the middle of the table: loose chips and short stacks in a heap, footprint r spec.r 0.36, up to
  0.22 high, mixed colours; param amount 0..1 (default 1): 0 = nothing shows, 0.3 = a few stacks, 1 = the full heap
  (grows from the middle out, seeded). Origin on the felt at the heap's centre. Solid. Grip points "L" "R" on its
  flanks for a glove raking it (report them).
- chipmountain: a tall tower of stacked chips (a stepped cone of many stacks, mixed colours, slightly uneven), footprint
  spec.w 0.9 x spec.d 0.6, height spec.h 1.9 at grow 1; param grow 0..1 (height and spread from 0.15 to full; 0 =
  nothing). Origin on the felt. Solid. Panel 06 makes it tower over a seated potato (head top 1.2 m above the floor).
- playcard: one playing card, potato scale 0.11 w x 0.155 h x 0.004, rounded corners; spec.card "2h", "7s", "As", "Ah",
  "Ad", "Ac" (rank + suit: h hearts, d diamonds red; s spades, c clubs black): cream face with the rank in both corners
  and ONE big suit pip in the middle (ranks/suits are the only characters allowed); red back with a fine hand-drawn
  pattern and a cream border. The card stands upright in its xy plane, origin at the middle of its BOTTOM edge, the
  BACK toward +z at flip 0, the FACE toward +z at flip 1 (param flip 0..1 = a half turn about the card's vertical axis).
- cardfan: spec.cards (["As","Ah","Ad","Ac"]) fanned upright, faces toward +z, pivot = origin at the bottom middle
  (where a glove pinches them, the phone hold like sscardfan); param spread 0..1 (0 squared together, 1 = 14 degrees
  apart, each card 0.012 behind the one before). spec.back true = backs toward +z (Spud's two hole cards seen from
  the table). Add SIZE entries for cardfan, playcard and carkeys in grips.mjs (copy sscardfan's).
- carkeys: a car key fob (black rounded body 0.07 x 0.035 x 0.015 with three silver button SHAPES, no logo letters) on a
  silver ring with one metal key; lies flat on its back at rest (origin at the fob's centre underneath). Solid. Grip
  pinch at the fob.
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN:
- the bench (make-casino-props.mjs) shows: (a) a wide of the hall from x 0, y 1.6, z 6 looking at 0, 1.2, -6 (fov 50)
  with the poker table at [0, 0], four sschair at the table (see props-sos.js), the lamp over it, 6 guests among the
  slot machines; (b) the table close from 2 m with a full chippile, two chipstacks and a chipmountain at grow 0.5 and
  1; (c) playcard 2h and 7s face up lying on the felt (use the engine's prop tip) and a cardfan of four aces spread 1;
  (d) carkeys on the felt. Sheet: bench/casino-sheet.png. Every piece reads at 360 px.
- the in-hand proof for cardfan (`node storyboards/lookdev/make-grip-tests.mjs --prop cardfan --hold phone` or the
  hold sscardfan uses): front and side still, the glove closed on the bottom of the fan, nothing through it.
OUT OF SCOPE: thought bubbles, the city, the hotel room (T2, T3), the generator, sounds.
