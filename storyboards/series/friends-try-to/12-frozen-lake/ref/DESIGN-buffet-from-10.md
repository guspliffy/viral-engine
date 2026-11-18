# DESIGN: the buffet in Chip's hoodie (friends try to 10, take the lift)

Design only, for the builder of the new file `engine/page/props-buffet.js` (exports `BUFFET_KINDS`, `BUFFET_GRIPS`, a `BUFFET` size table; the director adds the registry
line). New kinds: croissant, sausage, pancakestack, melon, breadroll, banana, juicejug, waffle, muffin, buffetheap, hoodiestuff. Conventions as props-roast.js and
props-cinema.js: `P.spec`, `P.whole`, return `{ grip, apply(ps) }`; metres, y up, front +z; all variety hashed from `spec.seed` or an index (no Math.random, no clock).
No lettering. **No potato food, and nothing that could be taken for one**: no round tan lump (cast skin is #e2a95c). The melon and the roll are designed round this.

## 1. Look (every kind)
- Toon look with the standard ink outline. Marks smaller than 0.008 m (seeds, sugar, glints, freckles) get `noOutline`, or they turn into black dots.
- 3-4 flat colours per item, one clearly lighter (top), one darker (grooves). Roughness 0.6-0.8 baked goods, 0.2-0.35 syrup, glaze, fruit skin.
- Hand-drawn marks: each stroke drawn once at a hashed place, length and width, never tiled, never in a rhythm; flat capsules lying on the surface or canvas strokes.
- Origin: bottom centre in the resting pose, long axis along x, unless said. The physics body is the hull of the meshes (the default).
- "Body" below = what the director sets in the prop's `body`: food must not bounce like rubber (the engine default 0.3 is too much).

## 2. Loose items (each its own kind, one rigid body)
- **croissant** 0.17 x 0.058 high x 0.085 deep. Seven fat segments on an arc (radius 0.062, sweep 160 deg, horns toward +z), radii horn to horn 0.013, 0.021, 0.027, 0.030,
  0.027, 0.021, 0.013; each a sphere squashed 0.8 in y, 1.25 across the arc, overlapping 35 % (the steps are the rolled layers). Segments alternate #e2a03a / #d68d2c; a
  groove #9c5a1e in each of the 6 joints (0.003 thick); a glaze stripe #ffe2a0 on the 3 middle ridges; 2-3 flake strokes #b9742a per segment. Body: bounce 0.08.
- **sausage** 0.115 long, r 0.017, a tube on a shallow arc (sag 0.007), round ends each with a pinched knot (sphere r 0.006, #8f4322). Skin #b5562c, roughness 0.35; three
  grill bands #5a2713, 0.005 wide, tilted 25 deg, gaps 0.021 and 0.03, different lengths; one highlight stroke #f0b58c (0.05 x 0.004) on top.
  `BUFFET_GRIPS.sausage.end = [-0.0575, 0.017, 0]` (the end that stays up the sleeve). Body: bounce 0.1 (it rolls).
- **pancakestack** r 0.08, 0.082 high. Four pancakes, radii bottom to top 0.078, 0.074, 0.080, 0.072, each 0.015 thick with a fully round edge, shifted (0, 0),
  (0.007, -0.004), (-0.006, 0.005), (0.004, 0.006), tilted up to 3 deg. Sides #f4d99a, faces #cc8736 with a paler 0.008 rim ring #eebd6c; 6 uneven darker blotches #b3702a
  on the top face. Butter: a rounded box 0.034 x 0.013 x 0.034, #fff2a6 (pale, not hoodie yellow), turned 24 deg, 0.01 off centre, on a melt puddle (disc r 0.027,
  #ffe98a). Syrup #9a4a14, roughness 0.18: a pool with 6 uneven lobes (radius 0.045-0.066), four drips over the edge at 15, 100, 190, 300 deg (0 = front), 0.012 wide,
  0.022 / 0.05 / 0.03 / 0.055 long, each ending in a drop r 0.009; one glint #fff6e0 (0.02 x 0.004). Body: bounce 0.05, friction 0.9 (lands flat and stays).
- **melon** a honeydew, the biggest thing: r 0.10, scale (1.06, 0.96, 1) so its roll wobbles. Skin #bfd96b with one big paler cheek #dcec9a (where it lay); nine hand-drawn
  lines stem to tip #9dbb4e, wavering, 0.003-0.007 wide, three of them broken; 14 freckles. Stem end: a tan scar disc r 0.014 #a89250 and a stub (r 0.006, 0.012 high,
  #6f6030); one soft glint #f3fbd0 (0.03 x 0.015). Origin: its CENTRE (like `apple`). Body: bounce 0.12, friction 0.7: one heavy thud, then a slow roll.
- **breadroll** a poppy-seed split roll, 0.095 x 0.055 high x 0.075: an ellipsoid cut flat at 25 % of its height. Crust #c8842f; a split along the top 0.07 long, 0.012
  wide showing crumb #f6e6bd, a darker lip #9a5a1c each side; a floury ring #e9cf9a round the bottom 0.012; 22 poppy seeds #2a1c14 (flat, r 0.004) over the top two
  thirds, denser near the split. Split and seeds are what stop it reading as a potato. Body: bounce 0.1.
- **banana** 0.19 along an arc (radius 0.13, sweep 84 deg), lying on its side, belly toward +z; radius 0.010 at the stem, 0.019 from 30 to 75 %, 0.011 at the tip; five
  soft ridges. Skin #f6dd52 (lighter and greener than the hoodie), the last 0.03 at the stem #a8c24a, a 0.02 stem stub #6e5a2c, a dark tip cap #3f2e1c r 0.008; two
  ridge lines #b48a2e, five freckles #8a6424 (0.004-0.009). spec.n 1 (default) to 3: a hand of bananas fanned 16 deg apart on one stem block. Body: bounce 0.08.
- **juicejug** a small lidded glass carafe, 0.165 high. Glass as `waterglass` (props-bistro.js): lathe (r, y) (0.036, 0) (0.045, 0.035) (0.045, 0.10) (0.031, 0.13)
  (0.031, 0.142) (0.035, 0.15), wall 0.003. Juice: opaque, 0.004 inside the glass, #ff9a1c, filled to y 0.128 (into the neck, so it looks right lying on its side: no
  liquid moves), a foam ring #ffc45a 0.006 high on top, six pulp flecks #ffb648, a hand-drawn waterline #e07c10. Lid: a steel cap r 0.036, y 0.15-0.164, #c5c9cc,
  metalness 0.5, with a knob r 0.01. Handle on +x: a glass C (torus R 0.033, tube 0.0065, 190 deg) from y 0.045 to 0.112. One long curved white glint (0.07 x 0.006) and
  a short one (0.015) at azimuth -40 deg. Body: density 500, bounce 0.05, friction 0.8: it lands, tips over, rocks, lies still. It never breaks and never opens.
- **waffle** a Belgian square 0.115 x 0.024 x 0.115, corners rounded 0.014. A slab 0.008 thick #c98a30 (the pocket floors); on both faces a rim 0.009 wide and three bars
  each way (0.007 wide, 0.008 high) making 4 x 4 pockets, #e6ab45; outer edge #b06c1f; icing sugar: 26 dots #fffaf0 (r 0.003-0.006) over one corner. Body: box, bounce 0.08.
- **muffin** blueberry, 0.086 across, 0.08 high. Paper case: lathe r 0.027 at the foot to 0.037 at y 0.042, 16 flutes (+-0.002), #f7f2e4, every pleat line drawn by hand
  #c9bda2 at uneven lengths. Top: a dome r 0.043 squashed 0.8, from y 0.036 to 0.08, overhanging the case 0.006, #c6853c, one paler cracked patch #ecc481 (0.03 across),
  six blueberries #3d3a7a half sunk (r 0.009), two with a stain ring #6a4a8c. Body: bounce 0.08.
- **Reused as they are** (props3d.js): `apple` (its red is the accent the browns need), `egg` (never tween `crack`), `plate` at scale 0.6 (a side plate, r 0.10: at full
  size it beats the melon). `cake`: leave out (candles read "birthday", and at r 0.16 it competes with the melon).
- **Suggested spill, small to big** (19 bodies): sausage 3, croissant 3, breadroll 2, waffle 2, muffin, banana, apple 2, egg, pancakestack, juicejug, plate, melon last.

## 3. buffetheap (one prop, origin: floor centre)
- spec.r 0.45, spec.h 0.45, spec.seed 7, spec.melon false. Param `fill` 0..1 (reads spec.fill until tweened: seed it with a dur-0 set). Optional `jolt` 0..1: every item
  hops up to 0.02 x (its height / h) and back, once, when the melon lands on the heap.
- Shape at fill 1, not a cone: the peak 0.06 off centre toward -x; a lower shoulder (0.30 high) at x +0.18, z -0.05; a long toe toward +z (radius 0.45 there), 0.40 at
  the sides, 0.32 at the back. Height profile h x (1 - rho^1.7), rho = distance from the centre / the radius in that direction.
- Core, so no gap looks hollow: a lumpy dome 20 % inside that shape, #8c5a26, painted with 10 overlapping darker bread ovals (#7a4c1f, #a06a2c), `noHatch`. It is the
  heap's only solid mesh (the melon lands on it). No core patch wider than 0.05 m may show from the front or 3/4.
- 52 items at fill 1, the loose kinds' own builders: croissant 9, breadroll 8, sausage 7, waffle 5, muffin 5, apple 5, banana 4 (one with n 3), pancakestack 3, egg 3,
  juicejug 2, plate 1. Apple, egg and plate are redrawn here to match props3d.js (apple r 0.07 #e2322b, stem, leaf; egg r 0.05 x 1.3 high #f6ead6; plate r 0.10, china
  #f7f5ef, blue rim #3d8fb0). No melon (spec.melon true puts one on the peak): the film has ONE melon, the loose one.
- Three bands. Foot (y 0-0.08, rho 0.6-1): lying flat; sausages and apples furthest out; four strays 0.05-0.12 beyond the toe on the +z side; both jugs lie on their
  sides here, one front-left with its lid toward the camera, never upright. Slope (y 0.08-0.30): tilted 20-55 deg down the slope, each overlapping the one below by
  30-40 %. Crown (y 0.30-0.45): seven items, among them one pancakestack tilted 25 deg toward +z so the syrup face reads, one apple, and the plate leaning 50 deg on
  the back shoulder so its blue rim draws one clean arc behind the top.
- Next to every brown bake sits one non-brown thing (red apple, white egg / paper / plate, orange juice, yellow banana); at least two apples on the +z side. No item
  touches more than two of its own kind. Every item is sunk 10-25 % into the core or its neighbour: none floats.
- `fill`: the mound grows as a real pour does. Its outline scales by s = fill^0.5 (radius and height), the core with it; each item keeps its home (direction and rho) on
  the mound and its own full size, so items ride outward and up as it grows. Item i (hashed order, not sorted by height) arrives in the fill window [0.9 i / N,
  0.9 i / N + 0.1]: it falls from 0.14 above the surface (accelerating), unwinding 70 deg of tumble, lands at 75 % of its window, one 0.012 hop, rest; hidden before
  its window. So 5 or 6 items are in the air while fill moves ("still landing"): hold `fill` only at 0 or 1, a held middle value freezes them in the air. Core hidden below 0.08.

## 4. hoodiestuff (worn, never solid)
- Worn as `satchel` (props-score-small.js): spec.wear "chip", x y z 0, built in his body frame. Origin: his feet. Body: an ellipsoid, centre y 0.405, half sizes 0.285
  (x), 0.265 (y), 0.26 (z), taper 0.02; spec.fit overrides. Azimuth 0 = front +z, + toward +x; elevation from the equator, degrees. Param `fill` 0..1 (spec.fill, default 1).
- His hoodie (costumes-everyday.js `CHIP_HOODIE`, `hoodie()`): cloth 0.024-0.04 off the skin; V neck at the front at elevation -16 (y 0.33); drawstrings end at -29,
  0.05 off the skin; the pouch pocket's top stitch at -42 (y 0.228), azimuth +-30; hem band at -64 (y 0.167).
- A lumpy patch of the same cloth over his belly: azimuth -105..+105, elevation -22..-72 (it tucks under the hem band), grid about 120 x 48. Point = skin + normal x
  base + forward x extra; forward = the level direction at that azimuth tipped 10 deg down (lumps push OUT: low on a ball the normal points at the floor).
  - base: 0.015 on the patch border (under the hoodie, so no edge ever shows), 0.03 + 0.016 x min(1, 5 fill) inside, blended over the outer 10 deg.
  - extra = ramp x (swell + the smooth maximum of the lumps, never their sum); ramp 0 on the border, 1 from 10 deg inside. swell = 0.11 x fill x F x E: F 1 at azimuth
    0, 0.75 at +-45, 0.3 at +-80, 0 at +-105; E 1 at elevation -45, 0 at -22 and -72.
  - Limits: nothing above y 0.325 (his mouth stays clear); under 0.045 off the skin where the drawstrings lie (azimuth within 12, elevation above -30), so they stay on
    top; at most 0.235 off the skin anywhere. Hidden below fill 0.02.
- Lumps at fill 1 (the last column is the fill range over which the lump flattens: the matching loose item drops then):

  | lump | az | el | footprint | extra height | shape | flattens over fill |
  |---|---|---|---|---|---|---|
  | melon | -22 | -40 | r 0.095 | 0.075 | a sphere cap | slides down to el -60 over 0.35 -> 0.12, gone 0.12 -> 0.03: LAST |
  | jug corner | +34 | -38 | r 0.05 | 0.045 | a blunt square corner, turned 20 deg | 0.55 -> 0.40 |
  | waffle edge | +14 | -36 | 0.09 long, 0.024 wide, tilted 30 deg | 0.022 | a straight ridge, sharp ends | 0.80 -> 0.65 |
  | banana | +5 to +55 | -56 | 0.16 long, 0.04 wide, bowed 0.02 | 0.028 | a curved ridge | 0.70 -> 0.55 |
  | roll | -55 | -44 | r 0.04 | 0.032 | a dome | 0.90 -> 0.80 |
  | roll | +58 | -50 | r 0.035 | 0.028 | a dome | 0.98 -> 0.88: first |

- Cloth: hoodie yellow #ffcf2e (`costume.hoodie`), `clothMat`, the hoodie's own pale fleece recipe (`fleeceTexture` in costumes-everyday.js: light base, short flecks
  7-20 px running down the cloth, a third of them pencil-dark) with its own seed 57.3 and about 70 flecks on 512 x 256, so no mark repeats the hoodie's. That function
  is private to its file: the director says whether it is exported or redrawn here. Faces that look down (the underside of each lump) are painted 14 % darker.
- What makes it read from the front: (a) the pocket stitch redrawn on the patch, a line 0.0028 thick in the real stitch's colour (about #cea723), azimuth -30..+30 at
  elevation -42, riding 0.004 above the patch so it BENDS over the melon and the waffle edge; (b) under each lump a crescent in the hoodie's fold ink (`inkMesh`), 0.006
  wide, pointed ends, on 140 deg of its lower rim; (c) three pull lines, 0.05-0.08 long, from the melon's rim toward jug corner, hem and pocket end. Marks thin out with their lump.
- Croissant tip: the croissant's last two segments (r 0.021, 0.013), tip #b86a24, at azimuth +40 under the hem, pointing down and 30 deg out, 0.04 showing below the hem
  line. Shown while fill > 0.9; slides down 0.03 and is gone by 0.82 (the first loose croissant drops from there).

## 5. Sound and staging
- Sound: recorded foley only: a run of dull soft thuds at uneven gaps that thickens (library `kenney/impact/impactSoft_medium_*`), one deep thud for the melon
  (`impactSoft_heavy_*`), one plate clatter with its ring-down (`impactPlate_heavy_*`), one glass knock on stone for the jug (`impactGlass_light_*`), one wet soft splat
  for the pancakes (no recorded splat is in assets/sfx). The producer judges all of it by ear.
- Faces: food leaves at the hem (y 0.12-0.16, under the patch's overhang, which hides each item's first frame) and Chip's face starts at y 0.33, so knock nothing upward
  (v.y at most 0.5 m/s; 0.6-1.4 m/s forward or sideways); the heap stands beside him, never between his face and the lens: its centre 0.7 m from his and 0.2 m further
  from the camera (its edge clears his foot by 0.1); camera at 0.6 m or higher; the melon comes to rest 0.35 m or more from his x.
- Hint: the sausage shows 0.06 past the cuff and needs a shot from 2 m or closer; the lumpy hoodie's first clear view is 30-50 deg off his front (his belly front goes
  from 0.23 to 0.36 in front of his centre, 0.43 at the melon, past his widest point at 0.29). While fill > 0.3 his hands rest on his belly; the spill starts when he lifts them.

## 6. Stills the builder shows, open questions, risks
- Stills on the lift's stone floor (#cfc6b8), camera 4 m, each also as a 270 x 480 phone crop: every loose kind from 4 sides; the heap at fill 0.15, 0.4, 0.7, 1; Chip with
  hoodiestuff at fill 1, 0.6, 0.3, 0 (front, 3/4, side). Pass: every item can be named in the crop; roll and melon never read as a potato; no patch edge at any fill.
- Open, my default: (1) honeydew green, not cantaloupe (a tan netted ball beside the cast reads as a potato); (2) no recorded splat: `impactSoft_heavy` until one is supplied.
- Risks: the bake reads the heap's solid core once: until the heap is at fill 1 aim loose items outside its 0.45 radius, only the melon lands on it. The patch rides
  Chip's body but does not squash with it: keep his squash under 5 % while fill > 0, or the border (0.015) can show. Items come to rest at z 1.0 or less, clear of the
  door line (set z 1.25). 52 heap items + 19 bodies: check the draft render time before the layout round.
