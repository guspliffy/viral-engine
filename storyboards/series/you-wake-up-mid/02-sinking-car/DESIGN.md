# EP02 "mid sinking car": DESIGN of the three new looks (12 Nov 2026)

Target: Jonny's board.png, panels 01-12, and OUTLINE.md. This file gives the numbers; builders build exactly these.
Reused, not designed here: hatchback rig, carseat, steer, bridgeend, eyelids, rain streaks, splash, bubbles, bedroom.
Everything is a function of story time and keys (no Math.random, no clock). All water, glass, light, foam and fog
is `userData.steam` (see-through for the contact checks) and casts no shadow.

World frame (the whole clip): x right, y up, z = the car's heading, metres. THE LAKE SURFACE IS y 0. The origin is
the impact point. The car heads +z; the driver (Spud) sits at +x, so his window faces the near shore (+x).
Nothing is farther than 280 m from the origin, so the 300 m far plane holds without farClip.

## 1. STORM LAKE WORLD (set "stormlake", panels 01, 03, 10-12)

### 1.1 Layout (plan, metres)
| Thing | Where | Size |
|---|---|---|
| Near bridge stump (the car leaves it) | x -4.5..4.5, z -100..-14, deck top y 14.0 | 9.0 wide, 86 long |
| Its broken lip | z -16.5..-14 | jagged over the last 2.5 m |
| Gap (the snapped middle span, sunk, not drawn) | z -14..+30 | 44 m |
| Far stump (seen ahead in panel 01) | z +30..+200, deck top y 14.0 | same section, its lip at z +30 |
| Piers | z -20, -50, -80 and +36, +66, +96, +126, +156, +186 | 30 m spacing |
| Near shore, the bay beside the bridge | land where x > 30 + 5 sin(z / 19) | waterline 27-30 m from the impact |
| Abutment shore | land where z < -95 + 4 sin(x / 23) | the bridge meets land at z -100 |
| SHORE spot (panel 12, the three lie here) | centre (34.5, 0.40, -6) | level patch 4.0 x 2.5 m, slope 1:12 |
| Far shore | z +200 | hills behind it, see 1.5 |
| Lake bed | y = -clamp((30 - x) * 0.27, 0, 7.5), noise +-0.3 m at 4 m scale | 7.5 m deep at the car |

The fall: deck top 14 m above the water, lip at z -14; a car leaving at 8.3 m/s (30 km/h) lands at z 0 after 1.7 s.

### 1.2 Bridge
- Deck: road slab 9.0 x 0.5 m over a box girder 5.0 wide x 1.4 deep (underside y 12.1). Parapets 0.9 m tall, 0.25 m
  thick concrete with one steel rail (pipe 6 cm, y +0.15 above the parapet). Asphalt #3a3d40, wet sheen band
  #5a6266 along the middle 3 m; centre dashes 3.0 x 0.15 m every 9 m, #c9c6b8.
- Piers: wall piers 5.0 (x) x 1.6 (z) m from the bed to y 10.9, hammerhead cap 8.0 x 2.0 x 1.2 m on top.
- Concrete: lit #9a9d98, shade #5f6668, deep shade (underside) #454c4e. Rain streaks: dark runs #454c4e under the
  parapet, 0.4-1.5 m long, 8-20 cm wide, one per 1.2 m. Piers: waterline stain #3b4340 from y 0 to 0.8, algae
  band #44553a from y 0 to 0.3. Ink lines on every hard edge; hatching on the shade faces only.
