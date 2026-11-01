# 3D models for the sets (asset pipeline 01)

Real models drawn into the sets by `engine/page/assets-gltf.js` (storyboard `set.models` / `set.scatter`, both opt-in;
see the comment at the top of that file). They go through the look like every other set mesh (toon ramps, painted
shadow edges, wind), so a model only needs good shapes and a base colour texture.

| Folder | What | Source | Licence |
| --- | --- | --- | --- |
| `nature/` | 59 trees, pines, bushes, ferns, plants, grass, flowers, clover, mushrooms, rocks, pebbles, path stones | Quaternius, Stylized Nature MegaKit (free Standard version), imported with `tools/assets/import-megakit.py` (normal maps dropped, textures shrunk to 1024 px, the bush's red autumn leaves swapped for green) | CC0 1.0 (`nature/LICENSE-Quaternius-CC0.txt`) |

| `characters/reaper-cloak.glb` | Reaper's one-piece hooded cloak, draped by Blender's cloth simulation over his body (character bodyGroup space; costume key `cloakModel`, hooked in by the character code) | `tools/blender/reaper-cloak.py` | own work |
| `props/bike-handlebar.glb` | Riser handlebar: ribbed lock-on grips, stem with faceplate bolts and spacers, brake levers and cables (bike frame space; bike prop `"model"`) | `tools/blender/bike-handlebar.py` | own work |

Blender models are made by script, never by hand, so they can be remade and changed: `blender -b -P
tools/blender/<script>.py -- <out.glb> [preview.png]` (Blender 4.2 LTS; installed in the cloud session under
/home/user/tools, Jonny's OK 1 Nov 2026). Each script starts with the real-world notes it copies.

Rules:

- CC0 or self-made only, with the licence file next to the models.
- Keep textures at 1024 px or less and drop normal maps; the toon look doesn't use them.
- Scenery placement copies nature (`scatter`): clumps and gaps, many small and few big, rocks half buried. Never a grid.
