# tools/mocap: the move library's recorder (quality plan item 16)

Real timing and weight for moves that are hard to invent, stored as named moves in `storyboards/lib/moves/<name>.json`
and played on a potato by `storyboards/lib/moves/index.mjs` through the actions the rig already has. Nothing runs at
render time.

| file | what it does |
| --- | --- |
| `asf-amc.mjs` | reads a CMU take (`.asf` skeleton + `.amc` motion), forward kinematics, joint positions in metres |
| `dump.mjs` | a take's joints as JSON at 30 fps (for `stick.py`) |
| `stick.py` | stick-figure reference frames or a contact sheet of a take, seen from the side of its travel |
| `one-euro.mjs` | the 1€ filter (Casiez et al. 2012), run both ways over a whole track |
| `retarget.mjs` | a take -> a named move: path, facing, torso tip and lean, pelvis drop, hands from the shoulders in arm lengths, head turn, footsteps |
| `make-trial.mjs` | the trial bench: one sneak hand-made with today's tools and one from motion capture |
| `side-by-side.sh` | person \| hand-made \| mocap at normal and half speed |

## Sources (in this order)

1. **CMU Graphics Lab Motion Capture Database**, http://mocap.cs.cmu.edu/: "free for all uses", "may be copied,
   modified, or redistributed without permission". Credit: "The data used in this project was obtained from
   mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217." Use the original `.asf/.amc`
   files, not conversions (some carry non-commercial licences). Raw takes are not committed: the move file keeps the
   retargeted curves and names its source.
2. Poses authored in Blender (`tools/blender/`).
3. A phone video through MediaPipe Pose on CPU (check the model's licence first; someone has to act the move).

Not usable: LaFAN1, the Bandai Namco set, AMASS (non-commercial), Mixamo (files can't go in a public repo).

## Make a move

    curl -O http://mocap.cs.cmu.edu/subjects/120/120.asf
    curl -O http://mocap.cs.cmu.edu/subjects/120/120_09.amc
    node tools/mocap/dump.mjs 120.asf 120_09.amc take.json && python3 tools/mocap/stick.py take.json --sheet sheet.png
    node tools/mocap/retarget.mjs 120.asf 120_09.amc --name sneak --from 0 --to 10.6 --source "CMU subject 120, take 09"

Moves so far: `sneak` (CMU 120_09, "Mickey sneaking walk": a cartoon sneak acted by a person).
