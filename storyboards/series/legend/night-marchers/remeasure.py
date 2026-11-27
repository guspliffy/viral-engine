# Re-hear every final line wav (after trims and tempo edits) and write <id>.words.final.json; prints the drift against
# the old <id>.words.json. nm.mjs reads the .final file when it exists. Usage: remeasure.py <voice_dir>
import json, glob, os, re, sys
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
d = sys.argv[1]
m = WhisperModel("small", device="cpu", compute_type="int8")
nz = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
for wav in sorted(glob.glob(f"{d}/L??.wav")):
    lid = os.path.basename(wav)[:-4]
    old = json.load(open(f"{d}/{lid}.words.json"))
    w, sr = sf.read(wav, dtype="float32")
    a = np.interp(np.arange(0, len(w) * 16000 // sr) * sr / 16000, np.arange(len(w)), w).astype(np.float32)
    segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    new = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    json.dump(new, open(f"{d}/{lid}.words.final.json", "w"))
    # drift: same-index matching words
    diffs = []
    j = 0
    for w in old:
        for k in range(j, len(new)):
            if nz(new[k][0]) == nz(w[0]): diffs.append(new[k][1] - w[1]); j = k + 1; break
    mx = max((abs(x) for x in diffs), default=0)
    print(lid, len(old), len(new), "maxdrift %.2f" % mx, "mean %.2f" % (sum(diffs) / len(diffs) if diffs else 0))
