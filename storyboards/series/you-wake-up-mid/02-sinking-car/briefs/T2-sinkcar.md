TASK T2: props-sinkcar.js - water inside the car, glass panes + burst + pour, dash lights, headrest, headlight beams, bubbles
WHY: panels 04-11: water rises inside the hatchback (the clock the viewer sees), the driver's side window bursts under a
headrest's prongs and the lake pours in; underwater the headlights fade into the murk and bubbles stream up.
DESIGN: storyboards/series/you-wake-up-mid/02-sinking-car/DESIGN.md section 3 (all), section 2 "Bubbles" and "Headlights",
section 4, and 5 "T2" (Fable's numbers: build exactly these); panels 04-11 in board.png next to it (4x3 grid).
RULES: docs/rules/fast-cheap.md (determinism, render cost), docs/rules/characters-grips.md (the held headrest), CLAUDE.md.
READ: DESIGN.md; engine/page/car-hatchback.js (HATCH numbers, the window openings, how a rig is built); engine/page/
props-road.js (carseat, steer: measure the cushion top and the seat's own headrest); engine/page/props-wakeup-fx.js (a prop
file of this series: header style, how keys and steam flags are done); engine/page/props3d.js (only the registry/import
lines and propState); engine/page/props-shark.js (splash, bubbles: reuse if they fit, say which). Nothing else unless blocked.
OWN: engine/page/props-sinkcar.js (new); the import + registry lines for it in engine/page/props3d.js; headrest SIZE entry
in storyboards/lib/grips.mjs; a bench storyboards/series/you-wake-up-mid/02-sinking-car/bench/make-sinkcar-bench.mjs (+ JSON).
Touch nothing else (not car-hatchback.js: if the panes need the rig changed, STOP and report).
CONTRACT: kinds cabinwater, carglass, dashglow (+ an exported frame-table helper for the 11.5 s flicker), headrest,
headbeams, lakebubbles (only if props-shark bubbles cannot take rate/size/rise). Every kind that belongs to the car takes
`rig: "<car rig id>"` like carseat/steer in the EP01 generator (storyboards/series/you-wake-up-mid/01-plane-crash/
make-plane-crash.mjs lines 160-175 show how). cabinwater's surface stays level IN THE WORLD under the rig's pitch/roll; keys
as DESIGN 3 names them (level, dim, agit, hiss; carglass drop, burst, pour; dashglow on; headbeams lamps). The world's
water surface is y 0 (the stormlake set, built in parallel by T1: do not depend on it; your bench uses set "plain").
MACHINE: stills only, one render job at a time on this 4-core box: before each, wait while `pgrep -f "engine/render.mjs"`
finds another. No draft/full renders, never the render farm.
DONE WHEN:
- the proof stills of DESIGN 5 T2.5 (4.5, 9.0, 11.5, 12.2, 13.5 +2/+5/+12 frames, 16.0, 19.0) in the real hatchback rig
  pitched as DESIGN 2 "The car's fall" gives, with stand-in boxes for the three seated (0.65 m, at the driver, passenger and
  rear seats), from a camera inside the cabin like panels 04-09; contact sheet full size + 360 px wide; a 10 fps strip of
  13.4-14.4 s
- burst: the crazed pane reads in ONE frame at 360 px; no cube is left after t0 + 0.9 s except the 30 rim cubes
- headrest: SIZE entry + in-hand proof (node storyboards/lookdev/make-grip-tests.mjs --prop headrest --hold <a two-hand
  hold that fits>), front and side stills, nothing through the glove
- the measured cabin numbers (floor, cushion top, sill, openings) in the file's usage header; every key with its default
- `node qa/preflight.mjs <bench> --quick`: no FAIL; `node qa/golden.mjs` unchanged; `node tools/vocab.mjs` run after
OUT OF SCOPE: the lake set, the generator, acting, cameras, sound, any change to the rig or seats.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md). Don't commit.
