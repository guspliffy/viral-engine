# EP08 "What if your friend could pause YOU?": design numbers for the new things

Creative director, 13 Nov 2026. Jonny's BRIEF.md wins over this file. Units: metres, hex, frames at 30 fps, px at
1080x1920. Screen scale assumed: the medium-wide across the table (MAIN-like, fov 48, about 3.5 m to the table) gives
about 615 px per metre; a potato is 1.04 m = 640 px tall, the cookie 0.15 m = 92 px. Every px figure below is at that
shot and scales with it.

## 1. The magic remote

- **Hand**: Wizard's LEFT glove (his prop hand, grip `hold`; the camera-side hand when he faces the table) in every
  frame of the clip. His right glove does everything else (cookie, cushion). Never in Reaper's glove.
- **Body**: rounded slab 0.34 long x 0.10 wide x 0.04 thick, corner radius 0.022, top face flat. On screen 209 x 61 px.
  About twice a real remote on purpose: a real one would be 100 px and unreadable.
- **Colours**: body cream `#f1e9d8` (lit) / `#cdbfa6` (cel shadow), ink line as on the characters. Cream because the
  glove is `#262540`, the cape purple, the armchair red: it is the only pale object in his half of the frame.
- **The one button**: round, diameter 0.076 (47 px), centre 0.235 from the butt (so 0.105 from the tip), raised 0.008.
  Face cyan `#3fd0ff`, side `#1f8fc4`. Pause sign: two bars, each 0.014 wide x 0.036 tall, gap 0.012, colour
  `#1c2340` (9 x 22 px each, dark on bright). No ring, no text, no other buttons.
- **Press**: button sinks 0.005 in 2 frames, face goes to `#bff3ff` for the frames the ray is on, back up in 3 frames.
- **Secondary detail (two only)**: an emitter lens on the tip end, a dome 0.034 across standing 0.012 proud,
  `#bff3ff`, unlit `#8fb9c9`; and one band 0.014 wide around the body 0.03 behind the tip, purple `#7a4fc2` (ties it
  to Wizard). Nothing else on the top face.
- **Grip and thumb**: the fist wraps the rear 0.14 of the body (three fingers under, visible past the far edge).
  Thumb rests on the cream top face with its tip 0.17 from the butt, 0.027 short of the button's lower edge. To press
  it slides 0.04 forward in 3 frames and covers at most the lower 30% of the button: the pause bars stay visible.
- **Ray end**: the tip (lens) end, the end away from the fist. The remote's long axis always lies on the ray line.
- **Reaper's press (34 s)**: his glove comes from the camera side and one finger lands on the upper 50% of the
  button; Wizard's frozen thumb stays at its rest spot (off the button), so the two never overlap.

## 2. The ray

- **Shape**: one straight line from the lens to the hit point. No taper, no wobble, no particles, no flare.
- **Colours**: core `#eafcff` at 100%, 6 px wide; glow `#58d8ff`, 22 px wide in total, 55% at the core falling to 0%
  at the edge, additive. Minimum on any shot: core 4 px, glow 16 px (scale up in wides, never down below that).
- **Grow**: the head leaves the lens the frame the button bottoms out and reaches the target in 3 frames. The head
  is a soft round blob 16 px across, `#ffffff` at 80%, only while travelling.
- **Hold**: 8 frames at full strength on the target (11 frames lit in all), remote dead still for those frames.
- **Fade**: 6 frames, opacity 100% to 0% linear, width unchanged. The button unlights on the same frames.
- **Hit on a body**: a soft disc on the surface, 0.10 across (62 px), `#bff3ff` at 70%, up in 2 frames, gone in 6.
  This is the origin of the freeze and thaw wipes (section 3). No rings, no star.
