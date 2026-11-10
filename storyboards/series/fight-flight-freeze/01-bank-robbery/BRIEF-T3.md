TASK T3: seven code-made sounds for Fight, Flight or Freeze 01 "You just robbed a bank".
WHY: the clip opens on a bank alarm at 0.0 and a siren at 1.6 s; the library has no alarm, siren, helicopter,
gull, radio, net shot or handcuffs. Nobody on this project can hear the result (Jonny judges by ear later), so each
sound is built from a written recipe and proven by measurement.
RULES: CLAUDE.md (determinism: every sound is a pure function of its seeded noise source `r` and its length);
docs/rules/output.md "sound" section only.
READ: CLAUDE.md; engine/audio.mjs lines 1-60 (helpers: buf, biquad, run, SR, TAU), and three effects as patterns:
`screech`, `ring`, `windswell`; how SFX names are exported and how a `dur` reaches an effect; engine/sfx/measure.mjs
header; assets/sfx/whitelist.json (two entries, for the format) and engine/sfx/whitelist.mjs header. Nothing else
unless blocked.
OWN: engine/audio.mjs (ADD the seven effects below next to the others; change no existing effect and no shared
helper); assets/sfx/whitelist.json entries for the seven if the whitelist lists built-in effects; a throwaway
measuring script under /tmp/claude-0/-home-user/c271a530-791c-51b4-9d4f-374e01504e2c/scratchpad/t3/. Touch nothing else.
CONTRACT (names are final; d = length in seconds, default in brackets; peaks about the level of `screech` / `slam`):
1. `alarmbell` (d 2): a bank's alarm bell ringing without a gap: a metal bell struck 22 times a second, each strike
   a short bright clang (partials near 1.9, 2.9, 4.3, 5.6 kHz over a 760 Hz body, 40 ms decay), a steady hard
   ring. Loops cleanly when placed back to back.
2. `siren` (d 1.2): a police "whoop": one sine-ish tone with two odd harmonics sweeping 550 Hz -> 1450 Hz over 70 %
   of d, then falling back to 700 Hz, a little grit; spec variant by length: at d >= 2.4 it repeats the whoop. Fade
   20 ms in, 80 ms out.
3. `sirenwail` (d 4): the slow two-tone wail far away: 650 <-> 950 Hz, 0.9 s a cycle, low-passed at 1.8 kHz, quiet
   (a bed under a voice): 12 dB under `siren`.
4. `chopper` (d 3): a helicopter overhead: rotor thump 11 a second (band-passed noise bursts around 90 Hz with a
   slap at 900 Hz), over a turbine whine near 1.6 kHz, swelling in over 0.5 s and out over 0.5 s.
5. `gull` (d 0.9): a seagull's cry: three falling squawks ("kee-yah, yah, yah"), each a nasal tone gliding 2.6 kHz
   -> 1.6 kHz with a formant near 3 kHz and fast vibrato, 0.22 s, 0.18 s, 0.18 s.
6. `radio` (d 0.5): a police radio keying: a 30 ms squelch click, band-passed static (700 Hz - 3 kHz) for the
   middle, and a short 1.2 kHz roger beep (80 ms) at the end.
7. `netshot` (d 0.6): a net launcher: a dull compressed-air "pfft" (a 15 ms low thump at 140 Hz, then noise
   low-passed from 6 kHz down to 900 Hz over 0.2 s), then a thin rope whistle rising to 2.5 kHz and fading.
8. `cuffs` (d 0.45): handcuffs closing: five quick ratchet clicks 45 ms apart getting a little higher, then one
   firmer metal clack (2.2 kHz + 5.1 kHz, 60 ms decay).
MACHINE: no layout, no stills, no render. Node only.
DONE WHEN:
- each effect renders at its default d and at 2x d without NaN, clipping (peak <= 0.9) or a click at the ends (first
  and last 2 ms under 0.02);
- a table in the report from your measuring script: per effect its length, peak, RMS, spectral centroid and the two
  strongest bands, and one line saying how that matches the recipe (e.g. the siren's pitch track at 0, 35, 70, 100 %);
- `node qa/golden.mjs` still passes (no existing sound changed), or, if golden renders pictures only, a note saying so
  and a byte comparison of one existing effect (`screech`) before and after your change;
- `node tools/vocab.mjs` lists the seven new names.
OUT OF SCOPE: the clip generator, mix levels, music, recorded assets, changing existing effects.
