TASK T1: the Hot Potato set: felt preschool-TV studio (hpstudio), trapdoor tile (hptile), frying vat (hpvat)
WHY: a game show that looks like sweet preschool TV, built over a deep fryer. The viewer must read at phone size: the
  smiling sun with its countdown number card, the HOT POTATO rainbow sign, four pastel floor tiles of which ONE glows
  red (the rule of the game), and a huge steel vat of bubbling oil under the stage (the danger).
DESIGN: Jonny's panel sheet `storyboards/series/hot-potato/01-hot-potato/panels-sheet.png` (5 x 2 panels; look at it
  first: panels 01, 02, 03 and 10 show every part). Copy its look: soft felt and cardboard, pastel colours, white
  stitched (dashed) borders, cute. It must not look like the dark Share or Steal studio.
RULES: CLAUDE.md "Rules that apply to every task" (deterministic: no Math.random, no wall clock).
READ: `engine/page/props-sos-set.js` (header + how a KINDS entry, canvasTex, FIRE_U castLight, steam puffs and
  `userData.solid = false` are done), `engine/page/props-sos.js` lines 1-60 and `sstrap` (a trapdoor with open / warn),
  `storyboards/lookdev/make-sos-set-bench.mjs` (the bench pattern). Nothing else unless blocked.
OWN: `engine/page/props-hotpotato-set.js` (a stub exists: replace it, keep the export name `HP_SET_KINDS`),
  `storyboards/lookdev/make-hotpotato-set-bench.mjs` + the json it writes. Touch nothing else (the registry lines in
  props3d.js are already in).
