# Builds money-redo-score.ogg from library takes (assets/music/ai, see its manifest), one take per scene.
# python3 assets/music/money-redo/make-score.py   (ffmpeg; deterministic)
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); AI = os.path.join(H, "..", "ai")
# (clip start s, take, take from s, length s, gain, fade in s, fade out s)
PARTS = [   # money redo, rough draft (50.6 s; NOTES.md score plan)
    (0.00, "sneaky/sneaky-01.ogg", 0.0, 14.2, 0.9, 0.0, 0.4),                  # 01-05 the bet, the cart, the mountain: a sly game
    (14.00, "hero-bed/hero-bed-01.ogg", 0.0, 6.8, 0.95, 0.05, 0.5),            # 06-08 he buys big
    (20.60, "sad/sad-02.ogg", 0.0, 4.6, 0.95, 0.3, 0.4),                       # 09-10 Chip walks off; alone in the car
    (25.00, "orchestra-suspense/orchestra-suspense-01.ogg", 0.0, 8.3, 1.0, 0.1, 0.25),  # 11-13 one minute, the race, Chip on the hill
    (33.20, "sad/sad-02.ogg", 6.5, 6.0, 0.85, 0.05, 0.5),                      # 14-16 the handbrake (the drop), the coat, the tow truck
    (39.00, "drama-swell/drama-swell-01.ogg", 0.0, 8.6, 1.0, 0.4, 1.2),        # 17-19 beside him, the sunset, the smile
    (46.40, "calm-landscape/calm-landscape-01.ogg", 0.0, 4.2, 0.7, 1.2, 0.0),  # 20 the last sliver, the follow line
]
END = 50.6
ins, flt = [], []
for i, (at, f, ss, ln, g, fi, fo) in enumerate(PARTS):
    ins += ["-i", os.path.join(AI, f)]
    d = int(at * 1000)
    flt.append(f"[{i}:a]atrim={ss}:{ss+ln},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,"
               f"volume={g},afade=t=in:d={fi},afade=t=out:st={max(0,ln-fo)}:d={fo},adelay={d}|{d}[p{i}]")
mix = "".join(f"[p{i}]" for i in range(len(PARTS)))
flt.append(f"{mix}amix=inputs={len(PARTS)}:normalize=0,atrim=0:{END},afade=t=out:st={END-1.0}:d=1.0[out]")
out = os.path.join(H, "money-redo-score.ogg")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(flt), "-map", "[out]", "-c:a", "libvorbis", "-q:a", "6", out], check=True)
print(out)
