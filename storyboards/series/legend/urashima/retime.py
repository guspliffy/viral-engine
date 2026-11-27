"""Re-time caption words on the FINAL voice files (Jonny 27 Nov: captions drifted when times came from before a trim
or tempo change). faster-whisper small with the written line as initial_prompt, word timestamps.
  engine/voice/.venv-vox/bin/python storyboards/series/legend/urashima/retime.py out/legend-urashima/vpost"""
import json, os, sys
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
D = sys.argv[1]
lines = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "lines.json")))["lines"]
m = WhisperModel("small", device="cpu", compute_type="int8")
for i, who, text, _ in lines:
    y, sr = sf.read(f"{D}/{i}.wav", dtype="float32"); y = y if y.ndim == 1 else y.mean(1)
    a = np.interp(np.arange(0, len(y) * 16000 // sr) * sr / 16000, np.arange(len(y)), y).astype(np.float32)
    segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, initial_prompt=text, condition_on_previous_text=False)
    w = [[x.word.strip(), round(x.start, 3), round(x.end, 3)] for s in segs for x in s.words]
    json.dump(w, open(f"{D}/{i}.words.json", "w")); print(i, " ".join(x[0] for x in w))
