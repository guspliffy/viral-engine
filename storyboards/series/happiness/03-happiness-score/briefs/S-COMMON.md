# S tasks: one painted place as a projected 3D scene (common brief)

Film: "I could see everyone's happiness score" (Happiness 03, wide 1920x1080 film + tall parts). Branch happiness-03-score.
Read first: DESIGN.md in this folder (section 8 Places, Beauty shots, Plate list, Build method), the usage header of
engine/page/props-score-plate.js (kind `splate`: scene format, splateCamera, the built-in "test" worked example), and one
finished precedent of the same method: storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-27.py with
engine/page/props-at-c-plate-27.js (camera fit by least squares, layers, --emit, --overlay, --vs).

## Inputs
- The plate (2x, 3072 x 2048): assets/props/score/score-<id>.webp (fit in 1536 x 1024 plate px; the 1x original is
  storyboards/series/happiness/03-happiness-score/plates/painted/<ID>.webp). Already committed; do not repaint it.
- The approved panel crops: plates/ref/panel-NN.png (the sheets: sheets/happy-score-sheet-1..4.png). The panels are the target
  for framing and blocking; the plate is the target for every pixel.

## You own (and touch nothing else)
- engine/page/props-score-plate-<id>.js: `registerSplate("<ID>", {...})` with file "score-<id>" (lower case), cam, pieces, tops,
  solids, life, meta (where each character of your panels stands, the 1 m move limits).
- storyboards/series/happiness/03-happiness-score/tools/plate-<id>.py (camera fit, optional -clean/-mask/-motion layers into
  assets/props/score/score-<id>-clean.webp / -mask.png / -motion.png, --emit, --overlay, --vs). Motion masks: engine/plates/masks.py.
- bench files under storyboards/series/happiness/03-happiness-score/bench/<id>/ (scratch storyboards, vs-sheets).
Do NOT edit props3d.js, props-score-plate.js or any other shared file. Bench from a scratch copy of engine/ (or a temporary
local edit you revert) with the line `import "./props-score-plate-<id>.js";` added after the SPLATE import in props3d.js;
the director adds the real line. Do not commit; the director commits.

## Done means
1. From the painter's camera the frame IS the painting (vs-sheet: painting | render, wide and tall, no seams, no stretched smears
   inside the frame window).
2. A floor (`tops`) at y 0 where your panels' characters stand, plus every seat, step or counter top your panels use; solids for
   walls/railings a character must not walk through.
3. A push (zoom 1 -> 1.6) and a 0.8 m move keep parallax without holes or edge smears; Spud (characters/potatobrawl/spud) stands on
   the main top at the right scale for the panel (potato eye height ~0.95 m camera).
4. Life from DESIGN (leaves, mist, birds, sway, shimmer) where DESIGN names it; deterministic (no Math.random, no clock).
5. Stills only (`node engine/render.mjs <sb> --stills ... --draft`), never a draft video. At most 2 fix rounds.

## Report (short)
STATUS, FILES, CHECKS (vs-sheet paths), the painter's cam numbers, where characters stand per panel, ASSUMPTIONS, anything the
plate cannot do (a repaint the director should ask for).
