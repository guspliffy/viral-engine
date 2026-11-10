TASK T2: the window wall, the money wave outside it and the falling notes for There's a catch EP04, one props file + bench.
WHY: the clip's one wow (v2 panels 04 and 05, the cover): seen from inside the diner, a wave of banknotes taller than
a bus rolls down the sunny street outside the big windows, notes pour in under the wall, and earlier a rain of paper
IOU notes falls on Reaper. It must read on a phone in under a second: "a tsunami of money outside".
DESIGN: script /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (panels 03, 04, 05,
08; "Build notes"). The diner's window wall is the painted plate assets/plates/diner-sunny.png (768 x 1344: red
frames, five tall panes of sunny sky, palms and a street; look at it). Cast scale: a potato is 0.9 m wide, 1.1 m tall.
RULES: determinism rules in CLAUDE.md; docs/rules/movement.md "physics" only if you need it.
READ: CLAUDE.md; engine/page/props-bistro.js lines 1-60 (file layout); engine/page/props-energy.js lines 1-60
(`glowy`, see-through for the checks via userData.steam) and its `ashfall` (falling instanced cards driven by a
clock param); engine/page/set-plate.js lines 34-60 (how a plate picture is loaded: globalThis.__loads, colour space);
engine/page/props-money.js once it has `noteTexture()` (another builder is writing it now: if it is still a stub,
draw your own note card: green #7fae6a, darker border #4f7f4a, a cream oval with a small golden potato, and say so);
storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs (a bench generator); nothing else unless blocked.
OWN: engine/page/props-flood.js (replace the stub; export FLOOD_KINDS),
storyboards/series/what-if/04-copy-money/bench/make-flood-props.mjs and the JSON it writes. Touch nothing else
(props3d.js already imports the file).
CONTRACT (each prop in its own frame: origin on the floor, the room side is +z, metres; the generator turns them):
1. `windowwall`: the plate picture as a standing wall card with the window panes cut out, so what is behind shows
   through the glass. spec.src (default "assets/plates/diner-sunny.png"), spec.h (6.4: the card's height; width from
   the picture), spec.cy (1.3: the card centre's height above the floor, so the painted panes span about y 0.2 to
   2.65), spec.panes (pane rectangles in picture shares [x0, y0, x1, y1], top-left origin; measure them from the
   plate: the panes between the red mullions, x from about 0.29 to 1.0, y 0.29 to 0.67, and the two narrow panes at
   the far left; keep every red frame and mullion opaque), spec.back (4.5: metres behind the wall where a second,
   unlit copy of the picture stands as the far street, scaled by 1 + back/8 about the panes' centre, so the sky, palms
   and street stay in the windows) and spec.glass (0.12: a faint white sheen on the panes, see-through for the
   checks). Unlit like a plate (MeshBasicMaterial, toneMapped false, fog false, no outline). The picture loads before
   the first frame (push the load on globalThis.__loads as set-plate.js does). The front card blocks nothing for the
   contact checks (userData.steam) but hides what is behind it outside the panes.
2. `moneywave`: the wave, standing 1.0 to 3.5 m behind the wall (the generator places it), running along x (it
   enters from -x and rolls toward +x). spec.len 16 (x extent), spec.h 2.7 (crest height at `level` 1), spec.d 2.5.
   Params: `front` 0..1 (the crest's place along len: 0 = not yet in view at the -x end, 1 = it has passed the +x
   end and the street is full), `level` 0..1 (how high the flood behind the crest stands: at 1 the panes are full
   to 85 % of spec.h), `clock` (seconds, tweened by the generator: all motion comes from it). Look: a curling crest
   like a surf wave built of thousands of banknotes (instanced note cards, green with the potato emblem, each tumbling
   with the clock), a darker body under it (#5e9457 shading to #3f6f47 at the bottom) so it reads as a mass, pale
   foam of single notes flying off the crest and ahead of it, cel-style bands rather than noise. Riding it: one
   small car (a simple rounded hatchback, red #d8453a, 1.9 long) bobbing just behind the crest, tilted 12 degrees,
   and one street lamp or palm crown the wave bends over as it passes. See-through for the checks.
3. `noteflood`: notes pouring into the room under the wall: a spreading fan of notes on the floor in front of the
   origin (+z), spec.w 3.6 wide along x, reaching spec.d 2.2 into the room at `grow` 1, 3 to 8 cm deep, thicker at
   the wall, with single notes sliding ahead at the edge; `clock` keeps the edge moving. Instanced; lies on the floor
   (y from 0.004); see-through for the checks.
4. `noterain`: paper falling from above onto a spot: spec.n (60) cards falling from spec.top (3.2) over a disc
   spec.r (0.9) round the origin, each swaying and turning on its own path from a hash, landing and staying on the
   floor (y 0.004 + a little stacking). spec.look: "iou" (cream note paper #f6efd9 0.14 x 0.1 with a ruled line and
   a hand-written "IOU" in dark blue ink), "note" (the green banknote) or "snow" (white round flakes r 0.012 to
   0.03, spec.n up to 400 over spec.r up to 6, that never pile: they loop from top to floor). Params: `amount` 0..1
   (how many are in the air or down), `clock` (seconds: the fall; a card takes about 1.1 s from top to floor, snow
   3 s). See-through for the checks.
MACHINE: yours for bench stills only (`node engine/render.mjs <bench json> --stills ... --draft`, one job at a time);
no layout of the clip, no draft or full render, never the farm.
DONE WHEN:
- the bench (plain set, red-brown floor, a camera inside the room 6 m from the wall at 1.7 m, fov 50, looking square
  at the wall, plus one camera 25 degrees off to the side; a potato `never-has-money/gunslinger` 2 m in front of the
  wall for scale): the wall alone (the painted street visible in every pane, the frames opaque, no pane edge
  misplaced by more than 2 cm); the wave at front 0.2, 0.5, 0.8 (level 0.3, 0.7, 1) at three clock values, the car
  visible in at least one; noteflood at grow 0.5 and 1; noterain "iou" at amount 0.5 and 1 over a second potato
  (`never-has-money/reaper`), "note", and "snow" on a dark background
- a contact sheet at storyboards/series/what-if/04-copy-money/bench/flood-sheet.png; look at it once: at 270 px
  wide the wave reads as a wave of money (crest, body, notes), not a green blob, and it is clearly OUTSIDE the glass
- two stills 1/30 s apart show the wave moving smoothly (no popping notes): say what you compared
- frame cost: the wave shot renders in under 4 s a frame at draft on this box (say the number)
- the file starts with a usage header: the kinds, every spec key and param with its default, sizes, origins
- deterministic: no Math.random, no clock; everything from params and hashes of the instance index
OUT OF SCOPE: the clip generator, cameras, acting, the diner sign, the night scene, sounds, engine changes.
