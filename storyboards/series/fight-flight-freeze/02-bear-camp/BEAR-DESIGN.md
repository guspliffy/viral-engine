# BEAR-DESIGN: the `bear` prop (engine/page/props-bear.js)

Build spec for ONE prop kind, `bear`: a REAL adult male American black bear (Ursus americanus, about 400 kg), as a natural-history illustrator would draw it, matching the
approved panels (01, 03, 05-11): glossy black fur, tan-brown muzzle, small dark eyes, heavy shoulders, real claws. Never gory. The builder copies the STRUCTURE of
`sabretooth(P)` in engine/page/props-iceage.js (one `makeLoft` skin tail -> skull, one loft per leg, joints worked in `apply(ps, t)`, painted canvas skins, `realEyes`, no
random, no clock) and takes every number from this file. Helpers that are private in props-iceage.js (`cvs`, `once`, `mesh`, `palette`, `ramp`, `ik2`, `footPath`,
`realEyes`, `browLoft`, `locksGeo`, `lockMeshes`, `fleck`, `rnd`, `sstep`, `mix3`, `nrm3`) are copied into props-bear.js unless the lead says to export them. Units: metres,
degrees. Origin: on the ground between the four feet, facing +z, +x = the bear's left.

## 1. Header comment (paste as the file's header, same format as the sabretooth block)
```
//   bear        Ursus americanus, adult male: 2.0 long (rump z -0.96 to nose z +1.04; plus a 0.10 m stub tail), 1.08 at the shoulder,
//               1.10 at the rump (the rump is the high point, NOT the shoulder), 0.76 wide. Origin: on the ground between the feet.
//               Side profile, back to front: a high round rump (1.10), a shallow dip mid back (1.05), a LOW soft shoulder hump (1.08),
//               a short thick neck carried level, the head carried at or just under the back line (crown 1.04, ear tips 1.12). The face
//               is one straight "Roman" line from the forehead to the nose tip (no dish, no stop). Deep barrel (belly 0.38). Tall
//               rounded ears set wide on the skull. Legs: one loft each; front = shoulder -> elbow (back) -> wrist (low) -> broad flat
//               paw, toes turned IN 12 deg; hind = hip -> knee (forward) -> heel ON THE GROUND -> long flat foot (plantigrade). Five
//               curved claws per paw (front 4.5 cm, hind 2.8 cm). Coat: glossy warm black #17130f with painted grey-brown sheen bands,
//               about 90 short fur locks on the outline; tan-brown muzzle #b07d45; black wet nose pad; NO chest blaze (the panels show
//               none). Eyes r 0.019, dark brown, close-set, a white catch-light; no visible sclera.
//               Where the head is (scale 1, rest): eyes at x +-0.09, y 0.95, z 0.885; mouth line y 0.775 (front teeth z 1.00); nose
//               tip (0, 0.83, 1.04); jaw hinge (0, 0.80, 0.76); the head turns about (0, 0.90, 0.62). The body pitches about the
//               hips (0, 0.80, -0.76).
//               gait      count of walk cycles, a real bear walk (lateral sequence: left hind, left front, right hind, right front, a
//                         quarter cycle apart); each foot is planted 62 % of a cycle and slides back 0.74 m: no sliding at 1.2 m per
//                         cycle at scale 1; the lifted paw rises 0.10 m; the body dips up to 3 cm and rolls 2 deg. 0 = standing; the
//                         walk eases in over the first 0.15 cycle (a whole number above 0 is a walk pose: tween back to 0 to stand)
//               bound     0..1 the charge: 0 the walk, 1 a rocking gallop (front pair lands together, hind pair half a cycle later
//                         and lands AHEAD of where the fronts left), sweep 1.5 times as far (1.8 m per cycle), body pitches +-7 deg,
//                         head low (atlas drops 0.10, head 10 deg down)
//               rear      0..1 stands up on the hind legs: the body pitches up 82 deg about the hips, hips rise 0.07; front paws leave
//                         the ground by rear 0.2. 0.5 = the REACH (body 41 deg, palms flat on a surface at y 1.29, z 0.80..0.98: over
//                         a tent); 1 = upright, crown 2.42, ear tips 2.49, both paws HIGH (claw tips 2.73), claws spread
//               pawL/pawR -2..2 (0) shifts that arm along HANG -> REACH -> HIGH (pose index = clamp(2*rear + paw, 0, 2)): at rear 1,
//                         paw -1 = reaching forward at shoulder height, paw -2 = hanging in front of the chest
//               swipe     0..1 ONE stroke of a front paw: 0 and 1 = the paw where it was, 0.25 wound up high and out, 0.5 the strike
//                         (arm straight, 0.26 m across the midline), 0.75 follow-through low. swipeSide +1 the left paw (+x), -1 the
//                         right. Works on all fours (strike at y 0.9, z 1.05) and reared (rear 0.5: y 1.6, z 0.85: a windscreen)
//               climb     0..1 hugs a vertical trunk of radius 0.35 whose AXIS is at x 0, z +0.50 of the prop: the body goes vertical
//                         (86 deg) and moves 0.41 forward, belly 3 cm from the bark, fore palms on the bark at y 2.24, hind soles at
//                         y 0.62..0.86, knees and elbows splayed. Lowest point y 0.44 (the heels)
//               climbStep count of climbing cycles (diagonal pairs reach and pull): move the prop up 0.60 m per cycle; eases in as gait
//               jaw       0..1 the lower jaw drops 42 deg (0.15 m between the front teeth at 1)
//               snarl     0..1 the upper lip curls back off the canines and incisors, the nose bridge wrinkles, the nose lifts
//               ears      -1 pinned flat back .. 0 relaxed .. 1 pricked forward
//               sniff     count of sniffs: a whole number is rest; in between the nose pad lifts and the nostrils flare
//               claws     0..1 toes spread (also driven by rear and swipe: the larger wins)
//               brow, squint, blink, lookX/lookY, headY/headP, breath: as the shared params of props-iceage.js
//               mouth     the returned object has `mouth`: an empty Group in the head frame between the front teeth (see section 9)
// propState has NO default for gait, bound, rear, pawL, pawR, swipe, swipeSide, climb, climbStep, snarl, ears, sniff, claws: seed each
// with a dur-0 `set` at time 0. Everything is solid for the checks (section 12). No glow, no drool, no halo on this prop.
```

