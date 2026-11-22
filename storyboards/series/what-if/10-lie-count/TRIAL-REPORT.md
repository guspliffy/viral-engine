# 8-minute cheap-film trial: "What if you could see how many times everyone has lied to you?"

Rough draft for Jonny's STORY CHECK (19 Nov 2026, overnight thread "Test a cheap 8 minute What if film").
Video: `lie-count-DRAFT2-story-check.mp4` (6:48, 720p, draft 2; draft 1 was 8:08 and is deleted). Contact sheet: `lie-count-DRAFT2-sheet.jpg`.
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

## Draft 2 (19 Nov, after Jonny's notes "boring over time, slow cuts, scenes without movement, speed up" + the PR #263 lessons)

What changed: lines run nearly back to back (8:08 -> 6:48, same story); no shot over ~3 s (every character line cuts to the
speaker, long narrator stretches alternate angles); a slow camera arc + push on every shot; a gesture on every line;
12 rushed narrator lines re-read (take 2); "Remember that number" planted at 212 and paid at the party; fixed shots that
showed backs of heads (counter, hill ending) and one that drifted into a wall (balcony).

Cost so far (draft 1 + draft 2, whole thread): 191 steps, 147k output tokens, 41.5 M cache read, about $30.
Per finished minute (6:48): 28 steps, 22k out, 6.1 M cache read: about 1/26 of the 09b short's director cost per minute.
Draft 2 itself: 64 steps, 39k out, 11 M cache read; ~2 h of wall time, mostly voice and render machine time.

Length vs money: 6:48 is under 8:00, where YouTube allows mid-roll ads. Getting back over 8:00 means more story
(one more turn, e.g. a second test of the power), not slower pacing.

Against Jonny's formula (19 Nov: one interesting fact, a story people didn't know, simple characters, fast pacing,
constant visual movement):
- Simple characters: yes (four friends + baker + mover, one trait and one number each).
- Fast pacing: better (cuts every ~3 s, lines back to back); still the slowest part is act 5 alone on the balcony.
- Constant visual movement: the camera always moves, but the characters mostly stand and talk; real movement needs
  walks and actions, which is the expensive part of a film.
- One interesting fact / a story people didn't know: NO. This is an invented What if; it has no real fact in it.
  A long film built on the formula would be a real-question film (like Ancient Aliens) with this cheap method.
