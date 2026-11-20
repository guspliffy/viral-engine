# Egypt myth 01 "Your heart vs. one feather": DESIGN of the new looks (20 Nov 2026)

Target: STORY.md v1 + Jonny's sheets (heart-opening-1 panels 01-04 = 0.0-1.2 s, replacing sheet-1 panel 01; heart-sheet-1
panels 01-12; heart-sheet-2 panels 13-24). Tall 1080x1920. Builders build exactly these numbers, ONE file per look, each
with a usage header and a `<NAME>_STATE` export as in props-zfight.js. Where the sheets disagree: section 13.

Jonny, 20 Nov 15:46: "for this series the scenery and other characters need some real love to the detail and beauty in
their looks." DETAIL AND BEAUTY ARE THE PRIORITY. Every count, hex and size below is part of the look: nothing is
simplified, merged or left for later. Section 12 has the count checks and where the builder time goes.

Rules for all:
- Metres, x right, y up, z toward the default camera; a prop faces +z at rot 0. 1 Spud = 1.02 m standing (body 0.88 +
  legs 0.14), Chip 0.67. Params are 0..1 unless said, default in brackets, seeded with a dur-0 set before any tween.
- A pure function of spec, state and t; every mark drawn once from its index and spec.seed (no tiling, no random, no
  clock). Hand-drawn Ghibli look, ink on hard edges. Glows, flames, rays, breath, dust: steam, noOutline, no shadow.
- PICTURES ONLY: no glyph rows or columns, no cartouches, no plaques, no letters or digits anywhere in any look.
- Never realistic gore (section H): the only red liquid is JUICE; scars are pale, never red; no wounds, no tissue.
- GOLD LEAF, wherever GOLD is named: never a flat yellow. One long light band #fff0b8 on every round part, shade in
  every recess. Leaf seams every 0.085 m at 6 % contrast on flat faces wider than 0.3 m, each wobbled. WEAR on 8 % of
  the area: rubbed through to bronze #6b4612 on edges and where hands or feet go (named per piece); red bole #8a4a2a
  shows in 1 rubbed spot of 4.
- LINEN: fine pleat lines 4 mm wide at 0.012 pitch, each drawn once and wobbled; folds #cfc7b4, the 3 deepest of a
  garment #a89f8c; a rolled edge 0.02 on every hem.
- WALL PAINT: flat colours inside a dark line #2a1c14 of 2-3 cm; 12 % flaked to plaster in patches of 0.05-0.4 m
  (about 1 per m2, more in the lowest 0.4 m of a register); 9 hairline cracks per 10 m of wall; LAPIS 15 % paler on
  faces turned to a torch; soot 1.5 m above each flame.

| Shared palette | Base | Shade | Light |
|---|---|---|---|
| GOLD | #e2b04a | #9a6a1e (deep #6b4612) | #fff0b8 |
| LAPIS / TURQUOISE | #2b4fa2 / #3fa39a | #1c3470 / #2a7069 | #5f86d6 / #7fd0c4 |
| LINEN | #f3eee2 | #cfc7b4 (deep #a89f8c) | #ffffff |
| FLOOR STONE | #1c1b22 | #0f0e13 | #3a3846 |
| PLASTER / OCHRE RED (walls only) | #d2ad6e / #b4472e | #8a6a3c / #7a2e1e | #ecd09a |
| NIGHT BLUE / star | #16224a | #0e1630 | #e9c85a |
| JUICE (tomato, leaning orange) | #f0502a | #c9341a (never darker) | #ff9a6b, gloss #fff3e6 |

| # | Look | Kind / costume | Builder file |
|---|---|---|---|
| A | Hall (set, doors, field, stools, far row) | `hearthall` | `engine/page/props-heart-hall.js` |
| B | Scale + feather | `heartscale` | `engine/page/props-heart-scale.js` |
| C | Monster | `heartmonster` | `engine/page/props-heart-monster.js` |
| D | Heart + beetle charm | `heartface`, `heartscarab` | `engine/page/props-heart-heart.js` |
| E | Jackal judge | costume `jackal` on `characters/egypt-myth/jackal.json` | `engine/page/costumes-jackal.js` |
| F | The 42 judges | costume `assessor` on `characters/egypt-myth/assessor-{a,b,c}.json` | `engine/page/costumes-assessor.js` |
| G | Soul + ash pile | `heartsoul` | `engine/page/props-heart-soul.js` |
| H | Juice | `heartjuice` (+ marks on `characters/egypt-myth/chip-juice.json`) | `engine/page/props-heart-juice.js` |
| I | Museum case | `heartcase` | `engine/page/props-heart-case.js` |

## A. HALL (kind `hearthall`; every panel but 22)

Origin: the floor under the scale's pillar. Long axis z: the door wall is BEHIND the scale (-z), the hall runs toward +z
into the dark (the way the souls come in). A camera looking -z has the judges on its left; looking +z (panel 07) the row
recedes on its right. Single-sided walls (a camera may stand outside). Only the floor takes shadows.

| Thing | Where (x, z) | Size |
|---|---|---|
| Nave floor, y 0 | x -8..+8, z -9..+46 | 16 x 55 m; ceiling y 10.6 |
| Door wall / side walls | z -9 / x -8 and +8 | 10.6 high |
| Doors | opening x -2.2..+2.2 at z -9, y 0..6.4 | 2 leaves 2.2 x 6.4 x 0.18, hinges at x -2.2 and +2.2 |
| Columns, 2 rows of 12 | x -6.4 and +6.4, z -6.75 + 4.5 k (k 0..11) | 9.8 to the abacus top |
| Architraves | on both column rows, along z | 1.0 wide, y 9.8..10.6 |
| Torches, 2 rows of 11 | x -6.0 and +6.0, z -4.5 + 4.5 k (k 0..10) | stand 1.75, between the columns |
| Scale braziers, 2 | (-2.2, -3.4), (+2.2, -3.4) | low bowl on a tripod, rim y 1.2 (backlight on scale and mane) |
| Door braziers, 2 | (-3.2, -8.2), (+3.2, -8.2) | rim y 2.4 |
| SCALE (B) | (0, 0), beam along x | heart pan x -1.50, feather pan x +1.50 (level) |
| Jackal mark | (+0.70, -0.25), facing +z | right hand on the pillar at y 0.95; clear of the 0.42 base |
| Monster CHOMP mark | (-2.85, -0.98), rot 60 (from +z toward +x) | her mouth lands in the low heart pan (-1.16, 0) |
| Monster marks M1, SIT | (-3.37, -1.28), (-3.89, -1.58), rot 60 | one and two gait cycles (0.60) behind CHOMP; from M1 an open jaw clears the rim by 0.24 |
| Opening marks (suggested) | soul (-0.55, +0.85); Chip (-1.90, +1.30); Spud (-1.25, +1.50) | the ash pile stays at the soul's mark |
| Judges' stools 1..42 | x -5.2, z +2.0 + 0.95 (i - 1), to +40.95, facing +x | pitch 0.95 |
| Chip's answer line | x -4.1, z +2.0..+6.75 | 1.1 m in front of judges 1-6 |
| Queue of souls | x -1.4, z +4.5 + 1.0 k (k 0..7), facing -z | 8 copies of G; then dark |
| Queue rope (reused `exhibitrope`) | posts (-2.4, +3.6) and (-0.4, +3.6) | brass posts, red rope |

