# "I could see everyone's happiness score": DESIGN (16 Nov 2026)

Target: sheets 1-4 (panels 01-48) and OUTLINE.md. Metres, hex, px at 1920x1080 (`"frame": "wide"`, safe zone x
80-1840, y 40-960), 30 fps, y up, a character's front +z. Everything is a function of story time and keys ("hashed" =
a hash of the item's index). Glass, water, light and rain are `userData.steam` and cast no shadow. No word or numeral
in 3D except the two notebooks (6). "(measure)" = the builder reads the value from the code or a bench still first.

**Build method.** The layered envs are 896x1344 portrait paintings (`river-calm`, `golden-country-road`,
`lake-sunset`...): they cannot cover 16:9, and Atlantis block A showed the cast looks pasted on a flat painting. So
every place is ONE painted plate (gpt-image-2 on Jonny's PC from the approved panel crop, 1536x1024) PROJECTED on
true-depth 3D, the Atlantis block C way (`engine/page/props-at-c-plate.js`, kind `cplate`: floor, walls, cut cards,
`tops`, `solids`). Whatever a character stands on, sits on or holds is real 3D. Cameras stay within 1 m of the
painter's camera; pushes use fov. Only the memory (7) is a flat plate with relief (`set-plate.js`).

**Cast (reused, measured):** Spud 0.88 tall x 0.76 wide x 0.66 deep; Mash 1.24 x 0.54 x 0.50; Chip 0.53 x 0.57;
Wedge 0.98 x 0.88. Mash carries no phone in this film.

---

## 1. The glasses + case

**Kind `scoreglasses`** (new, `props-score.js`), 1.8k triangles. ONE size in the whole film (it is one object).
- Each rim: a torus, centre radius 0.090, tube 0.011 squashed to 0.8 in depth: outer diameter 0.202, clear opening
  r 0.079. Bridge: an arched tube r 0.008, 0.034 long, rising 0.012. Overall width 0.438, height 0.202.
- Temples: 0.17 long, 0.012 x 0.006, hinged at each rim's outer edge at mid height, splayed 12 degrees outward.
  Key `fold` 0..1: the wearer's left temple folds 90 degrees inward over 0..0.5, the right over 0.5..1 (folded
  depth 0.030).
- Tortoiseshell, drawn once (one canvas per rim): honey #c98a3a, 26 blotches #5a3418 per rim (1.5-4 cm, hashed,
  40 % cover), 9 amber flecks #e9b25c, ink #3a2412.
- Lens: a disc r 0.079, tint #fff6e0 at opacity 0.10, one white streak (alpha 0.35, 0.05 long, 35 degrees) upper
  left. `userData.glass` + steam. No refraction.
- **The scratch:** on the WEARER'S LEFT rim (screen-left in 45, where the camera is on the wearer's side), at 10
  o'clock: a pale line #f3d9a8, 0.022 long, 0.002 wide, at 40 degrees, plus a 0.006 nick. Visible in every close shot.
- Origin: the bridge's middle. Front (lenses' outside) = +z.

**Worn = `spec.wear: "spud"`** (stage.js worn props; the `eyemask` of props-heist.js is the pattern: eyes are bulbs
that stand out, so the lens plane sits in front of them). Fit table, offsets from "eye midpoint" (measure Spud's eye
height and spacing in face.js; if the spacing is not 0.236 the glasses stay as designed and centre on the midpoint;
both eyes must stay inside r 0.079 at `shocked`):

| pose | panels | y | z from skin | tilt (top toward face = -) |
|---|---|---|---|---|
| nose | all worn | +0.005 | bulb apex + 0.004 (measure), min 0.012 | -6 |
| half lowered | 02 | -0.10 | +0.05 | -25 |
| forehead | 28 | +0.20 | on the dome + 0.004 | +28 |
| lift | 42 | +0.16 then +0.34 (leaves frame top) | +0.06 | +15 |

On Spud they span 58 % of his width (panel 11: 60 %). Mash never wears them in the present; on painted kid Mash
(30) they span 80 % of his face ("a little too big"). Brows draw over the rim.

**Two instances, swapped on cuts** (clip-lesson: a prop that changes hands gets a second prop): `gl-worn` (wear) and
`gl-loose` (held, in the case, on the bench). Never both visible.
- 02: `gl-worn` at "half lowered"; Spud's R glove is posed onto the right hinge (the hand follows the glasses, the
  glasses do not hang from the hand).
- 32-33: `gl-loose` in Mash's BOTH hands, one glove on each hinge (0.44 apart, his body is 0.54), at seated chest
  height y <= 0.62, lenses up-forward. He turns it about its long axis +-40 degrees, 1.6 s each way, twice.
- 42: `gl-worn` tweens nose -> lift over 0.5 s (ease out); Spud's R glove on the right hinge the whole way.
- 45, 48: `gl-loose`, `fold` 1, lying on the bench seat lens-up-forward: tipped back 24 degrees on its folded
  temples, lenses facing -z (the valley, where Spud stands in 45), 0.35 from the seat's right end.

