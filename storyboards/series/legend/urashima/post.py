"""Urashima voice post-steps after read-lines.py (ep 1 rules, Jonny 26 Nov by ear): every take trimmed to its last word
+0.3 s (VoxCPM leaves tails), grandmother (G) and kid (K) 7 % faster, kid brightened with ep 1's EQ and 3 dB louder.
  python3 storyboards/series/legend/urashima/post.py out/legend-urashima/voice out/legend-urashima/vpost"""
import json, os, subprocess, sys
sys.path.insert(0, "qa"); import voicebright
RAW, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
lines = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "lines.json")))["lines"]
KID = "highpass=f=110,equalizer=f=650:t=q:w=1.2:g=-5,treble=g=12:f=2200,equalizer=f=5000:t=q:w=1:g=4,atempo=1.07,loudnorm=I=-13:TP=-1.5"
BRIGHT2 = "treble=g=8:f=3000,equalizer=f=4500:t=q:w=1:g=6,loudnorm=I=-13:TP=-1.5"
for i, who, *_ in lines:
    w = json.load(open(f"{RAW}/{i}.words.json")); end = w[-1][2] + 0.3
    k = 1.07 if who in ("G", "K") else 1.0
    af = KID if who == "K" else ("atempo=1.07,loudnorm=I=-16:TP=-2" if who == "G" else "anull")
    af += ",afade=t=out:st=%.3f:d=0.08" % max(0, end / k - 0.08)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-t", f"{end:.3f}", "-i", f"{RAW}/{i}.wav", "-af", af, "-ar", "44100", "-ac", "1", f"{OUT}/{i}.wav"], check=True)
    if who == "K" and (voicebright.share(f"{OUT}/{i}.wav") or 0) < 0.5:   # second brightening pass for dull takes
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/{i}.wav", "-af", BRIGHT2, "-ar", "44100", f"{OUT}/{i}.b.wav"], check=True)
        os.replace(f"{OUT}/{i}.b.wav", f"{OUT}/{i}.wav")
    json.dump([[a, round(b / k, 3), round(c / k, 3)] for a, b, c in w], open(f"{OUT}/{i}.words.json", "w"))
