# Movement, physics and living worlds

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

## Movement (Jonny, 31 Oct 2026: "the natural movement is way better")

- **New clips move naturally**: `"motion": "natural"` is on in the clip template (walks with planted feet and weight
  shift, hands on arcs, the body leading reaches, eyes-first turns, weight when sitting and stopping; docs/STORYBOARD.md
  "motion"). Old clips keep today's motion.
- **Real physics whenever physics is in action** (Jonny, 5 Nov 2026): new clips have `"physics": true` (the template). A
  let-go tumbles and lands, and falls, throws, knocks and zero-g use `c.drop` / `c.throw` / `c.knock` / `c.float`, never
  a hand-tweened path. Aim a throw (`to` + `in`) so it lands where and when the story needs it (docs/STORYBOARD.md).
- **Study the natural way before building any new movement.** Before a new action or move goes into the engine or
  acting.mjs (lying down, a throw, a climb, a heavy lift), find how real people, athletes and top animation (Studio
  Ghibli first) do it: which body part leads and which trails, the timing, where the weight goes, the arcs, the pauses.
  Write the beats down, then adapt them to round potato bodies with short limbs and 3-finger gloves (rules in the
  movement study: https://claude.ai/artifact/Sd9NtkpDDtfJ5GTmiuYjZE). Show Jonny a side by side (old | new) with a
  close-up that follows the character, at normal and half speed, before it becomes a default.

- **Living worlds** (Jonny, 7 Nov 2026: "apply it to all future videos and backgrounds"): new clips on a painted
  outdoor set have `"life": "auto"` (the template): wind in the grass and trees, drifting clouds and their shadows, a
  few birds far behind the cast that fly off at the big loud moment, and the bed follows the same wind. Background
  action stays in the background (Jonny 7 Nov: never birds in front of the cast). `"life": "storm"` for a stormy day.
  docs/STORYBOARD.md "A living world".

- **Copy nature for scenery too** (Jonny, 31 Oct 2026). Before building trees, branches, rocks, water or any other
  part of a set, write down how it is in nature (spacing, sizes and ages, growth direction, what is dead or broken,
  where it clumps) and build from that: groups and gaps, many small and few big, nothing in a rhythm or alternating.
  Everything that hangs or sticks out is attached to something, and every change in the world has a visible cause.
