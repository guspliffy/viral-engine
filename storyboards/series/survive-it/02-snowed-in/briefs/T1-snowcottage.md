TASK T1: set "snowcottage": the snowed-in mountain cottage room, with a big stone hearth, a snow-packed window, a plank
door in the left wall, and day/night that changes inside the clip
WHY: Survive it EP1 "Snowed in with your friends for 100 days" plays 15 of its 20 s in this one room, from DAY 1 (snow
light, a cosy fire) to DAY 100 (sun through the cracks). The viewer must read "snowed in" from frame 0 (the window packed
with snow) and see the fire flash-burn the woodpile. The xmasroom's fireplace is 1.02 m tall, so next to our 1.4 m
potatoes it vanishes behind them (staging stills); Jonny's panels show a big stone hearth and chimney breast.
DESIGN: Jonny's panels /mnt/project-files/video-scripts/2026-11-08-survive-it/panels-01-snowed-in/01-snowed-in-sheet.png
(4x2, panels 01-05 are this room: 01 frame 0, 02 the window behind Viking, 03 the flame column, 04 night at the door,
05 night, lightning up the chimney). Brief: /mnt/project-files/video-scripts/2026-11-08-survive-it/
01-snowed-in-7-days-ENGINE-PROMPT.md ("Set", "Light per beat"). The room is the xmasroom (engine/page/set-xmasroom.js)
made plain and bigger where it must be: same honey boards, dark floor, red rug, ceiling beams.
RULES: docs/rules/fast-cheap.md ("Engine changes": golden), docs/rules/movement.md (scenery section), CLAUDE.md
READ: engine/page/set-xmasroom.js (reuse its textures and helpers: import them, don't copy-edit that file),
engine/page/sets.js (how a set type is registered and built), engine/page/set-air.js lines 1-20 (a keyed, deterministic
set: globalThis.__setTicks), engine/page/looks.js lines 510-560 (how the anime-pro look reads setSpec), engine/load.mjs
nightWarn; nothing else unless blocked.
OWN: a new engine/page/set-snowcottage.js; ONE line in engine/page/sets.js registering `type: "snowcottage"` next to the
xmasroom line (another builder adds one line for "snowslope" in the same file at the same time: re-read the file right
before your edit and change nothing else); a bench storyboards/lookdev/make-snowcottage-bench.mjs + its JSON. Touch
nothing else (set-xmasroom.js stays byte-identical: friends try to 07 uses it).
CONTRACT (the room's numbers come from the staging proof; x right, z toward the camera, y up, metres):
- `set: { type: "snowcottage", light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive", lighting: 2,
  hatch, cel, ink, satsuei, dark, snowWindow, fire, door, candles }` (the clip template's look flags pass through as in
  xmasroom). Export `SNOWCOTTAGE` with the layout numbers below for the generator.
- Room: walls x -2.7 and +2.7, back wall z -2.3, open at the front (cameras stand at z 1.3-3.2 inside the walls' depth;
  extend the side walls and the ceiling forward to z 3.6 so no camera sees past them), ceiling beams. No tree, stockings,
  garland, presents or cat basket. Bookcase optional (back right corner x 2.2 only if it clears the hearth).
- Hearth, centred x 1.05 on the back wall: a grey stone chimney breast 1.7 m wide, 0.45 m deep, floor to ceiling; an
  arched opening 1.1 m wide x 1.0 m tall; a raised stone hearth step 0.12 m high reaching 0.5 m into the room; a dark
  wood mantel beam at 1.55 m (above the cast's heads, 1.33-1.42 m) with 5 candles. Logs on a grate inside.
- `fire: [[t, level], ...]` (eased between keys, step at equal times): 0 cold ashes; 0.25 embers (one glowing crumb, faint
  orange); 1 a cosy cel fire with a warm flickering point light; 2 the FLARE: a cel flame column filling the opening and
  licking up the breast past the mantel to about 2.0 m, an orange flash on the whole room and every face (panel 03).
  Flicker is a function of story time only.
- `candles: [[t, 0..1]]` their flame and glow (0 out).
- Window, back wall centred x -1.4: 1.4 m wide, sill 1.0 m, top 2.4 m, a wooden cross frame (4 panes), red curtains.
  `snowWindow: [[t, fill]]`: a packed snow wall behind the glass from the sill up to fill x the height (0.8 = a strip of
  white sky above it, frame 0; 1.0 = no sky; 0.6 = spring), bluish white with a soft blue top edge and a few flakes; with
  dark 1 the snow reads dark blue-grey and the sky strip night blue (panel 04).
- Door, left wall (x -2.7), centred z -0.4: a plank door 1.0 m wide, 2.0 m tall, dark iron latch and strap hinges (hinge
  side z -0.9), a 0.1 m snowdrift along its foot inside. `door: [[t, open 0..1]]` swings it into the room to 100 deg.
  The opening shows whatever is outside the wall (another task builds the outside world there; for your bench a plain
  bright sky is fine). The walls are solid both ways around the doorway (no gap round the frame).
- `dark: [[t, 0..1]]` (0 day, 1 night; deliberately not named `night`, which flips the anime-pro look's colour roles
  for the whole clip): the window's light and the room's cool fill go down, fire and candles carry the room. At dark 1
  with the fire at 0.25 and candles 1, the four faces keep at least 60 % of their day brightness (measure the mean
  luminance of each face box in your bench stills and paste the numbers). No change to looks.js.
- Deterministic (no Math.random, no wall clock): every keyed value is a function of story time via __setTicks.
MACHINE: benches only: draft stills of your bench (`node engine/render.mjs <bench> --stills ... --draft --safe`, one at a
time; another builder shares the box), and `node qa/golden.mjs` once at the end. No clip layouts or renders, no farm.
DONE WHEN:
- bench: the EP1 four (duo/viking, duo/samurai, never-has-money/reaper, potatobrawl/allfather; castLook "sheet", look
  anime-pro) standing in the room at the staging proof's DAY 1 places (vik [0.71,-0.23], sam [-1.27,-1.84], rea
  [-0.1,0.27], god [0.32,-1.81]) under camera {pos [0.76,1.6,2.96], look [-0.02,0.7,-1.91], fov 58}; stills: (a) day,
  fire 1, snowWindow 0.8; (b) fire 2 flare; (c) dark 1, fire 0.25, snowWindow 1.0; (d) the door at open 1 from camera
  {pos [1.63,1.45,3.03], look [-2.08,0.92,-1.63], fov 60}; a contact sheet of the four at 360 px wide per still in
  /mnt/project-files/videos/survive-it/02-snowed-in/set-bench/snowcottage.png (full stills beside it)
- in still (a) the window's snow, the hearth opening with its fire and the mantel candles all show between and above
  the cast (nothing of the hearth hidden except below 0.9 m behind Viking)
- `node qa/golden.mjs`: no changed pixel (paste its last lines)
OUT OF SCOPE: the outside world, the cottage's outside, the avalanche, props (planks, chairs, block, slivers, snow
drifts, icicles, frost), the lightning; any clip generator; looks.js or sky.js changes.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
