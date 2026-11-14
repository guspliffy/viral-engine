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

# EP02 "Who really built Stonehenge?" score

`aa02-score.ogg` (208.0 s, -17.5 LUFS): one score for the whole film, built by
`storyboards/series/ancient-aliens/02-stonehenge/kit/score.py` (the table in that file is the recipe; edit the times there and
run it again if a block's length moves) from takes already in the library, on the story times of
/mnt/project-files/videos/ancient-aliens/02-stonehenge/STORY.md. A block takes its slice with `score(storyTime)` from
`02-stonehenge/kit/sh-kit.mjs`. Silent on purpose: 49.6-54 (the knock rings alone), 100-102 ("I'll wait": only the
sheep), 177-180 (the last three seconds of the sunset countdown: wind only), under "It's a parking space." (196.4-198.3).

| from (s) | take | part | story |
|---|---|---|---|
| 0.0 | ai/zombies-score/zombies-score-01.ogg | 0-11.25 | A hook: the stone hangs, drops; the ring; snap to today (the series theme: low strings, sparse piano, timpani pulse) |
| 11.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-10.25 | A contract: five clues, the shortest day, the sunset clock starts |
| 21.0 | ai/drama-swell/drama-swell-01.ogg | 0-8.25 | A clue 1: the crane up the nine-metre stone, the pit (strings and choir rise) |
| 29.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-9.25 | A the push, two buses, the 25 km line |
| 38.0 | ai/hero-bed/hero-bed-01.ogg | 0-7.25, -2 dB | A the time-lapse: thud, thud, thud, the ring grows (brass, driving strings) |
| 45.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-4.6, 1.6 s fade | A the turn: 'the small ones are'; out by 49.6 so the knock at 50 rings alone |
| 54.0 | ai/zombies-score/zombies-score-02.ogg | 0-14.25 | B clue 2: the bluestones, the line runs to Wales |
| 68.0 | ai/drama-swell/drama-swell-02.ogg | 0-9.25 | B Wales: the crag, the cargo ship over the hills |
| 77.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-11.0 | B the twist: the Altar Stone, 'it is not from Wales' |
| 88.0 | ai/drama-swell/drama-swell-01.ogg | 4.0-10.0, 2.0 s fade | B 240 -> 750 km up the whole island; rings out under 'Nobody knows how' |
| 95.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-5.0, -3 dB, 2.5 s fade | B low under the ask; out by 100 ('I'll wait': only the sheep) |
| 102.0 | ai/zombies-score/zombies-score-01.ogg | 0-18.9 | C clue 3: knobs and holes, the ring closes (the theme returns) |
| 120.7 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-10.5 | C the slope and the level ring; the ship the same size as the ring |
| 131.0 | ai/drama-swell/drama-swell-01.ogg | 0-3.2, -2 dB | C 'why would a temple need to be perfectly level?' |
| 134.0 | ai/zombies-score/zombies-score-02.ogg | 0-5.25 | C clue 4: one line |
| 139.0 | ai/drama-swell/drama-swell-02.ogg | 0-7.25 | C the two suns: 21 JUN, 21 DEC |
| 146.0 | ai/sneaky/sneaky-01.ogg | 0-10.0, -5 dB, 0.6 s fade | C the grooves: the alien caught with the cutter (pizzicato, bassoon, small) |
| 156.0 | ai/calm-landscape/calm-landscape-09.ogg | 0-15.25, -3 dB | D clue 5: the parchment, giants over the sea (slow piano, harp, warm violins) |
| 171.0 | ai/calm-landscape/calm-landscape-06.ogg | 0-6.0, -4 dB, 1.8 s fade | D the low: he sits, the sheep; out by 177: the last three seconds of the countdown are wind only |
| 180.0 | ai/sos-warm/sos-warm-01.ogg | 0-6.5, -2 dB, 1.5 s fade | D the sun in the gap, the red shaft (warm strings and choir, full from the first note) |
| 183.0 | ai/drama-swell/drama-swell-01.ogg | 0-8.0, +1 dB | D the ring ship comes down the line and settles: the swell peaks on the clunk at 190.5 |
| 191.0 | ai/orchestra-suspense/orchestra-suspense-01.ogg | 0-5.4, -4 dB | D 'thirty metres across... never a temple'; cut dead before 'It's a parking space.' |
| 198.3 | ai/drama-swell/drama-swell-01.ogg | 5.5-9.0, +1 dB, 2.0 s fade | D 'Case closed': rings out by 202 |
| 200.6 | ai/sneaky/sneaky-01.ogg | 0-7.4, -5 dB, 1.2 s fade | D the tag: twenty workers drag a stone past |

Jonny 14 Nov 2026: "use music this needs to be as interesting as possible". Claude cannot hear: the takes are picked by
their prompts and the story beats; Jonny judges by ear on the block A animatic.
