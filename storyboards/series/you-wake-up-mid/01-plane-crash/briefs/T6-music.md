TASK T6: a "danger" music style
WHY: Jonny on the first cut of "You wake up mid plane crash" (11 Nov): "add dangerous music". The library's styles are all upbeat cartoon; this clip is a disaster film: a plane falls out of a thunderstorm, crashes and burns. Claude cannot hear: Jonny judges the result by ear, so build it from what such music measurably is.
DESIGN: a named style like `surf` and `polka` (only by name, never picked by a seed: no other clip may change).
READ: puppet/beat.mjs (all of it, 211 lines), puppet/README.md if it says how a style is tested; nothing else
OWN: puppet/beat.mjs (add the named style and what it needs; nothing an existing style plays may change)
CONTRACT:
- `music: { style: "danger" }`: a chase / disaster cue. 148-156 bpm. A minor key with a flat second in the harmony (i, bVI, i, bII over four bars, the bII bar the tense one). A low pulsing bass on every eighth note, the root with an octave jump on the off-beats of beats 2 and 4, a little overdriven. Kick on every beat, tight hats on the sixteenths with accents on the off-beats, a snare on 2 and 4 and a sixteenth snare roll through the last two beats of every fourth bar. A two-note ALARM stab (root and the tritone above it, hard square or brassy, 0.12 s each, on the "and" of beats 3 and 4) in bars 2 and 4. A dark sustained pad holding the chord (organ or saw, low-passed about 900 Hz), no bell or whistle lead, no major chords, no swing. 
- The parts keep their meaning in this style: "intro" = the bass pulse, hats and a soft heartbeat kick, no snare, no stab; "main" = everything; "build" = snare roll and a rising noise or pitch riser over the whole part, no kick; "drop" = main with a crash and a low boom on its first beat; "stop", "hush", "hold" as they are.
- Loudness in line with the other styles at the same `gain` (compare the RMS of 8 bars of "main" with `march`: within 1.5 dB).
CHECKS: render 16 bars of the style to a wav with the file's own entry point or a ten-line script in out/ (not committed); report bpm, key, the RMS against march, and the spectral share below 200 Hz. Prove nothing else changed: hash the samples of `march`, `sneaky` and `surf` for one fixed seed before and after your change (identical).
MACHINE: no renders at all; node only.
DONE WHEN: the style plays by name with all parts, the three hashes are identical, the header comment at the top of beat.mjs lists `danger` with one line on what it is.
OUT OF SCOPE: sound effects, the audio mixer, any storyboard or generator
