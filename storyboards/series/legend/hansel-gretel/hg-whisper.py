"""Re-time the caption words of the round-2 cut takes with Whisper (like tools/svg2d/read-lines.py hear()):
  engine/voice/.venv-vox/bin/python storyboards/series/legend/hansel-gretel/hg-whisper.py out/legend-hansel/vo-cut L11 L20 L28"""
import json, sys, numpy as np, soundfile as sf
from faster_whisper import WhisperModel
d, ids = sys.argv[1], sys.argv[2:]
asr = WhisperModel("small", device="cpu", compute_type="int8")
for i in ids:
    w, sr = sf.read(f"{d}/{i}.wav", dtype="float32")
    a = np.interp(np.arange(0, len(w) * 16000 // sr) * sr / 16000, np.arange(len(w)), w).astype(np.float32)
    segs, _ = asr.transcribe(a, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    words = [[x.word.strip(), round(x.start, 3), round(x.end, 3)] for s in segs for x in s.words]
    json.dump(words, open(f"{d}/{i}.words.json", "w")); print(i, words)
