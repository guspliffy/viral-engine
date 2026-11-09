# PANELS: light-speed (What if, episode 3: "What if your competitive friend could run at light speed?")

Next to the generator. Written at the staging proof (docs/rules/workflow.md), before the first line of the generator:
Jonny's panels are the target, and this file is how the clip is held to them by line and by number, not from memory.
Board: /mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/02-light-speed-race/storyboard-eight-panels.png
(4x2 grid, 9:16 panels; `qa/panels.mjs --grid 4x2`). Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/02-light-speed-race-ENGINE-PROMPT.md,
with PANEL-NOTES.md (his panels win: no Viking helmet, a red roadster, no Wizard in 08) and the matched-opening test
promised to Jonny on 9 Nov (title, first subtitle and frame 0 say the same: "Watch me win at light speed").

## Checklist: what these panels stand on

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | A bright clear afternoon in every panel: deep blue sky with white cumulus in the top 0.15-0.25, golden wheat on both sides of a straight pale dirt road to the horizon, green hills behind; never the stock sunset painting (golden-country-road) | | |
| 2 | 01-02: Samurai (left, x 0.40) and Viking (right, x 0.66) crouched in sprint starts at a chalk line close to a low camera, glaring at each other, both faces 3/4 in profile with their eyes at 0.70-0.75; their backs and shoulders fill the bottom 0.45 | | |
| 3 | 01: Wizard with a raised red-white checkered flag at the left verge (eyes 0.42, x 0.15); Reaper with the gold trophy beside the right post of the red finish ribbon down the road (x 0.76, about 0.1 of the frame tall); green sparks crackling at Samurai's feet | | |
| 4 | 02: Samurai past the snapped ribbon in the air (eyes 0.31, x 0.62), the trophy high in one glove; a green streak fading along the road from the start line to him with the wheat bent flat beside it; Viking still crouched, mouth open; Wizard's flag still up | | |
| 5 | 03: Viking in a close medium fills the left half (eyes 0.56, x 0.35), red-faced, mouth wide, pointing right at Samurai; Samurai small in the right background (eyes 0.33, x 0.83) holding the trophy, calm, eyes shut | | |
| 6 | 04: a wide down the road from behind and above the red roadster (gold rims) as it drives away in a cloud of dust, Viking's orange hair over the seat; Samurai already at the ribbon, leaning on the right post, yawning, eyes shut (eyes 0.32, x 0.79) | | |
| 7 | 05 (title card, cover): the green streak from the camera to the horizon, wheat flattened in a line beside the road, Wizard's hat flying off (x 0.1, 0.3-0.45), Viking's fur cape flapping (no helmet), leaves and dust in the air; Wizard left, Viking right, Reaper front right, all shielding their faces | | |
| 8 | 06: Samurai skids in toward a low camera in a dust spray, trophy high (top 0.06), eyes shut, mouth open laughing, filling the frame (eyes 0.38, x 0.45); dust fills the bottom 0.4 | | |
| 9 | 07: the same road sixty years later: cracked, weeds through the cracks, wild grass and white flowers on the verges; the roadster rusted with flat tyres at the left; the ribbon posts leaning with a tattered faded ribbon; Wizard (grey beard, faded hat with its patch) and Viking (long white beard, white brows, orange hair) old and stooped on walking sticks; Reaper exactly as before; their three faces to camera | | |
| 10 | 08: Samurai at the left front turned at least 3/4 to us (never side-on), wide eyes, the trophy drooping in his glove; old Viking leaning on his stick between him and Reaper; Reaper at the right unchanged, one slow blink; no Wizard in frame | | |
| 11 | Never drawn reaction marks (anger vein in 03, sweat drops in 02 and 08, the yawn's "Zzz" puffs in 04, "!" ticks in 02): act them in faces and bodies | | |
| 12 | The walking-stick tips stay planted on the road and the trophy stays in a glove from 1.0 s to the end; the top 0.2 of the frame stays clear 0-2 s for Jonny's in-app title | | |

## Numbers: read off each panel before any code

Read off Jonny's sheet at 2x with a tenths grid (shares of the frame: 0 at the top or the left).

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.5 | sam | 0.54 | 0.72 | 1 | 0.40 | sam, vik | above | |
| 01 | 0.5 | wiz | 0.31 | 0.42 | 0.56 | 0.15 | wiz | above | |
| 02 | 1.2 | sam | 0.28 | 0.31 | 0.39 | 0.62 | sam | above | |
| 02 | 1.2 | vik | 0.53 | 0.67 | 1 | 0.66 | vik | above | |
| 03 | 3.0 | vik | 0.27 | 0.56 | 1 | 0.35 | vik | above | |
| 03 | 3.0 | sam | 0.27 | 0.33 | 0.50 | 0.83 | sam | above | |
| 04 | 5.6 | sam | 0.25 | 0.32 | 0.44 | 0.79 | sam | above | |
| 05 | 10.0 | vik | 0.48 | 0.60 | 0.82 | 0.78 | vik | above | |
| 05 | 10.0 | wiz | 0.47 | 0.55 | 0.75 | 0.12 | wiz | above | |
| 06 | 12.2 | sam | 0.18 | 0.38 | 1 | 0.45 | sam | below | |
| 07 | 14.2 | viko | 0.48 | 0.58 | 0.86 | 0.43 | viko, wizo, rea | above | |
| 08 | 17.8 | sam | 0.31 | 0.53 | 1 | 0.15 | sam, rea | above | |
| 08 | 17.8 | rea | 0.33 | 0.53 | 0.88 | 0.87 | rea | above | |

## Story chain

(written with the generator; one line per beat: what happens -> what the viewer must see -> the shot that shows it)

## Departures (and why)

(filled in at the staging proof)
