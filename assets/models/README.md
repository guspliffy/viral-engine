# 3D models for the sets (asset pipeline 01)

Real models drawn into the sets by `engine/page/assets-gltf.js` (storyboard `set.models` / `set.scatter`, both opt-in;
see the comment at the top of that file). They go through the look like every other set mesh (toon ramps, painted
shadow edges, wind), so a model only needs good shapes and a base colour texture.

| Folder | What | Source | Licence |
| --- | --- | --- | --- |
| `nature/` | 59 trees, pines, bushes, ferns, plants, grass, flowers, clover, mushrooms, rocks, pebbles, path stones | Quaternius, Stylized Nature MegaKit (free Standard version), imported with `tools/assets/import-megakit.py` (normal maps dropped, textures shrunk to 1024 px, the bush's red autumn leaves swapped for green) | CC0 1.0 (`nature/LICENSE-Quaternius-CC0.txt`) |

Rules:

- CC0 or self-made only, with the licence file next to the models.
- Keep textures at 1024 px or less and drop normal maps; the toon look doesn't use them.
- Scenery placement copies nature (`scatter`): clumps and gaps, many small and few big, rocks half buried. Never a grid.
