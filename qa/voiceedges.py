#!/usr/bin/env python3
"""Clipped-voice check (Jonny 27 Nov: "no voices should be cut off").

  python3 qa/voiceedges.py <dir or wav files...> [--src <dir of the uncut takes>] [--edge 0.015] [--max 0.02]

A take that was cut inside a word starts or ends with sound: the RMS of its first or last `edge` seconds is above
`max` of the take's peak. Prints one line per take that fails and exits 1. Run it on the takes that go into the mix
after any trim (svg2d boards: out/<clip>/vcut and vpost). A VoxCPM take whose lead-in silence was removed by
read-lines.py starts on its first sound: with --src, a cut take that begins where its source take begins (same
samples 10-60 ms in) is not counted as cut at the start; --tails-only checks only the ends.
"""
import sys, glob, os, wave
import numpy as np

def load(p):
    w = wave.open(p); n = w.getnframes(); sr = w.getframerate(); ch = w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64)
    if ch > 1: a = a.reshape(-1, ch).mean(1)
    return a, sr

def main(argv):
    edge, mx, tails, src, files = 0.015, 0.02, False, None, []
    it = iter(argv)
    for x in it:
        if x == "--edge": edge = float(next(it))
        elif x == "--max": mx = float(next(it))
        elif x == "--tails-only": tails = True
        elif x == "--src": src = next(it)
        elif os.path.isdir(x): files += sorted(glob.glob(os.path.join(x, "*.wav")))
        else: files.append(x)
    if not files: print(__doc__); return 2
    bad = 0
    for f in files:
        a, sr = load(f); pk = np.abs(a).max()
        if pk <= 0: continue
        e = max(1, int(edge * sr)); rms = lambda s: float(np.sqrt((s ** 2).mean()) / pk)
        h, t = rms(a[:e]), rms(a[-e:])
        sp = src and os.path.join(src, os.path.basename(f))
        if sp and os.path.exists(sp):   # the take's own start (not a cut) when the first 10-60 ms match the source
            b, _ = load(sp); i0, i1 = int(0.01 * sr), int(0.06 * sr)
            if len(b) > i1 and len(a) > i1 and np.corrcoef(a[i0:i1], b[i0:i1])[0, 1] > 0.98: h = 0.0
        why = [k for k, v, on in (("starts", h, not tails), ("ends", t, True)) if on and v > mx]
        if why:
            bad += 1
            print(f"CUT  {os.path.basename(f)}: {' and '.join(why)} on sound (first {h:.3f}, last {t:.3f} of peak)")
    print(f"voiceedges: {len(files)} takes, {bad} cut" if bad else f"voiceedges: {len(files)} takes, no cut voice")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
