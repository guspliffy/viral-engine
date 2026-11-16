# Ancient aliens EP03 Atlantis: kit BOARD (15 Nov 2026)

EP03 "Where did Atlantis go?", about 3:24, WIDE film (1920 x 1080, `"frame": "wide"`) in four blocks, each also cut
tall (1080 x 1920) as a part. Story, facts, the DESIGN TEXT and the four drawn panel sheets (Jonny OK'd them 15 Nov):
`/mnt/project-files/videos/ancient-aliens/03-atlantis/` (STORY.md, RESEARCH.md, DESIGNS.md, sheets/*.png). DESIGNS.md is
the spec for every new piece (sizes, palette, layers); this board only adds what the engine needs: places, axes, scale,
lights, depth, and the owner files. Where DESIGNS.md and a sheet differ, DESIGNS.md wins (its FIX lines are deliberate).
Reused as built: Spud + headlamp, alien crew + foreman, ring ship drawing (props-aa-ship.js), `starfield`, `moon`,
stormlake's underwater fog / shafts / silt, the pilot's `hostSay`, `clueTag`, counters.

Jonny 15 Nov: "create the video with much love to the detail" and "the new sceneries ... and new props all should look
beautiful and well done". Every piece's MUST layers in DESIGNS.md are part of DONE; a bench still that looks plain or
bare is not done.

## 1. Places, axes, scale

- One place per set, each with its own origin o = [x, z] = PLACE(i) on a 20 km grid (kit at-kit.mjs), so no set's far
  ground lies under another. Axes in every place: +y up, +x screen right from the default camera, the default camera
  stands on +z and looks toward -z. Metres, REAL scale, Spud 0.88 tall.
- THE CITY place (i 0): the centre of the citadel island is the origin. The great canal and the open sea are +z (toward
  the default camera), the mountains -z. Ring radii exactly as DESIGNS.md section 1 (citadel 0-462 ... brass wall
  2497). Heights x 6 and footprints x 3 apply only to the FAR layer (beyond about 300 m from the near set pieces).
  The front gate and harbour basin sit on +z at r 2497; panel 01's harbour wall (Spud's quay) is the basin's left quay.
- DEPTH: the city place renders with `"far": 9000`; the other places with `"far": 1500`. The engine's near plane is
  0.05, so at 2 km the depth step is several metres: far pieces never lay two surfaces closer than 1.5 m beyond 500 m
  (roofs are raised boxes, not decals; ring water sits 2 m under the quays). Aerial shots (03, 07, 43 wide) set a
  per-shot `near` of 20.
- SEA LEVEL is y 0 in every place with water. Underwater shots put the camera below 0 (stormlake's rule turns the
  underwater look on when the camera's y < 0).

## 2. Lights and the clock (one storyboard per light, as in EP02)

| Light | Story time | Clock | Use | Sun (az left of -z, el) |
|---|---|---|---|---|
| AT_DAWN | 0:00-0:50 | 24:00 -> 17:20 | city A, Gibraltar today, Sicily seabed | (35, 8) |
| AT_NOON | 0:50-1:42 | 17:20 -> 10:30 | city B (first quake) | (10, 65) |
| AT_DAY | Bimini, step, Port Royal | | tropical bright | (20, 55) |
| AT_EVE | 1:42-2:34 | 10:30 -> 03:40 | city C (storm, water over the road) | (60, 6) copper |
| AT_NIGHT | 2:34-3:24 | 03:40 -> 00:00 at 2:58 | Helike (moon), night sea, city D storm, Plato's room | moon (30, 35) |

The clock is the time Atlantis has left: 24:00 at 0:00, 00:00 at story time 178 s, linear (one clock minute = 0.124 s).

## 3. Owner files (one builder each; the director wired the exports into engine/page/props3d.js)

| Task | File | Exports | Pieces (DESIGNS.md section) |
|---|---|---|---|
| T1 | props-at-city.js | AT_CITY_KINDS / _GRIPS | the near city: three walls with plates and the flash, harbour quay, bridge deck + gate tower, scaffold + plate fitting, plate bench, column, edge road, trireme (3D), canal cut-away + modern canal (1) |
| T2 | props-at-far.js | AT_FAR_KINDS / _GRIPS | the city far layer (aerial + backgrounds, four light states, the rising sea), mountains and plain, the city-ship (hull, falls, beam, whirlpool, hatch deck, far ring) (1, 2) |
| T3 | props-at-sea.js | AT_SEA_KINDS / _GRIPS | the sea surface (all gradings, night swell, a round hole for the city), Spud's rock + scroll, horizon pieces (the Rock, Africa, island coasts), marble step + ruler, gulls (5, 9) |
| T4 | props-at-seabed.js | AT_SEABED_KINDS / _GRIPS | Sicily seabed + wreck + 39 bars + shelf edge, Bimini road + reef + aerial island and boat, fish schools (3, 4) |
| T5 | props-at-towns.js | AT_TOWNS_KINDS / _GRIPS | Port Royal + its sinking, Helike + its flood, the sea map, the 1940 page, Plato's room + bronze lamp (6, 7, 8 room) |
| T6 | costumes-plato.js + characters/ancient-aliens/plato.json | (costume) | Plato (8) |
