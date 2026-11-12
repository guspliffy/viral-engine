# NOTES: wake-up-mid-sinking-car (the director's working memory)

## Where the build stands

- Step: ROUGH DRAFT 1 SENT 12 Nov 18:47 Berlin (videos/you-wake-up-mid/02-sinking-car/); waiting on his notes + the opening card.
- Next: drop NOAI, rough draft (`--draft`), pops line, strip, send to Jonny; no polish until his OK.
- Layout runs: 3 full + 5 window rounds. Renders so far: drafts 0, farm renders 0; fix rounds used: 0 of 3.
- Open for polish (not beat-hiding): spud hands in the dash/wheel (0-11.5), hand R over his own eyes 9.0-11.5 (door
  shot, Mash is the subject), headrest grip slips 13.4-13.7, spudW/mashW merge 40 % in the pull 22.9-23.9, phone grip.

## The improvement loop

- Fix on test: draft prints its own pops line (keep `renders` at 1); air-walk warning (keep Jonny-found glitches at 0).
- Comparison video: you-wake-up-mid-01-plane-crash (35.8 s, same series and shape).
- Repeats: cameras refit 3 times (rig cameras sat inside the potatoes: the cabin is 1.9 m wide, a seated potato
  ~0.65 m; camfit reads rig cast in the wrong frame, so stills were the only proof).
- Check fails: rig-jump 145 cm at 29.5 s: an anime-timing front-loaded swim stroke reached the cut() cheat at
  T.shore-0.02 (fixed: strokes end 0.2 s before). CANDIDATE NEXT FIX: preflight warns when a character's action
  overlaps a dur-0 cheat of its carrier/position before a cut (silent today; found only by the layout gate).

## Decisions, with the reason

- Branch you-wake-up-mid-02-sinking-car from main e1c9333 (12 Nov).
- OPENS ON THE CRASH (12 Nov 17:50 Berlin): storytelling-study thread's TikTok read says EP01's eyelid opening lost
  most viewers by 0:02 (32 % at 0:03), T. rex cold open held 46 %. Put to Jonny as a card (recommended crash first);
  built that way meanwhile: panel order 03, 01, 02, 04... Panel-order generator kept as make-sinking-car.panel-order.mjs.bak.
- Pose `x` in c.arm is BODY-LOCAL (+x = his left), not the car frame; `o` mirrors per side.
- One ending (safe) to save tokens (offered to Jonny 16:05, no objection).
- Cast: spud (driver, +x seat = left-hand drive), mash (passenger), chip (back seat). Wrong moves = Mash (phone, door).
- Opener B (cold open in POV, series shape). Music: ai/disaster/disaster-04.ogg from 0.0 (Jonny liked it on EP01),
  muffled underwater from ~24 s, swells on the surface. Narrator = voice "narrator" (VoxCPM2 deep storyteller).
- SOUND RULE (Jonny 12 Nov 16:02): realistic only; sound.signature false; no whoosh/windswell as motion markers,
  no hop/land boings, no stings. Allowed: splash, hiss, crack/glass, gush, bubbling, gasp, rain, thunder, alarm beep.
- New looks to Fable 5.2 (model split): stormlake world incl. underwater; cabin water + glass + burst + headrest.

## Names looked up

- eyelids, bridgeend (props-wakeup-fx/out), carseat, steer (props-road), splash, bubbles (props-shark),
  rainstreaks (props-freefall), rainfall (props-okilied), cabinsmoke (props-wakeup-fx), hatchback rig (car-hatchback.js).
- Draft 1 rendered with --force: the 11 gate fails are hand/contact polish (mittens in the dash, hand over eyes in a shot where Mash is the subject, the hoodie drag merge); workflow rule 2: the rough draft fixes only fails that hide a beat.
- Draft 2 rendered with --force (same 12 polish fails as draft 1, none hides a beat).
- Draft 3 rendered with --force (the same polish fails, none hides a beat).
