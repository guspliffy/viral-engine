TASK R2: a real woolly mammoth and a real sabre-toothed cat (read BRIEF-REAL.md first)

OWN: engine/page/props-iceage.js: REPLACE the `mammoth` and `sabretooth` kinds in place (leave the `pterosaur`
     kind and the shared helpers it needs exactly as they are: another builder replaces it in another file);
     bench/make-iceagereal-props.mjs + its json + bench/iceagereal-sheet.png
READ: BRIEF-REAL.md; engine/page/geo.js (makeLoft); engine/page/props-iceage.js lines 1-75 (the header: KEEP every
      param name, sign, default and meaning of mammoth and sabretooth, the origin, and the overall sizes, so the
      clip's staging holds) and the two kinds' `apply` blocks; engine/page/props-dino.js lines 46-100.
Update the header: sizes, anatomy, "real, not cute"; the head/face params stay.

MAMMOTH (Mammuthus primigenius; keep 3.4 long, about 3.1 tall at the head dome, origin between the feet):
  ONE skin from the tail through the body and neck to the skull dome (side profile, front to back): the head dome
  is the HIGHEST point (tall, narrow, peaked), a clear dip at the neck, a high shoulder hump just behind it, then
  the back SLOPES DOWN steeply to low hips (hips at 70 % of the shoulder height). Body deep and barrel-wide.
  Legs: four pillars, each ONE loft socket -> knee/elbow -> foot, nearly straight, slightly thicker at the foot,
  flat round feet with 4 pale toenails; front legs longer than hind legs; walking gait in diagonal pairs with a
  real knee bend on the lifted leg (IK or FK), planted feet do not slide (stride in the header).
  Trunk: ONE loft from the forehead down (1.9 m, tapering 0.20 -> 0.07, two finger tips at the end, wrinkle lines
  painted), bent by `trunk` / `trunkY` exactly as now (-1 curled in, 0 relaxed S, 1 raised over the head).
  Tusks: lofts or tapered tubes 1.5 m: out of the cheeks DOWN and outward first, then sweeping forward, up and
  inward (a wide spiral), ivory with brown stains at the root. Small furry ears, close to the head. Mouth under the
  trunk root with a lower lip that drops for `jaw`. Short tail with a tuft.
  Coat: long shaggy hair as (a) painted long downward strokes on the skin, dark chocolate #4a3222 on the back to
  red-brown #7d5234 on the flanks, and (b) a ragged curtain of long hanging locks (flat tapered strips, uneven, 40+)
  along the belly line, the chest, the cheeks and the top of the legs so the outline is hairy, not smooth. A mop on
  the dome. Eyes small (r 0.035), dark brown, deep in the skull's side under a heavy hairy brow, lashes.
  REAL TELLS: 1 dome highest, neck dip, shoulder hump, sloping back | 2 tusks spiral down-out then up-in
  3 pillar legs with knees, front longer | 4 hairy outline with a belly skirt | 5 small eye, small ear
  6 trunk is one tapering skin | 7 no ball, no seam.
SABRE-TOOTH (Smilodon; keep the present length and shoulder height, origin between the feet):
  ONE skin tail -> skull: built like a bear-lion, NOT a house cat: massive shoulders and forelimbs, deep chest,
  back sloping DOWN from shoulders to lower, lighter hindquarters, short bobtail (0.25 m), thick muscular neck as
  long as the head. Head: long flat forehead line into a broad muzzle, small round ears set low, strong cheekbones,
  short lower jaw with a chin flange; two flat curved sabres 0.26 m long from the upper jaw, tips well below the chin
  when the mouth is closed; `jaw` 1 opens very wide (keep 46 deg or more, Smilodon gaped to 90).
  Legs: each ONE loft with real joints. Front: shoulder -> elbow (back) -> wrist -> big paw. Hind: hip -> knee
  (forward) -> hock (back, high) -> paw: digitigrade like any cat. Walk in diagonal pairs, crouch / bound as now,
  planted paws do not slide. Paws broad with 4 toes; claws only hints.
  Coat: short fur, tawny #c79a5e, paler cream throat, belly and inner legs, faint darker rosette smudges on the
  shoulders and flanks (few, uneven, soft: not a leopard pattern), darker ear backs and tail tip, fine short hair
  strokes. Eyes small (r 0.03), pale amber, round pupil, dark rim, forward-facing; pink-brown nose pad; a few thin
  short whiskers. `lick`, `tail`, `crouch`, `bound` as now.
  REAL TELLS: 1 shoulders higher and heavier than hips, sloping back | 2 bobtail | 3 sabres past the chin
  4 front and hind legs bend the right way (elbow back, knee forward, hock back) | 5 flat forehead, small low ears
  6 small forward eyes | 7 no ball, no seam.

BENCH STILLS (each animal alone at [0,0], scale 1.3 mammoth / 1.6 sabre-tooth, Spud at [1.6, 0, 2.6] for scale;
every beat sets every param, dur 0). Per animal: 1 side at rest (camera far on +x, whole animal) 2-4 side gait 0.25,
0.5, 0.75 5 three-quarter front 6 front from below (camera [0.3, 0.45, 5] looking up), the HUNGRY face: brow -1,
squint 0.7, jaw 0.5, drool 1, lookY -0.8, headP 22 7 head close-up side, jaw 1 8 calm face close-up, brow 0.4
9 glow 0.5 10 glow 1. Mammoth also: trunk -1, trunk 1. Sabre-tooth also: crouch 1, bound 0.5.
