# EP07 "Only you remember" (fire rewind): DESIGN of the new looks (13 Nov 2026)

Target: Jonny's board.png, panels 01-16, and STORY.md v1. This file gives the numbers; builders build exactly these.
The director stages, frames and acts; nothing here is a camera or an acting note.
Reused, not designed here: `pocketwatch` (hands, crack), `streetlamp` (props-busstop.js), `cobbles`
(props-ghostphoto.js), the pause look `"grey"` (engine/shared/pause.js), Spud, Chip.
Everything is a pure function of params and the clip time (no Math.random, no clock). Fire, smoke, embers, glass
shards, light pools and glows are `userData.steam`, `solid: false`, cast and receive no shadow, and carry no ink
outline (`noOutline`). No letters or numerals on anything. Realistic: no impact stars, no speed lines.

World frame A (the street; all of section 1 and 3.1-3.2): x right as seen from the street, y up, z toward the street.
THE FACADE'S OUTER FACE IS z 0, THE PAVEMENT IS y 0. Origin: on the pavement under the middle of the fire window.
World frame B (inside; section 2 and 3.3-3.4): prop `firelobby` placed by the director at [0, 0, -40], rot 0 (cuts
hide the distance); its numbers below are local to it: origin on the lobby floor just inside the front door,
+z back toward the door, the stairs rise toward -z.

## 1. THE BLOCK OUTSIDE (prop `fireblock`, panels 01, 03-05, 11, 12, 14-16)

### 1.1 Layout (frame A, metres)
| Thing | Where | Size |
|---|---|---|
| Facade (brick, four storeys) | x -6..6, y 0..10.6, face z 0 | wall 0.25 thick, glass planes at z -0.10 |
| Dark neighbour blocks (flat, no detail) | x -14..-6 (top y 9.4) and x 6..14 (top y 11.6), face z 0.10 / -0.10 | 4 unlit windows each |
| Window columns | x -4.2, -2.1, 0, 2.3, 4.4 | |
| Window rows (sill top y / head y) | G 1.15 / 2.45 · 1st 2.95 / 4.25 · 2nd 5.55 / 6.85 · 3rd 8.15 / 9.45 | all 1.30 tall |
| FIRE WINDOW (G, column 0) | x -0.75..0.75, y 1.15..2.45 | 1.5 wide; see 1.3 |
| CHIP'S WINDOW (1st, column 0) | x -0.65..0.65, y 2.95..4.25 | 1.3 wide; sash, see 1.3 |
| Other windows | 1.2 wide (G row 1.5 wide), 2 x 3 panes | no window at G column 2.3 (the door) |
| Front door | x 1.75..2.85, y 0.30..2.50, leaf plane z -0.12 | 1.1 x 2.2, hinged at x 1.75, opens inward |
| Fanlight | half circle r 0.55, centre (2.3, 2.50) | 5 radial bars |
| Stone door surround | 0.22 wide round door + fanlight, keystone on top (y 3.27) | stands 0.06 proud |
| Steps | landing x 1.45..3.15, z 0..0.60, top y 0.30; one step z 0.60..0.90, top y 0.15 | 2 risers of 0.15 |
| ALARM BOX | centre (3.45, 0.72, 0.045) | 0.26 w x 0.34 h x 0.09 d; see 1.4 |
| FIRE BELL | centre (3.45, 1.70, 0.07) | gong 0.24 across; see 1.4 |
| Drainpipe | x 1.15, y 0..10.3, z 0.06 | pipe 9 cm, 4 brackets, #1b1d22 |
| String course (stone band) | y 2.62..2.78 full width | 0.05 proud, #b9ad9b |
| Cornice + parapet | y 10.0..10.6 | cornice 0.18 proud, #b9ad9b |
| Pavement | x -14..14, z 0..3.2, y 0 | `cobbles` w 28, d 3.2, seed 4, leaves 0 |
| Kerb | z 3.2..3.38, top y 0, drop to y -0.12 | stone #8f8a96, joints every 0.9 m |
| Road | x -14..14, z 3.38..11, y -0.12 | `cobbles` w 28, d 7.6, seed 9, leaves 0 |
| Street lamp | `streetlamp` h 3.2 at (-2.4, 0, 2.75) | lantern centre y 3.36 |
| Two planters | (1.25, 0, 0.30) and (3.95, 0, 0.30) | terracotta pot 0.30 across x 0.28, bush to y 0.62 |
| Sky dome | r 60, centre origin | see 1.5 |

