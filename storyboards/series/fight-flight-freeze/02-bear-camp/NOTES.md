# FFF 02 "Bear in the camp": director's notes (read first after a compaction)

Thread "Make Fight, Flight or Freeze bear episode" (12 Nov 2026), director Opus 5.5 (MODEL SPLIT trial video 1 of 3:
only the bear's design went to a Fable 5.2 subagent -> BEAR-DESIGN.md; builders Sonnet). Branch fff-02-bear-camp.
Target: panels-sheet.png AS DRAWN (Jonny 16:43 "the scene is good"); only the closing lines changed (CHAIN.md end).
Improvement loop: fix on test = the draft prints its own pops line (#207): should keep full renders at 1.
Comparison video: fff-01-bank-robbery (29.7 s, 5 drafts, 2 renders, ~90 lookups, 27+6 layouts).

## State
- generator make-bear-camp.mjs written; `--blocking` = sabretooth x1.05 for the bear, camptent x1.85, citycar, cardbox
  cooler, pinetrunk; new sounds skipped. qa/env.mjs clean (all shots inside the paintings' safe range).
- T1 camp props (props-bearcamp.js) and T3 sounds (soundgen) with builders; bear design with Fable, build = T2 next.
- voice: `node engine/voice/setup.mjs --vox` (narrator is VoxCPM2) running in the background.

## Places and cameras
- envs: storm-pine-clearing (camp, the painting looks 11.9 deg UP: tilt - is down; safe x +-2.7, y >= 0.65, pan +-10,
  tilt +-8, fov <= 52), lake-sunset (dawn: x +-0.59, y >= 1.14, z 3.4-5.4). Every shot looks down -z.
- camp: tent (0,0) door to -z; car (1.3,-5.6) facing the tent; lantern (0.9,-1.45); pine (-2.4,-2.8); fire (-1.15,2.1);
  cooler (-0.15,2.35). Inside the tent the three face +z (us), the door behind them.

## Decisions
- 01 cold open = the 05 moment seen from outside (bear behind the tent ripping the fly toward us).
- 08 the shot up the pine is taken from 4.3 m up (the painting has no sky above +5 deg).
- labels FIGHT/FREEZE/FLIGHT via c.textPop (the sheet draws speech bubbles).
- music: orchestra-chase 0 -> dawn, then sad (rough draft; a laid score like back-to-life's make-score.py if needed).

## Names looked up
- qa/env.mjs <full sb path> (not the id); --range <env>. engine/music.mjs `until` + `then`. c.textPop(t, who, text, o).
- narrator voice needs the --vox setup (VoxCPM2). New ai/ sounds must be on assets/sfx/whitelist.json (measure.mjs).
- bear: BEAR-DESIGN.md by Fable (2.0 m long, scale 1.05 in the clip = 2.54 m reared); build T2 by a Sonnet builder.
- T2 bear done (ea77bbc + fix 13ef484): mouth = bearMouth(params,{x,y,z,rot,scale}) export, not carry; climb trunk axis bear-local z +0.50, shoot from behind the bear, climbpine rot 180.
