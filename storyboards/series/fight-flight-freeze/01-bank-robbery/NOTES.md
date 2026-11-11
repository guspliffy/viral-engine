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

- Draft 4 (11 Nov 11:09 UTC): "kind of yes"; police cars seen through a window; Phoenix runs out of the door "instead
  of the officer coming in"; "more dramatic and 10x more extreme"; the roof flight "quite useless", the beach "weird",
  "rather catch him at the airport while trying to board into a plane".
- Draft 5 (11 Nov 11:55 UTC): "well done, go".

## The story chain (draft 5 = the cut, 29.7 s)

1. 0-8.15 the hall of a dark house, a window behind the three: high-five over the loot, sirens, police cars roll up
   outside the window (1.6), they duck behind three crates. Street cutaway (2.85). FIGHT / FLIGHT / FREEZE (Reaper
   freezes DOWN behind his crate), the big question.
2. 8.15-13.45 Viking roars out; street: gunfire, the patrol car blows up, the wall of cars, the net. "Fight lasted
   four seconds."
3. 13.45 the hall from the front: megaphone "COME OUT WITH YOUR HANDS UP!", a searchlight sweeps the floor, Phoenix
   sweats.
4. 15.5 reverse shot: Phoenix flies out of the front door by himself. "HE'S RUNNING! AFTER HIM!" The car at the door
   tears off.
5. 17.1 Reaper alone, the cars leave the window, the lights go. "Everyone chased Flight." runs on over the street
   chase (18.5): three cars, a searchlight, a second car going up (the cover, 19.65).
6. 20.1 "Three days later.": the airport apron, Phoenix walks to the plane with a suitcase; 21.5 two cars cut him
   off, the case falls, he runs back, stops, hands up, two officers walk in. "Flight lasted three days."
7. 25.1 the silent hall: Reaper's eyes go left, right; "Nobody ever searched the house."; he comes up and breathes
   out. 28.2 "Which one are you?"

## Places

`PLACES`: hall 0, street 2.85, hall 3.65, street 8.75, hall 13.45, street 18.5, air 20.1, hall 25.1.
The hall is the built set `nighthall` as a ROOM inside the env set: `set.swap: [{ at, room: { type: "nighthall",
pos: [0, 0, 3], window: { x, y, w, h } } }]` (engine/page/set-env.js, sets.js, load.mjs, set-nighthall.js on this
branch). Moved 3 m toward the lens: the open front door is on the LEFT wall at z 1.1-2.3, the far wall at z -4.2,
walls at x +-1.4. The first env (street) gives the clip its light. A room brings its own background colour.
The airport is the painted env `airport-apron-sunrise` (engine/plates/env.py, seed 8 of 9).

## Cast and props in the hall

| id | at x,z | notes |
|---|---|---|
| vik | 0, -1.15 | lifts the small crate `shield` at the roar |
| phx | -0.92, -0.4; huddled -0.66 | ducked again from 13.45; flies out of the door at 15.5 |
| rea | 0.88, -0.4; huddled 0.66 | ducked (crouch 1, y -0.18) from 2.2 to 27.35; `bagR` in both arms (grips.box) |
| sam | hidden at 5.6, -7 | only the megaphone voice at 13.75 |

Crates `crateL/M/R` x -0.92, 0, 0.92 at z 0.45, h 0.34. Money bags `bagL`, `bagM` on the floor in front of the row.
Window cars `winA/B/C` stand 0.5 m above the hall floor, 4 m behind the glass (`staged`), with a siren wash `winwash`.
`backInHall(t)`: after every cut back to the hall Reaper and his bag are put back in the frozen pose (the prop loop
restores a prop's spec height when its place comes back).

## Cameras

Front shots in the hall use `shot("hall", ...)` = the old alley framing (the alley painting's pitch). `REV` looks from
behind the hiders at the door: pos 0.95, 1.25, -2.9, look -0.7, 0.72, 1.5, fov 50. Chase: 0, 1.25, 7.0, tilt -6,
fov 46. Airport: 0, 1.4, 8.0, tilt -6, fov 46 (wide enough for both officers).

## Facts looked up this round

- Voice lengths come from `out/speech/*.json` `dur` (narrator: fightOut 2.16, chased 2.28, flightOut 2.41, searched
  2.61, which 1.32). The table in draft 3 had fightOut at 1.6: wrong, measure after every new line.
- No "asleep" expression: `serene` + `face { lid: 1 }`. Lying on a side: `lean -90` + `move y 0.4` (base to the left).
- `pr()` on a prop id that does not exist is a no-op (the generator's helper checks `has(id)`).
- Yaw: 0 faces the lens (+z), 90 faces +x, 180 faces away; from the reverse shot 180 is face-on.
- A potato in profile reads as a back: for a face in the reverse shot keep the yaw within about 45 of 180.
- Navy police cars vanish against a night sky: show them by headlights, the light bar and a siren wash.
- A painted plane comes out with fake lettering unless the prompt says "plain white unmarked".

## Counters (rule 8, the ledger row)

Drafts 5, farm renders 1, check-fix rounds on renders 1 of 3, preflight runs 27 (+6 windowed), still rounds 9,
engine lookups ~90, windows in frame 7, review A 1, review B 1 (draft 2), 9 env paintings (1 kept).
Repeats noted (improvement loop, step 3): full preflight (~4 min) re-run for one moved prop: windowed layout first;
the story was rebuilt three times after a draft because the chain was not agreed in words before building.

## Delivery to-dos

`qa/check.mjs --ears`, `qa/risky.mjs`; DELIVERY.md (departures, warnings, `qa/waivers.mjs --md`, five counts,
lessons review); cover without text (the second blast, 19.65); post pack; PR with `qa/golden.mjs` + `qa/regress.mjs`
green; one ledger row (`node tools/ledger.mjs add`).
