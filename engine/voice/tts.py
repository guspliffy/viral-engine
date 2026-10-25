"""Real speech for the engine: Kokoro-82M text-to-speech, run locally on the CPU.

Called by engine/voice/speech.mjs with a batch of jobs as JSON on stdin; writes one WAV (44.1 kHz mono, 16-bit) and
one JSON per job into the cache folder and prints a JSON summary. The JSON holds the line's length and every phoneme
with its start and length, read from the model's own duration predictor, so the mouth matches the sound exactly.

  { "cache": "out/speech", "jobs": [ { "id": "ab12..", "text": "Watch and learn!", "voice": { "am_fenrir": 1 },
    "speed": 1.05, "lang": "en-us", "pitch": 0, "soft": false } ] }

Deterministic: the same job always gives the same file. Claude can't hear the result; levels are measured here.
"""
import json, os, subprocess, sys, tempfile
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
    ph = k.tokenizer.phonemize(job["text"], job.get("lang", "en-us"))
    audio, phones, t = [], [], 0.0
    for chunk in k._split_phonemes(ph):
        toks = k.tokenizer.tokenize(chunk)[:MAX_PHONEME_LENGTH]
        style = style_all[len(toks)].reshape(1, 256).astype(np.float32)
        a, d = k.sess.run(None, {"tokens": np.array([[0, *toks, 0]], dtype=np.int64), "style": style,
                                 "speed": np.array([speed], dtype=np.float32)})
        d = d.ravel()
        # d[0] and d[-1] are the start and end pads: keep a little of each, the rest is silence
        lead, tail = int(d[0] * HOP), int(d[-1] * HOP)
        keep0 = max(0, lead - int(0.03 * SR_MODEL))
        body = a[keep0: len(a) - max(0, tail - int(0.08 * SR_MODEL))]
        t0 = t + (lead - keep0) / SR_MODEL
        chars = [c for c in chunk if k.tokenizer.tokenize(c)]  # the characters that became tokens, in order
        for c, f in zip(chars, d[1:-1]):
            phones.append([c, round(float(t0), 4), round(float(f) * HOP / SR_MODEL, 4)])
            t0 += f * HOP / SR_MODEL
        audio.append(body)
        t += len(body) / SR_MODEL
    x = np.concatenate(audio).astype(np.float32)
    af = ["highpass=f=40"]
    if job.get("pitch"):
        fm = "shifted" if job.get("formant") == "shift" else "preserved"
        af.append(f"rubberband=pitch={2 ** (job['pitch'] / 12):.5f}:formant={fm}:pitchq=quality:window=long:transients=smooth:phase=independent")
    if job.get("soft"):
        af.append(f"lowpass=f={SOFT['lowpass']}")
    af.append("acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")
    y = ffmpeg(x, SR_MODEL, ",".join(af), SR_OUT)
    # loudness: measured on a padded copy (the meter needs 0.4 s), then a lookahead limiter for the few peaks
    meas = np.concatenate([y, np.zeros(max(0, int(0.5 * SR_OUT) - len(y)), np.float32)])
    target = LUFS + (SOFT["gain_db"] if job.get("soft") else 0)
    y = y * 10 ** ((target - pyln.Meter(SR_OUT).integrated_loudness(meas)) / 20)
    y = ffmpeg(y, SR_OUT, f"aresample=176400,alimiter=limit={CEILING}:attack=3:release=60:level=false,aresample={SR_OUT}", SR_OUT)
    return y, phones


def main():
    req = json.load(sys.stdin)
    os.makedirs(req["cache"], exist_ok=True)
    from kokoro_onnx import Kokoro
    k = Kokoro(durations_model(), os.path.join(MODELS, "voices-v1.0.bin"))
    done = []
    for job in req["jobs"]:
        y, phones = synth(k, job)
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