**Columns** (papyrus bundle, carved and painted; 24, lit #d9b877, shade #8a6a3c, far #4a3a26):

| Part | y | Carving and paint |
|---|---|---|
| Base disc | 0..0.25 | 1.5 across, a rounded edge; 6 chips of 3-10 cm showing pale stone #e9d9b0 |
| Sheath | 0.25..1.4 | the bulge, 1.15 across at y 0.9: 8 pointed sheath leaves 1.15 tall carved 2 cm deep, green #5a8a4a edged GOLD on PLASTER |
| Shaft | 1.4..7.7 | 8 lobed stems, each with one sharp arris (papyrus stems are three-sided), tapering to 0.95 across |
| Rings | 1.5..2.1 | 3 painted rings 0.2 each: LAPIS, TURQUOISE, OCHRE RED, thin GOLD lines between |
| Picture band | 2.2..4.2 | two potato figures facing each other over a lotus stand; 12 different pairs (one per column pair); paint rubbed pale at y 0.8-1.2 on the nave side |
| Neck bands | 7.7..8.2 | 5 GOLD bands 0.06 high, 0.05 apart; 8 small stem ends hanging 0.25 under them between the lobes |
| Capital | 8.2..9.5 | an open papyrus bell, 0.95 across at the neck, 1.9 at the lip: 8 sepals 0.45 tall (green, GOLD edge) at the foot; above them 24 thin umbel stems fanning up, with 8 lotus buds 0.30 tall (LAPIS tips) between them; a lip band 0.12 with 32 petal tongues, LAPIS and TURQUOISE alternating; GOLD edge 0.03. Carved 2 cm deep, a shade line under every stem |
| Abacus | 9.5..9.8 | 1.0 square, a painted wing band |

**Side walls** (x -8 and +8; fully painted along all 55 m, lit by the baked falloff below):

| Band | y | What | Count per wall |
|---|---|---|---|
| Dado | 0..1.1 | #2a2428 stone, a GOLD line at 1.1; lotus-and-bud pairs in gold line, 0.6 tall, 1.0 pitch | 55 pairs |
| Borders | 1.1, 3.0, 5.0, 7.0 (each 0.1-0.2 high) | block border: rectangles 0.12 x 0.08, LAPIS, plaster, TURQUOISE, plaster, OCHRE RED, plaster, between two dark lines | 4 |
| Register 1 | 1.2..3.0 | the PROCESSION toward the doors: potato figures 1.5 m in profile every 1.4 m on a ground line. 8 types by index: a lotus bunch, a tall jar on the shoulder, a bread tray, a duck held by the wings, a fan, a calf on a lead, a basket on the head, a harp. Kilt length, collar colour and arm angle (10 degrees) hashed; a small plant or jar between every 2 | 39 figures |
| Register 2 | 3.2..5.0 | SCENES 4.2 m wide in this order, then again with the second detail set: harvest (3 reapers, 5 sheaves), river boat (4 rowers, a steersman, 6 fish under 9 wave lines), cattle (3 oxen, 1 herder), marsh (14 papyrus, 5 birds rising, 1 cat), feast (a table with 7 loaves and 3 jars, 2 seated), music (harp, flute, clapper), the weighing (a small balance, a jackal figure, a seated monster, 2 onlookers) | 13 scenes |
| Register 3 | 5.2..7.0 | THE JUDGES as pictures, z -9..+18.3: seated potato figures on thrones, 1.3 pitch, each holding one feather, each with a different head: falcon, ibis, cat, ram, cow, lioness, crocodile, frog, cobra, hare, hippo, baboon, jackal, vulture (14 heads, 3 throne colours: LAPIS, TURQUOISE, OCHRE RED). Beyond z +18.3: a band of stars and lotus | 21 figures (42 on the two walls) |
| Frieze | 7.2..8.2 | lotus flower and bud alternating, 0.35 pitch, each varied (5-7 petals, lean 4 degrees) | 157 |
| Top | 8.2..10.6 | NIGHT BLUE with stars, as the ceiling | |

- **Door wall** (two panels, x -7.8..-2.8 and +2.8..+7.8, same bands). Left, registers 1-3: a boat 3.6 long with 3
  rowers and a steersman on 9 wave lines, 6 fish under it / a seated figure on a throne, a table with 7 loaves and 3
  jars, 2 bearers with trays, 1 fan bearer / a bird with spread wings 4.0 m, 3 rows of feathers (LAPIS, TURQUOISE,
  GOLD), a ring in each claw. Right: a thicket of 14 papyrus stems, 3 ducks rising, 1 cat, 2 fish / a small balance
  with a feather and a round jar, a jackal figure, a seated monster, 2 onlookers / a winged sun disc 4.4 m with 2
  cobras. All wall figures are POTATO people in profile (egg bodies, collars, kilts) and animals: no humans.
- **Ceiling and architraves**: NIGHT BLUE; five-pointed stars 0.18 across #e9c85a on a 0.6 m lattice, each shifted up
  to 6 cm and turned by its hash (about 2.8 per m2). Architraves: PLASTER, a block border top and bottom, between them
  a row of small spread-wing birds 0.9 wide every 1.5 m.

**Floor**: FLOOR STONE, polished, slabs 2.0 m, joints 1 cm #0f0e13, 3-7 faint veins a slab #2a2833. GOLD inlay (lit
#e2b04a, under a flame #ffe08a, in the dark #6b4612):

| Inlay | Where | Detail |
|---|---|---|
| Scale rings | r 2.5 and r 2.9 round (0, 0) | lines 0.03 and 0.06; between them a chain of 36 lotus, open and bud alternating, 0.30 tall, lines 0.012 |
| Rays | r 3.1..4.4 | 16 blades, long 1.3 and short 0.7 alternating, tapering 0.10 -> 0.02, a disc r 0.05 at each tip |
| Square border | x and z from -4.4 to +4.4 | a running spiral band 0.30 wide, 88 spirals of 0.40, a rosette r 0.25 at each corner |
| Aisle | lines x -1.9 and +1.9, z +4.6..+46 | 0.05 wide; on the centre line an 8-petal rosette r 0.22 every 2.0 m (21). The middle 1.2 m is scuffed matte, 15 % paler (a million souls walked it), its inlay rubbed to 60 % |
| Door wings | z -8.4..-6.6 | spread wings 4.4 wide, 3 rows of 11 feathers a side, a sun disc r 0.35 between |
| Footplates | under each stool | an outline 0.70 x 0.60, line 0.02, a lotus at the front edge (42) |

Polish is painted: under each flame a streak 0.5 x 2.6 m #ffb060 at 0.30 with that flame's flicker; under each column a
pale streak at 0.12; under the open doors the wedge of section 10. No mirror pass.

- **Torch** (26 flames: 22 torches, 4 braziers). Stand: GOLD, foot r 0.22 with 12 petal tongues, shaft r 0.035 with 2
  lotus knops, bowl r 0.20 with a soot-black lip, rim y 1.75; worn to bronze on the shaft at y 0.9-1.3. Flame
  0.42-0.55 tall, 5 tongues in 3 cel tones #fff3b0 #ffb43a #f0661e, 3 painted shapes swapped 8 x a second, sway 6
  degrees; 12 embers #ff6a1e on the rim; 6-9 sparks of 2 cm #ffd27a rising 0.6 m and dying. SMOKE: a ribbon #3a302a
  from the flame tip, 0.35 -> 0 opacity over 1.6 m, widening 0.08 -> 0.35, 3 curls. Glow card r 0.9 #ff9a3a at 0.35.
  Flicker i: 1 + 0.10 sin(2 pi 1.3 t + a_i) + 0.06 sin(2 pi 3.7 t + b_i). With `doors` open, flames and smoke of the
  8 flames nearest the doors lean 15 degrees toward +z (the draught).
- **Dust**: 80 motes of 1 cm #ffd9a0 at 0.25 in the light round the scale, drifting 0.05 m/s.
- **Real lights, 6 at most** (CPU): both scale braziers (y 1.5, range 8), torches (-6.0, 2.05, 0), (+6.0, 2.05, 0) and
  (-6.0, 2.05, +4.5) (range 9), all #ffb060; the door sun (below). Every other flame is painted: glow + a baked pool
  r 2.2 on floor, column and wall. Baked dark along z: 100 % to z +10, 50 % at +18, 12 % at +30, 4 % at +42.
- **Stools** (42, solid): GOLD, seat 0.56 (z) x 0.46 (x), top y 0.42 (the `sit` height), 2 cm dished, a woven-reed
  pattern drawn on the seat (12 x 9 strands); 4 legs carved as lion paws with 4 toes; a 3 x 3 lattice brace on each
  side; worn to bronze on the seat's front edge and the paw tips. **Far row** (scenery): seats `rowFrom` (spec,
  default 7) to 42 carry built figures with F's whole costume (robe with its over-fold, band with its inlays, the
  feather with its barbs); seats 31-42 sit in the 4-12 % dark, a pale feather tip catching the light. They breathe
  1 cm at 0.3 Hz, feathers sway 4 degrees, phases hashed. Seats before `rowFrom` are empty for the rigs.
