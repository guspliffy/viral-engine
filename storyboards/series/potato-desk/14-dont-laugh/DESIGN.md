# Potato Desk 14 "Don't. Laugh.": design (Fable 5.2, 26 Nov 2026)

From `sheets/dont-laugh-sheet-1b.png` (12 panels, the target) and `STORY.md` (rhyme lines, ending E4). New pieces only; set, judge,
cast, look and units as `../12-interview-trial/make-interview-trial.mjs`. Axes +x right, +y up, +z toward camera, metres. Yaw 0 faces the
camera. 1080 x 1920, 30 fps. "Body-local" = y 0 at the base of a potato's body; "wear frame" = body-local + 0.14 (legs), the frame of
`spec.wear` (stage.js). Every number marked (measure) is checked by its builder on a bench still and reported if off by more than 0.02.

## 0. Floor plan and the hide rule

| Piece | World position | Note |
|---|---|---|
| Bench, judge, chair, block, gavel, plate | as 12 (bench x -1.25..-0.13, judge at (-0.69, -0.66), body base y 1.14) | unchanged |
| Board | `exhibitboard` (section 3) centre (0.85, 2.01, -1.255) | x 0.20..1.50, y 1.59..2.43 |
| Jury box | `jurybox` (section 2) centre (1.30, 0, -0.85) | x 0.225..2.375, z -1.26..-0.44, rail top 0.63 |
| Witness chair | `chair` at (2.30, 0, 0.45), rot -25; `floorcushion` on its seat (section 4) | Mash screen-right of the jury, in front (06) |
| Door | `courtdoorway` (4) at (3.25, 0, -1.30) + `frontdoor` leaf, hinge x 2.80 | back wall, right (05) |
| Floor, dado | `courtfloor` x 1.0, w 8.32; `dadopanels` xs without 3.0 and 3.75 | floor under chair and door |
| Wall shadow | `judgeshadow` (1e) bottom centre (-0.36, 1.27, -1.296) | clear of the board (starts x 0.20) |

Seated judge, world y: mouth 1.56, eyes 1.74, brow top 1.86 (measure), bare crown 2.16, toupee lowest edge 2.00, toupee top 2.29.

**Hide rule (every shot before the reveal, 11):** if any x of the judge's head (-1.12..-0.26) is in frame, the frame's top edge at
z -0.66 is at world y <= 1.93 (0.07 above the brows, 0.07 under the toupee). No camera roll, no upward drift; pushes aim below y 1.7.
The judge leans or pitches forward <= 4 deg and squashes between -0.05 and +0.03 (a 12 deg nod drops the toupee rim 0.09, into frame).
Shots aimed above y 1.93 (08, 09) keep the whole head outside the frame in x. In the wide 01 the board shows only its lowest 0.34 m.

## 1. THE HASH-BROWN TOUPEE (panels 04, 08, 10, 11)

**Decision: a worn prop, not a costume option.** Kind `hashtoupee`, `wear: "vik"`, in a new file (no edit to `costumes-judge.js`, no golden
change, and it gets tweenable keys). The judge is a new variant file `characters/potatobrawl/viking-judge-toupee.json` = `viking-judge.json`
with `costume.judge.wig: false` and `sprout.placement: "none"` (sheet 11 has no leaf; a leaf on the patty would read as garnish, a second idea).

**Why 1b reads as hair, and the fix:** 1b is a shaggy dome of fine strands with a fringe over the brow and no thickness. Ours is a stiff
SLAB: a smooth outline, a visible 0.055-0.07 side wall, shreds only as short marks inside the outline, a pale bite. It sits tipped 30 deg
toward the camera so the top face shows from the reveal camera, and its lowest edge stays 0.14 above the brows (never a fringe).

### 1a. `hashtoupee` geometry (own frame: patty flat in x-z, +y up, +z front, ORIGIN = centre of the underside)

