# There's a catch 05 (back to life): orchestra score

Jonny 12 Nov 2026 on the two beds synthesised in puppet/beat.mjs: "this sounds like game music and not dramatic. it
should be a dramatic orchestra with piano trumpets and timpani. really dramatic chasing music".

Two 22.5 s scores, each laid against the clip's beats by
`storyboards/series/what-if/05-back-to-life/make-score.py lay CHASE.wav SUSPENSE.wav OUT.ogg` from takes of Stable
Audio 3 Small music (engine/soundgen, sa3.cpp, CPU, 8 steps), recipes in `engine/soundgen/recipes-back-to-life.json`:

| file | chase take | suspense take |
|---|---|---|
| `back-to-life-score.ogg` (A, in the storyboard) | `orchestra-piano-chase` prompt 1, seed 522: "relentless thriller chase music, pounding grand piano chords and racing piano runs, blaring trumpets, thunderous timpani rolls, full symphony orchestra, live recording, terrifying and urgent, 150 BPM" | `orchestra-suspense` seed 511 |
| `back-to-life-score-b.ogg` (B, darker) | `orchestra-chase` prompt 1, seed 503: "intense symphonic chase scene music, aggressive low piano octaves, trumpet fanfare stabs, rolling timpani, racing violins, live orchestra in a concert hall, hollywood action film score, dark and urgent, 150 BPM" | the same |

Picked by measurement, not by ear (Claude can't hear): CLAP similarity of every take to "dramatic orchestral film
score for a chase scene", piano, trumpets, timpani, strings, against video game music, synthesizer and happy music.
A scores highest on the three instruments Jonny named; B scores highest on drama and lowest on game and synth.
Jonny judges by ear which one stays; delete the other then.

Licence: Stability AI Community License (free under $1M yearly revenue; commercial use to be registered with
Stability AI), the same source as `assets/music/ai/` (docs/ASSETS.md).
