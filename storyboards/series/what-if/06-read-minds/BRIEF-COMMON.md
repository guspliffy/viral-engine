COMMON to tasks T1-T3 of There's a catch EP06 "read minds" (read once, then your own BRIEF-T<n>.md)

STORY: four potato friends play poker in a grand casino at night. Spud (lead) can suddenly read minds: a thought
floats over its owner's head as a clear soap bubble with ONE small solid object inside. He wins every hand, then the
power spreads: bubbles over every guest, over the whole neon city, the casino fills wall to wall, he cannot find the
one thought that matters, loses everything, and lies awake in a hotel room while bubbles stream in through the
window. 9:16 phone video, seen at 270-360 px wide.
PANELS: board.png in this folder (Jonny's approved 12-panel sheet, 4 x 3): look at it ONCE for the look you build
toward (warm brass lamps, red patterned carpet, gold columns, glowing slot machines, green felt, neon city at night).
Not to copy from it: the dark-suited guests at the back of 02-03 who look HUMAN (every guest is a potato), the bubble
tails (bubbles are perfectly round, no tail, no trail of dots).
LOOK: the engine's 3D cartoon style: chunky rounded shapes, MeshStandardMaterial with hand-drawn canvas textures
(every mark drawn once from a seeded `rnd(i)`, NO tiled repeating pattern that reads computer-made: Jonny 11 Nov),
big readable shapes, rich warm colour. NO letters or words anywhere (signs are glowing shapes and symbols only); the
only characters allowed are playing-card ranks and suits.
CAST SCALE: Spud is 0.88 m tall, Wedge 0.98, Chip 0.53, Mash 1.24; a seated potato sits on a chair seat at 0.42 m.
A glove is about 0.12 m across. Axes: x right, y up, z toward the main camera; a prop faces +z at rot 0.
RULES: determinism rules in CLAUDE.md (no Math.random, no wall clock; every frame drawable from the params alone, in
any order). Params are plain numbers in the prop state, all 0 at rest unless said; the generator tweens them.
FILE LAYOUT: engine/page/props-nightdiner.js lines 1-70 and 307-330 (usage header, helpers, `X_KINDS = { kind(P) {
... return { group, apply(ps) {...} } } }`: copy that shape exactly); engine/page/props-sos-set.js line 38 (`ghost`:
userData.steam + userData.solid = false = see-through and not solid for the checks; use it on glows, sparks, light,
glass, bubbles, and on every set shell the cast stands inside).
REGISTRY: engine/page/props3d.js already imports your file's `<NAME>_KINDS` export (a stub file is in place: replace it).
BENCH: storyboards/series/what-if/04-copy-money/bench/make-nightdiner-props.mjs is the model: a small generator that
writes a JSON beside itself, a `plain` set, a few cameras, stills by time. Yours goes in
storyboards/series/what-if/06-read-minds/bench/. Stills: `node engine/render.mjs <bench json> --stills <t,t,...>
--draft --safe`; sheet: `node qa/contact.mjs out/<id>-*.png --out <bench folder>/<name>-sheet.png`. Look at your sheet
once (twice at most) before you report.
MACHINE: yours for bench stills only, one job at a time (two other builders and the director share this 4-core box:
expect waits). No layout of the clip, no draft or full render, never the farm. No qa/golden.mjs.
EVERY TASK IS DONE ONLY WHEN: the file starts with a usage header (kinds, every spec key and param with its default,
sizes, origin, where a hand holds it); nothing in the sheet is plain white, untextured or black; it reads at 270 px.
OUT OF SCOPE for all: the clip generator, cameras, acting, sounds, props3d.js, other props files, commits.
