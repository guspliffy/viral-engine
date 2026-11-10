# NOTES: fff-01-bank-robbery (the director's working memory)

Brief (the target): `/mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md`.
No panels from Jonny. New series: the DRAFT goes to Jonny before the farm render (animatic gate).

## Where the build stands

- Step: review A done (7 notes applied in the generator); preflight to 0 fails, then the draft render
- Next: draft + `qa/check.mjs`, contact strips of each window in frame, review B on the draft, draft to Jonny
- Renders so far: drafts 0, farm renders 0; fix rounds on renders used: 0 of 3
- Trial line counters: engine/ grep or sed lookups ~45 (most before VOCAB.md existed on this branch); windows in frame 10

## Cast (from the generator; AX = -1.15, the alley is staged left of centre)

| id | character | at x,z | faces | holds |
|---|---|---|---|---|
| vik | duo/viking | AX, -1.15 | 0 | crate `shield` overhead 7.6-9.2 (grips.box), dropped at the hit |
| phx | duo/phoenix | AX-0.92, -0.4; huddled AX-0.66 | 16 | - |
| rea | never-has-money/reaper | AX+0.88, -0.4; huddled AX+0.64; lies in the bin from 22.85 | -16, 0 from "Freeze." | `bagR` in both arms 0-END (grips.box, secure(0,0)) |
| sam | duo/samurai | back to lens AX-0.85, 3.0 (2.85) and AX-0.78, 2.2 (6.35); street wall 10.2; bin's right end 26.1 | 180; -70 | worn `torch` 2.85-8.75 |
| god, dra | potatobrawl/allfather, dragon | street line x -+0.66, z -1.7; van doors 17.4 | 0; +-50 | worn riotshield to 12.65 |

## Props

Places: alley 0-8.75, 12.65-13.5, 20.15-29.6 · street 8.75-12.65, 17.4-20.15 · roof 13.5-16.1 · corner 16.1-17.4 ·
beach 29.6-END. `P(place, spec, {from, to, stay})` parks a prop under the floor (y -30, with a `reason`) while its
place is not up; `stay: true` for anything a `sit` reads (the lounger).
Crate row z 0.45, h 0.34. BIN x AX+1.95 = 0.8, z -0.4, 1.5 x 1.0 x 0.28, tag at tagX 0.72; Reaper lies with his base
at BIN.x-0.2 (eyes about BIN.x+0.5, hood tip right behind the tag).
Street: shield line z -1.7; wall of cars z -6.2. Van back at 0,-2.4, floor y 0.45. Roof blocks x -+2.35, top 1.0.

## Cameras (shot(env, pos, {tilt, fov}); tilt is added to MINUS the painting's pitch, so -8 = about level)

Probe before use: `node <scratchpad>/camprobe.mjs <env> "x,y,z tilt fov; ..."`.

| shot | pos | fov | env limit learned |
|---|---|---|---|
| HOOK | AX,0.95,5.3 | 46 | alley ok |
| TRIO_CU | AX,0.6,3.0 | 46 | ok |
| QUEST | AX,0.9,4.3 | 46 | |
| ONE(at) | x,0.8,z+3.0 | 34 | ok |
| STREET_W / VAN_W | 0,1.25,7.0 tilt -6 | 46 | z 8.6 fails |
| STREET_M | 0,1.15,4.4 tilt -6 | 42 | |
| ROOF_RUN | 0,1.0,5.0 | 46 | z 6 fails |
| ROOF_LEAP | 0,0.8,5.0 tilt +5 | 44 | fov 50 fails (sky) |
| CORNER | 0,0.95,5.2 tilt -5 | 40 | |
| ALONE -> ALONE_IN | 0.31,0.9,5.2 -> 4.7 (push-in) | 46 | |
| CRATE | BIN.x+0.1,0.85,3.9 | 40 | |
| LEAN | 1.35,0.9,5.0 | 48 | at z 5.2 x must be <= 1.45: the painted floor ends bottom right |
| BEACH | 0,1.75,5.2 tilt 0 | 42 | y under 1.73 fails; tilt 0 puts Reaper low so four text lines fit (tops 480-750) |

## Decisions, with the reason

