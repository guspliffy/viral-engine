# Rival duel 01 "Armrest war": DESIGN of the new pieces (26 Nov 2026, v2: aligned with the panel sheet)

Target: the panel sheet `/mnt/project-files/videos/rival-duel/01-armrest-war/sheets/armrest-war-panels-v1.png` (15
panels, the outline's numbering) + OUTLINE.md v1; section 11 lists where this spec cannot follow the sheet. Tall
1080x1920. Builders build exactly these numbers: plain shapes, existing kits wherever one fits.

Rules for all:
- Metres, y up, +z = the plane's nose, a prop faces +z at rot 0. Looking toward -z, +x is screen RIGHT. The sheet has
  Spud screen LEFT with his window on his left (panels 01, 05, 07, 10, 11, 15): from a front camera that is the
  STARBOARD pair. So Spud sits in D (x -2.09), Wedge in C (x -1.03). Everything below is on that side.
- Seated potatoes ride 0.30 up: Spud's eyes about y 0.95, Wedge's 1.01; the attendant standing 0.93; seat backs 1.40.
- No letters, digits or icons on anything. Every key tweens through a `prop` set: export the defaults in the file's
  `<NAME>_STATE` (as props-zfight.js ZFIGHT_STATE), or the first tween jumps.
- NEVER tween a material's opacity or colour (clip-lessons: the first frame's value sticks). Show, hide, swap or
  scale meshes; every alpha below is fixed. Light, glow, flame, sky, clear plastic, worn pieces: noOutline, no
  shadow, userData.steam. Pure functions of spec, state and story time. A usage header on each file.
- Bench per file: one still per state below, a full-size crop of `sharedarm`, and a 360 px copy of each (phone read).
  Numbers marked "est." are read off the cast files and fixed in the bench; cameras are worked by hand and go
  through `qa/camfit.mjs`.

| Palette | Hex |
|---|---|
| Console grey / top inset / seam | #b3b7bf / #c6c9cf / #7f838c |
| Brushed steel / brush line / screw, hinge | #d5d8dd / #b9bdc4 / #8e9399 |
| BUTTON red / side shade / lit (the hall's alarm red) / lit core | #e0261c / #a8181a / #ff2a1c / #ffd0c4 |
| Bomber red / crease / cream rib / rib line (wedge.json); cast bare hand | #c34732 / #9c3828 / #fcdaa7 / #e3bd8a; #f6dcae |
| UNIFORM navy / lapel / scarf red / GOLD (shade, light) | #1c2748 / #111a36 / #d8322a / #e8b93a (#9a6a1e, #fff0b8) |
| Crowbar red / shade; bag red / straps | #e23a2e / #a82820; #a8352b / #c9a25a |
| BUTTER / gloss (props-steak.js) | #f6dc6a / #fffbe6 |
| Flame core / mid / rim; smoke; daylight | #fff6c0 / #ffb02a / #f0621e; #f4f4f2; #fff6d8 |

Files: builder A, new `engine/page/props-armrest.js` (`sharedarm`, `butterknife`, `fakearm`, `crowbar`); builder B,
new `engine/page/props-armrest-fx.js` (`pilothat`, `sleepmask`, `wingspin`, `ejecthatch`, `seatrocket`,
`cockpitcard`); builder C, `characters/potatobrawl/mash-attendant.json` + 1 opt-in key in the `dauphin` kit + 2 on
`paperhat`; the director, `storyboards/lib/grips.mjs` (4b) and the registry. Reused as they are: `cabinhall`,
`planeseat`, `duffel`, `drinktray`, `butterpat`, fx `poof`, `glint`, `shake`. Not used: props-diner.js `button` is a
four-hole coat button; the red button is part of `sharedarm`.

## 1. ATTENDANT (`potatobrawl/mash-attendant`)

Mash's body, as the sheet: tall, narrow, deadpan, half-shut eyes. No new costume code beyond three opt-in keys.

- Character file = a copy of mash.json with `limbs.color` "#1c2748", `face.default` "serene", `tts` "mash", `costume`
  { type "dauphin", blazer "#1c2748", lapel "#111a36", gold "#e8b93a", ascot "#d8322a", ascotY 0.545, watch false,
  square false }. Body, face size 0.72, hands, leaf unchanged (height 1.24, width 0.54, depth 0.5, seed 67).
- The `dauphin` kit already draws the sheet's jacket: navy, lapels, gold buttons, and its `ascot` is the sheet's
  scarf (a knot and two tails). NEW opt-in kit key `ascotY`: the knot's height in metres above the floor; without it
  the ascot stays where it is today (on her tall body that is 0.18 under the collar: a chest ornament). 0.545 puts the
  knot 0.03 under the shirt collar's lowest point (est. 0.577; measure). Navy #1c2748, not the kit's stock #2a3f8f,
  which is the seat colour.
- Cap (panels 02, 06, 10: a small navy side cap, one gold line, the leaf out beside it) = worn `paperhat` with two
  NEW opt-in spec keys, `color` (default "#fbfaf6") and `stripe` (default "#c8302c"). Here color "#1c2748", stripe
  "#e8b93a", scale 0.62, tilt 10, body frame (-0.04, 1.30, 0) (band bottom; est., her crown is at 1.38).
- No wings badge and no peaked cap on her: gold wings and a peak belong to the captain plants (5 and 7) only.
  Bench, 3 stills (front, 3/4, 360 px): navy block, red knot at the neck, gold dots, cap; 1.38 tall, 1.42 with cap.
- Acting sheet (02, 06, 10): half-shut eyes, flat mouth, never a smile, no blink inside a line. One finger at her
  lips (02), one flat palm (06). She arrives the same way every time (section 10): the sameness is the gag.

## 2. SHAREDARM (kind `sharedarm`): the hero prop (panels 01-07, 09-15)

A chunky grey console box, three times a normal armrest's width and 0.05 taller, a brushed steel plate on its front
end, a big red button on it, a clear flip cover. ORIGIN: the floor, on the centre line between the two seats, at the
seats' own z. Place at (-1.56, 0, 0). -x = Spud's side, +x = Wedge's. Solid. Seat D takes `arms: "R"` (keeps its
window-side arm), seat C `arms: "L"` (keeps its aisle-side arm): this is the ONE armrest between them. Grip 0.72.

