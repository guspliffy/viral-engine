# Real voices

Characters speak their `say` lines with **Kokoro-82M** text-to-speech, run locally on the CPU (no API, no fee).

- `setup.mjs`: one-time setup, `node engine/voice/setup.mjs`. Creates `.venv` (Python 3.10+) and downloads the model
  files (~350 MB) from the kokoro-onnx GitHub release into `models/`. Needs ffmpeg (already needed by the engine).
- `voices.json`: the voice recipes. Jonny picked them by ear on 2026-10-25 (test sheet in the project files,
  `audio/voice-test-01`). A recipe blends Kokoro voices (`voice` weights), sets `speed`, `lang` and `pitch`
  (semitones, Rubber Band with formants kept). The other voices from that test were rejected as scary or bad.
- `speech.mjs`: runs before compile (`engine/load.mjs`). Finds every `say` / `narrate` line with a voice, synthesises
  the new ones in one batch, and gives each line its spoken length and mouth keyframes. Cache: `out/speech/<hash>`
  (`.wav` 44.1 kHz 16-bit + `.json` with phoneme timings), keyed by text + recipe, so re-renders and qa tools reuse it.
- `tts.py`: the synthesiser. Reads the phoneme durations from Kokoro's own duration predictor (the released ONNX
  file is patched once to output them), so lip sync matches the sound exactly. Every line is compressed lightly,
  set to -16 LUFS and limited at -2 dBFS; the mix is normalised to -14 LUFS by `render.mjs` as before.
- `../shared/visemes.js`: phoneme -> mouth shape (closed on m/b/p, round on o/u/w, wide on a), eased and smoothed.

VoxCPM2 voices (7 Nov 2026, Jonny: "the new model sounds better than what we use now"): `phoenix`, `reaper`, `wizard`,
`gunslinger` and `viking` are read by **VoxCPM2** (`vox.py`, openbmb, Apache 2.0, 2B, CPU) in the voice of a short
reference clip in `targets/` (Phoenix, Reaper, Wizard: a read by their old Kokoro voice; Gunslinger, Viking: a voice
VoxCPM2 made from a description, saved so every line is the same voice). The tone becomes an acting direction in
brackets (`excited` -> "(lively, bright, excited, energetic)", `speech.mjs` VOX_STYLES plus the recipe's `vox.base`);
a line can give its own `"style": "embarrassed, sheepish"` and `"take": 2` for another reading. The same text is still
read by Kokoro, only to time the mouth and the captions: both reads are cut into spoken stretches and the phonemes move
with them (`tts.py` align). Lines that are only non-words (`hnnngh!`) keep the Kokoro sound. The old voices stay as
`phoenix-kokoro`, `reaper-kokoro`, `wizard-kokoro`. Setup: `node engine/voice/setup.mjs --vox` (~1.5 GB venv + ~5 GB
model); on GitHub runners tts.py runs it by itself when a line needs it. Speed: ~25 s to load, then about 3 s per
second of speech on 4 cores (Kokoro: 0.1 s). Found through VoiceStudio; its own default model (OmniVoice) has
non-commercial weights and is not used.

Whispers: `"tone": "whisper"` or `"soft": true` reads the line in the same voice, 9 % slower, darker (low-pass at
5.5 kHz) and 7 dB quieter. Jonny picked this over breath-noise whispers, which sounded evil.

Non-words are sounds, not spelled: the text reader would say "hnnnngh!" letter by letter, so `tts.py` (`SOUNDS`)
turns these into the sound in the character's voice: a straining hum that shakes (`hnnngh`, `nnngh`), a hum (`hmm`,
`mmm`), `mm-hmm`, `hmph`, a growl (`grrr`), `brrr`, a shush (`shhh`), `pfff` and `zzz`. They mix with words
("hmm, okay."). Words espeak knows already sound right (`ugh`, `aah`, `hehe`, `huh?`, `whoa`). Add a pattern there
for a new one; the voice model invents vowels when a sound is stretched with long marks or a repeated hiss, so
lengthen a nasal by repeating it and a hiss by slowing it down.

Claude can't hear audio. `tts.py` measures loudness and clipping, and speech recognition (Whisper) understood every
test line, but how a voice sounds is Jonny's call.

## Licenses

| Part | License | Commercial videos |
|---|---|---|
| Kokoro-82M weights and voices | Apache 2.0 | yes |
| kokoro-onnx | MIT | yes |
| espeak-ng (text -> phonemes, bundled by kokoro-onnx) | GPL v3 | yes: the GPL covers the program, not the audio it helps make |
| Rubber Band (pitch, inside ffmpeg) | GPL v2 | same |
| VoxCPM2 code and weights (openbmb) | Apache 2.0 | yes |
| Chatterbox VC (Resemble AI) | MIT | yes |

Kokoro has no German voices (English, Spanish, French, Italian, Portuguese, Hindi, Japanese, Chinese).
Ruled out: XTTS v2, F5-TTS and OmniVoice (VoiceStudio's default; non-commercial weights).
