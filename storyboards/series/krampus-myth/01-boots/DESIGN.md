# Krampus myth 01 "One night a year he checks your boots": DESIGN of the new looks (21 Nov 2026)

Target: STORY.md v1 + Jonny's sheets (krampus-sheet-1 panels 01-12, krampus-sheet-2 panels 13-24). Tall 1080x1920.
Builders build exactly these numbers, ONE file per look, each with a usage header and a `<NAME>_STATE` export as in
props-heart-monster.js. Where the sheets disagree with each other, the story or the brief: section 10.

Jonny's standing note for this series (20 Nov 15:46): "the scenery and other characters need some real love to the
detail and beauty in their looks." DETAIL AND BEAUTY ARE THE PRIORITY. Every count, hex and size below is part of the
look: nothing is simplified, merged or left for later. Section 9 has the count checks and where the builder time goes.

Rules for all:
- Metres, x right, y up, z toward the default camera; a prop faces +z at rot 0. Params are 0..1 unless said, default in
  brackets, seeded with a dur-0 set before any tween.
- SIZE LADDER, in every shot: door-9 kid 0.43, Chip 0.67 (body 0.53 + legs 0.14), Spud 1.02 (0.88 + 0.14), Saint Nick
  1.24 (mitre top 1.63), a house door 1.70, the Krampus 2.04 at the crown (horn tops 2.50). Chip's crown is at 66 % of
  Spud's in every two-shot (the sheet's 04, 12, 13 draw him too big): nothing here is sized for another Chip.
- A pure function of spec, state and t; every mark drawn once from its index and spec.seed (no tiling, no random, no
  clock). Hand-drawn Ghibli look, ink on hard edges. Glows, flames, breath, falling snow, smoke: steam, noOutline, no shadow.
- PICTURES ONLY: no letters or digits anywhere in any look. Door numbers are carved pictures (A), the book's writing is
  rows of small pictures (D), bells carry an engraved flower, the church has no clock, cartons and cups no print.
- NO GORE: nobody is hit; sticks only ever go into boots. The only reds are the tongue, the robe, the kid's scarf and
  boot, berries and fries cartons. Teeth and tongue are clean: no drool strings, no red darker than #8f1f2c on him.
- NO SYMBOLS: no sparkles, speed lines, sweat drops or floating marks. A shine is a painted reflection.
- SNOW lies only where it can settle: thickest mid-slope, thin at edges, never on vertical faces (only a 1-2 cm blown
  crust on the uphill side of posts). Every cap has a rounded lip (radius 40 % of its depth) overhanging 15 %, a shade
  line under it, and is drawn once. Depths: roofs 0.45, wall caps 0.18, rails 0.10, sills 0.06, lantern caps 0.035.
- TIMBER is old larch: 5-9 grain lines a board, 1 knot per 0.8 m, 2 drying checks a log, a 1 cm chamfer with a light
  line on every carved edge. Sheltered wood is honey brown, sun-burnt upper storeys near black, 3 repair boards a
  house pale #b98a52.
