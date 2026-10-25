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

Whispers: `"tone": "whisper"` or `"soft": true` reads the line in the same voice, 9 % slower, darker (low-pass at
5.5 kHz) and 7 dB quieter. Jonny picked this over breath-noise whispers, which sounded evil.

Claude can't hear audio. `tts.py` measures loudness and clipping, and speech recognition (Whisper) understood every
test line, but how a voice sounds is Jonny's call.

## Licenses

| Part | License | Commercial videos |
|---|---|---|
| Kokoro-82M weights and voices | Apache 2.0 | yes |
| kokoro-onnx | MIT | yes |
| espeak-ng (text -> phonemes, bundled by kokoro-onnx) | GPL v3 | yes: the GPL covers the program, not the audio it helps make |
| Rubber Band (pitch, inside ffmpeg) | GPL v2 | same |

Kokoro has no German voices (English, Spanish, French, Italian, Portuguese, Hindi, Japanese, Chinese).
Ruled out: XTTS v2 and F5-TTS (non-commercial licenses). Next free candidate if lines need more acting: Chatterbox (MIT).