SIZE NOTE (for the clip writer, not the builder): real proportions at this size stand 2.42 m to the crown, 2.49 m to the ear tips. The producer wants about 2.6 m: the clip
uses the bear at `scale: 1.05` (crown 2.54, ear tips 2.61, 2.1 m long, 1.13 at the shoulder). All numbers below are at scale 1.

## 2. Body loft, rump to nose (the `NB` table)
Row = `[z, centre y, half width, up, down, n, share of the head's turn]`; back line = y + up, underside = y - down. `n` is the superellipse exponent. Rows 13-18 are the
upper head: their underside is the roof of the mouth (the lower jaw is its own loft).

| # | z | centre y | half w | up | down | n | head share | back / under | what |
|---|---|---|---|---|---|---|---|---|---|
| 1 | -0.96 | 0.80 | 0.10 | 0.10 | 0.12 | 2.2 | 0 | 0.90 / 0.68 | rump end, round |
| 2 | -0.88 | 0.78 | 0.24 | 0.24 | 0.24 | 2.2 | 0 | 1.02 / 0.54 | buttock |
| 3 | -0.74 | 0.76 | 0.32 | 0.33 | 0.30 | 2.3 | 0 | 1.09 / 0.46 | hips |
| 4 | -0.58 | 0.76 | 0.35 | 0.34 | 0.32 | 2.3 | 0 | 1.10 / 0.44 | HIGHEST point of the back |
| 5 | -0.38 | 0.74 | 0.37 | 0.34 | 0.34 | 2.3 | 0 | 1.08 / 0.40 | loin |
| 6 | -0.15 | 0.72 | 0.38 | 0.33 | 0.34 | 2.3 | 0 | 1.05 / 0.38 | mid back dip, widest barrel, deepest belly |
| 7 | 0.08 | 0.72 | 0.37 | 0.34 | 0.34 | 2.3 | 0 | 1.06 / 0.38 | ribcage |
| 8 | 0.28 | 0.74 | 0.36 | 0.34 | 0.34 | 2.3 | 0 | 1.08 / 0.40 | shoulder hump (low, soft) |
| 9 | 0.42 | 0.76 | 0.33 | 0.30 | 0.32 | 2.3 | 0.12 | 1.06 / 0.44 | front of the shoulders, chest |
| 10 | 0.54 | 0.80 | 0.27 | 0.24 | 0.26 | 2.3 | 0.38 | 1.04 / 0.54 | neck (as thick as the head) |
| 11 | 0.64 | 0.84 | 0.23 | 0.21 | 0.22 | 2.4 | 0.70 | 1.05 / 0.62 | nape and throat |
| 12 | 0.72 | 0.86 | 0.21 | 0.18 | 0.20 | 2.5 | 1 | 1.04 / 0.66 | back of the skull, ears stand here |
| 13 | 0.80 | 0.86 | 0.20 | 0.17 | 0.17 | 2.5 | 1 | 1.03 / 0.69 | forehead, cheeks (widest part of the face) |
| 14 | 0.87 | 0.875 | 0.155 | 0.11 | 0.115 | 2.5 | 1 | 0.985 / 0.76 | eye row; the face narrows to the muzzle |
| 15 | 0.93 | 0.86 | 0.10 | 0.085 | 0.09 | 2.4 | 1 | 0.945 / 0.77 | muzzle |
| 16 | 0.98 | 0.843 | 0.09 | 0.068 | 0.068 | 2.4 | 1 | 0.911 / 0.775 | muzzle, canines under here |
| 17 | 1.02 | 0.835 | 0.075 | 0.05 | 0.05 | 2.4 | 1 | 0.885 / 0.785 | nose pad starts |
| 18 | 1.04 | 0.83 | 0.04 | 0.028 | 0.03 | 2.4 | 1 | 0.858 / 0.80 | nose tip |

