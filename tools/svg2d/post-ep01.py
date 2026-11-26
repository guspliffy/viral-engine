"""Legend ep 01 voice post-steps after read-lines.py (Jonny 26 Nov 2026 by ear):
grandmother (G) and kid (K) 7 % faster; kid brighter (his voice lacked everything above 2 kHz: "like spoken through
a mask"), brightness version B; L02 loses its first word "Why?" (Sol round 1 edit).
  engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/ep01/lines.json out/legend-ep01/raw
  python3 tools/svg2d/post-ep01.py out/legend-ep01/raw out/legend-ep01/voice      (copies N/W lines as they are)
"""
import json, shutil, subprocess, sys
RAW, OUT = sys.argv[1], sys.argv[2]
lines = json.load(open("storyboards/series/legend/ep01/lines.json"))["lines"]
KID = "atempo=1.07,highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4,loudnorm=I=-13:TP=-1.5"
for i, who, *_ in lines:
    if who not in ("G", "K"):
        shutil.copy(f"{RAW}/{i}.wav", f"{OUT}/{i}.wav"); shutil.copy(f"{RAW}/{i}.words.json", f"{OUT}/{i}.words.json"); continue
    w = json.load(open(f"{RAW}/{i}.words.json")); cut = 0
    if i == "L02": cut = (w[0][2] + w[1][1]) / 2; w = w[1:]
    af = KID if who == "K" else "atempo=1.07,loudnorm=I=-16:TP=-2"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{cut:.3f}", "-i", f"{RAW}/{i}.wav", "-af", af, "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True)
    json.dump([[a, round((b - cut) / 1.07, 3), round((c - cut) / 1.07, 3)] for a, b, c in w], open(f"{OUT}/{i}.words.json", "w"))
