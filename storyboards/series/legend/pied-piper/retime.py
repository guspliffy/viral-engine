"""Re-time caption words on the FINAL trimmed voices (27 Nov 2026; Jonny: "the words appear with the spoken word").
cut.py maps the read-time Whisper words through its cuts, but those drift up to 0.6 s; this hears each final take again
with the written line as initial_prompt. A take where Whisper misses a written word keeps the mapped times.
  engine/voice/.venv-vox/bin/python storyboards/series/legend/pied-piper/retime.py      (after cut.py)"""
import json, re, glob, os, shutil, subprocess
import numpy as np
from faster_whisper import WhisperModel
D = "out/legend-pp/vo-cut"
m = WhisperModel("small", device="cpu", compute_type="int8")
L = {l[0]: l for l in json.load(open("storyboards/series/legend/pied-piper/lines.json"))["lines"]}
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
for f in sorted(glob.glob(f"{D}/L*.wav")):
    lid = os.path.basename(f)[:3]; wj = f"{D}/{lid}.words.json"; mp = f"{D}/{lid}.words.cutmap.json"
    if not os.path.exists(mp): shutil.copy(wj, mp)
    old = json.load(open(mp))
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, initial_prompt=L[lid][2], condition_on_previous_text=False)
    new = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    heard = set(norm(w[0]) for w in new)
    ok = all(norm(w[0]) in heard for w in old)
    json.dump(new if ok else old, open(wj, "w"))
    print(lid, "re-timed" if ok else "kept mapped times (Whisper missed a word)")