Check the Roman profile: the top line of rows 13 -> 17 is one straight line (1.03 at z 0.80 to 0.885 at z 1.02, slope -0.66). Do not add a step at the eyes. The muzzle is
0.17 long (z 0.87..1.04) = 47 % of the 0.36 head; it is 0.18..0.20 wide, the cheeks 0.40.

Tail: 3 rows before row 1, a stub that hangs: `[0, 0.74, -1.06]` r 0.02, `[0, 0.79, -1.03]` r 0.035, `[0, 0.82, -0.99]` r 0.05 (w = up = dn = r). No tail param; it does not
move. `makeLoft(bodyRest, { sub: 5, radial: 28 })`. `uOf(i) = i / (NN - 1)`, NN = 21.

## 3. Leg lofts at rest
`LEG` in the sabretooth's shape. Rows are `[half width x, front (+z), back (-z)]`, top to bottom, `ref: [0, 0, 1]`, n 2.6, radial 20.

| | joint (hx, hy, hz) | L1 | L2 | foot centre fz | ankle/wrist height fh | bend |
|---|---|---|---|---|---|---|
| front | shoulder (+-0.21, 0.80, 0.30) | 0.40 | 0.37 | 0.32 | wrist 0.10 above the sole, straight over the foot centre | -1 (elbow back) |
| hind | hip (+-0.20, 0.80, -0.76) | 0.42 | 0.38 | -0.70 | heel 0.09 above the sole, 0.10 BEHIND the foot centre (z -0.80) | +1 (knee forward) |

Rest joint positions (left side; mirror x for the right). Knee and elbow come from `ik2`; these are the values it must give (+-1 cm):

- front: pad (0.21, 0.89, 0.31) -> shoulder (0.21, 0.80, 0.30) -> elbow (0.21, 0.43, 0.15) -> wrist (0.21, 0.10, 0.32) -> palm (0.21, 0.07, 0.385) -> toes (0.21, 0.03,
  0.475). The paw runs from the wrist along the paw direction `p` (planted: p = (0, -0.42, 0.91)): palm = wrist + 0.07 p, toes = wrist + 0.17 p. At rest and in gait the
  whole paw is yawed 12 deg toes-IN. rows: pad [0.12, 0.15, 0.15], shoulder [0.17, 0.21, 0.21], mid [0.16, 0.19, 0.19], elbow [0.125, 0.14, 0.15], mid [0.11, 0.125, 0.125],
  wrist [0.095, 0.11, 0.105], palm [0.10, 0.10, 0.09], toes [0.105, 0.06, 0.05]. Front paw print: 0.21 wide, 0.20 long.
- hind: pad (0.20, 0.89, -0.77) -> hip (0.20, 0.80, -0.76) -> knee (0.20, 0.42, -0.59) -> heel (0.20, 0.09, -0.80) -> instep (0.20, 0.075, -0.72) -> ball (0.20, 0.05,
  -0.63) -> toes (0.20, 0.03, -0.56). The foot lies FLAT: heel, ball and toes all on the ground in stance (sole 0.24 long, 0.19 wide). Yawed 5 deg toes-OUT. rows: pad
  [0.10, 0.13, 0.13], hip [0.17, 0.21, 0.22], mid thigh [0.165, 0.20, 0.20], knee [0.125, 0.15, 0.14], mid shin [0.10, 0.11, 0.11], heel [0.08, 0.085, 0.09], instep [0.085,
  0.07, 0.07], ball [0.095, 0.05, 0.05], toes [0.095, 0.035, 0.03]. If `makeLoft` twists where the spine turns 90 deg at the heel, split the hind leg: loft A pad -> heel
  (ends 0.02 under the heel point), loft B heel -> toes with `ref: [0, 1, 0]` and rows `[half width, top, bottom]` = [0.08, 0.09, 0.09], [0.085, 0.07, 0.075], [0.095, 0.05,
  0.05], [0.095, 0.035, 0.03], overlapping A by 0.03. Same for the front paw if it twists.
