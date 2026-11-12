# NOTES: back-to-life (There's a catch EP05; the director's working memory)

Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/09-back-to-life-trex-V2-COLD-OPEN.md, LOWER half
(v3 EXTREME chain). Panels: board.png here (4x3, Jonny's go 11 Nov 21:38 Berlin "Go, build from these", rough draft
first). Opener type B (cold open 0-1.5 s = a piece of the street burst, clean cut). Thread start 20:17Z 11 Nov.
Not to copy from the sheet: pickaxe-like scythe, two sabre-tooths in 11, bird-like Phoenix in 02.
First line wording DECIDED by Jonny 11 Nov 21:54 Berlin: narrator opens "What if you could bring anything back to
life?", the turn stays "But there's a catch."

## Where the build stands

- Step: ROUGH DRAFT 1 sent to Jonny 11 Nov ~23:30 Berlin (no narrator, `back-to-life-no-vo`; project files
  videos/what-if/05-back-to-life/). WAIT for his OK or notes; polish only after it (his OK replaces review B).
- Done: builders T1-T5 (five packs, benches in bench/), clip restaged on the real pieces, review A (6 notes, all
  applied; note 5 in part: camera lower and tilted up, no claw-with-blade close-up), music parts follow the story
  (Jonny's rule 11 Nov: bounce key 10 = the series theme, change at "But there's a catch").
- Checks: 3 fix rounds used on the staging (26 fails -> 1). The last one (phx elbow L jumps at 6.57 s, behind the
  subject in the run shot) is waived FOR THE DRAFT ONLY in allowClip: fix it in the polish, then delete the window.
- Polish list (after his OK): scythe really in Reaper's glove (worn beside him now); fish hugged in both arms while
  running (run arms now); lamp clinging hands; phx arm jump 6.57; sabre-tooth's face barely in the catch shot
  (13.4 s); T. rex head mostly off the bottom-left of the lamp shot; narrator (6 lines, voice 1, measure with
  qa/lines.mjs); 44 visible-glitch warnings to read (hand-pop, palm-turn, foot-slide); pops probe at 8.3 and 19.5.
- Renders so far: drafts 2 (the first was superseded by the review notes), farm 0; layouts 9 full + 2 partial

### Rework after Jonny's notes on rough draft 1 (12 Nov 2026 08:21 Berlin)
His words: "i dont like the ringing sound when the sythe touches, there is not commentator so far, the music dosnt fit
the dangerous scene when chasing, the t rex looks guite bad- make it look like a real t-rex / witzard and phoenix are
floating in this scene / the animals should look more real and not like bowl fit together- rework them".
- ANIMALS REAL: `makeLoft` in engine/page/geo.js (one continuous skin through cross-sections, moved by joints).
  BRIEF-REAL.md + R1 (kind `rex`, engine/page/props-rex.js, rig engine/shared/rex-rig.js: the generator imports
  rexPoints AS trexPoints), R2 (mammoth + sabretooth replaced in props-iceage.js), R3 (`pterosaur` in props-ptero.js,
  registered after iceage so it wins; the old pterosaur code in props-iceage.js is dead and can go in polish), and the
  `hillneck` head in props-museumstreet.js. The old `trex` is untouched (other clips + golden).
- Clip on `rex`: REXK 1.7, RUNPOSE / CALMPOSE, RG(v) and GAITK give the step rate for a speed (no sliding feet), gait 0
  = standing (whole numbers are walk poses now), headY turns the head a little in head-on shots so the eye reads.
- LAMP: CLING puts Reaper and Phoenix ON the post (0.42 beside it, a little behind), both gloves on it, the crossing
  arm low under the face.
- SOUND: no "bell", "shing", "tink" on the scythe: "zap" (+ "ai/heartbeat" for the T. rex and the ending).
- MUSIC: named style "chase" added to puppet/beat.mjs (minor, 148-156 bpm, pounding bass, no lead).
- NARRATOR in (voice setup works in the cloud container): four lines; the catch line was cut (the catch is SHOWN);
  every beat after the cold open moved +0.5 s so the 2.7 s title question has room (clip 22.5 s).
- ROUGH DRAFT 2 SENT 12 Nov 09:10 Berlin (narrated, 22.5 s, preflight 0 fails; drafts 3, farm 0). Told Jonny the
  sabre-tooth is the weakest animal (reads bear-cat, round face). WAITING for his OK or notes; nothing polished before.
- Run before the PR: `node qa/golden.mjs` (geo.js, beat.mjs and props3d.js changed; all additive).

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
STREET: same world, z + 100. Museum front = plane z 100 facing +z, entrance at x -9, the breach at x 1.4 (9 wide). Lamp [-2.5, 108],
7.5 tall. The giant long-neck rises BEHIND the museum at [2.5, 82]. Scythe ends at [0, 115.4]. Cast never run the stairs (they are placed past them).

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