| Part | Size (x, y, z) | Where | Look |
|---|---|---|---|
| Body | 0.22 x 0.25 x 0.61, corners r 0.025 | y 0.47..0.72, z -0.21..0.40 (OVER the cushions, top 0.45; 1 cm in front of the seat backs) | console grey; the top face 0.004 inset inside a 0.012 rim, paler |
| Front pedestal | 0.22 x 0.47 x 0.095 | y 0..0.47, z 0.305..0.40, flush with the body's front (in front of the cushions) | console grey, one seam line at y 0.47: from the front one tall box, as panels 05-13 |
| Keel | 0.06 x 0.47 x 0.48 | y 0..0.47, z -0.19..0.29 (the cushions leave 0.08 between them) | seam grey |
| Plate | 0.19 x 0.008 x 0.19 | top y 0.728, z 0.19..0.38 | brushed steel, 9 brush lines drawn once, 4 corner screws r 0.006 |
| Collar | ring r 0.050..0.058, 0.010 tall | top y 0.738 | #1d1d22 |
| Button | puck r 0.050, 0.028 tall, top edge rounded r 0.010, top face domed 0.004 | top (0, 0.766, 0.285) | BUTTON red, darker side wall, one gloss arc #ffb3a8 |
| Cover | 5-sided box 0.14 x 0.085 x 0.14, corners r 0.015, walls 0.004 | over the button, z 0.215..0.355, top y 0.813 | clear #e6f4fb alpha 0.25; its 12 edges as bars 0.005 thick, #f4fbff alpha 0.6 (they carry the read on a phone) |
| Hinge | block 0.06 x 0.015 x 0.015 | at the cover's REAR bottom edge (y 0.728, z 0.215) | hinge grey |

Keys (0..1, default 0):
- `guard`: 0 = shut. 1 = swung 90 degrees up and back about the rear hinge: it stands behind the button as a clear
  box open to the front (z 0.13..0.215, y 0.728..0.868), as panels 09 and 14. Never past 90: its roof would dip into
  the console top. Sheet: shut in 01-07, 11, 13, 15; open in 09, 10, 14.
