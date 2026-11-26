"""Muffled-voice check (26 Nov 2026, from Legend ep 1): a take with almost no energy above 3 kHz sounds "spoken through
a mask" even when Whisper hears every word. The ep 1 kid read this way through four rounds before anyone measured it.
  python3 qa/voicebright.py <take.wav> [...]      -> one line per take; exit 1 if any take is MUFFLED
share = energy 3-8 kHz / energy above 80 Hz, over the loudest 60 % of 2048-sample frames (the voiced part).
Measured on ep 1: raw VoxCPM kid 0.01-0.02 % (Jonny: unclear, masked), the same take after the kid EQ 0.9-3.7 %,
grandmother 7.7 %, woman 4.8 %. Below LIMIT the take needs brightening (a voice "af" chain in lines.json, e.g. ep 1's
kid: highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4) or a new read."""
import subprocess, sys
import numpy as np

LIMIT = 0.5  # percent

def share(path=None, wav=None, sr=24000):
    if wav is None:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                             capture_output=True, check=True).stdout
        wav = np.frombuffer(raw, np.float32)
    n = 2048
    if len(wav) < 2 * n: return None
    fr = np.stack([wav[i:i + n] * np.hanning(n) for i in range(0, len(wav) - n, n // 2)])
    S = np.abs(np.fft.rfft(fr, axis=1)) ** 2
    e = S.sum(1); S = S[e >= np.percentile(e, 40)]
    f = np.fft.rfftfreq(n, 1 / sr)
    tot = S[:, f > 80].sum()
    return 100 * S[:, (f > 3000) & (f < 8000)].sum() / tot if tot > 0 else None

if __name__ == "__main__":
    bad = 0
    for p in sys.argv[1:]:
        s = share(p)
        if s is None: print(f"{p}: too short"); continue
        flag = s < LIMIT; bad += flag
        print(f"{p}: {s:.2f} % above 3 kHz" + ("  MUFFLED (needs brightening or a new read)" if flag else ""))
    sys.exit(1 if bad else 0)
