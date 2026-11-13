# ancient-aliens (EP01 "Who really built the pyramids?") score

`aa01-score.ogg` (175.0 s, -18 LUFS): one score for the whole pilot, made with ffmpeg from takes already in the library
(same source and licence as assets/music/ai, see its manifest), each loudness-matched (loudnorm) and joined with 0.25 s
crossfades on the story times of /mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md. A block takes its slice
with `score(storyTime)` (storyboards/series/ancient-aliens/kit/aa-kit.mjs: `skip` into this file).

| from (s) | take | part | story |
|---|---|---|---|
| 0.0 | ai/zombies-score/zombies-score-01.ogg | 0-28.2 | hook, contract, clue 1 opens (low strings, sparse piano, timpani pulse) |
| 28.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-8.3 | "no cranes, no steel" |
| 36.0 | ai/drama-swell/drama-swell-01.ogg | 0-10 | 146 m, "nothing on Earth stood taller" (strings and choir rise) |
| 45.8 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-10.5 | the turn: into the dark |
| 56.0 | ai/zombies-score/zombies-score-02.ogg | 0-21.25 | clue 2: gallery, King's Chamber, Aswan |
| 77.0 | ai/drama-swell/drama-swell-02.ogg | 0-10 | the cutter, 80 tonnes over the Nile |
| 86.8 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-11, -3 dB, 2.5 s fade | low under the ask; out by 97.8 ("I'll wait": only the river) |
| 100.0 | ai/zombies-score/zombies-score-01.ogg | 0-18.25 | clue 3: precision (the theme returns) |
| 118.0 | ai/calm-landscape/calm-landscape-10.ogg | 0-7.25, -4 dB | the low at sunset (felt piano, cello) |
| 125.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-9.25 | clue 4: "then I checked where I was standing" |
| 134.0 | ai/drama-swell/drama-swell-01.ogg | 5.0-9.25 | "the speed of light" |
| 138.0 | ai/zombies-score/zombies-score-02.ogg | 0-17.25 | clue 5: Orion, the shaft |
| 155.0 | ai/drama-swell/drama-swell-02.ogg | 0-10, +1 dB | the ship goes home |
| 164.8 | ai/drama-swell/drama-swell-01.ogg | 5.5-9.0, +1 dB, 2 s fade | "Case closed": rings out by 168 |
| 168.5 | ai/sneaky/sneaky-01.ogg | 0-6.5, -5 dB | the tag (pizzicato, bassoon, small) |

Jonny 13 Nov 2026 on the block A animatic: "we need some background music for this". Claude cannot hear: the choice of
takes is by their prompts and the story beats; Jonny judges it by ear. If a block's length moves, the join pass re-lays
the parts on the new times (the table is the recipe).
