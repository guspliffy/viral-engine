# Layered painted environments

A place painted once, then cut into the layers an anime background artist paints on separate cels: sky, far
hills, a band of trees, near banks, and the ground. Storyboard: `"set": { "type": "env", "env": "<name>" }`
(engine/page/set-env.js). Quality plan point 2 (4 Nov 2026).

Why layers instead of one plate (`set.plate`): a single plate bends one picture into a relief, so a camera that moves
more than a little stretches it, and the floor the characters stand on is a guess. Here each layer hangs at its own
distance, so near banks slide past far hills like a real multiplane camera, and **the ground is a real 3D floor at
y 0 carrying the painted path**: feet, shadows and 3D props touch the path where it is painted.

**One painting = one palette and one light.** Every layer comes from the same picture, so they can't drift apart in
colour or brush. The 3D key light comes from the same `env.json` (`light.key`, engine/load.mjs sets `set.key`), so
the cast is lit from where the painting's sun is. `env.json` also lists the painting's main colours (`palette`) for
props that should match.

## Making one (free, CPU only: about 1.5 minutes a seed, 1 minute to cut)

```
python engine/plates/env.py assets/environments/<name>/spec.json            # paint, refine, split
python engine/plates/env.py assets/environments/<name>/spec.json split      # redo one stage
```

- `paint`: SDXL base + Lightning LoRA (8 steps, the same open models as `engine/plates/paint.py`). Put several seeds in
  `seeds` with `"all_seeds": true`, look at `paint-seed*.png`, then copy the best to `paint.png`.
- `refine`: 2x size (Lanczos and a light unsharp mask). The video is 1920 px tall and a shot sees ~80 % of the picture.
  `refine` > 0 adds an SDXL image-to-image pass in tiles; at 0.3 it softened leaves and clouds (4 Nov test), so it is off.
- `split`: depth (Depth Anything V2 Small) -> metres -> layers, ground, motion masks, palette, `env.json`, `review.png`.

Prompt for the potato scale: the cast are about 1 m tall, so paint from a **low, ground-level view** with a **wide
path or clearing filling the bottom**; a person's eye-level vista turns a footpath into a 20 cm strip at potato scale.
Keep the prompt under 77 tokens (CLIP cuts the rest). Name the light's side; the painting's sun decides `light.key`.

## The spec

| Key | What |
|---|---|
| `prompt`, `no`, `seeds`, `size` | the painting (`no` adds to the negative prompt) |
| `eye` | `{ height, vfov, pos }`: the painting camera in the world. `height` sets the world's scale (the cast's eye level, ~0.95 m); `pos` where it stands (default `[0, height, 4.4]`). `horizon` (0..1 of the height) overrides the fitted one |
| `bands` | metres between the cards: near / mid / far / hills / sky (default `[3, 9, 28, 90]`) |
| `groundMax` | the 3D floor's far edge (m); farther ground goes into the cards |
| `standRatio` | a pixel this much nearer than the floor at its row is "standing" (tree, bank, rock): default 0.82 |
| `fill` | how far each card is painted on behind the cards in front (share of the width): the gap a camera move may open |
| `pad`, `padY` | mirrored margin round the picture (share of the width / height) for camera moves |
| `motion` | `{ "still": [[x0, y0, x1, y1]], "sway": [...], "shimmer": [...] }` boxes (0..1, top left origin): force a spot still or moving |
| `swayMax` | nothing farther than this sways (m, default 30) |
| `force` | `[{ "box": [...], "layer": n }]`: a hand-set layer for a spot the depth got wrong |
| `light` | `{ key: [x, y, z], from, shadow }`: the 3D key light's position (the painting's sun side) and the cast shadow's strength |

## How the picture becomes metres

The painting's ground is a plane seen from `eye.height`. On a plane, inverse depth grows in a straight line down the
picture, and Depth Anything's output is an affine copy of inverse depth. A line fitted to the lower rows gives the
horizon and the scale, so every pixel gets a distance. A pixel is ground when its distance matches the plane at its
row, standing when it is nearer (a bank, a tree trunk), sky when it is at infinity. Standing pixels go into depth
bands; each band becomes a card square to the painting camera at its median distance, painted on a little behind the
cards in front (`fill`) so a camera move opens no hole.

## Life masks (set "life", 7 Nov 2026)

```
python engine/plates/env_life.py <name> [...]      # or --all; needs torch, transformers, opencv (CPU, ~20 s each)
```

The sky card holds everything past the last depth band, which can include a far lake, mountains or a skyline. For a
living world (`"set": { "life": ... }`, engine/page/set-life.js) each card gets `layer-N-<name>.life.png` (listed as
`card.life` in `env.json`): **R** the true sky (the far pixels in the sky's own colours that connect to the top edge,
cloud bellies filled in, minus anything another card covers), the only part whose clouds drift; **G** painted foliage
on a card with no motion mask of its own (far woods and hills past swayMax), which sways with the gusts, harder in a
storm. `life-review.jpg` shows them (blue: drifts, red: sways). Run it on every new environment. Without the masks a
living set's sky stays still and its far trees don't move. Old storyboards never read them.

## Checks

- **Review sheet** `review.png`: painting, depth, layer classes (brown = 3D ground), the motion mask (sway red, shimmer
  yellow, still boxes cyan), every layer on a checkerboard with its distance, and the ground picture. Look at it before
  using an environment: a misclassified spot is fixed with `force`, a wrong mask with `motion` boxes.
- **Camera coverage** (engine/shared/env-coverage.js): `engine/load.mjs` refuses a storyboard whose camera sees past the
  painting (the floor running out, the sky ending, a layer's cut edge), so `render.mjs` never starts one.
  `node qa/env.mjs <storyboard>` prints every frame's problems; `node qa/env.mjs --range <name>` prints the safe range
  (how far the camera may move and turn from the painting camera).
- **Motion masks** (engine/plates/masks.py, shared with depth.py): foliage = leaf colour **and** leaf texture, so a flat
  green door, wall or roof stays still; the sky and anything past `swayMax` never sway.

## Environments

| Name | What | Prompt (seed) |
|---|---|---|
| `meadow-path` | summer meadow, wide sandy road between tall trees, rolling hills, a blue mountain, cumulus; sun upper left. 12 layers; safe range from the painting camera (0, 0.95, 4.4): about ±0.9 m sideways, 0.4 m down, pan 10° left / 4° right, tilt ±8°, 8 m in (past a bank the camera would be inside it). The road is about 1.2 m wide at 6-9 m (x 0.2-0.5 m middle). Demo `storyboards/env/make-meadow-demo.mjs` | `meadow-path/spec.json` (seed 58; the spec's negative prompt says "road" and it painted one anyway: kept so the seed still makes this picture) |
