TASK T3: the four museum skeletons and the "coming alive" sparks for There's a catch EP05. One props file + bench.
WHY: panels 02 and 04: mounted skeletons along the hall. When the Reaper's scythe rattles past, each one lights up
green and is a living animal half a second later (the generator swaps bones for the animal inside the glow).
DESIGN: BRIEF-COMMON.md (read first); board.png panels 02, 04, 05.
READ ALSO: engine/shared/trex-rig.js lines 1-30 (the T. rex's joint places: your `trexbones` uses the same ones).
OWN: engine/page/props-fossils.js (replace the stub; export FOSSILS_KINDS),
storyboards/series/what-if/05-back-to-life/bench/make-fossils-props.mjs and the JSON it writes. Touch nothing else.
CONTRACT (metres; origin on the ground between the feet, facing +z; bone #e9dfc4 with darker joints #b9a984,
chunky cartoon bones that read at 270 px, not a medical model: 9 to 12 rib pairs at most, fat vertebrae):
All four take `glow` 0..1 (bones turn bright green-white #b8ff9a by emissive and a soft additive green halo grows
round the whole skeleton: at 1 a glowing silhouette) and `rattle` 0..1 (every bone jitters a few degrees and
centimetres, deterministic from its index and the value: tween it for a shudder).
1. `trexbones`: the existing `trex` at rest as a skeleton, same joints (import TREX): standing 3.5 tall at scale 1,
   big skull with open jaw and teeth, eye sockets, neck, ribcage, hips, both legs with three-clawed feet, tiny
   arms, a tail of 14 shrinking vertebrae held level behind; two thin dark steel rods from the floor to the spine.
   At the same x, z, rot and scale as a `trex` it must overlap that animal closely (skull on head, feet on feet).
2. `mammothbones`: 3.4 long, 3.1 tall at the skull dome, 1.7 wide: domed skull, two long curved tusks (1.3 m),
   ribcage, four pillar legs, spine with tall shoulder spines, short tail; steel rods.
3. `sabrebones`: 1.8 long, 1.1 tall at the shoulder: big skull with two 0.28 m fangs, ribcage, four legs, tail.
4. `pterobones`: 2.6 wingspan, origin = the middle of the body, flying toward +z, hanging from two thin wires
   (spec.wire 3.5: their length up to the roof): long beak skull with crest, wing finger bones, small ribcage.
5. `lifesparks` (spec.r 1.5, spec.h 3; origin on the ground): param `rise` 0..1: a bright green ring of light
   climbs from the floor to spec.h with 40 sparkles trailing below it and fading; nothing drawn at 0 and at 1.
   Additive, through `ghost`.
Skeletons solid for the checks except halo and sparks.
DONE WHEN:
- bench: `plain` set (color "#9fcdf0", floor "#d9cfc0", light "golden"); plinths as `stoneblock` (w, h, d):
  sabrebones on a 2.6 x 0.3 x 1.6 one at [3.4, 0.5] rot -90; mammothbones on a 3.2 x 0.3 x 4.4 one at [3.6, -4.2]
  rot -55; trexbones (scale 1.5) on a 3.4 x 0.3 x 3.0 one at [1.0, -11] rot 0; pterobones at [2, 5.5, -1] rot -60
  and [2.2, 5.8, -6.5] rot -110; all skeletons at y 0.3 except the hanging ones; `potatobrawl/spud` at [-0.6, 2.3].
  Cameras: A {pos [-0.2, 1.1, 7.6], look [0.75, 1.5, 0], fov 44}; B {pos [-0.3, 0.3, 2.6], look [0.8, 2.9, -10.6],
  fov 54}; C (side on: each skeleton alone, 6 m away). Stills: A; B; C each at glow 0, 0.5, 1 and rattle 1; one
  still with a half-transparent check: `trex` and `trexbones` at the same place (scale 1.5), side on; lifesparks
  at rise 0.3 and 0.7 round the sabre-tooth
- contact sheet storyboards/series/what-if/05-back-to-life/bench/fossils-sheet.png; each skeleton reads as its
  animal in one second at 270 px (tusks = mammoth, fangs = sabre-tooth, big jaw = T. rex)
- the common DONE lines in BRIEF-COMMON.md
OUT OF SCOPE: living animals (T2), the hall (T1), changes to the trex or its rig.
