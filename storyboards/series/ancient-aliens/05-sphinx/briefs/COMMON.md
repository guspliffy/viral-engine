# Common part of every EP05 Sphinx brief (T1..T3): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `egypt-05-sphinx`. Do not commit.
DESIGN: storyboards/series/ancient-aliens/05-sphinx/DESIGN.md (written by GPT-6.2 Sol from the two approved panel sheets). Its
numbers are the spec. LOOK TARGET: /mnt/project-files/videos/ancient-aliens/05-sphinx/sheets/sphinx-05-sheet-1b.png (panels 01-12) and sphinx-05-sheet-2.png (13-24), 3x4 grids: look once at the panels your brief names; on LOOK the panel wins, on SIZE the number wins. Where DESIGN is silent, choose and list it under
ASSUMPTIONS. Story + panel list:
/mnt/project-files/videos/ancient-aliens/05-sphinx/STORY.md and design/sol-prompt.md (PANELS paragraph) if you need the intent.
WORLD FRAME (decided by the director, overrides any "origin" wording in DESIGN): `sphinx`, `sphinxpit`, `sphinxtemple`,
`khafrevalley`, `savanna`, `hiddenhall` and `leo` are built in DESIGN's WORLD coordinates (section 2: +x east, -z north, the
Sphinx's centreline z 0, pit floor y 0), so the director places each of them at x 0, y 0, z 0, rot 0 and everything lines up
(e.g. the Sphinx Temple's DESIGN "origin (25.60,0,0)" is just where its middle sits in that world). `saltslice` and `surveykit` are
LOCAL props (origin bottom centre, front +z; surveykit's origin = DESIGN's root (11.0,0,5.65), so the director places it there).
SCALE: 0.40 engine m per real m (DESIGN section 2); the cast is Spud 0.88 m.
RULES: docs/VOCAB.md for engine names before any grep; docs/rules/movement.md only if your task animates something.
READ: engine/page/props-bearcamp.js lines 1-145 (header style, helpers) and engine/page/props-eg-serapeum.js lines 1-60 (a props
file of this series: hashes, vertex-colour baking, marks) as the pattern; the header of engine/page/props-aa-giza.js (aasky,
gizaplateau, gizatoday, starfield, orion); your own stub file; nothing else unless your brief names it.
Already wired by the director (do NOT touch engine/page/props3d.js): your file's exports are imported and registered. Keep the
export names in your stub.

House rules for every piece (Jonny: "images with love to the detail, nice to look at, that's what this series lives off"):
- Hand-drawn Ghibli look, very detailed: weathering pits, bed lines, chisel marks, chips, cracks, stains are drawn as individual
  marks, each with its own place, width and strength from the DESIGN section 1 hash of its index (no tiling texture, no
  Math.random, no wall clock; animation only from params and the clip clock the engine passes in).
- Realistic and physical: no sparkles, no magic glow, no floating symbols. Real 3D geometry, never a painting projected onto
  shapes (Jonny rejected projected plates). Bake light into vertex colours where the series does; the set's key light still shades.
- CPU renderer: respect DESIGN's triangle caps; merge geometry per material; no per-mark meshes.
- Every animated value is a prop param (0..1 unless said) with a spec.<name> start value; list in the header any param propState
  has no default for ("seed it with a dur-0 set at 0").
- The file starts with a usage header in the style of props-aa-giza.js: each kind, every spec key with its default, the size, the
  origin and world frame, params, GRIPS, SOLID/standable tops with their heights (the cast stands on the pit floor y 0, on the
  paws only if you make their tops solid: say which).
- Bench: `storyboards/series/ancient-aliens/05-sphinx/bench/make-eg-<name>.mjs` (pattern:
  storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs; Spud, cast id potatobrawl/spud, standing beside
  the piece for scale where it makes sense, 1.2 m clear of anything; tall frame 1080x1920). Render stills with
  `node engine/render.mjs <bench.json> --stills <times> --draft --out <dir>` and make `bench/eg-<name>-sheet.png` with
  `node qa/contact.mjs`. Bench JSONs are generated, not committed. Stills may run beside other builders (4 CPUs, keep to one render
  at a time yourself); do NOT run --layout, preflight on episodes, a draft video or a full render, never the render farm.
  `node qa/preflight.mjs <your bench> --quick` at the end is allowed.
- Look at your own sheet before you report, compare with DESIGN and the panel intent, fix what does not match (two rounds at most).
- OUT OF SCOPE for everyone: clip generators, episode cameras, sound, other files, refactors, commits.

Report as .claude/agents/builder.md says (STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, 150 words at most).
