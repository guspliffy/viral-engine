#!/usr/bin/env python3
"""Join one clip's score from generated takes: one take per section, picked without ears, joined at the story's
seconds (12 Nov 2026, Survive it 04: a bed that loops one mood can't follow a story that turns; Jonny wants the music
to change at the turn). Each section's takes (RAW_DIR/<id>/*.wav from generate.py) are scored by CLAP: similarity to
the section's label against the spec's `against` list (what the music must NOT sound like: cartoon, game, pop). The
best take is trimmed to its first sound (`onset`: to its first strong hit), set to the section's loudness, and laid
from the section's `from` second to the next one's with an equal-power crossfade of `fadeIn` seconds.

usage: VENV/bin/python engine/soundgen/score.py SPEC.json RAW_DIR MUSIC_OUT_DIR   (writes <out> and <out>.json)
"""
import json, os, subprocess, sys, tempfile
import numpy as np, librosa, soundfile as sf, pyloudnorm as pyln
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pick import Clap, SR


def main():
    spec = json.load(open(sys.argv[1])); raw, outdir = sys.argv[2], sys.argv[3]
    clap, meter = Clap(), pyln.Meter(SR)
    dur, secs = spec["duration"], spec["sections"]
    n = int(round(dur * SR)); mix = np.zeros((n, 2), np.float32); report = []
    for i, s in enumerate(secs):
        end = secs[i + 1]["from"] + secs[i + 1].get("fadeIn", 0.1) if i + 1 < len(secs) else dur
        need = int(round((end - s["from"]) * SR)); rows = []
        for f in sorted(os.listdir(os.path.join(raw, s["id"]))):
            if not f.endswith(".wav"): continue
            y, _ = librosa.load(os.path.join(raw, s["id"], f), sr=SR, mono=False)
            y = y.T if y.ndim > 1 else np.stack([y, y], 1)
            env = np.abs(y).max(1)
            on = int(np.argmax(env > 10 ** ((-18 if s.get("onset") else -40) / 20) * env.max()))   # first (strong) sound
            y = y[max(0, on - int(0.01 * SR)):]
            if len(y) < need: continue
            cut = y[:need]
            p = clap.probs([cut.mean(1)[: 10 * SR]], s["label"], spec["against"])[0]
            rows.append((float(p), f, cut))
        if not rows: raise SystemExit(f"{s['id']}: no take is long enough ({need / SR:.1f} s)")
        rows.sort(key=lambda r: -r[0]); p, f, cut = rows[0]
        cut = cut * 10 ** ((s["lufs"] - meter.integrated_loudness(cut.astype(np.float64))) / 20)
        a = int(round(s["from"] * SR)); k = int(round(s.get("fadeIn", 0.1) * SR)); w = np.ones(need, np.float32)
        w[:k] = np.sin(np.linspace(0, np.pi / 2, k))
        if i:                                                       # the section before fades out under this one's fade in
            mix[a:a + k] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None]; mix[a + k:] = 0
        b = min(n, a + need); mix[a:b] += (cut * w[:, None])[: b - a]
        report.append(dict(section=s["id"], take=f, clap=round(p, 3), others=[(g, round(q, 3)) for q, g, _ in rows[1:]],
                           **{"from": s["from"]}, lufs=s["lufs"]))
        print(f"{s['id']}: {f} (clap {p:.3f}; others {[(g, round(q, 3)) for q, g, _ in rows[1:]]})")
    k = int(0.2 * SR); mix[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None]
    pk = np.abs(mix).max()
    if pk > 10 ** (-1.5 / 20): mix *= 10 ** (-1.5 / 20) / pk
    out = os.path.join(outdir, spec["out"]); os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as t:
        sf.write(t.name, mix, SR, subtype="PCM_16")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t.name, "-c:a", "libvorbis", "-q:a", "6", out], check=True)
    json.dump(dict(spec=os.path.basename(sys.argv[1]), sections=report), open(out + ".json", "w"), indent=1)
    print("wrote", out)


if __name__ == "__main__":
    main()
