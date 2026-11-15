# Ancient aliens EP03 Atlantis: block threads B, C, D (15 Nov 2026)

Jonny 15 Nov, after block A's wide animatic: "build b,c and d aswell. because the video as such is good". Story and staging
of block A are approved; the look is not yet: his pick "All 3D like Stonehenge" (Spud looked pasted onto the painted
envs). Every block is built the same way: real 3D places, the PAINTINGS as the look target.

## What every block thread reads first
- `/mnt/project-files/videos/ancient-aliens/03-atlantis/STORY.md`: your block's table (times, voice lines, panels), part
  hooks, emotion map, fact rule, mute test, MrBeast lessons (twist per ~45 s, follow ask in D), clock rule.
- `DESIGNS.md` (same folder) for every piece; `sheets/` for the panels; `plates/plate-NN-*.png` = the finished painting
  of each place (painted from Jonny's approved panel crop): THE LOOK TARGET for your 3D.
- `kit/BOARD.md` (places, axes, lights, depth), `kit/briefs/COMMON.md` + `R-COMMON.md` (bench rules, side-by-side
  sheets `bench/at-<name>-vs.png`, painting crops allowed as textures on real 3D geometry in `assets/props/atlantis/`).
- PART HOOKS (Jonny 15 Nov: every tall part is posted as a short on its own): use `PART_HOOKS[block]` from `kit/at-kit.mjs`
  (voice, text up top, shot) for the tall cut's first 2-3 s; the part must stand alone (no "last time", no "next clue").
- `block-a/make-block-a.mjs` = the pattern (kit helpers `hostSay`, `atlantisClock`, `count`, `clueTag`, `score`,
  `partScore`, `hookOf`, wide + tall from one generator, `lines.mjs` + `measure-lines.mjs` for voice timing).
- Memory notes: feedback-character-must-sit-in-scene-2026-11-15, clip-lessons-pause-you-holds-2026-11-13.

## Your places (plate -> what you build)
Anything Spud or Plato stands on, touches, floats over or walks past is real 3D with depth, contact shadows and the
painting's light. Shots with no character (maps, the 1940 page) may stay painted or flat.

| Block | Story | Places to build in YOUR file | Kit kinds you reuse |
|---|---|---|---|
| B | 0:50-1:42 | 14 Sicily seabed + wreck + amphoras (also 13, 15, 16-17 palm), 21 shelf edge over the deep (also 22-24 the ask) | city wall + plate flash (R1), bridge + column for 19-20 (R1, light AT_NOON), far city (R2), `ingots` `fish` `bubbles` (T4), map 18 (`maproute`, T5) |
| C | 1:42-2:34 | 27/28 Bimini road + reef + aerial island and boat (also 25, 30), 34/35 Port Royal 1692 + its slide | edge road + foreman for 29 (R1, AT_EVE), marble step + ruler 31-33/36 (R3 `sea`, T4 `ruler`), page 26 (`pagemarks`, T5) |
| D | 2:34-3:24 | 37 Helike at night + its flood, 39 Plato's room + bronze lamp (also 47-48) | map 38/40 (`maproute`, `mapoutline`), night sea 41/46 (R3), city storm + city-ship + beam + hatch deck 42-45 (R2 `atlantis` / city-ship, `alien` crew + foreman), Plato (T6) |

## Files and ownership (one owner per file)
- Block B owns `engine/page/props-at-b.js` (`AT_B_KINDS` / `AT_B_GRIPS`), block C `props-at-c.js`, block D
  `props-at-d.js`. They are already registered in `engine/page/props3d.js`: never edit props3d.js.
- Your generator + benches live in `storyboards/series/ancient-aliens/03-atlantis/block-<x>/` (yours alone).
- Everything in `kit/` and the files props-at-city / -far / -sea / -seabed / -towns, costumes-plato.js are owned by the
  director thread ("Make ancient aliens Atlantis episode"). Round R (15 Nov) is rebuilding city, far city and sea at the
  paintings' level; merge `aa-03-atlantis-kit` into your branch when the director says it landed. Need a change in a kit
  file? Message the director thread; or build a block-local variant in your own file (you may import read-only).
- Branch `aa-03-atlantis-<x>` off `aa-03-atlantis-kit`; the director merges it into the kit branch at the join. No PR to
  main from a block thread.

## Order (lean: weekly limit)
1. Voice lines (`block-<x>/lines.mjs`, Reaper's voice like block A), measure them ALONE (VoxCPM2 is OOM-killed beside
   env splits, builders or renders). Lay the times on STORY.md's table; the film's length may move by a few seconds.
2. Your places in 3D (Sonnet `builder` agents, each owns only the files its brief lists; side-by-side vs sheet against
   the painting, at most 2 fix rounds). Start with the places no kit round is touching, then the city shots.
3. Wide animatic first (draft render, contact sheet, mute test), send it to Jonny in your thread; tall part only after
   his OK. Part hook = STORY.md's row (impossible fact in the first 2 s, the 2-4 word text up top).
4. Finals wide + tall in `/mnt/project-files/videos/ancient-aliens/03-atlantis/block-<x>/`, then tell the director.

## Engine lessons from block A
- fov at most ~36 where a backdrop is thin; push with fov, not dz, where the far edge shows.
- A prop registered once shows in every place: hide it outside its shot (tween y to -60) and reset flash values.
- `qa/preflight.mjs` caption-collide and safe-zone fails are real: move the caption (x 0.22W-0.72W, y F.NUM+80).
- Spud faces the camera within ~20° yaw on talking beats; he never holds anything.
- Never chain a render after a check with `;` or a grep: a FAIL must stop it.