- In swing the hind foot pitches toes-down up to 25 deg (heel leaves first, toes last); the front paw folds back 30 deg at the wrist.
- Pads: under each paw a flat dark pad mesh 0.008 thick (pad colour): front one palm pad 0.13 x 0.07 plus five toe pads r 0.016 in an arc; hind one long sole pad 0.17 x
  0.09 plus five toe pads r 0.014. They show in the HIGH pose, the swipe and the climb.
- Claws: FIVE per paw, in an arc at the toe end, x offsets k * 0.036 (front) / k * 0.033 (hind) for k = -2..2, the three middle ones 0.015 further forward. Each is a curved
  tapered tube (`taperTube` through 3 points, bending DOWN 35 deg over its length), root r 0.011 -> tip r 0.002. Visible length front 0.045, hind 0.028. `castShadow =
  false`. `claws` 1 fans the five toes from parallel to +-18 deg (outer), +-9 deg (inner) and lifts the claw tips 10 deg.

## 4. Head parts (all in `headG`, which turns about HP = (0, 0.90, 0.62), rotation order YXZ)
- Lower jaw: its own loft in `jawG`, hinged at J = (0, 0.80, 0.76), `jawG.rotation.x = rad(42) * jaw`. Rows `[z, centre y, half w, up, down]`: [0.76, 0.735, 0.12, 0.04,
  0.05], [0.84, 0.725, 0.105, 0.05, 0.05], [0.92, 0.725, 0.085, 0.05, 0.045], [0.98, 0.73, 0.07, 0.045, 0.04], [1.01, 0.74, 0.04, 0.03, 0.03], n 2.4. Its top (y 0.775) is
  the inside of the mouth.
- Teeth (ivory, hidden behind the lips at jaw 0 and snarl 0): upper canines at (+-0.05, 0.775, 0.985), cones 0.036 long r 0.011, pointing down and 10 deg back; six upper
  incisors in an arc between them at z 0.995..1.005, 0.012 long; lower canines in `jawG` at (+-0.042, 0.775, 0.97), 0.030 long, pointing up, they pass IN FRONT of the upper
  canines; six lower incisors 0.010; cheek teeth = a low bumpy ivory ridge 0.09 long each side, upper and lower, from z 0.84 to 0.93 at x +-0.06. Gums: a dark pink-brown
  strip under them.
- Tongue: a flat pink loft lying in the jaw from z 0.80 to 0.97, 0.09 wide, 0.012 thick, tip rounded; it rides with `jawG`. No lick param.
- Ears: one flat rounded loft each, 0.115 tall, 0.105 wide at mid height, 0.04 thick, round top (never pointed), base at (+-0.15, 1.00, 0.73), leaning out 20 deg and
  forward 10 deg at rest; ear tips at y 1.12. `ears` +1: lean out 8 deg, forward 25 deg. `ears` -1: rotate back 70 deg and in against the skull (lean out 35 deg, flattened
  to 60 % height). brow < 0 adds up to -0.4 of ears.
- Eyes: `realEyes`, R 0.019, centre on the skin at (+-0.09, 0.95, 0.885) sunk 1 cm, facing forward and 30 deg outward, iris #2a1a0e filling 92 % of the visible ball, pupil
  #050403 55 % of the iris, rim #0a0807, sclera #3a2a20 (so no white ever shows), one white catch-light dot r 0.003 up-front, no lashes. Lids = the coat material. Brow = a
  soft fur ridge 0.07 long over each eye; brow -1 drops it 0.012 and tilts the inner end down 20 deg; brow +1 lifts it 0.010. (If `realEyes` takes other units, land the
  eyeballs at these points and check with a head close-up render request to the lead.)
- Nose pad: rows 17-18 are painted nose-pad black; add one wet-look cap mesh (a squashed sphere 0.075 wide, 0.05 tall, 0.03 deep at (0, 0.845, 1.03), roughness 0.25) with
  two comma nostrils painted. `sniff` fraction f: k = sin(pi f)^2; the cap moves up 0.012 k and scales x by 1 + 0.12 k; row 17/18 centre y + 0.006 k; the head nods up 1.5
  deg * k.
