#!/usr/bin/env python3
"""Pick one-shot music swells (recipes with "swell": true): a crescendo that plays once under a scene and is cut at
its payoff, not a loop. Claude can't hear, so each take is scored by its shape: how steadily its loudness rises over
the first `--len` seconds (correlation of the short-term loudness with a straight ramp) and how far it rises (dB from
the first to the last second), plus CLAP similarity to its prompt. The best takes are trimmed to start on their
first sound, faded in over 0.3 s, set to -16 LUFS at the top of the swell and written as Ogg Vorbis.

usage: VENV/bin/python engine/soundgen/swell.py RECIPES RAW_DIR OUT_DIR [--len 7] [--keep 2]
       (then merge OUT_DIR/swells.json into assets/music/ai/manifest.json)
"""
import argparse, json, os, subprocess, tempfile
import numpy as np, librosa, soundfile as sf, pyloudnorm as pyln

SR = 44100


def shape(y, n):
    """loudness every 0.25 s over the first n seconds (dB), its correlation with a ramp, and its rise"""
    hop = SR // 4
    m = y[: n * SR].mean(1) if y.ndim > 1 else y[: n * SR]
    db = np.array([20 * np.log10(np.sqrt(np.mean(m[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(m) - hop, hop)])
    ramp = np.arange(len(db))
    corr = float(np.corrcoef(ramp, db)[0, 1]) if np.std(db) > 0 else 0.0
    rise = float(np.mean(db[-4:]) - np.mean(db[:4]))
    return corr, rise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipes"); ap.add_argument("raw"); ap.add_argument("out")
    ap.add_argument("--len", type=int, default=7); ap.add_argument("--keep", type=int, default=2)
    a = ap.parse_args()
    rec = json.load(open(a.recipes)); meter = pyln.Meter(SR); items = []
    for r in [m for m in rec["music"] if m.get("swell")]:
        rows = []
        for f in sorted(os.listdir(os.path.join(a.raw, r["id"]))):
            if not f.endswith(".wav"): continue
            y, _ = librosa.load(os.path.join(a.raw, r["id"], f), sr=SR, mono=False)
            y = y.T if y.ndim > 1 else np.stack([y, y], 1)
            on = int(np.argmax(np.abs(y).max(1) > 10 ** (-40 / 20)))   # the first sound
            y = y[on:]
            corr, rise = shape(y, a.len)
            rows.append(dict(f=f, y=y, corr=corr, rise=rise, score=corr + 0.03 * min(rise, 15)))
            print(f"{r['id']} {f}: ramp {corr:.2f}, rise {rise:.1f} dB")
        rows.sort(key=lambda q: -q["score"]); files, takes = [], []
        for k, q in enumerate(rows[: a.keep], 1):
            y = q["y"][: (a.len + 3) * SR].copy()
            fade = int(0.3 * SR); y[:fade] *= np.linspace(0, 1, fade)[:, None]
            top = y[(a.len - 2) * SR: a.len * SR]
            y *= 10 ** ((-16 - meter.integrated_loudness(top)) / 20)
            pk = np.abs(y).max()
            if pk > 10 ** (-1.5 / 20): y *= 10 ** (-1.5 / 20) / pk
            name = f"{r['id']}/{r['id']}-{k:02d}.ogg"; os.makedirs(os.path.join(a.out, r["id"]), exist_ok=True)
            with tempfile.NamedTemporaryFile(suffix=".wav") as t:
                sf.write(t.name, y, SR, subtype="PCM_16")
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t.name, "-c:a", "libvorbis", "-q:a", "6", os.path.join(a.out, name)], check=True)
            seed = int(q["f"].split("-s")[1].split(".")[0]); files.append(name)
            takes.append(dict(file=name, seed=seed, durationSec=round(len(y) / SR, 3), ramp=round(q["corr"], 3), riseDb=round(q["rise"], 1), loudnessLUFS=-16.0))
        items.append(dict(id=r["id"], kind="music", files=files, tags=[r["mood"], "swell"], mood=r["mood"], bpm=None, bars=None, key=None,
                          askedBpm=r["bpm"], loopable=False, swell=True, durationSec=takes[0]["durationSec"] if takes else 0, prompt=r["prompts"],
                          seed=[t["seed"] for t in takes], model="stable-audio-3-small-music (sa3.cpp GGUF F16, 8 steps)",
                          license="Stability AI Community License (free for organisations under $1M total annual revenue; register commercial use with Stability AI)",
                          loudnessLUFS=-16.0, takes=takes))
    json.dump(items, open(os.path.join(a.out, "swells.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
