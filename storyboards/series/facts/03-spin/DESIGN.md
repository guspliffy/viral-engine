# Spin design: "What if Earth spun faster every second?" (creative director, 21 Nov 2026)

Target: Jonny's approved sheets `ref/spin-panels-A.jpg` (P1-P9) and `ref/spin-panels-B.jpg` (P10-P17). Beats, facts and
the rule: `STORY.md`. Jonny, 21 Nov: "id like the design again with much love to the detail and made with love". So every
count, size, hex and layer list below is a FLOOR: a builder may add detail, never drop, merge or thin an item. The sheets are
2:3; everything here is composed for 1080 x 1920 (the extra height goes to sky above and floor/street below the panel crop).

## 0. Conventions, tracks, budgets

**Frames.** Metres, `+y` up, `+x` camera right. Three worlds, each with its own origin (the `galps` way):
- **Q** (room, Quito, valley, sea, street) at `[0,0,0]`: the `gravroom` frame unchanged (floor `y 0`, window wall `z -2.65`,
  `-z` out of the window). `-z` is NORTH, so EAST is `+x`: the sun, the night, the day and the wind all arrive from the
  right and leave to the left. One screen direction for everything that streams: right -> left.
- **HI** (P14) at `[40000,0,0]`. **SP** (P15-P17) at `[80000,0,0]`, units = "Earth radius 100".
- Far 6000 everywhere; near `.04` room, `.5` street, `4` wide/valley/HI, `1` SP.

**Time.** 30 fps, frame `n` samples `t = n/30`. `s = 2 + 0.3 t`. `P(a,b) = clamp((t-a)/(b-a),0,1)`. Tables with keys
`0 / .5 / 1` interpolate linearly in order. `S(x)` = smoothstep on 0..1. Everything is evaluated from absolute `t`
(a seek gives the same frame). Seed 31703; `h(id,i,k)` = seeded hash in 0..1 of the item ID, instance and channel.

**Global tracks (one place; sections refer to these names).**

| Track | Definition | Used by |
|---|---|---|
| `s` | `2 + 0.3 t` | chip, everything |
| `w` (weight left) | `max(0, 1 - 0.0035 s^2)`: 2x .986, 5.5x .894, 7.7x .792, 10x .650, 11.3x .553, 13x .409, 15x .213, 16x .104, 17x 0 (STORY's own math) | free bodies: spit, pieces, splashes, pendulum, ball, waves |
| `phi` (film days gone) | `0.16 t + 0.012 t^2` (rate `0.08 x s` days a second: ONE film day = `12.5 / s` seconds, so day length on screen is always proportional to the real one) | sky wheel |
| `psi` | `0.22 + phi`; `alpha = 360 deg x psi`; DAY while `fract(psi) < .5` | sun, moon, stars, lights |
| `A` (flicker depth) | `1` up to 7.7x; `.50` at 10x; `.22` at 13x; `.12` from 17x (linear between) | sky, key light |
| `sea` | table in C5 (`y_sea = -330 + 308.36 sea`) | C, E, F |
| `storm` | `0` to 10.9 s, `1` at 11.5-15.0, `0` at 15.5 | D |
| `vr`, `wx` | rain fall speed and wind, tables in F | F |
| `lift` `alt` `peel` `squash` `cracks` | `P(50,60)` `P(55,60)` `P(60,66)` `P(64.5,73.3)` `P(66,72)` | F, G, H |

Sunsets / sunrises that fall in shot (from `psi`; s): SET 1.57, RISE 3.80, SET 5.63, RISE 7.22, SET 8.65, RISE 9.95,
SET 11.16, RISE 12.29, SET 13.36, RISE 14.38, SET 15.34, RISE 16.27, SET 17.16, RISE 18.02, SET 18.85, RISE 19.65.
So: the sun sets INSIDE the hook (1.57 s), P2 opens moonlit and gets its sunrise at 3.80 s, P6 holds three flips.

**Look (continuity with gravity).** Toon: three diffuse bands at `N.L = .18 / .58`, gains `.50 / .76 / 1.00`. Ink: room and
Spud `#2A2226` 1.5-2.5 px; near facades, post, hoop `#3A2F33` 1.0-1.5 px; ink tapers to zero from 250 to 700 m. No depth of
field. Exterior modelling light comes from the CAMERA side (the gravity Alps lesson: a sun in front of the lens leaves every
facing surface in shade): direction toward the light `(sin th, .45, +cos th)` normalised, `th = 55 deg x cos(alpha)`, so
shadows swing from left-pointing to right-pointing through each film day. The sun disc in the sky is a backdrop.

**Composition rules for every set.** Chip box `x 300-780, y 160-340`. Caption band `y 380-640`: keep it over sky, ceiling,
plain wall or stars; no hero prop is designed into it. Spud's face centre at `y >= 960` whenever he is the subject (P1,
P4-P13, P17); `y >= 760` in P14; back view in P15-P16. No reaction symbols (story.md 3): the sheets' hit stars, slap lines
and sweat drops are replaced by the real effects named in A (bulb flare, dust puff, flying pieces).

