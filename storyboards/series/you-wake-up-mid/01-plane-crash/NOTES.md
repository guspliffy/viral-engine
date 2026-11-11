# NOTES: wake-up-mid-plane-crash (the director's working memory)

## Where the build stands

- Step: staging (builders done; generator retimed to the recorded narrator lines: 39.5 s A / 38.5 s B; all 13 cameras re-set 11 Nov)
- Next: layout 3 -> camfit every shot -> draft stills + sheet against the panels -> rough draft A + B -> Jonny (no polish before his go)
- Renders so far: layouts 3 (one aborted on a sound name), drafts 0, farm renders 0; fix rounds used: 0 of 3
- Step back named: builders started BEFORE the staging proof (the cabin did not exist, nothing to stage in); every size they build to is in briefs/ and the bench cameras are the shot cameras.

## The improvement loop

- Fix on test: vocabulary sheet + notes + peek (#190, lookups), layout reuse (#189, machine min), the eight rules (#195: layouts, fix rounds, waits). Director Fable 5.2 high.
- Comparison video: survive-it-ep1-snowed-in (20.8 s, new room + mountain, built to panels; 853 steps, 40 layouts, ~230 lookups, 4 renders, ~100 waits). This one: 35 s, new cabin + outside + car shot, new hero.
- Lookups so far (grep/sed of the engine for a name): 9 batches (docs/VOCAB.md did not exist on the branch: `node tools/vocab.mjs` writes it).
- Repeats: none yet. Check fails: none yet.

## Facts checked (two sources each, 11 Nov)

- ~30 s useful consciousness at 35,000 ft: FAA AC 61-107B table (30-60 s; 15-30 s after a rapid decompression), Flight Safety Foundation "For lack of a mask". Line kept.
- 90 s: the certification standard (14 CFR 25.803 / Appendix J; Federal Register 2004): everyone out in 90 s with half the exits. It is a time to get out, not a time until the cabin burns: line is now "Ninety seconds to get out. Leave everything."
- Distance: no source for 150 m / 500 ft. A cabin-crew study guide and an aviation emergency response guide both say at least 200 m upwind; code7700 says 100 yards. Line is now "Two hundred metres."

## World (set snowslope, dark 0; x right, z = the cabin's nose)

- Cabin `hall` at the origin: aisle |x| <= 0.5, seats A +2.09 / B +1.03 / C -1.03 / D -2.09, rows k -3..7 at z 1.35k, bulkhead + EXIT z 10.5, bins underside y 2.35. Hero seats (planeseat props): seatA, seatB (row 0), seatW (row 1 B).
- Outside: `jet` (jetwreck) at the origin from 27.0, rot -90 (nose -x, port/door/slide toward +z); before that parked, or riding ridePath(0.5..0.76) in the plough shot. Cabin props are parked (y -40) from 27.0.
- Car shot at [-300, 80, 0]: bridgeend, a stormsky card with valley-vista-sun.png behind it, rig "car" (hatchback), cast spud2.
- Everybody not walking rides a carrier (spudC, vikC, wizC); handC is the point Spud and the Wizard both hold in the drag.

## Names looked up (do not grep again)

- ride: A(t, who, "ride", { prop, off: [x, y, z], yaw, sit, dur }); prop: null gets off. Body y on a seat 0.3.
- a prop on the head: A(t, who, "grab", { prop, hand: "hat", keep: true }); A(t, who, "release", { prop, to: [x, y, z], dur: 0 }) puts it somewhere.
- caption options: c.cap(from, to, text, y, pop, { x, size, kinetic: false }); text pop at pixels: { fx: "pop", text, xy: [x, y], size, dur }.
- effects: { fx: "shake", amp, dur }, { fx: "flash", peak, dur, sound: false }, { fx: "sweat", who, dur, count }, { fx: "speedlines", dur }.
- carburst spec { at, r }; snowfront key run (rides ridePath), scale; stormsky spec { src, h }, faces +z.
- rig: sb.rigs [{ id, kind: "hatchback", color, pivot, keys: [{ at, pos, yaw, pitch, roll }] }]; cast { rig: "car", at: [0.55, 0.23] } + sit on a carseat prop; shot { rig: "car", pos, look, fov }.
- grips.mjs SIZE has no suitcase: Viking's suitcase is held with arms aimed at { prop: "trunk", grip: [...] } (draft); a real hold needs a SIZE entry + grip bench before polish.
- yaw: +90 faces +x, -90 faces -x, 0 faces +z. look targets: + right on screen, + up.
- music styles: house, disco, bounce, funk, chip, sneaky, lofi, march, warm (+ surf, polka). Picked march (tense, drums); Jonny judges.
- voices: narrator = VoxCPM2 "deep storyteller" (set up in this container: node engine/voice/setup.mjs --vox, done).

## Decisions, with the reason

- 2 + 2 seats, not 3 + 3 (panel 03): a potato is twice a seat wide; three abreast makes a wide-body.
- Panel 02 is mirrored (Spud right, Viking left from the front): his window is on the port wall in 01 and 03, so the wall cannot be on the other side in 02.
- Panel 03: row 0's seat backs are parked for the shot (seated potatoes are lower than a seat back; the panel's over-the-shoulder needs their heads).
- Panel 04 / 06: Viking and his seat are out of the shot; the camera looks from his place.
- Panel 07: camera on the exit side looking back (fire glow behind them), so Viking with the suitcase is between Spud and the way out; the panel shows the EXIT sign behind Spud, which would put Spud past the blockage.
- Panel 08: front view of the crawl, then a reverse (new) where his hand finds seat 7 and the EXIT sign comes out of the smoke: the plant "seven" needs its payoff on screen.
- The mask: on his face 3.9-11.5 (hose mask), round his neck from the brace on (neckmask), to the car shot.
- Wizard sits in the row ahead on the aisle, turned round on his seat (panel 04's place for him), not across the aisle.
- Panel 11: Viking and the Wizard stay small in the right background as drawn.
- No hit-stops or ramps: story clock = video clock (the two readouts and the narrator stay in step).

- A potato is ~1 m wide (Spud 1.2 m tall, seated top 1.53; Viking 1.41 / 1.72) and seat backs are taller than a seated potato: nobody is seen from behind a row, and two side by side need fov 50-70 or 5 m of distance. Panel sizes (drawn with small bodies) are not reachable in the cabin; eye lines and sides are kept.
- Panel 01: the hall's windows are painted cards, so a prop outside never showed. `clear: [0]` (new spec) leaves row 0's port window a real hole; the hall sits 0.65 m forward in shot 1 only, so that window is beside his face, not behind his head; the engine is placed on the sight line.
- Panel 04/06: the Wizard sits in the window seat in front of Spud (not the aisle seat) so one side view from the aisle holds both; row 1's aisle seat is parked for those two shots. In 06 he slams into the seat back ahead (a seat back is too tall to fly over).
- Subtitles: 1120 when the faces are above it; 640 (crawl, slide), 900 (ending A), 1250 (brace, impact) when the panel puts the face low. Clocks stay lower left (1265).
- Crawl pose: tip 38, y -0.05 (tip 62 / y -0.28 put the eyes under the floor: body pivot is 0.45 m up).

## Tried and dropped

-