- **The bounce (21.0 s and 34 s)**: the tray's face is held 4 degrees off square to the ray, normal tipped down.
  Incidence 4 degrees, reflection 4 degrees, so the return leg leaves 8 degrees below the incoming one and lands on
  Wizard's chest 0.11 below the lens at a 0.80 remote-to-tray gap (68 px apart at Wizard: a narrow V, two legs seen).
  - Out leg: 4 frames lens to tray. Glint: 2 frames. Return leg: 6 frames tray to chest (slower so the eye follows).
  - Both legs then hold 10 frames together, fade 6 frames. Total 28 frames (0.93 s).
  - Return leg identical in colour and width to the out leg; its head blob 20 px.
  - **Glint at the bounce point**: a soft disc, 0.06 across (37 px) growing to 0.16 (98 px) in 2 frames, `#ffffff`
    at 90% with a `#58d8ff` edge, holding at 98 px for the return leg's 6 frames, fading over the next 6. A plain
    round bloom, no spikes.
  - Staging for it: the same medium-wide, remote, tray and Wizard's chest all inside the frame, 6 frames of both
    characters still before the click, no cut between click and freeze.
  - At 34 s the gap is 0.45 (Reaper's reach): out leg 3 frames, return leg 4, the V is 39 px wide at the chest.

## 3. The frozen look (the hit character only)

- **Applies to**: that character's body, costume, gloves, sprout and face. Not the remote (stays full colour in
  frozen Wizard's glove, so it still reads as working), not the sofa, armchair, tray, cookie or cushion.
- **Grade**: saturation x0.45, brightness x0.88, contrast x0.90, then a multiply of cool tint `#a9c4e6` at 25%.
  Ink lines keep their colour and weight. Check value: Reaper's body `#e2a95c` should land near `#b8a58f`.
- **Freeze-in**: a circular wipe from the hit disc, radius 0 to 1.2 m in 3 frames, hard-ish edge (0.03 soft), no rim
  colour. Fast and cold.
- **Body while frozen**: the pose of the hit frame, exactly. No breathing, no blinks, no eye drift, no mouth, no
  cape, hat or sprout sway (cloth and follow-through stop on the same frame, no settling). Eyes stay where they were
  looking. Anything already released (cushion) or not gripped keeps its own motion; a gripped object stays gripped.
- **To prove it is not a playback error**: the other character moves within 4 frames of every freeze and the frozen
  one is in frame with something moving for at least 12 frames.
- **Thaw cue (distinct from the freeze)**: colour floods back from the hit disc, radius 0 to 1.2 m in 8 frames,
  led by a warm band 0.06 wide, `#fff1c9` at 60%. When the wipe ends the whole character sits at brightness x1.08
  for 3 frames, then x1.00. Motion restarts the frame the band passes the chest: the interrupted move finishes, then
  one visible breath (body up 0.012 over 6 frames, down over 8) and the first blink 6 frames after the wipe ends.

## 4. The silver serving tray

- **Size**: round, 0.36 across the rim (221 px), flat mirror floor 0.31 across, rim 0.025 wide and 0.018 high,
  rolled. Thickness 0.006. It fits the 0.42 deep table with 0.03 to spare front and back.
- **Handles**: two, opposite each other on the table's long axis (left and right as the camera sees it). Each a
  flat D-loop standing 0.045 out from the rim, 0.09 wide, bar 0.014 thick, opening 0.062 x 0.022. Overall 0.45
  across the handles. A mitten glove closes over one handle; Reaper carries and raises it by the handle on his side.
- **Colours**: floor `#dfe6ee`, rim lit `#f7fafc`, rim shadow `#8e9aa8`, handles `#c3ccd6`, underside `#7b8794`.
  One fixed pale streak across the floor, 0.05 wide at 25 degrees, `#ffffff` at 35%, so it reads "polished metal"
  even where the reflection is plain wall.
- **Mirror**: a real reflection on the floor at 85% strength, mixed with 15% of `#dfe6ee`, cel-flat (no blur, no
  roughness), reflected ink lines kept. The rim does not reflect.
- **Plate on it**: white plate 0.22 across, centred; the 0.045 ring of mirror around it is the plant from frame 1.
- **Panel 10 (17.0 s, close over Reaper's shoulder, looking down)**: the tray fills at least 700 px of the 1080
  width, plate and cookie pushed to the tray's near third so 60% of the floor is clear mirror. In that clear area:
  Wizard hat-to-base at least 330 px tall, hat and face unobstructed, the remote at least 110 px long with its cyan
  button at least 24 px across, held up beside his body, not in front of it. Reflection as a mirror lying flat
  gives it: Wizard appears head-down toward Reaper, with the real armchair's foot cut by the frame top so the two
  connect. Reaper's hood edge fills no more than the left 25% of the frame. Hold 1.2 s minimum.
- **As a shield (21.0 s)**: held by one handle, floor facing Wizard, centre 0.80 from the lens and 0.75 above the
  floor, hiding Reaper from sprout to chest; his eyes clear the top rim by 0.04 in panel 13.

## 5. The cookie halves

- **Break line**: across the middle, a shallow zigzag of 5 segments, each tooth 0.008 to 0.012 deep, going around
  two chocolate chips rather than through them. Not a straight cut: the halves must read as broken, not sliced.
- **Halves**: 52% and 48% of the cookie; Reaper puts the larger one on Wizard's plate. Broken faces lighter than
  the top, `#e9c98a` against the baked top's own colour, 0.018 thick, with 2 chip cross-sections `#4a2c1a` each.
- **The snap (28.0 s)**: both gloves, the halves hinge apart 25 degrees over 3 frames then separate 0.05. Crumbs: 7,
  sizes 0.004 to 0.009 (2 to 6 px), `#d9b071`, falling under gravity, all on the table within 10 frames, lying
  there to the end of the clip. No crumb cloud.
- **Side by side (42.0 s)**: held one per character, broken edges facing each other, tapped together with the
  zigzags meeting within 0.005 so they visibly fit; 0.03 apart before and after the tap. Each half 92 px tall.

## 6. Sounds (real recordings only; the ray itself is silent)

| Moment | Real recording | Note |
|---|---|---|
| Button click | one press of a hard plastic TV-remote button, close-miked, dry | same sample every press; on the frame the button bottoms out |
| Freeze | nothing added: every sound the frozen character was making stops dead on the hit frame (cloth rustle, breath, sofa creak) | the cut-off is the cue; the room tone and the other character continue |
| Thaw | one short nasal breath in, then the cloth rustle and sofa or armchair creak of the move resuming | starts on the frame the warm band passes the chest |
| Cushion hit | a feather pillow thumped against a jumper-clad chest, soft, no slap | plus a small cloth slide as it drops to his lap |
| Cookie on plate | a hard biscuit dropped 0.3 m onto a ceramic side plate standing on a metal tray: one clack with a faint metal ring under it | one bounce at most |
| Cookie snap | a crisp chocolate-chip biscuit broken by hand, dry crack | plus 2 or 3 crumb ticks on wood |
| Plate off the tray | glazed ceramic sliding on steel, then its foot landing on a wooden table | 19.0 s |
| Tray lifted, raised, set down | a thin stainless steel tray picked up off wood by a handle: light scrape, a very short low ring; set down = soft double knock on wood | no sustained ring, under 0.3 s; the 42.0 s tilt is silent (one streak slide 0.10 over 8 frames, no bloom) |

## Open questions (my default in brackets)

1. Bounce angle: the brief says "bounces straight back". A leg exactly on top of the out leg cannot be seen, so I
   set 4 degrees off square (8 degrees between legs). [Keep 4; go to 2 only if stills show the V too wide.]
2. Panel 10 reflection is head-down, as a flat mirror really shows it. [Keep true; if review A's phone sheet fails
   to read "Wizard + remote", cheat the reflection upright, same sizes.]
3. The brief's "short, consistent freeze tone" against the real-sounds rule. [No tone: the sound cut-off is the
   freeze, the breath is the thaw. Jonny's call.]