CONTRACT (world metres, x right, y up, z toward the camera; every size is a spec key with this default):
  hpstudio  origin = world origin on the KITCHEN floor (y 0). The cast stand on the stage top at y 1.2.
    - stage: top surface at y `stageH` 1.2 from x -2.2 to 2.2 (`stageW` 4.4), front edge at z `stageFront` 0.65, running
      back to the wall. Top colour warm cream felt. Front: a wooden plank fascia 0.3 tall (y 0.9-1.2) and five square
      wooden posts 0.14 thick down to the floor at x -2.1, -1.05, 0, 1.05, 2.1. Between the posts it is OPEN (you see
      under the stage). Four square holes through the top, 0.9 x 0.9, centred at x `tiles` [-1.425, -0.475, 0.475,
      1.425], z 0, each lined with a black shaft from y 1.2 down to y 0.3 (so a body dropping in is hidden by the
      shaft, never seen through the stage front).
    - back wall at z `wallZ` -2.7: 10 m wide, from y 1.2 up to y 8: sky-blue felt (#8fc4ee) with soft darker vertical
      folds like a curtain. Two cotton-wool clouds (white, puffy, about 1.0 x 0.45 m) at (x -1.5, y 4.0) and (1.5, 4.2).
    - bunting: one string sagging from (-2.8, 6.2) to (2.8, 6.2), lowest point y 5.8 in the middle, about 14 triangle
      pennants 0.28 wide x 0.34 tall, colours in turn pink #f29ac0, yellow #f7d154, teal #6fcfc3, lilac #b69be6.
    - rainbow arch: a flat felt half-ring standing on the stage top, centre (0, 1.2), outer radius `archR` 2.55, band
      0.55 wide in six pastel stripes (#f4a3a3, #f8c58c, #f9e79a, #a9e0a5, #9ccdf2, #c6aef0), 0.12 m in front of the wall.
    - sign: a wooden-look plank 3.3 x 0.62 (`signW`) with rounded ends, centre (0, `signY` 3.4), 0.25 m in front of the
      wall, tan #d9a066 with a dark brown outline, the words HOT POTATO in bold rounded dark-brown letters
      (#6b3a1f, cream outline) filling it, one yellow star 0.3 m at each end.
    - sun: centre (0, `sunY` 5.05), 0.4 m in front of the wall: a yellow disc radius `sunR` 0.6 (#ffd23f, orange
      outline), 12 triangle rays out to radius 0.95, a face: two closed happy eyes (arcs), a wide smile, pink cheeks.
    - number card: a cream rounded card 0.62 wide x 0.66 tall with a brown border, centre (0, `cardY` 3.95), hanging
      from the sun on two short strings, one bold dark-brown digit about 0.5 m tall.
    - params (read as ps.<key>, falling back to spec.<key>; all deterministic functions of the param and clip time):
      `num` (default 1): the digit on the card, 0..5; -1 hides the card and its strings.
      `bump` 0..1 (default 0): the card swings and pops (scale up to 1.2, a 12 degree swing) - a tick of the clock.
      `ring` 0..1 (default 0): the sun shakes (a +-6 degree wiggle at about 10 Hz) and its rays pulse - the bell at 0.
      `sing` 0..1 (default 0): the sun's smile opens into a round singing mouth.
    - every mesh of hpstudio is `userData.solid = false` (scenery, never something to touch).
  hptile  one trapdoor tile. Origin = the tile's centre at the stage top (the director puts it at y 1.2). Size `w` 0.9
      square, 0.03 thick, felt in `color` (default "#f6b8d0") with a white stitched dashed border 0.05 in from the edge.
      Hinge along its BACK edge (-z). Params: `open` 0..1 (the flap swings DOWN into the shaft, 0 flat .. 1 = 95
      degrees), `hot` 0..1 (the whole tile turns red #e8343f and glows: emissive, plus a soft red halo 0.25 m high
      above it that is see-through for the checks). Readable from a camera only 5 degrees above the stage: the red must
      be strong. `userData.solid = false` on all of it.
  hpvat   the frying vat. Origin = the centre of its footprint on the floor. A big open rectangular steel tub `w` 4.0
      (x) by `d` 2.9 (z), rim at `h` 0.55, walls 0.05 thick, a rolled 0.06 lip, light brushed steel (#b9bec7), darker
      inside. One wire fry basket (about 0.5 x 0.35 x 0.3, with a handle) hangs over the rim inside the RIGHT end near
      the front (decor). The oil is NOT drawn here (the director adds the existing `fryoil` prop at y 0.47).
      `castLight` k (default 0.6): the shared fire light exactly as ssfryer does it (FIRE_U at the vat's centre, colour
      #ff8a2a). `haze` (0.35) and param `churn` 0..1: steam exactly as ssfryer (copy that code): a gentle haze, and a
      surge of puffs and amber droplets with churn. The steel is solid; steam and glow see-through for the checks.
MACHINE: draft stills of your own bench only (`node engine/render.mjs <bench json> --stills beats --draft --safe`, with
  `export CHROME_PATH=/opt/pw-browsers/chromium`). No layout pass, no preflight, no draft or full render: the director
  is using the machine. One stills job at a time.
DONE WHEN:
- the file starts with a usage header (the kinds, every spec key and param with its default, sizes, origins)
- the bench (no cast) shows, one still each, from the camera pos [0, 3.23, 10.7] look [0, 2.35, 0] fov 33.4:
  (a) rest: num 1, the first tile hot; (b) num 0, ring 1, first tile open 1; (c) num 5, second tile hot, sing 1;
  and from pos [-0.3, 1.83, 4.1] look [-0.3, 2.14, 0.1] fov 41.2: (d) num 4, second tile hot.
  The bench places hpstudio at the origin, four hptile at x -1.425, -0.475, 0.475, 1.425 (y 1.2, z 0) in pink
  #f6b8d0, mint #bfe8d0, yellow #f9e7a0, lilac #d6c3f2, hpvat at (0, 0, 0.87) and
  `{ id: "oil", kind: "fryoil", x: 0, y: 0.47, z: 0.87, w: 3.86, d: 2.76 }`; set
  `{ type: "plain", color: "#8fc4ee", floor: "#4a4350", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true }`.
- you looked at your contact sheet next to the panel sheet: the sun, card digit, sign text and red tile read at 360 px
  wide; the oil shows in the vat in front of and under the stage; nothing is black, missing or z-fighting
- contact sheet at `out/hotpotato-set-bench.png` (`node qa/contact.mjs <stills...> --out out/hotpotato-set-bench.png`)
OUT OF SCOPE: characters, the coal and other hand props (task T2), confetti (exists), sounds, the episode's generator,
  any engine file other than yours.