**Kind `scorecase`**, 0.8k triangles: clamshell 0.48 x 0.235 x 0.09 closed, corners r 0.04, hinge on the long back
edge, key `open` 0..1 = 0..110 degrees. Dark green #2f4a3a, 14 hand-placed scuffs #6f8a72 on edges and corners, brass
clasp #b08a3a 0.03 wide, felt lining #c9b78f. 02: lies open in the DON'T-KEEP box. 26: closed, Spud's R hand flat on
its top lifts it 0.25 (the grab is `keep: true`, hand placed first).

**Kind `keepbox`** (the DON'T-KEEP box), 0.6k: 0.62 x 0.46 x 0.40 kraft #b98d5a, four flaps open at 100-125
degrees (each different), one corner dented 0.02. On the front a rough red patch #b23a2e, 0.34 x 0.13, 12
hand-placed bristle strokes at its edge; lettering: open question 6. On the floor, never held.

## 2. The glasses view

A new overlay (`engine/page/score.js`) + the grade (5). One look: the dark double circle of 01 / 04 / 10 / 21 at
the rim THICKNESS of 40, in greyscale (40's brown rims would break "tags are the only colour").
- Grade on the whole 3D frame: saturation 0, contrast 0.95, lift +0.03 (soft grey, no crushed blacks).
- Mask, wide: two discs r 500 at (520, 540) and (1400, 540): edges at x 20 and 1900, y 40 and 1040, cusps at
  (960, 302) and (960, 778). Outside the union: flat #1d1c1b. Rim: a ring 40 px wide inside each disc, #3b3936 with
  the tortoise blotches in grey (#2a2826, same hashed layout as the prop), a 2 px inner bevel #cfcac2 at alpha 0.4.
  Bridge: a bar 150 x 70 over the top cusp (y 262-332). The scratch: on the RIGHT disc's rim (wearer's left) at 10
  o'clock, 46 px, 3 px wide, #d8d4cc.
- Lens: no distortion (keeps the frame sharp). Vignette inside each disc: 0 at r < 380 rising to 18 % at r 460.
- Mask, tall parts (1080x1920): ONE disc r 520 at (540, 880), same rim; above y 360 is dark and holds HUD + caption.
- In: hard cut; in the first 4 frames the mask settles from scale 1.06 and 10 px low (glasses seating on the
  nose); tags pop in 3 frames (scale 0.8 -> 1), 2 frames apart, left to right. Out: hard cut. No sound.
- Captions and text cards sit on the dark top band between the discs (x 700-1220, y 60-300).
- **A "check" is always a two-shot unit:** (a) the panel's outside shot in colour, Spud's eyes go up (11, 18, 38),
  no tag; (b) a 0.8-1.0 s glasses view looking UP: the top rims, Spud's own leaf tip entering from the bottom edge
  (a `spud` leaf only, 3D, 0.5 m in front of the lens), the sky or ceiling of the same plate, and his tag ticking
  down with the -1. Reflection checks (13 mirror, 14 kettle, 15 puddle, 01 van window, 35 window): (b) is a glasses
  view of the reflection with the tag over the reflected head.
- Reflections are a card, not a second render: `reflectcard` shows a bench render of the engine's own Spud with
  glasses (`assets/props/score/spud-reflect-front.png`, `-side.png`, 1024 px, transparent). Opacity: van window
  0.45, bare window 0.35, puddle 0.70 (flipped, 3 px sine wobble at 0.8 Hz), kettle 0.85 mapped on the lathe (the
  curve gives panel 14's fish-eye). Sheet miss 15 is fixed by this card.

## 3. The score tag

Drawn in 2D by `score.js` after the grade, so it keeps its colour in a grey frame. Anchor (`popAnchor`, text.js):
the leaf tip + 0.10 m, averaged over t, t-1/30, t-2/30 (a soft lag, still a pure function); bob +-3 px at 0.5 Hz.
- Shape: a pill, 2.14 : 1, corner radius 0.45 x height. Ink line #5a4520, 2 px.
- Size by the character's body height on screen (Mash x 1.15, extras and dog x 0.85):

| framing | body px | tag w x h | digits |
|---|---|---|---|
| wide | <= 300 | 120 x 56 | 36 px |
| medium | 300-600 | 170 x 80 | 52 px |
| close | > 600 | 236 x 110 | 72 px |

- Colour by score (flat fills, 4 steps): <= 35 #cbb98a · 36-60 #e6cf8a · 61-85 #f3dc8c · >= 86 #ffe9a3.
- **Glow with no magic glow:** a painted lantern, not a blur: a 3 px inner rim #fff4cf, and from score 61 one
  hard-edged outer band (6 px; 10 px from 86) of #f3dc8c at alpha 0.35. It lights nothing in the scene. Tags
  <= 60 have no band (panel 11's "small dim").
- Digits: the caption face `900 CapBlack`, ink #3a2c12, each digit centred in a fixed 0.62 em cell.
- **A change (tick):** odometer: the old number slides DOWN 40 % of the tag height and fades over 5 frames while
  the new one comes in from above; the fill steps colour at frame 3. Mash's 88 -> 86 -> 84 (1:24): two ticks 2.0 s
  apart, nothing floats.
- **The -1** (Spud only, the price of checking): "−1" in #e6cf8a leaves the tag's top edge at the tick's frame 3,
  rises 90 px in 0.9 s (ease out), greys to #9a9a9a from 0.4 s, alpha to 0 over the last 0.3 s. 0.75 x the digit
  size. No chime, no pop, no burst. At 0:42 (twist 1) it is the text card: 150 px, rises from Spud's tag to
  (960, 170), holds 1.2 s, greys and fades in 0.4 s.
- Outside the glasses view no tag exists, except: **29** (memory): tag "90", close-size x 0.8, drawn in the same
  shape with a pencil line (ink #6b5a3a, 3 px, 2 px hashed wobble) so it belongs to the page; **45** (below).
- **45, inside the lens:** camera on the bench behind `gl-loose`; the real 3D Spud stands 2.4 m beyond and is seen
  through the wearer's-right lens (screen right; the scratch is on the other one). `score.js` projects that lens to
  a screen ellipse and clips the tag to it (tag = medium size x 0.6, anchored on Spud). Roll 29 -> 60 over 1.2 s,
  hold 0.5, 60 -> 90 over 1.2 s (ease out); fill steps through the 4 colours, band from 61. Default: the picture
  inside the lens keeps its colour as panel 45 shows (open question 2).

Numbers: mover 63, dog 97, baker 71, Chip 93, Wedge 82 (party view 21), Mash 88 / 86 / 84, kid Spud 90.
Spud: 41 (0:00) · 40, 39 (0:42) · 38, 37, 36 (0:50-1:02) · 35, 34, 33, 32 (party) · 31 (1:35) · 30 (1:40) · 29 (2:36).

## 4. The HUD and text cards

Extend `engine/page/hud.js` (the house chip: height 70, pad 22, `900 44px CapBlack`, fill rgba(18,16,24,0.66),
edge rgba(255,255,255,0.16), text #fff8ec). The money redo's `money` / `sun` blocks are not on main and not needed.
hud.js is tall-only today: the builder adds wide placement from `engine/shared/frame.js`.
- **Own chip** (`"hud": { "own": keys }`): top-left, x 80, y 40 (tall: x 60, y 214). A 44 px glasses glyph (two
  rings, #e6cf8a) + the number. It ticks with every check (the same odometer, 5 frames) and gives the house kick
  (scale 1.06, 0.15 s). The number's colour follows the tag's 4 steps.
- **Train chip** (`"hud": { "train": keys }`): top-right, right edge x 1840, y 40 (tall: right edge 920, y 214).
  A 44 px locomotive-front pictogram (reads with no English) + text. Under it 4 day pips (r 7, 12 apart): Thu, Fri,
  Sat, Sun; done days #fff8ec, today #e6cf8a, later ones outline only.
  0:06 "SUN 19:42" (slides in 0.3 s) · 1:40 flips to the countdown "09:12" · 2:30 "00:58" · 2:36 "00:41" ·
  2:42 "00:22" · 2:52 "00:12" · 3:06 "00:03" · 3:10 "00:00"; between keys the minutes count down over the key's
  dur. Under 01:00 the text is amber #ffb648. At 00:00: one kick (1.08, 0.2 s) with the real train whistle; no
  blink, no DEAD.
- **Leaving:** the own chip fades over 0.5 s at 2:52 as the glasses lift; nothing replaces it. The train chip
  stays to the whistle and fades 3:14-3:15.
- **Text cards** (pale gold #f3dc8c, ink stroke #24232b 12 px, CapBlack; never over a face or a tag: take `pos`
  from `qa/camfit.mjs`):
  "41" 0.0-2.6 s, 220 px, at (960, 180) on the mask's top band; at 2.6 s it shrinks in 0.35 s INTO the own chip
  (the chip appears with it). "88. HOW?" 6.4-9.4 s, 150 px, (960, 180). "−1" as in 3. "HAVE YOU?" 2:43-2:47,
  150 px, (960, 180) on the glasses-view band of 40. "Follow for the next question." 3:19, 64 px, white #fff8ec,
  (960, 150), over the walking-away shot, fades with the picture.
- Captions: upper third, top at y 128 while a chip shows (the wide default 70 collides with the chips), max width
  1160; tall: y >= 316. HUD and tags go to the layout as cards so `qa/framing.mjs` sees a face under one.

## 5. The colour arc

One pair of numbers per shot, driven by Spud's score: **S** (final saturation of the grade pass) and **W** (warmth,
-1..+1: highlights shift r +0.04W, g +0.012W, b -0.04W; shadows the reverse at half strength).
Rule: S = 1.10 - 0.055 x (41 - score), W = 0.6 - 0.1 x (41 - score). A check moves both one step, inside the
check's glasses-view cut, so the next colour shot is visibly one shade greyer.

| time | score | S | W | note |
|---|---|---|---|---|
| 0:02-0:42 | 41 | 1.10 | +0.6 | warm autumn town (02, 03, 05-09) |
| 0:42-0:50 | 39 | 0.99 | +0.4 | 12: the rain plate is itself grey |
| 0:50-1:02 | 38-36 | 0.94-0.83 | +0.3..+0.1 | Spud's flat, wet street |
| 1:02-1:35 | 35-31 | 0.77-0.55 | 0.0..-0.4 | Spud's side of the party only |
| party warm zone | - | 1.12 | +0.8 | fixed: it is what he misses |
| 1:35 balcony 23 | - | 0.90 | 0.0 | Mash's shot: night blue, warm town lights |
| 1:40-2:30 | 30 | 0.50 | -0.5 | cold Sunday (25-28, 31-36) |
| memory 29-30 | - | 1.00 | 0 | the plate's own warm watercolour, grade bypassed |
| 2:30-2:52 | 30-29 | 0.50-0.45 | -0.5 | the plates ARE golden; the grade hides it from him |
| any glasses view | - | 0 | 0 | section 2 |
| 2:52 flood | - | 0.45 -> 1.22 -> 1.16 | +0.8 | below |
| 3:13 sunset 47 | - | 1.18 | +0.9 | 48: 1.12 |

- **The party edge (19, 20, 24):** three causes stacked, all on screen. (1) The `stringlights` (22 bulbs) hang only
  over x -3.0..+0.8 of the room: no bulb over Spud's corner. (2) Three warm point lights #ffc878 at y 2.2, x -2.4 /
  -1.2 / 0.0, range 3.2, so their light ends on the floor at x 1.35; Spud (x 2.3) is lit by a cool key #8fa3c9 from
  the window. (3) A screen-space split in the grade at the projection of world x 1.35 (about screen x 1265 in 20;
  take it from camfit): left S 1.12 W +0.8, right Spud's S / W, soft edge 110 px. Dust motes (30) only in the warm
  zone. The camera in 20 only pushes (fov 42 -> 40.7 over 9 s), so the split stays on its floor line.
- **The flood (42 -> 43):** in 42, as `gl-worn` passes his brows (frame 8 of the lift), colour returns as a ring
  from his eyes: radius 0 -> 1300 px in 0.9 s (ease out), soft edge 160 px, inside S 1.22 W +0.8, outside S 0.45.
  Cut to 43 at full colour, S easing 1.22 -> 1.16 over 2 s. No flash, no sound effect: the strings reach the tune.
- **Keying:** new top-level `"grade": [[t, { "s": 0.99, "w": 0.4 }, dur?], ...]` (same key form as the HUD), plus
  `"split": { from, to, x, soft, s, w }` and `"ring": { at, dur, xy, s0, s1, w }`. The film's kit has
  `scoreGrade(score)`. The glasses view sets S 0 itself.
- **Engine work:** three uniforms and two masks in `GradeShader` (looks.js), set per frame from t; the grade key
  joins the frame-cache key in stage.js; absent = today's picture exactly (golden unchanged). The grade must also
  run in `--draft` (the animatic is judged on colour).

## 6. The notebooks

Handwriting is drawn by the engine, not a font: a stroke table (A B D E H I J K M O P R S U W Y, 0-9, = . ? '
and a tick), 2-5 polyline strokes a glyph, written with hashed jitter, in `props-score-paper.js`. Text comes from
`spec.lines`.
- **`spudpad`** (05, 06, 22), 0.5k: a top-spiral reporter's pad 0.19 x 0.26 x 0.018, 14 wire loops #8c8c8c, kraft
  cover #b59a6c folded back, cream page #f4ecd8 with 9 faint rules #c9d3dc. Writing: pencil #3b3b3b, capitals,
  stroke 0.004, jitter 2 %, slant 4 degrees. Line 1 "MASH = 88. WHY?" 0.026 tall, underlined twice; from 22 a
  second pad state: three crossed-out lines of scribble and "88 -> 84 ?". L hand holds the pad by its lower edge
  (thin hold, page to the holder), R hand the `pencil` (reused); pad top edge at chest height, below the chin.
  Readable only in an over-the-shoulder close shot (the cards rule): 05 gets a 1.2 s insert of the page.
- **`mashbook`** (26-28, 30), 0.9k: an old school exercise book 0.20 x 0.27 x 0.022 closed, opens flat to 0.40
  wide. Cover dark navy-grey #3d4654, worn to #6e7683 at the corners and spine (hand-placed), a blank paper label
  0.10 x 0.05 #d9cfb8, 5 scratches. Pages #efe6cf, foxed edges #d8c9a4, rules #bcc6cf. Left page: a pencil drawing
  of a potato with one leaf on a bicycle on a grass line with 3 clouds (about 40 strokes, the same stroke writer).
  Right page: "MASH = 41. WHY?" on top (0.022 tall), then a list of 9 lines each with a ticked box: readable
  "SPUD'S JUMPER", "SPUD'S BIKE", "SPUD'S JOKES", then 6 lines of drawn scribble. A child's hand: pencil #55504a,
  stroke 0.005, jitter 6 %, baseline wander 3 %, letter heights +-12 %.
  27 is top-down on the open book (both of Spud's hands on its outer edges, book on the floor boards). 28: both
  hands, book at chest, its top edge at least 0.04 under his mouth.

## 7. The memory still (29-30)

Jonny's default, as a painted plate: two plates from his PC (crops of 29 and 30 as references), shown whole with
`set-plate.js`: relief 0.5 m from `engine/plates/depth.py`, grass and leaves on the sway mask, clouds still. The
cream paper margin and rough painted edge stay in frame (a notebook page). Camera: 29 pushes 4 % and drifts 0.15 m
right over 4 s; 30 drifts 0.12 m left, no push (about 14 px of parallax at the edges). Kid Spud and kid Mash are
painted: no 3D, no kid character data. Overlays: the pencil tag "90" (3) and paper grain 0.10. In and out: a
6-frame cross-dissolve from the open book 27 / 28 (the film's one dissolve: the page becomes the picture). Kid
Spud's whistle is sound only (his painted mouth is pursed).

## 8. Places (15 projected plates + 2 memory plates; details in the plate list)

| place | panels | made as | 3D dressing (reuse unless marked NEW) |
|---|---|---|---|
| ST street, moving day | 01, 05, 36, 37 (+ behind the door in 04, the window in 35) | plate, oblique along the pavement: Mash's house front left, kerb and road right, the hill with its road far right | `boxvan` NEW at the kerb; `streetlamp`; `leaves`; 01 mover + `armchair`, dog card; 37 two `bike` |
| HA Mash's hall | 02, 03, 04 | plate (wood wainscot, stair, sunny window); painted box stacks at the back | `frontdoor` open; `keepbox`; Mash's box = `parcel` 0.50 x 0.36 x 0.40 |
| BK bakery street | 06, 09, 11, 12, 15 | plate + its rain repaint BK-R (12, 15) | counter top y 0.55 (a `tops` piece); `streetlamp` (Spud hides 0.35 off it); `cinnabun` NEW; `rainfall` in two boxes (none under the awning) + 9 drips off the awning scallops; `puddle` x3 |
| RV river path | 07, 08 | plate (beauty) | falling leaves, mist cards |
| RV2 bridge deck | 10 | plate (grey view only) | - |
| SF Spud's hall wall | 13 | plate | `wallmirror` NEW |
| Spud's kitchen | 14 | **3D set `set-kitchen`** with `morning: true` (a close shot: sharp 3D beats a cropped plate) | `kettle` NEW on the hob |
| RM-N Mash's room, party | 16-22, 24 | plate from the doorway (panel 20's view) | `stringlights`, `speaker` NEW on a closed `cardbox`, `partycup` NEW x8 (24), `cardbox` stacks |
| RM-D same room, Sunday | 25-28, 32-35 | plate, same camera, cold, emptier | `cardbox` x6 (two closed = the seats of 32), `keepbox`, `taperoll` NEW |
| RM-D2 the room's door wall | 31 | plate (reverse) | `frontdoor` |
| BA balcony at night | 23 | plate | railing = a `solids` box |
| HR hill road | 38 | plate | two `bike` |
| HT-W hilltop west, golden | 40, 43, 45 | plate (beauty) | `hillbench` NEW, falling leaves |
| HT-W2 same, sunset | 47 | repaint of HT-W, same camera | `scoretrain` NEW |
| HT-E hilltop east (bench from the front) | 39, 41, 42, 44, 46, 48 | plate | `hillbench`, the two bikes (39), Mash's `satchel` NEW (46) |

- **The hilltop's geography** (the sheet draws the valley behind the bench in both directions): the bench stands on
  a ridge 10 m wide and faces WEST (-z): river, town, viaduct, sun (43, 47, exact to the panels). The reverse shots
  look EAST over the bench at a second valley with the town's station (46). The tree (trunk at x -2.6, z +0.8)
  is on screen-left in the west views and therefore on screen-RIGHT in the east views: 39, 41, 42, 44, 48 are mirrored
  against the sheet (open question 3). The sun lights faces from the front in the east views.
- Sheet misses fixed here: 36 Mash in his charcoal hoodie; 37 the van is the white `boxvan`; 47 the middle figure
  is Spud; 15 see 2.

## 9. New props and vehicles

| kind | file | what, with numbers | tris |
|---|---|---|---|
| `boxvan` | props-score-van.js | White box truck, front +z: 5.6 x 2.1 x 2.9 tall; cab 1.7 long, box 3.7 x 2.1 x 2.1, floor y 0.75; wheels r 0.36. Body #f1efe8, shade #c4c6cc, bumper #5b5f66, cab glass #2a3038 (steam; takes the `reflectcard`). Rear roll door key `open` 0..1 (inside #3a352f, 5 boxes). A cab seat point for the driver (L arm waves out of the window, 36). Solid: the bikes lean on it (37). Not `policevan` (navy, lettered). | 9k |
| `bike` (reuse) | - | spec.color #3f6fa8 (Mash) and #b5412f (Spud); `spin` with the travel. 37: both lean 12 degrees on the van. 39: Spud stands beside his, both hands on the grips. | - |
| `stringlights` (reuse) | - | 22 bulbs r 0.035 #ffd27a through 5 points at y 2.25-2.45, `lit` 1, `wobble` 0.15 while they dance. | - |
| `scoretrain` | props-score-train.js | Loco + 4 coaches, each 20 x 2.8 x 3.6, dark green #2d4a3e, cream band, 9 lit windows a side #ffd98a. Runs on the plate's viaduct 250 m away (about 640 px long in 47), its bottom 0.9 m behind the parapet (a cut card). 20 m/s: on at 3:13.5, off at 3:18.5. Key `wave`: Mash's sleeve and glove (0.6 long) out of window 3 of coach 2, +-35 degrees at 2 Hz: about 10 px, read by its motion. | 6k |
| `hillbench` | props-score-items.js | Weathered plank bench, 1.9 long, seat top y 0.30 (the potato `parkbench` height), 0.42 deep (3 planks), back 2 planks to y 0.72. #8a7358, lit #a88e6c, shade #5f4e3d; grain drawn once per plank, 6 nail heads, one split end. Not the iron `parkbench`: 45 is a macro of this wood. | 1.2k |
| `kettle` | same | Steel stovetop kettle r 0.13, 0.20 tall, black handle and knob; a lathe with UVs for the `reflectcard`. | 1.6k |
| `wallmirror` | same | Wooden frame 0.55 x 0.80, glass #9fb1c2; key `cover` 0..1 a newspaper sheet (grey scribble rows, no letters) with 4 tape strips. In 13 `cover` is 0.7 and Spud's R hand presses the last tape strip. | 0.5k |
| `speaker`, `partycup`, `cinnabun`, `taperoll`, `satchel` | props-score-small.js | Speaker 0.30 x 0.18 x 0.14 charcoal, blank button r 0.03 (Mash's R hand, 16). Cup red #c8372f, r 0.04 x 0.11. Bun: 3-turn spiral r 0.07 on white paper, `bite` 0..1. Tape r 0.07 #c9a063. Satchel 0.30 x 0.24 x 0.10 #8a5a35, worn on Mash, strap over his L shoulder. | 2k |
| `flatcap`, `toque` | same | Worn. Extras are `spud`-costume potatoes (`characters/happiness/`): mover 0.92 x 0.80, sweater #7c776b, cap #6d6a5f; driver 0.90 x 0.78, #b98f54, cap #9a7a4a; baker 0.95 x 0.84, #f4f1ea + `waiterapron` (reuse) + toque 0.22 tall. Skin #dba15a. | 1k |
| `reflectcard` | same | section 2. | - |
| dog (01) | plate DG | A painted cut-out, not a rig: body card 0.42 tall, a tail card swinging +-18 degrees at 3 Hz, head bob 1.5 cm. Seen 2.5 s, grey, about 220 px. | - |
| Spud's copy outfit | costumes-everyday.js | Costume type `spudcopy`: Mash's `hoodie()` (#7a716c) on Spud's body + `headphones()` + a teal collar ring #2f8f8a 0.03 above the cowl. Panels 08-12; sleeves end before the wrist. | - |

Riding uphill (38): the 3D road under the bikes is FLAT (y 0) and the plate is painted looking down the slope, so
the projection makes it read as a climb. No `y` on any move (clip-lessons). Bikes travel 3.0 m toward the camera in
4 s (0.75 m/s, slow = uphill), `spin` = distance / 1.257, bodies rock +-4 degrees at the pedal rate.

## 10. Pose risks

| what | panel | rule it touches | staging | fallback after one failed fix round |
|---|---|---|---|---|
| Hug | 46 | gloves ON the body; bodies in each other (`qa/clear.mjs`); short forearms | Mash leans 14 degrees, bodies 0.55 apart (0.03 squash), his gloves on Spud's far shoulder, Spud's on Mash's sides, Spud's leaf laid flat to +x; 2.5 s, only a 2 cm squeeze | show only Mash's near arm and Spud's face |
| Sitting on boxes | 32 | seat height in a still; held prop <= 0.75 | two closed `cardbox`, seat 0.42, centres 0.95 apart; glasses at y 0.62 | - |
| Bench | 39-44 | seat height; ~1 m between friends | seat 0.30; Mash x -0.48, Spud x +0.47 | - |
| Sleeve tug | 19 | hands ON what they hold; no grip for cloth | Chip's R glove posed on Spud's L cuff (no `grab`), Spud's arm follows two 4 cm pulls; Spud's R finger up, below his chin, beside the face | Chip pulls Spud's hand |
| Dancing | 17, 20 | planted feet slide (`qa/motion.mjs`) | `dance.js`, three different steps, x -2.0 / -1.0 / +0.1 | two dance, Mash claps |
| Lying on grass | 44 | a sitting pose is not bent into lying; nobody floats | Chip and Wedge drop to SITTING on the grass (hidden seat 0.06), leaning back on their gloves | they stay standing, bent over |
| Glasses off | 42 | nothing between camera and face | the glasses go UP and out of frame; the worn prop drives, the hand follows | - |
| Armchair carried | 01 | soft things are not held; big things by both handles | both gloves on the arm rolls, chair back to his chest, 0.6 m of walk in 2.5 s | chair on the pavement, he wipes his brow |
| Bikes | 37-39 | `ride` off a carrier keeps height | flat road; the get-off is in the cut 38/39 | - |
| Sitting on the ground | 47 | feet on something | backs only: hidden seats 0.06 at the brink, 1 m apart | - |
| Bun | 07-12 | never one hand at the face | held at chest, he chews, `bite` changes on cuts | - |

---

## Beauty shots (staging numbers for the director)

- **07 / 08 river walk** (0:18-0:28): painter's camera [0, 0.95, 6.0], pitch -2, vfov 34. Mash x 0.9, walks toward
  the lens from z -1.5 to +0.6 at 0.55 m/s; Spud 7.5 m behind (07), then 3.5 m behind in the same step phase (08).
  Camera tracks back 0.4 m (trunks slide about 30 px). Life: 14 falling leaves (#d9772b, #c4472a, #e2a53a,
  0.5 m/s, hashed sway), 3 mist cards (alpha 0.12 / 0.18 / 0.22 at z -14 / -26 / -40, drifting 0.05 m/s), water
  shimmer, tree sway 1.
- **20 party wide** (1:15-1:24): section 5. Room 6.4 x 5.0 x 2.6; Spud at x 2.3, z -1.3.
- **43 valley** (2:54-3:00): painter's camera [0, 1.25, 5.2], pitch -6, fov 38 -> 34 over 6 s. Bench at z -1.2,
  two backs rim-lit #ffd9a0. Life: 9 leaves falling from the tree, grass sway, river shimmer (gold), 5 birds
  crossing the sky right to left from 2:56, one cloud shadow sliding over the far woods.
- **47 train at sunset** (3:13-3:19): camera [0.6, 0.8, 0.4], fov 36 -> 31. Chip x -1.0, Spud 0, Wedge +1.0 at the
  brink; Chip waves with his whole arm. Then 48 holds 2 s after the last line.

## Builder tasks (Sonnet; one owner per file; at most 2 fix rounds; bench + side-by-side vs the panel crop)

| id | owner file(s) | builds | lines | min |
|---|---|---|---|---|
| E1 | engine/page/score.js (+ a 6-line hook and cache key in stage.js, applied by the director) | tags, ticks, -1, glasses mask wide + tall, lens clip (2, 3) | 260 | 90 |
| E2 | engine/page/looks.js | grade keys, split, ring (5); golden unchanged; on in --draft | 90 | 75 |
| E3 | engine/page/hud.js | wide placement, `own` chip, `train` chip + pips (4) | 120 | 60 |
| P1 | engine/page/props-score.js (registry `SCORE_KINDS`, `SCORE_GRIPS`; the director adds the one line in props3d.js) | scoreglasses, scorecase, keepbox | 320 | 90 |
| P2 | engine/page/props-score-paper.js | stroke writer, spudpad, mashbook | 300 | 90 |
| P3 | engine/page/props-score-van.js | boxvan | 280 | 75 |
| P4 | engine/page/props-score-items.js | hillbench, kettle, wallmirror, reflectcard (+ the two Spud bench renders) | 300 | 90 |
| P5 | engine/page/props-score-small.js | speaker, partycup, cinnabun, taperoll, satchel, flatcap, toque | 260 | 75 |
| P6 | engine/page/props-score-train.js | scoretrain | 160 | 45 |
| C1 | engine/page/costumes-everyday.js + characters/happiness/*.json | `spudcopy`; mover, driver, baker, spud-copy JSON | 60 | 45 |
| S0 | engine/page/props-score-plate.js | `splate`: the cplate machinery copied (it is not exported), scenes registered per place | 220 | 60 |
| S1-S15 | engine/page/props-score-plate-`<id>`.js + tools/plate-`<id>`.py in this folder | one per plate: fit the painter's camera, pieces, tops, solids, cut cards, motion; vs-sheet against the plate | 120-200 each | 60-90 each |
| M1 | (no code) assets/plates/score-m29, -m30 | depth + motion masks with engine/plates/depth.py | 0 | 30 |

Order: E1-E3 and P1 first, then by block. The beauty plates (RV, RM-N, HT-W, HT-W2) get the first paint slots, so
there is time to repaint. The director owns the generator and the kit (`kit/score-kit.mjs`: `scoreGrade`,
`check()`, tag and train keys, plate cameras).

## Plate list (Jonny's PC; each: the approved panel crop as reference; 1536x1024)

Common tail: the sheet's Ghibli hand-drawn look, very detailed, all sharp, NO characters, vehicles or text, a low
camera at potato eye height (0.95 m), a clear floor or path filling the bottom third. 2x upscale locally (Lanczos).

| id | panel | must be in it |
|---|---|---|
| ST | 37 (+05) | Autumn street along the pavement: stone house front with a green door and one stone step left, empty kerb and cobbled road right, red and gold trees, far right a grassy hill with a winding road. Morning sun. |
| HA | 03 | Old flat's hallway: wooden wainscot, stair left, tall sunny window, open front door right, braided rug, a few box stacks far back, empty floor in front. |
| BK | 06 | Corner bakery, striped red-cream awning, bread in the window, an open counter to the street, flower tub, cobbled pavement. |
| BK-R | 12 | The same picture in rain: grey sky, wet shining cobbles, lit window. Change only the weather. |
| RV | 07 | River path, low stone wall, calm river, old two-arch stone bridge, town and church tower beyond, autumn trees overhanging from the left, a bench, morning mist. |
| RV2 | 10 | On the stone bridge looking along its deck, parapets both sides, two lamp posts, town beyond. |
| SF | 13 | Small flat's hall wall: blue-grey plaster, dark door left, coat hooks, plant shelf; the wall's middle EMPTY (the mirror is 3D). Cool light. |
| RM-N | 20 | Half-empty room at night from its doorway: timber walls, shelves and box stacks left, worn rug, a dark window with town lights on the right; the left two thirds warm gold from above, the right third cool blue, the light ending in a soft clear edge on the floor. No string lights (3D). |
| RM-D | 25 | Same room, same camera, Sunday morning: cold grey-blue light, nearly empty, radiator, tape scraps, autumn roofs in the window. |
| RM-D2 | 31 | The room's other wall: an open cream door with peeling paint, bare grey wall. |
| BA | 23 | Small stone balcony at night, iron railing, ivy, red maple, a town of lit windows and a church tower below, stars. |
| HR | 38 | Looking down a winding country road that climbs to the viewer, dry-stone wall left, wooden fence right, town and valley below, golden late light. |
| HT-W | 43 | Hilltop at golden hour looking west: grass in front, a lone old tree left with its canopy across the top, a wide valley: river shining gold, autumn woods, a small town with church roofs, a long stone railway viaduct right, the sun 8 degrees up. NO bench (3D). |
| HT-W2 | 47 | The same at sunset: sun touching the hills, pink and violet sky, town lamps on. Change only the light. |
| HT-E | 39 / 46 | The same hilltop looking the other way: grass, the trunk on the RIGHT, a second valley with the town's small station, a dirt path leaving bottom right, low golden sun from the front. NO bench. |
| M29, M30 | 29, 30 | As the panels, WITH the kid characters, warm watercolour on visible paper, rough cream margin. In 30 the glasses a little too big. No tag. |
| DG | 01 | A small white dog with tan patches, side view, standing, on plain white; its tail painted again beside it. |

Tall parts crop the same plates (a 9:16 window of the 2x plate is 1152 x 2048). 18 images.

## Open questions (each with the default I build to)

1. **Tag in outside shots.** Panel 11 draws the tag in a normal shot; the brief says tags only in the glasses view.
   Default: the brief. Each check = the panel's shot without a tag, then a 0.8 s glasses view looking up (2).
2. **Inside the lens in 45.** Default: full colour through the lens, as the panel. My recommendation: grey inside
   the lens only (the film's idea in one picture: the glasses count 90 and still show no colour). One uniform.
3. **Mirrored hilltop reverses.** 39, 41, 42, 44, 48 show the tree on the left; true geography puts it on the right.
   Default: keep 43 / 47 exact and mirror the reverses. Alternative: no trunk in the reverses, canopy only.
4. **The lens count** starts at 29, not 30 (the ride takes him to 29): 29 -> 60 -> 90. Default: 29.
5. **The wave in 47** is about 10 px. Default: keep the panel (Chip waving back carries it). Alternative: a 1.2 s
   insert of Mash at the train window.
6. **DON'T KEEP readable?** The sheets leave the red patch blank; part 3's hook names it. Default: brushed white
   capitals overlaid on the patch in 02 and 26 (the stroke writer of 6).
7. **Mash's old notebook** reads "MASH = 41. WHY?" (outline). "SPUD = 90. WHY?" would mirror Spud's pad more
   exactly and match the memory's tag. Default: the outline's line.
8. **Train chip wording:** default "SUN 19:42" with the pictogram; "SO 19:42" for the German audience is one string.
9. **Dog as a painted cut-out** (not a rig). Default: yes; it is 2.5 s in grey.
10. **Image budget:** 18 plates at about 1 % of the weekly Codex window each. If short, drop RV2 (10 on RV) and
    RM-D2 (31 in HA, regraded cold).
