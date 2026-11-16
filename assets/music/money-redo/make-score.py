# Builds money-redo-score.ogg from library takes (assets/music/ai, see its manifest), one take per scene.
# python3 assets/music/money-redo/make-score.py   (ffmpeg; deterministic)
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); AI = os.path.join(H, "..", "ai")
# (clip start s, take, take from s, length s, gain, fade in s, fade out s)
PARTS = [   # money redo, rough draft 2 ($1 billion in seven days, 54.6 s; Jonny 16 Nov)
    (0.00, "sneaky/sneaky-01.ogg", 0.0, 14.2, 0.9, 0.0, 0.4),                  # 01-05 the bet, the cart, the mountain: a sly game
    (14.00, "hero-bed/hero-bed-01.ogg", 0.0, 8.0, 0.95, 0.05, 0.4),            # 06-08 days 2-4: he buys big
    (22.10, "sad/sad-02.ogg", 0.0, 2.7, 0.95, 0.3, 0.35),                      # 09 day 5: Chip walks off
    (24.80, "hero-bed/hero-bed-02.ogg", 0.0, 4.2, 0.95, 0.05, 0.4),            # 11 day 6: the yacht, the jet
    (29.00, "sad/sad-02.ogg", 2.7, 2.3, 0.9, 0.2, 0.3),                        # 10 alone in the car
    (31.30, "orchestra-suspense/orchestra-suspense-01.ogg", 0.0, 5.9, 1.0, 0.1, 0.25),  # 12-13 day 7: the last hour, the race, Chip on the hill
    (37.20, "sad/sad-02.ogg", 6.5, 5.8, 0.85, 0.05, 0.5),                      # 14-16 the handbrake (the drop), the coat, the tow truck
    (43.00, "drama-swell/drama-swell-01.ogg", 0.0, 8.6, 1.0, 0.4, 1.2),        # 17-19 beside him, the sunset, the smile
    (50.40, "calm-landscape/calm-landscape-01.ogg", 0.0, 4.2, 0.7, 1.2, 0.0),  # 20 the last sliver, the follow line
]
END = 54.6
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
