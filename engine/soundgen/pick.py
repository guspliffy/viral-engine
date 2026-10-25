#!/usr/bin/env python3
"""Turn raw AI takes into library sounds: cut single events, rank them with CLAP, write files + manifests.

usage: pick.py RECIPES RAW_DIR --sfx-out assets/sfx/ai --music-out assets/music/ai [--report report.json]

Claude can't hear audio, so the picking is measured, not listened to:
  - events are islands of sound between silences (split kinds are further cut at onsets),
  - leading silence is trimmed to under 10 ms (the engine puts the file start on the hit frame),
  - CLAP (laion/larger_clap_general, Apache 2.0) scores each cut as its similarity to its label minus its similarity
    to the closest distractor (other sounds, music, speech, noise); above 0 it sounds most like its label; the best
    cuts across seeds win,
  - music beds are cut on their own detected beats (first beat to the beat 4*bars later; the asked BPM is only a
    hint, the model drifts) and the audio after the cut is crossfaded into the head, so the loop seam is continuous.
Jonny judges the result by ear from the test sheet.
"""
import argparse, json, os, subprocess, tempfile
import numpy as np, librosa, soundfile as sf, pyloudnorm as pyln, torch
from transformers import ClapModel, ClapProcessor

SR = 44100
HOP = 128
LICENSE = "Stability AI Community License (free for organisations under $1M total annual revenue; register commercial use with Stability AI)"
MODEL_URL = "https://huggingface.co/stabilityai/stable-audio-3-small-sfx"

# What a single cut should sound like (CLAP label) and how many cuts to keep per id.
LABELS = {
    "katana-slice": "a single katana sword slash",
    "step-wood": "a single footstep on a wooden floor",
    "step-grass": "a single footstep on grass",
    "step-concrete": "a single footstep on concrete",
    "step-carpet": "a single soft footstep on carpet",
    "key-press": "a single key press on a computer keyboard",
    "knock": "a single knock on a wooden door",
    "magic-zap": "a magic spell zap with sparkles",
    "wing-flap": "a single flap of large bird wings",
}
DISTRACTORS = ["music", "people talking", "static noise", "an explosion", "a gunshot", "water splashing",
               "a dog barking", "wind blowing", "a car engine", "applause"]
KEEP = {"oneshot": 4, "split": 8}
PER_TAKE = {"oneshot": 2, "split": 3}


def mono(path):
    y, sr = librosa.load(path, sr=SR, mono=True)
    return y


def db(x):
    return 20 * np.log10(np.maximum(x, 1e-9))


def events(y, kind, lo, hi):
    """Return [(start, end)] sample ranges of single events in a take."""
    rms = librosa.feature.rms(y=y, frame_length=512, hop_length=HOP, center=True)[0]
    d = db(rms)
    peak, floor = d.max(), np.percentile(d, 10)
    thr = max(floor + 12, peak - 45)
    on = d > thr
    gap = int((0.15 if kind == "oneshot" else 0.04) * SR / HOP)
    # islands of sound separated by at least `gap` quiet frames
    isl, i, n = [], 0, len(on)
    while i < n:
        if not on[i]:
            i += 1; continue
        j = i
        while j < n:
            k = j
            while k < n and not on[k]:
                k += 1
            if k - j >= gap or k == n:
                break
            j = k + 1
            while j < n and on[j]:
                j += 1
        isl.append((i, j)); i = j + 1
    out = []
    for a, b in isl:
        ip = d[a:b].max()
        if ip < peak - 20:
            continue  # too weak next to the take's loudest event
        segs = [(a, b)]
        if kind == "split" and (b - a) * HOP / SR > hi:
            # one island holding several hits: cut at onsets
            env = librosa.onset.onset_strength(y=y[a * HOP:b * HOP], sr=SR, hop_length=HOP)
            ons = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=HOP, backtrack=True)
            ons = [a + o for o in ons if o > 2]
            cuts = [a] + ons + [b]
            segs = [(cuts[k], cuts[k + 1]) for k in range(len(cuts) - 1)]
        for sa, sb in segs:
            s0, s1 = sa * HOP, min(len(y), sb * HOP)
            seg = np.abs(y[s0:s1])
            if len(seg) < 64:
                continue
            p = seg.max()
            hot = np.nonzero(seg > p * 0.03)[0]  # -30 dB under the event's own peak
            st = s0 + max(0, hot[0] - int(0.002 * SR))
            # end: last frame within 40 dB of the event peak and 6 dB over the take's noise floor, plus a short tail
            fr = np.nonzero(d[sa:sb] > max(db(np.array([p]))[0] - 43, floor + 6))[0]
            en = min(s1, s0 + (fr[-1] + 1) * HOP + int(0.02 * SR)) if len(fr) else s1
            en = min(en, st + int(hi * SR))
            if (en - st) / SR < lo * 0.6:
                continue
            out.append((st, en, float(d[sa:sb].max() - floor)))
    return out


