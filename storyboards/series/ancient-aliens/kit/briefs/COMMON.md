# Common part of every kit brief (T1..T6): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `ancient-aliens-kit`. Do not commit.
DESIGN: storyboards/series/ancient-aliens/kit/BOARD.md (palette section 1, sizes section 2). Look target: the three
approved panel sheets /mnt/project-files/videos/ancient-aliens/01-pyramids/ancient-aliens-01-sheet-{1,2,3}.png (look at
the panels your brief names, once). Design words: /mnt/project-files/videos/ancient-aliens/01-pyramids/DESIGNS.md.
RULES: docs/rules/movement.md only if your task animates something; docs/VOCAB.md for engine names before any grep.
READ: engine/page/props-bearcamp.js lines 1-140 (header style, helpers, see-through beam: `steamy`, `glowSprite`, the
ShaderMaterial at ~436) as the pattern for a props file; your own stub file; nothing else unless your brief names it.

Already wired by the director (do NOT touch engine/page/props3d.js): your props file's `AA_<NAME>_KINDS` and
`AA_<NAME>_GRIPS` exports are imported and registered. Keep those export names.

House rules for every piece:
- Hand-drawn Ghibli look, very detailed: stone joints, chips, stains, panel seams, cloth folds are drawn as individual
  marks, each with its own place, width and strength from a hash of its index (no tiling texture, no Math.random, no
  wall clock; animation only from params and the clip clock the engine passes in).
- Realistic and physical: no sparkles, no magic glow, no floating symbols. A light beam is a soft see-through column,
  visible because pale dust motes drift through it (seeded, slow, on the clip clock).
- Origin bottom centre, front +z, metres, unless your brief says otherwise. World axes for Giza pieces: north -z,
  south +z, east +x.
- Every animated value is a prop param (0..1 unless said) with a spec.<name> start value; list any param propState has
  no default for in the header ("seed it with a dur-0 set at 0").
- The file starts with a usage header in the style of props-bearcamp.js: each kind, every spec key with its default,
  the size, the origin, params, GRIPS and how a hand holds it, SOLID/standable tops with their height.
- Bench: `storyboards/series/ancient-aliens/kit/bench/make-aa-<name>.mjs` (pattern:
  storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs; one group per camera, 30 m apart
  or more; include Spud, cast id potatobrawl/spud, standing beside each piece for scale where it makes sense, 1.2 m
  clear of anything). Render stills with `node engine/render.mjs <bench.json> --stills <times> --draft --out <dir>`
  and make `bench/aa-<name>-sheet.png` with `node qa/contact.mjs`. Stills may run beside other builders; do NOT run
  --layout, preflight, a draft video or a full render, and never the render farm.
- MACHINE: benches (stills) only.
- Look at your own sheet before you report and compare it with the named panels; fix what does not match.
- OUT OF SCOPE for everyone: clip generators, cameras for the episode, sound, other files, refactors, commits.

Report as .claude/agents/builder.md says (STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, 150 words at most).
