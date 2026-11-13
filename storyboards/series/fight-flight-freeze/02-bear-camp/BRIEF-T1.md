TASK T1: the camp props for Fight, Flight or Freeze 02 "Bear in the camp", in one new props file with a bench.
WHY: a lonely camp at night in a dry thunderstorm, attacked by a 400 kg black bear. The viewer must read at phone size:
the three friends' green dome tent (ripped open by claws in 01, the bear's head pushing in at 05), the car whose
windscreen the bear smashes and whose driver door it tears off (03, headlights flashing), the gas lantern it knocks
over so the dry grass burns (05-07), the blue cooler Spud stands on (09), the steel pot he holds up and the bear
bites (09-12, dented in 12), the burning branch he raises (09-10), and the claw marks on the pine (12).
DESIGN: the producer's approved sheet storyboards/series/fight-flight-freeze/02-bear-camp/panels-sheet.png and the
single panels in panels/01..12.png (build what they show); the chain CHAIN.md in the same folder. Potato scale: Spud
0.88 m tall, Chip 0.53, Wedge 0.98 (characters/potatobrawl/{spud,chip,wedge}.json "height"; bodies about as wide as
they are tall). Realistic objects, painted texture detail like the existing camp props; no logos, no lettering.
RULES: CLAUDE.md (determinism: no Math.random, no clock); docs/rules/characters-grips.md (holds).
READ: CLAUDE.md; docs/VOCAB.md; engine/page/props-camp.js (file layout, header style, helpers); engine/page/props-tent.js
header (the existing small dome); engine/page/props-city.js + engine/page/car-hatchback.js (the hatchback you reuse);
engine/page/props-city.js `firesmoke` and engine/page/props-energy.js lines 1-60 (see-through fire: userData.steam);
engine/page/props-dino.js `campfire` (flames style to match); engine/page/props3d.js around the KINDS merge line
(~1390) and how CAMP_KINDS is imported (copy that pattern); storyboards/lookdev/make-grip-tests.mjs header;
storyboards/lib/grips.mjs SIZE. Nothing else unless blocked.
OWN: engine/page/props-bearcamp.js (new: exports BEARCAMP_KINDS, BEARCAMP_GRIPS, BEARCAMP_PARTS as needed); ONE import
line + its names in the KINDS / GRIPS merge in engine/page/props3d.js; storyboards/lib/grips.mjs SIZE entries for
cookpot and burnbranch only; storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-bearcamp-props.mjs and its
JSON. Touch nothing else (the bear itself is another task).
CONTRACT (metres; origin bottom centre, front +z unless said; colours hex; every animated value a param 0..1 unless said;
any param propState has no default for must be listed in the header with "seed it with a dur-0 set at 0"):
1. `domecamp`: a three-person dome tent, forest green #3f6b3a fly with darker #2c4a2a seams, a tan #8a7a5a floor tub
   rim. Footprint 2.6 w x 2.2 d, peak 1.45 high, two crossing poles under the fly (visible as arcs). Front (+z): a
   D-shaped door, `open` 0..1 rolls the door panel down (1 = fully open). Left side (-x): one 0.7 x 0.5 window of fine
   dark mesh that is SEE-THROUGH (a camera inside looks out through it in panel 03: transparent with a faint dark grid,
   userData.steam). `rip` 0..1: four parallel claw slits 0.9 m long down the front-top of the fly opening into ragged
   hanging flaps (panel 01, 05), with the inside dark green showing; `push` 0..1 a bulge of the front fly inward as the
   bear pushes (0.35 m deep at 1); `flutter` 0..1 wind ripple on the clip clock. Inside is open space for three seated
   potatoes side by side (no inner geometry in the way).
2. `campcar`: the hatchback from car-hatchback.js, plain dark silver #8d9297, unmarked, parked; `smash` 0..1 the
   windscreen crazes from one impact point (white cracks spreading, a sag at 1); `door` 0..1 the driver door (on +x)
   hinges open, and `torn` 1 hides it on the car (the torn door is the next kind); `lights` 0..1 headlights on with
   two soft see-through beams 6 m long (beams userData.steam); `flash` a count: lights blink on/off once per whole
   number (the alarm), drive it with a tween.
