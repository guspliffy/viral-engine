# Common part of every EP04 Serapeum brief (T1..T4): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `egypt-04-serapeum`. Do not commit.
DESIGN: storyboards/series/ancient-aliens/04-serapeum/DESIGN.md (written by GPT-6.2 Sol from the approved sheets). Its numbers
are the spec. IGNORE every spoken line in DESIGN.md section 8 (the dialogue is in lines.mjs, not your business) and ignore
section 8's cameras and blocking (the director's). Section 2 "Scale": masonry 0.55x, cast 1.0x (Spud 0.88 m).
LOOK TARGET: the two approved sheets /mnt/project-files/videos/ancient-aliens/04-egypt/sheets/egypt-04-sheet-1.png (panels
01-12) and egypt-04-sheet-2.png (13-24): look once at the panels your brief names (they are 16:9 cells in a 3x4 grid).
Where a number and a panel disagree on LOOK, the panel wins; on SIZE, the number wins.
RULES: docs/VOCAB.md for engine names before any grep; docs/rules/movement.md only if your task animates something.
READ: engine/page/props-bearcamp.js lines 1-145 (header style, helpers, see-through beam `steamy`, `glowSprite`) as the pattern
for a props file; your own stub file; nothing else unless your brief names it.
Already wired by the director (do NOT touch engine/page/props3d.js or costumes-cast.js): your file's exports are imported and
registered. Keep the export names in your stub.

House rules for every piece (Jonny: "images with love to the detail, nice to look at, that's what this series lives off"):
- Hand-drawn Ghibli look, very detailed: chisel marks, chips, cracks, stains, frayed threads, wood grain are drawn as individual
  marks, each with its own place, width and strength from a hash of its index (DESIGN.md section 2 gives the q() hash; no tiling
  texture, no Math.random, no wall clock; animation only from params and the clip clock the engine passes in).
- Realistic and physical: no sparkles, no magic glow, no floating symbols. A light beam is a soft see-through column made visible
  by slow pale dust motes (seeded, on the clip clock). Real 3D geometry, never a painting projected onto shapes.
- Origin bottom centre, front +z, metres, unless DESIGN.md says otherwise.
- Every animated value is a prop param (0..1 unless said) with a spec.<name> start value; list in the header any param
  propState has no default for ("seed it with a dur-0 set at 0").
- The file starts with a usage header in the style of props-bearcamp.js: each kind, every spec key with its default, the size,
  the origin, params, GRIPS and how a hand touches it, SOLID/standable tops with their height.
- Bench: `storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-<name>.mjs` (pattern:
  storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs; one group per camera, 30 m apart or more;
  Spud, cast id potatobrawl/spud, beside each piece for scale where it makes sense, 1.2 m clear of anything). Render stills with
  `node engine/render.mjs <bench.json> --stills <times> --draft --out <dir>` and make `bench/eg-<name>-sheet.png` with
  `node qa/contact.mjs`. Bench JSONs are generated, not committed. Stills may run beside other builders; do NOT run --layout,
  preflight on episodes, a draft video or a full render, and never the render farm. `node qa/preflight.mjs <your bench> --quick`
  at the end is allowed.
- Look at your own sheet before you report, compare with the named panels, fix what does not match (two rounds at most).
- OUT OF SCOPE for everyone: clip generators, episode cameras, sound, other files, refactors, commits.

Report as .claude/agents/builder.md says (STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, 150 words at most).
