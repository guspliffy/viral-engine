# NOTES: wake-up-mid-plane-crash (the director's working memory)

## Where the build stands

- Step: v4 FINAL CUT. Jonny on the v4 rough drafts, 11 Nov 21:45 Berlin: "go i like both". Polish done in 3 check rounds (preflight fails 83 -> 46 -> 15 -> 2, the last two removed behind the cut to the run); main merged in (a820da4); music gain 0.3 -> 0.4 (his new default: supporting music, ~0.45 under the voice; the bed ducks under voice and hits). A 35.8 s, B 34.9 s.
- Next: last preflight on both cuts + golden on the merged tree -> one farm render per cut -> strips of the render -> DELIVERY.md, post pack, ledger row, PR. Opener type A (trouble running at frame 0; first person, so rule 2 only from 1.0 s).
- Polish lessons: (1) three bodies fill a cabin close-up: tilt the camera down so the seat fronts are free for the subtitle (y 1272), clocks top left, captionBand widened to [240, 1360]; (2) in the 1 m aisle only the corridor |x| < 0.5 is seen from an aisle camera: stage two-shots in rows 0-2 (the port seats there are props and park) with the camera at z 3.5; (3) a cut cheat on pitch/lean/arms can land a frame late: pose a character while he is off screen (the shot before) or ease it on screen; (4) a body riding a carrier out of a hull must start inside the hull, not parked (pop); slides at one speed ("in" ended at 60 cm a frame); (5) the Wizard's face needs pitch under 25 or the hat covers it; (6) props that hang or fly take `staged: "<reason>"`.
- Windows: 21 (hall x3, jet x3, slide x3 are hollow shells or the ride itself; seats, belt, brace hands, suitcase on palms, two behind the door). Table: `node qa/waivers.mjs <sb> --md`.
- v4 pieces: T4 (cabinhall keys `tear`, `alarm`, feed 3 = storm; `eyelids` prop, spec.cam, key `open`, needs a level still camera, works on a rig), T5 (jetwreck key `torn` (NOT `tail`: propState starts `tail` at 1), `wingchunk` key fire), T6 (music style `danger`), set snowslope `cliff { x, drop }` + `at [x,y,z]` (mine): the set is moved +150 in x so the cabin at the origin hangs beyond the cliff and nothing of the valley shows through the hole; outside coordinates go through out(x,y,z).
- v4 lessons: looking toward -z, +x is screen RIGHT (the old note said left). A view from uphill behind a white hull on snow shows nothing: outside shots of the plane are side-on. dark 0.5+ puts the moon over the mountain (look across the slope, not up it). Narrator reads 2-word lines slowly (1.2-3.4 s): cut shots to the recorded lengths.
- Renders so far (v4): still rounds 4 + 5 small polish batches, layouts 2 (draft runs) + 7 preflights (A x5, B x2), drafts 1 per cut, check-fix rounds 3 of 3, farm renders 0. Seen in the draft strips, for the polish round: B's "You looked back." caption starts on top of the 0:00 clock; run-shot clock shows 0:02 (panel 0:05); the Wizard's face is under his hat in most cabin shots; door shot is no clear two-foot kick; storm plate pale; golden not yet run for the engine changes.
- Renders (v3): layouts 5 (one aborted on a sound name, two inside draft runs), still rounds 8, drafts 1 per cut, farm renders 0; fix rounds used: 0 of 3
- At the final cut (Jonny 11 Nov 21:17 Berlin, marketing thread; memory hook-opener-test-2026-11-11.md): check the first seconds against the five opener rules and name the opener type (A contest running at frame 0, B cold open on the most extreme moment) in DELIVERY.md so the stats read can compare. No rebuild of the drafts for it.
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

- Sizes (measured in stills, 11 Nov): Spud ~0.65 m wide, 1.2 m tall standing, seated top 1.53; Viking ~0.8 wide, 1.41 / 1.72. The layout's "box" includes spread arms: do not read body width from it. Seat backs (~1.6) are taller than a seated potato: nobody is seen from behind a row. Two in adjacent ROWS (pitch 1.35) side-on need fov ~74 from the aisle.
- Panel 01: the hall's windows are painted cards, so a prop outside never showed. `clear: [0]` (new spec) leaves row 0's port window a real hole; the hall sits 0.65 m forward in shot 1 only, so that window is beside his face, not behind his head; the engine is placed on the sight line.
- Panel 04/06: the Wizard sits in the window seat in front of Spud (not the aisle seat) so one side view from the aisle holds both; row 1's aisle seat is parked for those two shots. In 06 he slams into the seat back ahead (a seat back is too tall to fly over).
- Subtitles: 1120 when the faces are above it; 640 (crawl, slide), 900 (ending A), 1250 (brace, impact) when the panel puts the face low. Clocks stay lower left (1265).
- Crawl pose: tip 38, y -0.05 (tip 62 / y -0.28 put the eyes under the floor: body pivot is 0.45 m up).