3. `cardoor`: that driver door alone (same shape and colour, window glass shattered), origin at its hinge edge
   bottom, so the bear can tear it off and it lands on the grass; a GRIPS point "edge" (the top front corner the paw
   pulls).
4. `cooler`: a blue #2f6fb0 hard cooler with a white lid #e9eef2, 0.72 w x 0.46 d x 0.48 h, two side handles; SOLID and
   standable: a potato stands on the lid (its top at y 0.48). `dent` 0..1 a crushed corner (not used if the sheet does
   not need it).
5. `cookpot`: a steel cooking pot r 0.11, h 0.15, with ONE long handle 0.22 m on +x (a hand holds it by the handle
   end); brushed steel #b9bec4 with dark inside; `dent` 0..1 the rim bent in by teeth (two dents on the -x side at 1).
   GRIPS "handle". A SIZE entry in grips.mjs and the grip proof sheet (hold the handle like a frying pan).
6. `burnbranch`: a dry pine branch 0.75 long, r 0.03 at the hand tapering to 0.015, two side twigs, origin at the held
   end, pointing +y; a cel-banded flame (white-yellow core, orange, red rim) 0.35 tall licking up off the top third,
   flickering on the clip clock; `fire` 0..1 its strength; sparks optional. Flame see-through. GRIPS "hold" 0.08 from
   the end; SIZE entry + grip proof sheet.
7. `gaslantern`: a camping gas lantern 0.28 tall (green base, glass mantle globe, wire bail), `lit` 0..1 warm glow
   #ffcf7a (light, see-through glow), `tip` 0..1 it falls over onto its side toward +x (pivot at its foot edge) and
   rolls 0.2 m, staying lit.
8. `grassfire`: low burning dry grass along a strip: spec.w (2.5) x spec.d (0.8), spec.seed; `fire` 0..1 flames 0.15-0.45
   tall in the campfire's style, `spread` 0..1 grows it from its -x end to the +x end (a lit edge front), a glow on
   the ground and a thin smoke drift; all see-through (userData.steam), light only.
9. `clawmarks`: four parallel fresh gouges in pine bark, 0.6 long, pale wood #d9c39a showing, splinters at the ends;
   origin its middle, facing +z, spec.r the trunk radius it wraps (0.35), so it sits on the trunk's surface.
10. `climbpine`: a tall pine the bear and Wedge climb: trunk r 0.36 at the ground tapering to 0.12 at 9 m, rough dark
   bark #3a2c22 with deep furrows, stubs and a few side branches from 2.5 m up (none crossing the climb side +z between
   1 and 7 m), needle skirts from 5 m to the top in the colour of the storm painting's pines; `sway` -1..1 (the top
   swings while the bear climbs, on the clip clock with `shake` 0..1); `snap` a count of branch bits breaking off the
   +x side (small falling pieces, a pure function of the count). Solid trunk.
MACHINE: no layout or full render: benches and their stills only (another job may hold the CPU).
DONE WHEN:
- every kind above on one bench storyboard (bench/make-bearcamp-props.mjs): night light, one camera per group, each
  state shown at its key value (rip 1, push 1, smash 1, door 1 + torn door on the grass, lights 1, tip 1, spread 0.5,
  dent 1, fire 1), stills at those times in one contact sheet at bench/bearcamp-props-sheet.png
- the cookpot and burnbranch in-hand proof sheets (front + side) named in your report, hand closed round the handle
- `node qa/preflight.mjs <bench> --quick`: no FAIL except listed see-through/enclosing props
- the file starts with a usage header: kinds, every spec key and param with default, sizes, origins, grips
- `node tools/vocab.mjs` run after adding the kinds
OUT OF SCOPE: the bear, the cast, any clip generator, engine changes outside the files above, full renders, commits
to main (commit on the current branch fff-02-bear-camp with "T1: ...").
