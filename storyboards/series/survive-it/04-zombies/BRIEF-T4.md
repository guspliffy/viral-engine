TASK T4 (v2): the flat's things: TV news, phones, bathtub, water bottles, pots, cups, tally wall, mop, arm guards, rain bucket
WHY: v2 of the episode TEACHES real survival steps (Jonny 12 Nov 2026): the viewer must read at a glance that the TV
  says STAY INDOORS, every phone shows an emergency alert, they fill the bathtub while the water still runs, ration
  it one cup each (tally marks on the wall), fight in the doorway with a broom and a mop, forearms wrapped in
  magazines and grey tape, and catch rain in a bucket on the roof.
DESIGN: BRIEF-COMMON.md (read first, same folder), panels 01, 02, 05, 06, 11, 12 of panels-sheet-v2.png (same
  folder; look at it) and their text in /mnt/project-files/video-scripts/2026-11-08-survive-it/
  11-zombie-apocalypse-V2-IMAGE-PROMPT.txt. Panel 11's arm guards look like tins on the sheet: build MAGAZINES rolled
  round the forearm and held by grey duct tape (the real tip), not tins.
RULES: CLAUDE.md "Rules that apply to every task". Readable text on a painted canvas is fine (TV, phone).
READ: `engine/page/props-zflat.js` lines 1-120 (header style, canvas painting helpers, a KINDS entry, STATE),
  `engine/page/props-energy.js` broom (a held long tool and its GRIPS), `engine/page/props3d.js` `phone(P)` (a held
  phone, its screen), `engine/page/props-halloween.js` bucket (a bucket and its bail grip),
  `storyboards/lookdev/make-zflat-bench.mjs` (bench pattern).
OWN: `engine/page/props-zhome.js` (a stub exists and is ALREADY registered in props3d.js: replace its body, keep the
  three export names), `storyboards/lookdev/make-zhome-bench.mjs` + its json. Touch nothing else.
CONTRACT (every size a spec key with this default; a potato is 0.95 m tall, its hand at about y 0.45-0.6):
  ztv      a 1.0 x 0.6 flat TV on a low 1.2 x 0.45 x 0.45 wooden bench, origin floor centre, screen faces +z. State
    `news` 0..2: 0 = a dark screen; 1 = a TV news picture: a hospital entrance with its glass doors blocked, a few
    figures in white protective suits, a lower-third bar; 2 = the same with a big red banner across the lower half
    reading "STAY INDOORS" (white capitals). `glow` 0..1 the screen's light (emissive). Drawn, not photographic.
  zphone   a phone held in a hand, screen faces +z at rot 0, 0.075 x 0.15. State `alert` 0..1: 0 = lock screen,
    1 = a red emergency alert: a warning triangle and "EMERGENCY ALERT" (white) on red. `glow` 0..1. GRIPS: `hand`
    (the hand holds its lower half, screen readable to the camera when the holder faces the camera and holds it up).
  ztub     a white enamel bathtub 1.6 x 0.72, rim y 0.55, along x, origin floor centre; a chrome tap and spout at its
    -x end on the wall side (-z). State `fill` 0..1 (water surface from the bottom to 4 cm under the rim; clear pale
    blue water, a few drawn highlights), `run` 0..1 (a stream of water from the spout into the tub with a little
    splash ring; 0 = dry tap). Solid like furniture (cast can stand beside it, not in it).
  zbottles a cluster of `n` (12) clear 1.5 l water bottles with blue caps, standing in rows `cols` (4) wide, origin
    floor centre of the cluster; state `full` 0..1 (water level in all of them).
  zpot     a steel cooking pot (diameter `d` 0.32, height 0.2) with two side handles; state `fill` 0..1 (water).
    GRIPS: `both` (two hands at the handles), `hand` (one handle).
  zcup     a small enamel camping cup (diameter 0.09, height 0.09, a handle), state `fill` 0..1. GRIPS: `hand`.
  ztally   tally marks drawn in black marker on a wall: a flat card (noOutline) `w` 1.0 x `h` 0.5, facing +z, origin
    its centre. `cols` 5 columns (one per friend), each column a group of marks: state `n` 0..12 marks per column
    (drawn in fives: four strokes and a cross stroke), hand-drawn, slightly uneven, deterministic per index.
  zmop     a mop: a wooden handle `len` 1.2 up +y from the origin (its bottom), a grey string head at the bottom.
    GRIPS: `hand` (upper), `low` (lower), like the broom's.
  zguard   a forearm guard: a magazine rolled round the forearm (a 0.2 long tube, 0.13 across, printed glossy cover
    colours), wrapped by three bands of grey duct tape. Origin = the wrist end, the tube runs from the origin back
    along -y (toward the elbow) so that held in a hand grip it lies along the forearm. GRIPS: `hand` at the origin.
    If a hand grip cannot put it along the forearm, say so and give the offset the director must use.
  zbucket  a plastic bucket (diameter 0.3, height 0.3, a wire bail), state `fill` 0..1 (rainwater) and `rain` 0..1
    (small ripple rings on the water surface, animated from t, deterministic).
Bench: one camera per kind, stills of each state at 0 and 1 (zbottles full, ztally n 0 / 7 / 12). Max 8 stills a run.
REPORT: the header text, the bench sheet path, anything in the contract you could not do.
