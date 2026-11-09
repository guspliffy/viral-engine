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
| 1 | A bright clear afternoon in every panel: deep blue sky with white cumulus in the top 0.15-0.25, golden wheat on both sides of a straight pale dirt road to the horizon, green hills behind; never the stock sunset painting (golden-country-road) | yes: blue sky, golden wheat and the straight road in every shot; the swap set (07, 08) keeps the sky | |
| 2 | 01-02: Samurai (left, x 0.40) and Viking (right, x 0.66) crouched in sprint starts at a chalk line close to a low camera, glaring at each other, both faces 3/4 in profile with their eyes at 0.70-0.75; their backs and shoulders fill the bottom 0.45 | yes (01 matches) | |
| 3 | 01: Wizard with a raised red-white checkered flag at the left verge (eyes 0.42, x 0.15); Reaper with the gold trophy beside the right post of the red finish ribbon down the road (x 0.76, about 0.1 of the frame tall); green sparks crackling at Samurai's feet | yes: flag at the left verge, Reaper with the trophy by the right post; sparks at his feet | |
| 4 | 02: Samurai past the snapped ribbon in the air (eyes 0.31, x 0.62), the trophy high in one glove; a green streak fading along the road from the start line to him with the wheat bent flat beside it; Viking still crouched, mouth open; Wizard's flag still up | yes (02 matches); flag down by 02 (he lowers it after Ready) | |
| 5 | 03: Viking in a close medium fills the left half (eyes 0.56, x 0.35), red-faced, mouth wide, pointing right at Samurai; Samurai small in the right background (eyes 0.33, x 0.83) holding the trophy, calm, eyes shut | partial: Viking 121 % size, a closer medium for the shout | |
| 6 | 04: a wide down the road from behind and above the red roadster (gold rims) as it drives away in a cloud of dust, Viking's orange hair over the seat; Samurai already at the ribbon, leaning on the right post, yawning, eyes shut (eyes 0.32, x 0.79) | partial: the car is in the near foreground, Samurai at the ribbon (86 % size) | |
| 7 | 05 (the slow motion, cover): the green streak from the camera to the horizon, wheat flattened in a line beside the road, Wizard's hat flying off (x 0.1, 0.3-0.45), Viking's fur cape flapping (no helmet), leaves and dust in the air; Wizard left, Viking right, Reaper front right, all shielding their faces | partial: the streak a green band from the bottom edge to the horizon; Wizard 157 % size (his flying hat counts), Viking 77 %; Reaper does not shield (below) | |
| 8 | 06: Samurai skids in toward a low camera in a dust spray, trophy high (top 0.06), eyes shut, mouth open laughing, filling the frame (eyes 0.38, x 0.45); dust fills the bottom 0.4 | yes: trophy high in frame, eyes shut laughing, golden wheat behind; camera level not below (sky edge) | |
| 9 | 07: the same road sixty years later: cracked, weeds through the cracks, wild grass and white flowers on the verges; the roadster rusted with flat tyres at the left; the ribbon posts leaning with a tattered faded ribbon; Wizard (grey beard, faded hat with its patch) and Viking (long white beard, white brows, orange hair) old and stooped on walking sticks; Reaper exactly as before; their three faces to camera | yes: rusted roadster whole at the left, tattered ribbon, cracked road with grass and white flowers through the cracks, both old men on sticks, three faces to camera; a step wider (below) | |
| 10 | 08: Samurai at the left front turned at least 3/4 to us (never side-on), wide eyes, the trophy drooping in his glove; old Viking leaning on his stick between him and Reaper; Reaper at the right unchanged, one slow blink; no Wizard in frame | partial: Samurai 3/4 at the left with the trophy, old Viking between, Reaper's blink; a step wider (below) | |
| 11 | Never drawn reaction marks (anger vein in 03, sweat drops in 02 and 08, the yawn's "Zzz" puffs in 04, "!" ticks in 02): act them in faces and bodies | yes: no drawn marks anywhere | |
| 12 | The walking-stick tips stay planted on the road and the trophy stays in a glove from 1.0 s to the end; the top 0.2 of the frame stays clear 0-2 s for Jonny's in-app title | yes: trophy in a glove 1.0 s to the end, stick tips on the road; top 0.2 clear 0-2 s | |

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

- 0.0-1.0 start: Samurai and Viking crouched at the chalk line, sparks at Samurai's feet, "Watch me win at light speed!" on frame 0 -> the promise and both rivals -> low two-shot from behind the line (01)
- 1.0 GO1: he is past the ribbon with the trophy before "GO" finishes -> the cheat-fast win in one frame -> the same shot, green streak down the road (02)
- 1.6-2.5 victim: Viking still crouched, going red, steaming -> who lost and how he feels -> his face, close
- 2.5-4.0 AGAIN!: Viking points and shouts, Samurai small and calm behind -> the rematch -> medium on Viking (03)
- 4.0-6.6 demo 2: Viking in the red roadster, launch; GO; Samurai already leaning on the post, yawning, as the car slides in -> even a car loses -> wide behind the car, then down the road (04)
- 6.6-7.5 glare: Viking glares through the windscreen, one of Samurai's eyes opens -> the grudge grows -> two-shot over the bonnet
- 7.5-8.5 demo 3: "First one around the world!" -> the biggest bet -> challenge two-shot
- 8.5-10.3 blast + title: GO; streak to the horizon, the Wizard's hat flies, Viking braced behind his forearm, Reaper unmoved; its last 0.6 s in slow motion (no title card) -> the power at full size, the cover -> low wide down the road (05)
- 10.3-12.5 WON!: he skids in from behind the camera, trophy high, eyes shut laughing; fanfare -> he won, and he does not look -> close, golden wheat behind him (06)
- 12.5-14.9 twist: he opens his eyes: the road sixty years later, rusted car, two old men on sticks, Reaper the same; "...you won." -> the cost -> his view, high wide (07)
- 14.9-16.6 his face + the fact -> it lands on him; the real physics -> close on him with the trophy drooping
- 16.6-18.0 "Would you still want to win?" -> the question to the viewer; Reaper's slow blink -> three-shot (08), hard cut at the end

## Departures (and why)

- Frame 0 caption: "Watch me win at light speed!" instead of the brief's "Hate losing?": the matched-opening test promised on 9 Nov (title, first subtitle and frame 0 say the same line); read the 0:03 hold against EP02.
- 03: the brief's Wizard facepalm is not shown: panel 03 frames only Viking and Samurai, and a cutaway would break the 1.5 s shout.
- 03: Viking 121 % of the panel's size: the closer medium keeps the shout readable on a phone; Samurai still small and calm behind him.
- 04, the car shot before it (4.0-4.85 s): Viking from behind, his hair over the seat as in the panel, not through the windscreen (review A asked for his face): a camera in front of the car would look back up the road, where the painting has no back side.
- 04: the roadster in the near foreground rather than mid-frame: the chase camera stays static while the car passes it, which sells the speed; Samurai at the ribbon as drawn.
- 05: the Wizard reads 157 % of the panel's size because his flying hat counts in his height; the camera stays low and straight down the road like the painting (higher, it saw over the painted wheat bank onto its bare floor). The Reaper does not shield his face: he is the unbothered friend, and the panel's Reaper reads deadpan too. Samurai is cut out of the challenge-to-blast turn (cut on the action) so his hands never swing faster than 10 cm a frame.
- 05: the young roadster is not in demo 3 (the panel has no car); it comes back rusted at the same spot in 07.
- 06: the camera is level with his eyes, not below: looking up shows the top edge of the painted sky. The world ages at the reveal cut (07), not at his return, so 06 keeps the golden wheat behind him as drawn.
- 07: the camera stands high in the road behind his eye line (his view), the same angle as the panel, a step wider (the old men 65 % of the drawn size): on a phone the closer frame cut the Reaper's face at the right edge and showed the rusted car as a red smear (review A). At 13.6 s it cuts in to old Viking beside the unchanged Reaper for "...you won.", so the line and "Death doesn't age" land on one frame.
- 06-07: he opens his eyes at 13.1 s, not the brief's 13.50: three frames of open eyes before the reveal cut were lost on a phone (review B); the reveal cut stays at 13.50, and the wide pushes in a little over its 1.1 s.
- 08: a step wider than the panel (Samurai 52 %, Reaper 64 % of the drawn size): the closing question needs a clear band above three heads, and the Reaper's slow blink must sit left of the phone's right-hand buttons (the panel has him at x 0.87, under the like button). Packing them closer put their bodies into each other.
- The fact caption (15.85-17.6 s): the brief's first sentence only, whole at once (Jonny 9 Nov 13:20: cut it to its first sentence; 24 words in 1.7 s could not be read); the brief's 16.0-17.6 slot kept.
- No title card (Jonny 9 Nov 14:09 on EP02: the title "is the title of the video and should not appear mid video"): the 1.0 s freeze with the title at 10.0 s is now the blast's last 0.6 s of story in slow motion over 1.6 s (a speed ramp from 9.4 s), so every later beat keeps its time. The cover is the slow-motion frame, no text.
- A commentator voiceover (Jonny 9 Nov 13:07: the voice over of the other What if episodes, default for the format): five lines of the narrator voice where nobody speaks (1.50 "He never loses.", 6.05 "Not even close.", 9.4 "Sounds perfect, right?" over the slow motion, 13.52 "Sixty years later.", 17.62 "Would you still want to win?"). The last shot holds 0.7 s longer (19.7 s, not 19.0) so the spoken question has room; old Viking's "...you won." moves 0.1 s later (14.9) to clear the narrator. The first line has no subtitle: Viking's close fills the caption band. The first three lines sit in the streak's wind gusts, so they are lifted most (gain 2.4, 2.4, 3.0) and the ambience goes 0.5 -> 0.3 with the voiceover (`qa/lines.mjs`: all five +4.7 to +13.2 dB over the rest on a phone speaker; Whisper hears each word for word).
- Wheat rows: the painted wheat gusts with the wind bands at each GO (set life) instead of 3D wheat rows, which never matched the painting.
