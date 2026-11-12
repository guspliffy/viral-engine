TASK T2: the pocket watch (the power), rewindable rain, the seasons swirl, the gold medal, the broken watch
WHY: the watch is the power and must read in a glove at 270 px (panels 01, 10, 11, 13, 15); time running backward
must be SEEN in the rain (panel 01: the raindrops stop and fly upward); the third jump flashes seasons (12) and the
watch bursts (13).
DESIGN: BRIEF-COMMON.md (read it first); board.png panels 01, 05, 10, 11, 12, 13, 15.
READ: BRIEF-COMMON.md; engine/page/props-okilied.js rainfall (the existing rain: do not change it); engine/page/props-race.js
header (param seeding); storyboards/lib/grips.mjs SIZE + HOLDS; storyboards/lookdev/make-grip-tests.mjs usage.
OWN: engine/page/props-timewatch.js (replace the stub, export TIMEWATCH_KINDS and TIMEWATCH_GRIPS); the SIZE entries
for pocketwatch in storyboards/lib/grips.mjs (only those); storyboards/series/what-if/07-time-travel/bench/make-watch-props.mjs
(+ JSON, sheet).
CONTRACT (metres, ghost = see-through + not solid):
- pocketwatch: a brass hunter pocket watch: round case 0.075 across, 0.022 thick, domed glass, a cream face with 12
  bold tick marks (no numerals), two black hands, a small seconds dial, a knurled crown + bow ring at 12 o'clock, a
  0.22 brass chain hanging from the bow in a loose loop. Origin: the case centre; the face looks +z at rot 0. Params:
  hands (turns of the minute hand, any number, negative runs backward; hour hand at 1/12 of it), crack 0..1 (a crack
  line grows across the glass from the 2 o'clock edge, splitting into 3 branches), wind (degrees the crown has turned:
  its knurl visibly rotates), shake 0..1 (a fast small tremble from the clip time), burst 0..1 (0.0-0.15 the glass
  shatters into ~14 shards and the back pops open; then ~10 gears, 5 coil springs, the hands and shards fly out
  radially in deterministic arcs up to 0.6 m and fall under gravity to y spec.floor relative to the origin (default
  -1.0), spinning), glint 0..1. Brass must read as gold-brass in rain light. Grip "case" (a glove closes round the
  case from below/behind with the face to the camera). SIZE entry + in-hand proof (hold "hold" and "pinch").
- watchwreck: the broken watch lying in a puddle (panel 15): the empty case open like a clam, a bent chain, 6 gears,
  3 springs, glass shards scattered in a 0.35 circle on the ground. Origin on the ground. Ghost, flat-ish.
- rainbox: rain that time can run backward: spec.box [w, h, d] around the origin (default [8, 6, 8]), spec.n drops
  (1500), spec.speed 9 m/s, spec.slant [0.08, 0] (m per m fallen along x, z), spec.alpha 0.55, spec.seed. Param time
  (seconds: every drop's place is a pure function of time; the director tweens it forward with the clip, holds it to
  freeze the rain, and tweens it backward to make the rain RISE; if no tween ever sets it, it follows the clip time),
  streak 0..1 (1 = long falling streaks, 0 = short round drops: a frozen or rising drop reads as a drop, default 1),
  splash 0..1 (small splash crowns and rings on the ground plane y 0 where drops land, also from time). Drops catch
  the light (bright blue-white). Ghost. InstancedMesh.
- seasonswirl: the seasons flashing past (panel 12): snowflakes, orange-red autumn leaves and rain streaks swirling
  round the origin in a cylinder spec.r 6, spec.h 8, spec.n 600 (a third each); params on 0..1, time (swirl, as rainbox:
  defaults to the clip time), snow 0..1, leaves 0..1, rain 0..1 (each kind's share). Ghost, InstancedMesh.
- goldmedal: a worn medal (wear on a body): a red-white-blue ribbon V round the neck down to the chest and a 0.075 gold
  disc with an embossed laurel (no letters or numbers), origin the ribbon's top at the back of the neck... make it
  sit on a potato's front when worn with `wear: "<id>"` like engine/page/props-mind.js eyeglow (read that kind's header
  only). Param swing (the disc swinging, from the clip time) 0..1. Ghost.
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN: bench/watch-sheet.png shows (a) Spud (potatobrawl/spud) holding the pocketwatch up in his right glove, face
to camera, a close at 270 px where hands, ticks, crown and chain read; (b) the watch at crack 1 with wind 360; (c)
burst 0.1, 0.4 and 1 in close-ups; (d) a rainbox round Spud at time 2, streak 1 and the same box at time frozen with
streak 0 (round drops); (e) seasonswirl round Spud, all three on; (f) the goldmedal worn by Spud; (g) the watchwreck
next to a wetpuddle (props-guard.js). The in-hand proof sheet named under CHECKS. Report how to rewind the rain (which
params, how fast) in NOTES.
OUT OF SCOPE: the clip generator, cameras of the clip, acting, sounds, commits, other kinds, the existing rainfall.