- THE BROWN WALL (cost 5 still rounds): with ink on, Spud's brown legs and boots get an ink hull that blows up into a flat brown wall hiding the set. Bisected by dropping props and set options from the JSON; fix = one line at the end of spud() in costumes-art-cast.js (`limbMat.userData.noOutline`), a workaround from the Doomscroll thread until main has it. That file belongs to the Spud thread: drop the line when main carries the fix.
- A key in a prop's spec does not start it (`fire`, `on`, `broken`): set keys with a tween at t 0 or at the cut. carburst needs `on: 1`.
- cabinsmoke off = `scale: 0` (kept from the bisect; fill 0 may be fine too, untested after the ink fix).
- Hose masks park in the ceiling panel (y 2.42), never under the floor: the hose runs from its anchor to the cup.
- The Wizard films HIMSELF (faces the aisle, phone up) in 04: a seat back is taller than his eyes, he cannot film over it, and his face is to the camera as the panel wants.

## Tried and dropped

-

## Final cut delivered with one flag open (11 Nov 2026, 23:50 Berlin)

- Farm render 1 (c1f525c) failed qa/check on pixels: pop at 0.90 s (suitcase through the camera) and strobe at the
  car blink (6 brightness steps in 1 s). Fixed in a3e79ef (suitcase ends in front of the lens at the cut; one slow
  eye opening, no second blink), proven with `--draft --from --to` + qa/pops.mjs + a YAVG step count.
- Farm render 2 (a3e79ef, runs 43111523795 A and 43111527437 B) = the delivered files. qa/check: 1 FAIL left in both,
  strobe at 5.07 s (tear flash 183, decay steps over 20, thunder at RIP + 0.9: 4 steps in 1 s, limit 3). A scan of
  every second of both renders with the same rule shows no other window of 4.
- NOT BUILT, waits for Jonny (rounds past the cap of three): line `c.at(RIP, { fx: "flash", peak: 0.6, dur: 0.14` to
  dur 0.24 (decay steps near 11), then one more farm render per cut, then PR, ledger row, improvement-loop fix.
- Delivery: project files videos/you-wake-up-mid/01-plane-crash/ (FINAL-A-safe, FINAL-B-looked-back, DELIVERY.md,
  check-A.txt, check-B.txt). Post pack in DELIVERY.md.
- Tool lessons for the ledger: qa/check's strobe line names only its worst window (each render showed the next one);
  the picture check never ran on a draft of this clip. Candidate fix: qa/pops.mjs also prints every strobe window.

## Round 2 after Jonny's notes (12 Nov 2026, 08:14 Berlin), farm render 3 = PASS

Jonny: Wizard in the wall (0:05), mask on Viking's eye (0:09), Wizard and Viking run in the air (0:27), dislikes the
slide sound; cut B must make clear he does not survive (blown away). Done in 77cc38b:
- Wizard: after RIP he goes back toward the hole (wizC y 1.1, z -2.3), CATCH y 1.0 (was 1.5: hat in the ceiling),
  HOLD y 0.57 (0.45 put his arm 7 cm into Spud's seat top).
- Mask: FACE_V [1.08, 0.74, 0.52] for the slumped face; at T.mask + 2.3 the mask moves to [1.07, 0.88, 0.47] with
  him and is grabbed (hat, keep) only at + 2.7. Measured on face crops: about 450 px per metre in that shot.
- Run: both `move`s of shot 14 carry `y: 0` (off a carrier a character keeps its height).
- Sound: rideSlide plays `whoosh` 0.35 (was `zip`), the suitcase `whistle` is out.
- Cut B: HIT = T.boom + 0.4, Spud is thrown to out(-7.5, 5.5, 23.2) in 0.6 s ("in"), pitch 70, turn 250, then keeps
  going off screen until the cut. The deadpan face beat is gone.
- Flash at RIP fades over 0.24 s: no strobe window left (qa/check PASS on both farm renders, runs 43178025951 A and
  43178028896 B). A B preflight right after the edit still named the old arm-in-prop finding; a partial layout and
  the farm gate did not (stale layout, not looked into).
Delivery: project files videos/you-wake-up-mid/01-plane-crash/ (FINAL files replaced, DELIVERY.md round 2). Ledger row added.
