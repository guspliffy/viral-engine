# Assets and their licences

Every folder under `assets/` with its source and licence. Detail per file lives in the folder's README or
manifest. Rights and money are Jonny's call: a new source, a paid package or a licence question goes to him first.
Rule for models: CC0 or self-made only, with the licence file next to them (`assets/models/README.md`).

| Folder | What | Source | Licence | Detail |
|---|---|---|---|---|
| `fonts/` | Inter Black, ExtraBold (captions) | Inter by Rasmus Andersson | SIL Open Font License | `Inter-LICENSE.txt` |
| `sfx/kenney/` | UI, impact, RPG, sci-fi, jingles, digital, interface | Kenney | CC0 | `*/License.txt` |
| `sfx/oga/` | single takes (e.g. "Gastric Distress" by LFA) | OpenGameArt | CC0 per manifest entry | `manifest.json` |
| `sfx/nature/` | birds, stream, lake beds; leaves | OpenGameArt (thimras, randommind); leaves synthesised by `tools/sound/nature-synth.py` | CC0; own work | `README.md` |
| `sfx/ai/`, `sfx/ai-package/` | generated effects | Stable Audio 3 Small, run locally (`engine/soundgen`) | Stability AI Community License: free under $1M yearly revenue, commercial use to be registered with Stability AI | `manifest.json` |
| `music/ai/`, `music/ai-package/` | generated music beds | Stable Audio 3 Small, run locally | as above | `manifest.json` |
| (code) music beds | seeded beds per clip | `puppet/beat.mjs` | own work | |
| `sfx/whitelist.json` | what each sound really sounds like | own measurements | own work | `engine/sfx/whitelist.mjs` |
| `models/nature/` | 59 trees, plants, rocks | Quaternius Stylized Nature MegaKit (free) | CC0 | `LICENSE-Quaternius-CC0.txt` |
| `models/characters/`, `models/props/` | Reaper cloak, bike handlebar | Blender scripts in `tools/blender/` | own work | `models/README.md` |
| `models/vrm/` | human base (Teo, Ryn) | made in VRoid Studio by us; CC0 HairSample | own work (VRoid output is the maker's); CC0 | project memory licence-free-human-base |
| `environments/` | layered painted places | SDXL base + Lightning LoRA, run locally (`engine/plates/env.py`) | CreativeML Open RAIL++-M | `README.md`, each `spec.json` |
| `plates/` | painted backdrops | same models (`engine/plates/paint.py`), prompt + seed per file | CreativeML Open RAIL++-M | `README.md` |
| `plates/pub-night.png` | pub far wall, window panes cut to alpha (Never Has Money 03) | SDXL base 1.0 + SDXL-Lightning 4-step LoRA (img2img from a drawn layout, one bottle-shelf crop from a txt2img take), banner/frame drawn in PIL | CreativeML Open RAIL++-M (commercial use allowed); SDXL-Lightning OpenRAIL++ | `plates/README.md` row |
| `plates/pub-street-night.png` | night street seen through that window | SDXL base 1.0 + SDXL-Lightning 4-step LoRA (img2img from a drawn layout), street lamp drawn in PIL | CreativeML Open RAIL++-M (commercial use allowed); SDXL-Lightning OpenRAIL++ | `plates/README.md` row |
| `screens/` | phone screen pictures (car crash) | not recorded yet: fill in before reuse | unknown | |
| `mocap/` | walks, runs, sits, sneak, fights | CMU Graphics Lab Motion Capture Database (`c<subject>_<trial>`) and own retargets | CMU: free to use, commercial included | `storyboards/lib/moves/` |
| (code) characters | the cast's bodies, faces, costumes | built in code from Jonny's design sheets | Jonny's designs | `characters/` |
| (code) voices | spoken lines | Kokoro TTS, VoxCPM2 (local) | Apache 2.0 both; OmniVoice weights are non-commercial, never use them | `engine/voice/voices.json` |
| (not in repo) VFX | Effekseer sample effects | `tools/vfx/fetch-effects.sh` (pinned commit) | terms not written down: kept out of the repo until settled | the script's header |

Add a row (or a manifest entry) in the same commit as any new asset.
