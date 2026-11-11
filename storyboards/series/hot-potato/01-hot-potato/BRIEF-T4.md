TASK T4: the Hot Potato stage, version 2: a round stage with four trapdoor tiles in a diamond, the host's balcony
  with a lever, and a clock card pinned to the screen (new options and kinds in the existing set file)
WHY: Jonny on draft 3 (11 Nov 2026): the game was not clear. The new staging puts three players in a triangle over
  the fryer with the evil host safe above them at a lever, and the clock always in the same corner of the frame, so
  one look says: pass the coal, at zero the floor opens.
DESIGN: `storyboards/series/hot-potato/01-hot-potato/panels-v2-sheet.png` (6 x 2 panels): the stage and balcony in
  02, 07, 12; the balcony close in 03; the stage from straight above in 10; the clock card in the top right corner
  of every panel. The felt-and-cardboard look of the existing kinds stays (white stitched borders, pastel felt).
RULES: CLAUDE.md "Rules that apply to every task"; `docs/rules/movement.md` only if you add motion beyond a param.
READ: `engine/page/props-hotpotato-set.js` (the whole file: it is the one you extend; its header is the contract of
  version 1 and must stay true for the old options), `storyboards/lookdev/make-hotpotato-set-bench.mjs`. Nothing
  else unless blocked.
OWN: `engine/page/props-hotpotato-set.js`, `storyboards/lookdev/make-hotpotato-set-v2-bench.mjs` + the json it
  writes. If a NEW kind needs a line in the `props3d.js` registry or its propState list, that one line is yours too
  (say which under FILES). Touch nothing else.
CONTRACT (world metres, x right, y up, +z toward the camera; every size is a spec key with this default; the old
  row-of-four layout keeps working unchanged when `layout` is not given):
  hpstudio  new option `layout: "diamond"`:
            - stage: a ROUND top, radius `stageR` 2.5, centre x 0 z 0, at y `stageH` 1.2, warm cream felt with one
              faint pastel ring stitched 0.25 in from the edge; a lilac felt fascia (#cdb7ee) 0.3 tall round the
              rim (y 0.9..1.2) with yellow felt stars every 0.6 m; six round posts down to the kitchen floor, OPEN
              between them (the vat and its oil show under the rim from the front).
            - holes: `holes` [[0, -1.15], [-1.2, 0], [1.2, 0], [0, 1.15]] (x, z): each a 0.9 x 0.9 square hole
              through the top, turned `holeRot` 45 degrees (a diamond, one corner toward the camera). The shaft
              under each hole is lined dark for its top 0.25 m only and is OPEN below: from straight above, the oil
              (a `fryoil` prop at y 0.47, not yours) must show through an open hole.
            - wall, the two clouds and the bunting stay. NO arch, sun, number card or sign in this layout (the sign
              moves to the booth, the clock to hpclock).
  hptile    unchanged, but prove it turned 45 degrees with the generic prop `rot: 45` in each of the four holes: it
            closes flush, and it swings down on its own back edge without cutting the stage top.
  hpbooth   the host's balcony, a puppet-theatre window. Origin = the centre of the balcony floor's BACK edge, on
            the wall (the director puts it at x 0, y 2.8, z wallZ). Floor `w` 2.2 wide x `d` 0.9 deep (toward +z).
            A parapet along the front edge, `rail` 0.45 high, 0.08 thick: pastel vertical felt stripes (lilac, pink,
            cream), a scalloped lilac skirt hanging 0.25 below the floor. Two cream posts at the front corners up
            to a pink felt roof at y `roofY` 2.0 above the floor: a scalloped pink valance 0.3 deep along its front,
            pink curtains tied back at both sides (each at most 0.3 wide, so the opening between them is 1.5 wide
            and 1.5 high). Inside: a dim violet back wall (#5b4a8a) so a golden potato stands out. On the roof's
            front: the sign, a wooden plank `signW` 2.3 x 0.5, HOT POTATO in bold dark-brown letters with a cream
            outline (the same lettering as the version 1 sign), a yellow star at each end.
            Not solid (scenery flags as the studio): the host leans over the parapet.
  hplever   the trapdoor lever. Origin = the centre of its base's bottom (the director stands it on the parapet).
            A brass base box 0.2 (x) x 0.1 (y) x 0.28 (z) with a slot; a steel stick `len` 0.45 from a pivot at
            the base's top; a round shiny red knob r 0.085 at its end. Param `pull` 0..1 (in propState, so it
            tweens): 0 = the stick leans 25 degrees BACK (toward -z), 1 = it leans 55 degrees FORWARD (toward +z).
            Put the knob's centre for pull 0 and pull 1 in the header (the host's glove rests on it). Not solid.
  hpclock   the clock card, pinned to the SCREEN, not the world: it is drawn at the same place in the frame in
            every shot whatever the camera does (vertex shader writes clip space directly, depth test off, drawn
            last, never culled, no outline, not solid, no shadow; it must also survive the top-down camera).
            Centre at `sx` 0.84, `sy` 0.17 (fractions of the frame from the left and from the TOP; frames are
            1080 x 1920), `size` 0.105 (the card's height as a fraction of the frame height; the frame's aspect
            comes from the renderer, so the card is never stretched). Look (sheet, top right of every panel): a
            cream rounded card with a brown border and one bold dark-red digit, a small smiling yellow sun with
            rays sitting on its top edge. Params: `num` 0..5 the digit (-1 hides the whole clock); `bump` 0..1 a
            tick (the card pops to 1.2 x and settles; in propState so it tweens); `alarm` 0..1 the card turns red
            with a cream digit and shakes a little (the bell at 0; in propState).
MACHINE: draft stills of your own bench only (`export CHROME_PATH=/opt/pw-browsers/chromium`). Another builder works
  on this box at the same time: one job at a time each, no layout pass or preflight on any other storyboard, no
  draft or full render. `node qa/golden.mjs` once at the end (the old layout must not change).
DONE WHEN:
- the header of `props-hotpotato-set.js` documents the new option and the three new kinds (every spec key and param
  with its default, origins, the lever knob's two positions) and the version 1 text is still true
- the bench shows, each with `hpvat` (w 5.4, d 5.4, at x 0 z 0.2) and a `fryoil` under the stage: (1) a wide from
  the front and high (camera about [0, 6.5, 8.5] looking at [0, 2.4, -0.8]) with all four tiles closed, the booth on
  the wall and the clock card showing 5; (2) the same with the FRONT tile open and hot: the oil's glow shows in the
  hole; (3) from straight above the stage centre (camera about [0, 9, 0.01] looking down): the diamond of tiles
  reads, the open hole shows the oil, the clock card is in the same corner, not stretched; (4) a close shot of the
  booth from the front (camera about [0.1, 3.9, 1.2] looking at [0, 3.75, -2.3]) with a stand-in cast potato
  (`potatobrawl/viking`, cast `y` = the booth floor) behind the parapet, the lever on the parapet at his left hand
  at pull 0, and again at pull 1; (5) the clock at num 0 with alarm 1
- you looked at your contact sheet next to the panel sheet; contact sheet at `out/hotpotato-set-v2-bench.png`
- `node qa/golden.mjs` unchanged
OUT OF SCOPE: the clown (task T3), coal, tongs, fire, confetti, sounds, the episode's generator, any other engine
  file.
