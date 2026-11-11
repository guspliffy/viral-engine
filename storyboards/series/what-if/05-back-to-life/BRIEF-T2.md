TASK T2: the three living ice-age animals for There's a catch EP05: mammoth, sabre-tooth, pterosaur. One props file + bench.
WHY: when the skeletons wake, the hall fills with living giants (panel 06), which then look DOWN at the potatoes
hungry (panel 08) and chase them (09, 10, 11). Each must read in one second as its animal and switch from
"calm and curious" to "starving" with its face alone.
DESIGN: BRIEF-COMMON.md (read first); board.png panels 06, 07, 08, 09, 11.
OWN: engine/page/props-iceage.js (replace the stub; export ICEAGE_KINDS),
storyboards/series/what-if/05-back-to-life/bench/make-iceage-props.mjs and the JSON it writes. Touch nothing else.
CONTRACT (metres; origin on the ground between the feet, facing +z; every kind takes spec.scale through the engine):
Shared params on all three: `glow` 0..1 (every material turns toward bright green-white #b8ff9a by emissive, 1 =
a glowing silhouette: used for the moment bones become flesh), `jaw` 0..1, `brow` -1..1 (- angry, + raised),
`squint` 0..1, `blink` 0..1, `lookX` / `lookY` -1..1 (pupils), `headY` / `headP` degrees (+ left, + down),
`drool` 0..1 (two or three thick strands from the lower lip, drops at their ends), `breath` 0..1.
1. `mammoth`: 3.4 long, 3.1 tall at the head dome, 1.7 wide. Shaggy red-brown coat (#8a5a36, darker #5e3b24 under
   the belly) built from big overlapping scalloped fur tufts (drawn texture + a ragged skirt of tufts along the belly
   and a mop on the head dome), small ears, a long trunk in 10 segments, two long cream tusks curving out and up
   (1.3 m), four pillar legs with toenails, short tail. Params: `gait` (a count of walk cycles: legs swing in
   diagonal pairs by its fraction, the body bobs 4 cm, whole numbers = standing), `trunk` -1..1 (-1 hanging and
   curled in, 0 relaxed S, 1 raised high over the head), `trunkY` degrees (swing sideways), `ears` 0..1 (flap).
2. `sabretooth`: 1.8 long (plus tail 0.5), 1.1 tall at the shoulder, 0.6 wide. Sandy coat #d9a95c with brown
   spots drawn once each, cream muzzle and belly, heavy shoulders, short tail, big head with two 0.28 m curved
   fangs, pink nose, whiskers. Params: `gait` (as above; at speed the pairs bound), `crouch` 0..1 (chest low,
   rump high: the stalk), `lick` 0..1 (a pink tongue sweeps across the lips), `tail` -1..1.
3. `pterosaur`: 2.6 wingspan, body 0.7 long; origin = the middle of the body, flying toward +z. Orange-tan
   #d98a4a with a darker head crest, long toothed beak, leathery wings (membrane drawn with finger bones and
   translucent ochre). Params: `flap` (a count of wingbeats: fraction 0 = wings level, they sweep +-40 degrees),
   `bank` degrees (roll), `fold` 0..1 (wings folded: hanging/perched).
Faces: big bulging eyes with dark pupils, upper lids and brows like the `trex`. "Starving" = brow -1, squint 0.7,
jaw 0.3, drool 1, pupils down: the bench must show that this face reads at 270 px on all three.
Bodies solid for the checks; drool and glow halo through `ghost`.
DONE WHEN:
- bench: `plain` set (color "#9fcdf0", floor "#d9cfc0", light "golden"); mammoth at [3.3, -3.4] rot -70,
  sabre-tooth at [-1.9, -2.1] rot 65, the existing `trex` (scale 1.5) at [0.4, -5.5], a pterosaur at [1.5, 5.5, -3]
  rot 90, `potatobrawl/spud` at [0.1, -0.7] yaw 180 (back to camera, looking up). Cameras: A (low wide, panel 06)
  {pos [-0.3, 0.3, 8.6], look [0.8, 2.9, -4.6], fov 54}; B (looking up at the faces, panel 08)
  {pos [0.1, 0.45, 3.5], look [0.05, 2.45, -1], fov 55}; C (side on: each animal alone, 6 m away).
  Stills: A calm (rest) and A starving; B starving; C for each animal at gait 0, 0.25, 0.5 and glow 0, 0.5, 1;
  the pterosaur at flap 0, 0.25, 0.75; mammoth trunk -1, 0, 1; sabre-tooth crouch 1 + lick 0.5
- contact sheet storyboards/series/what-if/05-back-to-life/bench/iceage-sheet.png; the three animals match the
  `trex` in style and sit on the ground (feet at y 0 at gait 0, never floating or sunk)
- the common DONE lines in BRIEF-COMMON.md
OUT OF SCOPE: skeletons (T3), the T. rex itself (T5), sounds.
