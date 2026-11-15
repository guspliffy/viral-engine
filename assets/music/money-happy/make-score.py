# Builds money-happy-score.ogg from library takes (assets/music/ai, see its manifest), one take per scene.
# python3 assets/music/money-happy/make-score.py   (ffmpeg; deterministic)
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); AI = os.path.join(H, "..", "ai")
# (clip start s, take, take from s, length s, gain, fade in s, fade out s)
PARTS = [   # draft 2 (69.4 s, on the narrator's real line lengths)
    (0.00, "sad/sad-02.ogg", 0.0, 6.5, 1.0, 0.0, 0.5),                    # cold open: rich, sad, rain
    (6.20, "sad/sad-02.ogg", 6.5, 4.4, 0.9, 0.3, 0.4),                    # no money for a coffee
    (10.60, "elegant-reveal/elegant-reveal-02.ogg", 0.0, 7.1, 0.85, 0.3, 0.4),  # the rich couple, the plan
    (17.50, "orchestra-chase/orchestra-chase-01.ogg", 0.0, 6.45, 1.0, 0.05, 0.6),  # the hold-up and the escape
    (24.25, "hero-bed/hero-bed-01.ogg", 0.0, 4.45, 0.95, 0.05, 0.5),      # he got away; he buys everything
    (28.70, "orchestra-suspense/orchestra-suspense-01.ogg", 0.0, 11.08, 1.0, 0.1, 0.8),  # the siren, the hole, the locks, Chip
    (40.00, "sad/sad-02.ogg", 8.1, 3.9, 1.0, 0.3, 0.4),                   # 3:00, alone at the long table
    (43.80, "disaster/disaster-01.ogg", 0.0, 3.9, 0.9, 0.05, 0.4),        # the siren at the gate, he flees
    (47.70, "zombies-score/zombies-score-01.ogg", 0.0, 10.4, 0.8, 0.2, 0.8),  # the dry car, the climb, the ambulance
    (57.80, "drama-swell/drama-swell-01.ogg", 0.0, 10.0, 1.0, 0.4, 1.6),  # the clouds break, the money flies, the smile
    (66.60, "calm-landscape/calm-landscape-01.ogg", 0.0, 3.6, 0.7, 1.2, 0.0),   # the hold: it settles into calm
]
END = 70.2
ins, flt = [], []
for i, (at, f, ss, ln, g, fi, fo) in enumerate(PARTS):
    ins += ["-i", os.path.join(AI, f)]
    d = int(at * 1000)
    flt.append(f"[{i}:a]atrim={ss}:{ss+ln},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,"
               f"volume={g},afade=t=in:d={fi},afade=t=out:st={max(0,ln-fo)}:d={fo},adelay={d}|{d}[p{i}]")
mix = "".join(f"[p{i}]" for i in range(len(PARTS)))
flt.append(f"{mix}amix=inputs={len(PARTS)}:normalize=0,atrim=0:{END},afade=t=out:st={END-1.0}:d=1.0[out]")
out = os.path.join(H, "money-happy-score.ogg")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(flt), "-map", "[out]", "-c:a", "libvorbis", "-q:a", "6", out], check=True)
print(out)
