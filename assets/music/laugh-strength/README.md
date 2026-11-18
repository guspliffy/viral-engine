# laugh-strength score (There's a catch 10, 18 Nov 2026)
A premix of three approved beds from assets/music/ai (Stable Audio 3 Small, see its manifest for the licence):
sneaky-01 (0-13.3 s, out from 12.8), hero-bed-01 (12.75-15.35 s), orchestra-suspense-01 (from 14.7 s, in 0.4 s).
Times follow make-laugh-strength.mjs (the x10,000 lift at ~12.8 s, "But there's a catch." at 14.8 s).

## laugh-film.ogg (v2, the two-part film, 18 Nov 2026)
The whole ~46 s film's score, one file; part 1 (make-laugh-gym.mjs) plays it from 0, part 2 (make-laugh-street.mjs) from
its "skip" (the gym part's length), so the join is seamless. sneaky-01 0-11.85 (out from 11.35, the cut to the street at
11.6), hero-bed-01 from 11.6, hero-bed-02 from 19.2, epic-02 from 26.8 (the bus overhead, ~31.9), all out by 34.45 ("But
there's a catch." at ~34.45), orchestra-suspense-01 from 34.3 to the end. Rebuild with the ffmpeg line in git history.

## laugh-film.ogg v3 (rough draft 3, 18 Nov 2026, 45.9 s)
Gym 0-11.667, street from 11.667 (MUSIC_SKIP). sneaky-01 0-11.95 (out from 11.35); hero-bed-01 from 11.57 (walk out, car
lift); hero-bed-02 from 19.3 (bus rescue, "superhero"); hero-bed-01 0-4.6 again from 27.0 (the dare, boarding); epic-02
0-3.8 from 31.2 (the bus overhead at ~32.5, out by 35.0); orchestra-suspense-01 from 34.85 ("But there's a catch." at
~35.0) to the end. ffmpeg: atrim + afade + adelay per bed, amix normalize=0, libvorbis q6.
v3b (49.4 s film): epic-02 from 31.4 (out by 35.4), orchestra-suspense-01 from 35.2, a second suspense pass (1.0-6.0 s of
it) from 45.5 to the end (the smash at ~47.5).
