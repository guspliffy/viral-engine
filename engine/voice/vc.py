"""Voice conversion for recipes with "convert" (6 Nov 2026, Pebble): Chatterbox VC (Resemble AI, MIT) keeps a line's
words, timing and accent and gives it the target clip's voice; then Praat PSOLA narrows the melody toward the median
(k 0.62 turns a 15-semitone range into about 9, like the storytellers measured in the voice lab) without a vocoder.
Runs in its own venv (engine/voice/.venv-vc, node engine/voice/setup.mjs --vc: torch + chatterbox-tts, ~3 GB).
Targets are synthetic Kokoro clips in engine/voice/targets/, never a recording of a real person.
Optional "age" {"formant": ratio, "pitch": semitones, "range": factor} (Jonny 6 Nov 2026: "a bit older, more wise"):
Praat's Change gender lowers the formants (a longer vocal tract reads older and bigger), moves the pitch median and
squeezes the range, again by PSOLA.
  stdin: {"jobs": [{"in": a.wav, "out": b.wav, "target": t.wav, "calm": 0.62, "age": {...}}]}   -> 24 kHz mono float WAVs
Deterministic: fixed seed, CPU."""
import json, sys
import numpy as np, torch, torchaudio, soundfile as sf, parselmouth
from parselmouth.praat import call
from chatterbox.vc import ChatterboxVC

torch.set_num_threads(4)
req = json.load(sys.stdin)
m = ChatterboxVC.from_pretrained("cpu")
for j in req["jobs"]:
    torch.manual_seed(1)
    m.set_target_voice(j["target"])
    w = m.generate(j["in"]).squeeze(0).numpy().astype(np.float64)
    k = j.get("calm")
    if k:
        s = parselmouth.Sound(w, sampling_frequency=m.sr)
        man = call(s, "To Manipulation", 0.01, 60, 300); tier = call(man, "Extract pitch tier")
        n = call(tier, "Get number of points")
        pts = [(call(tier, "Get time from index", i), call(tier, "Get value at index", i)) for i in range(1, n + 1)]
        if pts:
            med = float(np.median([f for _, f in pts]))
            call(tier, "Remove points between", 0, s.duration + 1)
            for t, f in pts: call(tier, "Add point", t, med * (f / med) ** k)
            call([tier, man], "Replace pitch tier")
            w = call(man, "Get resynthesis (overlap-add)").values[0]
    a = j.get("age")
    if a:
        s = parselmouth.Sound(w, sampling_frequency=m.sr)
        f0 = call(s.to_pitch(0.01, 60, 300), "Get quantile", 0, 0, 0.5, "Hertz")
        med = f0 * 2 ** (a.get("pitch", 0) / 12) if f0 == f0 else 0
        w = call(s, "Change gender", 60, 300, a.get("formant", 1), med, a.get("range", 1), 1).values[0]
    sf.write(j["out"], w.astype(np.float32), m.sr, subtype="FLOAT")
print(json.dumps({"done": len(req["jobs"]), "sr": m.sr}))
