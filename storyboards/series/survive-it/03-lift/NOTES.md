# NOTES: lift (Survive it EP2, extreme chain v3 with Spud): the director's working memory

## Where the build stands

- Step: staging proof, second layout pass (11 Nov ~23:20 Berlin). Builders T1 + T2 done and committed.
- Next: camfit batch for the subtitles -> review A -> draft render -> check -> draft to Jonny (rule 2: no polish before his OK). Then golden (engine edits), merge main in (#194 qa/pops.mjs), push.
- Renders so far: drafts 0, farm renders 0; fix rounds used: 0 of 3
- Thread: "Make next Survive it episode". Jonny's go on the panels: 11 Nov 20:40 Berlin. Weekly limit nearly used: lean.

## The improvement loop

- Fix on test: vocabulary sheet + notes (lookups), eight rules (layouts, fix rounds, waits), ledger-count
- Comparison video: fff-01-bank-robbery (29.7 s, new series + sets) or Survive it EP1 (20.8 s, 853 steps)
- Repeats: none yet
- Check fails: 0 seen, 0 unseen

## Decisions (with reason)

- All 12 panels are shot in the real `elevator` set; outside shots (pit P10, space P12) add `liftshell` round the car and move the WORLD (pit, spring, sky), never the car: the cast stays on the set floor.
- Parked props wait at x 60 (FARX), not below the floor: qa/clear.mjs ignores height.
- No CABLE chip on the HUD (hud.js draws only "snow"/"warmth"): an engine change, left for after the draft. HUD = DAY + battery.
- Wizard = never-has-money/wizard (purple, matches the panels) which has NO staff; he taps the wall by hand in the time-lapse. Departure from P04 (staff on button 1000).
- No held booklet yet (draft): a grip costs check rounds before Jonny has seen the story.
- Cable anchor at z 0.95 (front of the roof): from the hallway camera the ceiling hides anything further back.
- Sounds are whitelist stand-ins: hit-metal (strand), firework (blast), slam (spring hit), seatclack (launch), crumble (roof). A real pick list comes after the draft.
- Spring replaces the counterweight, space replaces the city (Jonny saw both in the panels and said go).

- OPENER B, cold open (Jonny 11 Nov 21:17 Berlin, marketing thread: apply the opener rules to the next videos and test A vs B): the clip starts inside the day-30 free fall for 1.4 s (cast and props START in that state), flash + recordscratch, then day 1. Departure from P01. Name "opener B" in the delivery.
- Wide shots: the five stand within x +-0.95 (a tall frame cannot hold the 4.1 m car); the Samurai is placed at the wall only for the punch close-up, and he punches with his LEFT (the wall is on his left when he faces us).
- Bounce: two landings snap strands (6, then 1 glowing), the third hop's TOP (T.snap) takes the last one. Camera low in the hallway looking up, so the cable over the roof is in frame.
- Space: wide for 0.65 s (car over the Earth), then closer (REC) for "...New record." and the Astronaut.
- ENGINE BUG found and fixed (commit 3debddf): under set "ink" the arm skin's ink shell took a pixel width as clip space; a light-limbed character (Astronaut) hid the whole frame behind a grey shell. looks.js marks px, potato.js converts.
- Lids: 0 open, 1 shut. Prop start states come from the spec; a state at frame 0 also needs prop(0, id, {...}, 0).

## Names looked up (do not grep again)

- yaw: degrees, atan2(dx, dz): 0 faces +z (the hallway camera), 90 faces +x. `turn` takes the short way.
- cut cheat: place(t, who, at, yaw) at t - 0.02, move dur 0.01 steps 0. Cuts on the 1/30 grid rounded down (fr()).
- `fly` { to: { x, y, z } }, `pitch` (head over heels, degrees), `hop` { count, height }, `skin` { color, to }, `droop`, `crouch`, `squash` { amount }.
- fx: `{ fx: "shake", dur, amp }`, `{ fx: "impact", dur }`, `{ fx: "flash", dur, peak, color, sound: false }`, `{ fx: "speedlines" }`.
- narrator: c.at(t, { macro: "narrate", line, voice: "narrator", caption: false }) + c.cap. Needs `node engine/voice/setup.mjs` once.
- Sound whitelist: `node engine/sfx/whitelist.mjs <word>`; no twang/boing/explosion outside sci-fi.
- elevator set: walls x +-2.05, back z -1.6, front z 1.25, ceiling 3.4; camera inside (z < 1.2) shows the front wall and the hallway; `floorsign` back wall, `elevdoors` at z 1.27.

## Cast

| id | character | start x,z | role |
|---|---|---|---|
| spud | potatobrawl/spud | 0.0, 0.6 | lead, reacts; "Floor 800. Two seconds." / "...sure." / "TAKE IT!" / "NOT THE CABLE!" / "Floor 800!" |
| sam | duo/samurai | 0.95, 0.72 | the punch; "...New record." |
| wiz | never-has-money/wizard | -0.95, 0.45 | the reset; "Page two: 'Don't.'" |
| phx | duo/phoenix | -0.5, -0.8 | the bounce |
| gun | never-has-money/gunslinger | 0.6, -0.85 | the phone |
| ast | potatobrawl/astronaut | parked 9, 4 | "Going down?" |

## Props (kinds from the two builder files; read their headers, not the code)

panel liftpanel (right wall x 2.03, rot -90), cable liftcable, fire wallfire, blast liftblast, dark cardark, lamp alarmlamp, sparksL/R sparkrain, blobs fireblobs, shell liftshell, pit shaftpit, spring liftspring, pass shaftpass, sky spacesky, sign floorsign, doors elevdoors, phone.

## Cameras: CAM in the generator (A hallway wide, CU, WALL, GUN, SPUD, LOW, FALL, PIT, UP, SPACE, REC), fitted on stills in two passes.
- 11 Nov: rough draft rendered with --force. Reason: workflow rule 2 (the rough draft goes to Jonny before any hand or foot polish); the contact gate's 52 findings are polish (arms through hat brims in the screams, hand turns, rig jumps at cuts), none hides a story beat.

## Sound pass (after Jonny's OK on the rough draft)

- Music rule, Jonny 11 Nov 2026 22:30 Berlin (project memory feedback-music-supports-video-2026-11-11.md; read it first,
  it was not in the memory folder yet when this was written): music from 0.0 that matches the story's mood, changes at
  the turn, sits under the voice at about gain 0.45, one short theme per series. The draft still has the stand-in
  `{ style: "bounce", gain: 0.26 }`. Turns in this episode: the cut back to day 1 (1.4 s), the jam (4.5 s), the wall
  blast (9.2 s), the cable snap (16.55 s), space (20.55 s).
