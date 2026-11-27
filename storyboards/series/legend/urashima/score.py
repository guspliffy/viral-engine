"""Urashima score: Sol's five cues (engine/soundgen/recipes-urashima.json) joined at the board's seconds. Sections are
longer than one 18-22 s take, so each section alternates its takes (Sol's verbatim prompt, both seeds) with 1.5 s
equal-power crossfades; then Sol's silences: none under the grave + "only gone three years", cut on the cord release,
fade out fully before "Once. Just a peek.", nothing after.
  ~/.cache/viral-engine/soundgen/venv/bin/python storyboards/series/legend/urashima/score.py RAW_DIR OUT.wav TIMELINE.json"""
import json, sys
import numpy as np, soundfile as sf, librosa, pyloudnorm as pyln
RAW, OUT, TLF = sys.argv[1:4]
SR = 44100; X = 1.5
tl = json.load(open(TLF)); at = {b["line"]: b["lineAt"] for b in tl if b.get("line")}
DUR = max(at.values()) + 3.0
S = [("ura-beach", 0.0, -20), ("ura-palace", at["L08"] - 0.3, -21), ("ura-grief", at["L16"] - 0.2, -22),
     ("ura-dread", at["L22"] - 0.2, -23), ("ura-sunset", at["L26"] - 0.4, -22)]
meter = pyln.Meter(SR)
def take(path):
    y, _ = librosa.load(path, sr=SR, mono=False); y = np.atleast_2d(y)
    if y.shape[0] == 1: y = np.vstack([y, y])
    return y.T.astype(np.float32)
def fill(sid, n):
    takes = [take(f"{RAW}/{sid}/p0-s901.wav"), take(f"{RAW}/{sid}/p0-s902.wav")]
    out = takes[0].copy(); k = 1; x = int(X * SR)
    while len(out) < n:
        t = takes[k % 2]; k += 1
        w = np.linspace(0, np.pi / 2, x)[:, None]
        out[-x:] = out[-x:] * np.cos(w) + t[:x] * np.sin(w)
        out = np.vstack([out, t[x:]])
    return out[:n]
mix = np.zeros((int(DUR * SR), 2), np.float32)
for i, (sid, f, lufs) in enumerate(S):
    end = S[i + 1][1] + 0.8 if i + 1 < len(S) else DUR
    a, b = int(f * SR), int(end * SR); seg = fill(sid, b - a)
    seg *= 10 ** ((lufs - meter.integrated_loudness(seg.astype(np.float64))) / 20)
    fi = int((0.05 if i == 0 else 0.8) * SR); seg[:fi] *= np.sin(np.linspace(0, np.pi / 2, fi))[:, None]
    fo = int(0.8 * SR); seg[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo))[:, None]
    mix[a:b] += seg
env = np.ones(len(mix), np.float32); t = np.arange(len(mix)) / SR
def ramp(t0, t1, v0, v1):
    m = (t >= t0) & (t < t1); env[m] = np.minimum(env[m], v0 + (v1 - v0) * (t[m] - t0) / (t1 - t0))
def zero(t0, t1): env[(t >= t0) & (t < t1)] = 0
ramp(at["L18"] - 1.0, at["L18"], 1, 0); zero(at["L18"], at["L20"] - 0.3); ramp(at["L20"] - 0.3, at["L20"] + 0.7, 0, 1)
cord = at["L23"] + 1.2; zero(cord, at["L26"] - 0.4)
ramp(at["L27"] - 1.2, at["L27"] - 0.1, 1, 0); zero(at["L27"] - 0.1, DUR)
mix *= env[:, None]
sf.write(OUT, mix, SR)
print(OUT, round(DUR, 2), "s")
