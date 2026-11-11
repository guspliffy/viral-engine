# NOTES: back-to-life (There's a catch EP05; the director's working memory)

Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/09-back-to-life-trex-V2-COLD-OPEN.md, LOWER half
(v3 EXTREME chain). Panels: board.png here (4x3, Jonny's go 11 Nov 21:38 Berlin "Go, build from these", rough draft
first). Opener type B (cold open 0-1.5 s = a piece of the street burst, clean cut). Thread start 20:17Z 11 Nov.
Not to copy from the sheet: pickaxe-like scythe, two sabre-tooths in 11, bird-like Phoenix in 02.
First line wording DECIDED by Jonny 11 Nov 21:54 Berlin: narrator opens "What if you could bring anything back to
life?", the turn stays "But there's a catch."

## Where the build stands

- Step: staging proof done on stand-in boxes (out/btl-sheet-*.png); builders T1-T5 next; review A on stills with the
  real props (decision below); rough draft to Jonny; polish only after his OK
- Next: briefs + dispatch (max 3 at once), wire READY packs, layout, review A, draft --no-vo
- Renders so far: drafts 0, farm 0; fix rounds 0 of 3

## The improvement loop

- Fixes on test: vocab sheet + notes (lookups), layout reuse (machine min), eight rules (layouts, fix rounds, waits),
  caption-collide + six-line chain (renders 1), ledger-count
- Comparison video: theres-a-catch-04-copy-money (21.6 s, 5 prop packs, new set; 51 lookups, 20+35 layouts, 4 fix rounds)
- Repeats:
- Check fails: 0 seen, 0 unseen

## World (x right, z toward camera A; yaw 0 = facing +z, 90 = facing +x)

HALL: x -5..7, z -16..8, h 9, skylight roof. Walkway x -4..1.2. Rope along x 1.6 (z 3..-7). Skeleton row on the
right: sabre-tooth plinth [3.4, 0.5], mammoth [3.6, -4.2], T. rex on a low plinth at the END of the hall [1.0, -11]
facing +z, scale 1.5 (5.3 m tall). Pterosaur skeletons hang y 5.5 at [2, -1] and [2.2, -6.5]. Fish case [-1.6, 0.6].
Plant [1.25, 2.55]. Two camera directions: A looks -z (row on the right, T. rex far), B looks +z from the T. rex end.
STREET: same world, z + 100. Museum front = plane z 100 facing +z, doors at x 0, the breach at x 4. Lamp [-2.5, 108].
Town row z 122 facing -z, giant long-neck rises at [3, 135]. Cast never run the stairs (they are placed past them).

## Beats (video s = story s, no ramps): COLD 0 | HALL 1.5 | FISH 3.6 | RUN 6.0 | CRASH 8.3 | ALIVE 9.3 | CALM 10.8 |
CATCH 12.6 | CHASE 14.0 | STREET 15.6 | LAMP 17.4 | SCYTHE 19.4 | END 22.0

## Cast

| id | character | holds |
|---|---|---|
| spud | potatobrawl/spud | the live fish from FISH on (worn/carried in both arms) |
| rea | potatobrawl/reaper + noProp | `parkedscythe` in his fist the whole clip; dropped at LAMP+1.2 (physics), second scythe planted at SCYTHE |
| phx | potatobrawl/phoenix | - |

## Builder tasks (after review A; one file each)

- T1 props-museum.js: museumhall shell, exhibitrope, glasscase (shatter), fossilfish (slab) + livefish, wiltplant (bloom), plinths, bench
- T2 props-iceage.js: mammoth, sabretooth, pterosaur (alive; gait, jaw, flap) 
- T3 props-fossils.js: trexbones, mammothbones, sabrebones, pterobones, lifeglow (rising green curtain for the swap)
- T4 props-museumstreet.js: museumfront (breach burst), townsquare (cobbles, town row, sky), hillneck (rise), streetcracks
- Director/senior: trex in props-dino.js gets spec.skin "brown", gait, drool (default look unchanged: golden)

## Cameras: see the generator's SH table (filled after camfit)

## Decisions, with the reason

- Review A runs once on stills with the builders' props in, not on the box staging: boxes hide what it would judge.
- `run` does not turn the body: add a `turn` (yaw 180 = toward -z). `rate` is steps per second, not m/s.
- Bones to alive: bones.glow 0->1 (0.3 s), swap, alive.glow 1->0 (0.4 s): every animal and bones kind has `glow`.
- T. rex snout aimed with rexFor(snoutWorld, pose, rot) (trexPoints, scale 1.5): rest snout y 4.84, 4.55 m ahead.
- Three abreast do not fit 9:16 above 19 %: Spud front centre, Reaper and Phoenix 0.9 m behind left and right.

- One skeleton row (right side); panel 04 is mirrored (row on screen left) because a real hall seen from both ends flips.
- Phoenix reaches for the NEAREST skeleton (sabre-tooth), not the T. rex toe (panel 02): the T. rex must be last in the run.
- Bones-to-alive = a rising green glow curtain + swap behind its bright band (no clipping planes in the engine).
- The cold open and STREET share one staging (cast and T. rex at the same places), rendered twice.

## Tried and dropped

-

## Names looked up that docs/VOCAB.md didn't answer

- stand-in box: `stoneblock` (props-guard.js) spec w, h, d. `stanchions` spec.posts [[x,z],...] (props-duo.js).
- loose scythe: `parkedscythe` (props-notyet.js), origin = where his fist holds it; character needs "noProp": true.
- place on a cut: move + turn dur 0.01 with ease "linear", sync true at t - 0.02. `run`: { pts: [[t,x,z]...], dur, rate: [[t, m/s]...], stride }.
- ride a prop: A(t, who, "ride", { prop, off: [x,y,z], yaw, sit, dur }). Shake: c.at(t, { fx: "shake", dur, amp }).
- narrator: c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain: 4.0 }); `--no-vo` for drafts.
- second place in one world: props far away on a "plain" set (EP04 night at x 40).

## Open findings

-