Anchors for the director (frame A): SPUD_LAND (2.6, 0, 1.7), the spot each rewind drops him · LEVER_STAND
(3.45, 0, 0.58) · FRAME0_KNEEL (1.2, 0, 1.9) · CHIP_PERCH top (0, 2.90, -0.42): a window seat x -0.6..0.6,
z -0.72..-0.12, 5 cm under the sill top, so 0.48 m of Chip (0.53) shows over the sill · CHIP_LEAN (0, 2.90, -0.16)
with the sash open · sill outer ledge for the mug: (0.35, 2.95, 0.10), ledge 0.16 deep · DOOR_THRESHOLD
(2.3, 0.30, -0.12) · crowd fan on the pavement: x 0.6..4.2, z 1.0..2.9.

Behind the glass (so open windows and the open door never show a void):
- Chip's room: a box x -1.2..1.2, y 2.60..4.60, z -1.6..-0.10; walls #f0c98a, back wall with one framed picture
  (no detail), cream curtains #f3e3c2 0.22 wide at each side of the window inside. Lit by emissive, see `chip`.
- Fire room: a box x -1.3..1.3, y 0.30..2.75, z -1.8..-0.10, walls #3a2c2a (dim), a sofa back as one dark block
  1.4 x 0.5 at z -1.2. Its glow belongs to `facadefire` (3.1), not to this prop.
- Door stub: a hall x 1.45..3.15, y 0.30..3.2, z -2.4..-0.12: black-and-cream tiles 0.30 m (#2b2a30 / #e8dcc4,
  diagonal), walls #d9c7a3, one pendant lantern at (2.3, 2.75, -1.2). The crowd comes out of it; the far end is a
  closed dark inner door. Lit by `lobby`.

### 1.2 Brick, stone, paint (painted texture; the engine adds ink and cel shade)
- Brick: stretcher bond, brick 0.215 x 0.065, mortar 0.010. Three brick tones mixed by hash 60 / 25 / 15 %:
  #9c4a38, #863d33, #b05a41; mortar #5f3a3a (dark, night); one brick in 14 is #6e3230. Brush hatch, 2 strokes per
  brick at 20 % of the bricks. Flat brick arch (soldier course 0.22 tall) over every window, #a8553f.
- Stone sills 0.10 thick, 0.16 proud, 0.10 wider each side than the window, #b9ad9b, shade #7f7684.
- Window frames white-cream #e9e2d2, bars 0.035 wide; door #2c3338 with 6 lit panes in its upper half (0.16 x 0.22
  each, the `lobby` emissive), brass knob #c9a24a at (2.72, 1.25).
