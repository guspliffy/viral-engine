TASK T1: what the robbers and the police wear and hold, for Fight, Flight or Freeze 01 "You just robbed a bank", in one props file with a bench.
WHY: frame 0 must read as "three friends just robbed a bank" with no words: black eye masks and money bags. The
police must read as police on our own cast: dark caps, riot shields, a torch, a net. No real force's markings.
DESIGN: Jonny's brief /mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md
("Pilot", "Build notes"). No panels. Potato scale: the cast are about 1.05 m tall, 0.76-0.86 m wide, 0.72 m deep.
RULES: CLAUDE.md (determinism); docs/rules/characters-grips.md (holds).
READ: CLAUDE.md; docs/VOCAB.md; engine/page/props-whatif.js (file layout: header, mat/mesh helpers, KINDS with
apply(ps)); engine/page/props-pumpkin.js `pumpkinhelm` and engine/page/stage.js lines 678-692 (how a worn prop,
spec.wear, rides a body); engine/page/props-energy.js lines 1-60 (`glowy`, userData.steam = see-through for the
checks); engine/page/props-race.js for a GRIPS export (trophy.stem); characters/duo/viking.json, duo/phoenix.json,
never-has-money/reaper.json, duo/samurai.json, potatobrawl/allfather.json, potatobrawl/dragon.json (body sizes, eyes,
headgear); storyboards/lookdev/make-grip-tests.mjs header. Nothing else unless blocked.
OWN: engine/page/props-heist.js (replace the stub; keep the exports HEIST_KINDS, HEIST_GRIPS; props3d.js already
imports it); storyboards/series/fight-flight-freeze/01-bank-robbery/bench/make-heist-props.mjs and its JSON;
storyboards/lib/grips.mjs SIZE entries for moneybag and policetorch only. Touch nothing else.
CONTRACT (metres; origin bottom centre and front +z unless said; colours hex):
1. `eyemask` (worn: spec.wear): a black cloth domino mask #17161d tied round the head: one band across both eyes,
   0.13 tall at the eyes, narrowing to 0.05 at the sides, two knot tails 0.12 long at the back. It hugs the body's
   surface 2-4 mm out. BOTH EYES STAY FULLY VISIBLE: either two eye holes a little bigger than the eye whites, or the
   band sits under the face features so eyes, lids and brows draw over it. The band's top edge stays under the
   resting eyebrows (the brows must read on skin). Fit by spec: `fit: { y, rx, rz }` (eye height and the body's half
   width / half depth there) with defaults for a 0.8 x 0.72 body; give the director a fit table for vik, phx, rea in
   the header (measured, from the bench). No check may report the face as covered because of it (userData.steam on
   it is fine).
2. `policecap` (worn): a dark navy peaked cap #1c2440: flat round crown r spec.r (0.2), 0.07 tall, a band #11162a
   0.04 tall with one small gold five-point star badge on the front, a glossy black visor reaching 0.09 forward and
   tipped 12 deg down. No letters, no chequer band. spec.tilt (deg, sideways). The header gives a fit table (x, y,
   z, r, tilt) so it sits on top of each of sam, god, dra over their own hair/helmet/horns without cutting into them
   and without hiding the eyes from a level camera.
3. `moneybag`: a cream canvas sack #d9c9a3, 0.34 tall, 0.3 wide, 0.26 deep, a tied neck with a rope at 0.26, a
   bold dark green #1f6b3a "$" 0.14 tall on the front (+z). spec.open (default false): true = the neck stands open
   and three bundles of green banknotes (#3f9b5a, a paper band) stick 0.08 out of it. Solid. HEIST_GRIPS.moneybag
   .belly: where two gloves hug it against a chest (the bag's sides at 0.16 up). grips.mjs SIZE.moneybag.
4. `riotshield` (worn or standing): a curved rounded-rectangle riot shield 0.62 wide, 0.86 tall, 0.02 thick, bowed
   0.06 toward +z, smoky see-through blue-grey #8fa3b8 at 0.45 opacity with a dark frame #1c2440 0.03 wide and one
   white band across it at 0.55-0.68 up with the word POLICE in dark navy capitals. Origin bottom centre. Two
   handles on the back. Solid for contact.
5. `policetorch` (held): a black torch along +z: body r 0.028, 0.2 long, a wider head r 0.04, a warm white lens
   #fff3c4. Param `on` 0..1: the lens glows and a soft additive cone leaves it along +z, spec.len (3.5) long,
   spec.r (0.45) wide at the far end (see-through for the checks). HEIST_GRIPS.policetorch.body = the body's
   middle (a fist round it). grips.mjs SIZE.policetorch.
6. `policenet`: a rope net #cdbf9a with weights #555 at its eight rim points. Origin: its middle. Params: `open`
   0..1 (0 = a tight bundle r 0.1; 1 = a spread net, a shallow dome r spec.r (0.75), 6 rings x 12 spokes of rope r
   0.008); `wrap` 0..1 (at 1 the open net drapes over an ellipsoid spec.over { w: 0.92, h: 1.08, d: 0.8 } whose top is
   at the net's origin: the rings hug it from the top down to 0.2 above its bottom, the rim weights hang). `spin`
   (deg) turns it about y. See-through for the checks (userData.steam). It must read as a net at 360 px wide.
MACHINE: stills only for the bench (`node engine/render.mjs <bench.json> --stills <t,t> --draft --out <dir>`), and the
in-hand proof command. One job at a time; another builder and the director share this 4-core box, so never a
`--layout`, a draft or a full render, never the farm.
DONE WHEN:
- the bench (plain set, a camera per group, each prop about a third of the frame): eyemask on vik, phx and rea
  facing the camera and 3/4 (eyes and brows clear on all three, shown with expression "shocked" and "angry" too);
  policecap on sam, god and dra front and side; moneybag closed and open on the floor; riotshield standing and worn
  in front of god (spec.wear, 0.45 m ahead of his middle, his gloves behind it); policetorch on and off; policenet
  at open 0, open 1, and wrap 1 over vik. Contact sheet (half scale) at
  /tmp/claude-0/-home-user/c271a530-791c-51b4-9d4f-374e01504e2c/scratchpad/t1/sheet.jpg; look at it once yourself.
- in-hand proof: `node storyboards/lookdev/make-grip-tests.mjs --prop moneybag --hold box` (two gloves, hugged at
  chest height by rea) and `--prop policetorch --hold <the hold that fits a fist round a cylinder>`; front and side
  stills named in the report, nothing through a glove.
- the file starts with a usage header: each kind, every spec key and param with its default, sizes, origin, where a
  hand holds it, and the two fit tables.
OUT OF SCOPE: the clip generator, cameras, acting, sounds, the set pieces (BRIEF-T2), engine changes, registry edits.
