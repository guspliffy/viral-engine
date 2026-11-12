COMMON to tasks T1-T3 of There's a catch EP07 "time travel" (read once, then your own BRIEF-T<n>.md)

STORY: a night world-final sprint in a packed stadium in pouring rain. Spud (lead) loses by a nose to Wedge, clicks a
brass pocket watch and time runs backward (the raindrops rise). He wins, but Wedge in rage brings a TV camera crane
down on Spud's best friend Chip (ambulance). Second jump: Spud drags Chip to the top row, wins again, Chip comforts
the crying Wedge on the giant screen and the crowd boos Spud. Third jump: Spud winds the watch too hard, the seasons
flash past, the watch bursts: one year earlier, the same stadium empty at grey dawn in the rain; Chip doesn't know him,
then offers his hand. 9:16 phone video, seen at 270-360 px wide.
PANELS: board.png in this folder (Jonny's approved 15-panel sheet, 5 x 3): look at it ONCE for the look you build
toward (white floodlights through heavy rain at night, a shining wet red track, steep stands packed with potato
spectators under umbrellas, a giant video screen, blue ambulance light, cold grey dawn on the empty stadium).
LOOK: the engine's 3D cartoon style: chunky rounded shapes, MeshStandardMaterial with hand-drawn canvas textures
(every mark drawn once from a seeded `rnd(i)`, NO tiled repeating pattern that reads computer-made: Jonny 11 Nov),
big readable shapes, rich colour. NO letters or words anywhere except where your brief says (Chip's sign).
Every spectator, medic and official is a potato (golden skin #e2a95c, dot eyes, blush, leaf sprout), never a human.
CAST SCALE: Spud is 0.88 m tall, Wedge 0.98, Chip 0.53. A glove is about 0.12 m across. Axes: x right, y up, z toward
the main camera; a prop faces +z at rot 0.
WORLD (the director's numbers; build to them): the finish line is at x 0 across the track; runners run toward +x.
Six lanes 1.22 wide across z from -3.66 to +3.66 (lane 1 nearest the stands, centre z -3.05). The stands are on the
-z side: an apron from z -3.66 to -5.0 at y 0 with the crowd barrier along z -4.0; the first tier's front wall at
z -5.0 is 0.9 high; 28 tiers each 0.8 deep and 0.42 high rising toward -z (top tier at z -26.6, y 12.2); an aisle
stair 1.2 wide centred on x +4.0 (two steps per tier, 0.21 rise, 0.4 deep). Stands run x -50..+50.
The giant screen hangs centred at x 0, z -30, its bottom at y 13. Floodlight towers 35 m tall at x +-45, z -30 and
x +-45, z +45. A second copy of the stadium stands at x +1000 (one year earlier, empty, dawn).
RULES: determinism rules in CLAUDE.md (no Math.random, no wall clock; every frame drawable from the params alone, in
any order). Params are plain numbers in the prop state, 0 at rest unless said; the generator tweens them.
FILE LAYOUT: engine/page/props-nightdiner.js lines 1-70 and 307-330 (usage header, helpers, `X_KINDS = { kind(P) {
... return { group, apply(ps) {...} } } }`: copy that shape exactly); engine/page/props-sos-set.js line 38 (`ghost`:
userData.steam + userData.solid = false = see-through and not solid for the checks; use it on glows, sparks, light,
glass, rain, and on every set shell the cast stands inside). A param that propState has no default for reads
spec.<name> until a tween sets it (engine/page/props-race.js header says how).
REGISTRY: engine/page/props3d.js already imports your file's `<NAME>_KINDS` export (a stub file is in place: replace it).
If a hand grips your prop, export `<NAME>_GRIPS` too and report it: the director adds it to the registry.
BENCH: storyboards/series/what-if/04-copy-money/bench/make-nightdiner-props.mjs is the model: a small generator that
writes a JSON beside itself, a `plain` set, a few cameras, stills by time. Yours goes in
storyboards/series/what-if/07-time-travel/bench/. Stills: `node engine/render.mjs <bench json> --stills <t,t,...>
--draft --safe`; sheet: `node qa/contact.mjs out/<id>-*.png --out <bench folder>/<name>-sheet.png`. Look at your sheet
once (twice at most) before you report.
MACHINE: yours for bench stills only, one job at a time (two other builders and the director share this 4-core box:
expect waits). No layout of the clip, no draft or full render, never the farm. No qa/golden.mjs. No commits.
PERFORMANCE: the renderer is CPU only (llvmpipe). Big counts (crowds, rain, shards) must be InstancedMesh or merged
geometry with a few materials; keep every kind under ~60k triangles; no real-time shadows from rain or crowd.
EVERY TASK IS DONE ONLY WHEN: the file starts with a usage header (kinds, every spec key and param with its default,
sizes, origin, where a hand holds it); nothing in the sheet is plain white, untextured or black; it reads at 270 px.
OUT OF SCOPE for all: the clip generator, cameras, acting, sounds, props3d.js, other props files, commits.
Report back: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words.
