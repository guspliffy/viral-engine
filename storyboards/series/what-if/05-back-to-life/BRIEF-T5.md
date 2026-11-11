TASK T5: four additions to the existing T. rex prop for There's a catch EP05. A measured change in one file + bench.
WHY: Jonny's panels show a warm brown T. rex that runs on both legs and drools over the potatoes when it is
starving, and it appears out of a green glow when its skeleton comes alive. The existing `trex` is green, lifts
only its left foot and cannot drool or glow. Never Looks Up EP01 uses the same prop: its look must not change.
DESIGN: BRIEF-COMMON.md (read first); board.png panels 01, 06, 08, 09.
READ ALSO: engine/page/props-dino.js lines 1-195 (the whole trex); docs/rules/fast-cheap.md (golden section only).
OWN: engine/page/props-dino.js (the `trex` kind and its helpers only),
storyboards/series/what-if/05-back-to-life/bench/make-rex-props.mjs and the JSON it writes. Touch nothing else.
CONTRACT (every default leaves today's picture exactly as it is):
1. `spec.skin` "green" (default, today's look) | "brown": warm brown hide (#9c6a3c back, #c08f55 flanks, cream
   #ead9a8 belly, dark brown #5f3d22 speckles and a few soft tiger bands drawn once each); feet, lids, brows and
   the dark trim follow in browns. A separate cached texture per skin.
2. `glow` 0..1: every material turns toward bright green-white #b8ff9a by emissive (1 = a glowing silhouette).
   Materials are per instance or restored so a second trex in the scene is not affected.
3. `gait` (a count of run cycles, default 0): both legs swing in turn by its fraction (0 and 0.5 = a foot down and
   the other up, like `step` does for the left one: lift 0.28, swing +-18 degrees), the body bobs 5 cm and the tail
   counter-swings a little; whole numbers and 0 look exactly like rest. `step` keeps working as today.
4. `drool` 0..1: three thick strands hang from the lower jaw's front and sides (to 0.5 m at 1, a drop at each
   end), following the jaw when it opens; through `ghost`-style flags (see-through for the checks).
MACHINE: bench stills, plus `node qa/golden.mjs` ONCE at the end (it must pass untouched: report its last lines).
DONE WHEN:
- bench: `plain` set (color "#9fcdf0", floor "#d9cfc0", light "golden"); a green trex at [-3, 0] and a brown one at
  [3, 0], both scale 1.5, `potatobrawl/spud` at [0, 2]; cameras: wide front {pos [0, 1.6, 14], look [0, 2.6, 0],
  fov 46}, side on the brown one, and looking up at the brown one's face {pos [3, 0.45, 5.5], look [3, 3.4, 1],
  fov 55} with lean 6, neckP 8, headP 32, squint 0.75, brow -1, jaw 0.25. Stills: front (rest, both); side at gait
  0, 0.25, 0.5, 0.75; face with drool 0 and 1; front with glow 0.5 and 1 on the brown one only (the green one unchanged)
- contact sheet storyboards/series/what-if/05-back-to-life/bench/rex-sheet.png
- `node qa/golden.mjs` passes with no golden file changed; the usage header at the top of props-dino.js lists the
  new spec key and params
OUT OF SCOPE: engine/shared/trex-rig.js (the joints stay), other kinds in the file, Never Looks Up storyboards.
