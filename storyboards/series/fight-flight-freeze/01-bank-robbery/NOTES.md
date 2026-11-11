# NOTES: fff-01-bank-robbery (the director's working memory)

Brief: `/mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md`. Jonny's notes
on the drafts are newer than the brief and win. New series: the DRAFT goes to Jonny before the farm render.

## Jonny's notes (the target)

- Draft 2 (10 Nov): fight more extreme "with shooting and action"; every outcome needs a cause on screen.
- Draft 3 (10 Nov 15:42 UTC): "cut the forced jokes out", "more realistic and serious", "logic to this series not just
  random followups". Out: "One down." / "Two down.", "Flight was fast. In a circle.", Phoenix walking into the van,
  Reaper behind the potato bin. In: a hidden place in a house; Viking goes out to fight and is caught; Phoenix runs,
  the police chase him and so miss Reaper; "Viking lasted x" and also "Phoenix lasted 3 days". Keep the first 8 s and
  the voice, change only the scenery.

## The story chain (draft 4, 31.3 s)

1. 0-8.15 the hall of a dark house: high-five over the loot, sirens, they duck behind three crates. Police cutaway in
   the street (2.85). Three faces, FIGHT / FLIGHT / FREEZE (Reaper freezes DOWN behind his crate), the big question.
2. 8.15-13.45 Viking roars out; street: gunfire, the patrol car blows up, the wall of cars, the net. "Fight lasted
   four seconds." (unchanged from draft 3).
3. 13.45 from the hiding place: an officer steps in through the open front door, torch on. "They're in here."
4. 14.8 close: the torch's pool crawls along the crates to Phoenix. 16.0 he bolts over the crates, past the officer,
   out of the door. "He's running! After him!" The officer runs out.
5. 18.1 Reaper alone, the police lights leave. "Everyone chased Flight." runs on over the roof chase (19.6) and the
   leap (20.7, the cover).
6. 22.2 "Three days later.": Phoenix asleep on a far beach; 23.7 two officers step in; he gets up, hands up.
   "Flight lasted three days."
7. 26.7 the silent hall: Reaper's eyes go left, right; "Nobody ever searched the house."; he comes up from behind the
   crate and breathes out. 29.8 "Which one are you?"

## Places

`PLACES`: hall 0, street 2.85, hall 3.65, street 8.75, hall 13.45, roof 19.6, beach 22.2, hall 26.7.
The hall is the built set `nighthall` as a ROOM inside the env set: `set.swap: [{ at, room: { type: "nighthall",
pos: [0, 0, 3] } }]` (new in engine/page/set-env.js, sets.js, load.mjs on this branch). Moved 3 m toward the lens: the
open front door is on the LEFT wall at z 1.1-2.3, the far wall at z -4.2, walls at x +-1.4. The first env (street)
gives the clip its light. A room brings its own background colour (what shows past the door).

## Cast and props in the hall

| id | at x,z | notes |
|---|---|---|
| vik | 0, -1.15 | lifts the small crate `shield` at the roar |
| phx | -0.92, -0.4; huddled -0.66 | ducked again from 13.45; flies out of the door at 16.0 |
| rea | 0.88, -0.4; huddled 0.66 | ducked (crouch 1, y -0.18) from 2.2 to 28.95; `bagR` in both arms (grips.box) |
| sam | door: -0.55, 1.95 | worn `torch2` 13.45-18.1; cheated to -1.05, 2.75 for the close shot at 14.8 |

Crates `crateL/M/R` x -0.92, 0, 0.92 at z 0.45, h 0.34. Money bags `bagL`, `bagM` on the floor in front of the row.
`backInHall(t)`: after every cut back to the hall Reaper and his bag are put back in the frozen pose (the prop loop
restores a prop's spec height when its place comes back).

## Cameras

Front shots in the hall use `shot("hall", ...)` = the old alley framing (the alley painting's pitch). `REV` looks from
behind the hiders at the door: pos 0.95, 1.25, -2.9, look -0.7, 0.72, 1.5, fov 50. Beach: 0, 1.9, 6.8, tilt 0, fov 46
(the frame is only 2 m wide at the old 5.2 m / fov 42).

## Facts looked up this round

- Voice lengths come from `out/speech/*.json` `dur` (narrator: fightOut 2.16, chased 2.28, flightOut 2.41, searched
  2.61, which 1.32). The table in draft 3 had fightOut at 1.6: wrong, measure after every new line.
- No "asleep" expression: `serene` + `face { lid: 1 }`. Lying on a side: `lean -90` + `move y 0.4` (base to the left).
- `pr()` on a prop id that does not exist is a no-op (the generator's helper checks `has(id)`).
- Yaw: 0 faces the lens (+z), 90 faces +x, 180 faces away; from the reverse shot 180 is face-on.
- A potato in profile reads as a back: for a face in the reverse shot keep the yaw within about 45 of 180.
- The deckchair's front posts cross the face of a wide character (Phoenix): not used.

## Counters (Trial line, five counts)

Drafts 3 sent (draft 4 next), farm renders 0, check-fix rounds on renders 1 of 3, preflight runs 20, still rounds 5,
engine lookups ~75, windows in frame 6, review A 1, review B 1 (draft 2).

## Delivery to-dos

One farm render only after Jonny's go; `qa/check.mjs --ears`, `qa/risky.mjs`; DELIVERY.md (departures, warnings,
`qa/waivers.mjs --md`, Trial line, five counts, lessons review); cover without text (the leap); post pack; PR with
`qa/golden.mjs` + `qa/regress.mjs` green (engine edits: set-env.js, sets.js, load.mjs, props3d.js, stage.js,
audio.mjs, two prop files).
