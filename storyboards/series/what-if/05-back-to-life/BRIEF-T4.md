TASK T4: the museum's outside and the town square for There's a catch EP05. One props file + bench.
WHY: the video's first 1.5 s (panel 01) and its end (10, 11, 12): the T. rex bursts out through the museum's front
wall behind the screaming friends; they cling to a street lamp; the dropped scythe cracks the street and
something as big as a hill rises behind the museum. The burst is the video's hook: it must look violent and clean.
DESIGN: BRIEF-COMMON.md (read first); board.png panels 01, 10, 11, 12.
OWN: engine/page/props-museumstreet.js (replace the stub; export MUSEUMSTREET_KINDS),
storyboards/series/what-if/05-back-to-life/bench/make-museumstreet-props.mjs and the JSON it writes. Touch nothing else.
CONTRACT (metres; the square is on the +z side of the museum; nothing here is solid for the checks: use `ghost`
or userData.solid = false on everything, animals and the cast pass through the wall line):
1. `museumfront` (spec.w 34, spec.h 10, spec.breachX 1.4, spec.breachW 9, spec.breachH 7.5; origin = the ground at
   the middle of the wall plane, the wall faces +z): a neoclassical front in cream stone #e8dfc8 with shadow tone
   #c9bda2: rusticated base to 2 m, two rows of tall windows with dark panes and stone frames, a cornice and a
   balustrade on top, a small "MUSEUM" frieze; the entrance at x -9 (portico of four columns with a pediment, dark
   double doors, six steps 6 wide reaching 1.6 m out). No steps or columns between x -4 and 8 (the cast runs there).
   Params: `breach` 0..1: 0 = whole wall; above 0 a ragged hole opens centred on breachX (at 1: breachW wide,
   breachH tall, broken stone edge, dark warm hall inside on a card 2 m behind so it is never see-through to sky);
   `burst` seconds since the break (the generator tweens 0 -> 2): 50 stone chunks (0.15 to 0.8 m, wall-coloured,
   tumbling) fly out toward +z on ballistic arcs with a spread, land between 2 and 9 m out and stay lying on the
   ground; big dust puffs (cream, soft, through `ghost`) billow out and fade by 1.6; at burst 0 with breach 0
   nothing is loose. Chunks never land in the strip x -1.2..1.6, z 2..14 (the cast's lane).
2. `townsquare` (spec.w 40, spec.d 34; origin = the square's centre; the museum wall is at z -10 in its frame):
   cobbles (grey #a39f97, each stone drawn once, a lighter worn lane down the middle), a kerb line; along both
   sides (x = +-15, from z -8 to 16) a row of four-storey town houses facing the square (cream and pale stone,
   tall windows with shutters, blue-grey slate mansard roofs with dormers and chimneys: panel 11 and 12); three
   small trees in stone rings; behind the museum (z -30..-60, y 10..40) seven soft white clouds as flat cards
   facing +z. Bright midday. Ground receives shadows; houses cast none onto the lane.
3. `hillneck` (origin = the ground at the middle of its back; it faces +z): a long-neck dinosaur as big as a hill
   that was sleeping under the city. Param `rise` 0..1: at 0 nothing is above ground; it heaves up as rise grows:
   first the back (a hump 26 wide, 12 tall at 1, covered in earth, grass and three tiny houses and trees that tilt
   and slide off), then the neck (thick, grey-green #8f9a84 with a paler throat) swings up and forward to a small
   gentle head at 36 m high and 14 m in front of the origin, looking down toward +z; 40 clods of earth and rock
   fall off as rise goes on; dust at its base. Head params: `jaw` 0..1, `blink` 0..1. Huge and calm, not scary.
4. `streetcracks` (spec.r 2.6; origin = the point of impact, y 0.01): param `grow` 0..1: jagged black cracks run
   out from the middle over the cobbles (9 main arms with branches), green light #7dff6a glowing up from inside
   them (additive) and a soft green pool at the centre; nothing drawn at 0.
DONE WHEN:
- bench: `plain` set (color "#9fcdf0", floor "#a39f97", light "golden"); museumfront at [0, 0, 0], townsquare at
  [0, 0, 10], hillneck at [2.5, 0, -18], streetcracks at [-0.6, 0, 15], the existing `streetlamp` (h 6.5) at
  [-2.5, 8], the existing `trex` (scale 1.5, jaw 0.9, lean 14) at [1.0, 0, 1.0], `potatobrawl/spud` at [0.1, 6].
  Cameras: F (panel 01) {pos [0.15, 0.5, 11.5], look [0.5, 2.4, 2.5], fov 46}; S (panel 10) {pos [10.5, 1.4, 8],
  look [0.8, 2.7, 2.6], fov 46}; L (panel 11) {pos [0.6, 0.9, 14.2], look [-2.2, 4.6, 8], fov 46}; N (panel 12)
  {pos [0.4, 0.3, 17.4], look [-0.9, 5.2, 6], fov 58}. Stills: F at breach 0; F and S at breach 1 with burst 0.15,
  0.4, 0.9, 2; L; N at grow 1 with rise 0, 0.35, 0.7, 1
- contact sheet storyboards/series/what-if/05-back-to-life/bench/museumstreet-sheet.png; in F the hole is big enough
  that the whole T. rex head and chest show through it; in N at rise 1 the head is inside the frame and the band
  y 1130-1290 px (of 1920) is calm enough for a white caption; the top 20 % of F and S is calm
- the common DONE lines in BRIEF-COMMON.md
OUT OF SCOPE: the hall inside (T1), animals, the street lamp, the scythe.
