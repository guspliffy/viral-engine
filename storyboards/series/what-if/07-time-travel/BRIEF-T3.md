TASK T3: the TV camera crane, the ambulance, the stretcher, potato medics, the starter official
WHY: the first catch is shown big: Wedge in rage yanks the cable of a TV camera crane and its long arm comes down on
the front row where Chip stands (panel 04); then medics carry Chip on a stretcher into an ambulance under blue light
in the rain (panel 05). The race starts with an official firing a starting pistol (panel 02).
DESIGN: BRIEF-COMMON.md (read it first); board.png panels 02, 04, 05.
READ: BRIEF-COMMON.md; engine/page/props-casino.js header + casinoguest (the potato extras' look); engine/page/props-heistset.js
header for policevan and sirenwash (blue light: copy the look, do not change that file); engine/page/props-race.js header.
OWN: engine/page/props-rescue.js (replace the stub, export RESCUE_KINDS and RESCUE_GRIPS); SIZE entries for stretcher
in storyboards/lib/grips.mjs (only those); storyboards/series/what-if/07-time-travel/bench/make-rescue-props.mjs (+ JSON, sheet).
CONTRACT (metres, origin bottom centre unless said, ghost = see-through + not solid):
- tvcrane: a broadcast camera crane on the apron: a 4-wheel dolly base 1.3 x 0.9, a black column 1.5 high, a pivot
  on top, a black lattice boom spec.len 5.5 long pointing +x at swing 0 with a counterweight box 1.2 behind the pivot,
  a big TV camera (lens hood, a red tally light) on a head at the tip, a thick black cable looping from the camera head
  down the boom to the base and on along the ground for 2 m (its free end at the origin + spec.cableEnd [-2, 0, 0.3]).
  Params: swing (deg yaw of the boom), boom (deg pitch, + up; default 18), yank 0..1 (the ground cable is pulled up to
  the point spec.pull [x, y, z] relative to the origin: a glove holds it there via grip "cable" which follows the
  pulled point), fall 0..1 (the boom snaps at the pivot and comes down: pitch from boom to -spec.drop (default 40) with
  a heavy ease the director sets; the counterweight swings up; the head lands spec.len out), tally 0..1. Boom and
  column solid; cable ghost. Grip "cable" (the pulled point; a glove closes round the cable there).
- ambulance: a white rounded box ambulance at potato scale (4.6 long, 2.0 wide, 2.3 high), red and yellow chequered
  side bands (painted squares, no letters), a blue light bar on the cab roof and two blue corner lights at the back,
  rear doors on the +z end at rot 0. Params doors 0..1 (both rear doors swing open 100 degrees, the lit interior with a
  stretcher rail shows), siren 0..1 (the blue lights flash alternately from the clip time and throw a soft additive
  blue wash on the ground around it, like sirenwash), wet 0..1 (rain beads and a gloss). Body solid, lights ghost.
- stretcher: a wheeled ambulance stretcher 1.5 long, 0.55 wide, mattress top at 0.65, orange-red frame, a grey
  blanket and straps, origin the middle of the foot line between its wheels, length along x at rot 0. Grips "head" and
  "foot" (the bar handles at both ends, a glove closes round each). Params blanket 0..1 (blanket pulled up). A lying
  potato will be posed on it by the director: report the mattress top and centre.
- medic: a potato paramedic extra (casinoguest's look and build, h 0.9): white jacket with a blue cross patch on the
  chest and on the cap, dark trousers, two small dark feet; params walk (metres walked: feet step, arm swing, stride
  0.28, as props-neonstreet.js streetpotato), sway 0..1, carry 0..1 (both small arms forward and down as if holding a
  stretcher bar at y 0.75). Ghost (the director parents him to the stretcher's ends).
- starter: a potato race official extra (h 0.95): navy blazer, a white peaked cap, a gold badge, his right arm raised
  straight up holding a black starting pistol; params fire 0..1 (a muzzle flash 0.0-0.1 then a white smoke puff rising
  and fading by 1), sway. Ghost.
MACHINE: bench stills only (BRIEF-COMMON).
DONE WHEN: bench/rescue-sheet.png shows (a) the tvcrane at boom 18 next to Wedge (potatobrawl/wedge) holding the cable
at yank 1 (one glove, grip "cable"); (b) fall 0.5 and fall 1 from the side; (c) the ambulance from behind at doors 1,
siren 1 at night (dark plain set) with two medics carrying a stretcher with carry 1 at its two ends; (d) the starter at
fire 0.3 next to Spud (potatobrawl/spud) crouched; (e) a close of the stretcher. In-hand proof for cable and stretcher
named under CHECKS.
OUT OF SCOPE: the clip generator, cameras of the clip, acting, sounds, commits, other kinds.
