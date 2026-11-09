TASK T1: the daylight library's dressing for What if EP02 "faster than sound" in one props file, with a bench.
WHY: Jonny's eight panels stand on a hanging finger-to-lips QUIET sign over the issue desk (01, 07), a brass book
trolley that spins empty (04), two hanging brass lamps that swing at the late thump (04), a green orb on the desk (01),
and the episode's test, a longcase clock whose ticks get louder before the BOOM (the clock insert at 12.25-12.75).
DESIGN: BOARD §5 T1 (storyboards/series/what-if/02-library/BOARD.md) has every size; panels
/mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/01-faster-than-sound-library/storyboard-eight-panels.png
(4x2, read it for the look); Jonny's brief /mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md ("Place").
RULES: determinism rules in CLAUDE.md; docs/rules/movement.md "Copy nature for scenery" only.
READ: CLAUDE.md; engine/page/props-whatif.js (the file layout to copy: header comment listing each kind, mat/mesh
helpers, canvas textures, KINDS entries with apply(ps); `parkclock` shows a dial texture and how a param reaches
apply()); engine/page/props-energy.js lines 1-60 (`glowy`: additive glow, see-through for the checks via
userData.steam); engine/page/props-library.js (`libbook`, `greenlamp`: the library's wood and brass look to match);
storyboards/lookdev/make-physics-bench.mjs and `git show origin/what-if-03-light-speed:storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs`
(bench generators; a param tweened with the clip time is `c.prop(0, id, {clock: 0}, 0, "linear"); c.prop(0, id, {clock: END}, END, "linear")`).
Nothing else unless blocked.
OWN: engine/page/props-whatif-library.js (replace the stub; keep the export names WHATIFLIB_KINDS and WHATIFLIB_GRIPS),
storyboards/series/what-if/02-library/bench/make-library-props.mjs and the JSON it writes. Touch nothing else (the
props3d.js registry already imports the file; if a node-side list must know the new kinds, e.g. a size table in
engine/ or qa/, report it as BLOCKED with the file and line, don't edit it).
CONTRACT: BOARD §5 T1 exactly: `longclock` (params swing, time, clock; spec.ticks), `quietsign` (swing), `bookcart`,
`brasslamp` (swing), `orbstand` (glow), `libpage` (bend). Solid / not solid as the BOARD says. No point lights.
MACHINE: yours for bench `--layout` and `--stills` only, one at a time (another builder may be rendering: if
`pgrep -f "engine/render.mjs"` shows one, wait for it); never a draft or full render, never the farm, never the clip.
DONE WHEN:
- the bench (plain floor, daylight from the left, one camera per group, a potato for scale, e.g. `potatobrawl/sorcerer`
  beside the clock): longclock at ticks [1, 1.5, 2, 2.4] with stills at 1.0 and 1.25 (pendulum at both ends, minute
  hand a notch apart) plus a close on the dial; quietsign at swing 0 and 70; bookcart with 10 libbooks on its top tray
  (books resting on it, not floating or sunk: top face y 0.44); brasslamp at swing 0 and 25; orbstand on a 0.95 m
  table, glow 1; libpage flat and bend 1.
- `node engine/render.mjs <bench> --layout`: no errors; stills contact sheet at
  storyboards/series/what-if/02-library/bench/library-props.png (qa/contact.mjs), looked at once by you.
- the sign's picture reads as a finger to the lips at 300 px wide; no letters anywhere.
OUT OF SCOPE: the clip generator, cameras, acting, the plate, sounds, engine/ files other than your own, renders of the clip.
Report back: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
