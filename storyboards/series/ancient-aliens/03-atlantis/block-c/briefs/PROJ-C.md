# Block C round P: the painted 3D scenes (camera projection), one builder per plate

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `aa-03-atlantis-c`. Do not commit.
Three other builders work in this checkout at the same time: touch ONLY your OWN files (below).

## Why
Block C's places were first built as procedural 3D (props-at-c-bimini/air/road/port.js). Next to the paintings they read
toy-like (bench/at-c-*-vs.png). The kit director's round R found the fix: build real 3D pieces at TRUE depth and paint them
with the approved painting projected from the painter's camera. From that camera the frame IS the painting; a push-in, a
pan or a move of 0.5-1 m keeps real parallax, occlusion and a floor under Spud's feet. Jonny (producer) wants "much love to
the detail" and Spud standing IN a real scene, not in front of a picture: this is how both happen.

## Read first (in this order, line ranges where you can)
1. `engine/page/props-at-c-plate.js` (the whole header): the `cplate` kind and the SCENE data format you fill. The
   machinery is done; you write DATA (and at most a small `apply` hook) in your own module.
2. `engine/page/props-at-city.js` lines 40-95 (the kit's round R notes: limits, contact shadows, how it placed each scene)
   and the PLATE_SCENES data between `/*PLATES-JSON-BEGIN*/` and `/*PLATES-JSON-END*/` for scene "01" and "04" (worked
   examples of pieces: water quads, boxes for blocks and towers, cut cards for ships, tops).
3. `storyboards/series/ancient-aliens/03-atlantis/kit/tools/city-plates.py`: how the kit made the layers (clean = near
   things painted out row by row; mask = cut cards and water decals), how `--overlay` draws the scene's 3D edges over the
   plate (the way you FIT the camera and the pieces), how `--vs` makes the painting | still sheet.
4. `storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-city.mjs` (the first 60 lines): the bench pattern
   (one group per camera, painter's camera read from the scene data, a moved camera as the parallax proof). Look at
   `kit/bench/at-city-vs.png`: that is the bar.
5. Your plate (below) and its panel on `/mnt/project-files/videos/ancient-aliens/03-atlantis/sheets/ancient-aliens-03-sheet-3.png`.

## The method (what the kit did; do the same)
1. Copy the plate (1536 x 1024; the env's `assets/environments/<env>/paint.png` or the project plate PNG) into your layers in
   `assets/props/atlantis/c/` as WebP 2048 x 1365: `c-pNN.webp`, plus `c-pNN-clean.webp` and `c-pNN-mask.png` only if
   your scene needs cards. Your tool `storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-NN.py` builds
   them (copy what you need from city-plates.py; deterministic, no random). It also has `--overlay out.png` (your scene's
   3D edges drawn over the plate) and `--vs <stills dir>`.
2. FIT THE PAINTER'S CAMERA: horizon row, vanishing point, focal length (f in plate px), height, pitch for a plate that
   looks down. Use the painting's own lines (the straight road, block edges, the horizon, plank seams, house lines).
   Iterate with `--overlay` until the 3D edges sit on the painted edges within a few pixels.
3. BUILD THE PIECES at real scale and true depth: the sea floor/water planes, every block/road slab/house/wall/pier as
   boxes or quads where the painting shows them, far things on far upright quads (a far shore 2-5 km away, a sky quad
   far behind everything; use far <= 1400 m, the clip's camera far is 1500), near things that stand up (a boat, a palm,
   a ship) as cut cards with the mask. A floor under Spud must be a REAL piece at the height given below (a `tops` slab
   there makes it standable).
4. BENCH `block-c/bench/make-at-cplate-NN.mjs` (pattern of make-at-city.mjs and of our own make-at-c-*.mjs: wide 1920 x
   1080, set `floor: "none"`, the kit's light `AT_DAY` / `AT_EVE` / `AT_UNDER` from kit/at-kit.mjs as given below):
   group P = the painter's camera, no cast; group S = the painter's camera with Spud standing where given; group M = the
   camera moved 0.8 m sideways and 0.5 m in (parallax proof); group Z = the painter's camera at half the fov on Spud (the
   close-up the clip will use). Stills with `--stills <times> --draft`. Then `--vs` -> `bench/at-cplate-NN-vs.png`
   (painting | P | S | M | Z).
5. RENDER LOCK: this 4-core box runs one render at a time. Wrap EVERY render call:
   `flock /tmp/claude-render.lock node engine/render.mjs ...` (it waits its turn).

DONE = P matches the painting (the same picture within a few px, colour within the kit's grade), S shows Spud's feet ON
the floor with a contact shadow (the engine draws ovals at world y 0: put the prop's y so the floor lands at 0, see the
kit's CONTACT SHADOWS note), M shows real parallax without torn or smeared surfaces in the middle of the frame (the edges
of the frame may mirror), Z is sharp enough to hold a 1080p close-up. Look at the vs sheet before you report.

## Plates (one builder each; your OWN files are `engine/page/props-at-c-plate-NN.js` (export `SCENES_NN`, already a stub),
`assets/props/atlantis/c/c-pNN*`, `block-c/tools/plate-NN.py`, `block-c/bench/make-at-cplate-NN.mjs` + its json/png)

- **28 Bimini road under water** (the PART'S HOOK, the most important frame): plate-28-bimini-road.png, env at-bimini-road.
  Light `AT_UNDER`. Sand floor y -5.5, the TOPS of the near blocks y -4.9 (the road runs straight away from the camera).
  Spud stands on the top of the nearest whole block, about 2 m in front of the camera. Pieces: sand floor, each visible
  block as a box (true size, about 3-4 m wide, 3.4 deep, 3.65 pitch), the reef clumps as boxes/cards where they rise, the
  water body behind as a far upright quad, the surface ceiling (the light shafts and the ripple ceiling) as a quad at y 0
  seen from below, fish as cut cards (spec.hide "fish" must hide them: the clip adds moving 3D fish). Make the prop's
  local y so that the block top Spud stands on is at y 0 (contact shadows), and say the offset in the header.
  Scene key "28".
- **27 Bimini from above**: plate-27-bimini-aerial.png, no env (use the plate PNG). Light `AT_DAY`. Sea surface y 0, sand bed y -5.5, the road's block tops y -4.9 running away from the camera
  to the island. A high camera (fit height and pitch: it looks down). Pieces: the bed (with the road and the reef patches,
  all in the plate) as a ground plane at -5.5 and the road as a strip of boxes, the water surface as a "water" layer quad at
  y 0 slightly over it (the shimmer moves the glints), the island on a far quad at its true distance, the sky on a far quad.
  The boat (and the swimmer if painted) as cut cards on the water, group "boat". The clip camera pushes in slowly from
  the painter's spot (up to 10 % of the height) and pans a few degrees: build for that. Scene key "27".
- **29 the edge road at evening**: plate-29-edge-road-evening.png, env at-edge-road-eve. Light `AT_EVE`. The road top is
  the floor (the clip had it at y 0.8 above the sea; here make the road top land at y 0 via the prop's y). Spud and a
  tall foreman figure stand on the road about 3-5 m in front of the camera. Pieces: the road slab (true width about 3.6 m,
  the near end toward the camera, the right edge where the water falls off), the sea both sides as "water" quads, the
  surf on the right as part of the projected road side / a near quad, the city wall + gate + towers on upright quads at
  their depth (wall ~100-300 m), the palace on a farther quad, the storm sky on the farthest quad. `solids` for the road's
  edges is not needed. Scene key "29".
- **34 + 35 Port Royal 1692** (one builder, two scenes): plate-34-port-royal-1692.png (env at-port-royal) and
  plate-35-port-royal-sinking.png (env at-port-royal-sink). Light `AT_DAY`. The boardwalk is the floor (land its top at
  y 0 via the prop's y). Spud stands on the boardwalk 3-4 m in front of the camera, left of centre. 34: boardwalk planks
  as a real slab, the barrels/crates/bollards near the camera as boxes or lathes, the house fronts on the left as boxes at
  their depth (balconies as boxes), the harbour water on the right as "water", the ships as cut cards on the water
  (group "ships"), the far town and hills on far quads, the sky farthest. 35 (the sinking): the same build method for
  plate 35's own view; its houses, broken planks and waves are what the plate shows; add a param `quake` 0..1 in your
  `apply` hook that shakes the "houses" group by a few centimetres (sin of the clip clock, deterministic) and a param
  `sink` 0..1 that lowers the "houses" group by up to 0.8 m (the projection moves with the group, so the painting goes
  down with it). If 34 and 35 can share one camera within 1 m, say so; else give both cameras. Scene keys "34", "35".

## Report (≤ 15 lines)
OWN files written; each scene's painter camera (pos, yaw, pitch, f, hy) AND the same camera as a clip camera (pos, look,
fov for a 16:9 frame, with the prop placed at x 0, z 0 and the y you chose); Spud's spot (x, z) and the prop's y; how far
the camera may move; the vs sheet path; what still differs from the painting.