- **Doors**: GOLD-clad cedar, BOTH faces alike. Each leaf: 4 rails and 3 relief panels 1.8 high: a heron 1.4 tall with
  2 head plumes among 7 reeds / a lotus clump (5 flowers, 4 buds, 3 pads) / 9 papyrus stems; LAPIS inlay lines; 22
  dome studs r 0.03 on each rail; bronze pivot shoes; frame 0.12. Wear: rubbed to bronze at y 0.9-1.5 by the meeting
  edge, a 0.5 m scuff along the bottom. Lintel: a painted winged sun disc, a cavetto cornice to y 7.6.
- **Field of reeds** (seen only through the opening; hidden at `doors` 0):

| Layer | z | What |
|---|---|---|
| Step and path | -9..-13 | pale stone step 0.15, earth path 2.2 wide #d9b877 with 30 pebbles |
| Near stems | -10..-16 | 90 stems 1.5-2.1 m, each drawn once: wheat heads #e9b93a / #f6d86a with 12-16 grains and awns, stalks #c9a13a, 20 % green reeds #7a9a3a with brown heads; sway 4 degrees at 0.4 Hz, phases hashed |
| Field ribbons | -16..-40 | 4 ribbons of wheat, #f0c95a paling to #f6e08a, wind waves crossing every 5 s |
| River | -40..-70 | an S-bend 6-14 m wide #3f8fd0, 12 glints #9fd4f5, banks #7fae4a, 9 palms 3-5 m, 2 white birds |
| Hills, sky | -120, -150 | hills #a79ac0 to #c9bfd6; sky #6fb4ea to #d9efff, 5 clouds #ffffff / #dfe8f2 |

