# Norse myth 01 "One eye for one sip" (Wednesday): DESIGN of the new looks (22 Nov 2026)

Target: STORY.md v1 + the drawn sheets (odin-concept = Odin turnaround, expressions, details, ravens, guardian head;
norse-sheet-1 panels 01-12; norse-sheet-2 panels 13-24; panel text in `sheets/sheet-*-prompt.txt`). Tall 1080x1920.
STORY.md wins on story, the sheets win on look; where they disagree: section 13. Builders build exactly these numbers,
ONE file per look, each with a usage header and a `<NAME>_STATE` export as in props-zfight.js.

Jonny, 22 Nov: "i would like to design a new and more detailed odin for this (not our fighter)" and "id like this series
to be made with detail and love like the egypt heart video". Standing note for myth episodes: scenery and side
characters need real love for detail and beauty. DETAIL AND BEAUTY ARE THE PRIORITY. Every count, hex and size below is
part of the look: nothing is simplified, merged or left for later, no crude first pass. Section 12 has the count checks.

Rules for all:
- Metres, x right, y up, z toward the default camera; a prop faces +z at rot 0. 1 Spud = 1.02 m standing (body 0.88 +
  legs 0.14), Chip 0.67, Odin 1.53 to the top of his body (1.5 Spuds), 1.70 to the hat, 1.80 to the dry leaf, spear
  2.10. LEFT and RIGHT are always the character's own: HIS LEFT = +x when he faces +z = camera-right in a front view.
- Params are 0..1 unless said, default in brackets, seeded with a dur-0 set before any tween. A pure function of spec,
  state and t; every mark drawn once from its index and spec.seed (no tiling, no random, no clock). Hand-drawn Ghibli
  look, ink on hard edges. Glows, mist, shafts, caustics, motes: steam, noOutline, no shadow.
- Anything that fades grows or shrinks by scale or visibility, never by a tweened material opacity (clip-lessons: an
  opacity tween kept its first frame in a sequential render).
- No letters, digits or words in any look. Runes are only the twelve RUNE MARKS below, cut as straight strokes (a
  stave and diagonals, no curves, no level strokes: they were cut across wood grain). Never more than 3 in a group,
  0.4 m or more apart on scenery, never a row that reads as a word.
- FORBIDDEN SHAPES anywhere (most viewers are in Germany; these are banned or read as hate signs there): an S or Z
  lightning stroke alone or doubled, an arrow pointing up, a Y or trident on a stave (up or down), a diamond standing
  on two legs, a Z with a bar through it, any hooked cross, any sun wheel. Also no mark equal to a Latin R, B, H, I, M.
- Never gore: Odin's lost eye is a clean glossy orb (no veins, no red, no stalk); Chip's plucked potato eye leaves a
  smooth pale dimple (no wound, no juice). Scars are pale, never red.
- Copy nature, build uneven: moss sits on upper faces and in furrows, never under an overhang; lichen grows in discs
  with a paler rim; ferns grow as crowns of 5-9 fronds from one point in a crack or on a ledge; hanging roots are
  thickest at the top and fork in the lowest third; wind piles dry leaves in hollows and against roots; old cuts in
  bark heal with a raised lip.

