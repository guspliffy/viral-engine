# Kid vs Dad 03 "Square eyes": design of the three new pieces

Creative director, 25 Nov 2026. Target: `OPTIONS.md` "SQUARE EYES" + "Hook v2" (all four hooks get rendered). Stand-ins:
Tato `spud-kid`, Dad `wedge`, reporter `reporter`, neighbour `mash`; room = set `gravroom`. Clips run look `anime-pro`,
castLook `sheet`, `rig.eyes` 2. Nothing below is rendered yet: every number is computed from the files and gets proven on
the bench (section 4). Deterministic: no `Math.random`, no clock, every frame a pure function of state and story time.

## 0. Decision and files

**Square eyes = a face layer on the `frost.js` pattern, not a `face.js` option and not a costume.** Why: the rig's lids are
sphere shells and its fitting maths assume an ellipse, so a square inside `face.js` means rewriting lids for every character
(golden + regress risk on the whole cast). A costume would have to be repeated in three costume files. A layer works on any
potato character, is built only for actors that key it, and leaves every other clip byte-identical.

| Builder | Owns | Does not touch |
|---|---|---|
| A eyes | NEW `engine/page/squareeyes.js`; `engine/page/timeline.js` (4 new FACE_KEYS); `engine/page/potato.js` (the 3 places frost has: which actors, build, apply after the costume); `docs/STORYBOARD.md` face line + vocab sheet; `bench/bench-eyes.mjs` | `face.js`, costume files, character files |
| B TV | `engine/page/props-gravroom.js` (gtv only); `bench/bench-tv.mjs` | `set-gravroom.js`, `looks.js`, `firelight.js` |

## 1. Square eyes

### Keys (the `face` action, all 0..1, default 0, blended like `lidL`)

| Key | Meaning |
|---|---|
| `square` | 0 = the rig's eyes, 1 = fully square |
| `sqCorner` | ONE corner only: the character's LEFT eye (screen right), upper outer corner, 0 round .. 1 square |
| `sqTall` | 0 = 1:1, 1 = 1:2 tall. This is the brief's `aspect` (aspect = 1 + sqTall); a face key must rest at 0 |
| `sqPhone` | the phone dressing on tall eyes: dark bezel, notch, home bar, glowing screen |

`corner` alone is taken (mouth corners), hence `sqCorner`. **On/off rule:** on any frame where one of the four is above 0.001
the layer draws BOTH eyes and hides the rig's two eyes; otherwise the rig's eyes show untouched. Switch only on a cut or
under shut lids. A shot with a visible morph or flicker holds `square: 0.02` from its first frame (looks round, layer on).

### Shape (read every size and colour from the BUILT face, never the character file: castLook `sheet` changes them)

r = the eye's radius (0.08 x face size). a0 = 0.9 r, b0 = 0.9 r x oval (sheet cast: 1.28 r). q = `square`, T = `sqTall`.
- Half-width a = mix(a0, mix(0.82 b0, 0.50 b0, T), q). Half-height b = mix(b0, mix(0.82 b0, b0, T), q).
- Outline = a rounded rectangle whose corners are elliptical arcs: radii (mix(a, R, q), mix(b, R, q)), R = 0.14 b0. So q 0
  is the rig's exact ellipse, q 0.5 a soft TV-tube box, q 1 a true square with 17 % corners. Never taller than the rig's
  own eye, so the brows and their clearance rule keep working by construction.
- Each straight edge bulges out 0.03 of its length at its middle, x q x (1 - T): a tube TV's glass, and not a ruler line.
- Hand-drawn: the two eyes are not copies. Right eye R x 0.9, left eye R x 1.1; the top line is thickest at 45 % / 55 % across.
- `sqCorner` c: on the left eye the upper outer corner's radii become mix(current, R, c). At q 0.02 the corner then stands
  0.26 r out sideways and 0.37 r up from the oval; the rig's lash flick on that corner fades with (1 - c).
- Sizes at q 1: Mash 0.121 m square, Tato 0.111 m, gap between the two eyes 0.017 m. Dad's phone eyes 0.110 x 0.221 m.

### Parts (z = metres out of the eye's root plane; the root copies the rig eye's place and turn every frame)

