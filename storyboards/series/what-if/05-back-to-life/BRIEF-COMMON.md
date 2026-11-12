COMMON to tasks T1-T5 of There's a catch EP05 "back to life" (read once, then your own BRIEF-T<n>.md)

STORY: three potato friends in a natural history museum. The Reaper's scythe brings dead things back to life by
touch: a wilted plant, a fossil fish, then (in his panic run) every skeleton in the hall. They all come back
starving, the friends are potatoes, the whole museum chases them out through the front wall into the town square,
and the dropped scythe wakes something hill-sized under the city. 9:16 phone video, seen at 270 px wide.
PANELS: board.png in this folder (Jonny's approved 12-panel sheet, 4 x 3): look at it ONCE for the look you build
toward (bright day, cream stone, glass roof, warm cartoon animals). Not to copy: the pickaxe-like scythe.
LOOK: the engine's 3D cartoon style: chunky rounded shapes, MeshStandardMaterial with hand-drawn canvas textures
(every mark drawn once from a seeded `rnd(i)`, no tiled repeating pattern that reads computer-made), big readable
features. Animals are cute-menacing like the existing `trex` (engine/page/props-dino.js lines 53-195: its eyes,
lids, brows, jaw and how `apply(ps)` reads the state): big bulging eyes with pupils, never realistic, never gory.
Cast scale: a potato is 0.9 m wide and 1.1 m tall. Axes: x right, y up, z toward the main camera; a prop faces +z at rot 0.
RULES: determinism rules in CLAUDE.md (no Math.random, no wall clock; every frame drawable from the params alone,
in any order). Params are plain numbers in the prop state, all 0 at rest unless said; the generator tweens them.
FILE LAYOUT: engine/page/props-nightdiner.js lines 1-70 and 307-330 (usage header, helpers, `X_KINDS = { kind(P) {
... return { group, apply(ps) {...} } } }`: copy that shape exactly); engine/page/props-sos-set.js line 38 (`ghost`:
userData.steam + userData.solid = false = see-through and not solid for the checks; use it on glows, sparks, dust,
glass, and on every set shell the cast walks inside or through).
BENCH: storyboards/series/what-if/04-copy-money/bench/make-nightdiner-props.mjs is the model (59 lines): a small
generator that writes a JSON beside itself, a `plain` set, a few cameras, stills by time. Yours goes in
storyboards/series/what-if/05-back-to-life/bench/. Render stills with
`node engine/render.mjs <bench json> --stills <t,t,...> --draft --safe`, sheet with
`node qa/contact.mjs out/<id>-*.png --out <sheet.png>`. Look at your sheet once (twice at most) before you report.
MACHINE: yours for bench stills only, one job at a time (two other builders share this 4-core box: expect waits).
No layout of the clip, no draft or full render, never the farm. Do not run qa/golden.mjs unless your brief says so.
REGISTRY: engine/page/props3d.js already imports your file's `<NAME>_KINDS` export (a stub is in place: replace it).
EVERY TASK IS DONE ONLY WHEN: the file starts with a usage header (kinds, every spec key and param with its
default, sizes, origin); nothing in the sheet is plain white, untextured or black; it reads at 270 px wide.
OUT OF SCOPE for all: the clip generator, cameras, acting, sounds, props3d.js, other props files, commits.