- Flower boxes (0.9 x 0.16 x 0.14, #4a3a34, green #4f7d46 with 5 dots #e58fb0 / #f2d36a) on 3 windows only:
  1st floor column -4.2, 2nd floor column 0, 2nd floor column 4.4. NONE on Chip's window or the fire window.
- Unlit pane: #232a4a with one pale diagonal reflection band #55649c (22 % of the pane), so a dark window still
  reads as glass at night. Lit pane: #ffd27a emissive 1.6, a cream curtain shape #ffe9b8 over 30 % at each side.

### 1.3 The two hero windows
- Fire window: frame only, built by `fireblock`: a top transom light 1.5 x 0.28 (y 2.17..2.45), top-hung and
  standing open outward 18 degrees ALWAYS (this is where early flame, and the tag's smoke curl, come out), and
  under it two lights 0.69 x 0.96 with a 0.06 mullion at x 0. `fireblock` draws NO glass in the two lower lights:
  `facadefire` owns that glass (whole or burst). The room behind is dark (`fireroom` glow 0.15: a faint #c98a4a
  lamp, so it reads as a window before any fire).
- Chip's window: a sash window. Upper sash fixed, y 3.61..4.25; lower sash 0.66 tall, y 2.95..3.61 closed. Param
  `sash` 0..1 slides the lower sash up 0..0.60 m behind the upper one (open gap y 2.95..3.55). Meeting rail 0.045.
  The director keeps `sash` 0 whenever `facadefire.grow` > 0.3.

### 1.4 Alarm box and bell
- Box body #c4232a, 0.012 bevel, edge shade #8e1820, a 0.02 raised rim. Inset cream plate #efe9dc 0.13 x 0.20
  centred 0.01 low. On the plate, top: a glass panel 0.08 x 0.05, #bfe0e6 at 0.7 with one white glint stroke;
  bottom: the lever, a white T-handle #f6f3ec (bar 0.09 x 0.022 x 0.022 on a 0.05 stem), pivot 0.04 above the
  bar. Param `pull` 0..1 swings the stem down 0..70 degrees (bar from y 0.70 to y 0.61, 0.04 out from the plate).
  Grip point (frame A) at pull 0: (3.45, 0.70, 0.13). Two screw dots, nothing written.
- Bell: a red gong dome #c4232a (r 0.12, 0.07 deep), dark centre boss #2a2a30 r 0.02, on a black back plate
  0.10 x 0.16, with a striker arm (0.09 long, steel ball r 0.012) at its lower left. Param `ring` 0..1: the arm
  swings +-7 degrees at 16 Hz (sin of clip time), the dome trembles 1.5 mm at 32 Hz, both x `ring`. No sound lines.

### 1.5 Sky, lamp, light (night)
- Dome, unlit: zenith #141a45, 45 degrees up #262a6c, horizon #57408a. 140 stars (hashed, above 15 degrees, 2 sizes,
  #dfe6ff at 0.9 and 0.5), no moon, 3 thin cloud streaks #3a3a80 low on the left.
- Suggested look for the director: key (moon) from (-0.45, 0.8, 0.4), #8ea0dc; fill sky #3a3f7a, ground #2a2238;
  key : fill 1.5 : 1; shadows 45 %.
- Lamp: `streetlamp` as built. `fireblock` adds a painted pool on the cobbles, an ellipse 3.4 x 2.6 m centred
  (-2.2, 0.004, 2.3), #ffd27a additive, 0.38 in the middle to 0 at the rim, and ONE warm spot light at the lantern
  (#ffc46a, range 7 m, no shadow), both x param `lamp`. If `streetlamp` already carries a light, add none.
- Lights budget outside: lamp 1 + `facadefire` 1 + `blockfire` 1 = 3 at most; every window glow is emissive only.

### 1.6 Window lights
Each window has a fixed rank 1-17; a window is lit when rank <= round(`lights` x 17). Chip's window, the fire
window and the door (fanlight, door panes, stub lantern) are NOT ranked: they follow `chip`, `fireroom`, `lobby`.
Rank order (row/column): 3rd/-4.2, 2nd/4.4, 1st/-2.1, G/-4.2, 3rd/2.3, 2nd/-2.1, 1st/4.4, 3rd/0, G/4.4, 2nd/0,
1st/-4.2, 3rd/-2.1, 2nd/2.3, G/-2.1, 1st/2.3, 3rd/4.4, 2nd/-4.2 (17 in all).
- Warm evening (panels 01-05): `lights` 0.75, `chip` 1, `lobby` 1.
- Payoff (panel 16, the story's "dark and whole"): `lights` 0.17 (3 lit: top left, 2nd right, 1st left of Chip),
  `chip` 0.25 (a lamp left on), `lobby` 1 (the open door spills light on the crowd), `lamp` 1.
- Fade: a window's emissive follows its own 0.25 s ramp when its state flips (a function of `lights`, not time:
  lit amount = clamp((lights x 17 - rank + 1) x 4)).

## 2. INSIDE (prop `firelobby`, ONE prop: lobby + stair + first-floor hallway; panels 06-10)

One connected piece, so Spud runs door -> stairs -> hallway in one take. Frame B, metres.
| Thing | Where | Size |
|---|---|---|
| Lobby floor | x -2.5..2.5, z 0..-7.2, y 0 | tiles as the door stub (0.30 m, diagonal) |
| Lobby ceiling | y 5.2 | one pendant lantern at (-0.6, 4.3, -3.0), glass #ffe6b0 |
| Front door (inside face, dummy, shut) | x -0.55..0.55 on the wall z 0 | fanlight above, as outside |
| Stair | x 0.9..2.5 (against the right wall), foot at z -2.4 | 16 risers 0.14, treads 0.30: top y 2.24 at z -7.2 |
| Banister (left side of the stair, x 0.9) | newel post 0.12 x 0.12 x 1.0 at the foot, rail 0.75 above the nosings | 16 turned balusters, wood #6b3f2a |
| Back wall | z -7.2, x -2.5..0.9, y 0..5.2 | wainscot to y 1.0 |
| LOBBY CLOCK | centre (-0.9, 3.6, -7.17), faces +z | prop `lobbyclock`, r 0.45 |
| Side table + plant under the clock | (-1.4, 0, -6.8) | table 0.9 x 0.4 x 0.7, fern to y 1.3 |
| Hall mouth (top of the stair) | x 0.9..2.5, y 2.24..4.44, z -7.2 | |
| Hallway | x 0.9..2.5, z -7.2..-15.2, floor y 2.24, ceiling y 4.44 | runner carpet 1.0 wide #7a3038 |
| Hallway doors (0.95 x 2.0, dark wood #4a2f27) | right wall x 2.5 at z -10.0 (THE NEIGHBOUR'S) and -13.4; left wall x 0.9 at z -11.7 | brass knob, no number plate |
| Neighbour's room stub | x 2.5..4.1, z -10.9..-9.1, y 2.24..4.44 | wallpaper #c9b08a, warm |
| Wall lamps | two sconces, left wall, z -9.0 and -13.0, y 3.9 | emissive #ffd9a0, no point light |
| Framed pictures | 2 on the left wall, 0.4 x 0.5, y 3.5 | blank landscapes |

- The neighbour's door: hinged on its far edge (z -10.475), opens INTO his room. Param `ndoor` 0..1 = 0..90
  degrees; the crack of panel 09 is `ndoor` 0.30 (27 degrees: a 0.43 m gap at the stair-side edge).
  Anchors: SPUD_KNOCK (1.95, 2.24, -9.9), NEIGHBOUR_STAND (2.95, 2.24, -9.75), STAIR_FOOT (1.7, 0, -2.2),
  STAIR_TOP (1.7, 2.24, -7.5), WATCH_LANDS (0.6, 0, -1.6) on the lobby tiles.
- Colours: walls #d9c7a3 above a wainscot #a88a63 (lobby) / #c4b08c (hallway); skirting #6b3f2a; stair treads
  stone #a79f94, risers #8a8279, nosing line lighter #c2bbae; ceiling #e9dcc0.
- Lights: ONE warm point light in the lobby (the lantern, #ffd9a0) and ONE in the hallway at (1.7, 4.1, -11),
  both x param `lit` (default 1). The stub room is emissive only. Budget inside: these 2 + `stairfire` 1.
- `lobbyclock` (new; `wallclock`'s hands are fixed at build, so it can't be reused): `wallclock`'s look at r 0.45:
  dark wood rim #4a2f27 0.06 wide with a thin brass inner ring #c9a24a, cream dial #f4ecd8, 12 tick marks (the 4
  quarter marks 0.07 long, the rest 0.04), NO numerals, black hands (hour 0.24 x 0.030, minute 0.37 x 0.020),
  a brass centre cap. Param `minutes` (minutes after 12:00, any number; minute hand = minutes / 60 turns, hour
  hand = minutes / 720). A hand jump under 45 degrees does not read at 360 px: see open question 1.

## 3. FIRE THAT RUNS BACKWARD (props-firerewind.js)

One rule for all four kinds: every position, size, flicker and alpha is f(`time`, the other params). Nothing reads
the clip time. Tween `time` forward at 1 s/s to burn, backward at 3 s/s to rewind, hold it to freeze. Periodic
motion is written as fract(time / period_i + phase_i), so it has no start and runs either way. Seed every param
with a dur-0 `set` at clip 0 (the first tween of an unseeded key jumps; propState's own `time` default is 2.75).
Palette (the `flames` prop's four, kept): #ff5a1f, #ff8a2a, #ffc23d, #ffe27a; core #fff3c4. Smoke: body #5a5560,
shade #3b3742, lit underside (fire side) #a8623a. Embers #ffb23d to #ff5a1f.
Flame tongue (shared build, taken from `flames` in props3d.js and `firesmoke` in props-city.js): a flat tapered
leaf, MeshBasic, opacity 0.88, depthWrite off, bent by 2 travelling sine waves (up the tongue, 2.2 and 3.7 cycles
per second of `time`, amplitude 12 % and 6 % of its length), its length breathing +-18 % at 1.3-2.1 Hz (hashed).
Inner tongues are paler and taller. All tongues of one prop are ONE instanced mesh; so are puffs, embers, shards.

### 3.1 `facadefire` (panels 01-03, 11, tag). Origin: frame A (0, 1.15, 0), the fire window's sill, facing +z
Params: `time` (s), `grow` 0..1, `curl` 0..1, `low` 0..1. Spec: `burstAt` (s, in `time` units; default 10.8).
| grow | What shows |
|---|---|
| 0 | nothing; glass whole and clean; room dark |
| 0..0.15 | room glow rises (emissive back wall #ff8a2a 0 -> 1.2), 8 tongues 0.3-0.6 m INSIDE behind the glass |
| 0.15..0.5 | 6 tongues out of the open transom, 0.25 -> 0.7 m, leaning up the wall; smoke streams start thin; soot begins |
| 0.5..0.85 | transom tongues to 0.9 m; 9 lick tongues climb the brick arch; smoke band full; embers on |
| 0.85..1 | lick tips reach y 2.88 (frame A), 7 cm under Chip's sill top, never higher; flame light full |
- Glass, `time` < burstAt: two whole panes with a soot veil (#2a2024, alpha 0.45 x grow) and the fire seen
  through them; from burstAt - 0.10 s three crack lines grow across each pane (white #f2f6f8, 2 px at 1080).
- Glass, `time` >= burstAt (tau = time - burstAt): each pane is 18 shards cut from a fixed jittered 3 x 6 grid
  (so at tau 0 they tile the pane exactly); 36 in all, 0.05-0.16 m, #cfe6ee at 0.55 with a white edge. Shard i:
  p = p0 + v tau + 0.5 g tau^2, g -9.8; v out along +z 2.4-5.2 m/s, sideways +-1.6, up 0.2-2.2 (hashed); spin
  3-9 rad/s about a hashed axis. It lands on the pavement (frame A y 0.006) inside x -1.4..1.4, z 0.4..2.7,
  stops dead and lies flat (no bounce); rotation frozen at landing. All down by tau 1.1. Backward, they lift
  off, fly in and re-seat, the cracks close. Shards are ghost: they pass through cast and props.
- Burst bulge: for tau 0..0.45 the mouth widens from the transom to the whole opening (14 more tongues, 0.6-1.3 m,
  22 out of the window in all) and every tongue's length x (1 + 0.35 x bump(tau / 0.45)). After that the wide
  mouth stays. All of it x smooth(grow).
- Clear of Chip: no tongue, ember or puff enters the box x -0.80..0.80, y 2.90..4.35, z > -0.1 (frame A): his
  window and 15 cm round it. Lick tongues at |x| < 0.80 stop at y 2.88; the two outer ones (|x| 0.85-1.0) may reach
  y 3.5 beside the frame.
- Smoke: 16 puffs (soft discs, 2 cel tones, alpha 0.8) in two streams. Each leaves the transom, goes up one side
  of Chip's window on the line |x| = 0.95 -> 1.15, turns in over his window head and joins a band y 4.40..5.3,
  x -1.6..2.6, drifting +x and thinning out by y 6.5. Size 0.35 -> 0.95 m along the path, life 2.6-3.6 s, alpha
  fades in over the first 10 % and out over the last 25 %. `low` 0..1 brings the band's underside from y 4.40 down
  to y 3.95: it then crosses the upper sash only, above Chip's leaves (top y 3.6). Never lower.
- Embers: 40 sparks (2-3 cm, additive) rising from the mouth through x -1.2..1.2, y 2.4..6, 0.8-1.6 m/s with a
  0.15 m sideways wobble, life 1.5-2.5 s; skip the Chip box.
- Soot: a painted scorch on the brick over the window (a soft fan 1.9 wide, up to y 2.85), #1e1719, alpha
  0.55 x smooth(0.15, 0.9, grow). It goes back to 0 with grow (the rewind un-scorches the wall).
- Light: ONE point light at (0, 0.9, 0.9) from the origin, #ff8a2a, range 7 m, intensity grow x (0.8 + 0.2 x
  flicker(time)), flicker = 2 summed sines of time (7.3 and 11.9 Hz), no shadow. It lights Spud and Chip's face.
- `curl` (the tag, panel 16; needs grow 0): one thin wisp from the transom's open edge, 5 small puffs 0.06 -> 0.22 m
  rising 0.9 m and bending +x, pale #b9b6c4 at 0.7 x curl so it reads on the dark window. Same `time` rule.

### 3.2 `blockfire` (panel 11, 19.0-23.5 s). Origin: frame A origin
Params: `time`, `spread` 0..1. Window fires (inside glow + 6 tongues out of the top third + 2 puffs each) switch
on in this order as spread rises, each over 0.15 of spread: G/-2.1, 1st/-2.1, 1st/2.3, 2nd/0, 2nd/-2.1, G/-4.2,
2nd/2.3, 3rd/0. Never Chip's window. The two beside it (1st/-2.1, 1st/2.3) keep their tongues inside the frame
and lean away from him; 2nd/0 above him burns inside only (glow, no tongues out), so nothing hangs over his head.
Roof smoke: 12 big puffs (1.2-2.2 m) along y 9.5..13, drifting +x. Embers 30. ONE point light (0, 4, 2.5),
#ff7a2a, x spread. With spread 1 and `facadefire.grow` 1 Chip's window stays a clean warm rectangle with his
dark shape in it, a smoke frame above and at both sides, a 0.15 m clear margin all round.

### 3.3 `stairfire` (panels 06, 07, 10). Origin: frame B (1.7, 0, -2.4), the middle of the stair's foot
Spec: steps 16, rise 0.14, tread 0.30, w 1.6, `at` (s, in `time` units: the moment it bursts; default 10).
Params: `time`, `grow` 0..1, `front` 0..1 (how far DOWN the flight the fire has rolled: it burns from the top
landing down to step 16 - 16 x front; 0 = the landing and top 2 steps only, 1 = to the foot).
- Before `at` (tau < 0): nothing. tau 0..0.35 (the burst): every tongue's length x (1 + 0.6 x bump(tau / 0.35)),
  a core flash #fff3c4 at the hall mouth 1.4 m across fading over those 0.35 s, 14 embers thrown out and down the
  stair. No ring, no star. After that it burns at grow.
- Body: 3 tongues per burning step (0.5-1.1 m x grow) + 8 on the landing (to 1.5 m) + the rolling head at the
  front: 5 wide tongues 0.7-1.0 m leaning 25 degrees downstairs and a low flame lip 0.15 m tall across the tread.
  61 tongues at most. A glow strip on each burning tread (#ff8a2a additive 0.5).
- Smoke: 12 puffs up from the landing to the ceiling (y 5.0), then +x along it. Above y 3.0 no puff is drawn at
  frame B x < 0.2: the clock (x -1.35..-0.45) stays clear in every frame.
- Light: ONE point light 0.8 m above the front step, #ff8a2a, range 8 m, same flicker law.
- The director keeps Spud at least 1.0 m (3 treads) below the front step. Suggested: loop 2 `front` 0.25 held;
  loop 3 `front` 0.1 -> 0.8 over 2 s as it rolls after him.

### 3.4 `floorsmoke` (panels 08, 12.2-16.5 s)
Origin: the middle of spec.box [w, d] on the floor (default [1.6, 8]: the hallway; [5, 7.2] for the lobby).
Params: `time`, `level` 0..1 (the layer's top: 0.36 m x level; ankle = 0.3, waist = 1), `drift` (m/s along +z of
the prop, default 0.25, its speed in `time`). Spec n (default ceil(w x d x 2), cap 40).
- A flat base sheet (alpha 0.7, soft edges 0.3 m in from the box) at 0.6 x the top height, and n billow puffs
  (0.35-0.6 m wide, 0.2-0.36 tall, rounded cumulus tops) sitting on it, each sliding along the drift and looping
  over the box length, bobbing 3 cm, fading over the last 0.5 m at each end. Colours: top #b9b6bd, body #8d8a94,
  underside #5f5c68. Puffs within 0.25 m of a wall may stand 25 % taller; none anywhere tops 0.45 m: Spud's
  mouth is at about 0.42 m, so the director keeps `level` <= 0.8 where a face is in frame at body height.
- No light. It takes the room's light (not emissive), so `stairfire`'s glow warms its near side.

### 3.5 The rewind look (panel 03): REUSED, no engine addition expected
Use the pause look of engine/shared/pause.js (docs/STORYBOARD.md "Pause time"):
`"pause": [{ "from": 2.3, "to": 3.1, "keep": ["spud"], "origin": "spud", "look": "grey", "wave": 0.12,
"back": 0.25, "grade": { "sat": 0.10, "bright": 0.90, "contrast": 0.95 }, "props": [{ "id": "<the watch>" }] }]`
and the same for the two short rewinds (0.5 s each, shots 8 and 14). Spud and his watch keep full colour, the
world drains to cool grey-blue, colour floods back from Spud over 0.25 s into the calm of panel 04.
Why it fits: in a pause the world clock stops (Chip holds at the glass, the lamp's flicker and any looping prop
freeze), and ONLY what the director tweens moves: `time`, `grow`, `low`. So the fire and the glass are the one
thing running backward in a frozen grey world. That is why 3.1-3.4 never read the clip time.
Check, T2 step 1 (blocks the rest): a `set` tween of a prop param must still run inside a pause window. If it is
frozen there, STOP and report: SENIOR BUILDER job, the smallest change being that prop param tweens always run on
clip time (only prop idles and vfx use worldTime), with a golden run. No other engine change is asked for.
Rewind numbers for the director: 2.3 -> 3.1 s: `time` 12.3 -> 9.9 (3 s/s; the glass re-seats at clip 2.80),
`grow` 1 -> 0 (ease-in, so the flames hold their size for the first 0.25 s, then get sucked in), `low` -> 0.

## 4. NEIGHBOURS

### 4.1 Crowd: `streetpotato` with two new dresses (props-neonstreet.js, same skin #e2a95c as Spud)
- `dress: "pyjamas"`: a buttoned top and trousers in one colour with vertical stripes 0.03 m wide every 0.06 m in
  spec.stripe (default: the colour x 0.72), a small flat collar, 3 buttons.
- `dress: "bathrobe"`: a wrap robe to 0.06 m above the feet, a shawl collar in spec.trim (default colour x 1.18),
  a belt with a knot and two hanging ends 0.10 m.
- `hat: 2`: a nightcap (a soft cone 0.22 long, bent over to one side, pompom, hides the leaf) in spec.capColor.
- New param `angry` 0..1 (default spec.angry 0): brows (two dark strokes) tilt in 18 degrees and drop 0.01, the
  smile turns to a frown; at > 0.5 one arm is raised 60 degrees and shakes +-8 degrees at 5 Hz (clip time, as `sway`).
- The crowd: 7 props (panel 15 shows 5, panel 16 a back row). h / dress / colour / hat:
  0.90 pyjamas #7f9fd0 0 · 0.78 bathrobe #d9c7a3 2 (cap #a85a5a) · 0.86 pyjamas #9fc3a0 2 (cap #9fc3a0) ·
  0.74 bathrobe #8a7fb4 0 · 0.92 bathrobe #5f7f8f 0 · 0.80 pyjamas #e0b3a0 1 · 0.84 bathrobe #b7a1c8 2 (cap #7a6a94).
  None in teal (Spud), yellow (Chip) or lilac stripes (the grumpy neighbour). `angry` 0.8 on 5, 0.3 on 2.

### 4.2 The grumpy neighbour: a cast character, characters/what-if/grumpy-neighbour.json
He speaks, opens a door and jabs a glove, so he needs the potato rig (as viking-old.json is a variant file).
- Body: color #e2a95c, height 0.92, width 0.80, depth 0.70, lump 0.04, seed 53. Limbs #6b4a2b, width 0.032.
- Face: default "grumpy" (a new neutral: curve -0.35, browL and browR -0.45, tilt 0, eye 0.8: half-lidded);
  iris #4a3a2a; cheeks #f08a8a at 60 %; brow #8a8078, thick 1.5, arch -0.02; two short lines under each eye.
- Sprout: hidden under the curlers (placement as the hat variants do; one leaf tip may poke out behind).
- Costume type `bathrobe` (new, costumes-everyday.js, built like `hoodie` with the bell drape of costumes-core):
  robe #b79ac8 with vertical stripes #8a6aa6 0.035 wide every 0.08 m, shawl collar #cdb6da 0.06 wide crossing
  left over right, belt #9a7ab4 0.045 tall with a knot at the front and two ends 0.12 m, hem 0.05 above the
  floor, sleeves to the wrists with a turned cuff #cdb6da. Slippers: pink fluffy #e9a9bd over the feet.
- Curlers: 8 pink rollers #e58fb0, each a cylinder 0.075 long, r 0.032, with 3 darker ring lines #c76a93 and a
  dark clip dot, in two rows of 4 across the top of the head, axes along x, following the head's curve. A wisp of
  grey hair #b9b3ad wrapped round each (a paler stripe). They must read as curlers at 360 px: pink, round, a row.
- Voice: the director's proposal to Jonny (low, slow, creaky); not designed here.

## 5. COLOUR SCRIPT (dominant / what to set)
| Clip time | Dominant | Set |
|---|---|---|
| 0.0-2.3 loop 1 peak | fire orange #ff8a2a against sky #262a6c; brick glows #c9603a near the fire | grow 1, low 0 -> 0.6 in shot 2, lights 0.75, chip 1 |
| 2.3-3.1 rewind | grey-blue world, Spud teal + gold | pause grey; time back 3 s/s |
| 3.1-5.0 calm | warm windows #ffd27a, lamp pool, blue brick shade #5e2f44 | grow 0, sash 1, lights 0.75 |
| 5.0-12.2 loop 2 | lobby cream #d9c7a3, then orange from the stair | stairfire grow 1, front 0.25; clock earlier |
| 12.2-19.0 loop 3 | grey smoke over tile, then orange down the stair | floorsmoke level 0.5 lobby, 0.8 hallway |
| 19.0-23.5 the low | the most fire of the clip; Chip a dark shape in a clean warm window | grow 1, spread 1, low 0.4 |
| 27.5-37.0 final | cool blue block, 3 warm windows, lamp pool, the red box and bell | grow 0, lights 0.75 -> 0.17 at 33.0, ring 1 from the pull to 33.0 |
| 37.0-39.0 tag | dark window, one pale wisp | curl 0 -> 1 over 1 s |

## 6. BUILD TASKS

Budget for all (CPU, SwiftShader): point/spot lights 3 outside, 3 inside, none casting shadows; at most 4
see-through layers over any pixel; one instanced mesh per particle family; counts as written (tongues <= 61 per
prop, puffs <= 40, embers <= 40, shards 36); no render targets, no depth reads, no refraction. Report the render
time per frame of the heaviest still. Every proof still is also shown shrunk to 360 px wide.

T1, the set (new file engine/page/props-fireblock.js; VOCAB.md lines; owner of nothing else):
1. `fireblock` (section 1). Params: `sash` 0 (0..1), `door` 0 (0..1 = 0..100 degrees inward), `pull` 0 (0..1),
   `ring` 0 (0..1), `lights` 0.75 (0..1), `chip` 1 (0..1), `lobby` 1 (0..1), `fireroom` 0.15 (0..1), `lamp` 1
   (0..1). Spec: sky true, neighbours true. Solid for the checks: wall, steps, door leaf, box, planters, perch.
   Exports FIREBLOCK { the anchors of 1.1, the fire window and Chip window rectangles, the lever grip point }.
2. `firelobby` (section 2). Params: `ndoor` 0 (0..1), `lit` 1 (0..1). Solid: floors, stair treads, walls, doors,
   banister, table. Exports its anchors and the stair numbers (foot, rise, tread, steps, width).
3. `lobbyclock`. Spec r 0.45. Param `minutes` 610 (any number).
4. Places `streetlamp` and both `cobbles` as section 1.1 says in a demo storyboard; changes neither prop.
5. Proof stills, with grey stand-in boxes for Spud (0.76 x 0.88 x 0.66) and Chip (0.57 x 0.53 x 0.52):
   a. low wide from the pavement at (1.4, 0.45, 3.0) looking at (0.2, 2.6, 0): fire window, Chip's window with
      the Chip box on the perch (his box at least 300 px wide at 1080), lamp left; lights 0.75.
   b. the same with lights 0.17, chip 0.25: the block still reads as brick and windows, not a black shape.
   c. door + alarm box + bell from 2.2 m: the box reads as a red box with a white lever at 360 px; `pull` 0 and 1
      side by side; `door` 0 and 1 (the stub hall shows, no void).
   d. `sash` 0 and 1 with the Chip box at CHIP_LEAN.
   e. lobby from the door: stair, banister, clock (at least 200 px across at 1080), two clock settings 60 minutes apart.
   f. hallway from the stair top, `ndoor` 0 and 0.30 with a stand-in in the stub room.

T2, fire + glass + smoke + grade (new file engine/page/props-firerewind.js; VOCAB.md lines; needs T1's exports):
1. FIRST the check of 3.5 (a prop tween inside a pause). If it fails: stop, report, senior builder.
2. `facadefire`: params `time` (seed it), `grow` 0 (0..1), `curl` 0 (0..1), `low` 0 (0..1); spec burstAt 10.8.
3. `blockfire`: params `time`, `spread` 0 (0..1).
4. `stairfire`: params `time`, `grow` 0 (0..1), `front` 0 (0..1); spec at 10, steps 16, rise 0.14, tread 0.30, w 1.6.
5. `floorsmoke`: params `time`, `level` 0 (0..1), `drift` 0.25 (-1..1); spec box [1.6, 8], n.
6. Proof:
   a. `facadefire` stills at `time` 10.0, 10.75, 10.85, 11.0, 11.4, 12.3 (grow 1) from still T1-a: cracks, shards
      in the air, shards on the cobbles; the Chip box untouched by flame or smoke in all six.
   b. grow 0, 0.15, 0.5, 0.85, 1 at time 12.3, and `low` 1: the band stays above the Chip box's top.
   c. THE REWIND: a 12 fps strip of clip 2.0-3.4 s (time 12.0 -> 12.3 forward, then 12.3 -> 9.9 and grow 1 -> 0
      over 2.3-3.1, pause grey on, a teal stand-in as keeper) at 360 px: it must read as the same fire going
      back in (glass rising and re-seating visible in at least 3 frames), not as a fade or a glitch.
   d. the same frame rendered twice in a different order is pixel-identical (time 11.0).
   e. `blockfire` spread 0.5 and 1 from a street wide at (0, 1.2, 9): Chip's window clean with the box dark in it.
   f. `stairfire`: time at + 0.05, + 0.2, + 1.0 at front 0.25; front 0.1, 0.5, 0.8; the clock unobscured in all.
   g. `floorsmoke` level 0.3, 0.8, 1 in the hallway with the Spud box: the top never above 0.45 m.
   h. `curl` 1 at grow 0 on the dark payoff block (T1-b): the wisp visible at 360 px.

T3, neighbours (edits engine/page/props-neonstreet.js and engine/page/costumes-everyday.js, new
characters/what-if/grumpy-neighbour.json; run qa/golden.mjs: existing streetpotato and cast pictures unchanged):
1. `streetpotato`: dress "pyjamas" | "bathrobe", spec stripe, trim, capColor, hat 2, param `angry` 0 (0..1).
2. Costume type `bathrobe` + curlers + slippers, face neutral "grumpy" (section 4.2).
3. Proof: the 7 of 4.1 in a row next to a Spud stand-in, angry 0 and 0.8, walking strip (walk 0, 0.14, 0.28,
   0.42): feet don't slide; the grumpy neighbour front, 3/4 and side, next to Spud, plus his head through a
   0.43 m door crack; curlers and stripes read at 360 px; the skin matches Spud's side by side.

## 7. OPEN QUESTIONS (defaults in force unless the director says otherwise)
1. Lobby clock steps. The story's loops are about a minute apart, but a 1-minute hand move is 6 degrees and does not
   read on a phone. Default: 10:10 (loop 1, never seen), 10:00 in shot 7, 9:50 in shot 9 (60 degrees a loop).
2. Fire window before the fire: dim (fireroom 0.15), not the cosy lit room of panel 04. Default: dim.