| Part | Build | Look |
|---|---|---|
| White | flat plate, front at 0.16 r, rim rounded back over 0.05 r, side walls back to -0.30 r (no gap on the curved face) | the face's eye white + emissive of its own colour at 0.15 (clean whites in a dim blue room) |
| Frame | ink tube on the outline, centred on the white's front edge | the face's ink. Tube radius, top edge: the rig's lash line (0.086 r x lash at the thickest, 40 % at the top corners). Sides and bottom mix(0.012 r, 0.040 r, q). Lash flick x (1 - q) |
| Iris | flat plate 0.006 r above the white; half-width iw = mix(1, 0.92, q) x iris x r, never above a - 0.16 r; half-height mix(1.12 iw, iw, q) x (1 + 0.5 T q); corners morph like the white, end radius 0.25 iw | the face's iris colour; the same top-to-bottom gradient as `eye.irisShade` when the face has it |
| Pupil | 0.012 r above; half-width 0.52 iw x the expression's pupil, the iris's proportions | `#0b0a0e` |
| Catch light | 0.018 r above, upper right of the iris as on the rig | q 0: the rig's dot. q 1: a 4:3 rounded rectangle 0.36 r x 0.27 r, `#EAF4FF`, unlit: a small TV reflected in the eye. T 1: 0.20 r x 0.34 r |
| Lids | two skin plates 0.03 r above the white, the outline x 1.02, showing only above the upper lid line / below the lower | the skin material the rig's lids use (follows skin tints) |
| Lid line | ink tube along the upper lid's edge, drawn from closure 0.12 | the lash thickness. While it is down the frame's top edge thins to the side thickness |

All plates: no outline hull, no hatching, no shadow casting. Built with the character (as frost is), so the look upgrades them.

### Lids, blink, gaze (all read from the rig after it has set the face, so the acting carries over)

- Upper lid edge height at the middle: `b x sin(90 - 92.9 x kU)` degrees, kU = the rig eye's upper closure. Lower lid:
  `-b x sin(90 - 87.1 x w)`, w = smoothstep((kL - 0.5) / 0.37), kL = its lower closure. These are the rig's own lid heights,
  so blinks, squints, deadpan lids, lid controls and gaze-following land where they do on round eyes. Shut = both at -0.05 b.
- Lid edge across the eye: `height x mix(sqrt(1 - (x/a)^2), 1, min(1, q / 0.5))`: the rig's arch at q 0, from q 0.5 a dead
  straight shutter. A square eye blinks like a roller blind coming down inside its frame: that is the joke, keep it flat.
- Iris, pupil and catch light take the rig's fitted look offset, then stay 0.05 r inside the white on every side. They take
  the rig's pupil size and iris shrink, and hide when the rig hides its iris (shut).
- Wide eyes: the rig's own widening; at q 1 both axes take the mean of its two factors, so the square stays square.
- Not supported on square eyes: tears. `face.shown` keeps the rig's number.

### Phone eyes (Dad's ending): `square 1, sqTall 1, sqPhone 1` (P = sqPhone)

- Frame becomes the phone's body: even radius mix(profile, 0.07 r, P), colour mix(ink, `#23242C`, P) (the phone prop's case).
- Screen: white tinted to `#E3EEFB`, emissive `#8FD0FF` at 0.45 P. One soft additive glow card per eye, 3 a x 2.4 b,
  `#8FD0FF`, opacity 0.20 P x how open the eye is, tagged like the phone prop's halo.
- Notch pill 0.30 r x 0.07 r `#23242C`, 0.12 r under the top edge. Home bar 0.34 r x 0.035 r `#6A7080`, 0.10 r above the
  bottom edge. Both grow from nothing with P. The iris travels at most 0.15 r up or down so it never crosses them.
- Staging note: frame the reveal with his real phone at chest height in the same shot (three matching rectangles).

### The H3 flicker (30 fps frames from the cut; frame width 0.40 to 0.50 m so the corner is 30 px or more)

`square` 0.02 from frame 0. `sqCorner`: 0 -> 1 over frames 8-10, held to 15, 1 -> 0 over 15-17; again 24-26 up, held to 36,
down by 38. `lidL` +0.2 for 4 frames from 16 and from 37 (his eye twitches after each snap). No blink in the shot. Never
on for under 5 frames: a 1 or 2 frame snap reads as a render glitch, and the draft's one-frame pops line will list it.

Reads on a phone when the eye is 40 px wide or more: frame width up to 3 m for Mash. Keep a square-eyed face within 40
degrees of the camera when the eyes are the point (two flat squares on a round body stop reading from the side).

## 2. The TV picture (gtv)