- `press`: the button sinks 0.014 (top 0.766 to 0.752), linear. From 0.5 it is SWAPPED for a lit one (unlit #ff2a1c,
  a core spot r 0.02) and a flat glow disc shows on the plate (y 0.729, unlit #ff2a1c, alpha 0.45), radius 0.058 to
  0.095 from press 0.5 to 1.
- `butter` (panels 09, 10): five overlapping knife strokes on the top from z -0.19 to +0.12, 0.19 wide in all, each a
  lobe 0.11 x 0.05 x 0.004 with a wobbly hashed edge, BUTTER, roughness 0.2, three gloss streaks 0.06 x 0.008. They
  appear one after another (0, 0.2, 0.4, 0.6, 0.8), each growing by scale from its Spud-side end. From 0.8 one drip
  grows over the +x (Wedge's) edge at z 0: a tongue 0.03 wide, 0.04 down, a bead r 0.012.
- Elbow room on the top: z -0.21..0.19 with the cover shut, to 0.12 with it open, 0.22 wide.

`ARMREST_GRIPS.sharedarm`: `button` [0, 0.766, 0.285]; `near` [0, 0.776, 0.285] (1 cm over it: where the hand and
the crowbar tip stop); `lid` [0, 0.813, 0.345] (the cover's front lip: what a finger or the knife tip flips);
`elbowYou` [-0.05, 0.72, -0.02]; `elbowHim` [0.05, 0.72, -0.02]; `slide` [-0.05, 0.72, 0.145] (panel 05: a sleeve of
r 0.06 there ends 1 cm from the shut cover).

On screen: C1 gives 2421 px a metre: console 533 px wide (half the frame, as panel 01), plate 460, cover 339, button
242 (360 px phone sheet: 178 / 153 / 113 / 81). In the two-shot C2 (750 px a metre at the button): console 165,
cover 105, button 75 (phone 55 / 35 / 25).

### 2b. BUTTERKNIFE (kind `butterknife`, panel 09)

Built UPRIGHT, ORIGIN the blade tip (bottom). 0.20 long: blade 0..0.11, 0.022 wide x 0.002, round tip, brushed
steel; handle 0.11..0.20, r 0.009 to 0.011, red #c8302c (as drawn). spec `dab` (default true): a BUTTER dab 0.03 x
0.012 on the blade's lower third. Solid, no keys. The tray and the block: `drinktray` + `butterpat`.

## 3. FAKEARM (kind `fakearm`; not on the sheet, from the outline: it lies on the armrest in panel 11's shot)

A shop mannequin's arm in Wedge's sleeve: stiff, a little too shiny, a steel socket where the shoulder should be.
Built UPRIGHT. ORIGIN: the centre of the flat shoulder end (bottom), +y toward the hand. 0.40 long. Solid. No keys.

| Part | y from..to | Cross-section (x by z) | Look |
|---|---|---|---|
| Socket cap | 0..0.008 | disc r 0.055 | steel, a dark centre hole r 0.014 (#26242c) |
| Sleeve | 0.008..0.26 | ellipse 0.16 x 0.13 tapering to 0.13 x 0.105 | bomber red, 3 crease lines each drawn once |
| Cuff | 0.26..0.30 | ellipse 0.115 x 0.095, bulging 0.004 | cream rib, 9 rib lines |
| Hand | 0.30..0.40 | a seam ring 0.004 #c9a877 at 0.30; palm 0.09 x 0.04, 0.055 long; 3 finger lobes 0.027 wide x 0.045 long, straight, 0.004 gaps; a thumb lobe 0.024 x 0.035 off the +x side at 35 degrees | bare-hand colour, roughness 0.3 (plastic) |

- Lying on the console: tip 90 so the hand points +z (check the sign in the bench), flat side down, origin at
  (-1.56, 0.785, -0.22): the socket end hangs 1 cm over the console's rear edge and the fingertips end at z 0.18,
  1 cm short of the button plate. That gap is the joke.
- `ARMREST_GRIPS.fakearm`: `sleeve` [0, 0.13, 0] (his fist), `cuff` [0, 0.28, 0] (where the crowbar's chisel goes
  under: lying, that is z 0.06), `tip` [0, 0.40, 0]. Bench: upright in his fist (mug hold); lying on `sharedarm`.

## 4. CROWBAR (kind `crowbar`, panels 12, 13)

As drawn: BIG, all red, nearly as tall as Spud. Built UPRIGHT, ORIGIN the chisel tip (bottom). Hex shaft r 0.02,
0.90 tall. Solid. No keys.

| Part | y from..to | Shape | Look |
|---|---|---|---|
| Chisel | 0..0.10 | flattens from the hex to a blade 0.05 wide x 0.006 thick, bent 18 degrees toward +z | crowbar red; the last 0.02 ground bright #d5d8dd |
| Shaft | 0.10..0.76 | straight hex | crowbar red, one long highlight band #f06a5c, 5 chips of the shade |
| Hook | 0.76..0.90 | gooseneck, radius 0.06, turning 170 degrees toward -z; a forked claw 0.07 long x 0.045 wide, V notch 0.015 | crowbar red |

`ARMREST_GRIPS.crowbar`: `low` [0, 0.42, 0], `high` [0, 0.58, 0] (Spud's two fists, one over the other as panel 12),
`tug` [0, 0.20, 0] (Wedge's fist, panel 13), `tip` [0, 0, 0] (it goes under the fake arm's cuff and hovers at
`sharedarm.near`), `hook` [0, 0.88, -0.12].

### 4b. Grip size entries (storyboards/lib/grips.mjs SIZE)

```
sharedarm: { h: 0.72 },            // props-armrest.js: rest hold, a glove or a forearm on the console top
butterknife: { len: 0.2, r: 0.006 },   // props-armrest.js: upright on its blade tip: thin pinch at 0.6 x 0.2 = y 0.12, on the handle
fakearm: { r: 0.07, h: 0.2 },      // props-armrest.js: upright, hand end up: mug hold round the sleeve, fist at 0.66 x 0.2 = y 0.13
crowbar: { r: 0.02, h: 0.636 },    // props-armrest.js: upright, hook up: mug hold, fist at 0.66 x 0.636 = y 0.42; the other glove on ARMREST_GRIPS.crowbar.high
```

## 5. PILOTHAT (kind `pilothat`, panel 08): plant 1

Only ever in the bag: never worn, never held, no keys. It carries the bag's open mouth, so it sits on a stock
`duffel` (color "#a8352b", trim "#c9a25a": the sheet's red bag with tan straps). ORIGIN: the centre of the mouth =
the duffel's origin + (0, 0.125, 0); +x along the zip. Not solid (staged: in the bag).

- Mouth: an almond opening 0.34 (x) x 0.15 (z), 0.002 above the bag's skin, dark navy #1d2238 inside with two fold
  lumps #2a3352 (folded clothes); two zip lips 0.012 wide in spec `lip` (default "#c9a25a"), each bowed 0.02 up.
- Hat, radius 0.15 (0.30 across): band UNIFORM navy 0.045 tall; a soft WHITE crown #f4f4f0 flaring to r 0.175 at
  0.085 up, its top domed 0.02; a GOLD cord r 0.006 across the band's front, just over the peak; on the band's front
  a GOLD wings badge 0.10 x 0.035 (the shape of piece 7); a glossy black peak #15151a reaching 0.085 forward, 14
  degrees down, 0.006 thick, plain.
- Pose (as panel 08: nearly the whole hat on show): band-bottom centre at (0.03, -0.03, 0.02) from the origin, peak
  toward +z, tipped FORWARD 25 degrees (the peak dips, the white top turns to a low front camera), rolled 10 degrees.
  Top of the hat about 0.12 above the mouth (world y 0.375).
- The read is white top + black peak + gold: a captain. In C2 the hat is about 250 px wide (phone 84), bottom right;
  panel 08's low pass should give it 450 px or more.

## 6. SLEEPMASK (kind `sleepmask`, worn, panel 11)

Worn prop: spec.wear = Wedge's actor id, x 0, y 0, z 0 in his body frame; squashes with him (wearSquash, as
flatcap). Fit to his REAL skin (potato.js bodyPoint, as props-heist.js balaclava): his body is squared (square 2.6).
All parts steam: it hides his eyes on purpose and no face check may fail on it. No keys.

- Pad, as drawn: plain BLACK #1b1b20, one soft edge sheen #3a3a44 0.012 wide, nothing printed on it. It covers both
  eye bulbs with 0.02 to spare all round (est. 0.46 wide x 0.26 tall, centre on his eye line, est. y 0.71; read the
  bulbs from ch.face in the bench), a nose notch 0.05 wide x 0.035 deep at the bottom middle, 0.016 thick with
  pillowed edges, its inner face 0.004 clear of the bulbs (est. 0.03 off the skin). Brows within 0.04 of its top
  edge are covered too (extend the pad); brows farther up stay free.
- Strap: black, 0.022 wide, 0.004 off the skin, from the pad's two ends round the back of the head on the eye line.
- Under the sunglasses, as panel 11 (shades right above the mask): nothing moves. The shades stand on his crown,
  lower rim at est. y 1.07; the pad's top edge is at est. 0.84, the strap at 0.71. Build check: nothing above 0.92.
- Use: never a hand prop. Both his gloves pass over his eyes and the mask is on when they clear (prop scale 0 to 1
  in 2 frames behind the gloves); eyes "closed" under it, mouth open (asleep) from then on. Bench: face crops, front
  and 3/4, seated and leaning 15 degrees: no iris or lid through the pad.

## 7. CAPTAIN CLUE (kind `wingspin`, worn, panels 11, 14): plant 2

Worn prop on Wedge, steam. On his LEFT chest (+x: the viewer's right of the zip, as panel 11; also the side away from
the arm that works the armrest). Body frame est. (0.20, 0.41, shell + 0.003): on the red shell, 0.04 outside the
cream collar's edge, 0.10 above the pocket flap (measure in the bench). Worn 6 degrees askew.

- 0.10 wide x 0.034 tall x 0.004 thick: a plain round boss r 0.014, two wings 0.036 long, each three feather rows
  stepping down, the lower edge scalloped 3 times. GOLD, shade in the grooves, one light band on each wing's top edge.
- Key `show` 0..1 (default 1): scale about its centre, 0 = not there. In C2 it is 76 px wide (phone 25).
- The glint is not built: fx `glint` with `pos` = the pin's world point, dur 0.5, ONCE, in round 4.

## 8. EJECT (kinds `ejecthatch` + `seatrocket`, panels 14, 15)

There is no flat ceiling over the seats: the luggage bins hang to y 2.35 from |x| 0.62 to 2.6. The hatch is in the
BIN'S UNDERSIDE over seat C, a painted hole (no cut in the hall): the seat rises behind the sky card and is gone.

`ejecthatch`. ORIGIN: the centre of the opening, on the bin's underside, looking down. Place at (-1.08, 2.35, 0.05).
Opening 0.90 x 0.90, corners r 0.06. All steam. Local y below:

| Part | Where | Look |
|---|---|---|
| Seam + 4 latches (always drawn) | y -0.002 | a seam 0.008 wide #8e9399 round the square; latches 0.05 x 0.02 at the corners |
| Sky card | y -0.006 | unlit, #6fb4f2 at the +z edge to #cfe9ff at the -z edge; 2 white clouds (0.4 x 0.15 lumps) crossing from +z to -z in 0.5 s each, 0.25 s apart, looping on story time |
| Frame | y -0.008 | 0.05 wide round the opening, #9aa0a8, 12 rivets r 0.008 #6f757d (as panels 14, 15) |
| Lid | y -0.012 | panel 0.90 x 0.90 x 0.02, bin grey #dfe4ea |
| Light shaft + 4 rays | from the opening to the floor | a 4-sided frustum, 0.90 square at y 0, 1.15 square at y -2.345 with its floor end shifted 0.25 toward -x (the light falls toward Spud, as panel 15); unlit daylight colour, alpha 0.12, double-sided, no depth write. Inside it 4 thin slabs (0.10 x 0.01, full length, fanned 4 degrees apart), alpha 0.14 |
| Floor patch | (-0.25, -2.342, 0) | card 1.15 x 1.15, unlit #fff3c4, alpha 0.3 |
| Seat rails (panel 15) | local x -0.25 and +0.35, y -2.34, z -0.05 | two tracks 0.06 x 0.02 x 0.62 along z, #9aa0a8, 5 dark bolt holes each |

Key `hatch` 0..1 (default 0): at 0 only the seam, latches and lid show. Above 0.05 the sky card and frame show. From
0 to 0.9 the lid stays in its plane and SHRINKS, scale 1 to 0.06, turning 220 degrees about y and drifting 0.30
toward -z (from below: a panel blown off and whipped away behind the plane); hidden from 0.9. From 0.3 to 1 the shaft
and rays grow down from the opening (scale y from the top). At 0.95 the floor patch and the rails switch on (a step).

`seatrocket`. ORIGIN: seat C's origin; the director gives it the seat's own position tweens. Unlit, steam.
- Thruster (always there, under the floor until the seat rises): a block 0.50 x 0.08 x 0.30 at y -0.08..0 and a bell
  nozzle r 0.07 to 0.10 from y -0.08 to -0.20, #55595f.
- Key `flame` 0..1 (default 0; scale only, hidden at 0): ONE flame from the nozzle down, as panel 14: base r 0.10 at
  y -0.20, tip at y -0.20 - 0.60 x flame; three nested shells (rim, mid at 0.7, core at 0.4); the edge is 7 tongues
  with hashed lengths (25 % spread); two silhouettes swapped at 15 Hz on story time.
- The white smoke column of panel 14 is NOT built: three fx `poof`, color "#f4f4f2", puffs 16, sparks 0, size 0.9,
  dur 1.1, at (-1.03, 0.15, 0), (-1.03, 0.85, 0), (-1.03, 1.55, 0), 2 frames apart.

Suggested 15 frames (f0 = `press` reaches 1): f2-f8 `hatch` 0 to 1; f3-f6 `flame` 0 to 1, the seat hops 0.06, first
`poof`, `shake`; f6-f14 seat and Wedge y 0 to 3.4, ease "in" (his head meets the opening at f11); f15 gone.

## 9. COCKPIT (kind `cockpitcard`, panel 13): plant 3 (added: on the sheet, the hall has no cockpit)

One flat unlit painted card 1.0 x 2.0, ORIGIN the middle of its bottom edge, picture on +z. Place at (0, 0, 10.56),
rot 180: it fills the hall's front doorway and hides the hall's daylight plane. The hall's own door does the swing
(`open` 0 to 1), EXIT sign `fill` 0. Picture, no letters or digits: the top 45 % a windscreen of two sky panes
#8fc8ff, one cloud each, a dark centre post; under it a dark panel #3a3f4a with three plain glowing screens (two
#9fe0b0, one #ffc46a); a centre pedestal with two throttle levers; left and right two EMPTY seat backs seen from
behind, #6f757d, each 0.30 wide, pale headrests #c9ced6 with their tops at y 1.25 against the bright windscreen.

## 10. Floor plan and cameras

| What | Place (x, y, z) | Note |
|---|---|---|
| `cabinhall` | (0, 0, 0) | omit rows 0, 1, 2 seats C and D (cameras stand in rows 1-2) |
| Seat D, Spud = YOU | (-2.09, 0, 0) | `planeseat` w 0.96, arms "R", color "#2f4d8c", cover 0.34 |
| Seat C, Wedge | (-1.03, 0, 0) | the same, arms "L"; `seatrocket` at the same place |
| `sharedarm` | (-1.56, 0, 0) | button top at (-1.56, 0.766, 0.285) |
| Bag + `pilothat` | duffel (-1.15, 0.13, 0.62); hat (-1.15, 0.255, 0.62) | on the floor in front of his seat, under his boots; at x -1.15 the hat stays inside C2's frame |
| `ejecthatch` / `cockpitcard` | (-1.08, 2.35, 0.05) / (0, 0, 10.56) rot 180 | |
| Attendant P1, aisle (panel 06) | (-0.15, 0, -0.10), yaw -25 | she comes from behind his seat back: start (-0.20, 0, -1.50), hidden from C6; 8 frames, on screen for the last 3 |
| Attendant P2, between them (02, 10) | start (-1.56, 0, -0.78), hidden behind the two seat backs; up (-1.56, 0.90, -0.78), pitched 18 degrees forward | she jumps and props herself on the two headrest tops, a glove on each at (-1.56 +- 0.30, 1.42, -0.42); from the scarf up (est. y 1.44) she is over the seat backs, cap top est. 2.27 (bins 2.35: judge on stills). In 4 frames |

| Camera (panel) | pos | look | fov | What it holds |
|---|---|---|---|---|
| C1 frame 0 (01) | (-1.56, 1.36, 1.32) | (-1.56, 0.76, 0.17) | 34 | frame 0.45 m wide: the console top from y px 600 to 1300, the button at y px 1075, teal sleeve from the left, red sleeve and cream cuff from the right. No face |
| C2 two-shot from the front (05, 07, 11) | (-1.56, 1.10, 3.30) | (-1.56, 0.92, 0.0) | 46 | Spud left, Wedge right, 15 cm of each outer side cropped as drawn; console bottom centre; bins in the upper third for subtitles |
| C3 attendant between (02, 10) | C2's pos | (-1.56, 1.30, 0.0) | 50 | her eyes at about y px 690, theirs at 1170, her cap top at 450: subtitles above y px 420 |
| C6 aisle (06) | (-1.75, 1.05, 1.55) | (-0.45, 1.00, -0.10) | 42 | Wedge cropped at the left edge, she right behind his shoulder, the aisle and rows behind her |
| C14 launch (14) | (-1.75, 0.45, 2.30) | (-1.15, 1.60, 0.0) | 62 | button and Spud's hand bottom left (x px 270, y px 1450), the seat centre right (y px 1390) rising to the hatch (y px 590) |
| C15 after (15) | C2's pos | (-1.45, 1.30, 0.0) | 62 | Spud left on the whole console; right of him the rails, the patch, the rays, the bag with the hat; the hole top right, the aisle at the right edge |

## 11. Where this spec leaves the sheet (ask before the build), then defaults

1. Console width: drawn about 0.45; built 0.22, the most the two seated bodies leave (run `qa/clear.mjs`; 0.20 if
   Wedge's body is within 0.02).
2. Panels 02 and 10 draw the attendant between them at their own face height. Real seat backs (1.40) hide anyone
   behind them, so she is propped on the headrests with her eyes about 0.8 m above theirs. Other way: aisle (P1) for
   all three appearances.
3. Panel 13 shows their faces AND the cockpit behind them: with faces to the lens, the tail is behind them. Default:
   13 is the tug of war on C2, and plant 3 gets its own shot looking forward down the aisle past the attendant.
4. Panel 08 draws open space under the seats; a `planeseat` is a solid box to the floor: the bag is in front of it.
5. Her jacket: the kit's is double-breasted with a white shirt in the V and white cuffs; drawn single-breasted and
   closed, gold cuff bands. Kept the kit (no new costume code).
6. Windows: drawn blue sky with white clouds; `cabinhall` feed 0 is grey-white cloud. Kept; only the hatch is blue.
7. The hatch is in the bin's underside, not a ceiling panel; panel 11 gains the fake arm (outline).

Defaults Jonny might change: (a) starboard seats, so the pair matches the sheet's screen sides (the PA line still
says 14B; no letter is ever seen); (b) the cover: shut until round 3, Spud's knife tip flips it open while he
butters (09), the attendant's finger shuts it after each near-press, Spud opens it himself in 14, shut again in 15;
(c) press travel 14 mm, not 6 (6 mm is 4 px in the two-shot); (d) crowbar 0.90, not 0.6 (as drawn; it also spans
the two seats in the tug); (e) the plain black mask goes on behind his gloves, no slide; (f) the pin is on him from
frame 0 and glints once; (g) the bag with the hat stays in the daylight after the launch.

## 12. Risks

- The bin: Spud standing on his cushion reaches about y 1.9, the lids start at 2.35, and `lid` opens all 22 at once.
  Let the crowbar drop to him and keep one lid in frame (panel 12).
- Hands: knife, fake arm and crowbar (two holders in the tug) pass through hands; mask and pin are worn pieces so
  they never do. If the tug fails two fix rounds, cut to the tip over the button.
- The launch moves up to 0.8 m a frame: the pops check may flag it; that speed is the shot.
- Four reds share the frame (button, bomber, crowbar, bag) as on the sheet: the button stays the only LIT red.

One line on the brief: frame 0 is a prop close-up with no face (story.md opening rule 2 asks for two characters);
panel 01 wins, and C1 has both sleeves in it from the first frame.
