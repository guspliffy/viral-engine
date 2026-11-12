TASK T1: set "stormlake" - the storm lake world above and below the water (EP02 You wake up mid sinking car)
WHY: panels 01, 03, 10, 11, 12: a car flies off a snapped bridge into a stormy lake, sinks; three potatoes swim up through
murky green water and crawl onto a muddy reed shore. The world must read at 360 px wide on a phone.
DESIGN: storyboards/series/you-wake-up-mid/02-sinking-car/DESIGN.md sections 1, 2, 4 and 5 "T1" (Fable's numbers: build
exactly these); panels in board.png next to it (4x3 grid). Outline: OUTLINE.md there.
RULES: docs/rules/fast-cheap.md (determinism, render cost), docs/rules/movement.md (scenery), CLAUDE.md.
READ: DESIGN.md; engine/page/sets.js (how a set type is dispatched, one line to add); engine/page/set-snowslope.js (the
closest 3D world set: copy its structure, exports and spec handling); engine/page/props-freefall.js header (rainstreaks,
reused by the director, not by you); docs/STORYBOARD.md section on `set`. Nothing else unless blocked.
OWN: engine/page/set-stormlake.js (new), ONE dispatch line in engine/page/sets.js, a bench
storyboards/series/you-wake-up-mid/02-sinking-car/bench/make-stormlake-bench.mjs (+ its JSON). Touch nothing else (no cast,
material, shader-library or props3d.js changes).
CONTRACT: set spec { type: "stormlake", lip: true, under: "auto", shafts: [x, z], wipe: 0, hole: null, dark, lighting, hatch,
cel, ink, satsuei (as other sets pass them) } with time-tweenable keys `hole` [x, z, yaw, halfL, halfW], `shafts` [x, z] and
`wipe` 0..1 (tell me in the header how a storyboard tweens set keys; if sets cannot take tweened keys, say so and offer the
smallest route, e.g. a companion prop kind, and STOP for my answer before building it). Export STORMLAKE { waveAt(x,z,t),
heightAt(x,z) (ground/bed y), SHORE, LIP, DECK_Y, numbers }. Underwater (camera y < 0, auto): scene fog per DESIGN 2; for
the cast/car green grade use ONE screen-space multiply quad (#a8d8c0, strength by camera depth) instead of editing cast
materials; ink line colour change only if the set can reach it without editing shared files (else report it).
MACHINE: stills only (`node engine/render.mjs <bench> --stills ...`), one render job at a time on this 4-core box: before
each, wait while `pgrep -f "engine/render.mjs"` finds another. No draft/full renders, never the render farm.
DONE WHEN:
- the 6 proof stills of DESIGN 5 T1.6 at the cameras of DESIGN 1.6 (0.0, 2.5, 19.0, 24.0, 27.0, 30.0) with stand-in boxes
  (car 3.3 x 1.1 x 1.6 m, potatoes 0.65 m spheres), one contact sheet at full size and one at 360 px wide
  (node qa/contact.mjs), and the render time per frame above and under water (target: under 2x the snowslope set's)
- the bridge lip, the hills, rain and the choppy water read in the 2.5 s still at 360 px; the 24.0 still shows car, three
  stand-ins, at least 4 light shafts and the bright ceiling
- `node qa/preflight.mjs <bench> --quick`: no FAIL; `node qa/golden.mjs` unchanged (you only add a set)
- the file starts with a usage header: spec keys + defaults, exports, world frame, sizes, where SHORE and the lip are
- `node tools/vocab.mjs` run after
OUT OF SCOPE: cast, car, cabin water, glass, headlights, bubbles (T2), the generator, sound, any other set.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md). Don't commit.