def finish(x, peak_db=-1.0):
    x = x.astype(np.float64).copy()
    fi = min(int(0.001 * SR), len(x) // 4)
    fo = min(int(0.015 * SR), len(x) // 3)
    if fi: x[:fi] *= np.linspace(0, 1, fi)
    if fo: x[-fo:] *= np.linspace(1, 0, fo)
    m = np.abs(x).max()
    return x * (10 ** (peak_db / 20) / m) if m > 0 else x


def lufs(x, sr=SR):
    meter = pyln.Meter(sr)
    pad = x if len(x) >= int(0.5 * sr) else np.concatenate([x, np.zeros(int(0.5 * sr) - len(x)) if x.ndim == 1 else np.zeros((int(0.5 * sr) - len(x), x.shape[1]))])
    v = meter.integrated_loudness(pad)
    return None if not np.isfinite(v) else round(float(v), 1)


class Clap:
    def __init__(self):
        self.m = ClapModel.from_pretrained("laion/larger_clap_general").eval()
        self.p = ClapProcessor.from_pretrained("laion/larger_clap_general")

    @torch.no_grad()
    def probs(self, clips, label, extra):
        texts = [label] + extra
        t = self.m.get_text_features(**self.p(text=texts, return_tensors="pt", padding=True))
        t = torch.nn.functional.normalize(getattr(t, "pooler_output", t), dim=-1)
        out = []
        for c in clips:
            a48 = librosa.resample(c.astype(np.float32), orig_sr=SR, target_sr=48000)
            a = self.m.get_audio_features(**self.p(audio=[a48], sampling_rate=48000, return_tensors="pt"))
            a = torch.nn.functional.normalize(getattr(a, "pooler_output", a), dim=-1)
            sim = (a @ t.T)[0]
            out.append(float(sim[0] - sim[1:].max()))  # margin over the closest distractor; > 0 = sounds most like its label
        return out


def sfx(rec, raw, outdir, clap, report):
    sounds = []
    labels = list(LABELS.values())
    for r in rec["sfx"]:
        rid, kind, (lo, hi) = r["id"], r["kind"], r["len"]
        label = LABELS[rid]
        extra = [l for l in labels if l != label and not (rid.startswith("step-") and "footstep" in l)] + DISTRACTORS
        cands = []
        for pi, prompt in enumerate(r["prompts"]):
            for seed in r["seeds"]:
                f = os.path.join(raw, rid, f"p{pi}-s{seed}.wav")
                if not os.path.exists(f):
                    continue
                y = mono(f)
                for st, en, snr in events(y, kind, lo, hi):
                    cands.append(dict(take=f"p{pi}-s{seed}", prompt=prompt, seed=seed, start=st, end=en, snr=snr, x=y[st:en]))
        if not cands:
            print(f"{rid}: no usable events"); continue
        ps = clap.probs([c["x"] for c in cands], label, extra)
        for c, p in zip(cands, ps):
            c["clap"] = p
            c["score"] = p + 0.001 * min(c["snr"], 40)
        cands.sort(key=lambda c: -c["score"])
        picked, per = [], {}
        for c in cands:
            if per.get(c["take"], 0) >= PER_TAKE[kind] or (c["end"] - c["start"]) / SR < lo:
                continue
            per[c["take"]] = per.get(c["take"], 0) + 1
            picked.append(c)
            if len(picked) == KEEP[kind]:
                break
        os.makedirs(os.path.join(outdir, rid), exist_ok=True)
        files, rows = [], []
        for k, c in enumerate(picked, 1):
            x = finish(c["x"])
            name = f"{rid}/{rid}-{k:02d}.wav"
            sf.write(os.path.join(outdir, name), x, SR, subtype="PCM_16")
            files.append(name)
            rows.append(dict(file=name, take=c["take"], prompt=c["prompt"], seed=c["seed"], startSec=round(c["start"] / SR, 3),
                             durationSec=round(len(x) / SR, 3), clap=round(c["clap"], 3), snrDb=round(c["snr"], 1),
                             loudnessLUFS=lufs(x)))
        report[rid] = dict(candidates=len(cands), picked=rows,
                           clapMedianAll=round(float(np.median([c["clap"] for c in cands])), 3))
        print(f"{rid}: {len(cands)} cuts -> kept {len(files)}  clap {[r['clap'] for r in rows]}")
        sounds.append(dict(id=rid, kind="sfx", files=files, gain=r.get("gain", 0.35), tags=r.get("tags", []),
                           durationSec=round(float(np.median([q["durationSec"] for q in rows])), 3),
                           prompt=r["prompts"], seed=[q["seed"] for q in rows],
                           model="stable-audio-3-small-sfx (sa3.cpp GGUF F16, 8 steps)", license=LICENSE,
                           loudnessLUFS=round(float(np.median([q["loudnessLUFS"] for q in rows if q["loudnessLUFS"] is not None] or [0])), 1),
                           replaces=r.get("replaces"), takes=rows))
    return sounds


def music(rec, raw, outdir, clap, report):
    beds = []
    meter = pyln.Meter(SR)
    for r in rec["music"]:
        rid, bpm, bars = r["id"], r["bpm"], r["bars"]
        m = int(0.25 * SR)  # crossfade length
        files, rows = [], []
        for pi, prompt in enumerate(r["prompts"]):
            for seed in r["seeds"]:
                f = os.path.join(raw, rid, f"p{pi}-s{seed}.wav")
                if not os.path.exists(f):
                    continue
                y, _ = librosa.load(f, sr=SR, mono=False)
                y = y.T if y.ndim == 2 else np.stack([y, y], 1)
                # the model doesn't keep the asked tempo exactly: cut the loop on its own detected beats
                # (first beat -> the beat 4*bars later), dropping to fewer bars if the take is too short
                t0, beats = librosa.beat.beat_track(y=y.mean(1), sr=SR, start_bpm=bpm, units="samples")
                ratio = float(np.atleast_1d(t0)[0]) / bpm
                per_bar = 8 if ratio > 1.6 else 2 if ratio < 0.6 else 4  # beat tracker locked to double / half time
                got, start, end = 0, 0, 0
                for nb in (bars, bars // 2, bars // 4):
                    if nb and len(beats) > per_bar * nb and beats[per_bar * nb] + m <= len(y):
                        got, start, end = nb, int(beats[0]), int(beats[per_bar * nb]); break
                if not got:
                    print(f"{rid} {f}: no beat grid, skipped"); continue
                n = end - start
                loop = y[start:end].copy()
                w = np.sin(np.linspace(0, np.pi / 2, m))[:, None]
                loop[:m] = y[start:start + m] * w + y[end:end + m] * np.cos(np.linspace(0, np.pi / 2, m))[:, None]
                tempo = 4 * got * 60 / (n / SR)
                ibi = np.diff(beats[: per_bar * got + 1]) / SR
                steady = float(np.std(ibi) / np.mean(ibi))  # beat-to-beat spread; small = steady pulse, safe to loop
                tempo_ok = steady < 0.06
                g = 10 ** ((-16 - meter.integrated_loudness(loop)) / 20)
                loop = loop * g
                pk = np.abs(loop).max()
                if pk > 10 ** (-1.5 / 20):
                    loop *= 10 ** (-1.5 / 20) / pk
                k = len(files) + 1
                name = f"{rid}/{rid}-{k:02d}.ogg"
                os.makedirs(os.path.join(outdir, rid), exist_ok=True)
                with tempfile.NamedTemporaryFile(suffix=".wav") as t:
                    sf.write(t.name, loop, SR, subtype="PCM_16")
                    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t.name, "-c:a", "libvorbis", "-q:a", "6",
                                    os.path.join(outdir, name)], check=True)
                p = clap.probs([loop.mean(1)[: 10 * SR]], prompt.split(",")[0], [b["prompts"][0].split(",")[0] for b in rec["music"] if b["id"] != rid] + ["silence", "people talking", "static noise"])[0]
                files.append(name)
                rows.append(dict(file=name, seed=seed, durationSec=round(n / SR, 3), bars=got, bpm=round(tempo, 1),
                                 beatSpread=round(steady, 3), steadyBeat=tempo_ok, clap=round(p, 3), loudnessLUFS=round(meter.integrated_loudness(loop), 1)))
        report[rid] = dict(picked=rows)
        print(f"{rid}: {[(q['bpm'], q['bars'], q['beatSpread'], q['clap']) for q in rows]}")
        beds.append(dict(id=rid, kind="music", files=files, tags=[r["mood"]], mood=r["mood"], bpm=round(float(np.median([q["bpm"] for q in rows])), 1), bars=min(q["bars"] for q in rows), key=None, askedBpm=bpm,
                         loopable=all(q["steadyBeat"] for q in rows),
                         durationSec=round(float(np.median([q["durationSec"] for q in rows])), 3), prompt=r["prompts"], seed=[q["seed"] for q in rows],
                         model="stable-audio-3-small-music (sa3.cpp GGUF F16, 8 steps)", license=LICENSE,
                         loudnessLUFS=-16.0, takes=rows))
    return beds


def manifest(path, items, model_url):
    src = dict(name="Stable Audio 3 Small (generated locally with sa3.cpp)", url=model_url, license=LICENSE,
               generated="engine/soundgen (recipes.json -> generate.py -> pick.py)")
    json.dump(dict(source=src, sounds=items), open(path, "w"), indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipes"); ap.add_argument("raw")
    ap.add_argument("--sfx-out"); ap.add_argument("--music-out"); ap.add_argument("--report")
    a = ap.parse_args()
    rec = json.load(open(a.recipes))
    clap, report = Clap(), {}
    if a.sfx_out:
        os.makedirs(a.sfx_out, exist_ok=True)
        manifest(os.path.join(a.sfx_out, "manifest.json"), sfx(rec, a.raw, a.sfx_out, clap, report), MODEL_URL)
    if a.music_out:
        os.makedirs(a.music_out, exist_ok=True)
        manifest(os.path.join(a.music_out, "manifest.json"), music(rec, a.raw, a.music_out, clap, report),
                 MODEL_URL.replace("-sfx", "-music"))
    if a.report:
        json.dump(report, open(a.report, "w"), indent=1)


if __name__ == "__main__":
    main()
