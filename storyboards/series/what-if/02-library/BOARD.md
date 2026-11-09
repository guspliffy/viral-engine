# BOARD: faster-than-sound (What if, episode 2)

Written after the staging proof and review A (9 Nov 2026). The generator `make-faster-than-sound.mjs` is the director's
and holds every camera, time and action; this BOARD makes the builders' parts exact. Jonny's brief and panels win.
Coordinates: metres, x right, y up, z toward the camera (the wide looks down -z). Times: clip seconds.

## §1 Brief

- Joke: Phoenix moves faster than sound in a library; each trip his sound arrives late (a puff, then a thump); he sits
  perfectly quiet; then all the sound he outran arrives at once: BOOM. Wants: Phoenix to burn energy silently; Reaper and
  the librarian (Sorcerer) want quiet. Consequence: every book off every shelf. Ending: Reaper buried to his hood, a page
  on his face, "...sorry.", the librarian's glare. Callback: the librarian's shush at 17.85.
- Source: `/mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md`, panels
  `.../storyboards/01-faster-than-sound-library/storyboard-eight-panels.png`, `PANELS.md` here. Gate: series episode
  (Jonny's go 9 Nov 08:08 UTC), no animatic.
- Length 18.9 s + 3-frame hit-stop = 19.0 s (series format); loop no; profile short. Test: a ticking clock (11.9-13.3).

## §2 Look

- Cast: phx Phoenix, rea Reaper, sor the Sorcerer (librarian, on a 0.5 m dais behind a 0.45 m desk). Set: library hall,
  plate `assets/plates/library-hall-day.png` (T4) at z -8.6, shelves `libstack` x -1.9 / -0.2 / 1.5 / 3.2, z -6.5,
  l 1.7, h 2.7, d 0.44, 6 shelves.
- Light: bright cool afternoon daylight from the left (windows camera-left), sunbeams slanting down-right, faces at full
  key. Palette from the brief: daylight #f4f1e6, sky #9cc7e8, oak #7a4a2c, brass #c99a3a, flame #ff9a2e / #ffd36b.
- Music: soft plucky chamber piece; silence while he is away (1.0-2.2, 4.6-5.6, 8.0-11.1). Sounds are whitelisted
  (slap crack, ai/ignite fwip, ai/fingertip-catch tick + hit-wood tock, impact + dinostomp boom); Jonny judges them.

## §3 Shots (all in the generator; panel numbers in brackets)

| Beat | From | Camera | What the builders' parts must show |
| --- | --- | --- | --- |
| 01 frame 0 (01) | 0 | wide, long lens | the sign over the desk 0.13-0.28 down; the orb lit at the librarian's left; the clock left of the dais |
| 02 Reaper close (02) | 1.55 | rea | the streak leaving (1.0-1.2, seen on the wide), its 3 after-images at 0.35/0.47/0.62 across |
| 03 two-shot (03) | 2.2 | two | a fwip flash where he lands (2.2); the late puff at 2.9 |
| 04 a whole shelf (04) | 4.0 | wall, from above | the full cart 4.0-4.75; the streak cart -> shelves 4.6-5.6; cart spinning empty 5.6; lamps swing at 6.3 |
| 05 laps / ring (05) | 7.3 / 8.0 | laps, high push-in | the ring of flame round the reading table 8.15-10.9 with 2 after-images riding it and papers spiralling up |
| 06 seated / clock / calm (06) | 11.0 / 12.25 / 12.75 | sit, clock insert, sit | the pendulum swinging, minute hand jumping a notch each tick (11.9, 12.4, 12.9, 13.3) |
| 07 BOOM (07) | 13.5 | boom push-in | every shelf empties at 13.5, 120+ books in the air, the sign swings up, pages falling from 14.6 |
| 08 aftermath (08) | 16.0 | keep | bare shelves, the pile round the two seats up to Reaper's hood, the page over half his face, pages still falling |

## §4 Check times

0.5, 1.2, 3.0, 4.3, 6.0, 6.4, 9.6, 12.2, 12.5, 13.6, 14.0, 15.0, 17.8

## §5 Builder parts (sizes from the staging proof)

All props: origin on the floor under the middle, facing +z at rot 0 unless said; deterministic (no Math.random, no wall
clock: animated params are keyed by the director with `{do:"prop", set:{...}}`, or the prop reads the clip time the
engine passes, keyed on exact inputs); daylight-friendly materials (MeshStandardMaterial, roughness 0.4-0.7).

**T1 `props-whatif-library.js` (Sonnet)**
- `longclock`: longcase clock, w 0.5, h 2.1, d 0.3, dark oak (#4e2e1a) with brass trim; a brass-ringed white dial at
  y 1.75, r 0.16, Roman numerals, two black hands (`time` hours, 12.667 = 12:40); a glass door 0.30 w from y 0.55 to
  1.45 showing a brass pendulum (rod 0.7, bob r 0.07). Param `swing` (degrees, pendulum angle, + to +x) keyed by the
  director, and `spec.ticks` [times] optional: if given, the pendulum reaches an end at each tick time and the minute
  hand jumps one minute on each. Solid (the case box).
- `quietsign`: a hanging sign, the origin is its ceiling point (y = spec.y): two brass chains spec.len (0.7) down to a
  board spec.w (1.0) x spec.h (0.65) x 0.03 (sized in the wide: hung at y 4.0 over [-0.4, -5.3] it fills 0.13-0.28 down), cream (#efe4cc) in a dark oak frame, with a painted dark-brown silhouette of a face in
  profile holding a finger to its lips (no words, no letters). Param `swing` (degrees about the hang point's x axis,
  + lifts the bottom toward +z, up to 80). Not solid.
- `bookcart`: a library book trolley, l 0.9 (x) x w 0.45 (z), dark oak with brass corner posts and a brass push rail at
  0.9 m on the -x end, two trays (the top tray's top face at y 0.44, the lower at 0.18), four black castors r 0.05. The
  10 cart books (`libbook` w 0.17, h 0.24, t 0.04) stand on the top tray in two rows at x ±0.13. Solid.
- `brasslamp`: a brass pendant, the origin its ceiling point: a chain spec.len (1.3) to a brass dome shade r 0.22 with
  a lit warm bulb (#ffe2a8, emissive, no point light). Param `swing` (degrees about the hang point, + toward +x).
  Not solid.
- `orbstand`: a green glass orb r 0.09 on a three-claw brass stand 0.12 tall, the glass glowing green (#7dff9a core,
  #2f8f4f edge, emissive + a soft additive halo, no point light). Param `glow` 0..1 (default 1). Sits on the desk top.
- `libpage`: one loose book page 0.17 x 0.24, cream with grey printed lines (no letters readable, never "TEST"), a
  drop cap block. Param `bend` 0..1 curls it round a vertical axis (radius 0.18 at 1), so it can sit over a face.
  Not solid.

**T2 `props-whatif-flame.js` (Opus, VFX)**
- `flamestreak`: the power's trail. spec.path [[x,y,z], ...] (2-4 points, world metres), spec.len 1.6 (trail length).
  Param `t` 0..1 moves the head along the path (keyed by the director over 0.15-0.3 s); `fade` 0..1. Look: a tapered
  ribbon of flame (white-yellow core #fff3c4, orange #ff9a2e, red edge #d8431f), additive, built like EP03's
  `lightstreak` (`git show origin/what-if-03-light-speed:engine/page/props-race.js`: two crossed fins + a flat quad), plus
  `spec.ghosts` (3) after-images behind the head at 0.5 m spacing: flame silhouettes of Phoenix's shape (round body,
  crest of 3 feather-flames on top, two half-spread wings, ~0.9 m tall) at opacity 0.6 / 0.4 / 0.2, and 6 loose pages
  fluttering in its wake. Flicker from `t` and spec.seed only.
- `flamering`: the 100 laps. A ring of low flames on the floor, ellipse spec.rx 1.8 x spec.rz 1.3 round its origin
  (the director puts it on the reading table's middle), flame height 0.45; param `t` (seconds since it started, keyed
  by the director: the flames run round it at 2 laps/s), `fade` 0..1; two ghost silhouettes (as above, 0.9 m) riding
  the ring half a lap apart; 10 papers spiralling up from the middle (0 to 3 m over 2 s, looping).

**T3 `props-whatif-blast.js` + `libstack` in `props-library.js` (Opus, physics)**
- `libstack`: a new param `bare` 0..1 (default 0, unchanged for every old clip): at 1 the shelves are empty wood.
  Expose the book slots (position, size, colour per book from the stack's seed) so `bookstorm` can launch exactly the
  books that leave.
- `bookstorm`: spec.stacks (the libstack specs above), spec.t0 (13.5). From t0 every book of every stack flies out:
  forward (+z) 2.5-6 m/s, up 2-5 m/s, sideways ±1.5, seeded spin; gravity 9.81, bounces on the floor (restitution 0.3,
  friction) and comes to rest; any frame in any order (integrate from t0 at a fixed 1/240 s step, keyed on exact
  inputs). 120+ books (InstancedMesh). Never inside the cast: spec.keepout [[x, z, r], ...] circles the books bounce off.
- `pagefall`: 30 loose pages (as `libpage`) fluttering down from spec.box [x0, x1, y, z0, z1] from spec.t0 (14.6) for
  spec.dur (4.3 s): 0.5-0.8 m/s down, side-to-side sway, tumbling; land flat on y 0 or on spec.floorY.
- `bookpile`: a heap of 100-150 books (instanced, the libbook look) made of spec.mounds [{x, z, r, h, y?}, ...], each a
  dome of jumbled books; spec.holes [[x, z, r], ...] stay empty (the seats). Param `fill` 0..1 grows it bottom up, the
  top books arriving last. Not solid.

**T4 daylight plate (Sonnet)**: `assets/plates/library-hall-day.png` 768x1344 (+ depth/motion with
`engine/plates/depth.py`): the same hall as `library-hall.png` in bright cool daylight: tall arched windows on the left
showing blue sky and green trees, sunbeams slanting from the left, a gallery of bookshelves above, no warm-dim look.
img2img from `library-hall.png` (strength 0.5-0.65, so the hall's layout stays) or a fresh paint, a few seeds; a
README row with the prompt and seed.
