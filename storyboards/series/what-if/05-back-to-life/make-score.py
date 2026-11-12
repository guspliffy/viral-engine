#!/usr/bin/env python3
"""Lays the recorded-sounding orchestra takes against the story of There's a catch 05 (back to life): one score file.

Jonny 12 Nov 2026 on the two beds synthesised in puppet/beat.mjs (styles chase, orchestra): "this sounds like game
music and not dramatic. it should be a dramatic orchestra with piano trumpets and timpani. really dramatic chasing
music". So the bed is made of takes from the local Stable Audio 3 Small music model (engine/soundgen, an approved
source in docs/ASSETS.md), prompts and seeds in engine/soundgen/recipes-back-to-life.json.

  VENV/bin/python make-score.py rank RAW_DIR                       # CLAP: which take sounds most like a real orchestra
  VENV/bin/python make-score.py lay CHASE.wav SUSPENSE.wav OUT.ogg # the score, cut on the takes' own beats

The story seconds below are the beats of make-back-to-life.mjs; change them together.
"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np, librosa, soundfile as sf, pyloudnorm as pyln

SR = 44100
HALL, RUN, CRASH, CALM, CHASE, SCYTHE, RISE, END = 1.5, 6.4, 8.8, 11.3, 14.5, 19.9, 20.5, 22.5

WANT = "a dramatic film score played by a real symphony orchestra with piano, trumpets and timpani"
NOT = ["video game music played by a synthesizer", "chiptune music", "electronic dance music with a drum machine",
       "calm relaxing music", "pop music with singing", "static noise"]


def load(f):
    """a take without its silent tail (the model plays about 14 s of the 18.8 s it is asked for)."""
    y, _ = librosa.load(f, sr=SR, mono=False)
    y = (y.T if y.ndim == 2 else np.stack([y, y], 1)).astype(np.float32)
    r = librosa.feature.rms(y=y.mean(1), frame_length=4096, hop_length=1024)[0]
    live = np.nonzero(r > r.max() * 10 ** (-30 / 20))[0]
    return y[: int(min(len(y), (live[-1] + 1) * 1024 - 0.25 * SR))]


def quiet_and_swell(y, need_quiet, need_swell):
    """where a suspense take is quietest for need_quiet seconds, and where the stretch of need_swell seconds
    ends loudest compared with its start (its own crescendo)."""
    mono, h = y.mean(1), int(0.25 * SR)
    e = np.array([np.sqrt(np.mean(mono[i:i + h] ** 2)) for i in range(0, len(mono) - h, h)])
    q, w = int(need_quiet / 0.25), int(need_swell / 0.25)
    qi = min(range(0, len(e) - q), key=lambda i: e[i:i + q].mean())
    wi = max(range(0, len(e) - w), key=lambda i: e[i + w - 4:i + w].mean() / (e[i:i + 4].mean() + 1e-6))
    return qi * h, wi * h


def rank(raw):
    import torch
    from transformers import ClapModel, ClapProcessor
    model = ClapModel.from_pretrained("laion/larger_clap_general").eval()
    proc = ClapProcessor.from_pretrained("laion/larger_clap_general")
    rows = []
    for f in sorted(glob.glob(os.path.join(raw, "*", "*.wav"))):
        y = librosa.load(f, sr=48000, mono=True)[0]
        with torch.no_grad():
            a = model.get_audio_features(**proc(audio=[y[: 10 * 48000], y[-10 * 48000:]], sampling_rate=48000, return_tensors="pt"))
            t = model.get_text_features(**proc(text=[WANT] + NOT, return_tensors="pt", padding=True))
        a = getattr(a, "pooler_output", a); t = getattr(t, "pooler_output", t)
        a = a / a.norm(dim=-1, keepdim=True); t = t / t.norm(dim=-1, keepdim=True)
        p = (100 * a @ t.T).softmax(-1).mean(0).numpy()
        tempo, beats = librosa.beat.beat_track(y=y, sr=48000)
        ibi = np.diff(librosa.frames_to_time(beats, sr=48000))
        rms = librosa.feature.rms(y=y, frame_length=4096, hop_length=2048)[0]
        rows.append(dict(file=os.path.relpath(f, raw), orchestra=round(float(p[0]), 3), game=round(float(p[1] + p[2] + p[3]), 3),
                         bpm=round(float(np.atleast_1d(tempo)[0]), 1), beatSpread=round(float(np.std(ibi) / np.mean(ibi)), 3) if len(ibi) > 2 else None,
                         quietest=round(float(20 * np.log10(np.percentile(rms, 5) / np.percentile(rms, 95) + 1e-9)), 1)))
    rows.sort(key=lambda r: -r["orchestra"])
    for r in rows:
        print(json.dumps(r))


def downbeats(y):
    """beat times (s) of a take and the energy that follows each (1.6 s window): where the take hits hardest."""
    mono = y.mean(1)
    _, b = librosa.beat.beat_track(y=mono, sr=SR, units="samples")
    w = int(1.6 * SR)
    e = np.array([float(np.sqrt(np.mean(mono[i:i + w] ** 2))) if i + w <= len(mono) else 0.0 for i in b])
    return b, e


def ramp(n, a, b):
    return np.linspace(a, b, n, dtype=np.float32)[:, None]


def lay(chase_f, susp_f, out):
    ch, su = load(chase_f), load(susp_f)
    meter = pyln.Meter(SR)
    ch *= 10 ** ((-16 - meter.integrated_loudness(ch)) / 20)
    su *= 10 ** ((-16 - meter.integrated_loudness(su)) / 20)
    b, e = downbeats(ch)
    n = int(END * SR)
    mix = np.zeros((n, 2), np.float32)

    def put(src, src_at, t0, t1, g0, g1, fin=0.03, fout=0.04, full_at=None):
        """src from sample src_at onto [t0, t1) of the score, gain g0 -> g1 (reached at full_at, else at t1)."""
        i0, i1 = int(t0 * SR), min(n, int(t1 * SR)); m = i1 - i0
        up = m if full_at is None else int((full_at - t0) * SR)
        env = np.concatenate([np.linspace(g0, g1, up), np.full(m - up, g1)]).astype(np.float32)[:, None]
        seg = np.take(src, np.arange(src_at, src_at + m) % len(src), axis=0) * env
        a, z = int(fin * SR), int(fout * SR)
        seg[:a] *= ramp(a, 0, 1); seg[-z:] *= ramp(z, 1, 0)
        mix[i0:i1] += seg

    def beat_before(sample):   # the take's own beat at or before a sample
        k = np.searchsorted(b, sample, side="right") - 1
        return int(b[max(0, k)])

    def hit(need):             # the hardest beat that still has `need` seconds of take after it
        ok = [i for i in range(len(b)) if b[i] + need * SR <= len(ch)]
        return int(b[max(ok, key=lambda i: e[i])]) if ok else int(b[0])

    # 0 cold open: the chase at its hardest, cut dead on the cut back to the hall
    put(ch, hit(HALL), 0, HALL, 1.15, 1.15, fin=0.005, fout=0.05)
    # 1 the hall: the quietest stretch of the suspense take
    quiet, swell = quiet_and_swell(su, RUN + 0.25 - HALL, CHASE + 0.05 - CALM)
    put(su, quiet, HALL, RUN + 0.25, 1.5, 1.7, fin=0.2, fout=0.3)
    # 2 Reaper runs and the row wakes: the chase comes up, one of its beats on the crash, full to the calm
    at = beat_before(hit(CALM - CRASH + 0.5))
    start = max(0, at - int((CRASH - RUN) * SR))
    put(ch, start, CRASH - (at - start) / SR, CALM + 0.2, 0.45, 1.0, fin=0.25, fout=0.3, full_at=CRASH)
    # 3 the calm and "But there's a catch.": the suspense take's own crescendo, ending on the cut to the chase
    put(su, swell, CALM, CHASE + 0.05, 0.75, 1.0, fin=0.3, fout=0.08)
    # 4 the chase through the city: the hardest stretch, a beat on the cut, cut dead when the scythe drops
    put(ch, hit(SCYTHE - CHASE), CHASE, SCYTHE, 1.12, 1.12, fin=0.005, fout=0.04)
    # 5 silence under the heartbeat, then the hill rises: the chase again, growing to the last frame
    put(ch, hit(END - RISE), RISE, END, 0.75, 1.2, fin=0.02, fout=0.08)

    pk = np.abs(mix).max()
    if pk > 10 ** (-1.5 / 20):
        mix *= 10 ** (-1.5 / 20) / pk
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as t:
        sf.write(t.name, mix, SR, subtype="PCM_16")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t.name, "-c:a", "libvorbis", "-q:a", "6", out], check=True)
    print(json.dumps(dict(out=out, seconds=END, chaseBeats=len(b), lufs=round(float(meter.integrated_loudness(mix)), 1), suspenseQuietAt=round(quiet / SR, 2), suspenseSwellAt=round(swell / SR, 2),
                          peakDb=round(float(20 * np.log10(np.abs(mix).max())), 1))))


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "rank":
        rank(sys.argv[2])
    elif len(sys.argv) == 5 and sys.argv[1] == "lay":
        lay(*sys.argv[2:])
    else:
        sys.exit(__doc__)