| Param | What |
|---|---|
| `doors` (0) | leaves swing INTO the hall, 0..105 degrees. Scales the door sun (spot #ffe08a at (0, 5, -14) aimed at (0, 0, -2), range 30), a floor wedge 4.4 m wide reaching z -1, 5 ray cards at 0.14, 60 dust motes, the draught |
| `torch` (1) | all flames, glows, smoke, streaks and torch lights |
| `tense` (0) | baked ambient x (1 - 0.4 tense), flicker depth 10 -> 18 %, a cold rim #7a8fb0 from (-0.6, 0.5, -0.6) |
| `rowLight` (0.6) | the torches of the left row from z +9 on (the crane at 13 s lights the row up, 0.2 -> 1) |

## B. SCALE (kind `heartscale`)

Origin: the floor under the pillar; beam along x. HEART pan = left (-x), FEATHER pan = right (+x). Pans hang on chains,
never on stands. Solid: base and pillar only (hands touch the pillar and the heart, nothing else).

| Part | Size, where | Detail and colour |
|---|---|---|
| Base | 3 discs r 0.42 / 0.34 / 0.26, 0.08 each, top y 0.24 | GOLD; 48 petal tongues round the lowest edge, a LAPIS band on the middle disc; worn to bronze on the top edge of each step |
| Pillar | y 0.24..3.02, r 0.09 -> 0.07 | GOLD, 16 flutes; 6 LAPIS stripes on GOLD at y 0.45-0.75; a lotus collar of 8 petals at y 2.80; polished bright #ffe9a0 and rubbed at y 0.8-1.2 (the jackal's hand) |
| Pivot P | (0, 3.10, 0) | a yoke with 2 round cheeks r 0.07 and an axle pin |
| Crest | winged sun disc 1.10 x 0.30 centred y 3.28; orb r 0.11, top y 3.55 | each wing 3 rows of 9 feathers inlaid LAPIS, TURQUOISE, #1c3470; orb GOLD |
| Beam | hang points x -1.50 and +1.50; 3.24 with the finials; 0.11 high at P, 0.07 at the ends | GOLD, an engraved rope pattern of 64 twists along it, lotus finials of 5 petals |
| Pointer + arc | a tongue 0.35 down from P, turning with the beam, over a fixed arc plate r 0.35 with 11 notches (tilt -1, -0.8 .. +1) | GOLD, pointer tip LAPIS; the notch at 0 is a small feather shape |
| Chains, 3 a pan | a ring under each beam end held by a falcon claw; rim points at -60, +60, 180 degrees (0 = +z); apex to rim 1.85; beam end to rim 2.00 | 26 oval links a chain (0.075 x 0.045, wire 0.011), every second link turned 90; 156 links in all, none merged into a bar |
| Pans | r 0.40, 0.07 deep (shallow: the heart shows above the rim), rim roll 0.02 | GOLD. Outside: 16 embossed lotus petals, each with a centre vein and 2 side veins, tarnish #9a6a1e between them; 60 bead dots under the rim. Inside light #fff0b8: 40 concentric scratch strokes and 14 dents of 1-3 cm a pan; rim rubbed to bronze |
| Feather (right pan) | ostrich, 0.46 long x 0.12, lying across the dish, tip curled 0.05 over the +z rim | #f6f2e6, shade #cfc9bb, quill #e9dcc0; 44 barbs a side with 4 splits, 6 downy tufts at the root |

- Heights: beam angle a = asin(0.633 x tilt). Heart pan rim y = 1.10 + 0.95 tilt, dish floor 0.07 lower, pan centre
  x = -1.5 cos a. Level: rim 1.10 (over Spud's head, a camera at y 1.25 sees into the dish). tilt -1: rim 0.15, dish
  0.08 off the floor (eaten). tilt -0.8: rim 0.34 (Chip's worst). The feather pan mirrors it (up to rim 2.05).
- HEART SEAT S = (-1.5 cos a, 1.03 + 0.95 tilt, 0) + the wobble: the heart rides the dish rigidly (grip rule 2).
- The 120 degree gap between the front chains frames the heart from +z (0.69 m at the rim); the monster's snout comes
  in through the gap at -120 degrees (her rot 60 line); Spud's arm through the front gap.

| Param | What |
|---|---|
| `tilt` -1..+1 (0) | heart side down = negative. One CLUNK = 0.2 in 3 frames, 15 % overshoot, settled in 9 frames; the pointer drops into the next notch (the visible cause) |
| `wobble` (0) | beam rocks 2.2 degrees at 1.7 Hz + 0.6 at 4.1 Hz; pans stay plumb and sway 1 degree a quarter cycle late; feather tip lifts 1 cm |
| `jolt` (0) | chain links rattle 4 degrees, pans bounce 1.5 cm (director: 1 -> 0 in 0.4 s on each clunk) |
| `smear` (0) | JUICE on the left pan: 5 drip runs over the +z rim 0.05-0.14 long with hanging drops, 9 splats on the outer petals, a pool r 0.12 in the dish. No juice within 0.06 m round the heart's outline as seen from +z (red on red) |
| `drip` (0) | 2 of the runs let a drop fall every 0.9 s (phases hashed) into H's pool |

## C. MONSTER (kind `heartmonster`; a prop, built like the bear in props-bear.js: ONE lofted skin, tail to snout)

Origin: the floor between the four feet, facing +z, at stand. Scale 1 below; 2.0 Spuds at the crown when rearing.

| Part | Size, where (stand) | Detail and colour |
|---|---|---|
| Whole | rump z -1.15 (+ tail 0.28), snout tip z +1.75; crown y 1.30, mane top 1.40, rump 1.15; 1.20 wide | |
| Hippo back half, z -1.15..+0.05 | bloated: belly 1.20 wide at z -0.5, sagging to y 0.30; hind legs stumps 0.36 across x 0.55, 4 blunt toes with nails 4 cm | grey-olive #77785f, belly #a09c80. 5 fat rib rolls a flank (creases 0.9 long, 3 cm deep, at z -0.85, -0.60, -0.35, -0.12, +0.08, crease #4f5140); 7 spine knobs; 9 pink-grey blotches #8f7f78; 60 fine dry-mud crack lines; 12 wrinkle lines at each leg joint; 40 sparse bristles on rump and tail; 5 belly fold lines |
| Tail | 0.28 x 0.09 | #4f5140, a bristle tuft with one torn notch |
| Lion front, z +0.05..+0.75 | shoulders y 1.22, chest 0.80 wide; forelegs 0.20 thick, elbows back; paws 0.30 x 0.34 x 0.13 | fur #8a6f4a, shade #5e4a30, 30 short fur ticks on each foreleg's outline; a row of 3 old tooth dots on the left foreleg |
| Claws, 4 a paw | 7 cm, curved | #d9cfae, cracks #4a3d2c. CRACKED: per paw 2 split along their length, 1 broken short, a different three on each paw |
| Mane | a ruff 0.38 thick from the skull to the shoulders | #7a4a26, shade #4f2e17. MATTED, 46 heavy clumped locks, 4-9 cm thick, stuck together in twos and threes, hanging, not fluffy: 14 crown locks 0.18-0.25 lying back, 20 ruff locks 0.30-0.42 by the cheeks and under the jaw, 12 shoulder locks 0.25-0.35. Each lock 3-5 strand lines; 5 dusty tips #a8703a; 3 locks with a knot lump of 4 cm; 6 small TURQUOISE ring beads r 0.02 on 3 of the ruff locks |
| Braids + beads | 4 braids at x -0.38, -0.30, +0.30, +0.38 from y 1.20, hanging 0.45 and 0.60 | three-strand plaits with 9-12 crossings drawn. Each: 3 GOLD beads r 0.035 with 2 engraved rings + a teardrop end bead r 0.045 with a LAPIS dot (16 beads) |
| Croc head | skull 0.98 long (z 0.80..1.75), 0.52 wide at the hinge, 0.30 at the tip, 0.34 high at the eyes, snout 0.16 thick | hide #6c7048, shade #454a30, lips and under-jaw #a8a274. Skull top: 2 rows of 6 squarish scutes of 5-7 cm; neck: 4 rows of 5 keeled scutes to the mane; 2 ridges along the snout meeting at the nose; a nostril bump with 2 slits; brow ridges of 3 fused scutes; a wavy upper lip with the notch behind the tip; 18 lip scales a side with 30 dark pit dots a side; about 120 pebble scales of 1.5-3 cm on cheeks and jaw drawn as part arcs, densest on the shade side; 20 hand-placed warts; one broken scute |
| Scars, 5 | an X on the left snout (0.16 strokes), a slash through the right brow and lid 0.22, one 0.30 on the left cheek, two 0.40 on the left flank | raised, 8 mm, old and pale #c7a58f, 3-5 cross ticks on each |
| Eyes | (-0.17 and +0.17, 1.26, 0.98), ball r 0.045, a slit 0.09 x 0.04 under the brow | amber #f0b21c, centre #ffd75a, 8 fine radial flecks #c9861a; vertical pupil 0.012 #1a120a; one catch-light; wet lower lid line |
| Teeth, 36 (20 up, 16 down) | CROOKED, each placed by hand: 9 fangs 7-10 cm, 15 mid 4-6 cm, 12 stubs 1.5-3 cm, never 3 neighbours of one class | yellow #ecd98a, root stain #b98f3c on the lowest third, tip #f8efc0, a hairline crack on 6. Lean up to 16 degrees in or out, 10 fore or aft; 3 gaps (upper left 4th, lower right 2nd, lower left 7th); 2 chipped flat; 1 snaggle fang 25 degrees outward at the upper right front. Jaw shut: 8 uppers and 5 lowers overlap the lips |
| Mouth | tongue 0.34 x 0.11 | inside #7a2f3c with 7 palate ridges, throat #3a1820, tongue glossy #d9778a with a centre groove |

Pivots (stand): hips (0, 0.80, -0.75); shoulders (-0.30 and +0.30, 0.95, 0.40); neck base (0, 1.05, 0.55); atlas
(0, 1.12, 0.80); jaw hinge (0, 1.02, 0.86); tongue root (0, 0.98, 1.00); tail root (0, 0.95, -1.15).
MOUTH POINT M = between the front teeth, jaw shut: (0, 0.95, 1.72) at stand.

| Param | Pose at 1 | Used |
|---|---|---|
| `low` (0) | the lean into a low pan: elbows fold, chest drops, neck stretches, rump stays at 1.10; M (0, 0.24, 1.95): the chin rests in a dish at tilt -1 | 0.0, 40.0 |
| `rear` (0) | up on the hind legs (front paws leave the floor by 0.2): body 38 degrees up, crown 2.05, mane 2.14, paws hang at y 1.15, head 25 degrees down over a level pan; M (0, 1.62, 1.40) | 34.5 option |
| `sit` (0) | dog-waiting: haunches on the floor, hind feet forward under the belly, forelegs straight and planted; crown 1.72, M (0, 1.38, 1.05) | 7.8-24.5 |
| `slump` (0) | flat and sulking (panel 20): legs splay, belly 12 % wider, chin on the floor between the front paws, crown 0.62, lids to 0.6, brow ends drop 12 degrees, mane sags 4 cm; M (0, 0.10, 1.85) | 60.0 |
| `jaw` (0) | gape 55 degrees. `jawTop` (0.27) = the share the skull takes by lifting: 0.27 = lower jaw -40, skull +15; 1 = the lower jaw stays (chin in the dish) and the skull lifts 55. At jawTop 0.27 it needs 0.6 m free under M: open from M1, not over a pan | 34.5 |
| `chomp` (0) | ONE bite at the current jawTop: 0-0.35 opens to jaw 1 and pulls back 6 cm; 0.35-0.5 SHUT in 3 frames, the head drives down 5 cm; 0.5-1 holds 2 frames, relaxes. Director: 0 -> 1 in 9 frames, jawTop 1 in `low` | 0.3 |
| `chew` (count) | one cycle a whole number: jaw 0 <-> 0.3, lower jaw slides 2.5 cm sideways, cheeks bulge, head rolls 3 degrees | 0.7 |
| `lick` (0) | 0-0.2 tongue tip out at her left mouth corner, 0.2-0.8 along the upper lip to the right corner, 0.8-1 back in | 1.2, 7.8 |
| `headYaw` -1..1, `headPitch` -1..1 | 55 and 25 degrees about the atlas (the neck takes 40 %); mane and braids follow 0.12 s late, beads swing | 74.0 |
| `gait` (count) | a heavy walk, lateral sequence, 0.60 m a cycle; a planted foot never slides: move her 0.60 m a cycle along her heading | 30.5 |
| `breath` (0) | 6 cel puffs #e9e2c8 at 0.35 from the mouth, 0.25-0.4 m, reach 0.9 m (only with jaw > 0.3); flanks heave 2 cm at 0.5 Hz always, 1 Hz at 1 | 40.0 |
| `drool` (0.5) | 5 glossy strings from the lower teeth, 0.06-0.26 m x drool, 6 mm, drop ends with a highlight, swinging; #eef2e6 at 0.8 | |
| `stain` (0) | JUICE on 7 tooth tips, 4 drips 4-9 cm from the lower lip, 1 on the chin | from 0.3 |
| `lids` (0.25), `glow` (0.4) | upper lid 0 wide .. 1 shut; eye emissive, halo 6 cm #ffc23a at 1 | |
| `wag` (0) | the tail thumps 20 degrees each way at 1.4 Hz (the dog-waiting joke) | 7.8 |

One body pose at a time (slump, sit, rear, low); jaw, lick, head, drool and breath go on top of any. The bite: as the
skull comes down the heart rides from S up 0.06 onto the lower front teeth (the generator's tween), squishes, is gone.

## D. HEART (kind `heartface`) and BEETLE CHARM (kind `heartscarab`), one file

Heart: a cartoon heart, never anatomical (no veins, no tubes). Origin: its contact point; faces +z.

| Part | Size (Chip's, scale 1; Spud's = scale 1.15, same colours) | Colour |
|---|---|---|
| Body | 0.20 wide x 0.19 tall x 0.13 deep; lobes r 0.062, cleft 0.03; stands on a flattened point 0.05 wide, leaning back 6 degrees | glossy #e3262e, shade #a8141f on the lower right third, bounce #ff7a6e along the lower left edge, a GOLD reflection of the dish 0.02 high at the foot |
| Gloss | one kidney shape 0.035 x 0.020 on the upper left lobe + a dot 0.008 + a thin rim light on the right lobe | #ffffff, rim #ffb0a8 |
| Eyes | (-0.030 and +0.030, 0.118), ovals 0.017 x 0.024, catch-light 0.005; brows 0.018 strokes 0.012 above | #1a1014 |
| Mouth | (0, 0.082), 0.022 wide | line #6e0f18, inside #6e0f18, tongue #ff8a8a |

| Param | What |
|---|---|
| `blink` (0) | lids shut at 1 |
| `mouth` (0) | talk: 0 a line, 1 an open oval 0.024 x 0.030 |
| `smug` (0) | half lids, flat brows, a one-sided smirk |
| `seal` (0) | lips pressed to a wavy line, cheeks puff (lobes 8 % fatter beside the mouth), eyes wide and turned to the charm; the face slides 0.012 toward +x (panel 18) |
| `sweat` (0) | ONE bead r 0.014 on the upper left lobe, sliding 0.05 m every 1.2 s (panel 04); nothing flies off |
| `squish` (0) | opening 02: height x 0.55, width x 1.30, eyes shut as two chevrons, mouth wide. At 1 the heart is hidden: the jaws are shut and H's `burst` starts. Never shown bitten or in pieces |
| `lookX`, `lookY` -1..1 | pupils |
| `beat` (0.3), `rate` (Hz, 1.2) | a two-thump pulse, 4 % swell at 1 |
| `lean` -1..1, `hop` (0) | 15 degrees toward a speaker; a 3 cm bounce per syllable: its acting when it is small in frame |
| `charm` (0) | the beetle stuck on: front surface, centre (-0.040, 0.070), long axis 20 degrees off upright, head up, proud 0.026; the slap = a 2-frame 8 % squash |

The face reads only when the heart is 250 px wide or more (frame 0.85 m wide or less); wider shots use lean, hop, beat.

Charm (`heartscarab`): a heart scarab, 0.085 long x 0.062 wide x 0.028 thick. Origin: centre of the flat underside.
Polished dark green stone #2f5a3c, light #4f8a5c, deep #1c3524.

| Face | Carving |
|---|---|
| Back | a head plate with 4 notches on its front edge and 2 eye bumps; a shoulder plate with a border line and 2 curved V marks; 2 wing cases with the centre seam, 5 fine grooves each and a small triangle notch at each shoulder; 6 legs in low relief, 4-5 saw notches on the front pair |
| Underside (panel 17) | a raised oval border 3 mm; 3 registers parted by 2 double lines. Top: 5 reed stems and a boat with 2 potato rowers. Middle: a seated potato figure on a low throne, an offering table with 3 loaves and a jar, a lotus. Bottom: 4 reed stems, a jackal lying on a shrine, a feather. Cut lines 0.6 mm, filled pale #a9d6a0; traces of old gilding #c9b45a in 30 % of the lines |
| Stone | 30 pale flecks #9fc49a, 2 darker veins, one soft highlight, 2 tiny rim chips, the thread hole's 2 mm ends at head and tail |

Param `glint` (0): one highlight sweep. Holds: panel 16 pinched at shoulder height, thumb in front, back to Chip; panel
17 lying on the open palm, underside up; panel 23 Chip's fist round it, both ends showing.

## E. JACKAL JUDGE (costume `jackal`, file `characters/egypt-myth/jackal.json`)

Base: Mash's body block unchanged (`characters/potatobrawl/mash.json`: 1.24 x 0.54 x 0.50, taper 0.05, glove 1.15):
the only cast body that is tall and narrow (1.38 standing = 1.35 Spuds), so he is taller than Spud before the ears and
reads lean; none of Mash's costume carries over. body.color and limbs #1b1a21 (sheen #2a2c3a), black glove, sprout
none, iris amber #e9a820. The rig's own eyes stay alive (blink, look); its mouth is hidden under the snout.
Heights are body-local (y 0 = the base of the 1.24 body). Assumed face points: eye line y 0.72, mouth y 0.57: the
builder measures them on the rig and shifts every head part by the difference.

| Piece | Size, where | Detail and colour |
|---|---|---|
| Head | everything above the collar is the black jackal head | #1b1a21, a soft blue sheen band down the brow; a GOLD rim line 0.006 round each eye with a tail 0.05 toward the ear |
| Snout | root on the mouth point, 0.21 wide x 0.17 high; 0.34 long, sloping 8 degrees down, to a tip 0.085 x 0.07; lower jaw 0.30 long hinged at the root | #1b1a21, under-jaw #2a2832; nose pad r 0.028 #0d0c10 glossy with 2 comma nostrils and a highlight; a mouth line along each side; 6 whisker dots a side |
| Ears | roots (-0.12 and +0.12, 1.17, -0.02); 0.38 tall, 0.13 wide, cupped, 9 degrees out, 6 back; tips at world y 1.68 (1.65 Spuds) | black, inner stripe #c9962e with 5 fur strokes, a thin GOLD ring on the left ear's edge at 60 % up |
| Lappets | 2 striped bands 0.10 wide from behind the ears (y 1.0) over the shoulders' front to y 0.40, at x 0.12 or less from the centre (shoulders free) | LAPIS / GOLD stripes at 0.03 pitch (20 stripes each), a GOLD end bar |
| Collar | top edge y 0.47 (0.10 under the mouth), 0.10 deep, bib to y 0.33 at the front | 4 rows: 36 GOLD tube beads, 32 LAPIS blocks, 28 TURQUOISE blocks, a GOLD bar; 22 teardrop drops 0.022, LAPIS and GOLD alternating; a counterweight tab 0.05 x 0.10 at the back |
| Belt | 0.05 at y 0.27 | GOLD, an oval LAPIS buckle 0.05 with a tied knot under it; a tab 0.06 x 0.22 down the apron, LAPIS / GOLD bars |
| Kilt | y 0.27 to 0.02, hem 1.10 x the body's radius; a stiff front apron (0.16 wide at the belt, 0.24 at the hem) | LINEN: 26 hand-varied pleats wrapping right over left, the overlap edge showing; apron with a GOLD border 0.012 and 7 GOLD thread lines across |
| Bands | armlets 0.03 (0.08 under the shoulder), wrist bands 0.035 ending 0.06 before the hand's centre, anklets 0.02 | GOLD, 2 engraved lines and a LAPIS oval on each armlet; worn at the edges |

- Key `jackal.jaw` 0..1: the lower jaw opens up to 12 degrees, following the rig's speech if it can be read; else it
  stays shut and "Pass." / "Next." are carried by the arm.
- Gestures (the costume stays clear in each): (1) HAND ON PILLAR from 2.4 s: right palm flat on the shaft at world
  y 0.95, elbow bent 20 degrees, never more than 1 cm in. (2) "PASS" (panel 20): left arm 60 degrees above level and
  0.35 FORWARD of the body (the feather pan's chains start at x 1.15), palm flat toward the cast, fingers up, 1.2 s;
  the palm 0.30 or more to the side of the snout. (3) "NEXT" (panel 23): the body turns 35 degrees to Spud first, then
  the left arm straight and level at the heart pan, one finger out.

## F. THE 42 JUDGES (costume `assessor`; one design, three files `assessor-a/b/c.json`)

Base: Spud's body block (`characters/potatobrawl/spud.json`: 0.88 x 0.76 x 0.66, glove 1.3), Spud's skin, eyes and
hands: one people with the cast, `sit` is proven on this body, and it is stout as in panels 07-09 (worker-a at 0.60
wide is too slim to tower over Chip). Copies differ only in body.seed (31, 43, 59), height (0.85, 0.88, 0.91) and
feather lean. Sprout none. The stern face (heavy brows, mouth down) is an expression the clip sets. Body-local heights
(lip line about y 0.36). Seated on A's stool: head top at world y 1.30, feather tip 1.70; Chip is 0.67.

| Piece | Size, where | Detail and colour |
|---|---|---|
| Robe | a shell 0.02 off the belly, hem y 0.03 and 0.82 wide; neck opening lowest at y 0.30, rising to the shoulders at y 0.60 | LINEN. 9 broad folds: 5 fanning from the left shoulder across the chest, 4 falling over the lap; a knotted fringe of 48 tassels 0.02 on the hem |
| Over-fold | a band 0.17 wide from the left shoulder to the right hip (y 0.14), 0.012 above the robe | LINEN with 60 fine pleat lines along it, a GOLD stripe 0.012 on its edge, a loose end 0.12 hanging behind the shoulder |
| Sleeves | short and wide: 0.20 at the shoulder to 0.15, ending 0.14 before the hand's centre | LINEN, 14 pleat lines each; a GOLD band 0.035 on the bare forearm with 1 engraved line |
| Collar | a band 0.05 round the neck opening | GOLD, 18 bead dots, a LAPIS oval 0.03 at the front |
| Headband | 0.045 high, centred y 0.76; 0.12 or more above the eyes | GOLD, 12 LAPIS squares 0.012 inlaid round it, a LAPIS disc r 0.022 at the front, the tie's two ends 0.08 hanging at the back |
| Feather | ONE ostrich feather: root (0, 0.86, -0.05), 0.42 tall, 0.14 wide at 65 % up, tip curled 0.06 forward, leaning 10 degrees back (copies: 5 to 15) | #f6f2e6, shade #cfc9bb, quill #e9dcc0: 38 barbs a side with 4 splits, 6 downy tufts at the root; follows the head 0.15 s late, 6 degrees |

Lean-in (panel 08): seated, the body 25 degrees forward, one hand on the knee. Rigs sit on stools 1-6 (default).

## G. THE SOUL (kind `heartsoul`: a built figure, not a rig; also the 8 queue copies)

A stranger: an egg shape, narrower on top, body 0.80 x 0.66 x 0.58 on 0.14 legs (0.94 standing), no sprout. Origin: the
floor between the feet. Whole figure at opacity 0.55 with a cool edge #cfe6f0 at 0.85 (pale and see-through).

| Part | Size | Detail and colour |
|---|---|---|
| Body, limbs | as above; thin limbs, mitten hands | #e9e2d0, limbs #d9d2c0; 9 faint potato eyes (dimples) #d9d2c0; the torch behind shows through as a warm blur |
| Face | eyes ovals 0.05 x 0.07, mouth an O 0.06 at `scream` 1 | #3a3a44, brows as two short strokes |
| Wrap | sheer linen wound twice round the body from y 0.10 to 0.62 and over one shoulder, a loose end 0.25 | #f7f4ea at 0.4 a layer (two layers read denser where they cross); 14 fold lines #d9d4c4, 40 fine pleat lines, a frayed end with 9 threads |
| Ash pile (at `crumble` 1) | a low uneven cone r 0.34, h 0.11, 3 lobes | #8d8880, top flecks #b9b4aa, shade #55524d; 40 specks within r 0.6; a scrap of the wrap 0.08 lying on top |

| Param | What |
|---|---|
| `reach` (0) | 0 arms down, standing (the queue). 1 leaning 12 degrees to the pan, right hand up and forward (0.95 high, 0.5 ahead), left arm thrown back |
| `scream` (0) | eyes wide, mouth O |
| `crumble` (0) | a front rises from the floor: height -0.05 + 1.15 x crumble. Below it nothing; the top 0.06 of the cut is a jagged edge of 2-4 cm chips #8d8880. 140 flakes of 1-3 cm (#b9b4aa, #8d8880, #6e6a64), each let go as the front passes it, falling (a function of crumble only), drifting 0.12 m out at most, landing on the pile. 8 cel dust puffs #cfc9bd 0.15-0.35 m at the base from 0.2. At 1 only the pile is left, and it stays |
| spec `seed`, `sway` | queue copies: shape, wrap and dimples vary 6 %; 2 cm sway at 0.5 Hz |

## H. JUICE (kind `heartjuice`; owns the JUICE palette and every juice shape in B, C and on Chip)

Cartoon-gross, never gore. Thick as ketchup: fat glossy blobs, opaque, ONE shade tone, a hard white gloss shape on each,
ink outline. Tomato seeds: pale teardrops 4 mm #f6d98a, 1 in every 3 blobs, 5-9 in the main pool. Forbidden: any red
darker than #c9341a, brown, drying, soaking, mist, smears on skin, runs down a body, pieces of heart.
Origin: the heart seat S of the pan it is placed on, +z to the camera.

| Param | What |
|---|---|
| `burst` (0) | the spray, 0..1 = 0..0.8 s of flight: 46 drops of 2.5-7 cm from the mouth point, 150 degrees fan about +z, 10-65 degrees up, 2.2-5.0 m/s, falling under gravity, stretched 1.6 x along their path, a gloss dot on each; each lands as its own splat (the landing spots are fixed by index). 4 aimed drops: 3 at spec `shoes` [x, z], 1 at spec `cheek` [x, y, z], arriving at burst 0.5 |
| `pool` (0) | on the floor: a main pool 0.55 x 0.38, 5 lobes, 6 mm thick with a rounded edge, under the pan; 14 splats 4-16 cm within r 1.6, each with 2-4 tails pointing away from the pan; 20 dots; a warm torch highlight on each; opaque, no floor inlay shows through. Stays for the whole film |

Marks on Chip (`chip-juice.json` = Chip unchanged + costume key `juice`; `chip.json` is not touched): right trainer 3
blobs (2.6, 1.8, 1.2 cm) on the toe cap and outer side, left trainer 2 (2.2, 1.4 cm); `juice.cheek`: ONE teardrop
2.0 x 2.6 cm on the camera-left cheek, 0.05 below the eye, 0.06 outside the mouth corner. Swap at the cut after 0.3 s.

## I. MUSEUM CASE (kind `heartcase`; panel 22 without hosts, visitors or plaques)

Stands 300 m or more from the hall (e.g. x 400), brings its own wall, floor and lights (range 12 m, off while hidden).
Origin: the floor under the case's centre; the show side is +z. The wall is tall because the frame is.

| Part | Size | Detail and colour |
|---|---|---|
| Plinth | 1.60 x 0.60 x 0.80 high | #eef0f2, shade #c5cad0, a shadow gap 0.02 at the floor |
| Glass | 1.60 x 0.60 x 1.10 | tint #dff0f5 at 0.10; steel edges 0.015 #9aa3aa, 8 corner clamps; 2 diagonal reflection streaks at 0.12; a soft reflection of the lid strip |
| Risers | 4 steps, rise 0.16, run 0.12 | covered in pale linen #f4f6f7 with a stitched edge line |
| Scarabs | 4 rows of 6 = 24, 0.060-0.095 long, each on a block 0.10 x 0.03 x 0.08 tilted 25 degrees to the viewer, yaw up to 8 degrees | D's carving on every one (head notches, seam, grooves, legs); 3 lie underside up with their 3 registers; 5 greens by index #2f5a3c #3a6b47 #27503a #4a7a52 #5d8a5a; 4 have a chipped rim, 2 a GOLD band round the body; a soft shadow under each |
| Wall, 1.2 m behind | 6.0 x 5.2 | #dfe3e6; a niche 1.6 x 1.0 at y 2.3-3.3 with a pale stone relief of a bird with spread wings (3 rows of 9 feathers, 20 % old paint traces LAPIS and OCHRE RED) #e9e4d6; a cornice line at y 4.6; 2 hanging lamps (white cones 0.3) at y 4.2 |
| Floor | 6.0 x 5.0 | #c9ccd0 stone, slabs 1.0 m, a soft reflection of the case |

Lights: a strip in the lid #f2f8ff (one white highlight on every scarab), 2 cool spots #eaf4ff from above the camera.
Param `glint` (0): one highlight pass across the glass. Cameras (start): whole case (0, 1.45, 3.9) -> (0, 1.30, 0.3),
fov 50: frame 1.89 m wide, case 915 px, a scarab 46 px; push in to 2 rows at (0, 1.5, 1.9): a scarab 92 px.

## 10. LOOK: light per act

Cast skin never reads darker than #a8733a (cast colours stay); no depth of field; vignette 0.25.

| Act | t (s) | Key (direction TO the light, colour) | Fill sky / ground | Hall params | As seen | Frame mean |
|---|---|---|---|---|---|---|
| Opening, gruesome | 0-2.4 | (0.25, 0.85, 0.45) #ffd9a0, key to fill 2 to 1 | #4a3a2e / #2a2018 | torch 1, tense 0.6 | gold #e2b04a lit, #8a5f1c shade; mane rim-lit by the scale braziers | 26 % |
| Torchlight hall | 2.4-24.5 | same | same | tense 0.2, rowLight 0.2 -> 1 at 13.0 | warm, the row fading to 4 % | 32 % |
| The heart snitches | 24.5-52.5 | same, x 0.9 | x 0.85 | tense +0.15 per clunk to 0.8; monster `glow` to 1 | cold rim on her mane, eyes the brightest amber | 32 -> 22 % |
| Montage, pass | 54-62 | x 1.0 | x 1.0 | tense 0.8 -> 0 over the 4 rises | warm again | 30 % |
| Golden daylight | 62-65 | door sun TO (0, 0.35, -0.94) #ffe08a + front bounce #ffe2a8 at 0.6 | #cfe0f0 / #d9b877 | doors 0 -> 1 in 1.2 s, torch 0.5 | sky #8ec9f0, wheat #f6d86a, floor wedge #ffe9b0 | 55 % |
| Cool museum | 65-70.5 | (0.1, 1.0, 0.3) #eaf4ff, key to fill 1.3 to 1 | #cfd9e2 / #c9ccd0 | (heartcase) | the only cool, white picture: greens on white | 60 % |
| Tense end | 70.5-78 | as the opening | as the opening | doors 1 -> 0 in 0.5 s, torch 0.7, tense 0.6 | the last frame matches frame 0 (the loop) | 26 % |

## 11. REUSED as they are

Spud (`characters/potatobrawl/spud.json`) and Chip (`chip.json`): skin, costume, sizes untouched. `exhibitrope`
(props-museum.js) for the queue rope. The linen tones of costume `egyptworker`. The bear's build (props-bear.js) for C's
skin, gait and rear. The flame swap and flicker of zroof and zstairs. The cut-off cuff and neck logic of
costumes-judge.js for E and F.

## 12. ORDER, builder time, count checks

Nothing ships crude. The floor plan, marks, sizes and params above are frozen, so staging can start from the numbers
while the looks are built. Each look has a bench sheet; the reviewer counts on it:

| Piece | Share of builder time | What takes it | Count check on the bench sheet |
|---|---|---|---|
| A hall | 32 % (walls 14, columns 6, floor 4, doors + field 5, torches + ceiling 3) | 78 procession figures of 8 types, 26 scenes, 42 painted judges with 14 heads, 6 door-wall scenes | per side wall 39 / 13 / 21; 24 capitals each 8 sepals, 24 stems, 8 buds; floor 36 lotus, 16 rays, 88 spirals, 21 rosettes; 26 flames with smoke; 6 door panels |
| C monster | 24 % | one skin with 5 poses, the teeth, the mane, the scales | 36 teeth (9 / 15 / 12, 3 gaps, 2 chipped, 1 snaggle); 46 locks; 4 braids, 16 gold beads; 5 scars; 8 front claws (3 cracked a paw), 8 hind nails |
| B scale | 9 % | chains that hang right at every tilt, engraving | 156 links; 16 petals and 14 dents a pan; 11 notches; 54 crest feathers; feather 44 barbs a side |
| E jackal | 8 % | the head on a live face, the collar | collar 36 / 32 / 28 + 22 drops; 26 pleats; 40 lappet stripes |
| F judges | 8 % | linen folds, the feather, 3 variants + the far-row copies | 9 folds, 60 + 28 pleat lines, 48 tassels, 12 inlays, 38 barbs a side |
| D heart, charm | 7 % | 6 face states, the scarab's two carved faces | 3 registers with their pictures; 5 grooves a wing case; 30 flecks |
| G soul | 4 % | the crumble front and flakes | 140 flakes; 14 fold lines; pile with 3 lobes |
| H juice | 4 % | 46 flight paths that land as splats | 46 drops; 14 splats; 20 dots; 6 marks on Chip |
| I case | 4 % | 24 carved scarabs | 24 scarabs, 5 greens, 3 underside up |

Build order: B + D (the picture the hook hangs on) and A (the long pole) start at once; then C; then E, F, G, H in
parallel; I last. A and C are the two pieces to give the most time; do not cut their counts to save it.

## 13. Sheet drift, what cannot be staged as drawn, open questions (default)

1. Monster side. Opening sheet and panel 24: she is on the HEART side (left), the jackal right of the pillar. Panels
   01-20 of the two sheets draw her on the feather side and the jackal left. Default: the opening sheet's sides for the
   whole film (she eats from the heart pan; a sinking pan sinks toward her mouth; nobody changes side unseen).
2. Pans on stands (panels 13-23), a stone dais (opening 01-03), a white crowd behind the scale (13-20, 23): all drift.
   Default: chains only, the 0.24 gold base on the floor, the door wall behind the scale, the queue in the aisle.
3. Heart size. The brief says grapefruit; the panels draw about 0.30 (0.6 of Chip's width). Default 0.20 (Spud's 0.23)
   and a close shot whenever its face must read.
4. Panels are 3:2, the frame is 9:16: the whole scale plus the monster needs 6.5 m of width (Chip 110 px tall).
   Default: stage in depth and height (the scale is 3.55 tall), the monster's head and one pan per shot. The tall
   frame shows capitals, architraves and the star ceiling in every wide: they are designed above for that.
5. 52.5 s: at tilt -0.8 the heart's centre is 0.37 off the floor, Spud's shoulder 0.62: he bends to slap the charm on.
6. Rigs: Spud, Chip, jackal + 6 judges = 9. Default: judges 1-6 are rigs, seats 7-42 hall figures in the full
   costume; the montage re-cuts the same 6. If 9 rigs are too slow: 3 rigs and `rowFrom` 4.
7. The soul as a built figure, not a rig (0.7 s on screen; a see-through, crumbling rig is an engine change). Default
   as written.
8. Cheek drop. Default: on from the cut after 0.3 s, wiped with the back of his hand at 3.5 s (seen), trainers stay
   stained to the end.
9. Wall figures as potato people, tomato seeds in the juice, the jackal's live rig eyes with a low face (a big head on
   a small kilted body, not the sheet's small head): defaults as written.
10. Against standing rules, kept because the brief asks: the sweat bead (story.md section 3, no reaction symbols) and
    the juice spray (character bible, no splatter). Both stay as designed above: one bead on the skin, tomato juice.