- Five painted envs by `set.swap` instead of new paintings (alley, bus stop = market street, rooftop, crossing, beach).
- Review A: the police must be ON screen by 3 s, so the Samurai stands in the foreground, back to the lens, with a
  torch (before: only a siren wash, a light pool and a shadow from behind the lens).
- Alley staged 1.15 m left of centre so bin + officer fit inside the painted floor.
- FIGHT: Viking runs away from camera into a shield line that faces us; his 180 turn hides in the cut at the grin.
- Narrator lengths measured (out/speech): 13 lines, 0.55-2.3 s; clock re-timed to them, END 33.1.
- Fake-out: the glove hovers just over Reaper's eye (clear of the face rays), then drops to the tag in FRONT of it.
- End card: the three lines hold to END, "Which one are you?" under them (review A).

## Tried and dropped

- `crouch 1` to hide behind crates: drops only ~0.12 m. Duck = crouch + `move y -0.18`.
- `lean +90` tips to screen LEFT; `lean -90` to screen right, pivot at the base: lying needs `move y`.
- `--stills beats` gives 12 odd times: pass explicit times.
- Hiding a prop by scale 0.001: the clipping check still measures it. Park it at y -30.
- `land` without a flying state, and a run-off move after a place: the actor vanishes. Drop = `move y`.

## Names and facts looked up that `docs/VOCAB.md` didn't answer

- `move { y }` ends at that height; `fly { to: {x,y,z} }`; arm `"rest"` returns an arm.
- arm `{ o: [out, up, fwd] }`: `out` from the body's SIDE (0.42 m from the middle), negative = across the front; the
  glove ends ~0.15 above `up`; R hand is at -x for an actor facing +z.
- A box hold stays in the WORLD: carry it by hand at every move of the holder; prop rot = holder yaw + 180 or the arms cross.
- `allowClip` windows are on the VIDEO clock at gate 1: `V(t)` adds the hit-stop (0.1 s after HIT).
- Worn props: a "(worn)" window, or meshes with `userData.steam` (stage.js clipping skips them on this branch).
- narrator: `c.at(t, { macro: "narrate", line, voice: "narrator", caption: false, gain })` before `c.beats()`.
- env gate with `set.swap`: fixed in engine/load.mjs `envCoverageOf` (each stretch against the env that is up).

## Open findings (check, time, plan)

- qa/env.mjs prints "undefined frames" for swapped clips (cosmetic).
- A statement after `//` on the same line is dead code (the bag's tilt reset at the beach sat in a comment).
- Before the PR: `qa/golden.mjs` + `qa/regress.mjs` (load.mjs, props3d.js, stage.js, audio.mjs, two new prop files).

## State 10 Nov 10:40 UTC (after Jonny's notes on draft 2)

- Jonny on draft 2: fight more extreme with shooting and action; "i dont understand why flight got caught"; the tip into
  the bin read as a glitch; "its not clear why he didnt got arrested"; every outcome needs a logical cause on screen.
- Rework (draft 3): gunfire from behind the shield line (spellbolt tracers scale 3, lightpool muzzle flash, `gunshot`
  + `ting`), one ricochet blows up patrol car `carX` (carburst needs `on` TWEENED to 1, firesmoke `fire` too: spec values
  are not read); "Lost them!" is a close shot in the SAME street, the wide shot shows the van, officers, Viking netted in
  the van; Reaper never tips: the potato bin + tag stand in front of him from frame 0, officer leans in from the bin's
  right end (yaw -68, lean 28, camera-side L hand to his cheek then the tag), line "Nothing here. Just potatoes."
- Clock now: END 32.8; HIT = charge + 0.75; impact frames 2 (GO = HIT + 2/30).
- Before the farm render: `git fetch origin main && git merge origin/main` (main ea05117 has #189, #190, #193, #195).
- DELIVERY.md needs: Trial line; five counts (lookups ~60, layout runs ~25, check-fix rounds on renders 1, full renders,
  waiting steps); lessons review (what would have improved quality; what saves time/tokens next time); post pack.
- Counters: drafts 3 (draft 3 rendering), preflight runs 18, review A 1, review B 1 (on draft 2, superseded by Jonny).