Spec `picture: "cartoon"` (default `"alps"` = today's picture and LIVE bar, unchanged). No LIVE bar in the cartoon.

**The show** (ours, no letters, no known character): flat shapes, outline `#1B1530` 8 px on the 1280 x 720 canvas. Four
scenes of 2.4 s, hard cuts, looped (9.6 s), clock = story time - spec `t0` (0). 12 drawings a second (redrawn only when
floor(clock x 12) changes). Spec `scene` 0..3 pins one scene (its action still moves); default -1 = by the clock.

| # | Scene | Light colour | Picture and motion |
|---|---|---|---|
| 0 | Chase | `#FFC531` | sky `#FFE45C` to `#FFA51F`; sun `#FFF3B0` r 90 at (1040, 150), 8 rays turning 20 deg/s; hills `#46C24F` and `#2FA04A` scrolling left 300 / 600 px/s; blue ball hero `#2F7BFF` r 100 at x 480, 2.5 bounces/s, 120 px high; red triangle bird `#FF3B3B` at x 960, wings swap every 2 drawings |
| 1 | Face | `#29C5F6` | ground `#29C5F6`, 12 white wedges (35 %) turning 40 deg/s; the hero's face r 300 at (640, 400); white eyes r 95 at +-125, pupils r 42 darting left and right every 0.6 s; mouth `#FF5A7A` |
| 2 | Boom | `#FF4FA3` | radial `#FFD0E8` to `#FF4FA3` to `#C2188F`; a white 12-point star r 150..260 pulsing at 2 Hz; 20 confetti bits (`#FFC531`, `#29C5F6`, `#46C24F`, one fixed table) flying out 400 px/s, each looping in 1.2 s |
| 3 | Night | `#7B4DFF` | sky `#4B24C9` to `#9B6BFF`; crescent `#FFE45C` r 80 at (1020, 160); 14 stars (fixed table) in two sizes swapping every 4 drawings; hill `#2A1570`; the hero asleep, breathing 4 % at 0.5 Hz |

**Light** (as `boxtv` in `props-skiproom.js` does it: read that header):
- Halo: tinted to the scene's light colour, opacity 0.22 x `glow` (today's `#8aa2cf` stays for the alps).
- Spec `light` (0 = none; this film 0.55): one point light 0.25 m in front of the screen centre, range 3.5, no shadow, the
  scene's colour. It lights the set and props. The level rides in the colour (the engine rescales light intensities).
- Spec `castLight` (0 = none; this film 4): the scene's colour and that strength x `glow` into the shared fire-light
  channel, so the cast's planes turned to the TV get a hard band of the cartoon's colour that jumps on every scene cut.
  At 4 the band is about 0.58 on Tato on the sofa (2.06 m) and 0.31 on a face at the window (2.9 m).

