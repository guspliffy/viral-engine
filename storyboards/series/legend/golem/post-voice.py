"""Golem voice post-steps after read-lines.py (same ear notes as monkeys-paw/post-voice.py, Jonny 26 Nov 2026):
grandmother (G) and kid (K) 7 % faster; kid brighter (EQ) and ~3 dB louder (-13 LUFS); a take still under the
qa/voicebright.py limit after that gets a gentle exciter (Pied Piper lesson: raw VoxCPM short kid takes stay muffled).
  engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/golem/lines.json out/legend-golem/voice
  python3 storyboards/series/legend/golem/post-voice.py out/legend-golem/voice out/legend-golem/vo
"""
import json, os, shutil, subprocess, sys
sys.path.insert(0, "qa"); import voicebright
RAW, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
lines = json.load(open("storyboards/series/legend/golem/lines.json"))["lines"]
KID = "atempo=1.07,highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4"
FX = {"K": (KID, 1.07, "-13"), "G": ("atempo=1.07", 1.07, "-16")}
for i, who, *_ in lines:
    if who not in FX:
        shutil.copy(f"{RAW}/{i}.wav", f"{OUT}/{i}.wav"); shutil.copy(f"{RAW}/{i}.words.json", f"{OUT}/{i}.words.json"); continue
    af, k, lufs = FX[who]
    for ex in ("", ",aexciter=amount=2:drive=6", ",treble=g=8:f=2500,aexciter=amount=3:drive=8"):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{RAW}/{i}.wav", "-af", f"{af}{ex},loudnorm=I={lufs}:TP=-1.5", "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True)
        if (voicebright.share(f"{OUT}/{i}.wav") or 0) >= voicebright.LIMIT: break
    json.dump([[a, round(b / k, 3), round(c / k, 3)] for a, b, c in json.load(open(f"{RAW}/{i}.words.json"))], open(f"{OUT}/{i}.words.json", "w"))