RUNE MARKS (cell 1 wide x 2 high, strokes as (x, y)-(x, y); cut width 6 % of the mark's height):

| Mark | Strokes |
|---|---|
| M1 | (0,0)-(0,2); (0,1.0)-(0.6,1.6); (0,1.45)-(0.5,1.95) |
| M2 | (0,0)-(0,2); (0,2)-(0.7,1.3); (0.7,1.3)-(0.7,0) |
| M3 | (0,0)-(0,2); (0,1.5)-(0.5,1.0); (0.5,1.0)-(0,0.5) |
| M4 (Odin's own) | (0,0)-(0,2); (0,2)-(0.6,1.45); (0,1.4)-(0.6,0.85) |
| M5 | (0.6,1.6)-(0,1.0); (0,1.0)-(0.6,0.4) |
| M6 (a gift for a gift) | (0,0.3)-(0.8,1.7); (0,1.7)-(0.8,0.3) |
| M7 | (0.4,0)-(0.4,2); (0.1,1.3)-(0.7,0.8) |
| M8 (water) | (0,0)-(0,2); (0,2)-(0.6,1.4) |
| M9 (day) | (0,0.4)-(0,1.6); (0.8,0.4)-(0.8,1.6); (0,1.6)-(0.8,0.4); (0,0.4)-(0.8,1.6) |
| M10 | (0.4,0)-(0.4,2); (0.4,1.4)-(0.1,1.0); (0.1,1.0)-(0.4,0.6); (0.4,0.6)-(0.7,1.0); (0.7,1.0)-(0.4,1.4) |
| M11 | (0.4,1.6)-(0,1.0); (0,1.0)-(0.4,0.4); (0.4,0.4)-(0.8,1.0); (0.8,1.0)-(0.4,1.6) |
| M12 | (0,0)-(0,2); (0,2)-(0.35,1.65); (0.35,1.65)-(0.7,2); (0,0)-(0.35,0.35); (0.35,0.35)-(0.7,0) |

| Shared palette | Base | Shade | Light |
|---|---|---|---|
| ODIN SKIN | #d99a44 | #a86e28 | #f2c47a |
| SILVER HAIR | #e6e6e2 | #a9aeb4 (deep #7d848c) | #ffffff |
| CLOAK BLUE / lining | #4a5674 / #8d929d | #2e364c (fold #20263a) / #62677a | #6e7c9c |
| HAT BLUE | #38425c | #232a3d | #56627f (sun-faded #4c587a) |
| OLD GOLD thread | #c9a04a | #8a6a26 (bare thread #6b5222) | #f0d68a |
| SILVER metal | #b9bfc6 | #6f7780 (tarnish #4a5058) | #f2f6fa |
| BRONZE | #a8843e | #6b5222 (verdigris #5f8f7a) | #e6c97a |
| WOLF FUR | #9d9486 | #625b50 (guard hair #403b34) | #d2cab8 |
| LEATHER / eyepatch | #6b4526 / #3a2a20 | #3f2814 / #1f1611 | #9a6c40 / #6b4f3a |
| MAIL | #8f97a0 | #6f7780 (rust #7a5a40) | #a9b1ba |
| ASH WOOD | #c9a46a | #8f6f42 | #e6c890 |
| RAVEN | #15151b | #0b0b10 | sheen blue #3a4f9a, violet #5b3f8a |
| BARK | #5b4a3c | furrow #2e241d | ridge #8a7560, far #6f8f9a |
| MOSS / hanging moss | #6f9140 / #9aa83e | #3f5a28 | #a9c456 / #c9cf6a |
| LICHEN | #b9c7a6 (1 in 4 ochre #c9a93a) | rim #8fa088 | #dfe8cf |
| WET STONE | #7b8284 | #4a5357 | #a9b3b2, wet glint #d9eef0 |
| HEAD STONE | #8a8f78 | #5a614f | #b3b79c |
| WATER | #2f9fc6 | deep #1a6f9a | #7fdcec, glint #ffd86a, hot #fff3c4 |
| RUNE GLOW | #f2cf6a | cut #3a2c1c | #fff1b8 |
| DRY LEAF (5) | #d9952e #e6b23c #b86f26 #8a4f22 #c9c04a | vein 25 % darker | |

| # | Look | Kind / costume | Builder file |
|---|---|---|---|
| A | Odin + spear | costume `odin` on `characters/norse-myth/odin.json`; kind `odinspear` | `engine/page/costumes-odin.js`, `engine/page/props-norse-spear.js` |
| B | The two ravens | `norseraven` | `engine/page/props-norse-raven.js` |
| C | Guardian head | `norsehead` | `engine/page/props-norse-head.js` |
| D1 | Root cave | `norsecave` | `engine/page/props-norse-cave.js` |
| D2 | Well, water, well floor + Odin's eye | `norsewell`, `norsefloor` | `engine/page/props-norse-well.js` |
| E1 | World tree, ground, sky | `norsetree` | `engine/page/props-norse-tree.js` |
| E2 | Wind things: leaves, leaf pile, rope, rune staves | `norseleaves`, `norsepile`, `norserope`, `norsestaves` | `engine/page/props-norse-wind.js` |
| F1 | Cup, crumpled sheet, test sheet, plucked eye, sip light | `norsecup`, `norsesheet`, `norsetest`, `norsebud`, `norsesip` | `engine/page/props-norse-items.js` |
| F2 | Chip's potato eyes, bandage, gold eyes, flush | costume key `buds` on `characters/norse-myth/chip-buds.json` | `engine/page/costumes-norse-chip.js` |
| F3 | Classroom dressing | `norseclass`, `norsedesk` | `engine/page/props-norse-class.js` |

## A. ODIN (costume `odin`, file `characters/norse-myth/odin.json`; concept sheet, panels 01, 02, 07, 11-13, 21, 22)

A NEW character. Nothing of `characters/potatobrawl/allfather.json` or its costume is used (that one is 1.04 tall, red
cape, dark armour, a sphere raven). Body block: 1.39 x 0.66 x 0.60, taper 0.11 (a narrower crown), lump 0.035, seed
83; standing 1.53. Skin ODIN SKIN with 12 specks #b87a30. Legs and boots #6f4b2a. Hands: his own skin, 3 fingers and a
thumb, glove size 1.35, 2 knuckle lines a finger. Sprout: dry (below). Voice tag `odin`. He never sits.
Heights are body-local (y 0 = the base of the 1.39 body; world = + 0.14). Target face points: eye line y 1.00, brows
1.07, moustache root 0.90, mouth 0.86, eye centre x -0.105, patch centre x +0.105: the builder measures them on the rig
and shifts every face part by the difference.
FILMING RULE: his eye AND his patch are in every shot of his face: never more than 50 degrees off front (panel 07, his
back, is the one exception). Brow and eye beats from eye height or below (the brim).

| Piece | Size, where | Detail and colour |
|---|---|---|
| Eye (HIS RIGHT, the rig's) | white 0.093 across (face size 0.58), held at lid 0.28 | iris storm-grey #7d8a99, ring #4a5563, 10 pale flecks #a9b6c4, pupil 0.022, catch-light 0.011 upper left; a heavy upper lid fold, 2 bag lines under it, 4 crow's feet 0.02-0.035 at the outer corner |
| Left eye | shut for the whole film (lid 1) under the patch | nothing of it ever shows at any expression (wide and shocked included) |
| Skin marks | forehead, cheeks | 3 forehead lines 0.12-0.18 (half under the brim), 2 short frown lines, a cheek fold 0.05 each side running into the moustache; ONE old pale scar #f0c890, 0.07 long with 3 cross ticks, through the left brow and on under the patch |
| Brows | each 0.11 long, 0.028 thick | SILVER HAIR, 7 hair strokes each, the outer 2 hairs stick 0.015 past the face outline; the patch strap crosses the left one |
| Eyepatch | a rounded shield, point down, 0.135 wide x 0.125 high, domed 0.012; covers the left eye with 0.015 to spare | eyepatch leather; rolled edge with 22 stitches #8a6a4a at 0.012 pitch; 5 scratch lines; edge rubbed to #6b4f3a; 2 rivets at the strap ends |
| Knot stud | centre of the patch, r 0.016, proud 0.005 | SILVER: three interlaced arcs (a 3-loop knot) in relief, a rim of 12 bead dots, tarnish in the cuts |
| Straps | 2 straps 0.016 wide | A: from the patch's upper inner corner up across the forehead at 28 degrees to the brim at x -0.10. B: from the outer corner back under the hair, a bronze buckle 0.014 at the temple |
| Hair | 16 wavy locks: 5 back, 4 each side, 3 thin ones in front of the ears; 0.30-0.42 long, 0.04-0.07 wide, to the shoulders, lying on the fur at the back down to y 0.74 | SILVER HAIR, 4-6 strand lines a lock, ends curl out 0.02; 3 darker strands #7d848c |
| Moustache | 2 halves, each 0.15 long, 0.05 thick at the root to 0.015, hanging 0.03 below the mouth corners, tips curling out | SILVER HAIR, 6 strand lines each; a gap of 0.03 under the root so an open mouth shows (inside #4a1c14, lower lip ODIN SKIN shade) |
| Centre beard | root 0.30 wide along the jaw at y 0.84, 0.42 long (tip y 0.42), 0.10 thick at the top | 9 wavy locks, 28 strand lines, the tip a soft point curled to his left |
| Braids, 2 | at x -0.14 and +0.14, in front of the beard's sides, from y 0.80 to 0.34, 0.055 thick to 0.04 | three-strand plaits, 13 crossings each drawn as V shapes; below the last ring a tuft 0.07 long flaring to 0.05, 8 strands |
| Beard rings, 4 | on each braid at 55 % (0.030 high) and 86 % down (0.035 high) | SILVER: 2 raised rims, between them an engraved 2-strand twist of 10 crossings; rubbed bright on the front |
| Hat brim | an oval: front z +0.33, sides x 0.33, back z -0.35 from the body axis; root line y 1.14; 0.008 thick, rolled edge 0.012 | HAT BLUE felt, short hatch strokes. 5 waves of 0.02-0.03. Lifted 8 degrees over his eye, drooping 14 over the patch and 10 at the back. Edge: 9 nicks 0.01-0.03 deep, a brown stain band #5a4630 0.015 wide on 40 % of it. 2 holes: one r 0.018 on his right at 60 % out, one slit 0.05 at the back left. 1 sewn patch 0.05 x 0.04 #2c3449 with 10 stitches on the left |
| Hat crown | base radii 0.24 x 0.21 at the brim line, a soft cone to y 1.56 (the highest felt), the top third folded back and to HIS RIGHT, blunt tip r 0.03 at (-0.13, 1.48, -0.10) | 4 crease folds at the bend, a dent at the front, sun-faded on top, 1 ragged hole 0.03 x 0.02 at the front right |
| Hat band | a 3-strand braided cord, 0.022 thick, 2 turns round the crown's base | #a87f4a, shade #6e5230; 38 crossings a turn; a knot at the back left with 2 frayed ends of 0.06 |
| Dry sprout | through a ragged hole r 0.015 in the crown's front left slope at (+0.06, 1.49, +0.05); stem 0.07, bent, 0.008 thick; 2 leaves 0.11 x 0.05 and 0.07 x 0.035, tip at y 1.66 | the rig's sprout, so it still shows mood. Stem #7a4a22; leaves #c98a3a, shade #9a6226, light #e6b25c; a midrib and 5 side veins a side; edges curled 20 degrees; the big leaf has 2 bite nicks and 1 hole r 0.003 |
| Wolf-fur mantle | over both shoulders: a flat top shelf at y 0.83 from x 0.24 to 0.40 each side (the ravens' perch), nape at 0.90; front ends down to 0.62; at the back a deep V to 0.48 | WOLF FUR. 78 pointed locks in 3 rows (22, 26, 30), each 0.05-0.11 long, 0.025-0.045 wide, 3-4 strand lines, tips pale, lean hashed 12 degrees; 14 guard-hair locks |
| Wolf masks, 2 | the pelt's two front ends, lying on the chest outside each brooch, 0.13 long x 0.10 wide, snout down and inward | flat, asleep: 2 ears 0.035, shut eye slits, nose leather 0.018 #2a2622, paler muzzle #b9b1a2 |
| Brooches, 2 | discs r 0.045 at (-0.19 and +0.19, 0.66) | BRONZE: raised rim, a 3-loop knot in relief, a boss r 0.008, the pin; verdigris in 1 recess of 5 |
| Chains, 2 | swags between the brooches, 0.42 and 0.50 long, sag 0.04 and 0.09, under the beard | OLD GOLD links 0.012 x 0.008, 36 + 42 = 78, every second turned 90; none merged into a bar |
| Mail | chest V from y 0.74 to the belt between the cloak edges; skirt y 0.365 to 0.20 ending in 9 points 0.03 deep | MAIL: each ring an arc r 0.0055 drawn once in 4-in-1 rows at 0.008 pitch (about 2,400), 3 tones by hash, a light tick upper left; 4 % missing, 14 rust rings |
| Under-tunic | y 0.20 to 0.10, hem band to 0.06 | LEATHER, 12 pleats; hem #5a2f26 |
| Belt | 0.07 high, centre y 0.40 | LEATHER; 2 stitch rows, 60 stitches each; 7 BRONZE studs r 0.007 each side of the buckle at 0.045 pitch; the free end hangs 0.14 at his left with a bronze tip |
| Buckle | plate 0.11 x 0.085, frame 0.008 | BRONZE: a square knot of 2 interlaced loops (8 crossings), 4 corner dots, rubbed bright on the high lines |
| Pouch, knife | pouch 0.10 x 0.11 x 0.04 on his right hip; a sheath 0.16 on his left hip, 15 degrees off level | pouch: flap, horn toggle, 12 stitches. Sheath: handle bound with 6 turns of cord, a bronze cap; the blade is never drawn |
| Cloak | from under the mantle to y -0.07 (world 0.07) at the sides and back; front open: edges at x 0.15 at the brooches to 0.20 at the hem, front corners cut up to y +0.05 | CLOAK BLUE wool, fine weave hatching; 11 deep folds (5 back, 3 each side); 2 small holes, 1 darned patch with 9 stitches; a mud band #3a3a36 0.06 high and 9 splashes at the back hem |
| Knotwork trim | a band 0.055 wide, 0.02 in from both front edges and the whole hem | OLD GOLD: a 2-strand interlace, one crossing every 0.045, each drawn over and under (46 on the hem, 17 on each front edge = 80), between 2 lines of 0.004. A 3-loop knot 0.22 x 0.20 at the centre back hem, one of 0.12 at each front corner. Thread worn to #6b5222 on 10 %: the back hem and the right front edge |
| Shoulder flaps | the cloak's lining thrown over each upper arm, 0.26 long | lining grey, 5 folds; follows the upper arm 60 % |
| Sleeves | 0.11 wide at the shoulder to 0.085; end 0.17 before the hand's centre (left arm: 0.31) | #3b4560, 16 fold lines |
| Bracers | right 0.10 long, LEFT 0.24 long (a falconer's); both end 0.07 before the hand's centre | LEATHER, 3 straps with bronze studs. The LEFT one is the ravens' landing place: 9 claw scratches, pale and criss-crossed |
| Boots | 0.20 x 0.13 x 0.11, round toe cap | #6f4b2a, shade #432b16, sole #2e1d0f; one strap with a bronze buckle, 5 crease lines, mud on the welt |

What moves:

| Key | What |
|---|---|
| moustache | follows the rig's mouth: each half tilts 14 degrees x (curve +- smirk), up to +18 / -12; lifts 4 degrees and the beard root drops 0.012 with talk |
| `odin.cheek` (0), `odin.cheekR`, `odin.cheekL` | the cheek under the eye rises up to 0.018 and pushes the lower lid up 0.2; crow's feet deepen; blush #e8875a up to 0.35 |
| `odin.glint` (0) | the catch-light doubles and one thin light arc crosses the iris in 6 frames (1.6 s); no star, no sparkle |
| hair, beard, braids | hair lags 0.15 s and 5 degrees; centre beard 0.12 s; braids swing as pendulums 0.16 s late up to 14 degrees, rings catch the light, never into the spear arm |
| hat | the brim flexes 2 degrees on a head snap; the dry leaves do not sway softly: they rattle 3 degrees at 7 Hz for 0.3 s after each head move |
| fur, chains | locks sway 3 degrees 0.12 s late; chains swing 4 degrees |
| cloak | below the belt it hangs plumb: it turns back 80 % of the body's pitch and roll about the belt line, 0.15 s late. No hem under the floor at a 22 degree lean (proof on the bench) |
| `odin.wind` (0), `odin.windDir` (degrees) | the tree scenes: hem streams 25 degrees downwind, hair and braids 12, the brim flutters 3 degrees at 5 Hz, the dry leaves rattle without stopping |

Expressions (one eye, brows, cheeks and moustache carry them; the mouth shows only when open):

| Look | Rig | Costume |
|---|---|---|
| Stern (default) | brow tilt -0.35, lid 0.28 | moustache ends 12 degrees down, cheek 0 |
| Amused (panel 11; before 65.5 s never more than this) | lid 0.40, right brow up 0.01, smirk 0.4 | his right moustache half +6 degrees only, `cheekR` 0.5, 3 crow's feet |
| Warm proud smile (panel 22, 65.5 s, once in the film) | the eye shuts to an upward arc, brows tilt +0.12 and rise 0.012; ease 0.5 s | both halves +18, `cheek` 1 with the blush, 4 crow's feet, beard root up 0.01, head rolls 6 degrees to his right |
| Leaning in (panel 02, 1.6 s) | the body pitches 22 degrees forward, eye on Chip, lid 0.35, mouth open 0.25 on the line | braids and beard swing 0.10 forward and settle in 0.6 s; cloak plumb; ravens ride and lean 10 degrees back; `glint` |

Gestures: (1) SPEAR AT REST: right hand on the shaft at spear y 1.10, butt on the floor 0.08 in front of the right
boot, hand at world y 1.0 beside the body, never in front of the face. (2) POINT UP (16.5 s): right arm straight, the
spear 55 degrees above level, hand at spear y 0.95, the shaft 0.25 to the right of his head. (3) RAVEN ARM (30.0 s):
left arm level, 20 degrees forward of his side, bracer up, held still while birds are on it. (4) The concept's flat
whisper hand is the left hand only, optional.
Perch points the costume gives: shoulders (-0.34 and +0.34, 0.83, -0.01) body-local; arm: 0.05 and 0.19 from the
left bracer's wrist end (both on leather, the two birds shoulder to shoulder). A raven's crown stays 0.01-0.03 under
the brim's edge.

**SPEAR** (kind `odinspear`; origin = the butt's tip, pointing up +y; 2.10 long):

| Part | y | Detail and colour |
|---|---|---|
| Butt cap | 0..0.05 | an iron cone #5a5f66, blunt, scuffed, dried mud |
| Shaft | 0.05..1.72, 0.034 thick to 0.028 | ASH WOOD: 14 long wobbled grain lines, 3 eye knots r 0.006 at y 0.52, 1.08, 1.47; 5 nicks; darker and glossier #a8834e where hands have rubbed it: y 0.95-1.25 and 0.55-0.70 |
| Silver bands, 5 | at y 0.10 (0.030 high), 0.50, 0.92, 1.30 (0.035), 1.62 (0.045) | SILVER, 2 rims each; between them 3 marks 120 degrees apart, 0.02 tall, cut 1.2 mm, filled #3a3f46. In order: M4 M6 M8 / M1 M9 M3 / M10 M5 M12 / M2 M7 M11 / M4 M6 M9 (15 marks) |
| Socket | 1.70..1.84, 0.040 to 0.026 | SILVER: a twist band of 8 crossings at its base, 2 rivet heads, a collar ring on top |
| Blade | 1.84..2.10, leaf-shaped, 0.085 wide at 40 % up, 0.009 thick at the rib | steel #c9d0d6, shade #7f8890, both bevels #ffffff; a raised midrib; 18 faint herringbone chevrons along the core at 5 % contrast (pattern-welded); 2 marks a face (M4 and M8, M6 and M9) with a chevron pair between; 2 tiny edge nicks |

Params: `glow` (0) fills every cut mark with RUNE GLOW; `glint` (0) one highlight sweep up the blade.

## B. THE TWO RAVENS (kind `norseraven`; concept sheet bottom, panels 01, 02, 11, 12, 22)

Engine check: `props-raven.js` holds only a feather, an armchair and a photo. `raven` (props-robbed.js) and the
fighter's costume raven (costumes-cast.js) are spheres with toy eyes: NOT reused (animals look real). `crow` (props-sh-items.js) is the right method (one lofted skin, a feather card per
index, hinged lower beak) but it is a carrion crow with 4 params, no wingbeat, no landing, no lean, no perch grip. So
`norseraven` is NEW, built by the crow's method at raven proportions. The same bird sits on Odin (riding his body as
part of the costume, perch points in A) and flies as a prop; swaps happen at a cut or behind open wings.

Origin: between the feet, facing +z. Real proportions, small real eyes, one continuous skin.

| Part | Size | Detail and colour |
|---|---|---|
| Whole | 0.50 beak tip to tail tip; 0.26 to the crown when perched; body 0.125 wide; span 1.00 | RAVEN |
| Body | one skin, breast to rump, 0.24 x 0.125 x 0.13, held 40 degrees from level when perched | 150 contour feather marks in 11 rows, 0.012-0.022, 3 tones (#15151b #1d1d28 #0f0f14), a sheen arc on 40 % of them; 14 loose thigh feathers |
| Head | skull 0.062 x 0.050, a flat crown running into the beak (no steep forehead) | 60 crown feather marks. Eye r 0.0055 at 60 % back, #2a1a12, one catch-light 0.002, a lid ring #2a2a33; a pale third lid #b9c2c9 crosses in 2 frames every 2.5-4 s (hashed) |
| Beak | 0.068 long, 0.026 deep and 0.020 wide at the base; the upper half curves down to a 0.003 hook | #1c1c22, a matte light #5a5f6c along the ridge, tip #3a3a42; a nostril groove; 14 bristles over its first 40 %; the lower half opens 28 degrees; inside #8a3a40, tongue #b0646a (the concept's open beak) |
| Throat hackles | 16 pointed feathers 0.022-0.038 in 3 rows | flat at rest; `ruff` lifts them up to 35 degrees |
| Wing, each 60 feathers | arm 0.16 + hand 0.14; folded tips cross over the rump 0.03 short of the tail tip | 10 primaries 0.16-0.27 (the outer 5 with narrowed finger tips, slots 55 % deep when spread), 11 secondaries 0.13-0.15, 3 tertials, coverts 9 + 11 + 13, 3 thumb feathers. Each: a shaft line, 8-12 barb ticks, a sheen stripe on the outer web, 6 % with a split |
| Tail | 12 feathers, a wedge: centre pair 0.20, outer pair 0.145 | violet sheen stripes; fans 0..70 degrees |
| Legs, feet | 0.055 of leg showing, 0.008 thick, 7 scale rings; toes 0.036, 0.042, 0.036 forward, 0.030 back; claws 0.012 | #2a2930; the toes WRAP the perch |

| Param | What |
|---|---|
| `wings` (0) | 0 folded .. 1 spread |
| `flap` (count) | one wingbeat a whole number: the downstroke takes 55 %, tips travel +50 to -35 degrees, primaries bend up 12 degrees going down and open like fingers coming up; the body bobs 0.015 the other way. Director: 3.5 a second cruising, 5 at take-off and braking |
| `glide` (0) | wings held out, 5 degrees up, finger tips flexing 4 degrees |
| `brake` (0) | the landing: body 55 degrees up, wings cupped forward, tail fanned 70 and down 30, legs forward, toes spread. Director: 0 -> 1 in 0.25 s, 2 small settling beats, then `wings` 1 -> 0 in 0.35 s |
| `grip` (1), spec `perchR` (0.03) | toes curled round a perch of that radius (fur shelf 0.05, bracer 0.03) |
| `lean` -1..1 (0) | the whisper: the body pitches 35 degrees and turns 40 toward that side, the neck stretches 0.03, the beak tip ends 0.03 from Odin's ear |
| `headYaw` -1..1, `headPitch` -1..1, `headRoll` -1..1 | 100, 35 and 30 degrees. A raven turns its head in 2 frames and holds; `headRoll` is the tilt of panel 22. "Looks sideways at Chip" = one eye turned to him |
| `talk` (0) | the beak opens up to 28 degrees, hackles lift, the tail dips 6 degrees a syllable (35.0, 37.0 s) |
| `ruff` (0), `shake` (0), `hop` (0), `blink` (0) | hackles; a 0.4 s shake (body feathers 12 % fuller, then settle); a 0.05 hop; the third lid |
| spec `who` 1 or 2 | below |

Told apart without names. `who` 1 (on HIS RIGHT shoulder, the spear side): sleek, x 0.96, blue sheen, a notch in the
6th secondary of its left wing. `who` 2 (on HIS LEFT, the blind side; at rest it keeps its head turned outward,
watching that side for him): x 1.04, violet sheen, 3 crown feathers standing 0.008, a pale scar line 0.012 on the right
of the beak, the 4th tail feather bent 10 degrees, hackles 15 % longer.
Always alive when perched: breath 0.002 at 0.8 Hz; a head snap every 1.4-3.1 s (hashed) to one of 5 directions; a tail
flick of 8 degrees about every 5 s. Whispering reads at a frame 1.2 m wide or less (the beak 61 px).

## C. THE GUARDIAN HEAD (kind `norsehead`; concept sheet bottom right, panels 05, 13, 14, 19)

A prop, one sculpted stone skin. Only a head: under the water it is a rounded boulder, nothing else. Origin: the
centre of its water-line plane at full rise (the chin line), facing +z. It stands in the well at (0, 0.22, -0.20):
0.20 back from the well's centre so the beard has 0.55 of open water in front.

| Part | Size, where (head-local) | Detail and colour |
|---|---|---|
| Whole | 1.90 wide, 1.60 deep, crown at y 1.35 (world 1.57), ferns to 1.58; a low wide dome | as wide as the well (inner 2.30) |
| Stone | the whole skin | HEAD STONE; darker and wet #5a614f with glints on the lowest 0.30; 7 forked cracks 0.2-0.6; 34 pits of 0.02-0.06 (a potato's eyes) with a dark centre and a pale lower lip; 12 lichen discs; 60 speckles |
| Brow ridges | at y 0.80, each 0.55 long, 0.12 thick | stone under moss: 9 tufts of hanging moss a brow, 0.05-0.11 |
| Eyes | (-0.42 and +0.42, 0.62); openings 0.34 x 0.15, sockets cut 0.06 deep | PALE GLOW: iris 0.15 across, centre #9fe3f2 to rim #5fb9d6, 12 radial flecks, pupil 0.045 #17434f; a halo 0.10 #bfeefa; no catch-light (they are the light). Upper lids are stone slabs with a chipped edge |
| Nose | bridge from y 0.70 to the tip at 0.36, 0.34 wide at the nostrils | a broad flat stone bulge, 2 nostril shadows, moss in the creases |
| Moustache | 2 halves from under the nose, each 0.75 long, curving out and down into the water | silver-green weed #a9b89a, shade #6f8068, light #d9e2c4; 9 strands each |
| Mouth | a stone slit 0.50 wide at y 0.20, under the moustache | shut: one dark line turned down at the ends |
| Beard | 34 strands from the jaw, 0.6-1.4 long: 0.30 shows above the water, the rest FLOATS on it, fanned over 170 degrees to the front | silver-green at the root to weed green #6f9a68 at the tips, small leaflets on the last 30 %; every tip drifts 0.04 at 0.3 Hz (phases hashed) |
| Moss cap | the top 30 %, an uneven edge with 9 tongues down the forehead and temples; 14 cushions 0.08-0.25 on cheeks and sides | MOSS |
| Ferns | 11 crowns, 62 fronds 0.18-0.34, each with 10-14 pairs of leaflets drawn | #6fa83f, #4f8a3a, #8fbf4f, 4 fronds brown; on the crown and the back rim, 2 at the temples, none on the face |
| Hanging strands | 16 thin roots 0.3-0.9 from the temples and the cap's edge, 4-9 tiny leaves each | hanging moss colours; they hang plumb |
| Small life | 1 snail (shell 0.03, 2.5 turns) on the left temple; 2 brown mushrooms 0.02-0.03 by the right temple; 3 white flowers 0.012 in the moss | each placed by hand |

| Param | What |
|---|---|
| `rise` (0) | 0 = hidden, the fern tips 0.05 under the water (1.63 lower); 1 = the chin at the water line. The ferns break the surface first. Eyes stay shut below 0.7 |
| `shed` (0) | water coming off after the rise: 14 runnels down the dome, a sheet off each brow, drips from the moustache. Director: 1 at the surfacing, 0 after 2.5 s |
| `lids` (0.35), `glow` (0.6) | upper lids 0 open .. 1 shut; eye light, halo at 1 |
| `lookX`, `lookY` -1..1 | pupils, 35 degrees |
| `turn` -1..1 (0) | 120 degrees each way about the upright axis. The eyes lead by 0.15 s; the floating beard follows 60 % and 0.4 s late and wraps; hanging strands swing; ferns lean the other way |
| `speak` (0) | the moustache halves part and lift 5 degrees, the mouth slit opens 0.07, dark inside #2a3028. (Each syllable also sends one ring over the well: D2 `rings`) |
| `squint` (0) | 55.0 s: upper lids to 0.7, lower lids up 0.3, brows knit (inner ends down 10 degrees and 0.04 closer), pupils cross toward one point (spec `at` [x, y, z]) |
| `nod` -1..1, `lean` (0) | tips 8 degrees; slides up to 0.25 toward `at`. One fern trembles while it squints |
| always | bobs 0.015 at 0.25 Hz; 3 drip points on the moss let a drop fall every 1.3 s |

An eye is as big as Chip's whole face: the squint at the potato eye reads at a frame 2.2 m wide or less.

## D1. ROOT CAVE (kind `norsecave`; panels 01-05, 11-22)

Origin: the centre of the well on the cave floor (y 0). A full 360 degree set. The hero side is -z: the well, the
back roots, the GAP with the trunk and sky. The +z side closes with root R5 and the way in. Single-sided walls (a
camera may stand outside). Only the floor takes shadows.

| Thing | Where (x, y, z) | Size |
|---|---|---|
| Floor | y 0, about x -7..+7.5, z -9..+9 | dead flat inside r 4.5; nothing higher than 0.005 there |
| WELL (D2) | (0, 0, 0) | rim outer r 1.39, plinth r 1.44, cap y 0.30, water y 0.22 |
| Sip stone | on the rim at 100 degrees round from +z toward -x | the cap worn down to y 0.235, 0.34 wide |
| HEAD (C) | (0, 0.22, -0.20) | crown at world 1.57 |
| Giant root R1 | centre line (+3.0, 13.5, -20) -> (0.5, 11.2, -13) -> (-0.8, 10.2, -7.5) -> (0.8, 9.8, -2) -> (3.8, 8.6, 2.6) -> (6.5, 5.0, 6.2) -> (8.2, -1.5, 8.8) | 5.6 thick, 4.4 where it enters the ground; its underside is the ceiling, about 7.1 over the well |
| Root R2 (left wall) | (-8.5, 9, -8) -> (-7.2, 5.5, -3.5) -> (-6.4, 2.2, 0.5) -> (-6.8, -1, 4.5) | 2.6 thick |
| Root R3 (the gap's sill) | (-6, 0.2, -7.5) -> (-2, 3.2, -8.6) -> (2.5, 3.6, -8.4) -> (6.5, 0.4, -6.5) | 1.8 thick |
| Root R4 (right back) | (5.5, 9, -7) -> (6.2, 4.5, -3) -> (6.8, 0, -0.5) | 1.5 thick |
| Root R5 (front arch) | (-5.5, -0.5, 6.5) -> (-3, 4.2, 8.2) -> (1.5, 4.8, 8.6) -> (4.5, 5.5, 7.5) | 2.0 thick |
| Way in | under R5 at (-0.8, 0, 8.5) | 2.6 wide x 3.4 high, 5 rough steps up into dimness, a faint daylight glow |
| THE GAP | between R1 (top), R2, R4 and R3 (sill): x -3.2..+3.8, y 4.2..7.9 at z -8.5 | 7.0 x 3.7, an uneven outline; from a camera at (0, 1.2, 6) it sits 12-25 degrees above level: the top of a tall frame |
| Gap view | a trunk face 15 wide at z -22.5, centred x +6, y 4..45; sky to its left; R1 running back to it | right 60 % of the gap is trunk, left 40 % windy sky |
| Earth walls | between the roots | closed all round |
| Marks (suggested) | Chip (-0.70, 0, +2.25) facing +x; Odin (+0.90, 0, +2.35) facing 35 degrees off +z toward Chip; Spud (-1.65, 0, +2.60); Chip at the sip stone (-1.70, 0, -0.30); Spud beside him (-2.55, 0, +0.55) | bodies 0.35 or more off the plinth except at the sip stone |

Root bark (all five; panels 01-05 backgrounds):

| Layer | What | Count |
|---|---|---|
| Rope twist | R1 is 3 strands of 3.2 twisted once every 9 m, the furrows between them 0.35 deep in furrow colour; R2-R5 2 strands each | |
| Ridges | bark ridges 0.12-0.30 wide following the twist, each drawn once, cross cracks every 0.4-1.1 m; ridge light on the side toward the well, far colour beyond 9 m | about 40 round R1 |
| Burls, stubs | 5 burls 0.5-0.9 with spiral grain on R1; 3 snapped side roots 0.3-0.5 thick showing pale wood #c9a46a with 6-9 rings | 5 + 3 |
| Moss | cushions 0.15-1.2 on upper faces, ledges and in furrows, a paler top, a stippled edge; hanging moss 0.2-0.7 under the lower edges | 180 cushions, 60 hanging |
| Lichen, fungi | discs 0.02-0.12; bracket fungi 0.10-0.35, ochre and cream with 3-5 bands, on R2 and R4 | 90 discs, 14 brackets |
| Ferns | crowns with fronds 0.3-0.7 on ledges and at the feet of roots; 12 on the gap's sill | 34 crowns |
| Carved runes | marks 0.35-0.55 tall, cut 0.03 deep, a pale healed lip, moss in the lower ends, RUNE GLOW at the `runes` level | 12 marks in 5 groups |

Rune groups: G1 on R2 at (-5.9, 3.0, -1.5): M4 M6. G2 under R1 at (4.6, 3.6, 2.2): M8 M1 M10. G3 on R3 at
(-1.2, 2.6, -8.1): M6 M9. G4 on R4 at (6.0, 2.8, -2.2): M3 M12 M5. G5 on R5 at (1.8, 3.4, 8.2): M2 M7. Two are half
under moss.

- **Hanging root curtains**, 6 (140 strands): each curtain 18-30 thin roots, 0.012-0.04 thick at the top to 0.004,
  1.6-4.3 long, 1-3 forks in the lowest third, hair roots, 1 strand in 4 with hanging moss and a drop at its tip.
  At (x, z): (-3.2, -2.5) 2.2 wide; (2.6, -3.4) 2.0; (-1.0, -5.5) 3.0; (4.4, 1.0) 1.8; (-4.6, 2.2) 2.0; (0.5, 6.4)
  2.4. Lowest tips at y 2.6 or more; none within 1.2 m of Odin's mark (the spear tip reaches 2.9 when he points).
  They sway 2 degrees at 0.2 Hz, phases hashed.
- **Floor**: 46 flagstones 0.5-1.3, uneven polygons, inside r 5.2; joints 0.02-0.05 with moss on 60 % of their
  length and dark water on 15 %; 2-5 hairline cracks or pits a slab; WET STONE with a painted sheen toward the well.
  5 puddles 0.3-0.9 with painted glow streaks (no mirror). Beyond r 5.5: packed earth #2b3334, pebble drifts, 3 roots
  surfacing up to 0.25, 3 slabs heaved 0.03-0.06 by a root under them. 40 dry leaves blown in, in drifts at the walls.
- **Earth walls**: #2b3334 with 120 set stones 0.1-0.6, 300 drawn hair roots, 9 ledges with ferns and moss. Two thin
  trickles on the back wall at x 5.2 and -4.6: 0.2 wide, 2.5-3 tall, pale streak lines #dff2f5 sliding 0.8 m/s, a
  small mist at the foot.
- **Gap view**: the trunk face built with E1's bark recipe at 40 % of its counts, one tier of 6 bracket fungi, moss on
  its left; sky #6fa9dc to #dcecf5 with 4 wind-torn clouds crossing in 5 s each; 30 leaves streaming left to right at
  any time; 12 ferns and hanging moss fringe the gap.
- **Light shafts**, 5: from the gap down toward +z to the floor round the well, 0.5-1.1 wide, #ffe6a8 at 0.18, 90
  motes in them; every 4-6 s a cloud shadow shrinks them 30 % for 1 s (the wind outside).
- **Mist**: 14 soft cards 2-4 m wide, 0.25-0.6 high, #cfe6ea at 0.22, drifting 0.06 m/s toward +x, thicker at the
  walls; none above y 0.35 within 2.2 m of the marks (faces clear). A veil at 0.3 behind z -6 turns the far roots blue.
- **Well light on the cave**: a moving net of light lines (#8fe0f0 and #ffe9a8, 3 layers, 0.15 m/s) at 0.25 on every
  surface facing the well, gone by 7 m: root undersides, curtains, rim. Never on the cast (the light plan lights them).
- **Life**: 4 drip lines from root tips into puddles, a ring every 1.1-2.3 s; 6 dry leaves in the air at any time.

| Param | What |
|---|---|
| `runes` (0.35) | glow of the 12 carved marks, pulsing 8 % at 0.15 Hz |
| `shafts` (1), `mist` (1) | the shafts and their motes; the mist |
| `gust` (0) | wind through the gap: curtains sway 5 degrees, 12 more leaves blow in, mist drifts 3 x as fast |
| `dim` (0) | 43.0 s: baked ambient x (1 - 0.3 dim), shafts x (1 - 0.6 dim), the light net loses its gold lines |
| `gold` (0) | 57.0 s: the light net turns all gold #ffd45a at 0.4, runes to 1, shafts 20 % warmer |

## D2. WELL, WATER, WELL FLOOR (kinds `norsewell`, `norsefloor`; panels 01, 03, 05, 06, 13, 14, 18-20)

**Well** (`norsewell`). Origin: its centre on the cave floor. Solid: the rim only.

| Part | Size | Detail and colour |
|---|---|---|
| Plinth | y 0..0.06, r 1.44 | rough WET STONE, moss at its foot |
| Knot band | the outer face, y 0.06..0.26, r 1.39: 16 blocks of 0.546, joints 0.01 | 12 blocks each carry a 2-strand interlace of 6 crossings, drawn over and under, strands 0.035 wide with a centre groove, relief 0.012, the ground darker and mossy. Blocks 1, 5, 9, 13: a 3-loop knot roundel 0.16 across. 72 + 12 crossings. No two blocks worn alike |
| Cap | y 0.26..0.30, inner r 1.15, 0.03 over the band, 0.02 over the water: 14 slabs of 20-32 degrees | worn smooth; 2 shallow hollows where hands have leaned (toward +z); 2 cracked slabs; 1 chipped corner, the chip lying on the floor; moss on 35 % (the back half and the joints); 9 small ferns in back joints; 20 lichen discs; a dark wet band 0.05 along the inner edge |
| Sip stone | the cap slab 100 degrees round toward -x, worn down to y 0.235, 0.34 wide | a smooth scoop; the water laps 0.18 into it (to r 1.33); ONE mark M6, 0.07 tall, worn nearly flat. Here the water is 0.40 from the centre of someone standing at the plinth: where Chip dips his cup |
| Inner wall | one course shows above the water | dark, wet, glints |
| Water | y 0.22, r 1.15; opaque from above | WATER: deep in the centre, bright patches #7fdcec moving; 5 trains of ripple lines #c9f2f7 from 3 drip points, each line drawn; 60 gold glints of 0.02-0.06 along the inner rim and 40 scattered, each swapping 3 drawn shapes 6 x a second |
| Glow | above the water | an upward glow r 1.2, 1.0 high, at 0.12; 40 gold motes of 0.01 rising 0.5 and shrinking away |
| Lily pads | 7, r 0.03-0.06, at the back edge | #6f9a4a with a notch; they drift, and are pushed to the rim when the head rises |

| Param | What |
|---|---|
| `glow` (1) | water light and halo (the light plan's levels) |
| `gold` (0) | hue from blue-gold to full gold #ffd45a |
| `glints` (1) | the 100 gold glints; 0 hides them: cold water (43.0 s) |
| `ripple` (0.3) | height of the ambient ripples |
| `bulge` (0) | 8.5 s: a smooth dome of water, r 0.95, up to 0.28 high, the glints sliding off it |
| `splash` (0) | the dome breaks: a crown of 22 cel tongues 0.3-0.6 high at r 0.9, 60 drops falling back, water lapping 0.01 over the cap's inner edge |
| `rings` (count) | one ring train from the centre a whole number, reaching the rim in 0.8 s with 6 small drops at the wall: one for every syllable of the head |
| `swirl` -1..1 (0) | the wake of the head's turn: spiral lines, the pads carried round |
| spec `dipAt` [x, z], `dip` (0) | 41.0 s: a dimple and one ring train where the cup goes in |
| spec `payAt` [x, z], `pay` (0) | 56.6 s: a plop ring and a gold bloom r 0.3 under the surface for 0.5 s where the potato eye sinks |

**Well floor** (`norsefloor`; panel 06). Its own small set, 300 m or more from the cave, with its own light. Origin:
the centre of the pebble floor. The camera is under water near the floor, looking up at a slant: bottom of a tall
frame = pebbles and the eye, top = the bright surface with Chip looking down.

| Part | Size | Detail and colour |
|---|---|---|
| Shaft | r 1.15, floor y 0, surface y 2.40 | 12 dry-stone courses, weed in the joints, glints |
| Pebbles | 260, 0.03-0.14, smooth river stones, piled uneven, deepest at the wall | blue-grey #5f7f8f, teal #3f8f8a, slate #3a4a5a, 1 in 9 ochre. 38 GLOW gold from inside (core #ffd45a, rim #ff9f2a, halo 0.05) and 20 pale cyan #9fe6f0 |
| ODIN'S EYE | at (0.25, 0.09, 0.15), a smooth glossy orb r 0.055, half sunk in a nest of pebbles, looking up | ivory #f3efe2, shade #cfc9b8; his iris exactly (#7d8a99, ring #4a5563, 14 flecks), pupil #14181d, one catch-light, a moving light line across it. No veins, no red, nothing attached |
| Stone lids | 2 flat stones round the orb: an upper one curved over its top third, a lower one under it | WET STONE; 7 short weed blades along the upper stone's edge like lashes |
| Weed | 12 ribbon weeds 0.3-0.8 at the wall | #3f8f7a, swaying 10 degrees at 0.4 Hz |
| Water | the volume | near the floor #0f4f6a, middle #1f86a8, under the surface #7fdcec; things fade into it by 3.5 m |
| Light | a moving net of bright lines #dff8fb at 0.5, 0.25 apart, 0.12 m/s, over pebbles, orb and wall; 9 slanting rays from the surface, swaying 3 degrees; 70 drifting motes; a thread of 5 bubbles every 1.6 s | |
| Surface from below | a bright rippling disc at y 2.40 | through it, soft: the cave's ceiling as 4 dark root shapes and one bright gap patch (a painted disc r 6 at y 9.2) |
| Head from below | a dark boulder r 0.95 at the surface, centred (-0.35, -0.2), with 14 beard strands hanging 0.6-1.6, swaying | leaves a crescent of open water 0.55 wide on the +x side |
| Rim and ledge | a dark rim ring at y 2.48 and a floor ring r 1.44..2.6 at y 2.18 | so the REAL Chip stands there and leans 35 degrees over the rim; from the floor he is seen face on at about 55 degrees up |

| Param | What |
|---|---|
| `blink` (0) | the upper stone slides down over the orb and back: 3 frames down, 1 shut, 2 up; 5 silt motes and 3 bubbles rise |
| `lookX`, `lookY` -1..1 | the iris turns up to 30 degrees (at 13 s: up to Chip) |
| `plunge` (0) | the dive: 30 bubbles streaming up past the lens, gone at 1 |
| `headShadow` (1) | the head's underside and beard |
| `peek` (0) | fallback if the real Chip cannot lean: a small dark round head with two leaf tips on the bright disc, no face |

## E1. WORLD TREE, GROUND, SKY (kind `norsetree`; panels 07-10)

Its own outdoor set, 300 m or more from the cave. Origin: the ground under the rope's hang point. The trunk stands
to the RIGHT (+x); the low branch crosses the top of a tall frame from right to left; behind it open sky. The tree is
an ash (the world tree is one): leaves of 7-9 leaflets, bunches of winged seeds.

| Thing | Where (x, y, z) | Size |
|---|---|---|
| Ground | y 0, dead flat inside r 3.2 of the origin except the pile | a hill top: it falls away behind z -4 |
| Trunk | centre (+10.8, y, -3.0) | r 7.2 at y 1, flaring to 9.5 at the ground; near face about x +3.6; built to y 70 |
| Buttress roots, 7 | fanning from the trunk | each 4-9 long, 2.5 high at the trunk to 0, like knuckles. BR2 and BR3 reach toward -x and end at x +1.2: the hollow between them holds the leaf pile |
| Low branch B1 | (4.3, 2.75, -1.0) -> (2.2, 2.50, -0.3) -> (0, 2.36, 0) -> (-2.4, 2.45, 0.2) -> (-4.6, 2.9, 0.1), twigs on to (-6.5, 3.4, 0) | 1.0 thick at the trunk, 0.55 over the origin (underside y 2.085), 0.24 at the end; 11 long |
| Hang point | under B1 at the origin | rope 0.50: Chip's ankle at y 1.585, his face at 1.19, his leaf tips at 0.755 |
| Leaf pile (E2) | centre (0.15, 0, 0.10) | 2.8 x 2.2 x 0.62 high: 0.135 under his leaf tips |
| First limbs | 3, leaving the trunk at y 22, 27, 33 | 2.5-3.5 thick |
| Canopy | from y 30 | 14 leaf masses of 6-12 m with sky between |
| Marks (suggested) | Spud at the pile (-1.75, 0, +0.9). Crane at 16.5 s: Odin (-7.4, 0, +2.8), back three-quarters to the camera; Spud (2.6, 0, 1.6) and Chip (3.2, 0, 1.3) small between two buttresses, 10.3 m beyond him | |

| Layer | What | Count (lowest 12 m, the side the camera sees) |
|---|---|---|
| Rope twist | 9 great strands about 5 wide at the foot, climbing to the right at 18 degrees; furrows 0.4-0.9 deep #241c16 | 9 |
| Ridges | plates 0.15-0.40 wide along the twist, each drawn once, cross cracks; BARK, ridge light on the sun side | about 260 |
| Moss | sleeves on buttress tops and the weather side (-x, -z): 35 % cover to y 6, 10 % above | 70 patches |
| Lichen | discs 0.03-0.2 | 160 |
| Bracket fungi | 3 tiers at y 3.5, 6, 9: 9, 6 and 4 brackets 0.3-0.9 wide, cream on top, ochre bands | 19 |
| Carved runes | old marks 0.5-0.8 tall at y 2.2-9, the bark healed round each as a raised lip 0.04; RUNE GLOW at `runes` | 11 in 4 groups: M4 M8 / M1 M3 M10 / M6 M12 M5 / M2 M7 M9 |
| Far up | bark fades to #8fa3b0 by y 60; 3 cloud wisps cross the trunk at y 35, 48, 62, drifting +x | 3 |

- **B1**: 28 ridges round it, lengthwise; moss on 60 % of its top, 0.04 thick; 14 hanging moss beards 0.10-0.35; 30
  lichen discs; 5 side twigs with 180 leaflets in sprays of 7-9 (yellow-green #b9c04a to gold #e0b030) and 6 bunches
  of winged seeds. Over the origin an OLD ROPE GROOVE worn into the bark, 0.06 wide, polished pale: something hung
  here for nine nights long ago. Chip's rope sits in it.
- **Canopy**: each mass 60-90 drawn leaf clusters, gold-green, swaying 2 degrees at 0.3 Hz; sky shows through.
- **Ground**: short grass and moss #7f9a4a / #5f7f3a; 220 tufts of long grass bent 25 degrees toward +x with a wave
  crossing every 3 s; 30 stones; 20 fallen twigs; 12 dry seed heads; roots surfacing only beyond r 3.2.
- **Far land** (below the hill, behind z -4): 3 ridges #6f8fb0, #8fa9c2, #b6c9d8 with mist between; a far forest of 40
  drawn crowns #b9a94a and #7f9a4a.
- **Sky**: zenith #4f8fd0 to horizon #cfe6f2; the sun upper left behind thin cloud (rim #fff0c8); 9 wind-torn clouds
  in 3 layers, leaning 20 degrees downwind with ragged lee edges, #ffffff, shade #c9d6e4, warm edge #ffeecd, crossing
  toward +x at 0.9, 0.6 and 0.3 m/s.

Params: `runes` (0.2), to 1 as the staves pass at 21 s; `gust` (0): grass bends to 40 degrees, the canopy sways 5,
clouds 30 % faster.

## E2. WIND THINGS (kinds `norseleaves`, `norsepile`, `norserope`, `norsestaves`; panels 07-10, 21.0 s)

The wind blows toward +x in the tree set, everywhere and on everyone (Odin's `wind`, Spud's and Chip's leaves).
Leaf shapes, 5: 3 pointed leaflets with fine teeth (0.06, 0.08, 0.11 long), 1 small round one 0.05, 1 three-lobed one
0.09 (panels 08-10); DRY LEAF colours by hash, a midrib and 4-6 side veins, edges curled.

- **Falling leaves** (`norseleaves`): 46 in the air inside the box spec `box` [w, h, d] (default 8 x 6 x 6) at any
  time: falling 0.6-1.1 m/s, rocking 35 degrees at 2-3 Hz, drifting 2.2 m/s toward +x; each a closed loop of t.
  `gust` (0): speed x 2.2, 30 more, paths lift 15 degrees. spec `column` true: 160 leaves in a box 14 x 40 x 10 for
  the crane up the trunk.
- **Leaf pile** (`norsepile`): 2.8 x 2.2 x 0.62, 3 uneven lobes, thinning into the hollow between BR2 and BR3. Top
  layer 420 single leaves, each drawn once; under it a lumpy body in 3 tones with 300 drawn leaf edges; 30 stalks
  and twigs; 5 seed bunches; 8 % yellow-green leaves, 6 % dark rotten ones with holes. 160 loose leaves within 3.5 m,
  thinning out. `burst` (0): the drop at 28.5 s: a crater r 0.34 opens 0.5 deep where Chip lands (spec `at`), 90
  leaves fly 0.6-1.6 up and 1.3 out, tumbling, coming down slower than they went up, all landed at 1 (director: 0 -> 1
  in 2.4 s), 6 dust puffs #d9b877. The crater's rim then closes round his ankles: only the two trainers show
  (panel 10). `rustle` (0.3): 30 top leaves lift and slide 0.05, 4 a second fly off downwind.
- **Rope** (`norserope`): hemp, 0.022 thick, 3 strands, a twist mark every 0.012, #b9975a, shade #7d6236, 14 frayed
  fibres at the knots. Round B1 in the old groove: 3 turns and a hitch on top, a tail of 0.18. Down 0.50 to a loop of
  2 turns and a knot round Chip's RIGHT ankle, tail 0.07. spec `end` [x, y, z] (default (0, 1.585, 0)): the loop is
  ALWAYS on the ankle, no gap, never through the shoe. `swing` -1..1: 15 degrees. `twist` -1..1: Chip turns 20
  degrees on the rope. `slip` (0): the ankle knot creeps 0.03 open (during "Four seconds."), then lets go in 4 frames.
  After it: the empty loop, 0.09 across, swings 12 degrees and settles in 2 s.
- **Rune staves** (`norsestaves`; 21.0 s): 9 (nine nights). Each a split slip of pale ASH WOOD, 0.46 x 0.07 x 0.012,
  bark left on one edge, both ends cut slanting, ONE mark 0.20 tall cut in its flat face and glowing (cut filled
  #fff1b8, a halo 0.06 #f2cf6a at 0.5, the wood warm round it). They sink past the bark at 0.35 m/s as if weightless,
  each turning 0.25 turns a second about its length and swaying 0.2 side to side, 0.25 s apart, 0.6-2.5 m in front of
  the trunk; 6 round gold motes trail each and shrink away (round dots, never stars). Marks in order: M4 first, then
  M1, M2, M3, M5, M6, M8, M10, and M9 (day) LAST and nearest the camera. `fall` (0): 0 above the frame, 1 below it;
  spec `span` 9 m. As a stave passes a carved mark on the trunk, that mark flares. A stave is 165 px long in a frame
  3 m wide.

## F1. SMALL PROPS (kinds `norsecup`, `norsesheet`, `norsetest`, `norsebud`, `norsesip`)

- **Cup** (`norsecup`; Chip's RIGHT hand for the whole cave part; panels 01, 03, 13-15, 20). Turned from one piece of
  birch burl, no handle: 0.095 across the rim, 0.075 at the foot, 0.085 high, wall 0.007. #a8763e, shade #6f4a22,
  light #d2a468, inside #5f3d1c. 9 lathe rings and 5 burl swirls; a carved band 0.022 high at y 0.045-0.067: a
  2-strand interlace of 10 crossings, cut 1.2 mm, darkened; a foot ring 0.006; the rim worn pale, 1 nick, 2 hairline
  cracks 0.02. Hold: round its side, the glove behind it as the camera sees it, at chest height or below.

| Param | What |
|---|---|
| `fill` (0) | glowing WATER up to 0.07 high, 5 glints, a small glow r 0.07 at 0.25 over it |
| `drip` (0) | after the dip: 3 drops fall from the foot every 0.4 s |
| `pour` (0), `hold` (0) | 43.0 s: a stream 0.12 long leaves the lip with 5 drops; at `hold` 1 it stops dead in the air and only quivers 0.002, like jelly. It falls back into the cup when `pour` returns to 0 |
| `shake` (0) | 45.5 s: the surface slops, 2 drops jump over the rim |
| `gold` (0) | the water turns #ffd45a for the sip |

- **Crumpled sheet** (`norsesheet`; 6.0 s, panel 04): paper 0.24 x 0.32, #f4f1e6, facets #d2cec0, creases #b3ae9f. A
  fixed network of 38 crease facets, relief up to 0.012; 2 dog ears; a nick 0.02 in the top edge; one pale cup ring
  0.07 across #d9c7a0; printed and EMPTY: a name line, 6 answer lines and one box in pale #9aa6b4, nothing filled in.
  `open` (0.65): 0 = a ball 0.07 across (in the pocket), 1 = flat but creased; panel 04 is 0.65. Held in the LEFT
  hand by its top edge.
- **Test sheet** (`norsetest`; classroom, panels 23-24): 0.24 x 0.32, clean #fbfaf5, flat on the desk. Top left an
  empty name line 0.09. QUESTION 1: a dot, then a strip of 7 joined boxes, each 0.028 x 0.032 (strip 0.196), drawn
  in wobbled lines 1.2 mm #3a3a44; boxes 1 and 7 shaded #e6e2d6 (the weekend at both ends, so the middle box is the
  middle of the week in every country); box 4 ringed in red #d2382c, an oval 0.040 x 0.044 with an overlapping tail;
  a short arrow from the ring to an empty answer line 0.12 with one red "?" 0.02 tall. Below: 3 more questions at
  12 % contrast (a triangle, a row of 4 circles, a wavy line), so the strip is the one strong thing. `write` (0): a
  pencil scribble grows along the answer line (a wavy line, no letters). A box is 36 px or more in a frame 0.85 m wide
  or less: the sheet gets one insert.
- **Plucked potato eye** (`norsebud`; 53.5-56.6 s, panels 18-19): a bud 0.016 across, 0.011 high: a rounded cone
  #7a4f24, shade #54351a, a pale sprout point #e9dcae of 0.002, a paler ring scar round its base, 3 scale lines, one
  soft highlight. It never looks like a real eye. `pop` (0): 0-0.3 it stretches 0.003, at 0.3 it lets go with a
  2-frame 20 % squash and 3 crumbs. On the palm it lies flat side down and rolls 0.002 when the hand trembles. 30 px
  in a frame 0.55 m wide: its two shots are close-ups.
- **Sip light** (`norsesip`; 57.0-66 s, panels 20-21; fitted to Chip's body, spec `fit` "chip"): `flow` (0): 14 thin
  light lines (0.004, core #fff3c4), each forking twice, run from his mouth outward over skin and hoodie, down to the
  feet and up into both leaves, in 0.9 s, then thin away; a gold edge glow 0.05-0.12 round his outline, #ffd45a at
  0.5, pulsing at 1.5 Hz; leaf veins light gold, 3 round motes rise from each leaf tip. His leaves stand straight up
  (the rig's sprout). Chip's own colours stay under it.

## F2. CHIP DETAILS (`characters/norse-myth/chip-buds.json` = Chip unchanged + costume key `buds`; `chip.json` untouched)

Used for the whole film, so the potato eyes are on him from frame 0 (the plant for 51.0 s). All on bare skin above
the hoodie's rolled hood, outside the face. Places as (degrees round from the front toward HIS LEFT, body-local y):

| Dimple | Where | |
|---|---|---|
| d1, THE ONE HE PLUCKS | (+55, 0.40): beside and above his left cheek, seen from the front | bandage spot |
| d2, d3, d4, d5 | (+78, 0.41), (+108, 0.35), (+135, 0.44), (+95, 0.47) | the side the close-up at 51.0 s shows: 5 in one picture |
| d6, d7, d8 | (-70, 0.39), (-115, 0.43), (180, 0.40) | |

Each: a shallow pit 0.016-0.022 across, drawn: a dark crescent on its upper edge #8a5a2a, a pale lower lip #f2c47a,
in the middle a brown bud 0.007-0.010 #7a4f24 with a paler tip, and above it a brow crease 0.02 long #b87a30 (a real
potato eye has one). The builder checks on the rig that d1 clears the eye by 0.03 and the cheek mark by 0.02 and
shifts it round, not up or down.

| Key | What |
|---|---|
| `buds.pluck` (0) | d1's bud is gone: a smooth pale dimple #f0c078 with a clean rim. No red, no hole |
| `buds.bandage` (0) | classroom: a tiny plaster over d1, 0.050 x 0.017, 20 degrees off level: #f1d3a8, white pad 0.016 #fbf6ea, round ends, 3 air dots each side, one end lifted 0.001 with a shade line |
| `buds.gold` (0) | 57-66 s: irises turn #ffc93a; at 62.5 s a 2-arm spiral turns in them once a second for 1.5 s; back to brown by 66 s |
| `buds.flush` (0) | 26.0 s, upside down: the cheek marks grow x 2.2 and deepen to #e8553a at 0.55 over 2.2 s, cheeks puffed 6 %; gone 1 s after the drop |

Hands: the cup lives in his RIGHT hand; the LEFT is his acting hand (sheet, covering his eyes, the pluck, the palm).

## F3. CLASSROOM DRESSING (kinds `norseclass`, `norsedesk`; set `engine/page/set-classroom.js` reused; panels 23-24)

The set stays as it is. But its chalkboard says "TEST", "no talking!" and sums, and it has an alphabet strip: all
readable, against STORY.md. Default: `norseclass` brings a back-wall flat that stands 0.05 in front of the set's wall
and hides them. (Director's other choice: a switch on the set that leaves the board and strip out.)
Set coordinates: back wall z -2.35, camera at +z.

| Part | Where, size | Detail and colour |
|---|---|---|
| Back flat | z -2.30, x -4.2..+4.2, y 0..3.2 | the set's own wall: cream #f6eedb over a sage dado #a9c9a4 to y 0.9 with a white rail |
| Windows, 2 | at x -2.3 and +2.3, each 1.1 x 1.7, sill y 0.85 | white frames with a cross bar; morning sky #9fd0f0 with 3 soft clouds, 2 tree crowns in autumn gold swaying 1 degree, a far roof; a painted warm light patch on the floor under each |
| Bookshelf | x -1.3..+1.7 at z -2.15, 1.25 high, 0.30 deep | honey oak; 3 shelves, 4 bays; 96 books: spines 0.02-0.045 wide, 0.16-0.24 tall, 9 muted colours, 12 leaning, 6 lying in 2 stacks; no titles: 1-2 bands or one small stamp (leaf, dot, wave) a spine |
| On the shelf | top | a globe 0.22 across (blue, ochre land blobs, brass arm); 3 pots: a trailing ivy 0.5 long with 22 leaves, a fern, a potato plant with 3 white flowers; a jar of 7 pencils |
| Above the shelf | y 1.5..2.4 | 5 pinned crayon drawings 0.28 x 0.22: a sun over a hill, 3 potato people, a house, a very big tree, 2 black birds; a round clock 0.3 across with 12 ticks and no digits, hands at five past eight |
| Chip's desk (`norsedesk`) | suggested (0, 0, +0.9), facing +z; origin = the chair seat at y 0.42, top at y 0.62, as `schooldesk`, so sitting works the same | honey oak #d9a15a, shade #a8743a, light #f0c888: top 0.70 x 0.50 x 0.03 with a pencil groove, 14 grain lines, 2 knots, one scratched heart 0.02; 4 square tapered legs; a shelf under the top with 2 book edges; a wooden chair with one back slat |
| Class desks, 4 | row 1 at (-0.78, -0.45) and (+0.78, -0.45); row 2 at (-0.30, -1.55) and (+1.05, -1.55) | the same desk, each with its own grain and wear; a test sheet (F1 at 30 % of its marks) and a yellow pencil on each |
| Pupils, 4 | one at each class desk; built figures, not rigs | Spud's skin, eyes and hands, a green leaf sprout each |

Pupils (designed for this room; all bent over their sheets):

| Pupil | Shape, clothes | What it does |
|---|---|---|
| P1, row 1 left | a tall oval 0.78; denim-blue knit #5a7fb0; one leaf | writes fast: the pencil hand moves 0.01 at 3 Hz, tongue tip out |
| P2, row 1 right | round, 0.70; plum knit #7a5a9a; two small leaves | chews the pencil's end, looking up; writes from 72 s |
| P3, row 2 left | 0.74; moss cardigan #6f8a4a; round wire glasses #3a3a44 with one glare streak; a curled leaf | head on one hand, writes slowly |
| P4, row 2 right | small, 0.66; rust knit #c8693a; a drooping leaf | peeks at P3's sheet once at 71.0 s and snaps back |

All breathe 0.01 at 0.3 Hz (phases hashed). Param `calm` (0): at 1 (from 72.5 s) nothing in the room moves more than
0.015, so the eye stays on Chip. Reused as they are: `pencil` (in Chip's left hand), the set's floor and side walls.

## 10. LOOK: light and colour per place

Cast skin never reads darker than #a8733a; no depth of field; vignette 0.25. Colour script: cave = teal and deep
blue with gold accents; tree = sky blue and autumn gold; classroom = cream, honey wood and Chip's yellow.
Lettering band (y 200-640 px): behind white text the picture stays under 45 % luminance. The opening frames R1's dark
underside and a root curtain there, not the gap and no rune group.

| Place, act | t (s) | Key (direction TO the light, colour) | Fill sky / ground | Params | As seen | Frame mean |
|---|---|---|---|---|---|---|
| Cave, the question | 0-8.5 | gap sun (0.15, 0.75, -0.65) #ffe6b0: a rim on hat, fur and leaves; a soft front fill #ffe9c8 at 0.35 | #5f8f9a / #1f3a44 | well glow 1, runes 0.35 | faces warm from the front, lit cyan-gold from below by the well; roots #5b4a3c near, #6f8f9a far | 30 % |
| Cave, the head | 8.5-13, 14.5-16.5 | same, shafts x 0.8 | same | glow 1.3 at the bulge, then 1; head glow 0.6 -> 1 as the lids open | the head's eyes are the brightest thing: #bfeefa | 27 % |
| Well floor | 13.0-14.5 | none; the light net and rays | #1f86a8 / #0f4f6a | (norsefloor) | deep teal, gold pebbles brightest, the orb ivory | 34 % |
| Tree, windy day | 16.5-30 | sun (-0.5, 0.75, 0.45) #fff1d0, key to fill 1.6 to 1 | #9fc6ea / #8a9a5a | wind 1, gust 1 at 16.5-18 and 28.5 | the brightest, loudest picture after the cave: sky #6fa9dc, leaves #e6b23c | 58 % |
| Cave, the snitches | 30-41 | as the first act, shafts 10 % warmer | same | runes 0.35 | comic and clear; raven sheen blue and violet against the mist | 33 % |
| Cave, caught | 41-48.5 | same, x 0.85 | x 0.8 | `dim` 0 -> 1 in 0.4 s at 43.0; well `glints` 0, head glow 1 | cold: water #5fc6e6, a cyan rim on Chip from the head's eyes | 24 % |
| Cave, the potato eye | 48.5-57 | as the first act; one shaft lands on Spud and Chip at "You're a potato." (a cloud moves on) | same | `dim` 1 -> 0 over 48.5-51 | warm again | 32 % |
| Cave, the sip | 57-66 | Chip's own light #ffd45a at his chest, 0 -> 1 in 0.9 s, then 0.4 | sky x 1.1, ground #4a3a1a | cave and well `gold` 0 -> 1 in 0.9 s, runes 1 | water and light net gold; Odin's smile at 65.5 s in a warm shaft | 45 % -> 38 % |
| Cave, the complaint | 68-70 | as the first act | same | `gold` 1 -> 0 over 66-68 | ordinary light for "I paid an eye for that?!" | 32 % |
| Classroom, morning | 70-76.5 | (0.45, 0.8, 0.4) #fff4dc, key to fill 1.3 to 1 | #dfeaf2 / #e6dcc6 | `calm` 1 from 72.5 | the flattest, brightest picture of the film: plain | 66 % |

Real lights, 6 at most (CPU). Cave: the gap sun (spot from (1, 12, -12) aimed at (0, 0, -0.5), range 30); the well's
up-light (#8fdcea at (0, 0.45, 0), range 7, 6 % ripple flicker); a small gold one at (0.4, 0.3, 0.6), range 3.5; the
front fill at (0, 1.6, 5.5), range 8; the head's eyes (#bfeefa at head-local (0, 0.9, 0.7), range 2.5, on from rise
0.7); Chip's sip light (range 3). Everything else is painted: light net, rune glows, shafts, mist, glints.

## 11. REUSED as they are

Spud (`characters/potatobrawl/spud.json`): untouched. Chip's body, costume and sizes (F2 only adds the `buds` key in
a new file). `set-classroom.js` (floor, side walls, light), `pencil`. The build method of `crow` (props-sh-items.js)
for B; the lofted skin of props-bear.js and the heart monster for C; the flame-swap idea of the Egypt torches for
the water glints; `chip-juice.json` as the model for a Chip variant file; the cut-off cuff logic of costumes-judge.js
for A's sleeves. NOT reused: `allfather.json`, the costume raven, the `raven` prop, the old `paper` test (words),
`schooldesk` (metal and blue; fallback only).

## 12. ORDER, builder time, count checks

Nothing ships crude. The plans, marks, sizes and params above are frozen, so staging can start from the numbers
while the looks are built. Each look has a bench sheet; the reviewer counts on it.

| Piece | Share of builder time | What takes it | Count check on the bench sheet |
|---|---|---|---|
| A Odin + spear | 22 % | a live face under hat, patch and moustache; cloak that hangs plumb; the hat | 16 hair locks; 13 crossings a braid, 4 rings; 78 fur locks, 2 masks; 78 chain links; 80 trim crossings + 3 knots; 22 patch stitches, 12 stud beads; hat: 9 nicks, 3 holes + the sprout's, 1 patch, 38 band crossings; 4 expressions; spear: 5 bands, 15 + 4 marks, 18 chevrons |
| D1 cave | 22 % | five twisted roots, 140 curtain strands, the gap view, the light net | 5 roots, 5 burls, 3 stubs; 180 + 60 moss; 90 lichen; 14 brackets; 34 fern crowns; 12 marks in 5 groups; 6 curtains; 46 slabs, 5 puddles; 5 shafts; 14 mist cards |
| E1 tree | 13 % | the trunk's bark to 12 m, the far column, sky and land | 9 strands; 19 brackets in 3 tiers; 11 marks; 7 buttresses; B1 groove, 14 moss beards, 6 seed bunches; 9 clouds; 3 ridges |
| C head | 12 % | one skin with a face that turns, squints and speaks; the floating beard | 34 pits, 7 cracks; 11 crowns, 62 fronds; 34 beard strands, 18 moustache strands; 16 hanging strands; 18 brow tufts; snail, 2 mushrooms, 3 flowers |
| B ravens | 10 % | 120 wing feathers that fold, beat and brake; the whisper | 60 feathers a wing (10 / 11 / 3 / 33 / 3); 12 tail; 16 hackles; 14 bristles; the two birds told apart at 200 px |
| D2 well, floor | 9 % | the knot band, water states, the under-water set | 16 blocks, 84 crossings; 14 cap slabs; 100 glints; 7 pads; 260 pebbles (38 gold, 20 cyan); 12 weeds; 9 rays |
| E2 wind things | 6 % | 90 flight paths, the pile, 9 staves | 5 leaf shapes; 420 top leaves; 90 burst leaves; 9 staves with their 9 marks in order; 3 turns + hitch |
| F3 classroom | 3 % | 4 pupils, 96 books | 96 books; 5 drawings; 4 pupils; 5 desks; 12 clock ticks, no digits |
| F1 items, F2 Chip | 3 % | the cup's states, the sip lines | cup: 10 crossings; sheet: 38 facets; test: 7 boxes, box 4 ringed, boxes 1 and 7 shaded; 8 dimples; 14 sip lines |

Build order: A and D1 (the two long poles, and frame 0 needs both) start at once with D2; then C and B; E1 and E2 in
parallel; F1-F3 last. A, D1 and C get the most time; do not cut their counts to save it.
Prove small before staging (each a one-second bench): Chip hanging upside down by the ankle with leaves and strings
hanging toward the ground; Odin's 22 degree lean with the cloak plumb and both ravens riding; the swap from costume
raven to flying raven; Chip leaning over the rim for the well-floor shot.

## 13. Beats kept, sheet drift, defaults and open questions

Every beat and line of STORY.md is kept, in its order. Added pictures, so each beat has its cause on screen: the
patch in frame 0 (the question); the head's syllable rings (its voice read with no sound); the eye on the floor in
Odin's own iris colour (whose eye it is); the old rope groove on the branch (why Chip hangs there); the knot that
creeps open (why he drops); the ravens take off at 16.5 s as the spear goes up and come back at 30.0 s to the
scratched bracer (why they are in the air, why they land there); the sip stone (how Chip reaches the water);
the frozen stream (caught); the dimples on Chip from frame 0 (the plant) and the plaster on the same spot (the
payback); Odin's moustache never lifts on both sides before 65.5 s (his first smile); the day mark M9 as the last
stave (a quiet plant for "my day").

Where the sheet differs, and my default:
1. Panel 07: Spud and Chip are big in the foreground. Default: tiny at the trunk's foot, 10.3 m beyond Odin (STORY).
2. Panel 11: a third raven. Default: two, landing on his LEFT bracer.
3. Panel 12 has the ravens on his shoulders, STORY has them on his arm at 30.0 s. Default: land on the arm at 30.0,
   hop to the shoulders by 34.0, whisper from there at 35.0 and 37.0.
4. Panel 13: Chip beside the head. Default: Chip at the sip stone, behind the head's gaze while it faces Odin; the
   head then turns about 113 degrees to him at 43.0 s.
5. Panel 23: no bandage. Default: `buds.bandage` on d1, on the cheek side so a front camera sees it.
6. Panel 24: a big open laugh. Default: a slow smug smile over 2 s, eyes half shut, mouth closed until the line.
7. Sides flip between panels (01 and 21: Odin right; 13 and 15: Odin left). Default: Odin on the RIGHT of the well's
   front for the whole cave part, Chip and Spud left; nobody changes side unseen.
8. Panel 02 puts the spear in his left hand; the concept in his right. Default: right, always; the left is free.
9. Panel 04: Chip holds the sheet with both hands and no cup. Default: left hand only, cup stays in the right.
10. Panel 17 lifts the hoodie to show dimples on his belly. Default: bare skin above the rolled hood (no cloth lift).
11. Panels 05, 09, 15 draw sweat drops; panels 01 and 14 draw trident-like runes. Default: no sweat drops (story.md
    section 3); only marks M1-M12.
12. Panel 01 has the well in the foreground. Default: the cast on the +z apron, the well and the gap behind them;
    the cave is finished on all sides, so the reverse angle also works.
13. Panels 23-24 show bookshelves and windows where the set has its chalkboard. Default: the back flat of F3.

Defaults the director can override (each is one number or one switch):
1. Odin's BODY top is 1.5 Spuds (1.53); the hat adds 0.17. Other reading: scale him 0.89 so the hat top is 1.53.
2. Odin's eye line at body-local 1.00 (72 % up), not the concept's 90 %: on the egg the eye would look at the sky.
3. Two wolf masks on the mantle as on the concept (`odin.masks` false drops them).
4. Perched ravens ride Odin as costume parts; flying ravens are props; the bird is 0.50 long.
5. The head is 1.90 wide and rises 1.35; the well's inner width is 2.30; the rim is 0.24 wide and 0.30 high.
6. Odin's eye on the well floor: a bare ivory orb with two stone lids that blink (your call in the brief: taken).
7. The well floor is its own set with the real Chip leaning over its rim; `peek` is the fallback.
8. The crane at 16.5 s: 0.6 s in the cave (the spear swings up to the gap), then a cut on the move to the tree set.
9. "Water freezes mid-pour" = the cup's stream stops in the air (`hold`), then falls back into the cup; the cup stays
   full for the sip at 57.0 s.
10. The payment: Chip tips his palm, the bud drops into the well at 56.6 s (`pay`), then he drinks.
11. The tree is an ash; three of the five leaf shapes are ash leaflets, two follow the sheet.
12. The test sheet carries ONE red "?" (a mark, not a word). Without it: the arrow and the empty line alone.
13. Chip's desk is the wooden `norsedesk`; `schooldesk` is the fallback.
14. Spud is not in the classroom (4 designed pupils instead); the ending is Chip's alone.
15. The ravens leave his shoulders at 16.5 s, seen (panel 07 draws them still perched); they are two specks round
    the trunk during the crane and are gone from his shoulders until 30.0 s.

Risks to timing and scope: Chip upside down is a rig pose nobody has proven; five things pass through hands (spear,
cup, sheet, bud, pencil); Odin's cloak under a lean; A and D1 are each a fifth of the build.

Against standing rules, kept because the brief asks: the red face at 26.0 s and the gold swirling eyes at 62.5 s
(cast colours stay; no reaction symbols). Both last under 10 s and leave his skin as it was.

One line on the brief: in a Monday-first week the middle box is Thursday, so boxes 1 and 7 are shaded as the
weekend; if Jonny wants a Monday-first strip, box 3 must be the ringed one.
