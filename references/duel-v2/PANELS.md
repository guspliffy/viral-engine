# Duel v2: Jonny's reference boards, panel by panel (8 Nov 2026)

These are the target shots. The boards are `01-posing-and-choreography.png` (panels 01-03) and `02-lighting-impact-and-aftermath.png` (panels 04-06). The prompts that made them are in `REFERENCE-PROMPTS.md`.

The generator is `tools/human/make-duel-01.mjs v2`, which writes `storyboards/human/duel/duel-02.json`.

## The whole board

- **Place.** One old city street at blue-grey twilight. It has shop awnings, masonry, the yellow centre lines and road seams. There is no rooftop and nothing jumps to another place.
  - Built as `twilight-city-crossing`: the golden-hour street (`golden-city-crossing`) graded by `engine/plates/grade-twilight.py`. It is the same painting, so it keeps the same camera range.
  - The board's street has the same yellow lines and awnings.
- **Light.** Cool, desaturated blue-grey ambient light. The fire is the only warm light: orange on the planes turned to it, with cool hard shadows on the other side.
  - Built with the set's `lighting` 2 measured on the graded painting, exposure 0.78, and `castLight` on the fire prop (`engine/page/firelight.js`, a warm cel band in the toon shader).
- **Fire.** Pointed, asymmetric, calligraphic tongues: a cream core, a golden body and a deep orange rim, with broken embers. No round explosion blob, no giant beam and no white screen.
  - Built as the fire prop's `style: "tongue"`, where a burst is a star of spikes.
- **Costumes.** Teo: black hair, teal headband with tails, white top with green panels, black wristbands, dark trousers, grey shoes. Ryn: grey hair, black outfit with a grey hood and shoulder, purple gloves and sash.
  - Built as the v1 designs, unchanged. The board shows Ryn's gloves and sash purple; ours are blue-violet `#3a35b8` / `#5b4cf0`, close enough. That is a departure only if Jonny says so.

## Per panel

| Panel | Camera | Who is where, facing | Pose | Fire and light | v2 shot |
|---|---|---|---|---|---|
| 01 anticipation | Medium-low, full body, three-quarter view, low but not distorted | Teo left of centre, facing screen-right. Ryn as a near, out-of-focus silhouette at the right edge (over his shoulder) | Rear leg loaded, front knee bent, hips and shoulders wound back. Rear fist at the hip holds a small curled flame, the lead hand guards the cheek | A small held flame in the rear fist. Feet planted with contact shadows | `windup` |
| 02 release | Close to Teo, the fist big and near the camera at frame right | Teo lunges screen-right. Ryn at right rear, leaning out of the path | Lunge punch: the drive runs from the rear foot through the hips to the shoulder. Strong diagonal spine, headband and hem trailing | The flame is narrow at the fist and widens toward Ryn. It never hides a face | `release` |
| 03 evasion | Ryn in the foreground, Teo small far left | Ryn facing screen-left | A crouching duck: lead foot planted, rear foot dragging dust, head below the fire path, guard up | The flame passes just over his head and hits the masonry at frame right in sparks and debris. Orange on his fire-facing cheek | `duck` |
| 04 fire-light | Teo chest-up, three-quarter view, facing right | Teo alone | Clenched teeth, knitted brow, a sweat mark, the fist in front of the lower chest | A tightly coiled flame over the fist. It lights the cheek, fingers and top orange, with cool shadows on the other side | `fist` (frame 0) |
| 05 clash | Low medium-wide, portrait, on a diagonal | Teo screen-left and nearer, Ryn screen-right and farther. Both full bodies | Deep braced stances, bent elbows, compressed knees, pushing into one point | One small contact star between the fists, with a dust ripple from that point and lit pavement around it. Speed streaks only near the contact | `clash` |
| 06 consequence | Ryn in the right foreground, Teo far left background | Ryn facing left | Pushed back into a low skid: one glove on the road, the other forearm up, a dust trail and boot scrape. Teo is recovering his stance | A fresh scorch mark where they met. The fire dimmed so his face carries the moment | `pushed` |

## Departures

- **Ending.** Jonny's v1 brief says the fight ends open on a clash of flames. Panel 06 is the consequence of the first clash, not the end. After it Ryn comes back and the second clash ends the clip open: two stars meet, nobody wins.
- **Drawing quality.** The boards are 2D key drawings. Ours are 3D VRoid bodies with ink and cel shading, so the anatomy and the foreshortening are only as strong as the mocap and the lens allow. The poses come from real CMU takes:
  - 135_09: lunge punch, with its stance as the wind-up;
  - 139_09: ducking;
  - 139_16: low, with a hand on the ground, getting up.
- **Distance.** The board's clash (05) has the fists close together. Our fighters stand about 1.9 m apart, which is closer than v1's 4 m (Jonny's "they keep their distance" rule). There is no contact: the star sits in the gap between the fists.
- **Frame 0 (04).** Teo's flame burns on his raised lead fist beside his face (the face stays clear), not on a fist
  at the lower chest: the mocap gather pose keeps the other fist low and out of the light.
- **Wind-up (01).** No held flame in the rear fist: from the camera side the hip fist sits behind his body and the
  flame read as his shirt on fire (reviews A and B). Ryn is not a near silhouette: the camera fit holds whole bodies.
- **Duck (03).** Ryn's head is tucked down in the CMU ducking take, so his face doesn't read in this shot.
- **Clash wides (05).** The camera is a little higher than the board's: lower, it sees past the painted road and has to
  tilt up.