- BRASS is never flat yellow: one light band on every round part, tarnish in every recess, 1 dent a piece.
- GOLD (Nick's book, crook and embroidery): the GOLD LEAF rule and palette of egypt-myth 01 DESIGN, unchanged.

| Shared palette | Base | Shade | Light |
|---|---|---|---|
| NIGHT SKY (zenith / horizon), star | #0e1630 / #24376b | | #e9eefc |
| SNOW in moonlight | #cfdcf2 | #7f95c4 (deep #4a5f96) | #ffffff; in a lantern pool #ffd9a0 |
| TIMBER (sheltered / sun-burnt) | #6a4528 / #3a2a1e | #3c2616 / #1f1610 | lantern-lit #a87242 |
| STONE | #8a8d96 | #565a66 | #b9bcc6 |
| LANTERN flame / WINDOW glow | #ffb45a / #ffc766 | #ff9a3a | core #fff0c0, pool #ffcf8a |
| WROUGHT IRON | #1f2126 | #101114 | edge #5a6270, rust #6a3a22 at joints |
| FUR / FROST | #2e2218 | #17100b | strand #5a4028 / frost #dfeaf5 |
| MASK WOOD | #4a2e1c | #24140c | worn #7a5234 |
| HORN | #8a7458 | #4e3f30 | #c4b08a |
| TONGUE | #c8323a | #8f1f2c (never darker) | #f08a8a, gloss #ffc2c2 |
| BRASS | #c79a3a | #7a5a1c | #ffe9a0 |
| WICKER | #b58a52 | #7a5a32 (gaps #3a2a18) | #dcb87a |
| ROBE RED | #a3232b | #6e141c | #cf4a44 |
| BEARD, ALB | #f4f1ea | #cfcbc0 (deep #a9a59c) | #ffffff |
| BIRCH bark / dashes / twig | #ece6d8 | #3a2e26 | #4a3424 |
| TEAL FELT (= Spud's sweater) / TEAL PAPER | #2f8f8a / #9fe0d4 | #1c5f5c | #5fb8b0 |
| YELLOW FELT (deeper than Chip's hoodie) / YELLOW PAPER | #f2b824 / #fff09a | #b9861a | #ffd95a |

| # | Look | Kind / costume | Builder file |
|---|---|---|---|
| A | Lane (9 houses, aprons, lane, wall, fountain, woodpile, far, sky) | `krampuslane` | `engine/page/props-krampus-lane.js` |
| B | Krampus, his basket and the kid in it, his shadow, the runner copies | `krampus`, `krampusshadow` | `engine/page/props-krampus-beast.js` |
| C | Saint Nick | costume `stnick` on `characters/krampus-myth/nick.json` | `engine/page/costumes-stnick.js` |
| D | Golden book, crook, sack | `goldenbook`, `nickcrook`, `nicksack` | `engine/page/props-krampus-nick.js` |
| E | Boots, crayon drawings, sticks, treats | `kboot`, `bootnote`, `ktreat` | `engine/page/props-krampus-boots.js` |
| F | Krampus-run town square | `krampusrun` | `engine/page/props-krampus-run.js` |

## A. LANE (kind `krampuslane`; every panel but 19)

Origin: on door 4's apron (y 0), on its house front (z 0), at the middle of door 4 (x 0). The houses stand on the -z side
and face +z; the lane runs along x in front of them. UP the lane = -x (door 9), down = +x (doors 3 to 1). A camera
looking up the lane has the houses on its right (panel 03). A camera in the lane looking at a house front has uphill
on screen left: the pair always arrive from the left (panels 18, 23) and stand ABOVE the cast in frame, 0.8 m a door.
Houses on ONE side only. Single-sided walls (a camera may stand outside). Only snow, aprons and lane take shadows.

House k: door centre x_k = -7.6 (k - 4), apron level Y_k = +0.8 (k - 4). Each house body runs x_k - 2.6 .. x_k + 4.0
(6.6 wide, the door 2.6 from its uphill corner), z 0..-6.4, with a 1.0 m alley to the next.

| Thing | Where (x, z; y above that house's apron) | Size |
|---|---|---|
| Doors 9, 8, 7, 6, 5, 4, 3, 2, 1 | x -38.0, -30.4, -22.8, -15.2, -7.6, 0, +7.6, +15.2, +22.8 | aprons at y +4.0, +3.2, +2.4, +1.6, +0.8, 0, -0.8, -1.6, -2.4 |
| Apron (each house) | x_k - 2.6 .. x_k + 4.0, z 0..+1.9 | flagstones; its front edge is a dry-stone step: flush at the uphill end, 0.16 at the landing, 0.60 with 3 stone steps at the downhill end |
| Landing (each door) | x_k - 1.8 .. x_k + 1.8, z +1.9..+5.5 | level, 0.16 under the apron; everyone who stands in the lane stands on a landing |
| Ramp between landings | 4.0 long, 3.6 wide | rise 0.8 = 11.3 degrees (20 %) |
| Stone wall | z +5.5..+5.9, the whole lane | top 0.70 above the lane, following it |
| Fountain | bay x -2.6..+0.6, z +5.5..+7.2; fountain at (-1.0, +6.4), y -0.16 | opposite door 4: the backdrop of every shot from the doorstep |
| Balcony line (every house) | z 0..+0.60, underside y 2.20 | nothing of the Krampus above y 2.15 ever comes inside z +0.62 (B) |
| Door 4 | opening x -0.475..+0.475 at z 0, y 0..1.70 | the leaf swings INTO the house, hinge at x -0.475 |
| Door-4 window / lantern | window centre x -1.55, sill y 0.95 / lantern (+0.80, 1.58, +0.24) | 0.80 x 0.90 / below |
| Boots at door 4 (E) | teal (+0.92, +0.95), yellow (+1.30, +0.95), both rot -35 (toes to screen left) | 0.38 apart: a drawing never overlaps the other boot |
| Plain wall behind the boots | x +0.6..+2.7, y 0.4..1.5 | bare logs, nothing hangs here: the boots' backdrop |
| Woodpile | x +2.80..+4.30, z +0.05..+1.01 (door 4's apron runs on to x +4.4) | 1.15 high + snow; its last 0.30 stands in the alley mouth |
| Chip's hollow | x +2.80..+3.60, z +0.05..+0.71, y 0..0.66 | opens 0.66 x 0.66 on the pile's END facing the door (-x) |
| Peep gap / cat gap (pile front, z +1.01) | x +3.20, y 0.30..0.48, 0.20 wide / x +3.82, y 0..0.22, 0.24 wide | |
| Marks at door 4 (suggested) | Spud (-0.85, +0.90); Chip (+0.30, +1.00); Krampus K4 (+0.07, +1.10) rot 90; Nick at the yellow boot (+2.05, +0.95) rot 270 (panel 22), at the teal boot (-1.05, +1.30) rot 70 | all on the apron; x +1.65..+2.45 stays free of logs for Nick |
| Boots of the other doors | (x_k + 0.30 + 0.34 i, +1.10), i = 0, 1, 2 | doors 9 and 8: one boot, E's; the rest lane-built |
| Marks at doors 9, 8, 5 (panels 02, 11, 18) | Nick (x_k - 0.85, +1.15) rot 80; Krampus (x_k + 1.15, +1.10) rot 270 with `mirror`, the first boot dead ahead at 0.85 | |
| Krampus in the lane at door 6 (panels 15, 16) | (-14.7, +3.2) on landing 6, y +1.44 | 18 m from the pile and 1.44 above it |

**House kit** (all 9; y above that house's apron):

| Part | y | Carving, paint, snow | Count a house |
|---|---|---|---|
| Plinth | 0..0.40 | rubble STONE with lime pointing, about 60 stones showing; an iron boot scraper each side of the door; snow banked 0.25 against it except 1.4 m swept by the door | 2 scrapers |
| Ground-floor wall | 0.40..2.30 | 9 squared logs of 0.21, sheltered TIMBER, lime chinking lines 8 mm; dovetailed corners standing 0.12 proud, each log end with 4-6 rings and one radial check | 9 courses, 18 log ends |
| Door | 0..1.70, 0.95 wide | 5 planks with V joints; 2 wrought-iron strap hinges 0.45 long ending in a split curl; a lever handle on a lock plate 0.05 x 0.22 with a keyhole; 22 forged nail heads in 2 rows; a frame 0.14; a carved lintel board 0.95 x 0.20 with 3 six-petal rosettes and a rope moulding; a stone threshold 0.06 | 22 nails, 3 rosettes |
| Plaque (the door's "number") | on the leaf, centre y 1.22 | a limewood shield 0.30 x 0.34, 5 scallops a side, relief 1.5 cm, honey #b98a52 on a ground #3c2616, 1.2 cm of snow on its top edge; the picture of the house table, its parts COUNTED | 1 |
| Ground window | sill 0.95, 0.80 x 0.90 | 6 panes (2 x 3), cream frame #d9d2c0, bars 2 cm, 6 cm of snow on the sill; inside a lace half-curtain with 9 scallops and the house's window picture; 2 shutters 0.40 x 0.90 flat on the wall, each a frame and 2 panels: the upper with a cut-out, the lower painted | 2 leaves |
| Balcony | floor top 2.30, z 0..+0.60, rail top 3.02 | 5 carved brackets (an S-scroll with one notch); floor boards seen from below, 1 cm gaps; 40 flat baluster boards 0.15 wide at 0.165 pitch, the house's cut-out formed between each pair (39 whole shapes); a handrail 0.10 x 0.06 under 10 cm of snow sagging between 4 chamfered posts; 3 flower boxes 1.2 long: snow, 5 fir sprigs and 9 red berries each | 40 boards, 5 brackets, 27 berries |
| Upper storey | 2.30..4.00 | boards 0.18 wide, sun-burnt TIMBER, 3 pale repair boards; 2 windows 0.70 x 0.80 (sill 2.95) with shutters, a balcony door 0.75 x 1.45 | 2 windows |
| Eave | wall plate 4.00; edge at z +1.10, y 3.60 | 11 rafter tails 0.10 x 0.14 with a carved scroll end; a fascia board 0.16 with 33 scallops; icicles (reused look) 0.08-0.45 long, never 3 neighbours of one length, the longest over the downhill corner | 11 tails, 33 scallops, 38 icicles |
| Roof | 20 degrees, ridge z -3.2 at y 5.16 | SNOW 0.45, the lip hanging 0.10 over the eave and sagging 3 cm between rafters; 2 old slide scars 1.2 wide showing 6 rows of grey shingles; a stone chimney 0.5 x 0.5 at (x_k + 1.6, -2.0) standing 0.9 out of the snow, capped, with a thin smoke wisp (reused) leaning down the lane | 1 chimney |

| k | Plaque picture | Ground floor | Shutters, painted flower | Baluster cut-out | Lantern at x_k | Boots on the step | Fill once visited | Only this house has |
|---|---|---|---|---|---|---|---|---|
| 9 | edelweiss, 9 petals | white plaster #d9d2c0, painted vine jambs | green #3f6a4a, red tulip | heart | -0.80 | E: red suede | sticks | an iron ring knocker; a child's sledge leaning by the door; an upper window lit |
| 8 | sun, 8 rays | timber | blue-grey #4a6078, white star-flower | tulip | -0.80 | E: raspberry leather, polished | sticks | a bench with a snow cushion, 2 pairs of skis against the wall |
| 7 | star, 7 points | timber | ox-red #7a2a22, cream diamond | pine tree | +0.80 | moss rubber 0.30, orange felt 0.24, sky-blue fur-trim 0.18 | treats, sticks, treats | stag antlers (10 points) on a balcony post; 2 potato kids at the lit upper window |
| 6 | snowflake, 6 arms | white plaster, ochre scrolls painted round the window | green, red tulip | circle | -0.80 | violet rubber 0.28, red felt with 9 white dots 0.22 | treats, treats | a hay sledge under the balcony, a milk churn; an upper window lit |
| 5 | gentian, 5 petals | timber | mustard #b98a2e, green vine | heart | +0.80 | brown leather 0.27, pale-blue felt 0.20 | sticks, treats | a fir wreath with 5 red apples round the plaque, a snow shovel and a birch broom; 1 potato kid at the window |
| 4 | pine tree, 4 tiers | timber, painted vine jambs | deep green #2f5a44, heart cut-out over a red tulip (panel 13) | pine tree | +0.80 | E: teal felt, yellow felt, the drawings | the story | the woodpile, the chopping block; an upper window lit |
| 3 | clover, 3 leaves | timber | blue-grey, white star-flower | star | -0.80 | green felt 0.26, cream leather 0.22 | never | a snowman 0.75 tall: pot hat, twig arms, 5 coal buttons |
| 2 | cherries, 2 | white plaster | ox-red, cream diamond | heart | +0.80 | orange rubber 0.24 | never | a handcart with 2 sacks under snow; an upper window lit |
| 1 | crescent moon, 1 | timber | green, red tulip | tulip | -0.80 | brown 0.28, plum 0.22, white 0.16 | never | a stone cattle trough, the lane's last lantern |

- **Painted vine jambs** (doors 9 and 4; panels 01, 04, 08, 09): a panel 0.12 x 1.40 on each frame post: a climbing
  vine with 5 flowers (edelweiss white, alpine rose #b8322e, gentian #3a5fb0, then again) and 9 leaves on cream
  #e6dcc6 inside a green line; paint rubbed to wood at y 0.5-0.8.
- **Lantern** (9): WROUGHT IRON. Bracket arm 0.24 with 2 C-scrolls, one leaf and 3 collars; body 0.16 square x 0.24
  tapering to 0.12, 4 corner bars, a cross bar on each pane, a pyramid cap 0.20 with 4 vent slots, a ring finial,
  3.5 cm of snow. Amber glass #ffcf7a, soot on the top fifth of each pane. A candle stub with a 5 cm flame (the hall
  flame look: 3 painted shapes swapped 8 x a second), flicker 1 + 0.08 sin(2 pi 1.3 t + a_k) + 0.04 sin(2 pi 3.7 t
  + b_k). Glow card r 0.55 #ffb45a at 0.40; baked pools r 1.1 on the wall and r 1.6 on the snow #ffcf8a; 12 fixed
  snow glints in each pool, each lit for 4 frames every 2-5 s by its hash.
- **Lit windows** (14: every ground window, the upper ones named above): WINDOW glow. Window pictures, ground floor
  9 to 1: a candle arch with 5 flames, a paper star lamp with 7 points, a cyclamen in a pot, 3 jars, the kid (mittens
  on the glass), the candle arch, 4 stacked books, the star lamp, a jug of fir twigs. The kids of 5 and 7 drop below
  the sill while `lit` is their door and come back 2 s after.
- **Door 4** (`door4`): behind the leaf a hall 1.6 wide x 1.9 deep x 1.9 high: honey boards, a rag runner with 9 red
  and cream stripes, 4 pegs with a teal scarf, a yellow bobble hat and 2 small coats, a boot tray with 2 pairs of
  slippers, a shelf with the candle arch; warm #ffc766, a light wedge 1.0 wide reaching z +1.6 on the apron. A coir
  mat 0.6 x 0.35 with a faded pine-tree weave on the threshold.
- **Woodpile** (panels 13, 14, 17). Split logs 0.30 long, their ends to the lane, 3 rows deep (z 0.05..1.01) between
  3 upright posts, to y 1.15; a lean-to cover of 3 boards at 12 degrees with 0.20 of snow and 8 icicles. The front
  shows 132 log ends (12 columns x 11 rows), each drawn once: quarters 50 %, halves 35 %, rounds 15 %; 2-5 radial
  cracks, 3-6 rings, a bark rim on the round side; heartwood #d9b382, weathered grey #8f867a on 40 ends, 8 fresh
  bright ones #f0d2a0; snow wedges on 20 ends that stick out. The HOLLOW: the two back rows of the first bay are
  burnt this winter; 2 planks at y 0.66 carry the logs above; the front row hides it from +z. Its floor is bark
  crumbs and sawdust with a straw nest (the cat's) at the far end. By the opening, within x +2.45..+2.80, lie 9
  loose logs (reused `firewood` at 0.6: physics, the dive knocks them). TRAINER MARK: after the dive both trainers
  rest at (+2.70, 0.20, +0.38), soles toward -x, 0.10 outside the opening, and nothing else of Chip shows (panel 14
  fixed). Through the PEEP GAP a camera sees his eyes at y 0.40 (36 s). The cat leaves by the CAT GAP. A chopping
  block (reused, at 0.7) at (+4.00, +1.50) with a hatchet 0.36 stuck in it and 14 chips round it.
- **Fountain** (panel 03). STONE trough 1.50 x 0.66 x 0.52 high, walls 0.09, 3 six-petal rosettes between 4 raised
  panels on its front, a worn dip in the rim where buckets rest. Pillar 0.30 square x 1.45 behind its middle, 4
  chamfers, a band of 5 zigzag notches, a pyramid cap with a stone ball 0.20 under 0.14 of snow. A brass ram's-head
  spout 0.34 long at y 0.95, its 2 horns curled. Ice: 9 icicles on the spout (the longest 0.38), 14 on the trough
  rim (0.05-0.20), 6 on the cap; a pale sheet #b9d6e8 in the trough with 5 cracks and a dark melt hole 0.16 under
  the spout; a frozen overflow tongue 0.4 down the downhill corner. A tin dipper on a 9-link chain, a wooden bucket
  with 3 hoops frozen to the step.
- **Lane and aprons**: packed SNOW in the shade tone, 2 sledge-runner grooves 0.9 apart, 140 old potato footprints
  (ovals 0.07) in 9 crossing trails, powder 0.5 wide at both edges, a shovelled bank 0.35 high along the wall with
  30 spade facets; on each ramp 5 timber water bars as low ridges 0.8 apart. Aprons: flagstones 0.4-0.7 across,
  joints 2 cm packed with snow, a fan of 12 broom strokes swept before each door. Wall: dry STONE 0.40 thick,
  capstones 0.5 long, a stile of 2 slabs at x +10.
- **Tracks** (follow `visited`): cloven hoof prints 0.14 x 0.12, stride 0.55, toes out 12 degrees; Nick's round
  prints 0.11 beside them; a crook dimple every 1.1 m; a chain drag line 2 cm wide. From the forest edge (x -44)
  down to the landing of the lowest visited door.

| Far layer | Where | What |
|---|---|---|
| Meadow beyond the wall | z +6..+40, falling 15 degrees | snow with 3 old sledge tracks; a split-rail fence of 26 capped posts; 2 log hay barns 3 x 3 with snow roofs and a ladder at (-12, +16) and (+9, +22); 40 firs (reused, white-capped) 4-11 m in 6 clumps |
| Up the lane | x -42..-95 | the lane bends right into 120 firs rising 30 m; a hay rack, the last 2 fence posts |
| Hero peak | 6 degrees right of -x, 2,100 m above | a horn-shaped summit: moonlit faces #c9d6f0, shade faces #3a4a7a, 9 rock bands #2a3358, 3 hanging snowfields, a thin banner cloud #dfe8f8 at 0.5; 2 lower peaks to its left, 1 to its right |
| Down the lane | x +27..+90, dropping 22 m | the lower village: 34 snow roofs, 46 lit windows as points #ffc766, the church of F at (+74, +16), a river as a dark ribbon with 6 moon glints |
| Far range, valley | beyond | 5 peaks #5a6aa0 to #8a98c8, a mist band #7f95c4 at 0.35 |
| Sky | dome | NIGHT SKY; 420 stars in 3 sizes (1, 1.5, 2.5 px), 12 % of them twinkling 8 %; 4 thin moonlit clouds; the MOON: a disc 3.2 degrees across #f4f1e0 with 5 grey seas and a halo of 9 degrees at 0.15, 14 degrees left of -x and 27 up (top left of the panel 03 wide) |

- **Real lights, 6 at most** (CPU): the moon key (section 7); door 4's lantern (#ffb45a, range 5); the lantern of
  door `lit`; the hall wedge while `door4` > 0; the book (D); a snow bounce at (+0.6, 0.35, +2.6) #ffcf8a, range 4,
  0.5 (it lights the drawings' faces). Every other lantern and window is painted: glow + baked pools.

| Param | What |
|---|---|
| `visited` (10) | doors numbered `visited` and up have been visited: their boots show the fills of the house table, the tracks reach that landing |
| `lit` (4) | the door whose lantern is the second real light (9 at 0 s, 8 at 21.5, 5 at 44) |
| `door4` (0) | the leaf swings in to 80 degrees; scales the hall light and wedge |
| `snowfall` (0) | flakes of 1.2-3 cm in 3 depth layers (60 / 140 / 300 in view at 1), falling 0.9 m/s with 0.15 m of sway, each fixed by its index, never landing on a face. Director: 0 until 33 s, 0.6 at 36 s (he licks them), 0.15 from 44 s to the end |
| `shake` (count), spec `shakeAt` (5) | each whole number: a slab 1.6 x 0.5 x 0.2 breaks off that house's eave lip as 14 lumps and a powder curtain of 5 cel puffs, falls 3.6 m in 0.85 s, lands as a heap on the apron edge (3 lobes after 3 shakes); 2 icicles drop with it. A function of `shake` only |
| `trickle` (0.3), `smoke` (1) | the spout's thread of water into the melt hole; the 9 chimney wisps |
| `tense` (0) | baked fill x (1 - 0.3 tense), lantern flicker depth 8 -> 14 %, a cold rim #b9cdf5 from up the lane |

## B. KRAMPUS (kind `krampus`; a prop built like the heart monster: ONE lofted skin, never a potato; panels 02, 06, 07, 11, 15, 16, 18, 23)

Origin: the ground between the hooves, facing +z, +x = his left. Scale 1 below.

| Part | Size, where (stand) | Detail and colour |
|---|---|---|
| Whole | crown y 2.04, horn tops 2.50, hump 1.92, basket rim 2.08, lid top 2.20; 1.16 wide at the shoulders with fur, 0.78 at the hips; nose tip z +0.47, basket back z -0.94 | hunched: the head hangs in front of the shoulders, never above them |
| Goat legs | hip (-0.15 and +0.15, 0.98, -0.02), hock (the backward knee) y 0.52 at z -0.14, fetlock y 0.16; 0.22 thick in fur; cloven hooves 0.15 long x 0.13 wide x 0.11 high, toes out 12 degrees | hoof #1c1612, a chipped pale rim #6a5a48, the cleft 1.5 cm, 4 growth lines; fetlock hair over the hoof's top with 3 snow clumps a leg |
| Arms | shoulder (-0.40 and +0.40, 1.66, 0.02), upper arm 0.46, forearm 0.48, 0.17 thick in fur; hanging, the wrist is at y 0.74 and the claw tips at 0.52 | the fur ends in a ragged cuff of 12 locks; a rusty iron manacle 0.05 wide with 2 rivets on each wrist, a broken link on the right one |
| Hands | 3 fingers and a thumb (the cast's count), palm 0.11, fingers 0.10 | leather skin #3a2a22, light #5a4636, 3 knuckle creases a finger; claws 3.5 cm #1a1410 with a pale edge line, the right thumb claw broken short |
| Face | carved wood that is alive: brow y 1.98, chin 1.58, 0.32 wide; M = between the front teeth, jaw shut, (0, 1.68, 0.45) | MASK WOOD, satin. 150 gouge strokes 1-2 cm wide and 4-9 cm long following the forms (brow to temple, cheek to jaw), each once; 40 grain lines chin to brow; 3 hairline checks (left brow up into the fur 0.09, right cheek 0.06, chin 0.04); 2 woodworm clusters of 5-7 pinholes (left temple, right jaw); worn on the brow ridge, nose bridge, cheekbones and chin; soot black in the sockets. One brow ridge 0.30 wide overhanging 0.035, pinched to a V over the nose (25 degrees a side), 4 furrows a side; 3 furrows fanning from each cheekbone to the mouth corner; a flat nose 0.10 wide with 3 cuts across the bridge and 2 nostril slits 0.03 at 30 degrees; a chin knob; the jaw's 2 wooden hinge pegs r 0.008 at the jaw corners |
| Eyes | (-0.075 and +0.075, 1.90, 0.38); sockets 0.07 x 0.045, 0.035 deep; balls r 0.024 | amber #e9b93a, centre #ffd75a; a GOAT pupil, a horizontal bar 0.016 x 0.005 #1a120a; one catch-light; 2 carved bag lines under each |
| Mouth, teeth | 0.20 wide; jaw hinge (0, 1.70, 0.30), opens 32 degrees | a thin carved lip line with old red paint #8a2a22 rubbed off in the middle third; inside #5a1a22. 10 teeth, bone #e6d8b0, root stain #b9a070: upper 2 fangs of 3.0 cm and 4 flat teeth (a 4 mm gap between the middle two); lower 2 tusks of 4.5 cm curving up outside the lip and 2 teeth, one chipped flat |
| Goatee | from the chin knob, 0.22 long | 9 locks #6a5a48 paling to #a89878, frost on 4 tips |
| Horns | roots (-0.11 and +0.11, 2.02, 0.20); 0.92 along the curve, 1.2 turns: up and back 0.30, out, down and forward, tips beside the cheeks at (-0.36 and +0.36, 1.86, 0.30); highest point y 2.50 at z -0.02; span 0.86; base oval 0.105 x 0.085 with a front keel, tip 0.02 | HORN. 32 raised growth rings each, pitch 4.0 cm at the root to 1.6 at the tip; 2 shallow grooves along the outer face; tips polished dark #3a2c22; the left tip chipped by 3 cm, the right horn notched 6 cm at ring 9; frost on every upward face, a 2 cm snow pad on top of each curl. No point of a horn is more than 0.30 behind the atlas |
| Ears | goat ears at (-0.19 and +0.19, 1.90, 0.18), 0.17 long x 0.07, out and a little down | fur outside, bare #6a4a3a inside with 3 vein lines; a nick in the left |
| Tongue | root (0, 1.67, 0.40); 0.075 wide at the lips, 0.03 near the tip, 0.012 thick; length by `tongue` | TONGUE, wet: one gloss stripe off centre, a centre groove, 11 faint cross creases, wavy edges, underside #e0787a, a rounded tip curled 0.04 forward |
| Fur | the skin painted with 900 fur strokes (each once) under 240 modelled locks that break every outline | FUR. Locks 4-9 cm wide, pointed, 3-5 strand lines each, stuck together in twos and threes, hanging plumb in every pose: crown and nape 24 (0.14-0.22 long), ruff round the face 18 (0.16-0.26), shoulder cape 44 (0.40-0.55), chest and belly 36 (0.25-0.38), arms 2 x 20 (0.18-0.30), hip skirt 38 (0.30-0.45), legs 2 x 20 (0.20-0.32). 30 locks carry a lighter strand, 12 a grey one #6a6460; 6 rubbed patches (both elbows, under the 3 straps, the belt line) of matted underfur #3c2c20 |
| Frost, snow | on him from frame 0 | 60 lock tips FROST on crown, cape and forearms; 30 ice beads of 1-2 cm on cape and ruff tips; snow pads 3 cm on both shoulders and the hump, 2 cm on the lid; 6 lumps fall on each `jam` |
| Belt, straps | belt 0.09 wide at y 1.10, pressing the fur in; a cross strap 0.07 from the right shoulder to the left hip; 2 basket straps 0.05 over the shoulders | leather #4a2c1a, edge #2a1a10, worn #7a5234; 2 stitch rows (60 stitches on the belt's front); an iron buckle 0.12 square; 9 brass rivets on the cross strap; a BRASS buckle on each basket strap at chest height |
| Chain, bells | a chain from the belt ring at (-0.30, 1.10, 0.26) to the ring at (+0.36, 1.08, 0.10), sagging to y 0.90: 22 oval links (0.055 x 0.035, wire 0.009), every second one turned 90; 3 cowbells on 3-link drops at links 6, 11, 16. From the LEFT manacle 14 links hanging 0.62 with 2 small bells | iron #2a2420, rust #6a3a22, orange bloom #a85a2a on 12 %. Cowbells of hammered sheet BRASS with a flattened oval mouth: 0.19, 0.17, 0.15 tall (0.15, 0.13, 0.12 wide, 0.10 deep), the small two 0.11 and 0.09. Each: a leather loop, 30 hammer dimples, a rolled lip, 2 side seams of 5 rivets, a rubbed bright band round the belly, an iron clapper ball 2 cm below the lip; an edelweiss engraved on the biggest. 5 bells, 45 links, none merged into a bar |
| Birch | in the RIGHT fist a bunch of 7 sticks 0.50 long bound with 3 turns of twine #b89a62 0.10 from the butt; 3 spare bunches under the belt at the right hip | BIRCH: 5-8 dark dashes a stick, 3 curls of peeling bark a bunch; the outer third of each stick forks once into dark twigs with 2 buds |
| Basket | on his back, upright at stand: base oval 0.46 x 0.40 at y 1.30, rim oval 0.66 (x) x 0.56 (z) at y 2.08, centre z -0.66 | WICKER, old willow: 28 stakes, 46 weaver rows drawn over and under (each row shifted half a stake), a 3-rod braided rim 0.035, a foot ring; 2 leather belts round it at y 1.52 and 1.86 with brass buckles (panel 07); 6 broken weaver ends, a repair patch of paler willow (5 rows x 6 stakes) on its left; inside #1a1210 |
| Lid | a shallow dome 0.70 x 0.60, 0.12 high, on 3 leather hinge loops at the BACK rim (z -0.94): the free edge is the one behind his neck | a spiral of 14 turns from a centre knot, a braided edge; OUTSIDE weathered #7a5a32, UNDERSIDE pale new willow #dcb87a; a wooden toggle on a leather loop at the front; its 2 cm of snow slides off at `lid` 0.3 |

Pivots (stand): hips (0, 0.98, -0.02); neck base (0, 1.70, 0.04); atlas (0, 1.80, 0.14); lid hinge line y 2.08, z -0.94.

| Param | Pose at 1 | Used |
|---|---|---|
| `stoop` (0) | over a doorstep boot (panels 02, 11, 23): the spine pitches 42 degrees about the hips, the hocks bend (hips -0.06), the head 20 degrees further down: crown 1.60, horn tops 1.98, M (0, 1.24, 0.98). The basket rides up over his back: rim centre (0, 2.17, 0.24), its mouth tipped 42 degrees toward +z: it looks down at whoever stands 1-2 m in front of him | 0.8, 21.5, 66.0 |
| `nose` (0) | the neck stretches up and forward (atlas +0.10 y, +0.14 z), the face tilts up 28 degrees, ears prick (panel 15): crown 2.16 | 36.0 |
| `sniff` (count) | a whole number is rest; between: the nostril slits widen 4 -> 9 mm, the bridge cuts deepen, the shoulders rise 2 cm, 2 short wisps are drawn INTO the nose | 36.0 |
| `twist`, `headYaw`, `headPitch` -1..1 | the chest turns 30 degrees about the spine; the head 65 and 30 degrees about the atlas (the neck takes 40 %); ruff, goatee, tongue and bells follow 0.12 s late | 36.0-40.5, 66.0 |
| `gait` (count), `slope` (degrees, 0) | a heavy two-legged goat walk, 1.10 m a cycle (two steps of 0.55): move him 1.10 m a cycle along his heading, a planted hoof never slides. Planted 60 % of a cycle; the lifted hoof rises 0.12; the body sways 5 degrees and dips 3 cm; arms swing 12 degrees; each footfall swings the bells once and bobs the basket 2 cm. Whole and half numbers are planted stances; x.25 and x.75 hold one hoof in the air (the mid-step freeze of 36.0 s). `slope`: hooves land on ground pitched that much along his heading (ramps: -11.3 going down) | |
| `jam` (0) | the stick hand: 0 at the hip, 0.5 raised to the shoulder with the bunch upright (panel 06), 1 driven down to spec `jamAt` (his frame; default (0.15, 0.34, 0.85) = the teal boot's mouth from K4; door 9 (0, 0.24, 0.85), door 8 (0, 0.29, 0.85)). The last 30 % takes 3 frames; the shoulders drop 4 cm | 0.8, 10.0, 21.5, 66.0 |
| `bunch` (1) | the bunch in the fist. At `jam` 1 the director sets it 0 and E's `sticks` 1 on the same frame: the bunch stays in the boot. Back at the hip the hand takes a spare (1 again, one fewer under the belt; spec `spares` 3) | |
| `tongue` (0.35) | 0 inside, the mouth can shut; 0.35 the loll of most panels, 0.28 long; 1 unrolled to 0.72 (tip at y 1.00 standing; at `stoop` 1 it hangs 0.2 above the boot). Director: 0.35 -> 1 in 12 frames, back-out ease, 6 % overshoot | 10.0 |
| `lick` (count) | a whole number is rest; within one: 0-0.3 the tongue stretches up and forward 0.40 (tip at (0.10, 2.05, 0.85) with `nose` 1), 0.3-0.7 the tip curls round a flake and sweeps 0.25 from his right to his left, 0.7-1 it snaps back to the loll; 3 flakes stick and melt | 36.0 |
| `jaw` (0), `breath` (0) | jaw 32 degrees. Breath: 4 cel puffs #dfe6f2 at 0.40 from the nostrils on each exhale (0.5 Hz, 1 Hz at 1), 0.12-0.30 across, reach 0.7 m; 2 wisps off the tongue past `tongue` 0.5; the flanks heave 2 cm always | 10.0 |
| `lids` (0.3), `glow` (0.5), `lookX`, `lookY`, `ears` -1..1 | lids 0 wide .. 1 shut; eyes emissive with a 5 cm halo #ffc23a at 1 (the brightest warm point in his silhouette); pupils; ears flat back .. pricked | |
| `ring` (0) | the bells swing 22 degrees (big 2.1 Hz, small 2.9 Hz), each clapper a quarter cycle late and striking the lip (the visible cause of the clang); the chain sways 4 cm. At 0 and standing they hang dead still: the stillness IS the beat at 55.0 s | 44.0, 55.0 |
| `lid` (0) | 0 shut .. 1 open 75 degrees; the toggle slips its loop at 0.02; the free edge travels 0.73 m | 0.8-2.6, 66.0 |
| spec `mirror` | true: bunch, jam and spares on the LEFT, the wrist chain and the `stow` claw on the right (doors 9, 8 and 5, where he faces up the lane: the working hand stays on the camera side) | |

One body pose at a time (stoop, nose); everything else goes on top. At a door he faces ALONG the lane with his
origin at z +1.10: horns (z 0.67..1.53) and basket (0.77..1.43) clear the balcony line in every pose. The builder
gives the director the world place of the stick butts, M, the tongue tip and the lid's free edge for any state (as
monsterMouth does).

**The lid toward Spud** (66 s, panel 23 fixed): at K4 he faces +x, at Spud beyond the boots; at `stoop` 1 the basket
hangs over his shoulder with its mouth toward Spud. Director: `lid` 0 -> 0.25 in 6 frames, hold 3 (the creak),
-> 0.6 in 8, hold 3, -> 1 in 8, then a 4 degree bounce: 0.93 s. Door 4's lantern lights the pale underside: as seen
#e9c98a against sky #0e1630 or timber #3c2616, 260 px of travel in a frame 3.0 m wide. Nothing else moves in those
28 frames but the bells settling.

**The door-9 kid** (built inside `krampus`, spec `kid` true; he is only ever seen in the basket; panels 02, 07). A
tiny potato, 0.43 standing: an egg 0.34 x 0.30 x 0.27 on 0.09 legs, Spud's skin #e2a95c, one small leaf 0.03 flopped
forward, eyes ovals 0.03 x 0.04, brows up. A RED SCARF #c8322e (22 knitted rows, wound twice, 2 ends of 0.16 with 7
cream tassels each); cream mittens on a string that runs behind his neck; ONE red suede boot with a white fleece
cuff on his right foot and a sock with 5 red and cream stripes on his left: the other boot is the one on his step.
From 2.6 s one scarf end hangs out under the shut lid, to the last frame.

| Param | What |
|---|---|
| `stow` (1) | 0: he dangles by the back of his scarf from the Krampus's left claw at (0.30, 2.40, -0.40) over the open basket, feet pedalling; 0 -> 1 in 10 frames: the claw opens, he drops 0.5 m in 5 frames, the basket dips 3 cm, the arm comes down. 1: he sits inside |
| `kidPeek` (0) | 1: head, scarf and both mittens over the front rim (panel 02); 0.5: eyes only; 0: down inside. Default at 66 s: 0.5, his eyes on Spud |
| `kidTalk` (0) | mouth, a line to an O 0.03 ("I was gonna be good tomorr-": the lid shuts on it) |
| `kidKick` (count) | upside down: both legs out between lid and rim, the lid resting on his shins 8 degrees open; 2 kicks a count, each foot 25 degrees, the lid bumps 3 degrees a kick (panel 07: one boot, one sock) |

**His shadow** (kind `krampusshadow`, panel 01): a flat shape on two planes, the apron (out to z +1.5, past the boot
at z +1.10) and the door above it, bent 90 degrees where they meet; origin the foot of the door under the shape's middle. Drawn from HIS outline at `stoop`
0.3 and `jam` 0.5: both horn curls, an ear, 34 lock points along the edge, the raised fist with 7 stick lines, the
basket hump, the hanging chain with 2 bell shapes. #0b0e22 at 0.78, edge blur 3 cm, stretched 1.35 along x (the
low moon). `grow` 0..1: it slides in from screen left and up the door; at 1 the horn tips reach y 1.55 on the leaf
and the body lies over the boot (E's `shade` darkens the boot with it). `sway`: horns rock 3 degrees, the bell
shapes swing at 2.9 Hz. It falls the way the moon throws it: down the lane, ahead of him.

**Runner copies** (F): spec `runner` true = the same build with no basket, kid or wrist chain, a torch in the fist
in place of the bunch (`jam` 0.5 holds it high) and the 3 belt bells. `seed` picks fur of 5 (FUR, chestnut #5a3a22,
grey #6a6460, cream #cfc4a8, black #1c1a1c), horns of 3 (the ram curl, a goat sweep 0.70 curving back, a tall lyre
0.60), mask of 4 (MASK WOOD, ox-red #7a2a1e, grey-green #4a5a48, bone #cfc4a8), height 1.72-2.08, `tongue` 0.2-0.7,
`stoop` 0-0.25 and the gait phase; 1 in 4 has a second small horn pair. `lod`: "near" all of the above; "mid" 90
outline locks and no gouge strokes; "far" a painted figure from 6 drawn walk poses.

## C. SAINT NICK (costume `stnick`, file `characters/krampus-myth/nick.json`; panels 02, 05, 11, 22)

Base: Spud's body block unchanged (0.88 x 0.76 x 0.66, glove 1.3, Spud's skin and eyes) cast at scale 1.22: 1.24
standing, 0.93 wide. Every pose proven on Spud holds, `kneel` included. limbs #f3ede0 (white gloves; the legs never
show), sprout none, cheeks #ff8f8f at 1.3. An old kind potato, a little tired: resting lids 0.55, inner brow ends up
6 degrees. Heights below are body-local on the 0.88 block (world = 1.22 x this + 0.17). Assumed face points: eye
line y 0.60, lip line y 0.36: the builder measures them on the rig and shifts the face pieces by the difference.

| Piece | Size, where | Detail and colour |
|---|---|---|
| Mitre | band lower edge y 0.73 (0.13 above the eyes), peaks at y 1.20; front and back shields 0.30 wide at the band, 0.36 at y 0.92, a cleft 0.07 between the peaks | ROBE RED velvet with a nap sheen band. GOLD bands: a vertical one 0.055 wide up each shield and a circlet 0.05 round the head, both edged with twisted cord 0.006; vine scrolls in them (5 on the vertical, 9 on the circlet's front), each a spiral of 1.5 turns with 3 leaves; a 6-petal gold flower 0.05 with a pearl centre in each red field (4 on the front shield); 14 seed pearls r 0.006 along the vertical band; gold piping on the outer edges and a bead on each peak. 2 lappets 0.06 x 0.30 from the back band to y 0.44, 3 small flowers each, a gold end bar and a fringe of 9 threads. 2 cm of snow on the cleft |
| Brows | over the rig's brows, moving with them | 2 tufts of 7 white locks, 0.09 wide |
| Moustache | from the lip line's middle out and down, 2 wings 0.13 long, tips curled up 0.02 | BEARD, 6 strand lines a wing; it hides the mouth line |
| Beard | top edge on the cheeks at y 0.46, under the mouth 0.33; down to a soft double point at y 0.04; 0.46 wide at y 0.28, 0.07 off the face at the chin | BEARD. 19 locks: 7 long centre ones and 12 side ones, each 3-5 strand lines and 2 half-waves, tips curling out by turns, 3 locks crossing a neighbour; the lowest third takes the book's light (#ffe2a0 at `nick.glow`) |
| Hair | from under the mitre at the temples and nape to y 0.50 | 12 white locks |
| Cope (the bishop's cloak) | hangs from a collar line at y 0.56 round the back and sides to a hem at y -0.12 (2 cm off the ground); open in front: the edges 0.20 from the centre at the top, 0.30 at the hem (face, beard, hands and book stay free) | ROBE RED velvet, lining gold silk #d9a43a where an edge turns back. 9 broad folds from the collar. Front bands 0.10 wide on a darker ground #6e141c: a running GOLD oak vine with 11 leaves and 6 acorns a band, edged with gold cord (panel 22). A hem band 0.06 with 40 gold lozenges. A damask of 16 gold lily sprigs 0.08 on a half-drop lattice 0.16, only 20 % brighter than the red. A white ermine roll 0.025 on the collar. On the back a shield 0.26 x 0.30 with an embroidered picture: 3 gold balls over a small boot |
| Alb | under the cope: seen in the front opening, at the cuffs and 3 cm under the hem | ALB linen, 9 fold lines in the opening; sleeves ending 0.14 before the hand's centre in a lace edge of 14 scallops; a gold rope round it at y 0.22 with 2 tassels 0.12 on his right |
| Gloves | the rig's hands | white, a gold quatrefoil 12 mm on the back of each, a gold ring with a red stone over the right middle finger |
| Hang points | LEFT hip (0.33, 0.20, 0.12): the shut book on its chain; RIGHT hip (-0.33, 0.20, 0.12): the sack on the rope | both show in the cope's opening from 0.8 s |

- Keys: `nick.smile` 0..1 (moustache tips up 12 degrees, cheeks lift, the rig's eyes to happy arcs: 55 s);
  `nick.talk` (the moustache lifts 6 degrees and the beard wags 2 with the rig's speech); `nick.glow` 0..1 (the
  book's light on beard and brows); `nick.kneel` follows the rig's kneel: the hem spreads into a pool 1.25 x wider
  with 7 puddled folds and trails 0.18 behind.
- Gestures (the costume stays clear in each). (1) READ: the open book on the left palm and forearm, its middle at
  world (0, 0.44, 0.52) in his frame, top edge at y 0.58 (0.03 under the lip line), tilted 50 degrees to his eyes;
  the right index finger runs down the right page; lids 0.8. (2) HEAD SHAKE: the body yaws 9 degrees each way twice
  in 20 frames, eyes shut; lappets and beard tip lag 0.1 s; the 0.47 of mitre makes it read at 60 px. (3) KNEEL AND
  POUR (panel 22): kneeling, the book on its chain at the hip, the sack in both hands 0.20 above the boot's cuff.
  (4) THE LONG PAGE (61-66 s): READ, then the eyes follow the roll out across the lane and come back up slowly.

## D. NICK'S THINGS, one file: GOLDEN BOOK (`goldenbook`), CROOK (`nickcrook`), SACK (`nicksack`)

Book (panels 02, 05, 11, 23). Shut 0.30 wide x 0.40 tall x 0.09 thick; open 0.62 wide. Origin: the foot of the spine.

| Part | Detail and colour |
|---|---|
| Covers | GOLD, boards 0.008 proud of the pages. A raised frame 0.03 with a rope moulding of 64 twists; 4 corner bosses (8 lobes, r 0.022); a centre medallion r 0.07: 3 balls over a boot in relief; 16 tooled vine scrolls (4 a quarter), 3 leaves each. Worn to bronze on the corners and where his thumbs rest (lower outer edge of each cover) |
| Spine, edges | 5 raised bands, a rosette in each of the 4 panels between; page edges gilded with a 5 mm lattice; head and tail bands of 12 red and gold stripes; 2 clasps 0.02 wide that hang open while it is open; a crimson silk ribbon 0.012 hanging 0.10 with a forked end; a chain of 16 small links from the spine's foot to his rope belt |
| Pages | parchment #f6ecd2, shade #d9c9a3; about 180 leaves as 2 stacks with a gutter curve, 3 loose edges a side. WRITING IS PICTURES: 2 columns of 6 ink pictures of 0.035 (brown line #5a3a22, 2 washes) between thin red rules, a gold-leaf flower where an initial would be. Ordinary pages: 12 pictures from a kit of 10 small potato deeds |
| The GOOD page (55 s) | only its top third is filled: 4 pictures of a one-leaf potato in teal (watering a plant, carrying an old potato's firewood, sharing a sandwich with a small yellow two-leaf potato, holding a door), a gold-leaf line under them, clean parchment below. It is the page that glows |
| The LONG page (61-66 s, panel 23) | one sheet 0.26 wide that leaves the book as a roll (0.075 across on a wooden spindle) and unrolls to 3.20 m: 13 rows 0.24 apart of 4 pictures each = 52 fries cartons (red and white stripes, 6-8 yellow fries), a small yellow two-leaf potato reaching into each in 4 poses; the last row's 4th carton is only an ink outline: he is still on it |

| Param | What |
|---|---|
| `open` (0) | 0 shut .. 1 open 150 degrees |
| `page` (count) | each +1 turns one leaf right to left in 8 frames: it lifts, bends 30 %, falls; whole numbers rest |
| `glow` (0) | the open pages emissive #fff0c0, a glow card r 0.5 at 0.40, one real light #ffe2a0 of range 1.6 at the gutter (set `nick.glow` with it) |
| spec `spread` | "plain", "good" or "long": the two pages shown |
| `run` (0), spec `roll` [dx, dz] ([0.15, 1]) | length 3.20 x run. The roll tips off the page and drops the 0.30 from the book's lower edge to the apron (there at run 0.09), then runs along the ground in world direction `roll`, drapes over the apron's step and crosses the lane toward the camera, shrinking to its spindle; the hanging part sways 3 degrees. Director: 0 -> 1 in 3.5 s, linear: it must still be rolling when the cut comes |

Crook: 1.50 tall. GOLD shaft 0.030 with ring knops at y 0.50, 0.95 and 1.12; a 6-lobed knop r 0.04 at y 1.15 with 6
small red stones; the volute 0.24 across, 1.6 turns, tapering 0.030 -> 0.012, 7 leaf crockets on its outer edge, a
curled leaf end, a 6-petal flower r 0.03 inside the curl; an iron spike 0.10. Worn to bronze at y 0.50-0.75 and on
the knops. Holds: FIST (right fist at y 0.60, the shaft in front of the forearm, the spike 0.25 ahead and right of
his foot); PLANTED (it stands 0.10 deep in the snow 0.45 to his right, leaning 4 degrees, a snow collar r 0.06).

Sack: unbleached linen #d9c9a3, 0.30 tall x 0.22 wide full, tied with a red and gold cord; a darker patch with 12
stitches; the cloth shows 3 round bulges and 5 coin edges; the mouth 0.14 with a rolled rim shows 3 coins, 1
mandarin and 2 walnuts (E). `full` 1 -> 0.4 slumps it as it empties; what falls out is E's `ktreat` pieces.

## E. BOOTS (`kboot`), CRAYON DRAWINGS (`bootnote`), TREATS (`ktreat`), one file

Boot origin: the ground under the heel's middle; toe toward +z. Spec `style`:

| Style | Size | Detail and colour |
|---|---|---|
| "felt" teal (Spud's; panels 03, 13-24) | 0.30 tall; sole 0.24 x 0.105 x 0.022; shaft 0.135 across at the cuff, 0.125 at the ankle; toe box 0.075 high | TEAL FELT 12 mm thick with a rolled cuff 0.035; 220 fibre strokes of 3-8 mm at 6 % contrast, 30 pilling dots; a blanket-stitch seam up the back and round the vamp, 38 stitches of cream wool #efe6cf (6 mm long, 9 mm pitch); a leather heel patch with 8 stitches; a pull loop; a welt of 44 stitches on a dark sole #2a3a44; cream fleece at the cuff (16 tufts); a small leather patch #9a6a3c with 10 stitches on its left side (Spud's elbow patch) |
| "felt" yellow (Chip's; panels 08-10, 12-24) | 0.26 tall (the teal one at 0.87) | YELLOW FELT, the same making; a cream cord threaded round the cuff and tied in a bow with 2 ends of 0.05 (his drawstrings); a red stripe #b43a23 round the sole edge (his trainers) |
| "leather" (door 8; panel 11 fixed) | 0.25 tall | a child's lace-up in RASPBERRY #d9487e (shade #9a2a56, light #ff9ac0): no other thing in the film has this colour. 7 pairs of brass eyelets, cream laces in a double bow, a tongue, a toe cap with 9 punched dots, a stacked heel 0.02 #5a2a3a, a welt of 40 stitches, a white cable-knit sock cuff of 12 ribs folded over the top. Its `shine` is 1 from its first frame |
| "suede" (door 9; panels 01, 02) | 0.20 tall | red suede #b8322e, a white fleece cuff 0.04 (22 tufts), a paler scuff on the toe, 2 white pompoms r 0.018 on cords: the pair of the boot on the kid's foot |
| "rubber", "furtrim" + the above (the 13 lane boots) | per the house table | rubber: glossy, a moulded sole, a pull tab; furtrim: suede with a fleece roll; each with 3 snowflakes melted to dark dots on the toe |

| Param | What |
|---|---|
| `mud` (0; yellow boot 1 from frame 0 until 16.5 s) | on 22 % of the surface, the lower 40 % only (cuff and the shaft front under the drawing stay yellow): 9 patches #5a4226 with a dry edge #8a6e48 (3 with a wet gloss), 16 splash dots up to mid shaft, a crust 6 mm thick on the sole rim, 2 stuck straws, 1 leaf. Going down, patches shrink from their edges in index order, toe first; 12 crumbs fall to the step and stay |
| `shine` (0) | the nap lies flat: base 6 % more saturated; a window-shaped highlight 0.030 x 0.018 #fff6d0 on the toe cap, a streak 0.11 long down the shaft, a rim line on the cuff; the nearest lantern mirrored as a small warm lantern shape (0.030 x 0.045 on the shaft, 0.016 x 0.024 on the toe) and a horizon line across the toe, snow blue under it. The SAME shapes on Chip's boot at 1 and on door 8's: the two polished boots rhyme, so "a clean boot gets sticks anyway" reads |
| `glint` (0) | one white streak crosses the shaft in 6 frames (20.0 s) |
| `droop` (0), felt only | the shaft folds over at the ankle by 70 degrees (panel 12) |
| `sticks` (0) | B's bunch of 7 standing in the boot: butts down, 0.26 out above the cuff, fanned 14 degrees, the twine 0.06 above the cuff, 2 sticks leaning further out; a drawing on the boot is pushed 4 degrees outward. On: a 4-frame settle, 3 degrees of shake, 2 bark curls fall |
| `treats` (0) | a heap rising to 0.07 above the cuff, pieces arriving in index order: 7 chocolate coins, 3 mandarins, 4 walnuts = 14, as `ktreat` below; 2 coins stand on edge, one mandarin keeps its stem and leaf |
| `shade` (0) | the boot under his shadow: 45 % darker and cooler |

`ktreat` (spec `type`; a physics body when it falls from the sack, hidden once below the cuff): "coin" 0.048 across
x 0.007, gold foil #f2c64a with 40 milled notches and an embossed pine tree (4 of 7) or star-flower (3 of 7);
"mandarin" 0.058, #f08a1e, shade #c9601a, light #ffc266, 40 pore dots, a green star calyx; "walnut" 0.036 x 0.030,
#b08a5a, shade #7a5a36, a seam and 12 wrinkle lines. The coin has `peel` (the foil opens in 5 petals on chocolate
#4a2a1a) and `bite` (an arc with 3 tooth scallops): Chip's at 71.5 s, pinched at shoulder height, `peel` 1, `bite` 1.

**The two drawings** (`bootnote`, spec `who`; panels 03, 13, 20, 21, 24 fixed). One held thing: the paper and its
clothes peg; the swap carries both. Origin and grip: the peg's top. Three cues tell them apart, so the swap reads
even at 60 px: paper COLOUR, paper SHAPE, the FIGURE.

| | Spud's (starts on the teal boot) | Chip's (starts on the yellow boot) |
|---|---|---|
| Paper | TEAL PAPER, portrait 0.150 x 0.200 | YELLOW PAPER, landscape 0.185 x 0.165, a dog-ear 0.028 at the lower right |
| Figure | a TALL EGG 0.080 x 0.100, golden #e2a95c scribble in a brown line #5a3a22 | a ROUND BALL 0.085 across, the same golden and brown |
| Leaf | ONE big leaf 0.040 x 0.022 #4fae2e on a short stem, leaning right | TWO leaves in a V, 0.032 x 0.016 each, 70 degrees apart |
| Garment | the lower 45 % in dark teal #1f6f6c zigzag: 5 knit V marks, a rolled collar line | the lower 55 % in orange-yellow #f59e00 zigzag in a brown line: a U hood collar, 2 WHITE drawstring strokes 0.020 ending in dots |
| Face, arms, feet | 2 dot eyes, a small calm smile; stick arms DOWN with rake hands of 3 fingers; 2 brown boot blobs | 2 dot eyes with brow dashes, a huge open grin (a D, red #d9483a inside); stick arms UP in a V; 2 white trainer blobs, a red stripe on each |
| Rest | a green ground scribble; a white crayon cloud top left | an orange ground scribble; nothing else: the figure fills 80 % of the sheet |

- Crayon: wax strokes 4-6 mm wide, the paper showing through 15 %, darker at each stroke's end, the colouring
  overshooting its outline by 2-4 mm in 3 places. Paper: 40 fibre flecks, one fold line across the middle, the
  lower edge curling 6 mm; 25 % self-light so it holds its hue under the lantern: as seen never warmer than #a9d8c0
  (teal) and never paler than #fff0a0 (yellow): 118 degrees of hue apart as painted, never under 95 as seen.
- Peg: beech #e3c690, 0.072 x 0.011 x 0.012, two halves, a steel spring of 3 turns. It grips the cuff 35 degrees
  round from the toe, so with the boot at rot -35 the paper faces +z; the paper hangs outside the shaft, 8 degrees
  off plumb.
- Before the swap each paper sits on its own colour, lighter than its boot (teal on teal, yellow on yellow). After
  (53 s on): yellow paper on the teal boot, teal paper on the yellow boot, every colour crossed. The teal paper is
  0.06 too long for the 0.26 boot: its lower edge kinks 15 degrees outward on the instep.
- Params: `flutter` (0.1): the lower edge lifts up to 10 degrees at 1.3 Hz (1 while he is next door). `swing`: 8
  degrees decaying over 0.5 s after it is clipped on (the director pulses it).
- Sizes on screen: a frame 2.65 m wide (Spud, Chip, both boots) gives papers 61 and 75 px wide; the swap close
  (camera (1.1, 0.75, 3.6) -> (1.1, 0.30, 0.95), fov 30: frame 0.81 m wide) gives 200 and 247 px, boots 400 px tall.
  Under 60 px of paper width the boots are not carrying the story: do not cut to such a frame for a boot beat.
- Holds on the yellow boot (panels 08-12): one glove under the heel, one on the shaft's far side; polishing: the
  left glove on the shaft, the right cuff rubbing the toe cap in strokes of 0.12, 4 a second.

## F. KRAMPUS RUN (kind `krampusrun`; panel 19, 46.5-51.0 s)

Stands 300 m or more from the lane (e.g. x 400) and brings its own ground, sky and lights (off while hidden). Origin:
the middle of the parade lane; the parade walks toward +z, at the camera.

| Part | Where | Detail |
|---|---|---|
| Parade lane | x -2.75..+2.75, z -40..+8 | trampled snow #b9c4d6, slush ruts #8f9ab0, 300 hoof prints, a torch streak #ffb060 at 0.30 under each near flame |
| Ropes (new: no brass, no velvet) | x -2.75 and +2.75, z -18..+8 | 11 larch posts a side, 0.10 square x 0.95 with pyramid tops and snow caps, 2.6 apart; a 3-strand hemp rope 0.035 thick #b89a62 sagging 0.10 between, 9 twists a metre drawn |
| Runners, near | 8, at z +3 - 2.4 i, x -1.2 and +1.2 by turns, shifted up to 0.5 by hash | B at `lod` near, seeds 1-8, never two neighbours with the same fur or horns |
| Runners, mid / far | 16 at z -17..-34 / 72 painted in 6 rows at z -36..-80, then 140 torch points up the street | `lod` mid / far |
| Torches | one a runner | a pine shaft 0.55 with a wrapped pitch head; the hall's flame at 0.30-0.42, 6-9 sparks, a smoke ribbon 1.2 m, a glow card r 0.8 #ff9a3a at 0.40; a warm haze #ff9a3a at 0.08 over the lane at y 2.5-5 |
| Onlookers, front row | 14 built figures, 7 a side, x 3.3..3.9 from the middle, z -8..+6 | potato people with Spud's skin, eggs 0.62-0.92 tall, 3 kids of 0.40-0.50 at the rope (one on a parent's shoulders). Coats in 7 colours (plum #6a3a5a, forest #2f5a44, navy #2a3f6a, rust #a8502a, mustard #c9962e, grey #6a6e78, cream #e6dcc6) with 2 toggles each; scarves of 5 stripes; 12 bobble hats (pompom r 0.04, 3 with ear flaps), 2 hatless with their leaves; mittens. 5 hold up a phone 0.07 x 0.14 whose lit screen shows a horned dot; 1 holds a paper cup (reused); 1 kid peeks with one eye round a parent's coat, 1 covers his eyes with a gap between the mittens, 1 points. Torch orange on the lane side, moon blue behind |
| Onlookers, back rows | 2 x 30, behind the front row to x 7 | reused `visitorcrowd` |
| Church | (+9, -46) | white plaster, a tower 26 m with an onion dome in copper green #4f8a7a under snow, 2 louvred bell openings, no clock; a lit round window with 8 spokes |
| Square | round the lane | 9 house fronts from A's kit with plaster ground floors, 38 lit windows; a fir 7 m at (-8, -30) with 90 warm bulbs; A's sky and hero peak (the same valley) |

Real lights: the 4 nearest torches (#ffb060, range 7); every other flame painted, with a baked pool r 1.8 on the snow.

| Param | What |
|---|---|
| `march` (count) | gait cycles: every runner advances 1.10 m a cycle toward +z, phases hashed; about 1.3 cycles a second |
| `torch` (1), `ring` (0.8) | all flames, glows, pools and lights; every runner's bells |
| `cheer` (0.5) | onlookers bob 2 cm at 1.1 Hz, phases hashed; at 1 a third of them raise both arms |

Camera (start): (0.4, 1.15, +7.8) -> (0, 1.35, -4), fov 46: the frame is 2.29 m wide at the lead runner (4.8 m away),
he stands 940 px tall, his mask 150 px, the 2 files behind him stacked up the frame to the church.

## 7. LOOK: light per act

Night comes from the set's own lights, not the look's night switch. Cast skin never reads darker than #a8733a (cast
colours stay); no depth of field; vignette 0.25. The painted moon sits up the lane (A); the KEY comes from 30 degrees
further to the front so house fronts and faces are lit: a deliberate cheat. His real shadow on the snow falls down
the lane and toward the doors, ahead of him.

| Act | t (s) | Key (direction TO the light, colour) | Fill sky / ground | Params | As seen | Frame mean |
|---|---|---|---|---|---|---|
| Hook, door 9 | 0-2.6 | moon (-0.62, 0.47, 0.63) #b9cdf5, key to fill 2.5 to 1; door 9's lantern | #26386e / #7f95c4 | `lit` 9, `tense` 0.6 | snow #cfdcf2 lit, #7f95c4 shade; the lantern pool #ffcf8a round the red boot; the shadow #0b0e22 at 0.78 | 24 % |
| Door 4, the rules | 2.6-14.5 | same; the hall wedge #ffc766 behind the cast until the door shuts | same | `door4` 1, `lit` 9, `tense` 0.2 | warm rim on both, the snow bounce on their faces | 30 % |
| Polish, false close 1 | 14.5-30.5 | same; door 4's lantern as the cast's key | same | `lit` 8 at 21.5 | the two shines match; raspberry #d9487e the only pink | 30 % |
| Hide and sniff | 30.5-44 | moon x 1.1, fill x 0.8 | x 0.8 | `tense` 0.7, `snowfall` 0 -> 0.6, his `glow` 1 | he is a near silhouette with a cold rim; his eyes the brightest warm points outside the lanterns | 22 % |
| Next door | 44-46.5, 51-55 | as the rules act | same | `lit` 5, `shake`, `tense` 0.5 | he stands 0.8 m above them in frame | 26 % |
| Torch square | 46.5-51 | torches #ffb060 from below and both sides; moon rim | #3a2a2e / #6a5a6a | (F) | the only orange picture of the film | 38 % |
| Chocolate | 55-61 | book `glow` 1 as Nick's and Chip's key #ffe2a0; lantern x 1.2 | ground #ffcf8a | `tense` 0, his `ring` 0 | candle gold (panel 22): foil #f2c64a, beard #fff3d6 | 40 % |
| The long page | 61-72 | book `glow` 0.3; lantern x 0.8; moon x 1.1 | x 0.8 | `tense` 0.8 | cold again (panels 23, 24): the pale strip #f6ecd2 and the lid's underside #e9c98a are the two lightest shapes | 24 % |

## 8. REUSED as they are

Spud (`characters/potatobrawl/spud.json`) and Chip (`chip.json`): skin, costume, sizes untouched; the potato rig and
its `kneel` for Nick. The grey tabby `cat` (props-bedroom.js) at scale 0.75 with `streak`, one request: a spec flag
that leaves its 5 speed lines out. `iciclerow` and `icicle` (props-survive-snow.js) for every icicle, `firewood` at
0.6 for the 9 loose logs, `choppingblock` at 0.7. The white-capped fir of set-snowslope.js for every fir; the chimney
wisp of `cottagesled` (props-avalanche.js). `noterain` look "snow" (props-flood.js, r 3, n 200) for the flakes round
his tongue at 36 s. The torch flame, sparks, smoke ribbon and glow of props-heart-hall.js for the run's torches and,
at 5 cm, the lantern candles. `visitorcrowd` (props-sh-far.js) and `cocoacup` (props-winter.js) in F. The build of
the heart monster and the bear (one lofted skin, a gait with planted feet, breath puffs, a point function) for B.
The GOLD LEAF rule and palette of egypt-myth 01. The cut-off cuff and neck logic of costumes-judge.js and the beard
mass of costumes-plato.js for C. NOT reused: `exhibitrope` (brass and velvet in a village square), the xmasroom
cat basket (too plain for his back), `streetlamp` (a post, not a wall lantern).

## 9. ORDER, builder time, count checks

Nothing ships crude. The floor plan, marks, sizes and params above are frozen, so staging can start from the numbers
while the looks are built. Each look has a bench sheet; the reviewer counts on it:

| Piece | Share of builder time | What takes it | Count check on the bench sheet |
|---|---|---|---|
| A lane | 34 % (house kit and 9 variants 14, door 4 with pile and hall 6, lane, wall and fountain 5, far and sky 5, snow, icicles, lanterns 4) | 9 houses that are not copies; snow on every ledge; the pile's 132 ends | 9 plaques whose parts count 9, 8, 7, 6, 5, 4, 3, 2, 1; a house: 40 baluster boards, 5 brackets, 11 rafter tails, 33 scallops, 38 icicles, 22 nails; 9 lanterns, 14 lit windows, 9 chimneys; 132 log ends, 9 loose logs; fountain 29 icicles, 3 rosettes; 13 lane boots; 420 stars |
| B Krampus, kid, shadow | 30 % | the fur that hangs plumb in every pose, the carved face, the basket and lid | 240 locks (24 / 18 / 44 / 36 / 40 / 38 / 40); 150 gouge strokes, 3 checks; 10 teeth; 32 rings a horn, 1 chip, 1 notch; 5 bells, 45 links; 7 sticks + 3 spare bunches; basket 28 stakes, 46 rows, lid 14 turns, 3 hinge loops; kid: 1 boot, 1 sock of 5 stripes, 14 tassels |
| F run | 10 % | the 3 levels of the runner, the front-row onlookers | 8 + 16 + 72 runners, 140 torch points; 22 posts; 14 front onlookers (5 phones, 12 hats, 3 kids); 38 windows |
| C Nick | 10 % | the cope on a kneeling rig, beard, mitre | 19 beard locks; mitre 5 + 9 scrolls, 14 pearls, 4 flowers; a front band 11 leaves and 6 acorns; 16 lily sprigs; 40 lozenges |
| E boots, drawings, treats | 8 % | felt, mud that wipes off, the two drawings | 38 blanket stitches a felt boot; 9 mud patches, 12 crumbs; 14 treats (7 / 3 / 4); paper sizes and the 6 rows of the drawings table |
| D book, crook, sack | 7 % | the 52 pictures, the roll | 52 cartons in 13 rows; 16 cover scrolls, 5 spine bands, 16 chain links; 7 crockets |
| Cat | 1 % | the no-lines flag, the scale | |

Build order: E (the picture the story hangs on) and B and A (the two long poles) start at once; then C and D; F last
(it needs B and A's kit). A and B get the most time; do not cut their counts to save it.

## 10. Sheet drift, what cannot be staged as drawn, open questions (default)

1. Chip's size (04, 12, 13 draw him near Spud's): 0.67 against 1.02 everywhere; a reviewer measures 66 % on the sheet.
2. The drawings (21 and 24 draw two white papers): teal portrait paper with the one-leaf egg, yellow landscape paper
   with the two-leaf ball, as in E. Default: the swap is shown in the close of E, both papers over 190 px.
3. Door 8's boot (11 draws Spud's teal boot): the raspberry leather lace-up, with Chip's exact shine shapes.
4. The lid (23 draws the basket standing on the ground, lid up): it stays on his back and opens over his shoulder
   toward Spud in 3 stages, pale underside to the lantern, as in B.
5. Panel 14 draws Chip's hoodie and legs outside the pile: the hollow takes all of him but the trainers.
6. Houses on both sides (15, 16), a torch crowd down the lane (20), a moon down the lane (15): drift. One side of
   houses, the meadow and the fountain opposite, the run in its own square, one moon up the lane.
7. Panel 23's book on the ground: Nick keeps it in his hands; the long page is a roll that crosses the lane.
8. Doors 9 and 8 both carry a heart (02, 11): each door has its own counted picture; 4 keeps the sheet's pine tree.
9. The yellow boot is drawn clean in 03 but must be grubby from frame 0 for 14.5 s to follow: `mud` 1 on its lower
   40 %, the yellow still reading.
10. Story 0.8 s says he scoops the kid; panel 02 has him in the basket already. Default: `stow` 0 -> 1 in the first
    10 frames of the shot, then panel 02's picture. Panel 07's two brown shoes become one red boot and one sock.
11. Bells (2, 3 or 4 by panel) and horns (ram curl or goat sweep): 5 bells and the ram curl, always.
12. Panel 01 paints the chain and bells brass inside the shadow. Default: they are shadow shapes; option: his real
    wrist chain dips into the top left of frame at 0.3 s.
13. Falling snow only in 15: `snowfall` keyed as in A, so there is something to lick at 36 s.
14. Panels are 16:9, the frame is 9:16: the Krampus and Chip together need 2.9 m of height. Default: stage in depth
    and up the slope; the tall frame shows balcony, eave, roof snow and sky in every doorstep shot, designed for it.
15. Nick's crook while he reads or pours. Default: PLANTED beside him, the planting hidden by a cut.
16. The kid's eyes over the rim at 66 s, the neighbours' kids at windows 5 and 7, the shadow reaching each door
    before him: additions for world logic, no new beat. Defaults as written; each can be switched off.
17. The cat is the round build of 4 Nov, older than "animals look real" (story.md 5). Default: reuse it for its
    1.5 s; a lofted cat like the sheet's would cost about 6 % more builder time.
18. Rigs: Spud, Chip, Nick = 3. Krampus, kid, cat, runners and onlookers are props. Nick walks ramps only off screen
    or more than 14 m from the camera.
19. Dropped against the sheet, by standing rule: Chip's sweat drops (07, 09) and the sparkle dots on the boot (10).
20. Frame 0 is a boot and a shadow, with no face and no second character (story.md 2, opening rule 2). It is
    Jonny's picked hook and stays; the kid's line at 0.8 s is the first face.