- `snarl` s: rows 15, 16, 17 `down` shrink by 0.022 s, 0.036 s, 0.030 s (the lip rises off the teeth, most at the canines); row 15-16 half width + 0.008 s; the jaw rows 3-5
  `up` shrink 0.012 s (lower lip drops); the nose cap + 0.008 s up; three dark wrinkle arcs across the nose bridge at z 0.90, 0.925, 0.95 (thin tubes r 0.004, 0.10 wide,
  colour fur shadow) scale in with s (hidden at 0). A full snarl face = snarl 1, jaw 0.35, brow -1, squint 0.4, ears -1.

## 5. Colours
| part | hex | note |
|---|---|---|
| fur base | #17130f | warm black; never pure #000 |
| fur shadow (belly, inner legs, between locks) | #0c0a08 | |
| fur mid tone | #2a231c | flank strokes, face |
| fur sheen 1 (broad gloss band) | #5b5148 | grey-brown, alpha 0.5 |
| fur sheen 2 (sharp glints) | #8a8074 | alpha 0.35, sparse |
| muzzle | #b07d45 | tan-brown; lighter #c9a068 beside the nose and on the lips' edge; darker #6e4b2a where it meets the black |
| muzzle bridge (top of rows 14-16) | #5a3d24 | the tan is darker along the top of the nose |
| nose pad | #15110f | wet: roughness 0.25 |
| lips, mouth corner | #1c1513 | black lips |
| mouth inside / gums / tongue | #6e2a30 / #7a3d40 / #c9697a | no bright red, nothing wet-red |
| teeth | #efe6cf | canines #d9c79a at the root |
| claws | #3a2f26 root -> #b8a88a tip | dark horn to pale horn, roughness 0.35 (the panels show pale tips; they read on black fur) |
| paw pads | #2a211d | roughness 0.7 |
| eye iris / pupil / rim | #2a1a0e / #050403 / #0a0807 | catch-light #ffffff |
| inner ear | #4a3a2c | dusky brown short fur; ear back and rim = fur base |

Coat material roughness 0.5 (the sabretooth uses 0.85; lower is the "glossy"), legs and ears the same, locks 0.55.

## 6. Fur painting recipe (canvas skins; all positions from `rnd(i)`, each stroke drawn once)
Body canvas 1024 x 512: x = tail (0) -> nose (W) by row (`uOf`), y = H/2 is the spine, y = 0 and y = H are the belly midline (d = |y/H - 0.5| * 2 = distance from the back,
as the sabretooth). Paint in this order:

1. Fill: vertical ramp by d: 0 #17130f, 0.5 #1c1712, 0.8 #120f0c, 1 #0c0a08.
2. Clumps (the layered-shag read at phone size): 520 tapered wedges, each 34-56 px long, 9-14 px wide at the root, pointing with the hair (below), root #0c0a08 alpha 0.55,
   tip #2a231c alpha 0.6. Rows of clumps overlap like roof tiles.
3. Hair strokes: 9000 strokes, 14-26 px long, lineWidth 1.6-2.4, alternating #0c0a08 alpha 0.45 and #2a231c alpha 0.5.
4. Gloss: 2600 strokes of sheen 1 (16-30 px, lineWidth 2) ONLY inside the sheen bands: d 0.00-0.08 (the crest of the rump, back and hump) and d 0.20-0.42 (the upper flank
   and the shoulder mass); inside a band the density follows a bell so the band has soft edges. Then 420 strokes of sheen 2 (10-16 px, lineWidth 1.4) in the middle of the
   same bands. Leave d 0.45-1 with no gloss at all.
5. Stroke direction by area (dx toward the tail is -x on the canvas; "down" = away from the spine row):
   - back, rump (rows 1-5, d < 0.3): straight back, 10 % down. Longest (22-26 px).
   - flanks and belly (rows 3-8, d > 0.3): back and 45 % down; on the belly (d > 0.85) straight down, 26 px, hanging.
   - shoulders and hump (rows 7-9): a whorl line at row 8: in front of it the hair runs down and slightly FORWARD (20 %), behind it down and back. This seam is what reads
     as the heavy shoulder.
   - neck (rows 10-11): back and down 30 %, 18-22 px; on the throat (d > 0.7) long, 26 px, straight back (a ruff).
   - head (rows 12-14): short, 6-10 px, lineWidth 1.2, running back from the nose and fanning out round the eyes; cheeks 12-14 px.
   - muzzle (from x = uOf of row 14.4 to the nose): no black strokes. Fill muzzle colour with a soft uneven edge into the black (the edge runs from the top of row 14.6 down
     and back to the mouth corner at row 13.6), darker bridge along the spine row for the back 60 % of the muzzle, lighter beside the nose; 500 very short strokes (4-6 px)
     #8a5f33 / #c9a068. Rows 17-18: nose-pad black.
   - a black lip line 5 px along both belly edges (y = 0 and H) from row 13.6 to row 17; the strip beyond it toward the edge (the mouth roof, 4.5 % of H each side as the
     sabretooth) mouth-inside colour.
