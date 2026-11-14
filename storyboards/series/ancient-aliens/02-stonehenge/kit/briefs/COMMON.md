# Common part of every Stonehenge kit brief (S1..S4): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `aa-02-stonehenge-kit`. Do not commit.
DESIGN: storyboards/series/ancient-aliens/02-stonehenge/kit/BOARD.md (axes and sun section 1, palette 2, sizes 3). Design
words: /mnt/project-files/videos/ancient-aliens/02-stonehenge/DESIGNS.md. The panel sheets are not on this machine: the
panel texts in /mnt/project-files/videos/ancient-aliens/02-stonehenge/sheets/sheet-{1..4}-prompt.txt (the numbered lines at
the end of each file) describe every panel your brief names; read those lines once.
RULES: docs/rules/movement.md only if your task animates something.
READ: the usage header and the first kind of the pattern file your brief names; your own stub file; nothing else
unless your brief names it. Other builders work in this checkout at the same time: touch only your OWN files.

Already wired by the director (do NOT touch engine/page/props3d.js): your file's `SH_<NAME>_KINDS` and `SH_<NAME>_GRIPS`
exports are imported and registered. Keep those export names.

House rules for every piece:
- Hand-drawn Ghibli look, very detailed: joints, chips, lichen, tool marks, grass tufts, cloth folds are individual marks,
  each with its own place, width and strength from a hash of its index (no tiling texture, no Math.random, no wall clock;
  animation only from params and the clip clock the engine passes in).
- Realistic and physical: no sparkles, no magic glow, no floating symbols.
- WIDE FIRST: the film is 1920 x 1080. Wide establishing views must be rich: a detailed far distance, never a bare
  horizon or an empty half of the frame. A wide still that looks plain is not done.
- World axes (BOARD section 1): the monument's axis is z. +z north-east (entrance, default camera side), -z south-west
  (the sunset), +x screen right from the default camera, up +y. Origin of a piece = bottom centre unless said. Metres.
- Scenery is `userData.lookOnly` / not solid unless your brief says a top is standable.
- Every animated value is a prop param with a spec.<name> start value; list any param that needs seeding in the header.
- The file starts with a usage header in the style of engine/page/props-aa-giza.js: each kind, every spec key with its
  default, the size, the origin, params, standable tops with their height.
- Bench: `storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-<name>.mjs` (pattern:
  storyboards/series/ancient-aliens/kit/bench/make-aa-items.mjs; one group per camera; the bench storyboard carries
  `frame: "wide"` and `far: 700` at its top level: stills are 1920 x 1080 and the cameras see 700 m, as in the episode; base set `{ type: "plain", color: "#bcd4ea", floor: "shadow" }`;
  include Spud, cast id potatobrawl/spud, for scale where it makes sense, 1.2 m clear of anything). Generated bench
  JSON is not committed. Render stills with
  `node engine/render.mjs <bench.json> --stills <times> --draft --out out/sh-<name>` and make `bench/sh-<name>-sheet.png`
  with `node qa/contact.mjs`. Stills may run beside other builders; do NOT run --layout, preflight, a draft video or a
  full render, and never the render farm.
- MACHINE: benches (stills) only. Four cores are shared by three builders: render only the stills you need.
- Look at your own sheet before you report, compare it with the panel texts, fix what does not match.
- OUT OF SCOPE for everyone: clip generators, episode cameras, sound, other files, refactors, commits.

Report as .claude/agents/builder.md says (STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, 150 words at most).
