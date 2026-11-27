"""Monkey's Paw voice post-steps after read-lines.py (same ear notes as tools/svg2d/post-ep01.py, Jonny 26 Nov 2026):
grandmother (G) and kid (K) 7 % faster; kid brighter (EQ) and ~3 dB louder (-13 LUFS); GX = the grandmother's wrong
flat voice for "Keep it." (2 semitones down, slower, short dark room). Other voices are copied as they are.
  engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/monkeys-paw/lines.json out/legend-paw/voice-raw
  python3 storyboards/series/legend/monkeys-paw/post-voice.py out/legend-paw/voice-raw out/legend-paw/voice
"""
import json, os, shutil, subprocess, sys
RAW, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
lines = json.load(open("storyboards/series/legend/monkeys-paw/lines.json"))["lines"]
KID = "atempo=1.07,highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4,loudnorm=I=-13:TP=-1.5"
FX = {"K": (KID, 1.07), "G": ("atempo=1.07,loudnorm=I=-16:TP=-2", 1.07),
      "GX": ("rubberband=pitch=0.8909,atempo=0.92,lowpass=f=5000,aecho=0.8:0.6:38|71:0.25|0.15,loudnorm=I=-16:TP=-2", 0.92)}
for i, who, *_ in lines:
    if who not in FX:
        shutil.copy(f"{RAW}/{i}.wav", f"{OUT}/{i}.wav"); shutil.copy(f"{RAW}/{i}.words.json", f"{OUT}/{i}.words.json"); continue
    af, k = FX[who]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{RAW}/{i}.wav", "-af", af, "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True)
    json.dump([[a, round(b / k, 3), round(c / k, 3)] for a, b, c in json.load(open(f"{RAW}/{i}.words.json"))], open(f"{OUT}/{i}.words.json", "w"))