**CPU budgets (gravity's, per frame after culling, Spud included).** Triangles <= 48,000 (6,000 kept for Spud).
Transparent instances (sprites, alpha cards, blended quads, translucent meshes) <= 384. Small opaque instances <= 512.
Draw calls <= 64 (my number: gravity gives none, only "one mesh per material and shape family"). No per-particle lights,
no rigid-body sim in a prop, no volume raymarch, no per-pixel per-frame noise. Canvases are drawn once and cached; a canvas
that animates is redrawn only when its param moves by 1/200. Each section ends with its own count and a
"texture / geometry / sprite" line.

**Reuse map.**

| Existing | Reused as | What changes |
|---|---|---|
| set `gravroom` | the flat's shell | wall, ceiling, baseboard colours; beams; the window insert A2; light rig driven by B5; lamp point moved |
| `gsofa` | sofa / nap bed | position, upholstery `#C8B091`, pillow art; `sink` kept, `brk` `damage` unused |
| `gpendant` (+ cord part) | P8 lamp | shade r `.17 -> .26`, dark bronze, cord -> chain, swing period from `w` |
| `gplant` | floor plant | pot art (Andean band), position |
| `grug` | rug | new canvas (red Andean), position |
| `gsky` dome | sky | same elevation-key method; three key sets blended by night weight and `A`; sun wheel, terminator, star wheel added |
| `gclouds` | 28 high streaks, cloud sea (G) | recolour by day/night, stretch and drift from `s`; `sink` unused |
| `galps` RECIPE (cross-section terrain, polar-mesh peak, slope-baked snow, baked mist, card trees, own origin) | Andes terrain, volcano | new landform table C1; the Alps valley itself is not used |
| `ghorizon` | far cordillera band | new art (3 ridge layers, 3 snow peaks) |
| hud `gforce` | the chip | text and keys, section I |
| not reused | `gtv` `glamp` `gcity` `gtower` `gstreet` `gmoon` `gsats` | flat TV, floor lamp and glass-tower city are wrong for Quito |

---

## A. Quito flat (P1, P4-P8)

A lived-in top-floor flat in an old Quito house: lime plaster, dark timber, clay pots, wool. Warm inside, the world outside.

**A1 Shell.** Floor: `gravroom` boards unchanged (`#79513D`). Left wall and back-wall piers/head: lime plaster, one
2048 x 1024 canvas per wall: base `#E3CFB0`, 14 soft blotches (r .2-.6 m, value +-6 %), 5 hairline cracks .3-.9 m `#B79C7A`,
a 4 cm scuff band `#CDB592` above the baseboard, one nail hole with a .30 x .40 m lighter rectangle (+4 %) where a picture
once hung. Right wall: 30 vertical timber planks .14 m, `#8A5A3C`, seams `#5B3A2A` 3 px, 2-4 knots per plank drawn once,
tone +-7 % per plank (1024 x 1024). Ceiling `y 3.55`: boards `#9A6B4A` + 5 beams `.14 x .18` running along z at
`x -1.68, -.84, 0, +.84, +1.68`, `#5B3A2A`, lit edge `#7A5238`, each with 3 adze-mark rows. Baseboards `#5B3A2A` .075.

**A2 Window insert** (fills the `gravroom` opening `x -1.95..1.95, y .09..3.43`; timber `#4A2F22`, lit edge `#7A5238`):
- parapet `y .09-.44`: 6 raised timber panels `#6A4630`; sill board `y .44-.48`, `.16` deep (`z -2.65..-2.49`), nosing
  .03, top worn to `#A87A52` along the front 4 cm; head `y 3.31-3.43`; jambs `.11`.
- fixed light F `x -1.84..+.76` (outer track, `z -2.65`); sliding sash S closed at `x +.70..+1.84` (room-side track,
  `z -2.60`); stiles and rails `.07 x .045`. No glazing bars (P5: the storm must fill clean glass).
- brass (`#C9A24A`, lit `#F2D27A`): a bar pull .16 long on S's RIGHT stile, centre `y .90`; a keeper plate on the right
  jamb; a thumb latch on F's right stile.
- glass `#BCCDE3` at `.05` + 2 fixed diagonal sheen streaks (white `.06`).
- param `open` 0..1: S slides LEFT by `1.00 x open` m across the room side of F; the gap opens at the right (`open .86`: gap
  `x +.98..+1.84`, pull at `x +.945`). SLAM (P5): `open .86 -> 0` in `.20` s, accelerating; on contact S shivers
  `+-.004` m for `.25` s (5 decaying cycles) and 9 dust motes fall from the head rail.
- SLAM LANE: floor `x .45..1.80, z -2.47..-1.85` stays empty in every shot (Spud walks the pull from `x .72` to `1.48`).

**A3 Layout** (mirrored against gravity: sofa left under F, TV right).

| Item | Where (x, y, z) | Size / note |
|---|---|---|
| sofa `gsofa` | `(-1.00, 0, -2.03)` rot 0 | spans `x -2.02..+.02`; oatmeal linen `#C8B091`, shadow `#9C8468`, welt `#8A6F55`, legs `#5B3A2A` |
| side table | `(.23, 0, -2.22)` | `.40 x .40`, top `y .52` |
| alarm clock | `(.15, .52, -2.12)` | dial turned 20 deg to the room |
| table lamp | `(.33, .52, -2.32)` | total `.47` tall; the set's lamp point moves here: `(.33, .88, -2.32)`, `#FFD19A`, range 2.6 |
| bookshelf | `x 1.78..2.10, z -1.75..-.85` | `2.05` tall, right wall |
| framed picture | right wall `(2.09, 1.80, -2.22)` | `.46 x .58` |
| tapestry | left wall `(-2.09, 1.75, -.20)` | `.50 x .80` |
| CRT on its stand | `(1.45, 0, -.25)` rot -48 | screen faces left-front (P4); footprint `x 1.01..1.89, z -.70..+.20`, clear of the P1 and P5 sight lines |
| pendant `gpendant` | rim centre `(0, 1.93, -.45)` | chain 1.30 m from the middle beam |
| rug `grug` | `(.10, 0, -.35)` | r 1.03 |
| floor plant `gplant` | `(-1.82, 0, -1.28)` | |
| sill plants | `(-1.55, .48, -2.57)`, `(-1.18, .48, -2.57)` | leaves rise to `y 1.05-1.20` over the sofa back |

**A4 Textiles (Andean).**
- Manta over the sofa's right arm and the right third of its back: cloth `1.30 x .85` m, 12 x 8 segments, 3 baked folds,
  canvas 1024 x 672. 17 stripes, widths as shares of the long side, from one edge: red `#B5352B` .09, cream `#F0E2C4`
  .012, orange `#E0902F` .05, zigzag band (blue `#1F4E79` on cream, 14 teeth) .07, pink `#C2356B` .04, yellow `#F2C230`
  .03, teal `#2F6E7A` .05, diamond band (9 diamonds red/yellow on `#3B2F2A`) .09, cream .012, then the same 8 mirrored.
  Weave: 1 px weft lines every 3 px at 8 % dark. Fringe: 46 tassels .04 m `#F0E2C4` on each short end.
- Pillows (gsofa's two): left red `#B5352B` with one cream stepped diamond; right mustard `#D9A441` plain knit.
- Rug: field `#8E2F2A`; three rings at r `.55 / .78 / .95`: cream zigzag (36 teeth), 16 stepped diamonds blue/orange,
  cream zigzag; braided edge `#3B2F2A`; 1024 x 1024.
- Tapestry: canvas 512 x 820: 7 bands; band 4 holds 5 llama silhouettes `#F0E2C4` on teal; a dowel + 12 fringe cords.
- P6 quilt (only 15.0-19.0 s): `1.5 x 1.1` m, `#E8E6E4`, shade `#B9B9C4`, 5 soft folds, 6 x 5 quilting diamonds.

**A5 Plants.** Sill 1: terracotta pot (r `.085 -> .065`, `.14` tall, `#B8643C`, rim band `#9A4F30`, one white zigzag),
rubber plant: 9 leaves `.16-.24` m, `#3F6B3A`, light `#6E9A4A`, underside `#2E4F2E`, a midrib line each. Sill 2: glazed
pot `#2F6E7A` with a cream band, succulent rosette of 12 leaves r `.07`, `#7FA487`. Floor `gplant`: pot repainted
`#B8643C` with a `#F0E2C4` band of 9 red diamonds. Shelf-top pothos: 5 vines `.5-.9` m, 38 heart leaves `.05-.08`,
`#4E7F3F`, 30 % with a `#A9C46A` splash. Wind response (D, open window): leaves `+-12 deg` at 3 Hz, settle in `.4` s.

**A6 Bookshelf.** Carcass `#6B4531`, shelf edges `#8A5E42`, 5 shelves. 64 books: 11-15 per shelf, widths `.022-.055`,
heights `.17-.27`, depths `.15-.21`; 9 spine colours `#8C2F2B #C9572E #E0A63C #2F6E7A #33506B #5B3A5E #7A8B4A #E6D7B5
#3B2F2A`; 20 % lean 6-14 deg; 3 flat stacks of 3-4. One 2048 x 256 canvas per shelf: every spine drawn once (2 title bars,
a band, a publisher dot; no letters). In the gaps: a ceramic llama `.11` tall (cream, red saddle cloth), a brass hand
bell, a `.10 x .15` photo frame, and on shelf 3 a DESK GLOBE diameter `.16`, axis tilted 23 deg (the plant for the ending).

**A7 Pictures.** Frame `.46 x .58`, moulding `.035` `#3E2A20`, gold fillet `#C9A24A` `.006`; canvas 368 x 464: a snow cone
at dawn (sky `#9DB9E0 -> #F2C9A0`, cone `#5A6C8A`, cap `#F4F1EA`, paramo `#6E8A4E`, one llama silhouette).

**A8 Pendant (P8).** `gpendant` scaled to shade r `.26`, `.17` deep: outside dark bronze `#3B302B` with a brushed band
`#7A6250`, inside `#FFE6AE`, bulb `#FFF2C4`, glow sprite 1.1 m. Chain: 26 links (2 crossed alpha ribbons `.022` wide,
canvas 64 x 1024) from a ceiling hook on the middle beam; shade top `y 2.07`, rim `y 1.93`. BONK at `tb`: roll
`24 deg x exp(-tau/1.6) x cos(2 pi tau / T)`, `T = 2 pi sqrt(1.47 / (9.81 w))` = 3.0 s at 10x (it swings SLOWER
because he is lighter); bulb gain x1.8 for 3 frames then a 6-frame flicker (this is the sheet's hit star); 7 dust motes
drop from the shade.

**A9 CRT TV (P4).** Stand `.80 x .45 x .50` dark walnut `#6A4630`, a lower shelf with 9 tapes/books. Set
`.62 x .52 x .46`: casing `#8E8C86`, lit `#B4B1A8`, shade `#5E5C5A`; bezel inset `.03`; screen `.44 x .34`, corner r
`.05`, bulge `.018`; right control strip `.08` wide: 2 knobs diameter `.035` `#2B2A2C` with a white index, 9 speaker
slots; 4 feet; rabbit ears: dome base `.09`, two 3-stage chrome rods `.52` at +-32 deg, ball tips `.014`.
- Programme (canvas 512 x 384, redrawn at 15 fps): a satellite weather map of South America: sea `#1E5A9A`, land
  `#4E7A3A / #B99A5E` (28-vertex outline), a 5-arm white cloud spiral off the coast at uv `(.30,.34)` turning 40 deg/s
  (the plant for D), a red pin pulsing 1 Hz at Quito `(.36,.38)`, a satellite icon 34 px top right, a red live dot top
  left. No letters, no people.
- `signal` 1 / .5 / 0: picture clean / the satellite icon has slid out of frame to the upper right (over `.5` s: the
  satellite drifts out of place, on screen), 5 bands displaced +-40 px, 45 % static / full static.
- Static: 8 pre-drawn 256 x 192 grey frames (`#1A1A1E..#F2F2F2`, mean 46 %, 2 bright bands of 22 px each), shown as frame
  `(5 n + 3) mod 8`, plus a 38 px dark bar rolling down at 300 px/s. Never per-pixel live noise.
- SLAP: `signal` jumps to `.8` for `.35` s then dies to 0 (old-TV truth); 9 dust motes jump off the top; rods wag
  +-6 deg for `.5` s. Screen light: point `#BFD0E6`, gain `.6 + .25 x (frame index / 8)`.

**A10 Side table, lamp, alarm clock (P6).** Table `#5B3A2A`: 1 drawer, brass knob `.03`, top overhang `.02`, 4 tapered
legs. Lamp: glazed vase `#2F6E7A` `.20` tall, brass neck, pleated shade r `.12 / .17`, `.19` tall, 24 pleats painted,
`#F3DDA6` emissive. Clock, `.15` tall: body diameter `.115`, depth `.055`, red enamel `#C23A2B` (lit `#E0574A`, shade
`#8E2A22`); dial `#F4EAD2` with 12 numerals; black hands (hour `.028`, minute `.040`), red second hand; two brass bells
diameter `.042` `#D9A441` (lit `#F2D27A`) at `+-.034`; a hammer (ball `.012`, stem `.03`); carry arc; 2 ball feet; a key.
- Hands run on the film sky: hour hand `720 deg x psi`, minute hand 12x that; above 2 rev/s the minute hand is a
  translucent disc `#3B2F2A` at `.22` (at 6.5x the hour hand turns once a second: "a day lasts under four hours").
- `ring` (on from each RISE until hit; in P6: 16.27 and 18.02 s): hammer shown as 3 ghosts at -22 / 0 / +22 deg, bells
  shake `+-.002` m, the clock rocks +-3 deg at 7.5 Hz and walks `.03` m toward the table edge per second.
- `smash = P(ts, ts+.45)`, `ts` about 18.3 s: 14 pieces: 3 shell parts, dial in 2, 2 bells, hammer, 2 hands, 3 brass
  gears (`.018 .024 .030`), 4 glass shards (the sheet's white shards). Launch `1.2-3.4` m/s, 20-70 deg up, radially from
  the fist, spin 2-7 rev/s, gravity `9.81 w`; they land and stay; one bell rolls off the edge. The body under the fist
  flattens to `.45` of its height.

**A11 Mug and coffee spit (P1).** Mug `.095` tall, diameter `.082`, D handle `.05 x .06`, glaze `#F1E6CF`, inside
`#E9DFC8`; a band `.034` high: 3 nested zigzags (teal `#2F8C8C`, orange `#E0902F`, red `#B5352B`), 7 teeth, 2 border
lines `#3B2F2A` (512 x 160, wrapped once). Coffee disc `#3A2116`, highlight crescent `#6B4A32`; 3 steam wisps until the
spit. `spit = P(.10,.95)`: one gout (5-lobe ribbon, length `0 -> .42` m, width `.09`) + 46 drops (diameter `.008-.03`,
6 blobs `.035-.05`), launched `.10-.32` s, `2.6-5.2` m/s inside a 16 deg cone along `(+.92,+.30,-.25)` from the
mouth, gravity `9.81 w`; core `#5A3320`, highlight `#8A5A3A`, rim `#2E190F`. Where they hit glass or sill: 12 splats
(diameter `.02-.07`, 2-4 drip runs growing `.05-.18` m over 1.2 s). The splats STAY on the glass in every later room shot.

**A12 Crisp bag and crisps (P7).** Bag `.19 x .27 x .07` foil pillow, top torn (11 teeth): red `#C8322B`, 5 diagonal
cream stripes `#F3E4C0`, a yellow sunburst `#F2C230` diameter `.09` with a crisp icon, silver inside `#C9CCD2`, 9 baked
creases with highlight lines; no letters, no real brand. 22 crisps: saddle discs diameter `.045-.062`, rise `.009`,
6 x 6 segments, `#E9B94E`, lit `#F6D67A`, shade `#C08A2E`, 4-7 fry specks each, 8 of them ridged (14 scallops);
30 crumbs `.003-.008`.
- THE FALL MUST READ: crisps sink at `.34-.55` m/s (about 6x slower than 79 % weight really gives: a film exaggeration,
  marked as ours). Flutter, not spin: side slip `+-.045` m and rock `+-35 deg`, both at 1.1 Hz, so each crisp shows its
  face at every turn.
- Hero crisp H, toss at `t0`: apex `y 1.45` at `t0+.45`, then `1.9` s down an S-curve (`.44` m/s) into the open mouth
  (`y .62`) at `t0+2.35`; it shows its full face twice in the last `.6` s; 2 crumbs puff at the bite. 4 more crisps from the same
  toss land on the rug, the manta and one on his crown, where it stays.

**A count.** About 15,000 triangles, <= 46 draw calls, <= 126 opaque instances (drops, crisps, crumbs, pieces),
<= 40 transparent. TEXTURE: walls, planks, ceiling, manta, rug, tapestry, spines, picture, mug band, bag, dial, pleats,
TV frames, splats. GEOMETRY: everything you can touch. SPRITE: steam 3, glows 4, dust motes, TV halo.

---

## B. Sky and light driven by the spin

**B1 Sky wheel.** Everything in the sky turns about ONE point on the horizon straight ahead (az 0, el 0): on the equator
the celestial pole lies on the horizon, so stars really wheel like this. A body at wheel radius `rho` sits at
`az = rho cos(alpha), el = rho sin(alpha)`; it rises right, tops out ahead, sets left. Sun `rho 15 deg` in the room and
wide shots, `24 deg` from the street cut at 31.0 (the cut hides the change); its true noon height (66 deg) would leave the
9:16 frame: a film cheat, never said. Moon `rho 19 deg`, `alpha + 180`. Speed is `0.08 x s` turns a second, nothing else.

**B2 Sun and its smear (P1, P6, P9-P13).** Head: core diameter 3.0 deg `#FFF6D8` (`#FFB36B` under el 5 deg), corona 8 deg
`#FFD08A` `.55 -> 0`. Trail behind the head along the wheel: length `26 deg` of wheel angle at 2x, `60` at 10x, `180`
from 17x; ghosts on it: 2 below 12x, 3 at 12-14x, 4 at 14-16x, 5 from 16x; ghost `k` is `.82^k` the size, alpha
`.70 x .72^(k-1)`, stretched `1.25^k` along the path; a tapered ribbon joins them (`#FFC98A -> #F08A5A`, alpha `.42 -> 0`,
width `1.6 -> .5 deg`). Frame 0: head at az +2.8, el 14.7, moving left; the sheet's P1 look (head low left, trail up to
the right) is reached at 1.0 s. SUN COMB, weight `1 - A`: a second row of 8 discs every 22 deg of wheel angle drifting
right -> left at 120 deg/s, alpha `.55`, pulsing +-20 % at `0.08 x s` Hz: from 10x the sky always holds 3-6 suns (P9-P13)
without the whole frame flashing.

**B3 Day, night, terminator (P6).** Centred on every SET and RISE, for `.22` of a film day (`2.75 / s` seconds: 1.1 s in
the hook, `.42` s at 6.5x), a terminator crosses the sky from right to left: line `az_T = 30 - 60 u` deg (`u` 0..1), leaning
18 deg (top to the left), soft edge 7 deg, 14 streak lines along the wheel on it; seam colours at a set `#FF9A5C ->
#C2567A -> #2A3560`, at a rise `#FFD2A0 -> #E59A78`. Night weight at azimuth `a`: `N(a) = S((a - az_T)/7 + .5)` at a
set, `1 - that` at a rise. So mid-sweep the left of the window is day and the right is night: P6.
Dome keys by elevation `-12 / -2 / 2 / 8 / 18 / 35 / 75 deg` (linear RGB, as `gsky`):
- DAY `#7E6A86 #E59A78 #FFC08A #F2A58F #B58BB0 #6F78B8 #3F4F96`
- NIGHT `#1B2140 #2A3560 #2F3F70 #263562 #1C2850 #141C3E #0C1230`
- TWILIGHT (the time average) `#4A3A5E #C9785E #F0A066 #B8708A #6E5A9A #46508F #2B3470`
Colour = `lerp(TWILIGHT, lerp(DAY, NIGHT, N), A)`; from 15x to 16.5x the result is multiplied down to `.62` (P12's dark
sky) and back to `.80` by 18.5x. Warm glow (as `gsky`): gain `.18`, Gaussian 34 deg wide, centred on the head.

**B4 Night.** Star wheel: 520 stars within 62 deg of the pole point (40 bright 3 px `#FFF4DC / #DCE6FF`, 160 at 2 px, 320
at 1.3 px), each a trail arc of wheel angle `clamp(1.4 deg x s, 2.8, 22)` fading to its tail; four pre-drawn 2048 x 2048
discs (trail 3 / 7 / 13 / 22 deg) cross-faded and rotated by `alpha`; alpha `N x (.3 + .7 A)`. Moon: crescent diameter
2.6 deg `#F4EFD8`, earthshine `#3A4670`, shown while `N > .5` and `A > .3`. City lights: C3. Night floor: at full night the
foam, roofs and snow keep >= 38 % of their day luminance (moon key), so the sea still reads.

**B5 Room light follows the wheel.** With `az_s, el_s` of the sun: key direction toward the source `az_k = 2.6 az_s`
(+-39 deg), `el_k = 14 + 1.4 el_s` (14-35 deg); colour `#FFB36B` (low) to `#FFE2B8` (el_s >= 12); gain
`2.10 x lerp(.56, 1 - N(0), A)`. So the mullion shadows and the floor sheen swing left -> right across the room once per
film day. The `gravroom` sheen bands take slant `-tan(az_k)` (-.81..+.81), gain and tint from the key. Moon key `#8FA6D8`
gain `.55 x N(0) x A`, same formulas from the moon. Hemisphere: day `.74` sky `#B9C4E8` ground `#6A4A3A`; night `.42` sky
`#3A4A80` ground `#2A2030`. Practicals never dim: table lamp, pendant, CRT. Bench check: Spud's face at full night >= 72 %
of its day luminance.

**B6 Clouds.** `gclouds` 28 high streaks: day body `#F2B8A0`, light `#FFD9B8`, shadow `#8A7AA8`; night body `#3A4670`,
edge `#6A7AA8`; x-radius x `min(4.0, 1.6 + .2 (s - 2))`, tilted 20 deg up to the right (P2), drifting toward `-x` at
`9 x s` m/s, wrapped over `x +-1800`; 3 sprites a streak. Plus 14 cumulus over the far hills (9 lobes each = 3 three-lobe
sprites, `#F6EFEA / #C9B8D0`). From 43.3 s the streaks are baked into the dome (0 sprites) to leave room for rain.

**B7 Comfort.** No full-frame luminance step faster than 2 Hz, ever (24x gives 1.92). From 7.7x `A` falls, so the mean
frame luminance moves <= 38 % between frames 1/3 s apart.

**B count.** Dome 1 draw; star wheel 2 quads; <= 16 sun sprites, 1 moon, 126 cloud sprites (0 from 43.3 s).
TEXTURE: dome keys, star discs. SPRITE: sun, ghosts, comb, moon, clouds. GEOMETRY: none.

---

## C. Quito, the Andes valleys and the rising sea (P1-P3, through every window, behind P9-P13)

**C1 Terrain** (`galps` recipe: flat facets, 3 bands, mist = the dome's current colour at el 2 deg, reaching `.55` at
5200 m, so the far land goes blue at night with the sky). Height =
`R(z - Z0(x)) + bumps`. Centre profile `R`, (z, y) joined by straight runs, corners rounded 20 m:
`(+600,+46) (+260,+14) (+40,-6) (-3,-9) (-130,-29.3) (-560,-308) (-700,-328) (-2700,-330) (-3300,-240) (-4200,-60)
(-5600,+120)`. The run `-3..-130` is the hero street (16 %); `-130..-560` is the 33 deg slope under the street end.
`Z0(x) = 60 sin(x/310) + 35 (sin(x/127 + 1.3) - sin 1.3)`, applied below `z -130` (bays and spurs along the slope).
Bumps `b = (top - R) x exp(-((dx/rx)^2 + (dz/rz)^2)^p)`:

| ID | Centre (x, z) | rx x rz | Top y | p | On it |
|---|---|---|---|---|---|
| LOMA | `(-95, -660)` | 110 x 170 | +10 | 2 | church CH1, 140 houses on the south and east flanks |
| OESTE | `(-640, -420)` | 280 x 240 | -60 | 1 | 40 houses, fields |
| ESTE | `(+560, -600)` | 260 x 300 | -120 | 1 | eucalyptus, 3 farmhouses, fields |
| VALLE terrace | `(+810, -1250)` | 300 x 240 | -284 | 2 | the drowning town: 96 houses, church CH4 |
| R1-R5 valley ridges | `(-900,-1500) (-250,-1750) (+300,-2050) (+1100,-1900) (-1400,-2300)` | long x wide `700x150, 900x190, 620x140, 800x170, 1000x220`, long axes 70 / 82 / 95 / 78 / 88 deg off `+z` | floor + `110 / 150 / 95 / 130 / 190` | 1 | grass, 9 farmhouses, tree clumps: the islands of P2 |
| F1-F3 foothills | `(-1300,-3400) (+200,-3700) (+1500,-3500)` | `900x420, 1100x460, 800x400` | +40, +120, +60 | 1 | paramo |

Mesh: near field (`x +-900, z +600..-760`) 40 x 48 cells; the rest (`x +-2800, z -760..-5600`) 48 x 56 cells: 9,216
triangles. Colours by height and slope: valley grass `#6E9A4A / #8DB255`, slope scrub `#5E8A44 / #4E6B3A`, bare bank
`#A88F6A` over 40 deg, paramo `#7A8450`. One 2048 x 2048 canvas over the valley and terraces: 140 field polygons
(`#6E9A4A #8DB255 #B9C46A #A88F4E #5E8A44`), hedge lines `#3F5F34`, 11 tracks `#C9B48A`, a 14 m river `#7FA9C9` with 9 bends.

**C2 Far range and volcano.** Band (as `ghorizon`) at `z -5400`, `x +-3600`, `y -60..+420`, canvas 4096 x 512: three
ridge layers `#7C86B8`, `#6A7AA0`, `#5E7F6A`, three snow peaks left of centre (snow `#F2F0EE`, shade `#B9C2DA`).
VOLCANO (geometry, polar mesh 48 x 22): centre `(-140, -4700)`, base y -60, base r 760, summit y +395 (31 deg slopes),
crater notch 70 m. Paramo `#6E7F4E` up to y +80, rock `#5A5560`, snow above `y 210 + 26 sin(6 theta)` with 14 tongues
down to y +150 (snow `#F6F4F0`, sun side `#FFE6CF`, shade `#AEB9D6`), 22 radial gullies `#46424E`. Never named on screen.
STEAM PLUME: 14 billow sprites from the crater, diameter `60 -> 220` m, one new every `.23` s, lit `#E9E4E0`, shade
`#B9B0BE`; lean toward `+x` 20 deg and length 380 m at 2x, 65 deg and 1,100 m from 13x (the plume shears flat as the
spin grows).

**C3 Towns** (758 houses, all merged static geometry: box + gable or hip roof, 17 triangles each).

| Zone | Houses | Where | Pattern (copy the real city, never a scatter) |
|---|---|---|---|
| CENTRO (the plateau) | 380 | `z +600..-130, x +-900` | colonial grid turned 9 deg: 9 x 6 blocks of 84 m, 8 m streets, 6-8 houses wall to wall round a patio (22-30 m, 0-2 trees); 3 blocks are plazas |
| LOMA | 140 | the hill's south and east flanks | rows on contour lines 12 m apart in height, 5 stair alleys |
| LADERA | 90 | slope `z -150..-420, x +-380` (not the street axis +-8) | rows every 14 m of height, 6-10 a row |
| OESTE | 40 | bump OESTE | loose rows, fields between |
| VALLE | 96 | the terrace | 14 blocks round a 60 x 50 m plaza, a 90 x 45 m painted football pitch on the low edge |
| farms | 12 | ESTE, ridges | single, with a yard wall |

House: footprint `7-13 x 8-15` m, 1-3 floors of 3.0 m, roof pitch 24-30 deg, eave overhang .6 m. WALLS (share):
lime white `#F2ECDD` 38 %, cream `#EBD9A8` 14, ochre `#E2B24A` 12, salmon `#E59A84` 11, sky blue `#8FB5D6` 8, mint
`#A9CDB0` 7, terracotta `#C8654A` 6, lilac `#B79CC9` 4; a 1 m base band 18 % darker. ROOFS (clay tile): `#B5543A` 34 %,
`#C76A45` 26, `#A64B36` 18, `#D08455` 14, weathered `#8E6A58` 8; roof atlas 1024 x 1024: 5 swatches of 22 scalloped
tile courses, 6 % of tiles mossy `#6F7A4E`, a lighter ridge row. Facade atlas 2048 x 2048: 16 tiles (8 colours x 2):
tall shuttered windows (`#5B3A2A`, `#2F6E7A`, `#33506B`, white surrounds), an arched timber door, a cornice line, black
iron balcony lines with flower dots (`#D2357A`, `#D8432E`) on 30 %. Night atlas (emissive): 34 % of windows lit
`#FFC983 / #FFE2A9 / #F2A35E`; a house's lights are on while `N(its azimuth) > .5`, or at gain `.8` once `A < .5`.

Churches (hero geometry, <= 900 triangles each):
- CH1 on LOMA `(-95, +10, -660)`: grey stone `#8E8A8F` (lit `#B4AEB0`, shade `#5E5A66`); nave `62 x 22 x 26` m; TWIN
  TOWERS 9 x 9, 58 m with 16 m octagonal spires; a 38 m crossing tower behind; rose window 6 m; 8 buttress fins a side.
- CH2 CENTRO `(26, +2, 131)`: white `#F4EFE4` bell tower `8 x 8 x 34` m in 3 stages with arched openings, copper-green
  dome `#5F9A8A`, lantern, cross; nave `40 x 14 x 15`.
- CH3 CENTRO `(46, +7, 180)`: drum 14 m, dome 15 m in blue tile `#3F5FA8` with 12 ribs `#E8E2D0`, white lantern, facade
  `#F2DAD2`, two bell gables.
- CH4 VALLE, east side of the plaza: white tower `6.5 x 6.5 x 24` m, dome `#D9D2C4`, cross (top 27 m over the ground);
  nave `34 x 12 x 11`. It is the last thing above water in P3.
Trees: 780 crossed cards in 5 silhouettes (3 eucalyptus 12-24 m, 2 round crowns 6-12 m; `#3F6B3A #5E8A44 #2E4F2E`) in
clumps of 5-12 on slopes and patios; 14 palms (9 fronds) on the CENTRO plazas; VALLE: 28 round-crown trees as 60-triangle
blobs, crowns 9-15 m (they stand half under in P3).

**C4 The sea.** One surface at `y_sea`, `x +-2800, z 0..-5600`, 56 x 72 cells (28 x 72 behind a window or the street).
Three swells (height / length / heading off `+z` / speed): `2.2 m / 180 m / 0 deg / 14 m/s`, `1.3 / 95 / +24 / 10`,
`.7 / 41 / -31 / 7`; all heights x `(1 + .12 s)`. Deep `#1F4666`, mid `#2E6C8E`, under 12 m of water `#5FA9B4`; night
`#142A48`, foam `#C9D6EA`, a 6 deg moon-glitter column of 40 glints. Whitecaps: canvas 1024 x 1024 with 220 comma strokes
(6-30 px, alpha .5-.9, each drawn once), two layers crossing at 9 and 6 m/s; cover `.35` at 2x to `.80` from 10x.
- FOAM FRONT on land: every terrain vertex within `y_sea -1..+3` m turns `#F4F8F6` at `.9`; `+3..+9` m is wet (22 %
  darker). 48 breakers on fixed shore rays (`x = -1100 + 46.8 i`), each where its ray meets `y_sea`: a billow growing
  `8 -> 30` m, alpha `0 -> .8 -> 0`, lift `0 -> 9` m, every 1.4 s, phase `h(i)`.
- SURGE WALLS (the hook). Strip mesh 40 x 6: back slope 18 deg, face 65 deg, lip overhang 12 m; back `#2E5F82`, face
  `#3F86A8`, lip `#9FD3D8` at `.7`; crest foam `#F4F8F6`, shade `#B9C9D6`: 30 billows (40-90 m) along the crest, 16
  spray sprites thrown 20-60 m ahead and up, a 90 m lace apron on the water in front.

| Wall | x span | z(t) | Height over the sea | Job |
|---|---|---|---|---|
| W1 | `-250..+750` | `-1150 + 60 t` | 220 m | P1: fills the right half of the frame over the sill at frame 0 (about 300 px tall); breaks on the slope toe at 7.5 s |
| W3 | `-900..-100` | `-1570 + 60 t` | 120 m | the second line behind W1 (P1, P2) |
| W2 | `+225..+1375` | `-1930 + 140 t` | 120 m, a 16 m bore on the terrace | crosses VALLE 3.8-5.9 s (P3 opens on it) |
| W4 | `+310..+1210` | `-2350 + 140 t` | 100 m, 16 m bore | crosses VALLE 6.8-8.9 s |

  A wall that meets ground higher than its base throws 22 spray sprites 60-140 m up over 1.6 s, then flattens in 1.2 s.
- VALLE DROWNING (P3). Each house wears a foam V on its surge side and a foam ring in its last 6 m; 18 of the 96 lose
  the roof when the water is 2 m over the eaves (the slab tips 15-35 deg and drifts 6-20 m). 36 floating pieces (beams
  3-7 m, roof slabs 3 x 2 m, 5 trunks) ride at 9-14 m/s, turning 10-40 deg/s. Whitecap cover `.75` inside the town.
  Water over the plaza (ground y -286): 2 m at 5.0 s, 14 m at 7.0, 24 m at 9.0: the shot ends as CH4's dome goes under.

**C5 Sea level and how close the water is.**

| t | chip | `y_sea` | `sea` | Where the water is |
|---|---|---|---|---|
| 0.0 | 2.0x | -316 | .045 | valley floor 14 m under; W1 1,150 m from the window, closing at 60 m/s |
| 2.2 | 2.7x | -300 | .097 | every valley is sea, R1-R5 are islands; shore on the slope 417 m out from the street end |
| 5.0 | 3.5x | -284 | .149 | VALLE's plaza awash |
| 7.0 | 4.1x | -272 | .188 | VALLE's roofs gone |
| 9.0 | 4.7x | -262 | .221 | only CH4's dome; from the window, open sea beyond 983 m |
| 15.0 | 6.5x | -220 | .357 | from the window beyond 826 m |
| 19.0 | 7.7x | -195 | .438 | beyond 733 m |
| 26.7 | 10x | -140 | .616 | beyond 527 m; LOMA is a peninsula |
| 31.0 | 11.3x | -96 | .759 | P9: sea beyond 544 m of the dunk camera; LADERA's lower rows under |
| 36.7 | 13x | -28.04 | .979 | P10: LADERA gone; the flood front is ON the street at `z -122`, 94 m below the camera |
| 43.3 | 15x | -25.16 | .989 | P11: front at `z -104`, 46 m below the hero post |
| 46.7 | 16x | -22.28 | .998 | P12: front at `z -86`, 28 m from the post; LOMA is a 32 m island with CH1 on it |
| 50.0 | 17x | -21.64 | 1 | P13: front at `z -82`; then it lifts (F) |

Keys of the param: `sea 0 / .5 / 1` = `y -330` (dry floor) / `-175.8` (floor, VALLE, the lower 46 % of the slope under;
LOMA nearly cut off) / `-21.64` (everything below the street's last 21 m; CENTRO dry).

**C count.** Worst shot P2: terrain 9,216 + sea 8,064 + houses 12,886 + churches 3,200 + volcano 2,112 + tree cards
3,120 + four walls 1,920 = 40,518 triangles; sprites 380 with the sky (breakers 48, wall foam 120, spray 64, plume 14,
clouds 126, sun 8). Behind a window: 25,100. <= 34 draw calls. TEXTURE: fields, far band, roof / facade / night atlases,
whitecaps, lace. GEOMETRY: terrain, sea, walls, houses, churches, volcano, VALLE trees, floating pieces. SPRITE: foam,
spray, breakers, plume, tree cards.

---

## D. Hurricane spiral (P5, 11.5-15.0 s)

The storm stands in the window like a wall, face on, as drawn. Centre `(+60, +140, -1500)` (the eye sits at az 2.3,
el 5.3 from the window), diameter 2,400 m, every layer a vertical camera-facing disc. Back to front:

| Layer | z | Canvas | Content |
|---|---|---|---|
| D1 veil | the dome | keys | replaces B3 while `storm > 0`: el 75 `#2B3345`, 18 `#4A566B`, 2 `#6B7A8C`, -12 `#3A4558`; the day/night flip still shows through it at +-18 %; B6 clouds and the sun are hidden |
| D2 far arms | -1530 | 2048 x 2048 | log spiral `r = a exp(.22 theta)` (pitch 12.4 deg), 5 arms of 90-140 soft lobes (40-160 px, lit `#C9D2DC`, shade `#7C8A9E`, alpha .5-.85, each drawn once), arm width 320 -> 60 px outward, gaps `#3A4558` |
| D3 near arms | -1500 | 2048 x 2048 | 4 arms offset 36 deg, 480 lobes of 20-80 px, crests `#E8EEF2`, undersides `#5E6C82` |
| D4 eyewall | -1480 | 1024 x 1024 | ring 150 m inside / 330 m outside, 64 cumulus lobes, rim `#F2F5F6`, inner face `#2A3140`; the eye `#151B2B` with one pale glint `#6A7890`, 40 m, off centre |
| D5 scud | -300..-900 | sprites | 22 billows 60-200 m, `#8A96A8` at .6, crossing right -> left at 60-140 m/s |

- TURN, counter-clockwise (the sky wheel's sense): D2 `14 deg/s x s/5.5`, D3 `22 x s/5.5`, D4 `40 x s/5.5`: the inside
  turns faster than the outside and all of it speeds up 19 % inside the shot ("storms spin faster").
- LIGHTNING at 11.9, 12.6, 13.05, 13.9, 14.5 s: an additive blob 300 m `#DCE8FF`, `.6 -> 0` in `.2` s, at a seeded point
  on an arm; the room's cold fill kicks `+.18` for 2 frames.
- RAIN outside: 220 streaks (F's atlas, streak state), 14 m/s, falling to the lower LEFT 58 deg below the horizontal,
  in `x +-6, y -2..+5, z -2.7..-14`.
- THE OPEN GAP, until the slam (A2 `open .86`): 40 of the streaks reach `.2-1.1` m into the room; a wet patch
  `.9 x .6` m at `(1.40, 0, -2.20)` (boards 40 % darker `#5A3B2C`, 18 specular dots) that STAYS for the rest of the film;
  pendant +-5 deg, leaves +-12 deg at 3 Hz, the manta's 46 tassels +-20 deg. The slam stops all of it in `.4` s: the
  viewer sees the slam work.
- RAIN ON THE GLASS after the slam: canvas 1024 x 1024: 90 beads (4-14 mm) and 14 rivulets crawling `.35` m/s down-left,
  trails fading over 1.2 s.
- `storm` IN 10.9-11.5 s (the last `.6` s of P4: veil and scud slide in from the right of P4's window: the cause is on
  screen before the cut). OUT 15.0-15.5 s: every layer slides 1,400 m to `-x` and fades: the storm's tail leaves the left
  of P6's window.

**D count.** 8 triangles + 248 transparent (4 discs, 22 scud, 220 streaks, 1 flash, 1 glass layer) + the room's 40.
TEXTURE: veil keys, arms, eyewall, glass rain, wet patch. SPRITE: scud, flashes, streaks. GEOMETRY: none.

---

## E. The steep street (P9-P13)

The street leaves Spud's front door and drops north to the edge of the slope: the window (P1) and the street look down
the same axis, so LOMA with CH1 sits left of centre and the volcano just left of centre in both. Axis `x 0`,
`z -3..-130`; `u = -(z + 3)` is metres down the street (0..127); surface `y_st = -9 - .16 u` (16 %).

**E1 Section.** Carriageway `x +-2.6`. Kerbs `.14` high, `.16` wide, andesite `#8E8A8F`. Pavements `x +-2.6..+-3.8`:
flags `.6 x .9` `#A39C92`, joints `#5E5A5E`. Facades at `x +-3.8`. The LEFT pavement is a stair from `u 20` to `75`:
12 risers of `.18` every 4.5 m (P10's steps); the right pavement is a ramp.

**E2 Cobbles.** Three DIFFERENT 2048 x 2048 tiles (5.2 x 5.2 m), laid in seeded order with flips, never the same two
in a row (25 along the street). Setts in rows across the street: `.11-.16` wide x `.17-.24` long, joints `.012`
`#3A3438`; 5 greys `#8A8690 #7A7682 #9A948F #6E6A76 #A39C92`; every sett has a 1 px lit edge `#B9B4B0` up-left and a
shade edge down-right; 6 % mossy joints `#5F6B4A` within `.5` m of the kerbs; two wheel tracks of flat slabs
`.45 x .90` `#A8A29A` centred on `x +-.85` (Quito's huellas). Drawn once on top: an iron manhole `.62` at `u 44`, 2
patched areas `1.2 x .8`, a chalk hopscotch of 8 squares at `u 12-15` (no digits), 7 rust and oil stains, 9 drifts of
fallen bougainvillea petals. The street is WET from 31.0 s (D's storm is the cause): tiles 18 % darker, 60 specular
strokes under the lamps.

**E3 Puddles** (u, x, size m): `(9, -1.2, 1.1 x .7)` `(14, +.9, .8 x .5)` `(21, -.3, 1.9 x 1.0)` `(27, +1.6, .9 x .6)`
`(34, -1.7, 1.2 x .6)` `(41, +.2, 1.6 x .9)` `(49, +1.9, .7 x .5)` `(56, +1.4, 1.4 x .8)` (by the hero post)
`(63, -.8, 1.0 x .7)`. 12-point outlines. Surface: the dome's el 35 deg colour x .85, a warm streak under each lit lamp,
2 ripple rings per hit. A gutter rivulet `.25` wide along the right kerb: 3 highlight chevrons a metre running downhill
at `1.2 x sqrt(w)` m/s. STEP SPLASH (P10): 14 drops and 2 ribbon arcs rising `.5-.9` m under gravity `9.81 w` (at 13x an
`.8` m arc hangs 1.26 s: the number, shown).

**E4 Houses.** Left 15, right 13 + the mural wall (`u 11-23`); stair alleys right at `u 70-73`, left at `u 96-99`.
Frontages 6-9 m; floor lines step down with the street. Each: andesite plinth `.9-1.6` m (`#7C7884`, joints
`#56525C`), ground floor 3.4 m, upper floor 3.1 m, tile eave `.7` m out with 11 rafter tails `#5B3A2A` and a scalloped
tile edge (26 scallops, real geometry on the 12 hero houses).
- Walls, left, from the door downhill: salmon `#E59A84`, white `#F2ECDD`, ochre `#E2B24A`, blue `#8FB5D6`, cream
  `#EBD9A8`, terracotta `#C8654A`, mint `#A9CDB0`, white, salmon, lilac `#B79CC9`, cream, ochre, white, blue, salmon.
  Right: (mural), ochre, white, salmon, lilac, cream, mint, white, terracotta, ochre, blue, white, cream, salmon.
- 12 HERO facades (`u 5-75`, 6 a side): arched double door `1.5 x 2.6` `#5B3A2A`, 6 panels a leaf, 18 iron studs, a
  knocker, stone surround; ground window `1.0 x 1.5` behind a 9-bar iron grille; 2 French doors `1.1 x 2.3` with
  louvred shutters (`#2F6E7A`, `#33506B` or `#5B3A2A`); a blue enamel number plate (digits only). One 1024 x 1024
  plaster canvas each: 3-tone mottling, 2-4 cracks, damp bloom over the plinth, 1-2 flaked patches showing an older
  colour. The other 16 houses: C3's facade atlas with real eaves.
- 14 BALCONIES on the hero facades: slab `1.9 x .62 x .10` `#B9B2A8` on 2 scroll brackets; railing `.95` high as 3
  alpha cards (512 x 256): top and bottom rail, 13 balusters each with one S-scroll, `#1E1B1F`.
- FLOWER BOXES on 9 balconies and 6 sills: trough `.9 x .16 x .15` `#B8643C`; geraniums, 24-40 blossoms a box, 3 crossed
  cards, 4 variants (256 x 128): `#D8432E`, `#E86A9A`, `#D2357A`, `#F4EFE4`, leaves `#4E7F3F`.
- BOUGAINVILLEA, 2 climbers: left house `u 22-30`, 5 m up to its balcony (P9); right house `u 55-62`, hanging over the
  hero post (P11-P13). Each 9 billow cards with 260 painted bracts `#C2267A / #E0469A / #8E1A5A`, leaves `#3F6B3A`;
  30 petals tear off in the gust.
- SMALL THINGS: 3 wires across the street at `u 18, 47, 90` (sag `.5` m), a pair of sneakers on the `u 47` wire; 2 wall
  lanterns on iron brackets; a bench at `u 35` left; a green handcart at `u 66` right; 5 flower pots on the stair
  pavement; 6 stone bollards `.7` m at the end.
- STREET END `u 124-127`: a stone balustrade 1.0 m across the street: 16 turned balusters, 2 piers with stone balls, a
  2.2 m opening in the middle with 5 steps down. The flood comes up these steps, then up the cobbles as SURF: the
  waterline runs 1.5 m up and back every 2.4 s behind a 1.2 m lace strip (it must read as sea, not a pond).

**E5 Mural and hoop (P9).** Wall `u 11-23`: 12 x 6.2 m plaster with a tile coping. Mural canvas 2048 x 1024: 9 wavy
bands rising 18 deg left to right, `.45-.8` m wide, wave height `.28` m, length 2.6 m, each shifted; from the bottom:
yellow `#F2C230`, pink `#E86A9A`, teal `#2F8C8C`, purple `#7A4FA3`, orange `#E0902F`, cream `#F4EFE4`, red `#D8432E`,
blue `#3F5FA8`, mint `#A9CDB0`; a 3 cm wobbling brush line `#2A2226` between bands; inside bands 2 / 5 / 8: 38 white
dots of 6 cm / 24 stepped triangles / one zigzag. Wear: 5 chipped patches `.2-.6` m showing plaster `#D9CDB8`, 12 drip
stains under the coping. No letters.
- HOOP at `u 17`: a steel arm holds the board `.75` off the wall; board centre `(3.05, -20)`, facing `(-.57, 0, +.82)`
  (uphill and into the street, so the P9 camera sees its face). Board `1.20 x .90`: 7 white planks `#EDE8DC` (shade
  `#BDB7AC`), weathered, a target `#D8432E` `.40 x .30` (line `.035`). Rim diameter `.40`, tube `.018`, `#E86A1C`,
  centre `.30` in front of the board, top 2.05 m above the cobbles under it (a kids' hoop: at `w .553` Spud's jump
  really gets there). Net: 12 loops `#F4F1EA`, `.36` long, to diameter `.26` (alpha-card tube, 256 x 256).
  `swish`: the bottom opens `.26 -> .40 -> .26` in `.3` s, then sways +-14 deg, period 1.4 s.
- BALL diameter `.24`, `#D9692A`, 8 black ribs. After the dunk it drops and bounces away downhill (gravity `9.81 w`:
  every hop lasts 1.8x as long as at full weight); from 36.7 s it floats at the flood front; it rises in P13.

**E6 Lamp posts.** 5: L1 HERO right `(+3.2, -17.66, -58)` (`u 55`, on the pavement `.6` m from the kerb); L2 left
`u 28`; L3 left `u 81`; L4 right `u 105`; L5 left `u 123`. Cast iron `#1F2422`, lit edges `#4A544E`, lantern side
`#C9A46A`. Heights above the pavement at the post:

| Part | Height | Detail |
|---|---|---|
| plinth | 0-.30 | `.34 x .34` |
| pedestal | .30-.75 | octagon `.26 -> .20`, 4 moulded rings |
| shaft | .75-2.55 | 12 flutes, diameter `.130 -> .095` |
| collars | .80, 1.25, 1.70, 2.55 | torus, shaft + `.03` |
| ladder bar | 2.62 | `.50` wide, diameter `.025`, ball ends |
| lantern | 2.75-3.35 | 4 tapered panes (`.22` square below, `.34` above), glass `#FFD98A`, centre `#FFF2C4`, black bars |
| cap, finial | 3.35-3.50 | pyramid `.40 x .14`, ball and spike `.12` |

Light: point `#FFC873` at 3.05, range 7 m; glow sprite 1.4 m; flame +-6 % at 7 Hz.
GRIP on L1 (exact): both fists on the shaft between the collars at 1.25 and 1.70, wrapped from the `-x` (downwind)
side: LOWER fist centre 1.52 (shaft diameter `.118`), UPPER fist centre 1.66 (`.114`). The 1.70 collar sits `.04`
above the upper fist: it is the stop that holds him as he gets lighter (he is never just floating beside the post).
P11 (15x): body streams toward `-x`, belly line 1.50-1.62, feet 8 deg higher than the fists. P12 (16x): same fists,
body upright against the shaft, toes `.25` over the pavement. P13 (17x): the upper fist opens at 52.2 s, the lower at
52.6 s.

**E count.** Street 11,400 triangles + backdrop (C behind the street) 26,400 = 37,800; <= 58 draw calls.
TEXTURE: cobbles, hero plaster, mural, railings, net, flowers. GEOMETRY: road, kerbs, steps, houses, eaves, balconies,
posts, hoop, ball, balustrade, small things. SPRITE: lantern glows, petals.

---

## F. Rain that falls, slows, hangs and rises; the sea lifting off (P11-P14)

**F1 Drops.** A world-fixed box round L1 (so a moving camera gets parallax): `x -7..+9`, `y 0..11` over the post base,
`z -20..+8` from the post. 288 drops: 24 HERO (diameter 30-52 mm, on the P12 camera's line, 1.2-3.5 m from it), 96 MID
(16-26 mm), 168 FAR (8-14 mm). They are drawn 6-10x real size so they read on a phone (ours, not a fact).
Atlas 512 x 256, 8 drops, each drawn once: glass body `#BFD6EE` at `.35`; a dark rim `#2B3A5A` 1.5 px lower right; a
white comma highlight upper left at `.95` and a second dot; the scene upside down inside (dark above, light below); on
drops within 6 m of a lit lamp a warm glint `#FFC873` on the lamp's side.

**F2 Tracks** (linear between keys; a drop's place is the closed-form integral, wrapped in the box):
- fall speed `vr` m/s, + is down: `(44.4, 5.5) (45.5, 3.6) (46.7, 1.5) (47.6, 0) (50.0, 0) (50.5, -.5) (51.5, -2.0)
  (53, -4.2) (55, -6.5) (60, -9)`; share of drops shown `P(44.4, 45.4)` (the gust of P11 brings the rain).
- wind `wx` m/s: `(43.3, -9) (46.0, -6) (46.7, -1.2) (47.6, 0) (50, 0) (52, -.8) (55, -1.5)`.
- Nothing wraps during the hold. A drop that re-enters at the bottom while `vr < 0` is born from the wet street with a
  pinch-off dome. (Real rain at 16x would still fall at about 2.9 m/s; the sheets say it hangs at 16x and rises at 17x,
  so the track follows the sheets.)

**F3 Shape by speed** (`v` includes the wind):

| `v` | Shape |
|---|---|
| over 3 m/s | STREAK: length `v x .046` m, width `.55` of the diameter, alpha `.55`, thick end leading |
| .4-3 | TEARDROP: tail `diameter x (1 + 1.6 v / 3)` BEHIND the motion (above when falling, below when rising) |
| under .4 | BEAD: tail `.35` diameter (P12's pointed tops), wobble aspect `1 +- .06 sin(2 pi 2.2 t + phase)` decaying to `+-.02` |

**F4 P12 must read as FROZEN** (hold 47.6-50.0 s; never as a stuck video: story.md 3). Six cues, all required:
1. The stop is seen: 46.7-47.6 s the streaks shorten into beads; 30 % of the MID drops keep a hairline `.25` m above
   them for 1.0 s (alpha `.25 -> 0`): where they came from.
2. PARALLAX: the camera drifts `.30` m sideways through the hold, so near beads slide across far ones. This is the cue
   that says "hanging in space".
3. The world keeps moving: sun comb racing, lantern flicker, the swell at the street end, his leaf, his eyes.
4. 5 frozen CROWNS on the cobbles near L1: 9 beads standing `.06-.12` m over a puddle on thin necks.
5. 7 stalled DRIPS on long necks under the balcony and eaves above the post; the gutter chevrons stop.
6. Hero beads, from the post base: H1 `(-.42, 1.78, +.30)`, H2 `(-.95, 2.25, +.55)`, H3 `(+.30, 1.20, +.80)`. H1
   hangs `.32` m in front of his face, drifts `.04` m on his breath at 48.4 s and splits in two at 48.9 s.

**F5 P13 must read as UP** (from 50.0 s). Nothing plays backward; every cue is new water LEAVING a surface:
1. The shape flips: tail now BELOW, the thick bright head above, the tail fading downward; `0 -> 4.2` m/s in 3 s.
2. SPLASH-UP: every puddle grows domes (`.06` wide, `.05` high) that neck and pinch off beads of 14-26 mm; each leaves
   ONE ring that spreads OUTWARD; 48 beads live over the 9 puddles (<= 36 in frame); puddle radius x
   `(1 - .7 P(50,55))`.
3. The 5 crowns let go upward; the 7 drips pass their own gutter going up; the kerb rivulet breaks into a row of beads
   that lifts off as a wave running down the street at 6 m/s.
4. 5 drops leave his sweater and leaf; his hem and leaf float up.
5. Loose things go with it: 14 leaves, 9 pebbles (`.02-.06` m), 30 petals, the ball, 2 roof tiles: `.6-1.8` m/s up,
   tumbling 20-90 deg/s.
6. A drop passing the lantern flashes warm for 2 frames.

**F6 The sea lifts off.** Low-weight swell from 43.3 s: heights x `(1 + 1.4 P(43.3,48))`, speeds x
`(1 - .65 P(43.3,48))`: tall, slow, glossy; during the hold 40 spray beads hang over the surf at the street end.

| `lift` | 0 | .5 | 1 |
|---|---|---|---|
| surface | heaving, whole | 40 domes of 6-20 m standing 3-9 m high | 6 m lower |
| blobs free | 0 | 11, 4-30 m up | 22, 10-400 m up, the largest 26 m across |

Blobs B0-B21: born at `50.2 + .38 i` s at seeded points `x +-260, z -82..-700`; diameters cycle `3.2, 4, 5, 6, 8, 10,
12, 14, 18, 22, 26` m; B0 at `(-6, -88)`. Life after birth: `0-.8` s a dome; `.8-1.5` s a cap on a tapering stalk;
at `1.5` s the stalk snaps into 3 trailing teardrops; then it rises at `.9 + .35 (s - 17)` m/s^2, capped at 14 m/s;
radii breathe +-12 % at `.7` Hz in 3 modes; it turns 12 deg/s. Three CLOSE blobs from the street flood (`1.2, 1.7,
2.2` m; born at `x -3.5 / +2.8 / -1.0`, `z -70..-84`, at 50.6, 51.4, 52.3 s) cross the edges of P13's frame.
Look: icosphere 320 triangles (80 beyond 300 m), cap flattened, underside pulled into 3-5 drip lobes; body `#3F9FB4`
at `.42`, rim `#1F5F7A` at `.75`, 3 white highlight patches upper left (decal 256 x 256), inner veins `#9FE0E0` `.35`,
sunset side `#FFB98A` `.30`.

**F count.** P12: 288 drops + 40 spray beads + 12 necks + 8 sun = 348 transparent. P13: 240 drops (FAR cut to 120) +
75 blob teardrops + 25 blobs + 36 beads + 8 sun = 384. Opaque: 55 loose things. TEXTURE: drop atlas, highlight decal.
SPRITE: drops, beads, teardrops, spray. GEOMETRY: blobs, crowns, domes, loose things.

---

## G. High above Quito, the horizon curving (P14, 55-60 s)

World HI. A SMALL planet, so the limb bends inside a narrow 9:16 frame: sphere radius 2,400.

| `alt` | 0 | .5 | 1 |
|---|---|---|---|
| camera height over the surface | 1,100 | 1,450 | 1,784 |
| horizon dip | 46.7 deg | 51.4 | 55.0 |
| camera pitch (down) | 43.7 deg | 48.4 | 52.0 |
| limb at the frame edges, lower than in the middle | 75 px | 90 | 102 |

- CAP: 60 deg of the sphere round the point under the camera, 64 x 32 segments. Relief: two cordilleras running into
  the picture 110 apart, 14 peaks 18-46 high (6 with snow), Quito's valley between them, flanks falling to the sea.
- MAP 2048 x 2048 + a 1024 x 1024 inset over Quito's valley, painted in this order: paramo `#6E7F4E`, ridges `#7A6A50`,
  valley `#5E8A44`, cloud-forest flanks `#2F5F34`; SEA `#1F4666` everywhere under the flood line with foam lace on
  every coast (the Pacific stands at the foot of the west range; the Amazon side is an ocean with ridge islands); Quito:
  2,200 light dots `#FFC873 / #FFE2A9` in a strip 30 x 6 with 3 dense cores; 6 towns of 60-140 dots; over the sea two
  speckle layers (white-teal dots) rising 4 and 9 a second: the ocean leaving.
- CLOUDS: `gclouds` cloud-sea lobes, 96 lobes of 2 sprites in two banks, lower left and lower right, 20-40 over the
  land, tops sheared into streaks toward `-x`; top `#F2F0F4`, shade `#7C86B8`.
- AIR: a band along the limb, 64 segments x 2 strips; from the ground out `#BFE0FF` (0-.4 deg), `#5F8FE0` (1.2),
  `#2B3470` (3), space `#0A0E24` (from 8). Above it B4's star wheel at `.6` and B2's sun comb with 2 ghosts just over
  the limb at az +8..+16 (P14's streak on the right).
- RAIN AND BLOBS: 120 of F's drops (HERO and MID), tails down, passing him upward at 2-6 m/s; 9 blobs of 1.5-6 m,
  8-60 m from the camera, 4 teardrops under each.
- SPUD: front view, 290 px tall (15 %), centre `(560, 820)`, face at `y 780` (80 px lower than the sheet, for the
  caption band).

**G count.** 4,352 triangles; 359 transparent (192 cloud, 120 drops, 9 blobs, 36 teardrops, 2 sun); <= 14 draw calls.
TEXTURE: map, inset, speckle. GEOMETRY: cap, limb band, blobs. SPRITE: clouds, drops, sun.

---

## H. Space (P15-P17, 60-77.5 s)

World SP, Earth at the origin, radius 100. Key toward `(-.55, .30, .78)` `#FFF1DC`; on Spud an earthshine fill
`#7FA6E0` at `.35`, and from P16 a warm rim `#FF9A3C` at `.25`. Spud is fully lit in every frame (cast colours stay).

**H1 Starfield.** One dome r 9,000, canvas 4096 x 2048, drawn once, static: ground `#070A1C -> #0C1230`; 2,400 stars:
1,800 faint (1 px, `#C9D2F2` at .5-.8), 480 mid (1.6 px), 120 bright (2.5-4 px with a 9 px four-point glint; `#FFF4DC
#DCE6FF #FFD9B8 #BFD0FF`); a Milky Way band 28 deg wide from upper left to lower right: tints `#3A2F6A`, `#1F3A6A`,
`#5A2F5E` at `.35`, 600 micro-stars, 9 dark dust lanes.

**H2 Globe** (to the cut at 73.3). Sphere 64 x 40.
- MAP 2048 x 1024, land outline from Natural Earth 110 m (public domain) cut to <= 1,400 vertices: ocean deep
  `#123A6B`, mid `#1E5A9A`, shelf within 3 deg of a coast `#3F8FC0`; lowland `#4E7A3A`, rainforest `#2F5F34` (Amazon,
  Congo, SE Asia), dry `#B99A5E` (Sahara, Arabia, Atacama, Australia), steppe `#8E8A5A`, mountains `#7A6A50` with snow
  dots `#F2F0EE` (Andes, Rockies, Alps, Himalaya), ice `#F4F6F8` (Antarctica, Greenland, Arctic); coast ink `#0E2A4A`
  `.5` px. One warm glint `#FFC873` at lon -78.5, lat 0: Quito, where he came from.
- CLOUDS, shell r 101.2, alpha 2048 x 1024: 3 comma cyclones 12-18 deg across at lat +-28..45, a broken equator band of
  60 puffs, 140 patches, all smeared east-west x `(1 + .25 (s - 18))`; `#F6F7F8`; a shadow copy 1 deg off at `.8`.
- NIGHT LIGHTS, emissive 1024 x 512: 900 dots `#FFC873` in 24 clusters, seen only on the night crescent (lower right).
- AIR, shell r 103: limb glow `#7FB6FF` `.55` fading inward over 6, brighter on the sun side.
- TURN: west to east, 28 deg/s at 20x to 45 deg/s at 22x (a watchable stand-in: the true turn would be a blur). P15
  opens on South America (point under the camera lon -62, lat -8), the equator tilted -12 deg on screen.

**H3 The spray band of ocean and air** (`peel`).

| `peel` | 0 | .5 | 1 |
|---|---|---|---|
| band | a foam line on the equator, +-1.5 deg | annulus r 100 -> 150 | annulus r 100 -> 240 (leaves the frame right, as P15) |
| dry belt on the map `#6A5A4A` | none | +-6 deg of latitude | +-14 deg |
| air shell gain | 1 | .65, streaming off at the equator | .35 |
| glow line at the root `#FFD27A` | 0 | 1.2 wide | 2 wide |

Annulus in the equator's plane, 96 x 6 segments, 3 layers 1.2 apart (canvas 2048 x 512, radius along v): inner dense
`#F4F8FA`, middle `#CFE4F6`, outer mist `#9FC8F0` to alpha 0. The inner edge turns 1.3x the globe's rate, the layers
1.0x and .7x, so the arms TRAIL in spirals (flung matter falls behind: true). 96 billow sprites over the inner 30
(+-3 off the plane), 60 droplet glints. The near half passes IN FRONT of the globe, the far half behind it.

**H4 Bulge, squash, glowing cracks** (`squash`, `cracks`).

| | 0 | .5 | 1 |
|---|---|---|---|
| `squash`: equator radius / pole radius | 100 / 100 | 132 / 51 (2.6 : 1 = P16, reached at 68.9 s) | 168 / 9 (a lens 18 thick) |
| `cracks` | none | 9 primaries 70 % shown + 10 connectors, `.5` wide, `#FF9A3C` | all; primaries 2.2 wide: core `#FFF2B0`, mid `#FFB13C`, edge `#E0481E`, a halo 4 wide `#FF7A2A` at `.5` |

- NETWORK (emissive 2048 x 1024, reveal order baked in, redrawn per 1/200 of `cracks`): 9 primary cracks zigzag along
  lat +-6..22 deg, each 40-80 deg of longitude with 5-8 bends; 26 meridian connectors; 34 plates of 8-22 deg; 60 hairline
  branches. From `cracks .6` the 34 plates lift 0-6 and tip 0-9 deg, with glow in the gaps.
- MAP: the dry belt chars to `#4A3A34` and widens to +-30 deg; seas and clouds stay on both caps (P16).
- DUST: 26 clusters x 5 billow sprites from the belt at both limbs (P16's plumes upper left and right), 10 -> 60
  across, lit `#C9B8A6`, body `#8A7A6E`, shade `#4A4048`, trailing against the turn.
- ROCKS: 90 (20 triangles, 1-6 across, `#5E4A40`, 30 % with one glowing face) leave the belt at 12-30 a second,
  tumbling. They become the ring.

**H5 The flat disc and its ring** (P17, from the cut at 73.3; the cut hides the model swap). Disc radius 168, rim 18
thick, turning 50 deg/s, wobbling 2.5 deg at `.4` Hz.
- TOP, canvas 2048 x 2048: the flat-earthers' own map: North Pole in the middle, the continents fanned round it,
  ANTARCTICA AS A WHITE ICE WALL 6 wide all round the edge (`#F4F6F8`, blue shade `#B9D2E8`, 48 buttresses). H2's land
  and sea colours; clouds as thin concentric streaks; 14 waterfalls over the rim (ribbons 1-3 wide, 20 long, to mist).
- RIM, canvas 2048 x 256 round the edge: soil `#6A5548`, 8 rock strata `#4A3F3C / #5E4A40`, a fracture every 4-9 deg,
  the lower third glowing `#E0481E -> #FFB13C`, 24 lava drips 2-8 long, dark at the tips. Underside `#2E2628` with a
  glowing crack web.
- RING, tilted 8 deg off the disc: 3 bands r 215-248 `#C9A46A` at `.8`; 254-290 `#A8845A` at `.55`; 298-330 `#8A7A6E`
  at `.3`; 5 thin gaps. Canvas 2048 x 256 (angle x radius): 2,600 grains (1-4 px; 8 % glints `#FFE2A9`, 5 % embers
  `#FF9A3C`), 40 fine spokes; 3 layers turning 34 / 26 / 19 deg/s (inner fastest). 160 orbiting rocks (.8-7, 20
  triangles); 12 hero rocks of 6-14 with a glowing cracked face; 8 chunks drifting between the camera and Spud (P17);
  48 glow sprites on the inner band `#FFB13C` `.25`; 30 bright arc streaks 8-25 deg long, `.3` wide, `#FFE2A9` `.6`.
- SHEDDING: 12 rocks a second leave the rim on tangents and spiral out to the ring in 2.5 s.

**H6 Spud's scale on screen.**

| Panel | Earth (px at 1080 x 1920) | Spud | Camera from Earth's centre, fov 40 |
|---|---|---|---|
| P15 | disc 700 across, centre `(520, 880)` | BACK view, 330 px tall (17 %), centre `(760, 1500)` | 761 |
| P16 | lens `1020 x 390`, centre `(540, 800)` | back view, 380 px, centre `(700, 1560)` | 690 |
| P17 | disc ellipse `760 x 190` + rim 50, centre `(560, 760)`, turned -13 deg; ring's outer ellipse `1500 x 520`, turned +18 deg | FRONT view, 420 px (22 %), centre `(600, 1520)`, face `y 1440` | 1,165 |

**H count.** P15: 14,976 triangles (globe, clouds, air, 3 annulus layers), 160 transparent. P16: + 1,800 (rocks),
<= 137 transparent. P17: 7,056 (disc, ring layers, 180 rocks), 95 transparent. <= 22 draw calls.
TEXTURE: stars, map, clouds, night lights, crack network, annulus, disc top, rim, ring. GEOMETRY: globe / ellipsoid,
plates, disc, rocks. SPRITE: billows, dust, glints, glows, arc streaks.

---

## I. The chip

The hud `gforce` look, new text. Value + `x`, no space. One key every whole second `n = 0..77`: `2.0 + 0.3 n`.
- Format: one decimal under 10 (`2.0x`, `9.8x`); from 10 the shortest form (`11x`, `11.3x`, `18.5x`), as the sheets.
- CapBlack 150 px, tabular digits, cream `#FFF8EC`, 12 px outline `#120F14`, no plate, centre `(540, 250)`.
- Tick: scale `1.14 -> 1` in `.16` s with a 3 px drop. On a tick within `.34` s of one of the 16 cuts: gravity's slam
  `1.35 -> 1` in `.25` s, 6 px.
- Colour: cream; amber `#FFD25A` from 10.1x (27 s, the first weight line); red `#FF6A4D` from 17x (50 s, weightless).
- On screen to the last frame. Drawn at 1080 x 1920 over everything.
- Sheet labels the ticks hit exactly: 2.0, 3.5, 4.7, 6.5, 7.7, 11.3, 17, 18.5, 20. At the other eight cuts the chip
  shows 2.6, 5.3, 9.8, 12.8, 14.9, 15.8, 21.8, 23.9 (within `.2x` of the sheet).

---

## J. Cameras the sets are composed for (starting points; the director owns them)

| Panel | t | Pos | Look | fov | Frame check at 1080 x 1920 |
|---|---|---|---|---|---|
| P1 | 0-2.2 | `(.55, 1.28, .60)` | `(.15, .10, -8)` | 59 | Spud at `(.10, 0, -1.25)` cut by the left edge, face `y 1310`; LOMA + CH1 over his head (`y 550-960`); W1 `y 870-1170` in the right half, over the sill; table lamp and clock lower centre; horizon `y 720`; the sun's arc tops out behind the chip |
| P2 | 2.2-5.0 | `(40, 62, 250)` | `(-60, -170, -1500)` | 50 | CH2 left of centre, CH3 bottom right, volcano summit `y 520`, R1-R5 as islands between |
| P3 | 5.0-9.0 | `(800, -60, -900)` | `(800, -286, -1250)` | 44 -> 36 | VALLE in the lower 70 %, CH4 right of centre, hills and streaked sky in the top 20 % |
| P4 | 9.0-11.5 | `(-1.30, 1.05, .90)` | `(1.57, .80, -1.11)` | 52 | Spud at `(.55, 0, -.75)` left of centre; window's right end at the left edge, picture and bookshelf centre, CRT right; manta lower left, rug |
| P5 | 11.5-15.0 | `(.50, 1.00, .05)` | `(1.05, 1.10, -2.65)` | 56 | Spud's back centre (he walks `x .72 -> 1.48` at `z -2.12`), the pull right of him, the eye `y 820`, side table and sofa arm left |
| P6 | 15.0-19.0 | `(-.35, .95, -.55)` | `(-.05, .80, -2.40)` | 54 | his head `y 1150`, clock lower right, lamp right, the terminator crossing the glass above |
| P7 | 19.0-26.7 | `(.55, .80, .95)` | `(-.25, 1.05, -1.60)` | 56 | face `y 1400` looking up; the hero crisp comes down `y 700 -> 1350` |
| P8 | 26.7-31.0 | `(-.75, .45, .70)` | `(.15, 1.75, -.60)` | 58 | low angle: shade `y 560-760`, his face `y 980` at the bonk, beams above |
| P9 | 31.0-36.7 | `(-1.6, -9.9, -13.5)` | `(2.2, -9.4, -20)` | 55 | rim centre `y 980` (lower than the sheet, for the caption band); mural lower right; street, CH1, sea lower left |
| P10 | 36.7-43.3 | `(.3, -12.2, -29)` | `(0, -17.5, -70)` | 55 | Spud 1.0 m over the cobbles at `u 40`, puddle `(41)` under him, flood front at the far end |
| P11 | 43.3-46.7 | `(-1.9, -16.4, -53.5)` | `(2.4, -16.3, -58.5)` | 50 | post at `x 820`, body streaming to frame left, lantern `y 300` |
| P12 | 46.7-50.0 | `(2.0, -16.4, -53.0)` | `(1.6, -18.6, -75)` | 52 | post at the right edge, sea at the street end in the middle, hero beads over the left half |
| P13 | 50.0-55.0 | P12's, tilting up 6 deg, rising `.8` m | | 52 | he leaves the post upward left; blobs at three frame edges |
| P14 | 55.0-60.0 | HI `(0, 2400 + height, 0)` | pitched down as G | 50 | limb `y 1070` in the middle, `y 1170` at the edges; Spud above it against the dark sky |
| P15-P17 | 60.0-77.5 | SP, H6 | Earth's centre | 40 | H6 |

Keep every camera OUTSIDE: room `x +-2.10, z -2.65..3.45, y 0..3.55`; street corridor `x +-3.8` up to the eaves
(6.5 m over the cobbles); terrain = C1's height + 2 m; hurricane discs `z -1480..-1530`; globe r 103; the ring plane.

## K. Open questions (my default) and departures from the sheets

1. Sky clock `12.5 / s` seconds a day, phase `.22`: the sun sets inside the hook (1.57 s) and P2 opens moonlit until
   3.80 s. DEFAULT: keep (retune with the two numbers in `phi` / `psi` only).
2. Chip on whole seconds with the true value, centre `y 250` (gravity was delivered at `y 445`). DEFAULT: as section I.
3. Room mirrored against gravity (sofa left, TV right, sliding sash right). DEFAULT: yes, P4-P7 need it.
4. A hurricane cannot form on the equator; the sheet shows one at Quito. DEFAULT: as drawn, never said as a fact.
5. Crisps sink about 6x slower than 79 % weight gives; rain stops at 16x by a track, not by physics. DEFAULT: the
   sheets' picture wins, both marked as ours.
6. New asset: Natural Earth 110 m land outline (public domain). DEFAULT: add it to `docs/ASSETS.md`.
7. TV shows a satellite weather map, not football (no humans on the channel). DEFAULT: weather map.
8. Disc top = the flat-earther map with Antarctica as the rim ice wall. DEFAULT: yes.

Departures: P6's bed is the sofa under a quilt. P5's steps (lower right) are left out: they would stand in the slam
lane. Hit stars, slap lines and sweat drops become real effects. P9's rim and P14's Spud sit lower in frame than drawn,
to clear the caption band. P10 draws the church right of the volcano; ours is left of it, as P9, P11 and P13 have it.
The hoop's rim is 2.05 m, a kids' hoop.
