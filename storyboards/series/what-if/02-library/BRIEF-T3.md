TASK T3: the BOOM's books for What if EP02 "faster than sound": every shelf empties, 120+ books fly, pages fall, a pile.
WHY: the payoff (panels 07, 08): all the sound Phoenix outran arrives at once at 13.5 s and every book leaves every
shelf; by 16-18.9 s Phoenix and Reaper sit in a pile of books up to Reaper's hood, the shelves behind bare, pages still
falling. Jonny's rules: physics on falling props, copy nature (piles clump; many small, few big), clean, never glitchy.
DESIGN: BOARD §5 T3 (storyboards/series/what-if/02-library/BOARD.md); panels 07 and 08 of
/mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/01-faster-than-sound-library/storyboard-eight-panels.png;
Jonny's brief /mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md
(beats 8-9, "Physics and contact").
RULES: docs/rules/movement.md (physics, copy nature); docs/rules/fast-cheap.md (determinism, the golden check).
READ: CLAUDE.md; engine/page/props-library.js (libstack, libbook: the shelves and books to empty and match);
engine/page/props-whatif.js (file layout, apply(ps)); engine/page/props-energy.js lines 1-60 (userData.steam:
see-through for the checks); storyboards/lookdev/make-physics-bench.mjs (a bench); the clip's generator
storyboards/series/what-if/02-library/make-faster-than-sound.mjs lines 30-100 (the shelves, the table, the seats) read
only. Nothing else unless blocked.
OWN: engine/page/props-whatif-blast.js (replace the stub; keep the export name WHATIFBLAST_KINDS);
engine/page/props-library.js (only: libstack's new `bare` param and an exported helper giving its book slots);
storyboards/series/what-if/02-library/bench/make-blast.mjs and the JSON it writes. Touch nothing else.
CONTRACT: BOARD §5 T3 exactly: libstack `bare` 0..1 (default 0 draws exactly as today), `bookstorm` (spec.stacks,
spec.t0, spec.keepout; param clock), `pagefall` (spec.box, spec.t0, spec.dur, spec.floorY; param clock), `bookpile`
(spec.mounds, spec.holes; param fill). InstancedMesh; every pose computed from exact inputs (integrate from t0 at a
fixed 1/240 s step each frame, or cache keyed on the exact clock value), any frame in any order. Not solid for the
contact checks (userData.steam or the library's own way). The director wires times and places into the clip.
MACHINE: yours for bench `--layout` and `--stills` only, one at a time (if `pgrep -f "engine/render.mjs"` shows
another, wait), plus `node qa/golden.mjs` once at the end (props-library.js changed); never a draft or full render of
the clip, never the farm.
DONE WHEN:
- the bench: the clip's four libstacks (x -1.9 / -0.2 / 1.5 / 3.2, z -6.5, l 1.7, h 2.7, d 0.44, shelves 6, seeds
  3 / 14 / 25 / 36) and a table at [-0.7, 0] (1.7 x 0.8, top 0.62), seen from the clip's boom camera (pos
  [-1.0, 3.4, 12.0], look [-0.6, 1.5, -1.5], fov 28); bookstorm t0 1.0, stills at 0.98, 1.1, 1.5, 2.2, 3.5 (shelves
  emptying as the books leave, 120+ in the air at 1.5, all at rest by 3.5, none inside keepout circles at [-1.25,
  -0.72, 0.4] and [0.05, -0.72, 0.4]); pagefall from 1.6; a bookpile with mounds round the two seats (peak 1.0 m
  behind them, 0.6 at the sides, 0.3 in front of the table) at fill 0.5 and 1, holes at the two seats.
- stills contact sheet at storyboards/series/what-if/02-library/bench/blast.png (qa/contact.mjs), looked at once by you.
- frame 1.5 rendered alone equals frame 1.5 rendered in sequence; `node qa/golden.mjs` passes (bare 0 unchanged).
- the bench storm costs under 30 ms per frame on top of the scene (print it).
OUT OF SCOPE: the generator, cameras, acting, the tower (the director's c.throw), sounds, other engine files.
Report back: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
