"""Read an episode's lines with VoxCPM2 (legend channel, 26 Nov 2026), checked by Whisper, then tempo x1.15.
  engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py <lines.json> <out_dir> [ids...]
-> <out_dir>/<id>.wav (44.1 kHz mono, -16 LUFS) + <id>.words.json [[word, start, end], ...] (after the tempo change)
A voice may set "pitch" (semitones, rubberband) for a younger read of the same voice.
Deterministic: each line's seed is fixed; a take Whisper hears wrong is retried with the next seed (up to 4)."""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf, torch
from voxcpm import VoxCPM
from faster_whisper import WhisperModel
spec = json.load(open(sys.argv[1])); out = sys.argv[2]; only = set(sys.argv[3:])
TEMPO = spec.get("tempo", 1.15)
os.makedirs(out, exist_ok=True)
m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu"); sr = m.tts_model.sample_rate
asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().replace("1979", "nineteen seventy nine")).split()
def hear(w):
    a = np.interp(np.arange(0, len(w) * 16000 // sr) * sr / 16000, np.arange(len(w)), w).astype(np.float32)
    segs, _ = asr.transcribe(a, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    return [[x.word.strip(), x.start, x.end] for s in segs for x in s.words]
for lid, who, text, tone in spec["lines"]:
    if only and lid not in only: continue
    v = spec["voices"][who]; style = ", ".join(s for s in [v.get("style", ""), tone] if s)
    best = None
    for k in range(4):
        seed = 1000 + int(lid[1:]) * 7 + k * 101
        torch.manual_seed(seed); np.random.seed(seed)
        w = np.asarray(m.generate(text=f"({style}){text}", reference_wav_path=v["ref"], inference_timesteps=v.get("steps", 10), cfg_value=v.get("cfg", 2.0)), np.float32)
        words = hear(w)
        want, got = norm(text), norm(" ".join(x[0] for x in words))
        miss = len(set(want) ^ set(got))
        if best is None or miss < best[0]: best = (miss, w, words, seed)
        if miss <= 1 and abs(len(want) - len(got)) <= 1: break
    miss, w, words, seed = best
    raw = f"{out}/{lid}.raw.wav"; sf.write(raw, w, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", (f"rubberband=pitch={2 ** (v['pitch'] / 12):.5f}," if v.get("pitch") else "") + f"atempo={TEMPO},loudnorm=I=-16:TP=-2,silenceremove=start_periods=1:start_threshold=-50dB",
                    "-ar", "44100", "-ac", "1", f"{out}/{lid}.wav"], check=True)
    os.remove(raw)
    # word times after the tempo change and the trimmed lead-in
    lead = words[0][1] if words else 0
    json.dump([[x[0], round(max(0, (x[1] - lead)) / TEMPO, 3), round(max(0, (x[2] - lead)) / TEMPO, 3)] for x in words], open(f"{out}/{lid}.words.json", "w"))
    dur = sf.info(f"{out}/{lid}.wav").duration
    print(lid, who, f"{dur:.2f}s", "seed", seed, "miss", miss, "|", " ".join(x[0] for x in words), flush=True)
