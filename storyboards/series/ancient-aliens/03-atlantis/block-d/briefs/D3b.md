TASK D3b: panels 42, 43, 44 at the paintings' level by CAMERA PROJECTION (round 2 of D3, same file)
WHY: the D3 stills are real 3D but plain against plates 42-44 (flat night walls, slab falls, a blob beam). The director's round
R2 (kit branch, merged into ours: commit 4e8ef08) found the fast route: the finished painting is PROJECTED from its own camera
onto real 3D surfaces at their depths (kind `atlantisplate` and `atlantis` with `proj: "plate03"` in engine/page/props-at-far.js).
From near the painting's camera the frame IS the painting; pushes and orbits up to ~8 deg keep real parallax. Look at
storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-far-vs.png first.
READ: the usage header of props-at-far.js (proj, atlantisplate, PLATES table) and the code of `projector`, `PLATES`, `wmat` (its
PROJ define) and the `atlantisplate` kind; you may IMPORT what is exported (ask nothing to be exported: if `projector`/`wmat`
are not exported, COPY the code you need into your own file with a comment naming its source; never edit props-at-far.js).
OWN: engine/page/props-at-d-ship.js (yours already), bench/make-at-ship.mjs + bench/at-ship-sheet.png, and new assets
assets/props/atlantis/d-plate-{42,43,44}.webp (made from /mnt/project-files/videos/ancient-aliens/03-atlantis/plates/
plate-42-city-midnight-storm.png, plate-43-city-ship-rising.png, plate-44-ship-underside.png; webp quality ~90).
CONTRACT (new kinds or a `proj` spec on yours; name them in the header):
- 42: the storm city as painted (plate 42), projected from the plate's camera onto: the sea plane (with your live storm sea
  blended in the near water so waves move), the brass wall cylinder r 2497 with its waterfalls, the city tiers/temple at their
  depths, the sky + lightning on a far dome. Spud's head in the swell stays real 3D in the front left of the frame (as the plate).
  Lightning: the clip param `lightning` still flashes the whole frame (brighten the projected sky/clouds, the bolts may stay
  painted or be your 3D bolts). Give the plate camera in the header (it becomes the episode camera; small pushes only).
- 43: the city-ship rising (plate 43): the painting projected onto the rising disc + hull (the projector moves WITH the rising
  group, so `rise` 0 -> 0.6 lifts the painted city as a whole), the falls and whirlpool as painted where they are, and your
  live 3D falls/spray/whirl blended at the foot so it moves. The plate's look holds at rise 0.6 (the camera's frame matches
  the plate there); at rise 0 the city sits in the sea (lower part under the water line).
- 44: the underside (plate 44): hull bowl, lenses, beam, falling sheets projected from its camera; the live beam with rising
  spray and the sea in front stay 3D. Spud (his head + headlamp) in the lower left, real 3D, like the plate.
- Keep the old kinds working (the generator uses shiphull, shipsea, shipstorm, shipwhirl, shipstars, shipring).
MACHINE: stills only, one at a time, as before. No layout/preflight/video/farm/commits.
DONE WHEN: bench stills from each plate camera (42 at lightning 0.3 and 1, 43 at rise 0.6 and at rise 0.3 mid-lift, 44) plus one
push of ~6 deg per shot; side-by-side vs the plate (`bench/at-ship-vs.png`: plate left, still right); compared twice.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words, with the three plate cameras.