6. Two soft dark ovals where the eyes sit (rows 13.6-14.4, 30 x 22 px, #0c0a08 alpha 0.6): the eyes sit in dark sockets, the tan does not reach them.

Leg canvas 256 x 256 (x down the leg, y round it): fill fur base, 1600 strokes 10-18 px running DOWN the leg (alternating shadow and mid tone), a sheen 1 band 40 px wide
down the outer face (220 strokes), longer strokes (22 px) on the back of the forearm and the back of the thigh, the last 12 % (the paw) darker (#0c0a08 alpha 0.5) with four
toe lines. The inner face has no sheen. Ear canvas 128 x 128: back = fur base with 120 short strokes, inside = inner-ear colour with a darker centre.

Fur locks (the outline must not be a smooth tube): about 90 flat tapered locks (`locksGeo`/`lockMeshes` as the mammoth, bear colours: root fur shadow, tip mid tone, every
fourth tip sheen 1), length 0.05-0.09, lying nearly flat (15-25 deg off the skin), pointing with the hair: back line and hump 14, rump and back of the buttocks 10, belly
line 14, chest and throat 14, flanks 12 (parent: `bodyG`, a group that gets the trunk's rigid transform = pitch about the hips + dip, like rows with head share 0); cheeks
and jaw corners 2 x 7, nape 6, between the ears 4 (parent: `headG`). None on the legs, none on the muzzle. `userData.noOutline = true`.

## 7. How apply() poses it (order matters)
Angles `phi` are in the prop's side (y-z) plane, measured from straight DOWN (0) toward +z (90 = forward, 180 = up), per segment: `dir(phi) = (0, -cos phi, sin phi)`.
`sm(x) = sstep(clamp(x))`.

1. Trunk: `thDeg = -(82 * sm(rear)) * (1 - sm(climb)) - 86 * sm(climb) + 7 * bound * sin(TAU * (gait + 0.15)) * wk` (negative = chest up; `rotX` about PV as the
   sabretooth). PV = (0, 0.80, -0.76) moves to (0, 0.80 + 0.07 sm(rear), -0.76 + 0.06 sm(rear)) for the rear (hips over the feet) and to (0, 0.90, -0.35) at climb 1 (lerp
   by sm(climb), climb wins). `dip` as the sabretooth, from the planted legs only.
2. Head: `hp = headP - K * thDeg` with K = 0.85 (rear: the head stays 12 deg above level at rear 1; give headP +25 to look down at the cast), K lerps to 0.50 by sm(climb)
   (the head looks 43 deg up the trunk). bound: + 10 * bound deg and HP.y - 0.10 * bound. Neck rows turn by their head share (table). If the throat pinches in the rear 1
   side view, change ONLY the shares of rows 9-11.
3. Hind legs: planted by `ik2` (bend +1) to the heel, as the sabretooth's hock, except in the climb (step 6).
4. Front legs: ground solution G (ik2, bend -1, wrist over the foot) and an arm pose A; weight `g = 1 - sm(rear / 0.2)`, also 0 for the swiping arm while swipe is in
   0.05..0.95 and 0 in the climb. Elbow and wrist = mix(A, G, g); the paw direction mixes too. A = pose at index `u = clamp(2 * rear + paw, 0, 2)`, values lerp between the
   three arm poses of section 8; E = S + 0.40 dir(phiH) + x offset ex, W = E + 0.37 dir(phiF) with x at S.x + s * wx, paw direction dir(phiF + wr). S = the rotated shoulder
   joint.
5. Swipe on top (section 8), then `claws = max(ps.claws, 0.9 * sm((u - 1)), swipe bell)`.
6. Climb: all four paws go to trunk targets by a 3D two-bone IK with a pole hint (write `ik3(h, f, L1, L2, pole)`; ik2 is planar), blended in by sm(climb).
7. Breath: rows 6-9 scale `1 + 0.012 * (1 + 2 * breath) * sin(t * 1.9)`. Gait roll: the trunk rolls 2 deg and shifts 0.02 in x toward the planted front foot; row 8 `up` +
   0.015 as each front foot passes mid-stance (the shoulder blade works under the hump).

Gait: `PH` = [walk phase, bound phase]: bl [0, 0.50], fl [0.25, 0], br [0.50, 0.58], fr [0.75, 0.10]. `footPath(f, 0.74 * (1 + 0.5 * bound), 0.62 - 0.17 * bound, 0.10 * (1
+ 0.8 * bound))`. In the bound the hind foot centre shifts +0.15 * bound forward (it lands under the belly).
## 8. Poses as joint angles (degrees)
Arm poses (each front leg; `phiH` upper arm, `phiF` forearm, `wr` paw relative to the forearm, `ex`/`wx` sideways offset of the elbow / wrist from the shoulder's x, +
outward, in metres):

| pose | phiH | phiF | wr | ex | wx | what it looks like |
|---|---|---|---|---|---|---|
| standing on the ground (from ik2, for reference) | -22 | 27 | +38 | 0 | 0 | column leg, elbow back, palm flat |
| HANG (u 0, only seen when reared) | 15 | 55 | -25 | 0.06 | -0.02 | forearms in front of the chest, paws limp |
| REACH (u 1) | 69 | 84 | 0 | 0.08 | 0.06 | arms forward and a little down, palms down |
| HIGH (u 2) | 132 | 170 | -25 | 0.16 | 0.26 | arms up and out, palms forward, claws hooked forward and spread |

Check values at scale 1: rear 0.5 (trunk 41 deg): shoulder (0.21, 1.53, 0.07), wrist (0.27, 1.35, 0.81), palm underside y 1.29. Rear 1 (trunk 82 deg): shoulder (0.21, 1.92,
-0.55), atlas (0, 2.25, -0.61), crown y 2.42, ear tips y 2.49, HIGH wrist (0.47, 2.55, -0.19), toe end y 2.69, claw tips y 2.73. Hind legs at rear 1: hip (0.20, 0.87,
-0.70), knee flexed 21 deg (nearly straight), heel planted, feet yawed 15 deg toes-out. Belly faces +z.

Swipe (the arm on `swipeSide`; the pose lerps base -> A -> B -> C -> base with smooth steps between keys; "base" = whatever section 7 step 4 gives):

| swipe | phiH | phiF | wr | ex | wx | what |
|---|---|---|---|---|---|---|
| 0.25 A wind-up | 120 | 175 | -30 | 0.22 | 0.34 | paw cocked up beside the head, claws spread |
| 0.50 B strike | 80 | 95 | -15 | 0.02 | -0.26 | arm almost straight, paw across the midline, palm leading |
| 0.75 C follow-through | 35 | 60 | +10 | -0.02 | -0.34 | paw low on the far side |

With it: the trunk rolls 5 deg toward the planted side, shifts 0.04 in x that way, and the head turns 8 deg toward the strike at B. The other front leg stays as it was.
Claws spread = sin(pi * swipe) (peak at B).

Bound (gallop) check values, produced by footPath + ik2, not hand-keyed (bound 1, mid-cycle):

| phase | trunk | front phiH / phiF | hind thigh phi / knee flex | head |
|---|---|---|---|---|
| reach (fronts about to land) | 7 deg chest down | +30 / +45 (stretched forward) | -35 / 40 (trailing back, feet up 0.18) | 10 deg down, atlas -0.10 |
| gather (hinds landing) | 7 deg chest up | -40 / -5 (swept back, off the ground) | +50 / 95 (feet ahead under the belly) | same |

Climb (climb 1; trunk axis at x 0, z 0.50, radius 0.35, vertical; `n(a) = (sin a, 0, -cos a)` is the bark's outward normal at angle a round the trunk from the side nearest
the bear, mirrored for the right):

| limb | joint | paw target | pole (knee/elbow points) | angles it gives |
|---|---|---|---|---|
| fore | shoulder (+-0.21, 1.96, -0.28) | wrist (+-0.36, 2.17, 0.29) = bark at a 60 deg + 0.07 n; palm on the bark at y 2.24, toes up, claws in at y 2.34 | out and down (s, -0.6, -0.3) | upper arm 55 deg out from the body, elbow flexed 70, wrist bent back 40 |
| hind | hip (+-0.20, 0.90, -0.35) | heel (+-0.31, 0.62, 0.24) = bark at a 50 deg + 0.05 n; sole flat on the bark, toes UP at y 0.86 | out and up (s, 0.3, 0.2) | thigh 60 deg out, 50 forward; knee flexed 85; ankle 95 |

Body: trunk pitch 86 deg, belly at z 0.11 (3 cm off the bark at z 0.15), rump y 0.70, atlas (0, 2.28, -0.36), head 43 deg up, nose about y 2.55. climbStep fraction f: pairs
(fl + br) phase 0, (fr + bl) phase 0.5; a limb is on the bark for 60 % of the cycle and slides DOWN 0.36 m relative to the body (from +0.18 to -0.18 about its target), then
lifts 0.06 off the bark along n and reaches up; the hips swing 0.03 in x toward the holding hind paw and the trunk yaws 4 deg. The clip raises the prop 0.60 m per cycle.

How to get to the trunk (clip writer): on all fours the nose is at z +1.04, so stop with the origin 1.45 m short of the trunk axis, tween rear 0 -> 1 while the prop moves
0.95 m forward (gait + 1.5 for the shuffle), then climb 0 -> 1, then climbStep with y.
## 9. Mouth hold (the returned `mouth`)
An empty `THREE.Group` named `mouthHold`, child of `headG`, at rest coordinates (0, 0.755, 0.99) (pass through `rel()`), no rotation: +z out of the mouth along the muzzle,
+x the bear's left, +y up into the upper teeth. It is the point just under the tips of the upper incisors, on the midline; it turns with the head, NOT with the lower jaw. A
held thing hangs from / sits against this point and the lower teeth close on it from below: the gap at the front teeth is `0.15 * jaw` m, so set `jaw = thickness / 0.15`
(sleeping bag cloth, 3 cm bunched: jaw 0.2; a pot rim or wall: jaw 0.15; a 0.15 m pot body: jaw 1 and it is wedged, panel 11). Return `{ grip: 0, mouth, apply }`. World
position at rest, scale 1: (0, 0.755, 0.99).
## 10. REAL TELLS (all must be visible in a side view and a three-quarter view at phone size)
1. The rump is as high as or higher than the shoulder; the back line dips between them. No grizzly hump.
2. One straight line from forehead to nose tip; a long tan muzzle that is narrower than the skull, set against a black face.
3. Tall, round, wide-set ears, big for the head (0.115 on a 0.36 head).
4. Small close-set dark eyes in dark sockets (r 0.019; the eye is 5 % of the head's length), one catch-light.
5. Plantigrade hind feet: the whole sole and the heel on the ground, a long foot; the knee is high and forward, hidden in the flank fur.
6. Front paws turned in (pigeon-toed), wrists low, the legs thick columns as wide at the wrist as a potato's arm.
7. Five claws on every paw, curved, visibly longer in front.
8. Glossy black coat: a soft grey-brown sheen band along the back and upper flank, deep black below; a shaggy broken outline.
9. A massive neck as wide as the head, the head carried low, level with or under the back.
10. A stub tail almost lost in the rump fur.
11. Black lips and nose, a wet nose pad; when it snarls the lip lifts off four big ivory canines.
12. Size: on all fours its back is at the top of the biggest potato's head; reared it is twice as tall.
## 11. NEVER
- Never spheres or ellipsoids stuck together; never a separate ball head, ball snout or ball ears; the skin is one loft.
- Never big, round, white or glossy toy eyes; no eyebrows as shapes, no eyelashes, no visible sclera, no smile.
- Never a dished face, a shoulder hump higher than the rump, a long tail, pointed ears, a lion's or dog's stance (no raised heels).
- Never brown or grey overall; never flat untextured black (it must not read as a silhouette hole at night).
- Never blood, wounds, torn flesh, red-stained teeth or claws, bright red mouth; no drool strands.
- Never claws as hints only: they are modelled, five per paw.
- Never a random number or the clock; every part is a pure function of the params and the clip time `t`.
## 12. Solid vs see-through (for the checks)
- Solid: the body loft, four leg lofts (and the split foot lofts if used), lower jaw, ears, nose cap, teeth, tongue, pads, claws, eyes, snarl wrinkles, fur locks. Fur locks
  and claws add at most 0.09 m outside the skin; contact distances are measured to the skin.
- See-through: nothing. `mouthHold` is an empty group (no mesh). No halo, no drool, no steam.
- Contact surfaces the clip may rely on: palm pads (front), sole pads (hind), the front teeth at `mouthHold`, the belly in the climb.
## 13. Hand back
Stills at scale 1: side and three-quarter at rest; rear 0.5; rear 1; rear 1 with pawL -1, jaw 1, snarl 1; swipe 0.25 / 0.5 / 0.75 on all fours; bound 1 at gait 0 and 0.5;
climb 1 with a 0.35 m test cylinder at z 0.50; a head close-up at snarl 1, jaw 0.35. Any number here that cannot be met is reported, not changed.
