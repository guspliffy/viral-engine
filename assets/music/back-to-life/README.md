# There's a catch 05 (back to life): orchestra score

Jonny 12 Nov 2026 on the two beds synthesised in puppet/beat.mjs: "this sounds like game music and not dramatic. it
should be a dramatic orchestra with piano trumpets and timpani. really dramatic chasing music".

One 22.5 s score, laid against the clip's beats by
`storyboards/series/what-if/05-back-to-life/make-score.py lay CHASE.wav SUSPENSE.wav OUT.ogg` from takes of Stable
Audio 3 Small music (engine/soundgen, sa3.cpp, CPU, 8 steps), recipes in `engine/soundgen/recipes-back-to-life.json`:

- chase: `orchestra-piano-chase` prompt 1, seed 522: "relentless thriller chase music, pounding grand piano chords and
  racing piano runs, blaring trumpets, thunderous timpani rolls, full symphony orchestra, live recording, terrifying
  and urgent, 150 BPM"
- suspense (the hall, and its own crescendo through "But there's a catch"): `orchestra-suspense` seed 511.

Takes were shortlisted by measurement (CLAP similarity to a dramatic orchestral chase score, piano, trumpets, timpani
and strings, against video game music, synthesizer and happy music), then JONNY PICKED BY EAR 12 Nov 2026 09:54 between
this score (A) and a darker one (B: `orchestra-chase` prompt 1, seed 503, deleted): "i like draft a more and make the
music a bit louder" (storyboard gain 0.6 -> 0.8).

Licence: Stability AI Community License (free under $1M yearly revenue; commercial use to be registered with
Stability AI), the same source as `assets/music/ai/` (docs/ASSETS.md).