| Part | Numbers |
|---|---|
| Size vs head | 0.58 (x) x 0.40 (z) x 0.07: 0.67 of the head's 0.86 width, 0.76 of its width at the brows (the wig's dome was 0.55 x 0.43 x 0.19) |
| Outline | superellipse abs(x/0.29)^3 + abs(z/0.20)^3 = 1, radial wobble +-0.008 (5 and 9 lobes, fixed phases). No spikes in the outline |
| Slab | 0.07 thick at the centre, 0.055 at the rim (top face domed), top edge rounded r 0.012, rim sags 0.015 (parabolic) |
| Top face | one canvas 1024 x 706, drawn once: base `#efb53e`; 90 shred strokes 0.03-0.07 long x 0.006-0.009 wide, round caps, angle by index hash: 40 `#f8d470`, 32 `#c9862b`, 18 `#9a5a1c`; 14 browned spots r 0.006-0.012 `#7d4716` at 60 %; the outer 0.03 darkened toward `#b8731f` |
| Relief | 36 raised shreds, boxes 0.009 x 0.007 x 0.035-0.07 lying on the top (+0.004), own yaw each, the same three hexes |
| Side wall, crust | wall `#9a5a1c` with 20 flecks `#c9862b`; a 0.008 line `#7d4716` round the top edge; underside `#c9862b` |
| Crisp tips | 8 tapered boxes 0.014 x h x 0.008 on the top edge, leaning out 15-45 deg, at azimuth (0 = +z, 90 = +x) 15, 95, 130, 165, 200, 235, 270, 295, h 0.020, 0.035, 0.025, 0.040, 0.020, 0.030, 0.035, 0.025, `#9a5a1c` |
| Bite | front, screen-left: a circle r 0.095 centred (-0.15, +0.20) cut through the full thickness (notch 0.18 wide, 0.08 deep), its edge 4 tooth scallops r 0.03. Cut wall `#f7e8b8` with 5 shred-end dots r 0.006 `#e8cf8e`, a 0.006 crust line `#7d4716` on its top edge |
| Steam | `steamWisps` (engine/page/steam.js, reused) twice: group scale 1.5 at (-0.03, 0.075, -0.06), scale 1.1 at (0.16, 0.07, -0.02). Key `steam` 0..1 (propState tweens it) |
| Hero shred | a crinkle strip 0.30 long, 0.030 wide tapering to 0.018, 0.009 thick, 5 bends +-0.010; `#b8731f`, edges `#7d4716` 0.004, a centre line `#f8d470` 0.004, last 0.04 `#7d4716`. Hinged at (0.27, 0.05, 0.11). Key `shred` (propState tweens it): 0 = lying on the top face toward (-0.02, 0.058, -0.08), inside the outline; 1 = swung out over the rim and hanging world-vertical with 8 deg outward lean (computed from the prop's own tip and tilt); two slerps (lying -> straight out along (0.9, 0.2, 0.4) -> hanging), overshoot to 1.15 allowed; >= 1.5 = hidden (it fell, 1d) |
| Squash | `wearSquash` as `flatcap` (props-spree.js). Solid. Ink outline on (the dark rim separates it from the skin `#e2a95c`) |

**Placement (clip):** `wear: "vik"`, x 0, y 1.113, z 0.139, `tip: 30`, front yawed 8 deg to screen-right, `tilt: 4`. That is the point where a
plane tipped 30 deg touches the head (body-local y 0.980, z 0.143), sunk 0.008. Results, body-local: lowest edge 0.86 (brow top 0.72),
front top edge 0.91, rear top 1.11, tips to 1.15. The rear lifts 0.06 off the crown: it is a stiff slab, do not fill the gap.

**Read at 360 px wide (reveal, 733 px/m at 1080):** patty 142 px wide, slab edge 17 px, bite 44 px, steam 70-100 px tall. Builder A's bench
sheet shows it at this size from the front with the lens 10 deg below the patty; if the top face is under 30 px tall there, raise tip to 35.

### 1b. Tease 1, the shred (panel 04)

On "Let's get this done" tween `shred` 0 -> 1 in 0.27 s, ease `back`. The strip flops out and hangs at his left temple (body-local x 0.27-0.31,
z 0.26, from y 0.96 down to 0.66, 0.05 off the skin, 0.03 outside the eye). With the frame top at 1.89-1.93 its lowest 0.09-0.13 m is in
frame: 57-82 px long, 19 px wide at 1080 in a 630 px/m medium. Dark fry colour because it hangs in front of golden skin. Nobody reacts.
It stays hanging in every later judge shot until 1d. Departure from 1b's drawing (shred standing up above a cut head): the frame edge is the cut.

### 1c. Reveal (panel 11)

Judge stands on his chair seat (base 1.14 -> 1.28 in 0.4 s, squash -0.06 then settle); toupee top 2.43. First frame of the shot: `steam` 1.
Frame top >= world y 2.95. Lens no more than 12 deg below the patty (lens y about 1.0 at 4 m) so 18 deg of the top face shows.
Hold >= 2.0 s before "I... held it." Sounds that exist for it: `sizzle`, `steam` (Jonny judges).

### 1d. Tease 3, crumbs (panel 10): `hashcrumbs`, a world prop (crumbs must not ride the head)

| | |
|---|---|
| Pieces (18) | 1 hero shred (the same mesh as 1a, starting in its hanging pose); 6 flakes, irregular hexagons 0.05 x 0.04 x 0.009 (3 `#efb53e`, 3 `#c9862b`); 11 bits 0.02-0.03 (3 `#f8d470`, 5 `#c9862b`, 3 `#9a5a1c`) |
| Origin | the hero shred's hinge in the world (the clip places it; seated, yaw 0: about (-0.42, 2.10, -0.40)); +z of the prop toward the papers; `staged: "falls from his head"` |
| Clock | key `fall` in seconds, tweened 0 -> 1.6 linear in 1.6 s. Burst A at 0.00 (shred, 2 flakes, 5 bits), burst B at 0.27 (4 flakes, 6 bits), each piece + index hash x 0.06 |
| Flight | start speed vx (hash - 0.5) x 0.5, vy +0.1..0.4, vz +0.9..1.4 m/s; gravity 9.81 with drag: terminal speed shred 2.0, flakes 1.5, bits 2.6 m/s; horizontal speed decays with tau 0.35 s. Closed form or fixed 1/120 s steps, a pure function of `fall`. Spin 2-5 rev/s; flakes rock +-25 deg |
| Landing | on y = -`spec.drop` (default 0.88: the paper top 1.216 under the origin 2.10). Fall times over 0.88 m: bits 0.57 s, shred 0.64 s, flakes 0.74 s. Bits bounce once (0.25 of the speed, <= 0.012 high); all lie flat within 0.08 s and stay to the end of the film, 0.26-0.40 in front of the origin and within +-0.07 in x |
| With it | at burst A set the toupee's `shred` to 2 with dur 0 (hidden; values 1.15-1.5 hold the hanging pose). Two scratch strokes: judge arm pose `hat`, hand +-0.04 in x at 5 Hz for 0.5 s. Sounds that exist: `ai/crunch/crunch-01..04` |
| Papers | reuse `paperstack` (props-office11.js), `amount: 0.4` (0.036 high), at (-0.44, 1.18, -0.06): x -0.55..-0.33, z -0.21..+0.09, under the landing zone (move both together if the judge's yaw moves the hinge). Shot lens y >= 1.45 so the paper top is seen |

At 350 px/m (the 10 two-shot) the shred is 105 x 10 px at 1080 (35 px at 360): it carries the beat; flakes are 17 px, bits 9 px.

### 1e. Tease 2, the wall shadow (panel 08): `judgeshadow`, painted (not a light)

A real cast shadow would need a low key light that moves every other shadow in the set, and it would sit behind his own body. Painted, as
`copshadow` / `krampusshadow`. It is the shadow a low lamp at (-2.6, 0.4, 3.0) would throw: 1.175 x his size, 0.33 right, its head part at
y 2.12-2.66, above every hide-rule frame. On from frame 0 (seed `on: 1` with a dur-0 `prop` action: propState's `on` starts at 0): its
shoulder shows right of him in the wides, so shot 08 only looks higher.

| | |
|---|---|
| Card | 1.30 x 1.50, faces +z, origin bottom centre, canvas 832 x 960, drawn once, blurred 0.018 m. Fill `#2f2630`, opacity 0.40 x `on`, normal blend, depthWrite off, no outline, `userData.steam` |
| Body | ellipse centre (0, 0.62), radii 0.505 x 0.60; alpha fades to 0 from v 0.25 down to 0 |
| Toupee | lozenge 0.68 x 0.14, centre (0.04, 1.25), rotated -6 deg; 9 spikes on its top edge at u -0.26, -0.19, -0.12, -0.05, 0.03, 0.10, 0.17, 0.24, 0.30, heights 0.02, 0.05, 0.03, 0.07, 0.025, 0.04, 0.06, 0.02, 0.045, widths 0.03-0.05; 4 bumps 0.015 on the underside. No bite, no steam (the bite is the reveal's) |
| Shred | key `shred` (0 or 1): a strip 0.35 x 0.035, 3 zigzags, hanging from (0.36, 1.22). The clip sets 1 after tease 1 and 0 after tease 3 |
| Reveal | when the judge stands, tween its y +0.16 over the same frames |

Shot 08: camera right of x 2.6, low (y about 1.0), aimed at (-0.3, 2.2, -1.3); from there his real head covers the wall only left of x -0.90,
so the whole shadow is clear with the frame's left edge at wall x -0.88. Mash foreground right, the board at the right edge, jurors low.

## 2. THE JURY BOX (panels 01, 06, 12)

### 2a. `jurybox` (new). Origin: the floor under its centre, front +z

| Part | Numbers | Colour (the judgebench's) |
|---|---|---|
| Walls | outer 2.15 (x) x 0.82 (z), 0.58 high, 0.06 thick: front, two sides, a 0.04 back | `#58463b` |
| Cap rail | on the front and sides, 0.12 wide x 0.05 high, bevel 0.008, **top y 0.63** | `#745b49` |
| Panels | front: 4 of 0.44 x 0.38 x 0.012 at x -0.78, -0.26, +0.26, +0.78, centre y 0.30; each side: 1 of 0.56 x 0.38; bevels 0.012 x 0.003 | `#624e41`, bevels `#46382f` |
| Skirt | 0.06 x 0.02 round the foot of the front and sides | `#46382f` |
| Steps inside | z -0.35..+0.35: A x -0.975..-0.275 top 0.26; C x -0.275..+0.335 top 0.38; R x +0.335..+1.015 top 0.16 (`spec.steps` overrides) | `#4c4037` |

Solid; returns grip 0.63 (the rail top, for `grips.rest` and `tap`). 2.15 wide because three bodies (0.70 + 0.57 + 0.62) may not overlap.

### 2b. Jurors (standing on the steps, legs hidden; a `sit` would push legs through the front wall)

| Screen | Character | Why | Feet (x, y, z) | Mouth / eyes / top (world y) |
|---|---|---|---|---|
| left | `potatobrawl/agent` | bald, charcoal vest, white shirt, glasses: grey, no hero colour | (0.675, 0.26, -0.87) | 0.74 / 0.89 / 1.22 |
| middle | `potatobrawl/chip` | the friend, the only yellow | (1.34, 0.38, -0.87) | 0.74 / 0.84 / 1.05 |
| right | `potatobrawl/rosti` | tall, narrow, plain cream shirt | (1.965, 0.16, -0.87) | 0.73 / 0.91 / 1.32 |

Every mouth is >= 0.10 above the rail; all tops stay 0.27 under the board. Not picked: `spud-old` (grey cardigan, but reads as the
defendant's double), `mash-crew` (the witness's twin), `tot` (green vest, a sixth colour). Files untouched: no grey recolour (the sheet's
grey hoodies would need new costume files).

### 2c. Holding it in (01, 06, each escalation) and the breakdown (12), engine vocabulary only

| Beat | agent | chip | rosti |
|---|---|---|---|
| 01 | `deadpan`, `face` press 1 | `kind`, press 1, eyes on Spud | `deadpan` |
| Esc 1 fart | `shocked` + press 1 (wide eyes, sealed mouth) | both hands over his mouth (arm points to the mouth, grip `flat`), `shocked` + press 1 | looks at the ceiling, press 1 |
| Esc 2 helium | squash +-0.02 at 6 Hz for 0.6 s | turns 40 deg away, hands still on the mouth | press 1, lid 0.5 |
| Esc 3 photo | `face` tear 0.5, corner +0.4 then 0 | `crouch` until only his eyes clear the rail | `skin` `#e8604a` to 0.25 |
| Esc 4 snot | all three: squash +-0.03 at 7 Hz, tear 0.6, press 1; chip lid 1 | | |
| 12 laugh | `delighted` (teeth show), lid 0.85, tear 1; `tap` R on the rail, count 4, every 0.2; `tilt` +10 toward chip | `delighted`, lid 0.9, tear 1; both arms `up`; `lean` -30; 2 `tear` props (props-guard.js, `stream`) | `delighted`, lid 0.85, tear 1; both hands on his belly `{ o: [0.12, 0.30, 0.30] }`; `tilt` -12, `pitch` -10 |

Laugh motor for 12: squash +0.06 / -0.05, period 0.20 s (3 frames down, 3 up), phases 0 / 2 / 4 frames, `talk` on each for the mouth, from
0.4 s after "I... held it." to the cut. Chip goes first, 0.15 s early (squash +0.08 in 3 frames). On "EACH" all three: `shocked`, squash 0 in
2 frames. Not available: Chip on his back with his feet up (12 as drawn); the lean is the stand-in.

## 3. EXHIBIT A, THE SCHOOL PHOTO (panel 09)

**Decision: an engine still of `spud-kid` with two worn props, shown by a split-flap bay on a new blank board.** A still is on-model (his
sweater, his face, the film's own look); a canvas drawing would be a second art style.

### 3a. `bowlcut` and `bracesgrin` (new, worn on `spud-kid`: body 0.55 x 0.50 x 0.44, wear-frame crown 0.69, eyes 0.47, brow top 0.525, mouth 0.37, all (measure))

| Kind | Numbers |
|---|---|
| `bowlcut` | a shell on the body's ellipsoid (centre y 0.415, radii 0.25 / 0.275 / 0.22), 0.028 off the skin at the crown, 0.022 at the edge, edge rolled r 0.014. Lower edge: y 0.537 across the front (within 55 deg of +z), down to 0.47 by 85 deg, 0.47 round the back. Front edge: 7 scallops 0.008 deep. `#7b4a27`; one canvas 1024 x 1024: 22 strand strokes `#5c3518`, 0.06-0.16 long x 0.005, from the crown; a gloss arc `#a26a3a` 0.02 wide at y 0.62 from -40 to +25 deg. Crown hole r 0.022 for his leaf |
| `bracesgrin` | a decal 0.19 x 0.075 centred on the mouth, 0.004 off the skin, bent to radius 0.245: a lozenge, top edge near straight with corners 0.012 up (screen-left corner 0.006 higher: awkward), bottom r 0.03. Ink `#2a1a14` 0.006, teeth `#fbf7ee`, 5 gaps `#d8d0c0` 0.0025 (6 teeth), wire `#7f8b95` 0.005 across the middle, 6 brackets 0.017 x 0.015 `#b9c2ca` outlined `#4a5560` 0.002, white glints 0.004 on brackets 2 and 5. His own mouth under it: `face` press 1 |

### 3b. The still: `storyboards/series/potato-desk/bench/make-school-photo.mjs` -> `assets/props/desk14/school-photo.png`

`spud-kid` at (0, 0), yaw 0, both props, expr `eager`, `face` brow 0.5, `tilt` 5, eyes to the lens, arms at rest. Set `plain`, colour `#79aee0`,
floor none; look, castLook, cel, ink and hatch exactly as the film's generator. Camera (0, 0.485, 3.2) -> (0, 0.485, 0), fov 20 (1702 px/m).
One full-quality still (not `--draft`); crop the centre 1040 x 1300 px (0.611 x 0.764 m, body 82 % of the width), scale to 864 x 1080.

### 3c. `exhibitboard` (new; the sentenceboard's case, blank, with a photo bay)

| Part | Numbers |
|---|---|
| Case | 1.30 x 0.84 x 0.09 `#24323f`, face `#202c38`, four 0.023 brass bars `#b08a3c`, four screw discs; origin the board's centre, faces +z. No lettering |
| Bay | 0.60 x 0.75, centred. Split-flap exactly as `sentenceboard`'s number bay: a 0.60 x 0.375 leaf hinged on the bay's middle line; key `flip` 0 -> 1 in 0.20 s (keep `flip` out of the spec, tween it from the start) |
| State 0 | blank `#202c38`, hinge line 0.004 `#18222c`, two brass pins r 0.006 at its ends |
| State 1 | canvas 960 x 1200: bay `#202c38`; a print 0.54 x 0.675 rotated -2.5 deg (as 09), paper `#f7f4ea`, border 0.018 (0.027 at the bottom), picture 0.504 x 0.630 = `spec.src` (default the PNG above), a 0.006 offset shadow `#141c24` at 50 %. Lit face (emissive 0.12) as the sentenceboard's glyph |

Shot 09: the print >= 480 px wide at 1080 during the hold (889 px/m: the grin 139 px, a bracket 12 px; at 360 px: 46 and 4); the board's side
bars may leave the frame; camera x >= 0.85 so the judge stays out. Flip on "Exhibit A", sound `kenney/switch` as 12.

## 4. Everything else the sheet needs

| Need (panel) | Reuse or new | Numbers |
|---|---|---|
| Party balloons (05-08, 10) | REUSE `balloon` (props-hellb.js) x 3, `color` `#e0475b` / `#ffd23f` / `#3d8fb0`, scale 1.0 / 0.85 / 0.72, each `wear: "mash"` at his left fist (0.34, 0.24, 0.16), the arm posed to that point, grip `fist` | fan: red tilt +6 tip -8; yellow tilt +30 tip -4; blue tilt +8 tip +32. Tune at the layout gate: no balloon over his eyes |
| Helium suck (07) | REUSE the blue one: tween tilt -38, tip +21 in 0.3 s (it swings to his mouth: centre (0.02, 0.655, 0.36), top 0.03 under his lower lids), `pitch` 6; right arm `up` for the oath; then scale 0.72 -> 0.62 in 0.5 s with x -0.044, y +0.058, z +0.028 (stays at the lips); Mash squash +0.05, press 1; then back out, scale stays 0.62 | sounds that exist: `deflate`, `hiss`. Departure: his fist is below the balloon, not at its neck |
| Fart cushion (06) | REUSE `floorcushion` (props-cookie.js) `r: 0.20, h: 0.10, color: "#8a2b2b"` at (2.30, 0.42, 0.45); `sit` height 0.465 | `squash` 0 -> 0.55 in 0.10 s on the contact frame (0.10 -> 0.045 high, 0.025 over the seat edge), stays. Sounds that exist: `oga/fart/fart-*.ogg`, `ai/cushion-poof` |
| Snot bubble (10) | NEW `snotbubble`, `wear: "mash"` at (-0.05, 0.75, 0.246 + 0.8 r) | sphere r = 0.055 x puff^0.6, `#dff3ea` at 0.42, rim shell `#9fc7b5` at 0.55, white glint 0.3 r upper left, no outline, `userData.steam`. Key `puff` 0 -> 1 in 0.5 s on "NEVER", then 1 -> 0.55 -> 1 (period 0.5 s), radius +-4 % at 3 Hz. Key `pop` 0 -> 1 in 0.07 s on Wedge's slap frame: sphere gone, 6 drops r 0.008 fly 0.07 and shrink to 0 |
| Door (05) | NEW `courtdoorway` (as `doorway` in props-notyet.js, court colours) + REUSE `frontdoor` `w: 0.90, h: 1.75, color: "#5c4033", hinge: "left", swing: "out", angle: 100` | opening 0.90 x 1.75; recess plane 0.032 in front of the wall (over the rail and baseboard), gradient `#2b2420` -> `#3a302a`, no outline; jambs 0.08 x 1.83 x 0.07, head 1.06 x 0.08 x 0.07 `#58463b`; threshold 0.015 `#46382f`. No hole in the wall: the shot cuts in with the leaf at `open` 0.35 -> 1 in 0.3 s and Mash one step inside (z -1.0) |
| Desk microphone (04, 08, 10, 11) | NEW `deskmic` at (-0.42, 1.18, 0.20) | base 0.09 across x 0.015 `#3a3d42`; stem 0.012 across, 0.15 long, leaning 18 deg toward -z `#6f757c`; head 0.036 x 0.055 `#2b2d33` with a 0.02 band `#8a9096`. 0.20 high |
| Tears (09, 11, 12) | REUSE `face` tear (0.5 wet, 1 bead) + `tear` props (props-guard.js) | Spud 09: tear 0.6; 11: tear 1 + 2 `tear` props |
| Red face, puffed cheeks (06, 09, 11) | REUSE `skin` `#e8604a` to 0.25 (09), 0.5 (11), back to 0 within 4 s (cast colours stay); `blotch` (props-okilied.js) x 2, `#e2483a`, size 0.16; squash +0.07 + `face` press 1, tremble squash +-0.02 at 7 Hz | no cheek-puff control exists in face.js; squash + press is the stand-in (an engine wish, not this clip) |
| Wedge's tie | REUSE `necktie` `wear: "wedge"`, `color: "#23262d"`, `stripe: "#2f333c"`, len 0.22 | |
| Hand over Mash's mouth (10) | REUSE an arm point to Mash's mouth, grip `flat` | Wedge stands at Mash's left |

## 5. Builders (one owner per file)

| Builder | Owns | Bench sheet shows |
|---|---|---|
| A, head | `engine/page/props-desk14-head.js` (`hashtoupee`, `hashcrumbs`, `judgeshadow`); `characters/potatobrawl/viking-judge-toupee.json`; `bench/make-desk14-head-bench.mjs` | toupee on the judge: front at 360 px with the lens 10 deg low, side, top; `shred` 0 / 1; a judge medium cut at y 1.93 with the shred hanging; crumbs at `fall` 0.2 / 0.5 / 1.6; the shadow card |
| B, set | `engine/page/props-desk14-set.js` (`jurybox`, `exhibitboard`, `courtdoorway`, `deskmic`, `snotbubble`); `bench/make-desk14-set-bench.mjs` | the box with the three jurors from the front at lens y 0.7 and 1.4; `flip` 0 / 0.5 / 1 (test `src`: any repo picture); door open 0 / 1; bubble puff 0.5 / 1, pop 0.5 |
| C, photo | `engine/page/props-desk14-photo.js` (`bowlcut`, `bracesgrin`); `bench/make-school-photo.mjs`; `assets/props/desk14/school-photo.png` | the photo at 864 x 1080 and at 143 px wide |
| Director | `props3d.js` registry lines for the three files; `docs/ASSETS.md` line for the PNG; the clip generator, PANELS.md, cameras, voices; golden, selftest, vocab | |

## 6. Departures from the sheet (asked here, before the build) and open questions, each with the default

1. 08 as drawn has no judge in front of his own shadow: not possible in 3D. Default: judge and bench out of frame, camera from the right (1e).
2. 01 as drawn shows the whole board above a head cut at the brows: not possible. Default: the hide rule wins, the board shows its lowest 0.34 m.
3. Jurors keep their own clothes (vest and glasses, cream shirt), not grey hoodies. Default: yes (zero new character files).
4. The shadow is on from frame 0 (its shoulder shows in the wides). Default: yes; if review A finds it distracting, on only in 08.
5. The hero shred falls with the crumbs at tease 3, so the reveal is a clean slab + bite + steam. Default: yes.
6. The judge's leaf is removed for this episode. Default: yes.
7. 12: Chip leans back 30 deg instead of lying with his feet up; 07: Mash's fist is under the balloon. Default: accept.
8. Risk, not design: `assets/sfx` has no laugh; the jury's laugh needs voiced lines (Jonny's ear).
