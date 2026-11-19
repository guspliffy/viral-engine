# 8-minute cheap-film trial: "What if you could see how many times everyone has lied to you?"

Rough draft for Jonny's STORY CHECK (19 Nov 2026, overnight thread "Test a cheap 8 minute What if film").
Video: `lie-count-ROUGH-story-check.mp4` (8:08, 720p, rough draft). Contact sheet: `lie-count-ROUGH-sheet.jpg`.
Story: `storyboards/series/what-if/10-lie-count/OUTLINE.md` on branch `theres-a-catch-10-lie-count` (EP10 is taken by
laugh strength, on hold; this one would post as EP11).

## Cost (measured from the thread's own transcript, Opus 5.5, no subagents)

| | finished length | steps | output tokens | cache-read tokens | per finished minute |
|---|---|---|---|---|---|
| This film, up to the rough draft | 8:08 (487.6 s) | 127 | 108k | 30.5 M | 16 steps, 13k out, 3.7 M cache read |
| Teleport "forget" 09b (a normal short, final) | 0:28.6 | 354 | 224k (+ ~300k design subagents) | 63.1 M | 742 steps, 470k out, 132 M cache read |
| Happiness score film (final, 4 threads) | 2:37 | 861 | ? | ? | 329 steps, ~$43 |

Per finished minute the rough draft cost about 1/35 of the short's director tokens. Fair warning: the short's numbers
include polish and the full render; this film's do not yet. Even if polish, the Sol check and the full render cost
three times what the draft did, it stays about 10x cheaper per minute.
Time: 21:51 to 01:15 UTC (3 h 24 min, two container restarts inside). Machine time was most of it: the narrator
(VoxCPM2 on the cloud CPU, ~25 min plus one lost 30-min run) and the draft renders (~75 min, two at a time).

## Where the savings came from

1. Thinking once: the whole film is data (36 scenes, 8 acts, feelings per act) in one file; no per-shot staging.
2. One kit: the Happiness 03 town reused as built (9 places), no new design, no Fable, no builders.
3. Seven shot types computed from each place's stage (wide, two, group, close, over-the-shoulder, alone, insert), each
   with a slow push; two contact-sheet rounds of all ~200 stills fixed the framing for every shot at once.
4. Story time drives everything: measured narrator lengths set the cuts, one music score cut from library takes.
5. No hand/foot polish, no held props (buns and cake sit on tables), character lines as captioned gibberish.

## What it cost in quality (judge on the video)

- Calm and samey: many held close-ups of Spud, little movement; it reads like a narrated animatic.
- Numbers over heads get cut off in close-ups (the baker's "4" is never seen), Mash's sometimes in two-shots.
- The narrator's tempo jumps between lines (VoxCPM read ~30 lines fast or slow; retakes cost voice time).
- The town and the number tags look like the happiness film.
- Known contact glitches were rendered with --force for this story check (foot slides, palm turns): they get fixed
  after the story OK, before Sol.

## Recommendation

Adopt the method for long films ON TRIAL, if the story holds up for you: the cost is low enough to buy quality back
where it counts (full acting at the 4-5 turns, wider variety of shots, a narrator retake pass) and still stay far
under a short's cost per minute.
