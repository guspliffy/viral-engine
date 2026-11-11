TASK T1: the museum hall and its small exhibits for There's a catch EP05. One props file + bench.
WHY: panels 02-09 all play in one bright natural history hall. In one second it must read "grand museum, daylight
through a glass roof, exhibits behind a red rope". The plant and the fish are the first two proofs of the power.
DESIGN: BRIEF-COMMON.md (read first); board.png panels 02, 03, 04, 06, 09.
OWN: engine/page/props-museum.js (replace the stub; export MUSEUM_KINDS),
storyboards/series/what-if/05-back-to-life/bench/make-museum-props.mjs and the JSON it writes. Touch nothing else.
CONTRACT (metres; origin on the floor unless said):
1. `museumhall` (spec.w 12, spec.d 28, spec.h 9; origin = the floor's centre): a shell seen from INSIDE, from both ends.
   - floor: polished pale marble, big tiles about 1 m (cream #e9e2d2 and warm white, thin grey joints, soft veins,
     slight sheen), receives shadows;
   - long walls (x = +-w/2): cream stone #e6dcc4, a dado band, flat pilasters every 4 m with simple capitals, between
     them tall arched windows (2 m wide, sill at 1.6, top at 6.6) showing bright sky #9fcdf0 with a soft cloud, dark
     thin glazing bars; a cornice at 7 m. Along the LEFT wall (x = -w/2 + 0.5) four small static display cases
     (0.8 x 0.8, 1.5 tall, dark wood base, glass top, a small fossil or shell inside) at z -11, -6, 5, 9 (hall
     frame). The RIGHT wall stays bare below 5 m (skeletons stand in front of it: another task);
   - end wall (z = -d/2): one huge arched window (6 wide, to 8 m) with sky; entrance wall (z = +d/2): tall double
     doors (3 wide, 4.5 tall, dark wood, brass handles) under a round window;
   - roof: a glass barrel vault from 7 m to 9 m: sky blue with clouds seen through a dark grey iron lattice (drawn,
     bars about every 1.2 m), plus five real iron arches across the hall;
   - LIGHT: the scene's sun must still reach the cast: no wall, roof, arch or window casts a shadow (castShadow
     false); walls and roof are unlit or self-lit enough to stay bright (never grey or dark); only the floor
     receives shadows. Everything except the floor goes through `ghost` (not solid: bodies are checked against it).
2. `plinth` (spec.w 2, spec.h 0.3, spec.d 2; origin bottom centre): a grey stone slab #b9b2a4 with a bevelled top
   edge and a darker base line. Solid.
3. `exhibitrope` (spec.posts [[x, z], ...] in the prop's frame, in order): brass posts 0.95 tall (r 0.03, round base
   r 0.14, ball top) and a red velvet rope #b3272d (r 0.025) sagging 0.12 between neighbours. Param `rattle` 0..1:
   the ropes swing and the posts lean up to 6 degrees (alternating), for the moment a scythe drags along them.
4. `glasscase` (1.1 x 1.1, base 0.9 tall dark wood #5a3d2a with a brass label, glass 1.2 tall with thin brass edges,
   total 2.1; the show side is +z): inside, a tilted stone slab (0.8 x 0.6) with a fossil fish imprint (head, spine,
   ribs, tail drawn dark on tan). Params: `fossil` 1 at rest (0 = the imprint is gone, an empty fish-shaped hollow
   stays), `glow` 0..1 (green light #7dff6a inside the glass, additive), `burst` 0..1 (the +z pane breaks: a jagged
   hole, 14 shards and 24 water drops fly out toward +z and up on arcs driven by burst alone, gone by 1).
   Base solid, glass through `ghost`.
5. `livefish` (0.5 long, 0.2 tall, 0.14 thick; origin = its middle, head toward +x): a chunky silver-blue fish
   (#8fb4cf back, silver belly, drawn scales), big round cartoon eye each side, open-able mouth, tail and fins.
   Params: `flop` -1..1 (the body bends in an arc, tail one way and head the other), `gasp` 0..1 (mouth),
   `wet` 0..1 (8 drops fly off it). Not solid (it is carried against a chest).
6. `wiltplant` (origin on the floor): a small wooden stool (0.45 tall, 0.4 wide) with a terracotta pot (r 0.2, 0.3
   tall) on it. Param `bloom` 0..1: at 0 seven drooping grey-brown stalks with curled dead leaves hang over the rim
   (top at about 0.95); at 1 they stand up green (#4f9a45) with broad leaves and six pink flowers (#f4a6c0, yellow
   centres, 0.12 across), top at about 1.35; between: stalks rise first (0-0.6), colour turns, flowers pop
   from 0.5 with a small overshoot. Readable as dead vs alive at 270 px.
DONE WHEN:
- bench: `plain` set (color "#9fcdf0", light "golden"), the hall at x 1, z -2; a plinth 3.4 x 0.3 x 3.0 at
  [1.0, -11] with the existing `trex` (scale 1.5) on it at y 0.3; the rope with posts [1.6, 3], [1.6, 1], [1.6, -1],
  [1.6, -3], [1.6, -5], [1.6, -7]; the case at [-1.2, 0.3]; the plant at [1.25, 2.55]; `potatobrawl/spud` at
  [-0.6, 2.3]. Cameras: A {pos [-0.2, 1.1, 7.6], look [0.75, 1.5, 0], fov 44}; B (low wide) {pos [-0.3, 0.3, 2.6],
  look [0.8, 2.9, -10.6], fov 54}; C (the other way) {pos [-1.2, 0.9, -3.6], look [1.4, 1.4, 2.6], fov 44};
  D (the case) {pos [-1.15, 1.15, 7.0], look [-1.15, 1.35, 1.5], fov 36}; E (the fish, 1 m from it, held at
  [0, 1.2, 4]). Stills: A with bloom 0 and 1; B; C; D with fossil 1 / glow 1 / burst 0.4 and fossil 0; E flop -1, 0, 1
- contact sheet storyboards/series/what-if/05-back-to-life/bench/museum-sheet.png; in A, B and C the hall is bright
  and reads as a museum, Spud and the T. rex are fully lit (not in shadow), the frame's top 20 % is calm
- the common DONE lines in BRIEF-COMMON.md
OUT OF SCOPE: skeletons and living animals (T2, T3), the building's outside (T4).
