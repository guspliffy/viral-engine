"""Real speech for the engine: Kokoro-82M text-to-speech, run locally on the CPU.

Called by engine/voice/speech.mjs with a batch of jobs as JSON on stdin; writes one WAV (44.1 kHz mono, 16-bit) and
one JSON per job into the cache folder and prints a JSON summary. The JSON holds the line's length and every phoneme
with its start and length, read from the model's own duration predictor, so the mouth matches the sound exactly.

  { "cache": "out/speech", "jobs": [ { "id": "ab12..", "text": "Watch and learn!", "voice": { "am_fenrir": 1 },
    "speed": 1.05, "lang": "en-us", "pitch": 0, "soft": false } ] }

Deterministic: the same job always gives the same file. Claude can't hear the result; levels are measured here.
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf, pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "models")
SR_MODEL, SR_OUT, HOP = 24000, 44100, 600   # Kokoro: 24 kHz, one duration frame = 600 samples (25 ms)
LUFS, CEILING = -16.0, 0.79                 # every line at the same loudness, limiter at -2 dBFS
SOFT = {"speed": 0.91, "lowpass": 5500, "gain_db": -7}  # Jonny's whisper pick (2026-10-25): no breath effect, slower, softer


def durations_model():
    """The released ONNX file only outputs audio. Expose the duration predictor's output (frames per phoneme) once."""
    src, dst = os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "kokoro-v1.0-durations.onnx")
    if not os.path.exists(dst):
        import onnx
        m = onnx.load(src)
        m.graph.output.append(onnx.helper.make_tensor_value_info("/encoder/Clip_output_0", onnx.TensorProto.FLOAT, None))
        onnx.save(m, dst)
    return dst


# Non-words. espeak spells a word it doesn't know letter by letter, so "hnnnngh!" came out as "aitch en en en...".
# These become the sound itself instead: (pattern, phonemes, speed factor, effect). Kokoro invents vowels when a sound
# is stretched with long marks (ː) or a repeated hiss, so length comes from repeating a voiced nasal or from speaking
# a single sound slower. n = how many times the word's main letter repeats.
STRAIN = "vibrato=f=7:d=0.25"  # a straining "hnnnngh": the voice shakes with the effort
SOUNDS = [
    (r"h?n+g*h?", lambda n: ("h" if n["w"][0] == "h" else "ʔ") + "ŋ" * min(6, max(3, n["n"])), 1.0, STRAIN),  # hnnngh, nnngh
    (r"h?m{2,}|hm", lambda n: ("h" if n["w"][0] == "h" else "") + "m" * min(5, max(2, n["m"])), 1.0, None),   # hmm, mmm
    (r"hmph", lambda n: "hmf", 0.8, None),
    (r"m+-?hm+|mhm", lambda n: "mhˈm", 0.8, None),                                                            # mm-hmm
    (r"g*r{2,}", lambda n: "ɡɹ", 0.6, None),                                                                  # grrr
    (r"b+r{2,}", lambda n: "bɹ", 0.6, None),                                                                  # brrr
    (r"s?h{2,}|sh+", lambda n: "ʃ", 0.45, None),                                                              # shhh
    (r"p+f+t?", lambda n: "pf", 0.45, None),                                                                  # pfff
    (r"z{3,}", lambda n: "z", 0.4, None),                                                                     # zzz
]


def sound(word):
    w = word.lower()
    for pat, ph, sp, fx in SOUNDS:
        if re.fullmatch(pat, w):
            return ph({"w": w, "n": w.count("n"), "m": w.count("m")}), sp, fx
    return None


ACCENTS = None


def accented(ph, name):
    """accent (6 Nov 2026): the accent's sound rules (accents.json) rewrite espeak's phonemes before Kokoro speaks them."""
    global ACCENTS
    if ACCENTS is None:
        with open(os.path.join(HERE, "accents.json")) as f:
            ACCENTS = json.load(f)
    for pat, rep in ACCENTS[name]["rules"]:
        ph = re.sub(pat, rep, ph)
    return ph


def segments(k, text, lang, speed):
    """The line as [(phonemes, speed, effect)]: espeak reads the words, SOUNDS makes the non-words."""
    out, words = [], ""
    for m in re.finditer(r"([A-Za-z][A-Za-z'-]*)?([^A-Za-z]*)", text):
        word, tail = m.group(1) or "", m.group(2)
        s = sound(word) if word else None
        if not s:
            words += word + tail
            continue
        if re.search(r"[A-Za-z]", words):
            out.append((k.tokenizer.phonemize(words, lang), speed, None))
        words = ""
        ph, sp, fx = s
        out.append((ph + (re.sub(r"[^.!?,…]", "", tail)[:1] or "."), speed * sp, fx))
    if re.search(r"[A-Za-z]", words) or not out:
        out.append((k.tokenizer.phonemize(words, lang), speed, None))
    return out