- Both broken lips: jagged edge (5 teeth 0.3-0.9 m deep), 9 rebar rods (4 cm thick, 0.6-1.8 m long, bent down
  20-70 degrees, #3a2f2a), 2 hanging concrete lumps 0.4-0.7 m on rebar, painted cracks running 4 m back, the
  +x parapet bent outward 30 degrees over the last 3 m, the steel rail torn and hanging 2 m.
- The reused `bridgeend` prop: if its deck section differs from the above, bridgeend's width and thickness win and
  the set copies them; `spec.lip: false` leaves the near lip (z -17..-14) out so the prop can stand there.

### 1.3 Sky, light, rain
- Sky dome r 270 m: zenith #2b3238, 40 degrees up #4a545b, horizon #7c878a (the palest band sits behind the hills
  so they silhouette). 5 painted cloud bands, darker #23292e undersides, brush hatch strokes; clouds slide
  +x at 0.4 degrees/s. One paler break (#9aa5a8, 25 degrees wide) at azimuth -37 degrees from +z toward -x, 60 up.
- Key light: direction TO the light (-0.30, 0.87, 0.40) (high, from the far shore, slightly from -x), #c9d3d6.
  Fill: hemisphere sky #6f7d86, ground #3c4a44. Key : fill = 2 : 1. Shadows soft and weak (darkness 35 %).
- Rain (the reused streak prop, these numbers): about 160 streaks in frame between 2 and 14 m from the lens,
  each 0.35 m long, falling 9 m/s, tilted 12 degrees toward +x (the wind), #c9d4d6 at 0.35 opacity, 3 px wide near
  to 1.5 px far (at 1080 wide). Plus the set's own rain veil: 3 upright streak cards that follow the camera at
  20, 40, 80 m, opacity 0.25, 0.18, 0.12, texture scrolling down 9 m/s, same tilt.
- Mist: a band on the water at the far shore, 6 m tall, #8a9698 at 0.5, soft top.

### 1.4 Water surface (one plane y 0, 600 x 600 m; exports STORMLAKE.waveAt(x, z, t))
From ABOVE (camera y > 0):
- Waves: 4 sine waves, wind toward +x. Amplitude / wavelength / heading from +x / speed:
  0.22 m / 9 m / 20 deg / 3.7 m/s; 0.14 / 5 / -15 / 2.8; 0.08 / 2.6 / 50 / 2.0; 0.04 / 1.2 / -40 / 1.4.
  Real vertex displacement only within 40 m of the camera (0.5 m grid); beyond that flat, painted bands only.
  Amplitude x clamp(depth / 3 m): 5 cm lapping at the shore.
- Cel colour, 3 tones by wave slope: troughs #2f403d, body #4a5d57, lit crests #7d8f88. Far water (beyond 80 m)
  fades to #6c7b7a. Ink: a broken 2 px line #1c2a28 on the crest of the two big waves within 15 m only.
- Foam #dfe8e4: whitecap streaks where the height is over 70 % of the maximum, 0.3-1.2 m long, 8-15 cm wide,
  drawn along the wind, about 6 % of the area; a 0.3 m foam collar round each pier and along the waterline.
- Rain rings: one per 1.2 m cell every 0.9 s (phase hashed per cell), radius 0 -> 0.25 m in 0.45 s, line 2 cm,
  #c9d6d3, opacity 0.5 -> 0; only within 25 m of the camera.
- Key `hole` [x, z, yaw, halfL 1.60, halfW 0.52]: the surface is not drawn inside this box (the car's footprint,
  3 cm inside its skin), from above and from below, so the lake never cuts through the cabin. Tweened.
From BELOW (camera y < 0), the same plane's underside, a bright rippled ceiling:
- A bright window straight above the camera, shifted 1.5 m toward the key light: #e9f7e4 within 3 m radius,
  falling to #7fc09a at 8 m radius; outside it a dark mirror #1f4a3c.
- Ripple net over all of it: bright lines #f4fbf0 6-10 cm wide in cells 0.5-1.2 m, drifting +x at 0.6 m/s and
  bending with the 4 waves; in the mirror part the lines are #2f6b54.
- Rain from below: a bright dot 6 cm for 3 frames at each ring's birth.
- The ceiling takes only half the fog of other things (it must still glow from 7 m down).

### 1.5 Far hills and shores
- Hills are PAINTED CARDS, a full ring (they are behind every outside camera): 3 curved ribbons centred on the
  origin at 160, 210 and 260 m; heights 22, 45, 70 m (ragged tops, +-30 %); colours #26352f, #3a4a47, #56656a.
  Ring 1 has a fir-tooth top edge (teeth 2-4 m wide, 3-7 m tall) and vertical hatch strokes; rings 2, 3 plain.
- Abutment shore (z < -95): a 3 m earth bank #3a332b and a row of 14 fir cards 9-13 m tall, #1f2c27, at z -110..-130.
- Bay shore (x > 30), real 3D, this is panel 12 and the 27 s swim: ground y = (x - shoreline) / 8, up to 3 m, then a
  bank. Mud lit #4a3f33, shade #2e2822, wet sheen band #6b6659 within 1.5 m of the waterline, 6 puddles
  0.3-0.8 m #5d6a68. 14 rocks 0.3-1.4 m (#5c6162 lit, #3a4042 shade, hatching), 5 of them in the shallows.
  9 reed clumps within 6 m of SHORE, none on the level patch: 25-40 blades each, 0.9-1.6 m tall, 1.5 cm wide,
  #6d7a45 lit, #3f4a2c shade; every third blade a cattail head 12 x 2.5 cm #4a3323; leaning 8-15 degrees toward +x,
  swaying +-4 degrees, period 1.7 s, phase hashed. 30 instanced 3D firs 10-14 m (#22302a) 18-45 m behind the waterline.

### 1.6 How the outline's cameras see it (starting points; fit with qa/camfit.mjs)
| Shot | Camera pos -> look, vertical fov | In frame |
|---|---|---|
| 0.0 POV, panel 01 | in the car at about (0.3, 8, -7), car pitched 30 down, yawed 12 toward -x; fov 55 | far stump and its pier left of centre 37 m ahead, lake rushing up, hill ring 1 |
| 2.5 impact, panel 03 | (7, 1.4, 14) -> (0, 4.5, -2), fov 55 | car and spray low, near lip upper right 30 m behind, pier z -20 under it, hills behind |
| 4.5-18 cabin | inside the car | only sky, rain, water through glass (section 3) |
| 19.0 panel 10 | (4.5, -2.0, 1.2) -> (0.4, -1.6, 0), fov 50 | driver's side of the car 4 m away, ceiling in the top fifth |
| 21.5 at the window | (2.2, -3.0, 0.3) -> (0.5, -3.1, 0), fov 45 | the window opening 1.7 m away |
| 24.0 panel 11 | (5.5, -4.0, 2.0) -> (0, -2.8, 0), fov 65 | car at the bottom 6 m away, swimmers middle, ceiling top quarter |
| 27.0 surfacing | (9, 0.35, 8) -> (2, 0.2, 1), fov 45 | three heads, near stump and pier z -20 behind them |
| 27.5-30 swim | (20, 0.6, -2) -> (34, 0.5, -6), fov 40 | heads from behind, reeds and mud ahead |
| 30.0 panel 12 | (37.5, 0.9, -5) -> (33.5, 0.45, -6.5), fov 50 | the three on the mud; bridge side-on 35 m away, its lip on the left |

## 2. UNDERWATER LOOK (part of set "stormlake"; panels 10, 11; 19-27 s)

Switches on by itself whenever the camera's y < 0 (spec `under: "auto"`); rain streaks, veil, sky are then hidden.

- Background (what an empty pixel shows), by the view ray's elevation: +30 degrees #3f8064, 0 #1f4a3c, -30 #12302a,
  -90 #081714 (above +30 the ceiling of 1.4 covers it). Darker with camera depth: x (1 - 0.06 per metre), not below 0.6.
- Fog: fraction f(d) = 1 - exp(-(d / 5.4)^1.7), d = distance from the lens in metres:
  1 m 0.05, 3 m 0.31, 6 m 0.70, 10 m 0.94, full (1.0) from 13 m. So the car reads at 3-6 m and is a shadow by 10 m.
  A thing fades into the background colour of its own pixel. Allowed fallback if that costs too much: one fog
  colour #1f4a3c for objects, the gradient only on the background.
- The lake bed: mud #1a2a22 with 20 dark stones and 12 weed tufts 0.4 m; only ever seen through 70 %+ fog.
- Light shafts: 7. Each = 2 crossed cards from y 0 down to y -6. Top width 0.5-1.4 m (hashed), 1.3x wider at the
  bottom. They fan out from the bright window: lean 14 degrees away from the key light on average, each shaft
  -10..+25 degrees off that. Colour #bfe8cf, additive, two flat steps (core 0.16, a halo of 30 % extra width at
  0.08), opacity falling to 0 at y -6. Sway +-3 degrees, period 7 s; brightness +-25 %, period 2.3 s; phases hashed.
  Spread over a 10 x 10 m patch, at least 1.5 m apart, centred on key `shaftsAt` [x, z] (fixed per shot, a step).
- Silt: 1500 specks in a box 8 (x) x 7.5 (y) x 10 (z) m that wraps round the camera (2.5 per m3, hashed lattice).
  90 %: 3-8 mm, never under 2 px, #a9c9a8 at 0.35. 10 %: flakes 1.5 cm at 0.2. Drift 0.03 m/s toward +x,
  wobble 2 cm with a 4 s period. Specks fog like everything else.
- Bubbles (one look for all; prop `lakebubbles` if the reused `bubbles` cannot take rate and size):
  a clear ball, 2 px ring #dff5e8 at 0.8, fill #bfe8cf at 0.12, a white crescent highlight upper left.
  Rise speed v = 0.25 + 7 x diameter (m/s, diameter in m): 2 cm 0.39, 5 cm 0.60, 9 cm 0.88. Wobble sideways
  +-3 cm at 2.5 Hz; over 6 cm they flatten to 0.7 height and wobble. They vanish at y 0.
  - Car window: 45 a second from 19.0 to 22.0, falling to 12 a second by 24.0, 0 at 26. Diameters: 70 % 2-4 cm,
    25 % 4-6 cm, 5 % 7-9 cm. The column widens 0.15 m per metre risen. A second, thin stream (8 a second,
    1-2 cm) from the bonnet seam and each wheel arch.
  - Mouths: a burst of 5-8 bubbles of 1-3 cm every 0.8 s, 0.32-0.46 m/s, gone after 2.5 s.
  - Feet: 6 bubbles of 1-2 cm per kick.
- Headlights (prop `headbeams`, rides the rig, one per lamp, lamp positions read from car-hatchback.js): a cone
  4.5 m long, radius 0.08 m at the lamp to 1.2 m at the end (half-angle 14 degrees), #f2e9a8, additive, opacity
  0.38 x (1 - u)^2 along its length; an inner cone of half the angle adds 0.25. Lamp disc 16 cm, unlit #fff6c8,
  plus a halo sprite 0.5 m at 0.5. Beams are NOT fogged beyond their own falloff, so two pale discs still show
  through 6 m of murk (panel 11). Key `lamps`: 1.0 at 19 s, 0.8 at 24.0, two dips to 0.2 of 3 frames each at
  25.0 and 25.4, 0.15 at 26.5 (cones gone, two dots left), 0 at 27.
- House style underwater: ink lines STAY, same width, but line colour changes from black to deep green #0c2a22
  and lines fog with their object (none visible past 8 m). Hatching stays on the cast and the car within 5 m
  only, colour #0f3329 at 60 % of its normal opacity; never on water, fog, shafts or bubbles. Cel bands stay
  (2 tones + highlight). Grade on cast and car: multiply by #a8d8c0 at strength 0.55 at the surface, 0.75 at
  6 m down (skin stays yellow-gold about #c9c070, the car a dull brick #7a2f2a, Chip's hoodie #c9c24a).
  Top light: a thin rim #dff5e0 on upward faces. No caustics on bodies (cost).
- The car's fall (rig origin world y / nose-down pitch), for the storyboard: 4.5 s -0.45 / 3; 7.0 -0.70 / 5;
  9.0 -1.10 / 7; 11.5 -1.30 / 9; 13.5 -1.45 / 10; 16.0 -1.70 / 14; 19.0 -2.2 / 25; 21.5 -3.2 / 35; 24.0 -5.0 / 40;
  26.5 -7.0 / 20 (on the bed). Bob +-4 cm, period 2.3 s, roll +-2 degrees, period 3.1 s, until 16 s.
- Surfacing at 27.0 (no shot crosses the waterline with the lens):
  26.4-26.97 camera 0.6 m under, looking up 35 degrees at the three rising into the bright window.
  Frames 810-811: full-frame foam, #dfeee6 with 14 round bubble blobs 60-220 px, opacity 1.0 then 0.6.
  Frame 812 on: the 27.0 above-water camera. At each head: the reused `splash` (puff 1 over 0.3 s), a foam ring
  growing 0.6 -> 1.4 m in 0.5 s, and 3 ripple rings after it. Heads ride waveAt. The storm look of section 1 is back.

## 3. CABIN WATER + GLASS + BURST + HEADREST (props; panels 04-09; 4.5-19 s)

Car frame (HATCH): front +z, driver +x, L 3.3, W 1.1, belt (window sill) y 0.9, roof y 2.06, cabin z -1.42..0.8.
Assumed, the T2 builder checks them in car-hatchback.js and props-road.js: cabin floor y 0.32, seat cushion top
y 0.72, inner width +-0.50. If they differ, keep the story anchors below (feet, cushion, sill, chest, roof).

### 3.1 `cabinwater` (rides the rig)
- A surface that stays LEVEL IN THE WORLD while the car pitches (at 10 degrees the front footwell is 0.39 m deeper
  than the back seat: the front floods first). Drawn only inside the cabin's inner box (x +-0.51, z -1.44..0.95,
  in car space), from just under the surface down to the floor nothing is drawn: the surface is the look.
- Key `level` = the surface height in car-frame y at the cabin's middle (z -0.3):
  | Time | level | Reads as |
  |---|---|---|
  | 4.5 | 0.40 | round their feet (8 cm over the floor) |
  | 7.0 | 0.52 | ankles to shins |
  | 9.0 | 0.72 | at the seat cushions |
  | 11.5 | 0.82 | cushions under, panel 07 |
  | 13.5 | 0.90 | at the sill; the pane bursts |
  | 14.5 | 1.05 | the jet adds 15 cm a second |
  | 16.0 | 1.25 | Chip's chest, panel 09 |
  | 17.5 | 1.60 | level with the lake outside |
  | 19.0 | 2.06 | full (the surface is gone; the cabin is underwater look) |
- Colour, 3 cel tones by slope: troughs #1d312b, body #2e4a40, lit facets #55766a; opacity 0.85 from above
  (legs and seats under it show as dim shapes); from below (the 19-21.5 s air pocket under the roof, seen from an
  underwater camera) a silver mirror #9fc9b0 at 0.6. Key `dim` 0..1 multiplies the three tones down to 55 %
  (set to 1 when the dashboard dies).
- Slosh: across the car, amplitude 1.2 cm, period 1.1 s, wavelength 1.0 m; along the car 2.0 cm, 1.7 s, 2.2 m; plus
  ripple facets 0.25 m across. Key `agit` 0..1 multiplies the amplitude up to 3x (give 1 from 13.5 to 14.5).
- Where it meets things: the depth test cuts it against seats and bodies. On top, spec `rings`
  [{ x, z, rx, rz }] (car space, up to 8; default: 3 bodies and the 2 front seat backs): a foam line 1.5 cm wide,
  #cfdcd6 at 0.8, wavering +-1 cm with a 0.9 s period, and a dark line #14241f 1 cm outside it. A foam line of
  the same kind runs along all four cabin walls.
- Jets under the dashboard, key `hiss` 0..1 (1 from 4.5 s, 0 at 13.5): 3 flat fans (driver's pedal box x +0.30,
  centre x 0, passenger footwell x -0.30; source y 0.55, z 0.85), each 6 cm wide at the source, 12 cm at its end,
  0.35 m long, 2 cm thick, pointing back and 25 degrees down. Core #dfeee6, edge #9fc4b4, opacity 0.9,
  streak texture running 3 m/s. A foam patch r 0.18 m where each lands. Plus one dribble at the bottom of each
  front door (a sheet 20 cm wide, 1 cm thick, 0.15 m long). Once the level covers a source (from about 7.5 s) the
  fan is replaced by a boiling foam patch r 0.25 m over it with 6 bubbles a second (1-2 cm).

### 3.2 `carglass` (rides the rig): panes, rain, the lake outside, the burst
- Panes for the 4 side windows; the same outside-water treatment laid on the windscreen and the hatch glass.
  4 mm thick, shapes read from the rig's openings. Tint #9fb4b0 at 0.14. Edge ink line 1.5 px #1c2422.
- Reflection streaks, fixed to the pane (not to the camera): 2 per pane, 35 degrees from vertical, 4 cm and 1.5 cm
  wide, white at 0.10, running the pane's full height.
- Rain drops, on the outside, only above the outside waterline: 40 per side pane (about 100 per m2), radius
  2-5 mm, a pale ring #dfe8ea at 0.55 with a dark lower edge. 1 in 5 runs down at 0.15-0.4 m/s with a tail of
  3-6 cm and starts again at the top (hashed loop).
- The lake outside (panel 06, 07), seen from INSIDE only: everything on a pane below world y 0 is filled murky
  green, #2f5a48 at the waterline to #1c3a30 0.5 m under it, opacity 0.88; a foam line 1.5 cm #dfe8e4 on the
  waterline, wavering +-1.5 cm with a 0.8 s period (and tilted, because the car is pitched: the diagonal of
  panel 06); 12 bubbles of 4-10 mm per pane climbing the glass at 0.3 m/s. With the car's fall of section 2 the
  line stands 0.20 m above the sill at 9.0 s (halfway up the door and window together), 0.40 m at 11.5 s,
  0.55 m at 13.5 s. Seen from outside there is no green fill (the set's fog does it).
- Key `drop` (per pane, metres): the pane slides down; the driver's goes 0 -> 0.02 from 11.6 to 11.9 s and stops.
  A 2 cm strip of water sheets in over its top edge is NOT drawn (the waterline is still below the top).
- THE BURST, key `burst` time t0 = 13.5 s on the driver's pane, spec `hit` = the lower rear corner, 6 cm in from
  both edges (where the prongs land):
  - t0 to t0 + 3 frames: the whole pane crazes at once: 9 radial cracks from the hit point and a net of 1.5 cm
    cells, white #eef6f4 at 0.75. This is the frame a phone reads as "glass broke".
  - From frame 3 the pane is gone and 300 instanced cubes fly: 260 of 1.0-2.0 cm, 40 clumps of 3-5 cm. All go
    INTO the cabin (the lake pushes them), in a cone of +-35 degrees round -x, 1.5-4.5 m/s, gravity 9.8, spinning
    2-6 turns a second. Colour #dff2ee at 0.8, one face white, one face #2a3a36. A cube that reaches the cabin
    water vanishes there with a 3 cm ring. Each is visible 0.7 s at most; none is left after t0 + 0.9 s.
  - 30 cubes stay for the rest of the clip as a jagged rim, 1-2 cm, along the bottom and rear edge of the frame.
  - Speed lines: 8 white strokes 2 px, 10-25 cm long, round the hit point, frames 0-5 only.
- THE POUR, key `pour` 0..1 (0 -> 1 from t0 + 3 frames over 6 frames; 1 until 17.0; 0 at 17.5): a thick curved
  sheet from the opening into the cabin. At the sill 0.60 m wide, 0.30 m thick at 13.5 growing to 0.45 m by 15 s;
  it arcs 0.7 m in toward -x and falls to the cabin water (0.6-0.9 m of arc), onto Spud's lap and the gap between
  the seats. Body #3f6b5a, a highlight band #8fb8a6 along the top of the arc, foam streaks #e6f0ec over 35 % of it
  running 3 m/s, opacity 0.92, a 2 px ink line #14241f on both edges. Foot: a churning foam patch r 0.45 m,
  #e6f0ec, throwing 10 drops of 2-4 cm per frame up to 0.3 m.

### 3.3 `dashglow` (rides the rig) and the flicker at 11.5 s
- Two dial faces 9 cm (amber ring and needle #ffb347 on #14181b), a hazard triangle 3 cm #e0362c, a window
  button with a 1 cm amber dot on the driver's door; one amber light #ffb347 in the binnacle giving 25 % of the
  cabin's fill. Key `on` 0..1 scales all of it.
- Timing in frames (30 fps; frame 345 = 11.5 s). The glass moves on frames 348-357. Then:
  on 1.0 until 359; OFF 360-362; on 0.7 363-366; OFF 367-370; on 0.45 371-372; OFF 373-377; on 0.25 378;
  OFF from 379 (12.63 s) for good. Four flickers, each dimmer. From 379 `dim` on cabinwater = 1.

### 3.4 `headrest` (held prop)
- Pad 0.28 wide x 0.18 tall x 0.10 deep, corners rounded 3 cm, charcoal fabric #2b2e33 lit, #1a1c20 shade (match
  the carseat's own headrest colour if it differs), a seam line #3c4046 1 cm in from the edge, ink outline.
- Two steel prongs out of the pad's underside, 0.12 m long, 0.14 m apart, drawn 1.4 cm thick (real 1.0, thicker so
  they read at 360 px), #c9d0d4 with a white stripe along one side and #5a6268 on the other, 2 notches 2 cm from
  the pad on one prong, tips rounded.
- ORIGIN: the pad's centre; prongs toward -y; front face +z. Grips: both hands on the pad's short sides
  (x +-0.14). The driver's carseat needs its own headrest hidden from 13.0 s (carseat key or spec, engineering).

## 4. COLOUR SCRIPT (key / fill / dominant)

| Shot | Key | Fill, ambient | Dominant |
|---|---|---|---|
| 0.0 POV fall | #c9d3d6 | #6f7d86 | lake grey-green #4a5d57 inside eyelid brown #1c0f0a |
| 1.2 Spud's face | #c9d3d6 from the windscreen | #4d5a63 | skin gold #e8a93a and teal on storm grey |
| 2.5 impact | #c9d3d6 | #6f7d86 | spray white #eef3f1 on #4a5d57; car red #c8382e the only warm |
| 4.5 cabin, feet wet | #b9c6c9 (daylight at 70 %) | #3d4850 + dash amber #ffb347 | charcoal trim #2a2f35 over water #2e4a40 |
| 7.0 phone | #b9c6c9 | #3d4850 + amber; phone screen #cfe6ff on Mash | charcoal and gold skin |
| 9.0 door | #b9c6c9 through the upper glass | #2f5a48 glow from the lower glass | lake green #2f5a48 |
| 11.5 button, lights die | #b9c6c9, then #8fa3a3 (55 %) from frame 379 | #3d4850 + amber, then #26333a | near-black #1b2125 and green |
| 13.5 burst | #dfeee6 bounced off the foam (brightest cabin frame) | #2f5a48 | foam white on dark green |
| 16.0 back seat | #8fa3a3 from the hatch glass | #24403a | Chip's yellow #f0c020 over black-green water |
| 19.0 underwater, car | #bfe8cf from straight above | #1f4a3c | #1f4a3c; accents brick red #7a2f2a, yellow |
| 21.5 at the window | #a9d6bd | #173a30 | #173a30; headlamp #f2e9a8 |
| 24.0 wide, going up | #bfe8cf in the top third | #0b1f1a in the bottom third | jade #3f8064 down to black-green |
| 27.0 surface | #c9d3d6 | #6f7d86 | #4a5d57 and foam |
| 30.0 shore | #d3dcdc (the storm thinning, +8 %) | #6f7d86 | mud #4a3f33 under grey; the cast's colours come back |
| 33.0 bedroom (reused) | alarm red #e0362c, blinking | #3a2a24 | smoke brown-grey; eyelid brown links it to 0.0 |

One film: the lake green family (#4a5d57, #2f5a48, #1f4a3c) is in every shot from 0.0 to 30.0; the only warm
colours are the cast, the red car and the amber dash, and the amber dies at 12.63 s; nothing is pure black
(darkest #0b1f1a outside, #1b2125 in the cabin) and nothing pure white but foam, glass and the bright window.

## 5. BUILDER TASKS

T1, set "stormlake" (new file engine/page/set-stormlake.js; owner of nothing else):
1. Layout 1.1, bridge 1.2 (both stumps, 9 piers, lips, `spec.lip`), sky, light, mist and rain veil 1.3.
2. Water surface 1.4 from above and below, key `hole`, export STORMLAKE { waveAt, heightAt (ground and bed),
   SHORE, LIP, the numbers }.
3. Hills ring, abutment shore, bay shore with mud, rocks, reeds, firs 1.5.
4. Underwater look of section 2: background, fog (cast included), shafts, silt, lake bed, the ink / hatch /
   grade change, auto switch on camera y; the 2-frame foam wipe as key `wipe` 0..1.
5. Props `headbeams` and (only if needed) `lakebubbles`, in a new props-stormlake.js, with VOCAB.md lines.
6. Proof: 6 stills at the cameras of 1.6 (0.0, 2.5, 19.0, 24.0, 27.0, 30.0) with stand-in boxes for cast and car,
   each also shrunk to 360 px wide; render time per frame above and under water.

T2, cabin props (new file engine/page/props-sinkcar.js; owner of nothing else):
1. `cabinwater` 3.1 (level, dim, agit, hiss, rings; level in the world under pitch and roll).
2. `carglass` 3.2 (panes, streaks, drops, the lake outside, drop, burst with cubes and rim, pour).
3. `dashglow` 3.3 with the frame table as a helper the generator can call; `headrest` 3.4.
4. VOCAB.md lines; the measured cabin numbers (floor, cushion, sill, openings) written into the file header.
5. Proof: stills at 4.5, 9.0, 11.5, 12.2 (mid-flicker), 13.5 + 2, + 5, + 12 frames, 16.0, 19.0 in the real rig,
   each also at 360 px; a 10 fps strip of 13.4-14.4 s.

Budget for both (CPU, llvmpipe): at most 4 full-frame see-through layers over any pixel underwater (fog,
ceiling, 1 shaft pair, silt or bubbles); shaders loop over 4 waves at most; rain rings by one cell lookup
(3 x 3 neighbours); cubes, silt, bubbles, reeds and firs are each ONE instanced mesh; no render targets, no
depth-texture reads, no refraction.
