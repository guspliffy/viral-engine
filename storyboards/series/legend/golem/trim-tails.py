"""Cut the silent tail of each final voice take (no voice is ever cut: the cut sits 0.15 s after the LAST 50 ms frame
louder than -42 dB anywhere in the take, Jonny 27 Nov rule). Words json stays valid (times unchanged).
  python3 storyboards/series/legend/golem/trim-tails.py out/legend-golem/vo"""
import glob, subprocess, sys, numpy as np
for f in sorted(glob.glob(f"{sys.argv[1]}/L*.wav")):
    w = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "44100", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
    hop = 2205; db = [20 * np.log10(np.sqrt(np.mean(w[k:k + hop] ** 2)) + 1e-9) for k in range(0, len(w) - hop, hop)]
    last = max(i for i, v in enumerate(db) if v > -42)
    cut = min(len(w) / 44100, (last + 1) * 0.05 + 0.15)
    if cut < len(w) / 44100 - 0.05:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-t", f"{cut:.3f}", "-af", "afade=t=out:st=%.3f:d=0.08" % (cut - 0.08), f + ".t.wav"], check=True)
        subprocess.run(["mv", f + ".t.wav", f]); print(f, f"{len(w)/44100:.2f} -> {cut:.2f}")