def ffmpeg(x, sr, af, out_sr):
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        sf.write(a, x, sr, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", af, "-ar", str(out_sr), b], check=True)
        return sf.read(b, dtype="float32")[0]


def synth(k, job):
    from kokoro_onnx.config import MAX_PHONEME_LENGTH
    mix = job["voice"]
    style_all = sum(k.get_voice_style(v) * (w / sum(mix.values())) for v, w in mix.items())
    speed = job.get("speed", 1.0) * (SOFT["speed"] if job.get("soft") else 1.0)
    audio, phones, t = [], [], 0.0
    # pause (a storyteller's phrasing, 6 Nov 2026): seconds of silence after each sentence or clause mark inside the
    # line, on top of the model's own short gap. Narrators pause about 0.5-0.8 s between phrases; Kokoro about 0.1 s
    pause = float(job.get("pause") or 0)
    parts = [p for p in re.split(r"(?<=[.!?;…])\s+", job["text"].strip()) if p] if pause else [job["text"]]
    work, acc = [], job.get("accent")
    lang = None
    if acc: accented("", acc); lang = ACCENTS[acc]["lang"]   # the accent picks its own espeak base read
    # human (6 Nov 2026, Jonny: "it should really sound human"): people never phrase evenly. Each phrase gets its own
    # pace (+-speedVar) and each pause its own length (+-pauseVar), and a soft inhale (breath, dBFS) ends a long pause.
    # Seeded by the text, so the same line always comes out the same.
    hu = job.get("human") or {}
    rng = np.random.default_rng(int.from_bytes(__import__("hashlib").sha1(job["text"].encode()).digest()[:4], "little"))
    for i, part in enumerate(parts):
        ps = speed * (1 + hu.get("speedVar", 0) * (2 * rng.random() - 1))
        seg = segments(k, part, lang or job.get("lang", "en-us"), ps)
        work += [(accented(ph, acc), sp, fx) if acc and fx is None else (ph, sp, fx) for ph, sp, fx in seg]
        if i < len(parts) - 1: work.append(None)
    for item in work:
        if item is None:
            pl = pause * (1 + hu.get("pauseVar", 0) * (2 * rng.random() - 1))
            gap = np.zeros(int(pl * SR_MODEL), np.float32)
            if hu.get("breath") is not None and pl > 0.45:
                gap[-int(0.42 * SR_MODEL):] += inhale(rng, 0.42, hu["breath"])
            audio.append(gap); phones.append([" ", round(t, 4), round(pl, 4)]); t += pl
            continue
        ph, sp, fx = item
        for chunk in k._split_phonemes(ph):
            toks = k.tokenizer.tokenize(chunk)[:MAX_PHONEME_LENGTH]
            style = style_all[len(toks)].reshape(1, 256).astype(np.float32)
            a, d = k.sess.run(None, {"tokens": np.array([[0, *toks, 0]], dtype=np.int64), "style": style,
                                     "speed": np.array([sp], dtype=np.float32)})
            d = d.ravel()
            # d[0] and d[-1] are the start and end pads: keep a little of each, the rest is silence
            lead, tail = int(d[0] * HOP), int(d[-1] * HOP)
            keep0 = max(0, lead - int(0.03 * SR_MODEL))
            body = a[keep0: len(a) - max(0, tail - int(0.08 * SR_MODEL))]
            if fx:
                body = ffmpeg(body, SR_MODEL, fx, SR_MODEL)[:len(body)]
            t0 = t + (lead - keep0) / SR_MODEL
            chars = [c for c in chunk if k.tokenizer.tokenize(c)]  # the characters that became tokens, in order
            for c, f in zip(chars, d[1:-1]):
                phones.append([c, round(float(t0), 4), round(float(f) * HOP / SR_MODEL, 4)])
                t0 += f * HOP / SR_MODEL
            audio.append(body)
            t += len(body) / SR_MODEL
    return np.concatenate(audio).astype(np.float32), phones


def inhale(rng, dur, db):
    """A soft breath in through the nose and mouth: band-limited noise (300-2800 Hz, a little louder near 1.2 kHz)
    that swells for 70 % of its length and stops just before the next word."""
    n = int(dur * SR_MODEL)
    f = np.fft.rfft(rng.standard_normal(n)); hz = np.fft.rfftfreq(n, 1 / SR_MODEL)
    f *= ((hz > 300) & (hz < 2800)) * (1 + 0.8 * np.exp(-((hz - 1200) / 500) ** 2))
    x = np.fft.irfft(f, n); x /= np.abs(x).max() + 1e-9
    u = np.linspace(0, 1, n); env = np.where(u < 0.7, (u / 0.7) ** 1.5, np.clip((0.9 - u) / 0.2, 0, 1))
    return (x * env * 10 ** (db / 20)).astype(np.float32)


def finish(x, sr, phones, job):
    """The line's sound after the model (and after voice conversion): pitch, softness, the recipe's EQ, levelling."""
    af = ["highpass=f=40"]
    # convert.tempo (a slower, older delivery): stretched without a pitch change; every phoneme time stretches with it
    tempo = (job.get("convert") or {}).get("tempo")
    if tempo:
        af.append(f"atempo={tempo}")
        phones = [[c, round(t / tempo, 4), round(d / tempo, 4)] for c, t, d in phones]
    if job.get("pitch"):
        fm = "shifted" if job.get("formant") == "shift" else "preserved"
        af.append(f"rubberband=pitch={2 ** (job['pitch'] / 12):.5f}:formant={fm}:pitchq=quality:window=long:transients=smooth:phase=independent")
    if job.get("soft"):
        af.append(f"lowpass=f={SOFT['lowpass']}")
    # post: the recipe's own ffmpeg filters after the voice (a warmer EQ, a softer top), before levelling
    if job.get("post"):
        af.append(job["post"])
    af.append("acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")
    y = ffmpeg(x, sr, ",".join(af), SR_OUT)
    # loudness: measured on a padded copy (the meter needs 0.4 s), then a lookahead limiter for the few peaks
    meas = np.concatenate([y, np.zeros(max(0, int(0.5 * SR_OUT) - len(y)), np.float32)])
    target = LUFS + (SOFT["gain_db"] if job.get("soft") else 0)
    y = y * 10 ** ((target - pyln.Meter(SR_OUT).integrated_loudness(meas)) / 20)
    y = ffmpeg(y, SR_OUT, f"aresample=176400,alimiter=limit={CEILING}:attack=3:release=60:level=false,aresample={SR_OUT}", SR_OUT)
    return y, phones


def vc_python():
    if os.environ.get("VOICE_VC_PYTHON"): return os.environ["VOICE_VC_PYTHON"]
    p = os.path.join(HERE, ".venv-vc", "Scripts/python.exe" if os.name == "nt" else "bin/python")
    return p if os.path.exists(p) else None


def convert(jobs, raw):
    """convert (6 Nov 2026, Pebble): {"target": a synthetic clip in engine/voice/targets/, "calm": k, "tempo": t,
    "age": {"formant", "pitch", "range"}}. All
    lines of the batch go through vc.py in one call (the model loads once, ~10 s; ~12 s per line on 4 CPU cores)."""
    if not jobs: return {}
    py = vc_python()
    if not py:
        raise RuntimeError("voice recipe needs voice conversion: run node engine/voice/setup.mjs --vc (or set VOICE_VC_PYTHON)")
    out = {}
    with tempfile.TemporaryDirectory() as d:
        req = []
        for j in jobs:
            a, b = os.path.join(d, j["id"] + ".in.wav"), os.path.join(d, j["id"] + ".out.wav")
            sf.write(a, raw[j["id"]][0], SR_MODEL, subtype="FLOAT")
            c = j["convert"]
            req.append({"in": a, "out": b, "target": os.path.join(HERE, c["target"]), "calm": c.get("calm"), "age": c.get("age")})
        r = subprocess.run([py, os.path.join(HERE, "vc.py")], input=json.dumps({"jobs": req}), capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError("vc.py failed\n" + r.stderr[-3000:])
        for j, q in zip(jobs, req):
            y, sr = sf.read(q["out"], dtype="float32")
            out[j["id"]] = (y, sr)
    return out


def main():
    req = json.load(sys.stdin)
    os.makedirs(req["cache"], exist_ok=True)
    from kokoro_onnx import Kokoro
    k = Kokoro(durations_model(), os.path.join(MODELS, "voices-v1.0.bin"))
    done = []
    raw = {job["id"]: synth(k, job) for job in req["jobs"]}
    converted = convert([j for j in req["jobs"] if j.get("convert")], raw)
    for job in req["jobs"]:
        x, phones = raw[job["id"]]
        y, phones = finish(*(converted[job["id"]] if job["id"] in converted else (x, SR_MODEL)), phones, job)
        base = os.path.join(req["cache"], job["id"])
        info = {"id": job["id"], "text": job["text"], "dur": round(len(y) / SR_OUT, 4), "phones": phones,
                "peak": round(float(np.abs(y).max()), 3), "clipped": int((np.abs(y) >= 0.999).sum())}
        # the JSON is written last and both files appear whole (rename), so a cache entry is never half-written
        sf.write(base + ".tmp.wav", y, SR_OUT, subtype="PCM_16")
        os.replace(base + ".tmp.wav", base + ".wav")
        with open(base + ".tmp.json", "w") as f:
            json.dump(info, f)
        os.replace(base + ".tmp.json", base + ".json")
        done.append({"id": job["id"], "dur": info["dur"], "peak": info["peak"]})
    print(json.dumps({"done": done}))


if __name__ == "__main__":
    main()
