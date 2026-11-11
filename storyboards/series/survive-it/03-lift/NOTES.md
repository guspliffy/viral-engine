# NOTES: lift (Survive it EP2, extreme chain v3 with Spud): the director's working memory

## Where the build stands

- Step: staging proof (generator first pass written 11 Nov; floor plan clear)
- Next: builders T1 (props-lift.js) and T2 (props-lift-fx.js) report -> draft stills at the 12 panel times -> camfit batch -> layout -> review A -> draft to Jonny (rule 2: no polish before his OK)
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
| spud | potatobrawl/spud | 0.05, 0.6 | lead, reacts; "Floor 800. Two seconds." / "...sure." / "TAKE IT!" / "NOT THE CABLE!" / "Floor 800!" |
| sam | duo/samurai | 1.3, 0.72 | the punch; "...New record." |
| wiz | never-has-money/wizard | -1.2, 0.45 | the reset; "Page two: 'Don't.'" |
| phx | duo/phoenix | -0.7, -0.8 | the bounce |
| gun | never-has-money/gunslinger | 0.75, -0.85 | the phone |
| ast | potatobrawl/astronaut | parked 9, 4 | "Going down?" |

## Props (kinds from the two builder files; read their headers, not the code)

panel liftpanel (right wall x 2.03, rot -90), cable liftcable, fire wallfire, blast liftblast, dark cardark, lamp alarmlamp, sparksL/R sparkrain, blobs fireblobs, shell liftshell, pit shaftpit, spring liftspring, pass shaftpass, sky spacesky, sign floorsign, doors elevdoors, phone.

## Cameras: CAM in the generator (A hallway wide, CU, WALL, GUN, SPUD, LOW, FALL, PIT, UP, SPACE), first guesses, not yet fitted.