**Keys:** `glow` as today. `on` 0..1 (gtv's default must be 1): 0 = screen `#0B0C10` with one 5 % white diagonal sheen,
no halo, no light (Tato switches it off). `card` 0..1 (new: seed it at 0 with a prop action at t 0, or it jumps).

**End card** "Are you still watching?": `card` crossfades the running cartoon to a solid card, so nothing has to freeze.
Ground `#14161C`. Two lines, bold 110 px, `#FFFFFF`, centred: "Are you still" at y 290, "watching?" at y 420. Two pills
300 x 84 at y 560: left at x 480 filled `#FFFFFF` with "Yes" (44 px, `#14161C`), right at x 800 outlined `#8A8F99` 3 px
with "No" (`#C9CDD6`). No logo, no red: our own layout. Light at card 1: colour `#6E7FA8`, strength x 0.3, mixed by
`card`: the room drops dim and still before the reveal. Redrawn when `card` moves by 1/100. Text reads when the screen is
600 px wide or more on the phone frame (cap height 37 px).

## 3. Mash, the square-eyed neighbour (H1, frame 0)

- `mash.json` unchanged, no new costume. `square: 1` keyed at t 0 with dur 0, for the whole clip.
- Face: eye 1.12, browY 0.02, tilt 0.05, curve 0.2, open 0, pupil 0.85. Pupils dead on the camera, look [0, 0], no
  saccades, `noblink`. The unmoving stare is the joke.
- Blinks: two keyed blinks, at 0.30 s and 0.85 s, dur 0.27 each (3 frames down, 2 shut, 3 up). Frames 0-8 are fully open:
  frame 0 must show two complete squares.
- Frame 0: fov 30, camera 1.33 m in front of his eyes, square on (frame 0.40 m wide = 2700 px/m). Each eye 327 px wide,
  the two eyes from x 190 to x 890, gap 44 px. Eye line at y 1150, so his brows sit near y 675 and the label has y 200-600
  to itself. Take his eye height from `qa/camfit.mjs`, not from this file.
- Pull out from 1.10 s over 0.8 s (ease out) to a medium shot with the window frame in it; eyes stay 60 px wide or more.
- Light: gtv `scene: 0` pinned for this shot (warm `#FFC531` on his skin, the whites stay warm white); the cartoon's first
  cut to cyan lands on or after the pull-out. `castLight` 4. Room level is the director's (`set.lights`, my default 0.5).
- Bench target for the close-up: the eye whites are the brightest surface in the frame bar the catch lights (220 of 255
  or more), top line about 40 px thick, side lines about 12 px, no gap between the eye plates and the skin.

## 4. Bench and checks

`bench/bench-eyes.mjs` (set `plain`, day; 1 s beats, a still 0.6 s into each):

| Beat | Shot | State |
|---|---|---|
| E1, E2 | Tato eyes, frame 0.45 m wide | no keys (the rig) / `square` 0.02: these two must look the same |
| E3, E4 | same | `square` 0.5 / 1 |
| E5, E6 | same | `square` 1 with both lids 0.5 / lids 1 |
| E7, E8 | same | `square` 1, look [0.9, 0.4] / [-0.9, -0.4] |
| E9, E10 | same | `square` 1, expr shocked / deadpan |
| E11, E12 | same | `square` 0.02 with `sqCorner` 1 / 0.5 |
| E13-E15 | Dad eyes, frame 0.6 m wide | phone eyes open / lids 0.5 / `sqPhone` 0 |
| E16, E17 | medium line-up, frame 2.6 m wide: Mash `square` 1, Tato 0.5, Dad phone, reporter untouched | square on / camera 35 degrees to the side |
| E18 | the E16 line-up | `set.lights` 0.4 |
| E19 | 2 s moving | Mash's two blinks and Tato's H3 flicker, as a 15 fps strip |

`bench/bench-tv.mjs` (set `gravroom`, cameras D and A from `facts/02-gravity/bench/make-room-bench.mjs`): T1 alps
(control); T2-T5 scenes 0-3 from D; T6 `card` 0.5; T7 `card` 1; T8 `on` 0; T9-T12 wide A with Tato on the sofa, scenes
0-3 (the colour on him, the sofa and the wall); T13 wide A at `card` 1.

Pass when: E1 = E2 at full size; on the 360 px phone sheet E16 shows round, half, square and phone eyes apart at a glance;
E5-E6 show no white or iris past the lids; E9 brows clear the eyes; E17 shows no gap behind a plate; T1 matches a still
taken before the change; any still rendered twice, and the set rendered in reverse order, comes out identical.

```bash
node qa/preflight.mjs <bench.json>
node engine/render.mjs <bench.json> --stills beats --draft --safe      # then node qa/contact.mjs <dir>/<id>-*.png --out <sheet.png>
node engine/render.mjs <bench-eyes.json> --draft                       # E19, and read its one-frame pops line
node qa/golden.mjs      # must report no change: face.js is untouched, the layer and the picture are opt-in
node qa/regress.mjs     # timeline.js and potato.js are rig files
python3 tools/lint-notes.py docs
```

## 5. Open questions (my default) and risks

1. Square iris and pupil, or a round iris in a square white? Default: square (three nested squares read at 40 px).
2. The neighbour stands at the window of a high-floor room. Default: no city props, a dark hedge and night sky behind the
   glass so the room reads as ground floor (director's staging, not built here).
3. "Next episode in 5" (outline, 12-25 s) is not in this spec. Default: later, as a second `card` layout.

Risks: (1) E1 against E2: if the copy of the round eye shows, H3 still works because the layer is on from the cut, but a
slow morph on Dad mid-shot would pop, so keep switches on cuts. (2) The fire-light channel is ONE per scene: the TV owns
it, Dad's phone glow stays the phone prop's own halo. (3) `castLight` 4 paints the wall and cabinet beside the TV at the
0.8 cap: check T9-T12, lower to 3 if the corner of the room turns into a colour block. (4) The flicker is the one piece
that can look like a bug: judge E19 as a strip before any hook uses it.

One line on the brief: none of it is wrong; H3's "flickering" works only as two held snaps, not a fast flicker.
