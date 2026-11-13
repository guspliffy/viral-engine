# NOTES: teleport-rings (There's a catch EP09)

Where the build stands: generator written on stand-ins (READY="" = boxes), floor plan clear; builders T1 (sets,
props-wedding-set.js), T2 (hand props, props-wedding.js, spud-bald.json), sound (score + 7 sfx) running; HUD `steps`
part (DESIGN 7) not built yet (pack "hud").

Packs (env READY, default all): set, props, hud, sound. OPEN=B = opener B (+3 s). --no-vo = no narrator.

Cast places (frame A garden): Chip (-0.48, 0), Spud (0.5, 0), Chip steps to (-0.2, 0) to catch the tie; Mash on
BRIDE(n) = (0, -0.65 - 0.5 n) driven by STEPS (the same points as the counter). Photo: Chip (-0.48, 2.2), Spud
(0.5, 2.2), Mash (0, 1.55) under archA (on 1). Frame B hall: ringhall at z +60; SPUD_SHELF (0.4, 61.8), KNEEL
(0.36, 62.6), rings land RING_A (0.2, 62.15), RING_B (0.52, 62.3).
Bald: a second cast member "bald" (what-if/spud-bald) parked at (204, 0) until 31.2 s; the swap hides in the cut.
Box: Spud's R glove 0-13.9 (carried through jumps 1 and 2), Chip's R glove from 13.9, Spud 17.1-17.6, Chip's R again
after jump 3 (falls from the hang into it). Tie: worn to 4.45, then Chip's L glove to the end.

Decisions:
- Chip does not take the rings in 13 (both his gloves are full: tie + box); Spud holds them out in his palm. Brief says
  "Chip takes them": departure, tell Jonny.
- Box snapped shut on arrival at the altar (12.3) without looking: explains why he presents an empty box.
- Narrator line 3 starts 0.3 s after jump 3 (17.9), 4.9 s; Chip's "...Again." at 15.4 sits in the narrator gap.
- END 46.5 (1.5 s hold after "Would you still jump?").

Names looked up: c.throw(t, id, { to, in, spin }), c.drop; write() names the file from sb.id; new ai/ sounds must be on
assets/sfx/whitelist.json (engine/sfx/measure.mjs) or load fails.
