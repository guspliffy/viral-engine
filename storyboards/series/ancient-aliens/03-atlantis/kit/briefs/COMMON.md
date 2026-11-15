# Common part of every Atlantis kit brief (T1..T6): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `aa-03-atlantis-kit`. Do not commit.
DESIGN (the spec, read your sections fully): /mnt/project-files/videos/ancient-aliens/03-atlantis/DESIGNS.md (palette section 0
+ the sections your brief names). Engine numbers: storyboards/series/ancient-aliens/03-atlantis/kit/BOARD.md (places, axes,
depth, lights). THE TARGET LOOK: the drawn panel sheets /mnt/project-files/videos/ancient-aliens/03-atlantis/sheets/
ancient-aliens-03-sheet-{1..4}.png (1536 x 1024, 12 numbered panels each). LOOK at the panels your brief names before you
start and again before you report: your bench stills must look like those panels.
RULES: docs/rules/movement.md only if your task animates something.
READ: the usage header and the first kind of the pattern file your brief names; your own stub file; nothing else unless
your brief names it. Other builders work in this checkout at the same time: touch only your OWN files.

Already wired by the director (do NOT touch engine/page/props3d.js or costumes-cast.js): your file's `AT_<NAME>_KINDS`
and `AT_<NAME>_GRIPS` exports are imported and registered. Keep those export names.

THE PRODUCER'S BAR (Jonny, 15 Nov): "create the video with much love to the detail" and "the new sceneries ... and new
props all should look beautiful and well done". Every MUST layer in your DESIGNS.md sections is part of DONE. A still
that looks plain, bare, flat-coloured or "procedural" is not done. Beauty beats speed: if something can't be beautiful
in the time, report it rather than ship it plain.

House rules for every piece:
- Hand-drawn Ghibli look, very detailed: joints, rivets, chips, moss, weed, tool marks, cloth folds, roof tiles are
  individual marks, each with its own place, width and strength from a hash of its index (no tiling texture, no
  Math.random, no wall clock; animation only from params and the clip clock t the engine passes to apply(ps, t)).
- Realistic and physical: no sparkles, no magic glow, no floating symbols. Light beams are soft physical columns.
- WIDE FIRST: the film is 1920 x 1080. Wide establishing views must be rich to the horizon: layered far distance,
  never a bare horizon or an empty half of the frame.
- Axes and places: BOARD section 1. +y up, +x screen right from the default camera, the default camera on +z looking
  -z. Origin of a piece = bottom centre unless said. Metres, real scale (Spud 0.88). Sea level y 0.
- Depth: BOARD section 1 (near plane 0.05): beyond 500 m never two surfaces closer than 1.5 m.
- Scenery is `userData.lookOnly` and not solid unless your brief names a standable top (give its height).
  Place-wide merged meshes also set userData.surfaceOnly (contact gate judges the surface only).
- Every animated value is a prop param with a spec.<name> start value; list them in the header.
- Performance: CPU renderer. Merge static geometry per material (a handful of draw calls per kind), instancing for
  repeats (roofs, trees, ships far, fish), canvas textures drawn once per spec (cache by spec key).
- The file starts with a usage header in the style of engine/page/props-sh-items.js: each kind, every spec key with
  its default, the size, the origin, params, standable tops with their height.
- Bench: `storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-<name>.mjs` (pattern:
  storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-items.mjs; one group per camera; the bench storyboard
  carries `frame: "wide"` and `far` per BOARD section 1 at its top level; base set as in that pattern, lighting from BOARD
  section 2 where it matters; include Spud, cast id potatobrawl/spud, for scale where it makes sense, 1.2 m clear of
  anything). Generated bench JSON is not committed. Render stills with
  `node engine/render.mjs <bench.json> --stills <times> --draft --out out/at-<name>` and make
  `bench/at-<name>-sheet.png` with `node qa/contact.mjs`. Stills may run beside other builders; do NOT run --layout,
  preflight, a draft video or a full render, and never the render farm. One still takes about 30 s.
- MACHINE: 4 cores shared by three builders: render only the stills you need, one at a time.
- Look at your own sheet before you report, compare it with the named panels, fix what does not match (two rounds).
- OUT OF SCOPE for everyone: clip generators, episode cameras, sound, other files, refactors, commits.

Report as .claude/agents/builder.md says (STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, 150 words at most).
