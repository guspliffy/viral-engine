TASK T4: the small props of the snowed-in cottage: the chopping block, the last log, the matchstick heap and its
armful, planks, hammer, two chairs, blankets, icicles, snow inside the room, a chimney lightning bolt, the green patch
WHY: Survive it EP1's three fails are props: the Samurai chops the woodpile into a heap of matchsticks (panel 01), the
heap goes on the fire in one armful, Reaper nails planks over the door and window and throws the chairs (panel 04), the
frosted four huddle in blankets while snow trickles in (panel 05), the room lurches and everything slides, and on DAY 100
the door opens on a green patch with three flowers (panel 07).
DESIGN: Jonny's panels /mnt/project-files/video-scripts/2026-11-08-survive-it/panels-01-snowed-in/01-snowed-in-sheet.png
(01 the block, the heap and the flying chips, the one log in Viking's gloves; 04 the plank across the door and the
hammer; 05 the blankets and the snow in the board gaps; 07 the grass and flowers); brief
/mnt/project-files/video-scripts/2026-11-08-survive-it/01-snowed-in-7-days-ENGINE-PROMPT.md ("New props and designs").
Sizes are for the cast's real size: the potatoes stand 1.33-1.42 m tall, eyes at 0.71 m, gloves about 0.15 m.
RULES: docs/rules/characters-grips.md (holds), docs/rules/movement.md (physics), CLAUDE.md
READ: engine/page/props3d.js (how a props file registers KINDS, keyed values, physics bodies via spec.body),
engine/page/props-ikea.js (plank), engine/page/props-dino.js (firelog), engine/page/props-bonfire.js (blanket),
engine/page/props-freefall.js (skybolt), engine/page/props-okilied.js (embers, drips), storyboards/lib/grips.mjs (SIZE and
box); nothing else unless blocked.
OWN: a new engine/page/props-survive-snow.js and its registry lines in engine/page/props3d.js (other builders add lines
there too: re-read the file right before editing, change nothing else); new SIZE lines in storyboards/lib/grips.mjs
for the props a glove holds (log, plank, hammer, chair; nothing else in that file); a bench
storyboards/lookdev/make-snowprops-bench.mjs + JSON. Touch nothing else.
CONTRACT (kinds and keys the generator will use; reuse an existing kind where it fits and say so):
- `choppingblock`: a tree-stump block 0.42 m across, 0.4 m tall, bark sides, a pale cut top with rings and an axe mark.
- the one log: `firelog` (props-dino.js) at len 0.5, r 0.09 if it reads as firewood (bark, cut ends); grips SIZE entry
  so `grips.box` holds it in both gloves at its two ends.
- `sliverheap`: a heap of thin split sticks (matchstick-like, 0.25-0.4 m long, 1.5-2.5 cm thick) at the block's foot;
  `amount` 0..1 grows it from nothing to a heap 0.6 m across and 0.3 m tall; `chop` keys [[t]] each spit 8-12 chips that
  fly out in arcs and land on the heap (deterministic motion from story time, not physics bodies); `knock` [t, dx, dz]
  slides the whole heap and scatters it toward a direction (the lurch).
- `kindlingarmful`: the same sticks as a bundle held across both arms (0.55 m wide, 0.25 m deep), with a grips SIZE entry
  (box hold); `dump` 0..1 lets the sticks fall out forward in a tumble (into a fireplace 0.5 m ahead and 0.3 m down).
- `boardplank`: a rough nailed plank 1.1 x 0.18 x 0.035 m with two nail heads at each end; a physics body when knocked
  or thrown (spec.body). Grips SIZE entry (one-hand hold at one end).
- `hammer`: a claw hammer 0.32 m (wood handle, iron head), grips SIZE entry (one-hand hold on the handle).
- `woodchair`: a rustic wooden chair (seat 0.45 m high, back 0.9 m, 0.45 m square), a physics body when thrown or
  knocked; grips SIZE entry (two hands on the back rail).
- `huddleblanket`: one big patchwork quilt draped over the shoulders and backs of 2-4 potatoes standing close
  (spec.over: [[x, z, height], ...] the potatoes it covers, faces and hands left free in front); `cover` 0..1 (1 on,
  0 slid off behind them). Cel cloth, warm colours (red, mustard, brown), no physics. With one entry in spec.over it is
  a single blanket wrapped round one potato's shoulders (panel 05 has three potatoes, each in their own).
- `iciclerow`: a row of icicles under an edge (spec.len metres of edge, spec.count), `grow` 0..1 (0 to 0.25 m long);
  `icicle`: one icicle that can drop (a physics body, a small `tink`-sized thing).
- `snowthroat`: snow packed into a fireplace's throat (fits an opening 1.1 m wide, 1.0 m tall), `trickle` 0..1 a thin
  cel stream of snow falling from it.
- `snowspray`: cel snow jets bursting through the gaps of a boarded window or door (spec.w, spec.h), `on` 0..1.
- `snowdrift`: loose room snow banked against a wall (spec.w, spec.d), `depth` 0..1 (0 to 0.5 m, "knee-deep").
- `chimneybolt`: a white-blue cel lightning bolt crawling up the inside of a chimney breast 1.7 m wide from the fire
  opening to the ceiling (panel 05), `on` 0..1 with a flicker (reuse skybolt's look if it fits).
- `lograck`: a small wooden rack with split logs beside the block, `logs` 3..0 (each log vanishes into the chopping).
- `sunbeam`: a thin cel shaft of warm sunlight through a board gap (spec.len, spec.w 0.06), `on` 0..1, `sweep` 0..1
  slides it sideways 0.4 m (it crawls over a face), with a few dust motes.
- `snowlump`: a soft cel lump of snow (spec.r 0.03-0.2) to sit anywhere: on a head like a little hat, a dab on a nose.
- `greenpatch`: a hollow in melting snow 1.6 m across with bright green grass and three flowers (white, pink, yellow,
  panel 07), `grow` 0..1.
- Deterministic everywhere (story time, per-prop seed); cheap on CPU.
MACHINE: benches only: draft stills (`node engine/render.mjs <bench> --stills ... --draft --safe`, one at a time; other
builders share the box). No clip layouts or renders, no golden needed (props-only), no farm.
DONE WHEN:
- bench in the "xmasroom" set (warm light) with duo/viking holding the log in both gloves (grips.box) and
  never-has-money/reaper holding the hammer: every prop at its sizes in one still or two, plus stills of sliverheap
  amount 0.3 and 1 with chips mid-air, kindlingarmful dump 0.5, huddleblanket over three potatoes, snowspray on 1 over
  a plank-boarded 1.4 m window, chimneybolt on 1; contact sheet at 360 px wide per still in
  /mnt/project-files/videos/survive-it/02-snowed-in/props-bench/snowprops.png (full stills beside it)
- each prop reads at 360 px wide; the gloves sit on the log's ends and the hammer's handle with no glove inside a prop
  (`node engine/render.mjs <bench> --layout` on the bench: contact gate clean for the holds)
OUT OF SCOPE: the room, the hearth fire, the outside, the avalanche, the cast's frost and steam (other tasks); any clip
generator; acting.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
