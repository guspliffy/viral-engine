# Block C builders (C1 Bimini underwater, C2 Bimini surface + above, C3 Port Royal 1692): read this first

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `aa-03-atlantis-c`. Do not commit.
Other builders work in this checkout at the same time: touch ONLY the files your brief lists as OWN.

WHY THIS IS 3D: Jonny (producer) saw block A built from paintings cut into layers and said Spud looked like he stood in
front of a picture. His pick: "All 3D like Stonehenge". Everything Spud stands on, floats over or walks past is real
geometry with depth, contact shadows and the place's light; the camera moves through it and parallax must read.
THE LOOK TARGET is the finished painting of each place (gpt-image-2, painted from Jonny's approved panel):
/mnt/project-files/videos/ancient-aliens/03-atlantis/plates/plate-NN-*.png (your brief names them) and the drawn panels
/mnt/project-files/videos/ancient-aliens/03-atlantis/sheets/ancient-aliens-03-sheet-3.png (panels 25-36). LOOK at them
before you start and again before every report: your bench stills must read like those paintings (colour, density,
light, the amount of detail), not like a game blockout. The kit's first 3D benches came out "far plainer than the sheets"
(flat blocks, flat water): that is exactly the failure to avoid.
DESIGN TEXT (sizes, palette, MUST layers): /mnt/project-files/videos/ancient-aliens/03-atlantis/DESIGNS.md section 0 (palette)
and the section your brief names. Every MUST layer there is part of DONE.

Jonny: "much love to the detail"; "new sceneries and props should look beautiful and well done". A still that looks
plain, bare, flat-coloured or "procedural" is not done. Beauty beats speed; if something cannot be made beautiful in the
time, report it rather than ship it plain.

HOUSE RULES (as storyboards/series/ancient-aliens/03-atlantis/kit/briefs/COMMON.md, which you also read):
- Hand-drawn Ghibli look, very detailed: every mark (pit, crack, plank seam, nail, shingle, weed blade, coral polyp
  cluster) has its own place, width and strength from a hash of its index; no tiling texture, no Math.random, no wall
  clock; animation only from params and the clip clock t passed to apply(ps, t).
- Painting crops ARE allowed as textures on real 3D geometry (e.g. the crust of a block top, a far house facade, a hill
  side) when that is the fastest way to the painting's look: crop with python3 + PIL from the plate into
  `assets/props/atlantis/c/<name>.png` (your OWN folder prefix given in the brief; keep each under ~600 KB, 1024 px max),
  load them async the way engine/page/props-at-towns.js buildEnvFlash does (TextureLoader + url(); the build must wait
  for the job the same way). Never a whole painting as a backdrop card, never a crop where the painted light disagrees
  with the 3D light.
- Realistic and physical: no sparkles, no magic glow. Light shafts are soft physical columns.
- WIDE FIRST: the film is 1920 x 1080; establishing views must be rich to the horizon, never a bare half of frame.
- Axes: +y up, +x screen right from the default camera, the default camera on +z looking -z, metres, real scale (Spud
  0.88 tall). Sea level y 0. Origin of a place kind = the place's centre given in your brief. The clip puts the prop at
  the place's x, z (kit at-kit.mjs P.<name>); your bench uses the same coordinates.
- Depth: the clip's `far` is 1500 (near 0.05): beyond 500 m never two surfaces closer than 1.5 m.
- Scenery is `userData.lookOnly` and not solid unless your brief names a standable top (with its height); place-wide
  merged meshes also set userData.surfaceOnly.
- Every animated value is a prop param with a spec.<name> start value, listed in your file's usage header; a param
  tweens only when the clip seeds it with a dur-0 set (see the header of engine/page/props-at-sea.js).
- Performance: CPU renderer (llvmpipe). Merge static geometry per material, instance repeats, draw canvas textures once
  per spec (cache by key). A bench still must render in under ~60 s.
- Your file starts with a usage header in the style of engine/page/props-at-sea.js: each kind, every spec key with its
  default, size, origin, params, standable tops.

REUSE (read their usage headers, never edit their files): `fish` (type "striped", engine/page/props-at-seabed.js),
`sea`, `seagulls`, `horizonland` (engine/page/props-at-sea.js), `shsky` (engine/page/props-sh-land.js), `aasky`,
`potatocrowd` (engine/page/props-aa-giza.js), set-stormlake.js's underwater look (read its UNDERWATER section, copy the
idea into your file if you need it; do not import from a set file unless it exports what you need).

BENCH: `storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-<name>.mjs` (pattern: kit/bench/make-at-sea.mjs:
one group per camera, wide frame, `far` 1500 at the top level). Your brief gives the cameras: they are the episode's
real shots, so build for them. Include Spud (cast id potatobrawl/spud) where the brief says. Generated bench JSON is not
committed. Stills: `node engine/render.mjs <bench.json> --stills <times> --draft --out out/<name>`; sheet:
`node qa/contact.mjs out/<name>/*.png --out storyboards/series/ancient-aliens/03-atlantis/block-c/bench/<name>-sheet.png`.
Also make a side-by-side: your still next to the plate (python3 PIL, same height) as `bench/<name>-vs.png`, and judge it.
Stills only: do NOT run --layout, preflight, a draft video, a full render or the render farm. 4 cores shared by five
builders: one still render at a time from you.
Two fix rounds against the plate before you report. Report as builder.md says (150 words at most).
