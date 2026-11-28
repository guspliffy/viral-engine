"""Cut-voice check (27 Nov 2026, from the Pied Piper legend; Jonny: "no voices should be cut off"): a take that was
trimmed (pauses shortened, words dropped, the tail shortened) can end while the voice still sounds: a clipped word,
a cut breath, a click. Whisper still hears every word, so nothing flagged it; the Pied Piper recut ended 4 of 24 takes
this way (tails at -49 to -56 dB) because silence was measured at -30 dB.
  python3 qa/voicecut.py <take.wav> [...]     -> one line per take; exit 1 if any take is CUT
A take is CUT when its last 20 ms are louder than LIMIT dBFS. Measured on the Pied Piper: clipped L02 -54, L06 -53,
L15 -49, L16 -56; the same takes ended at the first quiet point -87 to -180 (pass); untrimmed VoxCPM reads -86 to -180.
For a trim, end the take with quiet_after(): the first point after t0 where 20 ms fall below LIMIT."""
import subprocess, sys
import numpy as np

LIMIT = -60.0  # dBFS over the last 20 ms
SR = 16000

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)

def db(x):
    return 20 * np.log10(np.sqrt((x.astype(np.float64) ** 2).mean()) + 1e-9) if len(x) else -180.0

def tail_db(path=None, wav=None):
    w = load(path) if wav is None else wav
    return db(w[-SR // 50:])

def quiet_after(path, t0, step=0.01):
    """seconds: the first point at or after t0 where the next 20 ms are below LIMIT (+20 ms), or None"""
    w, h = load(path), SR // 50
    for i in range(int(t0 * SR), len(w) - h, int(step * SR)):
        if db(w[i:i + h]) < LIMIT: return i / SR + 0.02
    return None

if __name__ == "__main__":
    bad = 0
    for p in sys.argv[1:]:
        d = tail_db(p); cut = d > LIMIT; bad += cut
        print(f"{p}: ends at {d:.0f} dB" + ("  CUT (ends while the voice still sounds: end the trim at quiet_after())" if cut else ""))
    sys.exit(1 if bad else 0)
