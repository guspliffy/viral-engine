"""VoxCPM2 voices (7 Nov 2026, Jonny: "the new model sounds better than what we use now"): openbmb/VoxCPM2,
Apache-2.0 (code and weights, commercial use allowed), 2B parameters, run on the CPU. Found through VoiceStudio, whose
own default model (OmniVoice) is non-commercial and not used here. Test sheet: project files audio/voicestudio-test-01.

A recipe with "vox" reads its line with VoxCPM2 in the voice of a reference clip (engine/voice/targets/, always a
synthetic voice: a Kokoro read or a VoxCPM2 voice made from a text description, never a recording of a real person).
The acting direction goes in brackets in front of the text ("(flat, deadpan)I told you."); the model does not speak it.
Runs in its own venv (engine/voice/.venv-vox, node engine/voice/setup.mjs --vox: CPU torch + voxcpm, ~1.5 GB; the
model, ~5 GB, downloads from Hugging Face on first use). About 3 s of compute per second of speech on 4 cores, plus
~25 s to load the model once per batch.
  stdin: {"jobs": [{"out": a.wav, "text": "...", "style": "excited", "ref": "/abs/target.wav", "seed": 123}]}
  -> one float WAV per job at the model's rate (48 kHz) and, when faster-whisper is installed, the words it heard
     with their times (Whisper small, word timestamps) in <out>.words.json, for the lip sync and caption timing
     (tts.py align) and to catch a misread line. Printed summary {"done": n, "sr": 48000}
Deterministic: each line has its own fixed seed, CPU only."""
import json, sys
import numpy as np, soundfile as sf, torch
from voxcpm import VoxCPM

torch.set_num_threads(max(1, min(8, torch.get_num_threads())))
req = json.load(sys.stdin)
m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu")
sr = m.tts_model.sample_rate
try:
    from faster_whisper import WhisperModel
    asr = WhisperModel("small", device="cpu", compute_type="int8")
except Exception:  # timing then falls back to the spoken stretches alone
    asr = None
for j in req["jobs"]:
    torch.manual_seed(j.get("seed", 1)); np.random.seed(j.get("seed", 1) % 2**32)
    text = (f"({j['style']})" if j.get("style") else "") + j["text"]
    w = m.generate(text=text, reference_wav_path=j["ref"], cfg_value=j.get("cfg", 2.0), inference_timesteps=j.get("steps", 10))
    w = np.asarray(w, np.float32)
    sf.write(j["out"], w, sr, subtype="FLOAT")
    if asr:
        a16 = np.interp(np.arange(0, len(w) * 16000 // sr) * sr / 16000, np.arange(len(w)), w).astype(np.float32)
        segs, _ = asr.transcribe(a16, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
        words = [[x.word.strip(), round(x.start, 3), round(x.end, 3)] for sg in segs for x in sg.words]
        with open(j["out"] + ".words.json", "w") as f: json.dump(words, f)
print(json.dumps({"done": len(req["jobs"]), "sr": sr}))
