"""Pied Piper voice post-steps after read-lines.py (Jonny's legend notes, 26 Nov 2026): grandmother (G) and kid (K)
7 % faster; kid brightened with ep 1's EQ (raw VoxCPM kid has almost nothing above 3 kHz) and 3 dB louder (-13 LUFS).
  engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/pied-piper/lines.json out/legend-pp/voice
  python3 storyboards/series/legend/pied-piper/post.py out/legend-pp/voice out/legend-pp/vo"""
import json, os, shutil, subprocess, sys
sys.path.insert(0, "qa"); import voicebright
RAW, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
lines = json.load(open("storyboards/series/legend/pied-piper/lines.json"))["lines"]
KID = "atempo=1.07,highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4,loudnorm=I=-13:TP=-1.5"
EXC = "aexciter=level_in=1:level_out=1:amount=2:drive=6:blend=0:freq=2000:ceil=12000,equalizer=f=5000:t=q:w=1:g=3,loudnorm=I=-13:TP=-1.5"
for i, who, *_ in lines:
    if who not in ("G", "K"):
        shutil.copy(f"{RAW}/{i}.wav", f"{OUT}/{i}.wav"); shutil.copy(f"{RAW}/{i}.words.json", f"{OUT}/{i}.words.json"); continue
    af = KID if who == "K" else "atempo=1.07,loudnorm=I=-16:TP=-2"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{RAW}/{i}.wav", "-af", af, "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True)
    w = json.load(open(f"{RAW}/{i}.words.json"))
    json.dump([[a, round(b / 1.07, 3), round(c / 1.07, 3)] for a, b, c in w], open(f"{OUT}/{i}.words.json", "w"))
    if who == "K":
        hi = voicebright.share(f"{OUT}/{i}.wav")
        if hi < voicebright.LIMIT:   # short kid takes come out of VoxCPM with nothing above ~2.5 kHz: EQ alone can't lift it
            tmp = f"{OUT}/{i}.tmp.wav"; os.replace(f"{OUT}/{i}.wav", tmp)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", EXC, "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True); os.remove(tmp)
        print(i, f"hi {hi:.2f}% -> {voicebright.share(f'{OUT}/{i}.wav'):.2f}%")
