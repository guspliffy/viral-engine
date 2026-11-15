# Atlantis EP03 block D: notes (thread "Build Atlantis episode block D")

- Generator: make-block-d.mjs, one storyboard per frame (aa03-d-wide, aa03-d-tall with --tall). 50.0 s, music score(154).
- Places: Helike PLACE(30), Plato's room off the grid at [100000, 100000] (its 8.9 km outside sky dome showed as a
  pale wedge from the night sea 20 km away), hatch PLACE(32), plate 42 PLACE(33), night sea PLACE(35), plates 43/44
  at x -40000 / -80000 (they reach 14 km; far 16000).
- Panels 42-44 = builder D3b's `shipplate` (each painting projected from its own camera onto 3D). Pushes are fov only.
  The plate sea follows the camera, so it is drawn only within `reach` of its place (12 km / 20 km).
- 42: Spud 34 m in front of the plate camera is small (a known look gap). The old 3D city-ship kinds (shiphull,
  shipsea, shipstorm, shipwhirl) stay in props-at-d-ship.js; 46 still uses shipsea + shipstars + shipring.
- Contact windows (allowClip) name each place-wide mesh with a reason; each was looked at on the draft.
- Lessons: an overlay on a plate keeps showing after a plate swap (set dots 0 first). bloom/satsuei/ink/hatch/cel
  set keys made an orange haze in the room. A worn headlamp does not hide with its actor (keep the actor off camera).
  A swim from -2.4 back to the surface makes the engine splash: do it while the actor is hidden.
- Finals 15 Nov (farm runs 43746007625 wide, 43746015819 tall): both checks PASS, no pops. Story time 150-200 (block B
  is 48 s): T0 150, score(150) wide, partScore("d") tall. The quake shake on the hook is amp 0.22 (0.5 threw Spud out of
  frame for one frame). Tall maps use a window of at most 576 plate px so the plate fills the frame.
